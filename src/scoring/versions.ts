export const CURRENT_SCORING_VERSION = 1 as const;
export const CURRENT_NORM_VERSION = 1 as const;
export const SCORE_SNAPSHOT_SCHEMA_VERSION = 1 as const;

export function isPositiveIntegerVersion(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}
