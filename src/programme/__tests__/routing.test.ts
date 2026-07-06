import { HARD_GATE_RULES, resolveSessionRouting } from '../routing';
import { defaultProgrammeProfile } from '../serialize';
import type { ProgrammeProfile } from '../types';

/** A consented, onboarded profile — the baseline for most routing tests. */
function profileWith(overrides: Partial<ProgrammeProfile>): ProgrammeProfile {
  return { ...defaultProgrammeProfile(), consentHealthData: true, ...overrides };
}

describe('zero hard gates in v1 (C1/C2 package deferral)', () => {
  it('pins the hard-gate registry at EXACTLY ZERO entries', () => {
    // The spec's only hard gate — osteoporosis locking the Impact track — is
    // deferred together with B2 and the Impact track itself. v1 content is
    // uniformly low-risk (programme-wide flexion ban, no impact loading,
    // conservative starts); clinical review must bless this before launch.
    // When impact un-defers, the osteoporosis gate registers and this pin
    // moves to exactly one. Do not add hard gates casually.
    expect(HARD_GATE_RULES).toHaveLength(0);
  });
});

describe('default routing', () => {
  it('gives a consented profile the quiet power track with stomps and bonus sets available', () => {
    const { routing, decisions } = resolveSessionRouting(profileWith({}));
    expect(routing).toEqual({
      finisherTrack: 'quiet_power',
      includeStomps: true,
      bonusSetsAllowed: true,
      softerCadence: false,
      supportVariantsDefault: false,
      pelvicContentUnlocked: false,
    });
    expect(decisions).toHaveLength(0);
  });

  it('routes conservatively without consent (§4 decline row): stomps out, no content unlock, normal tone', () => {
    const { routing, decisions } = resolveSessionRouting(defaultProgrammeProfile());
    expect(routing.includeStomps).toBe(false);
    expect(routing.pelvicContentUnlocked).toBe(false); // a privacy choice is not a symptom report
    expect(routing.bonusSetsAllowed).toBe(true); // normal tone — never Gentle Start framing
    expect(routing.softerCadence).toBe(false);
    expect(decisions).toEqual([
      { field: 'includeStomps', tier: 'soft_routing', rule: 'consent_declined_conservative' },
    ]);
  });
});

describe('soft routings', () => {
  it('B1 Gentle Start withholds bonus sets and softens cadence until gp_confirmed', () => {
    const active = resolveSessionRouting(profileWith({ gentleStartActive: true }));
    expect(active.routing.bonusSetsAllowed).toBe(false);
    expect(active.routing.softerCadence).toBe(true);

    const lifted = resolveSessionRouting(
      profileWith({ gentleStartActive: true, gpConfirmed: true })
    );
    expect(lifted.routing.bonusSetsAllowed).toBe(true);
    expect(lifted.routing.softerCadence).toBe(false);
  });

  it('B4 pelvic routing removes stomps and unlocks pelvic content', () => {
    const { routing } = resolveSessionRouting(profileWith({ pelvicRouting: 'low_impact' }));
    expect(routing.includeStomps).toBe(false);
    expect(routing.pelvicContentUnlocked).toBe(true);
  });

  it('B5 balance support defaults unilateral work to supported variants', () => {
    const { routing } = resolveSessionRouting(profileWith({ balanceSupportDefault: true }));
    expect(routing.supportVariantsDefault).toBe(true);
  });
});

describe('preferences', () => {
  it('quiet mode removes stomps', () => {
    const { routing, decisions } = resolveSessionRouting(profileWith({ quietMode: true }));
    expect(routing.includeStomps).toBe(false);
    expect(decisions).toEqual([
      { field: 'includeStomps', tier: 'preference', rule: 'c2_quiet_mode' },
    ]);
  });
});

describe('precedence: hard gates > soft routings > preferences (spec §10)', () => {
  it("the spec's own example: quiet_mode false but pelvic low_impact → low-impact wins", () => {
    const { routing, decisions } = resolveSessionRouting(
      profileWith({ quietMode: false, pelvicRouting: 'low_impact' })
    );
    expect(routing.includeStomps).toBe(false);
    const stompDecisions = decisions.filter((d) => d.field === 'includeStomps');
    expect(stompDecisions[stompDecisions.length - 1].tier).toBe('soft_routing');
  });

  it('when a preference and a soft routing both touch a field, the soft tier is the last writer', () => {
    const { decisions } = resolveSessionRouting(
      profileWith({ quietMode: true, pelvicRouting: 'low_impact' })
    );
    const stompDecisions = decisions.filter((d) => d.field === 'includeStomps');
    expect(stompDecisions.map((d) => d.tier)).toEqual(['preference', 'soft_routing']);
  });
});
