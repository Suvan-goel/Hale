import type { AvailableEquipment, MovementSafetyProfile } from '../adherence';
import type { EquipmentProfile } from '../training/block';

export const CANONICAL_EQUIPMENT_SCHEMA_VERSION = 1;

export const CANONICAL_EQUIPMENT_ORDER = [
  'chair',
  'wall',
  'stairs',
  'resistance_band',
  'door_anchor',
  'mini_band',
  'dumbbells',
  'backpack',
  'floor_space',
] as const;

export type CanonicalEquipmentCapability = (typeof CANONICAL_EQUIPMENT_ORDER)[number];

export type CanonicalEquipmentStatus =
  | 'confirmed'
  | 'needs_confirmation'
  | 'legacy_migrated'
  | 'malformed_fail_closed';

export type CanonicalEquipmentSource =
  | 'local_user'
  | 'remote_profile'
  | 'legacy_migration'
  | 'default_unknown';

export type EquipmentDiagnosticReason =
  | 'canonical_equipment_normalized'
  | 'canonical_equipment_missing'
  | 'canonical_equipment_malformed'
  | 'canonical_equipment_unknown_token_ignored'
  | 'canonical_equipment_none_conflict'
  | 'legacy_equipment_migrated'
  | 'legacy_equipment_ignored'
  | 'legacy_equipment_malformed'
  | 'equipment_conflict_local_wins'
  | 'equipment_conflict_remote_wins'
  | 'equipment_conflict_equal_marker_local_wins'
  | 'equipment_conflict_missing_marker_local_wins'
  | 'equipment_resolved_default_unknown'
  | 'plan_equipment_fingerprint_mismatch'
  | 'plan_equipment_snapshot_missing'
  | 'plan_equipment_canonical_unknown'
  | 'plan_equipment_legacy_plan';

export interface EquipmentDiagnostic {
  reason: EquipmentDiagnosticReason;
  capabilities?: CanonicalEquipmentCapability[];
  status?: CanonicalEquipmentStatus;
  localUpdatedAt?: string;
  remoteUpdatedAt?: string;
  localRevision?: number;
  remoteRevision?: number;
  fingerprint?: string;
  plannedFingerprint?: string;
  currentFingerprint?: string;
}

export interface CanonicalEquipmentProfile {
  schemaVersion: typeof CANONICAL_EQUIPMENT_SCHEMA_VERSION;
  capabilities: CanonicalEquipmentCapability[];
  status: CanonicalEquipmentStatus;
  source: CanonicalEquipmentSource;
  revision?: number;
  updatedAt?: string;
  diagnostics: EquipmentDiagnostic[];
}

export interface PlannedEquipmentSnapshot {
  schemaVersion: typeof CANONICAL_EQUIPMENT_SCHEMA_VERSION;
  capabilities: CanonicalEquipmentCapability[];
  status: CanonicalEquipmentStatus;
  fingerprint: string;
  sourceRevision?: number;
  sourceUpdatedAt?: string;
}

export type PlanEquipmentValidationStatus =
  | 'current'
  | 'equipment_changed'
  | 'missing_plan_snapshot'
  | 'canonical_equipment_unknown'
  | 'legacy_plan';

export interface PlanEquipmentValidation {
  status: PlanEquipmentValidationStatus;
  diagnostics: EquipmentDiagnostic[];
}

const CAPABILITY_SET = new Set<string>(CANONICAL_EQUIPMENT_ORDER);
const STATUSES: readonly CanonicalEquipmentStatus[] = [
  'confirmed',
  'needs_confirmation',
  'legacy_migrated',
  'malformed_fail_closed',
];

export function isCanonicalEquipmentCapability(value: unknown): value is CanonicalEquipmentCapability {
  return typeof value === 'string' && CAPABILITY_SET.has(value);
}

export function isCanonicalEquipmentStatus(value: unknown): value is CanonicalEquipmentStatus {
  return typeof value === 'string' && STATUSES.includes(value as CanonicalEquipmentStatus);
}

