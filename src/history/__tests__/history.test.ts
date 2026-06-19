/**
 * History persistence + trends, all pure (in-memory fs adapter — no native
 * module). Covers schema-versioned (de)serialization incl. NaN→null, migration
 * rejection of foreign records, survival across a simulated restart, and
 * first→latest trend deltas with unmeasured points dropped.
 */

import { CheckUp } from '../../checkup/types';
import {
  BALANCE_LADDER_ID,
  CHAIR_STAND_ID,
  TUG_ID,
} from '../../movements';
import { HISTORY_SCHEMA_VERSION, deserializeCheckUp, migrate, serializeCheckUp } from '../serialize';
import { HistoryStore, createMemoryFs } from '../store';
import { computeTrends, hasTrend } from '../trends';

interface Vals {
  reps?: number;
  vel?: number;
  singleLeg?: number;
  tug?: number;
}

function makeCheckUp(startedAt: string, v: Vals): CheckUp {
  return {
    startedAt,
    bodyUnit: 0.33,
    items: [
      {
        movementId: CHAIR_STAND_ID,
        status: 'measured',
        result: {
          movementId: CHAIR_STAND_ID,
          flags: [],
          interruptions: 0,
          reps: v.reps ?? 0,
          repStats: [],
          sessionMeanVel: v.vel ?? NaN,
          sessionMeanPeakVel: NaN,
          pushOffDetected: false,
        } as never,
      },
      {
        movementId: BALANCE_LADDER_ID,
        status: 'measured',
        result: {
          movementId: BALANCE_LADDER_ID,
          flags: [],
          interruptions: 0,
          stages: [],
          singleLegEyesOpenSec: v.singleLeg ?? NaN,
        } as never,
      },
      {
        movementId: TUG_ID,
        status: 'measured',
        result: {
          movementId: TUG_ID,
          flags: [],
          interruptions: 0,
          totalSec: v.tug ?? NaN,
          completed: v.tug !== undefined,
          turnDetected: true,
          peakExcursionBu: 1.9,
          nonStandardShortPath: false,
        } as never,
      },
    ],
  };
}

describe('check-up serialization', () => {
  it('round-trips through the current schema, NaN → null', () => {
    const stored = deserializeCheckUp(serializeCheckUp(makeCheckUp('2026-06-13T10:00:00.000Z', { reps: 14 })));
    expect(stored).not.toBeNull();
    expect(stored!.schemaVersion).toBe(HISTORY_SCHEMA_VERSION);
    expect(stored!.checkUp.items).toHaveLength(3);
    const chair = stored!.checkUp.items[0].result as unknown as { reps: number; sessionMeanVel: number | null };
    expect(chair.reps).toBe(14);
    expect(chair.sessionMeanVel).toBeNull(); // NaN persisted as null
  });

  it('migrate rejects garbage, foreign versions, and malformed records', () => {
    expect(migrate(null)).toBeNull();
    expect(migrate({ schemaVersion: 999, checkUp: { startedAt: 'x', items: [] } })).toBeNull();
    expect(migrate({ schemaVersion: HISTORY_SCHEMA_VERSION, checkUp: {} })).toBeNull();
    expect(deserializeCheckUp('not json')).toBeNull();
  });
});

describe('history store', () => {
  it('persists check-ups and survives a restart, oldest first', async () => {
    const disk = new Map<string, string>();
    const store1 = new HistoryStore(createMemoryFs(disk));
    store1.save(makeCheckUp('2026-05-10T09:00:00.000Z', { reps: 12 }));
    store1.save(makeCheckUp('2026-06-13T09:00:00.000Z', { reps: 14 }));

    // New store over the same "disk" = a fresh app launch.
    const store2 = new HistoryStore(createMemoryFs(disk));
    const all = await store2.loadAll();
    expect(all).toHaveLength(2);
    expect(all.map((r) => r.checkUp.startedAt)).toEqual([
      '2026-05-10T09:00:00.000Z',
      '2026-06-13T09:00:00.000Z',
    ]);
    expect((await store2.latest())!.checkUp.startedAt).toBe('2026-06-13T09:00:00.000Z');
  });
});

describe('trends', () => {
  const records = [
    makeCheckUp('2026-04-01T10:00:00.000Z', { reps: 11, vel: 0.18, singleLeg: 8, tug: 10.5 }),
    makeCheckUp('2026-05-01T10:00:00.000Z', { reps: 13, vel: 0.21, singleLeg: 10 }), // no TUG this time
    makeCheckUp('2026-06-01T10:00:00.000Z', { reps: 15, vel: 0.24, singleLeg: 12, tug: 9.0 }),
  ].map((c) => ({ schemaVersion: HISTORY_SCHEMA_VERSION, checkUp: c }));

  it('reports chronological points and first→latest deltas', () => {
    const trends = computeTrends(records);
    const vel = trends.find((t) => t.key === 'rise-velocity')!;
    expect(vel.points.map((p) => p.value)).toEqual([0.18, 0.21, 0.24]);
    expect(vel.delta).toBeCloseTo(0.06, 5);
    expect(vel.betterIsHigher).toBe(true);

    const tug = trends.find((t) => t.key === 'tug-time')!;
    expect(tug.points).toHaveLength(2); // the middle check-up skipped TUG
    expect(tug.delta).toBeCloseTo(-1.5, 5);
    expect(tug.betterIsHigher).toBe(false);
  });

  it('hasTrend is true once a metric has two measured points', () => {
    expect(hasTrend(records)).toBe(true);
    expect(hasTrend([records[0]])).toBe(false); // a single check-up: no trend yet
  });

  it('drops unmeasured points (NaN survives a serialize round-trip as null)', () => {
    const round = records.map((r) => deserializeCheckUp(serializeCheckUp(r.checkUp))!);
    const trends = computeTrends(round);
    // singleLeg present in all three; shoulder/hinge never measured → absent.
    expect(trends.find((t) => t.key === 'single-leg-balance')!.points).toHaveLength(3);
    expect(trends.find((t) => t.key === 'shoulder-flexion')).toBeUndefined();
  });

  it('drops malformed and duplicated stored scoring inputs from trends', () => {
    const valid = makeCheckUp('2026-06-01T10:00:00.000Z', { reps: 12, vel: 0.2, singleLeg: 8 });
    const malformed = makeCheckUp('2026-06-15T10:00:00.000Z', { reps: 14, vel: 0.24, singleLeg: 999 });
    const duplicate = makeCheckUp('2026-06-29T10:00:00.000Z', { reps: 15, vel: 0.3, singleLeg: 10 });

    (malformed.items[0].result as unknown as Record<string, unknown>).reps = '14';
    duplicate.items.unshift({
      movementId: CHAIR_STAND_ID,
      status: 'measured',
      result: {
        movementId: CHAIR_STAND_ID,
        flags: [],
        interruptions: 0,
        reps: 20,
        repStats: [],
        sessionMeanVel: 0.4,
        sessionMeanPeakVel: 0.5,
        pushOffDetected: false,
      } as never,
    });

    const trends = computeTrends([valid, malformed, duplicate].map((checkUp) => deserializeCheckUp(serializeCheckUp(checkUp))!));

    expect(trends.find((t) => t.key === 'chair-stands')!.points.map((p) => p.value)).toEqual([12]);
    expect(trends.find((t) => t.key === 'rise-velocity')!.points.map((p) => p.value)).toEqual([0.2]);
    expect(trends.find((t) => t.key === 'single-leg-balance')!.points.map((p) => p.value)).toEqual([8, 10]);
  });
});
