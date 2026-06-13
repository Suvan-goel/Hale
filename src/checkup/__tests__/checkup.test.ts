/**
 * Check-Up orchestrator, fully headless: a continuous synthetic feed →
 * PosePipeline + CheckUpOrchestrator with a fake voice-playback model (each
 * cue "plays" for a fixed time). Deterministic — all timing from frame
 * timestamps. Verifies the battery chains every item, speaks the intro/closing
 * and view-change transition cues, produces a coherent CheckUp even with an
 * unmeasured item, and skips items that never get framed without blocking.
 */

import { VoiceCueKey } from '../../audio/cues';
import { PosePipeline } from '../../pose/pipeline';
import { makeFrame, mulberry32 } from '../../pose/testing/syntheticPose';
import { RawLandmarkEvent } from '../../pose/types';
import { PreflightCheck } from '../../preflight/preflight';
import { DEFAULT_SESSION_CONFIG } from '../../assessment/sessionController';
import { CheckUp } from '../types';
import { CheckUpConfig, CheckUpOrchestrator, DEFAULT_CHECKUP_CONFIG } from '../checkup';

const CUE_PLAY_MS = 1500;
const FRAME_MS = 1000 / 30;

interface RunResult {
  checkUp: CheckUp;
  spoken: VoiceCueKey[];
  phasesSeen: Set<string>;
  frames: number;
}

/**
 * Drive the orchestrator with a frame generator until it finishes (or a frame
 * cap). `frameAt(ts)` returns the synthetic frame for a timestamp.
 */
function runBattery(
  config: CheckUpConfig,
  frameAt: (ts: number) => RawLandmarkEvent,
  maxFrames = 40000
): RunResult {
  const pipeline = new PosePipeline();
  const preflight = new PreflightCheck();
  const orchestrator = new CheckUpOrchestrator('2026-06-13T10:00:00.000Z', preflight, config);
  const spoken: VoiceCueKey[] = [];
  const phasesSeen = new Set<string>();
  let voiceBusyUntil = -1;
  let ts = 0;
  let frames = 0;

  for (; frames < maxFrames; frames++, ts += FRAME_MS) {
    const out = pipeline.process(frameAt(Math.round(ts)));
    const voiceBusy = ts < voiceBusyUntil;
    const u = orchestrator.update(out, voiceBusy);
    phasesSeen.add(u.phase);
    if (u.voice) {
      spoken.push(...u.voice.cues);
      voiceBusyUntil = ts + u.voice.cues.length * CUE_PLAY_MS;
    }
    if (u.phase === 'done') break;
  }
  const checkUp = orchestrator.result;
  if (!checkUp) throw new Error(`battery did not finish within ${maxFrames} frames`);
  return { checkUp, spoken, phasesSeen, frames };
}

// A continuously well-framed, still standing subject (front pose tracks for
// every item; side items just pick a side). Movements aren't performed, so
// graders measure their static defaults — enough to exercise orchestration.
function framedStanding(seed = 7): (ts: number) => RawLandmarkEvent {
  const rng = mulberry32(seed);
  return (ts: number) => makeFrame(ts, rng);
}

describe('Check-Up orchestrator — full battery', () => {
  const config: CheckUpConfig = {
    ...DEFAULT_CHECKUP_CONFIG,
    // Cap the grader-terminated TUG (the static subject never sits) so the
    // headless run stays short; everything else uses production timings.
    session: { ...DEFAULT_SESSION_CONFIG, maxActiveMs: 8000 },
  };

  it('runs all five items in order and finishes with a coherent CheckUp', () => {
    const run = runBattery(config, framedStanding());
    expect(run.checkUp.items.map((i) => i.movementId)).toEqual([
      'chair-stand-30s',
      'timed-up-and-go',
      'balance-ladder',
      'shoulder-flexion-peak',
      'hinge-reach',
    ]);
    // Every item has a definite status; none left blocking.
    for (const item of run.checkUp.items) {
      expect(['measured', 'unmeasured', 'skipped']).toContain(item.status);
    }
    // The static subject never sits, so TUG is unmeasured — and that's fine.
    const tug = run.checkUp.items.find((i) => i.movementId === 'timed-up-and-go')!;
    expect(tug.status).toBe('unmeasured');
    expect(run.checkUp.bodyUnit).not.toBeNull();
    // Acceptance: the whole voice-guided battery fits comfortably under 12 min
    // (this feed runs balance's full ~67s schedule, a representative upper bound).
    expect(run.frames * FRAME_MS).toBeLessThan(12 * 60 * 1000);
  });

  it('speaks the intro, the closing line, and view-change transition cues', () => {
    const run = runBattery(config, framedStanding());
    expect(run.spoken[0]).toBe('checkup-intro');
    expect(run.spoken).toContain('checkup-complete');
    // TUG → balance crosses side→front; balance → shoulder crosses front→side.
    expect(run.spoken).toContain('face-forward');
    expect(run.spoken).toContain('turn-side-on');
    expect(run.spoken.indexOf('checkup-complete')).toBe(run.spoken.length - 1);
    expect(run.phasesSeen.has('transition')).toBe(true);
    expect(run.phasesSeen.has('complete')).toBe(true);
  });
});

describe('Check-Up orchestrator — graceful skip', () => {
  it('skips items that never get framed and still produces a full CheckUp', () => {
    const config: CheckUpConfig = {
      ...DEFAULT_CHECKUP_CONFIG,
      battery: ['chair-stand-30s', 'shoulder-flexion-peak'],
      maxFramingMs: 3000,
    };
    // No subject ever appears: empty frames the whole time.
    const run = runBattery(config, (ts) => ({ timestampMs: ts, landmarks: [] }), 6000);
    expect(run.checkUp.items).toHaveLength(2);
    for (const item of run.checkUp.items) {
      expect(item.status).toBe('skipped');
      expect(item.result).toBeNull();
    }
    expect(run.spoken.filter((c) => c === 'exercise-skipped').length).toBe(2);
    expect(run.spoken).toContain('checkup-complete');
  });
});
