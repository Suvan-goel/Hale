/**
 * Fingerprinted policy snapshot for the programme engine (C4 ruling: the new
 * ladders launch under the same reviewed-policy-snapshot discipline as the
 * controlled-beta engine — a good pattern for a health product).
 *
 * The fingerprint canonically covers everything that changes what the engine
 * would decide: ladder structure (levels, schemes, sets, entry flags,
 * gateways, prerequisites), finisher items, adaptation branches, and the
 * promotion config. Stored state pins the fingerprint it was built under;
 * a mismatch marks the state stale so the caller re-pins deliberately
 * instead of silently running old state against new rules.
 */

import { DEFAULT_PROMOTION_CONFIG, type PromotionConfig } from './promotion';
import {
  ADAPTATION_BRANCHES,
  PROGRAMME_LADDERS,
  QUIET_FINISHER_ITEMS,
} from './ladders';
import type { ProgrammePattern } from './types';

export const PROGRAMME_POLICY_SCHEMA_VERSION = 1;

export function programmePolicyFingerprint(
  config: PromotionConfig = DEFAULT_PROMOTION_CONFIG
): string {
  const ladders = (Object.keys(PROGRAMME_LADDERS) as ProgrammePattern[])
    .sort()
    .map((pattern) =>
      PROGRAMME_LADDERS[pattern].levels
        .map((level) =>
          [
            pattern,
            level.level,
            level.primary.id,
            level.variation.id,
            level.occasionalVariation?.id ?? '',
            level.sets,
            level.scheme.kind,
            level.scheme.min,
            level.scheme.max,
            level.isEntryLevel ? 'entry' : 'std',
            level.gateway
              ? `gate(${level.gateway.rehearsalDrillId ?? ''}:${level.gateway.requiredRehearsalExposures})`
              : '',
            level.crossLadderPrereq
              ? `prereq(${level.crossLadderPrereq.pattern}:${level.crossLadderPrereq.level})`
              : '',
          ].join('/')
        )
        .join(',')
    )
    .join('|');
  const finisher = QUIET_FINISHER_ITEMS.map((item) =>
    [
      item.id,
      item.track,
      item.order,
      item.dose.kind,
      'sets' in item.dose ? item.dose.sets : '',
      item.dose.min,
      item.dose.max,
      item.skipOnQuietRouting ? 'quiet-skip' : '',
    ].join('/')
  ).join(',');
  const branches = ADAPTATION_BRANCHES.map((branch) =>
    [branch.id, branch.triggerPatterns.join('+'), branch.modifications.join('+')].join('/')
  ).join(',');
  const configPart = [
    config.standardConsecutiveSessions,
    config.bottomNoneSessionsForHoldReduce,
    config.inactivityRegressionDays,
  ].join('/');
  const canonical = [
    `schema:${PROGRAMME_POLICY_SCHEMA_VERSION}`,
    `config:${configPart}`,
    `ladders:${ladders}`,
    `finisher:${finisher}`,
    `branches:${branches}`,
  ].join('|');
  return ['programme', PROGRAMME_POLICY_SCHEMA_VERSION, stableHash(canonical)].join(':');
}

export type ProgrammePolicyValidation =
  | { status: 'current' }
  | { status: 'stale_policy'; storedFingerprint: string; currentFingerprint: string };

export function validateProgrammePolicyFingerprint(
  storedFingerprint: string,
  config: PromotionConfig = DEFAULT_PROMOTION_CONFIG
): ProgrammePolicyValidation {
  const current = programmePolicyFingerprint(config);
  if (storedFingerprint === current) return { status: 'current' };
  return { status: 'stale_policy', storedFingerprint, currentFingerprint: current };
}

/** FNV-1a, matching the hashing style used by the controlled-beta policy. */
function stableHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(36).padStart(7, '0');
}
