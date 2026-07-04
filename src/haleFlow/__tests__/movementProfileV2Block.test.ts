import {
  defaultAdherenceStoreState,
  type LifeGoal,
  type LifeGoalCategory,
  type MovementBlock,
  type MovementSafetyProfile,
} from '../../adherence';
import { createCheckUpProtocolPolicy, MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID } from '../../checkup/protocolPolicy';
import {
  createActiveShoulderReachV2Setup,
  createChairRiseV2Setup,
  createOneLegBalanceV2Setup,
} from '../../checkup/protocolSetup';
import type { CheckUp } from '../../checkup/types';
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
import { defaultTrainingState } from '../../training';
import { createBalancedSessionTemplates, MOVEMENT_PROFILE_V2_BALANCED_TEMPLATE_SOURCES } from '../../training';
import { getBlockScheduleState } from '../blockSchedule';
import { sessionTemplatesForMovementBlock } from '../blockTrainingPlan';
import { getWeekSessionStatuses } from '../appLifecycle';
import { evaluatePlannedFocusStimulus } from '../focusStimulusEvidence';
import { requiredMainPlanTemplatesForBlock } from '../mainPlanEvents';
import {
  materializeMovementProfileV2Block,
  movementProfileV2BlockFingerprint,
  movementProfileV2BlockIdForAssessment,
} from '../movementProfileV2Block';
import { requireHaleSessionPlan } from '../sessionPlanning';

const STARTED_AT = '2026-06-23T12:00:00.000Z';
const CREATED_AT = '2026-06-23T12:08:00.000Z';
const BLOCK_START = '2026-06-24T08:00:00.000Z';
const REFERENCE_PROFILE = {
  ageAtTest: 62,
  ageBasis: 'exact_age_at_test' as const,
  referenceSex: 'female' as const,
};

