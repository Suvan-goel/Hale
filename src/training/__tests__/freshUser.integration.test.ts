/**
 * Fresh-user acceptance: check-up → block → first session, with NO dead ends.
 * A real chair-stand measurement is scored, the weakest domain drives a block,
 * the first session resolves to runnable exercises (with the no-stair step-up
 * substitution applied), and the whole session runs through the player to
 * 'done' — then folds back into state, advancing progress for the next session.
 */

import { CHAIR_STAND_ID, ChairStandResult } from '../../movements';
import { CheckUp } from '../../checkup/types';
import { PosePipeline } from '../../pose/pipeline';
import { gradeRecording } from '../../replay/gradeRecording';
import { chairStandSession } from '../../pose/testing/syntheticChairStand';
import { makeFrame, mulberry32 } from '../../pose/testing/syntheticPose';
import { PreflightCheck } from '../../preflight/preflight';
import { scoreCheckUp } from '../../scoring';
import { buildBlock } from '../block';
import { defaultTrainingState } from '../serialize';
import { nextSessionExercises, recordCompletedSession, startBlock } from '../state';
import { DEFAULT_TRAINING_CONFIG, TrainingSessionPlayer } from '../sessionPlayer';

describe('fresh user: check-up → block → first session', () => {
  it('flows end to end with no dead ends', () => {
    // 1. A real chair-stand measurement → a coherent score (strength measured).
    const cs = gradeRecording<ChairStandResult>(CHAIR_STAND_ID, chairStandSession({ seed: 9 }).frames).result;
    const checkUp: CheckUp = {
      startedAt: '2026-06-14T08:00:00.000Z',
      bodyUnit: 0.34,
      items: [{ movementId: CHAIR_STAND_ID, status: 'measured', result: cs }],
    };
    const score = scoreCheckUp(checkUp);
    expect(score.weakestDomain).toBe('strength');

    // 2. Block from the score; the user has no stair → step-up must substitute.
    const block = buildBlock(score, { stair: false, band: false }, '2026-06-14T09:00:00.000Z');
    const state = startBlock(defaultTrainingState(), block);
    const ids = nextSessionExercises(state);
    expect(ids).not.toBeNull();
    expect(ids).toContain('sts-standard'); // step-up's zero-equipment substitute
    expect(ids).not.toContain('step-up');

    // 3. Run the whole first session through the player to completion.
    const pipeline = new PosePipeline();
    const preflight = new PreflightCheck();
    const player = new TrainingSessionPlayer('2026-06-15T08:00:00.000Z', ids as string[], preflight, {
      ...DEFAULT_TRAINING_CONFIG,
      setSafetyMs: 2500,
    });
    const rng = mulberry32(3);
    let voiceBusyUntil = -1;
    let ts = 0;
    let done = false;
    for (let i = 0; i < 80000; i++, ts += 1000 / 30) {
      const out = pipeline.process(makeFrame(Math.round(ts), rng));
      const u = player.update(out, ts < voiceBusyUntil);
      if (u.voice) voiceBusyUntil = ts + u.voice.cues.length * 1000;
      if (u.phase === 'done') {
        done = true;
        break;
      }
    }
    expect(done).toBe(true);
    const result = player.result!;
    expect(result.items).toHaveLength((ids as string[]).length);
    for (const item of result.items) expect(item.status).toBe('completed'); // framed throughout

    // 4. Fold the session back in — progress advances, ready for session 2.
    const next = recordCompletedSession(state, result, '2026-06-15T09:00:00.000Z');
    expect(next.progress.completedSessions).toBe(1);
    expect(nextSessionExercises(next)).not.toBeNull();
  });
});
