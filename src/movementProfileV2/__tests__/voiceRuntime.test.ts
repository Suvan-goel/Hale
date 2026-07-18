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

  it('runs the frame-check plan and starts the chair item with framing confirmation instead of replaying the intro', async () => {
    const runtime = createRuntime();
    runtime.sync(snapshot('standing_frame_check', { attemptEpochId: null, movementEpochId: 'frame-check-2' }));
    expect(players).toHaveLength(1);
    players[0].finish(); // mpv2_checkup_intro
    await flushAsync();
    players[players.length - 1].finish(); // step-into-frame
    await flushAsync();
    expect(runtimeActions.map((entry) => entry.action.type)).toEqual(['frame_check_voice_completed']);

    // Frame check passed → chair_setup speaks framing-ready + chair cues, NOT
    // the check-up intro again.
    runtime.sync(snapshot('chair_setup', {
      lastTransition: { atMs: 5000, from: 'standing_frame_check', to: 'chair_setup', reason: 'frame_check_passed' },
    }));
    players[players.length - 1].finish();
    await flushAsync();
    players[players.length - 1].finish();
    await flushAsync();
    players[players.length - 1].finish();
    await flushAsync();
    expect(runtimeActions.map((entry) => entry.action.type)).toEqual([
      'frame_check_voice_completed',
      'chair_setup_voice_completed',
    ]);
    const startedCues = runtime.state.diagnostics
      .filter((event) => event.event === 'cue_playback_start_evidence')
      .map((event) => event.cueKey);
    expect(startedCues).toContain('framing-ready');
    expect(startedCues.filter((cue) => cue === 'mpv2_checkup_intro')).toHaveLength(1);
  });

  it('swaps the chair intro for the mid-battery line when another item hands off into the chair', async () => {
    // Check-up #0 runs balance first: the chair item must not open with
    // "We'll start with the chair stand" — the bundled 'chair-stand-intro'
    // ("Next, the thirty second chair stand…") carries the handoff instead.
    const runtime = createRuntime();
    runtime.sync(snapshot('chair_setup', {
      attemptEpochId: null,
      movementEpochId: 'chair-2',
      // A completed balance section always carries its measured best hold;
      // without one the handoff intentionally drops the completion line.
      balanceBestHoldSec: 12,
      diagnostics: {
        hinge: { captureValid: true },
        balance: { ceilingReached: false },
      } as MovementProfileV2LiveSnapshot['diagnostics'],
      lastTransition: { atMs: 9000, from: 'balance_trial', to: 'chair_setup', reason: 'balance_section_complete' },
    }));
    for (let index = 0; index < 3; index++) {
      players[players.length - 1].finish();
      await flushAsync();
    }
    const startedCues = runtime.state.diagnostics
      .filter((event) => event.event === 'cue_playback_start_evidence')
      .map((event) => event.cueKey);
    expect(startedCues).toEqual(['item-complete-v21', 'chair-stand-intro', 'checkup-chair-stand-setup-v21']);
    expect(runtimeActions.map((entry) => entry.action.type)).toEqual(['chair_setup_voice_completed']);
  });

  it('speaks the finish-now ready line only once a valid balance hold is banked', async () => {
    // No hold banked (retry rest): the plain next-attempt line — the fallback
    // button in that state is Skip, so "Save best result" must not be spoken.
    const runtime = createRuntime();
    runtime.sync(snapshot('balance_ready', {
      attemptEpochId: 'balance-ready-2',
      balanceBestHoldSec: null,
      lastTransition: { atMs: 4000, from: 'balance_rest', to: 'balance_ready', reason: 'balance_rest_ready' },
    }));
    players[players.length - 1].finish();
    await flushAsync();

    // With a hold banked, the swapped plain cue speaks the finish-now option.
    runtime.sync(snapshot('balance_ready', {
      attemptEpochId: 'balance-ready-3',
      balanceBestHoldSec: 12,
      lastTransition: { atMs: 9000, from: 'balance_rest', to: 'balance_ready', reason: 'balance_rest_ready' },
    }));
    players[players.length - 1].finish();
    await flushAsync();

    const startedCues = runtime.state.diagnostics
      .filter((event) => event.event === 'cue_playback_start_evidence')
      .map((event) => event.cueKey);
    expect(startedCues).toEqual(['mpv2_balance_ready_after_30', 'checkup-balance-ready-can-finish']);
    expect(runtimeActions.map((entry) => entry.action.type)).toEqual([
      'balance_attempt_voice_completed',
      'balance_attempt_voice_completed',
    ]);
  });

  it('speaks one-shot advisory notices only after the stage plan and dedupes them per scope', async () => {
    const runtime = createRuntime();
    const wrongLeg = snapshot('balance_ready', {
      attemptEpochId: 'balance-ready-7',
      balanceWrongLegNoticed: true,
    });
    runtime.sync(wrongLeg);
    // The blocking attempt cue owns the channel first; no notice yet.
    expect(players).toHaveLength(1);
    players[0].finish();
    await flushAsync();
    expect(runtimeActions.map((entry) => entry.action.type)).toEqual(['balance_attempt_voice_completed']);

    runtime.sync(wrongLeg);
    await flushAsync();
    expect(players).toHaveLength(2);
    players[1].finish();
    await flushAsync();
    const optionalCues = runtime.state.diagnostics
      .filter((event) => event.event === 'optional_cue_playback_start_evidence')
      .map((event) => event.cueKey);
    expect(optionalCues).toContain('balance-same-leg');

    // Deduped: further syncs with the same attempt do not replay the notice.
    runtime.sync(wrongLeg);
    await flushAsync();
    expect(players).toHaveLength(2);

    // Lighting hint during a stuck frame check follows the same contract.
    const dimFrameCheck = snapshot('standing_frame_check', {
      attemptEpochId: null,
      movementEpochId: 'frame-check-2',
      frameCheckLightingHintAvailable: true,
    });
    runtime.sync(dimFrameCheck);
    players[players.length - 1].finish(); // intro
    await flushAsync();
    players[players.length - 1].finish(); // step-into-frame
    await flushAsync();
    runtime.sync(dimFrameCheck);
    await flushAsync();
    players[players.length - 1].finish();
    await flushAsync();
    const lightCues = runtime.state.diagnostics
      .filter((event) => event.event === 'optional_cue_playback_start_evidence')
      .map((event) => event.cueKey);
    expect(lightCues).toContain('turn-on-light');
    const playersAfterLight = players.length;
    runtime.sync(dimFrameCheck);
    await flushAsync();
    expect(players).toHaveLength(playersAfterLight);
  });

  it('restarts an interrupted chair countdown on the next sync instead of deadlocking', async () => {
    const runtime = createRuntime();
    runtime.sync(snapshot('chair_countdown'));
    players[0].finish();
    await flushAsync();
    expect(players).toHaveLength(2); // countdown 'three' started

    // App backgrounded mid-countdown: everything cancels. The parent scope
    // must NOT be marked complete — 'go' never played and the coordinator is
    // still waiting for it.
    runtime.cancel('app_backgrounded');
    players.slice().forEach((player) => player.finish());
    jest.advanceTimersByTime(5000);
    await flushAsync();
    expect(runtimeActions.map((entry) => entry.action.type)).toEqual([
      'chair_official_ready_voice_completed',
      'chair_countdown_started',
    ]);

    // On resume the same snapshot syncs again: the plan replays ready +
    // countdown all the way to 'go'. (The deadlock this pins: the scope was
    // previously marked complete before the countdown ran, so sync returned
    // and the check-up hung in chair_countdown forever.)
    const playersBefore = players.length;
    runtime.sync(snapshot('chair_countdown'));
    expect(players.length).toBeGreaterThan(playersBefore);
    players[players.length - 1].finish(); // official-ready replay
    await flushAsync();
    players[players.length - 1].finish(); // three
    await flushAsync();
    jest.advanceTimersByTime(1000);
    await flushAsync();
    players[players.length - 1].finish(); // two
    await flushAsync();
    jest.advanceTimersByTime(1000);
    await flushAsync();
    players[players.length - 1].finish(); // one
    await flushAsync();
    jest.advanceTimersByTime(1000);
    await flushAsync();
    expect(runtimeActions.map((entry) => entry.action.type)).toContain('chair_go_playback_started');
    expect(runtime.state.lastFailure).toBeNull();
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

  it('stops an active required cue on cancellation and ignores its later completion callback', async () => {
    const runtime = createRuntime();
    runtime.sync(snapshot('hinge_setup', {
      lastTransition: {
        atMs: 0,
        from: 'shoulder_active',
        to: 'hinge_setup',
        reason: 'shoulder_section_complete',
      },
    }));

    expect(runtime.state.blocking).toBe(true);
    expect(players).toHaveLength(1);

    runtime.cancel('screen_unmounted');
    await flushAsync();

    expect(players[0].remove).toHaveBeenCalled();
    expect(runtime.state).toMatchObject({
      blocking: false,
      activeScopeId: null,
      activeRequirement: null,
    });

    players[0].finish();
    await flushAsync();

    expect(players).toHaveLength(1);
    expect(runtimeActions.map((entry) => entry.action.type)).not.toContain('hinge_setup_voice_completed');
    expect(runtime.state.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'cancellation',
          scopeId: 'mpv2:hinge_setup:attempt-1:r0',
        }),
      ])
    );
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
    expect(runtime.state.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'cue_playback_start_evidence',
          cueKey: 'stand-tall',
        }),
      ])
    );
    players[0].finish();
    await flushAsync();
    players[1].finish();
    await flushAsync();
    expect(runtime.state.completionReady).toBe(true);
  });

  it('closes the two-movement battery with its own bridge, never the full-battery results-ready line', async () => {
    const runtime = createRuntime();
    const base = snapshot('raw_complete');
    const monthly: MovementProfileV2LiveSnapshot = {
      ...base,
      flow: {
        ...base.flow,
        batterySequence: ['balance', 'chair'],
      },
      lastTransition: {
        atMs: 0,
        from: 'chair_active',
        to: 'raw_complete',
        reason: 'chair_official_complete',
      },
    };
    runtime.sync(monthly);
    players[0].finish();
    await flushAsync();
    players[players.length - 1].finish();
    await flushAsync();
    const started = runtime.state.diagnostics
      .filter((event) => event.event === 'cue_playback_start_evidence')
      .map((event) => event.cueKey);
    // The Everyday Clarity appendix (not results) comes next, and the phone is
    // propped out of reach — the battery closes with its own spoken bridge.
    expect(started).not.toContain('checkup-complete-v21');
    expect(started).toContain('checkup-strength-balance-complete');
    expect(runtime.state.completionReady).toBe(true);
  });

  it('opens the hosted two-movement battery without a second welcome', async () => {
    // The host has already welcomed her and paced the warm-up; the standalone
    // "Welcome to your Movement Check-Up" would be a late second welcome.
    const runtime = createRuntime();
    const base = snapshot('standing_frame_check', {
      attemptEpochId: null,
      movementEpochId: 'frame-check-1',
    });
    runtime.sync({
      ...base,
      flow: { ...base.flow, batterySequence: ['balance', 'chair'] },
    } as MovementProfileV2LiveSnapshot);
    players[0].finish();
    await flushAsync();
    players[1].finish();
    await flushAsync();
    const started = runtime.state.diagnostics
      .filter((event) => event.event === 'cue_playback_start_evidence')
      .map((event) => event.cueKey);
    expect(started).toEqual(['checkup-two-movements-intro', 'step-into-frame']);
    expect(started).not.toContain('mpv2_checkup_intro');
    expect(runtimeActions.map((entry) => entry.action.type)).toEqual(['frame_check_voice_completed']);
  });

  it('speaks the practice-stand fallback hint once, only when the fallback button exists', async () => {
    const runtime = createRuntime();
    const practice = snapshot('chair_practice', {
      attemptEpochId: 'chair-practice-1',
      handsFreeFallbackAvailable: true,
      lastTransition: { atMs: 0, from: 'chair_setup', to: 'chair_practice', reason: 'chair_setup_confirmed' },
    });
    runtime.sync(practice);
    // The blocking practice instruction owns the channel first.
    expect(players).toHaveLength(1);
    players[0].finish();
    await flushAsync();
    expect(runtimeActions.map((entry) => entry.action.type)).toEqual(['chair_practice_voice_completed']);

    runtime.sync(practice);
    await flushAsync();
    expect(players).toHaveLength(2);
    players[1].finish();
    await flushAsync();
    const optionalCues = runtime.state.diagnostics
      .filter((event) => event.event === 'optional_cue_playback_start_evidence')
      .map((event) => event.cueKey);
    expect(optionalCues).toContain('checkup-chair-practice-fallback');

    // Deduped per attempt; and it never plays before the fallback timeout.
    runtime.sync(practice);
    await flushAsync();
    expect(players).toHaveLength(2);
    const runtimeNoFallback = createRuntime();
    const playersBefore = players.length;
    runtimeNoFallback.sync(snapshot('chair_practice', {
      attemptEpochId: 'chair-practice-2',
      handsFreeFallbackAvailable: false,
      lastTransition: { atMs: 0, from: 'chair_setup', to: 'chair_practice', reason: 'chair_setup_confirmed' },
    }));
    players[playersBefore].finish();
    await flushAsync();
    runtimeNoFallback.sync(snapshot('chair_practice', {
      attemptEpochId: 'chair-practice-2',
      handsFreeFallbackAvailable: false,
      lastTransition: { atMs: 0, from: 'chair_setup', to: 'chair_practice', reason: 'chair_setup_confirmed' },
    }));
    await flushAsync();
    expect(players).toHaveLength(playersBefore + 1);
  });

  it('anchors the spoken balance setup to the prior standing leg at a retest', async () => {
    const runtime = createRuntime();
    const base = snapshot('balance_setup', {
      attemptEpochId: null,
      lastTransition: {
        atMs: 0,
        from: 'standing_frame_check',
        to: 'balance_setup',
        reason: 'frame_check_passed',
      },
    });
    const retest: MovementProfileV2LiveSnapshot = {
      ...base,
      flow: { ...base.flow, priorStandingLeg: 'right', standingLeg: 'right' },
    };
    runtime.sync(retest);
    for (let index = 0; index < 3; index++) {
      players[players.length - 1].finish();
      await flushAsync();
    }
    const started = runtime.state.diagnostics
      .filter((event) => event.event === 'cue_playback_start_evidence')
      .map((event) => event.cueKey);
    // Side-consistency is measurement hygiene: the retest names the anchored
    // side instead of re-inviting the baseline free choice.
    expect(started).toContain('checkup-balance-single-leg-retest-right');
    expect(started).not.toContain('checkup-balance-single-leg-v21');
    expect(runtimeActions.map((entry) => entry.action.type)).toContain('balance_setup_voice_completed');
  });

  it('keeps the free-choice balance setup line at baseline (no prior standing leg)', async () => {
    const runtime = createRuntime();
    const baseline = snapshot('balance_setup', {
      attemptEpochId: null,
      lastTransition: {
        atMs: 0,
        from: 'standing_frame_check',
        to: 'balance_setup',
        reason: 'frame_check_passed',
      },
    });
    runtime.sync(baseline);
    for (let index = 0; index < 3; index++) {
      players[players.length - 1].finish();
      await flushAsync();
    }
    const started = runtime.state.diagnostics
      .filter((event) => event.event === 'cue_playback_start_evidence')
      .map((event) => event.cueKey);
    expect(started).toContain('checkup-balance-single-leg-v21');
    expect(started).not.toContain('checkup-balance-single-leg-retest-left');
    expect(started).not.toContain('checkup-balance-single-leg-retest-right');
  });

  it('keeps the no-measurement final reach completion on the no-measurement cue', async () => {
    const runtime = createRuntime();
    runtime.sync(snapshot('raw_complete', {
      diagnostics: {
        hinge: { captureValid: false, reachBu: null },
      } as MovementProfileV2LiveSnapshot['diagnostics'],
      lastTransition: {
        atMs: 0,
        from: 'hinge_active',
        to: 'raw_complete',
        reason: 'hinge_capture_complete',
      },
    }));

    expect(runtime.state.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'cue_playback_start_evidence',
          cueKey: 'mpv2_hinge_no_measurement',
        }),
      ])
    );
    expect(runtime.state.diagnostics).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          cueKey: 'stand-tall',
        }),
      ])
    );
  });

  it('splits chair recovery: loss cues first, recovered + countdown only once stable_ready', async () => {
    const runtime = createRuntime();
    // Part 1 (attempt_invalidated): the loss announcement and re-instruction
    // play immediately. The recovered claim must NOT be here — the user may
    // still be out of frame.
    runtime.sync(snapshot('chair_countdown', {
      recoveryEpisode: recoveryEpisode('chair', 'chair_active', 'chair_countdown'),
    }));
    players[0].finish(); // tracking-loss-v21
    await flushAsync();
    players[1].finish(); // checkup-chair-stand-setup-v21
    await flushAsync();
    const part1Cues = runtime.state.diagnostics
      .filter((event) => event.event === 'cue_playback_start_evidence')
      .map((event) => event.cueKey);
    expect(part1Cues).toEqual(['tracking-loss-v21', 'checkup-chair-stand-setup-v21']);
    expect(runtimeActions.map((entry) => entry.action.type)).toEqual([
      'recovery_instruction_voice_completed',
    ]);

    // The coordinator confirmed re-detection (stable_ready): NOW the
    // recovered claim is true, and the official-ready line + countdown follow.
    runtime.sync(snapshot('chair_countdown', {
      recoveryEpisode: recoveryEpisode('chair', 'chair_active', 'chair_countdown', 'stable_ready'),
    }));
    players[2].finish(); // tracking-recovered-v21
    await flushAsync();
    players[3].finish(); // mpv2_chair_official_ready
    await flushAsync();
    expect(runtimeActions.map((entry) => entry.action.type)).toEqual([
      'recovery_instruction_voice_completed',
      'recovery_voice_completed',
      'chair_official_ready_voice_completed',
      'chair_countdown_started',
    ]);
    expect(runtime.state.diagnostics.filter((entry) => entry.cueKey === 'tracking-loss-v21')).toHaveLength(1);
    expect(runtime.state.diagnostics.some((entry) => entry.cueKey === 'tracking-recovered-v21')).toBe(true);
  });

  it('resumes without the recovered claim when stable_ready was reached by timeout', async () => {
    const runtime = createRuntime();
    runtime.sync(snapshot('chair_countdown', {
      recoveryEpisode: recoveryEpisode('chair', 'chair_active', 'chair_countdown', 'stable_ready', 'timeout'),
    }));
    players[0].finish(); // mpv2_chair_official_ready — no recovered claim first
    await flushAsync();
    const started = runtime.state.diagnostics
      .filter((event) => event.event === 'cue_playback_start_evidence')
      .map((event) => event.cueKey);
    expect(started).toEqual(['mpv2_chair_official_ready']);
    expect(started).not.toContain('tracking-recovered-v21');
    expect(runtimeActions.map((entry) => entry.action.type)).toEqual([
      'recovery_voice_completed',
      'chair_official_ready_voice_completed',
      'chair_countdown_started',
    ]);
  });

  it('speaks exactly one loss announcement for balance and shoulder recovery', async () => {
    // The balance/shoulder item-specific retry lines open with their own
    // "I lost sight of you…" — the generic loss line would be a stutter.
    const runtime = createRuntime();
    runtime.sync(snapshot('balance_rest', {
      attemptEpochId: 'balance-rest-1',
      recoveryEpisode: recoveryEpisode('balance', 'balance_trial', 'balance_rest'),
      lastTransition: { atMs: 0, from: 'balance_trial', to: 'balance_rest', reason: 'balance_invalid_trial_retry_rest' },
    }));
    players[0].finish();
    await flushAsync();
    expect(
      runtime.state.diagnostics
        .filter((event) => event.event === 'cue_playback_start_evidence')
        .map((event) => event.cueKey)
    ).toEqual(['mpv2_balance_tracking_retry']);

    const shoulderRuntime = createRuntime();
    const shoulderPlayersBefore = players.length;
    shoulderRuntime.sync(snapshot('shoulder_retry_ready', {
      attemptEpochId: 'shoulder-retry-1',
      recoveryEpisode: recoveryEpisode('shoulder', 'shoulder_active', 'shoulder_retry_ready'),
      lastTransition: { atMs: 0, from: 'shoulder_active', to: 'shoulder_retry_ready', reason: 'shoulder_tracking_loss_retry_ready' },
    }));
    players[shoulderPlayersBefore].finish();
    await flushAsync();
    players[shoulderPlayersBefore + 1].finish();
    await flushAsync();
    expect(
      shoulderRuntime.state.diagnostics
        .filter((event) => event.event === 'cue_playback_start_evidence')
        .map((event) => event.cueKey)
    ).toEqual(['mpv2_shoulder_tracking_retry', 'checkup-shoulder-turn-right-v21']);
  });

  it('resolves a timeout balance resume silently and never replays the base retry line', async () => {
    const runtime = createRuntime();
    const invalidated = snapshot('balance_rest', {
      attemptEpochId: 'balance-rest-1',
      recoveryEpisode: recoveryEpisode('balance', 'balance_trial', 'balance_rest'),
      lastTransition: { atMs: 0, from: 'balance_trial', to: 'balance_rest', reason: 'balance_invalid_trial_retry_rest' },
    });
    runtime.sync(invalidated);
    players[0].finish(); // mpv2_balance_tracking_retry (part 1)
    await flushAsync();

    // Timeout promotion with nothing banked to say: the episode must still
    // resolve (recovery_voice_completed) without any playback…
    runtime.sync(snapshot('balance_rest', {
      attemptEpochId: 'balance-rest-1',
      recoveryEpisode: recoveryEpisode('balance', 'balance_trial', 'balance_rest', 'stable_ready', 'timeout'),
      lastTransition: { atMs: 0, from: 'balance_trial', to: 'balance_rest', reason: 'balance_invalid_trial_retry_rest' },
    }));
    await flushAsync();
    expect(players).toHaveLength(1);
    expect(runtimeActions.map((entry) => entry.action.type)).toEqual([
      'recovery_instruction_voice_completed',
      'recovery_voice_completed',
    ]);

    // …and the retired base plan must not replay its loss line over the rest.
    runtime.sync(snapshot('balance_rest', {
      attemptEpochId: 'balance-rest-1',
      recoveryEpisode: recoveryEpisode('balance', 'balance_trial', 'balance_rest', 'voice_completed', 'timeout'),
      lastTransition: { atMs: 0, from: 'balance_trial', to: 'balance_rest', reason: 'balance_invalid_trial_retry_rest' },
    }));
    await flushAsync();
    expect(players).toHaveLength(1);
  });

  it('keeps the forward reach action cue after hinge tracking recovery', async () => {
    const runtime = createRuntime();
    const transition = {
      atMs: 0,
      from: 'hinge_active' as const,
      to: 'hinge_setup' as const,
      reason: 'hinge_tracking_loss_recovery_setup',
    };
    runtime.sync(snapshot('hinge_setup', {
      recoveryEpisode: recoveryEpisode('hinge', 'hinge_active', 'hinge_setup'),
      lastTransition: transition,
    }));

    expect(runtime.state.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'cue_playback_start_evidence',
          cueKey: 'tracking-loss-v21',
        }),
      ])
    );

    players[0].finish();
    await flushAsync();
    players[1].finish();
    await flushAsync();
    expect(runtimeActions.map((entry) => entry.action.type)).toEqual([
      'recovery_instruction_voice_completed',
    ]);

    runtime.sync(snapshot('hinge_setup', {
      recoveryEpisode: recoveryEpisode('hinge', 'hinge_active', 'hinge_setup', 'stable_ready'),
      lastTransition: transition,
    }));
    players[2].finish(); // tracking-recovered-v21
    await flushAsync();

    expect(runtime.state.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'cue_playback_start_evidence',
          cueKey: 'hinge-setup',
        }),
      ])
    );

    players[3].finish();
    await flushAsync();
    expect(runtimeActions.map((entry) => entry.action.type)).toEqual([
      'recovery_instruction_voice_completed',
      'recovery_voice_completed',
      'hinge_setup_voice_completed',
    ]);
  });

  it('normalizes retired voice ids to the sole bundled voice', async () => {
    const createdVoiceIds: string[] = [];
    const runtime = createRuntime({
      voiceId: 'retired-voice',
      createVoiceChannel: (id) => {
        createdVoiceIds.push(id);
        return new VoiceChannel(id);
      },
    });
    const setup = snapshot('chair_setup');
    runtime.sync(setup);
    expect(createdVoiceIds).toEqual(['clara']);
    expect(players).toHaveLength(1);

    runtime.setDesiredVoiceId('another-retired-voice', setup);
    expect(createdVoiceIds).toEqual(['clara']);
    expect(runtime.state).toMatchObject({
      desiredVoiceId: 'clara',
      activeVoiceId: 'clara',
      pendingVoiceId: null,
    });
  });

  it('plays the shoulder release cue, forward reach setup, and action cue before the final movement', async () => {
    const runtime = createRuntime();
    runtime.sync(snapshot('hinge_setup', {
      lastTransition: {
        atMs: 0,
        from: 'shoulder_active',
        to: 'hinge_setup',
        reason: 'shoulder_section_complete',
      },
    }));

    expect(runtime.state.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'cue_playback_start_evidence',
          cueKey: 'relax-arm',
        }),
      ])
    );

    players[0].finish();
    await flushAsync();
    expect(runtime.state.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'cue_playback_start_evidence',
          cueKey: 'checkup-hinge-setup-v21',
        }),
      ])
    );

    players[1].finish();
    await flushAsync();
    expect(runtime.state.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'cue_playback_start_evidence',
          cueKey: 'hinge-setup',
        }),
      ])
    );

    players[2].finish();
    await flushAsync();
    expect(runtimeActions.map((entry) => entry.action.type)).toContain('hinge_setup_voice_completed');
  });

  it('speaks a non-blocking hold cue during active forward reach capture', async () => {
    const runtime = createRuntime();
    runtime.sync(snapshot('hinge_active', {
      lastTransition: {
        atMs: 0,
        from: 'hinge_setup',
        to: 'hinge_active',
        reason: 'hinge_capture_started',
      },
    }));

    expect(runtime.state).toMatchObject({
      blocking: false,
      activeRequirement: 'optional_reassurance',
    });
    expect(runtime.state.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'optional_cue_playback_start_evidence',
          cueKey: 'final-position-set-v21',
        }),
      ])
    );

    players[0].finish();
    await flushAsync();

    expect(runtimeActions).toEqual([]);
    expect(runtime.state.lastFailure).toBeNull();
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
    recoveryEpisode: null,
    ...extra,
  } as MovementProfileV2LiveSnapshot;
}

function recoveryEpisode(
  item: 'chair' | 'balance' | 'shoulder' | 'hinge',
  lossStage: MovementProfileV2LiveStage,
  targetStage: MovementProfileV2LiveStage,
  phase: 'attempt_invalidated' | 'stable_ready' | 'voice_completed' = 'attempt_invalidated',
  stablePromotion: 'tracking_confirmed' | 'timeout' | null =
    phase === 'attempt_invalidated' ? null : 'tracking_confirmed'
): MovementProfileV2LiveSnapshot['recoveryEpisode'] {
  return {
    id: 'recovery-1',
    item,
    phase,
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
    stablePromotion,
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
