import {
  CHECKUP_SELF_REPORT_SCHEMA_VERSION,
  CLARITY_ITEMS,
  CLARITY_ITEM_SET_ID,
  CLARITY_SCALE,
  checkUpLocalHour,
  clarityReadingValue,
  validCheckUpSelfReport,
  type CheckUpSelfReport,
} from '../selfReport';

describe('Clarity self-report (REPOSITION_TDD §5; founder wording 2026-07-06)', () => {
  const fullReport = (scores: (0 | 1 | 2 | 3 | 4)[]): CheckUpSelfReport => ({
    schemaVersion: CHECKUP_SELF_REPORT_SCHEMA_VERSION,
    clarity: { itemSetId: CLARITY_ITEM_SET_ID, itemScores: scores },
  });

  it('ships exactly five original items on a five-point scale with the two-week recall', () => {
    expect(CLARITY_ITEMS).toHaveLength(5);
    expect(CLARITY_ITEMS.map((item) => item.id)).toEqual([
      'word_finding',
      'purpose_lapse',
      'concentration',
      'mental_fatigue',
      'everyday_tracking',
    ]);
    expect(CLARITY_SCALE.map((option) => option.label)).toEqual([
      'Not at all',
      'Slightly',
      'Moderately',
      'Quite a bit',
      'A great deal',
    ]);
  });

  it('inverts fog-direction scores into the trainable Clarity reading (higher = clearer)', () => {
    // All "Not at all" (no fog) → the clearest possible reading.
    expect(clarityReadingValue(fullReport([0, 0, 0, 0, 0]))).toBe(4);
    // All "A great deal" (heavy fog) → the lowest reading.
    expect(clarityReadingValue(fullReport([4, 4, 4, 4, 4]))).toBe(0);
    expect(clarityReadingValue(fullReport([2, 2, 2, 2, 2]))).toBe(2);
    // More fog must always mean a LOWER clarity value.
    const lighter = clarityReadingValue(fullReport([1, 0, 1, 0, 1]))!;
    const heavier = clarityReadingValue(fullReport([3, 4, 3, 4, 3]))!;
    expect(heavier).toBeLessThan(lighter);
  });

  it('yields no reading unless all five items were answered (all-or-nothing)', () => {
    expect(clarityReadingValue(undefined)).toBeNull();
    expect(
      clarityReadingValue({
        schemaVersion: CHECKUP_SELF_REPORT_SCHEMA_VERSION,
        covariates: { sleepQuality: 2 },
      })
    ).toBeNull();
  });

  it('parses defensively: malformed blocks drop, valid blocks round-trip', () => {
    expect(validCheckUpSelfReport(undefined)).toBeUndefined();
    expect(validCheckUpSelfReport({ schemaVersion: 99 })).toBeUndefined();
    // Partial or out-of-range item sets drop as a unit.
    expect(
      validCheckUpSelfReport({
        schemaVersion: 1,
        clarity: { itemSetId: CLARITY_ITEM_SET_ID, itemScores: [0, 1, 2] },
      })
    ).toBeUndefined();
    expect(
      validCheckUpSelfReport({
        schemaVersion: 1,
        clarity: { itemSetId: CLARITY_ITEM_SET_ID, itemScores: [0, 1, 2, 3, 9] },
      })
    ).toBeUndefined();
    // A wrong item-set id never mixes into this metric.
    expect(
      validCheckUpSelfReport({
        schemaVersion: 1,
        clarity: { itemSetId: 'clarity_items_v2', itemScores: [0, 1, 2, 3, 4] },
      })
    ).toBeUndefined();

    const valid = validCheckUpSelfReport({
      schemaVersion: 1,
      clarity: { itemSetId: CLARITY_ITEM_SET_ID, itemScores: [0, 1, 2, 3, 4] },
      covariates: { sleepQuality: 1, symptomLoad: 'prefer_not_to_say' },
    });
    expect(valid).toEqual({
      schemaVersion: 1,
      clarity: { itemSetId: CLARITY_ITEM_SET_ID, itemScores: [0, 1, 2, 3, 4] },
      covariates: { sleepQuality: 1, symptomLoad: 'prefer_not_to_say' },
    });

    // Covariates survive alone (fog skipped, sleep answered).
    expect(
      validCheckUpSelfReport({ schemaVersion: 1, covariates: { sleepQuality: 3, symptomLoad: 'nope' } })
    ).toEqual({ schemaVersion: 1, covariates: { sleepQuality: 3 } });
  });

  it('derives the time-of-day covariate from startedAt — nothing new is stored', () => {
    expect(checkUpLocalHour('not-a-date')).toBeNull();
    const hour = checkUpLocalHour('2026-07-06T09:30:00.000Z');
    expect(hour).toBeGreaterThanOrEqual(0);
    expect(hour).toBeLessThan(24);
  });
});
