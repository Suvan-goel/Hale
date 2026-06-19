import {
  BALANCE_LADDER_ID,
  CHAIR_STAND_ID,
  HINGE_REACH_ID,
  SHOULDER_FLEXION_ID,
  getMovement,
} from '../index';
import type { PipelineFrameOutput, PoseEvent } from '../../pose/pipeline';
import { makeFrame, mulberry32 } from '../../pose/testing/syntheticPose';
import { shoulderFlexionSession } from '../../pose/testing/syntheticRom';
import { createPoseFrame, parseLandmarkEvent, type RawLandmarkEvent } from '../../pose/types';

function outputFromRaw(
  raw: RawLandmarkEvent,
  state: PipelineFrameOutput['state'],
  events: PoseEvent[] = []
): PipelineFrameOutput {
  const frame = createPoseFrame();
  parseLandmarkEvent(raw, frame);
  return {
    state,
    frame,
    rawFrame: frame,
    displayFrame: frame,
    chainReliability: new Float64Array([1, 0.95, 0.95, 0.95, 0.95]),
    reliableSideChains: 2,
    validity: { valid: true, reason: 'ok' },
    bodyUnit: 0.32,
    events,
    fps: 30,
  };
}

const sideFrame = shoulderFlexionSession({ seed: 910, noiseAmp: 0, peakDeg: 165 }).frames[0];
const frontFrame = makeFrame(0, mulberry32(911), { noiseAmp: 0 });

describe('official movement graders — tracking interruption contract', () => {
  it.each([
    [CHAIR_STAND_ID, sideFrame],
    [BALANCE_LADDER_ID, frontFrame],
    [SHOULDER_FLEXION_ID, sideFrame],
    [HINGE_REACH_ID, sideFrame],
  ])('%s treats controller-level camera loss as an interruption, not a measuring frame', (movementId, raw) => {
    const grader = getMovement(movementId).createGrader();
    const interrupted = outputFromRaw(raw, 'interrupted', [
      { type: 'tracking-interrupted', timestampMs: raw.timestampMs },
    ]);

    const live = grader.update(interrupted);
    const result = grader.finish(raw.timestampMs);

    expect(live.measuring).toBe(false);
    expect(result.interruptions).toBe(1);
    expect(result.flags).toContain('tracking-interrupted');
  });

  it('does not publish ROM values from frames that arrive only during interruption', () => {
    for (const movementId of [SHOULDER_FLEXION_ID, HINGE_REACH_ID]) {
      const raw = { ...sideFrame, timestampMs: 2000 };
      const grader = getMovement(movementId).createGrader();
      grader.update(
        outputFromRaw(raw, 'interrupted', [{ type: 'tracking-interrupted', timestampMs: raw.timestampMs }])
      );

      const result = grader.finish(raw.timestampMs);
      expect(result.flags).toEqual(expect.arrayContaining(['tracking-interrupted', 'no-measurement']));
      if (movementId === SHOULDER_FLEXION_ID) {
        expect(Number.isNaN((result as unknown as { peakFlexionDeg: number }).peakFlexionDeg)).toBe(true);
      } else {
        expect(Number.isNaN((result as unknown as { reachBu: number }).reachBu)).toBe(true);
      }
    }
  });
});
