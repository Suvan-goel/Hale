/**
 * Programme v2 ladder data — exercise-ladders-spec v0.2 §3–§10 under the
 * 2026-07-06 rulings:
 *
 * - Five movement-pattern ladders (Squat, Hinge, Push, Pull, Core). Level
 *   numbers match the spec tables exactly.
 * - Former [C] camera-verification levels are TEACH-ONLY gateways (C3):
 *   demo + rehearsal exposures (where a drill exists) + self-confirmation.
 * - The Impact finisher track is NOT here — deferred as a package with B2 and
 *   the osteoporosis gate (C1/C2). The quiet track is the universal v1
 *   finisher, presented simply as the "power finisher".
 * - No spinal flexion anywhere (spec §7): structurally impossible via
 *   CoreStimulus and re-checked by guardrail test.
 * - Floor- and stairs-dependent levels are flagged so the generator routes
 *   them through the existing floor-eligibility and no-stairs substitutions.
 *
 * All user-facing names live in naming.ts; ids here are internal.
 */

import type {
  AdaptationBranch,
  FinisherItem,
  ProgrammeExercise,
  ProgrammeLadder,
  ProgrammeLevel,
  ProgrammePattern,
} from './types';

/** Rehearsed in movement prep from day one (spec §4); feeds the Hinge L5 gateway. */
export const HINGE_REHEARSAL_DRILL_ID = 'hinge.rehearsal_standing_hinge';

/**
 * Gateway rehearsal exposures required where a rehearsal drill exists.
 * Provisional default (spec grooves the hinge "dozens of times" by L5; six
 * prep sessions ≈ 30+ rehearsal reps). Tunable config, part of the policy
 * fingerprint.
 */
export const DEFAULT_REQUIRED_REHEARSAL_EXPOSURES = 6;

function ex(id: string, input: Omit<ProgrammeExercise, 'id'> = { equipment: ['none'] }): ProgrammeExercise {
  return { id, ...input };
}

// ---------------------------------------------------------------------------
// Squat ladder (spec §3)
// ---------------------------------------------------------------------------

const SQUAT_LEVELS: ProgrammeLevel[] = [
  {
    pattern: 'squat',
    level: 1,
    primary: ex('squat.assisted_sit_to_stand', { equipment: ['chair', 'cushion'] }),
    variation: ex('squat.partial_box_squat', { equipment: ['chair'] }),
    sets: 2,
    scheme: { kind: 'reps', min: 10, max: 20 },
    isEntryLevel: true,
  },
  {
    pattern: 'squat',
    level: 2,
    primary: ex('squat.sit_to_stand', { equipment: ['chair'] }),
    variation: ex('squat.slow_lower_sit_to_stand', { equipment: ['chair'] }),
    sets: 2,
    scheme: { kind: 'reps', min: 10, max: 20 },
    isEntryLevel: true,
  },
  {
    pattern: 'squat',
    level: 3,
    primary: ex('squat.box_squat', { equipment: ['chair'] }),
    variation: ex('squat.fast_up_sit_to_stand', { equipment: ['chair'] }),
    sets: 2,
    scheme: { kind: 'reps', min: 8, max: 15 },
    isEntryLevel: false,
    powerIntentCue: true,
  },
  {
    pattern: 'squat',
    level: 4,
    primary: ex('squat.air_squat'),
    variation: ex('squat.paused_squat'),
    sets: 2,
    scheme: { kind: 'reps', min: 8, max: 15 },
    isEntryLevel: false,
    powerIntentCue: true,
  },
  {
    pattern: 'squat',
    level: 5,
    primary: ex('squat.low_step_up', {
      equipment: ['stair', 'wall'],
      requiresStairs: true,
      noStairsAlternativeId: 'squat.low_step_alternative',
    }),
    variation: ex('squat.lateral_step_up_low', {
      equipment: ['stair', 'wall'],
      requiresStairs: true,
      noStairsAlternativeId: 'squat.low_step_alternative',
    }),
    sets: 2,
    scheme: { kind: 'reps_per_side', min: 6, max: 10 },
    isEntryLevel: false,
    powerIntentCue: true,
  },
  {
    pattern: 'squat',
    level: 6,
    primary: ex('squat.step_up_high', {
      equipment: ['stair', 'wall'],
      requiresStairs: true,
      noStairsAlternativeId: 'squat.low_step_alternative',
    }),
    variation: ex('squat.step_up_knee_drive', {
      equipment: ['stair', 'wall'],
      requiresStairs: true,
      noStairsAlternativeId: 'squat.low_step_alternative',
    }),
    sets: 2,
    scheme: { kind: 'reps_per_side', min: 6, max: 10 },
    isEntryLevel: false,
    powerIntentCue: true,
  },
  {
    pattern: 'squat',
    level: 7,
    primary: ex('squat.supported_split_squat', { equipment: ['wall', 'chair'] }),
    variation: ex('squat.static_lunge_shallow'),
    sets: 2,
    scheme: { kind: 'reps_per_side', min: 6, max: 10 },
    isEntryLevel: false,
    powerIntentCue: true,
  },
  {
    pattern: 'squat',
    level: 8,
    primary: ex('squat.split_squat'),
    variation: ex('squat.tempo_split_squat'),
    sets: 2,
    scheme: { kind: 'reps_per_side', min: 6, max: 10 },
    isEntryLevel: false,
    powerIntentCue: true,
    gateway: { requiredRehearsalExposures: 0 },
  },
  {
    pattern: 'squat',
    level: 9,
    primary: ex('squat.rfess', { equipment: ['chair'] }),
    variation: ex('squat.tempo_rfess', { equipment: ['chair'] }),
    sets: 2,
    scheme: { kind: 'reps_per_side', min: 6, max: 10 },
    isEntryLevel: false,
    powerIntentCue: true,
    gateway: { requiredRehearsalExposures: 0 },
  },
];

