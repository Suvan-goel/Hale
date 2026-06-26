/**
 * Training session player, fully headless: a continuous synthetic feed →
 * PosePipeline + TrainingSessionPlayer with a fake voice-playback model.
 * Deterministic (all timing from frame timestamps). Verifies the player chains
 * items, runs every prescribed set with spoken rest between them, speaks the
 * intro / closing / view-change cues, finishes with a coherent result, and
 * waits for an explicit user skip when setup cannot get a clear reading.
 *
 * Rep/velocity/autoregulation RELAY through the player is asserted in the M3
 * test (a real decaying-velocity recording); here the subject stands still, so
 * sets end on the safety cap — enough to exercise the orchestration.
 */

import { VoiceCueKey } from '../../audio/cues';
import {
  BRIDGE_HOLD_ID,
  BRIDGE_REPS_ID,
  NECK_ROTATION_ID,
  PUSHUP_STANDARD_ID,
  STS_STANDARD_ID,
  getExercise,
} from '../../exercises';
import { PosePipeline } from '../../pose/pipeline';
import { makeFrame, mulberry32 } from '../../pose/testing/syntheticPose';
import { makeSideFrame, type SideJoints } from '../../pose/testing/syntheticSideView';
import { RawLandmarkEvent } from '../../pose/types';
import { PreflightCheck } from '../../preflight/preflight';
import {
  DEFAULT_TRAINING_CONFIG,
  TRAINING_FLOOR_V2_1_FEATURE_FLAG,
  TrainingFrameUpdate,
  TrainingPlayerConfig,
  TrainingSessionPlayer,
  TrainingSessionResult,
  isTrainingFloorV21FeatureEnabled,
} from '../sessionPlayer';
import type { TrainingSessionPlayerOptions } from '../sessionPlayer';
import { SESSION_GLOBAL_SAFETY_CUE_IDS, type SafetyCueId } from '../safetyCues';

const CUE_PLAY_MS = 1200;
const FRAME_MS = 1000 / 30;

interface RunResult {
  result: TrainingSessionResult;
  spoken: VoiceCueKey[];
  safetyCueIds: SafetyCueId[];
  safetyText: string[];
  phasesSeen: Set<string>;
}

function runSession(
  exerciseIds: string[],
  frameAt: (ts: number) => RawLandmarkEvent,
  config: TrainingPlayerConfig,
  maxFrames = 60000,
  onUpdate?: (update: TrainingFrameUpdate, player: TrainingSessionPlayer) => void,
  options: TrainingSessionPlayerOptions = {}
): RunResult {
  const pipeline = new PosePipeline();
  const preflight = new PreflightCheck();
  const player = new TrainingSessionPlayer('2026-06-14T09:00:00.000Z', exerciseIds, preflight, config, options);
  const spoken: VoiceCueKey[] = [];
  const safetyCueIds: SafetyCueId[] = [];
  const safetyText: string[] = [];
  const phasesSeen = new Set<string>();
  let voiceBusyUntil = -1;
  let ts = 0;

  for (let frames = 0; frames < maxFrames; frames++, ts += FRAME_MS) {
    const out = pipeline.process(frameAt(Math.round(ts)));
    const u = player.update(out, ts < voiceBusyUntil);
    onUpdate?.(u, player);
    phasesSeen.add(u.phase);
    if (u.voice) {
      spoken.push(...(u.voice.cues as VoiceCueKey[]));
      voiceBusyUntil = ts + u.voice.cues.length * CUE_PLAY_MS;
    }
    safetyCueIds.push(...u.safetyCueIds);
    safetyText.push(...u.safetyText);
    if (u.phase === 'done') break;
  }
  const result = player.result;
  if (!result) throw new Error('session did not finish within frame cap');
  return { result, spoken, safetyCueIds, safetyText, phasesSeen };
}

function framedStanding(seed = 7): (ts: number) => RawLandmarkEvent {
  const rng = mulberry32(seed);
  return (ts: number) => makeFrame(ts, rng);
}

const FLOOR_START: SideJoints = {
  ankle: [0, 0],
  knee: [0.08, 0.16],
  hip: [0.2, 0.08],
  shoulder: [-0.14, 0.08],
  elbow: [-0.07, 0.02],
  wrist: [0.02, 0],
  nose: [-0.22, 0.11],
};

const SIDE_STANDING: SideJoints = {
  ankle: [0, 0],
  knee: [0, 0.17],
  hip: [-0.01, 0.34],
  shoulder: [0, 0.62],
  elbow: [0.02, 0.47],
  wrist: [0.03, 0.34],
  nose: [0.04, 0.78],
};

