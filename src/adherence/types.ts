import type { CheckUpScore, FocusSelectionKind, FocusTieBreakReason, VersionedCheckUpScoreSnapshot } from '../scoring';
import type { ProgressionEvidencePolicy } from '../training/dailyTrainingContext';

export const LOCAL_USER_ID = 'local-device-user';

export type MovementDomain = 'strength_power' | 'balance' | 'mobility';

export type LifeGoalCategory =
  | 'grandchildren'
  | 'stairs'
  | 'travel'
  | 'walking_hiking_sport'
  | 'gardening_hobbies'
  | 'floor_confidence'
  | 'carrying_loads'
  | 'independence'
  | 'noticed_decline'
  | 'custom';

export interface LifeGoal {
  id: string;
  userId: string;
  category: LifeGoalCategory;
  customText?: string;
  createdAt: string;
  updatedAt: string;
  isPrimary: boolean;
}

export type ActivityLevel = 'very_inactive' | 'lightly_active' | 'moderately_active' | 'very_active';

export type AvailableEquipment =
  | 'chair'
  | 'wall'
  | 'stairs'
  | 'resistance_band'
  | 'door_anchor'
  | 'mini_band'
  | 'dumbbells'
  | 'backpack'
  | 'floor_space'
  | 'none';

export type CapabilityConfirmationStatus = 'confirmed' | 'avoid_for_now' | 'not_confirmed';

export type SingleLegBalanceCapabilityStatus =
  | 'confirmed_with_support'
  | 'supported_balance_only'
  | 'not_confirmed';

export interface MovementCapabilityProfile {
  schemaVersion: number;
  floorTransfer: {
    status: CapabilityConfirmationStatus;
  };
  stepUpEnvironment: {
    status: CapabilityConfirmationStatus;
    lowStableStep: boolean;
    fixedSupport: boolean;
    clearDryArea: boolean;
    phoneOutOfPath: boolean;
  };
  singleLegBalance: {
    status: SingleLegBalanceCapabilityStatus;
  };
  revision?: number;
  updatedAt?: string;
}

export interface MovementSafetyProfile {
  id: string;
  userId: string;
  age?: number;
  activityLevel?: ActivityLevel;
  hasCurrentPain?: boolean;
  painNotes?: string;
  hasRecentInjury?: boolean;
  injuryNotes?: string;
  feelsSafeStandingFromChair?: boolean;
  feelsSafeBalancing?: boolean;
  availableEquipment: AvailableEquipment[];
  equipmentStatus?: 'confirmed' | 'needs_confirmation' | 'legacy_migrated' | 'malformed_fail_closed';
  equipmentRevision?: number;
  equipmentUpdatedAt?: string;
  movementCapabilities?: MovementCapabilityProfile;
  preferredWorkoutDays?: string[];
  createdAt: string;
  updatedAt: string;
}

export type MovementBlockStatus = 'active' | 'completed' | 'paused' | 'abandoned';

export interface MovementBlock {
  id: string;
  userId: string;
  lifeGoalId?: string;
  status: MovementBlockStatus;
  startDate: string;
  endDate: string;
  retestDate: string;
  focusDomain: MovementDomain;
  secondaryDomains: MovementDomain[];
  focusSelectionKind?: FocusSelectionKind;
  focusTiedDomains?: MovementDomain[];
  focusTieBreakReason?: FocusTieBreakReason;
  focusNearTieMarginYears?: number;
  focusSelectionPolicyVersion?: number;
  sessionsPerWeekTarget: number;
  totalPlannedSessions: number;
  completedSessions: number;
  microChecksCompleted: number;
  sourceCheckUpId?: string;
  /** @deprecated Legacy persisted name. Use sourceCheckUpId. */
  sourceAssessmentId?: string;
  createdAt: string;
  updatedAt: string;
}

export type CheckupType =
  | 'baseline'
  | 'baseline_retake'
  | 'manual_extra'
  | 'official_retest'
  | 'quick_recheck'
  | 'micro_check'
  | 'legacy_unknown';

export type CheckupStatus = 'not_started' | 'in_progress' | 'completed' | 'incomplete' | 'invalid' | 'cancelled';

export interface MovementAssessment {
  id: string;
  userId: string;
  type: CheckupType;
  status: CheckupStatus;
  createdAt: string;
  completedAt?: string;
  sourceBlockId?: string;
  results?: {
    strengthPowerScore?: number;
    balanceScore?: number;
    mobilityScore?: number;
    weakestDomain?: MovementDomain;
    confidence?: 'low' | 'medium' | 'high';
    notes?: string;
    rawMetrics?: Record<string, unknown>;
  };
  isOfficialForProgress: boolean;
}

