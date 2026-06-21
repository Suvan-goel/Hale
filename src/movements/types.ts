/**
 * MovementDefinition — the registry pattern. One definition per file: id,
 * display name, camera-view spec, grading config, voice script, progression/
 * regression links, equipment tag, and a grader factory. All grading
 * internals stay module-private; screens are movement-agnostic and adding a
 * movement never touches player code.
 */

import { VoiceCueKey } from '../audio/cues';
import { PipelineFrameOutput } from '../pose/pipeline';
import type { ValidTimeResult } from '../exercises/validTime';

/**
 * Per-movement camera-view spec: which way the user faces and how many
 * reliable side chains (shoulder→hip→knee→ankle) measurement requires —
 * 1 for side-view items (the far limb is occlusion garbage), 2 for
 * front-view bilateral items. Drives the live camera-readiness status.
 */
export interface CameraViewSpec {
  view: 'side' | 'front' | 'side_oblique' | 'not_required';
  requiredReliableSideChains: 1 | 2;
}

/**
 * Zero-equipment start: anything beyond 'none' must have a regression,
 * substitute, or explicit skip path. Safety-sensitive tags such as floor,
 * stair, and counter/support are gated by the user's local equipment profile.
 */
export type EquipmentTag =
  | 'none'
  | 'chair'
  | 'cushion'
  | 'wall'
  | 'counter'
  | 'floor'
  | 'stair'
  | 'band'
  | 'long_band'
  | 'mini_band'
  | 'door_anchor'
  | 'backpack_or_weight';

export interface MovementVoiceScript {
  /** Spoken in order once the user is framed, before the countdown. */
  instructions: readonly VoiceCueKey[];
  /**
   * Spoken when the active window closes (clock or grader-termination),
   * before the result sentence. Chair stand uses 'times-up' ("Time! Have a
   * seat…"); omit for items where no closing line reads naturally.
   */
  endCue?: VoiceCueKey;
}

/** A voice line (or stitched sequence) a grader wants spoken mid-activity. */
export interface GraderVoice {
  cues: VoiceCueKey[];
  priority: number;
}

export interface MovementResultBase {
  movementId: string;
  /** Machine flags (logged, never user-facing critique). */
  flags: string[];
  /** Tracking interruptions during the active window. */
  interruptions: number;
  /** Optional valid active-time metadata for gated capture windows. */
  validTime?: ValidTimeResult;
}

/** Live per-frame surface the player needs; reused object — never retain. */
export interface GraderUpdate {
  /** True only on a frame that credited a rep (drives the rep sound). */
  repCredited: boolean;
  repCount: number;
  /** False while warmup/interruption/missing calibration blocks grading. */
  measuring: boolean;
  /**
   * Grader-terminated items (balance ladder, TUG): true once the item has
   * finished and the active window should close. Fixed-duration items
   * (chair stand, ROM holds) leave this false — the controller's clock ends
   * them.
   */
  complete: boolean;
  /**
   * A voice line the grader wants spoken THIS frame (balance stage cues,
   * eyes-closed prompts); null on almost every frame. Reused object — the
   * controller relays it synchronously.
   */
  voice: GraderVoice | null;
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
