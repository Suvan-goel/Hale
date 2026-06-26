import type { VoicePlaybackResult } from '../../audio/voicePlayer';
import {
  getTrainingVoiceContractV21,
  TRAINING_VOICE_SHARED_LOGICAL_CUES_V21,
} from './contracts';
import {
  SESSION_GLOBAL_SAFETY_CUE_IDS,
  requireExerciseSafetyCueProfile,
  safetyCueSnapshotFingerprint,
  type PlannedExerciseSafetyCueProfile,
  type PlannedSafetyCueSnapshot,
  type SafetyCueId,
} from '../safetyCues';
import type {
  TrainingVoiceExerciseContractV21,
  TrainingVoiceLogicalCueV21,
  TrainingVoiceSafetyFamilyV21,
  TrainingVoiceSafetyFulfilmentV21,
  TrainingVoiceSafetyPlanV21,
  TrainingVoiceSafetyReasonCodeV21,
  TrainingVoiceSessionMemoryV21,
} from './types';

export type TrainingVoiceSafetyCueMigrationClassificationV21 =
  | 'mapped_to_universal_v21'
  | 'mapped_to_normal_family_v21'
  | 'absorbed_into_exact_instruction_v21'
  | 'reactive_control_recovery_later_phase'
  | 'legacy_only'
  | 'retired_later_after_asset_migration'
  | 'not_applicable_to_current_v21';

export interface TrainingVoiceSafetyCueMigrationV21 {
  readonly cueId: SafetyCueId;
  readonly classification: TrainingVoiceSafetyCueMigrationClassificationV21;
  readonly normalFamily: TrainingVoiceSafetyFamilyV21 | null;
  readonly destination: string;
}

export interface ResolveTrainingVoiceSafetyV21Input {
  readonly contract: Pick<
    TrainingVoiceExerciseContractV21,
    'exerciseId' | 'equipment' | 'safetyPlan'
  >;
  readonly sourceSafetyProfile?: PlannedExerciseSafetyCueProfile | null;
  readonly sessionMemory?: TrainingVoiceSessionMemoryV21 | unknown | null;
  readonly capability?: { readonly floorEligible?: boolean | null } | null;
}

export interface ResolvedTrainingVoiceSafetyV21 extends TrainingVoiceSafetyPlanV21 {
  readonly dueFamily: TrainingVoiceSafetyFamilyV21;
}

export const EMPTY_TRAINING_VOICE_SESSION_MEMORY_V21: TrainingVoiceSessionMemoryV21 = Object.freeze({
  version: 1,
  universalSafety: 'not_started',
  introducedSafetyFamilies: [],
  floor: {
    floorFamilyIntroduced: false,
    currentEnvironment: 'unknown' as const,
    currentFloorItemId: null,
    currentFloorSetupEpoch: 0,
  },
  firstUseExerciseIds: [],
});

const FAMILY_CUE_KEY: Readonly<
  Record<Exclude<TrainingVoiceSafetyFamilyV21, 'none' | 'mini_band_above_knees'>, string>
> = {
  chair_seat: 'equip-chair-stable-v21',
  generic_support: 'equip-support-close-v21',
  balance_support: 'equip-balance-support-v21',
  step_or_stair: 'equip-step-stable-v21',
  long_band_handheld_or_foot_anchored: 'equip-long-band-v21',
  door_anchor_band: 'equip-door-anchor-v21',
  floor_eligible_user: 'equip-floor-transition-v21',
};

const FAMILY_PARENT: Readonly<Record<TrainingVoiceSafetyFamilyV21, TrainingVoiceSafetyFamilyV21 | null>> = {
  none: null,
  chair_seat: null,
  generic_support: null,
  balance_support: 'generic_support',
  step_or_stair: 'generic_support',
  long_band_handheld_or_foot_anchored: null,
  door_anchor_band: 'long_band_handheld_or_foot_anchored',
  mini_band_above_knees: null,
  floor_eligible_user: null,
};

