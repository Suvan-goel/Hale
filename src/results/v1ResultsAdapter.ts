import type { MovementBlock } from '../adherence';
import type { AgeBand, MovementAssessment } from '../adherence';
import { getAssessmentResultState } from '../haleFlow/assessmentResultState';
import type { ExtraTrendPoint, MetricTrend, StoredCheckUp } from '../history';
import { computeTrends } from '../history';
import {
  DOMAIN_LABEL,
  type CheckUpScore,
  type DomainResult,
  selectFocusFromScore,
  type ScoreFocusSelection,
  type VersionedCheckUpScoreSnapshot,
} from '../scoring';
import {
  bandLabel,
  onboardingDomainSummaries,
  onboardingFocusCopy,
  onboardingFocusDomain,
  plannedOnboardingFocusDomain,
} from '../onboarding/results';
import type {
  UnifiedCheckUpResultsPresentation,
  UnifiedDomainResultCard,
  UnifiedResultDomainId,
} from './types';

export function buildV1StandardResultsPresentation(input: {
  history: StoredCheckUp[];
  assessment?: MovementAssessment | null;
  score?: CheckUpScore | null;
  scoreSnapshot?: VersionedCheckUpScoreSnapshot | null;
  age?: number | null;
  ageBand?: AgeBand | null;
  nextPlanReady?: boolean;
  showBackButton?: boolean;
  canViewPlan?: boolean;
  canRetake?: boolean;
  extraTrendPoints?: ExtraTrendPoint[];
}): UnifiedCheckUpResultsPresentation {
  const resultState = getAssessmentResultState({
    score: input.score ?? null,
    scoreSnapshot: input.scoreSnapshot,
    assessment: input.assessment,
  });
  const trends = computeTrends(input.history, input.extraTrendPoints ?? []).filter((trend) => trend.points.length >= 2);
  const focusSelection =
    input.scoreSnapshot?.focusSelection ??
    selectFocusFromScore(input.score ?? null, { activeFocusDomain: input.score?.weakestDomain });
  const focusDomain = focusSelection?.focusDomain ?? input.score?.weakestDomain ?? null;
  const focusLabel = focusDomain ? DOMAIN_LABEL[focusDomain] : null;
  const closelyMatched = focusSelection?.kind === 'exact_tie' || focusSelection?.kind === 'near_tie';
  const comparisonRange = ageComparisonRange(input.age ?? null, input.ageBand ?? null);
  const planIsReady = !!input.nextPlanReady && resultState.canCreateBlock && !!focusLabel;
  const recoveryTitle =
    resultState.recoveryTitle ?? 'Hale needs a clearer check-up to build your plan.';
  const recoveryBody =
    resultState.recoveryBody ??
    'Adjust the phone setup, turn on the main light if the room is dim, and retake the check-up when you are ready.';
  const domains = input.score
    ? input.score.domains.map((domain) => domainResultToPresentation(domain, comparisonRange))
    : emptyStoredDomains();
  const actions = [];
  if (input.showBackButton) {
    actions.push({
      id: 'done-back',
      label: 'Done',
      action: { type: 'done' as const },
      button: 'secondary' as const,
    });
  }
  if (planIsReady && input.canViewPlan) {
    actions.push({
      id: 'view-plan',
      label: 'View plan',
      action: { type: 'view_plan' as const },
      button: 'primary' as const,
    });
  }
  if (input.canRetake && resultState.canRetake) {
    actions.push({
      id: 'retry-checkup',
      label: 'Retake check-up',
      action: { type: 'retry_checkup' as const },
      button: planIsReady && input.canViewPlan ? 'secondary' as const : 'primary' as const,
    });
  }

  return {
    variant: 'standard',
    header: {
      eyebrow: 'Movement Check-Up',
      title: 'Your results',
      subtitle: planIsReady
        ? 'Your next plan is ready.'
        : resultState.canCreateBlock && focusLabel
          ? 'Hale found one clear place to focus next.'
          : 'Hale needs a clearer result before building your plan.',
      showBackButton: !!input.showBackButton,
      backAccessibilityLabel: 'Back to Progress',
    },
    focus: {
      kicker: planIsReady ? 'Next plan' : resultState.canCreateBlock && focusLabel ? 'Suggested focus' : 'Retake needed',
      title:
        resultState.canCreateBlock && focusLabel
          ? closelyMatched
            ? tiedDomainLabels(focusSelection)
            : focusLabel
          : recoveryTitle,
      body:
        planIsReady && focusLabel
          ? readyPlanFocusBody(focusLabel)
          : resultState.canCreateBlock && focusLabel
            ? closelyMatched
              ? `${focusLabel} is where your next plan will start. The other areas stay included.`
              : 'Your next plan will start here and still include the other areas.'
            : recoveryBody,
    },
    domainSection: {
      title: input.score ? 'The three areas' : 'Stored result',
      subtitle: input.score
        ? comparisonRange
          ? 'Beta estimates compared with your age group.'
          : 'Add your age range to compare with your age group.'
        : 'This check-up was saved before Hale started storing versioned beta estimate snapshots, so its interpretation is unavailable.',
    },
    domains: toDomainTuple(domains),
    plan: { status: planIsReady ? 'ready' : 'hidden' },
    trend: trends.length > 0 ? { title: 'Changes over time', body: trendSummaryCopy(trends) } : undefined,
    actions,
    accessibility: {
      screenSummary: 'Movement Check-Up results',
    },
  };
}

