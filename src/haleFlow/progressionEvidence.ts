import type {
  MovementBlock,
  TrainingSessionCompletion,
  TrainingSessionCompletionType,
} from '../adherence';
import {
  getExercise,
  getExerciseLadder,
  hasExercise,
  highestAvailableLevelForRelease,
  type ExerciseLevel,
} from '../exercises';
import {
  appendAppliedProgressionEventId,
  normalizeAppliedProgressionEventIds,
} from '../training/dynamicState';
import type { ProgressionEvidencePolicy } from '../training/dailyTrainingContext';
import type { TrainingSessionResult, TrainingItemResult } from '../training/sessionPlayer';
import {
  updateLadderProgressAfterSession,
  type CompletedExerciseResult,
  type LadderProgress,
  type PainArea,
  type PostSessionFeedback,
  type SlotStimulusRole,
  type TrackingQuality,
} from '../training/workoutGeneration';
import {
  summarizeValidTimeItem,
  type ValidTimeProgressionSignal,
  type ValidTimeProgressionSummary,
} from '../training/validTimeProgression';

import {
  classifyMainPlanCompletion,
  classifyMainPlanSessionPlan,
  type MainPlanCreditRejectionReason,
} from './mainPlanEvents';
import {
  evaluateSessionWorkEvidence,
  type SessionWorkEvidence,
} from './sessionWorkEvidence';
import type {
  HaleGeneratedExerciseMetadata,
  HaleSessionPlan,
} from './types';

export type SupportedMainPlanProgressionSessionType = Extract<
  TrainingSessionCompletionType,
  'starter' | 'standard' | 'restart'
>;

export type ProgressionExclusionReason =
  | 'non_credit_session'
  | 'non_main_plan'
  | 'extra_session'
  | 'manual_practice'
  | 'micro_check'
  | 'official_retest'
  | 'legacy_session'
  | 'wrong_block'
  | 'missing_completion_id'
  | 'missing_focus_credit'
  | 'zero_work'
  | 'duplicate_completion'
  | 'malformed_completion'
  | 'source_mismatch'
  | 'unknown_source'
  | 'missing_feedback'
  | 'progression_policy_ineligible'
  | 'schedule_denied';

export type ExerciseProgressionExclusionReason =
  | 'missing_result'
  | 'skipped_result'
  | 'malformed_result'
  | 'duplicate_result'
  | 'unmatched_result'
  | 'invalid_exercise_id'
  | 'missing_ladder_id'
  | 'invalid_ladder_id'
  | 'exercise_ladder_mismatch'
  | 'missing_level_id'
  | 'selected_level_mismatch'
  | 'missing_stimulus_role'
  | 'invalid_stimulus_role'
  | 'fallback_role'
  | 'skipped_role'
  | 'missing_feedback';

export type ProgressionDiagnosticReason =
  | ProgressionExclusionReason
  | ExerciseProgressionExclusionReason
  | 'conflicting_ladder_levels'
  | 'duplicate_progression_event'
  | 'progression_held_by_policy'
  | 'release_cap_reached'
  | 'progression_applied'
  | 'progression_application_failed';

export type ProgressionDecisionKind = 'progressed' | 'regressed' | 'held' | 'initialized';

export type ProgressionEvidenceEligibility =
  | {
      eligible: true;
      completionId: string;
      blockId: string;
      templateId: string;
      plannedDateKey?: string;
      sessionType: SupportedMainPlanProgressionSessionType;
      progressionEvidencePolicy: Exclude<ProgressionEvidencePolicy, 'ineligible'>;
    }
  | {
      eligible: false;
      reason: ProgressionExclusionReason;
    };

export interface AuthoritativeLadderProgressState {
  ladderProgressById: Record<string, LadderProgress>;
  appliedProgressionEventIds: readonly string[];
}

export interface ExerciseProgressionEvidence {
  progressionEventId?: string;
  completionId: string;
  blockId: string;
  templateId: string;
  plannedDateKey?: string;
  ladderId?: string;
  exerciseId: string;
  levelId?: string;
  levelIndex?: number;
  stimulusRole?: SlotStimulusRole;
  completionRate: number;
  perceivedEffort: 1 | 2 | 3 | 4 | 5 | null;
  pain: boolean;
  painAreas: readonly PainArea[];
  trackingQuality: TrackingQuality;
  validTime?: ValidTimeProgressionSummary;
  eligible: boolean;
  exclusionReason?: ExerciseProgressionExclusionReason;
}

