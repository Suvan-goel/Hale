/**
 * Plain-language naming layer (ladder spec §1 naming rule).
 *
 * Every user-facing exercise name lives HERE, keyed by internal id — screens
 * and voice scripts must never render an id or a technical name. Internal ids
 * may keep technical vocabulary (e.g. `squat.rfess`); display names must not
 * (no "RDL", "RFESS", "eccentric" — enforced by ladders.test.ts).
 *
 * All strings are placeholder copy pending the final microcopy/brand-voice
 * pass (known open decision flag) — edit freely, nothing keys on the text.
 */

const DISPLAY_NAMES: Record<string, string> = {
  // Squat ladder
  'squat.assisted_sit_to_stand': 'Sit-to-stand with hands',
  'squat.partial_box_squat': 'Part-way squat to a chair',
  'squat.sit_to_stand': 'Sit-to-stand, no hands',
  'squat.slow_lower_sit_to_stand': 'Slow-lower sit-to-stand',
  'squat.box_squat': 'Squat to a chair',
  'squat.fast_up_sit_to_stand': 'Fast-up sit-to-stand',
  'squat.air_squat': 'Squat',
  'squat.paused_squat': 'Squat with a pause',
  'squat.low_step_up': 'Low step-up',
  'squat.lateral_step_up_low': 'Sideways step-up',
  'squat.low_step_alternative': 'Step-up on a sturdy low step',
  'squat.step_up_high': 'Step-up, higher step',
  'squat.step_up_knee_drive': 'Step-up with knee lift',
  'squat.supported_split_squat': 'Split squat with support',
  'squat.static_lunge_shallow': 'Shallow lunge, feet planted',
  'squat.split_squat': 'Split squat',
  'squat.tempo_split_squat': 'Slow-lower split squat',
  'squat.rfess': 'Split squat, back foot on the sofa',
  'squat.tempo_rfess': 'Slow-lower sofa split squat',

  // Hinge ladder
  'hinge.rehearsal_standing_hinge': 'Hip-hinge rehearsal',
  'hinge.glute_bridge': 'Hip bridge',
  'hinge.bridge_hold_top': 'Hip bridge with a hold',
  'hinge.paused_bridge': 'Hip bridge with a squeeze',
  'hinge.feet_elevated_bridge': 'Hip bridge, feet on a step',
  'hinge.single_leg_bridge': 'One-leg hip bridge',
  'hinge.single_leg_bridge_hold': 'One-leg bridge with a hold',
  'hinge.feet_elevated_single_leg_bridge': 'One-leg bridge, foot on a step',
  'hinge.sofa_hip_thrust': 'Hip press, shoulders on the sofa',
  'hinge.wall_tap_hinge': 'Hip hinge to the wall',
  'hinge.hinge_arm_reach': 'Hip hinge with a reach',
  'hinge.good_morning': 'Hinge with hands on chest',
  'hinge.hinge_fast_up': 'Hip hinge, fast up',
  'hinge.kickstand_hinge': 'Kickstand hinge',
  'hinge.supported_single_leg_hinge': 'One-leg hinge with support',
  'hinge.loaded_kickstand_hinge': 'Kickstand hinge with a backpack',
  'hinge.balance_reach': 'Balance reach',

  // Push ladder
  'push.wall_push_up': 'Wall press-up',
  'push.wall_push_up_slow': 'Slow-lower wall press-up',
  'push.counter_push_up': 'Counter press-up',
  'push.paused_counter_push_up': 'Counter press-up with a pause',
  'push.stair_push_up_high': 'Stair press-up, higher step',
  'push.knee_push_up': 'Knee press-up',
  'push.stair_push_up_mid': 'Stair press-up, second step',
  'push.knee_push_up_slow': 'Slow-lower knee press-up',
  'push.stair_push_up_low': 'Stair press-up, bottom step',
  'push.deficit_knee_push_up': 'Knee press-up, hands on books',
  'push.lower_only_push_up': 'Lower-only press-up',
  'push.sofa_arm_push_up': 'Sofa-arm press-up',
  'push.low_table_push_up': 'Low-table press-up',
  'push.low_surface_push_up': 'Press-up on a low, steady surface',
  'push.full_push_up': 'Floor press-up',
  'push.full_push_up_slow': 'Slow-lower floor press-up',
  'push.tempo_push_up': 'Floor press-up with a pause',
  'push.close_grip_push_up': 'Narrow-hands press-up',
  'push.feet_elevated_push_up': 'Press-up, feet on a step',
  'push.archer_intro': 'Side-shifted press-up',

  // Pull ladder
  'pull.prone_blade_squeeze': 'Lying shoulder-blade squeeze',
  'pull.seated_retraction_hold': 'Seated shoulder-blade squeeze',
  'pull.prone_t_raise': 'Lying T raise',
  'pull.prone_w_raise': 'Lying W raise',
  'pull.ytw_circuit': 'Letter raises (Y, T, W)',
  'pull.reverse_snow_angel': 'Reverse snow angel',
  'pull.band_pull_apart': 'Band pull-apart',
  'pull.overhead_band_pull_apart': 'Overhead band pull-apart',
  'pull.seated_band_row': 'Seated band row',
  'pull.door_anchor_row': 'Doorway band row',
  'pull.single_arm_band_row': 'One-arm band row',
  'pull.band_row_hold': 'Band row with a hold',
  'pull.high_band_pull': 'High band pull',
  'pull.band_high_row': 'High band row',
  'pull.backpack_row': 'Backpack row',
  'pull.supported_single_arm_backpack_row': 'One-arm backpack row with support',

  // Core ladder
  'core.dead_bug_heel_slides': 'Heel slides, on your back',
  'core.dead_bug_leg_lower': 'Slow leg lowers, on your back',
  'core.dead_bug_opposite': 'Opposite arm-and-leg reach',
  'core.dead_bug_slow': 'Slow arm-and-leg reach',
  'core.bird_dog': 'Kneeling arm-and-leg reach',
  'core.bird_dog_hold': 'Kneeling reach with a hold',
  'core.knee_plank': 'Knee plank',
  'core.knee_side_plank': 'Knee side plank',
  'core.full_plank': 'Plank',
  'core.side_plank_knees': 'Side plank from knees',
  'core.full_side_plank': 'Side plank',
  'core.plank_shoulder_taps': 'Plank shoulder taps',
  'core.suitcase_carry': 'One-hand backpack carry',
  'core.front_hug_carry': 'Backpack hug carry',
  'core.heavy_carry': 'Heavier backpack carry',
  'core.pallof_press': 'Band press-and-hold',

  // Movement prep
  'prep.easy_march': 'Easy march on the spot',
  'prep.arm_reaches': 'Easy arm reaches',

  // Finisher — quiet power track
  'finisher.heel_drops': 'Heel drops',
  'finisher.moderate_stomps': 'Firm stomps',
  'finisher.explosive_sit_to_stands': 'Fast-up sit-to-stands',
  'finisher.fast_step_ups': 'Quick step-ups',
  'finisher.counter_push_offs': 'Fast counter push-offs',
  'finisher.power_march': 'Power march',
};

/** Display name for any programme exercise or finisher item id. Throws on unknown ids so a missing name fails tests, never ships. */
export function programmeDisplayName(id: string): string {
  const name = DISPLAY_NAMES[id];
  if (!name) throw new Error(`no display name registered for programme exercise '${id}'`);
  return name;
}

export function hasProgrammeDisplayName(id: string): boolean {
  return id in DISPLAY_NAMES;
}

/** All registered display names (guardrail tests scan these). */
export function allProgrammeDisplayNames(): ReadonlyMap<string, string> {
  return new Map(Object.entries(DISPLAY_NAMES));
}
