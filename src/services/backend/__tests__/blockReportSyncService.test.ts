import type {
  MovementAssessment,
  MovementBlock,
  MovementBlockReport,
  TrainingSessionCompletion,
} from '../../../adherence';
import { supabase } from '../../../lib/supabase';

import { getCurrentSession } from '../authService';
import { mapLocalBlockReportToRemotePayload, syncMovementBlockReportToRemote } from '../blockReportSyncService';

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('../authService', () => ({
  getCurrentSession: jest.fn(),
}));

const createdAt = '2026-07-15T12:24:00.000Z';

function movementBlock(overrides: Partial<MovementBlock> = {}): MovementBlock {
  return {
    id: 'movement-block-1',
    userId: 'local-device-user',
    status: 'completed',
    startDate: '2026-06-17T12:00:00.000Z',
    endDate: '2026-07-15T12:00:00.000Z',
    retestDate: '2026-07-15T12:00:00.000Z',
    focusDomain: 'strength_power',
    secondaryDomains: ['balance', 'mobility'],
    sessionsPerWeekTarget: 3,
    totalPlannedSessions: 12,
    completedSessions: 12,
    microChecksCompleted: 4,
    sourceAssessmentId: '2026-06-17T11:40:00.000Z',
    createdAt: '2026-06-17T12:00:00.000Z',
    updatedAt: createdAt,
    ...overrides,
  };
}

function assessment(overrides: Partial<MovementAssessment> = {}): MovementAssessment {
  return {
    id: 'assessment-baseline-2026-06-17T11-40-00-000Z',
    userId: 'local-device-user',
    type: 'baseline',
    status: 'completed',
    createdAt: '2026-06-17T11:40:00.000Z',
    completedAt: '2026-06-17T11:50:00.000Z',
    results: {
      strengthPowerScore: 64,
      balanceScore: 61,
      mobilityScore: 63,
      weakestDomain: 'strength_power',
      confidence: 'high',
      rawMetrics: { checkUpId: '2026-06-17T11:40:00.000Z' },
    },
    isOfficialForProgress: true,
    ...overrides,
  };
}

function report(overrides: Partial<MovementBlockReport> = {}): MovementBlockReport {
  return {
    id: 'block-report-movement-block-1',
    userId: 'local-device-user',
    blockId: 'movement-block-1',
    baselineAssessmentId: '2026-06-17T11:40:00.000Z',
    retestAssessmentId: 'assessment-official_retest-2026-07-15T12-00-00-000Z',
    createdAt,
    summary: 'Strength / Power improved during this block.',
    sessionsCompleted: 12,
    totalPlannedSessions: 12,
    microChecksCompleted: 4,
    domainChanges: {
      strength_power: {
        previous: 64,
        current: 58,
        direction: 'improved',
      },
    },
    recommendedNextFocusDomain: 'balance',
    ...overrides,
  };
}

function completion(overrides: Partial<TrainingSessionCompletion> = {}): TrainingSessionCompletion {
  return {
    id: 'completion-movement-block-1-standard-session-1',
    userId: 'local-device-user',
    blockId: 'movement-block-1',
    plannedDate: 'session-1',
    completedAt: '2026-06-19T12:00:00.000Z',
    sessionType: 'standard',
    focusDomain: 'strength_power',
    durationMinutes: 20,
    perceivedEffort: 3,
    painReported: false,
    ...overrides,
  };
}

function selectBuilder(data: unknown, error: unknown = null) {
  const builder: {
    select: jest.Mock;
    eq: jest.Mock;
    contains: jest.Mock;
    limit: jest.Mock;
    maybeSingle: jest.Mock;
  } = {
    select: jest.fn(),
    eq: jest.fn(),
    contains: jest.fn(),
    limit: jest.fn(),
    maybeSingle: jest.fn().mockResolvedValue({ data, error }),
  };
  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.contains.mockReturnValue(builder);
  builder.limit.mockReturnValue(builder);
  return builder;
}

function updateBuilder() {
  const builder: {
    error: null;
    update: jest.Mock;
    eq: jest.Mock;
  } = {
    error: null,
    update: jest.fn(),
    eq: jest.fn(),
  };
  builder.update.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  return builder;
}

