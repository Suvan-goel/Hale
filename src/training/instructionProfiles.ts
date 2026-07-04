import type { VoiceCueKey } from '../audio/cues';
import type { BodySide } from '../checkup';
import {
  ACTIVE_SHOULDER_REACH_V2_ID,
  CHAIR_RISE_V2_ID,
  HINGE_REACH_ID,
  ONE_LEG_BALANCE_V2_ID,
} from '../movements';
import type { ReleaseStatus } from '../exercises';
import type { MovementProfileV2LiveStage } from '../movementProfileV2/liveCoordinator';
import type { MicroCheckType } from './microCheck';
import {
  listTrainingVoiceContractsV21,
} from './voiceV21';
import type { TrainingVoiceExerciseContractV21 } from './voiceV21/types';

export type InstructionProfileKind =
  | 'training_exercise'
  | 'movement_checkup_protocol'
  | 'micro_check';

export type InstructionReleaseStatus =
  | 'controlled_beta'
  | 'hidden_optional'
  | 'internal'
  | ReleaseStatus;

export interface InstructionCueRef {
  readonly cueId: VoiceCueKey;
  readonly cueIds?: readonly VoiceCueKey[];
  readonly text: string;
  readonly estimatedSeconds?: number;
}

export interface BaseInstructionProfile {
  readonly kind: InstructionProfileKind;
  readonly schemaVersion: 1;
  readonly displayName: string;
  readonly firstTime: InstructionCueRef;
  readonly repeat: InstructionCueRef;
  readonly help: InstructionCueRef;
  readonly visibleSetupText: string;
  readonly visibleExecutionText: string;
  readonly safetyCueIds: readonly string[];
  readonly recoveryCueIds: readonly VoiceCueKey[];
  readonly releaseStatus: InstructionReleaseStatus;
}

export interface ExerciseInstructionProfile extends BaseInstructionProfile {
  readonly kind: 'training_exercise';
  readonly exerciseId: string;
}

export interface CheckUpInstructionProfile extends BaseInstructionProfile {
  readonly kind: 'movement_checkup_protocol';
  readonly protocolId: string;
}

export interface MicroCheckInstructionProfile extends BaseInstructionProfile {
  readonly kind: 'micro_check';
  readonly protocolId: MicroCheckType;
}

export type InstructionProfile =
  | ExerciseInstructionProfile
  | CheckUpInstructionProfile
  | MicroCheckInstructionProfile;

const TRAINING_PROFILES = Object.freeze(
  listTrainingVoiceContractsV21().map(trainingProfileForContract)
);

const TRAINING_PROFILE_BY_ID: ReadonlyMap<string, ExerciseInstructionProfile> = new Map(
  TRAINING_PROFILES.map((profile) => [profile.exerciseId, profile])
);

