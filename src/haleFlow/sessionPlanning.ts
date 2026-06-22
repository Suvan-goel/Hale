import {
  movementBlockSourceCheckUpId,
  type AdherenceState,
  type AvailableEquipment,
  type LifeGoal,
  type MovementAssessment,
  type MovementBlock,
  type MovementDomain,
  type MovementSafetyProfile,
  type TrainingFocusStimulusPlanStatus,
  type TrainingSessionCompletion,
  type TrainingSessionCompletionType,
} from '../adherence';
import { domainLabel, getLifeGoalWorkoutBias } from '../adherence/goalDomainMapping';
import {
  getExercise,
  getExerciseLadder,
  hasExercise,
  exerciseLevelAvailability,
  effectiveLevelIdForControlledBetaProgression,
  isPlannedTrainingReleasePolicySnapshot,
  plannedTrainingReleasePolicySnapshotForExercises,
  plannedProgressionPolicySnapshotForExercises,
  releasePolicyFingerprint,
  resolveExerciseLevel,
  validateProgressionPolicySnapshotForExercises,
  type ExerciseDefinition,
  type ExerciseLadder,
  type ExerciseLevel,
  type PlannedProgressionPolicySnapshot,
  type PlannedTrainingReleasePolicySnapshot,
  type ProgressionPolicyDiagnosticCode,
  type ProgressionPolicyExerciseSnapshotInput,
  type ProgressionPolicySelectionReason,
  type ProgressionPolicySnapshotValidation,
  type ReleasePolicyExerciseSnapshotInput,
} from '../exercises';
import type { HaleLifecycleState } from './appLifecycle';
import {
  type PersistedGeneratedSessionSummary,
  type PersistedPostSessionFeedback,
  type TrainingState,
  type TrainingSessionResult,
} from '../training';
import { equipmentLabels, equipmentSupportsTags } from '../training/equipmentSafety';
import {
  canonicalEquipmentFromSafetyProfile,
  movementCapabilitiesFromSafetyProfile,
  plannedMovementCapabilitySnapshotFromProfile,
  validatePlanMovementCapabilitySnapshot,
  normalizeCanonicalEquipment,
  plannedEquipmentSnapshotFromCanonical,
  validatePlanEquipmentSnapshot,
  type CanonicalEquipmentProfile,
  type NormalizedMovementCapabilityProfile,
  type PlannedEquipmentSnapshot,
  type PlannedMovementCapabilitySnapshot,
  type PlanEquipmentValidation,
  type PlanMovementCapabilityValidation,
} from '../profile';
import {
  discomfortConstraintForContext,
  isExerciseExcludedByDiscomfort,
  normalizeDailyTrainingContext,
  type DailyTrainingReasonCode,
  type DailyTrainingContextSource,
  type ProgressionEvidencePolicy,
} from '../training/dailyTrainingContext';
import {
  movementCapabilityBlockReasonsForLevel,
} from '../training/movementCapabilitySafety';
import {
  createSessionTemplatesForFocus,
  generateTodaySession as generateDynamicTodaySession,
  type DailyReadiness,
  type GeneratedExercise,
  type GeneratedSession,
  type GenerateSessionInput,
  type LadderProgress,
  type PainArea,
  type PostSessionFeedback,
  type SessionSource,
  type SessionIntensity,
  type SlotStimulus,
  type SlotStimulusReason,
  type SlotStimulusRole,
  type SessionTemplate,
  type TrackingQuality,
  type TrainingBlock as DynamicTrainingBlock,
  type TrainingDomain,
} from '../training/workoutGeneration';
import {
  MOBILITY_COLLECTION_ID,
  collectionExposuresFromGeneratedSessionSummaries,
  isPlannedCollectionSelection,
} from '../training/collectionSelection';
import {
  getBlockScheduleState,
  scheduleRecentSessionsForGeneration,
  type BlockScheduleState,
} from './blockSchedule';
import {
  exerciseSafetySetupText,
  exerciseSafetySummaryText,
  plannedSafetyCueSnapshotForExercises,
  requireExerciseSafetyCueProfile,
  validateExerciseSafetyCueProfile,
  validateSafetyCueSnapshot,
  type SafetyCueValidationReason,
} from '../training/safetyCues';
import { getSessionIntroCopy } from './copy';
import { extraSessionDetailBody } from './extraSessionCopy';
import {
  evaluatePlannedFocusStimulus,
  focusStimulusPlanMetadata,
} from './focusStimulusEvidence';
import {
  classifyMainPlanSessionPlan,
  mainPlanRecentSessionsForGeneration,
} from './mainPlanEvents';
import { dayLabelForPlanSessionId, type PlanSessionId } from './sessionIds';
import { applyProgressionEvidenceFromSession } from './progressionEvidence';
import type { ExerciseFamily, HaleExercise, HaleSessionPlan } from './types';

export type TodaySessionAdjustment = 'shorter' | 'gentler' | 'no_equipment' | 'something_hurts';

export interface TodaySessionPreferences {
  adjustment?: TodaySessionAdjustment | null;
  painArea?: PainArea | null;
}

export interface PlanTodayHaleSessionInput extends TodaySessionPreferences {
  safetyProfile?: MovementSafetyProfile | null;
  lifeGoal?: LifeGoal | null;
  activeBlock?: MovementBlock | null;
  training?: TrainingState | null;
  lifecycleState?: HaleLifecycleState | null;
  recentCompletions?: readonly TrainingSessionCompletion[];
  adherenceState?: AdherenceState | null;
  readiness?: DailyReadiness;
  dailyContextSource?: DailyTrainingContextSource;
  painAreas?: readonly PainArea[];
  ladderProgress?: Record<string, LadderProgress>;
  today?: string | Date;
  presetId?: string;
  targetSessionTemplateId?: PlanSessionId | string;
  source?: SessionSource;
  /** @deprecated Controlled beta does not expose optional levels. */
  includeOptionalLevels?: boolean;
  sessionIntensity?: SessionIntensity;
  generateSession?: (input: GenerateSessionInput) => GeneratedSession;
}

export type GenerationUnavailableReason =
  | 'no_active_block'
  | 'legacy_only_state'
  | 'invalid_active_block'
  | 'unsupported_focus_domain'
  | 'missing_template'
  | 'invalid_template'
  | 'generator_exception'
  | 'missing_generated_session'
  | 'empty_generated_session'
  | 'unsupported_exercise_id'
  | 'duplicate_exercise_id'
  | 'invalid_generated_exercise'
  | 'missing_stimulus_metadata'
  | 'invalid_progression_state'
  | 'source_identity_mismatch'
  | 'no_safe_exercises'
  | 'adaptation_failed'
  | 'daily_context_required'
  | 'equipment_confirmation_required'
  | 'equipment_changed_after_planning'
  | 'missing_equipment_snapshot'
  | 'movement_capability_not_confirmed'
  | 'movement_capability_changed'
  | 'missing_movement_capability_snapshot'
  | 'missing_safety_cue_profile'
  | 'unsupported_safety_cue_schema'
  | 'missing_required_band_cues'
  | 'missing_required_stop_rules'
  | 'unresolved_safety_cue_id'
  | 'exercise_level_not_available_in_controlled_beta'
  | 'missing_release_policy_snapshot'
  | 'unsupported_release_channel'
  | 'missing_progression_policy_snapshot'
  | 'unsupported_progression_policy_schema'
  | 'stale_progression_policy'
  | 'effective_progression_level_mismatch'
  | 'auto_progression_ceiling_exceeded'
  | 'non_linear_progression_selection_invalid'
  | 'legacy_plan_requires_refresh';

export type GenerationRecoveryAction =
  | 'retry'
  | 'review_setup'
  | 'complete_baseline'
  | 'create_block'
  | 'open_plan'
  | 'open_progress'
  | 'contact_support';

export type GeneratedSessionIssueCode =
  | 'missing_generated_session'
  | 'invalid_source'
  | 'block_id_mismatch'
  | 'template_id_mismatch'
  | 'template_not_in_block'
  | 'unsupported_focus_domain'
  | 'invalid_week_status'
  | 'empty_session_due'
  | 'unsupported_exercise_id'
  | 'duplicate_exercise_id'
  | 'invalid_exercise_identity'
  | 'invalid_exercise_dose'
  | 'invalid_exercise_domain'
  | 'invalid_stimulus_metadata'
  | 'unsafe_equipment'
  | 'unsafe_movement_capability'
  | 'daily_context_required'
  | 'movement_capability_profile_unknown'
  | 'missing_safety_cue_profile'
  | 'unsupported_safety_cue_schema'
  | 'missing_required_band_cues'
  | 'missing_required_stop_rules'
  | 'unresolved_safety_cue_id'
  | 'exercise_level_not_available_in_controlled_beta'
  | 'missing_release_policy_snapshot'
  | 'unsupported_release_channel'
  | 'missing_progression_policy_snapshot'
  | 'unsupported_progression_policy_schema'
  | 'stale_progression_policy'
  | 'effective_progression_level_mismatch'
  | 'auto_progression_ceiling_exceeded'
  | 'non_linear_progression_selection_invalid'
  | 'missing_slot_stimulus'
  | 'equipment_profile_unknown';

export interface GeneratedSessionIssue {
  code: GeneratedSessionIssueCode;
  exerciseId?: string;
  templateId?: string;
  blockId?: string;
  slotId?: string;
}

export type GeneratedSessionValidation =
  | { valid: true; generated: GeneratedSession }
  | {
      valid: false;
      reason: GenerationUnavailableReason;
      issues: GeneratedSessionIssue[];
    };

export interface HaleSessionPlanningDiagnostic {
  reason: GenerationUnavailableReason;
  issueCodes: readonly GeneratedSessionIssueCode[];
  blockId?: string;
  templateId?: string;
  planningDateKey?: string;
  focusDomain?: MovementDomain;
  exerciseIds?: readonly string[];
}

export type HaleSessionPlanningResult =
  | {
      kind: 'ready';
      source: 'dynamic_current';
      plan: HaleSessionPlan;
    }
  | {
      kind: 'supporting_session';
      source: 'dynamic_current';
      plan: HaleSessionPlan;
      mainPlanCreditPotential: false;
      reasons: readonly TrainingFocusStimulusPlanStatus[];
    }
  | {
      kind: 'week_complete';
      blockId: string;
      week: number;
      templateId?: string;
    }
  | {
      kind: 'block_complete';
      blockId: string;
    }
  | {
      kind: 'retest_due';
      blockId: string;
    }
  | {
      kind: 'unavailable';
      reason: GenerationUnavailableReason;
      blockId?: string;
      templateId?: string;
      planningDateKey?: string;
      recoveryActions: readonly GenerationRecoveryAction[];
      diagnostics: HaleSessionPlanningDiagnostic;
      issues?: readonly GeneratedSessionIssue[];
    };

export interface SessionPlanningRecoveryCopy {
  title: string;
  body: string;
  primaryActionLabel: string;
  secondaryActionLabel?: string;
}

export interface PlanLadderPracticeSessionInput {
  ladderId: string;
  requestedLevelId?: string;
  safetyProfile?: MovementSafetyProfile | null;
  lifeGoal?: LifeGoal | null;
  activeBlock?: MovementBlock | null;
  training?: TrainingState | null;
  ladderProgress?: Record<string, LadderProgress>;
  readiness?: DailyReadiness;
  dailyContextSource?: DailyTrainingContextSource;
  painAreas?: readonly PainArea[];
  adjustment?: TodaySessionAdjustment | null;
  painArea?: PainArea | null;
  today?: string | Date;
}

