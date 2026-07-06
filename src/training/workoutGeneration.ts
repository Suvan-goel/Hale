import {
  getExercise,
  getExerciseLadder,
  listExerciseLadders,
  controlledBetaProgressionPolicyFingerprint,
  effectiveLevelIdForControlledBetaProgression,
  isExerciseLevelAvailableForRelease,
  transitionEvidenceKeyFor,
  transitionPolicyFor,
  STS_CUSHION_ID,
  STS_STANDARD_ID,
  type ExerciseDefinition,
  type ExerciseKind,
  type ExerciseLadder,
  type ExerciseLevel,
  type MeasurementTier,
  type LadderTransitionPolicy,
  type ProgressionPolicyDiagnosticCode,
  type ProgressionPolicySelectionReason,
  type ReleaseStatus,
} from '../exercises';
import type { AvailableEquipment, LifeGoalWorkoutBias, MovementDomain, MovementSafetyProfile } from '../adherence';
import {
  movementCapabilitiesFromSafetyProfile,
  normalizeMovementCapabilityProfile,
  type NormalizedMovementCapabilityProfile,
} from '../profile';
import type { CheckUpScore, Domain } from '../scoring';
import {
  DEFAULT_VALID_TIME_PROGRESSION_CONFIG,
  type ValidTimeProgressionConfig,
  type ValidTimeProgressionSummary,
} from './validTimeProgression';
import {
  equipmentMissingLabels,
  equipmentSupportsTags,
  hasSupportEquipment,
  humanList,
} from './equipmentSafety';
import {
  discomfortConstraintForContext,
  isExerciseExcludedByDiscomfort,
  normalizeDailyTrainingContext,
  painAreasFromSafetyProfile,
  progressionEvidencePolicyFor,
  type DailyTrainingContextSource,
  type DailyTrainingReasonCode,
  type DiscomfortConstraint,
  type NormalizedDailyTrainingContext,
  type ProgressionEvidencePolicy,
} from './dailyTrainingContext';
import {
  movementCapabilityBlockReasonsForLevel,
  movementCapabilitySupportsLevel,
} from './movementCapabilitySafety';
import { deriveFloorExerciseEligibility } from './floorExerciseEligibility';
import {
  plannedCollectionSelectionFromResult,
  selectCollectionMember,
  PRESET_COLLECTION_EXPOSURE_SCOPE_ID,
  type CollectionExposure,
  type PlannedCollectionSelection,
} from './collectionSelection';

export type TrainingDomain = 'strength_power' | 'balance_stability' | 'mobility_flexibility';
export type SessionSource = 'block_generated' | 'preset' | 'manual';
export type DailyReadiness = 'ready' | 'a_bit_stiff' | 'low_energy' | 'something_hurts' | 'short_on_time';
export type PainArea = 'knee' | 'hip' | 'back' | 'shoulder' | 'ankle' | 'neck' | 'other';
export type SessionIntensity = 'beginner' | 'standard' | 'advanced';
export type SlotStimulusRole = 'primary' | 'supporting' | 'fallback' | 'skipped' | 'invalid';
export type SlotStimulusReason =
  | 'direct_match'
  | 'equipment_limited'
  | 'safety_limited'
  | 'supporting_maintenance'
  | 'no_safe_option'
  | 'band_required'
  | 'floor_required'
  | 'support_required'
  | 'stair_support_required'
  | 'movement_setup_required';

export type SessionSlotType =
  | 'lower_body_strength'
  | 'upper_body_push'
  | 'upper_body_pull'
  | 'balance'
  | 'dynamic_balance'
  | 'lateral_stability'
  | 'mobility'
  | 'posterior_chain'
  | 'ankle'
  | 'shoulder_mobility'
  | 'trunk_mobility'
  | 'hip_mobility'
  | 'posterior_chain_mobility';

export interface SessionSlot {
  id: string;
  type: SessionSlotType;
  title: string;
  domain: TrainingDomain;
  preferredLadderIds: readonly string[];
  optional?: boolean;
}

export interface SlotStimulus {
  slotId: string;
  slotType: SessionSlotType;
  slotTitle: string;
  intendedDomain: TrainingDomain;
  role: SlotStimulusRole;
  reason: SlotStimulusReason;
  message: string;
  exerciseId?: string;
  ladderId?: string;
  levelId?: string;
  selectedDomain?: TrainingDomain;
}

export interface SessionTemplate {
  id: string;
  title: string;
  focusDomain: TrainingDomain;
  dayLabel: 'A' | 'B' | 'C' | 'Extra';
  estimatedMinutes: number;
  slots: readonly SessionSlot[];
  source?: SessionSource;
  sourceTemplateId?: string;
}

export interface TrainingBlock {
  id: string;
  userId: string;
  sourceCheckUpId?: string;
  /** @deprecated Legacy name. Use sourceCheckUpId. */
  sourceAssessmentId?: string;
  startDate: string;
  endDate: string;
  retestDate: string;
  weeks: number;
  sessionsPerWeek: number;
  totalPlannedSessions: number;
  focusDomain: TrainingDomain;
  secondaryDomains: TrainingDomain[];
  templates: readonly SessionTemplate[];
  createdAt: string;
  updatedAt: string;
}

export interface LadderProgress {
  ladderId: string;
  currentLevelId: string;
  currentLevelIndex?: number;
  recentCompletions?: number;
  recentFailures?: number;
  completedSessionsAtLevel: number;
  failedSessionsAtLevel: number;
  recentCompletionRates: readonly number[];
  recentRpe: readonly number[];
  recentPain: readonly boolean[];
  lastRpe?: number;
  lastPain?: boolean;
  lastPainArea?: PainArea;
  lastTrackingQuality?: TrackingQuality;
  lastCompletedAt?: string;
  readyToProgress?: boolean;
  transitionEvidenceKey?: string;
  progressionPolicyFingerprint?: string;
  lastProgressionDecisionReason?: ProgressionDecisionReason;
  updatedAt: string;
}

export type ProgressionDecisionReason =
  | 'progression_allowed_transition'
  | 'transition_not_auto_approved'
  | 'non_linear_progression_model'
  | 'device_validation_required'
  | 'domain_review_required'
  | 'manual_only_transition'
  | 'auto_progression_cap_reached'
  | 'progression_maintained'
  | 'conservative_regression';

export type TrackingQuality = 'good' | 'usable' | 'poor';

export interface RecentSessionSummary {
  id?: string;
  blockId?: string;
  templateId?: string;
  plannedDate?: string;
  completedAt: string;
  source?: SessionSource;
  status?: 'completed' | 'partial' | 'skipped';
  durationMinutes?: number;
}

export interface GenerateSessionInput {
  block?: TrainingBlock | null;
  template?: SessionTemplate | null;
  presetId?: string;
  today?: string | Date;
  safetyProfile?: MovementSafetyProfile | null;
  availableEquipment?: readonly AvailableEquipment[];
  dailyReadiness?: DailyReadiness | unknown;
  painAreas?: readonly PainArea[] | unknown;
  dailyContextSource?: DailyTrainingContextSource;
  movementCapabilities?: MovementSafetyProfile['movementCapabilities'] | NormalizedMovementCapabilityProfile | null;
  ladderProgress?: Record<string, LadderProgress>;
  recentSessions?: readonly RecentSessionSummary[];
  collectionExposures?: readonly CollectionExposure[];
  scheduleSelection?: TemplateSelectionSchedule;
  source?: SessionSource;
  /** @deprecated Controlled beta ignores caller attempts to enable optional levels. */
  includeOptionalLevels?: boolean;
  sessionIntensity?: SessionIntensity;
  lifeGoalBias?: LifeGoalWorkoutBias | null;
  /**
   * Ladders auto-excluded by the pain recurrence rule (painHistory in
   * TrainingState — the SAME store this generator's callers read, by
   * design). Selection filters these and BACKFILLS from the slot's
   * remaining candidates, so sessions never silently shrink.
   */
  painExcludedLadderIds?: readonly string[];
}

export interface GeneratedExercise {
  id: string;
  exerciseId: string;
  ladderId: string;
  ladderTitle: string;
  levelId: string;
  level: number;
  name: string;
  slotType: SessionSlotType;
  domain: TrainingDomain;
  kind: ExerciseKind;
  releaseStatus: ReleaseStatus;
  measurementTier: MeasurementTier;
  cameraView: ExerciseLevel['cameraView'];
  equipment: readonly string[];
  instructions: string;
  whyItMatters: string;
  sets: number;
  repsPerSet?: number;
  secondsPerSet?: number;
  restSeconds: number;
  estimatedMinutes: number;
  rationale: string;
  intendedDomain: TrainingDomain;
  stimulusRole: SlotStimulusRole;
  stimulusReason: SlotStimulusReason;
  substitutions?: readonly string[];
  safetyNotes?: readonly string[];
  requestedLevelId?: string;
  storedLevelId?: string;
  selectedDailyLevelId?: string;
  progressionPolicySelectionReason?: ProgressionPolicySelectionReason;
  progressionPolicyDiagnostics?: readonly ProgressionPolicyDiagnosticCode[];
  doseBeforeAdjustment?: GeneratedExerciseDose;
  adjustmentReasons?: readonly DailyTrainingReasonCode[];
  collectionSelection?: PlannedCollectionSelection;
}

export interface GeneratedExerciseDose {
  sets: number;
  repsPerSet?: number;
  secondsPerSet?: number;
}

export interface GeneratedSession {
  id: string;
  blockId?: string;
  templateId: string;
  source: SessionSource;
  title: string;
  focusDomain: TrainingDomain;
  dayLabel: SessionTemplate['dayLabel'];
  estimatedMinutes: number;
  durationLabel: string;
  readiness: DailyReadiness;
  painAreas: readonly PainArea[];
  weekStatus: 'session_due' | 'week_complete' | 'block_complete' | 'preset';
  exercises: readonly GeneratedExercise[];
  skippedSlots: readonly string[];
  skippedSlotReasons: readonly string[];
  slotStimulus: readonly SlotStimulus[];
  guidance: readonly string[];
  dailyContext?: NormalizedDailyTrainingContext;
  progressionEvidencePolicy?: ProgressionEvidencePolicy;
  adjustmentReasons?: readonly DailyTrainingReasonCode[];
}

export interface CompletedExerciseResult {
  ladderId: string;
  levelId?: string;
  completionRate?: number;
  perceivedEffort?: 1 | 2 | 3 | 4 | 5;
  painReported?: boolean;
  trackingQuality?: TrackingQuality;
  validTime?: ValidTimeProgressionSummary;
}

export interface CompletedGeneratedSession {
  id?: string;
  templateId?: string;
  completedAt: string;
  exercises: readonly CompletedExerciseResult[];
}

export interface PostSessionFeedback {
  perceivedEffort?: 1 | 2 | 3 | 4 | 5;
  painReported?: boolean;
  painAreas?: readonly PainArea[];
  trackingQuality?: TrackingQuality;
  exerciseResults?: readonly CompletedExerciseResult[];
  completedAt?: string;
}

export interface CreateTrainingBlockInput {
  userId?: string;
  sourceCheckUpId?: string;
  /** @deprecated Legacy alias for sourceCheckUpId. */
  assessmentId?: string;
  score?: CheckUpScore | null;
  domainScores?: Partial<Record<TrainingDomain, number>>;
  focusDomain?: TrainingDomain | Domain | null;
  startDate?: string | Date;
}

export interface TemplateSelection {
  template: SessionTemplate | null;
  weekNumber: number;
  completedThisWeek: number;
  status: 'session_due' | 'week_complete' | 'block_complete';
}

export interface TemplateSelectionSchedule {
  status: 'session_due' | 'week_complete_waiting' | 'training_complete_waiting_retest' | 'retest_due' | 'block_completed' | 'schedule_unavailable';
  currentWeekNumber: number;
  creditedTemplateIds: readonly string[];
  nextTemplateId?: string;
  totalCredits: number;
}

const WEEKS = 4;
const SESSIONS_PER_WEEK = 3;
const MAX_RECENT = 4;

