/**
 * Clarity dimension activation (REPOSITION_TDD Part 2a, approved 2026-07-06).
 *
 * Clarity is REGISTERED in the dimension registry now but excluded from every
 * scoring surface until this flag flips. Default off everywhere; audited as an
 * unsafe beta/release flag (app.config.js + releaseFlagAudit) so a beta or
 * production build cannot ship it accidentally. When Clarity ships for real,
 * activation moves to a readiness constant with its own recorded decision —
 * this env flag is the development gate only.
 */
export const CLARITY_DIMENSION_FLAG = 'EXPO_PUBLIC_ENABLE_CLARITY_DIMENSION' as const;

export function parseClarityDimensionFlag(value: unknown): boolean {
  return value === '1';
}

export function isClarityDimensionEnabled(
  value: unknown = process.env.EXPO_PUBLIC_ENABLE_CLARITY_DIMENSION,
  dev = defaultDevMode()
): boolean {
  return dev && parseClarityDimensionFlag(value);
}

function defaultDevMode(): boolean {
  return typeof __DEV__ === 'boolean' && __DEV__;
}