export function planTodayHaleSession(input: PlanTodayHaleSessionInput): HaleSessionPlanningResult {
  const activeBlock = input.activeBlock ?? null;
  const plannedFor = input.today ?? new Date();
  const planningDate = dateKey(plannedFor);
  const schedule = activeBlock
    ? getBlockScheduleState({
        block: activeBlock,
        completions: input.recentCompletions ?? [],
        generatedSessionSummaries: input.training?.generatedSessionSummaries ?? [],
        today: plannedFor,
      })
    : null;
  const sessionType = sessionTypeFor(input, schedule);
  const readiness = readinessFor(input, sessionType);
  const dailyContextSource = dailyContextSourceFor(input, sessionType);
  const painAreas = painAreasFor(input);
  const presetId = presetIdFor(input, sessionType, activeBlock);
  const equipmentContext = canonicalEquipmentForPlanning(input);
  const movementCapabilityContext = movementCapabilityForPlanning(input);

  if (activeBlock) {
    if (!isMovementDomain(activeBlock.focusDomain)) {
      return unavailablePlanningResult({
        reason: 'invalid_active_block',
        blockId: activeBlock.id,
        planningDateKey: `session:${planningDate}`,
        focusDomain: undefined,
        issues: [{ code: 'unsupported_focus_domain', blockId: activeBlock.id }],
      });
    }
    if (schedule?.status === 'retest_due' || input.lifecycleState === 'monthly_retest_due') {
      return { kind: 'retest_due', blockId: activeBlock.id };
    }
    if (schedule?.status === 'training_complete_waiting_retest' || schedule?.status === 'block_completed') {
      return { kind: 'block_complete', blockId: activeBlock.id };
    }
    if (schedule?.status === 'week_complete_waiting') {
      return {
        kind: 'week_complete',
        blockId: activeBlock.id,
        week: schedule.currentWeekNumber,
      };
    }
    if (schedule?.status === 'schedule_unavailable') {
      return unavailablePlanningResult({
        reason: 'invalid_active_block',
        blockId: activeBlock.id,
        planningDateKey: `session:${planningDate}`,
        focusDomain: activeBlock.focusDomain,
        issues: [{ code: 'invalid_week_status', blockId: activeBlock.id }],
      });
    }
    let dynamicBlock: DynamicTrainingBlock;
    try {
      dynamicBlock = toDynamicTrainingBlock(activeBlock);
    } catch {
      return unavailablePlanningResult({
        reason: 'invalid_active_block',
        blockId: activeBlock.id,
        planningDateKey: `session:${planningDate}`,
        focusDomain: activeBlock.focusDomain,
        issues: [{ code: 'unsupported_focus_domain', blockId: activeBlock.id }],
      });
    }
    const scheduledTemplateId = !presetId ? schedule?.nextTemplateId : undefined;
    const requestedTemplate = targetTemplateFor(dynamicBlock, input.targetSessionTemplateId, presetId);
    if (input.targetSessionTemplateId && !presetId && !requestedTemplate) {
      return unavailablePlanningResult({
        reason: 'invalid_template',
        blockId: activeBlock.id,
        templateId: String(input.targetSessionTemplateId),
        planningDateKey: `${String(input.targetSessionTemplateId)}:${planningDate}`,
        focusDomain: activeBlock.focusDomain,
        issues: [{ code: 'template_id_mismatch', templateId: String(input.targetSessionTemplateId), blockId: activeBlock.id }],
      });
    }
    if (requestedTemplate && scheduledTemplateId && requestedTemplate.id !== scheduledTemplateId) {
      return unavailablePlanningResult({
        reason: 'invalid_template',
        blockId: activeBlock.id,
        templateId: String(input.targetSessionTemplateId),
        planningDateKey: `${String(input.targetSessionTemplateId)}:${planningDate}`,
        focusDomain: activeBlock.focusDomain,
        issues: [{ code: 'template_id_mismatch', templateId: String(input.targetSessionTemplateId), blockId: activeBlock.id }],
      });
    }
    const targetTemplate = scheduledTemplateId
      ? targetTemplateFor(dynamicBlock, scheduledTemplateId, presetId)
      : requestedTemplate;

    if (equipmentContext.canonical.status !== 'confirmed') {
      return unavailablePlanningResult({
        reason: 'equipment_confirmation_required',
        blockId: activeBlock.id,
        templateId: targetTemplate?.id,
        planningDateKey: plannedDateKey(targetTemplate?.id, plannedFor),
        focusDomain: activeBlock.focusDomain,
        recoveryActions: ['review_setup', 'retry'],
        issues: [{ code: 'equipment_profile_unknown', blockId: activeBlock.id, templateId: targetTemplate?.id }],
      });
    }
    const availableEquipment = equipmentContext.availableEquipment;
    let generated: unknown;
    try {
      generated = (input.generateSession ?? generateDynamicTodaySession)({
        block: dynamicBlock,
        template: targetTemplate,
        presetId,
        safetyProfile: input.safetyProfile,
        availableEquipment,
        movementCapabilities: movementCapabilityContext.profile,
        dailyReadiness: readiness,
        dailyContextSource,
        painAreas,
        ladderProgress: input.ladderProgress ?? input.training?.ladderProgressById ?? {},
        recentSessions: recentSessionsFor(input, schedule),
        collectionExposures: collectionExposuresForPlanning(input, activeBlock.id),
        scheduleSelection: schedule ? templateSelectionSchedule(schedule) : undefined,
        today: plannedFor,
        source: input.source,
        sessionIntensity: input.sessionIntensity,
        lifeGoalBias: getLifeGoalWorkoutBias(input.lifeGoal),
      });
    } catch {
      return unavailablePlanningResult({
        reason: 'generator_exception',
        blockId: activeBlock.id,
        templateId: targetTemplate?.id,
        planningDateKey: plannedDateKey(targetTemplate?.id, plannedFor),
        focusDomain: activeBlock.focusDomain,
        issues: [{ code: 'missing_generated_session', blockId: activeBlock.id, templateId: targetTemplate?.id }],
      });
    }

    const validation = validateGeneratedSessionForPlanning({
      generated,
      activeBlock,
      dynamicBlock,
      targetTemplate,
      presetId,
      availableEquipment,
      movementCapabilities: movementCapabilityContext.profile,
    });
    if (!validation.valid) {
      return unavailablePlanningResult({
        reason: validation.reason,
        blockId: activeBlock.id,
        templateId: targetTemplate?.id,
        planningDateKey: plannedDateKey(targetTemplate?.id, plannedFor),
        focusDomain: activeBlock.focusDomain,
        issues: validation.issues,
        exerciseIds: generatedExerciseIds(generated),
      });
    }
    const generatedSession = validation.generated;
    if (generatedSession.weekStatus === 'week_complete') {
      return {
        kind: 'week_complete',
        blockId: activeBlock.id,
        week: currentBlockWeek(activeBlock, plannedFor),
        templateId: generatedSession.templateId,
      };
    }
    if (generatedSession.weekStatus === 'block_complete') {
      return { kind: 'block_complete', blockId: activeBlock.id };
    }

    try {
      const adapted = adaptGeneratedSessionToHaleSessionPlan(generatedSession, {
        activeBlock,
        lifeGoal: input.lifeGoal,
        sessionType,
        plannedFor,
        equipmentSnapshot: equipmentContext.snapshot,
        movementCapabilitySnapshot: movementCapabilityContext.snapshot,
        schedule,
      });
      if (adapted.exercises.length === 0) {
        return unavailablePlanningResult({
          reason: emptySessionReason(generatedSession),
          blockId: activeBlock.id,
          templateId: generatedSession.templateId,
          planningDateKey: adapted.metadata?.plannedDateKey,
          focusDomain: activeBlock.focusDomain,
          issues: [{ code: 'empty_session_due', templateId: generatedSession.templateId, blockId: activeBlock.id }],
        });
      }
      return readyOrSupportingResult(adapted);
    } catch {
      return unavailablePlanningResult({
        reason: 'adaptation_failed',
        blockId: activeBlock.id,
        templateId: validation.generated.templateId,
        planningDateKey: plannedDateKey(validation.generated.templateId, plannedFor),
        focusDomain: activeBlock.focusDomain,
        issues: [{ code: 'invalid_exercise_identity', blockId: activeBlock.id, templateId: validation.generated.templateId }],
      });
    }
  }

  if (presetId) {
    if (!hasExplicitDailyContext(input)) {
      return unavailablePlanningResult({
        reason: 'daily_context_required',
        templateId: presetId,
        planningDateKey: plannedDateKey(presetId, plannedFor),
        recoveryActions: ['retry'],
        issues: [{ code: 'daily_context_required', templateId: presetId }],
      });
    }
    if (equipmentContext.canonical.status !== 'confirmed') {
      return unavailablePlanningResult({
        reason: 'equipment_confirmation_required',
        templateId: presetId,
        planningDateKey: plannedDateKey(presetId, plannedFor),
        recoveryActions: ['review_setup', 'retry'],
        issues: [{ code: 'equipment_profile_unknown', templateId: presetId }],
      });
    }
    const availableEquipment = equipmentContext.availableEquipment;
    let generated: unknown;
    try {
      generated = (input.generateSession ?? generateDynamicTodaySession)({
        block: null,
        presetId,
        safetyProfile: input.safetyProfile,
        availableEquipment,
        movementCapabilities: movementCapabilityContext.profile,
        dailyReadiness: readiness,
        dailyContextSource,
        painAreas,
        ladderProgress: input.ladderProgress ?? input.training?.ladderProgressById ?? {},
        recentSessions: recentSessionsFor(input, null),
        today: plannedFor,
        source: input.source,
        sessionIntensity: input.sessionIntensity,
        lifeGoalBias: getLifeGoalWorkoutBias(input.lifeGoal),
      });
    } catch {
      return unavailablePlanningResult({
        reason: 'generator_exception',
        templateId: presetId,
        planningDateKey: plannedDateKey(presetId, plannedFor),
        issues: [{ code: 'missing_generated_session', templateId: presetId }],
      });
    }
    const validation = validateGeneratedSessionForPlanning({
      generated,
      activeBlock: null,
      dynamicBlock: null,
      presetId,
      availableEquipment,
      movementCapabilities: movementCapabilityContext.profile,
    });
    if (!validation.valid) {
      return unavailablePlanningResult({
        reason: validation.reason,
        templateId: presetId,
        planningDateKey: plannedDateKey(presetId, plannedFor),
        issues: validation.issues,
        exerciseIds: generatedExerciseIds(generated),
      });
    }
    try {
      const adapted = adaptGeneratedSessionToHaleSessionPlan(validation.generated, {
        activeBlock: placeholderBlockForGenerated(validation.generated, plannedFor),
        lifeGoal: input.lifeGoal,
        sessionType,
        plannedFor,
        equipmentSnapshot: equipmentContext.snapshot,
        movementCapabilitySnapshot: movementCapabilityContext.snapshot,
      });
      if (adapted.exercises.length === 0) {
        return unavailablePlanningResult({
          reason: emptySessionReason(validation.generated),
          templateId: validation.generated.templateId,
          planningDateKey: adapted.metadata?.plannedDateKey,
          issues: [{ code: 'empty_session_due', templateId: validation.generated.templateId }],
        });
      }
      return readyOrSupportingResult(adapted);
    } catch {
      return unavailablePlanningResult({
        reason: 'adaptation_failed',
        templateId: validation.generated.templateId,
        planningDateKey: plannedDateKey(validation.generated.templateId, plannedFor),
        issues: [{ code: 'invalid_exercise_identity', templateId: validation.generated.templateId }],
      });
    }
  }

  return unavailablePlanningResult({
    reason: input.training?.block ? 'legacy_only_state' : 'no_active_block',
    planningDateKey: `session:${planningDate}`,
    recoveryActions: input.training?.block
      ? ['open_plan', 'create_block', 'contact_support']
      : ['create_block', 'complete_baseline', 'retry'],
    issues: [{ code: 'missing_generated_session' }],
  });
}