// ---------------------------------------------------------------------------
// Hinge ladder (spec §4)
// ---------------------------------------------------------------------------

const HINGE_LEVELS: ProgrammeLevel[] = [
  {
    pattern: 'hinge',
    level: 1,
    primary: ex('hinge.glute_bridge', { equipment: ['floor'], requiresFloor: true }),
    variation: ex('hinge.bridge_hold_top', { equipment: ['floor'], requiresFloor: true }),
    sets: 2,
    scheme: { kind: 'reps', min: 10, max: 20 },
    isEntryLevel: true,
  },
  {
    pattern: 'hinge',
    level: 2,
    primary: ex('hinge.paused_bridge', { equipment: ['floor'], requiresFloor: true }),
    variation: ex('hinge.feet_elevated_bridge', { equipment: ['floor', 'stair'], requiresFloor: true }),
    sets: 2,
    scheme: { kind: 'reps', min: 8, max: 15 },
    isEntryLevel: true,
  },
  {
    pattern: 'hinge',
    level: 3,
    primary: ex('hinge.single_leg_bridge', { equipment: ['floor'], requiresFloor: true }),
    variation: ex('hinge.single_leg_bridge_hold', { equipment: ['floor'], requiresFloor: true }),
    sets: 2,
    scheme: { kind: 'reps_per_side', min: 6, max: 10 },
    isEntryLevel: false,
  },
  {
    pattern: 'hinge',
    level: 4,
    primary: ex('hinge.feet_elevated_single_leg_bridge', {
      equipment: ['floor', 'stair'],
      requiresFloor: true,
    }),
    // Fiddly setup; explicitly skippable (spec demoted the sofa thrust to variation).
    variation: ex('hinge.sofa_hip_thrust', { equipment: ['floor', 'chair'], requiresFloor: true }),
    sets: 2,
    scheme: { kind: 'reps_per_side', min: 6, max: 10 },
    isEntryLevel: false,
  },
  {
    pattern: 'hinge',
    level: 5,
    primary: ex('hinge.wall_tap_hinge', { equipment: ['wall'] }),
    variation: ex('hinge.hinge_arm_reach', { equipment: ['wall'] }),
    sets: 2,
    scheme: { kind: 'reps', min: 10, max: 15 },
    isEntryLevel: false,
    powerIntentCue: true,
    gateway: {
      rehearsalDrillId: HINGE_REHEARSAL_DRILL_ID,
      requiredRehearsalExposures: DEFAULT_REQUIRED_REHEARSAL_EXPOSURES,
    },
  },
  {
    pattern: 'hinge',
    level: 6,
    primary: ex('hinge.good_morning'),
    variation: ex('hinge.hinge_fast_up'),
    sets: 2,
    scheme: { kind: 'reps', min: 8, max: 15 },
    isEntryLevel: false,
    powerIntentCue: true,
  },
  {
    pattern: 'hinge',
    level: 7,
    primary: ex('hinge.kickstand_hinge', { equipment: ['backpack_or_weight'] }),
    variation: ex('hinge.supported_single_leg_hinge', { equipment: ['chair'] }),
    sets: 2,
    scheme: { kind: 'reps_per_side', min: 6, max: 10 },
    isEntryLevel: false,
    powerIntentCue: true,
  },
  {
    pattern: 'hinge',
    level: 8,
    primary: ex('hinge.loaded_kickstand_hinge', { equipment: ['backpack_or_weight', 'long_band'] }),
    // Balance-emphasis option, not the strength path (spec note).
    variation: ex('hinge.balance_reach'),
    sets: 2,
    scheme: { kind: 'reps_per_side', min: 8, max: 12 },
    isEntryLevel: false,
    powerIntentCue: true,
  },
];

