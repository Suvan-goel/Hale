/**
 * Programme engine v2 activation (C4 ruling, 2026-07-06 — flag-gated
 * parallel build).
 *
 * The five-pattern-ladder programme engine (src/programme) is built alongside
 * the existing training engine, which keeps the app shippable until parity;
 * nothing old is deleted until promotion. Default off everywhere; audited as
 * an unsafe beta/release flag (releaseFlagAudit) so a beta or production
 * build cannot ship it accidentally. Promotion to default-on is its own
 * recorded decision with the old→new parity checklist
 * (docs/specs/ladder-migration-map.md) signed off.
 */
export const PROGRAMME_ENGINE_V2_FLAG = 'EXPO_PUBLIC_ENABLE_PROGRAMME_ENGINE_V2' as const;

export function parseProgrammeEngineV2Flag(value: unknown): boolean {
  return value === '1';
}

export function isProgrammeEngineV2Enabled(
  value: unknown = process.env.EXPO_PUBLIC_ENABLE_PROGRAMME_ENGINE_V2,
  dev = defaultDevMode()
): boolean {
  return dev && parseProgrammeEngineV2Flag(value);
}

function defaultDevMode(): boolean {
  return typeof __DEV__ === 'boolean' && __DEV__;
}