export function normalizeCanonicalEquipment(
  input: unknown,
  options: {
    source?: CanonicalEquipmentSource;
    status?: unknown;
    revision?: unknown;
    updatedAt?: unknown;
  } = {}
): CanonicalEquipmentProfile {
  const source = options.source ?? 'local_user';
  const revision = finiteRevision(options.revision);
  const updatedAt = stringValue(options.updatedAt);
  const requestedStatus = isCanonicalEquipmentStatus(options.status) ? options.status : undefined;

  if (input === null || input === undefined) {
    return profile([], requestedStatus ?? 'needs_confirmation', source, revision, updatedAt, [
      { reason: 'canonical_equipment_missing', status: requestedStatus ?? 'needs_confirmation' },
    ]);
  }

  if (!Array.isArray(input)) {
    return profile([], 'malformed_fail_closed', source, revision, updatedAt, [
      { reason: 'canonical_equipment_malformed', status: 'malformed_fail_closed' },
    ]);
  }

  if (input.length === 0) {
    return profile([], requestedStatus ?? 'needs_confirmation', source, revision, updatedAt, [
      { reason: 'canonical_equipment_missing', status: requestedStatus ?? 'needs_confirmation' },
    ]);
  }

  const capabilities: CanonicalEquipmentCapability[] = [];
  const diagnostics: EquipmentDiagnostic[] = [];
  let explicitNone = false;

  for (const item of input) {
    const normalized = normalizeEquipmentToken(item);
    if (normalized === 'none') {
      explicitNone = true;
      continue;
    }
    if (!normalized) {
      diagnostics.push({ reason: 'canonical_equipment_unknown_token_ignored' });
      continue;
    }
    if (!capabilities.includes(normalized)) capabilities.push(normalized);
  }

  if (explicitNone && capabilities.length > 0) {
    return profile([], 'malformed_fail_closed', source, revision, updatedAt, [
      ...diagnostics,
      { reason: 'canonical_equipment_none_conflict', status: 'malformed_fail_closed' },
    ]);
  }

  if (explicitNone) {
    return profile([], requestedStatus ?? 'confirmed', source, revision, updatedAt, diagnostics);
  }

  const sorted = sortCapabilities(capabilities);
  const status =
    diagnostics.length > 0 && sorted.length === 0
      ? 'malformed_fail_closed'
      : requestedStatus ?? 'confirmed';
  return profile(sorted, status, source, revision, updatedAt, diagnostics);
}

export function canonicalEquipmentFromSafetyProfile(
  safetyProfile: MovementSafetyProfile | null | undefined,
  source: CanonicalEquipmentSource = 'local_user'
): CanonicalEquipmentProfile {
  if (!safetyProfile) {
    return normalizeCanonicalEquipment(undefined, { source: 'default_unknown' });
  }
  return normalizeCanonicalEquipment(safetyProfile.availableEquipment, {
    source,
    status: safetyProfile.equipmentStatus,
    revision: safetyProfile.equipmentRevision,
    updatedAt: safetyProfile.equipmentUpdatedAt ?? safetyProfile.updatedAt,
  });
}

export function canonicalEquipmentToAvailableEquipment(
  canonical: Pick<CanonicalEquipmentProfile, 'capabilities' | 'status'>
): AvailableEquipment[] {
  if (canonical.capabilities.length > 0) return sortCapabilities(canonical.capabilities).slice();
  return canonical.status === 'confirmed' ? ['none'] : [];
}

export function normalizeAvailableEquipmentForPersistence(
  input: unknown,
  options: {
    status?: CanonicalEquipmentStatus;
    source?: CanonicalEquipmentSource;
    updatedAt?: string;
    revision?: number;
  } = {}
): {
  availableEquipment: AvailableEquipment[];
  equipmentStatus: CanonicalEquipmentStatus;
  equipmentRevision?: number;
  equipmentUpdatedAt?: string;
  canonical: CanonicalEquipmentProfile;
} {
  const canonical = normalizeCanonicalEquipment(input, options);
  return {
    availableEquipment: canonicalEquipmentToAvailableEquipment(canonical),
    equipmentStatus: canonical.status,
    equipmentRevision: canonical.revision,
    equipmentUpdatedAt: canonical.updatedAt,
    canonical,
  };
}

export function safetyProfileWithCanonicalEquipment(
  safetyProfile: MovementSafetyProfile,
  equipmentInput: unknown,
  options: {
    status?: CanonicalEquipmentStatus;
    updatedAt: string;
    revision?: number;
  }
): MovementSafetyProfile {
  const currentRevision =
    typeof safetyProfile.equipmentRevision === 'number' && Number.isFinite(safetyProfile.equipmentRevision)
      ? safetyProfile.equipmentRevision
      : 0;
  const normalized = normalizeAvailableEquipmentForPersistence(equipmentInput, {
    status: options.status ?? 'confirmed',
    source: 'local_user',
    updatedAt: options.updatedAt,
    revision: options.revision ?? currentRevision + 1,
  });
  return {
    ...safetyProfile,
    availableEquipment: normalized.availableEquipment,
    equipmentStatus: normalized.equipmentStatus,
    equipmentRevision: normalized.equipmentRevision,
    equipmentUpdatedAt: normalized.equipmentUpdatedAt,
    updatedAt: options.updatedAt,
  };
}

