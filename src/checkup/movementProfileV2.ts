import {
  ACTIVE_SHOULDER_REACH_V2_ID,
  type ActiveShoulderReachV2Result,
} from '../movements/activeShoulderReachV2';
import { CHAIR_RISE_V2_ID, type ChairRiseV2Result } from '../movements/chairRiseV2';
import { HINGE_REACH_ID } from '../movements/hingeReach';
import { BALANCE_EYES_OPEN_V2_ID, type BalanceEyesOpenV2Result } from '../movements/balanceEyesOpenV2';
import { ONE_LEG_BALANCE_V2_ID, type OneLegBalanceV2Result } from '../movements/oneLegBalanceV2';
import { CheckUp } from './types';
import {
  MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
  isMovementProfileV2Policy,
} from './protocolPolicy';
import {
  MovementProfileV2EvidenceStatus,
  isValidMovementProfileV2RawEvidence,
} from './protocolEvidence';
import type { BodySide } from './protocolSetup';
import { normalizeCheckUpMeasurementMetadata } from './measurementMetadata';
import { parseMeasurementContext } from './measurementContext';

export const MOVEMENT_PROFILE_V2_HEADLINE_MOVEMENT_IDS = [
  CHAIR_RISE_V2_ID,
  ONE_LEG_BALANCE_V2_ID,
  ACTIVE_SHOULDER_REACH_V2_ID,
] as const;

export const MOVEMENT_PROFILE_V2_HEADLINE_MOVEMENT_IDS_V2 = [
  CHAIR_RISE_V2_ID,
  BALANCE_EYES_OPEN_V2_ID,
  ACTIVE_SHOULDER_REACH_V2_ID,
] as const;

export const MOVEMENT_PROFILE_V2_SUPPORTING_MOVEMENT_IDS = [HINGE_REACH_ID] as const;

export type MovementProfileV2HeadlineMovementId =
  | (typeof MOVEMENT_PROFILE_V2_HEADLINE_MOVEMENT_IDS)[number]
  | (typeof MOVEMENT_PROFILE_V2_HEADLINE_MOVEMENT_IDS_V2)[number];

export interface MovementProfileV2Completeness {
  protocolPolicyId: typeof MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID | null;
  isMovementProfileV2: boolean;
  /** True when every headline item has usable raw V2 evidence; reference eligibility is tracked separately. */
  referenceComplete: boolean;
  missingHeadlineMovementIds: MovementProfileV2HeadlineMovementId[];
  evidenceStatusByMovementId: Partial<Record<MovementProfileV2HeadlineMovementId, MovementProfileV2EvidenceStatus>>;
}

export function evaluateMovementProfileV2Completeness(checkUp: CheckUp): MovementProfileV2Completeness {
  const isMovementProfileV2 = isMovementProfileV2Policy(checkUp);
  const evidenceStatusByMovementId: Partial<Record<MovementProfileV2HeadlineMovementId, MovementProfileV2EvidenceStatus>> = {};
  const missingHeadlineMovementIds: MovementProfileV2HeadlineMovementId[] = [];

  const headlineMovementIds = headlineMovementIdsForCheckUp(checkUp);
  for (const movementId of headlineMovementIds) {
    const item = checkUp.items.find((candidate) => candidate.movementId === movementId);
    const status = item?.status === 'measured' ? evidenceStatusFromResult(item.result) : null;
    if (!status) {
      missingHeadlineMovementIds.push(movementId);
      continue;
    }
    evidenceStatusByMovementId[movementId] = status;
    if (!isValidMovementProfileV2RawEvidence(status)) missingHeadlineMovementIds.push(movementId);
  }

  return {
    protocolPolicyId: isMovementProfileV2 ? MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID : null,
    isMovementProfileV2,
    referenceComplete: isMovementProfileV2 && missingHeadlineMovementIds.length === 0,
    missingHeadlineMovementIds,
    evidenceStatusByMovementId,
  };
}

