/**
 * Programme engine v2 — shared data contract.
 *
 * Implements exercise-ladders-spec v0.2 §12 + onboarding-spec v0.2 §10 under
 * the 2026-07-06 implementation rulings (docs/decisions.md):
 *   - C1/C2 package deferral: the Impact finisher track, the B2 bone questions,
 *     and the osteoporosis hard gate are deferred together. v1 ships ZERO hard
 *     gates; the universal finisher is the Low-Impact/Quiet track. The profile
 *     therefore has no bone_status / impact_permission fields — they arrive as
 *     an additive schema change when impact un-defers.
 *   - C3: gateway levels are TEACH-ONLY — demo watched + logged rehearsal
 *     exposures (where a rehearsal drill exists) + a self-confirmation tap.
 *     The camera never judges form (product law).
 *   - C8: goals[] is not stored here — messaging keys on the existing LifeGoal.
 *   - C6: menopause stage lives in the existing profile enum, not here.
 *   - C10: promotion is an adherence/effort decision over REPORTED data, never
 *     a measurement. Check-up re-placement is the measured reconciliation
 *     point. Reported values never enter measurement surfaces (N5).
 *
 * Everything in this module is pure data + pure functions — no UI, no native
 * imports — and sits behind the EXPO_PUBLIC_ENABLE_PROGRAMME_ENGINE_V2 flag
 * until promoted (C4: parallel build; the existing engine keeps shipping).
 */

import type { ActivityLevel } from '../adherence';
import type { EquipmentTag } from '../movements';

// ---------------------------------------------------------------------------
// Patterns, tracks, and schemes
// ---------------------------------------------------------------------------

export const PROGRAMME_PATTERNS = ['squat', 'hinge', 'push', 'pull', 'core'] as const;
export type ProgrammePattern = (typeof PROGRAMME_PATTERNS)[number];

/** v1 ships only the quiet track (C1/C2 package deferral of Impact). */
export type FinisherTrackId = 'quiet_power';

/**
 * Prescription scheme per level (ladder spec §2). `min`..`max` is the double-
 * progression range; units follow the kind. Promotion reads these bounds.
 */
export type RepScheme =
  | { kind: 'reps'; min: number; max: number }
  | { kind: 'reps_per_side'; min: number; max: number }
  | { kind: 'seconds'; min: number; max: number }
  | { kind: 'seconds_per_side'; min: number; max: number };

/**
 * Core-ladder stimulus taxonomy. Spinal flexion is deliberately NOT a member:
 * the programme-wide flexion ban (ladder spec §7) is enforced structurally —
 * a crunch cannot even be described by this type — and re-checked by the
 * guardrail test over names/instructions.
 */
export type CoreStimulus = 'anti_extension' | 'anti_rotation' | 'anti_lateral_flexion' | 'loaded_carry';

// ---------------------------------------------------------------------------
// Exercises and levels
// ---------------------------------------------------------------------------

/**
 * One performable exercise. `id` is internal and may be technical; every
 * user-facing string comes from the naming layer (naming.ts) — never from ids
 * (ladder spec §1 naming rule, enforced by test).
 */
export interface ProgrammeExercise {
  id: string;
  equipment: readonly EquipmentTag[];
  /**
   * Needs floor space + comfort getting down. RULING 2026-07-07 (Floor: A):
   * v1 ships floor-required — no floor-avoidance routing exists; this flag
   * drives safety cues only. A floor-comfort question + substitutions are a
   * v2 candidate (re-entry: beta feedback from floor-averse users).
   */
  requiresFloor?: boolean;
  /** Uses the bottom stairs; C1 "no stairs" routing substitutes this id. */
  requiresStairs?: boolean;
  /** Substitute when has_stairs is false (onboarding spec C1). */
  noStairsAlternativeId?: string;
  /** Strictly volume-capped variation (e.g. lower-only push-ups, DOMS risk). */
  volumeCap?: { sets: number; reps: number };
}

/**
 * Teach-only gateway config (C3 ruling). Completion = demoWatched AND
 * selfConfirmed AND rehearsalExposures >= requiredRehearsalExposures.
 * Levels whose pattern has no rehearsal drill require 0 exposures.
 */
export interface GatewayConfig {
  /** Rehearsal drill practised in movement prep (e.g. the standing hinge). */
  rehearsalDrillId?: string;
  requiredRehearsalExposures: number;
}

export interface CrossLadderPrereq {
  pattern: ProgrammePattern;
  level: number;
  /** Human-readable reason kept with the rule, not in copy. */
  reason: string;
}

