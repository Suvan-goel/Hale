import type { PlatformPreference } from '@/config/site';

export const heroFocusCopy = {
  general:
    'If stairs feel harder, balance feels less automatic, or your body no longer moves like it used to, Hale helps you understand what has changed and what to work on next.',
  strength:
    'Hale starts with a simple camera check-up, then builds a home plan to help with the strength and power you use for chairs, stairs and everyday movement.',
  balance:
    'Hale starts with a simple camera check-up, then builds a home plan to help you practise steadiness, control and confidence in ordinary movement.',
  mobility:
    'Hale starts with a simple camera check-up, then builds a home plan to help you work on reaching, bending and moving more comfortably.',
} as const;

export type HeroFocus = keyof typeof heroFocusCopy;

export function normalizeHeroFocus(value: string | string[] | undefined): HeroFocus {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === 'strength' || raw === 'balance' || raw === 'mobility' ? raw : 'general';
}

export const heroProofPoints = [
  'Phone-camera Movement Check-Up',
  'No mirror view, only a clean skeleton',
  'Short voice-guided home sessions',
] as const;

export const trustStrip = [
  { title: 'From home', body: 'Use your phone, a sturdy chair and a wall or counter for support.' },
  { title: 'Around 20 minutes', body: 'Sessions are short enough to fit into ordinary weeks.' },
  { title: 'Three times per week', body: 'A steady routine without streak pressure or leaderboards.' },
  { title: 'Private by design', body: 'Hale shows a skeleton view during camera sessions, not a mirror.' },
] as const;

export const problemPoints = [
  'Getting up from a low chair takes more effort.',
  'Stairs feel harder than they used to.',
  'You feel stiff after sitting for a while.',
  'You pause before stepping off a curb or turning quickly.',
  'You worry about keeping your independence in the years ahead.',
] as const;

export const howItWorks = [
  {
    title: 'Do a Movement Check-Up',
    body: 'Prop up your phone and follow clear voice prompts through simple checks for strength, balance and mobility.',
  },
  {
    title: 'See what needs attention',
    body: 'Hale turns your results into plain focus areas, so you are not guessing what to work on.',
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
  body: 'This is an example of how Hale turns a check-up into plain next steps. Your own result depends on your movement check-up.',
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
    body: 'Your plan starts with the area that most needs attention: strength, balance or mobility.',
  },
  {
    title: 'Track change over time',
    body: 'Monthly re-checks help you see whether your routine is moving you in the right direction.',
  },
] as const;

export const credibilityPoints = [
  {
    title: 'Built from established movement checks',
    body: 'Hale uses simple movements that are commonly used to understand everyday strength, balance and mobility.',
  },
  {
    title: 'Designed for change over time',
    body: 'Monthly re-checks make progress easier to see than a one-off workout or a guess about how you feel.',
  },
  {
    title: 'Wellness language, not diagnosis',
    body: 'Results are explained as practical focus areas and movement-age style ranges where appropriate, not medical labels.',
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

export const progressLoop = [
  'Establish a starting point.',
  'Train consistently.',
  'Complete small check-ins.',
  'Re-test after the block.',
  'Begin the next appropriate block.',
] as const;

export const outcomeExamples = [
  'Walk and travel with more confidence.',
  'Keep stairs and chairs feeling manageable.',
  'Stay active with friends and family.',
  'Build a routine that supports an independent life.',
] as const;

export const differencePoints = [
  {
    title: 'More personal than exercise videos',
    body: 'Videos give everyone the same routine. Hale starts by checking what your body needs most.',
  },
  {
    title: 'Less intimidating than the gym',
    body: 'Sessions are made for real homes, with voice guidance and simple household setup.',
  },
  {
    title: 'Calmer than fitness apps',
    body: 'No streak shaming, leaderboards or public profiles. Just a steady plan and monthly re-checks.',
  },
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
      'Hale is a mobile app that checks your strength, balance and mobility with your phone camera, then gives you a simple home training plan.',
  },
  {
    question: 'Who is Hale designed for?',
    answer:
      'Hale is designed for adults around 45-65 who want a practical way to stay strong, steady and mobile. It is not for competitive fitness, medical diagnosis or treatment.',
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
      'Hale shows your strength, balance and mobility in plain language, highlights the area that needs the most attention, and turns that into your next home plan.',
  },
  {
    question: 'Will Hale give me a movement age?',
    answer:
      'Hale is designed to explain domain results in movement-age style ranges where appropriate. Those ranges are wellness guidance, not a diagnosis or an exact biological age.',
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
    question: 'Why not just follow exercise videos?',
    answer:
      'Exercise videos can be useful, but they usually give everyone the same routine. Hale starts with a check-up, then chooses a plan around your strength, balance and mobility.',
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
    question: 'Does this page collect payment details?',
    answer:
      'No. The beta signup form collects your email, optional first name and platform preference. If payment is part of a future offer, you will see the price before payment is collected.',
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
