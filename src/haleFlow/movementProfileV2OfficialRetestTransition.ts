import {
  LOCAL_USER_ID,
  makeTrainingSessionCompletion,
  markMovementBlockComplete,
  recordTrainingSessionCompletion,
  upsertMovementBlockReport,
  type AdherenceStoreState,
  type MovementBlock,
  type MovementProfileV2BlockReport,
  type MovementProfileV2RetestComparison,
  type TrainingSessionCompletion,
} from '../adherence';
import type { CheckUp } from '../checkup';
import type {
  MovementProfileV2Assessment,
  StoredMovementProfileV2Snapshot,
} from '../reference/movementProfileV2';
import { validateMovementProfileV2AssessmentSource } from '../reference/movementProfileV2';
import type { OfficialMovementProfileV2AssessmentRecord } from './checkupHistory';
import type { BlockScheduleState } from './blockSchedule';
import {
  materializeMovementProfileV2Block,
  movementProfileV2BlockIdForAssessment,
} from './movementProfileV2Block';
import {
  buildMovementProfileV2RetestComparison,
} from './movementProfileV2RetestComparison';
import {
  createMovementProfileV2BlockReport,
  isMovementProfileV2BlockReport,
} from './movementProfileV2BlockReport';

export interface MovementProfileV2RetestTransitionDiagnostic {
  code: string;
  blockId?: string;
  reportId?: string;
  checkUpId?: string;
  snapshotId?: string;
  assessmentId?: string;
}

export type MovementProfileV2OfficialRetestTransitionResult =
  | {
      status: 'ready';
      action: 'created' | 'reused' | 'resumed';
      comparison: MovementProfileV2RetestComparison;
      report: MovementProfileV2BlockReport;
      retestCompletion: TrainingSessionCompletion;
      completedPriorBlock: MovementBlock;
      nextBlock: MovementBlock;
      nextState: AdherenceStoreState;
      diagnostics: readonly MovementProfileV2RetestTransitionDiagnostic[];
    }
  | {
      status:
        | 'not_retest_due'
        | 'source_mismatch'
        | 'prior_artifact_invalid'
        | 'current_artifact_invalid'
        | 'active_block_conflict'
        | 'immutable_conflict'
        | 'next_block_ineligible'
        | 'unsupported_policy';
      diagnostics: readonly MovementProfileV2RetestTransitionDiagnostic[];
    };

