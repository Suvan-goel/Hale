/**
 * Onboarding field content — onboarding-spec v0.2 §2–§3 under the 2026-07-06
 * rulings and the four-surface MVP consolidation (2026-07-13). Safety-field
 * wording stays centralized here for clinical review; screen framing and CTA
 * copy live with the presentation that composes these fields.
 *
 * Structure: onboarding asks for one retention anchor, the heart answer needed
 * for check-up access, and one concise joint-comfort answer that protects
 * placement. The first health question carries the required local-use
 * disclosure; choosing an answer is the affirmative action. Balance starts
 * with temporary support until the baseline check-up resolves it. Everything
 * else is deferred. Every route reaches one final start surface.
 *
 * Claims discipline: nothing here may use fracture/osteoporosis/bone-density
 * language or any banned claim shape — pinned by content.test.ts with the
 * same regexes as copyGuardrails.
 */

import { LIFE_GOAL_PRESETS } from '../../adherence';
import { BRAND } from '../../brand';
import type { JointFlag } from '../types';

// ---------------------------------------------------------------------------
// Step ids
// ---------------------------------------------------------------------------

export const ONBOARDING_QUESTION_STEPS = [
  'a1_life_goal',
  'b1_heart',
  'b3_joints',
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
}

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

const QUESTIONS: Record<OnboardingQuestionStepId, OnboardingQuestionContent> = {
  a1_life_goal: {
    id: 'a1_life_goal',
    eyebrow: 'Your strength now',
    question: 'What would feeling stronger in the menopause years mean to you?',
    whyWeAsk: `Choose what feels most useful right now. ${BRAND.appName} uses it to keep your 12 weeks relevant to you.`,
    options: LIFE_GOAL_PRESETS.map(({ category, label }) => ({ value: category, label })),
    skippable: true,
    skipLabel: 'I’ll decide later',
  },
  b1_heart: {
    id: 'b1_heart',
    eyebrow: 'Safety check · 1 of 2',
    question:
      'Has a doctor told you that you have a heart condition, or do you get chest pain or serious dizziness when active?',
    whyWeAsk: 'This decides whether you need to complete a safety step before your starting Movement Check-Up.',
    note:
      `By choosing an answer, you agree to ${BRAND.appName} using this and your next joint-comfort answer on this phone to tailor your start. They are never uploaded, sold or shared, and can be reviewed or removed in Settings.`,
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
  b3_joints: {
    id: 'b3_joints',
    eyebrow: 'Safety check · 2 of 2',
    question: 'Any areas that regularly hurt or feel unreliable?',
    whyWeAsk: 'We keep the related movements at their gentlest level after your check-up.',
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
    skippable: true,
    skipLabel: 'Prefer not to say',
  },
  assessment_offer: {
    id: 'assessment_offer',
    eyebrow: 'Your start',
    question: 'Your starting check-up is next',
    whyWeAsk: `Measure Strength and Balance before Week 1, so ${BRAND.appName} can choose your starting focus.`,
    note: 'The session preview is not a workout and adds nothing to your programme history.',
    options: [
      { value: 'now', label: 'Do my starting check-up' },
      { value: 'preview', label: 'See how a session works' },
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
    title: 'Strength for the menopause years',
    body: [
      'A private 12-week programme with voice-guided sessions at home.',
      'Repeat the same Movement Check-Up at weeks 4, 8 and 12 to see how your own Strength and Balance results change.',
      'Choose what matters to you, take a short safety check, and your first step is ready.',
    ],
    continueLabel: 'Let’s get started',
  },
  b1_advisory: {
    id: 'b1_advisory',
    eyebrow: 'Health check',
    title: 'Complete this safety step first',
    body: [
      'Before an effort-based Movement Check-Up, speak with your GP or another appropriate clinician about taking part.',
      'Return when you have done that. Your starting Movement Check-Up will still come before Week 1.',
    ],
    continueLabel: 'I’ve completed the safety step',
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
  }
  return out;
}
