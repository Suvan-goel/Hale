import {
  BALANCE_FEET_TOGETHER_ID,
  BALANCE_SINGLE_LEG_ID,
  BALANCE_TANDEM_ID,
} from './balanceRung';
import { BRIDGE_HOLD_ID, BRIDGE_REPS_ID } from './gluteBridge';
import { HAMSTRING_REACH_ID } from './seatedHamstringReach';
import { HEEL_RAISE_FREE_ID, HEEL_RAISE_SUPPORTED_ID, TOE_RAISE_SUPPORTED_ID } from './heelRaise';
import { HINGE_FREE_ID, HINGE_WALL_ID } from './hipHinge';
import { LOADED_MARCH_ID } from './loadedMarch';
import { BAND_PULL_APART_ID, SEATED_BAND_ROW_ID, STANDING_BAND_ROW_ID } from './pullUpperBack';
import { HIP_FLEXOR_STRETCH_ID, THORACIC_ROTATION_ID, WALL_CALF_STRETCH_ID } from './mobilityDrills';
import { LATERAL_WALK_MINI_BAND_ID, SIDE_STEP_SUPPORTED_ID } from './lateralStability';
import { NECK_ROTATION_ID } from './neckRotation';
import { OVERHEAD_PRESS_ID, OVERHEAD_REACH_ID } from './overheadPress';
import { PUSHUP_INCLINE_ID, PUSHUP_STANDARD_ID, PUSHUP_WALL_ID } from './pushUp';
import { SQUAT_FREE_ID, SQUAT_LOADED_ID, SQUAT_SLOW_ECC_ID, SQUAT_SUPPORTED_ID, SPLIT_SQUAT_SUPPORTED_ID } from './supportedSquat';
import { STEP_UP_ID } from './stepUp';
import { LOADED_STS_ID, STS_CUSHION_ID, STS_POWER_ID, STS_SLOW_ECC_ID, STS_STANDARD_ID } from './sitToStand';
import {
  getExerciseLadder,
  listExerciseLadders,
  type ExerciseLadder,
  type ExerciseLadderProgressionModel,
  type ExerciseLevel,
} from './ladders';
import {
  CONTROLLED_BETA_RELEASE_CHANNEL,
  effectiveLevelForRelease,
  isExerciseLevelAvailableForRelease,
  releasePolicyFingerprint,
} from './releasePolicy';

export type AutomaticProgressionStatus =
  | 'allowed_generic'
  | 'allowed_strong_valid_time'
  | 'blocked_manual_only'
  | 'blocked_pending_domain_review'
  | 'blocked_pending_device_validation'
  | 'blocked_non_linear_model';

export type ProgressionEvidenceRequirement =
  | 'generic_easy_exposure'
  | 'strong_valid_time'
  | 'none';

export type LadderTransitionDirection = 'forward' | 'regression';

export type ProgressionPolicyDiagnosticCode =
  | 'stored_level_invalid'
  | 'release_cap_applied'
  | 'auto_progression_cap_applied'
  | 'non_linear_default_selected'
  | 'legacy_progression_policy_capped'
  | 'daily_regression_applied';

export type ProgressionPolicySelectionReason =
  | 'stored_level'
  | 'release_cap'
  | 'auto_progression_cap'
  | 'non_linear_default'
  | 'explicit_template_member'
  | 'daily_regression';

export type ProgressionPolicyValidationStatus =
  | 'missing_progression_policy_snapshot'
  | 'unsupported_progression_policy_schema'
  | 'stale_progression_policy'
  | 'effective_progression_level_mismatch'
  | 'auto_progression_ceiling_exceeded'
  | 'non_linear_progression_selection_invalid';

export interface LadderTransitionPolicy {
  fromLevelId: string;
  toLevelId: string;
  direction: LadderTransitionDirection;
  status: AutomaticProgressionStatus;
  minimumCreditedExposures: number;
  minimumCalendarDays?: number;
  requiredEvidence: readonly ProgressionEvidenceRequirement[];
  requiredCapabilities?: readonly string[];
  controlledBetaAllowed: boolean;
  reason: string;
}

export interface LadderControlledBetaProgressionPolicy {
  schemaVersion: typeof CONTROLLED_BETA_PROGRESSION_POLICY_SCHEMA_VERSION;
  ladderId: string;
  model: ExerciseLadderProgressionModel;
  defaultSelectionLevelId: string;
  autoProgressionCeilingLevelId: string;
  levelIds: readonly string[];
  transitions: readonly LadderTransitionPolicy[];
}

