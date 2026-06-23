import type { AvailableEquipment, MovementSafetyProfile } from '../adherence';
import {
  availableLevelsForRelease,
  effectiveLevelIdForControlledBetaProgression,
  getControlledBetaProgressionPolicy,
  getExerciseLadder,
  ladderPresentationForLadder,
  listExerciseLadders,
  type ExerciseLadder,
  type ExerciseLevel,
  type MeasurementTier,
} from '../exercises';
import type { EquipmentTag } from '../movements';
import {
  generatePresetSession,
  listExtraSessionPresets,
  type EquipmentProfile,
  type PersistedGeneratedSessionSummary,
} from '../training';
import {
  collectionCoverageSummary,
  collectionExposuresFromGeneratedSessionSummaries,
  type CollectionCoverageSummary,
} from '../training/collectionSelection';
import { discomfortConstraintForAreas } from '../training/dailyTrainingContext';
import { canonicalEquipmentFromSafetyProfile } from '../profile/equipment';
import {
  isStepUpEnvironmentConfirmed,
  movementCapabilitiesFromSafetyProfile,
  type NormalizedMovementCapabilityProfile,
} from '../profile/movementCapabilities';
import {
  equipmentLabel as equipmentLabelForTags,
  equipmentMissingLabels,
  equipmentSupportsTags,
} from '../training/equipmentSafety';
import { movementCapabilitySupportsLevel } from '../training/movementCapabilitySafety';
import {
  exerciseSafetySetupText,
  exerciseSafetySummaryText,
} from '../training/safetyCues';
import type { LadderProgress, SessionTemplate, TrainingDomain } from '../training/workoutGeneration';
import type { AppSettings } from '../profile';
import { extraSessionCardBody, extraSessionCardTitle, extraSessionDetailBody } from './extraSessionCopy';

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

export interface MovementLadderCard {
  id: string;
  title: string;
  body: string;
  currentLevelName: string;
  currentLevelLabel: string;
  showCurrentLevel: boolean;
  presentationMode: 'levels' | 'movement_set' | 'collection';
  listTitle: string;
  coverageLabel?: string;
  varietyLabel?: string;
  domainLabel: string;
  equipmentLabel: string;
  measurementLabel: string;
}

export interface MovementLadderDetail extends MovementLadderCard {
  whyItMatters: string;
  whyItHelps: string;
  beforeStartItems: string[];
  watchText: string;
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
  setupNote?: string;
  safetyNote?: string;
  measurementNote?: string;
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
    title: 'Your check-up guide',
    body: 'Learn what Hale checks, how to set up your camera, and why you repeat the check-up each month.',
    articleIds: ['camera-setup', 'monthly-retest'],
  },
  {
    id: 'training_basics',
    title: 'Training basics',
    body: 'Simple guides for the strength, balance, and mobility work in your plan.',
    articleIds: ['chair-rise-strength', 'balance-practice', 'mobility-basics'],
  },
  {
    id: 'setup_safety',
    title: 'Safety and setup',
    body: 'Simple tips for equipment, discomfort, and safe setup at home.',
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
  'preset-no-equipment-strength': 'Chair and wall strength',
  'preset-band-upper-back': 'Upper-back band work',
};

const PRESET_REQUIRED_EQUIPMENT: Record<string, { tags: EquipmentTag[] }> = {
  'preset-band-upper-back': { tags: ['long_band'] },
  'preset-stairs-confidence': { tags: ['stair', 'counter'] },
};

const LADDER_CARD_BODY: Record<string, string> = {
  'sit-to-stand': 'Build chair-rise strength for standing from everyday seats.',
  squat: 'Practise controlled lowering for lifting, reaching down, and gardening.',
  'step-up': 'Use the lowest stable step to build stair strength with support nearby.',
  'heel-toe-raise': 'Build calf and ankle control for walking rhythm, steps, and balance reactions.',
  push: 'Train wall or incline pushing for getting up from surfaces and daily tasks.',
  'pull-upper-back': 'Use band rows and pull-aparts for upper-back strength and shoulder balance.',
  'hinge-glutes': 'Practise hip-hinge control for reaching down and lifting with confidence.',
  'shoulder-reach-press': 'Build comfortable overhead reach, with band pressing only when available.',
  balance: 'Practise steady holds near support before harder stance options.',
  'lateral-stability': 'Train side steps and marching so turns and obstacles feel more familiar.',
  'mobility-flexibility': 'Use chair, wall, and unsupported drills for hips, calves, hamstrings, and rotation.',
};

