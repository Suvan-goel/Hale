import { getExercise } from '../../../exercises';
import {
  EMPTY_BOTH_SIDES_START_SIDE_SEED_STATE,
  TRAINING_BOTH_SIDES_AFFECTED_EXERCISE_IDS,
  advanceBothSidesRoundState,
  applyBothSidesExerciseCompletionToStartSideSeed,
  attachBothSidesDosePlansToGeneratedSession,
  bothSidesRoundResultsToLegacySetResults,
  createBothSidesRoundRuntimeState,
  createTrainingSideSegmentResult,
  deriveBothSidesDosePlan,
  deriveBothSidesDosePlanForExerciseId,
  isBothSidesDosePlan,
  nextBothSidesStartSideForExercise,
  restoreBothSidesRoundRuntimeState,
  selectTrainingBothSidesRoundsMode,
  semanticSideRoleForExercise,
  serializeBothSidesRoundRuntimeState,
  summarizeBothSidesProgression,
  voiceSideVariantForExercise,
  type BothSidesDoseUnit,
  type BothSidesGeneratedExerciseLike,
  type BothSidesRoundRuntimeState,
  type TrainingRoundSide,
  type TrainingRoundSideRole,
} from '..';
import {
  getTrainingVoiceContractV21,
  planTrainingVoiceSequenceV21,
  resolveTrainingVoiceRuntimeReadinessV21,
  resolveTrainingVoiceTargetV21,
} from '../../voiceV21';

const EXPECTED_MATRIX: readonly {
  readonly exerciseId: string;
  readonly sideRole: TrainingRoundSideRole;
  readonly sourceSetCount: number;
  readonly sourceTarget: number;
  readonly sourceUnit: BothSidesDoseUnit;
  readonly sourceTotal: number;
  readonly roundCount: number;
  readonly sideTarget: number;
  readonly leftTotal: number;
  readonly rightTotal: number;
  readonly voiceVariantLeft: string;
  readonly voiceVariantRight: string;
}[] = [
  {
    exerciseId: 'balance-single-leg-hold',
    sideRole: 'standing_leg',
    sourceSetCount: 3,
    sourceTarget: 15000,
    sourceUnit: 'hold_ms',
    sourceTotal: 45000,
    roundCount: 3,
    sideTarget: 7500,
    leftTotal: 22500,
    rightTotal: 22500,
    voiceVariantLeft: 'left',
    voiceVariantRight: 'right',
  },
  {
    exerciseId: 'balance-tandem-hold',
    sideRole: 'lead_foot',
    sourceSetCount: 3,
    sourceTarget: 20000,
    sourceUnit: 'hold_ms',
    sourceTotal: 60000,
    roundCount: 3,
    sideTarget: 10000,
    leftTotal: 30000,
    rightTotal: 30000,
    voiceVariantLeft: 'left_front',
    voiceVariantRight: 'right_front',
  },
  {
    exerciseId: 'chair-supported-split-squat',
    sideRole: 'front_leg',
    sourceSetCount: 2,
    sourceTarget: 8,
    sourceUnit: 'reps',
    sourceTotal: 16,
    roundCount: 2,
    sideTarget: 4,
    leftTotal: 8,
    rightTotal: 8,
    voiceVariantLeft: 'left_forward',
    voiceVariantRight: 'right_forward',
  },
  {
    exerciseId: 'seated-hamstring-reach',
    sideRole: 'extended_leg',
    sourceSetCount: 2,
    sourceTarget: 12000,
    sourceUnit: 'rom_window_ms',
    sourceTotal: 24000,
    roundCount: 2,
    sideTarget: 6000,
    leftTotal: 12000,
    rightTotal: 12000,
    voiceVariantLeft: 'left_extended',
    voiceVariantRight: 'right_extended',
  },
  {
    exerciseId: 'supported-hip-flexor-stretch',
    sideRole: 'stretched_hip_side',
    sourceSetCount: 2,
    sourceTarget: 30000,
    sourceUnit: 'timer_ms',
    sourceTotal: 60000,
    roundCount: 2,
    sideTarget: 15000,
    leftTotal: 30000,
    rightTotal: 30000,
    voiceVariantLeft: 'left_back',
    voiceVariantRight: 'right_back',
  },
  {
    exerciseId: 'wall-calf-stretch',
    sideRole: 'stretched_calf_side',
    sourceSetCount: 2,
    sourceTarget: 30000,
    sourceUnit: 'timer_ms',
    sourceTotal: 60000,
    roundCount: 2,
    sideTarget: 15000,
    leftTotal: 30000,
    rightTotal: 30000,
    voiceVariantLeft: 'left_back',
    voiceVariantRight: 'right_back',
  },
];

