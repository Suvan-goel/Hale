import type { TrainingState } from '../../../training';
import { defaultTrainingState } from '../../../training';
import { supabase } from '../../../lib/supabase';

import { getCurrentSession } from '../authService';
import { mapLocalTrainingStateToRemotePayload, syncTrainingStateToRemote } from '../trainingStateSyncService';

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('../authService', () => ({
  getCurrentSession: jest.fn(),
}));

const updatedAt = '2026-06-18T10:30:00.000Z';

function trainingState(overrides: Partial<TrainingState> = {}): TrainingState {
  return {
    ...defaultTrainingState(),
    block: {
      createdAt: '2026-06-17T09:00:00.000Z',
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
    progression: {
      levels: { 'sit-to-stand': 2 },
      velHistory: {
        'sit-to-stand-level-1': Array.from({ length: 25 }, (_, index) => index + 0.25).concat(NaN),
      },
    },
    equipment: {
      stair: true,
      band: false,
      miniBand: true,
      load: false,
    },
    progress: {
      completedSessions: 3,
      lastSessionAt: '2026-06-18T09:30:00.000Z',
      retestDueAt: null,
    },
    ladderProgressById: {
      'sit-to-stand': {
        ladderId: 'sit-to-stand',
        currentLevelId: 'sit-to-stand-level-2',
        currentLevelIndex: 2,
        completedSessionsAtLevel: 1,
        failedSessionsAtLevel: 0,
        recentCompletionRates: [1],
        recentRpe: [2],
        recentPain: [false],
        lastRpe: 2,
        lastPain: false,
        lastTrackingQuality: 'good',
        lastCompletedAt: '2026-06-18T09:30:00.000Z',
        readyToProgress: false,
        updatedAt: '2026-06-18T09:30:00.000Z',
      },
    },
    appliedProgressionEventIds: [
      'progression:completion-1:movement-block-1:strength-A:sit-to-stand',
    ],
    generatedSessionSummaries: Array.from({ length: 25 }, (_, index) => ({
      id: `generated-session-${index + 1}`,
      blockId: 'movement-block-1',
      source: 'block_generated' as const,
      templateId: `template-${index + 1}`,
      title: `Session ${index + 1}`,
      completedAt: `2026-06-${String(index + 1).padStart(2, '0')}T09:30:00.000Z`,
      exerciseIds: ['sit-to-stand-level-2'],
      durationMinutes: 20,
      imageUri: 'file:///private/should-not-upload.png',
    })) as never,
    lastPostSessionFeedback: {
      sessionId: 'generated-session-25',
      rpe: 2,
      discomfort: false,
      completed: true,
      trackingQuality: 'good',
      submittedAt: '2026-06-18T09:35:00.000Z',
    },
    planPreferences: {
      preferredIntensity: 'standard',
    },
    ...overrides,
  };
}

function stateJson(payload: ReturnType<typeof mapLocalTrainingStateToRemotePayload>) {
  return payload.state_json as Record<string, unknown>;
}

describe('training state snapshot sync mapping', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps local training state into a compact recovery snapshot', () => {
    const payload = mapLocalTrainingStateToRemotePayload(
      { training: trainingState(), updatedAt },
      'user-123'
    );
    const json = stateJson(payload);
    const progression = json.progression as { velHistory: Record<string, number[]> };
    const generatedSessionContext = json.generatedSessionContext as {
      totalPersisted: number;
      recentSummaries: Array<{ id: string }>;
    };

    expect(payload.user_id).toBe('user-123');
    expect(payload.updated_at).toBe(updatedAt);
    expect(json.trainingSchemaVersion).toBe(4);
    expect(json.activeLegacyTrainingBlock).toEqual(
      expect.objectContaining({
        weakestDomain: 'strength',
      })
    );
    expect(json.progress).toEqual(
      expect.objectContaining({
        completedSessions: 3,
      })
    );
    expect(json.equipment).toEqual(
      expect.objectContaining({
        stair: true,
        miniBand: true,
      })
    );
    expect(json.planPreferences).toEqual({ preferredIntensity: 'standard' });
    expect(json.appliedProgressionEventIds).toEqual([
      'progression:completion-1:movement-block-1:strength-A:sit-to-stand',
    ]);
    expect(progression.velHistory['sit-to-stand-level-1']).toHaveLength(20);
    expect(progression.velHistory['sit-to-stand-level-1']).not.toContain(NaN);
    expect(generatedSessionContext.totalPersisted).toBe(25);
    expect(generatedSessionContext.recentSummaries).toHaveLength(20);
    expect(generatedSessionContext.recentSummaries[0].id).toBe('generated-session-6');
  });

  it('sanitizes camera payload keys and avoids duplicated event histories', () => {
    const unsafeState = {
      ...trainingState(),
      frames: [{ shouldNotUpload: true }],
      landmarks: [{ shouldNotUpload: true }],
      microChecks: [{ shouldNotUpload: true }],
      movementCheckups: [{ shouldNotUpload: true }],
      workoutCompletions: [{ shouldNotUpload: true }],
      movementBlockReports: [{ shouldNotUpload: true }],
      localFilePath: '/private/local/file.json',
      videoBase64: 'abc123',
    } as TrainingState;

    const payload = mapLocalTrainingStateToRemotePayload(
      { training: unsafeState, updatedAt: '2026-06-18T10:45:00.000Z' },
      'user-123'
    );
    const rawJson = JSON.stringify(payload.state_json);

    expect(rawJson).not.toContain('frames');
    expect(rawJson).not.toContain('landmarks');
    expect(rawJson).not.toContain('microChecks');
    expect(rawJson).not.toContain('movementCheckups');
    expect(rawJson).not.toContain('workoutCompletions');
    expect(rawJson).not.toContain('movementBlockReports');
    expect(rawJson).not.toContain('localFilePath');
    expect(rawJson).not.toContain('videoBase64');
    expect(rawJson).not.toContain('shouldNotUpload');
    expect(rawJson).not.toContain('file:///private');
  });

  it('preserves generated non-credit focus evidence and stimulus metadata in recovery snapshots', () => {
    const payload = mapLocalTrainingStateToRemotePayload(
      {
        training: trainingState({
          generatedSessionSummaries: [
            {
              id: 'generated-supporting-only',
              blockId: 'movement-block-1',
              source: 'block_generated' as const,
              templateId: 'strength-B',
              plannedDateKey: 'strength-B:2026-06-18',
              sessionType: 'standard' as const,
              completionSource: 'block_generated' as const,
              status: 'partial' as const,
              mainPlanCredit: false,
              workEvidence: {
                plannedExerciseCount: 2,
                resultItemCount: 1,
                completedExerciseCount: 1,
                skippedExerciseCount: 0,
                missingResultCount: 1,
                duplicateResultCount: 0,
                malformedResultCount: 0,
                unmatchedResultCount: 0,
              },
              focusStimulusEvidence: {
                planStatus: 'eligible' as const,
                status: 'primary_focus_not_completed' as const,
                exclusionReason: 'fallback_only' as const,
                mainPlanCredit: false,
                blockFocusDomain: 'strength_power' as const,
                plannedPrimaryFocusExerciseCount: 1,
                completedPrimaryFocusExerciseCount: 0,
                completedSupportingExerciseCount: 0,
                completedFallbackExerciseCount: 1,
                completedCrossDomainExerciseCount: 0,
                plannedPrimaryFocusExerciseIds: ['sts-standard'],
                completedPrimaryFocusExerciseIds: [],
                completedSupportingExerciseIds: [],
                completedFallbackExerciseIds: ['sts-slow-eccentric'],
                completedCrossDomainExerciseIds: [],
                fallbackFocusSlotIds: ['lower-strength-b'],
                skippedFocusSlotIds: [],
                focusStimulusExclusionReasons: ['equipment_limited'],
                missingMetadataExerciseIds: [],
                malformedMetadataExerciseIds: [],
                focusMismatchExerciseIds: [],
              },
              title: 'Strength Session B',
              completedAt: '2026-06-18T09:30:00.000Z',
              exerciseIds: ['sts-slow-eccentric'],
              exercises: [
                {
                  exerciseId: 'sts-slow-eccentric',
                  ladderId: 'sit-to-stand',
                  levelId: 'sts-slow-eccentric',
                  slotType: 'lower_body_strength' as const,
                  intendedDomain: 'strength_power' as const,
                  stimulusRole: 'fallback' as const,
                  stimulusReason: 'equipment_limited' as const,
                },
              ],
            },
          ] as never,
        }),
        updatedAt,
      },
      'user-123'
    );
    const json = stateJson(payload);
    const generatedSessionContext = json.generatedSessionContext as {
      recentSummaries: Array<{
        mainPlanCredit: boolean;
        status: string;
        focusStimulusEvidence: { mainPlanCredit: boolean; exclusionReason: string };
        exercises: Array<{ stimulusRole: string; intendedDomain: string }>;
      }>;
    };
    const summary = generatedSessionContext.recentSummaries[0];

    expect(summary.mainPlanCredit).toBe(false);
    expect(summary.status).toBe('partial');
    expect(summary.focusStimulusEvidence).toMatchObject({
      mainPlanCredit: false,
      exclusionReason: 'fallback_only',
    });
    expect(summary.exercises[0]).toMatchObject({
      stimulusRole: 'fallback',
      intendedDomain: 'strength_power',
    });
  });

  it('upserts one training_state row per user and skips an unchanged duplicate snapshot', async () => {
    const upsert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({ upsert });
    (getCurrentSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-123' },
    });

    const input = {
      training: trainingState(),
      updatedAt: '2026-06-18T11:00:00.000Z',
    };

    const first = await syncTrainingStateToRemote(input);
    const second = await syncTrainingStateToRemote(input);

    expect(first.status).toBe('synced');
    expect(second.status).toBe('skipped');
    expect(supabase.from).toHaveBeenCalledWith('training_state');
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-123',
        updated_at: '2026-06-18T11:00:00.000Z',
        state_json: expect.objectContaining({
          snapshotSchemaVersion: 1,
        }),
      }),
      { onConflict: 'user_id' }
    );
  });
});
