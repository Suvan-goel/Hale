import {
  MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
  createActiveShoulderReachV2Setup,
  createChairRiseV2Setup,
  createCheckUpProtocolPolicy,
  createOneLegBalanceV2Setup,
  type CheckUp,
} from '../../../checkup';
import { BALANCE_LADDER_ID, CHAIR_STAND_ID, SHOULDER_FLEXION_ID } from '../../../movements';
import {
  ACTIVE_SHOULDER_REACH_V2_ID,
  type ActiveShoulderReachV2Result,
} from '../../../movements/activeShoulderReachV2';
import { CHAIR_RISE_V2_ID, type ChairRiseV2Result } from '../../../movements/chairRiseV2';
import { ONE_LEG_BALANCE_V2_ID, type OneLegBalanceV2Result } from '../../../movements/oneLegBalanceV2';
import { HISTORY_SCHEMA_VERSION, type StoredCheckUp } from '../../../history';
import { defaultPreferences } from '../../../profile';
import { createMovementProfileV2Assessment, createMovementProfileV2Snapshot } from '../../../reference/movementProfileV2';
import { createCurrentVersionedScoreSnapshot } from '../../../scoring';

import {
  isLocalStateEmptyForRestore,
  mapRemoteHaleSnapshotToLocal,
  restoreRemoteStateIfLocalEmpty,
  type LocalHaleStateForRestore,
  type RemoteHaleSnapshot,
} from '../restoreService';

// Trimmed with the old-engine cleanup (2026-07-08, founder direction): the
// restore path carries the local profile and the check-up history only. The
// old engine's blocks, training state, session completions, micro-check
// results, and block reports no longer restore — the programme engine's
// state is LOCAL-ONLY by ruling, and testers re-onboard (recorded: no live
// migration). The V2 snapshot/assessment fence tests below are unchanged in
// substance from the pre-trim suite.

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('../authService', () => ({
  getCurrentSession: jest.fn(),
}));

const userId = 'user-123';
const startedAt = '2026-06-17T12:00:00.000Z';

