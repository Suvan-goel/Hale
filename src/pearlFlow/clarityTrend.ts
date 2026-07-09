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
import { dualTaskReadingValue } from '../checkup/clarityInstruments';
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
  return officialRecords(history)
    .flatMap((record): DimensionReading[] => {
      const value = dualTaskReadingValue(record.checkUp.clarityInstruments?.dualTask);
      if (value === null) return [];
      return [
        {
          dimensionId: 'clarity',
          metricId: 'dual_task_cost_balance_v1',
          value,
          unit: 'score',
          atIso: record.checkUp.startedAt,
          basis: 'measured',
        },
      ];
    })
    .sort((a, b) => Date.parse(a.atIso) - Date.parse(b.atIso));
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
  copy: { buildingNoun: string; clearer: string; usual: string; clouded: string; support: string }
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
  const latestRelation = relativeToBand(latest.value, band);
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
  }
): ClarityTrendViewModel {
  const subjective = seriesTrend(clarityReadingsFromHistory(history), {
    buildingNoun: 'check-in',
    clearer: 'Clearer than your usual range',
    usual: 'In your usual range',
    clouded: 'More clouded than your usual range',
    support: CLARITY_DRIVERS_SUPPORT,
  });
  const dualTask = seriesTrend(dualTaskReadingsFromHistory(history), {
    buildingNoun: 'level-2 hold',
    clearer: 'Steadier under load than usual',
    usual: 'Your usual steadiness under load',
    clouded: 'Less steady under load than usual',
    support: DUAL_TASK_DRIVERS_SUPPORT,
  });

  const series: ClaritySeries[] = [];
  if (subjective.status !== 'no_data') {
    series.push({ id: 'subjective', label: 'Everyday Clarity', trend: subjective });
  }
  if (dualTask.status !== 'no_data') {
    series.push({ id: 'dual_task', label: 'Steadiness while thinking', trend: dualTask });
  }
  if (options?.includeFluency === true) {
    const fluency = seriesTrend(fluencyRelativeReadingsFromHistory(history), {
      buildingNoun: 'word-finding run',
      clearer: 'More words than your usual',
      usual: 'Your usual word-finding',
      clouded: 'Fewer words than your usual',
      support:
        'Word-finding can shift with sleep, symptom load, and stress. This measure is noisy, so only a months-long personal pattern is useful.',
    });
    if (fluency.status !== 'no_data') {
      series.push({ id: 'fluency', label: 'Word-finding', trend: fluency });
    }
  }
  if (series.length === 0) return { status: 'no_data' };

  return {
    status: 'ready',
    series,
    ...covariateContext(history, series),
    fluctuationNote: CLARITY_FLUCTUATION_NOTE,
    activityNote: CLARITY_ACTIVITY_NOTE,
  };
}

/**
 * §6.1: when a series dips AND that session's covariates show load, name her
 * own covariates — baseline-relative, mechanism-shaped, never diagnostic.
 */
function covariateContext(
  history: readonly StoredCheckUp[] | null | undefined,
  series: readonly ClaritySeries[]
): { covariateContext?: string } {
  const anyBelow = series.some(
    (entry) => entry.trend.status === 'ready' && entry.trend.latestRelation === 'below'
  );
  if (!anyBelow) return {};
  const latest = officialRecords(history)
    .slice()
    .sort((a, b) => Date.parse(a.checkUp.startedAt) - Date.parse(b.checkUp.startedAt))
    .pop();
  const covariates = latest?.checkUp.selfReport?.covariates;
  const roughSleep = covariates?.sleepQuality === 1;
  const heavySymptoms = covariates?.symptomLoad === 3;
  if (roughSleep && heavySymptoms) {
    return {
      covariateContext:
        'This dip lines up with a rough night and a heavy symptom week — clarity usually tracks sleep, symptoms, and stress.',
    };
  }
  if (roughSleep) {
    return {
      covariateContext:
        "This dip lines up with a rough night's sleep — clarity usually tracks sleep, symptoms, and stress.",
    };
  }
  if (heavySymptoms) {
    return {
      covariateContext:
        'This dip lines up with a heavy symptom week — clarity usually tracks sleep, symptoms, and stress.',
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
