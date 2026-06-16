import {
  blockProgress,
  currentWeekProgress,
  getAdherenceState,
  type MovementAssessment,
  type MovementBlock,
} from '../adherence';
import type { AdherenceState } from '../adherence/types';
import { getNextBestActionCopy } from './copy';
import type { HaleUserFlowState, NextBestAction, NextBestActionInput } from './types';

export function getNextBestAction(input: NextBestActionInput): NextBestAction {
  const nowIso = normalizeNow(input.now);
  const completions = input.sessionCompletions ?? [];
  const latestAssessment = input.latestAssessment ?? null;
  const activeBlock = input.activeBlock ?? null;
  const state = resolveFlowState({
    lifeGoalPresent: !!input.lifeGoal,
    safetyProfilePresent: !!input.profile?.safetyProfile,
    latestAssessment,
    activeBlock,
    completions,
    latestReportPresent: !!input.latestReport,
    nowIso,
  });
  return {
    state,
    ...getNextBestActionCopy({ state, block: activeBlock, lifeGoal: input.lifeGoal }),
  };
}

function resolveFlowState({
  lifeGoalPresent,
  safetyProfilePresent,
  latestAssessment,
  activeBlock,
  completions,
  latestReportPresent,
  nowIso,
}: {
  lifeGoalPresent: boolean;
  safetyProfilePresent: boolean;
  latestAssessment: MovementAssessment | null;
  activeBlock: MovementBlock | null;
  completions: NextBestActionInput['sessionCompletions'];
  latestReportPresent: boolean;
  nowIso: string;
}): HaleUserFlowState {
  if (!lifeGoalPresent) return 'needs_life_goal';
  if (!safetyProfilePresent) return 'needs_profile_safety';
  if (!latestAssessment) return 'needs_baseline_checkup';
  if (latestAssessment.status === 'not_started' || latestAssessment.status === 'in_progress') {
    return 'baseline_checkup_incomplete';
  }
  if (latestAssessment.status === 'invalid') return 'baseline_checkup_invalid';

  if (activeBlock) {
    const adherence = getAdherenceState(activeBlock, completions ?? [], nowIso);
    return activeBlockState(activeBlock, completions ?? [], adherence, latestReportPresent, nowIso);
  }

  if (latestReportPresent) return 'needs_next_block';
  if (latestAssessment.isOfficialForProgress && latestAssessment.status === 'completed') {
    return 'baseline_complete_needs_block';
  }
  return 'no_active_block';
}

function activeBlockState(
  block: MovementBlock,
  completions: readonly NonNullable<NextBestActionInput['sessionCompletions']>[number][],
  adherence: AdherenceState,
  latestReportPresent: boolean,
  nowIso: string
): HaleUserFlowState {
  if (adherence === 'block_complete' || block.status === 'completed') {
    return latestReportPresent ? 'report_ready' : 'block_complete_needs_report';
  }
  if (adherence === 'ready_for_retest') return 'active_block_retest_due';
  if (adherence === 'inactive_this_week' || adherence === 'inactive_14_days') {
    return 'active_block_restart_needed';
  }
  if (adherence === 'missed_one_session' || adherence === 'slightly_behind') {
    return 'active_block_slightly_behind';
  }

  const week = currentWeekProgress(block, completions, nowIso);
  const progress = blockProgress(block, completions);
  if (progress.completedSessions < block.totalPlannedSessions && week.sessionsCompleted < week.sessionsTarget) {
    return 'active_block_session_due';
  }
  if (!week.microCheckCompleted) return 'active_block_micro_check_due';
  return 'active_block_on_track';
}

function normalizeNow(now: string | Date | undefined): string {
  if (!now) return new Date().toISOString();
  if (typeof now === 'string') return now;
  return now.toISOString();
}
