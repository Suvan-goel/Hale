/**
 * Integration of the wired Check-Up flow (the seam App.tsx orchestrates):
 *
 *   finished CheckUp → HistoryStore.save → loadAll (incl. across a restart)
 *                    → scoreCheckUp + computeTrends
 *
 * The unit suites cover each module in isolation; this guards the COMPOSITION
 * the app performs — that a real check-up survives the serialize round-trip
 * (NaN → null), reloads on launch, scores into three domains, and contributes
 * a point to the longitudinal trends — and that skipping/unmeasured tests still
 * yield a coherent, persisted result.
 */

import {
  BALANCE_LADDER_ID,
  BalanceResult,
  CHAIR_STAND_ID,
  ChairStandResult,
  HINGE_REACH_ID,
  HingeReachResult,
  SHOULDER_FLEXION_ID,
  ShoulderFlexionResult,
  TUG_ID,
  TugResult,
} from '../../movements';
import { HistoryStore, computeTrends, createMemoryFs } from '../../history';
import { scoreCheckUp } from '../../scoring';
import { CheckUp, CheckUpItem } from '../types';

// Typed result builders (real result shapes, so the test tracks the interfaces).
function chairStand(reps: number, vel: number): ChairStandResult {
  return {
    movementId: CHAIR_STAND_ID,
    flags: [],
    interruptions: 0,
    reps,
    repStats: [],
    sessionMeanVel: vel,
    sessionMeanPeakVel: vel * 1.4,
    pushOffDetected: false,
  };
}
function balance(singleLegSec: number): BalanceResult {
  return {
    movementId: BALANCE_LADDER_ID,
    flags: [],
    interruptions: 0,
    stages: [],
    singleLegEyesOpenSec: singleLegSec,
  };
}
function tug(totalSec: number): TugResult {
  return {
    movementId: TUG_ID,
    flags: [],
    interruptions: 0,
    totalSec,
    completed: true,
    turnDetected: true,
    peakExcursionBu: 2.0,
    nonStandardShortPath: false,
  };
}
function shoulder(deg: number): ShoulderFlexionResult {
  return { movementId: SHOULDER_FLEXION_ID, flags: [], interruptions: 0, peakFlexionDeg: deg };
}
function hinge(reachBu: number): HingeReachResult {
  return { movementId: HINGE_REACH_ID, flags: [], interruptions: 0, reachBu };
}

function measured(movementId: string, result: ChairStandResult | BalanceResult | TugResult | ShoulderFlexionResult | HingeReachResult): CheckUpItem {
  return { movementId, status: 'measured', result };
}

interface Metrics {
  reps: number;
  vel: number;
  tugSec: number;
  balanceSec: number;
  shoulderDeg: number;
  hingeBu: number;
}

function fullCheckUp(startedAt: string, m: Metrics): CheckUp {
  return {
    startedAt,
    bodyUnit: 0.33,
    items: [
      measured(CHAIR_STAND_ID, chairStand(m.reps, m.vel)),
      measured(TUG_ID, tug(m.tugSec)),
      measured(BALANCE_LADDER_ID, balance(m.balanceSec)),
      measured(SHOULDER_FLEXION_ID, shoulder(m.shoulderDeg)),
      measured(HINGE_REACH_ID, hinge(m.hingeBu)),
    ],
  };
}

