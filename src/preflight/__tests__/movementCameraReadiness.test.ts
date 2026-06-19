import {
  detectCameraView,
  MovementCameraReadinessTracker,
} from '../movementCameraReadiness';
import type { PipelineFrameOutput } from '../../pose/pipeline';
import { makeFrame, mulberry32 } from '../../pose/testing/syntheticPose';
import { shoulderFlexionSession } from '../../pose/testing/syntheticRom';
import { createPoseFrame, LM, parseLandmarkEvent, RawLandmarkEvent } from '../../pose/types';

function outputFromRaw(
  raw: RawLandmarkEvent,
  overrides: Partial<PipelineFrameOutput> = {}
): PipelineFrameOutput {
  const frame = createPoseFrame();
  parseLandmarkEvent(raw, frame);
  return {
    state: 'tracking',
    frame,
    rawFrame: frame,
    displayFrame: frame,
    chainReliability: new Float64Array([0.95, 0.95]),
    reliableSideChains: 2,
    validity: { valid: true, reason: 'ok' },
    bodyUnit: 0.32,
    events: [],
    fps: 30,
    ...overrides,
  };
}

function frontOutput(timestampMs: number, reliableSideChains = 2): PipelineFrameOutput {
  return outputFromRaw(makeFrame(timestampMs, mulberry32(10), { noiseAmp: 0 }), { reliableSideChains });
}

function sideOutput(timestampMs: number, reliableSideChains = 1): PipelineFrameOutput {
  const frame = shoulderFlexionSession({ seed: 20, noiseAmp: 0, calibrationMs: 100 }).frames[0];
  return outputFromRaw({ ...frame, timestampMs }, { reliableSideChains });
}

function makeAmbiguous(out: PipelineFrameOutput): PipelineFrameOutput {
  const frame = out.frame;
  frame.xs[LM.LEFT_SHOULDER] = 0.535;
  frame.xs[LM.RIGHT_SHOULDER] = 0.465;
  frame.xs[LM.LEFT_HIP] = 0.52;
  frame.xs[LM.RIGHT_HIP] = 0.48;
  return out;
}

describe('movement camera readiness', () => {
  it('classifies front, side, mirrored side, and ambiguous core geometry', () => {
    expect(detectCameraView(frontOutput(0).frame)).toBe('front');
    expect(detectCameraView(sideOutput(0).frame)).toBe('side');
    const mirrored = sideOutput(0).frame;
    const swapXs = (a: LM, b: LM) => {
      const ax = mirrored.xs[a];
      mirrored.xs[a] = mirrored.xs[b];
      mirrored.xs[b] = ax;
    };
    swapXs(LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER);
    swapXs(LM.LEFT_HIP, LM.RIGHT_HIP);
    expect(detectCameraView(mirrored)).toBe('side');
    expect(detectCameraView(makeAmbiguous(frontOutput(0)).frame)).toBe('ambiguous');
  });

  it('requires the correct movement view and stable dwell before ready', () => {
    const tracker = new MovementCameraReadinessTracker({ stableMs: 500 });
    const spec = { view: 'side' as const, requiredReliableSideChains: 1 as const };

    expect(tracker.update(frontOutput(0), spec)).toMatchObject({
      ready: false,
      reason: 'turn-side-on',
      promptCue: 'turn-side-on',
    });
    expect(tracker.update(sideOutput(1000), spec)).toMatchObject({
      ready: false,
      reason: 'hold-still',
      stableForMs: 0,
    });
    expect(tracker.update(sideOutput(1499), spec)).toMatchObject({
      ready: false,
      stableForMs: 499,
    });
    expect(tracker.update(sideOutput(1500), spec)).toMatchObject({
      ready: true,
      reason: 'ready',
      stableForMs: 500,
    });
  });

  it('distinguishes front-view requests from visibility loss', () => {
    const tracker = new MovementCameraReadinessTracker({ stableMs: 1 });
    const frontSpec = { view: 'front' as const, requiredReliableSideChains: 2 as const };

    expect(tracker.update(sideOutput(0), frontSpec)).toMatchObject({
      ready: false,
      reason: 'face-camera',
      promptCue: 'face-forward',
    });
    expect(tracker.update(frontOutput(1000, 1), frontSpec)).toMatchObject({
      ready: false,
      reason: 'insufficient-reliable-chains',
      promptCue: 'step-into-frame',
    });
  });
});
