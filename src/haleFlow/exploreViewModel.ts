import type { AvailableEquipment, MovementSafetyProfile } from '../adherence';
import {
  getExerciseLadder,
  listVisibleExerciseLadders,
  type ExerciseLadder,
  type ExerciseLevel,
  type MeasurementTier,
} from '../exercises';
import type { EquipmentTag } from '../movements';
import {
  DEFAULT_EQUIPMENT,
  generatePresetSession,
  listExtraSessionPresets,
  type EquipmentProfile,
} from '../training';
import type { LadderProgress, SessionTemplate, TrainingDomain } from '../training/workoutGeneration';
import type { AppSettings } from '../profile';

export interface ExtraSessionCard {
  id: string;
  title: string;
  body: string;
  durationLabel: string;
  focusLabel: string;
  equipmentLabel: string;
  disabled: boolean;
  disabledReason?: string;
}

export interface MovementLadderCard {
  id: string;
  title: string;
  body: string;
  currentLevelName: string;
  currentLevelLabel: string;
  domainLabel: string;
  equipmentLabel: string;
  measurementLabel: string;
}

export interface MovementLadderDetail extends MovementLadderCard {
  whyItMatters: string;
  currentLevel: LadderLevelView;
  easierLevel?: LadderLevelView;
  harderLevel?: LadderLevelView;
  levels: LadderLevelView[];
}

export interface LadderLevelView {
  id: string;
  name: string;
  levelLabel: string;
  equipmentLabel: string;
  measurementLabel: string;
  cameraLabel: string;
  instructions: string;
  isCurrent: boolean;
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

export interface ExploreLibrarySection {
  id: 'movement_checkup' | 'training_basics' | 'setup_safety';
  title: string;
  body: string;
  articles: LearnCard[];
}

export interface ExploreLibrary {
  featured: LearnCard;
  sections: ExploreLibrarySection[];
}

export interface EquipmentSetupSummary {
  availableLabel: string;
  missingOptionalLabel: string;
  phoneStandLabel: string;
}

export type LearnArticleId =
  | 'movement-checkup-guide'
  | 'chair-rise-strength'
  | 'balance-practice'
  | 'mobility-basics'
  | 'camera-setup'
  | 'resistance-band'
  | 'movement-discomfort'
  | 'monthly-retest'
  | 'insight-strength-balance-aging'
  | 'insight-sleep-recovery-rhythm'
  | 'insight-protein-meal-rhythm'
  | 'insight-walking-breaks';

const FEATURED_LEARN_ARTICLE_ID: LearnArticleId = 'movement-checkup-guide';

const EXPLORE_LIBRARY_SECTIONS: readonly {
  id: ExploreLibrarySection['id'];
  title: string;
  body: string;
  articleIds: readonly LearnArticleId[];
}[] = [
  {
    id: 'movement_checkup',
    title: 'Movement Check-Up guide',
    body: 'What Hale estimates, why setup matters, and how monthly re-tests shape the next block.',
    articleIds: ['camera-setup', 'monthly-retest'],
  },
  {
    id: 'training_basics',
    title: 'Training basics',
    body: 'Short references for the strength, balance, and mobility work in your plan.',
    articleIds: ['chair-rise-strength', 'balance-practice', 'mobility-basics'],
  },
  {
    id: 'setup_safety',
    title: 'Safety and setup',
    body: 'Practical notes for equipment, discomfort, and keeping sessions simple at home.',
    articleIds: ['movement-discomfort', 'resistance-band'],
  },
];

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
  'preset-no-equipment-strength': 'No-Optional-Equipment Strength',
};

const PRESET_REQUIRED_EQUIPMENT: Record<string, { tag: keyof EquipmentProfile; label: string }> = {
  'preset-band-upper-back': { tag: 'band', label: 'a resistance band' },
  'preset-stairs-confidence': { tag: 'stair', label: 'a bottom stair' },
};