export function latestV2StandingLeg(checkUps: readonly CheckUp[]): BodySide | null {
  for (let i = checkUps.length - 1; i >= 0; i--) {
    const normalized = normalizeCheckUpMeasurementMetadata(checkUps[i], { checkupType: 'official_retest' });
    const eyesOpenItem = normalized.items.find((candidate) => candidate.movementId === BALANCE_EYES_OPEN_V2_ID);
    const eyesOpenContextSide = parseMeasurementContext(eyesOpenItem?.measurementContext)?.side.selectedSide;
    if (isMovementProfileV2Policy(normalized) && (eyesOpenContextSide === 'left' || eyesOpenContextSide === 'right')) {
      return eyesOpenContextSide;
    }
    const eyesOpenResult = eyesOpenItem?.result as BalanceEyesOpenV2Result | null | undefined;
    if (
      isMovementProfileV2Policy(normalized) &&
      (eyesOpenResult?.selectedStandingLeg === 'left' || eyesOpenResult?.selectedStandingLeg === 'right')
    ) {
      return eyesOpenResult.selectedStandingLeg;
    }
    const item = normalized.items.find((candidate) => candidate.movementId === ONE_LEG_BALANCE_V2_ID);
    const contextSide = parseMeasurementContext(item?.measurementContext)?.side.selectedSide;
    if (isMovementProfileV2Policy(normalized) && (contextSide === 'left' || contextSide === 'right')) {
      return contextSide;
    }
    const result = item?.result as OneLegBalanceV2Result | null | undefined;
    if (isMovementProfileV2Policy(normalized) && (result?.standingLeg === 'left' || result?.standingLeg === 'right')) {
      return result.standingLeg;
    }
  }
  return null;
}

export function latestV2ShoulderSide(checkUps: readonly CheckUp[]): BodySide | null {
  for (let i = checkUps.length - 1; i >= 0; i--) {
    const normalized = normalizeCheckUpMeasurementMetadata(checkUps[i], { checkupType: 'official_retest' });
    const item = normalized.items.find((candidate) => candidate.movementId === ACTIVE_SHOULDER_REACH_V2_ID);
    const contextSide = parseMeasurementContext(item?.measurementContext)?.side.selectedSide;
    if (isMovementProfileV2Policy(normalized) && (contextSide === 'left' || contextSide === 'right')) {
      return contextSide;
    }
    const result = item?.result as ActiveShoulderReachV2Result | null | undefined;
    if (isMovementProfileV2Policy(normalized) && (result?.selectedSide === 'left' || result?.selectedSide === 'right')) {
      return result.selectedSide;
    }
  }
  return null;
}

function evidenceStatusFromResult(result: unknown): MovementProfileV2EvidenceStatus | null {
  if (!result || typeof result !== 'object') return null;
  const status = (result as Partial<ChairRiseV2Result | OneLegBalanceV2Result | BalanceEyesOpenV2Result | ActiveShoulderReachV2Result>).evidenceStatus;
  return isMovementProfileV2EvidenceStatus(status) ? status : null;
}

function headlineMovementIdsForCheckUp(checkUp: CheckUp): readonly MovementProfileV2HeadlineMovementId[] {
  const hasEyesOpenBalance = checkUp.items.some((item) => item.movementId === BALANCE_EYES_OPEN_V2_ID);
  const batteryVersion = checkUp.measurementProtocol?.protocolId === 'movement_profile_v2_battery'
    ? checkUp.measurementProtocol.protocolVersion
    : null;
  return hasEyesOpenBalance || batteryVersion === 2
    ? MOVEMENT_PROFILE_V2_HEADLINE_MOVEMENT_IDS_V2
    : MOVEMENT_PROFILE_V2_HEADLINE_MOVEMENT_IDS;
}

function isMovementProfileV2EvidenceStatus(value: unknown): value is MovementProfileV2EvidenceStatus {
  return (
    value === 'reference_protocol_complete' ||
    value === 'raw_only_setup_uncertain' ||
    value === 'raw_only_protocol_incomplete' ||
    value === 'raw_only_tracking_uncertain' ||
    value === 'raw_only_pain_limited' ||
    value === 'invalid_measurement'
  );
}