export interface LadderProgressionEvidenceEvent {
  progressionEventId: string;
  completionId: string;
  blockId: string;
  templateId: string;
  plannedDateKey?: string;
  ladderId: string;
  levelId: string;
  completedAt: string;
  sourceExerciseIds: readonly string[];
  result: CompletedExerciseResult;
  feedback: PostSessionFeedback;
}

export interface ProgressionEvidenceDiagnostic {
  reason: ProgressionDiagnosticReason;
  completionId?: string;
  progressionEventId?: string;
  blockId?: string;
  templateId?: string;
  ladderId?: string;
  exerciseId?: string;
  sessionType?: TrainingSessionCompletionType;
  source?: string;
  stimulusRole?: SlotStimulusRole;
  decisionKind?: ProgressionDecisionKind;
  progressionEvidencePolicy?: ProgressionEvidencePolicy;
  beforeLevelId?: string;
  afterLevelId?: string;
}

export interface ProgressionApplicationDecision {
  progressionEventId: string;
  ladderId: string;
  decisionKind: ProgressionDecisionKind;
  beforeLevelId?: string;
  afterLevelId?: string;
}

export interface ProgressionEvidenceApplicationResult {
  nextState: AuthoritativeLadderProgressState;
  appliedEvents: LadderProgressionEvidenceEvent[];
  skippedDuplicateEvents: LadderProgressionEvidenceEvent[];
  decisions: ProgressionApplicationDecision[];
  diagnostics: ProgressionEvidenceDiagnostic[];
}

export interface ApplyProgressionEvidenceFromSessionResult extends ProgressionEvidenceApplicationResult {
  eligibility: ProgressionEvidenceEligibility;
  exerciseEvidence: ExerciseProgressionEvidence[];
  evidenceEvents: LadderProgressionEvidenceEvent[];
}

export function progressionEventIdFor(input: {
  completionId: string;
  blockId: string;
  templateId: string;
  ladderId: string;
}): string {
  return [
    'progression',
    input.completionId,
    input.blockId,
    input.templateId,
    input.ladderId,
  ].map(eventPart).join(':');
}

export function classifyProgressionEvidenceEligibility(input: {
  sessionPlan: HaleSessionPlan | null | undefined;
  completion: TrainingSessionCompletion | null | undefined;
  activeBlock?: MovementBlock | null;
  workEvidence?: SessionWorkEvidence;
}): ProgressionEvidenceEligibility {
  const { sessionPlan, completion } = input;
  if (!sessionPlan) return { eligible: false, reason: 'non_main_plan' };
  if (!completion || typeof completion !== 'object') return { eligible: false, reason: 'malformed_completion' };
  if (!nonEmptyString(completion.id)) return { eligible: false, reason: 'missing_completion_id' };

  const planClassification = classifyMainPlanSessionPlan(sessionPlan, input.activeBlock);
  if (!planClassification.credited) {
    return { eligible: false, reason: progressionReasonFromPlan(sessionPlan, planClassification.reason) };
  }

  const block = input.activeBlock ?? blockFromPlan(sessionPlan);
  const completionClassification = classifyMainPlanCompletion(block, completion);
  if (!completionClassification.credited) {
    return {
      eligible: false,
      reason: progressionReasonFromCompletion(completion, completionClassification.reason),
    };
  }

  const planTemplateId = sessionPlan.metadata?.templateId;
  const completionTemplateId = completion.templateId;
  if (planTemplateId && completionTemplateId && planTemplateId !== completionTemplateId) {
    return { eligible: false, reason: 'source_mismatch' };
  }

  const planDateKey = sessionPlan.metadata?.plannedDateKey;
  if (planDateKey && completion.plannedDate && planDateKey !== completion.plannedDate) {
    return { eligible: false, reason: 'source_mismatch' };
  }
  if (completion.scheduleCredit?.credited !== true) {
    return { eligible: false, reason: 'schedule_denied' };
  }

  const progressionEvidencePolicy = sessionPlan.metadata?.progressionEvidencePolicy ?? 'ineligible';
  if (progressionEvidencePolicy === 'ineligible') {
    return { eligible: false, reason: 'progression_policy_ineligible' };
  }

  const workEvidence = input.workEvidence;
  if (workEvidence && !workEvidence.hasCompletedPlannedExercise) {
    return { eligible: false, reason: 'zero_work' };
  }

  return {
    eligible: true,
    completionId: completion.id,
    blockId: completionClassification.event.blockId,
    templateId: completionClassification.event.templateId,
    plannedDateKey: completionClassification.event.plannedDateKey,
    sessionType: completion.sessionType as SupportedMainPlanProgressionSessionType,
    progressionEvidencePolicy,
  };
}

