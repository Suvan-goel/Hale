import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  defaultAdherenceStoreState,
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
  type BodySide,
} from '../../checkup/protocolSetup';
import { createCheckUpProtocolPolicy, MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID } from '../../checkup/protocolPolicy';
import type { CheckUp } from '../../checkup/types';
import { selectPublicMovementCheckUpLaunch } from '../../checkup/publicCheckUpEngine';
import {
  HISTORY_SCHEMA_VERSION,
  createMemoryFs,
  type StoredCheckUp,
} from '../../history';
import {
  createMovementProfileV2InternalFlow,
} from '../../movementProfileV2/internalCheckupFlow';
import {
  createMovementProfileV2LivePoseSample,
  MovementProfileV2LiveCoordinator,
} from '../../movementProfileV2/liveCoordinator';
import { buildMovementProfileV2ResultsViewModel } from '../../movementProfileV2/viewModel';
import { ACTIVE_SHOULDER_REACH_V2_ID, type ActiveShoulderReachV2Result } from '../../movements/activeShoulderReachV2';
import { CHAIR_RISE_V2_ID, type ChairRiseV2Result } from '../../movements/chairRiseV2';
import { HINGE_REACH_ID } from '../../movements/hingeReach';
import { ONE_LEG_BALANCE_V2_ID, type OneLegBalanceV2Result } from '../../movements/oneLegBalanceV2';
import { CHAIN_IDS } from '../../pose/chains';
import type { PipelineFrameOutput } from '../../pose/pipeline';
import { chairStandSession } from '../../pose/testing/syntheticChairStand';
import {
  createPoseFrame,
  LANDMARK_COUNT,
  LANDMARK_STRIDE,
  LM,
  parseLandmarkEvent,
  type RawLandmarkEvent,
} from '../../pose/types';
import {
  materializeOfficialMovementProfileV2Artifacts,
  type MovementProfileV2Assessment,
  type MovementProfileV2OfficialSourceCheckUpType,
  type MovementProfileV2ReferenceProfile,
  type StoredMovementProfileV2Snapshot,
} from '../../reference/movementProfileV2';
import { buildMovementProfileV2UnifiedResultsPresentation } from '../../results/movementProfileV2ResultsAdapter';
import { defaultTrainingState } from '../../training';
import {
  buildHaleDataExport,
} from '../../services/backend/dataExportService';
import {
  clearLocalHaleData,
  type LocalFileArea,
} from '../../services/backend/accountDataService';
import { checkUpCompletionTimestamp } from '../checkupTransition';
import { getBlockScheduleState, type BlockScheduleState } from '../blockSchedule';
import type { OfficialMovementProfileV2AssessmentRecord } from '../checkupHistory';
import { requiredMainPlanTemplatesForBlock } from '../mainPlanEvents';
import {
  materializeMovementProfileV2Block,
} from '../movementProfileV2Block';
import {
  createMovementProfileV2BlockReport,
  parseMovementProfileV2BlockReport,
} from '../movementProfileV2BlockReport';
import {
  buildMovementProfileV2RetestComparison,
} from '../movementProfileV2RetestComparison';
import { transitionMovementProfileV2OfficialRetest } from '../movementProfileV2OfficialRetestTransition';
import { requireHaleSessionPlan } from '../sessionPlanning';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const BASELINE_AT = '2026-06-01T08:00:00.000Z';
const BLOCK_START = '2026-06-01T09:00:00.000Z';
const RETEST_AT = '2026-06-29T08:00:00.000Z';
const RETEST_CREATED_AT = '2026-06-29T08:09:00.000Z';
const LIVE_RETEST_AT = '2026-06-29T08:30:00.000Z';
const TRANSITION_FALLBACK_A = '2026-06-29T08:55:00.000Z';
const TRANSITION_FALLBACK_B = '2026-06-29T09:55:00.000Z';
const USER_ID = 'local-device-user';

const FEMALE_62: MovementProfileV2ReferenceProfile = {
  ageAtTest: 62,
  ageBasis: 'exact_age_at_test',
  referenceSex: 'female',
};
const MALE_72: MovementProfileV2ReferenceProfile = {
  ageAtTest: 72,
  ageBasis: 'exact_age_at_test',
  referenceSex: 'male',
};