const CHECKUP_PROFILES = Object.freeze([
  checkupProfile({
    protocolId: CHAIR_RISE_V2_ID,
    displayName: 'Chair Stand',
    firstCueIds: ['checkup-chair-stand-intro-v21', 'checkup-chair-stand-setup-v21'],
    repeatCueIds: ['checkup-chair-stand-setup-v21'],
    firstText:
      "We'll start with the chair stand. Place a sturdy chair so your side faces the phone, and make sure the camera can see your whole body and the chair. Then sit in the middle of the chair with both feet flat on the floor. We'll begin once you're seated. Cross your arms over your chest. When I say go, stand all the way up, then sit back down with control. Keep going until I say stop.",
    repeatText:
      'Chair stand again. Cross your arms over your chest. Stand all the way up, then sit back down with control until I say stop.',
    setup: 'Sit in a sturdy chair with your side facing the phone and both feet flat.',
    execution: 'Cross your arms. Stand all the way up, then sit back down with control.',
    safetyCueIds: ['chair_use_sturdy_chair'],
  }),
  checkupProfile({
    protocolId: ONE_LEG_BALANCE_V2_ID,
    displayName: 'Balance',
    firstCueIds: ['checkup-balance-intro-v21', 'checkup-balance-single-leg-v21'],
    repeatCueIds: ['mpv2_balance_attempt_start'],
    firstText:
      "Next is your balance check. Stand facing the phone, with your whole body in view from head to feet. Keep a counter, wall, or sturdy chair close enough that you can touch it if you need to. Start with both feet flat on the floor. Choose the leg that feels safest to stand on today, but keep both feet down for now. We'll begin once you're standing still.",
    repeatText:
      "Balance again. Keep your support close. When you're ready, lift your foot high off the floor. The timer starts when I see your foot lift.",
    setup: 'Stand facing the phone near support, with your whole body in view and both feet on the floor.',
    execution: 'Lift your foot high when prompted, hold steady, and put your foot down whenever you need to.',
    safetyCueIds: ['balance_support_within_reach'],
  }),
  checkupProfile({
    protocolId: ACTIVE_SHOULDER_REACH_V2_ID,
    displayName: 'Shoulder Reach',
    firstCueIds: ['checkup-shoulder-turn-right-v21', 'checkup-shoulder-raise-right-v21'],
    repeatCueIds: ['checkup-shoulder-raise-right-v21'],
    firstText:
      "Next is your shoulder reach check. I'll ask you to turn so the phone can see one side of your body. Make sure the camera can see your raised hand, shoulder, and hip. Move only when I tell you which side to face, and keep the movement comfortable. Turn so your selected side is closest to the phone. Keep your feet still, stand tall, and let your arms rest by your sides. Now raise your selected arm straight forward and up, as high as feels comfortable. Do not push into pain. Hold it there until I tell you to relax.",
    repeatText:
      'Shoulder reach again. Raise your selected arm straight forward and up, as high as feels comfortable. Do not push into pain.',
    setup: 'Turn so your selected side is closest to the phone, with feet still and arms by your sides.',
    execution: 'Raise your selected arm straight forward and up within a comfortable range.',
    safetyCueIds: ['comfortable_range_only'],
  }),
  checkupProfile({
    protocolId: HINGE_REACH_ID,
    displayName: 'Hinge Reach',
    firstCueIds: ['checkup-hinge-setup-v21', 'hinge-setup'],
    repeatCueIds: ['hinge-setup'],
    firstText:
      "Last is your forward reach check. Stay side-on to the phone, with your feet about hip-width apart. Make sure the camera can see from your shoulders down to your feet, including your hands. Stand tall and let your arms hang comfortably. Move slowly, and only go as far as feels comfortable. When you're ready, fold forward from your hips and reach your hands toward the floor. The measurement starts when I see you folded forward. Hold there until I tell you to stand tall.",
    repeatText:
      "Stand tall and let your arms hang comfortably. Move slowly, and only go as far as feels comfortable. When you're ready, fold forward from your hips and reach your hands toward the floor. The measurement starts when I see you folded forward. Hold there until I tell you to stand tall.",
    setup: 'Stand side-on with feet about hip-width apart, hands and feet in view.',
    execution: 'Fold forward from your hips, reach your hands toward the floor, and hold until told to stand tall.',
    safetyCueIds: ['comfortable_range_only'],
  }),
] as const);

const CHECKUP_PROFILE_BY_ID: ReadonlyMap<string, CheckUpInstructionProfile> = new Map(
  CHECKUP_PROFILES.map((profile) => [profile.protocolId, profile])
);

