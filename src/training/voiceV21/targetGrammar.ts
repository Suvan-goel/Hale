import type {
  TrainingVoiceExerciseContractV21,
  TrainingVoiceSetTypeV21,
  TrainingVoiceTargetPlanV21,
  TrainingVoiceTargetReasonCodeV21,
  TrainingVoiceTargetUnitV21,
} from './types';

export interface TrainingVoicePrescribedTargetV21 {
  readonly repsPerSet?: number;
  readonly secondsPerSet?: number;
  readonly holdSec?: number;
  readonly timerSec?: number;
  readonly captureSec?: number;
}

export interface ResolveTrainingVoiceTargetV21Input {
  readonly contract: Pick<
    TrainingVoiceExerciseContractV21,
    'exerciseId' | 'setType' | 'targetCue' | 'livePrescription'
  >;
  readonly prescribedTarget?: TrainingVoicePrescribedTargetV21 | null;
  readonly setType?: TrainingVoiceSetTypeV21;
}

const NUMBER_WORDS: Readonly<Record<number, string>> = {
  0: 'zero',
  1: 'one',
  2: 'two',
  3: 'three',
  4: 'four',
  5: 'five',
  6: 'six',
  7: 'seven',
  8: 'eight',
  9: 'nine',
  10: 'ten',
  11: 'eleven',
  12: 'twelve',
  13: 'thirteen',
  14: 'fourteen',
  15: 'fifteen',
  16: 'sixteen',
  17: 'seventeen',
  18: 'eighteen',
  19: 'nineteen',
  20: 'twenty',
  21: 'twenty-one',
  22: 'twenty-two',
  23: 'twenty-three',
  24: 'twenty-four',
  25: 'twenty-five',
  26: 'twenty-six',
  27: 'twenty-seven',
  28: 'twenty-eight',
  29: 'twenty-nine',
  30: 'thirty',
  31: 'thirty-one',
  32: 'thirty-two',
  33: 'thirty-three',
  34: 'thirty-four',
  35: 'thirty-five',
  36: 'thirty-six',
  37: 'thirty-seven',
  38: 'thirty-eight',
  39: 'thirty-nine',
  40: 'forty',
};

const TARGET_GUIDANCE_BY_EXERCISE_ID: Readonly<Record<string, string>> = {
  'balance-feet-together-hold': "Breathe normally, and I'll tell you when to stop.",
  'balance-single-leg-hold': 'Breathe normally, and use support if you feel unsteady.',
  'balance-tandem-hold': 'Keep breathing, and touch support if you need to.',
  'band-pull-apart': 'Keep the band tension light and comfortable.',
  'chair-supported-split-squat': 'Take your time and use support whenever you need it.',
  'glute-bridge-hold': "Breathe normally, and I'll tell you when to lower down.",
  'glute-bridge-reps': 'Move slowly and stay comfortable.',
  'loaded-march': 'Left and right both count.',
  'loaded-sit-to-stand': 'Move steadily and keep the weight close to your body.',
  'mini-band-lateral-walk': 'Keep the steps small and steady.',
  'overhead-press-band': 'Keep the tension light and stop if your shoulders do not feel comfortable.',
  'push-up-standard': 'Move with control, and stop if it does not feel right.',
  'seated-band-row': 'Keep the band secure under your feet and move with control.',
  'step-up': 'Move carefully, and set both feet on the floor after each rep.',
  'standing-band-row': 'Keep the tension light and the anchor secure.',
  'sts-cushion': 'Take your time and move with control.',
  'sts-power': 'Stand up with energy, but keep each sit-down controlled.',
  'sts-slow-eccentric': 'The slow sit-down is the important part.',
  'sts-standard': "Move at a steady pace, and I'll tell you when the set is done.",
  'supported-side-step': "Stay comfortable, and I'll tell you when to stop.",
};