export function legacyEquipmentFromCanonical(
  canonical: Pick<CanonicalEquipmentProfile, 'capabilities'>
): EquipmentProfile {
  return {
    stair: canonical.capabilities.includes('stairs'),
    band: canonical.capabilities.includes('resistance_band'),
    miniBand: canonical.capabilities.includes('mini_band'),
    load: canonical.capabilities.includes('backpack') || canonical.capabilities.includes('dumbbells'),
  };
}

export function migrateLegacyEquipmentProfile(
  legacy: unknown,
  options: { updatedAt?: string } = {}
): CanonicalEquipmentProfile {
  if (!legacy || typeof legacy !== 'object' || Array.isArray(legacy)) {
    return profile([], 'malformed_fail_closed', 'legacy_migration', undefined, options.updatedAt, [
      { reason: 'legacy_equipment_malformed', status: 'malformed_fail_closed' },
    ]);
  }
  const record = legacy as Partial<EquipmentProfile>;
  const capabilities: CanonicalEquipmentCapability[] = [];
  if (record.band === true) capabilities.push('resistance_band');
  if (record.miniBand === true) capabilities.push('mini_band');
  if (record.stair === true) capabilities.push('stairs');
  return profile(sortCapabilities(capabilities), 'legacy_migrated', 'legacy_migration', undefined, options.updatedAt, [
    { reason: 'legacy_equipment_migrated', capabilities: sortCapabilities(capabilities), status: 'legacy_migrated' },
  ]);
}

export function resolveCanonicalEquipmentRecords(input: {
  local?: CanonicalEquipmentProfile | null;
  remote?: CanonicalEquipmentProfile | null;
  legacy?: unknown;
}): { profile: CanonicalEquipmentProfile; diagnostics: EquipmentDiagnostic[] } {
  const local = input.local ?? null;
  const remote = input.remote ?? null;
  const localExplicit = local?.status === 'confirmed' ? local : null;
  const remoteExplicit = remote?.status === 'confirmed' ? remote : null;
  const diagnostics: EquipmentDiagnostic[] = [];

  if (localExplicit && remoteExplicit) {
    const conflict = equipmentFingerprint(localExplicit) !== equipmentFingerprint(remoteExplicit);
    const localMarker = marker(localExplicit);
    const remoteMarker = marker(remoteExplicit);
    if (localMarker !== null && remoteMarker !== null) {
      if (remoteMarker > localMarker) {
        if (conflict) diagnostics.push(conflictDiagnostic('equipment_conflict_remote_wins', localExplicit, remoteExplicit));
        return withDiagnostics(remoteExplicit, diagnostics);
      }
      if (localMarker === remoteMarker && conflict) {
        diagnostics.push(conflictDiagnostic('equipment_conflict_equal_marker_local_wins', localExplicit, remoteExplicit));
      } else if (conflict) {
        diagnostics.push(conflictDiagnostic('equipment_conflict_local_wins', localExplicit, remoteExplicit));
      }
      return withDiagnostics(localExplicit, diagnostics);
    }
    if (conflict) {
      diagnostics.push(conflictDiagnostic('equipment_conflict_missing_marker_local_wins', localExplicit, remoteExplicit));
    }
    return withDiagnostics(localExplicit, diagnostics);
  }

  if (localExplicit) return withDiagnostics(localExplicit, diagnostics);
  if (remoteExplicit) return withDiagnostics(remoteExplicit, diagnostics);

  if (input.legacy !== undefined) {
    const migrated = migrateLegacyEquipmentProfile(input.legacy);
    return withDiagnostics(migrated, diagnostics);
  }

  const unknown = normalizeCanonicalEquipment(undefined, { source: 'default_unknown' });
  return withDiagnostics(unknown, [
    { reason: 'equipment_resolved_default_unknown', status: 'needs_confirmation' },
  ]);
}

export function plannedEquipmentSnapshotFromCanonical(
  canonical: CanonicalEquipmentProfile
): PlannedEquipmentSnapshot {
  const snapshotWithoutFingerprint = {
    schemaVersion: CANONICAL_EQUIPMENT_SCHEMA_VERSION,
    capabilities: sortCapabilities(canonical.capabilities),
    status: canonical.status,
    sourceRevision: canonical.revision,
    sourceUpdatedAt: canonical.updatedAt,
  } satisfies Omit<PlannedEquipmentSnapshot, 'fingerprint'>;
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: equipmentSnapshotFingerprint(snapshotWithoutFingerprint),
  };
}

export function equipmentFingerprint(canonical: Pick<CanonicalEquipmentProfile, 'capabilities' | 'status'>): string {
  return equipmentSnapshotFingerprint({
    schemaVersion: CANONICAL_EQUIPMENT_SCHEMA_VERSION,
    capabilities: canonical.capabilities,
    status: canonical.status,
  });
}

