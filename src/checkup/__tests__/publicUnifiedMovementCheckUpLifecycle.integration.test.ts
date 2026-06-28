import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  LOCAL_USER_ID,
  createLifeGoal,
  createMovementBlockFromAssessment,
  defaultAdherenceStoreState,
  makeTrainingSessionCompletion,
  movementBlockDomainFocus,
  movementBlockIsBalanced,
  type AdherenceStoreState,
  type MovementBlock,
  type MovementSafetyProfile,
  type TrainingFocusStimulusEvidenceSummary,
} from '../../adherence';
import {
  getHaleAppLifecycle,
} from '../../haleFlow/appLifecycle';
import {
  getBlockScheduleState,
} from '../../haleFlow/blockSchedule';
import {
  requiredMainPlanTemplatesForBlock,
} from '../../haleFlow/mainPlanEvents';
import {
  materializeMovementProfileV2Block,
} from '../../haleFlow/movementProfileV2Block';
import { getNextBestAction } from '../../haleFlow/nextBestAction';
import { requireHaleSessionPlan } from '../../haleFlow/sessionPlanning';
import { createMovementAssessment } from '../../haleFlow/assessments';
import {
  latestMaterializedMovementProfileV2Result,
  latestPendingMovementProfileV2RawCheckUp,
  movementProfileV2InternalFlowReducer,
  movementProfileV2RawCheckUpFromFlow,
  createMovementProfileV2InternalFlow,
  createCapturedActiveShoulderReachV2Result,
  createCapturedChairRiseV2Result,
  createCapturedHingeReachResult,
  createCapturedOneLegBalanceV2Result,
} from '../../movementProfileV2/internalCheckupFlow';
import {
  createMovementProfileV2LivePoseSample,
  MovementProfileV2LiveCoordinator,
} from '../../movementProfileV2/liveCoordinator';
import {
  enteredMovementProfileV2ReferenceDetailsDraft,
  referenceProfileFromMovementProfileV2Draft,
  skippedMovementProfileV2ReferenceDetailsDraft,
} from '../../movementProfileV2/referenceDetailsDraft';
import { buildMovementProfileV2ResultsViewModel } from '../../movementProfileV2/viewModel';
import { ACTIVE_SHOULDER_REACH_V2_ID } from '../../movements/activeShoulderReachV2';
import { CHAIR_RISE_V2_ID } from '../../movements/chairRiseV2';
import { HINGE_REACH_ID } from '../../movements/hingeReach';
import { ONE_LEG_BALANCE_V2_ID } from '../../movements/oneLegBalanceV2';
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
import { defaultPreferences, type Preferences, type UserProfile } from '../../profile';
import {
  materializeOfficialMovementProfileV2Artifacts,
  type MovementProfileV2ReferenceProfile,
} from '../../reference/movementProfileV2';
import {
  buildMovementProfileV2UnifiedResultsPresentation,
  type MovementProfileV2UnifiedPlanState,
} from '../../results/movementProfileV2ResultsAdapter';
import {
  mapRemoteHaleSnapshotToLocal,
} from '../../services/backend/restoreService';
import { sanitizeForObservability } from '../../services/observability/sentry';
import { createCurrentVersionedScoreSnapshot } from '../../scoring';
import { defaultTrainingState } from '../../training';
import {
  HISTORY_SCHEMA_VERSION,
  HistoryStore,
  createMemoryFs,
  deserializeCheckUp,
  serializeCheckUp,
  type StoredCheckUp,
} from '../../history';
import { syntheticCheckUp } from '../devFixture';
import {
  parseUnifiedMovementCheckUpReleaseFlag,
} from '../../config/unifiedMovementCheckUpRelease';
import {
  parseLegacyV1CheckUpRollbackFlag,
} from '../../config/legacyV1CheckUpRollback';
import { selectPublicMovementCheckUpLaunch } from '../publicCheckUpEngine';
import { createCheckUpProtocolPolicy, MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID } from '../protocolPolicy';
import type { BodySide } from '../protocolSetup';
import type { CheckUp, CheckUpItem } from '../types';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const LIVE_STARTED_AT = '2026-06-25T08:00:00.000Z';
const BALANCED_STARTED_AT = '2026-06-25T09:00:00.000Z';
const BASELINE_RETAKE_STARTED_AT = '2026-07-25T08:00:00.000Z';
const MATERIALIZED_AT = '2026-06-25T08:09:00.000Z';
const BLOCK_START = '2026-06-25T08:10:00.000Z';
const RETEST_DUE_AT = '2026-07-24T09:00:00.000Z';

const ENTERED_REFERENCE_PROFILE = referenceProfileFromMovementProfileV2Draft(
  enteredMovementProfileV2ReferenceDetailsDraft({
    exactAge: 62,
    referenceSex: 'female',
  })
);
const SKIPPED_REFERENCE_PROFILE = referenceProfileFromMovementProfileV2Draft(
  skippedMovementProfileV2ReferenceDetailsDraft()
);

