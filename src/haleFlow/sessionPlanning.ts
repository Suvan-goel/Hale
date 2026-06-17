import {
  blockProgress,
  getAdherenceState,
  type AdherenceState,
  type AvailableEquipment,
  type LifeGoal,
  type MovementAssessment,
  type MovementBlock,
  type MovementDomain,
  type MovementSafetyProfile,
  type TrainingSessionCompletion,
  type TrainingSessionCompletionType,
} from '../adherence';
import { domainLabel } from '../adherence/goalDomainMapping';
import {
  getExercise,
  getExerciseLadder,
  hasExercise,
  type ExerciseDefinition,
  type ExerciseLevel,
} from '../exercises';
import type { EquipmentTag } from '../movements';
import type { HaleLifecycleState } from './appLifecycle';
import {
  DEFAULT_EQUIPMENT,
  nextSessionExercises,
  type PersistedGeneratedSessionSummary,
  type PersistedPostSessionFeedback,
  type EquipmentProfile,
  type TrainingState,
  type TrainingSessionResult,
} from '../training';
import {
  type CompletedExerciseResult,
  createSessionTemplatesForFocus,
  generateTodaySession as generateDynamicTodaySession,
  updateLadderProgressAfterSession,
  type DailyReadiness,
  type GeneratedExercise,
  type GeneratedSession,
  type GenerateSessionInput,
  type LadderProgress,
  type PainArea,
  type PostSessionFeedback,
  type SessionSource,
  type SessionIntensity,
  type SessionTemplate,
  type TrackingQuality,
  type TrainingBlock as DynamicTrainingBlock,
  type TrainingDomain,
} from '../training/workoutGeneration';
import { getSessionIntroCopy } from './copy';
import { dayLabelForPlanSessionId, type PlanSessionId } from './sessionIds';
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
  painAreas?: readonly PainArea[];
  ladderProgress?: Record<string, LadderProgress>;
  today?: string | Date;
  presetId?: string;
  targetSessionTemplateId?: PlanSessionId | string;
  source?: SessionSource;
  includeOptionalLevels?: boolean;
  sessionIntensity?: SessionIntensity;
  generateSession?: (input: GenerateSessionInput) => GeneratedSession;
}

export interface PlanLadderPracticeSessionInput {
  ladderId: string;
  safetyProfile?: MovementSafetyProfile | null;
  lifeGoal?: LifeGoal | null;
  activeBlock?: MovementBlock | null;
  training?: TrainingState | null;
  ladderProgress?: Record<string, LadderProgress>;
  today?: string | Date;
}

