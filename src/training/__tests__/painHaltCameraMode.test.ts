/**
 * Retroactive audit closure (standing rule, 2026-07-06): the camera-mode
 * branch of recordPainHalt was shipped with only the shared block covered by
 * voice tests. This drives the CAMERA player headlessly and proves the
 * "something hurts" tap works there too: skip-style teardown, pain recorded,
 * exercise skipped with skipReason, session continues.
 */

import { BALANCE_FEET_TOGETHER_ID, STS_STANDARD_ID } from '../../exercises';
import { PosePipeline } from '../../pose/pipeline';
import { makeFrame, mulberry32 } from '../../pose/testing/syntheticPose';
import { PreflightCheck } from '../../preflight/preflight';
import { TrainingSessionPlayer } from '../sessionPlayer';

const FRAME_MS = 1000 / 30;

describe('recordPainHalt in camera mode', () => {
  it('halts, records the pain event, skips the exercise, and moves on', () => {
    const pipeline = new PosePipeline();
    const player = new TrainingSessionPlayer(
      '2026-07-06T09:00:00.000Z',
      [STS_STANDARD_ID, BALANCE_FEET_TOGETHER_ID],
      new PreflightCheck()
    );
    const rng = mulberry32(7);
    let ts = 0;
    let voiceBusyUntil = -1;
    let phase = 'intro';

    // Drive real frames until the first item is past its transition (any
    // phase but intro/transition/complete/done accepts the pain tap).
    for (let i = 0; i < 4000 && (phase === 'intro' || phase === 'transition'); i++) {
      ts += FRAME_MS;
      const u = player.update(pipeline.process(makeFrame(Math.round(ts), rng)), ts < voiceBusyUntil);
      if (u.voice) voiceBusyUntil = ts + u.voice.cues.length * 1200;
      phase = u.phase;
    }
    expect(['preflight', 'instructions', 'countdown', 'set']).toContain(phase);

    expect(player.recordPainHalt(ts)).toBe(true);
    expect(player.painEventsSnapshot()).toEqual([
      { exerciseId: STS_STANDARD_ID, setIndex: 0, timestampMs: ts },
    ]);

    const items = player.completedItemsSnapshot();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      exerciseId: STS_STANDARD_ID,
      status: 'skipped',
      skipReason: 'pain',
    });

    // The session continues to the next exercise rather than ending.
    let u = player.update(pipeline.process(makeFrame(Math.round((ts += FRAME_MS)), rng)), false);
    for (let i = 0; i < 600 && u.currentExerciseId !== BALANCE_FEET_TOGETHER_ID; i++) {
      ts += FRAME_MS;
      u = player.update(pipeline.process(makeFrame(Math.round(ts), rng)), ts < voiceBusyUntil);
      if (u.voice) voiceBusyUntil = ts + u.voice.cues.length * 1200;
    }
    expect(u.currentExerciseId).toBe(BALANCE_FEET_TOGETHER_ID);
    expect(['transition', 'preflight', 'instructions']).toContain(u.phase);
  });

  it('rejects the tap in intro/transition and never in a way that loses data', () => {
    const player = new TrainingSessionPlayer(
      '2026-07-06T09:00:00.000Z',
      [STS_STANDARD_ID],
      new PreflightCheck()
    );
    // Before any update tick the player is in intro.
    expect(player.recordPainHalt(0)).toBe(false);
    expect(player.painEventsSnapshot()).toEqual([]);
  });
});
