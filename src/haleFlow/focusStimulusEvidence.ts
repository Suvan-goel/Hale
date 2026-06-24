import type {
  MovementBlock,
  MovementDomain,
  TrainingPrimaryDomain,
  TrainingFocusStimulusCompletionStatus,
  TrainingFocusStimulusCreditExclusionReason,
  TrainingFocusStimulusEvidenceSummary,
  TrainingFocusStimulusPlanStatus,
} from '../adherence';
import {
  isTrainingPrimaryDomain,
  movementBlockDomainFocus,
  movementDomainToTrainingPrimaryDomain,
} from '../adherence';
import { hasExercise } from '../exercises';
import type { TrainingSessionResult } from '../training';
import type { SlotStimulusReason, SlotStimulusRole, TrainingDomain } from '../training/workoutGeneration';

import { classifyMainPlanSessionPlan } from './mainPlanEvents';
import { plannedPrimaryDomainForBlockSession } from './blockTrainingPlan';
import {
  completedExerciseIdsFromEvidence,
  evaluateSessionWorkEvidence,
  type SessionWorkEvidence,
} from './sessionWorkEvidence';
import type {
  HaleFocusStimulusPlanMetadata,
  HaleGeneratedExerciseMetadata,
  HaleSessionPlan,
  HaleSlotStimulusMetadata,
} from './types';

export interface PlannedFocusStimulusEvidence {
  status: TrainingFocusStimulusPlanStatus;
  mainPlanCreditPotential: boolean;
  blockFocusDomain?: MovementDomain;
  blockFocusTrainingDomain?: TrainingDomain;
  plannedPrimaryDomain?: TrainingPrimaryDomain;
  plannedExerciseCount: number;
  plannedPrimaryFocusExerciseIds: string[];
  plannedSupportingExerciseIds: string[];
  plannedFallbackExerciseIds: string[];
  plannedCrossDomainExerciseIds: string[];
  fallbackFocusSlotIds: string[];
  skippedFocusSlotIds: string[];
  focusStimulusExclusionReasons: SlotStimulusReason[];
  missingMetadataExerciseIds: string[];
  malformedMetadataExerciseIds: string[];
  focusMismatchExerciseIds: string[];
  mainPlanClassifierReason?: string;
}

export interface CompletedFocusStimulusEvidence extends TrainingFocusStimulusEvidenceSummary {
  planned: PlannedFocusStimulusEvidence;
  workEvidence: SessionWorkEvidence;
}

type ValidGeneratedExerciseMetadata = HaleGeneratedExerciseMetadata & {
  exerciseId: string;
  intendedDomain: TrainingDomain;
  stimulusRole: SlotStimulusRole;
};

const EMPTY_PLANNED: Omit<
  PlannedFocusStimulusEvidence,
  | 'status'
  | 'mainPlanCreditPotential'
  | 'blockFocusDomain'
  | 'blockFocusTrainingDomain'
  | 'plannedPrimaryDomain'
  | 'plannedExerciseCount'
  | 'mainPlanClassifierReason'
> = {
  plannedPrimaryFocusExerciseIds: [],
  plannedSupportingExerciseIds: [],
  plannedFallbackExerciseIds: [],
  plannedCrossDomainExerciseIds: [],
  fallbackFocusSlotIds: [],
  skippedFocusSlotIds: [],
  focusStimulusExclusionReasons: [],
  missingMetadataExerciseIds: [],
  malformedMetadataExerciseIds: [],
  focusMismatchExerciseIds: [],
};

