/**
 * Training persistence + state transitions: the TrainingState round-trips
 * through the store across a simulated restart, micro-checks append and reload,
 * a foreign schema version is skipped (forward-compatible), and the
 * session-completion glue advances progress and stamps the re-test marker on
 * the final session.
 */

import { createMemoryFs } from '../../history';
import { buildBlock } from '../block';
import { TrainingItemResult, TrainingSessionResult } from '../sessionPlayer';
import { STS_STANDARD_ID, getExercise } from '../../exercises';
import { CheckUpScore } from '../../scoring';
import { TrainingStore } from '../store';
import { defaultTrainingState, deserializeTrainingState } from '../serialize';
import { nextSessionExercises, recordCompletedSession, retestDue, startBlock } from '../state';

const score = (): CheckUpScore => ({ startedAt: '2026-06-14T08:00:00.000Z', domains: [], weakestDomain: 'strength' });

describe('TrainingStore persistence', () => {
  it('round-trips training state across a restart', async () => {
    const files = new Map<string, string>();
    const block = buildBlock(score(), { stair: false, band: false }, '2026-06-14T09:00:00.000Z');
    let state = startBlock(defaultTrainingState(), block);
    state = { ...state, progression: { levels: { 'sit-to-stand': 3 }, velHistory: { [STS_STANDARD_ID]: [0.9, NaN] } } };

    new TrainingStore(createMemoryFs(files)).saveState(state);
    // Fresh store over the SAME files simulates an app restart.
    const reloaded = await new TrainingStore(createMemoryFs(files)).loadState();

    expect(reloaded.progression.levels['sit-to-stand']).toBe(3);
    expect(reloaded.block?.weakestDomain).toBe('strength');
    expect(reloaded.equipment.stair).toBe(false);
    // NaN velocity survived as null → read back as null inside the array.
    expect(reloaded.progression.velHistory[STS_STANDARD_ID][1]).toBeNull();
  });

  it('defaults cleanly when nothing is stored', async () => {
    const store = new TrainingStore(createMemoryFs());
    const state = await store.loadState();
    expect(state.block).toBeNull();
    expect(state.progress.completedSessions).toBe(0);
  });

  it('appends and reloads micro-checks oldest-first, skipping unmeasured NaN cleanly', async () => {
    const files = new Map<string, string>();
    const store = new TrainingStore(createMemoryFs(files));
    store.saveMicroCheck({ type: 'chair-power', startedAt: '2026-06-21T08:00:00.000Z', value: 0.42, reps: 5, measured: true });
    store.saveMicroCheck({ type: 'single-leg-balance', startedAt: '2026-06-14T08:00:00.000Z', value: 18, reps: 0, measured: true });
    const checks = await new TrainingStore(createMemoryFs(files)).loadMicroChecks();
    expect(checks.map((c) => c.startedAt)).toEqual([
      '2026-06-14T08:00:00.000Z',
      '2026-06-21T08:00:00.000Z',
    ]);
  });

  it('skips a record from an unknown schema version', () => {
    expect(deserializeTrainingState(JSON.stringify({ schemaVersion: 99, payload: {} }))).toBeNull();
  });

  it('loads old minimal v1 state with empty dynamic progress fields', () => {
    const parsed = deserializeTrainingState(
      JSON.stringify({
        schemaVersion: 1,
        payload: {
          block: null,
          progression: { levels: {}, velHistory: {} },
          equipment: { stair: false, band: false },
          progress: { completedSessions: 0, lastSessionAt: null, retestDueAt: null },
        },
      })
    );

    expect(parsed?.ladderProgressById).toEqual({});
    expect(parsed?.generatedSessionSummaries).toEqual([]);
    expect(parsed?.lastPostSessionFeedback).toBeNull();
    expect(parsed?.planPreferences.preferredIntensity).toBe('standard');
  });

  it('persists dynamic ladder progress and generated session summaries', async () => {
    const files = new Map<string, string>();
    const store = new TrainingStore(createMemoryFs(files));
    const state = {
      ...defaultTrainingState(),
      ladderProgressById: {
        'sit-to-stand': {
          ladderId: 'sit-to-stand',
          currentLevelId: STS_STANDARD_ID,
          currentLevelIndex: 1,
          completedSessionsAtLevel: 1,
          failedSessionsAtLevel: 0,
          recentCompletionRates: [1],
          recentRpe: [2],
          recentPain: [false],
          lastRpe: 2,
          lastPain: false,
          lastTrackingQuality: 'good' as const,
          lastCompletedAt: '2026-06-16T09:00:00.000Z',
          readyToProgress: true,
          updatedAt: '2026-06-16T09:00:00.000Z',
        },
      },
      generatedSessionSummaries: [
        {
          id: 'generated-session-1',
          blockId: 'block-1',
          source: 'block_generated' as const,
          templateId: 'strength-A',
          title: 'Strength Session A',
          completedAt: '2026-06-16T09:00:00.000Z',
          exerciseIds: [STS_STANDARD_ID],
          ladderIds: ['sit-to-stand'],
          readiness: 'ready' as const,
          durationMinutes: 20,
        },
      ],
      lastPostSessionFeedback: {
        sessionId: 'generated-session-1',
        rpe: 2 as const,
        discomfort: false,
        completed: true,
        trackingQuality: 'good' as const,
        submittedAt: '2026-06-16T09:05:00.000Z',
      },
    };

    store.saveState(state);
    const reloaded = await new TrainingStore(createMemoryFs(files)).loadState();

    expect(reloaded.ladderProgressById['sit-to-stand'].currentLevelId).toBe(STS_STANDARD_ID);
    expect(reloaded.generatedSessionSummaries[0].templateId).toBe('strength-A');
    expect(reloaded.lastPostSessionFeedback?.rpe).toBe(2);
    expect(reloaded.planPreferences.preferredIntensity).toBe('standard');
  });

  it('persists local plan preferences', async () => {
    const files = new Map<string, string>();
    const store = new TrainingStore(createMemoryFs(files));
    store.saveState({
      ...defaultTrainingState(),
      planPreferences: { preferredIntensity: 'gentle' },
    });

    const reloaded = await new TrainingStore(createMemoryFs(files)).loadState();

    expect(reloaded.planPreferences.preferredIntensity).toBe('gentle');
  });
});

