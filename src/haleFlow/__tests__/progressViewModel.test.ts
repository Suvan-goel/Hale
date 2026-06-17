import {
  createLifeGoal,
  createMovementBlockFromAssessment,
  defaultAdherenceStoreState,
  makeTrainingSessionCompletion,
  markMovementBlockComplete,
  recordTrainingSessionCompletion,
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
import { scoreCheckUp } from '../../scoring';
import { STS_STANDARD_ID } from '../../exercises';
import { createMovementAssessment, createMovementBlockReport } from '..';
import {
  getBlockReportSummaries,
  getDomainProgressCards,
  getLadderProgressCards,
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
    const summary = getLatestCheckUpSummary(history);
    const cards = getDomainProgressCards(history);

    expect(summary?.dateLabel).toContain('2026');
    expect(cards.find((card) => card.domain === 'strength')).toMatchObject({
      metric: 'Chair stands: 12 reps',
      body: 'This is your starting point.',
      trend: 'unknown',
    });
  });

  it('renders strength, balance, and mobility improvements from baseline to latest', () => {
    const history = [
      stored(checkUpAt(START, { chairReps: 12, tandemSec: 18, shoulderDeg: 150, reachBu: 0.32 })),
      stored(checkUpAt('2026-06-29T08:00:00.000Z', { chairReps: 15, tandemSec: 26, shoulderDeg: 162, reachBu: 0.2 })),
    ];
    const cards = getDomainProgressCards(history);

    expect(cards.find((card) => card.domain === 'strength')).toMatchObject({
      metric: 'Chair stands: 12 -> 15 reps',
      trend: 'improved',
    });
    expect(cards.find((card) => card.domain === 'balance')).toMatchObject({
      metric: 'Tandem hold: 18s -> 26s',
      trend: 'improved',
    });
    expect(cards.find((card) => card.domain === 'mobility')?.body).toContain('improving');
  });

  it('uses non-shaming copy when results are unchanged or lower', () => {
    const steady = getDomainProgressCards([
      stored(checkUpAt(START, { chairReps: 12, tandemSec: 18, shoulderDeg: 150, reachBu: 0.32 })),
      stored(checkUpAt('2026-06-29T08:00:00.000Z', { chairReps: 12, tandemSec: 18, shoulderDeg: 150, reachBu: 0.32 })),
    ]);
    const lower = getDomainProgressCards([
      stored(checkUpAt(START, { chairReps: 12, tandemSec: 18, shoulderDeg: 150, reachBu: 0.32 })),
      stored(checkUpAt('2026-06-29T08:00:00.000Z', { chairReps: 10, tandemSec: 12, shoulderDeg: 145, reachBu: 0.4 })),
    ]);

    expect(steady.find((card) => card.domain === 'strength')?.body).toContain('held steady');
    expect(lower.find((card) => card.domain === 'strength')?.body).toContain('That can happen');
    expect(lower.map((card) => `${card.metric} ${card.body}`).join(' ')).not.toMatch(/failed|frailty|fall risk/i);
  });

  it('summarises re-test due state and next re-test timing', () => {
    const block = createMovementBlockFromAssessment({
      latestAssessment: { id: START, score: scoreCheckUp(checkUpAt(START, { chairReps: 12, tandemSec: 18, shoulderDeg: 150, reachBu: 0.32 })) },
      lifeGoal: createLifeGoal({ category: 'stairs', nowIso: START }),
      startDate: START,
    });

    expect(getRetestDueSummary({ activeBlock: block, today: '2026-06-10T08:00:00.000Z', hasBaseline: true })).toMatchObject({
      due: false,
      title: 'Next re-test',
    });
    expect(getRetestDueSummary({ activeBlock: block, today: '2026-06-29T08:00:00.000Z', hasBaseline: true })).toMatchObject({
      due: true,
      ctaLabel: 'Start re-test',
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
    const retest = checkUpAt('2026-06-29T08:00:00.000Z', { chairReps: 15, tandemSec: 26, shoulderDeg: 162, reachBu: 0.2 });
    const lifeGoal = createLifeGoal({ category: 'stairs', nowIso: START });
    const block = createMovementBlockFromAssessment({
      latestAssessment: { id: baseline.startedAt, score: scoreCheckUp(baseline) },
      lifeGoal,
      startDate: START,
    });
    const retestScore = scoreCheckUp(retest);
    const retestAssessment = createMovementAssessment({
      checkUpId: retest.startedAt,
      type: 'official_retest',
      score: retestScore,
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
        retestAssessment,
        previousScore: scoreCheckUp(baseline),
        latestScore: retestScore,
        completions: adherence.completions,
        nowIso: retest.startedAt,
      })
    );
    adherence = upsertMovementBlock(
      adherence,
      createMovementBlockFromAssessment({
        latestAssessment: { id: retest.startedAt, score: retestScore },
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
});

function stored(checkUp: CheckUp): StoredCheckUp {
  return { schemaVersion: HISTORY_SCHEMA_VERSION, checkUp };
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
