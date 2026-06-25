import { BALANCE_LADDER_ID, CHAIR_STAND_ID, SHOULDER_FLEXION_ID } from '../../../movements';
import { blockProgress, defaultAdherenceStoreState, type MovementBlock, type MovementBlockReport } from '../../../adherence';
import {
  MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID,
  createActiveShoulderReachV2Setup,
  createChairRiseV2Setup,
  createCheckUpProtocolPolicy,
  createOneLegBalanceV2Setup,
  type CheckUp,
} from '../../../checkup';
import {
  ACTIVE_SHOULDER_REACH_V2_ID,
  type ActiveShoulderReachV2Result,
} from '../../../movements/activeShoulderReachV2';
import { CHAIR_RISE_V2_ID, type ChairRiseV2Result } from '../../../movements/chairRiseV2';
import { ONE_LEG_BALANCE_V2_ID, type OneLegBalanceV2Result } from '../../../movements/oneLegBalanceV2';
import { HISTORY_SCHEMA_VERSION, type StoredCheckUp } from '../../../history';
import { defaultPreferences } from '../../../profile';
import { createMovementProfileV2Assessment, createMovementProfileV2Snapshot } from '../../../reference/movementProfileV2';
import { createCurrentVersionedScoreSnapshot, type VersionedCheckUpScoreSnapshot } from '../../../scoring';
import { LOADED_STS_ID, STS_STANDARD_ID } from '../../../exercises';
import {
  TRAINING_SCHEMA_VERSION,
  defaultTrainingState,
  type MicroCheckResult,
  type TrainingState,
} from '../../../training';
import {
  classifyMainPlanCompletion,
  planTodayHaleSession,
  requireHaleSessionPlan,
} from '../../../haleFlow';

import {
  isLocalStateEmptyForRestore,
  mapRemoteHaleSnapshotToLocal,
  restoreRemoteStateIfLocalEmpty,
  type LocalHaleStateForRestore,
  type RemoteHaleSnapshot,
} from '../restoreService';

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('../authService', () => ({
  getCurrentSession: jest.fn(),
}));

const userId = 'user-123';
const startedAt = '2026-06-17T12:00:00.000Z';

function checkUp(): CheckUp {
  return {
    startedAt,
    bodyUnit: 0.33,
    items: [
      {
        movementId: CHAIR_STAND_ID,
        status: 'measured',
        result: {
          movementId: CHAIR_STAND_ID,
          flags: [],
          interruptions: 0,
          reps: 14,
          repStats: [],
          sessionMeanVel: 0.28,
          sessionMeanPeakVel: 0.41,
          pushOffDetected: false,
        } as never,
      },
      {
        movementId: BALANCE_LADDER_ID,
        status: 'measured',
        result: {
          movementId: BALANCE_LADDER_ID,
          flags: [],
          interruptions: 0,
          stages: [],
          singleLegEyesOpenSec: 12,
        } as never,
      },
      {
        movementId: SHOULDER_FLEXION_ID,
        status: 'measured',
        result: {
          movementId: SHOULDER_FLEXION_ID,
          flags: [],
          interruptions: 0,
          peakFlexionDeg: 152,
        } as never,
      },
    ],
  };
}

function storedCheckUp(): StoredCheckUp {
  const localCheckUp = checkUp();
  const scored = createCurrentVersionedScoreSnapshot(localCheckUp);
  return {
    schemaVersion: HISTORY_SCHEMA_VERSION,
    checkupType: 'baseline',
    checkUp: localCheckUp,
    scoreSnapshot: scored.snapshot ?? undefined,
    scoreSnapshotCompatibility: scored.snapshot ? 'current' : 'invalid_snapshot',
  };
}

function movementBlock(): MovementBlock {
  return {
    id: 'movement-block-1',
    userId: 'local-device-user',
    status: 'active',
    startDate: '2026-06-18T08:00:00.000Z',
    endDate: '2026-07-16T08:00:00.000Z',
    retestDate: '2026-07-16T08:00:00.000Z',
    focusDomain: 'strength_power',
    secondaryDomains: ['balance', 'mobility'],
    sessionsPerWeekTarget: 3,
    totalPlannedSessions: 12,
    completedSessions: 1,
    microChecksCompleted: 0,
    sourceCheckUpId: startedAt,
    createdAt: '2026-06-18T08:00:00.000Z',
    updatedAt: '2026-06-18T08:00:00.000Z',
  };
}

function trainingState(): TrainingState {
  return {
    ...defaultTrainingState(),
    block: {
      createdAt: '2026-06-18T08:00:00.000Z',
      weeks: 4,
      sessionsPerWeek: 3,
      weakestDomain: 'strength',
      sessions: [
        {
          index: 0,
          week: 1,
          dayOfWeek: 1,
          slots: [{ slot: 'lower-push', family: 'sit-to-stand' }],
        },
      ],
    },
    progress: {
      completedSessions: 1,
      lastSessionAt: '2026-06-19T08:30:00.000Z',
      retestDueAt: null,
    },
  };
}

function microCheck(): MicroCheckResult {
  return {
    type: 'chair-power',
    startedAt: '2026-06-24T08:00:00.000Z',
    value: 0.31,
    reps: 5,
    measured: true,
  };
}

function blockReport(): MovementBlockReport {
  return {
    id: 'report-movement-block-1',
    userId: 'local-device-user',
    blockId: 'movement-block-1',
    baselineAssessmentId: `assessment-baseline-${startedAt.replace(/[:.]/g, '-')}`,
    createdAt: '2026-07-16T09:00:00.000Z',
    summary: 'You completed the block steadily.',
    sessionsCompleted: 12,
    totalPlannedSessions: 12,
    microChecksCompleted: 3,
    recommendedNextFocusDomain: 'balance',
  };
}

