import {
  advanceStepUpAlternationState,
  applyBothSidesExerciseCompletionToStartSideSeed,
  attachStepUpAlternationPlansToGeneratedSession,
  createStepUpAlternationRuntimeState,
  deriveStepUpAlternationPlan,
  deriveStepUpAlternationPlanForExerciseId,
  deserializeStepUpAlternationRuntimeState,
  hasStepUpAlternationReadiness,
  nextBothSidesStartSideForExercise,
  planTrainingVoiceSequenceV21,
  resolveStepUpRepEvidence,
  restoreStepUpAlternationRuntimeState,
  serializeStepUpAlternationRuntimeState,
  stepUpSetResultToLegacySetResult,
  summarizeStepUpAlternationProgression,
  summarizeStepUpSetResult,
  type StepUpAlternationPlan,
  type StepUpAlternationRuntimeState,
  type StepUpGeneratedExerciseLike,
  type StepUpGeneratedSessionLike,
  type StepUpLeadSide,
  type StepUpRepEvidence,
} from '../..';
import { resolveTrainingVoiceRuntimeReadinessV21 } from '../../voiceV21';

describe('step-up alternation plan', () => {
  it('derives a 12-rep, 6/6 plan with alternating set starts', () => {
    const left = deriveStepUpAlternationPlanForExerciseId('left');
    expect(left).toMatchObject({
      exerciseId: 'step-up',
      targetTotalReps: 12,
      targetLeftLeadReps: 6,
      targetRightLeadReps: 6,
      setCount: 3,
      setStartLeadSides: ['left', 'right', 'left'],
      runtimeSelectable: true,
      blockerReasonCodes: ['STEP_UP_ALTERNATION_READY'],
    });
    expect(deriveStepUpAlternationPlanForExerciseId('right').setStartLeadSides).toEqual(['right', 'left', 'right']);
  });

  it('fails closed for targets that cannot be evenly alternated', () => {
    expect(plan({ targetTotalReps: 11 }).blockerReasonCodes).toContain('ODD_STEP_UP_TARGET');
    expect(plan({ targetTotalReps: 7.5 }).blockerReasonCodes).toContain('NON_INTEGER_STEP_UP_TARGET');
    expect(plan({ targetTotalReps: 0 }).blockerReasonCodes).toContain('NON_POSITIVE_STEP_UP_TARGET');
    expect(plan({ exerciseId: 'squat-free' }).blockerReasonCodes).toContain('UNSUPPORTED_STEP_UP_EXERCISE');
    expect(plan({ initialLeadSide: null }).blockerReasonCodes).toContain('MISSING_INITIAL_LEAD');
  });

  it('requires bilateral lower-body readiness before alternation evidence is trusted', () => {
    expect(hasStepUpAlternationReadiness({
      subjectPresent: true,
      trackingStable: true,
      leftLowerChainReliable: true,
      rightLowerChainReliable: true,
      leftFootVisible: true,
      rightFootVisible: true,
      bothFeetAtFloor: true,
    })).toBe(true);
    expect(hasStepUpAlternationReadiness({
      subjectPresent: true,
      trackingStable: true,
      leftLowerChainReliable: true,
      rightLowerChainReliable: false,
      leftFootVisible: true,
      rightFootVisible: true,
      bothFeetAtFloor: true,
    })).toBe(false);
  });
});