// Check-up-informed starting level (see initialLadderProgressFromCheckUp).
// Age never chooses exercises or levels — these thresholds read only the
// check-up's own measured value against the whole published norm table's
// span, never the user's age. Rikli & Jones chair-stand-reps anchors run
// ~8.5 (oldest, 92y) to ~19 (youngest, 47y); Bohannon single-leg-stance
// anchors run ~8.5s (85y) to ~35s (50y) — see src/scoring/norms.ts.
const STRENGTH_CALIBRATION_LADDER_ID = 'sit-to-stand';
const STRENGTH_CALIBRATION_LOW_REPS = 8;
const STRENGTH_CALIBRATION_HIGH_REPS = 20;
const BALANCE_CALIBRATION_LADDER_ID = 'balance';
const BALANCE_CALIBRATION_HIGH_HOLD_SEC = 30;

const DOMAIN_ORDER: readonly TrainingDomain[] = [
  'strength_power',
  'balance_stability',
  'mobility_flexibility',
];

const LADDER_ALIASES: Record<string, string> = {
  sit_to_stand: 'sit-to-stand',
  squat: 'squat',
  step_up: 'step-up',
  heel_toe_raise: 'heel-toe-raise',
  push: 'push',
  pull_upper_back: 'pull-upper-back',
  hinge_glutes: 'hinge-glutes',
  shoulder_reach_press: 'shoulder-reach-press',
  balance: 'balance',
  lateral_stability: 'lateral-stability',
  mobility_flexibility: 'mobility-flexibility',
  seated_hamstring_reach: 'mobility-flexibility',
  hamstring_reach: 'mobility-flexibility',
  forward_reach: 'mobility-flexibility',
  thoracic_rotation: 'mobility-flexibility',
  supported_hip_flexor_stretch: 'mobility-flexibility',
  wall_calf_stretch: 'mobility-flexibility',
  loaded_march: 'lateral-stability',
};

const SLOT_FALLBACK_LADDERS: Record<SessionSlotType, readonly string[]> = {
  lower_body_strength: ['sit-to-stand', 'squat', 'hinge-glutes'],
  upper_body_push: ['push', 'shoulder-reach-press'],
  upper_body_pull: ['pull-upper-back'],
  balance: ['balance', 'lateral-stability'],
  dynamic_balance: ['lateral-stability', 'balance'],
  lateral_stability: ['lateral-stability', 'balance'],
  mobility: ['mobility-flexibility', 'shoulder-reach-press'],
  posterior_chain: ['hinge-glutes', 'sit-to-stand'],
  ankle: ['heel-toe-raise', 'mobility-flexibility'],
  shoulder_mobility: ['shoulder-reach-press', 'mobility-flexibility'],
  trunk_mobility: ['mobility-flexibility'],
  hip_mobility: ['mobility-flexibility', 'hinge-glutes'],
  posterior_chain_mobility: ['mobility-flexibility', 'hinge-glutes'],
};

const PRIMARY_SLOT_LADDERS: Record<SessionSlotType, readonly string[]> = {
  lower_body_strength: ['sit-to-stand', 'squat', 'step-up'],
  upper_body_push: ['push'],
  upper_body_pull: ['pull-upper-back'],
  balance: ['balance'],
  dynamic_balance: ['lateral-stability'],
  lateral_stability: ['lateral-stability'],
  mobility: ['mobility-flexibility'],
  posterior_chain: ['hinge-glutes'],
  ankle: ['heel-toe-raise'],
  shoulder_mobility: ['shoulder-reach-press'],
  trunk_mobility: ['mobility-flexibility'],
  hip_mobility: ['mobility-flexibility'],
  posterior_chain_mobility: ['mobility-flexibility'],
};

const SUPPORTING_SLOT_LADDERS: Record<SessionSlotType, readonly string[]> = {
  lower_body_strength: [],
  upper_body_push: ['shoulder-reach-press'],
  upper_body_pull: [],
  balance: ['lateral-stability'],
  dynamic_balance: ['balance'],
  lateral_stability: ['balance'],
  mobility: ['shoulder-reach-press'],
  posterior_chain: ['sit-to-stand'],
  ankle: ['mobility-flexibility'],
  shoulder_mobility: ['mobility-flexibility'],
  trunk_mobility: [],
  hip_mobility: ['hinge-glutes'],
  posterior_chain_mobility: ['hinge-glutes'],
};

const DOMAIN_LABEL: Record<TrainingDomain, string> = {
  strength_power: 'Strength & Power',
  balance_stability: 'Balance & Stability',
  mobility_flexibility: 'Mobility & Flexibility',
};

export const MOVEMENT_PROFILE_V2_BALANCED_TEMPLATE_POLICY_VERSION = 2 as const;
export const MOVEMENT_PROFILE_V2_BALANCED_TEMPLATE_POLICY_FINGERPRINT =
  'mpv2-balanced-template-policy-v2:rotated-by-block-id;combos=strength-A,balance-B,mobility-C|strength-B,balance-C,mobility-A|strength-C,balance-A,mobility-B' as const;
export const MOVEMENT_PROFILE_V2_BALANCED_TEMPLATE_SOURCES = {
  'balanced-A': 'strength-A',
  'balanced-B': 'balance-B',
  'balanced-C': 'mobility-C',
} as const;

/**
 * A balanced (tied-domain) block otherwise always played the exact same 3
 * fixed session templates for the whole block's life. Rotating the SOURCE
 * combo by a stable hash of the block id keeps template ids
 * (balanced-A/B/C) — which the schedule/credit system requires to stay
 * constant for a given block — while giving different blocks (a user's
 * repeat block after a retest; different users) a different slot mix.
 */
const BALANCED_TEMPLATE_ROTATIONS: readonly {
  strength: 'strength-A' | 'strength-B' | 'strength-C';
  balance: 'balance-A' | 'balance-B' | 'balance-C';
  mobility: 'mobility-A' | 'mobility-B' | 'mobility-C';
}[] = [
  { strength: 'strength-A', balance: 'balance-B', mobility: 'mobility-C' },
  { strength: 'strength-B', balance: 'balance-C', mobility: 'mobility-A' },
  { strength: 'strength-C', balance: 'balance-A', mobility: 'mobility-B' },
];

function balancedTemplateRotationIndex(seed: string | undefined): number {
  if (!seed) return 0;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return hash % BALANCED_TEMPLATE_ROTATIONS.length;
}

const TRAINING_DOMAIN_BY_MOVEMENT_DOMAIN: Record<MovementDomain, TrainingDomain> = {
  strength_power: 'strength_power',
  balance: 'balance_stability',
  mobility: 'mobility_flexibility',
};

export function trainingDomainFromScoreDomain(domain: Domain | null | undefined): TrainingDomain {
  if (domain === 'balance') return 'balance_stability';
  if (domain === 'mobility') return 'mobility_flexibility';
  return 'strength_power';
}

export function scoreDomainFromTrainingDomain(domain: TrainingDomain): Domain {
  if (domain === 'balance_stability') return 'balance';
  if (domain === 'mobility_flexibility') return 'mobility';
  return 'strength';
}

export function createTrainingBlockFromAssessment(input: CreateTrainingBlockInput = {}): TrainingBlock {
  const startDate = iso(input.startDate ?? new Date());
  const focusDomain = inferFocusDomain(input);
  const secondaryDomains = DOMAIN_ORDER.filter((d) => d !== focusDomain);
  const templates = createSessionTemplatesForFocus(focusDomain);
  return {
    id: `training-block-${startDate.replace(/[:.]/g, '-')}`,
    userId: input.userId ?? 'local-device-user',
    sourceCheckUpId: input.sourceCheckUpId ?? input.assessmentId ?? input.score?.startedAt,
    startDate,
    endDate: addDaysIso(startDate, 28),
    retestDate: addDaysIso(startDate, 28),
    weeks: WEEKS,
    sessionsPerWeek: SESSIONS_PER_WEEK,
    totalPlannedSessions: WEEKS * SESSIONS_PER_WEEK,
    focusDomain,
    secondaryDomains,
    templates,
    createdAt: startDate,
    updatedAt: startDate,
  };
}

export function createSessionTemplatesForFocus(focusDomain: TrainingDomain): SessionTemplate[] {
  if (focusDomain === 'balance_stability') return balanceTemplates();
  if (focusDomain === 'mobility_flexibility') return mobilityTemplates();
  return strengthTemplates();
}

export function createBalancedSessionTemplates(rotationSeed?: string): SessionTemplate[] {
  const rotation = BALANCED_TEMPLATE_ROTATIONS[balancedTemplateRotationIndex(rotationSeed)];
  const sourceTemplates = [
    { id: 'balanced-A' as const, source: strengthTemplates().find((item) => item.id === rotation.strength) },
    { id: 'balanced-B' as const, source: balanceTemplates().find((item) => item.id === rotation.balance) },
    { id: 'balanced-C' as const, source: mobilityTemplates().find((item) => item.id === rotation.mobility) },
  ];

  return sourceTemplates.map(({ id, source }) => {
    if (!source) throw new Error(`Missing balanced source template for ${id}`);
    return template(
      id,
      `Balanced Session ${source.dayLabel}`,
      source.dayLabel,
      source.focusDomain,
      source.estimatedMinutes,
      source.slots.map((slot) => ({ ...slot })),
      'block_generated',
      source.id
    );
  });
}

export function getTemplateSelection(
  block: TrainingBlock,
  recentSessions: readonly RecentSessionSummary[] = [],
  today: string | Date = new Date(),
  scheduleSelection?: TemplateSelectionSchedule
): TemplateSelection {
  const requiredTemplates = block.templates.filter(
    (template) => template.dayLabel === 'A' || template.dayLabel === 'B' || template.dayLabel === 'C'
  );
  if (scheduleSelection) {
    const template = scheduleSelection.nextTemplateId
      ? requiredTemplates.find((item) => item.id === scheduleSelection.nextTemplateId) ?? null
      : null;
    const completedThisWeek = requiredTemplates.filter((item) =>
      scheduleSelection.creditedTemplateIds.includes(item.id)
    ).length;
    if (scheduleSelection.status === 'session_due') {
      return {
        template,
        weekNumber: scheduleSelection.currentWeekNumber,
        completedThisWeek,
        status: template ? 'session_due' : 'week_complete',
      };
    }
    return {
      template: null,
      weekNumber: scheduleSelection.currentWeekNumber,
      completedThisWeek,
      status:
        scheduleSelection.status === 'training_complete_waiting_retest' ||
        scheduleSelection.status === 'retest_due' ||
        scheduleSelection.status === 'block_completed'
          ? 'block_complete'
          : 'week_complete',
    };
  }
  const requiredTemplateIds = new Set(requiredTemplates.map((template) => template.id));
  const blockSessions = recentSessions
    .filter((session) => !session.blockId || session.blockId === block.id)
    .map((session) => ({ ...session, templateId: session.templateId ?? templateIdFromPlannedDate(session.plannedDate) }))
    .filter((session) => !!session.templateId && requiredTemplateIds.has(session.templateId));
  const weekNumber = trainingWeekNumber(block, today);
  const completedOverall = uniqueCompletedWeekTemplates(block, blockSessions).size;
  if (completedOverall >= block.totalPlannedSessions) {
    return { template: null, weekNumber, completedThisWeek: 0, status: 'block_complete' };
  }

  const weekStart = addDays(new Date(block.startDate), (weekNumber - 1) * 7);
  const weekEnd = addDays(weekStart, 7);
  const completedThisWeek = blockSessions.filter((s) => {
    if (s.status === 'skipped') return false;
    const completedAt = new Date(s.completedAt);
    return completedAt >= weekStart && completedAt < weekEnd;
  });
  const completedTemplateIds = new Set(completedThisWeek.map((s) => s.templateId).filter((id): id is string => !!id));

  if (requiredTemplates.every((template) => completedTemplateIds.has(template.id))) {
    return {
      template: null,
      weekNumber,
      completedThisWeek: completedTemplateIds.size,
      status: 'week_complete',
    };
  }

  const template =
    requiredTemplates.find((t) => !completedTemplateIds.has(t.id)) ??
    requiredTemplates[completedTemplateIds.size % requiredTemplates.length] ??
    null;
  return {
    template,
    weekNumber,
    completedThisWeek: completedTemplateIds.size,
    status: 'session_due',
  };
}

