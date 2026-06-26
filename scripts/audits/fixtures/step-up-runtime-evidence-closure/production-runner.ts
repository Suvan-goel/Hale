import { getExercise } from '../../../../src/exercises';
import { PosePipeline } from '../../../../src/pose/pipeline';
import { makeFrame, mulberry32, SYNTHETIC_HIP_ANKLE } from '../../../../src/pose/testing/syntheticPose';
import { LANDMARK_STRIDE, LM, type RawLandmarkEvent } from '../../../../src/pose/types';
import {
  createTrainingSetRuntime,
  selectTrainingSetRuntime,
} from '../../../../src/training/setRuntime';
import {
  defaultTrainingState,
  deserializeTrainingState,
  serializeTrainingState,
} from '../../../../src/training/serialize';
import {
  applyBothSidesExerciseCompletionToStartSideSeed,
  nextBothSidesStartSideForExercise,
} from '../../../../src/training/bothSidesRounds/startSide';
import {
  TRAINING_STEP_UP_ALTERNATION_DEFAULT_ENABLED,
} from '../../../../src/training/stepUpAlternation/readiness';
import {
  deriveStepUpAlternationPlan,
  deriveStepUpAlternationPlanForExerciseId,
} from '../../../../src/training/stepUpAlternation/plan';
import {
  advanceStepUpAlternationState,
  createStepUpAlternationRuntimeState,
} from '../../../../src/training/stepUpAlternation/stateMachine';
import {
  summarizeStepUpAlternationProgression,
  summarizeStepUpSetResult,
} from '../../../../src/training/stepUpAlternation/aggregation';
import {
  attachStepUpAlternationPlansToGeneratedSession,
} from '../../../../src/training/stepUpAlternation/generatedSession';
import {
  resolveStepUpRepEvidence,
} from '../../../../src/training/stepUpAlternation/evidence';
import {
  StepUpAlternationSetRuntime,
} from '../../../../src/training/stepUpAlternation/runtime';
import type { StepUpLeadSide } from '../../../../src/training/stepUpAlternation/types';
import { planTrainingVoiceSequenceV21 } from '../../../../src/training/voiceV21/sequencePlanner';
import {
  TRAINING_VOICE_V2_1_AUDIO_READY,
  TRAINING_VOICE_V2_1_BEHAVIOR_READY,
  isTrainingVoiceV21FeatureEnabled,
} from '../../../../src/training/voiceV21/readiness';
import {
  EYES_OPEN_BALANCE_PROTOCOL_V2_AUDIO_READY,
  EYES_OPEN_BALANCE_PROTOCOL_V2_SELECTABLE,
} from '../../../../src/config/eyesOpenBalanceProtocolV2';
import { mapLocalTrainingStateToRemotePayload } from '../../../../src/services/backend/trainingStateSyncService';
import { mapRemoteTrainingStateToLocal } from '../../../../src/services/backend/restoreService';

const FRAME_MS = 1000 / 30;

type StepLead = StepUpLeadSide | 'both';

let timestampCursor = 0;

const planLeft = deriveStepUpAlternationPlanForExerciseId('left');
const planRight = deriveStepUpAlternationPlanForExerciseId('right');
const def = getExercise('step-up');
const selectableRuntime = createTrainingSetRuntime({
  exerciseDefinition: def,
  generatedExercise: { exerciseId: 'step-up', stepUpAlternationPlan: planLeft },
  featureEnabled: true,
  trainingVoiceMode: 'internal_v21',
  runtimeCapabilities: { internalStepUpAlternationReady: true, poseEvidenceAdapterAvailable: true },
  setIndex: 0,
});
const featureOffSelection = selectTrainingSetRuntime({
  exerciseDefinition: def,
  generatedExercise: { exerciseId: 'step-up', stepUpAlternationPlan: planLeft },
  featureEnabled: false,
  trainingVoiceMode: 'internal_v21',
  runtimeCapabilities: { internalStepUpAlternationReady: true, poseEvidenceAdapterAvailable: true },
});
const flagOnlySelection = selectTrainingSetRuntime({
  exerciseDefinition: def,
  generatedExercise: { exerciseId: 'step-up', stepUpAlternationPlan: planLeft },
  featureEnabled: true,
  trainingVoiceMode: 'legacy',
  runtimeCapabilities: { internalStepUpAlternationReady: false, poseEvidenceAdapterAvailable: true },
});

const frameProof = frameRuntimeProof();
const modelProof = stateMachineProof();
const persistence = persistenceProof(frameProof.serializedRuntime);
const voice = voiceProof();
const generated = generatedSessionProof();

