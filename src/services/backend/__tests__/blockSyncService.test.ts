import type { MovementBlock } from '../../../adherence';
import type { TrainingBlock, TrainingState } from '../../../training';
import { supabase } from '../../../lib/supabase';

import { getCurrentSession } from '../authService';
import { mapLocalBlockToRemotePayload, syncMovementBlockToRemote } from '../blockSyncService';

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('../authService', () => ({
  getCurrentSession: jest.fn(),
}));

const baseStartedAt = '2026-06-17T12:00:00.000Z';

function movementBlock(overrides: Partial<MovementBlock> = {}): MovementBlock {
  return {
    id: 'movement-block-2026-06-17T120000-000Z',
    userId: 'local-device-user',
    status: 'active',
    startDate: baseStartedAt,
    endDate: '2026-07-15T12:00:00.000Z',
    retestDate: '2026-07-15T12:00:00.000Z',
    focusDomain: 'strength_power',
    secondaryDomains: ['balance', 'mobility'],
    sessionsPerWeekTarget: 3,
    totalPlannedSessions: 12,
    completedSessions: 0,
    microChecksCompleted: 0,
    sourceAssessmentId: '2026-06-17T11:40:00.000Z',
    createdAt: baseStartedAt,
    updatedAt: baseStartedAt,
    ...overrides,
  };
}

function trainingBlock(): TrainingBlock {
  return {
    createdAt: baseStartedAt,
    weeks: 4,
    sessionsPerWeek: 3,
    weakestDomain: 'strength',
    sessions: [
      {
        index: 0,
        week: 1,
        dayOfWeek: 1,
        slots: [
          { slot: 'lower-push', family: 'sit-to-stand' },
          { slot: 'power', family: 'step-up' },
        ],
      },
    ],
  };
}

function trainingState(): Pick<TrainingState, 'block' | 'progress' | 'equipment' | 'planPreferences'> {
  return {
    block: trainingBlock(),
    progress: {
      completedSessions: 2,
      lastSessionAt: '2026-06-19T12:00:00.000Z',
      retestDueAt: null,
    },
    equipment: {
      stair: true,
      band: false,
      miniBand: false,
      load: false,
    },
    planPreferences: {
      preferredIntensity: 'standard',
    },
  };
}

describe('movement block sync mapping', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps local movement and legacy training blocks into an idempotent remote payload', () => {
    const block = {
      ...movementBlock({ status: 'completed', updatedAt: '2026-07-15T12:00:00.000Z' }),
      frames: [{ shouldNotUpload: true }],
      landmarks: [{ shouldNotUpload: true }],
    } as MovementBlock;

    const payload = mapLocalBlockToRemotePayload(
      {
        block,
        trainingBlock: trainingBlock(),
        training: trainingState() as TrainingState,
        blockNumber: 1,
      },
      'user-123',
      { sourceCheckupId: 'remote-checkup-123' }
    );

    expect(payload.user_id).toBe('user-123');
    expect(payload.local_block_id).toBe('movement-block-2026-06-17T120000-000Z');
    expect(payload.source_checkup_id).toBe('remote-checkup-123');
    expect(payload.block_number).toBe(1);
    expect(payload.focus_domain).toBe('strength_power');
    expect(payload.status).toBe('completed');
    expect(payload.started_at).toBe(baseStartedAt);
    expect(payload.completed_at).toBe('2026-07-15T12:00:00.000Z');

    expect(payload.block_json).toBeDefined();
    const blockJson = JSON.stringify(payload.block_json);
    expect(blockJson).toContain('legacyTrainingBlock');
    expect(blockJson).toContain('legacyTrainingProgress');
    expect(blockJson).not.toContain('planPreferences');
    expect(blockJson).not.toContain('frames');
    expect(blockJson).not.toContain('landmarks');
    expect(blockJson).not.toContain('shouldNotUpload');
  });

  it('preserves an existing legacy training block when the current local state only has the movement block', () => {
    const legacyTrainingBlock = trainingBlock();

    const payload = mapLocalBlockToRemotePayload(
      {
        block: movementBlock({ status: 'completed', updatedAt: '2026-07-15T12:00:00.000Z' }),
        training: null,
        blockNumber: 1,
      },
      'user-123',
      {
        existingBlockJson: {
          schemaVersion: 1,
          legacyTrainingBlock: legacyTrainingBlock as never,
          legacyTrainingProgress: {
            completedSessions: 12,
            lastSessionAt: '2026-07-12T12:00:00.000Z',
            retestDueAt: '2026-07-15T12:00:00.000Z',
          },
          equipment: { stair: true, band: false },
        },
      }
    );

    expect(payload.block_json).toEqual(
      expect.objectContaining({
        movementBlock: expect.objectContaining({
          status: 'completed',
        }),
        legacyTrainingBlock,
        legacyTrainingProgress: expect.objectContaining({
          completedSessions: 12,
        }),
      })
    );
  });

  it('upserts by user and local block id, then skips an unchanged duplicate sync', async () => {
    const upsert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({ upsert });
    (getCurrentSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-123' },
    });

    const input = {
      block: movementBlock({ id: 'movement-block-no-source', sourceAssessmentId: undefined }),
      trainingBlock: trainingBlock(),
      training: trainingState() as TrainingState,
      blockNumber: 1,
    };

    const first = await syncMovementBlockToRemote(input);
    const second = await syncMovementBlockToRemote(input);

    expect(first.status).toBe('synced');
    expect(second.status).toBe('skipped');
    expect(supabase.from).toHaveBeenCalledWith('movement_blocks');
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-123',
        local_block_id: 'movement-block-no-source',
        focus_domain: 'strength_power',
      }),
      { onConflict: 'user_id,local_block_id' }
    );
  });
});