export function evaluatePlannedFocusStimulus(
  sessionPlan: HaleSessionPlan | null | undefined,
  activeBlock?: MovementBlock | null
): PlannedFocusStimulusEvidence {
  const plannedExerciseCount = sessionPlan?.exercises.length ?? 0;
  const classifier = classifyMainPlanSessionPlan(sessionPlan, activeBlock);
  if (!sessionPlan || !classifier.credited) {
    const mainPlanClassifierReason = classifier.credited ? undefined : classifier.reason;
    return plannedEvidence({
      status: 'not_main_plan',
      plannedExerciseCount,
      mainPlanClassifierReason,
    });
  }

  const blockFocusDomain = activeBlock
    ? movementBlockDomainFocus(activeBlock) ?? undefined
    : sessionPlan.focusDomain;
  const plannedPrimaryDomain =
    sessionPlan.metadata?.plannedPrimaryDomain ??
    (activeBlock
      ? plannedPrimaryDomainForBlockSession(activeBlock, sessionPlan.metadata?.templateId)
      : movementDomainToTrainingPrimaryDomain(sessionPlan.focusDomain));
  if (!isTrainingPrimaryDomain(plannedPrimaryDomain)) {
    return plannedEvidence({ status: 'missing_block_focus', plannedExerciseCount });
  }

  const blockFocusTrainingDomain = plannedPrimaryDomain;
  const generatedExercises = sessionPlan.metadata?.generatedExercises;
  if (!generatedExercises || generatedExercises.length === 0) {
    return plannedEvidence({
      status: 'missing_stimulus_metadata',
      blockFocusDomain,
      blockFocusTrainingDomain,
      plannedPrimaryDomain,
      plannedExerciseCount,
    });
  }

  const metadataByExerciseId = generatedExerciseMetadataById(generatedExercises);
  const duplicateMetadataIds = duplicateGeneratedExerciseIds(generatedExercises);
  const plannedIds = sessionPlan.exercises.map((exercise) => exercise.id).filter(nonEmptyString);
  const plannedPrimaryFocusExerciseIds: string[] = [];
  const plannedSupportingExerciseIds: string[] = [];
  const plannedFallbackExerciseIds: string[] = [];
  const plannedCrossDomainExerciseIds: string[] = [];
  const missingMetadataExerciseIds: string[] = [];
  const malformedMetadataExerciseIds: string[] = [];
  const focusMismatchExerciseIds: string[] = [];

  for (const exerciseId of plannedIds) {
    if (!hasExercise(exerciseId)) {
      malformedMetadataExerciseIds.push(exerciseId);
      continue;
    }
    const metadata = metadataByExerciseId.get(exerciseId);
    if (!metadata) {
      missingMetadataExerciseIds.push(exerciseId);
      continue;
    }
    if (duplicateMetadataIds.has(exerciseId) || !isValidGeneratedExerciseMetadata(metadata)) {
      malformedMetadataExerciseIds.push(exerciseId);
      continue;
    }

    if (metadata.intendedDomain !== plannedPrimaryDomain) {
      plannedCrossDomainExerciseIds.push(exerciseId);
    }

    if (metadata.stimulusRole === 'primary') {
      if (metadata.intendedDomain === plannedPrimaryDomain) {
        plannedPrimaryFocusExerciseIds.push(exerciseId);
      } else {
        focusMismatchExerciseIds.push(exerciseId);
      }
    } else if (metadata.stimulusRole === 'supporting') {
      plannedSupportingExerciseIds.push(exerciseId);
    } else if (metadata.stimulusRole === 'fallback') {
      plannedFallbackExerciseIds.push(exerciseId);
    } else {
      malformedMetadataExerciseIds.push(exerciseId);
    }
  }

  const focusSlotExclusions = focusSlotExclusionMetadata(sessionPlan.metadata?.slotStimulus, plannedPrimaryDomain);
  const fallbackFocusSlotIds = focusSlotExclusions
    .filter((slot) => slot.role === 'fallback')
    .map((slot) => slot.slotId);
  const skippedFocusSlotIds = focusSlotExclusions
    .filter((slot) => slot.role === 'skipped' || slot.role === 'invalid')
    .map((slot) => slot.slotId);
  const focusStimulusExclusionReasons = focusSlotExclusions.map((slot) => slot.reason);
  let status: TrainingFocusStimulusPlanStatus = 'eligible';
  if (plannedPrimaryFocusExerciseIds.length > 0) {
    status = 'eligible';
  } else if (focusMismatchExerciseIds.length > 0) {
    status = 'focus_mismatch';
  } else if (
    missingMetadataExerciseIds.length > 0 ||
    malformedMetadataExerciseIds.length > 0 ||
    plannedIds.length === 0
  ) {
    status = 'missing_stimulus_metadata';
  } else {
    status = 'no_primary_focus_planned';
  }

  return {
    status,
    mainPlanCreditPotential: status === 'eligible',
    blockFocusDomain,
    blockFocusTrainingDomain,
    plannedPrimaryDomain,
    plannedExerciseCount,
    plannedPrimaryFocusExerciseIds: uniqueSorted(plannedPrimaryFocusExerciseIds),
    plannedSupportingExerciseIds: uniqueSorted(plannedSupportingExerciseIds),
    plannedFallbackExerciseIds: uniqueSorted(plannedFallbackExerciseIds),
    plannedCrossDomainExerciseIds: uniqueSorted(plannedCrossDomainExerciseIds),
    fallbackFocusSlotIds: uniqueSorted(fallbackFocusSlotIds),
    skippedFocusSlotIds: uniqueSorted(skippedFocusSlotIds),
    focusStimulusExclusionReasons: uniqueReasons(focusStimulusExclusionReasons),
    missingMetadataExerciseIds: uniqueSorted(missingMetadataExerciseIds),
    malformedMetadataExerciseIds: uniqueSorted(malformedMetadataExerciseIds),
    focusMismatchExerciseIds: uniqueSorted(focusMismatchExerciseIds),
  };
}

