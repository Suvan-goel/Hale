import {
  BALANCE_FEET_TOGETHER_ID,
  BALANCE_SINGLE_LEG_ID,
  BALANCE_TANDEM_ID,
  BAND_PULL_APART_ID,
  BRIDGE_HOLD_ID,
  BRIDGE_REPS_ID,
  HAMSTRING_REACH_ID,
  HEEL_RAISE_FREE_ID,
  HEEL_RAISE_SUPPORTED_ID,
  HINGE_FREE_ID,
  HINGE_WALL_ID,
  HIP_FLEXOR_STRETCH_ID,
  LATERAL_WALK_MINI_BAND_ID,
  LOADED_MARCH_ID,
  LOADED_STS_ID,
  NECK_ROTATION_ID,
  OVERHEAD_PRESS_ID,
  OVERHEAD_REACH_ID,
  PUSHUP_INCLINE_ID,
  PUSHUP_STANDARD_ID,
  PUSHUP_WALL_ID,
  SEATED_BAND_ROW_ID,
  SIDE_STEP_SUPPORTED_ID,
  SPLIT_SQUAT_SUPPORTED_ID,
  SQUAT_FREE_ID,
  SQUAT_LOADED_ID,
  SQUAT_SLOW_ECC_ID,
  SQUAT_SUPPORTED_ID,
  STANDING_BAND_ROW_ID,
  STEP_UP_ID,
  STS_CUSHION_ID,
  STS_POWER_ID,
  STS_SLOW_ECC_ID,
  STS_STANDARD_ID,
  THORACIC_ROTATION_ID,
  TOE_RAISE_SUPPORTED_ID,
  WALL_CALF_STRETCH_ID,
  listExercises,
  listVisibleExerciseLadders,
} from '../exercises';
import {
  SAFETY_CUE_SCHEMA_VERSION,
  isSafetyCueId,
  safetyCueTexts,
  type PlannedExerciseSafetyCueProfile,
  type PlannedSafetyCueSnapshot,
  type SafetyCueId,
} from './safetyCueDefinitions';

export {
  SAFETY_CUE_DEFINITIONS,
  SAFETY_CUE_SCHEMA_VERSION,
  SAFETY_VOICE_LINES,
  isSafetyCueId,
  safetyCueText,
  safetyCueTexts,
} from './safetyCueDefinitions';
export type {
  PlannedExerciseSafetyCueProfile,
  PlannedSafetyCueSnapshot,
  SafetyCueDefinition,
  SafetyCueId,
  SafetyCueTier,
} from './safetyCueDefinitions';

export type SafetyCueValidationReason =
  | 'missing_safety_cue_profile'
  | 'unsupported_safety_cue_schema'
  | 'missing_required_band_cues'
  | 'missing_required_stop_rules'
  | 'unresolved_safety_cue_id';

export interface SafetyCueValidationIssue {
  reason: SafetyCueValidationReason;
  exerciseId?: string;
  cueId?: string;
}

export type SafetyCueValidation =
  | { valid: true }
  | { valid: false; issues: readonly SafetyCueValidationIssue[] };

const GLOBAL_STOP_CUES: readonly SafetyCueId[] = [
  'global_stop_sharp_or_increasing_pain',
  'global_stop_dizzy_or_lightheaded',
  'global_breathe_normally',
  'global_clear_space',
  'global_stop_if_support_moves',
  'global_pause_if_tracking_lost',
];

const REQUIRED_GLOBAL_STOP_CUES: readonly SafetyCueId[] = [
  'global_stop_sharp_or_increasing_pain',
  'global_stop_dizzy_or_lightheaded',
  'global_pause_if_tracking_lost',
];

const SUPPORT_SETUP: readonly SafetyCueId[] = [
  'support_use_sturdy_support',
  'support_keep_support_within_reach',
];

