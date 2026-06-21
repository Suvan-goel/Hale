import type { CheckUpScore, Domain, DomainResult, VersionedCheckUpScoreSnapshot } from '../../scoring';
import { toStoredScoreSnapshot } from '../../scoring';
import {
  createLifeGoal,
  createMovementBlockFromAssessment,
  createSupportInvite,
  blockProgress,
  filterSupportSummaryForSharing,
  generateMilestones,
  generateWeeklySummary,
  getAdherenceState,
  getBlockPurposeCopy,
  getDashboardCopy,
  getLapseRecoveryCopy,
  getLifeGoalDisplayText,
  getLifeGoalTrainingRelevance,
  getProtectionCopy,
  makeNotificationEvent,
  makeTrainingSessionCompletion,
  notificationCopy,
  recordTrainingSessionCompletion,
  shouldTriggerMissedWeekSupportNotification,
  defaultAdherenceStoreState,
  createSupportSummary,
  currentWeekProgress,
} from '../index';
import type { MovementBlock, TrainingFocusStimulusEvidenceSummary, TrainingSessionCompletion } from '../types';
import { createMovementAssessment } from '../../haleFlow';

const START = '2026-06-01T08:00:00.000Z';

function domainResult(domain: Domain, age: number): DomainResult {
  return {
    domain,
    label: domain,
    measured: true,
    ageLow: age - 2,
    ageHigh: age + 2,
    estimated: false,
    interpretation: 'Measured range.',
    rows: [],
  };
}

function score(weakestDomain: Domain = 'balance', focusAge = 70): CheckUpScore {
  return {
    startedAt: '2026-06-01T07:00:00.000Z',
    weakestDomain,
    domains: [
      domainResult('strength', weakestDomain === 'strength' ? focusAge : 58),
      domainResult('balance', weakestDomain === 'balance' ? focusAge : 57),
      domainResult('mobility', weakestDomain === 'mobility' ? focusAge : 56),
    ],
  };
}

function block(): MovementBlock {
  const inputScore = score('balance');
  const scoreSnapshot = scoreSnapshotFor(inputScore);
  const assessment = createMovementAssessment({
    checkUpId: inputScore.startedAt,
    type: 'baseline',
    score: inputScore,
    scoreSnapshot,
    completedAt: inputScore.startedAt,
    isOfficialForProgress: true,
  });
  return createMovementBlockFromAssessment({
    latestAssessment: { score: inputScore, scoreSnapshot, id: 'assessment-1', assessment },
    lifeGoal: createLifeGoal({ category: 'stairs', nowIso: START }),
    startDate: START,
  });
}

function scoreSnapshotFor(inputScore: CheckUpScore): VersionedCheckUpScoreSnapshot {
  return toStoredScoreSnapshot(inputScore)!;
}

function completion(
  b: MovementBlock,
  type: TrainingSessionCompletion['sessionType'],
  at: string,
  plannedDate?: string,
  overrides: Partial<TrainingSessionCompletion> = {}
): TrainingSessionCompletion {
  const mainPlanCredit = type === 'standard' || type === 'starter' || type === 'restart';
  const templateId = plannedDate?.includes(':') ? plannedDate.split(':')[0] : mainPlanCredit ? `test-${type}` : undefined;
  return makeTrainingSessionCompletion({
    block: b,
    sessionType: type,
    completedAt: at,
    plannedDate,
    source: mainPlanCredit ? 'block_generated' : undefined,
    templateId,
    mainPlanCredit: mainPlanCredit ? true : undefined,
    focusStimulusEvidence: mainPlanCredit ? focusEvidence(b.focusDomain) : undefined,
    ...overrides,
  });
}

