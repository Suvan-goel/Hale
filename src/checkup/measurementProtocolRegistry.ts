import { ACTIVE_SHOULDER_REACH_V2_ID } from '../movements/activeShoulderReachV2';
import { CHAIR_RISE_V2_ID } from '../movements/chairRiseV2';
import {
  BALANCE_LADDER_ID,
  CHAIR_STAND_ID,
  HINGE_REACH_ID,
  SHOULDER_FLEXION_ID,
  TUG_ID,
} from '../movements';
import { ONE_LEG_BALANCE_V2_ID } from '../movements/oneLegBalanceV2';
import {
  BALANCE_EYES_OPEN_V2_ID,
  BALANCE_EYES_OPEN_V2_PROTOCOL_ID,
  BALANCE_EYES_OPEN_V2_PROTOCOL_VERSION,
} from '../movements/balanceEyesOpenV2';
import type {
  MeasurementProtocolRef,
  MeasurementSideRole,
} from './measurementContext';
import {
  MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
  type CheckUpProtocolPolicyId,
} from './protocolPolicy';

export type MeasurementProtocolKind = 'battery' | 'checkup_movement' | 'micro_check';
export type CurrentMicroCheckType = 'chair-power' | 'single-leg-balance' | 'mobility-reach';

export interface MeasurementProtocolDescriptor {
  protocolId: string;
  protocolVersion: number;
  movementId: string;
  metricIds: string[];
  sideRole: MeasurementSideRole;
  sideRequired: boolean;
  officialEvidenceEligible: boolean;
  comparisonGroup: string;
  kind: MeasurementProtocolKind;
  legacyAliases?: string[];
  variants?: readonly string[];
}

export const LEGACY_MOVEMENT_AGE_BATTERY_PROTOCOL_ID = 'legacy_movement_age_battery_v1';
export const MOVEMENT_PROFILE_V2_BATTERY_PROTOCOL_ID = 'movement_profile_v2_battery';
export const MOVEMENT_PROFILE_V2_BATTERY_PROTOCOL_VERSION_V1 = 1;
export const MOVEMENT_PROFILE_V2_BATTERY_PROTOCOL_VERSION_V2 = 2;
/**
 * Frozen top-level identity for Pearl's four programme Strength/Balance
 * check-ups. The serialized token keeps its original wording so existing
 * records remain comparable; it does not define product cadence.
 */
export const PEARL_PROGRAMME_STRENGTH_BALANCE_PROTOCOL_VARIANT =
  'pearl_monthly_strength_balance_v1' as const;

