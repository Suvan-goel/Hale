import { createCheckUpProtocolPolicy, MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID } from '../../../checkup/protocolPolicy';
import {
  MOVEMENT_PROFILE_V2_BATTERY_PROTOCOL_ID,
  MOVEMENT_PROFILE_V2_BATTERY_PROTOCOL_VERSION_V1,
  PEARL_PROGRAMME_STRENGTH_BALANCE_PROTOCOL_VARIANT,
} from '../../../checkup/measurementProtocolRegistry';
import {
  createActiveShoulderReachV2Setup,
  createChairRiseV2Setup,
  createOneLegBalanceV2Setup,
} from '../../../checkup/protocolSetup';
import type { CheckUp } from '../../../checkup/types';
import {
  ACTIVE_SHOULDER_REACH_V2_ID,
  type ActiveShoulderReachV2Result,
} from '../../../movements/activeShoulderReachV2';
import { CHAIR_RISE_V2_ID, type ChairRiseV2Result } from '../../../movements/chairRiseV2';
import { ONE_LEG_BALANCE_V2_ID, type OneLegBalanceV2Result } from '../../../movements/oneLegBalanceV2';
import { createCurrentVersionedScoreSnapshot } from '../../../scoring';
import {
  attachMovementProfileV2Snapshot,
  createMovementProfileV2Snapshot,
  getMovementProfileV2SnapshotEligibility,
  movementProfileSnapshotCompatibility,
  parseStoredMovementProfileV2Snapshot,
  validMovementProfileV2SnapshotForCheckUp,
} from '../index';

const STARTED_AT = '2026-06-23T12:00:00.000Z';
const CREATED_AT = '2026-06-23T12:08:00.000Z';
const REFERENCE_PROFILE = {
  ageAtTest: 62,
  ageBasis: 'exact_age_at_test' as const,
  referenceSex: 'female' as const,
};