export function getExtraSessionCards(input: {
  equipment?: EquipmentProfile | null;
  safetyProfile?: MovementSafetyProfile | null;
  ladderProgressById?: Record<string, LadderProgress>;
  today?: string | Date;
} = {}): ExtraSessionCard[] {
  const equipment = input.equipment ?? DEFAULT_EQUIPMENT;
  const availableEquipment = availableEquipmentFor({ equipment, safetyProfile: input.safetyProfile });
  return listExtraSessionPresets().map((preset) => {
    const required = PRESET_REQUIRED_EQUIPMENT[preset.id];
    const disabled = required ? !equipment[required.tag] : false;
    const generated = disabled
      ? null
      : generatePresetSession({
          presetId: preset.id,
          availableEquipment,
          ladderProgress: input.ladderProgressById ?? {},
          includeOptionalLevels: false,
          today: input.today,
        });
    return {
      id: preset.id,
      title: PRESET_DISPLAY_TITLES[preset.id] ?? preset.title,
      body: PRESET_BODY[preset.id] ?? 'Optional support outside the main 4-week block.',
      durationLabel: generated?.durationLabel ?? `About ${preset.estimatedMinutes} min`,
      focusLabel: focusLabel(preset.focusDomain),
      equipmentLabel: disabled ? `Needs ${required?.label}` : equipmentLabelForSession(generated?.exercises ?? [], preset),
      disabled,
      disabledReason: disabled && required ? `Needs ${required.label}` : undefined,
    };
  });
}

export function getMovementLadderCards(input: {
  ladderProgressById?: Record<string, LadderProgress>;
} = {}): MovementLadderCard[] {
  return listVisibleExerciseLadders(false).map((ladder) => {
    const current = currentLevelFor(ladder, input.ladderProgressById?.[ladder.id]);
    return {
      id: ladder.id,
      title: ladder.title,
      body: ladder.description,
      currentLevelName: current.name,
      currentLevelLabel: levelLabel(current),
      domainLabel: focusLabel(ladder.domain),
      equipmentLabel: equipmentLabelForLevels(ladder.levels),
      measurementLabel: measurementLabel(current.measurementTier),
    };
  });
}

export function getMovementLadderDetail(
  ladderId: string,
  ladderProgressById: Record<string, LadderProgress> = {}
): MovementLadderDetail | null {
  let source: ExerciseLadder;
  try {
    source = getExerciseLadder(ladderId);
  } catch {
    return null;
  }
  if (source.releaseStatus !== 'v1_core') return null;
  const ladder: ExerciseLadder = {
    ...source,
    levels: source.levels.filter((level) => level.releaseStatus === 'v1_core'),
  };
  if (ladder.levels.length === 0) return null;
  const current = currentLevelFor(ladder, ladderProgressById[ladder.id]);
  const currentIndex = Math.max(0, ladder.levels.findIndex((level) => level.id === current.id));
  const levels = ladder.levels.map((level) => levelView(level, level.id === current.id));
  const card = getMovementLadderCards({ ladderProgressById }).find((item) => item.id === ladder.id);
  return {
    id: ladder.id,
    title: ladder.title,
    body: ladder.description,
    whyItMatters: ladder.whyItMatters,
    currentLevelName: current.name,
    currentLevelLabel: levelLabel(current),
    domainLabel: focusLabel(ladder.domain),
    equipmentLabel: equipmentLabelForLevels(ladder.levels),
    measurementLabel: measurementLabel(current.measurementTier),
    currentLevel: levelView(current, true),
    easierLevel: currentIndex > 0 ? levelView(ladder.levels[currentIndex - 1], false) : undefined,
    harderLevel: currentIndex < ladder.levels.length - 1 ? levelView(ladder.levels[currentIndex + 1], false) : undefined,
    levels,
    ...(card ?? {}),
  };
}

export function getLearnCards(): LearnCard[] {
  return LEARN_ARTICLES.map(({ sections: _sections, ...card }) => card);
}