export function selectNextSessionTemplate(
  block: TrainingBlock,
  recentSessions: readonly RecentSessionSummary[] = [],
  today: string | Date = new Date(),
  scheduleSelection?: TemplateSelectionSchedule
): SessionTemplate | null {
  return getTemplateSelection(block, recentSessions, today, scheduleSelection).template;
}

export function generateTodaySession(input: GenerateSessionInput): GeneratedSession {
  const setupDiscomfortAreas = painAreasFromSafetyProfile(input.safetyProfile);
  const setupDiscomfortApplied = (input.painAreas === undefined || input.painAreas === null) && setupDiscomfortAreas.length > 0;
  const dailyContext = normalizeDailyTrainingContext({
    readiness: input.dailyReadiness,
    painAreas: input.painAreas ?? setupDiscomfortAreas,
    discomfortSource: setupDiscomfortApplied ? 'safety_profile' : 'daily_check',
    source: input.dailyContextSource ?? 'user_daily_check',
    readinessOptional: true,
  });
  const readiness = dailyContext.readiness;
  const painAreas = dailyContext.discomfortAreas;
  const discomfortConstraint = discomfortConstraintForContext(dailyContext);
  const equipment = equipmentFromInput(input);
  const movementCapabilities = movementCapabilitiesFromInput(input);
  const source: SessionSource = input.presetId ? 'preset' : input.source ?? 'block_generated';
  const profileModifiers = trainingProfileModifiers({
    baseSessionIntensity: input.sessionIntensity ?? 'standard',
    safetyProfile: input.safetyProfile,
    dailyContext,
  });
  const progressionEvidencePolicy = profileAdjustedProgressionEvidencePolicy(
    progressionEvidencePolicyFor({ context: dailyContext, source }),
    profileModifiers
  );
  const forceSupportingStimulus = source === 'block_generated' && progressionEvidencePolicy === 'ineligible';
  const template =
    input.template ??
	    (input.presetId ? getExtraSessionPreset(input.presetId) : null) ??
	    (input.block ? selectNextSessionTemplate(input.block, input.recentSessions, input.today, input.scheduleSelection) : null);
	  const selection = input.block
	    ? getTemplateSelection(input.block, input.recentSessions, input.today, input.scheduleSelection)
    : { status: input.presetId ? 'preset' : 'session_due' };

  if (!template) {
    return {
      id: `generated-session-${input.block?.id ?? 'manual'}-${dateKey(input.today ?? new Date())}`,
      blockId: input.block?.id,
      templateId: input.block ? 'week-complete' : 'manual-empty',
      source,
      title: input.block ? 'This week is complete' : 'No session available',
      focusDomain: input.block?.focusDomain ?? 'strength_power',
      dayLabel: 'Extra',
      estimatedMinutes: 0,
      durationLabel: '0 min',
      readiness,
      painAreas,
      weekStatus: selection.status === 'block_complete' ? 'block_complete' : 'week_complete',
      exercises: [],
      skippedSlots: [],
      skippedSlotReasons: [],
      slotStimulus: [],
      guidance: ['You have finished the planned sessions for this week. An optional extra session can still be generated from presets.'],
      dailyContext,
      progressionEvidencePolicy,
      adjustmentReasons: dailyContext.reasonCodes,
    };
  }

  const goalBiasedTemplate = applyLifeGoalBiasToTemplate(template, input.lifeGoalBias);
  const workingTemplate = applyReadinessToTemplate(goalBiasedTemplate, readiness, painAreas);
  const sessionIntensity = profileModifiers.sessionIntensity;
  const usedExerciseIds = new Set<string>();
  const skippedSlots: string[] = [];
  const skippedSlotReasons: string[] = [];
  const slotStimulus: SlotStimulus[] = [];
  const exercises: GeneratedExercise[] = [];

  for (let index = 0; index < workingTemplate.slots.length; index++) {
    const slot = workingTemplate.slots[index];
    const selected = selectExerciseForSlot({
      slot,
      equipment,
      movementCapabilities,
      painAreas,
      discomfortConstraint,
      dailyContext,
      readiness,
      sessionIntensity,
      ladderProgress: input.ladderProgress ?? {},
      usedExerciseIds,
      collectionExposures: input.collectionExposures ?? [],
      painExcludedLadderIds: new Set((input.painExcludedLadderIds ?? []).map(resolveLadderId)),
      // Preset/manual sessions have no real block; scope mobility-collection
      // variety to a shared pseudo-block instead so repeated Explore use
      // still rotates rather than always landing on the same stretch.
      blockId: input.block?.id ?? (source !== 'block_generated' ? PRESET_COLLECTION_EXPOSURE_SCOPE_ID : undefined),
    });
    if (!selected) {
      const stimulus = skippedSlotStimulus(slot, equipment, movementCapabilities, painAreas);
      skippedSlots.push(slot.id);
      skippedSlotReasons.push(stimulus.message);
      slotStimulus.push(stimulus);
      continue;
    }
    const stimulus = selectedSlotStimulus(slot, selected, equipment, movementCapabilities, forceSupportingStimulus);
    slotStimulus.push(stimulus);
    usedExerciseIds.add(selected.level.id);
    exercises.push(
      toGeneratedExercise({
        slot,
        selected,
        stimulus,
        readiness,
        dailyContext,
        sessionIntensity,
        painAreas,
        restSecondsExtra: profileModifiers.restSecondsExtra,
        profileAdjustmentReasons: profileModifiers.reasonCodes,
        isFirstStrength: exercises.every((e) => e.domain !== 'strength_power'),
        index,
      })
    );
  }

  const estimatedMinutes = estimateSessionMinutes(exercises, readiness, workingTemplate.estimatedMinutes, skippedSlots.length > 0);
  const session: GeneratedSession = {
    id: `generated-session-${input.block?.id ?? source}-${workingTemplate.id}-${dateKey(input.today ?? new Date())}`,
    blockId: input.block?.id,
    templateId: workingTemplate.id,
    source,
    title: titleForReadiness(workingTemplate.title, readiness),
    focusDomain: workingTemplate.focusDomain,
    dayLabel: workingTemplate.dayLabel,
    estimatedMinutes,
    durationLabel: durationLabel(estimatedMinutes, readiness),
    readiness,
    painAreas,
    weekStatus: source === 'preset' ? 'preset' : selection.status === 'block_complete' ? 'block_complete' : 'session_due',
    exercises,
    skippedSlots,
    skippedSlotReasons,
    slotStimulus,
    guidance: guidanceForSession(dailyContext, slotStimulus, { setupDiscomfortApplied }),
    dailyContext,
    progressionEvidencePolicy,
    adjustmentReasons: unique([...dailyContext.reasonCodes, ...profileModifiers.reasonCodes]),
  };
  return session;
}

export function getExtraSessionPreset(id: string): SessionTemplate | null {
  return EXTRA_SESSION_PRESETS.find((p) => p.id === id) ?? null;
}

export function listExtraSessionPresets(): SessionTemplate[] {
  return EXTRA_SESSION_PRESETS.map((p) => ({ ...p, slots: p.slots.slice() }));
}

export function generatePresetSession(
  input: Omit<GenerateSessionInput, 'presetId' | 'source'> & { presetId: string }
): GeneratedSession {
  return generateTodaySession({ ...input, source: 'preset', presetId: input.presetId });
}

export function updateLadderProgressAfterSession(
  previousProgress: Record<string, LadderProgress>,
  completedSession: CompletedGeneratedSession,
  feedback: PostSessionFeedback = {},
  config: ValidTimeProgressionConfig = DEFAULT_VALID_TIME_PROGRESSION_CONFIG
): Record<string, LadderProgress> {
  const next: Record<string, LadderProgress> = { ...previousProgress };
  const completedAt = feedback.completedAt ?? completedSession.completedAt ?? new Date().toISOString();
  const feedbackByLadder = new Map<string, CompletedExerciseResult>();
  for (const result of feedback.exerciseResults ?? []) feedbackByLadder.set(resolveLadderId(result.ladderId), result);

  const seen = new Set<string>();
  for (const baseResult of completedSession.exercises) {
    const ladderId = resolveLadderId(baseResult.ladderId);
    if (seen.has(ladderId)) continue;
    seen.add(ladderId);
    const result = { ...baseResult, ...(feedbackByLadder.get(ladderId) ?? {}) };
    const progress = existingOrInitialProgress(ladderId, result.levelId, previousProgress[ladderId], completedAt);
    const completionRate = clamp01(result.completionRate ?? 1);
    const rpe = result.perceivedEffort ?? feedback.perceivedEffort;
    const pain = result.painReported ?? feedback.painReported ?? false;
    const tracking = result.trackingQuality ?? feedback.trackingQuality ?? 'good';
    const validTimeSignal = config.validTimeProgressionEnabled
      ? result.validTime?.signal ?? 'not_applicable'
      : 'not_applicable';
    const recentCompletionRates = appendRecent(progress.recentCompletionRates, completionRate);
    const recentRpe = rpe ? appendRecent(progress.recentRpe, rpe) : progress.recentRpe;
    const recentPain = appendRecent(progress.recentPain, pain);
    const averageRpe = recentRpe.length > 0 ? mean(recentRpe) : NaN;
    const averageCompletion = mean(recentCompletionRates);

    const ladder = getExerciseLadder(ladderId);
    const linearModel = ladder.progressionModel === 'linear_progression';
    const effective = linearModel
      ? effectiveLevelIdForControlledBetaProgression({ ladder, storedLevelId: progress.currentLevelId })
      : null;
    let currentLevelId = effective?.effectiveLevelId ?? progress.currentLevelId;
    let completedSessionsAtLevel = scopedCompletedSessions(progress);
    let failedSessionsAtLevel = progress.failedSessionsAtLevel;
    let readyToProgress = progress.readyToProgress;
    let transitionEvidenceKey = progress.transitionEvidenceKey;
    const progressionPolicyFingerprint = controlledBetaProgressionPolicyFingerprint();
    let lastProgressionDecisionReason: ProgressionDecisionReason = 'progression_maintained';

    if (tracking === 'poor' || validTimeSignal === 'tracking_uncertain') {
      completedSessionsAtLevel = 0;
      readyToProgress = false;
      transitionEvidenceKey = undefined;
    } else if (
      pain ||
      (Number.isFinite(averageRpe) && averageRpe >= 5) ||
      completionRate < 0.6 ||
      validTimeSignal === 'incomplete'
    ) {
      failedSessionsAtLevel += 1;
      completedSessionsAtLevel = 0;
      readyToProgress = false;
      if (pain || failedSessionsAtLevel >= 2 || averageCompletion < 0.6) {
        const candidate = adjacentLevelId(ladder, currentLevelId, -1);
        const transition = candidate !== currentLevelId
          ? transitionPolicyFor(ladderId, currentLevelId, candidate, 'regression')
          : null;
        if (canApplyTransition(transition, 'regression')) {
          currentLevelId = candidate;
          lastProgressionDecisionReason = 'conservative_regression';
        } else {
          lastProgressionDecisionReason = transitionDecisionReason(ladder, transition, currentLevelId, candidate);
        }
        failedSessionsAtLevel = 0;
      }
      transitionEvidenceKey = undefined;
    } else if (validTimeSignal === 'completed_with_resets') {
      completedSessionsAtLevel = 0;
      failedSessionsAtLevel = 0;
      readyToProgress = false;
      transitionEvidenceKey = undefined;
    } else if (completionRate >= 0.85 && (!Number.isFinite(averageRpe) || averageRpe <= 3)) {
      const candidate = adjacentLevelId(ladder, currentLevelId, 1);
      const transition = candidate !== currentLevelId
        ? transitionPolicyFor(ladderId, currentLevelId, candidate, 'forward')
        : null;
      const evidenceKey = transitionEvidenceKeyFor(transition);
      const scopedCount =
        evidenceKey &&
        progress.transitionEvidenceKey === evidenceKey &&
        progress.progressionPolicyFingerprint === progressionPolicyFingerprint
          ? completedSessionsAtLevel
          : 0;
      if (canCountPositiveEvidence(transition, validTimeSignal)) {
        completedSessionsAtLevel = scopedCount + 1;
        failedSessionsAtLevel = 0;
        transitionEvidenceKey = evidenceKey;
        if (completedSessionsAtLevel >= transition.minimumCreditedExposures && !recentPain.includes(true)) {
          currentLevelId = candidate;
          completedSessionsAtLevel = 0;
          readyToProgress = false;
          transitionEvidenceKey = undefined;
          lastProgressionDecisionReason = 'progression_allowed_transition';
        } else {
          readyToProgress = true;
        }
      } else {
        completedSessionsAtLevel = 0;
        failedSessionsAtLevel = 0;
        readyToProgress = false;
        transitionEvidenceKey = undefined;
        lastProgressionDecisionReason = transitionDecisionReason(ladder, transition, currentLevelId, candidate);
      }
    } else {
      readyToProgress = false;
      failedSessionsAtLevel = 0;
      transitionEvidenceKey = undefined;
    }

    next[ladderId] = {
      ladderId,
      currentLevelId,
      currentLevelIndex: levelIndex(ladderId, currentLevelId),
      recentCompletions: recentCompletionRates.filter((rate) => rate >= 0.85).length,
      recentFailures: recentCompletionRates.filter((rate) => rate < 0.6).length,
      completedSessionsAtLevel,
      failedSessionsAtLevel,
      recentCompletionRates,
      recentRpe,
      recentPain,
      lastRpe: rpe,
      lastPain: pain,
      lastPainArea: feedback.painAreas?.[0],
      lastTrackingQuality: tracking,
      lastCompletedAt: completedAt,
      readyToProgress,
      transitionEvidenceKey,
      progressionPolicyFingerprint,
      lastProgressionDecisionReason,
      updatedAt: completedAt,
    };
  }
  return next;
}

