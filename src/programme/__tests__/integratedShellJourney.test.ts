/**
 * Integrated-shell journey simulation (promotion integration Phase 5): whole
 * journeys driven through the SAME pure functions the v2 app shell calls, in
 * the order it calls them — onboarding flow machine → completion route →
 * today view model → session generation → results → post-session moment loop
 * → check-up offers and the routine cadence. Both shell bugs found during
 * the integration (the dropped 'now' assessment intent; the deferred
 * re-offer dismissal loop) were invisible to unit tests — this suite pins
 * the integrated behavior end to end, including loop termination.
 */

import {
  acknowledgeOnboardingStep,
  applyInactivityRegressionIfDue,
  applyProgrammeSessionResults,
  checkupOfferFor,
  completeOnboarding,
  currentOnboardingStep,
  generateProgrammeSession,
  initialOnboardingFlowState,
  markFirstSessionStarted,
  markSurfaceShown,
  nextProgrammeSessionInput,
  onboardingCompletionRoute,
  postSessionSurface,
  programmeLevelRows,
  programmeTodayViewModel,
  recordGatewayDemoWatched,
  recordGatewaySelfConfirmation,
  recordOnboardingAnswer,
  type OnboardingAnswerValue,
  type ProgrammePattern,
  type PromotionDecision,
} from '..';
import { applyAssessmentPlacement, type ProgrammeOnboardingFlowState } from '../onboarding/flow';
import type { OnboardingStepId } from '../onboarding/content';
import { PROGRAMME_PATTERNS, type EffortAnswer, type ProgrammeState } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;
const START = Date.parse('2026-07-07T10:00:00.000Z');
const dayIso = (day: number) => new Date(START + day * DAY_MS).toISOString();

const BASE_ANSWERS: OnboardingAnswerValue[] = [
  { step: 'a1_life_goal', value: 'independence' },
  { step: 'a2_menopause_journey', value: 'postmenopausal' },
  { step: 'a3_activity', value: 'lightly_active' },
  { step: 'consent_health', value: 'agree' },
  { step: 'b1_heart', value: 'no' },
  { step: 'b3_joints', value: [] },
  { step: 'b4_pelvic', value: 'never' },
  { step: 'b5_balance', value: 'no' },
  { step: 'c1_stairs', value: 'yes' },
  { step: 'c2_quiet', value: 'no' },
  { step: 'd1_days', value: ['mon', 'wed', 'fri'] },
];

function runOnboarding(extra: readonly OnboardingAnswerValue[], completedAtIso: string) {
  let flow: ProgrammeOnboardingFlowState = initialOnboardingFlowState();
  const byStep = new Map([...BASE_ANSWERS, ...extra].map((a) => [a.step, a]));
  for (let guard = 0; guard < 40; guard++) {
    const step = currentOnboardingStep(flow);
    if (step === 'complete') return completeOnboarding(flow, { completedAtIso });
    const answer = byStep.get(step as OnboardingAnswerValue['step']);
    flow = answer
      ? recordOnboardingAnswer(flow, answer)
      : acknowledgeOnboardingStep(flow, step as OnboardingStepId);
  }
  throw new Error('onboarding did not terminate');
}

/** One session exactly as the shell runs it: input rule → generate → start
 * (activation) → results with effort. */
function runSession(state: ProgrammeState, nowIso: string, effort: EffortAnswer) {
  const input = nextProgrammeSessionInput(state);
  // The today view model must always preview the same session the start
  // button generates — divergence here is a shell bug by definition.
  const vm = programmeTodayViewModel(state, nowIso);
  expect(vm.sessionPreview.template).toBe(input.template);
  expect(vm.sessionPreview.preset).toBe(input.preset);
  const regression = applyInactivityRegressionIfDue(state, nowIso);
  const current = regression.state;
  const plan = generateProgrammeSession({ state: current, ...nextProgrammeSessionInput(current) });
  const started = markFirstSessionStarted(current);
  const applied = applyProgrammeSessionResults(started, plan, {
    outcomes: plan.main.map((exercise) => ({
      pattern: exercise.pattern,
      levelPerformed: exercise.level,
      sets: Array.from({ length: exercise.sets }, () => ({ achieved: exercise.repTargetPerSet })),
      effort,
      painFlag: false,
      performedAtIso: nowIso,
    })),
    prepCompleted: true,
    finisherCompleted: true,
    completedAtIso: nowIso,
    sessionEffort: effort,
  });
  return { state: applied.state, decisions: applied.decisions, plan };
}

