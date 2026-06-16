import type { AvailableEquipment } from '../adherence';
import { LOADED_STS_ID } from '../exercises';
import {
  createSessionTemplatesForFocus,
  createTrainingBlockFromAssessment,
  generatePresetSession,
  generateTodaySession,
  type DailyReadiness,
  type GeneratedExercise,
  type GeneratedSession,
  type LadderProgress,
  type PainArea,
  type TrainingBlock,
  type TrainingDomain,
} from './workoutGeneration';

export interface DebugWorkoutExercisePreview {
  name: string;
  exerciseId: string;
  ladderId: string;
  prescription: string;
  equipmentRequired: readonly string[];
  measurementTier: GeneratedExercise['measurementTier'];
  rationale: string;
  fallbackReason?: string;
}

export interface DebugWorkoutScenarioPreview {
  id: string;
  title: string;
  blockFocus: TrainingDomain;
  selectedSession: string;
  templateId: string;
  source: GeneratedSession['source'];
  readiness: DailyReadiness;
  painAreas: readonly PainArea[];
  estimatedMinutes: number;
  exercises: readonly DebugWorkoutExercisePreview[];
  skippedSlots: readonly string[];
  guidance: readonly string[];
}

const DEBUG_START = '2026-06-01T08:00:00.000Z';

export function generateDebugWorkoutScenarios(): DebugWorkoutScenarioPreview[] {
  return [
    previewFromPreset({
      id: 'beginner_no_equipment',
      title: 'Beginner, no equipment',
      focusDomain: 'strength_power',
      presetId: 'preset-no-equipment-strength',
      equipment: ['none'],
    }),
    previewFromBlock({
      id: 'beginner_chair_wall',
      title: 'Beginner, chair + wall only',
      focusDomain: 'strength_power',
      templateIndex: 0,
      equipment: ['chair', 'wall'],
    }),
    previewFromBlock({
      id: 'beginner_long_band',
      title: 'Beginner with long band',
      focusDomain: 'strength_power',
      templateIndex: 0,
      equipment: ['chair', 'wall', 'resistance_band'],
    }),
    previewFromBlock({
      id: 'strength_power_weakest',
      title: 'Strength/power weakest domain',
      focusDomain: 'strength_power',
      templateIndex: 0,
      equipment: ['chair', 'wall', 'stairs', 'resistance_band'],
    }),
    previewFromBlock({
      id: 'balance_stability_weakest',
      title: 'Balance/stability weakest domain',
      focusDomain: 'balance_stability',
      templateIndex: 0,
      equipment: ['chair', 'wall'],
    }),
    previewFromBlock({
      id: 'mobility_flexibility_weakest',
      title: 'Mobility/flexibility weakest domain',
      focusDomain: 'mobility_flexibility',
      templateIndex: 0,
      equipment: ['chair', 'wall'],
    }),
    previewFromBlock({
      id: 'low_energy_day',
      title: 'Low energy day',
      focusDomain: 'strength_power',
      templateIndex: 0,
      equipment: ['chair', 'wall', 'resistance_band'],
      readiness: 'low_energy',
    }),
    previewFromBlock({
      id: 'short_on_time',
      title: 'Short on time',
      focusDomain: 'strength_power',
      templateIndex: 0,
      equipment: ['chair', 'wall', 'resistance_band'],
      readiness: 'short_on_time',
    }),
    previewFromBlock({
      id: 'knee_pain',
      title: 'Knee pain',
      focusDomain: 'strength_power',
      templateIndex: 1,
      equipment: ['chair', 'wall', 'stairs'],
      readiness: 'something_hurts',
      painAreas: ['knee'],
    }),
    previewFromBlock({
      id: 'shoulder_pain',
      title: 'Shoulder pain',
      focusDomain: 'strength_power',
      templateIndex: 1,
      equipment: ['chair', 'wall', 'resistance_band'],
      readiness: 'something_hurts',
      painAreas: ['shoulder'],
    }),
    previewFromBlock({
      id: 'stronger_ready_to_progress',
      title: 'Stronger user ready to progress',
      focusDomain: 'strength_power',
      templateIndex: 0,
      equipment: ['chair', 'wall', 'resistance_band', 'backpack'],
      includeOptionalLevels: true,
      ladderProgress: {
        'sit-to-stand': progress('sit-to-stand', LOADED_STS_ID),
      },
    }),
    previewFromBlock({
      id: 'no_band_upper_pull',
      title: 'User with no band where upper-body pull would normally be selected',
      focusDomain: 'strength_power',
      templateIndex: 0,
      equipment: ['chair', 'wall'],
    }),
  ];
}