// ---------------------------------------------------------------------------
// Push ladder (spec §5) — continuous incline descent; knee press-ups back-off
// ---------------------------------------------------------------------------

const PUSH_LEVELS: ProgrammeLevel[] = [
  {
    pattern: 'push',
    level: 1,
    primary: ex('push.wall_push_up', { equipment: ['wall'] }),
    variation: ex('push.wall_push_up_slow', { equipment: ['wall'] }),
    sets: 2,
    scheme: { kind: 'reps', min: 10, max: 20 },
    isEntryLevel: true,
  },
  {
    pattern: 'push',
    level: 2,
    primary: ex('push.counter_push_up', { equipment: ['counter'] }),
    variation: ex('push.paused_counter_push_up', { equipment: ['counter'] }),
    sets: 2,
    scheme: { kind: 'reps', min: 8, max: 15 },
    isEntryLevel: true,
  },
  {
    pattern: 'push',
    level: 3,
    primary: ex('push.stair_push_up_high', {
      equipment: ['stair'],
      requiresStairs: true,
      noStairsAlternativeId: 'push.sofa_arm_push_up',
    }),
    variation: ex('push.knee_push_up', { equipment: ['floor'], requiresFloor: true }),
    sets: 2,
    scheme: { kind: 'reps', min: 8, max: 15 },
    isEntryLevel: false,
  },
  {
    pattern: 'push',
    level: 4,
    primary: ex('push.stair_push_up_mid', {
      equipment: ['stair'],
      requiresStairs: true,
      noStairsAlternativeId: 'push.low_table_push_up',
    }),
    variation: ex('push.knee_push_up_slow', { equipment: ['floor'], requiresFloor: true }),
    sets: 2,
    scheme: { kind: 'reps', min: 6, max: 12 },
    isEntryLevel: false,
  },
  {
    pattern: 'push',
    level: 5,
    primary: ex('push.stair_push_up_low', {
      equipment: ['stair'],
      requiresStairs: true,
      noStairsAlternativeId: 'push.low_surface_push_up',
    }),
    variation: ex('push.deficit_knee_push_up', { equipment: ['floor'], requiresFloor: true }),
    sets: 2,
    scheme: { kind: 'reps', min: 6, max: 10 },
    isEntryLevel: false,
    // Severe-soreness risk: strictly volume-capped, occasional only (spec §5).
    occasionalVariation: ex('push.lower_only_push_up', {
      equipment: ['floor'],
      requiresFloor: true,
      volumeCap: { sets: 2, reps: 5 },
    }),
  },
  {
    pattern: 'push',
    level: 6,
    primary: ex('push.full_push_up', { equipment: ['floor'], requiresFloor: true }),
    variation: ex('push.full_push_up_slow', { equipment: ['floor'], requiresFloor: true }),
    sets: 2,
    scheme: { kind: 'reps', min: 5, max: 10 },
    isEntryLevel: false,
    milestone: true,
  },
  {
    pattern: 'push',
    level: 7,
    primary: ex('push.tempo_push_up', { equipment: ['floor'], requiresFloor: true }),
    variation: ex('push.close_grip_push_up', { equipment: ['floor'], requiresFloor: true }),
    sets: 2,
    scheme: { kind: 'reps', min: 6, max: 10 },
    isEntryLevel: false,
  },
  {
    pattern: 'push',
    level: 8,
    primary: ex('push.feet_elevated_push_up', { equipment: ['floor', 'stair'], requiresFloor: true }),
    variation: ex('push.archer_intro', { equipment: ['floor'], requiresFloor: true }),
    sets: 2,
    scheme: { kind: 'reps', min: 5, max: 8 },
    isEntryLevel: false,
  },
];