const FAMILY_SUBSUMES: Readonly<Record<TrainingVoiceSafetyFamilyV21, readonly TrainingVoiceSafetyFamilyV21[]>> = {
  none: [],
  chair_seat: [],
  generic_support: [],
  balance_support: ['generic_support'],
  step_or_stair: ['generic_support'],
  long_band_handheld_or_foot_anchored: [],
  door_anchor_band: ['long_band_handheld_or_foot_anchored'],
  mini_band_above_knees: ['balance_support'],
  floor_eligible_user: ['generic_support'],
};

const SUBSUMPTION_REASON: Readonly<
  Partial<Record<TrainingVoiceSafetyFamilyV21, TrainingVoiceSafetyReasonCodeV21>>
> = {
  balance_support: 'BALANCE_SUBSUMES_GENERIC_SUPPORT',
  step_or_stair: 'STEP_SUBSUMES_GENERIC_SUPPORT',
  door_anchor_band: 'DOOR_ANCHOR_SUBSUMES_LONG_BAND',
  floor_eligible_user: 'FLOOR_SUBSUMES_GENERIC_SUPPORT',
  mini_band_above_knees: 'MINI_BAND_SUBSUMES_BALANCE_SUPPORT',
};

const SEPARATE_FAMILIES: readonly TrainingVoiceSafetyFamilyV21[] = [
  'floor_eligible_user',
  'door_anchor_band',
  'step_or_stair',
  'balance_support',
  'long_band_handheld_or_foot_anchored',
  'chair_seat',
  'generic_support',
  'mini_band_above_knees',
];

export const TRAINING_VOICE_SAFETY_CUE_MIGRATION_V21: Readonly<
  Record<SafetyCueId, TrainingVoiceSafetyCueMigrationV21>
