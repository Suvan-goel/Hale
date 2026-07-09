import {
  buildClarityTrendViewModel,
  clarityReadingsFromHistory,
  dualTaskReadingsFromHistory,
  fluencyRelativeReadingsFromHistory,
} from '../clarityTrend';
import type { FluencyCategoryId } from '../../checkup';
import { bareDownwardChanges } from '../testing/copyInvariants';
import type { StoredCheckUp } from '../../history';

const CLARITY_BANNED = /validated|percentile|age group|typical of age|dementia|alzheimer/i;

function record(
  atIso: string,
  options: {
    itemScores?: (0 | 1 | 2 | 3 | 4)[] | null;
    dualTaskCost?: number | null;
    fluency?: { categoryId: FluencyCategoryId; count: number } | null;
    covariates?: { sleepQuality?: 1 | 2 | 3; symptomLoad?: 1 | 2 | 3 };
    checkupType?: StoredCheckUp['checkupType'];
  } = {}
): StoredCheckUp {
  const {
    itemScores = null,
    dualTaskCost = null,
    fluency = null,
    covariates,
    checkupType = 'baseline_retake',
  } = options;
  return {
    schemaVersion: 1,
    checkupType,
    scoreSnapshotCompatibility: 'unsupported_checkup_protocol',
    checkUp: {
      startedAt: atIso,
      bodyUnit: 1,
      items: [],
      ...(itemScores || covariates
        ? {
            selfReport: {
              schemaVersion: 1 as const,
              ...(itemScores
                ? { clarity: { itemSetId: 'clarity_items_v1' as const, itemScores } }
                : {}),
              ...(covariates ? { covariates } : {}),
            },
          }
        : {}),
      ...(dualTaskCost !== null || fluency
        ? {
            clarityInstruments: {
              schemaVersion: 1 as const,
              ...(dualTaskCost !== null
                ? {
                    dualTask: {
                      schemaVersion: 1 as const,
                      movementId: 'one-leg-balance-45s-v2',
                      status: 'measured' as const,
                      singleTaskSeconds: 30,
                      dualTaskSeconds: 30 * (1 - dualTaskCost / 100),
                      costPercent: dualTaskCost,
                    },
                  }
                : {}),
              ...(fluency
                ? {
                    fluency: {
                      schemaVersion: 1 as const,
                      categoryId: fluency.categoryId,
                      status: 'measured' as const,
                      validWordCount: fluency.count,
                      durationSec: 60 as const,
                    },
                  }
                : {}),
            },
          }
        : {}),
    },
  };
}

const steady: (0 | 1 | 2 | 3 | 4)[] = [1, 1, 1, 1, 1]; // reading 3
const clouded: (0 | 1 | 2 | 3 | 4)[] = [4, 4, 3, 4, 4]; // reading ~0.2