// ---------------------------------------------------------------------------
// Pull ladder (spec §6) — anchor-free mandatory path; door anchor optional
// ---------------------------------------------------------------------------

const PULL_LEVELS: ProgrammeLevel[] = [
  {
    pattern: 'pull',
    level: 1,
    primary: ex('pull.prone_blade_squeeze', { equipment: ['floor'], requiresFloor: true }),
    variation: ex('pull.seated_retraction_hold', { equipment: ['chair'] }),
    sets: 2,
    scheme: { kind: 'reps', min: 10, max: 15 },
    isEntryLevel: true,
  },
  {
    pattern: 'pull',
    level: 2,
    primary: ex('pull.prone_t_raise', { equipment: ['floor'], requiresFloor: true }),
    variation: ex('pull.prone_w_raise', { equipment: ['floor'], requiresFloor: true }),
    sets: 2,
    scheme: { kind: 'reps', min: 10, max: 15 },
    isEntryLevel: true,
  },
  {
    pattern: 'pull',
    level: 3,
    primary: ex('pull.ytw_circuit', { equipment: ['floor'], requiresFloor: true }),
    variation: ex('pull.reverse_snow_angel', { equipment: ['floor'], requiresFloor: true }),
    sets: 2,
    scheme: { kind: 'reps', min: 8, max: 12 },
    isEntryLevel: false,
  },
  {
    // The "free upgrade" band unlock; has_band is asked in-context here.
    pattern: 'pull',
    level: 4,
    primary: ex('pull.band_pull_apart', { equipment: ['long_band'] }),
    variation: ex('pull.overhead_band_pull_apart', { equipment: ['long_band'] }),
    sets: 2,
    scheme: { kind: 'reps', min: 10, max: 20 },
    isEntryLevel: false,
  },
  {
    pattern: 'pull',
    level: 5,
    primary: ex('pull.seated_band_row', { equipment: ['chair', 'long_band'] }),
    // Optional for users happy with the setup; one-time setup confirmation.
    variation: ex('pull.door_anchor_row', { equipment: ['long_band', 'door_anchor'] }),
    sets: 2,
    scheme: { kind: 'reps', min: 8, max: 15 },
    isEntryLevel: false,
  },
  {
    pattern: 'pull',
    level: 6,
    primary: ex('pull.single_arm_band_row', { equipment: ['chair', 'long_band'] }),
    variation: ex('pull.band_row_hold', { equipment: ['chair', 'long_band'] }),
    sets: 2,
    scheme: { kind: 'reps_per_side', min: 8, max: 12 },
    isEntryLevel: false,
  },
  {
    pattern: 'pull',
    level: 7,
    primary: ex('pull.high_band_pull', { equipment: ['long_band'] }),
    variation: ex('pull.band_high_row', { equipment: ['long_band', 'door_anchor'] }),
    sets: 2,
    scheme: { kind: 'reps', min: 10, max: 15 },
    isEntryLevel: false,
  },
  {
    pattern: 'pull',
    level: 8,
    primary: ex('pull.backpack_row', { equipment: ['long_band', 'backpack_or_weight'] }),
    variation: ex('pull.supported_single_arm_backpack_row', {
      equipment: ['chair', 'backpack_or_weight'],
    }),
    sets: 2,
    scheme: { kind: 'reps', min: 8, max: 12 },
    isEntryLevel: false,
    // Bent-over position is a loaded hinge hold (spec §6): the hinge must have
    // been taught (L5 teach-only gateway completed) before this unlocks.
    crossLadderPrereq: {
      pattern: 'hinge',
      level: 5,
      reason: 'bent_over_row_is_a_loaded_hinge_hold',
    },
  },
];

// ---------------------------------------------------------------------------
// Core ladder (spec §7) — anti-extension / anti-rotation / carries ONLY
// ---------------------------------------------------------------------------

