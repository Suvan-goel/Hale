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
import {
  PersistedGeneratedExerciseSummary,
  PersistedGeneratedSessionSummary,
  PersistedPostSessionFeedback,
  emptyLadderProgress,
} from './dynamicState';
import { MicroCheckResult, MicroCheckType } from './microCheck';
import { ProgressionState, initialProgressionState } from './progression';
import type {
  DailyReadiness,
  LadderProgress,
  PainArea,
  SessionSlotType,
  TrackingQuality,
} from './workoutGeneration';

export const TRAINING_SCHEMA_VERSION = 3;

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
  ladderProgressById: Record<string, LadderProgress>;
  generatedSessionSummaries: PersistedGeneratedSessionSummary[];
  lastPostSessionFeedback: PersistedPostSessionFeedback | null;
  planPreferences: TrainingPlanPreferences;
}

export type TrainingIntensityPreference = 'gentle' | 'standard' | 'more_challenge';

export interface TrainingPlanPreferences {
  preferredIntensity: TrainingIntensityPreference;
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
    ladderProgressById: emptyLadderProgress(),
    generatedSessionSummaries: [],
    lastPostSessionFeedback: null,
    planPreferences: defaultTrainingPlanPreferences(),
  };
}

export function defaultTrainingPlanPreferences(): TrainingPlanPreferences {
  return { preferredIntensity: 'standard' };
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
  if (env.schemaVersion !== 1 && env.schemaVersion !== 2 && env.schemaVersion !== TRAINING_SCHEMA_VERSION) return null;
  const p = env.payload;
  if (!p || typeof p !== 'object') return null;
  const def = defaultTrainingState();
  // Defensive: fill missing sub-records with defaults rather than crash.
  return {
    block: p.block ?? null,
    progression: validProgression(p.progression) ?? def.progression,
    equipment: validEquipment(p.equipment) ?? def.equipment,
    progress: validProgress(p.progress) ?? def.progress,
    ladderProgressById: validLadderProgressById(p.ladderProgressById),
    generatedSessionSummaries: validGeneratedSessionSummaries(p.generatedSessionSummaries),
    lastPostSessionFeedback: validPostSessionFeedback(p.lastPostSessionFeedback),
    planPreferences: validTrainingPlanPreferences(p.planPreferences),
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

function validTrainingPlanPreferences(v: unknown): TrainingPlanPreferences {
  const def = defaultTrainingPlanPreferences();
  if (!v || typeof v !== 'object') return def;
  const p = v as Partial<TrainingPlanPreferences>;
  return {
    preferredIntensity:
      p.preferredIntensity === 'gentle' || p.preferredIntensity === 'standard' || p.preferredIntensity === 'more_challenge'
        ? p.preferredIntensity
        : def.preferredIntensity,
  };
}

const TRACKING_QUALITIES: TrackingQuality[] = ['good', 'usable', 'poor'];
const PAIN_AREAS: PainArea[] = ['knee', 'hip', 'back', 'shoulder', 'ankle', 'neck', 'other'];
const READINESS: DailyReadiness[] = ['ready', 'a_bit_stiff', 'low_energy', 'something_hurts', 'short_on_time'];
const SLOT_TYPES: SessionSlotType[] = [
  'lower_body_strength',
  'upper_body_push',
  'upper_body_pull',
  'balance',
  'dynamic_balance',
  'lateral_stability',
  'mobility',
  'posterior_chain',
  'ankle',
  'shoulder_mobility',
  'trunk_mobility',
  'hip_mobility',
  'posterior_chain_mobility',
];

function validLadderProgressById(v: unknown): Record<string, LadderProgress> {
  if (!v || typeof v !== 'object') return {};
  const out: Record<string, LadderProgress> = {};
  for (const [key, value] of Object.entries(v as Record<string, unknown>)) {
    const progress = validLadderProgress(value);
    if (progress) out[progress.ladderId || key] = progress;
  }
  return out;
}

function validLadderProgress(v: unknown): LadderProgress | null {
  if (!v || typeof v !== 'object') return null;
  const p = v as Partial<LadderProgress>;
  if (typeof p.ladderId !== 'string' || typeof p.currentLevelId !== 'string') return null;
  return {
    ladderId: p.ladderId,
    currentLevelId: p.currentLevelId,
    currentLevelIndex: finiteNumber(p.currentLevelIndex),
    recentCompletions: finiteNumber(p.recentCompletions),
    recentFailures: finiteNumber(p.recentFailures),
    completedSessionsAtLevel: finiteNumber(p.completedSessionsAtLevel) ?? 0,
    failedSessionsAtLevel: finiteNumber(p.failedSessionsAtLevel) ?? 0,
    recentCompletionRates: numberArray(p.recentCompletionRates),
    recentRpe: numberArray(p.recentRpe),
    recentPain: booleanArray(p.recentPain),
    lastRpe: finiteNumber(p.lastRpe),
    lastPain: typeof p.lastPain === 'boolean' ? p.lastPain : undefined,
    lastPainArea: isPainArea(p.lastPainArea) ? p.lastPainArea : undefined,
    lastTrackingQuality: isTrackingQuality(p.lastTrackingQuality) ? p.lastTrackingQuality : undefined,
    lastCompletedAt: typeof p.lastCompletedAt === 'string' ? p.lastCompletedAt : undefined,
    readyToProgress: typeof p.readyToProgress === 'boolean' ? p.readyToProgress : undefined,
    updatedAt: typeof p.updatedAt === 'string' ? p.updatedAt : new Date(0).toISOString(),
  };
}

function validGeneratedSessionSummaries(v: unknown): PersistedGeneratedSessionSummary[] {
  if (!Array.isArray(v)) return [];
  return v.map(validGeneratedSessionSummary).filter((item): item is PersistedGeneratedSessionSummary => !!item);
}

function validGeneratedSessionSummary(v: unknown): PersistedGeneratedSessionSummary | null {
  if (!v || typeof v !== 'object') return null;
  const s = v as Partial<PersistedGeneratedSessionSummary>;
  if (typeof s.id !== 'string' || typeof s.title !== 'string' || !Array.isArray(s.exerciseIds)) return null;
  const source =
    s.source === 'block_generated' || s.source === 'preset' || s.source === 'manual' || s.source === 'legacy'
      ? s.source
      : 'legacy';
  return {
    id: s.id,
    blockId: typeof s.blockId === 'string' ? s.blockId : undefined,
    source,
    templateId: typeof s.templateId === 'string' ? s.templateId : undefined,
    title: s.title,
    focus: typeof s.focus === 'string' ? s.focus : undefined,
    generatedAt: typeof s.generatedAt === 'string' ? s.generatedAt : undefined,
    completedAt: typeof s.completedAt === 'string' ? s.completedAt : undefined,
    exerciseIds: s.exerciseIds.filter((id): id is string => typeof id === 'string'),
    ladderIds: Array.isArray(s.ladderIds) ? s.ladderIds.filter((id): id is string => typeof id === 'string') : undefined,
    readiness: isReadiness(s.readiness) ? s.readiness : undefined,
    painArea: isPainArea(s.painArea) ? s.painArea : undefined,
    durationMinutes: finiteNumber(s.durationMinutes),
    exercises: validGeneratedExerciseSummaries(s.exercises),
    feedback: validPostSessionFeedback(s.feedback) ?? undefined,
  };
}

function validGeneratedExerciseSummaries(v: unknown): PersistedGeneratedExerciseSummary[] | undefined {
  if (!Array.isArray(v)) return undefined;
  return v
    .map((item): PersistedGeneratedExerciseSummary | null => {
      if (!item || typeof item !== 'object') return null;
      const e = item as Partial<PersistedGeneratedExerciseSummary>;
      if (typeof e.exerciseId !== 'string') return null;
      return {
        exerciseId: e.exerciseId,
        ladderId: typeof e.ladderId === 'string' ? e.ladderId : undefined,
        levelId: typeof e.levelId === 'string' ? e.levelId : undefined,
        slotType: isSlotType(e.slotType) ? e.slotType : undefined,
        sets: finiteNumber(e.sets),
        repsPerSet: finiteNumber(e.repsPerSet),
        secondsPerSet: finiteNumber(e.secondsPerSet),
        measurementTier:
          e.measurementTier === 'measured' || e.measurementTier === 'camera_assisted' || e.measurementTier === 'voice_guided'
            ? e.measurementTier
            : undefined,
      };
    })
    .filter((item): item is PersistedGeneratedExerciseSummary => !!item);
}

function validPostSessionFeedback(v: unknown): PersistedPostSessionFeedback | null {
  if (!v || typeof v !== 'object') return null;
  const f = v as Partial<PersistedPostSessionFeedback>;
  if (typeof f.submittedAt !== 'string') return null;
  return {
    sessionId: typeof f.sessionId === 'string' ? f.sessionId : undefined,
    rpe: f.rpe === 1 || f.rpe === 2 || f.rpe === 3 || f.rpe === 4 || f.rpe === 5 ? f.rpe : undefined,
    discomfort: typeof f.discomfort === 'boolean' ? f.discomfort : undefined,
    painArea: isPainArea(f.painArea) ? f.painArea : undefined,
    completed: typeof f.completed === 'boolean' ? f.completed : undefined,
    trackingQuality: isTrackingQuality(f.trackingQuality) ? f.trackingQuality : undefined,
    submittedAt: f.submittedAt,
  };
}

function finiteNumber(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

function numberArray(v: unknown): number[] {
  return Array.isArray(v) ? v.filter((item): item is number => typeof item === 'number' && Number.isFinite(item)) : [];
}

function booleanArray(v: unknown): boolean[] {
  return Array.isArray(v) ? v.filter((item): item is boolean => typeof item === 'boolean') : [];
}

function isTrackingQuality(v: unknown): v is TrackingQuality {
  return typeof v === 'string' && TRACKING_QUALITIES.includes(v as TrackingQuality);
}

function isPainArea(v: unknown): v is PainArea {
  return typeof v === 'string' && PAIN_AREAS.includes(v as PainArea);
}

function isReadiness(v: unknown): v is DailyReadiness {
  return typeof v === 'string' && READINESS.includes(v as DailyReadiness);
}

function isSlotType(v: unknown): v is SessionSlotType {
  return typeof v === 'string' && SLOT_TYPES.includes(v as SessionSlotType);
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
  if (env.schemaVersion !== 1 && env.schemaVersion !== 2 && env.schemaVersion !== TRAINING_SCHEMA_VERSION) return null;
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