export function planLadderPracticeSessionResult(input: PlanLadderPracticeSessionInput): HaleSessionPlanningResult {
  const today = input.today ?? new Date();
  const planningDate = dateKey(today);
  if (!hasExplicitDailyContext(input)) {
    return unavailablePlanningResult({
      reason: 'daily_context_required',
      templateId: `practice-${input.ladderId}`,
      planningDateKey: `practice-${input.ladderId}:${planningDate}`,
      recoveryActions: ['retry'],
      issues: [{ code: 'daily_context_required', templateId: `practice-${input.ladderId}` }],
    });
  }
  let ladder;
  try {
    ladder = getExerciseLadder(input.ladderId);
  } catch {
    return unavailablePlanningResult({
      reason: 'invalid_template',
      templateId: `practice-${input.ladderId}`,
      planningDateKey: `practice-${input.ladderId}:${planningDate}`,
      issues: [{ code: 'template_id_mismatch', templateId: `practice-${input.ladderId}` }],
    });
  }
  if (ladder.releaseStatus !== 'v1_core') {
    return unavailablePlanningResult({
      reason: 'invalid_template',
      templateId: `practice-${ladder.id}`,
      planningDateKey: `practice-${ladder.id}:${planningDate}`,
      issues: [{ code: 'template_id_mismatch', templateId: `practice-${ladder.id}` }],
    });
  }
  if (input.requestedLevelId) {
    const requested = ladder.levels.find((level) => level.id === input.requestedLevelId);
    if (!requested) {
      return unavailablePlanningResult({
        reason: 'invalid_template',
        templateId: `practice-${ladder.id}`,
        planningDateKey: `practice-${ladder.id}:${planningDate}`,
        issues: [{ code: 'template_id_mismatch', templateId: `practice-${ladder.id}` }],
      });
    }
    const availability = exerciseLevelAvailability(requested);
    if (!availability.available) {
      return unavailablePlanningResult({
        reason: 'exercise_level_not_available_in_controlled_beta',
        templateId: `practice-${ladder.id}`,
        planningDateKey: `practice-${ladder.id}:${planningDate}`,
        recoveryActions: ['review_setup', 'retry'],
        issues: [{ code: 'exercise_level_not_available_in_controlled_beta', exerciseId: requested.id, templateId: `practice-${ladder.id}` }],
        exerciseIds: [requested.id],
      });
    }
  }
  const betaLevels = ladder.levels.filter((level) => exerciseLevelAvailability(level).available);
  if (betaLevels.length === 0) {
    return unavailablePlanningResult({
      reason: 'missing_template',
      templateId: `practice-${ladder.id}`,
      planningDateKey: `practice-${ladder.id}:${planningDate}`,
      issues: [{ code: 'empty_session_due', templateId: `practice-${ladder.id}` }],
    });
  }
  const progress = (input.ladderProgress ?? input.training?.ladderProgressById ?? {})[ladder.id];
  const progressionSelection = effectiveLevelIdForControlledBetaProgression({
    ladder,
    storedLevelId: progress?.currentLevelId ?? ladder.defaultLevelId,
    explicitLevelId: input.requestedLevelId,
  });
  const preferred = progressionSelection.selectedLevel ??
    betaLevels.find((level) => level.id === ladder.defaultLevelId) ??
    betaLevels[0];
  const adjustmentReasons = progressionPolicyAdjustmentReasons(progressionSelection.diagnostics);
  const canonical = canonicalEquipmentForPlanning(input);
  if (canonical.canonical.status !== 'confirmed') {
    return unavailablePlanningResult({
      reason: 'equipment_confirmation_required',
      templateId: `practice-${ladder.id}`,
      planningDateKey: `practice-${ladder.id}:${planningDate}`,
      recoveryActions: ['review_setup', 'retry'],
      issues: [{ code: 'equipment_profile_unknown', templateId: `practice-${ladder.id}` }],
    });
  }
  const available = canonical.availableEquipment;
  const movementCapabilityContext = movementCapabilityForPlanning(input);
  const dailyContext = normalizeDailyTrainingContext({
    readiness: readinessFor(input, 'standard'),
    painAreas: painAreasFor(input),
    source: dailyContextSourceFor(input, 'standard'),
    readinessOptional: false,
  });
  if (dailyContext.inputStatus === 'malformed_fail_closed') {
    return unavailablePlanningResult({
      reason: 'daily_context_required',
      templateId: `practice-${ladder.id}`,
      planningDateKey: `practice-${ladder.id}:${planningDate}`,
      recoveryActions: ['retry', 'review_setup'],
      issues: [{ code: 'daily_context_required', templateId: `practice-${ladder.id}` }],
    });
  }
  const discomfortConstraint = discomfortConstraintForContext(dailyContext);
  const preferredIssues = practiceLevelIssues(preferred, ladder, available, movementCapabilityContext.profile, discomfortConstraint);
  if (preferredIssues.length > 0) {
    return unavailablePlanningResult({
      reason: preferredIssues.includes('unsafe_movement_capability')
        ? 'movement_capability_not_confirmed'
        : 'no_safe_exercises',
      templateId: `practice-${ladder.id}`,
      planningDateKey: `practice-${ladder.id}:${planningDate}`,
      recoveryActions: ['review_setup', 'retry'],
      issues: preferredIssues.map((code) => ({ code, exerciseId: preferred.id, templateId: `practice-${ladder.id}` })),
      exerciseIds: [preferred.id],
    });
  }
  if (!hasExercise(preferred.id)) {
    return unavailablePlanningResult({
      reason: 'unsupported_exercise_id',
      templateId: `practice-${ladder.id}`,
      planningDateKey: `practice-${ladder.id}:${planningDate}`,
      issues: [{ code: 'unsupported_exercise_id', exerciseId: preferred.id, templateId: `practice-${ladder.id}` }],
    });
  }
  const level = preferred;
  const definition = getExercise(level.id);
  const exercise = toPracticeHaleExercise(ladder.id, ladder.title, ladder.whyItMatters, level, definition);
  const activeBlock = input.activeBlock ?? placeholderBlockForPractice(ladder.id, level, today);
  const focusDomain = toMovementDomain(level.domain);
  const plan: HaleSessionPlan = {
    id: `manual-practice-${ladder.id}-${dateKey(today)}`,
    blockId: activeBlock.id,
    title: `${ladder.title} Practice`,
    purposeCopy: `${ladder.whyItMatters} This focused practice sits outside your main Today session.`,
    sessionType: 'standard',
    estimatedMinutes: Math.max(6, exercise.estimatedMinutes ?? 8),
    focusDomain,
    exercises: [exercise],
    metadata: {
      source: 'manual',
      generatedSessionId: `manual-practice-${ladder.id}-${dateKey(today)}`,
      templateId: `practice-${ladder.id}`,
      plannedDateKey: `practice-${ladder.id}:${dateKey(today)}`,
      guidance: ['Focused practice from your movement ladder. Keep support nearby and move comfortably.'],
      equipmentNeeded: equipmentNeeded([exercise]),
      equipmentSnapshot: canonical.snapshot,
      movementCapabilitySnapshot: movementCapabilityContext.snapshot,
      safetyCueSnapshot: plannedSafetyCueSnapshotForExercises([exercise.id]),
      releasePolicySnapshot: plannedTrainingReleasePolicySnapshotForExercises([
        releasePolicyExerciseInputForManual({
          exercise,
          ladderId: ladder.id,
          level,
          requestedLevelId: progressionSelection.requestedLevelId,
          adjustmentReasons,
        }),
      ]),
      progressionPolicySnapshot: plannedProgressionPolicySnapshotForExercises([
        progressionPolicyExerciseInputForManual({
          exercise,
          ladderId: ladder.id,
          level,
          requestedLevelId: progressionSelection.requestedLevelId,
          storedLevelId: progress?.currentLevelId,
          selectionReason: progressionSelection.selectionReason,
          diagnostics: progressionSelection.diagnostics,
        }),
      ]),
      generatedExercises: [
        {
          exerciseId: exercise.id,
          ladderId: ladder.id,
          levelId: level.id,
          sets: exercise.targetSets,
          repsPerSet: exercise.targetReps,
          secondsPerSet: exercise.durationSeconds,
          measurementTier: exercise.measurementTier,
          requestedLevelId: progressionSelection.requestedLevelId,
          storedLevelId: progress?.currentLevelId,
          selectedDailyLevelId: level.id,
          progressionPolicySelectionReason: progressionSelection.selectionReason,
          ...(progressionSelection.diagnostics.length > 0
            ? { progressionPolicyDiagnostics: progressionSelection.diagnostics }
            : {}),
          adjustmentReasons,
        },
      ],
    },
  };
  return { kind: 'ready', source: 'dynamic_current', plan };
}

export function planLadderPracticeSession(input: PlanLadderPracticeSessionInput): HaleSessionPlan | null {
  return sessionPlanFromPlanningResult(planLadderPracticeSessionResult(input));
}

export function adaptGeneratedSessionToHaleSessionPlan(
  generated: GeneratedSession,
  {
    activeBlock,
    lifeGoal,
    sessionType,
    plannedFor,
    equipmentSnapshot,
    movementCapabilitySnapshot,
    schedule,
  }: {
    activeBlock: MovementBlock;
    lifeGoal?: LifeGoal | null;
    sessionType: TrainingSessionCompletionType;
    plannedFor?: string | Date;
    equipmentSnapshot?: PlannedEquipmentSnapshot;
    movementCapabilitySnapshot?: PlannedMovementCapabilitySnapshot;
    schedule?: BlockScheduleState | null;
  }
): HaleSessionPlan {
  const exercises = generated.exercises.map((exercise) => toHaleExercise(exercise));
  const introCopy = getSessionIntroCopy({ focusDomain: activeBlock.focusDomain, lifeGoal });
  const plan: HaleSessionPlan = {
    id: generated.id,
    blockId: activeBlock.id,
    title: generated.title || titleForSessionType(sessionType, activeBlock.focusDomain),
    purposeCopy:
      generated.source === 'preset'
        ? extraSessionDetailBody(generated.templateId, introCopy)
        : introCopy,
    sessionType,
    estimatedMinutes: generated.estimatedMinutes || (sessionType === 'standard' ? 20 : 12),
    focusDomain: activeBlock.focusDomain,
    exercises,
    metadata: {
      source: generated.source,
      generatedSessionId: generated.id,
      templateId: generated.templateId,
      plannedDateKey: plannedDateKey(generated.templateId, plannedFor ?? new Date()),
      readiness: generated.readiness,
      painAreas: generated.painAreas,
      dailyContext: generated.dailyContext,
      progressionEvidencePolicy: generated.progressionEvidencePolicy ?? progressionPolicyFromGeneratedSession(generated),
      adjustmentReasons: generated.adjustmentReasons,
      schedule: schedule
        ? {
            policyVersion: schedule.policyVersion,
            weekIndex: schedule.currentWeekIndex,
            weekNumber: schedule.currentWeekNumber,
            weekStartDateKey: schedule.currentWeekStartDateKey,
            lapseState: schedule.lapseState,
            nextTemplateId: schedule.nextTemplateId,
          }
        : undefined,
      equipmentSnapshot,
      movementCapabilitySnapshot,
      safetyCueSnapshot: plannedSafetyCueSnapshotForExercises(exercises.map((exercise) => exercise.id)),
      releasePolicySnapshot: plannedTrainingReleasePolicySnapshotForExercises(
        generated.exercises.map(releasePolicyExerciseInputForGenerated)
      ),
      progressionPolicySnapshot: plannedProgressionPolicySnapshotForExercises(
        generated.exercises.map(progressionPolicyExerciseInputForGenerated)
      ),
      guidance: generated.guidance,
      equipmentNeeded: equipmentNeeded(exercises),
      generatedExercises: generated.exercises.map(toGeneratedExerciseMetadata),
      slotStimulus: generated.slotStimulus.map(toSlotStimulusMetadata),
    },
  };
  const metadata = plan.metadata!;
  return {
    ...plan,
    metadata: {
      ...metadata,
      focusStimulus: focusStimulusPlanMetadata(evaluatePlannedFocusStimulus(plan, activeBlock)),
    },
  };
}

export function countsTowardMainPlan(sessionPlan: HaleSessionPlan | null | undefined): boolean {
  return classifyMainPlanSessionPlan(sessionPlan).credited;
}

function progressionPolicyFromGeneratedSession(generated: GeneratedSession): ProgressionEvidencePolicy {
  if (generated.source !== 'block_generated') return 'ineligible';
  if (
    generated.readiness === 'ready' &&
    (!Array.isArray(generated.painAreas) || generated.painAreas.length === 0)
  ) {
    return 'normal';
  }
  return 'hold_only';
}

export function sessionPlanFromPlanningResult(result: HaleSessionPlanningResult): HaleSessionPlan | null {
  return result.kind === 'ready' || result.kind === 'supporting_session' ? result.plan : null;
}

export function requireHaleSessionPlan(input: PlanTodayHaleSessionInput): HaleSessionPlan {
  const result = planTodayHaleSession(input);
  const plan = sessionPlanFromPlanningResult(result);
  if (!plan) {
    throw new Error(`Expected a playable Hale session plan, received ${result.kind}`);
  }
  return plan;
}