function inferFocusDomain(input: CreateTrainingBlockInput): TrainingDomain {
  if (input.focusDomain) {
    return isScoreDomain(input.focusDomain)
      ? trainingDomainFromScoreDomain(input.focusDomain)
      : input.focusDomain;
  }
  if (input.score?.weakestDomain) return trainingDomainFromScoreDomain(input.score.weakestDomain);
  if (input.domainScores) {
    let weakest: TrainingDomain | null = null;
    let score = Infinity;
    for (const domain of DOMAIN_ORDER) {
      const value = input.domainScores[domain];
      if (typeof value === 'number' && value < score) {
        weakest = domain;
        score = value;
      }
    }
    if (weakest) return weakest;
  }
  return 'strength_power';
}

function isScoreDomain(domain: string): domain is Domain {
  return domain === 'strength' || domain === 'balance' || domain === 'mobility';
}

function strengthTemplates(): SessionTemplate[] {
  return [
    template('strength-A', 'Strength Session A', 'A', 'strength_power', 20, [
      slot('lower-strength-a', 'lower_body_strength', 'Chair-rise strength', 'strength_power', ['sit-to-stand', 'squat']),
      slot('upper-pull-a', 'upper_body_pull', 'Upper-back pull', 'strength_power', ['pull-upper-back']),
      slot('balance-a', 'balance', 'Steady balance', 'balance_stability', ['balance']),
      slot('mobility-a', 'posterior_chain_mobility', 'Back-of-body mobility', 'mobility_flexibility', ['mobility-flexibility']),
    ]),
    template('strength-B', 'Strength Session B', 'B', 'strength_power', 20, [
      slot('lower-strength-b', 'lower_body_strength', 'Stair or squat strength', 'strength_power', ['step-up', 'squat', 'sit-to-stand']),
      slot('upper-push-b', 'upper_body_push', 'Upper-body push', 'strength_power', ['push', 'shoulder-reach-press']),
      slot('lateral-b', 'lateral_stability', 'Side-to-side control', 'balance_stability', ['lateral-stability', 'balance']),
      slot('trunk-b', 'trunk_mobility', 'Trunk mobility', 'mobility_flexibility', ['mobility-flexibility']),
    ]),
    template('strength-C', 'Strength Session C', 'C', 'strength_power', 20, [
      slot('posterior-c', 'posterior_chain', 'Hinge and glutes', 'strength_power', ['hinge-glutes']),
      slot('ankle-c', 'ankle', 'Ankle strength', 'strength_power', ['heel-toe-raise', 'mobility-flexibility']),
      slot('balance-c', 'balance', 'Balance hold', 'balance_stability', ['balance']),
      slot('shoulder-c', 'shoulder_mobility', 'Shoulder reach', 'mobility_flexibility', ['shoulder-reach-press']),
    ]),
  ];
}

function balanceTemplates(): SessionTemplate[] {
  return [
    template('balance-A', 'Balance Session A', 'A', 'balance_stability', 20, [
      slot('balance-a', 'balance', 'Primary balance hold', 'balance_stability', ['balance']),
      slot('lower-a', 'lower_body_strength', 'Chair-rise support', 'strength_power', ['sit-to-stand', 'squat']),
      slot('lateral-a', 'lateral_stability', 'Side-to-side control', 'balance_stability', ['lateral-stability']),
      slot('mobility-a', 'mobility', 'Mobility reset', 'mobility_flexibility', ['mobility-flexibility']),
    ]),
    template('balance-B', 'Balance Session B', 'B', 'balance_stability', 20, [
      slot('dynamic-b', 'dynamic_balance', 'Dynamic balance', 'balance_stability', ['lateral-stability', 'balance']),
      slot('upper-pull-b', 'upper_body_pull', 'Upper-back pull', 'strength_power', ['pull-upper-back']),
      slot('posterior-b', 'posterior_chain', 'Hinge and glutes', 'strength_power', ['hinge-glutes']),
      slot('trunk-b', 'trunk_mobility', 'Trunk mobility', 'mobility_flexibility', ['mobility-flexibility']),
    ]),
    template('balance-C', 'Balance Session C', 'C', 'balance_stability', 20, [
      slot('lateral-c', 'lateral_stability', 'Lateral stability', 'balance_stability', ['lateral-stability']),
      slot('ankle-c', 'ankle', 'Ankle support', 'strength_power', ['heel-toe-raise', 'mobility-flexibility']),
      slot('balance-c', 'balance', 'Balance hold', 'balance_stability', ['balance']),
      slot('hip-c', 'hip_mobility', 'Hip mobility', 'mobility_flexibility', ['mobility-flexibility']),
    ]),
  ];
}

function mobilityTemplates(): SessionTemplate[] {
  return [
    template('mobility-A', 'Mobility Session A', 'A', 'mobility_flexibility', 18, [
      slot('posterior-mob-a', 'posterior_chain_mobility', 'Back-of-body mobility', 'mobility_flexibility', ['mobility-flexibility']),
      slot('lower-a', 'lower_body_strength', 'Chair-rise strength', 'strength_power', ['sit-to-stand', 'squat']),
      slot('balance-a', 'balance', 'Steady balance', 'balance_stability', ['balance']),
      slot('shoulder-a', 'shoulder_mobility', 'Shoulder reach', 'mobility_flexibility', ['shoulder-reach-press']),
    ]),
    template('mobility-B', 'Mobility Session B', 'B', 'mobility_flexibility', 18, [
      slot('trunk-b', 'trunk_mobility', 'Trunk mobility', 'mobility_flexibility', ['mobility-flexibility']),
      slot('shoulder-b', 'shoulder_mobility', 'Shoulder mobility', 'mobility_flexibility', ['shoulder-reach-press']),
      slot('upper-pull-b', 'upper_body_pull', 'Upper-back support', 'strength_power', ['pull-upper-back']),
      slot('lateral-b', 'lateral_stability', 'Lateral stability', 'balance_stability', ['lateral-stability', 'balance']),
    ]),
    template('mobility-C', 'Mobility Session C', 'C', 'mobility_flexibility', 18, [
      slot('hip-c', 'hip_mobility', 'Hip mobility', 'mobility_flexibility', ['mobility-flexibility']),
      slot('ankle-c', 'ankle', 'Ankle mobility', 'mobility_flexibility', ['heel-toe-raise', 'mobility-flexibility']),
      slot('posterior-c', 'posterior_chain', 'Hinge practice', 'strength_power', ['hinge-glutes']),
      slot('balance-c', 'balance', 'Balance hold', 'balance_stability', ['balance']),
    ]),
  ];
}

function template(
  id: string,
  title: string,
  dayLabel: SessionTemplate['dayLabel'],
  focusDomain: TrainingDomain,
  estimatedMinutes: number,
  slots: readonly SessionSlot[],
  source: SessionSource = 'block_generated',
  sourceTemplateId?: string
): SessionTemplate {
  return { id, title, dayLabel, focusDomain, estimatedMinutes, slots, source, sourceTemplateId };
}

function slot(
  id: string,
  type: SessionSlotType,
  title: string,
  domain: TrainingDomain,
  preferredLadderIds: readonly string[]
): SessionSlot {
  return { id, type, title, domain, preferredLadderIds };
}

const EXTRA_SESSION_PRESETS: readonly SessionTemplate[] = [
  template('preset-mobility-reset', '10-Minute Mobility Reset', 'Extra', 'mobility_flexibility', 10, [
    slot('reset-trunk', 'trunk_mobility', 'Trunk mobility', 'mobility_flexibility', ['mobility-flexibility']),
    slot('reset-hip', 'hip_mobility', 'Hip mobility', 'mobility_flexibility', ['mobility-flexibility']),
    slot('reset-shoulder', 'shoulder_mobility', 'Shoulder reach', 'mobility_flexibility', ['shoulder-reach-press']),
  ], 'preset'),
  template('preset-gentle-restart', 'Gentle Restart Session', 'Extra', 'mobility_flexibility', 12, [
    slot('restart-mobility', 'mobility', 'Gentle mobility', 'mobility_flexibility', ['mobility-flexibility']),
    slot('restart-chair', 'lower_body_strength', 'Easy chair strength', 'strength_power', ['sit-to-stand', 'squat']),
    slot('restart-balance', 'balance', 'Steady balance', 'balance_stability', ['balance']),
  ], 'preset'),
  template('preset-steady-balance', 'Steady Balance Practice', 'Extra', 'balance_stability', 15, [
    slot('steady-balance', 'balance', 'Balance hold', 'balance_stability', ['balance']),
    slot('steady-lateral', 'lateral_stability', 'Side-to-side control', 'balance_stability', ['lateral-stability']),
    slot('steady-ankle', 'ankle', 'Ankle support', 'strength_power', ['heel-toe-raise', 'mobility-flexibility']),
  ], 'preset'),
  template('preset-no-equipment-strength', 'Chair + Wall Strength', 'Extra', 'strength_power', 15, [
    slot('noeq-chair', 'lower_body_strength', 'Chair-rise strength', 'strength_power', ['sit-to-stand', 'squat']),
    slot('noeq-push', 'upper_body_push', 'Upper-body push', 'strength_power', ['push', 'shoulder-reach-press']),
    slot('noeq-balance', 'balance', 'Steady balance', 'balance_stability', ['balance']),
    slot('noeq-mobility', 'mobility', 'Mobility reset', 'mobility_flexibility', ['mobility-flexibility', 'shoulder-reach-press']),
  ], 'preset'),
  template('preset-band-upper-back', 'Band Upper-Back', 'Extra', 'strength_power', 15, [
    slot('band-row', 'upper_body_pull', 'Band row', 'strength_power', ['pull-upper-back']),
    slot('band-shoulder', 'shoulder_mobility', 'Shoulder reach', 'mobility_flexibility', ['shoulder-reach-press']),
    slot('band-trunk', 'trunk_mobility', 'Trunk mobility', 'mobility_flexibility', ['mobility-flexibility']),
  ], 'preset'),
  template('preset-stairs-confidence', 'Stairs Confidence', 'Extra', 'strength_power', 15, [
    slot('stairs-step', 'lower_body_strength', 'Step strength', 'strength_power', ['step-up', 'sit-to-stand']),
    slot('stairs-ankle', 'ankle', 'Ankle support', 'strength_power', ['heel-toe-raise']),
    slot('stairs-balance', 'balance', 'Balance hold', 'balance_stability', ['balance']),
  ], 'preset'),
  template('preset-quick-full-body', 'Quick Full-Body Hale Session', 'Extra', 'strength_power', 10, [
    slot('quick-strength', 'lower_body_strength', 'Strength', 'strength_power', ['sit-to-stand', 'squat']),
    slot('quick-balance', 'balance', 'Balance', 'balance_stability', ['balance']),
    slot('quick-mobility', 'mobility', 'Mobility', 'mobility_flexibility', ['mobility-flexibility', 'shoulder-reach-press']),
  ], 'preset'),
];