export function buildExerciseProgressionEvidence(input: {
  eligibility: Extract<ProgressionEvidenceEligibility, { eligible: true }>;
  sessionPlan: HaleSessionPlan;
  sessionResult: TrainingSessionResult | null | undefined;
  feedback: PostSessionFeedback;
  completedAt: string;
  completedOverride?: boolean;
  workEvidence?: SessionWorkEvidence;
}): ExerciseProgressionEvidence[] {
  const workEvidence = input.workEvidence ?? evaluateSessionWorkEvidence(input.sessionPlan, input.sessionResult);
  const itemsByExerciseId = resultItemsByExerciseId(input.sessionResult);
  const metadata = input.sessionPlan.metadata?.generatedExercises ?? [];
  const metadataByExerciseId = generatedExerciseMetadataById(metadata);
  const duplicateMetadata = duplicateGeneratedExerciseIds(metadata);
  const planExercises = input.sessionPlan.exercises;
  const feedbackAvailable = hasRequiredProgressionFeedback(input.feedback);
  const out: ExerciseProgressionEvidence[] = [];

  for (const planned of planExercises) {
    const exerciseId = planned.id;
    const base = exerciseEvidenceBase(input, exerciseId);
    const plannedMetadata = metadataByExerciseId.get(exerciseId);
    const items = itemsByExerciseId.get(exerciseId) ?? [];
    const singleItem = items.length === 1 ? items[0] : null;

    if (!feedbackAvailable) {
      out.push({ ...base, eligible: false, exclusionReason: 'missing_feedback' });
      continue;
    }
    if (input.completedOverride === false) {
      out.push({ ...base, eligible: false, exclusionReason: 'missing_result' });
      continue;
    }
    if (workEvidence.duplicateExerciseIds.includes(exerciseId) || items.length > 1) {
      out.push({ ...base, eligible: false, exclusionReason: 'duplicate_result' });
      continue;
    }
    if (!singleItem) {
      out.push({ ...base, eligible: false, exclusionReason: 'missing_result' });
      continue;
    }
    if (!isValidTrainingResultItem(singleItem)) {
      out.push({ ...base, eligible: false, exclusionReason: 'malformed_result' });
      continue;
    }
    if (singleItem.status === 'skipped') {
      out.push({ ...base, eligible: false, exclusionReason: 'skipped_result' });
      continue;
    }
    if (!plannedMetadata || duplicateMetadata.has(exerciseId)) {
      out.push({ ...base, eligible: false, exclusionReason: 'invalid_exercise_id' });
      continue;
    }

    const classified = classifyGeneratedExerciseMetadata({
      metadata: plannedMetadata,
      plannedLadderId: planned.ladderId,
    });
    if (!classified.eligible) {
      out.push({
        ...base,
        ladderId: plannedMetadata.ladderId,
        levelId: plannedMetadata.levelId,
        stimulusRole: plannedMetadata.stimulusRole,
        eligible: false,
        exclusionReason: classified.reason,
      });
      continue;
    }

    const validTime = summarizeValidTimeItem(singleItem);
    out.push({
      ...base,
      progressionEventId: progressionEventIdFor({
        completionId: input.eligibility.completionId,
        blockId: input.eligibility.blockId,
        templateId: input.eligibility.templateId,
        ladderId: classified.ladderId,
      }),
      ladderId: classified.ladderId,
      levelId: classified.level.id,
      levelIndex: classified.levelIndex,
      stimulusRole: classified.role,
      validTime: validTime ?? undefined,
      eligible: true,
    });
  }

  for (const unmatched of workEvidence.unmatchedExerciseIds) {
    out.push({
      ...exerciseEvidenceBase(input, unmatched),
      eligible: false,
      exclusionReason: 'unmatched_result',
    });
  }

  return out;
}