> = Object.freeze({
  global_stop_sharp_or_increasing_pain: migration(
    'global_stop_sharp_or_increasing_pain',
    'mapped_to_universal_v21',
    null,
    'safe-session-start-v21'
  ),
  global_stop_dizzy_or_lightheaded: migration(
    'global_stop_dizzy_or_lightheaded',
    'mapped_to_universal_v21',
    null,
    'safe-session-start-v21'
  ),
  global_breathe_normally: migration(
    'global_breathe_normally',
    'reactive_control_recovery_later_phase',
    null,
    'IR-VOICE-TRAINING-CONTROLS'
  ),
  global_clear_space: migration('global_clear_space', 'mapped_to_universal_v21', null, 'safe-session-start-v21'),
  global_stop_if_support_moves: migration(
    'global_stop_if_support_moves',
    'reactive_control_recovery_later_phase',
    null,
    'IR-VOICE-TRAINING-CONTROLS'
  ),
  global_pause_if_tracking_lost: migration(
    'global_pause_if_tracking_lost',
    'reactive_control_recovery_later_phase',
    null,
    'IR-VOICE-TRAINING-RECOVERY'
  ),
  support_use_sturdy_support: migration(
    'support_use_sturdy_support',
    'mapped_to_normal_family_v21',
    'generic_support',
    'equip-support-close-v21 or explicit exact instruction'
  ),
  support_keep_support_within_reach: migration(
    'support_keep_support_within_reach',
    'mapped_to_normal_family_v21',
    'generic_support',
    'equip-support-close-v21 or explicit exact instruction'
  ),
  chair_use_sturdy_chair: migration(
    'chair_use_sturdy_chair',
    'mapped_to_normal_family_v21',
    'chair_seat',
    'equip-chair-stable-v21 or explicit exact instruction'
  ),
  chair_controlled_sit: migration(
    'chair_controlled_sit',
    'absorbed_into_exact_instruction_v21',
    'chair_seat',
    'controlled chair-use wording in exact instruction'
  ),
  floor_clear_space: migration(
    'floor_clear_space',
    'mapped_to_normal_family_v21',
    'floor_eligible_user',
    'floor capability/equipment gate plus equip-floor-transition-v21'
  ),
  floor_use_support_for_transfer: migration(
    'floor_use_support_for_transfer',
    'mapped_to_normal_family_v21',
    'floor_eligible_user',
    'canonical floor gate plus equip-floor-transition-v21'
  ),
  floor_slow_transition: migration(
    'floor_slow_transition',
    'mapped_to_normal_family_v21',
    'floor_eligible_user',
    'equip-floor-transition-v21'
  ),
  floor_stop_if_transfer_unsteady: migration(
    'floor_stop_if_transfer_unsteady',
    'reactive_control_recovery_later_phase',
    null,
    'IR-VOICE-TRAINING-RECOVERY'
  ),
  step_use_low_stable_step: migration('step_use_low_stable_step', 'mapped_to_normal_family_v21', 'step_or_stair', 'equip-step-stable-v21'),
  step_fixed_support_nearby: migration('step_fixed_support_nearby', 'mapped_to_normal_family_v21', 'step_or_stair', 'equip-step-stable-v21'),
  step_clear_dry_area: migration('step_clear_dry_area', 'mapped_to_normal_family_v21', 'step_or_stair', 'equip-step-stable-v21'),
  step_phone_out_of_path: migration(
    'step_phone_out_of_path',
    'absorbed_into_exact_instruction_v21',
    'step_or_stair',
    'visible setup / later controls phase'
  ),
  step_controlled_return: migration(
    'step_controlled_return',
    'absorbed_into_exact_instruction_v21',
    'step_or_stair',
    'step-up exact instruction'
  ),
  step_stop_if_unstable: migration(
    'step_stop_if_unstable',
    'reactive_control_recovery_later_phase',
    null,
    'IR-VOICE-TRAINING-RECOVERY'
  ),
  band_inspect_before_use: migration(
    'band_inspect_before_use',
    'mapped_to_normal_family_v21',
    'long_band_handheld_or_foot_anchored',
    'equip-long-band-v21'
  ),
  band_secure_grip: migration(
    'band_secure_grip',
    'mapped_to_normal_family_v21',
    'long_band_handheld_or_foot_anchored',
    'equip-long-band-v21 or exact instruction'
  ),
  band_face_and_eyes_clear: migration(
    'band_face_and_eyes_clear',
    'mapped_to_normal_family_v21',
    'long_band_handheld_or_foot_anchored',
    'equip-long-band-v21'
  ),
  band_controlled_return: migration(
    'band_controlled_return',
    'absorbed_into_exact_instruction_v21',
    'long_band_handheld_or_foot_anchored',
    'return slowly/control wording in exact instruction'
  ),
  band_never_release_under_tension: migration(
    'band_never_release_under_tension',
    'reactive_control_recovery_later_phase',
    null,
    'IR-VOICE-TRAINING-CONTROLS'
  ),
  band_stop_if_slips_or_shifts: migration(
    'band_stop_if_slips_or_shifts',
    'reactive_control_recovery_later_phase',
    null,
    'IR-VOICE-TRAINING-RECOVERY'
  ),
  band_anchor_feet_secure: migration(
    'band_anchor_feet_secure',
    'absorbed_into_exact_instruction_v21',
    'long_band_handheld_or_foot_anchored',
    'foot-anchored exact instruction'
  ),
  band_do_not_overstretch: migration(
    'band_do_not_overstretch',
    'reactive_control_recovery_later_phase',
    null,
    'IR-VOICE-TRAINING-CONTROLS'
  ),
  door_anchor_follow_manufacturer_setup: migration('door_anchor_follow_manufacturer_setup', 'mapped_to_normal_family_v21', 'door_anchor_band', 'equip-door-anchor-v21'),
  door_anchor_fully_closed: migration('door_anchor_fully_closed', 'mapped_to_normal_family_v21', 'door_anchor_band', 'equip-door-anchor-v21'),
  door_anchor_test_light_tension: migration('door_anchor_test_light_tension', 'mapped_to_normal_family_v21', 'door_anchor_band', 'equip-door-anchor-v21'),
  door_anchor_stay_out_of_door_path: migration(
    'door_anchor_stay_out_of_door_path',
    'absorbed_into_exact_instruction_v21',
    'door_anchor_band',
    'visible setup / later controls phase'
  ),
  door_anchor_stop_if_moves: migration(
    'door_anchor_stop_if_moves',
    'reactive_control_recovery_later_phase',
    null,
    'IR-VOICE-TRAINING-RECOVERY'
  ),
  band_stable_stance: migration(
    'band_stable_stance',
    'absorbed_into_exact_instruction_v21',
    'long_band_handheld_or_foot_anchored',
    'stable-stance exact instruction'
  ),
  comfortable_range_only: migration(
    'comfortable_range_only',
    'absorbed_into_exact_instruction_v21',
    null,
    'comfortable-range exact instruction'
  ),
  mobility_no_forcing: migration(
    'mobility_no_forcing',
    'absorbed_into_exact_instruction_v21',
    null,
    'gentle/comfortable exact instruction'
  ),
  balance_stop_if_unsteady: migration(
    'balance_stop_if_unsteady',
    'reactive_control_recovery_later_phase',
    null,
    'IR-VOICE-TRAINING-RECOVERY'
  ),
  balance_support_within_reach: migration('balance_support_within_reach', 'mapped_to_normal_family_v21', 'balance_support', 'equip-balance-support-v21 or exact instruction'),
  balance_supported_if_hesitant: migration(
    'balance_supported_if_hesitant',
    'reactive_control_recovery_later_phase',
    null,
    'IR-VOICE-TRAINING-CONTROLS'
  ),
  balance_no_eyes_closed_or_unstable_surface: migration(
    'balance_no_eyes_closed_or_unstable_surface',
    'absorbed_into_exact_instruction_v21',
    'balance_support',
    'eyes-open Balance V2 protocol / exact instruction'
  ),
  tracking_keep_full_body_in_view: migration(
    'tracking_keep_full_body_in_view',
    'reactive_control_recovery_later_phase',
    null,
    'V2.1 setup/recovery cues'
  ),
  tracking_pause_and_reset: migration(
    'tracking_pause_and_reset',
    'reactive_control_recovery_later_phase',
    null,
    'tracking-loss-v21 / tracking-recovered-v21 later integration'
  ),
  tracking_no_rush_or_exaggerate: migration(
    'tracking_no_rush_or_exaggerate',
    'reactive_control_recovery_later_phase',
    null,
    'IR-VOICE-TRAINING-CONTROLS'
  ),
  tracking_move_when_cued: migration(
    'tracking_move_when_cued',
    'absorbed_into_exact_instruction_v21',
    null,
    'countdown boundary'
  ),
});

