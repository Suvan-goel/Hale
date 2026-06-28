import { VoiceChannel } from '../../audio/voicePlayer';
import type { MovementProfileV2LiveSnapshot, MovementProfileV2LiveStage } from '../liveCoordinator';
import {
  MovementProfileV2VoiceRuntime,
  type MovementProfileV2VoiceCoordinatorAction,
} from '../voiceRuntime';

const mockCreateAudioPlayer = jest.fn();
let runtimeActions: { action: MovementProfileV2VoiceCoordinatorAction; atMs: number }[] = [];

jest.mock('expo-audio', () => ({
  createAudioPlayer: (...args: unknown[]) => mockCreateAudioPlayer(...args),
  setAudioModeAsync: jest.fn(),
}));

describe('MovementProfileV2VoiceRuntime', () => {
  let players: FakeAudioPlayer[];
  beforeEach(() => {
    jest.useFakeTimers();
    players = [];
    runtimeActions = [];
    mockCreateAudioPlayer.mockReset();
    mockCreateAudioPlayer.mockImplementation(() => {
      const player = new FakeAudioPlayer();
      players.push(player);
      return player;
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('plays official-ready, then three/two/one/go on a one-second cadence and starts chair from go playback-start', async () => {
    const runtime = createRuntime();
    runtime.sync(snapshot('chair_countdown'));

    expect(players).toHaveLength(1);
    players[0].finish();
    await flushAsync();

    expect(runtimeActions.map((entry) => entry.action.type)).toEqual([
      'chair_official_ready_voice_completed',
      'chair_countdown_started',
    ]);
    expect(players).toHaveLength(2);
    players[1].finish();
    await flushAsync();

    jest.advanceTimersByTime(999);
    await flushAsync();
    expect(players).toHaveLength(2);
    jest.advanceTimersByTime(1);
    await flushAsync();
    expect(players).toHaveLength(3);
    players[2].finish();
    await flushAsync();

    jest.advanceTimersByTime(1000);
    await flushAsync();
    expect(players).toHaveLength(4);
    players[3].finish();
    await flushAsync();

    jest.advanceTimersByTime(1000);
    await flushAsync();
    expect(players).toHaveLength(5);
    expect(runtimeActions.map((entry) => entry.action.type)).toEqual([
      'chair_official_ready_voice_completed',
      'chair_countdown_started',
      'chair_go_playback_started',
    ]);
    expect(runtime.state.blocking).toBe(false);
  });

  it('blocks the chair attempt when go playback cannot start', async () => {
    mockCreateAudioPlayer.mockImplementation(() => {
      if (mockCreateAudioPlayer.mock.calls.length === 5) {
        throw new Error('go player failed');
      }
      const player = new FakeAudioPlayer();
      players.push(player);
      return player;
    });
    const runtime = createRuntime();
    runtime.sync(snapshot('chair_countdown'));

    for (let index = 0; index < 4; index++) {
      players[index].finish();
      await flushAsync();
      jest.advanceTimersByTime(1000);
      await flushAsync();
    }

    expect(runtimeActions.map((entry) => entry.action.type)).not.toContain('chair_go_playback_started');
    expect(runtime.state.lastFailure).toMatchObject({
      outcome: 'player_creation_failed',
      cueKey: 'go',
    });
  });

  it('does not let stale cancelled countdown callbacks start a new stage', async () => {
    const runtime = createRuntime();
    runtime.sync(snapshot('chair_countdown'));
    players[0].finish();
    await flushAsync();
    runtime.cancel('stage_changed');

    players.slice().forEach((player) => player.finish());
    jest.advanceTimersByTime(5000);
    await flushAsync();

    expect(runtimeActions.map((entry) => entry.action.type)).toEqual([
      'chair_official_ready_voice_completed',
      'chair_countdown_started',
    ]);
    expect(runtime.state.activeScopeId).toBeNull();
  });

  it('guards user actions while blocking and after required failure', async () => {
    mockCreateAudioPlayer.mockImplementationOnce(() => {
      throw new Error('intro failed');
    });
    const runtime = createRuntime();
    const chairSetup = snapshot('chair_setup');
    runtime.sync(chairSetup);
    await flushAsync();

    expect(runtime.canDispatchAction({ type: 'confirm_chair_setup' }, chairSetup)).toBe(false);
    expect(runtime.state.lastFailure).toMatchObject({ outcome: 'player_creation_failed' });
    expect(runtime.canDispatchAction({ type: 'backgrounded' }, chairSetup)).toBe(true);
  });

  it('marks raw completion ready only after completion narration finishes', async () => {
    const runtime = createRuntime();
    runtime.sync(snapshot('raw_complete'));
    expect(runtime.state.completionReady).toBe(false);
    players[0].finish();
    await flushAsync();
    players[1].finish();
    await flushAsync();
    expect(runtime.state.completionReady).toBe(true);
  });

  it('plays one recovery loss cue before the required chair restart sequence', async () => {
    const runtime = createRuntime();
    runtime.sync(snapshot('chair_countdown', {
      recoveryEpisode: recoveryEpisode('chair', 'chair_active', 'chair_countdown'),
    }));

    for (let index = 0; index < 4; index++) {
      players[index].finish();
      await flushAsync();
    }

    expect(runtimeActions.map((entry) => entry.action.type)).toEqual([
      'recovery_voice_completed',
      'chair_official_ready_voice_completed',
      'chair_countdown_started',
    ]);
    expect(runtime.state.diagnostics.filter((entry) => entry.cueKey === 'tracking-loss-v21')).toHaveLength(1);
    expect(runtime.state.diagnostics.some((entry) => entry.cueKey === 'tracking-recovered-v21')).toBe(true);
  });

  it('switches mounted voices immediately at safe boundaries and ignores old callbacks', async () => {
    const createdVoiceIds: string[] = [];
    const runtime = createRuntime({
      voiceId: 'clara',
      createVoiceChannel: (id) => {
        createdVoiceIds.push(id);
        return new VoiceChannel(id);
      },
    });
    const setup = snapshot('chair_setup');
    runtime.sync(setup);
    expect(createdVoiceIds).toEqual(['clara']);
    expect(players).toHaveLength(1);

    runtime.setDesiredVoiceId('marcus', setup);
    expect(createdVoiceIds).toEqual(['clara', 'marcus']);
    expect(runtime.state).toMatchObject({
      desiredVoiceId: 'marcus',
      activeVoiceId: 'marcus',
      pendingVoiceId: null,
    });

    players[0].finish();
    await flushAsync();
    expect(runtimeActions).toEqual([]);
    expect(runtime.state.diagnostics.some((entry) => entry.event === 'voice_change_applied_immediately')).toBe(true);
  });

  it('defers mounted voice switching during active measurement until the next safe boundary', () => {
    const createdVoiceIds: string[] = [];
    const runtime = createRuntime({
      voiceId: 'clara',
      createVoiceChannel: (id) => {
        createdVoiceIds.push(id);
        return new VoiceChannel(id);
      },
    });

    runtime.setDesiredVoiceId('marcus', snapshot('chair_active'));
    expect(createdVoiceIds).toEqual(['clara']);
    expect(runtime.state).toMatchObject({
      desiredVoiceId: 'marcus',
      activeVoiceId: 'clara',
      pendingVoiceId: 'marcus',
    });

    runtime.setDesiredVoiceId('clara', snapshot('chair_active'));
    expect(runtime.state.pendingVoiceId).toBeNull();

    runtime.setDesiredVoiceId('marcus', snapshot('chair_active'));
    runtime.sync(snapshot('balance_setup'));
    expect(createdVoiceIds).toEqual(['clara', 'marcus']);
    expect(runtime.state).toMatchObject({
      desiredVoiceId: 'marcus',
      activeVoiceId: 'marcus',
      pendingVoiceId: null,
    });
  });

  it('replays the current movement instruction for Help without advancing the coordinator', () => {
    const runtime = createRuntime();
    const accepted = runtime.replayInstruction(snapshot('shoulder_ready'));

    expect(accepted).toBe(true);
    expect(players).toHaveLength(1);
    expect(runtimeActions).toEqual([]);
    expect(runtime.state.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'instruction_replay_accepted',
          cueKey: 'checkup-shoulder-turn-right-v21',
        }),
      ])
    );
  });
});