export function buildV1OnboardingResultsPresentation(input: {
  assessment?: MovementAssessment | null;
  score?: CheckUpScore | null;
  scoreSnapshot?: VersionedCheckUpScoreSnapshot | null;
  plannedBlock?: MovementBlock | null;
  userAge?: number | null;
}): UnifiedCheckUpResultsPresentation {
  const resultState = getAssessmentResultState({
    score: input.score ?? null,
    scoreSnapshot: input.scoreSnapshot,
    assessment: input.assessment,
  });
  const focusSelection =
    input.scoreSnapshot?.focusSelection ??
    selectFocusFromScore(input.score ?? null, { activeFocusDomain: input.score?.weakestDomain });
  const closelyMatched = focusSelection?.kind === 'exact_tie' || focusSelection?.kind === 'near_tie';
  const focus = resultState.canCreateBlock
    ? plannedOnboardingFocusDomain({ score: input.score ?? null, plannedBlock: input.plannedBlock })
    : null;
  const focusDiffersFromScore =
    !!focus && !!input.score && !!input.plannedBlock && focus !== onboardingFocusDomain(input.score);
  const summaries = input.score ? onboardingDomainSummaries(input.score, input.userAge) : [];
  const recoveryTitle =
    resultState.recoveryTitle ?? 'Hale needs a clearer check-up to build your plan.';
  const recoveryBody =
    resultState.recoveryBody ??
    'Adjust the phone setup, turn on the main light if the room is dim, and retake the check-up when you are ready.';
  const domains = summaries.map((domain) => ({
    id: domain.key,
    title: domain.title,
    metricLabel: '',
    metricValue: bandLabel(domain.band),
    interpretation: focus && domain.key === focus
      ? 'First focus'
      : closelyMatched && domainIsTied(domain.key, focusSelection)
        ? 'Close result'
        : 'Checked',
    statusLabel: focus && domain.key === focus
      ? 'First focus'
      : closelyMatched && domainIsTied(domain.key, focusSelection)
        ? 'Close result'
        : 'Checked',
    bandLabel: bandLabel(domain.band),
    featured: !!focus && domain.key === focus,
    detailActionAvailable: false,
    tone: 'neutral' as const,
    iconToken: iconTokenForDomainId(domain.key),
  }));

  return {
    variant: 'onboarding',
    header: {
      eyebrow: 'Check-up complete',
      title: 'Your starting point',
      subtitle: resultState.canCreateBlock
        ? 'Hale found one clear place to begin your first plan.'
        : 'Hale needs a clearer result before building your plan.',
    },
    focus: focus
      ? {
          kicker: 'First focus',
          title: onboardingFocusCopy(focus),
          body: closelyMatched && focusDiffersFromScore
            ? 'A few areas were close, so Hale chose the focus that best supports your goal.'
            : closelyMatched
              ? 'A few areas were close, so Hale chose one place to start.'
              : 'Your first plan will start here and still include the other areas.',
        }
      : {
          kicker: 'Retake needed',
          title: recoveryTitle,
          body: recoveryBody,
        },
    domains: toDomainTuple(domains.length > 0 ? domains : emptyStoredDomains()),
    plan: resultState.canCreateBlock
      ? {
          status: 'ready',
          title: 'What happens next',
          body: "Three guided sessions each week. In 4 weeks, you'll repeat the check-up and compare what changed.",
        }
      : { status: 'hidden' },
    actions: resultState.canCreateBlock
      ? [
          {
            id: 'complete-onboarding',
            label: 'See my plan',
            action: { type: 'complete_onboarding' },
            button: 'primary',
          },
          {
            id: 'retry-checkup',
            label: 'Retake check-up',
            action: { type: 'retry_checkup' },
            button: 'secondary',
          },
        ]
      : resultState.canRetake
        ? [
            {
              id: 'retry-checkup',
              label: 'Retake check-up',
              action: { type: 'retry_checkup' },
              button: 'primary',
            },
          ]
        : [
            {
              id: 'done',
              label: 'Done',
              action: { type: 'done' },
              button: 'primary',
            },
          ],
    accessibility: {
      screenSummary: 'Onboarding Movement Check-Up results',
    },
  };
}

