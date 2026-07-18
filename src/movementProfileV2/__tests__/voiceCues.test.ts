import type { BodySide } from '../../checkup/protocolSetup';
import type {
  MovementProfileV2LiveSnapshot,
  MovementProfileV2LiveStage,
  MovementProfileV2LiveTransitionSummary,
} from '../liveCoordinator';
import {
  MOVEMENT_PROFILE_V2_CUE_DEFINITIONS,
  MOVEMENT_PROFILE_V2_CUE_POLICY_FINGERPRINT,
  initialMovementProfileV2VoiceEvent,
  movementProfileV2CueDefinition,
  movementProfileV2CueIds,
  resolveMovementProfileV2CueIdsForTransition,
} from '../voiceCues';

describe('Movement Profile V2 voice cues', () => {
  it('defines a unique, fingerprinted cue matrix', () => {
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
  });

  it('provides an initial intro event for cold chair starts', () => {
    const intro = initialMovementProfileV2VoiceEvent();
    expect(intro.cues).toEqual([
      'mpv2_checkup_intro',
      'checkup-chair-stand-intro-v21',
      'checkup-chair-stand-setup-v21',
    ]);
    expect(intro.visibleText).toContain('Welcome to your Movement Check-Up');
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
    ]);
    expect(
      cuesFor('hinge_active', 'raw_complete', 'hinge_capture_complete', {
        hingeCaptureValid: false,
      })
    ).toEqual(['mpv2_hinge_no_measurement', 'checkup-complete-v21']);
  });

  it('keeps the chair-timer "Time." line out of balance-first entries (Check-up #0 sequence)', () => {
    // Default battery: balance follows the 30-second chair timer — times-up leads.
    expect(cuesFor('chair_active', 'balance_setup', 'chair_deadline')).toEqual([
      'times-up-v21',
      'checkup-balance-intro-v21',
      'checkup-balance-single-leg-v21',
    ]);
    // Balance-first: nothing timed preceded — the intro stands alone.
    expect(cuesFor('standing_frame_check', 'balance_setup', 'frame_check_passed')).toEqual([
      'checkup-balance-intro-v21',
      'checkup-balance-single-leg-v21',
    ]);
  });

  it('bridges mid-battery chair entries generically instead of replaying the check-up intro', () => {
    // Check-up #0: balance → chair. The welcome intro must never replay here.
    expect(
      cuesFor('balance_ready', 'chair_setup', 'balance_user_accepted_best', { balanceBestHoldSec: 12 })
    ).toEqual([
      'mpv2_balance_use_best',
      'item-complete-v21',
      'checkup-chair-stand-intro-v21',
      'checkup-chair-stand-setup-v21',
    ]);
    expect(
      cuesFor('balance_trial', 'chair_setup', 'balance_section_complete', {
        balanceCeilingReached: true,
        balanceBestHoldSec: 45,
      })
    ).toEqual([
      'mpv2_balance_full_hold',
      'item-complete-v21',
      'checkup-chair-stand-intro-v21',
      'checkup-chair-stand-setup-v21',
    ]);
    // The frame-check entry stays owned by the runtime (framing-ready prefix).
    expect(cuesFor('standing_frame_check', 'chair_setup', 'frame_check_passed')).toEqual([]);
  });

  it('never claims completion when the balance item ended with nothing measured', () => {
    // Skip, retry limit, and hard cap without a valid hold bridge straight to
    // the chair intro — "Good. That exercise is done." would be a small lie.
    for (const reason of ['balance_skipped_by_user', 'balance_invalid_retry_limit', 'balance_hard_cap']) {
      expect(cuesFor('balance_ready', 'chair_setup', reason)).toEqual([
        'checkup-chair-stand-intro-v21',
        'checkup-chair-stand-setup-v21',
      ]);
    }
    // The same exits WITH a banked hold keep the acknowledgement: a result
    // was measured and recorded, so completion language is honest.
    expect(
      cuesFor('balance_rest', 'chair_setup', 'balance_hard_cap', { balanceBestHoldSec: 9 })
    ).toEqual([
      'item-complete-v21',
      'checkup-chair-stand-intro-v21',
      'checkup-chair-stand-setup-v21',
    ]);
  });

  it('ends chair-last sequences on the timer line, never the hinge wording', () => {
    expect(cuesFor('chair_active', 'raw_complete', 'chair_deadline', { hingeCaptureValid: false })).toEqual([
      'times-up-v21',
      'checkup-complete-v21',
    ]);
    expect(
      cuesFor('chair_active', 'raw_complete', 'chair_tracking_loss_retry_limit', { hingeCaptureValid: false })
    ).toEqual(['item-complete-v21', 'checkup-complete-v21']);
    expect(
      cuesFor('balance_ready', 'raw_complete', 'balance_user_accepted_best', {
        hingeCaptureValid: false,
        balanceBestHoldSec: 12,
      })
    ).toEqual(['mpv2_balance_use_best', 'item-complete-v21', 'checkup-complete-v21']);
  });

  it('keeps balance lift instructions in the final pre-lift cue', () => {
    const liftInstruction =
      "When you're ready, lift your foot high off the floor. The timer starts when I see your foot lift.";

    expect(movementProfileV2CueDefinition('checkup-balance-single-leg-v21').text).toContain(
      'keep both feet down for now'
    );
    expect(movementProfileV2CueDefinition('checkup-balance-single-leg-v21').text).not.toContain(
      'lift your other foot'
    );
    expect(movementProfileV2CueDefinition('mpv2_balance_attempt_start').text).toMatch(
      new RegExp(`${escapeRegExp(liftInstruction)}$`)
    );
    expect(movementProfileV2CueDefinition('mpv2_balance_ready_after_30').text).toMatch(
      new RegExp(`${escapeRegExp(liftInstruction)}$`)
    );
    expect(movementProfileV2CueDefinition('mpv2_balance_ready_after_60').text).toMatch(
      new RegExp(`${escapeRegExp(liftInstruction)}$`)
    );
  });

  it('uses clear guided copy for balance save, rest, retry, and completion cues', () => {
    expect(movementProfileV2CueDefinition('mpv2_balance_attempt_saved').text).toBe(
      'Good. That attempt is saved.'
    );
    expect(movementProfileV2CueDefinition('mpv2_balance_rest').text).toBe(
      "Rest now. Stand with both feet on the floor. I'll tell you when it's time for the next attempt."
    );
    expect(movementProfileV2CueDefinition('mpv2_balance_tracking_retry').text).toBe(
      "I lost sight of you, so that attempt won't count. Stand facing the phone again with your whole body in view. We'll try once more."
    );
    expect(movementProfileV2CueDefinition('mpv2_balance_full_hold').text).toBe(
      'Excellent. You held the full 45 seconds.'
    );
    expect(movementProfileV2CueDefinition('mpv2_balance_complete').text).toBe(
      "Balance check complete. Next is your shoulder reach check. I'll ask you to turn so the phone can see one side of your body. Make sure the camera can see your raised hand, shoulder, and hip. Move only when I tell you which side to face, and keep the movement comfortable."
    );
  });

  it('uses clear guided copy for shoulder setup, reach, and retry cues', () => {
    expect(movementProfileV2CueDefinition('checkup-shoulder-turn-right-v21').text).toBe(
      'Turn so your right side is closest to the phone. Keep your feet still, stand tall, and let your arms rest by your sides.'
    );
    expect(movementProfileV2CueDefinition('checkup-shoulder-turn-left-v21').text).toBe(
      'Turn so your left side is closest to the phone. Keep your feet still, stand tall, and let your arms rest by your sides.'
    );
    expect(movementProfileV2CueDefinition('checkup-shoulder-raise-right-v21').text).toBe(
      'Now raise your right arm straight forward and up, as high as feels comfortable. Do not push into pain. Hold it there until I tell you to relax.'
    );
    expect(movementProfileV2CueDefinition('checkup-shoulder-raise-left-v21').text).toBe(
      'Now raise your left arm straight forward and up, as high as feels comfortable. Do not push into pain. Hold it there until I tell you to relax.'
    );
    expect(movementProfileV2CueDefinition('mpv2_shoulder_tracking_retry').text).toBe(
      "I lost sight of your arm, so that attempt won't count. Lower your arm, stand tall side-on to the phone again, and we'll try once more."
    );
  });

  it('uses human shared recovery and acknowledgement cues', () => {
    expect(movementProfileV2CueDefinition('final-position-set-v21').text).toBe(
      "Good. Hold that position and stay still. I'll tell you when to begin."
    );
    expect(movementProfileV2CueDefinition('tracking-loss-v21').text).toBe(
      "Pause there. I've lost sight of you, so this part needs to start again. Come back into view and wait for my next instruction."
    );
    expect(movementProfileV2CueDefinition('tracking-recovered-v21').text).toBe(
      "Good, I can see you again. Stay where you are and wait. I'll guide you from here."
    );
    expect(movementProfileV2CueDefinition('retry-v21').text).toBe(
      "That's okay. We'll try that part again. Take a moment, then follow my voice."
    );
    expect(movementProfileV2CueDefinition('item-complete-v21').text).toBe(
      "Good. That exercise is done. I'll guide what comes next."
    );
  });

  it('uses clear guided copy for final forward reach setup and completion cues', () => {
    expect(movementProfileV2CueDefinition('checkup-hinge-setup-v21').text).toBe(
      'Last is your forward reach check. Stay side-on to the phone, with your feet about hip-width apart. Make sure the camera can see from your shoulders down to your feet, including your hands.'
    );
    expect(movementProfileV2CueDefinition('mpv2_hinge_complete').text).toBe(
      'Stand tall now. Forward reach saved.'
    );
    expect(movementProfileV2CueDefinition('mpv2_hinge_no_measurement').text).toBe(
      "Stand tall now. I couldn't get a clear forward reach measurement, but your main Check-Up is saved."
    );
    expect(movementProfileV2CueDefinition('checkup-complete-v21').text).toBe(
      "That's the end of your Movement Check-Up. Well done. Your results are ready on the screen."
    );
  });
});

