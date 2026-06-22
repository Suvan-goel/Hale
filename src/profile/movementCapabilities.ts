import type {
  CapabilityConfirmationStatus,
  MovementCapabilityProfile,
  MovementSafetyProfile,
  SingleLegBalanceCapabilityStatus,
} from '../adherence';

export const MOVEMENT_CAPABILITY_SCHEMA_VERSION = 1;

export type MovementCapabilitySource = 'local_user' | 'remote_profile' | 'default_unknown';

export type MovementCapabilityDiagnosticReason =
  | 'movement_capability_normalized'
  | 'movement_capability_missing'
  | 'movement_capability_malformed'
  | 'movement_capability_conflict_local_wins'
  | 'movement_capability_conflict_remote_wins'
  | 'movement_capability_conflict_equal_marker_local_wins'
  | 'movement_capability_conflict_missing_marker_local_wins'
  | 'movement_capability_resolved_default_unknown'
  | 'plan_movement_capability_fingerprint_mismatch'
  | 'plan_movement_capability_snapshot_missing'
  | 'plan_movement_capability_legacy_plan';

export interface MovementCapabilityDiagnostic {
  reason: MovementCapabilityDiagnosticReason;
  localUpdatedAt?: string;
  remoteUpdatedAt?: string;
  localRevision?: number;
  remoteRevision?: number;
  plannedFingerprint?: string;
  currentFingerprint?: string;
}

export interface NormalizedMovementCapabilityProfile {
  schemaVersion: typeof MOVEMENT_CAPABILITY_SCHEMA_VERSION;
  floorTransfer: MovementCapabilityProfile['floorTransfer'];
  stepUpEnvironment: MovementCapabilityProfile['stepUpEnvironment'];
  singleLegBalance: MovementCapabilityProfile['singleLegBalance'];
  source: MovementCapabilitySource;
  revision?: number;
  updatedAt?: string;
  diagnostics: MovementCapabilityDiagnostic[];
}

export interface PlannedMovementCapabilitySnapshot {
  schemaVersion: typeof MOVEMENT_CAPABILITY_SCHEMA_VERSION;
  floorTransferStatus: CapabilityConfirmationStatus;
  stepUpEnvironmentStatus: CapabilityConfirmationStatus;
  stepUpLowStableStep: boolean;
  stepUpFixedSupport: boolean;
  stepUpClearDryArea: boolean;
  stepUpPhoneOutOfPath: boolean;
  singleLegBalanceStatus: SingleLegBalanceCapabilityStatus;
  fingerprint: string;
  sourceRevision?: number;
  sourceUpdatedAt?: string;
}

export type PlanMovementCapabilityValidationStatus =
  | 'current'
  | 'capability_changed'
  | 'missing_plan_snapshot'
  | 'legacy_plan';

export interface PlanMovementCapabilityValidation {
  status: PlanMovementCapabilityValidationStatus;
  diagnostics: MovementCapabilityDiagnostic[];
}

const CAPABILITY_STATUSES: readonly CapabilityConfirmationStatus[] = [
  'confirmed',
  'avoid_for_now',
  'not_confirmed',
];

const SINGLE_LEG_STATUSES: readonly SingleLegBalanceCapabilityStatus[] = [
  'confirmed_with_support',
  'supported_balance_only',
  'not_confirmed',
];

export function defaultMovementCapabilityProfile(options: {
  source?: MovementCapabilitySource;
  revision?: number;
  updatedAt?: string;
} = {}): NormalizedMovementCapabilityProfile {
  return normalizedProfile(
    {
      floorTransfer: { status: 'not_confirmed' },
      stepUpEnvironment: {
        status: 'not_confirmed',
        lowStableStep: false,
        fixedSupport: false,
        clearDryArea: false,
        phoneOutOfPath: false,
      },
      singleLegBalance: { status: 'not_confirmed' },
    },
    options.source ?? 'default_unknown',
    finiteRevision(options.revision),
    stringValue(options.updatedAt),
    [{ reason: 'movement_capability_missing' }]
  );
}

