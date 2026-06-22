/**
 * M3 acceptance — velocity autoregulation as a USER-VISIBLE session behaviour.
 * A real chair-stand recording whose rises decay in speed is driven through the
 * full TrainingSessionPlayer (pipeline → set grader → player). We assert that
 * the player ends the strength set EARLY, speaks "good, that's your set", and
 * logs the set as a normal completion (autoregulated, never failed).
 *
 * The recording front-loads a long standing lead-in so the player reaches the
 * 'set' phase before the rises begin; after the recording it is padded with its
 * final frame so the remaining prescribed sets cap out and the session finishes.
 */

import { VoiceCueKey } from '../../audio/cues';
import { STS_STANDARD_ID } from '../../exercises';
import { PosePipeline } from '../../pose/pipeline';
import { chairStandSession } from '../../pose/testing/syntheticChairStand';
import { RawLandmarkEvent } from '../../pose/types';
import { PreflightCheck } from '../../preflight/preflight';
import { DEFAULT_TRAINING_CONFIG, TrainingSessionPlayer } from '../sessionPlayer';

const FRAME_STEP_MS = Math.round(1000 / 30);
const CUE_PLAY_MS = 1200;

function paddedFrames(rec: RawLandmarkEvent[], totalFrames: number): RawLandmarkEvent[] {
  const out = rec.slice();
  let ts = out.length > 0 ? out[out.length - 1].timestampMs : 0;
  const lastLandmarks = out.length > 0 ? out[out.length - 1].landmarks : [];
  while (out.length < totalFrames) {
    ts += FRAME_STEP_MS;
    out.push({ timestampMs: ts, landmarks: lastLandmarks });
  }
  return out;
}

describe('velocity autoregulation through the session player', () => {
  it('ends the strength set early, speaks the line, and logs a normal completion', () => {
    // Long standing lead-in (the player needs to frame + instruct + safety cues
    // + count down before the first rise), then four fast rises set the best and
    // two slow rises trip autoregulation well before the rep target of 10.
    const session = chairStandSession({
      seed: 51,
      calibrationMs: 32000,
      riseMsPerRep: [900, 900, 900, 900, 2200, 2200, 900, 900],
    });
    const frames = paddedFrames(session.frames, 13000);

    const pipeline = new PosePipeline();
    const preflight = new PreflightCheck();
    const player = new TrainingSessionPlayer('2026-06-14T09:00:00.000Z', [STS_STANDARD_ID], preflight, {
      ...DEFAULT_TRAINING_CONFIG,
      // Long enough for set 1's ~8 slow rises to play; sets 2 & 3 see a static
      // subject and also cap here.
      setSafetyMs: 60000,
    });

    const spoken: VoiceCueKey[] = [];
    let voiceBusyUntil = -1;
    let sawSetPhase = false;
    for (const frame of frames) {
      const ts = frame.timestampMs;
      const out = pipeline.process(frame);
      const u = player.update(out, ts < voiceBusyUntil);
      if (u.phase === 'set') sawSetPhase = true;
      if (u.voice) {
        spoken.push(...(u.voice.cues as VoiceCueKey[]));
        voiceBusyUntil = ts + u.voice.cues.length * CUE_PLAY_MS;
      }
      if (u.phase === 'done') break;
    }

    expect(sawSetPhase).toBe(true);
    const result = player.result;
    expect(result).not.toBeNull();
    const firstSet = result!.items[0].sets[0];

    // The set ended on autoregulation, before the rep target and the later rises.
    expect(firstSet.autoregulated).toBe(true);
    expect(firstSet.reps).toBeGreaterThanOrEqual(5);
    expect(firstSet.reps).toBeLessThan(8);
    // A normal completion — never marked a failure.
    expect(firstSet.flags).not.toContain('failed');
    expect(result!.items[0].status).toBe('completed');
    // The player relayed the autoregulation line to the user.
    expect(spoken).toContain('thats-your-set');
  });
});
