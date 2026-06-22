import type { PlatformPreference } from '@/config/site';

export const heroFocusCopy = {
  general:
    'Hale uses your phone camera for a private Movement Check-Up, then creates a four-week home plan focused on the strength, balance or mobility work that matters most.',
  strength:
    'Hale starts with a private Movement Check-Up, then builds a four-week home plan focused on strength and power for everyday movement.',
  balance:
    'Hale starts with a private Movement Check-Up, then builds a four-week home plan for steadiness and control from home.',
  mobility:
    'Hale starts with a private Movement Check-Up, then builds a four-week home plan for more comfortable everyday movement.',
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
  { title: 'From home', body: 'Phone camera, a chair, clear space and calm voice cues.' },
  { title: 'Around 20 minutes', body: 'Short enough to fit into ordinary weeks.' },
  { title: 'Three times per week', body: 'Built for routine, not all-or-nothing effort.' },
  { title: 'Minimal equipment', body: 'Zero-equipment substitutions stay available.' },
  { title: 'Built around your movement', body: 'Measurement first, training second.' },
] as const;

export const problemPoints = [
  'Stairs feel harder than they used to.',
  'You feel stiffer after sitting.',
  'Balance feels less automatic.',
  'You want to keep up on walks, trips and time with family.',
  'You want to remain capable without living in the gym.',
] as const;

export const howItWorks = [
  {
    title: 'Measure',
    body: 'Prop up your phone and complete simple strength, balance and mobility tests with voice guidance.',
  },
  {
    title: 'Train',
    body: 'Follow a four-week block built around your current focus, available space and home-friendly substitutions.',
  },
  {
    title: 'Re-test',
    body: 'Repeat the check-up monthly so the next block is guided by evidence, not guesswork.',
  },
] as const;

export const measurementDomains = [
  {
    title: 'Strength and power',
    body: 'Practical force for rising from a chair, using stairs and moving confidently through the day.',
  },
  {
    title: 'Balance',
    body: 'Steadiness, control and confidence during ordinary movement, with safety-first setup prompts.',
  },
  {
    title: 'Mobility',
    body: 'Comfortable range of motion for reaching, hinging and moving more freely.',
  },
] as const;

export const trainingMessages = [
  'Three guided sessions per week, around 20 minutes each.',
  'Zero-equipment options keep a missing item from blocking the session.',
  'Progressions stay practical, quiet and focused on everyday capability.',
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
    caption: 'Your next action, movement profile and session prompt in the app home rhythm.',
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
    caption: 'A personalised four-week block focused on the most relevant starting domain.',
    metric: '4 weeks',
    label: 'home block',
  },
  {
    title: 'Progress',
    caption: 'Domain-level history and re-test prompts without false precision.',
    metric: 'Monthly',
    label: 're-test',
  },
] as const;

export const betaValueList = [
  'Initial Movement Check-Up',
  'Personalised four-week training blocks',
  'Guided home sessions',
  'Monthly re-tests',
  'Beta-member pricing',
] as const;

export const betaTransparency = [
  'Early access while the product is still improving.',
  'Preferential pricing for beta members.',
  'A direct way to help shape Hale before launch.',
] as const;

export const trustDetails = [
  'Camera sessions show a clean skeleton, never a mirror.',
  'Camera movement analysis runs in the app on your device during sessions.',
  'No public leaderboards, streak-shaming or medical diagnosis language.',
] as const;

export const faqs = [
  {
    question: 'What is Hale?',
    answer:
      'Hale is a mobile app for adults who want to stay strong, steady and mobile as they age. It starts with a phone-camera Movement Check-Up and then gives you a guided home training block.',
  },
  {
    question: 'Who is Hale designed for?',
    answer:
      'Hale is designed primarily for adults around 45-65 who want a practical routine for maintaining everyday physical capability. It is not built for competitive fitness or medical diagnosis.',
  },
  {
    question: 'How does the Movement Check-Up work?',
    answer:
      'You prop up your phone, follow voice prompts, and complete controlled movement tests for strength, balance and mobility. Hale uses the camera as a measuring instrument and shows a skeleton view rather than self-view video.',
  },
  {
    question: 'What equipment do I need?',
    answer:
      'The beta is designed around a chair, wall, floor space and simple home setup. Exercises include zero-equipment options so a missing item does not block the session.',
  },
  {
    question: 'How much time does Hale require?',
    answer:
      'A typical training rhythm is around 20 minutes, three times per week, plus a monthly Movement Check-Up and smaller check-ins during the block.',
  },
  {
    question: 'Is Hale a medical product?',
    answer:
      'No. Hale is a general fitness and wellbeing product. It does not diagnose, treat or prevent medical conditions, and it is not a medical device.',
  },
  {
    question: 'What does being in beta mean?',
    answer:
      'Hale is in active beta testing. The core experience is available, but details may change and users may encounter occasional bugs while feedback shapes the product.',
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
