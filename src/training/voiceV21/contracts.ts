import {
  listExercises,
  resolveExerciseLevel,
  type ExerciseDefinition,
  type ExerciseKind,
} from '../../exercises';
import {
  SESSION_GLOBAL_SAFETY_CUE_IDS,
  requireExerciseSafetyCueProfile,
  safetyCueSnapshotFingerprint,
} from '../safetyCues';
import { resolveTrainingVoiceTargetV21 } from './targetGrammar';
import type {
  TrainingVoiceExerciseContractV21,
  TrainingVoiceImplementationRequirementId,
  TrainingVoiceLateralityV21,
  TrainingVoiceLogicalCueCategoryV21,
  TrainingVoiceLogicalCueV21,
  TrainingVoicePolicyIdV21,
  TrainingVoiceProgressPlanV21,
  TrainingVoiceRuntimeStatusV21,
  TrainingVoiceSafetyFamilyV21,
  TrainingVoiceSafetyPlanV21,
  TrainingVoiceSetTypeV21,
  TrainingVoiceSetupModelV21,
  TrainingVoiceSidePlanV21,
  TrainingVoiceSideVariantV21,
} from './types';

const EXPECTED_TRAINING_VOICE_CONTRACT_COUNT_V21 = 37;

const POLICY_BY_CATEGORY: Readonly<Record<TrainingVoiceLogicalCueCategoryV21, TrainingVoicePolicyIdV21>> = {
  session_intro: 'instruction',
  universal_safety: 'instruction',
  equipment_first_use: 'instruction',
  exercise_first_use: 'instruction',
  exercise_later_set: 'instruction',
  target: 'instruction',
  side_setup: 'instruction',
  side_switch: 'instruction',
  final_position: 'setup_recovery',
  progress: 'low_reassurance',
  rest_transition: 'result_transition',
  control: 'result_transition',
  recovery: 'critical_stop',
  completion: 'result_transition',
};

const FINAL_POSITION_CUE = cue('final-position-set-v21', 'Good. Hold that position until I tell you what to do next.', 'final_position');
const HALFWAY_CUE = cue('halfway-v21', 'Halfway.', 'progress', 'low_reassurance', false);
const FIVE_SECONDS_LEFT_CUE = cue('five-seconds-left-v21', 'Five seconds left.', 'progress', 'low_reassurance', false);

export const TRAINING_VOICE_SHARED_LOGICAL_CUES_V21: readonly TrainingVoiceLogicalCueV21[] = Object.freeze([
  cue(
    'training-intro-v21',
    'Time to train. I will guide the setup, work, and rests. Follow my voice and pause whenever you need.',
    'session_intro'
  ),
  cue(
    'safe-session-start-v21',
    'Clear the space around you. Stop for sharp pain, dizziness, or feeling unwell.',
    'universal_safety'
  ),
  FINAL_POSITION_CUE,
  cue('setup-enter-view-v21', 'Step into view so your whole body is visible.', 'recovery', 'setup_recovery'),
  cue('setup-clearer-view-v21', 'I need a clearer view. Make sure your whole body is visible.', 'recovery', 'setup_recovery'),
  cue('setup-center-v21', 'Move to the centre of the view.', 'recovery', 'setup_recovery'),
  cue('setup-back-v21', 'Move a little farther back.', 'recovery', 'setup_recovery'),
  cue('setup-closer-v21', 'Move a little closer.', 'recovery', 'setup_recovery'),
  cue('setup-hold-still-v21', 'Hold still for a moment.', 'recovery', 'setup_recovery'),
  cue('setup-light-v21', 'Please turn on the main light.', 'recovery', 'setup_recovery'),
  cue('tracking-loss-v21', "Pause there. I've lost sight of you, so this part needs to start again. Come back into view and wait for my next instruction.", 'recovery', 'critical_stop'),
  cue('tracking-recovered-v21', "Good, I can see you again. Stay there and wait. I'll guide you from here.", 'recovery', 'setup_recovery'),
  cue('countdown-three', 'Three.', 'control', 'critical_window'),
  cue('countdown-two', 'Two.', 'control', 'critical_window'),
  cue('countdown-one', 'One.', 'control', 'critical_window'),
  cue('go', 'Go!', 'control', 'critical_window'),
  cue('times-up-v21', 'Time.', 'completion', 'critical_stop'),
  HALFWAY_CUE,
  FIVE_SECONDS_LEFT_CUE,
  cue('paused-v21', 'Paused.', 'control'),
  cue('resuming-v21', 'Resuming.', 'control'),
  cue('retry-v21', "That's okay. We'll try that part again. Take a moment, then follow my voice.", 'recovery', 'result_transition'),
  cue('training-skip-v21', 'Skipped. Moving on.', 'control'),
  cue('set-complete-v21', 'Set complete.', 'completion'),
  cue('rest-now-v21', 'Rest now.', 'rest_transition'),
  cue('last-set-v21', 'Last set.', 'rest_transition'),
  cue('next-exercise-v21', 'Next exercise.', 'rest_transition'),
  cue('session-complete-v21', 'Session complete.', 'completion'),
  cue('item-complete-v21', 'Good. That part is done.', 'completion'),
  cue('equip-chair-stable-v21', 'Use a sturdy chair that will not slide.', 'equipment_first_use'),
  cue('equip-support-close-v21', 'Keep sturdy support within easy reach.', 'equipment_first_use'),
  cue('equip-balance-support-v21', 'Keep support within easy reach.', 'equipment_first_use'),
  cue('equip-step-stable-v21', 'Use the lowest stable step, with support nearby.', 'equipment_first_use'),
  cue('equip-long-band-v21', 'Check the band first and keep it away from your face.', 'equipment_first_use'),
  cue('equip-door-anchor-v21', 'Use a secure closed door anchor and test light tension first.', 'equipment_first_use'),
  cue('equip-floor-transition-v21', 'Move down to the floor and settle into the start position.', 'equipment_first_use'),
  cue('floor-gate-question-v21', 'Can you safely get down to the floor and back up without assistance?', 'equipment_first_use'),
  cue('switch-legs-v21', 'Switch legs.', 'side_switch'),
  cue('switch-foot-positions-v21', 'Switch foot positions.', 'side_switch'),
  cue('switch-sides-v21', 'Switch sides.', 'side_switch'),
  cue('step-up-next-left-v21', 'Next rep starts with your left leg.', 'side_setup'),
  cue('step-up-next-right-v21', 'Next rep starts with your right leg.', 'side_setup'),
  cue('step-up-wrong-left-v21', 'No rep. Start the next one with your left leg.', 'recovery', 'critical_stop'),
  cue('step-up-wrong-right-v21', 'No rep. Start the next one with your right leg.', 'recovery', 'critical_stop'),
]);

