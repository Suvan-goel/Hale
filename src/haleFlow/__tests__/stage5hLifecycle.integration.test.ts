import { getRetestDueSummary } from '../testing/legacyProgressSummaryFixture';
import { createMovementBlockReport } from '../testing/legacyBlockReportFixture';
import {
  BLOCK_SCHEDULE_POLICY_VERSION,
  annotateCompletionWithScheduleCredit,
  blockScheduleDateKey,
  checkUpCompletionTimestamp,
  classifyMainPlanCompletion,
  classifyMainPlanSessionPlan,
  createGeneratedSessionSummary,
  createMovementAssessment,
  evaluateCompletedFocusStimulusEvidence,
  evaluateSessionWorkEvidence,
  focusStimulusEvidenceSummary,
  getBlockScheduleState,
  getHaleAppLifecycle,
  getPlanEmptyStateCopy,
  getSessionPlanningRecoveryCopy,
  planTodayHaleSession,
  sessionPlanFromPlanningResult,
  staleEquipmentPlanningResult,
  validateHaleSessionPlanEquipment,
  applyProgressionEvidenceFromSession,
} from '../index';
import {
  createLifeGoal,
  createMovementBlockFromAssessment,
  defaultAdherenceStoreState,
  makeTrainingSessionCompletion,
  markMovementBlockComplete,
  recordTrainingSessionCompletion,
  upsertMovementAssessment,
  upsertMovementBlock,
  upsertMovementBlockReport,
  type AdherenceStoreState,
  type AvailableEquipment,
  type CheckupType,
  type MovementAssessment,
  type MovementBlock,
  type MovementDomain,
  type MovementSafetyProfile,
  type TrainingFocusStimulusEvidenceSummary,
  type TrainingSessionCompletion,
  type TrainingSessionWorkEvidenceSummary,
} from '../../adherence';
import {
  deserializeAdherenceState,
  serializeAdherenceState,
} from '../../adherence/serialize';
import {
  defaultPreferences,
  safetyProfileWithCanonicalEquipment,
  type Preferences,
  type UserProfile,
} from '../../profile';
import {
  defaultTrainingState,
  deserializeTrainingState,
  serializeTrainingState,
  upsertGeneratedSessionSummary,
  type PersistedGeneratedSessionSummary,
  type PersistedPostSessionFeedback,
  type TrainingSessionResult,
  type TrainingState,
} from '../../training';
import {
  mapLocalBlockReportToRemotePayload,
} from '../../services/backend/blockReportSyncService';
import {
  mapLocalBlockToRemotePayload,
} from '../../services/backend/blockSyncService';
import {
  mapLocalCheckupToRemotePayload,
} from '../../services/backend/checkupSyncService';
import {
  mapRemoteHaleSnapshotToLocal,
  restoreRemoteStateIfLocalEmpty,
  type RemoteHaleSnapshot,
} from '../../services/backend/restoreService';
import {
  mapLocalSessionCompletionToRemotePayload,
} from '../../services/backend/sessionSyncService';
import {
  mapLocalTrainingStateToRemotePayload,
} from '../../services/backend/trainingStateSyncService';
import {
  shouldSyncTrainingStateAfterLaunchRestore,
} from '../../services/backend/launchSyncGuards';
import {
  clearLocalHaleData,
  getLocalDataSummary,
} from '../../services/backend/accountDataService';
import {
  parseStoredScoreSnapshot,
  toStoredScoreSnapshot,
  type CheckUpScore,
  type Domain,
  type DomainResult,
  type VersionedCheckUpScoreSnapshot,
} from '../../scoring';
import type { HaleSessionPlan } from '../types';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('../../services/backend/authService', () => ({
  getCurrentSession: jest.fn(),
  signOut: jest.fn(),
}));

const START = '2026-06-01T08:00:00.000Z';
const RETEST_DUE = '2026-06-29T08:00:00.000Z';
const PROPERTY_SEED = 0x5a5a5a5a;
const PROPERTY_CASE_COUNT = 500;
const SESSION_DATES = [
  '2026-06-01T09:00:00.000Z',
  '2026-06-02T09:00:00.000Z',
  '2026-06-03T09:00:00.000Z',
  '2026-06-08T09:00:00.000Z',
  '2026-06-09T09:00:00.000Z',
  '2026-06-10T09:00:00.000Z',
  '2026-06-15T09:00:00.000Z',
  '2026-06-16T09:00:00.000Z',
  '2026-06-17T09:00:00.000Z',
  '2026-06-22T09:00:00.000Z',
  '2026-06-23T09:00:00.000Z',
  '2026-06-24T09:00:00.000Z',
] as const;

type FocusOrigin =
  | 'clear'
  | 'exact_tie_fallback'
  | 'exact_tie_preserved'
  | 'near_tie_fallback'
  | 'near_tie_preserved';

interface AssessmentFixture {
  score: CheckUpScore;
  scoreSnapshot: VersionedCheckUpScoreSnapshot;
  assessment: MovementAssessment;
}

interface LifecycleCase {
  name: string;
  baseline: AssessmentFixture;
  retest: AssessmentFixture;
  expectedInitialFocus: MovementDomain;
  expectedInitialOrigin: FocusOrigin;
  expectedNextFocus: MovementDomain;
  expectedNextOrigin: FocusOrigin;
}

interface LifecycleRun {
  caseName: string;
  initialBlock: MovementBlock;
  nextBlock: MovementBlock;
  adherence: AdherenceStoreState;
  training: TrainingState;
  reports: number;
  scheduleCredits: number;
  progressionEventIds: number;
  restoredScheduleStatus: string;
  remoteJson: string;
  retestScoreSnapshot: VersionedCheckUpScoreSnapshot;
}

describe('Stage 5H full lifecycle', () => {
  it.each(lifecycleCases())(
    'runs baseline -> 12 credited sessions -> retest -> report -> next block for $name',
    (testCase) => {
      const run = runCompleteLifecycle(testCase);

      expect(run.initialBlock.focusDomain).toBe(testCase.expectedInitialFocus);
      expect(originFromBlock(run.initialBlock)).toBe(testCase.expectedInitialOrigin);
      expect(run.nextBlock.focusDomain).toBe(testCase.expectedNextFocus);
      expect(originFromBlock(run.nextBlock)).toBe(testCase.expectedNextOrigin);
      expect(run.scheduleCredits).toBe(12);
      expect(run.reports).toBe(1);
      expect(run.adherence.blocks.filter((block) => block.status === 'active')).toHaveLength(1);
      expect(run.adherence.blocks.filter((block) => block.status === 'completed')).toHaveLength(1);
      expect(run.adherence.completions.filter((completion) => completion.sessionType === 'retest')).toHaveLength(1);
      expect(run.progressionEventIds).toBeGreaterThan(0);
      expect(run.restoredScheduleStatus).toBe('block_completed');
      expect(run.remoteJson).not.toMatch(/landmarks|video|frames|base64|pain notes|secret-token/i);
    }
  );
});

