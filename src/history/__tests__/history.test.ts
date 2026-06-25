/**
 * History persistence + trends, all pure (in-memory fs adapter — no native
 * module). Covers schema-versioned (de)serialization incl. NaN→null, migration
 * rejection of foreign records, survival across a simulated restart, and
 * first→latest trend deltas with unmeasured points dropped.
 */

import { CheckUp } from '../../checkup/types';
import { createCheckUpProtocolPolicy, MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID } from '../../checkup/protocolPolicy';
import {
  createActiveShoulderReachV2Setup,
  createChairRiseV2Setup,
  createOneLegBalanceV2Setup,
} from '../../checkup/protocolSetup';
import {
  BALANCE_LADDER_ID,
  CHAIR_STAND_ID,
  TUG_ID,
} from '../../movements';
import {
  ACTIVE_SHOULDER_REACH_V2_ID,
  type ActiveShoulderReachV2Result,
} from '../../movements/activeShoulderReachV2';
import { CHAIR_RISE_V2_ID, type ChairRiseV2Result } from '../../movements/chairRiseV2';
import { ONE_LEG_BALANCE_V2_ID, type OneLegBalanceV2Result } from '../../movements/oneLegBalanceV2';
import { createMovementProfileV2Assessment, createMovementProfileV2Snapshot } from '../../reference/movementProfileV2';
import { CURRENT_SCORING_VERSION, createCurrentVersionedScoreSnapshot } from '../../scoring';
import { HISTORY_SCHEMA_VERSION, deserializeCheckUp, migrate, serializeCheckUp } from '../serialize';
import { HistoryStore, createMemoryFs } from '../store';
import { computeTrends, hasTrend } from '../trends';

interface Vals {
  reps?: number;
  vel?: number;
  singleLeg?: number;
  tug?: number;
}

function makeCheckUp(startedAt: string, v: Vals): CheckUp {
  return {
    startedAt,
    bodyUnit: 0.33,
    items: [
      {
        movementId: CHAIR_STAND_ID,
        status: 'measured',
        result: {
          movementId: CHAIR_STAND_ID,
          flags: [],
          interruptions: 0,
          reps: v.reps ?? 0,
          repStats: [],
          sessionMeanVel: v.vel ?? NaN,
          sessionMeanPeakVel: NaN,
          pushOffDetected: false,
        } as never,
      },
      {
        movementId: BALANCE_LADDER_ID,
        status: 'measured',
        result: {
          movementId: BALANCE_LADDER_ID,
          flags: [],
          interruptions: 0,
          stages: [],
          singleLegEyesOpenSec: v.singleLeg ?? NaN,
        } as never,
      },
      {
        movementId: TUG_ID,
        status: 'measured',
        result: {
          movementId: TUG_ID,
          flags: [],
          interruptions: 0,
          totalSec: v.tug ?? NaN,
          completed: v.tug !== undefined,
          turnDetected: true,
          peakExcursionBu: 1.9,
          nonStandardShortPath: false,
        } as never,
      },
    ],
  };
}

