import type { MovementBlock, TrainingSessionCompletion } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;

export function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

export function calendarKey(iso: string): string {
  return iso.slice(0, 10);
}

export function daysBetween(startIso: string, endIso: string): number {
  const start = Date.parse(startIso);
  const end = Date.parse(endIso);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.floor((end - start) / DAY_MS);
}

export function daysUntil(targetIso: string, nowIso: string): number {
  const target = Date.parse(targetIso);
  const now = Date.parse(nowIso);
  if (!Number.isFinite(target) || !Number.isFinite(now)) return 0;
  return Math.max(0, Math.ceil((target - now) / DAY_MS));
}

export function currentBlockWeek(block: MovementBlock, nowIso: string): number {
  const days = Math.max(0, daysBetween(block.startDate, nowIso));
  return Math.min(4, Math.floor(days / 7) + 1);
}

export function weekWindow(block: MovementBlock, nowIso: string): { weekNumber: number; start: string; end: string } {
  const weekNumber = currentBlockWeek(block, nowIso);
  const start = addDaysIso(block.startDate, (weekNumber - 1) * 7);
  return { weekNumber, start, end: addDaysIso(start, 7) };
}

export function isWithinIsoWindow(iso: string, startIso: string, endIso: string): boolean {
  const time = Date.parse(iso);
  return time >= Date.parse(startIso) && time < Date.parse(endIso);
}

export function completedTrainingSessions(
  block: MovementBlock,
  completions: readonly TrainingSessionCompletion[]
): TrainingSessionCompletion[] {
  return completions.filter((c) => c.blockId === block.id && isCreditedMainPlanTrainingCompletion(c));
}

export function isCreditedMainPlanTrainingCompletion(completion: TrainingSessionCompletion): boolean {
  return (
    completion.mainPlanCredit === true &&
    (completion.sessionType === 'standard' || completion.sessionType === 'starter' || completion.sessionType === 'restart')
  );
}

export function sessionsCompletedThisWeek(
  block: MovementBlock,
  completions: readonly TrainingSessionCompletion[],
  nowIso: string
): number {
  const win = weekWindow(block, nowIso);
  return completedTrainingSessions(block, completions).filter((c) =>
    isWithinIsoWindow(c.completedAt, win.start, win.end)
  ).length;
}

export function microCheckCompletedThisWeek(
  block: MovementBlock,
  completions: readonly TrainingSessionCompletion[],
  nowIso: string
): boolean {
  const win = weekWindow(block, nowIso);
  return completions.some(
    (c) => c.blockId === block.id && c.sessionType === 'micro_check' && isWithinIsoWindow(c.completedAt, win.start, win.end)
  );
}

export function expectedSessionsByDate(block: MovementBlock, nowIso: string): number {
  const days = Math.max(0, Math.min(28, daysBetween(block.startDate, nowIso)));
  const completeWeeks = Math.floor(days / 7);
  const dayInWeek = days % 7;
  const inWeekExpectation = Math.floor(dayInWeek / 2.5);
  return Math.min(block.totalPlannedSessions, completeWeeks * block.sessionsPerWeekTarget + inWeekExpectation);
}

export function lastTrainingCompletionAt(
  block: MovementBlock,
  completions: readonly TrainingSessionCompletion[]
): string | null {
  const sessions = completedTrainingSessions(block, completions);
  if (sessions.length === 0) return null;
  return sessions.reduce((latest, c) => (c.completedAt > latest ? c.completedAt : latest), sessions[0].completedAt);
}
