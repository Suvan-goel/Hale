import type { CheckUpScore, Domain, DomainResult, VersionedCheckUpScoreSnapshot } from '../../scoring';
import { toStoredScoreSnapshot } from '../../scoring';
import {
  createLifeGoal,
  createMovementBlockFromAssessment,
  blockProgress,
  generateMilestones,
  getAdherenceState,
  getBlockPurposeCopy,
  getDashboardCopy,
  getLapseRecoveryCopy,
  getLifeGoalDisplayText,
  getLifeGoalTrainingRelevance,
  getLifeGoalWorkoutBias,
  getProtectionCopy,
  LIFE_GOAL_PRESETS,
  makeTrainingSessionCompletion,
  normalizeLifeGoalDisplayText,
  recordTrainingSessionCompletion,
  defaultAdherenceStoreState,
  currentWeekProgress,
  deserializeAdherenceState,
} from '../index';
import type { MovementBlock, TrainingFocusStimulusEvidenceSummary, TrainingSessionCompletion } from '../types';
import { BLOCK_SCHEDULE_POLICY_VERSION, createMovementAssessment } from '../../haleFlow';

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
    primaryMetricValue: NaN,
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
    lifeGoal: createLifeGoal({ category: 'stairs_walks', nowIso: START }),
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
  const effectiveMainPlanCredit = 'mainPlanCredit' in overrides
    ? overrides.mainPlanCredit
    : mainPlanCredit
      ? true
      : undefined;
  const effectiveFocusEvidence = 'focusStimulusEvidence' in overrides
    ? overrides.focusStimulusEvidence
    : mainPlanCredit
      ? focusEvidence(b.focusDomain)
      : undefined;
  const scheduleCredit =
    effectiveMainPlanCredit === true && effectiveFocusEvidence?.mainPlanCredit === true && templateId && plannedDate?.includes(':')
      ? {
          policyVersion: BLOCK_SCHEDULE_POLICY_VERSION,
          credited: true as const,
          status: 'credited' as const,
          weekIndex: 0,
          weekNumber: 1,
          dateKey: at.slice(0, 10),
          templateId,
          creditId: plannedDate,
        }
      : undefined;
  return makeTrainingSessionCompletion({
    block: b,
    sessionType: type,
    completedAt: at,
    plannedDate,
    source: mainPlanCredit ? 'block_generated' : undefined,
    templateId,
    mainPlanCredit: effectiveMainPlanCredit,
    focusStimulusEvidence: effectiveFocusEvidence,
    scheduleCredit,
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
  it('exposes exactly the four consolidated life goals', () => {
    expect(LIFE_GOAL_PRESETS.map((preset) => preset.category)).toEqual([
      'stairs_walks',
      'grandchildren',
      'bend_reach_carry',
      'independence',
    ]);
  });

  it('maps life goals to training domains and display copy', () => {
    const goal = createLifeGoal({ category: 'stairs_walks', nowIso: START });
    expect(getLifeGoalDisplayText(goal)).toBe('Climb stairs and keep up on walks');
    expect(getLifeGoalTrainingRelevance(goal).primaryDomains).toEqual(['strength_power', 'balance']);
    expect(getLifeGoalWorkoutBias(goal).preferredLadderIds.slice(0, 3)).toEqual([
      'step-up',
      'sit-to-stand',
      'heel-toe-raise',
    ]);
  });

  it('keeps the no-goal fallback neutral so the check-up leads', () => {
    expect(getLifeGoalDisplayText(null)).toBe('Stay capable for the life you want to keep living');
    expect(getLifeGoalWorkoutBias(null).preferredLadderIds).toEqual([]);
    expect(getLifeGoalWorkoutBias(null).preferredSlotTypes).toEqual([]);
    expect(getLifeGoalTrainingRelevance(null).primaryDomains).toEqual(['strength_power', 'balance', 'mobility']);
  });

  it('strips first-person goal prompts from free-text goal labels', () => {
    expect(normalizeLifeGoalDisplayText('I want to be able to climb stairs')).toBe('climb stairs');
    expect(normalizeLifeGoalDisplayText('In the future, I want to be able to keep up on walks')).toBe('keep up on walks');
    expect(normalizeLifeGoalDisplayText('My goal is to stay independent')).toBe('stay independent');
  });
});

