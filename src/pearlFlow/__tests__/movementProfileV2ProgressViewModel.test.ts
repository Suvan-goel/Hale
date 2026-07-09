import {
  defaultAdherenceStoreState,
  type MovementBlock,
  type TrainingSessionCompletion,
} from '../../adherence';
import { createCheckUpProtocolPolicy, MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID } from '../../checkup/protocolPolicy';
import {
  createActiveShoulderReachV2Setup,
  createChairRiseV2Setup,
  createOneLegBalanceV2Setup,
} from '../../checkup/protocolSetup';
import type { CheckUp } from '../../checkup/types';
import { bareDownwardChanges } from '../testing/copyInvariants';
import { HISTORY_SCHEMA_VERSION, type StoredCheckUp } from '../../history';
import {
  ACTIVE_SHOULDER_REACH_V2_ID,
  type ActiveShoulderReachV2Result,
} from '../../movements/activeShoulderReachV2';
import { CHAIR_RISE_V2_ID, type ChairRiseV2Result } from '../../movements/chairRiseV2';
import { ONE_LEG_BALANCE_V2_ID, type OneLegBalanceV2Result } from '../../movements/oneLegBalanceV2';
import {
  createMovementProfileV2Assessment,
  createMovementProfileV2Snapshot,
  type MovementProfileV2Assessment,
  type StoredMovementProfileV2Snapshot,
} from '../../reference/movementProfileV2';
import { getBlockScheduleState } from '../blockSchedule';
import { requiredMainPlanTemplatesForBlock } from '../mainPlanEvents';
import { materializeMovementProfileV2Block } from '../movementProfileV2Block';
import { createMovementProfileV2BlockReport } from '../movementProfileV2BlockReport';
import { buildMovementProfileV2ProgressViewModel } from '../movementProfileV2ProgressViewModel';
import { buildMovementProfileV2RetestComparison } from '../movementProfileV2RetestComparison';

const BASELINE_AT = '2026-06-01T08:00:00.000Z';
const RETAKE_AT = '2026-06-10T08:00:00.000Z';
const RETEST_AT = '2026-06-29T08:00:00.000Z';
const CREATED_AT = '2026-06-01T08:08:00.000Z';
const BLOCK_START = '2026-06-01T09:00:00.000Z';
const REFERENCE_PROFILE = {
  ageAtTest: 62,
  ageBasis: 'exact_age_at_test' as const,
  referenceSex: 'female' as const,
};

