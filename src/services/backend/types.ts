import type { Session, User } from '@supabase/supabase-js';

export type AuthSession = Session;
export type AuthUser = User;

export type BackendJson = null | boolean | number | string | BackendJson[] | { [key: string]: BackendJson };

/**
 * 2026-07-06 ruling (health data local-only, app-wide): the profiles table's
 * legacy safety_json column is no longer part of the app's shapes — health
 * data (safety profile, menopause stage, symptom picture) is never written to
 * or read from the backend until a deliberate special-category-consent +
 * encryption review adds sync as its own feature. The DB column may still
 * exist; the app sends and reads nothing. Pinned by healthDataLocalOnly test.
 */
export interface BackendProfile {
  id: string;
  local_user_id: string | null;
  full_name: string | null;
  birth_year: number | null;
  sex: string | null;
  profile_json: BackendJson;
  onboarding_json: BackendJson;
  preferences_json: BackendJson;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type BackendProfileUpdate = Partial<
  Pick<
    BackendProfile,
    | 'local_user_id'
    | 'full_name'
    | 'birth_year'
    | 'sex'
    | 'profile_json'
    | 'onboarding_json'
    | 'preferences_json'
    | 'onboarding_completed_at'
  >
>;

export interface AuthState {
  session: AuthSession | null;
  user: AuthUser | null;
  profile: BackendProfile | null;
  loading: boolean;
  isSignedIn: boolean;
  isPasswordRecovery: boolean;
  error: string | null;
}
