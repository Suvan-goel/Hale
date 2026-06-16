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
import { EquipmentTag } from '../movements';
import { ExerciseDomain, MeasurementTier, ReleaseStatus } from './types';

export type ExerciseCameraView = 'side' | 'front' | 'side_oblique' | 'not_required';

export interface ExerciseLevel {
  id: string;
  name: string;
  level: number;
  domain: ExerciseDomain;
  releaseStatus: ReleaseStatus;
  measurementTier: MeasurementTier;
  equipment: EquipmentTag[];
  cameraView: ExerciseCameraView;
  instructions: string;
  setupNotes?: string;
  safetyNotes?: string;
  measurementNotes?: string;
  progressionCriteria?: string[];
  regressionCriteria?: string[];
  legacyExerciseIds?: string[];
}

export interface ExerciseLadder {
  id: string;
  title: string;
  domain: ExerciseDomain;
  description: string;
  whyItMatters: string;
  levels: ExerciseLevel[];
  defaultLevelId: string;
  releaseStatus: ReleaseStatus;
  sortOrder: number;
}

export interface ResolvedExerciseLevel {
  ladder: ExerciseLadder;
  level: ExerciseLevel;
}

const STANDARD_PROGRESS = [
  'Complete the prescribed work with low-to-moderate effort.',
  'No pain or safety concern reported.',
  'Set-up and tracking are reliable across recent sessions.',
];

const STANDARD_REGRESS = [
  'Pain, unsafe effort, or repeated balance resets.',
  'Unable to complete the prescribed work.',
  'Tracking or setup is poor enough that the set is not useful.',
];

function level(input: ExerciseLevel): ExerciseLevel {
  return {
    progressionCriteria: STANDARD_PROGRESS,
    regressionCriteria: STANDARD_REGRESS,
    ...input,
    legacyExerciseIds: input.legacyExerciseIds ?? [],
  };
}

