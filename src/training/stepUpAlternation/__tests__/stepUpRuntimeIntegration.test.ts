import { getExercise } from '../../../exercises';
import { PosePipeline } from '../../../pose/pipeline';
import { makeFrame, mulberry32, SYNTHETIC_HIP_ANKLE } from '../../../pose/testing/syntheticPose';
import { LANDMARK_STRIDE, LM, type RawLandmarkEvent } from '../../../pose/types';
import { PreflightCheck } from '../../../preflight/preflight';
import { DEFAULT_TRAINING_CONFIG, TrainingSessionPlayer } from '../../sessionPlayer';
import { createTrainingSetRuntime, selectTrainingSetRuntime } from '../../setRuntime';
import { applyBothSidesExerciseCompletionToStartSideSeed, nextBothSidesStartSideForExercise } from '../../bothSidesRounds';
import {
  StepUpAlternationSetRuntime,
  deriveStepUpAlternationPlanForExerciseId,
  planTrainingVoiceSequenceV21,
  type StepUpLeadSide,
} from '../..';

const FRAME_MS = 1000 / 30;

describe('step-up runtime integration selection', () => {
  it('stays legacy when the feature is off or when only the flag is set', () => {
    const def = getExercise('step-up');
    const plan = deriveStepUpAlternationPlanForExerciseId('left');
    expect(selectTrainingSetRuntime({
      exerciseDefinition: def,
      generatedExercise: { exerciseId: 'step-up', stepUpAlternationPlan: plan },
      featureEnabled: false,
      trainingVoiceMode: 'internal_v21',
      runtimeCapabilities: { internalStepUpAlternationReady: true, poseEvidenceAdapterAvailable: true },
    }).kind).toBe('legacy');
    expect(selectTrainingSetRuntime({
      exerciseDefinition: def,
      generatedExercise: { exerciseId: 'step-up', stepUpAlternationPlan: plan },
      featureEnabled: true,
      trainingVoiceMode: 'legacy',
      runtimeCapabilities: { internalStepUpAlternationReady: false, poseEvidenceAdapterAvailable: true },
    }).kind).toBe('legacy');
  });

  it('selects exactly one internal runtime when the gated plan and capabilities are present', () => {
    const def = getExercise('step-up');
    const plan = deriveStepUpAlternationPlanForExerciseId('left');
    const runtime = createTrainingSetRuntime({
      exerciseDefinition: def,
      generatedExercise: { exerciseId: 'step-up', stepUpAlternationPlan: plan },
      featureEnabled: true,
      trainingVoiceMode: 'internal_v21',
      runtimeCapabilities: { internalStepUpAlternationReady: true, poseEvidenceAdapterAvailable: true },
      setIndex: 0,
    });
    expect(runtime.kind).toBe('step_up_alternation');
  });
});