const SHARED_CUE_BY_KEY = new Map(TRAINING_VOICE_SHARED_LOGICAL_CUES_V21.map((item) => [item.key, item]));

const SAFETY_CUE_BY_FAMILY: Readonly<Record<TrainingVoiceSafetyFamilyV21, TrainingVoiceLogicalCueV21 | null>> = {
  none: null,
  chair_seat: SHARED_CUE_BY_KEY.get('equip-chair-stable-v21') ?? null,
  generic_support: SHARED_CUE_BY_KEY.get('equip-support-close-v21') ?? null,
  balance_support: SHARED_CUE_BY_KEY.get('equip-balance-support-v21') ?? null,
  step_or_stair: SHARED_CUE_BY_KEY.get('equip-step-stable-v21') ?? null,
  long_band_handheld_or_foot_anchored: SHARED_CUE_BY_KEY.get('equip-long-band-v21') ?? null,
  door_anchor_band: SHARED_CUE_BY_KEY.get('equip-door-anchor-v21') ?? null,
  mini_band_above_knees: null,
  floor_eligible_user: SHARED_CUE_BY_KEY.get('equip-floor-transition-v21') ?? null,
};

const SOURCE_FILE_BY_FAMILY: Readonly<Record<string, string>> = {
  balance: 'src/exercises/balanceRung.ts',
  'glute-bridge': 'src/exercises/gluteBridge.ts',
  'hamstring-reach': 'src/exercises/seatedHamstringReach.ts',
  'heel-raise': 'src/exercises/heelRaise.ts',
  'hip-hinge': 'src/exercises/hipHinge.ts',
  'lateral-stability': 'src/exercises/lateralStability.ts',
  march: 'src/exercises/loadedMarch.ts',
  'mobility-flexibility': 'src/exercises/mobilityDrills.ts',
  'neck-rotation': 'src/exercises/neckRotation.ts',
  overhead: 'src/exercises/overheadPress.ts',
  'pull-upper-back': 'src/exercises/pullUpperBack.ts',
  'push-up': 'src/exercises/pushUp.ts',
  'sit-to-stand': 'src/exercises/sitToStand.ts',
  squat: 'src/exercises/supportedSquat.ts',
  'step-up': 'src/exercises/stepUp.ts',
};

interface ContractOverride {
  readonly first: string;
  readonly later: string;
  readonly target: string;
  readonly laterality: TrainingVoiceLateralityV21;
  readonly safetyFamily: TrainingVoiceSafetyFamilyV21;
  readonly safetyAbsorbed: boolean;
  readonly safetyAbsorbedFamilies?: readonly TrainingVoiceSafetyFamilyV21[];
  readonly setupModel: TrainingVoiceSetupModelV21;
  readonly finalPositionRequired: boolean;
  readonly requirements: readonly TrainingVoiceImplementationRequirementId[];
  readonly runtimeStatus: TrainingVoiceRuntimeStatusV21;
  readonly sidePlan?: TrainingVoiceSidePlanV21;
  readonly notes?: string;
}

const SAFETY_REQUIREMENT = [] as const;
const FLOOR_SOFTWARE_READY_REQUIREMENTS = SAFETY_REQUIREMENT;