export function evaluateCompletedFocusStimulusEvidence({
  sessionPlan,
  result,
  activeBlock,
  workEvidence,
}: {
  sessionPlan: HaleSessionPlan | null | undefined;
  result: TrainingSessionResult | null | undefined;
  activeBlock?: MovementBlock | null;
  workEvidence?: SessionWorkEvidence;
}): CompletedFocusStimulusEvidence {
  const planned = evaluatePlannedFocusStimulus(sessionPlan, activeBlock);
  const evidence = workEvidence ?? evaluateSessionWorkEvidence(sessionPlan, result);
  const completedIds = completedExerciseIdsFromEvidence(evidence);
  const metadataByExerciseId = generatedExerciseMetadataById(sessionPlan?.metadata?.generatedExercises ?? []);
  const focusTrainingDomain = planned.blockFocusTrainingDomain;
  const completedPrimaryFocusExerciseIds = planned.plannedPrimaryFocusExerciseIds.filter((id) => completedIds.has(id));
  const completedSupportingExerciseIds = planned.plannedSupportingExerciseIds.filter((id) => completedIds.has(id));
  const completedFallbackExerciseIds = planned.plannedFallbackExerciseIds.filter((id) => completedIds.has(id));
  const completedCrossDomainExerciseIds = Array.from(completedIds).filter((id) => {
    const metadata = metadataByExerciseId.get(id);
    return isValidGeneratedExerciseMetadata(metadata) && !!focusTrainingDomain && metadata.intendedDomain !== focusTrainingDomain;
  });

  if (!planned.mainPlanCreditPotential) {
    return completedEvidence({
      planned,
      workEvidence: evidence,
      status: statusFromPlannedStatus(planned.status),
      exclusionReason: exclusionReasonFromPlannedStatus(planned.status),
      completedPrimaryFocusExerciseIds,
      completedSupportingExerciseIds,
      completedFallbackExerciseIds,
      completedCrossDomainExerciseIds,
    });
  }

  if (!evidence.hasCompletedPlannedExercise) {
    return completedEvidence({
      planned,
      workEvidence: evidence,
      status: 'no_completed_work',
      exclusionReason: 'no_completed_work',
      completedPrimaryFocusExerciseIds,
      completedSupportingExerciseIds,
      completedFallbackExerciseIds,
      completedCrossDomainExerciseIds,
    });
  }

  if (completedPrimaryFocusExerciseIds.length > 0) {
    return completedEvidence({
      planned,
      workEvidence: evidence,
      status: 'credited_focus_work',
      exclusionReason: 'none',
      completedPrimaryFocusExerciseIds,
      completedSupportingExerciseIds,
      completedFallbackExerciseIds,
      completedCrossDomainExerciseIds,
    });
  }

  return completedEvidence({
    planned,
    workEvidence: evidence,
    status: 'primary_focus_not_completed',
    exclusionReason: completedNonPrimaryReason({
      supporting: completedSupportingExerciseIds.length,
      fallback: completedFallbackExerciseIds.length,
      crossDomain: completedCrossDomainExerciseIds.length,
    }),
    completedPrimaryFocusExerciseIds,
    completedSupportingExerciseIds,
    completedFallbackExerciseIds,
    completedCrossDomainExerciseIds,
  });
}

export function focusStimulusPlanMetadata(
  evidence: PlannedFocusStimulusEvidence
): HaleFocusStimulusPlanMetadata {
  return {
    status: evidence.status,
    mainPlanCreditPotential: evidence.mainPlanCreditPotential,
    blockFocusDomain: evidence.blockFocusDomain,
    blockFocusTrainingDomain: evidence.blockFocusTrainingDomain,
    plannedPrimaryDomain: evidence.plannedPrimaryDomain,
    plannedPrimaryFocusExerciseIds: evidence.plannedPrimaryFocusExerciseIds,
    plannedSupportingExerciseIds: evidence.plannedSupportingExerciseIds,
    plannedFallbackExerciseIds: evidence.plannedFallbackExerciseIds,
    plannedCrossDomainExerciseIds: evidence.plannedCrossDomainExerciseIds,
    fallbackFocusSlotIds: evidence.fallbackFocusSlotIds,
    skippedFocusSlotIds: evidence.skippedFocusSlotIds,
    focusStimulusExclusionReasons: evidence.focusStimulusExclusionReasons,
    missingMetadataExerciseIds: evidence.missingMetadataExerciseIds,
    malformedMetadataExerciseIds: evidence.malformedMetadataExerciseIds,
    focusMismatchExerciseIds: evidence.focusMismatchExerciseIds,
    mainPlanClassifierReason: evidence.mainPlanClassifierReason,
  };
}

