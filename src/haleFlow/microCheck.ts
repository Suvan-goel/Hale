import { movementBlockDomainFocus, type MovementBlock, type TrainingSessionCompletion } from '../adherence';
import type { BlockScheduleState } from './blockSchedule';
import { getMicroCheckCopy } from './copy';
import type { MicroCheckDefinition } from './types';
import {
  getBlockMicroCheckTarget,
  microCheckTypeForDomain,
  type BlockMicroCheckTarget,
} from './microCheckPolicy';

export * from './microCheckPolicy';

export function getMicroCheckForBlock(block: MovementBlock): MicroCheckDefinition | null {
  const focusDomain = movementBlockDomainFocus(block);
  if (!focusDomain) return null;
  const copy = getMicroCheckCopy(focusDomain);
  return {
    type: microCheckTypeForDomain(focusDomain),
    domain: focusDomain,
    title: copy.title,
    body: copy.body,
    estimatedSeconds: 60,
  };
}

export function getMicroCheckForTarget(
  target: Extract<BlockMicroCheckTarget, { status: 'available' }>
): MicroCheckDefinition {
  const copy = getMicroCheckCopy(target.targetDomain);
  return {
    type: target.microCheckType,
    domain: target.targetDomain,
    title: copy.title,
    body: copy.body,
    estimatedSeconds: 60,
  };
}

export function isMicroCheckDueForSchedule(
  schedule: BlockScheduleState | null | undefined,
  completions: readonly TrainingSessionCompletion[],
  block?: MovementBlock | null
): boolean {
  return getBlockMicroCheckTarget({ block, schedule, completions }).status === 'available';
}