export function getSessionPlanningRecoveryCopy(result: HaleSessionPlanningResult): SessionPlanningRecoveryCopy | null {
  if (result.kind !== 'unavailable') return null;
  if (result.reason === 'no_active_block') {
    return {
      title: 'Hale needs an active current plan before it can prepare today\'s session.',
      body: 'Your plan has not changed. Finish setup or create a current 4-week block to continue.',
      primaryActionLabel: primaryRecoveryLabel(result.recoveryActions[0]),
      secondaryActionLabel: secondaryRecoveryLabel(result.recoveryActions),
    };
  }
  if (result.reason === 'legacy_only_state') {
    return {
      title: 'Your previous plan needs to be refreshed before Hale can safely continue.',
      body: 'Your history is still saved. Complete the current plan setup to continue.',
      primaryActionLabel: primaryRecoveryLabel(result.recoveryActions[0]),
      secondaryActionLabel: secondaryRecoveryLabel(result.recoveryActions),
    };
  }
  if (result.reason === 'unsupported_exercise_id' || result.reason === 'invalid_generated_exercise' || result.reason === 'missing_stimulus_metadata') {
    return {
      title: 'Today\'s session needs to be refreshed before it can start.',
      body: 'Your plan is unchanged. Try again, or review your setup before starting.',
      primaryActionLabel: primaryRecoveryLabel(result.recoveryActions[0]),
      secondaryActionLabel: secondaryRecoveryLabel(result.recoveryActions),
    };
  }
  if (result.reason === 'no_safe_exercises') {
    return {
      title: 'Today\'s workout needs a setup check.',
      body: 'Hale paused before starting because your equipment, readiness, or discomfort choices do not leave a suitable exercise mix.',
      primaryActionLabel: primaryRecoveryLabel(result.recoveryActions[0]),
      secondaryActionLabel: secondaryRecoveryLabel(result.recoveryActions),
    };
  }
  if (result.reason === 'equipment_confirmation_required') {
    return {
      title: 'Confirm your equipment setup before continuing.',
      body: 'Review your available equipment before Hale prepares today\'s session.',
      primaryActionLabel: primaryRecoveryLabel(result.recoveryActions[0]),
      secondaryActionLabel: secondaryRecoveryLabel(result.recoveryActions),
    };
  }
  if (result.reason === 'daily_context_required') {
    return {
      title: 'Check how today feels before starting.',
      body: 'Choose today\'s readiness and whether anything feels uncomfortable so Hale can prepare the session safely.',
      primaryActionLabel: primaryRecoveryLabel(result.recoveryActions[0]),
      secondaryActionLabel: secondaryRecoveryLabel(result.recoveryActions),
    };
  }
  if (result.reason === 'movement_capability_not_confirmed') {
    return {
      title: 'Review movement setup before starting.',
      body: 'This movement needs a saved setup confirmation before Hale can include it.',
      primaryActionLabel: primaryRecoveryLabel(result.recoveryActions[0]),
      secondaryActionLabel: secondaryRecoveryLabel(result.recoveryActions),
    };
  }
  if (
    result.reason === 'exercise_level_not_available_in_controlled_beta' ||
    result.reason === 'missing_release_policy_snapshot' ||
    result.reason === 'unsupported_release_channel' ||
    result.reason === 'missing_progression_policy_snapshot' ||
    result.reason === 'unsupported_progression_policy_schema' ||
    result.reason === 'stale_progression_policy' ||
    result.reason === 'effective_progression_level_mismatch' ||
    result.reason === 'auto_progression_ceiling_exceeded' ||
    result.reason === 'non_linear_progression_selection_invalid'
  ) {
    return {
      title: 'This session needs to be refreshed before it can start.',
      body: 'Hale is keeping this movement at a supported level for now. Your plan and progress are unchanged.',
      primaryActionLabel: primaryRecoveryLabel(result.recoveryActions[0]),
      secondaryActionLabel: secondaryRecoveryLabel(result.recoveryActions),
    };
  }
  if (result.reason === 'equipment_changed_after_planning') {
    return {
      title: 'Today\'s session needs to be refreshed.',
      body: 'Your equipment setup changed, so Hale needs to refresh today\'s session. Your plan and progress are unchanged.',
      primaryActionLabel: primaryRecoveryLabel(result.recoveryActions[0]),
      secondaryActionLabel: secondaryRecoveryLabel(result.recoveryActions),
    };
  }
  if (result.reason === 'missing_equipment_snapshot' || result.reason === 'legacy_plan_requires_refresh') {
    return {
      title: 'Today\'s session needs to be refreshed before it can start.',
      body: 'Your plan and progress are unchanged.',
      primaryActionLabel: primaryRecoveryLabel(result.recoveryActions[0]),
      secondaryActionLabel: secondaryRecoveryLabel(result.recoveryActions),
    };
  }
  if (result.reason === 'movement_capability_changed' || result.reason === 'missing_movement_capability_snapshot') {
    return {
      title: 'Today\'s session needs to be refreshed.',
      body: 'Your movement setup changed, so Hale needs to refresh today\'s session. Your plan and progress are unchanged.',
      primaryActionLabel: primaryRecoveryLabel(result.recoveryActions[0]),
      secondaryActionLabel: secondaryRecoveryLabel(result.recoveryActions),
    };
  }
  if (
    result.reason === 'missing_safety_cue_profile' ||
    result.reason === 'unsupported_safety_cue_schema' ||
    result.reason === 'missing_required_band_cues' ||
    result.reason === 'missing_required_stop_rules' ||
    result.reason === 'unresolved_safety_cue_id'
  ) {
    return {
      title: 'Today\'s session needs updated safety guidance.',
      body: 'Hale paused before starting so the session can be refreshed with the current setup and stop rules.',
      primaryActionLabel: primaryRecoveryLabel(result.recoveryActions[0]),
      secondaryActionLabel: secondaryRecoveryLabel(result.recoveryActions),
    };
  }
  return {
    title: 'Hale couldn\'t safely prepare today\'s session.',
    body: 'Your plan has not changed. Try again, or review your setup.',
    primaryActionLabel: primaryRecoveryLabel(result.recoveryActions[0]),
    secondaryActionLabel: secondaryRecoveryLabel(result.recoveryActions),
  };
}

export function validateGeneratedSessionForPlanning({
  generated,
  activeBlock,
  dynamicBlock,
  targetTemplate,
  presetId,
  availableEquipment = ['chair', 'wall'],
  movementCapabilities = movementCapabilitiesFromSafetyProfile(null),
}: {
  generated: unknown;
  activeBlock?: MovementBlock | null;
  dynamicBlock?: DynamicTrainingBlock | null;
  targetTemplate?: SessionTemplate;
  presetId?: string;
  availableEquipment?: readonly AvailableEquipment[];
  movementCapabilities?: NormalizedMovementCapabilityProfile;
}): GeneratedSessionValidation {
  if (!isRecord(generated)) {
    return invalidGeneratedSession('missing_generated_session', [{ code: 'missing_generated_session' }]);
  }

  const session = generated as Partial<GeneratedSession>;
  const issues: GeneratedSessionIssue[] = [];
  const source = session.source;
  const weekStatus = session.weekStatus;
  const templateId = typeof session.templateId === 'string' ? session.templateId : undefined;
  const blockId = typeof session.blockId === 'string' ? session.blockId : undefined;

  if (!isSessionSource(source)) issues.push({ code: 'invalid_source', templateId, blockId });
  if (!isTrainingDomain(session.focusDomain)) issues.push({ code: 'unsupported_focus_domain', templateId, blockId });
  if (!isGeneratedWeekStatus(weekStatus)) issues.push({ code: 'invalid_week_status', templateId, blockId });

  if (activeBlock && blockId !== activeBlock.id) {
    issues.push({ code: 'block_id_mismatch', templateId, blockId });
  }
  if (presetId) {
    if (templateId !== presetId) issues.push({ code: 'template_id_mismatch', templateId, blockId });
  } else if (targetTemplate) {
    if (templateId !== targetTemplate.id) issues.push({ code: 'template_id_mismatch', templateId, blockId });
  } else if (dynamicBlock && weekStatus === 'session_due') {
    const templateBelongsToBlock = dynamicBlock.templates.some((template) => template.id === templateId);
    if (!templateBelongsToBlock) issues.push({ code: 'template_not_in_block', templateId, blockId });
  }

  const exercises = Array.isArray(session.exercises) ? session.exercises : null;
  if (!exercises) {
    issues.push({ code: 'invalid_exercise_identity', templateId, blockId });
  } else if ((weekStatus === 'session_due' || weekStatus === 'preset') && exercises.length === 0) {
    issues.push({ code: 'empty_session_due', templateId, blockId });
  }

  const seenExerciseIds = new Set<string>();
  const slotStimulus = Array.isArray(session.slotStimulus) ? session.slotStimulus : [];
  const stimulusEntries: Array<[string, Partial<SlotStimulus>]> = [];
  for (const stimulus of slotStimulus) {
    if (!isRecord(stimulus)) continue;
    const candidate = stimulus as Partial<SlotStimulus>;
    if (typeof candidate.exerciseId === 'string' && candidate.exerciseId.length > 0) {
      stimulusEntries.push([candidate.exerciseId, candidate]);
    }
  }
  const stimulusByExerciseId = new Map<string, Partial<SlotStimulus>>(stimulusEntries);

  for (const item of exercises ?? []) {
    if (!isRecord(item)) {
      issues.push({ code: 'invalid_exercise_identity', templateId, blockId });
      continue;
    }
    const exercise = item as Partial<GeneratedExercise>;
    const exerciseId = typeof exercise.exerciseId === 'string' ? exercise.exerciseId : undefined;
    if (!exerciseId || typeof exercise.id !== 'string' || typeof exercise.ladderId !== 'string' || typeof exercise.levelId !== 'string') {
      issues.push({ code: 'invalid_exercise_identity', exerciseId, templateId, blockId });
      continue;
    }
    if (seenExerciseIds.has(exerciseId) && !isAllowedDuplicateCollectionExercise(exercises ?? [], exerciseId)) {
      issues.push({ code: 'duplicate_exercise_id', exerciseId, templateId, blockId });
    }
    seenExerciseIds.add(exerciseId);
    const catalogLevel = resolveCatalogLevel(exerciseId);
    if (!hasExercise(exerciseId)) issues.push({ code: 'unsupported_exercise_id', exerciseId, templateId, blockId });
    if (exercise.levelId !== exerciseId) issues.push({ code: 'invalid_exercise_identity', exerciseId, templateId, blockId });
    const releaseStatus = exercise.releaseStatus ?? catalogLevel?.releaseStatus;
    const releaseAvailability = exerciseLevelAvailability({ levelId: exercise.levelId, releaseStatus });
    if (!releaseAvailability.available) {
      issues.push({ code: 'exercise_level_not_available_in_controlled_beta', exerciseId, templateId, blockId });
    }
    if (hasExercise(exerciseId)) {
      const safetyValidation = validateExerciseSafetyCueProfile({ exerciseId });
      if (!safetyValidation.valid) {
        for (const issue of safetyValidation.issues) {
          issues.push({ code: issue.reason, exerciseId, templateId, blockId });
        }
      }
    }
    if (
      !positiveNumber(exercise.sets) ||
      (!positiveNumber(exercise.repsPerSet) && !positiveNumber(exercise.secondsPerSet)) ||
      !nonNegativeNumber(exercise.restSeconds) ||
      !positiveNumber(exercise.estimatedMinutes)
    ) {
      issues.push({ code: 'invalid_exercise_dose', exerciseId, templateId, blockId });
    }
    if (!isTrainingDomain(exercise.domain) || !isTrainingDomain(exercise.intendedDomain)) {
      issues.push({ code: 'invalid_exercise_domain', exerciseId, templateId, blockId });
    }
    if (!isStimulusRole(exercise.stimulusRole) || !isStimulusReason(exercise.stimulusReason)) {
      issues.push({ code: 'invalid_stimulus_metadata', exerciseId, templateId, blockId });
    }
    if (!equipmentSupportsTags(exercise.equipment ?? [], availableEquipment)) {
      issues.push({ code: 'unsafe_equipment', exerciseId, templateId, blockId });
    }
    const level = hasExercise(exerciseId) ? getExercise(exerciseId) : null;
    if (level && movementCapabilityBlockReasonsForLevel(level, movementCapabilities).length > 0) {
      issues.push({ code: 'unsafe_movement_capability', exerciseId, templateId, blockId });
    }
    const stimulus = stimulusByExerciseId.get(exerciseId);
    if (
      !stimulus ||
      !isTrainingDomain(stimulus.intendedDomain) ||
      !isStimulusRole(stimulus.role) ||
      !isStimulusReason(stimulus.reason)
    ) {
      issues.push({ code: 'missing_slot_stimulus', exerciseId, templateId, blockId });
    }
  }

  if (issues.length > 0) return invalidGeneratedSession(reasonForGeneratedIssues(issues), uniqueIssues(issues));
  return { valid: true, generated: session as GeneratedSession };
}

function placeholderBlockForGenerated(generated: GeneratedSession, today: string | Date | undefined): MovementBlock {
  const now = iso(today ?? new Date());
  const focusDomain = toMovementDomain(generated.focusDomain);
  return {
    id: generated.blockId ?? 'explore-extra-session',
    userId: 'local-device-user',
    status: 'active',
    startDate: now,
    endDate: now,
    retestDate: now,
    focusDomain,
    secondaryDomains: ['strength_power', 'balance', 'mobility'].filter(
      (domain): domain is MovementDomain => domain !== focusDomain
    ),
    sessionsPerWeekTarget: 0,
    totalPlannedSessions: 0,
    completedSessions: 0,
    microChecksCompleted: 0,
    createdAt: now,
    updatedAt: now,
  };
}