export function planTodayHaleSession(input: PlanTodayHaleSessionInput): HaleSessionPlan {
  const sessionType = sessionTypeFor(input);
  const readiness = readinessFor(input, sessionType);
  const painAreas = painAreasFor(input);
  const presetId = presetIdFor(input, sessionType);
  const activeBlock = input.activeBlock ?? null;

  if (activeBlock) {
    try {
      const dynamicBlock = toDynamicTrainingBlock(activeBlock);
      const targetTemplate = targetTemplateFor(dynamicBlock, input.targetSessionTemplateId, presetId);
      const generated = (input.generateSession ?? generateDynamicTodaySession)({
        block: dynamicBlock,
        template: targetTemplate,
        presetId,
        safetyProfile: input.safetyProfile,
        availableEquipment: availableEquipmentFor(input),
        dailyReadiness: readiness,
        painAreas,
        ladderProgress: input.ladderProgress ?? input.training?.ladderProgressById ?? {},
        recentSessions: recentSessionsFor(input),
        today: input.today,
        source: input.source,
        includeOptionalLevels: input.includeOptionalLevels,
        sessionIntensity: input.sessionIntensity,
      });
      const adapted = adaptGeneratedSessionToHaleSessionPlan(generated, {
        activeBlock,
        lifeGoal: input.lifeGoal,
        sessionType,
      });
      const validation = validatePlayableExerciseIds(adapted.exercises);
      if (adapted.exercises.length > 0 && validation.ok) return adapted;
      return legacyFallbackPlan({
        ...input,
        activeBlock,
        sessionType,
        reason:
          adapted.exercises.length === 0
            ? 'generated session had no playable exercises'
            : `generated session included unsupported exercise ids: ${validation.unsupported.join(', ')}`,
      });
    } catch (error) {
      return legacyFallbackPlan({
        ...input,
        activeBlock,
        sessionType,
        reason: error instanceof Error ? error.message : 'dynamic session generation threw',
      });
    }
  }

  if (presetId) {
    try {
      const generated = (input.generateSession ?? generateDynamicTodaySession)({
        block: null,
        presetId,
        safetyProfile: input.safetyProfile,
        availableEquipment: availableEquipmentFor(input),
        dailyReadiness: readiness,
        painAreas,
        ladderProgress: input.ladderProgress ?? input.training?.ladderProgressById ?? {},
        recentSessions: recentSessionsFor(input),
        today: input.today,
        source: input.source,
        includeOptionalLevels: input.includeOptionalLevels,
        sessionIntensity: input.sessionIntensity,
      });
      const adapted = adaptGeneratedSessionToHaleSessionPlan(generated, {
        activeBlock: placeholderBlockForGenerated(generated, input.today),
        lifeGoal: input.lifeGoal,
        sessionType,
      });
      const validation = validatePlayableExerciseIds(adapted.exercises);
      if (adapted.exercises.length > 0 && validation.ok) return adapted;
      return legacyFallbackPlan({
        ...input,
        sessionType,
        reason:
          adapted.exercises.length === 0
            ? 'generated preset had no playable exercises'
            : `generated preset included unsupported exercise ids: ${validation.unsupported.join(', ')}`,
      });
    } catch (error) {
      return legacyFallbackPlan({
        ...input,
        sessionType,
        reason: error instanceof Error ? error.message : 'preset session generation threw',
      });
    }
  }

  return legacyFallbackPlan({
    ...input,
    sessionType,
    reason: 'no active movement block available for dynamic planning',
  });
}

export function planLadderPracticeSession(input: PlanLadderPracticeSessionInput): HaleSessionPlan | null {
  let ladder;
  try {
    ladder = getExerciseLadder(input.ladderId);
  } catch {
    return null;
  }
  if (ladder.releaseStatus !== 'v1_core') return null;
  const coreLevels = ladder.levels.filter((level) => level.releaseStatus === 'v1_core');
  if (coreLevels.length === 0) return null;
  const progress = (input.ladderProgress ?? input.training?.ladderProgressById ?? {})[ladder.id];
  const preferred = coreLevels.find((level) => level.id === progress?.currentLevelId) ??
    coreLevels.find((level) => level.id === ladder.defaultLevelId) ??
    coreLevels[0];
  const available = availableEquipmentFor(input);
  const level = practiceLevelFor(coreLevels, preferred, available);
  if (!level || !hasExercise(level.id)) return null;
  const definition = getExercise(level.id);
  const exercise = toPracticeHaleExercise(ladder.id, ladder.title, ladder.whyItMatters, level, definition);
  const today = input.today ?? new Date();
  const activeBlock = input.activeBlock ?? placeholderBlockForPractice(ladder.id, level, today);
  const focusDomain = toMovementDomain(level.domain);
  return {
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
      generatedExercises: [
        {
          exerciseId: exercise.id,
          ladderId: ladder.id,
          levelId: level.id,
          sets: exercise.targetSets,
          repsPerSet: exercise.targetReps,
          secondsPerSet: exercise.durationSeconds,
          measurementTier: exercise.measurementTier,
        },
      ],
    },
  };
}