export function transitionMovementProfileV2OfficialRetest(input: {
  priorState: AdherenceStoreState;
  priorBlock: MovementBlock;
  schedule: BlockScheduleState;
  priorArtifacts: OfficialMovementProfileV2AssessmentRecord;
  currentCheckUp: CheckUp;
  currentSnapshot: StoredMovementProfileV2Snapshot;
  currentAssessment: MovementProfileV2Assessment;
  explicitTransitionTimestamp: string;
  userId?: string;
}): MovementProfileV2OfficialRetestTransitionResult {
  const diagnostics: MovementProfileV2RetestTransitionDiagnostic[] = [];
  const expectedNextBlockId = movementProfileV2BlockIdForAssessment(input.currentAssessment.assessmentId);
  const retestAlreadyRecorded = input.priorState.completions.some(
    (completion) =>
      completion.blockId === input.priorBlock.id &&
      completion.sessionType === 'retest' &&
      completion.completedAt === input.explicitTransitionTimestamp
  );

  if (input.schedule.status !== 'retest_due' && !(input.schedule.status === 'block_completed' && retestAlreadyRecorded)) {
    return {
      status: 'not_retest_due',
      diagnostics: [{ code: 'v2_official_retest_not_due', blockId: input.priorBlock.id }],
    };
  }

  const priorValidation = validatePriorArtifacts(input.priorBlock, input.priorArtifacts);
  if (!priorValidation.ok) {
    return { status: priorValidation.status, diagnostics: priorValidation.diagnostics };
  }

  const currentSource = validateMovementProfileV2AssessmentSource({
    checkUp: input.currentCheckUp,
    checkupType: 'official_retest',
    snapshot: input.currentSnapshot,
    assessment: input.currentAssessment,
  });
  if (!currentSource.valid || input.currentAssessment.sourceCheckUpType !== 'official_retest') {
    return {
      status: 'current_artifact_invalid',
      diagnostics: [
        {
          code: 'v2_retest_current_artifact_invalid',
          checkUpId: input.currentCheckUp.startedAt,
          snapshotId: input.currentSnapshot.snapshotId,
          assessmentId: input.currentAssessment.assessmentId,
        },
      ],
    };
  }

  const activeConflict = input.priorState.blocks.find(
    (block) =>
      (block.status === 'active' || block.status === 'paused') &&
      block.id !== input.priorBlock.id &&
      block.id !== expectedNextBlockId
  );
  if (activeConflict) {
    return {
      status: 'active_block_conflict',
      diagnostics: [{ code: 'v2_retest_active_block_conflict', blockId: activeConflict.id }],
    };
  }

  const comparisonResult = buildMovementProfileV2RetestComparison({
    priorCheckUp: input.priorArtifacts.record.checkUp,
    priorSnapshot: input.priorArtifacts.snapshot,
    priorAssessment: input.priorArtifacts.assessment,
    currentCheckUp: input.currentCheckUp,
    currentSnapshot: input.currentSnapshot,
    currentAssessment: input.currentAssessment,
  });
  if (!comparisonResult.ok) {
    return {
      status: comparisonResult.reason === 'source_mismatch' ? 'source_mismatch' : 'current_artifact_invalid',
      diagnostics: [
        {
          code: `v2_retest_comparison_${comparisonResult.reason}`,
          checkUpId: input.currentCheckUp.startedAt,
        },
      ],
    };
  }

  const retestCompletion = makeTrainingSessionCompletion({
    block: input.priorBlock,
    sessionType: 'retest',
    completedAt: input.explicitTransitionTimestamp,
    plannedDate: 'retest',
    userId: input.userId ?? LOCAL_USER_ID,
  });
  const completionExisted = input.priorState.completions.some((completion) => completion.id === retestCompletion.id);
  let nextState = recordTrainingSessionCompletion(input.priorState, retestCompletion);
  nextState = markMovementBlockComplete(nextState, input.priorBlock.id, input.explicitTransitionTimestamp);
  const completedPriorBlock = nextState.blocks.find((block) => block.id === input.priorBlock.id);
  if (!completedPriorBlock) {
    return {
      status: 'prior_artifact_invalid',
      diagnostics: [{ code: 'v2_retest_prior_block_missing_after_completion', blockId: input.priorBlock.id }],
    };
  }

  const nextBlockExisted = nextState.blocks.some((block) => block.id === expectedNextBlockId);
  const nextBlockResult = materializeMovementProfileV2Block({
    adherence: nextState,
    checkUp: input.currentCheckUp,
    checkupType: 'official_retest',
    snapshot: input.currentSnapshot,
    assessment: input.currentAssessment,
    userId: input.userId ?? LOCAL_USER_ID,
    startDate: input.explicitTransitionTimestamp,
  });
  if (!nextBlockResult.ok) {
    if (nextBlockResult.reason === 'v2_block_active_block_conflict') {
      return {
        status: 'active_block_conflict',
        diagnostics: [{ code: nextBlockResult.reason, blockId: nextBlockResult.existingBlockId }],
      };
    }
    if (nextBlockResult.reason === 'v2_block_immutable_conflict') {
      return {
        status: 'immutable_conflict',
        diagnostics: [{ code: nextBlockResult.reason, blockId: nextBlockResult.existingBlockId }],
      };
    }
    return {
      status: 'next_block_ineligible',
      diagnostics: [{ code: nextBlockResult.reason, blockId: nextBlockResult.expectedBlockId }],
    };
  }
  nextState = nextBlockResult.adherence;

  const reportResult = createMovementProfileV2BlockReport({
    priorBlock: completedPriorBlock,
    schedule: input.schedule,
    comparison: comparisonResult.comparison,
    nextBlock: nextBlockResult.block,
    createdAt: input.explicitTransitionTimestamp,
    userId: input.userId ?? LOCAL_USER_ID,
  });
  if (!reportResult.ok) {
    return {
      status: 'unsupported_policy',
      diagnostics: [{ code: `v2_retest_report_${reportResult.reason}`, blockId: input.priorBlock.id }],
    };
  }
  const existingReport = input.priorState.reports.find((report) => report.id === reportResult.report.id);
  if (existingReport) {
    if (!isMovementProfileV2BlockReport(existingReport) || existingReport.reportFingerprint !== reportResult.report.reportFingerprint) {
      return {
        status: 'immutable_conflict',
        diagnostics: [{ code: 'v2_retest_report_immutable_conflict', reportId: existingReport.id }],
      };
    }
  }
  nextState = upsertMovementBlockReport(nextState, reportResult.report);

  return {
    status: 'ready',
    action: existingReport && nextBlockExisted && completionExisted
      ? 'reused'
      : existingReport || nextBlockExisted || completionExisted
        ? 'resumed'
        : 'created',
    comparison: comparisonResult.comparison,
    report: reportResult.report,
    retestCompletion,
    completedPriorBlock,
    nextBlock: nextBlockResult.block,
    nextState,
    diagnostics,
  };
}

function validatePriorArtifacts(
  block: MovementBlock,
  record: OfficialMovementProfileV2AssessmentRecord
):
  | { ok: true }
  | {
      ok: false;
      status: 'source_mismatch' | 'prior_artifact_invalid';
      diagnostics: MovementProfileV2RetestTransitionDiagnostic[];
    } {
  const origin = block.origin;
  if (origin?.kind !== 'movement_profile_v2_assessment') {
    return {
      ok: false,
      status: 'source_mismatch',
      diagnostics: [{ code: 'v2_retest_prior_block_not_v2', blockId: block.id }],
    };
  }
  if (!block.focus) {
    return {
      ok: false,
      status: 'prior_artifact_invalid',
      diagnostics: [{ code: 'v2_retest_prior_block_missing_focus', blockId: block.id }],
    };
  }
  const matches =
    origin.sourceCheckUpId === record.record.checkUp.startedAt &&
    origin.sourceCheckUpId === record.snapshot.sourceCheckUpId &&
    origin.sourceCheckUpId === record.assessment.sourceCheckUpId &&
    origin.snapshotId === record.snapshot.snapshotId &&
    origin.snapshotFingerprint === record.snapshot.snapshotFingerprint &&
    origin.assessmentId === record.assessment.assessmentId &&
    origin.assessmentFingerprint === record.assessment.assessmentFingerprint &&
    record.assessment.sourceSnapshotId === record.snapshot.snapshotId &&
    record.assessment.sourceSnapshotFingerprint === record.snapshot.snapshotFingerprint;
  if (!matches) {
    return {
      ok: false,
      status: 'prior_artifact_invalid',
      diagnostics: [{ code: 'v2_retest_prior_artifact_binding_mismatch', blockId: block.id }],
    };
  }
  return { ok: true };
}