type MomentBehavior = 'accept_reoffer' | 'dismiss';

interface MomentOutcome {
  state: ProgrammeState;
  surfacesSeen: string[];
  checkupAccepted: boolean;
}

/** The shell's post-session moment loop, driven to termination. Mirrors the
 * button handlers: gateway demo+confirm then Later (clears decisions);
 * re-offer accept runs the check-up; re-offer dismissal leaves the loop
 * (deferred) or marks the once-only card (skipped warm). */
function resolvePostSession(
  state: ProgrammeState,
  decisions: Partial<Record<ProgrammePattern, PromotionDecision>>,
  nowIso: string,
  behavior: MomentBehavior
): MomentOutcome {
  let current = state;
  let currentDecisions = decisions;
  const surfacesSeen: string[] = [];
  let checkupAccepted = false;
  for (let guard = 0; guard < 10; guard++) {
    const surface = postSessionSurface(current, currentDecisions, nowIso);
    surfacesSeen.push(surface.kind);
    if (surface.kind === 'gateway_teach') {
      let ladder = current.ladders[surface.pattern];
      ladder = recordGatewayDemoWatched(ladder, surface.toLevel);
      ladder = recordGatewaySelfConfirmation(ladder, surface.toLevel);
      current = { ...current, ladders: { ...current.ladders, [surface.pattern]: ladder } };
      currentDecisions = {}; // the shell's 'Later' after completing both steps
      continue;
    }
    if (surface.kind === 'deferred_reoffer') {
      if (behavior === 'accept_reoffer') {
        current = applyAssessmentPlacement(
          current,
          { t3: { reps: 16, handsUsed: false }, t1: { worseSideSeconds: 24 } },
          { deferred: current.completedSessionCount > 0, completedAtIso: nowIso }
        );
        checkupAccepted = true;
        return { state: current, surfacesSeen, checkupAccepted };
      }
      // Dismissal LEAVES the loop (the fixed shell behavior — the policy is
      // pure over state, so looping here would re-render forever).
      return { state: current, surfacesSeen, checkupAccepted };
    }
    if (surface.kind === 'skipped_warm_reoffer') {
      if (behavior === 'accept_reoffer') {
        current = applyAssessmentPlacement(
          current,
          { t3: { reps: 16, handsUsed: false }, t1: { worseSideSeconds: 24 } },
          { deferred: current.completedSessionCount > 0, completedAtIso: nowIso }
        );
        checkupAccepted = true;
        return { state: current, surfacesSeen, checkupAccepted };
      }
      current = markSurfaceShown(current, 'skipped_warm_reoffer_card');
      continue;
    }
    return { state: current, surfacesSeen, checkupAccepted }; // session_logged
  }
  throw new Error(`post-session moment loop did not terminate: ${surfacesSeen.join(' → ')}`);
}

