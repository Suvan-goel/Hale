import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  defaultAdherenceStoreState,
  createLifeGoal,
  makeTrainingSessionCompletion,
  movementBlockDomainFocus,
  movementBlockIsBalanced,
  serializeAdherenceState,
  deserializeAdherenceState,
  type AdherenceStoreState,
  type MovementBlock,
  type MovementSafetyProfile,
  type TrainingFocusStimulusEvidenceSummary,
  type TrainingSessionCompletion,
} from '../../adherence';
import {
  createActiveShoulderReachV2Setup,
  createChairRiseV2Setup,
  createOneLegBalanceV2Setup,
} from '../../checkup/protocolSetup';
import { createCheckUpProtocolPolicy, MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID } from '../../checkup/protocolPolicy';
import type { CheckUp } from '../../checkup/types';
import { selectPublicMovementCheckUpLaunch } from '../../checkup/publicCheckUpEngine';
import { HISTORY_SCHEMA_VERSION, createMemoryFs, type StoredCheckUp } from '../../history';
import {
  ACTIVE_SHOULDER_REACH_V2_ID,
  type ActiveShoulderReachV2Result,
} from '../../movements/activeShoulderReachV2';
import { CHAIR_RISE_V2_ID, type ChairRiseV2Result } from '../../movements/chairRiseV2';
import { ONE_LEG_BALANCE_V2_ID, type OneLegBalanceV2Result } from '../../movements/oneLegBalanceV2';
import {
  createMovementProfileV2Assessment,
  createMovementProfileV2Snapshot,
  MOVEMENT_PROFILE_V2_FOCUS_POLICY_FINGERPRINT,
  MOVEMENT_PROFILE_V2_FOCUS_POLICY_VERSION,
  parseMovementProfileV2Assessment,
  type MovementProfileV2Assessment,
  type MovementProfileV2OfficialSourceCheckUpType,
  type MovementProfileV2ReferenceProfile,
  type StoredMovementProfileV2Snapshot,
} from '../../reference/movementProfileV2';
import { buildMovementProfileV2UnifiedResultsPresentation } from '../../results/movementProfileV2ResultsAdapter';
import { buildMovementProfileV2ResultsViewModel } from '../../movementProfileV2/viewModel';
import { buildHaleDataExport } from '../../services/backend/dataExportService';
import { clearLocalHaleData, type LocalFileArea } from '../../services/backend/accountDataService';
import { syncMovementCheckupToRemote } from '../../services/backend/checkupSyncService';
import { syncMovementBlockToRemote } from '../../services/backend/blockSyncService';
import { syncMovementBlockReportToRemote } from '../../services/backend/blockReportSyncService';
import { syncTrainingStateToRemote } from '../../services/backend/trainingStateSyncService';
import { getCurrentSession } from '../../services/backend/authService';
import { supabase } from '../../lib/supabase';
import { defaultPreferences } from '../../profile';
import { defaultTrainingState } from '../../training';
import { getHaleAppLifecycle } from '../appLifecycle';
import { getBlockScheduleState, type BlockScheduleState } from '../blockSchedule';
import type { OfficialMovementProfileV2AssessmentRecord } from '../checkupHistory';
import { requiredMainPlanTemplatesForBlock } from '../mainPlanEvents';
import { materializeMovementProfileV2Block } from '../movementProfileV2Block';
import {
  createMovementProfileV2BlockReport,
  parseMovementProfileV2BlockReport,
} from '../movementProfileV2BlockReport';
import { transitionMovementProfileV2OfficialRetest } from '../movementProfileV2OfficialRetestTransition';
import { getRetestCopy } from '../planViewModel';
import {
  getBlockReportSummaries,
  getRetestDueSummary,
} from '../progressViewModel';
import { requireHaleSessionPlan } from '../sessionPlanning';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('../../services/backend/authService', () => ({
  getCurrentSession: jest.fn(),
}));

const BASELINE_AT = '2026-06-01T08:00:00.000Z';
const BLOCK_START = '2026-06-01T09:00:00.000Z';
const RETEST_AT = '2026-06-29T08:00:00.000Z';
const RETEST_CREATED_AT = '2026-06-29T08:08:00.000Z';
const TRANSITION_AT = '2026-06-29T08:10:00.000Z';
const USER_ID = 'local-device-user';
const REFERENCE_PROFILE: MovementProfileV2ReferenceProfile = {
  ageAtTest: 62,
  ageBasis: 'exact_age_at_test',
  referenceSex: 'female',
};

