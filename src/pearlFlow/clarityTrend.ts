/**
 * Clarity trend view model (REPOSITION_TDD §5.4; multi-series per
 * CLARITY_INSTRUMENTS_TDD §6.1, DT3) — the dimension's own surface, behind
 * the clarity flag. One row per active MVP series (Everyday Clarity check-in
 * and paired-task steadiness), each read against HER
 * OWN rolling "usual range" — never population values, never age, never a raw
 * score in isolation. Series are NEVER fused into a single Clarity number in
 * beta (mini-composite — deferred recorded decision). A clouded reading is
 * never bare: known sources of day-to-day variation (sleep, symptom load,
 * stress) ride every below-band row, and the covariate context line names HER
 * OWN covariates when they line up. Fluctuation and programme isolation are
 * stated honestly on every render. Self-reported tracking; never "validated".
 */

import { clarityReadingValue } from '../checkup/selfReport';
import {
  pairedClarityReadingValue,
  type PairedClarityResultRecord,
} from '../checkup/clarityInstruments';
import {
  relativeToBand,
  rollingBaseline,
  type BandRelation,
  type DimensionReading,
} from '../dimensions';
import type { StoredCheckUp } from '../history';

export const CLARITY_FLUCTUATION_NOTE =
  'Check-ins fluctuate — sleep, symptom load, and stress all show up here. The trend over months is what matters, never one reading.';

export const CLARITY_ACTIVITY_NOTE =
  'Regular physical activity supports brain health. These personal signals are for tracking only and never change your training plan.';

const CLARITY_DRIVERS_SUPPORT =
  'One cloudier check-in can line up with sleep, symptom load, or stress. Keep tracking monthly; this signal never changes your programme.';

const DUAL_TASK_DRIVERS_SUPPORT =
  'One less-steady hold can line up with sleep, symptom load, or stress. Keep tracking monthly; this signal never changes your programme.';

export type ClaritySeriesId = 'subjective' | 'dual_task' | 'fluency';

export interface ClarityTrendEntry {
  dateLabel: string;
  atIso: string;
  /** Baseline-relative wording, never a bare number. */
  relationLabel: string;
}

export type ClaritySeriesTrend =
  | { status: 'no_data' }
  | {
      status: 'building';
      checkInCount: number;
      entries: readonly ClarityTrendEntry[];
      body: string;
    }
  | {
      status: 'ready';
      checkInCount: number;
      entries: readonly ClarityTrendEntry[];
      latestRelation: BandRelation;
      headline: string;
      /** Present exactly when latestRelation is 'below' (worse never bare). */
      supportCopy?: string;
    };

export interface ClaritySeries {
  id: ClaritySeriesId;
  label: string;
  trend: ClaritySeriesTrend;
}

export type ClarityTrendViewModel =
  | { status: 'no_data' }
  | {
      status: 'ready';
      series: readonly ClaritySeries[];
      /** Her own covariates, when a dip lines up with them (§6.1). */
      covariateContext?: string;
      fluctuationNote: string;
      activityNote: string;
    };

function officialRecords(history: readonly StoredCheckUp[] | null | undefined): StoredCheckUp[] {
  return (history ?? []).filter(
    (record) =>
      record.checkupType === 'baseline' ||
      record.checkupType === 'baseline_retake' ||
      record.checkupType === 'official_retest'
  );
}

export function clarityReadingsFromHistory(
  history: readonly StoredCheckUp[] | null | undefined
): DimensionReading[] {
  return officialRecords(history)
    .flatMap((record): DimensionReading[] => {
      const value = clarityReadingValue(record.checkUp.selfReport);
      if (value === null) return [];
      return [
        {
          dimensionId: 'clarity',
          metricId: record.checkUp.selfReport?.clarity?.itemSetId ?? 'clarity_items_v1',
          value,
          unit: 'score',
          atIso: record.checkUp.startedAt,
          basis: 'self_report',
        },
      ];
    })
    .sort((a, b) => Date.parse(a.atIso) - Date.parse(b.atIso));
}

