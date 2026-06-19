import { supabase } from '../../../lib/supabase';

import { getCurrentSession } from '../authService';
import {
  buildHaleDataExport,
  exportCurrentUserData,
  exportFilenameFor,
  sanitizeForDataExport,
} from '../dataExportService';

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('../authService', () => ({
  getCurrentSession: jest.fn(),
}));

function queryBuilder(data: unknown, error: unknown = null) {
  const builder = {
    select: jest.fn(),
    eq: jest.fn(),
    order: jest.fn(),
    maybeSingle: jest.fn().mockResolvedValue({ data, error }),
    then: (resolve: (value: { data: unknown; error: unknown }) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve({ data, error }).then(resolve, reject),
  };
  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.order.mockReturnValue(builder);
  return builder;
}

describe('Hale data export service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds the versioned export object shape and keeps profile_json', () => {
    const exported = buildHaleDataExport({
      exportedAt: '2026-06-18T12:00:00.000Z',
      appVersion: '0.1.0-test',
      user: { id: 'user-123', email: 'asha@example.com' },
      data: {
        profile: {
          id: 'user-123',
          profile_json: { name: 'Asha' },
          access_token: 'do-not-export',
        },
        movementCheckups: [{ id: 'checkup-1' }],
        movementBlocks: [{ id: 'block-1' }],
        trainingState: { state_json: { progress: { completedSessions: 2 } } },
        trainingSessionCompletions: [{ id: 'session-1' }],
        microChecks: [{ id: 'micro-1' }],
        movementBlockReports: [{ id: 'report-1' }],
      },
    });

    expect(exported).toEqual({
      exportVersion: 1,
      app: 'Hale',
      appVersion: '0.1.0-test',
      exportedAt: '2026-06-18T12:00:00.000Z',
      user: { id: 'user-123', email: 'asha@example.com' },
      data: {
        profile: {
          id: 'user-123',
          profile_json: { name: 'Asha' },
        },
        movementCheckups: [{ id: 'checkup-1' }],
        movementBlocks: [{ id: 'block-1' }],
        trainingState: { state_json: { progress: { completedSessions: 2 } } },
        trainingSessionCompletions: [{ id: 'session-1' }],
        microChecks: [{ id: 'micro-1' }],
        movementBlockReports: [{ id: 'report-1' }],
      },
    });
  });

  it('sanitizes media, local paths, blobs, and credential-like keys', () => {
    const sanitized = sanitizeForDataExport({
      profile_json: { name: 'Asha' },
      video: 'raw-video',
      imageUri: 'file:///private/photo.png',
      frames: [{ x: 1 }],
      poseLandmarks: [{ x: 1 }],
      payloadBase64: 'abc123',
      localFilePath: '/private/hale.json',
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
  });

  it('fails clearly when signed out', async () => {
    (getCurrentSession as jest.Mock).mockResolvedValue(null);

    await expect(exportCurrentUserData()).rejects.toThrow('Sign in to export your Hale data.');
  });

  it('fetches all user-owned export tables with sensible ordering', async () => {
    (getCurrentSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-123', email: 'asha@example.com' },
    });

    const builders: Record<string, ReturnType<typeof queryBuilder>> = {};
    const tableData: Record<string, unknown> = {
      profiles: { id: 'user-123', full_name: 'Asha' },
      movement_checkups: [{ id: 'checkup-1' }],
      movement_blocks: [{ id: 'block-1' }],
      training_state: { user_id: 'user-123', state_json: { ok: true } },
      training_session_completions: [{ id: 'session-1' }],
      micro_checks: [{ id: 'micro-1' }],
      movement_block_reports: [{ id: 'report-1' }],
    };

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      const builder = queryBuilder(tableData[table] ?? []);
      builders[table] = builder;
      return builder;
    });

    const exported = await exportCurrentUserData();

    expect(exported.user).toEqual({ id: 'user-123', email: 'asha@example.com' });
    expect(exported.data.profile).toEqual({ id: 'user-123', full_name: 'Asha' });
    expect(exported.data.movementCheckups).toEqual([{ id: 'checkup-1' }]);
    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(supabase.from).toHaveBeenCalledWith('movement_checkups');
    expect(supabase.from).toHaveBeenCalledWith('movement_blocks');
    expect(supabase.from).toHaveBeenCalledWith('training_state');
    expect(supabase.from).toHaveBeenCalledWith('training_session_completions');
    expect(supabase.from).toHaveBeenCalledWith('micro_checks');
    expect(supabase.from).toHaveBeenCalledWith('movement_block_reports');
    expect(builders.profiles.eq).toHaveBeenCalledWith('id', 'user-123');
    expect(builders.movement_checkups.eq).toHaveBeenCalledWith('user_id', 'user-123');
    expect(builders.movement_checkups.order).toHaveBeenNthCalledWith(1, 'completed_at', { ascending: true });
    expect(builders.movement_checkups.order).toHaveBeenNthCalledWith(2, 'created_at', { ascending: true });
    expect(builders.movement_blocks.order).toHaveBeenNthCalledWith(1, 'started_at', { ascending: true });
    expect(builders.training_session_completions.order).toHaveBeenNthCalledWith(1, 'completed_at', { ascending: true });
    expect(builders.micro_checks.order).toHaveBeenNthCalledWith(1, 'completed_at', { ascending: true });
    expect(builders.movement_block_reports.order).toHaveBeenCalledWith('created_at', { ascending: true });
  });

  it('uses a readable dated export filename', () => {
    expect(exportFilenameFor('2026-06-18T12:00:00.000Z')).toBe('hale-data-export-2026-06-18.json');
  });
});
