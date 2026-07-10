/**
 * Objective Clarity instruments — dual-task record + derived cost
 * (CLARITY_INSTRUMENTS_TDD §3–4, approved 2026-07-06; fluency joins in FL2
 * after its own checkpoint).
 *
 * Rules of record:
 * - Additive appendix on CheckUp, exactly like selfReport: no history version
 *   bump, defensively normalized at the serialize boundary, and NEVER read by
 *   movement protocol evidence, claim eligibility, or any measurement surface
 *   outside Clarity's own (isolation pinned by test).
 * - All fields are numbers/enums — no free text, by type.
 * - Within-session by construction: the single-task baseline is the SAME
 *   session's valid run of the SAME movement; stored prior sessions are never
 *   consulted, and an invalid/absent single-task run means the instrument
 *   marks itself invalid rather than fabricating.
 * - Negative cost is kept, not floored: performing better under load is real
 *   (motor automaticity) and flooring would fabricate degradation symmetry.
 * - `ceilingLimited` (F2): when the single-task run hit its protocol cap the
 *   cost can only saturate toward 0 — tagged and worded honestly.
 * - status 'unavailable' is the recorded-limitation state (device gate failed
 *   or no on-device capability) — the offer never appeared, the record says
 *   so, the check-up is untouched.
 */

export const CLARITY_INSTRUMENTS_SCHEMA_VERSION = 1 as const;
export const DUAL_TASK_RESULT_SCHEMA_VERSION = 1 as const;
export const PAIRED_CLARITY_RESULT_SCHEMA_VERSION = 1 as const;

export type DualTaskStatus = 'measured' | 'invalid' | 'skipped' | 'unavailable';

/** Reuses the invalid-measurement vocabulary; `no_speech_detected` is the
 * F5 line: she left the VERBAL task (invalid) — never conflated with ending
 * the MOVEMENT under load (valid degradation, recorded by the grader). */
export type DualTaskInvalidReason =
  | 'no_speech_detected'
  | 'single_task_invalid'
  | 'tracking_interrupted'
  | 'app_backgrounded'
  | 'user_declined';

export interface DualTaskResult {
  schemaVersion: typeof DUAL_TASK_RESULT_SCHEMA_VERSION;
  /** The balance protocol that was re-run (same movement as the single-task). */
  movementId: string;
  status: DualTaskStatus;
  invalidReason?: DualTaskInvalidReason;
  singleTaskSeconds?: number;
  dualTaskSeconds?: number;
  /** (single − dual) / single × 100 — negative kept, never floored. */
  costPercent?: number;
  /** F2: single-task run hit its protocol cap; cost saturates toward 0. */
  ceilingLimited?: boolean;
  /** VAD aggregate — speech PRESENCE evidence only, never content. */
  speechActiveMs?: number;
}

/**
 * Versioned storage shape for the matched solo/dual balance pair.
 *
 * This is intentionally distinct from legacy `DualTaskResult`: the legacy
 * record compared an official best hold with one appendix attempt, while this
 * record describes a purpose-built same-side, same-stance pair. The two must
 * never be interpreted as interchangeable measurements.
 */
export type PairedClarityStatus = 'measured' | 'ineligible' | 'invalid' | 'unavailable';

export type PairedClarityIneligibleReason =
  | 'solo_below_floor'
  | 'solo_at_or_near_ceiling';

export type PairedClarityInvalidReason =
  | 'solo_setup_timed_out'
  | 'dual_setup_timed_out'
  | 'solo_tracking_interrupted'
  | 'dual_tracking_interrupted'
  | 'app_backgrounded'
  | 'cognitive_aggregate_invalid'
  | 'cognitive_participation_below_floor'
  | 'cognitive_response_engagement_below_floor'
  | 'cognitive_accuracy_below_floor'
  | 'cognitive_unavailable'
  | 'cognitive_interrupted';

export type PairedClarityUnavailableReason =
  | 'speech_presence_unavailable'
  | 'camera_microphone_coexistence_unavailable'
  | 'response_task_unavailable';