describe('Movement Profile V2 snapshots', () => {
  it('freezes a deterministic V2 interpretation without legacy scoring or focus fields', () => {
    const checkUp = v2CheckUp();
    const created = createMovementProfileV2Snapshot({
      checkUp,
      checkupType: 'baseline',
      referenceProfile: REFERENCE_PROFILE,
      createdAt: CREATED_AT,
    });

    expect(created.ok).toBe(true);
    if (!created.ok) throw new Error('expected snapshot');
    expect(created.snapshot).toMatchObject({
      sourceCheckUpId: STARTED_AT,
      sourceCheckUpType: 'baseline',
      protocolPolicy: { id: MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID, version: 1 },
      officialEvidencePolicyVersion: 1,
      displayPolicyVersion: 1,
      interpretation: {
        chair: { rawMetric: { value: 12 }, percentileRange: { kind: 'range', low: 10, high: 40 } },
        balance: { rawMetric: { value: 32 }, taskBand: 'building' },
        shoulder: { rawMetric: { value: 151, side: 'right' } },
      },
    });

    const parsed = parseStoredMovementProfileV2Snapshot(JSON.parse(JSON.stringify(created.snapshot)));
    expect(parsed.ok).toBe(true);
    expect(JSON.stringify(created.snapshot)).not.toMatch(
      /scoreSnapshot|weakestDomain|movementAge|focusSelection|suggestedFocus|MovementBlock/
    );
  });

  it('allows raw-only official evidence but rejects invalid or incomplete headline raw inputs', () => {
    const rawOnly = v2CheckUp({
      chair: chairResult({ evidenceStatus: 'raw_only_setup_uncertain' }),
      balance: balanceResult({ evidenceStatus: 'raw_only_tracking_uncertain' }),
      shoulder: shoulderResult({ evidenceStatus: 'raw_only_pain_limited', painLimited: true }),
    });

    expect(getMovementProfileV2SnapshotEligibility(rawOnly, 'official_retest')).toMatchObject({
      eligible: true,
    });
    expect(getMovementProfileV2SnapshotEligibility(rawOnly, 'manual_extra_v2')).toMatchObject({
      eligible: false,
      reason: 'v2_snapshot_ineligible_source_type',
    });

    const invalidBalance = v2CheckUp({
      balance: balanceResult({ evidenceStatus: 'invalid_measurement', bestHoldSec: Number.NaN }),
    });
    expect(getMovementProfileV2SnapshotEligibility(invalidBalance, 'official_retest')).toMatchObject({
      eligible: false,
      reason: 'v2_snapshot_raw_incomplete',
      missingDomains: ['balance'],
    });

    const duplicate = v2CheckUp();
    duplicate.items.push(duplicate.items[0]);
    expect(getMovementProfileV2SnapshotEligibility(duplicate, 'official_retest')).toMatchObject({
      eligible: false,
      reason: 'v2_snapshot_duplicate_headline_movement',
    });
  });

  it('allows a missing shoulder only for the exact frozen Pearl monthly battery', () => {
    const withoutShoulder = (measurementProtocol?: CheckUp['measurementProtocol']): CheckUp => ({
      ...v2CheckUp(),
      ...(measurementProtocol ? { measurementProtocol } : {}),
      items: v2CheckUp().items.filter((item) => item.movementId !== ACTIVE_SHOULDER_REACH_V2_ID),
    });
    const monthlyProtocol = {
      protocolId: MOVEMENT_PROFILE_V2_BATTERY_PROTOCOL_ID,
      protocolVersion: MOVEMENT_PROFILE_V2_BATTERY_PROTOCOL_VERSION_V1,
      protocolVariant: PEARL_PROGRAMME_STRENGTH_BALANCE_PROTOCOL_VARIANT,
    } as const;

    expect(getMovementProfileV2SnapshotEligibility(withoutShoulder(monthlyProtocol), 'baseline')).toMatchObject({
      eligible: true,
      rawCompleteness: { missingDomains: ['shoulder'] },
    });

    for (const nearMiss of [
      undefined,
      { ...monthlyProtocol, protocolId: 'some_other_battery' },
      { ...monthlyProtocol, protocolVersion: 2 },
      { ...monthlyProtocol, protocolVariant: 'some_other_variant' },
    ]) {
      expect(getMovementProfileV2SnapshotEligibility(withoutShoulder(nearMiss), 'baseline')).toMatchObject({
        eligible: false,
        reason: 'v2_snapshot_raw_incomplete',
        missingDomains: ['shoulder'],
      });
    }
  });

  it('binds snapshots to the exact source check-up and rejects mutated raw records', () => {
    const checkUp = v2CheckUp();
    const snapshot = mustCreateSnapshot(checkUp);

    const valid = validMovementProfileV2SnapshotForCheckUp({
      snapshot,
      checkUp,
      checkupType: 'baseline',
    });
    expect(valid?.snapshotFingerprint).toBe(snapshot.snapshotFingerprint);

    const mutated = v2CheckUp({ chair: chairResult({ reps: 13 }) });
    expect(
      validMovementProfileV2SnapshotForCheckUp({
        snapshot,
        checkUp: mutated,
        checkupType: 'baseline',
      })
    ).toBeNull();
  });

  it('binds the source fingerprint to the normalized top-level measurement protocol', () => {
    const measurementProtocol = {
      protocolId: MOVEMENT_PROFILE_V2_BATTERY_PROTOCOL_ID,
      protocolVersion: MOVEMENT_PROFILE_V2_BATTERY_PROTOCOL_VERSION_V1,
      protocolVariant: PEARL_PROGRAMME_STRENGTH_BALANCE_PROTOCOL_VARIANT,
    } as const;
    const checkUp = { ...v2CheckUp(), measurementProtocol };
    const snapshot = mustCreateSnapshot(checkUp);

    expect(
      validMovementProfileV2SnapshotForCheckUp({ snapshot, checkUp, checkupType: 'baseline' })
    ).not.toBeNull();
    expect(
      validMovementProfileV2SnapshotForCheckUp({
        snapshot,
        checkUp: {
          ...checkUp,
          measurementProtocol: { ...measurementProtocol, protocolVariant: 'changed_variant' },
        },
        checkupType: 'baseline',
      })
    ).toBeNull();
  });

  it('attaches snapshots idempotently and fails closed on conflicting snapshot material', () => {
    const checkUp = v2CheckUp();
    const snapshot = mustCreateSnapshot(checkUp);
    const attached = attachMovementProfileV2Snapshot({ checkUp, snapshot, checkupType: 'baseline' });

    expect(attached).toMatchObject({ attached: true, status: 'attached' });
    if (!attached.attached) throw new Error('expected attached snapshot');
    const idempotent = attachMovementProfileV2Snapshot({
      checkUp: attached.checkUp,
      snapshot,
      checkupType: 'baseline',
    });
    expect(idempotent).toMatchObject({ attached: true, status: 'idempotent' });

    const conflicting = {
      ...snapshot,
      snapshotFingerprint: 'mpv2-conflicting-fingerprint',
    };
    const conflict = attachMovementProfileV2Snapshot({
      checkUp: attached.checkUp,
      snapshot: conflicting,
      checkupType: 'baseline',
    });
    expect(conflict).toMatchObject({ attached: false, status: 'rejected' });
  });

  it('separates V2 snapshot compatibility from legacy V1 score snapshots', () => {
    const first = mustCreateSnapshot(v2CheckUp());
    const second = mustCreateSnapshot(
      v2CheckUp({
        balance: balanceResult({
          standingLeg: 'right',
          setup: createOneLegBalanceV2Setup({ standingLeg: 'right', confirmed: true }),
        }),
      }),
      '2026-06-24T12:00:00.000Z'
    );

    expect(movementProfileSnapshotCompatibility(first, second)).toMatchObject({
      compatible: true,
      kind: 'v2_same_policy',
      domainComparability: {
        chair: { rawComparable: true },
        balance: { rawComparable: false, sameStandingLeg: false },
        shoulder: { rawComparable: true, sameSide: true },
      },
    });

    const legacySnapshot = createCurrentVersionedScoreSnapshot({
      startedAt: STARTED_AT,
      bodyUnit: 1,
      items: [],
    }).snapshot;
    expect(movementProfileSnapshotCompatibility(first, legacySnapshot)).toEqual({
      compatible: false,
      reason: 'snapshot_policy_changed',
    });
  });
});

