import {
  MOVEMENT_PROFILE_V2_INTERNAL_ENABLED,
  parseMovementProfileV2InternalFlag,
} from '../config/movementProfileV2Internal';
import type { MovementProfileV2LiveDiagnostics } from './liveCoordinator';

export function parseMovementProfileV2DiagnosticsFlag(value: unknown): boolean {
  return value === '1';
}

export function isMovementProfileV2DiagnosticsEnabled(input: {
  diagnosticsFlag?: unknown;
  internalFlag?: unknown;
} = {}): boolean {
  const internalEnabled =
    input.internalFlag === undefined
      ? MOVEMENT_PROFILE_V2_INTERNAL_ENABLED
      : parseMovementProfileV2InternalFlag(input.internalFlag);
  if (!internalEnabled) return false;
  const diagnosticsEnabled =
    input.diagnosticsFlag === undefined
      ? parseMovementProfileV2DiagnosticsFlag(
          process.env.EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_DIAGNOSTICS
        )
      : parseMovementProfileV2DiagnosticsFlag(input.diagnosticsFlag);
  return diagnosticsEnabled;
}

export function serializeMovementProfileV2LiveDiagnostics(
  diagnostics: MovementProfileV2LiveDiagnostics
): string {
  return JSON.stringify(sanitizeDiagnostics(diagnostics), null, 2);
}

function sanitizeDiagnostics(
  diagnostics: MovementProfileV2LiveDiagnostics
): MovementProfileV2LiveDiagnostics {
  return {
    ...diagnostics,
    stateTransitions: diagnostics.stateTransitions.slice(0, 80).map((transition) => ({
      atMs: transition.atMs,
      from: transition.from,
      to: transition.to,
      reason: transition.reason,
    })),
    chair: { ...diagnostics.chair },
    balance: { ...diagnostics.balance },
    shoulder: { ...diagnostics.shoulder },
    hinge: { ...diagnostics.hinge },
  };
}