export interface ControlledBetaProgressionEffectiveLevel {
  ladderId: string;
  model: ExerciseLadderProgressionModel;
  storedLevelId?: string;
  requestedLevelId: string;
  effectiveLevelId: string;
  selectedLevel: ExerciseLevel;
  selectedIndex: number;
  autoProgressionCeilingLevelId: string;
  selectionReason: ProgressionPolicySelectionReason;
  diagnostics: readonly ProgressionPolicyDiagnosticCode[];
  policyFingerprint: string;
}

export interface PlannedProgressionPolicyExerciseSnapshot {
  ladderId: string;
  exerciseId: string;
  model: ExerciseLadderProgressionModel;
  storedLevelId?: string;
  requestedLevelId?: string;
  effectiveLevelId: string;
  selectedDailyLevelId?: string;
  autoProgressionCeilingLevelId: string;
  selectionReason: ProgressionPolicySelectionReason;
  diagnostics?: readonly ProgressionPolicyDiagnosticCode[];
}

export interface PlannedProgressionPolicySnapshot {
  schemaVersion: typeof CONTROLLED_BETA_PROGRESSION_POLICY_SCHEMA_VERSION;
  policyFingerprint: string;
  fingerprint: string;
  exercises: readonly PlannedProgressionPolicyExerciseSnapshot[];
}

export interface ProgressionPolicyExerciseSnapshotInput {
  exerciseId: string;
  ladderId?: string;
  levelId?: string;
  storedLevelId?: string;
  requestedLevelId?: string;
  selectedDailyLevelId?: string;
  selectionReason?: ProgressionPolicySelectionReason;
  diagnostics?: readonly ProgressionPolicyDiagnosticCode[];
}

export type ProgressionPolicySnapshotValidation =
  | { status: 'current'; snapshot: PlannedProgressionPolicySnapshot }
  | {
      status: ProgressionPolicyValidationStatus;
      diagnostics: readonly {
        reason: ProgressionPolicyValidationStatus;
        exerciseId?: string;
        ladderId?: string;
        plannedFingerprint?: string;
        currentFingerprint?: string;
      }[];
    };

export const CONTROLLED_BETA_PROGRESSION_POLICY_SCHEMA_VERSION = 1;