const LADDER_DISPLAY_TITLES: Record<string, string> = {
  'sit-to-stand': 'Sit to stand',
  'heel-toe-raise': 'Heel and toe raises',
  'pull-upper-back': 'Upper back pulling',
  'hinge-glutes': 'Hinge and glutes',
  'shoulder-reach-press': 'Shoulder reach and press',
  'mobility-flexibility': 'Mobility and flexibility',
};

const LADDER_WHY_IT_HELPS: Record<string, string> = {
  'sit-to-stand': 'This helps with standing from chairs, using stairs, and moving through daily tasks with more confidence.',
  squat: 'This helps you lower, lift, and reach down with better control.',
  'step-up': 'This helps with stairs, curbs, and stepping up with support nearby.',
  'heel-toe-raise': 'This helps your ankles and calves support walking, steps, and balance reactions.',
  push: 'This helps with pushing up from walls, counters, chairs, and other everyday surfaces.',
  'pull-upper-back': 'This helps support posture, shoulder comfort, and pulling movements in daily life.',
  'hinge-glutes': 'This helps with reaching down, lifting light items, and using your hips with control.',
  'shoulder-reach-press': 'This helps with reaching overhead and keeping shoulder movement available for daily tasks.',
  balance: 'This helps you practise steadiness near support before trying harder balance positions.',
  'lateral-stability': 'This helps with side steps, turns, and moving around obstacles.',
  'mobility-flexibility': 'This helps keep useful movement available for reaching, bending, and turning.',
};

const LADDER_WATCH_TEXT: Record<string, string> = {
  'sit-to-stand': 'Hale counts your stands and watches how your standing speed changes over time.',
  squat: 'Hale counts clear squats and watches whether the movement stays steady.',
  'step-up': 'Hale counts your step-ups and watches the upward part of each step.',
  'heel-toe-raise': 'Hale counts clear heel or toe raises.',
  push: 'Hale counts clear push-ups from your wall, chair, or floor setup.',
  'pull-upper-back': 'Hale counts or times the band movement when your setup is clear.',
  'hinge-glutes': 'Hale counts clear hinges and watches your general movement range.',
  'shoulder-reach-press': 'Hale counts or times overhead reaching and pressing work.',
  balance: 'Hale times steady holds and notices when the hold ends.',
  'lateral-stability': 'Hale counts or times side-step practice when your setup is clear.',
  'mobility-flexibility': 'Hale times each mobility movement and checks that your setup is clear.',
};

