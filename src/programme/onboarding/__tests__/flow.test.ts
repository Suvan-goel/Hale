import {
  acknowledgeOnboardingStep,
  applyAssessmentPlacement,
  applyAssessmentSafety,
  applyJointComfortFlags,
  completeOnboarding,
  currentOnboardingStep,
  initialOnboardingFlowState,
  markFirstSessionStarted,
  recordOnboardingAnswer,
  SKIPPED,
  undoLastOnboardingStep,
  visibleOnboardingScreens,
  visibleOnboardingSteps,
  type OnboardingAnswerValue,
  type ProgrammeOnboardingFlowState,
} from '../flow';
import type { OnboardingStepId } from '../content';

/** Drives the pure flow with supplied answers, acknowledging messages as reached. */
function runFlow(
  answers: readonly OnboardingAnswerValue[],
  until?: OnboardingStepId
): ProgrammeOnboardingFlowState {
  let state = initialOnboardingFlowState();
  const byStep = new Map(answers.map((answer) => [answer.step, answer]));
  for (let guard = 0; guard < 20; guard++) {
    const step = currentOnboardingStep(state);
    if (step === 'complete' || step === until) return state;
    const answer = byStep.get(step as OnboardingAnswerValue['step']);
    state = answer
      ? recordOnboardingAnswer(state, answer)
      : acknowledgeOnboardingStep(state, step);
  }
  throw new Error('flow did not terminate');
}

const HAPPY_PATH: OnboardingAnswerValue[] = [
  { step: 'a1_life_goal', value: 'stairs_walks' },
  { step: 'b1_heart', value: 'no' },
  { step: 'b3_joints', value: [] },
  { step: 'assessment_offer', value: 'now' },
];

describe('four-surface sequence', () => {
  it('presents four normal surfaces, with a fifth only for the heart advisory', () => {
    expect(visibleOnboardingScreens(runFlow(HAPPY_PATH).answers)).toEqual([
      'welcome',
      'goal',
      'health_safety',
      'finish',
    ]);

    const heartFlag = HAPPY_PATH.map((answer) =>
      answer.step === 'b1_heart'
        ? ({ step: 'b1_heart', value: 'yes' } as const)
        : answer
    );
    expect(visibleOnboardingScreens(runFlow(heartFlag).answers)).toEqual([
      'welcome',
      'goal',
      'health_safety',
      'heart_advisory',
      'finish',
    ]);
  });

  it('asks only for a goal, two required health answers, and the start choice', () => {
    const state = runFlow(HAPPY_PATH);
    expect(currentOnboardingStep(state)).toBe('complete');
    expect(visibleOnboardingSteps(state.answers)).toEqual([
      'welcome',
      'a1_life_goal',
      'b1_heart',
      'b3_joints',
      'assessment_offer',
    ]);
  });

  it('has no branch that bypasses the two health questions', () => {
    const state = runFlow(
      [{ step: 'a1_life_goal', value: SKIPPED }],
      'b1_heart'
    );
    expect(visibleOnboardingSteps(state.answers) as readonly string[]).not.toContain(
      'consent_health'
    );
    expect(currentOnboardingStep(state)).toBe('b1_heart');
    expect(visibleOnboardingSteps(state.answers)).toContain('b3_joints');
  });

  it('B1 yes requires the safety-step confirmation before the Start surface', () => {
    const yesAnswers = HAPPY_PATH.map((answer) =>
      answer.step === 'b1_heart'
        ? ({ step: 'b1_heart', value: 'yes' } as const)
        : answer
    );
    const atAdvisory = runFlow(yesAnswers, 'b1_advisory');
    expect(currentOnboardingStep(atAdvisory)).toBe('b1_advisory');
    expect(completeOnboarding(atAdvisory).assessmentIntent).toBeNull();

    const confirmed = completeOnboarding(runFlow(yesAnswers));
    expect(confirmed.programmeState.profile.gpConfirmed).toBe(true);
    expect(confirmed.programmeState.profile.gentleStartActive).toBe(false);
    expect(confirmed.assessmentIntent).toBe('start_now');
  });
});