export function aggregateProgressionEvidenceByLadder(input: {
  eligibility: Extract<ProgressionEvidenceEligibility, { eligible: true }>;
  exerciseEvidence: readonly ExerciseProgressionEvidence[];
  completedAt: string;
}): { events: LadderProgressionEvidenceEvent[]; diagnostics: ProgressionEvidenceDiagnostic[] } {
  const eligible = input.exerciseEvidence.filter(
    (e): e is ExerciseProgressionEvidence & {
      progressionEventId: string;
      ladderId: string;
      levelId: string;
      stimulusRole: 'primary' | 'supporting';
    } => e.eligible && !!e.progressionEventId && !!e.ladderId && !!e.levelId
  );
  const byLadder = new Map<string, typeof eligible>();
  for (const evidence of eligible) {
    byLadder.set(evidence.ladderId, [...(byLadder.get(evidence.ladderId) ?? []), evidence]);
  }

  const events: LadderProgressionEvidenceEvent[] = [];
  const diagnostics: ProgressionEvidenceDiagnostic[] = [];
  const ladders = Array.from(byLadder.keys()).sort();
  for (const ladderId of ladders) {
    const group = (byLadder.get(ladderId) ?? []).slice().sort((a, b) => a.exerciseId.localeCompare(b.exerciseId));
    const levelIds = uniqueStrings(group.map((evidence) => evidence.levelId));
    if (levelIds.length !== 1) {
      diagnostics.push({
        reason: 'conflicting_ladder_levels',
        completionId: input.eligibility.completionId,
        blockId: input.eligibility.blockId,
        templateId: input.eligibility.templateId,
        ladderId,
      });
      continue;
    }

    const pain = group.some((evidence) => evidence.pain);
    const perceivedEffort = maxRpe(group.map((evidence) => evidence.perceivedEffort));
    const trackingQuality = worstTrackingQuality(group.map((evidence) => evidence.trackingQuality));
    const validTime = worstValidTime(group.map((evidence) => evidence.validTime).filter(Boolean) as ValidTimeProgressionSummary[]);
    const completionRate = clamp01(Math.min(...group.map((evidence) => evidence.completionRate)));
    const painAreas = uniquePainAreas(group.flatMap((evidence) => evidence.painAreas));
    const result: CompletedExerciseResult = {
      ladderId,
      levelId: levelIds[0],
      completionRate,
      perceivedEffort,
      painReported: pain,
      trackingQuality,
      ...(validTime ? { validTime } : {}),
    };
    const event: LadderProgressionEvidenceEvent = {
      progressionEventId: progressionEventIdFor({
        completionId: input.eligibility.completionId,
        blockId: input.eligibility.blockId,
        templateId: input.eligibility.templateId,
        ladderId,
      }),
      completionId: input.eligibility.completionId,
      blockId: input.eligibility.blockId,
      templateId: input.eligibility.templateId,
      plannedDateKey: input.eligibility.plannedDateKey,
      ladderId,
      levelId: levelIds[0],
      completedAt: input.completedAt,
      sourceExerciseIds: group.map((evidence) => evidence.exerciseId),
      result,
      feedback: {
        completedAt: input.completedAt,
        perceivedEffort,
        painReported: pain,
        painAreas,
        trackingQuality,
        exerciseResults: [result],
      },
    };
    events.push(event);
  }

  return { events, diagnostics };
}

export function applyProgressionEvidence(
  state: AuthoritativeLadderProgressState,
  evidenceEvents: readonly LadderProgressionEvidenceEvent[],
  policy: Exclude<ProgressionEvidencePolicy, 'ineligible'> = 'normal'
): ProgressionEvidenceApplicationResult {
  let ladderProgressById: Record<string, LadderProgress> = { ...(state.ladderProgressById ?? {}) };
  let appliedProgressionEventIds = normalizeAppliedProgressionEventIds(state.appliedProgressionEventIds);
  const appliedEvents: LadderProgressionEvidenceEvent[] = [];
  const skippedDuplicateEvents: LadderProgressionEvidenceEvent[] = [];
  const decisions: ProgressionApplicationDecision[] = [];
  const diagnostics: ProgressionEvidenceDiagnostic[] = [];

  for (const event of evidenceEvents.slice().sort((a, b) => a.progressionEventId.localeCompare(b.progressionEventId))) {
    if (appliedProgressionEventIds.includes(event.progressionEventId)) {
      skippedDuplicateEvents.push(event);
      diagnostics.push(diagnosticForEvent(event, 'duplicate_progression_event'));
      continue;
    }

    if (policy === 'hold_only' && !requiresConservativeProgressionApplication(event)) {
      appliedProgressionEventIds = appendAppliedProgressionEventId(
        appliedProgressionEventIds,
        event.progressionEventId
      );
      appliedEvents.push(event);
      decisions.push({
        progressionEventId: event.progressionEventId,
        ladderId: event.ladderId,
        decisionKind: 'held',
        beforeLevelId: ladderProgressById[event.ladderId]?.currentLevelId,
        afterLevelId: ladderProgressById[event.ladderId]?.currentLevelId,
      });
      diagnostics.push({
        ...diagnosticForEvent(event, 'progression_held_by_policy'),
        decisionKind: 'held',
        progressionEvidencePolicy: policy,
        beforeLevelId: ladderProgressById[event.ladderId]?.currentLevelId,
        afterLevelId: ladderProgressById[event.ladderId]?.currentLevelId,
      });
      continue;
    }

    const before = ladderProgressById[event.ladderId];
    try {
      ladderProgressById = updateLadderProgressAfterSession(
        ladderProgressById,
        {
          id: event.progressionEventId,
          templateId: event.templateId,
          completedAt: event.completedAt,
          exercises: [event.result],
        },
        event.feedback
      );
    } catch {
      diagnostics.push(diagnosticForEvent(event, 'progression_application_failed'));
      continue;
    }

    appliedProgressionEventIds = appendAppliedProgressionEventId(
      appliedProgressionEventIds,
      event.progressionEventId
    );
    appliedEvents.push(event);
    const after = ladderProgressById[event.ladderId];
    const decisionKind = progressionDecisionKind(before, after);
    decisions.push({
      progressionEventId: event.progressionEventId,
      ladderId: event.ladderId,
      decisionKind,
      beforeLevelId: before?.currentLevelId,
      afterLevelId: after?.currentLevelId,
    });
    diagnostics.push({
      ...diagnosticForEvent(event, 'progression_applied'),
      decisionKind,
      progressionEvidencePolicy: policy,
      beforeLevelId: before?.currentLevelId,
      afterLevelId: after?.currentLevelId,
    });
    if (releaseCapReached(event, before, after)) {
      diagnostics.push({
        ...diagnosticForEvent(event, 'release_cap_reached'),
        decisionKind: 'held',
        progressionEvidencePolicy: policy,
        beforeLevelId: before?.currentLevelId,
        afterLevelId: after?.currentLevelId,
      });
    }
  }

  return {
    nextState: {
      ladderProgressById,
      appliedProgressionEventIds,
    },
    appliedEvents,
    skippedDuplicateEvents,
    decisions,
    diagnostics,
  };
}

