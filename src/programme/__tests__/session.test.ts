import {
  applyProgrammeSessionResults,
  generateProgrammeSession,
  SESSION_PRESET_TARGET_MINUTES,
} from '../session';
import { defaultProgrammeState } from '../serialize';
import { freshPatternLadderState } from '../promotion';
import { DEFAULT_REQUIRED_REHEARSAL_EXPOSURES, HINGE_REHEARSAL_DRILL_ID } from '../ladders';
import type {
  PhysicalTrainingFocus,
  ProgrammePhaseNumber,
  ProgrammePhasePrescription,
} from '../prescription';
import type { ProgrammePattern, ProgrammeState } from '../types';

function onboardedState(overrides: Partial<ProgrammeState['profile']> = {}): ProgrammeState {
  const state = defaultProgrammeState();
  state.profile = {
    ...state.profile,
    consentHealthData: true,
    hasStairs: true,
    ...overrides,
  };
  state.onboardingCompletedAtIso = '2026-07-06T09:00:00.000Z';
  return state;
}

function activePhaseState(
  physicalFocus: PhysicalTrainingFocus,
  phase: ProgrammePhaseNumber = 1,
  completedInPhase = 0,
  profileOverrides: Partial<ProgrammeState['profile']> = {}
): ProgrammeState {
  const state = onboardedState(profileOverrides);
  state.completedSessionCount = completedInPhase;
  const prescription: ProgrammePhasePrescription = {
    schemaVersion: 1,
    policyVersion: 1,
    policyFingerprint: 'focus-policy-test',
    prescriptionId: `phase-${phase}-${physicalFocus}`,
    phase,
    physicalFocus,
    dosePolicy: {
      plannedFocusBlocksPerWeek: 3,
      focusBlockStrategy:
        physicalFocus === 'strength'
          ? 'strength_each_session'
          : physicalFocus === 'balance'
            ? 'balance_each_session'
            : 'alternate_strength_balance',
    },
    canonicalFocus:
      physicalFocus === 'balanced'
        ? {
            kind: 'balanced',
            domain: null,
            planMode: 'balanced_insufficient_reference',
            decisionReason: 'v2_focus_balanced_no_unique_signal',
          }
        : {
            kind: 'domain',
            domain: physicalFocus === 'strength' ? 'strength_power' : 'balance',
            planMode: 'checkup_reference_focus',
            decisionReason: 'v2_focus_single_below_reference',
          },
    sourceAssessmentId: `assessment-${phase}`,
    sourceAssessmentFingerprint: `assessment-fingerprint-${phase}`,
    sourceCheckUpId: `checkup-${phase}`,
    sourceCheckUpType: phase === 1 ? 'baseline' : 'official_retest',
    createdAtIso: '2026-07-06T09:00:00.000Z',
  };
  state.journey = {
    ...state.journey,
    status: 'active',
    startedAtIso: '2026-07-06T09:00:00.000Z',
    currentPhase: phase,
    currentPhaseStartedAtIso: '2026-07-06T09:00:00.000Z',
    phasePrescriptions: { ...state.journey.phasePrescriptions, [phase]: prescription },
    sessionCredits: Array.from({ length: completedInPhase }, (_, index) => ({
      creditId: `credit-${phase}-${index}`,
      sessionId: `session-${phase}-${index}`,
      completedAtIso: `2026-07-${String(7 + index).padStart(2, '0')}T09:00:00.000Z`,
      localDateKey: `2026-07-${String(7 + index).padStart(2, '0')}`,
      phase,
      phaseWeek: 1,
      templateId: index % 2 === 0 ? 'A' : 'B',
    })),
  };
  return state;
}