const CHAIR_SETUP: readonly SafetyCueId[] = ['chair_use_sturdy_chair'];
const TRACKING_SETUP: readonly SafetyCueId[] = ['tracking_keep_full_body_in_view', 'tracking_move_when_cued'];
const TRACKING_ACTIVE: readonly SafetyCueId[] = ['tracking_no_rush_or_exaggerate'];
const TRACKING_RECOVERY: readonly SafetyCueId[] = ['tracking_pause_and_reset'];
const RANGE_ACTIVE: readonly SafetyCueId[] = ['comfortable_range_only', 'mobility_no_forcing'];
const CHAIR_ACTIVE: readonly SafetyCueId[] = ['chair_controlled_sit', 'comfortable_range_only'];
const SUPPORT_ACTIVE: readonly SafetyCueId[] = ['global_stop_if_support_moves'];

const FLOOR_SETUP: readonly SafetyCueId[] = [
  'floor_clear_space',
  'floor_use_support_for_transfer',
  'floor_slow_transition',
];
const FLOOR_ACTIVE: readonly SafetyCueId[] = ['floor_stop_if_transfer_unsteady', 'comfortable_range_only'];

const STEP_SETUP: readonly SafetyCueId[] = [
  'step_use_low_stable_step',
  'step_fixed_support_nearby',
  'step_clear_dry_area',
  'step_phone_out_of_path',
];
const STEP_ACTIVE: readonly SafetyCueId[] = ['step_controlled_return', 'step_stop_if_unstable'];

const BALANCE_SETUP: readonly SafetyCueId[] = [
  'balance_support_within_reach',
  'balance_no_eyes_closed_or_unstable_surface',
];
const BALANCE_ACTIVE: readonly SafetyCueId[] = [
  'balance_stop_if_unsteady',
  'balance_supported_if_hesitant',
];

const BAND_SETUP: readonly SafetyCueId[] = [
  'band_inspect_before_use',
  'band_secure_grip',
  'band_face_and_eyes_clear',
];
const BAND_ACTIVE: readonly SafetyCueId[] = [
  'band_controlled_return',
  'band_never_release_under_tension',
  'band_stop_if_slips_or_shifts',
];
const DOOR_ANCHOR_SETUP: readonly SafetyCueId[] = [
  'door_anchor_follow_manufacturer_setup',
  'door_anchor_fully_closed',
  'door_anchor_test_light_tension',
  'door_anchor_stay_out_of_door_path',
];
const DOOR_ANCHOR_ACTIVE: readonly SafetyCueId[] = ['door_anchor_stop_if_moves'];

interface ExerciseCueInput {
  setup?: readonly SafetyCueId[];
  active?: readonly SafetyCueId[];
  repeated?: readonly SafetyCueId[];
  recovery?: readonly SafetyCueId[];
}

function profile(exerciseId: string, input: ExerciseCueInput): PlannedExerciseSafetyCueProfile {
  return {
    schemaVersion: SAFETY_CUE_SCHEMA_VERSION,
    exerciseId,
    setupCueIds: unique(input.setup ?? []),
    activeCueIds: unique(input.active ?? []),
    repeatedSetCueIds: unique(input.repeated ?? input.active ?? []),
    recoveryCueIds: unique(input.recovery ?? TRACKING_RECOVERY),
  };
}

const SIT_TO_STAND_SETUP = [...CHAIR_SETUP, ...TRACKING_SETUP] as const;
const SIT_TO_STAND_ACTIVE = [...CHAIR_ACTIVE, ...TRACKING_ACTIVE] as const;
const SUPPORTED_STRENGTH_SETUP = [...SUPPORT_SETUP, ...TRACKING_SETUP] as const;
const SUPPORTED_STRENGTH_ACTIVE = [...SUPPORT_ACTIVE, 'comfortable_range_only', ...TRACKING_ACTIVE] as const;
const UNSUPPORTED_STRENGTH_SETUP = [...TRACKING_SETUP] as const;
const UNSUPPORTED_STRENGTH_ACTIVE = ['comfortable_range_only', ...TRACKING_ACTIVE] as const;
const FLOOR_STRENGTH_SETUP = [...FLOOR_SETUP, ...TRACKING_SETUP] as const;
const FLOOR_STRENGTH_ACTIVE = [...FLOOR_ACTIVE, ...TRACKING_ACTIVE] as const;
const MOBILITY_SETUP = [...TRACKING_SETUP] as const;
const MOBILITY_ACTIVE = [...RANGE_ACTIVE, ...TRACKING_ACTIVE] as const;