describe('H4.1.1 Movement Profile V2 official retest continuation closure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getCurrentSession as jest.Mock).mockResolvedValue({ user: { id: USER_ID } });
  });

  it('verifies the policy-aligned focus matrix without fabricating Domain -> Balanced', () => {
    const priorDomain = materializedPackage({
      startedAt: BASELINE_AT,
      checkupType: 'baseline',
      balanceHoldSec: 8,
      createdAt: BASELINE_AT,
    });
    expect(priorDomain.assessment.focus).toMatchObject({ kind: 'domain', focusDomain: 'balance' });

    const ambiguousDomainRetest = materializedPackage({
      startedAt: RETEST_AT,
      checkupType: 'official_retest',
      chairReps: 12,
      balanceHoldSec: 32,
      shoulderPeakDeg: 151,
      createdAt: RETEST_CREATED_AT,
      priorFocus: priorDomain.assessment,
    });
    expect(ambiguousDomainRetest.assessment.focus).toMatchObject({
      kind: 'domain',
      focusDomain: 'balance',
      reason: 'v2_focus_preserve_current_no_clear_candidate',
    });
    expect(ambiguousDomainRetest.assessment.focus.kind).not.toBe('balanced');

    const clearDifferentDomainRetest = materializedPackage({
      startedAt: '2026-06-29T08:20:00.000Z',
      checkupType: 'official_retest',
      chairReps: 12,
      balanceHoldSec: 32,
      shoulderPeakDeg: 110,
      createdAt: '2026-06-29T08:28:00.000Z',
      priorFocus: priorDomain.assessment,
    });
    expect(clearDifferentDomainRetest.assessment.focus).toMatchObject({
      kind: 'domain',
      focusDomain: 'mobility',
    });

    const priorBlock = materializedBlock(priorDomain, { startDate: BLOCK_START });
    const due = dueState(priorBlock);
    const domainTransition = transitionFor(priorBlock, due, priorDomain.record, clearDifferentDomainRetest);
    expect(domainTransition.nextBlock.focus).toEqual({ kind: 'domain', domain: 'mobility' });
    expect(domainTransition.report.priorSuggestedFocus).toEqual({ kind: 'domain', domain: 'balance' });
    expect(domainTransition.report.currentSuggestedFocus).toEqual({ kind: 'domain', domain: 'mobility' });
    expect(domainTransition.report.comparison.overallStatus).toBe('comparable');
    expect(JSON.stringify(domainTransition.report).toLowerCase()).not.toMatch(
      /delta|percentage|percentile change|improved|declined|increased|decreased|better|worse|stronger|steadier|more mobile|younger|older|meaningful change|protected progress|passed|failed/
    );

    const priorBalanced = materializedPackage({
      startedAt: '2026-06-01T11:00:00.000Z',
      checkupType: 'baseline',
      chairReps: 12,
      balanceHoldSec: 32,
      shoulderPeakDeg: 151,
      createdAt: '2026-06-01T11:08:00.000Z',
    });
    const balancedBlock = materializedBlock(priorBalanced, { startDate: BLOCK_START });
    expect(movementBlockIsBalanced(balancedBlock)).toBe(true);
    expect(movementBlockDomainFocus(balancedBlock)).toBeNull();

    const balancedCurrent = materializedPackage({
      startedAt: '2026-06-29T11:00:00.000Z',
      checkupType: 'official_retest',
      chairReps: 12,
      balanceHoldSec: 32,
      shoulderPeakDeg: 151,
      createdAt: '2026-06-29T11:08:00.000Z',
      priorFocus: priorBalanced.assessment,
    });
    expect(balancedCurrent.assessment.focus.kind).toBe('balanced');
    const balancedTransition = transitionFor(
      balancedBlock,
      dueState(balancedBlock),
      priorBalanced.record,
      balancedCurrent,
      '2026-06-29T11:10:00.000Z'
    );
    expect(balancedTransition.nextBlock.focus?.kind).toBe('balanced');

    const balancedToDomain = materializedPackage({
      startedAt: '2026-06-29T12:00:00.000Z',
      checkupType: 'official_retest',
      chairReps: 12,
      balanceHoldSec: 8,
      shoulderPeakDeg: 151,
      createdAt: '2026-06-29T12:08:00.000Z',
      priorFocus: priorBalanced.assessment,
    });
    expect(balancedToDomain.assessment.focus).toMatchObject({ kind: 'domain', focusDomain: 'balance' });
    const balancedDomainTransition = transitionFor(
      balancedBlock,
      dueState(balancedBlock),
      priorBalanced.record,
      balancedToDomain,
      '2026-06-29T12:10:00.000Z'
    );
    expect(balancedDomainTransition.nextBlock.focus).toEqual({ kind: 'domain', domain: 'balance' });

    expect(MOVEMENT_PROFILE_V2_FOCUS_POLICY_VERSION).toBe(2);
    expect(MOVEMENT_PROFILE_V2_FOCUS_POLICY_FINGERPRINT).toMatch(/^mpv2-focus-policy-v2-/);
  });

  it('keeps transition replay and reachable partial states exactly-once or fail-closed', () => {
    const prior = materializedPackage({
      startedAt: BASELINE_AT,
      checkupType: 'baseline',
      balanceHoldSec: 8,
      createdAt: BASELINE_AT,
    });
    const priorBlock = materializedBlock(prior, { startDate: BLOCK_START });
    const due = dueState(priorBlock);
    const current = materializedPackage({
      startedAt: RETEST_AT,
      checkupType: 'official_retest',
      shoulderPeakDeg: 110,
      createdAt: RETEST_CREATED_AT,
      priorFocus: prior.assessment,
    });

    const created = transitionFor(priorBlock, due, prior.record, current);
    const scheduleAfterCompletion = getBlockScheduleState({
      block: created.completedPriorBlock,
      completions: created.nextState.completions,
      today: TRANSITION_AT,
    });
    const replayed = transitionFor(
      created.completedPriorBlock,
      { adherence: created.nextState, schedule: scheduleAfterCompletion },
      prior.record,
      current
    );
    expect(replayed.action).toBe('reused');
    expect(replayed.nextState.completions.filter((completion) => completion.sessionType === 'retest')).toHaveLength(1);
    expect(replayed.nextState.reports).toHaveLength(1);
    expect(replayed.report.reportFingerprint).toBe(created.report.reportFingerprint);

    const reportOnly = transitionFor(
      priorBlock,
      { adherence: { ...due.adherence, reports: [created.report] }, schedule: due.schedule },
      prior.record,
      current
    );
    expect(reportOnly.action).toBe('resumed');
    expect(reportOnly.nextState.reports).toHaveLength(1);
    expect(reportOnly.nextState.blocks.filter((block) => block.id === created.nextBlock.id)).toHaveLength(1);

    const priorCompleteNextMissingState = {
      ...created.nextState,
      blocks: [created.completedPriorBlock],
      reports: [],
    };
    const priorCompleteNextMissing = transitionFor(
      created.completedPriorBlock,
      {
        adherence: priorCompleteNextMissingState,
        schedule: getBlockScheduleState({
          block: created.completedPriorBlock,
          completions: priorCompleteNextMissingState.completions,
          today: TRANSITION_AT,
        }),
      },
      prior.record,
      current
    );
    expect(priorCompleteNextMissing.action).toBe('resumed');
    expect(priorCompleteNextMissing.completedPriorBlock.status).toBe('completed');
    expect(priorCompleteNextMissing.nextState.blocks.filter((block) => block.id === created.nextBlock.id)).toHaveLength(1);
    expect(priorCompleteNextMissing.report.id).toBe(created.report.id);

    const nextExistsReportMissingState = {
      ...created.nextState,
      reports: [],
    };
    const nextExistsReportMissing = transitionFor(
      created.completedPriorBlock,
      {
        adherence: nextExistsReportMissingState,
        schedule: getBlockScheduleState({
          block: created.completedPriorBlock,
          completions: nextExistsReportMissingState.completions,
          today: TRANSITION_AT,
        }),
      },
      prior.record,
      current
    );
    expect(nextExistsReportMissing.action).toBe('resumed');
    expect(nextExistsReportMissing.nextState.blocks.filter((block) => block.id === created.nextBlock.id)).toHaveLength(1);
    expect(nextExistsReportMissing.nextState.reports).toHaveLength(1);

    const conflictReport = { ...created.report, reportFingerprint: 'mpv2-block-report-v1-conflict' };
    const reportConflict = transitionMovementProfileV2OfficialRetest({
      priorState: { ...due.adherence, reports: [conflictReport] },
      priorBlock,
      schedule: due.schedule,
      priorArtifacts: prior.record,
      currentCheckUp: current.checkUp,
      currentSnapshot: current.snapshot,
      currentAssessment: current.assessment,
      explicitTransitionTimestamp: TRANSITION_AT,
      userId: USER_ID,
    });
    expect(reportConflict).toMatchObject({ status: 'immutable_conflict' });

    const blockConflict = transitionMovementProfileV2OfficialRetest({
      priorState: {
        ...due.adherence,
        blocks: [...due.adherence.blocks, { ...created.nextBlock, blockFingerprint: 'mpv2-block-v1-conflict' }],
      },
      priorBlock,
      schedule: due.schedule,
      priorArtifacts: prior.record,
      currentCheckUp: current.checkUp,
      currentSnapshot: current.snapshot,
      currentAssessment: current.assessment,
      explicitTransitionTimestamp: TRANSITION_AT,
      userId: USER_ID,
    });
    expect(blockConflict).toMatchObject({ status: 'immutable_conflict' });
  });

  it('keeps local restore, export, account clear, micro-check source, and read-only CTAs bounded', async () => {
    const prior = materializedPackage({
      startedAt: BASELINE_AT,
      checkupType: 'baseline',
      balanceHoldSec: 8,
      createdAt: BASELINE_AT,
    });
    const priorBlock = {
      ...materializedBlock(prior, { startDate: BLOCK_START }),
      microChecksCompleted: 3,
    };
    const due = dueState(priorBlock, microCheckCompletions(priorBlock, 3));
    const current = materializedPackage({
      startedAt: RETEST_AT,
      checkupType: 'official_retest',
      shoulderPeakDeg: 110,
      createdAt: RETEST_CREATED_AT,
      priorFocus: prior.assessment,
    });
    const transition = transitionFor(priorBlock, due, prior.record, current);
    expect(transition.report.microChecksCompleted).toBe(3);

    const regeneratedWithNoNextMicroChecks = createMovementProfileV2BlockReport({
      priorBlock: transition.completedPriorBlock,
      schedule: due.schedule,
      comparison: transition.comparison,
      nextBlock: { ...transition.nextBlock, microChecksCompleted: 99 },
      createdAt: TRANSITION_AT,
      userId: USER_ID,
    });
    expect(regeneratedWithNoNextMicroChecks.ok).toBe(true);
    if (!regeneratedWithNoNextMicroChecks.ok) throw new Error(regeneratedWithNoNextMicroChecks.reason);
    expect(regeneratedWithNoNextMicroChecks.report.microChecksCompleted).toBe(3);

    const restored = deserializeAdherenceState(serializeAdherenceState(transition.nextState));
    expect(restored?.reports).toHaveLength(1);
    expect(restored?.reports[0]).toMatchObject({
      kind: 'movement_profile_v2_block_report',
      reportFingerprint: transition.report.reportFingerprint,
    });
    expect(parseMovementProfileV2BlockReport(restored?.reports[0])).toMatchObject({ ok: true });
    expect(parseMovementProfileV2Assessment(current.assessment)).toMatchObject({ ok: true });

    const exported = buildHaleDataExport({
      exportedAt: '2026-06-30T12:00:00.000Z',
      user: { id: USER_ID, email: 'hale@example.com' },
      data: {
        profile: { id: USER_ID, freeTextHealthNotes: 'private note' },
        movementCheckups: [backendJson({
          raw_checkup_json: {
            checkUp: current.checkUp,
            video: 'raw-video',
            localPath: '/private/checkup.json',
            access_token: 'secret',
          },
        })],
        movementBlocks: [backendJson({ block_json: { movementBlock: transition.nextBlock } })],
        trainingState: {},
        trainingSessionCompletions: [],
        microChecks: [],
        movementBlockReports: [backendJson({
          report_json: {
            report: transition.report,
            landmarks: [1, 2, 3],
            image: 'raw-image',
            fileUri: 'file:///private/report.json',
          },
        })],
      },
    });
    const exportedText = JSON.stringify(exported);
    expect(exported.data.movementBlockReports[0]).toMatchObject({
      report_json: {
        report: expect.objectContaining({ kind: 'movement_profile_v2_block_report' }),
      },
    });
    expect(exportedText).not.toMatch(/raw-video|raw-image|landmarks|file:\/\/\/private|\/private\/checkup|secret/);

    const files = new Map<string, string>([
      ['checkup-2026-06-29T08-00-00-000Z.json', '{}'],
      ['adherence-state.json', JSON.stringify(transition.nextState)],
      ['notes.json', '{}'],
    ]);
    const recordings = memoryArea(new Set(['retest-recording.jsonl']));
    const clear = await clearLocalHaleData({ fs: createMemoryFs(files), recordings });
    expect(clear.deletedFiles).toEqual(expect.arrayContaining([
      'local Hale files/checkup-2026-06-29T08-00-00-000Z.json',
      'local Hale files/adherence-state.json',
      'recordings/retest-recording.jsonl',
    ]));
    expect(Array.from(files.keys())).toEqual(['notes.json']);

    const resultSource = source('src/results/movementProfileV2ResultsAdapter.ts');
    const reportSource = source('src/screens/MovementProfileV2BlockReportScreen.tsx');
    for (const uiSource of [resultSource, reportSource]) {
      expect(uiSource).not.toMatch(/materializeMovementProfileV2Block|transitionMovementProfileV2OfficialRetest|createMovementProfileV2BlockReport|upsertMovementBlockReport|syncMovementBlockReport|startSession|Build my plan/);
    }
    expect(reportSource).toContain('PrimaryButton title={report.displayCopy.nextPlanCta} onPress={onViewNextPlan}');

    const presentation = buildMovementProfileV2UnifiedResultsPresentation({
      viewModel: buildMovementProfileV2ResultsViewModel({
        snapshot: current.snapshot,
        assessment: current.assessment,
      }),
      planState: { status: 'ready', blockId: transition.nextBlock.id },
      retestComparison: transition.comparison,
    });
    expect(presentation.actions).toEqual([
      expect.objectContaining({ label: 'View my block report', action: { type: 'view_block_report' } }),
    ]);
    expect(transition.report.displayCopy.nextPlanCta).toBe('View my next 4-week plan');
  });

  it('keeps local lifecycle usable when each real remote H4 boundary fails and retry order changes', async () => {
    const prior = materializedPackage({
      startedAt: BASELINE_AT,
      checkupType: 'baseline',
      balanceHoldSec: 8,
      createdAt: BASELINE_AT,
    });
    const priorBlock = materializedBlock(prior, { startDate: BLOCK_START });
    const due = dueState(priorBlock);
    const current = materializedPackage({
      startedAt: RETEST_AT,
      checkupType: 'official_retest',
      shoulderPeakDeg: 110,
      createdAt: RETEST_CREATED_AT,
      priorFocus: prior.assessment,
    });
    const transition = transitionFor(priorBlock, due, prior.record, current);

    mockCheckupSyncFailure();
    await expect(syncMovementCheckupToRemote({
      checkUp: current.checkUp,
      checkupType: 'official_retest',
      movementProfileV2Snapshot: current.snapshot,
      movementProfileV2Assessment: current.assessment,
    })).resolves.toMatchObject({ status: 'failed', localCheckupId: current.checkUp.startedAt });

    mockBlockSyncFailure();
    await expect(syncMovementBlockToRemote({ block: transition.completedPriorBlock }))
      .resolves.toMatchObject({ status: 'failed', localBlockId: transition.completedPriorBlock.id });

    mockBlockSyncFailure();
    await expect(syncMovementBlockToRemote({ block: transition.nextBlock }))
      .resolves.toMatchObject({ status: 'failed', localBlockId: transition.nextBlock.id });

    mockReportSyncFailure();
    await expect(syncMovementBlockReportToRemote({
      report: transition.report,
      movementBlock: transition.completedPriorBlock,
      completions: transition.nextState.completions,
    })).resolves.toMatchObject({ status: 'failed', localReportId: transition.report.id });

    mockTrainingStateFailure();
    await expect(syncTrainingStateToRemote({ training: defaultTrainingState(), updatedAt: TRANSITION_AT }))
      .resolves.toMatchObject({ status: 'failed' });

    expect(transition.nextState.reports).toHaveLength(1);
    expect(transition.nextState.blocks.find((block) => block.id === transition.completedPriorBlock.id)?.status).toBe('completed');
    expect(transition.nextState.blocks.filter((block) => block.id === transition.nextBlock.id)).toHaveLength(1);
    expect(requireHaleSessionPlan({
      activeBlock: transition.nextBlock,
      training: defaultTrainingState(),
      safetyProfile: safetyProfile(),
      today: TRANSITION_AT,
    }).blockId).toBe(transition.nextBlock.id);

    const retryReverse = transitionFor(
      transition.completedPriorBlock,
      {
        adherence: {
          ...transition.nextState,
          reports: [...transition.nextState.reports].reverse(),
          blocks: [...transition.nextState.blocks].reverse(),
          completions: [...transition.nextState.completions].reverse(),
        },
        schedule: getBlockScheduleState({
          block: transition.completedPriorBlock,
          completions: transition.nextState.completions,
          today: TRANSITION_AT,
        }),
      },
      prior.record,
      current
    );
    expect(retryReverse.action).toBe('reused');
    expect(retryReverse.report.reportFingerprint).toBe(transition.report.reportFingerprint);
    expect(retryReverse.nextState.reports).toHaveLength(1);
  });

  it('keeps Today, Plan, Progress, Home, and direct action aligned across due, partial, and complete states', () => {
    const prior = materializedPackage({
      startedAt: BASELINE_AT,
      checkupType: 'baseline',
      balanceHoldSec: 8,
      createdAt: BASELINE_AT,
    });
    const priorBlock = materializedBlock(prior, { startDate: BLOCK_START });
    const due = dueState(priorBlock);
    const profile = {
      ...defaultPreferences().profile,
      name: 'Sam',
      age: 62,
      goal: 'Stay steady',
      lifeGoal: createLifeGoal({ category: 'independence', nowIso: BASELINE_AT }),
      safetyProfile: safetyProfile(),
    };
    const history = [prior.record.record];

    const dueLifecycle = getHaleAppLifecycle({
      profile,
      history,
      training: defaultTrainingState(),
      adherence: due.adherence,
      today: RETEST_AT,
    });
    expect(dueLifecycle.state).toBe('monthly_retest_due');
    expect(dueLifecycle.primaryAction.type).toBe('start_retest');
    expect(getRetestCopy(dueLifecycle.activeBlockSummary).due).toBe(true);
    expect(getRetestDueSummary({
      activeBlock: priorBlock,
      today: RETEST_AT,
      hasBaseline: true,
      completions: due.adherence.completions,
    })).toMatchObject({ due: true, ctaLabel: 'Start check-up' });
    expect(selectPublicMovementCheckUpLaunch({
      sourceType: 'official_retest',
      entryContext: 'standard',
      releaseEnabled: true,
      activeBlockOriginKind: priorBlock.origin?.kind ?? null,
      movementProfileV2OfficialRetestScheduleStatus: due.schedule.status,
      hasAcceptedMovementProfileV2OfficialRetestSourceArtifacts: true,
    })).toMatchObject({ status: 'ready', engine: 'unified_movement_profile' });

    const rawPendingLifecycle = getHaleAppLifecycle({
      profile,
      history: [...history, {
        schemaVersion: HISTORY_SCHEMA_VERSION,
        checkupType: 'official_retest',
        checkUp: v2CheckUp({ startedAt: RETEST_AT }),
        scoreSnapshotCompatibility: 'unsupported_checkup_protocol',
      }],
      training: defaultTrainingState(),
      adherence: due.adherence,
      today: RETEST_AT,
    });
    expect(rawPendingLifecycle.primaryAction.type).toBe('start_retest');

    const current = materializedPackage({
      startedAt: RETEST_AT,
      checkupType: 'official_retest',
      shoulderPeakDeg: 110,
      createdAt: RETEST_CREATED_AT,
      priorFocus: prior.assessment,
    });
    const transition = transitionFor(priorBlock, due, prior.record, current);
    const completeLifecycle = getHaleAppLifecycle({
      profile,
      history: [...history, current.record.record],
      training: defaultTrainingState(),
      adherence: transition.nextState,
      today: TRANSITION_AT,
    });
    expect(completeLifecycle.state).toBe('first_session_ready');
    expect(completeLifecycle.primaryAction.type).toBe('start_first_session');
    expect(getRetestCopy(completeLifecycle.activeBlockSummary).due).toBe(false);
    expect(getRetestDueSummary({
      activeBlock: transition.nextBlock,
      today: TRANSITION_AT,
      hasBaseline: true,
      completions: transition.nextState.completions,
    }).due).toBe(false);
    expect(getBlockReportSummaries({
      blocks: transition.nextState.blocks,
      reports: transition.nextState.reports,
      completions: transition.nextState.completions,
    })).toHaveLength(1);
    expect(selectPublicMovementCheckUpLaunch({
      sourceType: 'official_retest',
      entryContext: 'standard',
      releaseEnabled: true,
      activeBlockOriginKind: transition.nextBlock.origin?.kind ?? null,
      movementProfileV2OfficialRetestScheduleStatus: getBlockScheduleState({
        block: transition.nextBlock,
        completions: transition.nextState.completions,
        today: TRANSITION_AT,
      }).status,
      hasAcceptedMovementProfileV2OfficialRetestSourceArtifacts: true,
    })).toMatchObject({ status: 'unavailable', reason: 'v2_official_retest_not_due' });
    expect(selectPublicMovementCheckUpLaunch({
      sourceType: 'official_retest',
      entryContext: 'standard',
      releaseEnabled: false,
      activeBlockOriginKind: priorBlock.origin?.kind ?? null,
      movementProfileV2OfficialRetestScheduleStatus: due.schedule.status,
      hasAcceptedMovementProfileV2OfficialRetestSourceArtifacts: true,
    })).toMatchObject({ status: 'ready', engine: 'unified_movement_profile' });
  });
});