function mustCreateSnapshot(checkUp: CheckUp, createdAt = CREATED_AT) {
  const created = createMovementProfileV2Snapshot({
    checkUp,
    checkupType: 'baseline',
    referenceProfile: REFERENCE_PROFILE,
    createdAt,
  });
  if (!created.ok) throw new Error(`snapshot was not created: ${created.reason}`);
  return created.snapshot;
}

function v2CheckUp(overrides: {
  chair?: ChairRiseV2Result;
  balance?: OneLegBalanceV2Result;
  shoulder?: ActiveShoulderReachV2Result;
} = {}): CheckUp {
  return {
    startedAt: STARTED_AT,
    protocolPolicy: createCheckUpProtocolPolicy(MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID, STARTED_AT),
    bodyUnit: 1,
    items: [
      { movementId: CHAIR_RISE_V2_ID, status: 'measured', result: overrides.chair ?? chairResult() },
      { movementId: ONE_LEG_BALANCE_V2_ID, status: 'measured', result: overrides.balance ?? balanceResult() },
      { movementId: ACTIVE_SHOULDER_REACH_V2_ID, status: 'measured', result: overrides.shoulder ?? shoulderResult() },
    ],
  };
}

function chairResult(overrides: Partial<ChairRiseV2Result> = {}): ChairRiseV2Result {
  return {
    movementId: CHAIR_RISE_V2_ID,
    protocolPolicyId: MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
    evidenceStatus: 'reference_protocol_complete',
    setup: createChairRiseV2Setup({ confirmed: true }),
    setupConfidence: 'confirmed',
    practiceRepCompleted: true,
    activeWindowMs: 30000,
    activeMeasurementWindows: [{ startedAtMs: 0, endedAtMs: 30000, valid: true, reason: 'scheduled_active_window' }],
    fullStandRule: 'stand_completed_at_or_before_window_end',
    reps: 12,
    repStats: [],
    sessionMeanVel: 1.1,
    sessionMeanPeakVel: 1.4,
    pushOffDetected: false,
    fullStandAtExpiryCounted: false,
    invalidReasons: [],
    flags: [],
    interruptions: 0,
    ...overrides,
  };
}

function balanceResult(overrides: Partial<OneLegBalanceV2Result> = {}): OneLegBalanceV2Result {
  return {
    movementId: ONE_LEG_BALANCE_V2_ID,
    protocolPolicyId: MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
    evidenceStatus: 'reference_protocol_complete',
    setup: createOneLegBalanceV2Setup({ standingLeg: 'left', confirmed: true }),
    standingLeg: 'left',
    setupConfidence: 'confirmed',
    bestHoldSec: 32,
    bestTrialNumber: 1,
    validTrialCount: 3,
    attemptedTrialCount: 3,
    trials: [],
    rests: [],
    retryCount: 0,
    declinedRemainingTrials: false,
    hardCapReached: false,
    activeMeasurementWindows: [{ startedAtMs: 0, endedAtMs: 45000, valid: true, reason: 'trial_window' }],
    invalidReasons: [],
    flags: [],
    interruptions: 0,
    ...overrides,
  };
}

function shoulderResult(overrides: Partial<ActiveShoulderReachV2Result> = {}): ActiveShoulderReachV2Result {
  return {
    movementId: ACTIVE_SHOULDER_REACH_V2_ID,
    protocolPolicyId: MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
    evidenceStatus: 'reference_protocol_complete',
    setup: createActiveShoulderReachV2Setup({ selectedSide: 'right', confirmed: true }),
    selectedSide: 'right',
    setupConfidence: 'confirmed',
    peakFlexionDeg: 151,
    retryCount: 0,
    painLimited: false,
    validTrackingMs: 5000,
    activeMeasurementWindows: [{ startedAtMs: 0, endedAtMs: 9000, valid: true, reason: 'valid_capture' }],
    invalidReasons: [],
    flags: [],
    interruptions: 0,
    ...overrides,
  };
}
