/**
 * In-flight session snapshot — the resume slice (2026-07-16 ruling).
 *
 * The voice session writes one snapshot at start and again at every item
 * boundary: the frozen plan plus everything finished so far. It exists so an
 * interrupted session (call, app kill, dead battery) is never silently lost:
 *
 *   - same-local-day snapshot with work remaining → offer "pick up where you
 *     left off" (the plan is FROZEN — a resumed session is the same session);
 *   - older snapshot, or "not today" → the finished exercises are applied as
 *     PARTIAL results (ladders + recency, no session credit) and cleared;
 *   - snapshot whose items already cover the whole plan → the session was
 *     complete when it died; apply as a full session (effort unanswered).
 *
 * A DELIBERATE leave never leaves a snapshot behind: the shell applies
 * partial results at that moment and clears the file. Only unexpected exits
 * leave one.
 *
 * Defensive-parse discipline (serialize.ts): any malformed or foreign field
 * discards the WHOLE snapshot — a corrupt file degrades to "no resume offer",
 * never to resuming a half-trusted plan. NaN metric fields survive the JSON
 * round-trip as null and are restored on read.
 *
 * LOCAL-ONLY like all programme state; the file lives in the same HistoryFs
 * scope, so account deletion and guest adoption cover it automatically.
 */

import type { HistoryFs } from '../history';
import {
  BALANCE_FEET_TOGETHER_ID,
  BALANCE_SINGLE_LEG_ID,
  BALANCE_TANDEM_ID,
  type SetResult,
} from '../exercises';
import type { TrainingItemResult } from '../training/voiceSessionPlayer';
import { programmeJourneyLocalDateKey } from './journey';
import { PROGRAMME_PATTERNS, type ProgrammePattern, type RepScheme } from './types';
import type {
  ProgrammeFinisherPlanItem,
  ProgrammeSessionExercise,
  ProgrammeSessionFocusBlock,
  ProgrammeSessionPlan,
  SessionDurationPreset,
  SessionTemplateId,
} from './session';
import type { SessionRouting } from './routing';

export const PROGRAMME_SESSION_SNAPSHOT_SCHEMA_VERSION = 1;
const SNAPSHOT_FILE = 'programme-session-in-flight.json';

export interface ProgrammeSessionSnapshot {
  schemaVersion: typeof PROGRAMME_SESSION_SNAPSHOT_SCHEMA_VERSION;
  /** The interrupted session's original start — kept as its credit identity. */
  startedAtIso: string;
  savedAtIso: string;
  plan: ProgrammeSessionPlan;
  /** Items finished (completed or skipped) before the interruption, in order. */
  completedItems: TrainingItemResult[];
}

export function serializeProgrammeSessionSnapshot(snapshot: ProgrammeSessionSnapshot): string {
  return JSON.stringify(snapshot);
}

export function deserializeProgrammeSessionSnapshot(
  json: string
): ProgrammeSessionSnapshot | null {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  if (!isRecord(raw)) return null;
  if (raw.schemaVersion !== PROGRAMME_SESSION_SNAPSHOT_SCHEMA_VERSION) return null;
  const startedAtIso = validIso(raw.startedAtIso);
  const savedAtIso = validIso(raw.savedAtIso);
  const plan = parsePlan(raw.plan);
  const completedItems = parseItems(raw.completedItems);
  if (!startedAtIso || !savedAtIso || !plan || !completedItems) return null;
  return {
    schemaVersion: PROGRAMME_SESSION_SNAPSHOT_SCHEMA_VERSION,
    startedAtIso,
    savedAtIso,
    plan,
    completedItems,
  };
}

export type ProgrammeSessionSnapshotDisposition =
  /** Same-day interruption with work remaining: offer to pick it back up. */
  | { kind: 'offer_resume' }
  /** Finished exercises count (ladders + recency), no session credit. */
  | { kind: 'apply_partial' }
  /** Every plan item was handled — the session finished but was never applied
   *  (killed on the effort screen): apply as a full session, effort unknown. */
  | { kind: 'apply_full' }
  /** Nothing finished and the day has passed — nothing to keep. */
  | { kind: 'discard' };

/**
 * What to do with a loaded in-flight snapshot at app start. Resume is only
 * offered on the same local day; an older interruption quietly banks the
 * finished work instead of proposing a stale "continue".
 */