const CONTRACT_OVERRIDES: Readonly<Record<string, ContractOverride>> = {
  'balance-feet-together-hold': blocked({
    first: 'Feet-together hold. Stand with feet together, fingertips near support, eyes open.',
    later: 'Feet-together hold.',
    target: 'Hold for twenty seconds.',
    laterality: 'both_sides_not_scored_separately',
    safetyFamily: 'balance_support',
    safetyAbsorbed: true,
    setupModel: 'balance_setup',
    requirements: SAFETY_REQUIREMENT,
  }),
  'balance-single-leg-hold': blocked({
    first: 'Single-leg hold. Keep support close.',
    later: 'Single-leg hold.',
    target: 'Hold for [duration].',
    laterality: 'both_sides_round_required',
    safetyFamily: 'balance_support',
    safetyAbsorbed: true,
    setupModel: 'balance_setup',
    requirements: SAFETY_REQUIREMENT,
    sidePlan: bothSidesRoundPlan(
      'standing_leg',
      [
        side('left', 'side-single-leg-left-v21', 'Start on your left leg. Lift your right foot slightly.'),
        side('right', 'side-single-leg-right-v21', 'Start on your right leg. Lift your left foot slightly.'),
      ],
      'switch-legs-v21'
    ),
  }),
  'balance-tandem-hold': blocked({
    first: 'Tandem hold. Keep support close.',
    later: 'Tandem hold.',
    target: 'Hold for [duration].',
    laterality: 'both_sides_round_required',
    safetyFamily: 'balance_support',
    safetyAbsorbed: true,
    setupModel: 'balance_setup',
    requirements: SAFETY_REQUIREMENT,
    sidePlan: bothSidesRoundPlan(
      'lead_foot',
      [
        side('left_front', 'side-tandem-left-front-v21', 'Place your left foot in front, heel to toe.'),
        side('right_front', 'side-tandem-right-front-v21', 'Place your right foot in front, heel to toe.'),
      ],
      'switch-foot-positions-v21'
    ),
  }),
  'band-pull-apart': blocked({
    first: 'Band pull-apart. Hold a light band at chest height. Pull your hands wide, then return slowly.',
    later: 'Band pull-apart.',
    target: 'Move for thirty seconds.',
    laterality: 'bilateral_simultaneous',
    safetyFamily: 'long_band_handheld_or_foot_anchored',
    safetyAbsorbed: false,
    setupModel: 'band_setup',
    requirements: SAFETY_REQUIREMENT,
  }),
  'chair-supported-split-squat': blocked({
    first: 'Supported split squat. Keep fingertips near sturdy support.',
    later: 'Supported split squat.',
    target: 'Aim for [reps] reps.',
    laterality: 'both_sides_round_required',
    safetyFamily: 'generic_support',
    safetyAbsorbed: true,
    safetyAbsorbedFamilies: ['chair_seat'],
    setupModel: 'chair_setup',
    requirements: SAFETY_REQUIREMENT,
    sidePlan: bothSidesRoundPlan(
      'front_leg',
      [
        side('left_forward', 'side-split-squat-left-forward-v21', 'Left foot forward, small split stance.'),
        side('right_forward', 'side-split-squat-right-forward-v21', 'Right foot forward, small split stance.'),
      ],
      'switch-sides-v21'
    ),
  }),
  'glute-bridge-hold': blocked({
    first: 'Bridge hold. Lie on your back, knees bent, feet flat. Lift your hips and hold.',
    later: 'Bridge hold.',
    target: 'Hold for twenty seconds.',
    laterality: 'bilateral_simultaneous',
    safetyFamily: 'floor_eligible_user',
    safetyAbsorbed: false,
    setupModel: 'floor_setup',
    requirements: FLOOR_SOFTWARE_READY_REQUIREMENTS,
  }),
  'glute-bridge-reps': blocked({
    first: 'Glute bridge. Lie on your back, knees bent, feet flat. Lift your hips, then lower with control.',
    later: 'Glute bridge.',
    target: 'Aim for twelve reps.',
    laterality: 'bilateral_simultaneous',
    safetyFamily: 'floor_eligible_user',
    safetyAbsorbed: false,
    setupModel: 'floor_setup',
    requirements: FLOOR_SOFTWARE_READY_REQUIREMENTS,
  }),
  'heel-raise-free': readyAfterAudio({
    first: 'Heel raise. Stand tall. Rise onto the balls of your feet, then lower slowly.',
    later: 'Heel raise.',
    target: 'Aim for eighteen reps.',
    laterality: 'bilateral_simultaneous',
    safetyFamily: 'none',
    safetyAbsorbed: true,
    setupModel: 'standing_general',
  }),
  'heel-raise-supported': blocked({
    first: 'Supported heel raise. Fingertips near support. Rise onto the balls of your feet, then lower slowly.',
    later: 'Supported heel raise.',
    target: 'Aim for fifteen reps.',
    laterality: 'bilateral_simultaneous',
    safetyFamily: 'generic_support',
    safetyAbsorbed: true,
    setupModel: 'standing_general',
    requirements: SAFETY_REQUIREMENT,
  }),
  'hip-hinge-free': readyAfterAudio({
    first: 'Hip hinge. Feet under hips. Send hips back with a long spine, then stand tall.',
    later: 'Hip hinge.',
    target: 'Aim for twelve reps.',
    laterality: 'bilateral_simultaneous',
    safetyFamily: 'none',
    safetyAbsorbed: true,
    setupModel: 'standing_general',
  }),
  'hip-hinge-wall': blocked({
    first: 'Wall-tap hinge. Stand a step from the wall. Send hips back to tap the wall, then stand tall.',
    later: 'Wall-tap hinge.',
    target: 'Aim for ten reps.',
    laterality: 'bilateral_simultaneous',
    safetyFamily: 'generic_support',
    safetyAbsorbed: true,
    setupModel: 'material_setup',
    requirements: SAFETY_REQUIREMENT,
  }),
  'loaded-march': blocked({
    first: 'March in place. Stand tall near support and march with a steady rhythm.',
    later: 'March in place.',
    target: 'Aim for sixteen reps.',
    laterality: 'alternating_within_set',
    safetyFamily: 'balance_support',
    safetyAbsorbed: true,
    setupModel: 'balance_setup',
    requirements: SAFETY_REQUIREMENT,
    notes: 'Current source says this legacy id is an unloaded supported march in place.',
  }),
  'loaded-sit-to-stand': blocked({
    first: 'Loaded sit-to-stand. Hold the load close to your chest. Stand fully, then sit with control.',
    later: 'Loaded sit-to-stand.',
    target: 'Aim for eight reps.',
    laterality: 'bilateral_simultaneous',
    safetyFamily: 'chair_seat',
    safetyAbsorbed: true,
    setupModel: 'chair_setup',
    requirements: SAFETY_REQUIREMENT,
  }),
  'mini-band-lateral-walk': blocked({
    first: 'Mini-band lateral walk. Band above your knees. Take small controlled steps both directions.',
    later: 'Mini-band lateral walk.',
    target: 'Move for thirty seconds.',
    laterality: 'bilateral_sequential_within_set',
    safetyFamily: 'mini_band_above_knees',
    safetyAbsorbed: true,
    safetyAbsorbedFamilies: ['long_band_handheld_or_foot_anchored', 'balance_support'],
    setupModel: 'band_setup',
    requirements: SAFETY_REQUIREMENT,
    sidePlan: {
      required: false,
      variants: [],
      defaultVariantId: null,
      switchCue: null,
      schedule: 'both_directions_within_timed_set',
      reasonCodes: ['fd_004_above_knees_both_directions_within_timed_set'],
    },
  }),
  'neck-rotation': readyAfterAudio({
    first: 'Neck rotations. Face the phone, sit or stand tall, and slowly look over one shoulder, then the other.',
    later: 'Neck rotations.',
    target: 'Move slowly until I say stop.',
    laterality: 'alternating_within_set',
    safetyFamily: 'none',
    safetyAbsorbed: true,
    setupModel: 'standing_general',
  }),
  'overhead-press-band': blocked({
    first: 'Band overhead press. Stand tall with light band tension. Press overhead, then return slowly.',
    later: 'Band overhead press.',
    target: 'Aim for twelve reps.',
    laterality: 'bilateral_simultaneous',
    safetyFamily: 'long_band_handheld_or_foot_anchored',
    safetyAbsorbed: false,
    setupModel: 'band_setup',
    requirements: SAFETY_REQUIREMENT,
  }),
  'overhead-reach': readyAfterAudio({
    first: 'Overhead reach. Stand tall. Reach both arms overhead as far as comfortable, then lower.',
    later: 'Overhead reach.',
    target: 'Aim for twelve reps.',
    laterality: 'bilateral_simultaneous',
    safetyFamily: 'none',
    safetyAbsorbed: true,
    setupModel: 'standing_general',
  }),
  'push-up-incline': blocked({
    first: 'Incline push-up. Hands on a stable counter or sturdy chair. Lower in with control, then press away.',
    later: 'Incline push-up.',
    target: 'Aim for ten reps.',
    laterality: 'bilateral_simultaneous',
    safetyFamily: 'generic_support',
    safetyAbsorbed: true,
    safetyAbsorbedFamilies: ['chair_seat'],
    setupModel: 'chair_setup',
    requirements: SAFETY_REQUIREMENT,
  }),
  'push-up-standard': blocked({
    first: 'Push-up. Start from the floor position. Lower with control, then press up.',
    later: 'Push-up.',
    target: 'Aim for eight reps.',
    laterality: 'bilateral_simultaneous',
    safetyFamily: 'floor_eligible_user',
    safetyAbsorbed: false,
    setupModel: 'floor_setup',
    requirements: FLOOR_SOFTWARE_READY_REQUIREMENTS,
  }),
  'push-up-wall': blocked({
    first: 'Wall push-up. Hands on the wall. Lower in with control, then press away.',
    later: 'Wall push-up.',
    target: 'Aim for ten reps.',
    laterality: 'bilateral_simultaneous',
    safetyFamily: 'generic_support',
    safetyAbsorbed: true,
    setupModel: 'material_setup',
    requirements: SAFETY_REQUIREMENT,
  }),
  'seated-band-row': blocked({
    first: 'Seated band row. Sit tall on a sturdy chair with the band anchored under both feet. Pull elbows back, then return slowly.',
    later: 'Seated band row.',
    target: 'Aim for ten reps.',
    laterality: 'bilateral_simultaneous',
    safetyFamily: 'long_band_handheld_or_foot_anchored',
    safetyAbsorbed: false,
    safetyAbsorbedFamilies: ['chair_seat'],
    setupModel: 'band_setup',
    requirements: SAFETY_REQUIREMENT,
  }),
  'seated-hamstring-reach': blocked({
    first: 'Seated hamstring reach. Sit tall at the chair edge.',
    later: 'Seated hamstring reach.',
    target: 'Reach gently and hold until I say relax.',
    laterality: 'both_sides_round_required',
    safetyFamily: 'chair_seat',
    safetyAbsorbed: true,
    setupModel: 'chair_setup',
    requirements: SAFETY_REQUIREMENT,
    sidePlan: bothSidesRoundPlan(
      'extended_leg',
      [
        side('left_extended', 'side-hamstring-left-extended-v21', 'Extend your left leg, heel on the floor.'),
        side('right_extended', 'side-hamstring-right-extended-v21', 'Extend your right leg, heel on the floor.'),
      ],
      'switch-sides-v21'
    ),
  }),
  'squat-free': readyAfterAudio({
    first: 'Squat. Feet about hip width. Lower as if to sit, then stand with control.',
    later: 'Squat.',
    target: 'Aim for twelve reps.',
    laterality: 'bilateral_simultaneous',
    safetyFamily: 'none',
    safetyAbsorbed: true,
    setupModel: 'standing_general',
  }),
  'squat-loaded': readyAfterAudio({
    first: 'Loaded squat. Hold the load close to your chest. Lower into a squat, then stand with control.',
    later: 'Loaded squat.',
    target: 'Aim for eight reps.',
    laterality: 'bilateral_simultaneous',
    safetyFamily: 'none',
    safetyAbsorbed: true,
    setupModel: 'material_setup',
  }),
  'squat-slow-eccentric': readyAfterAudio({
    first: 'Slow-lower squat. Lower slowly, then stand with control.',
    later: 'Slow-lower squat.',
    target: 'Aim for eight reps.',
    laterality: 'bilateral_simultaneous',
    safetyFamily: 'none',
    safetyAbsorbed: true,
    setupModel: 'standing_general',
  }),
  'squat-supported': blocked({
    first: 'Supported squat. Stand near sturdy support. Lower as if to sit, then stand with control.',
    later: 'Supported squat.',
    target: 'Aim for ten reps.',
    laterality: 'bilateral_simultaneous',
    safetyFamily: 'generic_support',
    safetyAbsorbed: true,
    safetyAbsorbedFamilies: ['chair_seat'],
    setupModel: 'chair_setup',
    requirements: SAFETY_REQUIREMENT,
  }),
  'standing-band-row': blocked({
    first: 'Standing band row. Face the secure door anchor in a stable stance. Pull elbows back, then return slowly.',
    later: 'Standing band row.',
    target: 'Aim for ten reps.',
    laterality: 'bilateral_simultaneous',
    safetyFamily: 'door_anchor_band',
    safetyAbsorbed: false,
    setupModel: 'band_setup',
    requirements: SAFETY_REQUIREMENT,
  }),
  'step-up': blocked({
    first: 'Step-up. Use the lowest stable step with support nearby. Return both feet to the floor after each rep.',
    later: 'Step-up. Return both feet to the floor after each rep.',
    target: 'Do twelve total reps.',
    laterality: 'alternating_lead_leg_each_rep',
    safetyFamily: 'step_or_stair',
    safetyAbsorbed: true,
    setupModel: 'step_setup',
    requirements: SAFETY_REQUIREMENT,
    sidePlan: {
      required: true,
      variants: [
        side('left', 'step-up-start-left-v21', 'Start with your left leg.'),
        side('right', 'step-up-start-right-v21', 'Start with your right leg.'),
      ],
      defaultVariantId: 'left',
      switchCue: null,
      schedule: 'alternate_lead_leg_each_rep',
      reasonCodes: ['fd_005_alternate_lead_leg_each_rep', 'step_up_start_lead_pinned_by_set'],
    },
  }),
  'sts-cushion': blocked({
    first: 'Cushion sit-to-stand. Sit tall on the cushion, feet flat. Stand fully, then sit with control.',
    later: 'Cushion sit-to-stand.',
    target: 'Aim for eight reps.',
    laterality: 'bilateral_simultaneous',
    safetyFamily: 'chair_seat',
    safetyAbsorbed: true,
    setupModel: 'chair_setup',
    requirements: SAFETY_REQUIREMENT,
  }),
  'sts-power': blocked({
    first: 'Power sit-to-stand. Sit tall, drive up briskly to standing, then sit with control.',
    later: 'Power sit-to-stand.',
    target: 'Aim for twelve reps.',
    laterality: 'bilateral_simultaneous',
    safetyFamily: 'chair_seat',
    safetyAbsorbed: true,
    setupModel: 'chair_setup',
    requirements: SAFETY_REQUIREMENT,
  }),
  'sts-slow-eccentric': blocked({
    first: 'Slow-lower sit-to-stand. Stand fully, then lower slowly and steadily before the next rep.',
    later: 'Slow-lower sit-to-stand.',
    target: 'Aim for eight reps.',
    laterality: 'bilateral_simultaneous',
    safetyFamily: 'chair_seat',
    safetyAbsorbed: true,
    setupModel: 'chair_setup',
    requirements: SAFETY_REQUIREMENT,
  }),
  'sts-standard': blocked({
    first: 'Sit-to-stand. Sit tall in the middle of the chair, feet flat. Stand fully, then sit with control.',
    later: 'Sit-to-stand.',
    target: 'Aim for ten reps.',
    laterality: 'bilateral_simultaneous',
    safetyFamily: 'chair_seat',
    safetyAbsorbed: true,
    setupModel: 'chair_setup',
    requirements: SAFETY_REQUIREMENT,
  }),
  'supported-hip-flexor-stretch': blocked({
    first: 'Supported hip-flexor stretch. Keep fingertips near support.',
    later: 'Supported hip-flexor stretch.',
    target: 'Hold for [duration].',
    laterality: 'both_sides_round_required',
    safetyFamily: 'generic_support',
    safetyAbsorbed: true,
    setupModel: 'standing_general',
    requirements: SAFETY_REQUIREMENT,
    sidePlan: bothSidesRoundPlan(
      'stretched_hip_side',
      [
        side('left_back', 'side-hip-flexor-left-back-v21', 'Step your right foot forward so your left hip side stretches.'),
        side('right_back', 'side-hip-flexor-right-back-v21', 'Step your left foot forward so your right hip side stretches.'),
      ],
      'switch-sides-v21'
    ),
  }),
  'supported-side-step': blocked({
    first: 'Supported side step. Stand near a counter. Step to the side, bring the other foot in, and continue with control.',
    later: 'Supported side step.',
    target: 'Move for thirty seconds.',
    laterality: 'bilateral_sequential_within_set',
    safetyFamily: 'balance_support',
    safetyAbsorbed: true,
    setupModel: 'balance_setup',
    requirements: SAFETY_REQUIREMENT,
  }),
  'thoracic-rotation': readyAfterAudio({
    first: 'Thoracic rotation. Sit or stand tall with arms crossed. Rotate one way, return to center, then rotate the other way.',
    later: 'Thoracic rotation.',
    target: 'Move for thirty seconds.',
    laterality: 'alternating_within_set',
    safetyFamily: 'none',
    safetyAbsorbed: true,
    setupModel: 'standing_general',
  }),
  'toe-raise-supported': blocked({
    first: 'Supported toe raise. Keep heels down, lift the front of your feet, then lower slowly.',
    later: 'Supported toe raise.',
    target: 'Move for thirty seconds.',
    laterality: 'bilateral_simultaneous',
    safetyFamily: 'generic_support',
    safetyAbsorbed: true,
    setupModel: 'standing_general',
    requirements: SAFETY_REQUIREMENT,
  }),
  'wall-calf-stretch': blocked({
    first: 'Wall calf stretch. Hands on the wall.',
    later: 'Wall calf stretch.',
    target: 'Hold for [duration].',
    laterality: 'both_sides_round_required',
    safetyFamily: 'generic_support',
    safetyAbsorbed: true,
    setupModel: 'material_setup',
    requirements: SAFETY_REQUIREMENT,
    sidePlan: bothSidesRoundPlan(
      'stretched_calf_side',
      [
        side('left_back', 'side-calf-left-back-v21', 'Step your left leg back, heel down.'),
        side('right_back', 'side-calf-right-back-v21', 'Step your right leg back, heel down.'),
      ],
      'switch-sides-v21'
    ),
  }),
};