describe('Stage 5H pairwise adversarial matrix', () => {
  it('covers required equivalence classes and keeps credit/progression fail-closed', () => {
    const coverage = coverageTracker();

    for (const [index, scenario] of PAIRWISE_SCENARIOS.entries()) {
      coverage.focus.add(scenario.focus);
      coverage.focusOrigin.add(scenario.focusOrigin);
      coverage.weekTemplate.add(scenario.weekTemplate);
      coverage.equipment.add(scenario.equipment);
      coverage.dailyContext.add(scenario.dailyContext);
      coverage.planResult.add(scenario.planResult);
      coverage.resultEvidence.add(scenario.resultEvidence);
      coverage.persistence.add(scenario.persistence);

      const block = blockForScenario(scenario.focus, scenario.focusOrigin, 0);
      let training = defaultTrainingState();
      let adherence = {
        ...defaultAdherenceStoreState(),
        blocks: [block],
      };
      adherence = seedPriorCredits(adherence, block, scenario);
      training = seedTrainingSummaries(training, block, adherence.completions);
      const today = dateForScenario(scenario);
      const planResult = planTodayHaleSession({
        activeBlock: block,
        training,
        safetyProfile: safetyForEquipment(scenario.equipment),
        lifeGoal: lifeGoal(),
        recentCompletions: adherence.completions,
        readiness: readinessForScenario(scenario.dailyContext),
        painAreas: painAreasForScenario(scenario.dailyContext),
        today,
      });

      if (scenario.planResult === 'unavailable' || scenario.equipment === 'confirmation required') {
        expect(['unavailable', 'supporting_session', 'week_complete', 'block_complete', 'retest_due']).toContain(planResult.kind);
        if (planResult.kind === 'supporting_session') {
          expect(planResult.plan.metadata?.focusStimulus?.mainPlanCreditPotential).toBe(false);
        }
        continue;
      }
      if (scenario.planResult === 'week complete waiting') {
        expect(planResult.kind).toBe('week_complete');
        continue;
      }
      if (scenario.planResult === 'training complete waiting') {
        expect(planResult.kind).toBe('block_complete');
        continue;
      }
      if (scenario.planResult === 're-test due') {
        expect(planResult.kind).toBe('retest_due');
        continue;
      }
      const plan = sessionPlanFromPlanningResult(planResult);
      if (!plan) {
        expect(['unavailable', 'week_complete', 'block_complete', 'retest_due']).toContain(planResult.kind);
        continue;
      }
      expect(plan).toBeTruthy();

      const result = resultForEvidence(plan, scenario.resultEvidence);
      const completion = completionForPlan(block, plan, result, today);
      const schedule = getBlockScheduleState({
        block,
        completions: [...adherence.completions, completion],
        generatedSessionSummaries: training.generatedSessionSummaries,
        today,
      });
      const credited = annotateCompletionWithScheduleCredit(completion, schedule);
      const progression = applyProgressionEvidenceFromSession({
        state: {
          ladderProgressById: training.ladderProgressById,
          appliedProgressionEventIds: training.appliedProgressionEventIds,
        },
        sessionPlan: plan,
        completion: credited,
        activeBlock: block,
        sessionResult: result,
        perceivedEffort: 3,
        painReported: false,
        trackingQuality: 'good',
      });

      if (scenario.resultEvidence !== 'full primary completion' && scenario.resultEvidence !== 'partial with one primary') {
        expect(credited.scheduleCredit?.credited).toBe(false);
        expect(progression.eligibility.eligible).toBe(false);
      }
      if (scenario.planResult === 'supporting session') {
        const supportingPlan = {
          ...plan,
          metadata: {
            ...plan.metadata,
            focusStimulus: {
              ...plan.metadata!.focusStimulus!,
              mainPlanCreditPotential: false,
              status: 'no_primary_focus_planned' as const,
            },
          },
        };
        expect(supportingPlan.metadata.focusStimulus.mainPlanCreditPotential).toBe(false);
      }
    }

    expectCoverage(coverage);
  });
});

describe('Stage 5H seeded lifecycle properties', () => {
  it(`passes ${PROPERTY_CASE_COUNT} deterministic scenarios with seed ${PROPERTY_SEED}`, () => {
    const rng = lcg(PROPERTY_SEED);

    for (let index = 0; index < PROPERTY_CASE_COUNT; index += 1) {
      const focus = pick(rng, ['strength_power', 'balance', 'mobility'] as const);
      const origin = pick(rng, ['clear', 'exact_tie_fallback', 'near_tie_fallback'] as const);
      const equipment = pick(rng, ['full kit', 'chair + wall', 'explicit none', 'confirmation required'] as const);
      const resultEvidence = pick(rng, [
        'full primary completion',
        'supporting-only',
        'fallback-only',
        'all skipped',
        'missing result',
        'duplicate result',
        'malformed result',
      ] as const);
      const weekTemplate = pick(rng, ['week 1 A', 'week 2 B', 'week 4 C'] as const);
      const block = blockForScenario(focus, origin, index);
      let adherence = { ...defaultAdherenceStoreState(), blocks: [block] };
      adherence = seedPriorCredits(adherence, block, {
        weekTemplate,
        planResult: 'ready',
      });
      const training = seedTrainingSummaries(defaultTrainingState(), block, adherence.completions);
      const today = dateForWeekTemplate(weekTemplate);
      const first = planTodayHaleSession({
        activeBlock: block,
        training,
        safetyProfile: safetyForEquipment(equipment),
        lifeGoal: lifeGoal(),
        recentCompletions: adherence.completions,
        today,
      });
      const second = planTodayHaleSession({
        activeBlock: block,
        training,
        safetyProfile: safetyForEquipment(equipment),
        lifeGoal: lifeGoal(),
        recentCompletions: adherence.completions,
        today,
      });

      try {
        expect(projectPlanningResult(first)).toEqual(projectPlanningResult(second));
        expect(() => serializeTrainingState(training)).not.toThrow();
        expect(() => serializeAdherenceState(adherence)).not.toThrow();
        if (first.kind !== 'ready' && first.kind !== 'supporting_session') {
          continue;
        }
        const plan = first.plan;
        expect(plan.exercises.every((exercise) => exercise.id && typeof exercise.id === 'string')).toBe(true);
        const result = resultForEvidence(plan, resultEvidence);
        const completion = completionForPlan(block, plan, result, today);
        const schedule = getBlockScheduleState({
          block,
          completions: [...adherence.completions, completion],
          generatedSessionSummaries: training.generatedSessionSummaries,
          today,
        });
        const credited = annotateCompletionWithScheduleCredit(completion, schedule);
        const perDate = new Set(schedule.credits.map((credit) => credit.dateKey));
        expect(perDate.size).toBe(schedule.credits.length);
        if (completion.focusStimulusEvidence?.mainPlanCredit !== true) {
          expect(credited.scheduleCredit?.credited).toBe(false);
        }
        const progression = applyProgressionEvidenceFromSession({
          state: {
            ladderProgressById: training.ladderProgressById,
            appliedProgressionEventIds: training.appliedProgressionEventIds,
          },
          sessionPlan: plan,
          completion: credited,
          activeBlock: block,
          sessionResult: result,
          perceivedEffort: 3,
          painReported: false,
          trackingQuality: 'good',
        });
        if (credited.scheduleCredit?.credited !== true) {
          expect(progression.eligibility.eligible).toBe(false);
        }
        expect(new Set(progression.nextState.appliedProgressionEventIds).size).toBe(
          progression.nextState.appliedProgressionEventIds.length
        );
      } catch (error) {
        throw new Error(`Stage 5H property scenario ${index} failed with seed ${PROPERTY_SEED}: ${String(error)}`);
      }
    }
  });
});