export function normalizeMovementCapabilityProfile(
  input: unknown,
  options: {
    source?: MovementCapabilitySource;
    revision?: unknown;
    updatedAt?: unknown;
  } = {}
): NormalizedMovementCapabilityProfile {
  const source = options.source ?? 'local_user';
  const revision = finiteRevision(options.revision);
  const updatedAt = stringValue(options.updatedAt);

  if (input === null || input === undefined) {
    return defaultMovementCapabilityProfile({ source, revision, updatedAt });
  }
  if (!isRecord(input)) {
    return normalizedProfile(defaultMovementCapabilityProfile({ source, revision, updatedAt }), source, revision, updatedAt, [
      { reason: 'movement_capability_malformed' },
    ]);
  }

  const raw = input as Partial<MovementCapabilityProfile>;
  const floorStatus = isCapabilityStatus(raw.floorTransfer?.status)
    ? raw.floorTransfer.status
    : 'not_confirmed';
  const stepStatus = isCapabilityStatus(raw.stepUpEnvironment?.status)
    ? raw.stepUpEnvironment.status
    : 'not_confirmed';
  const singleLegStatus = isSingleLegStatus(raw.singleLegBalance?.status)
    ? raw.singleLegBalance.status
    : 'not_confirmed';
  const profile: MovementCapabilityProfile = {
    schemaVersion: MOVEMENT_CAPABILITY_SCHEMA_VERSION,
    floorTransfer: { status: floorStatus },
    stepUpEnvironment: {
      status: stepStatus,
      lowStableStep: raw.stepUpEnvironment?.lowStableStep === true,
      fixedSupport: raw.stepUpEnvironment?.fixedSupport === true,
      clearDryArea: raw.stepUpEnvironment?.clearDryArea === true,
      phoneOutOfPath: raw.stepUpEnvironment?.phoneOutOfPath === true,
    },
    singleLegBalance: { status: singleLegStatus },
  };
  const sourceRevision = finiteRevision(raw.revision) ?? revision;
  const sourceUpdatedAt = stringValue(raw.updatedAt) ?? updatedAt;
  return normalizedProfile(profile, source, sourceRevision, sourceUpdatedAt, []);
}

export function movementCapabilitiesFromSafetyProfile(
  safetyProfile: MovementSafetyProfile | null | undefined,
  source: MovementCapabilitySource = 'local_user'
): NormalizedMovementCapabilityProfile {
  if (!safetyProfile) return defaultMovementCapabilityProfile({ source: 'default_unknown' });
  return normalizeMovementCapabilityProfile(safetyProfile.movementCapabilities, {
    source,
    revision: safetyProfile.movementCapabilities?.revision,
    updatedAt: safetyProfile.movementCapabilities?.updatedAt ?? safetyProfile.updatedAt,
  });
}

export function movementCapabilityProfileForPersistence(
  input: unknown,
  options: { revision?: number; updatedAt?: string; source?: MovementCapabilitySource } = {}
): MovementCapabilityProfile {
  const normalized = normalizeMovementCapabilityProfile(input, {
    source: options.source ?? 'local_user',
    revision: options.revision,
    updatedAt: options.updatedAt,
  });
  return {
    schemaVersion: MOVEMENT_CAPABILITY_SCHEMA_VERSION,
    floorTransfer: { ...normalized.floorTransfer },
    stepUpEnvironment: { ...normalized.stepUpEnvironment },
    singleLegBalance: { ...normalized.singleLegBalance },
    revision: normalized.revision,
    updatedAt: normalized.updatedAt,
  };
}

export function safetyProfileWithMovementCapabilities(
  safetyProfile: MovementSafetyProfile,
  input: unknown,
  options: { updatedAt: string; revision?: number }
): MovementSafetyProfile {
  const current = movementCapabilitiesFromSafetyProfile(safetyProfile);
  const currentRevision =
    typeof current.revision === 'number' && Number.isFinite(current.revision)
      ? current.revision
      : 0;
  const movementCapabilities = movementCapabilityProfileForPersistence(input, {
    revision: options.revision ?? currentRevision + 1,
    updatedAt: options.updatedAt,
  });
  return {
    ...safetyProfile,
    movementCapabilities,
    updatedAt: options.updatedAt,
  };
}