const POLICY_BY_LADDER_ID: Record<string, LadderControlledBetaProgressionPolicy> = {
  'sit-to-stand': policy('sit-to-stand', STS_STANDARD_ID, STS_STANDARD_ID, [
    allowed(STS_CUSHION_ID, STS_STANDARD_ID, 'forward', 'allowed_generic', 2, ['generic_easy_exposure'], 'cushion_to_standard_controlled_beta'),
    blocked(STS_STANDARD_ID, STS_SLOW_ECC_ID, 'forward', 'blocked_pending_domain_review', 'cadence_control_requires_domain_review'),
    blocked(STS_SLOW_ECC_ID, STS_POWER_ID, 'forward', 'blocked_pending_device_validation', 'power_requires_velocity_and_device_validation'),
    blocked(STS_POWER_ID, LOADED_STS_ID, 'forward', 'blocked_manual_only', 'loaded_sit_to_stand_hidden_in_controlled_beta'),
    allowed(STS_STANDARD_ID, STS_CUSHION_ID, 'regression', 'allowed_generic', 1, ['none'], 'standard_to_cushion_safe_regression'),
    blocked(STS_SLOW_ECC_ID, STS_STANDARD_ID, 'regression', 'blocked_pending_domain_review', 'historical_cadence_state_is_auto_capped'),
    blocked(STS_POWER_ID, STS_SLOW_ECC_ID, 'regression', 'blocked_pending_device_validation', 'historical_power_state_is_auto_capped'),
    blocked(LOADED_STS_ID, STS_POWER_ID, 'regression', 'blocked_manual_only', 'loaded_state_is_release_capped'),
  ]),
  squat: policy('squat', SQUAT_SUPPORTED_ID, SQUAT_SUPPORTED_ID, [
    blocked(SQUAT_SUPPORTED_ID, SQUAT_FREE_ID, 'forward', 'blocked_pending_domain_review', 'support_removal_requires_readiness_policy'),
    blocked(SQUAT_FREE_ID, SQUAT_SLOW_ECC_ID, 'forward', 'blocked_pending_domain_review', 'cadence_control_requires_domain_review'),
    blocked(SQUAT_SLOW_ECC_ID, SQUAT_LOADED_ID, 'forward', 'blocked_manual_only', 'loaded_squat_hidden_in_controlled_beta'),
    blocked(SQUAT_LOADED_ID, SPLIT_SQUAT_SUPPORTED_ID, 'forward', 'blocked_manual_only', 'split_squat_hidden_in_controlled_beta'),
    blocked(SQUAT_FREE_ID, SQUAT_SUPPORTED_ID, 'regression', 'blocked_pending_domain_review', 'historical_free_squat_is_auto_capped_without_rewrite'),
    blocked(SQUAT_SLOW_ECC_ID, SQUAT_FREE_ID, 'regression', 'blocked_pending_domain_review', 'historical_slow_squat_is_release_capped'),
    blocked(SQUAT_LOADED_ID, SQUAT_SLOW_ECC_ID, 'regression', 'blocked_manual_only', 'loaded_squat_hidden_in_controlled_beta'),
    blocked(SPLIT_SQUAT_SUPPORTED_ID, SQUAT_LOADED_ID, 'regression', 'blocked_manual_only', 'split_squat_hidden_in_controlled_beta'),
  ]),
  'step-up': policy('step-up', STEP_UP_ID, STEP_UP_ID, []),
  'heel-toe-raise': policy('heel-toe-raise', HEEL_RAISE_SUPPORTED_ID, HEEL_RAISE_SUPPORTED_ID, [
    blocked(HEEL_RAISE_SUPPORTED_ID, HEEL_RAISE_FREE_ID, 'forward', 'blocked_non_linear_model', 'supporting_set_members_are_not_ranked'),
    blocked(HEEL_RAISE_FREE_ID, TOE_RAISE_SUPPORTED_ID, 'forward', 'blocked_non_linear_model', 'toe_raise_is_a_different_ankle_movement'),
    blocked(HEEL_RAISE_FREE_ID, HEEL_RAISE_SUPPORTED_ID, 'regression', 'blocked_non_linear_model', 'supporting_set_pain_does_not_switch_members'),
    blocked(TOE_RAISE_SUPPORTED_ID, HEEL_RAISE_FREE_ID, 'regression', 'blocked_non_linear_model', 'toe_raise_does_not_regress_to_heel_raise_by_adjacency'),
  ]),
  push: policy('push', PUSHUP_WALL_ID, PUSHUP_WALL_ID, [
    blocked(PUSHUP_WALL_ID, PUSHUP_INCLINE_ID, 'forward', 'blocked_pending_device_validation', 'incline_height_and_surface_stability_unvalidated'),
    blocked(PUSHUP_INCLINE_ID, PUSHUP_STANDARD_ID, 'forward', 'blocked_manual_only', 'floor_push_up_hidden_in_controlled_beta'),
    blocked(PUSHUP_INCLINE_ID, PUSHUP_WALL_ID, 'regression', 'blocked_pending_device_validation', 'historical_incline_state_is_auto_capped_without_rewrite'),
    blocked(PUSHUP_STANDARD_ID, PUSHUP_INCLINE_ID, 'regression', 'blocked_manual_only', 'floor_push_up_hidden_in_controlled_beta'),
  ]),
  'pull-upper-back': policy('pull-upper-back', SEATED_BAND_ROW_ID, SEATED_BAND_ROW_ID, [
    blocked(SEATED_BAND_ROW_ID, STANDING_BAND_ROW_ID, 'forward', 'blocked_non_linear_model', 'row_setup_changes_anchor_and_posture'),
    blocked(STANDING_BAND_ROW_ID, BAND_PULL_APART_ID, 'forward', 'blocked_non_linear_model', 'pull_apart_is_not_a_harder_row'),
    blocked(STANDING_BAND_ROW_ID, SEATED_BAND_ROW_ID, 'regression', 'blocked_non_linear_model', 'supporting_set_pain_does_not_switch_members'),
    blocked(BAND_PULL_APART_ID, STANDING_BAND_ROW_ID, 'regression', 'blocked_non_linear_model', 'pull_apart_does_not_regress_to_row_by_adjacency'),
  ]),
  'hinge-glutes': policy('hinge-glutes', HINGE_WALL_ID, HINGE_WALL_ID, [
    blocked(HINGE_WALL_ID, HINGE_FREE_ID, 'forward', 'blocked_non_linear_model', 'supporting_set_members_are_not_ranked'),
    blocked(HINGE_FREE_ID, BRIDGE_HOLD_ID, 'forward', 'blocked_non_linear_model', 'standing_hinge_does_not_auto_progress_to_floor_bridge'),
    blocked(BRIDGE_HOLD_ID, BRIDGE_REPS_ID, 'forward', 'blocked_non_linear_model', 'bridge_hold_to_reps_requires_bridge_specific_review'),
    blocked(HINGE_FREE_ID, HINGE_WALL_ID, 'regression', 'blocked_non_linear_model', 'supporting_set_pain_does_not_switch_members'),
    blocked(BRIDGE_HOLD_ID, HINGE_FREE_ID, 'regression', 'blocked_non_linear_model', 'floor_bridge_does_not_regress_to_hinge_by_adjacency'),
    blocked(BRIDGE_REPS_ID, BRIDGE_HOLD_ID, 'regression', 'blocked_non_linear_model', 'bridge_rep_regression_requires_bridge_specific_policy'),
  ]),
  'shoulder-reach-press': policy('shoulder-reach-press', OVERHEAD_REACH_ID, OVERHEAD_REACH_ID, [
    blocked(OVERHEAD_REACH_ID, OVERHEAD_PRESS_ID, 'forward', 'blocked_non_linear_model', 'band_press_is_cross_domain_supporting_work'),
    blocked(OVERHEAD_PRESS_ID, OVERHEAD_REACH_ID, 'regression', 'blocked_non_linear_model', 'supporting_set_pain_does_not_switch_members'),
  ]),
  balance: policy('balance', BALANCE_FEET_TOGETHER_ID, BALANCE_TANDEM_ID, [
    allowed(BALANCE_FEET_TOGETHER_ID, BALANCE_TANDEM_ID, 'forward', 'allowed_strong_valid_time', 2, ['generic_easy_exposure', 'strong_valid_time'], 'feet_together_to_tandem_strong_valid_time'),
    blocked(BALANCE_TANDEM_ID, BALANCE_SINGLE_LEG_ID, 'forward', 'blocked_pending_device_validation', 'single_leg_requires_domain_and_device_validation'),
    allowed(BALANCE_TANDEM_ID, BALANCE_FEET_TOGETHER_ID, 'regression', 'allowed_generic', 1, ['none'], 'tandem_to_feet_together_safe_regression'),
    blocked(BALANCE_SINGLE_LEG_ID, BALANCE_TANDEM_ID, 'regression', 'blocked_pending_device_validation', 'historical_single_leg_state_is_auto_capped'),
  ]),
  'lateral-stability': policy('lateral-stability', SIDE_STEP_SUPPORTED_ID, SIDE_STEP_SUPPORTED_ID, [
    blocked(SIDE_STEP_SUPPORTED_ID, LATERAL_WALK_MINI_BAND_ID, 'forward', 'blocked_manual_only', 'mini_band_lateral_walk_hidden_in_controlled_beta'),
    blocked(LATERAL_WALK_MINI_BAND_ID, LOADED_MARCH_ID, 'forward', 'blocked_non_linear_model', 'march_is_not_a_harder_lateral_walk'),
    blocked(LOADED_MARCH_ID, LATERAL_WALK_MINI_BAND_ID, 'regression', 'blocked_non_linear_model', 'march_does_not_regress_by_lateral_adjacency'),
    blocked(LATERAL_WALK_MINI_BAND_ID, SIDE_STEP_SUPPORTED_ID, 'regression', 'blocked_manual_only', 'mini_band_lateral_walk_hidden_in_controlled_beta'),
  ]),
  'mobility-flexibility': policy('mobility-flexibility', HAMSTRING_REACH_ID, HAMSTRING_REACH_ID, [
    blocked(HAMSTRING_REACH_ID, THORACIC_ROTATION_ID, 'forward', 'blocked_non_linear_model', 'mobility_collection_items_are_not_ranked'),
    blocked(THORACIC_ROTATION_ID, HIP_FLEXOR_STRETCH_ID, 'forward', 'blocked_non_linear_model', 'mobility_collection_items_are_not_ranked'),
    blocked(HIP_FLEXOR_STRETCH_ID, WALL_CALF_STRETCH_ID, 'forward', 'blocked_non_linear_model', 'mobility_collection_items_are_not_ranked'),
    blocked(WALL_CALF_STRETCH_ID, NECK_ROTATION_ID, 'forward', 'blocked_manual_only', 'neck_rotation_hidden_in_controlled_beta'),
    blocked(THORACIC_ROTATION_ID, HAMSTRING_REACH_ID, 'regression', 'blocked_non_linear_model', 'mobility_pain_does_not_switch_items_by_adjacency'),
    blocked(HIP_FLEXOR_STRETCH_ID, THORACIC_ROTATION_ID, 'regression', 'blocked_non_linear_model', 'mobility_pain_does_not_switch_items_by_adjacency'),
    blocked(WALL_CALF_STRETCH_ID, HIP_FLEXOR_STRETCH_ID, 'regression', 'blocked_non_linear_model', 'mobility_pain_does_not_switch_items_by_adjacency'),
    blocked(NECK_ROTATION_ID, WALL_CALF_STRETCH_ID, 'regression', 'blocked_manual_only', 'neck_rotation_hidden_in_controlled_beta'),
  ]),
};