function checkUp(): CheckUp {
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
          reps: 14,
          repStats: [],
          sessionMeanVel: 0.28,
          sessionMeanPeakVel: 0.41,
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
          singleLegEyesOpenSec: 12,
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

function storedCheckUp(): StoredCheckUp {
  const localCheckUp = checkUp();
  const scored = createCurrentVersionedScoreSnapshot(localCheckUp);
  return {
    schemaVersion: HISTORY_SCHEMA_VERSION,
    checkupType: 'baseline',
    checkUp: localCheckUp,
    scoreSnapshot: scored.snapshot ?? undefined,
    scoreSnapshotCompatibility: scored.snapshot ? 'current' : 'invalid_snapshot',
  };
}

function emptyLocal(): LocalHaleStateForRestore {
  return {
    preferences: defaultPreferences(),
    history: [],
  };
}

function backendJson(value: unknown): never {
  return JSON.parse(JSON.stringify(value)) as never;
}

function remoteSnapshot(): RemoteHaleSnapshot {
  const localCheckUp = checkUp();
  const scored = createCurrentVersionedScoreSnapshot(localCheckUp);

  return {
    profile: {
      id: userId,
      local_user_id: 'local-device-user',
      full_name: 'Asha Rao',
      birth_year: null,
      sex: null,
      profile_json: {
        schemaVersion: 4,
        name: 'Asha Rao',
        age: 58,
        goal: 'Keep hiking',
      },
      onboarding_json: {
        schemaVersion: 4,
        onboarding: {
          currentStep: 'complete',
          selectedEquipment: ['chair', 'wall'],
          baselineResultId: startedAt,
          completedAt: '2026-06-18T09:00:00.000Z',
          updatedAt: '2026-06-18T09:00:00.000Z',
        },
        lifeGoal: null,
      },
      preferences_json: backendJson({
        schemaVersion: 4,
        settings: defaultPreferences().settings,
      }),
      onboarding_completed_at: '2026-06-18T09:00:00.000Z',
      created_at: '2026-06-18T08:00:00.000Z',
      updated_at: '2026-06-18T09:00:00.000Z',
    },
    movementCheckups: [
      {
        id: 'remote-checkup-1',
        local_checkup_id: startedAt,
        checkup_type: 'baseline',
        status: 'completed',
        derived_scores_json: backendJson({
          schemaVersion: 1,
          scoreSnapshot: scored.snapshot,
        }),
        raw_checkup_json: backendJson({
          schemaVersion: HISTORY_SCHEMA_VERSION,
          scoreSnapshot: scored.snapshot,
          checkUp: localCheckUp,
        }),
        created_locally_at: startedAt,
        completed_at: '2026-06-17T12:08:00.000Z',
        created_at: '2026-06-17T12:08:30.000Z',
      },
    ],
    fetchErrors: {},
  };
}

function remoteSnapshotWithCheckups(
  movementCheckups: RemoteHaleSnapshot['movementCheckups']
): RemoteHaleSnapshot {
  return {
    profile: null,
    movementCheckups,
    fetchErrors: {},
  };
}

function v2CheckUp(startedAt: string, overrides: {
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

describe('remote restore service', () => {
  it('detects empty local state conservatively', () => {
    expect(isLocalStateEmptyForRestore(emptyLocal())).toBe(true);

    expect(
      isLocalStateEmptyForRestore({
        ...emptyLocal(),
        history: [storedCheckUp()],
      })
    ).toBe(false);

    expect(
      isLocalStateEmptyForRestore({
        ...emptyLocal(),
        preferences: {
          ...defaultPreferences(),
          profile: { ...defaultPreferences().profile, name: 'Asha' },
        },
      })
    ).toBe(false);
  });

  it('maps sanitized remote rows back into local store shapes', () => {
    const mapped = mapRemoteHaleSnapshotToLocal(remoteSnapshot(), emptyLocal());

    expect(mapped.state.preferences.profile.name).toBe('Asha Rao');
    expect(mapped.state.preferences.onboarding.currentStep).toBe('complete');
    expect(mapped.state.history).toHaveLength(1);
    expect(mapped.state.history[0].checkUp.startedAt).toBe(startedAt);
    expect(mapped.state.history[0].checkupType).toBe('baseline');
    expect(mapped.gaps).toEqual([]);
  });

  it('never restores health data from a legacy remote safety_json field (local-only law)', () => {
    const snapshot = remoteSnapshot();
    snapshot.profile = {
      ...snapshot.profile!,
      // Legacy pre-460a55ed rows may still carry safety_json on the wire;
      // the merge has no path for it and must ignore it entirely.
      safety_json: backendJson({
        schemaVersion: 1,
        safetyProfile: { id: 'remote-safety', availableEquipment: ['chair'] },
      }),
    } as never;

    const mapped = mapRemoteHaleSnapshotToLocal(snapshot, emptyLocal());

    expect(mapped.state.preferences.profile.safetyProfile ?? null).toBeNull();
    expect(JSON.stringify(mapped.state.preferences)).not.toContain('remote-safety');
  });

  it('restores Movement Profile V2 snapshots as history evidence', () => {
    const rawCheckUp = v2CheckUp(startedAt);
    const movementProfileV2Snapshot = movementProfileV2SnapshotFor(rawCheckUp);
    const mapped = mapRemoteHaleSnapshotToLocal(
      remoteSnapshotWithCheckups([
        {
          id: 'remote-v2-checkup',
          local_checkup_id: startedAt,
          checkup_type: 'baseline',
          status: 'completed',
          derived_scores_json: backendJson({
            schemaVersion: 1,
            exactCheckupType: 'baseline',
            movementProfileV2Snapshot,
            movementProfileV2SnapshotCompatibility: 'current',
          }),
          raw_checkup_json: backendJson({
            schemaVersion: HISTORY_SCHEMA_VERSION,
            checkupType: 'baseline',
            movementProfileV2Snapshot,
            checkUp: rawCheckUp,
          }),
          created_locally_at: startedAt,
          completed_at: '2026-06-17T12:08:00.000Z',
          created_at: '2026-06-17T12:08:30.000Z',
        },
      ]),
      emptyLocal()
    );

    expect(mapped.state.history).toHaveLength(1);
    expect(mapped.state.history[0].scoreSnapshot).toBeUndefined();
    expect(mapped.state.history[0].scoreSnapshotCompatibility).toBe('unsupported_checkup_protocol');
    expect(mapped.state.history[0].movementProfileV2Snapshot?.snapshotFingerprint).toBe(
      movementProfileV2Snapshot.snapshotFingerprint
    );
    expect(mapped.state.history[0].movementProfileV2SnapshotCompatibility).toBe('current');
  });

  it('restores source-bound Movement Profile V2 assessments', () => {
    const rawCheckUp = v2CheckUp(startedAt);
    const movementProfileV2Snapshot = movementProfileV2SnapshotFor(rawCheckUp);
    const movementProfileV2Assessment = movementProfileV2AssessmentFor(rawCheckUp, movementProfileV2Snapshot);
    const mapped = mapRemoteHaleSnapshotToLocal(
      remoteSnapshotWithCheckups([
        {
          id: 'remote-v2-checkup',
          local_checkup_id: startedAt,
          checkup_type: 'baseline',
          status: 'completed',
          derived_scores_json: backendJson({
            schemaVersion: 1,
            exactCheckupType: 'baseline',
            movementProfileV2Snapshot,
            movementProfileV2SnapshotCompatibility: 'current',
            movementProfileV2Assessment,
            movementProfileV2AssessmentCompatibility: 'current',
          }),
          raw_checkup_json: backendJson({
            schemaVersion: HISTORY_SCHEMA_VERSION,
            checkupType: 'baseline',
            movementProfileV2Snapshot,
            movementProfileV2Assessment,
            checkUp: rawCheckUp,
          }),
          created_locally_at: startedAt,
          completed_at: '2026-06-17T12:08:00.000Z',
        },
      ]),
      emptyLocal()
    );

    expect(mapped.state.history).toHaveLength(1);
    expect(mapped.state.history[0].movementProfileV2Snapshot?.snapshotFingerprint).toBe(
      movementProfileV2Snapshot.snapshotFingerprint
    );
    expect(mapped.state.history[0].movementProfileV2Assessment?.assessmentFingerprint).toBe(
      movementProfileV2Assessment.assessmentFingerprint
    );
    expect(mapped.state.history[0].movementProfileV2AssessmentCompatibility).toBe('current');
  });

  it('keeps raw V2 check-ups when restored V2 snapshots are malformed or missing', () => {
    const rawCheckUp = v2CheckUp(startedAt);
    const malformedSnapshot = {
      ...movementProfileV2SnapshotFor(rawCheckUp),
      snapshotFingerprint: 'tampered',
    };
    const mapped = mapRemoteHaleSnapshotToLocal(
      remoteSnapshotWithCheckups([
        {
          id: 'remote-v2-checkup',
          local_checkup_id: startedAt,
          checkup_type: 'baseline',
          status: 'completed',
          derived_scores_json: backendJson({
            schemaVersion: 1,
            exactCheckupType: 'baseline',
            movementProfileV2Snapshot: malformedSnapshot,
          }),
          raw_checkup_json: backendJson({
            schemaVersion: HISTORY_SCHEMA_VERSION,
            checkupType: 'baseline',
            movementProfileV2Snapshot: malformedSnapshot,
            checkUp: rawCheckUp,
          }),
          created_locally_at: startedAt,
          completed_at: '2026-06-17T12:08:00.000Z',
        },
      ]),
      emptyLocal()
    );

    expect(mapped.state.history).toHaveLength(1);
    expect(mapped.state.history[0].checkUp.items).toHaveLength(3);
    expect(mapped.state.history[0].movementProfileV2Snapshot).toBeUndefined();
    expect(mapped.state.history[0].movementProfileV2SnapshotCompatibility).toBe('fingerprint_invalid');
  });

  it('keeps raw V2 check-ups and valid snapshots when restored V2 assessments are mismatched', () => {
    const rawCheckUp = v2CheckUp(startedAt);
    const movementProfileV2Snapshot = movementProfileV2SnapshotFor(rawCheckUp);
    const otherCheckUp = v2CheckUp(startedAt, { chair: chairV2Result({ reps: 13 }) });
    const otherSnapshot = movementProfileV2SnapshotFor(otherCheckUp);
    const otherAssessment = movementProfileV2AssessmentFor(otherCheckUp, otherSnapshot);
    const mapped = mapRemoteHaleSnapshotToLocal(
      remoteSnapshotWithCheckups([
        {
          id: 'remote-v2-checkup',
          local_checkup_id: startedAt,
          checkup_type: 'baseline',
          status: 'completed',
          derived_scores_json: backendJson({
            schemaVersion: 1,
            exactCheckupType: 'baseline',
            movementProfileV2Snapshot,
            movementProfileV2Assessment: otherAssessment,
          }),
          raw_checkup_json: backendJson({
            schemaVersion: HISTORY_SCHEMA_VERSION,
            checkupType: 'baseline',
            movementProfileV2Snapshot,
            movementProfileV2Assessment: otherAssessment,
            checkUp: rawCheckUp,
          }),
          created_locally_at: startedAt,
          completed_at: '2026-06-17T12:08:00.000Z',
        },
      ]),
      emptyLocal()
    );

    expect(mapped.state.history).toHaveLength(1);
    expect(mapped.state.history[0].movementProfileV2Snapshot?.snapshotFingerprint).toBe(
      movementProfileV2Snapshot.snapshotFingerprint
    );
    expect(mapped.state.history[0].movementProfileV2Assessment).toBeUndefined();
    expect(mapped.state.history[0].movementProfileV2AssessmentCompatibility).toBe('source_mismatch');
  });

  it('prefers a valid restored V2 snapshot over a duplicate raw-only remote row', () => {
    const rawCheckUp = v2CheckUp(startedAt);
    const movementProfileV2Snapshot = movementProfileV2SnapshotFor(rawCheckUp);
    const mapped = mapRemoteHaleSnapshotToLocal(
      remoteSnapshotWithCheckups([
        {
          id: 'remote-v2-missing',
          local_checkup_id: startedAt,
          checkup_type: 'baseline',
          status: 'completed',
          derived_scores_json: backendJson({ schemaVersion: 1, exactCheckupType: 'baseline' }),
          raw_checkup_json: backendJson({
            schemaVersion: HISTORY_SCHEMA_VERSION,
            checkupType: 'baseline',
            checkUp: rawCheckUp,
          }),
        },
        {
          id: 'remote-v2-valid',
          local_checkup_id: startedAt,
          checkup_type: 'baseline',
          status: 'completed',
          derived_scores_json: backendJson({
            schemaVersion: 1,
            exactCheckupType: 'baseline',
            movementProfileV2Snapshot,
          }),
          raw_checkup_json: backendJson({
            schemaVersion: HISTORY_SCHEMA_VERSION,
            checkupType: 'baseline',
            movementProfileV2Snapshot,
            checkUp: rawCheckUp,
          }),
        },
      ]),
      emptyLocal()
    );

    expect(mapped.state.history).toHaveLength(1);
    expect(mapped.state.history[0].movementProfileV2Snapshot?.snapshotFingerprint).toBe(
      movementProfileV2Snapshot.snapshotFingerprint
    );
  });

  it('prefers a valid restored V2 assessment over a duplicate snapshot-only remote row', () => {
    const rawCheckUp = v2CheckUp(startedAt);
    const movementProfileV2Snapshot = movementProfileV2SnapshotFor(rawCheckUp);
    const movementProfileV2Assessment = movementProfileV2AssessmentFor(rawCheckUp, movementProfileV2Snapshot);
    const mapped = mapRemoteHaleSnapshotToLocal(
      remoteSnapshotWithCheckups([
        {
          id: 'remote-v2-snapshot-only',
          local_checkup_id: startedAt,
          checkup_type: 'baseline',
          status: 'completed',
          derived_scores_json: backendJson({
            schemaVersion: 1,
            exactCheckupType: 'baseline',
            movementProfileV2Snapshot,
          }),
          raw_checkup_json: backendJson({
            schemaVersion: HISTORY_SCHEMA_VERSION,
            checkupType: 'baseline',
            movementProfileV2Snapshot,
            checkUp: rawCheckUp,
          }),
        },
        {
          id: 'remote-v2-assessment',
          local_checkup_id: startedAt,
          checkup_type: 'baseline',
          status: 'completed',
          derived_scores_json: backendJson({
            schemaVersion: 1,
            exactCheckupType: 'baseline',
            movementProfileV2Snapshot,
            movementProfileV2Assessment,
          }),
          raw_checkup_json: backendJson({
            schemaVersion: HISTORY_SCHEMA_VERSION,
            checkupType: 'baseline',
            movementProfileV2Snapshot,
            movementProfileV2Assessment,
            checkUp: rawCheckUp,
          }),
        },
      ]),
      emptyLocal()
    );

    expect(mapped.state.history).toHaveLength(1);
    expect(mapped.state.history[0].movementProfileV2Assessment?.assessmentFingerprint).toBe(
      movementProfileV2Assessment.assessmentFingerprint
    );
  });

  it('keeps lossy unknown remote check-up types as legacy_unknown', () => {
    const snapshot = remoteSnapshot();
    snapshot.movementCheckups[0] = {
      ...snapshot.movementCheckups[0],
      checkup_type: 'unknown',
      derived_scores_json: { schemaVersion: 1 },
      raw_checkup_json: backendJson({
        schemaVersion: HISTORY_SCHEMA_VERSION,
        checkUp: checkUp(),
      }),
    };

    const mapped = mapRemoteHaleSnapshotToLocal(snapshot, emptyLocal());

    expect(mapped.state.history[0].checkupType).toBe('legacy_unknown');
  });

  it('skips restore and does not write stores when local data already exists', async () => {
    const stores = {
      profileStore: { save: jest.fn() },
      historyStore: { save: jest.fn() },
    };

    const result = await restoreRemoteStateIfLocalEmpty({
      local: {
        ...emptyLocal(),
        history: [storedCheckUp()],
      },
      stores,
      snapshot: remoteSnapshot(),
    });

    expect(result.status).toBe('skipped_local_not_empty');
    expect(stores.profileStore.save).not.toHaveBeenCalled();
    expect(stores.historyStore.save).not.toHaveBeenCalled();
  });

  it('restores profile and history into the stores when local is empty', async () => {
    const stores = {
      profileStore: { save: jest.fn() },
      historyStore: { save: jest.fn() },
    };

    const result = await restoreRemoteStateIfLocalEmpty({
      local: emptyLocal(),
      stores,
      snapshot: remoteSnapshot(),
    });

    expect(result.status).toBe('restored');
    expect(result.restoredCounts).toEqual({ profile: 1, checkups: 1 });
    expect(stores.profileStore.save).toHaveBeenCalledTimes(1);
    expect(stores.historyStore.save).toHaveBeenCalledTimes(1);
  });

  it('handles incomplete remote JSON safely', async () => {
    const result = await restoreRemoteStateIfLocalEmpty({
      local: emptyLocal(),
      snapshot: {
        profile: null,
        movementCheckups: [{ raw_checkup_json: { schemaVersion: HISTORY_SCHEMA_VERSION } }],
        fetchErrors: {},
      },
    });

    expect(result.status).toBe('remote_empty');
    expect(result.restoredCounts).toEqual({
      profile: 0,
      checkups: 0,
    });
  });
});
