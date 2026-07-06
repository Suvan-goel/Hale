import { BRAND } from '../brand';
export const SAFETY_CUE_SCHEMA_VERSION = 1 as const;

export type SafetyCueTier = 'global' | 'setup' | 'active' | 'repeat' | 'recovery';

export type SafetyCueId =
  | 'global_stop_sharp_or_increasing_pain'
  | 'global_stop_dizzy_or_lightheaded'
  | 'global_breathe_normally'
  | 'global_clear_space'
  | 'global_stop_if_support_moves'
  | 'global_pause_if_tracking_lost'
  | 'support_use_sturdy_support'
  | 'support_keep_support_within_reach'
  | 'chair_use_sturdy_chair'
  | 'chair_controlled_sit'
  | 'floor_clear_space'
  | 'floor_use_support_for_transfer'
  | 'floor_slow_transition'
  | 'floor_stop_if_transfer_unsteady'
  | 'step_use_low_stable_step'
  | 'step_fixed_support_nearby'
  | 'step_clear_dry_area'
  | 'step_phone_out_of_path'
  | 'step_controlled_return'
  | 'step_stop_if_unstable'
  | 'band_inspect_before_use'
  | 'band_secure_grip'
  | 'band_face_and_eyes_clear'
  | 'band_controlled_return'
  | 'band_never_release_under_tension'
  | 'band_stop_if_slips_or_shifts'
  | 'band_anchor_feet_secure'
  | 'band_do_not_overstretch'
  | 'door_anchor_follow_manufacturer_setup'
  | 'door_anchor_fully_closed'
  | 'door_anchor_test_light_tension'
  | 'door_anchor_stay_out_of_door_path'
  | 'door_anchor_stop_if_moves'
  | 'band_stable_stance'
  | 'comfortable_range_only'
  | 'mobility_no_forcing'
  | 'balance_stop_if_unsteady'
  | 'balance_support_within_reach'
  | 'balance_supported_if_hesitant'
  | 'balance_no_eyes_closed_or_unstable_surface'
  | 'tracking_keep_full_body_in_view'
  | 'tracking_pause_and_reset'
  | 'tracking_no_rush_or_exaggerate'
  | 'tracking_move_when_cued';

export interface SafetyCueDefinition {
  id: SafetyCueId;
  tier: SafetyCueTier;
  text: string;
}

export interface PlannedExerciseSafetyCueProfile {
  schemaVersion: typeof SAFETY_CUE_SCHEMA_VERSION;
  exerciseId: string;
  setupCueIds: readonly SafetyCueId[];
  activeCueIds: readonly SafetyCueId[];
  repeatedSetCueIds: readonly SafetyCueId[];
  recoveryCueIds: readonly SafetyCueId[];
}

export interface PlannedSafetyCueSnapshot {
  schemaVersion: typeof SAFETY_CUE_SCHEMA_VERSION;
  globalCueIds: readonly SafetyCueId[];
  exerciseProfiles: readonly PlannedExerciseSafetyCueProfile[];
  fingerprint: string;
}

