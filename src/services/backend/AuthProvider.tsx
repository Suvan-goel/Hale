import * as React from 'react';

import {
  getCurrentSession,
  signInWithApple as signInWithAppleSupabase,
  signInWithEmail,
  signInWithGoogle as signInWithGoogleSupabase,
  signOut as signOutWithSupabase,
  signUpWithEmail,
  subscribeToAuthChanges,
  subscribeToAuthDeepLinks,
} from './authService';
import { ensureCurrentProfile } from './profileService';
import type { AuthSession, AuthState, BackendProfile } from './types';

const AUTH_TIMEOUT_MS = 7000;

interface AuthContextValue extends AuthState {
  signUp: (email: string, password: string, fullName?: string) => Promise<AuthState>;
  signIn: (email: string, password: string) => Promise<AuthState>;
  signInWithGoogle: () => Promise<AuthState>;
  signInWithApple: () => Promise<AuthState>;
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
        setState({
          session,
          user: session?.user ?? null,
          profile,
          loading: false,
          isSignedIn: Boolean(session?.user),
          error: null,
        });
      } catch (error) {
        const message = messageFromError(error);
        console.warn(`[auth] session load failed: ${message}`);
        if (mounted) setState({ ...emptyAuthState(false), error: message });
      }
    }

    void hydrate();

    const unsubscribeDeepLinks = subscribeToAuthDeepLinks();
    const unsubscribe = subscribeToAuthChanges((next) => {
      if (!mounted) return;
      setState((current) => ({
        ...current,
        ...next,
        profile: next.isSignedIn ? current.profile : null,
        loading: false,
      }));
      if (next.isSignedIn) void refreshProfile();
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
      setState(next);
      return next;
    } catch (error) {
      const message = messageFromError(error);
      setState((current) => ({ ...current, loading: false, error: message }));
      throw error;
    }
  }, []);

  const signIn = React.useCallback(async (email: string, password: string) => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const next = await signInWithEmail(email, password);
      setState(next);
      return next;
    } catch (error) {
      const message = messageFromError(error);
      setState((current) => ({ ...current, loading: false, error: message }));
      throw error;
    }
  }, []);

  const signInWithGoogle = React.useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const next = await signInWithGoogleSupabase();
      setState(next);
      return next;
    } catch (error) {
      const message = messageFromError(error);
      setState((current) => ({ ...current, loading: false, error: message }));
      throw error;
    }
  }, []);

  const signInWithApple = React.useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const next = await signInWithAppleSupabase();
      setState(next);
      return next;
    } catch (error) {
      const message = messageFromError(error);
      setState((current) => ({ ...current, loading: false, error: message }));
      throw error;
    }
  }, []);

  const signOut = React.useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      await signOutWithSupabase();
      setState(emptyAuthState(false));
    } catch (error) {
      const message = messageFromError(error);
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
      signOut,
      refreshProfile,
    }),
    [refreshProfile, signIn, signInWithApple, signInWithGoogle, signOut, signUp, state]
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
