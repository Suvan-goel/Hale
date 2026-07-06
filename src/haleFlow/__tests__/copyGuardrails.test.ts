import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getMicroCheckCopy } from '../copy';
import { controlledBetaEquipmentPositioning } from '../equipmentPositioning';
import {
  getTodayPrimaryAction,
  type HaleLifecycleState,
} from '../appLifecycle';
import {
  getExtraSessionCards,
  getHealthInsightCards,
  getLearnDetail,
} from '../exploreViewModel';
import {
  getPlanEmptyStateCopy,
  getPlanFocusCopy,
  getRetestCopy,
} from '../planViewModel';

const BANNED_USER_COPY =
  /diagnosis|treatment|fall risk|frailty|failed|skipped workout|lost streak|medical-grade|poor score|medical diagnosis|camera measured|typical of age|typical ages|movement age|weakest[- ]+(area|areas|domain)|published comparison|published age-group|published middle range|reference labels|raw-only|source transform|main opportunity|best place to focus|protects progress|protect your progress|protected your progress|progress protected|improved|held steady|declined/i;

const MISLEADING_EQUIPMENT_COPY =
  /no equipment needed|zero equipment|nothing but your phone|just your phone|only your phone|complete programme with only your phone|every workout needs no equipment|full-body strength without equipment|resistance band is never needed/i;

// 2026-07-05 menopause repositioning red lines. Claim-shaped patterns only:
// honest disclaimers ("does not measure bone density") must stay legal, so
// affirmative measurement/treatment claims are banned, not the bare words.
const MENOPAUSE_CLAIM_COPY =
  /fracture risk|osteoporosis|osteopenia|hormone replacement|\bHRT\b|bone density (score|test|result|reading)|(?<!not |never )(measures?|estimates?|tracks?|predicts?) (your )?(bone density|hormones?)|(treats?|relieves?|cures?|reverses?) (your )?menopause|menopause (treatment|therapy|cure)/i;

