/**
 * Programme v2 ↔ voice-player session mapping (the bridge's data plane).
 *
 * voiceSessionInputsFromPlan turns a generated ProgrammeSessionPlan into the
 * inputs the voice-guided player consumes: item order (warm-up → main →
 * finisher), per-item doses as generatedExercises (the player honors these
 * over any definition fallback), and the two injected catalogue seams.
 *
 * programmeResultsFromVoiceSession maps the player's TrainingSessionResult
 * back into ProgrammeSessionResults. Data honesty (C10/N5): every achieved
 * value is REPORTED — the prescribed target confirmed on "done", carrying any
 * ±rep adjustment she made — never a measurement. Timed sets normally end on
 * the player's clock (an interrupted in-flight set is discarded by the player
 * and the item redone), but "done" may close one early — so a timed set's
 * achieved value credits only the seconds the player recorded as held (per
 * side for per-side windows, net of the switch buffer); a full window credits
 * exactly the plan's per-side target.
 *
 * Pain: a safety-word or "something hurts" halt marks the item skipped with
 * skipReason 'pain'; that becomes painFlag on the pattern outcome (keeping
 * any completed sets), which the promotion engine turns into the pain
 * regression. Pain during warm-up or the finisher clears prepCompleted /
 * finisherCompleted but has no ladder to regress — a recorded v1 limitation
 * (the finisher shares no promotion state).
 */

import type { VoiceCueKey } from '../audio/cues';
import type { TrainingSetRuntimeGeneratedExercise } from '../training/setRuntime';
import type {
  TrainingItemResult,
  TrainingSessionResult,
  VoiceSessionPlayerOptions,
} from '../training/voiceSessionPlayer';
import {
  BALANCE_FEET_TOGETHER_ID,
  BALANCE_SINGLE_LEG_ID,
  BALANCE_TANDEM_ID,
  getExercise,
  type ExerciseDefinition,
} from '../exercises';
import type { PlannedExerciseSafetyCueProfile } from '../training/safetyCueDefinitions';
import { requireExerciseSafetyCueProfile } from '../training/safetyCues';
import type {
  PatternSessionOutcome,
  ProgrammePattern,
} from './types';
import type { ProgrammeSessionExercise, ProgrammeSessionPlan, ProgrammeSessionResults } from './session';
import {
  PROGRAMME_PREP_ITEM_ID,
  programmeVoiceExerciseDefinition,
  programmeVoiceSafetyProfile,
  withSupportCues,
} from './voiceCatalog';

/** Seconds allowed for the side swap inside a per-side timed window. */
const PER_SIDE_SWITCH_BUFFER_SEC = 10;
const BALANCE_FOCUS_IDS = new Set<string>([
  BALANCE_FEET_TOGETHER_ID,
  BALANCE_TANDEM_ID,
  BALANCE_SINGLE_LEG_ID,
]);

/**
 * The registry's generic hold line promises "the position I describe", but in
 * this voice-only session nothing else describes it — so each hold appends
 * the bundled check-up stance cue (already recorded for every voice and
 * hot-phrase-safe; verified against the intent matcher's fuzzy neighborhood).
 */
const BALANCE_STANCE_CUES: Readonly<Record<string, VoiceCueKey>> = {
  [BALANCE_FEET_TOGETHER_ID]: 'balance-feet-together',
  [BALANCE_TANDEM_ID]: 'balance-tandem',
  [BALANCE_SINGLE_LEG_ID]: 'balance-single-leg',
};

export interface ProgrammeVoiceSessionInputs {
  exerciseIds: string[];
  generatedExercises: TrainingSetRuntimeGeneratedExercise[];
  resolveExercise: (exerciseId: string) => ExerciseDefinition;
  resolveSafetyProfile: (exerciseId: string) => PlannedExerciseSafetyCueProfile;
  /** Present only when the plan marked patterns bonus-eligible (C9 offer). */
  bonusSetOffer?: VoiceSessionPlayerOptions['bonusSetOffer'];
  /** Plain-language per-set target for the screen ("10 reps", "30 seconds each side"). */
  doseLabelForExercise: (exerciseId: string) => string | null;
}

export interface VoiceSessionInputOptions {
  /**
   * Item ids already handled by an interrupted run of this same plan
   * (completed or skipped) — resumed sessions replay only the remainder.
   */
  readonly completedExerciseIds?: readonly string[];
}

function mainDose(exercise: ProgrammeSessionExercise): TrainingSetRuntimeGeneratedExercise {
  switch (exercise.scheme.kind) {
    case 'reps':
    case 'reps_per_side':
      return {
        exerciseId: exercise.exerciseId,
        sets: exercise.sets,
        repsPerSet: exercise.repTargetPerSet,
        restSeconds: exercise.restSec,
      };
    case 'seconds':
      return {
        exerciseId: exercise.exerciseId,
        sets: exercise.sets,
        secondsPerSet: exercise.repTargetPerSet,
        restSeconds: exercise.restSec,
      };
    case 'seconds_per_side':
      // One window covers both sides; the instruction line cues the swap.
      return {
        exerciseId: exercise.exerciseId,
        sets: exercise.sets,
        secondsPerSet: exercise.repTargetPerSet * 2 + PER_SIDE_SWITCH_BUFFER_SEC,
        restSeconds: exercise.restSec,
      };
  }
}