function releaseCapReached(
  event: LadderProgressionEvidenceEvent,
  before: LadderProgress | undefined,
  after: LadderProgress | undefined
): boolean {
  if (!before || !after) return false;
  let cap: ExerciseLevel | null = null;
  try {
    cap = highestAvailableLevelForRelease(getExerciseLadder(event.ladderId));
  } catch {
    return false;
  }
  if (!cap || before.currentLevelId !== cap.id || after.currentLevelId !== cap.id) return false;
  if (before.completedSessionsAtLevel < 1) return false;
  if ((event.result.completionRate ?? 0) < 0.85) return false;
  if (event.result.painReported) return false;
  if (event.result.trackingQuality === 'poor') return false;
  if (event.result.validTime?.signal === 'incomplete' || event.result.validTime?.signal === 'tracking_uncertain') return false;
  const rpe = event.result.perceivedEffort;
  return rpe === undefined || rpe <= 3;
}

export function applyProgressionEvidenceFromSession(input: {
  state: AuthoritativeLadderProgressState;
  sessionPlan: HaleSessionPlan | null | undefined;
  completion: TrainingSessionCompletion | null | undefined;
  activeBlock?: MovementBlock | null;
  sessionResult?: TrainingSessionResult | null;
  perceivedEffort?: 1 | 2 | 3 | 4 | 5;
  painReported?: boolean;
  painAreas?: readonly PainArea[];
  completed?: boolean;
  trackingQuality?: TrackingQuality;
  feedback?: PostSessionFeedback;
}): ApplyProgressionEvidenceFromSessionResult {
  const previousState = {
    ladderProgressById: input.state.ladderProgressById ?? {},
    appliedProgressionEventIds: normalizeAppliedProgressionEventIds(input.state.appliedProgressionEventIds),
  };
  const empty: ProgressionEvidenceApplicationResult = {
    nextState: previousState,
    appliedEvents: [],
    skippedDuplicateEvents: [],
    decisions: [],
    diagnostics: [],
  };
  const workEvidence = evaluateSessionWorkEvidence(input.sessionPlan, input.sessionResult);
  const eligibility = classifyProgressionEvidenceEligibility({
    sessionPlan: input.sessionPlan,
    completion: input.completion,
    activeBlock: input.activeBlock,
    workEvidence,
  });
  if (!eligibility.eligible || !input.sessionPlan || !input.completion) {
    return {
      ...empty,
      eligibility,
      exerciseEvidence: [],
      evidenceEvents: [],
      diagnostics: [
        ...empty.diagnostics,
        {
          reason: eligibility.eligible ? 'malformed_completion' : eligibility.reason,
          completionId: input.completion?.id,
          blockId: input.completion?.blockId ?? input.sessionPlan?.blockId,
          templateId: input.completion?.templateId ?? input.sessionPlan?.metadata?.templateId,
          sessionType: input.completion?.sessionType ?? input.sessionPlan?.sessionType,
          source: input.completion?.source ?? input.sessionPlan?.metadata?.source,
        },
      ],
    };
  }

  const feedback = progressionFeedbackFor(input);
  if (!hasRequiredProgressionFeedback(feedback) || input.completed === false) {
    return {
      ...empty,
      eligibility,
      exerciseEvidence: [],
      evidenceEvents: [],
      diagnostics: [
        {
          reason: input.completed === false ? 'zero_work' : 'missing_feedback',
          completionId: eligibility.completionId,
          blockId: eligibility.blockId,
          templateId: eligibility.templateId,
          sessionType: eligibility.sessionType,
          source: input.sessionPlan.metadata?.source,
        },
      ],
    };
  }

  const exerciseEvidence = buildExerciseProgressionEvidence({
    eligibility,
    sessionPlan: input.sessionPlan,
    sessionResult: input.sessionResult,
    feedback,
    completedAt: input.completion.completedAt,
    completedOverride: input.completed,
    workEvidence,
  });
  const exerciseDiagnostics = exerciseEvidence
    .filter((evidence) => !evidence.eligible)
    .map((evidence): ProgressionEvidenceDiagnostic => ({
      reason: evidence.exclusionReason ?? 'malformed_result',
      completionId: eligibility.completionId,
      blockId: eligibility.blockId,
      templateId: eligibility.templateId,
      ladderId: evidence.ladderId,
      exerciseId: evidence.exerciseId,
      progressionEventId: evidence.progressionEventId,
      sessionType: eligibility.sessionType,
      source: input.sessionPlan?.metadata?.source,
      stimulusRole: evidence.stimulusRole,
    }));
  const aggregated = aggregateProgressionEvidenceByLadder({
    eligibility,
    exerciseEvidence,
    completedAt: input.completion.completedAt,
  });
  const application = applyProgressionEvidence(
    previousState,
    aggregated.events,
    eligibility.progressionEvidencePolicy
  );

  return {
    ...application,
    eligibility,
    exerciseEvidence,
    evidenceEvents: aggregated.events,
    diagnostics: [
      ...exerciseDiagnostics,
      ...aggregated.diagnostics,
      ...application.diagnostics,
    ],
  };
}

