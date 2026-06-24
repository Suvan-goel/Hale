/**
 * Raw evidence states for the V2 Movement Profile battery.
 *
 * These are not score labels. They say whether a raw measurement followed the
 * reference protocol closely enough for future reference-table interpretation.
 */

export type MovementProfileV2EvidenceStatus =
  | 'reference_protocol_complete'
  | 'raw_only_setup_uncertain'
  | 'raw_only_protocol_incomplete'
  | 'raw_only_tracking_uncertain'
  | 'raw_only_pain_limited'
  | 'invalid_measurement';

export type ProtocolInvalidReason =
  | 'setup_not_confirmed'
  | 'practice_not_completed'
  | 'no_valid_measurement'
  | 'tracking_interrupted'
  | 'app_backgrounded'
  | 'user_declined_retry'
  | 'hard_cap_reached'
  | 'invalid_capture'
  | 'pain_limited';

export interface ProtocolMeasurementWindow {
  startedAtMs: number;
  endedAtMs: number;
  valid: boolean;
  reason: string;
}

export function isReferenceProtocolComplete(status: MovementProfileV2EvidenceStatus): boolean {
  return status === 'reference_protocol_complete';
}

export function isValidMovementProfileV2RawEvidence(status: MovementProfileV2EvidenceStatus): boolean {
  return status !== 'invalid_measurement';
}

export function isJsonSafeProtocolPayload(value: unknown): boolean {
  if (value === null) return true;
  if (typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isJsonSafeProtocolPayload);
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).every(isJsonSafeProtocolPayload);
  }
  return false;
}
