import type { MovementBlock, MovementDomain, TrainingSessionCompletion } from '../../adherence';
import { requiredMainPlanTemplatesForBlock } from '../../haleFlow';
import {
  buildProgressNextCheckUpCard,
  buildProgressPlanSummaryCard,
  progressPracticeStatusLabel,
  progressSummaryStatusLabel,
} from '../progressProductPresentation';

describe('Progress product presentation helpers', () => {
  it('maps every domain onto one plain status vocabulary', () => {
    // Strength percentiles follow the engine's own cut-offs (high <= 25, <= 40, <= 60).
    expect(progressSummaryStatusLabel(domainCard('strength_power', 'Below the 10th percentile'))).toBe('Starting point');
    expect(progressSummaryStatusLabel(domainCard('strength_power', 'Around the 10th-40th percentile'))).toBe('Building');
    expect(progressSummaryStatusLabel(domainCard('strength_power', 'Around the 40th-60th percentile'))).toBe('On track');
    expect(progressSummaryStatusLabel(domainCard('strength_power', 'Around the 60th-90th percentile'))).toBe('Strong');
    expect(progressSummaryStatusLabel(domainCard('strength_power', 'Above the 90th percentile'))).toBe('Strong');
    expect(progressSummaryStatusLabel(domainCard('strength_power', 'Typical range saved'))).toBe('Saved result');
    // Balance and mobility land on the same tiers.
    expect(progressSummaryStatusLabel(domainCard('balance', 'Full 45-second hold completed'))).toBe('Strong');
    expect(progressSummaryStatusLabel(domainCard('balance', 'Typical range saved'))).toBe('On track');
    expect(progressSummaryStatusLabel(domainCard('balance', 'Building the hold'))).toBe('Building');
    expect(progressSummaryStatusLabel(domainCard('balance', 'A clear place to build'))).toBe('Starting point');
    expect(progressSummaryStatusLabel(domainCard('mobility', 'Above typical range'))).toBe('Strong');
    expect(progressSummaryStatusLabel(domainCard('mobility', 'Within typical range'))).toBe('On track');
    expect(progressSummaryStatusLabel(domainCard('mobility', 'Below typical range'))).toBe('Building');
    expect(progressSummaryStatusLabel(domainCard('mobility', 'Saved result'))).toBe('Saved result');
  });

  it('uses short practice statuses that fit the Progress row treatment', () => {
    expect(progressPracticeStatusLabel('Ready for next step')).toBe('Ready');
    expect(progressPracticeStatusLabel('Same level for now')).toBe('Building');
    expect(progressPracticeStatusLabel('Recently included')).toBe('Building');
    expect(progressPracticeStatusLabel('Available in plan')).toBe('Available');
  });

  it('shows the date-gated next check-up from the V2 block schedule', () => {
    const block = movementBlock();
    expect(
      buildProgressNextCheckUpCard({
        hasReadyProfile: true,
        activeBlock: block,
        reports: [],
        completions: [],
        today: '2026-06-23T08:00:00.000Z',
      })
    ).toEqual({
      title: 'Your next check-up',
      lead: 'In 6 days.',
      body: 'Hale will guide your next Movement Check-Up when your 4-week plan is ready to review.',
    });
  });

  it('shows due-now next check-up copy only when the scheduler opens the official retest', () => {
    const block = movementBlock();
    const completions = creditedCompletions(block, 12);
    expect(
      buildProgressNextCheckUpCard({
        hasReadyProfile: true,
        activeBlock: block,
        reports: [],
        completions,
        today: '2026-06-30T08:00:00.000Z',
      })
    ).toMatchObject({
      lead: 'Ready now.',
      actionLabel: 'Start Movement Check-Up',
    });
  });

  it('counts only schedule-credited A/B/C sessions in the current plan summary', () => {
    const block = movementBlock();
    const valid = creditedCompletions(block, 2);
    const noise: TrainingSessionCompletion[] = [
      completion(block, 'micro-check', 'micro_check', '2026-06-03', requiredMainPlanTemplatesForBlock(block).templateIds[2], false),
      {
        ...completion(block, 'manual', 'standard', '2026-06-04', requiredMainPlanTemplatesForBlock(block).templateIds[2], true),
        source: 'manual',
      },
    ];

    expect(
      buildProgressPlanSummaryCard({
        activeBlock: block,
        blocks: [block],
        reports: [],
        completions: [...valid, ...noise],
        today: '2026-06-05T08:00:00.000Z',
      })
    ).toMatchObject({
      title: 'Current 4-week plan',
      meta: 'Strength / Power · 2 of 12 sessions completed.',
      actionLabel: 'View current plan',
    });
  });
});