export function getLearnDetail(id: string): LearnDetail | null {
  return [...LEARN_ARTICLES, ...HEALTH_INSIGHT_ARTICLES].find((article) => article.id === id) ?? null;
}

export function getHealthInsightCards(): HealthInsightCard[] {
  return HEALTH_INSIGHT_ARTICLES.map((article) => ({
    id: article.id,
    title: article.title,
    body: article.body,
    readTimeLabel: article.readTimeLabel,
    categoryLabel: article.categoryLabel ?? 'Insights',
    authorName: article.authorName ?? 'Health professional',
    authorCredential: article.authorCredential ?? 'Clinical review',
    reviewedLabel: article.reviewedLabel ?? 'Reviewed',
  }));
}

export function getExploreLibrary(): ExploreLibrary {
  const featured = learnCardById(FEATURED_LEARN_ARTICLE_ID) ?? getLearnCards()[0];
  return {
    featured,
    sections: EXPLORE_LIBRARY_SECTIONS.map((section) => ({
      id: section.id,
      title: section.title,
      body: section.body,
      articles: section.articleIds.map((id) => learnCardById(id)).filter((card): card is LearnCard => !!card),
    })),
  };
}

export function getEquipmentSetupSummary({
  equipment = DEFAULT_EQUIPMENT,
  safetyProfile,
  settings,
}: {
  equipment?: EquipmentProfile | null;
  safetyProfile?: MovementSafetyProfile | null;
  settings?: AppSettings | null;
} = {}): EquipmentSetupSummary {
  const resolvedEquipment = equipment ?? DEFAULT_EQUIPMENT;
  const available = availableEquipmentFor({ equipment: resolvedEquipment, safetyProfile });
  const optional = [
    resolvedEquipment.stair ? 'bottom stair' : null,
    resolvedEquipment.band ? 'resistance band' : null,
    resolvedEquipment.miniBand ? 'mini band' : null,
    resolvedEquipment.load ? 'backpack or light weight' : null,
  ].filter((item): item is string => !!item);
  const missing = [
    resolvedEquipment.stair ? null : 'bottom stair',
    resolvedEquipment.band ? null : 'resistance band',
    resolvedEquipment.miniBand ? null : 'mini band',
    resolvedEquipment.load ? null : 'backpack or light weight',
  ].filter((item): item is string => !!item);
  const core = [
    available.includes('chair') ? 'stable chair' : null,
    available.includes('wall') ? 'wall or counter support' : null,
  ].filter((item): item is string => !!item);
  return {
    availableLabel: humanList([...core, ...optional]) || 'no support items marked',
    missingOptionalLabel: missing.length > 0 ? humanList(missing) : 'all optional items marked available',
    phoneStandLabel: settings?.phoneStandAvailable ? 'Phone stand available' : 'Phone stand not marked available',
  };
}

export function availableEquipmentFor({
  equipment = DEFAULT_EQUIPMENT,
  safetyProfile,
}: {
  equipment?: EquipmentProfile | null;
  safetyProfile?: MovementSafetyProfile | null;
}): AvailableEquipment[] {
  const resolvedEquipment = equipment ?? DEFAULT_EQUIPMENT;
  const baseEquipment = safetyProfile?.availableEquipment;
  const set = new Set<AvailableEquipment>(
    baseEquipment && baseEquipment.length > 0 ? baseEquipment : ['chair', 'wall']
  );
  if (set.size > 1) set.delete('none');
  if (resolvedEquipment.stair) set.add('stairs');
  else set.delete('stairs');
  if (resolvedEquipment.band) set.add('resistance_band');
  else set.delete('resistance_band');
  if (resolvedEquipment.miniBand) set.add('mini_band');
  else set.delete('mini_band');
  if (resolvedEquipment.load) set.add('backpack');
  else {
    set.delete('backpack');
    set.delete('dumbbells');
  }
  return Array.from(set);
}