describe('check-up serialization', () => {
  it('round-trips through the current schema, NaN → null', () => {
    const stored = deserializeCheckUp(serializeCheckUp(makeCheckUp('2026-06-13T10:00:00.000Z', { reps: 14 })));
    expect(stored).not.toBeNull();
    expect(stored!.schemaVersion).toBe(HISTORY_SCHEMA_VERSION);
    expect(stored!.checkupType).toBe('legacy_unknown');
    expect(stored!.checkUp.items).toHaveLength(3);
    const chair = stored!.checkUp.items[0].result as unknown as { reps: number; sessionMeanVel: number | null };
    expect(chair.reps).toBe(14);
    expect(chair.sessionMeanVel).toBeNull(); // NaN persisted as null
    expect(stored!.checkUp.measurementProtocol).toMatchObject({
      protocolId: 'legacy_movement_age_battery_v1',
      protocolVersion: 1,
    });
    expect(stored!.checkUp.items.find((item) => item.movementId === CHAIR_STAND_ID)?.measurementContext)
      .toMatchObject({
        protocol: { protocolId: 'legacy_chair_stand_30s', protocolVersion: 1 },
        side: { role: 'not_applicable', selectedSide: null },
        comparability: { sideStatus: 'not_side_dependent' },
      });
    expect(stored!.checkUp.items.find((item) => item.movementId === BALANCE_LADDER_ID)?.measurementContext)
      .toMatchObject({
        protocol: { protocolId: 'legacy_balance_ladder_v1', protocolVersion: 1 },
        side: { role: 'standing_leg', selectedSide: null, source: 'legacy_unknown' },
        comparability: { sideStatus: 'side_unknown_raw_only', overallStatus: 'raw_only' },
      });
  });

  it('stores exact check-up type metadata for new records', () => {
    const stored = deserializeCheckUp(
      serializeCheckUp(makeCheckUp('2026-06-13T10:00:00.000Z', { reps: 14 }), {
        checkupType: 'quick_recheck',
        sourceAssessmentId: 'assessment-1',
        retryOfCheckUpId: 'baseline-1',
      })
    );

    expect(stored).toMatchObject({
      checkupType: 'quick_recheck',
      sourceAssessmentId: 'assessment-1',
      retryOfCheckUpId: 'baseline-1',
    });
  });

  it('migrate rejects garbage, foreign versions, and malformed records', () => {
    expect(migrate(null)).toBeNull();
    expect(migrate({ schemaVersion: 999, checkUp: { startedAt: 'x', items: [] } })).toBeNull();
    expect(migrate({ schemaVersion: HISTORY_SCHEMA_VERSION, checkUp: {} })).toBeNull();
    expect(deserializeCheckUp('not json')).toBeNull();
  });

  it('fails closed when a stored score snapshot belongs to a different check-up', () => {
    const checkUp = makeCheckUp('2026-06-13T10:00:00.000Z', { reps: 14, vel: 0.24, singleLeg: 12 });
    const otherCheckUp = makeCheckUp('2026-06-14T10:00:00.000Z', { reps: 10, vel: 0.18, singleLeg: 6 });
    const otherSnapshot = createCurrentVersionedScoreSnapshot(otherCheckUp).snapshot!;

    const stored = deserializeCheckUp(
      serializeCheckUp(checkUp, {
        checkupType: 'baseline',
        scoreSnapshot: otherSnapshot,
      })
    );

    expect(stored?.scoreSnapshot).toBeUndefined();
    expect(stored?.scoreSnapshotCompatibility).toBe('invalid_snapshot');
  });

  it('round-trips a valid Movement Profile V2 snapshot without embedding it in raw check-up JSON', () => {
    const checkUp = makeV2CheckUp('2026-06-23T10:00:00.000Z');
    const snapshot = movementProfileV2SnapshotFor(checkUp);

    const stored = deserializeCheckUp(
      serializeCheckUp({ ...checkUp, movementProfileV2Snapshot: snapshot }, { checkupType: 'baseline' })
    );

    expect(stored?.checkUp.startedAt).toBe(checkUp.startedAt);
    expect(stored?.scoreSnapshot).toBeUndefined();
    expect(stored?.scoreSnapshotCompatibility).toBe('unsupported_checkup_protocol');
    expect(stored?.movementProfileV2Snapshot?.snapshotFingerprint).toBe(snapshot.snapshotFingerprint);
    expect(stored?.movementProfileV2SnapshotCompatibility).toBe('current');
    expect(stored?.checkUp.movementProfileV2Snapshot).toBeUndefined();
    expect(stored?.checkUp.measurementProtocol).toMatchObject({
      protocolId: 'movement_profile_v2_battery',
      protocolVersion: 1,
    });
    expect(stored?.checkUp.items.find((item) => item.movementId === ONE_LEG_BALANCE_V2_ID)?.measurementContext)
      .toMatchObject({
        protocol: { protocolId: 'mpv2_single_leg_balance_45s_v1', protocolVersion: 1 },
        side: { role: 'standing_leg', selectedSide: 'left', observedSide: 'left' },
        comparability: { overallStatus: 'establishes_new_baseline' },
      });
  });

  it('round-trips a valid Movement Profile V2 assessment with its matching snapshot', () => {
    const checkUp = makeV2CheckUp('2026-06-23T10:00:00.000Z');
    const snapshot = movementProfileV2SnapshotFor(checkUp);
    const assessment = movementProfileV2AssessmentFor(checkUp, snapshot);

    const stored = deserializeCheckUp(
      serializeCheckUp(
        { ...checkUp, movementProfileV2Snapshot: snapshot, movementProfileV2Assessment: assessment },
        { checkupType: 'baseline' }
      )
    );

    expect(stored?.movementProfileV2Snapshot?.snapshotFingerprint).toBe(snapshot.snapshotFingerprint);
    expect(stored?.movementProfileV2Assessment?.assessmentFingerprint).toBe(assessment.assessmentFingerprint);
    expect(stored?.movementProfileV2AssessmentCompatibility).toBe('current');
    expect(stored?.checkUp.movementProfileV2Snapshot).toBeUndefined();
    expect(stored?.checkUp.movementProfileV2Assessment).toBeUndefined();
  });

  it('preserves raw V2 check-ups and snapshots while dropping mismatched V2 assessments', () => {
    const checkUp = makeV2CheckUp('2026-06-23T10:00:00.000Z');
    const snapshot = movementProfileV2SnapshotFor(checkUp);
    const otherCheckUp = makeV2CheckUp('2026-06-24T10:00:00.000Z');
    const otherSnapshot = movementProfileV2SnapshotFor(otherCheckUp);
    const otherAssessment = movementProfileV2AssessmentFor(otherCheckUp, otherSnapshot);

    const stored = deserializeCheckUp(
      serializeCheckUp(checkUp, {
        checkupType: 'baseline',
        movementProfileV2Snapshot: snapshot,
        movementProfileV2Assessment: otherAssessment,
      })
    );

    expect(stored?.checkUp.items).toHaveLength(3);
    expect(stored?.movementProfileV2Snapshot?.snapshotFingerprint).toBe(snapshot.snapshotFingerprint);
    expect(stored?.movementProfileV2Assessment).toBeUndefined();
    expect(stored?.movementProfileV2AssessmentCompatibility).toBe('source_mismatch');
  });

  it('preserves raw V2 check-ups while dropping malformed V2 snapshots', () => {
    const checkUp = makeV2CheckUp('2026-06-23T10:00:00.000Z');
    const malformedSnapshot = {
      ...movementProfileV2SnapshotFor(checkUp),
      snapshotFingerprint: 'tampered',
    };

    const stored = deserializeCheckUp(
      serializeCheckUp(checkUp, {
        checkupType: 'baseline',
        movementProfileV2Snapshot: malformedSnapshot as never,
      })
    );

    expect(stored?.checkUp.items).toHaveLength(3);
    expect(stored?.movementProfileV2Snapshot).toBeUndefined();
    expect(stored?.movementProfileV2SnapshotCompatibility).toBe('fingerprint_invalid');
  });

  it('does not store a legacy score snapshot on Movement Profile V2 check-ups', () => {
    const checkUp = makeV2CheckUp('2026-06-23T10:00:00.000Z');
    const legacySnapshot = createCurrentVersionedScoreSnapshot(
      makeCheckUp(checkUp.startedAt, { reps: 14, vel: 0.2, singleLeg: 10 })
    ).snapshot!;

    const stored = deserializeCheckUp(
      serializeCheckUp(checkUp, {
        checkupType: 'baseline',
        scoreSnapshot: legacySnapshot,
      })
    );

    expect(stored?.scoreSnapshot).toBeUndefined();
    expect(stored?.scoreSnapshotCompatibility).toBe('unsupported_checkup_protocol');
    expect(stored?.movementProfileV2Snapshot).toBeUndefined();
    expect(stored?.movementProfileV2SnapshotCompatibility).toBe('missing');
  });
});

