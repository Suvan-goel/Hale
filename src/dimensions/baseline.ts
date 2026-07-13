/**
 * Rolling personal-baseline utilities (REPOSITION_TDD §4.2/§5.4, approved
 * 2026-07-06). Dimension-generic on purpose: the subjective Clarity trend
 * consumes these first, and the future objective instruments (dual-task cost,
 * verbal fluency) must consume them UNCHANGED — nothing here may know what a
 * reading means, only when it was taken and its number.
 *
 * Scoring rules of record: baseline-relative ONLY — these utilities produce
 * "your usual range", never population comparison. Trend surfaces show
 * trajectory against the band and show fluctuation honestly (a single reading
 * is never a verdict).
 */

export type DimensionId = 'strength' | 'balance' | 'clarity';

export interface DimensionReading {
  readonly dimensionId: DimensionId;
  /** Frozen metric identity (e.g. 'clarity_items_v1' mean) — readings from
   * different metric ids must never mix in one baseline. */
  readonly metricId: string;
  readonly value: number;
  readonly unit: string;
  readonly atIso: string;
  readonly basis: 'measured' | 'self_report';
}

export interface PersonalBaselineBand {
  /** Rolling median of the window. */
  readonly median: number;
  /** "Your usual range": central spread of the window (25th–75th pct). */
  readonly low: number;
  readonly high: number;
  readonly sampleCount: number;
}

export interface RollingBaselineOptions {
  /** Most-recent readings considered (default 6 ≈ half a year of monthly check-ups). */
  readonly window?: number;
  /** Below this the person has no baseline yet — surfaces say so honestly. */
  readonly minSamples?: number;
}

const DEFAULT_WINDOW = 6;
const DEFAULT_MIN_SAMPLES = 3;

/**
 * Rolling personal baseline over the most recent `window` readings of ONE
 * metric. Returns null (no baseline yet) below `minSamples` — never a
 * fabricated band. Readings are ordered by time; mixed metric ids throw
 * (caller bug: baselines are per-metric by construction).
 */
export function rollingBaseline(
  readings: readonly DimensionReading[],
  options: RollingBaselineOptions = {}
): PersonalBaselineBand | null {
  const window = options.window ?? DEFAULT_WINDOW;
  const minSamples = options.minSamples ?? DEFAULT_MIN_SAMPLES;
  const usable = readings.filter((r) => Number.isFinite(r.value));
  if (usable.length === 0) return null;
  const metricIds = new Set(usable.map((r) => r.metricId));
  if (metricIds.size > 1) {
    throw new Error(`rollingBaseline readings mix metric ids: ${[...metricIds].join(', ')}`);
  }
  const ordered = usable
    .slice()
    .sort((a, b) => Date.parse(a.atIso) - Date.parse(b.atIso))
    .slice(-window);
  if (ordered.length < minSamples) return null;
  const values = ordered.map((r) => r.value).sort((a, b) => a - b);
  return {
    median: quantile(values, 0.5),
    low: quantile(values, 0.25),
    high: quantile(values, 0.75),
    sampleCount: values.length,
  };
}

export type BandRelation = 'below' | 'within' | 'above';

/** Where a reading sits against the personal band. */
export function relativeToBand(value: number, band: PersonalBaselineBand): BandRelation {
  if (value < band.low) return 'below';
  if (value > band.high) return 'above';
  return 'within';
}

/** Linear-interpolated quantile over pre-sorted values. */
function quantile(sorted: readonly number[], q: number): number {
  if (sorted.length === 1) return sorted[0];
  const pos = (sorted.length - 1) * q;
  const lower = Math.floor(pos);
  const upper = Math.ceil(pos);
  if (lower === upper) return sorted[lower];
  const weight = pos - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}
