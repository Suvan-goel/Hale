import type {
  MovementBlock,
  TrainingFocusStimulusEvidenceSummary,
  TrainingSessionCompletion,
} from '../../adherence';
import {
  classifyMainPlanCompletion,
  mainPlanRecentSessionsForGeneration,
} from '../mainPlanEvents';

const START = '2026-06-01T08:00:00.000Z';

function block(overrides: Partial<MovementBlock> = {}): MovementBlock {
  return {
    id: 'movement-block-main-plan',
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
    blockId: 'movement-block-main-plan',
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

function focusEvidence(
  overrides: Partial<TrainingFocusStimulusEvidenceSummary> = {}
): TrainingFocusStimulusEvidenceSummary {
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
    ...overrides,
  };
}

describe('main plan event classifier', () => {
  it('credits only explicit active-block A/B/C completions', () => {
    expect(classifyMainPlanCompletion(block(), completion()).credited).toBe(true);
    expect(classifyMainPlanCompletion(block(), completion({ source: 'preset' })).credited).toBe(false);
    expect(classifyMainPlanCompletion(block(), completion({ sessionType: 'retest_prep' })).credited).toBe(false);
    expect(classifyMainPlanCompletion(block(), completion({ templateId: 'preset-quick-full-body' })).credited).toBe(false);
    expect(classifyMainPlanCompletion(block(), completion({ mainPlanCredit: undefined })).credited).toBe(false);
    expect(classifyMainPlanCompletion(block(), completion({ plannedDate: undefined })).credited).toBe(false);
    expect(classifyMainPlanCompletion(block({ id: 'other-block' }), completion()).credited).toBe(false);
  });

  it('dedupes repeated template credit within the same block week and excludes non-credit summaries', () => {
    const recent = mainPlanRecentSessionsForGeneration({
      activeBlock: block(),
      completions: [
        completion({ id: 'A-1', plannedDate: 'strength-A:2026-06-01', completedAt: '2026-06-01T09:00:00.000Z' }),
        completion({ id: 'A-2', plannedDate: 'strength-A:2026-06-02', completedAt: '2026-06-02T09:00:00.000Z' }),
        completion({
          id: 'B-1',
          plannedDate: 'strength-B:2026-06-03',
          completedAt: '2026-06-03T09:00:00.000Z',
          templateId: 'strength-B',
        }),
      ],
      generatedSessionSummaries: [
        {
          id: 'summary-C-zero-work',
          blockId: 'movement-block-main-plan',
          source: 'block_generated',
          templateId: 'strength-C',
          plannedDateKey: 'strength-C:2026-06-05',
          sessionType: 'standard',
          status: 'skipped',
          mainPlanCredit: false,
          title: 'Strength Session C',
          completedAt: '2026-06-05T09:00:00.000Z',
          exerciseIds: ['exercise-1'],
        },
      ],
    });

    expect(recent.map((session) => session.templateId)).toEqual(['strength-A', 'strength-B']);
  });

  it('rejects credited-looking completions and summaries without Stage 5B focus credit', () => {
    const supportingOnlyFocusEvidence = focusEvidence({
      status: 'primary_focus_not_completed',
      exclusionReason: 'supporting_only',
      mainPlanCredit: false,
      completedPrimaryFocusExerciseCount: 0,
      completedSupportingExerciseCount: 1,
      completedPrimaryFocusExerciseIds: [],
      completedSupportingExerciseIds: ['balance-tandem-hold'],
    });

    expect(
      classifyMainPlanCompletion(
        block(),
        completion({ id: 'missing-focus-evidence', focusStimulusEvidence: undefined })
      ).credited
    ).toBe(false);
    expect(
      classifyMainPlanCompletion(
        block(),
        completion({ id: 'supporting-only-focus-evidence', focusStimulusEvidence: supportingOnlyFocusEvidence })
      ).credited
    ).toBe(false);

    const recent = mainPlanRecentSessionsForGeneration({
      activeBlock: block(),
      completions: [
        completion({
          id: 'completion-missing-focus-evidence',
          plannedDate: 'strength-A:2026-06-01',
          focusStimulusEvidence: undefined,
        }),
      ],
      generatedSessionSummaries: [
        {
          id: 'summary-supporting-only',
          blockId: 'movement-block-main-plan',
          source: 'block_generated',
          templateId: 'strength-B',
          plannedDateKey: 'strength-B:2026-06-03',
          sessionType: 'standard',
          status: 'partial',
          mainPlanCredit: true,
          focusStimulusEvidence: supportingOnlyFocusEvidence,
          title: 'Strength Session B',
          completedAt: '2026-06-03T09:00:00.000Z',
          exerciseIds: ['balance-tandem-hold'],
        },
      ],
    });

    expect(recent).toEqual([]);
  });
});
