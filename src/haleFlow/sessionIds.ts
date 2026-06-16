export type PlanSessionId = 'session_a' | 'session_b' | 'session_c';

export const PLAN_SESSION_IDS: readonly PlanSessionId[] = ['session_a', 'session_b', 'session_c'];

export function planSessionIdForTemplateId(templateId: string | undefined): PlanSessionId | undefined {
  if (!templateId) return undefined;
  const day = templateId.split(':')[0]?.split('-').pop()?.toUpperCase();
  if (day === 'A') return 'session_a';
  if (day === 'B') return 'session_b';
  if (day === 'C') return 'session_c';
  return undefined;
}

export function dayLabelForPlanSessionId(id: PlanSessionId): 'A' | 'B' | 'C' {
  if (id === 'session_a') return 'A';
  if (id === 'session_b') return 'B';
  return 'C';
}