interface SelectionInput {
  slot: SessionSlot;
  equipment: readonly AvailableEquipment[];
  movementCapabilities: NormalizedMovementCapabilityProfile;
  painAreas: readonly PainArea[];
  discomfortConstraint: DiscomfortConstraint;
  dailyContext: NormalizedDailyTrainingContext;
  readiness: DailyReadiness;
  sessionIntensity: SessionIntensity;
  ladderProgress: Record<string, LadderProgress>;
  usedExerciseIds: Set<string>;
  collectionExposures: readonly CollectionExposure[];
  painExcludedLadderIds: ReadonlySet<string>;
  blockId?: string;
}

interface TrainingProfileModifiers {
  sessionIntensity: SessionIntensity;
  restSecondsExtra: number;
  reasonCodes: readonly DailyTrainingReasonCode[];
}

interface SelectedExercise {
  ladder: ExerciseLadder;
  level: ExerciseLevel;
  def: ExerciseDefinition;
  substitutions: readonly string[];
  requestedLevelId?: string;
  storedLevelId?: string;
  progressionPolicySelectionReason?: ProgressionPolicySelectionReason;
  progressionPolicyDiagnostics?: readonly ProgressionPolicyDiagnosticCode[];
  adjustmentReasons: readonly DailyTrainingReasonCode[];
  collectionSelection?: PlannedCollectionSelection;
}

function trainingProfileModifiers(input: {
  baseSessionIntensity: SessionIntensity;
  safetyProfile?: MovementSafetyProfile | null;
  dailyContext: NormalizedDailyTrainingContext;
}): TrainingProfileModifiers {
  const reasonCodes: DailyTrainingReasonCode[] = [];
  let sessionIntensity = input.baseSessionIntensity;

  if (input.safetyProfile?.activityLevel === 'very_inactive') {
    sessionIntensity = sessionIntensity === 'advanced' ? 'standard' : 'beginner';
    reasonCodes.push('activity_level_gentle_start');
  } else if (
    input.safetyProfile?.activityLevel === 'very_active' &&
    canUseRegularActivityStart(input.dailyContext)
  ) {
    reasonCodes.push('activity_level_regular_start');
  }

  // Age never chooses exercises or levels. The oldest onboarding band only adds
  // a small recovery buffer so a safe, capable plan stays intact.
  const restSecondsExtra =
    typeof input.safetyProfile?.age === 'number' &&
    input.safetyProfile.age >= 75 &&
    input.dailyContext.readiness !== 'short_on_time'
      ? 5
      : 0;
  if (restSecondsExtra > 0) reasonCodes.push('age_recovery_buffer');

  return {
    sessionIntensity,
    restSecondsExtra,
    reasonCodes,
  };
}

function canUseRegularActivityStart(dailyContext: NormalizedDailyTrainingContext): boolean {
  return (
    dailyContext.inputStatus === 'valid' &&
    dailyContext.readiness === 'ready' &&
    !dailyContext.discomfortReported &&
    dailyContext.reasonCodes.includes('readiness_valid')
  );
}

function profileAdjustedProgressionEvidencePolicy(
  basePolicy: ProgressionEvidencePolicy,
  modifiers: TrainingProfileModifiers
): ProgressionEvidencePolicy {
  if (basePolicy !== 'normal') return basePolicy;
  return modifiers.reasonCodes.includes('activity_level_gentle_start') ? 'hold_only' : basePolicy;
}

function selectExerciseForSlot(input: SelectionInput): SelectedExercise | null {
  const allCandidates = unique([
    ...input.slot.preferredLadderIds.map(resolveLadderId),
    ...SLOT_FALLBACK_LADDERS[input.slot.type].map(resolveLadderId),
  ]);
  // Pain-excluded ladders are filtered, never offered; the remaining
  // candidate order backfills the slot so the session keeps its shape.
  const ladderIds = allCandidates.filter((id) => !input.painExcludedLadderIds.has(id));
  const painSwapHappened = ladderIds.length < allCandidates.length;

  for (const ladderId of ladderIds) {
    const ladder = safeLadder(ladderId);
    if (!ladder) continue;
    const selected = selectLevelFromLadder(ladder, input);
    if (selected) {
      const firstPreferred = resolveLadderId(input.slot.preferredLadderIds[0]);
      const substitutions =
        ladderId === firstPreferred
          ? selected.substitutions
          : input.painExcludedLadderIds.has(firstPreferred) && painSwapHappened
            ? painSwapNote(firstPreferred)
            : fallbackReasons(input.slot, selected.ladder, input.equipment);
      return {
        ...selected,
        substitutions,
      };
    }
  }
  return null;
}

/**
 * Plain-language swap notice (§9 script; claims discipline: states what
 * happened, no diagnosis or severity language). Shown wherever the plan
 * surfaces substitution notes; also visible + reversible in Settings.
 */
function painSwapNote(excludedLadderId: string): string[] {
  const ladder = safeLadder(excludedLadderId);
  const name = ladder?.title ?? 'that movement';
  return [
    `We've swapped out ${name} for now because it hurt in two recent sessions. If it keeps bothering you, it's worth mentioning to your doctor. You can bring it back any time in Settings.`,
  ];
}

function selectLevelFromLadder(
  ladder: ExerciseLadder,
  input: SelectionInput
): SelectedExercise | null {
  if (ladder.progressionModel === 'collection') {
    return selectCollectionLevelFromLadder(ladder, input);
  }
  const progress = input.ladderProgress[ladder.id];
  const target = desiredLevelTarget(ladder, progress, input.readiness, input.sessionIntensity, input.dailyContext);
  const order = levelSearchOrder(
    ladder.levels.length,
    target.selectedIndex,
    !target.releaseCapped && canSearchHarderLevels(ladder, input.dailyContext, input.sessionIntensity)
  );
  for (const idx of order) {
    const level = ladder.levels[idx];
    if (!level) continue;
    if (!isExerciseLevelAvailableForRelease(level)) continue;
    if (input.usedExerciseIds.has(level.id) && ladder.levels.length > 1) continue;
    if (
      !deriveFloorExerciseEligibility({
        level,
        ladder,
        availableEquipment: input.equipment,
        movementCapabilities: input.movementCapabilities,
        discomfortConstraint: input.discomfortConstraint,
      }).eligible
    ) continue;
    if (!equipmentSupportsTags(level.equipment, input.equipment)) continue;
    if (isExerciseExcludedByDiscomfort(ladder, level, input.discomfortConstraint)) continue;
    if (!movementCapabilitySupportsLevel(level, input.movementCapabilities)) continue;
    const def = safeExercise(level.id);
    if (!def) continue;
    const substitutions = substitutionsForDailySelection(ladder, target, level);
    return {
      ladder,
      level,
      def,
      substitutions,
      requestedLevelId: target.requestedLevelId,
      storedLevelId: target.storedLevelId,
      progressionPolicySelectionReason: target.selectionReason,
      progressionPolicyDiagnostics: target.diagnostics,
      adjustmentReasons: target.reasons,
    };
  }
  return null;
}

function selectCollectionLevelFromLadder(
  ladder: ExerciseLadder,
  input: SelectionInput
): SelectedExercise | null {
  const result = selectCollectionMember({
    collectionId: ladder.id,
    blockId: input.blockId ?? input.collectionExposures[0]?.blockId ?? '',
    exposures: input.collectionExposures,
    availableEquipment: input.equipment,
    movementCapabilities: input.movementCapabilities,
    discomfortConstraint: input.discomfortConstraint,
    alreadySelectedExerciseIds: input.usedExerciseIds,
  });
  if (!result.available) return null;
  const level = ladder.levels.find((candidate) => candidate.id === result.selectedExerciseId);
  if (!level) return null;
  const def = safeExercise(level.id);
  if (!def) return null;
  return {
    ladder,
    level,
    def,
    substitutions: [],
    requestedLevelId: result.selectedExerciseId,
    storedLevelId: input.ladderProgress[ladder.id]?.currentLevelId,
    progressionPolicySelectionReason: 'explicit_template_member',
    adjustmentReasons: [],
    collectionSelection: plannedCollectionSelectionFromResult(result),
  };
}

function desiredLevelTarget(
  ladder: ExerciseLadder,
  progress: LadderProgress | undefined,
  readiness: DailyReadiness,
  sessionIntensity: SessionIntensity,
  dailyContext: NormalizedDailyTrainingContext
): {
  requestedLevelId: string;
  selectedIndex: number;
  reasons: DailyTrainingReasonCode[];
  releaseCapped: boolean;
  storedLevelId?: string;
  selectionReason: ProgressionPolicySelectionReason;
  diagnostics: readonly ProgressionPolicyDiagnosticCode[];
} {
  const dailyRegression =
    (sessionIntensity === 'beginner' && !progress) ||
    readiness === 'low_energy' ||
    readiness === 'something_hurts' ||
    dailyContext.discomfortReported;
  const effective = effectiveLevelIdForControlledBetaProgression({
    ladder,
    storedLevelId: progress?.currentLevelId ?? ladder.defaultLevelId,
    dailyRegression,
  });
  const reasons = reasonsForProgressionPolicyDiagnostics(effective.diagnostics, readiness, dailyContext);
  return {
    requestedLevelId: effective.requestedLevelId,
    selectedIndex: effective.selectedIndex,
    reasons,
    releaseCapped: effective.diagnostics.includes('release_cap_applied'),
    storedLevelId: effective.storedLevelId,
    selectionReason: effective.selectionReason,
    diagnostics: effective.diagnostics,
  };
}

function canSearchHarderLevels(
  ladder: ExerciseLadder,
  dailyContext: NormalizedDailyTrainingContext,
  sessionIntensity: SessionIntensity
): boolean {
  if (ladder.progressionModel !== 'linear_progression') return false;
  return (
    dailyContext.inputStatus === 'valid' &&
    dailyContext.readiness === 'ready' &&
    !dailyContext.discomfortReported &&
    sessionIntensity !== 'beginner'
  );
}

function reasonsForProgressionPolicyDiagnostics(
  diagnostics: readonly ProgressionPolicyDiagnosticCode[],
  readiness: DailyReadiness,
  dailyContext: NormalizedDailyTrainingContext
): DailyTrainingReasonCode[] {
  const reasons: DailyTrainingReasonCode[] = [];
  if (diagnostics.includes('release_cap_applied')) reasons.push('controlled_beta_release_cap');
  if (diagnostics.includes('auto_progression_cap_applied')) reasons.push('auto_progression_cap');
  if (diagnostics.includes('non_linear_default_selected')) reasons.push('non_linear_default');
  if (diagnostics.includes('legacy_progression_policy_capped')) reasons.push('legacy_progression_policy_capped');
  if (diagnostics.includes('daily_regression_applied')) {
    reasons.push(readiness === 'something_hurts' || dailyContext.discomfortReported ? 'discomfort_reported' : 'reduced_readiness');
  }
  return unique(reasons);
}

function levelSearchOrder(length: number, desiredIndex: number, allowHarder: boolean): number[] {
  const out: number[] = [];
  for (let i = desiredIndex; i >= 0; i--) out.push(i);
  if (allowHarder) {
    for (let i = desiredIndex + 1; i < length; i++) out.push(i);
  }
  return out;
}

