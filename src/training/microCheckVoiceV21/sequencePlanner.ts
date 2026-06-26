import type { BodySide } from '../../checkup';
import type { MicroCheckType } from '../microCheck';
import {
  getMicroCheckVoiceContractV21,
  logicalCueV21,
  microCheckVoiceSetupCueForSideV21,
} from './contracts';
import type {
  MicroCheckVoiceExposureV21,
  MicroCheckVoiceLogicalCueKeyV21,
  MicroCheckVoiceLogicalCueV21,
  MicroCheckVoicePhaseV21,
  MicroCheckVoiceSequenceEntryV21,
  MicroCheckVoiceSequencePlanV21,
} from './types';

export const MICRO_CHECK_COUNTDOWN_CUE_KEYS_V21 = [
  'countdown-three',
  'countdown-two',
  'countdown-one',
  'go',
] as const satisfies readonly MicroCheckVoiceLogicalCueKeyV21[];

export interface PlanMicroCheckVoiceSequenceV21Input {
  readonly type: MicroCheckType;
  readonly selectedSide?: BodySide | null;
  readonly exposure: MicroCheckVoiceExposureV21;
  /**
   * Omit phase to compose the complete setup-to-go timeline for audit traces.
   * Runtime calls pass the current phase to request only the immediate segment.
   */
  readonly phase?: MicroCheckVoicePhaseV21 | null;
}

export function planMicroCheckVoiceSequenceV21(
  input: PlanMicroCheckVoiceSequenceV21Input
): MicroCheckVoiceSequencePlanV21 {
  const contract = getMicroCheckVoiceContractV21(input.type);
  const selectedSide = input.type === 'chair-power' ? null : input.selectedSide ?? null;
  const reasonCodes: string[] = [`exposure:${input.exposure}`];
  const entries: MicroCheckVoiceSequenceEntryV21[] = [];

  if (contract.sideRequired && !selectedSide) {
    reasonCodes.push('selected_side_required');
  }

  const pushCue = (cue: MicroCheckVoiceLogicalCueV21 | null) => {
    if (!cue) return;
    entries.push(required(cue));
  };

  if (input.exposure === 'completion') {
    pushCue(logicalCueV21(contract.completionCueKey));
  } else if (input.exposure === 'discard') {
    pushCue(logicalCueV21('micro-discard-v21'));
  } else if (input.exposure === 'repeat_instructions') {
    pushCue(microCheckVoiceSetupCueForSideV21(input.type, selectedSide));
  } else if (input.phase === 'instruction') {
    pushCue(microCheckVoiceSetupCueForSideV21(input.type, selectedSide));
  } else if (input.phase === 'final_position') {
    pushCue(logicalCueV21('final-position-set-v21'));
  } else if (input.phase === 'countdown') {
    pushCountdown(entries);
  } else {
    pushCue(microCheckVoiceSetupCueForSideV21(input.type, selectedSide));
    pushCue(logicalCueV21('final-position-set-v21'));
    pushCountdown(entries);
  }

  if (input.exposure !== 'completion' && input.exposure !== 'discard' && entries.length === 0) {
    reasonCodes.push('no_sequence_entries');
  }

  return {
    type: input.type,
    selectedSide,
    exposure: input.exposure,
    phase: input.phase ?? 'instruction',
    cueKeys: entries.map((entry) => entry.cue.key),
    scripts: entries.map((entry) => entry.cue.exactScript),
    entries,
    ready: reasonCodes.every((reason) => reason !== 'selected_side_required' && reason !== 'no_sequence_entries'),
    reasonCodes: unique(reasonCodes),
  };
}

function pushCountdown(entries: MicroCheckVoiceSequenceEntryV21[]): void {
  for (const key of MICRO_CHECK_COUNTDOWN_CUE_KEYS_V21) {
    entries.push(required(logicalCueV21(key)));
  }
}

function required(cue: MicroCheckVoiceLogicalCueV21): MicroCheckVoiceSequenceEntryV21 {
  return { cue, required: true, optional: false };
}

function unique(items: readonly string[]): string[] {
  const out: string[] = [];
  for (const item of items) {
    if (!out.includes(item)) out.push(item);
  }
  return out;
}
