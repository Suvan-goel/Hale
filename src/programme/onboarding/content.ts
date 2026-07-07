/**
 * Onboarding content layer — onboarding-spec v0.2 §2–§3 under the 2026-07-06
 * rulings. EVERY user-facing string of the flow lives here, not in screens:
 * Stage B wording may get clinical-review edits and the whole flow gets a
 * brand-voice pass (both known open flags), so copy changes must never touch
 * flow or screen logic.
 *
 * Structure per rulings: A1 replaced by the existing LifeGoal question (C8);
 * B2 deferred with the C1/C2 package (Stage B = B1, B3, B4, B5); D1 keeps the
 * day picker with NO notification opt-in (C7); the assessment offer is
 * bypassed when Gentle Start is active (B1 yes/skipped).
 *
 * Claims discipline: nothing here may use fracture/osteoporosis/bone-density
 * language or any banned claim shape — pinned by content.test.ts with the
 * same regexes as copyGuardrails.
 */

import type { LifeGoalCategory, ActivityLevel } from '../../adherence';
import type { MenopauseStage } from '../../profile';
import type { JointFlag, Weekday } from '../types';

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
  'd1_days',
  'assessment_offer',
] as const;
export type OnboardingQuestionStepId = (typeof ONBOARDING_QUESTION_STEPS)[number];

export const ONBOARDING_MESSAGE_STEPS = [
  'welcome',
  'b_intro',
  'b1_advisory',
  'b_exit',
  'placement_reveal',
  'expectation_cta',
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
  /** Member of the Stage B block: shows progress dots (spec §3 scaffolding). */
  stageBIndex?: number;
}

export interface OnboardingMessageContent {
  id: OnboardingMessageStepId;
  title: string;
  body: readonly string[];
  continueLabel: string;
  secondaryLabel?: string;
}

// ---------------------------------------------------------------------------
// Questions (all copy placeholder pending brand-voice pass)
// ---------------------------------------------------------------------------

export const STAGE_B_QUESTION_COUNT = 4; // B1, B3, B4, B5 (B2 deferred)