describe('H4.1 Movement Profile V2 official retest continuation matrix', () => {
  it('runs a scheduler-derived domain block through a live-derived public V2 official retest exactly once', () => {
    const prior = materializedPackage({
      startedAt: BASELINE_AT,
      checkupType: 'baseline',
      balanceHoldSec: 8,
      createdAt: BASELINE_AT,
    });
    expect(prior.assessment.focus).toMatchObject({ kind: 'domain', focusDomain: 'balance' });
    const priorBlock = materializedBlock(prior, { startDate: BLOCK_START });
    const due = dueState(priorBlock);
    expect(due.schedule.status).toBe('retest_due');
    expect(due.schedule.totalCredits).toBe(12);

    const launch = selectPublicMovementCheckUpLaunch({
      sourceType: 'official_retest',
      entryContext: 'standard',
      releaseEnabled: true,
      activeBlockOriginKind: priorBlock.origin?.kind ?? null,
      movementProfileV2OfficialRetestScheduleStatus: due.schedule.status,
      hasAcceptedMovementProfileV2OfficialRetestSourceArtifacts: true,
    });
    expect(launch).toEqual({
      status: 'ready',
      engine: 'unified_movement_profile',
      sourceType: 'official_retest',
      entryContext: 'public_official_retest',
    });

    const rawRetest = liveDerivedOfficialRetestCheckUp();
    expect(rawRetest.movementProfileV2Snapshot).toBeUndefined();
    expect(rawRetest.movementProfileV2Assessment).toBeUndefined();
    const current = materializedPackage({
      startedAt: rawRetest.startedAt,
      checkupType: 'official_retest',
      checkUp: rawRetest,
      createdAt: RETEST_CREATED_AT,
      acceptedHistory: [prior.record.record],
    });
    expect(current.checkUp.movementProfileV2Snapshot?.snapshotId).toBe(current.snapshot.snapshotId);
    expect(current.checkUp.movementProfileV2Assessment?.assessmentId).toBe(current.assessment.assessmentId);

    const completedAtA = checkUpCompletionTimestamp(current.checkUp, TRANSITION_FALLBACK_A);
    const completedAtB = checkUpCompletionTimestamp(current.checkUp, TRANSITION_FALLBACK_B);
    expect(completedAtA).toBe(LIVE_RETEST_AT);
    expect(completedAtB).toBe(completedAtA);

    const transition = transitionMovementProfileV2OfficialRetest({
      priorState: due.adherence,
      priorBlock,
      schedule: due.schedule,
      priorArtifacts: prior.record,
      currentCheckUp: current.checkUp,
      currentSnapshot: current.snapshot,
      currentAssessment: current.assessment,
      explicitTransitionTimestamp: completedAtA,
      userId: USER_ID,
    });
    expect(transition.status).toBe('ready');
    if (transition.status !== 'ready') throw new Error(transition.status);

    expect(transition.nextState.completions.filter((completion) => completion.sessionType === 'retest')).toHaveLength(1);
    expect(transition.nextState.reports).toHaveLength(1);
    expect(transition.nextState.blocks.filter((block) => block.status === 'active')).toEqual([transition.nextBlock]);
    expect(transition.completedPriorBlock.status).toBe('completed');
    expect(transition.nextBlock.origin).toMatchObject({
      kind: 'movement_profile_v2_assessment',
      sourceCheckUpType: 'official_retest',
      sourceCheckUpId: LIVE_RETEST_AT,
      snapshotId: current.snapshot.snapshotId,
      assessmentId: current.assessment.assessmentId,
    });

    const viewModel = buildMovementProfileV2ResultsViewModel({
      snapshot: current.snapshot,
      assessment: current.assessment,
    });
    const presentation = buildMovementProfileV2UnifiedResultsPresentation({
      viewModel,
      planState: { status: 'ready', blockId: transition.nextBlock.id },
      retestComparison: transition.comparison,
    });
    expect(presentation.actions).toEqual([
      expect.objectContaining({
        label: 'View my block report',
        action: { type: 'view_block_report' },
      }),
    ]);
    expect(presentation.plan).toEqual({ status: 'hidden' });
    expect(transition.report.displayCopy.nextPlanCta).toBe('View my next 4-week plan');

    const resumedSchedule = getBlockScheduleState({
      block: transition.completedPriorBlock,
      completions: transition.nextState.completions,
      today: completedAtB,
    });
    const resumed = transitionMovementProfileV2OfficialRetest({
      priorState: transition.nextState,
      priorBlock: transition.completedPriorBlock,
      schedule: resumedSchedule,
      priorArtifacts: prior.record,
      currentCheckUp: current.checkUp,
      currentSnapshot: current.snapshot,
      currentAssessment: current.assessment,
      explicitTransitionTimestamp: completedAtB,
      userId: USER_ID,
    });
    expect(resumed.status).toBe('ready');
    if (resumed.status !== 'ready') throw new Error(resumed.status);
    expect(resumed.action).toBe('reused');
    expect(resumed.nextState.completions.filter((completion) => completion.sessionType === 'retest')).toHaveLength(1);
    expect(resumed.nextState.reports).toHaveLength(1);
    expect(resumed.report.reportFingerprint).toBe(transition.report.reportFingerprint);

    expect(requireHaleSessionPlan({
      activeBlock: transition.nextBlock,
      training: defaultTrainingState(),
      safetyProfile: safetyProfile(),
      today: completedAtA,
    }).blockId).toBe(transition.nextBlock.id);

    const invalidCurrent = materializedPackage({
      startedAt: '2026-06-29T10:00:00.000Z',
      checkupType: 'baseline',
      createdAt: '2026-06-29T10:09:00.000Z',
    });
    const invalidTransition = transitionMovementProfileV2OfficialRetest({
      priorState: due.adherence,
      priorBlock,
      schedule: due.schedule,
      priorArtifacts: prior.record,
      currentCheckUp: invalidCurrent.checkUp,
      currentSnapshot: invalidCurrent.snapshot,
      currentAssessment: invalidCurrent.assessment,
      explicitTransitionTimestamp: '2026-06-29T10:10:00.000Z',
      userId: USER_ID,
    });
    expect(invalidTransition).toMatchObject({ status: 'current_artifact_invalid' });
  });

  it('proves real Balanced retest-due fixtures and the current Balanced focus-transition boundary', () => {
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
    expect(balancedBlock.templateIds).toEqual(['balanced-A', 'balanced-B', 'balanced-C']);

    const due = dueState(balancedBlock);
    expect(due.schedule.status).toBe('retest_due');
    expect(due.schedule.credits).toHaveLength(12);
    const primaryDomainCounts = due.schedule.credits.reduce<Record<string, number>>((counts, credit) => {
      const domain = credit.templateId === 'balanced-B'
        ? 'balance'
        : credit.templateId === 'balanced-C'
          ? 'mobility'
          : 'strength_power';
      counts[domain] = (counts[domain] ?? 0) + 1;
      return counts;
    }, {});
    expect(primaryDomainCounts).toEqual({ strength_power: 4, balance: 4, mobility: 4 });

    const balancedCurrent = materializedPackage({
      startedAt: '2026-06-29T11:00:00.000Z',
      checkupType: 'official_retest',
      chairReps: 12,
      balanceHoldSec: 32,
      shoulderPeakDeg: 151,
      createdAt: '2026-06-29T11:08:00.000Z',
      acceptedHistory: [priorBalanced.record.record],
    });
    const balancedTransition = transitionFor(balancedBlock, due, priorBalanced.record, balancedCurrent);
    expect(balancedTransition.nextBlock.focus?.kind).toBe('balanced');
    expect(balancedTransition.report.priorSuggestedFocus.kind).toBe('balanced');
    expect(balancedTransition.report.currentSuggestedFocus.kind).toBe('balanced');

    const domainCurrent = materializedPackage({
      startedAt: '2026-06-29T12:00:00.000Z',
      checkupType: 'official_retest',
      balanceHoldSec: 8,
      createdAt: '2026-06-29T12:08:00.000Z',
      acceptedHistory: [priorBalanced.record.record],
    });
    const domainTransition = transitionFor(
      balancedBlock,
      due,
      priorBalanced.record,
      domainCurrent,
      '2026-06-29T12:00:00.000Z'
    );
    expect(domainTransition.report.priorSuggestedFocus.kind).toBe('balanced');
    expect(domainTransition.nextBlock.focus).toEqual({ kind: 'domain', domain: 'balance' });

    const priorDomain = materializedPackage({
      startedAt: '2026-06-01T12:00:00.000Z',
      checkupType: 'baseline',
      balanceHoldSec: 8,
      createdAt: '2026-06-01T12:08:00.000Z',
    });
    const domainBlock = materializedBlock(priorDomain, { startDate: BLOCK_START });
    const balancedRetestForDomain = materializedPackage({
      startedAt: '2026-06-29T13:00:00.000Z',
      checkupType: 'official_retest',
      chairReps: 12,
      balanceHoldSec: 32,
      shoulderPeakDeg: 151,
      createdAt: '2026-06-29T13:08:00.000Z',
      acceptedHistory: [priorDomain.record.record],
    });
    expect(balancedRetestForDomain.assessment.focus).toMatchObject({
      kind: 'domain',
      focusDomain: 'balance',
      reason: 'v2_focus_preserve_current_no_clear_candidate',
    });
    expect(balancedRetestForDomain.assessment.focus.kind).not.toBe('balanced');
  });

  it('suppresses side, leg, and changed-reference interpretation comparability without claim fields or directional copy', () => {
    const prior = materializedPackage({
      startedAt: BASELINE_AT,
      checkupType: 'baseline',
      balanceHoldSec: 20,
      shoulderPeakDeg: 151,
      createdAt: BASELINE_AT,
    });
    const changedLegAndSide = materializedPackage({
      startedAt: RETEST_AT,
      checkupType: 'official_retest',
      balance: balanceResult({
        bestHoldSec: 24,
        standingLeg: 'right',
        setup: createOneLegBalanceV2Setup({ standingLeg: 'right', priorStandingLeg: 'left', confirmed: true }),
      }),
      shoulder: shoulderResult({
        peakFlexionDeg: 158,
        selectedSide: 'left',
        setup: createActiveShoulderReachV2Setup({ selectedSide: 'left', priorSelectedSide: 'right', confirmed: true }),
      }),
      acceptedHistory: [prior.record.record],
      createdAt: RETEST_CREATED_AT,
    });
    const changedComparison = buildMovementProfileV2RetestComparison({
      priorCheckUp: prior.checkUp,
      priorSnapshot: prior.snapshot,
      priorAssessment: prior.assessment,
      currentCheckUp: changedLegAndSide.checkUp,
      currentSnapshot: changedLegAndSide.snapshot,
      currentAssessment: changedLegAndSide.assessment,
    });
    expect(changedComparison.ok).toBe(true);
    if (!changedComparison.ok) throw new Error(changedComparison.reason);
    expect(changedComparison.comparison.domains.strength_power.status).toBe('raw_comparable');
    expect(changedComparison.comparison.domains.balance).toMatchObject({
      status: 'shown_separately',
      reasonCodes: ['DIFFERENT_STANDING_LEG'],
      note: 'A different standing leg was used this time, so Hale is showing the current balance result separately.',
    });
    expect(changedComparison.comparison.domains.mobility).toMatchObject({
      status: 'shown_separately',
      reasonCodes: ['DIFFERENT_SHOULDER_SIDE'],
      note: 'A different shoulder was tested this time, so Hale is showing the current reach result separately.',
    });

    const changedReference = materializedPackage({
      startedAt: '2026-06-29T14:00:00.000Z',
      checkupType: 'official_retest',
      balanceHoldSec: 23,
      shoulderPeakDeg: 156,
      referenceProfile: MALE_72,
      acceptedHistory: [prior.record.record],
      createdAt: '2026-06-29T14:08:00.000Z',
    });
    expect(changedReference.snapshot.referenceProfileFingerprint).not.toBe(prior.snapshot.referenceProfileFingerprint);
    expect(prior.snapshot.referenceProfile).toMatchObject(FEMALE_62);
    const referenceComparison = buildMovementProfileV2RetestComparison({
      priorCheckUp: prior.checkUp,
      priorSnapshot: prior.snapshot,
      priorAssessment: prior.assessment,
      currentCheckUp: changedReference.checkUp,
      currentSnapshot: changedReference.snapshot,
      currentAssessment: changedReference.assessment,
    });
    expect(referenceComparison.ok).toBe(true);
    if (!referenceComparison.ok) throw new Error(referenceComparison.reason);
    expect(referenceComparison.comparison.domains.mobility).toMatchObject({
      status: 'raw_comparable',
      referenceComparable: false,
    });

    const presentation = buildMovementProfileV2UnifiedResultsPresentation({
      viewModel: buildMovementProfileV2ResultsViewModel({
        snapshot: changedReference.snapshot,
        assessment: changedReference.assessment,
      }),
      planState: { status: 'ready', blockId: 'next-block' },
      retestComparison: referenceComparison.comparison,
    });
    const payload = JSON.stringify({ comparison: referenceComparison.comparison, presentation }).toLowerCase();
    expect(payload).not.toMatch(/difference|direction|delta|percentile change|percentage|improved|declined|increased|decreased|better|worse|stronger|steadier|more mobile|younger|older|meaningful change|protected progress|passed|failed/);
    expect(JSON.stringify(presentation.comparison)).not.toMatch(/[+-]\d+\s*%/);
  });

  it('keeps V2 reports prior-block sourced, immutable, read-only, export-bounded, and CTA-only', async () => {
    const prior = materializedPackage({
      startedAt: BASELINE_AT,
      checkupType: 'baseline',
      balanceHoldSec: 8,
      createdAt: BASELINE_AT,
    });
    const priorBlock = {
      ...materializedBlock(prior, { startDate: BLOCK_START }),
      microChecksCompleted: 4,
    };
    const due = dueState(priorBlock, microCheckCompletions(priorBlock, 4));
    const current = materializedPackage({
      startedAt: RETEST_AT,
      checkupType: 'official_retest',
      balanceHoldSec: 10,
      acceptedHistory: [prior.record.record],
      createdAt: RETEST_CREATED_AT,
    });
    const transition = transitionFor(priorBlock, due, prior.record, current);
    expect(transition.report.microChecksCompleted).toBe(4);
    expect(transition.report.scheduleSummary.scheduleCredits).toBe(12);
    expect(transition.report.scheduleSummary.trainingWeeks).toBe(4);
    expect(transition.report.id).toBe(`block-report-${priorBlock.id}`);
    expect(parseMovementProfileV2BlockReport(transition.report)).toMatchObject({ ok: true });

    const restored = deserializeAdherenceState(serializeAdherenceState(transition.nextState));
    const restoredReport = restored?.reports.find((report) => report.id === transition.report.id);
    expect(restoredReport).toMatchObject({
      kind: 'movement_profile_v2_block_report',
      reportFingerprint: transition.report.reportFingerprint,
      microChecksCompleted: 4,
    });

    const nextWithDifferentMicroChecks = { ...transition.nextBlock, microChecksCompleted: 99 };
    const regenerated = createMovementProfileV2BlockReport({
      priorBlock: transition.completedPriorBlock,
      schedule: due.schedule,
      comparison: transition.comparison,
      nextBlock: nextWithDifferentMicroChecks,
      createdAt: LIVE_RETEST_AT,
      userId: USER_ID,
    });
    expect(regenerated.ok).toBe(true);
    if (!regenerated.ok) throw new Error(regenerated.reason);
    expect(regenerated.report.microChecksCompleted).toBe(4);

    const reopened = transitionMovementProfileV2OfficialRetest({
      priorState: {
        ...due.adherence,
        reports: [transition.report],
      },
      priorBlock,
      schedule: due.schedule,
      priorArtifacts: prior.record,
      currentCheckUp: current.checkUp,
      currentSnapshot: current.snapshot,
      currentAssessment: current.assessment,
      explicitTransitionTimestamp: checkUpCompletionTimestamp(current.checkUp, TRANSITION_FALLBACK_B),
      userId: USER_ID,
    });
    expect(reopened.status).toBe('ready');
    if (reopened.status !== 'ready') throw new Error(reopened.status);
    expect(reopened.action).toBe('resumed');
    expect(reopened.report.reportFingerprint).toBe(transition.report.reportFingerprint);

    const exported = buildHaleDataExport({
      exportedAt: '2026-06-30T12:00:00.000Z',
      user: { id: USER_ID, email: 'hale@example.com' },
      data: {
        profile: { id: USER_ID },
        movementCheckups: [],
        movementBlocks: [{ block_json: { movementBlock: priorBlock } }],
        trainingState: {},
        trainingSessionCompletions: [],
        microChecks: [],
        movementBlockReports: [
          {
            report_json: {
              report: JSON.parse(JSON.stringify(transition.report)),
              landmarks: [1, 2, 3],
              video: 'raw-video',
              fileUri: 'file:///private/report.json',
              access_token: 'secret',
            },
          },
        ],
      },
    });
    const exportedText = JSON.stringify(exported);
    expect(exported.data.movementBlockReports[0]).toMatchObject({
      report_json: {
        report: expect.objectContaining({ kind: 'movement_profile_v2_block_report' }),
      },
    });
    expect(exportedText).not.toMatch(/raw-video|landmarks|file:\/\/\/private|secret/);

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
      expect(uiSource).not.toMatch(/materializeMovementProfileV2Block|transitionMovementProfileV2OfficialRetest|createMovementProfileV2BlockReport|upsertMovementBlockReport|syncMovementBlockReport|startSession/);
    }
    expect(reportSource).toContain('PrimaryButton title={report.displayCopy.nextPlanCta} onPress={onViewNextPlan}');
  });
});

