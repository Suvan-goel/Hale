/**
 * Who gets the level-2 offer (CLARITY_INSTRUMENTS_TDD §4.1–4.2, DT2). Pure.
 *
 * The single-task baseline is ONLY the same session's valid single-leg
 * balance run — stored prior sessions are never consulted, and without a
 * valid baseline the instrument records itself honestly instead of running
 * (`single_task_invalid`) — never fabricates.
 *
 * v1 supports the single-leg protocol only; a ladder-protocol session is a
 * recorded limitation (`unavailable`), as is a failed/pending device gate
 * (the VAD monitor reporting unavailable — the PLANNED state until device
 * Block 7 passes).
 */

import { findItem, type CheckUp } from '../checkup/types';
import {
  DUAL_TASK_RESULT_SCHEMA_VERSION,
  type DualTaskResult,
} from '../checkup/clarityInstruments';
import type { BodySide } from '../checkup/protocolSetup';
import { ONE_LEG_BALANCE_V2_ID, type OneLegBalanceV2Result } from '../movements/oneLegBalanceV2';
import type { SpeechActivityAvailability } from '../voice/speechActivity';

export type DualTaskEligibility =
  | {
      kind: 'eligible';
      movementId: typeof ONE_LEG_BALANCE_V2_ID;
      standingLeg: BodySide;
      singleTaskSeconds: number;
      singleTaskCeiling: boolean;
    }
  | { kind: 'not_offered'; record: DualTaskResult };

export function dualTaskEligibility(input: {
  checkUp: CheckUp;
  monitorAvailability: SpeechActivityAvailability;
}): DualTaskEligibility {
  const base = {
    schemaVersion: DUAL_TASK_RESULT_SCHEMA_VERSION,
    movementId: ONE_LEG_BALANCE_V2_ID,
  } as const;

  if (input.monitorAvailability !== 'available') {
    // Device gate not passed / no on-device capability: recorded limitation.
    return { kind: 'not_offered', record: { ...base, status: 'unavailable' } };
  }

  const item = findItem(input.checkUp, ONE_LEG_BALANCE_V2_ID);
  if (!item) {
    // Ladder-protocol session (or no balance at all): v1 limitation.
    return { kind: 'not_offered', record: { ...base, status: 'unavailable' } };
  }
  const result = item.result as OneLegBalanceV2Result | null;
  const valid =
    item.status === 'measured' &&
    !!result &&
    result.evidenceStatus !== 'invalid_measurement' &&
    Number.isFinite(result.bestHoldSec) &&
    result.bestHoldSec > 0 &&
    result.standingLeg !== null;
  if (!valid) {
    return {
      kind: 'not_offered',
      record: { ...base, status: 'invalid', invalidReason: 'single_task_invalid' },
    };
  }
  return {
    kind: 'eligible',
    movementId: ONE_LEG_BALANCE_V2_ID,
    standingLeg: result.standingLeg as BodySide,
    singleTaskSeconds: result.bestHoldSec,
    singleTaskCeiling: result.trials.some((trial) => trial.valid && trial.termination === 'ceiling'),
  };
}
