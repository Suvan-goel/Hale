/**
 * Training session player, fully headless: a continuous synthetic feed →
 * PosePipeline + TrainingSessionPlayer with a fake voice-playback model.
 * Deterministic (all timing from frame timestamps). Verifies the player chains
 * items, runs every prescribed set with spoken rest between them, speaks the
 * intro / closing / view-change cues, finishes with a coherent result, and
 * skips an item that never gets framed without blocking the session.
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
  TrainingPlayerConfig,
  TrainingSessionPlayer,
  TrainingSessionResult,
} from '../sessionPlayer';

const CUE_PLAY_MS = 1200;
const FRAME_MS = 1000 / 30;

interface RunResult {
  result: TrainingSessionResult;
  spoken: VoiceCueKey[];
  phasesSeen: Set<string>;
}

function runSession(
  exerciseIds: string[],
  frameAt: (ts: number) => RawLandmarkEvent,
  config: TrainingPlayerConfig,
  maxFrames = 60000
): RunResult {
  const pipeline = new PosePipeline();
  const preflight = new PreflightCheck();
  const player = new TrainingSessionPlayer('2026-06-14T09:00:00.000Z', exerciseIds, preflight, config);
  const spoken: VoiceCueKey[] = [];
  const phasesSeen = new Set<string>();
  let voiceBusyUntil = -1;
  let ts = 0;

  for (let frames = 0; frames < maxFrames; frames++, ts += FRAME_MS) {
    const out = pipeline.process(frameAt(Math.round(ts)));
    const u = player.update(out, ts < voiceBusyUntil);
    phasesSeen.add(u.phase);
    if (u.voice) {
      spoken.push(...(u.voice.cues as VoiceCueKey[]));
      voiceBusyUntil = ts + u.voice.cues.length * CUE_PLAY_MS;
    }
    if (u.phase === 'done') break;
  }
  const result = player.result;
  if (!result) throw new Error('session did not finish within frame cap');
  return { result, spoken, phasesSeen };
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
});

describe('TrainingSessionPlayer — graceful skip', () => {
  it('skips an item that never gets framed and still finishes', () => {
    const config: TrainingPlayerConfig = { ...DEFAULT_TRAINING_CONFIG, maxFramingMs: 3000 };
    const run = runSession([STS_STANDARD_ID, NECK_ROTATION_ID], (ts) => ({ timestampMs: ts, landmarks: [] }), config, 8000);
    expect(run.result.items).toHaveLength(2);
    for (const item of run.result.items) {
      expect(item.status).toBe('skipped');
      expect(item.sets).toHaveLength(0);
    }
    expect(run.spoken.filter((c) => c === 'exercise-skipped').length).toBe(2);
    expect(run.spoken[run.spoken.length - 1]).toBe('session-complete');
  });
});