export function listTrainingVoiceSafetyCueMigrationV21(): TrainingVoiceSafetyCueMigrationV21[] {
  return Object.values(TRAINING_VOICE_SAFETY_CUE_MIGRATION_V21).sort((a, b) => a.cueId.localeCompare(b.cueId));
}

export function validateTrainingVoiceSafetyCueMigrationV21(): {
  readonly valid: boolean;
  readonly unclassifiedCueIds: readonly string[];
} {
  const unclassifiedCueIds = listTrainingVoiceSafetyCueMigrationV21()
    .filter((row) => !row.classification)
    .map((row) => row.cueId);
  return { valid: unclassifiedCueIds.length === 0, unclassifiedCueIds };
}

export function resolveTrainingVoiceSafetyV21(
  input: ResolveTrainingVoiceSafetyV21Input
): ResolvedTrainingVoiceSafetyV21 {
  const contractPlan = input.contract.safetyPlan;
  const sourceProfile = input.sourceSafetyProfile ?? requireExerciseSafetyCueProfile(input.contract.exerciseId);
  const source = sourceProfileSnapshot(input.contract.exerciseId, sourceProfile);
  const malformedMemory = input.sessionMemory !== undefined && normalizeTrainingVoiceSafetySessionMemoryV21(input.sessionMemory) === null;
  const memory = normalizeTrainingVoiceSafetySessionMemoryV21(input.sessionMemory) ?? EMPTY_TRAINING_VOICE_SESSION_MEMORY_V21;
  const reasonCodes: TrainingVoiceSafetyReasonCodeV21[] = [];
  if (malformedMemory) reasonCodes.push('MALFORMED_SAFETY_MEMORY');
  if (source.profileMismatch) reasonCodes.push('SAFETY_PROFILE_MISMATCH');
  if (source.profileStale) reasonCodes.push('SAFETY_PROFILE_STALE');

  const candidateFamilies = normalFamiliesFor(input.contract, sourceProfile);
  const subsumption = applyFamilySubsumption(candidateFamilies);
  reasonCodes.push(...subsumption.reasonCodes);

  const absorbedFamilies = new Set<TrainingVoiceSafetyFamilyV21>([
    ...contractPlan.absorbedFamilies,
    ...(contractPlan.absorbedIntoInstruction ? [contractPlan.family] : []),
  ]);
  const unresolved = subsumption.remaining.filter((family) => !absorbedFamilies.has(family));
  const absorbedDue = subsumption.remaining.filter((family) => absorbedFamilies.has(family));
  const reactiveSafetyCueIdsDeferred = deferredReactiveCueIds(sourceProfile);
  let family = selectDueFamily(unresolved, absorbedDue, contractPlan.family);
  let fulfilment: TrainingVoiceSafetyFulfilmentV21 = 'not_required';
  let logicalCueKey: string | null = null;
  let exactScript: string | null = null;
  let cue: TrainingVoiceLogicalCueV21 | null = null;
  let ready = !malformedMemory && !source.profileMismatch && !source.profileStale;

  if (candidateFamilies.length === 0 || family === 'none') {
    family = 'none';
    reasonCodes.push('NO_NORMAL_FAMILY_REQUIRED');
  } else if (unresolved.length > 1) {
    ready = false;
    reasonCodes.push('MULTIPLE_UNRESOLVED_FAMILIES');
  } else if (family === 'floor_eligible_user' && input.capability?.floorEligible === false) {
    ready = false;
    reasonCodes.push('FLOOR_NOT_ELIGIBLE');
  } else if (isTrainingVoiceSafetyFamilyIntroducedV21(memory, family)) {
    reasonCodes.push('FAMILY_ALREADY_INTRODUCED');
  } else if (absorbedFamilies.has(family) || family === 'mini_band_above_knees') {
    fulfilment = 'absorbed_into_exact_instruction';
    reasonCodes.push(absorptionReasonFor(family));
  } else {
    cue = safetyCueForFamily(family);
    if (!cue) {
      ready = false;
      reasonCodes.push('UNKNOWN_SAFETY_FAMILY');
    } else {
      fulfilment = 'separate_family_cue';
      logicalCueKey = cue.key;
      exactScript = cue.exactScript;
      reasonCodes.push('MOST_SPECIFIC_FAMILY_DUE');
    }
  }

  return {
    version: 1,
    exerciseId: input.contract.exerciseId,
    family,
    dueFamily: family,
    parentFamily: FAMILY_PARENT[family] ?? null,
    subsumedFamilies: subsumption.subsumed,
    absorbedFamilies: uniqueFamilies([...contractPlan.absorbedFamilies, ...absorbedDue]),
    fulfilment,
    absorbedIntoInstruction: fulfilment === 'absorbed_into_exact_instruction',
    logicalCueKey,
    exactScript,
    cue,
    sourceSafetyProfileSchemaVersion: sourceProfile.schemaVersion,
    sourceSafetyProfileFingerprint: source.fingerprint,
    sourceSafetyCueIds: profileCueIds(sourceProfile),
    requiredForVoiceFirst: fulfilment !== 'not_required',
    policyId: 'instruction',
    reasonCodes: unique(reasonCodes),
    reactiveSafetyCueIdsDeferred,
    ready,
  };
}

