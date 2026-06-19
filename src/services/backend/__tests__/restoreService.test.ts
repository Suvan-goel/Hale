import { BALANCE_LADDER_ID, CHAIR_STAND_ID, SHOULDER_FLEXION_ID } from '../../../movements';
import { defaultAdherenceStoreState, type MovementBlock, type MovementBlockReport } from '../../../adherence';
import type { CheckUp } from '../../../checkup';
import { HISTORY_SCHEMA_VERSION, type StoredCheckUp } from '../../../history';
import { defaultPreferences } from '../../../profile';
import {
  TRAINING_SCHEMA_VERSION,
  defaultTrainingState,
  type MicroCheckResult,
  type TrainingState,
} from '../../../training';

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
  return {
    schemaVersion: HISTORY_SCHEMA_VERSION,
    checkUp: checkUp(),
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
    sourceAssessmentId: startedAt,
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
          checkUp: checkUp(),
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
    expect(mapped.state.adherence.assessments).toHaveLength(1);
    expect(mapped.state.adherence.blocks[0].id).toBe('movement-block-1');
    expect(mapped.state.training.block?.weakestDomain).toBe('strength');
    expect(mapped.state.adherence.completions[0].id).toBe('session-1');
    expect(mapped.state.microChecks[0]).toEqual(microCheck());
    expect(mapped.state.adherence.reports[0].id).toBe('report-movement-block-1');
    expect(mapped.gaps).toEqual(
      expect.arrayContaining([
        expect.stringContaining('raw_result_json'),
        expect.stringContaining('compact training_state snapshot'),
      ])
    );
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
