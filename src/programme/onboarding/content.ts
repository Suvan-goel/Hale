/**
 * Onboarding field content — onboarding-spec v0.2 §2–§3 under the 2026-07-06
 * rulings and the seven-screen MVP consolidation (2026-07-10). Safety-field
 * wording stays centralized here for clinical review; grouped-screen framing
 * and CTA copy live with the presentation that composes these fields.
 *
 * Structure: A1 uses the existing LifeGoal question (C8); B2 remains
 * deferred; B1/B3/B4/B5 retain their safety effects; preferred days are no
 * longer collected before scheduling exists. Every route reaches one final
 * start surface, which conditionally offers the check-up.
 *
 * Claims discipline: nothing here may use fracture/osteoporosis/bone-density
 * language or any banned claim shape — pinned by content.test.ts with the
 * same regexes as copyGuardrails.
 */

import type { LifeGoalCategory, ActivityLevel } from '../../adherence';
import { BRAND } from '../../brand';
import type { MenopauseStage } from '../../profile';
import type { JointFlag } from '../types';

// ---------------------------------------------------------------------------
// Step ids
// ---------------------------------------------------------------------------

export const ONBOARDING_QUESTION_STEPS = [
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
] as const;
export type OnboardingQuestionStepId = (typeof ONBOARDING_QUESTION_STEPS)[number];

export const ONBOARDING_MESSAGE_STEPS = [
  'welcome',
  'b1_advisory',
] as const;
export type OnboardingMessageStepId = (typeof ONBOARDING_MESSAGE_STEPS)[number];

export type OnboardingStepId = OnboardingQuestionStepId | OnboardingMessageStepId;

// ---------------------------------------------------------------------------
// Content shapes
// ---------------------------------------------------------------------------

export interface OnboardingOption {
  value: string;
  label: string;
  microcopy?: string;
}

export interface OnboardingQuestionContent {
  id: OnboardingQuestionStepId;
  /** Section kicker rendered by the ScreenHeader (old-design language). */
  eyebrow: string;
  question: string;
  /** One-line "why we ask", shown on every question screen (spec §3). */
  whyWeAsk: string;
  options: readonly OnboardingOption[];
  multiSelect?: boolean;
  /** Value that clears a multi-select ("None of these"). */
  noneValue?: string;
  /**
   * Shows an explicit skip affordance. Skipping always routes to the
   * conservative default (non-negotiable) — the flow owns that mapping.
   */
  skippable?: boolean;
  skipLabel?: string;
  /** Extra line under the question (normalising microcopy etc.). */
  note?: string;
}

export interface OnboardingMessageContent {
  id: OnboardingMessageStepId;
  /** Section kicker rendered by the ScreenHeader (old-design language). */
  eyebrow: string;
  title: string;
  body: readonly string[];
  continueLabel: string;
  secondaryLabel?: string;
  /** Small fact tiles (welcome screen), old-design SummaryMetric pattern. */
  facts?: readonly { value: string; detail: string }[];
}

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

