import { ChainReliabilityTracker } from '../chains';
import { makeFrame, mulberry32, timestamps30fps } from '../testing/syntheticPose';
import { createPoseFrame, parseLandmarkEvent } from '../types';

function feed(
  tracker: ChainReliabilityTracker,
  frames: ReturnType<typeof makeFrame>[]
): void {
  const frame = createPoseFrame();
  for (const f of frames) {
    parseLandmarkEvent(f, frame);
    tracker.update(frame);
  }
}

describe('ChainReliabilityTracker', () => {
  it('reports high reliability for a fully visible subject', () => {
    const rng = mulberry32(1);
    const tracker = new ChainReliabilityTracker(15);
    feed(tracker, timestamps30fps(0, 30).map((t) => makeFrame(t, rng)));
    expect(tracker.get('leftSide')).toBeGreaterThan(0.9);
    expect(tracker.get('rightSide')).toBeGreaterThan(0.9);
    expect(tracker.reliableSideChains()).toBe(2);
  });

  it('degrades the far side in a side view and picks the near side', () => {
    const rng = mulberry32(2);
    const tracker = new ChainReliabilityTracker(15);
    // subject turned side-on: left (far) limbs occluded
    feed(
      tracker,
      timestamps30fps(0, 30).map((t) => makeFrame(t, rng, { leftVisibility: 0.15 }))
    );
    expect(tracker.get('leftSide')).toBeLessThan(0.3);
    expect(tracker.get('rightSide')).toBeGreaterThan(0.9);
    expect(tracker.reliableSideChains()).toBe(1);
    expect(tracker.bestSide()).toBe('rightSide');
  });

  it('a single perfect-visibility frame does not make a chain reliable (windowing)', () => {
    const rng = mulberry32(3);
    const tracker = new ChainReliabilityTracker(15);
    // 14 frames with no pose, then 1 perfect frame
    feed(tracker, timestamps30fps(0, 14).map((t) => makeFrame(t, rng, { present: false })));
    feed(tracker, [makeFrame(500, rng)]);
    expect(tracker.get('leftSide')).toBeLessThan(0.2);
    expect(tracker.reliableSideChains()).toBe(0);
  });

  it('one occluded landmark drags down its whole chain (weakest link)', () => {
    const rng = mulberry32(4);
    const tracker = new ChainReliabilityTracker(15);
    const frames = timestamps30fps(0, 30).map((t) => {
      const f = makeFrame(t, rng);
      // knock out just the left ankle's visibility
      const lm = f.landmarks as number[];
      const ankleBase = 27 * 5;
      lm[ankleBase + 3] = 0.1;
      return f;
    });
    feed(tracker, frames);
    expect(tracker.get('leftSide')).toBeLessThan(0.2);
    expect(tracker.get('leftArm')).toBeGreaterThan(0.9);
  });

  it('reset clears all reliability', () => {
    const rng = mulberry32(5);
    const tracker = new ChainReliabilityTracker(15);
    feed(tracker, timestamps30fps(0, 30).map((t) => makeFrame(t, rng)));
    tracker.reset();
    expect(tracker.get('leftSide')).toBe(0);
    expect(tracker.reliableSideChains()).toBe(0);
  });
});