export function adaptGeneratedSessionToHaleSessionPlan(
  generated: GeneratedSession,
  {
    activeBlock,
    lifeGoal,
    sessionType,
  }: {
    activeBlock: MovementBlock;
    lifeGoal?: LifeGoal | null;
    sessionType: TrainingSessionCompletionType;
  }
): HaleSessionPlan {
  const exercises = generated.exercises.map((exercise) => toHaleExercise(exercise));
  return {
    id: generated.id,
    blockId: activeBlock.id,
    title: generated.title || titleForSessionType(sessionType, activeBlock.focusDomain),
    purposeCopy: getSessionIntroCopy({ focusDomain: activeBlock.focusDomain, lifeGoal }),
    sessionType,
    estimatedMinutes: generated.estimatedMinutes || (sessionType === 'standard' ? 20 : 12),
    focusDomain: activeBlock.focusDomain,
    exercises,
    metadata: {
      source: generated.source,
      generatedSessionId: generated.id,
      templateId: generated.templateId,
      plannedDateKey: plannedDateKey(generated.templateId),
      readiness: generated.readiness,
      painAreas: generated.painAreas,
      guidance: generated.guidance,
      equipmentNeeded: equipmentNeeded(exercises),
      generatedExercises: generated.exercises.map(toGeneratedExerciseMetadata),
    },
  };
}

export function countsTowardMainPlan(sessionPlan: HaleSessionPlan | null | undefined): boolean {
  if (!sessionPlan) return true;
  if (sessionPlan.sessionType === 'retest_prep') return false;
  const source = sessionPlan.metadata?.source;
  return source !== 'preset' && source !== 'manual';
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

function toPracticeHaleExercise(
  ladderId: string,
  ladderTitle: string,
  whyItMatters: string,
  level: ExerciseLevel,
  definition: ExerciseDefinition
): HaleExercise {
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
    safetyNotes:
      level.equipment.includes('counter') || level.equipment.includes('wall') || level.equipment.includes('chair')
        ? ['Keep support nearby and stop if anything feels unsafe.']
        : undefined,
  };
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
}: {
  user?: unknown;
  safetyProfile?: MovementSafetyProfile | null;
  lifeGoal?: LifeGoal | null;
  activeBlock: MovementBlock;
  latestAssessment?: MovementAssessment | null;
  recentCompletions?: readonly TrainingSessionCompletion[];
  adherenceState?: AdherenceState | null;
  readiness?: DailyReadiness;
}): HaleSessionPlan {
  return planTodayHaleSession({
    safetyProfile,
    lifeGoal,
    activeBlock,
    recentCompletions,
    adherenceState,
    readiness,
  });
}

export function updateExerciseProgressionFromSession(input: {
  sessionPlan: HaleSessionPlan;
  completion: TrainingSessionCompletion;
  previousProgress?: Record<string, LadderProgress>;
  sessionResult?: TrainingSessionResult | null;
  poseMetrics?: Record<string, unknown>;
  perceivedEffort?: 1 | 2 | 3 | 4 | 5;
  painReported?: boolean;
  painAreas?: readonly PainArea[];
  completed?: boolean;
  trackingQuality?: TrackingQuality;
  feedback?: PostSessionFeedback;
}): Record<string, LadderProgress> {
  if (!isDynamicPlan(input.sessionPlan)) return input.previousProgress ?? {};
  const feedback: PostSessionFeedback = {
    perceivedEffort: input.perceivedEffort,
    painReported: input.painReported,
    painAreas: input.painAreas,
    trackingQuality: input.trackingQuality ?? 'good',
    completedAt: input.completion.completedAt,
    ...input.feedback,
  };
  return updateLadderProgressAfterSession(
    input.previousProgress ?? {},
    {
      id: input.sessionPlan.metadata?.generatedSessionId,
      templateId: input.sessionPlan.metadata?.templateId,
      completedAt: input.completion.completedAt,
      exercises: completedExerciseResultsForPlan(input.sessionPlan, input.sessionResult, feedback, input.completed),
    },
    feedback
  );
}

