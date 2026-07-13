import { supabase } from '../../../lib/supabase';
import { getCurrentSession } from '../authService';
import { requestCloudAccountDeletion } from '../accountDeletionService';

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
  },
}));

jest.mock('../authService', () => ({
  getCurrentSession: jest.fn(),
}));

jest.mock('../../observability/sentry', () => ({
  addBreadcrumb: jest.fn(),
  captureError: jest.fn(),
}));

const mockGetCurrentSession = jest.mocked(getCurrentSession);
const mockInvoke = jest.mocked(supabase.functions.invoke);

describe('cloud account deletion client', () => {
  beforeEach(() => jest.clearAllMocks());

  const request = {
    expectedUserId: 'user-123',
    expectedAccessToken: 'access-token-a',
  };

  it('requires a signed-in caller before invoking the function', async () => {
    mockGetCurrentSession.mockResolvedValue(null);

    await expect(requestCloudAccountDeletion(request)).rejects.toThrow(/sign in/i);
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('never sends a client-selected user id', async () => {
    mockGetCurrentSession.mockResolvedValue({
      user: { id: 'user-123' },
      access_token: 'access-token-a',
    } as never);
    mockInvoke.mockResolvedValue({ data: { ok: true }, error: null } as never);

    await expect(requestCloudAccountDeletion(request)).resolves.toEqual({ ok: true });
    expect(mockInvoke).toHaveBeenCalledWith('delete-account', {
      body: {},
      headers: { Authorization: 'Bearer access-token-a' },
    });
    expect(JSON.stringify(mockInvoke.mock.calls)).not.toContain('user-123');
  });

  it('rejects an account or token transition before invoking deletion', async () => {
    mockGetCurrentSession.mockResolvedValue({
      user: { id: 'user-b' },
      access_token: 'access-token-b',
    } as never);

    await expect(requestCloudAccountDeletion(request)).rejects.toThrow(/account changed/i);
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('does not report success for a function error or malformed response', async () => {
    mockGetCurrentSession.mockResolvedValue({
      user: { id: 'user-123' },
      access_token: 'access-token-a',
    } as never);
    mockInvoke.mockResolvedValueOnce({ data: null, error: new Error('function unavailable') } as never);
    await expect(requestCloudAccountDeletion(request)).rejects.toThrow('function unavailable');

    mockInvoke.mockResolvedValueOnce({ data: {}, error: null } as never);
    await expect(requestCloudAccountDeletion(request)).rejects.toThrow(/unexpected response/i);
  });

  it('observes a confirmed late response even after the client timeout', async () => {
    jest.useFakeTimers();
    mockGetCurrentSession.mockResolvedValue({
      user: { id: 'user-123' },
      access_token: 'access-token-a',
    } as never);
    let resolveInvoke!: (value: { data: { ok: true }; error: null }) => void;
    mockInvoke.mockReturnValue(new Promise((resolve) => { resolveInvoke = resolve; }) as never);
    const onDeletionConfirmed = jest.fn();

    try {
      const deletion = requestCloudAccountDeletion({ ...request, onDeletionConfirmed });
      const timedOut = expect(deletion).rejects.toThrow(/timed out/i);
      await jest.advanceTimersByTimeAsync(15001);
      await timedOut;

      resolveInvoke({ data: { ok: true }, error: null });
      await Promise.resolve();
      await Promise.resolve();
      expect(onDeletionConfirmed).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });
});
