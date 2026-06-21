import type {
  MovementBlock,
  MovementDomain,
  TrainingSessionCompletion,
  TrainingSessionCompletionType,
} from '../adherence';
import type { PersistedGeneratedSessionSummary } from '../training';
import {
  createSessionTemplatesForFocus,
  type RecentSessionSummary,
  type SessionSource,
  type TrainingDomain,
} from '../training/workoutGeneration';
import type { HaleSessionPlan } from './types';

export type MainPlanEventSource = SessionSource | 'legacy_fallback' | 'legacy';

export type MainPlanCreditRejectionReason =
  | 'missing_block'
  | 'wrong_block'
  | 'unsupported_session_type'
  | 'non_block_source'
  | 'missing_credit_flag'
  | 'missing_focus_stimulus_credit'
  | 'missing_template'
  | 'missing_planned_date_key'
  | 'invalid_template'
  | 'skipped_or_incomplete'
  | 'missing_completed_at'
  | 'legacy_unknown';

export interface MainPlanEventCandidate {
  id?: string;
  blockId?: string;
  sessionType?: TrainingSessionCompletionType;
  source?: MainPlanEventSource;
  templateId?: string;
  plannedDateKey?: string;
  completedAt?: string;
  status?: 'completed' | 'partial' | 'skipped';
  mainPlanCredit?: boolean;
  focusStimulusCredit?: boolean;
  requiresFocusStimulusCredit?: boolean;
}

export interface MainPlanCreditEvent {
  id?: string;
  blockId: string;
  templateId: string;
  plannedDateKey?: string;
  completedAt: string;
  status: 'completed';
  source: 'block_generated';
  creditId: string;
}

export type MainPlanCreditClassification =
  | { credited: true; event: MainPlanCreditEvent }
  | { credited: false; reason: MainPlanCreditRejectionReason };

export interface MainPlanTemplateSet {
  templateIds: readonly string[];
  templateIdsByDayLabel: ReadonlyMap<'A' | 'B' | 'C', string>;
}

export function requiredMainPlanTemplatesForBlock(block: MovementBlock | null | undefined): MainPlanTemplateSet {
  if (!block) return { templateIds: [], templateIdsByDayLabel: new Map() };
  const templates = createSessionTemplatesForFocus(toTrainingDomain(block.focusDomain)).filter(
    (template) => template.dayLabel === 'A' || template.dayLabel === 'B' || template.dayLabel === 'C'
  );
  const templateIdsByDayLabel = new Map<'A' | 'B' | 'C', string>();
  for (const template of templates) {
    if (template.dayLabel === 'A' || template.dayLabel === 'B' || template.dayLabel === 'C') {
      templateIdsByDayLabel.set(template.dayLabel, template.id);
    }
  }
  return {
    templateIds: templates.map((template) => template.id),
    templateIdsByDayLabel,
  };
}

export function classifyMainPlanSessionPlan(
  sessionPlan: HaleSessionPlan | null | undefined,
  activeBlock?: MovementBlock | null
): MainPlanCreditClassification {
  if (!sessionPlan) return { credited: false, reason: 'missing_block' };
  const block =
    activeBlock ??
    ({
      id: sessionPlan.blockId,
      focusDomain: sessionPlan.focusDomain,
    } as MovementBlock);
  return classifyMainPlanCandidate(block, {
    id: sessionPlan.id,
    blockId: sessionPlan.blockId,
    sessionType: sessionPlan.sessionType,
    source: sessionPlan.metadata?.source,
    templateId: sessionPlan.metadata?.templateId,
    plannedDateKey: sessionPlan.metadata?.plannedDateKey,
    completedAt: new Date(0).toISOString(),
    status: 'completed',
    mainPlanCredit: true,
    requiresFocusStimulusCredit: false,
  });
}

export function classifyMainPlanCompletion(
  block: MovementBlock | null | undefined,
  completion: TrainingSessionCompletion
): MainPlanCreditClassification {
  return classifyMainPlanCandidate(block, {
    id: completion.id,
    blockId: completion.blockId,
    sessionType: completion.sessionType,
    source: completion.source,
    templateId: completion.templateId ?? templateIdFromPlannedDateKey(completion.plannedDate),
    plannedDateKey: completion.plannedDate,
    completedAt: completion.completedAt,
    status: 'completed',
    mainPlanCredit: completion.mainPlanCredit,
    focusStimulusCredit: completion.focusStimulusEvidence?.mainPlanCredit,
    requiresFocusStimulusCredit: true,
  });
}

export function classifyMainPlanGeneratedSummary(
  block: MovementBlock | null | undefined,
  summary: PersistedGeneratedSessionSummary
): MainPlanCreditClassification {
  return classifyMainPlanCandidate(block, {
    id: summary.id,
    blockId: summary.blockId,
    sessionType: summary.sessionType,
    source: summary.source,
    templateId: summary.templateId ?? templateIdFromPlannedDateKey(summary.plannedDateKey),
    plannedDateKey: summary.plannedDateKey,
    completedAt: summary.completedAt,
    status: summary.status,
    mainPlanCredit: summary.mainPlanCredit,
    focusStimulusCredit: summary.focusStimulusEvidence?.mainPlanCredit,
    requiresFocusStimulusCredit: true,
  });
}