describe("the 'now' assessment path (fixed intent contract)", () => {
  it('routes Check-up #0 first, chains the first session, and starts the routine cadence', () => {
    const completion = runOnboarding(
      [{ step: 'assessment_offer', value: 'now' }],
      dayIso(0)
    );
    const route = onboardingCompletionRoute(completion, 'start_first_session');
    expect(route).toEqual({ assessmentFirst: true, startFirstSession: true });

    // Check-up #0 completes: 'now' path replaces placement (nothing trained).
    let state = completion.programmeState;
    expect(state.profile.assessmentStatus).toBeNull();
    state = applyAssessmentPlacement(
      state,
      { t3: { reps: 18, handsUsed: false }, t1: { worseSideSeconds: 28 } },
      { deferred: state.completedSessionCount > 0, completedAtIso: dayIso(0) }
    );
    expect(state.profile.assessmentStatus).toBe('done');

    // The chained first session (the CTA's promise) runs on exact placement.
    const vm = programmeTodayViewModel(state, dayIso(0));
    expect(vm.state).toBe('first_session_ready');
    expect(vm.checkupOffer).toBeNull();
    ({ state } = runSession(state, dayIso(0), 'a_few'));
    expect(state.profile.firstSessionStarted).toBe(true);
    expect(programmeTodayViewModel(state, dayIso(2)).state).toBe('session_ready');

    // Routine cadence: nothing offered until day 28, the persistent card after.
    expect(checkupOfferFor(state, dayIso(20))).toBeNull();
    expect(checkupOfferFor(state, dayIso(29))?.kind).toBe('routine_due');

    // A routine check-up restarts the clock and is upward-only post-training.
    const levelsBefore = PROGRAMME_PATTERNS.map((p) => state.ladders[p].currentLevel);
    state = applyAssessmentPlacement(
      state,
      { t3: { reps: 20, handsUsed: false }, t1: { worseSideSeconds: 30 } },
      { deferred: state.completedSessionCount > 0, completedAtIso: dayIso(29) }
    );
    PROGRAMME_PATTERNS.forEach((p, i) => {
      expect(state.ladders[p].currentLevel).toBeGreaterThanOrEqual(levelsBefore[i]);
    });
    expect(checkupOfferFor(state, dayIso(30))).toBeNull();
    expect(checkupOfferFor(state, dayIso(58))?.kind).toBe('routine_due');
  });
});

describe('the deferred path', () => {
  function deferredAfterFirstSession() {
    const completion = runOnboarding(
      [{ step: 'assessment_offer', value: 'after_first_workout' }],
      dayIso(0)
    );
    expect(onboardingCompletionRoute(completion, 'schedule')).toEqual({
      assessmentFirst: false,
      startFirstSession: false,
    });
    let state = completion.programmeState;
    expect(state.profile.assessmentStatus).toBe('deferred');
    // Nothing on home before the first session (re-offer waits for one).
    expect(checkupOfferFor(state, dayIso(0))).toBeNull();
    const { state: after, decisions } = runSession(state, dayIso(0), 'a_few');
    return { state: after, decisions };
  }

  it('accepting the post-session re-offer completes placement and clears every offer', () => {
    const { state, decisions } = deferredAfterFirstSession();
    const outcome = resolvePostSession(state, decisions, dayIso(0), 'accept_reoffer');
    expect(outcome.surfacesSeen).toContain('deferred_reoffer');
    expect(outcome.checkupAccepted).toBe(true);
    expect(outcome.state.profile.assessmentStatus).toBe('done');
    expect(checkupOfferFor(outcome.state, dayIso(1))).toBeNull();
  });

  it('dismissing the re-offer terminates the moment loop and home keeps the standing entry', () => {
    const { state, decisions } = deferredAfterFirstSession();
    const outcome = resolvePostSession(state, decisions, dayIso(0), 'dismiss');
    expect(outcome.surfacesSeen).toContain('deferred_reoffer');
    expect(outcome.checkupAccepted).toBe(false);
    // The permanent way back (recorded rule): the home movement-check entry.
    expect(checkupOfferFor(outcome.state, dayIso(1))?.kind).toBe('standing_entry');
    // And it persists across further sessions and dismissals.
    const again = runSession(outcome.state, dayIso(2), 'a_few');
    const dismissedAgain = resolvePostSession(again.state, again.decisions, dayIso(2), 'dismiss');
    expect(checkupOfferFor(dismissedAgain.state, dayIso(3))?.kind).toBe('standing_entry');
  });
});

