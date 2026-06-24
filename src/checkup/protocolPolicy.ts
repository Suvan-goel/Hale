/**
 * Check-Up protocol policy.
 *
 * V1 Movement Age scoring and the raw-first V2 Movement Profile battery are
 * deliberately separate contracts. The policy is frozen when a Check-Up
 * starts and travels with the raw record so older V1 history keeps scoring
 * while V2 raw measurements cannot silently enter V1 scoring paths.
 */

export const LEGACY_MOVEMENT_AGE_PROTOCOL_POLICY_ID = 'legacy_movement_age_v1' as const;
export const MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID = 'movement_profile_v2' as const;

export type CheckUpProtocolPolicyId =
  | typeof LEGACY_MOVEMENT_AGE_PROTOCOL_POLICY_ID
  | typeof MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID;

export interface CheckUpProtocolPolicy {
  id: CheckUpProtocolPolicyId;
  version: 1;
  /** Wall-clock Check-Up start; included so retries cannot inherit a mutable policy. */
  frozenAt: string;
}

export type NormalizedCheckUpProtocolPolicy =
  | {
      supported: true;
      policy: CheckUpProtocolPolicy;
      inferredDefault: boolean;
    }
  | {
      supported: false;
      policy: null;
      inferredDefault: false;
      unsupportedId: string | null;
    };

export function createCheckUpProtocolPolicy(
  id: CheckUpProtocolPolicyId = LEGACY_MOVEMENT_AGE_PROTOCOL_POLICY_ID,
  frozenAt: string
): CheckUpProtocolPolicy {
  return { id, version: 1, frozenAt };
}

export function normalizeCheckUpProtocolPolicy(
  value: unknown,
  fallbackFrozenAt = ''
): NormalizedCheckUpProtocolPolicy {
  if (value === null || value === undefined) {
    return {
      supported: true,
      policy: createCheckUpProtocolPolicy(LEGACY_MOVEMENT_AGE_PROTOCOL_POLICY_ID, fallbackFrozenAt),
      inferredDefault: true,
    };
  }
  if (!isRecord(value)) {
    return { supported: false, policy: null, inferredDefault: false, unsupportedId: null };
  }
  const id = value.id;
  if (id !== LEGACY_MOVEMENT_AGE_PROTOCOL_POLICY_ID && id !== MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID) {
    return {
      supported: false,
      policy: null,
      inferredDefault: false,
      unsupportedId: typeof id === 'string' ? id : null,
    };
  }
  if (value.version !== 1) {
    return { supported: false, policy: null, inferredDefault: false, unsupportedId: id };
  }
  return {
    supported: true,
    policy: {
      id,
      version: 1,
      frozenAt: typeof value.frozenAt === 'string' ? value.frozenAt : fallbackFrozenAt,
    },
    inferredDefault: false,
  };
}

export function normalizeCheckUpRecordProtocolPolicy(checkUp: unknown): NormalizedCheckUpProtocolPolicy {
  if (!isRecord(checkUp)) return normalizeCheckUpProtocolPolicy(undefined);
  const startedAt = typeof checkUp.startedAt === 'string' ? checkUp.startedAt : '';
  return normalizeCheckUpProtocolPolicy(checkUp.protocolPolicy, startedAt);
}

export function isLegacyMovementAgePolicy(checkUp: unknown): boolean {
  const normalized = normalizeCheckUpRecordProtocolPolicy(checkUp);
  return normalized.supported && normalized.policy.id === LEGACY_MOVEMENT_AGE_PROTOCOL_POLICY_ID;
}

export function isMovementProfileV2Policy(checkUp: unknown): boolean {
  const normalized = normalizeCheckUpRecordProtocolPolicy(checkUp);
  return normalized.supported && normalized.policy.id === MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID;
}

export function protocolPolicyIdForCheckUp(checkUp: unknown): CheckUpProtocolPolicyId | null {
  const normalized = normalizeCheckUpRecordProtocolPolicy(checkUp);
  return normalized.supported ? normalized.policy.id : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
