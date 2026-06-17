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
  sections: readonly { title: string; body: string }[];
}

export interface EquipmentSetupSummary {
  availableLabel: string;
  missingOptionalLabel: string;
  phoneStandLabel: string;
}

export type LearnArticleId =
  | 'chair-rise-strength'
  | 'balance-practice'
  | 'camera-setup'
  | 'resistance-band'
  | 'movement-discomfort'
  | 'monthly-retest';

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
  return LEARN_ARTICLES.find((article) => article.id === id) ?? null;
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
  if (tier === 'measured') return 'Camera measured';
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

const LEARN_ARTICLES: readonly LearnDetail[] = [
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
        title: 'Protect progress',
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
