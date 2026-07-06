/**
 * Session generation — exercise-ladders-spec v0.2 §11 under the 2026-07-06
 * rulings. Pure: reads ProgrammeState, emits a plan; never mutates state
 * (the activation event is written by the session runner at START, not here).
 *
 * EXECUTION MODEL — sequential with time budget (approved fallback): the
 * spec's superset pairing survives as ADJACENCY ORDERING (lower/upper
 * alternate in template order); alternating-set execution would change the
 * live session player's phase machine (rest/resume/funnel semantics shared
 * with voice sessions v1) — not a contained change. The 20–25 min budget is
 * the principle; supersets were the optimisation.
 *
 * TIME-BUDGET TRIM PRIORITY (when the plan overruns its preset):
 *   1. rest padding 60 s → 45 s
 *   2. finisher 2 items → 1 (never dropped entirely — it carries the power
 *      stimulus)
 *   3. drop main exercises per the template's TRIM_DROP_ORDER (Core first;
 *      A-short keeps Squat+Push, B-short keeps Hinge+Pull), never below 2
 *   4. rest 45 s → 30 s (floor)
 * Movement prep is NEVER dropped — it carries the gateway rehearsals — and
 * working sets never trim below the 2-set promise.
 *
 * BONUS SET (v1, C9 machinery): effort is the session-level RPE answered
 * AFTER a session, so the offer keys on the PREVIOUS session's effort —
 * offered only when routing allows it (no Gentle Start), the ladder is not
 * under hold+reduce, and the clock has headroom for one extra set.
 */

import {
  ADAPTATION_BRANCHES,
  getProgrammeLevel,
  HINGE_REHEARSAL_DRILL_ID,
  QUIET_FINISHER_ITEMS,
} from './ladders';
import { programmeDisplayName } from './naming';
import { evaluatePatternOutcome, recordRehearsalExposure } from './promotion';
import { resolveSessionRouting, type SessionRouting } from './routing';
import type {
  AdaptationBranchId,
  EffortAnswer,
  FinisherDose,
  PatternSessionOutcome,
  ProgrammeExercise,
  ProgrammeLevel,
  ProgrammePattern,
  ProgrammeState,
  PromotionDecision,
  RepScheme,
} from './types';
import { JOINT_FLAG_BRANCHES } from './ladders';

// ---------------------------------------------------------------------------
// Presets and templates
// ---------------------------------------------------------------------------

export type SessionTemplateId = 'A' | 'B';

/** Duration presets (ruling: solver takes target duration as a parameter). */
export type SessionDurationPreset = 'standard' | 'first_session' | 'starter';

export const SESSION_PRESET_TARGET_MINUTES: Record<SessionDurationPreset, number> = {
  standard: 25, // the 20–25 min promise; fit to the ceiling
  first_session: 15, // minimum-dose default for day zero (§7)
  starter: 10, // warm same-day fallback (§7)
};

/** Template main-exercise order (§11). Pairing = lower/upper adjacency. */
const TEMPLATE_ORDER: Record<SessionTemplateId, readonly ProgrammePattern[]> = {
  A: ['squat', 'push', 'hinge', 'pull', 'core'],
  B: ['hinge', 'push', 'squat', 'pull', 'core'],
};

/**
 * Trim rotation (2026-07-06 refinement): which patterns get dropped first
 * when the budget bites, per template — so a habitual short-preset user still
 * trains all four strength patterns across the A/B alternation (A-short keeps
 * Squat+Push, B-short keeps Hinge+Pull). Known limitation, recorded in
 * decisions.md: Core is first out on every short session; the sketched fix
 * (Core riding the finisher slot on alternate shorts) is future work.
 */
const TRIM_DROP_ORDER: Record<SessionTemplateId, readonly ProgrammePattern[]> = {
  A: ['core', 'pull', 'hinge'],
  B: ['core', 'squat', 'push'],
};