function materializedPackage(input: {
  startedAt: string;
  checkupType: MovementProfileV2OfficialSourceCheckUpType;
  createdAt: string;
  priorFocus?: MovementProfileV2Assessment;
  chairReps?: number;
  balanceHoldSec?: number;
  shoulderPeakDeg?: number;
}): {
  checkUp: CheckUp;
  snapshot: StoredMovementProfileV2Snapshot;
  assessment: MovementProfileV2Assessment;
  record: OfficialMovementProfileV2AssessmentRecord;
} {
  const checkUp = v2CheckUp({
    startedAt: input.startedAt,
    chair: chairResult({ reps: input.chairReps ?? 12 }),
    balance: balanceResult({ bestHoldSec: input.balanceHoldSec ?? 32 }),
    shoulder: shoulderResult({ peakFlexionDeg: input.shoulderPeakDeg ?? 151 }),
  });
  const snapshot = mustCreateSnapshot({ checkUp, checkupType: input.checkupType, createdAt: input.createdAt });
  const assessment = mustAssess({
    checkUp,
    snapshot,
    createdAt: input.createdAt,
    priorFocus: input.priorFocus,
  });
  return {
    checkUp: { ...checkUp, movementProfileV2Snapshot: snapshot, movementProfileV2Assessment: assessment },
    snapshot,
    assessment,
    record: officialRecord({ checkUp, checkupType: input.checkupType, snapshot, assessment }),
  };
}

