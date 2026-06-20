/**
 * Bundled "Learn" content — short, plain-language articles about healthy aging.
 * Local-only (no backend in V1), so the library ships with the app.
 *
 * Editorial rules mirror the product laws: wellness-side language only. We
 * talk about everyday capability and routine, not clinical outcomes.
 */

export type ArticleCategory = 'Strength' | 'Balance' | 'Mobility' | 'Everyday' | 'Mindset';

export interface Article {
  id: string;
  title: string;
  category: ArticleCategory;
  /** Estimated reading time in minutes. */
  readingMinutes: number;
  /** One-sentence teaser for the list. */
  excerpt: string;
  /** Body as an ordered list of paragraphs (kept as plain text — no markup). */
  body: string[];
}

export const ARTICLES: Article[] = [
  {
    id: 'why-leg-power',
    title: 'Why leg power matters more than you think',
    category: 'Strength',
    readingMinutes: 3,
    excerpt: 'The speed you stand up from a chair is one useful signal for everyday movement.',
    body: [
      'Of all the things we can estimate with a camera, how quickly you rise from a chair is a useful everyday signal. It reflects leg power — not just how strong your legs are, but how quickly they can produce that strength.',
      'Power tends to fade earlier than raw strength as we age, and it is the quality you lean on for the small, fast moments of daily life: catching yourself on a step, getting out of a low couch, crossing a road before the light changes.',
      'The encouraging part is that power responds well to practice. Standing up from a chair a little more briskly, a few times a day, is itself a form of training. Your Movement Check-Up tracks this as rise velocity, so you can watch it trend over the weeks.',
    ],
  },
  {
    id: 'balance-is-trainable',
    title: 'Balance is a skill, not a fixed trait',
    category: 'Balance',
    readingMinutes: 4,
    excerpt: 'Standing steady is something the body keeps learning, at any age.',
    body: [
      'It is easy to think of balance as something you either have or you do not. In reality it is a skill your body refines constantly, drawing on your eyes, your inner ear, and the sensors in your feet and joints.',
      'Like any skill, it sharpens with practice and softens with neglect. The good news is that practice can be gentle and ordinary: standing on one foot while the kettle boils, walking heel-to-toe along a hallway, closing your eyes for a few seconds while holding a steady surface.',
      'Always keep a counter or a wall within arm’s reach when you practise. The aim is to challenge your balance a little, not to test it. Small, frequent challenges are what teach the body to stay steady.',
    ],
  },
  {
    id: 'sitting-and-moving',
    title: 'The best movement is the one you keep doing',
    category: 'Everyday',
    readingMinutes: 3,
    excerpt: 'Consistency, not intensity, is what carries the benefit over years.',
    body: [
      'There is a quiet truth in movement: the routine you actually return to beats the perfect plan you abandon. A few minutes most days compounds in a way that an occasional heroic effort never does.',
      'This is why short, voice-guided sessions are built to fit into ordinary days — no equipment to find, no floor to get down to unless you choose. The lower the friction, the more likely you are to come back tomorrow.',
      'If you miss a day, simply pick it up again. Nothing resets, nothing is lost. The trend is what matters, and trends are forgiving of the occasional gap.',
    ],
  },
  {
    id: 'mobility-and-reach',
    title: 'Keeping your reach as the years pass',
    category: 'Mobility',
    readingMinutes: 3,
    excerpt: 'Being able to bend, hinge and reach keeps the whole day easier.',
    body: [
      'Mobility is the range your joints move through comfortably — reaching a high shelf, bending to tie a shoe, hinging at the hips to lift a bag. When that range narrows, daily tasks quietly become harder.',
      'Gentle, regular movement through your full available range helps preserve it. The point is not to force a stretch but to visit the edges of comfortable motion often, so the body keeps them available.',
      'Your check-up estimates a forward hinge and an overhead reach. Watching these stay similar or change over time helps Hale keep the plan useful.',
    ],
  },
  {
    id: 'evidence-over-streaks',
    title: 'Why we show you evidence, not streaks',
    category: 'Mindset',
    readingMinutes: 2,
    excerpt: 'Numbers that mean something beat badges that do not.',
    body: [
      'Some apps lean on streaks and badges to keep you coming back. We have deliberately left those out. They can turn a missed day into unnecessary guilt, and that is not the relationship we want you to have with your own movement.',
      'Instead we show you records that mean something — how your movement is trending across weeks and months. Evidence is a steadier motivator than guilt, and it respects that you are an adult making your own choices.',
      'Come back when it suits you. The records will be here, and they will help you understand how your body is moving.',
    ],
  },
];

export function getArticle(id: string): Article | undefined {
  return ARTICLES.find((a) => a.id === id);
}
