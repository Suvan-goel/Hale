import type { CheckUp } from '../checkup';

export function checkUpCompletionTimestamp(checkUp: CheckUp, fallbackIso: string): string {
  return typeof checkUp.startedAt === 'string' && Number.isFinite(Date.parse(checkUp.startedAt))
    ? checkUp.startedAt
    : fallbackIso;
}