function sideStanding(seed = 13): (ts: number) => RawLandmarkEvent {
  const rng = mulberry32(seed);
  return (ts: number) =>
    makeSideFrame(ts, SIDE_STANDING, rng, {
      scale: 0.75,
      noiseAmp: 0,
      nearVisibility: 0.94,
      farVisibility: 0.35,
    });
}

function floorStartSide(seed = 17): (ts: number) => RawLandmarkEvent {
  const rng = mulberry32(seed);
  return (ts: number) =>
    makeSideFrame(ts, FLOOR_START, rng, {
      scale: 1.1,
      noiseAmp: 0,
      nearVisibility: 0.94,
      farVisibility: 0.35,
    });
}

const FLOOR_V21_OPTIONS: TrainingSessionPlayerOptions = {
  trainingVoiceMode: 'internal_v21',
  floorV21FeatureEnabled: true,
  runtimeCapabilities: {
    internalFloorSetupReady: true,
  },
};

interface FloorPartialRun {
  player: TrainingSessionPlayer;
  spoken: VoiceCueKey[];
  updates: {
    phase: TrainingFrameUpdate['phase'];
    floorSetup: TrainingFrameUpdate['floorSetup'];
  }[];
}

function runFloorPartial(input: {
  exerciseId?: string;
  frameAt?: (ts: number) => RawLandmarkEvent;
  config?: TrainingPlayerConfig;
  maxFrames?: number;
  stopAtSet?: boolean;
  onUpdate?: (update: TrainingFrameUpdate, player: TrainingSessionPlayer) => void;
  onVoice?: (cues: readonly VoiceCueKey[], update: TrainingFrameUpdate, player: TrainingSessionPlayer) => void;
} = {}): FloorPartialRun {
  const {
    exerciseId = BRIDGE_HOLD_ID,
    frameAt = sideStanding(),
    config = {
      ...DEFAULT_TRAINING_CONFIG,
      postInstructionsDwellMs: 300,
      countdownStepMs: 300,
      setSafetyMs: 1000,
    },
    maxFrames = 3000,
    stopAtSet = true,
    onUpdate,
    onVoice,
  } = input;
  const pipeline = new PosePipeline();
  const preflight = new PreflightCheck();
  const player = new TrainingSessionPlayer(
    '2026-06-14T09:00:00.000Z',
    [exerciseId],
    preflight,
    config,
    FLOOR_V21_OPTIONS
  );
  const spoken: VoiceCueKey[] = [];
  const updates: FloorPartialRun['updates'] = [];
  let voiceBusyUntil = -1;
  let ts = 0;

  for (let frames = 0; frames < maxFrames; frames++, ts += FRAME_MS) {
    const out = pipeline.process(frameAt(Math.round(ts)));
    const u = player.update(out, ts < voiceBusyUntil);
    onUpdate?.(u, player);
    updates.push({
      phase: u.phase,
      floorSetup: u.floorSetup ? { ...u.floorSetup } : null,
    });
    if (u.voice) {
      const cues = u.voice.cues as VoiceCueKey[];
      spoken.push(...cues);
      onVoice?.(cues, u, player);
      voiceBusyUntil = ts + cues.length * CUE_PLAY_MS;
    }
    if ((stopAtSet && u.phase === 'set') || u.phase === 'done') break;
  }
  return { player, spoken, updates };
}

function latestFloorSetup(run: FloorPartialRun): NonNullable<TrainingFrameUpdate['floorSetup']> {
  const latest = [...run.updates].reverse().find((update) => update.floorSetup)?.floorSetup;
  if (!latest) throw new Error('floor setup was never reached');
  return latest;
}

