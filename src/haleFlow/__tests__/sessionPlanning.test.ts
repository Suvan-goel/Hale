import {
  createLifeGoal,
  createMovementBlockFromAssessment,
  makeTrainingSessionCompletion,
  type MovementBlock,
  type MovementSafetyProfile,
} from '../../adherence';
import { syntheticCheckUp } from '../../checkup/devFixture';
import {
  BRIDGE_HOLD_ID,
  HINGE_FREE_ID,
  SEATED_BAND_ROW_ID,
  STANDING_BAND_ROW_ID,
  STEP_UP_ID,
  hasExercise,
  STS_SLOW_ECC_ID,
  STS_STANDARD_ID,
} from '../../exercises';
import { createCurrentVersionedScoreSnapshot, scoreCheckUp } from '../../scoring';
import {
  DEFAULT_EQUIPMENT,
  buildBlock,
  defaultTrainingState,
  recordCompletedSession,
  startBlock,
  type TrainingSessionResult,
} from '../../training';
import type { GeneratedSession, LadderProgress } from '../../training/workoutGeneration';
import { generateTodaySession as generateRawTodaySession } from '../../training/workoutGeneration';
import {
  countsTowardMainPlan,
  createGeneratedSessionSummary,
  planLadderPracticeSession,
  planTodayHaleSession,
  updateExerciseProgressionFromSession,
} from '../sessionPlanning';
import { createMovementAssessment } from '../assessments';

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
  const scored = createCurrentVersionedScoreSnapshot(checkUp);
  const assessment = createMovementAssessment({
    checkUpId: checkUp.startedAt,
    type: 'baseline',
    score: scored.score,
    scoreSnapshot: scored.snapshot,
    completedAt: checkUp.startedAt,
    isOfficialForProgress: true,
  });
  return createMovementBlockFromAssessment({
    latestAssessment: { id: checkUp.startedAt, score: scored.score, scoreSnapshot: scored.snapshot, assessment },
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
    expect(countsTowardMainPlan(plan)).toBe(true);
    expect(plan.metadata?.plannedDateKey).toBe(`${plan.metadata?.templateId}:2026-06-01`);
    expect(plan.title).toBeTruthy();
    expect(plan.estimatedMinutes).toBeGreaterThan(0);
    expect(plan.exercises.length).toBeGreaterThan(0);
    expect(plan.exercises.every((exercise) => hasExercise(exercise.id))).toBe(true);
  });

  it('uses persisted training ladder progress when no override is supplied', () => {
    let captured: unknown;
    const plan = planTodayHaleSession({
      activeBlock: block(),
      training: { ...legacyTraining(), ladderProgressById: ladderProgress() },
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      today: START,
      generateSession: (input) => {
        captured = input.ladderProgress;
        return generateRawTodaySession(input);
      },
    });

    expect(plan.metadata?.source).toBe('block_generated');
    expect((captured as Record<string, LadderProgress>)['sit-to-stand'].currentLevelId).toBe(STS_STANDARD_ID);
  });

  it('can target a requested Plan session template while staying on the dynamic path', () => {
    let capturedTemplateId: string | undefined;
    const plan = planTodayHaleSession({
      activeBlock: block(),
      training: legacyTraining(),
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      today: START,
      targetSessionTemplateId: 'session_b',
      generateSession: (input) => {
        capturedTemplateId = input.template?.id;
        return generateRawTodaySession(input);
      },
    });

    expect(capturedTemplateId).toMatch(/-B$/);
    expect(plan.metadata?.source).toBe('block_generated');
    expect(plan.metadata?.templateId).toMatch(/-B$/);
  });

  it('uses defaults when ladder progress is missing and tolerates unknown stored levels', () => {
    const plan = planTodayHaleSession({
      activeBlock: block(),
      training: {
        ...legacyTraining(),
        ladderProgressById: {
          'sit-to-stand': {
            ladderId: 'sit-to-stand',
            currentLevelId: 'unknown-level',
            completedSessionsAtLevel: 0,
            failedSessionsAtLevel: 0,
            recentCompletionRates: [],
            recentRpe: [],
            recentPain: [],
            updatedAt: START,
          },
        },
      },
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      today: START,
    });

    expect(plan.metadata?.source).toBe('block_generated');
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

  it('can generate an extra preset without an active movement block', () => {
    const plan = planTodayHaleSession({
      activeBlock: null,
      training: legacyTraining(),
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      presetId: 'preset-quick-full-body',
      today: START,
    });

    expect(plan.metadata?.source).toBe('preset');
    expect(countsTowardMainPlan(plan)).toBe(false);
    expect(plan.blockId).toBe('explore-extra-session');
    expect(plan.purposeCopy).toContain('shorter option outside the main plan');
    expect(plan.exercises.length).toBeGreaterThan(0);
    expect(plan.exercises.every((exercise) => hasExercise(exercise.id))).toBe(true);
  });

  it('creates a player-compatible ladder practice session', () => {
    const plan = planLadderPracticeSession({
      ladderId: 'sit-to-stand',
      activeBlock: block(),
      training: { ...legacyTraining(), ladderProgressById: ladderProgress() },
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      today: START,
    });

    expect(plan?.metadata?.source).toBe('manual');
    expect(countsTowardMainPlan(plan)).toBe(false);
    expect(plan?.metadata?.templateId).toBe('practice-sit-to-stand');
    expect(plan?.exercises).toHaveLength(1);
    expect(plan?.exercises.every((exercise) => hasExercise(exercise.id))).toBe(true);
    expect(plan?.metadata?.generatedExercises?.[0]).toMatchObject({
      ladderId: 'sit-to-stand',
      levelId: STS_STANDARD_ID,
    });
  });

  it('respects floor, stair, and support constraints for ladder practice', () => {
    const baseTraining = legacyTraining();
    const floorProgress = {
      'hinge-glutes': {
        ladderId: 'hinge-glutes',
        currentLevelId: BRIDGE_HOLD_ID,
        completedSessionsAtLevel: 0,
        failedSessionsAtLevel: 0,
        recentCompletionRates: [],
        recentRpe: [],
        recentPain: [],
        updatedAt: START,
      },
    };
    const noFloor = planLadderPracticeSession({
      ladderId: 'hinge-glutes',
      activeBlock: block(),
      training: { ...baseTraining, ladderProgressById: floorProgress },
      safetyProfile: { ...safety(), availableEquipment: ['chair', 'wall'] },
      today: START,
    });
    const withFloor = planLadderPracticeSession({
      ladderId: 'hinge-glutes',
      activeBlock: block(),
      training: { ...baseTraining, ladderProgressById: floorProgress },
      safetyProfile: { ...safety(), availableEquipment: ['chair', 'wall', 'floor_space'] },
      today: START,
    });
    const stairsOnly = planLadderPracticeSession({
      ladderId: 'step-up',
      activeBlock: block(),
      training: { ...baseTraining, equipment: { ...baseTraining.equipment, stair: true } },
      safetyProfile: { ...safety(), availableEquipment: ['stairs'] },
      today: START,
    });
    const stairsWithSupport = planLadderPracticeSession({
      ladderId: 'step-up',
      activeBlock: block(),
      training: { ...baseTraining, equipment: { ...baseTraining.equipment, stair: true } },
      safetyProfile: { ...safety(), availableEquipment: ['stairs', 'wall'] },
      today: START,
    });
    const balanceNoSupport = planLadderPracticeSession({
      ladderId: 'balance',
      activeBlock: block(),
      training: baseTraining,
      safetyProfile: { ...safety(), availableEquipment: ['none'] },
      today: START,
    });
    const bandProgress = {
      'pull-upper-back': {
        ladderId: 'pull-upper-back',
        currentLevelId: STANDING_BAND_ROW_ID,
        completedSessionsAtLevel: 0,
        failedSessionsAtLevel: 0,
        recentCompletionRates: [],
        recentRpe: [],
        recentPain: [],
        updatedAt: START,
      },
    };
    const bandNoAnchor = planLadderPracticeSession({
      ladderId: 'pull-upper-back',
      activeBlock: block(),
      training: { ...baseTraining, equipment: { ...baseTraining.equipment, band: true }, ladderProgressById: bandProgress },
      safetyProfile: { ...safety(), availableEquipment: ['chair', 'wall', 'resistance_band'] },
      today: START,
    });
    const bandWithAnchor = planLadderPracticeSession({
      ladderId: 'pull-upper-back',
      activeBlock: block(),
      training: { ...baseTraining, equipment: { ...baseTraining.equipment, band: true }, ladderProgressById: bandProgress },
      safetyProfile: { ...safety(), availableEquipment: ['chair', 'wall', 'resistance_band', 'door_anchor'] },
      today: START,
    });

    expect(noFloor?.exercises[0].id).toBe(HINGE_FREE_ID);
    expect(noFloor?.metadata?.equipmentNeeded).not.toContain('floor space');
    expect(withFloor?.exercises[0].id).toBe(BRIDGE_HOLD_ID);
    expect(withFloor?.metadata?.equipmentNeeded).toContain('floor space');
    expect(stairsOnly).toBeNull();
    expect(stairsWithSupport?.exercises[0].id).toBe(STEP_UP_ID);
    expect(balanceNoSupport).toBeNull();
    expect(bandNoAnchor?.exercises[0].id).toBe(SEATED_BAND_ROW_ID);
    expect(bandWithAnchor?.exercises[0].id).toBe(STANDING_BAND_ROW_ID);
  });

  it('shows floor space in session equipment labels when floor work is selected', () => {
    const strengthBlock: MovementBlock = {
      ...block(),
      focusDomain: 'strength_power',
      secondaryDomains: ['balance', 'mobility'],
    };
    const plan = planTodayHaleSession({
      activeBlock: strengthBlock,
      training: legacyTraining(),
      safetyProfile: { ...safety(), availableEquipment: ['chair', 'wall', 'floor_space'] },
      lifeGoal: lifeGoal(),
      targetSessionTemplateId: 'session_c',
      ladderProgress: {
        'hinge-glutes': {
          ladderId: 'hinge-glutes',
          currentLevelId: BRIDGE_HOLD_ID,
          completedSessionsAtLevel: 0,
          failedSessionsAtLevel: 0,
          recentCompletionRates: [],
          recentRpe: [],
          recentPain: [],
          updatedAt: START,
        },
      },
      today: START,
    });

    expect(plan.exercises.map((exercise) => exercise.id)).toContain(BRIDGE_HOLD_ID);
    expect(plan.metadata?.equipmentNeeded).toContain('floor space');
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
    expect(updateExerciseProgressionFromSession({ sessionPlan: plan, completion })).toBeTruthy();
  });

  it('keeps optional extra sessions out of main plan completion paths', () => {
    const extraPlan = planTodayHaleSession({
      activeBlock: null,
      training: legacyTraining(),
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      presetId: 'preset-quick-full-body',
      today: START,
    });
    const practicePlan = planLadderPracticeSession({
      ladderId: 'sit-to-stand',
      activeBlock: block(),
      training: { ...legacyTraining(), ladderProgressById: ladderProgress() },
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      today: START,
    });
    const retestPrep: typeof extraPlan = {
      ...extraPlan,
      metadata: { ...(extraPlan.metadata ?? {}), source: 'block_generated' },
      sessionType: 'retest_prep',
    };

    expect(countsTowardMainPlan(extraPlan)).toBe(false);
    expect(countsTowardMainPlan(practicePlan)).toBe(false);
    expect(countsTowardMainPlan(retestPrep)).toBe(false);
  });

  it('stores enough generated session metadata for completion updates', () => {
    const strengthBlock: MovementBlock = {
      ...block(),
      focusDomain: 'strength_power',
      secondaryDomains: ['balance', 'mobility'],
    };
    const plan = planTodayHaleSession({
      activeBlock: strengthBlock,
      training: legacyTraining(),
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      today: START,
      generateSession: () => singleSitToStandGeneratedSession(),
    });
    const summary = createGeneratedSessionSummary({
      sessionPlan: plan,
      completedAt: '2026-06-01T09:00:00.000Z',
      durationMinutes: 20,
      mainPlanCredit: true,
      workEvidence: {
        plannedExerciseCount: 1,
        resultItemCount: 1,
        completedExerciseCount: 1,
        skippedExerciseCount: 0,
        missingResultCount: 0,
        duplicateResultCount: 0,
        malformedResultCount: 0,
        unmatchedResultCount: 0,
      },
    });

    expect(summary.source).toBe('block_generated');
    expect(summary.templateId).toBe('strength-A');
    expect(summary.plannedDateKey).toBe('strength-A:2026-06-01');
    expect(summary.mainPlanCredit).toBe(true);
    expect(summary.status).toBe('completed');
    expect(summary.exerciseIds).toEqual([STS_STANDARD_ID]);
    expect(summary.exercises?.[0]).toMatchObject({
      exerciseId: STS_STANDARD_ID,
      ladderId: 'sit-to-stand',
      levelId: STS_STANDARD_ID,
      slotType: 'lower_body_strength',
      intendedDomain: 'strength_power',
      stimulusRole: 'primary',
      stimulusReason: 'direct_match',
    });
    expect(plan.metadata?.slotStimulus?.[0]).toMatchObject({
      slotId: 'lower-strength-a',
      role: 'primary',
      reason: 'direct_match',
    });
    expect(plan.metadata?.focusStimulus).toMatchObject({
      status: 'eligible',
      mainPlanCreditPotential: true,
      blockFocusDomain: 'strength_power',
      plannedPrimaryFocusExerciseIds: [STS_STANDARD_ID],
    });
  });

  it('updates ladder progress after two easy generated completions', () => {
    const plan = planTodayHaleSession({
      activeBlock: block(),
      training: legacyTraining(),
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      today: START,
      generateSession: () => singleSitToStandGeneratedSession(),
    });
    const firstCompletion = makeTrainingSessionCompletion({
      block: block(),
      sessionType: plan.sessionType,
      completedAt: '2026-06-01T09:00:00.000Z',
      plannedDate: plan.metadata?.plannedDateKey,
    });
    const first = updateExerciseProgressionFromSession({
      sessionPlan: plan,
      completion: firstCompletion,
      sessionResult: { startedAt: START, items: [{ exerciseId: STS_STANDARD_ID, status: 'completed', sets: [] }] },
      perceivedEffort: 2,
      painReported: false,
      trackingQuality: 'good',
    });
    const second = updateExerciseProgressionFromSession({
      previousProgress: first,
      sessionPlan: plan,
      completion: { ...firstCompletion, completedAt: '2026-06-03T09:00:00.000Z' },
      sessionResult: { startedAt: START, items: [{ exerciseId: STS_STANDARD_ID, status: 'completed', sets: [] }] },
      perceivedEffort: 2,
      painReported: false,
      trackingQuality: 'good',
    });

    expect(first['sit-to-stand'].currentLevelId).toBe(STS_STANDARD_ID);
    expect(second['sit-to-stand'].currentLevelId).toBe(STS_SLOW_ECC_ID);
  });

  it('does not update ladder progress when result evidence is missing or skipped', () => {
    const plan = planTodayHaleSession({
      activeBlock: block(),
      training: legacyTraining(),
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      today: START,
      generateSession: () => singleSitToStandGeneratedSession(),
    });
    const completion = makeTrainingSessionCompletion({
      block: block(),
      sessionType: plan.sessionType,
      completedAt: '2026-06-01T09:00:00.000Z',
      plannedDate: plan.metadata?.plannedDateKey,
    });

    expect(
      updateExerciseProgressionFromSession({
        sessionPlan: plan,
        completion,
        sessionResult: null,
      })
    ).toEqual({});
    expect(
      updateExerciseProgressionFromSession({
        sessionPlan: plan,
        completion,
        sessionResult: { startedAt: START, items: [{ exerciseId: STS_STANDARD_ID, status: 'skipped', sets: [] }] },
      })
    ).toEqual({});
  });

  it('does not progress after high effort, pain, or poor tracking', () => {
    const plan = planTodayHaleSession({
      activeBlock: block(),
      training: legacyTraining(),
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      today: START,
      generateSession: () => singleSitToStandGeneratedSession(),
    });
    const completion = makeTrainingSessionCompletion({
      block: block(),
      sessionType: plan.sessionType,
      completedAt: '2026-06-01T09:00:00.000Z',
      plannedDate: plan.metadata?.plannedDateKey,
    });
    const oneGood = updateExerciseProgressionFromSession({
      sessionPlan: plan,
      completion,
      sessionResult: { startedAt: START, items: [{ exerciseId: STS_STANDARD_ID, status: 'completed', sets: [] }] },
      perceivedEffort: 2,
      painReported: false,
      trackingQuality: 'good',
    });
    const painful = updateExerciseProgressionFromSession({
      previousProgress: oneGood,
      sessionPlan: plan,
      completion: { ...completion, completedAt: '2026-06-03T09:00:00.000Z' },
      sessionResult: { startedAt: START, items: [{ exerciseId: STS_STANDARD_ID, status: 'completed', sets: [] }] },
      perceivedEffort: 5,
      painReported: true,
      painAreas: ['knee'],
      trackingQuality: 'good',
    });
    const poorTracking = updateExerciseProgressionFromSession({
      previousProgress: oneGood,
      sessionPlan: plan,
      completion: { ...completion, completedAt: '2026-06-04T09:00:00.000Z' },
      sessionResult: { startedAt: START, items: [{ exerciseId: STS_STANDARD_ID, status: 'completed', sets: [] }] },
      perceivedEffort: 2,
      painReported: false,
      trackingQuality: 'poor',
    });

    expect(painful['sit-to-stand'].currentLevelId).not.toBe(STS_SLOW_ECC_ID);
    expect(painful['sit-to-stand'].lastPainArea).toBe('knee');
    expect(poorTracking['sit-to-stand'].currentLevelId).toBe(STS_STANDARD_ID);
    expect(poorTracking['sit-to-stand'].failedSessionsAtLevel).toBe(0);
  });
});