export function classifyMainPlanCandidate(
  block: MovementBlock | null | undefined,
  candidate: MainPlanEventCandidate
): MainPlanCreditClassification {
  if (!block) return { credited: false, reason: 'missing_block' };
  if (candidate.blockId && candidate.blockId !== block.id) return { credited: false, reason: 'wrong_block' };
  if (!isSupportedMainPlanSessionType(candidate.sessionType)) {
    return { credited: false, reason: 'unsupported_session_type' };
  }
  if (candidate.source !== 'block_generated') return { credited: false, reason: candidate.source ? 'non_block_source' : 'legacy_unknown' };
  if (candidate.mainPlanCredit !== true) return { credited: false, reason: 'missing_credit_flag' };
  if (candidate.requiresFocusStimulusCredit && candidate.focusStimulusCredit !== true) {
    return { credited: false, reason: 'missing_focus_stimulus_credit' };
  }
  if (candidate.status && candidate.status !== 'completed' && candidate.status !== 'partial') {
    return { credited: false, reason: 'skipped_or_incomplete' };
  }
  if (!candidate.completedAt) return { credited: false, reason: 'missing_completed_at' };
  if (!candidate.plannedDateKey) return { credited: false, reason: 'missing_planned_date_key' };
  const templateId = candidate.templateId ?? templateIdFromPlannedDateKey(candidate.plannedDateKey);
  if (!templateId) return { credited: false, reason: 'missing_template' };
  if (!requiredMainPlanTemplatesForBlock(block).templateIds.includes(templateId)) {
    return { credited: false, reason: 'invalid_template' };
  }
  return {
    credited: true,
    event: {
      id: candidate.id,
      blockId: block.id,
      templateId,
      plannedDateKey: candidate.plannedDateKey,
      completedAt: candidate.completedAt,
      status: 'completed',
      source: 'block_generated',
      creditId: candidate.plannedDateKey ?? candidate.id ?? `${block.id}:${templateId}:${dateKey(candidate.completedAt)}`,
    },
  };
}

export function mainPlanRecentSessionsForGeneration(input: {
  activeBlock?: MovementBlock | null;
  completions?: readonly TrainingSessionCompletion[];
  generatedSessionSummaries?: readonly PersistedGeneratedSessionSummary[];
}): RecentSessionSummary[] {
  const block = input.activeBlock ?? null;
  if (!block) return [];
  const events: MainPlanCreditEvent[] = [];
  for (const completion of input.completions ?? []) {
    const classification = classifyMainPlanCompletion(block, completion);
    if (classification.credited) events.push(classification.event);
  }
  for (const summary of input.generatedSessionSummaries ?? []) {
    const classification = classifyMainPlanGeneratedSummary(block, summary);
    if (classification.credited) events.push(classification.event);
  }
  return dedupeMainPlanEvents(block, events).map((event) => ({
    id: event.id,
    blockId: event.blockId,
    templateId: event.templateId,
    plannedDate: event.plannedDateKey,
    completedAt: event.completedAt,
    source: event.source,
    status: event.status,
  }));
}

export function creditedMainPlanCompletionsForBlock(
  block: MovementBlock | null | undefined,
  completions: readonly TrainingSessionCompletion[]
): TrainingSessionCompletion[] {
  if (!block) return [];
  return completions.filter((completion) => classifyMainPlanCompletion(block, completion).credited);
}

export function countCreditedMainPlanTemplatesThisWeek(input: {
  block: MovementBlock;
  completions: readonly TrainingSessionCompletion[];
  summaries?: readonly PersistedGeneratedSessionSummary[];
  today: string | Date;
}): number {
  const week = weekIndexForDate(input.block, iso(input.today));
  const templates = new Set(
    mainPlanRecentSessionsForGeneration({
      activeBlock: input.block,
      completions: input.completions,
      generatedSessionSummaries: input.summaries,
    })
      .filter((session) => weekIndexForDate(input.block, session.completedAt) === week)
      .map((session) => session.templateId)
      .filter((templateId): templateId is string => !!templateId)
  );
  return templates.size;
}

export function templateIdFromPlannedDateKey(plannedDateKey: string | undefined): string | undefined {
  if (!plannedDateKey) return undefined;
  const [templateId] = plannedDateKey.split(':');
  return templateId && templateId.trim().length > 0 ? templateId : undefined;
}

function dedupeMainPlanEvents(block: MovementBlock, events: readonly MainPlanCreditEvent[]): MainPlanCreditEvent[] {
  const out: MainPlanCreditEvent[] = [];
  const seenCreditIds = new Set<string>();
  const seenWeekTemplates = new Set<string>();
  for (const event of events.slice().sort((a, b) => a.completedAt.localeCompare(b.completedAt))) {
    const creditKey = event.creditId;
    const weekTemplateKey = `${weekIndexForDate(block, event.completedAt)}:${event.templateId}`;
    if (seenCreditIds.has(creditKey) || seenWeekTemplates.has(weekTemplateKey)) continue;
    seenCreditIds.add(creditKey);
    seenWeekTemplates.add(weekTemplateKey);
    out.push(event);
  }
  return out;
}

function isSupportedMainPlanSessionType(type: TrainingSessionCompletionType | undefined): boolean {
  return type === 'starter' || type === 'standard' || type === 'restart';
}

function weekIndexForDate(block: MovementBlock, value: string): number {
  const start = Date.parse(block.startDate);
  const completed = Date.parse(value);
  if (!Number.isFinite(start) || !Number.isFinite(completed)) return 1;
  return Math.max(1, Math.min(4, Math.floor((completed - start) / (7 * 24 * 60 * 60 * 1000)) + 1));
}

function toTrainingDomain(domain: MovementDomain): TrainingDomain {
  if (domain === 'balance') return 'balance_stability';
  if (domain === 'mobility') return 'mobility_flexibility';
  return 'strength_power';
}

function dateKey(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'unknown-date';
  return date.toISOString().slice(0, 10);
}

function iso(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}