describe('both-sides dose planner', () => {
  it('reconciles the six source-backed direct-half-set conversion plans', () => {
    expect(TRAINING_BOTH_SIDES_AFFECTED_EXERCISE_IDS).toHaveLength(6);
    for (const expected of EXPECTED_MATRIX) {
      const plan = deriveBothSidesDosePlanForExerciseId(expected.exerciseId, 'left');
      expect(plan).toMatchObject({
        exerciseId: expected.exerciseId,
        sideRole: expected.sideRole,
        sourceSetCount: expected.sourceSetCount,
        sourceTargetPerSet: expected.sourceTarget,
        sourceUnit: expected.sourceUnit,
        sourceTotalDose: expected.sourceTotal,
        roundCount: expected.roundCount,
        totalLeftDose: expected.leftTotal,
        totalRightDose: expected.rightTotal,
        convertedTotalDose: expected.sourceTotal,
        minimumValidSideTarget: null,
        conversionReason: 'direct_half_set',
        exactDosePreserved: true,
        equalSideDose: true,
        runtimeSelectable: true,
      });
      expect(plan.rounds.every((round) => round.targets.left.targetDose === expected.sideTarget)).toBe(true);
      expect(plan.rounds.every((round) => round.targets.right.targetDose === expected.sideTarget)).toBe(true);
      expect(isBothSidesDosePlan(plan)).toBe(true);
    }
  });

  it('matches the live registry prescriptions instead of catalogue literals in tests', () => {
    for (const expected of EXPECTED_MATRIX) {
      const def = getExercise(expected.exerciseId);
      const plan = deriveBothSidesDosePlanForExerciseId(expected.exerciseId, 'left');
      expect(plan.sourceSetCount).toBe(def.prescription.sets);
      if (expected.sourceUnit === 'reps') expect(plan.sourceTargetPerSet).toBe(def.prescription.repsPerSet);
      if (expected.sourceUnit === 'hold_ms') expect(plan.sourceTargetPerSet).toBe((def.prescription.holdSec ?? 0) * 1000);
      if (expected.sourceUnit === 'timer_ms') expect(plan.sourceTargetPerSet).toBe((def.prescription.timerSec ?? 0) * 1000);
      if (expected.sourceUnit === 'rom_window_ms') expect(plan.sourceTargetPerSet).toBe((def.prescription.captureSec ?? 0) * 1000);
    }
  });

  it('reduces round count only when a source-proven minimum requires it', () => {
    const plan = deriveBothSidesDosePlan({
      exerciseId: 'balance-single-leg-hold',
      prescribedSetCount: 3,
      prescribedTarget: 15000,
      targetUnit: 'hold_ms',
      initialStartSide: 'left',
      minimumValidSideTarget: 10000,
      minimumSource: 'unit-test-proven-minimum',
    });
    expect(plan.roundCount).toBe(2);
    expect(plan.rounds[0].targets.left.targetMs).toBe(11250);
    expect(plan.rounds[0].targets.right.targetMs).toBe(11250);
    expect(plan.convertedTotalDose).toBe(45000);
    expect(plan.conversionReason).toBe('round_count_reduced_for_minimum');
  });

  it('fails closed for odd total reps, unknown exercises, unsupported precision, and unsupported units', () => {
    expect(deriveBothSidesDosePlan({
      exerciseId: 'chair-supported-split-squat',
      prescribedSetCount: 3,
      prescribedTarget: 5,
      targetUnit: 'reps',
      initialStartSide: 'left',
    }).blockerReasonCodes).toContain('ODD_TOTAL_REPS');
    expect(deriveBothSidesDosePlan({
      exerciseId: 'unknown',
      prescribedSetCount: 2,
      prescribedTarget: 8,
      targetUnit: 'reps',
      initialStartSide: 'left',
    }).blockerReasonCodes).toContain('UNKNOWN_EXERCISE');
    expect(deriveBothSidesDosePlan({
      exerciseId: 'balance-single-leg-hold',
      prescribedSetCount: 1,
      prescribedTarget: 333,
      targetUnit: 'hold_ms',
      initialStartSide: 'left',
    }).blockerReasonCodes).toContain('TIME_PRECISION_UNSUPPORTED');
    expect(deriveBothSidesDosePlan({
      exerciseId: 'chair-supported-split-squat',
      prescribedSetCount: 2,
      prescribedTarget: 7.5,
      targetUnit: 'reps',
      initialStartSide: 'left',
    }).blockerReasonCodes).toContain('NON_INTEGER_REP_TARGET');
  });

  it('is deterministic for the same final prescription', () => {
    const a = deriveBothSidesDosePlanForExerciseId('wall-calf-stretch', 'right');
    const b = deriveBothSidesDosePlanForExerciseId('wall-calf-stretch', 'right');
    expect(a).toEqual(b);
    expect(a.planFingerprint).toBe(b.planFingerprint);
  });
});

