import type {
  TrainingFocusStimulusEvidenceSummary,
  TrainingPrimaryDomain,
  TrainingSessionScheduleCreditSummary,
  TrainingSessionCompletionSource,
  TrainingSessionCompletionType,
  TrainingSessionWorkEvidenceSummary,
} from '../adherence';
import type {
  DailyReadiness,
  GeneratedExerciseDose,
  LadderProgress,
  PainArea,
  SessionSlotType,
  SessionSource,
  TrackingQuality,
  TrainingDomain,
  SlotStimulusReason,
  SlotStimulusRole,
} from './workoutGeneration';
import type {
  DailyTrainingReasonCode,
  NormalizedDailyTrainingContext,
  ProgressionEvidencePolicy,
} from './dailyTrainingContext';
import type { PlannedEquipmentSnapshot } from '../profile/equipment';
import type { PlannedMovementCapabilitySnapshot } from '../profile/movementCapabilities';
import type {
  PlannedProgressionPolicySnapshot,
  ProgressionPolicyDiagnosticCode,
  ProgressionPolicySelectionReason,
} from '../exercises';
import type { PlannedCollectionSelection } from './collectionSelection';

export type PersistedSessionSource = SessionSource | 'legacy';

export interface PersistedGeneratedExerciseSummary {
  exerciseId: string;
  ladderId?: string;
  levelId?: string;
  slotType?: SessionSlotType;
  sets?: number;
  repsPerSet?: number;
  secondsPerSet?: number;
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

export interface PersistedPostSessionFeedback {
  sessionId?: string;
  rpe?: 1 | 2 | 3 | 4 | 5;
  discomfort?: boolean;
  painArea?: PainArea;
  completed?: boolean;
  trackingQuality?: TrackingQuality;
  submittedAt: string;
}

export interface PersistedGeneratedSessionSummary {
  id: string;
  blockId?: string;
  source: PersistedSessionSource;
  templateId?: string;
  plannedDateKey?: string;
  plannedPrimaryDomain?: TrainingPrimaryDomain;
  sessionType?: TrainingSessionCompletionType;
  completionSource?: TrainingSessionCompletionSource;
  status?: 'completed' | 'partial' | 'skipped';
  mainPlanCredit?: boolean;
  scheduleCredit?: TrainingSessionScheduleCreditSummary;
  workEvidence?: TrainingSessionWorkEvidenceSummary;
  focusStimulusEvidence?: TrainingFocusStimulusEvidenceSummary;
  title: string;
  focus?: TrainingDomain | string;
  generatedAt?: string;
  completedAt?: string;
  exerciseIds: string[];
  ladderIds?: string[];
  readiness?: DailyReadiness;
  painArea?: PainArea;
  dailyContext?: NormalizedDailyTrainingContext;
  progressionEvidencePolicy?: ProgressionEvidencePolicy;
  adjustmentReasons?: readonly DailyTrainingReasonCode[];
  durationMinutes?: number;
  equipmentSnapshot?: PlannedEquipmentSnapshot;
  movementCapabilitySnapshot?: PlannedMovementCapabilitySnapshot;
  progressionPolicySnapshot?: PlannedProgressionPolicySnapshot;
  exercises?: PersistedGeneratedExerciseSummary[];
  feedback?: PersistedPostSessionFeedback;
}

export const MAX_GENERATED_SESSION_SUMMARIES = 50;
export const MAX_APPLIED_PROGRESSION_EVENT_IDS = 200;

export function upsertGeneratedSessionSummary(
  summaries: readonly PersistedGeneratedSessionSummary[],
  summary: PersistedGeneratedSessionSummary
): PersistedGeneratedSessionSummary[] {
  const withoutExisting = summaries.filter((item) => item.id !== summary.id);
  return [...withoutExisting, summary].slice(-MAX_GENERATED_SESSION_SUMMARIES);
}

export function emptyLadderProgress(): Record<string, LadderProgress> {
  return {};
}

export function normalizeAppliedProgressionEventIds(ids: readonly string[] | null | undefined): string[] {
  const out: string[] = [];
  for (const id of ids ?? []) {
    if (typeof id !== 'string') continue;
    const trimmed = id.trim();
    if (!trimmed || out.includes(trimmed)) continue;
    out.push(trimmed);
  }
  return out.slice(-MAX_APPLIED_PROGRESSION_EVENT_IDS);
}

export function appendAppliedProgressionEventId(ids: readonly string[], id: string): string[] {
  return normalizeAppliedProgressionEventIds([...ids, id]);
}