function singleSitToStandGeneratedSession(): GeneratedSession {
  return {
    id: 'generated-sit-to-stand',
    blockId: 'movement-block-test',
    templateId: 'strength-A',
    source: 'block_generated',
    title: 'Strength Session A',
    focusDomain: 'strength_power',
    dayLabel: 'A',
    estimatedMinutes: 12,
    durationLabel: '12 min',
    readiness: 'ready',
    painAreas: [],
    weekStatus: 'session_due',
    skippedSlots: [],
    skippedSlotReasons: [],
    slotStimulus: [
      {
        slotId: 'lower-strength-a',
        slotType: 'lower_body_strength',
        slotTitle: 'Chair-rise strength',
        intendedDomain: 'strength_power',
        role: 'primary',
        reason: 'direct_match',
        message: 'Chair-rise strength matched the intended training stimulus.',
        exerciseId: STS_STANDARD_ID,
        ladderId: 'sit-to-stand',
        levelId: STS_STANDARD_ID,
        selectedDomain: 'strength_power',
      },
    ],
    guidance: [],
    exercises: [
      {
        id: 'lower-strength-a-sit-to-stand-standard-1',
        exerciseId: STS_STANDARD_ID,
        ladderId: 'sit-to-stand',
        ladderTitle: 'Sit-to-Stand',
        levelId: STS_STANDARD_ID,
        level: 1,
        name: 'Standard Sit-to-Stand',
        slotType: 'lower_body_strength',
        domain: 'strength_power',
        kind: 'reps',
        releaseStatus: 'v1_core',
        measurementTier: 'measured',
        cameraView: 'side',
        equipment: ['chair'],
        instructions: 'Stand from the chair with control.',
        whyItMatters: 'Build chair-rise strength.',
        sets: 2,
        repsPerSet: 8,
        restSeconds: 30,
        estimatedMinutes: 4,
        rationale: 'Test generated metadata.',
        intendedDomain: 'strength_power',
        stimulusRole: 'primary',
        stimulusReason: 'direct_match',
      },
    ],
  };
}

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
    durationLabel: '12 min',
    readiness: 'ready',
    painAreas: [],
    weekStatus: 'session_due',
    skippedSlots: [],
    skippedSlotReasons: [],
    slotStimulus: [
      {
        slotId: 'slot-unknown',
        slotType: 'lower_body_strength',
        slotTitle: 'Unknown strength',
        intendedDomain: 'strength_power',
        role: 'primary',
        reason: 'direct_match',
        message: 'Unknown strength matched the intended training stimulus.',
        exerciseId: 'unknown-exercise-id',
        ladderId: 'sit-to-stand',
        levelId: 'unknown-exercise-id',
        selectedDomain: 'strength_power',
      },
    ],
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
        intendedDomain: 'strength_power',
        stimulusRole: 'primary',
        stimulusReason: 'direct_match',
      },
    ],
  };
}
