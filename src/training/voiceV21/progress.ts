import type {
  TrainingVoiceActiveProgressPlanV21,
  TrainingVoiceProgressEventV21,
  TrainingVoiceSetTypeV21,
} from './types';

const CANCEL_CONDITIONS = Object.freeze([
  'pause',
  'tracking_loss',
  'retry',
  'side_switch',
  'set_completion',
  'skip',
  'state_exit',
  'voice_scope_replacement',
] as const);

export interface ResolveTrainingVoiceProgressPlanV21Input {
  readonly setType: TrainingVoiceSetTypeV21 | 'side_segment';
  readonly targetMs?: number | null;
  readonly context?: string | null;
}

export function resolveTrainingVoiceProgressPlanV21(
  input: ResolveTrainingVoiceProgressPlanV21Input
): TrainingVoiceActiveProgressPlanV21 {
  const targetMs = finitePositiveMs(input.targetMs) ? Math.round(input.targetMs as number) : null;
  const events: TrainingVoiceProgressEventV21[] = [];
  const reasonCodes: string[] = [];

  if (input.setType === 'reps') {
    reasonCodes.push('rep_sets_use_sfx_only');
  } else if (input.setType === 'rom') {
    if (targetMs === 12000 || targetMs === 14000) {
      reasonCodes.push(`rom_${targetMs}_no_progress`);
    } else {
      reasonCodes.push(targetMs === null ? 'missing_target' : 'unsupported_rom_target_no_approximation');
    }
  } else if (input.setType === 'hold' || input.setType === 'timer' || input.setType === 'side_segment') {
    if (targetMs === 15000) {
      events.push(event('five-seconds-left-v21', 10000, input));
      reasonCodes.push('target_15s_five_seconds_left');
    } else if (targetMs === 20000) {
      events.push(event('halfway-v21', 10000, input));
      events.push(event('five-seconds-left-v21', 15000, input));
      reasonCodes.push('target_20s_halfway_and_five_seconds_left');
    } else if (targetMs === 30000) {
      events.push(event('halfway-v21', 15000, input));
      events.push(event('five-seconds-left-v21', 25000, input));
      reasonCodes.push('target_30s_halfway_and_five_seconds_left');
    } else if (targetMs === 6000 || targetMs === 7500 || targetMs === 10000) {
      reasonCodes.push(`short_${targetMs}_no_progress`);
    } else {
      reasonCodes.push(targetMs === null ? 'missing_target' : 'unsupported_target_no_approximation');
    }
  } else {
    reasonCodes.push('unsupported_set_type_no_progress');
  }

  return {
    setType: input.setType,
    targetMs,
    events,
    reasonCodes,
    optional: true,
    dropIfBusy: true,
    replayIfMissed: false,
    cancelConditions: CANCEL_CONDITIONS,
  };
}

export function listTrainingVoiceProgressPlanContextsV21(): TrainingVoiceActiveProgressPlanV21[] {
  return [
    resolveTrainingVoiceProgressPlanV21({ setType: 'reps', targetMs: null, context: 'rep_set' }),
    resolveTrainingVoiceProgressPlanV21({ setType: 'hold', targetMs: 15000, context: 'hold_15_second' }),
    resolveTrainingVoiceProgressPlanV21({ setType: 'hold', targetMs: 20000, context: 'hold_20_second' }),
    resolveTrainingVoiceProgressPlanV21({ setType: 'timer', targetMs: 30000, context: 'timer_30_second' }),
    resolveTrainingVoiceProgressPlanV21({ setType: 'rom', targetMs: 12000, context: 'rom_12_second' }),
    resolveTrainingVoiceProgressPlanV21({ setType: 'rom', targetMs: 14000, context: 'rom_14_second' }),
    resolveTrainingVoiceProgressPlanV21({ setType: 'side_segment', targetMs: 6000, context: 'side_6_second' }),
    resolveTrainingVoiceProgressPlanV21({ setType: 'side_segment', targetMs: 7500, context: 'side_7_5_second' }),
    resolveTrainingVoiceProgressPlanV21({ setType: 'side_segment', targetMs: 10000, context: 'side_10_second' }),
    resolveTrainingVoiceProgressPlanV21({ setType: 'side_segment', targetMs: 15000, context: 'side_15_second' }),
    resolveTrainingVoiceProgressPlanV21({ setType: 'timer', targetMs: 13000, context: 'unsupported_13_second' }),
  ];
}

export function validateTrainingVoiceProgressPlansV21(): {
  readonly valid: boolean;
  readonly progressPlanContextCount: number;
  readonly unsupportedProgressSilentlyApproximatedCount: number;
  readonly spokenRepCountCount: number;
  readonly defaultTwoRepsLeftCount: number;
} {
  const contexts = listTrainingVoiceProgressPlanContextsV21();
  const repPlan = contexts.find((plan) => plan.setType === 'reps');
  const unsupported = contexts.find((plan) => plan.reasonCodes.includes('unsupported_target_no_approximation'));
  return {
    valid:
      (repPlan?.events.length ?? 1) === 0 &&
      (unsupported?.events.length ?? 1) === 0 &&
      contexts.every((plan) => plan.replayIfMissed === false && plan.dropIfBusy === true),
    progressPlanContextCount: contexts.length,
    unsupportedProgressSilentlyApproximatedCount: unsupported?.events.length ?? 0,
    spokenRepCountCount: repPlan?.events.length ?? 0,
    defaultTwoRepsLeftCount: 0,
  };
}

function event(
  logicalCueKey: TrainingVoiceProgressEventV21['logicalCueKey'],
  dueAtActiveElapsedMs: number,
  input: ResolveTrainingVoiceProgressPlanV21Input
): TrainingVoiceProgressEventV21 {
  const suffix = input.context ?? `${input.setType}-${input.targetMs ?? 'none'}`;
  return {
    eventId: `${suffix}:${logicalCueKey}:${dueAtActiveElapsedMs}`,
    dueAtActiveElapsedMs,
    logicalCueKey,
    policyId: 'low_reassurance',
  };
}

function finitePositiveMs(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}
