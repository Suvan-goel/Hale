import {
  createLifeGoal,
  createMovementBlockFromAssessment,
  makeTrainingSessionCompletion,
  type MovementBlock,
  type MovementSafetyProfile,
  type TrainingFocusStimulusEvidenceSummary,
} from '../../adherence';
import { legacySyntheticCheckUp as syntheticCheckUp } from '../../checkup/testing/legacyCheckUpFixture';
import {
  BRIDGE_HOLD_ID,
  LOADED_STS_ID,
  PUSHUP_STANDARD_ID,
  SEATED_BAND_ROW_ID,
  STANDING_BAND_ROW_ID,
  STS_POWER_ID,
  STS_CUSHION_ID,
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
  startBlock,
  type TrainingSessionResult,
} from '../../training';
import type { GeneratedSession, LadderProgress } from '../../training/workoutGeneration';
import { generateTodaySession as generateRawTodaySession } from '../../training/workoutGeneration';
import {
  countsTowardMainPlan,
  createGeneratedSessionSummary,
  getSessionPlanningRecoveryCopy,
  planLadderPracticeSession,
  planLadderPracticeSessionResult,
  planTodayHaleSession as planTodayHaleSessionResult,
  requireHaleSessionPlan as planTodayHaleSession,
  sessionPlanFromPlanningResult,
  staleEquipmentPlanningResult,
  staleMovementCapabilityPlanningResult,
  staleReleasePolicyPlanningResult,
  staleSafetyCuePlanningResult,
  updateExerciseProgressionFromSession,
  validateHaleSessionPlanEquipment,
  validateHaleSessionPlanMovementCapabilities,
  validateHaleSessionPlanProgressionPolicy,
  validateHaleSessionPlanReleasePolicy,
  validateHaleSessionPlanSafetyCues,
  validateGeneratedSessionForPlanning,
  staleProgressionPolicyPlanningResult,
} from '../sessionPlanning';
import { BLOCK_SCHEDULE_POLICY_VERSION } from '../blockSchedule';
import { createMovementAssessment } from '../assessments';
import { evaluateCompletedFocusStimulusEvidence, focusStimulusEvidenceSummary } from '../focusStimulusEvidence';
import { evaluateSessionWorkEvidence } from '../sessionWorkEvidence';
import { requiredMainPlanTemplatesForBlock } from '../mainPlanEvents';
import type { HaleSessionPlan } from '../types';

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
    movementCapabilities: confirmedMovementCapabilities(),
    preferredWorkoutDays: ['Mon', 'Wed', 'Fri'],
    createdAt: START,
    updatedAt: START,
  };
}

function confirmedMovementCapabilities() {
  return {
    schemaVersion: 1,
    floorTransfer: { status: 'confirmed' as const },
    stepUpEnvironment: {
      status: 'confirmed' as const,
      lowStableStep: true,
      fixedSupport: true,
      clearDryArea: true,
      phoneOutOfPath: true,
    },
    singleLegBalance: { status: 'confirmed_with_support' as const },
    revision: 1,
    updatedAt: START,
  };
}

function lifeGoal() {
  return createLifeGoal({ category: 'stairs', nowIso: START });
}