function fallbackReasons(
  slot: SessionSlot,
  ladder: ExerciseLadder,
  available: readonly AvailableEquipment[]
): string[] {
  const noBandPull =
    slot.type === 'upper_body_pull' &&
    slot.preferredLadderIds.map(resolveLadderId).includes('pull-upper-back') &&
    ladder.id !== 'pull-upper-back' &&
    !available.includes('resistance_band');
  if (noBandPull) {
    return ['A resistance band is needed for upper-back pulling work. This is supporting shoulder work, not an upper-back pull substitute.'];
  }
  return [`Used ${ladder.title} because ${slot.title.toLowerCase()} needed a safer fit today.`];
}

function substitutionsForDailySelection(
  ladder: ExerciseLadder,
  target: { requestedLevelId?: string; releaseCapped?: boolean },
  level: ExerciseLevel
): string[] {
  if (!target.requestedLevelId || target.requestedLevelId === level.id) return [];
  if (target.releaseCapped) {
    return [`Hale used the closest supported level instead of ${levelName(ladder, target.requestedLevelId)}. Your plan and progress are unchanged.`];
  }
  return [`Adjusted from ${levelName(ladder, target.requestedLevelId)} to ${level.name} for today's setup.`];
}

function beginnerPrescription(input: {
  slot: SessionSlot;
  exercise: ExerciseDefinition;
  level: ExerciseLevel;
  sets: number;
  repsPerSet?: number;
  secondsPerSet?: number;
}): { sets: number; repsPerSet?: number; secondsPerSet?: number } {
  let { sets, repsPerSet, secondsPerSet } = input;
  const id = input.level.id;

  if (input.level.domain === 'strength_power') {
    sets = Math.min(sets, 2);
    if (repsPerSet) {
      if (id === STS_CUSHION_ID) repsPerSet = Math.min(repsPerSet, 8);
      else if (id === STS_STANDARD_ID) repsPerSet = Math.min(repsPerSet, 10);
      else if (input.slot.type === 'upper_body_push') repsPerSet = Math.min(repsPerSet, 8);
      else repsPerSet = Math.min(repsPerSet, 8);
    }
  }

  if (input.level.domain === 'balance_stability') {
    sets = Math.min(sets, 2);
    if (repsPerSet) repsPerSet = Math.min(repsPerSet, 8);
    if (secondsPerSet) secondsPerSet = Math.min(secondsPerSet, 20);
  }

  if (input.level.domain === 'mobility_flexibility') {
    sets = input.exercise.kind === 'rom' || input.exercise.kind === 'timer' ? Math.min(sets, 1) : Math.min(sets, 2);
    if (repsPerSet) repsPerSet = Math.min(repsPerSet, 8);
    if (secondsPerSet) secondsPerSet = Math.max(20, Math.min(secondsPerSet, 30));
  }

  return { sets, repsPerSet, secondsPerSet };
}

function toGeneratedExercise({
  slot,
  selected,
  stimulus,
  readiness,
  dailyContext,
  sessionIntensity,
  painAreas,
  restSecondsExtra,
  profileAdjustmentReasons,
  isFirstStrength,
  index,
}: {
  slot: SessionSlot;
  selected: SelectedExercise;
  stimulus: SlotStimulus;
  readiness: DailyReadiness;
  dailyContext: NormalizedDailyTrainingContext;
  sessionIntensity: SessionIntensity;
  painAreas: readonly PainArea[];
  restSecondsExtra: number;
  profileAdjustmentReasons: readonly DailyTrainingReasonCode[];
  isFirstStrength: boolean;
  index: number;
}): GeneratedExercise {
  const base = selected.def.prescription;
  let sets = base.sets;
  let repsPerSet = base.repsPerSet;
  let secondsPerSet = base.holdSec ?? base.captureSec ?? base.timerSec;
  const doseBeforeAdjustment: GeneratedExerciseDose = { sets, repsPerSet, secondsPerSet };
  const adjustmentReasons: DailyTrainingReasonCode[] = [
    ...dailyContext.reasonCodes,
    ...profileAdjustmentReasons,
    ...selected.adjustmentReasons,
  ];
  const restSeconds = base.restSec + restSecondsExtra;

  if (sessionIntensity === 'beginner') {
    const beginner = beginnerPrescription({
      slot,
      exercise: selected.def,
      level: selected.level,
      sets,
      repsPerSet,
      secondsPerSet,
    });
    sets = beginner.sets;
    repsPerSet = beginner.repsPerSet;
    secondsPerSet = beginner.secondsPerSet;
  }
  if (profileAdjustmentReasons.includes('activity_level_regular_start')) {
    const regular = regularStartPrescription({
      level: selected.level,
      sets,
      repsPerSet,
      secondsPerSet,
    });
    sets = regular.sets;
    repsPerSet = regular.repsPerSet;
    secondsPerSet = regular.secondsPerSet;
  }
  if (readiness === 'short_on_time') {
    sets = Math.min(sets, slot.domain === 'strength_power' ? 2 : 1);
  } else if (readiness === 'low_energy' || readiness === 'something_hurts') {
    sets = Math.max(1, sets - 1);
  }
  if (painAreas.includes('knee') && selected.ladder.id === 'lateral-stability') {
    sets = 1;
    secondsPerSet = secondsPerSet ? Math.min(secondsPerSet, 20) : 20;
  }
  if (readiness === 'a_bit_stiff' && isFirstStrength && selected.level.domain === 'strength_power') {
    if (repsPerSet) repsPerSet = Math.max(4, Math.round(repsPerSet * 0.85));
    if (secondsPerSet) secondsPerSet = Math.max(10, Math.round(secondsPerSet * 0.85));
  }
  // Valid-time targets are instrument settings: daily adjustments may change
  // sets and rest, never the per-set valid-time target — otherwise the plan's
  // promise diverges from what the grader actually measures and completing
  // the promised dose would read as failure evidence.
  if (selected.def.timing?.mode === 'valid_time') {
    secondsPerSet = doseBeforeAdjustment.secondsPerSet;
  }

  return {
    id: `${slot.id}-${selected.level.id}-${index + 1}`,
    exerciseId: selected.level.id,
    ladderId: selected.ladder.id,
    ladderTitle: selected.ladder.title,
    levelId: selected.level.id,
    level: selected.level.level,
    name: selected.level.name,
    slotType: slot.type,
    domain: selected.level.domain,
    kind: selected.def.kind,
    releaseStatus: selected.level.releaseStatus,
    measurementTier: selected.level.measurementTier,
    cameraView: selected.level.cameraView,
    equipment: selected.level.equipment,
    instructions: selected.level.instructions,
    whyItMatters: selected.ladder.whyItMatters,
    sets,
    repsPerSet,
    secondsPerSet,
    restSeconds,
    estimatedMinutes: estimateExerciseMinutes(sets, repsPerSet, secondsPerSet, restSeconds),
    rationale: rationaleFor(slot, selected.ladder, selected.level),
    intendedDomain: slot.domain,
    stimulusRole: stimulus.role,
    stimulusReason: stimulus.reason,
    substitutions: selected.substitutions,
    safetyNotes: safetyNotesFor(selected.level),
    requestedLevelId: selected.requestedLevelId,
    storedLevelId: selected.storedLevelId,
    selectedDailyLevelId: selected.level.id,
    progressionPolicySelectionReason: selected.progressionPolicySelectionReason,
    ...(selected.progressionPolicyDiagnostics && selected.progressionPolicyDiagnostics.length > 0
      ? { progressionPolicyDiagnostics: selected.progressionPolicyDiagnostics }
      : {}),
    doseBeforeAdjustment,
    adjustmentReasons: unique(adjustmentReasons),
    collectionSelection: selected.collectionSelection,
  };
}

function regularStartPrescription(input: {
  level: ExerciseLevel;
  sets: number;
  repsPerSet?: number;
  secondsPerSet?: number;
}): { sets: number; repsPerSet?: number; secondsPerSet?: number } {
  let { sets, repsPerSet, secondsPerSet } = input;
  if (input.level.domain === 'strength_power') {
    sets = Math.min(3, sets + 1);
  } else if (input.level.domain === 'balance_stability') {
    if (secondsPerSet) secondsPerSet = Math.min(30, secondsPerSet + 5);
  }
  return { sets, repsPerSet, secondsPerSet };
}

function applyReadinessToTemplate(
  template: SessionTemplate,
  readiness: DailyReadiness,
  painAreas: readonly PainArea[]
): SessionTemplate {
  let slots = template.slots.slice();
  if (readiness === 'short_on_time') {
    slots = compactShortSession(slots);
  } else if (readiness === 'a_bit_stiff' || readiness === 'something_hurts' || painAreas.length > 0) {
    slots.sort((a, b) => readinessOrder(a, readiness) - readinessOrder(b, readiness));
  }
  return { ...template, slots, estimatedMinutes: readiness === 'short_on_time' ? 10 : template.estimatedMinutes };
}

function applyLifeGoalBiasToTemplate(
  template: SessionTemplate,
  bias: LifeGoalWorkoutBias | null | undefined
): SessionTemplate {
  if (!bias || (bias.preferredLadderIds.length === 0 && bias.preferredSlotTypes.length === 0)) {
    return template;
  }

  const slots = template.slots.map((item) =>
    applyLifeGoalBiasToSlot(item, bias, item.domain === template.focusDomain)
  );
  const anchoredIndex = Math.max(0, slots.findIndex((item) => item.domain === template.focusDomain));
  const anchored = slots[anchoredIndex];
  if (!anchored) return { ...template, slots };

  const rest = slots
    .map((item, index) => ({ item, index }))
    .filter(({ index }) => index !== anchoredIndex)
    .sort((a, b) => lifeGoalSlotRank(a.item, bias) - lifeGoalSlotRank(b.item, bias) || a.index - b.index)
    .map(({ item }) => item);

  return { ...template, slots: [anchored, ...rest] };
}

function applyLifeGoalBiasToSlot(
  slot: SessionSlot,
  bias: LifeGoalWorkoutBias,
  focusDomainSlot: boolean
): SessionSlot {
  const compatible = compatibleLadderIdsForSlot(slot, focusDomainSlot);
  const biased = bias.preferredLadderIds
    .map(resolveLadderId)
    .filter((ladderId) => compatible.includes(ladderId));
  if (biased.length === 0) return slot;

  const preferredLadderIds = unique([
    ...biased,
    ...slot.preferredLadderIds.map(resolveLadderId),
  ]);
  if (sameStrings(preferredLadderIds, slot.preferredLadderIds.map(resolveLadderId))) return slot;
  return { ...slot, preferredLadderIds };
}

function compatibleLadderIdsForSlot(slot: SessionSlot, primaryOnly = false): string[] {
  if (primaryOnly) {
    return unique([
      ...PRIMARY_SLOT_LADDERS[slot.type],
      ...slot.preferredLadderIds.map(resolveLadderId),
    ]);
  }
  return unique([
    ...PRIMARY_SLOT_LADDERS[slot.type],
    ...SUPPORTING_SLOT_LADDERS[slot.type],
    ...SLOT_FALLBACK_LADDERS[slot.type],
    ...slot.preferredLadderIds.map(resolveLadderId),
  ]);
}

function lifeGoalSlotRank(slot: SessionSlot, bias: LifeGoalWorkoutBias): number {
  const slotTypeRank = rankOf(bias.preferredSlotTypes, slot.type);
  const ladderRank = minRank(
    slot.preferredLadderIds.map(resolveLadderId),
    bias.preferredLadderIds.map(resolveLadderId)
  );
  const domainRank = rankOf(
    bias.preferredDomains.map((domain) => TRAINING_DOMAIN_BY_MOVEMENT_DOMAIN[domain]),
    slot.domain
  );
  return Math.min(slotTypeRank, ladderRank, domainRank + 8);
}

function rankOf<T>(items: readonly T[], item: T): number {
  const index = items.indexOf(item);
  return index >= 0 ? index : 1000;
}

function minRank(items: readonly string[], preferred: readonly string[]): number {
  let rank = 1000;
  for (const item of items) rank = Math.min(rank, rankOf(preferred, item));
  return rank;
}

function sameStrings(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((item, index) => item === b[index]);
}

