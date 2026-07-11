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
 * ±rep adjustment she made — never a measurement. Timed sets end on the
 * player's clock (an interrupted in-flight set is discarded by the player and
 * the item redone), so a timed set present in results was completed: its
 * achieved value is the plan's per-side target by construction.
 *
 * Pain: a safety-word or "something hurts" halt marks the item skipped with
 * skipReason 'pain'; that becomes painFlag on the pattern outcome (keeping
 * any completed sets), which the promotion engine turns into the pain
 * regression. Pain during warm-up or the finisher clears prepCompleted /
 * finisherCompleted but has no ladder to regress — a recorded v1 limitation
 * (the finisher shares no promotion state).
 */

import type { TrainingSetRuntimeGeneratedExercise } from '../training/setRuntime';
import type { TrainingItemResult, TrainingSessionResult } from '../training/sessionPlayer';
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

export interface ProgrammeVoiceSessionInputs {
  exerciseIds: string[];
  generatedExercises: TrainingSetRuntimeGeneratedExercise[];
  resolveExercise: (exerciseId: string) => ExerciseDefinition;
  resolveSafetyProfile: (exerciseId: string) => PlannedExerciseSafetyCueProfile;
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
  return BALANCE_FOCUS_IDS.has(exerciseId)
    ? getExercise(exerciseId)
    : programmeVoiceExerciseDefinition(exerciseId);
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

export function voiceSessionInputsFromPlan(plan: ProgrammeSessionPlan): ProgrammeVoiceSessionInputs {
  const distinctBalanceFocus = plan.focusBlock?.kind === 'balance' ? plan.focusBlock : null;
  const focusDose = balanceFocusDose(plan);
  const exerciseIds = [
    PROGRAMME_PREP_ITEM_ID,
    ...plan.main.map((exercise) => exercise.exerciseId),
    ...(distinctBalanceFocus ? [distinctBalanceFocus.exerciseId] : []),
    ...plan.finisher.map((item) => item.id),
  ];
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
  ];
  const supportVariantIds = new Set(
    [
      ...plan.main
        .filter((exercise) => exercise.useSupportVariant)
        .map((exercise) => exercise.exerciseId),
      ...(distinctBalanceFocus ? [distinctBalanceFocus.exerciseId] : []),
    ]
  );
  return {
    exerciseIds,
    generatedExercises,
    resolveExercise: exerciseDefinitionForPlan,
    resolveSafetyProfile: (exerciseId) => {
      const profile = safetyProfileForPlan(exerciseId);
      return supportVariantIds.has(exerciseId) ? withSupportCues(profile) : profile;
    },
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
  // Timed sets present in results ran their full window (module header).
  return exercise.repTargetPerSet;
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
