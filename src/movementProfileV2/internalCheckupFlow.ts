import type { CheckupType } from '../adherence';
import {
  MOVEMENT_PROFILE_V2_HEADLINE_MOVEMENT_IDS,
  MOVEMENT_PROFILE_V2_SUPPORTING_MOVEMENT_IDS,
  latestV2ShoulderSide,
  latestV2StandingLeg,
} from '../checkup/movementProfileV2';
import { MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID, createCheckUpProtocolPolicy } from '../checkup/protocolPolicy';
import {
  type BodySide,
  createActiveShoulderReachV2Setup,
  createChairRiseV2Setup,
  createOneLegBalanceV2Setup,
} from '../checkup/protocolSetup';
import type { CheckUp, CheckUpItem } from '../checkup/types';
import { HINGE_REACH_ID, type HingeReachResult } from '../movements';
import {
  ACTIVE_SHOULDER_REACH_V2_ID,
  ActiveShoulderReachV2ProtocolController,
  type ActiveShoulderReachV2Result,
} from '../movements/activeShoulderReachV2';
import {
  CHAIR_RISE_V2_ID,
  ChairRiseV2ProtocolController,
  type ChairRiseV2Result,
} from '../movements/chairRiseV2';
import {
  ONE_LEG_BALANCE_V2_ID,
  OneLegBalanceV2ProtocolController,
  type OneLegBalanceV2Result,
} from '../movements/oneLegBalanceV2';
import type { StoredCheckUp } from '../history';
import {
  latestOfficialMovementProfileV2Assessment,
  validOfficialMovementProfileV2Assessments,
} from '../haleFlow/checkupHistory';

export type MovementProfileV2InternalStep =
  | 'chair_setup'
  | 'chair_practice'
  | 'chair_active'
  | 'balance_setup'
  | 'balance_trials'
  | 'shoulder_setup'
  | 'shoulder_active'
  | 'hinge_capture'
  | 'raw_complete'
  | 'reference_details'
  | 'results';

export interface MovementProfileV2InternalFlowState {
  startedAt: string;
  sourceType: Extract<CheckupType, 'baseline' | 'baseline_retake'>;
  step: MovementProfileV2InternalStep;
  bodyUnit: number | null;
  priorStandingLeg: BodySide | null;
  standingLeg: BodySide;
  priorShoulderSide: BodySide | null;
  shoulderSide: BodySide;
  backgrounded: boolean;
  items: CheckUpItem[];
}

export type MovementProfileV2InternalFlowEvent =
  | { type: 'confirm_chair_setup' }
  | { type: 'complete_chair_practice' }
  | { type: 'record_chair'; result: ChairRiseV2Result }
  | { type: 'confirm_balance_setup'; standingLeg: BodySide }
  | { type: 'record_balance'; result: OneLegBalanceV2Result }
  | { type: 'confirm_shoulder_setup'; shoulderSide: BodySide }
  | { type: 'record_shoulder'; result: ActiveShoulderReachV2Result }
  | { type: 'record_hinge'; result: HingeReachResult }
  | { type: 'mark_reference_details' }
  | { type: 'mark_results' }
  | { type: 'backgrounded' }
  | { type: 'resumed' };

export function createMovementProfileV2InternalFlow(input: {
  startedAt: string;
  history?: readonly StoredCheckUp[] | null;
  bodyUnit?: number | null;
}): MovementProfileV2InternalFlowState {
  const acceptedV2 = validOfficialMovementProfileV2Assessments(input.history);
  const priorCheckUps = acceptedV2.map((record) => record.record.checkUp);
  const priorStandingLeg = latestV2StandingLeg(priorCheckUps);
  const priorShoulderSide = latestV2ShoulderSide(priorCheckUps);
  return {
    startedAt: input.startedAt,
    sourceType: acceptedV2.length > 0 ? 'baseline_retake' : 'baseline',
    step: 'chair_setup',
    bodyUnit: input.bodyUnit ?? null,
    priorStandingLeg,
    standingLeg: priorStandingLeg ?? 'left',
    priorShoulderSide,
    shoulderSide: priorShoulderSide ?? 'right',
    backgrounded: false,
    items: [],
  };
}