describe('the skipped path', () => {
  it('warm re-offer renders exactly once; the standing entry is permanent', () => {
    const completion = runOnboarding([{ step: 'assessment_offer', value: 'skip' }], dayIso(0));
    let state = completion.programmeState;
    expect(state.profile.assessmentStatus).toBe('skipped');

    let decisions: Partial<Record<ProgrammePattern, PromotionDecision>>;
    ({ state, decisions } = runSession(state, dayIso(0), 'a_few'));
    ({ state, decisions } = runSession(state, dayIso(2), 'a_few'));
    // Two completed sessions → the once-only warm card appears...
    const first = resolvePostSession(state, decisions, dayIso(2), 'dismiss');
    expect(first.surfacesSeen).toContain('skipped_warm_reoffer');
    // ...and ends on the logged card in the same loop (dismissal marks it).
    expect(first.surfacesSeen[first.surfacesSeen.length - 1]).toBe('session_logged');

    // Never again — but home keeps the permanent entry.
    const third = runSession(first.state, dayIso(4), 'a_few');
    const after = resolvePostSession(third.state, third.decisions, dayIso(4), 'dismiss');
    expect(after.surfacesSeen).not.toContain('skipped_warm_reoffer');
    expect(checkupOfferFor(after.state, dayIso(5))?.kind).toBe('standing_entry');
  });
});

describe('the B1 gentle-start journey', () => {
  it('no check-up surface exists anywhere across four training weeks', () => {
    const completion = runOnboarding([{ step: 'b1_heart', value: 'yes' }], dayIso(0));
    expect(
      onboardingCompletionRoute(completion, 'start_first_session').assessmentFirst
    ).toBe(false);
    let state = completion.programmeState;
    expect(state.profile.assessmentStatus).toBe('bypassed_b1');

    for (let session = 0; session < 12; session++) {
      const nowIso = dayIso(Math.floor(session / 3) * 7 + (session % 3) * 2);
      expect(checkupOfferFor(state, nowIso)).toBeNull();
      const run = runSession(state, nowIso, 'a_few');
      const outcome = resolvePostSession(run.state, run.decisions, nowIso, 'dismiss');
      // Conformance Q1: no assessment surface until gp_confirmed.
      expect(outcome.surfacesSeen).not.toContain('deferred_reoffer');
      expect(outcome.surfacesSeen).not.toContain('skipped_warm_reoffer');
      state = outcome.state;
    }
    expect(checkupOfferFor(state, dayIso(60))).toBeNull();
  });
});

describe('the break-and-return journey', () => {
  it('a 20-day gap reads gentle, previews eased levels, and eases exactly once', () => {
    const completion = runOnboarding(
      [{ step: 'assessment_offer', value: 'now' }],
      dayIso(0)
    );
    let state = applyAssessmentPlacement(
      completion.programmeState,
      { t3: { reps: 20, handsUsed: false }, t1: { worseSideSeconds: 30 } },
      { deferred: false, completedAtIso: dayIso(0) }
    );
    for (const day of [0, 2, 4]) {
      const run = runSession(state, dayIso(day), 'lots');
      state = resolvePostSession(run.state, run.decisions, dayIso(day), 'dismiss').state;
    }

    const back = dayIso(4 + 20);
    const vm = programmeTodayViewModel(state, back);
    expect(vm.state).toBe('returning_after_break');
    expect(vm.easedAfterBreak).toBe(true);
    // Level rows preview the post-easing levels — one down from stored.
    const easedRows = programmeLevelRows(applyInactivityRegressionIfDue(state, back).state);
    for (const row of easedRows) {
      expect(row.currentLevel).toBe(Math.max(1, state.ladders[row.pattern].currentLevel - 1));
    }

    // The session itself persists the easing exactly once; the next day is a
    // normal session day again.
    const run = runSession(state, back, 'a_few');
    state = resolvePostSession(run.state, run.decisions, back, 'dismiss').state;
    expect(programmeTodayViewModel(state, dayIso(4 + 22)).state).toBe('session_ready');
    expect(applyInactivityRegressionIfDue(state, dayIso(4 + 22)).applied).toBe(false);
  });
});