export function resolveTrainingVoiceSafetyForExerciseV21(
  exerciseId: string,
  sessionMemory?: TrainingVoiceSessionMemoryV21 | null
): ResolvedTrainingVoiceSafetyV21 {
  return resolveTrainingVoiceSafetyV21({
    contract: getTrainingVoiceContractV21(exerciseId),
    sessionMemory,
  });
}

export function normalizeTrainingVoiceSafetySessionMemoryV21(value: unknown): TrainingVoiceSessionMemoryV21 | null {
  if (value === null || value === undefined) return EMPTY_TRAINING_VOICE_SESSION_MEMORY_V21;
  if (!value || typeof value !== 'object') return null;
  const memory = value as Partial<TrainingVoiceSessionMemoryV21>;
  if (memory.version !== 1) return null;
  if (memory.universalSafety !== 'not_started' && memory.universalSafety !== 'completed') return null;
  if (!Array.isArray(memory.introducedSafetyFamilies)) return null;
  if (!Array.isArray(memory.firstUseExerciseIds)) return null;
  const floor = memory.floor;
  if (!floor || typeof floor !== 'object') return null;
  if (typeof floor.floorFamilyIntroduced !== 'boolean') return null;
  if (floor.currentEnvironment !== 'standing' && floor.currentEnvironment !== 'floor' && floor.currentEnvironment !== 'unknown') return null;
  if (floor.currentFloorItemId !== null && typeof floor.currentFloorItemId !== 'string') return null;
  if (!Number.isFinite(floor.currentFloorSetupEpoch)) return null;
  const introduced: Exclude<TrainingVoiceSafetyFamilyV21, 'none' | 'floor_eligible_user'>[] = [];
  for (const family of memory.introducedSafetyFamilies) {
    if (!isRememberedFamily(family)) return null;
    if (!introduced.includes(family)) introduced.push(family);
  }
  const firstUseExerciseIds = unique(memory.firstUseExerciseIds.filter((id): id is string => typeof id === 'string'));
  return {
    version: 1,
    universalSafety: memory.universalSafety,
    introducedSafetyFamilies: introduced,
    floor: {
      floorFamilyIntroduced: floor.floorFamilyIntroduced,
      currentEnvironment: floor.currentEnvironment,
      currentFloorItemId: floor.currentFloorItemId,
      currentFloorSetupEpoch: Math.max(0, Math.floor(floor.currentFloorSetupEpoch)),
    },
    firstUseExerciseIds,
  };
}

