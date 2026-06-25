export const UNIFIED_MOVEMENT_CHECKUP_RELEASE_ENV =
  'EXPO_PUBLIC_ENABLE_UNIFIED_MOVEMENT_CHECKUP';

export function parseUnifiedMovementCheckUpReleaseFlag(value: unknown): boolean {
  return value === '1';
}

export const UNIFIED_MOVEMENT_CHECKUP_RELEASE_ENABLED =
  parseUnifiedMovementCheckUpReleaseFlag(
    process.env.EXPO_PUBLIC_ENABLE_UNIFIED_MOVEMENT_CHECKUP
  );