export function equipmentSnapshotFingerprint(
  snapshot: Pick<PlannedEquipmentSnapshot, 'schemaVersion' | 'capabilities' | 'status'>
): string {
  return [
    `equipment:v${snapshot.schemaVersion}`,
    `status=${snapshot.status}`,
    `capabilities=${sortCapabilities(snapshot.capabilities).join('|') || 'none'}`,
  ].join(';');
}

export function validatePlanEquipmentSnapshot(input: {
  planned?: PlannedEquipmentSnapshot | null;
  current: CanonicalEquipmentProfile;
  source?: string;
}): PlanEquipmentValidation {
  if (input.source === 'legacy_fallback') {
    return {
      status: 'legacy_plan',
      diagnostics: [{ reason: 'plan_equipment_legacy_plan', status: input.current.status }],
    };
  }
  if (!input.planned) {
    return {
      status: 'missing_plan_snapshot',
      diagnostics: [{ reason: 'plan_equipment_snapshot_missing', status: input.current.status }],
    };
  }
  if (input.current.status !== 'confirmed') {
    return {
      status: 'canonical_equipment_unknown',
      diagnostics: [
        {
          reason: 'plan_equipment_canonical_unknown',
          status: input.current.status,
          currentFingerprint: equipmentFingerprint(input.current),
        },
      ],
    };
  }
  const currentSnapshot = plannedEquipmentSnapshotFromCanonical(input.current);
  if (input.planned.fingerprint !== currentSnapshot.fingerprint) {
    return {
      status: 'equipment_changed',
      diagnostics: [
        {
          reason: 'plan_equipment_fingerprint_mismatch',
          plannedFingerprint: input.planned.fingerprint,
          currentFingerprint: currentSnapshot.fingerprint,
          status: input.current.status,
        },
      ],
    };
  }
  return { status: 'current', diagnostics: [] };
}

export function sortCapabilities(
  capabilities: readonly CanonicalEquipmentCapability[]
): CanonicalEquipmentCapability[] {
  const unique = capabilities.filter((capability, index) => capabilities.indexOf(capability) === index);
  return unique.slice().sort((a, b) => CANONICAL_EQUIPMENT_ORDER.indexOf(a) - CANONICAL_EQUIPMENT_ORDER.indexOf(b));
}

function normalizeEquipmentToken(value: unknown): CanonicalEquipmentCapability | 'none' | null {
  if (typeof value !== 'string') return null;
  if (value === 'none') return 'none';
  if (isCanonicalEquipmentCapability(value)) return value;
  if (value === 'stair') return 'stairs';
  if (value === 'band' || value === 'long_band') return 'resistance_band';
  if (value === 'miniBand') return 'mini_band';
  if (value === 'load' || value === 'backpack_or_weight') return 'backpack';
  return null;
}

function profile(
  capabilities: readonly CanonicalEquipmentCapability[],
  status: CanonicalEquipmentStatus,
  source: CanonicalEquipmentSource,
  revision: number | undefined,
  updatedAt: string | undefined,
  diagnostics: readonly EquipmentDiagnostic[]
): CanonicalEquipmentProfile {
  const sorted = sortCapabilities(capabilities);
  return {
    schemaVersion: CANONICAL_EQUIPMENT_SCHEMA_VERSION,
    capabilities: sorted,
    status,
    source,
    ...(revision !== undefined ? { revision } : {}),
    ...(updatedAt ? { updatedAt } : {}),
    diagnostics: [
      ...diagnostics,
      { reason: 'canonical_equipment_normalized', capabilities: sorted, status },
    ],
  };
}

function withDiagnostics(
  profileValue: CanonicalEquipmentProfile,
  diagnostics: readonly EquipmentDiagnostic[]
): { profile: CanonicalEquipmentProfile; diagnostics: EquipmentDiagnostic[] } {
  const combined = [...diagnostics, ...profileValue.diagnostics];
  return { profile: { ...profileValue, diagnostics: combined }, diagnostics: combined };
}

function conflictDiagnostic(
  reason: EquipmentDiagnosticReason,
  local: CanonicalEquipmentProfile,
  remote: CanonicalEquipmentProfile
): EquipmentDiagnostic {
  return {
    reason,
    localUpdatedAt: local.updatedAt,
    remoteUpdatedAt: remote.updatedAt,
    localRevision: local.revision,
    remoteRevision: remote.revision,
    fingerprint: equipmentFingerprint(local),
  };
}

function marker(profileValue: CanonicalEquipmentProfile): number | null {
  if (typeof profileValue.revision === 'number' && Number.isFinite(profileValue.revision)) {
    return profileValue.revision;
  }
  if (profileValue.updatedAt) {
    const parsed = Date.parse(profileValue.updatedAt);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function finiteRevision(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}