// Timing model (named constants; provisional until real-session data).
const TRANSITION_SEC = 40; // announce + set-up between exercises
const SECONDS_PER_REP = 4; // 3 s down + controlled up
const PER_SIDE_SWITCH_SEC = 10;
const REST_TIERS_SEC = [60, 45, 30] as const;
const PREP_MINUTES: Record<SessionDurationPreset, number> = {
  standard: 3,
  first_session: 2,
  starter: 2,
};
const FINISHER_MINUTES_PER_ITEM = 1.25;
const FINISHER_ITEM_COUNT_FULL = 2;

// ---------------------------------------------------------------------------
// Plan shapes
// ---------------------------------------------------------------------------

export interface ProgrammeSessionExercise {
  pattern: ProgrammePattern;
  level: number;
  exerciseId: string;
  displayName: string;
  /** 'primary' on Template A; 'variation' on Template B (spec §11). */
  role: 'primary' | 'variation';
  sets: number;
  scheme: RepScheme;
  /**
   * Double progression: the concrete per-set target inside the scheme range
   * (reps or seconds). This is the number the session confirms as REPORTED
   * on "done" — starts at the scheme minimum on level entry and advances
   * EFFORT-SCALED per session where every set reached it (lots → range top,
   * a_few → +2, none/unanswered → hold; 2026-07-06 amendment).
   */
  repTargetPerSet: number;
  restSec: number;
  powerIntentCue: boolean;
  /** B5/T1 routing: cue the fingertips-on-support sub-variant. */
  useSupportVariant: boolean;
  /** Set when the planned exercise was swapped (reason recorded). */
  substitution?: { fromExerciseId: string; reason: 'no_stairs' };
  requiresFloor: boolean;
}

export interface ProgrammeFinisherPlanItem {
  id: string;
  displayName: string;
  dose: FinisherDose;
  /** Contact budget for contact-based items (state.finisher.currentContacts). */
  contacts?: number;
}

export interface ProgrammeSessionPlan {
  template: SessionTemplateId;
  preset: SessionDurationPreset;
  targetMinutes: number;
  estimatedMinutes: number;
  /** Movement prep — never trimmed away; always includes the hinge rehearsal. */
  prep: {
    minutes: number;
    drillIds: readonly string[];
    /** Drills whose completion must credit gateway rehearsal exposures. */
    rehearsalDrillIds: readonly string[];
  };
  main: readonly ProgrammeSessionExercise[];
  finisher: readonly ProgrammeFinisherPlanItem[];
  /**
   * Patterns eligible for the one offered bonus set this session (never
   * required; framed as reward). Empty when effort/budget/routing say no.
   */
  bonusSetEligible: readonly ProgrammePattern[];
  /** Branches pre-armed from B3/diastasis — the session layer softens cues. */
  activeBranches: readonly AdaptationBranchId[];
  routing: SessionRouting;
}