const MICRO_CHECK_PROFILES = Object.freeze([
  microCheckProfile({
    protocolId: 'chair-power',
    displayName: 'Chair Power',
    cueId: 'micro-chair-power-v21',
    text: 'Five quick chair stands. Arms crossed. Stand and sit five times as quickly as safely comfortable.',
    setup: 'Sit tall in a sturdy chair with feet flat.',
    execution: 'Cross your arms. Stand and sit five times.',
    safetyCueIds: ['chair_use_sturdy_chair'],
  }),
  microCheckProfile({
    protocolId: 'single-leg-balance',
    displayName: 'Single-Leg Balance',
    cueId: 'micro-single-leg-left-v21',
    text: 'Quick balance check. Stand on your selected leg with support nearby. Hold as long as comfortable.',
    setup: 'Stand near support on your selected leg.',
    execution: 'Lift the other foot and hold steady.',
    safetyCueIds: ['balance_support_within_reach'],
  }),
  microCheckProfile({
    protocolId: 'mobility-reach',
    displayName: 'Mobility Reach',
    cueId: 'micro-mobility-left-v21',
    text: 'Quick mobility check. Stand side-on, hinge forward, and reach toward the floor until I say stand tall.',
    setup: 'Stand side-on with feet under your hips.',
    execution: 'Hinge forward and reach toward the floor.',
    safetyCueIds: ['comfortable_range_only'],
  }),
] as const);

const MICRO_CHECK_PROFILE_BY_ID: ReadonlyMap<MicroCheckType, MicroCheckInstructionProfile> = new Map(
  MICRO_CHECK_PROFILES.map((profile) => [profile.protocolId, profile])
);

export const CONTROLLED_BETA_CHECKUP_PROTOCOL_IDS = Object.freeze([
  CHAIR_RISE_V2_ID,
  ONE_LEG_BALANCE_V2_ID,
  ACTIVE_SHOULDER_REACH_V2_ID,
  HINGE_REACH_ID,
] as const);

export const CONTROLLED_BETA_MICRO_CHECK_TYPES = Object.freeze([
  'chair-power',
  'single-leg-balance',
  'mobility-reach',
] as const satisfies readonly MicroCheckType[]);

export function listTrainingInstructionProfiles(): ExerciseInstructionProfile[] {
  return TRAINING_PROFILES.map(cloneExerciseProfile);
}

export function getTrainingInstructionProfile(
  exerciseId: string
): ExerciseInstructionProfile | null {
  const profile = TRAINING_PROFILE_BY_ID.get(exerciseId);
  return profile ? cloneExerciseProfile(profile) : null;
}

export function listCheckUpInstructionProfiles(): CheckUpInstructionProfile[] {
  return CHECKUP_PROFILES.map(cloneCheckupProfile);
}

export function getCheckUpInstructionProfile(
  protocolId: string
): CheckUpInstructionProfile | null {
  const profile = CHECKUP_PROFILE_BY_ID.get(protocolId);
  return profile ? cloneCheckupProfile(profile) : null;
}

export function listMicroCheckInstructionProfiles(): MicroCheckInstructionProfile[] {
  return MICRO_CHECK_PROFILES.map(cloneMicroCheckProfile);
}

export function getMicroCheckInstructionProfile(
  protocolId: MicroCheckType,
  selectedSide: BodySide | null = null
): MicroCheckInstructionProfile | null {
  const profile = MICRO_CHECK_PROFILE_BY_ID.get(protocolId);
  if (!profile) return null;
  const cueId = microCheckInstructionCueId(protocolId, selectedSide);
  return {
    ...cloneMicroCheckProfile(profile),
    firstTime: { ...profile.firstTime, cueId, cueIds: [cueId] },
    repeat: { ...profile.repeat, cueId, cueIds: [cueId] },
    help: { ...profile.help, cueId, cueIds: [cueId] },
  };
}

export function instructionCueIds(ref: InstructionCueRef): VoiceCueKey[] {
  return (ref.cueIds ?? [ref.cueId]).slice();
}

export function visibleInstructionText(profile: BaseInstructionProfile): string {
  return `${profile.visibleSetupText} ${profile.visibleExecutionText}`.trim();
}

export function trainingHelpCueIdsForExercise(exerciseId: string): VoiceCueKey[] {
  const profile = getTrainingInstructionProfile(exerciseId);
  return profile ? instructionCueIds(profile.help) : [];
}

