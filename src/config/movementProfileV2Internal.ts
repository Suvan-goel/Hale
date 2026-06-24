export const MOVEMENT_PROFILE_V2_INTERNAL_ENV =
  'EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_INTERNAL';

export function parseMovementProfileV2InternalFlag(value: unknown): boolean {
  return value === '1';
}

export const MOVEMENT_PROFILE_V2_INTERNAL_ENABLED = parseMovementProfileV2InternalFlag(
  process.env.EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_INTERNAL
);