export function resolveMovementCapabilityRecords(input: {
  local?: NormalizedMovementCapabilityProfile | null;
  remote?: NormalizedMovementCapabilityProfile | null;
}): { profile: NormalizedMovementCapabilityProfile; diagnostics: MovementCapabilityDiagnostic[] } {
  const local = input.local ?? null;
  const remote = input.remote ?? null;
  const localExplicit = local && !isImplicitUnknown(local) ? local : null;
  const remoteExplicit = remote && !isImplicitUnknown(remote) ? remote : null;
  const diagnostics: MovementCapabilityDiagnostic[] = [];

  if (localExplicit && remoteExplicit) {
    const conflict = movementCapabilityFingerprint(localExplicit) !== movementCapabilityFingerprint(remoteExplicit);
    const localMarker = marker(localExplicit);
    const remoteMarker = marker(remoteExplicit);
    if (localMarker !== null && remoteMarker !== null) {
      if (remoteMarker > localMarker) {
        if (conflict) diagnostics.push(conflictDiagnostic('movement_capability_conflict_remote_wins', localExplicit, remoteExplicit));
        return withDiagnostics(remoteExplicit, diagnostics);
      }
      if (localMarker === remoteMarker && conflict) {
        diagnostics.push(conflictDiagnostic('movement_capability_conflict_equal_marker_local_wins', localExplicit, remoteExplicit));
      } else if (conflict) {
        diagnostics.push(conflictDiagnostic('movement_capability_conflict_local_wins', localExplicit, remoteExplicit));
      }
      return withDiagnostics(localExplicit, diagnostics);
    }
    if (conflict) {
      diagnostics.push(conflictDiagnostic('movement_capability_conflict_missing_marker_local_wins', localExplicit, remoteExplicit));
    }
    return withDiagnostics(localExplicit, diagnostics);
  }

  if (localExplicit) return withDiagnostics(localExplicit, diagnostics);
  if (remoteExplicit) return withDiagnostics(remoteExplicit, diagnostics);

  const unknown = defaultMovementCapabilityProfile();
  return withDiagnostics(unknown, [
    { reason: 'movement_capability_resolved_default_unknown' },
  ]);
}

export function plannedMovementCapabilitySnapshotFromProfile(
  profile: NormalizedMovementCapabilityProfile
): PlannedMovementCapabilitySnapshot {
  const snapshotWithoutFingerprint = {
    schemaVersion: MOVEMENT_CAPABILITY_SCHEMA_VERSION,
    floorTransferStatus: profile.floorTransfer.status,
    stepUpEnvironmentStatus: profile.stepUpEnvironment.status,
    stepUpLowStableStep: profile.stepUpEnvironment.lowStableStep,
    stepUpFixedSupport: profile.stepUpEnvironment.fixedSupport,
    stepUpClearDryArea: profile.stepUpEnvironment.clearDryArea,
    stepUpPhoneOutOfPath: profile.stepUpEnvironment.phoneOutOfPath,
    singleLegBalanceStatus: profile.singleLegBalance.status,
    sourceRevision: profile.revision,
    sourceUpdatedAt: profile.updatedAt,
  } satisfies Omit<PlannedMovementCapabilitySnapshot, 'fingerprint'>;
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: movementCapabilitySnapshotFingerprint(snapshotWithoutFingerprint),
  };
}