export function isTrainingVoiceSafetyFamilyIntroducedV21(
  memory: TrainingVoiceSessionMemoryV21,
  family: TrainingVoiceSafetyFamilyV21
): boolean {
  if (family === 'none') return true;
  if (family === 'floor_eligible_user') return memory.floor.floorFamilyIntroduced;
  if (!isRememberedFamily(family)) return false;
  return memory.introducedSafetyFamilies.includes(family);
}

export function markTrainingVoiceUniversalSafetyCompletedV21(
  memory: TrainingVoiceSessionMemoryV21
): TrainingVoiceSessionMemoryV21 {
  if (memory.universalSafety === 'completed') return memory;
  return { ...memory, universalSafety: 'completed' };
}

export function rememberTrainingVoiceSafetyFamilyV21(
  memory: TrainingVoiceSessionMemoryV21,
  family: TrainingVoiceSafetyFamilyV21
): TrainingVoiceSessionMemoryV21 {
  if (family === 'none') return memory;
  if (family === 'floor_eligible_user') {
    if (memory.floor.floorFamilyIntroduced) return memory;
    return { ...memory, floor: { ...memory.floor, floorFamilyIntroduced: true } };
  }
  if (!isRememberedFamily(family) || memory.introducedSafetyFamilies.includes(family)) return memory;
  return {
    ...memory,
    introducedSafetyFamilies: [...memory.introducedSafetyFamilies, family],
  };
}

export function rememberTrainingVoiceFirstUseV21(
  memory: TrainingVoiceSessionMemoryV21,
  exerciseId: string
): TrainingVoiceSessionMemoryV21 {
  if (memory.firstUseExerciseIds.includes(exerciseId)) return memory;
  return {
    ...memory,
    firstUseExerciseIds: [...memory.firstUseExerciseIds, exerciseId],
  };
}

export function completeTrainingVoiceSessionEntrySafetyV21(input: {
  readonly memory: TrainingVoiceSessionMemoryV21;
  readonly result: VoicePlaybackResult;
  readonly expectedScopeId: string;
}): TrainingVoiceSessionMemoryV21 {
  if (!trackedRequiredSequenceCompleted(input.result, input.expectedScopeId)) return input.memory;
  return markTrainingVoiceUniversalSafetyCompletedV21(input.memory);
}

