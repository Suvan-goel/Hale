import type { SfxCueKey } from './cues';

export type MeasurementTrackingSfxState = 'idle' | 'active' | 'paused';

export interface MeasurementTrackingSfxInput {
  readonly measurementActive: boolean;
  readonly trackingOk: boolean;
}

export interface MeasurementTrackingSfxUpdate {
  readonly state: MeasurementTrackingSfxState;
  readonly cue: Extract<SfxCueKey, 'tracking-paused' | 'tracking-recovered'> | null;
}

export function nextMeasurementTrackingSfxState(
  previous: MeasurementTrackingSfxState,
  input: MeasurementTrackingSfxInput
): MeasurementTrackingSfxUpdate {
  if (!input.measurementActive) {
    return { state: 'idle', cue: null };
  }

  if (input.trackingOk) {
    return {
      state: 'active',
      cue: previous === 'paused' ? 'tracking-recovered' : null,
    };
  }

  if (previous !== 'active') {
    return { state: previous === 'paused' ? 'paused' : 'idle', cue: null };
  }

  return {
    state: 'paused',
    cue: 'tracking-paused',
  };
}