describe('both-sides semantic side roles', () => {
  it('maps every affected exercise to the approved semantic side and voice variants', () => {
    for (const expected of EXPECTED_MATRIX) {
      expect(semanticSideRoleForExercise(expected.exerciseId)).toBe(expected.sideRole);
      expect(voiceSideVariantForExercise(expected.exerciseId, 'left')).toBe(expected.voiceVariantLeft);
      expect(voiceSideVariantForExercise(expected.exerciseId, 'right')).toBe(expected.voiceVariantRight);
      expect(getTrainingVoiceContractV21(expected.exerciseId).sidePlan.semanticSideRole).toBe(expected.sideRole);
    }
    expect(getTrainingVoiceContractV21('supported-hip-flexor-stretch').sidePlan.variants.map((variant) => variant.variantId)).toEqual([
      'left_back',
      'right_back',
    ]);
  });
});

describe('both-sides round state machine', () => {
  it('runs a complete two-round split squat without rest between sides', () => {
    let state = readyActiveState(deriveBothSidesDosePlanForExerciseId('chair-supported-split-squat', 'left'));
    const firstAttempt = state.currentSideAttemptId;
    state = advanceBothSidesRoundState(state, {
      type: 'SIDE_COMPLETED',
      attemptId: firstAttempt,
      completedReps: 4,
    });
    expect(state.phase).toBe('side_switch');
    expect(state.completedRounds).toHaveLength(0);
    expect(state.sideResults.left?.completedReps).toBe(4);

    state = advanceBothSidesRoundState(state, { type: 'START_SIDE_SETUP' });
    expect(state.currentSide).toBe('right');
    expect(state.freshCountdownRequired).toBe(true);
    state = activate(state);
    state = advanceBothSidesRoundState(state, {
      type: 'SIDE_COMPLETED',
      attemptId: state.currentSideAttemptId,
      completedReps: 4,
    });
    expect(state.phase).toBe('round_complete');
    expect(state.completedRounds).toHaveLength(1);
    expect(state.completedRounds[0].completedBothSides).toBe(true);

    state = advanceBothSidesRoundState(state, { type: 'REST_ENTERED' });
    expect(state.phase).toBe('rest');
    state = advanceBothSidesRoundState(state, { type: 'REST_COMPLETED' });
    expect(state.roundIndex).toBe(1);
    expect(state.currentSide).toBe('right');
    expect(state.phase).toBe('round_setup');
  });

  it('requires a fresh countdown, rejects duplicate side completion, and ignores stale callbacks', () => {
    let state = createBothSidesRoundRuntimeState(deriveBothSidesDosePlanForExerciseId('chair-supported-split-squat', 'left'));
    state = advanceBothSidesRoundState(state, { type: 'START_SIDE_SETUP' });
    const blocked = advanceBothSidesRoundState(state, { type: 'SIDE_ACTIVE_STARTED' });
    expect(blocked.phase).toBe('side_setup');
    state = activate(state);
    const stale = advanceBothSidesRoundState(state, {
      type: 'SIDE_COMPLETED',
      attemptId: 'old-side',
      completedReps: 4,
    });
    expect(stale.phase).toBe('side_active');
    expect(stale.ignoredStaleActionCount).toBe(1);
    const completed = advanceBothSidesRoundState(state, {
      type: 'SIDE_COMPLETED',
      attemptId: state.currentSideAttemptId,
      completedReps: 4,
    });
    const duplicate = advanceBothSidesRoundState(completed, {
      type: 'SIDE_COMPLETED',
      attemptId: state.currentSideAttemptId,
      completedReps: 4,
    });
    expect(duplicate.phase).toBe('side_switch');
    expect(duplicate.completedRounds).toHaveLength(0);
  });

  it('preserves a completed first side when second-side tracking is interrupted and on restore', () => {
    let state = readyActiveState(deriveBothSidesDosePlanForExerciseId('balance-single-leg-hold', 'left'));
    state = advanceBothSidesRoundState(state, {
      type: 'SIDE_COMPLETED',
      attemptId: state.currentSideAttemptId,
      validTimeMs: 7500,
    });
    state = advanceBothSidesRoundState(state, { type: 'START_SIDE_SETUP' });
    state = activate(state);
    const secondAttempt = state.currentSideAttemptId;
    state = advanceBothSidesRoundState(state, { type: 'TRACKING_INTERRUPTED', attemptId: secondAttempt });
    expect(state.phase).toBe('side_setup');
    expect(state.currentSide).toBe('right');
    expect(state.sideResults.left?.validTimeMs).toBe(7500);
    expect(state.sideResults.right).toBeUndefined();
    expect(state.currentSideAttemptId).not.toBe(secondAttempt);

    const restored = restoreBothSidesRoundRuntimeState({
      ...state,
      phase: 'side_active',
    });
    expect(restored.phase).toBe('side_setup');
    expect(restored.currentSide).toBe('right');
    expect(restored.sideResults.left?.validTimeMs).toBe(7500);
  });

  it('round 3 returns to the pinned initial side and final round completes the exercise', () => {
    let state = createBothSidesRoundRuntimeState(deriveBothSidesDosePlanForExerciseId('balance-tandem-hold', 'right'));
    expect(state.currentSide).toBe('right');
    state = completeCurrentRound(state, 10000);
    state = advanceBothSidesRoundState(state, { type: 'REST_ENTERED' });
    state = advanceBothSidesRoundState(state, { type: 'REST_COMPLETED' });
    expect(state.roundIndex).toBe(1);
    expect(state.currentSide).toBe('left');
    state = completeCurrentRound(state, 10000);
    state = advanceBothSidesRoundState(state, { type: 'REST_ENTERED' });
    state = advanceBothSidesRoundState(state, { type: 'REST_COMPLETED' });
    expect(state.roundIndex).toBe(2);
    expect(state.currentSide).toBe('right');
    state = completeCurrentRound(state, 10000);
    state = advanceBothSidesRoundState(state, { type: 'REST_ENTERED' });
    expect(state.phase).toBe('exercise_complete');
  });
});