export function decideProgrammeSessionSnapshot(
  snapshot: ProgrammeSessionSnapshot,
  input: { nowIso: string; planExerciseIds: readonly string[] }
): ProgrammeSessionSnapshotDisposition {
  const handled = new Set(snapshot.completedItems.map((item) => item.exerciseId));
  const remaining = input.planExerciseIds.filter((exerciseId) => !handled.has(exerciseId));
  if (remaining.length === 0) return { kind: 'apply_full' };
  const sameLocalDay =
    programmeJourneyLocalDateKey(new Date(snapshot.savedAtIso)) ===
    programmeJourneyLocalDateKey(new Date(input.nowIso));
  if (sameLocalDay) return { kind: 'offer_resume' };
  return snapshot.completedItems.length > 0 ? { kind: 'apply_partial' } : { kind: 'discard' };
}

/** One file, overwritten in place — same pattern as ProgrammeStore. */
export class ProgrammeSessionSnapshotStore {
  private readonly fs: HistoryFs;

  constructor(fs: HistoryFs) {
    this.fs = fs;
  }

  async load(): Promise<ProgrammeSessionSnapshot | null> {
    const json = await this.fs.read(SNAPSHOT_FILE);
    if (!json) return null;
    return deserializeProgrammeSessionSnapshot(json);
  }

  save(snapshot: ProgrammeSessionSnapshot): void {
    this.fs.write(SNAPSHOT_FILE, serializeProgrammeSessionSnapshot(snapshot));
  }

  clear(): void {
    if (this.fs.delete) this.fs.delete(SNAPSHOT_FILE);
    // Adapters without removal fall back to an unparsable tombstone, which
    // load() treats as absent.
    else this.fs.write(SNAPSHOT_FILE, '');
  }
}

