import {
  ACTIVE_SHOULDER_REACH_V2_ID,
  type ActiveShoulderReachV2Result,
} from '../movements/activeShoulderReachV2';
import { CHAIR_RISE_V2_ID, type ChairRiseV2Result } from '../movements/chairRiseV2';
import { HINGE_REACH_ID } from '../movements/hingeReach';
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

export const MOVEMENT_PROFILE_V2_HEADLINE_MOVEMENT_IDS = [
  CHAIR_RISE_V2_ID,
  ONE_LEG_BALANCE_V2_ID,
  ACTIVE_SHOULDER_REACH_V2_ID,
] as const;

export const MOVEMENT_PROFILE_V2_SUPPORTING_MOVEMENT_IDS = [HINGE_REACH_ID] as const;

export type MovementProfileV2HeadlineMovementId =
  (typeof MOVEMENT_PROFILE_V2_HEADLINE_MOVEMENT_IDS)[number];

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

  for (const movementId of MOVEMENT_PROFILE_V2_HEADLINE_MOVEMENT_IDS) {
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
    const item = checkUps[i].items.find((candidate) => candidate.movementId === ONE_LEG_BALANCE_V2_ID);
    const result = item?.result as OneLegBalanceV2Result | null | undefined;
    if (isMovementProfileV2Policy(checkUps[i]) && (result?.standingLeg === 'left' || result?.standingLeg === 'right')) {
      return result.standingLeg;
    }
  }
  return null;
}

export function latestV2ShoulderSide(checkUps: readonly CheckUp[]): BodySide | null {
  for (let i = checkUps.length - 1; i >= 0; i--) {
    const item = checkUps[i].items.find((candidate) => candidate.movementId === ACTIVE_SHOULDER_REACH_V2_ID);
    const result = item?.result as ActiveShoulderReachV2Result | null | undefined;
    if (isMovementProfileV2Policy(checkUps[i]) && (result?.selectedSide === 'left' || result?.selectedSide === 'right')) {
      return result.selectedSide;
    }
  }
  return null;
}

function evidenceStatusFromResult(result: unknown): MovementProfileV2EvidenceStatus | null {
  if (!result || typeof result !== 'object') return null;
  const status = (result as Partial<ChairRiseV2Result | OneLegBalanceV2Result | ActiveShoulderReachV2Result>).evidenceStatus;
  return isMovementProfileV2EvidenceStatus(status) ? status : null;
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
