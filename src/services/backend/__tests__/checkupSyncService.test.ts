import { BALANCE_LADDER_ID, CHAIR_STAND_ID, SHOULDER_FLEXION_ID } from '../../../movements';
import {
  MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
  createActiveShoulderReachV2Setup,
  createCheckUpProtocolPolicy,
  createChairRiseV2Setup,
  createOneLegBalanceV2Setup,
  type CheckUp,
} from '../../../checkup';
import {
  ACTIVE_SHOULDER_REACH_V2_ID,
  type ActiveShoulderReachV2Result,
} from '../../../movements/activeShoulderReachV2';
import { CHAIR_RISE_V2_ID, type ChairRiseV2Result } from '../../../movements/chairRiseV2';
import { ONE_LEG_BALANCE_V2_ID, type OneLegBalanceV2Result } from '../../../movements/oneLegBalanceV2';
import { createMovementProfileV2Assessment, createMovementProfileV2Snapshot } from '../../../reference/movementProfileV2';
import { CURRENT_NORM_VERSION, CURRENT_SCORING_VERSION, createCurrentVersionedScoreSnapshot, type VersionedCheckUpScoreSnapshot } from '../../../scoring';
import { mapLocalCheckupToRemotePayload } from '../checkupSyncService';

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('../authService', () => ({
  getCurrentSession: jest.fn(),
}));

function checkUp(): CheckUp {
  return {
    startedAt: '2026-06-17T12:00:00.000Z',
    bodyUnit: 0.33,
    items: [
      {
        movementId: CHAIR_STAND_ID,
        status: 'measured',
        result: {
          movementId: CHAIR_STAND_ID,
          flags: [],
          interruptions: 0,
          reps: 14,
          repStats: [],
          sessionMeanVel: 0.28,
          sessionMeanPeakVel: 0.41,
          pushOffDetected: false,
          frames: [{ shouldNotUpload: true }],
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
          singleLegEyesOpenSec: 12,
          landmarks: [{ shouldNotUpload: true }],
        } as never,
      },
      {
        movementId: SHOULDER_FLEXION_ID,
        status: 'measured',
        result: {
          movementId: SHOULDER_FLEXION_ID,
          flags: [],
          interruptions: 0,
          peakFlexionDeg: 152,
        } as never,
      },
    ],
  };
}