function currentLevelFor(ladder: ExerciseLadder, progress?: LadderProgress): ExerciseLevel {
  const preferredId = progress?.currentLevelId ?? ladder.defaultLevelId;
  return ladder.levels.find((level) => level.id === preferredId) ?? ladder.levels[0];
}

function levelView(level: ExerciseLevel, isCurrent: boolean): LadderLevelView {
  return {
    id: level.id,
    name: level.name,
    levelLabel: levelLabel(level),
    equipmentLabel: equipmentLabel(level.equipment),
    measurementLabel: measurementLabel(level.measurementTier),
    cameraLabel: cameraLabel(level.cameraView),
    instructions: level.instructions,
    isCurrent,
  };
}

function equipmentLabelForSession(exercises: readonly { equipment: readonly string[] }[], preset: SessionTemplate): string {
  const tags = unique(exercises.flatMap((exercise) => exercise.equipment));
  if (tags.length > 0) return equipmentLabel(tags as EquipmentTag[]);
  const templateTags = preset.slots.flatMap((slot) => {
    if (slot.id.includes('band')) return ['long_band'];
    if (slot.id.includes('stairs')) return ['stair'];
    return [];
  });
  return equipmentLabel(templateTags as EquipmentTag[]);
}

function equipmentLabelForLevels(levels: readonly ExerciseLevel[]): string {
  return equipmentLabel(unique(levels.flatMap((level) => level.equipment)));
}

function equipmentLabel(tags: readonly string[]): string {
  const labels = unique(
    tags
      .filter((tag) => tag !== 'none' && tag !== 'floor')
      .map((tag) => {
        if (tag === 'chair') return 'chair';
        if (tag === 'cushion') return 'cushion';
        if (tag === 'wall' || tag === 'counter') return 'wall or counter';
        if (tag === 'stair') return 'bottom stair';
        if (tag === 'long_band' || tag === 'door_anchor') return 'resistance band';
        if (tag === 'mini_band') return 'mini band';
        if (tag === 'backpack_or_weight') return 'backpack or light weight';
        return String(tag).replace(/_/g, ' ');
      })
  );
  return humanList(labels) || 'No optional equipment';
}

function focusLabel(domain: TrainingDomain): string {
  if (domain === 'strength_power') return 'Strength';
  if (domain === 'balance_stability') return 'Balance';
  return 'Mobility';
}

function measurementLabel(tier: MeasurementTier): string {
  if (tier === 'measured') return 'Camera estimated';
  if (tier === 'camera_assisted') return 'Camera assisted';
  return 'Voice guided';
}

function cameraLabel(cameraView: ExerciseLevel['cameraView']): string {
  if (cameraView === 'front') return 'Front view';
  if (cameraView === 'side') return 'Side view';
  if (cameraView === 'side_oblique') return 'Side-oblique view';
  return 'No camera view needed';
}