function domainCard(domain: MovementDomain, interpretation: string) {
  return {
    domain,
    title: domain === 'strength_power' ? 'Strength / Power' : domain === 'balance' ? 'Balance' : 'Mobility',
    metric: 'Saved metric',
    interpretation,
    body: 'Saved body',
  };
}

function movementBlock(): MovementBlock {
  return {
    id: 'movement-profile-v2-block',
    userId: 'local-device-user',
    status: 'active',
    startDate: '2026-06-01T09:00:00.000Z',
    endDate: '2026-06-29T09:00:00.000Z',
    retestDate: '2026-06-29T09:00:00.000Z',
    focusDomain: 'strength_power',
    focus: { kind: 'domain', domain: 'strength_power' },
    origin: {
      kind: 'movement_profile_v2_assessment',
      assessmentId: 'assessment-1',
      assessmentFingerprint: 'assessment-fingerprint-1',
      snapshotId: 'snapshot-1',
      snapshotFingerprint: 'snapshot-fingerprint-1',
      sourceCheckUpId: '2026-06-01T08:00:00.000Z',
      sourceCheckUpType: 'baseline',
      focusPolicyVersion: 1,
      focusPolicyFingerprint: 'focus-fingerprint-1',
    },
    secondaryDomains: ['balance', 'mobility'],
    sessionsPerWeekTarget: 3,
    totalPlannedSessions: 12,
    completedSessions: 0,
    microChecksCompleted: 0,
    sourceCheckUpId: '2026-06-01T08:00:00.000Z',
    createdAt: '2026-06-01T09:00:00.000Z',
    updatedAt: '2026-06-01T09:00:00.000Z',
  };
}

function creditedCompletions(block: MovementBlock, count: number): TrainingSessionCompletion[] {
  const dates = [
    '2026-06-01',
    '2026-06-02',
    '2026-06-03',
    '2026-06-08',
    '2026-06-09',
    '2026-06-10',
    '2026-06-15',
    '2026-06-16',
    '2026-06-17',
    '2026-06-22',
    '2026-06-23',
    '2026-06-24',
  ];
  const templateIds = requiredMainPlanTemplatesForBlock(block).templateIds;
  return dates.slice(0, count).map((date, index) =>
    completion(block, `completion-${index + 1}`, 'standard', date, templateIds[index % templateIds.length], true)
  );
}

function completion(
  block: MovementBlock,
  id: string,
  sessionType: TrainingSessionCompletion['sessionType'],
  date: string,
  templateId: string,
  mainPlanCredit: boolean
): TrainingSessionCompletion {
  return {
    id,
    userId: 'local-device-user',
    blockId: block.id,
    completedAt: `${date}T09:00:00.000Z`,
    plannedDate: `${templateId}:${date}`,
    sessionType,
    templateId,
    source: 'block_generated',
    mainPlanCredit,
    focusStimulusEvidence: {
      planStatus: mainPlanCredit ? 'eligible' : 'not_main_plan',
      status: mainPlanCredit ? 'credited_focus_work' : 'not_main_plan',
      exclusionReason: mainPlanCredit ? 'none' : 'not_main_plan',
      mainPlanCredit,
      plannedPrimaryFocusExerciseCount: mainPlanCredit ? 1 : 0,
      completedPrimaryFocusExerciseCount: mainPlanCredit ? 1 : 0,
      completedSupportingExerciseCount: 0,
      completedFallbackExerciseCount: 0,
      completedCrossDomainExerciseCount: 0,
      plannedPrimaryFocusExerciseIds: mainPlanCredit ? [`${templateId}-primary`] : [],
      completedPrimaryFocusExerciseIds: mainPlanCredit ? [`${templateId}-primary`] : [],
      completedSupportingExerciseIds: [],
      completedFallbackExerciseIds: [],
      completedCrossDomainExerciseIds: [],
      fallbackFocusSlotIds: [],
      skippedFocusSlotIds: [],
      focusStimulusExclusionReasons: [],
      missingMetadataExerciseIds: [],
      malformedMetadataExerciseIds: [],
      focusMismatchExerciseIds: [],
    },
  };
}
