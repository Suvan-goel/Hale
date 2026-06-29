import type { BodySide } from '../checkup/protocolSetup';
import type {
  MovementProfileV2LiveSnapshot,
  MovementProfileV2LiveStage,
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
  definition('mpv2_checkup_intro', 'Movement Profile Check-Up. I will guide each capture and save what the camera can measure.', 'intro', 60, 'stage_3d_b_2e_a_1_fallback'),
  definition('mpv2_chair_practice_start', 'Try one practice stand. This one will not count.', 'setup', 60, 'stage_3d_b_2e_a_1_fallback'),
  definition('mpv2_chair_official_ready', 'Sit back down. The 30-second check starts after the countdown.', 'countdown_lead_in', 90, 'stage_3d_b_2e_a_1_fallback'),
  definition('mpv2_balance_attempt_start', "When you're ready, stand on your selected leg, bend your other knee, and keep the lifted foot clear of the floor. This attempt can last up to 45 seconds.", 'active_transition', 60, 'stage_3d_b_2e_a_1_fallback'),
  definition('mpv2_balance_attempt_saved', 'That attempt is saved.', 'completion', 70, 'stage_3d_b_2e_a_1_fallback'),
  definition('mpv2_balance_rest', 'Rest now. You can start again after 30 seconds, or use your best result.', 'rest', 70, 'stage_3d_b_2e_a_1_fallback'),
  definition('mpv2_balance_ready_after_30', "You can start the next attempt when you're ready.", 'ready', 70, 'stage_3d_b_2e_a_1_fallback'),
  definition('mpv2_balance_ready_after_60', "You're ready for the next attempt.", 'ready', 70, 'stage_3d_b_2e_a_1_fallback'),
  definition('mpv2_balance_use_best', 'Your best hold is saved.', 'completion', 70, 'stage_3d_b_2e_a_1_fallback'),
  definition('mpv2_balance_tracking_retry', "Tracking was interrupted, so this attempt will not count. Return to the setup position and we'll try again.", 'recovery', 100, 'stage_3d_b_2e_a_1_fallback'),
  definition('mpv2_balance_full_hold', 'You completed the full 45-second hold.', 'completion', 70, 'stage_3d_b_2e_a_1_fallback'),
  definition('mpv2_balance_complete', 'Balance check complete.', 'completion', 70, 'stage_3d_b_2e_a_1_fallback'),
  definition('mpv2_shoulder_tracking_retry', "Tracking was interrupted. Lower your arm, return to the setup position, and we'll try once more.", 'recovery', 100, 'stage_3d_b_2e_a_1_fallback'),
  definition('mpv2_hinge_complete', 'Forward reach saved.', 'completion', 70, 'stage_3d_b_2e_a_1_fallback'),
  definition('mpv2_hinge_no_measurement', 'Forward reach was not measured. Your main Check-Up is saved.', 'completion', 70, 'stage_3d_b_2e_a_1_fallback'),
  definition('final-position-set-v21', "You're set.", 'setup', 50, 'approved_v21'),
  definition('tracking-loss-v21', 'Pause. Return to the setup position.', 'recovery', 100, 'approved_v21'),
  definition('tracking-recovered-v21', "You're back in position. We'll restart.", 'recovery', 50, 'approved_v21'),
  definition('retry-v21', "Let's try that again.", 'recovery', 70, 'approved_v21'),
  definition('times-up-v21', 'Time.', 'completion', 100, 'approved_v21'),
  definition('checkup-complete-v21', 'Check-up complete. Your results are ready.', 'completion', 70, 'approved_v21'),
  definition('item-complete-v21', 'Complete.', 'completion', 70, 'approved_v21'),
  definition('checkup-chair-stand-intro-v21', 'Chair stand. Sit in the middle of a sturdy chair, side-on to the phone.', 'setup', 60, 'approved_v21'),
  definition('checkup-chair-stand-setup-v21', 'Cross your arms. When I say go, stand fully and sit with control until I say time.', 'setup', 60, 'approved_v21'),
  definition('checkup-balance-intro-v21', 'Balance check. Keep support within easy reach. I will guide each stance.', 'setup', 60, 'approved_v21'),
  definition('checkup-balance-single-leg-v21', 'Single-leg balance. Stand tall with both feet on the floor and keep support within easy reach.', 'setup', 60, 'approved_v21'),
  definition('checkup-shoulder-turn-left-v21', 'Turn so your left side is nearest the phone.', 'setup', 60, 'approved_v21'),
  definition('checkup-shoulder-turn-right-v21', 'Turn so your right side is nearest the phone.', 'setup', 60, 'approved_v21'),
  definition('checkup-shoulder-raise-left-v21', 'Raise your left arm as high as comfortable. Hold there until I say relax.', 'setup', 60, 'approved_v21'),
  definition('checkup-shoulder-raise-right-v21', 'Raise your right arm as high as comfortable. Hold there until I say relax.', 'setup', 60, 'approved_v21'),
  definition('checkup-hinge-setup-v21', 'Slowly fold from your hips and reach toward the floor. Hold there until I say stand tall.', 'setup', 60, 'approved_v21'),
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

export function movementProfileV2VisibleCueForStage(
  stage: MovementProfileV2LiveStage,
  selectedShoulder: BodySide = 'right'
): MovementProfileV2CueDefinition {
  switch (stage) {
    case 'chair_setup':
      return movementProfileV2CueDefinition('checkup-chair-stand-intro-v21');
    case 'chair_practice':
      return movementProfileV2CueDefinition('mpv2_chair_practice_start');
    case 'chair_countdown':
      return movementProfileV2CueDefinition('mpv2_chair_official_ready');
    case 'chair_active':
      return movementProfileV2CueDefinition('checkup-chair-stand-setup-v21');
    case 'balance_setup':
      return movementProfileV2CueDefinition('checkup-balance-intro-v21');
    case 'balance_ready':
    case 'balance_trial':
      return movementProfileV2CueDefinition('mpv2_balance_attempt_start');
    case 'balance_rest':
      return movementProfileV2CueDefinition('mpv2_balance_rest');
    case 'shoulder_setup':
      return movementProfileV2CueDefinition(shoulderTurnCue(selectedShoulder));
    case 'shoulder_ready':
    case 'shoulder_active':
      return movementProfileV2CueDefinition(shoulderRaiseCue(selectedShoulder));
    case 'shoulder_retry_ready':
      return movementProfileV2CueDefinition('mpv2_shoulder_tracking_retry');
    case 'hinge_setup':
    case 'hinge_active':
      return movementProfileV2CueDefinition('checkup-hinge-setup-v21');
    case 'raw_complete':
      return movementProfileV2CueDefinition('checkup-complete-v21');
  }
}

export function initialMovementProfileV2VoiceEvent(): MovementProfileV2CueEvent {
  return eventForCues('initial:movement-profile-v2', [
    'mpv2_checkup_intro',
    'checkup-chair-stand-intro-v21',
    'checkup-chair-stand-setup-v21',
  ], 1);
}

export class MovementProfileV2VoiceSequencer {
  private readonly emittedTransitionKeys = new Set<string>();
  private cueEpochCounter = 0;
  private disposed = false;

  next(snapshot: MovementProfileV2LiveSnapshot): MovementProfileV2CueEvent | null {
    if (this.disposed) return null;
    const transition = snapshot.lastTransition;
    if (!transition) return null;
    const cues = resolveMovementProfileV2CueIdsForTransition({
      transition,
      snapshot,
    });
    if (cues.length === 0) return null;
    const key = transitionKey(snapshot, transition);
    if (this.emittedTransitionKeys.has(key)) return null;
    this.emittedTransitionKeys.add(key);
    return eventForCues(key, cues, ++this.cueEpochCounter);
  }

  dispose(): void {
    this.disposed = true;
    this.emittedTransitionKeys.clear();
  }
}

export function resolveMovementProfileV2CueIdsForTransition(input: {
  transition: MovementProfileV2LiveTransitionSummary;
  snapshot: MovementProfileV2LiveSnapshot;
}): readonly MovementProfileV2CueId[] {
  const { transition, snapshot } = input;
  switch (transition.to) {
    case 'chair_practice':
      return ['mpv2_chair_practice_start'];
    case 'chair_countdown':
      return ['mpv2_chair_official_ready'];
    case 'balance_setup':
      return ['times-up-v21', 'checkup-balance-intro-v21', 'checkup-balance-single-leg-v21'];
    case 'balance_ready':
      if (transition.reason === 'balance_default_rest_elapsed') return ['mpv2_balance_ready_after_60'];
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
      return ['item-complete-v21', 'checkup-hinge-setup-v21', 'final-position-set-v21'];
    case 'hinge_active':
      return [];
    case 'raw_complete':
      return [
        snapshot.diagnostics.hinge.captureValid ? 'mpv2_hinge_complete' : 'mpv2_hinge_no_measurement',
        'checkup-complete-v21',
      ];
    default:
      return [];
  }
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

function transitionKey(
  snapshot: MovementProfileV2LiveSnapshot,
  transition: MovementProfileV2LiveTransitionSummary
): string {
  return [
    transition.atMs,
    transition.from,
    transition.to,
    transition.reason,
    snapshot.movementEpochId,
    snapshot.attemptEpochId ?? 'no-attempt',
  ].join(':');
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
