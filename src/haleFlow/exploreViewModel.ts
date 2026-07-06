import type { AvailableEquipment, MovementSafetyProfile } from '../adherence';
import type { MenopauseStage } from '../profile/types';
import type { EquipmentTag } from '../movements';
import { generatePresetSession, listExtraSessionPresets } from '../training';
import { canonicalEquipmentFromSafetyProfile } from '../profile/equipment';
import {
  isStepUpEnvironmentConfirmed,
  movementCapabilitiesFromSafetyProfile,
} from '../profile/movementCapabilities';
import {
  equipmentLabel as equipmentLabelForTags,
  equipmentMissingLabels,
} from '../training/equipmentSafety';
import type { LadderProgress, SessionTemplate, TrainingDomain } from '../training/workoutGeneration';
import { extraSessionCardBody, extraSessionCardTitle, extraSessionDetailBody } from './extraSessionCopy';

import { BRAND } from '../brand';
export interface ExtraSessionCard {
  id: string;
  title: string;
  cardTitle: string;
  body: string;
  detailBody: string;
  durationLabel: string;
  focusLabel: string;
  equipmentLabel: string;
  disabled: boolean;
  disabledReason?: string;
}

export interface LearnCard {
  id: LearnArticleId;
  title: string;
  body: string;
  readTimeLabel: string;
}

export interface LearnDetail extends LearnCard {
  categoryLabel?: string;
  authorName?: string;
  authorCredential?: string;
  reviewedLabel?: string;
  sections: readonly { title: string; body: string }[];
}

export interface HealthInsightCard extends LearnCard {
  categoryLabel: string;
  authorName: string;
  authorCredential: string;
  reviewedLabel: string;
}

export type LearnArticleId =
  | 'insight-menopause-muscle'
  | 'insight-strength-balance-aging'
  | 'insight-sleep-recovery-rhythm'
  | 'insight-protein-meal-rhythm'
  | 'insight-walking-breaks';

const PRESET_BODY: Record<string, string> = {
  'preset-mobility-reset': 'A short reset for stiffness, travel days, or the day before a re-test.',
  'preset-gentle-restart': 'A calm way back in when you want a clean slate.',
  'preset-steady-balance': 'Focused balance and ankle support with a steady pace.',
  'preset-no-equipment-strength': 'Strength, balance, and mobility using the core home setup.',
  'preset-band-upper-back': 'Upper-back pulling work when a resistance band is available.',
  'preset-stairs-confidence': 'Step, ankle, and balance practice for everyday stair confidence.',
  'preset-quick-full-body': 'A concise strength, balance, and mobility session.',
};

const PRESET_DISPLAY_TITLES: Record<string, string> = {
  'preset-no-equipment-strength': 'Chair and wall strength',
  'preset-band-upper-back': 'Upper-back band work',
};

const PRESET_REQUIRED_EQUIPMENT: Record<string, { tags: EquipmentTag[] }> = {
  'preset-band-upper-back': { tags: ['long_band'] },
  'preset-stairs-confidence': { tags: ['stair', 'counter'] },
};

export function getExtraSessionCards(input: {
  safetyProfile?: MovementSafetyProfile | null;
  ladderProgressById?: Record<string, LadderProgress>;
  today?: string | Date;
} = {}): ExtraSessionCard[] {
  const availableEquipment = availableEquipmentFor({ safetyProfile: input.safetyProfile });
  const movementCapabilities = movementCapabilitiesFromSafetyProfile(input.safetyProfile);
  return listExtraSessionPresets().map((preset) => {
    const required = PRESET_REQUIRED_EQUIPMENT[preset.id];
    const missing = required ? equipmentMissingLabels(required.tags, availableEquipment) : [];
    const capabilityMissing = missing.length === 0 && preset.id === 'preset-stairs-confidence' && !isStepUpEnvironmentConfirmed(movementCapabilities)
      ? ['a step or stair']
      : [];
    const disabled = missing.length > 0 || capabilityMissing.length > 0;
    const generated = disabled
      ? null
      : generatePresetSession({
          presetId: preset.id,
          availableEquipment,
          movementCapabilities,
          dailyReadiness: 'ready',
          painAreas: [],
          dailyContextSource: 'user_daily_check',
          ladderProgress: input.ladderProgressById ?? {},
          today: input.today,
        });
    return {
      id: preset.id,
      title: PRESET_DISPLAY_TITLES[preset.id] ?? preset.title,
      cardTitle: extraSessionCardTitle(preset.id, PRESET_DISPLAY_TITLES[preset.id] ?? preset.title),
      body: extraSessionCardBody(preset.id, PRESET_BODY[preset.id] ?? 'Optional support outside the main 4-week block.'),
      detailBody: extraSessionDetailBody(preset.id, PRESET_BODY[preset.id] ?? 'Optional support outside the main 4-week block.'),
      durationLabel: generated?.durationLabel ?? `About ${preset.estimatedMinutes} min`,
      focusLabel: focusLabel(preset.focusDomain),
      equipmentLabel: disabled ? `Needs ${humanList([...missing, ...capabilityMissing])}` : equipmentLabelForSession(generated?.exercises ?? [], preset),
      disabled,
      disabledReason: disabled ? `Needs ${humanList([...missing, ...capabilityMissing])}` : undefined,
    };
  });
}

