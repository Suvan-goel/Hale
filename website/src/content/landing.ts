import type { PlatformPreference } from '@/config/site';

export const heroFocusCopy = {
  general:
    'Muscle and strength change faster through the menopause years. Hale measures where you stand today, then builds a simple home plan for the strength, balance and mobility you use every day.',
  strength:
    'Hale starts with a simple camera check-up, then builds a home plan for the strength and power that change fastest through the menopause years — chairs, stairs and everyday carrying.',
  balance:
    'Hale starts with a simple camera check-up, then builds a home plan to help you practise steadiness, control and confidence through the menopause years.',
  mobility:
    'Hale starts with a simple camera check-up, then builds a home plan to help you keep reaching, bending and moving comfortably through the menopause years.',
} as const;

export type HeroFocus = keyof typeof heroFocusCopy;

export function normalizeHeroFocus(value: string | string[] | undefined): HeroFocus {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === 'strength' || raw === 'balance' || raw === 'mobility' ? raw : 'general';
}

export const trustStrip = [
  { title: 'From home', body: 'Use your phone, a sturdy chair and a wall or counter for support.' },
  { title: 'Around 20 minutes', body: 'Sessions are short enough to fit into ordinary weeks.' },
  { title: 'Three times per week', body: 'A steady routine without streak pressure or leaderboards.' },
  { title: 'Private by design', body: 'Hale shows a skeleton view during camera sessions, not a mirror.' },
] as const;

export const problemPoints = [
  'Getting up from a low chair takes more effort.',
  'Stairs feel harder than they used to.',
  'Strength seems to change faster than it did a few years ago.',
  'You pause before stepping off a curb or turning quickly.',
  'You want to stay strong and independent in the years ahead.',
] as const;

export const howItWorks = [
  {
    title: 'Do a Movement Check-Up',
    body: 'Prop up your phone and follow clear voice prompts through simple checks for strength, balance and mobility.',
  },
  {
    title: 'See your Strength Profile',
    body: 'Hale turns your results into a Strength Profile with a suggested focus, so you are not guessing where to start.',
  },
  {
    title: 'Train and re-check',
    body: 'Follow short home sessions, then repeat the check-up each month to see what changed.',
  },
] as const;

export const checkupActivities = [
  {
    title: 'Guided setup',
    body: 'Hale helps you prop up your phone, stand where you can be seen and get ready before the check-up starts.',
  },
  {
    title: 'Chair stands',
    body: 'Sit and stand from a sturdy chair so Hale can set a starting point for lower-body strength and power.',
  },
  {
    title: 'Balance holds',
    body: 'Hold simple balance positions near a wall or counter while Hale looks at steadiness.',
  },
  {
    title: 'Reach and bend checks',
    body: 'Raise, reach or bend through comfortable ranges so Hale can understand mobility.',
  },
] as const;

export const exampleResult = {
  eyebrow: 'Example result',
  title: 'Your main focus: Balance',
  body: 'This is an example of how Hale turns a check-up into a Strength Profile with plain next steps. Your own result depends on your movement check-up.',
  domains: [
    {
      label: 'Strength',
      value: 'Starting point set',
      body: 'Chair-stand results help Hale choose lower-body work at the right level.',
    },
    {
      label: 'Balance',
      value: 'Needs attention',
      body: 'Balance checks suggest starting with steadiness and controlled strength.',
    },
    {
      label: 'Mobility',
      value: 'Keep practising',
      body: 'Reach and bend checks stay in the plan so mobility does not get ignored.',
    },
  ],
  plan: {
    label: 'Next plan',
    title: 'Steady strength at home',
    body: 'Three short sessions each week, then re-check at the end of the block.',
  },
} as const;

export const measurementDomains = [
  {
    title: 'Strength and power',
    body: 'For standing from chairs, climbing stairs and carrying things without every task feeling like a workout.',
  },
  {
    title: 'Balance',
    body: 'For feeling steadier when you turn, step off a curb, walk on uneven ground or move in a busy room.',
  },
  {
    title: 'Mobility',
    body: 'For reaching, bending, dressing and moving through the day with less stiffness.',
  },
] as const;

export const reframePrinciples = [
  {
    title: 'Measure first',
    body: 'Hale begins with how your body moves today, not a generic workout chosen for everyone.',
  },
  {
    title: 'Train what matters',
    body: 'Your plan starts with a useful focus: strength, balance or mobility.',
  },
  {
    title: 'Track change over time',
    body: 'Monthly re-checks help you see whether your routine is moving you in the right direction.',
  },
] as const;

export const credibilityPoints = [
  {
    title: 'Built from established movement checks',
    body: 'Hale uses simple movements that are commonly used to understand everyday strength, balance and mobility, compared with published values for your age and sex.',
  },
  {
    title: 'Designed for change over time',
    body: 'Monthly re-checks make progress easier to see than a one-off workout or a guess about how you feel.',
  },
  {
    title: 'Wellness language, not medical labels',
    body: 'Results are explained as a Strength Profile with source-backed chair-stand ranges where available, not medical labels.',
  },
] as const;

