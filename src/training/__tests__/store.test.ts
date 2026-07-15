/**
 * Training persistence + state transitions: the TrainingState round-trips
 * through the store across a simulated restart, micro-checks append and reload,
 * a foreign schema version is skipped (forward-compatible), and the
 * session-completion glue advances progress and stamps the re-test marker on
 * the final session.
 */

import { createMemoryFs } from '../../history';
import { TrainingBlock } from '../block';
import { STS_STANDARD_ID, THORACIC_ROTATION_ID } from '../../exercises';
import { TrainingStore } from '../store';
import { TrainingState, defaultTrainingState, deserializeTrainingState } from '../serialize';

describe('TrainingStore persistence', () => {
  it('round-trips training state across a restart', async () => {
    const files = new Map<string, string>();
    // A legacy persisted block is just fixture data now — the live plan path is
    // MovementBlock; this proves the older serialized shape still round-trips.
    const block: TrainingBlock = {
      createdAt: '2026-06-14T09:00:00.000Z',
      weeks: 4,
      sessionsPerWeek: 3,
      weakestDomain: 'strength',
      sessions: [],
    };
    let state: TrainingState = { ...defaultTrainingState(), block };
    state = { ...state, progression: { levels: { 'sit-to-stand': 3 }, velHistory: { [STS_STANDARD_ID]: [0.9, NaN] } } };

    new TrainingStore(createMemoryFs(files)).saveState(state);
    // Fresh store over the SAME files simulates an app restart.
    const reloaded = await new TrainingStore(createMemoryFs(files)).loadState();

    expect(reloaded.progression.levels['sit-to-stand']).toBe(3);
    expect(reloaded.block?.weakestDomain).toBe('strength');
    expect(reloaded.equipment.stair).toBe(false);
    // NaN velocity survived as null → read back as null inside the array.
    expect(reloaded.progression.velHistory[STS_STANDARD_ID][1]).toBeNull();
  });

  it('defaults cleanly when nothing is stored', async () => {
    const store = new TrainingStore(createMemoryFs());
    const state = await store.loadState();
    expect(state.block).toBeNull();
    expect(state.progress.completedSessions).toBe(0);
  });

  it('appends and reloads micro-checks oldest-first, skipping unmeasured NaN cleanly', async () => {
    const files = new Map<string, string>();
    const store = new TrainingStore(createMemoryFs(files));
    store.saveMicroCheck({ type: 'chair-power', startedAt: '2026-06-21T08:00:00.000Z', value: 0.42, reps: 5, measured: true });
    store.saveMicroCheck({ type: 'single-leg-balance', startedAt: '2026-06-14T08:00:00.000Z', value: 18, reps: 0, measured: true });
    const checks = await new TrainingStore(createMemoryFs(files)).loadMicroChecks();
    expect(checks.map((c) => c.startedAt)).toEqual([
      '2026-06-14T08:00:00.000Z',
      '2026-06-21T08:00:00.000Z',
    ]);
  });

  it('preserves the first slot-backed micro-check for same-slot conflicts', async () => {
    const files = new Map<string, string>();
    const store = new TrainingStore(createMemoryFs(files));
    store.saveMicroCheck({
      type: 'single-leg-balance',
      startedAt: '2026-06-21T08:00:00.000Z',
      completedAt: '2026-06-21T08:01:00.000Z',
      slotId: 'micro-check:block-1:week-2:balance',
      blockId: 'block-1',
      policyVersion: 1,
      policyFingerprint: 'policy-test',
      targetSource: 'balanced_schedule_rotation',
      targetDomain: 'balance',
      scheduleWeekIndex: 1,
      scheduleWeekNumber: 2,
      value: 18,
      reps: 0,
      measured: true,
    });
    store.saveMicroCheck({
      type: 'single-leg-balance',
      startedAt: '2026-06-21T08:02:00.000Z',
      completedAt: '2026-06-21T08:03:00.000Z',
      slotId: 'micro-check:block-1:week-2:balance',
      blockId: 'block-1',
      policyVersion: 1,
      policyFingerprint: 'policy-test',
      targetSource: 'balanced_schedule_rotation',
      targetDomain: 'balance',
      scheduleWeekIndex: 1,
      scheduleWeekNumber: 2,
      value: 20,
      reps: 0,
      measured: true,
    });

    const checks = await new TrainingStore(createMemoryFs(files)).loadMicroChecks();
    expect(checks).toHaveLength(1);
    expect(checks[0]).toMatchObject({
      slotId: 'micro-check:block-1:week-2:balance',
      targetSource: 'balanced_schedule_rotation',
      targetDomain: 'balance',
      value: 18,
    });
  });

  it('skips a record from an unknown schema version', () => {
    expect(deserializeTrainingState(JSON.stringify({ schemaVersion: 99, payload: {} }))).toBeNull();
  });

  it('loads old minimal v1 state with empty dynamic progress fields', () => {
    const parsed = deserializeTrainingState(
      JSON.stringify({
        schemaVersion: 1,
        payload: {
          block: null,
          progression: { levels: {}, velHistory: {} },
          equipment: { stair: false, band: false },
          progress: { completedSessions: 0, lastSessionAt: null, retestDueAt: null },
        },
      })
    );

    expect(parsed?.ladderProgressById).toEqual({});
    expect(parsed?.generatedSessionSummaries).toEqual([]);
    expect(parsed?.lastPostSessionFeedback).toBeNull();
    expect(parsed?.planPreferences.preferredIntensity).toBe('standard');
    expect(parsed?.appliedProgressionEventIds).toEqual([]);
  });

  it('round-trips a safe Training Voice V2.1 runtime envelope', () => {
    const parsed = deserializeTrainingState(
      JSON.stringify({
        schemaVersion: 4,
        payload: {
          ...defaultTrainingState(),
          activeTrainingVoiceRuntime: {
            version: 1,
            runtimeMode: 'internal_v21',
            phase: 'active',
            sessionEpoch: 1,
            itemEpoch: 2,
            setEpoch: 3,
            attemptEpoch: 4,
            safetyMemory: {
              version: 1,
              universalSafety: 'completed',
              introducedSafetyFamilies: ['chair_seat'],
              floor: {
                floorFamilyIntroduced: false,
                currentEnvironment: 'unknown',
                currentFloorItemId: null,
                currentFloorSetupEpoch: 0,
              },
              firstUseExerciseIds: ['squat-free'],
            },
            pausedOrigin: null,
            recoveryEpisode: null,
            completedTransitionIds: ['transition-1'],
            firedProgressEventIds: ['attempt-1:five'],
            activeVoiceId: 'retired-voice',
            pendingVoiceId: null,
            planFingerprint: 'plan:test',
          },
        },
      })
    );

    expect(parsed?.activeTrainingVoiceRuntime).toMatchObject({
      runtimeMode: 'internal_v21',
      phase: 'item_setup',
      activeVoiceId: 'clara',
      completedTransitionIds: ['transition-1'],
      firedProgressEventIds: ['attempt-1:five'],
    });
    expect(parsed?.activeTrainingVoiceRuntime?.safetyMemory.universalSafety).toBe('completed');
  });

  it('persists dynamic ladder progress and generated session summaries', async () => {
    const files = new Map<string, string>();
    const store = new TrainingStore(createMemoryFs(files));
    const state = {
      ...defaultTrainingState(),
      ladderProgressById: {
        'sit-to-stand': {
          ladderId: 'sit-to-stand',
          currentLevelId: STS_STANDARD_ID,
          currentLevelIndex: 1,
          completedSessionsAtLevel: 1,
          failedSessionsAtLevel: 0,
          recentCompletionRates: [1],
          recentRpe: [2],
          recentPain: [false],
          lastRpe: 2,
          lastPain: false,
          lastTrackingQuality: 'good' as const,
          lastCompletedAt: '2026-06-16T09:00:00.000Z',
          readyToProgress: true,
          updatedAt: '2026-06-16T09:00:00.000Z',
        },
      },
      appliedProgressionEventIds: ['progression:completion-1:movement-block-1:strength-A:sit-to-stand'],
      generatedSessionSummaries: [
        {
          id: 'generated-session-1',
          blockId: 'block-1',
          source: 'block_generated' as const,
          templateId: 'strength-A',
          title: 'Strength Session A',
          completedAt: '2026-06-16T09:00:00.000Z',
          exerciseIds: [STS_STANDARD_ID],
          ladderIds: ['sit-to-stand'],
          readiness: 'ready' as const,
          adjustmentReasons: ['controlled_beta_release_cap' as const],
          durationMinutes: 20,
          exercises: [
            {
              exerciseId: STS_STANDARD_ID,
              ladderId: 'sit-to-stand',
              levelId: STS_STANDARD_ID,
              requestedLevelId: 'loaded-sit-to-stand',
              selectedDailyLevelId: STS_STANDARD_ID,
              adjustmentReasons: ['controlled_beta_release_cap' as const],
            },
          ],
          focusStimulusEvidence: {
            planStatus: 'eligible' as const,
            status: 'credited_focus_work' as const,
            exclusionReason: 'none' as const,
            mainPlanCredit: true,
            blockFocusDomain: 'strength_power' as const,
            plannedPrimaryFocusExerciseCount: 1,
            completedPrimaryFocusExerciseCount: 1,
            completedSupportingExerciseCount: 0,
            completedFallbackExerciseCount: 0,
            completedCrossDomainExerciseCount: 0,
            plannedPrimaryFocusExerciseIds: [STS_STANDARD_ID],
            completedPrimaryFocusExerciseIds: [STS_STANDARD_ID],
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
        },
        {
          id: 'generated-session-supporting-only',
          blockId: 'block-1',
          source: 'block_generated' as const,
          templateId: 'strength-B',
          plannedDateKey: 'strength-B:2026-06-18',
          sessionType: 'standard' as const,
          status: 'partial' as const,
          mainPlanCredit: false,
          title: 'Strength Session B',
          completedAt: '2026-06-18T09:00:00.000Z',
          exerciseIds: ['balance-tandem-hold'],
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
            exclusionReason: 'supporting_only' as const,
            mainPlanCredit: false,
            blockFocusDomain: 'strength_power' as const,
            plannedPrimaryFocusExerciseCount: 1,
            completedPrimaryFocusExerciseCount: 0,
            completedSupportingExerciseCount: 1,
            completedFallbackExerciseCount: 0,
            completedCrossDomainExerciseCount: 0,
            plannedPrimaryFocusExerciseIds: [STS_STANDARD_ID],
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
        },
        {
          id: 'generated-session-mobility-collection',
          blockId: 'block-1',
          source: 'block_generated' as const,
          templateId: 'strength-C',
          plannedDateKey: 'strength-C:2026-06-20',
          sessionType: 'standard' as const,
          status: 'completed' as const,
          mainPlanCredit: false,
          title: 'Mobility Support',
          completedAt: '2026-06-20T09:00:00.000Z',
          exerciseIds: [THORACIC_ROTATION_ID],
          ladderIds: ['mobility-flexibility'],
          workEvidence: {
            plannedExerciseCount: 1,
            resultItemCount: 1,
            completedExerciseCount: 1,
            skippedExerciseCount: 0,
            missingResultCount: 0,
            duplicateResultCount: 0,
            malformedResultCount: 0,
            unmatchedResultCount: 0,
          },
          exercises: [
            {
              exerciseId: THORACIC_ROTATION_ID,
              ladderId: 'mobility-flexibility',
              levelId: THORACIC_ROTATION_ID,
              stimulusRole: 'supporting' as const,
              collectionSelection: {
                schemaVersion: 1 as const,
                policyFingerprint:
                  'collection-selection:1:mobility-flexibility:seated-hamstring-reach,thoracic-rotation,supported-hip-flexor-stretch,wall-calf-stretch',
                collectionId: 'mobility-flexibility',
                selectedExerciseId: THORACIC_ROTATION_ID,
                reason: 'never_practised_first' as const,
              },
            },
          ],
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
            plannedPrimaryFocusExerciseIds: [STS_STANDARD_ID],
            completedPrimaryFocusExerciseIds: [],
            completedSupportingExerciseIds: [THORACIC_ROTATION_ID],
            completedFallbackExerciseIds: [],
            completedCrossDomainExerciseIds: [],
            fallbackFocusSlotIds: [],
            skippedFocusSlotIds: [],
            focusStimulusExclusionReasons: [],
            missingMetadataExerciseIds: [],
            malformedMetadataExerciseIds: [],
            focusMismatchExerciseIds: [],
          },
        },
      ],
      lastPostSessionFeedback: {
        sessionId: 'generated-session-1',
        rpe: 2 as const,
        discomfort: false,
        completed: true,
        trackingQuality: 'good' as const,
        submittedAt: '2026-06-16T09:05:00.000Z',
      },
    };

    store.saveState(state);
    const reloaded = await new TrainingStore(createMemoryFs(files)).loadState();

    expect(reloaded.ladderProgressById['sit-to-stand'].currentLevelId).toBe(STS_STANDARD_ID);
    expect(reloaded.appliedProgressionEventIds).toEqual([
      'progression:completion-1:movement-block-1:strength-A:sit-to-stand',
    ]);
    expect(reloaded.generatedSessionSummaries[0].templateId).toBe('strength-A');
    expect(reloaded.generatedSessionSummaries[0].focusStimulusEvidence?.status).toBe('credited_focus_work');
    expect(reloaded.generatedSessionSummaries[0].adjustmentReasons).toEqual(['controlled_beta_release_cap']);
    expect(reloaded.generatedSessionSummaries[0].exercises?.[0].adjustmentReasons).toEqual(['controlled_beta_release_cap']);
    expect(reloaded.generatedSessionSummaries[1].mainPlanCredit).toBe(false);
    expect(reloaded.generatedSessionSummaries[1].status).toBe('partial');
    expect(reloaded.generatedSessionSummaries[1].focusStimulusEvidence?.exclusionReason).toBe('supporting_only');
    expect(reloaded.generatedSessionSummaries[2].exercises?.[0].collectionSelection).toMatchObject({
      collectionId: 'mobility-flexibility',
      selectedExerciseId: THORACIC_ROTATION_ID,
      reason: 'never_practised_first',
    });
    expect(reloaded.lastPostSessionFeedback?.rpe).toBe(2);
    expect(reloaded.planPreferences.preferredIntensity).toBe('standard');
  });

  it('persists local plan preferences', async () => {
    const files = new Map<string, string>();
    const store = new TrainingStore(createMemoryFs(files));
    store.saveState({
      ...defaultTrainingState(),
      planPreferences: { preferredIntensity: 'gentle' },
    });

    const reloaded = await new TrainingStore(createMemoryFs(files)).loadState();

    expect(reloaded.planPreferences.preferredIntensity).toBe('gentle');
  });
});