export function movementCapabilityFingerprint(
  profile: Pick<
    NormalizedMovementCapabilityProfile,
    'floorTransfer' | 'stepUpEnvironment' | 'singleLegBalance'
  >
): string {
  return movementCapabilitySnapshotFingerprint({
    schemaVersion: MOVEMENT_CAPABILITY_SCHEMA_VERSION,
    floorTransferStatus: profile.floorTransfer.status,
    stepUpEnvironmentStatus: profile.stepUpEnvironment.status,
    stepUpLowStableStep: profile.stepUpEnvironment.lowStableStep,
    stepUpFixedSupport: profile.stepUpEnvironment.fixedSupport,
    stepUpClearDryArea: profile.stepUpEnvironment.clearDryArea,
    stepUpPhoneOutOfPath: profile.stepUpEnvironment.phoneOutOfPath,
    singleLegBalanceStatus: profile.singleLegBalance.status,
  });
}

export function movementCapabilitySnapshotFingerprint(
  snapshot: Pick<
    PlannedMovementCapabilitySnapshot,
    | 'schemaVersion'
    | 'floorTransferStatus'
    | 'stepUpEnvironmentStatus'
    | 'stepUpLowStableStep'
    | 'stepUpFixedSupport'
    | 'stepUpClearDryArea'
    | 'stepUpPhoneOutOfPath'
    | 'singleLegBalanceStatus'
  >
): string {
  return [
    `movement-capability:v${snapshot.schemaVersion}`,
    `floor=${snapshot.floorTransferStatus}`,
    `step=${snapshot.stepUpEnvironmentStatus}:${boolBit(snapshot.stepUpLowStableStep)}${boolBit(snapshot.stepUpFixedSupport)}${boolBit(snapshot.stepUpClearDryArea)}${boolBit(snapshot.stepUpPhoneOutOfPath)}`,
    `single_leg=${snapshot.singleLegBalanceStatus}`,
  ].join(';');
}

export function validatePlanMovementCapabilitySnapshot(input: {
  planned?: PlannedMovementCapabilitySnapshot | null;
  current: NormalizedMovementCapabilityProfile;
  source?: string;
}): PlanMovementCapabilityValidation {
  if (input.source === 'legacy_fallback') {
    return {
      status: 'legacy_plan',
      diagnostics: [{ reason: 'plan_movement_capability_legacy_plan' }],
    };
  }
  if (!input.planned) {
    return {
      status: 'missing_plan_snapshot',
      diagnostics: [{ reason: 'plan_movement_capability_snapshot_missing' }],
    };
  }
  const currentSnapshot = plannedMovementCapabilitySnapshotFromProfile(input.current);
  if (input.planned.fingerprint !== currentSnapshot.fingerprint) {
    return {
      status: 'capability_changed',
      diagnostics: [
        {
          reason: 'plan_movement_capability_fingerprint_mismatch',
          plannedFingerprint: input.planned.fingerprint,
          currentFingerprint: currentSnapshot.fingerprint,
        },
      ],
    };
  }
  return { status: 'current', diagnostics: [] };
}

export function isFloorTransferConfirmed(profile: Pick<NormalizedMovementCapabilityProfile, 'floorTransfer'>): boolean {
  return profile.floorTransfer.status === 'confirmed';
}

export function isStepUpEnvironmentConfirmed(
  profile: Pick<NormalizedMovementCapabilityProfile, 'stepUpEnvironment'>
): boolean {
  return (
    profile.stepUpEnvironment.status === 'confirmed' &&
    profile.stepUpEnvironment.lowStableStep &&
    profile.stepUpEnvironment.fixedSupport &&
    profile.stepUpEnvironment.clearDryArea &&
    profile.stepUpEnvironment.phoneOutOfPath
  );
}

export function isSingleLegBalanceConfirmed(
  profile: Pick<NormalizedMovementCapabilityProfile, 'singleLegBalance'>
): boolean {
  return profile.singleLegBalance.status === 'confirmed_with_support';
}