export interface PairedClarityValidityPolicyRecord {
  readonly minSoloHoldMs: number;
  readonly ceilingExclusionMarginMs: number;
  readonly minCognitiveAttempts: number;
  readonly minCognitiveResponses: number;
  readonly minCognitiveAccuracy: number;
}

export interface PairedClarityProtocolRecord {
  readonly protocolId: 'pearl_paired_clarity_balance_v1';
  readonly protocolVersion: 1;
  readonly movementId: 'one-leg-balance-45s-v2';
  readonly stanceId: 'single_leg_eyes_open_v1';
  readonly standingSide: 'left' | 'right';
  readonly order: 'solo_then_dual';
  readonly trialCapMs: number;
  readonly standardizedRestMs: number;
  readonly liftConfirmMs: number;
  readonly touchdownDebounceFrames: number;
  readonly trackingLossConfirmFrames: number;
  readonly validityPolicy: PairedClarityValidityPolicyRecord;
}

export interface PairedClarityResponseProtocolRecord {
  readonly protocolId: 'pearl_visual_go_no_go_v1';
  readonly protocolVersion: 1;
  readonly sequenceAlgorithmId: 'fixed_balanced_forms_v1';
  readonly sequenceSeedId: 'pearl_vgng_form_a_v1' | 'pearl_vgng_form_b_v1';
  readonly responseSignal: 'speech_presence_boolean';
  readonly responseRule: 'respond_on_target_only';
  readonly leadInMs: number;
  readonly promptVisibleMs: number;
  readonly responseWindowMs: number;
  readonly promptCadenceMs: number;
  readonly promptCount: number;
  readonly minimumPresentedCount: number;
}

export interface PairedClarityTrialRecord {
  readonly kind: 'solo' | 'dual';
  readonly durationMs: number;
  readonly durationSec: number;
  readonly termination: 'touchdown' | 'ceiling';
}

/** Counts only; correctness is never inferred from or stored as content. */
export interface PairedClarityCognitiveRecord {
  readonly attempts: number;
  readonly responses: number;
  readonly correct: number;
  readonly errors: number;
}

interface PairedClarityResultBase {
  readonly schemaVersion: typeof PAIRED_CLARITY_RESULT_SCHEMA_VERSION;
  readonly protocol: PairedClarityProtocolRecord;
  readonly responseProtocol: PairedClarityResponseProtocolRecord;
}

export type PairedClarityResultRecord =
  | (PairedClarityResultBase & {
      readonly status: 'measured';
      readonly solo: PairedClarityTrialRecord & { readonly kind: 'solo' };
      readonly dual: PairedClarityTrialRecord & { readonly kind: 'dual' };
      readonly cognitive: PairedClarityCognitiveRecord;
      /** (solo - dual) / solo * 100; negative values are retained. */
      readonly motorCostPercent: number;
      readonly ceilingLimited: boolean;
    })
  | (PairedClarityResultBase & {
      readonly status: 'ineligible';
      readonly reason: PairedClarityIneligibleReason;
      readonly solo: PairedClarityTrialRecord & { readonly kind: 'solo' };
    })
  | (PairedClarityResultBase & {
      readonly status: 'invalid';
      readonly reason: PairedClarityInvalidReason;
      readonly solo?: PairedClarityTrialRecord & { readonly kind: 'solo' };
      readonly dual?: PairedClarityTrialRecord & { readonly kind: 'dual' };
      readonly cognitive?: PairedClarityCognitiveRecord;
    })
  | (PairedClarityResultBase & {
      readonly status: 'unavailable';
      readonly reason: PairedClarityUnavailableReason;
    });

export const FLUENCY_RESULT_SCHEMA_VERSION = 1 as const;

/** F3 (founder): the fixed parallel-forms set. Order matters for rotation. */
export const FLUENCY_CATEGORY_IDS = ['animals', 'foods', 'countries', 'kitchen_things'] as const;
export type FluencyCategoryId = (typeof FLUENCY_CATEGORY_IDS)[number];

