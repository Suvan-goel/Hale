import type { BodySide } from '../checkup/protocolSetup';
import type {
  MovementProfileV2LiveSnapshot,
  MovementProfileV2LiveTransitionSummary,
} from './liveCoordinator';

export const MOVEMENT_PROFILE_V2_CUE_SCHEMA_VERSION = 1 as const;

export type MovementProfileV2CueTier =
  | 'intro'
  | 'setup'
  | 'countdown_lead_in'
  | 'active_transition'
  | 'rest'
  | 'ready'
  | 'recovery'
  | 'completion';

export type MovementProfileV2CueId =
  | 'mpv2_checkup_intro'
  | 'mpv2_chair_practice_start'
  | 'mpv2_chair_official_ready'
  | 'mpv2_balance_attempt_start'
  | 'mpv2_balance_attempt_saved'
  | 'mpv2_balance_rest'
  | 'mpv2_balance_ready_after_30'
  | 'mpv2_balance_ready_after_60'
  | 'mpv2_balance_use_best'
  | 'mpv2_balance_tracking_retry'
  | 'mpv2_balance_full_hold'
  | 'mpv2_balance_complete'
  | 'mpv2_shoulder_tracking_retry'
  | 'mpv2_hinge_complete'
  | 'mpv2_hinge_no_measurement'
  | 'final-position-set-v21'
  | 'tracking-loss-v21'
  | 'tracking-recovered-v21'
  | 'retry-v21'
  | 'times-up-v21'
  | 'checkup-complete-v21'
  | 'item-complete-v21'
  | 'checkup-chair-stand-intro-v21'
  | 'checkup-chair-stand-setup-v21'
  | 'checkup-balance-intro-v21'
  | 'checkup-balance-single-leg-v21'
  | 'checkup-shoulder-turn-left-v21'
  | 'checkup-shoulder-turn-right-v21'
  | 'checkup-shoulder-raise-left-v21'
  | 'checkup-shoulder-raise-right-v21'
  | 'checkup-hinge-setup-v21';

export interface MovementProfileV2CueDefinition {
  id: MovementProfileV2CueId;
  text: string;
  tier: MovementProfileV2CueTier;
  priority: number;
  voiceRequired: boolean;
  source: 'approved_v21' | 'stage_3d_b_2e_a_1_fallback';
}

export interface MovementProfileV2CueEvent {
  cueEpochId: string;
  transitionKey: string;
  cues: readonly MovementProfileV2CueId[];
  priority: number;
  visibleText: string;
}