describe('Movement Profile V2 Progress view model', () => {
  it('shows the latest frozen profile and neutral official history without current-plan actions', () => {
    const baseline = artifacts('baseline', BASELINE_AT);
    const block = mustMaterializeBlock(baseline, BLOCK_START);

    const viewModel = buildMovementProfileV2ProgressViewModel({
      history: [baseline.record],
      blocks: [block],
      reports: [],
      today: '2026-06-12T12:00:00.000Z',
    });

    expect(viewModel.status).toBe('ready');
    if (viewModel.status !== 'ready') throw new Error(viewModel.status);
    expect(viewModel.hero.title).toBe('Movement Profile');
    expect(viewModel.hero.profileId).toBe(BASELINE_AT);
    expect(viewModel.hero.domains.map((card) => card.metric)).toContain('12 rises in 30 seconds');
    // 12 reps for this reference profile lands in the 10th-40th percentile band,
    // which reads as the plain 'Building' tier everywhere in the product.
    const strength = viewModel.hero.domains.find((card) => card.domain === 'strength_power');
    expect(strength?.interpretation).toBe('Building');
    // Baseline-relative default (reposition slice 5): Progress never shows
    // population comparison — that view lives behind the results-screen opt-in.
    expect(strength?.body).toBe('Adds to your own strength trend with every check-up.');
    expect(viewModel.actions).toEqual([
      { id: 'view_movement_profile', label: 'View Movement Profile', targetId: BASELINE_AT },
    ]);
    expect(viewModel.officialHistory).toHaveLength(1);
    expect(viewModel.officialHistory[0]).toMatchObject({
      id: BASELINE_AT,
      sourceLabel: 'First Movement Check-Up',
      action: { label: 'View Movement Profile' },
    });
    // Computed-change words stay banned on this frozen surface. The bare word
    // "trend" left the list 2026-07-06 (reposition slice 5): the neutral card
    // body's forward-looking "your own … trend" is the framing of record and
    // claims no computed change.
    expect(JSON.stringify(viewModel).toLowerCase()).not.toMatch(
      /movement age|weakest|improved|declined|increase|decrease|delta|percent change/
    );
  });

  it('summarises change across check-ups only once a second Check-Up exists', () => {
    const baseline = artifacts('baseline', BASELINE_AT); // default chair result is 12 reps
    const retake = artifacts('baseline_retake', RETAKE_AT, { chair: chairResult({ reps: 16 }) });

    const single = buildMovementProfileV2ProgressViewModel({
      history: [baseline.record],
      blocks: [],
      reports: [],
      today: RETAKE_AT,
    });
    if (single.status !== 'ready') throw new Error(single.status);
    expect(single.change).toBeNull();

    const paired = buildMovementProfileV2ProgressViewModel({
      history: [baseline.record, retake.record],
      blocks: [],
      reports: [],
      today: RETAKE_AT,
    });
    if (paired.status !== 'ready') throw new Error(paired.status);
    expect(paired.change).not.toBeNull();
    expect(paired.change?.headline).toContain('Since your first check-up');
    expect(paired.change?.domains.find((domain) => domain.domain === 'strength_power')).toMatchObject({
      direction: 'up',
      value: '12 → 16 rises',
      caption: 'Up 4 rises',
    });
    // Up rows never carry support copy — pairing is for lower readings only.
    expect(
      paired.change?.domains.find((domain) => domain.domain === 'strength_power')?.supportCopy
    ).toBeUndefined();
  });

  it('never presents a lower reading bare: every down row pairs the trainable path (§2.4)', () => {
    const baseline = artifacts('baseline', BASELINE_AT); // default chair result is 12 reps
    const retake = artifacts('baseline_retake', RETAKE_AT, { chair: chairResult({ reps: 9 }) });
    const paired = buildMovementProfileV2ProgressViewModel({
      history: [baseline.record, retake.record],
      blocks: [],
      reports: [],
      today: RETAKE_AT,
    });
    if (paired.status !== 'ready') throw new Error(paired.status);
    const rows = (paired.change?.domains ?? []).map((domain) => ({
      id: domain.domain,
      direction: domain.direction,
      supportCopy: domain.supportCopy,
    }));
    expect(rows.some((row) => row.direction === 'down')).toBe(true);
    expect(bareDownwardChanges(rows)).toEqual([]);
    const down = paired.change?.domains.find((domain) => domain.direction === 'down');
    expect(down?.supportCopy).toContain('your plan');
  });

  it('does not surface current-plan provenance when the active plan came from a previous profile', () => {
    const baseline = artifacts('baseline', BASELINE_AT, { balance: balanceResult({ bestHoldSec: 8 }) });
    const activeBlock = mustMaterializeBlock(baseline, BLOCK_START);
    const retake = artifacts('baseline_retake', RETAKE_AT, { chair: chairResult({ reps: 15 }) });

    const viewModel = buildMovementProfileV2ProgressViewModel({
      history: [baseline.record, retake.record],
      blocks: [activeBlock],
      reports: [],
      today: '2026-06-12T12:00:00.000Z',
    });

    expect(viewModel.status).toBe('ready');
    if (viewModel.status !== 'ready') throw new Error(viewModel.status);
    expect(viewModel.hero.profileId).toBe(RETAKE_AT);
    expect(viewModel.actions).toEqual([
      { id: 'view_movement_profile', label: 'View Movement Profile', targetId: RETAKE_AT },
    ]);
    expect(JSON.stringify(viewModel)).not.toMatch(
      /current plan|View current plan|previous Movement Profile|progress_v2_plan_source_differs/i
    );
  });

  it('includes only valid source-bound V2 block reports in newest-first report history', () => {
    const baseline = artifacts('baseline', BASELINE_AT);
    const priorBlock = { ...mustMaterializeBlock(baseline, BLOCK_START), status: 'completed' as const };
    const retest = artifacts('official_retest', RETEST_AT, { chair: chairResult({ reps: 14 }) });
    const nextBlock = mustMaterializeBlock(retest, RETEST_AT, [priorBlock]);
    const report = mustCreateReport({ prior: baseline, current: retest, priorBlock, nextBlock });
    const invalidReport = { ...report, id: 'invalid-report', reportFingerprint: 'wrong' };

    const viewModel = buildMovementProfileV2ProgressViewModel({
      history: [baseline.record, retest.record],
      blocks: [priorBlock, nextBlock],
      reports: [invalidReport, report],
      today: '2026-06-30T12:00:00.000Z',
    });

    expect(viewModel.status).toBe('ready');
    if (viewModel.status !== 'ready') throw new Error(viewModel.status);
    expect(viewModel.officialHistory.map((entry) => entry.sourceLabel)).toEqual([
      'Follow-up Movement Check-Up',
      'First Movement Check-Up',
    ]);
    expect(viewModel.reports).toEqual([
      expect.objectContaining({
        action: expect.objectContaining({ label: 'View phase report', targetId: report.id }),
        sessionsLabel: '12 plan sessions completed',
      }),
    ]);
    expect(viewModel.diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'progress_v2_report_invalid' })])
    );
  });

  it('uses typed recovery states without V1 fallback copy', () => {
    const malformed = buildMovementProfileV2ProgressViewModel({
      history: [{
        ...artifacts('baseline', BASELINE_AT).record,
        movementProfileV2Assessment: undefined,
        movementProfileV2AssessmentCompatibility: 'malformed',
      }],
      blocks: [],
      reports: [],
      today: '2026-06-12T12:00:00.000Z',
    });
    expect(malformed.status).toBe('artifact_recovery');
    expect(malformed.actions).toEqual([]);
    expect(JSON.stringify(malformed).toLowerCase()).not.toContain('movement age');

    const orphanedV2Block = mustMaterializeBlock(artifacts('baseline', RETAKE_AT), BLOCK_START);
    const conflict = buildMovementProfileV2ProgressViewModel({
      history: [],
      blocks: [orphanedV2Block],
      reports: [],
      today: '2026-06-12T12:00:00.000Z',
    });
    expect(conflict.status).toBe('active_block_conflict');
    expect(conflict.actions).toEqual([]);
  });
});

