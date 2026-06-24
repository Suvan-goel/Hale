import { VoiceCueKey } from '../cues';
import {
  resolveVoiceCueAssetFromManifest,
  voiceCompletionWatchdogMs,
  VOICE_START_FALLBACK_PROXY_MS,
  VoiceChannel,
} from '../voicePlayer';

const mockCreateAudioPlayer = jest.fn();

jest.mock('expo-audio', () => ({
  createAudioPlayer: (...args: unknown[]) => mockCreateAudioPlayer(...args),
  setAudioModeAsync: jest.fn(),
}));

describe('voice cue asset resolution', () => {
  const safetyCue: VoiceCueKey = 'tracking_pause_and_reset';
  const movementProfileV2Cue: VoiceCueKey = 'mpv2_balance_tracking_retry';
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
    ).toThrow(/no bundled required audio/);
  });

  it('does not silently cross-fallback Movement Profile V2 cues between supported voices', () => {
    expect(() =>
      resolveVoiceCueAssetFromManifest(
        {
          clara: { [movementProfileV2Cue]: 101 },
          marcus: {},
        },
        'marcus',
        movementProfileV2Cue
      )
    ).toThrow(/no bundled required audio/);
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

  it('drops lower-priority cues while busy and allows higher-priority interruption', () => {
    const removeAllListeners = jest.fn();
    const remove = jest.fn();
    mockCreateAudioPlayer.mockReturnValue({
      addListener: jest.fn(),
      removeAllListeners,
      remove,
      play: jest.fn(),
    });

    const channel = new VoiceChannel('clara');
    expect(channel.speak(['training-intro'], 8)).toBe(true);
    expect(channel.speak(['next-up'], 7)).toBe(false);
    expect(channel.busy).toBe(true);

    expect(channel.speak(['mpv2_balance_tracking_retry'], 100)).toBe(true);
    expect(removeAllListeners).toHaveBeenCalledWith('playbackStatusUpdate');
    expect(remove).toHaveBeenCalled();
    expect(channel.busy).toBe(true);
  });
});