export interface GenerateSessionInput {
  state: ProgrammeState;
  template: SessionTemplateId;
  preset: SessionDurationPreset;
  /** Previous session's effort answer (C9: RPE-mapped); null = unknown. */
  lastSessionEffort?: EffortAnswer | null;
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

export function generateProgrammeSession(input: GenerateSessionInput): ProgrammeSessionPlan {
  const { state, template, preset } = input;
  const routing = resolveSessionRouting(state.profile).routing;
  const targetMinutes = SESSION_PRESET_TARGET_MINUTES[preset];

  const fullMain = TEMPLATE_ORDER[template].map((pattern) =>
    planExerciseFor(pattern, template, state, routing)
  );
  const fullFinisher = finisherItems(state, routing, FINISHER_ITEM_COUNT_FULL);

  // Trim ladder, applied in order until the plan fits (see module header).
  let restSec: number = REST_TIERS_SEC[0];
  let main = fullMain;
  let finisher = fullFinisher;

  const fits = () =>
    estimateMinutes({ preset, main, restSec, finisherCount: finisher.length }) <= targetMinutes;

  if (!fits()) restSec = REST_TIERS_SEC[1];
  if (!fits()) finisher = finisherItems(state, routing, 1);
  for (const drop of TRIM_DROP_ORDER[template]) {
    if (fits() || main.length <= 2) break;
    main = main.filter((exercise) => exercise.pattern !== drop);
  }
  if (!fits()) restSec = REST_TIERS_SEC[2];

  const mainWithRest = main.map((exercise) => ({ ...exercise, restSec }));
  const estimatedMinutes = estimateMinutes({
    preset,
    main: mainWithRest,
    restSec,
    finisherCount: finisher.length,
  });

  // Bonus set: previous session felt easy, routing allows it, ladder not in
  // hold+reduce, and the clock has headroom for one extra set + rest.
  const bonusSetEligible: ProgrammePattern[] = [];
  if (routing.bonusSetsAllowed && input.lastSessionEffort === 'lots') {
    for (const exercise of mainWithRest) {
      if (state.ladders[exercise.pattern].bonusSetSuspended) continue;
      const bonusCostMin = (setSeconds(exercise.scheme) + restSec) / 60;
      if (estimatedMinutes + bonusCostMin <= targetMinutes) bonusSetEligible.push(exercise.pattern);
    }
  }

  const activeBranches: AdaptationBranchId[] = [];
  for (const flag of state.profile.jointFlags) {
    const branch = JOINT_FLAG_BRANCHES[flag];
    if (branch && !activeBranches.includes(branch)) activeBranches.push(branch);
  }
  if (state.profile.diastasisFlag) activeBranches.push('diastasis');
  if (routing.supportVariantsDefault && !activeBranches.includes('balance_limited')) {
    activeBranches.push('balance_limited');
  }

  return {
    template,
    preset,
    targetMinutes,
    estimatedMinutes,
    prep: {
      minutes: PREP_MINUTES[preset],
      drillIds: ['prep.easy_march', HINGE_REHEARSAL_DRILL_ID, 'prep.arm_reaches'],
      rehearsalDrillIds: [HINGE_REHEARSAL_DRILL_ID],
    },
    main: mainWithRest,
    finisher,
    bonusSetEligible,
    activeBranches,
    routing,
  };
}

function planExerciseFor(
  pattern: ProgrammePattern,
  template: SessionTemplateId,
  state: ProgrammeState,
  routing: SessionRouting
): ProgrammeSessionExercise {
  const level = levelForTemplate(pattern, template, state);
  // Template A runs the level's primary; Template B its variation — except
  // the hinge, whose family split is handled in levelForTemplate (§11: B
  // runs the standing family once L5 unlocks; before that, the same-level
  // bridge variation).
  const role: 'primary' | 'variation' =
    template === 'A' || (pattern === 'hinge' && state.ladders.hinge.currentLevel >= 5)
      ? 'primary'
      : 'variation';
  const chosen = role === 'primary' ? level.primary : level.variation;
  const substituted = substituteForHome(chosen, state);

  const storedTarget = state.ladders[pattern].currentRepTarget;
  const repTargetPerSet = Math.min(
    Math.max(storedTarget ?? level.scheme.min, level.scheme.min),
    level.scheme.max
  );

  return {
    pattern,
    level: level.level,
    exerciseId: substituted.exercise.id,
    displayName: programmeDisplayName(substituted.exercise.id),
    role,
    sets: level.sets,
    scheme: level.scheme,
    repTargetPerSet,
    restSec: REST_TIERS_SEC[0],
    powerIntentCue: level.powerIntentCue === true,
    useSupportVariant:
      routing.supportVariantsDefault &&
      (level.scheme.kind === 'reps_per_side' || level.scheme.kind === 'seconds_per_side'),
    ...(substituted.substitution ? { substitution: substituted.substitution } : {}),
    requiresFloor: substituted.exercise.requiresFloor === true,
  };
}

/**
 * §11 hinge family split: Template A trains the bridge family (her bridge
 * level, capped at L4); Template B trains the standing family once L5 has
 * unlocked — before that both templates run her current bridge level.
 */
function levelForTemplate(
  pattern: ProgrammePattern,
  template: SessionTemplateId,
  state: ProgrammeState
): ProgrammeLevel {
  const current = state.ladders[pattern].currentLevel;
  if (pattern !== 'hinge') return getProgrammeLevel(pattern, current);
  if (template === 'A') return getProgrammeLevel('hinge', Math.min(current, 4));
  return getProgrammeLevel('hinge', current);
}

function substituteForHome(
  exercise: ProgrammeExercise,
  state: ProgrammeState
): { exercise: ProgrammeExercise; substitution?: ProgrammeSessionExercise['substitution'] } {
  // hasStairs null = unanswered → conservative: treat as no stairs.
  const hasStairs = state.profile.hasStairs === true;
  if (!hasStairs && exercise.requiresStairs && exercise.noStairsAlternativeId) {
    return {
      exercise: {
        id: exercise.noStairsAlternativeId,
        equipment: exercise.equipment,
        requiresFloor: exercise.requiresFloor,
      },
      substitution: { fromExerciseId: exercise.id, reason: 'no_stairs' },
    };
  }
  return { exercise };
}

function finisherItems(
  state: ProgrammeState,
  routing: SessionRouting,
  count: number
): ProgrammeFinisherPlanItem[] {
  const hasStairs = state.profile.hasStairs === true;
  const eligible = QUIET_FINISHER_ITEMS.filter(
    (item) => routing.includeStomps || !item.skipOnQuietRouting
  ).map((item) =>
    !hasStairs && item.requiresStairs && item.noStairsAlternativeId
      ? QUIET_FINISHER_ITEMS.find((i) => i.id === item.noStairsAlternativeId) ?? item
      : item
  );
  // Novelty rotation: advance the window one item per completed session.
  const rotated = eligible.map(
    (_, index) => eligible[(state.finisher.completedSessions + index) % eligible.length]
  );
  const unique: typeof rotated = [];
  for (const item of rotated) {
    if (!unique.some((u) => u.id === item.id)) unique.push(item);
  }
  return unique.slice(0, count).map((item) => ({
    id: item.id,
    displayName: programmeDisplayName(item.id),
    dose: item.dose,
    ...(item.dose.kind === 'contacts' ? { contacts: state.finisher.currentContacts } : {}),
  }));
}

// ---------------------------------------------------------------------------
// Timing model
// ---------------------------------------------------------------------------

function setSeconds(scheme: RepScheme): number {
  const midpoint = (scheme.min + scheme.max) / 2;
  switch (scheme.kind) {
    case 'reps':
      return midpoint * SECONDS_PER_REP;
    case 'reps_per_side':
      return midpoint * SECONDS_PER_REP * 2 + PER_SIDE_SWITCH_SEC;
    case 'seconds':
      return midpoint;
    case 'seconds_per_side':
      return midpoint * 2 + PER_SIDE_SWITCH_SEC;
  }
}

function estimateMinutes(input: {
  preset: SessionDurationPreset;
  main: readonly ProgrammeSessionExercise[];
  restSec: number;
  finisherCount: number;
}): number {
  let seconds = PREP_MINUTES[input.preset] * 60;
  for (const exercise of input.main) {
    seconds += TRANSITION_SEC;
    seconds += exercise.sets * setSeconds(exercise.scheme);
    seconds += (exercise.sets - 1) * input.restSec;
  }
  seconds += input.finisherCount * FINISHER_MINUTES_PER_ITEM * 60;
  return seconds / 60;
}

/** Exposed for tests and the session screen's time display. */
export function estimateSessionMinutes(plan: ProgrammeSessionPlan): number {
  return plan.estimatedMinutes;
}

// ---------------------------------------------------------------------------
// Session completion → state (promotion + rehearsal credits + finisher dose)
// ---------------------------------------------------------------------------

export interface ProgrammeSessionResults {
  /** One outcome per performed main exercise (reported data, C10). */
  outcomes: readonly PatternSessionOutcome[];
  /** Movement prep completed → gateway rehearsals credit (spec §4). */
  prepCompleted: boolean;
  finisherCompleted: boolean;
  completedAtIso: string;
}

export interface AppliedProgrammeSession {
  state: ProgrammeState;
  decisions: Partial<Record<ProgrammePattern, PromotionDecision>>;
}

/**
 * Applies a finished session: promotion evaluation per pattern, rehearsal
 * exposure credits from completed prep (day one onward — that is the point
 * of the rehearsal), finisher progression (+5 contacts per completed
 * finisher, capped at 50 — provisional config, spec §8 dosing), and the
 * session recency that drives the 14-day regression.
 */
export function applyProgrammeSessionResults(
  state: ProgrammeState,
  plan: ProgrammeSessionPlan,
  results: ProgrammeSessionResults
): AppliedProgrammeSession {
  let ladders = { ...state.ladders };
  const decisions: Partial<Record<ProgrammePattern, PromotionDecision>> = {};

  for (const outcome of results.outcomes) {
    const before = ladders[outcome.pattern];
    const evaluated = evaluatePatternOutcome(before, outcome, ladders);
    let nextState = evaluated.nextState;
    // Double progression, EFFORT-SCALED (2026-07-06 amendment to the Step 3
    // design): advancement is proportional to reported reserve so target
    // build-up never starves fast-/entry-promotion (which key off top of
    // range). 'lots' → jump straight to the range top; 'a_few' → +2;
    // 'none' or unanswered → hold. Applies only when every set reached the
    // target at the current level; promotion/regression reset the target.
    if (
      (evaluated.decision.kind === 'hold' || evaluated.decision.kind === 'promotion_locked') &&
      outcome.levelPerformed === before.currentLevel
    ) {
      const scheme = getProgrammeLevel(outcome.pattern, before.currentLevel).scheme;
      const target = Math.min(Math.max(before.currentRepTarget ?? scheme.min, scheme.min), scheme.max);
      const everySetReachedTarget =
        outcome.sets.length > 0 && outcome.sets.every((set) => set.achieved >= target);
      if (everySetReachedTarget) {
        const advance = outcome.effort === 'lots' ? scheme.max - target : outcome.effort === 'a_few' ? 2 : 0;
        if (advance > 0) {
          nextState = { ...nextState, currentRepTarget: Math.min(target + advance, scheme.max) };
        }
      }
    }
    ladders = { ...ladders, [outcome.pattern]: nextState };
    decisions[outcome.pattern] = evaluated.decision;
  }

  if (results.prepCompleted) {
    for (const drillId of plan.prep.rehearsalDrillIds) {
      for (const pattern of Object.keys(ladders) as ProgrammePattern[]) {
        ladders = { ...ladders, [pattern]: recordRehearsalExposure(ladders[pattern], drillId) };
      }
    }
  }

  const finisher = results.finisherCompleted
    ? {
        ...state.finisher,
        completedSessions: state.finisher.completedSessions + 1,
        currentContacts: Math.min(50, state.finisher.currentContacts + 5),
      }
    : state.finisher;

  return {
    state: {
      ...state,
      ladders,
      finisher,
      completedSessionCount: state.completedSessionCount + 1,
      lastSessionAtIso: results.completedAtIso,
    },
    decisions,
  };
}

/** Which adaptation branches exist, for the session layer's cue softening. */
export function adaptationBranchById(id: AdaptationBranchId) {
  const branch = ADAPTATION_BRANCHES.find((b) => b.id === id);
  if (!branch) throw new Error(`unknown adaptation branch '${id}'`);
  return branch;
}
