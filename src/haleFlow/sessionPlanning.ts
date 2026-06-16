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
  hasExercise,
  type ExerciseDefinition,
} from '../exercises';
import type { EquipmentTag } from '../movements';
import type { HaleLifecycleState } from './appLifecycle';
import {
  DEFAULT_EQUIPMENT,
  nextSessionExercises,
  type EquipmentProfile,
  type TrainingState,
} from '../training';
import {
  createSessionTemplatesForFocus,
  generateTodaySession as generateDynamicTodaySession,
  updateLadderProgressAfterSession,
  type DailyReadiness,
  type GeneratedExercise,
  type GeneratedSession,
  type GenerateSessionInput,
  type LadderProgress,
  type PainArea,
  type SessionSource,
  type TrainingBlock as DynamicTrainingBlock,
  type TrainingDomain,
} from '../training/workoutGeneration';
import { getSessionIntroCopy } from './copy';
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
  source?: SessionSource;
  generateSession?: (input: GenerateSessionInput) => GeneratedSession;
}

export function planTodayHaleSession(input: PlanTodayHaleSessionInput): HaleSessionPlan {
  const sessionType = sessionTypeFor(input);
  const readiness = readinessFor(input, sessionType);
  const painAreas = painAreasFor(input);
  const presetId = presetIdFor(input, sessionType);
  const activeBlock = input.activeBlock ?? null;

  if (activeBlock) {
    try {
      const generated = (input.generateSession ?? generateDynamicTodaySession)({
        block: toDynamicTrainingBlock(activeBlock),
        presetId,
        safetyProfile: input.safetyProfile,
        availableEquipment: availableEquipmentFor(input),
        dailyReadiness: readiness,
        painAreas,
        ladderProgress: input.ladderProgress ?? {},
        recentSessions: (input.recentCompletions ?? []).map((completion) => ({
          id: completion.id,
          blockId: completion.blockId,
          templateId: templateIdFromPlannedDate(completion.plannedDate),
          plannedDate: completion.plannedDate,
          completedAt: completion.completedAt,
          status: 'completed',
          durationMinutes: completion.durationMinutes,
        })),
        today: input.today,
        source: input.source,
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

  return legacyFallbackPlan({
    ...input,
    sessionType,
    reason: 'no active movement block available for dynamic planning',
  });
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
    },
  };
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
  poseMetrics?: Record<string, unknown>;
  perceivedEffort?: 1 | 2 | 3 | 4 | 5;
  painReported?: boolean;
}): { storedForFutureAutoregulation: true } {
  updateLadderProgressAfterSession(
    {},
    {
      id: input.sessionPlan.metadata?.generatedSessionId,
      templateId: input.sessionPlan.metadata?.templateId,
      completedAt: input.completion.completedAt,
      exercises: input.sessionPlan.exercises
        .filter((exercise) => exercise.ladderId)
        .map((exercise) => ({
          ladderId: exercise.ladderId as string,
          levelId: exercise.id,
          completionRate: 1,
          perceivedEffort: input.perceivedEffort,
          painReported: input.painReported,
          trackingQuality: 'usable',
        })),
    },
    {
      perceivedEffort: input.perceivedEffort,
      painReported: input.painReported,
      trackingQuality: 'usable',
    }
  );
  return { storedForFutureAutoregulation: true };
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
  const set = new Set<AvailableEquipment>(input.safetyProfile?.availableEquipment ?? ['chair', 'wall']);
  set.add('chair');
  set.add('wall');
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