export const TRAINING_VOICE_EXERCISE_CONTRACTS_V21: readonly TrainingVoiceExerciseContractV21[] =
  Object.freeze(listExercises().map(buildContract).sort((a, b) => a.exerciseId.localeCompare(b.exerciseId)));

const CONTRACT_BY_ID = new Map(TRAINING_VOICE_EXERCISE_CONTRACTS_V21.map((contract) => [contract.exerciseId, contract]));

export function listTrainingVoiceContractsV21(): TrainingVoiceExerciseContractV21[] {
  return TRAINING_VOICE_EXERCISE_CONTRACTS_V21.map(cloneContract);
}

export function getTrainingVoiceContractV21(exerciseId: string): TrainingVoiceExerciseContractV21 {
  const contract = CONTRACT_BY_ID.get(exerciseId);
  if (!contract) throw new Error(`missing Training Voice V2.1 contract for '${exerciseId}'`);
  return cloneContract(contract);
}

export function maybeTrainingVoiceContractV21(exerciseId: string): TrainingVoiceExerciseContractV21 | null {
  const contract = CONTRACT_BY_ID.get(exerciseId);
  return contract ? cloneContract(contract) : null;
}

export interface TrainingVoiceContractRegistryValidationV21 {
  readonly liveExerciseCount: number;
  readonly contractCount: number;
  readonly expectedCount: number;
  readonly missingContractIds: readonly string[];
  readonly staleExtraContractIds: readonly string[];
  readonly duplicateContractIds: readonly string[];
  readonly duplicateLogicalCueKeys: readonly string[];
  readonly bilateralSidePolicyErrorIds: readonly string[];
  readonly activeSetCountCueCount: number;
  readonly semanticMismatchCount: number;
  readonly valid: boolean;
}