export type FluencyStatus = 'measured' | 'invalid' | 'skipped' | 'unavailable';
export type FluencyInvalidReason =
  | 'no_speech_detected'
  | 'transcriber_failed'
  | 'app_backgrounded'
  | 'user_declined';

/**
 * PRIVACY BY TYPE (FL1, pinned by fluencyPrivacy.test.ts): every field is a
 * number, literal, or closed enum — the record physically cannot carry a
 * transcript, a word, or audio. The count is all that is ever kept.
 */
export interface FluencyResult {
  schemaVersion: typeof FLUENCY_RESULT_SCHEMA_VERSION;
  categoryId: FluencyCategoryId;
  status: FluencyStatus;
  invalidReason?: FluencyInvalidReason;
  /** Distinct valid words named — the ONLY thing derived from her speech. */
  validWordCount?: number;
  durationSec: 60;
}

export interface ClarityInstrumentsRecord {
  schemaVersion: typeof CLARITY_INSTRUMENTS_SCHEMA_VERSION;
  /** Current matched-pair instrument. Kept distinct from legacy `dualTask`. */
  pairedTask?: PairedClarityResultRecord;
  /** Legacy appendix retained for already-stored check-ups. */
  dualTask?: DualTaskResult;
  fluency?: FluencyResult;
}

/**
 * The derived metric. Pure; throws on non-positive single-task seconds
 * (callers must have validated the single-task run first — never fabricate).
 *
 * KNOWN PROPERTY (founder flag of record, 2026-07-06): this value is
 * comparable WITHIN-PERSON over time only. The end-of-battery fatigue offset
 * and the best-of-trials-vs-single-attempt asymmetry are baked into every
 * value, so it is NOT valid for any cross-person or cross-position
 * comparison — any future feature comparing it beyond her own history must
 * be flagged against the decisions.md entry and rejected or redesigned.
 */
export function computeDualTaskCostPercent(input: {
  singleTaskSeconds: number;
  dualTaskSeconds: number;
}): number {
  if (!Number.isFinite(input.singleTaskSeconds) || input.singleTaskSeconds <= 0) {
    throw new Error('dual-task cost requires a valid positive single-task time');
  }
  if (!Number.isFinite(input.dualTaskSeconds) || input.dualTaskSeconds < 0) {
    throw new Error('dual-task cost requires a valid dual-task time');
  }
  return ((input.singleTaskSeconds - input.dualTaskSeconds) / input.singleTaskSeconds) * 100;
}

/**
 * The Clarity trend value for a measured dual-task run: inverted cost
 * (100 − cost) so higher = clearer/steadier, matching every Clarity series'
 * trainable direction. Null for anything unmeasured.
 */
export function dualTaskReadingValue(result: DualTaskResult | undefined): number | null {
  if (!result || result.status !== 'measured' || !Number.isFinite(result.costPercent)) return null;
  return 100 - (result.costPercent as number);
}

/**
 * Current matched-pair trend value. Higher means steadier under the response
 * task; invalid/ineligible/unavailable pairs never enter a user-facing trend.
 */
export function pairedClarityReadingValue(
  result: PairedClarityResultRecord | undefined
): number | null {
  if (
    !result ||
    result.status !== 'measured' ||
    result.ceilingLimited ||
    !Number.isFinite(result.motorCostPercent)
  ) {
    return null;
  }
  return 100 - result.motorCostPercent;
}

