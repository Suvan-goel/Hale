import {
  createLifeGoal,
  createMovementBlockFromAssessment,
  defaultAdherenceStoreState,
  makeTrainingSessionCompletion,
  markMovementBlockComplete,
  recordTrainingSessionCompletion,
  tryCreateMovementBlockFromAssessment,
  type CheckupType,
  type MovementAssessment,
  type MovementBlock,
  type TrainingFocusStimulusEvidenceSummary,
  upsertMovementAssessment,
  upsertMovementBlock,
  upsertMovementBlockReport,
} from '../../adherence';
import { DEFAULT_BATTERY, BETA_BATTERY_WITH_TUG } from '../../checkup';
import type { CheckUp, CheckUpItem } from '../../checkup/types';
import { HISTORY_SCHEMA_VERSION, type StoredCheckUp } from '../../history';
import {
  BALANCE_LADDER_ID,
  CHAIR_STAND_ID,
  HINGE_REACH_ID,
  SHOULDER_FLEXION_ID,
  TUG_ID,
  type BalanceResult,
  type ChairStandResult,
  type HingeReachResult,
  type MovementResultBase,
  type ShoulderFlexionResult,
} from '../../movements';
import { createCurrentVersionedScoreSnapshot, scoreCheckUp } from '../../scoring';
import { STS_STANDARD_ID } from '../../exercises';
import { createMovementAssessment, createMovementBlockReport } from '..';
import {
  getBlockReportSummaries,
  getDomainProgressCards,
  getLadderProgressCards,
  getLatestDomainEvidence,
  getLatestCheckUpSummary,
  getRetestDueSummary,
  getRetestHistory,
} from '../progressViewModel';

const START = '2026-06-01T08:00:00.000Z';