describe('both-sides start-side persistence and generation isolation', () => {
  it('defaults left, flips only after completed main-plan evidence, and is idempotent', () => {
    expect(nextBothSidesStartSideForExercise(EMPTY_BOTH_SIDES_START_SIDE_SEED_STATE, 'wall-calf-stretch')).toBe('left');
    const skipped = applyBothSidesExerciseCompletionToStartSideSeed(EMPTY_BOTH_SIDES_START_SIDE_SEED_STATE, {
      exerciseId: 'wall-calf-stretch',
      completed: false,
      countsTowardMainPlan: true,
      eventId: 'skip-1',
    });
    expect(nextBothSidesStartSideForExercise(skipped, 'wall-calf-stretch')).toBe('left');
    const manual = applyBothSidesExerciseCompletionToStartSideSeed(skipped, {
      exerciseId: 'wall-calf-stretch',
      completed: true,
      countsTowardMainPlan: false,
      eventId: 'manual-1',
    });
    expect(nextBothSidesStartSideForExercise(manual, 'wall-calf-stretch')).toBe('left');
    const completed = applyBothSidesExerciseCompletionToStartSideSeed(manual, {
      exerciseId: 'wall-calf-stretch',
      completed: true,
      countsTowardMainPlan: true,
      eventId: 'main-1',
    });
    expect(nextBothSidesStartSideForExercise(completed, 'wall-calf-stretch')).toBe('right');
    const duplicate = applyBothSidesExerciseCompletionToStartSideSeed(completed, {
      exerciseId: 'wall-calf-stretch',
      completed: true,
      countsTowardMainPlan: true,
      eventId: 'main-1',
    });
    expect(nextBothSidesStartSideForExercise(duplicate, 'wall-calf-stretch')).toBe('right');
  });

  it('does not annotate generated sessions unless the closed internal mode is selectable', () => {
    const session: { readonly exercises: readonly BothSidesGeneratedExerciseLike[] } = {
      exercises: [
        {
          exerciseId: 'chair-supported-split-squat',
          kind: 'reps' as const,
          sets: 2,
          repsPerSet: 8,
        },
      ],
    };
    expect(attachBothSidesDosePlansToGeneratedSession({
      session,
      featureEnabled: false,
      internalV21RuntimeReady: true,
    })).toBe(session);
    expect(attachBothSidesDosePlansToGeneratedSession({
      session,
      featureEnabled: true,
      internalV21RuntimeReady: false,
    })).toBe(session);
    const annotated = attachBothSidesDosePlansToGeneratedSession({
      session,
      featureEnabled: true,
      internalV21RuntimeReady: true,
    });
    expect(annotated).not.toBe(session);
    expect(annotated.exercises[0].bothSidesDosePlan?.sourceTotalDose).toBe(16);
  });

  it('selects legacy when only the round flag is enabled', () => {
    const plan = deriveBothSidesDosePlanForExerciseId('wall-calf-stretch', 'left');
    expect(selectTrainingBothSidesRoundsMode({
      featureEnabled: true,
      internalV21RuntimeReady: false,
      plans: [plan],
    })).toMatchObject({
      mode: 'legacy',
      selectable: false,
    });
  });
});

