import {
  movementBlockDomainFocus,
  movementBlockIsBalanced,
  type MovementBlock,
  type MovementDomain,
  type TrainingMicroCheckSlotMetadata,
  type TrainingSessionCompletion,
} from '../adherence';
import type { MicroCheckResult, MicroCheckType } from '../training';
import { deterministicFingerprint } from '../reference/movementProfileV2/fingerprint';
import {
  BLOCK_TRAINING_WEEK_COUNT,
  MAIN_PLAN_TEMPLATES_PER_WEEK,
  type BlockScheduleState,
} from './blockSchedule';

export const MICRO_CHECK_POLICY_VERSION = 1;
export const MICRO_CHECK_POLICY_FINGERPRINT = deterministicFingerprint('hale-micro-check-policy-v1', {
  dueWindow: 'current-schedule-week-after-first-credit-before-week-complete',
  completionCredit: 'optional-non-main-plan',
  slotIdentity: 'block-week-target-policy',
});

export const BALANCED_MICRO_CHECK_POLICY_VERSION = 1;
export const BALANCED_MICRO_CHECK_POLICY_FINGERPRINT = deterministicFingerprint('hale-balanced-micro-check-policy-v1', {
  week1: 'strength_power',
  week2: 'balance',
  week3: 'mobility',
  week4: 'official-retest-no-micro-check',
});

export type MicroCheckTargetSource = 'domain_focus' | 'balanced_schedule_rotation';

export type BlockMicroCheckUnavailableReason =
  | 'no_active_block'
  | 'schedule_unavailable'
  | 'week_not_started'
  | 'week_complete'
  | 'training_complete'
  | 'retest_due'
  | 'block_completed'
  | 'balanced_week_4_official_retest'
  | 'slot_already_completed'
  | 'target_ineligible'
  | 'invalid_block_focus';

export type BlockMicroCheckTarget =
  | {
      status: 'available';
      blockId: string;
      scheduleWeekIndex: number;
      scheduleWeekNumber: number;
      targetSource: MicroCheckTargetSource;
      targetDomain: MovementDomain;
      microCheckType: MicroCheckType;
      slotId: string;
      policyVersion: typeof MICRO_CHECK_POLICY_VERSION;
      policyFingerprint: typeof MICRO_CHECK_POLICY_FINGERPRINT;
      balancedPolicyVersion?: typeof BALANCED_MICRO_CHECK_POLICY_VERSION;
      balancedPolicyFingerprint?: typeof BALANCED_MICRO_CHECK_POLICY_FINGERPRINT;
    }
  | {
      status: 'not_available';
      reason: BlockMicroCheckUnavailableReason;
      blockId?: string;
      scheduleWeekIndex?: number;
      scheduleWeekNumber?: number;
    };

export interface BlockMicroCheckTargetInput {
  block?: MovementBlock | null;
  schedule?: BlockScheduleState | null;
  completions?: readonly TrainingSessionCompletion[];
  eligibleTypes?: Partial<Record<MicroCheckType, boolean>>;
}

export function getBlockMicroCheckTarget(input: BlockMicroCheckTargetInput): BlockMicroCheckTarget {
  const block = input.block ?? null;
  if (!block) return { status: 'not_available', reason: 'no_active_block' };

  const schedule = input.schedule ?? null;
  if (!schedule || schedule.blockId !== block.id) {
    return { status: 'not_available', reason: 'schedule_unavailable', blockId: block.id };
  }

  const base = {
    blockId: block.id,
    scheduleWeekIndex: schedule.currentWeekIndex,
    scheduleWeekNumber: schedule.currentWeekNumber,
  };

  if (schedule.status === 'block_completed') return { status: 'not_available', reason: 'block_completed', ...base };
  if (schedule.status === 'retest_due') return { status: 'not_available', reason: 'retest_due', ...base };
  if (schedule.status === 'training_complete_waiting_retest') {
    return { status: 'not_available', reason: 'training_complete', ...base };
  }
  if (schedule.status === 'week_complete_waiting') return { status: 'not_available', reason: 'week_complete', ...base };
  if (schedule.status !== 'session_due') return { status: 'not_available', reason: 'schedule_unavailable', ...base };
  if (schedule.currentWeekIndex < 0 || schedule.currentWeekIndex >= BLOCK_TRAINING_WEEK_COUNT) {
    return { status: 'not_available', reason: 'schedule_unavailable', ...base };
  }
  if (schedule.creditedTemplateIds.length === 0) return { status: 'not_available', reason: 'week_not_started', ...base };
  if (schedule.creditedTemplateIds.length >= Math.max(MAIN_PLAN_TEMPLATES_PER_WEEK, schedule.requiredTemplateIds.length)) {
    return { status: 'not_available', reason: 'week_complete', ...base };
  }

  const domainTarget = targetForBlockAndWeek(block, schedule.currentWeekIndex);
  if (domainTarget.status === 'not_available') return { ...domainTarget, ...base };

  const microCheckType = microCheckTypeForDomain(domainTarget.targetDomain);
  if (input.eligibleTypes?.[microCheckType] === false) {
    return { status: 'not_available', reason: 'target_ineligible', ...base };
  }

  const slotId = microCheckSlotId({
    blockId: block.id,
    scheduleWeekIndex: schedule.currentWeekIndex,
    scheduleWeekNumber: schedule.currentWeekNumber,
    targetDomain: domainTarget.targetDomain,
    microCheckType,
    targetSource: domainTarget.targetSource,
  });

  if (microCheckSlotCompleted(input.completions ?? [], slotId)) {
    return { status: 'not_available', reason: 'slot_already_completed', ...base };
  }

  return {
    status: 'available',
    ...base,
    targetSource: domainTarget.targetSource,
    targetDomain: domainTarget.targetDomain,
    microCheckType,
    slotId,
    policyVersion: MICRO_CHECK_POLICY_VERSION,
    policyFingerprint: MICRO_CHECK_POLICY_FINGERPRINT,
    ...(domainTarget.targetSource === 'balanced_schedule_rotation'
      ? {
          balancedPolicyVersion: BALANCED_MICRO_CHECK_POLICY_VERSION,
          balancedPolicyFingerprint: BALANCED_MICRO_CHECK_POLICY_FINGERPRINT,
        }
      : {}),
  };
}

