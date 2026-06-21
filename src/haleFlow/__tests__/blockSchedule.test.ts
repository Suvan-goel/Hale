import type {
  MovementBlock,
  TrainingFocusStimulusEvidenceSummary,
  TrainingSessionCompletion,
} from '../../adherence';
import {
  BLOCK_SCHEDULE_POLICY_VERSION,
  getBlockScheduleState,
  scheduleCreditForCompletion,
} from '../blockSchedule';

const START = '2026-06-01T08:00:00.000Z';

describe('block schedule policy', () => {
  it('selects the earliest missing A/B/C template while counting out-of-order evidence', () => {
    const b = block();
    const schedule = getBlockScheduleState({
      block: b,
      completions: [completion({ templateId: 'strength-B', plannedDate: 'strength-B:2026-06-01' })],
      today: '2026-06-02T08:00:00.000Z',
    });

    expect(schedule.status).toBe('session_due');
    expect(schedule.creditedTemplateIds).toEqual(['strength-B']);
    expect(schedule.nextTemplateId).toBe('strength-A');
    expect(schedule.totalCredits).toBe(1);
  });

  it('allows only one schedule credit per calendar date', () => {
    const b = block();
    const second = completion({
      id: 'completion-strength-B',
      templateId: 'strength-B',
      plannedDate: 'strength-B:2026-06-01',
      completedAt: '2026-06-01T10:00:00.000Z',
    });
    const schedule = getBlockScheduleState({
      block: b,
      completions: [completion(), second],
      today: '2026-06-02T08:00:00.000Z',
    });

    expect(schedule.totalCredits).toBe(1);
    expect(schedule.creditedTemplateIds).toEqual(['strength-A']);
    expect(schedule.diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ eventId: second.id, reason: 'daily_credit_already_used' })])
    );
    expect(scheduleCreditForCompletion(schedule, second)).toMatchObject({
      policyVersion: BLOCK_SCHEDULE_POLICY_VERSION,
      credited: false,
      status: 'denied',
      reason: 'daily_credit_already_used',
    });
  });

  it('locks the next training week until both seven days and the day after the last credit', () => {
    const b = block();
    const weekOne = [
      completion({ id: 'A1', templateId: 'strength-A', plannedDate: 'strength-A:2026-06-01', completedAt: '2026-06-01T09:00:00.000Z' }),
      completion({ id: 'B1', templateId: 'strength-B', plannedDate: 'strength-B:2026-06-02', completedAt: '2026-06-02T09:00:00.000Z' }),
      completion({ id: 'C1', templateId: 'strength-C', plannedDate: 'strength-C:2026-06-03', completedAt: '2026-06-03T09:00:00.000Z' }),
    ];
    const earlyWeekTwo = completion({
      id: 'A2-early',
      templateId: 'strength-A',
      plannedDate: 'strength-A:2026-06-07',
      completedAt: '2026-06-07T09:00:00.000Z',
    });
    const onUnlock = completion({
      id: 'A2',
      templateId: 'strength-A',
      plannedDate: 'strength-A:2026-06-08',
      completedAt: '2026-06-08T09:00:00.000Z',
    });

    expect(getBlockScheduleState({ block: b, completions: weekOne, today: '2026-06-07T08:00:00.000Z' })).toMatchObject({
      status: 'week_complete_waiting',
      nextUnlockDateKey: '2026-06-08',
      totalCredits: 3,
    });

    const schedule = getBlockScheduleState({
      block: b,
      completions: [...weekOne, earlyWeekTwo, onUnlock],
      today: '2026-06-08T12:00:00.000Z',
    });

    expect(schedule.status).toBe('session_due');
    expect(schedule.currentWeekNumber).toBe(2);
    expect(schedule.totalCredits).toBe(4);
    expect(schedule.creditedTemplateIds).toEqual(['strength-A']);
    expect(schedule.diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ eventId: earlyWeekTwo.id, reason: 'week_locked_until_next_start' })])
    );
  });

  it('does not make re-test due until all four weeks are scheduled and the not-before date arrives', () => {
    const b = block();
    const completions = [
      ...weekCredits(1, '2026-06-01'),
      ...weekCredits(2, '2026-06-08'),
      ...weekCredits(3, '2026-06-15'),
      ...weekCredits(4, '2026-06-22'),
    ];

    expect(getBlockScheduleState({ block: b, completions: [], today: '2026-06-29T08:00:00.000Z' })).toMatchObject({
      status: 'session_due',
      totalCredits: 0,
      lapseState: 'restart_recommended',
    });
    expect(getBlockScheduleState({ block: b, completions, today: '2026-06-24T12:00:00.000Z' })).toMatchObject({
      status: 'training_complete_waiting_retest',
      totalCredits: 12,
      retestNotBeforeDateKey: '2026-06-29',
    });
    expect(getBlockScheduleState({ block: b, completions, today: '2026-06-29T08:00:00.000Z' })).toMatchObject({
      status: 'retest_due',
      totalCredits: 12,
      retestNotBeforeDateKey: '2026-06-29',
    });
  });

  it('pushes the official re-test not-before date to the day after a late final credit', () => {
    const b = block();
    const completions = [
      ...weekCredits(1, '2026-06-01'),
      ...weekCredits(2, '2026-06-08'),
      ...weekCredits(3, '2026-06-15'),
      completion({
        id: 'completion-week-4-A',
        templateId: 'strength-A',
        plannedDate: 'strength-A:2026-06-22',
        completedAt: '2026-06-22T09:00:00.000Z',
      }),
      completion({
        id: 'completion-week-4-B',
        templateId: 'strength-B',
        plannedDate: 'strength-B:2026-06-24',
        completedAt: '2026-06-24T09:00:00.000Z',
      }),
      completion({
        id: 'completion-week-4-C',
        templateId: 'strength-C',
        plannedDate: 'strength-C:2026-06-29',
        completedAt: '2026-06-29T09:00:00.000Z',
      }),
    ];

    expect(getBlockScheduleState({ block: b, completions, today: '2026-06-29T12:00:00.000Z' })).toMatchObject({
      status: 'training_complete_waiting_retest',
      retestNotBeforeDateKey: '2026-06-30',
    });
    expect(getBlockScheduleState({ block: b, completions, today: '2026-06-30T08:00:00.000Z' }).status).toBe('retest_due');
  });

  it('derives active, resume gently, and restart-recommended lapse states from schedule credit dates', () => {
    const b = block();
    expect(getBlockScheduleState({ block: b, completions: [], today: '2026-06-06T08:00:00.000Z' }).lapseState).toBe('active');
    expect(getBlockScheduleState({ block: b, completions: [], today: '2026-06-08T08:00:00.000Z' }).lapseState).toBe('resume_gently');
    expect(getBlockScheduleState({ block: b, completions: [], today: '2026-06-15T08:00:00.000Z' }).lapseState).toBe('restart_recommended');
  });
});

