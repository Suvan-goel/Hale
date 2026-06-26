import type {
  MovementAssessment,
  MovementBlock,
} from '../adherence';
import { getNextBestActionCopy } from './copy';
import { getBlockScheduleState } from './blockSchedule';
import { getBlockMicroCheckTarget, getMicroCheckForTarget } from './microCheck';
import type { HaleUserFlowState, NextBestAction, NextBestActionInput } from './types';
import type { MicroCheckDefinition } from './types';

export function getNextBestAction(input: NextBestActionInput): NextBestAction {
  const nowIso = normalizeNow(input.now);
  const completions = input.sessionCompletions ?? [];
  const latestAssessment = input.latestAssessment ?? null;
  const activeBlock = input.activeBlock ?? null;
  const resolved = resolveFlowState({
    lifeGoalPresent: !!input.lifeGoal,
    safetyProfilePresent: !!input.profile?.safetyProfile,
    latestAssessment,
    activeBlock,
    completions,
    latestReportPresent: !!input.latestReport,
    nowIso,
  });
  return {
    state: resolved.state,
    ...getNextBestActionCopy({
      state: resolved.state,
      block: activeBlock,
      lifeGoal: input.lifeGoal,
      microCheckTarget: resolved.microCheckTarget,
    }),
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
}): { state: HaleUserFlowState; microCheckTarget?: MicroCheckDefinition } {
  if (!lifeGoalPresent) return { state: 'needs_life_goal' };
  if (!safetyProfilePresent) return { state: 'needs_profile_safety' };
  if (!latestAssessment) return { state: 'needs_baseline_checkup' };
  if (latestAssessment.status === 'not_started' || latestAssessment.status === 'in_progress') {
    return { state: 'baseline_checkup_incomplete' };
  }
  if (latestAssessment.status === 'invalid') return { state: 'baseline_checkup_invalid' };

  if (activeBlock) {
    return activeBlockState(activeBlock, completions ?? [], latestReportPresent, nowIso);
  }

  if (latestReportPresent) return { state: 'needs_next_block' };
  if (latestAssessment.isOfficialForProgress && latestAssessment.status === 'completed') {
    return { state: 'baseline_complete_needs_block' };
  }
  return { state: 'no_active_block' };
}

function activeBlockState(
  block: MovementBlock,
  completions: readonly NonNullable<NextBestActionInput['sessionCompletions']>[number][],
  latestReportPresent: boolean,
  nowIso: string
): { state: HaleUserFlowState; microCheckTarget?: MicroCheckDefinition } {
  const schedule = getBlockScheduleState({ block, completions, today: nowIso });
  if (schedule.status === 'block_completed') {
    return { state: latestReportPresent ? 'report_ready' : 'block_complete_needs_report' };
  }
  if (schedule.status === 'retest_due') return { state: 'active_block_retest_due' };
  const microCheckTarget = getBlockMicroCheckTarget({ block, schedule, completions });
  if (microCheckTarget.status === 'available') {
    return { state: 'active_block_micro_check_due', microCheckTarget: getMicroCheckForTarget(microCheckTarget) };
  }
  if (schedule.status === 'session_due' && schedule.lapseState === 'restart_recommended') {
    return { state: 'active_block_restart_needed' };
  }
  if (schedule.lapseState === 'resume_gently') {
    return { state: 'active_block_slightly_behind' };
  }
  if (schedule.status === 'session_due') {
    return { state: 'active_block_session_due' };
  }
  return { state: 'active_block_on_track' };
}

function normalizeNow(now: string | Date | undefined): string {
  if (!now) return new Date().toISOString();
  if (typeof now === 'string') return now;
  return now.toISOString();
}
