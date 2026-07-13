/**
 * Programme v2 → voice-player catalogue (the bridge's definition source).
 *
 * The voice-guided session player consumes ExerciseDefinitions and safety-cue
 * profiles per exercise id. The programme catalogue deliberately does NOT
 * register into the compatibility exercise registry, whose camera-era
 * governance is not part of daily training. Instead this module builds
 * voice-only definitions on demand and the player receives them through its
 * injectable resolveExercise / resolveSafetyProfile seams (2026-07-07
 * amendment recorded in decisions.md).
 *
 * Voice-only by construction: cameraView 'not_required', createGrader throws
 * (unreachable — voice mode never creates a set runtime), and safety profiles
 * compose EXISTING SafetyCueIds only (bundled audio already exists; no
 * tracking/camera cues — there is no camera in these sessions). Doses in
 * definitions are fallbacks; the session mapper always overrides them via
 * generatedExercises from the ProgrammeSessionPlan.
 */

import type { ExerciseDefinition, ExercisePrescription } from '../exercises';
import {
  SAFETY_CUE_SCHEMA_VERSION,
  type PlannedExerciseSafetyCueProfile,
  type SafetyCueId,
} from '../training/safetyCueDefinitions';
import { PROGRAMME_LADDERS, QUIET_FINISHER_ITEMS } from './ladders';
import { hasProgrammeDisplayName, programmeDisplayName } from './naming';
import type { FinisherItem, ProgrammeExercise, ProgrammeLevel, ProgrammePattern } from './types';
import { programmeInstructionCueKey } from './voiceScripts';

/** The single warm-up item the voice session opens with (plan.prep). */
export const PROGRAMME_PREP_ITEM_ID = 'programme.prep';

interface CatalogEntry {
  exercise: ProgrammeExercise;
  level: ProgrammeLevel;
}

/** Every exercise id reachable from a generated plan, with its level context. */
function buildCatalogIndex(): Map<string, CatalogEntry> {
  const index = new Map<string, CatalogEntry>();
  const add = (exercise: ProgrammeExercise, level: ProgrammeLevel) => {
    if (!index.has(exercise.id)) index.set(exercise.id, { exercise, level });
    // No-stairs alternates inherit the host's level context; equipment drops
    // the stair requirement by construction.
    if (exercise.noStairsAlternativeId && !index.has(exercise.noStairsAlternativeId)) {
      index.set(exercise.noStairsAlternativeId, {
        exercise: {
          id: exercise.noStairsAlternativeId,
          equipment: exercise.equipment.filter((tag) => tag !== 'stair'),
          requiresFloor: exercise.requiresFloor,
        },
        level,
      });
    }
  };
  for (const pattern of Object.keys(PROGRAMME_LADDERS) as ProgrammePattern[]) {
    for (const level of PROGRAMME_LADDERS[pattern].levels) {
      add(level.primary, level);
      add(level.variation, level);
      if (level.occasionalVariation) add(level.occasionalVariation, level);
    }
  }
  return index;
}

const CATALOG_INDEX = buildCatalogIndex();
const FINISHER_BY_ID = new Map(QUIET_FINISHER_ITEMS.map((item) => [item.id, item]));

/** Old-engine block slot, inert in voice mode but required by the type. */
const PATTERN_SLOT: Record<ProgrammePattern, ExerciseDefinition['slot']> = {
  squat: 'lower-push',
  hinge: 'hinge',
  push: 'upper-push',
  pull: 'pull-reach',
  core: 'power',
};

const VOICE_ONLY_CAMERA_VIEW: ExerciseDefinition['cameraView'] = {
  view: 'not_required',
  requiredReliableSideChains: 1,
};

function voiceOnlyGrader(exerciseId: string): ExerciseDefinition['createGrader'] {
  return () => {
    throw new Error(
      `programme exercise '${exerciseId}' is voice-only — no camera grader exists (voice mode never grades)`
    );
  };
}