describe('both-sides progression aggregation and persistence', () => {
  it('maps one completed round to one legacy set result without doubling dose', () => {
    const plan = deriveBothSidesDosePlanForExerciseId('chair-supported-split-squat', 'left');
    const left = createTrainingSideSegmentResult({
      plan,
      roundIndex: 0,
      side: 'left',
      completedReps: 4,
      attemptId: 'left-1',
    });
    const right = createTrainingSideSegmentResult({
      plan,
      roundIndex: 0,
      side: 'right',
      completedReps: 4,
      attemptId: 'right-1',
    });
    const round = {
      roundIndex: 0,
      startSide: 'left' as const,
      sideOrder: ['left', 'right'] as const,
      left,
      right,
      completedBothSides: true,
      totalCompletedDose: 8,
      totalTargetDose: 8,
      leftCompletionRatio: 1,
      rightCompletionRatio: 1,
      conservativeCompletionRatio: 1,
    };
    const legacy = bothSidesRoundResultsToLegacySetResults(plan, [round]);
    expect(legacy).toHaveLength(1);
    expect(legacy[0].reps).toBe(8);
    expect(legacy[0].reachedTarget).toBe(true);
    const summary = summarizeBothSidesProgression(plan, [round]);
    expect(summary.progressionEligible).toBe(false);
    expect(summary.conservativeCompletionRatio).toBe(0.5);
  });

  it('uses the weaker side and blocks progression when one side is incomplete', () => {
    const plan = deriveBothSidesDosePlanForExerciseId('wall-calf-stretch', 'left');
    const left = createTrainingSideSegmentResult({
      plan,
      roundIndex: 0,
      side: 'left',
      validTimeMs: 15000,
      attemptId: 'left-1',
    });
    const right = createTrainingSideSegmentResult({
      plan,
      roundIndex: 0,
      side: 'right',
      validTimeMs: 5000,
      attemptId: 'right-1',
    });
    const round = {
      roundIndex: 0,
      startSide: 'left' as const,
      sideOrder: ['left', 'right'] as const,
      left,
      right,
      completedBothSides: false,
      totalCompletedDose: 20000,
      totalTargetDose: 30000,
      leftCompletionRatio: 1,
      rightCompletionRatio: 1 / 3,
      conservativeCompletionRatio: 1 / 3,
    };
    const summary = summarizeBothSidesProgression(plan, [round]);
    expect(summary.progressionEligible).toBe(false);
    expect(summary.conservativeCompletionRatio).toBeCloseTo(1 / 6);
  });

  it('round-trips plan metadata with a stable fingerprint', () => {
    const state = createBothSidesRoundRuntimeState(deriveBothSidesDosePlanForExerciseId('seated-hamstring-reach', 'left'));
    const envelope = serializeBothSidesRoundRuntimeState(state);
    expect(isBothSidesDosePlan(envelope.dosePlan)).toBe(true);
  });
});