function artifacts(
  checkupType: 'baseline' | 'baseline_retake' | 'official_retest',
  startedAt: string,
  overrides: {
    chair?: ChairRiseV2Result;
    balance?: OneLegBalanceV2Result;
    shoulder?: ActiveShoulderReachV2Result;
  } = {}
): {
  checkUp: CheckUp;
  snapshot: StoredMovementProfileV2Snapshot;
  assessment: MovementProfileV2Assessment;
  record: StoredCheckUp;
} {
  const checkUp = v2CheckUp({ startedAt, ...overrides });
  const snapshot = mustCreateSnapshot(checkUp, checkupType);
  const assessment = mustAssess(checkUp, snapshot);
  return {
    checkUp,
    snapshot,
    assessment,
    record: {
      schemaVersion: HISTORY_SCHEMA_VERSION,
      checkUp,
      checkupType,
      scoreSnapshotCompatibility: 'unsupported_checkup_protocol',
      movementProfileV2Snapshot: snapshot,
      movementProfileV2SnapshotCompatibility: 'current',
      movementProfileV2Assessment: assessment,
      movementProfileV2AssessmentCompatibility: 'current',
    },
  };
}

function mustMaterializeBlock(
  artifact: ReturnType<typeof artifacts>,
  startDate: string,
  existingBlocks: MovementBlock[] = []
): MovementBlock {
  const result = materializeMovementProfileV2Block({
    adherence: { ...defaultAdherenceStoreState(), blocks: existingBlocks },
    checkUp: artifact.checkUp,
    checkupType: artifact.record.checkupType,
    snapshot: artifact.snapshot,
    assessment: artifact.assessment,
    startDate,
  });
  if (!result.ok) throw new Error(result.reason);
  return result.block;
}