const EXERCISE_SAFETY_PROFILES: Readonly<Record<string, PlannedExerciseSafetyCueProfile>> = {
  [STS_CUSHION_ID]: profile(STS_CUSHION_ID, {
    setup: SIT_TO_STAND_SETUP,
    active: SIT_TO_STAND_ACTIVE,
    repeated: ['chair_controlled_sit', 'tracking_no_rush_or_exaggerate'],
  }),
  [STS_STANDARD_ID]: profile(STS_STANDARD_ID, {
    setup: SIT_TO_STAND_SETUP,
    active: SIT_TO_STAND_ACTIVE,
    repeated: ['chair_controlled_sit', 'tracking_no_rush_or_exaggerate'],
  }),
  [STS_SLOW_ECC_ID]: profile(STS_SLOW_ECC_ID, {
    setup: SIT_TO_STAND_SETUP,
    active: SIT_TO_STAND_ACTIVE,
    repeated: ['chair_controlled_sit', 'tracking_no_rush_or_exaggerate'],
  }),
  [STS_POWER_ID]: profile(STS_POWER_ID, {
    setup: SIT_TO_STAND_SETUP,
    active: SIT_TO_STAND_ACTIVE,
    repeated: ['chair_controlled_sit', 'tracking_no_rush_or_exaggerate'],
  }),
  [LOADED_STS_ID]: profile(LOADED_STS_ID, {
    setup: SIT_TO_STAND_SETUP,
    active: SIT_TO_STAND_ACTIVE,
    repeated: ['chair_controlled_sit', 'tracking_no_rush_or_exaggerate'],
  }),
  [SQUAT_SUPPORTED_ID]: profile(SQUAT_SUPPORTED_ID, {
    setup: [...SUPPORTED_STRENGTH_SETUP, ...CHAIR_SETUP],
    active: SUPPORTED_STRENGTH_ACTIVE,
  }),
  [SQUAT_FREE_ID]: profile(SQUAT_FREE_ID, {
    setup: UNSUPPORTED_STRENGTH_SETUP,
    active: UNSUPPORTED_STRENGTH_ACTIVE,
  }),
  [SQUAT_SLOW_ECC_ID]: profile(SQUAT_SLOW_ECC_ID, {
    setup: UNSUPPORTED_STRENGTH_SETUP,
    active: UNSUPPORTED_STRENGTH_ACTIVE,
  }),
  [SQUAT_LOADED_ID]: profile(SQUAT_LOADED_ID, {
    setup: UNSUPPORTED_STRENGTH_SETUP,
    active: UNSUPPORTED_STRENGTH_ACTIVE,
  }),
  [SPLIT_SQUAT_SUPPORTED_ID]: profile(SPLIT_SQUAT_SUPPORTED_ID, {
    setup: [...SUPPORTED_STRENGTH_SETUP, ...CHAIR_SETUP],
    active: SUPPORTED_STRENGTH_ACTIVE,
  }),
  [STEP_UP_ID]: profile(STEP_UP_ID, {
    setup: [...STEP_SETUP, ...TRACKING_SETUP],
    active: [...STEP_ACTIVE, ...TRACKING_ACTIVE],
    repeated: ['step_controlled_return', 'step_stop_if_unstable'],
  }),
  [HEEL_RAISE_SUPPORTED_ID]: profile(HEEL_RAISE_SUPPORTED_ID, {
    setup: SUPPORTED_STRENGTH_SETUP,
    active: SUPPORTED_STRENGTH_ACTIVE,
  }),
  [HEEL_RAISE_FREE_ID]: profile(HEEL_RAISE_FREE_ID, {
    setup: UNSUPPORTED_STRENGTH_SETUP,
    active: UNSUPPORTED_STRENGTH_ACTIVE,
  }),
  [TOE_RAISE_SUPPORTED_ID]: profile(TOE_RAISE_SUPPORTED_ID, {
    setup: SUPPORTED_STRENGTH_SETUP,
    active: SUPPORTED_STRENGTH_ACTIVE,
  }),
  [PUSHUP_WALL_ID]: profile(PUSHUP_WALL_ID, {
    setup: [...SUPPORT_SETUP, ...TRACKING_SETUP],
    active: SUPPORTED_STRENGTH_ACTIVE,
  }),
  [PUSHUP_INCLINE_ID]: profile(PUSHUP_INCLINE_ID, {
    setup: [...SUPPORT_SETUP, ...CHAIR_SETUP, ...TRACKING_SETUP],
    active: SUPPORTED_STRENGTH_ACTIVE,
  }),
  [PUSHUP_STANDARD_ID]: profile(PUSHUP_STANDARD_ID, {
    setup: FLOOR_STRENGTH_SETUP,
    active: FLOOR_STRENGTH_ACTIVE,
  }),
  [SEATED_BAND_ROW_ID]: profile(SEATED_BAND_ROW_ID, {
    setup: [...CHAIR_SETUP, ...BAND_SETUP, 'band_anchor_feet_secure', ...TRACKING_SETUP],
    active: [...BAND_ACTIVE, 'band_do_not_overstretch', ...TRACKING_ACTIVE],
    repeated: ['band_controlled_return', 'band_never_release_under_tension', 'band_stop_if_slips_or_shifts'],
  }),
  [STANDING_BAND_ROW_ID]: profile(STANDING_BAND_ROW_ID, {
    setup: [...BAND_SETUP, ...DOOR_ANCHOR_SETUP, 'band_stable_stance', ...TRACKING_SETUP],
    active: [...BAND_ACTIVE, ...DOOR_ANCHOR_ACTIVE, ...TRACKING_ACTIVE],
    repeated: ['band_controlled_return', 'band_stop_if_slips_or_shifts', 'door_anchor_stop_if_moves'],
  }),
  [BAND_PULL_APART_ID]: profile(BAND_PULL_APART_ID, {
    setup: [...BAND_SETUP, ...TRACKING_SETUP],
    active: [...BAND_ACTIVE, ...RANGE_ACTIVE, ...TRACKING_ACTIVE],
    repeated: ['band_controlled_return', 'band_never_release_under_tension'],
  }),
  [HINGE_WALL_ID]: profile(HINGE_WALL_ID, {
    setup: [...SUPPORT_SETUP, ...TRACKING_SETUP],
    active: SUPPORTED_STRENGTH_ACTIVE,
  }),
  [HINGE_FREE_ID]: profile(HINGE_FREE_ID, {
    setup: UNSUPPORTED_STRENGTH_SETUP,
    active: UNSUPPORTED_STRENGTH_ACTIVE,
  }),
  [BRIDGE_HOLD_ID]: profile(BRIDGE_HOLD_ID, {
    setup: FLOOR_STRENGTH_SETUP,
    active: FLOOR_STRENGTH_ACTIVE,
  }),
  [BRIDGE_REPS_ID]: profile(BRIDGE_REPS_ID, {
    setup: FLOOR_STRENGTH_SETUP,
    active: FLOOR_STRENGTH_ACTIVE,
  }),
  [OVERHEAD_REACH_ID]: profile(OVERHEAD_REACH_ID, {
    setup: MOBILITY_SETUP,
    active: MOBILITY_ACTIVE,
  }),
  [OVERHEAD_PRESS_ID]: profile(OVERHEAD_PRESS_ID, {
    setup: [...BAND_SETUP, 'band_stable_stance', ...TRACKING_SETUP],
    active: [...BAND_ACTIVE, ...RANGE_ACTIVE, ...TRACKING_ACTIVE],
    repeated: ['band_controlled_return', 'band_never_release_under_tension', 'comfortable_range_only'],
  }),
  [BALANCE_FEET_TOGETHER_ID]: profile(BALANCE_FEET_TOGETHER_ID, {
    setup: [...BALANCE_SETUP, ...TRACKING_SETUP],
    active: [...BALANCE_ACTIVE, ...TRACKING_ACTIVE],
    repeated: ['balance_stop_if_unsteady', 'balance_supported_if_hesitant'],
  }),
  [BALANCE_TANDEM_ID]: profile(BALANCE_TANDEM_ID, {
    setup: [...BALANCE_SETUP, ...TRACKING_SETUP],
    active: [...BALANCE_ACTIVE, ...TRACKING_ACTIVE],
    repeated: ['balance_stop_if_unsteady', 'balance_supported_if_hesitant'],
  }),
  [BALANCE_SINGLE_LEG_ID]: profile(BALANCE_SINGLE_LEG_ID, {
    setup: [...BALANCE_SETUP, ...TRACKING_SETUP],
    active: [...BALANCE_ACTIVE, ...TRACKING_ACTIVE],
    repeated: ['balance_stop_if_unsteady', 'balance_supported_if_hesitant'],
  }),
  [SIDE_STEP_SUPPORTED_ID]: profile(SIDE_STEP_SUPPORTED_ID, {
    setup: [...BALANCE_SETUP, ...TRACKING_SETUP],
    active: [...BALANCE_ACTIVE, ...TRACKING_ACTIVE],
    repeated: ['balance_stop_if_unsteady', 'balance_supported_if_hesitant'],
  }),
  [LATERAL_WALK_MINI_BAND_ID]: profile(LATERAL_WALK_MINI_BAND_ID, {
    setup: [...BAND_SETUP, ...BALANCE_SETUP, ...TRACKING_SETUP],
    active: [...BAND_ACTIVE, ...BALANCE_ACTIVE, ...TRACKING_ACTIVE],
  }),
  [LOADED_MARCH_ID]: profile(LOADED_MARCH_ID, {
    setup: [...BALANCE_SETUP, ...TRACKING_SETUP],
    active: [...BALANCE_ACTIVE, ...TRACKING_ACTIVE],
  }),
  [HAMSTRING_REACH_ID]: profile(HAMSTRING_REACH_ID, {
    setup: [...CHAIR_SETUP, ...TRACKING_SETUP],
    active: MOBILITY_ACTIVE,
  }),
  [THORACIC_ROTATION_ID]: profile(THORACIC_ROTATION_ID, {
    setup: MOBILITY_SETUP,
    active: MOBILITY_ACTIVE,
  }),
  [HIP_FLEXOR_STRETCH_ID]: profile(HIP_FLEXOR_STRETCH_ID, {
    setup: [...SUPPORT_SETUP, ...MOBILITY_SETUP],
    active: [...RANGE_ACTIVE, ...SUPPORT_ACTIVE, ...TRACKING_ACTIVE],
  }),
  [WALL_CALF_STRETCH_ID]: profile(WALL_CALF_STRETCH_ID, {
    setup: [...SUPPORT_SETUP, ...MOBILITY_SETUP],
    active: [...RANGE_ACTIVE, ...SUPPORT_ACTIVE, ...TRACKING_ACTIVE],
  }),
  [NECK_ROTATION_ID]: profile(NECK_ROTATION_ID, {
    setup: ['tracking_move_when_cued'],
    active: RANGE_ACTIVE,
    recovery: [],
  }),
};

