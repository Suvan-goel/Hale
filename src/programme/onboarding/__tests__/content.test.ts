import { MENOPAUSE_STAGE_OPTIONS } from '../../../profile';
import {
  allOnboardingCopyStrings,
  ONBOARDING_QUESTION_STEPS,
  onboardingQuestionContent,
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

  it('does not collect preferred days before scheduling exists', () => {
    expect(ONBOARDING_QUESTION_STEPS).not.toContain('d1_days');
    expect(allOnboardingCopyStrings().join(' ')).not.toMatch(/which days usually suit/i);
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

  it('retains the four safety inputs while grouping related answers on screen', () => {
    for (const id of ['b1_heart', 'b3_joints', 'b4_pelvic', 'b5_balance'] as const) {
      expect(ONBOARDING_QUESTION_STEPS).toContain(id);
    }
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
    expect(offer.options.map((o) => o.value)).toEqual(['now', 'after_first_workout']);
    expect(offer.note).toMatch(/never leaves/i);
  });

  it('makes the retained setup promises match their implemented effects', () => {
    const stairs = onboardingQuestionContent('c1_stairs');
    const quiet = onboardingQuestionContent('c2_quiet');
    const joints = onboardingQuestionContent('b3_joints');
    expect(stairs.question).toMatch(/low, stable bottom step/i);
    expect(stairs.question).toMatch(/support nearby/i);
    expect(quiet.whyWeAsk).toMatch(/stomping finisher/i);
    expect(joints.whyWeAsk).toMatch(/gentlest level/i);
  });
});
