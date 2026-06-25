import {
  defaultAdherenceStoreState,
  makeTrainingSessionCompletion,
  deserializeAdherenceState,
  serializeAdherenceState,
  type AdherenceStoreState,
  type MovementBlock,
  type MovementBlockReport,
  type TrainingFocusStimulusEvidenceSummary,
  type TrainingSessionCompletion,
} from '../../adherence';
import { createCheckUpProtocolPolicy, MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID } from '../../checkup/protocolPolicy';
import {
  createActiveShoulderReachV2Setup,
  createChairRiseV2Setup,
  createOneLegBalanceV2Setup,
} from '../../checkup/protocolSetup';
import type { CheckUp } from '../../checkup/types';
import type { StoredCheckUp } from '../../history';
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
  type MovementProfileV2OfficialSourceCheckUpType,
  type StoredMovementProfileV2Snapshot,
} from '../../reference/movementProfileV2';
import { getBlockScheduleState, type BlockScheduleState } from '../blockSchedule';
import type { OfficialMovementProfileV2AssessmentRecord } from '../checkupHistory';
import { requiredMainPlanTemplatesForBlock } from '../mainPlanEvents';
import { materializeMovementProfileV2Block } from '../movementProfileV2Block';
import { transitionMovementProfileV2OfficialRetest } from '../movementProfileV2OfficialRetestTransition';

const BASELINE_STARTED_AT = '2026-06-01T08:00:00.000Z';
const RETEST_STARTED_AT = '2026-06-29T08:00:00.000Z';
const CREATED_AT = '2026-06-01T08:08:00.000Z';
const RETEST_CREATED_AT = '2026-06-29T08:08:00.000Z';
const BLOCK_START = '2026-06-01T09:00:00.000Z';
const TRANSITION_AT = '2026-06-29T08:10:00.000Z';
const REFERENCE_PROFILE = {
  ageAtTest: 62,
  ageBasis: 'exact_age_at_test' as const,
  referenceSex: 'female' as const,
};

