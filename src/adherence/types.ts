import type { CheckUpScore } from '../scoring';

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
  | 'mini_band'
  | 'dumbbells'
  | 'backpack'
  | 'none';

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
  sessionsPerWeekTarget: number;
  totalPlannedSessions: number;
  completedSessions: number;
  microChecksCompleted: number;
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
  | 'micro_check';

export type CheckupStatus = 'not_started' | 'in_progress' | 'completed' | 'invalid' | 'cancelled';

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

export interface TrainingSessionCompletion {
  id: string;
  userId: string;
  blockId: string;
  plannedDate?: string;
  completedAt: string;
  sessionType: TrainingSessionCompletionType;
  focusDomain?: MovementDomain;
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
        direction: 'improved' | 'held_steady' | 'declined' | 'unknown';
      }
    >
  >;
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
  | 'domain_improved'
  | 'domain_held_steady'
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
  id?: string;
}

export interface LifeGoalTrainingRelevance {
  primaryDomains: MovementDomain[];
  copy: string;
}