describe('TrainingSessionPlayer — full session', () => {
  // Short set safety cap so the still subject's grader-terminated sets end
  // quickly; rest/clock timings stay at production values.
  const config: TrainingPlayerConfig = { ...DEFAULT_TRAINING_CONFIG, setSafetyMs: 4000 };
  const plan = [STS_STANDARD_ID, BRIDGE_HOLD_ID, NECK_ROTATION_ID];

  it('runs every item and every prescribed set, then finishes', () => {
    const run = runSession(plan, framedStanding(), config);
    expect(run.result.items.map((i) => i.exerciseId)).toEqual(plan);
    for (const item of run.result.items) {
      expect(item.status).toBe('completed');
      expect(item.sets).toHaveLength(getExercise(item.exerciseId).prescription.sets);
    }
    expect(run.phasesSeen.has('set')).toBe(true);
    expect(run.phasesSeen.has('rest')).toBe(true);
    expect(run.phasesSeen.has('transition')).toBe(true);
    expect(run.phasesSeen.has('complete')).toBe(true);
  });

  it('speaks intro, a rest between sets, the view-change cue, and the closing line last', () => {
    const run = runSession(plan, framedStanding(), config);
    expect(run.spoken[0]).toBe('training-intro');
    expect(run.spoken[run.spoken.length - 1]).toBe('session-complete');
    // Two 3-set items → each yields one 'rest-now' + one 'last-set'.
    const rests = run.spoken.filter((c) => c === 'rest-now' || c === 'last-set').length;
    expect(rests).toBe(4);
    expect(run.spoken).toContain('last-set');
    // Bridge (side) → neck rotations (front) crosses the camera view.
    expect(run.spoken).toContain('face-forward');
  });

  it('speaks canonical global safety once and setup cues before the first countdown', () => {
    const run = runSession([STS_STANDARD_ID], framedStanding(), config);
    const firstCountdown = run.spoken.indexOf('countdown-three');
    expect(firstCountdown).toBeGreaterThan(0);
    for (const cueId of SESSION_GLOBAL_SAFETY_CUE_IDS) {
      expect(run.spoken.filter((cue) => cue === cueId).length).toBe(1);
      expect(run.spoken.indexOf(cueId)).toBeLessThan(firstCountdown);
    }
    expect(run.spoken.filter((cue) => cue === 'support_keep_support_within_reach').length).toBe(1);
    expect(run.spoken.indexOf('support_keep_support_within_reach')).toBeLessThan(firstCountdown);
    expect(run.spoken.indexOf('chair_use_sturdy_chair')).toBeGreaterThan(-1);
    expect(run.spoken.indexOf('chair_use_sturdy_chair')).toBeLessThan(firstCountdown);
    expect(run.safetyText.join(' ')).toMatch(/sturdy chair/);
  });

  it('can gate internal V2.1 active start on the tracked go playback-start callback', () => {
    const pipeline = new PosePipeline();
    const preflight = new PreflightCheck();
    const player = new TrainingSessionPlayer(
      '2026-06-14T09:00:00.000Z',
      [STS_STANDARD_ID],
      preflight,
      {
        ...DEFAULT_TRAINING_CONFIG,
        postInstructionsDwellMs: 200,
        countdownStepMs: 200,
        setSafetyMs: 1000,
      },
      {
        trainingVoiceMode: 'internal_v21',
        runtimeCapabilities: {
          internalTrainingVoiceBehaviorReady: true,
        },
      }
    );
    const frameAt = framedStanding();
    let voiceBusyUntil = -1;
    let countdown: TrainingFrameUpdate | null = null;

    for (let frames = 0, ts = 0; frames < 1600; frames++, ts += FRAME_MS) {
      const out = pipeline.process(frameAt(Math.round(ts)));
      const u = player.update(out, ts < voiceBusyUntil);
      if (u.voice) {
        if (u.voice.cues.includes('countdown-three')) {
          countdown = { ...u };
          break;
        }
        voiceBusyUntil = ts + u.voice.cues.length * CUE_PLAY_MS;
      }
    }

    expect(countdown?.voice?.cues).toEqual(['countdown-three', 'countdown-two', 'countdown-one', 'go']);
    expect(countdown?.phase).toBe('countdown');
    expect(player.notifyCountdownGoPlaybackStarted({
      itemIndex: countdown?.itemIndex,
      setIndex: countdown?.setIndex,
      timestampMs: 5000,
    })).toBe(true);
    expect(player.update(pipeline.process(frameAt(5033)), false).phase).toBe('set');
  });
});

