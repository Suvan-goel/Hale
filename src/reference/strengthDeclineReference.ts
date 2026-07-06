/**
 * Ghost-curve strength-decline reference (REPOSITION_TDD §2.4; source supplied
 * and constraints set by the founder 2026-07-06). Admitted through the same
 * fingerprint discipline as the measurement reference sources
 * (deterministicFingerprint, DOI, data fingerprint, public-use status) but kept
 * OUT of the measurement ReferenceSourceId union on purpose: this is a
 * trajectory reference for a baseline-relative Progress visual, not a published
 * comparison claim, and must never flow through the percentile
 * claim-eligibility system.
 *
 * Design constraints of record (founder):
 * - Deliberately CONSERVATIVE (understated) — anchored at 1.0 %/yr for the
 *   45–60 band, well below the source's own ~14 %/decade knee-extensor figure,
 *   so the ghost band can never over-flatter her actual trajectory.
 * - Rendered as a SHADED BAND, never a false-precision line.
 * - Flat-conservative at launch (single band); may steepen past 60 in a later
 *   phase — recorded as a future decision, not built.
 * - Cited transparently in-app (attribution string below).
 */

import { deterministicFingerprint } from './movementProfileV2/fingerprint';

export interface StrengthDeclineReferenceDefinition {
  sourceId: 'hughes_2001_strength_decline';
  sourceVersion: number;
  title: string;
  authors: string;
  year: number;
  doi: string;
  populationSummary: string;
  statisticKind: string;
  publicUseStatus: 'approved_conservative_decline_anchor';
  /** Fraction of baseline strength lost per year (conservative anchor). */
  annualDeclineFraction: number;
  ageBandappliesFrom: number;
  ageBandAppliesTo: number;
  /** Short in-app attribution shown beneath the ghost curve. */
  attribution: string;
  sourceDataFingerprint: string;
  sourceFingerprint: string;
}

// FNV-1a of the anchor inputs; freezes the numeric anchor so a silent edit
// fails validation the same way the measurement source tables do.
const HUGHES_2001_DECLINE_DATA_FINGERPRINT = deterministicFingerprint('hughes-2001-decline-data-v1', {
  annualDeclineFraction: 0.01,
  basis: 'conservative_anchor_below_published_isokinetic_rate',
  publishedReference: '~14% per decade knee-extensor isokinetic decline',
});

function declineFingerprint(
  definition: Omit<StrengthDeclineReferenceDefinition, 'sourceFingerprint'>
): string {
  return deterministicFingerprint('strength-decline-reference-v1', definition);
}

function defineDeclineReference(
  definition: Omit<StrengthDeclineReferenceDefinition, 'sourceFingerprint'>
): StrengthDeclineReferenceDefinition {
  return { ...definition, sourceFingerprint: declineFingerprint(definition) };
}

export const STRENGTH_DECLINE_REFERENCE: StrengthDeclineReferenceDefinition = defineDeclineReference({
  sourceId: 'hughes_2001_strength_decline',
  sourceVersion: 1,
  title:
    'Longitudinal Muscle Strength Changes in Older Adults: Influence of Muscle Mass, Physical Activity, and Health',
  authors: 'Hughes VA, Frontera WR, Wood M, Evans WJ, Dallal GE, Roubenoff R, Fiatarone Singh MA',
  year: 2001,
  doi: '10.1093/gerona/56.5.B209',
  populationSummary:
    '120 adults (68 women, 52 men) followed ~9.7 years; isokinetic knee strength declined ~14% per decade.',
  statisticKind:
    'conservative annual decline anchor (1.0%/yr), deliberately understated below the published ~14%/decade rate',
  publicUseStatus: 'approved_conservative_decline_anchor',
  annualDeclineFraction: 0.01,
  ageBandappliesFrom: 45,
  ageBandAppliesTo: 60,
  attribution: 'Typical decline based on Hughes et al., J Gerontol A Biol Sci Med Sci 2001 — shown conservatively.',
  sourceDataFingerprint: HUGHES_2001_DECLINE_DATA_FINGERPRINT,
});

export type StrengthDeclineReferenceDiagnostic =
  | 'decline_reference_fingerprint_mismatch'
  | 'decline_reference_data_fingerprint_mismatch'
  | 'decline_reference_rate_not_conservative';

/**
 * Validate the reference before wiring (mirrors validateReferenceSources): the
 * fingerprints must recompute AND the anchor must stay conservative — a rate
 * at or above the published ~14%/decade (0.014/yr) would defeat the "never
 * over-flatter" constraint and fails here.
 */
export function validateStrengthDeclineReference(
  reference: StrengthDeclineReferenceDefinition = STRENGTH_DECLINE_REFERENCE
): StrengthDeclineReferenceDiagnostic[] {
  const diagnostics: StrengthDeclineReferenceDiagnostic[] = [];
  const { sourceFingerprint, ...rest } = reference;
  if (sourceFingerprint !== declineFingerprint(rest)) {
    diagnostics.push('decline_reference_fingerprint_mismatch');
  }
  if (reference.sourceDataFingerprint !== HUGHES_2001_DECLINE_DATA_FINGERPRINT) {
    diagnostics.push('decline_reference_data_fingerprint_mismatch');
  }
  if (reference.annualDeclineFraction >= 0.014) {
    diagnostics.push('decline_reference_rate_not_conservative');
  }
  return diagnostics;
}

/**
 * Fraction of the anchored baseline a typical untrained trajectory would
 * retain after `elapsedYears`, applied as flat annual decline (1 − rate·years),
 * floored at 0. Baseline itself is her own first reading — this only supplies
 * the reference slope.
 */
export function typicalRetainedFraction(
  elapsedYears: number,
  reference: StrengthDeclineReferenceDefinition = STRENGTH_DECLINE_REFERENCE
): number {
  if (elapsedYears <= 0) return 1;
  return Math.max(0, 1 - reference.annualDeclineFraction * elapsedYears);
}