export function dualTaskReadingsFromHistory(
  history: readonly StoredCheckUp[] | null | undefined
): DimensionReading[] {
  const readings = officialRecords(history)
    .flatMap((record): DimensionReading[] => {
      // Legacy VAD-only dualTask records are intentionally quarantined: they
      // did not include the current matched-pair correctness gate.
      const pairedTask = record.checkUp.clarityInstruments?.pairedTask;
      if (!pairedTask) return [];
      const value = pairedClarityReadingValue(pairedTask);
      if (value === null) return [];
      return [
        {
          dimensionId: 'clarity',
          metricId: pairedClarityMetricId(pairedTask),
          value,
          unit: 'score',
          atIso: record.checkUp.startedAt,
          basis: 'measured',
        },
      ];
    })
    .sort((a, b) => Date.parse(a.atIso) - Date.parse(b.atIso));
  const latestMetricId = readings[readings.length - 1]?.metricId;
  return latestMetricId
    ? readings.filter((reading) => reading.metricId === latestMetricId)
    : [];
}

/**
 * Internal series identity. Every frozen pair and response parameter is part
 * of the key, including standing side and form, so protocol changes restart a
 * personal baseline instead of silently mixing unlike measurements.
 */
export function pairedClarityMetricId(result: PairedClarityResultRecord): string {
  const pair = result.protocol;
  const response = result.responseProtocol;
  const policy = pair.validityPolicy;
  return `paired_clarity_motor_cost_v1:${JSON.stringify([
    pair.protocolId,
    pair.protocolVersion,
    pair.movementId,
    pair.stanceId,
    pair.standingSide,
    pair.order,
    pair.trialCapMs,
    pair.standardizedRestMs,
    pair.liftConfirmMs,
    pair.touchdownDebounceFrames,
    pair.trackingLossConfirmFrames,
    policy.minSoloHoldMs,
    policy.ceilingExclusionMarginMs,
    policy.minCognitiveAttempts,
    policy.minCognitiveResponses,
    policy.minCognitiveAccuracy,
    response.protocolId,
    response.protocolVersion,
    response.sequenceAlgorithmId,
    response.sequenceSeedId,
    response.responseSignal,
    response.responseRule,
    response.leadInMs,
    response.promptVisibleMs,
    response.responseWindowMs,
    response.promptCadenceMs,
    response.promptCount,
    response.minimumPresentedCount,
  ])}`;
}

/**
 * Fluency, normalized within category (CLARITY_INSTRUMENTS_TDD §5 scoring;
 * F3): raw counts NEVER cross categories — each measured run is expressed
 * relative to that category's own anchor (rolling median of her PRIOR runs in
 * the same category, starting from the first encounter). A category's first
 * encounter therefore produces no trend point — it establishes the anchor —
 * which is exactly the approved month-5 onset. The resulting
 * `fluency_relative_v1` values (100 = her category anchor) are comparable
 * across months and feed one honest series.
 */
export function fluencyRelativeReadingsFromHistory(
  history: readonly StoredCheckUp[] | null | undefined
): DimensionReading[] {
  const measured = officialRecords(history)
    .flatMap((record) => {
      const fluency = record.checkUp.clarityInstruments?.fluency;
      return fluency && fluency.status === 'measured' && typeof fluency.validWordCount === 'number'
        ? [{ atIso: record.checkUp.startedAt, categoryId: fluency.categoryId, count: fluency.validWordCount }]
        : [];
    })
    .sort((a, b) => Date.parse(a.atIso) - Date.parse(b.atIso));

  const priorByCategory = new Map<string, DimensionReading[]>();
  const relative: DimensionReading[] = [];
  for (const run of measured) {
    const prior = priorByCategory.get(run.categoryId) ?? [];
    const anchor = rollingBaseline(prior, { minSamples: 1 });
    if (anchor && anchor.median > 0) {
      relative.push({
        dimensionId: 'clarity',
        metricId: 'fluency_relative_v1',
        value: (run.count / anchor.median) * 100,
        unit: 'percent_of_anchor',
        atIso: run.atIso,
        basis: 'measured',
      });
    }
    priorByCategory.set(run.categoryId, [
      ...prior,
      {
        dimensionId: 'clarity',
        metricId: `fluency_${run.categoryId}_v1`,
        value: run.count,
        unit: 'words',
        atIso: run.atIso,
        basis: 'measured',
      },
    ]);
  }
  return relative;
}