describe('VoiceChannel tracked playback', () => {
  let warnSpy: jest.SpyInstance;
  let players: FakeAudioPlayer[];

  beforeEach(() => {
    jest.useFakeTimers();
    players = [];
    mockCreateAudioPlayer.mockReset();
    mockCreateAudioPlayer.mockImplementation(() => {
      const player = new FakeAudioPlayer();
      players.push(player);
      return player;
    });
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
    jest.useRealTimers();
  });

  it('completes a required tracked sequence and emits cue-start events once per cue', async () => {
    const channel = new VoiceChannel('clara');
    const started: string[] = [];

    const request = channel.speakTracked(['training-intro', 'next-up'], {
      priority: 9,
      required: true,
      scopeId: 'mpv2:test',
      onCueStarted: (event) => started.push(`${event.cueIndex}:${event.cueKey}:${event.startEvidence}`),
    });

    expect(request.accepted).toBe(true);
    players[0].emit({ playing: true });
    players[0].finish();
    players[1].emit({ playing: true });
    players[1].finish();

    await expect(request.completion).resolves.toMatchObject({
      outcome: 'completed',
      accepted: true,
      required: true,
      scopeId: 'mpv2:test',
      startedCueKeys: ['training-intro', 'next-up'],
      completedCueKeys: ['training-intro', 'next-up'],
    });
    expect(started).toEqual([
      '0:training-intro:native_playing_status',
      '1:next-up:native_playing_status',
    ]);
    expect(channel.busy).toBe(false);
  });

  it('uses a fallback start proxy if no playing status arrives', async () => {
    mockCreateAudioPlayer.mockImplementationOnce(() => {
      const player = new FakeAudioPlayer();
      player.play = jest.fn();
      players.push(player);
      return player;
    });
    const channel = new VoiceChannel('clara');
    const started: string[] = [];
    const request = channel.speakTracked(['training-intro'], {
      priority: 9,
      required: true,
      scopeId: 'mpv2:fallback',
      onCueStarted: (event) => started.push(event.startEvidence),
    });

    jest.advanceTimersByTime(VOICE_START_FALLBACK_PROXY_MS);
    players[0].finish();

    await expect(request.completion).resolves.toMatchObject({
      outcome: 'completed',
      startedCueKeys: ['training-intro'],
    });
    expect(started).toEqual(['fallback_proxy']);
  });

  it('resolves lower/equal priority tracked requests as dropped_busy', async () => {
    const channel = new VoiceChannel('clara');
    const first = channel.speakTracked(['training-intro'], {
      priority: 8,
      required: true,
      scopeId: 'mpv2:first',
    });

    const lower = channel.speakTracked(['next-up'], {
      priority: 7,
      required: true,
      scopeId: 'mpv2:lower',
    });
    const equal = channel.speakTracked(['next-up'], {
      priority: 8,
      required: true,
      scopeId: 'mpv2:equal',
    });

    await expect(lower.completion).resolves.toMatchObject({ outcome: 'dropped_busy', accepted: false });
    await expect(equal.completion).resolves.toMatchObject({ outcome: 'dropped_busy', accepted: false });
    players[0].finish();
    await expect(first.completion).resolves.toMatchObject({ outcome: 'completed' });
  });

  it('resolves interrupted and cancelled tracked requests exactly once', async () => {
    const channel = new VoiceChannel('clara');
    const first = channel.speakTracked(['training-intro'], {
      priority: 8,
      required: true,
      scopeId: 'mpv2:first',
    });
    const second = channel.speakTracked(['mpv2_balance_tracking_retry'], {
      priority: 100,
      required: true,
      scopeId: 'mpv2:second',
    });

    await expect(first.completion).resolves.toMatchObject({ outcome: 'interrupted' });
    expect(second.accepted).toBe(true);
    channel.cancelScope('mpv2:second', 'stage_changed');
    await expect(second.completion).resolves.toMatchObject({
      outcome: 'cancelled',
      cancelReason: 'stage_changed',
    });
    players[1].finish();
    await expect(second.completion).resolves.toMatchObject({ outcome: 'cancelled' });
  });

  it('fails closed for missing required audio and does not continue pending cues', async () => {
    const channel = new VoiceChannel('clara');
    const request = channel.speakTracked(['num-999', 'training-intro'], {
      priority: 10,
      required: true,
      scopeId: 'mpv2:missing',
    });

    await expect(request.completion).resolves.toMatchObject({
      outcome: 'asset_missing',
      failedCueKey: 'num-999',
      completedCueKeys: [],
    });
    expect(players).toHaveLength(0);
    expect(channel.busy).toBe(false);
  });

  it('lets optional missing audio skip to the next cue', async () => {
    const channel = new VoiceChannel('clara');
    const request = channel.speakTracked(['num-999', 'training-intro'], {
      priority: 10,
      required: false,
      scopeId: 'optional',
    });

    expect(players).toHaveLength(1);
    players[0].finish();
    await expect(request.completion).resolves.toMatchObject({
      outcome: 'completed',
      failedCueKey: 'num-999',
      completedCueKeys: ['training-intro'],
    });
  });

  it('classifies resolver, player-creation, and playback-start failures for required requests', async () => {
    const resolverFailure = new VoiceChannel('clara').speakTracked(['num-999'], {
      priority: 9,
      required: true,
      scopeId: 'resolver',
    });
    await expect(resolverFailure.completion).resolves.toMatchObject({ outcome: 'asset_missing' });

    mockCreateAudioPlayer.mockImplementationOnce(() => {
      throw new Error('native constructor failed');
    });
    const creationFailure = new VoiceChannel('clara').speakTracked(['training-intro'], {
      priority: 9,
      required: true,
      scopeId: 'creation',
    });
    await expect(creationFailure.completion).resolves.toMatchObject({
      outcome: 'player_creation_failed',
      failedCueKey: 'training-intro',
    });

    mockCreateAudioPlayer.mockImplementationOnce(() => {
      const player = new FakeAudioPlayer();
      player.play = jest.fn(() => {
        throw new Error('play failed');
      });
      players.push(player);
      return player;
    });
    const startFailure = new VoiceChannel('clara').speakTracked(['training-intro'], {
      priority: 9,
      required: true,
      scopeId: 'start',
    });
    await expect(startFailure.completion).resolves.toMatchObject({
      outcome: 'playback_start_failed',
      failedCueKey: 'training-intro',
    });
  });

  it('watchdog timeouts clear busy state and ignore late callbacks', async () => {
    mockCreateAudioPlayer.mockImplementationOnce(() => {
      const player = new FakeAudioPlayer();
      player.duration = 0.1;
      players.push(player);
      return player;
    });
    const channel = new VoiceChannel('clara');
    const request = channel.speakTracked(['training-intro'], {
      priority: 9,
      required: true,
      scopeId: 'timeout',
    });

    jest.advanceTimersByTime(voiceCompletionWatchdogMs(0.1));
    await expect(request.completion).resolves.toMatchObject({
      outcome: 'completion_timeout',
      failedCueKey: 'training-intro',
    });
    expect(channel.busy).toBe(false);

    players[0].finish();
    await expect(request.completion).resolves.toMatchObject({ outcome: 'completion_timeout' });
  });

  it('keeps legacy speak behavior compatible', () => {
    const channel = new VoiceChannel('clara');
    expect(channel.speak(['training-intro'], 8)).toBe(true);
    expect(channel.speak(['next-up'], 8)).toBe(false);
    expect(channel.busy).toBe(true);
  });
});

class FakeAudioPlayer {
  playing = false;
  duration = 0.25;
  play = jest.fn(() => {
    this.playing = true;
  });
  remove = jest.fn();
  removeAllListeners = jest.fn();
  private listener: ((status: { playing?: boolean; didJustFinish?: boolean; duration?: number }) => void) | null = null;

  addListener = jest.fn((event: string, listener: (status: { playing?: boolean; didJustFinish?: boolean; duration?: number }) => void) => {
    if (event === 'playbackStatusUpdate') this.listener = listener;
    return { remove: jest.fn() };
  });

  emit(status: { playing?: boolean; didJustFinish?: boolean; duration?: number }) {
    this.listener?.({
      playing: status.playing ?? this.playing,
      didJustFinish: status.didJustFinish ?? false,
      duration: status.duration ?? this.duration,
    });
  }

  finish() {
    this.playing = false;
    this.emit({ playing: false, didJustFinish: true });
  }
}
