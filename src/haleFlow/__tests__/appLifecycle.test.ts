import {
  createLifeGoal,
  createMovementBlockFromAssessment,
  defaultAdherenceStoreState,
  makeTrainingSessionCompletion,
  type AdherenceStoreState,
  type MovementBlock,
  type MovementSafetyProfile,
  type TrainingFocusStimulusEvidenceSummary,
} from '../../adherence';
import { syntheticCheckUp } from '../../checkup/devFixture';
import { HISTORY_SCHEMA_VERSION, type StoredCheckUp } from '../../history';
import { defaultPreferences, type UserProfile } from '../../profile';
import {
  createCurrentVersionedScoreSnapshot,
  type CheckUpScore,
  type Domain,
  type DomainResult,
  scoreCheckUp,
} from '../../scoring';
import { DEFAULT_EQUIPMENT, buildBlock, defaultTrainingState, startBlock } from '../../training';
import {
  getHaleAppLifecycle,
  getMovementSnapshot,
  getWeekSessionStatuses,
} from '../appLifecycle';
import { createMovementAssessment } from '../assessments';

const START = '2026-06-01T08:00:00.000Z';

function safety(): MovementSafetyProfile {
  return {
    id: 'safety-1',
    userId: 'local-device-user',
    age: 61,
    activityLevel: 'lightly_active',
    feelsSafeStandingFromChair: true,
    feelsSafeBalancing: true,
    availableEquipment: ['chair', 'wall'],
    preferredWorkoutDays: ['Mon', 'Wed', 'Fri'],
    createdAt: START,
    updatedAt: START,
  };
}

function profile(): UserProfile {
  const prefs = defaultPreferences();
  const lifeGoal = createLifeGoal({ category: 'stairs', nowIso: START });
  return {
    ...prefs.profile,
    name: 'Sam',
    age: 61,
    goal: 'Keep stairs feeling manageable',
    lifeGoal,
    safetyProfile: safety(),
  };
}

function baseline(startedAt = START): StoredCheckUp {
  const checkUp = syntheticCheckUp(startedAt);
  const scored = createCurrentVersionedScoreSnapshot(checkUp);
  return {
    schemaVersion: HISTORY_SCHEMA_VERSION,
    checkupType: 'baseline',
    checkUp,
    scoreSnapshot: scored.snapshot ?? undefined,
    scoreSnapshotCompatibility: scored.snapshot ? 'current' : 'invalid_snapshot',
  };
}

function noMeasurementBaseline(startedAt = START): StoredCheckUp {
  const checkUp = syntheticCheckUp(startedAt);
  const noMeasurementCheckUp = {
    ...checkUp,
    items: checkUp.items.map((item) => ({
      movementId: item.movementId,
      status: 'measured' as const,
      result: { movementId: item.movementId, flags: ['no-measurement'], interruptions: 0 },
    })),
  };
  const scored = createCurrentVersionedScoreSnapshot(noMeasurementCheckUp);
  return {
    schemaVersion: HISTORY_SCHEMA_VERSION,
    checkupType: 'baseline',
    checkUp: noMeasurementCheckUp,
    scoreSnapshot: scored.snapshot ?? undefined,
    scoreSnapshotCompatibility: scored.snapshot ? 'current' : 'invalid_snapshot',
  };
}

function baselineAssessment(startedAt = START) {
  const checkUp = baseline(startedAt).checkUp;
  const scored = createCurrentVersionedScoreSnapshot(checkUp);
  return createMovementAssessment({
    checkUpId: checkUp.startedAt,
    type: 'baseline',
    score: scored.score,
    scoreSnapshot: scored.snapshot,
    completedAt: checkUp.startedAt,
    isOfficialForProgress: true,
  });
}

function adherenceWithBaseline(overrides: Partial<AdherenceStoreState> = {}): AdherenceStoreState {
  const base = defaultAdherenceStoreState();
  return {
    ...base,
    ...overrides,
    assessments: [...(overrides.assessments ?? []), baselineAssessment()],
  };
}