function toDomainTuple(domains: UnifiedDomainResultCard[]): [
  UnifiedDomainResultCard,
  UnifiedDomainResultCard,
  UnifiedDomainResultCard,
] {
  return [
    domains[0] ?? emptyDomain('strength_power'),
    domains[1] ?? emptyDomain('balance_stability'),
    domains[2] ?? emptyDomain('mobility_flexibility'),
  ];
}

function domainResultToPresentation(
  domain: DomainResult,
  comparisonRange: AgeComparisonRange | null
): UnifiedDomainResultCard {
  const primaryMetric = primaryMetricForDomain(domain);
  const id = domain.domain === 'strength'
    ? 'strength_power'
    : domain.domain === 'balance'
      ? 'balance_stability'
      : 'mobility_flexibility';
  return {
    id,
    title: domain.label,
    metricLabel: primaryMetric?.label ?? '',
    metricValue: primaryMetric?.display ?? '',
    interpretation: domainAgeComparisonLabel(domain, comparisonRange),
    body: domainSimpleBody(domain),
    detailActionAvailable: false,
    tone: domain.measured ? 'neutral' : 'attention',
    iconToken: iconTokenForDomainId(id),
  };
}

function emptyStoredDomains(): UnifiedDomainResultCard[] {
  return [
    emptyDomain('strength_power'),
    emptyDomain('balance_stability'),
    emptyDomain('mobility_flexibility'),
  ];
}

function emptyDomain(id: UnifiedResultDomainId): UnifiedDomainResultCard {
  return {
    id,
    title: domainTitleForId(id),
    metricLabel: '',
    metricValue: 'Not available',
    interpretation: 'Needs a retake',
    body: 'Retake this section to estimate it.',
    detailActionAvailable: false,
    tone: 'attention',
    iconToken: iconTokenForDomainId(id),
  };
}

function domainTitleForId(id: UnifiedResultDomainId): string {
  if (id === 'strength_power') return 'Strength / Power';
  if (id === 'balance_stability') return 'Balance';
  return 'Mobility';
}