describe('Stage 5H invalid-state, crash/retry, restore, schema, and UI truthfulness', () => {
  it('fails closed for authoritative one-field corruptions', () => {
    const block = blockForScenario('balance', 'clear', 0);
    const plan = playablePlan(block, '2026-06-01T09:00:00.000Z');
    const result = completedResult(plan);
    const completion = completionForPlan(block, plan, result, '2026-06-01T09:00:00.000Z');

    const wrongBlock = { ...completion, blockId: 'other-block' };
    expect(classifyMainPlanCompletion(block, wrongBlock).credited).toBe(false);
    expect(
      getBlockScheduleState({ block, completions: [wrongBlock], today: '2026-06-01T09:00:00.000Z' }).credits
    ).toHaveLength(0);

    const wrongTemplate = { ...completion, templateId: 'mobility-A', plannedDate: 'mobility-A:2026-06-01' };
    expect(classifyMainPlanCompletion(block, wrongTemplate).credited).toBe(false);

    const noFocus = { ...completion, focusStimulusEvidence: undefined, mainPlanCredit: true };
    expect(classifyMainPlanCompletion(block, noFocus).credited).toBe(false);

    const zeroWork = completionForPlan(block, plan, skippedResult(plan), '2026-06-01T09:00:00.000Z');
    expect(zeroWork.mainPlanCredit).toBe(false);

    const future = completionForPlan(block, plan, result, '2026-07-10T09:00:00.000Z');
    expect(
      annotateCompletionWithScheduleCredit(
        future,
        getBlockScheduleState({ block, completions: [future], today: '2026-06-01T09:00:00.000Z' })
      ).scheduleCredit?.reason
    ).toBe('future_completion');

    const staleCompleted = { ...block, status: 'completed' as const };
    const allTraining = scheduledCompletions(staleCompleted);
    const report = createMovementBlockReport({
      block: staleCompleted,
      previousScore: null,
      latestScore: null,
      completions: allTraining,
      nowIso: RETEST_DUE,
    });
    expect(report.comparison?.status).toBe('missing_snapshot');

    const missingEquipmentPlan: HaleSessionPlan = {
      ...plan,
      metadata: { ...plan.metadata!, equipmentSnapshot: undefined },
    };
    const missingEquipment = validateHaleSessionPlanEquipment({ plan: missingEquipmentPlan, safetyProfile: safety() });
    expect(missingEquipment.status).toBe('missing_plan_snapshot');
    expect(staleEquipmentPlanningResult({ plan: missingEquipmentPlan, validation: missingEquipment }).reason).toBe(
      'missing_equipment_snapshot'
    );

    const staleEquipment = validateHaleSessionPlanEquipment({
      plan,
      safetyProfile: safety({ equipment: ['chair', 'wall'], revision: 99, updatedAt: '2026-06-02T00:00:00.000Z' }),
    });
    expect(staleEquipment.status).toBe('equipment_changed');

    const duplicateProgression = applyProgressionEvidenceFromSession({
      state: { ladderProgressById: {}, appliedProgressionEventIds: [] },
      sessionPlan: plan,
      completion: scheduleCreditedCompletion(block, completion, '2026-06-01T09:00:00.000Z'),
      activeBlock: block,
      sessionResult: result,
      perceivedEffort: 3,
      painReported: false,
      trackingQuality: 'good',
    });
    const duplicateAgain = applyProgressionEvidenceFromSession({
      state: duplicateProgression.nextState,
      sessionPlan: plan,
      completion: scheduleCreditedCompletion(block, completion, '2026-06-01T09:00:00.000Z'),
      activeBlock: block,
      sessionResult: result,
      perceivedEffort: 3,
      painReported: false,
      trackingQuality: 'good',
    });
    expect(duplicateAgain.skippedDuplicateEvents.length).toBeGreaterThan(0);
  });

  it('keeps crash/retry and official re-test transitions idempotent', () => {
    const baseline = assessmentForScore(scoreForFocus('balance'));
    const initial = runCompleteLifecycle({
      name: 'retry-boundary',
      baseline,
      retest: assessmentForScore(score({ strength: 62, balance: 78, mobility: 60 }, 'balance'), {
        type: 'official_retest',
        sourceBlockId: 'unused',
        activeFocusDomain: 'balance',
        checkUpId: RETEST_DUE,
      }),
      expectedInitialFocus: 'balance',
      expectedInitialOrigin: 'clear',
      expectedNextFocus: 'balance',
      expectedNextOrigin: 'clear',
    });
    const before = initial.adherence;
    const block = before.blocks.find((item) => item.id === initial.initialBlock.id)!;
    const retest = initial.adherence.assessments.find((assessment) => assessment.type === 'official_retest')!;
    const replayed = applyRetestTransition(
      before,
      block,
      baseline.assessment,
      retest,
      baseline.score,
      initial.retestScore,
      initial.retestScoreSnapshot
    );

    expect(replayed.reports).toHaveLength(before.reports.length);
    expect(replayed.completions.filter((completion) => completion.sessionType === 'retest')).toHaveLength(1);
    expect(replayed.blocks.filter((item) => item.status === 'active')).toHaveLength(1);
    expect(replayed.blocks.filter((item) => item.status === 'completed')).toHaveLength(1);
  });

  it('restores duplicate, reordered, stale, and malformed remote state without promoting invalid authority', async () => {
    const run = runCompleteLifecycle(lifecycleCases()[1]);
    const block = run.initialBlock;
    const staleTrainingPayload = mapLocalTrainingStateToRemotePayload(
      {
        training: {
          ...run.training,
          generatedSessionSummaries: run.training.generatedSessionSummaries.map((summary) => ({
            ...summary,
            focusStimulusEvidence: undefined,
            mainPlanCredit: true,
          })),
        },
        updatedAt: RETEST_DUE,
      },
      'user-123'
    );
    const completionPayload = mapLocalSessionCompletionToRemotePayload(
      {
        completion: run.adherence.completions[0],
        generatedSummary: run.training.generatedSessionSummaries[0],
        movementBlock: block,
      },
      'user-123'
    );
    const snapshot: RemoteHaleSnapshot = {
      profile: null,
      movementCheckups: [],
      movementBlocks: [
        {
          block_json: { movementBlock: block as unknown as Record<string, unknown> } as never,
          created_at: block.createdAt,
        },
      ],
      trainingState: {
        user_id: 'user-123',
        state_json: staleTrainingPayload.state_json,
        updated_at: RETEST_DUE,
      },
      trainingSessionCompletions: [
        {
          summary_json: completionPayload.summary_json,
          raw_result_json: { landmarks: [{ x: 1 }], video: 'raw-video' },
          completed_at: run.adherence.completions[0].completedAt,
        },
        {
          summary_json: completionPayload.summary_json,
          completed_at: run.adherence.completions[0].completedAt,
        },
        {
          summary_json: { completion: { id: 7, blockId: null } },
          raw_result_json: { frames: [1, 2, 3] },
          completed_at: run.adherence.completions[0].completedAt,
        },
      ],
      microChecks: [],
      movementBlockReports: [],
      fetchErrors: {},
    };
    const local = emptyLocalState();
    const mapped = mapRemoteHaleSnapshotToLocal(snapshot, local);
    expect(mapped.state.adherence.blocks).toHaveLength(1);
    expect(mapped.state.adherence.completions).toHaveLength(1);
    expect(
      getBlockScheduleState({
        block,
        completions: mapped.state.adherence.completions,
        generatedSessionSummaries: mapped.state.training.generatedSessionSummaries,
        today: '2026-06-01T09:00:00.000Z',
      }).totalCredits
    ).toBe(1);
    expect(JSON.stringify(mapped.state.training)).not.toMatch(/landmarks|raw-video|frames/i);

    const skipped = await restoreRemoteStateIfLocalEmpty({
      local: { ...local, adherence: run.adherence },
      snapshot,
    });
    expect(skipped.status).toBe('skipped_local_not_empty');
    expect(
      shouldSyncTrainingStateAfterLaunchRestore({
        localWasEmptyAtRestore: true,
        restoreOutcome: 'failed',
        training: defaultTrainingState(),
      })
    ).toBe(false);
  });

  it('bounds multi-block growth and preserves one active block over three consecutive blocks', () => {
    let baseline = assessmentForScore(scoreForFocus('strength_power'));
    let adherence = defaultAdherenceStoreState();
    let training = defaultTrainingState();
    const reports: string[] = [];
    let block = createMovementBlockFromAssessment({
      latestAssessment: {
        score: baseline.score,
        scoreSnapshot: baseline.scoreSnapshot,
        assessment: baseline.assessment,
        sourceCheckUpId: baseline.score.startedAt,
      },
      lifeGoal: lifeGoal(),
      startDate: START,
    });

    for (let blockIndex = 0; blockIndex < 3; blockIndex += 1) {
      adherence = upsertMovementAssessment(upsertMovementBlock(adherence, block), baseline.assessment);
      const offsets = [0, 1, 2, 7, 8, 9, 14, 15, 16, 21, 22, 23];
      const dates = offsets.map((offset) => addDaysIso(block.startDate, offset));
      for (const date of dates) {
        const step = completeOneSession({ block, adherence, training, today: date });
        adherence = step.adherence;
        training = step.training;
      }
      const retestDate = addDaysIso(block.startDate, 28);
      const retestFocusDomain = requireFocusedBlockDomain(block);
      const retest = assessmentForScore(scoreForFocus(retestFocusDomain, retestDate), {
        type: 'official_retest',
        sourceBlockId: block.id,
        checkUpId: retestDate,
        activeFocusDomain: scoreDomainForMovement(retestFocusDomain),
      });
      adherence = applyRetestTransition(
        adherence,
        block,
        baseline.assessment,
        retest.assessment,
        baseline.score,
        retest.score,
        retest.scoreSnapshot
      );
      reports.push(`block-${blockIndex}`);
      baseline = retest;
      block = adherence.blocks.find((item) => item.status === 'active')!;
    }

    expect(adherence.completions.filter((completion) => completion.scheduleCredit?.credited === true)).toHaveLength(36);
    expect(adherence.completions.filter((completion) => completion.sessionType === 'retest')).toHaveLength(3);
    expect(adherence.reports).toHaveLength(3);
    expect(adherence.blocks.filter((block) => block.status === 'active')).toHaveLength(1);
    expect(adherence.blocks.filter((block) => block.status === 'completed')).toHaveLength(3);
    expect(training.generatedSessionSummaries.length).toBeLessThanOrEqual(50);
    expect(training.appliedProgressionEventIds.length).toBeLessThanOrEqual(200);
    expect(serializeAdherenceState(adherence).length).toBeLessThan(250000);
    expect(serializeTrainingState(training).length).toBeLessThan(250000);
    expect(reports).toHaveLength(3);
  });

  it('keeps Today, Plan, Progress, scheduler, milestones, progression, and payloads truthful for one state', () => {
    const baseline = assessmentForScore(scoreForFocus('mobility'));
    const block = createMovementBlockFromAssessment({
      latestAssessment: {
        score: baseline.score,
        scoreSnapshot: baseline.scoreSnapshot,
        assessment: baseline.assessment,
        sourceCheckUpId: baseline.score.startedAt,
      },
      lifeGoal: lifeGoal(),
      startDate: START,
    });
    let adherence = { ...defaultAdherenceStoreState(), assessments: [baseline.assessment], blocks: [block] };
    let training = defaultTrainingState();
    const first = completeOneSession({ block, adherence, training, today: '2026-06-01T09:00:00.000Z' });
    adherence = first.adherence;
    training = first.training;

    const schedule = getBlockScheduleState({
      block,
      completions: adherence.completions,
      generatedSessionSummaries: training.generatedSessionSummaries,
      today: '2026-06-02T09:00:00.000Z',
    });
    const lifecycle = getHaleAppLifecycle({
      profile: profile(),
      history: [],
      training,
      adherence,
      today: '2026-06-02T09:00:00.000Z',
    });
    const planState = planTodayHaleSession({
      activeBlock: block,
      training,
      safetyProfile: safety(),
      lifeGoal: lifeGoal(),
      recentCompletions: adherence.completions,
      today: '2026-06-02T09:00:00.000Z',
    });
    const retest = getRetestDueSummary({
      activeBlock: block,
      today: '2026-06-02T09:00:00.000Z',
      hasBaseline: true,
      completions: adherence.completions,
    });

    expect(schedule.status).toBe('session_due');
    expect(schedule.nextTemplateId).toBe('mobility-B');
    expect(lifecycle.state).toBe('weekly_micro_check_due');
    expect(lifecycle.microCheckTarget).toMatchObject({ type: 'mobility-reach', domain: 'mobility' });
    expect(planState.kind).toBe('ready');
    expect(retest.due).toBe(false);
    expect(getPlanEmptyStateCopy('needs_baseline_checkup').body.toLowerCase()).not.toMatch(/diagnosis|fall risk|failed|lost streak/);
    expect(JSON.stringify(mapLocalBlockToRemotePayload({ block, training }, 'user-123'))).not.toMatch(/landmark|video|base64|uri|path/i);
    expect(
      JSON.stringify(
        mapLocalBlockReportToRemotePayload(
          {
            report: createMovementBlockReport({ block, previousScore: null, latestScore: null, completions: adherence.completions }),
            movementBlock: block,
            completions: adherence.completions,
          },
          'user-123'
        )
      )
    ).not.toMatch(/landmark|video|base64|uri|path/i);
  });

  it('keeps current schema round-trips exact and future/legacy authority fail-closed', () => {
    const run = runCompleteLifecycle(lifecycleCases()[0]);
    expect(deserializeAdherenceState(serializeAdherenceState(run.adherence))).toEqual(run.adherence);
    expect(deserializeTrainingState(serializeTrainingState(run.training))).toEqual(run.training);
    expect(deserializeTrainingState(JSON.stringify({ schemaVersion: 999, payload: run.training }))).toBeNull();
    const legacy = deserializeTrainingState(
      JSON.stringify({
        schemaVersion: 1,
        payload: {
          progress: { completedSessions: 1, lastSessionAt: START, retestDueAt: null },
          generatedSessionSummaries: [
            {
              id: 'legacy-summary',
              title: 'Legacy',
              source: 'legacy',
              exerciseIds: ['x'],
              mainPlanCredit: true,
            },
          ],
        },
      })
    );
    expect(legacy?.generatedSessionSummaries[0]?.source).toBe('legacy');
    expect(
      getBlockScheduleState({
        block: run.initialBlock,
        generatedSessionSummaries: legacy?.generatedSessionSummaries,
        completions: [],
        today: START,
      }).totalCredits
    ).toBe(0);
  });

  it('scopes account data and payload user ids to the authenticated user boundary', async () => {
    const run = runCompleteLifecycle(lifecycleCases()[2]);
    const completionPayload = mapLocalSessionCompletionToRemotePayload(
      {
        completion: run.adherence.completions[0],
        generatedSummary: run.training.generatedSessionSummaries[0],
        movementBlock: run.initialBlock,
      },
      'user-a'
    );
    const trainingPayload = mapLocalTrainingStateToRemotePayload({ training: run.training, updatedAt: START }, 'user-b');
    const blockPayload = mapLocalBlockToRemotePayload({ block: run.initialBlock, training: run.training }, 'user-c');
    expect(completionPayload.user_id).toBe('user-a');
    expect(trainingPayload.user_id).toBe('user-b');
    expect(blockPayload.user_id).toBe('user-c');

    const files = memoryHistoryFs([
      'preferences.json',
      'checkup-1.json',
      'training-state.json',
      'adherence-state.json',
      'microcheck-1.json',
    ]);
    const recordings = memoryArea(['rec-1.jsonl']);
    expect(await getLocalDataSummary({ fs: files, recordings })).toMatchObject({
      preferences: true,
      checkups: 1,
      trainingState: true,
      microChecks: 1,
      adherenceState: true,
      recordings: 1,
    });
    const cleared = await clearLocalHaleData({ fs: files, recordings });
    expect(cleared.failures).toEqual([]);
    expect(await getLocalDataSummary({ fs: files, recordings })).toMatchObject({
      preferences: false,
      checkups: 0,
      trainingState: false,
      microChecks: 0,
      adherenceState: false,
      recordings: 0,
    });
  });
});