describe('Movement Profile V2 official retest transition', () => {
  it('completes the prior V2 block, writes a neutral report, creates the next V2 block, and resumes idempotently', () => {
    const prior = baselineArtifacts();
    const current = retestArtifacts({ priorAssessment: prior.assessment });
    const due = dueAdherence(prior.block);

    const transitioned = transitionMovementProfileV2OfficialRetest({
      priorState: due.adherence,
      priorBlock: prior.block,
      schedule: due.schedule,
      priorArtifacts: prior.record,
      currentCheckUp: current.checkUp,
      currentSnapshot: current.snapshot,
      currentAssessment: current.assessment,
      explicitTransitionTimestamp: TRANSITION_AT,
    });

    expect(transitioned.status).toBe('ready');
    if (transitioned.status !== 'ready') throw new Error(transitioned.status);
    expect(transitioned.action).toBe('created');
    expect(transitioned.completedPriorBlock.status).toBe('completed');
    expect(transitioned.nextBlock.status).toBe('active');
    expect(transitioned.nextBlock.origin).toMatchObject({
      kind: 'movement_profile_v2_assessment',
      sourceCheckUpType: 'official_retest',
      sourceCheckUpId: RETEST_STARTED_AT,
      assessmentId: current.assessment.assessmentId,
      snapshotId: current.snapshot.snapshotId,
    });
    expect(transitioned.nextState.blocks.filter((block) => block.status === 'active')).toEqual([transitioned.nextBlock]);
    expect(transitioned.nextState.blocks.filter((block) => block.status === 'completed')).toHaveLength(1);
    expect(transitioned.nextState.completions.filter((completion) => completion.sessionType === 'retest')).toHaveLength(1);

    expect(transitioned.report.kind).toBe('movement_profile_v2_block_report');
    expect(transitioned.report.id).toBe(`block-report-${prior.block.id}`);
    expect(transitioned.report.displayCopy).toMatchObject({
      headline: 'Your 4-week block is complete',
      nextPlanTitle: 'Your next 4-week plan is ready',
      nextPlanBody: 'Hale prepared it from your latest Movement Profile.',
      nextPlanCta: 'View my next 4-week plan',
    });
    expect(transitioned.report.domainChanges).toBeUndefined();
    expect(transitioned.report.comparison.domains.strength_power.status).toBe('raw_comparable');
    expect(transitioned.report.comparison.domains.balance.status).toBe('raw_comparable');
    expect(transitioned.report.comparison.domains.mobility.status).toBe('raw_comparable');
    expect(transitioned.report.comparison.domains.strength_power).not.toHaveProperty('difference');
    expect(transitioned.report.comparison.domains.strength_power).not.toHaveProperty('direction');
    expect(transitioned.report.currentSuggestedFocus).toEqual(transitioned.nextBlock.focus);
    expect(transitioned.report.scheduleSummary.scheduleCredits).toBe(12);
    const restored = deserializeAdherenceState(serializeAdherenceState(transitioned.nextState));
    const restoredReport = restored?.reports.find((report) => report.id === transitioned.report.id);
    expect(restoredReport).toMatchObject({
      kind: 'movement_profile_v2_block_report',
      reportFingerprint: transitioned.report.reportFingerprint,
    });

    const resumedSchedule = getBlockScheduleState({
      block: transitioned.completedPriorBlock,
      completions: transitioned.nextState.completions,
      today: TRANSITION_AT,
    });
    const resumed = transitionMovementProfileV2OfficialRetest({
      priorState: transitioned.nextState,
      priorBlock: transitioned.completedPriorBlock,
      schedule: resumedSchedule,
      priorArtifacts: prior.record,
      currentCheckUp: current.checkUp,
      currentSnapshot: current.snapshot,
      currentAssessment: current.assessment,
      explicitTransitionTimestamp: TRANSITION_AT,
    });

    expect(resumed.status).toBe('ready');
    if (resumed.status !== 'ready') throw new Error(resumed.status);
    expect(resumed.action).toBe('reused');
    expect(resumed.nextState.reports).toHaveLength(1);
    expect(resumed.nextState.completions.filter((completion) => completion.sessionType === 'retest')).toHaveLength(1);
    expect(resumed.report.reportFingerprint).toBe(transitioned.report.reportFingerprint);
  });

  it('shows changed balance leg and shoulder side separately without directional claims', () => {
    const prior = baselineArtifacts();
    const current = retestArtifacts({
      priorAssessment: prior.assessment,
      balance: balanceResult({
        setup: createOneLegBalanceV2Setup({ standingLeg: 'right', priorStandingLeg: 'left', confirmed: true }),
        standingLeg: 'right',
      }),
      shoulder: shoulderResult({
        setup: createActiveShoulderReachV2Setup({ selectedSide: 'left', priorSelectedSide: 'right', confirmed: true }),
        selectedSide: 'left',
      }),
    });
    const due = dueAdherence(prior.block);

    const transitioned = transitionMovementProfileV2OfficialRetest({
      priorState: due.adherence,
      priorBlock: prior.block,
      schedule: due.schedule,
      priorArtifacts: prior.record,
      currentCheckUp: current.checkUp,
      currentSnapshot: current.snapshot,
      currentAssessment: current.assessment,
      explicitTransitionTimestamp: TRANSITION_AT,
    });

    expect(transitioned.status).toBe('ready');
    if (transitioned.status !== 'ready') throw new Error(transitioned.status);
    expect(transitioned.comparison.domains.strength_power.status).toBe('raw_comparable');
    expect(transitioned.comparison.domains.balance).toMatchObject({
      status: 'shown_separately',
      reasonCodes: ['DIFFERENT_STANDING_LEG'],
      note: 'A different standing leg was used this time, so Hale is showing the current balance result separately.',
    });
    expect(transitioned.comparison.domains.mobility).toMatchObject({
      status: 'shown_separately',
      reasonCodes: ['DIFFERENT_SHOULDER_SIDE'],
      note: 'A different shoulder was tested this time, so Hale is showing the current reach result separately.',
    });
    expect(transitioned.comparison.domains.balance).not.toHaveProperty('direction');
    expect(transitioned.comparison.domains.mobility).not.toHaveProperty('difference');
  });

  it('does not mutate state when the scheduler has not reached retest_due', () => {
    const prior = baselineArtifacts();
    const completions = creditedMainPlanCompletions(prior.block).slice(0, 9);
    const adherence = { ...defaultAdherenceStoreState(), blocks: [prior.block], completions };
    const schedule = getBlockScheduleState({ block: prior.block, completions, today: '2026-06-22T08:00:00.000Z' });
    const current = retestArtifacts({ priorAssessment: prior.assessment });

    const transitioned = transitionMovementProfileV2OfficialRetest({
      priorState: adherence,
      priorBlock: prior.block,
      schedule,
      priorArtifacts: prior.record,
      currentCheckUp: current.checkUp,
      currentSnapshot: current.snapshot,
      currentAssessment: current.assessment,
      explicitTransitionTimestamp: TRANSITION_AT,
    });

    expect(schedule.status).not.toBe('retest_due');
    expect(transitioned).toMatchObject({ status: 'not_retest_due' });
  });

  it('fails closed instead of overwriting an existing report with different immutable material', () => {
    const prior = baselineArtifacts();
    const current = retestArtifacts({ priorAssessment: prior.assessment });
    const due = dueAdherence(prior.block);
    const conflictingReport: MovementBlockReport = {
      id: `block-report-${prior.block.id}`,
      userId: 'local-device-user',
      blockId: prior.block.id,
      createdAt: TRANSITION_AT,
      summary: 'Legacy report material',
      sessionsCompleted: 12,
      totalPlannedSessions: 12,
      microChecksCompleted: 0,
    };

    const transitioned = transitionMovementProfileV2OfficialRetest({
      priorState: { ...due.adherence, reports: [conflictingReport] },
      priorBlock: prior.block,
      schedule: due.schedule,
      priorArtifacts: prior.record,
      currentCheckUp: current.checkUp,
      currentSnapshot: current.snapshot,
      currentAssessment: current.assessment,
      explicitTransitionTimestamp: TRANSITION_AT,
    });

    expect(transitioned).toMatchObject({
      status: 'immutable_conflict',
      diagnostics: [{ code: 'v2_retest_report_immutable_conflict', reportId: conflictingReport.id }],
    });
  });
});