export const MEASUREMENT_PROTOCOLS = [
  {
    protocolId: LEGACY_MOVEMENT_AGE_BATTERY_PROTOCOL_ID,
    protocolVersion: 1,
    movementId: 'legacy_movement_age_battery',
    metricIds: ['strength_power_age', 'balance_age', 'mobility_age'],
    sideRole: 'not_applicable',
    sideRequired: false,
    officialEvidenceEligible: true,
    comparisonGroup: 'legacy_movement_age_battery',
    kind: 'battery',
  },
  {
    protocolId: MOVEMENT_PROFILE_V2_BATTERY_PROTOCOL_ID,
    protocolVersion: MOVEMENT_PROFILE_V2_BATTERY_PROTOCOL_VERSION_V1,
    movementId: 'movement_profile_v2_battery',
    metricIds: ['strength_power_profile', 'balance_profile', 'mobility_profile'],
    sideRole: 'not_applicable',
    sideRequired: false,
    officialEvidenceEligible: true,
    comparisonGroup: 'movement_profile_v2_battery',
    kind: 'battery',
    variants: [PEARL_PROGRAMME_STRENGTH_BALANCE_PROTOCOL_VARIANT],
  },
  {
    protocolId: MOVEMENT_PROFILE_V2_BATTERY_PROTOCOL_ID,
    protocolVersion: MOVEMENT_PROFILE_V2_BATTERY_PROTOCOL_VERSION_V2,
    movementId: 'movement_profile_v2_battery',
    metricIds: ['strength_power_profile', 'balance_eyes_open_ladder_profile', 'mobility_profile'],
    sideRole: 'not_applicable',
    sideRequired: false,
    officialEvidenceEligible: true,
    comparisonGroup: 'movement_profile_v2_battery',
    kind: 'battery',
    variants: ['eyes_open_balance_v2'],
  },
  {
    protocolId: 'legacy_chair_stand_30s',
    protocolVersion: 1,
    movementId: CHAIR_STAND_ID,
    metricIds: ['reps', 'session_mean_rise_velocity_bu_s', 'session_mean_peak_velocity_bu_s'],
    sideRole: 'not_applicable',
    sideRequired: false,
    officialEvidenceEligible: true,
    comparisonGroup: 'chair_stand_30s',
    kind: 'checkup_movement',
    legacyAliases: ['chair-stand-30s'],
  },
  {
    protocolId: 'legacy_balance_ladder_v1',
    protocolVersion: 1,
    movementId: BALANCE_LADDER_ID,
    metricIds: ['single_leg_eyes_open_seconds', 'stage_hold_seconds', 'sway_sd_bu'],
    sideRole: 'standing_leg',
    sideRequired: true,
    officialEvidenceEligible: true,
    comparisonGroup: 'single_leg_balance_hold',
    kind: 'checkup_movement',
    legacyAliases: ['balance-ladder'],
  },
  {
    protocolId: 'legacy_shoulder_flexion_peak_v1',
    protocolVersion: 1,
    movementId: SHOULDER_FLEXION_ID,
    metricIds: ['peak_flexion_degrees'],
    sideRole: 'measured_arm',
    sideRequired: true,
    officialEvidenceEligible: true,
    comparisonGroup: 'shoulder_flexion_peak',
    kind: 'checkup_movement',
    legacyAliases: ['shoulder-flexion-peak'],
  },
  {
    protocolId: 'legacy_hinge_reach_v1',
    protocolVersion: 1,
    movementId: HINGE_REACH_ID,
    metricIds: ['wrist_to_floor_body_units'],
    sideRole: 'not_applicable',
    sideRequired: false,
    officialEvidenceEligible: true,
    comparisonGroup: 'standing_forward_reach',
    kind: 'checkup_movement',
    legacyAliases: ['hinge-reach'],
  },
  {
    protocolId: 'tug_beta_lateral_v1',
    protocolVersion: 1,
    movementId: TUG_ID,
    metricIds: ['total_seconds', 'peak_excursion_body_units'],
    sideRole: 'not_applicable',
    sideRequired: false,
    officialEvidenceEligible: true,
    comparisonGroup: 'timed_up_and_go',
    kind: 'checkup_movement',
    variants: ['standard_path', 'short_path'],
    legacyAliases: ['timed-up-and-go'],
  },
  {
    protocolId: 'mpv2_chair_rise_30s_v1',
    protocolVersion: 1,
    movementId: CHAIR_RISE_V2_ID,
    metricIds: ['reps', 'session_mean_rise_velocity_bu_s', 'session_mean_peak_velocity_bu_s'],
    sideRole: 'not_applicable',
    sideRequired: false,
    officialEvidenceEligible: true,
    comparisonGroup: 'mpv2_chair_rise_30s',
    kind: 'checkup_movement',
  },
  {
    protocolId: 'mpv2_single_leg_balance_45s_v1',
    protocolVersion: 1,
    movementId: ONE_LEG_BALANCE_V2_ID,
    metricIds: ['best_hold_seconds', 'sway_sd_bu', 'valid_trial_count'],
    sideRole: 'standing_leg',
    sideRequired: true,
    officialEvidenceEligible: true,
    comparisonGroup: 'mpv2_single_leg_balance_hold',
    kind: 'checkup_movement',
  },
  {
    protocolId: BALANCE_EYES_OPEN_V2_PROTOCOL_ID,
    protocolVersion: BALANCE_EYES_OPEN_V2_PROTOCOL_VERSION,
    movementId: BALANCE_EYES_OPEN_V2_ID,
    metricIds: [
      'completed_stage_count',
      'highest_completed_stage',
      'terminal_stage_maintained_ms',
      'total_maintained_ms',
    ],
    sideRole: 'standing_leg',
    sideRequired: true,
    officialEvidenceEligible: true,
    comparisonGroup: 'home_balance_eyes_open_ladder',
    kind: 'checkup_movement',
  },
  {
    protocolId: 'mpv2_active_shoulder_reach_v1',
    protocolVersion: 1,
    movementId: ACTIVE_SHOULDER_REACH_V2_ID,
    metricIds: ['peak_flexion_degrees'],
    sideRole: 'measured_arm',
    sideRequired: true,
    officialEvidenceEligible: true,
    comparisonGroup: 'mpv2_active_shoulder_reach',
    kind: 'checkup_movement',
  },
  {
    protocolId: 'mpv2_hinge_reach_v1',
    protocolVersion: 1,
    movementId: HINGE_REACH_ID,
    metricIds: ['wrist_to_floor_body_units'],
    sideRole: 'not_applicable',
    sideRequired: false,
    officialEvidenceEligible: true,
    comparisonGroup: 'mpv2_standing_forward_reach',
    kind: 'checkup_movement',
  },
  {
    protocolId: 'micro_chair_power_5_reps_v1',
    protocolVersion: 1,
    movementId: 'chair-power',
    metricIds: ['rise_velocity_bu_s', 'reps'],
    sideRole: 'not_applicable',
    sideRequired: false,
    officialEvidenceEligible: false,
    comparisonGroup: 'micro_chair_power',
    kind: 'micro_check',
  },
  {
    protocolId: 'micro_single_leg_balance_v1',
    protocolVersion: 1,
    movementId: 'single-leg-balance',
    metricIds: ['hold_seconds'],
    sideRole: 'standing_leg',
    sideRequired: true,
    officialEvidenceEligible: false,
    comparisonGroup: 'micro_single_leg_balance',
    kind: 'micro_check',
  },
  {
    protocolId: 'micro_mobility_reach_v1',
    protocolVersion: 1,
    movementId: 'mobility-reach',
    metricIds: ['wrist_to_floor_body_units'],
    sideRole: 'not_applicable',
    sideRequired: false,
    officialEvidenceEligible: false,
    comparisonGroup: 'standing_forward_reach',
    kind: 'micro_check',
  },
  {
    protocolId: 'micro_chair_power_5_reps_v21',
    protocolVersion: 2,
    movementId: 'chair-power',
    metricIds: ['rise_velocity_bu_s', 'reps'],
    sideRole: 'not_applicable',
    sideRequired: false,
    officialEvidenceEligible: false,
    comparisonGroup: 'micro_chair_power_v21',
    kind: 'micro_check',
    variants: ['voice_v2_1_go_playback_start'],
  },
  {
    protocolId: 'micro_single_leg_balance_v21',
    protocolVersion: 2,
    movementId: 'single-leg-balance',
    metricIds: ['hold_seconds'],
    sideRole: 'standing_leg',
    sideRequired: true,
    officialEvidenceEligible: false,
    comparisonGroup: 'micro_single_leg_balance_v21',
    kind: 'micro_check',
    variants: ['voice_v2_1_go_playback_start'],
  },
  {
    protocolId: 'micro_mobility_reach_v21',
    protocolVersion: 2,
    movementId: 'mobility-reach',
    metricIds: ['wrist_to_floor_body_units'],
    sideRole: 'not_applicable',
    sideRequired: false,
    officialEvidenceEligible: false,
    comparisonGroup: 'standing_forward_reach',
    kind: 'micro_check',
    variants: ['voice_v2_1_go_playback_start'],
  },
] as const satisfies readonly MeasurementProtocolDescriptor[];

