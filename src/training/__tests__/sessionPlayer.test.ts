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
import { BRIDGE_HOLD_ID, NECK_ROTATION_ID, STS_STANDARD_ID, getExercise } from '../../exercises';
import { PosePipeline } from '../../pose/pipeline';
import { makeFrame, mulberry32 } from '../../pose/testing/syntheticPose';
import { RawLandmarkEvent } from '../../pose/types';
import { PreflightCheck } from '../../preflight/preflight';
import {
  DEFAULT_TRAINING_CONFIG,
  TrainingFrameUpdate,
  TrainingPlayerConfig,
  TrainingSessionPlayer,
  TrainingSessionResult,
} from '../sessionPlayer';
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
  onUpdate?: (update: TrainingFrameUpdate, player: TrainingSessionPlayer) => void
): RunResult {
  const pipeline = new PosePipeline();
  const preflight = new PreflightCheck();
  const player = new TrainingSessionPlayer('2026-06-14T09:00:00.000Z', exerciseIds, preflight, config);
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