describe('session-completion glue', () => {
  function completedSession(exerciseId: string): TrainingSessionResult {
    const item: TrainingItemResult = {
      exerciseId,
      status: 'completed',
      sets: Array.from({ length: getExercise(exerciseId).prescription.sets }, () => ({
        exerciseId,
        reps: getExercise(exerciseId).prescription.repsPerSet ?? 0,
        meanVel: 0.9,
        holdSec: NaN,
        romPeak: NaN,
        autoregulated: false,
        reachedTarget: true,
        interruptions: 0,
        flags: [],
      })),
    };
    return { startedAt: '2026-06-15T08:00:00.000Z', items: [item] };
  }

  it('advances progress and stamps the re-test marker on the final session', () => {
    const block = buildBlock(score(), { stair: false, band: false }, '2026-06-14T09:00:00.000Z');
    let state = startBlock(defaultTrainingState(), block);
    expect(nextSessionExercises(state)).not.toBeNull();

    for (let i = 0; i < 12; i++) {
      expect(retestDue(state)).toBe(false);
      state = recordCompletedSession(state, completedSession(STS_STANDARD_ID), `2026-06-15T0${i}:00:00.000Z`);
    }
    expect(state.progress.completedSessions).toBe(12);
    expect(retestDue(state)).toBe(true);
    expect(nextSessionExercises(state)).toBeNull(); // block done — no dead end, a clean stop
  });
});