export function getLearnDetail(id: string): LearnDetail | null {
  return HEALTH_INSIGHT_ARTICLES.find((article) => article.id === id) ?? null;
}

export function getHealthInsightCards(options?: {
  menopauseStage?: MenopauseStage | null;
}): HealthInsightCard[] {
  const cards = HEALTH_INSIGHT_ARTICLES.map((article) => ({
    id: article.id,
    title: article.title,
    body: article.body,
    readTimeLabel: article.readTimeLabel,
    categoryLabel: article.categoryLabel ?? 'Insights',
    authorName: article.authorName ?? 'Health professional',
    authorCredential: article.authorCredential ?? 'Clinical review',
    reviewedLabel: article.reviewedLabel ?? 'Reviewed',
  }));
  // "Not sure" is a personalization signal, never a gap (founder rule of
  // record, F2 2026-07-06): the gentle educational path leads — the menopause
  // explainer is guaranteed first for these readers, whatever the authored
  // order becomes. No surface may re-ask or nag about the stage.
  if (options?.menopauseStage === 'neither_or_unsure') {
    const educational = cards.findIndex((card) => card.id === 'insight-menopause-muscle');
    if (educational > 0) cards.unshift(cards.splice(educational, 1)[0]);
  }
  return cards;
}

export function availableEquipmentFor({
  safetyProfile,
}: {
  safetyProfile?: MovementSafetyProfile | null;
}): AvailableEquipment[] {
  const canonical = canonicalEquipmentFromSafetyProfile(safetyProfile);
  return canonical.status === 'confirmed' ? canonical.capabilities.slice() : [];
}

function equipmentLabelForSession(exercises: readonly { equipment: readonly string[] }[], preset: SessionTemplate): string {
  const tags = unique(exercises.flatMap((exercise) => exercise.equipment));
  if (tags.length > 0) return equipmentLabelForTags(tags as EquipmentTag[]);
  const templateTags = preset.slots.flatMap((slot) => {
    if (slot.id.includes('band')) return ['long_band'];
    if (slot.id.includes('stairs')) return ['stair'];
    return [];
  });
  return equipmentLabelForTags(templateTags as EquipmentTag[]);
}

function focusLabel(domain: TrainingDomain): string {
  if (domain === 'strength_power') return 'Strength';
  if (domain === 'balance_stability') return 'Balance';
  return 'Mobility';
}

function humanList(items: readonly string[]): string {
  const clean = unique(items.filter(Boolean));
  if (clean.length === 0) return '';
  if (clean.length === 1) return clean[0];
  return `${clean.slice(0, -1).join(', ')} and ${clean[clean.length - 1]}`;
}

function unique<T>(items: readonly T[]): T[] {
  const out: T[] = [];
  for (const item of items) {
    if (!out.includes(item)) out.push(item);
  }
  return out;
}

