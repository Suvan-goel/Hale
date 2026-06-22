import { VoiceCueKey } from '../cues';
import { resolveVoiceCueAssetFromManifest, VoiceChannel } from '../voicePlayer';

const mockCreateAudioPlayer = jest.fn();

jest.mock('expo-audio', () => ({
  createAudioPlayer: (...args: unknown[]) => mockCreateAudioPlayer(...args),
  setAudioModeAsync: jest.fn(),
}));

describe('voice cue asset resolution', () => {
  const safetyCue: VoiceCueKey = 'tracking_pause_and_reset';
  const normalCue: VoiceCueKey = 'training-intro';

  it('resolves safety cues directly for the selected voice', () => {
    const resolved = resolveVoiceCueAssetFromManifest(
      {
        clara: { [safetyCue]: 101 },
        marcus: { [safetyCue]: 202 },
      },
      'marcus',
      safetyCue
    );
    expect(resolved).toEqual({ asset: 202, resolvedVoiceId: 'marcus', usedFallback: false });
  });

  it('does not silently cross-fallback safety cues between supported voices', () => {
    expect(() =>
      resolveVoiceCueAssetFromManifest(
        {
          clara: { [safetyCue]: 101 },
          marcus: {},
        },
        'marcus',
        safetyCue
      )
    ).toThrow(/no bundled safety audio/);
  });

  it('keeps the historical default fallback for non-safety cues', () => {
    const resolved = resolveVoiceCueAssetFromManifest(
      {
        clara: { [normalCue]: 101 },
        marcus: {},
      },
      'marcus',
      normalCue
    );
    expect(resolved).toEqual({ asset: 101, resolvedVoiceId: 'clara', usedFallback: true });
  });

  it('normalizes malformed voice ids through the existing default voice policy', () => {
    const resolved = resolveVoiceCueAssetFromManifest(
      {
        clara: { [safetyCue]: 101 },
      },
      'not-a-voice',
      safetyCue
    );
    expect(resolved).toEqual({ asset: 101, resolvedVoiceId: 'clara', usedFallback: false });
  });
});

describe('VoiceChannel playback failure handling', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    mockCreateAudioPlayer.mockReset();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('does not crash or stay busy when a bundled asset is unavailable', () => {
    const channel = new VoiceChannel('clara');
    expect(channel.speak(['tracking_pause_and_reset'], 10)).toBe(false);
    expect(channel.busy).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith('[audio] skipped voice cue', {
      cue: 'tracking_pause_and_reset',
      reason: 'missing_bundled_asset',
    });
  });

  it('does not crash or stay busy when playback start fails', () => {
    mockCreateAudioPlayer.mockReturnValue({
      addListener: jest.fn(),
      removeAllListeners: jest.fn(),
      remove: jest.fn(),
      play: jest.fn(() => {
        throw new Error('audio unavailable');
      }),
    });

    const channel = new VoiceChannel('clara');
    expect(channel.speak(['training-intro'], 9)).toBe(false);
    expect(channel.busy).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith('[audio] skipped voice cue', {
      cue: 'training-intro',
      reason: 'playback_start_failed',
    });
  });
});