export function controlledBetaProgressionPolicyFingerprint(): string {
  const policies = listControlledBetaProgressionPolicies()
    .map((p) => [
      p.ladderId,
      p.model,
      p.defaultSelectionLevelId,
      p.autoProgressionCeilingLevelId,
      p.levelIds.join(','),
      p.transitions
        .map((t) => [
          t.fromLevelId,
          t.toLevelId,
          t.direction,
          t.status,
          t.minimumCreditedExposures,
          t.minimumCalendarDays ?? '',
          t.requiredEvidence.join('+'),
          t.controlledBetaAllowed ? 'allowed' : 'blocked',
          t.reason,
        ].join('/'))
        .join(','),
    ].join(':'))
    .join('|');
  const releaseFingerprint = releasePolicyFingerprint(CONTROLLED_BETA_RELEASE_CHANNEL);
  const canonical = [
    `schema:${CONTROLLED_BETA_PROGRESSION_POLICY_SCHEMA_VERSION}`,
    `release:${releaseFingerprint}`,
    policies,
  ].join('|');
  return [
    'progression',
    CONTROLLED_BETA_PROGRESSION_POLICY_SCHEMA_VERSION,
    stableHash(releaseFingerprint),
    stableHash(canonical),
  ].join(':');
}

export function listControlledBetaProgressionPolicies(): LadderControlledBetaProgressionPolicy[] {
  return listExerciseLadders()
    .map((ladder) => getControlledBetaProgressionPolicy(ladder.id))
    .sort((a, b) => a.ladderId.localeCompare(b.ladderId));
}