export function focusStimulusEvidenceSummary(
  evidence: CompletedFocusStimulusEvidence
): TrainingFocusStimulusEvidenceSummary {
  return {
    planStatus: evidence.planStatus,
    status: evidence.status,
    exclusionReason: evidence.exclusionReason,
    mainPlanCredit: evidence.mainPlanCredit,
    blockFocusDomain: evidence.blockFocusDomain,
    plannedPrimaryDomain: evidence.plannedPrimaryDomain,
    plannedPrimaryFocusExerciseCount: evidence.plannedPrimaryFocusExerciseCount,
    completedPrimaryFocusExerciseCount: evidence.completedPrimaryFocusExerciseCount,
    completedSupportingExerciseCount: evidence.completedSupportingExerciseCount,
    completedFallbackExerciseCount: evidence.completedFallbackExerciseCount,
    completedCrossDomainExerciseCount: evidence.completedCrossDomainExerciseCount,
    plannedPrimaryFocusExerciseIds: evidence.plannedPrimaryFocusExerciseIds,
    completedPrimaryFocusExerciseIds: evidence.completedPrimaryFocusExerciseIds,
    completedSupportingExerciseIds: evidence.completedSupportingExerciseIds,
    completedFallbackExerciseIds: evidence.completedFallbackExerciseIds,
    completedCrossDomainExerciseIds: evidence.completedCrossDomainExerciseIds,
    fallbackFocusSlotIds: evidence.fallbackFocusSlotIds,
    skippedFocusSlotIds: evidence.skippedFocusSlotIds,
    focusStimulusExclusionReasons: evidence.focusStimulusExclusionReasons,
    missingMetadataExerciseIds: evidence.missingMetadataExerciseIds,
    malformedMetadataExerciseIds: evidence.malformedMetadataExerciseIds,
    focusMismatchExerciseIds: evidence.focusMismatchExerciseIds,
    mainPlanClassifierReason: evidence.mainPlanClassifierReason,
  };
}

function plannedEvidence({
  status,
  blockFocusDomain,
  blockFocusTrainingDomain,
  plannedPrimaryDomain,
  plannedExerciseCount,
  mainPlanClassifierReason,
}: {
  status: TrainingFocusStimulusPlanStatus;
  blockFocusDomain?: MovementDomain;
  blockFocusTrainingDomain?: TrainingDomain;
  plannedPrimaryDomain?: TrainingPrimaryDomain;
  plannedExerciseCount: number;
  mainPlanClassifierReason?: string;
}): PlannedFocusStimulusEvidence {
  return {
    status,
    mainPlanCreditPotential: false,
    blockFocusDomain,
    blockFocusTrainingDomain,
    plannedPrimaryDomain,
    plannedExerciseCount,
    ...EMPTY_PLANNED,
    mainPlanClassifierReason,
  };
}

function completedEvidence({
  planned,
  workEvidence,
  status,
  exclusionReason,
  completedPrimaryFocusExerciseIds,
  completedSupportingExerciseIds,
  completedFallbackExerciseIds,
  completedCrossDomainExerciseIds,
}: {
  planned: PlannedFocusStimulusEvidence;
  workEvidence: SessionWorkEvidence;
  status: TrainingFocusStimulusCompletionStatus;
  exclusionReason: TrainingFocusStimulusCreditExclusionReason;
  completedPrimaryFocusExerciseIds: string[];
  completedSupportingExerciseIds: string[];
  completedFallbackExerciseIds: string[];
  completedCrossDomainExerciseIds: string[];
}): CompletedFocusStimulusEvidence {
  return {
    planned,
    workEvidence,
    planStatus: planned.status,
    status,
    exclusionReason,
    mainPlanCredit: status === 'credited_focus_work',
    blockFocusDomain: planned.blockFocusDomain,
    plannedPrimaryDomain: planned.plannedPrimaryDomain,
    plannedPrimaryFocusExerciseCount: planned.plannedPrimaryFocusExerciseIds.length,
    completedPrimaryFocusExerciseCount: completedPrimaryFocusExerciseIds.length,
    completedSupportingExerciseCount: completedSupportingExerciseIds.length,
    completedFallbackExerciseCount: completedFallbackExerciseIds.length,
    completedCrossDomainExerciseCount: completedCrossDomainExerciseIds.length,
    plannedPrimaryFocusExerciseIds: planned.plannedPrimaryFocusExerciseIds,
    completedPrimaryFocusExerciseIds: uniqueSorted(completedPrimaryFocusExerciseIds),
    completedSupportingExerciseIds: uniqueSorted(completedSupportingExerciseIds),
    completedFallbackExerciseIds: uniqueSorted(completedFallbackExerciseIds),
    completedCrossDomainExerciseIds: uniqueSorted(completedCrossDomainExerciseIds),
    fallbackFocusSlotIds: planned.fallbackFocusSlotIds,
    skippedFocusSlotIds: planned.skippedFocusSlotIds,
    focusStimulusExclusionReasons: planned.focusStimulusExclusionReasons,
    missingMetadataExerciseIds: planned.missingMetadataExerciseIds,
    malformedMetadataExerciseIds: planned.malformedMetadataExerciseIds,
    focusMismatchExerciseIds: planned.focusMismatchExerciseIds,
    mainPlanClassifierReason: planned.mainPlanClassifierReason,
  };
}