export const MOVEMENT_PROFILE_V2_CUE_DEFINITIONS: readonly MovementProfileV2CueDefinition[] = [
  definition('mpv2_checkup_intro', "Welcome to your Movement Check-Up. I'll guide you through each step by voice, so you don't need to touch the phone. Move only when I ask you to, and stop if anything feels unsafe.", 'intro', 60, 'stage_3d_b_2e_a_1_fallback'),
  definition('mpv2_chair_practice_start', "First, let's do one practice stand. This one will not count. Stand up once, then sit back down.", 'setup', 60, 'stage_3d_b_2e_a_1_fallback'),
  definition('mpv2_chair_official_ready', 'Good. Now stay seated and get ready. The 30-second check starts after the countdown. Wait until I say go.', 'countdown_lead_in', 90, 'stage_3d_b_2e_a_1_fallback'),
  definition('mpv2_balance_attempt_start', "Hold your balance for as long as you comfortably can, up to 45 seconds. Keep your support close, and put your foot down whenever you need to. When you're ready, lift your foot high off the floor. The timer starts when I see your foot lift.", 'active_transition', 60, 'stage_3d_b_2e_a_1_fallback'),
  definition('mpv2_balance_attempt_saved', 'Good. That attempt is saved.', 'completion', 70, 'stage_3d_b_2e_a_1_fallback'),
  definition('mpv2_balance_rest', "Rest now. Stand with both feet on the floor. I'll tell you when it's time for the next attempt.", 'rest', 70, 'stage_3d_b_2e_a_1_fallback'),
  definition('mpv2_balance_ready_after_30', "You can start the next attempt now. Keep your support close. When you're ready, lift your foot high off the floor. The timer starts when I see your foot lift.", 'ready', 70, 'stage_3d_b_2e_a_1_fallback'),
  // Currently unreferenced: rest auto-advances at the 30-second minimum, so
  // only the after_30 line plays. Kept (with its bundled audio) because
  // removing a definition changes the cue-policy fingerprint and would force
  // a full mpv2 audio regeneration; drop it on the next real generation run.
  // (The spoken finish-now variant is the PLAIN cue
  // 'checkup-balance-ready-can-finish', swapped in by the voice runtime —
  // same pattern as the retest balance setup lines — precisely so this
  // fingerprint, and the approved takes behind it, stay untouched.)
  definition('mpv2_balance_ready_after_60', "You're ready for the next attempt. Keep your support close. When you're ready, lift your foot high off the floor. The timer starts when I see your foot lift.", 'ready', 70, 'stage_3d_b_2e_a_1_fallback'),
  definition('mpv2_balance_use_best', 'Your best balance hold is saved.', 'completion', 70, 'stage_3d_b_2e_a_1_fallback'),
  definition('mpv2_balance_tracking_retry', "I lost sight of you, so that attempt won't count. Stand facing the phone again with your whole body in view. We'll try once more.", 'recovery', 100, 'stage_3d_b_2e_a_1_fallback'),
  definition('mpv2_balance_full_hold', 'Excellent. You held the full 45 seconds.', 'completion', 70, 'stage_3d_b_2e_a_1_fallback'),
  definition('mpv2_balance_complete', "Balance check complete. Next is your shoulder reach check. I'll ask you to turn so the phone can see one side of your body. Make sure the camera can see your raised hand, shoulder, and hip. Move only when I tell you which side to face, and keep the movement comfortable.", 'completion', 70, 'stage_3d_b_2e_a_1_fallback'),
  definition('mpv2_shoulder_tracking_retry', "I lost sight of your arm, so that attempt won't count. Lower your arm, stand tall side-on to the phone again, and we'll try once more.", 'recovery', 100, 'stage_3d_b_2e_a_1_fallback'),
  definition('mpv2_hinge_complete', 'Stand tall now. Forward reach saved.', 'completion', 70, 'stage_3d_b_2e_a_1_fallback'),
  definition('mpv2_hinge_no_measurement', "Stand tall now. I couldn't get a clear forward reach measurement, but your main Check-Up is saved.", 'completion', 70, 'stage_3d_b_2e_a_1_fallback'),
  definition('final-position-set-v21', "Good. Hold that position and stay still. I'll tell you when to begin.", 'setup', 50, 'approved_v21'),
  definition('tracking-loss-v21', "Pause there. I've lost sight of you, so this part needs to start again. Come back into view and wait for my next instruction.", 'recovery', 100, 'approved_v21'),
  definition('tracking-recovered-v21', "Good, I can see you again. Stay where you are and wait. I'll guide you from here.", 'recovery', 50, 'approved_v21'),
  definition('retry-v21', "That's okay. We'll try that part again. Take a moment, then follow my voice.", 'recovery', 70, 'approved_v21'),
  definition('times-up-v21', 'Time. Stop there and rest.', 'completion', 100, 'approved_v21'),
  definition('checkup-complete-v21', "That's the end of your Movement Check-Up. Well done. Your results are ready on the screen.", 'completion', 70, 'approved_v21'),
  definition('item-complete-v21', "Good. That exercise is done. I'll guide what comes next.", 'completion', 70, 'approved_v21'),
  definition('checkup-chair-stand-intro-v21', "We'll start with the chair stand. Place a sturdy chair so your side faces the phone, and make sure the camera can see your whole body and the chair. Then sit in the middle of the chair with both feet flat on the floor. We'll begin once you're seated.", 'setup', 60, 'approved_v21'),
  definition('checkup-chair-stand-setup-v21', 'Cross your arms over your chest. When I say go, stand all the way up, then sit back down with control. Keep going until I say stop.', 'setup', 60, 'approved_v21'),
  definition('checkup-balance-intro-v21', 'Next is your balance check. Stand facing the phone, with your whole body in view from head to feet. Keep a counter, wall, or sturdy chair close enough that you can touch it if you need to.', 'setup', 60, 'approved_v21'),
  definition('checkup-balance-single-leg-v21', "Start with both feet flat on the floor. Choose the leg that feels safest to stand on today, but keep both feet down for now. We'll begin once you're standing still.", 'setup', 60, 'approved_v21'),
  definition('checkup-shoulder-turn-left-v21', 'Turn so your left side is closest to the phone. Keep your feet still, stand tall, and let your arms rest by your sides.', 'setup', 60, 'approved_v21'),
  definition('checkup-shoulder-turn-right-v21', 'Turn so your right side is closest to the phone. Keep your feet still, stand tall, and let your arms rest by your sides.', 'setup', 60, 'approved_v21'),
  definition('checkup-shoulder-raise-left-v21', 'Now raise your left arm straight forward and up, as high as feels comfortable. Do not push into pain. Hold it there until I tell you to relax.', 'setup', 60, 'approved_v21'),
  definition('checkup-shoulder-raise-right-v21', 'Now raise your right arm straight forward and up, as high as feels comfortable. Do not push into pain. Hold it there until I tell you to relax.', 'setup', 60, 'approved_v21'),
  definition('checkup-hinge-setup-v21', 'Last is your forward reach check. Stay side-on to the phone, with your feet about hip-width apart. Make sure the camera can see from your shoulders down to your feet, including your hands.', 'setup', 60, 'approved_v21'),
] as const;