describe('step-up frame evidence and runtime dispatch', () => {
  it('accepts a left-leading rep only after top phase and both-feet floor return', () => {
    const { runtime, pipeline } = readyRuntime('left');
    const accepted = feedStepRep(runtime, pipeline, 'left');
    expect(accepted).toHaveLength(1);
    expect(runtime.getState()).toMatchObject({
      acceptedRepCount: 1,
      leftLeadRepCount: 1,
      rightLeadRepCount: 0,
      expectedLeadSide: 'right',
      repSfxCount: 1,
    });
  });

  it('rejects wrong and unknown lead attempts without credit or SFX', () => {
    const wrong = readyRuntime('left');
    expect(feedStepRep(wrong.runtime, wrong.pipeline, 'right')).toHaveLength(0);
    expect(wrong.runtime.getState()).toMatchObject({
      acceptedRepCount: 0,
      expectedLeadSide: 'left',
      repSfxCount: 0,
      wrongLeadCount: 1,
    });

    const unknown = readyRuntime('left');
    feedFrames(unknown.runtime, unknown.pipeline, [
      ...stepFrames('both'),
      ...floorFrames(8),
    ]);
    expect(unknown.runtime.getState()).toMatchObject({
      acceptedRepCount: 0,
      expectedLeadSide: 'left',
      repSfxCount: 0,
    });
  });

  it('does not credit top without return or duplicate terminal frames', () => {
    const incomplete = readyRuntime('left');
    feedFrames(incomplete.runtime, incomplete.pipeline, [
      ...stepFrames('left').slice(0, 10),
    ]);
    expect(incomplete.runtime.getState().acceptedRepCount).toBe(0);

    const duplicate = readyRuntime('left');
    const accepted = feedStepRep(duplicate.runtime, duplicate.pipeline, 'left', 12);
    expect(accepted).toHaveLength(1);
    expect(duplicate.runtime.getState().acceptedRepCount).toBe(1);
  });

  it('serializes and restores accepted counts while retiring partial attempts', () => {
    const first = readyRuntime('left');
    feedStepRep(first.runtime, first.pipeline, 'left');
    feedFrames(first.runtime, first.pipeline, stepFrames('right').slice(0, 4));
    const serialized = first.runtime.serialize();
    const restored = new StepUpAlternationSetRuntime({
      plan: deriveStepUpAlternationPlanForExerciseId('left'),
      setIndex: 0,
      restored: serialized,
    });
    expect(restored.getState()).toMatchObject({
      acceptedRepCount: 1,
      expectedLeadSide: 'right',
      phase: 'ready_both_feet_floor',
    });
    const staleBefore = restored.getState().ignoredStaleActionCount;
    expect(feedStepRep(restored, warmedPipeline(), 'right')).toHaveLength(1);
    expect(restored.getState().ignoredStaleActionCount).toBe(staleBefore);
  });

  it('resumes from a pause at a safe floor boundary without crediting the retired partial attempt', () => {
    const { runtime, pipeline } = readyRuntime('left');
    feedFrames(runtime, pipeline, stepFrames('left').slice(0, 4));
    const partialAttemptId = runtime.getState().currentRepAttemptId;
    expect(partialAttemptId).toEqual(expect.any(String));

    const paused = runtime.pause(1200);
    expect(paused.acceptedRepEvent).toBeUndefined();
    expect(runtime.getState()).toMatchObject({
      acceptedRepCount: 0,
      expectedLeadSide: 'left',
      phase: 'ready_both_feet_floor',
    });
    expect(runtime.getState().retiredRepAttemptIds).toContain(partialAttemptId);

    const resumed = runtime.resume(1800);
    expect(resumed.acceptedRepEvent).toBeUndefined();
    expect(runtime.getState()).toMatchObject({
      acceptedRepCount: 0,
      expectedLeadSide: 'left',
      phase: 'ready_both_feet_floor',
    });

    const staleTailAccepted = feedFrames(runtime, pipeline, [
      ...stepFrames('left').slice(4),
      ...floorFrames(6),
    ]);
    expect(staleTailAccepted).toHaveLength(0);
    expect(runtime.getState().acceptedRepCount).toBe(0);

    feedFrames(runtime, pipeline, floorFrames(3));
    expect(feedStepRep(runtime, pipeline, 'left')).toHaveLength(1);
    expect(runtime.getState()).toMatchObject({
      acceptedRepCount: 1,
      leftLeadRepCount: 1,
      rightLeadRepCount: 0,
      expectedLeadSide: 'right',
      repSfxCount: 1,
    });
  });

  it('completes twelve alternating reps as one set and exposes live voice context', () => {
    const { runtime, pipeline } = readyRuntime('left');
    const accepted = [
      ...feedStepRep(runtime, pipeline, 'left'),
      ...feedStepRep(runtime, pipeline, 'right'),
      ...feedStepRep(runtime, pipeline, 'left'),
      ...feedStepRep(runtime, pipeline, 'right'),
      ...feedStepRep(runtime, pipeline, 'left'),
      ...feedStepRep(runtime, pipeline, 'right'),
      ...feedStepRep(runtime, pipeline, 'left'),
      ...feedStepRep(runtime, pipeline, 'right'),
      ...feedStepRep(runtime, pipeline, 'left'),
      ...feedStepRep(runtime, pipeline, 'right'),
      ...feedStepRep(runtime, pipeline, 'left'),
      ...feedStepRep(runtime, pipeline, 'right'),
    ];
    expect(accepted).toHaveLength(12);
    expect(runtime.getState().phase).toBe('set_complete');
    const result = runtime.finish(10000);
    expect(result).toMatchObject({
      exerciseId: 'step-up',
      reps: 12,
      reachedTarget: true,
      stepUpAlternation: {
        acceptedRepCount: 12,
        leftLeadRepCount: 6,
        rightLeadRepCount: 6,
        alternationValid: true,
      },
    });
    const plan = planTrainingVoiceSequenceV21({
      exerciseId: 'step-up',
      exposure: 'wrong_lead_correction',
      stepUpContext: {
        plan: runtime.getState().plan,
        setIndex: 0,
        expectedLeadSide: runtime.getState().expectedLeadSide,
      },
    });
    expect(plan.cueKeys[0]).toBe('step-up-wrong-left-v21');
  });
});