function exerciseEvidenceBase(
  input: {
    eligibility: Extract<ProgressionEvidenceEligibility, { eligible: true }>;
    feedback: PostSessionFeedback;
  },
  exerciseId: string
): Omit<ExerciseProgressionEvidence, 'eligible' | 'exclusionReason'> {
  return {
    completionId: input.eligibility.completionId,
    blockId: input.eligibility.blockId,
    templateId: input.eligibility.templateId,
    plannedDateKey: input.eligibility.plannedDateKey,
    exerciseId,
    completionRate: 1,
    perceivedEffort: input.feedback.perceivedEffort ?? null,
    pain: input.feedback.painReported === true,
    painAreas: input.feedback.painAreas ?? [],
    trackingQuality: input.feedback.trackingQuality ?? 'good',
  };
}

function classifyGeneratedExerciseMetadata(input: {
  metadata: HaleGeneratedExerciseMetadata;
  plannedLadderId?: string;
}):
  | {
      eligible: true;
      ladderId: string;
      level: ExerciseLevel;
      levelIndex: number;
      role: 'primary' | 'supporting';
    }
  | { eligible: false; reason: ExerciseProgressionExclusionReason } {
  const { metadata } = input;
  if (!hasExercise(metadata.exerciseId)) return { eligible: false, reason: 'invalid_exercise_id' };
  if (!metadata.ladderId) return { eligible: false, reason: 'missing_ladder_id' };
  let ladder;
  try {
    ladder = getExerciseLadder(metadata.ladderId);
  } catch {
    return { eligible: false, reason: 'invalid_ladder_id' };
  }
  if (input.plannedLadderId && input.plannedLadderId !== ladder.id) {
    return { eligible: false, reason: 'exercise_ladder_mismatch' };
  }
  if (!metadata.levelId) return { eligible: false, reason: 'missing_level_id' };
  const levelIndex = ladder.levels.findIndex((level) => level.id === metadata.levelId);
  const level = ladder.levels[levelIndex];
  if (!level || metadata.exerciseId !== level.id) {
    return { eligible: false, reason: 'selected_level_mismatch' };
  }
  if (!metadata.stimulusRole) return { eligible: false, reason: 'missing_stimulus_role' };
  if (!isStimulusRole(metadata.stimulusRole)) return { eligible: false, reason: 'invalid_stimulus_role' };
  if (metadata.stimulusRole === 'fallback') return { eligible: false, reason: 'fallback_role' };
  if (metadata.stimulusRole === 'skipped' || metadata.stimulusRole === 'invalid') {
    return { eligible: false, reason: 'skipped_role' };
  }
  return {
    eligible: true,
    ladderId: ladder.id,
    level,
    levelIndex,
    role: metadata.stimulusRole,
  };
}

