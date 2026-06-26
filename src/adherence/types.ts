import type { CheckUpScore, FocusSelectionKind, FocusTieBreakReason, VersionedCheckUpScoreSnapshot } from '../scoring';
import type { ProgressionEvidencePolicy } from '../training/dailyTrainingContext';

export const LOCAL_USER_ID = 'local-device-user';

export type MovementDomain = 'strength_power' | 'balance' | 'mobility';
export type TrainingPrimaryDomain = 'strength_power' | 'balance_stability' | 'mobility_flexibility';

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

export type AgeBand = 'under_45' | '45_54' | '55_64' | '65_74' | '75_plus';

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
  /** Exact age when known, or an age-band representative used only for broad recovery tuning. */
  age?: number;
  /** Age range selected during onboarding, stored separately from exact profile age. */
  ageBand?: AgeBand;
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

export type MovementBlockSourceCheckUpType = 'baseline' | 'baseline_retake' | 'official_retest';

export type MovementBlockOrigin =
  | {
      kind: 'legacy_v1_assessment';
      assessmentId?: string;
      sourceCheckUpId?: string;
    }
  | {
      kind: 'movement_profile_v2_assessment';
      assessmentId: string;
      assessmentFingerprint: string;
      snapshotId: string;
      snapshotFingerprint: string;
      sourceCheckUpId: string;
      sourceCheckUpType: MovementBlockSourceCheckUpType;
      focusPolicyVersion: number;
      focusPolicyFingerprint: string;
    };

export type MovementBlockFocus =
  | {
      kind: 'domain';
      domain: MovementDomain;
    }
  | {
      kind: 'balanced';
      balancedPolicyVersion: number;
      balancedPolicyFingerprint: string;
    };

export interface MovementBlock {
  id: string;
  userId: string;
  lifeGoalId?: string;
  status: MovementBlockStatus;
  startDate: string;
  endDate: string;
  retestDate: string;
  focusDomain?: MovementDomain;
  focus?: MovementBlockFocus;
  origin?: MovementBlockOrigin;
  blockFingerprint?: string;
  blockCreationPolicyVersion?: number;
  blockCreationPolicyFingerprint?: string;
  templatePolicyVersion?: number;
  templatePolicyFingerprint?: string;
  templateIds?: string[];
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
  | 'manual_extra_v2'
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

export type TrainingMicroCheckType = 'chair-power' | 'single-leg-balance' | 'mobility-reach';
export type TrainingMicroCheckTargetSource = 'domain_focus' | 'balanced_schedule_rotation';

export interface TrainingMicroCheckSlotMetadata {
  slotId: string;
  policyVersion: number;
  policyFingerprint: string;
  targetSource: TrainingMicroCheckTargetSource;
  targetDomain: MovementDomain;
  microCheckType: TrainingMicroCheckType;
  scheduleWeekIndex: number;
  scheduleWeekNumber: number;
}

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
  plannedPrimaryDomain?: TrainingPrimaryDomain;
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
  plannedPrimaryDomain?: TrainingPrimaryDomain;
  source?: TrainingSessionCompletionSource;
  templateId?: string;
  mainPlanCredit?: boolean;
  scheduleCredit?: TrainingSessionScheduleCreditSummary;
  workEvidence?: TrainingSessionWorkEvidenceSummary;
  focusStimulusEvidence?: TrainingFocusStimulusEvidenceSummary;
  progressionEvidencePolicy?: ProgressionEvidencePolicy;
  microCheckSlot?: TrainingMicroCheckSlotMetadata;
  durationMinutes?: number;
  perceivedEffort?: 1 | 2 | 3 | 4 | 5;
  painReported?: boolean;
  notes?: string;
}

export type MovementProfileV2ComparisonUnit = 'reps' | 'seconds' | 'degrees';

