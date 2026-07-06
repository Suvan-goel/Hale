import { buildGhostCurveViewModel, GHOST_CURVE_MIN_READINGS } from '../ghostCurve';
import type { StoredCheckUp } from '../../history';

const GHOST_BANNED = /younger|older|percentile|for your age|typical of age|dementia|validated/i;

function record(atIso: string, reps: number | null): StoredCheckUp {
  return {
    schemaVersion: 1,
    checkupType: 'official_retest',
    scoreSnapshotCompatibility: 'unsupported_checkup_protocol',
    checkUp: {
      startedAt: atIso,
      bodyUnit: 1,
      items: [],
      ...(reps !== null
        ? {
            movementProfileV2Snapshot: {
              interpretation: { chair: { rawMetric: { metricId: 'chair_rises_30s', value: reps, unit: 'repetitions' } } },
            } as StoredCheckUp['checkUp']['movementProfileV2Snapshot'],
          }
        : {}),
    },
  };
}

// Monthly readings; index 0 is the baseline (100%).
function monthly(reps: number[]): StoredCheckUp[] {
  return reps.map((value, index) =>
    record(new Date(Date.UTC(2026, index, 1, 9)).toISOString(), value)
  );
}

describe('ghost curve (REPOSITION_TDD §2.4 — baseline-relative shaded band)', () => {
  it(`stays hidden until ${GHOST_CURVE_MIN_READINGS} monthly readings exist`, () => {
    const three = buildGhostCurveViewModel(monthly([12, 12, 13]));
    expect(three.status).toBe('insufficient');
    if (three.status !== 'insufficient') throw new Error(three.status);
    expect(three.needed).toBe(GHOST_CURVE_MIN_READINGS);

    const four = buildGhostCurveViewModel(monthly([12, 13, 12, 13]));
    expect(four.status).toBe('ready');
  });

  it('normalizes to her own baseline (100%) — never population or age', () => {
    const trend = buildGhostCurveViewModel(monthly([10, 11, 10, 12]));
    if (trend.status !== 'ready') throw new Error(trend.status);
    expect(trend.points[0].percentOfBaseline).toBe(100);
    expect(trend.points[3].percentOfBaseline).toBeCloseTo(120, 5);
    expect(JSON.stringify(trend)).not.toMatch(GHOST_BANNED);
  });

  it('renders a shaded BAND (low ≤ high per point), never a single line', () => {
    const trend = buildGhostCurveViewModel(monthly([12, 12, 12, 12]));
    if (trend.status !== 'ready') throw new Error(trend.status);
    expect(trend.band).toHaveLength(4);
    for (const point of trend.band) {
      expect(point.lowPercent).toBeLessThan(point.highPercent);
    }
    // The typical band descends over time (conservative decline).
    expect(trend.band[3].highPercent).toBeLessThan(trend.band[0].highPercent);
  });

  it('frames kept strength as won when she holds above the typical band', () => {
    // Holding flat at baseline sits above a descending typical band.
    const holding = buildGhostCurveViewModel(monthly([12, 12, 12, 12]));
    if (holding.status !== 'ready') throw new Error(holding.status);
    expect(holding.title).toBe('Strength kept is strength won');
    expect(holding.keepingStrength).toBe(true);
    expect(holding.body).toContain('kept');
    expect(holding.attribution).toMatch(/Hughes/);

    // A steep personal drop below the band is framed as still-trainable,
    // never bare or alarming.
    const dropping = buildGhostCurveViewModel(monthly([20, 15, 12, 9]));
    if (dropping.status !== 'ready') throw new Error(dropping.status);
    expect(dropping.keepingStrength).toBe(false);
    expect(dropping.body).toMatch(/every session|win/i);
  });
});