function baselineArtifacts(): {
  checkUp: CheckUp;
  snapshot: StoredMovementProfileV2Snapshot;
  assessment: MovementProfileV2Assessment;
  record: OfficialMovementProfileV2AssessmentRecord;
  block: MovementBlock;
} {
  const checkUp = v2CheckUp({ startedAt: BASELINE_STARTED_AT });
  const snapshot = mustCreateSnapshot({ checkUp, checkupType: 'baseline', createdAt: CREATED_AT });
  const assessment = mustAssess({ checkUp, snapshot, createdAt: CREATED_AT });
  const blockResult = materializeMovementProfileV2Block({
    adherence: defaultAdherenceStoreState(),
    checkUp,
    checkupType: 'baseline',
    snapshot,
    assessment,
    startDate: BLOCK_START,
  });
  if (!blockResult.ok) throw new Error(blockResult.reason);
  return {
    checkUp,
    snapshot,
    assessment,
    record: officialRecord({ checkUp, checkupType: 'baseline', snapshot, assessment }),
    block: blockResult.block,
  };
}

function retestArtifacts({
  priorAssessment,
  balance,
  shoulder,
}: {
  priorAssessment: MovementProfileV2Assessment;
  balance?: OneLegBalanceV2Result;
  shoulder?: ActiveShoulderReachV2Result;
}): {
  checkUp: CheckUp;
  snapshot: StoredMovementProfileV2Snapshot;
  assessment: MovementProfileV2Assessment;
} {
  const checkUp = v2CheckUp({
    startedAt: RETEST_STARTED_AT,
    balance,
    shoulder,
  });
  const snapshot = mustCreateSnapshot({ checkUp, checkupType: 'official_retest', createdAt: RETEST_CREATED_AT });
  const assessment = mustAssess({
    checkUp,
    snapshot,
    createdAt: RETEST_CREATED_AT,
    priorFocus: priorAssessment,
  });
  return { checkUp, snapshot, assessment };
}

