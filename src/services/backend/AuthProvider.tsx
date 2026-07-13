import * as React from 'react';

import { BRAND } from '../../brand';
import { isOnlineProfilesEnabled } from '../../config/onlineProfiles';
import { addBreadcrumb, captureError, setUserContext } from '../observability/sentry';

import {
  clearLocalSession,
  getCurrentSession,
  getVerifiedCurrentUser,
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
import {
  clearLocalPearlData,
  type ClearLocalPearlDataResult,
} from './accountDataService';
import { requestCloudAccountDeletion } from './accountDeletionService';
import {
  markAccountDeletionConfirmed,
  markAccountDeletionUncertain,
  markDeletedAccountCleanupComplete,
  pendingAccountDeletionCleanups,
} from './pendingAccountCleanupStore';
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
  deleteAccount: () => Promise<ClearLocalPearlDataResult>;
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

async function profileForSession(
  session: AuthSession | null
): Promise<BackendProfile | null> {
  if (!session?.user) return null;
  if (!isOnlineProfilesEnabled()) return null;

  try {
    return await withTimeout(
      ensureCurrentProfile(session.user.id),
      'Supabase profile load'
    );
  } catch (error) {
    const message = messageFromError(error);
    console.warn(`[auth] signed-in profile load failed: ${message}`);
    captureError(error, { area: 'auth', action: 'hydrate_profile' });
    return null;
  }
}

async function retryPendingDeletedAccountCleanups(
  currentSession: AuthSession | null
): Promise<void> {
  const entries = await pendingAccountDeletionCleanups();
  for (const entry of entries) {
    try {
      if (!entry.localCleanupPending) {
        if (entry.remoteState === 'confirmed_deleted') {
          await markDeletedAccountCleanupComplete(entry.userId);
        }
        continue;
      }

      let shouldClearLocal = entry.remoteState === 'confirmed_deleted';
      if (!shouldClearLocal && currentSession?.user.id === entry.userId) {
        const verifiedUser = await getVerifiedCurrentUser();
        shouldClearLocal = verifiedUser?.id !== entry.userId;
      } else if (!shouldClearLocal && currentSession?.user.id !== entry.userId) {
        // The user explicitly requested permanent deletion and this account
        // is no longer active. Clearing its device scope is safe even when a
        // timed-out remote request remains ambiguous; the marker remains so a
        // later confirmed response can finish the remote lifecycle.
        shouldClearLocal = true;
      }
      if (!shouldClearLocal) continue;

      const result = await clearLocalPearlData({ userId: entry.userId });
      if (result.failures.length === 0) {
        await markDeletedAccountCleanupComplete(entry.userId);
      }
    } catch (error) {
      captureError(error, { area: 'account', action: 'retry_deleted_account_cleanup' });
    }
  }
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
  const stateRef = React.useRef(state);
  stateRef.current = state;

  const refreshProfileForUser = React.useCallback(async (expectedUserId: string) => {
    if (!isOnlineProfilesEnabled()) {
      setState((current) =>
        current.isSignedIn && current.user?.id === expectedUserId
          ? { ...current, profile: null, loading: false }
          : current
      );
      return null;
    }
    try {
      const profile = await withTimeout(
        ensureCurrentProfile(expectedUserId),
        'Supabase profile refresh'
      );
      setState((current) =>
        current.isSignedIn && current.user?.id === expectedUserId
          ? {
              ...current,
              profile,
              loading: false,
            }
          : current
      );
      return profile;
    } catch (error) {
      const message = messageFromError(error);
      console.warn(`[auth] profile refresh failed: ${message}`);
      captureError(error, { area: 'auth', action: 'refresh_profile' });
      setState((current) =>
        current.isSignedIn && current.user?.id === expectedUserId
          ? { ...current, loading: false }
          : current
      );
      return null;
    }
  }, []);

  const refreshProfile = React.useCallback(async () => {
    // The account card can request this immediately after sign-in, before the
    // React state update has rendered. Read the persisted session to identify
    // that account, then re-check its id before applying the profile result.
    try {
      const session = await withTimeout(getCurrentSession(), 'Supabase session refresh');
      if (!session?.user) return null;
      return refreshProfileForUser(session.user.id);
    } catch (error) {
      const message = messageFromError(error);
      console.warn(`[auth] profile refresh session read failed: ${message}`);
      captureError(error, { area: 'auth', action: 'refresh_profile_session' });
      return null;
    }
  }, [refreshProfileForUser]);

  React.useEffect(() => {
    let mounted = true;
    let authEventRevision = 0;

    async function hydrate() {
      try {
        const session = await withTimeout(getCurrentSession(), 'Supabase session load');
        try {
          await retryPendingDeletedAccountCleanups(session);
        } catch (cleanupError) {
          captureError(cleanupError, {
            area: 'account',
            action: 'hydrate_deleted_account_cleanup',
          });
        }
        // A subscription event is newer authority than the initial read. A
        // delayed A session must never overwrite a signed-out or B event and
        // remount A's local health/programme scope.
        if (!mounted || authEventRevision !== 0) return;
        setUserContext(session?.user ?? null);
        addBreadcrumb('auth session hydrated', { signedIn: Boolean(session?.user) });
        setState({
          session,
          user: session?.user ?? null,
          profile: null,
          loading: false,
          isSignedIn: Boolean(session?.user),
          isPasswordRecovery: false,
          error: null,
        });

        // A network profile read must never hold the persisted session/user id
        // hostage: the account id chooses the local filesystem scope even
        // offline. Populate the online row independently once available.
        const profile = await profileForSession(session);
        if (!mounted || !session?.user) return;
        setState((current) =>
          current.user?.id === session.user.id
            ? {
                ...current,
                profile,
              }
            : current
        );
      } catch (error) {
        const message = messageFromError(error);
        console.warn(`[auth] session load failed: ${message}`);
        captureError(error, { area: 'auth', action: 'hydrate_session' });
        if (mounted && authEventRevision === 0) {
          setUserContext(null);
          setState({ ...emptyAuthState(false), error: message });
        }
      }
    }

    void hydrate();

    const unsubscribeDeepLinks = subscribeToAuthDeepLinks((next) => {
      if (!mounted) return;
      authEventRevision += 1;
      const mergedForDecision = mergeIncomingAuthState(stateRef.current, next);
      setState((current) => mergeIncomingAuthState(current, next));
      setUserContext(next.user);
      addBreadcrumb('auth state changed', {
        source: 'deep_link',
        signedIn: next.isSignedIn,
        passwordRecovery: next.isPasswordRecovery,
      });
      if (mergedForDecision.isSignedIn && !mergedForDecision.isPasswordRecovery && next.user?.id) {
        void refreshProfileForUser(next.user.id);
      }
    });
    const unsubscribe = subscribeToAuthChanges((next) => {
      if (!mounted) return;
      authEventRevision += 1;
      const mergedForDecision = mergeIncomingAuthState(stateRef.current, next);
      setState((current) => mergeIncomingAuthState(current, next));
      setUserContext(next.user);
      addBreadcrumb('auth state changed', {
        source: 'supabase',
        signedIn: next.isSignedIn,
        passwordRecovery: next.isPasswordRecovery,
      });
      if (mergedForDecision.isSignedIn && !mergedForDecision.isPasswordRecovery && next.user?.id) {
        void refreshProfileForUser(next.user.id);
      }
    });

    return () => {
      mounted = false;
      unsubscribeDeepLinks();
      unsubscribe();
    };
  }, [refreshProfileForUser]);

  React.useEffect(() => {
    if (state.loading || state.isSignedIn) return;
    void retryPendingDeletedAccountCleanups(null);
  }, [state.isSignedIn, state.loading]);

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

  const deleteAccount = React.useCallback(async () => {
    const userId = state.user?.id;
    const accessToken = state.session?.access_token;
    if (!userId || !accessToken) {
      throw new Error('Sign in before deleting your online account.');
    }

    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      // Persist intent before the network call. A timeout does not abort the
      // Edge Function, so this marker closes the late-success/crash window.
      await markAccountDeletionUncertain(userId);
      await requestCloudAccountDeletion({
        expectedUserId: userId,
        expectedAccessToken: accessToken,
        onDeletionConfirmed: () => markAccountDeletionConfirmed(userId),
      });
      await markAccountDeletionConfirmed(userId);
      const localResult = await clearLocalPearlData({ userId });
      if (localResult.failures.length > 0) {
        // Keep the account card mounted long enough to show the truthful
        // partial result and let the user retry "Clear this device" with the
        // captured account scope. The cloud account is already gone, so no
        // further online deletion is attempted.
        setState((current) =>
          current.user?.id === userId
            ? { ...current, loading: false, error: null }
            : current
        );
        return localResult;
      }
      try {
        await markDeletedAccountCleanupComplete(userId);
      } catch (cleanupMarkerError) {
        // Local erasure is already verified. Keeping the tombstone is safe and
        // causes only an idempotent retry on the next launch.
        captureError(cleanupMarkerError, {
          area: 'account',
          action: 'complete_deleted_account_cleanup',
        });
      }

      const currentSession = await getCurrentSession();
      if (currentSession?.user.id && currentSession.user.id !== userId) {
        // A different account became active while the Edge Function deleted
        // the captured account. Never sign out or overwrite that new owner.
        addBreadcrumb('account deletion completed after account switch');
        return localResult;
      }
      try {
        if (currentSession?.user.id === userId) await clearLocalSession();
      } catch (sessionError) {
        captureError(sessionError, { area: 'auth', action: 'clear_deleted_session' });
        throw new Error(
          `Your online account was deleted, but ${BRAND.appName} could not clear the saved sign-in from this device. Use Sign out to retry.`
        );
      }
      setUserContext(null);
      addBreadcrumb('auth state changed', { source: 'delete_account', signedIn: false });
      setState((current) =>
        current.user?.id === userId || !current.user ? emptyAuthState(false) : current
      );
      return localResult;
    } catch (error) {
      const message = messageFromError(error);
      captureError(error, { area: 'auth', action: 'delete_account' });
      setState((current) =>
        current.user?.id === userId
          ? { ...current, loading: false, error: message }
          : current
      );
      throw error;
    }
  }, [state.session?.access_token, state.user?.id]);

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
      deleteAccount,
      refreshProfile,
    }),
    [deleteAccount, refreshProfile, resetPassword, signIn, signInWithApple, signInWithGoogle, signOut, signUp, state, updatePassword]
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