function iconTokenForDomainId(id: UnifiedResultDomainId): UnifiedDomainResultCard['iconToken'] {
  if (id === 'strength_power') return 'strength';
  if (id === 'balance_stability') return 'balance';
  return 'mobility';
}

function tiedDomainLabels(focusSelection: ScoreFocusSelection | null | undefined): string {
  if (!focusSelection) return '';
  return focusSelection.tiedDomains.map((domain) => DOMAIN_LABEL[domain]).join(' + ');
}

function readyPlanFocusBody(focusLabel: string): string {
  return `Your plan starts with ${focusLabel.toLowerCase()} and still includes the other areas.`;
}

function domainSimpleBody(domain: DomainResult): string {
  if (!domain.measured) return 'Retake this section to estimate it.';
  if (domain.domain === 'strength') return 'Measured from your chair stands.';
  if (domain.domain === 'balance') return 'Measured from your balance hold.';
  return 'Measured from your shoulder reach.';
}

function primaryMetricForDomain(domain: DomainResult): DomainResult['rows'][number] | null {
  const measuredRows = domain.rows.filter((row) => row.measured);
  if (domain.domain === 'strength') {
    return measuredRows.find((row) => /chair stands/i.test(row.label)) ?? measuredRows[0] ?? null;
  }
  if (domain.domain === 'balance') {
    return measuredRows.find((row) => /one-leg balance/i.test(row.label)) ?? measuredRows[0] ?? null;
  }
  return measuredRows.find((row) => /shoulder reach/i.test(row.label)) ?? measuredRows[0] ?? null;
}

type AgeComparisonRange = {
  low: number;
  high: number;
};

const AGE_BAND_COMPARISON_RANGES: Record<AgeBand, AgeComparisonRange> = {
  under_45: { low: 18, high: 44 },
  '45_54': { low: 45, high: 54 },
  '55_64': { low: 55, high: 64 },
  '65_74': { low: 65, high: 74 },
  '75_plus': { low: 75, high: 90 },
};

function ageComparisonRange(age: number | null, ageBand: AgeBand | null): AgeComparisonRange | null {
  if (ageBand) return AGE_BAND_COMPARISON_RANGES[ageBand];
  if (typeof age === 'number' && Number.isFinite(age)) {
    const rounded = Math.round(age);
    return { low: rounded, high: rounded };
  }
  return null;
}

function domainAgeComparisonLabel(domain: DomainResult, ageRange: AgeComparisonRange | null): string {
  if (!domain.measured || !Number.isFinite(domain.ageLow) || !Number.isFinite(domain.ageHigh)) {
    return 'Needs a retake';
  }
  if (!ageRange) return 'Add age range to compare';
  if (domain.ageHigh < ageRange.low) return 'Ahead of your age group';
  if (domain.ageLow > ageRange.high) return 'Could use support for your age group';
  return 'In range for your age group';
}

function trendSummaryCopy(trends: MetricTrend[]): string {
  if (trends.length === 0) {
    return 'Do another check-up later to see what is changing.';
  }
  const changed = trends.filter((trend) => Math.abs(trend.delta ?? 0) > 1e-9);
  if (changed.length === 0) {
    return 'No clear change yet.';
  }
  if (changed.length === 1) {
    return `${changed[0].label} changed since your last check-up.`;
  }
  return `${changed.length} measurements changed since your last check-up.`;
}

function domainIsTied(
  domain: UnifiedResultDomainId,
  focusSelection: ScoreFocusSelection | null | undefined
): boolean {
  if (!focusSelection) return false;
  if (domain === 'strength_power') return focusSelection.tiedDomains.includes('strength');
  if (domain === 'balance_stability') return focusSelection.tiedDomains.includes('balance');
  return focusSelection.tiedDomains.includes('mobility');
}
