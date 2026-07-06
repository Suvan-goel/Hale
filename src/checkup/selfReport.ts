/**
 * Clarity self-report appendix to the monthly check-up (REPOSITION_TDD §5,
 * approved; item wording FINAL per founder clinical review 2026-07-06).
 *
 * Rules of record:
 * - ORIGINAL items, written fresh — not drawn from any published instrument.
 *   Self-reported tracking only; the word "validated" is banned on these
 *   surfaces (CLARITY_SELF_REPORT_COPY_FILES fence).
 * - Monthly cadence: the check-in rides ONLY the official check-up ritual
 *   (baseline / retake / official retest) — no between-check-up density in v1.
 * - Raw item scores are fog-direction (higher = more fog) and persist
 *   unaggregated; the trend reading INVERTS them (higher = clearer) so the
 *   Clarity trend is trainable and reads like every other dimension.
 * - Baseline-relative ONLY: never population percentiles, never age
 *   comparisons, never a raw score shown bare — a low reading is always
 *   paired with the known drivers (sleep, symptom load, stress).
 * - F8 (flagged in the TDD, enforced by test): this block NEVER affects
 *   protocol evidence, claim eligibility, or any measurement surface —
 *   skipping it can never downgrade a result.
 * - The five items save together or not at all: partial answers would break
 *   month-to-month comparability of the item-set metric.
 */

export const CLARITY_ITEM_SET_ID = 'clarity_items_v1' as const;
export const CHECKUP_SELF_REPORT_SCHEMA_VERSION = 1 as const;

/** Recall framing shown above the items. */
export const CLARITY_RECALL_PERIOD_LABEL = 'Over the past two weeks…';

export const CLARITY_ITEMS: readonly { id: string; text: string }[] = [
  {
    id: 'word_finding',
    text: "Have you had trouble finding the right word when you're speaking?",
  },
  {
    id: 'purpose_lapse',
    text: 'Have you walked into a room or opened an app and forgotten why?',
  },
  {
    id: 'concentration',
    text: 'Has it felt harder than usual to concentrate on one thing?',
  },
  {
    id: 'mental_fatigue',
    text: 'Have you felt mentally tired or "foggy," even when rested?',
  },
  {
    id: 'everyday_tracking',
    text: 'Have you had to work harder than before to keep track of everyday things (names, plans, where you put things)?',
  },
];

export type ClarityItemScore = 0 | 1 | 2 | 3 | 4;

export const CLARITY_SCALE: readonly { value: ClarityItemScore; label: string }[] = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Slightly' },
  { value: 2, label: 'Moderately' },
  { value: 3, label: 'Quite a bit' },
  { value: 4, label: 'A great deal' },
];

export type SleepQuality = 1 | 2 | 3;
export const SLEEP_QUALITY_OPTIONS: readonly { value: SleepQuality; label: string }[] = [
  { value: 1, label: 'Poorly' },
  { value: 2, label: 'OK' },
  { value: 3, label: 'Well' },
];

export type SymptomLoad = 1 | 2 | 3 | 'prefer_not_to_say';
export const SYMPTOM_LOAD_OPTIONS: readonly { value: SymptomLoad; label: string }[] = [
  { value: 1, label: 'Light' },
  { value: 2, label: 'Moderate' },
  { value: 3, label: 'Heavy' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export interface CheckUpSelfReport {
  schemaVersion: typeof CHECKUP_SELF_REPORT_SCHEMA_VERSION;
  /** Present only when all five items were answered (all-or-nothing). */
  clarity?: {
    /** Frozen wording-set identity — a future item revision must mint a new
     * id so readings from different wordings never mix in one baseline. */
    itemSetId: typeof CLARITY_ITEM_SET_ID;
    /** Fog-direction raw scores, one per CLARITY_ITEMS entry, in order. */
    itemScores: readonly ClarityItemScore[];
  };
  covariates?: {
    /** Prior-night sleep quality, one tap. */
    sleepQuality?: SleepQuality;
    /** Optional symptom-load context (female reference group only). */
    symptomLoad?: SymptomLoad;
  };
}

/**
 * The Clarity trend value for one check-in: inverted item mean, so higher =
 * clearer (trainable direction). Null unless the item set is complete.
 */
export function clarityReadingValue(selfReport: CheckUpSelfReport | undefined): number | null {
  const scores = selfReport?.clarity?.itemScores;
  if (!scores || scores.length !== CLARITY_ITEMS.length) return null;
  const mean = scores.reduce((sum: number, score) => sum + score, 0) / scores.length;
  return 4 - mean;
}

/** Time-of-day covariate: derived, never stored (startedAt already carries it). */
export function checkUpLocalHour(startedAtIso: string): number | null {
  const date = new Date(startedAtIso);
  return Number.isNaN(date.getTime()) ? null : date.getHours();
}

function isClarityItemScore(value: unknown): value is ClarityItemScore {
  return value === 0 || value === 1 || value === 2 || value === 3 || value === 4;
}

/**
 * Defensive boundary parse (serialize/migrate): anything malformed drops to
 * undefined — a corrupt self-report must never block or alter the measurement
 * record it rides on.
 */
export function validCheckUpSelfReport(value: unknown): CheckUpSelfReport | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as Partial<CheckUpSelfReport>;
  if (raw.schemaVersion !== CHECKUP_SELF_REPORT_SCHEMA_VERSION) return undefined;

  let clarity: CheckUpSelfReport['clarity'];
  const rawClarity = raw.clarity;
  if (
    rawClarity &&
    typeof rawClarity === 'object' &&
    rawClarity.itemSetId === CLARITY_ITEM_SET_ID &&
    Array.isArray(rawClarity.itemScores) &&
    rawClarity.itemScores.length === CLARITY_ITEMS.length &&
    rawClarity.itemScores.every(isClarityItemScore)
  ) {
    clarity = { itemSetId: CLARITY_ITEM_SET_ID, itemScores: [...rawClarity.itemScores] };
  }

  let covariates: CheckUpSelfReport['covariates'];
  const rawCovariates = raw.covariates;
  if (rawCovariates && typeof rawCovariates === 'object') {
    const sleepQuality =
      rawCovariates.sleepQuality === 1 || rawCovariates.sleepQuality === 2 || rawCovariates.sleepQuality === 3
        ? rawCovariates.sleepQuality
        : undefined;
    const symptomLoad =
      rawCovariates.symptomLoad === 1 ||
      rawCovariates.symptomLoad === 2 ||
      rawCovariates.symptomLoad === 3 ||
      rawCovariates.symptomLoad === 'prefer_not_to_say'
        ? rawCovariates.symptomLoad
        : undefined;
    if (sleepQuality !== undefined || symptomLoad !== undefined) {
      covariates = {
        ...(sleepQuality !== undefined ? { sleepQuality } : {}),
        ...(symptomLoad !== undefined ? { symptomLoad } : {}),
      };
    }
  }

  if (!clarity && !covariates) return undefined;
  return {
    schemaVersion: CHECKUP_SELF_REPORT_SCHEMA_VERSION,
    ...(clarity ? { clarity } : {}),
    ...(covariates ? { covariates } : {}),
  };
}
