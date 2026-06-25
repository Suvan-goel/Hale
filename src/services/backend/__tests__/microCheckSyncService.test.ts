import type { MovementBlock, TrainingSessionCompletion } from '../../../adherence';
import type { MicroCheckResult } from '../../../training';
import { supabase } from '../../../lib/supabase';

import { getCurrentSession } from '../authService';
import { mapLocalMicroCheckToRemotePayload, syncMicroCheckToRemote } from '../microCheckSyncService';

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('../authService', () => ({
  getCurrentSession: jest.fn(),
}));

const completedAt = '2026-06-17T12:24:00.000Z';

function microCheck(overrides: Partial<MicroCheckResult> = {}): MicroCheckResult {
  return {
    type: 'chair-power',
    startedAt: completedAt,
    value: 0.42,
    reps: 5,
    measured: true,
    ...overrides,
  };
}

function movementBlock(): MovementBlock {
  return {
    id: 'movement-block-1',
    userId: 'local-device-user',
    status: 'active',
    startDate: '2026-06-17T12:00:00.000Z',
    endDate: '2026-07-15T12:00:00.000Z',
    retestDate: '2026-07-15T12:00:00.000Z',
    focusDomain: 'strength_power',
    secondaryDomains: ['balance', 'mobility'],
    sessionsPerWeekTarget: 3,
    totalPlannedSessions: 12,
    completedSessions: 1,
    microChecksCompleted: 1,
    sourceCheckUpId: '2026-06-17T11:40:00.000Z',
    createdAt: '2026-06-17T12:00:00.000Z',
    updatedAt: completedAt,
  };
}

function completion(): TrainingSessionCompletion {
  return {
    id: 'completion-movement-block-1-micro_check-2026-06-17',
    userId: 'local-device-user',
    blockId: 'movement-block-1',
    completedAt,
    sessionType: 'micro_check',
    focusDomain: 'strength_power',
    durationMinutes: 1,
  };
}

function selectBuilder(data: unknown, error: unknown = null) {
  const builder: {
    select: jest.Mock;
    eq: jest.Mock;
    maybeSingle: jest.Mock;
  } = {
    select: jest.fn(),
    eq: jest.fn(),
    maybeSingle: jest.fn().mockResolvedValue({ data, error }),
  };
  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  return builder;
}

describe('micro-check sync mapping', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps a local micro-check into the remote payload with sanitized result JSON', () => {
    const result = {
      ...microCheck(),
      frames: [{ shouldNotUpload: true }],
      landmarks: [{ shouldNotUpload: true }],
    } as MicroCheckResult;

    const payload = mapLocalMicroCheckToRemotePayload(
      {
        result,
        movementBlock: movementBlock(),
        completion: completion(),
      },
      'user-123',
      { movementBlockId: 'remote-block-123' }
    );

    expect(payload.user_id).toBe('user-123');
    expect(payload.movement_block_id).toBe('remote-block-123');
    expect(payload.local_micro_check_id).toBe('microcheck-2026-06-17T12-24-00-000Z');
    expect(payload.domain).toBe('strength_power');
    expect(payload.completed_at).toBe(completedAt);

    const resultJson = JSON.stringify(payload.result_json);
    expect(resultJson).toContain('rise_velocity');
    expect(payload.result_json).toMatchObject({
      metric: {
        measurementContext: {
          protocol: { protocolId: 'micro_chair_power_5_reps_v1', protocolVersion: 1 },
          side: { role: 'not_applicable' },
        },
      },
      result: {
        measurementContext: {
          comparability: { sideStatus: 'not_side_dependent' },
        },
      },
    });
    expect(resultJson).toContain('movement-block-1');
    expect(resultJson).not.toContain('frames');
    expect(resultJson).not.toContain('landmarks');
    expect(resultJson).not.toContain('shouldNotUpload');
  });

  it('maps each micro-check type to its remote domain', () => {
    expect(
      mapLocalMicroCheckToRemotePayload({ result: microCheck({ type: 'chair-power' }) }, 'user-123').domain
    ).toBe('strength_power');
    expect(
      mapLocalMicroCheckToRemotePayload({ result: microCheck({ type: 'single-leg-balance' }) }, 'user-123').domain
    ).toBe('balance');
    expect(
      mapLocalMicroCheckToRemotePayload({ result: microCheck({ type: 'mobility-reach' }) }, 'user-123').domain
    ).toBe('mobility');
  });

  it('upserts by user and local micro-check id, then skips an unchanged duplicate sync', async () => {
    const upsert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({ upsert });
    (getCurrentSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-123' },
    });

    const input = {
      result: microCheck({ startedAt: '2026-06-17T13:00:00.000Z' }),
      movementBlock: movementBlock(),
      movementBlockRemoteId: 'remote-block-123',
    };

    const first = await syncMicroCheckToRemote(input);
    const second = await syncMicroCheckToRemote(input);

    expect(first.status).toBe('synced');
    expect(second.status).toBe('skipped');
    expect(supabase.from).toHaveBeenCalledWith('micro_checks');
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-123',
        movement_block_id: 'remote-block-123',
        local_micro_check_id: 'microcheck-2026-06-17T13-00-00-000Z',
      }),
      { onConflict: 'user_id,local_micro_check_id' }
    );
  });

  it('resolves movement_block_id from the local movement block id when available', async () => {
    const blockLookup = selectBuilder({ id: 'remote-block-123' });
    const upsert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockImplementation((table: string) =>
      table === 'movement_blocks' ? blockLookup : { upsert }
    );
    (getCurrentSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-123' },
    });

    const result = await syncMicroCheckToRemote({
      result: microCheck({ startedAt: '2026-06-17T14:00:00.000Z' }),
      movementBlock: movementBlock(),
      completion: completion(),
    });

    expect(result.status).toBe('synced');
    expect(blockLookup.eq).toHaveBeenCalledWith('local_block_id', 'movement-block-1');
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        movement_block_id: 'remote-block-123',
      }),
      { onConflict: 'user_id,local_micro_check_id' }
    );
  });
});