export function validateTrainingVoiceContractRegistryV21(): TrainingVoiceContractRegistryValidationV21 {
  const liveIds = listExercises().map((exercise) => exercise.id).sort();
  const contractIds = TRAINING_VOICE_EXERCISE_CONTRACTS_V21.map((contract) => contract.exerciseId).sort();
  const missingContractIds = liveIds.filter((id) => !contractIds.includes(id));
  const staleExtraContractIds = contractIds.filter((id) => !liveIds.includes(id));
  const duplicateContractIds = duplicates(contractIds);
  const duplicateLogicalCueKeys = duplicateCueKeysWithDifferentScripts(TRAINING_VOICE_EXERCISE_CONTRACTS_V21);
  const bilateralSidePolicyErrorIds = TRAINING_VOICE_EXERCISE_CONTRACTS_V21
    .filter((contract) => isBilateralWithoutSideSchedule(contract.laterality))
    .filter((contract) => contract.sidePlan.required || contract.sidePlan.switchCue || contract.implementationRequirements.includes('IR-VOICE-ROUND-STATE'))
    .map((contract) => contract.exerciseId);
  const activeSetCountCueCount = allContractCues(TRAINING_VOICE_EXERCISE_CONTRACTS_V21)
    .filter((cueForContract) => /set one of|sets today|two sets|three sets/i.test(cueForContract.exactScript)).length;
  const semanticMismatchCount = TRAINING_VOICE_EXERCISE_CONTRACTS_V21.filter((contract) => !contract.semanticMatch).length;
  const valid =
    liveIds.length === EXPECTED_TRAINING_VOICE_CONTRACT_COUNT_V21 &&
    contractIds.length === liveIds.length &&
    missingContractIds.length === 0 &&
    staleExtraContractIds.length === 0 &&
    duplicateContractIds.length === 0 &&
    duplicateLogicalCueKeys.length === 0 &&
    bilateralSidePolicyErrorIds.length === 0 &&
    activeSetCountCueCount === 0 &&
    semanticMismatchCount === 0;
  return {
    liveExerciseCount: liveIds.length,
    contractCount: contractIds.length,
    expectedCount: EXPECTED_TRAINING_VOICE_CONTRACT_COUNT_V21,
    missingContractIds,
    staleExtraContractIds,
    duplicateContractIds,
    duplicateLogicalCueKeys,
    bilateralSidePolicyErrorIds,
    activeSetCountCueCount,
    semanticMismatchCount,
    valid,
  };
}