describe('H3.1 public unified Movement Check-Up lifecycle', () => {
  it('keeps public V2 default independent from retired release and internal harness flags', () => {
    expect(parseUnifiedMovementCheckUpReleaseFlag(undefined)).toBe(false);
    expect(parseUnifiedMovementCheckUpReleaseFlag('0')).toBe(false);
    expect(parseUnifiedMovementCheckUpReleaseFlag('true')).toBe(false);
    expect(parseUnifiedMovementCheckUpReleaseFlag('1')).toBe(true);
    expect(parseLegacyV1CheckUpRollbackFlag(undefined)).toBe(false);
    expect(parseLegacyV1CheckUpRollbackFlag('0')).toBe(false);
    expect(parseLegacyV1CheckUpRollbackFlag('true')).toBe(false);
    expect(parseLegacyV1CheckUpRollbackFlag('1')).toBe(true);

    const matrix = [
      { release: false, internal: false, engine: 'unified_movement_profile' },
      { release: false, internal: true, engine: 'unified_movement_profile' },
      { release: true, internal: false, engine: 'unified_movement_profile' },
      { release: true, internal: true, engine: 'unified_movement_profile' },
    ] as const;

    for (const row of matrix) {
      expect(
        selectPublicMovementCheckUpLaunch({
          sourceType: 'baseline',
          entryContext: 'onboarding',
          releaseEnabled: row.release,
        })
      ).toMatchObject({ status: 'ready', engine: row.engine });
    }

    const app = source('App.tsx');
    expect(app).not.toContain('UNIFIED_MOVEMENT_CHECKUP_RELEASE_ENABLED');
    expect(app).toContain('LEGACY_V1_CHECKUP_ROLLBACK_ENABLED');
    expect(app).toContain('selectPublicMovementCheckUpLaunch');
    expect(app).not.toContain('beginMovementProfileV2Internal');
    expect(app).not.toContain('beginMovementProfileV2UnifiedInternal');
    expect(app).toContain(
      'MOVEMENT_PROFILE_V2_INTERNAL_ENABLED && __DEV__ ? replayOnboardingForDev : undefined'
    );
    expect(app).toContain('PUBLIC_MOVEMENT_PROFILE_V2_FLOWS');
  });

  it('preserves V1 baseline artifacts only as explicit rollback evidence', async () => {
    expect(
      selectPublicMovementCheckUpLaunch({
        sourceType: 'baseline',
        entryContext: 'onboarding',
        releaseEnabled: false,
      })
    ).toMatchObject({ status: 'ready', engine: 'unified_movement_profile', sourceType: 'baseline' });
    expect(
      selectPublicMovementCheckUpLaunch({
        sourceType: 'baseline',
        entryContext: 'onboarding',
        legacyV1RollbackEnabled: true,
      })
    ).toMatchObject({ status: 'ready', engine: 'legacy_v1', sourceType: 'baseline' });

    const checkUp = syntheticCheckUp('2026-06-25T07:00:00.000Z');
    const scored = createCurrentVersionedScoreSnapshot(checkUp);
    const assessment = createMovementAssessment({
      checkUpId: checkUp.startedAt,
      type: 'baseline',
      score: scored.score,
      scoreSnapshot: scored.snapshot,
      completedAt: checkUp.startedAt,
      isOfficialForProgress: true,
    });
    const block = createMovementBlockFromAssessment({
      latestAssessment: {
        score: scored.score,
        scoreSnapshot: scored.snapshot,
        sourceCheckUpId: checkUp.startedAt,
        assessment,
      },
      lifeGoal: createLifeGoal({ category: 'stairs', nowIso: checkUp.startedAt }),
      startDate: checkUp.startedAt,
    });
    const store = new HistoryStore(createMemoryFs());
    store.save(checkUp, {
      checkupType: 'baseline',
      sourceAssessmentId: assessment.id,
      scoreSnapshot: scored.snapshot,
    });
    const history = await store.loadAll();

    expect(history).toHaveLength(1);
    expect(history[0].scoreSnapshotCompatibility).toBe('current');
    expect(history[0].movementProfileV2Snapshot).toBeUndefined();
    expect(history[0].movementProfileV2Assessment).toBeUndefined();
    expect(assessment.id).toContain('assessment-baseline');
    expect(block.id).not.toMatch(/^movement-block-v2:/);
    expect(block.origin?.kind).not.toBe('movement_profile_v2_assessment');

    const app = source('App.tsx');
    expect(app).toContain("flow === 'checkup'");
    expect(app).toContain('handleCheckUpComplete');
    expect(app).toContain('OnboardingResultsScreen');
  });

  it('completes flag-on public onboarding through a live-derived Strength-domain V2 baseline', async () => {
    const raw = liveDerivedRawCheckUp();
    const prefs = completedProfilePreferences();
    const result = await runPublicV2Onboarding({
      raw,
      referenceProfile: ENTERED_REFERENCE_PROFILE,
      prefs,
      lifeGoal: prefs.profile.lifeGoal,
      entry: 'public_onboarding',
      planSyncMode: 'local_ready',
    });

    expect(result.rawHistory[0]).toMatchObject({
      checkupType: 'baseline',
      scoreSnapshotCompatibility: 'unsupported_checkup_protocol',
    });
    expect(result.rawHistory[0].movementProfileV2Snapshot).toBeUndefined();
    expect(result.pendingRaw?.record.checkUp.startedAt).toBe(raw.startedAt);
    expect(result.materialized.createdSnapshot).toBe(true);
    expect(result.materialized.createdAssessment).toBe(true);
    expect(result.assessment.focus).toMatchObject({ kind: 'domain', focusDomain: 'strength_power' });
    expect(result.block.origin).toMatchObject({
      kind: 'movement_profile_v2_assessment',
      sourceCheckUpId: raw.startedAt,
      sourceCheckUpType: 'baseline',
      snapshotId: result.snapshot.snapshotId,
      assessmentId: result.assessment.assessmentId,
    });
    expect(result.block.focus).toEqual({ kind: 'domain', domain: 'strength_power' });
    expect(result.presentation.variant).toBe('onboarding');
    expect(result.presentation.focus.title).toBe('Strength / Power');
    expect(result.presentation.domains[0]).toMatchObject({
      title: 'Strength / Power',
      interpretation: expect.stringMatching(/percentile/),
    });
    expect(result.presentation.actions).toHaveLength(1);
    expect(result.presentation.actions[0]).toMatchObject({
      label: 'View my 4-week plan',
      action: { type: 'view_plan' },
    });

    expect(result.adherence.assessments).toEqual([]);
    expect(result.block.id).toMatch(/^movement-block-v2:/);
    expect(result.training.block).toBeNull();
    expect(result.onboardingBeforeCta.onboarding.currentStep).toBe('results');
    expect(result.onboardingAfterCta.onboarding.currentStep).toBe('complete');
    expect(result.blockIntroRoute).toEqual({ flow: 'block-intro', blockId: result.block.id });
    expect(result.adherence.blocks).toHaveLength(1);
  });

  it('completes flag-on public onboarding with a genuine Balanced V2 block', async () => {
    const raw = capturedV2CheckUp({
      startedAt: BALANCED_STARTED_AT,
      chairReps: 12,
      balanceBestHoldSec: 32,
      shoulderPeakDeg: 151,
    });
    const result = await runPublicV2Onboarding({
      raw,
      referenceProfile: ENTERED_REFERENCE_PROFILE,
      prefs: completedProfilePreferences(),
      entry: 'public_onboarding',
    });

    expect(result.assessment.focus).toMatchObject({
      kind: 'balanced',
      reason: 'v2_focus_balanced_no_unique_signal',
    });
    expect(result.block.focusDomain).toBeUndefined();
    expect(movementBlockIsBalanced(result.block)).toBe(true);
    expect(movementBlockDomainFocus(result.block)).toBeNull();
    expect(result.block.templateIds).toEqual(['balanced-A', 'balanced-B', 'balanced-C']);
    expect(result.block.secondaryDomains).toEqual(['strength_power', 'balance', 'mobility']);
    expect(result.presentation.focus).toEqual({
      kicker: 'Suggested focus',
      title: 'Balanced',
      body: 'Your results did not point to one clear area today.',
    });
    expect(result.presentation.plan).toMatchObject({
      status: 'ready',
      body: 'Your plan gives strength, balance, and mobility equal attention across each week.',
    });
    expect(result.blockIntroRoute).toEqual({ flow: 'block-intro', blockId: result.block.id });
  });

  it('handles entered/skipped reference profiles and fails closed on invalid headline evidence', async () => {
    const profileBefore = completedProfilePreferences();
    const entered = await runPublicV2Onboarding({
      raw: capturedV2CheckUp({ startedAt: '2026-06-25T10:00:00.000Z', shoulderPeakDeg: 151 }),
      referenceProfile: referenceProfileFromMovementProfileV2Draft(
        enteredMovementProfileV2ReferenceDetailsDraft({
          exactAge: 64,
          referenceSex: 'male',
        })
      ),
      prefs: profileBefore,
      entry: 'public_onboarding',
    });
    expect(entered.snapshot.referenceProfile).toMatchObject({
      ageAtTest: 64,
      ageBasis: 'exact_age_at_test',
      referenceSex: 'male',
    });
    expect(profileBefore.profile.age).toBe(61);
    expect(entered.snapshot.interpretation.chair.percentileRange).toEqual({ kind: 'range', low: 10, high: 40 });

    const skipped = await runPublicV2Onboarding({
      raw: capturedV2CheckUp({ startedAt: '2026-06-25T11:00:00.000Z' }),
      referenceProfile: SKIPPED_REFERENCE_PROFILE,
      prefs: completedProfilePreferences(),
      entry: 'public_onboarding',
    });
    expect(skipped.snapshot.referenceProfile).toMatchObject({
      ageAtTest: null,
      ageBasis: 'unknown',
      referenceSex: 'unknown',
    });
    expect(skipped.snapshot.interpretation.balance.taskBand).toBeTruthy();
    expect(skipped.block.id).toMatch(/^movement-block-v2:/);

    const validShapeRaw = capturedV2CheckUp({ startedAt: '2026-06-25T12:00:00.000Z' });
    const invalidRaw: CheckUp = {
      ...validShapeRaw,
      items: validShapeRaw.items.map((item) =>
        item.movementId === ONE_LEG_BALANCE_V2_ID && item.status === 'measured'
          ? {
              ...item,
              result: {
                ...(item.result as unknown as Record<string, unknown>),
                evidenceStatus: 'invalid_measurement',
                bestHoldSec: Number.NaN,
                invalidReasons: ['h31_invalid_balance_evidence'],
              } as never,
            }
          : item
      ),
    };
    const store = new HistoryStore(createMemoryFs());
    store.save(invalidRaw, { checkupType: 'baseline' });
    const rawHistory = await store.loadAll();
    const materialized = materializeOfficialMovementProfileV2Artifacts({
      checkUp: invalidRaw,
      checkupType: 'baseline',
      referenceProfile: ENTERED_REFERENCE_PROFILE,
      acceptedHistory: rawHistory,
      snapshotCreatedAt: MATERIALIZED_AT,
      assessmentCreatedAt: MATERIALIZED_AT,
    });
    expect(materialized.ok).toBe(false);
    expect(materialized).toMatchObject({
      status: 'rejected',
      reason: 'v2_assessment_orchestration_ineligible_source',
    });
    expect(rawHistory).toHaveLength(1);
    const pendingInvalidRaw = latestPendingMovementProfileV2RawCheckUp(rawHistory);
    expect(pendingInvalidRaw?.record.checkUp.startedAt).toBe(invalidRaw.startedAt);
    expect(pendingInvalidRaw?.record.movementProfileV2Snapshot).toBeUndefined();
    expect(pendingInvalidRaw?.record.movementProfileV2Assessment).toBeUndefined();
    expect(
      materializeMovementProfileV2Block({
        adherence: defaultAdherenceStoreState(),
        checkUp: invalidRaw,
        checkupType: 'baseline',
        snapshot: {},
        assessment: {},
        startDate: BLOCK_START,
      })
    ).toMatchObject({ ok: false });
  });

  it('keeps standard baseline and baseline-retake artifacts immutable while active blocks are not replaced', async () => {
    const first = await runPublicV2Onboarding({
      raw: capturedV2CheckUp({ startedAt: '2026-06-25T13:00:00.000Z' }),
      referenceProfile: ENTERED_REFERENCE_PROFILE,
      prefs: completedProfilePreferences(),
      entry: 'public_standard',
      variant: 'standard',
    });
    expect(first.presentation.variant).toBe('standard');
    expect(first.onboardingBeforeCta.onboarding.currentStep).not.toBe('results');

    expect(
      selectPublicMovementCheckUpLaunch({
        sourceType: 'baseline',
        releaseEnabled: true,
        hasAcceptedMovementProfileV2Baseline: true,
      })
    ).toMatchObject({
      status: 'ready',
      engine: 'unified_movement_profile',
      sourceType: 'baseline_retake',
    });

    const prefilled = createMovementProfileV2InternalFlow({
      startedAt: BASELINE_RETAKE_STARTED_AT,
      history: first.fullHistory,
    });
    expect(prefilled.sourceType).toBe('baseline_retake');
    expect(prefilled.priorStandingLeg).toBe('left');
    expect(prefilled.priorShoulderSide).toBe('right');

    const retakeRaw = capturedV2CheckUp({
      startedAt: BASELINE_RETAKE_STARTED_AT,
      sourceType: 'baseline_retake',
      balanceBestHoldSec: 8,
    });
    const retakeMaterialized = materializeOfficialMovementProfileV2Artifacts({
      checkUp: retakeRaw,
      checkupType: 'baseline_retake',
      referenceProfile: ENTERED_REFERENCE_PROFILE,
      acceptedHistory: first.fullHistory,
      snapshotCreatedAt: '2026-07-25T08:09:00.000Z',
      assessmentCreatedAt: '2026-07-25T08:09:00.000Z',
    });
    expect(retakeMaterialized.ok).toBe(true);
    if (!retakeMaterialized.ok) throw new Error(retakeMaterialized.reason);
    expect(retakeMaterialized.snapshot.sourceCheckUpId).toBe(retakeRaw.startedAt);
    expect(first.snapshot.snapshotFingerprint).toBe(first.fullHistory[0].movementProfileV2Snapshot?.snapshotFingerprint);

    const activeConflict = materializeMovementProfileV2Block({
      adherence: first.adherence,
      checkUp: retakeMaterialized.checkUp,
      checkupType: 'baseline_retake',
      snapshot: retakeMaterialized.snapshot,
      assessment: retakeMaterialized.assessment,
      startDate: '2026-07-25T08:10:00.000Z',
    });
    expect(activeConflict).toMatchObject({
      ok: false,
      reason: 'v2_block_active_block_conflict',
      existingBlockId: first.block.id,
    });
  });

  it('is idempotent across raw completion, reference submission, route, and CTA replay boundaries', async () => {
    const raw = capturedV2CheckUp({ startedAt: '2026-06-25T14:00:00.000Z', balanceBestHoldSec: 8 });
    const store = new HistoryStore(createMemoryFs());
    store.save(raw, { checkupType: 'baseline' });
    store.save(raw, { checkupType: 'baseline' });
    const rawHistory = await store.loadAll();
    expect(rawHistory).toHaveLength(1);
    expect(latestPendingMovementProfileV2RawCheckUp(rawHistory)?.record.checkUp.startedAt).toBe(raw.startedAt);

    const first = materializeOfficialMovementProfileV2Artifacts({
      checkUp: raw,
      checkupType: 'baseline',
      referenceProfile: ENTERED_REFERENCE_PROFILE,
      acceptedHistory: rawHistory,
      snapshotCreatedAt: MATERIALIZED_AT,
      assessmentCreatedAt: MATERIALIZED_AT,
    });
    expect(first.ok).toBe(true);
    if (!first.ok) throw new Error(first.reason);
    store.save(first.checkUp, {
      checkupType: 'baseline',
      movementProfileV2Snapshot: first.snapshot,
      movementProfileV2Assessment: first.assessment,
    });
    const historyAfterArtifacts = await store.loadAll();

    const replay = materializeOfficialMovementProfileV2Artifacts({
      checkUp: first.checkUp,
      checkupType: 'baseline',
      referenceProfile: ENTERED_REFERENCE_PROFILE,
      acceptedHistory: historyAfterArtifacts,
      snapshotCreatedAt: '2026-06-26T08:09:00.000Z',
      assessmentCreatedAt: '2026-06-26T08:09:00.000Z',
    });
    expect(replay.ok).toBe(true);
    if (!replay.ok) throw new Error(replay.reason);
    expect(replay.createdSnapshot).toBe(false);
    expect(replay.createdAssessment).toBe(false);
    expect(replay.snapshot.snapshotFingerprint).toBe(first.snapshot.snapshotFingerprint);
    expect(replay.assessment.assessmentFingerprint).toBe(first.assessment.assessmentFingerprint);

    const createdBlock = materializeMovementProfileV2Block({
      adherence: defaultAdherenceStoreState(),
      checkUp: first.checkUp,
      checkupType: 'baseline',
      snapshot: first.snapshot,
      assessment: first.assessment,
      startDate: BLOCK_START,
    });
    expect(createdBlock.ok).toBe(true);
    if (!createdBlock.ok) throw new Error(createdBlock.reason);
    const reusedBlock = materializeMovementProfileV2Block({
      adherence: createdBlock.adherence,
      checkUp: replay.checkUp,
      checkupType: 'baseline',
      snapshot: replay.snapshot,
      assessment: replay.assessment,
      startDate: BLOCK_START,
    });
    expect(reusedBlock).toMatchObject({
      ok: true,
      status: 'reused',
      block: expect.objectContaining({
        id: createdBlock.block.id,
        blockFingerprint: createdBlock.block.blockFingerprint,
        startDate: createdBlock.block.startDate,
      }),
    });

    const route1 = {
      flow: 'movement-profile-v2-unified-results',
      blockId: createdBlock.block.id,
    };
    const route2 = {
      flow: 'movement-profile-v2-unified-results',
      blockId: createdBlock.block.id,
    };
    expect(route2).toEqual(route1);

    const prefs = completedProfilePreferences();
    const afterFirstCta = completeOnboardingCta(prefs, first.checkUp.startedAt, '2026-06-25T14:10:00.000Z');
    const afterSecondCta = completeOnboardingCta(afterFirstCta, first.checkUp.startedAt, '2026-06-25T14:11:00.000Z');
    expect(afterSecondCta.onboarding.currentStep).toBe('complete');
    expect(afterSecondCta.onboarding.completedAt).toBe(afterFirstCta.onboarding.completedAt);
    expect(createdBlock.adherence.blocks).toHaveLength(1);
  });

  it('resumes and restores V2 state without recomputing or falling back to V1, including sync-pending local readiness', async () => {
    const raw = capturedV2CheckUp({ startedAt: '2026-06-25T15:00:00.000Z', balanceBestHoldSec: 8 });
    const run = await runPublicV2Onboarding({
      raw,
      referenceProfile: ENTERED_REFERENCE_PROFILE,
      prefs: completedProfilePreferences(),
      entry: 'public_onboarding',
      planSyncMode: 'sync_pending_local_ready',
    });

    expect(run.planState).toEqual({
      status: 'sync_pending_local_ready',
      blockId: run.block.id,
    });
    expect(run.presentation.actions[0]?.label).toBe('View my 4-week plan');

    const serializedRaw = deserializeCheckUp(serializeCheckUp(raw, { checkupType: 'baseline' }));
    expect(serializedRaw?.scoreSnapshotCompatibility).toBe('unsupported_checkup_protocol');
    expect(serializedRaw?.movementProfileV2Assessment).toBeUndefined();
    const snapshotOnly = deserializeCheckUp(serializeCheckUp(raw, {
      checkupType: 'baseline',
      movementProfileV2Snapshot: run.snapshot,
    }));
    expect(snapshotOnly?.movementProfileV2Snapshot?.snapshotFingerprint).toBe(run.snapshot.snapshotFingerprint);
    expect(snapshotOnly?.movementProfileV2Assessment).toBeUndefined();
    const assessmentOnlyNoBlock = deserializeCheckUp(serializeCheckUp(raw, {
      checkupType: 'baseline',
      movementProfileV2Snapshot: run.snapshot,
      movementProfileV2Assessment: run.assessment,
    }));
    expect(assessmentOnlyNoBlock?.movementProfileV2Assessment?.assessmentFingerprint).toBe(run.assessment.assessmentFingerprint);

    const remote = mapRemoteHaleSnapshotToLocal(remoteSnapshotFromRun(run), emptyLocalRestore());
    expect(remote.state.history).toHaveLength(1);
    expect(remote.state.history[0].movementProfileV2Snapshot?.snapshotFingerprint).toBe(run.snapshot.snapshotFingerprint);
    expect(remote.state.history[0].movementProfileV2Assessment?.assessmentFingerprint).toBe(run.assessment.assessmentFingerprint);
    expect(remote.state.adherence.assessments).toEqual([]);
    expect(remote.state.adherence.blocks[0]).toMatchObject({
      id: run.block.id,
      origin: expect.objectContaining({ kind: 'movement_profile_v2_assessment' }),
    });
    expect(requireHaleSessionPlan({
      activeBlock: remote.state.adherence.blocks[0],
      training: defaultTrainingState(),
      safetyProfile: safetyProfile(),
      today: BLOCK_START,
    }).blockId).toBe(run.block.id);

    expect(
      selectPublicMovementCheckUpLaunch({
        sourceType: 'baseline',
        releaseEnabled: false,
      })
    ).toMatchObject({ status: 'ready', engine: 'unified_movement_profile' });
    expect(remote.state.history[0].scoreSnapshot).toBeUndefined();
    expect(latestMaterializedMovementProfileV2Result(remote.state.history)?.assessment.assessmentFingerprint).toBe(
      run.assessment.assessmentFingerprint
    );
  });

  it('preserves complete and partial V2 state across release flag toggles and rollback attempts', async () => {
    const run = await runPublicV2Onboarding({
      raw: capturedV2CheckUp({ startedAt: '2026-06-25T16:00:00.000Z' }),
      referenceProfile: ENTERED_REFERENCE_PROFILE,
      prefs: completedProfilePreferences(),
      entry: 'public_onboarding',
    });

    const plan = requireHaleSessionPlan({
      activeBlock: run.block,
      training: defaultTrainingState(),
      safetyProfile: safetyProfile(),
      today: BLOCK_START,
    });
    expect(plan.blockId).toBe(run.block.id);
    expect(
      getHaleAppLifecycle({
        profile: completedProfilePreferences().profile,
        history: run.fullHistory,
        adherence: run.adherence,
        training: defaultTrainingState(),
        today: BLOCK_START,
      }).state
    ).toBe('first_session_ready');

    const off = selectPublicMovementCheckUpLaunch({
      sourceType: 'baseline',
      releaseEnabled: false,
      hasAcceptedMovementProfileV2Baseline: true,
      activeBlockOriginKind: run.block.origin?.kind ?? null,
    });
    const onAgain = selectPublicMovementCheckUpLaunch({
      sourceType: 'baseline',
      releaseEnabled: true,
      hasAcceptedMovementProfileV2Baseline: true,
      activeBlockOriginKind: run.block.origin?.kind ?? null,
    });
    expect(off).toMatchObject({
      status: 'ready',
      engine: 'unified_movement_profile',
      sourceType: 'baseline_retake',
    });
    expect(onAgain).toMatchObject({
      status: 'ready',
      engine: 'unified_movement_profile',
      sourceType: 'baseline_retake',
    });
    expect(run.fullHistory[0].movementProfileV2Snapshot?.snapshotFingerprint).toBe(run.snapshot.snapshotFingerprint);
    expect(run.adherence.blocks[0].blockFingerprint).toBe(run.block.blockFingerprint);

    for (const partial of [
      serializeCheckUp(run.raw, { checkupType: 'baseline' }),
      serializeCheckUp(run.materialized.checkUp, {
        checkupType: 'baseline',
        movementProfileV2Snapshot: run.snapshot,
      }),
      serializeCheckUp(run.materialized.checkUp, {
        checkupType: 'baseline',
        movementProfileV2Snapshot: run.snapshot,
        movementProfileV2Assessment: run.assessment,
      }),
    ]) {
      const restored = deserializeCheckUp(partial);
      expect(restored?.scoreSnapshotCompatibility).toBe('unsupported_checkup_protocol');
      expect(restored?.checkUp.protocolPolicy?.id).toBe(MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID);
    }
  });

  it('contains every V2-origin official-retest entry point while preserving true V1 rollback retest', async () => {
    const run = await runPublicV2Onboarding({
      raw: capturedV2CheckUp({ startedAt: '2026-06-25T17:00:00.000Z', balanceBestHoldSec: 8 }),
      referenceProfile: ENTERED_REFERENCE_PROFILE,
      prefs: completedProfilePreferences(),
      entry: 'public_onboarding',
    });
    const completions = completeFourWeeks(run.block);
    const schedule = getBlockScheduleState({
      block: run.block,
      completions,
      today: RETEST_DUE_AT,
    });
    expect(schedule.status).toBe('retest_due');

    const lifecycle = getHaleAppLifecycle({
      profile: completedProfilePreferences().profile,
      history: run.fullHistory,
      adherence: { ...run.adherence, completions },
      training: defaultTrainingState(),
      today: RETEST_DUE_AT,
    });
    expect(lifecycle.state).toBe('monthly_retest_due');
    expect(lifecycle.primaryAction.type).toBe('start_retest');

    for (const entry of ['today', 'plan', 'progress', 'direct'] as const) {
      expect(entry).toBeTruthy();
      expect(
        selectPublicMovementCheckUpLaunch({
          sourceType: 'official_retest',
          releaseEnabled: entry === 'today',
          activeBlockOriginKind: run.block.origin?.kind ?? null,
        })
      ).toEqual({
        status: 'unavailable',
        reason: 'v2_official_retest_not_due',
        sourceType: 'official_retest',
        entryContext: 'standard',
      });
    }

    const oldHome = getNextBestAction({
      lifeGoal: completedProfilePreferences().profile.lifeGoal,
      profile: completedProfilePreferences().profile,
      latestAssessment: null,
      activeBlock: run.block,
      sessionCompletions: completions,
      now: RETEST_DUE_AT,
    });
    expect(oldHome.state).not.toBe('active_block_retest_due');

    expect(
      selectPublicMovementCheckUpLaunch({
        sourceType: 'official_retest',
        releaseEnabled: false,
        activeBlockOriginKind: undefined,
      })
    ).toMatchObject({
      status: 'unavailable',
      reason: 'legacy_v1_rollback_disabled',
    });
    expect(
      selectPublicMovementCheckUpLaunch({
        sourceType: 'official_retest',
        legacyV1RollbackEnabled: true,
        activeBlockOriginKind: 'legacy_v1_assessment',
      })
    ).toMatchObject({
      status: 'ready',
      engine: 'legacy_v1',
      sourceType: 'official_retest',
    });

    const app = source('App.tsx');
    expect(app).toContain("onStartRetest={() => beginCheckUp('official_retest')}");
    expect(app).toContain('movement-profile-v2-retest-unavailable');
    expect(app).toContain('PUBLIC_MOVEMENT_PROFILE_V2_FLOWS');
    expect(app).not.toContain('movement-profile-v2-official-retest');
    expect(app).not.toContain('movement-profile-v2-report');
  });

  it('keeps public copy clean, obsolete internal launchers removed, and breadcrumbs privacy-bounded', () => {
    const run = buildViewOnlyPresentation();
    const publicText = JSON.stringify(run.presentation);
    expect(publicText).not.toMatch(/v2|unified|internal|developer|diagnostics|schema|fingerprint|source id|movement age|weakest|physical validation|build my plan|create my plan|generate my plan|personalise my plan/i);
    expect(publicText).toContain('Movement Profile');
    expect(publicText).toContain('View my 4-week plan');

    const shell = source('src/screens/MovementProfileV2UnifiedCheckUpScreen.tsx');
    const results = source('src/screens/MovementProfileV2UnifiedResultsScreen.tsx');
    expect(shell).toContain('CheckUpRecordingShell');
    expect(shell).toContain('const handsFreeMode = voiceRuntimeEnabled');
    expect(shell).not.toContain('internal_comparison');
    expect(results).toContain('buildMovementProfileV2UnifiedResultsPresentation');

    const settings = source('src/screens/SettingsScreen.tsx');
    expect(settings).not.toContain('onStartMovementProfileV2Internal');
    expect(settings).not.toContain('onStartMovementProfileV2UnifiedInternal');
    expect(settings).not.toContain('Movement Profile V2 unified shell');

    const sanitized = sanitizeForObservability({
      engine: 'unified_movement_profile',
      sourceType: 'baseline',
      entryContext: 'onboarding',
      snapshotId: 'snapshot-1',
      assessmentId: 'assessment-1',
      video: 'raw-video',
      landmarks: [1, 2, 3],
      rawBodyCoordinates: { x: 0.1 },
      healthNotes: 'knee pain',
      access_token: 'secret-token',
      fileUri: 'file://private',
    }) as Record<string, unknown>;
    expect(sanitized).toMatchObject({
      engine: 'unified_movement_profile',
      sourceType: 'baseline',
      entryContext: 'onboarding',
      snapshotId: 'snapshot-1',
      assessmentId: 'assessment-1',
    });
    expect(JSON.stringify(sanitized)).not.toMatch(/raw-video|landmarks|secret-token|file:\/\/private/);
  });
});