// 2026-07-06 reposition cognitive fence (REPOSITION_TDD §6, approved). Unlike
// the menopause list, the disease words are banned OUTRIGHT on every product
// surface — even reassurance or rule-out copy ("it's menopause, not dementia")
// is banned in all its forms, so no disclaimer-shaped exemption exists here.
//
// Approved claim shapes for anything fog-adjacent (the template for future copy):
//   - personal evidence:      "track how it changes as you train"
//   - mechanism-and-mediators: "the same training that rebuilds strength supports
//     the sleep and symptom relief linked to clearer thinking"
// Never: measuring fog objectively (no instrument exists), treatment/cure/reverse
// verbs, guaranteed cognitive outcomes, disease-risk framing, brain-training games.
const COGNITIVE_CLAIM_COPY =
  /dementia|alzheimer|(fights?|treats?|cures?|reverses?|fixes|eliminates?|beats?) (your )?(brain fog|mental fog|\bfog\b)|(clears?|clearing) (your )?(brain )?fog\b|guaranteed? (to )?(think|focus|remember|sharper|clearer)|(will|you'?ll) (think|feel) (sharper|clearer)|sharper (mind|memory) in \d|risk of (cognitive decline|memory loss)|(cognitive|memory) (decline|loss) risk|brain[- ]training|brain games?/i;

// Clarity self-report surfaces (REPOSITION_TDD §5.1): the word "validated" is
// banned there — the items are original self-report tracking, not a validated
// instrument. Every new Clarity copy file registers here in the PR that
// creates it, so no fog-adjacent string ever ships unscanned.
const CLARITY_SELF_REPORT_COPY_FILES: readonly string[] = [
  'src/checkup/selfReport.ts',
  'src/screens/ClarityCheckInScreen.tsx',
  'src/haleFlow/clarityTrend.ts',
  'src/screens/DualTaskScreen.tsx',
  'src/screens/FluencyConsentScreen.tsx',
];
const CLARITY_BANNED_COPY = /\bvalidated\b/i;

const RESULT_COPY_FILES = [
  'src/results/CheckUpResultsShell.tsx',
  'src/screens/ProgressScreen.tsx',
  'src/screens/AuthScreen.tsx',
  'src/screens/WelcomeScreen.tsx',
  'src/screens/PlanScreen.tsx',
  'src/screens/SettingsScreen.tsx',
  'src/screens/SafetyProfileScreen.tsx',
  'src/results/movementProfileV2ResultsAdapter.ts',
  'src/movementProfileV2/viewModel.ts',
  'src/haleFlow/microCheckSummary.ts',
] as const;

function assertCleanCopy(parts: readonly unknown[]) {
  const text = parts
    .flatMap((part) => (Array.isArray(part) ? part : [part]))
    .filter((part): part is string => typeof part === 'string')
    .join(' ');
  expect(text).not.toMatch(BANNED_USER_COPY);
  expect(text).not.toMatch(COGNITIVE_CLAIM_COPY);
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
    expect(text).not.toMatch(/Age \$\{domain\.ageLow\}|Typical age ranges|Movement age profile/);

    const appText = productionSourceText('App.tsx');
    // Source-level pin: copy interpolates the brand token (slice 2, 2026-07-06).
    expect(appText).toContain('Camera access lets ${BRAND.appName} estimate your movement');
    expect(appText).not.toContain('Camera access is needed to measure your movement.');
  });

  it('keeps menopause positioning wellness-side: no bone, hormone, or treatment claims', () => {
    const sourceText = [
      ...RESULT_COPY_FILES.map(productionSourceText),
      productionSourceText('src/haleFlow/exploreViewModel.ts'),
      productionSourceText('src/haleFlow/copy.ts'),
      productionSourceText('src/adherence/goalDomainMapping.ts'),
    ].join(' ');
    expect(sourceText).not.toMatch(MENOPAUSE_CLAIM_COPY);
    expect(
      getHealthInsightCards()
        .flatMap((card) => {
          const detail = getLearnDetail(card.id);
          return [card.title, card.body, ...(detail?.sections.flatMap((s) => [s.title, s.body]) ?? [])];
        })
        .join(' ')
    ).not.toMatch(MENOPAUSE_CLAIM_COPY);

    // The repositioning itself is pinned: Welcome leads with the menopause
    // frame, and the flagship article carries the founder-directed review
    // label (2026-07-05 decision).
    expect(productionSourceText('src/screens/WelcomeScreen.tsx')).toMatch(/menopause/i);
    expect(getLearnDetail('insight-menopause-muscle')?.reviewedLabel).toBe('Reviewed Jul 2026');
  });

  it('keeps every product surface clear of cognitive disease and fog-treatment claims', () => {
    const sourceText = [
      ...RESULT_COPY_FILES.map(productionSourceText),
      productionSourceText('src/haleFlow/exploreViewModel.ts'),
      productionSourceText('src/haleFlow/copy.ts'),
      productionSourceText('src/haleFlow/planViewModel.ts'),
      productionSourceText('src/haleFlow/appLifecycle.ts'),
      productionSourceText('src/adherence/goalDomainMapping.ts'),
      productionSourceText('src/adherence/adherenceCopy.ts'),
      productionSourceText('src/adherence/milestoneService.ts'),
      productionSourceText('src/adherence/screens/LifeGoalOnboardingScreen.tsx'),
      productionSourceText('src/screens/TodayScreen.tsx'),
      productionSourceText('src/screens/ManualCheckupStartScreen.tsx'),
      productionSourceText('src/audio/voiceSessionLineScripts.ts'),
      productionSourceText('src/training/safetyCueDefinitions.ts'),
      productionSourceText('App.tsx'),
    ].join(' ');
    expect(sourceText).not.toMatch(COGNITIVE_CLAIM_COPY);

    expect(
      getHealthInsightCards()
        .flatMap((card) => {
          const detail = getLearnDetail(card.id);
          return [card.title, card.body, ...(detail?.sections.flatMap((s) => [s.title, s.body]) ?? [])];
        })
        .join(' ')
    ).not.toMatch(COGNITIVE_CLAIM_COPY);
  });

  it('keeps Clarity self-report surfaces honest: self-reported tracking, never "validated"', () => {
    // Empty until slice 4 creates the check-in surfaces; each new Clarity copy
    // file MUST be added here in the PR that creates it (REPOSITION_TDD §6).
    for (const file of CLARITY_SELF_REPORT_COPY_FILES) {
      const text = productionSourceText(file);
      expect(text).not.toMatch(CLARITY_BANNED_COPY);
      expect(text).not.toMatch(COGNITIVE_CLAIM_COPY);
    }
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