describe('history store', () => {
  it('persists check-ups and survives a restart, oldest first', async () => {
    const disk = new Map<string, string>();
    const store1 = new HistoryStore(createMemoryFs(disk));
    store1.save(makeCheckUp('2026-05-10T09:00:00.000Z', { reps: 12 }));
    store1.save(makeCheckUp('2026-06-13T09:00:00.000Z', { reps: 14 }));

    // New store over the same "disk" = a fresh app launch.
    const store2 = new HistoryStore(createMemoryFs(disk));
    const all = await store2.loadAll();
    expect(all).toHaveLength(2);
    expect(all.map((r) => r.checkUp.startedAt)).toEqual([
      '2026-05-10T09:00:00.000Z',
      '2026-06-13T09:00:00.000Z',
    ]);
    expect((await store2.latest())!.checkUp.startedAt).toBe('2026-06-13T09:00:00.000Z');
  });

  it('never rewrites versioned, legacy, incompatible, or malformed records while reading history', async () => {
    const currentCheckUp = makeCheckUp('2026-05-10T09:00:00.000Z', { reps: 12, vel: 0.2, singleLeg: 8 });
    const incompatibleCheckUp = makeCheckUp('2026-06-10T09:00:00.000Z', { reps: 10, vel: 0.18, singleLeg: 6 });
    const malformedCheckUp = makeCheckUp('2026-07-10T09:00:00.000Z', { reps: 15, vel: 0.25, singleLeg: 14 });
    const currentSnapshot = createCurrentVersionedScoreSnapshot(currentCheckUp).snapshot!;
    const incompatibleSnapshot = {
      ...createCurrentVersionedScoreSnapshot(incompatibleCheckUp).snapshot!,
      scoringVersion: CURRENT_SCORING_VERSION + 1,
    };
    const malformedSnapshot = {
      ...createCurrentVersionedScoreSnapshot(malformedCheckUp).snapshot!,
      score: { domains: 'bad' },
    };
    const disk = new Map<string, string>([
      ['current.json', serializeCheckUp(currentCheckUp, { checkupType: 'baseline', scoreSnapshot: currentSnapshot })],
      [
        'incompatible.json',
        JSON.stringify({
          schemaVersion: HISTORY_SCHEMA_VERSION,
          checkupType: 'baseline',
          checkUp: incompatibleCheckUp,
          scoreSnapshot: incompatibleSnapshot,
          scoreSnapshotCompatibility: 'incompatible_version',
        }),
      ],
      ['legacy.json', serializeCheckUp(makeCheckUp('2026-04-10T09:00:00.000Z', { reps: 11 }), { checkupType: 'baseline' })],
      [
        'malformed.json',
        JSON.stringify({
          schemaVersion: HISTORY_SCHEMA_VERSION,
          checkupType: 'baseline',
          checkUp: malformedCheckUp,
          scoreSnapshot: malformedSnapshot,
          scoreSnapshotCompatibility: 'invalid_snapshot',
        }),
      ],
    ]);
    const before = new Map(disk);
    const memoryFs = createMemoryFs(disk);
    const write = jest.fn(memoryFs.write);
    const store = new HistoryStore({ ...memoryFs, write });

    await store.loadAll();
    await store.latest();

    expect(write).not.toHaveBeenCalled();
    expect(disk).toEqual(before);
  });
});

