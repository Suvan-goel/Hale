const mockScope = {
  setContext: jest.fn(),
  setTag: jest.fn(),
};

jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  withScope: jest.fn((callback: (scope: typeof mockScope) => void) => callback(mockScope)),
  wrap: jest.fn((component) => component),
}));

import * as Sentry from '@sentry/react-native';

import {
  addBreadcrumb,
  captureError,
  initObservability,
  isObservabilityEnabled,
  resetObservabilityForTests,
  sanitizeForObservability,
  setUserContext,
} from '../sentry';

const enabledEnv = {
  EXPO_PUBLIC_ENABLE_SENTRY: '1',
  EXPO_PUBLIC_SENTRY_DSN: 'https://public@example.com/1',
};

describe('Sentry observability helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetObservabilityForTests();
  });

  it('is disabled by default unless both public env vars are present', () => {
    expect(isObservabilityEnabled({})).toBe(false);
    expect(isObservabilityEnabled({ EXPO_PUBLIC_ENABLE_SENTRY: '1' })).toBe(false);
    expect(isObservabilityEnabled({ EXPO_PUBLIC_SENTRY_DSN: 'https://public@example.com/1' })).toBe(false);
    expect(isObservabilityEnabled({ EXPO_PUBLIC_ENABLE_SENTRY: '0', EXPO_PUBLIC_SENTRY_DSN: 'x' })).toBe(false);
    expect(isObservabilityEnabled(enabledEnv)).toBe(true);

    expect(initObservability({})).toBe(false);
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('no-ops safely when disabled', () => {
    captureError(new Error('offline'), { area: 'sync', access_token: 'secret' }, {});
    addBreadcrumb('sync failed', { refresh_token: 'secret' }, {});
    setUserContext({ id: 'user-123', email: 'asha@example.com' }, {});

    expect(Sentry.init).not.toHaveBeenCalled();
    expect(Sentry.captureException).not.toHaveBeenCalled();
    expect(Sentry.addBreadcrumb).not.toHaveBeenCalled();
    expect(Sentry.setUser).not.toHaveBeenCalled();
  });

  it('scrubs sensitive keys and values while keeping safe Pearl JSON fields', () => {
    const sanitized = sanitizeForObservability({
      profile_json: { name: 'Asha' },
      video: 'raw-video',
      imageUri: 'file:///private/photo.png',
      frames: [{ x: 1 }],
      poseLandmarks: [{ x: 1 }],
      payloadBase64: 'abc123',
      password: 'do-not-send',
      nested: {
        refresh_token: 'secret',
        accessToken: 'secret',
        id_token: 'secret',
        clientSecret: 'secret',
        service_role: 'secret',
        regularValue: 'kept',
        attachment: 'data:image/png;base64,abc123',
      },
    });

    const raw = JSON.stringify(sanitized);
    expect(sanitized).toEqual({
      profile_json: { name: 'Asha' },
      nested: {
        regularValue: 'kept',
        attachment: null,
      },
    });
    expect(raw).not.toContain('raw-video');
    expect(raw).not.toContain('file:///private');
    expect(raw).not.toContain('abc123');
    expect(raw).not.toContain('secret');
    expect(raw).not.toContain('do-not-send');
  });

  it('captures enabled errors with scrubbed context', () => {
    const error = new Error('boom');

    captureError(
      error,
      {
        area: 'auth',
        action: 'sign_in_email',
        access_token: 'secret',
        profile_json: { safe: true },
      },
      enabledEnv
    );

    expect(Sentry.init).toHaveBeenCalledWith(expect.objectContaining({
      dsn: enabledEnv.EXPO_PUBLIC_SENTRY_DSN,
      sendDefaultPii: false,
      tracesSampleRate: 0,
    }));
    expect(mockScope.setTag).toHaveBeenCalledWith('area', 'auth');
    expect(mockScope.setTag).toHaveBeenCalledWith('action', 'sign_in_email');
    expect(mockScope.setContext).toHaveBeenCalledWith('pearl', {
      area: 'auth',
      action: 'sign_in_email',
      profile_json: { safe: true },
    });
    expect(Sentry.captureException).toHaveBeenCalledWith(error);
  });

  it('sets user context with user id only', () => {
    initObservability(enabledEnv);

    setUserContext({ id: 'user-123', email: 'asha@example.com' }, enabledEnv);

    expect(Sentry.setUser).toHaveBeenCalledWith({ id: 'user-123' });
    expect(Sentry.setUser).not.toHaveBeenCalledWith(expect.objectContaining({ email: expect.anything() }));

    setUserContext(null, enabledEnv);
    expect(Sentry.setUser).toHaveBeenCalledWith(null);
  });
});
