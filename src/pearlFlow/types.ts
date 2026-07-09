import type {
  CheckupType,
  MovementAssessment,
  MovementDomain,
  TrainingPrimaryDomain,
  TrainingFocusStimulusPlanStatus,
  TrainingSessionCompletionType,
} from '../adherence';
import type { CheckUpScore, VersionedCheckUpScoreSnapshot } from '../scoring';
import type {
  DailyReadiness,
  PainArea,
  GeneratedExerciseDose,
  SessionSlotType,
  SessionSource,
  SlotStimulusReason,
  SlotStimulusRole,
  TrainingDomain,
} from '../training/workoutGeneration';
import type {
  DailyTrainingReasonCode,
  NormalizedDailyTrainingContext,
  ProgressionEvidencePolicy,
} from '../training/dailyTrainingContext';
import type { PlannedEquipmentSnapshot } from '../profile';
import type { PlannedMovementCapabilitySnapshot } from '../profile';
import type {
  PlannedExerciseSafetyCueProfile,
  PlannedSafetyCueSnapshot,
} from '../training/safetyCues';
import type { PlannedTrainingReleasePolicySnapshot } from '../exercises';
import type {
  PlannedProgressionPolicySnapshot,
  ProgressionPolicyDiagnosticCode,
  ProgressionPolicySelectionReason,
} from '../exercises';
import type { PlannedCollectionSelection } from '../training/collectionSelection';

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

export interface PearlExercise {
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
  safetyCueProfile?: PlannedExerciseSafetyCueProfile;
}

export type PearlSessionPlanSource = SessionSource | 'legacy_fallback';

export interface PearlSessionPlanMetadata {
  source: PearlSessionPlanSource;
  generatedSessionId?: string;
  templateId?: string;
  plannedDateKey?: string;
  plannedPrimaryDomain?: TrainingPrimaryDomain;
  readiness?: DailyReadiness;
  userAdjustment?: 'shorter' | 'gentler' | 'no_equipment' | 'something_hurts' | null;
  painAreas?: readonly PainArea[];
  dailyContext?: NormalizedDailyTrainingContext;
  progressionEvidencePolicy?: ProgressionEvidencePolicy;
  adjustmentReasons?: readonly DailyTrainingReasonCode[];
  schedule?: PearlSessionScheduleMetadata;
  equipmentSnapshot?: PlannedEquipmentSnapshot;
  movementCapabilitySnapshot?: PlannedMovementCapabilitySnapshot;
  safetyCueSnapshot?: PlannedSafetyCueSnapshot;
  releasePolicySnapshot?: PlannedTrainingReleasePolicySnapshot;
  progressionPolicySnapshot?: PlannedProgressionPolicySnapshot;
  guidance?: readonly string[];
  equipmentNeeded?: readonly string[];
  fallbackReason?: string;
  generatedExercises?: readonly PearlGeneratedExerciseMetadata[];
  slotStimulus?: readonly PearlSlotStimulusMetadata[];
  focusStimulus?: PearlFocusStimulusPlanMetadata;
}

export interface PearlSessionScheduleMetadata {
  policyVersion: number;
  weekIndex: number;
  weekNumber: number;
  weekStartDateKey?: string;
  lapseState?: 'active' | 'resume_gently' | 'restart_recommended';
  nextTemplateId?: string;
}

export interface PearlGeneratedExerciseMetadata {
  exerciseId: string;
  ladderId?: string;
  levelId?: string;
  slotType?: SessionSlotType;
  sets?: number;
  repsPerSet?: number;
  secondsPerSet?: number;
  restSeconds?: number;
  measurementTier?: 'measured' | 'camera_assisted' | 'voice_guided';
  intendedDomain?: TrainingDomain;
  stimulusRole?: SlotStimulusRole;
  stimulusReason?: SlotStimulusReason;
  requestedLevelId?: string;
  storedLevelId?: string;
  selectedDailyLevelId?: string;
  progressionPolicySelectionReason?: ProgressionPolicySelectionReason;
  progressionPolicyDiagnostics?: readonly ProgressionPolicyDiagnosticCode[];
  doseBeforeAdjustment?: GeneratedExerciseDose;
  adjustmentReasons?: readonly DailyTrainingReasonCode[];
  collectionSelection?: PlannedCollectionSelection;
}

export interface PearlSlotStimulusMetadata {
  slotId: string;
  slotType: SessionSlotType;
  slotTitle: string;
  intendedDomain: TrainingDomain;
  role: SlotStimulusRole;
  reason: SlotStimulusReason;
  message: string;
  exerciseId?: string;
  ladderId?: string;
  levelId?: string;
  selectedDomain?: TrainingDomain;
}

export interface PearlFocusStimulusPlanMetadata {
  status: TrainingFocusStimulusPlanStatus;
  mainPlanCreditPotential: boolean;
  blockFocusDomain?: MovementDomain;
  blockFocusTrainingDomain?: TrainingDomain;
  plannedPrimaryDomain?: TrainingPrimaryDomain;
  plannedPrimaryFocusExerciseIds: readonly string[];
  plannedSupportingExerciseIds: readonly string[];
  plannedFallbackExerciseIds: readonly string[];
  plannedCrossDomainExerciseIds: readonly string[];
  fallbackFocusSlotIds: readonly string[];
  skippedFocusSlotIds: readonly string[];
  focusStimulusExclusionReasons: readonly SlotStimulusReason[];
  missingMetadataExerciseIds: readonly string[];
  malformedMetadataExerciseIds: readonly string[];
  focusMismatchExerciseIds: readonly string[];
  mainPlanClassifierReason?: string;
}

export interface PearlSessionPlan {
  id: string;
  blockId: string;
  title: string;
  purposeCopy: string;
  sessionType: TrainingSessionCompletionType;
  estimatedMinutes: number;
  focusDomain: MovementDomain;
  exercises: PearlExercise[];
  metadata?: PearlSessionPlanMetadata;
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
  scoreSnapshot?: VersionedCheckUpScoreSnapshot | null;
  sourceBlockId?: string;
  completedAt?: string;
  status?: MovementAssessment['status'];
  isOfficialForProgress?: boolean;
}