describe('TrainingSessionPlayer — setup issue choices', () => {
  it('surfaces setup trouble and records skipped items only after the user chooses skip', () => {
    const config: TrainingPlayerConfig = { ...DEFAULT_TRAINING_CONFIG, maxFramingMs: 3000 };
    let setupIssues = 0;
    const run = runSession(
      [STS_STANDARD_ID, NECK_ROTATION_ID],
      (ts) => ({ timestampMs: ts, landmarks: [] }),
      config,
      8000,
      (u, player) => {
        if (!u.setupIssue) return;
        setupIssues++;
        player.skipCurrentItem();
      }
    );
    expect(run.result.items).toHaveLength(2);
    for (const item of run.result.items) {
      expect(item.status).toBe('skipped');
      expect(item.sets).toHaveLength(0);
    }
    expect(setupIssues).toBe(2);
    expect(run.spoken.filter((c) => c === 'exercise-skipped').length).toBe(0);
    expect(run.spoken[run.spoken.length - 1]).toBe('session-complete');
  });

  it('surfaces tracking recovery safety text while waiting after setup trouble', () => {
    const config: TrainingPlayerConfig = { ...DEFAULT_TRAINING_CONFIG, maxFramingMs: 3000 };
    let recoveryText = '';
    runSession(
      [STS_STANDARD_ID],
      (ts) => ({ timestampMs: ts, landmarks: [] }),
      config,
      8000,
      (u, player) => {
        if (u.safetyCueIds.includes('tracking_pause_and_reset')) {
          recoveryText = u.safetyText.join(' ');
        }
        if (u.setupIssue) player.skipCurrentItem();
      }
    );
    expect(recoveryText).toMatch(/Tracking paused/);
  });

  it('surfaces the current setup prompt for dynamic setup UI', () => {
    const config: TrainingPlayerConfig = { ...DEFAULT_TRAINING_CONFIG, maxFramingMs: 3000 };
    const prompts: string[] = [];
    const setupIssuePrompts: string[] = [];
    runSession(
      [STS_STANDARD_ID],
      (ts) => ({ timestampMs: ts, landmarks: [] }),
      config,
      8000,
      (u, player) => {
        if (u.setupPrompt) prompts.push(u.setupPrompt);
        if (u.setupIssue) {
          if (u.setupPrompt) setupIssuePrompts.push(u.setupPrompt);
          player.skipCurrentItem();
        }
      }
    );
    expect(prompts).toContain('step-into-frame');
    expect(setupIssuePrompts).toEqual(['step-into-frame']);
  });
});

