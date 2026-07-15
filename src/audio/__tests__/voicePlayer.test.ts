import { VoiceCueKey } from '../cues';
import { VOICE_DURATION_MANIFEST } from '../manifest';
import {
  resolveVoiceCueAssetFromManifest,
  VOICE_COMPLETION_POLL_INTERVAL_MS,
  VOICE_INFERRED_COMPLETION_MARGIN_MS,
  voiceCompletionWatchdogMs,
  VOICE_START_FALLBACK_PROXY_MS,
  SfxChannel,
  VoiceChannel,
} from '../voicePlayer';
import { MOVEMENT_PROFILE_V2_AUDIO_ASSET_METADATA } from '../movementProfileV2AudioManifest';

const mockCreateAudioPlayer = jest.fn();

jest.mock('expo-audio', () => ({
  createAudioPlayer: (...args: unknown[]) => mockCreateAudioPlayer(...args),
  setAudioModeAsync: jest.fn(),
}));

describe('voice cue asset resolution', () => {
  const safetyCue: VoiceCueKey = 'tracking_pause_and_reset';
  const movementProfileV2Cue: VoiceCueKey = 'mpv2_balance_tracking_retry';

  it('resolves safety cues directly for the selected voice', () => {
    const resolved = resolveVoiceCueAssetFromManifest(
      {
        clara: { [safetyCue]: 101 },
      },
      'clara',
      safetyCue
    );
    expect(resolved).toEqual({ asset: 101, resolvedVoiceId: 'clara', usedFallback: false });
  });

  it('fails closed when the required Clara safety cue is absent', () => {
    expect(() =>
      resolveVoiceCueAssetFromManifest(
        {
          clara: {},
        },
        'clara',
        safetyCue
      )
    ).toThrow(/no bundled required audio/);
  });

  it('fails closed when the required Clara Movement Profile V2 cue is absent', () => {
    expect(() =>
      resolveVoiceCueAssetFromManifest(
        {
          clara: {},
        },
        'clara',
        movementProfileV2Cue
      )
    ).toThrow(/no bundled required audio/);
  });

  it('normalizes retired voice ids to Clara', () => {
    const resolved = resolveVoiceCueAssetFromManifest(
      {
        clara: { [safetyCue]: 101 },
      },
      'retired-voice',
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
    channel.stop();
  });
});

describe('VoiceChannel untracked playback watchdog', () => {
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

  it('recovers a wedged untracked cue so later lines are not silently dropped', () => {
    const channel = new VoiceChannel('clara');
    expect(channel.speak(['training-intro'], 8)).toBe(true);
    expect(channel.busy).toBe(true);

    // Playback ended but didJustFinish never arrived (missed status event).
    players[0].endWithoutFinishEvent();
    jest.advanceTimersByTime(voiceCompletionWatchdogMs(players[0].duration) + 1);

    expect(channel.busy).toBe(false);
    expect(channel.speak(['next-up'], 7)).toBe(true);
    channel.stop();
  });

  it('does not cut short an untracked cue that still reports live playback', () => {
    const channel = new VoiceChannel('clara');
    expect(channel.speak(['training-intro'], 8)).toBe(true);
    players[0].currentTime = 0.1;

    jest.advanceTimersByTime(voiceCompletionWatchdogMs(players[0].duration) + 1);
    expect(channel.busy).toBe(true);

    // Once playback actually stops, the re-armed watchdog recovers the channel.
    players[0].endWithoutFinishEvent();
    jest.advanceTimersByTime(voiceCompletionWatchdogMs(players[0].duration) + 1);
    expect(channel.busy).toBe(false);
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

  it('advances when a player reaches the end without a finish event', async () => {
    const channel = new VoiceChannel('clara');
    const request = channel.speakTracked(['training-intro', 'next-up'], {
      priority: 9,
      required: true,
      scopeId: 'mpv2:no-finish-event',
    });

    players[0].emit({ playing: true });
    players[0].endWithoutFinishEvent();
    jest.advanceTimersByTime(VOICE_COMPLETION_POLL_INTERVAL_MS);
    await flushAsync();

    expect(players).toHaveLength(2);
    players[1].finish();
    await expect(request.completion).resolves.toMatchObject({
      outcome: 'completed',
      completedCueKeys: ['training-intro', 'next-up'],
    });
    expect(channel.busy).toBe(false);
  });

  it('advances Movement Profile V2 cues by bundled duration when native completion status never arrives', async () => {
    const introDurationMs = MOVEMENT_PROFILE_V2_AUDIO_ASSET_METADATA.clara?.mpv2_checkup_intro?.durationMs;
    expect(introDurationMs).toBeGreaterThan(0);
    const nowSpy = jest.spyOn(performance, 'now').mockReturnValue(0);

    try {
      const channel = new VoiceChannel('clara');
      const request = channel.speakTracked(['mpv2_checkup_intro', 'mpv2_chair_practice_start'], {
        priority: 9,
        required: true,
        scopeId: 'mpv2:bundled-duration',
      });

      players[0].duration = 0;
      players[0].emit({ playing: true, duration: 0, currentTime: 0 });
      jest.advanceTimersByTime(VOICE_COMPLETION_POLL_INTERVAL_MS);
      await flushAsync();

      expect(players).toHaveLength(1);
      nowSpy.mockReturnValue(introDurationMs! + VOICE_INFERRED_COMPLETION_MARGIN_MS);
      jest.advanceTimersByTime(VOICE_COMPLETION_POLL_INTERVAL_MS);
      await flushAsync();

      expect(players).toHaveLength(2);
      players[1].finish();
      await expect(request.completion).resolves.toMatchObject({
        outcome: 'completed',
        completedCueKeys: ['mpv2_checkup_intro', 'mpv2_chair_practice_start'],
      });
      expect(channel.busy).toBe(false);
    } finally {
      nowSpy.mockRestore();
    }
  });

  it('advances legacy check-up cues by bundled duration when native completion status never arrives', async () => {
    const hingeSetupDurationMs = VOICE_DURATION_MANIFEST.clara?.['hinge-setup'];
    expect(hingeSetupDurationMs).toBeGreaterThan(0);
    const nowSpy = jest.spyOn(performance, 'now').mockReturnValue(0);

    try {
      const channel = new VoiceChannel('clara');
      const request = channel.speakTracked(['hinge-setup', 'next-up'], {
        priority: 9,
        required: true,
        scopeId: 'mpv2:legacy-duration',
      });

      players[0].duration = 0;
      players[0].emit({ playing: true, duration: 0, currentTime: 0 });
      nowSpy.mockReturnValue(hingeSetupDurationMs! + VOICE_INFERRED_COMPLETION_MARGIN_MS);
      jest.advanceTimersByTime(VOICE_COMPLETION_POLL_INTERVAL_MS);
      await flushAsync();

      expect(players).toHaveLength(2);
      players[1].finish();
      await expect(request.completion).resolves.toMatchObject({
        outcome: 'completed',
        completedCueKeys: ['hinge-setup', 'next-up'],
      });
      expect(channel.busy).toBe(false);
    } finally {
      nowSpy.mockRestore();
    }
  });

  it('keeps legacy speak behavior compatible', () => {
    const channel = new VoiceChannel('clara');
    expect(channel.speak(['training-intro'], 8)).toBe(true);
    expect(channel.speak(['next-up'], 8)).toBe(false);
    expect(channel.busy).toBe(true);
  });
});

describe('SfxChannel', () => {
  let players: FakeAudioPlayer[];

  beforeEach(() => {
    players = [];
    mockCreateAudioPlayer.mockReset();
    mockCreateAudioPlayer.mockImplementation(() => {
      const player = new FakeAudioPlayer();
      players.push(player);
      return player;
    });
  });

  it('caches one rewound player per cue and releases all cue players', () => {
    const channel = new SfxChannel();

    channel.play('rep-credit');
    channel.play('measurement-complete');
    channel.play('rep-credit');

    expect(mockCreateAudioPlayer).toHaveBeenCalledTimes(2);
    expect(players[0].seekTo).toHaveBeenCalledWith(0);
    expect(players[0].seekTo).toHaveBeenCalledTimes(2);
    expect(players[0].play).toHaveBeenCalledTimes(2);
    expect(players[1].seekTo).toHaveBeenCalledWith(0);
    expect(players[1].play).toHaveBeenCalledTimes(1);

    channel.release();

    expect(players[0].remove).toHaveBeenCalledTimes(1);
    expect(players[1].remove).toHaveBeenCalledTimes(1);
  });
});

class FakeAudioPlayer {
  playing = false;
  duration = 0.25;
  currentTime = 0;
  private statusOverride: Partial<FakeAudioStatus> = {};
  play = jest.fn(() => {
    this.playing = true;
    this.statusOverride = {};
  });
  seekTo = jest.fn();
  remove = jest.fn();
  removeAllListeners = jest.fn();
  private listener: ((status: FakeAudioStatus) => void) | null = null;

  get currentStatus(): FakeAudioStatus {
    return {
      playing: this.playing,
      didJustFinish: false,
      duration: this.duration,
      currentTime: this.currentTime,
      ...this.statusOverride,
    };
  }

  addListener = jest.fn((event: string, listener: (status: FakeAudioStatus) => void) => {
    if (event === 'playbackStatusUpdate') this.listener = listener;
    return { remove: jest.fn() };
  });

  emit(status: Partial<FakeAudioStatus>) {
    this.listener?.({
      playing: status.playing ?? this.playing,
      didJustFinish: status.didJustFinish ?? false,
      duration: status.duration ?? this.duration,
      currentTime: status.currentTime ?? this.currentTime,
    });
  }

  endWithoutFinishEvent() {
    this.playing = false;
    this.currentTime = this.duration;
    this.statusOverride = {
      playing: false,
      didJustFinish: true,
      currentTime: this.currentTime,
    };
  }

  finish() {
    this.endWithoutFinishEvent();
    this.emit({ playing: false, didJustFinish: true });
  }
}

interface FakeAudioStatus {
  playing: boolean;
  didJustFinish: boolean;
  duration: number;
  currentTime: number;
}

async function flushAsync(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
