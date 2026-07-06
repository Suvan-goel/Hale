/**
 * Routing precedence resolver — onboarding-spec v0.2 §4/§10 under the
 * 2026-07-06 rulings.
 *
 * Precedence when flags conflict: hard gates > soft routings > preferences.
 *
 * v1 REGISTERS ZERO HARD GATES (C1/C2 package deferral): the only hard gate
 * in the spec — osteoporosis locking the Impact track — is deferred together
 * with B2 and the Impact track itself. This is acceptable because v1 content
 * is uniformly low-risk (programme-wide spinal-flexion ban, no impact
 * loading, conservative starts); clinical review must bless this before
 * launch. The empty registry is pinned by test so a hard gate can never be
 * added casually — when impact un-defers, the osteoporosis gate registers
 * here and the pin moves to exactly one.
 *
 * The resolver is tiered and returns a decision trail so precedence is
 * observable in tests, not implicit in evaluation order.
 */

import type { ProgrammeProfile } from './types';

export type RoutingTier = 'hard_gate' | 'soft_routing' | 'preference';

export interface SessionRouting {
  /** v1: the quiet track is the universal finisher ("power finisher"). */
  finisherTrack: 'quiet_power';
  /** Firm stomps are the one finisher item excluded by quiet routing. */
  includeStomps: boolean;
  /** Gentle Start (B1) withholds bonus sets until gp_confirmed. */
  bonusSetsAllowed: boolean;
  /** Gentle Start softens the spoken cadence. */
  softerCadence: boolean;
  /** B5 / T1: unilateral work defaults to fingertips-on-support variants. */
  supportVariantsDefault: boolean;
  /** B4: pelvic floor guidance content + one-time physio signpost. */
  pelvicContentUnlocked: boolean;
}

export interface RoutingDecision {
  field: keyof SessionRouting;
  tier: RoutingTier;
  rule: string;
}

export interface ResolvedSessionRouting {
  routing: SessionRouting;
  decisions: readonly RoutingDecision[];
}

interface RoutingRule {
  tier: RoutingTier;
  id: string;
  applies(profile: ProgrammeProfile): boolean;
  apply(routing: SessionRouting): Partial<SessionRouting>;
}

/**
 * v1: deliberately empty (see module header). The zero-hard-gates pin in
 * routing.test.ts breaks the moment anything lands here.
 */
export const HARD_GATE_RULES: readonly RoutingRule[] = [];

const SOFT_ROUTING_RULES: readonly RoutingRule[] = [
  {
    tier: 'soft_routing',
    id: 'b1_gentle_start',
    applies: (p) => p.gentleStartActive && !p.gpConfirmed,
    apply: () => ({ bonusSetsAllowed: false, softerCadence: true }),
  },
  {
    // §4 consent-decline row: conservative routing, normal tone. Without
    // health answers the finisher stays fully quiet — but no pelvic content
    // unlocks (a privacy choice is never treated as a health flag).
    tier: 'soft_routing',
    id: 'consent_declined_conservative',
    applies: (p) => !p.consentHealthData,
    apply: () => ({ includeStomps: false }),
  },
  {
    tier: 'soft_routing',
    id: 'b4_pelvic_low_impact',
    applies: (p) => p.pelvicRouting === 'low_impact',
    apply: () => ({ includeStomps: false, pelvicContentUnlocked: true }),
  },
  {
    tier: 'soft_routing',
    id: 'b5_balance_support',
    applies: (p) => p.balanceSupportDefault,
    apply: () => ({ supportVariantsDefault: true }),
  },
];

const PREFERENCE_RULES: readonly RoutingRule[] = [
  {
    tier: 'preference',
    id: 'c2_quiet_mode',
    applies: (p) => p.quietMode,
    apply: () => ({ includeStomps: false }),
  },
];

const DEFAULT_ROUTING: SessionRouting = {
  finisherTrack: 'quiet_power',
  includeStomps: true,
  bonusSetsAllowed: true,
  softerCadence: false,
  supportVariantsDefault: false,
  pelvicContentUnlocked: false,
};

/**
 * Lower tiers apply first and higher tiers overwrite, so the trail's last
 * writer per field is always the highest-precedence rule that touched it.
 */
export function resolveSessionRouting(profile: ProgrammeProfile): ResolvedSessionRouting {
  const routing: SessionRouting = { ...DEFAULT_ROUTING };
  const decisions: RoutingDecision[] = [];
  const tiers: readonly (readonly RoutingRule[])[] = [
    PREFERENCE_RULES,
    SOFT_ROUTING_RULES,
    HARD_GATE_RULES,
  ];
  for (const rules of tiers) {
    for (const rule of rules) {
      if (!rule.applies(profile)) continue;
      const patch = rule.apply(routing);
      Object.assign(routing, patch);
      for (const key of Object.keys(patch) as (keyof SessionRouting)[]) {
        decisions.push({ field: key, tier: rule.tier, rule: rule.id });
      }
    }
  }
  return { routing, decisions };
}
