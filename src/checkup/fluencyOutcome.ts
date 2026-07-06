/**
 * Seam outcome → stored result mapping (FL2). Pure. The seam's closed enum
 * codes translate into the record's honest statuses; nothing else crosses.
 */

import {
  FLUENCY_RESULT_SCHEMA_VERSION,
  type FluencyCategoryId,
  type FluencyResult,
} from './clarityInstruments';
import type { FluencyCountOutcome } from '../voice/fluencyTranscriber';

export function fluencyResultFromOutcome(input: {
  outcome: FluencyCountOutcome;
  categoryId: FluencyCategoryId;
  backgrounded?: boolean;
}): FluencyResult {
  const base = {
    schemaVersion: FLUENCY_RESULT_SCHEMA_VERSION,
    categoryId: input.categoryId,
    durationSec: 60 as const,
  };
  if (input.backgrounded) {
    return { ...base, status: 'invalid', invalidReason: 'app_backgrounded' };
  }
  if (input.outcome.ok) {
    return { ...base, status: 'measured', validWordCount: input.outcome.validWordCount };
  }
  switch (input.outcome.reason) {
    case 'no_speech':
      return { ...base, status: 'invalid', invalidReason: 'no_speech_detected' };
    case 'permission_denied':
      // She declined the OS prompt — her call, recorded as such.
      return { ...base, status: 'invalid', invalidReason: 'user_declined' };
    case 'engine_unavailable':
      return { ...base, status: 'unavailable' };
    case 'timeout':
    case 'recognition_failed':
      return { ...base, status: 'invalid', invalidReason: 'transcriber_failed' };
  }
}

/** The skipped-at-consent record (check-up completes normally without it). */
export function skippedFluencyResult(categoryId: FluencyCategoryId): FluencyResult {
  return {
    schemaVersion: FLUENCY_RESULT_SCHEMA_VERSION,
    categoryId,
    status: 'skipped',
    durationSec: 60,
  };
}

/** The device-gate-pending record (transcriber reports unavailable). */
export function unavailableFluencyResult(categoryId: FluencyCategoryId): FluencyResult {
  return {
    schemaVersion: FLUENCY_RESULT_SCHEMA_VERSION,
    categoryId,
    status: 'unavailable',
    durationSec: 60,
  };
}
