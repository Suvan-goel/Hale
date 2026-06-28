/**
 * Longitudinal trends across stored check-ups — the product's payload. Pure:
 * extracts each headline metric from the raw results, drops unmeasured points,
 * and reports first→latest change. Rise velocity (leg power) and single-leg
 * balance time are the trends that matter most (CLAUDE.md), but every age-
 * mapped metric gets one. Mobility micro-checks now reuse the full standing
 * forward-reach metric so quick checks and Movement Check-Ups speak the same
 * measurement language.
 */

import { validateCheckUpForScoring } from '../scoring/scoringInputValidation';
import {
  comparableMeasurementSeriesKey,
  descriptorForMovementMeasurement,
  normalizeCheckUpMeasurementMetadata,
  normalizeMicroCheckMeasurementMetadata,
  protocolPolicyIdForCheckUp,
  type MeasurementContext,
} from '../checkup';
import {
  BALANCE_LADDER_ID,
  CHAIR_STAND_ID,
  HINGE_REACH_ID,
  SHOULDER_FLEXION_ID,
  TUG_ID,
} from '../movements';
import { StoredCheckUp } from './serialize';

export interface TrendPoint {
  at: string; // ISO timestamp of the check-up
  value: number;
  measurementContext?: MeasurementContext;
  seriesKey?: string;
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
  deltaSuppressedReason?: 'insufficient_points' | 'insufficient_comparability';
}

type Extractor = (checkUp: StoredCheckUp['checkUp']) => number | null;

interface MetricSpec {
  key: string;
  label: string;
  unit: string;
  betterIsHigher: boolean;
  movementId: string | null;
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
    movementId: CHAIR_STAND_ID,
    extract: (c) => finiteOrNull(validateCheckUpForScoring(c).chairStand?.sessionMeanVel),
  },
  {
    key: 'chair-stands',
    label: 'Chair stands',
    unit: 'reps',
    betterIsHigher: true,
    movementId: CHAIR_STAND_ID,
    extract: (c) => finiteOrNull(validateCheckUpForScoring(c).chairStand?.reps),
  },
  {
    key: 'single-leg-balance',
    label: 'One-leg balance',
    unit: 's',
    betterIsHigher: true,
    movementId: BALANCE_LADDER_ID,
    extract: (c) => finiteOrNull(validateCheckUpForScoring(c).balanceLadder?.singleLegEyesOpenSec),
  },
  {
    key: 'tug-time',
    label: 'Up-and-go time',
    unit: 's',
    betterIsHigher: false,
    movementId: TUG_ID,
    extract: (c) => finiteOrNull(validateCheckUpForScoring(c).tug?.totalSec),
  },
  {
    key: 'shoulder-flexion',
    label: 'Shoulder reach',
    unit: '°',
    betterIsHigher: true,
    movementId: SHOULDER_FLEXION_ID,
    extract: (c) => finiteOrNull(validateCheckUpForScoring(c).shoulderFlexion?.peakFlexionDeg),
  },
  {
    key: 'forward-reach',
    label: 'Forward reach',
    unit: 'bu',
    betterIsHigher: false, // smaller wrist-to-floor distance is better
    movementId: HINGE_REACH_ID,
    extract: (c) => finiteOrNull(validateCheckUpForScoring(c).hingeReach?.reachBu),
  },
  {
    key: 'seated-reach-angle',
    label: 'Seated reach',
    unit: '°',
    betterIsHigher: false, // smaller hip angle means a deeper comfortable reach
    movementId: null,
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
  measurementContext?: MeasurementContext;
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
      const normalizedCheckUp = normalizeCheckUpMeasurementMetadata(rec.checkUp, { checkupType: rec.checkupType });
      const value = spec.extract(normalizedCheckUp);
      if (value !== null) points.push(pointForCheckUpMetric(rec, normalizedCheckUp, spec, value));
    }
    for (const p of extra) {
      if (p.key === spec.key && Number.isFinite(p.value)) points.push(pointForExtraMetric(p, spec));
    }
    if (points.length === 0) continue;
    points.sort((a, b) => a.at.localeCompare(b.at));
    const delta = comparableDelta(points);
    trends.push({
      key: spec.key,
      label: spec.label,
      unit: spec.unit,
      betterIsHigher: spec.betterIsHigher,
      points,
      delta,
      ...(delta === null && points.length >= 2 ? { deltaSuppressedReason: 'insufficient_comparability' as const } : {}),
      ...(points.length < 2 ? { deltaSuppressedReason: 'insufficient_points' as const } : {}),
    });
  }
  return trends;
}