function finisherDose(
  item: ProgrammeSessionPlan['finisher'][number]
): TrainingSetRuntimeGeneratedExercise {
  switch (item.dose.kind) {
    case 'contacts':
      return {
        exerciseId: item.id,
        sets: 1,
        repsPerSet: item.contacts ?? item.dose.min,
        restSeconds: 30,
      };
    case 'sets_reps':
      return {
        exerciseId: item.id,
        sets: item.dose.sets,
        repsPerSet: item.dose.min,
        restSeconds: 30,
      };
    case 'seconds':
      return { exerciseId: item.id, sets: 1, secondsPerSet: item.dose.min, restSeconds: 30 };
  }
}

function balanceFocusDose(
  plan: ProgrammeSessionPlan
): TrainingSetRuntimeGeneratedExercise | null {
  const block = plan.focusBlock;
  if (block?.kind !== 'balance') return null;
  return {
    exerciseId: block.exerciseId,
    sets: block.sets,
    secondsPerSet: block.holdSec,
    restSeconds: block.restSec,
  };
}

function exerciseDefinitionForPlan(exerciseId: string): ExerciseDefinition {
  if (!BALANCE_FOCUS_IDS.has(exerciseId)) return programmeVoiceExerciseDefinition(exerciseId);
  const definition = getExercise(exerciseId);
  return {
    ...definition,
    voice: {
      ...definition.voice,
      instructions: [...definition.voice.instructions, BALANCE_STANCE_CUES[exerciseId]],
    },
  };
}

function safetyProfileForPlan(exerciseId: string): PlannedExerciseSafetyCueProfile {
  if (!BALANCE_FOCUS_IDS.has(exerciseId)) return programmeVoiceSafetyProfile(exerciseId);
  const profile = requireExerciseSafetyCueProfile(exerciseId);
  // The shared balance profile also serves camera-conducted sessions. This
  // programme path is voice-only, so keep its support/steadiness guidance and
  // strip camera-tracking recovery cues.
  const withoutTracking = (cueIds: PlannedExerciseSafetyCueProfile['activeCueIds']) =>
    cueIds.filter((cueId) => !cueId.startsWith('tracking_'));
  return {
    ...profile,
    setupCueIds: withoutTracking(profile.setupCueIds),
    activeCueIds: withoutTracking(profile.activeCueIds),
    repeatedSetCueIds: withoutTracking(profile.repeatedSetCueIds),
    recoveryCueIds: [],
  };
}

/** Spoken-and-shown per-set target for one main exercise (scheme-aware). */
function mainDoseLabel(exercise: ProgrammeSessionExercise): string {
  const target = exercise.repTargetPerSet;
  switch (exercise.scheme.kind) {
    case 'reps':
      return `${target} reps`;
    case 'reps_per_side':
      return `${target} each side`;
    case 'seconds':
      return `${target} seconds`;
    case 'seconds_per_side':
      return `${target} seconds each side`;
  }
}

function finisherDoseLabel(item: ProgrammeSessionPlan['finisher'][number]): string {
  switch (item.dose.kind) {
    case 'contacts':
      return `${item.contacts ?? item.dose.min} reps`;
    case 'sets_reps':
      return item.dose.perSide ? `${item.dose.min} each side` : `${item.dose.min} reps`;
    case 'seconds':
      return `${item.dose.min} seconds`;
  }
}

/**
 * Every plan item's target in plain language, keyed by exercise id. Targets
 * live ON SCREEN by design (voiceScripts.ts) so a changed dose never stales a
 * bundled audio asset — this map is what makes that promise true.
 */
function doseLabelsForPlan(plan: ProgrammeSessionPlan): Map<string, string> {
  const labels = new Map<string, string>();
  labels.set(PROGRAMME_PREP_ITEM_ID, `${plan.prep.minutes} minutes`);
  for (const exercise of plan.main) labels.set(exercise.exerciseId, mainDoseLabel(exercise));
  if (plan.focusBlock?.kind === 'balance') {
    labels.set(plan.focusBlock.exerciseId, `${plan.focusBlock.holdSec} seconds`);
  }
  for (const item of plan.finisher) {
    if (!labels.has(item.id)) labels.set(item.id, finisherDoseLabel(item));
  }
  return labels;
}

