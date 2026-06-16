import { currentWeekProgress } from './adherenceState';
import { daysUntil } from './dateUtils';
import { domainLabel } from './goalDomainMapping';
import type {
  MovementBlock,
  SharingLevel,
  SupportConnection,
  SupportRelationshipType,
  TrainingSessionCompletion,
} from './types';
import { LOCAL_USER_ID } from './types';

export const SUPPORT_ENCOURAGEMENTS = [
  'Proud of you - keep going.',
  "Want to do today's session together?",
  "Your re-test is coming up. I'm cheering you on.",
  'Clean slate - restart gently today.',
];

export function createSupportInvite({
  relationshipType,
  inviteEmailOrPhone,
  sharingLevel = 'progress_summary',
  notifyOnMissedWeek = false,
  notifyOnMilestones = true,
  userId = LOCAL_USER_ID,
  nowIso = new Date().toISOString(),
}: {
  relationshipType: SupportRelationshipType;
  inviteEmailOrPhone?: string;
  sharingLevel?: SharingLevel;
  notifyOnMissedWeek?: boolean;
  notifyOnMilestones?: boolean;
  userId?: string;
  nowIso?: string;
}): SupportConnection {
  return {
    id: `support-${nowIso.replace(/[:.]/g, '-')}`,
    userId,
    inviteEmailOrPhone: inviteEmailOrPhone?.trim() || undefined,
    relationshipType,
    status: 'pending',
    sharingLevel,
    notifyOnMissedWeek,
    notifyOnMilestones,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

export function updateSupportConnection(
  connection: SupportConnection,
  patch: Partial<Pick<SupportConnection, 'sharingLevel' | 'notifyOnMissedWeek' | 'notifyOnMilestones' | 'status' | 'inviteEmailOrPhone'>>,
  nowIso: string = new Date().toISOString()
): SupportConnection {
  return { ...connection, ...patch, updatedAt: nowIso };
}

export function relationshipLabel(type: SupportRelationshipType): string {
  switch (type) {
    case 'spouse_partner':
      return 'Spouse or partner';
    case 'adult_child':
      return 'Son or daughter';
    case 'sibling':
      return 'Sibling';
    case 'friend':
      return 'Friend';
    case 'training_buddy':
      return 'Training buddy';
    case 'other':
      return 'Supporter';
  }
}

export function sharingLevelLabel(level: SharingLevel): string {
  switch (level) {
    case 'private':
      return 'Private';
    case 'completion_only':
      return 'Completion only';
    case 'progress_summary':
      return 'Progress summary';
    case 'detailed':
      return 'Detailed';
  }
}

export interface SupportSummary {
  visible: boolean;
  headline: string;
  detail?: string;
  sessionsThisWeek?: number;
  sessionsTarget?: number;
  focusDomain?: string;
  retestDays?: number;
  milestone?: string;
}

export function createSupportSummary({
  connection,
  block,
  completions,
  recentMilestoneTitle,
  nowIso = new Date().toISOString(),
}: {
  connection: SupportConnection | null | undefined;
  block: MovementBlock | null | undefined;
  completions: readonly TrainingSessionCompletion[];
  recentMilestoneTitle?: string | null;
  nowIso?: string;
}): SupportSummary {
  if (!connection || connection.status === 'removed' || connection.sharingLevel === 'private') {
    return { visible: false, headline: 'Private' };
  }
  if (!block) return { visible: true, headline: 'No active block shared yet.' };
  const week = currentWeekProgress(block, completions, nowIso);
  if (connection.sharingLevel === 'completion_only') {
    return {
      visible: true,
      headline: `${week.sessionsCompleted} of ${week.sessionsTarget} sessions completed this week.`,
      sessionsThisWeek: week.sessionsCompleted,
      sessionsTarget: week.sessionsTarget,
    };
  }
  const base = {
    visible: true,
    headline: `${domainLabel(block.focusDomain)} block in progress.`,
    detail: `Re-test in ${daysUntil(block.retestDate, nowIso)} days. ${week.sessionsCompleted} of ${week.sessionsTarget} sessions completed this week.`,
    sessionsThisWeek: week.sessionsCompleted,
    sessionsTarget: week.sessionsTarget,
    focusDomain: domainLabel(block.focusDomain),
    retestDays: daysUntil(block.retestDate, nowIso),
  };
  if (connection.sharingLevel === 'detailed') {
    return { ...base, milestone: recentMilestoneTitle ?? undefined };
  }
  return base;
}