function emptyLocal(): LocalHaleStateForRestore {
  return {
    preferences: defaultPreferences(),
    history: [],
    training: defaultTrainingState(),
    microChecks: [],
    adherence: defaultAdherenceStoreState(),
  };
}

function backendJson(value: unknown): never {
  return JSON.parse(JSON.stringify(value)) as never;
}

function remoteSnapshot(): RemoteHaleSnapshot {
  const training = trainingState();
  const localCheckUp = checkUp();
  const scored = createCurrentVersionedScoreSnapshot(localCheckUp);
  const completion = {
    id: 'session-1',
    userId: 'local-device-user',
    blockId: 'movement-block-1',
    plannedDate: 'session-1',
    completedAt: '2026-06-19T08:30:00.000Z',
    sessionType: 'standard' as const,
    focusDomain: 'strength_power' as const,
    durationMinutes: 18,
    perceivedEffort: 3 as const,
    painReported: false,
  };

  return {
    profile: {
      id: userId,
      local_user_id: 'local-device-user',
      full_name: 'Asha Rao',
      birth_year: null,
      sex: null,
      profile_json: {
        schemaVersion: 4,
        name: 'Asha Rao',
        age: 58,
        goal: 'Keep hiking',
      },
      onboarding_json: {
        schemaVersion: 4,
        onboarding: {
          currentStep: 'complete',
          selectedEquipment: ['chair', 'wall'],
          baselineResultId: startedAt,
          completedAt: '2026-06-18T09:00:00.000Z',
          updatedAt: '2026-06-18T09:00:00.000Z',
        },
        lifeGoal: null,
      },
      safety_json: {
        schemaVersion: 4,
        safetyProfile: null,
      },
      preferences_json: backendJson({
        schemaVersion: 4,
        settings: defaultPreferences().settings,
      }),
      onboarding_completed_at: '2026-06-18T09:00:00.000Z',
      created_at: '2026-06-18T08:00:00.000Z',
      updated_at: '2026-06-18T09:00:00.000Z',
    },
    movementCheckups: [
      {
        id: 'remote-checkup-1',
        local_checkup_id: startedAt,
        checkup_type: 'baseline',
        status: 'completed',
        derived_scores_json: backendJson({
          schemaVersion: 1,
          scoreSnapshot: scored.snapshot,
          assessment: {
            type: 'baseline',
            status: 'completed',
            completedAt: '2026-06-17T12:08:00.000Z',
            isOfficialForProgress: true,
          },
        }),
        raw_checkup_json: backendJson({
          schemaVersion: HISTORY_SCHEMA_VERSION,
          scoreSnapshot: scored.snapshot,
          checkUp: localCheckUp,
        }),
        created_locally_at: startedAt,
        completed_at: '2026-06-17T12:08:00.000Z',
        created_at: '2026-06-17T12:08:30.000Z',
      },
    ],
    movementBlocks: [
      {
        id: 'remote-block-1',
        local_block_id: 'movement-block-1',
        block_json: backendJson({
          schemaVersion: 1,
          movementBlock: movementBlock(),
          legacyTrainingBlock: training.block,
          legacyTrainingProgress: training.progress,
          equipment: training.equipment,
        }),
        created_at: '2026-06-18T08:00:00.000Z',
        updated_at: '2026-06-18T08:00:00.000Z',
      },
    ],
    trainingState: {
      user_id: userId,
      state_json: backendJson({
        snapshotSchemaVersion: 1,
        trainingSchemaVersion: TRAINING_SCHEMA_VERSION,
        capturedAt: '2026-06-19T08:35:00.000Z',
        activeLegacyTrainingBlock: training.block,
        progress: training.progress,
        progression: training.progression,
        equipment: training.equipment,
        planPreferences: training.planPreferences,
        ladderProgressById: training.ladderProgressById,
        appliedProgressionEventIds: [
          'progression:session-1:movement-block-1:strength-A:sit-to-stand',
        ],
        generatedSessionContext: {
          totalPersisted: 0,
          recentSummaries: [],
        },
        lastPostSessionFeedback: null,
      }),
      updated_at: '2026-06-19T08:35:00.000Z',
    },
    trainingSessionCompletions: [
      {
        id: 'remote-session-1',
        local_session_id: 'session-1',
        summary_json: {
          schemaVersion: 1,
          completion,
        },
        raw_result_json: {
          schemaVersion: 1,
          startedAt: '2026-06-19T08:10:00.000Z',
        },
        completed_at: completion.completedAt,
        created_at: completion.completedAt,
      },
    ],
    microChecks: [
      {
        id: 'remote-microcheck-1',
        local_micro_check_id: 'microcheck-2026-06-24T08-00-00-000Z',
        result_json: backendJson({
          schemaVersion: 1,
          result: microCheck(),
        }),
        completed_at: microCheck().startedAt,
        created_at: microCheck().startedAt,
      },
    ],
    movementBlockReports: [
      {
        id: 'remote-report-1',
        local_report_id: 'report-movement-block-1',
        report_json: backendJson({
          schemaVersion: 1,
          localReportId: 'report-movement-block-1',
          report: blockReport(),
        }),
        created_at: blockReport().createdAt,
      },
    ],
    fetchErrors: {},
  };
}

function remoteSnapshotWithCheckups(
  movementCheckups: RemoteHaleSnapshot['movementCheckups']
): RemoteHaleSnapshot {
  return {
    profile: null,
    movementCheckups,
    movementBlocks: [],
    trainingState: null,
    trainingSessionCompletions: [],
    microChecks: [],
    movementBlockReports: [],
    fetchErrors: {},
  };
}

