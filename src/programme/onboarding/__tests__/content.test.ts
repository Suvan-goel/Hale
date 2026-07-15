import {
  allOnboardingCopyStrings,
  ONBOARDING_QUESTION_STEPS,
  onboardingMessageContent,
  onboardingQuestionContent,
} from '../content';

describe('claims discipline (same red lines as copyGuardrails)', () => {
  const MENOPAUSE_CLAIM_COPY =
    /fracture risk|osteoporosis|osteopenia|hormone replacement|\bHRT\b|bone density (score|test|result|reading)|(?<!not |never )(measures?|estimates?|tracks?|predicts?) (your )?(bone density|hormones?)|(treats?|relieves?|cures?|reverses?) (your )?menopause|menopause (treatment|therapy|cure)/i;
  const MEDICAL_CLAIM_COPY = /diagnos|fall[- ]risk|medical[- ]grade|prescri\w+ by/i;

  it('contains no banned claim shapes anywhere in the flow copy', () => {
    for (const copy of allOnboardingCopyStrings()) {
      expect({ copy, banned: MENOPAUSE_CLAIM_COPY.test(copy) }).toEqual({ copy, banned: false });
      expect({ copy, banned: MEDICAL_CLAIM_COPY.test(copy) }).toEqual({ copy, banned: false });
    }
  });
});

describe('four-surface content', () => {
  it('contains only the goal, two safety answers, and start choice', () => {
    expect(ONBOARDING_QUESTION_STEPS).toEqual([
      'a1_life_goal',
      'b1_heart',
      'b3_joints',
      'assessment_offer',
    ]);
  });

  it('gives every retained machine question clear supporting copy and choices', () => {
    for (const id of ONBOARDING_QUESTION_STEPS) {
      const question = onboardingQuestionContent(id);
      expect(question.whyWeAsk.length).toBeGreaterThan(0);
      expect(question.options.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('keeps one optional retention anchor', () => {
    const goal = onboardingQuestionContent('a1_life_goal');
    expect(goal.options).toHaveLength(4);
    expect(goal.skippable).toBe(true);
    expect(goal.eyebrow).toBe('Your strength now');
    expect(goal.question).toMatch(/menopause years/i);
    expect(goal.options.map((option) => option.label)).toEqual([
      'Feel stronger and steadier on stairs and walks',
      'Get down low and stand back up with confidence',
      'Make everyday lifting, reaching, and carrying feel easier',
      'Build confidence in what my body can do now',
    ]);
    expect(goal.options.map((option) => option.label).join(' ')).not.toMatch(
      /grandchildren|independent|years to come/i
    );
  });

  it('sets the repeated 12-week measurement expectation without adding a question', () => {
    const welcome = onboardingMessageContent('welcome');
    const copy = welcome.body.join(' ');
    expect(copy).toMatch(/12-week programme/i);
    expect(copy).toMatch(/weeks 4, 8 and 12/i);
    expect(copy).toMatch(/same Movement Check-Up/i);
    expect(copy).toMatch(/Strength and Balance results/i);
  });

  it('puts the explicit on-device disclosure on the first required health question', () => {
    const heart = onboardingQuestionContent('b1_heart');
    expect(heart.note).toMatch(/by choosing an answer, you agree/i);
    expect(heart.note).toMatch(/joint-comfort answer/i);
    expect(heart.note).toMatch(/on this phone/i);
    expect(heart.note).toMatch(/never uploaded, sold or shared/i);
    expect(heart.note).toMatch(/removed in Settings/i);
    expect(ONBOARDING_QUESTION_STEPS).not.toContain('consent_health');
  });

  it('retains B1 for check-up access and B3 for joint-sensitive placement', () => {
    const heart = onboardingQuestionContent('b1_heart');
    expect(heart.question).toMatch(/heart condition/i);
    expect(heart.question).toMatch(/chest pain/i);
    expect(heart.question).toMatch(/serious dizziness/i);
    expect(heart.skippable).not.toBe(true);
    const joints = onboardingQuestionContent('b3_joints');
    expect(joints.multiSelect).toBe(true);
    expect(joints.options.map((option) => option.value)).toEqual([
      'knee',
      'hip',
      'shoulder',
      'wrist',
      'low_back',
      'none',
    ]);
    expect(joints.whyWeAsk).toMatch(/gentlest level/i);
  });

  it('keeps a positive heart answer inside onboarding until the safety step is confirmed', () => {
    const advisory = onboardingMessageContent('b1_advisory');
    expect(advisory.title).toMatch(/safety step/i);
    expect(advisory.body.join(' ')).toMatch(/before an effort-based Movement Check-Up/i);
    expect(advisory.body.join(' ')).toMatch(/before Week 1/i);
    expect(advisory.continueLabel).toBe('I’ve completed the safety step');
  });

  it('defers setup and extra profile questions instead of hiding them behind more screens', () => {
    const allCopy = allOnboardingCopyStrings().join(' ');
    expect(allCopy).not.toMatch(/which days usually suit/i);
    expect(allCopy).not.toMatch(/stable bottom step/i);
    expect(allCopy).not.toMatch(/where are you on the menopause journey/i);
  });

  it('offers exactly the starting check-up or a non-counted session preview', () => {
    const offer = onboardingQuestionContent('assessment_offer');
    expect(offer.options.map((option) => option.value)).toEqual(['now', 'preview']);
    expect(offer.options.map((option) => option.label)).toEqual([
      'Do my starting check-up',
      'See how a session works',
    ]);
    expect(offer.note).toMatch(/not a workout/i);
    expect(offer.note).toMatch(/nothing to your programme history/i);
  });
});