const out = {
  generatedAt: new Date().toISOString(),
  productionEntryPoints: {
    model: [
      'deriveStepUpAlternationPlanForExerciseId',
      'createStepUpAlternationRuntimeState',
      'advanceStepUpAlternationState',
      'resolveStepUpRepEvidence',
      'summarizeStepUpSetResult',
      'summarizeStepUpAlternationProgression',
    ],
    runtime: [
      'createTrainingSetRuntime',
      'selectTrainingSetRuntime',
      'StepUpAlternationSetRuntime.update',
      'StepUpAlternationSetRuntime.serialize',
      'StepUpAlternationSetRuntime.finish',
    ],
    persistence: [
      'serializeTrainingState',
      'deserializeTrainingState',
      'mapLocalTrainingStateToRemotePayload',
      'mapRemoteTrainingStateToLocal',
    ],
    seed: ['applyBothSidesExerciseCompletionToStartSideSeed', 'nextBothSidesStartSideForExercise'],
    voice: ['planTrainingVoiceSequenceV21'],
    defaults: [
      'TRAINING_STEP_UP_ALTERNATION_DEFAULT_ENABLED',
      'isTrainingVoiceV21FeatureEnabled',
      'TRAINING_VOICE_V2_1_AUDIO_READY',
      'TRAINING_VOICE_V2_1_BEHAVIOR_READY',
      'EYES_OPEN_BALANCE_PROTOCOL_V2_SELECTABLE',
    ],
  },
  plans: {
    left: summarizePlan(planLeft),
    right: summarizePlan(planRight),
    oddBlocked: summarizePlan(deriveStepUpAlternationPlan({
      exerciseId: 'step-up',
      setCount: 3,
      targetTotalReps: 9,
      initialLeadSide: 'left',
    })),
    nonIntegerBlocked: summarizePlan(deriveStepUpAlternationPlan({
      exerciseId: 'step-up',
      setCount: 3,
      targetTotalReps: 9.5,
      initialLeadSide: 'left',
    })),
  },
  selection: {
    selectableKind: selectableRuntime.kind,
    featureOffKind: featureOffSelection.kind,
    featureOffReasonCodes: featureOffSelection.reasonCodes,
    flagOnlyKind: flagOnlySelection.kind,
    flagOnlyReasonCodes: flagOnlySelection.reasonCodes,
  },
  generated,
  modelProof,
  frameProof,
  persistence,
  voice,
  defaults: {
    stepUpAlternationDefaultEnabled: TRAINING_STEP_UP_ALTERNATION_DEFAULT_ENABLED,
    trainingVoiceV21DefaultEnabled: isTrainingVoiceV21FeatureEnabled({}),
    trainingVoiceV21AudioReady: TRAINING_VOICE_V2_1_AUDIO_READY,
    trainingVoiceV21BehaviorReady: TRAINING_VOICE_V2_1_BEHAVIOR_READY,
    balanceV2AudioReady: EYES_OPEN_BALANCE_PROTOCOL_V2_AUDIO_READY,
    balanceV2Selectable: EYES_OPEN_BALANCE_PROTOCOL_V2_SELECTABLE,
  },
};

process.stdout.write(`${JSON.stringify(out)}\n`);

function summarizePlan(plan: typeof planLeft) {
  return {
    exerciseId: plan.exerciseId,
    targetTotalReps: plan.targetTotalReps,
    targetLeftLeadReps: plan.targetLeftLeadReps,
    targetRightLeadReps: plan.targetRightLeadReps,
    setCount: plan.setCount,
    initialLeadSide: plan.initialLeadSide,
    setStartLeadSides: plan.setStartLeadSides,
    runtimeSelectable: plan.runtimeSelectable,
    blockerReasonCodes: plan.blockerReasonCodes,
    planFingerprint: plan.planFingerprint,
  };
}

