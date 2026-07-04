import { DEFAULT_BATTERY } from '../checkup';
import type { CheckUp, CheckUpItem } from '../types';
import type { MovementDomain } from '../../adherence/types';

const HEADLINE_RETRY_MOVEMENT_BY_DOMAIN: Record<MovementDomain, string> = {
  strength_power: 'chair-stand-30s',
  balance: 'balance-ladder',
  mobility: 'shoulder-flexion-peak',
};

export function retryBatteryForMissingHeadlineDomains(domains: readonly MovementDomain[]): string[] {
  const missing = domains.length > 0 ? domains : (['strength_power', 'balance', 'mobility'] as const);
  const out: string[] = [];
  for (const domain of missing) {
    const movementId = HEADLINE_RETRY_MOVEMENT_BY_DOMAIN[domain];
    if (movementId && !out.includes(movementId)) out.push(movementId);
  }
  return out;
}

export function mergeCheckUpRetry({
  baseCheckUp,
  retryCheckUp,
  retriedMovementIds,
}: {
  baseCheckUp: CheckUp;
  retryCheckUp: CheckUp;
  retriedMovementIds: readonly string[];
}): CheckUp {
  const retried = new Set(retriedMovementIds);
  const baseById = itemMap(baseCheckUp.items);
  const retryById = itemMap(retryCheckUp.items);
  const orderedIds = unique([
    ...DEFAULT_BATTERY,
    ...baseCheckUp.items.map((item) => item.movementId),
    ...retryCheckUp.items.map((item) => item.movementId),
  ]);

  const items: CheckUpItem[] = [];
  for (const movementId of orderedIds) {
    const selected = retried.has(movementId) ? retryById.get(movementId) : baseById.get(movementId);
    if (selected) items.push(selected);
  }

  return {
    startedAt: retryCheckUp.startedAt,
    bodyUnit: retryCheckUp.bodyUnit ?? baseCheckUp.bodyUnit,
    items,
  };
}

function itemMap(items: readonly CheckUpItem[]): Map<string, CheckUpItem> {
  const map = new Map<string, CheckUpItem>();
  for (const item of items) {
    if (!map.has(item.movementId)) map.set(item.movementId, item);
  }
  return map;
}

function unique(values: readonly string[]): string[] {
  const out: string[] = [];
  for (const value of values) {
    if (!out.includes(value)) out.push(value);
  }
  return out;
}

