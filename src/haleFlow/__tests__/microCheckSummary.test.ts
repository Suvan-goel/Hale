import type { CheckUp } from '../../checkup';
import {
  MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
  createCheckUpProtocolPolicy,
} from '../../checkup';
import { HISTORY_SCHEMA_VERSION, type StoredCheckUp } from '../../history';
import {
  BALANCE_LADDER_ID,
  CHAIR_STAND_ID,
  HINGE_REACH_ID,
  ONE_LEG_BALANCE_V2_ID,
} from '../../movements';
import type { MicroCheckResult } from '../../training';
import { buildMicroCheckSummaryViewModel } from '../microCheckSummary';

const START = '2026-06-19T08:00:00.000Z';

describe('micro-check summary view model', () => {
  it('compares a scheduled chair-power result to the latest official chair velocity', () => {
    const summary = buildMicroCheckSummaryViewModel({
      result: microCheck({ type: 'chair-power', value: 0.42, reps: 5 }),
      source: 'scheduled',
      targetDomain: 'strength_power',
      scheduleWeekNumber: 2,
      history: [stored(legacyChairCheckUp(0.34))],
    });

    expect(summary.eyebrow).toBe('Week 2 micro-check');
    expect(summary.title).toBe('Your strength check is saved.');
    expect(summary.metricValue).toBe('0.42');
    expect(summary.comparisonKind).toBe('movement_checkup_delta');
    expect(summary.comparisonBody).toBe('Up 0.08 body units/sec since your last Movement Check-Up.');
  });

  it('uses a Movement Profile V2 one-leg balance result when that is the latest official comparison', () => {
    const summary = buildMicroCheckSummaryViewModel({
      result: microCheck({ type: 'single-leg-balance', value: 16, reps: 0 }),
      source: 'scheduled',
      targetDomain: 'balance',
      history: [stored(v2BalanceCheckUp(20), 'official_retest')],
    });

    expect(summary.metricValue).toBe('16');
    expect(summary.comparisonKind).toBe('movement_checkup_delta');
    expect(summary.comparisonBody).toBe('Down 4 sec since your last Movement Check-Up.');
    expect(summary.comparisonDetail).toBe('Last Movement Check-Up: 20 sec');
  });

  it('compares optional mobility directly to the last Movement Check-Up forward reach', () => {
    const summary = buildMicroCheckSummaryViewModel({
      result: microCheck({ type: 'mobility-reach', value: 0.24, reps: 0 }),
      source: 'optional',
      targetDomain: 'mobility',
      history: [stored(legacyChairCheckUp(0.34))],
    });

    expect(summary.title).toBe('Extra mobility check saved.');
    expect(summary.metricLabel).toBe('Forward reach');
    expect(summary.metricValue).toBe('0.24');
    expect(summary.metricUnit).toBe('body units');
    expect(summary.comparisonKind).toBe('movement_checkup_delta');
    expect(summary.comparisonBody).toBe('Closer by 0.06 body units since your last Movement Check-Up.');
    expect(summary.comparisonDetail).toBe('Last Movement Check-Up: 0.30 body units');
  });

  it('does not present an unsaved result as a saved metric', () => {
    const summary = buildMicroCheckSummaryViewModel({
      result: microCheck({ type: 'chair-power', value: 0.42, reps: 5 }),
      source: 'optional',
      targetDomain: 'strength_power',
      saved: false,
      history: [stored(legacyChairCheckUp(0.34))],
    });

    expect(summary.title).toBe('Micro-check complete.');
    expect(summary.metricValue).toBe('Not saved');
    expect(summary.comparisonKind).toBe('not_saved');
  });
});

function microCheck(overrides: Partial<MicroCheckResult>): MicroCheckResult {
  return {
    type: 'chair-power',
    startedAt: '2026-06-28T08:00:00.000Z',
    value: 0.4,
    reps: 5,
    measured: true,
    ...overrides,
  };
}

function stored(checkUp: CheckUp, checkupType: StoredCheckUp['checkupType'] = 'baseline'): StoredCheckUp {
  return {
    schemaVersion: HISTORY_SCHEMA_VERSION,
    checkupType,
    checkUp,
    scoreSnapshotCompatibility: 'legacy_unversioned',
  };
}

function legacyChairCheckUp(sessionMeanVel: number): CheckUp {
  return {
    startedAt: START,
    bodyUnit: 0.33,
    items: [
      measured(CHAIR_STAND_ID, {
        reps: 12,
        repStats: [],
        sessionMeanVel,
        sessionMeanPeakVel: sessionMeanVel + 0.1,
        pushOffDetected: false,
      }),
      measured(BALANCE_LADDER_ID, {
        stages: [],
        singleLegEyesOpenSec: 10,
      }),
      measured(HINGE_REACH_ID, {
        reachBu: 0.3,
      }),
    ],
  };
}

function v2BalanceCheckUp(bestHoldSec: number): CheckUp {
  return {
    startedAt: START,
    protocolPolicy: createCheckUpProtocolPolicy(MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID, START),
    bodyUnit: 0.33,
    items: [
      measured(ONE_LEG_BALANCE_V2_ID, {
        protocolPolicyId: MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
        evidenceStatus: 'reference_protocol_complete',
        bestHoldSec,
      }),
    ],
  };
}

function measured(movementId: string, result: Record<string, unknown>): CheckUp['items'][number] {
  return {
    movementId,
    status: 'measured',
    result: {
      movementId,
      flags: [],
      interruptions: 0,
      ...result,
    } as never,
  };
}