function stateMachineProof() {
  let state = createStepUpAlternationRuntimeState(planLeft, 0);
  state = advanceStepUpAlternationState(state, { type: 'FLOOR_READY' });
  state = advanceStepUpAlternationState(state, { type: 'START_REP_ATTEMPT', attemptId: 'rep-1' });
  state = advanceStepUpAlternationState(state, {
    type: 'APPLY_REP_EVIDENCE',
    evidence: acceptedEvidence('rep-1', 'left'),
  });
  const duplicateBase = advanceStepUpAlternationState(state, {
    type: 'APPLY_REP_EVIDENCE',
    evidence: acceptedEvidence('rep-1', 'left'),
  });
  let stale = createStepUpAlternationRuntimeState(planLeft, 0);
  stale = advanceStepUpAlternationState(stale, { type: 'FLOOR_READY' });
  stale = advanceStepUpAlternationState(stale, { type: 'START_REP_ATTEMPT', attemptId: 'stale-1' });
  stale = advanceStepUpAlternationState(stale, { type: 'PAUSE_OR_BACKGROUND' });
  stale = advanceStepUpAlternationState(stale, {
    type: 'APPLY_REP_EVIDENCE',
    evidence: acceptedEvidence('stale-1', 'left'),
  });
  let full = createStepUpAlternationRuntimeState(planLeft, 0);
  full = advanceStepUpAlternationState(full, { type: 'FLOOR_READY' });
  for (let i = 0; i < 12; i++) {
    full = advanceStepUpAlternationState(full, { type: 'START_REP_ATTEMPT', attemptId: `full-${i + 1}` });
    full = advanceStepUpAlternationState(full, {
      type: 'APPLY_REP_EVIDENCE',
      evidence: acceptedEvidence(`full-${i + 1}`, i % 2 === 0 ? 'left' : 'right'),
    });
  }
  const fullSet = summarizeStepUpSetResult(full);
  return {
    acceptedFirstRep: {
      acceptedRepCount: state.acceptedRepCount,
      expectedLeadSide: state.expectedLeadSide,
      repSfxCount: state.repSfxCount,
    },
    duplicateSuppressedCount: duplicateBase.duplicateSuppressedCount,
    staleIgnoredCount: stale.ignoredStaleActionCount,
    fullSet: {
      phase: full.phase,
      acceptedRepCount: full.acceptedRepCount,
      leftLeadRepCount: full.leftLeadRepCount,
      rightLeadRepCount: full.rightLeadRepCount,
      repSfxCount: full.repSfxCount,
      completedTarget: fullSet.completedTarget,
      alternationValid: fullSet.alternationValid,
    },
    progression: summarizeStepUpAlternationProgression(planLeft, [fullSet]),
  };
}

function frameRuntimeProof() {
  const left = readyRuntime('left');
  const leftAccepted = feedStepRep(left.runtime, left.pipeline, 'left');
  const right = readyRuntime('right');
  const rightAccepted = feedStepRep(right.runtime, right.pipeline, 'right');
  const wrong = readyRuntime('left');
  const wrongAccepted = feedStepRep(wrong.runtime, wrong.pipeline, 'right');
  const unknown = readyRuntime('left');
  feedFrames(unknown.runtime, unknown.pipeline, [...stepFrames('both'), ...floorFrames(8)]);
  const noReturn = readyRuntime('left');
  feedFrames(noReturn.runtime, noReturn.pipeline, stepFrames('left').slice(0, 8));
  const duplicate = readyRuntime('left');
  const duplicateAccepted = feedStepRep(duplicate.runtime, duplicate.pipeline, 'left', 12);
  const tracking = readyRuntime('left');
  feedFrames(tracking.runtime, tracking.pipeline, stepFrames('left').slice(0, 4));
  const partialAttemptId = tracking.runtime.getState().currentRepAttemptId;
  tracking.runtime.pause(1200);
  const staleTail = feedFrames(tracking.runtime, tracking.pipeline, [
    ...stepFrames('left').slice(4),
    ...floorFrames(6),
  ]);
  return {
    leftAcceptedCount: leftAccepted.length,
    rightAcceptedCount: rightAccepted.length,
    wrongAcceptedCount: wrongAccepted.length,
    wrongLeadCount: wrong.runtime.getState().wrongLeadCount,
    unknownAcceptedCount: unknown.runtime.getState().acceptedRepCount,
    noReturnAcceptedCount: noReturn.runtime.getState().acceptedRepCount,
    duplicateAcceptedEvents: duplicateAccepted.length,
    duplicateAcceptedRepCount: duplicate.runtime.getState().acceptedRepCount,
    partialAttemptId,
    staleTailAcceptedCount: staleTail.length,
    trackingPhaseAfterPause: tracking.runtime.getState().phase,
    trackingAcceptedRepCount: tracking.runtime.getState().acceptedRepCount,
    serializedRuntime: left.runtime.serialize(),
  };
}

