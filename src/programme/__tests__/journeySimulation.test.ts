/**
 * Longitudinal persona simulation (founder-directed): whole-journey assertions
 * over 8–12 simulated weeks, because both real bugs in this build (rep-target
 * crawl, trim-order coverage hole) were interaction bugs invisible to unit
 * tests. Personas run generated sessions with plausible effort answers and
 * missed weeks; the harness asserts journey-level invariants and surfaces
 * stalls as findings (KNOWN_STALLS documents accepted ones — anything new
 * fails loudly and must be reported, not quietly fixed).
 */

import {
  applyInactivityRegressionIfDue,
  applyProgrammeSessionResults,
  freshPatternLadderState,
  generateProgrammeSession,
  maxProgrammeLevel,
  recordGatewayDemoWatched,
  recordGatewaySelfConfirmation,
  SESSION_PRESET_TARGET_MINUTES,
  type ProgrammeSessionPlan,
  type SessionDurationPreset,
} from '..';
import { applyAssessmentPlacement } from '../onboarding/flow';
import { defaultProgrammeState } from '../serialize';
import { PROGRAMME_PATTERNS, type EffortAnswer, type ProgrammePattern, type ProgrammeState } from '../types';

const FLEXION_BANNED =
  /crunch|sit[-_ ]?ups?\b|curl[-_ ]?up|jack[-_ ]?knife|v[-_ ]sit|v[-_ ]up|russian[-_ ]twist|toe[-_ ]touch/i;
const JARGON_BANNED =
  /\brdl\b|\brfess\b|eccentric|concentric|isometric|romanian|bulgarian|unilateral|bilateral|scapular|\bprone\b|pallof|good morning|\brir\b/i;

interface Persona {
  name: string;
  state: ProgrammeState;
  effort: EffortAnswer;
  preset: SessionDurationPreset;
  weeks: number;
  /** 1-based week numbers with no sessions at all. */
  missedWeeks: readonly number[];
  /** Deferred persona completes the measured check after this session #. */
  assessmentAfterSession?: number;
}

interface JourneyLog {
  plans: ProgrammeSessionPlan[];
  levelHistory: Record<ProgrammePattern, number[]>;
  promotionsAtSession: Record<ProgrammePattern, number[]>;
  /** Longest run of counted exposures at one level without a promotion. */
  maxNonPromotingExposures: Record<ProgrammePattern, number>;
  inactivityRegressions: number;
  sessionsRun: number;
}

