import type { MovementBlock, MovementDomain } from '../adherence';
import type { CheckUpScore, Domain } from '../scoring';
import type { TrainingDomain } from '../training';

export type OnboardingBand = 'starting_point' | 'building' | 'strong';

export interface OnboardingDomainSummary {
  key: 'strength_power' | 'balance_stability' | 'mobility_flexibility';
  title: string;
  band: OnboardingBand | 'baseline_pending';
}

export function onboardingDomainSummaries(
  score: CheckUpScore | null,
  userAge?: number | null
): OnboardingDomainSummary[] {
  const domain = (name: Domain) => score?.domains.find((d) => d.domain === name);
  return [
    {
      key: 'strength_power',
      title: 'Strength & Power',
      band: bandForDomain(domain('strength'), userAge),
    },
    {
      key: 'balance_stability',
      title: 'Balance',
      band: bandForDomain(domain('balance'), userAge),
    },
    {
      key: 'mobility_flexibility',
      title: 'Mobility',
      band: bandForDomain(domain('mobility'), userAge),
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

function bandForDomain(
  domain: CheckUpScore['domains'][number] | undefined,
  userAge?: number | null
): OnboardingBand | 'baseline_pending' {
  if (!domain?.measured || !Number.isFinite(domain.ageLow) || !Number.isFinite(domain.ageHigh)) {
    return 'baseline_pending';
  }
  const mid = (domain.ageLow + domain.ageHigh) / 2;
  // Bands are read against the user's own age when known: a movement age a
  // little younger than you is strong, near/just above you is building.
  // Absolute cutoffs remain only as a fallback when no age was captured.
  if (typeof userAge === 'number' && Number.isFinite(userAge)) {
    if (mid <= userAge - 2) return 'strong';
    if (mid <= userAge + 8) return 'building';
    return 'starting_point';
  }
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