export function getExtraSessionCards(input: {
  equipment?: EquipmentProfile | null;
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

export function getMovementLadderCards(input: {
  ladderProgressById?: Record<string, LadderProgress>;
  equipment?: EquipmentProfile | null;
  safetyProfile?: MovementSafetyProfile | null;
  activeBlockId?: string | null;
  generatedSessionSummaries?: readonly PersistedGeneratedSessionSummary[] | null;
} = {}): MovementLadderCard[] {
  const available = availableEquipmentFor({ safetyProfile: input.safetyProfile });
  const movementCapabilities = movementCapabilitiesFromSafetyProfile(input.safetyProfile);
  return listExerciseLadders().filter((ladder) => ladder.releaseStatus === 'v1_core').map((ladder) => {
    const current = currentLevelFor(ladder, input.ladderProgressById?.[ladder.id], available, movementCapabilities);
    const presentation = ladderPresentationForLadder(ladder);
    const coverage = coverageForLadder(ladder, input, available, movementCapabilities);
    return {
      id: ladder.id,
      title: movementDisplayTitle(ladder),
      body: LADDER_CARD_BODY[ladder.id] ?? ladder.description,
      currentLevelName: presentation.showCurrentLevel ? displayMovementName(current.name) : presentation.listTitle,
      currentLevelLabel: coverage?.coverageLabel ?? nonLinearCardLabel(presentation.mode, current, ladder),
      showCurrentLevel: presentation.showCurrentLevel,
      presentationMode: presentation.mode,
      listTitle: presentation.listTitle,
      coverageLabel: coverage?.coverageLabel,
      varietyLabel: coverage?.varietyLabel,
      domainLabel: focusLabel(ladder.domain),
      equipmentLabel: equipmentLabelForLevel(current, available, movementCapabilities),
      measurementLabel: measurementLabel(current.measurementTier),
    };
  });
}

export function getMovementLadderDetail(
  ladderId: string,
  ladderProgressById: Record<string, LadderProgress> = {},
  input: {
    equipment?: EquipmentProfile | null;
    safetyProfile?: MovementSafetyProfile | null;
    activeBlockId?: string | null;
    generatedSessionSummaries?: readonly PersistedGeneratedSessionSummary[] | null;
  } = {}
): MovementLadderDetail | null {
  let source: ExerciseLadder;
  try {
    source = getExerciseLadder(ladderId);
  } catch {
    return null;
  }
  if (source.releaseStatus !== 'v1_core') return null;
  const betaLevels = availableLevelsForRelease(source);
  const ladder: ExerciseLadder = {
    ...source,
    levels: betaLevels,
  };
  if (ladder.levels.length === 0) return null;
  const available = availableEquipmentFor({ safetyProfile: input.safetyProfile });
  const movementCapabilities = movementCapabilitiesFromSafetyProfile(input.safetyProfile);
  const current = currentLevelFor(source, ladderProgressById[ladder.id], available, movementCapabilities);
  const presentation = ladderPresentationForLadder(ladder);
  const coverage = coverageForLadder(ladder, input, available, movementCapabilities);
  const currentIndex = Math.max(0, ladder.levels.findIndex((level) => level.id === current.id));
  const levels = ladder.levels.map((level) => levelView(
    level,
    ladder,
    presentation.showCurrentLevel && level.id === current.id,
    available,
    movementCapabilities
  ));
  const card = getMovementLadderCards({
    ladderProgressById,
    safetyProfile: input.safetyProfile,
    activeBlockId: input.activeBlockId,
    generatedSessionSummaries: input.generatedSessionSummaries,
  }).find((item) => item.id === ladder.id);
  const showAdjacentLevels = presentation.showEasierHarder;
  const autoCeilingIndex = showAdjacentLevels
    ? Math.max(0, ladder.levels.findIndex((level) => level.id === getControlledBetaProgressionPolicy(ladder.id).autoProgressionCeilingLevelId))
    : -1;
  return {
    ...(card ?? {}),
    id: ladder.id,
    title: movementDisplayTitle(ladder),
    body: card?.body ?? LADDER_CARD_BODY[ladder.id] ?? ladder.description,
    whyItMatters: ladder.whyItMatters,
    whyItHelps: LADDER_WHY_IT_HELPS[ladder.id] ?? ladder.whyItMatters,
    beforeStartItems: beforeStartItemsForLevel(current, available, movementCapabilities),
    watchText: LADDER_WATCH_TEXT[ladder.id] ?? watchTextForLevel(current),
    currentLevelName: presentation.showCurrentLevel ? displayMovementName(current.name) : presentation.listTitle,
    currentLevelLabel: coverage?.coverageLabel ?? nonLinearCardLabel(presentation.mode, current, ladder),
    showCurrentLevel: presentation.showCurrentLevel,
    presentationMode: presentation.mode,
    listTitle: presentation.listTitle,
    coverageLabel: coverage?.coverageLabel,
    varietyLabel: coverage?.varietyLabel,
    domainLabel: focusLabel(ladder.domain),
    equipmentLabel: equipmentLabelForLevel(current, available, movementCapabilities),
    measurementLabel: measurementLabel(current.measurementTier),
    currentLevel: levelView(current, ladder, presentation.showCurrentLevel, available, movementCapabilities),
    easierLevel: showAdjacentLevels && currentIndex > 0
      ? levelView(ladder.levels[currentIndex - 1], ladder, false, available, movementCapabilities)
      : undefined,
    harderLevel: showAdjacentLevels && currentIndex < autoCeilingIndex
      ? levelView(ladder.levels[currentIndex + 1], ladder, false, available, movementCapabilities)
      : undefined,
    levels,
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
  safetyProfile,
  settings,
}: {
  equipment?: EquipmentProfile | null;
  safetyProfile?: MovementSafetyProfile | null;
  settings?: AppSettings | null;
} = {}): EquipmentSetupSummary {
  const available = availableEquipmentFor({ safetyProfile });
  const optional = [
    available.includes('stairs') ? 'bottom stair' : null,
    available.includes('resistance_band') ? 'resistance band' : null,
    available.includes('mini_band') ? 'mini band' : null,
    available.includes('backpack') || available.includes('dumbbells') ? 'backpack or light weight' : null,
  ].filter((item): item is string => !!item);
  const missing = [
    available.includes('stairs') ? null : 'bottom stair',
    available.includes('resistance_band') ? null : 'resistance band',
    available.includes('mini_band') ? null : 'mini band',
    available.includes('backpack') || available.includes('dumbbells') ? null : 'backpack or light weight',
  ].filter((item): item is string => !!item);
  const core = [
    available.includes('chair') ? 'stable chair' : null,
    available.includes('wall') ? 'wall or counter support' : null,
    available.includes('floor_space') ? 'floor space' : null,
  ].filter((item): item is string => !!item);
  return {
    availableLabel: humanList([...core, ...optional]) || 'no support items marked',
    missingOptionalLabel: missing.length > 0 ? humanList(missing) : 'all optional items marked available',
    phoneStandLabel: settings?.phoneStandAvailable ? 'Phone stand available' : 'Phone stand not marked available',
  };
}

export function availableEquipmentFor({
  safetyProfile,
}: {
  equipment?: EquipmentProfile | null;
  safetyProfile?: MovementSafetyProfile | null;
}): AvailableEquipment[] {
  const canonical = canonicalEquipmentFromSafetyProfile(safetyProfile);
  return canonical.status === 'confirmed' ? canonical.capabilities.slice() : [];
}

function currentLevelFor(
  ladder: ExerciseLadder,
  progress?: LadderProgress,
  available?: readonly AvailableEquipment[],
  movementCapabilities?: NormalizedMovementCapabilityProfile
): ExerciseLevel {
  const preferredId = progress?.currentLevelId ?? ladder.defaultLevelId;
  const progressionSelection = effectiveLevelIdForControlledBetaProgression({
    ladder,
    storedLevelId: preferredId,
  });
  const preferred = progressionSelection.selectedLevel ?? ladder.levels.find((level) => level.id === preferredId) ?? ladder.levels[0];
  if (!available) return preferred;
  return practiceLevelFor(availableLevelsForRelease(ladder), preferred, available, movementCapabilities) ?? preferred;
}

function practiceLevelFor(
  levels: readonly ExerciseLevel[],
  preferred: ExerciseLevel,
  available: readonly AvailableEquipment[],
  movementCapabilities?: NormalizedMovementCapabilityProfile
): ExerciseLevel | null {
  const preferredIndex = Math.max(0, levels.findIndex((level) => level.id === preferred.id));
  for (let idx = preferredIndex; idx >= 0; idx--) {
    const level = levels[idx];
    if (
      equipmentSupportsTags(level.equipment, available) &&
      (!movementCapabilities || movementCapabilitySupportsLevel(level, movementCapabilities))
    ) return level;
  }
  for (let idx = preferredIndex + 1; idx < levels.length; idx++) {
    const level = levels[idx];
    if (
      equipmentSupportsTags(level.equipment, available) &&
      (!movementCapabilities || movementCapabilitySupportsLevel(level, movementCapabilities))
    ) return level;
  }
  return null;
}

function levelView(
  level: ExerciseLevel,
  ladder: ExerciseLadder,
  isCurrent: boolean,
  available?: readonly AvailableEquipment[],
  movementCapabilities?: NormalizedMovementCapabilityProfile
): LadderLevelView {
  return {
    id: level.id,
    name: displayMovementName(level.name),
    levelLabel: levelLabel(level, ladder),
    equipmentLabel: equipmentLabelForLevel(level, available, movementCapabilities),
    measurementLabel: measurementLabel(level.measurementTier),
    cameraLabel: cameraLabel(level.cameraView),
    instructions: level.instructions,
    setupNote: safetyNoteText(exerciseSafetySetupText(level.id)) ?? level.setupNotes,
    safetyNote: safetyNoteText(exerciseSafetySummaryText(level.id)) ?? level.safetyNotes,
    measurementNote: level.measurementNotes,
    isCurrent,
  };
}

function beforeStartItemsForLevel(
  level: ExerciseLevel,
  available: readonly AvailableEquipment[],
  movementCapabilities: NormalizedMovementCapabilityProfile
): string[] {
  return unique([
    equipmentChecklistItem(level, available, movementCapabilities),
    cameraChecklistItem(level.cameraView),
    'Keep your full body in view.',
    safetyChecklistItem(level),
  ]).filter((item): item is string => !!item);
}

function equipmentChecklistItem(
  level: ExerciseLevel,
  available: readonly AvailableEquipment[],
  movementCapabilities: NormalizedMovementCapabilityProfile
): string {
  const label = equipmentLabelForLevel(level, available, movementCapabilities);
  if (label.startsWith('Needs ')) {
    const need = label.replace(/^Needs /, '');
    if (need === 'floor-transfer setup') return 'Use floor movements only if getting down and up feels safe.';
    if (need === 'supported balance setup') return 'Keep a wall, counter, or sturdy chair within reach.';
    if (need === 'movement setup') return 'Choose a version that feels safe to set up.';
    return `Set up ${need}.`;
  }
  if (label === 'No optional equipment') return 'Clear enough space to move comfortably.';
  return `Use ${label}.`;
}

function cameraChecklistItem(cameraView: ExerciseLevel['cameraView']): string {
  if (cameraView === 'front') return 'Place your phone in front of you.';
  if (cameraView === 'side') return 'Place your phone to the side.';
  if (cameraView === 'side_oblique') return 'Place your phone at a slight side angle.';
  return 'Keep your phone where you can hear the guidance.';
}

function safetyChecklistItem(level: ExerciseLevel): string {
  if (level.equipment.includes('stair')) return 'Use the lowest step and keep support nearby.';
  if (level.id.includes('balance')) return 'Keep support close enough to touch.';
  if (level.equipment.includes('floor')) return 'Use floor space only if getting down and up feels safe today.';
  return 'Move only in a comfortable range.';
}

function watchTextForLevel(level: ExerciseLevel): string {
  if (level.measurementTier === 'measured') return 'Hale follows the movement when your setup is clear.';
  if (level.measurementTier === 'camera_assisted') return 'Hale uses the camera to help guide the movement.';
  return 'Hale guides the timing while you move at a comfortable pace.';
}

function safetyNoteText(lines: readonly string[]): string | undefined {
  return lines.length > 0 ? lines.join(' ') : undefined;
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

function equipmentLabelForLevel(
  level: ExerciseLevel,
  available?: readonly AvailableEquipment[],
  movementCapabilities?: NormalizedMovementCapabilityProfile
): string {
  if (available) {
    const missing = equipmentMissingLabels(level.equipment, available);
    if (missing.length > 0) return `Needs ${humanList(missing)}`;
  }
  if (movementCapabilities && !movementCapabilitySupportsLevel(level, movementCapabilities)) {
    if (level.equipment.includes('floor')) return 'Needs floor-transfer setup';
    if (level.equipment.includes('stair')) return 'Needs a step or stair';
    if (level.id.includes('single-leg')) return 'Needs supported balance setup';
    return 'Needs movement setup';
  }
  return equipmentLabelForTags(level.equipment);
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

function levelLabel(level: ExerciseLevel, ladder: ExerciseLadder): string {
  const presentation = ladderPresentationForLadder(ladder);
  if (presentation.mode === 'collection') return 'Mobility movement';
  if (presentation.mode === 'movement_set') return 'Movement';
  return `Level ${level.level + 1}`;
}

function nonLinearCardLabel(
  mode: 'levels' | 'movement_set' | 'collection',
  level: ExerciseLevel,
  ladder: ExerciseLadder
): string {
  if (mode === 'collection') return 'Used across your plan';
  if (mode === 'movement_set') return 'Included movements';
  return levelLabel(level, ladder);
}

function movementDisplayTitle(ladder: ExerciseLadder): string {
  return LADDER_DISPLAY_TITLES[ladder.id] ?? ladder.title;
}

function displayMovementName(name: string): string {
  return name
    .replace(/Sit-to-Stand/g, 'sit to stand')
    .replace(/Slow-Lower/g, 'Slow lower')
    .replace(/^sit to stand$/, 'Sit to stand')
    .replace(/\bPush-Up\b/g, 'push-up');
}

function coverageForLadder(
  ladder: ExerciseLadder,
  input: {
    activeBlockId?: string | null;
    generatedSessionSummaries?: readonly PersistedGeneratedSessionSummary[] | null;
  },
  available: readonly AvailableEquipment[],
  movementCapabilities: NormalizedMovementCapabilityProfile
): CollectionCoverageSummary | undefined {
  if (ladder.progressionModel !== 'collection' || !input.activeBlockId) return undefined;
  const exposures = collectionExposuresFromGeneratedSessionSummaries({
    blockId: input.activeBlockId,
    summaries: input.generatedSessionSummaries,
  });
  return collectionCoverageSummary({
    collectionId: ladder.id,
    blockId: input.activeBlockId,
    exposures,
    availableEquipment: available,
    movementCapabilities,
    discomfortConstraint: discomfortConstraintForAreas([]),
  });
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
        body: 'Strength without steadiness can feel hard to trust. Balance practice helps you control force when the surface changes, the lighting is dim, you turn quickly, or you are carrying something. The two systems are linked in daily life, so Hale trains them together instead of treating them as separate projects.',
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
        title: 'How Hale uses the pairing',
        body: 'Hale looks at strength, balance, and mobility separately, then builds a block that still feels like a whole-body routine. If balance is the suggested focus, you will still see strength and mobility. If strength is the suggested focus, steadiness does not disappear. Bodies rarely change in neat categories.',
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
        body: 'If sleep is persistently short, restless, very long, or leaves you exhausted during normal daytime activity, it is worth speaking with a qualified clinician. Hale can support movement habits, but sleep problems deserve proper attention when they keep repeating.',
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
        body: 'On days when a workout feels too much, walking breaks keep a thread of movement in the day. They also pair well with Hale sessions. A short walk before training can help you arrive warmer and less stiff.',
      },
      {
        title: 'Make it measurable without pressure',
        body: 'Try counting breaks rather than chasing steps. For example: one after breakfast, one after lunch, and one in the afternoon. That gives the habit a shape without turning the whole day into a target.',
      },
    ],
  },
];

const LEARN_ARTICLES: readonly LearnDetail[] = [
  {
    id: 'movement-checkup-guide',
    title: 'How the Movement Check-Up works',
    body: 'Learn what Hale checks, why camera setup matters, and how your results shape your 4-week plan.',
    readTimeLabel: '6 min',
    sections: [
      {
        title: 'The point is repeatable evidence',
        body: 'The Movement Check-Up is designed to answer a simple question: what can your body do at home today, and how does that change after a few weeks of practice? Hale uses familiar tasks because they connect directly to daily life. Standing from a chair, holding balance positions, reaching overhead, and hinging toward the floor are small movements, but together they give a useful picture of strength, steadiness, and range.',
      },
      {
        title: 'What the camera is doing',
        body: 'The camera follows your body position while you move. Hale uses that movement information to count clear reps, time holds, and follow broad signals such as chair-rise speed or reach range. It never shows self-view video, and it is not judging whether you look right. The camera is a measuring instrument, not a coach calling out form.',
      },
      {
        title: 'Why the same setup matters',
        body: 'Home camera estimates are most useful when the setup is similar each time. Phone height, distance, lighting, and where you stand can all change what the camera sees. Hale asks you to prop the phone, stand in frame, and use the same general space so the month-to-month trend is cleaner. Think of setup as part of the measurement, not a fussy extra step.',
      },
      {
        title: 'How the results become a plan',
        body: 'After the check-up, Hale chooses a suggested focus for the next block. If balance looks like the area that deserves more practice, your plan will include more steadiness work. If chair-rise strength needs attention, the plan leans toward lower-body strength and power. The goal is not to label you. It is to make the next session obvious.',
      },
      {
        title: 'How to read a home estimate',
        body: 'A single check-up is a starting point, not a verdict. Sleep, stress, room setup, soreness, and confidence can all affect a session. The useful signal comes from repeating the same check-up over time and pairing it with a plan you can actually complete.',
      },
    ],
  },
  {
    id: 'chair-rise-strength',
    title: 'Why standing from a chair matters',
    body: 'Standing from a chair is one of the clearest everyday signals of lower-body strength, power, and confidence.',
    readTimeLabel: '5 min',
    sections: [
      {
        title: 'Why this simple task says a lot',
        body: 'A chair rise asks your hips, thighs, ankles, and trunk to coordinate at the same time. You need enough strength to stand, enough control to sit back down, and enough confidence to repeat the movement without rushing. That is why chair-rise work shows up so often in home training: it is easy to set up, easy to repeat, and closely tied to everyday independence.',
      },
      {
        title: 'Strength and power are not the same',
        body: 'Strength is your ability to produce force. Power is how quickly you can use that force. Getting out of a low chair, stepping up, or catching yourself after a stumble often depends on both. Hale keeps the language simple, but the chair-rise task gives a useful look at this blend because the movement has a clear start, a clear finish, and a repeatable pattern.',
      },
      {
        title: 'What Hale watches',
        body: 'During a check-up, Hale follows your movement, counts clear chair rises, and estimates relative rise speed over the session. The number is not a personal judgement. It is a trend line you can compare with future check-ups when the setup is similar.',
      },
      {
        title: 'How to train it at home',
        body: 'Useful practice does not need to be dramatic. Start with a chair height that lets you stand with control. Keep your feet planted, stand tall, and sit down softly. If the movement feels too hard, use a cushion or reduce the number of reps. If it feels too easy over time, Hale may choose slower lowers, brisker stands, or a more challenging version.',
      },
      {
        title: 'What a good set feels like',
        body: 'A good set should feel focused, not frantic. You should be able to breathe, keep the chair stable, and finish with a little work left in reserve. Sharp pain, dizziness, or a sense that you cannot control the descent is a reason to stop and choose an easier path.',
      },
    ],
  },
  {
    id: 'balance-practice',
    title: 'Why balance improves with practice',
    body: 'Balance is trainable, especially when the practice is calm, frequent, and set up with support nearby.',
    readTimeLabel: '5 min',
    sections: [
      {
        title: 'Balance is a conversation',
        body: 'Balance is not one muscle. It is your eyes, inner ear, feet, joints, trunk, breathing, and attention working together. The system is constantly making tiny corrections. Practice gives that system more chances to organize itself in a low-pressure setting.',
      },
      {
        title: 'Why quiet practice works',
        body: 'The most useful balance work often looks almost boring from the outside. Feet together, semi-tandem, tandem, or single-leg holds can all be meaningful when they are done with care. The point is not to wobble as much as possible. The point is to give your body a steady challenge it can learn from.',
      },
      {
        title: 'Keep support close',
        body: 'Balance practice belongs near a wall, counter, or sturdy chair. Fingertips nearby make the session calmer and safer. If you need to touch support, touch support. That does not ruin the practice; it lets you continue with control.',
      },
      {
        title: 'Progression should feel gradual',
        body: 'Hale changes balance work by adjusting stance, time, and support. A narrow stance is harder than a wide one. Less hand support is harder than more. Longer holds are harder than shorter holds. Good progression is a small step, not a dare.',
      },
      {
        title: 'Make it part of normal life',
        body: 'Balance responds well to short, regular doses. A few focused minutes can fit after a walk, before strength work, or while the kettle boils, as long as the setup is safe. Consistency matters more than making every hold perfect.',
      },
    ],
  },
  {
    id: 'mobility-basics',
    title: 'How mobility helps everyday movement',
    body: 'Mobility work is not about extreme stretching. It is about keeping useful ranges available for real life.',
    readTimeLabel: '5 min',
    sections: [
      {
        title: 'Mobility is usable range',
        body: 'Flexibility is how far a joint or muscle can move. Mobility is how well you can use that range with control. Hale focuses on everyday movement: reaching overhead, rotating comfortably, hinging forward, stepping, and moving from the hips without holding your breath.',
      },
      {
        title: 'Stiff days need a lower doorway',
        body: 'On stiff days, the goal is often to begin gently rather than wait until you feel ready. A few slow reps, a shorter range, or a supported version can help the body settle into movement. Hale uses mobility blocks partly because they lower the friction of starting.',
      },
      {
        title: 'Comfort beats intensity',
        body: 'Useful mobility should feel like mild effort, warmth, or stretch. It should not feel sharp, electric, or forced. If your breath changes or your body braces, back out a little. The range you can repeat calmly is usually more useful than the deepest position you can reach once.',
      },
      {
        title: 'Pair mobility with strength',
        body: 'Mobility work and strength work support each other. Reaching and hinging feel more useful when the body can control the position. Strength work often feels smoother after a short mobility warm-up. Hale combines them so range and control grow together.',
      },
      {
        title: 'Use the same few movements',
        body: 'You do not need a new stretch every day. A small menu repeated often is easier to learn and easier to notice. Overhead reach, hip hinge, calf mobility, thoracic rotation, and gentle hamstring reach cover a lot of daily ground.',
      },
    ],
  },
  {
    id: 'camera-setup',
    title: 'How to set up your camera',
    body: 'Good setup is measurement hygiene. It helps Hale compare your check-ups without asking you to think about camera details mid-session.',
    readTimeLabel: '5 min',
    sections: [
      {
        title: 'Start with a stable phone',
        body: 'Use a phone stand, shelf, or stable surface that will not wobble. Aim for roughly hip height when possible. A steady phone gives Hale a clearer view of your movement and makes the session feel less fiddly.',
      },
      {
        title: 'Give the camera your full body',
        body: 'Stand a few steps back so your head, hands, hips, knees, and feet can stay in view. For side-view movements, turn sideways. For front-view balance work, face the phone. Hale will guide the setup, but a clear full-body view makes the check-up smoother.',
      },
      {
        title: 'Use more light than you think',
        body: 'Warm evening rooms can look fine to you while still being difficult for pose detection. Turn on the main room light, open curtains if it is daytime, and avoid standing in a strong backlight. Even lighting helps the camera follow your outline.',
      },
      {
        title: 'Keep the background simple',
        body: 'Move small clutter out of the immediate area and give yourself room around the chair or wall. You do not need a studio. You just need enough clear space for Hale to tell where you are and where the movement starts and ends.',
      },
      {
        title: 'Privacy stays central',
        body: 'Hale does not show you a mirror view. During camera work, the app shows a simple outline so you can confirm that you are framed without watching yourself on video.',
      },
    ],
  },
  {
    id: 'resistance-band',
    title: 'How to choose a resistance band',
    body: 'A simple band can add useful pulling work at home, as long as the resistance and setup feel controlled.',
    readTimeLabel: '5 min',
    sections: [
      {
        title: 'Why a band is useful',
        body: 'Most home routines naturally include more pushing than pulling: getting up from chairs, pressing from surfaces, carrying, and reaching. A resistance band makes it easier to train the upper back without a machine or heavy weights. That can help round out the plan.',
      },
      {
        title: 'Choose the gentlest useful tension',
        body: 'Pick a band that lets you move smoothly through the full range. You should feel the muscles working, but you should not need to lean, jerk, shrug, or hold your breath to finish the rep. If form gets messy because the band is too heavy, use a lighter option.',
      },
      {
        title: 'Long band, loop band, or handles',
        body: 'A long band is the most flexible choice for rows, pull-aparts, and light presses. A loop band can work well for lower-body or side-step practice. Handles can feel comfortable, but they are not required. Hale can adapt around what you actually have.',
      },
      {
        title: 'Anchor points deserve attention',
        body: 'If you anchor a band, use a sturdy setup and check it before every set. A door anchor can be helpful, but only when the door closes securely and the band is not rubbing on a sharp edge. When in doubt, choose a band movement that does not need an anchor.',
      },
      {
        title: 'Replace worn bands',
        body: 'Bands do age. Tiny cracks, thinning, sticky patches, or a nick in the material are signs to replace the band. Store it away from heat and direct sun, and avoid stretching it farther than it comfortably allows.',
      },
    ],
  },
  {
    id: 'movement-discomfort',
    title: 'What to do if a movement feels uncomfortable',
    body: 'Discomfort is information. Hale works best when you respond early, choose the gentler path, and keep the routine trustworthy.',
    readTimeLabel: '5 min',
    sections: [
      {
        title: 'Separate effort from warning signs',
        body: 'Some effort is expected: warmth, muscle work, and mild fatigue can be normal during training. Sharp pain, joint pain that changes your movement, dizziness, chest discomfort, sudden weakness, or symptoms that feel unusual are different. Stop the session and seek qualified advice when something does not feel right.',
      },
      {
        title: 'Use the easier version sooner',
        body: 'You do not have to push through a movement to make the session count. Use support, shorten the range, reduce the reps, or choose an easier level. A gentler version can keep the habit intact while giving your body room to settle.',
      },
      {
        title: 'Tell Hale what changed',
        body: 'When you flag knee, hip, back, shoulder, ankle, neck, or other discomfort, Hale can reduce certain choices and lean toward friendlier alternatives. The app is not trying to solve the discomfort. It is trying to keep the plan sensible for today.',
      },
      {
        title: 'Watch the next 24 hours',
        body: 'A useful session should not leave you feeling worse the next day in a way that changes normal activity. If a movement repeatedly bothers the same area, take that pattern seriously and choose a lower level until you have guidance.',
      },
      {
        title: 'Keep the routine calm',
        body: 'A lighter day is still a real training day. The aim is to build a routine your body trusts. That trust comes from responding early, not from forcing every planned rep.',
      },
    ],
  },
  {
    id: 'monthly-retest',
    title: 'Why a monthly check-up helps',
    body: 'A monthly check-up gives Hale enough time to see a useful trend without making the process feel constant.',
    readTimeLabel: '5 min',
    sections: [
      {
        title: 'Four weeks is a practical window',
        body: 'Training needs repetition before it becomes visible in a home estimate. A month gives you time to complete several sessions, have normal good and low-energy days, and return to the same check-up with a little more context.',
      },
      {
        title: 'Do not over-read one day',
        body: 'Any single session can be affected by sleep, soreness, stress, room setup, lighting, or confidence. That is why Hale cares about repeated check-ups and the training history between them. One day is information; the pattern is more useful.',
      },
      {
        title: 'Use the same setup',
        body: 'Retesting works best when the setup is familiar. Use the same chair when possible, prop the phone at a similar height, stand in a similar spot, and turn on the same room light. The less the setup changes, the easier it is to compare.',
      },
      {
        title: 'Let the next block respond',
        body: 'After a retest, Hale can choose the next suggested focus and adjust the movement ladders. Sometimes that means more balance. Sometimes it means keeping strength steady while mobility gets more attention. The point is a plan that responds without asking you to redesign it.',
      },
      {
        title: 'Make it a routine, not an exam',
        body: 'The check-up should feel like a regular monthly appointment with your body. Set up the phone, follow the voice, and let Hale collect the estimate. You are not trying to perform perfectly. You are giving the next block better information.',
      },
    ],
  },
];
