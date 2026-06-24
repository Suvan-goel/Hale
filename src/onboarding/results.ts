import type { MovementBlock, MovementDomain } from '../adherence';
import type { CheckUpScore, Domain } from '../scoring';
import type { TrainingDomain } from '../training';

export type OnboardingBand = 'starting_point' | 'building' | 'strong';

export interface OnboardingDomainSummary {
  key: 'strength_power' | 'balance_stability' | 'mobility_flexibility';
  title: string;
  band: OnboardingBand | 'baseline_pending';
}

export function onboardingDomainSummaries(score: CheckUpScore | null): OnboardingDomainSummary[] {
  const domain = (name: Domain) => score?.domains.find((d) => d.domain === name);
  return [
    {
      key: 'strength_power',
      title: 'Strength & Power',
      band: bandForDomain(domain('strength')),
    },
    {
      key: 'balance_stability',
      title: 'Balance',
      band: bandForDomain(domain('balance')),
    },
    {
      key: 'mobility_flexibility',
      title: 'Mobility',
      band: bandForDomain(domain('mobility')),
    },
  ];
}

export function onboardingFocusDomain(score: CheckUpScore | null): TrainingDomain {
  if (!score?.weakestDomain) return 'strength_power';
  return trainingDomainFromScoreDomain(score.weakestDomain);
}

export function plannedOnboardingFocusDomain({
  score,
  plannedBlock,
}: {
  score: CheckUpScore | null;
  plannedBlock?: Pick<MovementBlock, 'focusDomain'> | null;
}): TrainingDomain | null {
  if (plannedBlock?.focusDomain) return trainingDomainFromMovementDomain(plannedBlock.focusDomain);
  if (!score) return null;
  return onboardingFocusDomain(score);
}

export function movementFocusDomain(score: CheckUpScore | null): MovementDomain {
  const focus = onboardingFocusDomain(score);
  if (focus === 'balance_stability') return 'balance';
  if (focus === 'mobility_flexibility') return 'mobility';
  return 'strength_power';
}

export function onboardingFocusCopy(focus: TrainingDomain): string {
  if (focus === 'balance_stability') return 'Steadier on your feet';
  if (focus === 'mobility_flexibility') return 'Easier shoulder and hip movement';
  return 'Stronger legs for standing up';
}

export function blockFocusCopy(focus: TrainingDomain): string {
  if (focus === 'balance_stability') return 'Steadier on your feet';
  if (focus === 'mobility_flexibility') return 'Easier shoulder and hip movement';
  return 'Stronger legs for standing up';
}

export function bandLabel(band: OnboardingBand | 'baseline_pending'): string {
  if (band === 'strong') return 'Strong';
  if (band === 'building') return 'Building';
  if (band === 'starting_point') return 'Starting point';
  return 'Baseline pending';
}

function bandForDomain(domain: CheckUpScore['domains'][number] | undefined): OnboardingBand | 'baseline_pending' {
  if (!domain?.measured || !Number.isFinite(domain.ageLow) || !Number.isFinite(domain.ageHigh)) {
    return 'baseline_pending';
  }
  const mid = (domain.ageLow + domain.ageHigh) / 2;
  if (mid <= 58) return 'strong';
  if (mid <= 72) return 'building';
  return 'starting_point';
}

function trainingDomainFromScoreDomain(domain: Domain): TrainingDomain {
  if (domain === 'balance') return 'balance_stability';
  if (domain === 'mobility') return 'mobility_flexibility';
  return 'strength_power';
}

function trainingDomainFromMovementDomain(domain: MovementDomain): TrainingDomain {
  if (domain === 'balance') return 'balance_stability';
  if (domain === 'mobility') return 'mobility_flexibility';
  return 'strength_power';
}