describe('template mapping (§11)', () => {
  it('Template A runs primaries in Squat·Push·Hinge·Pull·Core order with the finisher last', () => {
    const plan = generateProgrammeSession({ state: onboardedState(), template: 'A', preset: 'standard' });
    expect(plan.main.map((e) => e.pattern)).toEqual(['squat', 'push', 'hinge', 'pull', 'core']);
    expect(plan.main.every((e) => e.role === 'primary')).toBe(true);
    expect(plan.finisher.length).toBeGreaterThan(0);
  });

  it('Template B leads with the hinge and runs variations', () => {
    const plan = generateProgrammeSession({ state: onboardedState(), template: 'B', preset: 'standard' });
    expect(plan.main.map((e) => e.pattern)).toEqual(['hinge', 'push', 'squat', 'pull', 'core']);
    expect(plan.main.filter((e) => e.pattern !== 'hinge').every((e) => e.role === 'variation')).toBe(true);
  });

  it('Template B uses the same-level bridge variation before Hinge L5 unlocks', () => {
    const state = onboardedState();
    state.ladders.hinge = freshPatternLadderState('hinge', 3);
    const plan = generateProgrammeSession({ state, template: 'B', preset: 'standard' });
    const hinge = plan.main.find((e) => e.pattern === 'hinge');
    expect(hinge?.level).toBe(3);
    expect(hinge?.role).toBe('variation');
    expect(hinge?.exerciseId).toBe('hinge.single_leg_bridge_hold');
  });

  it('Template B runs the standing-family primary once L5 has unlocked; A caps at the bridge family', () => {
    const state = onboardedState();
    state.ladders.hinge = freshPatternLadderState('hinge', 6);
    const planB = generateProgrammeSession({ state, template: 'B', preset: 'standard' });
    const hingeB = planB.main.find((e) => e.pattern === 'hinge');
    expect(hingeB?.level).toBe(6);
    expect(hingeB?.role).toBe('primary');

    const planA = generateProgrammeSession({ state, template: 'A', preset: 'standard' });
    const hingeA = planA.main.find((e) => e.pattern === 'hinge');
    expect(hingeA?.level).toBe(4); // bridge family, capped at L4
  });
});

describe('time budget (duration-parameterised solver)', () => {
  it('fits every preset inside its target', () => {
    for (const preset of ['standard', 'first_session', 'starter'] as const) {
      const plan = generateProgrammeSession({ state: onboardedState(), template: 'A', preset });
      expect(plan.estimatedMinutes).toBeLessThanOrEqual(SESSION_PRESET_TARGET_MINUTES[preset]);
    }
  });

  it('keeps the standard session complete: 5 exercises, 2 sets, prep, finisher', () => {
    const plan = generateProgrammeSession({ state: onboardedState(), template: 'A', preset: 'standard' });
    expect(plan.main).toHaveLength(5);
    expect(plan.main.every((e) => e.sets === 2)).toBe(true);
    expect(plan.prep.minutes).toBeGreaterThan(0);
    expect(plan.finisher).toHaveLength(2);
  });

  it('never drops prep or the finisher, trims rest and exercise count instead', () => {
    for (const preset of ['first_session', 'starter'] as const) {
      const plan = generateProgrammeSession({ state: onboardedState(), template: 'A', preset });
      // Prep survives and always carries the hinge rehearsal.
      expect(plan.prep.minutes).toBeGreaterThanOrEqual(2);
      expect(plan.prep.rehearsalDrillIds).toContain(HINGE_REHEARSAL_DRILL_ID);
      // Finisher survives (possibly trimmed to one item).
      expect(plan.finisher.length).toBeGreaterThanOrEqual(1);
      // Sets never trim below the 2-set promise.
      expect(plan.main.every((e) => e.sets === 2)).toBe(true);
      // Trimming drops per TRIM_DROP_ORDER (Core first) and always keeps
      // one lower + one upper, in template execution order.
      expect(plan.main.length).toBeGreaterThanOrEqual(2);
      const order: ProgrammePattern[] = ['squat', 'push', 'hinge', 'pull', 'core'];
      const patterns = plan.main.map((e) => e.pattern);
      expect(patterns).toEqual(order.filter((pattern) => patterns.includes(pattern)));
    }
  });

  it('short presets rotate coverage across the A/B alternation (trim rotation)', () => {
    const shortA = generateProgrammeSession({ state: onboardedState(), template: 'A', preset: 'starter' });
    expect(shortA.main.map((e) => e.pattern)).toEqual(['squat', 'push']);
    const shortB = generateProgrammeSession({ state: onboardedState(), template: 'B', preset: 'starter' });
    expect(shortB.main.map((e) => e.pattern)).toEqual(['hinge', 'pull']);
  });
});