describe('Training Voice V2.1 both-sides reconciliation', () => {
  it('removes round/dose implementation blockers while preserving safety/audio/global blockers', () => {
    for (const { exerciseId } of EXPECTED_MATRIX) {
      const contract = getTrainingVoiceContractV21(exerciseId);
      expect(contract.implementationRequirements).not.toContain('IR-VOICE-ROUND-STATE');
      expect(contract.implementationRequirements).not.toContain('IR-VOICE-DOSE-CONVERSION');
      expect(contract.implementationRequirements).toContain('IR-VOICE-SAFETY-SUBSUMPTION');
      const readiness = resolveTrainingVoiceRuntimeReadinessV21({ exerciseId });
      expect(readiness.selectable).toBe(false);
      expect(readiness.blockers).not.toContain('behavior_dependency:IR-VOICE-ROUND-STATE');
      expect(readiness.blockers).not.toContain('behavior_dependency:IR-VOICE-DOSE-CONVERSION');
      expect(readiness.blockers).toContain('global_behavior_ready_false');
      expect(readiness.blockers).toContain('global_audio_ready_false');
    }
  });

  it('plans side-specific setup and target from the runtime dose plan', () => {
    const singleLeg = deriveBothSidesDosePlanForExerciseId('balance-single-leg-hold', 'left');
    const first = planTrainingVoiceSequenceV21({
      exerciseId: 'balance-single-leg-hold',
      exposure: 'first_use',
      bothSidesContext: { dosePlan: singleLeg, roundIndex: 0, currentSide: 'left' },
    });
    expect(first.cueKeys).toContain('side-single-leg-left-v21');
    expect(first.targetPlan.visibleText).toBe('7.5 sec each side');
    expect(first.targetPlan.spokenText).toBe('Hold until I say switch.');
    expect(first.scripts.join(' ')).not.toMatch(/15 seconds|sets today|set one of/i);

    const second = planTrainingVoiceSequenceV21({
      exerciseId: 'balance-single-leg-hold',
      exposure: 'later_set',
      bothSidesContext: { dosePlan: singleLeg, roundIndex: 0, currentSide: 'right', sideChanged: true },
    });
    expect(second.cueKeys).toEqual([
      'switch-legs-v21',
      'side-single-leg-right-v21',
      'final-position-set-v21',
      'target-balance-single-leg-hold-v21',
    ]);
    expect(second.cueKeys).not.toContain('rest-now-v21');

    const splitSquat = deriveBothSidesDosePlanForExerciseId('chair-supported-split-squat', 'right');
    const splitTarget = resolveTrainingVoiceTargetV21({
      contract: getTrainingVoiceContractV21('chair-supported-split-squat'),
      bothSidesDosePlan: splitSquat,
      bothSidesCurrentSide: 'right',
      bothSidesRoundIndex: 0,
    });
    expect(splitTarget.spokenText).toBe('Aim for four reps.');
    expect(splitTarget.visibleText).toBe('4 reps each side');
  });
});

function readyActiveState(plan: ReturnType<typeof deriveBothSidesDosePlanForExerciseId>): BothSidesRoundRuntimeState {
  return activate(advanceBothSidesRoundState(createBothSidesRoundRuntimeState(plan), { type: 'START_SIDE_SETUP' }));
}

function activate(state: BothSidesRoundRuntimeState): BothSidesRoundRuntimeState {
  let next = advanceBothSidesRoundState(state, { type: 'SIDE_READY' });
  next = advanceBothSidesRoundState(next, { type: 'COUNTDOWN_STARTED' });
  return advanceBothSidesRoundState(next, { type: 'SIDE_ACTIVE_STARTED' });
}

function completeCurrentRound(state: BothSidesRoundRuntimeState, dose: number): BothSidesRoundRuntimeState {
  let next = state.phase === 'round_setup'
    ? advanceBothSidesRoundState(state, { type: 'START_SIDE_SETUP' })
    : state;
  next = activate(next);
  next = advanceBothSidesRoundState(next, {
    type: 'SIDE_COMPLETED',
    attemptId: next.currentSideAttemptId,
    validTimeMs: dose,
    completedDose: dose,
  });
  next = advanceBothSidesRoundState(next, { type: 'START_SIDE_SETUP' });
  next = activate(next);
  return advanceBothSidesRoundState(next, {
    type: 'SIDE_COMPLETED',
    attemptId: next.currentSideAttemptId,
    validTimeMs: dose,
    completedDose: dose,
  });
}