export function allTrainingVoiceLogicalCuesV21(): TrainingVoiceLogicalCueV21[] {
  const out: TrainingVoiceLogicalCueV21[] = [...TRAINING_VOICE_SHARED_LOGICAL_CUES_V21];
  for (const contract of TRAINING_VOICE_EXERCISE_CONTRACTS_V21) {
    out.push(contract.firstUseCue, contract.laterSetCue, contract.targetCue);
    for (const variant of contract.sidePlan.variants) out.push(variant.cue);
  }
  return uniqueCues(out);
}

function buildContract(def: ExerciseDefinition): TrainingVoiceExerciseContractV21 {
  const override = CONTRACT_OVERRIDES[def.id];
  if (!override) throw new Error(`missing Training Voice V2.1 override for '${def.id}'`);
  const resolved = resolveExerciseLevel(def.id);
  const firstUseCue = cue(`ex-${def.id}-first-v21`, override.first, 'exercise_first_use');
  const laterSetCue = cue(`ex-${def.id}-next-v21`, override.later, 'exercise_later_set');
  const targetCue = cue(`target-${def.id}-v21`, override.target, 'target');
  const sidePlan = override.sidePlan ?? noSidePlan(override.laterality);
  const safetyPlan = safetyPlanFor(
    def.id,
    override.safetyFamily,
    override.safetyAbsorbed,
    override.safetyAbsorbedFamilies ?? []
  );
  const partial = {
    exerciseId: def.id,
    setType: setTypeForKind(def.kind),
    targetCue,
    livePrescription: def.prescription,
  };
  const targetPlan = resolveTrainingVoiceTargetV21({ contract: partial });
  return Object.freeze({
    exerciseId: def.id,
    displayName: def.displayName,
    releaseStatus: resolved.level.releaseStatus,
    setType: setTypeForKind(def.kind),
    currentSetCount: def.prescription.sets,
    currentTargetSemantics: targetSemantics(def),
    orientation: def.cameraView.view,
    equipment: def.equipment.slice(),
    support: supportFor(def),
    laterality: override.laterality,
    setupModel: override.setupModel,
    firstUseCue,
    laterSetCue,
    targetCue,
    targetPlan,
    sidePlan,
    progressPlan: progressPlanFor(setTypeForKind(def.kind), targetPlan.value),
    safetyPlan,
    finalPositionRequired: override.finalPositionRequired,
    repeatInstructions: repeatInstructionKeys(firstUseCue, sidePlan, targetCue),
    implementationRequirements: override.requirements.slice(),
    runtimeStatus: override.runtimeStatus,
    sourceFiles: sourceFilesFor(def),
    semanticMatch: true,
    notes: override.notes ?? 'V2.1 contract reconciled to current exercise registry and approved script baseline.',
    livePrescription: { ...def.prescription },
    liveKind: def.kind,
  } satisfies TrainingVoiceExerciseContractV21);
}