describe('Movement Profile V2 block materialization', () => {
  it('creates a stable balanced V2 block without inventing a balanced movement domain', () => {
    const checkUp = v2CheckUp();
    const snapshot = mustCreateSnapshot(checkUp);
    const assessment = mustAssess({ checkUp, snapshot });

    expect(assessment.focus).toMatchObject({ kind: 'balanced', reason: 'v2_focus_balanced_no_unique_signal' });

    const created = materializeMovementProfileV2Block({
      adherence: defaultAdherenceStoreState(),
      checkUp,
      checkupType: 'baseline',
      snapshot,
      assessment,
      startDate: BLOCK_START,
    });

    expect(created.ok).toBe(true);
    if (!created.ok) throw new Error(created.reason);
    const block = created.block;
    expect(block.id).toBe(movementProfileV2BlockIdForAssessment(assessment.assessmentId));
    expect(block.focusDomain).toBeUndefined();
    expect(block.focus).toMatchObject({ kind: 'balanced' });
    expect(block.secondaryDomains).toEqual(['strength_power', 'balance', 'mobility']);
    expect(block.origin).toMatchObject({
      kind: 'movement_profile_v2_assessment',
      assessmentId: assessment.assessmentId,
      assessmentFingerprint: assessment.assessmentFingerprint,
      snapshotId: snapshot.snapshotId,
      snapshotFingerprint: snapshot.snapshotFingerprint,
      sourceCheckUpId: STARTED_AT,
      sourceCheckUpType: 'baseline',
    });
    expect(block.templateIds).toEqual(['balanced-A', 'balanced-B', 'balanced-C']);
    expect(block.blockFingerprint).toBe(created.blockFingerprint);
    expect(block.blockFingerprint).toBe(movementProfileV2BlockFingerprint(block));
    expect(created.adherence.blocks).toEqual([block]);

    expect(requiredMainPlanTemplatesForBlock(block).templateIds).toEqual(['balanced-A', 'balanced-B', 'balanced-C']);
    // Balanced blocks now rotate their source day-variant by a hash of the
    // block id (see docs/decisions.md), so this asserts consistency with
    // that same seeded call rather than one hardcoded combo, plus the
    // invariant that each balanced slot always maps to the same domain.
    const expectedBalancedTemplates = createBalancedSessionTemplates(block.id).map((template) => ({
      id: template.id,
      focusDomain: template.focusDomain,
      sourceTemplateId: template.sourceTemplateId,
    }));
    expect(expectedBalancedTemplates.map((t) => t.id)).toEqual(['balanced-A', 'balanced-B', 'balanced-C']);
    expect(expectedBalancedTemplates.map((t) => t.focusDomain)).toEqual([
      'strength_power',
      'balance_stability',
      'mobility_flexibility',
    ]);
    expect(sessionTemplatesForMovementBlock(block).map((template) => ({
      id: template.id,
      focusDomain: template.focusDomain,
      sourceTemplateId: template.sourceTemplateId,
    }))).toEqual(expectedBalancedTemplates);
    expect(createBalancedSessionTemplates().map((template) => [template.id, template.sourceTemplateId])).toEqual(
      Object.entries(MOVEMENT_PROFILE_V2_BALANCED_TEMPLATE_SOURCES)
    );

    const schedule = getBlockScheduleState({ block, today: BLOCK_START });
    expect(schedule.status).toBe('session_due');
    expect(schedule.requiredTemplateIds).toEqual(['balanced-A', 'balanced-B', 'balanced-C']);
    expect(schedule.nextTemplateId).toBe('balanced-A');
    expect(
      getWeekSessionStatuses({
        adherence: { ...defaultAdherenceStoreState(), blocks: [block] },
        today: BLOCK_START,
      }).map((session) => session.focus)
    ).toEqual(['Strength focus', 'Balance focus', 'Mobility focus']);
  });

  it('plans balanced sessions with the source template primary domain and preserves focus evidence creditability', () => {
    const block = createBalancedBlock();
    const plan = requireHaleSessionPlan({
      activeBlock: block,
      training: defaultTrainingState(),
      safetyProfile: safety(),
      today: BLOCK_START,
    });
    const evidence = evaluatePlannedFocusStimulus(plan, block);

    expect(plan.metadata?.source).toBe('block_generated');
    expect(plan.metadata?.templateId).toBe('balanced-A');
    expect(plan.metadata?.plannedPrimaryDomain).toBe('strength_power');
    expect(plan.focusDomain).toBe('strength_power');
    expect(evidence.status).toBe('eligible');
    expect(evidence.mainPlanCreditPotential).toBe(true);
    expect(evidence.blockFocusDomain).toBeUndefined();
    expect(evidence.plannedPrimaryDomain).toBe('strength_power');
    expect(evidence.blockFocusTrainingDomain).toBe('strength_power');
    expect(evidence.plannedPrimaryFocusExerciseIds.length).toBeGreaterThan(0);
  });

  it('reuses identical V2 material and fails closed for source, active-block, and immutable conflicts', () => {
    const checkUp = v2CheckUp({
      balance: balanceResult({ bestHoldSec: 8 }),
    });
    const snapshot = mustCreateSnapshot(checkUp);
    const assessment = mustAssess({ checkUp, snapshot, lifeGoal: goal('grandchildren') });
    const first = materializeMovementProfileV2Block({
      adherence: defaultAdherenceStoreState(),
      checkUp,
      checkupType: 'baseline',
      snapshot,
      assessment,
      startDate: BLOCK_START,
    });
    if (!first.ok) throw new Error(first.reason);

    expect(first.block.focusDomain).toBe('balance');
    expect(first.block.focus).toEqual({ kind: 'domain', domain: 'balance' });
    expect(first.block.templateIds).toEqual(['balance-A', 'balance-B', 'balance-C']);

    const reused = materializeMovementProfileV2Block({
      adherence: first.adherence,
      checkUp,
      checkupType: 'baseline',
      snapshot,
      assessment,
      startDate: BLOCK_START,
    });
    expect(reused).toMatchObject({ ok: true, status: 'reused' });

    expect(materializeMovementProfileV2Block({
      adherence: defaultAdherenceStoreState(),
      checkUp: v2CheckUp({ chair: chairResult({ reps: 18 }) }),
      checkupType: 'baseline',
      snapshot,
      assessment,
      startDate: BLOCK_START,
    })).toMatchObject({ ok: false, reason: 'v2_block_source_mismatch' });

    expect(materializeMovementProfileV2Block({
      adherence: { ...defaultAdherenceStoreState(), blocks: [{ ...first.block, id: 'movement-block-other' }] },
      checkUp,
      checkupType: 'baseline',
      snapshot,
      assessment,
      startDate: BLOCK_START,
    })).toMatchObject({
      ok: false,
      reason: 'v2_block_active_block_conflict',
      existingBlockId: 'movement-block-other',
      expectedBlockId: first.block.id,
    });

    expect(materializeMovementProfileV2Block({
      adherence: { ...defaultAdherenceStoreState(), blocks: [{ ...first.block, blockFingerprint: 'mpv2-block-v1-conflict' }] },
      checkUp,
      checkupType: 'baseline',
      snapshot,
      assessment,
      startDate: BLOCK_START,
    })).toMatchObject({
      ok: false,
      reason: 'v2_block_immutable_conflict',
      existingBlockId: first.block.id,
      expectedBlockId: first.block.id,
    });
  });

  it('fails closed for malformed and future-policy V2 artifacts', () => {
    const checkUp = v2CheckUp();
    const snapshot = mustCreateSnapshot(checkUp);
    const assessment = mustAssess({ checkUp, snapshot });

    expect(materializeMovementProfileV2Block({
      adherence: defaultAdherenceStoreState(),
      checkUp,
      checkupType: 'baseline',
      snapshot: { kind: 'not-a-v2-snapshot' },
      assessment,
      startDate: BLOCK_START,
    })).toMatchObject({ ok: false, reason: 'v2_block_malformed_snapshot' });

    expect(materializeMovementProfileV2Block({
      adherence: defaultAdherenceStoreState(),
      checkUp,
      checkupType: 'baseline',
      snapshot: { ...snapshot, schemaVersion: 999 },
      assessment,
      startDate: BLOCK_START,
    })).toMatchObject({ ok: false, reason: 'v2_block_future_policy' });

    expect(materializeMovementProfileV2Block({
      adherence: defaultAdherenceStoreState(),
      checkUp,
      checkupType: 'baseline',
      snapshot,
      assessment: { ...assessment, assessmentFingerprint: 'wrong' },
      startDate: BLOCK_START,
    })).toMatchObject({ ok: false, reason: 'v2_block_malformed_assessment' });

    expect(materializeMovementProfileV2Block({
      adherence: defaultAdherenceStoreState(),
      checkUp,
      checkupType: 'baseline',
      snapshot,
      assessment: { ...assessment, schemaVersion: 999 },
      startDate: BLOCK_START,
    })).toMatchObject({ ok: false, reason: 'v2_block_future_policy' });
  });
});