function runCompleteLifecycle(testCase: LifecycleCase): LifecycleRun & { retestScore: CheckUpScore } {
  const goal = lifeGoal();
  let adherence = defaultAdherenceStoreState();
  let training = defaultTrainingState();
  adherence = upsertMovementAssessment(adherence, testCase.baseline.assessment);
  const initialBlock = createMovementBlockFromAssessment({
    latestAssessment: {
      score: testCase.baseline.score,
      scoreSnapshot: testCase.baseline.scoreSnapshot,
      assessment: testCase.baseline.assessment,
      sourceCheckUpId: testCase.baseline.score.startedAt,
    },
    lifeGoal: goal,
    startDate: START,
  });
  adherence = upsertMovementBlock(adherence, initialBlock);

  const model = createReferenceModel(initialBlock);
  for (const today of SESSION_DATES) {
    const step = completeOneSession({ block: initialBlock, adherence, training, today });
    adherence = step.adherence;
    training = step.training;
    model.applyCredit(step.completion);
    expect(step.completion.scheduleCredit?.credited).toBe(true);
    expect(step.schedule.status).toBe(model.expectedStatus(today));
    expect(step.schedule.nextTemplateId).toBe(model.expectedNextTemplate());
  }

  const waiting = getBlockScheduleState({ block: initialBlock, completions: adherence.completions, today: SESSION_DATES[11] });
  expect(waiting.status).toBe('training_complete_waiting_retest');
  const due = getBlockScheduleState({ block: initialBlock, completions: adherence.completions, today: RETEST_DUE });
  expect(due.status).toBe('retest_due');
  expect(planTodayHaleSession({
    activeBlock: initialBlock,
    training,
    safetyProfile: safety(),
    lifeGoal: goal,
    recentCompletions: adherence.completions,
    today: RETEST_DUE,
  }).kind).toBe('retest_due');

  adherence = applyRetestTransition(
    adherence,
    initialBlock,
    testCase.baseline.assessment,
    testCase.retest.assessment,
    testCase.baseline.score,
    testCase.retest.score,
    testCase.retest.scoreSnapshot
  );
  const nextBlock = adherence.blocks.find((block) => block.status === 'active')!;
  const restoredAdherence = deserializeAdherenceState(serializeAdherenceState(adherence))!;
  const restoredTraining = deserializeTrainingState(serializeTrainingState(training))!;
  const restoredScheduleStatus = getBlockScheduleState({
    block: restoredAdherence.blocks.find((block) => block.id === initialBlock.id)!,
    completions: restoredAdherence.completions,
    generatedSessionSummaries: restoredTraining.generatedSessionSummaries,
    today: RETEST_DUE,
  }).status;
  const remoteJson = JSON.stringify({
    checkup: mapLocalCheckupToRemotePayload(
      {
        checkUp: { startedAt: testCase.baseline.score.startedAt, bodyUnit: null, items: [] },
        checkupType: 'baseline',
        scoreSnapshot: testCase.baseline.scoreSnapshot,
        assessment: testCase.baseline.assessment,
      },
      'user-123'
    ),
    training: mapLocalTrainingStateToRemotePayload({ training, updatedAt: RETEST_DUE }, 'user-123'),
    session: mapLocalSessionCompletionToRemotePayload(
      {
        completion: adherence.completions[0],
        generatedSummary: training.generatedSessionSummaries[0],
        movementBlock: initialBlock,
      },
      'user-123'
    ),
    block: mapLocalBlockToRemotePayload({ block: initialBlock, training }, 'user-123'),
    report: mapLocalBlockReportToRemotePayload(
      {
        report: adherence.reports[0],
        movementBlock: initialBlock,
        baselineAssessment: testCase.baseline.assessment,
        retestAssessment: testCase.retest.assessment,
        completions: adherence.completions,
      },
      'user-123'
    ),
  });

  return {
    caseName: testCase.name,
    initialBlock,
    nextBlock,
    adherence,
    training,
    reports: adherence.reports.length,
    scheduleCredits: adherence.completions.filter((completion) => completion.scheduleCredit?.credited === true).length,
    progressionEventIds: training.appliedProgressionEventIds.length,
    restoredScheduleStatus,
    remoteJson,
    retestScore: testCase.retest.score,
    retestScoreSnapshot: testCase.retest.scoreSnapshot,
  };
}