describe('movement block report sync mapping', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps a local report into a sanitized remote payload', () => {
    const block = {
      ...movementBlock(),
      videoUri: 'file:///private.mov',
      landmarks: [{ shouldNotUpload: true }],
    } as MovementBlock;
    const unsafeReport = report({
      domainChanges: {
        strength_power: {
          previous: 64,
          current: 58,
          direction: 'improved',
          frames: [{ shouldNotUpload: true }],
        } as never,
      },
    });

    const payload = mapLocalBlockReportToRemotePayload(
      {
        report: unsafeReport,
        movementBlock: block,
        baselineAssessment: assessment(),
        retestAssessment: assessment({
          id: 'assessment-official_retest-2026-07-15T12-00-00-000Z',
          type: 'official_retest',
          createdAt,
          completedAt: createdAt,
          results: {
            strengthPowerScore: 58,
            balanceScore: 59,
            mobilityScore: 62,
            weakestDomain: 'balance',
            confidence: 'high',
            rawMetrics: { checkUpId: '2026-07-15T12:00:00.000Z' },
          },
        }),
        completions: [completion()],
      },
      'user-123',
      {
        movementBlockId: 'remote-block-123',
        fromCheckupId: 'remote-from-checkup',
        toCheckupId: 'remote-to-checkup',
      }
    );

    expect(payload.user_id).toBe('user-123');
    expect(payload.movement_block_id).toBe('remote-block-123');
    expect(payload.from_checkup_id).toBe('remote-from-checkup');
    expect(payload.to_checkup_id).toBe('remote-to-checkup');
    expect(payload.created_at).toBe(createdAt);

    const reportJson = JSON.stringify(payload.report_json);
    expect(reportJson).toContain('block-report-movement-block-1');
    expect(reportJson).toContain('Strength / Power improved');
    expect(reportJson).toContain('completion-movement-block-1-standard-session-1');
    expect(reportJson).not.toContain('videoUri');
    expect(reportJson).not.toContain('landmarks');
    expect(reportJson).not.toContain('frames');
    expect(reportJson).not.toContain('shouldNotUpload');
  });

  it('inserts once when no existing local report row is found', async () => {
    const blockLookup = selectBuilder({ id: 'remote-block-123' });
    const fromLookup = selectBuilder({ id: 'remote-from-checkup' });
    const toLookup = selectBuilder({ id: 'remote-to-checkup' });
    const existingByLocalId = selectBuilder(null);
    const existingByLinks = selectBuilder(null);
    const insert = jest.fn().mockResolvedValue({ error: null });
    let checkupLookupCount = 0;
    let reportLookupCount = 0;

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'movement_blocks') return blockLookup;
      if (table === 'movement_checkups') {
        checkupLookupCount += 1;
        return checkupLookupCount === 1 ? fromLookup : toLookup;
      }
      if (table === 'movement_block_reports') {
        reportLookupCount += 1;
        if (reportLookupCount === 1) return existingByLocalId;
        if (reportLookupCount === 2) return existingByLinks;
        return { insert };
      }
      throw new Error(`unexpected table ${table}`);
    });
    (getCurrentSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-123' },
    });

    const result = await syncMovementBlockReportToRemote({
      report: report({ id: 'block-report-insert-once' }),
      movementBlock: movementBlock(),
      assessments: [
        assessment(),
        assessment({
          id: 'assessment-official_retest-2026-07-15T12-00-00-000Z',
          type: 'official_retest',
          results: {
            confidence: 'high',
            rawMetrics: { checkUpId: '2026-07-15T12:00:00.000Z' },
          },
        }),
      ],
      completions: [completion()],
    });

    expect(result.status).toBe('synced');
    expect(blockLookup.eq).toHaveBeenCalledWith('local_block_id', 'movement-block-1');
    expect(fromLookup.eq).toHaveBeenCalledWith('local_checkup_id', '2026-06-17T11:40:00.000Z');
    expect(toLookup.eq).toHaveBeenCalledWith('local_checkup_id', '2026-07-15T12:00:00.000Z');
    expect(existingByLocalId.contains).toHaveBeenCalledWith('report_json', {
      localReportId: 'block-report-insert-once',
    });
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-123',
        movement_block_id: 'remote-block-123',
        from_checkup_id: 'remote-from-checkup',
        to_checkup_id: 'remote-to-checkup',
      })
    );
  });

  it('updates an existing report row instead of inserting a duplicate', async () => {
    const existingByLocalId = selectBuilder({
      id: 'remote-report-123',
      report_json: {
        localReportId: 'block-report-existing',
        retainedRemoteNote: 'keep',
      },
    });
    const update = updateBuilder();

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'movement_block_reports') {
        if ((supabase.from as jest.Mock).mock.calls.filter(([name]) => name === table).length === 1) {
          return existingByLocalId;
        }
        return update;
      }
      throw new Error(`unexpected table ${table}`);
    });
    (getCurrentSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-123' },
    });

    const result = await syncMovementBlockReportToRemote({
      report: report({ id: 'block-report-existing' }),
      movementBlockRemoteId: 'remote-block-123',
      fromCheckupRemoteId: 'remote-from-checkup',
      toCheckupRemoteId: 'remote-to-checkup',
    });

    expect(result.status).toBe('synced');
    expect(update.update).toHaveBeenCalledWith(
      expect.objectContaining({
        report_json: expect.objectContaining({
          localReportId: 'block-report-existing',
          retainedRemoteNote: 'keep',
        }),
      })
    );
    expect(update.eq).toHaveBeenCalledWith('id', 'remote-report-123');
    expect(update.eq).toHaveBeenCalledWith('user_id', 'user-123');
  });

  it('fails safely instead of inserting when existing-report lookup errors', async () => {
    const existingByLocalId = selectBuilder(null, { message: 'lookup failed' });
    const insert = jest.fn().mockResolvedValue({ error: null });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'movement_block_reports') return existingByLocalId;
      return { insert };
    });
    (getCurrentSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-123' },
    });

    const result = await syncMovementBlockReportToRemote({
      report: report({ id: 'block-report-lookup-fails' }),
      movementBlockRemoteId: 'remote-block-123',
      fromCheckupRemoteId: 'remote-from-checkup',
      toCheckupRemoteId: 'remote-to-checkup',
    });

    expect(result.status).toBe('failed');
    expect(insert).not.toHaveBeenCalled();
  });
});