export function listMeasurementProtocols(): MeasurementProtocolDescriptor[] {
  return MEASUREMENT_PROTOCOLS.map((descriptor) => ({ ...descriptor }));
}

export function getMeasurementProtocolDescriptor(
  protocolId: string,
  protocolVersion?: number
): MeasurementProtocolDescriptor | null {
  return (
    MEASUREMENT_PROTOCOLS.find(
      (descriptor) =>
        descriptor.protocolId === protocolId &&
        (protocolVersion === undefined || descriptor.protocolVersion === protocolVersion)
    ) ?? null
  );
}

export function protocolRefForDescriptor(
  descriptor: MeasurementProtocolDescriptor,
  protocolVariant?: string | null
): MeasurementProtocolRef {
  return {
    protocolId: descriptor.protocolId,
    protocolVersion: descriptor.protocolVersion,
    ...(protocolVariant ? { protocolVariant } : {}),
  };
}

export function batteryProtocolRefForPolicy(
  policyId: CheckUpProtocolPolicyId | null | undefined,
  protocolVersion?: number
): MeasurementProtocolRef {
  const targetVersion =
    policyId === MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID
      ? protocolVersion ?? MOVEMENT_PROFILE_V2_BATTERY_PROTOCOL_VERSION_V1
      : 1;
  const descriptor = MEASUREMENT_PROTOCOLS.find((candidate) =>
    policyId === MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID
      ? candidate.protocolId === MOVEMENT_PROFILE_V2_BATTERY_PROTOCOL_ID &&
        candidate.protocolVersion === targetVersion
      : candidate.protocolId === LEGACY_MOVEMENT_AGE_BATTERY_PROTOCOL_ID
  );
  return protocolRefForDescriptor(descriptor as MeasurementProtocolDescriptor);
}

