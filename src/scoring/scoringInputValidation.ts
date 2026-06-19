import type { CheckUpItem } from '../checkup/types';
import {
  BALANCE_LADDER_ID,
  type BalanceResult,
  DEFAULT_BALANCE_STAGES,
} from '../movements/balanceLadder';
import {
  CHAIR_STAND_ID,
  DEFAULT_CHAIR_STAND_CONFIG,
  type ChairStandResult,
} from '../movements/chairStand';
import { HINGE_REACH_ID, type HingeReachResult } from '../movements/hingeReach';
import {
  MAX_VALID_SHOULDER_FLEXION_DEG,
  MIN_VALID_SHOULDER_FLEXION_DEG,
  SHOULDER_FLEXION_ID,
  type ShoulderFlexionResult,
} from '../movements/shoulderFlexion';
import { TUG_ID, type TugResult } from '../movements/tug';

export const CHAIR_STAND_MAX_REPS_FOR_SCORING = DEFAULT_CHAIR_STAND_CONFIG.maxReps;

const singleLegEyesOpenStage = DEFAULT_BALANCE_STAGES.find(
  (stage) => stage.stance === 'single-leg' && !stage.eyesClosed
);
export const BALANCE_SINGLE_LEG_EYES_OPEN_MAX_SEC_FOR_SCORING =
  (singleLegEyesOpenStage?.windowMs ?? 12000) / 1000;

const KNOWN_SCORING_MOVEMENT_IDS = [
  CHAIR_STAND_ID,
  BALANCE_LADDER_ID,
  TUG_ID,
  SHOULDER_FLEXION_ID,
  HINGE_REACH_ID,
] as const;

export type ScoringMovementId = (typeof KNOWN_SCORING_MOVEMENT_IDS)[number];

const KNOWN_SCORING_MOVEMENTS: ReadonlySet<string> = new Set(KNOWN_SCORING_MOVEMENT_IDS);

const STATUS_MEASURED = 'measured';
const STATUS_SKIPPED = 'skipped';
const STATUS_UNMEASURED = 'unmeasured';
const NO_MEASUREMENT_FLAG = 'no-measurement';

export type ScoringInputIssueCode =
  | 'invalid_checkup_shape'
  | 'invalid_checkup_items'
  | 'invalid_item_shape'
  | 'duplicate_movement'
  | 'unknown_item_status'
  | 'conflicting_result_state'
  | 'missing_result'
  | 'invalid_result_shape'
  | 'missing_flags'
  | 'invalid_flags'
  | 'no_measurement'
  | 'mismatched_result_movement'
  | 'missing_required_metric'
  | 'invalid_metric_type'
  | 'non_finite_metric'
  | 'non_integer_rep_count'
  | 'out_of_protocol_range';

export interface ScoringInputIssue {
  code: ScoringInputIssueCode;
  movementId?: string;
  field?: string;
}

export interface ValidatedChairStandInput {
  reps: number;
  sessionMeanVel?: number;
}

export interface ValidatedBalanceInput {
  singleLegEyesOpenSec: number;
}

export interface ValidatedTugInput {
  totalSec: number;
  nonStandardShortPath: boolean;
}

export interface ValidatedShoulderFlexionInput {
  peakFlexionDeg: number;
}

export interface ValidatedHingeReachInput {
  reachBu: number;
}

export interface ValidatedScoringInputs {
  startedAt: string;
  chairStand?: ValidatedChairStandInput;
  balanceLadder?: ValidatedBalanceInput;
  tug?: ValidatedTugInput;
  shoulderFlexion?: ValidatedShoulderFlexionInput;
  hingeReach?: ValidatedHingeReachInput;
  issues: ScoringInputIssue[];
}

type ItemBuckets = Partial<Record<ScoringMovementId, unknown[]>>;