function cue(
  key: string,
  exactScript: string,
  category: TrainingVoiceLogicalCueCategoryV21,
  policyId: TrainingVoicePolicyIdV21 = POLICY_BY_CATEGORY[category],
  requiredForVoiceFirst = true
): TrainingVoiceLogicalCueV21 {
  return Object.freeze({ key, exactScript, category, policyId, requiredForVoiceFirst });
}

function side(
  variantId: TrainingVoiceSideVariantV21['variantId'],
  key: string,
  exactScript: string
): TrainingVoiceSideVariantV21 {
  return Object.freeze({ variantId, cue: cue(key, exactScript, 'side_setup') });
}

function bothSidesRoundPlan(
  semanticSideRole: TrainingVoiceSidePlanV21['semanticSideRole'],
  variants: readonly TrainingVoiceSideVariantV21[],
  switchCueKey: 'switch-legs-v21' | 'switch-foot-positions-v21' | 'switch-sides-v21'
): TrainingVoiceSidePlanV21 {
  const switchCue = SHARED_CUE_BY_KEY.get(switchCueKey);
  if (!switchCue) throw new Error(`missing shared side switch cue '${switchCueKey}'`);
  return Object.freeze({
    required: true,
    semanticSideRole,
    variants: variants.map((variant) => Object.freeze(variant)),
    defaultVariantId: variants[0]?.variantId ?? null,
    switchCue,
    schedule: 'both_sides_round',
    reasonCodes: ['fd_001_both_sides_round_required'],
  });
}

function noSidePlan(laterality: TrainingVoiceLateralityV21): TrainingVoiceSidePlanV21 {
  return Object.freeze({
    required: false,
    variants: [],
    defaultVariantId: null,
    switchCue: null,
    schedule: laterality === 'alternating_lead_leg_each_rep' ? 'alternate_lead_leg_each_rep' : 'none',
    reasonCodes: ['no_side_specific_schedule'],
  });
}

function blocked(input: Omit<ContractOverride, 'runtimeStatus' | 'finalPositionRequired'> & { readonly finalPositionRequired?: boolean }): ContractOverride {
  return Object.freeze({
    ...input,
    finalPositionRequired: input.finalPositionRequired ?? true,
    runtimeStatus: input.requirements.length > 0 ? 'behavior_dependency_pending' : 'software_ready_audio_pending',
  });
}

function readyAfterAudio(input: Omit<ContractOverride, 'runtimeStatus' | 'requirements' | 'finalPositionRequired'> & {
  readonly requirements?: readonly TrainingVoiceImplementationRequirementId[];
  readonly finalPositionRequired?: boolean;
}): ContractOverride {
  return Object.freeze({
    ...input,
    requirements: input.requirements ?? [],
    finalPositionRequired: input.finalPositionRequired ?? true,
    runtimeStatus: 'software_ready_audio_pending',
  });
}

function setTypeForKind(kind: ExerciseKind): TrainingVoiceSetTypeV21 {
  if (kind === 'reps' || kind === 'hold' || kind === 'timer' || kind === 'rom') return kind;
  return 'other';
}

function targetSemantics(def: ExerciseDefinition): string {
  if (def.kind === 'reps') return `${def.prescription.repsPerSet ?? 0} reps per set`;
  if (def.kind === 'hold') return `${def.prescription.holdSec ?? 0} sec hold`;
  if (def.kind === 'timer') return `${def.prescription.timerSec ?? 0} sec timed set`;
  if (def.kind === 'rom') return `${def.prescription.captureSec ?? 0} sec ROM capture`;
  return 'other target';
}

function supportFor(def: ExerciseDefinition): string[] {
  const support: string[] = [];
  if (def.equipment.includes('counter')) support.push('counter');
  if (def.equipment.includes('wall')) support.push('wall');
  if (def.equipment.includes('chair')) support.push('chair');
  if (def.equipment.includes('stair')) support.push('stair_or_step');
  return support;
}

function safetyPlanFor(
  exerciseId: string,
  family: TrainingVoiceSafetyFamilyV21,
  absorbedIntoInstruction: boolean,
  absorbedFamilies: readonly TrainingVoiceSafetyFamilyV21[]
): TrainingVoiceSafetyPlanV21 {
  const cueForFamily = absorbedIntoInstruction ? null : SAFETY_CUE_BY_FAMILY[family];
  const fulfilment =
    family === 'none'
      ? 'not_required'
      : absorbedIntoInstruction
        ? 'absorbed_into_exact_instruction'
        : 'separate_family_cue';
  const reasonCodes: TrainingVoiceSafetyPlanV21['reasonCodes'] = absorbedIntoInstruction
    ? ['FAMILY_ABSORBED_IN_EXACT_INSTRUCTION']
    : ['MOST_SPECIFIC_FAMILY_DUE'];
  const sourceSafetyProfile = requireExerciseSafetyCueProfile(exerciseId);
  const sourceSafetyProfileFingerprint = safetyCueSnapshotFingerprint({
    schemaVersion: sourceSafetyProfile.schemaVersion,
    globalCueIds: SESSION_GLOBAL_SAFETY_CUE_IDS,
    exerciseProfiles: [sourceSafetyProfile],
  });
  return Object.freeze({
    version: 1,
    exerciseId,
    family,
    parentFamily: null,
    subsumedFamilies: [],
    absorbedFamilies: absorbedFamilies.slice(),
    fulfilment,
    absorbedIntoInstruction,
    logicalCueKey: cueForFamily?.key ?? null,
    exactScript: cueForFamily?.exactScript ?? null,
    cue: cueForFamily,
    sourceSafetyProfileSchemaVersion: sourceSafetyProfile.schemaVersion,
    sourceSafetyProfileFingerprint,
    sourceSafetyCueIds: unique([
      ...sourceSafetyProfile.setupCueIds,
      ...sourceSafetyProfile.activeCueIds,
      ...sourceSafetyProfile.repeatedSetCueIds,
      ...sourceSafetyProfile.recoveryCueIds,
    ]),
    requiredForVoiceFirst: family !== 'none',
    policyId: 'instruction',
    reasonCodes,
    reactiveSafetyCueIdsDeferred: [],
    ready: true,
  });
}

