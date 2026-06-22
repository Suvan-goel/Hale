import {
  getExercise,
  getExerciseLadder,
  listExerciseLadders,
  type ExerciseDefinition,
  type ExerciseKind,
  type ExerciseLadder,
  type ExerciseLevel,
  type MeasurementTier,
  type ReleaseStatus,
} from '../exercises';
import type { AvailableEquipment, MovementSafetyProfile } from '../adherence';
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
  updatedAt: string;
}

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
  scheduleSelection?: TemplateSelectionSchedule;
  source?: SessionSource;
  includeOptionalLevels?: boolean;
  sessionIntensity?: SessionIntensity;
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
  selectedDailyLevelId?: string;
  doseBeforeAdjustment?: GeneratedExerciseDose;
  adjustmentReasons?: readonly DailyTrainingReasonCode[];
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
  const dailyContext = normalizeDailyTrainingContext({
    readiness: input.dailyReadiness,
    painAreas: input.painAreas,
    source: input.dailyContextSource ?? 'user_daily_check',
    readinessOptional: true,
  });
  const readiness = dailyContext.readiness;
  const painAreas = dailyContext.discomfortAreas;
  const discomfortConstraint = discomfortConstraintForContext(dailyContext);
  const equipment = equipmentFromInput(input);
  const movementCapabilities = movementCapabilitiesFromInput(input);
  const source: SessionSource = input.presetId ? 'preset' : input.source ?? 'block_generated';
  const progressionEvidencePolicy = progressionEvidencePolicyFor({ context: dailyContext, source });
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

  const workingTemplate = applyReadinessToTemplate(template, readiness, painAreas);
  const sessionIntensity = input.sessionIntensity ?? 'standard';
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
      includeOptionalLevels: input.includeOptionalLevels ?? false,
      usedExerciseIds,
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
        isFirstStrength: exercises.every((e) => e.domain !== 'strength_power'),
        index,
      })
    );
  }

  const estimatedMinutes = estimateSessionMinutes(exercises, readiness, workingTemplate.estimatedMinutes);
  return {
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
    guidance: guidanceForSession(dailyContext, slotStimulus),
    dailyContext,
    progressionEvidencePolicy,
    adjustmentReasons: dailyContext.reasonCodes,
  };
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

    let currentLevelId = progress.currentLevelId;
    let completedSessionsAtLevel = progress.completedSessionsAtLevel;
    let failedSessionsAtLevel = progress.failedSessionsAtLevel;
    let readyToProgress = progress.readyToProgress;

    if (tracking === 'poor' || validTimeSignal === 'tracking_uncertain') {
      completedSessionsAtLevel = 0;
      readyToProgress = false;
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
        currentLevelId = adjacentLevelId(ladderId, currentLevelId, -1);
        failedSessionsAtLevel = 0;
      }
    } else if (validTimeSignal === 'completed_with_resets') {
      completedSessionsAtLevel = 0;
      failedSessionsAtLevel = 0;
      readyToProgress = false;
    } else if (completionRate >= 0.85 && (!Number.isFinite(averageRpe) || averageRpe <= 3)) {
      completedSessionsAtLevel += 1;
      failedSessionsAtLevel = 0;
      if (completedSessionsAtLevel >= 2 && !recentPain.includes(true)) {
        currentLevelId = adjacentLevelId(ladderId, currentLevelId, 1);
        completedSessionsAtLevel = 0;
        readyToProgress = false;
      } else {
        readyToProgress = true;
      }
    } else {
      readyToProgress = false;
      failedSessionsAtLevel = 0;
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
  source: SessionSource = 'block_generated'
): SessionTemplate {
  return { id, title, dayLabel, focusDomain, estimatedMinutes, slots, source };
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
  includeOptionalLevels: boolean;
  usedExerciseIds: Set<string>;
}

interface SelectedExercise {
  ladder: ExerciseLadder;
  level: ExerciseLevel;
  def: ExerciseDefinition;
  substitutions: readonly string[];
  requestedLevelId?: string;
  adjustmentReasons: readonly DailyTrainingReasonCode[];
}

function selectExerciseForSlot(input: SelectionInput): SelectedExercise | null {
  const ladderIds = unique([
    ...input.slot.preferredLadderIds.map(resolveLadderId),
    ...SLOT_FALLBACK_LADDERS[input.slot.type].map(resolveLadderId),
  ]);

  for (const ladderId of ladderIds) {
    const ladder = safeLadder(ladderId);
    if (!ladder) continue;
    const selected = selectLevelFromLadder(ladder, input);
    if (selected) {
      const firstPreferred = resolveLadderId(input.slot.preferredLadderIds[0]);
      const substitutions =
        ladderId === firstPreferred
          ? selected.substitutions
          : fallbackReasons(input.slot, selected.ladder, input.equipment);
      return {
        ...selected,
        substitutions,
      };
    }
  }
  return null;
}