export const trainingMessages = [
  'Three guided sessions a week, around 20 minutes each.',
  'Start with household support: a sturdy chair and a wall or counter.',
  'A long resistance band is recommended for fuller upper-body training and is required for pulling exercises.',
  'Gentle progressions that help you build a steady routine without gym pressure.',
] as const;

export const firstMonthPlan = [
  {
    title: 'Start with your check-up',
    body: 'Set a baseline for strength, balance and mobility from home.',
  },
  {
    title: 'Follow three short sessions each week',
    body: 'Hale guides the session by voice so you can keep moving without handling the phone.',
  },
  {
    title: 'Re-check at the end of the block',
    body: 'See what changed and begin the next plan with a clearer starting point.',
  },
] as const;

export const founderNote = {
  eyebrow: 'Why we built Hale',
  quote:
    'We spent a year building camera-based movement technology for people who were already fit and already comfortable in a gym. The more useful problem was the one nobody was building for: giving women in the menopause years an honest, private way to see how their body is actually changing, and a calm plan to do something about it.',
  attribution: 'The team building Hale',
} as const;

export const valueCase = {
  title: 'A small monthly habit, built around a large question.',
  costComparison:
    'A full year of Hale costs less than a single one-off physiotherapy or personal-training session — for a plan that keeps measuring and adjusting every week, not just once.',
} as const;

export const finalCta = {
  title: 'Start with a clearer view of how your strength is changing.',
  body: 'One check-up sets your baseline. A calm, voice-guided plan does the rest.',
} as const;

export const betaLifetimeNote =
  'Beta members keep their beta price for life, even after Hale leaves beta and the regular price goes live.';

export const betaValueList = [
  'Phone-camera Movement Check-Up',
  'Personalised four-week home strength plan',
  'Voice-guided sessions',
  'Monthly re-tests',
  'Beta-member pricing, kept for life',
] as const;

export const betaReassurance = [
  'The signup form asks for your email, optional first name and platform preference only.',
  'Beta features may change as we learn what is clear, helpful or confusing.',
  'If payment is part of an offer, you will see the price before payment is collected.',
] as const;

export const trustDetails = [
  'Camera sessions show a clean skeleton view, never a mirror.',
  'The camera is used as a measuring tool during guided sessions.',
  'No leaderboards, public profiles or streak pressure.',
] as const;

export const faqs = [
  {
    question: 'What is Hale?',
    answer:
      'Hale is a mobile app that checks your strength, balance and mobility with your phone camera, then gives you a simple home training plan built around the menopause years.',
  },
  {
    question: 'Who is Hale designed for?',
    answer:
      'Hale is designed for women around 40-60 going through perimenopause and menopause who want a practical way to stay strong, steady and mobile. It is not for competitive fitness or medical care.',
  },
  {
    question: 'Is Hale only for women?',
    answer:
      'No. Hale leads with the menopause years because that is when muscle and strength tend to change fastest, but men are fully supported — results are always compared with published values for your age and sex.',
  },
  {
    question: 'What does Hale not measure?',
    answer:
      'Hale does not measure bone density or hormones. It measures how you move — everyday strength, balance and mobility — and turns that into a simple home plan. For questions about your health, speak to a qualified professional.',
  },
  {
    question: 'How does the Movement Check-Up work?',
    answer:
      'You prop up your phone, follow voice prompts and complete simple movement tests. Hale uses the camera as a measuring tool and shows a skeleton view, not self-view video.',
  },
  {
    question: 'What movements are in the check-up?',
    answer:
      'The check-up uses simple movements such as chair stands, balance holds, and reach or bend checks. Hale guides the setup and only asks for movements that fit the check-up flow.',
  },
  {
    question: 'What results will I see?',
    answer:
      'Hale shows your strength, balance and mobility as a Strength Profile in plain language, suggests a focus, and turns that into your next home plan.',
  },
  {
    question: 'What equipment do I need?',
    answer:
      'You can start with a sturdy chair and a wall or counter for support. No specialist gym equipment is needed to begin. A long resistance band is recommended for fuller upper-body training and is required for pulling exercises.',
  },
  {
    question: 'Do I have to see myself on camera?',
    answer:
      'No. Hale is designed around a clean skeleton view, not a self-view mirror. The camera is there to measure movement, not to judge how you look.',
  },
  {
    question: 'How much time does Hale require?',
    answer:
      'A typical week is three guided sessions of about 20 minutes, plus a monthly Movement Check-Up.',
  },
  {
    question: 'Is Hale a medical product?',
    answer:
      'No. Hale is a general fitness and wellbeing product. It is not medical care, and it is not a medical device.',
  },
  {
    question: 'How does beta pricing work?',
    answer:
      'Beta members receive a substantial discount compared with the regular launch price, and keep that beta price for life, even after Hale leaves beta.',
  },
  {
    question: 'Does this page collect payment details?',
    answer:
      'No. The beta signup form collects your email, optional first name and platform preference. If payment is part of a future offer, you will see the price before payment is collected.',
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