describe('progressViewModel', () => {
  it('returns an empty baseline state without crashing', () => {
    expect(getLatestCheckUpSummary([])).toBeNull();
    expect(getDomainProgressCards([])).toEqual([]);
    expect(getLadderProgressCards({})).toEqual([]);
    expect(getBlockReportSummaries({ blocks: [], reports: [], completions: [] })).toEqual([]);
    expect(getRetestHistory([])).toEqual([]);
  });

  it('shows a one-check-up baseline without fake improvement', () => {
    const history = [stored(checkUpAt(START, { chairReps: 12, tandemSec: 18, shoulderDeg: 150, reachBu: 0.32 }))];
    const assessments = assessmentsForHistory(history);
    const summary = getLatestCheckUpSummary(history, assessments);
    const cards = getDomainProgressCards(history, assessments);

    expect(summary?.dateLabel).toContain('2026');
    expect(cards.find((card) => card.domain === 'strength')).toMatchObject({
      metric: 'Chair stands: 12 reps',
      body: 'This is your first check-up result. Repeat the check-up later to see what changes.',
      trend: 'unknown',
    });
  });

  it('summarizes check-up history rows in plain language', () => {
    const history = [
      stored(checkUpAt('2026-06-22T08:00:00.000Z', { chairReps: 12, tandemSec: 18, shoulderDeg: 150, reachBu: 0.32 })),
      stored(
        checkUpAt('2026-06-22T12:30:00.000Z', { chairReps: 15, tandemSec: 24, shoulderDeg: 162, reachBu: 0.2 }),
        'official_retest'
      ),
    ];
    const rows = getRetestHistory(history, assessmentsForHistory(history));

    expect(rows[0]).toMatchObject({
      kindLabel: '4-week check-up',
    });
    expect(rows[0].dateLabel).toContain(':');
    expect(rows[0].summaryLine).toMatch(/^4-week check-up · Plan focus: /);
    expect(rows[0].summaryLine).not.toMatch(/Strength:|Balance:|Mobility:|Focus area|In progress/);
    expect(rows[1].summaryLine).toMatch(/^First check-up · Plan focus: /);
  });

  it('packages latest check-up evidence with beta-safe home estimates and measured rows', () => {
    const history = [stored(checkUpAt(START, { chairReps: 12, tandemSec: 18, shoulderDeg: 150, reachBu: 0.32 }))];
    const evidence = getLatestDomainEvidence(history, assessmentsForHistory(history));
    const strength = evidence.find((card) => card.domain === 'strength');
    const balance = evidence.find((card) => card.domain === 'balance');
    const mobility = evidence.find((card) => card.domain === 'mobility');

    expect(evidence.map((card) => card.domain)).toEqual(['strength', 'balance', 'mobility']);
    expect(strength?.ageLabel).toMatch(/Beta home estimate: age \d+-\d+/);
    expect(balance?.ageLabel).toBe('Home estimate: one-leg balance hold');
    expect(mobility?.ageLabel).toBe('Home estimate: shoulder mobility');
    expect(strength?.metrics).toContainEqual({ label: 'Chair stands in 30s', display: '12 reps', measured: true });
    expect(evidence.map((card) => `${card.ageLabel} ${card.interpretation}`).join(' ')).not.toMatch(/diagnosis|fall-risk|frailty|typical ages/i);
  });

  it('renders strength, balance, and mobility higher readings from baseline to latest', () => {
    const history = [
      stored(checkUpAt(START, { chairReps: 12, tandemSec: 18, shoulderDeg: 150, reachBu: 0.32 })),
      stored(checkUpAt('2026-06-29T08:00:00.000Z', { chairReps: 15, tandemSec: 24, shoulderDeg: 162, reachBu: 0.2 }), 'official_retest'),
    ];
    const cards = getDomainProgressCards(history, assessmentsForHistory(history));

    expect(cards.find((card) => card.domain === 'strength')).toMatchObject({
      metric: 'Chair stands: 12 -> 15 reps',
      trend: 'higher',
    });
    expect(cards.find((card) => card.domain === 'balance')).toMatchObject({
      metric: 'Tandem hold: 18s -> 24s',
      trend: 'unknown',
    });
    expect(cards.find((card) => card.domain === 'balance')?.body).toContain('Side was not recorded');
    expect(cards.find((card) => card.domain === 'mobility')?.body).toContain('Side was not recorded');
  });

  it('does not show progress deltas across incompatible scoring snapshots', () => {
    const baseline = stored(checkUpAt(START, { chairReps: 12, tandemSec: 18, shoulderDeg: 150, reachBu: 0.32 }));
    const retest = stored(
      checkUpAt('2026-06-29T08:00:00.000Z', { chairReps: 15, tandemSec: 24, shoulderDeg: 162, reachBu: 0.2 }),
      'official_retest'
    );
    retest.scoreSnapshot = {
      ...retest.scoreSnapshot!,
      normVersion: retest.scoreSnapshot!.normVersion + 1,
    };
    retest.scoreSnapshotCompatibility = 'incompatible_version';

    const cards = getDomainProgressCards([baseline, retest], assessmentsForHistory([baseline, retest]));

    expect(cards.find((card) => card.domain === 'strength')).toMatchObject({
      metric: 'Chair stands: 15 reps',
      body: 'This is your first check-up result. Repeat the check-up later to see what changes.',
      trend: 'unknown',
    });
  });

  it('uses non-shaming copy when results are unchanged or lower', () => {
    const steadyHistory = [
      stored(checkUpAt(START, { chairReps: 12, tandemSec: 18, shoulderDeg: 150, reachBu: 0.32 })),
      stored(checkUpAt('2026-06-29T08:00:00.000Z', { chairReps: 12, tandemSec: 18, shoulderDeg: 150, reachBu: 0.32 }), 'official_retest'),
    ];
    const lowerHistory = [
      stored(checkUpAt(START, { chairReps: 12, tandemSec: 18, shoulderDeg: 150, reachBu: 0.32 })),
      stored(checkUpAt('2026-06-29T08:00:00.000Z', { chairReps: 10, tandemSec: 12, shoulderDeg: 145, reachBu: 0.4 }), 'official_retest'),
    ];
    const steady = getDomainProgressCards(steadyHistory, assessmentsForHistory(steadyHistory));
    const lower = getDomainProgressCards(lowerHistory, assessmentsForHistory(lowerHistory));

    expect(steady.find((card) => card.domain === 'strength')?.body).toContain('very close to your first check-up');
    expect(lower.find((card) => card.domain === 'strength')?.body).toContain('You completed 2 fewer chair stands');
    expect([...steady, ...lower].map((card) => `${card.metric} ${card.body}`).join(' ')).not.toMatch(/failed|frailty|fall risk|held steady|That can happen|improving/i);
  });

  it('summarises re-test due state and next re-test timing', () => {
    const checkUp = checkUpAt(START, { chairReps: 12, tandemSec: 18, shoulderDeg: 150, reachBu: 0.32 });
    const assessment = assessmentForCheckUp(checkUp);
    const scored = createCurrentVersionedScoreSnapshot(checkUp);
    const block = createMovementBlockFromAssessment({
      latestAssessment: { id: START, score: scored.score, scoreSnapshot: scored.snapshot, assessment },
      lifeGoal: createLifeGoal({ category: 'stairs', nowIso: START }),
      startDate: START,
    });

    expect(getRetestDueSummary({ activeBlock: block, today: '2026-06-10T08:00:00.000Z', hasBaseline: true })).toMatchObject({
      due: false,
      title: 'Next check-up',
    });
    expect(getRetestDueSummary({ activeBlock: block, today: '2026-06-29T08:00:00.000Z', hasBaseline: true })).toMatchObject({
      due: false,
    });
    expect(
      getRetestDueSummary({
        activeBlock: block,
        today: '2026-06-29T08:00:00.000Z',
        hasBaseline: true,
        completions: scheduledBlockCompletions(block),
      })
    ).toMatchObject({
      due: true,
      ctaLabel: 'Start check-up',
    });
  });

  it('shows current movement ladder levels and graceful empty state', () => {
    expect(getLadderProgressCards({})).toEqual([]);
    const cards = getLadderProgressCards({
      'sit-to-stand': {
        ladderId: 'sit-to-stand',
        currentLevelId: STS_STANDARD_ID,
        completedSessionsAtLevel: 1,
        failedSessionsAtLevel: 0,
        recentCompletionRates: [1],
        recentRpe: [2],
        recentPain: [false],
        readyToProgress: true,
        updatedAt: START,
      },
    });

    expect(cards[0]).toMatchObject({
      title: 'Sit-to-Stand',
      status: 'Ready for next step',
    });
  });

  it('keeps the official V1 check-up battery free of Up and Go', () => {
    expect(DEFAULT_BATTERY).toEqual([
      CHAIR_STAND_ID,
      BALANCE_LADDER_ID,
      SHOULDER_FLEXION_ID,
      HINGE_REACH_ID,
    ]);
    expect(DEFAULT_BATTERY).not.toContain(TUG_ID);
    expect(BETA_BATTERY_WITH_TUG).toContain(TUG_ID);
  });

  it('models the re-test sequence: store result, complete block, create report and next block', () => {
    const baseline = checkUpAt(START, { chairReps: 12, tandemSec: 18, shoulderDeg: 150, reachBu: 0.32 });
    const retest = checkUpAt('2026-06-29T08:00:00.000Z', { chairReps: 15, tandemSec: 24, shoulderDeg: 162, reachBu: 0.2 });
    const lifeGoal = createLifeGoal({ category: 'stairs', nowIso: START });
    const baselineAssessment = assessmentForCheckUp(baseline);
    const baselineScored = createCurrentVersionedScoreSnapshot(baseline);
    const block = createMovementBlockFromAssessment({
      latestAssessment: {
        id: baseline.startedAt,
        score: baselineScored.score,
        scoreSnapshot: baselineScored.snapshot,
        assessment: baselineAssessment,
      },
      lifeGoal,
      startDate: START,
    });
    const retestScored = createCurrentVersionedScoreSnapshot(retest);
    const retestScore = retestScored.score;
    const retestAssessment = createMovementAssessment({
      checkUpId: retest.startedAt,
      type: 'official_retest',
      score: retestScore,
      scoreSnapshot: retestScored.snapshot,
      sourceBlockId: block.id,
      completedAt: retest.startedAt,
      isOfficialForProgress: true,
    });

    let adherence = upsertMovementBlock(defaultAdherenceStoreState(), block);
    adherence = upsertMovementAssessment(adherence, retestAssessment);
    adherence = recordTrainingSessionCompletion(
      adherence,
      makeTrainingSessionCompletion({ block, sessionType: 'retest', completedAt: retest.startedAt, plannedDate: 'retest' })
    );
    adherence = markMovementBlockComplete(adherence, block.id, retest.startedAt);
    const completedBlock = adherence.blocks.find((item) => item.id === block.id)!;
    adherence = upsertMovementBlockReport(
      adherence,
      createMovementBlockReport({
        block: completedBlock,
        baselineAssessment,
        retestAssessment,
        previousScore: baselineScored.score,
        latestScore: retestScore,
        previousScoreSnapshot: baselineScored.snapshot,
        latestScoreSnapshot: retestScored.snapshot,
        completions: adherence.completions,
        nowIso: retest.startedAt,
      })
    );
    adherence = upsertMovementBlock(
      adherence,
      createMovementBlockFromAssessment({
        latestAssessment: {
          id: retest.startedAt,
          score: retestScore,
          scoreSnapshot: retestScored.snapshot,
          assessment: retestAssessment,
        },
        lifeGoal,
        startDate: retest.startedAt,
      })
    );

    expect(adherence.blocks.find((item) => item.id === block.id)?.status).toBe('completed');
    expect(adherence.blocks.filter((item) => item.status === 'active')).toHaveLength(1);
    expect(adherence.reports[0]).toMatchObject({
      blockId: block.id,
      retestAssessmentId: retestAssessment.id,
    });
    expect(getBlockReportSummaries({ blocks: adherence.blocks, reports: adherence.reports, completions: adherence.completions })).toHaveLength(1);
  });

  it('creates block reports without false deltas when snapshot versions differ', () => {
    const baseline = checkUpAt(START, { chairReps: 12, tandemSec: 18, shoulderDeg: 150, reachBu: 0.32 });
    const retest = checkUpAt('2026-06-29T08:00:00.000Z', { chairReps: 15, tandemSec: 24, shoulderDeg: 162, reachBu: 0.2 });
    const baselineScored = createCurrentVersionedScoreSnapshot(baseline);
    const retestScored = createCurrentVersionedScoreSnapshot(retest);
    const incompatibleSnapshot = {
      ...retestScored.snapshot!,
      normVersion: retestScored.snapshot!.normVersion + 1,
    };
    const baselineAssessment = assessmentForCheckUp(baseline);
    const retestAssessment = assessmentForCheckUp(retest, 'official_retest');
    const block = createMovementBlockFromAssessment({
      latestAssessment: {
        id: baseline.startedAt,
        score: baselineScored.score,
        scoreSnapshot: baselineScored.snapshot,
        assessment: baselineAssessment,
      },
      lifeGoal: createLifeGoal({ category: 'stairs', nowIso: START }),
      startDate: START,
    });

    const report = createMovementBlockReport({
      block,
      baselineAssessment,
      retestAssessment,
      previousScore: baselineScored.score,
      latestScore: retestScored.score,
      previousScoreSnapshot: baselineScored.snapshot,
      latestScoreSnapshot: incompatibleSnapshot,
      completions: [],
      nowIso: retest.startedAt,
    });

    expect(report.domainChanges).toEqual({});
    expect(report.comparison?.status).toBe('incompatible_version');
    expect(report.summary).toContain("direct comparison isn't available");
  });

  it('creates block reports without false deltas when snapshot sources do not match report endpoints', () => {
    const baseline = checkUpAt(START, { chairReps: 12, tandemSec: 18, shoulderDeg: 150, reachBu: 0.32 });
    const retest = checkUpAt('2026-06-29T08:00:00.000Z', { chairReps: 15, tandemSec: 24, shoulderDeg: 162, reachBu: 0.2 });
    const baselineScored = createCurrentVersionedScoreSnapshot(baseline);
    const retestScored = createCurrentVersionedScoreSnapshot(retest);
    const mismatchedBaselineSnapshot = {
      ...baselineScored.snapshot!,
      sourceCheckUpId: '2026-05-31T08:00:00.000Z',
    };
    const baselineAssessment = assessmentForCheckUp(baseline);
    const retestAssessment = assessmentForCheckUp(retest, 'official_retest');
    const block = createMovementBlockFromAssessment({
      latestAssessment: {
        id: baseline.startedAt,
        score: baselineScored.score,
        scoreSnapshot: baselineScored.snapshot,
        assessment: baselineAssessment,
      },
      lifeGoal: createLifeGoal({ category: 'stairs', nowIso: START }),
      startDate: START,
    })!;

    const report = createMovementBlockReport({
      block,
      baselineAssessment,
      retestAssessment,
      previousScore: baselineScored.score,
      latestScore: retestScored.score,
      previousScoreSnapshot: mismatchedBaselineSnapshot,
      latestScoreSnapshot: retestScored.snapshot,
      completions: [],
      nowIso: retest.startedAt,
    });

    expect(report.domainChanges).toEqual({});
    expect(report.comparison?.status).toBe('invalid_snapshot');
    expect(report.summary).toContain("direct comparison isn't available");
  });

  it('lets a legacy-origin active block complete without retro-scoring its baseline, then starts from the current re-test', () => {
    const legacyBaseline = checkUpAt(START, { chairReps: 12, tandemSec: 18, shoulderDeg: 150, reachBu: 0.32 });
    const retest = checkUpAt('2026-06-29T08:00:00.000Z', { chairReps: 15, tandemSec: 24, shoulderDeg: 162, reachBu: 0.2 });
    const lifeGoal = createLifeGoal({ category: 'stairs', nowIso: START });
    const legacyScore = scoreCheckUp(legacyBaseline);
    const legacyAssessment = createMovementAssessment({
      checkUpId: legacyBaseline.startedAt,
      type: 'baseline',
      score: legacyScore,
      completedAt: legacyBaseline.startedAt,
      isOfficialForProgress: true,
    });
    const legacyBlock: MovementBlock = {
      id: 'legacy-block-1',
      userId: 'local-device-user',
      lifeGoalId: lifeGoal.id,
      status: 'active',
      startDate: START,
      endDate: '2026-06-28T08:00:00.000Z',
      retestDate: '2026-06-29T08:00:00.000Z',
      focusDomain: 'strength_power',
      secondaryDomains: ['balance', 'mobility'],
      sessionsPerWeekTarget: 3,
      totalPlannedSessions: 12,
      completedSessions: 0,
      microChecksCompleted: 0,
      sourceAssessmentId: legacyBaseline.startedAt,
      createdAt: START,
      updatedAt: START,
    };
    const retestScored = createCurrentVersionedScoreSnapshot(retest);
    const retestAssessment = createMovementAssessment({
      checkUpId: retest.startedAt,
      type: 'official_retest',
      score: retestScored.score,
      scoreSnapshot: retestScored.snapshot,
      sourceBlockId: legacyBlock.id,
      completedAt: retest.startedAt,
      isOfficialForProgress: true,
    });
    const legacyRecord: StoredCheckUp = {
      schemaVersion: HISTORY_SCHEMA_VERSION,
      checkupType: 'baseline',
      checkUp: legacyBaseline,
      scoreSnapshotCompatibility: 'legacy_unversioned',
    };
    const currentRecord: StoredCheckUp = {
      schemaVersion: HISTORY_SCHEMA_VERSION,
      checkupType: 'official_retest',
      checkUp: retest,
      scoreSnapshot: retestScored.snapshot ?? undefined,
      scoreSnapshotCompatibility: 'current',
    };

    expect(
      tryCreateMovementBlockFromAssessment({
        latestAssessment: { id: legacyBaseline.startedAt, score: legacyScore, scoreSnapshot: null, assessment: legacyAssessment },
        lifeGoal,
        startDate: START,
      })
    ).toMatchObject({ ok: false, reason: 'missing_score_snapshot' });

    let adherence = upsertMovementBlock(defaultAdherenceStoreState(), legacyBlock);
    adherence = upsertMovementAssessment(adherence, legacyAssessment);
    adherence = upsertMovementAssessment(adherence, retestAssessment);
    adherence = recordTrainingSessionCompletion(
      adherence,
      makeTrainingSessionCompletion({ block: legacyBlock, sessionType: 'retest', completedAt: retest.startedAt, plannedDate: 'retest' })
    );
    adherence = markMovementBlockComplete(adherence, legacyBlock.id, retest.startedAt);
    const completedBlock = adherence.blocks.find((item) => item.id === legacyBlock.id)!;
    const report = createMovementBlockReport({
      block: completedBlock,
      baselineAssessment: legacyAssessment,
      retestAssessment,
      previousScore: null,
      latestScore: retestScored.score,
      previousScoreSnapshot: null,
      latestScoreSnapshot: retestScored.snapshot,
      completions: adherence.completions,
      nowIso: retest.startedAt,
    });
    adherence = upsertMovementBlockReport(adherence, report);
    adherence = upsertMovementBlock(
      adherence,
      createMovementBlockFromAssessment({
        latestAssessment: {
          id: retest.startedAt,
          score: retestScored.score,
          scoreSnapshot: retestScored.snapshot,
          assessment: retestAssessment,
        },
        lifeGoal,
        startDate: retest.startedAt,
      })
    );

    expect(adherence.blocks.find((item) => item.id === legacyBlock.id)?.status).toBe('completed');
    expect(adherence.blocks.filter((item) => item.status === 'active')).toHaveLength(1);
    expect(report.domainChanges).toEqual({});
    expect(report.comparison?.status).toBe('missing_snapshot');
    expect(getLatestCheckUpSummary([legacyRecord, currentRecord], [legacyAssessment, retestAssessment])?.dateLabel).toContain('2026');
    expect(getDomainProgressCards([legacyRecord, currentRecord], [legacyAssessment, retestAssessment]).find((card) => card.domain === 'strength')).toMatchObject({
      metric: 'Chair stands: 15 reps',
      trend: 'unknown',
    });
  });
});