function completeOneSession({
  block,
  adherence,
  training,
  today,
  readiness = 'ready',
  painAreas = [],
}: {
  block: MovementBlock;
  adherence: AdherenceStoreState;
  training: TrainingState;
  today: string;
  readiness?: 'ready' | 'a_bit_stiff' | 'low_energy' | 'something_hurts' | 'short_on_time';
  painAreas?: readonly ('knee' | 'hip' | 'back' | 'shoulder' | 'ankle' | 'neck' | 'other')[];
}): {
  adherence: AdherenceStoreState;
  training: TrainingState;
  completion: TrainingSessionCompletion;
  schedule: ReturnType<typeof getBlockScheduleState>;
} {
  const planning = planTodayHaleSession({
    activeBlock: block,
    training,
    safetyProfile: safety(),
    lifeGoal: lifeGoal(),
    recentCompletions: adherence.completions,
    readiness,
    painAreas,
    today,
  });
  if (planning.kind !== 'ready') throw new Error(`Expected ready planning result, got ${planning.kind}`);
  const plan = planning.plan;
  const result = completedResult(plan);
  const baseCompletion = completionForPlan(block, plan, result, today);
  const schedule = getBlockScheduleState({
    block,
    completions: [...adherence.completions, baseCompletion],
    generatedSessionSummaries: training.generatedSessionSummaries,
    today,
  });
  const completion = annotateCompletionWithScheduleCredit(baseCompletion, schedule);
  const feedback: PersistedPostSessionFeedback = {
    sessionId: plan.metadata?.generatedSessionId ?? plan.id,
    rpe: 3,
    discomfort: false,
    completed: true,
    trackingQuality: 'good',
    submittedAt: today,
  };
  const summary = createGeneratedSessionSummary({
    sessionPlan: plan,
    completedAt: today,
    durationMinutes: plan.estimatedMinutes,
    feedback,
    mainPlanCredit: completion.mainPlanCredit,
    scheduleCredit: completion.scheduleCredit,
    workEvidence: completion.workEvidence,
    focusStimulusEvidence: completion.focusStimulusEvidence,
  });
  const progressed = applyProgressionEvidenceFromSession({
    state: {
      ladderProgressById: training.ladderProgressById,
      appliedProgressionEventIds: training.appliedProgressionEventIds,
    },
    sessionPlan: plan,
    completion,
    activeBlock: block,
    sessionResult: result,
    perceivedEffort: 3,
    painReported: false,
    trackingQuality: 'good',
  });
  return {
    adherence: recordTrainingSessionCompletion(adherence, completion),
    training: {
      ...training,
      ladderProgressById: progressed.nextState.ladderProgressById,
      appliedProgressionEventIds: [...progressed.nextState.appliedProgressionEventIds],
      generatedSessionSummaries: upsertGeneratedSessionSummary(training.generatedSessionSummaries, summary),
      lastPostSessionFeedback: feedback,
    },
    completion,
    schedule,
  };
}

function applyRetestTransition(
  state: AdherenceStoreState,
  block: MovementBlock,
  baseline: MovementAssessment,
  retest: MovementAssessment,
  previousScore: CheckUpScore | null,
  latestScore: CheckUpScore | null,
  latestScoreSnapshot: VersionedCheckUpScoreSnapshot | null
): AdherenceStoreState {
  const completedAt = checkUpCompletionTimestamp({ startedAt: retest.completedAt ?? RETEST_DUE, bodyUnit: null, items: [] }, RETEST_DUE);
  let next = upsertMovementAssessment(state, { ...retest, completedAt });
  next = recordTrainingSessionCompletion(
    next,
    makeTrainingSessionCompletion({ block, sessionType: 'retest', completedAt, plannedDate: 'retest' })
  );
  next = markMovementBlockComplete(next, block.id, completedAt);
  const completedBlock = next.blocks.find((item) => item.id === block.id) ?? block;
  next = upsertMovementBlockReport(
    next,
    createMovementBlockReport({
      block: completedBlock,
      baselineAssessment: baseline,
      retestAssessment: retest,
      previousScore,
      latestScore,
      completions: next.completions,
      nowIso: completedAt,
    })
  );
  if (latestScore && latestScoreSnapshot) {
    next = upsertMovementBlock(
      next,
      createMovementBlockFromAssessment({
        latestAssessment: {
          score: latestScore,
          scoreSnapshot: latestScoreSnapshot,
          assessment: retest,
          sourceCheckUpId: latestScore.startedAt,
        },
        lifeGoal: lifeGoal(completedAt),
        startDate: completedAt,
      })
    );
  }
  return next;
}

function completionForPlan(
  block: MovementBlock,
  plan: HaleSessionPlan,
  result: TrainingSessionResult,
  completedAt: string,
  overrides: Partial<TrainingSessionCompletion> = {}
): TrainingSessionCompletion {
  const work = evaluateSessionWorkEvidence(plan, result);
  const focus = evaluateCompletedFocusStimulusEvidence({ sessionPlan: plan, result, activeBlock: block, workEvidence: work });
  return {
    ...makeTrainingSessionCompletion({
      block,
      sessionType: plan.sessionType,
      completedAt,
      plannedDate: plan.metadata?.plannedDateKey,
      source: plan.metadata?.source,
      templateId: plan.metadata?.templateId,
      mainPlanCredit: focus.mainPlanCredit,
      workEvidence: workSummary(work),
      focusStimulusEvidence: focusStimulusEvidenceSummary(focus),
      progressionEvidencePolicy: plan.metadata?.progressionEvidencePolicy,
    }),
    ...overrides,
  };
}

function completedResult(plan: HaleSessionPlan): TrainingSessionResult {
  return {
    startedAt: START,
    items: plan.exercises.map((exercise) => ({ exerciseId: exercise.id, status: 'completed' as const, sets: [] })),
  };
}

function skippedResult(plan: HaleSessionPlan): TrainingSessionResult {
  return {
    startedAt: START,
    items: plan.exercises.map((exercise) => ({ exerciseId: exercise.id, status: 'skipped' as const, sets: [] })),
  };
}

function resultForEvidence(plan: HaleSessionPlan, evidence: PairwiseScenario['resultEvidence']): TrainingSessionResult {
  const primary = plan.metadata?.focusStimulus?.plannedPrimaryFocusExerciseIds[0] ?? plan.exercises[0]?.id;
  const supporting = plan.metadata?.focusStimulus?.plannedSupportingExerciseIds[0] ?? plan.exercises.find((exercise) => exercise.id !== primary)?.id;
  const fallback = plan.metadata?.focusStimulus?.plannedFallbackExerciseIds[0] ?? plan.exercises.find((exercise) => exercise.id !== primary)?.id;
  if (evidence === 'full primary completion') return completedResult(plan);
  if (evidence === 'partial with one primary') {
    return { startedAt: START, items: [{ exerciseId: primary, status: 'completed', sets: [] }] };
  }
  if (evidence === 'supporting-only') {
    return { startedAt: START, items: supporting ? [{ exerciseId: supporting, status: 'completed', sets: [] }] : [] };
  }
  if (evidence === 'fallback-only') {
    return { startedAt: START, items: fallback ? [{ exerciseId: fallback, status: 'completed', sets: [] }] : [] };
  }
  if (evidence === 'all skipped') return skippedResult(plan);
  if (evidence === 'missing result') return { startedAt: START, items: [] };
  if (evidence === 'duplicate result') {
    return {
      startedAt: START,
      items: [
        { exerciseId: primary, status: 'completed', sets: [] },
        { exerciseId: primary, status: 'completed', sets: [] },
      ],
    };
  }
  return {
    startedAt: START,
    items: [{ exerciseId: '', status: 'completed' as const, sets: [] }],
  };
}

