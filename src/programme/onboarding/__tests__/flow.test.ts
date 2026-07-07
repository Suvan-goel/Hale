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
  { step: 'b3_joints', value: ['knee'] },
  { step: 'b4_pelvic', value: 'never' },
  { step: 'b5_balance', value: 'no' },
  { step: 'c1_stairs', value: 'yes' },
  { step: 'c2_quiet', value: 'no' },
  { step: 'd1_days', value: ['mon', 'wed', 'sat'] },
  { step: 'assessment_offer', value: 'now' },
];

describe('step sequence', () => {
  it('walks the full consented flow in spec order and completes', () => {
    const state = runFlow(HAPPY_PATH);
    expect(currentOnboardingStep(state)).toBe('complete');
    expect(visibleOnboardingSteps(state.answers)).toEqual([
      'welcome',
      'a1_life_goal',
      'a2_menopause_journey',
      'a3_activity',
      'consent_health',
      'b_intro',
      'b1_heart',
      'b3_joints',
      'b4_pelvic',
      'b5_balance',
      'b_exit',
      'c1_stairs',
      'c2_quiet',
      'd1_days',
      'assessment_offer',
      'placement_reveal',
      'expectation_cta',
    ]);
  });

  it('consent decline removes Stage B AND the assessment offer (§4 decline row)', () => {
    const answers = HAPPY_PATH.map((a) =>
      a.step === 'consent_health' ? ({ step: 'consent_health', value: 'decline' } as const) : a
    );
    const state = runFlow(answers);
    const steps = visibleOnboardingSteps(state.answers);
    for (const gone of ['b_intro', 'b1_heart', 'b3_joints', 'b4_pelvic', 'b5_balance', 'b_exit', 'assessment_offer']) {
      expect(steps).not.toContain(gone);
    }
    expect(currentOnboardingStep(state)).toBe('complete');
  });

  it('B1 = yes inserts the required advisory acknowledgement and bypasses the assessment offer', () => {
    const answers = HAPPY_PATH.map((a) =>
      a.step === 'b1_heart' ? ({ step: 'b1_heart', value: 'yes' } as const) : a
    );
    const state = runFlow(answers, 'b1_advisory');
    expect(currentOnboardingStep(state)).toBe('b1_advisory');

    const finished = runFlow(answers);
    const steps = visibleOnboardingSteps(finished.answers);
    expect(steps).toContain('b1_advisory');
    expect(steps).not.toContain('assessment_offer');
    expect(currentOnboardingStep(finished)).toBe('complete');
  });

  it('B1 skipped also bypasses the assessment (conservative) but shows no GP advisory', () => {
    const answers = HAPPY_PATH.map((a) =>
      a.step === 'b1_heart' ? ({ step: 'b1_heart', value: SKIPPED } as const) : a
    );
    const state = runFlow(answers);
    const steps = visibleOnboardingSteps(state.answers);
    expect(steps).not.toContain('b1_advisory');
    expect(steps).not.toContain('assessment_offer');
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
      { step: 'd1_days', value: ['mon', 'tue', 'thu'] },
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
    expect(profile.jointFlags).toEqual(['knee']);
    expect(profile.balanceSupportDefault).toBe(false);
    expect(profile.quietMode).toBe(false);
    expect(profile.hasStairs).toBe(true);
    expect(profile.hasBand).toBeNull(); // asked in-context at Pull L4, never here
    expect(profile.chosenDays).toEqual(['mon', 'wed', 'sat']);
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
      { step: 'd1_days', value: ['tue', 'thu', 'sun'] },
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

  it('T1 under 10 s forces balance support on, and never turns it off', () => {
    const forced = applyAssessmentPlacement(
      onboarded(),
      { t1: { worseSideSeconds: 8 } },
      { deferred: false }
    );
    expect(forced.profile.balanceSupportDefault).toBe(true);

    const alreadyOn = onboarded();
    alreadyOn.profile = { ...alreadyOn.profile, balanceSupportDefault: true };
    const kept = applyAssessmentPlacement(
      alreadyOn,
      { t1: { worseSideSeconds: 40 } },
      { deferred: false }
    );
    expect(kept.profile.balanceSupportDefault).toBe(true);
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

describe('step-wise back (undoLastOnboardingStep)', () => {
  it('clears the most recent answer so the flow returns to that question', () => {
    const atConsent = runFlow(HAPPY_PATH, 'consent_health');
    expect(currentOnboardingStep(atConsent)).toBe('consent_health');
    const undone = undoLastOnboardingStep(atConsent);
    expect(currentOnboardingStep(undone)).toBe('a3_activity');
    expect(undone.answers.activityLevel).toBeNull();
    // Re-answering moves forward again — nothing else was lost.
    const forward = recordOnboardingAnswer(undone, { step: 'a3_activity', value: 'very_active' });
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

  it('undoes a skip like any answer and is a no-op at the first step', () => {
    let state = initialOnboardingFlowState();
    state = acknowledgeOnboardingStep(state, 'welcome');
    state = recordOnboardingAnswer(state, { step: 'a1_life_goal', value: SKIPPED });
    expect(currentOnboardingStep(state)).toBe('a2_menopause_journey');
    const undone = undoLastOnboardingStep(state);
    expect(currentOnboardingStep(undone)).toBe('a1_life_goal');
    expect(undone.answers.lifeGoal).toBeNull();
    // Back past a1 returns to welcome; back at welcome is a no-op.
    const atWelcome = undoLastOnboardingStep(undone);
    expect(currentOnboardingStep(atWelcome)).toBe('welcome');
    expect(undoLastOnboardingStep(atWelcome)).toBe(atWelcome);
  });

  it('an empty multi-select answer ("none of these") undoes back to the question', () => {
    const noneJoints: OnboardingAnswerValue[] = HAPPY_PATH.map((a) =>
      a.step === 'b3_joints' ? { step: 'b3_joints', value: [] } : a
    );
    const atB4 = runFlow(noneJoints, 'b4_pelvic');
    const undone = undoLastOnboardingStep(atB4);
    expect(currentOnboardingStep(undone)).toBe('b3_joints');
    expect(undone.answers.b3Joints).toBeNull();
  });
});

describe('consent integrity with back-navigation', () => {
  it('joint flags answered under consent are NEVER used after consent is retracted', () => {
    // Answer the whole consented flow, then back up and retract consent.
    let state = runFlow(HAPPY_PATH, 'c1_stairs');
    expect(state.answers.b3Joints).toEqual(['knee']);
    // Walk back to consent (c-block start → b_exit ack → b5 → b4 → b3 → b1 → b_intro ack → consent).
    for (let i = 0; i < 12 && currentOnboardingStep(state) !== 'consent_health'; i++) {
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
      else if (step === 'd1_days') declined = recordOnboardingAnswer(declined, { step, value: ['mon'] });
      else declined = acknowledgeOnboardingStep(declined, step as OnboardingStepId);
    }
    expect(currentOnboardingStep(declined)).toBe('complete');
    const completion = completeOnboarding(declined);
    // The stale special-category answer is ignored (§4 decline row).
    expect(completion.programmeState.profile.jointFlags).toEqual([]);
    expect(completion.programmeState.profile.consentHealthData).toBe(false);
  });
});
