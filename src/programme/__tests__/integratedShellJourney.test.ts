/**
 * Integrated-shell journey simulation (promotion integration Phase 5): whole
 * journeys driven through the SAME pure functions the v2 app shell calls, in
 * the order it calls them — onboarding flow machine → completion route →
 * today view model → session generation → results → optional technique gateway
 * → Home-owned check-up offers and the routine cadence. This suite pins the
 * integrated behavior end to end, including the direct post-session return.
 */

import {
  acknowledgeOnboardingStep,
  applyInactivityRegressionIfDue,
  applyProgrammeSessionResults,
  baselineCheckupRequiredBeforeTraining,
  checkupOfferFor,
  completeOnboarding,
  currentOnboardingStep,
  generateProgrammeSession,
  initialOnboardingFlowState,
  markFirstSessionStarted,
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
  { step: 'b1_heart', value: 'no' },
  { step: 'b3_joints', value: [] },
  { step: 'assessment_offer', value: 'skip' },
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

interface MomentOutcome {
  state: ProgrammeState;
  surfacesSeen: string[];
}

/** The only post-session interruption is a technique gateway. */
function resolvePostSession(
  state: ProgrammeState,
  decisions: Partial<Record<ProgrammePattern, PromotionDecision>>
): MomentOutcome {
  const surface = postSessionSurface(state, decisions);
  if (!surface) return { state, surfacesSeen: [] };
  let ladder = state.ladders[surface.pattern];
  ladder = recordGatewayDemoWatched(ladder, surface.toLevel);
  ladder = recordGatewaySelfConfirmation(ladder, surface.toLevel);
  return {
    state: { ...state, ladders: { ...state.ladders, [surface.pattern]: ladder } },
    surfacesSeen: [surface.kind],
  };
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

describe('the eligible baseline gate', () => {
  it.each(['after_first_workout', 'skip'] as const)(
    'routes the retained legacy %s choice to the baseline before training',
    (choice) => {
      const completion = runOnboarding(
        [{ step: 'assessment_offer', value: choice }],
        dayIso(0)
      );
      expect(onboardingCompletionRoute(completion, 'start_first_session')).toEqual({
        assessmentFirst: true,
        startFirstSession: true,
      });
      expect(completion.programmeState.profile.assessmentStatus).toBeNull();
      expect(baselineCheckupRequiredBeforeTraining(completion.programmeState)).toBe(true);

      const assessed = applyAssessmentPlacement(
        completion.programmeState,
        { t3: { reps: 16, handsUsed: false }, t1: { worseSideSeconds: 24 } },
        { deferred: false, completedAtIso: dayIso(0) }
      );
      expect(assessed.profile.assessmentStatus).toBe('done');
      expect(baselineCheckupRequiredBeforeTraining(assessed)).toBe(false);
    }
  );
});

describe('the B1 safety-confirmation journey', () => {
  it('still routes the accepted starting check-up before any programme session', () => {
    const completion = runOnboarding([{ step: 'b1_heart', value: 'yes' }], dayIso(0));
    expect(
      onboardingCompletionRoute(completion, 'start_first_session').assessmentFirst
    ).toBe(true);
    expect(completion.programmeState.profile.gpConfirmed).toBe(true);
    expect(completion.programmeState.profile.gentleStartActive).toBe(false);
    expect(completion.programmeState.profile.assessmentStatus).toBeNull();
    expect(baselineCheckupRequiredBeforeTraining(completion.programmeState)).toBe(true);

    const assessed = applyAssessmentPlacement(
      completion.programmeState,
      { t3: { reps: 12, handsUsed: false }, t1: { worseSideSeconds: 18 } },
      { deferred: false, completedAtIso: dayIso(0) }
    );
    expect(programmeTodayViewModel(assessed, dayIso(0)).state).toBe(
      'first_session_ready'
    );
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
      state = resolvePostSession(run.state, run.decisions).state;
    }

    const back = dayIso(4 + 20);
    const vm = programmeTodayViewModel(state, back);
    expect(vm.state).toBe('returning_after_break');
    // Level rows preview the post-easing levels — one down from stored.
    const easedRows = programmeLevelRows(applyInactivityRegressionIfDue(state, back).state);
    for (const row of easedRows) {
      expect(row.currentLevel).toBe(Math.max(1, state.ladders[row.pattern].currentLevel - 1));
    }

    // The session itself persists the easing exactly once; the next day is a
    // normal session day again.
    const run = runSession(state, back, 'a_few');
    state = resolvePostSession(run.state, run.decisions).state;
    expect(programmeTodayViewModel(state, dayIso(4 + 22)).state).toBe('session_ready');
    expect(applyInactivityRegressionIfDue(state, dayIso(4 + 22)).applied).toBe(false);
  });
});