function neutralLifeGoal() {
  return createLifeGoal({ category: 'noticed_decline', nowIso: START });
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

function strengthBlock(): MovementBlock {
  return {
    ...block(),
    focusDomain: 'strength_power',
    secondaryDomains: ['balance', 'mobility'],
  };
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

  it('passes the selected life goal bias into dynamic session generation', () => {
    let captured: GeneratedSession['exercises'] | undefined;
    let capturedBias: unknown;
    const plan = planTodayHaleSession({
      activeBlock: strengthBlock(),
      training: legacyTraining(),
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      today: START,
      generateSession: (input) => {
        capturedBias = input.lifeGoalBias;
        const generated = generateRawTodaySession(input);
        captured = generated.exercises;
        return generated;
      },
    });

    expect(plan.metadata?.source).toBe('block_generated');
    expect((capturedBias as { preferredLadderIds?: string[] }).preferredLadderIds?.[0]).toBe('step-up');
    expect(captured?.[0]?.ladderId).toBe('step-up');
  });

  it('applies saved setup discomfort when no daily discomfort is supplied', () => {
    const plan = planTodayHaleSession({
      activeBlock: strengthBlock(),
      training: legacyTraining(),
      safetyProfile: { ...safety(), hasCurrentPain: true, painNotes: 'shoulder' },
      lifeGoal: neutralLifeGoal(),
      today: START,
    });

    expect(plan.metadata?.dailyContext?.discomfortAreas).toEqual(['shoulder']);
    expect(plan.metadata?.dailyContext?.reasonCodes).toContain('setup_discomfort_reported');
    expect(plan.metadata?.guidance?.join(' ')).toContain('Hale used gentler options around the area you marked in setup.');
    expect(plan.metadata?.generatedExercises?.map((exercise) => exercise.ladderId)).not.toContain('pull-upper-back');
  });

  it('rejects a requested Plan session that is ahead of the schedule due template', () => {
    const result = planTodayHaleSessionResult({
      activeBlock: block(),
      training: legacyTraining(),
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      today: START,
      targetSessionTemplateId: 'session_b',
    });

    expect(result.kind).toBe('unavailable');
    expect(result.kind === 'unavailable' ? result.reason : null).toBe('invalid_template');
  });

  it('applies start-menu adjustments to the requested due Plan session template', () => {
    let capturedTemplateId: string | undefined;
    let capturedReadiness: unknown;
    const plan = planTodayHaleSession({
      activeBlock: block(),
      training: legacyTraining(),
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      today: START,
      targetSessionTemplateId: 'session_a',
      adjustment: 'shorter',
      generateSession: (input) => {
        capturedTemplateId = input.template?.id;
        capturedReadiness = input.dailyReadiness;
        return generateRawTodaySession(input);
      },
    });

    expect(capturedTemplateId).toMatch(/-A$/);
    expect(capturedReadiness).toBe('short_on_time');
    expect(plan.metadata?.readiness).toBe('short_on_time');
    expect(plan.estimatedMinutes).toBe(10);
    expect(plan.exercises.length).toBeLessThanOrEqual(3);
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

  it('returns a structured legacy-only recovery state instead of a legacy plan when no active block exists', () => {
    const result = planTodayHaleSessionResult({
      activeBlock: null,
      training: legacyTraining(),
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      today: START,
    });

    expect(result.kind).toBe('unavailable');
    if (result.kind !== 'unavailable') throw new Error('expected unavailable result');
    expect(result.reason).toBe('legacy_only_state');
    expect(result.recoveryActions).toContain('create_block');
    expect(sessionPlanFromPlanningResult(result)).toBeNull();
  });

  it('can generate an extra preset without an active movement block', () => {
    const plan = planTodayHaleSession({
      activeBlock: null,
      training: legacyTraining(),
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      presetId: 'preset-quick-full-body',
      adjustment: null,
      today: START,
    });

    expect(plan.metadata?.source).toBe('preset');
    expect(countsTowardMainPlan(plan)).toBe(false);
    expect(plan.blockId).toBe('explore-extra-session');
    expect(plan.purposeCopy).toContain('shorter option outside the main plan');
    expect(plan.exercises.length).toBeGreaterThan(0);
    expect(plan.exercises.every((exercise) => hasExercise(exercise.id))).toBe(true);
  });

  it('requires explicit daily context before preset sessions start', () => {
    const result = planTodayHaleSessionResult({
      activeBlock: null,
      training: legacyTraining(),
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      presetId: 'preset-quick-full-body',
      today: START,
    });

    expect(result.kind).toBe('unavailable');
    if (result.kind !== 'unavailable') throw new Error('expected unavailable result');
    expect(result.reason).toBe('daily_context_required');
    expect(sessionPlanFromPlanningResult(result)).toBeNull();
  });

  it('creates a player-compatible ladder practice session', () => {
    const plan = planLadderPracticeSession({
      ladderId: 'sit-to-stand',
      activeBlock: block(),
      training: { ...legacyTraining(), ladderProgressById: ladderProgress() },
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      adjustment: null,
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

  it('requires explicit daily context before manual ladder practice starts', () => {
    const result = planLadderPracticeSessionResult({
      ladderId: 'sit-to-stand',
      activeBlock: block(),
      training: { ...legacyTraining(), ladderProgressById: ladderProgress() },
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      today: START,
    });

    expect(result.kind).toBe('unavailable');
    if (result.kind !== 'unavailable') throw new Error('expected unavailable result');
    expect(result.reason).toBe('daily_context_required');
    expect(sessionPlanFromPlanningResult(result)).toBeNull();
  });

  it('rejects direct optional-level manual practice requests in controlled beta', () => {
    const result = planLadderPracticeSessionResult({
      ladderId: 'push',
      requestedLevelId: PUSHUP_STANDARD_ID,
      activeBlock: block(),
      training: legacyTraining(),
      safetyProfile: { ...safety(), availableEquipment: ['chair', 'wall', 'floor_space'] },
      lifeGoal: lifeGoal(),
      adjustment: null,
      today: START,
    });

    expect(result.kind).toBe('unavailable');
    if (result.kind !== 'unavailable') throw new Error('expected unavailable result');
    expect(result.reason).toBe('exercise_level_not_available_in_controlled_beta');
    expect(result.issues?.map((issue) => issue.code)).toContain('exercise_level_not_available_in_controlled_beta');
    expect(sessionPlanFromPlanningResult(result)).toBeNull();
  });

  it.each([
    ['sit-to-stand', LOADED_STS_ID],
    ['squat', 'squat-slow-eccentric'],
    ['squat', 'squat-loaded'],
    ['squat', 'chair-supported-split-squat'],
    ['push', PUSHUP_STANDARD_ID],
    ['lateral-stability', 'mini-band-lateral-walk'],
    ['mobility-flexibility', 'neck-rotation'],
  ])('rejects optional manual practice request %s / %s', (ladderId, requestedLevelId) => {
    const result = planLadderPracticeSessionResult({
      ladderId,
      requestedLevelId,
      activeBlock: block(),
      training: legacyTraining(),
      safetyProfile: {
        ...safety(),
        availableEquipment: ['chair', 'wall', 'floor_space', 'backpack', 'mini_band'],
        movementCapabilities: confirmedMovementCapabilities(),
      },
      lifeGoal: lifeGoal(),
      adjustment: null,
      today: START,
    });

    expect(result.kind).toBe('unavailable');
    if (result.kind !== 'unavailable') throw new Error('expected unavailable result');
    expect(result.reason).toBe('exercise_level_not_available_in_controlled_beta');
    expect(result.diagnostics.exerciseIds).toContain(requestedLevelId);
  });

  it('caps restored optional progress for current planning without rewriting stored progress', () => {
    const restoredProgress: Record<string, LadderProgress> = {
      'sit-to-stand': {
        ladderId: 'sit-to-stand',
        currentLevelId: LOADED_STS_ID,
        completedSessionsAtLevel: 1,
        failedSessionsAtLevel: 0,
        recentCompletionRates: [0.95],
        recentRpe: [2],
        recentPain: [false],
        updatedAt: START,
      },
    };
    const plan = planTodayHaleSession({
      activeBlock: strengthBlock(),
      training: { ...legacyTraining(), ladderProgressById: restoredProgress },
      safetyProfile: safety(),
      lifeGoal: neutralLifeGoal(),
      targetSessionTemplateId: 'session_a',
      includeOptionalLevels: true,
      today: START,
    });
    const sitToStand = plan.metadata?.generatedExercises?.find((exercise) => exercise.ladderId === 'sit-to-stand');

    expect(sitToStand).toMatchObject({
      requestedLevelId: LOADED_STS_ID,
      selectedDailyLevelId: STS_STANDARD_ID,
      adjustmentReasons: expect.arrayContaining(['controlled_beta_release_cap', 'auto_progression_cap', 'legacy_progression_policy_capped']),
    });
    expect(plan.exercises.map((exercise) => exercise.releaseStatus)).not.toContain('v1_optional');
    expect(validateHaleSessionPlanReleasePolicy({ plan }).status).toBe('current');
    expect(validateHaleSessionPlanProgressionPolicy({ plan }).status).toBe('current');
    expect(restoredProgress['sit-to-stand'].currentLevelId).toBe(LOADED_STS_ID);
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
      requestedLevelId: BRIDGE_HOLD_ID,
      activeBlock: block(),
      training: { ...baseTraining, ladderProgressById: floorProgress },
      safetyProfile: { ...safety(), availableEquipment: ['chair', 'wall'] },
      adjustment: null,
      today: START,
    });
    const withFloor = planLadderPracticeSession({
      ladderId: 'hinge-glutes',
      requestedLevelId: BRIDGE_HOLD_ID,
      activeBlock: block(),
      training: { ...baseTraining, ladderProgressById: floorProgress },
      safetyProfile: { ...safety(), availableEquipment: ['chair', 'wall', 'floor_space'] },
      adjustment: null,
      today: START,
    });
    const stairsOnly = planLadderPracticeSession({
      ladderId: 'step-up',
      activeBlock: block(),
      training: { ...baseTraining, equipment: { ...baseTraining.equipment, stair: true } },
      safetyProfile: { ...safety(), availableEquipment: ['stairs'] },
      adjustment: null,
      today: START,
    });
    const stairsWithSupport = planLadderPracticeSession({
      ladderId: 'step-up',
      activeBlock: block(),
      training: { ...baseTraining, equipment: { ...baseTraining.equipment, stair: true } },
      safetyProfile: { ...safety(), availableEquipment: ['stairs', 'wall'] },
      adjustment: null,
      today: START,
    });
    const balanceNoSupport = planLadderPracticeSession({
      ladderId: 'balance',
      activeBlock: block(),
      training: baseTraining,
      safetyProfile: { ...safety(), availableEquipment: ['none'] },
      adjustment: null,
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
      requestedLevelId: STANDING_BAND_ROW_ID,
      activeBlock: block(),
      training: { ...baseTraining, equipment: { ...baseTraining.equipment, band: true }, ladderProgressById: bandProgress },
      safetyProfile: { ...safety(), availableEquipment: ['chair', 'wall', 'resistance_band'] },
      adjustment: null,
      today: START,
    });
    const bandWithAnchor = planLadderPracticeSession({
      ladderId: 'pull-upper-back',
      requestedLevelId: STANDING_BAND_ROW_ID,
      activeBlock: block(),
      training: { ...baseTraining, equipment: { ...baseTraining.equipment, band: true }, ladderProgressById: bandProgress },
      safetyProfile: { ...safety(), availableEquipment: ['chair', 'wall', 'resistance_band', 'door_anchor'] },
      adjustment: null,
      today: START,
    });

    expect(noFloor).toBeNull();
    expect(withFloor?.exercises[0].id).toBe(BRIDGE_HOLD_ID);
    expect(withFloor?.metadata?.equipmentNeeded).toContain('floor space');
    expect(stairsOnly).toBeNull();
    expect(stairsWithSupport?.exercises[0].id).toBe(STEP_UP_ID);
    expect(balanceNoSupport).toBeNull();
    expect(bandNoAnchor).toBeNull();
    expect(bandWithAnchor?.exercises[0].id).toBe(STANDING_BAND_ROW_ID);
  });

  it('requires floor-transfer confirmation before floor ladder practice starts', () => {
    const result = planLadderPracticeSessionResult({
      ladderId: 'hinge-glutes',
      requestedLevelId: BRIDGE_HOLD_ID,
      activeBlock: block(),
      training: {
        ...legacyTraining(),
        ladderProgressById: {
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
      },
      safetyProfile: { ...safety(), availableEquipment: ['chair', 'wall', 'floor_space'], movementCapabilities: undefined },
      lifeGoal: lifeGoal(),
      adjustment: null,
      today: START,
    });

    expect(result.kind).toBe('unavailable');
    if (result.kind !== 'unavailable') throw new Error('expected unavailable result');
    expect(result.reason).toBe('movement_capability_not_confirmed');
    expect(sessionPlanFromPlanningResult(result)).toBeNull();
  });

  it('shows floor space in session equipment labels when explicit manual floor work is selected', () => {
    const plan = planLadderPracticeSession({
      ladderId: 'hinge-glutes',
      requestedLevelId: BRIDGE_HOLD_ID,
      activeBlock: strengthBlock(),
      training: legacyTraining(),
      safetyProfile: { ...safety(), availableEquipment: ['chair', 'wall', 'floor_space'] },
      lifeGoal: lifeGoal(),
      adjustment: null,
      today: '2026-06-03T08:00:00.000Z',
    });

    expect(plan?.exercises.map((exercise) => exercise.id)).toContain(BRIDGE_HOLD_ID);
    expect(plan?.metadata?.equipmentNeeded).toContain('floor space');
  });

  it('uses canonical profile equipment instead of legacy training booleans for current planning', () => {
    const b = strengthBlock();
    const plan = planTodayHaleSession({
      activeBlock: b,
      training: {
        ...legacyTraining(),
        equipment: { stair: false, band: false, miniBand: false, load: false },
      },
      safetyProfile: {
        ...safety(),
        availableEquipment: ['chair', 'wall', 'resistance_band', 'door_anchor'],
        equipmentStatus: 'confirmed',
        equipmentRevision: 7,
      },
      lifeGoal: lifeGoal(),
      targetSessionTemplateId: 'session_a',
      today: START,
    });

    expect(plan.metadata?.equipmentSnapshot).toMatchObject({
      status: 'confirmed',
      capabilities: ['chair', 'wall', 'resistance_band', 'door_anchor'],
      sourceRevision: 7,
    });
    expect(plan.exercises.map((exercise) => exercise.id)).toContain(SEATED_BAND_ROW_ID);
  });

  it('requires equipment confirmation instead of planning from unknown profile equipment', () => {
    const result = planTodayHaleSessionResult({
      activeBlock: strengthBlock(),
      training: { ...legacyTraining(), equipment: { stair: true, band: true, miniBand: true, load: true } },
      safetyProfile: { ...safety(), availableEquipment: [], equipmentStatus: 'needs_confirmation' },
      lifeGoal: lifeGoal(),
      today: START,
    });

    expect(result.kind).toBe('unavailable');
    if (result.kind !== 'unavailable') throw new Error('expected unavailable result');
    expect(result.reason).toBe('equipment_confirmation_required');
    expect(sessionPlanFromPlanningResult(result)).toBeNull();
  });

  it('invalidates unstarted plans when the canonical equipment fingerprint changes', () => {
    const b = strengthBlock();
    const plan = planTodayHaleSession({
      activeBlock: b,
      training: legacyTraining(),
      safetyProfile: { ...safety(), availableEquipment: ['chair', 'wall', 'resistance_band'] },
      lifeGoal: lifeGoal(),
      targetSessionTemplateId: 'session_a',
      today: START,
    });

    expect(
      validateHaleSessionPlanEquipment({
        plan,
        safetyProfile: { ...safety(), availableEquipment: ['wall', 'chair', 'resistance_band'] },
      }).status
    ).toBe('current');

    const validation = validateHaleSessionPlanEquipment({
      plan,
      safetyProfile: { ...safety(), availableEquipment: ['chair', 'wall'] },
    });
    expect(validation.status).toBe('equipment_changed');
    const recovery = staleEquipmentPlanningResult({ plan, validation });
    expect(recovery.reason).toBe('equipment_changed_after_planning');
    expect(getSessionPlanningRecoveryCopy(recovery)?.title).toContain('quick refresh');
  });

  it('invalidates unstarted plans when movement capability confirmations change', () => {
    const b = strengthBlock();
    const plan = planTodayHaleSession({
      activeBlock: b,
      training: legacyTraining(),
      safetyProfile: { ...safety(), availableEquipment: ['chair', 'wall', 'resistance_band'] },
      lifeGoal: lifeGoal(),
      targetSessionTemplateId: 'session_a',
      today: START,
    });

    expect(
      validateHaleSessionPlanMovementCapabilities({
        plan,
        safetyProfile: safety(),
      }).status
    ).toBe('current');

    const changedCapabilities = {
      ...confirmedMovementCapabilities(),
      floorTransfer: { status: 'avoid_for_now' as const },
      revision: 2,
      updatedAt: '2026-06-02T08:00:00.000Z',
    };
    const validation = validateHaleSessionPlanMovementCapabilities({
      plan,
      safetyProfile: { ...safety(), movementCapabilities: changedCapabilities },
    });
    expect(validation.status).toBe('capability_changed');
    const recovery = staleMovementCapabilityPlanningResult({ plan, validation });
    expect(recovery.reason).toBe('movement_capability_changed');
    expect(getSessionPlanningRecoveryCopy(recovery)?.title).toContain('movement setup');
  });

  it('stamps and validates safety cue snapshots before an unstarted plan can begin', () => {
    const b = strengthBlock();
    const plan = planTodayHaleSession({
      activeBlock: b,
      training: legacyTraining(),
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      targetSessionTemplateId: 'session_a',
      today: START,
    });

    expect(plan.metadata?.safetyCueSnapshot?.schemaVersion).toBe(1);
    expect(plan.exercises.every((exercise) => exercise.safetyCueProfile?.schemaVersion === 1)).toBe(true);
    expect(validateHaleSessionPlanSafetyCues({ plan }).status).toBe('current');

    const stalePlan: HaleSessionPlan = {
      ...plan,
      metadata: {
        ...plan.metadata!,
        safetyCueSnapshot: {
          ...plan.metadata!.safetyCueSnapshot!,
          globalCueIds: plan.metadata!.safetyCueSnapshot!.globalCueIds.filter(
            (cueId) => cueId !== 'global_stop_dizzy_or_lightheaded'
          ),
          fingerprint: 'stale',
        },
      },
    };
    const validation = validateHaleSessionPlanSafetyCues({ plan: stalePlan });
    expect(validation.status).toBe('missing_required_stop_rules');
    const recovery = staleSafetyCuePlanningResult({ plan: stalePlan, validation });
    expect(recovery.reason).toBe('missing_required_stop_rules');
    expect(getSessionPlanningRecoveryCopy(recovery)?.title).toContain('safety setup');
  });

  it('stamps and validates release policy snapshots before an unstarted plan can begin', () => {
    const b = strengthBlock();
    const plan = planTodayHaleSession({
      activeBlock: b,
      training: legacyTraining(),
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      targetSessionTemplateId: 'session_a',
      today: START,
    });

    expect(plan.metadata?.releasePolicySnapshot?.schemaVersion).toBe(1);
    expect(validateHaleSessionPlanReleasePolicy({ plan }).status).toBe('current');

    const stalePlan: HaleSessionPlan = {
      ...plan,
      exercises: [
        {
          ...plan.exercises[0],
          id: PUSHUP_STANDARD_ID,
          ladderId: 'push',
          releaseStatus: 'v1_optional',
        },
        ...plan.exercises.slice(1),
      ],
    };
    const validation = validateHaleSessionPlanReleasePolicy({ plan: stalePlan });
    expect(validation.status).toBe('exercise_level_not_available_in_controlled_beta');
    const recovery = staleReleasePolicyPlanningResult({ plan: stalePlan, validation });
    expect(recovery.reason).toBe('exercise_level_not_available_in_controlled_beta');
    expect(getSessionPlanningRecoveryCopy(recovery)?.title).toContain('quick refresh');
  });

  it('requires a release policy snapshot on current plans', () => {
    const plan = planTodayHaleSession({
      activeBlock: strengthBlock(),
      training: legacyTraining(),
      safetyProfile: safety(),
      lifeGoal: neutralLifeGoal(),
      targetSessionTemplateId: 'session_a',
      today: START,
    });
    const restoredWithoutReleaseSnapshot: HaleSessionPlan = {
      ...plan,
      metadata: {
        ...plan.metadata!,
        releasePolicySnapshot: undefined,
      },
    };
    const validation = validateHaleSessionPlanReleasePolicy({ plan: restoredWithoutReleaseSnapshot });

    expect(validation.status).toBe('missing_release_policy_snapshot');
    expect(staleReleasePolicyPlanningResult({ plan: restoredWithoutReleaseSnapshot, validation }).reason).toBe(
      'missing_release_policy_snapshot'
    );
  });

  it('stamps and validates progression policy snapshots before an unstarted plan can begin', () => {
    const plan = planTodayHaleSession({
      activeBlock: strengthBlock(),
      training: legacyTraining(),
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      targetSessionTemplateId: 'session_a',
      today: START,
    });

    expect(plan.metadata?.progressionPolicySnapshot?.schemaVersion).toBe(1);
    expect(validateHaleSessionPlanProgressionPolicy({ plan }).status).toBe('current');

    const restoredWithoutProgressionSnapshot: HaleSessionPlan = {
      ...plan,
      metadata: {
        ...plan.metadata!,
        progressionPolicySnapshot: undefined,
      },
    };
    const missingValidation = validateHaleSessionPlanProgressionPolicy({ plan: restoredWithoutProgressionSnapshot });
    expect(missingValidation.status).toBe('missing_progression_policy_snapshot');
    expect(staleProgressionPolicyPlanningResult({ plan: restoredWithoutProgressionSnapshot, validation: missingValidation }).reason).toBe(
      'missing_progression_policy_snapshot'
    );

    const stalePlan: HaleSessionPlan = {
      ...plan,
      metadata: {
        ...plan.metadata!,
        progressionPolicySnapshot: {
          ...plan.metadata!.progressionPolicySnapshot!,
          policyFingerprint: 'stale-policy',
          fingerprint: 'stale-plan',
        },
      },
    };
    const staleValidation = validateHaleSessionPlanProgressionPolicy({ plan: stalePlan });
    expect(staleValidation.status).toBe('stale_progression_policy');
    const recovery = staleProgressionPolicyPlanningResult({ plan: stalePlan, validation: staleValidation });
    expect(recovery.reason).toBe('stale_progression_policy');
    expect(getSessionPlanningRecoveryCopy(recovery)?.title).toContain('quick refresh');
  });

  it('fails closed when generated exercise IDs are unsupported', () => {
    const b = strengthBlock();
    const result = planTodayHaleSessionResult({
      activeBlock: b,
      training: legacyTraining(),
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      today: START,
      generateSession: () => unsupportedGeneratedSession(),
    });

    expect(result.kind).toBe('unavailable');
    if (result.kind !== 'unavailable') throw new Error('expected unavailable result');
    expect(result.reason).toBe('unsupported_exercise_id');
    expect(result.issues?.map((issue) => issue.code)).toContain('unsupported_exercise_id');
    expect(sessionPlanFromPlanningResult(result)).toBeNull();
  });

  it('returns no-active-block recovery without consulting legacy training', () => {
    const result = planTodayHaleSessionResult({
      activeBlock: null,
      training: defaultTrainingState(),
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      today: START,
    });

    expect(result.kind).toBe('unavailable');
    if (result.kind !== 'unavailable') throw new Error('expected unavailable result');
    expect(result.reason).toBe('no_active_block');
    expect(result.recoveryActions).toContain('create_block');
    expect(sessionPlanFromPlanningResult(result)).toBeNull();
    const copy = getSessionPlanningRecoveryCopy(result);
    expect(copy?.title).toContain('current plan');
    expect(`${copy?.title} ${copy?.body}`.toLowerCase()).not.toMatch(/corrupt|lost|failure|streak/);
  });

  it.each([
    ['generator_exception', () => { throw new Error('test generator failure'); }],
    ['missing_generated_session', () => null as never],
    ['empty_generated_session', () => emptyGeneratedSession()],
    ['duplicate_exercise_id', () => duplicateGeneratedSession()],
    ['invalid_generated_exercise', () => malformedDoseGeneratedSession()],
    ['source_identity_mismatch', () => singleSitToStandGeneratedSession('other-block')],
    ['unsupported_focus_domain', () => unsupportedFocusGeneratedSession()],
    ['no_safe_exercises', () => unsafeEquipmentGeneratedSession()],
  ] as const)('returns unavailable %s without a legacy plan', (reason, generateSession) => {
    const b = strengthBlock();
    const result = planTodayHaleSessionResult({
      activeBlock: b,
      training: legacyTraining(),
      safetyProfile: { ...safety(), availableEquipment: ['chair', 'wall'] },
      lifeGoal: lifeGoal(),
      today: START,
      generateSession,
    });

    expect(result.kind).toBe('unavailable');
    if (result.kind !== 'unavailable') throw new Error('expected unavailable result');
    expect(result.reason).toBe(reason);
    expect(result.recoveryActions.length).toBeGreaterThan(0);
    expect(sessionPlanFromPlanningResult(result)).toBeNull();
  });

  it('fails closed before generation when a requested template is not part of the active block', () => {
    const result = planTodayHaleSessionResult({
      activeBlock: strengthBlock(),
      training: legacyTraining(),
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      today: START,
      targetSessionTemplateId: 'not-a-current-template',
      generateSession: () => {
        throw new Error('generator should not run');
      },
    });

    expect(result.kind).toBe('unavailable');
    if (result.kind !== 'unavailable') throw new Error('expected unavailable result');
    expect(result.reason).toBe('invalid_template');
    expect(result.issues?.map((issue) => issue.code)).toContain('template_id_mismatch');
  });

  it('keeps valid supporting current plans distinct from generation failures', () => {
    const result = planTodayHaleSessionResult({
      activeBlock: strengthBlock(),
      training: legacyTraining(),
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      today: START,
      generateSession: () => fallbackOnlyShortGeneratedSession(),
    });
    const plan = sessionPlanFromPlanningResult(result);

    expect(result.kind).toBe('supporting_session');
    expect(plan?.metadata?.source).toBe('block_generated');
    expect(plan?.metadata?.focusStimulus?.mainPlanCreditPotential).toBe(false);
    expect(plan?.metadata?.focusStimulus?.status).toBe('no_primary_focus_planned');
  });

  it('keeps week complete, block complete, and re-test due distinct from failures', () => {
    const b = strengthBlock();
    const weekComplete = planTodayHaleSessionResult({
      activeBlock: b,
      training: legacyTraining(),
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      recentCompletions: [
        scheduledCompletion(b, 'strength-A', '2026-06-01T09:00:00.000Z'),
        scheduledCompletion(b, 'strength-B', '2026-06-02T09:00:00.000Z'),
        scheduledCompletion(b, 'strength-C', '2026-06-03T09:00:00.000Z'),
      ],
      today: '2026-06-07T08:00:00.000Z',
    });
    const blockComplete = planTodayHaleSessionResult({
      activeBlock: b,
      training: legacyTraining(),
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      recentCompletions: [
        ...scheduledWeekCompletions(b, 1, '2026-06-01'),
        ...scheduledWeekCompletions(b, 2, '2026-06-08'),
        ...scheduledWeekCompletions(b, 3, '2026-06-15'),
        ...scheduledWeekCompletions(b, 4, '2026-06-22'),
      ],
      today: '2026-06-24T12:00:00.000Z',
    });
    const retestDue = planTodayHaleSessionResult({
      activeBlock: b,
      training: legacyTraining(),
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      lifecycleState: 'monthly_retest_due',
      today: START,
    });

    expect(weekComplete.kind).toBe('week_complete');
    expect(blockComplete.kind).toBe('block_complete');
    expect(retestDue.kind).toBe('retest_due');
  });

  it('validates generated output as pure data before adaptation', () => {
    const validation = validateGeneratedSessionForPlanning({
      generated: duplicateGeneratedSession(),
      activeBlock: strengthBlock(),
      dynamicBlock: null,
      availableEquipment: ['chair', 'wall'],
    });

    expect(validation.valid).toBe(false);
    if (validation.valid) throw new Error('expected invalid generated session');
    expect(validation.reason).toBe('duplicate_exercise_id');
    expect(validation.issues.map((issue) => issue.code)).toContain('duplicate_exercise_id');
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
    expect(plan.metadata?.progressionEvidencePolicy).toBe('hold_only');
    expect(plan.estimatedMinutes).toBe(10);
    expect(plan.exercises.length).toBeLessThanOrEqual(3);
  });

  it('turns make-it-gentler into a low-energy plan with lower daily dose and level', () => {
    const progress: Record<string, LadderProgress> = {
      'sit-to-stand': {
        ladderId: 'sit-to-stand',
        currentLevelId: STS_POWER_ID,
        completedSessionsAtLevel: 1,
        failedSessionsAtLevel: 0,
        recentCompletionRates: [0.95],
        recentRpe: [2],
        recentPain: [false],
        updatedAt: START,
      },
    };
    const plan = planTodayHaleSession({
      activeBlock: strengthBlock(),
      training: legacyTraining(),
      safetyProfile: safety(),
      lifeGoal: neutralLifeGoal(),
      ladderProgress: progress,
      adjustment: 'gentler',
      today: START,
    });
    const sitToStand = plan.metadata?.generatedExercises?.find((exercise) => exercise.ladderId === 'sit-to-stand');

    expect(plan.metadata?.readiness).toBe('low_energy');
    expect(plan.metadata?.dailyContext?.readiness).toBe('low_energy');
    expect(plan.metadata?.progressionEvidencePolicy).toBe('hold_only');
    expect(plan.metadata?.guidance?.join(' ')).toMatch(/sets are reduced/i);
    expect(sitToStand?.requestedLevelId).toBe(STS_POWER_ID);
    expect(sitToStand?.selectedDailyLevelId).toBe(STS_CUSHION_ID);
    expect(sitToStand?.adjustmentReasons).toEqual(expect.arrayContaining(['auto_progression_cap', 'legacy_progression_policy_capped']));
    expect(sitToStand?.sets).toBeLessThanOrEqual(sitToStand?.doseBeforeAdjustment?.sets ?? Infinity);
    expect(progress['sit-to-stand'].currentLevelId).toBe(STS_POWER_ID);
  });

  it('explains a gentler plan preference differently from a user gentler adjustment', () => {
    const plan = planTodayHaleSession({
      activeBlock: strengthBlock(),
      training: legacyTraining(),
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      readiness: 'low_energy',
      dailyContextSource: 'plan_preference',
      today: START,
    });

    expect(plan.metadata?.readiness).toBe('low_energy');
    expect(plan.metadata?.dailyContext?.source).toBe('plan_preference');
    expect(plan.metadata?.guidance?.join(' ')).toContain('Your plan is set to a gentler pace today.');
    expect(plan.metadata?.guidance?.join(' ')).not.toMatch(/sets are reduced today/i);
  });

  it('credits a short main-plan session only when the planned primary focus exercise is completed', () => {
    const b: MovementBlock = {
      ...block(),
      focusDomain: 'balance',
      secondaryDomains: ['strength_power', 'mobility'],
    };
    const plan = planTodayHaleSession({
      activeBlock: b,
      training: legacyTraining(),
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      adjustment: 'shorter',
      today: START,
    });
    const primaryId = plan.metadata?.focusStimulus?.plannedPrimaryFocusExerciseIds[0];
    const nonPrimaryId = plan.exercises.find((exercise) => exercise.id !== primaryId)?.id;

    expect(plan.metadata?.readiness).toBe('short_on_time');
    expect(plan.metadata?.focusStimulus).toMatchObject({
      status: 'eligible',
      mainPlanCreditPotential: true,
      blockFocusDomain: 'balance',
    });
    expect(primaryId).toBeTruthy();
    expect(nonPrimaryId).toBeTruthy();

    const credited = evaluateCompletedFocusStimulusEvidence({
      sessionPlan: plan,
      result: completedResult([primaryId!], plan.exercises.map((exercise) => exercise.id).filter((id) => id !== primaryId)),
      activeBlock: b,
    });
    const primarySkipped = evaluateCompletedFocusStimulusEvidence({
      sessionPlan: plan,
      result: completedResult([nonPrimaryId!], [primaryId!]),
      activeBlock: b,
    });

    expect(credited.mainPlanCredit).toBe(true);
    expect(credited.status).toBe('credited_focus_work');
    expect(primarySkipped.mainPlanCredit).toBe(false);
    expect(primarySkipped.status).toBe('primary_focus_not_completed');
    expect(primarySkipped.completedPrimaryFocusExerciseIds).toEqual([]);
  });

  it('saves a short generated attempt as partial non-credit when it contains only fallback focus work', () => {
    const b: MovementBlock = {
      ...block(),
      focusDomain: 'strength_power',
      secondaryDomains: ['balance', 'mobility'],
    };
    const plan = planTodayHaleSession({
      activeBlock: b,
      training: legacyTraining(),
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      adjustment: 'shorter',
      today: START,
      generateSession: () => fallbackOnlyShortGeneratedSession(),
    });
    const result = completedResult(plan.exercises.map((exercise) => exercise.id));
    const workEvidence = evaluateSessionWorkEvidence(plan, result);
    const focusEvidence = evaluateCompletedFocusStimulusEvidence({ sessionPlan: plan, result, activeBlock: b, workEvidence });
    const summary = createGeneratedSessionSummary({
      sessionPlan: plan,
      completedAt: '2026-06-01T09:00:00.000Z',
      durationMinutes: plan.estimatedMinutes,
      mainPlanCredit: focusEvidence.mainPlanCredit,
      workEvidence: summarizeWorkEvidence(workEvidence),
      focusStimulusEvidence: focusStimulusEvidenceSummary(focusEvidence),
    });

    expect(countsTowardMainPlan(plan)).toBe(true);
    expect(plan.metadata?.focusStimulus).toMatchObject({
      status: 'no_primary_focus_planned',
      mainPlanCreditPotential: false,
      fallbackFocusSlotIds: ['short-strength-fallback'],
    });
    expect(focusEvidence.mainPlanCredit).toBe(false);
    expect(focusEvidence.exclusionReason).toBe('no_primary_focus_planned');
    expect(summary.status).toBe('partial');
    expect(summary.mainPlanCredit).toBe(false);
    expect(summary.focusStimulusEvidence?.fallbackFocusSlotIds).toEqual(['short-strength-fallback']);
  });

  it('marks equipment, readiness, and pain removal of primary focus as visible non-credit attempts', () => {
    const scenarios: Array<{
      label: string;
      block: MovementBlock;
      plan: HaleSessionPlan;
    }> = [];
    const strengthBlock: MovementBlock = {
      ...block(),
      focusDomain: 'strength_power',
      secondaryDomains: ['balance', 'mobility'],
    };
    const balanceBlock: MovementBlock = {
      ...block(),
      focusDomain: 'balance',
      secondaryDomains: ['strength_power', 'mobility'],
    };

    scenarios.push({
      label: 'true no-equipment strength',
      block: strengthBlock,
      plan: planTodayHaleSession({
        activeBlock: strengthBlock,
        training: legacyTraining(),
        safetyProfile: { ...safety(), availableEquipment: ['none'] },
        lifeGoal: lifeGoal(),
        today: START,
      }),
    });
    scenarios.push({
      label: 'short true no-equipment balance',
      block: balanceBlock,
      plan: planTodayHaleSession({
        activeBlock: balanceBlock,
        training: legacyTraining(),
        safetyProfile: { ...safety(), availableEquipment: ['none'] },
        lifeGoal: lifeGoal(),
        adjustment: 'shorter',
        today: START,
      }),
    });
    scenarios.push({
      label: 'pain filtered primary strength',
      block: strengthBlock,
      plan: planTodayHaleSession({
        activeBlock: strengthBlock,
        training: legacyTraining(),
        safetyProfile: safety(),
        lifeGoal: lifeGoal(),
        adjustment: 'something_hurts',
        painArea: 'knee',
        today: START,
        generateSession: () => painFallbackOnlyGeneratedSession(),
      }),
    });

    for (const scenario of scenarios) {
      const result = completedResult(scenario.plan.exercises.map((exercise) => exercise.id));
      const focusEvidence = evaluateCompletedFocusStimulusEvidence({
        sessionPlan: scenario.plan,
        result,
        activeBlock: scenario.block,
      });
      const metadata = scenario.plan.metadata?.focusStimulus;

      expect(`${scenario.label} source`).toBeTruthy();
      expect(scenario.plan.metadata?.source).toBe('block_generated');
      expect(metadata?.mainPlanCreditPotential).toBe(false);
      expect(focusEvidence.mainPlanCredit).toBe(false);
      expect(
        (metadata?.fallbackFocusSlotIds.length ?? 0) +
          (metadata?.skippedFocusSlotIds.length ?? 0) +
          (metadata?.focusMismatchExerciseIds.length ?? 0)
      ).toBeGreaterThan(0);
      expect(scenario.plan.metadata?.guidance?.join(' ') ?? scenario.plan.purposeCopy).toMatch(
        /support|floor|band|comfortable|useful|main plan|skipped|lower-equipment/i
      );
    }
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

    expect(plan.metadata?.equipmentSnapshot?.capabilities).toEqual(['chair', 'wall']);
    expect(equipment).not.toContain('long_band');
    expect(equipment).not.toContain('stair');
    expect(equipment).not.toContain('mini_band');
    expect(equipment).not.toContain('backpack_or_weight');
  });

  it('creates a gentle shorter block restart plan for inactive restarts', () => {
    const plan = planTodayHaleSession({
      activeBlock: block(),
      training: legacyTraining(),
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      lifecycleState: 'inactive_restart',
      today: START,
    });

    expect(plan.sessionType).toBe('restart');
    expect(plan.metadata?.source).toBe('block_generated');
    expect(plan.metadata?.dailyContext?.source).toBe('planned_restart');
    expect(plan.metadata?.guidance?.join(' ')).toContain('Today is planned as a gentle restart.');
    expect(plan.estimatedMinutes).toBeLessThan(20);
  });

  it('creates a restart plan when the current week needs a clean slate', () => {
    const b = block();
    const firstTemplateId = requiredMainPlanTemplatesForBlock(b).templateIds[0];
    if (!firstTemplateId) throw new Error('expected a main-plan template for the block');
    const plan = planTodayHaleSession({
      activeBlock: b,
      training: legacyTraining(),
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      recentCompletions: [
        scheduledCompletion(b, firstTemplateId, '2026-06-02T08:00:00.000Z'),
      ],
      today: '2026-06-09T08:00:00.000Z',
    });

    expect(plan.sessionType).toBe('restart');
    expect(plan.metadata?.dailyContext?.source).toBe('planned_restart');
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

  it('updates dynamic ladder progress without touching the legacy completion path', () => {
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
    const completion = creditedCompletionForPlan(b, plan, result);

    const ladderProgress = updateExerciseProgressionFromSession({
      sessionPlan: plan,
      completion,
      sessionResult: result,
      perceivedEffort: 2,
      painReported: false,
      trackingQuality: 'good',
    });

    expect(ladderProgress).toBeTruthy();
    expect(training.progress.completedSessions).toBe(0);
    expect(training.progression).toEqual(legacyTraining().progression);
  });

  it('keeps optional extra sessions out of main plan completion paths', () => {
    const extraPlan = planTodayHaleSession({
      activeBlock: null,
      training: legacyTraining(),
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      presetId: 'preset-quick-full-body',
      adjustment: null,
      today: START,
    });
    const practicePlan = planLadderPracticeSession({
      ladderId: 'sit-to-stand',
      activeBlock: block(),
      training: { ...legacyTraining(), ladderProgressById: ladderProgress() },
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      adjustment: null,
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
    expect(summary.progressionEvidencePolicy).toBe('normal');
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
    expect(plan.metadata?.progressionEvidencePolicy).toBe('normal');
  });

  it('updates ladder progress after two easy generated completions', () => {
    const b = strengthBlock();
    const plan = planTodayHaleSession({
      activeBlock: b,
      training: legacyTraining(),
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      today: START,
      generateSession: () => singleSitToStandGeneratedSession(strengthBlock().id, STS_CUSHION_ID),
    });
    const firstResult = { startedAt: START, items: [{ exerciseId: STS_CUSHION_ID, status: 'completed' as const, sets: [] }] };
    const firstCompletion = creditedCompletionForPlan(b, plan, firstResult, {
      completedAt: '2026-06-01T09:00:00.000Z',
    });
    const first = updateExerciseProgressionFromSession({
      sessionPlan: plan,
      completion: firstCompletion,
      sessionResult: firstResult,
      perceivedEffort: 2,
      painReported: false,
      trackingQuality: 'good',
    });
    const secondResult = { startedAt: START, items: [{ exerciseId: STS_CUSHION_ID, status: 'completed' as const, sets: [] }] };
    const second = updateExerciseProgressionFromSession({
      previousProgress: first,
      sessionPlan: plan,
      completion: {
        ...creditedCompletionForPlan(b, plan, secondResult, {
          completedAt: '2026-06-03T09:00:00.000Z',
        }),
        id: 'completion-distinct-same-plan',
      },
      sessionResult: secondResult,
      perceivedEffort: 2,
      painReported: false,
      trackingQuality: 'good',
    });

    expect(first['sit-to-stand'].currentLevelId).toBe(STS_CUSHION_ID);
    expect(second['sit-to-stand'].currentLevelId).toBe(STS_STANDARD_ID);
  });

  it('does not update ladder progress when result evidence is missing or skipped', () => {
    const b = strengthBlock();
    const plan = planTodayHaleSession({
      activeBlock: b,
      training: legacyTraining(),
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      today: START,
      generateSession: () => singleSitToStandGeneratedSession(),
    });
    const completion = creditedCompletionForPlan(
      b,
      plan,
      { startedAt: START, items: [{ exerciseId: STS_STANDARD_ID, status: 'completed', sets: [] }] },
      { completedAt: '2026-06-01T09:00:00.000Z' }
    );

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
    const b = strengthBlock();
    const plan = planTodayHaleSession({
      activeBlock: b,
      training: legacyTraining(),
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      today: START,
      generateSession: () => singleSitToStandGeneratedSession(),
    });
    const result = { startedAt: START, items: [{ exerciseId: STS_STANDARD_ID, status: 'completed' as const, sets: [] }] };
    const completion = creditedCompletionForPlan(b, plan, result, {
      completedAt: '2026-06-01T09:00:00.000Z',
    });
    const oneGood = updateExerciseProgressionFromSession({
      sessionPlan: plan,
      completion,
      sessionResult: result,
      perceivedEffort: 2,
      painReported: false,
      trackingQuality: 'good',
    });
    const painful = updateExerciseProgressionFromSession({
      previousProgress: oneGood,
      sessionPlan: plan,
      completion: { ...completion, id: 'completion-painful', completedAt: '2026-06-03T09:00:00.000Z' },
      sessionResult: { startedAt: START, items: [{ exerciseId: STS_STANDARD_ID, status: 'completed', sets: [] }] },
      perceivedEffort: 5,
      painReported: true,
      painAreas: ['knee'],
      trackingQuality: 'good',
    });
    const poorTracking = updateExerciseProgressionFromSession({
      previousProgress: oneGood,
      sessionPlan: plan,
      completion: { ...completion, id: 'completion-poor-tracking', completedAt: '2026-06-04T09:00:00.000Z' },
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

function singleSitToStandGeneratedSession(
  blockId = strengthBlock().id,
  exerciseId: typeof STS_STANDARD_ID | typeof STS_CUSHION_ID = STS_STANDARD_ID
): GeneratedSession {
  const isCushion = exerciseId === STS_CUSHION_ID;
  return {
    id: 'generated-sit-to-stand',
    blockId,
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
        exerciseId,
        ladderId: 'sit-to-stand',
        levelId: exerciseId,
        selectedDomain: 'strength_power',
      },
    ],
    guidance: [],
    exercises: [
      {
        id: `lower-strength-a-${exerciseId}-1`,
        exerciseId,
        ladderId: 'sit-to-stand',
        ladderTitle: 'Sit-to-Stand',
        levelId: exerciseId,
        level: isCushion ? 0 : 1,
        name: isCushion ? 'Cushion Sit-to-Stand' : 'Standard Sit-to-Stand',
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
    blockId: strengthBlock().id,
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

function emptyGeneratedSession(): GeneratedSession {
  return {
    ...singleSitToStandGeneratedSession(),
    id: 'generated-empty-session',
    exercises: [],
    slotStimulus: [],
  };
}

function duplicateGeneratedSession(): GeneratedSession {
  const base = singleSitToStandGeneratedSession();
  return {
    ...base,
    id: 'generated-duplicate-session',
    exercises: [
      base.exercises[0],
      {
        ...base.exercises[0],
        id: 'lower-strength-a-sit-to-stand-standard-duplicate',
      },
    ],
  };
}

function malformedDoseGeneratedSession(): GeneratedSession {
  const base = singleSitToStandGeneratedSession();
  return {
    ...base,
    id: 'generated-malformed-dose-session',
    exercises: base.exercises.map((exercise) => ({
      ...exercise,
      sets: 0,
      repsPerSet: undefined,
      secondsPerSet: undefined,
    })),
  };
}

function unsupportedFocusGeneratedSession(): GeneratedSession {
  return {
    ...singleSitToStandGeneratedSession(),
    focusDomain: 'agility' as never,
  };
}

function unsafeEquipmentGeneratedSession(): GeneratedSession {
  const base = singleSitToStandGeneratedSession();
  return {
    ...base,
    id: 'generated-unsafe-equipment-session',
    exercises: base.exercises.map((exercise) => ({
      ...exercise,
      equipment: ['stair'],
    })),
  };
}

function lifecycleGeneratedSession(weekStatus: 'week_complete' | 'block_complete'): GeneratedSession {
  return {
    ...singleSitToStandGeneratedSession(),
    id: `generated-${weekStatus}`,
    templateId: weekStatus,
    title: weekStatus === 'week_complete' ? 'This week is complete' : 'This block is complete',
    estimatedMinutes: 0,
    durationLabel: '0 min',
    weekStatus,
    exercises: [],
    slotStimulus: [],
  };
}

function fallbackOnlyShortGeneratedSession(): GeneratedSession {
  return {
    id: 'generated-short-fallback-only',
    blockId: strengthBlock().id,
    templateId: 'strength-A',
    source: 'block_generated',
    title: 'Short Strength Session A',
    focusDomain: 'strength_power',
    dayLabel: 'A',
    estimatedMinutes: 10,
    durationLabel: 'About 10 min',
    readiness: 'short_on_time',
    painAreas: [],
    weekStatus: 'session_due',
    skippedSlots: [],
    skippedSlotReasons: [],
    slotStimulus: [
      {
        slotId: 'short-strength-fallback',
        slotType: 'lower_body_strength',
        slotTitle: 'Chair-rise strength',
        intendedDomain: 'strength_power',
        role: 'fallback',
        reason: 'equipment_limited',
        message: 'Chair-rise strength used a lower-equipment option today.',
        exerciseId: STS_SLOW_ECC_ID,
        ladderId: 'sit-to-stand',
        levelId: STS_SLOW_ECC_ID,
        selectedDomain: 'strength_power',
      },
    ],
    guidance: ['This is supporting work today, but it is not primary focus credit.'],
    exercises: [
      {
        id: 'short-strength-fallback-sts-slow-1',
        exerciseId: STS_SLOW_ECC_ID,
        ladderId: 'sit-to-stand',
        ladderTitle: 'Sit-to-Stand',
        levelId: STS_SLOW_ECC_ID,
        level: 2,
        name: 'Slow Sit-to-Stand',
        slotType: 'lower_body_strength',
        domain: 'strength_power',
        kind: 'reps',
        releaseStatus: 'v1_core',
        measurementTier: 'measured',
        cameraView: 'side',
        equipment: ['chair'],
        instructions: 'Stand from the chair with control.',
        whyItMatters: 'Build chair-rise strength.',
        sets: 1,
        repsPerSet: 6,
        restSeconds: 30,
        estimatedMinutes: 3,
        rationale: 'Fallback-only short-session fixture.',
        intendedDomain: 'strength_power',
        stimulusRole: 'fallback',
        stimulusReason: 'equipment_limited',
      },
    ],
  };
}

function painFallbackOnlyGeneratedSession(): GeneratedSession {
  return {
    ...fallbackOnlyShortGeneratedSession(),
    id: 'generated-pain-fallback-only',
    title: 'Gentle Strength Session A',
    readiness: 'something_hurts',
    painAreas: ['knee'],
    estimatedMinutes: 12,
    durationLabel: '12 min',
    slotStimulus: [
      {
        slotId: 'pain-strength-primary',
        slotType: 'lower_body_strength',
        slotTitle: 'Chair-rise strength',
        intendedDomain: 'strength_power',
        role: 'fallback',
        reason: 'safety_limited',
        message: 'Chair-rise strength used a gentler option for the discomfort reported today.',
        exerciseId: STS_SLOW_ECC_ID,
        ladderId: 'sit-to-stand',
        levelId: STS_SLOW_ECC_ID,
        selectedDomain: 'strength_power',
      },
    ],
    guidance: ['Today keeps the session gentle. Move only in a comfortable range.'],
    exercises: fallbackOnlyShortGeneratedSession().exercises.map((exercise) => ({
      ...exercise,
      id: 'pain-strength-fallback-sts-slow-1',
      stimulusReason: 'safety_limited' as const,
      rationale: 'Pain-filtered fallback-only fixture.',
    })),
  };
}

function completedResult(completedIds: readonly string[], skippedIds: readonly string[] = []): TrainingSessionResult {
  return {
    startedAt: START,
    items: [
      ...completedIds.map((exerciseId) => ({ exerciseId, status: 'completed' as const, sets: [] })),
      ...skippedIds.map((exerciseId) => ({ exerciseId, status: 'skipped' as const, sets: [] })),
    ],
  };
}

function creditedCompletionForPlan(
  block: MovementBlock,
  plan: HaleSessionPlan,
  result: TrainingSessionResult,
  overrides: Partial<ReturnType<typeof makeTrainingSessionCompletion>> = {}
) {
  const workEvidence = evaluateSessionWorkEvidence(plan, result);
  const focusEvidence = evaluateCompletedFocusStimulusEvidence({
    sessionPlan: plan,
    result,
    activeBlock: block,
    workEvidence,
  });
  return {
    ...makeTrainingSessionCompletion({
      block,
      sessionType: plan.sessionType,
      completedAt: overrides.completedAt ?? '2026-06-01T09:00:00.000Z',
      plannedDate: plan.metadata?.plannedDateKey,
      source: plan.metadata?.source,
      templateId: plan.metadata?.templateId,
      mainPlanCredit: focusEvidence.mainPlanCredit,
      scheduleCredit: focusEvidence.mainPlanCredit
        ? {
            policyVersion: BLOCK_SCHEDULE_POLICY_VERSION,
            credited: true,
            status: 'credited',
            weekIndex: 0,
            weekNumber: 1,
            dateKey: (overrides.completedAt ?? '2026-06-01T09:00:00.000Z').slice(0, 10),
            templateId: plan.metadata?.templateId,
            creditId: plan.metadata?.plannedDateKey,
          }
        : undefined,
      workEvidence: summarizeWorkEvidence(workEvidence),
      focusStimulusEvidence: focusStimulusEvidenceSummary(focusEvidence),
    }),
    ...overrides,
  };
}

function scheduledWeekCompletions(
  block: MovementBlock,
  weekNumber: number,
  startDateKey: string
): ReturnType<typeof makeTrainingSessionCompletion>[] {
  const [year, month, day] = startDateKey.split('-').map(Number);
  const base = Date.UTC(year, month - 1, day, 9);
  return ['A', 'B', 'C'].map((label, index) => {
    const completedAt = new Date(base + index * 86400000).toISOString();
    return scheduledCompletion(block, `strength-${label}`, completedAt, `week-${weekNumber}-${label}`);
  });
}

function scheduledCompletion(
  block: MovementBlock,
  templateId: string,
  completedAt: string,
  idSuffix = templateId
): ReturnType<typeof makeTrainingSessionCompletion> {
  return {
    ...makeTrainingSessionCompletion({
      block,
      sessionType: 'standard',
      completedAt,
      plannedDate: `${templateId}:${completedAt.slice(0, 10)}`,
      source: 'block_generated',
      templateId,
      mainPlanCredit: true,
      focusStimulusEvidence: scheduledFocusEvidence(block),
    }),
    id: `completion-${idSuffix}`,
  };
}

function scheduledFocusEvidence(block: MovementBlock): TrainingFocusStimulusEvidenceSummary {
  return {
    planStatus: 'eligible',
    status: 'credited_focus_work',
    exclusionReason: 'none',
    mainPlanCredit: true,
    blockFocusDomain: block.focusDomain,
    plannedPrimaryFocusExerciseCount: 1,
    completedPrimaryFocusExerciseCount: 1,
    completedSupportingExerciseCount: 0,
    completedFallbackExerciseCount: 0,
    completedCrossDomainExerciseCount: 0,
    plannedPrimaryFocusExerciseIds: ['test-primary'],
    completedPrimaryFocusExerciseIds: ['test-primary'],
    completedSupportingExerciseIds: [],
    completedFallbackExerciseIds: [],
    completedCrossDomainExerciseIds: [],
    fallbackFocusSlotIds: [],
    skippedFocusSlotIds: [],
    focusStimulusExclusionReasons: [],
    missingMetadataExerciseIds: [],
    malformedMetadataExerciseIds: [],
    focusMismatchExerciseIds: [],
  };
}

function summarizeWorkEvidence(
  evidence: ReturnType<typeof evaluateSessionWorkEvidence>
): NonNullable<ReturnType<typeof createGeneratedSessionSummary>['workEvidence']> {
  return {
    plannedExerciseCount: evidence.plannedExerciseCount,
    resultItemCount: evidence.resultItemCount,
    completedExerciseCount: evidence.completedExerciseCount,
    skippedExerciseCount: evidence.skippedExerciseCount,
    missingResultCount: evidence.missingResultCount,
    duplicateResultCount: evidence.duplicateResultCount,
    malformedResultCount: evidence.malformedResultCount,
    unmatchedResultCount: evidence.unmatchedResultCount,
  };
}
