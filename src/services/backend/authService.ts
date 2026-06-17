import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { supabase } from '../../lib/supabase';

import { ensureCurrentProfile, upsertCurrentProfile } from './profileService';
import type { AuthSession, AuthState, AuthUser, BackendProfile } from './types';

export type AuthChangeCallback = (state: AuthState) => void;

const OAUTH_REDIRECT_SCHEME = 'hale';
const OAUTH_REDIRECT_PATH = 'auth/callback';

WebBrowser.maybeCompleteAuthSession();

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

function socialAuthRedirectUrl(): string {
  return makeRedirectUri({
    scheme: OAUTH_REDIRECT_SCHEME,
    path: OAUTH_REDIRECT_PATH,
  });
}

function messageFromUnknown(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isAppleCancel(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    String((error as { code?: unknown }).code) === 'ERR_REQUEST_CANCELED'
  );
}

function appleFullName(fullName: AppleAuthentication.AppleAuthenticationFullName | null): string | undefined {
  if (!fullName) return undefined;

  const value = [
    fullName.givenName,
    fullName.middleName,
    fullName.familyName,
  ]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .map((part) => part.trim())
    .join(' ');

  return normalizedFullName(value);
}

async function stateWithProfile(session: AuthSession | null, fallbackUser?: AuthUser | null): Promise<AuthState> {
  if (!session) return authState(null, fallbackUser ?? null);

  const profile = await ensureCurrentProfile();
  return authState(session, session.user, profile);
}

async function createSessionFromOAuthUrl(url: string): Promise<AuthSession> {
  const { params, errorCode } = QueryParams.getQueryParams(url);

  if (errorCode) {
    throw new Error(`OAuth provider returned ${errorCode}.`);
  }

  const accessToken = typeof params.access_token === 'string' ? params.access_token : undefined;
  const refreshToken = typeof params.refresh_token === 'string' ? params.refresh_token : undefined;

  if (!accessToken || !refreshToken) {
    throw new Error(
      'OAuth sign-in did not return a Supabase session. Check the provider and redirect URL configuration.'
    );
  }

  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) throw error;
  if (!data.session) {
    throw new Error('OAuth sign-in completed, but Supabase did not create a session.');
  }

  return data.session;
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

export async function signInWithGoogle(): Promise<AuthState> {
  const redirectTo = socialAuthRedirectUrl();

  // TODO(supabase-auth): Enable Google in Supabase Auth and add hale://** to Redirect URLs.
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data?.url) {
    throw new Error('Google sign-in is not configured yet. Enable Google in Supabase Auth.');
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type === 'success') {
    const session = await createSessionFromOAuthUrl(result.url);
    return stateWithProfile(session);
  }

  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new Error('Google sign-in was cancelled.');
  }

  throw new Error(`Google sign-in did not complete (${result.type}).`);
}

export async function signInWithApple(): Promise<AuthState> {
  if (Platform.OS !== 'ios') {
    throw new Error('Sign in with Apple is available on iOS devices only.');
  }

  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) {
    throw new Error('Sign in with Apple is not available on this device.');
  }

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new Error('Apple sign-in did not return an identity token.');
    }

    // TODO(supabase-auth): Enable Apple in Supabase Auth and configure the Apple app identifiers.
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });

    if (error) throw error;

    if (!data.session) {
      throw new Error('Apple sign-in completed, but Supabase did not create a session.');
    }

    const fullName = appleFullName(credential.fullName);
    if (fullName) {
      try {
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            full_name: fullName,
            given_name: credential.fullName?.givenName ?? undefined,
            family_name: credential.fullName?.familyName ?? undefined,
          },
        });

        if (updateError) throw updateError;
        await upsertCurrentProfile({ full_name: fullName });
      } catch (profileError) {
        console.warn(`[auth] Apple profile name save failed: ${messageFromUnknown(profileError)}`);
      }
    }

    return stateWithProfile(data.session, data.user);
  } catch (error) {
    if (isAppleCancel(error)) {
      throw new Error('Apple sign-in was cancelled.');
    }

    throw error;
  }
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