const HEALTH_INSIGHT_ARTICLES: readonly LearnDetail[] = [
  {
    id: 'insight-menopause-muscle',
    title: 'Menopause and muscle: what changes, and what helps',
    body: 'Strength becomes easier to lose and harder to rebuild through the menopause transition. Training changes that math.',
    readTimeLabel: '5 min',
    categoryLabel: 'Menopause',
    authorName: 'Exercise physiologist',
    authorCredential: 'MS, ACSM-EP',
    // Founder-directed 2026-07-05: label matches the other articles' review
    // convention (see docs/decisions.md).
    reviewedLabel: 'Reviewed Jul 2026',
    sections: [
      {
        title: 'This stage moves faster',
        body: 'Through perimenopause and the years after, many women notice that strength changes more quickly than before: things feel heavier, recovery takes longer, and the same routine returns less. This is a normal, well-documented part of the transition — and it responds to training. The point of knowing is not worry; it is timing. Work you put in now counts more than at almost any other stage.',
      },
      {
        title: 'Strength work is the strongest lever',
        body: `Progressive strength training — regularly asking your muscles to do slightly more than they are used to — is the most consistent way to keep muscle and power through this stage. Power matters as much as raw strength: standing up from a chair without hands, catching your balance on an uneven pavement, climbing stairs without pulling on the rail. These are the abilities ${BRAND.appName} measures and trains.`,
      },
      {
        title: 'You do not need a gym to start',
        body: `Chair rises, supported squats, step-ups, hinges, and wall push-ups cover most of what matters, and each has an easier and a harder version. What makes it work is progression, not equipment: when a movement stops being challenging, the next level should ask a little more. ${BRAND.appName} moves you up that ladder gradually and steps back whenever your body asks for it.`,
      },
      {
        title: 'Protein and recovery still count',
        body: 'Training gives your body a reason to keep muscle; food and rest give it the means. Spreading protein across the day and protecting a repeatable sleep rhythm both support the same goal. The nutrition and sleep articles in this section go deeper on each.',
      },
      {
        title: `What ${BRAND.appName} measures — and what it does not`,
        body: `${BRAND.appName} uses the camera to measure functional strength, balance, and mobility, and compares your results with published values for women your age. It does not measure hormones or bone density, and it never diagnoses anything. Think of it as a regular, honest look at the abilities you use every day — and a plan that trains them.`,
      },
    ],
  },
  {
    id: 'insight-strength-balance-aging',
    title: 'Why strength and balance belong together',
    body: 'A calm look at how muscle work and steadiness practice support everyday confidence as we age.',
    readTimeLabel: '5 min',
    categoryLabel: 'Movement',
    authorName: 'Physical therapist',
    authorCredential: 'DPT',
    reviewedLabel: 'Reviewed Jun 2026',
    sections: [
      {
        title: 'Strength gives you options',
        body: 'Strength is what lets you stand from a chair, climb stairs, carry shopping, get up from the floor, and move with less hesitation. It is not only about lifting heavy things. For many adults in midlife and beyond, strength is the reserve that makes ordinary tasks feel less costly.',
      },
      {
        title: 'Balance helps you use that strength',
        body: `Strength without steadiness can feel hard to trust. Balance practice helps you control force when the surface changes, the lighting is dim, you turn quickly, or you are carrying something. The two systems are linked in daily life, so ${BRAND.appName} trains them together instead of treating them as separate projects.`,
      },
      {
        title: 'Public-health guidance is mixed on purpose',
        body: 'Guidelines for adults and older adults commonly point toward a blend of aerobic movement, muscle-strengthening work, and balance or functional practice. That mix exists because no single type of movement covers every need. Walking is valuable, but it does not replace strength work. Strength work is valuable, but it does not replace steadiness practice.',
      },
      {
        title: 'The home version can be simple',
        body: 'A useful week might include chair rises, supported squats, wall push-ups, balance holds near a counter, and walks broken into realistic chunks. None of this needs a gym. The goal is a repeatable set of movements that supports the things you already do.',
      },
      {
        title: `How ${BRAND.appName} uses the pairing`,
        body: `${BRAND.appName} looks at strength, balance, and mobility separately, then builds a block that still feels like a whole-body routine. If balance is the suggested focus, you will still see strength and mobility. If strength is the suggested focus, steadiness does not disappear. Bodies rarely change in neat categories.`,
      },
    ],
  },
  {
    id: 'insight-sleep-recovery-rhythm',
    title: 'Sleep rhythm matters more than perfection',
    body: 'Recovery starts with repeatable sleep habits, not a flawless night every night.',
    readTimeLabel: '5 min',
    categoryLabel: 'Recovery',
    authorName: 'Physician',
    authorCredential: 'MD',
    reviewedLabel: 'Reviewed Jun 2026',
    sections: [
      {
        title: 'Think rhythm before perfection',
        body: 'Sleep does not need to be perfect to support training. The first goal is a rhythm your body can predict: a fairly consistent wake time, enough time in bed, and a wind-down routine that starts before you are exhausted. A rough pattern repeated most nights usually helps more than chasing a perfect score.',
      },
      {
        title: 'Morning light is a strong signal',
        body: 'Getting outdoor light or bright window light early in the day helps anchor the body clock. It also pairs naturally with a short walk. This does not need to be intense. Even a calm morning loop can tell your system that the day has started.',
      },
      {
        title: 'Place harder movement earlier if needed',
        body: 'Many people sleep well after regular exercise, but timing is individual. If harder sessions leave you wired at night, move them earlier and keep evening movement gentle: mobility, an easy walk, or breathing-led stretching. Listen to the pattern over several nights rather than one unusual evening.',
      },
      {
        title: 'Protect the last hour',
        body: 'A useful evening routine is boring in the best way. Dim the lights, reduce demanding tasks, keep caffeine earlier in the day, and avoid using alcohol as a sleep tool. If screens are part of the evening, choose content that does not pull you into problem-solving mode.',
      },
      {
        title: 'Know when to ask for help',
        body: `If sleep is persistently short, restless, very long, or leaves you exhausted during normal daytime activity, it is worth speaking with a qualified clinician. ${BRAND.appName} can support movement habits, but sleep problems deserve proper attention when they keep repeating.`,
      },
    ],
  },
  {
    id: 'insight-protein-meal-rhythm',
    title: 'A simple way to think about protein',
    body: 'Protein is one building block for maintaining muscle, especially when paired with regular strength work.',
    readTimeLabel: '5 min',
    categoryLabel: 'Nutrition',
    authorName: 'Registered dietitian',
    authorCredential: 'RD',
    reviewedLabel: 'Reviewed Jun 2026',
    sections: [
      {
        title: 'Protein works with training',
        body: 'Protein supplies building blocks, but strength work gives the body a reason to use them. That pairing matters. A higher-protein meal pattern is not a substitute for movement, and movement is not a substitute for food. Together, they support the muscle you rely on for chairs, stairs, carrying, and balance reactions.',
      },
      {
        title: 'Spread it across the day',
        body: 'Many adults eat most of their protein at dinner. A simpler approach is to include a useful source at breakfast, lunch, and dinner when appetite allows. Spreading intake can make the day feel steadier and makes it easier to meet needs without one very large meal.',
      },
      {
        title: 'Use foods you already like',
        body: 'Useful options can include Greek yogurt, eggs, cottage cheese, fish, poultry, lean meat, tofu, tempeh, beans, lentils, soy milk, or protein-rich grains. The right choice depends on appetite, preferences, culture, budget, and health needs. Familiar food usually beats a complicated plan.',
      },
      {
        title: 'Make snacks do some work',
        body: 'If meals are small, a snack can help: yogurt with fruit, hummus with toast, a boiled egg, tofu in soup, tuna on crackers, or a smoothie with milk or soy milk. The point is not to snack constantly; it is to avoid leaving all the work to dinner.',
      },
      {
        title: 'Personal needs vary',
        body: 'Kidney concerns, digestive issues, medications, appetite changes, and weight changes can all affect nutrition advice. Use this article as general education. A registered dietitian or clinician can help tailor protein targets to your situation.',
      },
    ],
  },
  {
    id: 'insight-walking-breaks',
    title: 'Why short walking breaks add up',
    body: 'Brief movement breaks can support energy and stiffness without turning the day into a workout.',
    readTimeLabel: '4 min',
    categoryLabel: 'Daily habits',
    authorName: 'Exercise physiologist',
    authorCredential: 'MS, ACSM-EP',
    reviewedLabel: 'Reviewed Jun 2026',
    sections: [
      {
        title: 'Breaks lower the starting line',
        body: 'A walking break is not trying to replace a full session. Its strength is that it starts easily. Two to five minutes after sitting can loosen the hips, wake up the ankles, and shift your energy without requiring a change of clothes or a large block of time.',
      },
      {
        title: 'Use natural cues',
        body: 'Attach walking to something that already happens: after coffee, after lunch, after a phone call, before checking the post, or when a timer ends. Cues matter because they remove the decision. The easier the decision, the more often the habit survives a busy day.',
      },
      {
        title: 'Keep the route almost too easy',
        body: 'Choose a loop you can do without negotiation: around the room, down the hall, to the garden, or around the block. The route should feel safe, familiar, and repeatable. You can always do more, but the default should be easy enough to start.',
      },
      {
        title: 'Use breaks on low-energy days',
        body: `On days when a workout feels too much, walking breaks keep a thread of movement in the day. They also pair well with ${BRAND.appName} sessions. A short walk before training can help you arrive warmer and less stiff.`,
      },
      {
        title: 'Make it measurable without pressure',
        body: 'Try counting breaks rather than chasing steps. For example: one after breakfast, one after lunch, and one in the afternoon. That gives the habit a shape without turning the whole day into a target.',
      },
    ],
  },
];