const CORE_LEVELS: ProgrammeLevel[] = [
  {
    pattern: 'core',
    level: 1,
    primary: ex('core.dead_bug_heel_slides', { equipment: ['floor'], requiresFloor: true }),
    variation: ex('core.dead_bug_leg_lower', { equipment: ['floor'], requiresFloor: true }),
    sets: 2,
    scheme: { kind: 'reps_per_side', min: 8, max: 12 },
    isEntryLevel: true,
    coreStimulus: 'anti_extension',
  },
  {
    pattern: 'core',
    level: 2,
    primary: ex('core.dead_bug_opposite', { equipment: ['floor'], requiresFloor: true }),
    variation: ex('core.dead_bug_slow', { equipment: ['floor'], requiresFloor: true }),
    sets: 2,
    scheme: { kind: 'reps_per_side', min: 6, max: 10 },
    isEntryLevel: true,
    coreStimulus: 'anti_extension',
  },
  {
    pattern: 'core',
    level: 3,
    primary: ex('core.bird_dog', { equipment: ['floor'], requiresFloor: true }),
    variation: ex('core.bird_dog_hold', { equipment: ['floor'], requiresFloor: true }),
    sets: 2,
    scheme: { kind: 'reps_per_side', min: 6, max: 10 },
    isEntryLevel: false,
    coreStimulus: 'anti_rotation',
  },
  {
    pattern: 'core',
    level: 4,
    primary: ex('core.knee_plank', { equipment: ['floor'], requiresFloor: true }),
    variation: ex('core.knee_side_plank', { equipment: ['floor'], requiresFloor: true }),
    sets: 2,
    scheme: { kind: 'seconds', min: 15, max: 40 },
    isEntryLevel: false,
    coreStimulus: 'anti_extension',
  },
  {
    pattern: 'core',
    level: 5,
    primary: ex('core.full_plank', { equipment: ['floor'], requiresFloor: true }),
    variation: ex('core.side_plank_knees', { equipment: ['floor'], requiresFloor: true }),
    sets: 2,
    scheme: { kind: 'seconds', min: 20, max: 45 },
    isEntryLevel: false,
    coreStimulus: 'anti_extension',
  },
  {
    pattern: 'core',
    level: 6,
    primary: ex('core.full_side_plank', { equipment: ['floor'], requiresFloor: true }),
    variation: ex('core.plank_shoulder_taps', { equipment: ['floor'], requiresFloor: true }),
    sets: 2,
    scheme: { kind: 'seconds_per_side', min: 15, max: 40 },
    isEntryLevel: false,
    coreStimulus: 'anti_lateral_flexion',
  },
  {
    pattern: 'core',
    level: 7,
    primary: ex('core.suitcase_carry', { equipment: ['backpack_or_weight'] }),
    variation: ex('core.front_hug_carry', { equipment: ['backpack_or_weight'] }),
    sets: 2,
    scheme: { kind: 'seconds', min: 30, max: 45 },
    isEntryLevel: false,
    coreStimulus: 'loaded_carry',
  },
  {
    pattern: 'core',
    level: 8,
    primary: ex('core.heavy_carry', { equipment: ['backpack_or_weight'] }),
    // Optional, only where an anchor exists (spec demoted for anchor friction).
    variation: ex('core.pallof_press', { equipment: ['long_band', 'door_anchor'] }),
    sets: 2,
    scheme: { kind: 'seconds', min: 30, max: 60 },
    isEntryLevel: false,
    coreStimulus: 'loaded_carry',
  },
];

// ---------------------------------------------------------------------------
// Ladders + finisher + branches
// ---------------------------------------------------------------------------

export const PROGRAMME_LADDERS: Record<ProgrammePattern, ProgrammeLadder> = {
  squat: { pattern: 'squat', levels: SQUAT_LEVELS },
  hinge: { pattern: 'hinge', levels: HINGE_LEVELS },
  push: { pattern: 'push', levels: PUSH_LEVELS },
  pull: { pattern: 'pull', levels: PULL_LEVELS },
  core: { pattern: 'core', levels: CORE_LEVELS },
};

/**
 * The universal v1 finisher (spec §9), presented as the "power finisher".
 * Emphasis is strain rate via explosive intent; contact-based items start at
 * 20 contacts and build to 50 (spec §8 dosing carried over).
 */