function cuesFor(
  from: MovementProfileV2LiveStage,
  to: MovementProfileV2LiveStage,
  reason: string,
  options: {
    balanceCeilingReached?: boolean;
    balanceBestHoldSec?: number | null;
    hingeCaptureValid?: boolean;
    shoulderSide?: BodySide;
  } = {}
) {
  return resolveMovementProfileV2CueIdsForTransition({
    transition: transition(from, to, reason, 100),
    snapshot: snapshot({
      balanceCeilingReached: options.balanceCeilingReached ?? false,
      balanceBestHoldSec: options.balanceBestHoldSec ?? null,
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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function snapshot({
  lastTransition = null,
  balanceCeilingReached = false,
  balanceBestHoldSec = null,
  hingeCaptureValid = true,
  shoulderSide = 'right',
}: {
  lastTransition?: MovementProfileV2LiveTransitionSummary | null;
  balanceCeilingReached?: boolean;
  balanceBestHoldSec?: number | null;
  hingeCaptureValid?: boolean;
  shoulderSide?: BodySide;
} = {}): MovementProfileV2LiveSnapshot {
  return {
    lastTransition,
    movementEpochId: 'movement-epoch',
    attemptEpochId: 'attempt-epoch',
    balanceBestHoldSec,
    flow: { shoulderSide },
    diagnostics: {
      balance: { ceilingReached: balanceCeilingReached },
      hinge: { captureValid: hingeCaptureValid },
    },
  } as MovementProfileV2LiveSnapshot;
}
