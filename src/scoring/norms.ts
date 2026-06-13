/**
 * Published reference norms + the value→age inversion used to express every
 * domain as "typical of age X–Y". Norms are SEX-POOLED for V1 (the app
 * collects no profile data); ages outside each table's real coverage are
 * EXTRAPOLATED and surfaced as estimates (CLAUDE.md product law 4: no false
 * precision, label extrapolations).
 *
 * Sources are cited inline. Anchor `typical` values are the population midpoint
 * (or mean) for that age; the inversion finds the age whose typical value
 * matches the measurement, by linear interpolation between anchors. Because
 * every metric is monotonic in age, this is well-defined.
 */

export interface AgeNorm {
  metric: string;
  unit: string;
  /** True if a higher value means younger (reps, ROM); false for time (TUG). */
  betterIsHigher: boolean;
  /** Anchors sorted by age ascending; `typical` monotonic in age. */
  anchors: ReadonlyArray<{ age: number; typical: number }>;
  /** Inclusive age range backed by real data; outside ⇒ extrapolated estimate. */
  realAgeMin: number;
  realAgeMax: number;
  /** Whole table is an estimate (sparse age-specific literature). */
  estimated: boolean;
  source: string;
}

export interface AgeEstimate {
  /** Inferred movement age (years). */
  age: number;
  /** Extrapolated beyond real data, or an estimate-based norm. */
  estimated: boolean;
  /** Measurement better than the youngest anchor (clamped at the young end). */
  ceiling: boolean;
  /** Measurement worse than the oldest anchor (clamped at the old end). */
  floor: boolean;
}

/**
 * 30-second chair stand — repetitions. Rikli & Jones Senior Fitness Test
 * normal-range midpoints, sex-pooled (women/men averaged), ages 60–94:
 * Rikli RE, Jones CJ. Senior Fitness Test Manual, 2nd ed. (2013); orig.
 * Rikli & Jones, J Aging Phys Act 1999;7:129–161. Ages 45–59 are linear
 * extrapolations toward younger adults — ESTIMATES.
 */
export const CHAIR_STAND_REPS_NORM: AgeNorm = {
  metric: 'chair-stand-reps',
  unit: 'reps',
  betterIsHigher: true,
  anchors: [
    { age: 47, typical: 19 }, // estimate
    { age: 52, typical: 18 }, // estimate
    { age: 57, typical: 17 }, // estimate
    { age: 62, typical: 15.5 },
    { age: 67, typical: 14.25 },
    { age: 72, typical: 13.5 },
    { age: 77, typical: 13.25 },
    { age: 82, typical: 12 },
    { age: 87, typical: 10.75 },
    { age: 92, typical: 8.5 },
  ],
  realAgeMin: 60,
  realAgeMax: 94,
  estimated: false,
  source: 'Rikli & Jones Senior Fitness Test (1999; manual 2013), sex-pooled midpoints',
};

/**
 * Timed Up and Go — seconds. Bohannon RW. "Reference values for the TUG: a
 * descriptive meta-analysis." J Geriatr Phys Ther 2006;29(2):64–68 (means by
 * decade, 60–99). Ages <60 extrapolated toward ~7 s healthy adults — ESTIMATES.
 */
export const TUG_SECONDS_NORM: AgeNorm = {
  metric: 'tug-seconds',
  unit: 's',
  betterIsHigher: false,
  anchors: [
    { age: 50, typical: 7.0 }, // estimate
    { age: 55, typical: 7.4 }, // estimate
    { age: 65, typical: 8.1 },
    { age: 75, typical: 9.2 },
    { age: 85, typical: 11.3 },
  ],
  realAgeMin: 60,
  realAgeMax: 99,
  estimated: false,
  source: 'Bohannon, J Geriatr Phys Ther 2006;29(2):64–68 (meta-analysis means)',
};

/**
 * Shoulder flexion active ROM — degrees. Age-specific norms are sparse;
 * these are typical active-flexion values with the well-documented gradual
 * age-related decline (e.g. Norkin & White goniometry; aging-shoulder ROM
 * studies). Encoded as an ESTIMATE across all ages.
 */
export const SHOULDER_FLEXION_NORM: AgeNorm = {
  metric: 'shoulder-flexion-deg',
  unit: '°',
  betterIsHigher: true,
  anchors: [
    { age: 50, typical: 162 },
    { age: 60, typical: 158 },
    { age: 70, typical: 150 },
    { age: 80, typical: 140 },
  ],
  realAgeMin: 100, // no age range treated as "real" — whole table is an estimate
  realAgeMax: 100,
  estimated: true,
  source: 'Estimated from active shoulder-flexion ROM with age-related decline (Norkin & White; aging ROM literature)',
};

/**
 * Invert a norm: the movement age whose typical value matches `value`.
 * Robust to either monotonic direction; clamps at the table ends with
 * ceiling/floor flags so an off-the-charts-good measurement reads as young,
 * not as an error.
 */
export function inferAge(norm: AgeNorm, value: number): AgeEstimate {
  const a = norm.anchors;
  const youngest = a[0];
  const oldest = a[a.length - 1];

  const flagEstimated = (age: number): boolean =>
    norm.estimated || age < norm.realAgeMin || age > norm.realAgeMax;

  // Off the young end (better than the youngest anchor's typical).
  const betterThanYoungest = norm.betterIsHigher
    ? value >= youngest.typical
    : value <= youngest.typical;
  if (betterThanYoungest) {
    return { age: youngest.age, estimated: flagEstimated(youngest.age), ceiling: true, floor: false };
  }
  // Off the old end (worse than the oldest anchor's typical).
  const worseThanOldest = norm.betterIsHigher
    ? value <= oldest.typical
    : value >= oldest.typical;
  if (worseThanOldest) {
    return { age: oldest.age, estimated: flagEstimated(oldest.age), ceiling: false, floor: true };
  }

  // Interpolate within the bracketing anchors.
  for (let i = 0; i < a.length - 1; i++) {
    const lo = a[i].typical;
    const hi = a[i + 1].typical;
    const within = value >= Math.min(lo, hi) && value <= Math.max(lo, hi);
    if (within && lo !== hi) {
      const t = (value - lo) / (hi - lo);
      const age = a[i].age + t * (a[i + 1].age - a[i].age);
      return { age, estimated: flagEstimated(age), ceiling: false, floor: false };
    }
  }
  // Fallback (flat segment): nearest anchor age.
  return { age: youngest.age, estimated: flagEstimated(youngest.age), ceiling: false, floor: false };
}