describe('Check-Up flow integration — persist, reload, score, trend', () => {
  it('saves two check-ups, reloads them oldest-first, and scores the latest into three domains', async () => {
    const store = new HistoryStore(createMemoryFs());
    store.save(fullCheckUp('2026-05-01T09:00:00.000Z', { reps: 14, vel: 0.3, tugSec: 9.0, balanceSec: 8, shoulderDeg: 158, hingeBu: 0.4 }));
    store.save(fullCheckUp('2026-06-01T09:00:00.000Z', { reps: 16, vel: 0.34, tugSec: 8.5, balanceSec: 11, shoulderDeg: 160, hingeBu: 0.35 }));

    const loaded = await store.loadAll();
    expect(loaded.map((r) => r.checkUp.startedAt)).toEqual([
      '2026-05-01T09:00:00.000Z',
      '2026-06-01T09:00:00.000Z',
    ]);

    const score = scoreCheckUp(loaded[loaded.length - 1].checkUp);
    expect(score.domains).toHaveLength(3);
    expect(score.domains.every((d) => d.measured)).toBe(true);
    expect(score.weakestDomain).not.toBeNull();
  });

  it('contributes the headline metrics (rise velocity, one-leg balance) to the trends', async () => {
    const store = new HistoryStore(createMemoryFs());
    store.save(fullCheckUp('2026-05-01T09:00:00.000Z', { reps: 14, vel: 0.3, tugSec: 9.0, balanceSec: 8, shoulderDeg: 158, hingeBu: 0.4 }));
    store.save(fullCheckUp('2026-06-01T09:00:00.000Z', { reps: 16, vel: 0.34, tugSec: 8.5, balanceSec: 11, shoulderDeg: 160, hingeBu: 0.35 }));

    const trends = computeTrends(await store.loadAll());
    const vel = trends.find((t) => t.key === 'rise-velocity');
    const bal = trends.find((t) => t.key === 'single-leg-balance');

    expect(vel?.points).toHaveLength(2);
    expect(vel?.delta).toBeCloseTo(0.04, 5); // improved (betterIsHigher)
    expect(bal?.points).toHaveLength(2);
    expect(bal?.delta).toBeCloseTo(3, 5);
  });

  it('survives a restart — a fresh store over the same files reloads the history', async () => {
    const files = new Map<string, string>();
    const before = new HistoryStore(createMemoryFs(files));
    before.save(fullCheckUp('2026-05-01T09:00:00.000Z', { reps: 14, vel: 0.3, tugSec: 9.0, balanceSec: 8, shoulderDeg: 158, hingeBu: 0.4 }));
    before.save(fullCheckUp('2026-06-01T09:00:00.000Z', { reps: 16, vel: 0.34, tugSec: 8.5, balanceSec: 11, shoulderDeg: 160, hingeBu: 0.35 }));

    const afterRestart = new HistoryStore(createMemoryFs(files)); // App relaunch: load on mount
    const loaded = await afterRestart.loadAll();
    expect(loaded).toHaveLength(2);
    expect(computeTrends(loaded).find((t) => t.key === 'rise-velocity')?.points).toHaveLength(2);
  });

  it('persists and coherently scores a check-up with skipped and unmeasured tests', async () => {
    const store = new HistoryStore(createMemoryFs());
    const partial: CheckUp = {
      startedAt: '2026-06-14T09:00:00.000Z',
      bodyUnit: 0.33,
      items: [
        measured(CHAIR_STAND_ID, chairStand(12, 0.28)),
        { movementId: TUG_ID, status: 'skipped', result: null },
        { movementId: BALANCE_LADDER_ID, status: 'unmeasured', result: null },
        // present-but-unmeasured: NaN peak + the grader's own no-measurement flag.
        { movementId: SHOULDER_FLEXION_ID, status: 'measured', result: { ...shoulder(NaN), flags: ['no-measurement'] } },
        { movementId: HINGE_REACH_ID, status: 'skipped', result: null },
      ],
    };
    store.save(partial);

    const [loaded] = await store.loadAll();
    // The NaN shoulder peak round-trips as null without throwing.
    const sh = loaded.checkUp.items.find((i) => i.movementId === SHOULDER_FLEXION_ID);
    expect((sh?.result as ShoulderFlexionResult).peakFlexionDeg).toBeNull();

    const score = scoreCheckUp(loaded.checkUp);
    expect(score.domains).toHaveLength(3);
    const byDomain = Object.fromEntries(score.domains.map((d) => [d.domain, d]));
    expect(byDomain.strength.measured).toBe(true);
    expect(byDomain.balance.measured).toBe(false);
    expect(byDomain.mobility.measured).toBe(false);
    expect(score.weakestDomain).toBe('strength'); // the only measured domain
    // Every domain still carries detail rows for the Results screen.
    expect(score.domains.every((d) => d.rows.length > 0)).toBe(true);
  });
});