function onboarded(profileOverrides: Partial<ProgrammeState['profile']>, placement?: Partial<Record<ProgrammePattern, number>>): ProgrammeState {
  const state = defaultProgrammeState();
  state.profile = { ...state.profile, consentHealthData: true, hasStairs: true, ...profileOverrides };
  state.onboardingCompletedAtIso = '2026-07-06T09:00:00.000Z';
  if (placement) {
    for (const pattern of PROGRAMME_PATTERNS) {
      if (placement[pattern]) state.ladders[pattern] = freshPatternLadderState(pattern, placement[pattern] as number);
    }
  }
  return state;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const START = Date.parse('2026-07-06T10:00:00.000Z');

function runJourney(persona: Persona): { state: ProgrammeState; log: JourneyLog } {
  let state = persona.state;
  const log: JourneyLog = {
    plans: [],
    levelHistory: Object.fromEntries(
      PROGRAMME_PATTERNS.map((p) => [p, [state.ladders[p].currentLevel]])
    ) as Record<ProgrammePattern, number[]>,
    promotionsAtSession: Object.fromEntries(
      PROGRAMME_PATTERNS.map((p) => [p, [] as number[]])
    ) as unknown as Record<ProgrammePattern, number[]>,
    maxNonPromotingExposures: Object.fromEntries(
      PROGRAMME_PATTERNS.map((p) => [p, 0])
    ) as unknown as Record<ProgrammePattern, number>,
    inactivityRegressions: 0,
    sessionsRun: 0,
  };
  let sessionNumber = 0;
  const exposureStreak = Object.fromEntries(
    PROGRAMME_PATTERNS.map((p) => [p, 0])
  ) as unknown as Record<ProgrammePattern, number>;

  for (let week = 1; week <= persona.weeks; week++) {
    if (persona.missedWeeks.includes(week)) continue;
    for (let dayIndex of [0, 2, 4]) {
      const nowIso = new Date(START + ((week - 1) * 7 + dayIndex) * DAY_MS).toISOString();
      const regression = applyInactivityRegressionIfDue(state, nowIso);
      if (regression.applied) log.inactivityRegressions++;
      state = regression.state;

      const before = Object.fromEntries(
        PROGRAMME_PATTERNS.map((p) => [p, state.ladders[p].currentLevel])
      ) as Record<ProgrammePattern, number>;

      const plan = generateProgrammeSession({
        state,
        template: state.completedSessionCount % 2 === 0 ? 'A' : 'B',
        preset: persona.preset,
        lastSessionEffort: sessionNumber > 0 ? persona.effort : null,
      });
      log.plans.push(plan);

      const applied = applyProgrammeSessionResults(state, plan, {
        outcomes: plan.main.map((exercise) => ({
          pattern: exercise.pattern,
          levelPerformed: exercise.level,
          sets: Array.from({ length: exercise.sets }, () => ({ achieved: exercise.repTargetPerSet })),
          effort: persona.effort,
          painFlag: false,
          performedAtIso: nowIso,
        })),
        prepCompleted: true,
        finisherCompleted: true,
        completedAtIso: nowIso,
      });
      state = applied.state;
      sessionNumber++;
      log.sessionsRun = sessionNumber;

      // Exposure-cadence stall tracking (finding 3 ruling): an exposure is a
      // session that actually featured this ladder's CURRENT exercise —
      // reduced-frequency patterns (the §11 hinge split) are judged on their
      // own cadence, matching promotion's exposure-based semantics.
      for (const outcome of plan.main) {
        const pattern = outcome.pattern;
        if (before[pattern] >= maxProgrammeLevel(pattern)) {
          exposureStreak[pattern] = 0;
          continue;
        }
        if (outcome.level !== before[pattern]) continue; // not a counted exposure
        if (applied.decisions[pattern]?.kind === 'promote') {
          exposureStreak[pattern] = 0;
        } else {
          exposureStreak[pattern]++;
          log.maxNonPromotingExposures[pattern] = Math.max(
            log.maxNonPromotingExposures[pattern],
            exposureStreak[pattern]
          );
        }
      }

      // Compliant personas complete teach-only gateways when invited.
      for (const [pattern, decision] of Object.entries(applied.decisions) as [
        ProgrammePattern,
        (typeof applied.decisions)[ProgrammePattern],
      ][]) {
        if (decision?.kind === 'promotion_locked' && decision.reason === 'gateway_incomplete') {
          let ladder = state.ladders[pattern];
          ladder = recordGatewayDemoWatched(ladder, decision.toLevel);
          ladder = recordGatewaySelfConfirmation(ladder, decision.toLevel);
          state = { ...state, ladders: { ...state.ladders, [pattern]: ladder } };
        }
        if (decision?.kind === 'promote') log.promotionsAtSession[pattern].push(sessionNumber);
      }

      for (const pattern of PROGRAMME_PATTERNS) {
        const level = state.ladders[pattern].currentLevel;
        log.levelHistory[pattern].push(level);
        // Single-step invariant: sessions never move a ladder more than one.
        expect(Math.abs(level - before[pattern])).toBeLessThanOrEqual(1);
        // Any level change starts a fresh exercise: reset its exposure streak.
        if (level !== before[pattern]) exposureStreak[pattern] = 0;
      }

      if (persona.assessmentAfterSession === sessionNumber) {
        const beforeAssessment = { ...before };
        for (const pattern of PROGRAMME_PATTERNS) beforeAssessment[pattern] = state.ladders[pattern].currentLevel;
        state = applyAssessmentPlacement(
          state,
          { t3: { reps: 18, handsUsed: false }, t1: { worseSideSeconds: 28 } },
          { deferred: true }
        );
        // Deferred re-placement is upward-only (conformance Q2).
        for (const pattern of PROGRAMME_PATTERNS) {
          expect(state.ladders[pattern].currentLevel).toBeGreaterThanOrEqual(beforeAssessment[pattern]);
        }
      }
    }
  }
  return { state, log };
}

function assertPlanInvariants(persona: Persona, log: JourneyLog) {
  for (const plan of log.plans) {
    expect(plan.estimatedMinutes).toBeLessThanOrEqual(SESSION_PRESET_TARGET_MINUTES[persona.preset]);
    for (const exercise of plan.main) {
      expect(exercise.displayName).not.toMatch(FLEXION_BANNED);
      expect(exercise.displayName).not.toMatch(JARGON_BANNED);
      expect(exercise.exerciseId).not.toMatch(FLEXION_BANNED);
      expect(exercise.sets).toBe(2);
    }
    for (const item of plan.finisher) {
      expect(item.displayName).not.toMatch(FLEXION_BANNED);
    }
  }
}

/**
 * FINDINGS REGISTER — accepted stalls, each one reported to the founder
 * (docs/decisions.md). Anything NOT listed here fails the suite so new
 * journey-level surprises surface loudly instead of being absorbed.
 *
 * 1. RULED (2026-07-06): advancement is scheme-aware — seconds schemes
 *    advance +5 per qualifying 'a_few' session (reps keep +2; 'lots' → top,
 *    'none' → hold for both). Plank cadence now ≈ 5 climbing sessions to the
 *    range top, promotion on the next (the standard 2-consecutive-top rule);
 *    pinned in session.test.ts.
 * 2. Working-as-designed (acknowledged): 'none'-answering personas hold
 *    level indefinitely — §12 has no promotion path on 'none' below
 *    top-of-range; hold+reduce protects them instead. Listed so the stall
 *    detector stays honest.
 * 3. RULED (2026-07-06): training behaviour ACCEPTED — the §11 hinge split
 *    is deliberate (bridge family keeps training on A days; posterior chain
 *    works twice weekly; 'lots' users unaffected). The METRIC moved from
 *    calendar cadence to EXPOSURE cadence: flag when a compliant persona
 *    sees no promotion within 6 counted exposures of the current exercise —
 *    matching promotion's own exposure-based semantics and staying honest
 *    for any future reduced-frequency pattern.
 */
const KNOWN_STALLS: Record<string, readonly ProgrammePattern[]> = {
  'deconditioned skipper': PROGRAMME_PATTERNS, // finding 2 — 'none' never promotes
};

function assertNoUnexpectedStalls(persona: Persona, log: JourneyLog) {
  // Exposure cadence (finding 3 ruling): >6 counted exposures of the current
  // exercise without a promotion = stall. Exposures reset on any level change.
  const stallWindow = 6;
  const allowed = KNOWN_STALLS[persona.name] ?? [];
  for (const pattern of PROGRAMME_PATTERNS) {
    if (allowed.includes(pattern)) continue;
    const worst = log.maxNonPromotingExposures[pattern];
    expect({
      persona: persona.name,
      pattern,
      worstExposureGap: worst,
      stalled: worst > stallWindow,
    }).toEqual({ persona: persona.name, pattern, worstExposureGap: worst, stalled: false });
  }
}

describe('longitudinal persona journeys', () => {
  it('fit deferrer (lots, deferred assessment): promotes fast everywhere, upward-only re-placement', () => {
    const persona: Persona = {
      name: 'fit deferrer (lots)',
      state: onboarded({ activityLevel: 'very_active', assessmentStatus: 'deferred' }, {
        squat: 2, push: 2, hinge: 2, pull: 2, core: 3,
      }),
      effort: 'lots',
      preset: 'standard',
      weeks: 10,
      missedWeeks: [],
      assessmentAfterSession: 1,
    };
    const { state, log } = runJourney(persona);
    assertPlanInvariants(persona, log);
    assertNoUnexpectedStalls(persona, log);
    // A consistently-"lots" user makes real progress in 10 weeks.
    expect(state.ladders.squat.currentLevel).toBeGreaterThanOrEqual(6);
    expect(state.ladders.push.currentLevel).toBeGreaterThanOrEqual(5);
    // Gateways were passed teach-only, never skipped: squat gateway levels
    // required demo + confirmation before entry.
    if (state.ladders.squat.currentLevel >= 8) {
      expect(state.ladders.squat.gatewayProgress[8]?.demoWatched).toBe(true);
      expect(state.ladders.squat.gatewayProgress[8]?.selfConfirmed).toBe(true);
    }
  });

  it('deconditioned skipper (none, missed weeks): protected, regressed once per gap, never promoted on none', () => {
    const persona: Persona = {
      name: 'deconditioned skipper',
      state: onboarded({ activityLevel: 'very_inactive', assessmentStatus: 'skipped' }),
      effort: 'none',
      preset: 'standard',
      weeks: 10,
      missedWeeks: [4, 5], // a 14+-day gap
    };
    const { state, log } = runJourney(persona);
    assertPlanInvariants(persona, log);
    assertNoUnexpectedStalls(persona, log);
    expect(log.inactivityRegressions).toBe(1); // once per gap, not repeatedly
    for (const pattern of PROGRAMME_PATTERNS) {
      expect(state.ladders[pattern].currentLevel).toBe(1); // floored, never promoted
    }
  });

  it('gentle start user (B1): all L1 start, no bonus sets ever, no assessment surfaces', () => {
    const persona: Persona = {
      name: 'gentle start (a_few)',
      state: onboarded({
        gentleStartActive: true,
        assessmentStatus: 'bypassed_b1',
        activityLevel: 'lightly_active',
      }),
      effort: 'a_few',
      preset: 'standard',
      weeks: 8,
      missedWeeks: [],
    };
    const { log } = runJourney(persona);
    assertPlanInvariants(persona, log);
    assertNoUnexpectedStalls(persona, log);
    for (const plan of log.plans) {
      expect(plan.bonusSetEligible).toEqual([]);
      expect(plan.routing.softerCadence).toBe(true);
    }
  });

  it('quiet-mode no-stairs flat dweller: no stomps, no stairs exercises, ever', () => {
    const persona: Persona = {
      name: 'quiet-mode flat dweller (a_few)',
      state: onboarded({ quietMode: true, hasStairs: false, activityLevel: 'moderately_active' }),
      effort: 'a_few',
      preset: 'standard',
      weeks: 12,
      missedWeeks: [],
    };
    const { log } = runJourney(persona);
    assertPlanInvariants(persona, log);
    assertNoUnexpectedStalls(persona, log);
    for (const plan of log.plans) {
      expect(plan.finisher.map((i) => i.id)).not.toContain('finisher.moderate_stomps');
      for (const exercise of plan.main) {
        expect(exercise.exerciseId).not.toMatch(/step_up$|stair/);
      }
    }
  });

  it('balance-limited user: every unilateral exercise cues support, all journey long', () => {
    const persona: Persona = {
      name: 'balance-limited (a_few)',
      state: onboarded({ balanceSupportDefault: true, activityLevel: 'moderately_active' }),
      effort: 'a_few',
      preset: 'standard',
      weeks: 10,
      missedWeeks: [],
    };
    const { log } = runJourney(persona);
    assertPlanInvariants(persona, log);
    assertNoUnexpectedStalls(persona, log);
    for (const plan of log.plans) {
      for (const exercise of plan.main) {
        if (exercise.scheme.kind === 'reps_per_side' || exercise.scheme.kind === 'seconds_per_side') {
          expect(exercise.useSupportVariant).toBe(true);
        }
      }
    }
  });

  it('habitual 10-minute user: pattern coverage holds across the A/B alternation', () => {
    const persona: Persona = {
      name: 'habitual starter (a_few)',
      state: onboarded({ activityLevel: 'moderately_active' }),
      effort: 'a_few',
      preset: 'starter',
      weeks: 8,
      missedWeeks: [],
    };
    const { log } = runJourney(persona);
    assertPlanInvariants(persona, log);
    // Every consecutive A/B pair covers all four strength patterns.
    for (let i = 0; i + 1 < log.plans.length; i += 2) {
      const covered = new Set([
        ...log.plans[i].main.map((e) => e.pattern),
        ...log.plans[i + 1].main.map((e) => e.pattern),
      ]);
      for (const pattern of ['squat', 'push', 'hinge', 'pull'] as const) {
        expect({ pair: i, pattern, covered: covered.has(pattern) }).toEqual({
          pair: i,
          pattern,
          covered: true,
        });
      }
    }
  });
});