function materializedBlock(
  pkg: ReturnType<typeof materializedPackage>,
  input: { startDate: string }
): MovementBlock {
  const block = materializeMovementProfileV2Block({
    adherence: defaultAdherenceStoreState(),
    checkUp: pkg.checkUp,
    checkupType: pkg.record.type,
    snapshot: pkg.snapshot,
    assessment: pkg.assessment,
    startDate: input.startDate,
    userId: USER_ID,
  });
  expect(block.ok).toBe(true);
  if (!block.ok) throw new Error(block.reason);
  return block.block;
}

function dueState(
  block: MovementBlock,
  extraCompletions: readonly TrainingSessionCompletion[] = []
): {
  adherence: AdherenceStoreState;
  schedule: BlockScheduleState;
} {
  const completions = [...creditedMainPlanCompletions(block), ...extraCompletions];
  const adherence = { ...defaultAdherenceStoreState(), blocks: [block], completions };
  const schedule = getBlockScheduleState({ block, completions, today: RETEST_AT });
  expect(schedule.status).toBe('retest_due');
  return { adherence, schedule };
}

function transitionFor(
  priorBlock: MovementBlock,
  due: { adherence: AdherenceStoreState; schedule: BlockScheduleState },
  priorArtifacts: OfficialMovementProfileV2AssessmentRecord,
  current: ReturnType<typeof materializedPackage>,
  explicitTransitionTimestamp = TRANSITION_AT
) {
  const result = transitionMovementProfileV2OfficialRetest({
    priorState: due.adherence,
    priorBlock,
    schedule: due.schedule,
    priorArtifacts,
    currentCheckUp: current.checkUp,
    currentSnapshot: current.snapshot,
    currentAssessment: current.assessment,
    explicitTransitionTimestamp,
    userId: USER_ID,
  });
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error(result.status);
  return result;
}