export type MovementProfileV2RetestComparisonDomain =
  | {
      status: 'raw_comparable';
      previousValue: number;
      currentValue: number;
      unit: MovementProfileV2ComparisonUnit;
      metricLabel: string;
      referenceComparable: boolean;
      previousInterpretation?: string;
      currentInterpretation?: string;
      reasonCodes: readonly string[];
    }
  | {
      status: 'shown_separately';
      previousValue?: number;
      currentValue?: number;
      unit: MovementProfileV2ComparisonUnit;
      metricLabel: string;
      reasonCodes: readonly string[];
      note: string;
    }
  | {
      status: 'unavailable';
      metricLabel: string;
      reasonCodes: readonly string[];
      note: string;
    };

export interface MovementProfileV2RetestComparison {
  kind: 'movement_profile_v2_retest_comparison';
  schemaVersion: 1;
  status?: never;
  startCheckUpId?: never;
  endCheckUpId?: never;
  startSnapshot?: never;
  endSnapshot?: never;
  comparisonPolicyVersion: number;
  comparisonPolicyFingerprint: string;
  comparisonId: string;
  comparisonFingerprint: string;
  prior: {
    checkUpId: string;
    snapshotId: string;
    snapshotFingerprint: string;
    assessmentId: string;
    assessmentFingerprint: string;
    completedAt: string;
  };
  current: {
    checkUpId: string;
    snapshotId: string;
    snapshotFingerprint: string;
    assessmentId: string;
    assessmentFingerprint: string;
    completedAt: string;
  };
  domains: {
    strength_power: MovementProfileV2RetestComparisonDomain;
    balance: MovementProfileV2RetestComparisonDomain;
    mobility: MovementProfileV2RetestComparisonDomain;
  };
  overallStatus: 'comparable' | 'partially_comparable' | 'not_comparable';
}

export interface MovementProfileV2BlockReportScheduleSummary {
  trainingWeeks: 4;
  scheduleCredits: number;
  firstCreditedDateKey?: string;
  finalCreditedDateKey?: string;
  blockStartDate: string;
  retestEligibilityDateKey?: string;
}

interface MovementBlockReportBase {
  id: string;
  userId: string;
  blockId: string;
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
}

export interface LegacyV1MovementBlockReport extends MovementBlockReportBase {
  kind?: 'legacy_v1_block_report';
  baselineAssessmentId?: string;
  retestAssessmentId?: string;
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
  measurementComparability?: {
    status: 'not_evaluated' | 'compatible' | 'suppressed';
    suppressedDomains?: MovementDomain[];
    reason?: 'side_or_protocol_metadata_insufficient';
  };
  recommendedNextFocusDomain?: MovementDomain;
}

export interface MovementProfileV2BlockReport extends MovementBlockReportBase {
  kind: 'movement_profile_v2_block_report';
  schemaVersion: 1;
  reportPolicyVersion: number;
  reportPolicyFingerprint: string;
  reportFingerprint: string;
  priorBlock: {
    blockId: string;
    blockFingerprint?: string;
    focus: MovementBlockFocus;
  };
  prior: MovementProfileV2RetestComparison['prior'];
  current: MovementProfileV2RetestComparison['current'];
  comparison: MovementProfileV2RetestComparison;
  scheduleSummary: MovementProfileV2BlockReportScheduleSummary;
  priorSuggestedFocus: MovementBlockFocus;
  currentSuggestedFocus: MovementBlockFocus;
  nextBlock: {
    blockId: string;
    blockFingerprint?: string;
    focus: MovementBlockFocus;
  };
  displayCopy: {
    headline: 'Your 4-week block is complete';
    body: string;
    nextPlanTitle: 'Your next 4-week plan is ready';
    nextPlanBody: string;
    nextPlanCta: 'View my next 4-week plan';
  };
  baselineAssessmentId?: string;
  retestAssessmentId?: string;
  recommendedNextFocusDomain?: MovementDomain;
}

export type MovementBlockReport = LegacyV1MovementBlockReport | MovementProfileV2BlockReport;

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

export interface LifeGoalWorkoutBias {
  preferredDomains: MovementDomain[];
  preferredLadderIds: string[];
  preferredSlotTypes: string[];
  copy: string;
}
