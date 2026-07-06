/**
 * Placement mapping — onboarding-spec v0.2 §6 under the 2026-07-06 rulings.
 *
 * - T2 (push-up incline finder) is DEFERRED (ruling: ambiguity 2): push is
 *   placed by activity prior in v1, exactly like the deferred/skipped column.
 * - T3 reuses the existing 30-second chair-rise protocol; T1 reuses the
 *   existing balance protocol. Their results arrive here as plain numbers.
 * - B1 = Yes bypasses assessment entirely: every ladder starts at L1.
 * - Consent declined: activity-prior placement capped at L2, no assessment —
 *   normal tone, never Gentle Start framing (§4).
 * - Skipped/unanswered questions route to the CONSERVATIVE default (null
 *   activity level → prior 0).
 *
 * `start_level = max(1, capacity_level − 1)` — the deliberate easy start.
 */

import type { ActivityLevel } from '../adherence';
import type { ProgrammePattern } from './types';

/** Spec §10 activity_prior (0–3) derived from the existing ActivityLevel (ambiguity 3). */
export function activityPrior(level: ActivityLevel | null): 0 | 1 | 2 | 3 {
  switch (level) {
    case 'very_active':
      return 3;
    case 'moderately_active':
      return 2;
    case 'lightly_active':
      return 1;
    case 'very_inactive':
    case null:
      return 0;
  }
}

export interface AssessmentInputs {
  /** T3 — 30-second sit-to-stand (existing chair-rise protocol). */
  t3?: { reps: number; handsUsed: boolean };
  /** T1 — single-leg stand, worse side, seconds (existing balance protocol). */
  t1?: { worseSideSeconds: number };
}

export interface PlacementInputs {
  assessment: AssessmentInputs | null;
  activityLevel: ActivityLevel | null;
  consentDeclined: boolean;
  /** B1 heart flag — Gentle Start: everything at L1, assessment bypassed. */
  gentleStart: boolean;
}

export interface PlacementResult {
  placement: Record<ProgrammePattern, number>;
  /**
   * T1 < 10 s forces balance-support-default on even when B5 was No.
   * Null when T1 was not performed. (T1 > 30 s recorded for the future
   * single-leg finisher offers — inert in v1 while impact is deferred.)
   */
  balanceSupportRequired: boolean | null;
  /** Ground-contact starting budget for the finisher (spec §6). */
  finisherContacts: number;
}

/** T3 mapping table (onboarding spec §5): capacity level before the −1 easy start. */
export function squatCapacityFromT3(t3: { reps: number; handsUsed: boolean }): number {
  if (t3.handsUsed || t3.reps < 8) return 1;
  if (t3.reps <= 11) return 2;
  if (t3.reps <= 15) return 3;
  return 4;
}

export function placementForOnboarding(inputs: PlacementInputs): PlacementResult {
  const prior = activityPrior(inputs.activityLevel);

  if (inputs.gentleStart) {
    // B1 = Yes: max-effort testing contradicts the flag; L1 regardless.
    return {
      placement: { squat: 1, hinge: 1, push: 1, pull: 1, core: 1 },
      balanceSupportRequired: null,
      finisherContacts: 20,
    };
  }

  const cap = inputs.consentDeclined ? 2 : Number.POSITIVE_INFINITY;
  const capped = (level: number) => Math.min(level, cap);

  // Deferred / skipped / declined columns (§6). T2 deferred → push always
  // places by activity prior in v1.
  const placement: Record<ProgrammePattern, number> = {
    squat: capped(prior >= 2 ? 2 : 1),
    push: capped(prior >= 2 ? 2 : 1),
    hinge: capped(prior === 3 ? 2 : 1),
    pull: capped(prior >= 2 ? 2 : 1),
    core: capped(prior <= 1 ? 1 : prior === 2 ? 2 : 3),
  };

  let balanceSupportRequired: boolean | null = null;
  const assessment = inputs.consentDeclined ? null : inputs.assessment;
  if (assessment?.t3) {
    // Measured squat capacity, then the deliberate easy start (−1, floor 1).
    placement.squat = capped(Math.max(1, squatCapacityFromT3(assessment.t3) - 1));
  }
  if (assessment?.t1) {
    balanceSupportRequired = assessment.t1.worseSideSeconds < 10;
  }

  return { placement, balanceSupportRequired, finisherContacts: 20 };
}