function displayNameFor(id: string): string {
  if (id === PROGRAMME_PREP_ITEM_ID) return 'Warm-up';
  if (hasProgrammeDisplayName(id)) return programmeDisplayName(id);
  return id;
}

function levelPrescription(level: ProgrammeLevel): ExercisePrescription {
  const perSide = level.scheme.kind === 'reps_per_side' || level.scheme.kind === 'seconds_per_side';
  if (level.scheme.kind === 'reps' || level.scheme.kind === 'reps_per_side') {
    return { sets: level.sets, repsPerSet: level.scheme.min, restSec: 60, autoregulate: false };
  }
  // Timed schemes run on the player's clock; per-side windows are doubled by
  // the session mapper — the fallback keeps the single-side floor.
  return {
    sets: level.sets,
    timerSec: perSide ? level.scheme.min * 2 : level.scheme.min,
    restSec: 60,
    autoregulate: false,
  };
}

/**
 * Resolve any programme exercise id (level exercises, no-stairs alternates,
 * finisher items, the prep item) to a voice-only ExerciseDefinition. Unknown
 * ids throw at construction, exactly like the registry's getExercise.
 */
export function programmeVoiceExerciseDefinition(exerciseId: string): ExerciseDefinition {
  if (exerciseId === PROGRAMME_PREP_ITEM_ID) {
    return {
      id: exerciseId,
      displayName: displayNameFor(exerciseId),
      family: 'programme.prep',
      level: 1,
      slot: 'mobility',
      cameraView: VOICE_ONLY_CAMERA_VIEW,
      equipment: ['none'],
      kind: 'timer',
      prescription: { sets: 1, timerSec: 180, restSec: 0, autoregulate: false },
      voice: { instructions: [programmeInstructionCueKey(exerciseId)] },
      createGrader: voiceOnlyGrader(exerciseId),
    };
  }

  const finisher = FINISHER_BY_ID.get(exerciseId);
  if (finisher) return finisherDefinition(finisher);

  const entry = CATALOG_INDEX.get(exerciseId);
  if (!entry) throw new Error(`unknown programme voice exercise '${exerciseId}'`);
  const { exercise, level } = entry;
  const kind = level.scheme.kind === 'reps' || level.scheme.kind === 'reps_per_side' ? 'reps' : 'timer';
  return {
    id: exercise.id,
    displayName: displayNameFor(exercise.id),
    family: `programme.${level.pattern}`,
    level: level.level,
    slot: PATTERN_SLOT[level.pattern],
    cameraView: VOICE_ONLY_CAMERA_VIEW,
    equipment: exercise.equipment,
    kind,
    prescription: levelPrescription(level),
    voice: {
      instructions: [
        programmeInstructionCueKey(exercise.id),
        // "Slow down, fast up" from Squat L3 / Hinge L5 onward (spec §1).
        ...(level.powerIntentCue ? (['prog-power-intent'] as const) : []),
      ],
    },
    createGrader: voiceOnlyGrader(exercise.id),
  };
}

function finisherDefinition(item: FinisherItem): ExerciseDefinition {
  const base = {
    id: item.id,
    displayName: displayNameFor(item.id),
    family: 'programme.finisher',
    level: item.order,
    slot: 'power' as const,
    cameraView: VOICE_ONLY_CAMERA_VIEW,
    equipment: (item.requiresStairs ? ['stair'] : ['none']) as ExerciseDefinition['equipment'],
    voice: { instructions: [programmeInstructionCueKey(item.id)] },
    createGrader: voiceOnlyGrader(item.id),
  };
  switch (item.dose.kind) {
    case 'contacts':
      return {
        ...base,
        kind: 'reps',
        prescription: { sets: 1, repsPerSet: item.dose.min, restSec: 30, autoregulate: false },
      };
    case 'sets_reps':
      return {
        ...base,
        kind: 'reps',
        prescription: { sets: item.dose.sets, repsPerSet: item.dose.min, restSec: 30, autoregulate: false },
      };
    case 'seconds':
      return {
        ...base,
        kind: 'timer',
        prescription: { sets: 1, timerSec: item.dose.min, restSec: 30, autoregulate: false },
      };
  }
}