export function movementProfileV2InstructionProfileForStage(
  stage: MovementProfileV2LiveStage,
  selectedShoulder: BodySide = 'right'
): CheckUpInstructionProfile | null {
  const profile = getCheckUpInstructionProfile(protocolIdForMovementProfileV2Stage(stage));
  if (!profile) return null;
  if (profile.protocolId !== ACTIVE_SHOULDER_REACH_V2_ID) return profile;
  const turnCue: VoiceCueKey =
    selectedShoulder === 'left' ? 'checkup-shoulder-turn-left-v21' : 'checkup-shoulder-turn-right-v21';
  const raiseCue: VoiceCueKey =
    selectedShoulder === 'left' ? 'checkup-shoulder-raise-left-v21' : 'checkup-shoulder-raise-right-v21';
  return {
    ...profile,
    firstTime: { ...profile.firstTime, cueId: turnCue, cueIds: [turnCue, raiseCue] },
    repeat: { ...profile.repeat, cueId: raiseCue, cueIds: [raiseCue] },
    help: { ...profile.help, cueId: turnCue, cueIds: [turnCue, raiseCue] },
  };
}

export function movementProfileV2InstructionCueIdsForStage(input: {
  readonly stage: MovementProfileV2LiveStage;
  readonly selectedShoulder?: BodySide;
  readonly repeatedAttempt?: boolean;
}): VoiceCueKey[] {
  const profile = movementProfileV2InstructionProfileForStage(input.stage, input.selectedShoulder ?? 'right');
  if (!profile) return [];
  return instructionCueIds(input.repeatedAttempt ? profile.repeat : profile.help);
}

export function movementProfileV2InstructionTextForStage(
  stage: MovementProfileV2LiveStage,
  selectedShoulder: BodySide = 'right'
): string | null {
  const profile = movementProfileV2InstructionProfileForStage(stage, selectedShoulder);
  return profile ? visibleInstructionText(profile) : null;
}

export function protocolIdForMovementProfileV2Stage(stage: MovementProfileV2LiveStage): string {
  switch (stage) {
    // The standing frame check precedes the chair item; its Help content is
    // the chair intro, which opens with the framing directions.
    case 'standing_frame_check':
    case 'chair_setup':
    case 'chair_practice':
    case 'chair_countdown':
    case 'chair_active':
      return CHAIR_RISE_V2_ID;
    case 'balance_setup':
    case 'balance_ready':
    case 'balance_trial':
    case 'balance_rest':
      return ONE_LEG_BALANCE_V2_ID;
    case 'shoulder_setup':
    case 'shoulder_ready':
    case 'shoulder_active':
    case 'shoulder_retry_ready':
      return ACTIVE_SHOULDER_REACH_V2_ID;
    case 'hinge_setup':
    case 'hinge_active':
    case 'raw_complete':
      return HINGE_REACH_ID;
  }
}

function trainingProfileForContract(
  contract: TrainingVoiceExerciseContractV21
): ExerciseInstructionProfile {
  return {
    kind: 'training_exercise',
    exerciseId: contract.exerciseId,
    schemaVersion: 1,
    displayName: contract.displayName,
    firstTime: cueRef(contract.firstUseCue.key as VoiceCueKey, contract.firstUseCue.exactScript),
    repeat: cueRef(contract.laterSetCue.key as VoiceCueKey, contract.laterSetCue.exactScript),
    help: cueRef(contract.firstUseCue.key as VoiceCueKey, contract.firstUseCue.exactScript),
    visibleSetupText: contract.firstUseCue.exactScript,
    visibleExecutionText: contract.targetPlan.visibleText || contract.targetPlan.spokenText,
    safetyCueIds: contract.safetyPlan.sourceSafetyCueIds.slice(),
    recoveryCueIds: ['tracking-loss-v21', 'tracking-recovered-v21'],
    releaseStatus: contract.releaseStatus,
  };
}

