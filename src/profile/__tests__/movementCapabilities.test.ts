import {
  defaultMovementCapabilityProfile,
  isFloorTransferConfirmed,
  isPlannedMovementCapabilitySnapshot,
  isSingleLegBalanceConfirmed,
  isStepUpEnvironmentConfirmed,
  movementCapabilitiesFromSafetyProfile,
  movementCapabilityFingerprint,
  movementCapabilityProfileForPersistence,
  plannedMovementCapabilitySnapshotFromProfile,
  resolveMovementCapabilityRecords,
  validatePlanMovementCapabilitySnapshot,
} from '../movementCapabilities';
import type { MovementCapabilityProfile, MovementSafetyProfile } from '../../adherence';

const START = '2026-06-21T08:00:00.000Z';

function confirmedProfile(overrides: Partial<MovementCapabilityProfile> = {}): MovementCapabilityProfile {
  return {
    schemaVersion: 1,
    floorTransfer: { status: 'confirmed' },
    stepUpEnvironment: {
      status: 'confirmed',
      lowStableStep: true,
      fixedSupport: true,
      clearDryArea: true,
      phoneOutOfPath: true,
    },
    singleLegBalance: { status: 'confirmed_with_support' },
    revision: 2,
    updatedAt: START,
    ...overrides,
  };
}

function safety(movementCapabilities?: MovementCapabilityProfile): MovementSafetyProfile {
  return {
    id: 'safety-1',
    userId: 'local-device-user',
    availableEquipment: ['chair', 'wall', 'stairs', 'floor_space'],
    movementCapabilities,
    createdAt: START,
    updatedAt: START,
  };
}

describe('movement capability normalization', () => {
  it('fails closed for missing legacy capability fields', () => {
    const result = movementCapabilitiesFromSafetyProfile(safety());

    expect(result.floorTransfer.status).toBe('not_confirmed');
    expect(result.stepUpEnvironment).toMatchObject({
      status: 'not_confirmed',
      lowStableStep: false,
      fixedSupport: false,
      clearDryArea: false,
      phoneOutOfPath: false,
    });
    expect(result.singleLegBalance.status).toBe('not_confirmed');
    expect(isFloorTransferConfirmed(result)).toBe(false);
    expect(isStepUpEnvironmentConfirmed(result)).toBe(false);
    expect(isSingleLegBalanceConfirmed(result)).toBe(false);
  });

  it('normalizes malformed and partial records without defaulting to confirmed', () => {
    expect(movementCapabilityProfileForPersistence('bad-data')).toMatchObject({
      floorTransfer: { status: 'not_confirmed' },
      stepUpEnvironment: {
        status: 'not_confirmed',
        lowStableStep: false,
        fixedSupport: false,
        clearDryArea: false,
        phoneOutOfPath: false,
      },
      singleLegBalance: { status: 'not_confirmed' },
    });

    expect(
      movementCapabilityProfileForPersistence({
        floorTransfer: { status: 'yes' },
        stepUpEnvironment: { status: 'confirmed', lowStableStep: true },
        singleLegBalance: { status: 'supported_balance_only' },
      })
    ).toMatchObject({
      floorTransfer: { status: 'not_confirmed' },
      stepUpEnvironment: {
        status: 'confirmed',
        lowStableStep: true,
        fixedSupport: false,
        clearDryArea: false,
        phoneOutOfPath: false,
      },
      singleLegBalance: { status: 'supported_balance_only' },
    });
  });

  it('keeps explicit avoid/support-only choices as explicit profile data', () => {
    const result = movementCapabilitiesFromSafetyProfile(
      safety({
        ...confirmedProfile(),
        floorTransfer: { status: 'avoid_for_now' },
        singleLegBalance: { status: 'supported_balance_only' },
      })
    );

    expect(result.floorTransfer.status).toBe('avoid_for_now');
    expect(result.singleLegBalance.status).toBe('supported_balance_only');
    expect(result.diagnostics.map((diagnostic) => diagnostic.reason)).toContain('movement_capability_normalized');
  });
});

describe('movement capability snapshots and stale-plan validation', () => {
  it('creates deterministic fingerprints and validates matching snapshots', () => {
    const current = movementCapabilitiesFromSafetyProfile(safety(confirmedProfile()));
    const same = movementCapabilitiesFromSafetyProfile(
      safety({ ...confirmedProfile(), revision: 9, updatedAt: '2026-06-22T08:00:00.000Z' })
    );
    const snapshot = plannedMovementCapabilitySnapshotFromProfile(current);

    expect(movementCapabilityFingerprint(current)).toBe(movementCapabilityFingerprint(same));
    expect(isPlannedMovementCapabilitySnapshot(snapshot)).toBe(true);
    expect(validatePlanMovementCapabilitySnapshot({ planned: snapshot, current: same }).status).toBe('current');
  });

  it('changes fingerprints when capability confirmation changes', () => {
    const current = movementCapabilitiesFromSafetyProfile(safety(confirmedProfile()));
    const changed = movementCapabilitiesFromSafetyProfile(
      safety({
        ...confirmedProfile(),
        floorTransfer: { status: 'not_confirmed' },
      })
    );
    const snapshot = plannedMovementCapabilitySnapshotFromProfile(current);

    expect(movementCapabilityFingerprint(current)).not.toBe(movementCapabilityFingerprint(changed));
    expect(validatePlanMovementCapabilitySnapshot({ planned: snapshot, current: changed }).status).toBe(
      'capability_changed'
    );
    expect(validatePlanMovementCapabilitySnapshot({ planned: null, current }).status).toBe('missing_plan_snapshot');
  });

  it('lets an explicit remote profile hydrate over local legacy missing data', () => {
    const local = defaultMovementCapabilityProfile({ source: 'local_user' });
    const remote = movementCapabilitiesFromSafetyProfile(safety(confirmedProfile()), 'remote_profile');
    const resolved = resolveMovementCapabilityRecords({ local, remote });

    expect(resolved.profile.floorTransfer.status).toBe('confirmed');
    expect(isStepUpEnvironmentConfirmed(resolved.profile)).toBe(true);
  });
});
