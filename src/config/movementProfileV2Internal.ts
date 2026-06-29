export const MOVEMENT_PROFILE_V2_INTERNAL_ENV =
  'EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_INTERNAL';

export function parseMovementProfileV2InternalFlag(value: unknown): boolean {
  return value === '1';
}

export function isMovementProfileV2InternalEnabled(
  value: unknown = process.env.EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_INTERNAL,
  dev = defaultDevMode()
): boolean {
  return dev && parseMovementProfileV2InternalFlag(value);
}

export const MOVEMENT_PROFILE_V2_INTERNAL_ENABLED = isMovementProfileV2InternalEnabled();

function defaultDevMode(): boolean {
  return typeof __DEV__ === 'boolean' && __DEV__;
}
