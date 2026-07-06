import { MENOPAUSE_STAGE_OPTIONS } from '../../../profile';
import {
  allOnboardingCopyStrings,
  ONBOARDING_QUESTION_STEPS,
  onboardingQuestionContent,
  STAGE_B_QUESTION_COUNT,
} from '../content';

describe('claims discipline (same red lines as copyGuardrails)', () => {
  // B2 and the Impact track are deferred (C1/C2): the flow must contain no
  // bone-screening or claim-shaped language. Regexes mirror the enforced
  // guardrails; the flow's copy is scanned in full.
  const MENOPAUSE_CLAIM_COPY =
    /fracture risk|osteoporosis|osteopenia|hormone replacement|\bHRT\b|bone density (score|test|result|reading)|(?<!not |never )(measures?|estimates?|tracks?|predicts?) (your )?(bone density|hormones?)|(treats?|relieves?|cures?|reverses?) (your )?menopause|menopause (treatment|therapy|cure)/i;
  const MEDICAL_CLAIM_COPY = /diagnos|fall[- ]risk|medical[- ]grade|prescri\w+ by/i;

  it('contains no banned claim shapes anywhere in the flow copy', () => {
    for (const copy of allOnboardingCopyStrings()) {
      expect({ copy, banned: MENOPAUSE_CLAIM_COPY.test(copy) }).toEqual({ copy, banned: false });
      expect({ copy, banned: MEDICAL_CLAIM_COPY.test(copy) }).toEqual({ copy, banned: false });
    }
  });

  it('D1 carries no notification opt-in language (C7 ruling)', () => {
    const d1 = onboardingQuestionContent('d1_days');
    const copy = [d1.question, d1.whyWeAsk, d1.note ?? '', ...d1.options.map((o) => o.label)].join(' ');
    expect(copy).not.toMatch(/notif|nudge|remind|alert/i);
  });
});

describe('content structure', () => {
  it('gives every question a one-line why-we-ask and at least two options', () => {
    for (const id of ONBOARDING_QUESTION_STEPS) {
      const question = onboardingQuestionContent(id);
      expect(question.whyWeAsk.length).toBeGreaterThan(0);
      expect(question.options.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('A2 options are exactly the profile stage taxonomy (C6 reconciliation)', () => {
    const a2 = onboardingQuestionContent('a2_menopause_journey');
    expect(a2.options.map((o) => o.value)).toEqual(MENOPAUSE_STAGE_OPTIONS.map((o) => o.value));
  });

  it('Stage B runs exactly B1, B3, B4, B5 with contiguous progress dots (B2 deferred)', () => {
    const stageB = ONBOARDING_QUESTION_STEPS.map(onboardingQuestionContent).filter(
      (q) => q.stageBIndex !== undefined
    );
    expect(stageB.map((q) => q.id)).toEqual(['b1_heart', 'b3_joints', 'b4_pelvic', 'b5_balance']);
    expect(stageB.map((q) => q.stageBIndex)).toEqual([1, 2, 3, 4]);
    expect(STAGE_B_QUESTION_COUNT).toBe(4);
    const allCopy = allOnboardingCopyStrings().join(' ');
    expect(allCopy).not.toMatch(/\bbones?\b/i); // no bone question survives the deferral
  });

  it('B4 carries the normalising microcopy and a prefer-not option', () => {
    const b4 = onboardingQuestionContent('b4_pelvic');
    expect(b4.note).toMatch(/nothing to be embarrassed about/i);
    expect(b4.options.map((o) => o.value)).toContain('prefer_not_to_say');
  });

  it('the assessment offer keeps all three first-class options and the on-device promise', () => {
    const offer = onboardingQuestionContent('assessment_offer');
    expect(offer.options.map((o) => o.value)).toEqual(['now', 'after_first_workout', 'skip']);
    expect(offer.note).toMatch(/never leaves/i);
  });

  it('D1 offers all seven days', () => {
    expect(onboardingQuestionContent('d1_days').options).toHaveLength(7);
  });
});