export function voiceSessionInputsFromPlan(
  plan: ProgrammeSessionPlan,
  options: VoiceSessionInputOptions = {}
): ProgrammeVoiceSessionInputs {
  const distinctBalanceFocus = plan.focusBlock?.kind === 'balance' ? plan.focusBlock : null;
  const focusDose = balanceFocusDose(plan);
  const handledIds = new Set(options.completedExerciseIds ?? []);
  const exerciseIds = [
    PROGRAMME_PREP_ITEM_ID,
    ...plan.main.map((exercise) => exercise.exerciseId),
    ...(distinctBalanceFocus ? [distinctBalanceFocus.exerciseId] : []),
    ...plan.finisher.map((item) => item.id),
  ].filter((exerciseId) => !handledIds.has(exerciseId));
  const generatedExercises: TrainingSetRuntimeGeneratedExercise[] = [
    {
      exerciseId: PROGRAMME_PREP_ITEM_ID,
      sets: 1,
      secondsPerSet: plan.prep.minutes * 60,
      restSeconds: 0,
    },
    ...plan.main.map(mainDose),
    ...(focusDose ? [focusDose] : []),
    ...plan.finisher.map(finisherDose),
  ].filter((exercise) => !handledIds.has(exercise.exerciseId));
  const supportVariantIds = new Set(
    [
      ...plan.main
        .filter((exercise) => exercise.useSupportVariant)
        .map((exercise) => exercise.exerciseId),
      ...(distinctBalanceFocus ? [distinctBalanceFocus.exerciseId] : []),
    ]
  );
  const bonusExerciseIds = plan.main
    .filter(
      (exercise) =>
        plan.bonusSetEligible.includes(exercise.pattern) && !handledIds.has(exercise.exerciseId)
    )
    .map((exercise) => exercise.exerciseId);
  const doseLabels = doseLabelsForPlan(plan);
  return {
    exerciseIds,
    generatedExercises,
    resolveExercise: exerciseDefinitionForPlan,
    resolveSafetyProfile: (exerciseId) => {
      const profile = safetyProfileForPlan(exerciseId);
      return supportVariantIds.has(exerciseId) ? withSupportCues(profile) : profile;
    },
    ...(bonusExerciseIds.length > 0
      ? { bonusSetOffer: { exerciseIds: bonusExerciseIds, offerCue: 'prog-bonus-set-offer' as const } }
      : {}),
    doseLabelForExercise: (exerciseId) => doseLabels.get(exerciseId) ?? null,
  };
}

// ---------------------------------------------------------------------------
// Results mapping (player → engine)
// ---------------------------------------------------------------------------

function achievedForSet(
  set: TrainingItemResult['sets'][number],
  exercise: ProgrammeSessionExercise
): number {
  const isReps = exercise.scheme.kind === 'reps' || exercise.scheme.kind === 'reps_per_side';
  if (isReps) {
    // reportedReps carries any ±adjustment in place (player semantics).
    return Math.max(0, set.reportedReps ?? exercise.repTargetPerSet);
  }
  // Timed sets: "done" may close the window early, so credit only the seconds
  // the player recorded as held — never the full target for a cut-short hold
  // (C10; an inflated hold would feed top-of-range promotion). A full window
  // credits exactly the per-side target; a legacy set without a recorded
  // duration keeps the historical full-target reading.
  const target = exercise.repTargetPerSet;
  if (!Number.isFinite(set.holdSec)) return target;
  const heldSec =
    exercise.scheme.kind === 'seconds_per_side'
      ? (set.holdSec - PER_SIDE_SWITCH_BUFFER_SEC) / 2
      : set.holdSec;
  return Math.min(target, Math.max(0, Math.floor(heldSec)));
}

export function programmeResultsFromVoiceSession(
  plan: ProgrammeSessionPlan,
  result: TrainingSessionResult,
  completedAtIso: string = new Date().toISOString()
): ProgrammeSessionResults {
  const itemsById = new Map<string, TrainingItemResult>();
  for (const item of result.items) {
    if (!itemsById.has(item.exerciseId)) itemsById.set(item.exerciseId, item);
  }

  const outcomes: PatternSessionOutcome[] = [];
  const seenPatterns = new Set<ProgrammePattern>();
  for (const exercise of plan.main) {
    if (seenPatterns.has(exercise.pattern)) continue;
    const item = itemsById.get(exercise.exerciseId);
    if (!item) continue; // never reached (session ended early)
    const painFlag = item.skipReason === 'pain';
    if (item.status === 'skipped' && !painFlag) continue; // deliberate skip → no outcome
    seenPatterns.add(exercise.pattern);
    outcomes.push({
      pattern: exercise.pattern,
      levelPerformed: exercise.level,
      sets: item.sets.map((set) => ({ achieved: achievedForSet(set, exercise) })),
      effort: null, // stamped by the caller from the session RPE (C9)
      painFlag,
      performedAtIso: completedAtIso,
    });
  }

  const prepItem = itemsById.get(PROGRAMME_PREP_ITEM_ID);
  const finisherItems = plan.finisher.map((item) => itemsById.get(item.id));
  const focusItem = plan.focusBlock ? itemsById.get(plan.focusBlock.exerciseId) : undefined;
  return {
    outcomes,
    prepCompleted: prepItem?.status === 'completed',
    ...(plan.focusBlock
      ? { focusBlockCompleted: focusItem?.status === 'completed' }
      : {}),
    finisherCompleted:
      plan.finisher.length > 0 &&
      finisherItems.every((item) => item?.status === 'completed'),
    completedAtIso,
  };
}