function persistenceProof(serializedRuntime: ReturnType<StepUpAlternationSetRuntime['serialize']>) {
  const seed = applyBothSidesExerciseCompletionToStartSideSeed(undefined, {
    exerciseId: 'step-up',
    completed: true,
    countsTowardMainPlan: true,
    eventId: 'main-completion:step-up',
  });
  const localState = {
    ...defaultTrainingState(),
    activeSetRuntime: serializedRuntime,
    bothSidesStartSideSeed: seed,
    generatedSessionSummaries: [
      {
        id: 'audit-step-up-session',
        source: 'block_generated' as const,
        title: 'Audit step-up session',
        generatedAt: '2026-06-25T08:00:00.000Z',
        exerciseIds: ['step-up'],
        exercises: [
          {
            exerciseId: 'step-up',
            sets: 3,
            repsPerSet: 12,
            stepUpAlternationPlan: planLeft,
            stepUpInitialLeadSide: 'left' as const,
          },
        ],
      },
    ],
  };
  const serialized = serializeTrainingState(localState);
  const localRestored = deserializeTrainingState(serialized);
  const remotePayload = mapLocalTrainingStateToRemotePayload(
    { training: localState, updatedAt: '2026-06-25T08:00:00.000Z' },
    'audit-user',
    { syncedAt: '2026-06-25T08:00:00.000Z' }
  );
  const remoteRestored = mapRemoteTrainingStateToLocal({
    user_id: remotePayload.user_id,
    state_json: remotePayload.state_json,
    updated_at: remotePayload.updated_at,
  });
  const localExercise = localRestored?.generatedSessionSummaries[0]?.exercises?.[0];
  const remoteExercise = remoteRestored?.generatedSessionSummaries[0]?.exercises?.[0];
  return {
    localRoundTrip: {
      activeRuntimeKind: localRestored?.activeSetRuntime?.kind ?? null,
      expectedLeadSide: localRestored?.activeSetRuntime?.kind === 'step_up_alternation'
        ? localRestored.activeSetRuntime.state.expectedLeadSide
        : null,
      planFingerprint: localRestored?.activeSetRuntime?.kind === 'step_up_alternation'
        ? localRestored.activeSetRuntime.state.plan.planFingerprint
        : null,
      generatedPlanFingerprint: localExercise?.stepUpAlternationPlan?.planFingerprint ?? null,
      nextSeed: nextBothSidesStartSideForExercise(localRestored?.bothSidesStartSideSeed, 'step-up'),
    },
    backendRoundTrip: {
      payloadHasGeneratedPlan:
        (((remotePayload.state_json as Record<string, unknown>).generatedSessionContext as Record<string, unknown>)
          .recentSummaries as unknown[])[0] !== undefined,
      activeRuntimeKind: remoteRestored?.activeSetRuntime?.kind ?? null,
      generatedPlanFingerprint: remoteExercise?.stepUpAlternationPlan?.planFingerprint ?? null,
      stepUpInitialLeadSide: remoteExercise?.stepUpInitialLeadSide ?? null,
      nextSeed: nextBothSidesStartSideForExercise(remoteRestored?.bothSidesStartSideSeed, 'step-up'),
    },
  };
}

function generatedSessionProof() {
  const session: {
    exercises: Array<{
      exerciseId: string;
      sets: number;
      repsPerSet: number;
      stepUpAlternationPlan?: typeof planLeft;
      stepUpInitialLeadSide?: StepUpLeadSide;
    }>;
  } = {
    exercises: [
      { exerciseId: 'step-up', sets: 3, repsPerSet: 12 },
      { exerciseId: 'sit-to-stand', sets: 2, repsPerSet: 8 },
    ],
  };
  const closed = attachStepUpAlternationPlansToGeneratedSession({ session });
  const open = attachStepUpAlternationPlansToGeneratedSession({
    session,
    featureEnabled: true,
    internalV21RuntimeReady: true,
  });
  return {
    defaultClosedPlanAttached: Boolean(closed.exercises[0]?.stepUpAlternationPlan),
    openPlanFingerprint: open.exercises[0]?.stepUpAlternationPlan?.planFingerprint ?? null,
    initialLeadSide: open.exercises[0]?.stepUpInitialLeadSide ?? null,
  };
}

function voiceProof() {
  const left = planTrainingVoiceSequenceV21({
    exerciseId: 'step-up',
    exposure: 'later_set',
    stepUpContext: { plan: planLeft, setIndex: 0, expectedLeadSide: 'left' },
  });
  const right = planTrainingVoiceSequenceV21({
    exerciseId: 'step-up',
    exposure: 'later_set',
    stepUpContext: { plan: planLeft, setIndex: 0, expectedLeadSide: 'right' },
  });
  const wrong = planTrainingVoiceSequenceV21({
    exerciseId: 'step-up',
    exposure: 'wrong_lead_correction',
    stepUpContext: { plan: planLeft, setIndex: 0, expectedLeadSide: 'left' },
  });
  return {
    leftCueKeys: left.cueKeys,
    rightCueKeys: right.cueKeys,
    wrongCueKeys: wrong.cueKeys,
    targetText: left.targetPlan.spokenText,
    selectable: left.ready,
    blockers: left.runtimeReadiness.blockers,
  };
}

