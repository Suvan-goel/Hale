import {
  clearLocalHaleData,
} from '../accountDataService';
import {
  buildHaleDataExport,
} from '../dataExportService';
import {
  mapRemoteMicroChecksToLocal,
} from '../restoreService';
import {
  mapLocalMicroCheckToRemotePayload,
} from '../microCheckSyncService';
import {
  createMemoryFs,
} from '../../../history';
import {
  makeTrainingSessionCompletion,
  type MovementBlock,
  type TrainingMicroCheckSlotMetadata,
  type TrainingSessionCompletion,
} from '../../../adherence';
import {
  TrainingStore,
  type MicroCheckResult,
} from '../../../training';

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('../authService', () => ({
  getCurrentSession: jest.fn(),
}));

const USER_ID = 'local-device-user';
const START = '2026-06-01T08:00:00.000Z';
const SLOT_ID = 'micro-check:movement-block-h5b1:week-2:balanced_schedule_rotation:balance:single-leg-balance:policy-1:test';

describe('H5B.1 micro-check persistence, sync, restore, export, and account clear', () => {
  it('round-trips slot metadata locally and preserves the first accepted same-slot result', async () => {
    const files = new Map<string, string>();
    const store = new TrainingStore(createMemoryFs(files));
    store.saveMicroCheck(result({ value: 18, startedAt: '2026-06-10T09:00:00.000Z' }));
    store.saveMicroCheck(result({ value: 21, startedAt: '2026-06-10T09:05:00.000Z' }));

    const restored = await new TrainingStore(createMemoryFs(files)).loadMicroChecks();

    expect(restored).toHaveLength(1);
    expect(restored[0]).toMatchObject({
      id: SLOT_ID,
      slotId: SLOT_ID,
      blockId: 'movement-block-h5b1',
      policyVersion: 1,
      policyFingerprint: 'policy-h5b1',
      targetSource: 'balanced_schedule_rotation',
      targetDomain: 'balance',
      scheduleWeekIndex: 1,
      scheduleWeekNumber: 2,
      type: 'single-leg-balance',
      value: 18,
    });
  });

  it('uses slot-first backend identity and excludes private/raw payload fields', () => {
    const payload = mapLocalMicroCheckToRemotePayload(
      {
        result: {
          ...result(),
          frames: [{ shouldNotUpload: true }],
          landmarks: [{ shouldNotUpload: true }],
          localFileUri: 'file:///private/hale/raw.json',
          access_token: 'secret-token',
        } as MicroCheckResult,
        movementBlock: block(),
        completion: completion(),
      },
      'user-123',
      { movementBlockId: 'remote-block-h5b1' }
    );

    expect(payload.local_micro_check_id).toMatch(/^microcheck-slot-/);
    expect(payload.movement_block_id).toBe('remote-block-h5b1');
    expect(payload.domain).toBe('balance');
    expect(payload.result_json).toMatchObject({
      result: {
        slotId: SLOT_ID,
        targetSource: 'balanced_schedule_rotation',
        targetDomain: 'balance',
        scheduleWeekNumber: 2,
      },
      completion: {
        microCheckSlot: {
          slotId: SLOT_ID,
          targetDomain: 'balance',
          microCheckType: 'single-leg-balance',
        },
      },
    });
    const serialized = JSON.stringify(payload.result_json);
    expect(serialized).not.toContain('frames');
    expect(serialized).not.toContain('landmarks');
    expect(serialized).not.toContain('shouldNotUpload');
    expect(serialized).not.toContain('file:///private');
    expect(serialized).not.toContain('secret-token');
  });

  it('dedupes restored remote rows by slot and rejects malformed target rows', () => {
    const restored = mapRemoteMicroChecksToLocal([
      remoteRow(result({ value: 18 })),
      remoteRow(result({ value: 18, startedAt: '2026-06-10T09:05:00.000Z' })),
      remoteRow({ ...result(), type: 'unknown-type' } as unknown as MicroCheckResult),
    ] as never);

    expect(restored).toHaveLength(1);
    expect(restored[0]).toMatchObject({
      slotId: SLOT_ID,
      type: 'single-leg-balance',
      value: 18,
    });
  });

  it('exports bounded micro-check metadata and account clear removes local slot files', async () => {
    const exportData = buildHaleDataExport({
      user: { id: 'user-123', email: 'hale@example.test' },
      exportedAt: '2026-06-25T12:00:00.000Z',
      data: {
        profile: {},
        movementCheckups: [],
        movementBlocks: [],
        trainingState: {},
        trainingSessionCompletions: [],
        microChecks: [
          {
            result_json: {
              result: result() as never,
              frames: [{ shouldNotExport: true }],
              fileUri: 'file:///private/hale/micro.json',
              provider_token: 'secret-token',
            },
          },
        ],
        movementBlockReports: [],
      },
    });

    const exported = JSON.stringify(exportData);
    expect(exported).toContain(SLOT_ID);
    expect(exported).not.toContain('frames');
    expect(exported).not.toContain('shouldNotExport');
    expect(exported).not.toContain('file:///private');
    expect(exported).not.toContain('secret-token');

    const files = new Map<string, string>([
      ['microcheck-slot.json', '{}'],
      ['training-state.json', '{}'],
      ['adherence-state.json', '{}'],
    ]);
    const clearResult = await clearLocalHaleData({
      fs: createMemoryFs(files),
      recordings: memoryArea(new Set()),
    });

    expect(clearResult.failures).toHaveLength(0);
    expect(clearResult.deletedFiles).toEqual(
      expect.arrayContaining([
        'local Hale files/microcheck-slot.json',
        'local Hale files/training-state.json',
        'local Hale files/adherence-state.json',
      ])
    );
    expect(Array.from(files.keys())).toEqual([]);
  });
});