export const SESSION_GLOBAL_SAFETY_CUE_IDS: readonly SafetyCueId[] = GLOBAL_STOP_CUES;
export const REQUIRED_BAND_CUE_IDS: readonly SafetyCueId[] = [...BAND_SETUP, ...BAND_ACTIVE];
export const REQUIRED_DOOR_ANCHOR_CUE_IDS: readonly SafetyCueId[] = [
  ...DOOR_ANCHOR_SETUP,
  ...DOOR_ANCHOR_ACTIVE,
];
export const REQUIRED_STEP_CUE_IDS: readonly SafetyCueId[] = [...STEP_SETUP, ...STEP_ACTIVE];
export const REQUIRED_FLOOR_CUE_IDS: readonly SafetyCueId[] = [...FLOOR_SETUP, ...FLOOR_ACTIVE];
export const REQUIRED_BALANCE_CUE_IDS: readonly SafetyCueId[] = [...BALANCE_SETUP, ...BALANCE_ACTIVE];

export function resolveExerciseSafetyCueProfile(exerciseId: string): PlannedExerciseSafetyCueProfile | null {
  const resolved = EXERCISE_SAFETY_PROFILES[exerciseId];
  return resolved ? cloneProfile(resolved) : null;
}

export function requireExerciseSafetyCueProfile(exerciseId: string): PlannedExerciseSafetyCueProfile {
  const profileForExercise = resolveExerciseSafetyCueProfile(exerciseId);
  if (!profileForExercise) {
    throw new Error(`missing safety cue profile for exercise '${exerciseId}'`);
  }
  return profileForExercise;
}