export function completeTrainingVoiceFamilySafetyV21(input: {
  readonly memory: TrainingVoiceSessionMemoryV21;
  readonly plan: Pick<TrainingVoiceSafetyPlanV21, 'family' | 'fulfilment'>;
  readonly result: VoicePlaybackResult;
  readonly expectedScopeId: string;
}): TrainingVoiceSessionMemoryV21 {
  if (input.plan.fulfilment === 'not_required') return input.memory;
  if (!trackedRequiredSequenceCompleted(input.result, input.expectedScopeId)) return input.memory;
  return rememberTrainingVoiceSafetyFamilyV21(input.memory, input.plan.family);
}

function sourceProfileSnapshot(
  exerciseId: string,
  sourceProfile: PlannedExerciseSafetyCueProfile
): {
  readonly fingerprint: string;
  readonly profileMismatch: boolean;
  readonly profileStale: boolean;
} {
  const expected = requireExerciseSafetyCueProfile(exerciseId);
  const profileMismatch = sourceProfile.exerciseId !== exerciseId || sourceProfile.schemaVersion !== expected.schemaVersion;
  const base: Omit<PlannedSafetyCueSnapshot, 'fingerprint'> = {
    schemaVersion: sourceProfile.schemaVersion,
    globalCueIds: SESSION_GLOBAL_SAFETY_CUE_IDS,
    exerciseProfiles: [sourceProfile],
  };
  const fingerprint = safetyCueSnapshotFingerprint(base);
  const expectedFingerprint = safetyCueSnapshotFingerprint({
    schemaVersion: expected.schemaVersion,
    globalCueIds: SESSION_GLOBAL_SAFETY_CUE_IDS,
    exerciseProfiles: [expected],
  });
  return {
    fingerprint,
    profileMismatch,
    profileStale: fingerprint !== expectedFingerprint,
  };
}

function normalFamiliesFor(
  contract: Pick<TrainingVoiceExerciseContractV21, 'equipment' | 'safetyPlan'>,
  sourceProfile: PlannedExerciseSafetyCueProfile
): TrainingVoiceSafetyFamilyV21[] {
  const families: TrainingVoiceSafetyFamilyV21[] = [];
  addFamily(families, contract.safetyPlan.family);
  if (contract.equipment.includes('floor')) addFamily(families, 'floor_eligible_user');
  if (contract.equipment.includes('stair')) addFamily(families, 'step_or_stair');
  if (contract.equipment.includes('door_anchor')) addFamily(families, 'door_anchor_band');
  if (contract.equipment.includes('mini_band')) addFamily(families, 'mini_band_above_knees');
  if (contract.equipment.includes('long_band')) addFamily(families, 'long_band_handheld_or_foot_anchored');

  for (const cueId of sourceProfile.setupCueIds) {
    const migrationRow = TRAINING_VOICE_SAFETY_CUE_MIGRATION_V21[cueId];
    if (migrationRow?.classification === 'mapped_to_normal_family_v21') {
      addFamily(families, migrationRow.normalFamily);
    }
  }
  return uniqueFamilies(families).filter((family) => family !== 'none');
}

function applyFamilySubsumption(families: readonly TrainingVoiceSafetyFamilyV21[]): {
  readonly remaining: readonly TrainingVoiceSafetyFamilyV21[];
  readonly subsumed: readonly TrainingVoiceSafetyFamilyV21[];
  readonly reasonCodes: readonly TrainingVoiceSafetyReasonCodeV21[];
} {
  const remaining = new Set(families);
  const subsumed = new Set<TrainingVoiceSafetyFamilyV21>();
  const reasonCodes: TrainingVoiceSafetyReasonCodeV21[] = [];
  for (const family of SEPARATE_FAMILIES) {
    if (!remaining.has(family)) continue;
    for (const parent of FAMILY_SUBSUMES[family]) {
      if (!remaining.has(parent)) continue;
      remaining.delete(parent);
      subsumed.add(parent);
      const reason = SUBSUMPTION_REASON[family];
      if (reason) reasonCodes.push(reason);
    }
  }
  return {
    remaining: [...remaining],
    subsumed: [...subsumed],
    reasonCodes: unique(reasonCodes),
  };
}

