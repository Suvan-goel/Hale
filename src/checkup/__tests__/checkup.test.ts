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
import { shoulderFlexionSession } from '../../pose/testing/syntheticRom';
import { makeFrame, mulberry32 } from '../../pose/testing/syntheticPose';
import { RawLandmarkEvent } from '../../pose/types';
import { PreflightCheck } from '../../preflight/preflight';
import { DEFAULT_SESSION_CONFIG } from '../../assessment/sessionController';
import { CheckUp } from '../types';
import {
  CheckUpConfig,
  CheckUpFrameUpdate,
  CheckUpOrchestrator,
  DEFAULT_CHECKUP_CONFIG,
} from '../checkup';

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
  frameAt: (ts: number, movementId: string | null) => RawLandmarkEvent,
  maxFrames = 40000,
  onUpdate?: (update: CheckUpFrameUpdate, orchestrator: CheckUpOrchestrator) => void
): RunResult {
  const pipeline = new PosePipeline();
  const preflight = new PreflightCheck();
  const orchestrator = new CheckUpOrchestrator('2026-06-13T10:00:00.000Z', preflight, config);
  const spoken: VoiceCueKey[] = [];
  const phasesSeen = new Set<string>();
  let voiceBusyUntil = -1;
  let ts = 0;
  let frames = 0;
  let currentMovementId: string | null = null;

  for (; frames < maxFrames; frames++, ts += FRAME_MS) {
    const out = pipeline.process(frameAt(Math.round(ts), currentMovementId));
    const voiceBusy = ts < voiceBusyUntil;
    const u = orchestrator.update(out, voiceBusy);
    currentMovementId = u.currentMovementId;
    onUpdate?.(u, orchestrator);
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

// A continuously well-framed, still standing subject in the movement's required
// camera view. Movements aren't performed, so graders measure static defaults —
// enough to exercise orchestration without bypassing the movement view gate.
function framedForMovement(seed = 7): (ts: number, movementId: string | null) => RawLandmarkEvent {
  const rng = mulberry32(seed);
  const side = shoulderFlexionSession({ seed, calibrationMs: 100, noiseAmp: 0 }).frames[0];
  return (ts: number, movementId: string | null) => {
    if (movementId === 'balance-ladder') return makeFrame(ts, rng, { noiseAmp: 0 });
    return { ...side, timestampMs: ts };
  };
}

describe('Check-Up orchestrator — full battery', () => {
  const config: CheckUpConfig = {
    ...DEFAULT_CHECKUP_CONFIG,
    session: { ...DEFAULT_SESSION_CONFIG, maxActiveMs: 8000 },
  };

  it('runs the official V1 items in order and finishes with a coherent CheckUp', () => {
    const run = runBattery(config, framedForMovement());
    expect(run.checkUp.items.map((i) => i.movementId)).toEqual([
      'chair-stand-30s',
      'balance-ladder',
      'shoulder-flexion-peak',
      'hinge-reach',
    ]);
    // Every item has a definite status; none left blocking.
    for (const item of run.checkUp.items) {
      expect(['measured', 'unmeasured', 'skipped']).toContain(item.status);
    }
    expect(run.checkUp.items.some((i) => i.movementId === 'timed-up-and-go')).toBe(false);
    expect(run.checkUp.bodyUnit).not.toBeNull();
    // Acceptance: the whole voice-guided battery fits comfortably under 12 min
    // (this feed runs balance's full ~67s schedule, a representative upper bound).
    expect(run.frames * FRAME_MS).toBeLessThan(12 * 60 * 1000);
  });

  it('speaks the intro, the closing line, and view-change transition cues', () => {
    const run = runBattery(config, framedForMovement());
    expect(run.spoken[0]).toBe('checkup-intro');
    expect(run.spoken).toContain('checkup-complete');
    // Chair stand → balance crosses side→front; balance → shoulder crosses front→side.
    expect(run.spoken).toContain('face-forward');
    expect(run.spoken).toContain('turn-side-on');
    expect(run.spoken.indexOf('checkup-complete')).toBe(run.spoken.length - 1);
    expect(run.phasesSeen.has('transition')).toBe(true);
    expect(run.phasesSeen.has('complete')).toBe(true);
  });
});

describe('Check-Up orchestrator — setup issue choices', () => {
  it('surfaces setup trouble and records skipped items only after the user chooses skip', () => {
    const config: CheckUpConfig = {
      ...DEFAULT_CHECKUP_CONFIG,
      battery: ['chair-stand-30s', 'shoulder-flexion-peak'],
      maxFramingMs: 3000,
    };
    let setupIssues = 0;
    // No subject ever appears: empty frames the whole time.
    const run = runBattery(
      config,
      (ts) => ({ timestampMs: ts, landmarks: [] }),
      6000,
      (u, orchestrator) => {
        if (!u.setupIssue) return;
        setupIssues++;
        orchestrator.skipCurrentItem();
      }
    );
    expect(run.checkUp.items).toHaveLength(2);
    for (const item of run.checkUp.items) {
      expect(item.status).toBe('skipped');
      expect(item.result).toBeNull();
    }
    expect(setupIssues).toBe(2);
    expect(run.spoken.filter((c) => c === 'exercise-skipped').length).toBe(0);
    expect(run.spoken).toContain('checkup-complete');
  });

  it('blocks a side-view item that stays front-facing until the user explicitly skips', () => {
    const config: CheckUpConfig = {
      ...DEFAULT_CHECKUP_CONFIG,
      battery: ['chair-stand-30s'],
      maxFramingMs: 9000,
    };
    let setupIssues = 0;
    const frontOnly = framedForMovement(14);
    const run = runBattery(
      config,
      (ts) => frontOnly(ts, 'balance-ladder'),
      12000,
      (u, orchestrator) => {
        if (!u.setupIssue) return;
        setupIssues++;
        orchestrator.skipCurrentItem();
      }
    );

    expect(setupIssues).toBe(1);
    expect(run.spoken).toContain('turn-side-on');
    expect(run.checkUp.items).toEqual([
      { movementId: 'chair-stand-30s', status: 'skipped', result: null },
    ]);
  });

  it('retry clears a latched setup issue and runs the item after fresh valid framing', () => {
    const config: CheckUpConfig = {
      ...DEFAULT_CHECKUP_CONFIG,
      battery: ['chair-stand-30s'],
      maxFramingMs: 12000,
    };
    const pipeline = new PosePipeline();
    const preflight = new PreflightCheck();
    const orchestrator = new CheckUpOrchestrator('2026-06-13T10:00:00.000Z', preflight, config);
    const validFrames = framedForMovement(18);
    let retried = false;
    let setupIssues = 0;
    let voiceBusyUntil = -1;
    let reachedItemAfterRetry = false;
    let currentMovementId: string | null = null;

    for (let frame = 0, ts = 0; frame < 30000 && !reachedItemAfterRetry; frame++, ts += FRAME_MS) {
      const roundedTs = Math.round(ts);
      const raw = retried
        ? validFrames(roundedTs, currentMovementId)
        : { timestampMs: roundedTs, landmarks: [] };
      const out = pipeline.process(raw);
      const u = orchestrator.update(out, ts < voiceBusyUntil);
      currentMovementId = u.currentMovementId;
      if (u.voice) voiceBusyUntil = ts + u.voice.cues.length * CUE_PLAY_MS;
      if (u.setupIssue && !retried) {
        setupIssues++;
        retried = true;
        orchestrator.retrySetup();
      }
      if (retried && !u.setupIssue && u.phase === 'item' && u.item && u.item.phase !== 'preflight') {
        reachedItemAfterRetry = true;
      }
    }

    expect(setupIssues).toBe(1);
    expect(reachedItemAfterRetry).toBe(true);
    expect(orchestrator.result).toBeNull();
  });
});
