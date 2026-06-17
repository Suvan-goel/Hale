import type { MovementBlock, TrainingSessionCompletion } from '../../../adherence';
import type { HaleSessionPlan } from '../../../haleFlow';
import type { TrainingSessionResult } from '../../../training';
import { supabase } from '../../../lib/supabase';

import { getCurrentSession } from '../authService';
import {
  mapLocalSessionCompletionToRemotePayload,
  syncTrainingSessionCompletionToRemote,
} from '../sessionSyncService';

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('../authService', () => ({
  getCurrentSession: jest.fn(),
}));

const completedAt = '2026-06-17T12:24:00.000Z';

function completion(overrides: Partial<TrainingSessionCompletion> = {}): TrainingSessionCompletion {
  return {
    id: 'completion-block-1-standard-session-1',
    userId: 'local-device-user',
    blockId: 'movement-block-1',
    plannedDate: 'session-1',
    completedAt,
    sessionType: 'standard',
    focusDomain: 'strength_power',
    durationMinutes: 18,
    ...overrides,
  };
}

function movementBlock(): MovementBlock {
  return {
    id: 'movement-block-1',
    userId: 'local-device-user',
    status: 'active',
    startDate: '2026-06-17T12:00:00.000Z',
    endDate: '2026-07-15T12:00:00.000Z',
    retestDate: '2026-07-15T12:00:00.000Z',
    focusDomain: 'strength_power',
    secondaryDomains: ['balance', 'mobility'],
    sessionsPerWeekTarget: 3,
    totalPlannedSessions: 12,
    completedSessions: 1,
    microChecksCompleted: 0,
    sourceAssessmentId: '2026-06-17T11:40:00.000Z',
    createdAt: '2026-06-17T12:00:00.000Z',
    updatedAt: completedAt,
  };
}

function sessionPlan(): HaleSessionPlan {
  return {
    id: 'session-plan-1',
    blockId: 'movement-block-1',
    title: 'Strength foundation',
    purposeCopy: 'Move comfortably.',
    sessionType: 'standard',
    estimatedMinutes: 18,
    focusDomain: 'strength_power',
    exercises: [
      {
        id: 'sit-to-stand-level-1',
        ladderId: 'sit-to-stand',
        family: 'sit_to_stand',
        name: 'Sit to stand',
        domain: 'strength_power',
        level: 1,
        measurementTier: 'measured',
        targetSets: 2,
        targetReps: 8,
      },
    ],
    metadata: {
      source: 'block_generated',
      generatedSessionId: 'generated-session-1',
      templateId: 'template-A',
      plannedDateKey: 'template-A:2026-06-17',
      generatedExercises: [
        {
          exerciseId: 'sit-to-stand-level-1',
          ladderId: 'sit-to-stand',
          levelId: 'sit-to-stand-level-1',
          sets: 2,
          repsPerSet: 8,
          measurementTier: 'measured',
        },
      ],
    },
  };
}

function sessionResult(): TrainingSessionResult {
  return {
    startedAt: '2026-06-17T12:06:00.000Z',
    items: [
      {
        exerciseId: 'sit-to-stand-level-1',
        status: 'completed',
        sets: [
          {
            exerciseId: 'sit-to-stand-level-1',
            reps: 8,
            meanVel: 0.28,
            holdSec: NaN,
            romPeak: NaN,
            autoregulated: false,
            reachedTarget: true,
            interruptions: 0,
            flags: [],
            frames: [{ shouldNotUpload: true }],
            landmarks: [{ shouldNotUpload: true }],
          } as never,
        ],
      },
    ],
  };
}

describe('training session completion sync mapping', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps completion, plan, feedback, and sanitized raw result into the remote payload', () => {
    const payload = mapLocalSessionCompletionToRemotePayload(
      {
        completion: {
          ...completion({
            perceivedEffort: 3,
            painReported: false,
          }),
          trackingQuality: 'good',
        } as TrainingSessionCompletion,
        sessionPlan: sessionPlan(),
        sessionResult: sessionResult(),
        generatedSummary: {
          id: 'generated-session-1',
          blockId: 'movement-block-1',
          source: 'block_generated',
          title: 'Strength foundation',
          completedAt,
          exerciseIds: ['sit-to-stand-level-1'],
          durationMinutes: 18,
        },
        movementBlock: movementBlock(),
        sessionIndex: 1,
      },
      'user-123',
      { movementBlockId: 'remote-block-123' }
    );

    expect(payload.user_id).toBe('user-123');
    expect(payload.movement_block_id).toBe('remote-block-123');
    expect(payload.local_session_id).toBe('completion-block-1-standard-session-1');
    expect(payload.session_index).toBe(1);
    expect(payload.status).toBe('completed');
    expect(payload.duration_seconds).toBe(1080);
    expect(payload.perceived_effort).toBe(3);
    expect(payload.pain_flag).toBe(false);
    expect(payload.tracking_quality).toBe('good');
    expect(payload.completed_at).toBe(completedAt);

    const summaryJson = JSON.stringify(payload.summary_json);
    expect(summaryJson).toContain('generated-session-1');
    expect(summaryJson).toContain('sit-to-stand-level-1');

    const rawJson = JSON.stringify(payload.raw_result_json);
    expect(rawJson).toContain('meanVel');
    expect(rawJson).not.toContain('frames');
    expect(rawJson).not.toContain('landmarks');
    expect(rawJson).not.toContain('shouldNotUpload');
  });

  it('upserts by user and local session id, then updates the same row when feedback arrives', async () => {
    const upsert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({ upsert });
    (getCurrentSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-123' },
    });

    const baseInput = {
      completion: completion({ id: 'completion-feedback-test' }),
      sessionPlan: sessionPlan(),
      sessionResult: sessionResult(),
      movementBlock: movementBlock(),
      movementBlockRemoteId: 'remote-block-123',
      sessionIndex: 1,
    };

    const initial = await syncTrainingSessionCompletionToRemote(baseInput);
    const feedback = await syncTrainingSessionCompletionToRemote({
      ...baseInput,
      completion: {
        ...baseInput.completion,
        perceivedEffort: 4,
        painReported: true,
        trackingQuality: 'usable',
      } as TrainingSessionCompletion,
    });

    expect(initial.status).toBe('synced');
    expect(feedback.status).toBe('synced');
    expect(supabase.from).toHaveBeenCalledWith('training_session_completions');
    expect(upsert).toHaveBeenCalledTimes(2);
    expect(upsert).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        user_id: 'user-123',
        local_session_id: 'completion-feedback-test',
        pain_flag: null,
      }),
      { onConflict: 'user_id,local_session_id' }
    );
    expect(upsert).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        user_id: 'user-123',
        local_session_id: 'completion-feedback-test',
        perceived_effort: 4,
        pain_flag: true,
        tracking_quality: 'usable',
      }),
      { onConflict: 'user_id,local_session_id' }
    );
  });
});