describe('completion uses explicit conservative defaults', () => {
  it('builds a consented profile at L1 with temporary support and no-stair defaults', () => {
    const completion = completeOnboarding(runFlow(HAPPY_PATH));
    const { profile, ladders } = completion.programmeState;

    expect(profile.consentHealthData).toBe(true);
    expect(profile.activityLevel).toBeNull();
    expect(profile.gentleStartActive).toBe(false);
    expect(profile.heartSafetyAnswer).toBe('no');
    expect(profile.pelvicRouting).toBe('none');
    expect(profile.jointFlags).toEqual([]);
    expect(profile.balanceSupportDefault).toBe(true);
    expect(profile.balanceSupportPreference).toBeNull();
    expect(profile.quietMode).toBe(true);
    expect(profile.hasStairs).toBeNull();
    expect(profile.chosenDays).toEqual([]);
    for (const ladder of Object.values(ladders)) expect(ladder.currentLevel).toBe(1);
    expect(profile.assessmentStatus).toBeNull();
    expect(completion.assessmentIntent).toBe('start_now');
    expect(completion.lifeGoalCategory).toBe('stairs_walks');
  });

  it('B1 yes plus the confirmed safety step still routes to the starting check-up', () => {
    const answers = HAPPY_PATH.map((answer) =>
      answer.step === 'b1_heart'
        ? ({ step: 'b1_heart', value: 'yes' } as const)
        : answer
    );
    const completion = completeOnboarding(runFlow(answers));
    expect(completion.programmeState.profile.gentleStartActive).toBe(false);
    expect(completion.programmeState.profile.heartSafetyAnswer).toBe('yes');
    expect(completion.programmeState.profile.gpConfirmed).toBe(true);
    expect(completion.programmeState.profile.assessmentStatus).toBeNull();
    expect(completion.assessmentIntent).toBe('start_now');
    for (const ladder of Object.values(completion.programmeState.ladders)) {
      expect(ladder.currentLevel).toBe(1);
    }
  });

  it('fails closed if completion is called before the required health answers exist', () => {
    const incomplete = runFlow(
      [
        { step: 'a1_life_goal', value: 'independence' },
        { step: 'b1_heart', value: 'yes' },
      ],
      'b3_joints'
    );
    const completion = completeOnboarding(incomplete);
    const { profile } = completion.programmeState;
    expect(profile.consentHealthData).toBe(false);
    expect(profile.gentleStartActive).toBe(false);
    expect(profile.heartSafetyAnswer).toBeNull();
    expect(profile.assessmentStatus).toBe('skipped');
    expect(profile.quietMode).toBe(true);
    expect(profile.balanceSupportDefault).toBe(true);
    expect(profile.pelvicRouting).toBe('none');
  });

  it('treats retained legacy start choices as baseline-first for eligible users', () => {
    for (const choice of ['after_first_workout', 'skip'] as const) {
      const answers = HAPPY_PATH.map((answer) =>
        answer.step === 'assessment_offer'
          ? ({ step: 'assessment_offer', value: choice } as const)
          : answer
      );
      const completion = completeOnboarding(runFlow(answers));
      expect(completion.programmeState.profile.assessmentStatus).toBeNull();
      expect(completion.assessmentIntent).toBe('start_now');
    }
  });
});