describe('TrainingSessionPlayer step-up runtime ownership', () => {
  it('uses alternation acceptance as the only rep-credit SFX source', () => {
    const plan = deriveStepUpAlternationPlanForExerciseId('left');
    const pipeline = warmedPipeline();
    const player = new TrainingSessionPlayer(
      '2026-06-25T08:00:00.000Z',
      ['step-up'],
      new PreflightCheck(),
      { ...DEFAULT_TRAINING_CONFIG, postInstructionsDwellMs: 1, countdownStepMs: 1, transitionDwellMs: 1 },
      {
        generatedExercises: [{ exerciseId: 'step-up', stepUpAlternationPlan: plan }],
        trainingVoiceMode: 'internal_v21',
        stepUpAlternationFeatureEnabled: true,
        runtimeCapabilities: { internalStepUpAlternationReady: true, poseEvidenceAdapterAvailable: true },
      }
    );
    let inSet = false;
    let sfx = 0;
    for (let frame = 0; frame < 170; frame++) {
      const [event] = floorFrames(1);
      const update = player.update(pipeline.process(event), false);
      if (update.phase === 'set') inSet = true;
      if (inSet) break;
    }
    for (const event of [...floorFrames(16), ...stepFrames('left'), ...floorFrames(6)]) {
      const update = player.update(pipeline.process(event), false);
      if (update.playRepSound) sfx++;
      if (update.stepUpContext?.acceptedRepCount === 1) {
        expect(update.setRuntimeKind).toBe('step_up_alternation');
        expect(update.repCount).toBe(1);
      }
    }
    expect(sfx).toBe(1);
    expect(player.serializeCurrentSetRuntime()?.kind).toBe('step_up_alternation');
  });
});

describe('step-up seed completion isolation', () => {
  it('flips once for main-plan step-up completion and not for manual or duplicates', () => {
    let seed = undefined;
    seed = applyBothSidesExerciseCompletionToStartSideSeed(seed, {
      exerciseId: 'step-up',
      completed: true,
      countsTowardMainPlan: false,
      eventId: 'manual',
    });
    expect(nextBothSidesStartSideForExercise(seed, 'step-up')).toBe('left');
    seed = applyBothSidesExerciseCompletionToStartSideSeed(seed, {
      exerciseId: 'step-up',
      completed: true,
      countsTowardMainPlan: true,
      eventId: 'main-completion:step-up',
    });
    expect(nextBothSidesStartSideForExercise(seed, 'step-up')).toBe('right');
    seed = applyBothSidesExerciseCompletionToStartSideSeed(seed, {
      exerciseId: 'step-up',
      completed: true,
      countsTowardMainPlan: true,
      eventId: 'main-completion:step-up',
    });
    expect(nextBothSidesStartSideForExercise(seed, 'step-up')).toBe('right');
  });
});

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
  lead: StepUpLeadSide,
  returnFrames = 6
) {
  return feedFrames(runtime, pipeline, [...stepFrames(lead), ...floorFrames(returnFrames)]);
}

function feedFrames(
  runtime: StepUpAlternationSetRuntime,
  pipeline: PosePipeline,
  frames: readonly RawLandmarkEvent[]
) {
  const accepted: string[] = [];
  for (const event of frames) {
    const update = runtime.update(pipeline.process(event));
    if (update.acceptedRepEvent) accepted.push(update.acceptedRepEvent.repAttemptId);
  }
  return accepted;
}

function stepFrames(lead: StepUpLeadSide | 'both'): RawLandmarkEvent[] {
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

let timestampCursor = 0;

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