export function getControlledBetaProgressionPolicy(ladderId: string): LadderControlledBetaProgressionPolicy {
  const policy = POLICY_BY_LADDER_ID[ladderId];
  if (!policy) throw new Error(`missing controlled-beta progression policy for ladder '${ladderId}'`);
  return policy;
}

export function transitionPolicyFor(
  ladderId: string,
  fromLevelId: string,
  toLevelId: string,
  direction: LadderTransitionDirection
): LadderTransitionPolicy | null {
  const policy = getControlledBetaProgressionPolicy(ladderId);
  return policy.transitions.find((transition) =>
    transition.fromLevelId === fromLevelId &&
    transition.toLevelId === toLevelId &&
    transition.direction === direction
  ) ?? null;
}

export function transitionEvidenceKeyFor(policy: LadderTransitionPolicy | null): string | undefined {
  if (!policy) return undefined;
  return [
    controlledBetaProgressionPolicyFingerprint(),
    policy.fromLevelId,
    policy.toLevelId,
    policy.direction,
    policy.status,
    policy.minimumCreditedExposures,
    policy.requiredEvidence.join('+'),
  ].join('|');
}

export function effectiveLevelIdForControlledBetaProgression(input: {
  ladder: ExerciseLadder;
  storedLevelId?: string;
  explicitLevelId?: string;
  dailyRegression?: boolean;
}): ControlledBetaProgressionEffectiveLevel {
  const policy = getControlledBetaProgressionPolicy(input.ladder.id);
  const diagnostics: ProgressionPolicyDiagnosticCode[] = [];
  const requestedRaw = input.explicitLevelId ?? input.storedLevelId ?? input.ladder.defaultLevelId;
  const requestedExists = input.ladder.levels.some((level) => level.id === requestedRaw);
  if (!requestedExists) diagnostics.push('stored_level_invalid');

  const releaseSelection = effectiveLevelForRelease(input.ladder, requestedRaw);
  let selectedLevel =
    releaseSelection?.selectedLevel ??
    input.ladder.levels.find((level) => level.id === policy.defaultSelectionLevelId) ??
    input.ladder.levels[0];
  let selectionReason: ProgressionPolicySelectionReason = input.explicitLevelId ? 'explicit_template_member' : 'stored_level';
  const requestedLevelId = releaseSelection?.requestedLevelId ?? selectedLevel.id;

  if (releaseSelection?.releaseCapped) {
    diagnostics.push('release_cap_applied');
    selectionReason = 'release_cap';
  }

  if (!input.explicitLevelId && policy.model !== 'linear_progression') {
    const defaultLevel = input.ladder.levels.find((level) => level.id === policy.defaultSelectionLevelId) ?? selectedLevel;
    if (selectedLevel.id !== defaultLevel.id) diagnostics.push('non_linear_default_selected');
    selectedLevel = defaultLevel;
    selectionReason = 'non_linear_default';
  }

  const ceilingIndex = input.ladder.levels.findIndex((level) => level.id === policy.autoProgressionCeilingLevelId);
  const selectedIndex = input.ladder.levels.findIndex((level) => level.id === selectedLevel.id);
  if (
    !input.explicitLevelId &&
    ceilingIndex >= 0 &&
    selectedIndex > ceilingIndex
  ) {
    selectedLevel = input.ladder.levels[ceilingIndex] ?? selectedLevel;
    diagnostics.push('auto_progression_cap_applied');
    if (input.storedLevelId && input.storedLevelId !== selectedLevel.id) diagnostics.push('legacy_progression_policy_capped');
    selectionReason = 'auto_progression_cap';
  }

  if (input.dailyRegression && policy.model === 'linear_progression') {
    const regressed = dailyRegressionLevel(input.ladder, selectedLevel);
    if (regressed && regressed.id !== selectedLevel.id) {
      selectedLevel = regressed;
      diagnostics.push('daily_regression_applied');
      selectionReason = 'daily_regression';
    }
  }

  return {
    ladderId: input.ladder.id,
    model: policy.model,
    storedLevelId: input.storedLevelId,
    requestedLevelId,
    effectiveLevelId: selectedLevel.id,
    selectedLevel,
    selectedIndex: Math.max(0, input.ladder.levels.findIndex((level) => level.id === selectedLevel.id)),
    autoProgressionCeilingLevelId: policy.autoProgressionCeilingLevelId,
    selectionReason,
    diagnostics: uniqueStrings(diagnostics),
    policyFingerprint: controlledBetaProgressionPolicyFingerprint(),
  };
}