function officialRecord(input: {
  checkUp: CheckUp;
  checkupType: MovementProfileV2OfficialSourceCheckUpType;
  snapshot: StoredMovementProfileV2Snapshot;
  assessment: MovementProfileV2Assessment;
}): OfficialMovementProfileV2AssessmentRecord {
  const record: StoredCheckUp = {
    schemaVersion: HISTORY_SCHEMA_VERSION,
    checkUp: {
      ...input.checkUp,
      movementProfileV2Snapshot: input.snapshot,
      movementProfileV2Assessment: input.assessment,
    },
    checkupType: input.checkupType,
    scoreSnapshotCompatibility: 'unsupported_checkup_protocol',
    movementProfileV2Snapshot: input.snapshot,
    movementProfileV2SnapshotCompatibility: 'current',
    movementProfileV2Assessment: input.assessment,
    movementProfileV2AssessmentCompatibility: 'current',
  };
  return {
    record,
    type: input.checkupType,
    snapshot: input.snapshot,
    assessment: input.assessment,
  };
}

function mustCreateSnapshot(input: {
  checkUp: CheckUp;
  checkupType: MovementProfileV2OfficialSourceCheckUpType;
  createdAt: string;
}): StoredMovementProfileV2Snapshot {
  const created = createMovementProfileV2Snapshot({
    checkUp: input.checkUp,
    checkupType: input.checkupType,
    referenceProfile: REFERENCE_PROFILE,
    createdAt: input.createdAt,
  });
  expect(created.ok).toBe(true);
  if (!created.ok) throw new Error(created.reason);
  return created.snapshot;
}