// ---------------------------------------------------------------------------
// Defensive parsing
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validIso(value: unknown): string | null {
  return typeof value === 'string' && Number.isFinite(Date.parse(value)) ? value : null;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function positiveInt(value: unknown): number | null {
  const parsed = finiteNumber(value);
  return parsed !== null && Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function bool(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function stringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const out: string[] = [];
  for (const entry of value) {
    if (typeof entry !== 'string') return null;
    out.push(entry);
  }
  return out;
}

function pattern(value: unknown): ProgrammePattern | null {
  return PROGRAMME_PATTERNS.includes(value as ProgrammePattern)
    ? (value as ProgrammePattern)
    : null;
}

const SCHEME_KINDS: readonly RepScheme['kind'][] = [
  'reps',
  'reps_per_side',
  'seconds',
  'seconds_per_side',
];

function parseScheme(value: unknown): RepScheme | null {
  if (!isRecord(value)) return null;
  const kind = SCHEME_KINDS.includes(value.kind as RepScheme['kind'])
    ? (value.kind as RepScheme['kind'])
    : null;
  const min = finiteNumber(value.min);
  const max = finiteNumber(value.max);
  if (!kind || min === null || max === null) return null;
  return { kind, min, max };
}

function parseMainExercise(value: unknown): ProgrammeSessionExercise | null {
  if (!isRecord(value)) return null;
  const parsedPattern = pattern(value.pattern);
  const level = positiveInt(value.level);
  const exerciseId = nonEmptyString(value.exerciseId);
  const displayName = nonEmptyString(value.displayName);
  const role = value.role === 'primary' || value.role === 'variation' ? value.role : null;
  const sets = positiveInt(value.sets);
  const scheme = parseScheme(value.scheme);
  const repTargetPerSet = finiteNumber(value.repTargetPerSet);
  const restSec = finiteNumber(value.restSec);
  const powerIntentCue = bool(value.powerIntentCue);
  const useSupportVariant = bool(value.useSupportVariant);
  const requiresFloor = bool(value.requiresFloor);
  if (
    !parsedPattern ||
    level === null ||
    !exerciseId ||
    !displayName ||
    !role ||
    sets === null ||
    !scheme ||
    repTargetPerSet === null ||
    restSec === null ||
    powerIntentCue === null ||
    useSupportVariant === null ||
    requiresFloor === null
  ) {
    return null;
  }
  let substitution: ProgrammeSessionExercise['substitution'];
  if (value.substitution !== undefined) {
    if (!isRecord(value.substitution)) return null;
    const fromExerciseId = nonEmptyString(value.substitution.fromExerciseId);
    if (!fromExerciseId || value.substitution.reason !== 'no_stairs') return null;
    substitution = { fromExerciseId, reason: 'no_stairs' };
  }
  return {
    pattern: parsedPattern,
    level,
    exerciseId,
    displayName,
    role,
    sets,
    scheme,
    repTargetPerSet,
    restSec,
    powerIntentCue,
    useSupportVariant,
    ...(substitution ? { substitution } : {}),
    requiresFloor,
  };
}

function parseFinisherItem(value: unknown): ProgrammeFinisherPlanItem | null {
  if (!isRecord(value)) return null;
  const id = nonEmptyString(value.id);
  const displayName = nonEmptyString(value.displayName);
  if (!id || !displayName || !isRecord(value.dose)) return null;
  const dose = value.dose;
  const min = finiteNumber(dose.min);
  const max = finiteNumber(dose.max);
  if (min === null || max === null) return null;
  let parsedDose: ProgrammeFinisherPlanItem['dose'];
  if (dose.kind === 'contacts') parsedDose = { kind: 'contacts', min, max };
  else if (dose.kind === 'seconds') parsedDose = { kind: 'seconds', min, max };
  else if (dose.kind === 'sets_reps') {
    const sets = positiveInt(dose.sets);
    if (sets === null) return null;
    parsedDose = {
      kind: 'sets_reps',
      sets,
      min,
      max,
      ...(dose.perSide === true ? { perSide: true } : {}),
    };
  } else return null;
  const contacts = value.contacts === undefined ? undefined : finiteNumber(value.contacts);
  if (contacts === null) return null;
  return { id, displayName, dose: parsedDose, ...(contacts !== undefined ? { contacts } : {}) };
}

function parseFocusBlock(value: unknown): ProgrammeSessionFocusBlock | null | undefined {
  // undefined = invalid; null = a valid "no focus block".
  if (value === null) return null;
  if (!isRecord(value)) return undefined;
  const phase = value.phase === 1 || value.phase === 2 || value.phase === 3 ? value.phase : null;
  const prescriptionId = nonEmptyString(value.prescriptionId);
  const exerciseId = nonEmptyString(value.exerciseId);
  const displayName = nonEmptyString(value.displayName);
  if (!phase || !prescriptionId || !exerciseId || !displayName) return undefined;
  if (value.kind === 'strength') {
    const strengthPattern =
      value.pattern === 'squat' || value.pattern === 'hinge' ? value.pattern : null;
    if (!strengthPattern || value.addedSets !== 1 || value.integratedIntoMain !== true) {
      return undefined;
    }
    return {
      kind: 'strength',
      phase,
      prescriptionId,
      exerciseId,
      displayName,
      pattern: strengthPattern,
      addedSets: 1,
      integratedIntoMain: true,
    };
  }
  if (value.kind === 'balance') {
    const sets = positiveInt(value.sets);
    const holdSec = finiteNumber(value.holdSec);
    const restSec = finiteNumber(value.restSec);
    const balanceId =
      exerciseId === BALANCE_FEET_TOGETHER_ID ||
      exerciseId === BALANCE_TANDEM_ID ||
      exerciseId === BALANCE_SINGLE_LEG_ID
        ? exerciseId
        : null;
    if (
      sets === null ||
      holdSec === null ||
      restSec === null ||
      balanceId === null ||
      value.useSupportVariant !== true
    ) {
      return undefined;
    }
    return {
      kind: 'balance',
      phase,
      prescriptionId,
      exerciseId: balanceId,
      displayName,
      sets,
      holdSec,
      restSec,
      useSupportVariant: true,
    };
  }
  return undefined;
}

function parseRouting(value: unknown): SessionRouting | null {
  if (!isRecord(value)) return null;
  const includeStomps = bool(value.includeStomps);
  const bonusSetsAllowed = bool(value.bonusSetsAllowed);
  const softerCadence = bool(value.softerCadence);
  const supportVariantsDefault = bool(value.supportVariantsDefault);
  const pelvicContentUnlocked = bool(value.pelvicContentUnlocked);
  if (
    value.finisherTrack !== 'quiet_power' ||
    includeStomps === null ||
    bonusSetsAllowed === null ||
    softerCadence === null ||
    supportVariantsDefault === null ||
    pelvicContentUnlocked === null
  ) {
    return null;
  }
  return {
    finisherTrack: 'quiet_power',
    includeStomps,
    bonusSetsAllowed,
    softerCadence,
    supportVariantsDefault,
    pelvicContentUnlocked,
  };
}

const TEMPLATES: readonly SessionTemplateId[] = ['A', 'B'];
const PRESETS: readonly SessionDurationPreset[] = ['standard', 'first_session', 'starter'];

function parsePlan(value: unknown): ProgrammeSessionPlan | null {
  if (!isRecord(value)) return null;
  const template = TEMPLATES.includes(value.template as SessionTemplateId)
    ? (value.template as SessionTemplateId)
    : null;
  const preset = PRESETS.includes(value.preset as SessionDurationPreset)
    ? (value.preset as SessionDurationPreset)
    : null;
  const targetMinutes = finiteNumber(value.targetMinutes);
  const estimatedMinutes = finiteNumber(value.estimatedMinutes);
  if (!template || !preset || targetMinutes === null || estimatedMinutes === null) return null;

  if (!isRecord(value.prep)) return null;
  const prepMinutes = finiteNumber(value.prep.minutes);
  const drillIds = stringArray(value.prep.drillIds);
  const rehearsalDrillIds = stringArray(value.prep.rehearsalDrillIds);
  if (prepMinutes === null || !drillIds || !rehearsalDrillIds) return null;

  if (!Array.isArray(value.main)) return null;
  const main: ProgrammeSessionExercise[] = [];
  for (const entry of value.main) {
    const exercise = parseMainExercise(entry);
    if (!exercise) return null;
    main.push(exercise);
  }

  const focusBlock = parseFocusBlock(value.focusBlock ?? null);
  if (focusBlock === undefined) return null;

  if (!Array.isArray(value.finisher)) return null;
  const finisher: ProgrammeFinisherPlanItem[] = [];
  for (const entry of value.finisher) {
    const item = parseFinisherItem(entry);
    if (!item) return null;
    finisher.push(item);
  }

  if (!Array.isArray(value.bonusSetEligible)) return null;
  const bonusSetEligible: ProgrammePattern[] = [];
  for (const entry of value.bonusSetEligible) {
    const parsed = pattern(entry);
    if (!parsed) return null;
    bonusSetEligible.push(parsed);
  }

  const activeBranches = stringArray(value.activeBranches);
  const routing = parseRouting(value.routing);
  if (!activeBranches || !routing) return null;

  return {
    template,
    preset,
    targetMinutes,
    estimatedMinutes,
    prep: { minutes: prepMinutes, drillIds, rehearsalDrillIds },
    main,
    focusBlock,
    finisher,
    bonusSetEligible,
    activeBranches: activeBranches as ProgrammeSessionPlan['activeBranches'],
    routing,
  };
}

/** NaN survives JSON as null; restore it on the metric fields that use it. */
function metricNumber(value: unknown): number | null {
  if (value === null) return NaN;
  return finiteNumber(value);
}

function parseSet(value: unknown): SetResult | null {
  if (!isRecord(value)) return null;
  const exerciseId = nonEmptyString(value.exerciseId);
  const reps = finiteNumber(value.reps);
  const meanVel = metricNumber(value.meanVel);
  const holdSec = metricNumber(value.holdSec);
  const romPeak = metricNumber(value.romPeak);
  const autoregulated = bool(value.autoregulated);
  const reachedTarget = bool(value.reachedTarget);
  const interruptions = finiteNumber(value.interruptions);
  const flags = stringArray(value.flags);
  if (
    !exerciseId ||
    reps === null ||
    meanVel === null ||
    holdSec === null ||
    romPeak === null ||
    autoregulated === null ||
    reachedTarget === null ||
    interruptions === null ||
    !flags
  ) {
    return null;
  }
  const reportedReps = value.reportedReps === undefined ? undefined : finiteNumber(value.reportedReps);
  const repsAdjusted = value.repsAdjusted === undefined ? undefined : finiteNumber(value.repsAdjusted);
  if (reportedReps === null || repsAdjusted === null) return null;
  return {
    exerciseId,
    reps,
    meanVel,
    holdSec,
    romPeak,
    autoregulated,
    reachedTarget,
    interruptions,
    flags,
    ...(reportedReps !== undefined ? { reportedReps } : {}),
    ...(repsAdjusted !== undefined ? { repsAdjusted } : {}),
  };
}

function parseItems(value: unknown): TrainingItemResult[] | null {
  if (!Array.isArray(value)) return null;
  const items: TrainingItemResult[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) return null;
    const exerciseId = nonEmptyString(entry.exerciseId);
    const status =
      entry.status === 'completed' || entry.status === 'skipped' ? entry.status : null;
    if (!exerciseId || !status) return null;
    if (entry.skipReason !== undefined && entry.skipReason !== 'pain') return null;
    if (!Array.isArray(entry.sets)) return null;
    const sets: SetResult[] = [];
    for (const setEntry of entry.sets) {
      const set = parseSet(setEntry);
      if (!set) return null;
      sets.push(set);
    }
    items.push({
      exerciseId,
      status,
      ...(entry.skipReason === 'pain' ? { skipReason: 'pain' as const } : {}),
      sets,
    });
  }
  return items;
}
