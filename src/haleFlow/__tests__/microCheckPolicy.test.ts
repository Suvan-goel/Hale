import type {
  MovementBlock,
  TrainingFocusStimulusEvidenceSummary,
  TrainingSessionCompletion,
} from '../../adherence';
import { getBlockScheduleState } from '../blockSchedule';
import {
  getBlockMicroCheckTarget,
  microCheckSlotMetadataFromTarget,
} from '../microCheckPolicy';

const START = '2026-06-01T08:00:00.000Z';

describe('H5B micro-check policy', () => {
  it('uses the current scheduler week and one credited main-plan session for domain blocks', () => {
    const b = block({ focusDomain: 'strength_power', focus: { kind: 'domain', domain: 'strength_power' } });
    const noCreditSchedule = scheduleFor(b, [], '2026-06-02T08:00:00.000Z');
    expect(getBlockMicroCheckTarget({ block: b, schedule: noCreditSchedule, completions: [] })).toMatchObject({
      status: 'not_available',
      reason: 'week_not_started',
    });

    const oneCredit = [completion(b, 'strength-A', '2026-06-02T08:00:00.000Z')];
    const target = getBlockMicroCheckTarget({
      block: b,
      schedule: scheduleFor(b, oneCredit, '2026-06-03T08:00:00.000Z'),
      completions: oneCredit,
    });

    expect(target).toMatchObject({
      status: 'available',
      scheduleWeekNumber: 1,
      targetSource: 'domain_focus',
      targetDomain: 'strength_power',
      microCheckType: 'chair-power',
    });
  });

  it('suppresses the micro-check after the current schedule week is complete', () => {
    const b = block({ focusDomain: 'balance', focus: { kind: 'domain', domain: 'balance' } });
    const completions = [
      completion(b, 'balance-A', '2026-06-02T08:00:00.000Z'),
      completion(b, 'balance-B', '2026-06-04T08:00:00.000Z'),
      completion(b, 'balance-C', '2026-06-06T08:00:00.000Z'),
    ];

    expect(
      getBlockMicroCheckTarget({
        block: b,
        schedule: scheduleFor(b, completions, '2026-06-06T12:00:00.000Z'),
        completions,
      })
    ).toMatchObject({ status: 'not_available', reason: 'week_complete' });
  });

  it('rotates Balanced blocks by authoritative schedule week without fake focusDomain', () => {
    const b = balancedBlock();

    const week1 = [completion(b, 'balanced-A', '2026-06-02T08:00:00.000Z')];
    expect(targetFor(b, week1, '2026-06-03T08:00:00.000Z')).toMatchObject({
      status: 'available',
      scheduleWeekNumber: 1,
      targetSource: 'balanced_schedule_rotation',
      targetDomain: 'strength_power',
      microCheckType: 'chair-power',
    });

    const week2 = [
      ...weekCredits(b, 1, '2026-06-01'),
      completion(b, 'balanced-A', '2026-06-08T08:00:00.000Z', 'week-2-A'),
    ];
    expect(targetFor(b, week2, '2026-06-09T08:00:00.000Z')).toMatchObject({
      status: 'available',
      scheduleWeekNumber: 2,
      targetDomain: 'balance',
      microCheckType: 'single-leg-balance',
    });

    const week3 = [
      ...weekCredits(b, 1, '2026-06-01'),
      ...weekCredits(b, 2, '2026-06-08'),
      completion(b, 'balanced-A', '2026-06-15T08:00:00.000Z', 'week-3-A'),
    ];
    expect(targetFor(b, week3, '2026-06-16T08:00:00.000Z')).toMatchObject({
      status: 'available',
      scheduleWeekNumber: 3,
      targetDomain: 'mobility',
      microCheckType: 'mobility-reach',
    });
  });

  it('keeps Balanced week 4 for the official retest instead of adding a micro-check', () => {
    const b = balancedBlock();
    const completions = [
      ...weekCredits(b, 1, '2026-06-01'),
      ...weekCredits(b, 2, '2026-06-08'),
      ...weekCredits(b, 3, '2026-06-15'),
      completion(b, 'balanced-A', '2026-06-22T08:00:00.000Z', 'week-4-A'),
    ];

    expect(targetFor(b, completions, '2026-06-23T08:00:00.000Z')).toMatchObject({
      status: 'not_available',
      reason: 'balanced_week_4_official_retest',
      scheduleWeekNumber: 4,
    });
  });

  it('uses stable slot identity and does not let legacy same-day checks satisfy the slot', () => {
    const b = balancedBlock();
    const completions = [
      ...weekCredits(b, 1, '2026-06-01'),
      completion(b, 'balanced-A', '2026-06-08T08:00:00.000Z', 'week-2-A'),
      {
        ...completion(b, 'balanced-B', '2026-06-08T09:00:00.000Z', 'legacy-micro'),
        sessionType: 'micro_check' as const,
        templateId: undefined,
        plannedDate: 'legacy-micro-check',
        source: undefined,
        mainPlanCredit: false,
        focusStimulusEvidence: undefined,
      },
    ];
    const initial = targetFor(b, completions, '2026-06-09T08:00:00.000Z');
    expect(initial).toMatchObject({
      status: 'available',
      targetDomain: 'balance',
      microCheckType: 'single-leg-balance',
    });
    if (initial.status !== 'available') throw new Error('Expected micro-check target');

    const completedSlot = {
      ...completion(b, 'balanced-B', '2026-06-09T09:00:00.000Z', 'slot-micro'),
      sessionType: 'micro_check' as const,
      templateId: undefined,
      plannedDate: initial.slotId,
      source: undefined,
      mainPlanCredit: false,
      focusStimulusEvidence: undefined,
      microCheckSlot: microCheckSlotMetadataFromTarget(initial),
    };

    const afterSlotCompletion = getBlockMicroCheckTarget({
      block: b,
      schedule: scheduleFor(b, completions, '2026-06-09T12:00:00.000Z'),
      completions: [...completions, completedSlot],
    });

    expect(afterSlotCompletion).toMatchObject({
      status: 'not_available',
      reason: 'slot_already_completed',
      scheduleWeekNumber: 2,
    });
  });
});