export function formatDebugWorkoutScenario(preview: DebugWorkoutScenarioPreview): string {
  const lines = [
    `${preview.title}`,
    `Focus: ${preview.blockFocus}`,
    `Session: ${preview.selectedSession} (${preview.templateId}, ${preview.estimatedMinutes} min)`,
    `Readiness: ${preview.readiness}${preview.painAreas.length > 0 ? `; pain: ${preview.painAreas.join(', ')}` : ''}`,
  ];
  for (const exercise of preview.exercises) {
    lines.push(
      `- ${exercise.name}: ${exercise.prescription}; equipment ${exercise.equipmentRequired.join(', ')}; ` +
        `${exercise.measurementTier}; ${exercise.rationale}` +
        (exercise.fallbackReason ? ` Fallback: ${exercise.fallbackReason}` : '')
    );
  }
  if (preview.skippedSlots.length > 0) lines.push(`Skipped slots: ${preview.skippedSlots.join(', ')}`);
  if (preview.guidance.length > 0) lines.push(`Guidance: ${preview.guidance.join(' ')}`);
  return lines.join('\n');
}

export function formatDebugWorkoutScenarios(previews = generateDebugWorkoutScenarios()): string {
  return previews.map(formatDebugWorkoutScenario).join('\n\n');
}

function previewFromBlock(input: {
  id: string;
  title: string;
  focusDomain: TrainingDomain;
  templateIndex: number;
  equipment: readonly AvailableEquipment[];
  readiness?: DailyReadiness;
  painAreas?: readonly PainArea[];
  ladderProgress?: Record<string, LadderProgress>;
  includeOptionalLevels?: boolean;
}): DebugWorkoutScenarioPreview {
  const block = blockFor(input.focusDomain);
  const template = createSessionTemplatesForFocus(input.focusDomain)[input.templateIndex];
  const session = generateTodaySession({
    block,
    template,
    today: DEBUG_START,
    availableEquipment: input.equipment,
    dailyReadiness: input.readiness ?? 'ready',
    painAreas: input.painAreas,
    ladderProgress: input.ladderProgress,
    includeOptionalLevels: input.includeOptionalLevels,
  });
  return toPreview(input.id, input.title, block, session);
}

function previewFromPreset(input: {
  id: string;
  title: string;
  focusDomain: TrainingDomain;
  presetId: string;
  equipment: readonly AvailableEquipment[];
}): DebugWorkoutScenarioPreview {
  const block = blockFor(input.focusDomain);
  const session = generatePresetSession({
    block,
    presetId: input.presetId,
    today: DEBUG_START,
    availableEquipment: input.equipment,
  });
  return toPreview(input.id, input.title, block, session);
}

function blockFor(focusDomain: TrainingDomain): TrainingBlock {
  return createTrainingBlockFromAssessment({
    userId: 'debug-user',
    assessmentId: `debug-${focusDomain}`,
    focusDomain,
    startDate: DEBUG_START,
  });
}

function toPreview(
  id: string,
  title: string,
  block: TrainingBlock,
  session: GeneratedSession
): DebugWorkoutScenarioPreview {
  return {
    id,
    title,
    blockFocus: block.focusDomain,
    selectedSession: `${session.dayLabel} - ${session.title}`,
    templateId: session.templateId,
    source: session.source,
    readiness: session.readiness,
    painAreas: session.painAreas,
    estimatedMinutes: session.estimatedMinutes,
    exercises: session.exercises.map(toExercisePreview),
    skippedSlots: session.skippedSlots,
    guidance: session.guidance,
  };
}

function toExercisePreview(exercise: GeneratedExercise): DebugWorkoutExercisePreview {
  return {
    name: exercise.name,
    exerciseId: exercise.exerciseId,
    ladderId: exercise.ladderId,
    prescription: prescription(exercise),
    equipmentRequired: readableEquipment(exercise.equipment),
    measurementTier: exercise.measurementTier,
    rationale: exercise.rationale,
    fallbackReason: exercise.substitutions?.join(' '),
  };
}

function prescription(exercise: GeneratedExercise): string {
  if (exercise.repsPerSet) return `${exercise.sets} x ${exercise.repsPerSet} reps`;
  if (exercise.secondsPerSet) return `${exercise.sets} x ${exercise.secondsPerSet}s`;
  return `${exercise.sets} sets`;
}

function readableEquipment(equipment: readonly string[]): string[] {
  if (equipment.length === 0) return ['none'];
  const filtered = equipment.filter((item) => item !== 'none');
  return filtered.length > 0 ? filtered : ['none'];
}

function progress(ladderId: string, currentLevelId: string): LadderProgress {
  return {
    ladderId,
    currentLevelId,
    completedSessionsAtLevel: 1,
    failedSessionsAtLevel: 0,
    recentCompletionRates: [1],
    recentRpe: [2],
    recentPain: [false],
    readyToProgress: true,
    updatedAt: DEBUG_START,
  };
}