function seriesTrend(
  readings: readonly DimensionReading[],
  copy: {
    buildingNoun: string;
    clearer: string;
    usual: string;
    clouded: string;
    support: string;
    /** Small changes inside this margin remain "usual", even with a flat IQR. */
    minimumMeaningfulDelta: number;
  }
): ClaritySeriesTrend {
  if (readings.length === 0) return { status: 'no_data' };
  // Her usual range is built from everything BEFORE the latest reading, so
  // the newest is read against her established baseline, not itself.
  const prior = readings.slice(0, -1);
  const band = rollingBaseline(prior);
  if (!band) {
    return {
      status: 'building',
      checkInCount: readings.length,
      entries: readings.map((reading) => savedEntry(reading)),
      body:
        readings.length === 1
          ? `Your first ${copy.buildingNoun} is saved. A few more monthly check-ups build your own baseline.`
          : `${readings.length} saved. A few more build your own baseline.`,
    };
  }
  const latest = readings[readings.length - 1];
  const latestRelation = relativeToBandWithNoiseFloor(
    latest.value,
    band,
    copy.minimumMeaningfulDelta
  );
  const relationLabel =
    latestRelation === 'above' ? copy.clearer : latestRelation === 'below' ? copy.clouded : copy.usual;
  return {
    status: 'ready',
    checkInCount: readings.length,
    entries: readings.map((reading, index) =>
      index < prior.length
        ? savedEntry(reading)
        : { dateLabel: dateLabel(reading.atIso), atIso: reading.atIso, relationLabel }
    ),
    latestRelation,
    headline: `${relationLabel} this month.`,
    ...(latestRelation === 'below' ? { supportCopy: copy.support } : {}),
  };
}

export function buildClarityTrendViewModel(
  history: readonly StoredCheckUp[] | null | undefined,
  options?: {
    /** Legacy/development inspection only. Fluency is not an MVP surface. */
    includeFluency?: boolean;
    /** Release-gated until the real-device paired-task validity review passes. */
    includePairedTask?: boolean;
    /**
     * Production authority: only check-ups accepted as 12-week journey
     * checkpoints may contribute. Omit only for legacy/dev inspection.
     */
    acceptedSourceCheckUpIds?: readonly string[];
  }
): ClarityTrendViewModel {
  const scopedHistory = options?.acceptedSourceCheckUpIds
    ? (history ?? []).filter((record) =>
        options.acceptedSourceCheckUpIds?.includes(record.checkUp.startedAt)
      )
    : history;
  const subjective = seriesTrend(clarityReadingsFromHistory(scopedHistory), {
    buildingNoun: 'check-in',
    clearer: 'Clearer than your usual range',
    usual: 'In your usual range',
    clouded: 'More clouded than your usual range',
    support: CLARITY_DRIVERS_SUPPORT,
    // One point on one of five response items moves the mean by 0.2; do not
    // turn that smallest possible change into a directional claim.
    minimumMeaningfulDelta: 0.2,
  });
  const dualTask = seriesTrend(dualTaskReadingsFromHistory(scopedHistory), {
    buildingNoun: 'level-2 hold',
    clearer: 'Steadier under load than usual',
    usual: 'Your usual steadiness under load',
    clouded: 'Less steady under load than usual',
    support: DUAL_TASK_DRIVERS_SUPPORT,
    // Objective paired-task series remains gated; this conservative margin
    // also prevents tiny setup/timing variation from becoming a trend claim.
    minimumMeaningfulDelta: 5,
  });

  const series: ClaritySeries[] = [];
  if (subjective.status !== 'no_data') {
    series.push({ id: 'subjective', label: 'Everyday Clarity', trend: subjective });
  }
  if (options?.includePairedTask === true && dualTask.status !== 'no_data') {
    series.push({ id: 'dual_task', label: 'Steadiness while thinking', trend: dualTask });
  }
  if (options?.includeFluency === true) {
    const fluency = seriesTrend(fluencyRelativeReadingsFromHistory(scopedHistory), {
      buildingNoun: 'word-finding run',
      clearer: 'More words than your usual',
      usual: 'Your usual word-finding',
      clouded: 'Fewer words than your usual',
      support:
        'Word-finding can shift with sleep, symptom load, and stress. This measure is noisy, so only a months-long personal pattern is useful.',
      minimumMeaningfulDelta: 5,
    });
    if (fluency.status !== 'no_data') {
      series.push({ id: 'fluency', label: 'Word-finding', trend: fluency });
    }
  }
  if (series.length === 0) return { status: 'no_data' };

  return {
    status: 'ready',
    series,
    ...covariateContext(scopedHistory, series),
    fluctuationNote: CLARITY_FLUCTUATION_NOTE,
    activityNote: CLARITY_ACTIVITY_NOTE,
  };
}