function readyRuntime(initial: StepUpLeadSide) {
  const runtime = new StepUpAlternationSetRuntime({
    plan: deriveStepUpAlternationPlanForExerciseId(initial),
    setIndex: 0,
  });
  const pipeline = warmedPipeline();
  feedFrames(runtime, pipeline, floorFrames(16));
  return { runtime, pipeline };
}

function warmedPipeline(): PosePipeline {
  timestampCursor = 0;
  const pipeline = new PosePipeline();
  const rng = mulberry32(99);
  for (let i = 0; i < 130; i++) {
    const ts = Math.round(i * FRAME_MS);
    pipeline.process(makeFrame(ts, rng, { noiseAmp: 0 }));
    timestampCursor = ts + Math.round(FRAME_MS);
  }
  return pipeline;
}

function feedStepRep(
  runtime: StepUpAlternationSetRuntime,
  pipeline: PosePipeline,
  lead: StepLead,
  returnFrames = 6
): string[] {
  return feedFrames(runtime, pipeline, [...stepFrames(lead), ...floorFrames(returnFrames)]);
}

function feedFrames(
  runtime: StepUpAlternationSetRuntime,
  pipeline: PosePipeline,
  frames: readonly RawLandmarkEvent[]
): string[] {
  const accepted: string[] = [];
  for (const event of frames) {
    const update = runtime.update(pipeline.process(event));
    if (update.acceptedRepEvent) accepted.push(update.acceptedRepEvent.repAttemptId);
  }
  return accepted;
}

function stepFrames(lead: StepLead): RawLandmarkEvent[] {
  if (lead === 'both') {
    return [...liftFrames(0.28, 0.28, 5), ...floorFrames(5)];
  }
  const other: StepUpLeadSide = lead === 'left' ? 'right' : 'left';
  return [
    ...liftFrames(lead === 'left' ? 0.28 : 0, lead === 'right' ? 0.28 : 0, 4),
    ...liftFrames(0.28, 0.28, 5),
    ...liftFrames(other === 'left' ? 0.28 : 0, other === 'right' ? 0.28 : 0, 2),
  ];
}

function floorFrames(count: number): RawLandmarkEvent[] {
  return liftFrames(0, 0, count);
}

function liftFrames(leftLiftBu: number, rightLiftBu: number, count: number): RawLandmarkEvent[] {
  const frames: RawLandmarkEvent[] = [];
  const rng = mulberry32(1234 + Math.round(leftLiftBu * 100) * 17 + Math.round(rightLiftBu * 100));
  const start = timestampCursor;
  for (let i = 0; i < count; i++) {
    frames.push(stepFrame(start + Math.round(i * FRAME_MS), rng, leftLiftBu, rightLiftBu));
  }
  timestampCursor = start + Math.round(count * FRAME_MS);
  return frames;
}

function stepFrame(
  timestampMs: number,
  rng: () => number,
  leftLiftBu: number,
  rightLiftBu: number
): RawLandmarkEvent {
  const event = makeFrame(timestampMs, rng, { noiseAmp: 0 });
  const landmarks = Array.from(event.landmarks);
  applyFootLift(landmarks, 'left', leftLiftBu * SYNTHETIC_HIP_ANKLE);
  applyFootLift(landmarks, 'right', rightLiftBu * SYNTHETIC_HIP_ANKLE);
  return { timestampMs, landmarks };
}

function applyFootLift(landmarks: number[], side: StepUpLeadSide, lift: number): void {
  const indices = side === 'left'
    ? [LM.LEFT_ANKLE, LM.LEFT_HEEL, LM.LEFT_FOOT_INDEX]
    : [LM.RIGHT_ANKLE, LM.RIGHT_HEEL, LM.RIGHT_FOOT_INDEX];
  for (const landmark of indices) {
    landmarks[landmark * LANDMARK_STRIDE + 1] -= lift;
  }
}

function acceptedEvidence(repAttemptId: string, observedLeadSide: StepUpLeadSide) {
  return resolveStepUpRepEvidence({
    repAttemptId,
    expectedLeadSide: observedLeadSide,
    observedLeadSide,
    startedAtMs: 100,
    topReachedAtMs: 500,
    returnedToFloorAtMs: 900,
    bothFeetAtStart: true,
    expectedLeadInitiatedAscent: true,
    topPhaseValid: true,
    bothFeetReturnedToFloor: true,
    trackingValid: true,
  });
}
