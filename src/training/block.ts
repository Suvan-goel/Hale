/**
 * Block assignment v1 — turn a Movement Check-Up score into a 4-week, 3×/week
 * (12-session) training block biased toward the user's weakest domain, then
 * resolve a session's slots into concrete exercises at launch.
 *
 * A session is a fixed ~20-minute template of SLOTS (lower-push, hinge,
 * upper-push, pull-or-reach, balance, a power/functional finisher, two mobility
 * cooldowns). The block stores slots + a chosen family per slot; it does NOT
 * bake in a level — resolveSession() looks up the user's CURRENT level per
 * family (so progression stays live across the whole block) and substitutes a
 * zero-equipment variant when the profile lacks the required equipment (e.g. no
 * stair → step-up becomes power sit-to-stand; no band → press becomes reach).
 *
 * Bias toward the weakest domain is deterministic: that domain's primary slot
 * is performed FIRST (fresh), and the finisher targets it. No ML.
 */

import { ExerciseDefinition, TrainingSlot, familyLevels, getExercise } from '../exercises';
import { CheckUpScore, Domain } from '../scoring';
import { ProgressionState } from './progression';

/** What the user has beyond the always-assumed chair/wall/floor/cushion. */
export interface EquipmentProfile {
  stair: boolean;
  band: boolean;
}

export const DEFAULT_EQUIPMENT: EquipmentProfile = { stair: false, band: false };

export interface SlotAssignment {
  slot: TrainingSlot;
  family: string;
}

export interface SessionPlan {
  /** 0-based index across the whole block. */
  index: number;
  /** 1-based week. */
  week: number;
  /** 1-based session within the week. */
  dayOfWeek: number;
  slots: SlotAssignment[];
}

export interface TrainingBlock {
  createdAt: string;
  weeks: number;
  sessionsPerWeek: number;
  /** The domain the block is biased toward; null if the check-up measured nothing. */
  weakestDomain: Domain | null;
  sessions: SessionPlan[];
}

const WEEKS = 4;
const SESSIONS_PER_WEEK = 3;

/** Base ~20-minute template, in default performance order. */
const BASE_TEMPLATE: SlotAssignment[] = [
  { slot: 'lower-push', family: 'sit-to-stand' },
  { slot: 'hinge', family: 'hip-hinge' },
  { slot: 'upper-push', family: 'push-up' },
  { slot: 'pull-reach', family: 'overhead' },
  { slot: 'balance', family: 'balance' },
  { slot: 'power', family: 'step-up' }, // finisher — overridden by the weak domain
  { slot: 'mobility', family: 'hamstring-reach' },
  { slot: 'mobility', family: 'neck-rotation' },
];

/** Per weak domain: which slot leads (done fresh) and which finisher targets it. */
const DOMAIN_BIAS: Record<Domain, { primaryFamily: string; finisherFamily: string }> = {
  strength: { primaryFamily: 'sit-to-stand', finisherFamily: 'step-up' },
  balance: { primaryFamily: 'balance', finisherFamily: 'balance' },
  mobility: { primaryFamily: 'hamstring-reach', finisherFamily: 'hamstring-reach' },
};

function biasedTemplate(weakest: Domain | null): SlotAssignment[] {
  const template = BASE_TEMPLATE.map((s) => ({ ...s }));
  if (!weakest) return template;
  const bias = DOMAIN_BIAS[weakest];
  // Target the finisher slot at the weak domain.
  const finisher = template.find((s) => s.slot === 'power');
  if (finisher) finisher.family = bias.finisherFamily;
  // Move the weak domain's primary slot to the front so it's done fresh.
  const primaryIdx = template.findIndex((s) => s.family === bias.primaryFamily);
  if (primaryIdx > 0) {
    const [primary] = template.splice(primaryIdx, 1);
    template.unshift(primary);
  }
  return template;
}

export function buildBlock(
  score: CheckUpScore,
  _equipment: EquipmentProfile,
  createdAtIso: string
): TrainingBlock {
  const weakest = score.weakestDomain;
  const template = biasedTemplate(weakest);
  const sessions: SessionPlan[] = [];
  for (let i = 0; i < WEEKS * SESSIONS_PER_WEEK; i++) {
    sessions.push({
      index: i,
      week: Math.floor(i / SESSIONS_PER_WEEK) + 1,
      dayOfWeek: (i % SESSIONS_PER_WEEK) + 1,
      slots: template.map((s) => ({ ...s })),
    });
  }
  return { createdAt: createdAtIso, weeks: WEEKS, sessionsPerWeek: SESSIONS_PER_WEEK, weakestDomain: weakest, sessions };
}

/**
 * Resolve a slot to a runnable exercise id: the family's current level (from
 * progression state, default level 1), with a zero-equipment substitute when
 * the profile lacks the required equipment. Never returns a dead end.
 */
export function resolveSlot(
  assignment: SlotAssignment,
  progression: ProgressionState,
  equipment: EquipmentProfile
): string {
  const levels = familyLevels(assignment.family);
  if (levels.length === 0) throw new Error(`block references unknown family '${assignment.family}'`);
  const wanted = progression.levels[assignment.family] ?? 1;
  const level = Math.min(Math.max(1, wanted), levels.length);
  const def = levels[level - 1];
  return substituteForEquipment(def, equipment).id;
}

/** Swap to the zero-equipment substitute if a required item is missing. */
function substituteForEquipment(def: ExerciseDefinition, equipment: EquipmentProfile): ExerciseDefinition {
  const needsStair = def.equipment.includes('stair');
  const needsBand = def.equipment.includes('band');
  if ((needsStair && !equipment.stair) || (needsBand && !equipment.band)) {
    if (def.substituteId) return getExercise(def.substituteId);
  }
  return def;
}

/** The ordered exercise ids the session player runs for one session. */
export function resolveSession(
  plan: SessionPlan,
  progression: ProgressionState,
  equipment: EquipmentProfile
): string[] {
  return plan.slots.map((s) => resolveSlot(s, progression, equipment));
}

export function totalSessions(block: TrainingBlock): number {
  return block.weeks * block.sessionsPerWeek;
}

/** True once every session has been completed — the trigger to schedule a re-test. */
export function blockComplete(block: TrainingBlock, completedCount: number): boolean {
  return completedCount >= totalSessions(block);
}
