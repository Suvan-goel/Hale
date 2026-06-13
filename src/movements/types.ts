/**
 * MovementDefinition — the registry pattern. One definition per file: id,
 * display name, camera-view spec, grading config, voice script, progression/
 * regression links, equipment tag, and a grader factory. All grading
 * internals stay module-private; screens are movement-agnostic and adding a
 * movement never touches player code.
 */

import { VoiceCueKey } from '../audio/cues';
import { PipelineFrameOutput } from '../pose/pipeline';

/**
 * Per-movement camera-view spec: which way the user faces and how many
 * reliable side chains (shoulder→hip→knee→ankle) measurement requires —
 * 1 for side-view items (the far limb is occlusion garbage), 2 for
 * front-view bilateral items. Drives the live camera-readiness status.
 */
export interface CameraViewSpec {
  view: 'side' | 'front';
  requiredReliableSideChains: 1 | 2;
}

/** Zero-equipment start: anything beyond these must have a regression. */
export type EquipmentTag = 'none' | 'chair' | 'wall' | 'floor' | 'stair' | 'cushion';

export interface MovementVoiceScript {
  /** Spoken in order once the user is framed, before the countdown. */
  instructions: readonly VoiceCueKey[];
}

export interface MovementResultBase {
  movementId: string;
  /** Machine flags (logged, never user-facing critique). */
  flags: string[];
  /** Tracking interruptions during the active window. */
  interruptions: number;
}

/** Live per-frame surface the player needs; reused object — never retain. */
export interface GraderUpdate {
  /** True only on a frame that credited a rep (drives the rep sound). */
  repCredited: boolean;
  repCount: number;
  /** False while warmup/interruption/missing calibration blocks grading. */
  measuring: boolean;
}

export interface MovementGrader<R extends MovementResultBase = MovementResultBase> {
  /**
   * Feed one pipeline frame during the active window. The grader consumes
   * pipeline events itself (subject-gone ⇒ internal state reset — credited
   * results survive, half-finished reps/holds die). Allocation-free.
   */
  update(out: PipelineFrameOutput): GraderUpdate;
  /** Finalize at the end of the active window. May allocate. */
  finish(timestampMs: number): R;
  /** Back to pristine for a fresh attempt. */
  reset(): void;
}

export interface MovementDefinition<R extends MovementResultBase = MovementResultBase> {
  id: string;
  displayName: string;
  cameraView: CameraViewSpec;
  equipment: readonly EquipmentTag[];
  /** Active measurement window in ms; null = ends on a grader condition. */
  durationMs: number | null;
  voice: MovementVoiceScript;
  /** Registry ids; absent = none defined yet. */
  progressionId?: string;
  regressionId?: string;
  createGrader(): MovementGrader<R>;
  /** Composes the spoken result from bundled lines (e.g. count words). */
  resultCues(result: R): VoiceCueKey[];
}
