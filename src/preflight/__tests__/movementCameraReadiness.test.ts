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

function setCoreGeometry(
  out: PipelineFrameOutput,
  timestampMs: number,
  shoulderRatio: number,
  hipRatio: number,
  torsoLen = 0.25
): PipelineFrameOutput {
  const frame = out.frame;
  frame.timestampMs = timestampMs;
  const shoulderWidth = shoulderRatio * torsoLen;
  const hipWidth = hipRatio * torsoLen;
  frame.xs[LM.LEFT_SHOULDER] = 0.5 + shoulderWidth * 0.5;
  frame.xs[LM.RIGHT_SHOULDER] = 0.5 - shoulderWidth * 0.5;
  frame.xs[LM.LEFT_HIP] = 0.5 + hipWidth * 0.5;
  frame.xs[LM.RIGHT_HIP] = 0.5 - hipWidth * 0.5;
  frame.ys[LM.LEFT_SHOULDER] = 0.35;
  frame.ys[LM.RIGHT_SHOULDER] = 0.35;
  frame.ys[LM.LEFT_HIP] = 0.35 + torsoLen;
  frame.ys[LM.RIGHT_HIP] = 0.35 + torsoLen;
  return out;
}

function ratioOutput(
  timestampMs: number,
  shoulderRatio: number,
  hipRatio: number,
  torsoLen = 0.25
): PipelineFrameOutput {
  return setCoreGeometry(frontOutput(timestampMs), timestampMs, shoulderRatio, hipRatio, torsoLen);
}