describe('step-up alternation state machine', () => {
  it('completes a valid 12-rep set with 6 left, 6 right, and 12 rep sounds', () => {
    let state = readyState();
    for (let i = 0; i < 12; i++) {
      state = acceptNextRep(state, `rep-${i + 1}`);
    }
    expect(state.phase).toBe('set_complete');
    expect(state.acceptedRepCount).toBe(12);
    expect(state.leftLeadRepCount).toBe(6);
    expect(state.rightLeadRepCount).toBe(6);
    expect(state.repSfxCount).toBe(12);
    const set = summarizeStepUpSetResult(state);
    expect(set).toMatchObject({
      completedTarget: true,
      alternationValid: true,
      acceptedRepCount: 12,
      leftLeadRepCount: 6,
      rightLeadRepCount: 6,
    });
    const legacy = stepUpSetResultToLegacySetResult(state.plan, set);
    expect(legacy).toMatchObject({
      exerciseId: 'step-up',
      reps: 12,
      reachedTarget: true,
      stepUpAlternation: expect.objectContaining({ completedTarget: true, alternationValid: true }),
    });
  });

  it('does not flip, credit, or play SFX for a wrong leading leg', () => {
    let state = readyState();
    state = applyEvidence(state, repEvidence(state, 'wrong-1', 'right'));
    expect(state.phase).toBe('wrong_lead_recovery');
    expect(state.expectedLeadSide).toBe('left');
    expect(state.acceptedRepCount).toBe(0);
    expect(state.repSfxCount).toBe(0);
    expect(state.wrongLeadCount).toBe(1);
    state = advanceStepUpAlternationState(state, { type: 'FLOOR_READY' });
    expect(acceptNextRep(state, 'rep-1').expectedLeadSide).toBe('right');
  });

  it('does not credit generic, no-floor, no-return, or tracking-interrupted attempts', () => {
    let state = readyState();
    state = applyEvidence(state, repEvidence(state, 'generic-1', null));
    state = advanceStepUpAlternationState(state, { type: 'FLOOR_READY' });
    state = applyEvidence(state, repEvidence(state, 'no-floor-1', 'left', { bothFeetAtStart: false }));
    state = advanceStepUpAlternationState(state, { type: 'FLOOR_READY' });
    state = applyEvidence(state, repEvidence(state, 'no-return-1', 'left', { bothFeetReturnedToFloor: false }));
    state = advanceStepUpAlternationState(state, { type: 'FLOOR_READY' });
    state = applyEvidence(state, repEvidence(state, 'tracking-1', 'left', { trackingValid: false }));
    expect(state.acceptedRepCount).toBe(0);
    expect(state.expectedLeadSide).toBe('left');
    expect(state.repSfxCount).toBe(0);
    expect(state.repEvidence.map((evidence) => evidence.endReason)).toEqual([
      'invalid_phase',
      'invalid_phase',
      'invalid_phase',
      'tracking_interrupted',
    ]);
  });

  it('suppresses stale restore and duplicate attempt completions', () => {
    let state = readyState();
    state = advanceStepUpAlternationState(state, { type: 'START_REP_ATTEMPT', attemptId: 'stale-1' });
    state = restoreStepUpAlternationRuntimeState(state);
    state = advanceStepUpAlternationState(state, {
      type: 'APPLY_REP_EVIDENCE',
      evidence: acceptedEvidence('stale-1', 'left'),
    });
    expect(state.acceptedRepCount).toBe(0);
    expect(state.ignoredStaleActionCount).toBe(1);

    state = advanceStepUpAlternationState(state, { type: 'START_REP_ATTEMPT', attemptId: 'rep-1' });
    const evidence = acceptedEvidence('rep-1', 'left');
    state = advanceStepUpAlternationState(state, { type: 'APPLY_REP_EVIDENCE', evidence });
    state = advanceStepUpAlternationState(state, { type: 'APPLY_REP_EVIDENCE', evidence });
    expect(state.acceptedRepCount).toBe(1);
    expect(state.duplicateSuppressedCount).toBe(1);
  });

  it('marks incomplete or imbalanced sets as ineligible for progression', () => {
    let state = readyState();
    for (let i = 0; i < 11; i++) state = acceptNextRep(state, `rep-${i + 1}`);
    const incomplete = summarizeStepUpSetResult(state);
    expect(incomplete.completedTarget).toBe(false);
    expect(incomplete.alternationValid).toBe(false);

    const progression = summarizeStepUpAlternationProgression(state.plan, [incomplete]);
    expect(progression.progressionEligible).toBe(false);
  });

  it('serializes only fingerprint-valid step-up plans', () => {
    let state = readyState();
    state = acceptNextRep(state, 'rep-1');
    const envelope = serializeStepUpAlternationRuntimeState(state);
    expect(deserializeStepUpAlternationRuntimeState(envelope)).toMatchObject({
      setIndex: 0,
      acceptedRepCount: 1,
      retiredRepAttemptIds: ['rep-1'],
    });
    expect(deserializeStepUpAlternationRuntimeState({
      ...envelope,
      plan: { ...envelope.plan, targetTotalReps: 10 },
    })).toBeNull();
  });
});