function activeBlock(startDate = START): MovementBlock {
  const checkUp = baseline(startDate).checkUp;
  const assessment = baselineAssessment(startDate);
  const scored = createCurrentVersionedScoreSnapshot(checkUp);
  return createMovementBlockFromAssessment({
    latestAssessment: { score: scored.score, scoreSnapshot: scored.snapshot, id: checkUp.startedAt, assessment },
    lifeGoal: profile().lifeGoal,
    startDate,
  });
}

function completed(block: MovementBlock, completedAt: string, sessionNumber = 1) {
  const templateId = sessionNumber === 0 ? undefined : `${templatePrefix(block)}-${String.fromCharCode(64 + sessionNumber)}`;
  return makeTrainingSessionCompletion({
    block,
    sessionType: sessionNumber === 0 ? 'micro_check' : sessionNumber === 1 ? 'starter' : 'standard',
    completedAt,
    plannedDate: templateId ? `${templateId}:${completedAt.slice(0, 10)}` : 'micro-check',
    source: templateId ? 'block_generated' : undefined,
    templateId,
    mainPlanCredit: templateId ? true : undefined,
    focusStimulusEvidence: templateId ? focusEvidence(block, templateId) : undefined,
  });
}

function focusEvidence(
  block: MovementBlock,
  templateId: string,
  overrides: Partial<TrainingFocusStimulusEvidenceSummary> = {}
): TrainingFocusStimulusEvidenceSummary {
  const exerciseId = `${templateId}-primary`;
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
    plannedPrimaryFocusExerciseIds: [exerciseId],
    completedPrimaryFocusExerciseIds: [exerciseId],
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

function templatePrefix(block: MovementBlock): 'strength' | 'balance' | 'mobility' {
  if (block.focusDomain === 'balance') return 'balance';
  if (block.focusDomain === 'mobility') return 'mobility';
  return 'strength';
}

function domainResult(domain: Domain, age: number, measured = true): DomainResult {
  return {
    domain,
    label: domain,
    measured,
    ageLow: age - 2,
    ageHigh: age + 2,
    estimated: false,
    interpretation: 'Measured range.',
    rows: [],
  };
}

function score(): CheckUpScore {
  return {
    startedAt: START,
    weakestDomain: 'mobility',
    domains: [
      domainResult('strength', 50),
      domainResult('balance', 65),
      domainResult('mobility', 80),
    ],
  };
}

describe('getHaleAppLifecycle', () => {
  it('asks incomplete profiles to finish onboarding first', () => {
    const result = getHaleAppLifecycle({
      profile: defaultPreferences().profile,
      history: [baseline()],
      training: defaultTrainingState(),
      adherence: defaultAdherenceStoreState(),
      today: START,
    });

    expect(result.state).toBe('needs_onboarding');
    expect(result.primaryAction.type).toBe('start_onboarding');
  });

  it('asks profiled users for their first Movement Check-Up', () => {
    const result = getHaleAppLifecycle({
      profile: profile(),
      history: [],
      training: defaultTrainingState(),
      adherence: defaultAdherenceStoreState(),
      today: START,
    });

    expect(result.state).toBe('needs_baseline_checkup');
    expect(result.primaryAction.type).toBe('start_checkup');
  });

  it('asks for block creation after baseline when no active plan exists', () => {
    const result = getHaleAppLifecycle({
      profile: profile(),
      history: [baseline()],
      training: defaultTrainingState(),
      adherence: adherenceWithBaseline(),
      today: START,
    });

    expect(result.state).toBe('needs_block_creation');
    expect(result.primaryAction.type).toBe('create_block');
  });

  it('still asks for a Movement Check-Up when stored history has no usable measurements', () => {
    const result = getHaleAppLifecycle({
      profile: profile(),
      history: [noMeasurementBaseline()],
      training: defaultTrainingState(),
      adherence: defaultAdherenceStoreState(),
      today: START,
    });

    expect(result.state).toBe('needs_baseline_checkup');
    expect(result.primaryAction.type).toBe('start_checkup');
  });

  it('recognizes the first Hale Session for a new active block', () => {
    const block = activeBlock();
    const result = getHaleAppLifecycle({
      profile: profile(),
      history: [baseline()],
      training: defaultTrainingState(),
      adherence: adherenceWithBaseline({ blocks: [block] }),
      today: '2026-06-02T08:00:00.000Z',
    });

    expect(result.state).toBe('first_session_ready');
    expect(result.primaryAction.type).toBe('start_first_session');
    expect(result.activeBlockSummary?.weekNumber).toBe(1);
  });

  it('routes to the normal training day after the weekly micro-check is done', () => {
    const block = activeBlock();
    const completions = [
      completed(block, '2026-06-02T08:00:00.000Z', 1),
      completed(block, '2026-06-02T09:00:00.000Z', 0),
    ];
    const result = getHaleAppLifecycle({
      profile: profile(),
      history: [baseline()],
      training: defaultTrainingState(),
      adherence: adherenceWithBaseline({ blocks: [block], completions }),
      today: '2026-06-03T08:00:00.000Z',
    });

    expect(result.state).toBe('normal_training_day');
    expect(result.primaryAction.type).toBe('start_today_session');
  });

  it('surfaces the weekly micro-check after a weekly session is recorded', () => {
    const block = activeBlock();
    const result = getHaleAppLifecycle({
      profile: profile(),
      history: [baseline()],
      training: defaultTrainingState(),
      adherence: {
        ...adherenceWithBaseline(),
        blocks: [block],
        completions: [completed(block, '2026-06-02T08:00:00.000Z', 1)],
      },
      today: '2026-06-03T08:00:00.000Z',
    });

    expect(result.state).toBe('weekly_micro_check_due');
    expect(result.primaryAction.type).toBe('start_micro_check');
  });

  it('marks the week complete once the weekly session target is met', () => {
    const block = activeBlock();
    const result = getHaleAppLifecycle({
      profile: profile(),
      history: [baseline()],
      training: defaultTrainingState(),
      adherence: {
        ...adherenceWithBaseline(),
        blocks: [block],
        completions: [
          completed(block, '2026-06-02T08:00:00.000Z', 1),
          completed(block, '2026-06-04T08:00:00.000Z', 2),
          completed(block, '2026-06-06T08:00:00.000Z', 3),
        ],
      },
      today: '2026-06-06T12:00:00.000Z',
    });

    expect(result.state).toBe('week_complete');
    expect(result.primaryAction.type).toBe('explore_extra_sessions');
    expect(result.primaryAction.ctaLabel).toBe('Start mobility reset');
  });

  it('does not surface the monthly re-test from calendar age alone', () => {
    const block = activeBlock();
    const result = getHaleAppLifecycle({
      profile: profile(),
      history: [baseline()],
      training: defaultTrainingState(),
      adherence: adherenceWithBaseline({ blocks: [block] }),
      today: '2026-06-29T08:00:00.000Z',
    });

    expect(result.state).toBe('inactive_restart');
    expect(result.primaryAction.type).toBe('start_gentle_restart');
  });

  it('keeps the active block recoverable after an invalid official retest attempt', () => {
    const block = activeBlock();
    const completions = [
      completed(block, '2026-06-02T08:00:00.000Z', 1),
      completed(block, '2026-06-04T08:00:00.000Z', 2),
      completed(block, '2026-06-06T08:00:00.000Z', 3),
      completed(block, '2026-06-09T08:00:00.000Z', 1),
      completed(block, '2026-06-11T08:00:00.000Z', 2),
      completed(block, '2026-06-13T08:00:00.000Z', 3),
      completed(block, '2026-06-16T08:00:00.000Z', 1),
      completed(block, '2026-06-18T08:00:00.000Z', 2),
      completed(block, '2026-06-20T08:00:00.000Z', 3),
      completed(block, '2026-06-23T08:00:00.000Z', 1),
      completed(block, '2026-06-25T08:00:00.000Z', 2),
      completed(block, '2026-06-27T08:00:00.000Z', 3),
    ];
    const invalidScore = scoreCheckUp(noMeasurementBaseline('2026-06-29T08:00:00.000Z').checkUp);
    const invalidRetest = createMovementAssessment({
      checkUpId: invalidScore.startedAt,
      type: 'official_retest',
      score: invalidScore,
      completedAt: invalidScore.startedAt,
      sourceBlockId: block.id,
      isOfficialForProgress: true,
    });
    const result = getHaleAppLifecycle({
      profile: profile(),
      history: [baseline(), noMeasurementBaseline('2026-06-29T08:00:00.000Z')],
      training: defaultTrainingState(),
      adherence: adherenceWithBaseline({ blocks: [block], completions, assessments: [invalidRetest] }),
      today: '2026-06-29T09:00:00.000Z',
    });

    expect(block.status).toBe('active');
    expect(result.state).toBe('monthly_retest_due');
    expect(result.primaryAction.type).toBe('start_retest');
  });

  it('offers a clean slate after 7 inactive days inside an active block', () => {
    const block = activeBlock();
    const result = getHaleAppLifecycle({
      profile: profile(),
      history: [baseline()],
      training: defaultTrainingState(),
      adherence: {
        ...adherenceWithBaseline(),
        blocks: [block],
        completions: [completed(block, '2026-06-02T08:00:00.000Z', 1)],
      },
      today: '2026-06-09T08:00:00.000Z',
    });

    expect(result.state).toBe('inactive_restart');
    expect(result.primaryAction.type).toBe('start_gentle_restart');
    expect(result.primaryAction.title).toBe('Clean slate');
    expect(result.primaryAction.ctaLabel).toBe('Restart gently');
  });

  it('keeps the clean slate route after 14 inactive days inside an active block', () => {
    const block = activeBlock();
    const result = getHaleAppLifecycle({
      profile: profile(),
      history: [baseline()],
      training: defaultTrainingState(),
      adherence: {
        ...adherenceWithBaseline(),
        blocks: [block],
        completions: [completed(block, '2026-06-02T08:00:00.000Z', 1)],
      },
      today: '2026-06-17T08:00:00.000Z',
    });

    expect(result.state).toBe('inactive_restart');
    expect(result.primaryAction.type).toBe('start_gentle_restart');
  });

  it('handles old minimal state and legacy training blocks without treating them as current sessions', () => {
    const first = getHaleAppLifecycle({
      profile: profile(),
      history: [baseline()],
      training: defaultTrainingState(),
      adherence: undefined,
      today: START,
    });
    const legacyTraining = startBlock(
      defaultTrainingState(),
      buildBlock(scoreCheckUp(baseline().checkUp), DEFAULT_EQUIPMENT, START)
    );
    const second = getHaleAppLifecycle({
      profile: profile(),
      history: [baseline()],
      training: legacyTraining,
      adherence: adherenceWithBaseline(),
      today: START,
    });

    expect(first.state).toBe('needs_baseline_checkup');
    expect(second.state).toBe('needs_block_creation');
    expect(second.primaryAction.type).toBe('create_block');
    expect(second.activeBlockSummary).toBeUndefined();
    expect(second.weekSessionStatuses?.map((session) => session.status)).toEqual(['next', 'later', 'later']);
  });
});

describe('lifecycle view models', () => {
  it('maps movement-age ranges to warm snapshot bands', () => {
    expect(getMovementSnapshot({ score: score() })).toEqual({
      strengthPower: 'strong',
      balance: 'building',
      mobility: 'starting_point',
    });
  });

  it('omits movement snapshot rows when no measured score exists', () => {
    expect(getMovementSnapshot({ score: null })).toBeUndefined();
    expect(
      getMovementSnapshot({
        score: {
          ...score(),
          domains: [
            domainResult('strength', 50, false),
            domainResult('balance', 65, false),
            domainResult('mobility', 80, false),
          ],
        },
      })
    ).toBeUndefined();
  });

  it('marks 0, 1, and 3 session weeks as next/protected/later correctly', () => {
    const block = activeBlock();
    expect(getWeekSessionStatuses({ adherence: { ...defaultAdherenceStoreState(), blocks: [block] }, today: START }).map((s) => s.status)).toEqual([
      'next',
      'later',
      'later',
    ]);
    expect(
      getWeekSessionStatuses({
        adherence: {
          ...defaultAdherenceStoreState(),
          blocks: [block],
          completions: [completed(block, '2026-06-02T08:00:00.000Z', 1)],
        },
        today: '2026-06-03T08:00:00.000Z',
      }).map((s) => s.status)
    ).toEqual(['complete', 'next', 'later']);
    expect(
      getWeekSessionStatuses({
        adherence: {
          ...defaultAdherenceStoreState(),
          blocks: [block],
          completions: [
            completed(block, '2026-06-02T08:00:00.000Z', 1),
            completed(block, '2026-06-04T08:00:00.000Z', 2),
            completed(block, '2026-06-06T08:00:00.000Z', 3),
          ],
        },
        today: '2026-06-06T12:00:00.000Z',
      }).map((s) => s.status)
    ).toEqual(['complete', 'complete', 'complete']);
  });

  it('counts generated session template completions toward weekly A/B/C status', () => {
    const block = activeBlock();
    const completions = [
      makeTrainingSessionCompletion({
        block,
        sessionType: 'starter',
        completedAt: '2026-06-02T08:00:00.000Z',
        plannedDate: 'balance-A:2026-06-02',
        source: 'block_generated',
        templateId: 'balance-A',
        mainPlanCredit: true,
        focusStimulusEvidence: focusEvidence(block, 'balance-A'),
      }),
      makeTrainingSessionCompletion({
        block,
        sessionType: 'standard',
        completedAt: '2026-06-04T08:00:00.000Z',
        plannedDate: 'balance-B:2026-06-04',
        source: 'block_generated',
        templateId: 'balance-B',
        mainPlanCredit: true,
        focusStimulusEvidence: focusEvidence(block, 'balance-B'),
      }),
    ];

    expect(
      getWeekSessionStatuses({
        adherence: { ...defaultAdherenceStoreState(), blocks: [block], completions },
        today: '2026-06-04T12:00:00.000Z',
      }).map((s) => s.status)
    ).toEqual(['complete', 'complete', 'next']);
  });

  it('uses generated session summaries when old completion records lack template ids', () => {
    const block = activeBlock();

    expect(
      getWeekSessionStatuses({
        adherence: { ...defaultAdherenceStoreState(), blocks: [block] },
        training: {
          ...defaultTrainingState(),
          generatedSessionSummaries: [
            {
              id: 'generated-b',
              blockId: block.id,
              source: 'block_generated',
              templateId: 'balance-B',
              plannedDateKey: 'balance-B:2026-06-04',
              sessionType: 'standard',
              status: 'completed',
              mainPlanCredit: true,
              focusStimulusEvidence: focusEvidence(block, 'balance-B'),
              title: 'Balance Session B',
              completedAt: '2026-06-04T08:00:00.000Z',
              exerciseIds: [],
            },
          ],
        },
        today: '2026-06-04T12:00:00.000Z',
      }).map((s) => s.status)
    ).toEqual(['next', 'complete', 'later']);
  });
});
