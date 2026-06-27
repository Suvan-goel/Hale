import * as React from 'react';

import { addBreadcrumb, captureError, setUserContext } from '../observability/sentry';

import {
  getCurrentSession,
  sendPasswordResetEmail,
  signInWithApple as signInWithAppleSupabase,
  signInWithEmail,
  signInWithGoogle as signInWithGoogleSupabase,
  signOut as signOutWithSupabase,
  signUpWithEmail,
  subscribeToAuthChanges,
  subscribeToAuthDeepLinks,
  updatePassword as updatePasswordWithSupabase,
} from './authService';
import { ensureCurrentProfile } from './profileService';
import type { AuthSession, AuthState, BackendProfile } from './types';

const AUTH_TIMEOUT_MS = 7000;

interface AuthContextValue extends AuthState {
  signUp: (email: string, password: string, fullName?: string) => Promise<AuthState>;
  signIn: (email: string, password: string) => Promise<AuthState>;
  signInWithGoogle: () => Promise<AuthState>;
  signInWithApple: () => Promise<AuthState>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<AuthState>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<BackendProfile | null>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

function emptyAuthState(loading: boolean): AuthState {
  return {
    session: null,
    user: null,
    profile: null,
    loading,
    isSignedIn: false,
    isPasswordRecovery: false,
    error: null,
  };
}

function messageFromError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(`${label} timed out`)), AUTH_TIMEOUT_MS);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function profileForSession(session: AuthSession | null): Promise<BackendProfile | null> {
  if (!session?.user) return null;
  return withTimeout(ensureCurrentProfile(), 'Supabase profile load');
}