describe('personalised phase focus blocks', () => {
  it('keeps the pre-baseline starter generic', () => {
    const plan = generateProgrammeSession({
      state: onboardedState(),
      template: 'A',
      preset: 'starter',
    });
    expect(plan.focusBlock).toBeNull();
  });

  it('folds a Strength focus into one lower-body voice item as an extra set', () => {
    for (const template of ['A', 'B'] as const) {
      const plan = generateProgrammeSession({
        state: activePhaseState('strength'),
        template,
        preset: 'standard',
      });
      expect(plan.focusBlock).toMatchObject({
        kind: 'strength',
        pattern: template === 'A' ? 'squat' : 'hinge',
        addedSets: 1,
        integratedIntoMain: true,
      });
      const focus = plan.focusBlock!;
      const matches = plan.main.filter((exercise) => exercise.exerciseId === focus.exerciseId);
      expect(matches).toHaveLength(1);
      expect(matches[0].sets).toBe(3);
      expect(plan.estimatedMinutes).toBeLessThanOrEqual(plan.targetMinutes);
    }
  });

  it('uses conservative supported Balance rungs at official phase boundaries', () => {
    const expected = [
      'balance-feet-together-hold',
      'balance-tandem-hold',
      'balance-single-leg-hold',
    ];
    for (const phase of [1, 2, 3] as const) {
      const plan = generateProgrammeSession({
        state: activePhaseState('balance', phase),
        template: 'A',
        preset: 'standard',
      });
      expect(plan.focusBlock).toMatchObject({
        kind: 'balance',
        exerciseId: expected[phase - 1],
        useSupportVariant: true,
      });
      expect(plan.estimatedMinutes).toBeLessThanOrEqual(plan.targetMinutes);
    }

    const supportedPhaseThree = generateProgrammeSession({
      state: activePhaseState('balance', 3, 0, { balanceSupportDefault: true }),
      template: 'A',
      preset: 'standard',
    });
    expect(supportedPhaseThree.focusBlock).toMatchObject({
      kind: 'balance',
      exerciseId: 'balance-tandem-hold',
    });
  });

  it('alternates a Balanced phase by completed personalised-session parity', () => {
    const first = generateProgrammeSession({
      state: activePhaseState('balanced', 1, 0),
      template: 'A',
      preset: 'standard',
    });
    const second = generateProgrammeSession({
      state: activePhaseState('balanced', 1, 1),
      template: 'B',
      preset: 'standard',
    });
    expect(first.focusBlock?.kind).toBe('strength');
    expect(second.focusBlock?.kind).toBe('balance');
  });

  it('keeps the frozen Phase 3 focus for maintenance after week 12', () => {
    const state = activePhaseState('balance', 3);
    state.journey = {
      ...state.journey,
      status: 'completed',
      completedAtIso: '2026-10-01T09:00:00.000Z',
      currentPhase: null,
      currentPhaseStartedAtIso: null,
    };
    const plan = generateProgrammeSession({ state, template: 'A', preset: 'standard' });
    expect(plan.focusBlock).toMatchObject({ kind: 'balance', phase: 3 });
  });

  it('keeps all personalised presets inside their duration promises', () => {
    for (const physicalFocus of ['strength', 'balance', 'balanced'] as const) {
      for (const preset of ['standard', 'first_session', 'starter'] as const) {
        const plan = generateProgrammeSession({
          state: activePhaseState(physicalFocus, 1, physicalFocus === 'balanced' ? 1 : 0),
          template: 'A',
          preset,
        });
        expect(plan.focusBlock).not.toBeNull();
        expect(plan.estimatedMinutes).toBeLessThanOrEqual(
          SESSION_PRESET_TARGET_MINUTES[preset]
        );
      }
    }
  });

  it('keeps the 10-minute promise at advanced unilateral ladder levels', () => {
    for (const physicalFocus of ['strength', 'balance'] as const) {
      for (const template of ['A', 'B'] as const) {
        const state = activePhaseState(physicalFocus, 3);
        state.ladders.squat = freshPatternLadderState('squat', 9);
        state.ladders.hinge = freshPatternLadderState('hinge', 8);
        state.ladders.push = freshPatternLadderState('push', 7);
        state.ladders.pull = freshPatternLadderState('pull', 6);
        state.ladders.core = freshPatternLadderState('core', 8);
        const plan = generateProgrammeSession({ state, template, preset: 'starter' });
        expect(plan.focusBlock).not.toBeNull();
        expect(plan.estimatedMinutes).toBeLessThanOrEqual(
          SESSION_PRESET_TARGET_MINUTES.starter
        );
      }
    }
  });
});

