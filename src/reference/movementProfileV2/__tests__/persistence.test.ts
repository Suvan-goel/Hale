import { createCheckUpProtocolPolicy, MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID } from '../../../checkup/protocolPolicy';
import {
  createActiveShoulderReachV2Setup,
  createChairRiseV2Setup,
  createOneLegBalanceV2Setup,
} from '../../../checkup/protocolSetup';
import type { CheckUp } from '../../../checkup/types';
import type { LifeGoal } from '../../../adherence/types';
import {
  ACTIVE_SHOULDER_REACH_V2_ID,
  type ActiveShoulderReachV2Result,
} from '../../../movements/activeShoulderReachV2';
import { CHAIR_RISE_V2_ID, type ChairRiseV2Result } from '../../../movements/chairRiseV2';
import { ONE_LEG_BALANCE_V2_ID, type OneLegBalanceV2Result } from '../../../movements/oneLegBalanceV2';
import {
  MOVEMENT_PROFILE_V2_ARTIFACT_ORCHESTRATION_POLICY_FINGERPRINT,
  MOVEMENT_PROFILE_V2_ASSESSMENT_PERSISTENCE_POLICY_FINGERPRINT,
  attachMovementProfileV2Assessment,
  createMovementProfileV2Assessment,
  createMovementProfileV2Snapshot,
  getMovementProfileV2AssessmentPersistenceEligibility,
  latestOfficialMovementProfileV2AssessmentBeforeCheckUp,
  materializeOfficialMovementProfileV2Artifacts,
  movementProfileV2AssessmentRecordForSourceCheckUpId,
  priorMovementProfileV2FocusContextForCheckUp,
  selectOfficialMovementProfileV2AssessmentRecords,
  validateMovementProfileV2AssessmentSource,
  type MovementProfileV2Assessment,
  type StoredMovementProfileV2Snapshot,
} from '..';

const REFERENCE_PROFILE = { ageAtTest: 62, ageBasis: 'exact_age_at_test' as const, referenceSex: 'female' as const };