function selectLevelFromLadder(
  ladder: ExerciseLadder,
  input: SelectionInput
): SelectedExercise | null {
  const progress = input.ladderProgress[ladder.id];
  const target = desiredLevelTarget(ladder, progress, input.readiness, input.sessionIntensity, input.dailyContext);
  const order = levelSearchOrder(
    ladder.levels.length,
    target.selectedIndex,
    canSearchHarderLevels(ladder, input.dailyContext, input.sessionIntensity)
  );
  for (const idx of order) {
    const level = ladder.levels[idx];
    if (!level) continue;
    if (!releaseVisible(level.releaseStatus, input.includeOptionalLevels)) continue;
    if (input.usedExerciseIds.has(level.id) && ladder.levels.length > 1) continue;
    if (!equipmentSupportsTags(level.equipment, input.equipment)) continue;
    if (isExerciseExcludedByDiscomfort(ladder, level, input.discomfortConstraint)) continue;
    if (!movementCapabilitySupportsLevel(level, input.movementCapabilities)) continue;
    const def = safeExercise(level.id);
    if (!def) continue;
    const substitutions =
      target.requestedLevelId && target.requestedLevelId !== level.id
        ? [`Adjusted from ${levelName(ladder, target.requestedLevelId)} to ${level.name} for today's setup.`]
        : [];
    return {
      ladder,
      level,
      def,
      substitutions,
      requestedLevelId: target.requestedLevelId,
      adjustmentReasons: target.reasons,
    };
  }
  return null;
}

function desiredLevelTarget(
  ladder: ExerciseLadder,
  progress: LadderProgress | undefined,
  readiness: DailyReadiness,
  sessionIntensity: SessionIntensity,
  dailyContext: NormalizedDailyTrainingContext
): { requestedLevelId: string; selectedIndex: number; reasons: DailyTrainingReasonCode[] } {
  const desiredId = progress?.currentLevelId ?? ladder.defaultLevelId;
  let idx = Math.max(0, ladder.levels.findIndex((level) => level.id === desiredId));
  const requestedLevelId = ladder.levels[idx]?.id ?? ladder.defaultLevelId;
  const reasons: DailyTrainingReasonCode[] = [];
  if (sessionIntensity === 'beginner' && !progress && idx > 0) idx -= 1;
  if ((readiness === 'low_energy' || readiness === 'something_hurts' || dailyContext.discomfortReported) && idx > 0) {
    idx -= 1;
    reasons.push(readiness === 'something_hurts' || dailyContext.discomfortReported ? 'discomfort_reported' : 'reduced_readiness');
  }
  return { requestedLevelId, selectedIndex: idx, reasons };
}

function canSearchHarderLevels(
  ladder: ExerciseLadder,
  dailyContext: NormalizedDailyTrainingContext,
  sessionIntensity: SessionIntensity
): boolean {
  if (ladder.progressionModel !== 'linear_progression') return true;
  return (
    dailyContext.inputStatus === 'valid' &&
    dailyContext.readiness === 'ready' &&
    !dailyContext.discomfortReported &&
    sessionIntensity !== 'beginner'
  );
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
      if (id.includes('sts-cushion')) repsPerSet = Math.min(repsPerSet, 8);
      else if (id.includes('sts-standard')) repsPerSet = Math.min(repsPerSet, 10);
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
  isFirstStrength: boolean;
  index: number;
}): GeneratedExercise {
  const base = selected.def.prescription;
  let sets = base.sets;
  let repsPerSet = base.repsPerSet;
  let secondsPerSet = base.holdSec ?? base.captureSec ?? base.timerSec;
  const doseBeforeAdjustment: GeneratedExerciseDose = { sets, repsPerSet, secondsPerSet };
  const adjustmentReasons: DailyTrainingReasonCode[] = [...dailyContext.reasonCodes, ...selected.adjustmentReasons];

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
    restSeconds: base.restSec,
    estimatedMinutes: estimateExerciseMinutes(sets, repsPerSet, secondsPerSet, base.restSec),
    rationale: rationaleFor(slot, selected.ladder, selected.level),
    intendedDomain: slot.domain,
    stimulusRole: stimulus.role,
    stimulusReason: stimulus.reason,
    substitutions: selected.substitutions,
    safetyNotes: safetyNotesFor(selected.level),
    requestedLevelId: selected.requestedLevelId,
    selectedDailyLevelId: selected.level.id,
    doseBeforeAdjustment,
    adjustmentReasons: unique(adjustmentReasons),
  };
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

function releaseVisible(status: ReleaseStatus, includeOptional: boolean): boolean {
  if (status === 'v1_core') return true;
  if (status === 'v1_optional') return includeOptional;
  return false;
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
  slotStimulus: readonly SlotStimulus[]
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
  if (readiness === 'something_hurts' || discomfortAreas.length > 0) {
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
    for (const level of ladder.levels.filter((item) => releaseVisible(item.releaseStatus, false))) {
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
    for (const level of ladder.levels.filter((item) => releaseVisible(item.releaseStatus, false))) {
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
  templateMinutes: number
): number {
  if (readiness === 'short_on_time') return 10;
  const estimated = sum(exercises.map((e) => e.estimatedMinutes)) + Math.max(1, exercises.length - 1);
  return Math.max(Math.min(templateMinutes, estimated), Math.min(templateMinutes, 12));
}

function durationLabel(minutes: number, readiness: DailyReadiness): string {
  if (readiness === 'short_on_time') return 'About 10 min';
  return `${minutes} min`;
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
    currentLevelId: levelId ?? ladder.defaultLevelId,
    completedSessionsAtLevel: 0,
    failedSessionsAtLevel: 0,
    recentCompletionRates: [],
    recentRpe: [],
    recentPain: [],
    updatedAt: nowIso,
  };
}

function adjacentLevelId(ladderId: string, currentLevelId: string, direction: -1 | 1): string {
  const ladder = getExerciseLadder(ladderId);
  const idx = Math.max(0, ladder.levels.findIndex((level) => level.id === currentLevelId));
  const nextIdx = Math.min(Math.max(0, idx + direction), ladder.levels.length - 1);
  return ladder.levels[nextIdx].id;
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