describe('movement block creation', () => {
  it('uses the assessment for focus and the life goal for framing', () => {
    const goal = createLifeGoal({ category: 'stairs_walks', nowIso: START });
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
    expect(getBlockPurposeCopy(b, goal)).toContain('stairs and walks');
  });

  it('uses the life goal to order secondary domains after the check-up focus is chosen', () => {
    const goal = createLifeGoal({ category: 'stairs_walks', nowIso: START });
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
      latestAssessment: { score: inputScore, scoreSnapshot, id: 'checkup-stairs', assessment },
      lifeGoal: goal,
      startDate: START,
    });

    expect(b.focusDomain).toBe('mobility');
    expect(b.secondaryDomains).toEqual(['strength_power', 'balance']);
  });

  it('uses the life goal only as a tie-break when the check-up focus is already tied', () => {
    const goal = createLifeGoal({ category: 'bend_reach_carry', nowIso: START });
    const inputScore: CheckUpScore = {
      startedAt: '2026-06-01T07:00:00.000Z',
      weakestDomain: 'strength',
      domains: [
        domainResult('strength', 70),
        domainResult('balance', 58),
        domainResult('mobility', 70),
      ],
    };
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
      latestAssessment: { score: inputScore, scoreSnapshot, id: 'checkup-tied-gardening', assessment },
      lifeGoal: goal,
      startDate: START,
    });

    expect(b.focusSelectionKind).toBe('exact_tie');
    expect(b.focusTiedDomains).toEqual(['strength_power', 'mobility']);
    expect(b.focusDomain).toBe('mobility');
    expect(b.secondaryDomains).toEqual(['strength_power', 'balance']);
  });

  it('migrates legacy block sourceAssessmentId into sourceCheckUpId when loading persistence', () => {
    const currentBlock = block();
    const legacyBlock = {
      ...currentBlock,
      sourceCheckUpId: undefined,
      sourceAssessmentId: 'legacy-checkup-local-id',
    };
    const restored = deserializeAdherenceState(
      JSON.stringify({
        schemaVersion: 1,
        payload: {
          ...defaultAdherenceStoreState(),
          blocks: [legacyBlock],
        },
      })
    );

    expect(restored?.blocks[0].sourceCheckUpId).toBe('legacy-checkup-local-id');
    expect(restored?.blocks[0].sourceAssessmentId).toBeUndefined();
  });
});

describe('adherence state and restart completion', () => {
  it('detects on-track, missed-session, inactive, and re-test states', () => {
    const b = block();
    expect(getAdherenceState(b, [], '2026-06-02T08:00:00.000Z')).toBe('on_track');
    expect(getAdherenceState(b, [], '2026-06-05T08:00:00.000Z')).toBe('missed_one_session');
    expect(getAdherenceState(b, [], '2026-06-08T08:00:00.000Z')).toBe('inactive_this_week');
    expect(getAdherenceState(b, [], '2026-06-15T08:00:00.000Z')).toBe('inactive_14_days');
    expect(getAdherenceState(b, [], '2026-06-27T08:00:00.000Z')).toBe('inactive_14_days');
  });

  it('counts a restart session once and returns the block to normal progress', () => {
    const b = block();
    let state = defaultAdherenceStoreState();
    const restart = completion(b, 'restart', '2026-06-08T08:00:00.000Z', 'balance-A:2026-06-08');
    state = recordTrainingSessionCompletion(state, restart);
    state = recordTrainingSessionCompletion(state, restart);
    expect(state.completions).toHaveLength(1);
    expect(state.blocks).toHaveLength(0);
    const withBlock = { ...state, blocks: [b] };
    const updated = recordTrainingSessionCompletion(withBlock, completion(b, 'standard', '2026-06-10T08:00:00.000Z', 'balance-B:2026-06-10'));
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

describe('milestones and copy safety', () => {
  it('does not duplicate milestones already stored', () => {
    const b = block();
    const first = generateMilestones({ block: b, completions: [], nowIso: START });
    const second = generateMilestones({ block: b, completions: [], existing: first, nowIso: START });
    expect(first.map((m) => m.type)).toContain('first_block_started');
    expect(second).toHaveLength(0);
  });

  it('never emits the retired age-comparison milestone (F3, 2026-07-06)', () => {
    // A focus-domain age band far below the user's age was exactly the old
    // trigger; retired because age comparison violates the baseline-relative
    // default — nothing of its kind returns outside the opt-in view.
    const types = generateMilestones({
      user: { age: 70 },
      block: block(),
      latestAssessment: score('balance', 45),
      completions: [],
      nowIso: START,
    }).map((m) => m.type);
    expect(types).not.toContain('younger_than_age_band');
  });

  it('keeps adherence copy away from banned phrases', () => {
    const b = block();
    const goal = createLifeGoal({ category: 'stairs_walks', nowIso: START });
    const samples = [
      getBlockPurposeCopy(b, goal),
      getDashboardCopy({ block: b, lifeGoal: goal, adherenceState: 'missed_one_session' }),
      getLapseRecoveryCopy('inactive_this_week', goal).body,
      getLapseRecoveryCopy('inactive_14_days', goal).body,
      getProtectionCopy({ lifeGoal: goal, focusDomain: b.focusDomain, adherenceState: 'on_track' }),
    ].join(' ');
    expect(samples.toLowerCase()).not.toMatch(/failed|lost streak|fall risk|diagnosis|frailty|treatment|preventing disease|you skipped|protect your progress|protected your progress/);
  });

  it('uses clean-slate restart copy after a two-week lapse', () => {
    const goal = createLifeGoal({ category: 'stairs_walks', nowIso: START });

    expect(getLapseRecoveryCopy('inactive_14_days', goal)).toEqual({
      title: 'Start from where your body is today',
      body: "Let's restart gently and keep the plan moving from here.",
      cta: 'Restart my block',
    });
  });

  it('keeps goal protection copy grammatically safe', () => {
    const goal = createLifeGoal({ category: 'independence', nowIso: START });

    expect(getProtectionCopy({ lifeGoal: goal, focusDomain: 'strength_power', adherenceState: 'on_track' })).toBe(
      'Today supports the goal you chose: Feel strong and stay independent.'
    );
  });
});
