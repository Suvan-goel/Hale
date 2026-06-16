import type { MovementBlock } from '../adherence';
import { getMicroCheckCopy } from './copy';
import type { MicroCheckDefinition } from './types';

export function getMicroCheckForBlock(block: MovementBlock): MicroCheckDefinition {
  const type =
    block.focusDomain === 'balance'
      ? 'single-leg-balance'
      : block.focusDomain === 'mobility'
        ? 'mobility-reach'
        : 'chair-power';
  const copy = getMicroCheckCopy(block.focusDomain);
  return {
    type,
    domain: block.focusDomain,
    title: copy.title,
    body: copy.body,
    estimatedSeconds: 60,
  };
}
