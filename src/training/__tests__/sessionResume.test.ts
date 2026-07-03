/**
 * Mid-session resume: snapshot (de)serialization, the plan-matching rules
 * that decide when a surviving snapshot may continue a session, result
 * merging, and persistence through TrainingStore across a simulated restart.
 */

import { createMemoryFs } from '../../history/store';
import type { TrainingItemResult, TrainingSessionResult } from '../sessionPlayer';
import {
  SESSION_RESUME_MAX_AGE_MS,
  SESSION_RESUME_SCHEMA_VERSION,
  buildSessionInProgress,
  deserializeSessionInProgress,
  mergeResumedSessionResult,
  resumableSessionStart,
  serializeSessionInProgress,
  type SessionResumePlanInfo,
  type TrainingSessionInProgress,
} from '../sessionResume';
import { TrainingStore } from '../store';

const NOW = '2026-07-03T10:00:00.000Z';

function item(exerciseId: string, status: TrainingItemResult['status'] = 'completed'): TrainingItemResult {
  return { exerciseId, status, sets: [] };
}

const PLAN: SessionResumePlanInfo & { plannedDateKey: string } = {
  planId: 'plan-1',
  blockId: 'block-1',
  templateId: 'template-a',
  plannedDateKey: '2026-07-03',
  exerciseIds: ['sts', 'bridge', 'neck'],
};

function snapshot(overrides: Partial<TrainingSessionInProgress> = {}): TrainingSessionInProgress {
  return {
    ...buildSessionInProgress({
      startedAt: '2026-07-03T09:00:00.000Z',
      savedAt: '2026-07-03T09:10:00.000Z',
      plan: PLAN,
      completedItems: [item('sts')],
    }),
    ...overrides,
  };
}

describe('session-in-progress record', () => {
  it('round-trips', () => {
    const snap = snapshot();
    expect(deserializeSessionInProgress(serializeSessionInProgress(snap))).toEqual(snap);
    expect(snap.schemaVersion).toBe(SESSION_RESUME_SCHEMA_VERSION);
  });

  it('skips unknown schemas and malformed records', () => {
    const future = JSON.stringify({ ...snapshot(), schemaVersion: 999 });
    expect(deserializeSessionInProgress(future)).toBeNull();
    expect(deserializeSessionInProgress('nope')).toBeNull();
    expect(deserializeSessionInProgress('{"schemaVersion":1}')).toBeNull();
    const badItems = JSON.stringify({ ...snapshot(), completedItems: [{ exerciseId: 1 }] });
    expect(deserializeSessionInProgress(badItems)).toBeNull();
  });
});

describe('resumableSessionStart', () => {
  it('resumes the same plan after the last finished item', () => {
    const start = resumableSessionStart(snapshot(), PLAN, NOW);
    expect(start).not.toBeNull();
    expect(start!.remainingExerciseIds).toEqual(['bridge', 'neck']);
    expect(start!.completedItems).toEqual([item('sts')]);
    expect(start!.startedAt).toBe('2026-07-03T09:00:00.000Z');
  });

  it('skipped items count as finished for resume position', () => {
    const snap = snapshot({ completedItems: [item('sts'), item('bridge', 'skipped')] });
    const start = resumableSessionStart(snap, PLAN, NOW);
    expect(start!.remainingExerciseIds).toEqual(['neck']);
  });

  it('never resumes a different plan, day, template, or exercise list', () => {
    expect(resumableSessionStart(snapshot(), { ...PLAN, planId: 'plan-2' }, NOW)).toBeNull();
    expect(resumableSessionStart(snapshot(), { ...PLAN, blockId: 'block-2' }, NOW)).toBeNull();
    expect(resumableSessionStart(snapshot(), { ...PLAN, templateId: undefined }, NOW)).toBeNull();
    expect(resumableSessionStart(snapshot(), { ...PLAN, plannedDateKey: '2026-07-04' }, NOW)).toBeNull();
    expect(resumableSessionStart(snapshot(), { ...PLAN, plannedDateKey: undefined }, NOW)).toBeNull();
    expect(
      resumableSessionStart(snapshot(), { ...PLAN, exerciseIds: ['sts', 'neck', 'bridge'] }, NOW)
    ).toBeNull();
  });

  it('requires banked progress in play order', () => {
    expect(resumableSessionStart(snapshot({ completedItems: [] }), PLAN, NOW)).toBeNull();
    const outOfOrder = snapshot({ completedItems: [item('bridge')] });
    expect(resumableSessionStart(outOfOrder, PLAN, NOW)).toBeNull();
  });

  it('a fully-banked snapshot resumes with nothing left to run', () => {
    const snap = snapshot({ completedItems: [item('sts'), item('bridge'), item('neck')] });
    const start = resumableSessionStart(snap, PLAN, NOW);
    expect(start!.remainingExerciseIds).toEqual([]);
  });

  it('rejects stale or time-warped snapshots', () => {
    const stale = snapshot({
      savedAt: new Date(Date.parse(NOW) - SESSION_RESUME_MAX_AGE_MS - 1).toISOString(),
    });
    expect(resumableSessionStart(stale, PLAN, NOW)).toBeNull();
    const fromTheFuture = snapshot({ savedAt: '2026-07-03T11:00:00.000Z' });
    expect(resumableSessionStart(fromTheFuture, PLAN, NOW)).toBeNull();
    expect(resumableSessionStart(null, PLAN, NOW)).toBeNull();
  });
});

describe('mergeResumedSessionResult', () => {
  const runResult: TrainingSessionResult = {
    startedAt: '2026-07-03T09:40:00.000Z',
    items: [item('bridge'), item('neck')],
  };

  it('prepends banked items and restores the original start time', () => {
    const merged = mergeResumedSessionResult(
      { completedItems: [item('sts')], startedAt: '2026-07-03T09:00:00.000Z' },
      runResult
    );
    expect(merged.startedAt).toBe('2026-07-03T09:00:00.000Z');
    expect(merged.items.map((i) => i.exerciseId)).toEqual(['sts', 'bridge', 'neck']);
  });

  it('passes a fresh run through untouched', () => {
    expect(mergeResumedSessionResult(null, runResult)).toBe(runResult);
  });
});

describe('TrainingStore session-in-progress persistence', () => {
  it('survives a restart, overwrites in place, and clears', async () => {
    const files = new Map<string, string>();
    const store = new TrainingStore(createMemoryFs(files));
    store.saveSessionInProgress(snapshot());
    store.saveSessionInProgress(snapshot({ completedItems: [item('sts'), item('bridge')] }));

    const reloaded = new TrainingStore(createMemoryFs(files));
    const loaded = await reloaded.loadSessionInProgress();
    expect(loaded?.completedItems).toHaveLength(2);

    reloaded.clearSessionInProgress();
    expect(await reloaded.loadSessionInProgress()).toBeNull();
  });
});
