import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { Linking, Platform } from 'react-native';

import { supabase } from '../../lib/supabase';

import { ensureCurrentProfile, upsertCurrentProfile } from './profileService';
import type { AuthSession, AuthState, AuthUser, BackendProfile } from './types';

export type AuthChangeCallback = (state: AuthState) => void;

const OAUTH_REDIRECT_SCHEME = 'hale';
const OAUTH_REDIRECT_PATH = 'auth/callback';
const OAUTH_REDIRECT_URL = `${OAUTH_REDIRECT_SCHEME}://${OAUTH_REDIRECT_PATH}`;
const GOOGLE_PROVIDER = 'google';
const OAUTH_PROFILE_TIMEOUT_MS = 7000;

WebBrowser.maybeCompleteAuthSession();

let pendingOAuthCallback:
  | {
      redirectTo: string;
      resolve: (url: string) => void;
    }
  | null = null;

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
  const redirectUrl = makeRedirectUri({
    scheme: OAUTH_REDIRECT_SCHEME,
    path: OAUTH_REDIRECT_PATH,
  });

  return redirectUrl === OAUTH_REDIRECT_URL ? redirectUrl : OAUTH_REDIRECT_URL;
}

function devAuthLog(message: string, details?: Record<string, unknown>): void {
  if (!__DEV__) return;
  if (details) {
    console.log(`[auth] ${message}`, details);
  } else {
    console.log(`[auth] ${message}`);
  }
}