const QUESTIONS: Record<OnboardingQuestionStepId, OnboardingQuestionContent> = {
  a1_life_goal: {
    id: 'a1_life_goal',
    eyebrow: 'About you',
    question: 'What do you most want your strength for?',
    whyWeAsk: 'So your progress is framed around what actually matters to you.',
    options: [
      { value: 'stairs_walks', label: 'Stairs and long walks feeling easy' },
      { value: 'grandchildren', label: 'Keeping up with the grandchildren' },
      { value: 'bend_reach_carry', label: 'Bending, reaching and carrying without a second thought' },
      { value: 'independence', label: 'Staying strong and independent for years to come' },
    ] satisfies readonly { value: LifeGoalCategory; label: string }[],
    skippable: true,
    skipLabel: 'I’ll decide later',
  },
  a2_menopause_journey: {
    id: 'a2_menopause_journey',
    eyebrow: 'About you',
    question: 'Where are you on the menopause journey?',
    whyWeAsk: 'It shapes what we explain and when — never your results.',
    options: [
      { value: 'perimenopausal', label: 'Perimenopause' },
      { value: 'menopausal', label: 'Menopause' },
      { value: 'postmenopausal', label: 'Post-menopause' },
      { value: 'surgical_medical', label: 'Menopause after surgery or medical treatment' },
      { value: 'neither_or_unsure', label: 'Not sure' },
      { value: 'prefer_not_to_say', label: 'Prefer not to say' },
    ] satisfies readonly { value: MenopauseStage; label: string }[],
  },
  a3_activity: {
    id: 'a3_activity',
    eyebrow: 'About you',
    question: 'How active are you these days?',
    whyWeAsk: 'It sets how gently your first weeks start.',
    options: [
      { value: 'very_inactive', label: 'Mostly sitting' },
      { value: 'lightly_active', label: 'On my feet a lot, but no real exercise' },
      { value: 'moderately_active', label: 'I exercise now and then' },
      { value: 'very_active', label: 'I exercise regularly' },
    ] satisfies readonly { value: ActivityLevel; label: string }[],
    skippable: true,
    skipLabel: 'Prefer not to say',
  },
  consent_health: {
    id: 'consent_health',
    eyebrow: 'Health check',
    question: 'The next few questions touch on your health. OK to use your answers?',
    whyWeAsk: 'They tailor your programme — nothing else.',
    note:
      'Your answers stay on your phone. They are never uploaded, never sold, never shared. You can change or delete them any time in Settings.',
    options: [
      { value: 'agree', label: 'Yes, use my answers' },
      { value: 'decline', label: 'Skip the health questions' },
    ],
  },
  b1_heart: {
    id: 'b1_heart',
    eyebrow: 'Health check',
    question:
      'Has a doctor ever told you that you have a heart condition — or do you get chest pain or serious dizziness when you’re active?',
    whyWeAsk: 'If so, we start extra gently while you check in with your GP.',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
    skippable: true,
    skipLabel: 'Prefer not to say',
  },
  b3_joints: {
    id: 'b3_joints',
    eyebrow: 'Health check',
    question: 'Any areas that regularly hurt or feel unreliable?',
    whyWeAsk:
      'We’ll start the related movements at their gentlest level. You can still stop or skip any move.',
    multiSelect: true,
    noneValue: 'none',
    options: [
      { value: 'knee', label: 'Knees' },
      { value: 'hip', label: 'Hips' },
      { value: 'shoulder', label: 'Shoulders' },
      { value: 'wrist', label: 'Wrists' },
      { value: 'low_back', label: 'Lower back' },
      { value: 'none', label: 'None of these' },
    ] satisfies readonly { value: JointFlag | 'none'; label: string }[],
  },
  b4_pelvic: {
    id: 'b4_pelvic',
    eyebrow: 'Health check',
    question:
      'Do you ever leak a little when you cough, sneeze, laugh or jump — or feel a heaviness in your pelvic area?',
    whyWeAsk: 'We’ll leave out the stomping finisher and keep your start low impact.',
    note: 'About half of women at this stage do — nothing to be embarrassed about.',
    options: [
      { value: 'often', label: 'Often' },
      { value: 'sometimes', label: 'Sometimes' },
      { value: 'never', label: 'Never' },
      { value: 'prefer_not_to_say', label: 'Prefer not to say' },
    ],
  },
  b5_balance: {
    id: 'b5_balance',
    eyebrow: 'Health check',
    question: 'Have you had a fall in the last year, or do you worry about your balance?',
    whyWeAsk: 'If so, single-leg moves keep a hand’s reach of support by default.',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
    skippable: true,
    skipLabel: 'Prefer not to say',
  },
  c1_stairs: {
    id: 'c1_stairs',
    eyebrow: 'Your setup',
    question: 'Do you have a low, stable bottom step with fixed support nearby?',
    whyWeAsk: 'We’ll use step exercises only when that setup is available; otherwise we swap them.',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
    skippable: true,
    skipLabel: 'Not sure yet',
  },
  c2_quiet: {
    id: 'c2_quiet',
    eyebrow: 'Your setup',
    question: 'Would you like to avoid stomping or impact sounds?',
    whyWeAsk: 'If so, we leave the stomping finisher out of your sessions.',
    options: [
      { value: 'yes', label: 'Yes, avoid stomping' },
      { value: 'no', label: 'No, moderate sound is fine' },
    ],
    skippable: true,
    skipLabel: 'Not sure yet',
  },
  assessment_offer: {
    id: 'assessment_offer',
    eyebrow: 'Your start',
    question: 'How would you like to begin?',
    whyWeAsk: 'Choose the start that feels right. You can stop or change your mind at any time.',
    note: 'No one sees this but you. It’s processed on your phone and never leaves it.',
    options: [
      { value: 'now', label: 'Let’s do it' },
      { value: 'after_first_workout', label: 'After one starter session' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Message screens
// ---------------------------------------------------------------------------

const MESSAGES: Record<OnboardingMessageStepId, OnboardingMessageContent> = {
  welcome: {
    id: 'welcome',
    eyebrow: `Welcome to ${BRAND.appName}`,
    title: 'Strength that fits your life',
    body: [
      'Voice-guided strength workouts for the menopause years — 20 to 25 minutes, at home, no equipment to start.',
      'A few short questions and your first session is ready.',
    ],
    continueLabel: 'Let’s get started',
    facts: [
      { value: '15 min', detail: 'First session' },
      { value: '3 planned', detail: '2 is enough' },
      { value: '8 min', detail: 'Movement check' },
    ],
  },
  b1_advisory: {
    id: 'b1_advisory',
    eyebrow: 'Health check',
    title: 'We’ll begin very gently',
    body: [
      'Worth a quick chat with your GP before ramping up — meanwhile we’ll begin very gently.',
      'The effort-based Movement Check-Up stays off while Gentle Start is active. Your gentle workouts remain available.',
    ],
    continueLabel: 'Got it — start gently',
  },
};

// ---------------------------------------------------------------------------
// Access
// ---------------------------------------------------------------------------

export function onboardingQuestionContent(id: OnboardingQuestionStepId): OnboardingQuestionContent {
  return QUESTIONS[id];
}

export function onboardingMessageContent(id: OnboardingMessageStepId): OnboardingMessageContent {
  return MESSAGES[id];
}

export function isOnboardingQuestionStep(id: OnboardingStepId): id is OnboardingQuestionStepId {
  return (ONBOARDING_QUESTION_STEPS as readonly string[]).includes(id);
}

/** Every user-facing string in the flow, for the claims-guardrail scan. */
export function allOnboardingCopyStrings(): string[] {
  const out: string[] = [];
  for (const question of Object.values(QUESTIONS)) {
    out.push(question.eyebrow, question.question, question.whyWeAsk);
    if (question.note) out.push(question.note);
    if (question.skipLabel) out.push(question.skipLabel);
    for (const option of question.options) {
      out.push(option.label);
      if (option.microcopy) out.push(option.microcopy);
    }
  }
  for (const message of Object.values(MESSAGES)) {
    out.push(message.eyebrow, message.title, ...message.body, message.continueLabel);
    if (message.secondaryLabel) out.push(message.secondaryLabel);
    for (const fact of message.facts ?? []) out.push(fact.value, fact.detail);
  }
  return out;
}
