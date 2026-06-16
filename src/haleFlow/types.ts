import type {
  CheckupType,
  LifeGoal,
  MovementAssessment,
  MovementBlock,
  MovementBlockReport,
  MovementDomain,
  MovementSafetyProfile,
  TrainingSessionCompletion,
  TrainingSessionCompletionType,
} from '../adherence';
import type { CheckUpScore } from '../scoring';
import type { DailyReadiness, PainArea, SessionSlotType, SessionSource } from '../training/workoutGeneration';

export type HaleUserFlowState =
  | 'needs_life_goal'
  | 'needs_profile_safety'
  | 'needs_camera_setup'
  | 'needs_baseline_checkup'
  | 'baseline_checkup_incomplete'
  | 'baseline_checkup_invalid'
  | 'baseline_complete_needs_block'
  | 'active_block_session_due'
  | 'active_block_micro_check_due'
  | 'active_block_on_track'
  | 'active_block_slightly_behind'
  | 'active_block_restart_needed'
  | 'active_block_retest_due'
  | 'block_complete_needs_report'
  | 'report_ready'
  | 'needs_next_block'
  | 'no_active_block';

export interface HaleUserLike {
  id?: string;
}

export interface HaleProfileLike {
  age?: number | null;
  safetyProfile?: MovementSafetyProfile | null;
}

export interface NextBestActionInput {
  user?: HaleUserLike | null;
  profile?: HaleProfileLike | null;
  lifeGoal?: LifeGoal | null;
  latestAssessment?: MovementAssessment | null;
  activeBlock?: MovementBlock | null;
  sessionCompletions?: readonly TrainingSessionCompletion[];
  microChecks?: readonly unknown[];
  latestReport?: MovementBlockReport | null;
  now?: string | Date;
}

export interface NextBestAction {
  state: HaleUserFlowState;
  title: string;
  body: string;
  primaryCta: string;
  primaryRoute: string;
  secondaryCta?: string;
  secondaryRoute?: string;
}

export type ExerciseFamily =
  | 'sit_to_stand'
  | 'squat'
  | 'step_up'
  | 'hinge'
  | 'glute_bridge'
  | 'calf_raise'
  | 'tandem_balance'
  | 'single_leg_balance'
  | 'weight_shift'
  | 'reaction_step'
  | 'push'
  | 'row'
  | 'shoulder_mobility'
  | 'hip_mobility'
  | 'ankle_mobility'
  | 'thoracic_mobility'
  | 'floor_rise';

export interface HaleExercise {
  id: string;
  ladderId?: string;
  ladderTitle?: string;
  family: ExerciseFamily;
  name: string;
  domain: MovementDomain;
  level: number;
  releaseStatus?: 'v1_core' | 'v1_optional' | 'post_v1_beta' | 'hidden_legacy';
  measurementTier?: 'measured' | 'camera_assisted' | 'voice_guided';
  cameraView?: 'side' | 'front' | 'side_oblique' | 'not_required';
  instructions?: string;
  whyItMatters?: string;
  durationSeconds?: number;
  targetReps?: number;
  targetSets?: number;
  estimatedMinutes?: number;
  requiresEquipment?: string[];
  rationale?: string;
  safetyNotes?: string[];
}

export type HaleSessionPlanSource = SessionSource | 'legacy_fallback';

export interface HaleSessionPlanMetadata {
  source: HaleSessionPlanSource;
  generatedSessionId?: string;
  templateId?: string;
  plannedDateKey?: string;
  readiness?: DailyReadiness;
  painAreas?: readonly PainArea[];
  guidance?: readonly string[];
  equipmentNeeded?: readonly string[];
  fallbackReason?: string;
  generatedExercises?: readonly HaleGeneratedExerciseMetadata[];
}

export interface HaleGeneratedExerciseMetadata {
  exerciseId: string;
  ladderId?: string;
  levelId?: string;
  slotType?: SessionSlotType;
  sets?: number;
  repsPerSet?: number;
  secondsPerSet?: number;
  measurementTier?: 'measured' | 'camera_assisted' | 'voice_guided';
}

export interface HaleSessionPlan {
  id: string;
  blockId: string;
  title: string;
  purposeCopy: string;
  sessionType: TrainingSessionCompletionType;
  estimatedMinutes: number;
  focusDomain: MovementDomain;
  exercises: HaleExercise[];
  metadata?: HaleSessionPlanMetadata;
}

export interface MicroCheckDefinition {
  type: 'chair-power' | 'single-leg-balance' | 'mobility-reach';
  domain: MovementDomain;
  title: string;
  body: string;
  estimatedSeconds: number;
}

export interface CreateAssessmentInput {
  userId?: string;
  checkUpId: string;
  type: CheckupType;
  score?: CheckUpScore | null;
  sourceBlockId?: string;
  completedAt?: string;
  status?: MovementAssessment['status'];
  isOfficialForProgress?: boolean;
}
