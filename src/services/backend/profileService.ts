import { supabase } from '../../lib/supabase';

import type { AuthUser, BackendProfile, BackendProfileUpdate } from './types';

// safety_json deliberately absent: health data is local-only (2026-07-06
// ruling) — never selected, never written.
const PROFILE_COLUMNS = [
  'id',
  'local_user_id',
  'full_name',
  'birth_year',
  'sex',
  'profile_json',
  'onboarding_json',
  'preferences_json',
  'onboarding_completed_at',
  'created_at',
  'updated_at',
].join(', ');

async function getSessionUser(expectedUserId?: string): Promise<AuthUser | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const user = data.session?.user ?? null;
  if (expectedUserId && user?.id !== expectedUserId) {
    throw new Error('The authenticated account changed during profile access.');
  }
  return user;
}

function fullNameFromUser(user: AuthUser): string | null {
  const value = user.user_metadata?.full_name ?? user.user_metadata?.name;
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

export async function getCurrentProfile(expectedUserId?: string): Promise<BackendProfile | null> {
  const user = await getSessionUser(expectedUserId);
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;
  return (data as BackendProfile | null) ?? null;
}

export async function upsertCurrentProfile(
  partialProfile: BackendProfileUpdate,
  expectedUserId?: string
): Promise<BackendProfile | null> {
  const user = await getSessionUser(expectedUserId);
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        ...partialProfile,
      },
      { onConflict: 'id' }
    )
    .select(PROFILE_COLUMNS)
    .single();

  if (error) throw error;
  return data as unknown as BackendProfile;
}

/**
 * Update the signed-in user's row only when it is still the exact version the
 * caller read. This is the online-profile compare-and-swap seam: a second
 * device can never be silently overwritten between reconciliation's read and
 * write.
 */
export async function updateCurrentProfileIfUnchanged(
  partialProfile: BackendProfileUpdate,
  expectedUpdatedAt: string,
  expectedUserId?: string
): Promise<BackendProfile | null> {
  const user = await getSessionUser(expectedUserId);
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .update(partialProfile)
    .eq('id', user.id)
    .eq('updated_at', expectedUpdatedAt)
    .select(PROFILE_COLUMNS)
    .maybeSingle();

  if (error) throw error;
  return (data as BackendProfile | null) ?? null;
}

/** Insert a missing owner row without turning an insert race into an overwrite. */
export async function insertCurrentProfileIfAbsent(
  partialProfile: BackendProfileUpdate,
  expectedUserId?: string
): Promise<BackendProfile | null> {
  const user = await getSessionUser(expectedUserId);
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      ...partialProfile,
    })
    .select(PROFILE_COLUMNS)
    .single();

  if (error) {
    // A concurrent signup/device created the row after our read. Let the
    // reconciler re-read it and present a conflict instead of overwriting it.
    if (error.code === '23505') return null;
    throw error;
  }
  return data as unknown as BackendProfile;
}

export async function ensureCurrentProfile(expectedUserId?: string): Promise<BackendProfile | null> {
  const user = await getSessionUser(expectedUserId);
  if (!user) return null;
  const existing = await getCurrentProfile(user.id);
  if (existing) return existing;

  return upsertCurrentProfile(
    { full_name: fullNameFromUser(user) },
    user.id
  );
}