export function movementProfileV2InternalFlowReducer(
  state: MovementProfileV2InternalFlowState,
  event: MovementProfileV2InternalFlowEvent
): MovementProfileV2InternalFlowState {
  switch (event.type) {
    case 'confirm_chair_setup':
      return state.step === 'chair_setup' ? { ...state, step: 'chair_practice' } : state;
    case 'complete_chair_practice':
      return state.step === 'chair_practice' ? { ...state, step: 'chair_active' } : state;
    case 'record_chair':
      if (state.step !== 'chair_active' || hasItem(state.items, CHAIR_RISE_V2_ID)) return state;
      return { ...state, step: 'balance_setup', items: [...state.items, measuredItem(CHAIR_RISE_V2_ID, event.result)] };
    case 'confirm_balance_setup':
      return state.step === 'balance_setup'
        ? { ...state, standingLeg: event.standingLeg, step: 'balance_trials' }
        : state;
    case 'record_balance':
      if (state.step !== 'balance_trials' || hasItem(state.items, ONE_LEG_BALANCE_V2_ID)) return state;
      return { ...state, step: 'shoulder_setup', items: [...state.items, measuredItem(ONE_LEG_BALANCE_V2_ID, event.result)] };
    case 'confirm_shoulder_setup':
      return state.step === 'shoulder_setup'
        ? { ...state, shoulderSide: event.shoulderSide, step: 'shoulder_active' }
        : state;
    case 'record_shoulder':
      if (state.step !== 'shoulder_active' || hasItem(state.items, ACTIVE_SHOULDER_REACH_V2_ID)) return state;
      return { ...state, step: 'hinge_capture', items: [...state.items, measuredItem(ACTIVE_SHOULDER_REACH_V2_ID, event.result)] };
    case 'record_hinge':
      if (state.step !== 'hinge_capture' || hasItem(state.items, HINGE_REACH_ID)) return state;
      return { ...state, step: 'raw_complete', items: [...state.items, measuredItem(HINGE_REACH_ID, event.result)] };
    case 'mark_reference_details':
      return state.step === 'raw_complete' ? { ...state, step: 'reference_details' } : state;
    case 'mark_results':
      return state.step === 'reference_details' ? { ...state, step: 'results' } : state;
    case 'backgrounded':
      return { ...state, backgrounded: true };
    case 'resumed':
      return state;
    default:
      return state;
  }
}

export function movementProfileV2RawCheckUpFromFlow(
  state: MovementProfileV2InternalFlowState
): CheckUp | null {
  if (state.step !== 'raw_complete' && state.step !== 'reference_details' && state.step !== 'results') {
    return null;
  }
  const headlineIds = new Set(MOVEMENT_PROFILE_V2_HEADLINE_MOVEMENT_IDS);
  const hasAllHeadline = state.items.filter((item) => headlineIds.has(item.movementId as never)).length === headlineIds.size;
  if (!hasAllHeadline) return null;
  const ordered = [...MOVEMENT_PROFILE_V2_HEADLINE_MOVEMENT_IDS, ...MOVEMENT_PROFILE_V2_SUPPORTING_MOVEMENT_IDS]
    .map((movementId) => state.items.find((item) => item.movementId === movementId))
    .filter((item): item is CheckUpItem => !!item);
  return {
    startedAt: state.startedAt,
    protocolPolicy: createCheckUpProtocolPolicy(MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID, state.startedAt),
    bodyUnit: state.bodyUnit,
    items: ordered,
  };
}