function result(overrides: Partial<MicroCheckResult> = {}): MicroCheckResult {
  return {
    id: SLOT_ID,
    type: 'single-leg-balance',
    startedAt: '2026-06-10T09:00:00.000Z',
    completedAt: '2026-06-10T09:01:00.000Z',
    slotId: SLOT_ID,
    blockId: 'movement-block-h5b1',
    policyVersion: 1,
    policyFingerprint: 'policy-h5b1',
    targetSource: 'balanced_schedule_rotation',
    targetDomain: 'balance',
    scheduleWeekIndex: 1,
    scheduleWeekNumber: 2,
    value: 18,
    reps: 0,
    measured: true,
    ...overrides,
  };
}

function slot(): TrainingMicroCheckSlotMetadata {
  return {
    slotId: SLOT_ID,
    policyVersion: 1,
    policyFingerprint: 'policy-h5b1',
    targetSource: 'balanced_schedule_rotation',
    targetDomain: 'balance',
    microCheckType: 'single-leg-balance',
    scheduleWeekIndex: 1,
    scheduleWeekNumber: 2,
  };
}

function completion(): TrainingSessionCompletion {
  return makeTrainingSessionCompletion({
    block: block(),
    sessionType: 'micro_check',
    completedAt: '2026-06-10T09:01:00.000Z',
    plannedDate: SLOT_ID,
    mainPlanCredit: false,
    microCheckSlot: slot(),
  });
}

function block(): MovementBlock {
  return {
    id: 'movement-block-h5b1',
    userId: USER_ID,
    status: 'active',
    startDate: START,
    endDate: '2026-06-29T08:00:00.000Z',
    retestDate: '2026-06-29T08:00:00.000Z',
    focus: {
      kind: 'balanced',
      balancedPolicyVersion: 1,
      balancedPolicyFingerprint: 'balanced-policy-h5b1',
    },
    templateIds: ['balanced-A', 'balanced-B', 'balanced-C'],
    secondaryDomains: ['strength_power', 'balance', 'mobility'],
    sessionsPerWeekTarget: 3,
    totalPlannedSessions: 12,
    completedSessions: 1,
    microChecksCompleted: 1,
    createdAt: START,
    updatedAt: '2026-06-10T09:01:00.000Z',
  };
}

function remoteRow(localResult: MicroCheckResult) {
  return {
    result_json: {
      result: localResult,
    },
    completed_at: localResult.completedAt ?? localResult.startedAt,
    created_at: localResult.completedAt ?? localResult.startedAt,
  };
}

function memoryArea(files: Set<string>) {
  return {
    list: () => Array.from(files),
    delete: (name: string) => {
      files.delete(name);
    },
  };
}