function materializedPackage(input: {
  startedAt: string;
  checkupType: MovementProfileV2OfficialSourceCheckUpType;
  createdAt: string;
  checkUp?: CheckUp;
  referenceProfile?: MovementProfileV2ReferenceProfile;
  acceptedHistory?: readonly StoredCheckUp[];
  chairReps?: number;
  balanceHoldSec?: number;
  shoulderPeakDeg?: number;
  balance?: OneLegBalanceV2Result;
  shoulder?: ActiveShoulderReachV2Result;
}): {
  checkUp: CheckUp;
  snapshot: StoredMovementProfileV2Snapshot;
  assessment: MovementProfileV2Assessment;
  record: OfficialMovementProfileV2AssessmentRecord;
} {
  const checkUp = input.checkUp ?? v2CheckUp({
    startedAt: input.startedAt,
    chair: chairResult({ reps: input.chairReps ?? 12 }),
    balance: input.balance ?? balanceResult({ bestHoldSec: input.balanceHoldSec ?? 32 }),
    shoulder: input.shoulder ?? shoulderResult({ peakFlexionDeg: input.shoulderPeakDeg ?? 151 }),
  });
  const materialized = materializeOfficialMovementProfileV2Artifacts({
    checkUp,
    checkupType: input.checkupType,
    referenceProfile: input.referenceProfile ?? FEMALE_62,
    acceptedHistory: input.acceptedHistory ?? [],
    snapshotCreatedAt: input.createdAt,
    assessmentCreatedAt: input.createdAt,
  });
  expect(materialized.ok).toBe(true);
  if (!materialized.ok) throw new Error(materialized.reason);
  return {
    checkUp: materialized.checkUp,
    snapshot: materialized.snapshot,
    assessment: materialized.assessment,
    record: officialRecord({
      checkUp: materialized.checkUp,
      checkupType: input.checkupType,
      snapshot: materialized.snapshot,
      assessment: materialized.assessment,
    }),
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
  return { adherence, schedule };
}

function transitionFor(
  priorBlock: MovementBlock,
  due: { adherence: AdherenceStoreState; schedule: BlockScheduleState },
  priorArtifacts: OfficialMovementProfileV2AssessmentRecord,
  current: ReturnType<typeof materializedPackage>,
  explicitTransitionTimestamp = checkUpCompletionTimestamp(current.checkUp, TRANSITION_FALLBACK_A)
) {
  const transitioned = transitionMovementProfileV2OfficialRetest({
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
  expect(transitioned.status).toBe('ready');
  if (transitioned.status !== 'ready') throw new Error(transitioned.status);
  return transitioned;
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
  const plannedPrimaryDomain = templateId === 'balanced-B' || templateId.startsWith('balance')
    ? 'balance_stability'
    : templateId === 'balanced-C' || templateId.startsWith('mobility')
      ? 'mobility_flexibility'
      : 'strength_power';
  return {
    planStatus: 'eligible',
    status: 'credited_focus_work',
    exclusionReason: 'none',
    mainPlanCredit: true,
    blockFocusDomain: movementBlockDomainFocus(block) ?? undefined,
    plannedPrimaryDomain,
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

function liveDerivedOfficialRetestCheckUp(): CheckUp {
  const coordinator = new MovementProfileV2LiveCoordinator({
    ...createMovementProfileV2InternalFlow({ startedAt: LIVE_RETEST_AT }),
    sourceType: 'official_retest',
  });
  let nowMs = completeLiveCheckupUntilHinge(coordinator);
  expect(coordinator.snapshot(nowMs).stage).toBe('hinge_setup');
  expect(coordinator.receiveUserAction({ type: 'hinge_setup_voice_completed' }, nowMs - 1)).toBe(true);
  expect(coordinator.receiveUserAction({ type: 'start_hinge_capture' }, nowMs)).toBe(true);
  feedHingeCapture(coordinator, nowMs + 100);
  coordinator.receiveTimerTick(nowMs + 9200);
  const checkUp = coordinator.snapshot(nowMs + 9200).checkUp;
  if (!checkUp) throw new Error('expected live-derived official retest Check-Up');
  expect(checkUp.startedAt).toBe(LIVE_RETEST_AT);
  expect(checkUp.items.map((item) => item.movementId)).toEqual([
    CHAIR_RISE_V2_ID,
    ONE_LEG_BALANCE_V2_ID,
    ACTIVE_SHOULDER_REACH_V2_ID,
    HINGE_REACH_ID,
  ]);
  return checkUp;
}

function completeLiveCheckupUntilHinge(coordinator: MovementProfileV2LiveCoordinator): number {
  let nowMs = advanceThroughChair(coordinator, 0) + 100;
  nowMs = startBalanceTrial(coordinator, nowMs, 'left');
  nowMs = finishBalanceByTouchdown(coordinator, nowMs, 'left');
  expect(coordinator.receiveUserAction({ type: 'balance_use_result' }, nowMs + 100)).toBe(true);
  nowMs += 200;
  expect(coordinator.receiveUserAction({ type: 'confirm_shoulder_setup', shoulderSide: 'right' }, nowMs)).toBe(true);
  expect(coordinator.receiveUserAction({ type: 'shoulder_setup_voice_completed' }, nowMs + 1)).toBe(true);
  expect(coordinator.receiveUserAction({ type: 'start_shoulder_capture' }, nowMs + 100)).toBe(true);
  feedShoulderCapture(coordinator, nowMs + 200, 'right');
  coordinator.receiveTimerTick(nowMs + 9200);
  return nowMs + 9300;
}

function advanceThroughChair(coordinator: MovementProfileV2LiveCoordinator, startMs: number): number {
  coordinator.receiveUserAction({ type: 'confirm_chair_setup' }, startMs);
  coordinator.receiveUserAction({ type: 'chair_practice_voice_completed' }, startMs + 1);
  const session = chairStandSession({
    seed: 202,
    noiseAmp: 0,
    calibrationMs: 100,
    riseMsPerRep: [900, 900, 900, 900, 900, 900, 900, 900, 900, 900],
    sitMs: 600,
    settleMs: 300,
    topMs: 400,
    descendMs: 700,
    restMs: 500,
    tailMs: 1000,
    nearSide: 'right',
  });
  let nowMs = startMs;
  for (const raw of session.frames) {
    nowMs = startMs + raw.timestampMs + 1;
    coordinator.receiveTimerTick(nowMs);
    feedOutput(
      coordinator,
      trackingOutput({ ...raw, timestampMs: nowMs }, session.truth.bodyUnit, { leftSide: 0.3, rightSide: 0.95 }),
      nowMs
    );
    coordinator.receiveTimerTick(nowMs);
    if (coordinator.snapshot(nowMs).stage === 'chair_countdown') {
      coordinator.receiveUserAction({ type: 'chair_official_ready_voice_completed' }, nowMs + 1);
      coordinator.receiveUserAction({ type: 'chair_countdown_started' }, nowMs + 2);
      coordinator.receiveUserAction({ type: 'chair_go_playback_started' }, nowMs + 3);
    }
    if (coordinator.snapshot(nowMs).stage === 'balance_setup') return nowMs;
  }
  coordinator.receiveTimerTick(nowMs + 31000);
  return nowMs + 31000;
}

function startBalanceTrial(
  coordinator: MovementProfileV2LiveCoordinator,
  startMs: number,
  standingLeg: BodySide
): number {
  expect(coordinator.receiveUserAction({ type: 'confirm_balance_setup', standingLeg }, startMs)).toBe(true);
  expect(coordinator.receiveUserAction({ type: 'balance_attempt_voice_completed' }, startMs + 1)).toBe(true);
  let nowMs = startMs + 100;
  feedOutput(coordinator, trackingOutput(balanceRaw(nowMs, standingLeg, false)), nowMs);
  nowMs += 100;
  feedOutput(coordinator, trackingOutput(balanceRaw(nowMs, standingLeg, true)), nowMs);
  expect(coordinator.snapshot(nowMs).stage).toBe('balance_trial');
  return nowMs;
}

function finishBalanceByTouchdown(
  coordinator: MovementProfileV2LiveCoordinator,
  startMs: number,
  standingLeg: BodySide
): number {
  let nowMs = startMs;
  for (let index = 1; index <= 8; index++) {
    nowMs = startMs + index * 250;
    feedOutput(coordinator, trackingOutput(balanceRaw(nowMs, standingLeg, true)), nowMs);
  }
  for (let index = 1; index <= 4; index++) {
    nowMs += 33;
    feedOutput(coordinator, trackingOutput(balanceRaw(nowMs, standingLeg, false)), nowMs);
  }
  expect(coordinator.snapshot(nowMs).stage).toBe('balance_rest');
  return nowMs;
}

function feedShoulderCapture(
  coordinator: MovementProfileV2LiveCoordinator,
  startMs: number,
  side: BodySide
): number {
  let nowMs = startMs;
  for (const offset of [0, 1000, 2000, 3200]) {
    nowMs = startMs + offset;
    feedOutput(coordinator, trackingOutput(shoulderRaw(nowMs, side)), nowMs);
  }
  return nowMs;
}

function feedHingeCapture(coordinator: MovementProfileV2LiveCoordinator, startMs: number): number {
  let nowMs = startMs;
  for (const offset of [0, 1000, 2000, 3200]) {
    nowMs = startMs + offset;
    feedOutput(coordinator, trackingOutput(hingeRaw(nowMs)), nowMs);
  }
  return nowMs;
}

function feedOutput(
  coordinator: MovementProfileV2LiveCoordinator,
  output: PipelineFrameOutput,
  timestampMs: number
): void {
  const snapshot = coordinator.snapshot(timestampMs);
  const sample = createMovementProfileV2LivePoseSample({
    frameId: timestampMs,
    eventTimestampMs: timestampMs,
    receivedAtMs: timestampMs,
    sourceWidth: 480,
    sourceHeight: 640,
    movementEpochId: snapshot.movementEpochId,
    attemptEpochId: snapshot.attemptEpochId,
    output,
  });
  if (!sample) throw new Error('expected sample');
  coordinator.receivePoseSample(sample);
}

function trackingOutput(
  raw: RawLandmarkEvent,
  bodyUnit = 0.3,
  reliabilityOverrides: Partial<Record<(typeof CHAIN_IDS)[number], number>> = {}
): PipelineFrameOutput {
  const frame = createPoseFrame();
  parseLandmarkEvent(raw, frame);
  const chainReliability = new Float64Array(CHAIN_IDS.length);
  chainReliability.fill(0.95);
  for (const [chain, value] of Object.entries(reliabilityOverrides)) {
    const index = CHAIN_IDS.indexOf(chain as (typeof CHAIN_IDS)[number]);
    if (index >= 0) chainReliability[index] = value;
  }
  return {
    state: frame.hasPose ? 'tracking' : 'interrupted',
    inferenceMs: null,
    frame,
    rawFrame: frame,
    displayFrame: frame,
    chainReliability,
    reliableSideChains: 2,
    validity: { valid: frame.hasPose, reason: frame.hasPose ? 'ok' : 'no-pose' },
    bodyUnit,
    events: [],
    fps: 30,
  };
}

function balanceRaw(timestampMs: number, standingLeg: BodySide, raised: boolean): RawLandmarkEvent {
  const raisedLeg = standingLeg === 'left' ? 'right' : 'left';
  const raisedAnkleY = raised ? 0.76 : 0.85;
  return rawFromPoints(timestampMs, [
    [LM.LEFT_ANKLE, 0.44, standingLeg === 'left' ? 0.85 : raisedAnkleY],
    [LM.RIGHT_ANKLE, 0.56, standingLeg === 'right' ? 0.85 : raisedAnkleY],
    [LM.LEFT_HEEL, 0.43, standingLeg === 'left' || raisedLeg !== 'left' ? 0.86 : raisedAnkleY + 0.01],
    [LM.RIGHT_HEEL, 0.57, standingLeg === 'right' || raisedLeg !== 'right' ? 0.86 : raisedAnkleY + 0.01],
    [LM.LEFT_FOOT_INDEX, 0.44, standingLeg === 'left' || raisedLeg !== 'left' ? 0.87 : raisedAnkleY + 0.02],
    [LM.RIGHT_FOOT_INDEX, 0.56, standingLeg === 'right' || raisedLeg !== 'right' ? 0.87 : raisedAnkleY + 0.02],
  ]);
}

function shoulderRaw(timestampMs: number, side: BodySide): RawLandmarkEvent {
  const shoulder = side === 'left' ? LM.LEFT_SHOULDER : LM.RIGHT_SHOULDER;
  const hip = side === 'left' ? LM.LEFT_HIP : LM.RIGHT_HIP;
  const elbow = side === 'left' ? LM.LEFT_ELBOW : LM.RIGHT_ELBOW;
  const wrist = side === 'left' ? LM.LEFT_WRIST : LM.RIGHT_WRIST;
  return rawFromPoints(timestampMs, [
    [shoulder, 0.5, 0.4],
    [hip, 0.5, 0.66],
    [elbow, side === 'left' ? 0.43 : 0.57, 0.19],
    [wrist, side === 'left' ? 0.39 : 0.61, 0.16],
  ]);
}

function hingeRaw(timestampMs: number): RawLandmarkEvent {
  return rawFromPoints(timestampMs, [
    [LM.LEFT_SHOULDER, 0.64, 0.62],
    [LM.RIGHT_SHOULDER, 0.65, 0.62],
    [LM.LEFT_HIP, 0.5, 0.55],
    [LM.RIGHT_HIP, 0.51, 0.55],
    [LM.LEFT_KNEE, 0.56, 0.74],
    [LM.RIGHT_KNEE, 0.57, 0.74],
    [LM.LEFT_ANKLE, 0.56, 0.85],
    [LM.RIGHT_ANKLE, 0.57, 0.85],
    [LM.LEFT_HEEL, 0.54, 0.86],
    [LM.RIGHT_HEEL, 0.55, 0.86],
    [LM.LEFT_FOOT_INDEX, 0.61, 0.87],
    [LM.RIGHT_FOOT_INDEX, 0.62, 0.87],
    [LM.LEFT_WRIST, 0.66, 0.79],
    [LM.RIGHT_WRIST, 0.67, 0.79],
  ]);
}

function rawFromPoints(timestampMs: number, overrides: readonly [LM, number, number][]): RawLandmarkEvent {
  const landmarks = new Array<number>(LANDMARK_COUNT * LANDMARK_STRIDE).fill(0);
  const defaults: [LM, number, number][] = [
    [LM.NOSE, 0.5, 0.24],
    [LM.LEFT_EAR, 0.47, 0.25],
    [LM.RIGHT_EAR, 0.53, 0.25],
    [LM.LEFT_SHOULDER, 0.44, 0.38],
    [LM.RIGHT_SHOULDER, 0.56, 0.38],
    [LM.LEFT_ELBOW, 0.42, 0.52],
    [LM.RIGHT_ELBOW, 0.58, 0.52],
    [LM.LEFT_WRIST, 0.41, 0.65],
    [LM.RIGHT_WRIST, 0.59, 0.65],
    [LM.LEFT_HIP, 0.45, 0.58],
    [LM.RIGHT_HIP, 0.55, 0.58],
    [LM.LEFT_KNEE, 0.44, 0.72],
    [LM.RIGHT_KNEE, 0.56, 0.72],
    [LM.LEFT_ANKLE, 0.44, 0.85],
    [LM.RIGHT_ANKLE, 0.56, 0.85],
    [LM.LEFT_HEEL, 0.43, 0.86],
    [LM.RIGHT_HEEL, 0.57, 0.86],
    [LM.LEFT_FOOT_INDEX, 0.44, 0.87],
    [LM.RIGHT_FOOT_INDEX, 0.56, 0.87],
  ];
  for (let index = 0; index < LANDMARK_COUNT; index++) {
    const base = index * LANDMARK_STRIDE;
    landmarks[base] = 0.5;
    landmarks[base + 1] = 0.5;
    landmarks[base + 2] = 0;
    landmarks[base + 3] = 0.95;
    landmarks[base + 4] = 0.95;
  }
  for (const [landmark, x, y] of [...defaults, ...overrides]) {
    const base = landmark * LANDMARK_STRIDE;
    landmarks[base] = x;
    landmarks[base + 1] = y;
    landmarks[base + 2] = 0;
    landmarks[base + 3] = 0.95;
    landmarks[base + 4] = 0.95;
  }
  return { timestampMs, landmarks };
}

function source(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

function safetyProfile(): MovementSafetyProfile {
  return {
    id: 'safety-h4-1-continuation',
    userId: USER_ID,
    age: 62,
    activityLevel: 'lightly_active',
    feelsSafeStandingFromChair: true,
    feelsSafeBalancing: true,
    availableEquipment: ['chair', 'wall', 'resistance_band', 'stairs', 'floor_space'],
    equipmentStatus: 'confirmed',
    movementCapabilities: {
      schemaVersion: 1,
      floorTransfer: { status: 'confirmed' },
      stepUpEnvironment: {
        status: 'confirmed',
        lowStableStep: true,
        fixedSupport: true,
        clearDryArea: true,
        phoneOutOfPath: true,
      },
      singleLegBalance: { status: 'confirmed_with_support' },
      revision: 1,
      updatedAt: BASELINE_AT,
    },
    preferredWorkoutDays: ['Mon', 'Wed', 'Fri'],
    createdAt: BASELINE_AT,
    updatedAt: BASELINE_AT,
  };
}

function memoryArea(files: Set<string>): LocalFileArea {
  return {
    list: () => Array.from(files),
    delete: (name) => {
      files.delete(name);
    },
  };
}
