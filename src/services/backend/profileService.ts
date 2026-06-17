import { LOCAL_USER_ID } from '../../adherence/types';
import { supabase } from '../../lib/supabase';

import type { AuthUser, BackendProfile, BackendProfileUpdate } from './types';

const PROFILE_COLUMNS = [
  'id',
  'local_user_id',
  'full_name',
  'birth_year',
  'sex',
  'profile_json',
  'onboarding_json',
  'safety_json',
  'preferences_json',
  'onboarding_completed_at',
  'created_at',
  'updated_at',
].join(', ');

async function getSessionUser(): Promise<AuthUser | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session?.user ?? null;
}

function fullNameFromUser(user: AuthUser): string | null {
  const value = user.user_metadata?.full_name ?? user.user_metadata?.name;
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

export async function getCurrentProfile(): Promise<BackendProfile | null> {
  const user = await getSessionUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;
  return (data as BackendProfile | null) ?? null;
}

export async function upsertCurrentProfile(partialProfile: BackendProfileUpdate): Promise<BackendProfile | null> {
  const user = await getSessionUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        local_user_id: LOCAL_USER_ID,
        ...partialProfile,
      },
      { onConflict: 'id' }
    )
    .select(PROFILE_COLUMNS)
    .single();

  if (error) throw error;
  return data as unknown as BackendProfile;
}

export async function ensureCurrentProfile(): Promise<BackendProfile | null> {
  const existing = await getCurrentProfile();
  if (existing) return existing;

  const user = await getSessionUser();
  if (!user) return null;

  return upsertCurrentProfile({
    local_user_id: LOCAL_USER_ID,
    full_name: fullNameFromUser(user),
  });
}