function mustCreateReport({
  prior,
  current,
  priorBlock,
  nextBlock,
}: {
  prior: ReturnType<typeof artifacts>;
  current: ReturnType<typeof artifacts>;
  priorBlock: MovementBlock;
  nextBlock: MovementBlock;
}) {
  const comparison = buildMovementProfileV2RetestComparison({
    priorCheckUp: prior.checkUp,
    priorSnapshot: prior.snapshot,
    priorAssessment: prior.assessment,
    currentCheckUp: current.checkUp,
    currentSnapshot: current.snapshot,
    currentAssessment: current.assessment,
  });
  if (!comparison.ok) throw new Error(comparison.reason);
  const schedule = getBlockScheduleState({
    block: priorBlock,
    completions: planCompletions(priorBlock, 12),
    today: RETEST_AT,
  });
  const report = createMovementProfileV2BlockReport({
    priorBlock,
    schedule,
    comparison: comparison.comparison,
    nextBlock,
    createdAt: RETEST_AT,
    userId: 'local-device-user',
  });
  if (!report.ok) throw new Error(report.reason);
  return report.report;
}

function mustCreateSnapshot(
  checkUp: CheckUp,
  checkupType: 'baseline' | 'baseline_retake' | 'official_retest'
): StoredMovementProfileV2Snapshot {
  const created = createMovementProfileV2Snapshot({
    checkUp,
    checkupType,
    referenceProfile: REFERENCE_PROFILE,
    createdAt: CREATED_AT,
  });
  if (!created.ok) throw new Error(created.reason);
  return created.snapshot;
}

function mustAssess(
  checkUp: CheckUp,
  snapshot: StoredMovementProfileV2Snapshot
): MovementProfileV2Assessment {
  const created = createMovementProfileV2Assessment({
    checkUp,
    snapshot,
    createdAt: CREATED_AT,
  });
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

function planCompletions(block: MovementBlock, count: number): TrainingSessionCompletion[] {
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
  ].slice(0, count);
  return dateKeys.map((dateKey, index) => {
    const templateId = templateIds[index % templateIds.length];
    const completedAt = `${dateKey}T09:00:00.000Z`;
    return {
      id: `${block.id}-completion-${index + 1}`,
      userId: 'local-device-user',
      blockId: block.id,
      completedAt,
      plannedDate: `${templateId}:${dateKey}`,
      sessionType: 'standard',
      templateId,
      mainPlanCredit: true,
      source: 'block_generated',
      focusStimulusEvidence: {
        planStatus: 'eligible',
        status: 'credited_focus_work',
        exclusionReason: 'none',
        mainPlanCredit: true,
        plannedPrimaryFocusExerciseCount: 1,
        completedPrimaryFocusExerciseCount: 1,
        completedSupportingExerciseCount: 0,
        completedFallbackExerciseCount: 0,
        completedCrossDomainExerciseCount: 0,
        plannedPrimaryFocusExerciseIds: [`${templateId}-primary`],
        completedPrimaryFocusExerciseIds: [`${templateId}-primary`],
        completedSupportingExerciseIds: [],
        completedFallbackExerciseIds: [],
        completedCrossDomainExerciseIds: [],
        fallbackFocusSlotIds: [],
        skippedFocusSlotIds: [],
        focusStimulusExclusionReasons: [],
        missingMetadataExerciseIds: [],
        malformedMetadataExerciseIds: [],
        focusMismatchExerciseIds: [],
      },
    };
  });
}