describe('movement camera readiness', () => {
  it('classifies front, side, mirrored side, ambiguous, and threshold-edge geometry', () => {
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
    expect(detectCameraView(ratioOutput(0, 0.381, 0.221).frame)).toBe('front');
    expect(detectCameraView(ratioOutput(0, 0.219, 0.179).frame)).toBe('side');
    expect(detectCameraView(ratioOutput(0, 0.3, 0.2).frame)).toBe('ambiguous');
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

  it('maps ambiguous orientation prompts to the required view instead of hold-still', () => {
    const sideTracker = new MovementCameraReadinessTracker({ stableMs: 500 });
    const frontTracker = new MovementCameraReadinessTracker({ stableMs: 500 });
    const sideSpec = { view: 'side' as const, requiredReliableSideChains: 1 as const };
    const frontSpec = { view: 'front' as const, requiredReliableSideChains: 2 as const };

    expect(sideTracker.update(makeAmbiguous(frontOutput(0)), sideSpec)).toMatchObject({
      ready: false,
      reason: 'ambiguous-view',
      promptCue: 'turn-side-on',
      setupCaption: 'Turn a little more so your side faces the camera.',
    });
    expect(frontTracker.update(makeAmbiguous(frontOutput(0)), frontSpec)).toMatchObject({
      ready: false,
      reason: 'ambiguous-view',
      promptCue: 'face-forward',
      setupCaption: 'Turn a little more to face the camera.',
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

  it('reserves hold-still for correct orientation while the 500ms dwell is incomplete', () => {
    const sideTracker = new MovementCameraReadinessTracker({ stableMs: 500 });
    const frontTracker = new MovementCameraReadinessTracker({ stableMs: 500 });

    expect(sideTracker.update(sideOutput(0), { view: 'side', requiredReliableSideChains: 1 })).toMatchObject({
      ready: false,
      reason: 'hold-still',
      promptCue: 'hold-still',
      setupCaption: 'Hold that position for a moment.',
    });
    expect(frontTracker.update(frontOutput(0), { view: 'front', requiredReliableSideChains: 2 })).toMatchObject({
      ready: false,
      reason: 'hold-still',
      promptCue: 'hold-still',
      setupCaption: 'Hold that position for a moment.',
    });
  });

  it('resets the dwell after wrong view, unreliable chains, subject loss, stream interruption, retry, or new item reset', () => {
    const spec = { view: 'side' as const, requiredReliableSideChains: 1 as const };
    const tracker = new MovementCameraReadinessTracker({ stableMs: 500 });

    expect(tracker.update(sideOutput(0), spec)).toMatchObject({ ready: false, stableForMs: 0 });
    expect(tracker.update(sideOutput(499), spec)).toMatchObject({ ready: false, stableForMs: 499 });
    expect(tracker.update(frontOutput(500), spec)).toMatchObject({ ready: false, reason: 'turn-side-on', stableForMs: 0 });
    expect(tracker.update(sideOutput(1000), spec)).toMatchObject({ ready: false, reason: 'hold-still', stableForMs: 0 });
    expect(tracker.update(sideOutput(1500), spec)).toMatchObject({ ready: true, reason: 'ready', stableForMs: 500 });

    expect(tracker.update(sideOutput(1600, 0), spec)).toMatchObject({
      ready: false,
      reason: 'insufficient-reliable-chains',
      stableForMs: 0,
    });
    expect(tracker.update(sideOutput(1700), spec)).toMatchObject({ ready: false, reason: 'hold-still', stableForMs: 0 });

    expect(
      tracker.update(sideOutput(1800), spec)
    ).toMatchObject({ ready: false, stableForMs: 100 });
    expect(
      tracker.update(sideOutput(1900), spec)
    ).toMatchObject({ ready: false, stableForMs: 200 });

    const subjectGone = sideOutput(2000);
    expect(tracker.update(subjectGone, spec)).toMatchObject({ ready: false, stableForMs: 300 });
    expect(
      tracker.update(
        {
          ...subjectGone,
          state: 'interrupted',
          events: [{ type: 'subject-gone', timestampMs: 2033 }],
        },
        spec
      )
    ).toMatchObject({ ready: false, reason: 'invalid-pose', promptCue: 'step-into-frame', stableForMs: 0 });
    expect(tracker.update(sideOutput(2100), spec)).toMatchObject({ ready: false, reason: 'hold-still', stableForMs: 0 });

    expect(
      tracker.update(
        {
          ...sideOutput(2200),
          state: 'interrupted',
          events: [{ type: 'subject-gone', timestampMs: 2200 }],
        },
        spec
      )
    ).toMatchObject({ ready: false, reason: 'invalid-pose', stableForMs: 0 });
    expect(tracker.update(sideOutput(2300), spec)).toMatchObject({ ready: false, reason: 'hold-still', stableForMs: 0 });

    expect(tracker.update(sideOutput(2800), spec)).toMatchObject({ ready: true, stableForMs: 500 });
    tracker.reset();
    expect(tracker.update(sideOutput(3000), spec)).toMatchObject({ ready: false, reason: 'hold-still', stableForMs: 0 });
    expect(tracker.update(sideOutput(3500), spec)).toMatchObject({ ready: true, stableForMs: 500 });
  });

  it('keeps readiness timing stable at low FPS, high FPS, duplicate timestamps, and decreasing timestamps', () => {
    const spec = { view: 'side' as const, requiredReliableSideChains: 1 as const };
    const lowFps = new MovementCameraReadinessTracker({ stableMs: 500 });
    for (const ts of [0, 100, 200, 300, 400]) {
      expect(lowFps.update(sideOutput(ts), spec)).toMatchObject({ ready: false });
    }
    expect(lowFps.update(sideOutput(500), spec)).toMatchObject({ ready: true, stableForMs: 500 });

    const highFps = new MovementCameraReadinessTracker({ stableMs: 500 });
    for (let ts = 0; ts < 500; ts += 17) {
      expect(highFps.update(sideOutput(ts), spec).ready).toBe(false);
    }
    expect(highFps.update(sideOutput(510), spec)).toMatchObject({ ready: true, stableForMs: 510 });

    const oddClock = new MovementCameraReadinessTracker({ stableMs: 500 });
    expect(oddClock.update(sideOutput(1000), spec)).toMatchObject({ ready: false, stableForMs: 0 });
    expect(oddClock.update(sideOutput(1000), spec)).toMatchObject({ ready: false, stableForMs: 0 });
    expect(oddClock.update(sideOutput(999), spec)).toMatchObject({ ready: false, stableForMs: 0 });
    expect(oddClock.update(sideOutput(1499), spec)).toMatchObject({ ready: false, stableForMs: 499 });
    expect(oddClock.update(sideOutput(1500), spec)).toMatchObject({ ready: true, stableForMs: 500 });
  });

  it('fails malformed core geometry closed as whole-body framing instead of orientation ambiguity', () => {
    const tracker = new MovementCameraReadinessTracker({ stableMs: 500 });
    const spec = { view: 'side' as const, requiredReliableSideChains: 1 as const };
    const nonFinite = sideOutput(0);
    nonFinite.frame.xs[LM.LEFT_SHOULDER] = NaN;
    expect(tracker.update(nonFinite, spec)).toMatchObject({
      ready: false,
      reason: 'invalid-pose',
      promptCue: 'step-into-frame',
      setupCaption: 'Make sure your whole body is visible.',
    });

    const nearZeroTorso = ratioOutput(1000, 0.4, 0.25, 0);
    expect(detectCameraView(nearZeroTorso.frame)).toBe('ambiguous');
    expect(tracker.update(nearZeroTorso, spec)).toMatchObject({
      ready: false,
      reason: 'invalid-pose',
      promptCue: 'step-into-frame',
    });
  });
});
