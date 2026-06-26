import { calendarKey } from './dateUtils';
import { movementBlockDomainFocus, movementDomainToTrainingPrimaryDomain } from './blockFocus';
import type {
  AdherenceStoreState,
  IdentityMilestone,
  MovementAssessment,
  MovementBlock,
  MovementBlockReport,
  TrainingSessionCompletion,
  TrainingSessionCompletionType,
} from './types';
import { LOCAL_USER_ID } from './types';

export function upsertMovementBlock(state: AdherenceStoreState, block: MovementBlock): AdherenceStoreState {
  const archived = state.blocks.map((b) =>
    b.id !== block.id && b.status === 'active' ? { ...b, status: 'completed' as const, updatedAt: block.createdAt } : b
  );
  const exists = archived.some((b) => b.id === block.id);
  return {
    ...state,
    blocks: exists ? archived.map((b) => (b.id === block.id ? block : b)) : [...archived, block],
  };
}

export function upsertMovementAssessment(
  state: AdherenceStoreState,
  assessment: MovementAssessment
): AdherenceStoreState {
  const exists = state.assessments.some((a) => a.id === assessment.id);
  return {
    ...state,
    assessments: exists
      ? state.assessments.map((a) => (a.id === assessment.id ? assessment : a))
      : [...state.assessments, assessment],
  };
}

export function upsertMovementBlockReport(
  state: AdherenceStoreState,
  report: MovementBlockReport
): AdherenceStoreState {
  const exists = state.reports.some((r) => r.id === report.id);
  return {
    ...state,
    reports: exists ? state.reports.map((r) => (r.id === report.id ? report : r)) : [...state.reports, report],
  };
}

export function makeTrainingSessionCompletion({
  block,
  sessionType,
  completedAt = new Date().toISOString(),
  plannedDate,
  durationMinutes,
  perceivedEffort,
  painReported,
  notes,
  source,
  templateId,
  mainPlanCredit,
  plannedPrimaryDomain,
  scheduleCredit,
  workEvidence,
  focusStimulusEvidence,
  progressionEvidencePolicy,
  microCheckSlot,
  userId = LOCAL_USER_ID,
}: {
  block: MovementBlock;
  sessionType: TrainingSessionCompletionType;
  completedAt?: string;
  plannedDate?: string;
  durationMinutes?: number;
  perceivedEffort?: 1 | 2 | 3 | 4 | 5;
  painReported?: boolean;
  notes?: string;
  source?: TrainingSessionCompletion['source'];
  templateId?: string;
  mainPlanCredit?: boolean;
  plannedPrimaryDomain?: TrainingSessionCompletion['plannedPrimaryDomain'];
  scheduleCredit?: TrainingSessionCompletion['scheduleCredit'];
  workEvidence?: TrainingSessionCompletion['workEvidence'];
  focusStimulusEvidence?: TrainingSessionCompletion['focusStimulusEvidence'];
  progressionEvidencePolicy?: TrainingSessionCompletion['progressionEvidencePolicy'];
  microCheckSlot?: TrainingSessionCompletion['microCheckSlot'];
  userId?: string;
}): TrainingSessionCompletion {
  const keyDate = plannedDate ?? microCheckSlot?.slotId ?? calendarKey(completedAt);
  return {
    id: `completion-${block.id}-${sessionType}-${keyDate}`,
    userId,
    blockId: block.id,
    plannedDate,
    completedAt,
    sessionType,
    focusDomain: block.focusDomain ?? undefined,
    plannedPrimaryDomain:
      plannedPrimaryDomain ??
      (movementBlockDomainFocus(block)
        ? movementDomainToTrainingPrimaryDomain(movementBlockDomainFocus(block)!)
        : undefined),
    source,
    templateId,
    mainPlanCredit,
    scheduleCredit,
    workEvidence,
    focusStimulusEvidence,
    progressionEvidencePolicy,
    microCheckSlot,
    durationMinutes,
    perceivedEffort,
    painReported,
    notes,
  };
}

export function recordTrainingSessionCompletion(
  state: AdherenceStoreState,
  completion: TrainingSessionCompletion
): AdherenceStoreState {
  const duplicate = state.completions.some((c) => completionDedupeKey(c) === completionDedupeKey(completion));
  const completions = duplicate ? state.completions : [...state.completions, completion];
  return {
    ...state,
    completions,
    blocks: state.blocks.map((b) => recomputeBlockProgress(b, completions, completion.completedAt)),
  };
}

export function markMovementBlockComplete(
  state: AdherenceStoreState,
  blockId: string,
  completedAt: string = new Date().toISOString()
): AdherenceStoreState {
  return {
    ...state,
    blocks: state.blocks.map((b) => (b.id === blockId ? { ...b, status: 'completed', updatedAt: completedAt } : b)),
  };
}

export function mergeMilestones(
  state: AdherenceStoreState,
  milestones: readonly IdentityMilestone[]
): AdherenceStoreState {
  const existingKeys = new Set(state.milestones.map(milestoneKey));
  const fresh = milestones.filter((m) => !existingKeys.has(milestoneKey(m)));
  return fresh.length === 0 ? state : { ...state, milestones: [...state.milestones, ...fresh] };
}

export function latestMilestone(state: AdherenceStoreState): IdentityMilestone | null {
  if (state.milestones.length === 0) return null;
  return state.milestones.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

function recomputeBlockProgress(
  block: MovementBlock,
  completions: readonly TrainingSessionCompletion[],
  nowIso: string
): MovementBlock {
  const mine = completions.filter((c) => c.blockId === block.id);
  const completedSessions = mine.filter((completion) => completion.scheduleCredit?.credited === true).length;
  const microCheckKeys = new Set(
    mine
      .filter((c) => c.sessionType === 'micro_check')
      .map((c) => c.microCheckSlot?.slotId ?? completionDedupeKey(c))
  );
  const microChecksCompleted = microCheckKeys.size;
  const hasRetest = mine.some((c) => c.sessionType === 'retest');
  return {
    ...block,
    completedSessions: Math.min(block.totalPlannedSessions, completedSessions),
    microChecksCompleted,
    status: hasRetest ? 'completed' : block.status,
    updatedAt: nowIso,
  };
}

function completionDedupeKey(c: TrainingSessionCompletion): string {
  const identity =
    c.sessionType === 'micro_check' ? c.microCheckSlot?.slotId ?? c.plannedDate ?? calendarKey(c.completedAt) : c.plannedDate ?? calendarKey(c.completedAt);
  return `${c.blockId}:${c.sessionType}:${identity}`;
}

function milestoneKey(m: IdentityMilestone): string {
  return `${m.userId}:${m.blockId ?? 'global'}:${m.type}`;
}