export function createGeneratedSessionSummary({
  sessionPlan,
  completedAt,
  durationMinutes,
  feedback,
}: {
  sessionPlan: HaleSessionPlan;
  completedAt?: string;
  durationMinutes?: number;
  feedback?: PersistedPostSessionFeedback;
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
    })) ?? [];
  return {
    id: metadata?.generatedSessionId ?? sessionPlan.id,
    blockId: sessionPlan.blockId,
    source,
    templateId: metadata?.templateId,
    title: sessionPlan.title,
    focus: sessionPlan.focusDomain,
    completedAt,
    exerciseIds: sessionPlan.exercises.map((exercise) => exercise.id),
    ladderIds: unique(sessionPlan.exercises.map((exercise) => exercise.ladderId).filter((id): id is string => !!id)),
    readiness: metadata?.readiness,
    painArea,
    durationMinutes,
    exercises: generatedExercises.length > 0 ? generatedExercises : undefined,
    feedback,
  };
}

function legacyFallbackPlan(
  input: PlanTodayHaleSessionInput & {
    reason: string;
    sessionType: TrainingSessionCompletionType;
  }
): HaleSessionPlan {
  if (__DEV__) {
    console.warn(`[sessionPlanning] dynamic session fallback: ${input.reason}`);
  }
  const ids = input.training ? nextSessionExercises(input.training) ?? [] : [];
  const validIds = ids.filter(hasExercise);
  const focusDomain = input.activeBlock?.focusDomain ?? legacyFocusDomain(input.training);
  const exercises = validIds.map((id) => toLegacyHaleExercise(getExercise(id)));
  return {
    id: `legacy-session-${dateKey(input.today ?? new Date())}`,
    blockId: input.activeBlock?.id ?? 'legacy-training-block',
    title: titleForSessionType(input.sessionType, focusDomain),
    purposeCopy: input.activeBlock
      ? getSessionIntroCopy({ focusDomain, lifeGoal: input.lifeGoal })
      : 'A simple Hale session for today, using your current plan.',
    sessionType: input.sessionType,
    estimatedMinutes: input.sessionType === 'restart' ? 12 : 20,
    focusDomain,
    exercises,
    metadata: {
      source: 'legacy_fallback',
      fallbackReason: input.reason,
      plannedDateKey: `session-${(input.training?.progress.completedSessions ?? 0) + 1}`,
      readiness: readinessFor(input, input.sessionType),
      painAreas: painAreasFor(input),
      equipmentNeeded: equipmentNeeded(exercises),
      guidance: ['Hale used the existing session path for today.'],
    },
  };
}

function recentSessionsFor(input: PlanTodayHaleSessionInput): GenerateSessionInput['recentSessions'] {
  const fromCompletions = (input.recentCompletions ?? []).map((completion) => ({
    id: completion.id,
    blockId: completion.blockId,
    templateId: templateIdFromPlannedDate(completion.plannedDate),
    plannedDate: completion.plannedDate,
    completedAt: completion.completedAt,
    status: 'completed' as const,
    durationMinutes: completion.durationMinutes,
  }));
  const seenTemplates = new Set(fromCompletions.map((session) => session.templateId).filter(Boolean));
  const fromSummaries = (input.training?.generatedSessionSummaries ?? [])
    .filter((summary) => !!summary.completedAt)
    .filter((summary) => !summary.templateId || !seenTemplates.has(summary.templateId))
    .map((summary) => ({
      id: summary.id,
      blockId: summary.blockId,
      templateId: summary.templateId,
      completedAt: summary.completedAt as string,
      source: summary.source === 'legacy' ? undefined : summary.source,
      status: 'completed' as const,
      durationMinutes: summary.durationMinutes,
    }));
  return [...fromCompletions, ...fromSummaries];
}