function compactShortSession(slots: readonly SessionSlot[]): SessionSlot[] {
  const out: SessionSlot[] = [];
  const wanted: readonly TrainingDomain[] = ['strength_power', 'balance_stability', 'mobility_flexibility'];
  for (const domain of wanted) {
    const found = slots.find((s) => s.domain === domain && !out.includes(s));
    if (found) out.push(found);
  }
  return out.slice(0, 3);
}

function readinessOrder(slot: SessionSlot, readiness: DailyReadiness): number {
  if (slot.domain === 'mobility_flexibility') return 0;
  if (readiness === 'something_hurts' && slot.domain === 'balance_stability') return 1;
  if (slot.domain === 'balance_stability') return 2;
  return 3;
}

function safetyNotesFor(level: ExerciseLevel): string[] | undefined {
  if (level.equipment.includes('floor')) {
    return ['Use floor exercises only when getting down and back up from the floor feels comfortable today.'];
  }
  if (level.equipment.includes('stair')) {
    return ['Use the lowest stable step with support nearby. Stop if the step, surface, or balance feels unsafe.'];
  }
  if (level.equipment.includes('counter') || level.equipment.includes('wall') || level.equipment.includes('chair')) {
    return ['Keep support nearby and stop if anything feels unsafe.'];
  }
  if (level.measurementTier === 'voice_guided') return ['Move only through a comfortable range.'];
  return undefined;
}

function selectedSlotStimulus(
  slot: SessionSlot,
  selected: SelectedExercise,
  equipment: readonly AvailableEquipment[],
  movementCapabilities: NormalizedMovementCapabilityProfile,
  forceSupportingStimulus = false
): SlotStimulus {
  const naturalRole = selectedStimulusRole(slot, selected);
  const role = forceSupportingStimulus && naturalRole === 'primary' ? 'supporting' : naturalRole;
  const reason = selectedStimulusReason(slot, selected, equipment, movementCapabilities, role);
  return {
    slotId: slot.id,
    slotType: slot.type,
    slotTitle: slot.title,
    intendedDomain: slot.domain,
    role,
    reason,
    message: selectedStimulusMessage(slot, selected, role, reason),
    exerciseId: selected.level.id,
    ladderId: selected.ladder.id,
    levelId: selected.level.id,
    selectedDomain: selected.level.domain,
  };
}

function selectedStimulusRole(slot: SessionSlot, selected: SelectedExercise): SlotStimulusRole {
  const ladderId = selected.ladder.id;
  const firstPreferred = resolveLadderId(slot.preferredLadderIds[0]);
  if (slot.type === 'upper_body_pull' && ladderId !== 'pull-upper-back') return 'invalid';
  if (selected.level.domainRole === 'cross_domain_supporting') return 'supporting';
  if (slot.type === 'balance' && ladderId !== 'balance') return 'supporting';
  if ((slot.type === 'dynamic_balance' || slot.type === 'lateral_stability') && ladderId === 'balance') return 'supporting';
  if (selected.level.domain !== slot.domain) return 'supporting';
  if (firstPreferred === 'step-up' && ladderId !== 'step-up') return 'fallback';
  if (!PRIMARY_SLOT_LADDERS[slot.type].includes(ladderId)) {
    return SUPPORTING_SLOT_LADDERS[slot.type].includes(ladderId) ? 'supporting' : 'fallback';
  }
  if (ladderId !== firstPreferred && selected.substitutions.length > 0) return 'fallback';
  return 'primary';
}

function selectedStimulusReason(
  slot: SessionSlot,
  selected: SelectedExercise,
  equipment: readonly AvailableEquipment[],
  movementCapabilities: NormalizedMovementCapabilityProfile,
  role: SlotStimulusRole
): SlotStimulusReason {
  if (role === 'invalid') return 'no_safe_option';
  if (role === 'supporting') return 'supporting_maintenance';
  if (role === 'primary') {
    if (selected.substitutions.length > 0 && slotHasUnsupportedCapability(slot, equipment, movementCapabilities)) {
      return 'movement_setup_required';
    }
    return selected.substitutions.length > 0 ? 'equipment_limited' : 'direct_match';
  }
  if (slotHasUnsupportedCapability(slot, equipment, movementCapabilities)) return 'movement_setup_required';
  if (slot.type === 'upper_body_pull' && !equipment.includes('resistance_band')) return 'band_required';
  if (resolveLadderId(slot.preferredLadderIds[0]) === 'step-up') return 'stair_support_required';
  if (missingLabelsForSlot(slot, equipment).some((label) => label.includes('floor'))) return 'floor_required';
  if (missingLabelsForSlot(slot, equipment).some((label) => label.includes('support'))) return 'support_required';
  return 'equipment_limited';
}

function selectedStimulusMessage(
  slot: SessionSlot,
  selected: SelectedExercise,
  role: SlotStimulusRole,
  reason: SlotStimulusReason
): string {
  if (role === 'primary') return `${slot.title} matched the intended training stimulus.`;
  if (role === 'fallback') {
    if (reason === 'stair_support_required') {
      return 'A stair drill needs both a stable bottom stair and support nearby, so Hale used a lower-equipment strength option today.';
    }
    if (reason === 'floor_required') {
      return `${slot.title} used ${selected.level.name} because floor space is not marked available.`;
    }
    if (reason === 'movement_setup_required') {
      return `${slot.title} used ${selected.level.name} because a movement setup confirmation is needed first.`;
    }
    return `${slot.title} used ${selected.level.name} as a lower-equipment option today.`;
  }
  if (role === 'supporting') {
    if (slot.type === 'balance') return `${selected.level.name} is supporting balance work, not a static balance-hold progression.`;
    if (slot.type === 'dynamic_balance' || slot.type === 'lateral_stability') {
      return `${selected.level.name} is supporting balance work, not the planned lateral/dynamic stimulus.`;
    }
    if (slot.type === 'upper_body_pull') {
      return `${selected.level.name} is supporting upper-back maintenance, not primary pulling strength.`;
    }
    return `${selected.level.name} is supporting work for ${slot.title.toLowerCase()}, not an equivalent primary stimulus.`;
  }
  return `${slot.title} selected an incompatible stimulus and should be treated as unavailable.`;
}

function skippedSlotStimulus(
  slot: SessionSlot,
  equipment: readonly AvailableEquipment[],
  movementCapabilities: NormalizedMovementCapabilityProfile,
  painAreas: readonly PainArea[]
): SlotStimulus {
  const reason = skippedSlotReasonCode(slot, equipment, movementCapabilities, painAreas);
  return {
    slotId: slot.id,
    slotType: slot.type,
    slotTitle: slot.title,
    intendedDomain: slot.domain,
    role: 'skipped',
    reason,
    message: skippedSlotMessage(slot, reason),
  };
}

function guidanceForSession(
  dailyContext: NormalizedDailyTrainingContext,
  slotStimulus: readonly SlotStimulus[],
  options: { setupDiscomfortApplied?: boolean } = {}
): string[] {
  const { readiness, discomfortAreas } = dailyContext;
  const guidance: string[] = [];
  if (dailyContext.inputStatus === 'malformed_fail_closed') {
    guidance.push('Hale used a cautious supporting plan because today\'s readiness choices could not be read clearly.');
  }
  if (readiness === 'a_bit_stiff') guidance.push('Mobility comes first today, with the first strength item eased back.');
  if (readiness === 'low_energy') {
    if (dailyContext.source === 'planned_restart') {
      guidance.push('Today is planned as a gentle restart.');
    } else if (dailyContext.source === 'plan_preference') {
      guidance.push('Your plan is set to a gentler pace today.');
    } else {
      guidance.push('Sets are reduced today. Keep the effort comfortable.');
    }
  }
  if (readiness === 'short_on_time') guidance.push('This is about 10 minutes, with one strength, one balance, and one mobility item.');
  if (options.setupDiscomfortApplied) {
    guidance.push('Hale used gentler options around the area you marked in setup.');
  } else if (readiness === 'something_hurts' || discomfortAreas.length > 0) {
    guidance.push('Today avoids the area you flagged and keeps the session gentle. Move only in a comfortable range. You can stop at any time.');
  }
  for (const stimulus of slotStimulus) {
    if (stimulus.role === 'primary') continue;
    guidance.push(stimulus.message);
  }
  return guidance;
}

function skippedSlotReasonCode(
  slot: SessionSlot,
  equipment: readonly AvailableEquipment[],
  movementCapabilities: NormalizedMovementCapabilityProfile,
  painAreas: readonly PainArea[]
): SlotStimulusReason {
  if (
    slot.type === 'upper_body_pull' &&
    slot.preferredLadderIds.map(resolveLadderId).includes('pull-upper-back') &&
    !equipment.includes('resistance_band')
  ) {
    return 'band_required';
  }
  if (
    (slot.type === 'balance' || slot.type === 'dynamic_balance' || slot.type === 'lateral_stability') &&
    !hasSupportEquipment(equipment)
  ) {
    return 'support_required';
  }
  const missing = missingLabelsForSlot(slot, equipment);
  if (missing.some((label) => label.includes('floor'))) return 'floor_required';
  if (missing.some((label) => label.includes('bottom stair')) && missing.some((label) => label.includes('support'))) {
    return 'stair_support_required';
  }
  if (missing.some((label) => label.includes('bottom stair')) && slot.preferredLadderIds.map(resolveLadderId).includes('step-up')) {
    return 'stair_support_required';
  }
  if (missing.some((label) => label.includes('support'))) return 'support_required';
  if (missing.some((label) => label.includes('resistance band'))) return 'band_required';
  if (slotHasUnsupportedCapability(slot, equipment, movementCapabilities)) return 'movement_setup_required';
  if (painAreas.length > 0) return 'safety_limited';
  return missing.length > 0 ? 'equipment_limited' : 'no_safe_option';
}

function skippedSlotMessage(slot: SessionSlot, reason: SlotStimulusReason): string {
  if (reason === 'band_required') {
    return 'Upper-back pulling was skipped because it needs a resistance band. Hale did not replace it with shoulder mobility or another movement.';
  }
  if (reason === 'floor_required') {
    return `${slot.title} was skipped because floor space is not marked available.`;
  }
  if (reason === 'support_required') {
    return `${slot.title} was skipped because it needs wall or counter support nearby.`;
  }
  if (reason === 'stair_support_required') {
    return `${slot.title} was skipped because it needs both a stable bottom stair and support nearby.`;
  }
  if (reason === 'movement_setup_required') {
    return `${slot.title} was skipped because movement setup confirmation is needed first.`;
  }
  if (reason === 'safety_limited') {
    return `${slot.title} was skipped because it did not fit today's discomfort settings.`;
  }
  if (reason === 'equipment_limited') {
    return `${slot.title} was skipped because the needed equipment is not marked available.`;
  }
  return `${slot.title} was skipped because it did not fit today's setup.`;
}

function missingLabelsForSlot(slot: SessionSlot, equipment: readonly AvailableEquipment[]): string[] {
  const labels: string[] = [];
  const ladderIds = unique([
    ...slot.preferredLadderIds.map(resolveLadderId),
    ...SLOT_FALLBACK_LADDERS[slot.type].map(resolveLadderId),
  ]);
  for (const ladderId of ladderIds) {
    const ladder = safeLadder(ladderId);
    if (!ladder) continue;
    for (const level of ladder.levels.filter((item) => isExerciseLevelAvailableForRelease(item))) {
      for (const label of equipmentMissingLabels(level.equipment, equipment)) {
        if (!labels.includes(label)) labels.push(label);
      }
    }
  }
  return labels;
}

function slotHasUnsupportedCapability(
  slot: SessionSlot,
  equipment: readonly AvailableEquipment[],
  movementCapabilities: NormalizedMovementCapabilityProfile
): boolean {
  const ladderIds = unique([
    ...slot.preferredLadderIds.map(resolveLadderId),
    ...SLOT_FALLBACK_LADDERS[slot.type].map(resolveLadderId),
  ]);
  for (const ladderId of ladderIds) {
    const ladder = safeLadder(ladderId);
    if (!ladder) continue;
    for (const level of ladder.levels.filter((item) => isExerciseLevelAvailableForRelease(item))) {
      if (!equipmentSupportsTags(level.equipment, equipment)) continue;
      if (movementCapabilityBlockReasonsForLevel(level, movementCapabilities).length > 0) return true;
    }
  }
  return false;
}