export const EXERCISE_LADDERS: readonly ExerciseLadder[] = [
  {
    id: 'sit-to-stand',
    title: 'Sit-to-Stand',
    domain: 'strength_power',
    description: 'Chair-rise strength and power, built from the safest useful version upward.',
    whyItMatters: 'Standing from a chair is one of the clearest everyday signals of lower-body capability.',
    defaultLevelId: STS_STANDARD_ID,
    releaseStatus: 'v1_core',
    sortOrder: 10,
    levels: [
      level({
        id: STS_CUSHION_ID,
        name: 'Cushion Sit-to-Stand',
        level: 0,
        domain: 'strength_power',
        releaseStatus: 'v1_core',
        measurementTier: 'measured',
        equipment: ['chair', 'cushion'],
        cameraView: 'side',
        instructions: 'Sit tall on a chair with a cushion on the seat, feet flat. Stand all the way up, then sit back down with control.',
        setupNotes: 'Use as the easiest regression when chair rise range or effort needs reducing.',
        measurementNotes: 'Counts reps and tracks chair-rise velocity trend in body units, not exact power output.',
        legacyExerciseIds: ['cushion_sit_to_stand'],
      }),
      level({
        id: STS_STANDARD_ID,
        name: 'Sit-to-Stand',
        level: 1,
        domain: 'strength_power',
        releaseStatus: 'v1_core',
        measurementTier: 'measured',
        equipment: ['chair'],
        cameraView: 'side',
        instructions: 'Sit tall in the middle of a chair with your feet flat. Stand all the way up, then sit back down with control.',
        measurementNotes: 'Counts reps and follows relative rise-speed trend.',
        legacyExerciseIds: ['sit_to_stand'],
      }),
      level({
        id: STS_SLOW_ECC_ID,
        name: 'Slow-Lower Sit-to-Stand',
        level: 2,
        domain: 'strength_power',
        releaseStatus: 'v1_core',
        measurementTier: 'measured',
        equipment: ['chair'],
        cameraView: 'side',
        instructions: 'Stand from the chair, then lower back down slowly and steadily before the next rep.',
        measurementNotes: 'Uses the same chair-rise counter; lowering tempo is treated as a broad control cue.',
        legacyExerciseIds: ['slow_lower_sit_to_stand'],
      }),
      level({
        id: STS_POWER_ID,
        name: 'Power Sit-to-Stand',
        level: 3,
        domain: 'strength_power',
        releaseStatus: 'v1_core',
        measurementTier: 'measured',
        equipment: ['chair'],
        cameraView: 'side',
        instructions: 'Sit tall, then drive up briskly to standing and sit back down with control.',
        measurementNotes: 'Tracks relative rise velocity trend only. Hale does not infer exact power output.',
        legacyExerciseIds: ['power_sit_to_stand'],
      }),
      level({
        id: LOADED_STS_ID,
        name: 'Loaded Sit-to-Stand',
        level: 4,
        domain: 'strength_power',
        releaseStatus: 'v1_optional',
        measurementTier: 'measured',
        equipment: ['chair', 'backpack_or_weight'],
        cameraView: 'side',
        instructions: 'Sit tall on a chair with your feet flat. Hold a backpack or weight close to your chest. Stand all the way up, then sit back down with control.',
        setupNotes: 'The user selects load difficulty manually. Hale does not infer load from the camera.',
        measurementNotes: 'Counts reps and tracks relative rise-speed trend.',
        legacyExerciseIds: ['loaded_sit_to_stand'],
      }),
    ],
  },
  {
    id: 'squat',
    title: 'Squat',
    domain: 'strength_power',
    description: 'Lower-body strength and functional hip/knee control.',
    whyItMatters: 'A calm squat progression supports getting down, lifting, gardening, and everyday confidence.',
    defaultLevelId: SQUAT_SUPPORTED_ID,
    releaseStatus: 'v1_core',
    sortOrder: 20,
    levels: [
      level({
        id: SQUAT_SUPPORTED_ID,
        name: 'Supported Squat',
        level: 0,
        domain: 'strength_power',
        releaseStatus: 'v1_core',
        measurementTier: 'measured',
        equipment: ['chair', 'counter'],
        cameraView: 'side',
        instructions: 'Stand with feet about hip width apart, fingertips near a chair or counter. Lower as if to sit, then stand back up.',
        measurementNotes: 'Counts squat cycles. Hale cannot know how much support the user takes through their hands.',
        legacyExerciseIds: ['supported_squat'],
      }),
      level({
        id: SQUAT_FREE_ID,
        name: 'Squat',
        level: 1,
        domain: 'strength_power',
        releaseStatus: 'v1_core',
        measurementTier: 'measured',
        equipment: ['none'],
        cameraView: 'side',
        instructions: 'Stand with feet about hip width apart. Lower as if to sit, then stand back up with control.',
        measurementNotes: 'Counts reps and broad tempo only.',
        legacyExerciseIds: ['squat'],
      }),
      level({
        id: SQUAT_SLOW_ECC_ID,
        name: 'Slow-Lower Squat',
        level: 2,
        domain: 'strength_power',
        releaseStatus: 'v1_optional',
        measurementTier: 'measured',
        equipment: ['none'],
        cameraView: 'side',
        instructions: 'Lower into the squat slowly, then stand back up with control.',
        measurementNotes: 'Uses the existing squat counter; lowering tempo is a broad cue, not a form score.',
        legacyExerciseIds: ['slow_lower_squat'],
      }),
      level({
        id: SQUAT_LOADED_ID,
        name: 'Loaded Squat',
        level: 3,
        domain: 'strength_power',
        releaseStatus: 'v1_optional',
        measurementTier: 'measured',
        equipment: ['backpack_or_weight'],
        cameraView: 'side',
        instructions: 'Hold a backpack or weight close to your chest. Lower into a squat, then stand back up with control.',
        setupNotes: 'The user selects load difficulty manually. Hale does not infer load from the camera.',
        measurementNotes: 'Counts reps and broad tempo only.',
        legacyExerciseIds: ['loaded_squat', 'backpack_squat'],
      }),
      level({
        id: SPLIT_SQUAT_SUPPORTED_ID,
        name: 'Chair-Supported Split Squat',
        level: 4,
        domain: 'strength_power',
        releaseStatus: 'v1_optional',
        measurementTier: 'camera_assisted',
        equipment: ['chair', 'counter'],
        cameraView: 'side',
        instructions: 'Stand in a split stance with fingertips near a chair or counter. Bend both knees slightly to lower under control, then press back up to stand tall.',
        setupNotes: 'Advanced optional progression only; not a beginner default.',
        measurementNotes: 'Counts broad knee-bend cycles without scoring knee position.',
        legacyExerciseIds: ['chair_supported_split_squat'],
      }),
    ],
  },
  {
    id: 'step-up',
    title: 'Step-Up',
    domain: 'strength_power',
    description: 'Stair strength and single-leg confidence.',
    whyItMatters: 'Step-ups practise the same leg power and control used on stairs and kerbs.',
    defaultLevelId: STEP_UP_ID,
    releaseStatus: 'v1_core',
    sortOrder: 30,
    levels: [
      level({
        id: STEP_UP_ID,
        name: 'Step-Up',
        level: 0,
        domain: 'strength_power',
        releaseStatus: 'v1_core',
        measurementTier: 'camera_assisted',
        equipment: ['stair'],
        cameraView: 'side',
        instructions: 'Stand facing your step. Step up with one foot, bring the other to meet it, then step back down leading with the same foot.',
        measurementNotes: 'Counts reps and broad tempo. Hale does not score foot placement or stair height.',
        legacyExerciseIds: ['step_up'],
      }),
    ],
  },
  {
    id: 'heel-toe-raise',
    title: 'Heel & Toe Raises',
    domain: 'strength_power',
    description: 'Calf and ankle work for walking and stair support.',
    whyItMatters: 'Ankles and calves quietly support walking rhythm, balance reactions, and stair confidence.',
    defaultLevelId: HEEL_RAISE_SUPPORTED_ID,
    releaseStatus: 'v1_core',
    sortOrder: 40,
    levels: [
      level({
        id: HEEL_RAISE_SUPPORTED_ID,
        name: 'Supported Heel Raise',
        level: 0,
        domain: 'strength_power',
        releaseStatus: 'v1_core',
        measurementTier: 'camera_assisted',
        equipment: ['wall', 'counter'],
        cameraView: 'side',
        instructions: 'Stand tall with fingertips near a wall or counter. Rise onto the balls of your feet, then lower slowly.',
        measurementNotes: 'Simple count and rhythm only; no precise heel-height scoring.',
        legacyExerciseIds: ['supported_heel_raise'],
      }),
      level({
        id: HEEL_RAISE_FREE_ID,
        name: 'Heel Raise',
        level: 1,
        domain: 'strength_power',
        releaseStatus: 'v1_core',
        measurementTier: 'camera_assisted',
        equipment: ['none'],
        cameraView: 'side',
        instructions: 'Stand tall. Rise onto the balls of your feet, then lower slowly.',
        measurementNotes: 'Simple count and rhythm only.',
        legacyExerciseIds: ['heel_raise'],
      }),
      level({
        id: TOE_RAISE_SUPPORTED_ID,
        name: 'Supported Toe Raise',
        level: 2,
        domain: 'strength_power',
        releaseStatus: 'v1_core',
        measurementTier: 'camera_assisted',
        equipment: ['wall', 'counter'],
        cameraView: 'side',
        instructions: 'Stand tall with fingertips near a wall or counter. Keep your heels on the floor, lift the toes and front of your feet, then lower slowly.',
        measurementNotes: 'Simple timer/count support only; no precise toe-height scoring.',
        legacyExerciseIds: ['supported_toe_raise'],
      }),
    ],
  },
  {
    id: 'push',
    title: 'Push',
    domain: 'strength_power',
    description: 'Upper-body pushing strength with sensible progressions.',
    whyItMatters: 'Pushing strength supports getting up from surfaces and everyday upper-body tasks.',
    defaultLevelId: PUSHUP_WALL_ID,
    releaseStatus: 'v1_core',
    sortOrder: 50,
    levels: [
      level({
        id: PUSHUP_WALL_ID,
        name: 'Wall Push-Up',
        level: 0,
        domain: 'strength_power',
        releaseStatus: 'v1_core',
        measurementTier: 'camera_assisted',
        equipment: ['wall'],
        cameraView: 'side',
        instructions: 'Place your hands shoulder width apart on a wall. Lower in with control, then press back out.',
        legacyExerciseIds: ['wall_push_up'],
      }),
      level({
        id: PUSHUP_INCLINE_ID,
        name: 'Incline Push-Up',
        level: 1,
        domain: 'strength_power',
        releaseStatus: 'v1_core',
        measurementTier: 'camera_assisted',
        equipment: ['chair', 'counter'],
        cameraView: 'side',
        instructions: 'Place your hands shoulder width apart on a chair or counter. Lower in with control, then press back out.',
        legacyExerciseIds: ['incline_push_up'],
      }),
      level({
        id: PUSHUP_STANDARD_ID,
        name: 'Push-Up',
        level: 2,
        domain: 'strength_power',
        releaseStatus: 'v1_optional',
        measurementTier: 'camera_assisted',
        equipment: ['floor'],
        cameraView: 'side',
        instructions: 'Place your hands shoulder width apart on the floor. Lower in with control, then press back up.',
        setupNotes: 'Advanced progression only; not shown as a default beginner exercise.',
        legacyExerciseIds: ['push_up'],
      }),
    ],
  },
  {
    id: 'pull-upper-back',
    title: 'Pull / Upper Back',
    domain: 'strength_power',
    description: 'Band pulling strength for upper-back and shoulder balance.',
    whyItMatters: 'Pulling work balances pushing, supports posture, and helps shoulders stay capable.',
    defaultLevelId: SEATED_BAND_ROW_ID,
    releaseStatus: 'v1_core',
    sortOrder: 60,
    levels: [
      level({
        id: SEATED_BAND_ROW_ID,
        name: 'Seated Band Row',
        level: 0,
        domain: 'strength_power',
        releaseStatus: 'v1_core',
        measurementTier: 'camera_assisted',
        equipment: ['chair', 'long_band'],
        cameraView: 'side_oblique',
        instructions: 'Sit tall on a chair. Loop a band around your feet or a secure low anchor. Pull your elbows back toward your ribs, pause briefly, then return with control.',
        measurementNotes: 'Counts broad elbow cycles and tempo. Hale does not infer band tension.',
        legacyExerciseIds: ['seated_band_row'],
      }),
      level({
        id: STANDING_BAND_ROW_ID,
        name: 'Standing Band Row',
        level: 1,
        domain: 'strength_power',
        releaseStatus: 'v1_core',
        measurementTier: 'camera_assisted',
        equipment: ['long_band', 'door_anchor'],
        cameraView: 'side_oblique',
        instructions: 'Stand tall with the band anchored in front of you. Pull your elbows back toward your ribs, pause briefly, then return with control.',
        measurementNotes: 'Counts broad elbow cycles and tempo. Hale does not score scapular movement.',
        legacyExerciseIds: ['standing_band_row'],
      }),
      level({
        id: BAND_PULL_APART_ID,
        name: 'Band Pull-Apart',
        level: 2,
        domain: 'strength_power',
        releaseStatus: 'v1_core',
        measurementTier: 'camera_assisted',
        equipment: ['long_band'],
        cameraView: 'front',
        instructions: 'Hold a light band at chest height with both hands. Pull the band apart until your hands move wide, then return slowly.',
        measurementNotes: 'Counts broad wrist/arm movement. Hale does not score shoulder-blade motion or band tension.',
        legacyExerciseIds: ['band_pull_apart'],
      }),
    ],
  },
  {
    id: 'hinge-glutes',
    title: 'Hinge & Glutes',
    domain: 'strength_power',
    description: 'Hip hinge control, posterior-chain strength, and back-of-body mobility.',
    whyItMatters: 'A strong hinge supports lifting, reaching down, and getting up with confidence.',
    defaultLevelId: HINGE_WALL_ID,
    releaseStatus: 'v1_core',
    sortOrder: 70,
    levels: [
      level({
        id: HINGE_WALL_ID,
        name: 'Wall-Tap Hinge',
        level: 0,
        domain: 'strength_power',
        releaseStatus: 'v1_core',
        measurementTier: 'measured',
        equipment: ['wall'],
        cameraView: 'side',
        instructions: 'Stand a step in front of a wall, feet under your hips. Push your hips back to tap the wall, keeping your back long, then stand tall.',
        legacyExerciseIds: ['wall_tap_hinge'],
      }),
      level({
        id: HINGE_FREE_ID,
        name: 'Hip Hinge',
        level: 1,
        domain: 'strength_power',
        releaseStatus: 'v1_core',
        measurementTier: 'measured',
        equipment: ['none'],
        cameraView: 'side',
        instructions: 'Stand tall with feet under your hips. Push your hips back, then stand tall again with control.',
        legacyExerciseIds: ['hip_hinge'],
      }),
      level({
        id: BRIDGE_HOLD_ID,
        name: 'Bridge Hold',
        level: 2,
        domain: 'strength_power',
        releaseStatus: 'v1_core',
        measurementTier: 'camera_assisted',
        equipment: ['floor'],
        cameraView: 'side_oblique',
        instructions: 'Lie on your back, knees bent and feet flat. Lift your hips toward the ceiling and hold.',
        measurementNotes: 'Hold duration and rough hip-lift detection only.',
        legacyExerciseIds: ['bridge_hold'],
      }),
      level({
        id: BRIDGE_REPS_ID,
        name: 'Glute Bridge',
        level: 3,
        domain: 'strength_power',
        releaseStatus: 'v1_core',
        measurementTier: 'camera_assisted',
        equipment: ['floor'],
        cameraView: 'side_oblique',
        instructions: 'Lie on your back, knees bent and feet flat. Lift your hips, pause briefly, then lower.',
        measurementNotes: 'Rep count and rough hip-lift detection only.',
        legacyExerciseIds: ['glute_bridge'],
      }),
    ],
  },
  {
    id: 'shoulder-reach-press',
    title: 'Shoulder Reach & Press',
    domain: 'mobility_flexibility',
    description: 'Shoulder mobility and beginner overhead strength.',
    whyItMatters: 'Comfortable overhead reach keeps shelves, cupboards, and daily tasks within reach.',
    defaultLevelId: OVERHEAD_REACH_ID,
    releaseStatus: 'v1_core',
    sortOrder: 80,
    levels: [
      level({
        id: OVERHEAD_REACH_ID,
        name: 'Overhead Reach',
        level: 0,
        domain: 'mobility_flexibility',
        releaseStatus: 'v1_core',
        measurementTier: 'measured',
        equipment: ['none'],
        cameraView: 'side',
        instructions: 'Stand tall. Reach both arms up overhead as far as comfortable, then lower.',
        legacyExerciseIds: ['overhead_reach'],
      }),
      level({
        id: OVERHEAD_PRESS_ID,
        name: 'Band Overhead Press',
        level: 1,
        domain: 'strength_power',
        releaseStatus: 'v1_core',
        measurementTier: 'camera_assisted',
        equipment: ['long_band'],
        cameraView: 'side',
        instructions: 'Stand tall on a long band or hold it safely. Press both hands overhead, then return with control.',
        measurementNotes: 'Counts reps and broad range. Hale does not infer band tension.',
        legacyExerciseIds: ['band_overhead_press'],
      }),
    ],
  },
  {
    id: 'balance',
    title: 'Balance',
    domain: 'balance_stability',
    description: 'Steady holds with support nearby.',
    whyItMatters: 'Small, regular balance challenges help steadiness feel familiar and calm.',
    defaultLevelId: BALANCE_FEET_TOGETHER_ID,
    releaseStatus: 'v1_core',
    sortOrder: 90,
    levels: [
      level({
        id: BALANCE_FEET_TOGETHER_ID,
        name: 'Feet-Together Hold',
        level: 0,
        domain: 'balance_stability',
        releaseStatus: 'v1_core',
        measurementTier: 'measured',
        equipment: ['counter'],
        cameraView: 'front',
        instructions: 'Stand with your feet together, fingertips near a counter, and hold steady.',
        measurementNotes: 'Tracks hold duration and major resets only.',
        legacyExerciseIds: ['feet_together_hold'],
      }),
      level({
        id: BALANCE_TANDEM_ID,
        name: 'Tandem Hold',
        level: 1,
        domain: 'balance_stability',
        releaseStatus: 'v1_core',
        measurementTier: 'measured',
        equipment: ['counter'],
        cameraView: 'front',
        instructions: 'Place one foot directly in front of the other, heel to toe, fingertips near support, and hold steady.',
        measurementNotes: 'Tracks hold duration and major resets only.',
        legacyExerciseIds: ['tandem_hold'],
      }),
      level({
        id: BALANCE_SINGLE_LEG_ID,
        name: 'Single-Leg Hold',
        level: 2,
        domain: 'balance_stability',
        releaseStatus: 'v1_core',
        measurementTier: 'measured',
        equipment: ['counter'],
        cameraView: 'front',
        instructions: 'Stand on one leg, lifting the other foot just off the floor, fingertips near support.',
        measurementNotes: 'Tracks hold duration and major resets; toe taps and support use are treated cautiously.',
        legacyExerciseIds: ['single_leg_hold'],
      }),
    ],
  },
  {
    id: 'lateral-stability',
    title: 'Lateral Stability',
    domain: 'balance_stability',
    description: 'Side-to-side control and dynamic balance.',
    whyItMatters: 'Lateral control supports confident walking, turning, and stepping around obstacles.',
    defaultLevelId: SIDE_STEP_SUPPORTED_ID,
    releaseStatus: 'v1_core',
    sortOrder: 100,
    levels: [
      level({
        id: SIDE_STEP_SUPPORTED_ID,
        name: 'Supported Side Step',
        level: 0,
        domain: 'balance_stability',
        releaseStatus: 'v1_core',
        measurementTier: 'camera_assisted',
        equipment: ['counter'],
        cameraView: 'front',
        instructions: 'Stand tall near a counter. Step one foot out to the side, bring the other foot in, then repeat with control.',
        measurementNotes: 'Timed practice and rhythm support only; no knee-position scoring.',
        legacyExerciseIds: ['supported_side_step'],
      }),
      level({
        id: LATERAL_WALK_MINI_BAND_ID,
        name: 'Mini-Band Lateral Walk',
        level: 1,
        domain: 'balance_stability',
        releaseStatus: 'v1_optional',
        measurementTier: 'camera_assisted',
        equipment: ['mini_band'],
        cameraView: 'front',
        instructions: 'Place a mini band above your knees or around your ankles. Take small controlled side steps, keeping gentle tension on the band.',
        measurementNotes: 'Timed practice and rhythm support only. Hale does not infer band tension.',
        legacyExerciseIds: ['mini_band_lateral_walk'],
      }),
      level({
        id: LOADED_MARCH_ID,
        name: 'March in Place',
        level: 2,
        domain: 'balance_stability',
        releaseStatus: 'v1_core',
        measurementTier: 'camera_assisted',
        equipment: ['none'],
        cameraView: 'side',
        instructions: 'Stand tall and march on the spot, lifting each knee with a steady rhythm.',
        measurementNotes: 'Tracks rhythm and rough knee-height trend only.',
        legacyExerciseIds: ['loaded_march'],
      }),
    ],
  },
  {
    id: 'mobility-flexibility',
    title: 'Mobility / Flexibility',
    domain: 'mobility_flexibility',
    description: 'Simple mobility drills and stretches for daily range.',
    whyItMatters: 'Mobility work keeps reaching, bending, rotating, and walking feeling accessible.',
    defaultLevelId: HAMSTRING_REACH_ID,
    releaseStatus: 'v1_core',
    sortOrder: 110,
    levels: [
      level({
        id: HAMSTRING_REACH_ID,
        name: 'Seated Hamstring Reach',
        level: 0,
        domain: 'mobility_flexibility',
        releaseStatus: 'v1_core',
        measurementTier: 'camera_assisted',
        equipment: ['chair'],
        cameraView: 'side',
        instructions: 'Sit tall on the edge of a chair, one leg straight out with heel on the floor. Reach gently toward your toes and hold.',
        measurementNotes: 'Tracks hold duration and broad reach/trunk-angle trend.',
        legacyExerciseIds: ['hamstring_reach', 'seated_hamstring_reach'],
      }),
      level({
        id: THORACIC_ROTATION_ID,
        name: 'Thoracic Rotation',
        level: 1,
        domain: 'mobility_flexibility',
        releaseStatus: 'v1_core',
        measurementTier: 'camera_assisted',
        equipment: ['chair'],
        cameraView: 'front',
        instructions: 'Sit or stand tall with your arms crossed over your chest. Slowly rotate your upper body to one side, return to centre, then rotate the other way.',
        measurementNotes: 'Broad rotation trend only; not clinical scoring.',
        legacyExerciseIds: ['thoracic_rotation'],
      }),
      level({
        id: HIP_FLEXOR_STRETCH_ID,
        name: 'Supported Hip Flexor Stretch',
        level: 2,
        domain: 'mobility_flexibility',
        releaseStatus: 'v1_core',
        measurementTier: 'voice_guided',
        equipment: ['chair', 'counter'],
        cameraView: 'side',
        instructions: 'Stand in a split stance with fingertips near support. Gently shift forward until you feel a stretch at the front of the back hip. Hold.',
        measurementNotes: 'Timer/completion only.',
        legacyExerciseIds: ['supported_hip_flexor_stretch'],
      }),
      level({
        id: WALL_CALF_STRETCH_ID,
        name: 'Wall Calf Stretch',
        level: 3,
        domain: 'mobility_flexibility',
        releaseStatus: 'v1_core',
        measurementTier: 'voice_guided',
        equipment: ['wall'],
        cameraView: 'side',
        instructions: 'Place your hands on a wall, step one foot back, keep the back heel down, and gently lean forward until you feel a calf stretch. Hold.',
        measurementNotes: 'Timer/completion only.',
        legacyExerciseIds: ['wall_calf_stretch'],
      }),
      level({
        id: NECK_ROTATION_ID,
        name: 'Neck Rotations',
        level: 4,
        domain: 'mobility_flexibility',
        releaseStatus: 'v1_optional',
        measurementTier: 'voice_guided',
        equipment: ['none'],
        cameraView: 'not_required',
        instructions: 'Sit or stand tall. Slowly turn your head to look over one shoulder, then the other.',
        setupNotes: 'Optional warm-up or cooldown only; not a core default V1 exercise.',
        measurementNotes: 'Timer/completion only. Hale does not attempt detailed neck scoring.',
        legacyExerciseIds: ['neck_rotations'],
      }),
    ],
  },
];

