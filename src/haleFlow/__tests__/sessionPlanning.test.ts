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
  planTodayHaleSession as planTodayHaleSessionResult,
  requireHaleSessionPlan as planTodayHaleSession,
  sessionPlanFromPlanningResult,
  updateExerciseProgressionFromSession,
  validateGeneratedSessionForPlanning,
} from '../sessionPlanning';
import { createMovementAssessment } from '../assessments';
import { evaluateCompletedFocusStimulusEvidence, focusStimulusEvidenceSummary } from '../focusStimulusEvidence';
import { evaluateSessionWorkEvidence } from '../sessionWorkEvidence';
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
    const b = strengthBlock();
    const plan = planTodayHaleSession({
      activeBlock: b,
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
    expect(copy?.title).toContain('active current plan');
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
      today: START,
      generateSession: () => lifecycleGeneratedSession('week_complete'),
    });
    const blockComplete = planTodayHaleSessionResult({
      activeBlock: b,
      training: legacyTraining(),
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      today: START,
      generateSession: () => lifecycleGeneratedSession('block_complete'),
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
      generateSession: () => singleSitToStandGeneratedSession(),
    });
    const firstResult = { startedAt: START, items: [{ exerciseId: STS_STANDARD_ID, status: 'completed' as const, sets: [] }] };
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
    const secondResult = { startedAt: START, items: [{ exerciseId: STS_STANDARD_ID, status: 'completed' as const, sets: [] }] };
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

    expect(first['sit-to-stand'].currentLevelId).toBe(STS_STANDARD_ID);
    expect(second['sit-to-stand'].currentLevelId).toBe(STS_SLOW_ECC_ID);
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

function singleSitToStandGeneratedSession(blockId = strengthBlock().id): GeneratedSession {
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
      workEvidence: summarizeWorkEvidence(workEvidence),
      focusStimulusEvidence: focusStimulusEvidenceSummary(focusEvidence),
    }),
    ...overrides,
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