function relativeToBandWithNoiseFloor(
  value: number,
  band: Parameters<typeof relativeToBand>[1],
  minimumMeaningfulDelta: number
): BandRelation {
  const relation = relativeToBand(value, band);
  const epsilon = 1e-9;
  if (
    relation === 'below' &&
    band.low - value <= minimumMeaningfulDelta + epsilon
  ) {
    return 'within';
  }
  if (
    relation === 'above' &&
    value - band.high <= minimumMeaningfulDelta + epsilon
  ) {
    return 'within';
  }
  return relation;
}

/**
 * §6.1: when a series dips AND that session's covariates show load, name her
 * own covariates — baseline-relative, mechanism-shaped, never diagnostic.
 */
function covariateContext(
  history: readonly StoredCheckUp[] | null | undefined,
  series: readonly ClaritySeries[]
): { covariateContext?: string } {
  // Series can have different endpoints (for example, a skipped subjective
  // check-in after the last comparable subjective reading). Bind context to
  // the actual latest below-series entry, never merely to the newest official
  // record in history.
  const belowReadingAt = series
    .flatMap((entry) => {
      if (entry.trend.status !== 'ready' || entry.trend.latestRelation !== 'below') return [];
      const latestEntry = entry.trend.entries[entry.trend.entries.length - 1];
      return latestEntry ? [latestEntry.atIso] : [];
    })
    .sort((a, b) => Date.parse(a) - Date.parse(b))
    .pop();
  if (!belowReadingAt) return {};
  const matchingRecord = officialRecords(history).find(
    (record) => record.checkUp.startedAt === belowReadingAt
  );
  const covariates = matchingRecord?.checkUp.selfReport?.covariates;
  const roughSleep = covariates?.sleepQuality === 1;
  const heavySymptoms = covariates?.symptomLoad === 3;
  if (roughSleep && heavySymptoms) {
    return {
      covariateContext:
        'Alongside this reading, you also logged a rough night and a heavy symptom week. Clarity can vary alongside sleep, symptoms, and stress; this does not establish a cause.',
    };
  }
  if (roughSleep) {
    return {
      covariateContext:
        "Alongside this reading, you also logged a rough night's sleep. Clarity can vary alongside sleep and stress; this does not establish a cause.",
    };
  }
  if (heavySymptoms) {
    return {
      covariateContext:
        'Alongside this reading, you also logged a heavy symptom week. Clarity can vary alongside symptoms and stress; this does not establish a cause.',
    };
  }
  return {};
}

function savedEntry(reading: DimensionReading): ClarityTrendEntry {
  return {
    dateLabel: dateLabel(reading.atIso),
    atIso: reading.atIso,
    relationLabel: 'Saved',
  };
}

function dateLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Check-in';
  return new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(date);
}