function source(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

interface PublicV2Run {
  raw: CheckUp;
  rawHistory: StoredCheckUp[];
  fullHistory: StoredCheckUp[];
  pendingRaw: ReturnType<typeof latestPendingMovementProfileV2RawCheckUp>;
  materialized: Extract<ReturnType<typeof materializeOfficialMovementProfileV2Artifacts>, { ok: true }>;
  snapshot: Extract<ReturnType<typeof materializeOfficialMovementProfileV2Artifacts>, { ok: true }>['snapshot'];
  assessment: Extract<ReturnType<typeof materializeOfficialMovementProfileV2Artifacts>, { ok: true }>['assessment'];
  block: MovementBlock;
  adherence: AdherenceStoreState;
  training: ReturnType<typeof defaultTrainingState>;
  planState: MovementProfileV2UnifiedPlanState;
  presentation: ReturnType<typeof buildMovementProfileV2UnifiedResultsPresentation>;
  onboardingBeforeCta: Preferences;
  onboardingAfterCta: Preferences;
  blockIntroRoute: { flow: 'block-intro'; blockId: string };
}

async function runPublicV2Onboarding({
  raw,
  referenceProfile,
  prefs,
  entry,
  variant,
  lifeGoal = prefs.profile.lifeGoal,
  planSyncMode = 'ready',
}: {
  raw: CheckUp;
  referenceProfile: MovementProfileV2ReferenceProfile;
  prefs: Preferences;
  entry: 'public_onboarding' | 'public_standard';
  variant?: 'onboarding' | 'standard';
  lifeGoal?: UserProfile['lifeGoal'];
  planSyncMode?: 'ready' | 'local_ready' | 'sync_pending_local_ready';
}): Promise<PublicV2Run> {
  const sourceType = raw.startedAt === BASELINE_RETAKE_STARTED_AT ? 'baseline_retake' : 'baseline';
  const store = new HistoryStore(createMemoryFs());
  store.save(raw, { checkupType: sourceType });
  const rawHistory = await store.loadAll();
  const pendingRaw = latestPendingMovementProfileV2RawCheckUp(rawHistory);

  const materialized = materializeOfficialMovementProfileV2Artifacts({
    checkUp: raw,
    checkupType: sourceType,
    referenceProfile,
    lifeGoal,
    acceptedHistory: rawHistory,
    snapshotCreatedAt: MATERIALIZED_AT,
    assessmentCreatedAt: MATERIALIZED_AT,
  });
  expect(materialized.ok).toBe(true);
  if (!materialized.ok) throw new Error(materialized.reason);

  store.save(materialized.checkUp, {
    checkupType: sourceType,
    movementProfileV2Snapshot: materialized.snapshot,
    movementProfileV2Assessment: materialized.assessment,
  });
  const fullHistory = await store.loadAll();

  const blockResult = materializeMovementProfileV2Block({
    adherence: defaultAdherenceStoreState(),
    checkUp: materialized.checkUp,
    checkupType: sourceType,
    snapshot: materialized.snapshot,
    assessment: materialized.assessment,
    userId: LOCAL_USER_ID,
    startDate: BLOCK_START,
  });
  expect(blockResult.ok).toBe(true);
  if (!blockResult.ok) throw new Error(blockResult.reason);

  const planState: MovementProfileV2UnifiedPlanState =
    planSyncMode === 'sync_pending_local_ready'
      ? { status: 'sync_pending_local_ready', blockId: blockResult.block.id }
      : { status: 'ready', blockId: blockResult.block.id };
  const viewModel = buildMovementProfileV2ResultsViewModel({
    snapshot: materialized.snapshot,
    assessment: materialized.assessment,
  });
  const presentation = buildMovementProfileV2UnifiedResultsPresentation({
    viewModel,
    planState,
    variant: variant ?? (entry === 'public_onboarding' ? 'onboarding' : 'standard'),
  });
  const onboardingBeforeCta =
    entry === 'public_onboarding'
      ? {
          ...prefs,
          onboarding: {
            ...prefs.onboarding,
            currentStep: 'results' as const,
            baselineResultId: materialized.checkUp.startedAt,
            updatedAt: materialized.checkUp.startedAt,
          },
        }
      : prefs;
  const onboardingAfterCta =
    entry === 'public_onboarding'
      ? completeOnboardingCta(onboardingBeforeCta, materialized.checkUp.startedAt, MATERIALIZED_AT)
      : onboardingBeforeCta;

  return {
    raw,
    rawHistory,
    fullHistory,
    pendingRaw,
    materialized,
    snapshot: materialized.snapshot,
    assessment: materialized.assessment,
    block: blockResult.block,
    adherence: blockResult.adherence,
    training: defaultTrainingState(),
    planState,
    presentation,
    onboardingBeforeCta,
    onboardingAfterCta,
    blockIntroRoute: { flow: 'block-intro', blockId: blockResult.block.id },
  };
}

function completeOnboardingCta(prefs: Preferences, baselineResultId: string, now: string): Preferences {
  return {
    ...prefs,
    onboarding: {
      ...prefs.onboarding,
      currentStep: 'complete',
      baselineResultId,
      completedAt: prefs.onboarding.completedAt ?? now,
      updatedAt: now,
    },
  };
}

function completedProfilePreferences(): Preferences {
  const prefs = defaultPreferences();
  const lifeGoal = createLifeGoal({ category: 'stairs', nowIso: MATERIALIZED_AT });
  return {
    ...prefs,
    profile: {
      ...prefs.profile,
      name: 'Sam',
      exactAge: 61,
      referenceSex: 'female',
      age: 61,
      ageBand: '55_64',
      goal: 'Keep stairs feeling manageable',
      lifeGoal,
      safetyProfile: safetyProfile(),
    },
    onboarding: {
      ...prefs.onboarding,
      currentStep: 'baseline_checkup',
      updatedAt: MATERIALIZED_AT,
    },
  };
}

function safetyProfile(): MovementSafetyProfile {
  return {
    id: 'safety-h31',
    userId: LOCAL_USER_ID,
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
      updatedAt: MATERIALIZED_AT,
    },
    preferredWorkoutDays: ['Mon', 'Wed', 'Fri'],
    createdAt: MATERIALIZED_AT,
    updatedAt: MATERIALIZED_AT,
  };
}

