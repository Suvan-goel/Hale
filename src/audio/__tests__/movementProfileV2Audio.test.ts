import {
  movementProfileV2AudioCueIds,
  movementProfileV2AudioExpectedPath,
  movementProfileV2AudioFingerprint,
} from '../movementProfileV2Audio';

describe('Movement Profile V2 audio metadata helpers', () => {
  it('derives the required cue set from canonical V2 definitions', () => {
    expect(movementProfileV2AudioCueIds()).toContain('mpv2_checkup_intro');
    expect(movementProfileV2AudioCueIds()).toContain('checkup-complete-v21');
    expect(movementProfileV2AudioExpectedPath('clara', 'mpv2_balance_tracking_retry')).toBe(
      'assets/audio/voice/clara/mpv2_balance_tracking_retry.mp3'
    );
  });

  it('fingerprints canonical text, cue policy, voice identity, provider, model, and format', () => {
    const base = movementProfileV2AudioFingerprint({
      cueId: 'mpv2_balance_tracking_retry',
      voiceId: 'clara',
      providerVoiceId: 'voice-a',
    });

    expect(base).toMatch(/^mpv2-audio-v1-/);
    expect(
      movementProfileV2AudioFingerprint({
        cueId: 'mpv2_balance_tracking_retry',
        voiceId: 'clara',
        providerVoiceId: 'voice-b',
      })
    ).not.toBe(base);
    expect(
      movementProfileV2AudioFingerprint({
        cueId: 'mpv2_balance_tracking_retry',
        voiceId: 'clara',
        providerVoiceId: 'voice-a',
        text: 'Tracking changed.',
      })
    ).not.toBe(base);
    expect(
      movementProfileV2AudioFingerprint({
        cueId: 'mpv2_balance_tracking_retry',
        voiceId: 'marcus',
        providerVoiceId: 'voice-a',
      })
    ).not.toBe(base);
  });
});
