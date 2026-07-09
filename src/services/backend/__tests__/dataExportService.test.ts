import { BRAND } from '../../../brand';
import { supabase } from '../../../lib/supabase';

import { getCurrentSession } from '../authService';
import {
  buildPearlDataExport,
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

describe('Pearl data export service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds the versioned export object shape and keeps profile_json', () => {
    const exported = buildPearlDataExport({
      exportedAt: '2026-06-18T12:00:00.000Z',
      appVersion: '0.1.0-test',
      user: { id: 'user-123', email: 'asha@example.com' },
      data: {
        profile: {
          id: 'user-123',
          profile_json: { name: 'Asha' },
          access_token: 'do-not-export',
        },
        movementCheckups: [
          {
            id: 'checkup-1',
            derived_scores_json: {
              movementProfileV2Snapshot: {
                kind: 'movement_profile_v2_snapshot',
                snapshotFingerprint: 'mpv2-snapshot-fp',
                sourceSetFingerprint: 'mpv2-source-fp',
              },
              movementProfileV2Assessment: {
                kind: 'movement_profile_v2_assessment',
                assessmentFingerprint: 'mpv2-assessment-fp',
                sourceSnapshotFingerprint: 'mpv2-snapshot-fp',
              },
            },
          },
        ],
        movementBlocks: [{ id: 'block-1' }],
        trainingState: { state_json: { progress: { completedSessions: 2 } } },
        trainingSessionCompletions: [{ id: 'session-1' }],
        microChecks: [{ id: 'micro-1' }],
        movementBlockReports: [{ id: 'report-1' }],
      },
    });

    expect(exported).toEqual({
      exportVersion: 1,
      app: 'Pearl',
      appDisplayName: BRAND.appName,
      appVersion: '0.1.0-test',
      exportedAt: '2026-06-18T12:00:00.000Z',
      user: { id: 'user-123', email: 'asha@example.com' },
      data: {
        profile: {
          id: 'user-123',
          profile_json: { name: 'Asha' },
        },
        movementCheckups: [
          {
            id: 'checkup-1',
            derived_scores_json: {
              movementProfileV2Snapshot: {
                kind: 'movement_profile_v2_snapshot',
                snapshotFingerprint: 'mpv2-snapshot-fp',
                sourceSetFingerprint: 'mpv2-source-fp',
              },
              movementProfileV2Assessment: {
                kind: 'movement_profile_v2_assessment',
                assessmentFingerprint: 'mpv2-assessment-fp',
                sourceSnapshotFingerprint: 'mpv2-snapshot-fp',
              },
            },
          },
        ],
        movementBlocks: [{ id: 'block-1' }],
        trainingState: { state_json: { progress: { completedSessions: 2 } } },
        trainingSessionCompletions: [{ id: 'session-1' }],
        microChecks: [{ id: 'micro-1' }],
        movementBlockReports: [{ id: 'report-1' }],
      },
    });
  });

  it("keeps app: 'Pearl' as the frozen machine format id, independent of the brand token", () => {
    // Founder decision 2026-07-06: old backups must always restore regardless
    // of any future rename — the format id never follows display identity.
    const exported = buildPearlDataExport({
      user: { id: 'user-123', email: undefined },
      data: {
        profile: {},
        movementCheckups: [],
        movementBlocks: [],
        trainingState: {},
        trainingSessionCompletions: [],
        microChecks: [],
        movementBlockReports: [],
      },
    });
    expect(exported.app).toBe('Pearl');
    expect(exported.appDisplayName).toBe(BRAND.appName);
    // Source-level pin: the literal machine id must not be derived from BRAND.
    const source = require('node:fs').readFileSync(
      require('node:path').join(process.cwd(), 'src/services/backend/dataExportService.ts'),
      'utf8'
    );
    expect(source).toMatch(/app: 'Pearl', \/\/ machine format id/);
  });

  it('sanitizes media, local paths, blobs, and credential-like keys', () => {
    const sanitized = sanitizeForDataExport({
      profile_json: { name: 'Asha' },
      video: 'raw-video',
      imageUri: 'file:///private/photo.png',
      frames: [{ x: 1 }],
      poseLandmarks: [{ x: 1 }],
      payloadBase64: 'abc123',
      localFilePath: '/private/pearl.json',
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

  it('omits legacy free-text health notes recursively while preserving structured beta export data', () => {
    const exported = buildPearlDataExport({
      exportedAt: '2026-06-28T12:00:00.000Z',
      user: { id: 'user-123', email: undefined },
      data: {
        profile: {
          id: 'user-123',
          profile_json: {
            exactAge: 60,
            referenceSex: 'female',
            safetyProfile: {
              hasCurrentPain: true,
              painNotes: 'left knee pain after stairs',
              hasRecentInjury: true,
              injuryNotes: 'old ankle injury',
              availableEquipment: ['chair', 'wall'],
              equipmentStatus: 'confirmed',
              movementCapabilities: {
                floorTransfer: { status: 'avoid_for_now' },
                stepUpEnvironment: { status: 'confirmed', lowStableStep: true },
                singleLegBalance: { status: 'confirmed_with_support' },
              },
              nestedLegacy: {
                painNotes: 'nested pain text',
                injuryNotes: 'nested injury text',
                medicalNotes: 'medical free text',
                healthNotes: 'health free text',
                symptoms: 'symptom free text',
              },
            },
          },
        },
        movementCheckups: [
          {
            id: 'checkup-1',
            derived_scores_json: {
              movementProfileV2Snapshot: {
                kind: 'movement_profile_v2_snapshot',
                referenceProfile: {
                  ageAtTest: 60,
                  ageBasis: 'exact_age_at_test',
                  referenceSex: 'female',
                },
                sourceSetFingerprint: 'mpv2-source-fp',
                interpretation: {
                  chair: {
                    percentileRange: {
                      kind: 'range',
                      low: 10,
                      high: 40,
                      sourceId: 'warden-30s-sts',
                      transformId: 'warden-chair-lms-v1',
                      sourceFingerprint: 'warden-source-fp',
                    },
                    details: 'do not export chair free text',
                  },
                },
              },
            },
          },
        ],
        movementBlocks: [{ id: 'block-1', note: 'legacy block note', focus_domain: 'strength_power' }],
        trainingState: {
          state_json: {
            adherence: {
              freeText: 'training health note',
              free_text: 'training snake health note',
              description: 'training description',
              details: 'training details',
              structuredStatus: 'active',
            },
          },
        },
        trainingSessionCompletions: [
          {
            id: 'session-1',
            notes: 'session health note',
            feedback: [
              { note: 'array note object', selectedOption: 'felt_ok' },
              { injuryDescription: 'array injury text', painDescription: 'array pain text' },
            ],
          },
        ],
        microChecks: [{ id: 'micro-1', result_json: { healthNotes: 'micro health text', type: 'chair-power' } }],
        movementBlockReports: [{ id: 'report-1', report_json: { medicalNotes: 'report note', status: 'complete' } }],
      },
    });

    const raw = JSON.stringify(exported);
    expect(raw).not.toMatch(
      /painNotes|injuryNotes|medicalNotes|healthNotes|symptoms|freeText|free_text|description|details|notes|note|injuryDescription|painDescription/
    );
    expect(raw).not.toMatch(
      /left knee pain|old ankle injury|nested pain text|training health note|array note object|micro health text|report note/
    );
    expect(exported.data.profile).toMatchObject({
      profile_json: {
        exactAge: 60,
        referenceSex: 'female',
        safetyProfile: {
          hasCurrentPain: true,
          hasRecentInjury: true,
          availableEquipment: ['chair', 'wall'],
          equipmentStatus: 'confirmed',
          movementCapabilities: {
            floorTransfer: { status: 'avoid_for_now' },
            stepUpEnvironment: { status: 'confirmed', lowStableStep: true },
            singleLegBalance: { status: 'confirmed_with_support' },
          },
        },
      },
    });
    expect(exported.data.movementCheckups[0]).toMatchObject({
      derived_scores_json: {
        movementProfileV2Snapshot: {
          referenceProfile: {
            ageAtTest: 60,
            ageBasis: 'exact_age_at_test',
            referenceSex: 'female',
          },
          sourceSetFingerprint: 'mpv2-source-fp',
          interpretation: {
            chair: {
              percentileRange: {
                kind: 'range',
                low: 10,
                high: 40,
                sourceId: 'warden-30s-sts',
                transformId: 'warden-chair-lms-v1',
                sourceFingerprint: 'warden-source-fp',
              },
            },
          },
        },
      },
    });
    expect(exported.data.trainingState).toMatchObject({
      state_json: { adherence: { structuredStatus: 'active' } },
    });
    expect(exported.data.trainingSessionCompletions[0]).toMatchObject({
      id: 'session-1',
      feedback: [{ selectedOption: 'felt_ok' }, {}],
    });
  });

  it('fails clearly when signed out', async () => {
    (getCurrentSession as jest.Mock).mockResolvedValue(null);

    await expect(exportCurrentUserData()).rejects.toThrow('Sign in to export your Pearl data.');
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
    expect(exportFilenameFor('2026-06-18T12:00:00.000Z')).toBe('pearl-data-export-2026-06-18.json');
  });
});
