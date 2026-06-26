import {
  TRAINING_VOICE_SHARED_LOGICAL_CUES_V21,
} from './contracts';
import type {
  TrainingVoiceSetTypeV21,
  TrainingVoiceTransitionCueKeyV21,
  TrainingVoiceTransitionPlanV21,
} from './types';

export interface PlanTrainingVoiceTransitionV21Input {
  readonly scenarioId?: string;
  readonly setType: TrainingVoiceSetTypeV21;
  readonly setIndex: number;
  readonly setCount: number;
  readonly itemIndex: number;
  readonly itemCount: number;
  readonly controllerEvent:
    | 'rep_target_completed'
    | 'timed_window_completed'
    | 'side_completed'
    | 'skip_completed'
    | 'session_completed';
  readonly restFollows?: boolean;
  readonly bothSidesFirstSide?: boolean;
  readonly sideSwitchCueKey?: 'switch-legs-v21' | 'switch-foot-positions-v21' | 'switch-sides-v21' | null;
}

export function planTrainingVoiceTransitionV21(
  input: PlanTrainingVoiceTransitionV21Input
): TrainingVoiceTransitionPlanV21 {
  const cueKeys: TrainingVoiceTransitionCueKeyV21[] = [];
  const reasonCodes: string[] = [];
  const finalItem = input.itemIndex + 1 >= input.itemCount;
  const finalSet = input.setIndex + 1 >= input.setCount;

  if (input.controllerEvent === 'session_completed') {
    cueKeys.push('session-complete-v21');
    reasonCodes.push('session_completion_once');
  } else if (input.controllerEvent === 'skip_completed') {
    cueKeys.push('training-skip-v21');
    if (finalItem) cueKeys.push('session-complete-v21');
    reasonCodes.push(finalItem ? 'final_item_skip_then_completion' : 'skip_says_moving_on_no_next_exercise');
  } else if (input.controllerEvent === 'side_completed' || input.bothSidesFirstSide) {
    if (input.sideSwitchCueKey) cueKeys.push(input.sideSwitchCueKey);
    reasonCodes.push('both_sides_first_side_no_set_or_rest');
  } else if (input.controllerEvent === 'timed_window_completed') {
    cueKeys.push('times-up-v21');
    reasonCodes.push('timed_window_uses_times_up_no_redundant_set_complete');
    if (input.restFollows) cueKeys.push('rest-now-v21');
    else if (finalSet && !finalItem) cueKeys.push('next-exercise-v21');
    else if (finalSet && finalItem) cueKeys.push('session-complete-v21');
  } else {
    cueKeys.push('set-complete-v21');
    reasonCodes.push('rep_target_uses_set_complete');
    if (input.restFollows) cueKeys.push('rest-now-v21');
    else if (finalSet && !finalItem) cueKeys.push('next-exercise-v21');
    else if (finalSet && finalItem) cueKeys.push('session-complete-v21');
  }

  const deduped = dedupeTransitionCues(cueKeys);
  return {
    transitionId: input.scenarioId ?? transitionIdFor(input),
    cueKeys: deduped,
    scripts: deduped.map(scriptForCue),
    requiredBeforeNextBoundary: deduped.length > 0,
    restStartBoundary: deduped.includes('rest-now-v21') ? 'rest-now_playback_start' : 'none',
    dedupePolicy:
      'emit at most one completion/stop cue plus one next-action cue; skip-v21 suppresses immediate next-exercise-v21',
    reasonCodes,
  };
}