function progressPlanFor(setType: TrainingVoiceSetTypeV21, value: number | null): TrainingVoiceProgressPlanV21 {
  if (setType === 'reps') {
    return { policy: 'rep_sfx_only', cues: [], optional: false };
  }
  if (setType === 'hold' && value === 15) {
    return { policy: 'hold_15_seconds', cues: [{ atSec: 10, cue: FIVE_SECONDS_LEFT_CUE }], optional: true };
  }
  if (setType === 'hold' && value === 20) {
    return {
      policy: 'hold_20_seconds',
      cues: [
        { atSec: 10, cue: HALFWAY_CUE },
        { atSec: 15, cue: FIVE_SECONDS_LEFT_CUE },
      ],
      optional: true,
    };
  }
  if (setType === 'timer' && value === 30) {
    return {
      policy: 'timer_30_seconds',
      cues: [
        { atSec: 15, cue: HALFWAY_CUE },
        { atSec: 25, cue: FIVE_SECONDS_LEFT_CUE },
      ],
      optional: true,
    };
  }
  if (setType === 'rom') return { policy: 'rom_no_active_progress', cues: [], optional: false };
  return { policy: 'none', cues: [], optional: false };
}

function repeatInstructionKeys(
  firstUseCue: TrainingVoiceLogicalCueV21,
  sidePlan: TrainingVoiceSidePlanV21,
  targetCue: TrainingVoiceLogicalCueV21
): string[] {
  const keys = [firstUseCue.key];
  const defaultVariant = sidePlan.variants.find((variant) => variant.variantId === sidePlan.defaultVariantId);
  if (defaultVariant) keys.push(defaultVariant.cue.key);
  keys.push(targetCue.key);
  return keys;
}

function sourceFilesFor(def: ExerciseDefinition): string[] {
  return [
    'src/exercises/index.ts',
    'src/exercises/ladders.ts',
    SOURCE_FILE_BY_FAMILY[def.family] ?? 'src/exercises/registry.ts',
    'docs/specs/HALE_VOICE_SCRIPT_MANIFEST_V2_1.csv',
    'docs/specs/HALE_VOICE_EXPERIENCE_SPEC_V2_1.md',
  ];
}

function cloneContract(contract: TrainingVoiceExerciseContractV21): TrainingVoiceExerciseContractV21 {
  return {
    ...contract,
    equipment: contract.equipment.slice(),
    support: contract.support.slice(),
    implementationRequirements: contract.implementationRequirements.slice(),
    repeatInstructions: contract.repeatInstructions.slice(),
    sourceFiles: contract.sourceFiles.slice(),
    livePrescription: { ...contract.livePrescription },
  };
}

function isBilateralWithoutSideSchedule(laterality: TrainingVoiceLateralityV21): boolean {
  return (
    laterality === 'bilateral_simultaneous' ||
    laterality === 'alternating_within_set' ||
    laterality === 'bilateral_sequential_within_set' ||
    laterality === 'both_sides_not_scored_separately'
  );
}

function allContractCues(contracts: readonly TrainingVoiceExerciseContractV21[]): TrainingVoiceLogicalCueV21[] {
  return contracts.flatMap((contract) => [
    contract.firstUseCue,
    contract.laterSetCue,
    contract.targetCue,
    ...(contract.sidePlan.switchCue ? [contract.sidePlan.switchCue] : []),
    ...contract.sidePlan.variants.map((variant) => variant.cue),
  ]);
}

function uniqueCues(cues: readonly TrainingVoiceLogicalCueV21[]): TrainingVoiceLogicalCueV21[] {
  const out: TrainingVoiceLogicalCueV21[] = [];
  const seen = new Set<string>();
  for (const cueForContract of cues) {
    if (seen.has(cueForContract.key)) continue;
    seen.add(cueForContract.key);
    out.push(cueForContract);
  }
  return out;
}

function duplicateCueKeysWithDifferentScripts(contracts: readonly TrainingVoiceExerciseContractV21[]): string[] {
  const byKey = new Map<string, string>();
  const duplicateKeys: string[] = [];
  for (const cueForContract of allContractCues(contracts)) {
    const existing = byKey.get(cueForContract.key);
    if (existing === undefined) {
      byKey.set(cueForContract.key, cueForContract.exactScript);
    } else if (existing !== cueForContract.exactScript && !duplicateKeys.includes(cueForContract.key)) {
      duplicateKeys.push(cueForContract.key);
    }
  }
  return duplicateKeys;
}

function duplicates(items: readonly string[]): string[] {
  return items.filter((item, index) => items.indexOf(item) !== index).filter((item, index, arr) => arr.indexOf(item) === index);
}

function unique<T>(items: readonly T[]): T[] {
  const out: T[] = [];
  for (const item of items) {
    if (!out.includes(item)) out.push(item);
  }
  return out;
}
