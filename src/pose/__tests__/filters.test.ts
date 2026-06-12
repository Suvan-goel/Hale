import { OneEuroFilter, PoseSmoother } from '../filters';
import { mulberry32 } from '../testing/syntheticPose';
import { createPoseFrame, LM } from '../types';

describe('OneEuroFilter', () => {
  it('passes the first sample through unchanged', () => {
    const f = new OneEuroFilter();
    expect(f.filter(0.42, 0)).toBe(0.42);
  });

  it('converges to a constant input', () => {
    const f = new OneEuroFilter();
    let v = 0;
    f.filter(0, 0);
    for (let i = 1; i <= 90; i++) {
      v = f.filter(1, i / 30);
    }
    expect(v).toBeGreaterThan(0.95);
    expect(v).toBeLessThanOrEqual(1);
  });

  it('reduces the variance of jittery input', () => {
    const rng = mulberry32(7);
    const f = new OneEuroFilter();
    const raw: number[] = [];
    const filtered: number[] = [];
    for (let i = 0; i < 300; i++) {
      const v = 0.5 + (rng() * 2 - 1) * 0.01;
      raw.push(v);
      filtered.push(f.filter(v, i / 30));
    }
    expect(variance(filtered.slice(30))).toBeLessThan(variance(raw.slice(30)) * 0.25);
  });

  it('tracks fast movement with little lag (adaptive cutoff)', () => {
    const f = new OneEuroFilter();
    let out = 0;
    // ramp 0 → 1 over one second: a chair-stand-rise-like speed
    for (let i = 0; i <= 30; i++) {
      out = f.filter(i / 30, i / 30);
    }
    expect(out).toBeGreaterThan(0.85);
  });

  it('is deterministic for identical timestamped input', () => {
    const run = () => {
      const rng = mulberry32(123);
      const f = new OneEuroFilter();
      const out: number[] = [];
      for (let i = 0; i < 100; i++) out.push(f.filter(rng(), i / 30));
      return out;
    };
    expect(run()).toEqual(run());
  });
});

describe('PoseSmoother', () => {
  it('smooths landmark jitter and passes visibility through', () => {
    const rng = mulberry32(42);
    const smoother = new PoseSmoother();
    const src = createPoseFrame();
    const dst = createPoseFrame();
    const noseXs: number[] = [];
    for (let i = 0; i < 120; i++) {
      src.timestampMs = (i * 1000) / 30;
      src.hasPose = true;
      src.xs[LM.NOSE] = 0.5 + (rng() * 2 - 1) * 0.01;
      src.ys[LM.NOSE] = 0.2;
      src.visibility[LM.NOSE] = 0.9;
      smoother.apply(src, dst);
      if (i >= 30) noseXs.push(dst.xs[LM.NOSE]);
    }
    expect(variance(noseXs)).toBeLessThan(0.00002);
    expect(dst.visibility[LM.NOSE]).toBe(0.9);
  });
});

function variance(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((a, b) => a + (b - mean) * (b - mean), 0) / values.length;
}