export function resolveTrainingVoiceTargetV21(
  input: ResolveTrainingVoiceTargetV21Input
): TrainingVoiceTargetPlanV21 {
  const setType = input.setType ?? input.contract.setType;
  const value = targetValueFor(setType, input.contract.livePrescription, input.prescribedTarget);
  if (value === null) {
    return unsupportedTarget(input.contract.targetCue.key, input.contract.targetCue.exactScript, null, 'none', [
      'missing_target',
    ]);
  }
  if (!Number.isInteger(value)) {
    return unsupportedTarget(input.contract.targetCue.key, input.contract.targetCue.exactScript, value, unitFor(setType), [
      'non_integer_target',
    ]);
  }

  if (setType === 'reps') {
    if (value < 1 || value > 40) {
      return unsupportedTarget(input.contract.targetCue.key, input.contract.targetCue.exactScript, value, 'rep', [
        'unsupported_reps',
      ]);
    }
    const noun = value === 1 ? 'rep' : 'reps';
    const text = repsTargetText(input.contract.exerciseId, value, noun);
    return supportedTarget(input.contract.targetCue.key, text, value, 'rep', input.prescribedTarget);
  }

  if (setType === 'hold') {
    if (value < 1 || value > 40) {
      return unsupportedTarget(input.contract.targetCue.key, input.contract.targetCue.exactScript, value, 'second', [
        'unsupported_seconds',
      ]);
    }
    const noun = value === 1 ? 'second' : 'seconds';
    const text = withTargetGuidance(input.contract.exerciseId, `Hold for ${numberWord(value)} ${noun}.`);
    return supportedTarget(input.contract.targetCue.key, text, value, 'second', input.prescribedTarget);
  }

  if (setType === 'timer') {
    if (value < 1 || value > 40) {
      return unsupportedTarget(input.contract.targetCue.key, input.contract.targetCue.exactScript, value, 'second', [
        'unsupported_seconds',
      ]);
    }
    const noun = value === 1 ? 'second' : 'seconds';
    const text = withTargetGuidance(input.contract.exerciseId, `Move for ${numberWord(value)} ${noun}.`);
    return supportedTarget(input.contract.targetCue.key, text, value, 'second', input.prescribedTarget);
  }

  if (setType === 'rom') {
    const defaultValue = targetValueFor(setType, input.contract.livePrescription, null);
    if (value !== defaultValue || (value !== 12 && value !== 14)) {
      return unsupportedTarget(input.contract.targetCue.key, input.contract.targetCue.exactScript, value, 'rom_window', [
        'unsupported_seconds',
      ]);
    }
    return supportedTarget(
      input.contract.targetCue.key,
      input.contract.targetCue.exactScript,
      value,
      'rom_window',
      input.prescribedTarget
    );
  }

  return unsupportedTarget(input.contract.targetCue.key, input.contract.targetCue.exactScript, value, 'none', [
    'unsupported_set_type',
  ]);
}

function repsTargetText(exerciseId: string, value: number, noun: 'rep' | 'reps'): string {
  if (exerciseId === 'loaded-march') {
    const marchNoun = value === 1 ? 'march' : 'marches';
    return withTargetGuidance(exerciseId, `Aim for ${numberWord(value)} total ${marchNoun}.`);
  }
  if (exerciseId === 'step-up') {
    return withTargetGuidance(exerciseId, `Do ${numberWord(value)} total ${noun}.`);
  }
  return withTargetGuidance(exerciseId, `Aim for ${numberWord(value)} ${noun}.`);
}

function withTargetGuidance(exerciseId: string, baseText: string): string {
  const guidance = TARGET_GUIDANCE_BY_EXERCISE_ID[exerciseId];
  return guidance ? `${baseText} ${guidance}` : baseText;
}

export function defaultTargetValueForContractV21(
  contract: Pick<TrainingVoiceExerciseContractV21, 'setType' | 'livePrescription'>
): number | null {
  return targetValueFor(contract.setType, contract.livePrescription, null);
}

function targetValueFor(
  setType: TrainingVoiceSetTypeV21,
  prescription: Pick<TrainingVoiceExerciseContractV21['livePrescription'], 'repsPerSet' | 'holdSec' | 'timerSec' | 'captureSec'>,
  prescribedTarget?: TrainingVoicePrescribedTargetV21 | null
): number | null {
  if (setType === 'reps') return prescribedTarget?.repsPerSet ?? prescription.repsPerSet ?? null;
  if (setType === 'hold') {
    return prescribedTarget?.secondsPerSet ?? prescribedTarget?.holdSec ?? prescription.holdSec ?? null;
  }
  if (setType === 'timer') {
    return prescribedTarget?.secondsPerSet ?? prescribedTarget?.timerSec ?? prescription.timerSec ?? null;
  }
  if (setType === 'rom') {
    return prescribedTarget?.secondsPerSet ?? prescribedTarget?.captureSec ?? prescription.captureSec ?? null;
  }
  return null;
}

function supportedTarget(
  cueKey: string,
  text: string,
  value: number,
  unit: TrainingVoiceTargetUnitV21,
  prescribedTarget?: TrainingVoicePrescribedTargetV21 | null,
  reasonCode?: TrainingVoiceTargetReasonCodeV21,
  visibleText?: string
): TrainingVoiceTargetPlanV21 {
  return {
    supported: true,
    cueKey,
    exactScript: text,
    visibleText: visibleText ?? text,
    spokenText: text,
    value,
    unit,
    singular: value === 1,
    reasonCodes: [reasonCode ?? (prescribedTarget ? 'target_derived_from_generated_session' : 'target_matches_prescription')],
  };
}

function unsupportedTarget(
  cueKey: string,
  fallbackScript: string,
  value: number | null,
  unit: TrainingVoiceTargetUnitV21,
  reasonCodes: readonly TrainingVoiceTargetReasonCodeV21[]
): TrainingVoiceTargetPlanV21 {
  return {
    supported: false,
    cueKey,
    exactScript: fallbackScript,
    visibleText: fallbackScript,
    spokenText: fallbackScript,
    value,
    unit,
    singular: value === 1,
    reasonCodes,
  };
}

function unitFor(setType: TrainingVoiceSetTypeV21): TrainingVoiceTargetUnitV21 {
  if (setType === 'reps') return 'rep';
  if (setType === 'hold' || setType === 'timer') return 'second';
  if (setType === 'rom') return 'rom_window';
  return 'none';
}

function numberWord(value: number): string {
  return NUMBER_WORDS[value] ?? value.toString();
}
