import { readFileSync } from 'node:fs';
import { join } from 'node:path';

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
  getExploreLibrary,
  getExtraSessionCards,
  getHealthInsightCards,
  getLearnCards,
  getLearnDetail,
  getMovementLadderCards,
  getMovementLadderDetail,
} from '../exploreViewModel';
import {
  getPlanEmptyStateCopy,
  getPlanFocusCopy,
  getPlanSessionCategoryCopy,
  getRetestCopy,
} from '../planViewModel';
import type { HaleUserFlowState } from '../types';

const BANNED_USER_COPY =
  /diagnosis|treatment|fall risk|frailty|failed|skipped workout|lost streak|medical-grade|poor score|medical diagnosis|camera measured|typical of age|typical ages|movement age|main opportunity|best place to focus|protects progress|protect your progress|protected your progress|progress protected|improved|held steady|declined/i;

const RESULT_COPY_FILES = [
  'src/screens/ResultsScreen.tsx',
  'src/screens/OnboardingResultsScreen.tsx',
  'src/screens/ProgressScreen.tsx',
  'src/screens/HomeScreen.tsx',
  'src/adherence/screens/BlockReportScreen.tsx',
  'src/screens/FamilyScreen.tsx',
  'src/screens/WelcomeScreen.tsx',
  'src/screens/PlanScreen.tsx',
  'src/screens/OnboardingBlockScreen.tsx',
  'src/screens/SettingsScreen.tsx',
] as const;

function assertCleanCopy(parts: readonly unknown[]) {
  const text = parts
    .flatMap((part) => (Array.isArray(part) ? part : [part]))
    .filter((part): part is string => typeof part === 'string')
    .join(' ');
  expect(text).not.toMatch(BANNED_USER_COPY);
}

function productionSourceText(file: string): string {
  return readFileSync(join(process.cwd(), file), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/.*$/gm, ' ');
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
    assertCleanCopy(getExploreLibrary().sections.flatMap((section) => [section.title, section.body]));
    assertCleanCopy(getExtraSessionCards().flatMap((card) => Object.values(card)));
    assertCleanCopy(getMovementLadderCards().flatMap((card) => Object.values(card)));
    assertCleanCopy(
      getMovementLadderCards().flatMap((card) => {
        const detail = getMovementLadderDetail(card.id);
        return detail
          ? [
              detail.title,
              detail.body,
              detail.whyItMatters,
              detail.currentLevel.instructions,
              detail.currentLevel.setupNote,
              detail.currentLevel.safetyNote,
              detail.currentLevel.measurementNote,
              ...detail.levels.flatMap((level) => [
                level.name,
                level.equipmentLabel,
                level.measurementLabel,
                level.cameraLabel,
                level.instructions,
                level.setupNote,
                level.safetyNote,
                level.measurementNote,
              ]),
            ]
          : [];
      })
    );
    assertCleanCopy(
      getLearnCards().flatMap((card) => {
        const detail = getLearnDetail(card.id);
        return [card.title, card.body, ...(detail?.sections.flatMap((section) => [section.title, section.body]) ?? [])];
      })
    );
    assertCleanCopy(
      getHealthInsightCards().flatMap((card) => {
        const detail = getLearnDetail(card.id);
        return [
          card.title,
          card.body,
          card.categoryLabel,
          card.authorName,
          card.authorCredential,
          card.reviewedLabel,
          ...(detail?.sections.flatMap((section) => [section.title, section.body]) ?? []),
        ];
      })
    );
  });

  it('keeps result, progress, home, report, and family screen copy beta-safe', () => {
    const text = RESULT_COPY_FILES.map(productionSourceText).join(' ');
    expect(text).not.toMatch(BANNED_USER_COPY);
    expect(text).toMatch(/Home estimate|Beta home estimate/);
    expect(text).toMatch(/Suggested focus/);
    expect(text).toMatch(/Camera estimated/);
    expect(text).toMatch(/Sample estimate/);
    expect(text).not.toMatch(/Age \$\{domain\.ageLow\}|Typical age ranges|Movement age profile/);

    const appText = productionSourceText('App.tsx');
    expect(appText).toContain('Camera access is needed to estimate your movement.');
    expect(appText).not.toContain('Camera access is needed to measure your movement.');
  });
});