export const SAFETY_CUE_DEFINITIONS: Readonly<Record<SafetyCueId, SafetyCueDefinition>> = {
  global_stop_sharp_or_increasing_pain: {
    id: 'global_stop_sharp_or_increasing_pain',
    tier: 'global',
    text: 'Stop if you feel sharp pain or discomfort that keeps building.',
  },
  global_stop_dizzy_or_lightheaded: {
    id: 'global_stop_dizzy_or_lightheaded',
    tier: 'global',
    text: 'Pause or stop if you feel dizzy, lightheaded, or unwell.',
  },
  global_breathe_normally: {
    id: 'global_breathe_normally',
    tier: 'global',
    text: 'Keep breathing normally; do not hold your breath.',
  },
  global_clear_space: {
    id: 'global_clear_space',
    tier: 'global',
    text: 'Clear the area around you before you start.',
  },
  global_stop_if_support_moves: {
    id: 'global_stop_if_support_moves',
    tier: 'global',
    text: 'Stop if your chair, counter, wall, step, band, or anchor shifts.',
  },
  global_pause_if_tracking_lost: {
    id: 'global_pause_if_tracking_lost',
    tier: 'global',
    text: `If tracking pauses, return to your setup position and wait for ${BRAND.appName} to reset.`,
  },
  support_use_sturdy_support: {
    id: 'support_use_sturdy_support',
    tier: 'setup',
    text: 'Use a sturdy wall, counter, chair, or rail for support.',
  },
  support_keep_support_within_reach: {
    id: 'support_keep_support_within_reach',
    tier: 'setup',
    text: 'Keep support within easy reach throughout the set.',
  },
  chair_use_sturdy_chair: {
    id: 'chair_use_sturdy_chair',
    tier: 'setup',
    text: 'Use a sturdy chair that will not slide or tip.',
  },
  chair_controlled_sit: {
    id: 'chair_controlled_sit',
    tier: 'active',
    text: 'Sit down with control; do not drop into the chair.',
  },
  floor_clear_space: {
    id: 'floor_clear_space',
    tier: 'setup',
    text: 'Use clear floor space with enough room to get down and back up.',
  },
  floor_use_support_for_transfer: {
    id: 'floor_use_support_for_transfer',
    tier: 'setup',
    text: 'Use nearby support for getting down to the floor and back up.',
  },
  floor_slow_transition: {
    id: 'floor_slow_transition',
    tier: 'setup',
    text: 'Move slowly when changing between standing and the floor.',
  },
  floor_stop_if_transfer_unsteady: {
    id: 'floor_stop_if_transfer_unsteady',
    tier: 'active',
    text: 'Stop and choose another option if the floor transfer feels unsteady or uncomfortable.',
  },
  step_use_low_stable_step: {
    id: 'step_use_low_stable_step',
    tier: 'setup',
    text: 'Use only the lowest stable bottom stair or step.',
  },
  step_fixed_support_nearby: {
    id: 'step_fixed_support_nearby',
    tier: 'setup',
    text: 'Keep fixed support, such as a rail, wall, or counter, within reach.',
  },
  step_clear_dry_area: {
    id: 'step_clear_dry_area',
    tier: 'setup',
    text: 'Make sure the step and floor area are clear and dry.',
  },
  step_phone_out_of_path: {
    id: 'step_phone_out_of_path',
    tier: 'setup',
    text: 'Keep the phone and stand out of your stepping path.',
  },
  step_controlled_return: {
    id: 'step_controlled_return',
    tier: 'active',
    text: 'Step down with control; do not hop or rush the return.',
  },
  step_stop_if_unstable: {
    id: 'step_stop_if_unstable',
    tier: 'active',
    text: 'Stop if the step, surface, support, or your balance feels unstable.',
  },
  band_inspect_before_use: {
    id: 'band_inspect_before_use',
    tier: 'setup',
    text: 'Inspect the band first, and do not use it if it is worn, cracked, or damaged.',
  },
  band_secure_grip: {
    id: 'band_secure_grip',
    tier: 'setup',
    text: 'Keep a secure grip on the band before adding tension.',
  },
  band_face_and_eyes_clear: {
    id: 'band_face_and_eyes_clear',
    tier: 'setup',
    text: 'Keep the band path away from your face and eyes.',
  },
  band_controlled_return: {
    id: 'band_controlled_return',
    tier: 'active',
    text: 'Return the band slowly with control.',
  },
  band_never_release_under_tension: {
    id: 'band_never_release_under_tension',
    tier: 'active',
    text: 'Never let go of a stretched band.',
  },
  band_stop_if_slips_or_shifts: {
    id: 'band_stop_if_slips_or_shifts',
    tier: 'active',
    text: 'Stop if the band, grip, anchor, door, or your stance slips or shifts.',
  },
  band_anchor_feet_secure: {
    id: 'band_anchor_feet_secure',
    tier: 'setup',
    text: 'For a seated row, keep both feet steady so the band cannot slip toward you.',
  },
  band_do_not_overstretch: {
    id: 'band_do_not_overstretch',
    tier: 'active',
    text: 'Use light tension only; do not overstretch the band.',
  },
  door_anchor_follow_manufacturer_setup: {
    id: 'door_anchor_follow_manufacturer_setup',
    tier: 'setup',
    text: 'Use a purpose-built door anchor and follow its setup instructions.',
  },
  door_anchor_fully_closed: {
    id: 'door_anchor_fully_closed',
    tier: 'setup',
    text: 'Use a fully closed, secure door before adding tension.',
  },
  door_anchor_test_light_tension: {
    id: 'door_anchor_test_light_tension',
    tier: 'setup',
    text: 'Test the anchor with light tension before the set starts.',
  },
  door_anchor_stay_out_of_door_path: {
    id: 'door_anchor_stay_out_of_door_path',
    tier: 'setup',
    text: 'Stand out of the door opening path while the band is anchored.',
  },
  door_anchor_stop_if_moves: {
    id: 'door_anchor_stop_if_moves',
    tier: 'active',
    text: 'Stop if the door or anchor moves, or if tension pulls the door toward you.',
  },
  band_stable_stance: {
    id: 'band_stable_stance',
    tier: 'setup',
    text: 'Set a stable stance before pressing or pulling the band.',
  },
  comfortable_range_only: {
    id: 'comfortable_range_only',
    tier: 'active',
    text: 'Move only through a comfortable range.',
  },
  mobility_no_forcing: {
    id: 'mobility_no_forcing',
    tier: 'active',
    text: 'Do not force the stretch or push into sharp discomfort.',
  },
  balance_stop_if_unsteady: {
    id: 'balance_stop_if_unsteady',
    tier: 'active',
    text: 'Touch support and reset if you feel unsteady.',
  },
  balance_support_within_reach: {
    id: 'balance_support_within_reach',
    tier: 'setup',
    text: 'Keep a counter, wall, or sturdy chair within reach for balance work.',
  },
  balance_supported_if_hesitant: {
    id: 'balance_supported_if_hesitant',
    tier: 'active',
    text: 'Use fingertip support whenever you need it.',
  },
  balance_no_eyes_closed_or_unstable_surface: {
    id: 'balance_no_eyes_closed_or_unstable_surface',
    tier: 'setup',
    text: 'Keep eyes open and stay on a stable surface for this V1 training level.',
  },
  tracking_keep_full_body_in_view: {
    id: 'tracking_keep_full_body_in_view',
    tier: 'setup',
    text: `Keep your full body in view so ${BRAND.appName} can follow the movement.`,
  },
  tracking_pause_and_reset: {
    id: 'tracking_pause_and_reset',
    tier: 'recovery',
    text: 'Tracking paused. Step back into view and restart from the setup position.',
  },
  tracking_no_rush_or_exaggerate: {
    id: 'tracking_no_rush_or_exaggerate',
    tier: 'active',
    text: 'Move naturally; do not rush or exaggerate just for the camera.',
  },
  tracking_move_when_cued: {
    id: 'tracking_move_when_cued',
    tier: 'setup',
    text: 'Wait for the countdown before you start moving.',
  },
};

export const SAFETY_VOICE_LINES: Readonly<Record<SafetyCueId, string>> = Object.fromEntries(
  Object.values(SAFETY_CUE_DEFINITIONS).map((cue) => [cue.id, cue.text])
) as Readonly<Record<SafetyCueId, string>>;

export function isSafetyCueId(value: unknown): value is SafetyCueId {
  return typeof value === 'string' && value in SAFETY_CUE_DEFINITIONS;
}

export function safetyCueText(id: SafetyCueId): string {
  return SAFETY_CUE_DEFINITIONS[id].text;
}

export function safetyCueTexts(ids: readonly SafetyCueId[]): string[] {
  return ids.map(safetyCueText);
}