function isDynamicPlan(plan: HaleSessionPlan): boolean {
  const source = plan.metadata?.source;
  return source === 'block_generated' || source === 'preset' || source === 'manual';
}

function completedExerciseResultsForPlan(
  plan: HaleSessionPlan,
  sessionResult: TrainingSessionResult | null | undefined,
  feedback: PostSessionFeedback,
  completedOverride: boolean | undefined
): CompletedExerciseResult[] {
  const items = new Map((sessionResult?.items ?? []).map((item) => [item.exerciseId, item]));
  const metadata = plan.metadata?.generatedExercises;
  const source =
    metadata && metadata.length > 0
      ? metadata
      : plan.exercises.map((exercise) => ({
          exerciseId: exercise.id,
          ladderId: exercise.ladderId,
          levelId: exercise.id,
        }));
  return source
    .filter((exercise) => !!exercise.ladderId)
    .map((exercise) => {
      const item = items.get(exercise.exerciseId);
      const completed = completedOverride ?? (item ? item.status !== 'skipped' : true);
      return {
        ladderId: exercise.ladderId as string,
        levelId: exercise.levelId ?? exercise.exerciseId,
        completionRate: completed ? 1 : 0,
        perceivedEffort: feedback.perceivedEffort,
        painReported: feedback.painReported,
        trackingQuality: feedback.trackingQuality ?? 'good',
      };
    });
}

function validatePlayableExerciseIds(exercises: readonly HaleExercise[]): { ok: boolean; unsupported: string[] } {
  const unsupported = exercises.map((exercise) => exercise.id).filter((id) => !hasExercise(id));
  return { ok: unsupported.length === 0, unsupported };
}

function sessionTypeFor(input: PlanTodayHaleSessionInput): TrainingSessionCompletionType {
  if (input.lifecycleState === 'week_complete' || input.presetId === 'preset-mobility-reset') return 'retest_prep';
  if (input.lifecycleState === 'inactive_restart') return 'restart';
  if (input.adherenceState === 'inactive_this_week' || input.adherenceState === 'inactive_14_days') return 'restart';
  const activeBlock = input.activeBlock ?? null;
  if (activeBlock) {
    const state = input.adherenceState ?? getAdherenceState(activeBlock, input.recentCompletions ?? [], iso(input.today ?? new Date()));
    if (state === 'inactive_this_week' || state === 'inactive_14_days') return 'restart';
    const progress = blockProgress(activeBlock, input.recentCompletions ?? []);
    return progress.completedSessions === 0 ? 'starter' : 'standard';
  }
  return (input.training?.progress.completedSessions ?? 0) === 0 ? 'starter' : 'standard';
}

function readinessFor(input: PlanTodayHaleSessionInput, sessionType: TrainingSessionCompletionType): DailyReadiness {
  if (input.readiness) return input.readiness;
  if (input.adjustment === 'shorter') return 'short_on_time';
  if (input.adjustment === 'gentler') return 'low_energy';
  if (input.adjustment === 'something_hurts') return 'something_hurts';
  if (sessionType === 'restart') return 'low_energy';
  return 'ready';
}

function painAreasFor(input: PlanTodayHaleSessionInput): readonly PainArea[] {
  if (input.painAreas && input.painAreas.length > 0) return input.painAreas;
  if (input.adjustment === 'something_hurts' && input.painArea) return [input.painArea];
  return [];
}

function presetIdFor(
  input: PlanTodayHaleSessionInput,
  sessionType: TrainingSessionCompletionType
): string | undefined {
  if (input.presetId) return input.presetId;
  if (input.lifecycleState === 'week_complete') return 'preset-mobility-reset';
  if (sessionType === 'restart') return 'preset-gentle-restart';
  return undefined;
}