describe('trends', () => {
  const records = [
    makeCheckUp('2026-04-01T10:00:00.000Z', { reps: 11, vel: 0.18, singleLeg: 8, tug: 10.5 }),
    makeCheckUp('2026-05-01T10:00:00.000Z', { reps: 13, vel: 0.21, singleLeg: 10 }), // no TUG this time
    makeCheckUp('2026-06-01T10:00:00.000Z', { reps: 15, vel: 0.24, singleLeg: 12, tug: 9.0 }),
  ].map((c) => ({
    schemaVersion: HISTORY_SCHEMA_VERSION,
    checkupType: 'baseline' as const,
    checkUp: c,
    scoreSnapshotCompatibility: 'legacy_unversioned' as const,
  }));

  it('reports chronological points and first→latest deltas', () => {
    const trends = computeTrends(records);
    const vel = trends.find((t) => t.key === 'rise-velocity')!;
    expect(vel.points.map((p) => p.value)).toEqual([0.18, 0.21, 0.24]);
    expect(vel.delta).toBeCloseTo(0.06, 5);
    expect(vel.betterIsHigher).toBe(true);

    const tug = trends.find((t) => t.key === 'tug-time')!;
    expect(tug.points).toHaveLength(2); // the middle check-up skipped TUG
    expect(tug.delta).toBeCloseTo(-1.5, 5);
    expect(tug.betterIsHigher).toBe(false);
  });

  it('hasTrend is true once a metric has two measured points', () => {
    expect(hasTrend(records)).toBe(true);
    expect(hasTrend([records[0]])).toBe(false); // a single check-up: no trend yet
  });

  it('drops unmeasured points (NaN survives a serialize round-trip as null)', () => {
    const round = records.map((r) => deserializeCheckUp(serializeCheckUp(r.checkUp))!);
    const trends = computeTrends(round);
    // singleLeg present in all three; shoulder/hinge never measured → absent.
    expect(trends.find((t) => t.key === 'single-leg-balance')!.points).toHaveLength(3);
    expect(trends.find((t) => t.key === 'single-leg-balance')!.delta).toBeNull();
    expect(trends.find((t) => t.key === 'single-leg-balance')!.deltaSuppressedReason).toBe('insufficient_comparability');
    expect(trends.find((t) => t.key === 'shoulder-flexion')).toBeUndefined();
  });

  it('drops malformed and duplicated stored scoring inputs from trends', () => {
    const valid = makeCheckUp('2026-06-01T10:00:00.000Z', { reps: 12, vel: 0.2, singleLeg: 8 });
    const malformed = makeCheckUp('2026-06-15T10:00:00.000Z', { reps: 14, vel: 0.24, singleLeg: 999 });
    const duplicate = makeCheckUp('2026-06-29T10:00:00.000Z', { reps: 15, vel: 0.3, singleLeg: 10 });

    (malformed.items[0].result as unknown as Record<string, unknown>).reps = '14';
    duplicate.items.unshift({
      movementId: CHAIR_STAND_ID,
      status: 'measured',
      result: {
        movementId: CHAIR_STAND_ID,
        flags: [],
        interruptions: 0,
        reps: 20,
        repStats: [],
        sessionMeanVel: 0.4,
        sessionMeanPeakVel: 0.5,
        pushOffDetected: false,
      } as never,
    });

    const trends = computeTrends([valid, malformed, duplicate].map((checkUp) => deserializeCheckUp(serializeCheckUp(checkUp))!));

    expect(trends.find((t) => t.key === 'chair-stands')!.points.map((p) => p.value)).toEqual([12]);
    expect(trends.find((t) => t.key === 'rise-velocity')!.points.map((p) => p.value)).toEqual([0.2]);
    expect(trends.find((t) => t.key === 'single-leg-balance')!.points.map((p) => p.value)).toEqual([8, 10]);
  });
});

