import {
  acknowledgeOnboardingStep,
  applyAssessmentPlacement,
  completeOnboarding,
  currentOnboardingStep,
  gentleStartFromAnswers,
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

/** Drives the flow with given answers, acknowledging message steps as reached. */
function runFlow(
  answers: readonly OnboardingAnswerValue[],
  until?: OnboardingStepId
): ProgrammeOnboardingFlowState {
  let state = initialOnboardingFlowState();
  const byStep = new Map(answers.map((a) => [a.step, a]));
  for (let guard = 0; guard < 40; guard++) {
    const step = currentOnboardingStep(state);
    if (step === 'complete' || step === until) return state;
    const answer = byStep.get(step as OnboardingAnswerValue['step']);
    if (answer) {
      state = recordOnboardingAnswer(state, answer);
    } else {
      state = acknowledgeOnboardingStep(state, step);
    }
  }
  throw new Error('flow did not terminate');
}

const HAPPY_PATH: OnboardingAnswerValue[] = [
  { step: 'a1_life_goal', value: 'stairs_walks' },
  { step: 'a2_menopause_journey', value: 'perimenopausal' },
  { step: 'a3_activity', value: 'moderately_active' },
  { step: 'consent_health', value: 'agree' },
  { step: 'b1_heart', value: 'no' },
  { step: 'b3_joints', value: [] },
  { step: 'b4_pelvic', value: 'never' },
  { step: 'b5_balance', value: 'no' },
  { step: 'c1_stairs', value: 'yes' },
  { step: 'c2_quiet', value: 'no' },
  { step: 'assessment_offer', value: 'now' },
];

describe('step sequence', () => {
  it('presents seven core screens, with an eighth only for the conditional heart advisory', () => {
    const normal = runFlow(HAPPY_PATH);
    expect(visibleOnboardingScreens(normal.answers)).toEqual([
      'welcome',
      'about_you',
      'health_consent',
      'heart_safety',
      'movement_comfort',
      'setup',
      'finish',
    ]);

    const heartFlag = HAPPY_PATH.map((answer) =>
      answer.step === 'b1_heart'
        ? ({ step: 'b1_heart', value: 'yes' } as const)
        : answer
    );
    expect(visibleOnboardingScreens(runFlow(heartFlag).answers)).toEqual([
      'welcome',
      'about_you',
      'health_consent',
      'heart_safety',
      'heart_advisory',
      'movement_comfort',
      'setup',
      'finish',
    ]);
  });

  it('walks the full consented flow in spec order and completes', () => {
    const state = runFlow(HAPPY_PATH);
    expect(currentOnboardingStep(state)).toBe('complete');
    expect(visibleOnboardingSteps(state.answers)).toEqual([
      'welcome',
      'a1_life_goal',
      'a2_menopause_journey',
      'a3_activity',
      'consent_health',
      'b1_heart',
      'b3_joints',
      'b4_pelvic',
      'b5_balance',
      'c1_stairs',
      'c2_quiet',
      'assessment_offer',
    ]);
  });

  it('consent decline removes health questions but keeps one final start screen', () => {
    const answers = HAPPY_PATH.map((a) =>
      a.step === 'consent_health' ? ({ step: 'consent_health', value: 'decline' } as const) : a
    );
    const state = runFlow(answers);
    const steps = visibleOnboardingSteps(state.answers);
    for (const gone of ['b1_heart', 'b3_joints', 'b4_pelvic', 'b5_balance']) {
      expect(steps).not.toContain(gone);
    }
    expect(steps).toContain('assessment_offer');
    expect(currentOnboardingStep(state)).toBe('complete');
  });

  it('B1 = yes inserts the required advisory and leaves the final screen in Gentle Start mode', () => {
    const answers = HAPPY_PATH.map((a) =>
      a.step === 'b1_heart' ? ({ step: 'b1_heart', value: 'yes' } as const) : a
    );
    const state = runFlow(answers, 'b1_advisory');
    expect(currentOnboardingStep(state)).toBe('b1_advisory');

    const finished = runFlow(answers);
    const steps = visibleOnboardingSteps(finished.answers);
    expect(steps).toContain('b1_advisory');
    expect(steps).toContain('assessment_offer');
    expect(currentOnboardingStep(finished)).toBe('complete');
  });

  it('B1 skipped activates Gentle Start but shows no GP advisory', () => {
    const answers = HAPPY_PATH.map((a) =>
      a.step === 'b1_heart' ? ({ step: 'b1_heart', value: SKIPPED } as const) : a
    );
    const state = runFlow(answers);
    const steps = visibleOnboardingSteps(state.answers);
    expect(steps).not.toContain('b1_advisory');
    expect(steps).toContain('assessment_offer');
    expect(gentleStartFromAnswers(state.answers)).toBe(true);
  });

  it('nothing in onboarding blocks completion — every path reaches the CTA', () => {
    const allSkips: OnboardingAnswerValue[] = [
      { step: 'a1_life_goal', value: SKIPPED },
      { step: 'a2_menopause_journey', value: 'prefer_not_to_say' },
      { step: 'a3_activity', value: SKIPPED },
      { step: 'consent_health', value: 'agree' },
      { step: 'b1_heart', value: SKIPPED },
      { step: 'b3_joints', value: [] },
      { step: 'b4_pelvic', value: 'prefer_not_to_say' },
      { step: 'b5_balance', value: SKIPPED },
      { step: 'c1_stairs', value: SKIPPED },
      { step: 'c2_quiet', value: SKIPPED },
      { step: 'assessment_offer', value: 'skip' },
    ];
    expect(currentOnboardingStep(runFlow(allSkips))).toBe('complete');
  });
});

describe('completion → programme state (gate table §4 + conservative skips)', () => {
  it('builds the consented no-flags profile with activity-prior placement', () => {
    const completion = completeOnboarding(runFlow(HAPPY_PATH));
    const { profile } = completion.programmeState;

    expect(profile.consentHealthData).toBe(true);
    expect(profile.gentleStartActive).toBe(false);
    expect(profile.pelvicRouting).toBe('none'); // explicit "never"
    expect(profile.jointFlags).toEqual([]);
    expect(profile.balanceSupportDefault).toBe(false);
    expect(profile.quietMode).toBe(false);
    expect(profile.hasStairs).toBe(true);
    expect(profile.hasBand).toBeNull(); // asked in-context at Pull L4, never here
    expect(profile.chosenDays).toEqual([]);
    expect(profile.firstSessionStarted).toBe(false);
    // moderately_active (prior 2): squat 2, push 2, hinge 1, pull 2, core 2.
    expect(profile.placement).toEqual({ squat: 2, push: 2, hinge: 1, pull: 2, core: 2 });
    expect(completion.programmeState.ladders.squat.currentLevel).toBe(2);
    expect(completion.programmeState.ladders.hinge.currentLevel).toBe(1);
    // 'now' choice: status stays open until Check-up #0 completes.
    expect(profile.assessmentStatus).toBeNull();
    expect(completion.assessmentIntent).toBe('start_now');
    expect(completion.menopauseStage).toBe('perimenopausal');
    expect(completion.lifeGoalCategory).toBe('stairs_walks');
  });

  it('every retained comfort area makes the related starting ladder gentler', () => {
    const answers = HAPPY_PATH.map((answer) =>
      answer.step === 'b3_joints'
        ? ({
            step: 'b3_joints',
            value: ['knee', 'hip', 'shoulder', 'wrist', 'low_back'],
          } as const)
        : answer
    );
    const completion = completeOnboarding(runFlow(answers));
    expect(completion.programmeState.profile.jointFlags).toEqual([
      'knee',
      'hip',
      'shoulder',
      'wrist',
      'low_back',
    ]);
    expect(completion.programmeState.profile.placement).toEqual({
      squat: 1,
      push: 1,
      hinge: 1,
      pull: 1,
      core: 1,
    });
  });

  it('B1 = yes → Gentle Start preset: all ladders L1, bypassed_b1, no assessment intent', () => {
    const answers = HAPPY_PATH.map((a) =>
      a.step === 'b1_heart' ? ({ step: 'b1_heart', value: 'yes' } as const) : a
    );
    const completion = completeOnboarding(runFlow(answers));
    const { profile, ladders } = completion.programmeState;
    expect(profile.gentleStartActive).toBe(true);
    expect(profile.gpConfirmed).toBe(false);
    expect(profile.assessmentStatus).toBe('bypassed_b1');
    expect(completion.assessmentIntent).toBeNull();
    for (const ladder of Object.values(ladders)) {
      expect(ladder.currentLevel).toBe(1);
    }
  });

  it('consent decline → capped L2, skipped assessment, and explicitly NOT Gentle Start', () => {
    const answers: OnboardingAnswerValue[] = [
      { step: 'a1_life_goal', value: 'independence' },
      { step: 'a2_menopause_journey', value: 'postmenopausal' },
      { step: 'a3_activity', value: 'very_active' },
      { step: 'consent_health', value: 'decline' },
      { step: 'c1_stairs', value: 'yes' },
      { step: 'c2_quiet', value: 'no' },
      { step: 'assessment_offer', value: 'skip' },
    ];
    const completion = completeOnboarding(runFlow(answers));
    const { profile } = completion.programmeState;
    expect(profile.consentHealthData).toBe(false);
    expect(profile.gentleStartActive).toBe(false); // a privacy choice is never a health flag
    expect(profile.assessmentStatus).toBe('skipped');
    // very_active would place core at L3; the decline cap holds it at L2.
    expect(profile.placement).toEqual({ squat: 2, push: 2, hinge: 2, pull: 2, core: 2 });
    expect(profile.pelvicRouting).toBe('none'); // no content unlock without a symptom report
  });

  it('skips route conservative: pelvic prefer-not → low_impact; B5 skip → support on; C2 skip → quiet on', () => {
    const answers = HAPPY_PATH.map((a) => {
      if (a.step === 'b4_pelvic') return { step: 'b4_pelvic', value: 'prefer_not_to_say' } as const;
      if (a.step === 'b5_balance') return { step: 'b5_balance', value: SKIPPED } as const;
      if (a.step === 'c2_quiet') return { step: 'c2_quiet', value: SKIPPED } as const;
      if (a.step === 'c1_stairs') return { step: 'c1_stairs', value: SKIPPED } as const;
      return a;
    });
    const { programmeState } = completeOnboarding(runFlow(answers));
    expect(programmeState.profile.pelvicRouting).toBe('low_impact');
    expect(programmeState.profile.balanceSupportDefault).toBe(true);
    expect(programmeState.profile.quietMode).toBe(true);
    expect(programmeState.profile.hasStairs).toBeNull(); // treated as no stairs downstream
  });

  it('pelvic often/sometimes route low_impact', () => {
    for (const value of ['often', 'sometimes'] as const) {
      const answers = HAPPY_PATH.map((a) =>
        a.step === 'b4_pelvic' ? ({ step: 'b4_pelvic', value } as const) : a
      );
      const { programmeState } = completeOnboarding(runFlow(answers));
      expect(programmeState.profile.pelvicRouting).toBe('low_impact');
    }
  });

  it("deferral choice records 'deferred'; skip records 'skipped'", () => {
    for (const [choice, status] of [
      ['after_first_workout', 'deferred'],
      ['skip', 'skipped'],
    ] as const) {
      const answers = HAPPY_PATH.map((a) =>
        a.step === 'assessment_offer' ? ({ step: 'assessment_offer', value: choice } as const) : a
      );
      const completion = completeOnboarding(runFlow(answers));
      expect(completion.programmeState.profile.assessmentStatus).toBe(status);
      expect(completion.assessmentIntent).toBeNull();
    }
  });
});

describe('assessment completion (Check-up #0)', () => {
  const onboarded = () => completeOnboarding(runFlow(HAPPY_PATH)).programmeState;

  it("the 'now' path replaces placement outright from measured results", () => {
    const state = applyAssessmentPlacement(
      onboarded(),
      { t3: { reps: 18, handsUsed: false }, t1: { worseSideSeconds: 25 } },
      { deferred: false }
    );
    // T3 16+ → capacity 4 → start 3.
    expect(state.ladders.squat.currentLevel).toBe(3);
    expect(state.profile.assessmentStatus).toBe('done');
    expect(state.profile.balanceSupportDefault).toBe(false);
    expect(state.profile.balanceSupportRequired).toBe(false);
  });

  it('the deferred path re-places upward only (spec §6)', () => {
    const base = onboarded();
    base.ladders.squat = { ...base.ladders.squat, currentLevel: 3 };
    const state = applyAssessmentPlacement(
      base,
      { t3: { reps: 9, handsUsed: false } }, // capacity 2 → start 1: below current
      { deferred: true }
    );
    expect(state.ladders.squat.currentLevel).toBe(3);
  });

  it('T1 under 10 s marks balance support as required without erasing a prior preference', () => {
    const forced = applyAssessmentPlacement(
      onboarded(),
      { t1: { worseSideSeconds: 8 } },
      { deferred: false }
    );
    expect(forced.profile.balanceSupportDefault).toBe(true);
    expect(forced.profile.balanceSupportRequired).toBe(true);

    const alreadyOn = onboarded();
    alreadyOn.profile = { ...alreadyOn.profile, balanceSupportDefault: true };
    const kept = applyAssessmentPlacement(
      alreadyOn,
      { t1: { worseSideSeconds: 40 } },
      { deferred: false }
    );
    expect(kept.profile.balanceSupportDefault).toBe(true);
    expect(kept.profile.balanceSupportRequired).toBe(false);
  });
});

describe('the activation event', () => {
  it('flips once and is idempotent', () => {
    const state = completeOnboarding(runFlow(HAPPY_PATH)).programmeState;
    expect(state.profile.firstSessionStarted).toBe(false);
    const started = markFirstSessionStarted(state);
    expect(started.profile.firstSessionStarted).toBe(true);
    expect(markFirstSessionStarted(started)).toBe(started);
  });
});

describe('screen-wise back (undoLastOnboardingStep)', () => {
  it('returns from consent to the grouped About You screen in one tap', () => {
    const atConsent = runFlow(HAPPY_PATH, 'consent_health');
    expect(currentOnboardingStep(atConsent)).toBe('consent_health');
    const undone = undoLastOnboardingStep(atConsent);
    expect(currentOnboardingStep(undone)).toBe('a1_life_goal');
    expect(undone.answers.lifeGoal).toBeNull();
    expect(undone.answers.menopauseStage).toBeNull();
    expect(undone.answers.activityLevel).toBeNull();
    let forward = recordOnboardingAnswer(undone, { step: 'a1_life_goal', value: 'stairs_walks' });
    forward = recordOnboardingAnswer(forward, { step: 'a2_menopause_journey', value: 'perimenopausal' });
    forward = recordOnboardingAnswer(forward, { step: 'a3_activity', value: 'very_active' });
    expect(currentOnboardingStep(forward)).toBe('consent_health');
    expect(forward.answers.lifeGoal).toBe('stairs_walks');
  });

  it('un-acknowledges message steps one at a time (advisory chain: advisory first, then B1)', () => {
    const withHeartFlag: OnboardingAnswerValue[] = [
      ...HAPPY_PATH.filter((a) => a.step !== 'b1_heart'),
      { step: 'b1_heart', value: 'yes' },
    ];
    const atB3 = runFlow(withHeartFlag, 'b3_joints');
    expect(currentOnboardingStep(atB3)).toBe('b3_joints');
    const one = undoLastOnboardingStep(atB3);
    expect(currentOnboardingStep(one)).toBe('b1_advisory');
    const two = undoLastOnboardingStep(one);
    expect(currentOnboardingStep(two)).toBe('b1_heart');
    expect(two.answers.b1Heart).toBeNull();
    // The advisory is no longer visible once B1 is unanswered.
    expect(visibleOnboardingSteps(two.answers)).not.toContain('b1_advisory');
  });

  it('returns from a partially answered About You screen to Welcome in one tap', () => {
    let state = initialOnboardingFlowState();
    state = acknowledgeOnboardingStep(state, 'welcome');
    state = recordOnboardingAnswer(state, { step: 'a1_life_goal', value: SKIPPED });
    expect(currentOnboardingStep(state)).toBe('a2_menopause_journey');
    const undone = undoLastOnboardingStep(state);
    expect(currentOnboardingStep(undone)).toBe('welcome');
    expect(undone.answers.lifeGoal).toBe(SKIPPED);
    expect(undoLastOnboardingStep(undone)).toBe(undone);
  });

  it('returns from Setup to the grouped Movement Comfort screen in one tap', () => {
    const atSetup = runFlow(HAPPY_PATH, 'c1_stairs');
    const undone = undoLastOnboardingStep(atSetup);
    expect(currentOnboardingStep(undone)).toBe('b3_joints');
    expect(undone.answers.b3Joints).toBeNull();
    expect(undone.answers.b4Pelvic).toBeNull();
    expect(undone.answers.b5Balance).toBeNull();
  });
});

describe('consent integrity with back-navigation', () => {
  it('joint flags answered under consent are NEVER used after consent is retracted', () => {
    // Answer the whole consented flow, then back up and retract consent.
    const withJointFlag = HAPPY_PATH.map((answer) =>
      answer.step === 'b3_joints'
        ? ({ step: 'b3_joints', value: ['knee'] } as const)
        : answer
    );
    let state = runFlow(withJointFlag, 'c1_stairs');
    expect(state.answers.b3Joints).toEqual(['knee']);
    // Screen-wise back: Setup → Movement Comfort → Heart → Consent.
    for (let i = 0; i < 4 && currentOnboardingStep(state) !== 'consent_health'; i++) {
      state = undoLastOnboardingStep(state);
    }
    expect(currentOnboardingStep(state)).toBe('consent_health');
    state = recordOnboardingAnswer(state, { step: 'consent_health', value: 'decline' });
    // Drive the declined state to completion directly.
    let declined = state;
    for (let guard = 0; guard < 20 && currentOnboardingStep(declined) !== 'complete'; guard++) {
      const step = currentOnboardingStep(declined);
      if (step === 'c1_stairs') declined = recordOnboardingAnswer(declined, { step, value: 'yes' });
      else if (step === 'c2_quiet') declined = recordOnboardingAnswer(declined, { step, value: 'no' });
      else if (step === 'assessment_offer') declined = recordOnboardingAnswer(declined, { step, value: 'skip' });
      else declined = acknowledgeOnboardingStep(declined, step as OnboardingStepId);
    }
    expect(currentOnboardingStep(declined)).toBe('complete');
    const completion = completeOnboarding(declined);
    // The stale special-category answer is ignored (§4 decline row).
    expect(completion.programmeState.profile.jointFlags).toEqual([]);
    expect(completion.programmeState.profile.consentHealthData).toBe(false);
  });
});