function availableEquipmentFor(input: PlanTodayHaleSessionInput): readonly AvailableEquipment[] {
  if (input.adjustment === 'no_equipment') return ['chair', 'wall'];
  const baseEquipment = input.safetyProfile?.availableEquipment;
  const set = new Set<AvailableEquipment>(
    baseEquipment && baseEquipment.length > 0 ? baseEquipment : ['chair', 'wall']
  );
  if (set.size > 1) set.delete('none');
  const equipment = input.training?.equipment ?? DEFAULT_EQUIPMENT;
  applyEquipmentProfile(set, equipment);
  return Array.from(set);
}

function applyEquipmentProfile(set: Set<AvailableEquipment>, equipment: EquipmentProfile): void {
  if (equipment.stair) set.add('stairs');
  else set.delete('stairs');
  if (equipment.band) set.add('resistance_band');
  else set.delete('resistance_band');
  if (equipment.miniBand) set.add('mini_band');
  else set.delete('mini_band');
  if (equipment.load) {
    set.add('backpack');
  } else {
    set.delete('backpack');
    set.delete('dumbbells');
  }
}

function equipmentSupportsTags(required: readonly EquipmentTag[], available: readonly AvailableEquipment[]): boolean {
  if (required.length === 0) return true;
  for (const tag of required) {
    if (tag === 'none' || tag === 'floor') continue;
    if (tag === 'cushion' && !available.includes('chair')) return false;
    if (tag === 'chair' && !available.includes('chair')) return false;
    if (tag === 'wall' && !available.includes('wall')) return false;
    if (tag === 'counter' && !available.includes('wall') && !available.includes('chair')) return false;
    if (tag === 'stair' && !available.includes('stairs')) return false;
    if ((tag === 'long_band' || tag === 'door_anchor') && !available.includes('resistance_band')) return false;
    if (tag === 'mini_band' && !available.includes('mini_band')) return false;
    if (tag === 'backpack_or_weight' && !available.includes('backpack') && !available.includes('dumbbells')) return false;
  }
  return true;
}

function toDynamicTrainingBlock(block: MovementBlock): DynamicTrainingBlock {
  const focusDomain = toTrainingDomain(block.focusDomain);
  return {
    id: block.id,
    userId: block.userId,
    sourceAssessmentId: block.sourceAssessmentId,
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
    safetyNotes: exercise.safetyNotes ? exercise.safetyNotes.slice() : undefined,
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
  };
}

function toLegacyHaleExercise(definition: ExerciseDefinition): HaleExercise {
  return {
    id: definition.id,
    family: familyForDefinition(definition),
    name: definition.displayName,
    domain: movementDomainForDefinition(definition),
    level: definition.level,
    cameraView: definition.cameraView.view,
    durationSeconds:
      definition.prescription.holdSec ?? definition.prescription.captureSec ?? definition.prescription.timerSec,
    targetReps: definition.prescription.repsPerSet,
    targetSets: definition.prescription.sets,
    requiresEquipment: definition.equipment.map((e) => String(e)),
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

function legacyFocusDomain(training: TrainingState | null | undefined): MovementDomain {
  const weakest = training?.block?.weakestDomain;
  if (weakest === 'balance') return 'balance';
  if (weakest === 'mobility') return 'mobility';
  return 'strength_power';
}

function movementDomainForDefinition(definition: ExerciseDefinition): MovementDomain {
  if (definition.slot === 'balance') return 'balance';
  if (definition.slot === 'mobility') return 'mobility';
  if (definition.family.includes('balance') || definition.family.includes('lateral')) return 'balance';
  if (definition.family.includes('mobility') || definition.family.includes('reach')) return 'mobility';
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
      .flatMap((exercise) => exercise.requiresEquipment ?? [])
      .filter((item) => !['none', 'floor'].includes(item))
  );
}

function templateIdFromPlannedDate(plannedDate: string | undefined): string | undefined {
  if (!plannedDate) return undefined;
  return plannedDate.split(':')[0];
}

function plannedDateKey(templateId: string | undefined): string {
  return `${templateId ?? 'session'}:${dateKey(new Date())}`;
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
