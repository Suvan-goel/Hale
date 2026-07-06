import {
  CLARITY_INSTRUMENTS_SCHEMA_VERSION,
  computeDualTaskCostPercent,
  dualTaskReadingValue,
  validClarityInstruments,
  type DualTaskResult,
} from '../clarityInstruments';

const measured = (overrides: Partial<DualTaskResult> = {}): DualTaskResult => ({
  schemaVersion: 1,
  movementId: 'one-leg-balance-45s-v2',
  status: 'measured',
  singleTaskSeconds: 30,
  dualTaskSeconds: 21,
  costPercent: 30,
  speechActiveMs: 12000,
  ...overrides,
});

describe('dual-task cost (CLARITY_INSTRUMENTS_TDD §4.2)', () => {
  it('computes within-session % degradation', () => {
    expect(computeDualTaskCostPercent({ singleTaskSeconds: 30, dualTaskSeconds: 21 })).toBe(30);
    expect(computeDualTaskCostPercent({ singleTaskSeconds: 45, dualTaskSeconds: 45 })).toBe(0);
  });

  it('keeps negative cost — better under load is real, never floored', () => {
    expect(computeDualTaskCostPercent({ singleTaskSeconds: 20, dualTaskSeconds: 24 })).toBe(-20);
  });

  it('refuses to fabricate: invalid single-task input throws (callers gate first)', () => {
    expect(() => computeDualTaskCostPercent({ singleTaskSeconds: 0, dualTaskSeconds: 10 })).toThrow();
    expect(() => computeDualTaskCostPercent({ singleTaskSeconds: NaN, dualTaskSeconds: 10 })).toThrow();
    expect(() => computeDualTaskCostPercent({ singleTaskSeconds: 30, dualTaskSeconds: NaN })).toThrow();
  });

  it('trend reading inverts cost (higher = clearer) and only exists for measured runs', () => {
    expect(dualTaskReadingValue(measured())).toBe(70);
    expect(dualTaskReadingValue(measured({ costPercent: -10 }))).toBe(110);
    expect(dualTaskReadingValue(measured({ status: 'invalid', invalidReason: 'no_speech_detected' }))).toBeNull();
    expect(dualTaskReadingValue(measured({ status: 'skipped' }))).toBeNull();
    expect(dualTaskReadingValue(undefined)).toBeNull();
  });
});

describe('clarityInstruments defensive parse (boundary rules mirror selfReport)', () => {
  it('round-trips a coherent record, including ceilingLimited honesty (F2)', () => {
    const record = {
      schemaVersion: CLARITY_INSTRUMENTS_SCHEMA_VERSION,
      dualTask: measured({ ceilingLimited: true, costPercent: 0, dualTaskSeconds: 45, singleTaskSeconds: 45 }),
    };
    expect(validClarityInstruments(record)).toEqual(record);
  });

  it('keeps honest non-measured statuses without measurement fields', () => {
    for (const status of ['skipped', 'unavailable'] as const) {
      const parsed = validClarityInstruments({
        schemaVersion: 1,
        dualTask: { schemaVersion: 1, movementId: 'one-leg-balance-45s-v2', status },
      });
      expect(parsed?.dualTask?.status).toBe(status);
      expect(parsed?.dualTask?.costPercent).toBeUndefined();
    }
    const invalid = validClarityInstruments({
      schemaVersion: 1,
      dualTask: {
        schemaVersion: 1,
        movementId: 'one-leg-balance-45s-v2',
        status: 'invalid',
        invalidReason: 'no_speech_detected',
      },
    });
    expect(invalid?.dualTask?.invalidReason).toBe('no_speech_detected');
  });

  it('drops half-records and garbage as a unit — never a fabricated measurement', () => {
    expect(validClarityInstruments(undefined)).toBeUndefined();
    expect(validClarityInstruments({ schemaVersion: 99 })).toBeUndefined();
    // 'measured' without a coherent measurement drops.
    expect(
      validClarityInstruments({
        schemaVersion: 1,
        dualTask: { schemaVersion: 1, movementId: 'one-leg-balance-45s-v2', status: 'measured' },
      })
    ).toBeUndefined();
    expect(
      validClarityInstruments({
        schemaVersion: 1,
        dualTask: measured({ costPercent: Number.NaN }),
      })
    ).toBeUndefined();
    // No free text can ride an unknown field into the record.
    const parsed = validClarityInstruments({
      schemaVersion: 1,
      dualTask: { ...measured(), transcript: 'ninety seven, ninety four' } as never,
    });
    expect(JSON.stringify(parsed)).not.toContain('ninety');
  });
});