function createRuntime(options: {
  voiceId?: string;
  createVoiceChannel?: (voiceId: string) => VoiceChannel;
} = {}): MovementProfileV2VoiceRuntime {
  return new MovementProfileV2VoiceRuntime({
    voice: options.createVoiceChannel ? undefined : new VoiceChannel(options.voiceId ?? 'clara'),
    voiceId: options.voiceId ?? 'clara',
    createVoiceChannel: options.createVoiceChannel,
    nowMs: () => performance.now(),
    onStateChange: () => undefined,
    onCoordinatorAction: (action, atMs) => runtimeActions.push({ action, atMs }),
  });
}

function snapshot(
  stage: MovementProfileV2LiveStage,
  extra: Partial<MovementProfileV2LiveSnapshot> = {}
): MovementProfileV2LiveSnapshot {
  return {
    stage,
    movementEpochId: 'movement-1',
    attemptEpochId: stage.includes('chair') ? 'chair-attempt-1' : 'attempt-1',
    flow: {
      shoulderSide: 'right',
      standingLeg: 'left',
    },
    diagnostics: {
      hinge: { captureValid: true },
    },
    lastTransition: {
      atMs: 0,
      from: stage === 'raw_complete' ? 'hinge_active' : 'chair_practice',
      to: stage,
      reason: stage === 'raw_complete' ? 'hinge_recorded' : 'chair_practice_completed',
    },
    canContinueAfterRest: true,
    recoveryEpisode: null,
    ...extra,
  } as MovementProfileV2LiveSnapshot;
}

function recoveryEpisode(
  item: 'chair' | 'balance' | 'shoulder' | 'hinge',
  lossStage: MovementProfileV2LiveStage,
  targetStage: MovementProfileV2LiveStage
): MovementProfileV2LiveSnapshot['recoveryEpisode'] {
  return {
    id: 'recovery-1',
    item,
    phase: 'attempt_invalidated',
    startedAtMs: 0,
    updatedAtMs: 0,
    lossStage,
    targetStage,
    lossAttemptEpochId: 'old-attempt',
    recoveryAttemptEpochId: 'new-attempt',
    reason: 'tracking_invalid',
    partialAttemptInvalidated: true,
    freshStartRequired: true,
    itemSpecificCue: item === 'balance'
      ? 'mpv2_balance_tracking_retry'
      : item === 'shoulder'
        ? 'mpv2_shoulder_tracking_retry'
        : null,
    duplicateLossEvents: 0,
    precedence: 'loss_before_terminal_event',
  };
}

async function flushAsync(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

class FakeAudioPlayer {
  playing = false;
  duration = 0.2;
  play = jest.fn(() => {
    this.playing = true;
  });
  remove = jest.fn();
  removeAllListeners = jest.fn();
  private listener: ((status: { playing?: boolean; didJustFinish?: boolean }) => void) | null = null;

  addListener = jest.fn((event: string, listener: (status: { playing?: boolean; didJustFinish?: boolean }) => void) => {
    if (event === 'playbackStatusUpdate') this.listener = listener;
    return { remove: jest.fn() };
  });

  finish() {
    this.playing = false;
    this.listener?.({ playing: false, didJustFinish: true });
  }
}
