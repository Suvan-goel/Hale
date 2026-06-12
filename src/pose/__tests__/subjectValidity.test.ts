import { checkSubjectValidity, ValidityResult } from '../subjectValidity';
import { makeFrame, mulberry32 } from '../testing/syntheticPose';
import { createPoseFrame, LANDMARK_COUNT, LANDMARK_STRIDE, parseLandmarkEvent } from '../types';

function check(event: ReturnType<typeof makeFrame>): ValidityResult {
  const frame = createPoseFrame();
  parseLandmarkEvent(event, frame);
  const out: ValidityResult = { valid: false, reason: 'no-pose' };
  return checkSubjectValidity(frame, out);
}

describe('checkSubjectValidity', () => {
  const rng = mulberry32(11);

  it('accepts a plausible standing human', () => {
    const result = check(makeFrame(0, rng));
    expect(result).toEqual({ valid: true, reason: 'ok' });
  });

  it('rejects an empty frame', () => {
    const result = check(makeFrame(0, rng, { present: false }));
    expect(result).toEqual({ valid: false, reason: 'no-pose' });
  });

  it('rejects a skeleton with mostly invisible core landmarks', () => {
    const result = check(makeFrame(0, rng, { leftVisibility: 0.1, rightVisibility: 0.1 }));
    expect(result).toEqual({ valid: false, reason: 'too-few-visible' });
  });

  it('rejects a too-small skeleton (wall art across the room)', () => {
    const result = check(makeFrame(0, rng, { scale: 0.15, noiseAmp: 0 }));
    expect(result).toEqual({ valid: false, reason: 'too-small' });
  });

  it('rejects landmarks collapsed to a near-point (hallucinated subject)', () => {
    const event = makeFrame(0, rng);
    const lm = event.landmarks as number[];
    for (let i = 0; i < LANDMARK_COUNT; i++) {
      lm[i * LANDMARK_STRIDE] = 0.5 + (i % 3) * 0.001;
      lm[i * LANDMARK_STRIDE + 1] = 0.5 + (i % 5) * 0.001;
    }
    const result = check(event);
    expect(result.valid).toBe(false);
  });

  it('rejects implausible proportions (torso longer than legs allow)', () => {
    const event = makeFrame(0, rng, { noiseAmp: 0 });
    const lm = event.landmarks as number[];
    // drag both ankles up next to the hips: legs become tiny vs torso
    for (const idx of [27, 28, 29, 30, 31, 32]) {
      lm[idx * LANDMARK_STRIDE + 1] = 0.58;
    }
    const result = check(event);
    expect(result).toEqual({ valid: false, reason: 'implausible-proportions' });
  });

  it('still accepts a hinged-over body (head below hips must NOT invalidate)', () => {
    const event = makeFrame(0, rng, { noiseAmp: 0 });
    const lm = event.landmarks as number[];
    // side-view forward fold: torso pivots forward around the hips, so the
    // head drops below hip height while the torso keeps its 2D length
    for (const idx of [0, 11, 12]) {
      lm[idx * LANDMARK_STRIDE] = 0.72;
      lm[idx * LANDMARK_STRIDE + 1] = 0.62;
    }
    const result = check(event);
    expect(result.valid).toBe(true);
  });
});