function finitePositive(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

const DUAL_TASK_STATUSES: readonly DualTaskStatus[] = ['measured', 'invalid', 'skipped', 'unavailable'];
const DUAL_TASK_INVALID_REASONS: readonly DualTaskInvalidReason[] = [
  'no_speech_detected',
  'single_task_invalid',
  'tracking_interrupted',
  'app_backgrounded',
  'user_declined',
];

function validDualTaskResult(value: unknown): DualTaskResult | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as Partial<DualTaskResult>;
  if (raw.schemaVersion !== DUAL_TASK_RESULT_SCHEMA_VERSION) return undefined;
  if (typeof raw.movementId !== 'string' || raw.movementId.length === 0) return undefined;
  if (!DUAL_TASK_STATUSES.includes(raw.status as DualTaskStatus)) return undefined;
  const status = raw.status as DualTaskStatus;
  const invalidReason = DUAL_TASK_INVALID_REASONS.includes(raw.invalidReason as DualTaskInvalidReason)
    ? (raw.invalidReason as DualTaskInvalidReason)
    : undefined;
  // A measured result must carry a coherent measurement; anything else drops
  // to undefined rather than storing a half-record.
  if (status === 'measured') {
    if (
      !finitePositive(raw.singleTaskSeconds) ||
      raw.singleTaskSeconds <= 0 ||
      !finitePositive(raw.dualTaskSeconds) ||
      typeof raw.costPercent !== 'number' ||
      !Number.isFinite(raw.costPercent)
    ) {
      return undefined;
    }
  }
  return {
    schemaVersion: DUAL_TASK_RESULT_SCHEMA_VERSION,
    movementId: raw.movementId,
    status,
    ...(status === 'invalid' && invalidReason ? { invalidReason } : {}),
    ...(finitePositive(raw.singleTaskSeconds) ? { singleTaskSeconds: raw.singleTaskSeconds } : {}),
    ...(finitePositive(raw.dualTaskSeconds) ? { dualTaskSeconds: raw.dualTaskSeconds } : {}),
    ...(typeof raw.costPercent === 'number' && Number.isFinite(raw.costPercent)
      ? { costPercent: raw.costPercent }
      : {}),
    ...(raw.ceilingLimited === true ? { ceilingLimited: true } : {}),
    ...(finitePositive(raw.speechActiveMs) ? { speechActiveMs: raw.speechActiveMs } : {}),
  };
}

const PAIRED_CLARITY_STATUSES: readonly PairedClarityStatus[] = [
  'measured',
  'ineligible',
  'invalid',
  'unavailable',
];
const PAIRED_CLARITY_INELIGIBLE_REASONS: readonly PairedClarityIneligibleReason[] = [
  'solo_below_floor',
  'solo_at_or_near_ceiling',
];
const PAIRED_CLARITY_INVALID_REASONS: readonly PairedClarityInvalidReason[] = [
  'solo_setup_timed_out',
  'dual_setup_timed_out',
  'solo_tracking_interrupted',
  'dual_tracking_interrupted',
  'app_backgrounded',
  'cognitive_aggregate_invalid',
  'cognitive_participation_below_floor',
  'cognitive_response_engagement_below_floor',
  'cognitive_accuracy_below_floor',
  'cognitive_unavailable',
  'cognitive_interrupted',
];
const PAIRED_CLARITY_UNAVAILABLE_REASONS: readonly PairedClarityUnavailableReason[] = [
  'speech_presence_unavailable',
  'camera_microphone_coexistence_unavailable',
  'response_task_unavailable',
];
const PAIRED_CLARITY_RESPONSE_SEEDS: readonly PairedClarityResponseProtocolRecord['sequenceSeedId'][] = [
  'pearl_vgng_form_a_v1',
  'pearl_vgng_form_b_v1',
];
const PAIRED_CLARITY_BINARY_CHANCE_ACCURACY = 0.5;

function objectRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined;
}