function focusEvidence(
  domain: MovementBlock['focusDomain'],
  overrides: Partial<TrainingFocusStimulusEvidenceSummary> = {}
): TrainingFocusStimulusEvidenceSummary {
  return {
    planStatus: 'eligible',
    status: 'credited_focus_work',
    exclusionReason: 'none',
    mainPlanCredit: true,
    blockFocusDomain: domain,
    plannedPrimaryFocusExerciseCount: 1,
    completedPrimaryFocusExerciseCount: 1,
    completedSupportingExerciseCount: 0,
    completedFallbackExerciseCount: 0,
    completedCrossDomainExerciseCount: 0,
    plannedPrimaryFocusExerciseIds: ['primary-focus-exercise'],
    completedPrimaryFocusExerciseIds: ['primary-focus-exercise'],
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

describe('life goal relevance', () => {
  it('maps life goals to training domains and display copy', () => {
    const goal = createLifeGoal({ category: 'stairs', nowIso: START });
    expect(getLifeGoalDisplayText(goal)).toBe('Climb stairs more easily');
    expect(getLifeGoalTrainingRelevance(goal).primaryDomains).toEqual(['strength_power', 'balance']);
  });
});

describe('movement block creation', () => {
  it('uses the assessment for focus and the life goal for framing', () => {
    const goal = createLifeGoal({ category: 'travel', nowIso: START });
    const inputScore = score('mobility');
    const scoreSnapshot = scoreSnapshotFor(inputScore);
    const assessment = createMovementAssessment({
      checkUpId: inputScore.startedAt,
      type: 'baseline',
      score: inputScore,
      scoreSnapshot,
      completedAt: inputScore.startedAt,
      isOfficialForProgress: true,
    });
    const b = createMovementBlockFromAssessment({
      latestAssessment: { score: inputScore, scoreSnapshot, id: 'checkup-a', assessment },
      lifeGoal: goal,
      startDate: START,
    });
    expect(b.focusDomain).toBe('mobility');
    expect(b.lifeGoalId).toBe(goal.id);
    expect(b.totalPlannedSessions).toBe(12);
    expect(b.retestDate).toBe('2026-06-29T08:00:00.000Z');
    expect(getBlockPurposeCopy(b, goal)).toContain('travel');
  });
});

describe('adherence state and restart completion', () => {
  it('detects on-track, missed-session, inactive, and re-test states', () => {
    const b = block();
    expect(getAdherenceState(b, [], '2026-06-02T08:00:00.000Z')).toBe('on_track');
    expect(getAdherenceState(b, [], '2026-06-05T08:00:00.000Z')).toBe('missed_one_session');
    expect(getAdherenceState(b, [], '2026-06-08T08:00:00.000Z')).toBe('inactive_this_week');
    expect(getAdherenceState(b, [], '2026-06-15T08:00:00.000Z')).toBe('inactive_14_days');
    expect(getAdherenceState(b, [], '2026-06-27T08:00:00.000Z')).toBe('ready_for_retest');
  });

  it('counts a restart session once and returns the block to normal progress', () => {
    const b = block();
    let state = defaultAdherenceStoreState();
    const restart = completion(b, 'restart', '2026-06-08T08:00:00.000Z');
    state = recordTrainingSessionCompletion(state, restart);
    state = recordTrainingSessionCompletion(state, restart);
    expect(state.completions).toHaveLength(1);
    expect(state.blocks).toHaveLength(0);
    const withBlock = { ...state, blocks: [b] };
    const updated = recordTrainingSessionCompletion(withBlock, completion(b, 'standard', '2026-06-10T08:00:00.000Z'));
    expect(updated.blocks[0].completedSessions).toBe(2);
  });

  it('does not let missing or non-credit focus evidence advance block or week completion', () => {
    const b = block();
    let state = { ...defaultAdherenceStoreState(), blocks: [b] };
    state = recordTrainingSessionCompletion(
      state,
      completion(b, 'standard', '2026-06-02T08:00:00.000Z', 'balance-A:2026-06-02', {
        id: 'missing-focus-credit',
        focusStimulusEvidence: undefined,
      })
    );
    state = recordTrainingSessionCompletion(
      state,
      completion(b, 'standard', '2026-06-04T08:00:00.000Z', 'balance-B:2026-06-04', {
        id: 'supporting-only-credit',
        mainPlanCredit: false,
        focusStimulusEvidence: focusEvidence(b.focusDomain, {
          status: 'primary_focus_not_completed',
          exclusionReason: 'supporting_only',
          mainPlanCredit: false,
          completedPrimaryFocusExerciseCount: 0,
          completedSupportingExerciseCount: 1,
          completedPrimaryFocusExerciseIds: [],
          completedSupportingExerciseIds: ['supporting-balance'],
        }),
      })
    );

    expect(state.completions).toHaveLength(2);
    expect(state.blocks[0].completedSessions).toBe(0);
    expect(blockProgress(b, state.completions).completedSessions).toBe(0);
    expect(currentWeekProgress(b, state.completions, '2026-06-06T08:00:00.000Z').sessionsCompleted).toBe(0);
    expect(generateMilestones({ block: b, completions: state.completions, nowIso: '2026-06-06T08:00:00.000Z' }).map((m) => m.type))
      .not.toContain('first_week_completed');
  });
});

describe('weekly summary, privacy, and notifications', () => {
  it('generates non-shaming weekly copy from completions', () => {
    const b = block();
    const completions = [
      completion(b, 'standard', '2026-06-02T08:00:00.000Z', 'balance-A:2026-06-02'),
      completion(b, 'standard', '2026-06-04T08:00:00.000Z', 'balance-B:2026-06-04'),
      completion(b, 'standard', '2026-06-06T08:00:00.000Z', 'balance-C:2026-06-06'),
      completion(b, 'micro_check', '2026-06-06T08:05:00.000Z', '2026-06-06-micro'),
    ];
    const summary = generateWeeklySummary({
      block: b,
      lifeGoal: createLifeGoal({ category: 'stairs', nowIso: START }),
      completions,
      nowIso: '2026-06-06T10:00:00.000Z',
    });
    expect(summary.sessionsCompleted).toBe(3);
    expect(summary.microCheckCompleted).toBe(true);
    expect(summary.body).toContain('supported');
  });

  it('filters support summaries by sharing level', () => {
    const b = block();
    const connection = createSupportInvite({
      relationshipType: 'adult_child',
      sharingLevel: 'detailed',
      nowIso: START,
    });
    const summary = createSupportSummary({
      connection,
      block: b,
      completions: [completion(b, 'standard', '2026-06-02T08:00:00.000Z')],
      recentMilestoneTitle: 'Training for what matters',
      nowIso: '2026-06-03T08:00:00.000Z',
    });
    expect(filterSupportSummaryForSharing(summary, 'completion_only').milestone).toBeUndefined();
    expect(filterSupportSummaryForSharing(summary, 'progress_summary').milestone).toBeUndefined();
    expect(filterSupportSummaryForSharing(summary, 'detailed').milestone).toBe('Training for what matters');
    expect(filterSupportSummaryForSharing(summary, 'private').visible).toBe(false);
  });

  it('triggers missed-week support notification only after explicit opt-in and only once per lapse window', () => {
    const b = block();
    const off = createSupportInvite({
      relationshipType: 'friend',
      notifyOnMissedWeek: false,
      nowIso: START,
    });
    expect(
      shouldTriggerMissedWeekSupportNotification({
        connection: off,
        block: b,
        completions: [],
        events: [],
        nowIso: '2026-06-08T08:00:00.000Z',
      }).shouldTrigger
    ).toBe(false);

    const on = { ...off, notifyOnMissedWeek: true };
    const first = shouldTriggerMissedWeekSupportNotification({
      connection: on,
      block: b,
      completions: [],
      events: [],
      nowIso: '2026-06-08T08:00:00.000Z',
    });
    expect(first.shouldTrigger).toBe(true);
    expect(
      shouldTriggerMissedWeekSupportNotification({
        connection: on,
        block: b,
        completions: [],
        events: [first.event ?? makeNotificationEvent({ type: 'missed_week_support', dedupeKey: 'fallback' })],
        nowIso: '2026-06-08T08:00:00.000Z',
      }).shouldTrigger
    ).toBe(false);
  });
});

describe('milestones and copy safety', () => {
  it('does not duplicate milestones already stored', () => {
    const b = block();
    const first = generateMilestones({ block: b, completions: [], nowIso: START });
    const second = generateMilestones({ block: b, completions: [], existing: first, nowIso: START });
    expect(first.map((m) => m.type)).toContain('first_block_started');
    expect(second).toHaveLength(0);
  });

  it('keeps adherence copy away from banned phrases', () => {
    const b = block();
    const goal = createLifeGoal({ category: 'stairs', nowIso: START });
    const samples = [
      getBlockPurposeCopy(b, goal),
      getDashboardCopy({ block: b, lifeGoal: goal, adherenceState: 'missed_one_session' }),
      getLapseRecoveryCopy('inactive_this_week', goal).body,
      getProtectionCopy({ lifeGoal: goal, focusDomain: b.focusDomain, adherenceState: 'on_track' }),
      notificationCopy('planned_session'),
      notificationCopy('retest_approaching'),
    ].join(' ');
    expect(samples.toLowerCase()).not.toMatch(/failed|lost streak|fall risk|diagnosis|frailty|treatment|preventing disease|you skipped|protect your progress|protected your progress/);
  });
});