function capturedV2CheckUp({
  startedAt,
  sourceType = 'baseline',
  chairReps = 12,
  balanceBestHoldSec = 32,
  shoulderPeakDeg = 151,
  omitShoulder = false,
}: {
  startedAt: string;
  sourceType?: 'baseline' | 'baseline_retake';
  chairReps?: number;
  balanceBestHoldSec?: number;
  shoulderPeakDeg?: number;
  omitShoulder?: boolean;
}): CheckUp {
  let flow = createMovementProfileV2InternalFlow({ startedAt });
  flow = { ...flow, sourceType };
  flow = movementProfileV2InternalFlowReducer(flow, { type: 'confirm_chair_setup' });
  flow = movementProfileV2InternalFlowReducer(flow, { type: 'complete_chair_practice' });
  flow = movementProfileV2InternalFlowReducer(flow, {
    type: 'record_chair',
    result: createCapturedChairRiseV2Result({ reps: chairReps }),
  });
  flow = movementProfileV2InternalFlowReducer(flow, {
    type: 'confirm_balance_setup',
    standingLeg: 'left',
  });
  flow = movementProfileV2InternalFlowReducer(flow, {
    type: 'record_balance',
    result: createCapturedOneLegBalanceV2Result({
      standingLeg: 'left',
      holdsSec: [balanceBestHoldSec, Math.max(0, balanceBestHoldSec - 1), Math.max(0, balanceBestHoldSec - 2)],
    }),
  });
  if (!omitShoulder) {
    flow = movementProfileV2InternalFlowReducer(flow, {
      type: 'confirm_shoulder_setup',
      shoulderSide: 'right',
    });
    flow = movementProfileV2InternalFlowReducer(flow, {
      type: 'record_shoulder',
      result: createCapturedActiveShoulderReachV2Result({
        selectedSide: 'right',
        peakFlexionDeg: shoulderPeakDeg,
      }),
    });
    flow = movementProfileV2InternalFlowReducer(flow, {
      type: 'record_hinge',
      result: createCapturedHingeReachResult(0.24),
    });
    const checkUp = movementProfileV2RawCheckUpFromFlow(flow);
    if (!checkUp) throw new Error('expected captured V2 check-up');
    return checkUp;
  }
  const items: CheckUpItem[] = flow.items.slice();
  return {
    startedAt,
    protocolPolicy: createCheckUpProtocolPolicy(MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID, startedAt),
    bodyUnit: flow.bodyUnit,
    items,
  };
}

