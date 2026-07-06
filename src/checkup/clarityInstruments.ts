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
  const dualTask = validDualTaskResult(raw.dualTask);
  const fluency = validFluencyResult(raw.fluency);
  if (!dualTask && !fluency) return undefined;
  return {
    schemaVersion: CLARITY_INSTRUMENTS_SCHEMA_VERSION,
    ...(dualTask ? { dualTask } : {}),
    ...(fluency ? { fluency } : {}),
  };
}