function scheduleCreditedCompletion(block: MovementBlock, completion: TrainingSessionCompletion, today: string): TrainingSessionCompletion {
  return annotateCompletionWithScheduleCredit(
    completion,
    getBlockScheduleState({ block, completions: [completion], today })
  );
}

function playablePlan(block: MovementBlock, today: string): HaleSessionPlan {
  const result = planTodayHaleSession({
    activeBlock: block,
    safetyProfile: safety(),
    training: defaultTrainingState(),
    lifeGoal: lifeGoal(),
    recentCompletions: [],
    today,
  });
  const plan = sessionPlanFromPlanningResult(result);
  if (!plan) throw new Error(`Expected playable plan, got ${result.kind}`);
  return plan;
}

function assessmentForScore(
  inputScore: CheckUpScore,
  options: {
    type?: CheckupType;
    sourceBlockId?: string;
    activeFocusDomain?: Domain | null;
    checkUpId?: string;
  } = {}
): AssessmentFixture {
  const scoreWithId = { ...inputScore, startedAt: options.checkUpId ?? inputScore.startedAt };
  const scoreSnapshot = toStoredScoreSnapshot(scoreWithId, {
    createdAt: scoreWithId.startedAt,
    sourceCheckUpId: scoreWithId.startedAt,
    activeFocusDomain: options.activeFocusDomain,
  });
  if (!scoreSnapshot) throw new Error('expected score snapshot');
  const parsed = parseStoredScoreSnapshot(scoreSnapshot);
  if (!parsed.ok) throw new Error('expected parsable score snapshot');
  const assessment = createMovementAssessment({
    checkUpId: scoreWithId.startedAt,
    type: options.type ?? 'baseline',
    score: parsed.score,
    scoreSnapshot: parsed.snapshot,
    sourceBlockId: options.sourceBlockId,
    completedAt: scoreWithId.startedAt,
    isOfficialForProgress: true,
  });
  return { score: parsed.score, scoreSnapshot: parsed.snapshot, assessment };
}

function lifecycleCases(): LifecycleCase[] {
  return [
    {
      name: 'strength clear focus',
      baseline: assessmentForScore(scoreForFocus('strength_power')),
      retest: assessmentForScore(scoreForFocus('strength_power', RETEST_DUE), { type: 'official_retest', checkUpId: RETEST_DUE }),
      expectedInitialFocus: 'strength_power',
      expectedInitialOrigin: 'clear',
      expectedNextFocus: 'strength_power',
      expectedNextOrigin: 'clear',
    },
    {
      name: 'balance clear focus',
      baseline: assessmentForScore(scoreForFocus('balance')),
      retest: assessmentForScore(scoreForFocus('balance', RETEST_DUE), { type: 'official_retest', checkUpId: RETEST_DUE }),
      expectedInitialFocus: 'balance',
      expectedInitialOrigin: 'clear',
      expectedNextFocus: 'balance',
      expectedNextOrigin: 'clear',
    },
    {
      name: 'mobility clear focus',
      baseline: assessmentForScore(scoreForFocus('mobility')),
      retest: assessmentForScore(scoreForFocus('mobility', RETEST_DUE), { type: 'official_retest', checkUpId: RETEST_DUE }),
      expectedInitialFocus: 'mobility',
      expectedInitialOrigin: 'clear',
      expectedNextFocus: 'mobility',
      expectedNextOrigin: 'clear',
    },
    {
      name: 'exact tie baseline deterministic fallback',
      baseline: assessmentForScore(score({ strength: 76, balance: 76, mobility: 58 }, 'strength')),
      retest: assessmentForScore(scoreForFocus('strength_power', RETEST_DUE), { type: 'official_retest', checkUpId: RETEST_DUE }),
      expectedInitialFocus: 'strength_power',
      expectedInitialOrigin: 'exact_tie_fallback',
      expectedNextFocus: 'strength_power',
      expectedNextOrigin: 'clear',
    },
    {
      name: 'exact tie retest preserves current focus',
      baseline: assessmentForScore(scoreForFocus('balance')),
      retest: assessmentForScore(score({ strength: 58, balance: 76, mobility: 76 }, 'balance'), {
        type: 'official_retest',
        checkUpId: RETEST_DUE,
        activeFocusDomain: 'balance',
      }),
      expectedInitialFocus: 'balance',
      expectedInitialOrigin: 'clear',
      expectedNextFocus: 'balance',
      expectedNextOrigin: 'exact_tie_preserved',
    },
    {
      name: 'near tie baseline interim fallback',
      baseline: assessmentForScore(score({ strength: 76, balance: 72, mobility: 58 }, 'strength')),
      retest: assessmentForScore(scoreForFocus('strength_power', RETEST_DUE), { type: 'official_retest', checkUpId: RETEST_DUE }),
      expectedInitialFocus: 'strength_power',
      expectedInitialOrigin: 'near_tie_fallback',
      expectedNextFocus: 'strength_power',
      expectedNextOrigin: 'clear',
    },
    {
      name: 'near tie retest preserves current focus',
      baseline: assessmentForScore(scoreForFocus('mobility')),
      retest: assessmentForScore(score({ strength: 60, balance: 72, mobility: 76 }, 'mobility'), {
        type: 'official_retest',
        checkUpId: RETEST_DUE,
        activeFocusDomain: 'mobility',
      }),
      expectedInitialFocus: 'mobility',
      expectedInitialOrigin: 'clear',
      expectedNextFocus: 'mobility',
      expectedNextOrigin: 'near_tie_preserved',
    },
  ];
}

function scoreForFocus(focus: MovementDomain, startedAt = START): CheckUpScore {
  return score(
    {
      strength: focus === 'strength_power' ? 78 : 58,
      balance: focus === 'balance' ? 78 : 57,
      mobility: focus === 'mobility' ? 78 : 56,
    },
    scoreDomainForMovement(focus),
    startedAt
  );
}

function score(
  midpoints: Record<Domain, number>,
  weakestDomain: Domain | null,
  startedAt = START
): CheckUpScore {
  return {
    startedAt,
    weakestDomain,
    domains: [
      domainResult('strength', midpoints.strength),
      domainResult('balance', midpoints.balance),
      domainResult('mobility', midpoints.mobility),
    ],
  };
}

function domainResult(domain: Domain, age: number): DomainResult {
  return {
    domain,
    label: domain,
    measured: true,
    ageLow: age - 2,
    ageHigh: age + 2,
    estimated: false,
    interpretation: 'Measured.',
    rows: [],
    primaryMetricValue: age,
  };
}

function originFromBlock(block: MovementBlock): FocusOrigin {
  if (block.focusSelectionKind === 'exact_tie' && block.focusTieBreakReason === 'preserve_current_focus') {
    return 'exact_tie_preserved';
  }
  if (block.focusSelectionKind === 'exact_tie') return 'exact_tie_fallback';
  if (block.focusSelectionKind === 'near_tie' && block.focusTieBreakReason === 'near_tie_preserve_current_focus') {
    return 'near_tie_preserved';
  }
  if (block.focusSelectionKind === 'near_tie') return 'near_tie_fallback';
  return 'clear';
}

function scoreDomainForMovement(domain: MovementDomain): Domain {
  return domain === 'strength_power' ? 'strength' : domain;
}

function blockForScenario(focus: MovementDomain, origin: 'clear' | 'exact_tie_fallback' | 'near_tie_fallback', index: number): MovementBlock {
  const startedAt = addDaysIso(START, index * 40);
  const fixture =
    origin === 'exact_tie_fallback'
      ? assessmentForScore(score({ strength: 76, balance: 76, mobility: 58 }, 'strength', startedAt))
      : origin === 'near_tie_fallback'
        ? assessmentForScore(score({ strength: 76, balance: 72, mobility: 58 }, 'strength', startedAt))
        : assessmentForScore(scoreForFocus(focus, startedAt));
  return createMovementBlockFromAssessment({
    latestAssessment: {
      score: fixture.score,
      scoreSnapshot: fixture.scoreSnapshot,
      assessment: fixture.assessment,
      sourceCheckUpId: fixture.score.startedAt,
    },
    lifeGoal: lifeGoal(startedAt),
    startDate: startedAt,
  });
}