export type TrainingSessionCompletionType =
  | 'standard'
  | 'starter'
  | 'restart'
  | 'micro_check'
  | 'retest_prep'
  | 'retest';

export type TrainingSessionCompletionSource = 'block_generated' | 'preset' | 'manual' | 'legacy_fallback';

export type TrainingSessionScheduleCreditDenialReason =
  | 'missing_block'
  | 'invalid_current_date'
  | 'invalid_block_start_date'
  | 'missing_required_templates'
  | 'main_plan_rejected'
  | 'malformed_completion_date'
  | 'future_completion'
  | 'pre_block_completion'
  | 'daily_credit_already_used'
  | 'template_already_credited_for_week'
  | 'week_locked_until_next_start'
  | 'block_training_already_complete'
  | 'duplicate_event';

export interface TrainingSessionScheduleCreditSummary {
  policyVersion: number;
  credited: boolean;
  status: 'credited' | 'denied' | 'not_applicable';
  reason?: TrainingSessionScheduleCreditDenialReason;
  weekIndex?: number;
  weekNumber?: number;
  dateKey?: string;
  templateId?: string;
  creditId?: string;
}

export interface TrainingSessionWorkEvidenceSummary {
  plannedExerciseCount: number;
  resultItemCount: number;
  completedExerciseCount: number;
  skippedExerciseCount: number;
  missingResultCount: number;
  duplicateResultCount: number;
  malformedResultCount: number;
  unmatchedResultCount: number;
}

export type TrainingFocusStimulusPlanStatus =
  | 'eligible'
  | 'not_main_plan'
  | 'missing_block_focus'
  | 'missing_stimulus_metadata'
  | 'focus_mismatch'
  | 'no_primary_focus_planned';

export type TrainingFocusStimulusCompletionStatus =
  | 'credited_focus_work'
  | 'not_main_plan'
  | 'missing_block_focus'
  | 'missing_stimulus_metadata'
  | 'focus_mismatch'
  | 'no_primary_focus_planned'
  | 'no_completed_work'
  | 'primary_focus_not_completed';

export type TrainingFocusStimulusCreditExclusionReason =
  | 'none'
  | 'not_main_plan'
  | 'missing_block_focus'
  | 'missing_stimulus_metadata'
  | 'focus_mismatch'
  | 'no_primary_focus_planned'
  | 'no_completed_work'
  | 'supporting_only'
  | 'fallback_only'
  | 'supporting_and_fallback_only'
  | 'cross_domain_only'
  | 'primary_focus_not_completed';

export interface TrainingFocusStimulusEvidenceSummary {
  planStatus: TrainingFocusStimulusPlanStatus;
  status: TrainingFocusStimulusCompletionStatus;
  exclusionReason: TrainingFocusStimulusCreditExclusionReason;
  mainPlanCredit: boolean;
  blockFocusDomain?: MovementDomain;
  plannedPrimaryFocusExerciseCount: number;
  completedPrimaryFocusExerciseCount: number;
  completedSupportingExerciseCount: number;
  completedFallbackExerciseCount: number;
  completedCrossDomainExerciseCount: number;
  plannedPrimaryFocusExerciseIds: string[];
  completedPrimaryFocusExerciseIds: string[];
  completedSupportingExerciseIds: string[];
  completedFallbackExerciseIds: string[];
  completedCrossDomainExerciseIds: string[];
  fallbackFocusSlotIds: string[];
  skippedFocusSlotIds: string[];
  focusStimulusExclusionReasons: string[];
  missingMetadataExerciseIds: string[];
  malformedMetadataExerciseIds: string[];
  focusMismatchExerciseIds: string[];
  mainPlanClassifierReason?: string;
}

export interface TrainingSessionCompletion {
  id: string;
  userId: string;
  blockId: string;
  plannedDate?: string;
  completedAt: string;
  sessionType: TrainingSessionCompletionType;
  focusDomain?: MovementDomain;
  source?: TrainingSessionCompletionSource;
  templateId?: string;
  mainPlanCredit?: boolean;
  scheduleCredit?: TrainingSessionScheduleCreditSummary;
  workEvidence?: TrainingSessionWorkEvidenceSummary;
  focusStimulusEvidence?: TrainingFocusStimulusEvidenceSummary;
  progressionEvidencePolicy?: ProgressionEvidencePolicy;
  durationMinutes?: number;
  perceivedEffort?: 1 | 2 | 3 | 4 | 5;
  painReported?: boolean;
  notes?: string;
}

