import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getMicroCheckCopy } from '../copy';
import { controlledBetaEquipmentPositioning } from '../equipmentPositioning';
import {
  getTodayPrimaryAction,
  type HaleLifecycleState,
} from '../appLifecycle';
import {
  getEquipmentSetupSummary,
  getExtraSessionCards,
  getHealthInsightCards,
  getLearnDetail,
} from '../exploreViewModel';
import {
  getPlanEmptyStateCopy,
  getPlanFocusCopy,
  getPlanSessionCategoryCopy,
  getRetestCopy,
} from '../planViewModel';

const BANNED_USER_COPY =
  /diagnosis|treatment|fall risk|frailty|failed|skipped workout|lost streak|medical-grade|poor score|medical diagnosis|camera measured|typical of age|typical ages|movement age|weakest[- ]+(area|areas|domain)|published comparison|published age-group|published middle range|reference labels|raw-only|source transform|main opportunity|best place to focus|protects progress|protect your progress|protected your progress|progress protected|improved|held steady|declined/i;

const MISLEADING_EQUIPMENT_COPY =
  /no equipment needed|zero equipment|nothing but your phone|just your phone|only your phone|complete programme with only your phone|every workout needs no equipment|full-body strength without equipment|resistance band is never needed/i;

const RESULT_COPY_FILES = [
  'src/results/CheckUpResultsShell.tsx',
  'src/screens/ProgressScreen.tsx',
  'src/screens/AuthScreen.tsx',
  'src/screens/WelcomeScreen.tsx',
  'src/screens/PlanScreen.tsx',
  'src/screens/OnboardingBlockScreen.tsx',
  'src/screens/SettingsScreen.tsx',
  'src/screens/SafetyProfileScreen.tsx',
  'src/results/movementProfileV2ResultsAdapter.ts',
  'src/movementProfileV2/viewModel.ts',
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
    assertCleanCopy(lifecycleStates.flatMap((state) => Object.values(getTodayPrimaryAction(state))));
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

  it('keeps result, progress, report, onboarding, plan, and settings screen copy beta-safe', () => {
    const text = RESULT_COPY_FILES.map(productionSourceText).join(' ');
    expect(text).not.toMatch(BANNED_USER_COPY);
    expect(text).toMatch(/compares your latest check-up result with your age group|Beta estimate|beta estimates/);
    expect(text).toMatch(/Your main focus|Suggested focus/);
    expect(productionSourceText('src/haleFlow/exploreViewModel.ts')).toMatch(/Camera estimated/);
    expect(text).not.toMatch(/Age \$\{domain\.ageLow\}|Typical age ranges|Movement age profile/);

    const appText = productionSourceText('App.tsx');
    expect(appText).toContain('Camera access lets Hale estimate your movement');
    expect(appText).not.toContain('Camera access is needed to measure your movement.');
  });

  it('keeps app equipment positioning centralized and truthful', () => {
    expect(controlledBetaEquipmentPositioning).toMatchObject({
      shortLabel: 'Minimal household setup',
      startingSetup: 'Start with a sturdy chair and a wall or counter for support.',
      specialistEquipment: 'No specialist gym equipment is needed to begin.',
    });
    expect(controlledBetaEquipmentPositioning.bandRecommendation).toMatch(/required for pulling exercises/i);
    expect(controlledBetaEquipmentPositioning.optionalSetup).toMatch(/only when you confirm/i);

    const source = [
      productionSourceText('src/screens/SettingsScreen.tsx'),
      productionSourceText('src/screens/SessionPreviewScreen.tsx'),
      productionSourceText('src/screens/TodayScreen.tsx'),
      ...Object.values(controlledBetaEquipmentPositioning),
    ].join(' ');
    expect(source).toMatch(/sturdy chair and a wall or counter/i);
    expect(source).toMatch(/resistance band is recommended/i);
    expect(source).not.toMatch(MISLEADING_EQUIPMENT_COPY);
  });

});
