/**
 * Battery-sequence option (Option 1 ruling, 2026-07-06). Two pins guard the
 * default: the existing coordinator/flow suites passing UNCHANGED, plus the
 * explicit default-constant assertion here — so a future edit to the default
 * battery is a deliberate test change, never a drive-by.
 */

import type { ChairRiseV2Result } from '../../movements/chairRiseV2';
import type { OneLegBalanceV2Result } from '../../movements/oneLegBalanceV2';
import {
  createMovementProfileV2InternalFlow,
  DEFAULT_MOVEMENT_PROFILE_V2_BATTERY_SEQUENCE,
  movementProfileV2InternalFlowReducer,
  movementProfileV2RawCheckUpFromFlow,
  validateMovementProfileV2BatterySequence,
  type MovementProfileV2BatteryMovement,
} from '../internalCheckupFlow';
import { MovementProfileV2LiveCoordinator } from '../liveCoordinator';

const STARTED_AT = '2026-07-06T10:00:00.000Z';

function chairResult(): ChairRiseV2Result {
  return { movementId: 'chair-rise-30s-v2', reps: 12, flags: [] } as unknown as ChairRiseV2Result;
}

function balanceResult(): OneLegBalanceV2Result {
  return {
    movementId: 'one-leg-balance-45s-v2',
    bestHoldSec: 18,
    hardCapReached: false,
  } as unknown as OneLegBalanceV2Result;
}

describe('default battery pin (deliberate-edit guard)', () => {
  it("the default sequence equals today's full battery in today's order", () => {
    expect(DEFAULT_MOVEMENT_PROFILE_V2_BATTERY_SEQUENCE).toEqual([
      'chair',
      'balance',
      'shoulder',
      'hinge',
    ]);
  });

  it('an unsequenced flow stores no sequence field and starts at chair_setup', () => {
    const flow = createMovementProfileV2InternalFlow({ startedAt: STARTED_AT });
    expect('batterySequence' in flow).toBe(false);
    expect(flow.step).toBe('chair_setup');
  });

  it('an unsequenced coordinator starts at chair_setup exactly as before', () => {
    const flow = createMovementProfileV2InternalFlow({ startedAt: STARTED_AT });
    const coordinator = new MovementProfileV2LiveCoordinator(flow);
    expect(coordinator.snapshot().stage).toBe('chair_setup');
  });
});

describe('sequence validation (construction-time, never runtime surprises)', () => {
  it('rejects empty, duplicate, and unknown sequences', () => {
    expect(() => createMovementProfileV2InternalFlow({ startedAt: STARTED_AT, batterySequence: [] })).toThrow(
      /at least one movement/
    );
    expect(() =>
      createMovementProfileV2InternalFlow({
        startedAt: STARTED_AT,
        batterySequence: ['balance', 'balance'] as unknown as MovementProfileV2BatteryMovement[],
      })
    ).toThrow(/duplicate/);
    expect(() =>
      createMovementProfileV2InternalFlow({
        startedAt: STARTED_AT,
        batterySequence: ['balance', 'sprint'] as unknown as MovementProfileV2BatteryMovement[],
      })
    ).toThrow(/unknown battery movement/);
    expect(validateMovementProfileV2BatterySequence(['balance', 'chair'])).toEqual([
      'balance',
      'chair',
    ]);
  });
});

describe('balance-first two-movement flow (Check-up #0 shape)', () => {
  it('walks balance → chair → raw_complete, recording both results', () => {
    let flow = createMovementProfileV2InternalFlow({
      startedAt: STARTED_AT,
      batterySequence: ['balance', 'chair'],
    });
    expect(flow.step).toBe('balance_setup');

    flow = movementProfileV2InternalFlowReducer(flow, {
      type: 'confirm_balance_setup',
      standingLeg: 'left',
    });
    expect(flow.step).toBe('balance_trials');

    // The pre-ruling reducer would have silently dropped this result (its
    // step machine was chair-first) — the hazard this walk pins against.
    flow = movementProfileV2InternalFlowReducer(flow, {
      type: 'record_balance',
      result: balanceResult(),
    });
    expect(flow.step).toBe('chair_setup');
    expect(flow.items).toHaveLength(1);

    flow = movementProfileV2InternalFlowReducer(flow, { type: 'confirm_chair_setup' });
    flow = movementProfileV2InternalFlowReducer(flow, { type: 'complete_chair_practice' });
    flow = movementProfileV2InternalFlowReducer(flow, { type: 'record_chair', result: chairResult() });
    expect(flow.step).toBe('raw_complete');

    const checkUp = movementProfileV2RawCheckUpFromFlow(flow);
    expect(checkUp).not.toBeNull();
    expect(checkUp?.items.map((item) => item.movementId).sort()).toEqual([
      'chair-rise-30s-v2',
      'one-leg-balance-45s-v2',
    ]);
  });

  it('is incomplete until every sequenced movement is recorded', () => {
    let flow = createMovementProfileV2InternalFlow({
      startedAt: STARTED_AT,
      batterySequence: ['balance', 'chair'],
    });
    flow = movementProfileV2InternalFlowReducer(flow, {
      type: 'confirm_balance_setup',
      standingLeg: 'left',
    });
    flow = movementProfileV2InternalFlowReducer(flow, {
      type: 'record_balance',
      result: balanceResult(),
    });
    expect(movementProfileV2RawCheckUpFromFlow(flow)).toBeNull();
  });

  it('a balance-first coordinator opens on balance setup (and after the frame check)', () => {
    const flow = createMovementProfileV2InternalFlow({
      startedAt: STARTED_AT,
      batterySequence: ['balance', 'chair'],
    });
    expect(new MovementProfileV2LiveCoordinator(flow).snapshot().stage).toBe('balance_setup');

    const gated = new MovementProfileV2LiveCoordinator(flow, { standingFrameCheckEnabled: true });
    expect(gated.snapshot().stage).toBe('standing_frame_check');
    gated.receiveUserAction({ type: 'skip_frame_check' }, 1000);
    expect(gated.snapshot().stage).toBe('balance_setup');
  });
});