export function safetyCueProfileText(profileForExercise: PlannedExerciseSafetyCueProfile): {
  setup: string[];
  active: string[];
  repeated: string[];
  recovery: string[];
} {
  return {
    setup: safetyCueTexts(profileForExercise.setupCueIds),
    active: safetyCueTexts(profileForExercise.activeCueIds),
    repeated: safetyCueTexts(profileForExercise.repeatedSetCueIds),
    recovery: safetyCueTexts(profileForExercise.recoveryCueIds),
  };
}

export function exerciseSafetySetupText(exerciseId: string): string[] {
  const profileForExercise = resolveExerciseSafetyCueProfile(exerciseId);
  return profileForExercise ? safetyCueTexts(profileForExercise.setupCueIds) : [];
}

export function exerciseSafetySummaryText(exerciseId: string): string[] {
  const profileForExercise = resolveExerciseSafetyCueProfile(exerciseId);
  if (!profileForExercise) return [];
  return safetyCueTexts(unique([...profileForExercise.activeCueIds, ...profileForExercise.recoveryCueIds]));
}

export function plannedSafetyCueSnapshotForExercises(
  exerciseIds: readonly string[]
): PlannedSafetyCueSnapshot {
  const exerciseProfiles = exerciseIds.map(requireExerciseSafetyCueProfile);
  const snapshot: PlannedSafetyCueSnapshot = {
    schemaVersion: SAFETY_CUE_SCHEMA_VERSION,
    globalCueIds: SESSION_GLOBAL_SAFETY_CUE_IDS,
    exerciseProfiles,
    fingerprint: '',
  };
  return {
    ...snapshot,
    fingerprint: safetyCueSnapshotFingerprint(snapshot),
  };
}