describe('remote restore service', () => {
  it('detects empty local state conservatively', () => {
    expect(isLocalStateEmptyForRestore(emptyLocal())).toBe(true);

    expect(
      isLocalStateEmptyForRestore({
        ...emptyLocal(),
        history: [storedCheckUp()],
      })
    ).toBe(false);

    expect(
      isLocalStateEmptyForRestore({
        ...emptyLocal(),
        preferences: {
          ...defaultPreferences(),
          profile: { ...defaultPreferences().profile, name: 'Asha' },
        },
      })
    ).toBe(false);
  });

  it('maps sanitized remote rows back into local store shapes', () => {
    const mapped = mapRemoteHaleSnapshotToLocal(remoteSnapshot(), emptyLocal());

    expect(mapped.state.preferences.profile.name).toBe('Asha Rao');
    expect(mapped.state.preferences.onboarding.currentStep).toBe('complete');
    expect(mapped.state.history).toHaveLength(1);
    expect(mapped.state.history[0].checkUp.startedAt).toBe(startedAt);
    expect(mapped.state.history[0].checkupType).toBe('baseline');
    expect(mapped.state.adherence.assessments).toHaveLength(1);
    expect(mapped.state.adherence.blocks[0].id).toBe('movement-block-1');
    expect(mapped.state.training.block?.weakestDomain).toBe('strength');
    expect(mapped.state.training.appliedProgressionEventIds).toEqual([
      'progression:session-1:movement-block-1:strength-A:sit-to-stand',
    ]);
    expect(mapped.state.adherence.completions[0].id).toBe('session-1');
    expect(blockProgress(mapped.state.adherence.blocks[0], mapped.state.adherence.completions).completedSessions).toBe(0);
    expect(mapped.state.microChecks[0]).toMatchObject({
      ...microCheck(),
      measurementContext: {
        protocol: { protocolId: 'micro_chair_power_5_reps_v1', protocolVersion: 1 },
        side: { role: 'not_applicable' },
      },
    });
    expect(mapped.state.adherence.reports[0].id).toBe('report-movement-block-1');
    expect(mapped.gaps).toEqual(
      expect.arrayContaining([
        expect.stringContaining('raw_result_json'),
        expect.stringContaining('compact training_state snapshot'),
      ])
    );
  });

  it('restores applied progression event ids without replaying session completion rows', () => {
    const snapshot = remoteSnapshot();
    const beforeLevel = snapshot.trainingState?.state_json &&
      typeof snapshot.trainingState.state_json === 'object' &&
      'ladderProgressById' in snapshot.trainingState.state_json
      ? JSON.stringify(snapshot.trainingState.state_json.ladderProgressById)
      : '';

    const mapped = mapRemoteHaleSnapshotToLocal(snapshot, emptyLocal());

    expect(mapped.state.training.appliedProgressionEventIds).toEqual([
      'progression:session-1:movement-block-1:strength-A:sit-to-stand',
    ]);
    expect(JSON.stringify(mapped.state.training.ladderProgressById)).toBe(beforeLevel);
    expect(mapped.state.adherence.completions).toHaveLength(1);
  });

  it('preserves restored optional ladder progress while current planning uses the beta cap', () => {
    const snapshot = remoteSnapshot();
    snapshot.profile!.safety_json = backendJson({
      schemaVersion: 4,
      safetyProfile: {
        id: 'safety-remote',
        userId: 'local-device-user',
        availableEquipment: ['chair', 'wall'],
        equipmentStatus: 'confirmed',
        equipmentRevision: 4,
        equipmentUpdatedAt: '2026-06-20T08:00:00.000Z',
        createdAt: '2026-06-18T08:00:00.000Z',
        updatedAt: '2026-06-20T08:00:00.000Z',
      },
    });
    snapshot.trainingState!.state_json = backendJson({
      ...(snapshot.trainingState!.state_json as Record<string, unknown>),
      ladderProgressById: {
        'sit-to-stand': {
          ladderId: 'sit-to-stand',
          currentLevelId: LOADED_STS_ID,
          completedSessionsAtLevel: 1,
          failedSessionsAtLevel: 0,
          recentCompletionRates: [0.95],
          recentRpe: [2],
          recentPain: [false],
          updatedAt: '2026-06-18T08:00:00.000Z',
        },
      },
    });

    const mapped = mapRemoteHaleSnapshotToLocal(snapshot, emptyLocal());
    const plan = requireHaleSessionPlan({
      activeBlock: mapped.state.adherence.blocks[0],
      training: mapped.state.training,
      safetyProfile: mapped.state.preferences.profile.safetyProfile,
      targetSessionTemplateId: 'session_a',
      today: '2026-06-21T08:00:00.000Z',
    });
    const sitToStand = plan.metadata?.generatedExercises?.find((exercise) => exercise.ladderId === 'sit-to-stand');

    expect(mapped.state.training.ladderProgressById['sit-to-stand'].currentLevelId).toBe(LOADED_STS_ID);
    expect(sitToStand).toMatchObject({
      requestedLevelId: LOADED_STS_ID,
      selectedDailyLevelId: STS_STANDARD_ID,
      adjustmentReasons: expect.arrayContaining(['controlled_beta_release_cap', 'auto_progression_cap', 'legacy_progression_policy_capped']),
    });
  });

  it('does not let restored training-state equipment override a canonical profile', () => {
    const snapshot = remoteSnapshot();
    snapshot.profile!.safety_json = backendJson({
      schemaVersion: 4,
      safetyProfile: {
        id: 'safety-remote',
        userId: 'local-device-user',
        availableEquipment: ['none'],
        equipmentStatus: 'confirmed',
        equipmentRevision: 4,
        equipmentUpdatedAt: '2026-06-19T08:00:00.000Z',
        createdAt: '2026-06-18T08:00:00.000Z',
        updatedAt: '2026-06-19T08:00:00.000Z',
      },
    });
    snapshot.trainingState!.state_json = backendJson({
      ...(snapshot.trainingState!.state_json as Record<string, unknown>),
      equipment: { stair: true, band: true, miniBand: true, load: true },
    });

    const mapped = mapRemoteHaleSnapshotToLocal(snapshot, emptyLocal());
    const activeBlock = mapped.state.adherence.blocks[0];
    const plan = requireHaleSessionPlan({
      activeBlock,
      training: mapped.state.training,
      safetyProfile: mapped.state.preferences.profile.safetyProfile,
      today: '2026-06-21T08:00:00.000Z',
    });

    expect(mapped.state.training.equipment).toMatchObject({ stair: true, band: true, miniBand: true, load: true });
    expect(mapped.state.preferences.profile.safetyProfile?.availableEquipment).toEqual(['none']);
    expect(plan.metadata?.equipmentSnapshot?.capabilities).toEqual([]);
    expect(plan.exercises.flatMap((exercise) => exercise.requiresEquipment ?? [])).not.toEqual(
      expect.arrayContaining(['stair', 'long_band', 'mini_band', 'backpack_or_weight'])
    );
  });

  it('blocks current planning when restore has only legacy training equipment and no canonical profile', () => {
    const snapshot = remoteSnapshot();
    snapshot.profile = null;
    snapshot.trainingState!.state_json = backendJson({
      ...(snapshot.trainingState!.state_json as Record<string, unknown>),
      equipment: { stair: true, band: true, miniBand: true, load: true },
    });

    const mapped = mapRemoteHaleSnapshotToLocal(snapshot, emptyLocal());
    const result = planTodayHaleSession({
      activeBlock: mapped.state.adherence.blocks[0],
      training: mapped.state.training,
      safetyProfile: mapped.state.preferences.profile.safetyProfile,
      today: '2026-06-21T08:00:00.000Z',
    });

    expect(mapped.state.preferences.profile.safetyProfile).toBeNull();
    expect(result.kind).toBe('unavailable');
    if (result.kind !== 'unavailable') throw new Error('expected unavailable result');
    expect(result.reason).toBe('equipment_confirmation_required');
  });

  it('restores supporting-only and missing-focus attempts without promoting them to main-plan credit', () => {
    const snapshot = remoteSnapshot();
    const b = movementBlock();
    const missingFocusCompletion = {
      id: 'session-missing-focus',
      userId: 'local-device-user',
      blockId: b.id,
      plannedDate: 'strength-A:2026-06-19',
      completedAt: '2026-06-19T08:30:00.000Z',
      sessionType: 'standard' as const,
      focusDomain: 'strength_power' as const,
      source: 'block_generated' as const,
      templateId: 'strength-A',
      mainPlanCredit: true,
      durationMinutes: 12,
    };
    const supportingOnlyCompletion = {
      ...missingFocusCompletion,
      id: 'session-supporting-only',
      plannedDate: 'strength-B:2026-06-20',
      completedAt: '2026-06-20T08:30:00.000Z',
      templateId: 'strength-B',
      mainPlanCredit: false,
      focusStimulusEvidence: {
        planStatus: 'eligible' as const,
        status: 'primary_focus_not_completed' as const,
        exclusionReason: 'supporting_only' as const,
        mainPlanCredit: false,
        blockFocusDomain: 'strength_power' as const,
        plannedPrimaryFocusExerciseCount: 1,
        completedPrimaryFocusExerciseCount: 0,
        completedSupportingExerciseCount: 1,
        completedFallbackExerciseCount: 0,
        completedCrossDomainExerciseCount: 0,
        plannedPrimaryFocusExerciseIds: ['sts-standard'],
        completedPrimaryFocusExerciseIds: [],
        completedSupportingExerciseIds: ['balance-tandem-hold'],
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
    snapshot.trainingSessionCompletions = [
      {
        id: 'remote-session-missing-focus',
        local_session_id: missingFocusCompletion.id,
        summary_json: {
          schemaVersion: 1,
          completion: missingFocusCompletion,
        },
        completed_at: missingFocusCompletion.completedAt,
        created_at: missingFocusCompletion.completedAt,
      },
      {
        id: 'remote-session-supporting-only',
        local_session_id: supportingOnlyCompletion.id,
        summary_json: {
          schemaVersion: 1,
          completion: supportingOnlyCompletion,
        },
        completed_at: supportingOnlyCompletion.completedAt,
        created_at: supportingOnlyCompletion.completedAt,
      },
    ];

    const mapped = mapRemoteHaleSnapshotToLocal(snapshot, emptyLocal());
    const restored = mapped.state.adherence.completions;

    expect(restored).toHaveLength(2);
    expect(restored[0].mainPlanCredit).toBe(true);
    expect(restored[0].focusStimulusEvidence).toBeUndefined();
    expect(restored[1].mainPlanCredit).toBe(false);
    expect(restored[1].focusStimulusEvidence?.exclusionReason).toBe('supporting_only');
    expect(blockProgress(b, restored).completedSessions).toBe(0);
    expect(restored.map((completion) => classifyMainPlanCompletion(b, completion).credited)).toEqual([false, false]);
  });

  it('restores exact local check-up type from JSON metadata before the coarse remote enum', () => {
    const snapshot = remoteSnapshot();
    const localCheckUp = checkUp();
    const scored = createCurrentVersionedScoreSnapshot(localCheckUp);
    snapshot.movementCheckups[0] = {
      ...snapshot.movementCheckups[0],
      checkup_type: 'unknown',
      derived_scores_json: backendJson({
        schemaVersion: 1,
        exactCheckupType: 'baseline_retake',
        scoreSnapshot: scored.snapshot,
        assessment: {
          type: 'baseline_retake',
          status: 'completed',
          completedAt: '2026-06-17T12:08:00.000Z',
          isOfficialForProgress: true,
        },
      }),
      raw_checkup_json: backendJson({
        schemaVersion: HISTORY_SCHEMA_VERSION,
        checkupType: 'baseline_retake',
        scoreSnapshot: scored.snapshot,
        checkUp: localCheckUp,
      }),
    };

    const mapped = mapRemoteHaleSnapshotToLocal(snapshot, emptyLocal());

    expect(mapped.state.history[0].checkupType).toBe('baseline_retake');
    expect(mapped.state.adherence.assessments[0].type).toBe('baseline_retake');
  });

  it('restores assessment scores from the frozen snapshot rather than rescoring divergent raw check-up data', () => {
    const snapshot = remoteSnapshot();
    const rawCheckUp = checkUp();
    const frozenCheckUp = checkUp();
    const chair = frozenCheckUp.items.find((item) => item.movementId === CHAIR_STAND_ID)!;
    (chair.result as unknown as Record<string, unknown>).reps = 8;
    const frozenSnapshot = createCurrentVersionedScoreSnapshot(frozenCheckUp).snapshot!;
    const frozenStrengthMidpoint = domainMidpoint(frozenSnapshot.score, 'strength');
    const rawStrengthMidpoint = domainMidpoint(createCurrentVersionedScoreSnapshot(rawCheckUp).score, 'strength');

    snapshot.movementCheckups[0] = {
      ...snapshot.movementCheckups[0],
      derived_scores_json: backendJson({
        schemaVersion: 1,
        scoreSnapshot: frozenSnapshot,
        assessment: {
          type: 'baseline',
          status: 'completed',
          completedAt: '2026-06-17T12:08:00.000Z',
          isOfficialForProgress: true,
        },
      }),
      raw_checkup_json: backendJson({
        schemaVersion: HISTORY_SCHEMA_VERSION,
        scoreSnapshot: frozenSnapshot,
        checkUp: rawCheckUp,
      }),
    };

    const mapped = mapRemoteHaleSnapshotToLocal(snapshot, emptyLocal());

    expect(frozenStrengthMidpoint).not.toBe(rawStrengthMidpoint);
    expect(mapped.state.history[0].scoreSnapshot?.score).toEqual(frozenSnapshot.score);
    expect(mapped.state.adherence.assessments[0].results?.strengthPowerScore).toBe(frozenStrengthMidpoint);
  });

  it('restores exact-tie focus metadata from the frozen snapshot onto the local assessment', () => {
    const snapshot = remoteSnapshot();
    const localCheckUp = checkUp();
    const tieSnapshot = exactTieSnapshotFor(localCheckUp);
    snapshot.movementCheckups[0] = {
      ...snapshot.movementCheckups[0],
      checkup_type: 'official_retest',
      derived_scores_json: backendJson({
        schemaVersion: 1,
        scoreSnapshot: tieSnapshot,
        assessment: {
          type: 'official_retest',
          status: 'completed',
          completedAt: '2026-06-17T12:08:00.000Z',
          isOfficialForProgress: true,
        },
      }),
      raw_checkup_json: backendJson({
        schemaVersion: HISTORY_SCHEMA_VERSION,
        checkupType: 'official_retest',
        scoreSnapshot: tieSnapshot,
        checkUp: localCheckUp,
      }),
    };

    const mapped = mapRemoteHaleSnapshotToLocal(snapshot, emptyLocal());
    const assessment = mapped.state.adherence.assessments[0];

    expect(mapped.state.history[0].scoreSnapshot?.focusSelection).toEqual(tieSnapshot.focusSelection);
    expect(assessment.type).toBe('official_retest');
    expect(assessment.results?.weakestDomain).toBe('balance');
    expect(assessment.results?.rawMetrics?.focusSelection).toEqual(tieSnapshot.focusSelection);
    expect(assessment.results?.rawMetrics?.focusTieBreakReason).toBe('preserve_current_focus');
  });

  it('restores source-mismatched remote snapshots as invalid instead of usable assessments', () => {
    const snapshot = remoteSnapshot();
    const rawCheckUp = checkUp();
    const otherCheckUp = { ...checkUp(), startedAt: '2026-06-18T12:00:00.000Z' };
    const otherSnapshot = createCurrentVersionedScoreSnapshot(otherCheckUp).snapshot!;

    snapshot.movementCheckups[0] = {
      ...snapshot.movementCheckups[0],
      derived_scores_json: backendJson({
        schemaVersion: 1,
        scoreSnapshot: otherSnapshot,
        assessment: {
          type: 'baseline',
          status: 'completed',
          completedAt: '2026-06-17T12:08:00.000Z',
          isOfficialForProgress: true,
        },
      }),
      raw_checkup_json: backendJson({
        schemaVersion: HISTORY_SCHEMA_VERSION,
        scoreSnapshot: otherSnapshot,
        checkUp: rawCheckUp,
      }),
    };

    const mapped = mapRemoteHaleSnapshotToLocal(snapshot, emptyLocal());

    expect(mapped.state.history[0].scoreSnapshot).toBeUndefined();
    expect(mapped.state.history[0].scoreSnapshotCompatibility).toBe('invalid_snapshot');
    expect(mapped.state.adherence.assessments[0].status).toBe('invalid');
    expect(mapped.state.adherence.assessments[0].results?.weakestDomain).toBeUndefined();
  });

  it('restores Movement Profile V2 snapshots as history evidence without creating legacy assessments', () => {
    const rawCheckUp = v2CheckUp(startedAt);
    const movementProfileV2Snapshot = movementProfileV2SnapshotFor(rawCheckUp);
    const mapped = mapRemoteHaleSnapshotToLocal(
      remoteSnapshotWithCheckups([
        {
          id: 'remote-v2-checkup',
          local_checkup_id: startedAt,
          checkup_type: 'baseline',
          status: 'completed',
          derived_scores_json: backendJson({
            schemaVersion: 1,
            exactCheckupType: 'baseline',
            movementProfileV2Snapshot,
            movementProfileV2SnapshotCompatibility: 'current',
          }),
          raw_checkup_json: backendJson({
            schemaVersion: HISTORY_SCHEMA_VERSION,
            checkupType: 'baseline',
            movementProfileV2Snapshot,
            checkUp: rawCheckUp,
          }),
          created_locally_at: startedAt,
          completed_at: '2026-06-17T12:08:00.000Z',
          created_at: '2026-06-17T12:08:30.000Z',
        },
      ]),
      emptyLocal()
    );

    expect(mapped.state.history).toHaveLength(1);
    expect(mapped.state.history[0].scoreSnapshot).toBeUndefined();
    expect(mapped.state.history[0].scoreSnapshotCompatibility).toBe('unsupported_checkup_protocol');
    expect(mapped.state.history[0].movementProfileV2Snapshot?.snapshotFingerprint).toBe(
      movementProfileV2Snapshot.snapshotFingerprint
    );
    expect(mapped.state.history[0].movementProfileV2SnapshotCompatibility).toBe('current');
    expect(mapped.state.adherence.assessments).toEqual([]);
  });

  it('restores source-bound Movement Profile V2 assessments without creating legacy assessments', () => {
    const rawCheckUp = v2CheckUp(startedAt);
    const movementProfileV2Snapshot = movementProfileV2SnapshotFor(rawCheckUp);
    const movementProfileV2Assessment = movementProfileV2AssessmentFor(rawCheckUp, movementProfileV2Snapshot);
    const mapped = mapRemoteHaleSnapshotToLocal(
      remoteSnapshotWithCheckups([
        {
          id: 'remote-v2-checkup',
          local_checkup_id: startedAt,
          checkup_type: 'baseline',
          status: 'completed',
          derived_scores_json: backendJson({
            schemaVersion: 1,
            exactCheckupType: 'baseline',
            movementProfileV2Snapshot,
            movementProfileV2SnapshotCompatibility: 'current',
            movementProfileV2Assessment,
            movementProfileV2AssessmentCompatibility: 'current',
          }),
          raw_checkup_json: backendJson({
            schemaVersion: HISTORY_SCHEMA_VERSION,
            checkupType: 'baseline',
            movementProfileV2Snapshot,
            movementProfileV2Assessment,
            checkUp: rawCheckUp,
          }),
          created_locally_at: startedAt,
          completed_at: '2026-06-17T12:08:00.000Z',
        },
      ]),
      emptyLocal()
    );

    expect(mapped.state.history).toHaveLength(1);
    expect(mapped.state.history[0].movementProfileV2Snapshot?.snapshotFingerprint).toBe(
      movementProfileV2Snapshot.snapshotFingerprint
    );
    expect(mapped.state.history[0].movementProfileV2Assessment?.assessmentFingerprint).toBe(
      movementProfileV2Assessment.assessmentFingerprint
    );
    expect(mapped.state.history[0].movementProfileV2AssessmentCompatibility).toBe('current');
    expect(mapped.state.adherence.assessments).toEqual([]);
  });

  it('keeps raw V2 check-ups when restored V2 snapshots are malformed or missing', () => {
    const rawCheckUp = v2CheckUp(startedAt);
    const malformedSnapshot = {
      ...movementProfileV2SnapshotFor(rawCheckUp),
      snapshotFingerprint: 'tampered',
    };
    const mapped = mapRemoteHaleSnapshotToLocal(
      remoteSnapshotWithCheckups([
        {
          id: 'remote-v2-checkup',
          local_checkup_id: startedAt,
          checkup_type: 'baseline',
          status: 'completed',
          derived_scores_json: backendJson({
            schemaVersion: 1,
            exactCheckupType: 'baseline',
            movementProfileV2Snapshot: malformedSnapshot,
          }),
          raw_checkup_json: backendJson({
            schemaVersion: HISTORY_SCHEMA_VERSION,
            checkupType: 'baseline',
            movementProfileV2Snapshot: malformedSnapshot,
            checkUp: rawCheckUp,
          }),
          created_locally_at: startedAt,
          completed_at: '2026-06-17T12:08:00.000Z',
        },
      ]),
      emptyLocal()
    );

    expect(mapped.state.history).toHaveLength(1);
    expect(mapped.state.history[0].checkUp.items).toHaveLength(3);
    expect(mapped.state.history[0].movementProfileV2Snapshot).toBeUndefined();
    expect(mapped.state.history[0].movementProfileV2SnapshotCompatibility).toBe('fingerprint_invalid');
    expect(mapped.state.adherence.assessments).toEqual([]);
  });

  it('keeps raw V2 check-ups and valid snapshots when restored V2 assessments are mismatched', () => {
    const rawCheckUp = v2CheckUp(startedAt);
    const movementProfileV2Snapshot = movementProfileV2SnapshotFor(rawCheckUp);
    const otherCheckUp = v2CheckUp(startedAt, { chair: chairV2Result({ reps: 13 }) });
    const otherSnapshot = movementProfileV2SnapshotFor(otherCheckUp);
    const otherAssessment = movementProfileV2AssessmentFor(otherCheckUp, otherSnapshot);
    const mapped = mapRemoteHaleSnapshotToLocal(
      remoteSnapshotWithCheckups([
        {
          id: 'remote-v2-checkup',
          local_checkup_id: startedAt,
          checkup_type: 'baseline',
          status: 'completed',
          derived_scores_json: backendJson({
            schemaVersion: 1,
            exactCheckupType: 'baseline',
            movementProfileV2Snapshot,
            movementProfileV2Assessment: otherAssessment,
          }),
          raw_checkup_json: backendJson({
            schemaVersion: HISTORY_SCHEMA_VERSION,
            checkupType: 'baseline',
            movementProfileV2Snapshot,
            movementProfileV2Assessment: otherAssessment,
            checkUp: rawCheckUp,
          }),
          created_locally_at: startedAt,
          completed_at: '2026-06-17T12:08:00.000Z',
        },
      ]),
      emptyLocal()
    );

    expect(mapped.state.history).toHaveLength(1);
    expect(mapped.state.history[0].movementProfileV2Snapshot?.snapshotFingerprint).toBe(
      movementProfileV2Snapshot.snapshotFingerprint
    );
    expect(mapped.state.history[0].movementProfileV2Assessment).toBeUndefined();
    expect(mapped.state.history[0].movementProfileV2AssessmentCompatibility).toBe('source_mismatch');
    expect(mapped.state.adherence.assessments).toEqual([]);
  });

  it('prefers a valid restored V2 snapshot over a duplicate raw-only remote row', () => {
    const rawCheckUp = v2CheckUp(startedAt);
    const movementProfileV2Snapshot = movementProfileV2SnapshotFor(rawCheckUp);
    const mapped = mapRemoteHaleSnapshotToLocal(
      remoteSnapshotWithCheckups([
        {
          id: 'remote-v2-missing',
          local_checkup_id: startedAt,
          checkup_type: 'baseline',
          status: 'completed',
          derived_scores_json: backendJson({ schemaVersion: 1, exactCheckupType: 'baseline' }),
          raw_checkup_json: backendJson({
            schemaVersion: HISTORY_SCHEMA_VERSION,
            checkupType: 'baseline',
            checkUp: rawCheckUp,
          }),
        },
        {
          id: 'remote-v2-valid',
          local_checkup_id: startedAt,
          checkup_type: 'baseline',
          status: 'completed',
          derived_scores_json: backendJson({
            schemaVersion: 1,
            exactCheckupType: 'baseline',
            movementProfileV2Snapshot,
          }),
          raw_checkup_json: backendJson({
            schemaVersion: HISTORY_SCHEMA_VERSION,
            checkupType: 'baseline',
            movementProfileV2Snapshot,
            checkUp: rawCheckUp,
          }),
        },
      ]),
      emptyLocal()
    );

    expect(mapped.state.history).toHaveLength(1);
    expect(mapped.state.history[0].movementProfileV2Snapshot?.snapshotFingerprint).toBe(
      movementProfileV2Snapshot.snapshotFingerprint
    );
    expect(mapped.state.adherence.assessments).toEqual([]);
  });

  it('prefers a valid restored V2 assessment over a duplicate snapshot-only remote row', () => {
    const rawCheckUp = v2CheckUp(startedAt);
    const movementProfileV2Snapshot = movementProfileV2SnapshotFor(rawCheckUp);
    const movementProfileV2Assessment = movementProfileV2AssessmentFor(rawCheckUp, movementProfileV2Snapshot);
    const mapped = mapRemoteHaleSnapshotToLocal(
      remoteSnapshotWithCheckups([
        {
          id: 'remote-v2-snapshot-only',
          local_checkup_id: startedAt,
          checkup_type: 'baseline',
          status: 'completed',
          derived_scores_json: backendJson({
            schemaVersion: 1,
            exactCheckupType: 'baseline',
            movementProfileV2Snapshot,
          }),
          raw_checkup_json: backendJson({
            schemaVersion: HISTORY_SCHEMA_VERSION,
            checkupType: 'baseline',
            movementProfileV2Snapshot,
            checkUp: rawCheckUp,
          }),
        },
        {
          id: 'remote-v2-assessment',
          local_checkup_id: startedAt,
          checkup_type: 'baseline',
          status: 'completed',
          derived_scores_json: backendJson({
            schemaVersion: 1,
            exactCheckupType: 'baseline',
            movementProfileV2Snapshot,
            movementProfileV2Assessment,
          }),
          raw_checkup_json: backendJson({
            schemaVersion: HISTORY_SCHEMA_VERSION,
            checkupType: 'baseline',
            movementProfileV2Snapshot,
            movementProfileV2Assessment,
            checkUp: rawCheckUp,
          }),
        },
      ]),
      emptyLocal()
    );

    expect(mapped.state.history).toHaveLength(1);
    expect(mapped.state.history[0].movementProfileV2Assessment?.assessmentFingerprint).toBe(
      movementProfileV2Assessment.assessmentFingerprint
    );
    expect(mapped.state.adherence.assessments).toEqual([]);
  });

  it('keeps lossy unknown remote check-up types as legacy_unknown', () => {
    const snapshot = remoteSnapshot();
    snapshot.movementCheckups[0] = {
      ...snapshot.movementCheckups[0],
      checkup_type: 'unknown',
      derived_scores_json: { schemaVersion: 1 },
      raw_checkup_json: backendJson({
        schemaVersion: HISTORY_SCHEMA_VERSION,
        checkUp: checkUp(),
      }),
    };

    const mapped = mapRemoteHaleSnapshotToLocal(snapshot, emptyLocal());

    expect(mapped.state.history[0].checkupType).toBe('legacy_unknown');
    expect(mapped.state.adherence.assessments[0].type).toBe('legacy_unknown');
    expect(mapped.state.adherence.assessments[0].isOfficialForProgress).toBe(false);
  });

  it('skips restore and does not write stores when local data already exists', async () => {
    const stores = {
      profileStore: { save: jest.fn() },
      historyStore: { save: jest.fn() },
      trainingStore: { saveState: jest.fn(), saveMicroCheck: jest.fn() },
      adherenceStore: { save: jest.fn() },
    };

    const result = await restoreRemoteStateIfLocalEmpty({
      local: {
        ...emptyLocal(),
        history: [storedCheckUp()],
      },
      stores,
      snapshot: remoteSnapshot(),
    });

    expect(result.status).toBe('skipped_local_not_empty');
    expect(stores.profileStore.save).not.toHaveBeenCalled();
    expect(stores.historyStore.save).not.toHaveBeenCalled();
    expect(stores.trainingStore.saveState).not.toHaveBeenCalled();
    expect(stores.trainingStore.saveMicroCheck).not.toHaveBeenCalled();
    expect(stores.adherenceStore.save).not.toHaveBeenCalled();
  });

  it('handles incomplete remote JSON safely', async () => {
    const result = await restoreRemoteStateIfLocalEmpty({
      local: emptyLocal(),
      snapshot: {
        profile: null,
        movementCheckups: [{ raw_checkup_json: { schemaVersion: HISTORY_SCHEMA_VERSION } }],
        movementBlocks: [{ block_json: { schemaVersion: 1 } }],
        trainingState: { state_json: { snapshotSchemaVersion: 1 } },
        trainingSessionCompletions: [{ summary_json: { schemaVersion: 1 } }],
        microChecks: [{ result_json: { schemaVersion: 1 } }],
        movementBlockReports: [{ report_json: { schemaVersion: 1 } }],
        fetchErrors: {},
      },
    });

    expect(result.status).toBe('remote_empty');
    expect(result.restoredCounts).toEqual({
      profile: 0,
      checkups: 0,
      movementBlocks: 0,
      assessments: 0,
      trainingState: 0,
      sessionCompletions: 0,
      microChecks: 0,
      blockReports: 0,
    });
  });

  it('does not restore malformed raw check-up data as a completed usable assessment', () => {
    const malformed = checkUp();
    malformed.items = [malformed.items[0]];
    (malformed.items[0].result as unknown as Record<string, unknown>).reps = '14';

    const snapshot: RemoteHaleSnapshot = {
      profile: null,
      movementCheckups: [
        {
          id: 'remote-malformed-checkup',
          local_checkup_id: startedAt,
          checkup_type: 'baseline',
          status: 'completed',
          derived_scores_json: {
            schemaVersion: 1,
            assessment: {
              type: 'baseline',
              status: 'completed',
              completedAt: '2026-06-17T12:08:00.000Z',
              isOfficialForProgress: true,
            },
          },
          raw_checkup_json: backendJson({
            schemaVersion: HISTORY_SCHEMA_VERSION,
            checkUp: malformed,
          }),
          created_locally_at: startedAt,
          completed_at: '2026-06-17T12:08:00.000Z',
          created_at: '2026-06-17T12:08:30.000Z',
        },
      ],
      movementBlocks: [],
      trainingState: null,
      trainingSessionCompletions: [],
      microChecks: [],
      movementBlockReports: [],
      fetchErrors: {},
    };

    const mapped = mapRemoteHaleSnapshotToLocal(snapshot, emptyLocal());

    expect(mapped.state.history).toHaveLength(1);
    expect(mapped.state.adherence.assessments).toHaveLength(1);
    expect(mapped.state.adherence.assessments[0].status).toBe('invalid');
    expect(mapped.state.adherence.assessments[0].results?.weakestDomain).toBeUndefined();
    expect(mapped.state.adherence.assessments[0].results?.confidence).toBe('low');
  });
});

function domainMidpoint(
  score: { domains: readonly { domain: string; ageLow: number | null; ageHigh: number | null }[] },
  domain: string
): number {
  const result = score.domains.find((item) => item.domain === domain)!;
  if (result.ageLow === null || result.ageHigh === null) throw new Error(`Domain ${domain} was not measured`);
  return (result.ageLow + result.ageHigh) / 2;
}

function exactTieSnapshotFor(checkUp: CheckUp): VersionedCheckUpScoreSnapshot {
  const snapshot = createCurrentVersionedScoreSnapshot(checkUp).snapshot!;
  return {
    ...snapshot,
    score: {
      ...snapshot.score,
      weakestDomain: 'balance',
      domains: snapshot.score.domains.map((domain) => {
        if (domain.domain === 'strength' || domain.domain === 'balance') {
          return { ...domain, measured: true, ageLow: 72, ageHigh: 76 };
        }
        return { ...domain, measured: true, ageLow: 58, ageHigh: 62 };
      }),
    },
    focusSelection: {
      kind: 'exact_tie',
      focusDomain: 'balance',
      tiedDomains: ['strength', 'balance'],
      tieBreakReason: 'preserve_current_focus',
    },
  };
}

function v2CheckUp(startedAt: string, overrides: {
  chair?: ChairRiseV2Result;
  balance?: OneLegBalanceV2Result;
  shoulder?: ActiveShoulderReachV2Result;
} = {}): CheckUp {
  return {
    startedAt,
    protocolPolicy: createCheckUpProtocolPolicy(MOVEMENT_PROFILE_V2_PROTOCOL_POLICY_ID, startedAt),
    bodyUnit: 1,
    items: [
      { movementId: CHAIR_RISE_V2_ID, status: 'measured', result: overrides.chair ?? chairV2Result() },
      { movementId: ONE_LEG_BALANCE_V2_ID, status: 'measured', result: overrides.balance ?? balanceV2Result() },
      { movementId: ACTIVE_SHOULDER_REACH_V2_ID, status: 'measured', result: overrides.shoulder ?? shoulderV2Result() },
    ],
  };
}

function movementProfileV2SnapshotFor(checkUp: CheckUp) {
  const created = createMovementProfileV2Snapshot({
    checkUp,
    checkupType: 'baseline',
    referenceProfile: { ageAtTest: 62, ageBasis: 'exact_age_at_test', referenceSex: 'female' },
    createdAt: checkUp.startedAt,
  });
  if (!created.ok) throw new Error(`expected V2 snapshot: ${created.reason}`);
  return created.snapshot;
}

function movementProfileV2AssessmentFor(checkUp: CheckUp, snapshot: ReturnType<typeof movementProfileV2SnapshotFor>) {
  const created = createMovementProfileV2Assessment({
    checkUp,
    snapshot,
    createdAt: checkUp.startedAt,
  });
  if (!created.ok) throw new Error(`expected V2 assessment: ${created.reason}`);
  return created.assessment;
}

function chairV2Result(overrides: Partial<ChairRiseV2Result> = {}): ChairRiseV2Result {
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

function balanceV2Result(overrides: Partial<OneLegBalanceV2Result> = {}): OneLegBalanceV2Result {
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

function shoulderV2Result(overrides: Partial<ActiveShoulderReachV2Result> = {}): ActiveShoulderReachV2Result {
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
