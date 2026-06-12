/**
 * Per-limb-chain reliability, smoothed over a frame window.
 *
 * Per-frame visibility scores are noisy and untrustworthy (hard-won Forma
 * lesson) — every downstream decision gates on these windowed chain scores,
 * never on raw per-frame visibility. A chain is as reliable as its weakest
 * landmark (min, not mean: a side-view far leg with a perfect hip but an
 * occluded ankle must read as unreliable).
 */

import { LM, PoseFrame } from './types';

export type ChainId = 'head' | 'leftSide' | 'rightSide' | 'leftArm' | 'rightArm';

export const CHAIN_IDS: readonly ChainId[] = [
  'head',
  'leftSide',
  'rightSide',
  'leftArm',
  'rightArm',
];

/** shoulder→hip→knee→ankle is the load-bearing chain for every graded movement. */
export const CHAINS: Record<ChainId, readonly LM[]> = {
  head: [LM.NOSE, LM.LEFT_EAR, LM.RIGHT_EAR],
  leftSide: [LM.LEFT_SHOULDER, LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE],
  rightSide: [LM.RIGHT_SHOULDER, LM.RIGHT_HIP, LM.RIGHT_KNEE, LM.RIGHT_ANKLE],
  leftArm: [LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST],
  rightArm: [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST],
};

export const CHAIN_COUNT = CHAIN_IDS.length;

/** Default reliability threshold for "this chain can be trusted". */
export const RELIABLE_THRESHOLD = 0.5;

export class ChainReliabilityTracker {
  /** Windowed reliability per chain, indexed by CHAIN_IDS order. */
  readonly reliability = new Float64Array(CHAIN_COUNT);

  private readonly windowFrames: number;
  private readonly ring: Float64Array; // CHAIN_COUNT * windowFrames
  private ringPos = 0;
  private filled = 0;

  constructor(windowFrames = 15) {
    this.windowFrames = windowFrames;
    this.ring = new Float64Array(CHAIN_COUNT * windowFrames);
  }

  /** Push one frame's per-chain scores and refresh windowed means. */
  update(frame: PoseFrame): void {
    const base = this.ringPos * CHAIN_COUNT;
    for (let c = 0; c < CHAIN_COUNT; c++) {
      let score = 0;
      if (frame.hasPose) {
        const members = CHAINS[CHAIN_IDS[c]];
        score = 1;
        for (let m = 0; m < members.length; m++) {
          const v = frame.visibility[members[m]];
          if (v < score) score = v;
        }
      }
      this.ring[base + c] = score;
    }
    this.ringPos = (this.ringPos + 1) % this.windowFrames;
    if (this.filled < this.windowFrames) this.filled++;

    // Always divide by the full window size: an empty/young window reads as
    // unreliable, so reliability RAMPS UP over ~half a window of good frames
    // instead of trusting the very first one.
    for (let c = 0; c < CHAIN_COUNT; c++) {
      let sum = 0;
      for (let w = 0; w < this.filled; w++) {
        sum += this.ring[w * CHAIN_COUNT + c];
      }
      this.reliability[c] = sum / this.windowFrames;
    }
  }

  get(chain: ChainId): number {
    return this.reliability[CHAIN_IDS.indexOf(chain)];
  }

  isReliable(chain: ChainId, threshold = RELIABLE_THRESHOLD): boolean {
    return this.get(chain) >= threshold;
  }

  /**
   * Count of reliable side chains (left/right shoulder→hip→knee→ankle).
   * Side-view movements need 1, front-view bilateral movements need 2.
   */
  reliableSideChains(threshold = RELIABLE_THRESHOLD): number {
    let count = 0;
    if (this.reliability[CHAIN_IDS.indexOf('leftSide')] >= threshold) count++;
    if (this.reliability[CHAIN_IDS.indexOf('rightSide')] >= threshold) count++;
    return count;
  }

  /** The side chain to trust for side-view measurements right now. */
  bestSide(): 'leftSide' | 'rightSide' {
    return this.get('leftSide') >= this.get('rightSide') ? 'leftSide' : 'rightSide';
  }

  reset(): void {
    this.ring.fill(0);
    this.reliability.fill(0);
    this.ringPos = 0;
    this.filled = 0;
  }
}