export function validateExerciseSafetyCueProfile(input: {
  exerciseId: string;
  profile?: PlannedExerciseSafetyCueProfile | null;
}): SafetyCueValidation {
  const expected = resolveExerciseSafetyCueProfile(input.exerciseId);
  const profileForExercise = input.profile ?? expected;
  const issues: SafetyCueValidationIssue[] = [];
  if (!expected || !profileForExercise) {
    issues.push({ reason: 'missing_safety_cue_profile', exerciseId: input.exerciseId });
    return { valid: false, issues };
  }
  if (profileForExercise.schemaVersion !== SAFETY_CUE_SCHEMA_VERSION) {
    issues.push({ reason: 'unsupported_safety_cue_schema', exerciseId: input.exerciseId });
  }
  for (const cueId of profileCueIds(profileForExercise)) {
    if (!isSafetyCueId(cueId)) {
      issues.push({ reason: 'unresolved_safety_cue_id', exerciseId: input.exerciseId, cueId });
    }
  }
  const expectedIds = profileCueIds(expected);
  for (const cueId of expectedIds) {
    if (!profileCueIds(profileForExercise).includes(cueId)) {
      issues.push({
        reason: requiredBandCueSet(input.exerciseId).includes(cueId)
          ? 'missing_required_band_cues'
          : 'missing_safety_cue_profile',
        exerciseId: input.exerciseId,
        cueId,
      });
    }
  }
  return issues.length > 0 ? { valid: false, issues } : { valid: true };
}

export function validateSafetyCueSnapshot(input: {
  exerciseIds: readonly string[];
  snapshot?: PlannedSafetyCueSnapshot | null;
}): SafetyCueValidation {
  const issues: SafetyCueValidationIssue[] = [];
  const { snapshot } = input;
  if (!snapshot) {
    return {
      valid: false,
      issues: [{ reason: 'missing_safety_cue_profile' }],
    };
  }
  if (snapshot.schemaVersion !== SAFETY_CUE_SCHEMA_VERSION) {
    issues.push({ reason: 'unsupported_safety_cue_schema' });
  }
  for (const cueId of snapshot.globalCueIds ?? []) {
    if (!isSafetyCueId(cueId)) issues.push({ reason: 'unresolved_safety_cue_id', cueId });
  }
  for (const cueId of REQUIRED_GLOBAL_STOP_CUES) {
    if (!snapshot.globalCueIds.includes(cueId)) {
      issues.push({ reason: 'missing_required_stop_rules', cueId });
    }
  }
  const profileById = new Map(snapshot.exerciseProfiles.map((profileForExercise) => [profileForExercise.exerciseId, profileForExercise]));
  for (const exerciseId of input.exerciseIds) {
    const validation = validateExerciseSafetyCueProfile({
      exerciseId,
      profile: profileById.get(exerciseId),
    });
    if (!validation.valid) issues.push(...validation.issues);
  }
  const expected = plannedSafetyCueSnapshotForExercises(input.exerciseIds);
  if (snapshot.fingerprint !== expected.fingerprint) {
    issues.push({ reason: 'missing_safety_cue_profile' });
  }
  return issues.length > 0 ? { valid: false, issues: uniqueIssues(issues) } : { valid: true };
}