function stored(checkUp: CheckUp, checkupType: CheckupType = 'baseline'): StoredCheckUp {
  const scored = createCurrentVersionedScoreSnapshot(checkUp);
  return {
    schemaVersion: HISTORY_SCHEMA_VERSION,
    checkupType,
    checkUp,
    scoreSnapshot: scored.snapshot ?? undefined,
    scoreSnapshotCompatibility: scored.snapshot ? 'current' : 'invalid_snapshot',
  };
}

function assessmentsForHistory(history: readonly StoredCheckUp[]): MovementAssessment[] {
  return history.map((record) => assessmentForCheckUp(record.checkUp, record.checkupType));
}

function assessmentForCheckUp(checkUp: CheckUp, type: CheckupType = 'baseline'): MovementAssessment {
  const scored = createCurrentVersionedScoreSnapshot(checkUp);
  return createMovementAssessment({
    checkUpId: checkUp.startedAt,
    type,
    score: scored.score,
    scoreSnapshot: scored.snapshot,
    completedAt: checkUp.startedAt,
    isOfficialForProgress: type === 'baseline' || type === 'baseline_retake' || type === 'official_retest',
  });
}

function scheduledBlockCompletions(block: MovementBlock): ReturnType<typeof makeTrainingSessionCompletion>[] {
  return [
    ...scheduledWeekCompletions(block, '2026-06-01'),
    ...scheduledWeekCompletions(block, '2026-06-08'),
    ...scheduledWeekCompletions(block, '2026-06-15'),
    ...scheduledWeekCompletions(block, '2026-06-22'),
  ];
}