describe('routing and substitutions', () => {
  it('substitutes stairs exercises when the home has none (and when unanswered)', () => {
    for (const hasStairs of [false, null]) {
      const state = onboardedState({ hasStairs });
      state.ladders.squat = freshPatternLadderState('squat', 5); // low step-up
      const plan = generateProgrammeSession({ state, template: 'A', preset: 'standard' });
      const squat = plan.main.find((e) => e.pattern === 'squat');
      expect(squat?.exerciseId).toBe('squat.low_step_alternative');
      expect(squat?.substitution).toEqual({ fromExerciseId: 'squat.low_step_up', reason: 'no_stairs' });
    }
  });

  it('quiet routing removes stomps from the finisher', () => {
    const loud = generateProgrammeSession({
      state: onboardedState(),
      template: 'A',
      preset: 'standard',
    });
    const quiet = generateProgrammeSession({
      state: onboardedState({ quietMode: true }),
      template: 'A',
      preset: 'standard',
    });
    const allQuietIds = [0, 1, 2, 3, 4, 5].flatMap((sessions) => {
      const state = onboardedState({ quietMode: true });
      state.finisher = { ...state.finisher, completedSessions: sessions };
      return generateProgrammeSession({ state, template: 'A', preset: 'standard' }).finisher.map((i) => i.id);
    });
    expect(allQuietIds).not.toContain('finisher.moderate_stomps');
    expect(loud.routing.includeStomps).toBe(true);
    expect(quiet.routing.includeStomps).toBe(false);
  });

  it('contact-based finisher items carry the state contact budget', () => {
    const state = onboardedState();
    state.finisher = { ...state.finisher, currentContacts: 35 };
    const plan = generateProgrammeSession({ state, template: 'A', preset: 'standard' });
    const contactItem = plan.finisher.find((i) => i.dose.kind === 'contacts');
    if (contactItem) expect(contactItem.contacts).toBe(35);
  });

  it('pre-arms adaptation branches from B3 joint flags and support routing', () => {
    const plan = generateProgrammeSession({
      state: onboardedState({ jointFlags: ['knee', 'wrist'], balanceSupportDefault: true }),
      template: 'A',
      preset: 'standard',
    });
    expect(plan.activeBranches).toEqual(
      expect.arrayContaining(['knee_sensitive', 'wrist_sensitive', 'balance_limited'])
    );
    const unilateral = plan.main.find((e) => e.scheme.kind === 'reps_per_side');
    if (unilateral) expect(unilateral.useSupportVariant).toBe(true);
  });
});