function progressionFeedbackFor(input: {
  perceivedEffort?: 1 | 2 | 3 | 4 | 5;
  painReported?: boolean;
  painAreas?: readonly PainArea[];
  trackingQuality?: TrackingQuality;
  feedback?: PostSessionFeedback;
}): PostSessionFeedback {
  return {
    perceivedEffort: input.perceivedEffort,
    painReported: input.painReported,
    painAreas: input.painAreas,
    trackingQuality: input.trackingQuality ?? 'good',
    ...input.feedback,
  };
}

function hasRequiredProgressionFeedback(feedback: PostSessionFeedback): boolean {
  return isRpe(feedback.perceivedEffort) && typeof feedback.painReported === 'boolean';
}

function progressionReasonFromPlan(
  plan: HaleSessionPlan,
  reason: MainPlanCreditRejectionReason
): ProgressionExclusionReason {
  if (reason === 'wrong_block') return 'wrong_block';
  if (reason === 'unsupported_session_type') return reasonFromSessionType(plan.sessionType);
  if (reason === 'non_block_source') return reasonFromSource(plan.metadata?.source);
  if (reason === 'missing_focus_stimulus_credit') return 'missing_focus_credit';
  if (reason === 'skipped_or_incomplete') return 'zero_work';
  if (reason === 'missing_credit_flag') return 'non_credit_session';
  if (reason === 'invalid_template' || reason === 'missing_template' || reason === 'missing_planned_date_key') {
    return 'source_mismatch';
  }
  return 'non_main_plan';
}

function progressionReasonFromCompletion(
  completion: TrainingSessionCompletion,
  reason: MainPlanCreditRejectionReason
): ProgressionExclusionReason {
  if (reason === 'wrong_block') return 'wrong_block';
  if (reason === 'unsupported_session_type') return reasonFromSessionType(completion.sessionType);
  if (reason === 'non_block_source') return reasonFromSource(completion.source);
  if (reason === 'missing_focus_stimulus_credit') return 'missing_focus_credit';
  if (reason === 'missing_credit_flag') return 'non_credit_session';
  if (reason === 'skipped_or_incomplete') return 'zero_work';
  if (reason === 'invalid_template' || reason === 'missing_template' || reason === 'missing_planned_date_key') {
    return 'source_mismatch';
  }
  return 'malformed_completion';
}

function reasonFromSessionType(type: TrainingSessionCompletionType): ProgressionExclusionReason {
  if (type === 'micro_check') return 'micro_check';
  if (type === 'retest' || type === 'retest_prep') return 'official_retest';
  return 'non_main_plan';
}

function reasonFromSource(source: string | undefined): ProgressionExclusionReason {
  if (source === 'preset') return 'extra_session';
  if (source === 'manual') return 'manual_practice';
  if (source === 'legacy' || source === 'legacy_fallback') return 'legacy_session';
  if (source === 'block_generated') return 'non_credit_session';
  return 'unknown_source';
}

function blockFromPlan(plan: HaleSessionPlan): MovementBlock {
  return {
    id: plan.blockId,
    userId: 'local-device-user',
    status: 'active',
    startDate: new Date(0).toISOString(),
    endDate: new Date(0).toISOString(),
    retestDate: new Date(0).toISOString(),
    focusDomain: plan.focusDomain,
    secondaryDomains: [],
    sessionsPerWeekTarget: 0,
    totalPlannedSessions: 0,
    completedSessions: 0,
    microChecksCompleted: 0,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  };
}

function resultItemsByExerciseId(sessionResult: TrainingSessionResult | null | undefined): Map<string, TrainingItemResult[]> {
  const out = new Map<string, TrainingItemResult[]>();
  for (const item of Array.isArray(sessionResult?.items) ? sessionResult.items : []) {
    const id = typeof item?.exerciseId === 'string' ? item.exerciseId : '';
    if (!id) continue;
    out.set(id, [...(out.get(id) ?? []), item]);
  }
  return out;
}