/** True once any metric has ≥2 measured points (a trend is showable). */
export function hasTrend(records: StoredCheckUp[]): boolean {
  return computeTrends(records).some((t) => t.delta !== null);
}

function pointForCheckUpMetric(
  rec: StoredCheckUp,
  normalizedCheckUp: StoredCheckUp['checkUp'],
  spec: MetricSpec,
  value: number
): TrendPoint {
  if (!spec.movementId) return { at: rec.checkUp.startedAt, value };
  const item = normalizedCheckUp.items.find((candidate) => candidate.movementId === spec.movementId);
  const context = item?.measurementContext;
  if (!context) return { at: rec.checkUp.startedAt, value };
  const descriptor = descriptorForMovementMeasurement({
    movementId: spec.movementId,
    policyId: protocolPolicyIdForCheckUp(normalizedCheckUp),
    protocolVariant: context.protocol.protocolVariant ?? null,
  });
  const seriesKey = descriptor ? comparableMeasurementSeriesKey(context, descriptor.comparisonGroup) ?? undefined : undefined;
  return { at: rec.checkUp.startedAt, value, measurementContext: context, seriesKey };
}

function pointForExtraMetric(point: ExtraTrendPoint, spec: MetricSpec): TrendPoint {
  const context = point.measurementContext ?? fallbackMicroContextForTrendKey(point.key, point.at);
  const seriesKey = context ? comparableMeasurementSeriesKey(context, microComparisonGroup(point.key)) ?? undefined : undefined;
  return { at: point.at, value: point.value, ...(context ? { measurementContext: context } : {}), ...(seriesKey ? { seriesKey } : {}) };
}

function comparableDelta(points: readonly TrendPoint[]): number | null {
  const groups = new Map<string, TrendPoint[]>();
  for (const point of points) {
    if (!point.seriesKey) continue;
    const group = groups.get(point.seriesKey) ?? [];
    group.push(point);
    groups.set(point.seriesKey, group);
  }
  const candidates = Array.from(groups.values())
    .filter((group) => group.length >= 2)
    .sort((a, b) => b[b.length - 1].at.localeCompare(a[a.length - 1].at));
  const selected = candidates[0];
  if (!selected) return null;
  return selected[selected.length - 1].value - selected[0].value;
}

function fallbackMicroContextForTrendKey(key: string, at: string): MeasurementContext | null {
  if (key === 'rise-velocity') {
    return normalizeMicroCheckMeasurementMetadata({
      type: 'chair-power',
      startedAt: at,
    });
  }
  if (key === 'single-leg-balance') {
    return normalizeMicroCheckMeasurementMetadata({
      type: 'single-leg-balance',
      startedAt: at,
    });
  }
  if (key === 'forward-reach') {
    return normalizeMicroCheckMeasurementMetadata({
      type: 'mobility-reach',
      startedAt: at,
    });
  }
  if (key === 'seated-reach-angle') {
    return normalizeMicroCheckMeasurementMetadata({
      type: 'mobility-reach',
      startedAt: at,
    });
  }
  return null;
}

function microComparisonGroup(key: string): string {
  if (key === 'rise-velocity') return 'micro_chair_power';
  if (key === 'single-leg-balance') return 'micro_single_leg_balance';
  if (key === 'forward-reach') return 'standing_forward_reach';
  if (key === 'seated-reach-angle') return 'micro_mobility_reach';
  return 'unknown_micro_metric';
}