export function validateCheckUpForScoring(checkUp: unknown): ValidatedScoringInputs {
  const issues: ScoringInputIssue[] = [];
  const validated: ValidatedScoringInputs = {
    startedAt: startedAtFromUnknown(checkUp),
    issues,
  };

  if (!isRecord(checkUp)) {
    issues.push({ code: 'invalid_checkup_shape' });
    return validated;
  }
  if (!Array.isArray(checkUp.items)) {
    issues.push({ code: 'invalid_checkup_items', field: 'items' });
    return validated;
  }

  const buckets: ItemBuckets = {};
  for (const rawItem of checkUp.items) {
    if (!isRecord(rawItem) || typeof rawItem.movementId !== 'string') {
      issues.push({ code: 'invalid_item_shape' });
      continue;
    }
    if (!isKnownScoringMovementId(rawItem.movementId)) continue;
    const items = buckets[rawItem.movementId] ?? [];
    items.push(rawItem);
    buckets[rawItem.movementId] = items;
  }

  for (const movementId of KNOWN_SCORING_MOVEMENT_IDS) {
    const items = buckets[movementId];
    if (!items || items.length === 0) continue;
    if (items.length > 1) {
      issues.push({ code: 'duplicate_movement', movementId });
      continue;
    }
    const result = measuredResultRecord(items[0], movementId, issues);
    if (!result) continue;

    switch (movementId) {
      case CHAIR_STAND_ID:
        validated.chairStand = validateChairStand(result, issues);
        break;
      case BALANCE_LADDER_ID:
        validated.balanceLadder = validateBalance(result, issues);
        break;
      case TUG_ID:
        validated.tug = validateTug(result, issues);
        break;
      case SHOULDER_FLEXION_ID:
        validated.shoulderFlexion = validateShoulderFlexion(result, issues);
        break;
      case HINGE_REACH_ID:
        validated.hingeReach = validateHingeReach(result, issues);
        break;
    }
  }

  return validated;
}

function measuredResultRecord(
  rawItem: unknown,
  movementId: ScoringMovementId,
  issues: ScoringInputIssue[]
): Record<string, unknown> | null {
  if (!isRecord(rawItem)) {
    issues.push({ code: 'invalid_item_shape', movementId });
    return null;
  }

  const status = rawItem.status;
  if (status !== STATUS_MEASURED && status !== STATUS_SKIPPED && status !== STATUS_UNMEASURED) {
    issues.push({ code: 'unknown_item_status', movementId, field: 'status' });
    return null;
  }

  if (status !== STATUS_MEASURED) {
    if (rawItem.result !== null && rawItem.result !== undefined) {
      issues.push({ code: 'conflicting_result_state', movementId, field: 'result' });
    }
    return null;
  }

  if (rawItem.result === null || rawItem.result === undefined) {
    issues.push({ code: 'missing_result', movementId, field: 'result' });
    return null;
  }
  if (!isRecord(rawItem.result)) {
    issues.push({ code: 'invalid_result_shape', movementId, field: 'result' });
    return null;
  }

  const result = rawItem.result;
  if (typeof result.movementId === 'string' && result.movementId !== movementId) {
    issues.push({ code: 'mismatched_result_movement', movementId, field: 'result.movementId' });
    return null;
  }
  if (!Object.prototype.hasOwnProperty.call(result, 'flags')) {
    issues.push({ code: 'missing_flags', movementId, field: 'result.flags' });
    return null;
  }
  if (!Array.isArray(result.flags) || !result.flags.every((flag) => typeof flag === 'string')) {
    issues.push({ code: 'invalid_flags', movementId, field: 'result.flags' });
    return null;
  }
  if (result.flags.includes(NO_MEASUREMENT_FLAG)) {
    issues.push({ code: 'no_measurement', movementId });
    return null;
  }

  return result;
}

function validateChairStand(
  result: Record<string, unknown>,
  issues: ScoringInputIssue[]
): ValidatedChairStandInput | undefined {
  const movementId = CHAIR_STAND_ID;
  const reps = requiredNumber(result, 'reps', movementId, issues);
  if (reps === null) return undefined;
  if (!Number.isInteger(reps)) {
    issues.push({ code: 'non_integer_rep_count', movementId, field: 'reps' });
    return undefined;
  }
  if (reps <= 0 || reps > CHAIR_STAND_MAX_REPS_FOR_SCORING) {
    issues.push({ code: 'out_of_protocol_range', movementId, field: 'reps' });
    return undefined;
  }

  const sessionMeanVel = optionalPositiveNumber(result, 'sessionMeanVel', movementId, issues);
  return sessionMeanVel === undefined ? { reps } : { reps, sessionMeanVel };
}

