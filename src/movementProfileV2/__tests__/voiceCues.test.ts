import type { BodySide } from '../../checkup/protocolSetup';
import type {
  MovementProfileV2LiveSnapshot,
  MovementProfileV2LiveStage,
  MovementProfileV2LiveTransitionSummary,
} from '../liveCoordinator';
import {
  MOVEMENT_PROFILE_V2_CUE_DEFINITIONS,
  MOVEMENT_PROFILE_V2_CUE_POLICY_FINGERPRINT,
  MovementProfileV2VoiceSequencer,
  initialMovementProfileV2VoiceEvent,
  movementProfileV2CueDefinition,
  movementProfileV2CueIds,
  movementProfileV2VisibleCueForStage,
  resolveMovementProfileV2CueIdsForTransition,
} from '../voiceCues';

const STAGES: readonly MovementProfileV2LiveStage[] = [
  'chair_setup',
  'chair_practice',
  'chair_countdown',
  'chair_active',
  'balance_setup',
  'balance_ready',
  'balance_trial',
  'balance_rest',
  'shoulder_setup',
  'shoulder_ready',
  'shoulder_active',
  'shoulder_retry_ready',
  'hinge_setup',
  'hinge_active',
  'raw_complete',
];

describe('Movement Profile V2 voice cues', () => {
  it('defines a unique, fingerprinted cue matrix with visible copy for every live stage', () => {
    const ids = movementProfileV2CueIds();

    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(MOVEMENT_PROFILE_V2_CUE_DEFINITIONS.length);
    expect(MOVEMENT_PROFILE_V2_CUE_POLICY_FINGERPRINT).toMatch(/^mpv2-cue-policy-v1-/);
    for (const cueId of ids) {
      expect(movementProfileV2CueDefinition(cueId)).toMatchObject({
        id: cueId,
        voiceRequired: true,
      });
    }
    for (const stage of STAGES) {
      expect(movementProfileV2VisibleCueForStage(stage).text.length).toBeGreaterThan(0);
    }
    expect(movementProfileV2VisibleCueForStage('shoulder_setup', 'left').id).toBe(
      'checkup-shoulder-turn-left-v21'
    );
  });

  it('provides an initial intro event and suppresses duplicate transition events', () => {
    const intro = initialMovementProfileV2VoiceEvent();
    expect(intro.cues).toEqual([
      'mpv2_checkup_intro',
      'checkup-chair-stand-intro-v21',
      'checkup-chair-stand-setup-v21',
    ]);
    expect(intro.visibleText).toContain('Movement Profile Check-Up');

    const sequencer = new MovementProfileV2VoiceSequencer();
    const live = snapshot({
      lastTransition: transition('chair_setup', 'chair_practice', 'chair_setup_confirmed', 100),
    });

    expect(sequencer.next(live)?.cues).toEqual(['mpv2_chair_practice_start']);
    expect(sequencer.next(live)).toBeNull();
  });

  it('maps balance, shoulder, and final transitions to canonical V2 cue chains', () => {
    expect(cuesFor('balance_trial', 'balance_rest', 'balance_invalid_trial_retry_rest')).toEqual([
      'mpv2_balance_tracking_retry',
    ]);
    expect(cuesFor('balance_trial', 'balance_rest', 'balance_touchdown')).toEqual([
      'mpv2_balance_attempt_saved',
      'mpv2_balance_rest',
    ]);
    expect(cuesFor('balance_rest', 'balance_ready', 'balance_rest_ready')).toEqual([
      'mpv2_balance_ready_after_30',
    ]);
    expect(cuesFor('balance_rest', 'balance_ready', 'balance_default_rest_elapsed')).toEqual([
      'mpv2_balance_ready_after_60',
    ]);
    expect(
      cuesFor('balance_trial', 'shoulder_setup', 'balance_section_complete', {
        balanceCeilingReached: true,
      })
    ).toEqual(['mpv2_balance_full_hold', 'mpv2_balance_complete']);
    expect(
      cuesFor('shoulder_setup', 'shoulder_ready', 'shoulder_setup_confirmed', {
        shoulderSide: 'left',
      })
    ).toEqual([
      'checkup-shoulder-turn-left-v21',
      'checkup-shoulder-raise-left-v21',
      'final-position-set-v21',
    ]);
    expect(cuesFor('shoulder_retry_ready', 'hinge_setup', 'shoulder_capture_complete')).toEqual([
      'item-complete-v21',
      'checkup-hinge-setup-v21',
      'final-position-set-v21',
    ]);
    expect(
      cuesFor('hinge_active', 'raw_complete', 'hinge_capture_complete', {
        hingeCaptureValid: false,
      })
    ).toEqual(['mpv2_hinge_no_measurement', 'checkup-complete-v21']);
  });
});

function cuesFor(
  from: MovementProfileV2LiveStage,
  to: MovementProfileV2LiveStage,
  reason: string,
  options: {
    balanceCeilingReached?: boolean;
    hingeCaptureValid?: boolean;
    shoulderSide?: BodySide;
  } = {}
) {
  return resolveMovementProfileV2CueIdsForTransition({
    transition: transition(from, to, reason, 100),
    snapshot: snapshot({
      balanceCeilingReached: options.balanceCeilingReached ?? false,
      hingeCaptureValid: options.hingeCaptureValid ?? true,
      shoulderSide: options.shoulderSide ?? 'right',
    }),
  });
}

function transition(
  from: MovementProfileV2LiveStage,
  to: MovementProfileV2LiveStage,
  reason: string,
  atMs: number
): MovementProfileV2LiveTransitionSummary {
  return { atMs, from, to, reason };
}

function snapshot({
  lastTransition = null,
  balanceCeilingReached = false,
  hingeCaptureValid = true,
  shoulderSide = 'right',
}: {
  lastTransition?: MovementProfileV2LiveTransitionSummary | null;
  balanceCeilingReached?: boolean;
  hingeCaptureValid?: boolean;
  shoulderSide?: BodySide;
} = {}): MovementProfileV2LiveSnapshot {
  return {
    lastTransition,
    movementEpochId: 'movement-epoch',
    attemptEpochId: 'attempt-epoch',
    flow: { shoulderSide },
    diagnostics: {
      balance: { ceilingReached: balanceCeilingReached },
      hinge: { captureValid: hingeCaptureValid },
    },
  } as MovementProfileV2LiveSnapshot;
}