describe('bonus set (previous-session effort, C9 machinery)', () => {
  it("offers bonus sets only when the last session's effort was lots and budget allows", () => {
    // Time-based core work shortens the plan enough for real headroom.
    const withHeadroom = () => {
      const state = onboardedState();
      state.ladders.core = freshPatternLadderState('core', 4);
      return state;
    };

    const noEffort = generateProgrammeSession({ state: withHeadroom(), template: 'A', preset: 'standard' });
    expect(noEffort.bonusSetEligible).toEqual([]);

    const lots = generateProgrammeSession({
      state: withHeadroom(),
      template: 'A',
      preset: 'standard',
      lastSessionEffort: 'lots',
    });
    expect(lots.bonusSetEligible.length).toBeGreaterThan(0);

    const aFew = generateProgrammeSession({
      state: withHeadroom(),
      template: 'A',
      preset: 'standard',
      lastSessionEffort: 'a_few',
    });
    expect(aFew.bonusSetEligible).toEqual([]);

    // A full-length plan with no headroom offers nothing even on 'lots' —
    // the budget gate is real.
    const noHeadroom = generateProgrammeSession({
      state: onboardedState(),
      template: 'A',
      preset: 'standard',
      lastSessionEffort: 'lots',
    });
    expect(noHeadroom.bonusSetEligible).toEqual([]);
  });

  it('never offers under Gentle Start or on a hold+reduce ladder', () => {
    const gentle = generateProgrammeSession({
      state: onboardedState({ gentleStartActive: true }),
      template: 'A',
      preset: 'standard',
      lastSessionEffort: 'lots',
    });
    expect(gentle.bonusSetEligible).toEqual([]);

    const state = onboardedState();
    state.ladders.squat = { ...state.ladders.squat, bonusSetSuspended: true };
    const suspended = generateProgrammeSession({
      state,
      template: 'A',
      preset: 'standard',
      lastSessionEffort: 'lots',
    });
    expect(suspended.bonusSetEligible).not.toContain('squat');
  });
});