export function isPlannedMovementCapabilitySnapshot(value: unknown): value is PlannedMovementCapabilitySnapshot {
  if (!isRecord(value)) return false;
  const snapshot = value as Partial<PlannedMovementCapabilitySnapshot>;
  if (
    snapshot.schemaVersion !== MOVEMENT_CAPABILITY_SCHEMA_VERSION ||
    !isCapabilityStatus(snapshot.floorTransferStatus) ||
    !isCapabilityStatus(snapshot.stepUpEnvironmentStatus) ||
    typeof snapshot.stepUpLowStableStep !== 'boolean' ||
    typeof snapshot.stepUpFixedSupport !== 'boolean' ||
    typeof snapshot.stepUpClearDryArea !== 'boolean' ||
    typeof snapshot.stepUpPhoneOutOfPath !== 'boolean' ||
    !isSingleLegStatus(snapshot.singleLegBalanceStatus)
  ) {
    return false;
  }
  return (
    typeof snapshot.fingerprint === 'string' &&
    snapshot.fingerprint === movementCapabilitySnapshotFingerprint(snapshot as PlannedMovementCapabilitySnapshot)
  );
}

function normalizedProfile(
  value: Pick<MovementCapabilityProfile, 'floorTransfer' | 'stepUpEnvironment' | 'singleLegBalance'>,
  source: MovementCapabilitySource,
  revision: number | undefined,
  updatedAt: string | undefined,
  diagnostics: readonly MovementCapabilityDiagnostic[]
): NormalizedMovementCapabilityProfile {
  return {
    schemaVersion: MOVEMENT_CAPABILITY_SCHEMA_VERSION,
    floorTransfer: { status: value.floorTransfer.status },
    stepUpEnvironment: { ...value.stepUpEnvironment },
    singleLegBalance: { status: value.singleLegBalance.status },
    source,
    ...(revision !== undefined ? { revision } : {}),
    ...(updatedAt ? { updatedAt } : {}),
    diagnostics: [
      ...diagnostics,
      { reason: 'movement_capability_normalized' },
    ],
  };
}

function withDiagnostics(
  profile: NormalizedMovementCapabilityProfile,
  diagnostics: readonly MovementCapabilityDiagnostic[]
): { profile: NormalizedMovementCapabilityProfile; diagnostics: MovementCapabilityDiagnostic[] } {
  const combined = [...diagnostics, ...profile.diagnostics];
  return { profile: { ...profile, diagnostics: combined }, diagnostics: combined };
}

function conflictDiagnostic(
  reason: Extract<
    MovementCapabilityDiagnosticReason,
    | 'movement_capability_conflict_local_wins'
    | 'movement_capability_conflict_remote_wins'
    | 'movement_capability_conflict_equal_marker_local_wins'
    | 'movement_capability_conflict_missing_marker_local_wins'
  >,
  local: NormalizedMovementCapabilityProfile,
  remote: NormalizedMovementCapabilityProfile
): MovementCapabilityDiagnostic {
  return {
    reason,
    localUpdatedAt: local.updatedAt,
    remoteUpdatedAt: remote.updatedAt,
    localRevision: local.revision,
    remoteRevision: remote.revision,
  };
}

function isImplicitUnknown(profile: NormalizedMovementCapabilityProfile): boolean {
  return profile.diagnostics.some(
    (diagnostic) =>
      diagnostic.reason === 'movement_capability_missing' ||
      diagnostic.reason === 'movement_capability_malformed' ||
      diagnostic.reason === 'movement_capability_resolved_default_unknown'
  );
}

function marker(profile: NormalizedMovementCapabilityProfile): number | null {
  if (typeof profile.revision === 'number' && Number.isFinite(profile.revision)) return profile.revision;
  if (profile.updatedAt) {
    const parsed = Date.parse(profile.updatedAt);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function isCapabilityStatus(value: unknown): value is CapabilityConfirmationStatus {
  return typeof value === 'string' && CAPABILITY_STATUSES.includes(value as CapabilityConfirmationStatus);
}

function isSingleLegStatus(value: unknown): value is SingleLegBalanceCapabilityStatus {
  return typeof value === 'string' && SINGLE_LEG_STATUSES.includes(value as SingleLegBalanceCapabilityStatus);
}

function finiteRevision(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function boolBit(value: boolean): '1' | '0' {
  return value ? '1' : '0';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