export function descriptorForMovementMeasurement({
  movementId,
  policyId,
  protocolVariant,
}: {
  movementId: string;
  policyId?: CheckUpProtocolPolicyId | null;
  protocolVariant?: string | null;
}): MeasurementProtocolDescriptor | null {
  if (movementId === BALANCE_EYES_OPEN_V2_ID) {
    return byProtocolId(BALANCE_EYES_OPEN_V2_PROTOCOL_ID);
  }
  if (movementId === HINGE_REACH_ID && policyId === MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID) {
    return byProtocolId('mpv2_hinge_reach_v1');
  }
  if (movementId === HINGE_REACH_ID) return byProtocolId('legacy_hinge_reach_v1');
  if (movementId === TUG_ID && protocolVariant === 'short_path') return byProtocolId('tug_beta_lateral_v1');
  return (
    MEASUREMENT_PROTOCOLS.find(
      (descriptor) => descriptor.kind === 'checkup_movement' && descriptor.movementId === movementId
    ) ?? null
  );
}

export function descriptorForMicroCheck(type: CurrentMicroCheckType): MeasurementProtocolDescriptor {
  const descriptor = MEASUREMENT_PROTOCOLS.find(
    (candidate) => candidate.kind === 'micro_check' && candidate.movementId === type
  );
  if (!descriptor) throw new Error(`Missing micro-check measurement protocol for ${type}`);
  return descriptor;
}

export function protocolVariantForMovementResult(movementId: string, result: unknown): string | null {
  if (movementId === TUG_ID && hasBoolean(result, 'nonStandardShortPath')) {
    return (result as { nonStandardShortPath: boolean }).nonStandardShortPath ? 'short_path' : 'standard_path';
  }
  return null;
}

function byProtocolId(protocolId: string): MeasurementProtocolDescriptor {
  const descriptor = getMeasurementProtocolDescriptor(protocolId);
  if (!descriptor) throw new Error(`Missing measurement protocol descriptor ${protocolId}`);
  return descriptor;
}

function hasBoolean(value: unknown, key: string): value is Record<string, boolean> {
  return !!value && typeof value === 'object' && !Array.isArray(value) && typeof (value as Record<string, unknown>)[key] === 'boolean';
}