export const QUIET_FINISHER_ITEMS: readonly FinisherItem[] = [
  {
    id: 'finisher.heel_drops',
    track: 'quiet_power',
    order: 1,
    dose: { kind: 'contacts', min: 20, max: 30 },
  },
  {
    id: 'finisher.moderate_stomps',
    track: 'quiet_power',
    order: 2,
    dose: { kind: 'contacts', min: 20, max: 30 },
    skipOnQuietRouting: true,
  },
  {
    id: 'finisher.explosive_sit_to_stands',
    track: 'quiet_power',
    order: 3,
    dose: { kind: 'sets_reps', sets: 2, min: 6, max: 8 },
  },
  {
    id: 'finisher.fast_step_ups',
    track: 'quiet_power',
    order: 4,
    dose: { kind: 'sets_reps', sets: 2, min: 6, max: 8, perSide: true },
    requiresStairs: true,
    noStairsAlternativeId: 'finisher.explosive_sit_to_stands',
  },
  {
    id: 'finisher.counter_push_offs',
    track: 'quiet_power',
    order: 5,
    dose: { kind: 'sets_reps', sets: 2, min: 6, max: 10 },
  },
  {
    id: 'finisher.power_march',
    track: 'quiet_power',
    order: 6,
    dose: { kind: 'seconds', min: 30, max: 45 },
  },
];

/**
 * Adaptation branches (ladder spec §10). The osteoporosis branch is deferred
 * with B2 (C1/C2 package). B3's hip and low-back flags have no branch in the
 * spec — recorded gap; the runtime pain-flag machinery covers them
 * conservatively until the spec fills it.
 */
export const ADAPTATION_BRANCHES: readonly AdaptationBranch[] = [
  {
    id: 'knee_sensitive',
    triggerPatterns: ['squat'],
    modifications: [
      'bias_box_and_step_up_variants',
      'reduce_depth_before_level',
      'tempo_and_hold_intensity_levers',
    ],
  },
  {
    id: 'wrist_sensitive',
    triggerPatterns: ['push', 'core'],
    modifications: [
      'fists_or_handles',
      'higher_incline_with_backpack_load',
      'forearm_planks',
    ],
  },
  {
    id: 'balance_limited',
    triggerPatterns: ['squat', 'hinge', 'core'],
    modifications: [
      'fingertip_support_sub_variants_default',
      'always_cue_wall_or_chair_proximity',
    ],
  },
  {
    id: 'shoulder_sensitive',
    triggerPatterns: ['push', 'pull'],
    modifications: [
      'limit_push_depth_elbows_45',
      'favour_rows_over_raises',
      'skip_overhead_work',
    ],
  },
  {
    id: 'diastasis',
    triggerPatterns: ['core'],
    modifications: [
      'favour_dead_bugs_bird_dogs_carries',
      'avoid_long_front_planks',
      'physio_signpost',
    ],
  },
];

/** Joint flags (B3) → branches pre-armed from day one, before any pain flag. */
export const JOINT_FLAG_BRANCHES: Partial<Record<string, AdaptationBranch['id']>> = {
  knee: 'knee_sensitive',
  wrist: 'wrist_sensitive',
  shoulder: 'shoulder_sensitive',
};

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

export function getProgrammeLadder(pattern: ProgrammePattern): ProgrammeLadder {
  return PROGRAMME_LADDERS[pattern];
}

export function getProgrammeLevel(pattern: ProgrammePattern, level: number): ProgrammeLevel {
  const found = PROGRAMME_LADDERS[pattern].levels.find((l) => l.level === level);
  if (!found) throw new Error(`unknown programme level ${pattern} L${level}`);
  return found;
}

export function maxProgrammeLevel(pattern: ProgrammePattern): number {
  const levels = PROGRAMME_LADDERS[pattern].levels;
  return levels[levels.length - 1].level;
}

/** Every exercise reachable anywhere in the programme (guardrail-test surface). */
export function allProgrammeExercises(): ProgrammeExercise[] {
  const out: ProgrammeExercise[] = [];
  for (const pattern of Object.keys(PROGRAMME_LADDERS) as ProgrammePattern[]) {
    for (const level of PROGRAMME_LADDERS[pattern].levels) {
      out.push(level.primary, level.variation);
      if (level.occasionalVariation) out.push(level.occasionalVariation);
    }
  }
  return out;
}
