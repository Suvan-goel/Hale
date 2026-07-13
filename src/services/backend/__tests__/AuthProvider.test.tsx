import * as React from 'react';

import {
  clearLocalSession,
  getCurrentSession,
  getVerifiedCurrentUser,
  subscribeToAuthChanges,
  subscribeToAuthDeepLinks,
} from '../authService';
import { AuthProvider, useAuth } from '../AuthProvider';
import { clearLocalPearlData } from '../accountDataService';
import { requestCloudAccountDeletion } from '../accountDeletionService';
import {
  markAccountDeletionConfirmed,
  markAccountDeletionUncertain,
  markDeletedAccountCleanupComplete,
  pendingAccountDeletionCleanups,
} from '../pendingAccountCleanupStore';
import { ensureCurrentProfile } from '../profileService';
import type { AuthState, BackendProfile } from '../types';

jest.mock('../../../config/onlineProfiles', () => ({
  isOnlineProfilesEnabled: jest.fn(() => true),
}));

jest.mock('../authService', () => ({
  clearLocalSession: jest.fn(),
  getCurrentSession: jest.fn(),
  getVerifiedCurrentUser: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  signInWithApple: jest.fn(),
  signInWithEmail: jest.fn(),
  signInWithGoogle: jest.fn(),
  signOut: jest.fn(),
  signUpWithEmail: jest.fn(),
  subscribeToAuthChanges: jest.fn(),
  subscribeToAuthDeepLinks: jest.fn(),
  updatePassword: jest.fn(),
}));

jest.mock('../profileService', () => ({
  ensureCurrentProfile: jest.fn(),
}));

jest.mock('../accountDataService', () => ({
  clearLocalPearlData: jest.fn(),
}));

jest.mock('../accountDeletionService', () => ({
  requestCloudAccountDeletion: jest.fn(),
}));

jest.mock('../pendingAccountCleanupStore', () => ({
  markAccountDeletionConfirmed: jest.fn(),
  markAccountDeletionUncertain: jest.fn(),
  markDeletedAccountCleanupComplete: jest.fn(),
  pendingAccountDeletionCleanups: jest.fn(),
}));

jest.mock('../../observability/sentry', () => ({
  addBreadcrumb: jest.fn(),
  captureError: jest.fn(),
  setUserContext: jest.fn(),
}));

type Renderer = { unmount: () => void };
type TestRendererApi = {
  act: (run: () => void | Promise<void>) => Promise<void>;
  create: (element: React.ReactElement) => Renderer;
};

// react-test-renderer is bundled by jest-expo but has no direct type package
// in this app, so keep the test-only surface deliberately small.
const { act, create } = require('react-test-renderer') as TestRendererApi;

const mockGetCurrentSession = jest.mocked(getCurrentSession);
const mockGetVerifiedCurrentUser = jest.mocked(getVerifiedCurrentUser);
const mockSubscribeToAuthChanges = jest.mocked(subscribeToAuthChanges);
const mockSubscribeToAuthDeepLinks = jest.mocked(subscribeToAuthDeepLinks);
const mockEnsureCurrentProfile = jest.mocked(ensureCurrentProfile);
const mockClearLocalSession = jest.mocked(clearLocalSession);
const mockClearLocalPearlData = jest.mocked(clearLocalPearlData);
const mockRequestCloudAccountDeletion = jest.mocked(requestCloudAccountDeletion);
const mockMarkCleanupComplete = jest.mocked(markDeletedAccountCleanupComplete);
const mockMarkDeletionConfirmed = jest.mocked(markAccountDeletionConfirmed);
const mockMarkDeletionUncertain = jest.mocked(markAccountDeletionUncertain);
const mockPendingCleanups = jest.mocked(pendingAccountDeletionCleanups);

let latestAuth: ReturnType<typeof useAuth> | null = null;
let emitAuthChange: ((state: AuthState) => void) | null = null;

