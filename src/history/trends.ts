/**
 * Longitudinal trends across stored check-ups — the product's payload. Pure:
 * extracts each headline metric from the raw results, drops unmeasured points,
 * and reports first→latest change. Rise velocity (leg power) and single-leg
 * balance time are the trends that matter most (CLAUDE.md), but every age-
 * mapped metric gets one. Mobility micro-checks add a seated-reach angle trend
 * without pretending it is the full forward-reach assessment metric.
 */

import { validateCheckUpForScoring } from '../scoring/scoringInputValidation';
import { StoredCheckUp } from './serialize';

export interface TrendPoint {
  at: string; // ISO timestamp of the check-up
  value: number;
}

export interface MetricTrend {
  key: string;
  label: string;
  unit: string;
  /** True if a higher value is an improvement (reps, ROM, balance time). */
  betterIsHigher: boolean;
  points: TrendPoint[];
  /** latest − first over measured points; null if fewer than two. */
  delta: number | null;
}

type Extractor = (checkUp: StoredCheckUp['checkUp']) => number | null;

interface MetricSpec {
  key: string;
  label: string;
  unit: string;
  betterIsHigher: boolean;
  extract: Extractor;
}

function finiteOrNull(v: number | null | undefined): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

const METRICS: MetricSpec[] = [
  {
    key: 'rise-velocity',
    label: 'Rise velocity',
    unit: 'bu/s',
    betterIsHigher: true,
    extract: (c) => finiteOrNull(validateCheckUpForScoring(c).chairStand?.sessionMeanVel),
  },
  {
    key: 'chair-stands',
    label: 'Chair stands',
    unit: 'reps',
    betterIsHigher: true,
    extract: (c) => finiteOrNull(validateCheckUpForScoring(c).chairStand?.reps),
  },
  {
    key: 'single-leg-balance',
    label: 'One-leg balance',
    unit: 's',
    betterIsHigher: true,
    extract: (c) => finiteOrNull(validateCheckUpForScoring(c).balanceLadder?.singleLegEyesOpenSec),
  },
  {
    key: 'tug-time',
    label: 'Up-and-go time',
    unit: 's',
    betterIsHigher: false,
    extract: (c) => finiteOrNull(validateCheckUpForScoring(c).tug?.totalSec),
  },
  {
    key: 'shoulder-flexion',
    label: 'Shoulder reach',
    unit: '°',
    betterIsHigher: true,
    extract: (c) => finiteOrNull(validateCheckUpForScoring(c).shoulderFlexion?.peakFlexionDeg),
  },
  {
    key: 'forward-reach',
    label: 'Forward reach',
    unit: 'bu',
    betterIsHigher: false, // smaller wrist-to-floor distance is better
    extract: (c) => finiteOrNull(validateCheckUpForScoring(c).hingeReach?.reachBu),
  },
  {
    key: 'seated-reach-angle',
    label: 'Seated reach',
    unit: '°',
    betterIsHigher: false, // smaller hip angle means a deeper comfortable reach
    extract: () => null,
  },
];

/**
 * Extra trend points sourced outside the check-up (the weekly micro-check feeds
 * rise-velocity / balance / mobility points between full check-ups). Kept structural —
 * `key` matches a MetricSpec.key — so history stays decoupled from training.
 */
export interface ExtraTrendPoint {
  key: string;
  at: string;
  value: number;
}

/** Chronological trends. Records are sorted by start time; only metrics with
 * at least one measured point are returned. `extra` points (e.g. micro-checks)
 * are merged into the matching metric and re-sorted by timestamp. */
export function computeTrends(records: StoredCheckUp[], extra: ExtraTrendPoint[] = []): MetricTrend[] {
  const sorted = [...records].sort((a, b) => a.checkUp.startedAt.localeCompare(b.checkUp.startedAt));
  const trends: MetricTrend[] = [];
  for (const spec of METRICS) {
    const points: TrendPoint[] = [];
    for (const rec of sorted) {
      const value = spec.extract(rec.checkUp);
      if (value !== null) points.push({ at: rec.checkUp.startedAt, value });
    }
    for (const p of extra) {
      if (p.key === spec.key && Number.isFinite(p.value)) points.push({ at: p.at, value: p.value });
    }
    if (points.length === 0) continue;
    points.sort((a, b) => a.at.localeCompare(b.at));
    const delta = points.length >= 2 ? points[points.length - 1].value - points[0].value : null;
    trends.push({
      key: spec.key,
      label: spec.label,
      unit: spec.unit,
      betterIsHigher: spec.betterIsHigher,
      points,
      delta,
    });
  }
  return trends;
}

/** True once any metric has ≥2 measured points (a trend is showable). */
export function hasTrend(records: StoredCheckUp[]): boolean {
  return computeTrends(records).some((t) => t.points.length >= 2);
}
