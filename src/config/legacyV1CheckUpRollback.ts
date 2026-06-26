export const LEGACY_V1_CHECKUP_ROLLBACK_ENV =
  'EXPO_PUBLIC_ENABLE_LEGACY_V1_CHECKUP_ROLLBACK';

export function parseLegacyV1CheckUpRollbackFlag(value: unknown): boolean {
  return value === '1';
}

export const LEGACY_V1_CHECKUP_ROLLBACK_ENABLED = parseLegacyV1CheckUpRollbackFlag(
  process.env.EXPO_PUBLIC_ENABLE_LEGACY_V1_CHECKUP_ROLLBACK
);
