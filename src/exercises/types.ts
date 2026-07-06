/**
 * ExerciseDefinition — the training-side registry pattern, parallel to the
 * assessment MovementDefinition (src/movements/types.ts). Training items differ
 * structurally from one-shot assessments: they run MULTIPLE SETS with spoken
 * rest, support velocity AUTOREGULATION (ending a set early when power fades),
 * and live on a PROGRESSION LADDER (linked levels). So they get their own
 * definition + registry while REUSING the four grading primitives and the
 * shared CameraViewSpec / EquipmentTag / GraderVoice types.
 *
 * As with movements, every grading internal stays module-private; the session
 * player is exercise-agnostic and adding an exercise never touches player code.
 */

import { VoiceCueKey } from '../audio/cues';
import { CameraViewSpec, EquipmentTag, GraderVoice } from '../movements';
import { PipelineFrameOutput } from '../pose/pipeline';
import type { ValidTimeResult, ValidTimeState } from './validTime';

/**
 * Block-template slots. A 4-week block is built from these (lower-push, hinge,
 * upper-push, pull-or-reach, balance, a power/functional finisher, two mobility
 * cooldowns); the block stores slots and the player resolves slot → the user's
 * current level at launch, so progression stays live across the block.
 */
export type TrainingSlot =
  | 'lower-push'
  | 'hinge'
  | 'upper-push'
  | 'pull-reach'
  | 'balance'
  | 'power'
  | 'mobility';

/** How a set is graded — maps to which primitive the set grader wraps. */
export type ExerciseKind = 'reps' | 'hold' | 'rom' | 'timer';

export type MeasurementTier = 'measured' | 'camera_assisted' | 'voice_guided';

export type ReleaseStatus = 'v1_core' | 'v1_optional' | 'post_v1_beta' | 'hidden_legacy';

export type ExerciseDomain = 'strength_power' | 'balance_stability' | 'mobility_flexibility';

export interface ExercisePrescription {
  sets: number;
  /** reps kind: target reps per set (the set ends at target or autoregulation). */
  repsPerSet?: number;
  /** hold kind: target hold seconds per set. */
  holdSec?: number;
  /** rom kind: fixed capture-window seconds per set (the player's clock ends it). */
  captureSec?: number;
  /** timer kind: simple completion window for voice-guided or lightly camera-assisted work. */
  timerSec?: number;
  /** Spoken rest between sets (and before the next item). */
  restSec: number;
  /** Velocity autoregulation applies (rep-based strength items only). */
  autoregulate: boolean;
}

export interface ExerciseVoiceScript {
  /** Spoken once the user is framed, before the first set's countdown. */
  instructions: readonly VoiceCueKey[];
}

/** One set's graded outcome — the unit the progression engine reasons over. */
export interface SetResult {
  exerciseId: string;
  /** Reps credited (reps kind); 0 for hold/rom. */
  reps: number;
  /** Session-mean concentric velocity, body units/sec (reps kind); NaN otherwise. */
  meanVel: number;
  /** Maintained-hold duration, seconds (hold kind); NaN otherwise. */
  holdSec: number;
  /** Peak ROM value — degrees or body units (rom kind); NaN otherwise. */
  romPeak: number;
  /** The set ended because velocity autoregulation fired (a NORMAL completion). */
  autoregulated: boolean;
  /** Reached the prescribed rep/hold target (full effort, not cut short early). */
  reachedTarget: boolean;
  interruptions: number;
  flags: string[];
  /**
   * Voice-guided sessions only (TDD-ADDENDUM §1.4, type-level split N5):
   * the prescribed rep target the user confirmed with "done" — REPORTED, not
   * measured. Voice-guided sets keep `reps` at 0 and `meanVel` NaN so nothing
   * reading the measured fields can ever mistake reported effort for
   * measurement. Absent on all camera-graded sets.
   */
  reportedReps?: number;
  /** User correction applied on the rest screen (delta vs reportedReps). */
  repsAdjusted?: number;
  /** Optional Phase 1 valid active-time metadata. Absent for legacy/rep sets. */
  validTime?: ValidTimeResult;
  /** Optional FD-005 step-up lead-leg alternation metadata. Absent for legacy/other sets. */
  stepUpAlternation?: {
    setIndex: number;
    startLeadSide: 'left' | 'right';
    targetTotalReps: number;
    acceptedRepCount: number;
    leftLeadRepCount: number;
    rightLeadRepCount: number;
    alternationValid: boolean;
    completedTarget: boolean;
  };
}

/** Live per-frame surface the player needs; reused object — never retain. */
export interface SetGraderUpdate {
  /** True only on a frame that credited a rep (drives the rep sound). */
  repCredited: boolean;
  repCount: number;
  /** False while warmup/interruption/missing calibration blocks grading. */
  measuring: boolean;
  /** Running maintained-hold duration in ms (hold kind); 0 otherwise. */
  holdMs: number;
  /** Grader-owned valid time remaining in ms; NaN/undefined when not applicable. */
  remainingMs?: number;
  /** Current valid-time state for supportive UI captions; null/undefined outside valid-time sets. */
  validTimeState?: ValidTimeState | null;
  validTimeCaption?: string | null;
  /** Velocity dropped >25% below the set's best for 2 consecutive reps. */
  autoregulationStop: boolean;
  /**
   * The set's own termination fired (rep target reached, hold complete, or
   * autoregulation). Like grader-terminated movements, rom sets leave this
   * false — the player's capture clock ends them.
   */
  complete: boolean;
  /** A voice line the grader wants spoken this frame; null on almost every frame. */
  voice: GraderVoice | null;
}

export interface ExerciseSetGrader {
  /** Feed one pipeline frame during a set's active window. Allocation-free. */
  update(out: PipelineFrameOutput): SetGraderUpdate;
  /** Finalize one set. May allocate. */
  finish(timestampMs: number): SetResult;
  /** Back to pristine for the next set. */
  reset(): void;
}

export interface ExerciseDefinition {
  id: string;
  displayName: string;
  /** Progression family key — level tracking and slot resolution key on this. */
  family: string;
  /** Ordinal within the family (1 = easiest registered level). */
  level: number;
  slot: TrainingSlot;
  cameraView: CameraViewSpec;
  /** What THIS variant needs; a variant beyond the user's profile is substituted. */
  equipment: readonly EquipmentTag[];
  kind: ExerciseKind;
  /** Optional set timing override. Omitted means current player-owned defaults. */
  timing?: { mode: 'player_clock' | 'valid_time' };
  prescription: ExercisePrescription;
  voice: ExerciseVoiceScript;
  /** Registry id of the next harder level (absent at the top of the ladder). */
  progressionId?: string;
  /** Registry id of the next easier level (absent at the bottom). */
  regressionId?: string;
  /** Zero-equipment swap when the required equipment is missing (e.g. step-up → STS tempo). */
  substituteId?: string;
  createGrader(): ExerciseSetGrader;
}