export interface ProgrammeLevel {
  pattern: ProgrammePattern;
  /** 1-based position in the ladder — matches the spec tables. */
  level: number;
  primary: ProgrammeExercise;
  /** Template B variation; same exercise when the spec lists none. */
  variation: ProgrammeExercise;
  sets: number;
  scheme: RepScheme;
  /** L1–L2 on every ladder: promote after ONE session at top of range. */
  isEntryLevel: boolean;
  /** Present on former [C] levels — teach-only under the C3 ruling. */
  gateway?: GatewayConfig;
  crossLadderPrereq?: CrossLadderPrereq;
  /** "slow down, fast up" applies from Squat L3 / Hinge L5 onward (spec §1). */
  powerIntentCue?: boolean;
  /** Core ladder only; structurally excludes spinal flexion. */
  coreStimulus?: CoreStimulus;
  /** Strictly capped occasional extra (Push L5 lower-only press-up, spec §5). */
  occasionalVariation?: ProgrammeExercise;
  /** One-time in-app celebration moment (e.g. first floor press-up). */
  milestone?: boolean;
}

export interface ProgrammeLadder {
  pattern: ProgrammePattern;
  levels: readonly ProgrammeLevel[];
}

// ---------------------------------------------------------------------------
// Finisher (quiet track)
// ---------------------------------------------------------------------------

export type FinisherDose =
  | { kind: 'contacts'; min: number; max: number }
  | { kind: 'sets_reps'; sets: number; min: number; max: number; perSide?: boolean }
  | { kind: 'seconds'; min: number; max: number };

export interface FinisherItem {
  id: string;
  track: FinisherTrackId;
  /** Order within the track (novelty progression, spec §9). */
  order: number;
  dose: FinisherDose;
  /** Removed when quiet routing applies (quiet_mode or pelvic routing). */
  skipOnQuietRouting?: boolean;
  requiresStairs?: boolean;
  noStairsAlternativeId?: string;
}

// ---------------------------------------------------------------------------
// Adaptation branches (ladder spec §10; osteoporosis branch deferred with B2)
// ---------------------------------------------------------------------------

export type AdaptationBranchId =
  | 'knee_sensitive'
  | 'wrist_sensitive'
  | 'balance_limited'
  | 'shoulder_sensitive'
  | 'diastasis';

export interface AdaptationBranch {
  id: AdaptationBranchId;
  /** Patterns whose pain flags trigger this branch. */
  triggerPatterns: readonly ProgrammePattern[];
  /** Structured hints the session generator consumes (Step 3). */
  modifications: readonly string[];
}

// ---------------------------------------------------------------------------
// Profile (onboarding spec §10, adjusted per rulings — see module header)
// ---------------------------------------------------------------------------

export type AssessmentStatus = 'done' | 'deferred' | 'skipped' | 'bypassed_b1';
export type PelvicRouting = 'none' | 'low_impact';
export type JointFlag = 'knee' | 'hip' | 'shoulder' | 'wrist' | 'low_back';
export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface ProgrammeProfile {
  /** UK GDPR special-category opt-in for the Stage B answers. */
  consentHealthData: boolean;
  /**
   * Reuses the existing ActivityLevel (ruling: ambiguity 3); the spec's
   * activity_prior 0–3 is derived via activityPrior(). Null = unanswered →
   * conservative prior 0.
   */
  activityLevel: ActivityLevel | null;
  /** B1 heart flag: Gentle Start preset until gpConfirmed. */
  gentleStartActive: boolean;
  gpConfirmed: boolean;
  /** B4 pelvic-floor routing (soft): quiet finisher variants + content unlock. */
  pelvicRouting: PelvicRouting;
  /** C2 noise question (preference tier). */
  quietMode: boolean;
  /** B3 joints — pre-arms matching adaptation branches from day one. */
  jointFlags: readonly JointFlag[];
  /** B5 falls/balance worry (or T1 < 10 s): support sub-variants default on. */
  balanceSupportDefault: boolean;
  /** C1 stairs question; null = unanswered → treated as no stairs (conservative). */
  hasStairs: boolean | null;
  /** Asked in-context at the Pull L4 unlock, never at onboarding. */
  hasBand: boolean | null;
  /** Set in-context at the first core demo, never at onboarding. */
  diastasisFlag: boolean;
  /** Per-pattern start levels (placement mapping §6). */
  placement: Partial<Record<ProgrammePattern, number>>;
  assessmentStatus: AssessmentStatus | null;
  /**
   * When the last applied camera assessment (Check-up #0 or a routine
   * check-up) completed — the clock the 4–6-week routine cadence reads.
   */
  lastAssessmentAtIso: string | null;
  /** D1 day picker (kept per C7; the notification opt-in is NOT built). */
  chosenDays: readonly Weekday[];
  /** The activation event — mirrored into local telemetry (ruling: ambiguity 4). */
  firstSessionStarted: boolean;
  /**
   * Once-only in-context surfaces already shown (doming check, signposts…).
   * Membership means shown-and-dismissed forever — signposts never recur.
   */
  oneTimeSurfacesShown: readonly string[];
}