describe('movement check-up sync mapping', () => {
  it('maps local check-up results into an idempotent remote payload', () => {
    const payload = mapLocalCheckupToRemotePayload(
      {
        checkUp: checkUp(),
        checkupType: 'baseline',
        completedAt: '2026-06-17T12:08:00.000Z',
      },
      'user-123'
    );

    expect(payload.user_id).toBe('user-123');
    expect(payload.local_checkup_id).toBe('2026-06-17T12:00:00.000Z');
    expect(payload.checkup_type).toBe('baseline');
    expect(payload.status).toBe('completed');
    expect(payload.body_unit).toBe(0.33);
    expect(payload.strength_power_score).toEqual(expect.any(Number));
    expect(payload.balance_score).toEqual(expect.any(Number));
    expect(payload.mobility_score).toEqual(expect.any(Number));
    expect(payload.weakest_domain).toMatch(/strength_power|balance|mobility/);
    expect(payload.created_locally_at).toBe('2026-06-17T12:00:00.000Z');
    expect(payload.completed_at).toBe('2026-06-17T12:08:00.000Z');
    expect(payload.derived_scores_json).toMatchObject({
      checkupType: 'baseline',
      exactCheckupType: 'baseline',
      scoreSnapshotCompatibility: 'current',
      scoringVersion: CURRENT_SCORING_VERSION,
      normVersion: CURRENT_NORM_VERSION,
    });
    expect(payload.derived_scores_json).toHaveProperty('scoreSnapshot');
    expect(payload.raw_checkup_json).toMatchObject({ checkupType: 'baseline' });
    expect(payload.raw_checkup_json).toHaveProperty('scoreSnapshot');
    expect(payload.raw_checkup_json).toMatchObject({
      checkUp: {
        measurementProtocol: {
          protocolId: 'legacy_movement_age_battery_v1',
          protocolVersion: 1,
        },
        items: expect.arrayContaining([
          expect.objectContaining({
            movementId: CHAIR_STAND_ID,
            measurementContext: expect.objectContaining({
              protocol: { protocolId: 'legacy_chair_stand_30s', protocolVersion: 1 },
              side: expect.objectContaining({ role: 'not_applicable' }),
            }),
          }),
          expect.objectContaining({
            movementId: BALANCE_LADDER_ID,
            measurementContext: expect.objectContaining({
              comparability: expect.objectContaining({ overallStatus: 'raw_only' }),
            }),
          }),
        ]),
      },
    });

    const rawJson = JSON.stringify(payload.raw_checkup_json);
    expect(rawJson).not.toContain('frames');
    expect(rawJson).not.toContain('landmarks');
    expect(rawJson).not.toContain('shouldNotUpload');
  });

  it('maps local-only check-up variants to unknown when the remote enum has no exact type', () => {
    const payload = mapLocalCheckupToRemotePayload(
      {
        checkUp: checkUp(),
        checkupType: 'baseline_retake',
      },
      'user-123'
    );

    expect(payload.checkup_type).toBe('unknown');
    expect(payload.derived_scores_json).toMatchObject({
      checkupType: 'baseline_retake',
      exactCheckupType: 'baseline_retake',
    });
    expect(payload.raw_checkup_json).toMatchObject({ checkupType: 'baseline_retake' });
  });

  it('omits malformed movement scores from derived remote fields without dropping other domains', () => {
    const malformed = checkUp();
    (malformed.items[0].result as unknown as Record<string, unknown>).reps = '14';

    const payload = mapLocalCheckupToRemotePayload(
      {
        checkUp: malformed,
        checkupType: 'baseline',
      },
      'user-123'
    );

    expect(payload.strength_power_score).toBeUndefined();
    expect(payload.balance_score).toEqual(expect.any(Number));
    expect(payload.mobility_score).toEqual(expect.any(Number));
    expect(payload.weakest_domain).not.toBe('strength_power');
    expect(JSON.stringify(payload.derived_scores_json)).not.toContain('14 reps');
  });

  it('does not silently rescore legacy history records when no snapshot is supplied', () => {
    const payload = mapLocalCheckupToRemotePayload(
      {
        checkUp: checkUp(),
        checkupType: 'baseline',
        scoreSnapshot: null,
      },
      'user-123'
    );

    expect(payload.strength_power_score).toBeUndefined();
    expect(payload.balance_score).toBeUndefined();
    expect(payload.mobility_score).toBeUndefined();
    expect(payload.weakest_domain).toBeUndefined();
    expect(payload.derived_scores_json).toMatchObject({
      scoreSnapshot: null,
      scoreSnapshotCompatibility: 'legacy_unversioned',
      score: null,
    });
  });

  it('keeps Movement Profile V2 check-ups raw-only during sync', () => {
    const rawCheckUp = checkUp();
    rawCheckUp.protocolPolicy = createCheckUpProtocolPolicy(MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID, rawCheckUp.startedAt);

    const payload = mapLocalCheckupToRemotePayload(
      {
        checkUp: rawCheckUp,
        checkupType: 'baseline',
      },
      'user-123'
    );

    expect(payload.strength_power_score).toBeUndefined();
    expect(payload.balance_score).toBeUndefined();
    expect(payload.mobility_score).toBeUndefined();
    expect(payload.weakest_domain).toBeUndefined();
    expect(payload.derived_scores_json).toMatchObject({
      scoreSnapshot: null,
      scoreSnapshotCompatibility: 'unsupported_checkup_protocol',
      score: null,
    });
    expect(payload.raw_checkup_json).toMatchObject({
      checkUp: {
        protocolPolicy: {
          id: MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
        },
      },
    });
  });

  it('syncs valid Movement Profile V2 snapshots without deriving legacy scores', () => {
    const rawCheckUp = v2CheckUp();
    const snapshot = movementProfileV2SnapshotFor(rawCheckUp);

    const payload = mapLocalCheckupToRemotePayload(
      {
        checkUp: rawCheckUp,
        checkupType: 'baseline',
        movementProfileV2Snapshot: snapshot,
      },
      'user-123'
    );

    expect(payload.strength_power_score).toBeUndefined();
    expect(payload.balance_score).toBeUndefined();
    expect(payload.mobility_score).toBeUndefined();
    expect(payload.weakest_domain).toBeUndefined();
    expect(payload.derived_scores_json).toMatchObject({
      scoreSnapshot: null,
      scoreSnapshotCompatibility: 'unsupported_checkup_protocol',
      score: null,
      weakestDomain: null,
      movementProfileV2Snapshot: {
        snapshotFingerprint: snapshot.snapshotFingerprint,
        sourceCheckUpId: rawCheckUp.startedAt,
      },
      movementProfileV2SnapshotCompatibility: 'current',
      movementProfileV2SnapshotSchemaVersion: 1,
    });
    expect(payload.raw_checkup_json).toMatchObject({
      movementProfileV2Snapshot: {
        snapshotFingerprint: snapshot.snapshotFingerprint,
      },
    });
    expect((payload.raw_checkup_json as Record<string, { movementProfileV2Snapshot?: unknown }>).checkUp)
      .not.toHaveProperty('movementProfileV2Snapshot');
  });

  it('syncs valid Movement Profile V2 assessments only when they match the selected snapshot', () => {
    const rawCheckUp = v2CheckUp();
    const snapshot = movementProfileV2SnapshotFor(rawCheckUp);
    const assessment = movementProfileV2AssessmentFor(rawCheckUp, snapshot);

    const payload = mapLocalCheckupToRemotePayload(
      {
        checkUp: rawCheckUp,
        checkupType: 'baseline',
        movementProfileV2Snapshot: snapshot,
        movementProfileV2Assessment: assessment,
      },
      'user-123'
    );

    expect(payload.derived_scores_json).toMatchObject({
      movementProfileV2Snapshot: {
        snapshotFingerprint: snapshot.snapshotFingerprint,
      },
      movementProfileV2Assessment: {
        assessmentFingerprint: assessment.assessmentFingerprint,
        sourceSnapshotFingerprint: snapshot.snapshotFingerprint,
      },
      movementProfileV2AssessmentCompatibility: 'current',
      movementProfileV2AssessmentSchemaVersion: 1,
    });
    expect(payload.raw_checkup_json).toMatchObject({
      movementProfileV2Assessment: {
        assessmentFingerprint: assessment.assessmentFingerprint,
      },
    });
    expect((payload.raw_checkup_json as Record<string, { movementProfileV2Assessment?: unknown }>).checkUp)
      .not.toHaveProperty('movementProfileV2Assessment');
  });

  it('omits Movement Profile V2 snapshots whose source check-up no longer matches', () => {
    const snapshotSource = v2CheckUp();
    const rawCheckUp = v2CheckUp({ chair: chairV2Result({ reps: 13 }) });
    const snapshot = movementProfileV2SnapshotFor(snapshotSource);

    const payload = mapLocalCheckupToRemotePayload(
      {
        checkUp: rawCheckUp,
        checkupType: 'baseline',
        movementProfileV2Snapshot: snapshot,
      },
      'user-123'
    );

    expect(payload.derived_scores_json).toMatchObject({
      movementProfileV2Snapshot: null,
      movementProfileV2SnapshotCompatibility: 'source_mismatch',
      scoreSnapshot: null,
      scoreSnapshotCompatibility: 'unsupported_checkup_protocol',
      score: null,
    });
    expect(payload.raw_checkup_json).toMatchObject({
      movementProfileV2Snapshot: null,
      movementProfileV2SnapshotCompatibility: 'source_mismatch',
    });
  });

  it('omits Movement Profile V2 assessments whose source snapshot no longer matches', () => {
    const rawCheckUp = v2CheckUp();
    const snapshot = movementProfileV2SnapshotFor(rawCheckUp);
    const otherCheckUp = v2CheckUp({ chair: chairV2Result({ reps: 13 }) });
    const otherSnapshot = movementProfileV2SnapshotFor(otherCheckUp);
    const otherAssessment = movementProfileV2AssessmentFor(otherCheckUp, otherSnapshot);

    const payload = mapLocalCheckupToRemotePayload(
      {
        checkUp: rawCheckUp,
        checkupType: 'baseline',
        movementProfileV2Snapshot: snapshot,
        movementProfileV2Assessment: otherAssessment,
      },
      'user-123'
    );

    expect(payload.derived_scores_json).toMatchObject({
      movementProfileV2Snapshot: {
        snapshotFingerprint: snapshot.snapshotFingerprint,
      },
      movementProfileV2Assessment: null,
      movementProfileV2AssessmentCompatibility: 'source_mismatch',
    });
    expect(payload.raw_checkup_json).toMatchObject({
      movementProfileV2Assessment: null,
      movementProfileV2AssessmentCompatibility: 'source_mismatch',
    });
  });

  it('uses a supplied frozen snapshot instead of rescoring raw check-up measurements during sync', () => {
    const rawCheckUp = checkUp();
    const snapshotCheckUp = checkUp();
    const chair = snapshotCheckUp.items.find((item) => item.movementId === CHAIR_STAND_ID)!;
    (chair.result as unknown as Record<string, unknown>).reps = 8;
    const snapshotScore = createCurrentVersionedScoreSnapshot(snapshotCheckUp).snapshot!;
    const frozenStrengthMidpoint = domainMidpoint(snapshotScore.score, 'strength');
    const rawStrengthMidpoint = domainMidpoint(createCurrentVersionedScoreSnapshot(rawCheckUp).score, 'strength');

    const payload = mapLocalCheckupToRemotePayload(
      {
        checkUp: rawCheckUp,
        checkupType: 'baseline',
        scoreSnapshot: snapshotScore,
      },
      'user-123'
    );

    expect(frozenStrengthMidpoint).not.toBe(rawStrengthMidpoint);
    expect(payload.strength_power_score).toBe(frozenStrengthMidpoint);
    expect(payload.derived_scores_json).toMatchObject({
      scoreSnapshotCompatibility: 'current',
      score: snapshotScore.score,
    });
    expect(payload.raw_checkup_json).toMatchObject({ scoreSnapshot: snapshotScore });
  });

  it('keeps exact-tie focus metadata inside the synced score snapshot', () => {
    const rawCheckUp = checkUp();
    const snapshot = exactTieSnapshotFor(rawCheckUp);

    const payload = mapLocalCheckupToRemotePayload(
      {
        checkUp: rawCheckUp,
        checkupType: 'official_retest',
        scoreSnapshot: snapshot,
      },
      'user-123'
    );

    expect(payload.weakest_domain).toBe('balance');
    expect(payload.derived_scores_json).toMatchObject({
      scoreSnapshot: {
        focusSelection: {
          kind: 'exact_tie',
          focusDomain: 'balance',
          tiedDomains: ['strength', 'balance'],
          tieBreakReason: 'preserve_current_focus',
        },
      },
    });
    expect(payload.raw_checkup_json).toMatchObject({
      scoreSnapshot: {
        focusSelection: {
          kind: 'exact_tie',
          focusDomain: 'balance',
        },
      },
    });
  });

  it('does not upload derived scores when a supplied snapshot source differs from the raw check-up', () => {
    const rawCheckUp = checkUp();
    const otherCheckUp = { ...checkUp(), startedAt: '2026-06-18T12:00:00.000Z' };
    const otherSnapshot = createCurrentVersionedScoreSnapshot(otherCheckUp).snapshot!;

    const payload = mapLocalCheckupToRemotePayload(
      {
        checkUp: rawCheckUp,
        checkupType: 'baseline',
        scoreSnapshot: otherSnapshot,
      },
      'user-123'
    );

    expect(payload.strength_power_score).toBeUndefined();
    expect(payload.balance_score).toBeUndefined();
    expect(payload.mobility_score).toBeUndefined();
    expect(payload.weakest_domain).toBeUndefined();
    expect(payload.derived_scores_json).toMatchObject({
      scoreSnapshot: null,
      scoreSnapshotCompatibility: 'invalid_snapshot',
      scoreSnapshotSchemaVersion: null,
      scoringVersion: null,
      normVersion: null,
      score: null,
    });
    expect(payload.raw_checkup_json).toMatchObject({ scoreSnapshot: null });
  });
});