export function plannedProgressionPolicySnapshotForExercises(
  exercises: readonly ProgressionPolicyExerciseSnapshotInput[]
): PlannedProgressionPolicySnapshot {
  const policyFingerprint = controlledBetaProgressionPolicyFingerprint();
  const items = exercises
    .map((exercise) => progressionExerciseSnapshot(exercise))
    .filter((item): item is PlannedProgressionPolicyExerciseSnapshot => !!item)
    .sort((a, b) =>
      [
        a.exerciseId.localeCompare(b.exerciseId),
        a.ladderId.localeCompare(b.ladderId),
        a.effectiveLevelId.localeCompare(b.effectiveLevelId),
      ].find((value) => value !== 0) ?? 0
    );
  return {
    schemaVersion: CONTROLLED_BETA_PROGRESSION_POLICY_SCHEMA_VERSION,
    policyFingerprint,
    fingerprint: progressionPolicySnapshotFingerprint(policyFingerprint, items),
    exercises: items,
  };
}

export function isPlannedProgressionPolicySnapshot(value: unknown): value is PlannedProgressionPolicySnapshot {
  if (!value || typeof value !== 'object') return false;
  const snapshot = value as Partial<PlannedProgressionPolicySnapshot>;
  if (snapshot.schemaVersion !== CONTROLLED_BETA_PROGRESSION_POLICY_SCHEMA_VERSION) return false;
  if (typeof snapshot.policyFingerprint !== 'string' || typeof snapshot.fingerprint !== 'string') return false;
  if (!Array.isArray(snapshot.exercises)) return false;
  return snapshot.exercises.every(isPlannedProgressionPolicyExerciseSnapshot);
}

