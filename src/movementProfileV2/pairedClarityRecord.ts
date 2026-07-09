/**
 * Explicit privacy boundary from live matched-pair state to local storage.
 * Runtime-only timestamps and response details are intentionally not copied.
 */

import {
  PAIRED_CLARITY_RESULT_SCHEMA_VERSION,
  validPairedClarityResult,
  type PairedClarityProtocolRecord,
  type PairedClarityResponseProtocolRecord,
  type PairedClarityResultRecord,
  type PairedClarityTrialRecord,
  type PairedClarityUnavailableReason,
} from '../checkup/clarityInstruments';
import type { ClarityResponseProtocolMetadata } from './clarityResponseScorer';
import type {
  PairedClarityProtocolMetadata,
  PairedClarityResult,
  PairedClarityTrialResult,
} from './pairedClarityRuntime';

export type PairedClarityRecordInput =
  | {
      readonly result: PairedClarityResult;
      readonly responseProtocol: ClarityResponseProtocolMetadata;
    }
  | {
      readonly protocol: PairedClarityProtocolMetadata;
      readonly responseProtocol: ClarityResponseProtocolMetadata;
      readonly unavailableReason: PairedClarityUnavailableReason;
    };

/** Convert the live result to the minimal, defensively validated stored form. */
export function createPairedClarityResultRecord(
  input: PairedClarityRecordInput
): PairedClarityResultRecord {
  const liveProtocol = 'result' in input ? input.result.protocol : input.protocol;
  const protocol = copyPairProtocol(liveProtocol);
  const responseProtocol = copyResponseProtocol(input.responseProtocol);

  if ('unavailableReason' in input) {
    return requirePersistable({
      schemaVersion: PAIRED_CLARITY_RESULT_SCHEMA_VERSION,
      status: 'unavailable',
      protocol,
      responseProtocol,
      reason: input.unavailableReason,
    });
  }

  const result = input.result;
  if (result.status === 'measured') {
    return requirePersistable({
      schemaVersion: PAIRED_CLARITY_RESULT_SCHEMA_VERSION,
      status: 'measured',
      protocol,
      responseProtocol,
      solo: copyTrial(result.solo, 'solo'),
      dual: copyTrial(result.dual, 'dual'),
      cognitive: {
        attempts: result.cognitive.attempts,
        correct: result.cognitive.correct,
        errors: result.cognitive.errors,
      },
      motorCostPercent: result.motorCostPercent,
      ceilingLimited: result.ceilingLimited,
    });
  }
  if (result.status === 'ineligible') {
    return requirePersistable({
      schemaVersion: PAIRED_CLARITY_RESULT_SCHEMA_VERSION,
      status: 'ineligible',
      protocol,
      responseProtocol,
      reason: result.reason,
      solo: copyTrial(result.solo, 'solo'),
    });
  }
  return requirePersistable({
    schemaVersion: PAIRED_CLARITY_RESULT_SCHEMA_VERSION,
    status: 'invalid',
    protocol,
    responseProtocol,
    reason: result.reason,
    ...(result.solo ? { solo: copyTrial(result.solo, 'solo') } : {}),
    ...(result.dual ? { dual: copyTrial(result.dual, 'dual') } : {}),
    ...(result.cognitive
      ? {
          cognitive: {
            attempts: result.cognitive.attempts,
            correct: result.cognitive.correct,
            errors: result.cognitive.errors,
          },
        }
      : {}),
  });
}

function copyPairProtocol(protocol: PairedClarityProtocolMetadata): PairedClarityProtocolRecord {
  return {
    protocolId: protocol.protocolId,
    protocolVersion: protocol.protocolVersion,
    movementId: protocol.movementId,
    stanceId: protocol.stanceId,
    standingSide: protocol.standingSide,
    order: protocol.order,
    trialCapMs: protocol.trialCapMs,
    standardizedRestMs: protocol.standardizedRestMs,
    liftConfirmMs: protocol.liftConfirmMs,
    touchdownDebounceFrames: protocol.touchdownDebounceFrames,
    trackingLossConfirmFrames: protocol.trackingLossConfirmFrames,
    validityPolicy: {
      minSoloHoldMs: protocol.validityPolicy.minSoloHoldMs,
      ceilingExclusionMarginMs: protocol.validityPolicy.ceilingExclusionMarginMs,
      minCognitiveAttempts: protocol.validityPolicy.minCognitiveAttempts,
      minCognitiveAccuracy: protocol.validityPolicy.minCognitiveAccuracy,
    },
  };
}

function copyResponseProtocol(
  protocol: ClarityResponseProtocolMetadata
): PairedClarityResponseProtocolRecord {
  return {
    protocolId: protocol.protocolId,
    protocolVersion: protocol.protocolVersion,
    sequenceAlgorithmId: protocol.sequenceAlgorithmId,
    sequenceSeedId: protocol.sequenceSeedId,
    responseSignal: protocol.responseSignal,
    responseRule: protocol.responseRule,
    leadInMs: protocol.leadInMs,
    promptVisibleMs: protocol.promptVisibleMs,
    responseWindowMs: protocol.responseWindowMs,
    promptCadenceMs: protocol.promptCadenceMs,
    promptCount: protocol.promptCount,
    minimumPresentedCount: protocol.minimumPresentedCount,
  };
}

function copyTrial<Kind extends 'solo' | 'dual'>(
  trial: PairedClarityTrialResult,
  kind: Kind
): PairedClarityTrialRecord & { kind: Kind } {
  if (trial.kind !== kind) throw new Error('paired Clarity result is not persistable');
  return {
    kind,
    durationMs: trial.durationMs,
    durationSec: trial.durationSec,
    termination: trial.termination,
  };
}

function requirePersistable(record: PairedClarityResultRecord): PairedClarityResultRecord {
  const parsed = validPairedClarityResult(record);
  if (!parsed) throw new Error('paired Clarity result is not persistable');
  return parsed;
}
