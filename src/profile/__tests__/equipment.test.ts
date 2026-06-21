import {
  canonicalEquipmentFromSafetyProfile,
  canonicalEquipmentToAvailableEquipment,
  equipmentFingerprint,
  migrateLegacyEquipmentProfile,
  normalizeCanonicalEquipment,
  plannedEquipmentSnapshotFromCanonical,
  resolveCanonicalEquipmentRecords,
  validatePlanEquipmentSnapshot,
} from '../equipment';
import type { MovementSafetyProfile } from '../../adherence';

const START = '2026-06-21T08:00:00.000Z';

function safety(availableEquipment: MovementSafetyProfile['availableEquipment'], overrides: Partial<MovementSafetyProfile> = {}): MovementSafetyProfile {
  return {
    id: 'safety-1',
    userId: 'local-device-user',
    availableEquipment,
    createdAt: START,
    updatedAt: START,
    ...overrides,
  };
}

describe('canonical equipment normalization', () => {
  it('normalizes explicit equipment into a stable capability set', () => {
    const result = normalizeCanonicalEquipment([
      'floor_space',
      'chair',
      'stairs',
      'chair',
      'door_anchor',
      'resistance_band',
      'mini_band',
      'backpack',
      'wall',
    ]);

    expect(result.status).toBe('confirmed');
    expect(result.capabilities).toEqual([
      'chair',
      'wall',
      'stairs',
      'resistance_band',
      'door_anchor',
      'mini_band',
      'backpack',
      'floor_space',
    ]);
  });

  it('keeps explicit none distinct from missing or malformed equipment', () => {
    expect(normalizeCanonicalEquipment(['none'])).toMatchObject({
      status: 'confirmed',
      capabilities: [],
    });
    expect(normalizeCanonicalEquipment(undefined)).toMatchObject({
      status: 'needs_confirmation',
      capabilities: [],
    });
    expect(normalizeCanonicalEquipment({ chair: true })).toMatchObject({
      status: 'malformed_fail_closed',
      capabilities: [],
    });
  });

  it('fails closed when none coexists with capabilities', () => {
    expect(normalizeCanonicalEquipment(['none', 'chair'])).toMatchObject({
      status: 'malformed_fail_closed',
      capabilities: [],
    });
  });

  it('rejects unknown-only arrays and ignores unknown tokens beside valid capabilities', () => {
    expect(normalizeCanonicalEquipment(['counter'])).toMatchObject({
      status: 'malformed_fail_closed',
      capabilities: [],
    });
    expect(normalizeCanonicalEquipment(['chair', 'counter'])).toMatchObject({
      status: 'confirmed',
      capabilities: ['chair'],
    });
  });

  it('accepts only direct legacy token spellings without inferring dependencies', () => {
    const result = normalizeCanonicalEquipment(['stair', 'band', 'miniBand', 'load', 'door_anchor']);

    expect(result.capabilities).toEqual(['stairs', 'resistance_band', 'door_anchor', 'mini_band', 'backpack']);
    expect(result.capabilities).not.toContain('wall');
    expect(result.capabilities).not.toContain('floor_space');
  });

  it('does not mutate input arrays', () => {
    const input = ['stairs', 'chair'];
    normalizeCanonicalEquipment(input);
    expect(input).toEqual(['stairs', 'chair']);
  });
});

describe('legacy migration and resolver', () => {
  it('migrates only direct high-confidence legacy equipment and requires confirmation', () => {
    const result = migrateLegacyEquipmentProfile({ stair: true, band: true, miniBand: true, load: true });

    expect(result.status).toBe('legacy_migrated');
    expect(result.capabilities).toEqual(['stairs', 'resistance_band', 'mini_band']);
    expect(result.capabilities).not.toContain('backpack');
    expect(result.capabilities).not.toContain('door_anchor');
    expect(result.capabilities).not.toContain('floor_space');
    expect(result.capabilities).not.toContain('wall');
  });

  it('lets a confirmed canonical profile win over conflicting legacy state', () => {
    const local = canonicalEquipmentFromSafetyProfile(
      safety(['none'], { equipmentStatus: 'confirmed', equipmentRevision: 2 })
    );
    const resolved = resolveCanonicalEquipmentRecords({
      local,
      legacy: { stair: true, band: true, miniBand: true },
    });

    expect(resolved.profile.status).toBe('confirmed');
    expect(resolved.profile.capabilities).toEqual([]);
  });

  it('uses newest valid explicit local or remote markers, with local winning ties', () => {
    const local = canonicalEquipmentFromSafetyProfile(
      safety(['chair'], { equipmentStatus: 'confirmed', equipmentRevision: 2 })
    );
    const newerRemote = canonicalEquipmentFromSafetyProfile(
      safety(['wall'], { equipmentStatus: 'confirmed', equipmentRevision: 3 }),
      'remote_profile'
    );
    const tiedRemote = canonicalEquipmentFromSafetyProfile(
      safety(['stairs'], { equipmentStatus: 'confirmed', equipmentRevision: 2 }),
      'remote_profile'
    );

    expect(resolveCanonicalEquipmentRecords({ local, remote: newerRemote }).profile.capabilities).toEqual(['wall']);
    expect(resolveCanonicalEquipmentRecords({ local, remote: tiedRemote }).profile.capabilities).toEqual(['chair']);
  });

  it('falls back to legacy migration only when no explicit canonical profile exists', () => {
    const resolved = resolveCanonicalEquipmentRecords({
      local: canonicalEquipmentFromSafetyProfile(null),
      legacy: { band: true },
    });

    expect(resolved.profile.status).toBe('legacy_migrated');
    expect(resolved.profile.capabilities).toEqual(['resistance_band']);
  });
});

describe('equipment snapshots and stale-plan validation', () => {
  it('creates deterministic fingerprints independent of input ordering', () => {
    const a = normalizeCanonicalEquipment(['wall', 'chair']);
    const b = normalizeCanonicalEquipment(['chair', 'wall']);

    expect(equipmentFingerprint(a)).toBe(equipmentFingerprint(b));
    expect(equipmentFingerprint(normalizeCanonicalEquipment(['none']))).not.toBe(
      equipmentFingerprint(normalizeCanonicalEquipment(undefined))
    );
  });

  it('detects changed, unknown, and missing plan equipment before start', () => {
    const planned = plannedEquipmentSnapshotFromCanonical(normalizeCanonicalEquipment(['chair', 'wall']));

    expect(
      validatePlanEquipmentSnapshot({
        planned,
        current: normalizeCanonicalEquipment(['wall', 'chair']),
      }).status
    ).toBe('current');
    expect(
      validatePlanEquipmentSnapshot({
        planned,
        current: normalizeCanonicalEquipment(['chair']),
      }).status
    ).toBe('equipment_changed');
    expect(
      validatePlanEquipmentSnapshot({
        planned,
        current: normalizeCanonicalEquipment(undefined),
      }).status
    ).toBe('canonical_equipment_unknown');
    expect(
      validatePlanEquipmentSnapshot({
        planned: null,
        current: normalizeCanonicalEquipment(['chair']),
      }).status
    ).toBe('missing_plan_snapshot');
  });

  it('serializes explicit none for persistence without confusing it with unknown', () => {
    expect(canonicalEquipmentToAvailableEquipment(normalizeCanonicalEquipment(['none']))).toEqual(['none']);
    expect(canonicalEquipmentToAvailableEquipment(normalizeCanonicalEquipment(undefined))).toEqual([]);
  });
});