export function validateProgressionPolicySnapshotForExercises(input: {
  snapshot: unknown;
  exercises: readonly ProgressionPolicyExerciseSnapshotInput[];
}): ProgressionPolicySnapshotValidation {
  const planned = input.snapshot;
  if (!planned || typeof planned !== 'object') {
    return {
      status: 'missing_progression_policy_snapshot',
      diagnostics: [{ reason: 'missing_progression_policy_snapshot' }],
    };
  }
  if (!isPlannedProgressionPolicySnapshot(planned)) {
    const schema = (planned as Partial<PlannedProgressionPolicySnapshot>).schemaVersion;
    return {
      status: schema !== CONTROLLED_BETA_PROGRESSION_POLICY_SCHEMA_VERSION
        ? 'unsupported_progression_policy_schema'
        : 'missing_progression_policy_snapshot',
      diagnostics: [{ reason: 'unsupported_progression_policy_schema' }],
    };
  }

  const current = plannedProgressionPolicySnapshotForExercises(input.exercises);
  if (planned.policyFingerprint !== controlledBetaProgressionPolicyFingerprint() || planned.fingerprint !== current.fingerprint) {
    return {
      status: 'stale_progression_policy',
      diagnostics: [{
        reason: 'stale_progression_policy',
        plannedFingerprint: planned.fingerprint,
        currentFingerprint: current.fingerprint,
      }],
    };
  }

  const nonlinearInvalid = current.exercises.find((exercise) =>
    exercise.model !== 'linear_progression' &&
    exercise.selectionReason !== 'non_linear_default' &&
    exercise.selectionReason !== 'explicit_template_member'
  );
  if (nonlinearInvalid) {
    return {
      status: 'non_linear_progression_selection_invalid',
      diagnostics: [{
        reason: 'non_linear_progression_selection_invalid',
        exerciseId: nonlinearInvalid.exerciseId,
        ladderId: nonlinearInvalid.ladderId,
        plannedFingerprint: planned.fingerprint,
        currentFingerprint: current.fingerprint,
      }],
    };
  }

  const ceilingExceeded = current.exercises.find((exercise) => {
    if (exercise.selectionReason === 'explicit_template_member') return false;
    const ladder = getExerciseLadder(exercise.ladderId);
    return levelRank(ladder, exercise.effectiveLevelId) > levelRank(ladder, exercise.autoProgressionCeilingLevelId);
  });
  if (ceilingExceeded) {
    return {
      status: 'auto_progression_ceiling_exceeded',
      diagnostics: [{
        reason: 'auto_progression_ceiling_exceeded',
        exerciseId: ceilingExceeded.exerciseId,
        ladderId: ceilingExceeded.ladderId,
        plannedFingerprint: planned.fingerprint,
        currentFingerprint: current.fingerprint,
      }],
    };
  }

  return { status: 'current', snapshot: current };
}

function progressionExerciseSnapshot(
  exercise: ProgressionPolicyExerciseSnapshotInput
): PlannedProgressionPolicyExerciseSnapshot | null {
  const ladderId = exercise.ladderId;
  if (!ladderId) return null;
  let ladder: ExerciseLadder;
  try {
    ladder = getExerciseLadder(ladderId);
  } catch {
    return null;
  }
  const effective = effectiveLevelIdForControlledBetaProgression({
    ladder,
    storedLevelId: exercise.storedLevelId ?? exercise.requestedLevelId ?? exercise.levelId,
    explicitLevelId: exercise.selectionReason === 'explicit_template_member'
      ? exercise.selectedDailyLevelId ?? exercise.levelId
      : undefined,
  });
  const selectedDailyLevelId = exercise.selectedDailyLevelId ?? exercise.levelId ?? effective.effectiveLevelId;
  const selectionReason = exercise.selectionReason ?? effective.selectionReason;
  const diagnostics = uniqueStrings([...(exercise.diagnostics ?? []), ...effective.diagnostics]);
  return {
    ladderId,
    exerciseId: exercise.exerciseId,
    model: effective.model,
    storedLevelId: exercise.storedLevelId,
    requestedLevelId: exercise.requestedLevelId ?? effective.requestedLevelId,
    effectiveLevelId: selectedDailyLevelId,
    selectedDailyLevelId,
    autoProgressionCeilingLevelId: effective.autoProgressionCeilingLevelId,
    selectionReason,
    ...(diagnostics.length > 0 ? { diagnostics } : {}),
  };
}

function policy(
  ladderId: string,
  defaultSelectionLevelId: string,
  autoProgressionCeilingLevelId: string,
  transitions: readonly LadderTransitionPolicy[]
): LadderControlledBetaProgressionPolicy {
  const ladder = getExerciseLadder(ladderId);
  return {
    schemaVersion: CONTROLLED_BETA_PROGRESSION_POLICY_SCHEMA_VERSION,
    ladderId,
    model: ladder.progressionModel,
    defaultSelectionLevelId,
    autoProgressionCeilingLevelId,
    levelIds: ladder.levels.map((level) => level.id),
    transitions,
  };
}