// ---------------------------------------------------------------------------
// Session outcomes (input to promotion) — REPORTED data, per C10/N5
// ---------------------------------------------------------------------------

/** Spec effort answers ("Could you have done none, a few, or lots more?"). */
export type EffortAnswer = 'none' | 'a_few' | 'lots';

export interface PatternSetOutcome {
  /**
   * Reported achievement in the scheme's unit (reps or seconds). In v1 voice
   * sessions this is the confirmed/adjusted REPORTED value — never a
   * camera measurement (N5 separation).
   */
  achieved: number;
}

export interface PatternSessionOutcome {
  pattern: ProgrammePattern;
  /** Level actually performed this session. */
  levelPerformed: number;
  sets: readonly PatternSetOutcome[];
  /**
   * Effort for this exercise. v1 falls back to the session-level RPE mapped
   * via effortFromRpe() (C9 ruling); per-exercise capture arrives with the
   * queued voice slice. Null = unanswered → treated conservatively (no
   * promotion on unknown effort).
   */
  effort: EffortAnswer | null;
  painFlag: boolean;
  performedAtIso: string;
}

// ---------------------------------------------------------------------------
// Ladder state + promotion decisions
// ---------------------------------------------------------------------------

export interface GatewayProgress {
  demoWatched: boolean;
  rehearsalExposures: number;
  selfConfirmed: boolean;
}

export interface PatternLadderState {
  pattern: ProgrammePattern;
  currentLevel: number;
  /** Consecutive sessions at currentLevel with all sets at top of range. */
  consecutiveTopSessions: number;
  /** Consecutive sessions at bottom of range with effort 'none' (hold+reduce). */
  consecutiveBottomNoneSessions: number;
  /** Pain flags of the last two sessions featuring this pattern (newest last). */
  recentPainFlags: readonly boolean[];
  /** Most recent level performed pain-free — the pain-regression target. */
  lastPainFreeLevel: number | null;
  /** Keyed by level number (gateway levels only). */
  gatewayProgress: Record<number, GatewayProgress>;
  /** Hold+reduce active: bonus set withheld until top of range is rebuilt. */
  bonusSetSuspended: boolean;
  /**
   * Double progression within the level: the current per-set rep/second
   * target inside the scheme range. Null = fresh at this level (start at the
   * scheme minimum); resets on every level change.
   */
  currentRepTarget: number | null;
  lastPerformedAtIso: string | null;
}

export interface FinisherState {
  track: FinisherTrackId;
  completedSessions: number;
  /** Ground-contact budget for contact-based items (starts at 20, caps at 50). */
  currentContacts: number;
}

export interface ProgrammeState {
  profile: ProgrammeProfile;
  ladders: Record<ProgrammePattern, PatternLadderState>;
  finisher: FinisherState;
  /** Set by completeOnboarding; null = the flow has not finished on this device. */
  onboardingCompletedAtIso: string | null;
  /** Completed training sessions (drives the §8 re-offer timing). */
  completedSessionCount: number;
  /** Last completed session of any kind (drives the 14-day regression). */
  lastSessionAtIso: string | null;
  /**
   * Effort answer of the last completed session (C9: RPE-mapped). Persisted
   * so the next session's bonus-set offer survives an app restart; null when
   * the check-in was skipped (conservative: no offer).
   */
  lastSessionEffort: EffortAnswer | null;
  /** Guard so one inactivity gap regresses each ladder exactly once. */
  inactivityRegressionAppliedForGapEndingAtIso: string | null;
  /** Fingerprint of the ladder data + promotion config the state was built under. */
  policyFingerprint: string;
}

export type PromotionDecision =
  | { kind: 'hold' }
  | { kind: 'promote'; toLevel: number; reason: 'standard' | 'fast' | 'entry' }
  | {
      kind: 'promotion_locked';
      toLevel: number;
      reason: 'gateway_incomplete' | 'cross_ladder_prereq_unmet';
    }
  | { kind: 'hold_reduce' }
  | { kind: 'regress'; toLevel: number; reason: 'pain' }
  | { kind: 'not_applicable'; reason: 'level_mismatch' };

export interface PromotionEvaluation {
  nextState: PatternLadderState;
  decision: PromotionDecision;
}