describe('Movement Profile V2 assessment persistence', () => {
  it('exposes deterministic policy fingerprints', () => {
    expect(MOVEMENT_PROFILE_V2_ASSESSMENT_PERSISTENCE_POLICY_FINGERPRINT).toMatch(
      /^mpv2-assessment-persistence-policy-v1-/
    );
    expect(MOVEMENT_PROFILE_V2_ARTIFACT_ORCHESTRATION_POLICY_FINGERPRINT).toMatch(
      /^mpv2-artifact-orchestration-policy-v1-/
    );
  });

  it('validates only source-bound official V2 assessments for persistence', () => {
    const checkUp = makeV2CheckUp('2026-06-23T08:00:00.000Z');
    const snapshot = snapshotFor(checkUp);
    const assessment = assessmentFor(checkUp, snapshot);

    expect(validateMovementProfileV2AssessmentSource({ checkUp, checkupType: 'baseline', snapshot, assessment })).toMatchObject({
      valid: true,
    });
    expect(
      getMovementProfileV2AssessmentPersistenceEligibility({ checkUp, checkupType: 'baseline', snapshot, assessment })
    ).toMatchObject({
      eligible: true,
    });
    expect(
      getMovementProfileV2AssessmentPersistenceEligibility({
        checkUp,
        checkupType: 'manual_extra',
        snapshot,
        assessment,
      })
    ).toMatchObject({
      eligible: false,
      compatibility: 'unsupported_source_type',
    });

    const changedRaw = makeV2CheckUp('2026-06-23T08:00:00.000Z', { chair: chairV2Result({ reps: 14 }) });
    expect(
      getMovementProfileV2AssessmentPersistenceEligibility({
        checkUp: changedRaw,
        checkupType: 'baseline',
        snapshot,
        assessment,
      })
    ).toMatchObject({
      eligible: false,
      compatibility: 'source_mismatch',
    });
  });

  it('attaches idempotently and preserves existing assessments on conflict', () => {
    const checkUp = makeV2CheckUp('2026-06-23T08:00:00.000Z');
    const snapshot = snapshotFor(checkUp);
    const assessment = assessmentFor(checkUp, snapshot);
    const attached = attachMovementProfileV2Assessment({ checkUp, snapshot, assessment, checkupType: 'baseline' });

    expect(attached).toMatchObject({ attached: true, status: 'attached' });
    if (!attached.attached) throw new Error('expected attachment');

    expect(
      attachMovementProfileV2Assessment({
        checkUp: attached.checkUp,
        snapshot,
        assessment,
        checkupType: 'baseline',
      })
    ).toMatchObject({ attached: true, status: 'idempotent' });

    const different = assessmentFor(checkUp, snapshot, lifeGoal('stairs'));
    expect(different.assessmentFingerprint).not.toBe(assessment.assessmentFingerprint);
    const conflict = attachMovementProfileV2Assessment({
      checkUp: attached.checkUp,
      snapshot,
      assessment: different,
      checkupType: 'baseline',
    });

    expect(conflict).toMatchObject({
      attached: false,
      status: 'conflict',
      compatibility: 'conflict',
    });
    expect(conflict.checkUp.movementProfileV2Assessment?.assessmentFingerprint).toBe(
      assessment.assessmentFingerprint
    );
  });

  it('selects valid official assessments deterministically, deduping identical rows and surfacing conflicts', () => {
    const first = storedAssessment('2026-06-23T08:00:00.000Z', 'baseline');
    const duplicate = { ...first };
    const retest = storedAssessment('2026-07-23T08:00:00.000Z', 'official_retest');
    const manual = storedAssessment('2026-08-23T08:00:00.000Z', 'manual_extra');
    const conflicting = storedAssessment('2026-06-23T08:00:00.000Z', 'baseline', lifeGoal('stairs'));

    const selection = selectOfficialMovementProfileV2AssessmentRecords([
      retest,
      duplicate,
      manual,
      conflicting,
      first,
    ]);

    expect(selection.records.map((record) => record.record.checkUp.startedAt)).toEqual([
      '2026-06-23T08:00:00.000Z',
      '2026-07-23T08:00:00.000Z',
    ]);
    expect(selection.conflicts).toHaveLength(1);
    expect(movementProfileV2AssessmentRecordForSourceCheckUpId([first, retest], first.checkUp.startedAt)?.type).toBe(
      'baseline'
    );
    expect(latestOfficialMovementProfileV2AssessmentBeforeCheckUp([first, retest], retest.checkUp)?.type).toBe(
      'baseline'
    );
  });

  it('derives prior focus only for official retests', () => {
    const baseline = storedAssessment('2026-06-23T08:00:00.000Z', 'baseline');
    const retestCheckUp = makeV2CheckUp('2026-07-23T08:00:00.000Z');

    expect(
      priorMovementProfileV2FocusContextForCheckUp({
        currentCheckUp: retestCheckUp,
        currentCheckupType: 'baseline',
        acceptedHistory: [baseline],
      }).priorFocusContext
    ).toEqual({ kind: 'none' });
    expect(
      priorMovementProfileV2FocusContextForCheckUp({
        currentCheckUp: retestCheckUp,
        currentCheckupType: 'official_retest',
        acceptedHistory: [baseline],
      }).priorFocusContext.kind
    ).not.toBe('none');
  });

  it('materializes missing artifacts and reuses frozen artifacts without recomputing on reference-profile drift', () => {
    const checkUp = makeV2CheckUp('2026-06-23T08:00:00.000Z');
    const created = materializeOfficialMovementProfileV2Artifacts({
      checkUp,
      checkupType: 'baseline',
      referenceProfile: REFERENCE_PROFILE,
      lifeGoal: lifeGoal('stairs'),
      acceptedHistory: [],
      snapshotCreatedAt: '2026-06-23T08:01:00.000Z',
      assessmentCreatedAt: '2026-06-23T08:02:00.000Z',
    });

    expect(created).toMatchObject({
      ok: true,
      createdSnapshot: true,
      createdAssessment: true,
    });
    if (!created.ok) throw new Error('expected materialized artifacts');

    const reused = materializeOfficialMovementProfileV2Artifacts({
      checkUp: created.checkUp,
      checkupType: 'baseline',
      referenceProfile: { ageAtTest: 62, ageBasis: 'exact_age_at_test', referenceSex: 'male' },
      lifeGoal: lifeGoal('travel'),
      acceptedHistory: [],
      snapshotCreatedAt: '2026-06-23T09:01:00.000Z',
      assessmentCreatedAt: '2026-06-23T09:02:00.000Z',
    });

    expect(reused).toMatchObject({
      ok: true,
      status: 'conflict',
      createdSnapshot: false,
      createdAssessment: false,
    });
    if (!reused.ok) throw new Error('expected reused artifacts');
    expect(reused.snapshot.snapshotFingerprint).toBe(created.snapshot.snapshotFingerprint);
    expect(reused.assessment.assessmentFingerprint).toBe(created.assessment.assessmentFingerprint);
    expect(reused.diagnostics.map((item) => item.code)).toContain(
      'v2_assessment_orchestration_existing_snapshot_reference_conflict'
    );
  });

  it('keeps a frozen current assessment even when its prior artifact is no longer in accepted history', () => {
    const checkUp = makeV2CheckUp('2026-07-23T08:00:00.000Z');
    const snapshot = snapshotFor(checkUp, 'official_retest');
    const assessment = assessmentFor(checkUp, snapshot, null, {
      kind: 'domain',
      focusDomain: 'balance',
      sourceAssessmentId: 'movement-profile-v2-assessment:missing',
      sourceAssessmentFingerprint: 'mpv2-assessment-v1-missing',
    });

    const result = materializeOfficialMovementProfileV2Artifacts({
      checkUp: { ...checkUp, movementProfileV2Snapshot: snapshot, movementProfileV2Assessment: assessment },
      checkupType: 'official_retest',
      referenceProfile: REFERENCE_PROFILE,
      acceptedHistory: [],
      snapshotCreatedAt: '2026-07-23T08:01:00.000Z',
      assessmentCreatedAt: '2026-07-23T08:02:00.000Z',
    });

    expect(result).toMatchObject({
      ok: true,
      createdAssessment: false,
    });
    if (!result.ok) throw new Error('expected existing assessment to be preserved');
    expect(result.assessment.assessmentFingerprint).toBe(assessment.assessmentFingerprint);
    expect(result.diagnostics.map((item) => item.code)).toContain(
      'v2_assessment_orchestration_missing_prior_artifact'
    );
  });
});