function checkupProfile(input: {
  readonly protocolId: string;
  readonly displayName: string;
  readonly firstCueIds: readonly VoiceCueKey[];
  readonly repeatCueIds: readonly VoiceCueKey[];
  readonly firstText: string;
  readonly repeatText: string;
  readonly setup: string;
  readonly execution: string;
  readonly safetyCueIds: readonly string[];
}): CheckUpInstructionProfile {
  return {
    kind: 'movement_checkup_protocol',
    protocolId: input.protocolId,
    schemaVersion: 1,
    displayName: input.displayName,
    firstTime: cueRef(input.firstCueIds[0], input.firstText, input.firstCueIds),
    repeat: cueRef(input.repeatCueIds[0], input.repeatText, input.repeatCueIds),
    help: cueRef(input.firstCueIds[0], input.firstText, input.firstCueIds),
    visibleSetupText: input.setup,
    visibleExecutionText: input.execution,
    safetyCueIds: input.safetyCueIds.slice(),
    recoveryCueIds: ['tracking-loss-v21', 'tracking-recovered-v21'],
    releaseStatus: 'controlled_beta',
  };
}

function microCheckProfile(input: {
  readonly protocolId: MicroCheckType;
  readonly displayName: string;
  readonly cueId: VoiceCueKey;
  readonly text: string;
  readonly setup: string;
  readonly execution: string;
  readonly safetyCueIds: readonly string[];
}): MicroCheckInstructionProfile {
  return {
    kind: 'micro_check',
    protocolId: input.protocolId,
    schemaVersion: 1,
    displayName: input.displayName,
    firstTime: cueRef(input.cueId, input.text),
    repeat: cueRef(input.cueId, input.text),
    help: cueRef(input.cueId, input.text),
    visibleSetupText: input.setup,
    visibleExecutionText: input.execution,
    safetyCueIds: input.safetyCueIds.slice(),
    recoveryCueIds: ['tracking-loss-v21', 'tracking-recovered-v21'],
    releaseStatus: 'controlled_beta',
  };
}

function microCheckInstructionCueId(
  protocolId: MicroCheckType,
  selectedSide: BodySide | null
): VoiceCueKey {
  if (protocolId === 'single-leg-balance') {
    return selectedSide === 'right' ? 'micro-single-leg-right-v21' : 'micro-single-leg-left-v21';
  }
  if (protocolId === 'mobility-reach') return 'micro-mobility-left-v21';
  return 'micro-chair-power-v21';
}

function cueRef(
  cueId: VoiceCueKey,
  text: string,
  cueIds: readonly VoiceCueKey[] = [cueId]
): InstructionCueRef {
  return {
    cueId,
    cueIds: cueIds.slice(),
    text,
    estimatedSeconds: estimateSpokenSeconds(text),
  };
}

function estimateSpokenSeconds(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 2.7));
}

function cloneExerciseProfile(profile: ExerciseInstructionProfile): ExerciseInstructionProfile {
  return {
    ...profile,
    firstTime: cloneCueRef(profile.firstTime),
    repeat: cloneCueRef(profile.repeat),
    help: cloneCueRef(profile.help),
    safetyCueIds: profile.safetyCueIds.slice(),
    recoveryCueIds: profile.recoveryCueIds.slice(),
  };
}

function cloneCheckupProfile(profile: CheckUpInstructionProfile): CheckUpInstructionProfile {
  return {
    ...profile,
    firstTime: cloneCueRef(profile.firstTime),
    repeat: cloneCueRef(profile.repeat),
    help: cloneCueRef(profile.help),
    safetyCueIds: profile.safetyCueIds.slice(),
    recoveryCueIds: profile.recoveryCueIds.slice(),
  };
}

function cloneMicroCheckProfile(profile: MicroCheckInstructionProfile): MicroCheckInstructionProfile {
  return {
    ...profile,
    firstTime: cloneCueRef(profile.firstTime),
    repeat: cloneCueRef(profile.repeat),
    help: cloneCueRef(profile.help),
    safetyCueIds: profile.safetyCueIds.slice(),
    recoveryCueIds: profile.recoveryCueIds.slice(),
  };
}

function cloneCueRef(ref: InstructionCueRef): InstructionCueRef {
  return {
    ...ref,
    cueIds: ref.cueIds?.slice(),
  };
}