function allowed(
  fromLevelId: string,
  toLevelId: string,
  direction: LadderTransitionDirection,
  status: Extract<AutomaticProgressionStatus, 'allowed_generic' | 'allowed_strong_valid_time'>,
  minimumCreditedExposures: number,
  requiredEvidence: readonly ProgressionEvidenceRequirement[],
  reason: string
): LadderTransitionPolicy {
  return {
    fromLevelId,
    toLevelId,
    direction,
    status,
    minimumCreditedExposures,
    requiredEvidence,
    controlledBetaAllowed: true,
    reason,
  };
}

function blocked(
  fromLevelId: string,
  toLevelId: string,
  direction: LadderTransitionDirection,
  status: Exclude<AutomaticProgressionStatus, 'allowed_generic' | 'allowed_strong_valid_time'>,
  reason: string
): LadderTransitionPolicy {
  return {
    fromLevelId,
    toLevelId,
    direction,
    status,
    minimumCreditedExposures: 0,
    requiredEvidence: ['none'],
    controlledBetaAllowed: false,
    reason,
  };
}

function dailyRegressionLevel(ladder: ExerciseLadder, selected: ExerciseLevel): ExerciseLevel | null {
  const selectedIndex = ladder.levels.findIndex((level) => level.id === selected.id);
  for (let idx = selectedIndex - 1; idx >= 0; idx--) {
    const candidate = ladder.levels[idx];
    if (candidate && isExerciseLevelAvailableForRelease(candidate)) return candidate;
  }
  return selected;
}

function progressionPolicySnapshotFingerprint(
  policyFingerprint: string,
  exercises: readonly PlannedProgressionPolicyExerciseSnapshot[]
): string {
  const exerciseFingerprint = exercises
    .map((exercise) =>
      [
        exercise.exerciseId,
        exercise.ladderId,
        exercise.model,
        exercise.storedLevelId ?? '',
        exercise.requestedLevelId ?? '',
        exercise.effectiveLevelId,
        exercise.selectedDailyLevelId ?? '',
        exercise.autoProgressionCeilingLevelId,
        exercise.selectionReason,
        ...(exercise.diagnostics ?? []),
      ].join(':')
    )
    .join('|');
  return [
    'progression-snapshot',
    CONTROLLED_BETA_PROGRESSION_POLICY_SCHEMA_VERSION,
    stableHash(policyFingerprint),
    stableHash(exerciseFingerprint),
  ].join(':');
}

function isPlannedProgressionPolicyExerciseSnapshot(value: unknown): value is PlannedProgressionPolicyExerciseSnapshot {
  if (!value || typeof value !== 'object') return false;
  const exercise = value as Partial<PlannedProgressionPolicyExerciseSnapshot>;
  if (typeof exercise.exerciseId !== 'string' || typeof exercise.ladderId !== 'string') return false;
  if (typeof exercise.effectiveLevelId !== 'string' || typeof exercise.autoProgressionCeilingLevelId !== 'string') return false;
  if (!isExerciseProgressionModel(exercise.model)) return false;
  if (!isSelectionReason(exercise.selectionReason)) return false;
  if (exercise.storedLevelId !== undefined && typeof exercise.storedLevelId !== 'string') return false;
  if (exercise.requestedLevelId !== undefined && typeof exercise.requestedLevelId !== 'string') return false;
  if (exercise.selectedDailyLevelId !== undefined && typeof exercise.selectedDailyLevelId !== 'string') return false;
  if (exercise.diagnostics !== undefined && !Array.isArray(exercise.diagnostics)) return false;
  return true;
}

function isExerciseProgressionModel(value: unknown): value is ExerciseLadderProgressionModel {
  return value === 'linear_progression' || value === 'supporting_set' || value === 'collection';
}

function isSelectionReason(value: unknown): value is ProgressionPolicySelectionReason {
  return (
    value === 'stored_level' ||
    value === 'release_cap' ||
    value === 'auto_progression_cap' ||
    value === 'non_linear_default' ||
    value === 'explicit_template_member' ||
    value === 'daily_regression'
  );
}

function levelRank(ladder: ExerciseLadder, levelId: string): number {
  return Math.max(0, ladder.levels.findIndex((level) => level.id === levelId));
}

function uniqueStrings<T extends string>(values: readonly T[]): T[] {
  const out: T[] = [];
  for (const value of values) {
    if (!out.includes(value)) out.push(value);
  }
  return out;
}

function stableHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(36).padStart(7, '0');
}