function scheduledWeekCompletions(block: MovementBlock, startDateKey: string): ReturnType<typeof makeTrainingSessionCompletion>[] {
  const [year, month, day] = startDateKey.split('-').map(Number);
  const base = Date.UTC(year, month - 1, day, 9);
  return ['A', 'B', 'C'].map((label, index) => {
    const completedAt = new Date(base + index * 86400000).toISOString();
    const templateId = `${templatePrefix(block)}-${label}`;
    return makeTrainingSessionCompletion({
      block,
      sessionType: 'standard',
      completedAt,
      plannedDate: `${templateId}:${completedAt.slice(0, 10)}`,
      source: 'block_generated',
      templateId,
      mainPlanCredit: true,
      focusStimulusEvidence: scheduledFocusEvidence(block, templateId),
    });
  });
}

function scheduledFocusEvidence(block: MovementBlock, templateId: string): TrainingFocusStimulusEvidenceSummary {
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
  };
}

function templatePrefix(block: MovementBlock): 'strength' | 'balance' | 'mobility' {
  if (block.focusDomain === 'balance') return 'balance';
  if (block.focusDomain === 'mobility') return 'mobility';
  return 'strength';
}

function measured(movementId: string, result: MovementResultBase): CheckUpItem {
  return { movementId, status: 'measured', result };
}

