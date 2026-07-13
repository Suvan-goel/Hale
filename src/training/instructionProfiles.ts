import type { VoiceCueKey } from '../audio/cues';
import type { BodySide } from '../checkup';
import {
  ACTIVE_SHOULDER_REACH_V2_ID,
  CHAIR_RISE_V2_ID,
  HINGE_REACH_ID,
  ONE_LEG_BALANCE_V2_ID,
} from '../movements';
import type { MovementProfileV2LiveStage } from '../movementProfileV2/liveCoordinator';

export interface InstructionCueRef {
  readonly cueId: VoiceCueKey;
  readonly cueIds?: readonly VoiceCueKey[];
  readonly text: string;
  readonly estimatedSeconds?: number;
}

export interface CheckUpInstructionProfile {
  readonly kind: 'movement_checkup_protocol';
  readonly protocolId: string;
  readonly schemaVersion: 1;
  readonly displayName: string;
  readonly firstTime: InstructionCueRef;
  readonly repeat: InstructionCueRef;
  readonly help: InstructionCueRef;
  readonly visibleSetupText: string;
  readonly visibleExecutionText: string;
  readonly safetyCueIds: readonly string[];
  readonly recoveryCueIds: readonly VoiceCueKey[];
  readonly releaseStatus: 'controlled_beta';
}

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

export const CONTROLLED_BETA_CHECKUP_PROTOCOL_IDS = Object.freeze([
  CHAIR_RISE_V2_ID,
  ONE_LEG_BALANCE_V2_ID,
  ACTIVE_SHOULDER_REACH_V2_ID,
  HINGE_REACH_ID,
] as const);

export function listCheckUpInstructionProfiles(): CheckUpInstructionProfile[] {
  return CHECKUP_PROFILES.map(cloneCheckupProfile);
}

export function getCheckUpInstructionProfile(
  protocolId: string
): CheckUpInstructionProfile | null {
  const profile = CHECKUP_PROFILE_BY_ID.get(protocolId);
  return profile ? cloneCheckupProfile(profile) : null;
}

export function instructionCueIds(ref: InstructionCueRef): VoiceCueKey[] {
  return (ref.cueIds ?? [ref.cueId]).slice();
}

export function visibleInstructionText(profile: CheckUpInstructionProfile): string {
  return `${profile.visibleSetupText} ${profile.visibleExecutionText}`.trim();
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

function cloneCueRef(ref: InstructionCueRef): InstructionCueRef {
  return {
    ...ref,
    cueIds: ref.cueIds?.slice(),
  };
}
