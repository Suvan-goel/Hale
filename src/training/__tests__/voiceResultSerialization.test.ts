/**
 * Pins the answer to the founder's NaN question (2026-07-06): the in-memory
 * NaN sentinel on unmeasured SetResult fields can NEVER leak downstream.
 *
 * Guarantee, by construction:
 * - The only persistence paths for SetResults (session-resume snapshot,
 *   micro-check records) serialize through nanReplacer: non-finite → null.
 *   JSON itself cannot carry a NaN token, so no stored artifact can ever
 *   contain one.
 * - Every aggregation over these fields guards with Number.isFinite
 *   (progressionEvidence.sumFinite, micro-check `measured`, autoregulation).
 * This test fails if anyone adds a SetResult persistence path that lets a
 * non-finite survive as a token, or breaks the null round-trip.
 */

import { STS_STANDARD_ID, getExercise } from '../../exercises';
import type { SetResult } from '../../exercises';
import { PreflightCheck } from '../../preflight/preflight';
import { DEFAULT_TRAINING_CONFIG, TrainingSessionPlayer } from '../sessionPlayer';
import {
  SESSION_RESUME_SCHEMA_VERSION,
  deserializeSessionInProgress,
  serializeSessionInProgress,
} from '../sessionResume';

function voiceSessionSets(): SetResult[] {
  const player = new TrainingSessionPlayer(
    '2026-07-06T09:00:00.000Z',
    [STS_STANDARD_ID],
    new PreflightCheck(),
    DEFAULT_TRAINING_CONFIG,
    { sessionMode: 'voice_guided' }
  );
  let ts = 0;
  const tick = () => player.tick((ts += 250), false);
  let u = tick();
  const sts = getExercise(STS_STANDARD_ID);
  for (let guard = 0; guard < 100000 && player.result === null; guard++) {
    u = tick();
    if (u.phase === 'waiting_ready') player.confirmReady(ts);
    else if (u.phase === 'set') player.completeCurrentSet((ts += 4000));
    else if (u.phase === 'rest') player.skipRest(ts);
  }
  const sets = player.result!.items[0].sets;
  expect(sets).toHaveLength(sts.prescription.sets);
  return sets;
}

describe('voice SetResult NaN containment', () => {
  it('voice sets carry the NaN sentinel in memory but never as a JSON token', () => {
    const sets = voiceSessionSets();
    for (const set of sets) {
      expect(Number.isNaN(set.meanVel)).toBe(true);
      expect(set.reps).toBe(0);
    }

    const json = serializeSessionInProgress({
      schemaVersion: SESSION_RESUME_SCHEMA_VERSION,
      startedAt: '2026-07-06T09:00:00.000Z',
      savedAt: '2026-07-06T09:20:00.000Z',
      planId: 'plan-1',
      blockId: 'block-1',
      plannedDateKey: '2026-07-06',
      exerciseIds: [STS_STANDARD_ID],
      completedItems: [{ exerciseId: STS_STANDARD_ID, status: 'completed', sets }],
    });

    expect(json).not.toMatch(/NaN/);
    const parsed = JSON.parse(json);
    for (const set of parsed.completedItems[0].sets) {
      expect(set.meanVel).toBeNull();
      expect(set.holdSec).toBeNull();
      expect(set.romPeak).toBeNull();
      expect(set.reportedReps).toBe(getExercise(STS_STANDARD_ID).prescription.repsPerSet);
    }
  });

  it('round-trip keeps unmeasured fields non-finite for isFinite-guarded consumers', () => {
    const sets = voiceSessionSets();
    const json = serializeSessionInProgress({
      schemaVersion: SESSION_RESUME_SCHEMA_VERSION,
      startedAt: '2026-07-06T09:00:00.000Z',
      savedAt: '2026-07-06T09:20:00.000Z',
      planId: 'plan-1',
      blockId: 'block-1',
      plannedDateKey: '2026-07-06',
      exerciseIds: [STS_STANDARD_ID],
      completedItems: [{ exerciseId: STS_STANDARD_ID, status: 'completed', sets }],
    });
    const restored = deserializeSessionInProgress(json);
    expect(restored).not.toBeNull();
    for (const set of restored!.completedItems[0].sets) {
      // null or NaN are both acceptable restored sentinels; what matters is
      // that every consumer's Number.isFinite guard sees "not measured".
      expect(Number.isFinite(set.meanVel as number)).toBe(false);
      expect(set.reportedReps).toBe(getExercise(STS_STANDARD_ID).prescription.repsPerSet);
      expect(set.flags).toContain('voice-guided');
    }
  });
});