export function microCheckTypeForDomain(domain: MovementDomain): MicroCheckType {
  if (domain === 'balance') return 'single-leg-balance';
  if (domain === 'mobility') return 'mobility-reach';
  return 'chair-power';
}

export function domainForMicroCheckType(type: MicroCheckType): MovementDomain {
  if (type === 'single-leg-balance') return 'balance';
  if (type === 'mobility-reach') return 'mobility';
  return 'strength_power';
}

export function microCheckSlotMetadataFromTarget(target: Extract<BlockMicroCheckTarget, { status: 'available' }>): TrainingMicroCheckSlotMetadata {
  return {
    slotId: target.slotId,
    policyVersion: target.policyVersion,
    policyFingerprint: target.policyFingerprint,
    targetSource: target.targetSource,
    targetDomain: target.targetDomain,
    microCheckType: target.microCheckType,
    scheduleWeekIndex: target.scheduleWeekIndex,
    scheduleWeekNumber: target.scheduleWeekNumber,
  };
}

export function attachMicroCheckTargetMetadata(
  result: MicroCheckResult,
  target: Extract<BlockMicroCheckTarget, { status: 'available' }>,
  completedAt: string
): MicroCheckResult {
  return {
    ...result,
    id: target.slotId,
    slotId: target.slotId,
    blockId: target.blockId,
    completedAt,
    policyVersion: target.policyVersion,
    policyFingerprint: target.policyFingerprint,
    targetSource: target.targetSource,
    targetDomain: target.targetDomain,
    scheduleWeekIndex: target.scheduleWeekIndex,
    scheduleWeekNumber: target.scheduleWeekNumber,
  };
}

export function microCheckSlotCompleted(
  completions: readonly TrainingSessionCompletion[],
  slotId: string
): boolean {
  return completions.some((completion) => completion.sessionType === 'micro_check' && completion.microCheckSlot?.slotId === slotId);
}

function targetForBlockAndWeek(
  block: MovementBlock,
  scheduleWeekIndex: number
):
  | { status: 'available'; targetSource: MicroCheckTargetSource; targetDomain: MovementDomain }
  | { status: 'not_available'; reason: BlockMicroCheckUnavailableReason } {
  const focusDomain = movementBlockDomainFocus(block);
  if (focusDomain) return { status: 'available', targetSource: 'domain_focus', targetDomain: focusDomain };

  if (movementBlockIsBalanced(block)) {
    if (scheduleWeekIndex === 0) {
      return { status: 'available', targetSource: 'balanced_schedule_rotation', targetDomain: 'strength_power' };
    }
    if (scheduleWeekIndex === 1) {
      return { status: 'available', targetSource: 'balanced_schedule_rotation', targetDomain: 'balance' };
    }
    if (scheduleWeekIndex === 2) {
      return { status: 'available', targetSource: 'balanced_schedule_rotation', targetDomain: 'mobility' };
    }
    return { status: 'not_available', reason: 'balanced_week_4_official_retest' };
  }

  return { status: 'not_available', reason: 'invalid_block_focus' };
}

function microCheckSlotId(input: {
  blockId: string;
  scheduleWeekIndex: number;
  scheduleWeekNumber: number;
  targetSource: MicroCheckTargetSource;
  targetDomain: MovementDomain;
  microCheckType: MicroCheckType;
}): string {
  return [
    'micro-check',
    input.blockId,
    `week-${input.scheduleWeekNumber}`,
    input.targetSource,
    input.targetDomain,
    input.microCheckType,
    `policy-${MICRO_CHECK_POLICY_VERSION}`,
    MICRO_CHECK_POLICY_FINGERPRINT,
  ]
    .map(encodeSlotPart)
    .join(':');
}

function encodeSlotPart(value: string | number): string {
  return encodeURIComponent(String(value));
}
