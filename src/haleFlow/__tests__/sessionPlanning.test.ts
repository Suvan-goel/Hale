import {
  createLifeGoal,
  createMovementBlockFromAssessment,
  makeTrainingSessionCompletion,
  type MovementBlock,
  type MovementSafetyProfile,
} from '../../adherence';
import { syntheticCheckUp } from '../../checkup/devFixture';
import { hasExercise, STS_STANDARD_ID } from '../../exercises';
import { scoreCheckUp } from '../../scoring';
import {
  DEFAULT_EQUIPMENT,
  buildBlock,
  defaultTrainingState,
  recordCompletedSession,
  startBlock,
  type TrainingSessionResult,
} from '../../training';
import type { GeneratedSession, LadderProgress } from '../../training/workoutGeneration';
import {
  planTodayHaleSession,
  updateExerciseProgressionFromSession,
} from '../sessionPlanning';

const START = '2026-06-01T08:00:00.000Z';

function safety(): MovementSafetyProfile {
  return {
    id: 'safety-1',
    userId: 'local-device-user',
    age: 61,
    activityLevel: 'lightly_active',
    feelsSafeStandingFromChair: true,
    feelsSafeBalancing: true,
    availableEquipment: ['chair', 'wall', 'stairs', 'resistance_band'],
    preferredWorkoutDays: ['Mon', 'Wed', 'Fri'],
    createdAt: START,
    updatedAt: START,
  };
}

function lifeGoal() {
  return createLifeGoal({ category: 'stairs', nowIso: START });
}

function block(): MovementBlock {
  const checkUp = syntheticCheckUp(START);
  return createMovementBlockFromAssessment({
    latestAssessment: { id: checkUp.startedAt, score: scoreCheckUp(checkUp) },
    lifeGoal: lifeGoal(),
    startDate: START,
  });
}

function legacyTraining() {
  const checkUp = syntheticCheckUp(START);
  return startBlock(defaultTrainingState(), buildBlock(scoreCheckUp(checkUp), DEFAULT_EQUIPMENT, START));
}

function ladderProgress(): Record<string, LadderProgress> {
  return {
    'sit-to-stand': {
      ladderId: 'sit-to-stand',
      currentLevelId: STS_STANDARD_ID,
      completedSessionsAtLevel: 1,
      failedSessionsAtLevel: 0,
      recentCompletionRates: [0.9],
      recentRpe: [2],
      recentPain: [false],
      updatedAt: START,
    },
  };
}