const QUESTIONS: Record<OnboardingQuestionStepId, OnboardingQuestionContent> = {
  a1_life_goal: {
    id: 'a1_life_goal',
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
    question:
      'Has a doctor ever told you that you have a heart condition — or do you get chest pain or serious dizziness when you’re active?',
    whyWeAsk: 'If so, we start extra gently while you check in with your GP.',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
    skippable: true,
    skipLabel: 'Prefer not to say',
    stageBIndex: 1,
  },
  b3_joints: {
    id: 'b3_joints',
    question: 'Any joints that regularly hurt or feel unreliable?',
    whyWeAsk: 'We’ll pick kinder variations for those joints from day one.',
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
    stageBIndex: 2,
  },
  b4_pelvic: {
    id: 'b4_pelvic',
    question:
      'Do you ever leak a little when you cough, sneeze, laugh or jump — or feel a heaviness in your pelvic area?',
    whyWeAsk: 'We’ll choose a gentler finisher and point you to help that works.',
    note: 'About half of women at this stage do — nothing to be embarrassed about.',
    options: [
      { value: 'often', label: 'Often' },
      { value: 'sometimes', label: 'Sometimes' },
      { value: 'never', label: 'Never' },
      { value: 'prefer_not_to_say', label: 'Prefer not to say' },
    ],
    stageBIndex: 3,
  },
  b5_balance: {
    id: 'b5_balance',
    question: 'Have you had a fall in the last year, or do you worry about your balance?',
    whyWeAsk: 'If so, single-leg moves keep a hand’s reach of support by default.',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
    skippable: true,
    skipLabel: 'Prefer not to say',
    stageBIndex: 4,
  },
  c1_stairs: {
    id: 'c1_stairs',
    question: 'Do you have stairs where you’ll work out?',
    whyWeAsk: 'A few exercises use the bottom step — we’ll swap them if not.',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
    skippable: true,
    skipLabel: 'Not sure yet',
  },
  c2_quiet: {
    id: 'c2_quiet',
    question: 'Do your workouts need to be quiet — downstairs neighbours, sleeping family?',
    whyWeAsk: 'We’ll keep every move neighbour-friendly.',
    options: [
      { value: 'yes', label: 'Yes, keep it quiet' },
      { value: 'no', label: 'No, sound is fine' },
    ],
    skippable: true,
    skipLabel: 'Not sure yet',
  },
  d1_days: {
    id: 'd1_days',
    // Honesty ruling 2026-07-07: nothing schedules around these days yet, so
    // the "why" claims only the rhythm; scheduling copy returns with the
    // local-notifications proposal.
    question: 'Which three days usually suit a short workout?',
    whyWeAsk: 'Three short sessions a week is the rhythm — picking days makes it real.',
    multiSelect: true,
    options: [
      { value: 'mon', label: 'Monday' },
      { value: 'tue', label: 'Tuesday' },
      { value: 'wed', label: 'Wednesday' },
      { value: 'thu', label: 'Thursday' },
      { value: 'fri', label: 'Friday' },
      { value: 'sat', label: 'Saturday' },
      { value: 'sun', label: 'Sunday' },
    ] satisfies readonly { value: Weekday; label: string }[],
  },
  assessment_offer: {
    id: 'assessment_offer',
    question: 'Two minutes of moving so your programme fits you exactly?',
    whyWeAsk: 'It sets your starting levels precisely — and it’s entirely optional.',
    note: 'No one sees this but you. It’s processed on your phone and never leaves it.',
    options: [
      { value: 'now', label: 'Let’s do it' },
      { value: 'after_first_workout', label: 'After my first workout' },
      { value: 'skip', label: 'Skip for now' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Message screens
// ---------------------------------------------------------------------------

const MESSAGES: Record<OnboardingMessageStepId, OnboardingMessageContent> = {
  welcome: {
    id: 'welcome',
    title: 'Strength that fits your life',
    body: [
      'Voice-guided strength workouts for the menopause years — 20 to 25 minutes, at home, no equipment to start.',
      'A few quick taps and your first session is ready.',
    ],
    continueLabel: 'Let’s get started',
  },
  b_intro: {
    id: 'b_intro',
    title: 'Quick safety tune-up',
    body: ['Four taps, about 30 seconds. This is how we make the programme yours.'],
    continueLabel: 'OK',
  },
  b1_advisory: {
    id: 'b1_advisory',
    title: 'We’ll begin very gently',
    body: [
      'Worth a quick chat with your GP before ramping up — meanwhile we’ll begin very gently.',
      'Everything stays available; we simply pace the first weeks with extra care.',
    ],
    continueLabel: 'Got it — start gently',
  },
  b_exit: {
    id: 'b_exit',
    title: 'That’s the health stuff done',
    body: ['Everything from here is about what you can do.'],
    continueLabel: 'Continue',
  },
  placement_reveal: {
    id: 'placement_reveal',
    title: 'Your starting levels are set',
    body: [
      'Every movement starts at a level chosen for you — deliberately comfortable, ready to build.',
    ],
    continueLabel: 'Show me',
  },
  expectation_cta: {
    id: 'expectation_cta',
    title: 'Here’s how this works',
    body: [
      'We start gently on purpose. Your only job this month is showing up.',
      'Sessions are 20–25 minutes, voice-guided — prop your phone anywhere and just move.',
      'Every few weeks, a two-minute movement check shows you exactly how much stronger you’re getting.',
    ],
    continueLabel: 'Start your first session now — 15 minutes',
    secondaryLabel: 'Schedule it instead',
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
    out.push(question.question, question.whyWeAsk);
    if (question.note) out.push(question.note);
    if (question.skipLabel) out.push(question.skipLabel);
    for (const option of question.options) {
      out.push(option.label);
      if (option.microcopy) out.push(option.microcopy);
    }
  }
  for (const message of Object.values(MESSAGES)) {
    out.push(message.title, ...message.body, message.continueLabel);
    if (message.secondaryLabel) out.push(message.secondaryLabel);
  }
  return out;
}