function placeholderBlockForPractice(ladderId: string, level: ExerciseLevel, today: string | Date): MovementBlock {
  const now = iso(today);
  const focusDomain = toMovementDomain(level.domain);
  return {
    id: `practice-${ladderId}`,
    userId: 'local-device-user',
    status: 'active',
    startDate: now,
    endDate: now,
    retestDate: now,
    focusDomain,
    secondaryDomains: ['strength_power', 'balance', 'mobility'].filter(
      (domain): domain is MovementDomain => domain !== focusDomain
    ),
    sessionsPerWeekTarget: 0,
    totalPlannedSessions: 0,
    completedSessions: 0,
    microChecksCompleted: 0,
    createdAt: now,
    updatedAt: now,
  };
}

function practiceLevelFor(
  coreLevels: readonly ExerciseLevel[],
  preferred: ExerciseLevel,
  available: readonly AvailableEquipment[]
): ExerciseLevel | null {
  const preferredIndex = Math.max(0, coreLevels.findIndex((level) => level.id === preferred.id));
  for (let idx = preferredIndex; idx >= 0; idx--) {
    const level = coreLevels[idx];
    if (equipmentSupportsTags(level.equipment, available)) return level;
  }
  for (let idx = preferredIndex + 1; idx < coreLevels.length; idx++) {
    const level = coreLevels[idx];
    if (equipmentSupportsTags(level.equipment, available)) return level;
  }
  return null;
}

function practiceLevelIssues(
  level: ExerciseLevel,
  ladder: Pick<ExerciseLadder, 'id' | 'stimulusKind'>,
  available: readonly AvailableEquipment[],
  movementCapabilities: NormalizedMovementCapabilityProfile,
  discomfortConstraint: ReturnType<typeof discomfortConstraintForContext>
): GeneratedSessionIssueCode[] {
  const issues: GeneratedSessionIssueCode[] = [];
  if (!equipmentSupportsTags(level.equipment, available)) issues.push('unsafe_equipment');
  if (movementCapabilityBlockReasonsForLevel(level, movementCapabilities).length > 0) {
    issues.push('unsafe_movement_capability');
  }
  if (isExerciseExcludedByDiscomfort(ladder, level, discomfortConstraint)) issues.push('daily_context_required');
  return unique(issues);
}

function toPracticeHaleExercise(
  ladderId: string,
  ladderTitle: string,
  whyItMatters: string,
  level: ExerciseLevel,
  definition: ExerciseDefinition
): HaleExercise {
  const safetyCueProfile = requireExerciseSafetyCueProfile(level.id);
  return {
    id: level.id,
    ladderId,
    ladderTitle,
    family: familyForDefinition(definition),
    name: level.name,
    domain: toMovementDomain(level.domain),
    level: level.level,
    releaseStatus: level.releaseStatus,
    measurementTier: level.measurementTier,
    cameraView: level.cameraView,
    instructions: level.instructions,
    whyItMatters,
    durationSeconds:
      definition.prescription.holdSec ?? definition.prescription.captureSec ?? definition.prescription.timerSec,
    targetReps: definition.prescription.repsPerSet,
    targetSets: definition.prescription.sets,
    estimatedMinutes: estimatePracticeMinutes(definition),
    requiresEquipment: level.equipment.map((e) => String(e)),
    rationale: `${level.name} from the ${ladderTitle} ladder.`,
    safetyNotes: safetyNotesForLevel(level),
    safetyCueProfile,
  };
}

function safetyNotesForLevel(level: ExerciseLevel): string[] | undefined {
  const notes = unique([...exerciseSafetySetupText(level.id), ...exerciseSafetySummaryText(level.id)]);
  return notes.length > 0 ? notes : undefined;
}

function estimatePracticeMinutes(definition: ExerciseDefinition): number {
  const prescription = definition.prescription;
  const seconds =
    prescription.holdSec ??
    prescription.captureSec ??
    prescription.timerSec ??
    (prescription.repsPerSet ? prescription.repsPerSet * 4 : 30);
  const total = prescription.sets * seconds + Math.max(0, prescription.sets - 1) * prescription.restSec + 40;
  return Math.max(4, Math.ceil(total / 60));
}

export function generateTodaySession({
  safetyProfile,
  lifeGoal,
  activeBlock,
  recentCompletions = [],
  adherenceState,
  readiness,
  today,
}: {
  user?: unknown;
  safetyProfile?: MovementSafetyProfile | null;
  lifeGoal?: LifeGoal | null;
  activeBlock: MovementBlock;
  latestAssessment?: MovementAssessment | null;
  recentCompletions?: readonly TrainingSessionCompletion[];
  adherenceState?: AdherenceState | null;
  readiness?: DailyReadiness;
  today?: string | Date;
}): HaleSessionPlan {
  const result = planTodayHaleSession({
    safetyProfile,
    lifeGoal,
    activeBlock,
    recentCompletions,
    adherenceState,
    readiness,
    today,
  });
  const plan = sessionPlanFromPlanningResult(result);
  if (!plan) {
    throw new Error(`No Hale session plan available: ${result.kind}`);
  }
  return plan;
}

export function updateExerciseProgressionFromSession(input: {
  sessionPlan: HaleSessionPlan;
  completion: TrainingSessionCompletion;
  previousProgress?: Record<string, LadderProgress>;
  appliedProgressionEventIds?: readonly string[];
  sessionResult?: TrainingSessionResult | null;
  poseMetrics?: Record<string, unknown>;
  perceivedEffort?: 1 | 2 | 3 | 4 | 5;
  painReported?: boolean;
  painAreas?: readonly PainArea[];
  completed?: boolean;
  trackingQuality?: TrackingQuality;
  feedback?: PostSessionFeedback;
}): Record<string, LadderProgress> {
  const result = applyProgressionEvidenceFromSession({
    state: {
      ladderProgressById: input.previousProgress ?? {},
      appliedProgressionEventIds: input.appliedProgressionEventIds ?? [],
    },
    sessionPlan: input.sessionPlan,
    completion: input.completion,
    sessionResult: input.sessionResult,
    perceivedEffort: input.perceivedEffort,
    painReported: input.painReported,
    painAreas: input.painAreas,
    completed: input.completed,
    trackingQuality: input.trackingQuality,
    feedback: input.feedback
      ? {
          completedAt: input.completion.completedAt,
          ...input.feedback,
        }
      : {
          completedAt: input.completion.completedAt,
          perceivedEffort: input.perceivedEffort,
          painReported: input.painReported,
          painAreas: input.painAreas,
          trackingQuality: input.trackingQuality ?? 'good',
        },
  });
  return result.nextState.ladderProgressById;
}

export function createGeneratedSessionSummary({
  sessionPlan,
  completedAt,
  durationMinutes,
  feedback,
  mainPlanCredit,
  scheduleCredit,
  workEvidence,
  focusStimulusEvidence,
}: {
  sessionPlan: HaleSessionPlan;
  completedAt?: string;
  durationMinutes?: number;
  feedback?: PersistedPostSessionFeedback;
  mainPlanCredit?: boolean;
  scheduleCredit?: PersistedGeneratedSessionSummary['scheduleCredit'];
  workEvidence?: PersistedGeneratedSessionSummary['workEvidence'];
  focusStimulusEvidence?: PersistedGeneratedSessionSummary['focusStimulusEvidence'];
}): PersistedGeneratedSessionSummary {
  const metadata = sessionPlan.metadata;
  const source = metadata?.source === 'legacy_fallback' ? 'legacy' : metadata?.source ?? 'manual';
  const painArea = feedback?.painArea ?? metadata?.painAreas?.[0];
  const generatedExercises =
    metadata?.generatedExercises?.map((exercise) => ({
      exerciseId: exercise.exerciseId,
      ladderId: exercise.ladderId,
      levelId: exercise.levelId,
      slotType: exercise.slotType,
      sets: exercise.sets,
      repsPerSet: exercise.repsPerSet,
      secondsPerSet: exercise.secondsPerSet,
      measurementTier: exercise.measurementTier,
      intendedDomain: exercise.intendedDomain,
      stimulusRole: exercise.stimulusRole,
      stimulusReason: exercise.stimulusReason,
      requestedLevelId: exercise.requestedLevelId,
      storedLevelId: exercise.storedLevelId,
      selectedDailyLevelId: exercise.selectedDailyLevelId,
      progressionPolicySelectionReason: exercise.progressionPolicySelectionReason,
      ...(exercise.progressionPolicyDiagnostics && exercise.progressionPolicyDiagnostics.length > 0
        ? { progressionPolicyDiagnostics: exercise.progressionPolicyDiagnostics }
        : {}),
      doseBeforeAdjustment: exercise.doseBeforeAdjustment,
      adjustmentReasons: exercise.adjustmentReasons,
      collectionSelection: exercise.collectionSelection,
    })) ?? [];
  return {
    id: metadata?.generatedSessionId ?? sessionPlan.id,
    blockId: sessionPlan.blockId,
    source,
    templateId: metadata?.templateId,
    plannedDateKey: metadata?.plannedDateKey,
    sessionType: sessionPlan.sessionType,
    completionSource: metadata?.source,
    status: mainPlanCredit ? 'completed' : workEvidence && workEvidence.completedExerciseCount > 0 ? 'partial' : 'skipped',
    mainPlanCredit,
    scheduleCredit,
    workEvidence,
    focusStimulusEvidence,
    title: sessionPlan.title,
    focus: sessionPlan.focusDomain,
    completedAt,
    exerciseIds: sessionPlan.exercises.map((exercise) => exercise.id),
    ladderIds: unique(sessionPlan.exercises.map((exercise) => exercise.ladderId).filter((id): id is string => !!id)),
    readiness: metadata?.readiness,
    painArea,
    dailyContext: metadata?.dailyContext,
    progressionEvidencePolicy: metadata?.progressionEvidencePolicy ?? 'ineligible',
    adjustmentReasons: metadata?.adjustmentReasons,
    durationMinutes,
    equipmentSnapshot: metadata?.equipmentSnapshot,
    movementCapabilitySnapshot: metadata?.movementCapabilitySnapshot,
    progressionPolicySnapshot: compactProgressionPolicySnapshotForSummary(metadata?.progressionPolicySnapshot),
    exercises: generatedExercises.length > 0 ? generatedExercises : undefined,
    feedback,
  };
}

function recentSessionsFor(
  input: PlanTodayHaleSessionInput,
  schedule: BlockScheduleState | null
): GenerateSessionInput['recentSessions'] {
  if (schedule) return scheduleRecentSessionsForGeneration(schedule);
  return mainPlanRecentSessionsForGeneration({
    activeBlock: input.activeBlock,
    completions: input.recentCompletions,
    generatedSessionSummaries: input.training?.generatedSessionSummaries,
  });
}

function collectionExposuresForPlanning(
  input: PlanTodayHaleSessionInput,
  blockId: string
): GenerateSessionInput['collectionExposures'] {
  return collectionExposuresFromGeneratedSessionSummaries({
    blockId,
    summaries: input.training?.generatedSessionSummaries,
  });
}

function templateSelectionSchedule(schedule: BlockScheduleState): GenerateSessionInput['scheduleSelection'] {
  return {
    status: schedule.status,
    currentWeekNumber: schedule.currentWeekNumber,
    creditedTemplateIds: schedule.creditedTemplateIds,
    nextTemplateId: schedule.nextTemplateId,
    totalCredits: schedule.totalCredits,
  };
}

function readyOrSupportingResult(plan: HaleSessionPlan): HaleSessionPlanningResult {
  const focus = plan.metadata?.focusStimulus;
  if (plan.metadata?.source === 'block_generated' && focus && !focus.mainPlanCreditPotential) {
    return {
      kind: 'supporting_session',
      source: 'dynamic_current',
      plan,
      mainPlanCreditPotential: false,
      reasons: [focus.status],
    };
  }
  return { kind: 'ready', source: 'dynamic_current', plan };
}

function unavailablePlanningResult({
  reason,
  blockId,
  templateId,
  planningDateKey,
  focusDomain,
  recoveryActions,
  issues = [],
  exerciseIds,
}: {
  reason: GenerationUnavailableReason;
  blockId?: string;
  templateId?: string;
  planningDateKey?: string;
  focusDomain?: MovementDomain;
  recoveryActions?: readonly GenerationRecoveryAction[];
  issues?: readonly GeneratedSessionIssue[];
  exerciseIds?: readonly string[];
}): Extract<HaleSessionPlanningResult, { kind: 'unavailable' }> {
  return {
    kind: 'unavailable',
    reason,
    blockId,
    templateId,
    planningDateKey,
    recoveryActions: recoveryActions ?? recoveryActionsFor(reason),
    diagnostics: {
      reason,
      issueCodes: unique(issues.map((issue) => issue.code)),
      blockId,
      templateId,
      planningDateKey,
      focusDomain,
      exerciseIds,
    },
    issues,
  };
}