describe('TrainingSessionPlayer — floor final-position readiness', () => {
  it('keeps the floor V2.1 runtime feature default closed', () => {
    expect(TRAINING_FLOOR_V2_1_FEATURE_FLAG).toBe('EXPO_PUBLIC_ENABLE_TRAINING_FLOOR_V2_1');
    expect(isTrainingFloorV21FeatureEnabled({})).toBe(false);
    expect(isTrainingFloorV21FeatureEnabled({ EXPO_PUBLIC_ENABLE_TRAINING_FLOOR_V2_1: 'true' })).toBe(true);
  });

  it('does not treat standing framing as floor final-position readiness', () => {
    const run = runFloorPartial({ frameAt: sideStanding(), maxFrames: 1200 });
    expect(run.spoken).toContain('floor_slow_transition');
    expect(run.spoken).toContain('ex-glute-bridge');
    expect(run.spoken).not.toContain('framing-ready');
    expect(run.spoken).not.toContain('final-position-set-v21');
    expect(run.spoken).not.toContain('countdown-three');
    expect(latestFloorSetup(run)).toMatchObject({
      userConfirmed: false,
      movementReady: false,
    });
  });

  it.each([BRIDGE_HOLD_ID, BRIDGE_REPS_ID, PUSHUP_STANDARD_ID])(
    'requires confirmation and stable visibility before countdown for %s',
    (exerciseId) => {
      let confirmed = false;
      const standing = sideStanding();
      const floor = floorStartSide();
      const run = runFloorPartial({
        exerciseId,
        frameAt: (ts) => (confirmed ? floor(ts) : standing(ts)),
        maxFrames: 1800,
        onUpdate: (u, player) => {
          if (confirmed || !u.floorSetup) return;
          confirmed = player.confirmFloorStartPosition({
            exerciseId: u.floorSetup.exerciseId,
            setIndex: u.floorSetup.setIndex,
            setupEpoch: u.floorSetup.setupEpoch,
          });
        },
      });
      const final = run.spoken.indexOf('final-position-set-v21');
      const countdown = run.spoken.indexOf('countdown-three');
      const go = run.spoken.indexOf('go');
      expect(confirmed).toBe(true);
      expect(final).toBeGreaterThan(-1);
      expect(countdown).toBeGreaterThan(final);
      expect(go).toBeGreaterThan(countdown);
      expect(run.updates.some((update) => update.phase === 'set')).toBe(true);
    }
  );

  it('blocks user confirmation without required visibility', () => {
    let dropPose = false;
    let confirmed = false;
    const standing = sideStanding();
    const run = runFloorPartial({
      frameAt: (ts) => (dropPose ? { timestampMs: ts, landmarks: [] } : standing(ts)),
      maxFrames: 1400,
      onUpdate: (u, player) => {
        if (confirmed || !u.floorSetup) return;
        confirmed = player.confirmFloorStartPosition({
          exerciseId: u.floorSetup.exerciseId,
          setIndex: u.floorSetup.setIndex,
          setupEpoch: u.floorSetup.setupEpoch,
        });
        dropPose = confirmed;
      },
    });
    expect(confirmed).toBe(true);
    expect(run.spoken).not.toContain('final-position-set-v21');
    expect(run.spoken).not.toContain('countdown-three');
    expect(latestFloorSetup(run).phase).toBe('awaiting_visibility');
  });

  it('blocks camera readiness without the required explicit floor confirmation', () => {
    let setupSeen = false;
    const standing = sideStanding();
    const floor = floorStartSide();
    const run = runFloorPartial({
      frameAt: (ts) => (setupSeen ? floor(ts) : standing(ts)),
      maxFrames: 1600,
      onUpdate: (u) => {
        if (u.floorSetup) setupSeen = true;
      },
    });
    expect(run.spoken).not.toContain('final-position-set-v21');
    expect(run.spoken).not.toContain('countdown-three');
    expect(latestFloorSetup(run).userConfirmed).toBe(false);
  });

  it('deduplicates rapid ready taps with the setup epoch guard', () => {
    let first: boolean | null = null;
    let second: boolean | null = null;
    runFloorPartial({
      maxFrames: 1000,
      onUpdate: (u, player) => {
        if (!u.floorSetup || first !== null) return;
        const guard = {
          exerciseId: u.floorSetup.exerciseId,
          setIndex: u.floorSetup.setIndex,
          setupEpoch: u.floorSetup.setupEpoch,
        };
        first = player.confirmFloorStartPosition(guard);
        second = player.confirmFloorStartPosition(guard);
      },
    });
    expect(first).toBe(true);
    expect(second).toBe(false);
  });

  it('returns to visibility readiness when tracking is lost during floor setup', () => {
    let confirmed = false;
    let dropPose = false;
    const standing = sideStanding();
    const floor = floorStartSide();
    const run = runFloorPartial({
      frameAt: (ts) => (dropPose ? { timestampMs: ts, landmarks: [] } : confirmed ? floor(ts) : standing(ts)),
      maxFrames: 1800,
      onUpdate: (u, player) => {
        if (confirmed || !u.floorSetup) return;
        confirmed = player.confirmFloorStartPosition({
          exerciseId: u.floorSetup.exerciseId,
          setIndex: u.floorSetup.setIndex,
          setupEpoch: u.floorSetup.setupEpoch,
        });
      },
      onVoice: (cues) => {
        if (cues.includes('final-position-set-v21')) dropPose = true;
      },
    });
    expect(run.spoken).toContain('final-position-set-v21');
    expect(run.spoken).not.toContain('countdown-three');
    expect(latestFloorSetup(run)).toMatchObject({
      phase: 'awaiting_visibility',
      movementReady: false,
      finalPositionReadyAtMs: null,
    });
  });

  it('keeps the floor transition to one first-use cue across later floor sets', () => {
    let confirmations = 0;
    let confirmedForEpoch = -1;
    const standing = sideStanding();
    const floor = floorStartSide();
    const run = runFloorPartial({
      frameAt: (ts) => (confirmedForEpoch >= 0 ? floor(ts) : standing(ts)),
      config: {
        ...DEFAULT_TRAINING_CONFIG,
        postInstructionsDwellMs: 200,
        countdownStepMs: 200,
        setSafetyMs: 700,
      },
      maxFrames: 4500,
      stopAtSet: false,
      onUpdate: (u, player) => {
        if (!u.floorSetup || u.floorSetup.userConfirmed) return;
        if (
          player.confirmFloorStartPosition({
            exerciseId: u.floorSetup.exerciseId,
            setIndex: u.floorSetup.setIndex,
            setupEpoch: u.floorSetup.setupEpoch,
          })
        ) {
          confirmations++;
          confirmedForEpoch = u.floorSetup.setupEpoch;
        }
      },
    });
    expect(confirmations).toBeGreaterThan(1);
    expect(run.spoken.filter((cue) => cue === 'floor_slow_transition')).toHaveLength(1);
  });
});
