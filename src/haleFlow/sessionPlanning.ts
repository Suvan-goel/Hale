import {
  blockProgress,
  getAdherenceState,
  type AdherenceState,
  type LifeGoal,
  type MovementAssessment,
  type MovementBlock,
  type MovementDomain,
  type MovementSafetyProfile,
  type TrainingSessionCompletion,
} from '../adherence';
import { domainLabel } from '../adherence/goalDomainMapping';
import {
  createSessionTemplatesForFocus,
  generateTodaySession as generateDynamicTodaySession,
  updateLadderProgressAfterSession,
  type DailyReadiness,
  type GeneratedExercise,
  type TrainingBlock as DynamicTrainingBlock,
  type TrainingDomain,
} from '../training/workoutGeneration';
import { getSessionIntroCopy } from './copy';
import type { ExerciseFamily, HaleExercise, HaleSessionPlan } from './types';

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
  const state = adherenceState ?? getAdherenceState(activeBlock, recentCompletions);
  const progress = blockProgress(activeBlock, recentCompletions);
  const sessionType =
    state === 'inactive_this_week' || state === 'inactive_14_days'
      ? 'restart'
      : progress.completedSessions === 0
        ? 'starter'
        : 'standard';
  const dynamicBlock = toDynamicTrainingBlock(activeBlock);
  const generated = generateDynamicTodaySession({
    block: dynamicBlock,
    presetId: sessionType === 'restart' ? 'preset-gentle-restart' : undefined,
    safetyProfile,
    dailyReadiness: readiness ?? (sessionType === 'restart' ? 'low_energy' : 'ready'),
    recentSessions: recentCompletions.map((completion) => ({
      id: completion.id,
      blockId: completion.blockId,
      templateId: completion.plannedDate,
      plannedDate: completion.plannedDate,
      completedAt: completion.completedAt,
      status: 'completed',
      durationMinutes: completion.durationMinutes,
    })),
  });

  return {
    id: generated.id,
    blockId: activeBlock.id,
    title: sessionType === 'restart' ? 'Gentle restart session' : `${domainLabel(activeBlock.focusDomain)} session`,
    purposeCopy: getSessionIntroCopy({ focusDomain: activeBlock.focusDomain, lifeGoal }),
    sessionType,
    estimatedMinutes: generated.estimatedMinutes || (sessionType === 'standard' ? 20 : 12),
    focusDomain: activeBlock.focusDomain,
    exercises: generated.exercises.map((exercise) => toHaleExercise(exercise)),
  };
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
      completedAt: input.completion.completedAt,
      exercises: input.sessionPlan.exercises
        .filter((exercise) => exercise.ladderId)
        .map((exercise) => ({
          ladderId: exercise.ladderId as string,
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
    requiresEquipment: exercise.equipment.map((e) => String(e)),
    safetyNotes: exercise.safetyNotes ? exercise.safetyNotes.slice() : undefined,
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