function weekCredits(weekNumber: number, startDateKey: string): TrainingSessionCompletion[] {
  const [year, month, day] = startDateKey.split('-').map(Number);
  const base = Date.UTC(year, month - 1, day, 9);
  return ['A', 'B', 'C'].map((label, index) => {
    const completedAt = new Date(base + index * 86400000).toISOString();
    const dateKey = completedAt.slice(0, 10);
    return completion({
      id: `completion-week-${weekNumber}-${label}`,
      templateId: `strength-${label}`,
      plannedDate: `strength-${label}:${dateKey}`,
      completedAt,
    });
  });
}

function block(overrides: Partial<MovementBlock> = {}): MovementBlock {
  return {
    id: 'movement-block-schedule',
    userId: 'local-device-user',
    status: 'active',
    startDate: START,
    endDate: '2026-06-29T08:00:00.000Z',
    retestDate: '2026-06-29T08:00:00.000Z',
    focusDomain: 'strength_power',
    secondaryDomains: ['balance', 'mobility'],
    sessionsPerWeekTarget: 3,
    totalPlannedSessions: 12,
    completedSessions: 0,
    microChecksCompleted: 0,
    createdAt: START,
    updatedAt: START,
    ...overrides,
  };
}

function completion(overrides: Partial<TrainingSessionCompletion> = {}): TrainingSessionCompletion {
  return {
    id: 'completion-strength-A',
    userId: 'local-device-user',
    blockId: 'movement-block-schedule',
    plannedDate: 'strength-A:2026-06-01',
    completedAt: '2026-06-01T09:00:00.000Z',
    sessionType: 'standard',
    focusDomain: 'strength_power',
    source: 'block_generated',
    templateId: 'strength-A',
    mainPlanCredit: true,
    focusStimulusEvidence: focusEvidence(),
    ...overrides,
  };
}

function focusEvidence(): TrainingFocusStimulusEvidenceSummary {
  return {
    planStatus: 'eligible',
    status: 'credited_focus_work',
    exclusionReason: 'none',
    mainPlanCredit: true,
    blockFocusDomain: 'strength_power',
    plannedPrimaryFocusExerciseCount: 1,
    completedPrimaryFocusExerciseCount: 1,
    completedSupportingExerciseCount: 0,
    completedFallbackExerciseCount: 0,
    completedCrossDomainExerciseCount: 0,
    plannedPrimaryFocusExerciseIds: ['sts-standard'],
    completedPrimaryFocusExerciseIds: ['sts-standard'],
    completedSupportingExerciseIds: [],
    completedFallbackExerciseIds: [],
    completedCrossDomainExerciseIds: [],
    fallbackFocusSlotIds: [],
    skippedFocusSlotIds: [],
    focusStimulusExclusionReasons: [],
    missingMetadataExerciseIds: [],
    malformedMetadataExerciseIds: [],
    focusMismatchExerciseIds: [],
  };
}
