/**
 * Shared exercise-definition helpers: the autoregulation voice line and three
 * grader factories that bake in the tuned defaults so each family file declares
 * only what actually varies (which joints, thresholds, targets). The defaults
 * mirror the assessment graders (chair-stand hysteresis, balance debounce, ROM
 * EMA) — thresholds are tuned via replay recordings, never guessed in app code.
 */

import { voicePriority } from '../audio/cues';
import { GraderVoice } from '../movements';
import {
  HoldCondition,
  HoldSetGrader,
  RepsSignalSpec,
  RepsSetGrader,
  RomSetGrader,
  RomSignal,
  RomValidTimePredicate,
  TimerSetGrader,
  TimerValidTimePredicate,
} from './setGraders';
import { ExerciseSetGrader } from './types';
import { TimerValidationMode } from './validTime';

export const AUTOREG_VOICE: GraderVoice = {
  cues: ['thats-your-set'],
  priority: voicePriority('thats-your-set'),
};

export interface RepsParams {
  exerciseId: string;
  signal: RepsSignalSpec;
  upEnterDeg: number;
  downEnterDeg: number;
  targetReps: number;
  autoregulate: boolean;
}

export function repsGrader(p: RepsParams): () => ExerciseSetGrader {
  return () =>
    new RepsSetGrader({
      exerciseId: p.exerciseId,
      signal: p.signal,
      upEnterDeg: p.upEnterDeg,
      downEnterDeg: p.downEnterDeg,
      cycleEmaAlpha: 1, // landmarks are already One-Euro'd upstream
      velocityEmaAlpha: 0.3,
      targetReps: p.targetReps,
      autoregulate: p.autoregulate,
      maxReps: 64,
      autoregVoice: AUTOREG_VOICE,
    });
}

export interface HoldParams {
  exerciseId: string;
  condition: HoldCondition;
  targetSec: number;
}

export function holdGrader(p: HoldParams): () => ExerciseSetGrader {
  return () =>
    new HoldSetGrader({
      exerciseId: p.exerciseId,
      condition: p.condition,
      targetSec: p.targetSec,
      singleLegLiftBu: 0.18,
      stepOutBu: 0.55,
      bridgeUpDeg: 150,
      startDebounceFrames: 4,
      endDebounceFrames: 4,
      validTime: true,
    });
}

export function romGrader(
  exerciseId: string,
  signal: RomSignal,
  validTime?: { targetSec: number; predicate: RomValidTimePredicate }
): () => ExerciseSetGrader {
  return () => new RomSetGrader({ exerciseId, signal, emaAlpha: 0.3, validTime });
}

export function timerGrader(
  exerciseId: string,
  targetSec: number,
  validTime?: { validationMode: TimerValidationMode; predicate: TimerValidTimePredicate }
): () => ExerciseSetGrader {
  return () => new TimerSetGrader({ exerciseId, targetSec, validTime });
}
