import {
  isTrainingPrimaryDomain,
  movementBlockDomainFocus,
  movementBlockIsBalanced,
  movementDomainToTrainingPrimaryDomain,
  trainingPrimaryDomainToMovementDomain,
  type MovementBlock,
  type MovementDomain,
  type TrainingPrimaryDomain,
} from '../adherence';
import {
  createBalancedSessionTemplates,
  createSessionTemplatesForFocus,
  MOVEMENT_PROFILE_V2_BALANCED_TEMPLATE_POLICY_FINGERPRINT,
  MOVEMENT_PROFILE_V2_BALANCED_TEMPLATE_POLICY_VERSION,
  type SessionTemplate,
  type TrainingDomain,
} from '../training';

export {
  MOVEMENT_PROFILE_V2_BALANCED_TEMPLATE_POLICY_FINGERPRINT,
  MOVEMENT_PROFILE_V2_BALANCED_TEMPLATE_POLICY_VERSION,
};

export function sessionTemplatesForMovementBlock(block: MovementBlock): SessionTemplate[] {
  if (movementBlockIsBalanced(block)) return createBalancedSessionTemplates(block.id);
  return createSessionTemplatesForFocus(plannedPrimaryDomainForMovementBlock(block));
}

export function plannedPrimaryDomainForMovementBlock(block: MovementBlock): TrainingPrimaryDomain {
  const domain = movementBlockDomainFocus(block);
  if (!domain) throw new Error(`Movement block has no domain focus: ${block.id}`);
  return movementDomainToTrainingPrimaryDomain(domain);
}

export function plannedPrimaryDomainForBlockSession(
  block: MovementBlock,
  templateId?: string | null
): TrainingPrimaryDomain | null {
  if (movementBlockIsBalanced(block)) {
    const template = sessionTemplatesForMovementBlock(block).find((item) => item.id === templateId);
    return template?.focusDomain ?? null;
  }
  return plannedPrimaryDomainForMovementBlock(block);
}

export function plannedPrimaryMovementDomainForBlockSession(
  block: MovementBlock,
  templateId?: string | null
): MovementDomain | null {
  const domain = plannedPrimaryDomainForBlockSession(block, templateId);
  return domain ? trainingPrimaryDomainToMovementDomain(domain) : null;
}

export function movementDomainFromTrainingPrimaryDomain(domain: TrainingDomain): MovementDomain {
  return trainingPrimaryDomainToMovementDomain(domain);
}

export function isPlanningTrainingDomain(value: unknown): value is TrainingPrimaryDomain {
  return isTrainingPrimaryDomain(value);
}
