/**
 * In-flight session snapshot (resume slice): serialization round-trips a real
 * generated plan (including NaN metric fields, which JSON nulls), corruption
 * degrades to null (no resume offer, never a half-trusted plan), and the
 * boot-time disposition follows the same-local-day rules.
 */

import { createMemoryFs } from '../../history/store';
import type { TrainingItemResult } from '../../training/voiceSessionPlayer';
import { freshPatternLadderState } from '../promotion';
import { defaultProgrammeState } from '../serialize';
import { generateProgrammeSession, type ProgrammeSessionPlan } from '../session';
import {
  PROGRAMME_SESSION_SNAPSHOT_SCHEMA_VERSION,
  ProgrammeSessionSnapshotStore,
  decideProgrammeSessionSnapshot,
  deserializeProgrammeSessionSnapshot,
  serializeProgrammeSessionSnapshot,
  type ProgrammeSessionSnapshot,
} from '../sessionSnapshot';
import type { ProgrammeState } from '../types';
import { voiceSessionInputsFromPlan } from '../voiceSession';

function onboardedState(): ProgrammeState {
  const state = defaultProgrammeState();
  state.profile = { ...state.profile, consentHealthData: true, hasStairs: true };
  state.onboardingCompletedAtIso = '2026-07-06T09:00:00.000Z';
  return state;
}

function samplePlan(): ProgrammeSessionPlan {
  const state = onboardedState();
  state.ladders.core = freshPatternLadderState('core', 4);
  return generateProgrammeSession({
    state,
    template: 'A',
    preset: 'standard',
    lastSessionEffort: 'lots',
  });
}

function voiceGuidedItem(exerciseId: string, reportedReps?: number): TrainingItemResult {
  return {
    exerciseId,
    status: 'completed',
    sets: [
      {
        exerciseId,
        reps: 0,
        meanVel: NaN,
        holdSec: NaN,
        romPeak: NaN,
        autoregulated: false,
        reachedTarget: true,
        interruptions: 0,
        flags: ['voice-guided'],
        ...(reportedReps !== undefined ? { reportedReps } : {}),
      },
    ],
  };
}

function sampleSnapshot(): ProgrammeSessionSnapshot {
  const plan = samplePlan();
  return {
    schemaVersion: PROGRAMME_SESSION_SNAPSHOT_SCHEMA_VERSION,
    startedAtIso: '2026-07-16T09:00:00.000Z',
    savedAtIso: '2026-07-16T09:12:00.000Z',
    plan,
    completedItems: [
      voiceGuidedItem('programme.prep'),
      voiceGuidedItem(plan.main[0].exerciseId, plan.main[0].repTargetPerSet),
      { exerciseId: plan.main[1].exerciseId, status: 'skipped', skipReason: 'pain', sets: [] },
    ],
  };
}