describe('assessment completion', () => {
  const onboarded = () => completeOnboarding(runFlow(HAPPY_PATH)).programmeState;

  it("the 'now' path applies measured placement while unmeasured patterns stay at L1", () => {
    const state = applyAssessmentPlacement(
      onboarded(),
      { t3: { reps: 18, handsUsed: false }, t1: { worseSideSeconds: 25 } },
      { deferred: false }
    );
    expect(state.ladders.squat.currentLevel).toBe(3);
    expect(state.ladders.push.currentLevel).toBe(1);
    expect(state.profile.assessmentStatus).toBe('done');
    expect(state.profile.balanceSupportDefault).toBe(false);
    expect(state.profile.balanceSupportRequired).toBe(false);
  });

  it('an onboarding joint answer constrains assessment placement', () => {
    const answers = HAPPY_PATH.map((answer) =>
      answer.step === 'b3_joints'
        ? ({ step: 'b3_joints', value: ['knee'] } as const)
        : answer
    );
    const state = applyAssessmentPlacement(
      completeOnboarding(runFlow(answers)).programmeState,
      { t3: { reps: 18, handsUsed: false } },
      { deferred: false }
    );
    expect(state.ladders.squat.currentLevel).toBe(1);
  });

  it('a later joint-comfort change immediately lowers affected ladders without promoting on removal', () => {
    const base = onboarded();
    base.ladders.squat = { ...base.ladders.squat, currentLevel: 3 };
    base.ladders.hinge = { ...base.ladders.hinge, currentLevel: 2 };
    const protectedState = applyJointComfortFlags(base, ['hip']);
    expect(protectedState.ladders.squat.currentLevel).toBe(1);
    expect(protectedState.ladders.hinge.currentLevel).toBe(1);
    expect(protectedState.profile.jointFlags).toEqual(['hip']);
    const removed = applyJointComfortFlags(protectedState, []);
    expect(removed.ladders.squat.currentLevel).toBe(1);
    expect(removed.ladders.hinge.currentLevel).toBe(1);
  });

  it('the deferred path never demotes a trained level', () => {
    const base = onboarded();
    base.ladders.squat = { ...base.ladders.squat, currentLevel: 3 };
    const state = applyAssessmentPlacement(
      base,
      { t3: { reps: 9, handsUsed: false } },
      { deferred: true }
    );
    expect(state.ladders.squat.currentLevel).toBe(3);
  });

  it('a short balance hold makes support measurement-required', () => {
    const state = applyAssessmentPlacement(
      onboarded(),
      { t1: { worseSideSeconds: 8 } },
      { deferred: false }
    );
    expect(state.profile.balanceSupportDefault).toBe(true);
    expect(state.profile.balanceSupportRequired).toBe(true);
  });

  it('an explicit Settings support preference survives a strong balance result', () => {
    const base = onboarded();
    base.profile = {
      ...base.profile,
      balanceSupportDefault: true,
      balanceSupportPreference: true,
    };
    const state = applyAssessmentPlacement(
      base,
      { t1: { worseSideSeconds: 25 } },
      { deferred: false }
    );
    expect(state.profile.balanceSupportDefault).toBe(true);
    expect(state.profile.balanceSupportRequired).toBe(false);
  });

  it('a later accepted check-up reviews required support without re-placing ladders', () => {
    const base = onboarded();
    base.ladders.squat = { ...base.ladders.squat, currentLevel: 3 };
    base.profile = {
      ...base.profile,
      balanceSupportDefault: true,
      balanceSupportRequired: true,
    };
    const reviewed = applyAssessmentSafety(base, { t1: { worseSideSeconds: 20 } });
    expect(reviewed.profile.balanceSupportDefault).toBe(false);
    expect(reviewed.profile.balanceSupportRequired).toBe(false);
    expect(reviewed.ladders.squat.currentLevel).toBe(3);
  });
});

describe('activation and back navigation', () => {
  it('marks the first session exactly once', () => {
    const state = completeOnboarding(runFlow(HAPPY_PATH)).programmeState;
    const started = markFirstSessionStarted(state);
    expect(started.profile.firstSessionStarted).toBe(true);
    expect(markFirstSessionStarted(started)).toBe(started);
  });

  it('returns from Health & Privacy to Goal in one tap', () => {
    const atHealth = runFlow(HAPPY_PATH, 'b1_heart');
    const undone = undoLastOnboardingStep(atHealth);
    expect(currentOnboardingStep(undone)).toBe('a1_life_goal');
    expect(undone.answers.lifeGoal).toBeNull();
  });

  it('moves back through the progressive health questions in order', () => {
    const atStart = runFlow(HAPPY_PATH, 'assessment_offer');
    const atJoints = undoLastOnboardingStep(atStart);
    expect(currentOnboardingStep(atJoints)).toBe('b3_joints');
    const atHeart = undoLastOnboardingStep(atJoints);
    expect(currentOnboardingStep(atHeart)).toBe('b1_heart');
    const atGoal = undoLastOnboardingStep(atHeart);
    expect(currentOnboardingStep(atGoal)).toBe('a1_life_goal');
    expect(atGoal.answers.lifeGoal).toBeNull();
  });

  it('preserves the advisory as its own acknowledgement in the exceptional path', () => {
    const answers = HAPPY_PATH.map((answer) =>
      answer.step === 'b1_heart'
        ? ({ step: 'b1_heart', value: 'yes' } as const)
        : answer
    );
    const atStart = runFlow(answers, 'assessment_offer');
    const backToAdvisory = undoLastOnboardingStep(atStart);
    expect(currentOnboardingStep(backToAdvisory)).toBe('b1_advisory');
    const backToJoints = undoLastOnboardingStep(backToAdvisory);
    expect(currentOnboardingStep(backToJoints)).toBe('b3_joints');
  });

  it('returns from the unanswered Goal surface to Welcome', () => {
    let state = initialOnboardingFlowState();
    state = acknowledgeOnboardingStep(state, 'welcome');
    expect(currentOnboardingStep(state)).toBe('a1_life_goal');
    const undone = undoLastOnboardingStep(state);
    expect(currentOnboardingStep(undone)).toBe('welcome');
    expect(undone.answers.lifeGoal).toBeNull();
    expect(undoLastOnboardingStep(undone)).toBe(undone);
  });
});