const byLadderId = new Map(EXERCISE_LADDERS.map((l) => [l.id, l]));
const byLevelId = new Map<string, ResolvedExerciseLevel>();
const legacyToLevelId = new Map<string, string>();

for (const ladder of EXERCISE_LADDERS) {
  for (const exerciseLevel of ladder.levels) {
    byLevelId.set(exerciseLevel.id, { ladder, level: exerciseLevel });
    legacyToLevelId.set(exerciseLevel.id, exerciseLevel.id);
    for (const legacy of exerciseLevel.legacyExerciseIds ?? []) {
      legacyToLevelId.set(legacy, exerciseLevel.id);
    }
  }
}

export function listExerciseLadders(): ExerciseLadder[] {
  return EXERCISE_LADDERS.slice().sort((a, b) => a.sortOrder - b.sortOrder);
}

export function listVisibleExerciseLadders(includeOptional = true): ExerciseLadder[] {
  const statuses: ReleaseStatus[] = includeOptional ? ['v1_core', 'v1_optional'] : ['v1_core'];
  return listExerciseLadders()
    .filter((ladder) => statuses.includes(ladder.releaseStatus))
    .map((ladder) => ({
      ...ladder,
      levels: ladder.levels.filter((exerciseLevel) => statuses.includes(exerciseLevel.releaseStatus)),
    }))
    .filter((ladder) => ladder.levels.length > 0);
}

export function getExerciseLadder(id: string): ExerciseLadder {
  const ladder = byLadderId.get(id);
  if (!ladder) throw new Error(`unknown exercise ladder '${id}'`);
  return ladder;
}

export function resolveExerciseLevel(id: string): ResolvedExerciseLevel {
  const canonical = legacyToLevelId.get(id);
  if (!canonical) throw new Error(`unknown exercise level '${id}'`);
  const resolved = byLevelId.get(canonical);
  if (!resolved) throw new Error(`exercise level '${canonical}' is not attached to a ladder`);
  return resolved;
}

export function resolveExerciseId(id: string): string {
  return resolveExerciseLevel(id).level.id;
}

export function legacyExerciseAliases(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [legacy, canonical] of legacyToLevelId.entries()) {
    if (legacy !== canonical) out[legacy] = canonical;
  }
  return out;
}
