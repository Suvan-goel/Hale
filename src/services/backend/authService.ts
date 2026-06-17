import { supabase } from '../../lib/supabase';

import { ensureCurrentProfile } from './profileService';
import type { AuthSession, AuthState, AuthUser, BackendProfile } from './types';

export type AuthChangeCallback = (state: AuthState) => void;

function authState(
  session: AuthSession | null,
  user: AuthUser | null = session?.user ?? null,
  profile: BackendProfile | null = null,
  error: string | null = null
): AuthState {
  return {
    session,
    user,
    profile,
    loading: false,
    isSignedIn: Boolean(session?.user),
    error,
  };
}

function normalizedEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizedFullName(fullName?: string): string | undefined {
  const next = fullName?.trim();
  return next ? next : undefined;
}

async function stateWithProfile(session: AuthSession | null, fallbackUser?: AuthUser | null): Promise<AuthState> {
  if (!session) return authState(null, fallbackUser ?? null);

  const profile = await ensureCurrentProfile();
  return authState(session, session.user, profile);
}

export async function getCurrentSession(): Promise<AuthSession | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getCurrentSession();
  return session?.user ?? null;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName?: string
): Promise<AuthState> {
  const name = normalizedFullName(fullName);
  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail(email),
    password,
    ...(name ? { options: { data: { full_name: name } } } : {}),
  });

  if (error) throw error;
  return stateWithProfile(data.session, data.user);
}

export async function signInWithEmail(email: string, password: string): Promise<AuthState> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail(email),
    password,
  });

  if (error) throw error;
  return stateWithProfile(data.session, data.user);
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function subscribeToAuthChanges(callback: AuthChangeCallback): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(authState(session));
  });

  return () => subscription.unsubscribe();
}