describe('snapshot serialization', () => {
  it('round-trips a real generated plan and voice-guided items (NaN restored)', () => {
    const snapshot = sampleSnapshot();
    const revived = deserializeProgrammeSessionSnapshot(
      serializeProgrammeSessionSnapshot(snapshot)
    );
    expect(revived).not.toBeNull();
    expect(revived!.startedAtIso).toBe(snapshot.startedAtIso);
    expect(revived!.plan).toEqual(snapshot.plan);
    expect(revived!.completedItems.map((item) => item.exerciseId)).toEqual(
      snapshot.completedItems.map((item) => item.exerciseId)
    );
    expect(revived!.completedItems[2].skipReason).toBe('pain');
    // NaN metric fields survive the JSON null round-trip.
    const set = revived!.completedItems[0].sets[0];
    expect(Number.isNaN(set.meanVel)).toBe(true);
    expect(Number.isNaN(set.holdSec)).toBe(true);
    expect(revived!.completedItems[1].sets[0].reportedReps).toBe(
      snapshot.plan.main[0].repTargetPerSet
    );
    // The revived plan still drives the bridge (the property resume relies on).
    const inputs = voiceSessionInputsFromPlan(revived!.plan);
    for (const id of inputs.exerciseIds) expect(inputs.resolveExercise(id).id).toBe(id);
  });

  it('rejects corruption wholesale: bad version, mangled plan, mangled items', () => {
    const good = sampleSnapshot();
    expect(deserializeProgrammeSessionSnapshot('not json')).toBeNull();
    expect(deserializeProgrammeSessionSnapshot('42')).toBeNull();
    expect(
      deserializeProgrammeSessionSnapshot(JSON.stringify({ ...good, schemaVersion: 99 }))
    ).toBeNull();
    expect(
      deserializeProgrammeSessionSnapshot(JSON.stringify({ ...good, startedAtIso: 'yesterday' }))
    ).toBeNull();
    expect(
      deserializeProgrammeSessionSnapshot(
        JSON.stringify({ ...good, plan: { ...good.plan, template: 'C' } })
      )
    ).toBeNull();
    expect(
      deserializeProgrammeSessionSnapshot(
        JSON.stringify({
          ...good,
          plan: { ...good.plan, main: [{ exerciseId: 'squat.air_squat' }] },
        })
      )
    ).toBeNull();
    expect(
      deserializeProgrammeSessionSnapshot(
        JSON.stringify({
          ...good,
          completedItems: [{ exerciseId: 'x', status: 'paused', sets: [] }],
        })
      )
    ).toBeNull();
  });
});

describe('snapshot store', () => {
  it('saves, loads, and clears through the injectable fs', async () => {
    const store = new ProgrammeSessionSnapshotStore(createMemoryFs());
    expect(await store.load()).toBeNull();
    const snapshot = sampleSnapshot();
    store.save(snapshot);
    expect((await store.load())?.startedAtIso).toBe(snapshot.startedAtIso);
    store.clear();
    expect(await store.load()).toBeNull();
  });

  it('clear() works on adapters without delete (tombstone fallback)', async () => {
    const files = new Map<string, string>();
    const fs = createMemoryFs(files);
    const store = new ProgrammeSessionSnapshotStore({
      list: fs.list,
      read: fs.read,
      write: fs.write,
    });
    store.save(sampleSnapshot());
    store.clear();
    expect(await store.load()).toBeNull();
  });
});

describe('boot-time disposition', () => {
  const planIds = (snapshot: ProgrammeSessionSnapshot) =>
    voiceSessionInputsFromPlan(snapshot.plan).exerciseIds;

  it('same local day with work remaining → offer resume', () => {
    const snapshot = sampleSnapshot();
    expect(
      decideProgrammeSessionSnapshot(snapshot, {
        nowIso: '2026-07-16T20:00:00.000Z',
        planExerciseIds: planIds(snapshot),
      })
    ).toEqual({ kind: 'offer_resume' });
  });

  it('older with finished work → apply partial; older with nothing → discard', () => {
    const snapshot = sampleSnapshot();
    expect(
      decideProgrammeSessionSnapshot(snapshot, {
        nowIso: '2026-07-17T08:00:00.000Z',
        planExerciseIds: planIds(snapshot),
      })
    ).toEqual({ kind: 'apply_partial' });

    const empty = { ...snapshot, completedItems: [] };
    expect(
      decideProgrammeSessionSnapshot(empty, {
        nowIso: '2026-07-17T08:00:00.000Z',
        planExerciseIds: planIds(empty),
      })
    ).toEqual({ kind: 'discard' });
  });

  it('every plan item handled → apply full, regardless of day', () => {
    const snapshot = sampleSnapshot();
    const allDone = {
      ...snapshot,
      completedItems: planIds(snapshot).map((exerciseId) => voiceGuidedItem(exerciseId)),
    };
    expect(
      decideProgrammeSessionSnapshot(allDone, {
        nowIso: '2026-07-16T20:00:00.000Z',
        planExerciseIds: planIds(allDone),
      })
    ).toEqual({ kind: 'apply_full' });
    expect(
      decideProgrammeSessionSnapshot(allDone, {
        nowIso: '2026-07-19T20:00:00.000Z',
        planExerciseIds: planIds(allDone),
      })
    ).toEqual({ kind: 'apply_full' });
  });
});
