/**
 * Persisted training records: schema-versioned from day one (CLAUDE.md data
 * rule), pure (de)serialization + migration with no I/O — fully unit-testable
 * with the in-memory HistoryFs. Two stored shapes:
 *
 *   TrainingState   — the single mutable record (active block + progression +
 *                     equipment profile + block progress). Overwritten in place.
 *   MicroCheckResult — append-only log (one file per micro-check), feeding the
 *                     trend line between full check-ups.
 *
 * Non-finite numbers (NaN for an unmeasured micro-check value) serialise as null
 * and read back as null; every consumer already guards with Number.isFinite.
 * Forward-compatible: a record from an unknown schema version is skipped, not
 * crashed (mirrors history/serialize.ts).
 */

import { DEFAULT_EQUIPMENT, EquipmentProfile, TrainingBlock } from './block';
import { MicroCheckResult, MicroCheckType } from './microCheck';
import { ProgressionState, initialProgressionState } from './progression';

export const TRAINING_SCHEMA_VERSION = 1;

export interface BlockProgress {
  /** Sessions of the active block completed so far. */
  completedSessions: number;
  lastSessionAt: string | null;
  /** Set once the block is finished — the in-app "time to re-test" trigger. */
  retestDueAt: string | null;
}

export interface TrainingState {
  block: TrainingBlock | null;
  progression: ProgressionState;
  equipment: EquipmentProfile;
  progress: BlockProgress;
}

export function defaultBlockProgress(): BlockProgress {
  return { completedSessions: 0, lastSessionAt: null, retestDueAt: null };
}

export function defaultTrainingState(): TrainingState {
  return {
    block: null,
    progression: initialProgressionState(),
    equipment: { ...DEFAULT_EQUIPMENT },
    progress: defaultBlockProgress(),
  };
}

function nanReplacer(_key: string, value: unknown): unknown {
  return typeof value === 'number' && !Number.isFinite(value) ? null : value;
}

interface Envelope<T> {
  schemaVersion: number;
  payload: T;
}

export function serializeTrainingState(state: TrainingState): string {
  const env: Envelope<TrainingState> = { schemaVersion: TRAINING_SCHEMA_VERSION, payload: state };
  return JSON.stringify(env, nanReplacer);
}

export function deserializeTrainingState(json: string): TrainingState | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const env = parsed as Partial<Envelope<TrainingState>>;
  if (env.schemaVersion !== TRAINING_SCHEMA_VERSION) return null; // no older versions yet
  const p = env.payload;
  if (!p || typeof p !== 'object') return null;
  const def = defaultTrainingState();
  // Defensive: fill missing sub-records with defaults rather than crash.
  return {
    block: p.block ?? null,
    progression: validProgression(p.progression) ?? def.progression,
    equipment: validEquipment(p.equipment) ?? def.equipment,
    progress: validProgress(p.progress) ?? def.progress,
  };
}

function validProgression(v: unknown): ProgressionState | null {
  if (!v || typeof v !== 'object') return null;
  const p = v as Partial<ProgressionState>;
  if (typeof p.levels !== 'object' || typeof p.velHistory !== 'object') return null;
  return { levels: p.levels as Record<string, number>, velHistory: p.velHistory as Record<string, number[]> };
}

function validEquipment(v: unknown): EquipmentProfile | null {
  if (!v || typeof v !== 'object') return null;
  const e = v as Partial<EquipmentProfile>;
  return { stair: !!e.stair, band: !!e.band, miniBand: !!e.miniBand, load: !!e.load };
}

function validProgress(v: unknown): BlockProgress | null {
  if (!v || typeof v !== 'object') return null;
  const g = v as Partial<BlockProgress>;
  if (typeof g.completedSessions !== 'number') return null;
  return {
    completedSessions: g.completedSessions,
    lastSessionAt: typeof g.lastSessionAt === 'string' ? g.lastSessionAt : null,
    retestDueAt: typeof g.retestDueAt === 'string' ? g.retestDueAt : null,
  };
}

const MICRO_TYPES: MicroCheckType[] = ['chair-power', 'single-leg-balance', 'mobility-reach'];

export function serializeMicroCheck(result: MicroCheckResult): string {
  const env: Envelope<MicroCheckResult> = { schemaVersion: TRAINING_SCHEMA_VERSION, payload: result };
  return JSON.stringify(env, nanReplacer);
}

export function deserializeMicroCheck(json: string): MicroCheckResult | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const env = parsed as Partial<Envelope<MicroCheckResult>>;
  if (env.schemaVersion !== TRAINING_SCHEMA_VERSION) return null;
  const p = env.payload;
  if (!p || typeof p !== 'object') return null;
  const r = p as Partial<MicroCheckResult>;
  if (!r.type || !MICRO_TYPES.includes(r.type) || typeof r.startedAt !== 'string') return null;
  return {
    type: r.type,
    startedAt: r.startedAt,
    value: typeof r.value === 'number' ? r.value : NaN, // null → NaN
    reps: typeof r.reps === 'number' ? r.reps : 0,
    measured: !!r.measured,
  };
}