interface ReferenceModel {
  applyCredit(completion: TrainingSessionCompletion): void;
  expectedStatus(today: string): string;
  expectedNextTemplate(): string | undefined;
}

function createReferenceModel(block: MovementBlock): ReferenceModel {
  const required = ['A', 'B', 'C'].map((label) => `${templatePrefix(requireFocusedBlockDomain(block))}-${label}`);
  const credits: TrainingSessionCompletion[] = [];
  return {
    applyCredit(completion) {
      credits.push(completion);
    },
    expectedStatus(today) {
      if (credits.length >= 12) {
        return blockScheduleDateKey(today)! >= '2026-06-29' ? 'retest_due' : 'training_complete_waiting_retest';
      }
      if (credits.length > 0 && credits.length % 3 === 0) return 'week_complete_waiting';
      return 'session_due';
    },
    expectedNextTemplate() {
      if (credits.length >= 12) return undefined;
      if (credits.length > 0 && credits.length % 3 === 0) return undefined;
      return required[credits.length % 3];
    },
  };
}

type PairwiseScenario = {
  focus: MovementDomain;
  focusOrigin: 'clear' | 'exact_tie_fallback' | 'near_tie_fallback';
  weekTemplate: 'week 1 A' | 'week 2 B' | 'week 4 C';
  equipment:
    | 'explicit none'
    | 'chair + wall'
    | 'band without anchor'
    | 'band + anchor'
    | 'stairs + support'
    | 'floor space'
    | 'full kit'
    | 'confirmation required'
    | 'stale plan after equipment change';
  dailyContext:
    | 'ready'
    | 'cautious'
    | 'short on time'
    | 'knee discomfort'
    | 'hip/back discomfort'
    | 'shoulder discomfort'
    | 'ankle/foot discomfort'
    | 'multiple discomfort areas'
    | 'malformed context';
  planResult:
    | 'ready'
    | 'supporting session'
    | 'unavailable'
    | 'week complete waiting'
    | 'restart'
    | 'training complete waiting'
    | 're-test due';
  resultEvidence:
    | 'full primary completion'
    | 'partial with one primary'
    | 'supporting-only'
    | 'fallback-only'
    | 'all skipped'
    | 'missing result'
    | 'duplicate result'
    | 'malformed result';
  persistence:
    | 'clean local'
    | 'app restart before feedback'
    | 'app restart after feedback'
    | 'offline completion'
    | 'sync retry'
    | 'duplicate local/remote row'
    | 'stale remote training state'
    | 'reordered restore'
    | 'malformed remote field';
};

const PAIRWISE_SCENARIOS: PairwiseScenario[] = [
  {
    focus: 'strength_power',
    focusOrigin: 'clear',
    weekTemplate: 'week 1 A',
    equipment: 'chair + wall',
    dailyContext: 'ready',
    planResult: 'ready',
    resultEvidence: 'full primary completion',
    persistence: 'clean local',
  },
  {
    focus: 'balance',
    focusOrigin: 'clear',
    weekTemplate: 'week 2 B',
    equipment: 'full kit',
    dailyContext: 'cautious',
    planResult: 'ready',
    resultEvidence: 'partial with one primary',
    persistence: 'offline completion',
  },
  {
    focus: 'mobility',
    focusOrigin: 'clear',
    weekTemplate: 'week 4 C',
    equipment: 'floor space',
    dailyContext: 'short on time',
    planResult: 'restart',
    resultEvidence: 'supporting-only',
    persistence: 'app restart before feedback',
  },
  {
    focus: 'strength_power',
    focusOrigin: 'exact_tie_fallback',
    weekTemplate: 'week 1 A',
    equipment: 'explicit none',
    dailyContext: 'knee discomfort',
    planResult: 'unavailable',
    resultEvidence: 'fallback-only',
    persistence: 'sync retry',
  },
  {
    focus: 'balance',
    focusOrigin: 'exact_tie_fallback',
    weekTemplate: 'week 2 B',
    equipment: 'band without anchor',
    dailyContext: 'hip/back discomfort',
    planResult: 'supporting session',
    resultEvidence: 'all skipped',
    persistence: 'duplicate local/remote row',
  },
  {
    focus: 'mobility',
    focusOrigin: 'exact_tie_fallback',
    weekTemplate: 'week 4 C',
    equipment: 'band + anchor',
    dailyContext: 'shoulder discomfort',
    planResult: 'week complete waiting',
    resultEvidence: 'missing result',
    persistence: 'stale remote training state',
  },
  {
    focus: 'strength_power',
    focusOrigin: 'near_tie_fallback',
    weekTemplate: 'week 1 A',
    equipment: 'stairs + support',
    dailyContext: 'ankle/foot discomfort',
    planResult: 'ready',
    resultEvidence: 'duplicate result',
    persistence: 'reordered restore',
  },
  {
    focus: 'balance',
    focusOrigin: 'near_tie_fallback',
    weekTemplate: 'week 2 B',
    equipment: 'confirmation required',
    dailyContext: 'multiple discomfort areas',
    planResult: 'unavailable',
    resultEvidence: 'malformed result',
    persistence: 'malformed remote field',
  },
  {
    focus: 'mobility',
    focusOrigin: 'near_tie_fallback',
    weekTemplate: 'week 4 C',
    equipment: 'stale plan after equipment change',
    dailyContext: 'malformed context',
    planResult: 're-test due',
    resultEvidence: 'full primary completion',
    persistence: 'app restart after feedback',
  },
  {
    focus: 'strength_power',
    focusOrigin: 'clear',
    weekTemplate: 'week 4 C',
    equipment: 'full kit',
    dailyContext: 'ready',
    planResult: 'training complete waiting',
    resultEvidence: 'full primary completion',
    persistence: 'clean local',
  },
];

function coverageTracker() {
  return {
    focus: new Set<unknown>(),
    focusOrigin: new Set<unknown>(),
    weekTemplate: new Set<unknown>(),
    equipment: new Set<unknown>(),
    dailyContext: new Set<unknown>(),
    planResult: new Set<unknown>(),
    resultEvidence: new Set<unknown>(),
    persistence: new Set<unknown>(),
  };
}

function expectCoverage(coverage: ReturnType<typeof coverageTracker>): void {
  expect(Array.from(coverage.focus).sort()).toEqual(['balance', 'mobility', 'strength_power']);
  expect(Array.from(coverage.focusOrigin).sort()).toEqual(['clear', 'exact_tie_fallback', 'near_tie_fallback']);
  expect(coverage.weekTemplate.size).toBe(3);
  expect(coverage.equipment.size).toBe(9);
  expect(coverage.dailyContext.size).toBe(9);
  expect(coverage.planResult.size).toBe(7);
  expect(coverage.resultEvidence.size).toBe(8);
  expect(coverage.persistence.size).toBe(9);
}

function seedPriorCredits(
  state: AdherenceStoreState,
  block: MovementBlock,
  scenario: Pick<PairwiseScenario, 'weekTemplate' | 'planResult'>
): AdherenceStoreState {
  const count =
    scenario.planResult === 're-test due' || scenario.planResult === 'training complete waiting'
      ? 12
      : scenario.planResult === 'week complete waiting'
        ? 3
        : scenario.weekTemplate === 'week 1 A'
          ? 0
          : scenario.weekTemplate === 'week 2 B'
            ? 4
            : 11;
  let next = state;
  for (let index = 0; index < count; index += 1) {
    const template = `${templatePrefix(requireFocusedBlockDomain(block))}-${(['A', 'B', 'C'] as const)[index % 3]}`;
    const completedAt = SESSION_DATES[index];
    const completion = syntheticCreditedCompletion(block, template, completedAt);
    next = recordTrainingSessionCompletion(next, completion);
  }
  return next;
}

function seedTrainingSummaries(
  training: TrainingState,
  block: MovementBlock,
  completions: readonly TrainingSessionCompletion[]
): TrainingState {
  let summaries = training.generatedSessionSummaries;
  for (const completion of completions) {
    summaries = upsertGeneratedSessionSummary(summaries, syntheticGeneratedSummary(block, completion));
  }
  return { ...training, generatedSessionSummaries: summaries };
}

