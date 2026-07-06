import type {
  MovementBlock,
  MovementBlockFocus,
  MovementBlockReport,
  MovementProfileV2BlockReport,
  MovementProfileV2RetestComparison,
} from '../adherence';
import type { BlockScheduleState } from './blockSchedule';
import { deterministicFingerprint } from '../reference/movementProfileV2/fingerprint';
import {
  parseMovementProfileV2RetestComparison,
} from './movementProfileV2RetestComparison';

import { BRAND } from '../brand';
export const MOVEMENT_PROFILE_V2_BLOCK_REPORT_SCHEMA_VERSION = 1 as const;
export const MOVEMENT_PROFILE_V2_BLOCK_REPORT_POLICY_VERSION = 1 as const;
export const MOVEMENT_PROFILE_V2_BLOCK_REPORT_POLICY_FINGERPRINT = deterministicFingerprint(
  'mpv2-block-report-policy-v1',
  {
    version: MOVEMENT_PROFILE_V2_BLOCK_REPORT_POLICY_VERSION,
    identity: 'block-report-<prior-block-id>',
    material: [
      'prior-block',
      'prior-v2-artifacts',
      'current-v2-artifacts',
      'claim-neutral-comparison',
      'schedule-summary',
      'next-block',
    ],
    noV1ScoreFields: true,
    noDirectionClaims: true,
  }
);

export type MovementProfileV2BlockReportResult =
  | { ok: true; report: MovementProfileV2BlockReport }
  | { ok: false; reason: 'invalid_comparison' | 'missing_prior_focus' | 'missing_next_focus' | 'fingerprint_invalid' };

export function createMovementProfileV2BlockReport(input: {
  priorBlock: MovementBlock;
  schedule: BlockScheduleState;
  comparison: MovementProfileV2RetestComparison;
  nextBlock: MovementBlock;
  createdAt: string;
  userId: string;
}): MovementProfileV2BlockReportResult {
  const parsedComparison = parseMovementProfileV2RetestComparison(input.comparison);
  if (!parsedComparison.ok) return { ok: false, reason: 'invalid_comparison' };
  const priorFocus = input.priorBlock.focus;
  if (!priorFocus) return { ok: false, reason: 'missing_prior_focus' };
  const nextFocus = input.nextBlock.focus;
  if (!nextFocus) return { ok: false, reason: 'missing_next_focus' };

  const reportBase: Omit<MovementProfileV2BlockReport, 'reportFingerprint'> = {
    kind: 'movement_profile_v2_block_report',
    schemaVersion: MOVEMENT_PROFILE_V2_BLOCK_REPORT_SCHEMA_VERSION,
    reportPolicyVersion: MOVEMENT_PROFILE_V2_BLOCK_REPORT_POLICY_VERSION,
    reportPolicyFingerprint: MOVEMENT_PROFILE_V2_BLOCK_REPORT_POLICY_FINGERPRINT,
    id: movementProfileV2BlockReportId(input.priorBlock.id),
    userId: input.userId,
    blockId: input.priorBlock.id,
    baselineAssessmentId: input.comparison.prior.assessmentId,
    retestAssessmentId: input.comparison.current.assessmentId,
    createdAt: input.createdAt,
    summary: 'You completed the plan and finished your next Movement Check-Up.',
    sessionsCompleted: input.schedule.totalCredits,
    totalPlannedSessions: input.priorBlock.totalPlannedSessions,
    microChecksCompleted: input.priorBlock.microChecksCompleted,
    priorBlock: {
      blockId: input.priorBlock.id,
      ...(input.priorBlock.blockFingerprint ? { blockFingerprint: input.priorBlock.blockFingerprint } : {}),
      focus: cloneFocus(priorFocus),
    },
    prior: input.comparison.prior,
    current: input.comparison.current,
    comparison: input.comparison,
    scheduleSummary: {
      trainingWeeks: 4,
      scheduleCredits: input.schedule.totalCredits,
      ...(input.schedule.credits[0]?.dateKey ? { firstCreditedDateKey: input.schedule.credits[0].dateKey } : {}),
      ...(input.schedule.lastCreditDateKey ? { finalCreditedDateKey: input.schedule.lastCreditDateKey } : {}),
      blockStartDate: input.priorBlock.startDate,
      ...(input.schedule.retestNotBeforeDateKey ? { retestEligibilityDateKey: input.schedule.retestNotBeforeDateKey } : {}),
    },
    priorSuggestedFocus: cloneFocus(priorFocus),
    currentSuggestedFocus: cloneFocus(nextFocus),
    nextBlock: {
      blockId: input.nextBlock.id,
      ...(input.nextBlock.blockFingerprint ? { blockFingerprint: input.nextBlock.blockFingerprint } : {}),
      focus: cloneFocus(nextFocus),
    },
    displayCopy: {
      headline: 'Your 4-week block is complete',
      body: 'You completed the plan and finished your next Movement Check-Up.',
      nextPlanTitle: 'Your next 4-week plan is ready',
      nextPlanBody: `${BRAND.appName} prepared it from your latest Movement Profile.`,
      nextPlanCta: 'View my next 4-week plan',
    },
    ...(nextFocus.kind === 'domain' ? { recommendedNextFocusDomain: nextFocus.domain } : {}),
  };

  return {
    ok: true,
    report: {
      ...reportBase,
      reportFingerprint: movementProfileV2BlockReportFingerprint(reportBase),
    },
  };
}

