import { buildClarityTrendViewModel, clarityReadingsFromHistory } from '../clarityTrend';
import { bareDownwardChanges } from '../testing/copyInvariants';
import type { StoredCheckUp } from '../../history';

const CLARITY_BANNED = /validated|percentile|age group|typical of age|dementia|alzheimer/i;

function record(
  atIso: string,
  itemScores: (0 | 1 | 2 | 3 | 4)[] | null,
  checkupType: StoredCheckUp['checkupType'] = 'baseline_retake'
): StoredCheckUp {
  return {
    schemaVersion: 1,
    checkupType,
    scoreSnapshotCompatibility: 'unsupported_checkup_protocol',
    checkUp: {
      startedAt: atIso,
      bodyUnit: 1,
      items: [],
      ...(itemScores
        ? {
            selfReport: {
              schemaVersion: 1 as const,
              clarity: { itemSetId: 'clarity_items_v1' as const, itemScores },
            },
          }
        : {}),
    },
  };
}

const steady: (0 | 1 | 2 | 3 | 4)[] = [1, 1, 1, 1, 1]; // reading 3
const clouded: (0 | 1 | 2 | 3 | 4)[] = [4, 4, 3, 4, 4]; // reading ~0.2

describe('Clarity trend view model (REPOSITION_TDD §5.4 — baseline-relative only)', () => {
  it('derives readings only from official check-ups with a complete item set', () => {
    const readings = clarityReadingsFromHistory([
      record('2026-01-01T09:00:00.000Z', steady),
      record('2026-02-01T09:00:00.000Z', null), // skipped check-in
      record('2026-03-01T09:00:00.000Z', steady, 'micro_check'), // never rides micro-checks
    ]);
    expect(readings).toHaveLength(1);
    expect(readings[0]).toMatchObject({ dimensionId: 'clarity', basis: 'self_report', value: 3 });
  });

  it('is honest before a baseline exists: no band, no relation, just saved check-ins', () => {
    expect(buildClarityTrendViewModel([])).toEqual({ status: 'no_data' });
    const building = buildClarityTrendViewModel([
      record('2026-01-01T09:00:00.000Z', steady),
      record('2026-02-01T09:00:00.000Z', steady),
    ]);
    if (building.status !== 'building') throw new Error(building.status);
    expect(building.checkInCount).toBe(2);
    expect(building.body).toContain('build your own baseline');
    expect(building.fluctuationNote).toContain('trend over months');
  });

  it('reads the latest check-in against her own usual range — and a clouded month is never bare', () => {
    const history = [
      record('2026-01-01T09:00:00.000Z', steady),
      record('2026-02-01T09:00:00.000Z', steady),
      record('2026-03-01T09:00:00.000Z', steady),
      record('2026-04-01T09:00:00.000Z', clouded),
    ];
    const trend = buildClarityTrendViewModel(history);
    if (trend.status !== 'ready') throw new Error(trend.status);
    expect(trend.latestRelation).toBe('below');
    expect(trend.headline).toBe('More clouded than your usual range this month.');
    // Worse never bare: drivers + trainable path ride every below-band month.
    expect(
      bareDownwardChanges([
        { id: 'clarity', direction: 'down', supportCopy: trend.supportCopy },
      ])
    ).toEqual([]);
    expect(trend.supportCopy).toContain('sleep, symptom load, and stress');

    // Within her range: no support copy needed, honest steady headline.
    const steadyTrend = buildClarityTrendViewModel([
      ...history.slice(0, 3),
      record('2026-04-01T09:00:00.000Z', steady),
    ]);
    if (steadyTrend.status !== 'ready') throw new Error(steadyTrend.status);
    expect(steadyTrend.latestRelation).toBe('within');
    expect(steadyTrend.supportCopy).toBeUndefined();
  });

  it('never shows population comparison, raw scores, or banned cognitive language', () => {
    const trend = buildClarityTrendViewModel([
      record('2026-01-01T09:00:00.000Z', steady),
      record('2026-02-01T09:00:00.000Z', steady),
      record('2026-03-01T09:00:00.000Z', steady),
      record('2026-04-01T09:00:00.000Z', clouded),
    ]);
    const text = JSON.stringify(trend);
    expect(text).not.toMatch(CLARITY_BANNED);
    // Relations, not numbers: no bare reading values in any label.
    if (trend.status !== 'ready') throw new Error(trend.status);
    for (const entry of trend.entries) {
      expect(entry.relationLabel).toMatch(/Saved|usual/);
    }
  });
});