function safeUrlHostPath(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.host}${parsed.pathname}`;
  } catch {
    return 'unparseable-url';
  }
}

function messageFromUnknown(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isAuthCallbackUrl(url: string, redirectTo = OAUTH_REDIRECT_URL): boolean {
  if (url.startsWith(redirectTo)) return true;

  try {
    const parsed = new URL(url);
    const callbackPath = parsed.pathname.replace(/^\/|\/$/g, '');
    return parsed.protocol === `${OAUTH_REDIRECT_SCHEME}:` &&
      parsed.host === 'auth' &&
      callbackPath === 'callback';
  } catch {
    return false;
  }
}

function handleIncomingAuthUrl(url: string, source: 'event' | 'initial' = 'event'): void {
  devAuthLog('incoming URL received', { source, url: safeUrlHostPath(url) });

  if (!isAuthCallbackUrl(url, pendingOAuthCallback?.redirectTo ?? OAUTH_REDIRECT_URL)) return;

  devAuthLog('incoming URL matched auth callback', { source, url: safeUrlHostPath(url) });

  const callback = pendingOAuthCallback;
  pendingOAuthCallback = null;
  callback?.resolve(url);
}

function waitForOAuthCallbackUrl(redirectTo: string): Promise<string> {
  pendingOAuthCallback = null;

  return new Promise((resolve) => {
    pendingOAuthCallback = { redirectTo, resolve };
  });
}

function clearPendingOAuthCallback(): void {
  pendingOAuthCallback = null;
}

function resultUrlHostPath(result: WebBrowser.WebBrowserAuthSessionResult): string | undefined {
  if (result.type !== 'success' || !('url' in result) || !result.url) return undefined;
  return safeUrlHostPath(result.url);
}

function logAuthSessionResult(result: WebBrowser.WebBrowserAuthSessionResult): void {
  devAuthLog('Google sign-in openAuthSessionAsync resolved', {
    type: result.type,
    urlExists: result.type === 'success' && 'url' in result && Boolean(result.url),
    url: resultUrlHostPath(result),
  });
}

async function withTimeout<T>(promise: Promise<T>, label: string, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
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

async function stateWithProfileAfterOAuth(session: AuthSession): Promise<AuthState> {
  try {
    devAuthLog('Google sign-in profile refresh started');
    const profile = await withTimeout(
      ensureCurrentProfile(),
      'Google sign-in profile refresh',
      OAUTH_PROFILE_TIMEOUT_MS
    );
    devAuthLog('Google sign-in profile refresh succeeded', { hasProfile: Boolean(profile) });
    return authState(session, session.user, profile);
  } catch (profileError) {
    console.warn(`[auth] Google sign-in profile refresh failed after session exchange: ${messageFromUnknown(profileError)}`);
    return authState(session, session.user);
  }
}

async function createSessionFromOAuthUrl(url: string): Promise<AuthSession> {
  const { params, errorCode } = QueryParams.getQueryParams(url);

  if (errorCode) {
    throw new Error(`OAuth provider returned ${errorCode}.`);
  }

  const providerError = typeof params.error === 'string' ? params.error : undefined;
  const providerErrorCode = typeof params.error_code === 'string' ? params.error_code : undefined;
  const providerErrorDescription = typeof params.error_description === 'string'
    ? params.error_description
    : undefined;

  if (providerError || providerErrorCode || providerErrorDescription) {
    throw new Error(
      `OAuth provider returned ${providerErrorDescription ?? providerErrorCode ?? providerError ?? 'an error'}.`
    );
  }

  const authCode = typeof params.code === 'string' ? params.code : undefined;
  if (authCode) {
    devAuthLog('Google sign-in exchangeCodeForSession started');
    const { data, error } = await supabase.auth.exchangeCodeForSession(authCode);

    if (error) {
      devAuthLog('Google sign-in exchangeCodeForSession failed', { message: error.message });
      throw error;
    }
    if (!data.session) {
      devAuthLog('Google sign-in exchangeCodeForSession failed', { message: 'No session returned' });
      throw new Error('Google sign-in completed, but Supabase did not create a session.');
    }

    devAuthLog('Google sign-in exchangeCodeForSession succeeded');
    return data.session;
  }

  const accessToken = typeof params.access_token === 'string' ? params.access_token : undefined;
  const refreshToken = typeof params.refresh_token === 'string' ? params.refresh_token : undefined;

  if (!accessToken || !refreshToken) {
    throw new Error(
      'Google sign-in returned without a Supabase session. Check the provider and redirect URL configuration.'
    );
  }

  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) throw error;
  if (!data.session) {
    throw new Error('Google sign-in completed, but Supabase did not create a session.');
  }

  return data.session;
}

export async function getCurrentSession(): Promise<AuthSession | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  devAuthLog('Supabase getSession returned', { hasSession: Boolean(data.session) });
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

  devAuthLog('Google sign-in started');
  devAuthLog('Google sign-in redirectTo', { redirectTo });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: GOOGLE_PROVIDER,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data?.url) {
    throw new Error('Google sign-in could not start because Supabase did not return an OAuth URL.');
  }

  devAuthLog('Google sign-in OAuth URL', { url: safeUrlHostPath(data.url) });

  const callbackUrlPromise = waitForOAuthCallbackUrl(redirectTo).then((url) => ({
    type: 'success' as const,
    url,
    source: 'linking' as const,
  }));
  const authSessionOptions = Platform.OS === 'android'
    ? { createTask: false, useProxyActivity: false }
    : undefined;

  devAuthLog('Google sign-in opening OAuth URL with openAuthSessionAsync', {
    redirectTo,
    url: safeUrlHostPath(data.url),
    androidOptions: Platform.OS === 'android' ? authSessionOptions : undefined,
  });

  const authSessionPromise = WebBrowser
    .openAuthSessionAsync(data.url, redirectTo, authSessionOptions)
    .then((result) => {
      logAuthSessionResult(result);
      return { ...result, source: 'auth-session' as const };
    });

  let result: Awaited<typeof authSessionPromise> | Awaited<typeof callbackUrlPromise>;
  try {
    result = await Promise.race([authSessionPromise, callbackUrlPromise]);
  } finally {
    clearPendingOAuthCallback();
  }

  devAuthLog('Google sign-in browser/callback result selected', {
    source: result.source,
    type: result.type,
    callbackUrlReceived: result.type === 'success' && 'url' in result && Boolean(result.url),
    url: result.type === 'success' && 'url' in result && result.url ? safeUrlHostPath(result.url) : undefined,
  });

  if (result.type === 'success') {
    if (!('url' in result) || !result.url) {
      throw new Error('Google sign-in returned without a callback URL.');
    }

    devAuthLog('Google sign-in callback received', { url: safeUrlHostPath(result.url) });

    try {
      const session = await createSessionFromOAuthUrl(result.url);
      const currentSession = await getCurrentSession();
      devAuthLog('Google sign-in session confirmed after callback', { hasSession: Boolean(currentSession) });
      return stateWithProfileAfterOAuth(session);
    } catch (exchangeError) {
      devAuthLog('Google sign-in Supabase session exchange failed', {
        message: messageFromUnknown(exchangeError),
      });
      throw new Error(`Google sign-in could not create a Hale session: ${messageFromUnknown(exchangeError)}`);
    }
  }

  if (result.type === 'cancel') {
    throw new Error('Google sign-in was cancelled.');
  }

  if (result.type === 'dismiss') {
    throw new Error('Google sign-in closed before Hale received the callback.');
  }

  throw new Error(`Google sign-in did not complete (${result.type}). Try again from Hale.`);
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
  } = supabase.auth.onAuthStateChange((event, session) => {
    devAuthLog('Supabase auth state changed', { event, hasSession: Boolean(session) });
    callback(authState(session));
  });

  return () => subscription.unsubscribe();
}

export function subscribeToAuthDeepLinks(): () => void {
  if (Platform.OS === 'web') return () => {};

  const subscription = Linking.addEventListener('url', (event) => {
    handleIncomingAuthUrl(event.url);
  });

  return () => subscription.remove();
}
