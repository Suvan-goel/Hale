import type {
  MovementBlock,
  MovementBlockFocus,
  MovementDomain,
  TrainingPrimaryDomain,
} from './types';

const MOVEMENT_DOMAINS: readonly MovementDomain[] = ['strength_power', 'balance', 'mobility'];
const TRAINING_PRIMARY_DOMAINS: readonly TrainingPrimaryDomain[] = [
  'strength_power',
  'balance_stability',
  'mobility_flexibility',
];

export function isMovementDomain(value: unknown): value is MovementDomain {
  return MOVEMENT_DOMAINS.includes(value as MovementDomain);
}

export function isTrainingPrimaryDomain(value: unknown): value is TrainingPrimaryDomain {
  return TRAINING_PRIMARY_DOMAINS.includes(value as TrainingPrimaryDomain);
}

export function movementDomainToTrainingPrimaryDomain(domain: MovementDomain): TrainingPrimaryDomain {
  if (domain === 'balance') return 'balance_stability';
  if (domain === 'mobility') return 'mobility_flexibility';
  return 'strength_power';
}

export function trainingPrimaryDomainToMovementDomain(domain: TrainingPrimaryDomain): MovementDomain {
  if (domain === 'balance_stability') return 'balance';
  if (domain === 'mobility_flexibility') return 'mobility';
  return 'strength_power';
}

export function normalizeMovementBlockFocus(block: MovementBlock | null | undefined): MovementBlockFocus | null {
  if (!block) return null;
  if (isMovementDomain(block.focusDomain)) {
    return { kind: 'domain', domain: block.focusDomain };
  }
  if (block.focus?.kind === 'domain' && isMovementDomain(block.focus.domain)) {
    return { kind: 'domain', domain: block.focus.domain };
  }
  if (
    block.focus?.kind === 'balanced' &&
    typeof block.focus.balancedPolicyVersion === 'number' &&
    typeof block.focus.balancedPolicyFingerprint === 'string' &&
    block.focus.balancedPolicyFingerprint.length > 0
  ) {
    return {
      kind: 'balanced',
      balancedPolicyVersion: block.focus.balancedPolicyVersion,
      balancedPolicyFingerprint: block.focus.balancedPolicyFingerprint,
    };
  }
  return null;
}

export function movementBlockDomainFocus(block: MovementBlock | null | undefined): MovementDomain | null {
  const focus = normalizeMovementBlockFocus(block);
  return focus?.kind === 'domain' ? focus.domain : null;
}

export function movementBlockIsBalanced(block: MovementBlock | null | undefined): boolean {
  return normalizeMovementBlockFocus(block)?.kind === 'balanced';
}