const DEFINITIONS_BY_ID: Readonly<Record<MovementProfileV2CueId, MovementProfileV2CueDefinition>> =
  MOVEMENT_PROFILE_V2_CUE_DEFINITIONS.reduce((acc, cue) => {
    acc[cue.id] = cue;
    return acc;
  }, {} as Record<MovementProfileV2CueId, MovementProfileV2CueDefinition>);

const CUE_IDS = MOVEMENT_PROFILE_V2_CUE_DEFINITIONS.map((cue) => cue.id);

export const MOVEMENT_PROFILE_V2_CUE_POLICY_FINGERPRINT = movementProfileV2CuePolicyFingerprint();

export function movementProfileV2CueIds(): MovementProfileV2CueId[] {
  return CUE_IDS.slice();
}

export function isMovementProfileV2CueId(value: unknown): value is MovementProfileV2CueId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(DEFINITIONS_BY_ID, value);
}

export function movementProfileV2CueDefinition(id: MovementProfileV2CueId): MovementProfileV2CueDefinition {
  return DEFINITIONS_BY_ID[id];
}

export function movementProfileV2CueText(id: MovementProfileV2CueId): string {
  return movementProfileV2CueDefinition(id).text;
}

export function initialMovementProfileV2VoiceEvent(): MovementProfileV2CueEvent {
  return eventForCues('initial:movement-profile-v2', [
    'mpv2_checkup_intro',
    'checkup-chair-stand-intro-v21',
    'checkup-chair-stand-setup-v21',
  ], 1);
}

export function resolveMovementProfileV2CueIdsForTransition(input: {
  transition: MovementProfileV2LiveTransitionSummary;
  snapshot: MovementProfileV2LiveSnapshot;
}): readonly MovementProfileV2CueId[] {
  const { transition, snapshot } = input;
  switch (transition.to) {
    case 'chair_setup':
      // The frame-check entry is owned by the runtime (it prefixes the
      // non-mpv2 'framing-ready' cue); anything else reaching chair_setup via
      // a transition is a mid-battery handoff (non-default sequences) — bridge
      // generically instead of replaying the whole check-up intro.
      if (transition.from === 'standing_frame_check') return [];
      return [
        ...terminalCuesForPrecedingItem(transition, snapshot),
        // "Good. That exercise is done." must not claim completion when the
        // balance item ended with nothing measured (skipped, retry limit or
        // hard cap without a valid hold) — bridge straight into the chair
        // intro instead.
        ...(precedingItemEndedUnmeasured(transition, snapshot) ? [] : ['item-complete-v21' as const]),
        'checkup-chair-stand-intro-v21',
        'checkup-chair-stand-setup-v21',
      ];
    case 'chair_practice':
      return ['mpv2_chair_practice_start'];
    case 'chair_countdown':
      return ['mpv2_chair_official_ready'];
    case 'balance_setup':
      // "Time. Stop there and rest." belongs to the 30-second chair timer —
      // only speak it when balance actually follows the chair item. In
      // balance-first sequences (Check-up #0) the intro stands alone.
      return transition.from === 'chair_active'
        ? ['times-up-v21', 'checkup-balance-intro-v21', 'checkup-balance-single-leg-v21']
        : ['checkup-balance-intro-v21', 'checkup-balance-single-leg-v21'];
    case 'balance_ready':
      if (transition.reason === 'balance_rest_ready') return ['mpv2_balance_ready_after_30'];
      return ['mpv2_balance_attempt_start'];
    case 'balance_trial':
      return ['mpv2_balance_attempt_start'];
    case 'balance_rest':
      if (transition.reason === 'balance_invalid_trial_retry_rest') return ['mpv2_balance_tracking_retry'];
      return ['mpv2_balance_attempt_saved', 'mpv2_balance_rest'];
    case 'shoulder_setup':
      if (transition.reason === 'balance_user_accepted_best') {
        return ['mpv2_balance_use_best', 'mpv2_balance_complete'];
      }
      if (transition.reason === 'balance_section_complete') {
        return snapshot.diagnostics.balance.ceilingReached
          ? ['mpv2_balance_full_hold', 'mpv2_balance_complete']
          : ['mpv2_balance_complete'];
      }
      return ['mpv2_balance_complete'];
    case 'shoulder_ready':
      return [shoulderTurnCue(snapshot.flow.shoulderSide), shoulderRaiseCue(snapshot.flow.shoulderSide), 'final-position-set-v21'];
    case 'shoulder_active':
      return [];
    case 'shoulder_retry_ready':
      return ['mpv2_shoulder_tracking_retry'];
    case 'hinge_setup':
      return ['item-complete-v21', 'checkup-hinge-setup-v21'];
    case 'hinge_active':
      return [];
    case 'raw_complete':
      // The completion line depends on which item finished LAST — the hinge
      // wording only makes sense when the hinge actually ran (default
      // battery). Chair-last sequences (Check-up #0) end on the 30-second
      // timer; anything else gets the generic item acknowledgement.
      if (transition.from === 'chair_active') {
        return transition.reason === 'chair_deadline'
          ? ['times-up-v21', 'checkup-complete-v21']
          : ['item-complete-v21', 'checkup-complete-v21'];
      }
      if (transition.from === 'hinge_active' || transition.from === 'hinge_setup') {
        return [
          snapshot.diagnostics.hinge.captureValid ? 'mpv2_hinge_complete' : 'mpv2_hinge_no_measurement',
          'checkup-complete-v21',
        ];
      }
      return [
        ...terminalCuesForPrecedingItem(transition, snapshot),
        ...(precedingItemEndedUnmeasured(transition, snapshot) ? [] : ['item-complete-v21' as const]),
        'checkup-complete-v21',
      ];
    default:
      return [];
  }
}

