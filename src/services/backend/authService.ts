import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Platform } from 'react-native';

import { isOnlineProfilesEnabled } from '../../config/onlineProfiles';
import { supabase } from '../../lib/supabase';
import { addBreadcrumb, captureError } from '../observability/sentry';

import { upsertCurrentProfile } from './profileService';
import type { AuthSession, AuthState, AuthUser, BackendProfile } from './types';

import { BRAND } from '../../brand';
export type AuthChangeCallback = (state: AuthState) => void;

const OAUTH_REDIRECT_SCHEME = 'pearl';
const OAUTH_REDIRECT_PATH = 'auth/callback';
const OAUTH_REDIRECT_URL = `${OAUTH_REDIRECT_SCHEME}://${OAUTH_REDIRECT_PATH}`;
const GOOGLE_PROVIDER = 'google';

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
  error: string | null = null,
  isPasswordRecovery = false
): AuthState {
  return {
    session,
    user,
    profile,
    loading: false,
    isSignedIn: Boolean(session?.user),
    isPasswordRecovery,
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

// Supabase dashboard setup: add pearl://auth/callback under Auth URL Configuration
// redirect URLs, and keep password-reset emails using the Supabase confirmation URL.
function passwordResetRedirectUrl(): string {
  return OAUTH_REDIRECT_URL;
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

function authCallbackType(url: string): string | undefined {
  const { params } = QueryParams.getQueryParams(url);
  return typeof params.type === 'string' ? params.type : undefined;
}

function isPasswordRecoveryUrl(url: string): boolean {
  return authCallbackType(url) === 'recovery';
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

async function handleIncomingAuthUrl(
  url: string,
  source: 'event' | 'initial' = 'event',
  callback?: AuthChangeCallback
): Promise<void> {
  devAuthLog('incoming URL received', { source, url: safeUrlHostPath(url) });

  if (!isAuthCallbackUrl(url, pendingOAuthCallback?.redirectTo ?? OAUTH_REDIRECT_URL)) return;

  devAuthLog('incoming URL matched auth callback', { source, url: safeUrlHostPath(url) });

  const { params, errorCode } = QueryParams.getQueryParams(url);
  const hasPkceCode = typeof params.code === 'string' && params.code.length > 0;
  const hasProviderError = Boolean(
    errorCode || params.error || params.error_code || params.error_description
  );
  if (!hasPkceCode && !hasProviderError) {
    // Never accept bearer tokens delivered by an unsolicited app link. All
    // supported OAuth, confirmation, and recovery callbacks use a one-time
    // PKCE code bound to the verifier stored by this installation.
    addBreadcrumb('auth callback rejected', { reason: 'missing_pkce_code' });
    return;
  }

  const pendingCallback = pendingOAuthCallback;
  pendingOAuthCallback = null;
  if (pendingCallback) {
    pendingCallback.resolve(url);
    return;
  }

  try {
    const session = await createSessionFromAuthUrl(url);
    const nextState = stateForSession(session);
    callback?.({
      ...nextState,
      isPasswordRecovery: isPasswordRecoveryUrl(url),
    });
  } catch (error) {
    const message = messageFromUnknown(error);
    console.warn(`[auth] incoming auth callback failed: ${message}`);
    captureError(error, { area: 'auth', action: 'incoming_auth_callback' });
  }
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

function isAppleCancel(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    String((error as { code?: unknown }).code) === 'ERR_REQUEST_CANCELED'
  );
}

interface AppleReplayGuards {
  /** Sent to Supabase, which SHA-256-hashes it and compares against the token's nonce claim. */
  rawNonce: string;
  /** Sent to Apple; embedded verbatim as the identity token's nonce claim. */
  hashedNonce: string;
  /** Echoed back unmodified by Apple; must match or the credential is rejected. */
  state: string;
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, '0');
  }
  return hex;
}

// Per-attempt replay protection for the native Apple ID-token flow: a fresh
// cryptographic nonce binds the returned identity token to this sign-in
// attempt (Supabase verifies SHA256(rawNonce) against the token's nonce
// claim), and a fresh state value confirms the credential answers this
// request. A captured identity token cannot be replayed against Supabase
// because its nonce claim will not match any future attempt's nonce.
async function createAppleReplayGuards(): Promise<AppleReplayGuards> {
  const rawNonce = bytesToHex(await Crypto.getRandomBytesAsync(32));
  const state = bytesToHex(await Crypto.getRandomBytesAsync(16));
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce
  );

  return { rawNonce, hashedNonce, state };
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

function stateForSession(session: AuthSession | null, fallbackUser?: AuthUser | null): AuthState {
  if (!session) return authState(null, fallbackUser ?? null);
  // A valid Supabase session is the authentication result. Loading the
  // optional profile is deliberately deferred to AuthProvider so profile
  // latency, a missing row, or an RLS error cannot reject a successful auth
  // action (or hold it open until a separate network request times out).
  return authState(session, session.user);
}

async function createSessionFromAuthUrl(url: string): Promise<AuthSession> {
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
    devAuthLog('auth callback exchangeCodeForSession started');
    const { data, error } = await supabase.auth.exchangeCodeForSession(authCode);

    if (error) {
      devAuthLog('auth callback exchangeCodeForSession failed', { message: error.message });
      throw error;
    }
    if (!data.session) {
      devAuthLog('auth callback exchangeCodeForSession failed', { message: 'No session returned' });
      throw new Error('Supabase auth callback completed, but did not create a session.');
    }

    devAuthLog('auth callback exchangeCodeForSession succeeded');
    return data.session;
  }

  throw new Error(
    'Supabase auth callback returned without a PKCE code. Check the provider and redirect URL configuration.'
  );
}

export async function getCurrentSession(): Promise<AuthSession | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  devAuthLog('Supabase getSession returned', { hasSession: Boolean(data.session) });
  return data.session;
}