function mustAssess(input: {
  checkUp: CheckUp;
  snapshot: StoredMovementProfileV2Snapshot;
  createdAt: string;
  priorFocus?: MovementProfileV2Assessment;
}): MovementProfileV2Assessment {
  const created = createMovementProfileV2Assessment({
    checkUp: input.checkUp,
    snapshot: input.snapshot,
    createdAt: input.createdAt,
    priorFocus: input.priorFocus,
  });
  expect(created.ok).toBe(true);
  if (!created.ok) throw new Error(created.reason);
  return created.assessment;
}

function v2CheckUp(input: {
  startedAt: string;
  chair?: ChairRiseV2Result;
  balance?: OneLegBalanceV2Result;
  shoulder?: ActiveShoulderReachV2Result;
}): CheckUp {
  return {
    startedAt: input.startedAt,
    protocolPolicy: createCheckUpProtocolPolicy(MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID, input.startedAt),
    bodyUnit: 1,
    items: [
      { movementId: CHAIR_RISE_V2_ID, status: 'measured', result: input.chair ?? chairResult() },
      { movementId: ONE_LEG_BALANCE_V2_ID, status: 'measured', result: input.balance ?? balanceResult() },
      { movementId: ACTIVE_SHOULDER_REACH_V2_ID, status: 'measured', result: input.shoulder ?? shoulderResult() },
    ],
  };
}