function createBalancedBlock(): MovementBlock {
  const checkUp = v2CheckUp();
  const snapshot = mustCreateSnapshot(checkUp);
  const assessment = mustAssess({ checkUp, snapshot });
  const created = materializeMovementProfileV2Block({
    adherence: defaultAdherenceStoreState(),
    checkUp,
    checkupType: 'baseline',
    snapshot,
    assessment,
    startDate: BLOCK_START,
  });
  if (!created.ok) throw new Error(created.reason);
  return created.block;
}

function mustAssess({
  checkUp = v2CheckUp(),
  snapshot,
  lifeGoal,
}: {
  checkUp?: CheckUp;
  snapshot?: StoredMovementProfileV2Snapshot;
  lifeGoal?: LifeGoal | null;
} = {}): MovementProfileV2Assessment {
  const sourceSnapshot = snapshot ?? mustCreateSnapshot(checkUp);
  const created = createMovementProfileV2Assessment({
    checkUp,
    snapshot: sourceSnapshot,
    lifeGoal,
    createdAt: CREATED_AT,
  });
  if (!created.ok) throw new Error(`assessment was not created: ${created.reason}`);
  return created.assessment;
}

function mustCreateSnapshot(checkUp: CheckUp): StoredMovementProfileV2Snapshot {
  const created = createMovementProfileV2Snapshot({
    checkUp,
    checkupType: 'baseline',
    referenceProfile: REFERENCE_PROFILE,
    createdAt: CREATED_AT,
  });
  if (!created.ok) throw new Error(`snapshot was not created: ${created.reason}`);
  return created.snapshot;
}

function v2CheckUp(overrides: {
  startedAt?: string;
  chair?: ChairRiseV2Result;
  balance?: OneLegBalanceV2Result;
  shoulder?: ActiveShoulderReachV2Result;
} = {}): CheckUp {
  const startedAt = overrides.startedAt ?? STARTED_AT;
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

function goal(category: LifeGoalCategory): LifeGoal {
  return {
    id: `goal-${category}`,
    userId: 'local-device-user',
    category,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    isPrimary: true,
  };
}

function safety(): MovementSafetyProfile {
  return {
    id: 'safety-1',
    userId: 'local-device-user',
    age: 61,
    activityLevel: 'lightly_active',
    feelsSafeStandingFromChair: true,
    feelsSafeBalancing: true,
    availableEquipment: ['chair', 'wall', 'stairs', 'resistance_band', 'door_anchor', 'floor_space'],
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
      updatedAt: BLOCK_START,
    },
    preferredWorkoutDays: ['Mon', 'Wed', 'Fri'],
    createdAt: BLOCK_START,
    updatedAt: BLOCK_START,
  };
}
