import {
  buildClarityTrendViewModel,
  clarityReadingsFromHistory,
  dualTaskReadingsFromHistory,
  fluencyRelativeReadingsFromHistory,
  pairedClarityMetricId,
} from '../clarityTrend';
import type { FluencyCategoryId, PairedClarityResultRecord } from '../../checkup';
import { bareDownwardChanges } from '../testing/copyInvariants';
import type { StoredCheckUp } from '../../history';

const CLARITY_BANNED = /validated|percentile|age group|typical of age|dementia|alzheimer/i;

function pairedTask(costPercent: number): PairedClarityResultRecord {
  const soloMs = 20_000;
  const dualMs = soloMs * (1 - costPercent / 100);
  const attempts = Math.min(19, Math.max(0, 1 + Math.floor((dualMs - 2250) / 2400)));
  return {
    schemaVersion: 1,
    status: 'measured',
    protocol: {
      protocolId: 'pearl_paired_clarity_balance_v1',
      protocolVersion: 1,
      movementId: 'one-leg-balance-45s-v2',
      stanceId: 'single_leg_eyes_open_v1',
      standingSide: 'left',
      order: 'solo_then_dual',
      trialCapMs: 45_000,
      standardizedRestMs: 30_000,
      liftConfirmMs: 300,
      touchdownDebounceFrames: 3,
      trackingLossConfirmFrames: 4,
      validityPolicy: {
        minSoloHoldMs: 10_000,
        ceilingExclusionMarginMs: 3_000,
        minCognitiveAttempts: 4,
        minCognitiveResponses: 1,
        minCognitiveAccuracy: 0.6,
      },
    },
    responseProtocol: {
      protocolId: 'pearl_visual_go_no_go_v1',
      protocolVersion: 1,
      sequenceAlgorithmId: 'fixed_balanced_forms_v1',
      sequenceSeedId: 'pearl_vgng_form_a_v1',
      responseSignal: 'speech_presence_boolean',
      responseRule: 'respond_on_target_only',
      leadInMs: 750,
      promptVisibleMs: 600,
      responseWindowMs: 1_500,
      promptCadenceMs: 2_400,
      promptCount: 19,
      minimumPresentedCount: 4,
    },
    solo: { kind: 'solo', durationMs: soloMs, durationSec: soloMs / 1000, termination: 'touchdown' },
    dual: { kind: 'dual', durationMs: dualMs, durationSec: dualMs / 1000, termination: 'touchdown' },
    cognitive: {
      attempts,
      responses: Math.max(1, Math.floor(attempts / 2)),
      correct: attempts - 1,
      errors: 1,
    },
    motorCostPercent: costPercent,
    ceilingLimited: false,
  };
}

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
                    pairedTask: pairedTask(dualTaskCost),
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
const minimallyClearer: (0 | 1 | 2 | 3 | 4)[] = [0, 1, 1, 1, 1]; // reading 3.2
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

  it('derives matched-pair readings as measured, inverted (higher = steadier)', () => {
    const readings = dualTaskReadingsFromHistory([
      record('2026-01-01T09:00:00.000Z', { dualTaskCost: 30 }),
      record('2026-02-01T09:00:00.000Z', {}), // no level 2 this month
    ]);
    expect(readings).toHaveLength(1);
    expect(readings[0]).toMatchObject({
      metricId: pairedClarityMetricId(pairedTask(30)),
      basis: 'measured',
      value: 70,
    });
  });

  it('keeps exact pair protocols in separate series and excludes ceiling-limited holds', () => {
    const first = record('2026-01-01T09:00:00.000Z', { dualTaskCost: 10 });
    const changedSide = record('2026-02-01T09:00:00.000Z', { dualTaskCost: 20 });
    const changedPair = changedSide.checkUp.clarityInstruments?.pairedTask;
    if (!changedPair) throw new Error('fixture must include paired task');
    const changedExactPair: PairedClarityResultRecord = {
      ...changedPair,
      protocol: { ...changedPair.protocol, standingSide: 'right' },
    };
    changedSide.checkUp.clarityInstruments = {
      schemaVersion: 1,
      pairedTask: changedExactPair,
    };

    const split = dualTaskReadingsFromHistory([first, changedSide]);
    expect(split).toHaveLength(1);
    expect(split[0].atIso).toBe('2026-02-01T09:00:00.000Z');
    expect(split[0].metricId).toBe(pairedClarityMetricId(changedExactPair));

    const ceiling = record('2026-03-01T09:00:00.000Z', { dualTaskCost: 0 });
    const ceilingPair = ceiling.checkUp.clarityInstruments?.pairedTask;
    if (!ceilingPair || ceilingPair.status !== 'measured') {
      throw new Error('fixture must include measured paired task');
    }
    ceiling.checkUp.clarityInstruments = {
      schemaVersion: 1,
      pairedTask: { ...ceilingPair, ceilingLimited: true },
    };
    expect(dualTaskReadingsFromHistory([ceiling])).toEqual([]);
  });

  it('quarantines the legacy VAD-only dual-task shape from the current trend', () => {
    const legacy = record('2026-01-01T09:00:00.000Z');
    legacy.checkUp.clarityInstruments = {
      schemaVersion: 1,
      dualTask: {
        schemaVersion: 1,
        movementId: 'one-leg-balance-45s-v2',
        status: 'measured',
        singleTaskSeconds: 20,
        dualTaskSeconds: 15,
        costPercent: 25,
      },
    };
    expect(dualTaskReadingsFromHistory([legacy])).toEqual([]);
  });

  it('can scope every series to accepted 12-week checkpoint ids', () => {
    const accepted = record('2026-01-01T09:00:00.000Z', {
      itemScores: steady,
      dualTaskCost: 10,
    });
    const failedAttempt = record('2026-01-15T09:00:00.000Z', {
      itemScores: clouded,
      dualTaskCost: 40,
    });
    const trend = buildClarityTrendViewModel([accepted, failedAttempt], {
      acceptedSourceCheckUpIds: [accepted.checkUp.startedAt],
      includePairedTask: true,
    });
    if (trend.status !== 'ready') throw new Error(trend.status);
    expect(trend.series).toHaveLength(2);
    for (const series of trend.series) {
      expect(series.trend.status === 'building' && series.trend.checkInCount).toBe(1);
    }
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
    expect(building.fluctuationNote).toContain('pattern across check-ups');
    expect(building.activityNote).toContain('never change your training plan');
  });

  it('reads each series against her own usual range — clouded months never bare', () => {
    const history = [
      record('2026-01-01T09:00:00.000Z', { itemScores: steady, dualTaskCost: 10 }),
      record('2026-02-01T09:00:00.000Z', { itemScores: steady, dualTaskCost: 12 }),
      record('2026-03-01T09:00:00.000Z', { itemScores: steady, dualTaskCost: 8 }),
      record('2026-04-01T09:00:00.000Z', { itemScores: clouded, dualTaskCost: 40 }),
    ];
    const trend = buildClarityTrendViewModel(history, { includePairedTask: true });
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
      'Less steady under load than usual at this check-up.'
    );
  });

  it('keeps the smallest possible subjective item shift inside the usual range', () => {
    const trend = buildClarityTrendViewModel([
      record('2026-01-01T09:00:00.000Z', { itemScores: steady }),
      record('2026-02-01T09:00:00.000Z', { itemScores: steady }),
      record('2026-03-01T09:00:00.000Z', { itemScores: steady }),
      record('2026-04-01T09:00:00.000Z', { itemScores: minimallyClearer }),
    ]);
    if (trend.status !== 'ready') throw new Error(trend.status);
    const subjective = trend.series.find((series) => series.id === 'subjective');
    if (!subjective || subjective.trend.status !== 'ready') {
      throw new Error('expected ready subjective trend');
    }
    expect(subjective.trend.latestRelation).toBe('within');
    expect(subjective.trend.headline).toBe('In your usual range at this check-up.');
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
    expect(dippedWithRoughSleep.covariateContext).toContain('does not establish a cause');

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

  it('binds dip context to the latest entry in the displayed comparable series', () => {
    const history = [
      record('2026-01-01T09:00:00.000Z', { itemScores: steady }),
      record('2026-02-01T09:00:00.000Z', { itemScores: steady }),
      record('2026-03-01T09:00:00.000Z', { itemScores: steady }),
      record('2026-04-01T09:00:00.000Z', {
        itemScores: clouded,
        covariates: { sleepQuality: 1 },
      }),
      // A later official Check-Up skipped the subjective check-in. Its
      // covariates must not be attributed to April's displayed reading.
      record('2026-05-01T09:00:00.000Z', { covariates: { symptomLoad: 3 } }),
    ];
    const trend = buildClarityTrendViewModel(history);
    if (trend.status !== 'ready') throw new Error(trend.status);
    expect(trend.covariateContext).toContain("rough night's sleep");
    expect(trend.covariateContext).not.toContain('heavy symptom week');
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

  it('keeps the paired-task series behind its explicit release gate', () => {
    const history = [
      record('2026-01-01T09:00:00.000Z', { dualTaskCost: 10 }),
    ];
    expect(buildClarityTrendViewModel(history)).toEqual({ status: 'no_data' });
    const enabled = buildClarityTrendViewModel(history, { includePairedTask: true });
    if (enabled.status !== 'ready') throw new Error(enabled.status);
    expect(enabled.series.map((series) => series.id)).toEqual(['dual_task']);
  });

  it('never shows population comparison, raw scores, or banned cognitive language', () => {
    const trend = buildClarityTrendViewModel([
      record('2026-01-01T09:00:00.000Z', { itemScores: steady, dualTaskCost: 10 }),
      record('2026-02-01T09:00:00.000Z', { itemScores: steady, dualTaskCost: 12 }),
      record('2026-03-01T09:00:00.000Z', { itemScores: steady, dualTaskCost: 8 }),
      record('2026-04-01T09:00:00.000Z', { itemScores: clouded, dualTaskCost: 40 }),
    ], { includePairedTask: true });
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