/**
 * True when the item that just handed off recorded no measurement — a balance
 * section that ended by skip, retry limit, or hard cap with no valid hold.
 * The completion acknowledgement ("Good. That exercise is done.") would be a
 * small lie there; callers bridge straight to the next item's intro instead.
 */
function precedingItemEndedUnmeasured(
  transition: MovementProfileV2LiveTransitionSummary,
  snapshot: MovementProfileV2LiveSnapshot
): boolean {
  return transition.from.startsWith('balance_') && typeof snapshot.balanceBestHoldSec !== 'number';
}

/**
 * Result acknowledgement owed by the item that just finished, when its own
 * transition target does not carry one (mid-battery handoffs in non-default
 * sequences). Mirrors the balance acknowledgements the shoulder_setup entry
 * plays in the default battery.
 */
function terminalCuesForPrecedingItem(
  transition: MovementProfileV2LiveTransitionSummary,
  snapshot: MovementProfileV2LiveSnapshot
): readonly MovementProfileV2CueId[] {
  if (transition.reason === 'balance_user_accepted_best') return ['mpv2_balance_use_best'];
  if (transition.reason === 'balance_section_complete' && snapshot.diagnostics.balance.ceilingReached) {
    return ['mpv2_balance_full_hold'];
  }
  return [];
}

function definition(
  id: MovementProfileV2CueId,
  text: string,
  tier: MovementProfileV2CueTier,
  priority: number,
  source: MovementProfileV2CueDefinition['source']
): MovementProfileV2CueDefinition {
  return { id, text, tier, priority, voiceRequired: true, source };
}

function shoulderTurnCue(side: BodySide): MovementProfileV2CueId {
  return side === 'left' ? 'checkup-shoulder-turn-left-v21' : 'checkup-shoulder-turn-right-v21';
}

function shoulderRaiseCue(side: BodySide): MovementProfileV2CueId {
  return side === 'left' ? 'checkup-shoulder-raise-left-v21' : 'checkup-shoulder-raise-right-v21';
}

function eventForCues(
  transitionKeyValue: string,
  cues: readonly MovementProfileV2CueId[],
  epoch: number
): MovementProfileV2CueEvent {
  const priority = Math.max(...cues.map((cue) => movementProfileV2CueDefinition(cue).priority));
  return {
    cueEpochId: `mpv2-cue-${epoch}`,
    transitionKey: transitionKeyValue,
    cues,
    priority,
    visibleText: cues.map(movementProfileV2CueText).join(' '),
  };
}

function movementProfileV2CuePolicyFingerprint(): string {
  const payload = MOVEMENT_PROFILE_V2_CUE_DEFINITIONS
    .map((cue) => `${cue.id}|${cue.text}|${cue.tier}|${cue.priority}|${cue.source}`)
    .join('\n');
  return `mpv2-cue-policy-v${MOVEMENT_PROFILE_V2_CUE_SCHEMA_VERSION}-${fnv1a32(payload)}`;
}

function fnv1a32(value: string): string {
  let hash = 2166136261;
  for (let idx = 0; idx < value.length; idx++) {
    hash ^= value.charCodeAt(idx);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}