function recoveryActionsFor(reason: GenerationUnavailableReason): readonly GenerationRecoveryAction[] {
  if (reason === 'no_active_block') return ['create_block', 'complete_baseline', 'retry'];
  if (reason === 'legacy_only_state') return ['open_plan', 'create_block', 'contact_support'];
  if (
    reason === 'no_safe_exercises' ||
    reason === 'exercise_level_not_available_in_controlled_beta' ||
    reason === 'missing_release_policy_snapshot' ||
    reason === 'unsupported_release_channel' ||
    reason === 'missing_progression_policy_snapshot' ||
    reason === 'unsupported_progression_policy_schema' ||
    reason === 'stale_progression_policy' ||
    reason === 'effective_progression_level_mismatch' ||
    reason === 'auto_progression_ceiling_exceeded' ||
    reason === 'non_linear_progression_selection_invalid' ||
    reason === 'equipment_confirmation_required' ||
    reason === 'equipment_changed_after_planning' ||
    reason === 'missing_equipment_snapshot' ||
    reason === 'movement_capability_not_confirmed' ||
    reason === 'movement_capability_changed' ||
    reason === 'missing_movement_capability_snapshot' ||
    reason === 'missing_safety_cue_profile' ||
    reason === 'unsupported_safety_cue_schema' ||
    reason === 'missing_required_band_cues' ||
    reason === 'missing_required_stop_rules' ||
    reason === 'unresolved_safety_cue_id' ||
    reason === 'legacy_plan_requires_refresh'
  ) return ['review_setup', 'retry'];
  if (reason === 'invalid_active_block' || reason === 'unsupported_focus_domain') {
    return ['open_progress', 'contact_support'];
  }
  return ['retry', 'review_setup'];
}

function primaryRecoveryLabel(action: GenerationRecoveryAction | undefined): string {
  if (action === 'review_setup') return 'Review setup';
  if (action === 'complete_baseline') return 'Start Movement Check-Up';
  if (action === 'create_block') return 'Prepare current plan';
  if (action === 'open_plan') return 'Review plan';
  if (action === 'open_progress') return 'Review progress';
  if (action === 'contact_support') return 'Get help';
  return 'Try again';
}

function secondaryRecoveryLabel(actions: readonly GenerationRecoveryAction[]): string | undefined {
  const secondary = actions[1];
  return secondary ? primaryRecoveryLabel(secondary) : undefined;
}

function invalidGeneratedSession(
  reason: GenerationUnavailableReason,
  issues: readonly GeneratedSessionIssue[]
): GeneratedSessionValidation {
  return { valid: false, reason, issues: issues.slice() };
}

function reasonForGeneratedIssues(issues: readonly GeneratedSessionIssue[]): GenerationUnavailableReason {
  if (issues.some((issue) => issue.code === 'block_id_mismatch' || issue.code === 'invalid_source')) {
    return 'source_identity_mismatch';
  }
  if (issues.some((issue) => issue.code === 'template_id_mismatch' || issue.code === 'template_not_in_block')) {
    return 'invalid_template';
  }
  if (issues.some((issue) => issue.code === 'unsupported_focus_domain')) return 'unsupported_focus_domain';
  if (issues.some((issue) => issue.code === 'empty_session_due')) {
    return issues.some((issue) => issue.code === 'unsafe_equipment') ? 'no_safe_exercises' : 'empty_generated_session';
  }
  if (issues.some((issue) => issue.code === 'unsupported_exercise_id')) return 'unsupported_exercise_id';
  if (issues.some((issue) => issue.code === 'exercise_level_not_available_in_controlled_beta')) {
    return 'exercise_level_not_available_in_controlled_beta';
  }
  if (issues.some((issue) => issue.code === 'duplicate_exercise_id')) return 'duplicate_exercise_id';
  if (issues.some((issue) => issue.code === 'invalid_stimulus_metadata' || issue.code === 'missing_slot_stimulus')) {
    return 'missing_stimulus_metadata';
  }
  if (issues.some((issue) => issue.code === 'unsafe_movement_capability')) return 'movement_capability_not_confirmed';
  if (issues.some((issue) => issue.code === 'missing_required_stop_rules')) return 'missing_required_stop_rules';
  if (issues.some((issue) => issue.code === 'missing_required_band_cues')) return 'missing_required_band_cues';
  if (issues.some((issue) => issue.code === 'unsupported_safety_cue_schema')) return 'unsupported_safety_cue_schema';
  if (issues.some((issue) => issue.code === 'unresolved_safety_cue_id')) return 'unresolved_safety_cue_id';
  if (issues.some((issue) => issue.code === 'missing_safety_cue_profile')) return 'missing_safety_cue_profile';
  if (issues.some((issue) => issue.code === 'unsafe_equipment')) return 'no_safe_exercises';
  return 'invalid_generated_exercise';
}

function emptySessionReason(generated: GeneratedSession): GenerationUnavailableReason {
  return generated.slotStimulus.some((stimulus) => stimulus.role === 'skipped' || stimulus.reason === 'no_safe_option')
    ? 'no_safe_exercises'
    : 'empty_generated_session';
}