describe('double progression rep targets', () => {
  it('starts at the scheme minimum and advances effort-scaled where every set hit it', () => {
    const state = onboardedState();
    const plan = generateProgrammeSession({ state, template: 'A', preset: 'standard' });
    const squat = plan.main.find((e) => e.pattern === 'squat');
    expect(squat?.repTargetPerSet).toBe(10); // squat L1 scheme 10–20

    const applied = applyProgrammeSessionResults(state, plan, {
      outcomes: [
        {
          pattern: 'squat',
          levelPerformed: 1,
          sets: [{ achieved: 10 }, { achieved: 10 }],
          effort: 'a_few',
          painFlag: false,
          performedAtIso: '2026-07-06T10:00:00.000Z',
        },
      ],
      prepCompleted: true,
      finisherCompleted: true,
      completedAtIso: '2026-07-06T10:20:00.000Z',
    });
    expect(applied.state.ladders.squat.currentRepTarget).toBe(12); // a_few → +2

    const nextPlan = generateProgrammeSession({ state: applied.state, template: 'B', preset: 'standard' });
    expect(nextPlan.main.find((e) => e.pattern === 'squat')?.repTargetPerSet).toBe(12);
  });

  it("a consistently-'lots' user reaches entry-promotion within 2 sessions", () => {
    // Session 1: entry level squat L1 (10–20), target 10, effort lots →
    // target jumps to the range top.
    const state = onboardedState();
    const s1 = applyProgrammeSessionResults(
      state,
      generateProgrammeSession({ state, template: 'A', preset: 'standard' }),
      {
        outcomes: [
          {
            pattern: 'squat',
            levelPerformed: 1,
            sets: [{ achieved: 10 }, { achieved: 10 }],
            effort: 'lots',
            painFlag: false,
            performedAtIso: '2026-07-06T10:00:00.000Z',
          },
        ],
        prepCompleted: true,
        finisherCompleted: true,
        completedAtIso: '2026-07-06T10:20:00.000Z',
      }
    );
    expect(s1.state.ladders.squat.currentRepTarget).toBe(20);

    // Session 2: she hits the top and answers lots → entry-promotes.
    const s2 = applyProgrammeSessionResults(
      s1.state,
      generateProgrammeSession({ state: s1.state, template: 'B', preset: 'standard' }),
      {
        outcomes: [
          {
            pattern: 'squat',
            levelPerformed: 1,
            sets: [{ achieved: 20 }, { achieved: 20 }],
            effort: 'lots',
            painFlag: false,
            performedAtIso: '2026-07-08T10:00:00.000Z',
          },
        ],
        prepCompleted: true,
        finisherCompleted: true,
        completedAtIso: '2026-07-08T10:20:00.000Z',
      }
    );
    expect(s2.decisions.squat).toEqual({ kind: 'promote', toLevel: 2, reason: 'entry' });
  });

  it("fast-promotion arrives promptly on standard levels for a 'lots' user; none/unanswered hold the target", () => {
    const state = onboardedState();
    state.ladders.squat = freshPatternLadderState('squat', 3); // 8–15, not entry
    const plan = generateProgrammeSession({ state, template: 'A', preset: 'standard' });
    const s1 = applyProgrammeSessionResults(state, plan, {
      outcomes: [
        {
          pattern: 'squat',
          levelPerformed: 3,
          sets: [{ achieved: 8 }, { achieved: 8 }],
          effort: 'lots',
          painFlag: false,
          performedAtIso: '2026-07-06T10:00:00.000Z',
        },
      ],
      prepCompleted: false,
      finisherCompleted: false,
      completedAtIso: '2026-07-06T10:20:00.000Z',
    });
    expect(s1.state.ladders.squat.currentRepTarget).toBe(15); // straight to the top

    const s2 = applyProgrammeSessionResults(s1.state, plan, {
      outcomes: [
        {
          pattern: 'squat',
          levelPerformed: 3,
          sets: [{ achieved: 15 }, { achieved: 15 }],
          effort: 'lots',
          painFlag: false,
          performedAtIso: '2026-07-08T10:00:00.000Z',
        },
      ],
      prepCompleted: false,
      finisherCompleted: false,
      completedAtIso: '2026-07-08T10:20:00.000Z',
    });
    expect(s2.decisions.squat).toEqual({ kind: 'promote', toLevel: 4, reason: 'fast' });

    for (const effort of ['none', null] as const) {
      const held = applyProgrammeSessionResults(state, plan, {
        outcomes: [
          {
            pattern: 'squat',
            levelPerformed: 3,
            sets: [{ achieved: 8 }, { achieved: 8 }],
            effort,
            painFlag: false,
            performedAtIso: '2026-07-06T10:00:00.000Z',
          },
        ],
        prepCompleted: false,
        finisherCompleted: false,
        completedAtIso: '2026-07-06T10:20:00.000Z',
      });
      expect(held.state.ladders.squat.currentRepTarget).toBeNull(); // unchanged (fresh state had null)
    }
  });

  it('resets the target on promotion', () => {
    const state = onboardedState();
    state.ladders.squat = {
      ...freshPatternLadderState('squat', 1),
      currentRepTarget: 20,
    };
    const plan = generateProgrammeSession({ state, template: 'A', preset: 'standard' });
    const applied = applyProgrammeSessionResults(state, plan, {
      outcomes: [
        {
          pattern: 'squat',
          levelPerformed: 1,
          sets: [{ achieved: 20 }, { achieved: 20 }],
          effort: 'a_few',
          painFlag: false,
          performedAtIso: '2026-07-06T10:00:00.000Z',
        },
      ],
      prepCompleted: false,
      finisherCompleted: false,
      completedAtIso: '2026-07-06T10:20:00.000Z',
    });
    expect(applied.decisions.squat).toEqual({ kind: 'promote', toLevel: 2, reason: 'entry' });
    expect(applied.state.ladders.squat.currentRepTarget).toBeNull();
  });
});