function syntheticCreditedCompletion(block: MovementBlock, templateId: string, completedAt: string): TrainingSessionCompletion {
  return makeTrainingSessionCompletion({
    block,
    sessionType: 'standard',
    completedAt,
    plannedDate: `${templateId}:${completedAt.slice(0, 10)}`,
    source: 'block_generated',
    templateId,
    mainPlanCredit: true,
    scheduleCredit: {
      policyVersion: BLOCK_SCHEDULE_POLICY_VERSION,
      credited: true,
      status: 'credited',
      weekIndex: Math.floor(SESSION_DATES.indexOf(completedAt as never) / 3),
      weekNumber: Math.floor(SESSION_DATES.indexOf(completedAt as never) / 3) + 1,
      dateKey: completedAt.slice(0, 10),
      templateId,
      creditId: `${templateId}:${completedAt.slice(0, 10)}`,
    },
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
    focusStimulusEvidence: creditedFocusEvidence(block),
  });
}

function scheduledCompletions(block: MovementBlock): TrainingSessionCompletion[] {
  return SESSION_DATES.map((date, index) =>
    syntheticCreditedCompletion(block, `${templatePrefix(requireFocusedBlockDomain(block))}-${(['A', 'B', 'C'] as const)[index % 3]}`, date)
  );
}

function syntheticGeneratedSummary(
  block: MovementBlock,
  completion: TrainingSessionCompletion
): PersistedGeneratedSessionSummary {
  return {
    id: `summary-${completion.id}`,
    blockId: block.id,
    source: 'block_generated',
    templateId: completion.templateId,
    plannedDateKey: completion.plannedDate,
    sessionType: completion.sessionType,
    completionSource: 'block_generated',
    status: 'completed',
    mainPlanCredit: true,
    scheduleCredit: completion.scheduleCredit,
    workEvidence: completion.workEvidence,
    focusStimulusEvidence: completion.focusStimulusEvidence,
    title: 'Synthetic session',
    focus: block.focusDomain,
    completedAt: completion.completedAt,
    exerciseIds: ['synthetic-primary'],
  };
}

function creditedFocusEvidence(block: MovementBlock): TrainingFocusStimulusEvidenceSummary {
  return {
    planStatus: 'eligible',
    status: 'credited_focus_work',
    exclusionReason: 'none',
    mainPlanCredit: true,
    blockFocusDomain: block.focusDomain,
    plannedPrimaryFocusExerciseCount: 1,
    completedPrimaryFocusExerciseCount: 1,
    completedSupportingExerciseCount: 0,
    completedFallbackExerciseCount: 0,
    completedCrossDomainExerciseCount: 0,
    plannedPrimaryFocusExerciseIds: ['synthetic-primary'],
    completedPrimaryFocusExerciseIds: ['synthetic-primary'],
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

function dateForWeekTemplate(target: PairwiseScenario['weekTemplate']): string {
  if (target === 'week 1 A') return SESSION_DATES[0];
  if (target === 'week 2 B') return SESSION_DATES[4];
  return SESSION_DATES[11];
}

function dateForScenario(scenario: Pick<PairwiseScenario, 'weekTemplate' | 'planResult'>): string {
  if (scenario.planResult === 're-test due') return RETEST_DUE;
  if (scenario.planResult === 'week complete waiting') return '2026-06-04T09:00:00.000Z';
  return dateForWeekTemplate(scenario.weekTemplate);
}

function safetyForEquipment(equipment: PairwiseScenario['equipment'] | 'full kit' | 'chair + wall' | 'explicit none' | 'confirmation required'): MovementSafetyProfile {
  if (equipment === 'explicit none') return safety({ equipment: ['none'] });
  if (equipment === 'chair + wall') return safety({ equipment: ['chair', 'wall'] });
  if (equipment === 'band without anchor') return safety({ equipment: ['chair', 'wall', 'resistance_band'] });
  if (equipment === 'band + anchor') return safety({ equipment: ['chair', 'wall', 'resistance_band', 'door_anchor'] });
  if (equipment === 'stairs + support') return safety({ equipment: ['chair', 'wall', 'stairs'] });
  if (equipment === 'floor space') return safety({ equipment: ['chair', 'wall', 'floor_space'] });
  if (equipment === 'confirmation required') return safety({ status: 'needs_confirmation' });
  return safety();
}

function safety(input: {
  equipment?: AvailableEquipment[];
  status?: MovementSafetyProfile['equipmentStatus'];
  revision?: number;
  updatedAt?: string;
} = {}): MovementSafetyProfile {
  return {
    id: 'stage-5h-safety',
    userId: 'local-device-user',
    age: 61,
    activityLevel: 'lightly_active',
    feelsSafeStandingFromChair: true,
    feelsSafeBalancing: true,
	    availableEquipment: input.equipment ?? ['chair', 'wall', 'resistance_band', 'door_anchor', 'stairs', 'floor_space'],
	    equipmentStatus: input.status ?? 'confirmed',
	    equipmentRevision: input.revision ?? 1,
	    equipmentUpdatedAt: input.updatedAt ?? START,
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
	      revision: input.revision ?? 1,
	      updatedAt: input.updatedAt ?? START,
	    },
	    preferredWorkoutDays: ['Mon', 'Wed', 'Fri'],
    createdAt: START,
    updatedAt: input.updatedAt ?? START,
  };
}

function profile(): UserProfile {
  return {
    ...defaultPreferences().profile,
    name: 'Sam',
    age: 61,
    lifeGoal: lifeGoal(),
    safetyProfile: safety(),
  };
}

function emptyLocalState() {
  return {
    preferences: defaultPreferences(),
    history: [],
    training: defaultTrainingState(),
    microChecks: [],
    adherence: defaultAdherenceStoreState(),
  };
}

function lifeGoal(nowIso = START) {
  return createLifeGoal({ category: 'stairs_walks', nowIso });
}

function readinessForScenario(context: PairwiseScenario['dailyContext']) {
  if (context === 'short on time') return 'short_on_time' as const;
  if (context === 'cautious') return 'low_energy' as const;
  if (context === 'malformed context') return undefined;
  if (context.includes('discomfort')) return 'something_hurts' as const;
  return 'ready' as const;
}

function painAreasForScenario(context: PairwiseScenario['dailyContext']) {
  if (context === 'knee discomfort') return ['knee'] as const;
  if (context === 'hip/back discomfort') return ['hip', 'back'] as const;
  if (context === 'shoulder discomfort') return ['shoulder'] as const;
  if (context === 'ankle/foot discomfort') return ['ankle'] as const;
  if (context === 'multiple discomfort areas') return ['knee', 'shoulder', 'back'] as const;
  return [] as const;
}

function templatePrefix(domain: MovementDomain): 'strength' | 'balance' | 'mobility' {
  if (domain === 'balance') return 'balance';
  if (domain === 'mobility') return 'mobility';
  return 'strength';
}

function requireFocusedBlockDomain(block: MovementBlock): MovementDomain {
  if (!block.focusDomain) throw new Error(`Expected focused block fixture: ${block.id}`);
  return block.focusDomain;
}

function workSummary(work: ReturnType<typeof evaluateSessionWorkEvidence>): TrainingSessionWorkEvidenceSummary {
  return {
    plannedExerciseCount: work.plannedExerciseCount,
    resultItemCount: work.resultItemCount,
    completedExerciseCount: work.completedExerciseCount,
    skippedExerciseCount: work.skippedExerciseCount,
    missingResultCount: work.missingResultCount,
    duplicateResultCount: work.duplicateResultCount,
    malformedResultCount: work.malformedResultCount,
    unmatchedResultCount: work.unmatchedResultCount,
  };
}

function projectPlanningResult(result: ReturnType<typeof planTodayHaleSession>) {
  if (result.kind === 'ready' || result.kind === 'supporting_session') {
    return {
      kind: result.kind,
      id: result.plan.id,
      templateId: result.plan.metadata?.templateId,
      plannedDateKey: result.plan.metadata?.plannedDateKey,
      exercises: result.plan.exercises.map((exercise) => exercise.id),
      snapshot: result.plan.metadata?.equipmentSnapshot?.fingerprint,
    };
  }
  return result;
}

function addDaysIso(iso: string, days: number): string {
  const date = new Date(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function lcg(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function pick<T extends readonly unknown[]>(rng: () => number, values: T): T[number] {
  return values[Math.floor(rng() * values.length)] as T[number];
}

function memoryHistoryFs(initial: readonly string[]) {
  const files = new Set(initial);
  return {
    list: () => Array.from(files),
    read: async () => null,
    write: async (name: string) => {
      files.add(name);
    },
    delete: (name: string) => {
      files.delete(name);
    },
  };
}

function memoryArea(initial: readonly string[]) {
  const files = new Set(initial);
  return {
    list: () => Array.from(files),
    delete: (name: string) => {
      files.delete(name);
    },
  };
}