function targetFor(block: MovementBlock, completions: TrainingSessionCompletion[], today: string) {
  return getBlockMicroCheckTarget({
    block,
    schedule: scheduleFor(block, completions, today),
    completions,
  });
}

function scheduleFor(block: MovementBlock, completions: TrainingSessionCompletion[], today: string) {
  return getBlockScheduleState({ block, completions, today });
}

function weekCredits(block: MovementBlock, weekNumber: number, startDateKey: string): TrainingSessionCompletion[] {
  return ['A', 'B', 'C'].map((label, index) => {
    const completedAt = addDays(startDateKey, index);
    return completion(block, `${templatePrefix(block)}-${label}`, `${completedAt}T08:00:00.000Z`, `week-${weekNumber}-${label}`);
  });
}

function block(overrides: Partial<MovementBlock> = {}): MovementBlock {
  return {
    id: 'movement-block-h5b',
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

function balancedBlock(): MovementBlock {
  return block({
    focusDomain: undefined,
    focus: {
      kind: 'balanced',
      balancedPolicyVersion: 1,
      balancedPolicyFingerprint: 'balanced-policy-test',
    },
    templateIds: ['balanced-A', 'balanced-B', 'balanced-C'],
  });
}

function completion(
  block: MovementBlock,
  templateId: string,
  completedAt: string,
  id = templateId
): TrainingSessionCompletion {
  return {
    id: `completion-${id}-${completedAt.slice(0, 10)}`,
    userId: 'local-device-user',
    blockId: block.id,
    plannedDate: `${templateId}:${completedAt.slice(0, 10)}`,
    completedAt,
    sessionType: 'standard',
    focusDomain: block.focusDomain,
    source: 'block_generated',
    templateId,
    mainPlanCredit: true,
    focusStimulusEvidence: focusEvidence(block),
  };
}

function focusEvidence(block: MovementBlock): TrainingFocusStimulusEvidenceSummary {
  return {
    planStatus: 'eligible',
    status: 'credited_focus_work',
    exclusionReason: 'none',
    mainPlanCredit: true,
    blockFocusDomain: block.focusDomain,
    plannedPrimaryFocusExerciseCount: 1,
    completedPrimaryFocusExerciseCount: 1,
    completedSupportingExerciseCount: 0,
    completedFallbackExerciseCount: 0,
    completedCrossDomainExerciseCount: 0,
    plannedPrimaryFocusExerciseIds: ['primary'],
    completedPrimaryFocusExerciseIds: ['primary'],
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

function templatePrefix(block: MovementBlock): 'balanced' | 'strength' | 'balance' | 'mobility' {
  if (block.focus?.kind === 'balanced') return 'balanced';
  if (block.focusDomain === 'balance') return 'balance';
  if (block.focusDomain === 'mobility') return 'mobility';
  return 'strength';
}

function addDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}