function isValidTrainingResultItem(item: TrainingItemResult): boolean {
  return (
    typeof item.exerciseId === 'string' &&
    (item.status === 'completed' || item.status === 'skipped') &&
    Array.isArray(item.sets)
  );
}

function generatedExerciseMetadataById(
  metadata: readonly HaleGeneratedExerciseMetadata[]
): Map<string, HaleGeneratedExerciseMetadata> {
  const out = new Map<string, HaleGeneratedExerciseMetadata>();
  for (const item of metadata) {
    if (nonEmptyString(item.exerciseId) && !out.has(item.exerciseId)) out.set(item.exerciseId, item);
  }
  return out;
}

function duplicateGeneratedExerciseIds(metadata: readonly HaleGeneratedExerciseMetadata[]): Set<string> {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const item of metadata) {
    if (!nonEmptyString(item.exerciseId)) continue;
    if (seen.has(item.exerciseId)) duplicates.add(item.exerciseId);
    seen.add(item.exerciseId);
  }
  return duplicates;
}

function progressionDecisionKind(
  before: LadderProgress | undefined,
  after: LadderProgress | undefined
): ProgressionDecisionKind {
  if (!after) return 'held';
  if (!before) return 'initialized';
  const beforeIndex = levelIndexForProgress(before);
  const afterIndex = levelIndexForProgress(after);
  if (afterIndex > beforeIndex) return 'progressed';
  if (afterIndex < beforeIndex) return 'regressed';
  return 'held';
}

function requiresConservativeProgressionApplication(event: LadderProgressionEvidenceEvent): boolean {
  const result = event.result;
  return (
    result.painReported === true ||
    result.trackingQuality === 'poor' ||
    (typeof result.completionRate === 'number' && result.completionRate < 0.6) ||
    result.perceivedEffort === 5 ||
    result.validTime?.signal === 'incomplete' ||
    result.validTime?.signal === 'tracking_uncertain'
  );
}

function levelIndexForProgress(progress: LadderProgress): number {
  if (typeof progress.currentLevelIndex === 'number' && Number.isFinite(progress.currentLevelIndex)) {
    return progress.currentLevelIndex;
  }
  try {
    const ladder = getExerciseLadder(progress.ladderId);
    return Math.max(0, ladder.levels.findIndex((level) => level.id === progress.currentLevelId));
  } catch {
    return 0;
  }
}

function diagnosticForEvent(
  event: LadderProgressionEvidenceEvent,
  reason: ProgressionDiagnosticReason
): ProgressionEvidenceDiagnostic {
  return {
    reason,
    completionId: event.completionId,
    progressionEventId: event.progressionEventId,
    blockId: event.blockId,
    templateId: event.templateId,
    ladderId: event.ladderId,
    exerciseId: event.sourceExerciseIds[0],
  };
}

function worstValidTime(values: readonly ValidTimeProgressionSummary[]): ValidTimeProgressionSummary | undefined {
  if (values.length === 0) return undefined;
  return values.slice().sort((a, b) => validTimeRank(b.signal) - validTimeRank(a.signal))[0];
}

function validTimeRank(signal: ValidTimeProgressionSignal): number {
  switch (signal) {
    case 'tracking_uncertain':
      return 5;
    case 'incomplete':
      return 4;
    case 'completed_with_resets':
      return 3;
    case 'not_applicable':
      return 2;
    case 'strong':
      return 1;
  }
}

function worstTrackingQuality(values: readonly TrackingQuality[]): TrackingQuality {
  if (values.includes('poor')) return 'poor';
  if (values.includes('usable')) return 'usable';
  return 'good';
}

function maxRpe(values: readonly (1 | 2 | 3 | 4 | 5 | null)[]): 1 | 2 | 3 | 4 | 5 {
  const finite = values.filter(isRpe);
  return (finite.length > 0 ? Math.max(...finite) : 5) as 1 | 2 | 3 | 4 | 5;
}

function isRpe(value: unknown): value is 1 | 2 | 3 | 4 | 5 {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
}

function isStimulusRole(value: unknown): value is SlotStimulusRole {
  return value === 'primary' || value === 'supporting' || value === 'fallback' || value === 'skipped' || value === 'invalid';
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function uniqueStrings(values: readonly string[]): string[] {
  return Array.from(new Set(values)).sort();
}

function uniquePainAreas(values: readonly PainArea[]): PainArea[] {
  return Array.from(new Set(values)).sort();
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function eventPart(value: string): string {
  return encodeURIComponent(value);
}