/** Every id the catalogue can resolve — the guardrail/coverage test surface. */
export function allProgrammeVoiceExerciseIds(): string[] {
  return [
    PROGRAMME_PREP_ITEM_ID,
    ...CATALOG_INDEX.keys(),
    ...QUIET_FINISHER_ITEMS.map((item) => item.id),
  ];
}

// ---------------------------------------------------------------------------
// Safety profiles (voice-only: existing bundled cues, no camera/tracking ids)
// ---------------------------------------------------------------------------

function unique(ids: readonly SafetyCueId[]): SafetyCueId[] {
  return [...new Set(ids)];
}

/**
 * Composed from equipment + pattern, using ONLY existing SafetyCueIds (their
 * audio is bundled and verified today; no new safety lines). Recovery cues
 * are tracking-recovery lines — camera-only — so they stay empty here.
 */
export function programmeVoiceSafetyProfile(exerciseId: string): PlannedExerciseSafetyCueProfile {
  const definition = programmeVoiceExerciseDefinition(exerciseId);
  const setup: SafetyCueId[] = [];
  const active: SafetyCueId[] = ['comfortable_range_only'];

  const equipment = new Set(definition.equipment);
  if (equipment.has('chair') || equipment.has('cushion')) {
    setup.push('chair_use_sturdy_chair');
    if (definition.family === 'programme.squat') active.push('chair_controlled_sit');
  }
  if (equipment.has('wall') || equipment.has('counter')) {
    setup.push('support_use_sturdy_support', 'support_keep_support_within_reach');
  }
  if (equipment.has('stair')) {
    setup.push('step_use_low_stable_step', 'step_fixed_support_nearby', 'step_clear_dry_area');
    active.push('step_controlled_return', 'step_stop_if_unstable');
  }
  if (equipment.has('long_band') || equipment.has('band') || equipment.has('mini_band')) {
    setup.push('band_inspect_before_use', 'band_secure_grip', 'band_face_and_eyes_clear');
    active.push('band_controlled_return', 'band_never_release_under_tension', 'band_stop_if_slips_or_shifts');
  }
  if (equipment.has('door_anchor')) {
    setup.push(
      'door_anchor_follow_manufacturer_setup',
      'door_anchor_fully_closed',
      'door_anchor_test_light_tension',
      'door_anchor_stay_out_of_door_path'
    );
    active.push('door_anchor_stop_if_moves');
  }
  const definitionNeedsFloor =
    CATALOG_INDEX.get(exerciseId)?.exercise.requiresFloor === true;
  if (definitionNeedsFloor) {
    setup.push('floor_clear_space', 'floor_use_support_for_transfer', 'floor_slow_transition');
    active.push('floor_stop_if_transfer_unsteady');
  }

  return {
    schemaVersion: SAFETY_CUE_SCHEMA_VERSION,
    exerciseId,
    setupCueIds: unique(setup),
    activeCueIds: unique(active),
    repeatedSetCueIds: unique(active),
    recoveryCueIds: [],
  };
}

/**
 * Support-variant add-on (B5/T1 routing): appended per session by the mapper
 * when the plan cues fingertips-on-support for this exercise.
 */
export function withSupportCues(
  profile: PlannedExerciseSafetyCueProfile
): PlannedExerciseSafetyCueProfile {
  return {
    ...profile,
    setupCueIds: unique([...profile.setupCueIds, 'support_use_sturdy_support']),
    activeCueIds: unique([
      ...profile.activeCueIds,
      'balance_support_within_reach',
      'balance_supported_if_hesitant',
    ]),
    repeatedSetCueIds: unique([...profile.repeatedSetCueIds, 'balance_support_within_reach']),
  };
}
