/**
 * Clarity trend view model (REPOSITION_TDD §5.4) — the subjective dimension's
 * own surface, behind the clarity flag. Baseline-relative ONLY: readings are
 * compared with HER rolling "usual range", never population values, never age,
 * and never a raw score in isolation (relations and trajectory, not numbers).
 * A clouded reading is never bare — it carries the known drivers (sleep,
 * symptom load, stress) and the trainable path. Fluctuation is stated
 * honestly on every render. Self-reported tracking; never "validated".
 *
 * Clarity NEVER folds into any composite/headline result (registry rule of
 * record) — this surface is its only home.
 */

import { clarityReadingValue } from '../checkup/selfReport';
import {
  relativeToBand,
  rollingBaseline,
  type BandRelation,
  type DimensionReading,
  type PersonalBaselineBand,
} from '../dimensions';
import type { StoredCheckUp } from '../history';

export const CLARITY_FLUCTUATION_NOTE =
  'Check-ins fluctuate — sleep, symptom load, and stress all show up here. The trend over months is what matters, never one reading.';

const CLARITY_DRIVERS_SUPPORT =
  'Clouded stretches often track with sleep, symptom load, and stress — and the same training that rebuilds strength supports all three. Keep going; next month adds the fuller picture.';

export interface ClarityTrendEntry {
  dateLabel: string;
  atIso: string;
  /** Baseline-relative wording, never a bare number. */
  relationLabel: string;
}

export type ClarityTrendViewModel =
  | { status: 'no_data' }
  | {
      status: 'building';
      checkInCount: number;
      entries: readonly ClarityTrendEntry[];
      body: string;
      fluctuationNote: string;
    }
  | {
      status: 'ready';
      checkInCount: number;
      entries: readonly ClarityTrendEntry[];
      latestRelation: BandRelation;
      headline: string;
      /** Present exactly when latestRelation is 'below' (worse never bare). */
      supportCopy?: string;
      fluctuationNote: string;
    };

export function clarityReadingsFromHistory(
  history: readonly StoredCheckUp[] | null | undefined
): DimensionReading[] {
  return (history ?? [])
    .filter(
      (record) =>
        record.checkupType === 'baseline' ||
        record.checkupType === 'baseline_retake' ||
        record.checkupType === 'official_retest'
    )
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

export function buildClarityTrendViewModel(
  history: readonly StoredCheckUp[] | null | undefined
): ClarityTrendViewModel {
  const readings = clarityReadingsFromHistory(history);
  if (readings.length === 0) return { status: 'no_data' };

  // Her usual range is built from everything BEFORE the latest check-in, so
  // the newest reading is read against her established baseline, not itself.
  const prior = readings.slice(0, -1);
  const band = rollingBaseline(prior);
  if (!band) {
    return {
      status: 'building',
      checkInCount: readings.length,
      entries: readings.map((reading) => buildingEntry(reading)),
      body:
        readings.length === 1
          ? 'Your first check-in is saved. A few more monthly check-ups build your own baseline.'
          : `${readings.length} check-ins saved. A few more build your own baseline.`,
      fluctuationNote: CLARITY_FLUCTUATION_NOTE,
    };
  }

  const latest = readings[readings.length - 1];
  const latestRelation = relativeToBand(latest.value, band);
  return {
    status: 'ready',
    checkInCount: readings.length,
    entries: readings.map((reading, index) =>
      index < prior.length
        ? buildingEntry(reading)
        : { dateLabel: dateLabel(reading.atIso), atIso: reading.atIso, relationLabel: relationLabel(latestRelation) }
    ),
    latestRelation,
    headline:
      latestRelation === 'above'
        ? 'Clearer than your usual range this month.'
        : latestRelation === 'below'
          ? 'More clouded than your usual range this month.'
          : 'In your usual range this month.',
    ...(latestRelation === 'below' ? { supportCopy: CLARITY_DRIVERS_SUPPORT } : {}),
    fluctuationNote: CLARITY_FLUCTUATION_NOTE,
  };
}

function buildingEntry(reading: DimensionReading): ClarityTrendEntry {
  return {
    dateLabel: dateLabel(reading.atIso),
    atIso: reading.atIso,
    relationLabel: 'Saved',
  };
}

function relationLabel(relation: BandRelation): string {
  if (relation === 'above') return 'Clearer than usual';
  if (relation === 'below') return 'More clouded than usual';
  return 'In your usual range';
}

function dateLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Check-in';
  return new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(date);
}