describe('planTodayHaleSession', () => {
  it('uses the dynamic generator when an active block and ladder progress exist', () => {
    const plan = planTodayHaleSession({
      activeBlock: block(),
      training: legacyTraining(),
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      ladderProgress: ladderProgress(),
      today: START,
    });

    expect(plan.metadata?.source).toBe('block_generated');
    expect(plan.title).toBeTruthy();
    expect(plan.estimatedMinutes).toBeGreaterThan(0);
    expect(plan.exercises.length).toBeGreaterThan(0);
    expect(plan.exercises.every((exercise) => hasExercise(exercise.id))).toBe(true);
  });

  it('falls back to legacy planning when no active block exists', () => {
    const plan = planTodayHaleSession({
      activeBlock: null,
      training: legacyTraining(),
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      today: START,
    });

    expect(plan.metadata?.source).toBe('legacy_fallback');
    expect(plan.metadata?.fallbackReason).toContain('no active movement block');
    expect(plan.exercises.length).toBeGreaterThan(0);
  });

  it('falls back to legacy planning when generated exercise IDs are unsupported', () => {
    const plan = planTodayHaleSession({
      activeBlock: block(),
      training: legacyTraining(),
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      today: START,
      generateSession: () => unsupportedGeneratedSession(),
    });

    expect(plan.metadata?.source).toBe('legacy_fallback');
    expect(plan.metadata?.fallbackReason).toContain('unsupported exercise ids');
    expect(plan.exercises.every((exercise) => hasExercise(exercise.id))).toBe(true);
  });

  it('turns short-on-time into a shorter plan with at most three exercises', () => {
    const plan = planTodayHaleSession({
      activeBlock: block(),
      training: legacyTraining(),
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      adjustment: 'shorter',
      today: START,
    });

    expect(plan.metadata?.readiness).toBe('short_on_time');
    expect(plan.estimatedMinutes).toBe(10);
    expect(plan.exercises.length).toBeLessThanOrEqual(3);
  });

  it('avoids band, stair, mini-band, and load-only movements for no-equipment days', () => {
    const plan = planTodayHaleSession({
      activeBlock: block(),
      training: legacyTraining(),
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      adjustment: 'no_equipment',
      today: START,
    });
    const equipment = plan.exercises.flatMap((exercise) => exercise.requiresEquipment ?? []);

    expect(equipment).not.toContain('long_band');
    expect(equipment).not.toContain('stair');
    expect(equipment).not.toContain('mini_band');
    expect(equipment).not.toContain('backpack_or_weight');
  });

  it('creates a gentle shorter restart plan for inactive restarts', () => {
    const plan = planTodayHaleSession({
      activeBlock: block(),
      training: legacyTraining(),
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      lifecycleState: 'inactive_restart',
      today: START,
    });

    expect(plan.sessionType).toBe('restart');
    expect(plan.metadata?.source).toBe('preset');
    expect(plan.estimatedMinutes).toBeLessThan(20);
  });

  it('adapts generated exercises into IDs the current player can resolve', () => {
    const plan = planTodayHaleSession({
      activeBlock: block(),
      training: legacyTraining(),
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      today: START,
    });

    expect(plan.exercises.map((exercise) => exercise.id).every(hasExercise)).toBe(true);
  });

  it('folds a dynamic session through existing completion paths without crashing', () => {
    const b = block();
    const training = legacyTraining();
    const plan = planTodayHaleSession({
      activeBlock: b,
      training,
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      today: START,
    });
    const result: TrainingSessionResult = {
      startedAt: START,
      items: plan.exercises.map((exercise) => ({ exerciseId: exercise.id, status: 'completed', sets: [] })),
    };
    const nextTraining = recordCompletedSession(training, result, '2026-06-01T09:00:00.000Z');
    const completion = makeTrainingSessionCompletion({
      block: b,
      sessionType: plan.sessionType,
      completedAt: '2026-06-01T09:00:00.000Z',
      plannedDate: plan.metadata?.plannedDateKey,
    });

    expect(nextTraining.progress.completedSessions).toBe(1);
    expect(() => updateExerciseProgressionFromSession({ sessionPlan: plan, completion })).not.toThrow();
  });
});

function unsupportedGeneratedSession(): GeneratedSession {
  return {
    id: 'generated-test-session',
    blockId: 'movement-block-test',
    templateId: 'strength-A',
    source: 'block_generated',
    title: 'Generated Test Session',
    focusDomain: 'strength_power',
    dayLabel: 'A',
    estimatedMinutes: 12,
    readiness: 'ready',
    painAreas: [],
    weekStatus: 'session_due',
    skippedSlots: [],
    guidance: [],
    exercises: [
      {
        id: 'slot-unknown-1',
        exerciseId: 'unknown-exercise-id',
        ladderId: 'sit-to-stand',
        ladderTitle: 'Sit-to-Stand',
        levelId: 'unknown-exercise-id',
        level: 1,
        name: 'Unknown Exercise',
        slotType: 'lower_body_strength',
        domain: 'strength_power',
        kind: 'timer',
        releaseStatus: 'v1_core',
        measurementTier: 'voice_guided',
        cameraView: 'side',
        equipment: [],
        instructions: 'Move comfortably.',
        whyItMatters: 'Build everyday strength.',
        sets: 1,
        secondsPerSet: 20,
        restSeconds: 20,
        estimatedMinutes: 2,
        rationale: 'Test unsupported id.',
      },
    ],
  };
}