describe('step-up generation, seed, and voice integration', () => {
  it('uses the shared start-side seed and only flips on main-plan completion', () => {
    let seed = undefined;
    expect(nextBothSidesStartSideForExercise(seed, 'step-up')).toBe('left');
    seed = applyBothSidesExerciseCompletionToStartSideSeed(seed, {
      exerciseId: 'step-up',
      completed: false,
      countsTowardMainPlan: true,
      eventId: 'manual-no-credit',
    });
    expect(nextBothSidesStartSideForExercise(seed, 'step-up')).toBe('left');
    seed = applyBothSidesExerciseCompletionToStartSideSeed(seed, {
      exerciseId: 'step-up',
      completed: true,
      countsTowardMainPlan: false,
      eventId: 'explore-no-credit',
    });
    expect(nextBothSidesStartSideForExercise(seed, 'step-up')).toBe('left');
    seed = applyBothSidesExerciseCompletionToStartSideSeed(seed, {
      exerciseId: 'step-up',
      completed: true,
      countsTowardMainPlan: true,
      eventId: 'main-1',
    });
    expect(nextBothSidesStartSideForExercise(seed, 'step-up')).toBe('right');
    expect(applyBothSidesExerciseCompletionToStartSideSeed(seed, {
      exerciseId: 'step-up',
      completed: true,
      countsTowardMainPlan: true,
      eventId: 'main-1',
    })).toEqual(seed);
  });

  it('annotates generated step-up sessions only when the gated mode is selectable', () => {
    const session: StepUpGeneratedSessionLike<StepUpGeneratedExerciseLike & { readonly kind: 'reps' }> = {
      exercises: [
        { exerciseId: 'step-up', kind: 'reps' as const, sets: 3, repsPerSet: 12 },
        { exerciseId: 'squat-free', kind: 'reps' as const, sets: 3, repsPerSet: 10 },
      ],
    };
    expect(attachStepUpAlternationPlansToGeneratedSession({ session }).exercises[0].stepUpAlternationPlan).toBeUndefined();
    const annotated = attachStepUpAlternationPlansToGeneratedSession({
      session,
      featureEnabled: true,
      internalV21RuntimeReady: true,
    });
    expect(annotated.exercises[0].stepUpAlternationPlan).toMatchObject({
      targetTotalReps: 12,
      targetLeftLeadReps: 6,
      targetRightLeadReps: 6,
    });
    expect(annotated.exercises[1].stepUpAlternationPlan).toBeUndefined();
  });

  it('keeps Training Voice V2.1 blocked by safety/audio/global gates but not by step alternation', () => {
    const stepUp = deriveStepUpAlternationPlanForExerciseId('left');
    const readiness = resolveTrainingVoiceRuntimeReadinessV21({
      exerciseId: 'step-up',
      stepUpAlternationPlan: stepUp,
    });
    expect(readiness.selectable).toBe(false);
    expect(readiness.blockers).not.toContain('behavior_dependency:IR-VOICE-STEP-ALTERNATION');
    expect(readiness.blockers).toEqual(expect.arrayContaining([
      'behavior_dependency:IR-VOICE-SAFETY-SUBSUMPTION',
      'global_behavior_ready_false',
      'global_audio_ready_false',
    ]));

    const first = planTrainingVoiceSequenceV21({
      exerciseId: 'step-up',
      exposure: 'first_use',
      stepUpContext: { plan: stepUp, setIndex: 0 },
    });
    expect(first.cueKeys).toEqual([
      'ex-step-up-first-v21',
      'step-up-start-left-v21',
      'final-position-set-v21',
      'target-step-up-v21',
    ]);
    const correction = planTrainingVoiceSequenceV21({
      exerciseId: 'step-up',
      exposure: 'wrong_lead_correction',
      stepUpContext: { plan: stepUp, setIndex: 0, expectedLeadSide: 'left' },
    });
    expect(correction.cueKeys).toEqual(['step-up-wrong-left-v21', 'final-position-set-v21']);
  });
});

function plan(input: Partial<Parameters<typeof deriveStepUpAlternationPlan>[0]>): StepUpAlternationPlan {
  return deriveStepUpAlternationPlan({
    exerciseId: 'step-up',
    setCount: 3,
    targetTotalReps: 12,
    initialLeadSide: 'left',
    ...input,
  });
}

function readyState(initialLeadSide: StepUpLeadSide = 'left'): StepUpAlternationRuntimeState {
  return advanceStepUpAlternationState(
    createStepUpAlternationRuntimeState(deriveStepUpAlternationPlanForExerciseId(initialLeadSide)),
    { type: 'FLOOR_READY' }
  );
}

function acceptNextRep(state: StepUpAlternationRuntimeState, attemptId: string): StepUpAlternationRuntimeState {
  return applyEvidence(state, repEvidence(state, attemptId, state.expectedLeadSide));
}

function applyEvidence(
  state: StepUpAlternationRuntimeState,
  evidence: StepUpRepEvidence
): StepUpAlternationRuntimeState {
  const active = advanceStepUpAlternationState(state, { type: 'START_REP_ATTEMPT', attemptId: evidence.repAttemptId });
  return advanceStepUpAlternationState(active, { type: 'APPLY_REP_EVIDENCE', evidence });
}

function repEvidence(
  state: StepUpAlternationRuntimeState,
  attemptId: string,
  observedLeadSide: StepUpLeadSide | null,
  overrides: Partial<Parameters<typeof resolveStepUpRepEvidence>[0]> = {}
): StepUpRepEvidence {
  return resolveStepUpRepEvidence({
    repAttemptId: attemptId,
    expectedLeadSide: state.expectedLeadSide,
    observedLeadSide,
    startedAtMs: 1,
    topReachedAtMs: 500,
    returnedToFloorAtMs: 1000,
    bothFeetAtStart: true,
    expectedLeadInitiatedAscent: observedLeadSide === state.expectedLeadSide,
    topPhaseValid: true,
    bothFeetReturnedToFloor: true,
    trackingValid: true,
    ...overrides,
  });
}

function acceptedEvidence(attemptId: string, leadSide: StepUpLeadSide): StepUpRepEvidence {
  return resolveStepUpRepEvidence({
    repAttemptId: attemptId,
    expectedLeadSide: leadSide,
    observedLeadSide: leadSide,
    startedAtMs: 1,
    topReachedAtMs: 500,
    returnedToFloorAtMs: 1000,
    bothFeetAtStart: true,
    expectedLeadInitiatedAscent: true,
    topPhaseValid: true,
    bothFeetReturnedToFloor: true,
    trackingValid: true,
  });
}