function liveDerivedRawCheckUp(): CheckUp {
  const coordinator = new MovementProfileV2LiveCoordinator({
    ...createMovementProfileV2InternalFlow({ startedAt: LIVE_STARTED_AT }),
    sourceType: 'baseline',
  });
  let nowMs = completeLiveCheckupUntilHinge(coordinator);
  expect(coordinator.snapshot(nowMs).stage).toBe('hinge_setup');
  expect(coordinator.receiveUserAction({ type: 'hinge_setup_voice_completed' }, nowMs - 1)).toBe(true);
  expect(coordinator.receiveUserAction({ type: 'start_hinge_capture' }, nowMs)).toBe(true);
  feedHingeCapture(coordinator, nowMs + 100);
  coordinator.receiveTimerTick(nowMs + 9200);
  const checkUp = coordinator.snapshot(nowMs + 9200).checkUp;
  if (!checkUp) throw new Error('expected live-derived V2 check-up');
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
      trackingOutput({ ...raw, timestampMs: nowMs }, session.truth.bodyUnit, {
        leftSide: 0.3,
        rightSide: 0.95,
      }),
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

function emptyLocalRestore() {
  return {
    preferences: defaultPreferences(),
    history: [],
    training: defaultTrainingState(),
    microChecks: [],
    adherence: defaultAdherenceStoreState(),
  };
}

function remoteSnapshotFromRun(run: PublicV2Run): Parameters<typeof mapRemoteHaleSnapshotToLocal>[0] {
  return {
    profile: null,
    movementCheckups: [
      {
        id: 'remote-v2-checkup',
        local_checkup_id: run.raw.startedAt,
        checkup_type: 'baseline',
        status: 'completed',
        derived_scores_json: JSON.parse(JSON.stringify({
          schemaVersion: 1,
          exactCheckupType: 'baseline',
          movementProfileV2Snapshot: run.snapshot,
          movementProfileV2SnapshotCompatibility: 'current',
          movementProfileV2Assessment: run.assessment,
          movementProfileV2AssessmentCompatibility: 'current',
        })),
        raw_checkup_json: JSON.parse(
          serializeCheckUp(run.materialized.checkUp, {
            checkupType: 'baseline',
            movementProfileV2Snapshot: run.snapshot,
            movementProfileV2Assessment: run.assessment,
          })
        ),
        created_locally_at: run.raw.startedAt,
        completed_at: run.raw.startedAt,
      },
    ],
    movementBlocks: [
      {
        id: 'remote-v2-block',
        local_block_id: run.block.id,
        source_checkup_id: run.raw.startedAt,
        block_number: 1,
        focus_domain: run.block.focusDomain ?? null,
        status: run.block.status,
        started_at: run.block.startDate,
        completed_at: null,
        block_json: JSON.parse(JSON.stringify({ movementBlock: run.block })),
      },
    ],
    trainingState: null,
    trainingSessionCompletions: [],
    microChecks: [],
    movementBlockReports: [],
    fetchErrors: {},
  };
}

function completeFourWeeks(block: MovementBlock) {
  const templateIds = requiredMainPlanTemplatesForBlock(block).templateIds.slice(0, 3);
  const completions = [];
  for (let week = 0; week < 4; week++) {
    for (let day = 0; day < templateIds.length; day++) {
      const date = addDays(BLOCK_START, week * 7 + day);
      const dateKey = date.slice(0, 10);
      const templateId = templateIds[day];
      completions.push(
        makeTrainingSessionCompletion({
          block,
          sessionType: week === 0 && day === 0 ? 'starter' : 'standard',
          completedAt: date,
          plannedDate: `${templateId}:${dateKey}`,
          source: 'block_generated',
          templateId,
          mainPlanCredit: true,
          focusStimulusEvidence: focusEvidence(block, templateId),
        })
      );
    }
  }
  return completions;
}

function focusEvidence(
  block: MovementBlock,
  templateId: string,
  overrides: Partial<TrainingFocusStimulusEvidenceSummary> = {}
): TrainingFocusStimulusEvidenceSummary {
  const primaryDomain =
    templateId.startsWith('balance') || templateId === 'balanced-B'
      ? 'balance_stability'
      : templateId.startsWith('mobility') || templateId === 'balanced-C'
        ? 'mobility_flexibility'
        : 'strength_power';
  const exerciseId = `${templateId}-primary`;
  return {
    planStatus: 'eligible',
    status: 'credited_focus_work',
    exclusionReason: 'none',
    mainPlanCredit: true,
    blockFocusDomain: movementBlockDomainFocus(block) ?? undefined,
    plannedPrimaryDomain: primaryDomain,
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
    ...overrides,
  };
}

function addDays(startIso: string, days: number): string {
  const date = new Date(startIso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function buildViewOnlyPresentation() {
  const raw = capturedV2CheckUp({ startedAt: '2026-06-25T18:00:00.000Z' });
  const materialized = materializeOfficialMovementProfileV2Artifacts({
    checkUp: raw,
    checkupType: 'baseline',
    referenceProfile: ENTERED_REFERENCE_PROFILE,
    acceptedHistory: [],
    snapshotCreatedAt: MATERIALIZED_AT,
    assessmentCreatedAt: MATERIALIZED_AT,
  });
  if (!materialized.ok) throw new Error(materialized.reason);
  const viewModel = buildMovementProfileV2ResultsViewModel({
    snapshot: materialized.snapshot,
    assessment: materialized.assessment,
  });
  return {
    presentation: buildMovementProfileV2UnifiedResultsPresentation({
      viewModel,
      planState: { status: 'ready', blockId: 'movement-block-v2:copy' },
      variant: 'onboarding',
    }),
  };
}