export function safetyCueSnapshotFingerprint(snapshot: Omit<PlannedSafetyCueSnapshot, 'fingerprint'>): string {
  const payload = [
    `v${snapshot.schemaVersion}`,
    snapshot.globalCueIds.join(','),
    ...snapshot.exerciseProfiles.map((profileForExercise) => [
      profileForExercise.exerciseId,
      profileForExercise.setupCueIds.join(','),
      profileForExercise.activeCueIds.join(','),
      profileForExercise.repeatedSetCueIds.join(','),
      profileForExercise.recoveryCueIds.join(','),
    ].join(':')),
  ].join('|');
  let hash = 2166136261;
  for (let idx = 0; idx < payload.length; idx++) {
    hash ^= payload.charCodeAt(idx);
    hash = Math.imul(hash, 16777619);
  }
  return `safety-cues-v${snapshot.schemaVersion}-${(hash >>> 0).toString(36)}`;
}

export function coreExerciseIdsMissingSafetyProfiles(): string[] {
  return listVisibleExerciseLadders(false)
    .flatMap((ladder) => ladder.levels)
    .map((level) => level.id)
    .filter((exerciseId) => !EXERCISE_SAFETY_PROFILES[exerciseId]);
}

export function registeredExerciseIdsMissingSafetyProfiles(): string[] {
  return listExercises()
    .map((exercise) => exercise.id)
    .filter((exerciseId) => !EXERCISE_SAFETY_PROFILES[exerciseId]);
}

function cloneProfile(profileForExercise: PlannedExerciseSafetyCueProfile): PlannedExerciseSafetyCueProfile {
  return {
    schemaVersion: profileForExercise.schemaVersion,
    exerciseId: profileForExercise.exerciseId,
    setupCueIds: profileForExercise.setupCueIds.slice(),
    activeCueIds: profileForExercise.activeCueIds.slice(),
    repeatedSetCueIds: profileForExercise.repeatedSetCueIds.slice(),
    recoveryCueIds: profileForExercise.recoveryCueIds.slice(),
  };
}

function profileCueIds(profileForExercise: PlannedExerciseSafetyCueProfile): SafetyCueId[] {
  return unique([
    ...profileForExercise.setupCueIds,
    ...profileForExercise.activeCueIds,
    ...profileForExercise.repeatedSetCueIds,
    ...profileForExercise.recoveryCueIds,
  ]);
}

function requiredBandCueSet(exerciseId: string): readonly SafetyCueId[] {
  if (
    exerciseId === SEATED_BAND_ROW_ID ||
    exerciseId === STANDING_BAND_ROW_ID ||
    exerciseId === BAND_PULL_APART_ID ||
    exerciseId === OVERHEAD_PRESS_ID ||
    exerciseId === LATERAL_WALK_MINI_BAND_ID
  ) {
    return REQUIRED_BAND_CUE_IDS;
  }
  return [];
}

function uniqueIssues(issues: readonly SafetyCueValidationIssue[]): SafetyCueValidationIssue[] {
  const out: SafetyCueValidationIssue[] = [];
  const seen = new Set<string>();
  for (const issue of issues) {
    const key = `${issue.reason}:${issue.exerciseId ?? ''}:${issue.cueId ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(issue);
  }
  return out;
}

function unique<T>(items: readonly T[]): T[] {
  const out: T[] = [];
  for (const item of items) {
    if (!out.includes(item)) out.push(item);
  }
  return out;
}