function mergeIncomingAuthState(current: AuthState, next: AuthState): AuthState {
  const isPasswordRecovery = next.isPasswordRecovery || (current.isPasswordRecovery && next.isSignedIn);
  const sameSignedInUser =
    next.isSignedIn &&
    typeof next.user?.id === 'string' &&
    next.user.id === current.user?.id;
  return {
    ...current,
    ...next,
    isPasswordRecovery,
    profile: sameSignedInUser ? current.profile : null,
    loading: false,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>(() => emptyAuthState(true));

  const refreshProfile = React.useCallback(async () => {
    try {
      const profile = await withTimeout(ensureCurrentProfile(), 'Supabase profile refresh');
      setState((current) => ({
        ...current,
        profile,
        loading: false,
        error: null,
      }));
      return profile;
    } catch (error) {
      const message = messageFromError(error);
      console.warn(`[auth] profile refresh failed: ${message}`);
      captureError(error, { area: 'auth', action: 'refresh_profile' });
      setState((current) => ({ ...current, loading: false, error: message }));
      return null;
    }
  }, []);

  React.useEffect(() => {
    let mounted = true;

    async function hydrate() {
      try {
        const session = await withTimeout(getCurrentSession(), 'Supabase session load');
        const profile = await profileForSession(session);
        if (!mounted) return;
        setUserContext(session?.user ?? null);
        addBreadcrumb('auth session hydrated', { signedIn: Boolean(session?.user) });
        setState({
          session,
          user: session?.user ?? null,
          profile,
          loading: false,
          isSignedIn: Boolean(session?.user),
          isPasswordRecovery: false,
          error: null,
        });
      } catch (error) {
        const message = messageFromError(error);
        console.warn(`[auth] session load failed: ${message}`);
        setUserContext(null);
        captureError(error, { area: 'auth', action: 'hydrate_session' });
        if (mounted) setState({ ...emptyAuthState(false), error: message });
      }
    }

    void hydrate();

    const unsubscribeDeepLinks = subscribeToAuthDeepLinks((next) => {
      if (!mounted) return;
      let shouldRefreshProfile = false;
      setState((current) => {
        const merged = mergeIncomingAuthState(current, next);
        shouldRefreshProfile = merged.isSignedIn && !merged.isPasswordRecovery;
        return merged;
      });
      setUserContext(next.user);
      addBreadcrumb('auth state changed', {
        source: 'deep_link',
        signedIn: next.isSignedIn,
        passwordRecovery: next.isPasswordRecovery,
      });
      if (shouldRefreshProfile) void refreshProfile();
    });
    const unsubscribe = subscribeToAuthChanges((next) => {
      if (!mounted) return;
      let shouldRefreshProfile = false;
      setState((current) => {
        const merged = mergeIncomingAuthState(current, next);
        shouldRefreshProfile = merged.isSignedIn && !merged.isPasswordRecovery;
        return merged;
      });
      setUserContext(next.user);
      addBreadcrumb('auth state changed', {
        source: 'supabase',
        signedIn: next.isSignedIn,
        passwordRecovery: next.isPasswordRecovery,
      });
      if (shouldRefreshProfile) void refreshProfile();
    });

    return () => {
      mounted = false;
      unsubscribeDeepLinks();
      unsubscribe();
    };
  }, [refreshProfile]);

  const signUp = React.useCallback(async (email: string, password: string, fullName?: string) => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const next = await signUpWithEmail(email, password, fullName);
      setUserContext(next.user);
      addBreadcrumb('auth action completed', { action: 'sign_up', signedIn: next.isSignedIn });
      setState(next);
      return next;
    } catch (error) {
      const message = messageFromError(error);
      captureError(error, { area: 'auth', action: 'sign_up' });
      setState((current) => ({ ...current, loading: false, error: message }));
      throw error;
    }
  }, []);

  const signIn = React.useCallback(async (email: string, password: string) => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const next = await signInWithEmail(email, password);
      setUserContext(next.user);
      addBreadcrumb('auth action completed', { action: 'sign_in_email', signedIn: next.isSignedIn });
      setState(next);
      return next;
    } catch (error) {
      const message = messageFromError(error);
      captureError(error, { area: 'auth', action: 'sign_in_email' });
      setState((current) => ({ ...current, loading: false, error: message }));
      throw error;
    }
  }, []);

  const signInWithGoogle = React.useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const next = await signInWithGoogleSupabase();
      setUserContext(next.user);
      addBreadcrumb('auth action completed', { action: 'sign_in_google', signedIn: next.isSignedIn });
      setState(next);
      return next;
    } catch (error) {
      const message = messageFromError(error);
      captureError(error, { area: 'auth', action: 'sign_in_google' });
      setState((current) => ({ ...current, loading: false, error: message }));
      throw error;
    }
  }, []);

  const signInWithApple = React.useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const next = await signInWithAppleSupabase();
      setUserContext(next.user);
      addBreadcrumb('auth action completed', { action: 'sign_in_apple', signedIn: next.isSignedIn });
      setState(next);
      return next;
    } catch (error) {
      const message = messageFromError(error);
      captureError(error, { area: 'auth', action: 'sign_in_apple' });
      setState((current) => ({ ...current, loading: false, error: message }));
      throw error;
    }
  }, []);

  const resetPassword = React.useCallback(async (email: string) => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      await sendPasswordResetEmail(email);
      addBreadcrumb('auth action completed', { action: 'reset_password' });
      setState((current) => ({ ...current, loading: false, error: null }));
    } catch (error) {
      const message = messageFromError(error);
      captureError(error, { area: 'auth', action: 'reset_password' });
      setState((current) => ({ ...current, loading: false, error: message }));
      throw error;
    }
  }, []);

  const updatePassword = React.useCallback(async (newPassword: string) => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const next = await updatePasswordWithSupabase(newPassword);
      setState({
        ...next,
        isPasswordRecovery: false,
        loading: false,
        error: null,
      });
      setUserContext(next.user);
      addBreadcrumb('auth action completed', { action: 'update_password', signedIn: next.isSignedIn });
      return next;
    } catch (error) {
      const message = messageFromError(error);
      captureError(error, { area: 'auth', action: 'update_password' });
      setState((current) => ({ ...current, loading: false, error: message }));
      throw error;
    }
  }, []);

  const signOut = React.useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      await signOutWithSupabase();
      setUserContext(null);
      addBreadcrumb('auth state changed', { source: 'sign_out', signedIn: false });
      setState(emptyAuthState(false));
    } catch (error) {
      const message = messageFromError(error);
      captureError(error, { area: 'auth', action: 'sign_out' });
      setState((current) => ({ ...current, loading: false, error: message }));
      throw error;
    }
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      ...state,
      signUp,
      signIn,
      signInWithGoogle,
      signInWithApple,
      resetPassword,
      updatePassword,
      signOut,
      refreshProfile,
    }),
    [refreshProfile, resetPassword, signIn, signInWithApple, signInWithGoogle, signOut, signUp, state, updatePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }
  return context;
}