function uniqueIssues(issues: readonly GeneratedSessionIssue[]): GeneratedSessionIssue[] {
  const seen = new Set<string>();
  const out: GeneratedSessionIssue[] = [];
  for (const issue of issues) {
    const key = `${issue.code}:${issue.exerciseId ?? ''}:${issue.templateId ?? ''}:${issue.blockId ?? ''}:${issue.slotId ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(issue);
  }
  return out;
}

function generatedExerciseIds(value: unknown): string[] | undefined {
  if (!isRecord(value) || !Array.isArray((value as Partial<GeneratedSession>).exercises)) return undefined;
  const ids = (value as Partial<GeneratedSession>).exercises
    ?.filter(isRecord)
    .map((exercise) => (exercise as Partial<GeneratedExercise>).exerciseId)
    .filter((id): id is string => typeof id === 'string' && id.length > 0);
  return ids && ids.length > 0 ? unique(ids) : undefined;
}

function isAllowedDuplicateCollectionExercise(exercises: readonly unknown[], exerciseId: string): boolean {
  const duplicates = exercises
    .filter(isRecord)
    .map((exercise) => exercise as Partial<GeneratedExercise>)
    .filter((exercise) => exercise.exerciseId === exerciseId);
  if (duplicates.length < 2) return false;
  return duplicates.every((exercise) => {
    const selection = exercise.collectionSelection;
    return (
      isPlannedCollectionSelection(selection) &&
      selection.collectionId === MOBILITY_COLLECTION_ID &&
      selection.selectedExerciseId === exerciseId &&
      selection.reason === 'only_eligible_member'
    );
  });
}

function resolveCatalogLevel(exerciseId: string | undefined): ExerciseLevel | null {
  if (!exerciseId) return null;
  try {
    return resolveExerciseLevel(exerciseId).level;
  } catch {
    return null;
  }
}

function currentBlockWeek(block: MovementBlock, today: string | Date): number {
  const start = Date.parse(block.startDate);
  const end = typeof today === 'string' ? Date.parse(today) : today.getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 1;
  return Math.max(1, Math.min(4, Math.floor((end - start) / (7 * 24 * 60 * 60 * 1000)) + 1));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isMovementDomain(value: unknown): value is MovementDomain {
  return value === 'strength_power' || value === 'balance' || value === 'mobility';
}

function isTrainingDomain(value: unknown): value is TrainingDomain {
  return value === 'strength_power' || value === 'balance_stability' || value === 'mobility_flexibility';
}

function isSessionSource(value: unknown): value is SessionSource {
  return value === 'block_generated' || value === 'preset' || value === 'manual';
}

function isGeneratedWeekStatus(value: unknown): value is GeneratedSession['weekStatus'] {
  return value === 'session_due' || value === 'week_complete' || value === 'block_complete' || value === 'preset';
}

function isStimulusRole(value: unknown): value is SlotStimulusRole {
  return value === 'primary' || value === 'supporting' || value === 'fallback' || value === 'skipped' || value === 'invalid';
}

function isStimulusReason(value: unknown): value is SlotStimulusReason {
  return (
    value === 'direct_match' ||
    value === 'equipment_limited' ||
    value === 'safety_limited' ||
    value === 'supporting_maintenance' ||
    value === 'no_safe_option' ||
    value === 'band_required' ||
    value === 'floor_required' ||
    value === 'support_required' ||
    value === 'stair_support_required' ||
    value === 'movement_setup_required'
  );
}

function positiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function nonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function sessionTypeFor(
  input: PlanTodayHaleSessionInput,
  schedule?: BlockScheduleState | null
): TrainingSessionCompletionType {
  if (input.lifecycleState === 'week_complete' || input.presetId === 'preset-mobility-reset') return 'retest_prep';
  if (input.lifecycleState === 'inactive_restart') return 'restart';
  if (schedule?.status === 'session_due' && schedule.lapseState !== 'active') return 'restart';
  if (input.adherenceState === 'inactive_this_week' || input.adherenceState === 'inactive_14_days') return 'restart';
  const activeBlock = input.activeBlock ?? null;
  if (activeBlock) {
    return (schedule?.totalCredits ?? 0) === 0 ? 'starter' : 'standard';
  }
  return (input.training?.progress.completedSessions ?? 0) === 0 ? 'starter' : 'standard';
}

function readinessFor(
  input: {
    readiness?: DailyReadiness;
    adjustment?: TodaySessionAdjustment | null;
  },
  sessionType: TrainingSessionCompletionType
): DailyReadiness {
  if (input.readiness) return input.readiness;
  if (input.adjustment === 'shorter') return 'short_on_time';
  if (input.adjustment === 'gentler') return 'low_energy';
  if (input.adjustment === 'something_hurts') return 'something_hurts';
  if (sessionType === 'restart') return 'low_energy';
  return 'ready';
}

function dailyContextSourceFor(
  input: {
    dailyContextSource?: DailyTrainingContextSource;
    adjustment?: TodaySessionAdjustment | null;
    readiness?: DailyReadiness;
  },
  sessionType: TrainingSessionCompletionType
): DailyTrainingContextSource {
  if (input.dailyContextSource) return input.dailyContextSource;
  if (input.adjustment) return 'user_daily_check';
  if (sessionType === 'restart' && !input.readiness) return 'planned_restart';
  return 'user_daily_check';
}

function painAreasFor(input: {
  painAreas?: readonly PainArea[];
  adjustment?: TodaySessionAdjustment | null;
  painArea?: PainArea | null;
}): readonly PainArea[] {
  if (input.painAreas && input.painAreas.length > 0) return input.painAreas;
  if (input.adjustment === 'something_hurts' && input.painArea) return [input.painArea];
  return [];
}

function presetIdFor(
  input: PlanTodayHaleSessionInput,
  sessionType: TrainingSessionCompletionType,
  activeBlock?: MovementBlock | null
): string | undefined {
  if (input.presetId) return input.presetId;
  if (input.lifecycleState === 'week_complete') return 'preset-mobility-reset';
  if (sessionType === 'restart' && !activeBlock) return 'preset-gentle-restart';
  return undefined;
}

export function validateHaleSessionPlanEquipment(input: {
  plan: HaleSessionPlan;
  safetyProfile?: MovementSafetyProfile | null;
}): PlanEquipmentValidation {
  const current = canonicalEquipmentFromSafetyProfile(input.safetyProfile);
  return validatePlanEquipmentSnapshot({
    planned: input.plan.metadata?.equipmentSnapshot,
    current,
    source: input.plan.metadata?.source,
  });
}

export function validateHaleSessionPlanMovementCapabilities(input: {
  plan: HaleSessionPlan;
  safetyProfile?: MovementSafetyProfile | null;
}): PlanMovementCapabilityValidation {
  const current = movementCapabilitiesFromSafetyProfile(input.safetyProfile);
  return validatePlanMovementCapabilitySnapshot({
    planned: input.plan.metadata?.movementCapabilitySnapshot,
    current,
    source: input.plan.metadata?.source,
  });
}

export type PlanSafetyCueValidation =
  | { status: 'current' }
  | {
      status: SafetyCueValidationReason;
      diagnostics: readonly { reason: SafetyCueValidationReason; exerciseId?: string; cueId?: string }[];
    };

export function validateHaleSessionPlanSafetyCues(input: {
  plan: HaleSessionPlan;
}): PlanSafetyCueValidation {
  const validation = validateSafetyCueSnapshot({
    exerciseIds: input.plan.exercises.map((exercise) => exercise.id),
    snapshot: input.plan.metadata?.safetyCueSnapshot,
  });
  if (validation.valid) return { status: 'current' };
  const diagnostics = validation.issues.map((issue) => ({
    reason: issue.reason,
    exerciseId: issue.exerciseId,
    cueId: issue.cueId,
  }));
  return {
    status: diagnostics[0]?.reason ?? 'missing_safety_cue_profile',
    diagnostics,
  };
}

export type PlanReleasePolicyValidationStatus =
  | 'missing_release_policy_snapshot'
  | 'unsupported_release_channel'
  | 'release_policy_changed'
  | 'exercise_level_not_available_in_controlled_beta';

export type PlanReleasePolicyValidation =
  | { status: 'current'; snapshot: PlannedTrainingReleasePolicySnapshot }
  | {
      status: PlanReleasePolicyValidationStatus;
      diagnostics: readonly {
        reason: PlanReleasePolicyValidationStatus;
        exerciseId?: string;
        levelId?: string;
        plannedFingerprint?: string;
        currentFingerprint?: string;
      }[];
    };

export function validateHaleSessionPlanReleasePolicy(input: {
  plan: HaleSessionPlan;
}): PlanReleasePolicyValidation {
  const planned = input.plan.metadata?.releasePolicySnapshot;
  if (!isPlannedTrainingReleasePolicySnapshot(planned)) {
    return {
      status: 'missing_release_policy_snapshot',
      diagnostics: [{ reason: 'missing_release_policy_snapshot' }],
    };
  }
  if (planned.channel !== 'controlled_beta') {
    return {
      status: 'unsupported_release_channel',
      diagnostics: [{ reason: 'unsupported_release_channel', plannedFingerprint: planned.fingerprint }],
    };
  }

  const current = releasePolicySnapshotForPlan(input.plan);
  const unavailable = current.exercises.filter((exercise) => !exercise.availability.available);
  if (unavailable.length > 0) {
    return {
      status: 'exercise_level_not_available_in_controlled_beta',
      diagnostics: unavailable.map((exercise) => ({
        reason: 'exercise_level_not_available_in_controlled_beta',
        exerciseId: exercise.exerciseId,
        levelId: exercise.levelId,
        plannedFingerprint: planned.fingerprint,
        currentFingerprint: current.fingerprint,
      })),
    };
  }
  if (planned.policyFingerprint !== releasePolicyFingerprint() || planned.fingerprint !== current.fingerprint) {
    return {
      status: 'release_policy_changed',
      diagnostics: [{
        reason: 'release_policy_changed',
        plannedFingerprint: planned.fingerprint,
        currentFingerprint: current.fingerprint,
      }],
    };
  }
  return { status: 'current', snapshot: current };
}

export type PlanProgressionPolicyValidation = ProgressionPolicySnapshotValidation;

export function validateHaleSessionPlanProgressionPolicy(input: {
  plan: HaleSessionPlan;
}): PlanProgressionPolicyValidation {
  return validateProgressionPolicySnapshotForExercises({
    snapshot: input.plan.metadata?.progressionPolicySnapshot,
    exercises: progressionPolicyExerciseInputsForPlan(input.plan),
  });
}

export function staleEquipmentPlanningResult(input: {
  plan: HaleSessionPlan;
  validation: PlanEquipmentValidation;
}): Extract<HaleSessionPlanningResult, { kind: 'unavailable' }> {
  const reason =
    input.validation.status === 'equipment_changed'
      ? 'equipment_changed_after_planning'
      : input.validation.status === 'legacy_plan'
        ? 'legacy_plan_requires_refresh'
        : input.validation.status === 'canonical_equipment_unknown'
          ? 'equipment_confirmation_required'
          : 'missing_equipment_snapshot';
  return unavailablePlanningResult({
    reason,
    blockId: input.plan.blockId,
    templateId: input.plan.metadata?.templateId,
    planningDateKey: input.plan.metadata?.plannedDateKey,
    focusDomain: input.plan.focusDomain,
    recoveryActions: ['retry', 'review_setup'],
    issues: [{ code: 'equipment_profile_unknown', blockId: input.plan.blockId, templateId: input.plan.metadata?.templateId }],
    exerciseIds: input.plan.exercises.map((exercise) => exercise.id),
  });
}

export function staleReleasePolicyPlanningResult(input: {
  plan: HaleSessionPlan;
  validation: PlanReleasePolicyValidation;
}): Extract<HaleSessionPlanningResult, { kind: 'unavailable' }> {
  const reason =
    input.validation.status === 'current'
      ? 'missing_release_policy_snapshot'
      : input.validation.status === 'release_policy_changed'
        ? 'legacy_plan_requires_refresh'
        : input.validation.status;
  return unavailablePlanningResult({
    reason,
    blockId: input.plan.blockId,
    templateId: input.plan.metadata?.templateId,
    planningDateKey: input.plan.metadata?.plannedDateKey,
    focusDomain: input.plan.focusDomain,
    recoveryActions: ['retry', 'review_setup'],
    issues: releasePolicyDiagnosticsToIssues(input.validation, input.plan),
    exerciseIds: input.plan.exercises.map((exercise) => exercise.id),
  });
}

export function staleProgressionPolicyPlanningResult(input: {
  plan: HaleSessionPlan;
  validation: PlanProgressionPolicyValidation;
}): Extract<HaleSessionPlanningResult, { kind: 'unavailable' }> {
  const reason =
    input.validation.status === 'current'
      ? 'missing_progression_policy_snapshot'
      : input.validation.status;
  return unavailablePlanningResult({
    reason,
    blockId: input.plan.blockId,
    templateId: input.plan.metadata?.templateId,
    planningDateKey: input.plan.metadata?.plannedDateKey,
    focusDomain: input.plan.focusDomain,
    recoveryActions: ['retry', 'review_setup'],
    issues: progressionPolicyDiagnosticsToIssues(input.validation, input.plan),
    exerciseIds: input.plan.exercises.map((exercise) => exercise.id),
  });
}

export function staleMovementCapabilityPlanningResult(input: {
  plan: HaleSessionPlan;
  validation: PlanMovementCapabilityValidation;
}): Extract<HaleSessionPlanningResult, { kind: 'unavailable' }> {
  const reason =
    input.validation.status === 'capability_changed'
      ? 'movement_capability_changed'
      : input.validation.status === 'legacy_plan'
        ? 'legacy_plan_requires_refresh'
        : 'missing_movement_capability_snapshot';
  return unavailablePlanningResult({
    reason,
    blockId: input.plan.blockId,
    templateId: input.plan.metadata?.templateId,
    planningDateKey: input.plan.metadata?.plannedDateKey,
    focusDomain: input.plan.focusDomain,
    recoveryActions: ['retry', 'review_setup'],
    issues: [{ code: 'movement_capability_profile_unknown', blockId: input.plan.blockId, templateId: input.plan.metadata?.templateId }],
    exerciseIds: input.plan.exercises.map((exercise) => exercise.id),
  });
}

function releasePolicyDiagnosticsToIssues(
  validation: PlanReleasePolicyValidation,
  plan: HaleSessionPlan
): GeneratedSessionIssue[] {
  if (validation.status === 'current') {
    return [{ code: 'missing_release_policy_snapshot', blockId: plan.blockId, templateId: plan.metadata?.templateId }];
  }
  if (validation.status === 'release_policy_changed') {
    return [{ code: 'missing_release_policy_snapshot', blockId: plan.blockId, templateId: plan.metadata?.templateId }];
  }
  const code: GeneratedSessionIssueCode = validation.status;
  return validation.diagnostics.map((diagnostic) => ({
    code,
    exerciseId: diagnostic.exerciseId,
    blockId: plan.blockId,
    templateId: plan.metadata?.templateId,
  }));
}

function compactProgressionPolicySnapshotForSummary(
  snapshot: PlannedProgressionPolicySnapshot | undefined
): PlannedProgressionPolicySnapshot | undefined {
  if (!snapshot) return undefined;
  return {
    schemaVersion: snapshot.schemaVersion,
    policyFingerprint: snapshot.policyFingerprint,
    fingerprint: snapshot.fingerprint,
    exercises: [],
  };
}

function progressionPolicyDiagnosticsToIssues(
  validation: PlanProgressionPolicyValidation,
  plan: HaleSessionPlan
): GeneratedSessionIssue[] {
  if (validation.status === 'current') {
    return [{ code: 'missing_progression_policy_snapshot', blockId: plan.blockId, templateId: plan.metadata?.templateId }];
  }
  const code = validation.status as GeneratedSessionIssueCode;
  return validation.diagnostics.map((diagnostic) => ({
    code,
    exerciseId: diagnostic.exerciseId,
    blockId: plan.blockId,
    templateId: plan.metadata?.templateId,
  }));
}

function progressionPolicyAdjustmentReasons(
  diagnostics: readonly ProgressionPolicyDiagnosticCode[]
): DailyTrainingReasonCode[] {
  const reasons: DailyTrainingReasonCode[] = [];
  if (diagnostics.includes('release_cap_applied')) reasons.push('controlled_beta_release_cap');
  if (diagnostics.includes('auto_progression_cap_applied')) reasons.push('auto_progression_cap');
  if (diagnostics.includes('non_linear_default_selected')) reasons.push('non_linear_default');
  if (diagnostics.includes('legacy_progression_policy_capped')) reasons.push('legacy_progression_policy_capped');
  if (diagnostics.includes('daily_regression_applied')) reasons.push('reduced_readiness');
  return unique(reasons);
}

function progressionPolicyExerciseInputsForPlan(plan: HaleSessionPlan): ProgressionPolicyExerciseSnapshotInput[] {
  const metadata = plan.metadata?.generatedExercises ?? [];
  if (metadata.length > 0) {
    return metadata.map((exercise) => ({
      exerciseId: exercise.exerciseId,
      ladderId: exercise.ladderId,
      levelId: exercise.levelId,
      storedLevelId: exercise.storedLevelId,
      requestedLevelId: exercise.requestedLevelId,
      selectedDailyLevelId: exercise.selectedDailyLevelId,
      selectionReason: exercise.progressionPolicySelectionReason,
      diagnostics: exercise.progressionPolicyDiagnostics,
    }));
  }
  return plan.exercises.map((exercise) => ({
    exerciseId: exercise.id,
    ladderId: exercise.ladderId,
    levelId: exercise.id,
    selectedDailyLevelId: exercise.id,
  }));
}

export function staleSafetyCuePlanningResult(input: {
  plan: HaleSessionPlan;
  validation: PlanSafetyCueValidation;
}): Extract<HaleSessionPlanningResult, { kind: 'unavailable' }> {
  const reason = input.validation.status === 'current' ? 'missing_safety_cue_profile' : input.validation.status;
  return unavailablePlanningResult({
    reason,
    blockId: input.plan.blockId,
    templateId: input.plan.metadata?.templateId,
    planningDateKey: input.plan.metadata?.plannedDateKey,
    focusDomain: input.plan.focusDomain,
    recoveryActions: ['retry', 'review_setup'],
    issues: safetyCueDiagnosticsToIssues(input.validation, input.plan),
    exerciseIds: input.plan.exercises.map((exercise) => exercise.id),
  });
}

function safetyCueDiagnosticsToIssues(
  validation: PlanSafetyCueValidation,
  plan: HaleSessionPlan
): GeneratedSessionIssue[] {
  if (validation.status === 'current') {
    return [{ code: 'missing_safety_cue_profile', blockId: plan.blockId, templateId: plan.metadata?.templateId }];
  }
  return validation.diagnostics.map((diagnostic) => ({
    code: diagnostic.reason,
    exerciseId: diagnostic.exerciseId,
    blockId: plan.blockId,
    templateId: plan.metadata?.templateId,
  }));
}

function availableEquipmentFor(input: PlanTodayHaleSessionInput): readonly AvailableEquipment[] {
  return canonicalEquipmentForPlanning(input).availableEquipment;
}

function canonicalEquipmentForPlanning(input: PlanTodayHaleSessionInput): {
  canonical: CanonicalEquipmentProfile;
  snapshot: PlannedEquipmentSnapshot;
  availableEquipment: readonly AvailableEquipment[];
} {
  const canonical =
    input.adjustment === 'no_equipment'
      // The start menu means no optional gear; chair/wall support remains the zero-equipment safety baseline.
      ? normalizeCanonicalEquipment(['chair', 'wall'], { source: 'local_user', status: 'confirmed' })
      : canonicalEquipmentFromSafetyProfile(input.safetyProfile);
  return {
    canonical,
    snapshot: plannedEquipmentSnapshotFromCanonical(canonical),
    availableEquipment: canonical.capabilities,
  };
}

function movementCapabilityForPlanning(input: {
  safetyProfile?: MovementSafetyProfile | null;
}): {
  profile: NormalizedMovementCapabilityProfile;
  snapshot: PlannedMovementCapabilitySnapshot;
} {
  const profile = movementCapabilitiesFromSafetyProfile(input.safetyProfile);
  return {
    profile,
    snapshot: plannedMovementCapabilitySnapshotFromProfile(profile),
  };
}

function hasExplicitDailyContext(input: {
  adjustment?: TodaySessionAdjustment | null;
  readiness?: DailyReadiness;
  painArea?: PainArea | null;
  painAreas?: readonly PainArea[];
  dailyContextSource?: DailyTrainingContextSource;
}): boolean {
  return (
    Object.prototype.hasOwnProperty.call(input, 'adjustment') ||
    Object.prototype.hasOwnProperty.call(input, 'readiness') ||
    Object.prototype.hasOwnProperty.call(input, 'painArea') ||
    Object.prototype.hasOwnProperty.call(input, 'painAreas') ||
    input.dailyContextSource === 'user_daily_check'
  );
}

function toDynamicTrainingBlock(block: MovementBlock): DynamicTrainingBlock {
  const focusDomain = toTrainingDomain(block.focusDomain);
  return {
    id: block.id,
    userId: block.userId,
    sourceCheckUpId: movementBlockSourceCheckUpId(block),
    startDate: block.startDate,
    endDate: block.endDate,
    retestDate: block.retestDate,
    weeks: 4,
    sessionsPerWeek: block.sessionsPerWeekTarget,
    totalPlannedSessions: block.totalPlannedSessions,
    focusDomain,
    secondaryDomains: block.secondaryDomains.map(toTrainingDomain),
    templates: createSessionTemplatesForFocus(focusDomain),
    createdAt: block.createdAt,
    updatedAt: block.updatedAt,
  };
}

function targetTemplateFor(
  block: DynamicTrainingBlock,
  targetSessionTemplateId: PlanTodayHaleSessionInput['targetSessionTemplateId'],
  presetId: string | undefined
): SessionTemplate | undefined {
  if (!targetSessionTemplateId || presetId) return undefined;
  const target = String(targetSessionTemplateId);
  const direct = block.templates.find((template) => template.id === target);
  if (direct) return direct;
  if (target === 'session_a' || target === 'session_b' || target === 'session_c') {
    const day = dayLabelForPlanSessionId(target);
    return block.templates.find((template) => template.dayLabel === day);
  }
  return undefined;
}

function toHaleExercise(exercise: GeneratedExercise): HaleExercise {
  const safetyCueProfile = requireExerciseSafetyCueProfile(exercise.exerciseId);
  return {
    id: exercise.exerciseId,
    ladderId: exercise.ladderId,
    ladderTitle: exercise.ladderTitle,
    family: familyForExercise(exercise),
    name: exercise.name,
    domain: toMovementDomain(exercise.domain),
    level: exercise.level,
    releaseStatus: exercise.releaseStatus,
    measurementTier: exercise.measurementTier,
    cameraView: exercise.cameraView,
    instructions: exercise.instructions,
    whyItMatters: exercise.whyItMatters,
    durationSeconds: exercise.secondsPerSet,
    targetReps: exercise.repsPerSet,
    targetSets: exercise.sets,
    estimatedMinutes: exercise.estimatedMinutes,
    requiresEquipment: exercise.equipment.map((e) => String(e)),
    rationale: exercise.rationale,
    safetyNotes: unique([...exerciseSafetySetupText(exercise.exerciseId), ...exerciseSafetySummaryText(exercise.exerciseId)]),
    safetyCueProfile,
  };
}

function toGeneratedExerciseMetadata(exercise: GeneratedExercise) {
  return {
    exerciseId: exercise.exerciseId,
    ladderId: exercise.ladderId,
    levelId: exercise.levelId,
    slotType: exercise.slotType,
    sets: exercise.sets,
    repsPerSet: exercise.repsPerSet,
    secondsPerSet: exercise.secondsPerSet,
    measurementTier: exercise.measurementTier,
    intendedDomain: exercise.intendedDomain,
    stimulusRole: exercise.stimulusRole,
    stimulusReason: exercise.stimulusReason,
    requestedLevelId: exercise.requestedLevelId,
    storedLevelId: exercise.storedLevelId,
    selectedDailyLevelId: exercise.selectedDailyLevelId,
    progressionPolicySelectionReason: exercise.progressionPolicySelectionReason,
    ...(exercise.progressionPolicyDiagnostics && exercise.progressionPolicyDiagnostics.length > 0
      ? { progressionPolicyDiagnostics: exercise.progressionPolicyDiagnostics }
      : {}),
    doseBeforeAdjustment: exercise.doseBeforeAdjustment,
    adjustmentReasons: exercise.adjustmentReasons,
    collectionSelection: exercise.collectionSelection,
  };
}

function releasePolicyExerciseInputForGenerated(exercise: GeneratedExercise): ReleasePolicyExerciseSnapshotInput {
  return {
    exerciseId: exercise.exerciseId,
    ladderId: exercise.ladderId,
    levelId: exercise.levelId,
    requestedLevelId: exercise.requestedLevelId,
    selectedDailyLevelId: exercise.selectedDailyLevelId,
    releaseStatus: exercise.releaseStatus,
    adjustmentReasons: exercise.adjustmentReasons,
  };
}

function progressionPolicyExerciseInputForGenerated(exercise: GeneratedExercise): ProgressionPolicyExerciseSnapshotInput {
  return {
    exerciseId: exercise.exerciseId,
    ladderId: exercise.ladderId,
    levelId: exercise.levelId,
    storedLevelId: exercise.storedLevelId,
    requestedLevelId: exercise.requestedLevelId,
    selectedDailyLevelId: exercise.selectedDailyLevelId,
    selectionReason: exercise.progressionPolicySelectionReason,
    diagnostics: exercise.progressionPolicyDiagnostics,
  };
}

function releasePolicyExerciseInputForManual({
  exercise,
  ladderId,
  level,
  requestedLevelId,
  adjustmentReasons,
}: {
  exercise: HaleExercise;
  ladderId: string;
  level: ExerciseLevel;
  requestedLevelId?: string;
  adjustmentReasons?: readonly DailyTrainingReasonCode[];
}): ReleasePolicyExerciseSnapshotInput {
  return {
    exerciseId: exercise.id,
    ladderId,
    levelId: level.id,
    requestedLevelId,
    selectedDailyLevelId: level.id,
    releaseStatus: level.releaseStatus,
    adjustmentReasons,
  };
}

function progressionPolicyExerciseInputForManual({
  exercise,
  ladderId,
  level,
  requestedLevelId,
  storedLevelId,
  selectionReason,
  diagnostics,
}: {
  exercise: HaleExercise;
  ladderId: string;
  level: ExerciseLevel;
  requestedLevelId?: string;
  storedLevelId?: string;
  selectionReason: ProgressionPolicySelectionReason;
  diagnostics?: readonly ProgressionPolicyDiagnosticCode[];
}): ProgressionPolicyExerciseSnapshotInput {
  return {
    exerciseId: exercise.id,
    ladderId,
    levelId: level.id,
    storedLevelId,
    requestedLevelId,
    selectedDailyLevelId: level.id,
    selectionReason,
    diagnostics,
  };
}

function toSlotStimulusMetadata(stimulus: SlotStimulus) {
  return {
    slotId: stimulus.slotId,
    slotType: stimulus.slotType,
    slotTitle: stimulus.slotTitle,
    intendedDomain: stimulus.intendedDomain,
    role: stimulus.role,
    reason: stimulus.reason,
    message: stimulus.message,
    exerciseId: stimulus.exerciseId,
    ladderId: stimulus.ladderId,
    levelId: stimulus.levelId,
    selectedDomain: stimulus.selectedDomain,
  };
}

function toTrainingDomain(domain: MovementDomain): TrainingDomain {
  if (domain === 'balance') return 'balance_stability';
  if (domain === 'mobility') return 'mobility_flexibility';
  return 'strength_power';
}

function toMovementDomain(domain: TrainingDomain): MovementDomain {
  if (domain === 'balance_stability') return 'balance';
  if (domain === 'mobility_flexibility') return 'mobility';
  return 'strength_power';
}

function titleForSessionType(type: TrainingSessionCompletionType, focusDomain: MovementDomain): string {
  if (type === 'restart') return 'Gentle Restart Session';
  if (type === 'retest_prep') return '10-Minute Mobility Reset';
  return `${domainLabel(focusDomain)} session`;
}

function familyForExercise(exercise: GeneratedExercise): ExerciseFamily {
  if (exercise.ladderId === 'sit-to-stand') return 'sit_to_stand';
  if (exercise.ladderId === 'squat') return 'squat';
  if (exercise.ladderId === 'step-up') return 'step_up';
  if (exercise.ladderId === 'hinge-glutes') return exercise.exerciseId.includes('bridge') ? 'glute_bridge' : 'hinge';
  if (exercise.ladderId === 'heel-toe-raise') return 'calf_raise';
  if (exercise.ladderId === 'balance') return exercise.exerciseId.includes('single') ? 'single_leg_balance' : 'tandem_balance';
  if (exercise.ladderId === 'push') return 'push';
  if (exercise.ladderId === 'pull-upper-back') return 'row';
  if (exercise.ladderId === 'shoulder-reach-press') return 'shoulder_mobility';
  if (exercise.ladderId === 'lateral-stability') return 'weight_shift';
  if (exercise.slotType === 'ankle') return 'ankle_mobility';
  if (exercise.slotType === 'hip_mobility' || exercise.slotType === 'posterior_chain_mobility') return 'hip_mobility';
  if (exercise.slotType === 'trunk_mobility') return 'thoracic_mobility';
  return 'thoracic_mobility';
}

function familyForDefinition(definition: ExerciseDefinition): ExerciseFamily {
  if (definition.family === 'sit-to-stand') return 'sit_to_stand';
  if (definition.family === 'squat') return 'squat';
  if (definition.family === 'step-up') return 'step_up';
  if (definition.family === 'hinge-glutes') return definition.id.includes('bridge') ? 'glute_bridge' : 'hinge';
  if (definition.family === 'heel-toe-raise') return 'calf_raise';
  if (definition.family === 'balance') return definition.id.includes('single') ? 'single_leg_balance' : 'tandem_balance';
  if (definition.family === 'push') return 'push';
  if (definition.family === 'pull-upper-back') return 'row';
  if (definition.family === 'shoulder-reach-press') return 'shoulder_mobility';
  if (definition.family === 'lateral-stability') return 'weight_shift';
  if (definition.slot === 'mobility') return 'thoracic_mobility';
  return 'thoracic_mobility';
}

function equipmentNeeded(exercises: readonly HaleExercise[]): string[] {
  return unique(
    exercises
      .flatMap((exercise) => equipmentLabels(exercise.requiresEquipment ?? []))
      .filter((item) => item && item !== 'No optional equipment')
  );
}

function releasePolicySnapshotForPlan(plan: HaleSessionPlan): PlannedTrainingReleasePolicySnapshot {
  return plannedTrainingReleasePolicySnapshotForExercises(releasePolicyExerciseInputsForPlan(plan));
}

function releasePolicyExerciseInputsForPlan(plan: HaleSessionPlan): ReleasePolicyExerciseSnapshotInput[] {
  const metadataByExerciseId = new Map(
    (plan.metadata?.generatedExercises ?? []).map((exercise) => [exercise.exerciseId, exercise])
  );
  return plan.exercises.map((exercise) => {
    const metadata = metadataByExerciseId.get(exercise.id);
    const catalogLevel = resolveCatalogLevel(exercise.id);
    const levelId = metadata?.selectedDailyLevelId ?? metadata?.levelId ?? exercise.id;
    return {
      exerciseId: exercise.id,
      ladderId: metadata?.ladderId ?? exercise.ladderId,
      levelId,
      requestedLevelId: metadata?.requestedLevelId,
      selectedDailyLevelId: metadata?.selectedDailyLevelId ?? levelId,
      releaseStatus: exercise.releaseStatus ?? catalogLevel?.releaseStatus,
      adjustmentReasons: metadata?.adjustmentReasons,
    };
  });
}

function plannedDateKey(templateId: string | undefined, plannedFor: string | Date): string {
  return `${templateId ?? 'session'}:${dateKey(plannedFor)}`;
}

function dateKey(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function iso(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function unique<T>(xs: readonly T[]): T[] {
  const out: T[] = [];
  for (const x of xs) {
    if (!out.includes(x)) out.push(x);
  }
  return out;
}
