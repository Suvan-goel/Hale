/**
 * Device profile + app preferences. A deliberately narrow non-health
 * projection can sync to the user's private Supabase profile; the complete
 * object remains the local authority used by the app.
 */

import type { AgeBand, LifeGoal, MovementSafetyProfile } from '../adherence';

export type ProfileReferenceSex = 'female' | 'male';

/**
 * Where the user is in the menopause transition (2026-07-05 repositioning;
 * taxonomy finalized 2026-07-06, F2: peri / meno / post / not sure / prefer
 * not to say). Copy tone and content selection ONLY — never scoring. Published
 * comparisons stay keyed to age + referenceSex; no reference source is
 * stage-stratified.
 *
 * 'neither_or_unsure' is the stored token behind the "Not sure" label (kept so
 * v9 records parse unchanged). Rules of record: "Not sure" is a first-class
 * answer treated as a personalization signal (gentle educational content
 * leads — see the programme onboarding adapter) and is NEVER re-asked or nagged about;
 * 'prefer_not_to_say' is an explicit stored decline (F1) — required-before-
 * Continue is satisfied by it, and null never masquerades as answered.
 */
export type MenopauseStage =
  | 'perimenopausal'
  | 'menopausal'
  | 'postmenopausal'
  /**
   * v11 (2026-07-06, C6 ruling): menopause after surgery or medical treatment
   * — the onboarding-spec A2 addition, reconciled ADDITIVELY onto the pinned
   * F2 taxonomy (repo enum wins; the spec's omission of a mid "menopause"
   * state was a gap, not a decision). Tailors education content and adds one
   * gentle bone-health GP nudge; copy/content only, never scoring.
   */
  | 'surgical_medical'
  | 'neither_or_unsure'
  | 'prefer_not_to_say';

/** Display options for the stage question (onboarding safety setup + Settings). */
export const MENOPAUSE_STAGE_OPTIONS: readonly { value: MenopauseStage; label: string }[] = [
  { value: 'perimenopausal', label: 'Perimenopause' },
  { value: 'menopausal', label: 'Menopause' },
  { value: 'postmenopausal', label: 'Post-menopause' },
  { value: 'surgical_medical', label: 'Menopause after surgery or medical treatment' },
  { value: 'neither_or_unsure', label: 'Not sure' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

/**
 * Light symptom picture (REPOSITION_TDD §2.1, approved 2026-07-06). Optional
 * and skippable — null means not answered and is never chased. Used for
 * personalisation context and (later) check-up covariates ONLY: never
 * scoring, never diagnosis-flavoured output.
 */
export type MenopauseSymptom =
  | 'sleep_disruption'
  | 'hot_flushes'
  | 'joint_aches'
  | 'low_mood'
  | 'brain_fog';

export type MenopauseSymptomPicture =
  | { kind: 'selected'; symptoms: readonly MenopauseSymptom[] }
  | { kind: 'none_of_these' }
  | { kind: 'prefer_not_to_say' };

export const MENOPAUSE_SYMPTOM_OPTIONS: readonly { value: MenopauseSymptom; label: string }[] = [
  { value: 'sleep_disruption', label: 'Disrupted sleep' },
  { value: 'hot_flushes', label: 'Hot flushes' },
  { value: 'joint_aches', label: 'Joint aches' },
  { value: 'low_mood', label: 'Low mood' },
  { value: 'brain_fog', label: 'Brain fog' },
];

/** A single person on this device. All fields optional until the user fills them in. */
export interface UserProfile {
  /** Display name shown on Home; '' when unset. */
  name: string;
  /** Local calendar date of birth, stored as YYYY-MM-DD and used to derive current age. */
  dateOfBirth: string | null;
  /** Derived whole-year age used as a compatibility mirror for published comparison flows. */
  exactAge: number | null;
  /** Reference group used for sex-specific published comparisons. */
  referenceSex: ProfileReferenceSex | null;
  /** Menopause-transition stage; shapes copy and content, never measurements. */
  menopauseStage: MenopauseStage | null;
  /** Optional symptom picture; personalisation context only, never scoring. */
  symptomPicture: MenopauseSymptomPicture | null;
  /** Deprecated legacy exact age mirror for older V1 surfaces. */
  age: number | null;
  /** Legacy age range retained for old records and non-reference copy. */
  ageBand: AgeBand | null;
  /** One-line personal goal in the user's own words; '' when unset. */
  goal: string;
  /** Primary retention anchor: what the user wants their body to keep letting them do. */
  lifeGoal: LifeGoal | null;
  /** Short movement/safety intake used to choose gentler starts and equipment substitutions. */
  safetyProfile: MovementSafetyProfile | null;
}

export interface AppSettings {
  /** Selected trainer-voice id (see ./voices). */
  voiceId: string;
  /**
   * Whether the user has opted in to workout reminders. Stored preference only
   * for now — no OS notification is scheduled (push remains a V1 non-goal; see
   * docs/decisions.md). Off by default; gentle, never streak-shaming (Law 5).
   */
  remindersEnabled: boolean;
  /** Local equipment preference used by setup screens; no camera/session dependency. */
  phoneStandAvailable: boolean;
  /**
   * Voice-session onboarding state (no-nagging rules, see
   * src/voice/voicePermissionGate.ts): each flag flips true exactly once.
   */
  voiceSetup: {
    promptShown: boolean;
    safetyLineShown: boolean;
  };
  /**
   * Population-comparison opt-in (REPOSITION_TDD slice 5, founder conditions
   * 2026-07-06): baseline-relative is the default everywhere, so this starts
   * false. The results screen is the front door (quiet entry from the second
   * check-up onward); Settings is where the switch can always be found.
   * Reversible; rendering stays governed by claim eligibility either way.
   */
  comparisonOptIn: boolean;
}

export type OnboardingStep =
  | 'welcome'
  | 'life_goal'
  | 'safety_profile'
  | 'camera_setup'
  | 'baseline_checkup'
  | 'results'
  | 'create_block'
  | 'complete';

export interface OnboardingState {
  currentStep: OnboardingStep;
  baselineResultId: string | null;
  completedAt: string | null;
  updatedAt: string | null;
}

/** The whole persisted preferences record (one file, schema-versioned). */
export interface Preferences {
  profile: UserProfile;
  settings: AppSettings;
  onboarding: OnboardingState;
}

export const EMPTY_PROFILE: UserProfile = {
  name: '',
  dateOfBirth: null,
  exactAge: null,
  referenceSex: null,
  menopauseStage: null,
  symptomPicture: null,
  age: null,
  ageBand: null,
  goal: '',
  lifeGoal: null,
  safetyProfile: null,
};