function statusFromPlannedStatus(status: TrainingFocusStimulusPlanStatus): TrainingFocusStimulusCompletionStatus {
  if (status === 'eligible') return 'primary_focus_not_completed';
  return status;
}

function exclusionReasonFromPlannedStatus(
  status: TrainingFocusStimulusPlanStatus
): TrainingFocusStimulusCreditExclusionReason {
  if (status === 'eligible') return 'primary_focus_not_completed';
  return status;
}

function completedNonPrimaryReason({
  supporting,
  fallback,
  crossDomain,
}: {
  supporting: number;
  fallback: number;
  crossDomain: number;
}): TrainingFocusStimulusCreditExclusionReason {
  if (supporting > 0 && fallback > 0) return 'supporting_and_fallback_only';
  if (supporting > 0) return 'supporting_only';
  if (fallback > 0) return 'fallback_only';
  if (crossDomain > 0) return 'cross_domain_only';
  return 'primary_focus_not_completed';
}

function generatedExerciseMetadataById(
  generatedExercises: readonly HaleGeneratedExerciseMetadata[]
): Map<string, HaleGeneratedExerciseMetadata> {
  const out = new Map<string, HaleGeneratedExerciseMetadata>();
  for (const metadata of generatedExercises) {
    if (nonEmptyString(metadata.exerciseId) && !out.has(metadata.exerciseId)) {
      out.set(metadata.exerciseId, metadata);
    }
  }
  return out;
}

function duplicateGeneratedExerciseIds(
  generatedExercises: readonly HaleGeneratedExerciseMetadata[]
): Set<string> {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const metadata of generatedExercises) {
    if (!nonEmptyString(metadata.exerciseId)) continue;
    if (seen.has(metadata.exerciseId)) duplicates.add(metadata.exerciseId);
    seen.add(metadata.exerciseId);
  }
  return duplicates;
}

function focusSlotExclusionMetadata(
  slotStimulus: readonly HaleSlotStimulusMetadata[] | undefined,
  focusDomain: TrainingDomain
): HaleSlotStimulusMetadata[] {
  if (!slotStimulus) return [];
  return slotStimulus
    .filter((slot) => slot.intendedDomain === focusDomain && (slot.role === 'fallback' || slot.role === 'skipped' || slot.role === 'invalid'))
    .filter((slot) => nonEmptyString(slot.slotId));
}

function isValidGeneratedExerciseMetadata(
  metadata: HaleGeneratedExerciseMetadata | undefined
): metadata is ValidGeneratedExerciseMetadata {
  return (
    !!metadata &&
    nonEmptyString(metadata.exerciseId) &&
    hasExercise(metadata.exerciseId) &&
    isTrainingDomain(metadata.intendedDomain) &&
    isStimulusRole(metadata.stimulusRole)
  );
}

function isTrainingDomain(value: unknown): value is TrainingDomain {
  return value === 'strength_power' || value === 'balance_stability' || value === 'mobility_flexibility';
}

function isStimulusRole(value: unknown): value is SlotStimulusRole {
  return value === 'primary' || value === 'supporting' || value === 'fallback' || value === 'skipped' || value === 'invalid';
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

function uniqueReasons(values: readonly SlotStimulusReason[]): SlotStimulusReason[] {
  return [...new Set(values)].sort() as SlotStimulusReason[];
}