export function latestPendingMovementProfileV2RawCheckUp(
  history: readonly StoredCheckUp[] | null | undefined
): { record: StoredCheckUp; sourceType: Extract<CheckupType, 'baseline' | 'baseline_retake'> } | null {
  const sorted = (history ?? [])
    .slice()
    .sort((a, b) => b.checkUp.startedAt.localeCompare(a.checkUp.startedAt));
  for (const record of sorted) {
    if (record.checkupType !== 'baseline' && record.checkupType !== 'baseline_retake') continue;
    if (record.movementProfileV2Assessment || record.movementProfileV2Snapshot) continue;
    if (record.checkUp.protocolPolicy?.id !== MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID) continue;
    const checkUp = record.checkUp;
    const hasAllHeadline = MOVEMENT_PROFILE_V2_HEADLINE_MOVEMENT_IDS.every((movementId) =>
      checkUp.items.some((item) => item.movementId === movementId && item.status === 'measured' && item.result)
    );
    if (hasAllHeadline) return { record, sourceType: record.checkupType };
  }
  return null;
}

export function latestMaterializedMovementProfileV2Result(
  history: readonly StoredCheckUp[] | null | undefined
) {
  return latestOfficialMovementProfileV2Assessment(history);
}

export function createCapturedChairRiseV2Result(input: {
  reps: number;
  meanVelocity?: number;
  peakVelocity?: number;
}): ChairRiseV2Result {
  const controller = new ChairRiseV2ProtocolController();
  const setup = createChairRiseV2Setup({ confirmed: true });
  controller.confirmSetup(setup, 0);
  controller.completePracticeRep(1000);
  controller.startActive(2000);
  const reps = Math.max(0, Math.floor(input.reps));
  for (let index = 0; index < reps; index++) {
    controller.creditStand({
      completedAtMs: 2500 + index * Math.max(1, Math.floor(28000 / Math.max(1, reps))),
      meanVel: input.meanVelocity ?? 1.05,
      peakVel: input.peakVelocity ?? 1.35,
      durationMs: 900,
      pushOff: false,
    });
  }
  return controller.finish(32000);
}

export function createCapturedOneLegBalanceV2Result(input: {
  standingLeg: BodySide;
  priorStandingLeg?: BodySide | null;
  holdsSec: readonly number[];
}): OneLegBalanceV2Result {
  const controller = new OneLegBalanceV2ProtocolController();
  const setup = createOneLegBalanceV2Setup({
    standingLeg: input.standingLeg,
    priorStandingLeg: input.priorStandingLeg ?? null,
    confirmed: true,
  });
  controller.confirmSetup(setup, 0);
  let nowMs = 1000;
  for (const holdSec of input.holdsSec.slice(0, 3)) {
    if (!controller.startTrial(nowMs)) break;
    const holdMs = Math.max(0, Math.min(45000, Math.round(holdSec * 1000)));
    const endedAtMs = nowMs + holdMs;
    controller.completeTrial({
      nowMs: endedAtMs,
      holdMs,
      swaySd: 0.03,
      termination: holdMs >= 45000 ? 'ceiling' : 'touchdown',
    });
    nowMs = endedAtMs + 30000;
  }
  return controller.finish(nowMs);
}

export function createCapturedActiveShoulderReachV2Result(input: {
  selectedSide: BodySide;
  priorSelectedSide?: BodySide | null;
  peakFlexionDeg: number;
  painLimited?: boolean;
}): ActiveShoulderReachV2Result {
  const controller = new ActiveShoulderReachV2ProtocolController();
  const setup = createActiveShoulderReachV2Setup({
    selectedSide: input.selectedSide,
    priorSelectedSide: input.priorSelectedSide ?? null,
    confirmed: true,
  });
  controller.confirmSetup(setup, 0);
  controller.startCapture(1000);
  controller.recordValidCapture({
    nowMs: 9000,
    peakFlexionDeg: Math.max(0, Math.min(180, input.peakFlexionDeg)),
    validTrackingMs: 5000,
    painLimited: input.painLimited === true,
  });
  return controller.finish(9000);
}

export function createCapturedHingeReachResult(reachBu: number): HingeReachResult {
  return {
    movementId: HINGE_REACH_ID,
    reachBu,
    flags: [],
    interruptions: 0,
  };
}

function measuredItem(movementId: string, result: CheckUpItem['result']): CheckUpItem {
  return { movementId, status: 'measured', result };
}

function hasItem(items: readonly CheckUpItem[], movementId: string): boolean {
  return items.some((item) => item.movementId === movementId);
}