function levelLabel(level: ExerciseLevel): string {
  return `Level ${level.level + 1}`;
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

function learnCardById(id: LearnArticleId): LearnCard | null {
  const detail = getLearnDetail(id);
  if (!detail) return null;
  const { sections: _sections, ...card } = detail;
  return card;
}

const HEALTH_INSIGHT_ARTICLES: readonly LearnDetail[] = [
  {
    id: 'insight-strength-balance-aging',
    title: 'Why strength and balance belong together',
    body: 'A calm look at how muscle work and steadiness practice support everyday confidence as we age.',
    readTimeLabel: '4 min',
    categoryLabel: 'Movement',
    authorName: 'Physical therapist',
    authorCredential: 'DPT',
    reviewedLabel: 'Reviewed Jun 2026',
    sections: [
      {
        title: 'Two systems, one routine',
        body: 'Strength helps you create force for stairs, chairs, and carrying. Balance helps you control that force when the surface, lighting, or pace changes.',
      },
      {
        title: 'Small doses count',
        body: 'Public-health guidance for older adults commonly includes aerobic activity, muscle-strengthening work, and balance practice. The useful version is the one you can repeat consistently.',
      },
      {
        title: 'Make it practical',
        body: 'A good week does not need to be complicated. Sit-to-stand practice, supported balance holds, walks, and comfortable mobility work can all support the same everyday goal.',
      },
    ],
  },
  {
    id: 'insight-sleep-recovery-rhythm',
    title: 'Sleep rhythm matters more than perfection',
    body: 'Recovery starts with repeatable sleep habits, not a flawless night every night.',
    readTimeLabel: '3 min',
    categoryLabel: 'Recovery',
    authorName: 'Physician',
    authorCredential: 'MD',
    reviewedLabel: 'Reviewed Jun 2026',
    sections: [
      {
        title: 'The pattern is the point',
        body: 'Most adults need a regular sleep window that leaves enough time for rest. A steady bedtime, morning light, and a calmer evening routine can make that window easier to protect.',
      },
      {
        title: 'Movement helps, timing matters',
        body: 'Regular physical activity can support sleep quality. If evening exercise makes you feel too alert, move harder sessions earlier and keep late movement gentle.',
      },
      {
        title: 'When to get help',
        body: 'If sleep is persistently difficult, very short, very long, or leaves you exhausted, it is worth discussing with a qualified clinician.',
      },
    ],
  },
  {
    id: 'insight-protein-meal-rhythm',
    title: 'A simple way to think about protein',
    body: 'Protein is one building block for maintaining muscle, especially when paired with regular strength work.',
    readTimeLabel: '3 min',
    categoryLabel: 'Nutrition',
    authorName: 'Registered dietitian',
    authorCredential: 'RD',
    reviewedLabel: 'Reviewed Jun 2026',
    sections: [
      {
        title: 'Spread it through the day',
        body: 'Many people find it easier to support muscle when protein appears at more than one meal instead of being left for dinner only.',
      },
      {
        title: 'Use familiar foods',
        body: 'Useful options can include yogurt, eggs, beans, lentils, fish, poultry, tofu, or other foods that fit your preferences and health needs.',
      },
      {
        title: 'Keep it personal',
        body: 'Nutrition needs change with medical history, appetite, medications, and preferences. Use this as general education, not a personal prescription.',
      },
    ],
  },
  {
    id: 'insight-walking-breaks',
    title: 'Why short walking breaks add up',
    body: 'Brief movement breaks can support energy and stiffness without turning the day into a workout.',
    readTimeLabel: '2 min',
    categoryLabel: 'Daily habits',
    authorName: 'Exercise physiologist',
    authorCredential: 'MS, ACSM-EP',
    reviewedLabel: 'Reviewed Jun 2026',
    sections: [
      {
        title: 'Lower the friction',
        body: 'A few minutes of walking after sitting can be easier to start than a formal workout. That makes it a useful habit on busy or low-energy days.',
      },
      {
        title: 'Pair it with something real',
        body: 'Attach a short walk to a natural cue: after lunch, after a phone call, or before the next cup of tea. Cues make the habit easier to remember.',
      },
      {
        title: 'Keep the pace kind',
        body: 'The goal is to refresh the body, not prove fitness. Choose a pace and route that feel steady and repeatable.',
      },
    ],
  },
];

const LEARN_ARTICLES: readonly LearnDetail[] = [
  {
    id: 'movement-checkup-guide',
    title: 'How the Movement Check-Up works',
    body: 'Hale uses the phone camera as a measuring tool, then turns the results into a focused 4-week block.',
    readTimeLabel: '3 min',
    sections: [
      {
        title: 'What Hale measures',
        body: 'The check-up looks at practical strength, balance, and mobility tasks. Each domain gets a home estimate so the next block has a clear suggested focus.',
      },
      {
        title: 'Camera as a measuring tool',
        body: 'Hale renders a clean skeleton outline and never shows self-view video. The camera estimates repeatable movement signals; it is not a form judge.',
      },
      {
        title: 'Why the monthly rhythm helps',
        body: 'A 4-week block gives training time to take hold. The next check-up adds another data point and helps Hale choose the next useful focus.',
      },
    ],
  },
  {
    id: 'chair-rise-strength',
    title: 'Why chair-rise strength matters',
    body: 'Chair-rise strength is a practical signal for staying capable in everyday life.',
    readTimeLabel: '2 min',
    sections: [
      {
        title: 'Everyday power',
        body: 'Standing from a chair asks your hips, thighs, ankles, and trunk to work together. Hale uses it because it is simple, repeatable, and meaningful at home.',
      },
      {
        title: 'What Hale watches',
        body: 'The camera follows your skeleton outline, counts clean chair rises, and tracks your relative rise speed over time. It is a trend, not a judgement.',
      },
    ],
  },
  {
    id: 'balance-practice',
    title: 'Why balance improves with practice',
    body: 'Balance responds well to calm, frequent practice with support nearby.',
    readTimeLabel: '2 min',
    sections: [
      {
        title: 'Steady inputs',
        body: 'Balance is your eyes, feet, joints, and attention working together. Short holds teach that system to become quieter and more reliable.',
      },
      {
        title: 'A safe setup',
        body: 'Hale keeps support close and progresses gradually. The aim is to feel steadier, not to prove anything on a difficult day.',
      },
    ],
  },
  {
    id: 'mobility-basics',
    title: 'How mobility work supports easier movement',
    body: 'Mobility practice keeps the plan useful on stiff days and supports the ranges Hale estimates.',
    readTimeLabel: '2 min',
    sections: [
      {
        title: 'Useful range, not contortion',
        body: 'Hale focuses on everyday ranges like reaching overhead and hinging toward the floor. The aim is comfortable access to movement you use often.',
      },
      {
        title: 'Small doses add up',
        body: 'Short mobility blocks can make strength and balance work feel smoother. Hale keeps the pace calm so the session remains repeatable.',
      },
    ],
  },
  {
    id: 'camera-setup',
    title: 'How to set up your camera',
    body: 'A consistent setup makes your Movement Check-Up more useful month to month.',
    readTimeLabel: '2 min',
    sections: [
      {
        title: 'Same spot, better trends',
        body: 'Place the phone around hip height, a few steps away, with your full body in view. Similar setup each time makes progress easier to compare.',
      },
      {
        title: 'Light and space',
        body: 'Use the main room light and clear a small area around you. Hale never shows video, only a clean skeleton outline.',
      },
    ],
  },
  {
    id: 'resistance-band',
    title: 'How to choose a resistance band',
    body: 'A light or medium band can unlock upper-back practice without bulky equipment.',
    readTimeLabel: '2 min',
    sections: [
      {
        title: 'Start simple',
        body: 'Choose a band that lets you move smoothly through the full range. You should finish a set feeling worked, not strained.',
      },
      {
        title: 'Useful additions',
        body: 'A door anchor is helpful for rows, but Hale can still adapt when you only have a basic loop or long band.',
      },
    ],
  },
  {
    id: 'movement-discomfort',
    title: 'What to do if a movement feels uncomfortable',
    body: 'Use the gentler path and keep the session useful.',
    readTimeLabel: '2 min',
    sections: [
      {
        title: 'Choose comfort',
        body: 'If a movement feels uncomfortable, stop that item and choose a gentler session next time. Hale can reduce sets and avoid areas you flag.',
      },
      {
        title: 'Support progress',
        body: 'A lighter day still supports the routine. The goal is to keep showing up in a way your body can trust.',
      },
    ],
  },
  {
    id: 'monthly-retest',
    title: 'Why re-testing monthly matters',
    body: 'A monthly Movement Check-Up turns training into visible progress.',
    readTimeLabel: '2 min',
    sections: [
      {
        title: 'Enough time to adapt',
        body: 'Four weeks gives your body time to respond while keeping the next check close enough to stay motivating.',
      },
      {
        title: 'A better next block',
        body: 'Each check-up helps Hale choose the next 4-week block so today stays clear: press Start and do the right session.',
      },
    ],
  },
];