function checkUpAt(
  startedAt: string,
  input: { chairReps: number; tandemSec: number; shoulderDeg: number; reachBu: number }
): CheckUp {
  const chair: ChairStandResult = {
    movementId: CHAIR_STAND_ID,
    flags: [],
    interruptions: 0,
    reps: input.chairReps,
    repStats: [],
    sessionMeanVel: 0.21,
    sessionMeanPeakVel: 0.29,
    pushOffDetected: false,
  };
  const balance: BalanceResult = {
    movementId: BALANCE_LADDER_ID,
    flags: [],
    interruptions: 0,
    stages: [
      { stance: 'feet-together', eyesClosed: false, holdSec: 10, swaySd: 0.01, terminated: 'completed' },
      { stance: 'tandem', eyesClosed: false, holdSec: input.tandemSec, swaySd: 0.02, terminated: 'completed' },
    ],
    singleLegEyesOpenSec: input.tandemSec / 2,
  };
  const shoulder: ShoulderFlexionResult = {
    movementId: SHOULDER_FLEXION_ID,
    flags: [],
    interruptions: 0,
    peakFlexionDeg: input.shoulderDeg,
  };
  const hinge: HingeReachResult = {
    movementId: HINGE_REACH_ID,
    flags: [],
    interruptions: 0,
    reachBu: input.reachBu,
  };

  return {
    startedAt,
    bodyUnit: 0.33,
    items: [
      measured(CHAIR_STAND_ID, chair),
      measured(BALANCE_LADDER_ID, balance),
      measured(SHOULDER_FLEXION_ID, shoulder),
      measured(HINGE_REACH_ID, hinge),
    ],
  };
}
