import type {
  LegacyV1MovementBlockReport,
  MovementAssessment,
  MovementBlock,
  MovementBlockReport,
  MovementProfileV2BlockReport,
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
    sourceCheckUpId: '2026-06-17T11:40:00.000Z',
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

function report(overrides: Partial<LegacyV1MovementBlockReport> = {}): MovementBlockReport {
  return {
    id: 'block-report-movement-block-1',
    userId: 'local-device-user',
    blockId: 'movement-block-1',
    baselineAssessmentId: '2026-06-17T11:40:00.000Z',
    retestAssessmentId: 'assessment-official_retest-2026-07-15T12-00-00-000Z',
    createdAt,
    summary: 'Strength / Power changed during this block.',
    sessionsCompleted: 12,
    totalPlannedSessions: 12,
    microChecksCompleted: 4,
    domainChanges: {
      strength_power: {
        previous: 64,
        current: 58,
        direction: 'recorded_lower',
      },
    },
    recommendedNextFocusDomain: 'balance',
    ...overrides,
  };
}

function v2Report(overrides: Partial<MovementProfileV2BlockReport> = {}): MovementProfileV2BlockReport {
  const prior = {
    checkUpId: '2026-06-01T08:00:00.000Z',
    snapshotId: 'movement-profile-v2-snapshot:2026-06-01',
    snapshotFingerprint: 'snapshot-prior',
    assessmentId: 'movement-profile-v2-assessment:2026-06-01',
    assessmentFingerprint: 'assessment-prior',
    completedAt: '2026-06-01T08:00:00.000Z',
  };
  const current = {
    checkUpId: '2026-06-29T08:00:00.000Z',
    snapshotId: 'movement-profile-v2-snapshot:2026-06-29',
    snapshotFingerprint: 'snapshot-current',
    assessmentId: 'movement-profile-v2-assessment:2026-06-29',
    assessmentFingerprint: 'assessment-current',
    completedAt: '2026-06-29T08:00:00.000Z',
  };
  return {
    kind: 'movement_profile_v2_block_report',
    schemaVersion: 1,
    reportPolicyVersion: 1,
    reportPolicyFingerprint: 'report-policy',
    reportFingerprint: 'report-fingerprint',
    id: 'block-report-movement-block-v2',
    userId: 'local-device-user',
    blockId: 'movement-block-v2',
    baselineAssessmentId: prior.assessmentId,
    retestAssessmentId: current.assessmentId,
    createdAt,
    summary: 'You completed the plan and finished your next Movement Check-Up.',
    sessionsCompleted: 12,
    totalPlannedSessions: 12,
    microChecksCompleted: 0,
    priorBlock: {
      blockId: 'movement-block-v2',
      focus: { kind: 'domain', domain: 'balance' },
    },
    prior,
    current,
    comparison: {
      kind: 'movement_profile_v2_retest_comparison',
      schemaVersion: 1,
      comparisonPolicyVersion: 1,
      comparisonPolicyFingerprint: 'comparison-policy',
      comparisonId: 'comparison-v2',
      comparisonFingerprint: 'comparison-fingerprint',
      prior,
      current,
      domains: {
        strength_power: {
          status: 'raw_comparable',
          previousValue: 12,
          currentValue: 13,
          unit: 'reps',
          metricLabel: 'Chair-rise capacity',
          referenceComparable: true,
          reasonCodes: [],
        },
        balance: {
          status: 'raw_comparable',
          previousValue: 21,
          currentValue: 24,
          unit: 'seconds',
          metricLabel: 'Balance hold',
          referenceComparable: true,
          reasonCodes: [],
        },
        mobility: {
          status: 'raw_comparable',
          previousValue: 141,
          currentValue: 144,
          unit: 'degrees',
          metricLabel: 'Shoulder reach',
          referenceComparable: true,
          reasonCodes: [],
        },
      },
      overallStatus: 'comparable',
    },
    scheduleSummary: {
      trainingWeeks: 4,
      scheduleCredits: 12,
      blockStartDate: '2026-06-01T09:00:00.000Z',
      retestEligibilityDateKey: '2026-06-29',
    },
    priorSuggestedFocus: { kind: 'domain', domain: 'balance' },
    currentSuggestedFocus: { kind: 'balanced', balancedPolicyVersion: 1, balancedPolicyFingerprint: 'balanced-policy' },
    nextBlock: {
      blockId: 'movement-block-v2-next',
      focus: { kind: 'balanced', balancedPolicyVersion: 1, balancedPolicyFingerprint: 'balanced-policy' },
    },
    displayCopy: {
      headline: 'Your 4-week block is complete',
      body: 'You completed the plan and finished your next Movement Check-Up.',
      nextPlanTitle: 'Your next 4-week plan is ready',
      nextPlanBody: 'Hale prepared it from your latest Movement Profile.',
      nextPlanCta: 'View my next 4-week plan',
    },
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
          direction: 'recorded_lower',
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
    expect(payload).not.toHaveProperty('local_report_id');
    expect(payload.report_json).toEqual(
      expect.objectContaining({
        localReportId: 'block-report-movement-block-1',
      })
    );

    const reportJson = JSON.stringify(payload.report_json);
    expect(reportJson).toContain('block-report-movement-block-1');
    expect(reportJson).toContain('Strength / Power changed');
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
    expect(existingByLocalId.eq).toHaveBeenCalledWith('local_report_id', 'block-report-insert-once');
    expect(existingByLocalId.contains).not.toHaveBeenCalled();
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

  it('uses V2 prior and current check-up ids for remote report links', async () => {
    const blockLookup = selectBuilder({ id: 'remote-block-v2' });
    const fromLookup = selectBuilder({ id: 'remote-prior-checkup' });
    const toLookup = selectBuilder({ id: 'remote-current-checkup' });
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
      report: v2Report(),
      movementBlock: movementBlock({ id: 'movement-block-v2' }),
      completions: [],
    });

    expect(result.status).toBe('synced');
    expect(fromLookup.eq).toHaveBeenCalledWith('local_checkup_id', '2026-06-01T08:00:00.000Z');
    expect(toLookup.eq).toHaveBeenCalledWith('local_checkup_id', '2026-06-29T08:00:00.000Z');
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        from_checkup_id: 'remote-prior-checkup',
        to_checkup_id: 'remote-current-checkup',
        report_json: expect.objectContaining({
          report: expect.objectContaining({
            kind: 'movement_profile_v2_block_report',
            displayCopy: expect.objectContaining({
              nextPlanCta: 'View my next 4-week plan',
            }),
          }),
          displayCopy: expect.objectContaining({
            title: 'Your 4-week block is complete',
          }),
        }),
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
    expect(existingByLocalId.eq).toHaveBeenCalledWith('local_report_id', 'block-report-existing');
    expect(existingByLocalId.contains).not.toHaveBeenCalled();
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

  it('generates a stable fallback localReportId when the local report id is missing', () => {
    const payload = mapLocalBlockReportToRemotePayload(
      {
        report: report({ id: ' ' }),
        movementBlock: movementBlock(),
      },
      'user-123'
    );

    expect(payload.report_json).toEqual(
      expect.objectContaining({
        localReportId: expect.stringMatching(/^block-report-/),
      })
    );
    expect(JSON.stringify(payload.report_json)).not.toContain('"localReportId":" "');
  });
});