function titleForReadiness(title: string, readiness: DailyReadiness): string {
  if (readiness === 'short_on_time') return `Short ${title}`;
  if (readiness === 'something_hurts') return `Gentle ${title}`;
  if (readiness === 'low_energy') return `Steady ${title}`;
  return title;
}

function rationaleFor(slot: SessionSlot, ladder: ExerciseLadder, level: ExerciseLevel): string {
  return `${slot.title}: ${level.name} from the ${ladder.title} ladder.`;
}

function estimateExerciseMinutes(sets: number, reps?: number, seconds?: number, restSeconds = 30): number {
  const activeSec = seconds ?? (reps ? reps * 4 : 30);
  const totalSec = sets * activeSec + Math.max(0, sets - 1) * restSeconds + 20;
  return Math.max(1, Math.ceil(totalSec / 60));
}

function estimateSessionMinutes(
  exercises: readonly GeneratedExercise[],
  readiness: DailyReadiness,
  templateMinutes: number,
  hasSkippedSlots = false
): number {
  if (readiness === 'short_on_time') return 10;
  if (exercises.length === 0) return 0;
  const estimated = sum(exercises.map((e) => e.estimatedMinutes)) + Math.max(1, exercises.length - 1);
  const cappedEstimate = Math.min(templateMinutes, estimated);
  // A normal, fully-filled session floors at ~12 min even if per-exercise
  // math undershoots. But when equipment/pain limits skipped one or more
  // slots, that floor would overstate what the user is actually about to
  // do, so an honest (still template-capped) estimate is used instead.
  if (hasSkippedSlots) return Math.max(1, cappedEstimate);
  return Math.max(cappedEstimate, Math.min(templateMinutes, 12));
}

function durationLabel(minutes: number, readiness: DailyReadiness): string {
  if (readiness === 'short_on_time') return 'About 10 min';
  return `${minutes} min`;
}

/**
 * Seeds a brand-new ladder's starting level from a MEASURED capability value
 * (chair-stand reps for strength; single-leg hold seconds for balance) —
 * never from the user's age (age never chooses exercises or levels). Only
 * steps one level away from the ladder's catalog default, only onto a
 * v1_core level (adjacentLevelId already excludes v1_optional), and never
 * overwrites a ladder that already has progress — training-earned progress
 * always wins over a fresh check-up guess.
 *
 * Source-agnostic on purpose: both the legacy CheckUpScore battery and the
 * Movement Profile V2 protocol measure the same chair-stand reps / single-leg
 * hold seconds, just through different result shapes — see
 * initialLadderProgressFromCheckUp (V1) and the V2 call site in App.tsx,
 * which both funnel their raw values through this one function.
 *
 * Mobility has no leveled ladder to seed (mobility-flexibility is a
 * rotation collection, not a linear progression), so it is intentionally
 * not calibrated here.
 */
export function initialLadderProgressFromMeasuredCapability(input: {
  previousLadderProgress: Record<string, LadderProgress>;
  chairStandReps?: number | null;
  singleLegHoldSec?: number | null;
  nowIso: string;
}): Record<string, LadderProgress> {
  const next = { ...input.previousLadderProgress };
  seedLadderFromMeasuredValue({
    next,
    ladderId: STRENGTH_CALIBRATION_LADDER_ID,
    value: input.chairStandReps,
    nowIso: input.nowIso,
    direction: (value) => {
      if (value <= STRENGTH_CALIBRATION_LOW_REPS) return -1;
      if (value >= STRENGTH_CALIBRATION_HIGH_REPS) return 1;
      return 0;
    },
  });
  seedLadderFromMeasuredValue({
    next,
    ladderId: BALANCE_CALIBRATION_LADDER_ID,
    value: input.singleLegHoldSec,
    nowIso: input.nowIso,
    // The balance ladder's default is already its easiest level, so there is
    // no gentler level to seed a weak result into; only a strong hold moves
    // the starting point.
    direction: (value) => (value >= BALANCE_CALIBRATION_HIGH_HOLD_SEC ? 1 : 0),
  });
  return next;
}

/** V1 CheckUpScore convenience wrapper around initialLadderProgressFromMeasuredCapability. */

function seedLadderFromMeasuredValue(input: {
  next: Record<string, LadderProgress>;
  ladderId: string;
  value: number | null | undefined;
  nowIso: string;
  direction: (value: number) => -1 | 0 | 1;
}): void {
  if (input.next[input.ladderId]) return;
  if (typeof input.value !== 'number' || !Number.isFinite(input.value)) return;
  const direction = input.direction(input.value);
  if (direction === 0) return;
  const ladder = safeLadder(input.ladderId);
  if (!ladder || ladder.progressionModel !== 'linear_progression') return;
  const seededLevelId = adjacentLevelId(ladder, ladder.defaultLevelId, direction);
  if (seededLevelId === ladder.defaultLevelId) return;
  input.next[input.ladderId] = {
    ladderId: input.ladderId,
    currentLevelId: seededLevelId,
    currentLevelIndex: levelIndex(input.ladderId, seededLevelId),
    completedSessionsAtLevel: 0,
    failedSessionsAtLevel: 0,
    recentCompletionRates: [],
    recentRpe: [],
    recentPain: [],
    updatedAt: input.nowIso,
  };
}

function existingOrInitialProgress(
  ladderId: string,
  levelId: string | undefined,
  existing: LadderProgress | undefined,
  nowIso: string
): LadderProgress {
  if (existing) return existing;
  const ladder = getExerciseLadder(ladderId);
  return {
    ladderId,
    currentLevelId: ladder.progressionModel === 'linear_progression' ? levelId ?? ladder.defaultLevelId : ladder.defaultLevelId,
    completedSessionsAtLevel: 0,
    failedSessionsAtLevel: 0,
    recentCompletionRates: [],
    recentRpe: [],
    recentPain: [],
    updatedAt: nowIso,
  };
}

function adjacentLevelId(ladder: ExerciseLadder, currentLevelId: string, direction: -1 | 1): string {
  const start = Math.max(0, ladder.levels.findIndex((level) => level.id === currentLevelId));
  if (direction > 0) {
    for (let idx = start + 1; idx < ladder.levels.length; idx++) {
      const candidate = ladder.levels[idx];
      if (candidate && isExerciseLevelAvailableForRelease(candidate)) return candidate.id;
    }
  } else {
    for (let idx = start - 1; idx >= 0; idx--) {
      const candidate = ladder.levels[idx];
      if (candidate && isExerciseLevelAvailableForRelease(candidate)) return candidate.id;
    }
  }
  return currentLevelId;
}

function scopedCompletedSessions(progress: LadderProgress): number {
  return progress.progressionPolicyFingerprint === controlledBetaProgressionPolicyFingerprint()
    ? progress.completedSessionsAtLevel
    : 0;
}

function canApplyTransition(
  transition: LadderTransitionPolicy | null,
  direction: 'forward' | 'regression'
): transition is LadderTransitionPolicy {
  if (!transition || transition.direction !== direction || !transition.controlledBetaAllowed) return false;
  return transition.status === 'allowed_generic' || transition.status === 'allowed_strong_valid_time';
}

function canCountPositiveEvidence(
  transition: LadderTransitionPolicy | null,
  validTimeSignal: ValidTimeProgressionSummary['signal'] | 'not_applicable'
): transition is LadderTransitionPolicy {
  if (!canApplyTransition(transition, 'forward')) return false;
  if (transition.requiredEvidence.includes('strong_valid_time')) return validTimeSignal === 'strong';
  if (transition.requiredEvidence.includes('generic_easy_exposure')) {
    return validTimeSignal !== 'completed_with_resets' &&
      validTimeSignal !== 'incomplete' &&
      validTimeSignal !== 'tracking_uncertain';
  }
  return true;
}

function transitionDecisionReason(
  ladder: ExerciseLadder,
  transition: LadderTransitionPolicy | null,
  fromLevelId: string,
  toLevelId: string
): ProgressionDecisionReason {
  if (ladder.progressionModel !== 'linear_progression') return 'non_linear_progression_model';
  if (fromLevelId === toLevelId) return 'auto_progression_cap_reached';
  if (!transition) return 'transition_not_auto_approved';
  if (transition.status === 'blocked_non_linear_model') return 'non_linear_progression_model';
  if (transition.status === 'blocked_pending_device_validation') return 'device_validation_required';
  if (transition.status === 'blocked_pending_domain_review') return 'domain_review_required';
  if (transition.status === 'blocked_manual_only') return 'manual_only_transition';
  return 'transition_not_auto_approved';
}

function levelIndex(ladderId: string, currentLevelId: string): number {
  const ladder = getExerciseLadder(ladderId);
  return Math.max(0, ladder.levels.findIndex((level) => level.id === currentLevelId));
}

function levelName(ladder: ExerciseLadder, levelId: string): string {
  return ladder.levels.find((level) => level.id === levelId)?.name ?? 'the current level';
}

function equipmentFromInput(input: GenerateSessionInput): readonly AvailableEquipment[] {
  const equipment = input.availableEquipment ?? input.safetyProfile?.availableEquipment;
  if (equipment && equipment.length > 0) return equipment;
  return [];
}

function movementCapabilitiesFromInput(input: GenerateSessionInput): NormalizedMovementCapabilityProfile {
  return input.movementCapabilities
    ? normalizeMovementCapabilityProfile(input.movementCapabilities, { source: 'local_user' })
    : movementCapabilitiesFromSafetyProfile(input.safetyProfile);
}

function resolveLadderId(id: string): string {
  return LADDER_ALIASES[id] ?? id.replace(/_/g, '-');
}

function safeLadder(id: string): ExerciseLadder | null {
  try {
    return getExerciseLadder(resolveLadderId(id));
  } catch {
    return null;
  }
}

function safeExercise(id: string): ExerciseDefinition | null {
  try {
    return getExercise(id);
  } catch {
    return null;
  }
}

function trainingWeekNumber(block: TrainingBlock, today: string | Date): number {
  const start = new Date(block.startDate).getTime();
  const now = new Date(today).getTime();
  const days = Math.max(0, Math.floor((now - start) / 86_400_000));
  return Math.min(block.weeks, Math.floor(days / 7) + 1);
}

function uniqueCompletedWeekTemplates(
  block: TrainingBlock,
  sessions: readonly RecentSessionSummary[]
): Set<string> {
  const out = new Set<string>();
  for (const session of sessions) {
    if (session.status === 'skipped') continue;
    if (!session.templateId) continue;
    const completedAt = new Date(session.completedAt);
    if (Number.isNaN(completedAt.getTime())) continue;
    out.add(`${trainingWeekNumber(block, completedAt)}:${session.templateId}`);
  }
  return out;
}

function templateIdFromPlannedDate(plannedDate: string | undefined): string | undefined {
  if (!plannedDate) return undefined;
  const [templateId] = plannedDate.split(':');
  return templateId && templateId.trim().length > 0 ? templateId : undefined;
}

function iso(value: string | Date): string {
  return typeof value === 'string' ? new Date(value).toISOString() : value.toISOString();
}

function addDaysIso(value: string, days: number): string {
  return addDays(new Date(value), days).toISOString();
}

function addDays(value: Date, days: number): Date {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function dateKey(value: string | Date): string {
  return iso(value).slice(0, 10);
}

function unique<T>(xs: readonly T[]): T[] {
  const out: T[] = [];
  for (const x of xs) {
    if (!out.includes(x)) out.push(x);
  }
  return out;
}

function appendRecent<T>(xs: readonly T[], value: T): readonly T[] {
  return xs.concat(value).slice(-MAX_RECENT);
}

function mean(xs: readonly number[]): number {
  if (xs.length === 0) return NaN;
  return sum(xs) / xs.length;
}

function sum(xs: readonly number[]): number {
  let total = 0;
  for (const x of xs) total += x;
  return total;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

// Makes sure the alias table stays honest as ladders evolve.
for (const ladder of listExerciseLadders()) {
  LADDER_ALIASES[ladder.id] = ladder.id;
}