/** Server-validated identity for resolving an ambiguous deletion request. */
export async function getVerifiedCurrentUser(): Promise<AuthUser | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    const status = (error as { status?: unknown }).status;
    if (status === 401 || status === 403 || status === 404) return null;
    throw error;
  }
  return data.user ?? null;
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
    options: {
      emailRedirectTo: OAUTH_REDIRECT_URL,
      ...(name ? { data: { full_name: name } } : {}),
    },
  });

  if (error) throw error;
  return stateForSession(data.session, data.user);
}

export async function signInWithEmail(email: string, password: string): Promise<AuthState> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail(email),
    password,
  });

  if (error) throw error;
  return stateForSession(data.session, data.user);
}

export async function sendPasswordResetEmail(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail(email), {
    redirectTo: passwordResetRedirectUrl(),
  });

  if (error) throw error;
}

export async function updatePassword(newPassword: string): Promise<AuthState> {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;

  const session = await getCurrentSession();
  return stateForSession(session, data.user);
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
      const session = await createSessionFromAuthUrl(result.url);
      const currentSession = await getCurrentSession();
      devAuthLog('Google sign-in session confirmed after callback', { hasSession: Boolean(currentSession) });
      return stateForSession(session);
    } catch (exchangeError) {
      devAuthLog('Google sign-in Supabase session exchange failed', {
        message: messageFromUnknown(exchangeError),
      });
      throw new Error(`Google sign-in could not create a ${BRAND.appName} session: ${messageFromUnknown(exchangeError)}`);
    }
  }

  if (result.type === 'cancel') {
    throw new Error('Google sign-in was cancelled.');
  }

  if (result.type === 'dismiss') {
    throw new Error(`Google sign-in closed before ${BRAND.appName} received the callback.`);
  }

  throw new Error(`Google sign-in did not complete (${result.type}). Try again from ${BRAND.appName}.`);
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
    const guards = await createAppleReplayGuards();
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: guards.hashedNonce,
      state: guards.state,
    });

    if (credential.state !== guards.state) {
      throw new Error(
        'Apple sign-in returned a credential for a different request. Try again.'
      );
    }

    if (!credential.identityToken) {
      throw new Error('Apple sign-in did not return an identity token.');
    }

    // Requires the Supabase Apple provider to list this bundle id as an
    // authorized client id (docs/auth-supabase-setup.md). Supabase validates
    // the token audience and the nonce claim against rawNonce.
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce: guards.rawNonce,
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
        if (isOnlineProfilesEnabled()) {
          await upsertCurrentProfile({ full_name: fullName });
        }
      } catch (profileError) {
        console.warn(`[auth] Apple profile name save failed: ${messageFromUnknown(profileError)}`);
        captureError(profileError, { area: 'auth', action: 'apple_profile_name_save' });
      }
    }

    return stateForSession(data.session, data.user);
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

/** Clear only this installation's persisted session after server-side erasure. */
export async function clearLocalSession(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (!error) return;

  // Supabase normally removes persisted storage even when the deleted user's
  // JWT returns 401/404. If a different sign-out failure escapes, explicitly
  // remove this app's default Supabase Auth keys so a deleted session cannot
  // reappear on relaunch. Never log key contents or token values.
  try {
    const keys = await AsyncStorage.getAllKeys();
    const authKeys = keys.filter(isDefaultSupabaseAuthStorageKey);
    if (authKeys.length > 0) await AsyncStorage.multiRemove(authKeys);
  } catch (storageError) {
    throw new Error(
      `Could not clear the saved Supabase session: ${messageFromUnknown(storageError)}`
    );
  }
}

function isDefaultSupabaseAuthStorageKey(key: string): boolean {
  if (!key.startsWith('sb-')) return false;
  return (
    key.endsWith('-auth-token') ||
    key.endsWith('-auth-token-code-verifier') ||
    key.endsWith('-auth-token-user')
  );
}

export function subscribeToAuthChanges(callback: AuthChangeCallback): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    devAuthLog('Supabase auth state changed', { event, hasSession: Boolean(session) });
    addBreadcrumb('auth state changed', {
      event,
      signedIn: Boolean(session?.user),
      passwordRecovery: event === 'PASSWORD_RECOVERY',
    });
    callback(authState(session, session?.user ?? null, null, null, event === 'PASSWORD_RECOVERY'));
  });

  return () => subscription.unsubscribe();
}

export function subscribeToAuthDeepLinks(callback?: AuthChangeCallback): () => void {
  if (Platform.OS === 'web') return () => {};

  let active = true;
  const subscription = Linking.addEventListener('url', (event) => {
    void handleIncomingAuthUrl(event.url, 'event', callback);
  });

  void Linking.getInitialURL()
    .then((url) => {
      if (active && url) {
        void handleIncomingAuthUrl(url, 'initial', callback);
      }
    })
    .catch((error) => {
      console.warn(`[auth] initial auth URL read failed: ${messageFromUnknown(error)}`);
      captureError(error, { area: 'auth', action: 'initial_auth_url' });
    });

  return () => {
    active = false;
    subscription.remove();
  };
}
