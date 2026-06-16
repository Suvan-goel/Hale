import type { SharingLevel, SupportConnection } from './types';
import type { SupportSummary } from './supportCircleService';

export function filterSupportSummaryForSharing(
  summary: SupportSummary,
  sharingLevel: SharingLevel
): SupportSummary {
  if (sharingLevel === 'private') return { visible: false, headline: 'Private' };
  if (sharingLevel === 'completion_only') {
    return {
      visible: summary.visible,
      headline: summary.sessionsTarget
        ? `${summary.sessionsThisWeek ?? 0} of ${summary.sessionsTarget} sessions completed this week.`
        : summary.headline,
      sessionsThisWeek: summary.sessionsThisWeek,
      sessionsTarget: summary.sessionsTarget,
    };
  }
  if (sharingLevel === 'progress_summary') {
    const { milestone: _milestone, ...withoutMilestone } = summary;
    return withoutMilestone;
  }
  return summary;
}

export function canShareDetailedProgress(connection: SupportConnection | null | undefined): boolean {
  return !!connection && connection.status !== 'removed' && connection.sharingLevel === 'detailed';
}