function chairResult(overrides: Partial<ChairRiseV2Result> = {}): ChairRiseV2Result {
  return {
    movementId: CHAIR_RISE_V2_ID,
    protocolPolicyId: MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
    evidenceStatus: 'reference_protocol_complete',
    setup: createChairRiseV2Setup({ confirmed: true }),
    setupConfidence: 'confirmed',
    practiceRepCompleted: true,
    activeWindowMs: 30000,
    activeMeasurementWindows: [{ startedAtMs: 0, endedAtMs: 30000, valid: true, reason: 'scheduled_active_window' }],
    fullStandRule: 'stand_completed_at_or_before_window_end',
    reps: 12,
    repStats: [],
    sessionMeanVel: 1.1,
    sessionMeanPeakVel: 1.4,
    pushOffDetected: false,
    fullStandAtExpiryCounted: false,
    invalidReasons: [],
    flags: [],
    interruptions: 0,
    ...overrides,
  };
}

function balanceResult(overrides: Partial<OneLegBalanceV2Result> = {}): OneLegBalanceV2Result {
  return {
    movementId: ONE_LEG_BALANCE_V2_ID,
    protocolPolicyId: MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
    evidenceStatus: 'reference_protocol_complete',
    setup: createOneLegBalanceV2Setup({ standingLeg: 'left', confirmed: true }),
    standingLeg: 'left',
    setupConfidence: 'confirmed',
    bestHoldSec: 32,
    bestTrialNumber: 1,
    validTrialCount: 3,
    attemptedTrialCount: 3,
    trials: [],
    rests: [],
    retryCount: 0,
    declinedRemainingTrials: false,
    hardCapReached: false,
    activeMeasurementWindows: [{ startedAtMs: 0, endedAtMs: 45000, valid: true, reason: 'trial_window' }],
    invalidReasons: [],
    flags: [],
    interruptions: 0,
    ...overrides,
  };
}

function shoulderResult(overrides: Partial<ActiveShoulderReachV2Result> = {}): ActiveShoulderReachV2Result {
  return {
    movementId: ACTIVE_SHOULDER_REACH_V2_ID,
    protocolPolicyId: MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
    evidenceStatus: 'reference_protocol_complete',
    setup: createActiveShoulderReachV2Setup({ selectedSide: 'right', confirmed: true }),
    selectedSide: 'right',
    setupConfidence: 'confirmed',
    peakFlexionDeg: 151,
    retryCount: 0,
    painLimited: false,
    validTrackingMs: 5000,
    activeMeasurementWindows: [{ startedAtMs: 0, endedAtMs: 9000, valid: true, reason: 'valid_capture' }],
    invalidReasons: [],
    flags: [],
    interruptions: 0,
    ...overrides,
  };
}

function creditedMainPlanCompletions(block: MovementBlock): TrainingSessionCompletion[] {
  const templateIds = requiredMainPlanTemplatesForBlock(block).templateIds;
  const dateKeys = [
    '2026-06-01',
    '2026-06-02',
    '2026-06-03',
    '2026-06-08',
    '2026-06-09',
    '2026-06-10',
    '2026-06-15',
    '2026-06-16',
    '2026-06-17',
    '2026-06-22',
    '2026-06-23',
    '2026-06-24',
  ];
  return dateKeys.map((dateKey, index) => {
    const templateId = templateIds[index % templateIds.length];
    return makeTrainingSessionCompletion({
      block,
      sessionType: 'standard',
      completedAt: `${dateKey}T09:00:00.000Z`,
      plannedDate: `${templateId}:${dateKey}`,
      source: 'block_generated',
      templateId,
      mainPlanCredit: true,
      focusStimulusEvidence: creditedFocusStimulusEvidence(block, templateId),
    });
  });
}