function selectDueFamily(
  unresolved: readonly TrainingVoiceSafetyFamilyV21[],
  absorbed: readonly TrainingVoiceSafetyFamilyV21[],
  contractFamily: TrainingVoiceSafetyFamilyV21
): TrainingVoiceSafetyFamilyV21 {
  if (unresolved.length === 1) return unresolved[0];
  if (unresolved.length > 1) return contractFamily;
  if (absorbed.includes(contractFamily)) return contractFamily;
  return absorbed[0] ?? contractFamily;
}

function safetyCueForFamily(family: TrainingVoiceSafetyFamilyV21): TrainingVoiceLogicalCueV21 | null {
  if (family === 'none' || family === 'mini_band_above_knees') return null;
  const cueKey = FAMILY_CUE_KEY[family];
  return TRAINING_VOICE_SHARED_LOGICAL_CUES_V21.find((item) => item.key === cueKey) ?? null;
}

function absorptionReasonFor(family: TrainingVoiceSafetyFamilyV21): TrainingVoiceSafetyReasonCodeV21 {
  if (family === 'chair_seat') return 'CHAIR_ABSORBED_IN_INSTRUCTION';
  if (family === 'generic_support' || family === 'balance_support') return 'GENERIC_SUPPORT_ABSORBED_IN_INSTRUCTION';
  if (family === 'mini_band_above_knees') return 'MINI_BAND_ABSORBED_IN_INSTRUCTION';
  return 'FAMILY_ABSORBED_IN_EXACT_INSTRUCTION';
}

function deferredReactiveCueIds(profile: PlannedExerciseSafetyCueProfile): SafetyCueId[] {
  return profileCueIds(profile).filter((cueId) => {
    const classification = TRAINING_VOICE_SAFETY_CUE_MIGRATION_V21[cueId]?.classification;
    return classification === 'reactive_control_recovery_later_phase';
  });
}

function profileCueIds(profile: PlannedExerciseSafetyCueProfile): SafetyCueId[] {
  return unique([
    ...profile.setupCueIds,
    ...profile.activeCueIds,
    ...profile.repeatedSetCueIds,
    ...profile.recoveryCueIds,
  ]);
}

function trackedRequiredSequenceCompleted(result: VoicePlaybackResult, expectedScopeId: string): boolean {
  return (
    result.scopeId === expectedScopeId &&
    result.required === true &&
    result.accepted === true &&
    result.outcome === 'completed'
  );
}

function isRememberedFamily(
  value: unknown
): value is Exclude<TrainingVoiceSafetyFamilyV21, 'none' | 'floor_eligible_user'> {
  return (
    value === 'chair_seat' ||
    value === 'generic_support' ||
    value === 'balance_support' ||
    value === 'step_or_stair' ||
    value === 'long_band_handheld_or_foot_anchored' ||
    value === 'door_anchor_band' ||
    value === 'mini_band_above_knees'
  );
}

function addFamily(out: TrainingVoiceSafetyFamilyV21[], family: TrainingVoiceSafetyFamilyV21 | null | undefined): void {
  if (!family || family === 'none' || out.includes(family)) return;
  out.push(family);
}

function uniqueFamilies(items: readonly TrainingVoiceSafetyFamilyV21[]): TrainingVoiceSafetyFamilyV21[] {
  return unique(items);
}

function migration(
  cueId: SafetyCueId,
  classification: TrainingVoiceSafetyCueMigrationClassificationV21,
  normalFamily: TrainingVoiceSafetyFamilyV21 | null,
  destination: string
): TrainingVoiceSafetyCueMigrationV21 {
  return { cueId, classification, normalFamily, destination };
}

function unique<T>(items: readonly T[]): T[] {
  const out: T[] = [];
  for (const item of items) {
    if (!out.includes(item)) out.push(item);
  }
  return out;
}