function domainMidpoint(
  score: { domains: readonly { domain: string; ageLow: number | null; ageHigh: number | null }[] },
  domain: string
): number {
  const result = score.domains.find((item) => item.domain === domain)!;
  if (result.ageLow === null || result.ageHigh === null) throw new Error(`Domain ${domain} was not measured`);
  return (result.ageLow + result.ageHigh) / 2;
}

function exactTieSnapshotFor(checkUp: CheckUp): VersionedCheckUpScoreSnapshot {
  const snapshot = createCurrentVersionedScoreSnapshot(checkUp).snapshot!;
  return {
    ...snapshot,
    score: {
      ...snapshot.score,
      weakestDomain: 'balance',
      domains: snapshot.score.domains.map((domain) => {
        if (domain.domain === 'strength' || domain.domain === 'balance') {
          return { ...domain, measured: true, ageLow: 72, ageHigh: 76 };
        }
        return { ...domain, measured: true, ageLow: 58, ageHigh: 62 };
      }),
    },
    focusSelection: {
      kind: 'exact_tie',
      focusDomain: 'balance',
      tiedDomains: ['strength', 'balance'],
      tieBreakReason: 'preserve_current_focus',
    },
  };
}

function v2CheckUp(overrides: {
  chair?: ChairRiseV2Result;
  balance?: OneLegBalanceV2Result;
  shoulder?: ActiveShoulderReachV2Result;
} = {}): CheckUp {
  const startedAt = '2026-06-23T12:00:00.000Z';
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
