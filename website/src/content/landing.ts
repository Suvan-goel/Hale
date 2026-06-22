import type { PlatformPreference } from '@/config/site';

export const heroFocusCopy = {
  general:
    'Hale checks your strength, balance and mobility with your phone camera, then gives you a simple home plan built around what needs the most attention.',
  strength:
    'Hale checks how you move, then builds a four-week home plan to help with strength and power for everyday tasks.',
  balance:
    'Hale checks how you move, then builds a four-week home plan to help you practise steadiness and control.',
  mobility:
    'Hale checks how you move, then builds a four-week home plan to help you move more comfortably.',
} as const;

export type HeroFocus = keyof typeof heroFocusCopy;

export function normalizeHeroFocus(value: string | string[] | undefined): HeroFocus {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === 'strength' || raw === 'balance' || raw === 'mobility' ? raw : 'general';
}

export const heroProofPoints = [
  'Phone-camera check-up',
  'Voice-guided home sessions',
  'Monthly re-tests',
] as const;

export const trustStrip = [
  { title: 'From home', body: 'Phone camera, sturdy chair, wall or counter support, and calm voice cues.' },
  { title: 'Around 20 minutes', body: 'Short enough to fit into ordinary weeks.' },
  { title: 'Three times per week', body: 'Built for routine, not all-or-nothing effort.' },
  { title: 'Minimal household setup', body: 'Start with a sturdy chair and a wall or counter for support.' },
  { title: 'Built around your movement', body: 'Measurement first, training second.' },
] as const;

export const problemPoints = [
  'Stairs feel harder than they used to.',
  'You feel stiffer after sitting.',
  'Balance feels less automatic.',
  'You want to keep up on walks, trips and time with family.',
  'You want to stay active without living in the gym.',
] as const;

export const howItWorks = [
  {
    title: 'Check how you move',
    body: 'Prop up your phone and follow voice prompts through simple tests for strength, balance and mobility.',
  },
  {
    title: 'Follow your plan',
    body: 'Hale chooses a four-week home plan based on your results, your space and the equipment you have.',
  },
  {
    title: 'Re-check each month',
    body: 'Repeat the check-up to see what changed and decide what to work on next.',
  },
] as const;

export const measurementDomains = [
  {
    title: 'Strength and power',
    body: 'For getting up from chairs, climbing stairs and moving through the day with more confidence.',
  },
  {
    title: 'Balance',
    body: 'For feeling steadier when you turn, step off a curb or move on uneven ground.',
  },
  {
    title: 'Mobility',
    body: 'For reaching, bending and moving more comfortably in everyday life.',
  },
] as const;

export const trainingMessages = [
  'Three guided sessions a week, around 20 minutes each.',
  'Start with household support: a sturdy chair and a wall or counter.',
  'A long resistance band is recommended for fuller upper-body training and is required for pulling exercises.',
  'Gentle progressions that help you build a steady routine.',
] as const;

export const progressLoop = [
  'Establish a starting point.',
  'Train consistently.',
  'Complete small check-ins.',
  'Re-test after the block.',
  'Begin the next appropriate block.',
] as const;

export const outcomeExamples = [
  'Walk and travel with greater confidence.',
  'Keep using stairs comfortably.',
  'Get up from chairs and the floor more easily.',
  'Stay active with friends and family.',
  'Maintain a body that supports an independent life.',
] as const;

export const productTour = [
  {
    title: 'Today',
    caption: 'Your next session and movement profile in one place.',
    metric: '3/3',
    label: 'weekly sessions',
  },
  {
    title: 'Movement Check-Up',
    caption: 'Voice-guided camera setup and skeleton-only movement tests from home.',
    metric: '10 min',
    label: 'baseline ritual',
  },
  {
    title: 'Plan',
    caption: 'A four-week home plan based on your check-up results.',
    metric: '4 weeks',
    label: 'home block',
  },
  {
    title: 'Progress',
    caption: 'Simple progress history and monthly re-test prompts.',
    metric: 'Monthly',
    label: 're-test',
  },
] as const;

export const betaValueList = [
  'Phone-camera Movement Check-Up',
  'Personalised four-week home plan',
  'Voice-guided sessions',
  'Monthly re-tests',
  'Beta-member pricing',
] as const;

export const betaTransparency = [
  'Try the core check-up and training plan early.',
  'Tell us what is clear, confusing or missing.',
  'Get beta-member pricing before the regular launch price.',
] as const;

export const trustDetails = [
  'Camera sessions show a clean skeleton, never a mirror.',
  'Movement analysis runs on your device during sessions.',
  'No leaderboards, public profiles or streak pressure.',
] as const;

export const faqs = [
  {
    question: 'What is Hale?',
    answer:
      'Hale is a mobile app that checks your strength, balance and mobility with your phone camera, then gives you a home training plan.',
  },
  {
    question: 'Who is Hale designed for?',
    answer:
      'Hale is designed for adults around 45-65 who want a practical way to stay strong, steady and mobile. It is not for competitive fitness or medical diagnosis.',
  },
  {
    question: 'How does the Movement Check-Up work?',
    answer:
      'You prop up your phone, follow voice prompts and complete simple movement tests. Hale uses the camera as a measuring tool and shows a skeleton view, not self-view video.',
  },
  {
    question: 'What equipment do I need?',
    answer:
      'You can start with a sturdy chair and a wall or counter for support. No specialist gym equipment is needed to begin. A long resistance band is recommended for fuller upper-body training and is required for pulling exercises.',
  },
  {
    question: 'How much time does Hale require?',
    answer:
      'A typical week is three guided sessions of about 20 minutes, plus a monthly Movement Check-Up.',
  },
  {
    question: 'Is Hale a medical product?',
    answer:
      'No. Hale is a general fitness and wellbeing product. It does not diagnose, treat or prevent medical conditions, and it is not a medical device.',
  },
  {
    question: 'What does being in beta mean?',
    answer:
      'Hale is still improving. Beta members can try the core experience early, may see some changes, and can help shape what gets clearer before launch.',
  },
  {
    question: 'How does beta pricing work?',
    answer:
      'Beta members receive a substantial discount compared with the regular launch price. Exact pricing is shown when it is configured for the current beta offer.',
  },
  {
    question: 'Is Hale available on iPhone and Android?',
    answer:
      'Hale is being prepared for iPhone and Android beta access. When a store beta link is available, this page shows it. Otherwise, the signup form records your platform preference.',
  },
  {
    question: 'What happens if I feel pain or cannot perform a movement?',
    answer:
      'You should stop if you feel pain, dizziness or unsafe. Hale includes safety prompts and substitutions, but you should follow advice from a qualified professional if you are unsure what is appropriate for you.',
  },
] as const;

export const platformLabels: Record<PlatformPreference, string> = {
  iphone: 'iPhone',
  android: 'Android',
  either: 'Either',
};