describe('Clarity trend view model (multi-series, DT3)', () => {
  it('derives readings only from official check-ups with complete data', () => {
    const readings = clarityReadingsFromHistory([
      record('2026-01-01T09:00:00.000Z', { itemScores: steady }),
      record('2026-02-01T09:00:00.000Z', {}), // skipped check-in
      record('2026-03-01T09:00:00.000Z', { itemScores: steady, checkupType: 'micro_check' }),
    ]);
    expect(readings).toHaveLength(1);
    expect(readings[0]).toMatchObject({ dimensionId: 'clarity', basis: 'self_report', value: 3 });
  });

  it('derives dual-task readings as measured, inverted (higher = steadier)', () => {
    const readings = dualTaskReadingsFromHistory([
      record('2026-01-01T09:00:00.000Z', { dualTaskCost: 30 }),
      record('2026-02-01T09:00:00.000Z', {}), // no level 2 this month
    ]);
    expect(readings).toHaveLength(1);
    expect(readings[0]).toMatchObject({
      metricId: 'dual_task_cost_balance_v1',
      basis: 'measured',
      value: 70,
    });
  });

  it('is honest before a baseline exists: building state, no band, no relation', () => {
    expect(buildClarityTrendViewModel([])).toEqual({ status: 'no_data' });
    const building = buildClarityTrendViewModel([
      record('2026-01-01T09:00:00.000Z', { itemScores: steady }),
      record('2026-02-01T09:00:00.000Z', { itemScores: steady }),
    ]);
    if (building.status !== 'ready') throw new Error(building.status);
    const subjective = building.series.find((series) => series.id === 'subjective');
    expect(subjective?.trend.status).toBe('building');
    expect(building.fluctuationNote).toContain('trend over months');
    expect(building.activityNote).toContain('never change your training plan');
  });

  it('reads each series against her own usual range — clouded months never bare', () => {
    const history = [
      record('2026-01-01T09:00:00.000Z', { itemScores: steady, dualTaskCost: 10 }),
      record('2026-02-01T09:00:00.000Z', { itemScores: steady, dualTaskCost: 12 }),
      record('2026-03-01T09:00:00.000Z', { itemScores: steady, dualTaskCost: 8 }),
      record('2026-04-01T09:00:00.000Z', { itemScores: clouded, dualTaskCost: 40 }),
    ];
    const trend = buildClarityTrendViewModel(history);
    if (trend.status !== 'ready') throw new Error(trend.status);
    expect(trend.series.map((series) => series.id)).toEqual(['subjective', 'dual_task']);

    for (const series of trend.series) {
      if (series.trend.status !== 'ready') throw new Error(series.trend.status);
      expect(series.trend.latestRelation).toBe('below');
      expect(
        bareDownwardChanges([{ id: series.id, direction: 'down', supportCopy: series.trend.supportCopy }])
      ).toEqual([]);
      expect(series.trend.supportCopy).toContain('sleep, symptom load, or stress');
    }
    expect(trend.series[1].trend.status === 'ready' && trend.series[1].trend.headline).toBe(
      'Less steady under load than usual this month.'
    );
  });

  it('names her own covariates when a dip lines up with them (§6.1) — never diagnostic', () => {
    const dippedWithRoughSleep = buildClarityTrendViewModel([
      record('2026-01-01T09:00:00.000Z', { itemScores: steady }),
      record('2026-02-01T09:00:00.000Z', { itemScores: steady }),
      record('2026-03-01T09:00:00.000Z', { itemScores: steady }),
      record('2026-04-01T09:00:00.000Z', { itemScores: clouded, covariates: { sleepQuality: 1 } }),
    ]);
    if (dippedWithRoughSleep.status !== 'ready') throw new Error(dippedWithRoughSleep.status);
    expect(dippedWithRoughSleep.covariateContext).toContain("rough night's sleep");
    expect(dippedWithRoughSleep.covariateContext).toContain('clarity usually tracks');

    // No dip → no context line, even with rough covariates.
    const steadyMonth = buildClarityTrendViewModel([
      record('2026-01-01T09:00:00.000Z', { itemScores: steady }),
      record('2026-02-01T09:00:00.000Z', { itemScores: steady }),
      record('2026-03-01T09:00:00.000Z', { itemScores: steady }),
      record('2026-04-01T09:00:00.000Z', { itemScores: steady, covariates: { sleepQuality: 1 } }),
    ]);
    if (steadyMonth.status !== 'ready') throw new Error(steadyMonth.status);
    expect(steadyMonth.covariateContext).toBeUndefined();
  });

  it('fluency: raw counts never cross categories — each run reads against its own category anchor (F3)', () => {
    // Cycle 1 (months 1–4): four first encounters, each establishing its
    // anchor — NO trend points yet. Month 5: animals repeats → first relative.
    const history = [
      record('2026-01-01T09:00:00.000Z', { fluency: { categoryId: 'animals', count: 20 } }),
      record('2026-02-01T09:00:00.000Z', { fluency: { categoryId: 'foods', count: 30 } }),
      record('2026-03-01T09:00:00.000Z', { fluency: { categoryId: 'countries', count: 10 } }),
      record('2026-04-01T09:00:00.000Z', { fluency: { categoryId: 'kitchen_things', count: 16 } }),
    ];
    expect(fluencyRelativeReadingsFromHistory(history)).toEqual([]);

    history.push(record('2026-05-01T09:00:00.000Z', { fluency: { categoryId: 'animals', count: 24 } }));
    const relative = fluencyRelativeReadingsFromHistory(history);
    expect(relative).toHaveLength(1);
    // 24 vs the animals anchor of 20 → 120% — foods' 30 never enters it.
    expect(relative[0]).toMatchObject({ metricId: 'fluency_relative_v1', value: 120, basis: 'measured' });

    // A harder category scoring fewer RAW words can still be a personal best
    // WITHIN category: countries 12 vs anchor 10 → 120%, not a dip.
    history.push(record('2026-06-01T09:00:00.000Z', { fluency: { categoryId: 'countries', count: 12 } }));
    const twoPoints = fluencyRelativeReadingsFromHistory(history);
    expect(twoPoints[1]).toMatchObject({ value: 120 });
  });

  it('keeps word-finding out of the MVP surface while preserving an explicit legacy inspection option', () => {
    const months = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'];
    const categories: FluencyCategoryId[] = ['animals', 'foods', 'countries', 'kitchen_things', 'animals', 'foods'];
    const history = months.map((month, index) =>
      record(`${month}-01T09:00:00.000Z`, {
        itemScores: steady,
        fluency: { categoryId: categories[index], count: 20 },
      })
    );
    const mvpTrend = buildClarityTrendViewModel(history);
    if (mvpTrend.status !== 'ready') throw new Error(mvpTrend.status);
    expect(mvpTrend.series.find((series) => series.id === 'fluency')).toBeUndefined();

    const legacyInspection = buildClarityTrendViewModel(history, { includeFluency: true });
    if (legacyInspection.status !== 'ready') throw new Error(legacyInspection.status);
    const fluencySeries = legacyInspection.series.find((series) => series.id === 'fluency');
    expect(fluencySeries?.label).toBe('Word-finding');
    // Two relative points (months 5–6): building honestly, no band claimed.
    expect(fluencySeries?.trend.status).toBe('building');
  });

  it('never shows population comparison, raw scores, or banned cognitive language', () => {
    const trend = buildClarityTrendViewModel([
      record('2026-01-01T09:00:00.000Z', { itemScores: steady, dualTaskCost: 10 }),
      record('2026-02-01T09:00:00.000Z', { itemScores: steady, dualTaskCost: 12 }),
      record('2026-03-01T09:00:00.000Z', { itemScores: steady, dualTaskCost: 8 }),
      record('2026-04-01T09:00:00.000Z', { itemScores: clouded, dualTaskCost: 40 }),
    ]);
    expect(JSON.stringify(trend)).not.toMatch(CLARITY_BANNED);
    if (trend.status !== 'ready') throw new Error(trend.status);
    for (const series of trend.series) {
      if (series.trend.status === 'no_data') continue;
      for (const entry of series.trend.entries) {
        expect(entry.relationLabel).toMatch(/Saved|usual/);
      }
    }
  });
});