export function movementProfileV2BlockReportId(priorBlockId: string): string {
  return `block-report-${priorBlockId}`;
}

export function movementProfileV2BlockReportFingerprint(
  report: Omit<MovementProfileV2BlockReport, 'reportFingerprint'> | MovementProfileV2BlockReport
): string {
  const { reportFingerprint: _reportFingerprint, ...material } = report as MovementProfileV2BlockReport;
  return deterministicFingerprint('mpv2-block-report-v1', material);
}

export function parseMovementProfileV2BlockReport(value: unknown): MovementProfileV2BlockReportResult {
  if (!value || typeof value !== 'object') return { ok: false, reason: 'fingerprint_invalid' };
  const report = value as MovementProfileV2BlockReport;
  if (
    report.kind !== 'movement_profile_v2_block_report' ||
    report.schemaVersion !== MOVEMENT_PROFILE_V2_BLOCK_REPORT_SCHEMA_VERSION ||
    report.reportPolicyVersion !== MOVEMENT_PROFILE_V2_BLOCK_REPORT_POLICY_VERSION ||
    report.reportPolicyFingerprint !== MOVEMENT_PROFILE_V2_BLOCK_REPORT_POLICY_FINGERPRINT ||
    typeof report.id !== 'string' ||
    typeof report.blockId !== 'string' ||
    typeof report.createdAt !== 'string' ||
    typeof report.reportFingerprint !== 'string' ||
    !report.comparison ||
    !report.priorBlock ||
    !report.nextBlock
  ) {
    return { ok: false, reason: 'fingerprint_invalid' };
  }
  if (!parseMovementProfileV2RetestComparison(report.comparison).ok) {
    return { ok: false, reason: 'invalid_comparison' };
  }
  if (report.reportFingerprint !== movementProfileV2BlockReportFingerprint(report)) {
    return { ok: false, reason: 'fingerprint_invalid' };
  }
  return { ok: true, report };
}

export function isMovementProfileV2BlockReport(report: MovementBlockReport): report is MovementProfileV2BlockReport {
  return report.kind === 'movement_profile_v2_block_report';
}

function cloneFocus(focus: MovementBlockFocus): MovementBlockFocus {
  return focus.kind === 'domain'
    ? { kind: 'domain', domain: focus.domain }
    : {
        kind: 'balanced',
        balancedPolicyVersion: focus.balancedPolicyVersion,
        balancedPolicyFingerprint: focus.balancedPolicyFingerprint,
      };
}