function snapshotFor(
  checkUp: CheckUp,
  checkupType: 'baseline' | 'baseline_retake' | 'official_retest' = 'baseline'
): StoredMovementProfileV2Snapshot {
  const created = createMovementProfileV2Snapshot({
    checkUp,
    checkupType,
    referenceProfile: REFERENCE_PROFILE,
    createdAt: checkUp.startedAt,
  });
  if (!created.ok) throw new Error(`expected V2 snapshot: ${created.reason}`);
  return created.snapshot;
}

function assessmentFor(
  checkUp: CheckUp,
  snapshot: StoredMovementProfileV2Snapshot,
  goal: LifeGoal | null = null,
  priorFocus?: unknown
): MovementProfileV2Assessment {
  const created = createMovementProfileV2Assessment({
    checkUp,
    snapshot,
    lifeGoal: goal,
    priorFocus,
    createdAt: snapshot.createdAt,
  });
  if (!created.ok) throw new Error(`expected V2 assessment: ${created.reason}`);
  return created.assessment;
}

function storedAssessment(
  startedAt: string,
  checkupType: 'baseline' | 'baseline_retake' | 'official_retest' | 'manual_extra',
  goal: LifeGoal | null = null
) {
  const checkUp = makeV2CheckUp(startedAt);
  const snapshot = snapshotFor(checkUp, checkupType === 'manual_extra' ? 'baseline' : checkupType);
  const assessment = assessmentFor(checkUp, snapshot, goal);
  return {
    schemaVersion: 1,
    checkupType,
    checkUp,
    scoreSnapshotCompatibility: 'unsupported_checkup_protocol' as const,
    movementProfileV2Snapshot: snapshot,
    movementProfileV2SnapshotCompatibility: 'current' as const,
    movementProfileV2Assessment: assessment,
    movementProfileV2AssessmentCompatibility: 'current' as const,
  };
}

function lifeGoal(category: LifeGoal['category']): LifeGoal {
  return {
    id: `goal-${category}`,
    userId: 'local-device-user',
    category,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
    isPrimary: true,
  };
}

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
