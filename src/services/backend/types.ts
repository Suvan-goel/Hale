import type { Session, User } from '@supabase/supabase-js';

export type AuthSession = Session;
export type AuthUser = User;

export type BackendJson = null | boolean | number | string | BackendJson[] | { [key: string]: BackendJson };

export interface BackendProfile {
  id: string;
  local_user_id: string | null;
  full_name: string | null;
  birth_year: number | null;
  sex: string | null;
  profile_json: BackendJson;
  onboarding_json: BackendJson;
  safety_json: BackendJson;
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
    | 'safety_json'
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
  error: string | null;
}