function finiteStrictPositive(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function nonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function positiveInteger(value: unknown): value is number {
  return nonNegativeInteger(value) && value > 0;
}

function validPairedClarityProtocol(value: unknown): PairedClarityProtocolRecord | undefined {
  const raw = objectRecord(value);
  const policy = objectRecord(raw?.validityPolicy);
  if (!raw || !policy) return undefined;
  if (
    raw.protocolId !== 'pearl_paired_clarity_balance_v1' ||
    raw.protocolVersion !== 1 ||
    raw.movementId !== 'one-leg-balance-45s-v2' ||
    raw.stanceId !== 'single_leg_eyes_open_v1' ||
    (raw.standingSide !== 'left' && raw.standingSide !== 'right') ||
    raw.order !== 'solo_then_dual' ||
    !finiteStrictPositive(raw.trialCapMs) ||
    !finitePositive(raw.standardizedRestMs) ||
    !finiteStrictPositive(raw.liftConfirmMs) ||
    !positiveInteger(raw.touchdownDebounceFrames) ||
    !positiveInteger(raw.trackingLossConfirmFrames) ||
    !finiteStrictPositive(policy.minSoloHoldMs) ||
    !finitePositive(policy.ceilingExclusionMarginMs) ||
    !positiveInteger(policy.minCognitiveAttempts) ||
    !positiveInteger(policy.minCognitiveResponses) ||
    policy.minCognitiveResponses > policy.minCognitiveAttempts ||
    typeof policy.minCognitiveAccuracy !== 'number' ||
    !Number.isFinite(policy.minCognitiveAccuracy) ||
    policy.minCognitiveAccuracy <= PAIRED_CLARITY_BINARY_CHANCE_ACCURACY ||
    policy.minCognitiveAccuracy > 1 ||
    policy.minSoloHoldMs >= raw.trialCapMs ||
    policy.ceilingExclusionMarginMs >= raw.trialCapMs - policy.minSoloHoldMs
  ) {
    return undefined;
  }
  return {
    protocolId: 'pearl_paired_clarity_balance_v1',
    protocolVersion: 1,
    movementId: 'one-leg-balance-45s-v2',
    stanceId: 'single_leg_eyes_open_v1',
    standingSide: raw.standingSide,
    order: 'solo_then_dual',
    trialCapMs: raw.trialCapMs,
    standardizedRestMs: raw.standardizedRestMs,
    liftConfirmMs: raw.liftConfirmMs,
    touchdownDebounceFrames: raw.touchdownDebounceFrames,
    trackingLossConfirmFrames: raw.trackingLossConfirmFrames,
    validityPolicy: {
      minSoloHoldMs: policy.minSoloHoldMs,
      ceilingExclusionMarginMs: policy.ceilingExclusionMarginMs,
      minCognitiveAttempts: policy.minCognitiveAttempts,
      minCognitiveResponses: policy.minCognitiveResponses,
      minCognitiveAccuracy: policy.minCognitiveAccuracy,
    },
  };
}

function validPairedClarityResponseProtocol(
  value: unknown
): PairedClarityResponseProtocolRecord | undefined {
  const raw = objectRecord(value);
  if (!raw) return undefined;
  if (
    raw.protocolId !== 'pearl_visual_go_no_go_v1' ||
    raw.protocolVersion !== 1 ||
    raw.sequenceAlgorithmId !== 'fixed_balanced_forms_v1' ||
    !PAIRED_CLARITY_RESPONSE_SEEDS.includes(
      raw.sequenceSeedId as PairedClarityResponseProtocolRecord['sequenceSeedId']
    ) ||
    raw.responseSignal !== 'speech_presence_boolean' ||
    raw.responseRule !== 'respond_on_target_only' ||
    !finitePositive(raw.leadInMs) ||
    !finiteStrictPositive(raw.promptVisibleMs) ||
    !finiteStrictPositive(raw.responseWindowMs) ||
    !finiteStrictPositive(raw.promptCadenceMs) ||
    !positiveInteger(raw.promptCount) ||
    !positiveInteger(raw.minimumPresentedCount) ||
    raw.promptVisibleMs > raw.responseWindowMs ||
    raw.responseWindowMs > raw.promptCadenceMs ||
    raw.minimumPresentedCount > raw.promptCount
  ) {
    return undefined;
  }
  return {
    protocolId: 'pearl_visual_go_no_go_v1',
    protocolVersion: 1,
    sequenceAlgorithmId: 'fixed_balanced_forms_v1',
    sequenceSeedId:
      raw.sequenceSeedId as PairedClarityResponseProtocolRecord['sequenceSeedId'],
    responseSignal: 'speech_presence_boolean',
    responseRule: 'respond_on_target_only',
    leadInMs: raw.leadInMs,
    promptVisibleMs: raw.promptVisibleMs,
    responseWindowMs: raw.responseWindowMs,
    promptCadenceMs: raw.promptCadenceMs,
    promptCount: raw.promptCount,
    minimumPresentedCount: raw.minimumPresentedCount,
  };
}

function validPairedClarityTrial(
  value: unknown,
  kind: 'solo' | 'dual',
  trialCapMs: number
): PairedClarityTrialRecord | undefined {
  const raw = objectRecord(value);
  if (
    !raw ||
    raw.kind !== kind ||
    !finitePositive(raw.durationMs) ||
    !finitePositive(raw.durationSec) ||
    (raw.termination !== 'touchdown' && raw.termination !== 'ceiling') ||
    raw.durationMs > trialCapMs ||
    Math.abs(raw.durationSec - raw.durationMs / 1000) > 1e-9 ||
    (raw.termination === 'ceiling' && raw.durationMs !== trialCapMs) ||
    (raw.termination === 'touchdown' && raw.durationMs >= trialCapMs)
  ) {
    return undefined;
  }
  return {
    kind,
    durationMs: raw.durationMs,
    durationSec: raw.durationMs / 1000,
    termination: raw.termination,
  };
}

function validPairedClarityCognitive(
  value: unknown
): PairedClarityCognitiveRecord | undefined {
  const raw = objectRecord(value);
  if (
    !raw ||
    !nonNegativeInteger(raw.attempts) ||
    !nonNegativeInteger(raw.responses) ||
    !nonNegativeInteger(raw.correct) ||
    !nonNegativeInteger(raw.errors) ||
    raw.responses > raw.attempts ||
    raw.correct + raw.errors !== raw.attempts
  ) {
    return undefined;
  }
  return {
    attempts: raw.attempts,
    responses: raw.responses,
    correct: raw.correct,
    errors: raw.errors,
  };
}

function completedPairedClarityPromptCount(
  durationMs: number,
  protocol: PairedClarityResponseProtocolRecord
): number {
  const firstWindowEndsAtMs = protocol.leadInMs + protocol.responseWindowMs;
  if (durationMs < firstWindowEndsAtMs) return 0;
  return Math.min(
    protocol.promptCount,
    1 + Math.floor((durationMs - firstWindowEndsAtMs) / protocol.promptCadenceMs)
  );
}

function costValuesMatch(stored: number, computed: number): boolean {
  const tolerance = Math.max(1e-7, Math.abs(computed) * 1e-9);
  return Math.abs(stored - computed) <= tolerance;
}

/** Defensive parser for the current matched-pair record only. */
export function validPairedClarityResult(
  value: unknown
): PairedClarityResultRecord | undefined {
  const raw = objectRecord(value);
  if (!raw || raw.schemaVersion !== PAIRED_CLARITY_RESULT_SCHEMA_VERSION) return undefined;
  if (!PAIRED_CLARITY_STATUSES.includes(raw.status as PairedClarityStatus)) return undefined;
  const protocol = validPairedClarityProtocol(raw.protocol);
  const responseProtocol = validPairedClarityResponseProtocol(raw.responseProtocol);
  if (!protocol || !responseProtocol) return undefined;
  const policy = protocol.validityPolicy;
  const minimumScorableDurationMs =
    responseProtocol.leadInMs +
    responseProtocol.responseWindowMs +
    (policy.minCognitiveAttempts - 1) * responseProtocol.promptCadenceMs;
  if (
    policy.minCognitiveAttempts < responseProtocol.minimumPresentedCount ||
    policy.minCognitiveAttempts > responseProtocol.promptCount ||
    policy.minSoloHoldMs < minimumScorableDurationMs
  ) {
    return undefined;
  }

  const base = {
    schemaVersion: PAIRED_CLARITY_RESULT_SCHEMA_VERSION,
    protocol,
    responseProtocol,
  } as const;

  if (raw.status === 'unavailable') {
    if (
      !PAIRED_CLARITY_UNAVAILABLE_REASONS.includes(
        raw.reason as PairedClarityUnavailableReason
      )
    ) {
      return undefined;
    }
    return { ...base, status: 'unavailable', reason: raw.reason as PairedClarityUnavailableReason };
  }

  const solo = validPairedClarityTrial(raw.solo, 'solo', protocol.trialCapMs);
  if (raw.status === 'ineligible') {
    if (
      !solo ||
      !PAIRED_CLARITY_INELIGIBLE_REASONS.includes(raw.reason as PairedClarityIneligibleReason)
    ) {
      return undefined;
    }
    const reason = raw.reason as PairedClarityIneligibleReason;
    const policy = protocol.validityPolicy;
    if (
      (reason === 'solo_below_floor' && solo.durationMs >= policy.minSoloHoldMs) ||
      (reason === 'solo_at_or_near_ceiling' &&
        solo.durationMs < protocol.trialCapMs - policy.ceilingExclusionMarginMs)
    ) {
      return undefined;
    }
    return { ...base, status: 'ineligible', reason, solo: { ...solo, kind: 'solo' } };
  }

  const dual = validPairedClarityTrial(raw.dual, 'dual', protocol.trialCapMs);
  const cognitive = validPairedClarityCognitive(raw.cognitive);
  if (raw.status === 'invalid') {
    if (!PAIRED_CLARITY_INVALID_REASONS.includes(raw.reason as PairedClarityInvalidReason)) {
      return undefined;
    }
    const hasSolo = Object.prototype.hasOwnProperty.call(raw, 'solo');
    const hasDual = Object.prototype.hasOwnProperty.call(raw, 'dual');
    const hasCognitive = Object.prototype.hasOwnProperty.call(raw, 'cognitive');
    if ((hasSolo && !solo) || (hasDual && !dual) || (hasCognitive && !cognitive)) return undefined;
    if ((dual && !solo) || (cognitive && !dual)) return undefined;
    if (
      cognitive &&
      dual &&
      cognitive.attempts !== completedPairedClarityPromptCount(dual.durationMs, responseProtocol)
    ) {
      return undefined;
    }
    const reason = raw.reason as PairedClarityInvalidReason;
    if (
      (reason === 'cognitive_participation_below_floor' &&
        (!cognitive || cognitive.attempts >= protocol.validityPolicy.minCognitiveAttempts)) ||
      (reason === 'cognitive_response_engagement_below_floor' &&
        (!cognitive ||
          cognitive.attempts < protocol.validityPolicy.minCognitiveAttempts ||
          cognitive.responses >= protocol.validityPolicy.minCognitiveResponses)) ||
      (reason === 'cognitive_accuracy_below_floor' &&
        (!cognitive ||
          cognitive.attempts < protocol.validityPolicy.minCognitiveAttempts ||
          cognitive.responses < protocol.validityPolicy.minCognitiveResponses ||
          cognitive.correct / cognitive.attempts >= protocol.validityPolicy.minCognitiveAccuracy))
    ) {
      return undefined;
    }
    return {
      ...base,
      status: 'invalid',
      reason,
      ...(solo ? { solo: { ...solo, kind: 'solo' as const } } : {}),
      ...(dual ? { dual: { ...dual, kind: 'dual' as const } } : {}),
      ...(cognitive ? { cognitive } : {}),
    };
  }

  if (!solo || !dual || !cognitive) return undefined;
  if (typeof raw.motorCostPercent !== 'number' || !Number.isFinite(raw.motorCostPercent)) {
    return undefined;
  }
  if (typeof raw.ceilingLimited !== 'boolean') return undefined;
  const expectedCost = computeDualTaskCostPercent({
    singleTaskSeconds: solo.durationSec,
    dualTaskSeconds: dual.durationSec,
  });
  const cognitiveAccuracy = cognitive.attempts > 0 ? cognitive.correct / cognitive.attempts : 0;
  if (
    solo.durationMs < policy.minSoloHoldMs ||
    solo.durationMs >= protocol.trialCapMs - policy.ceilingExclusionMarginMs ||
    cognitive.attempts < policy.minCognitiveAttempts ||
    cognitive.attempts < responseProtocol.minimumPresentedCount ||
    cognitive.attempts !== completedPairedClarityPromptCount(dual.durationMs, responseProtocol) ||
    cognitive.responses < policy.minCognitiveResponses ||
    cognitiveAccuracy < policy.minCognitiveAccuracy ||
    !costValuesMatch(raw.motorCostPercent, expectedCost) ||
    raw.ceilingLimited !== (dual.termination === 'ceiling')
  ) {
    return undefined;
  }
  return {
    ...base,
    status: 'measured',
    solo: { ...solo, kind: 'solo' },
    dual: { ...dual, kind: 'dual' },
    cognitive,
    motorCostPercent: raw.motorCostPercent,
    ceilingLimited: raw.ceilingLimited,
  };
}

const FLUENCY_STATUSES: readonly FluencyStatus[] = ['measured', 'invalid', 'skipped', 'unavailable'];
const FLUENCY_INVALID_REASONS: readonly FluencyInvalidReason[] = [
  'no_speech_detected',
  'transcriber_failed',
  'app_backgrounded',
  'user_declined',
];

function validFluencyResult(value: unknown): FluencyResult | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as Partial<FluencyResult>;
  if (raw.schemaVersion !== FLUENCY_RESULT_SCHEMA_VERSION) return undefined;
  if (!FLUENCY_CATEGORY_IDS.includes(raw.categoryId as FluencyCategoryId)) return undefined;
  if (!FLUENCY_STATUSES.includes(raw.status as FluencyStatus)) return undefined;
  if (raw.durationSec !== 60) return undefined;
  const status = raw.status as FluencyStatus;
  const invalidReason = FLUENCY_INVALID_REASONS.includes(raw.invalidReason as FluencyInvalidReason)
    ? (raw.invalidReason as FluencyInvalidReason)
    : undefined;
  const validWordCount =
    typeof raw.validWordCount === 'number' &&
    Number.isFinite(raw.validWordCount) &&
    raw.validWordCount >= 0 &&
    Number.isInteger(raw.validWordCount)
      ? raw.validWordCount
      : undefined;
  // Measured requires a coherent count; anything else drops as a unit.
  if (status === 'measured' && validWordCount === undefined) return undefined;
  return {
    schemaVersion: FLUENCY_RESULT_SCHEMA_VERSION,
    categoryId: raw.categoryId as FluencyCategoryId,
    status,
    durationSec: 60,
    ...(status === 'invalid' && invalidReason ? { invalidReason } : {}),
    ...(validWordCount !== undefined && status === 'measured' ? { validWordCount } : {}),
  };
}

/**
 * Defensive boundary parse (serialize/migrate): a malformed block drops to
 * undefined — a corrupt instrument record must never block or alter the
 * measurement record it rides on. The record survives when at least one
 * instrument section parses.
 */
export function validClarityInstruments(value: unknown): ClarityInstrumentsRecord | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as Partial<ClarityInstrumentsRecord>;
  if (raw.schemaVersion !== CLARITY_INSTRUMENTS_SCHEMA_VERSION) return undefined;
  const pairedTask = validPairedClarityResult(raw.pairedTask);
  const dualTask = validDualTaskResult(raw.dualTask);
  const fluency = validFluencyResult(raw.fluency);
  if (!pairedTask && !dualTask && !fluency) return undefined;
  return {
    schemaVersion: CLARITY_INSTRUMENTS_SCHEMA_VERSION,
    ...(pairedTask ? { pairedTask } : {}),
    ...(dualTask ? { dualTask } : {}),
    ...(fluency ? { fluency } : {}),
  };
}
