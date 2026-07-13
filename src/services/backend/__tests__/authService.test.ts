import { supabase } from '../../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { Linking } from 'react-native';
import { ensureCurrentProfile } from '../profileService';
import {
  clearLocalSession,
  signInWithEmail,
  signUpWithEmail,
  subscribeToAuthDeepLinks,
  updatePassword,
} from '../authService';

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'pearl://auth/callback'),
}));

jest.mock('expo-auth-session/build/QueryParams', () => ({
  getQueryParams: jest.fn(() => ({ params: {}, errorCode: null })),
}));

jest.mock('expo-apple-authentication', () => ({
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
  isAvailableAsync: jest.fn(),
  signInAsync: jest.fn(),
}));

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getAllKeys: jest.fn(),
    multiRemove: jest.fn(),
  },
}));

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      updateUser: jest.fn(),
      getSession: jest.fn(),
      getUser: jest.fn(),
      signOut: jest.fn(),
      exchangeCodeForSession: jest.fn(),
      setSession: jest.fn(),
    },
  },
}));

jest.mock('../profileService', () => ({
  ensureCurrentProfile: jest.fn(),
  upsertCurrentProfile: jest.fn(),
}));

jest.mock('../../observability/sentry', () => ({
  addBreadcrumb: jest.fn(),
  captureError: jest.fn(),
}));

const mockEnsureCurrentProfile = jest.mocked(ensureCurrentProfile);
const mockSignUp = jest.mocked(supabase.auth.signUp);
const mockSignInWithPassword = jest.mocked(supabase.auth.signInWithPassword);
const mockUpdateUser = jest.mocked(supabase.auth.updateUser);
const mockGetSession = jest.mocked(supabase.auth.getSession);
const mockSignOut = jest.mocked(supabase.auth.signOut);
const mockGetAllKeys = jest.mocked(AsyncStorage.getAllKeys);
const mockMultiRemove = jest.mocked(AsyncStorage.multiRemove);
const mockGetQueryParams = jest.mocked(QueryParams.getQueryParams);
const mockExchangeCodeForSession = jest.mocked(supabase.auth.exchangeCodeForSession);
const mockSetSession = jest.mocked(supabase.auth.setSession);

function authFixture(userId = 'user-a') {
  const user = { id: userId, user_metadata: {} };
  const session = { user };
  return { user, session };
}

describe('auth session/profile separation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // If an auth action accidentally awaits profile storage again, this pins
    // the regression as a rejected successful sign-in.
    mockEnsureCurrentProfile.mockRejectedValue(new Error('profile RLS unavailable'));
  });

  afterEach(() => jest.restoreAllMocks());

  it('returns a valid email session without waiting for profile I/O', async () => {
    const { session, user } = authFixture();
    mockSignInWithPassword.mockResolvedValue({
      data: { session, user },
      error: null,
    } as never);

    await expect(signInWithEmail(' ADA@EXAMPLE.COM ', 'password')).resolves.toMatchObject({
      session,
      user,
      isSignedIn: true,
      profile: null,
      error: null,
    });
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'ada@example.com',
      password: 'password',
    });
    expect(mockEnsureCurrentProfile).not.toHaveBeenCalled();
  });

  it('keeps a confirmed password update successful when profile storage is unavailable', async () => {
    const { session, user } = authFixture();
    mockUpdateUser.mockResolvedValue({ data: { user }, error: null } as never);
    mockGetSession.mockResolvedValue({ data: { session }, error: null } as never);

    await expect(updatePassword('new-password')).resolves.toMatchObject({
      session,
      user,
      isSignedIn: true,
      profile: null,
      error: null,
    });
    expect(mockEnsureCurrentProfile).not.toHaveBeenCalled();
  });

  it('does not claim sign-in before email confirmation creates a session', async () => {
    const { user } = authFixture();
    mockSignUp.mockResolvedValue({ data: { session: null, user }, error: null } as never);

    await expect(signUpWithEmail('ada@example.com', 'password', ' Ada ')).resolves.toMatchObject({
      session: null,
      user,
      isSignedIn: false,
      profile: null,
    });
    expect(mockSignUp).toHaveBeenCalledWith(expect.objectContaining({
      email: 'ada@example.com',
      options: {
        emailRedirectTo: 'pearl://auth/callback',
        data: { full_name: 'Ada' },
      },
    }));
  });

  it('removes persisted Supabase auth keys when local sign-out reports an error', async () => {
    mockSignOut.mockResolvedValue({ error: new Error('network unavailable') } as never);
    mockGetAllKeys.mockResolvedValue([
      'pearl-setting',
      'sb-project-auth-token',
      'sb-project-auth-token-code-verifier',
      'sb-project-auth-token-user',
    ]);
    mockMultiRemove.mockResolvedValue(undefined);

    await expect(clearLocalSession()).resolves.toBeUndefined();
    expect(mockSignOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(mockMultiRemove).toHaveBeenCalledWith([
      'sb-project-auth-token',
      'sb-project-auth-token-code-verifier',
      'sb-project-auth-token-user',
    ]);
  });

  it('ignores unsolicited raw-token callbacks from both initial and live app links', async () => {
    const maliciousUrl =
      'pearl://auth/callback#access_token=attacker&refresh_token=attacker-refresh&type=recovery';
    const liveListener: { current?: (event: { url: string }) => void } = {};
    jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(maliciousUrl);
    jest.spyOn(Linking, 'addEventListener').mockImplementation(((_type: unknown, listener: unknown) => {
      liveListener.current = listener as (event: { url: string }) => void;
      return { remove: jest.fn() };
    }) as never);
    mockGetQueryParams.mockReturnValue({
      params: {
        access_token: 'attacker',
        refresh_token: 'attacker-refresh',
        type: 'recovery',
      },
      errorCode: null,
    } as never);
    const callback = jest.fn();

    const unsubscribe = subscribeToAuthDeepLinks(callback);
    await Promise.resolve();
    await Promise.resolve();
    liveListener.current?.({ url: maliciousUrl });
    await Promise.resolve();
    await Promise.resolve();

    expect(mockSetSession).not.toHaveBeenCalled();
    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
    expect(callback).not.toHaveBeenCalled();
    unsubscribe();
  });

  it('exchanges a PKCE recovery code and never imports bearer tokens from the URL', async () => {
    const recoveryUrl = 'pearl://auth/callback?code=one-time-code&type=recovery';
    const { session } = authFixture();
    jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(recoveryUrl);
    jest.spyOn(Linking, 'addEventListener').mockReturnValue({ remove: jest.fn() } as never);
    mockGetQueryParams.mockReturnValue({
      params: { code: 'one-time-code', type: 'recovery' },
      errorCode: null,
    } as never);
    mockExchangeCodeForSession.mockResolvedValue({
      data: { session },
      error: null,
    } as never);
    const callback = jest.fn();

    const unsubscribe = subscribeToAuthDeepLinks(callback);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('one-time-code');
    expect(mockSetSession).not.toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({ isSignedIn: true, isPasswordRecovery: true })
    );
    unsubscribe();
  });
});