function validateBalance(
  result: Record<string, unknown>,
  issues: ScoringInputIssue[]
): ValidatedBalanceInput | undefined {
  const movementId = BALANCE_LADDER_ID;
  const singleLegEyesOpenSec = requiredNumber(result, 'singleLegEyesOpenSec', movementId, issues);
  if (singleLegEyesOpenSec === null) return undefined;
  if (
    singleLegEyesOpenSec <= 0 ||
    singleLegEyesOpenSec > BALANCE_SINGLE_LEG_EYES_OPEN_MAX_SEC_FOR_SCORING
  ) {
    issues.push({ code: 'out_of_protocol_range', movementId, field: 'singleLegEyesOpenSec' });
    return undefined;
  }
  return { singleLegEyesOpenSec };
}

function validateTug(
  result: Record<string, unknown>,
  issues: ScoringInputIssue[]
): ValidatedTugInput | undefined {
  const movementId = TUG_ID;
  const completed = result.completed;
  if (typeof completed !== 'boolean') {
    issues.push({ code: 'invalid_metric_type', movementId, field: 'completed' });
    return undefined;
  }
  if (!completed) return undefined;

  const totalSec = requiredNumber(result, 'totalSec', movementId, issues);
  if (totalSec === null) return undefined;
  if (totalSec <= 0) {
    issues.push({ code: 'out_of_protocol_range', movementId, field: 'totalSec' });
    return undefined;
  }
  return {
    totalSec,
    nonStandardShortPath: result.nonStandardShortPath === true,
  };
}

function validateShoulderFlexion(
  result: Record<string, unknown>,
  issues: ScoringInputIssue[]
): ValidatedShoulderFlexionInput | undefined {
  const movementId = SHOULDER_FLEXION_ID;
  const peakFlexionDeg = requiredNumber(result, 'peakFlexionDeg', movementId, issues);
  if (peakFlexionDeg === null) return undefined;
  if (
    peakFlexionDeg < MIN_VALID_SHOULDER_FLEXION_DEG ||
    peakFlexionDeg > MAX_VALID_SHOULDER_FLEXION_DEG
  ) {
    issues.push({ code: 'out_of_protocol_range', movementId, field: 'peakFlexionDeg' });
    return undefined;
  }
  return { peakFlexionDeg };
}

function validateHingeReach(
  result: Record<string, unknown>,
  issues: ScoringInputIssue[]
): ValidatedHingeReachInput | undefined {
  const movementId = HINGE_REACH_ID;
  const reachBu = requiredNumber(result, 'reachBu', movementId, issues);
  return reachBu === null ? undefined : { reachBu };
}

function requiredNumber(
  result: Record<string, unknown>,
  field: keyof ChairStandResult | keyof BalanceResult | keyof TugResult | keyof ShoulderFlexionResult | keyof HingeReachResult,
  movementId: ScoringMovementId,
  issues: ScoringInputIssue[]
): number | null {
  if (!Object.prototype.hasOwnProperty.call(result, field)) {
    issues.push({ code: 'missing_required_metric', movementId, field: String(field) });
    return null;
  }
  const value = result[field];
  if (typeof value !== 'number') {
    issues.push({ code: 'invalid_metric_type', movementId, field: String(field) });
    return null;
  }
  if (!Number.isFinite(value)) {
    issues.push({ code: 'non_finite_metric', movementId, field: String(field) });
    return null;
  }
  return value;
}

function optionalPositiveNumber(
  result: Record<string, unknown>,
  field: keyof ChairStandResult,
  movementId: ScoringMovementId,
  issues: ScoringInputIssue[]
): number | undefined {
  if (!Object.prototype.hasOwnProperty.call(result, field)) return undefined;
  const value = result[field];
  if (typeof value !== 'number') {
    issues.push({ code: 'invalid_metric_type', movementId, field: String(field) });
    return undefined;
  }
  if (!Number.isFinite(value)) {
    issues.push({ code: 'non_finite_metric', movementId, field: String(field) });
    return undefined;
  }
  if (value <= 0) {
    issues.push({ code: 'out_of_protocol_range', movementId, field: String(field) });
    return undefined;
  }
  return value;
}

function isKnownScoringMovementId(value: string): value is ScoringMovementId {
  return KNOWN_SCORING_MOVEMENTS.has(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function startedAtFromUnknown(value: unknown): string {
  if (!isRecord(value)) return '';
  return typeof value.startedAt === 'string' ? value.startedAt : '';
}