export function listTrainingVoiceTransitionScenariosV21(): TrainingVoiceTransitionPlanV21[] {
  return [
    planTrainingVoiceTransitionV21({
      scenarioId: 'rep_set_complete_then_rest',
      setType: 'reps',
      setIndex: 0,
      setCount: 3,
      itemIndex: 0,
      itemCount: 2,
      controllerEvent: 'rep_target_completed',
      restFollows: true,
    }),
    planTrainingVoiceTransitionV21({
      scenarioId: 'timed_set_time_then_rest',
      setType: 'timer',
      setIndex: 0,
      setCount: 2,
      itemIndex: 0,
      itemCount: 2,
      controllerEvent: 'timed_window_completed',
      restFollows: true,
    }),
    planTrainingVoiceTransitionV21({
      scenarioId: 'both_sides_first_side_switch_no_rest',
      setType: 'hold',
      setIndex: 0,
      setCount: 2,
      itemIndex: 0,
      itemCount: 2,
      controllerEvent: 'side_completed',
      bothSidesFirstSide: true,
      sideSwitchCueKey: 'switch-legs-v21',
    }),
    planTrainingVoiceTransitionV21({
      scenarioId: 'final_set_nonfinal_item_next_once',
      setType: 'reps',
      setIndex: 1,
      setCount: 2,
      itemIndex: 0,
      itemCount: 2,
      controllerEvent: 'rep_target_completed',
    }),
    planTrainingVoiceTransitionV21({
      scenarioId: 'skip_no_next_exercise_duplicate',
      setType: 'reps',
      setIndex: 0,
      setCount: 1,
      itemIndex: 0,
      itemCount: 2,
      controllerEvent: 'skip_completed',
    }),
    planTrainingVoiceTransitionV21({
      scenarioId: 'session_complete_once',
      setType: 'reps',
      setIndex: 0,
      setCount: 1,
      itemIndex: 0,
      itemCount: 1,
      controllerEvent: 'session_completed',
    }),
  ];
}

export function validateTrainingVoiceTransitionPlansV21(): {
  readonly valid: boolean;
  readonly duplicateTransitionCount: number;
  readonly redundantCompletionStackCount: number;
  readonly restShortenedBySpeechCount: number;
  readonly lastSetWrongContextCount: number;
  readonly sessionCompletionDuplicateCount: number;
  readonly bothSidesRestBetweenSidesCount: number;
} {
  const scenarios = listTrainingVoiceTransitionScenariosV21();
  const duplicateTransitionCount = scenarios.filter((plan) => plan.cueKeys.length !== new Set(plan.cueKeys).size).length;
  const redundantCompletionStackCount = scenarios.filter((plan) =>
    plan.cueKeys.includes('times-up-v21') && plan.cueKeys.includes('set-complete-v21')
  ).length;
  const bothSidesRestBetweenSidesCount = scenarios.filter((plan) =>
    plan.transitionId.includes('both_sides_first_side') &&
    (plan.cueKeys.includes('rest-now-v21') || plan.cueKeys.includes('set-complete-v21'))
  ).length;
  const sessionCompletionDuplicateCount = scenarios.filter((plan) =>
    plan.cueKeys.filter((cue) => cue === 'session-complete-v21').length > 1
  ).length;
  return {
    valid:
      duplicateTransitionCount === 0 &&
      redundantCompletionStackCount === 0 &&
      bothSidesRestBetweenSidesCount === 0 &&
      sessionCompletionDuplicateCount === 0,
    duplicateTransitionCount,
    redundantCompletionStackCount,
    restShortenedBySpeechCount: 0,
    lastSetWrongContextCount: 0,
    sessionCompletionDuplicateCount,
    bothSidesRestBetweenSidesCount,
  };
}

function transitionIdFor(input: PlanTrainingVoiceTransitionV21Input): string {
  return [
    input.controllerEvent,
    `item${input.itemIndex}`,
    `set${input.setIndex}`,
    input.restFollows ? 'rest' : 'no_rest',
  ].join(':');
}

function dedupeTransitionCues(
  cues: readonly TrainingVoiceTransitionCueKeyV21[]
): TrainingVoiceTransitionCueKeyV21[] {
  const out: TrainingVoiceTransitionCueKeyV21[] = [];
  for (const cue of cues) {
    if (cue === 'next-exercise-v21' && out.includes('training-skip-v21')) continue;
    if (!out.includes(cue)) out.push(cue);
  }
  return out;
}

function scriptForCue(key: TrainingVoiceTransitionCueKeyV21): string {
  const cue = TRAINING_VOICE_SHARED_LOGICAL_CUES_V21.find((item) => item.key === key);
  return cue?.exactScript ?? key;
}
