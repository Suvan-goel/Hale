import {
  AUDIO_OUTPUT_FORMAT,
  ELEVENLABS_MODEL,
  safetyAudioCueIds,
  safetyAudioExpectedPath,
  safetyAudioFingerprint,
} from '../safetyAudio';

describe('safety audio metadata helpers', () => {
  it('derives the required safety cue set from canonical definitions', () => {
    expect(safetyAudioCueIds()).toHaveLength(44);
    expect(safetyAudioCueIds()).toContain('global_stop_sharp_or_increasing_pain');
    expect(safetyAudioCueIds()).toContain('tracking_pause_and_reset');
    expect(safetyAudioExpectedPath('clara', 'tracking_pause_and_reset')).toBe(
      'assets/audio/voice/clara/tracking_pause_and_reset.mp3'
    );
  });

  it('fingerprints canonical text, voice identity, provider, model, and format', () => {
    const base = safetyAudioFingerprint({
      cueId: 'tracking_pause_and_reset',
      voiceId: 'clara',
      providerVoiceId: 'voice-a',
    });
    expect(base).toMatch(/^safety-audio-v1-/);
    expect(ELEVENLABS_MODEL).toBe('eleven_flash_v2_5');
    expect(AUDIO_OUTPUT_FORMAT).toBe('mp3_44100_128');
    expect(
      safetyAudioFingerprint({
        cueId: 'tracking_pause_and_reset',
        voiceId: 'clara',
        providerVoiceId: 'voice-b',
      })
    ).not.toBe(base);
    expect(
      safetyAudioFingerprint({
        cueId: 'tracking_pause_and_reset',
        voiceId: 'clara',
        providerVoiceId: 'voice-a',
        text: 'Tracking changed.',
      })
    ).not.toBe(base);
    expect(
      safetyAudioFingerprint({
        cueId: 'tracking_pause_and_reset',
        voiceId: 'marcus',
        providerVoiceId: 'voice-a',
      })
    ).not.toBe(base);
  });
});