describe('scheme-aware advancement (finding 1 ruling)', () => {
  it("plank levels advance +5 s per 'a_few' session: top of range by exposure 6, promotion on 7", () => {
    let state = onboardedState();
    state.ladders.core = freshPatternLadderState('core', 4); // knee plank 15–40 s
    let promotedAt: number | null = null;
    for (let session = 1; session <= 8 && promotedAt === null; session++) {
      const plan = generateProgrammeSession({ state, template: 'A', preset: 'standard' });
      const core = plan.main.find((e) => e.pattern === 'core');
      if (!core) throw new Error('core missing from standard plan');
      const applied = applyProgrammeSessionResults(state, plan, {
        outcomes: [
          {
            pattern: 'core',
            levelPerformed: core.level,
            sets: [{ achieved: core.repTargetPerSet }, { achieved: core.repTargetPerSet }],
            effort: 'a_few',
            painFlag: false,
            performedAtIso: '2026-07-06T10:00:00.000Z',
          },
        ],
        prepCompleted: false,
        finisherCompleted: false,
        completedAtIso: '2026-07-06T10:20:00.000Z',
      });
      state = applied.state;
      if (applied.decisions.core?.kind === 'promote') promotedAt = session;
      if (session === 6) {
        // Target reached the range top (40 s) after five +5 s climbs.
        expect(
          generateProgrammeSession({ state, template: 'A', preset: 'standard' }).main.find(
            (e) => e.pattern === 'core'
          )?.repTargetPerSet
        ).toBe(40);
      }
    }
    expect(promotedAt).toBe(7); // 6 climbing exposures + the 2-consecutive-top rule
  });

  it('rep schemes keep the pinned +2 on a_few', () => {
    const state = onboardedState();
    const plan = generateProgrammeSession({ state, template: 'A', preset: 'standard' });
    const applied = applyProgrammeSessionResults(state, plan, {
      outcomes: [
        {
          pattern: 'squat',
          levelPerformed: 1,
          sets: [{ achieved: 10 }, { achieved: 10 }],
          effort: 'a_few',
          painFlag: false,
          performedAtIso: '2026-07-06T10:00:00.000Z',
        },
      ],
      prepCompleted: false,
      finisherCompleted: false,
      completedAtIso: '2026-07-06T10:20:00.000Z',
    });
    expect(applied.state.ladders.squat.currentRepTarget).toBe(12);
  });
});

describe('session completion applier', () => {
  it('credits hinge rehearsal exposures from completed prep, from day one', () => {
    const state = onboardedState();
    const plan = generateProgrammeSession({ state, template: 'A', preset: 'first_session' });
    let applied = applyProgrammeSessionResults(state, plan, {
      outcomes: [],
      prepCompleted: true,
      finisherCompleted: false,
      completedAtIso: '2026-07-06T10:20:00.000Z',
    });
    expect(applied.state.ladders.hinge.gatewayProgress[5]?.rehearsalExposures).toBe(1);

    for (let i = 0; i < DEFAULT_REQUIRED_REHEARSAL_EXPOSURES - 1; i++) {
      applied = applyProgrammeSessionResults(applied.state, plan, {
        outcomes: [],
        prepCompleted: true,
        finisherCompleted: false,
        completedAtIso: '2026-07-06T10:20:00.000Z',
      });
    }
    expect(applied.state.ladders.hinge.gatewayProgress[5]?.rehearsalExposures).toBe(
      DEFAULT_REQUIRED_REHEARSAL_EXPOSURES
    );
  });

  it('advances the finisher dose (+5 contacts per completed finisher, capped at 50)', () => {
    const state = onboardedState();
    const plan = generateProgrammeSession({ state, template: 'A', preset: 'standard' });
    const applied = applyProgrammeSessionResults(state, plan, {
      outcomes: [],
      prepCompleted: false,
      finisherCompleted: true,
      completedAtIso: '2026-07-06T10:20:00.000Z',
    });
    expect(applied.state.finisher).toMatchObject({ completedSessions: 1, currentContacts: 25 });

    let capped = applied.state;
    for (let i = 0; i < 10; i++) {
      capped = applyProgrammeSessionResults(capped, plan, {
        outcomes: [],
        prepCompleted: false,
        finisherCompleted: true,
        completedAtIso: '2026-07-06T10:20:00.000Z',
      }).state;
    }
    expect(capped.finisher.currentContacts).toBe(50);
  });

  it('updates session recency (the 14-day regression clock) and never touches firstSessionStarted', () => {
    const state = onboardedState();
    const plan = generateProgrammeSession({ state, template: 'A', preset: 'standard' });
    const applied = applyProgrammeSessionResults(state, plan, {
      outcomes: [],
      prepCompleted: true,
      finisherCompleted: true,
      completedAtIso: '2026-07-06T10:20:00.000Z',
    });
    expect(applied.state.lastSessionAtIso).toBe('2026-07-06T10:20:00.000Z');
    // Generation and completion never write the activation event — only the
    // session runner does, at START (conformance Q4).
    expect(applied.state.profile.firstSessionStarted).toBe(false);
  });

  it('persists the session effort answer (bonus-set offer survives a restart) and clears it when skipped', () => {
    const state = onboardedState();
    const plan = generateProgrammeSession({ state, template: 'A', preset: 'standard' });
    const answered = applyProgrammeSessionResults(state, plan, {
      outcomes: [],
      prepCompleted: true,
      finisherCompleted: true,
      completedAtIso: '2026-07-06T10:20:00.000Z',
      sessionEffort: 'lots',
    });
    expect(answered.state.lastSessionEffort).toBe('lots');

    // A skipped check-in overwrites — a stale 'lots' must never keep offering
    // bonus sets on unknown effort (conservative default).
    const skipped = applyProgrammeSessionResults(answered.state, plan, {
      outcomes: [],
      prepCompleted: true,
      finisherCompleted: true,
      completedAtIso: '2026-07-07T10:20:00.000Z',
    });
    expect(skipped.state.lastSessionEffort).toBeNull();
  });
});