function microCheckCompletions(block: MovementBlock, count: number): TrainingSessionCompletion[] {
  return Array.from({ length: count }, (_, index) =>
    makeTrainingSessionCompletion({
      block,
      sessionType: 'micro_check',
      completedAt: `2026-06-${String(5 + index * 5).padStart(2, '0')}T09:30:00.000Z`,
      plannedDate: `micro-check-${index + 1}`,
      source: 'block_generated',
    })
  );
}

function creditedFocusStimulusEvidence(
  block: MovementBlock,
  templateId: string
): TrainingFocusStimulusEvidenceSummary {
  const exerciseId = `${templateId}-primary`;
  return {
    planStatus: 'eligible',
    status: 'credited_focus_work',
    exclusionReason: 'none',
    mainPlanCredit: true,
    blockFocusDomain: movementBlockDomainFocus(block) ?? undefined,
    plannedPrimaryFocusExerciseCount: 1,
    completedPrimaryFocusExerciseCount: 1,
    completedSupportingExerciseCount: 0,
    completedFallbackExerciseCount: 0,
    completedCrossDomainExerciseCount: 0,
    plannedPrimaryFocusExerciseIds: [exerciseId],
    completedPrimaryFocusExerciseIds: [exerciseId],
    completedSupportingExerciseIds: [],
    completedFallbackExerciseIds: [],
    completedCrossDomainExerciseIds: [],
    fallbackFocusSlotIds: [],
    skippedFocusSlotIds: [],
    focusStimulusExclusionReasons: [],
    missingMetadataExerciseIds: [],
    malformedMetadataExerciseIds: [],
    focusMismatchExerciseIds: [],
  };
}

function safetyProfile(): MovementSafetyProfile {
  return {
    id: 'safety-1',
    userId: USER_ID,
    age: 62,
    activityLevel: 'lightly_active',
    feelsSafeStandingFromChair: true,
    feelsSafeBalancing: true,
    availableEquipment: ['chair', 'wall'],
    preferredWorkoutDays: ['Mon', 'Wed', 'Fri'],
    createdAt: BASELINE_AT,
    updatedAt: BASELINE_AT,
  };
}

function source(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

function backendJson(value: unknown): never {
  return JSON.parse(JSON.stringify(value)) as never;
}

function memoryArea(files: Set<string>): LocalFileArea {
  return {
    list() {
      return Array.from(files);
    },
    delete(name: string) {
      files.delete(name);
    },
  };
}

function mockCheckupSyncFailure(): void {
  (supabase.from as jest.Mock).mockImplementation((table: string) => {
    if (table !== 'movement_checkups') throw new Error(`unexpected table ${table}`);
    return {
      upsert: jest.fn().mockResolvedValue({ error: { message: 'checkup sync failed' } }),
    };
  });
}

function mockBlockSyncFailure(): void {
  let blockCalls = 0;
  (supabase.from as jest.Mock).mockImplementation((table: string) => {
    if (table === 'movement_checkups') return selectBuilder({ id: 'remote-checkup' });
    if (table === 'movement_blocks') {
      blockCalls += 1;
      if (blockCalls === 1) return selectBuilder(null);
      return {
        upsert: jest.fn().mockResolvedValue({ error: { message: 'block sync failed' } }),
      };
    }
    throw new Error(`unexpected table ${table}`);
  });
}

function mockReportSyncFailure(): void {
  let checkupCalls = 0;
  let reportCalls = 0;
  (supabase.from as jest.Mock).mockImplementation((table: string) => {
    if (table === 'movement_blocks') return selectBuilder({ id: 'remote-block' });
    if (table === 'movement_checkups') {
      checkupCalls += 1;
      return selectBuilder({ id: `remote-checkup-${checkupCalls}` });
    }
    if (table === 'movement_block_reports') {
      reportCalls += 1;
      if (reportCalls <= 2) return selectBuilder(null);
      return {
        insert: jest.fn().mockResolvedValue({ error: { message: 'report sync failed' } }),
      };
    }
    throw new Error(`unexpected table ${table}`);
  });
}

function mockTrainingStateFailure(): void {
  (supabase.from as jest.Mock).mockImplementation((table: string) => {
    if (table !== 'training_state') throw new Error(`unexpected table ${table}`);
    return {
      upsert: jest.fn().mockResolvedValue({ error: { message: 'training state sync failed' } }),
    };
  });
}

function selectBuilder(data: unknown, error: unknown = null) {
  const builder: {
    select: jest.Mock;
    eq: jest.Mock;
    contains: jest.Mock;
    limit: jest.Mock;
    maybeSingle: jest.Mock;
  } = {
    select: jest.fn(),
    eq: jest.fn(),
    contains: jest.fn(),
    limit: jest.fn(),
    maybeSingle: jest.fn().mockResolvedValue({ data, error }),
  };
  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.contains.mockReturnValue(builder);
  builder.limit.mockReturnValue(builder);
  return builder;
}
