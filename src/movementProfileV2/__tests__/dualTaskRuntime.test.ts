import {
  DualTaskRuntime,
  DUAL_TASK_RUNTIME_DEFAULTS,
  type DualTaskRuntimeConfig,
} from '../dualTaskRuntime';
import { dualTaskEligibility } from '../dualTaskEligibility';
import type { MovementProfileV2LivePoseSample } from '../liveCoordinator';
import type { CheckUp } from '../../checkup/types';
import { ONE_LEG_BALANCE_V2_ID } from '../../movements/oneLegBalanceV2';

const LEFT_ANKLE = 27;
const RIGHT_ANKLE = 28;

// Standing on the LEFT leg: left ankle low (large y), right ankle raised.
function sample(raised: boolean, trackingQuality: 'good' | 'lost' = 'good'): MovementProfileV2LivePoseSample {
  const ys = new Array(33).fill(0.5);
  ys[LEFT_ANKLE] = 0.9;
  ys[RIGHT_ANKLE] = raised ? 0.7 : 0.895; // lift gap ≫/≪ 0.14 body units
  return {
    output: { frame: { ys, xs: new Array(33).fill(0.5), aspect: 1 }, bodyUnit: 1 },
    trackingQuality,
  } as unknown as MovementProfileV2LivePoseSample;
}

function runtime(overrides: Partial<DualTaskRuntimeConfig> = {}): DualTaskRuntime {
  return new DualTaskRuntime({
    movementId: ONE_LEG_BALANCE_V2_ID,
    standingLeg: 'left',
    singleTaskSeconds: 30,
    singleTaskCeiling: false,
    ...DUAL_TASK_RUNTIME_DEFAULTS,
    ...overrides,
  });
}

const SPOKE = { speechActiveMs: 12000, windowMs: 30000 };
const SILENT = { speechActiveMs: 0, windowMs: 30000 };

function driveHold(rt: DualTaskRuntime, holdMs: number, startMs = 1000): void {
  // Lift, confirm (150 ms), hold, then touchdown over the debounce frames.
  rt.update(sample(true), startMs);
  rt.update(sample(true), startMs + 200); // lift confirmed → hold retro-dated to startMs
  rt.update(sample(true), startMs + holdMs - 1);
  for (let frame = 0; frame < 4; frame++) {
    rt.update(sample(false), startMs + holdMs + frame * 33);
  }
}

describe('dual-task runtime (CLARITY_INSTRUMENTS_TDD §4, level-1 detection parity)', () => {
  it('measures a hold with the same retro-dated clock and touchdown debounce as level 1', () => {
    const rt = runtime();
    driveHold(rt, 21000);
    expect(rt.phase).toBe('complete');
    const result = rt.result(SPOKE);
    expect(result.status).toBe('measured');
    expect(result.dualTaskSeconds).toBeCloseTo(21, 1);
    expect(result.costPercent).toBeCloseTo(30, 0);
    expect(result.speechActiveMs).toBe(12000);
  });

  it('F5: touchdown under load is VALID degradation; silence is INVALID — never conflated', () => {
    const early = runtime();
    driveHold(early, 6000); // stopped moving early: her real capacity
    expect(early.result(SPOKE).status).toBe('measured');
    expect(early.result(SPOKE).costPercent).toBeCloseTo(80, 0);

    const silent = runtime();
    driveHold(silent, 21000); // full movement, no speech: left the verbal task
    const result = silent.result(SILENT);
    expect(result.status).toBe('invalid');
    expect(result.invalidReason).toBe('no_speech_detected');
    expect(result.costPercent).toBeUndefined();
  });

  it('caps at the protocol ceiling and tags ceilingLimited (F2)', () => {
    const rt = runtime({ singleTaskCeiling: true, singleTaskSeconds: 45 });
    rt.update(sample(true), 0);
    rt.update(sample(true), 200);
    rt.update(sample(true), 46000); // past the 45 s cap while still raised
    const result = rt.result(SPOKE);
    expect(result.status).toBe('measured');
    expect(result.dualTaskSeconds).toBe(45);
    expect(result.costPercent).toBeCloseTo(0, 5);
    expect(result.ceilingLimited).toBe(true);
  });

  it('no-stall: never assuming the stance times out to an honest skip', () => {
    const rt = runtime({ setupTimeoutMs: 10000 });
    rt.update(sample(false), 0);
    rt.update(sample(false), 10001);
    expect(rt.phase).toBe('complete');
    expect(rt.takeEvents().some((event) => event.kind === 'setup_timed_out')).toBe(true);
    expect(rt.result(SILENT).status).toBe('skipped');
  });

  it('confirmed tracking loss mid-hold invalidates; backgrounding invalidates', () => {
    const lost = runtime();
    lost.update(sample(true), 0);
    lost.update(sample(true), 200);
    for (let frame = 0; frame < 4; frame++) lost.update(sample(true, 'lost'), 5000 + frame * 33);
    expect(lost.result(SPOKE)).toMatchObject({ status: 'invalid', invalidReason: 'tracking_interrupted' });

    const backgrounded = runtime();
    backgrounded.update(sample(true), 0);
    backgrounded.update(sample(true), 200);
    backgrounded.appBackgrounded(3000);
    expect(backgrounded.result(SPOKE)).toMatchObject({ status: 'invalid', invalidReason: 'app_backgrounded' });
  });
});