function dueAdherence(block: MovementBlock): {
  adherence: AdherenceStoreState;
  schedule: BlockScheduleState;
} {
  const completions = creditedMainPlanCompletions(block);
  const adherence = {
    ...defaultAdherenceStoreState(),
    blocks: [block],
    completions,
  };
  const schedule = getBlockScheduleState({ block, completions, today: RETEST_STARTED_AT });
  expect(schedule.status).toBe('retest_due');
  return { adherence, schedule };
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
      focusStimulusEvidence: creditedFocusStimulusEvidence(),
    });
  });
}

function creditedFocusStimulusEvidence(): TrainingFocusStimulusEvidenceSummary {
  return {
    planStatus: 'eligible',
    status: 'credited_focus_work',
    exclusionReason: 'none',
    mainPlanCredit: true,
    plannedPrimaryFocusExerciseCount: 1,
    completedPrimaryFocusExerciseCount: 1,
    completedSupportingExerciseCount: 0,
    completedFallbackExerciseCount: 0,
    completedCrossDomainExerciseCount: 0,
    plannedPrimaryFocusExerciseIds: ['sit-to-stand'],
    completedPrimaryFocusExerciseIds: ['sit-to-stand'],
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

function officialRecord({
  checkUp,
  checkupType,
  snapshot,
  assessment,
}: {
  checkUp: CheckUp;
  checkupType: MovementProfileV2OfficialSourceCheckUpType;
  snapshot: StoredMovementProfileV2Snapshot;
  assessment: MovementProfileV2Assessment;
}): OfficialMovementProfileV2AssessmentRecord {
  const record: StoredCheckUp = {
    schemaVersion: 1,
    checkUp: { ...checkUp, movementProfileV2Snapshot: snapshot, movementProfileV2Assessment: assessment },
    checkupType,
    scoreSnapshotCompatibility: 'unsupported_checkup_protocol',
    movementProfileV2Snapshot: snapshot,
    movementProfileV2SnapshotCompatibility: 'current',
    movementProfileV2Assessment: assessment,
    movementProfileV2AssessmentCompatibility: 'current',
  };
  return {
    record,
    type: checkupType,
    snapshot,
    assessment,
  };
}

function mustCreateSnapshot({
  checkUp,
  checkupType,
  createdAt,
}: {
  checkUp: CheckUp;
  checkupType: 'baseline' | 'official_retest';
  createdAt: string;
}): StoredMovementProfileV2Snapshot {
  const created = createMovementProfileV2Snapshot({
    checkUp,
    checkupType,
    referenceProfile: REFERENCE_PROFILE,
    createdAt,
  });
  if (!created.ok) throw new Error(`snapshot was not created: ${created.reason}`);
  return created.snapshot;
}

function mustAssess({
  checkUp,
  snapshot,
  createdAt,
  priorFocus,
}: {
  checkUp: CheckUp;
  snapshot: StoredMovementProfileV2Snapshot;
  createdAt: string;
  priorFocus?: MovementProfileV2Assessment;
}): MovementProfileV2Assessment {
  const created = createMovementProfileV2Assessment({
    checkUp,
    snapshot,
    createdAt,
    priorFocus,
  });
  if (!created.ok) throw new Error(`assessment was not created: ${created.reason}`);
  return created.assessment;
}

function v2CheckUp(overrides: {
  startedAt?: string;
  chair?: ChairRiseV2Result;
  balance?: OneLegBalanceV2Result;
  shoulder?: ActiveShoulderReachV2Result;
} = {}): CheckUp {
  const startedAt = overrides.startedAt ?? BASELINE_STARTED_AT;
  return {
    startedAt,
    protocolPolicy: createCheckUpProtocolPolicy(MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID, startedAt),
    bodyUnit: 1,
    items: [
      { movementId: CHAIR_RISE_V2_ID, status: 'measured', result: overrides.chair ?? chairResult() },
      { movementId: ONE_LEG_BALANCE_V2_ID, status: 'measured', result: overrides.balance ?? balanceResult() },
      { movementId: ACTIVE_SHOULDER_REACH_V2_ID, status: 'measured', result: overrides.shoulder ?? shoulderResult() },
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