describe("partial application (early leave: 'everything you've finished is saved')", () => {
  it('applies ladders, rehearsal credit, and recency — but neither the session counter nor the effort answer', () => {
    const state = { ...onboardedState(), lastSessionEffort: 'lots' as const, completedSessionCount: 4 };
    const plan = generateProgrammeSession({ state, template: 'A', preset: 'standard' });
    const squat = plan.main.find((exercise) => exercise.pattern === 'squat')!;
    const applied = applyProgrammeSessionResults(
      state,
      plan,
      {
        outcomes: [
          {
            pattern: 'squat',
            levelPerformed: squat.level,
            sets: Array.from({ length: squat.sets }, () => ({ achieved: squat.scheme.max })),
            effort: null,
            painFlag: false,
            performedAtIso: '2026-07-16T10:20:00.000Z',
          },
        ],
        prepCompleted: true,
        finisherCompleted: false,
        completedAtIso: '2026-07-16T10:20:00.000Z',
      },
      { credit: 'partial' }
    );

    // What she finished counts toward the ladder…
    expect(applied.state.ladders.squat.consecutiveTopSessions).toBeGreaterThan(0);
    expect(applied.state.ladders.hinge.gatewayProgress[5]?.rehearsalExposures).toBe(1);
    // …and the inactivity clock resets: she trained today, partially.
    expect(applied.state.lastSessionAtIso).toBe('2026-07-16T10:20:00.000Z');
    // But no session was completed and no check-in answered: the A/B and
    // balanced-focus alternation and the next bonus-offer input stay put.
    expect(applied.state.completedSessionCount).toBe(4);
    expect(applied.state.lastSessionEffort).toBe('lots');
  });

  it('a pain halt in a partially-left session still regresses that ladder', () => {
    const state = onboardedState();
    state.ladders.squat = freshPatternLadderState('squat', 3);
    state.ladders.squat = { ...state.ladders.squat, lastPainFreeLevel: 2 };
    const plan = generateProgrammeSession({ state, template: 'A', preset: 'standard' });
    const squat = plan.main.find((exercise) => exercise.pattern === 'squat')!;
    const applied = applyProgrammeSessionResults(
      state,
      plan,
      {
        outcomes: [
          {
            pattern: 'squat',
            levelPerformed: squat.level,
            sets: [{ achieved: 4 }],
            effort: null,
            painFlag: true,
            performedAtIso: '2026-07-16T10:20:00.000Z',
          },
        ],
        prepCompleted: true,
        finisherCompleted: false,
        completedAtIso: '2026-07-16T10:20:00.000Z',
      },
      { credit: 'partial' }
    );
    expect(applied.state.ladders.squat.currentLevel).toBeLessThan(3);
  });
});