function makeV2CheckUp(startedAt: string, overrides: {
  chair?: ChairRiseV2Result;
  balance?: OneLegBalanceV2Result;
  shoulder?: ActiveShoulderReachV2Result;
} = {}): CheckUp {
  return {
    startedAt,
    protocolPolicy: createCheckUpProtocolPolicy(MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID, startedAt),
    bodyUnit: 1,
    items: [
      { movementId: CHAIR_RISE_V2_ID, status: 'measured', result: overrides.chair ?? chairV2Result() },
      { movementId: ONE_LEG_BALANCE_V2_ID, status: 'measured', result: overrides.balance ?? balanceV2Result() },
      { movementId: ACTIVE_SHOULDER_REACH_V2_ID, status: 'measured', result: overrides.shoulder ?? shoulderV2Result() },
    ],
  };
}

function movementProfileV2SnapshotFor(checkUp: CheckUp) {
  const created = createMovementProfileV2Snapshot({
    checkUp,
    checkupType: 'baseline',
    referenceProfile: { ageAtTest: 62, ageBasis: 'exact_age_at_test', referenceSex: 'female' },
    createdAt: checkUp.startedAt,
  });
  if (!created.ok) throw new Error(`expected V2 snapshot: ${created.reason}`);
  return created.snapshot;
}

function movementProfileV2AssessmentFor(checkUp: CheckUp, snapshot: ReturnType<typeof movementProfileV2SnapshotFor>) {
  const created = createMovementProfileV2Assessment({
    checkUp,
    snapshot,
    createdAt: checkUp.startedAt,
  });
  if (!created.ok) throw new Error(`expected V2 assessment: ${created.reason}`);
  return created.assessment;
}

function chairV2Result(overrides: Partial<ChairRiseV2Result> = {}): ChairRiseV2Result {
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

function balanceV2Result(overrides: Partial<OneLegBalanceV2Result> = {}): OneLegBalanceV2Result {
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

function shoulderV2Result(overrides: Partial<ActiveShoulderReachV2Result> = {}): ActiveShoulderReachV2Result {
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