describe('dual-task eligibility (same-session baseline, never fabricated)', () => {
  const balanceResult = (overrides: Record<string, unknown> = {}) => ({
    movementId: ONE_LEG_BALANCE_V2_ID,
    evidenceStatus: 'reference_protocol_complete',
    bestHoldSec: 30,
    standingLeg: 'left',
    trials: [{ valid: true, termination: 'touchdown' }],
    ...overrides,
  });
  const checkUpWith = (result: unknown, status = 'measured'): CheckUp =>
    ({
      startedAt: '2026-07-06T09:00:00.000Z',
      bodyUnit: 1,
      items: result === null ? [] : [{ movementId: ONE_LEG_BALANCE_V2_ID, status, result }],
    }) as CheckUp;

  it('offers only with an available monitor AND a valid same-session single-leg run', () => {
    const eligible = dualTaskEligibility({
      checkUp: checkUpWith(balanceResult()),
      monitorAvailability: 'available',
    });
    expect(eligible).toEqual({
      kind: 'eligible',
      movementId: ONE_LEG_BALANCE_V2_ID,
      standingLeg: 'left',
      singleTaskSeconds: 30,
      singleTaskCeiling: false,
    });
  });

  it('device gate not passed → recorded unavailable (the PLANNED state)', () => {
    const gated = dualTaskEligibility({
      checkUp: checkUpWith(balanceResult()),
      monitorAvailability: 'unavailable',
    });
    expect(gated).toMatchObject({ kind: 'not_offered', record: { status: 'unavailable' } });
  });

  it('ladder-protocol sessions are a recorded v1 limitation', () => {
    const ladder = dualTaskEligibility({ checkUp: checkUpWith(null), monitorAvailability: 'available' });
    expect(ladder).toMatchObject({ kind: 'not_offered', record: { status: 'unavailable' } });
  });

  it('invalid/ceiling-flagged baselines are handled honestly', () => {
    const invalid = dualTaskEligibility({
      checkUp: checkUpWith(balanceResult({ evidenceStatus: 'invalid_measurement' })),
      monitorAvailability: 'available',
    });
    expect(invalid).toMatchObject({
      kind: 'not_offered',
      record: { status: 'invalid', invalidReason: 'single_task_invalid' },
    });

    const ceiling = dualTaskEligibility({
      checkUp: checkUpWith(balanceResult({ trials: [{ valid: true, termination: 'ceiling' }], bestHoldSec: 45 })),
      monitorAvailability: 'available',
    });
    expect(ceiling).toMatchObject({ kind: 'eligible', singleTaskCeiling: true });
  });
});
