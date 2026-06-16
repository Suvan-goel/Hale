/**
 * Local user profile + app preferences (V1 stays local-only — no accounts, no
 * backend). The profile is the lightweight identity Home greets and Settings
 * edits; settings hold the trainer-voice choice and the (UI-only for now)
 * workout-reminder preference.
 */

import type { LifeGoal, MovementSafetyProfile } from '../adherence';

/** A single person on this device. All fields optional until the user fills them in. */
export interface UserProfile {
  /** Display name shown on Home; '' when unset. */
  name: string;
  /** Age in years, or null when unset. Used for greetings; norms still come from measured tests. */
  age: number | null;
  /** One-line personal goal in the user's own words; '' when unset. */
  goal: string;
  /** Primary retention anchor: what the user wants their body to keep letting them do. */
  lifeGoal: LifeGoal | null;
  /** Short movement/safety intake used to choose gentler starts and equipment substitutions. */
  safetyProfile: MovementSafetyProfile | null;
}

export interface AppSettings {
  /** Selected trainer-voice id (see ./voices). Only the default is wired today. */
  voiceId: string;
  /**
   * Whether the user has opted in to workout reminders. Stored preference only
   * for now — no OS notification is scheduled (push remains a V1 non-goal; see
   * docs/decisions.md). Off by default; gentle, never streak-shaming (Law 5).
   */
  remindersEnabled: boolean;
}

/** The whole persisted preferences record (one file, schema-versioned). */
export interface Preferences {
  profile: UserProfile;
  settings: AppSettings;
}

export const EMPTY_PROFILE: UserProfile = {
  name: '',
  age: null,
  goal: '',
  lifeGoal: null,
  safetyProfile: null,
};
