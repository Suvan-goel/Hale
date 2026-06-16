import { getAdherenceState } from './adherenceState';
import { getNotificationCopy, getSupportNotificationCopy } from './adherenceCopy';
import { lastTrainingCompletionAt } from './dateUtils';
import type {
  MovementBlock,
  NotificationEvent,
  NotificationEventType,
  SupportConnection,
  TrainingSessionCompletion,
} from './types';
import { LOCAL_USER_ID } from './types';

export class NotificationService {
  async schedule(_event: NotificationEvent, _body: string): Promise<void> {
    // TODO: connect to expo-notifications or a backend provider if reminders become real.
  }

  async cancel(_dedupeKey: string): Promise<void> {
    // TODO: cancel provider-side notification once a real scheduler exists.
  }
}

export function makeNotificationEvent({
  type,
  dedupeKey,
  userId = LOCAL_USER_ID,
  blockId,
  supportConnectionId,
  nowIso = new Date().toISOString(),
}: {
  type: NotificationEventType;
  dedupeKey: string;
  userId?: string;
  blockId?: string;
  supportConnectionId?: string;
  nowIso?: string;
}): NotificationEvent {
  return {
    id: `notification-${type}-${nowIso.replace(/[:.]/g, '-')}`,
    userId,
    blockId,
    supportConnectionId,
    type,
    dedupeKey,
    createdAt: nowIso,
  };
}

export function shouldTriggerMissedWeekSupportNotification({
  connection,
  block,
  completions,
  events,
  nowIso = new Date().toISOString(),
}: {
  connection: SupportConnection | null | undefined;
  block: MovementBlock | null | undefined;
  completions: readonly TrainingSessionCompletion[];
  events: readonly NotificationEvent[];
  nowIso?: string;
}): { shouldTrigger: boolean; event?: NotificationEvent; copy?: string } {
  if (!connection || !block || connection.status === 'removed') return { shouldTrigger: false };
  if (!connection.notifyOnMissedWeek) return { shouldTrigger: false };
  if (block.status !== 'active') return { shouldTrigger: false };
  const state = getAdherenceState(block, completions, nowIso);
  if (state !== 'inactive_this_week' && state !== 'inactive_14_days') return { shouldTrigger: false };
  const lastAt = lastTrainingCompletionAt(block, completions) ?? block.startDate;
  const dedupeKey = `${connection.id}:${block.id}:missed-week:${lastAt.slice(0, 10)}`;
  if (events.some((e) => e.type === 'missed_week_support' && e.dedupeKey === dedupeKey)) {
    return { shouldTrigger: false };
  }
  return {
    shouldTrigger: true,
    event: makeNotificationEvent({
      type: 'missed_week_support',
      dedupeKey,
      blockId: block.id,
      supportConnectionId: connection.id,
      nowIso,
    }),
    copy: getSupportNotificationCopy(null),
  };
}

export function notificationCopy(type: NotificationEventType): string {
  return getNotificationCopy(type);
}
