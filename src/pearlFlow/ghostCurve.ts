/**
 * Ghost curve (REPOSITION_TDD §2.4) — her strength trajectory against a
 * typical age-related decline, rendered as a SHADED BAND (never a
 * false-precision line), framed "strength kept is strength won".
 *
 * Baseline-relative by construction: everything is expressed as a percentage
 * of HER own first reading (baseline = 100%), so no population value or age
 * comparison ever appears. The band is the *typical untrained* region (a band,
 * not a line, so it reads as approximate); her actual readings sit on top.
 * Gated on ≥4 monthly readings AND the decline reference validating.
 */

import {
  STRENGTH_DECLINE_REFERENCE,
  typicalRetainedFraction,
  validateStrengthDeclineReference,
} from '../reference/strengthDeclineReference';
import type { StoredCheckUp } from '../history';

export const GHOST_CURVE_MIN_READINGS = 4;

// Half-width of the shaded band around the typical-decline slope, as a
// fraction of baseline — makes it read as a region, never a precise promise.
const BAND_HALF_WIDTH = 0.03;

export interface GhostCurvePoint {
  atIso: string;
  monthsElapsed: number;
  /** Her reading as a percentage of her baseline reading (baseline = 100). */
  percentOfBaseline: number;
  /** True when she is at or above the top of the typical-decline band. */
  aboveTypical: boolean;
}

export interface GhostCurveBandPoint {
  monthsElapsed: number;
  /** Band edges as percentage of baseline (low ≤ typical ≤ high). */
  lowPercent: number;
  highPercent: number;
}

export type GhostCurveViewModel =
  | { status: 'insufficient'; readingCount: number; needed: number }
  | { status: 'unavailable_reference' }
  | {
      status: 'ready';
      title: string;
      body: string;
      attribution: string;
      points: readonly GhostCurvePoint[];
      band: readonly GhostCurveBandPoint[];
      /** True when the latest reading sits above the typical band. */
      keepingStrength: boolean;
    };

interface StrengthReading {
  atIso: string;
  reps: number;
}

function strengthReadingsFromHistory(history: readonly StoredCheckUp[] | null | undefined): StrengthReading[] {
  return (history ?? [])
    .filter(
      (record) =>
        record.checkupType === 'baseline' ||
        record.checkupType === 'baseline_retake' ||
        record.checkupType === 'official_retest'
    )
    .flatMap((record): StrengthReading[] => {
      const raw = record.checkUp.movementProfileV2Snapshot?.interpretation.chair.rawMetric;
      if (!raw || !Number.isFinite(raw.value) || raw.value <= 0) return [];
      return [{ atIso: record.checkUp.startedAt, reps: raw.value }];
    })
    .sort((a, b) => Date.parse(a.atIso) - Date.parse(b.atIso));
}

const MS_PER_MONTH = (365.25 / 12) * 24 * 60 * 60 * 1000;

export function buildGhostCurveViewModel(
  history: readonly StoredCheckUp[] | null | undefined
): GhostCurveViewModel {
  if (validateStrengthDeclineReference().length > 0) {
    return { status: 'unavailable_reference' };
  }
  const readings = strengthReadingsFromHistory(history);
  if (readings.length < GHOST_CURVE_MIN_READINGS) {
    return { status: 'insufficient', readingCount: readings.length, needed: GHOST_CURVE_MIN_READINGS };
  }

  const baseline = readings[0];
  const baseReps = baseline.reps;
  const baseTime = Date.parse(baseline.atIso);

  const points: GhostCurvePoint[] = readings.map((reading) => {
    const monthsElapsed = (Date.parse(reading.atIso) - baseTime) / MS_PER_MONTH;
    const percentOfBaseline = (reading.reps / baseReps) * 100;
    // "Keeping strength" = at or above where typical decline sits (the band
    // midline). The band's half-width is a visual tolerance so it reads as a
    // region, not a promise — it does not move this honest threshold.
    const typicalMidPercent = typicalRetainedFraction(monthsElapsed / 12) * 100;
    return {
      atIso: reading.atIso,
      monthsElapsed,
      percentOfBaseline,
      aboveTypical: percentOfBaseline >= typicalMidPercent,
    };
  });

  const band: GhostCurveBandPoint[] = points.map((point) => {
    const retained = typicalRetainedFraction(point.monthsElapsed / 12);
    return {
      monthsElapsed: point.monthsElapsed,
      lowPercent: Math.max(0, (retained - BAND_HALF_WIDTH) * 100),
      highPercent: (retained + BAND_HALF_WIDTH) * 100,
    };
  });

  const keepingStrength = points[points.length - 1].aboveTypical;

  return {
    status: 'ready',
    title: 'Strength kept is strength won',
    body: keepingStrength
      ? 'The shaded band is where strength typically drifts without training. Your check-ups are sitting above it — that gap is the strength you have kept.'
      : 'The shaded band is where strength typically drifts without training. Keeping your check-ups steady against it is the win — every session works that gap.',
    attribution: STRENGTH_DECLINE_REFERENCE.attribution,
    points,
    band,
    keepingStrength,
  };
}