export interface MovementBlockReport {
  id: string;
  userId: string;
  blockId: string;
  baselineAssessmentId?: string;
  retestAssessmentId?: string;
  createdAt: string;
  summary: string;
  sessionsCompleted: number;
  totalPlannedSessions: number;
  microChecksCompleted: number;
  domainChanges?: Partial<
    Record<
      MovementDomain,
      {
        previous?: number;
        current?: number;
        direction: 'recorded_lower' | 'similar' | 'recorded_higher' | 'unknown';
      }
    >
  >;
  comparison?: {
    status:
      | 'compatible'
      | 'legacy_unversioned'
      | 'incompatible_version'
      | 'missing_snapshot'
      | 'invalid_snapshot'
      | 'unsupported_schema';
    startCheckUpId?: string;
    endCheckUpId?: string;
    startSnapshot?: {
      schemaVersion: number | null;
      scoringVersion: number | null;
      normVersion: number | null;
    };
    endSnapshot?: {
      schemaVersion: number | null;
      scoringVersion: number | null;
      normVersion: number | null;
    };
  };
  recommendedNextFocusDomain?: MovementDomain;
}

export type AdherenceState =
  | 'no_block'
  | 'on_track'
  | 'slightly_behind'
  | 'missed_one_session'
  | 'inactive_this_week'
  | 'inactive_14_days'
  | 'ready_for_retest'
  | 'block_complete';

export type IdentityMilestoneType =
  | 'first_block_started'
  | 'first_week_completed'
  | 'first_restart'
  | 'block_completed'
  | 'retest_completed'
  | 'domain_recorded_lower'
  | 'domain_similar'
  | 'younger_than_age_band'
  | 'goal_supported';

export interface IdentityMilestone {
  id: string;
  userId: string;
  blockId?: string;
  type: IdentityMilestoneType;
  title: string;
  body: string;
  createdAt: string;
  seenAt?: string;
}

export type SupportRelationshipType =
  | 'spouse_partner'
  | 'adult_child'
  | 'sibling'
  | 'friend'
  | 'training_buddy'
  | 'other';

export type SharingLevel = 'private' | 'completion_only' | 'progress_summary' | 'detailed';

export type SupportConnectionStatus = 'pending' | 'accepted' | 'declined' | 'removed';

export interface SupportConnection {
  id: string;
  userId: string;
  supporterUserId?: string;
  inviteEmailOrPhone?: string;
  relationshipType: SupportRelationshipType;
  status: SupportConnectionStatus;
  sharingLevel: SharingLevel;
  notifyOnMissedWeek: boolean;
  notifyOnMilestones: boolean;
  createdAt: string;
  updatedAt: string;
}

export type NotificationEventType =
  | 'planned_session'
  | 'weekly_micro_check'
  | 'retest_approaching'
  | 'supporter_milestone'
  | 'missed_week_support'
  | 'lapse_recovery';

export interface NotificationEvent {
  id: string;
  userId: string;
  blockId?: string;
  supportConnectionId?: string;
  type: NotificationEventType;
  dedupeKey: string;
  createdAt: string;
  deliveredAt?: string;
}

export interface WeeklySummary {
  id: string;
  userId: string;
  blockId: string;
  weekNumber: number;
  weekStart: string;
  weekEnd: string;
  sessionsCompleted: number;
  microCheckCompleted: boolean;
  title: string;
  body: string;
  nextFocus: string;
  createdAt: string;
}

export interface AdherenceStoreState {
  blocks: MovementBlock[];
  assessments: MovementAssessment[];
  reports: MovementBlockReport[];
  completions: TrainingSessionCompletion[];
  milestones: IdentityMilestone[];
  supportConnections: SupportConnection[];
  notificationEvents: NotificationEvent[];
  weeklySummaries: WeeklySummary[];
}

export interface AssessmentForBlock {
  score: CheckUpScore;
  scoreSnapshot?: VersionedCheckUpScoreSnapshot | null;
  sourceCheckUpId?: string;
  /** @deprecated Legacy alias for sourceCheckUpId. */
  id?: string;
  assessment?: MovementAssessment | null;
}

export interface LifeGoalTrainingRelevance {
  primaryDomains: MovementDomain[];
  copy: string;
}