function Probe() {
  latestAuth = useAuth();
  return null;
}

function authStateFor(userId: string): AuthState {
  const user = { id: userId, user_metadata: {} };
  return {
    session: { user, access_token: `token-${userId}` },
    user,
    profile: null,
    loading: false,
    isSignedIn: true,
    isPasswordRecovery: false,
    error: null,
  } as unknown as AuthState;
}

function profileFor(userId: string): BackendProfile {
  return {
    id: userId,
    local_user_id: null,
    full_name: userId,
    birth_year: null,
    sex: null,
    profile_json: null,
    onboarding_json: null,
    preferences_json: null,
    onboarding_completed_at: null,
    created_at: '2026-07-12T10:00:00.000Z',
    updated_at: '2026-07-12T10:00:00.000Z',
  };
}

describe('AuthProvider profile lifecycle', () => {
  beforeAll(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    latestAuth = null;
    emitAuthChange = null;
    mockGetCurrentSession.mockResolvedValue(null);
    mockPendingCleanups.mockResolvedValue([]);
    mockMarkDeletionUncertain.mockResolvedValue(undefined);
    mockMarkDeletionConfirmed.mockResolvedValue(undefined);
    mockMarkCleanupComplete.mockResolvedValue(undefined);
    mockGetVerifiedCurrentUser.mockResolvedValue(null);
    mockSubscribeToAuthChanges.mockImplementation((callback) => {
      emitAuthChange = callback;
      return jest.fn();
    });
    mockSubscribeToAuthDeepLinks.mockReturnValue(jest.fn());
  });

  it('does not let a late profile response from user A overwrite user B', async () => {
    let resolveUserA!: (profile: BackendProfile) => void;
    const userAProfile = new Promise<BackendProfile>((resolve) => {
      resolveUserA = resolve;
    });
    const userBProfile = profileFor('user-b');
    mockEnsureCurrentProfile.mockImplementation((expectedUserId) => {
      if (expectedUserId === 'user-a') return userAProfile;
      if (expectedUserId === 'user-b') return Promise.resolve(userBProfile);
      return Promise.resolve(null);
    });

    let renderer!: Renderer;
    await act(async () => {
      renderer = create(
        <AuthProvider>
          <Probe />
        </AuthProvider>
      );
      await Promise.resolve();
    });

    await act(async () => {
      emitAuthChange?.(authStateFor('user-a'));
      await Promise.resolve();
    });
    await act(async () => {
      emitAuthChange?.(authStateFor('user-b'));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(latestAuth?.user?.id).toBe('user-b');
    expect(latestAuth?.profile).toEqual(userBProfile);

    await act(async () => {
      resolveUserA(profileFor('user-a'));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(latestAuth?.user?.id).toBe('user-b');
    expect(latestAuth?.profile).toEqual(userBProfile);
    expect(mockEnsureCurrentProfile).toHaveBeenCalledWith('user-a');
    expect(mockEnsureCurrentProfile).toHaveBeenCalledWith('user-b');

    await act(async () => renderer.unmount());
  });

  it('keeps a persisted session signed in when its profile read fails', async () => {
    const state = authStateFor('user-a');
    mockGetCurrentSession.mockResolvedValue(state.session);
    mockEnsureCurrentProfile.mockRejectedValue(new Error('profile unavailable'));

    let renderer!: Renderer;
    await act(async () => {
      renderer = create(
        <AuthProvider>
          <Probe />
        </AuthProvider>
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(latestAuth).toMatchObject({
      isSignedIn: true,
      user: { id: 'user-a' },
      profile: null,
      error: null,
    });
    expect(mockEnsureCurrentProfile).toHaveBeenCalledWith('user-a');

    await act(async () => renderer.unmount());
  });

  it('does not let a delayed initial A session overwrite a newer B auth event', async () => {
    let resolveInitial!: (session: AuthState['session']) => void;
    mockGetCurrentSession.mockImplementation(
      () => new Promise((resolve) => { resolveInitial = resolve; })
    );

    let renderer!: Renderer;
    await act(async () => {
      renderer = create(<AuthProvider><Probe /></AuthProvider>);
      await Promise.resolve();
    });
    await act(async () => {
      emitAuthChange?.(authStateFor('user-b'));
      resolveInitial(authStateFor('user-a').session);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(latestAuth?.user?.id).toBe('user-b');
    await act(async () => renderer.unmount());
  });

  it('does not let a delayed initial-session failure sign out a newer B event', async () => {
    let rejectInitial!: (error: Error) => void;
    mockGetCurrentSession.mockImplementation(
      () => new Promise((_resolve, reject) => { rejectInitial = reject; })
    );

    let renderer!: Renderer;
    await act(async () => {
      renderer = create(<AuthProvider><Probe /></AuthProvider>);
      await Promise.resolve();
    });
    await act(async () => {
      emitAuthChange?.(authStateFor('user-b'));
      rejectInitial(new Error('stale initial failure'));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(latestAuth?.user?.id).toBe('user-b');
    expect(latestAuth?.error).toBeNull();
    await act(async () => renderer.unmount());
  });

  it('keeps the deleted account scope mounted when verified local erasure is partial', async () => {
    const userA = authStateFor('user-a');
    mockRequestCloudAccountDeletion.mockResolvedValue({ ok: true });
    mockClearLocalPearlData.mockResolvedValue({
      preferences: true,
      checkups: 0,
      programmeState: false,
      trainingState: false,
      microChecks: 0,
      adherenceState: false,
      sessionFunnels: 0,
      recordings: 0,
      deletedFiles: [],
      failures: [{ area: 'local Pearl files', name: 'preferences.json', error: new Error('busy') }],
    });

    let renderer!: Renderer;
    await act(async () => {
      renderer = create(<AuthProvider><Probe /></AuthProvider>);
      await Promise.resolve();
      await Promise.resolve();
    });
    await act(async () => {
      emitAuthChange?.(userA);
      await Promise.resolve();
    });
    expect(latestAuth).toMatchObject({
      user: { id: 'user-a' },
      session: { access_token: 'token-user-a' },
      isSignedIn: true,
    });

    let result!: Awaited<ReturnType<NonNullable<typeof latestAuth>['deleteAccount']>>;
    await act(async () => {
      result = await (latestAuth as NonNullable<typeof latestAuth>).deleteAccount();
      await Promise.resolve();
    });

    expect(result.failures).toHaveLength(1);
    expect(latestAuth?.user?.id).toBe('user-a');
    expect(latestAuth?.isSignedIn).toBe(true);
    expect(mockMarkDeletionUncertain).toHaveBeenCalledWith('user-a');
    expect(mockMarkDeletionConfirmed).toHaveBeenCalledWith('user-a');
    expect(mockClearLocalSession).not.toHaveBeenCalled();
    await act(async () => renderer.unmount());
  });

  it('retries a confirmed deleted-account cleanup on launch outside the deleted scope', async () => {
    mockPendingCleanups.mockResolvedValue([{
      userId: 'deleted-user',
      remoteState: 'confirmed_deleted',
      localCleanupPending: true,
    }]);
    mockClearLocalPearlData.mockResolvedValue({
      preferences: false,
      checkups: 0,
      programmeState: false,
      trainingState: false,
      microChecks: 0,
      adherenceState: false,
      sessionFunnels: 0,
      recordings: 0,
      deletedFiles: [],
      failures: [],
    });

    let renderer!: Renderer;
    await act(async () => {
      renderer = create(<AuthProvider><Probe /></AuthProvider>);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockClearLocalPearlData).toHaveBeenCalledWith({ userId: 'deleted-user' });
    expect(mockMarkCleanupComplete).toHaveBeenCalledWith('deleted-user');
    await act(async () => renderer.unmount());
  });
});
