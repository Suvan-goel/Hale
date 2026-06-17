import {
  getMicroCheckCopy,
  getNextBestActionCopy,
} from '../copy';
import {
  getTodayPrimaryAction,
  type HaleLifecycleState,
} from '../appLifecycle';
import {
  getEquipmentSetupSummary,
  getExtraSessionCards,
  getLearnCards,
  getLearnDetail,
  getMovementLadderCards,
} from '../exploreViewModel';
import {
  getPlanEmptyStateCopy,
  getPlanFocusCopy,
  getPlanSessionCategoryCopy,
  getRetestCopy,
} from '../planViewModel';
import type { HaleUserFlowState } from '../types';

const BANNED_USER_COPY = /diagnosis|treatment|fall risk|frailty|failed|skipped workout|lost streak|medical-grade|poor score|medical diagnosis/i;

function assertCleanCopy(parts: readonly unknown[]) {
  const text = parts
    .flatMap((part) => (Array.isArray(part) ? part : [part]))
    .filter((part): part is string => typeof part === 'string')
    .join(' ');
  expect(text).not.toMatch(BANNED_USER_COPY);
}

describe('Hale V1 copy guardrails', () => {
  it('keeps primary Today, Plan, Progress, and Explore view-model copy warm and non-medical', () => {
    const lifecycleStates: HaleLifecycleState[] = [
      'needs_onboarding',
      'needs_baseline_checkup',
      'needs_block_creation',
      'first_session_ready',
      'normal_training_day',
      'weekly_micro_check_due',
      'monthly_retest_due',
      'week_complete',
      'inactive_restart',
    ];
    const flowStates: HaleUserFlowState[] = [
      'needs_life_goal',
      'needs_profile_safety',
      'needs_camera_setup',
      'needs_baseline_checkup',
      'baseline_checkup_incomplete',
      'baseline_checkup_invalid',
      'baseline_complete_needs_block',
      'active_block_session_due',
      'active_block_micro_check_due',
      'active_block_on_track',
      'active_block_slightly_behind',
      'active_block_restart_needed',
      'active_block_retest_due',
      'block_complete_needs_report',
      'report_ready',
      'needs_next_block',
      'no_active_block',
    ];

    assertCleanCopy(lifecycleStates.flatMap((state) => Object.values(getTodayPrimaryAction(state))));
    assertCleanCopy(flowStates.flatMap((state) => Object.values(getNextBestActionCopy({ state }))));
    assertCleanCopy([
      ...lifecycleStates.flatMap((state) => Object.values(getPlanEmptyStateCopy(state))),
      ...(['strength_power', 'balance', 'mobility', undefined] as const).flatMap((domain) =>
        Object.values(getPlanFocusCopy(domain))
      ),
      ...(['session_a', 'session_b', 'session_c'] as const).flatMap((id) =>
        Object.values(getPlanSessionCategoryCopy(id))
      ),
      ...Object.values(getRetestCopy(undefined)),
      ...Object.values(
        getRetestCopy({
          focusTitle: 'Strength',
          focusDomain: 'strength_power',
          weekNumber: 4,
          totalWeeks: 4,
          sessionsCompleteThisWeek: 3,
          sessionsTargetThisWeek: 3,
          retestInDays: 0,
        })
      ),
      ...Object.values(getEquipmentSetupSummary()),
      ...Object.values(getMicroCheckCopy('balance')),
    ]);
    assertCleanCopy(getExtraSessionCards().flatMap((card) => Object.values(card)));
    assertCleanCopy(getMovementLadderCards().flatMap((card) => Object.values(card)));
    assertCleanCopy(
      getLearnCards().flatMap((card) => {
        const detail = getLearnDetail(card.id);
        return [card.title, card.body, ...(detail?.sections.flatMap((section) => [section.title, section.body]) ?? [])];
      })
    );
  });
});
