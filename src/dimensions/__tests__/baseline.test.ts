import { relativeToBand, rollingBaseline, type DimensionReading } from '../baseline';

const reading = (value: number, atIso: string, metricId = 'clarity_items_v1'): DimensionReading => ({
  dimensionId: 'clarity',
  metricId,
  value,
  unit: 'score',
  atIso,
  basis: 'self_report',
});

describe('rolling personal baseline (REPOSITION_TDD §5.4 — baseline-relative only)', () => {
  it('returns null below minSamples — no fabricated baseline, ever', () => {
    expect(rollingBaseline([])).toBeNull();
    expect(rollingBaseline([reading(2, '2026-01-01'), reading(3, '2026-02-01')])).toBeNull();
  });

  it('computes median and the usual range over the window', () => {
    const band = rollingBaseline([
      reading(1, '2026-01-01'),
      reading(2, '2026-02-01'),
      reading(3, '2026-03-01'),
      reading(4, '2026-04-01'),
      reading(5, '2026-05-01'),
    ]);
    expect(band).toEqual({ median: 3, low: 2, high: 4, sampleCount: 5 });
  });

  it('only the most recent `window` readings count, ordered by time not input order', () => {
    const shuffled = [
      reading(100, '2025-01-01'), // ancient outlier, must fall outside window
      reading(5, '2026-06-01'),
      reading(3, '2026-04-01'),
      reading(4, '2026-05-01'),
    ];
    const band = rollingBaseline(shuffled, { window: 3 });
    expect(band).toEqual({ median: 4, low: 3.5, high: 4.5, sampleCount: 3 });
  });

  it('ignores non-finite values and refuses mixed metric ids', () => {
    expect(
      rollingBaseline([reading(Number.NaN, '2026-01-01'), reading(2, '2026-02-01')])
    ).toBeNull();
    expect(() =>
      rollingBaseline([
        reading(1, '2026-01-01', 'clarity_items_v1'),
        reading(2, '2026-02-01', 'clarity_items_v2'),
        reading(3, '2026-03-01', 'clarity_items_v2'),
      ])
    ).toThrow(/mix metric ids/);
  });

  it('classifies readings against the personal band', () => {
    const band = { median: 3, low: 2, high: 4, sampleCount: 5 };
    expect(relativeToBand(1, band)).toBe('below');
    expect(relativeToBand(2, band)).toBe('within');
    expect(relativeToBand(4, band)).toBe('within');
    expect(relativeToBand(5, band)).toBe('above');
  });
});
