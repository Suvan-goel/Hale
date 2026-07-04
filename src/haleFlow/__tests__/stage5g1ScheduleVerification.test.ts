import { getRetestDueSummary } from '../testing/legacyProgressSummaryFixture';
import { createMovementBlockReport } from '../testing/legacyBlockReportFixture';
import {
  blockProgress,
  createLifeGoal,
  createMovementBlockFromAssessment,
  defaultAdherenceStoreState,
  deserializeAdherenceState,
  generateMilestones,
  makeTrainingSessionCompletion,
  markMovementBlockComplete,
  mergeMilestones,
  recordTrainingSessionCompletion,
  serializeAdherenceState,
  upsertMovementAssessment,
  upsertMovementBlock,
  upsertMovementBlockReport,
  type AdherenceStoreState,
  type MovementAssessment,
  type MovementBlock,
  type MovementSafetyProfile,
  type TrainingFocusStimulusEvidenceSummary,
  type TrainingSessionCompletion,
  type TrainingSessionWorkEvidenceSummary,
} from '../../adherence';
import { legacySyntheticCheckUp as syntheticCheckUp } from '../../checkup/testing/legacyCheckUpFixture';
import { defaultPreferences, type UserProfile } from '../../profile';
import { createCurrentVersionedScoreSnapshot, type CheckUpScore } from '../../scoring';
import {
  defaultTrainingState,
  deserializeTrainingState,
  serializeTrainingState,
  type TrainingSessionResult,
  type TrainingState,
} from '../../training';
import {
  addBlockScheduleDays,
  annotateCompletionWithScheduleCredit,
  blockScheduleDateKey,
  checkUpCompletionTimestamp,
  createGeneratedSessionSummary,
  createMovementAssessment,
  daysBetweenBlockScheduleDates,
  getBlockScheduleState,
  getHaleAppLifecycle,
  getManualCheckupOptions,
  scheduleCreditForCompletion,
} from '..';
import { evaluateCompletedFocusStimulusEvidence, focusStimulusEvidenceSummary } from '../focusStimulusEvidence';
import { evaluateSessionWorkEvidence } from '../sessionWorkEvidence';
import { applyProgressionEvidenceFromSession } from '../progressionEvidence';
import { planTodayHaleSession, requireHaleSessionPlan } from '../sessionPlanning';
import type { HaleSessionPlan } from '../types';

const START = '2026-06-01T08:00:00.000Z';
const BASELINE_CHECKUP_ID = '2026-06-01T07:30:00.000Z';

describe('Stage 5G.1 date-key utilities', () => {
  it('uses deterministic calendar date keys and fails closed for malformed dates', () => {
    const date = new Date('2026-03-08T12:00:00.000Z');
    const before = date.getTime();

    expect(blockScheduleDateKey('2026-06-01T08:00:00.000Z')).toBe('2026-06-01');
    expect(blockScheduleDateKey('2026-03-08T01:30:00-05:00')).toBe('2026-03-08');
    expect(blockScheduleDateKey('2026-11-01T01:30:00-04:00')).toBe('2026-11-01');
    expect(blockScheduleDateKey(date)).toBe('2026-03-08');
    expect(date.getTime()).toBe(before);

    expect(blockScheduleDateKey('2026-13-01')).toBeNull();
    expect(blockScheduleDateKey('2026-04-31')).toBeNull();
    expect(blockScheduleDateKey('2025-02-29')).toBeNull();
    expect(blockScheduleDateKey('not a date')).toBeNull();
  });

  it('does calendar arithmetic across month, year, leap, DST, and negative differences', () => {
    expect(addBlockScheduleDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addBlockScheduleDays('2026-04-30', 1)).toBe('2026-05-01');
    expect(addBlockScheduleDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addBlockScheduleDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addBlockScheduleDays('2028-02-29', 1)).toBe('2028-03-01');
    expect(addBlockScheduleDays('2026-03-08', 1)).toBe('2026-03-09');
    expect(addBlockScheduleDays('2026-11-01', 1)).toBe('2026-11-02');
    expect(addBlockScheduleDays('2026-02-29', 1)).toBeNull();

    expect(daysBetweenBlockScheduleDates('2026-06-01', '2026-06-01')).toBe(0);
    expect(daysBetweenBlockScheduleDates('2026-06-01', '2026-06-08')).toBe(7);
    expect(daysBetweenBlockScheduleDates('2026-06-08', '2026-06-01')).toBe(-7);
    expect(daysBetweenBlockScheduleDates('2026-12-31', '2027-01-01')).toBe(1);
    expect(daysBetweenBlockScheduleDates('bad', '2026-06-01')).toBeNull();
  });
});

describe('Stage 5G.1 four-week scheduler', () => {
  it('derives A/B/C coverage, waiting states, late unlocks, and re-test timing from events', () => {
    const block = movementBlock();
    const weekOne = [
      completion(block, 'strength-A', '2026-06-01T09:00:00.000Z', { id: 'w1-a' }),
      completion(block, 'strength-C', '2026-06-03T09:00:00.000Z', { id: 'w1-c' }),
    ];
    expect(getBlockScheduleState({ block, completions: [], today: '2026-06-02T08:00:00.000Z' })).toMatchObject({
      status: 'session_due',
      currentWeekNumber: 1,
      currentWeekStartDateKey: '2026-06-01',
      nextTemplateId: 'strength-A',
      totalCredits: 0,
    });
    expect(getBlockScheduleState({ block, completions: weekOne, today: '2026-06-04T08:00:00.000Z' })).toMatchObject({
      status: 'session_due',
      creditedTemplateIds: ['strength-A', 'strength-C'],
      nextTemplateId: 'strength-B',
      totalCredits: 2,
    });

    const completedWeekOne = [...weekOne, completion(block, 'strength-B', '2026-06-04T09:00:00.000Z', { id: 'w1-b' })];
    expect(getBlockScheduleState({ block, completions: completedWeekOne, today: '2026-06-05T08:00:00.000Z' })).toMatchObject({
      status: 'week_complete_waiting',
      currentWeekNumber: 1,
      nextUnlockDateKey: '2026-06-08',
      totalCredits: 3,
    });
    expect(getBlockScheduleState({ block, completions: completedWeekOne, today: '2026-06-08T08:00:00.000Z' })).toMatchObject({
      status: 'session_due',
      currentWeekNumber: 2,
      currentWeekStartDateKey: '2026-06-08',
      nextTemplateId: 'strength-A',
    });

    const lateWeekOne = [
      completion(block, 'strength-A', '2026-06-01T09:00:00.000Z', { id: 'late-w1-a' }),
      completion(block, 'strength-B', '2026-06-10T09:00:00.000Z', { id: 'late-w1-b' }),
      completion(block, 'strength-C', '2026-06-11T09:00:00.000Z', { id: 'late-w1-c' }),
      completion(block, 'strength-A', '2026-06-11T10:00:00.000Z', { id: 'too-early-w2-a' }),
      completion(block, 'strength-A', '2026-06-12T09:00:00.000Z', { id: 'w2-a-after-late' }),
    ];
    const lateSchedule = getBlockScheduleState({ block, completions: lateWeekOne, today: '2026-06-12T12:00:00.000Z' });
    expect(lateSchedule.currentWeekNumber).toBe(2);
    expect(lateSchedule.weeks[0].nextUnlockDateKey).toBe('2026-06-12');
    expect(lateSchedule.creditedTemplateIds).toEqual(['strength-A']);
    expect(lateSchedule.diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ eventId: 'too-early-w2-a', reason: 'week_locked_until_next_start' })])
    );

    const fullEarly = [
      ...weekCredits(block, 1, '2026-06-01'),
      ...weekCredits(block, 2, '2026-06-08'),
      ...weekCredits(block, 3, '2026-06-15'),
      ...weekCredits(block, 4, '2026-06-22'),
    ];
    expect(getBlockScheduleState({ block, completions: fullEarly, today: '2026-06-24T12:00:00.000Z' })).toMatchObject({
      status: 'training_complete_waiting_retest',
      currentWeekNumber: 4,
      totalCredits: 12,
      lastCreditDateKey: '2026-06-24',
      retestNotBeforeDateKey: '2026-06-29',
    });
    expect(getBlockScheduleState({ block, completions: fullEarly, today: '2026-06-29T08:00:00.000Z' }).status).toBe('retest_due');

    const lateFinal = [
      ...weekCredits(block, 1, '2026-06-01'),
      ...weekCredits(block, 2, '2026-06-08'),
      ...weekCredits(block, 3, '2026-06-15'),
      completion(block, 'strength-A', '2026-06-22T09:00:00.000Z', { id: 'late-final-a' }),
      completion(block, 'strength-B', '2026-06-24T09:00:00.000Z', { id: 'late-final-b' }),
      completion(block, 'strength-C', '2026-06-29T09:00:00.000Z', { id: 'late-final-c' }),
    ];
    expect(getBlockScheduleState({ block, completions: lateFinal, today: '2026-06-29T12:00:00.000Z' })).toMatchObject({
      status: 'training_complete_waiting_retest',
      retestNotBeforeDateKey: '2026-06-30',
    });
    expect(getBlockScheduleState({ block, completions: lateFinal, today: '2026-06-30T08:00:00.000Z' }).status).toBe('retest_due');
    expect(getBlockScheduleState({ block, completions: fullEarly.slice(0, 11), today: '2026-06-29T08:00:00.000Z' })).toMatchObject({
      status: 'session_due',
      totalCredits: 11,
      nextTemplateId: 'strength-C',
    });
  });

  it('rejects wrong, malformed, pre-block, future, duplicate, and stale cached evidence', () => {
    const block = movementBlock({ completedSessions: 12, status: 'completed' });
    const validA = completion(block, 'strength-A', '2026-06-01T09:00:00.000Z', { id: 'valid-a' });
    const duplicateA = completion(block, 'strength-A', '2026-06-02T09:00:00.000Z', { id: 'duplicate-a' });
    const wrongBlock = completion({ ...block, id: 'other-block' }, 'strength-B', '2026-06-02T09:00:00.000Z', { id: 'wrong-block' });
    const unknownTemplate = completion(block, 'strength-Z', '2026-06-03T09:00:00.000Z', { id: 'unknown-template' });
    const future = completion(block, 'strength-B', '2026-06-09T09:00:00.000Z', { id: 'future-b' });
    const preBlock = completion(block, 'strength-B', '2026-05-31T09:00:00.000Z', { id: 'pre-block-b' });
    const malformed = completion(block, 'strength-B', 'bad-date', { id: 'malformed-b' });
    const schedule = getBlockScheduleState({
      block,
      completions: [future, wrongBlock, unknownTemplate, preBlock, malformed, duplicateA, validA],
      today: '2026-06-04T08:00:00.000Z',
    });

    expect(schedule.status).toBe('session_due');
    expect(schedule.totalCredits).toBe(1);
    expect(schedule.nextTemplateId).toBe('strength-B');
    expect(schedule.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ eventId: duplicateA.id, reason: 'template_already_credited_for_week' }),
        expect.objectContaining({ eventId: unknownTemplate.id, reason: 'main_plan_rejected', rejectedReason: 'invalid_template' }),
        expect.objectContaining({ eventId: future.id, reason: 'future_completion' }),
        expect.objectContaining({ eventId: preBlock.id, reason: 'pre_block_completion' }),
        expect.objectContaining({ eventId: malformed.id, reason: 'malformed_completion_date' }),
      ])
    );
  });
});

describe('Stage 5G.1 same-date resolution and completion integration', () => {
  it('dedupes duplicate representations and resolves same-date winners stably', () => {
    const block = movementBlock();
    const a = completion(block, 'strength-A', '2026-06-01T09:00:00.000Z', { id: 'completion-a' });
    const duplicateSummary = generatedSummaryFor(a, 'summary-a-duplicate');
    const duplicateSchedule = getBlockScheduleState({
      block,
      completions: [a],
      generatedSessionSummaries: [duplicateSummary],
      today: '2026-06-02T08:00:00.000Z',
    });
    expect(duplicateSchedule.totalCredits).toBe(1);
    expect(duplicateSchedule.diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ eventId: 'summary-a-duplicate', reason: 'duplicate_event' })])
    );

    const sameTimestampB = completion(block, 'strength-B', '2026-06-02T09:00:00.000Z', { id: '01-b' });
    const sameTimestampC = completion(block, 'strength-C', '2026-06-02T09:00:00.000Z', { id: '02-c' });
    const schedule = getBlockScheduleState({
      block,
      completions: [sameTimestampC, a, sameTimestampB],
      today: '2026-06-03T08:00:00.000Z',
    });
    expect(schedule.totalCredits).toBe(2);
    expect(schedule.creditedTemplateIds).toEqual(['strength-A', 'strength-B']);
    expect(schedule.diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ eventId: sameTimestampC.id, reason: 'daily_credit_already_used' })])
    );

    const reversed = getBlockScheduleState({
      block,
      completions: [sameTimestampB, sameTimestampC, a].reverse(),
      today: '2026-06-03T08:00:00.000Z',
    });
    expect(scheduleFingerprint(reversed)).toEqual(scheduleFingerprint(schedule));
  });

  it('lets a same-day valid retry earn credit after a non-credit attempt', () => {
    const block = movementBlock();
    const zeroWork = annotateAgainstSchedule(block, [], nonCreditCompletion(block, 'zero-work-a', 'no_completed_work'), '2026-06-01T09:00:00.000Z');
    const validA = completion(block, 'strength-A', '2026-06-01T11:00:00.000Z', { id: 'valid-a-retry' });
    const creditedA = annotateAgainstSchedule(block, [zeroWork], validA, '2026-06-01T11:00:00.000Z');

    let state = defaultAdherenceStoreState();
    state = recordTrainingSessionCompletion(state, zeroWork);
    state = recordTrainingSessionCompletion(state, creditedA);
    state = mergeMilestones(
      state,
      generateMilestones({ block, completions: state.completions, existing: state.milestones, nowIso: '2026-06-01T11:00:00.000Z' })
    );

    expect(zeroWork.scheduleCredit).toMatchObject({ credited: false, status: 'denied', reason: 'main_plan_rejected' });
    expect(creditedA.scheduleCredit).toMatchObject({ credited: true, weekNumber: 1, templateId: 'strength-A' });
    expect(getBlockScheduleState({ block, completions: state.completions, today: '2026-06-02T08:00:00.000Z' })).toMatchObject({
      totalCredits: 1,
      nextTemplateId: 'strength-B',
    });
    expect(blockProgress(block, state.completions).completedSessions).toBe(1);
    expect(state.milestones.map((milestone) => milestone.type)).not.toContain('first_week_completed');
  });

  it('preserves a same-day second valid session as history without schedule, milestone, retest, or progression advancement', () => {
    const block = movementBlock();
    const planA = requireHaleSessionPlan({ activeBlock: block, training: defaultTrainingState(), safetyProfile: safety(), today: START });
    const resultA = completedResult(planA);
    const baseA = completionForPlan(block, planA, resultA, '2026-06-01T09:00:00.000Z');
    const creditedA = annotateAgainstSchedule(block, [], baseA, baseA.completedAt);
    const planB = requireHaleSessionPlan({
      activeBlock: block,
      training: defaultTrainingState(),
      safetyProfile: safety(),
      recentCompletions: [creditedA],
      today: '2026-06-01T10:00:00.000Z',
    });
    const resultB = completedResult(planB);
    const baseB = completionForPlan(block, planB, resultB, '2026-06-01T11:00:00.000Z', { id: 'same-day-valid-b' });
    const deniedB = annotateAgainstSchedule(block, [creditedA], baseB, baseB.completedAt);
    let state = defaultAdherenceStoreState();
    state = recordTrainingSessionCompletion(state, creditedA);
    state = recordTrainingSessionCompletion(state, deniedB);
    const milestones = generateMilestones({ block, completions: state.completions, existing: [], nowIso: deniedB.completedAt });
    const progression = applyProgressionEvidenceFromSession({
      state: defaultTrainingState(),
      sessionPlan: planB,
      completion: deniedB,
      activeBlock: block,
      sessionResult: resultB,
      perceivedEffort: 2,
      painReported: false,
      trackingQuality: 'good',
    });
    const schedule = getBlockScheduleState({ block, completions: state.completions, today: '2026-06-02T08:00:00.000Z' });
    const retest = getRetestDueSummary({ activeBlock: block, today: '2026-06-29T08:00:00.000Z', hasBaseline: true, completions: state.completions });

    expect(state.completions.map((completion) => completion.id)).toEqual([creditedA.id, deniedB.id]);
    expect(deniedB.scheduleCredit).toMatchObject({ credited: false, reason: 'daily_credit_already_used' });
    expect(schedule.totalCredits).toBe(1);
    expect(schedule.creditedTemplateIds).toEqual(['strength-A']);
    expect(schedule.nextTemplateId).toBe('strength-B');
    expect(milestones.map((milestone) => milestone.type)).not.toContain('first_week_completed');
    expect(retest.due).toBe(false);
    expect(progression.eligibility).toEqual({ eligible: false, reason: 'schedule_denied' });
    expect(progression.appliedEvents).toHaveLength(0);
  });
});

describe('Stage 5G.1 lapse, restart, and re-test gates', () => {
  it('keeps lapse boundaries exact without resetting template coverage', () => {
    const block = movementBlock();
    const a = completion(block, 'strength-A', '2026-06-01T09:00:00.000Z', { id: 'lapse-a' });
    expect(getBlockScheduleState({ block, completions: [], today: '2026-06-01T12:00:00.000Z' }).lapseState).toBe('active');
    expect(getBlockScheduleState({ block, completions: [], today: '2026-06-07T12:00:00.000Z' }).lapseState).toBe('active');
    expect(getBlockScheduleState({ block, completions: [], today: '2026-06-08T12:00:00.000Z' }).lapseState).toBe('resume_gently');
    expect(getBlockScheduleState({ block, completions: [], today: '2026-06-14T12:00:00.000Z' }).lapseState).toBe('resume_gently');
    expect(getBlockScheduleState({ block, completions: [], today: '2026-06-15T12:00:00.000Z' }).lapseState).toBe('restart_recommended');
    expect(getBlockScheduleState({ block, completions: [a], today: '2026-06-15T12:00:00.000Z' })).toMatchObject({
      lapseState: 'restart_recommended',
      nextTemplateId: 'strength-B',
      creditedTemplateIds: ['strength-A'],
    });
    expect(getBlockScheduleState({ block, completions: [a], today: '2026-06-08T12:00:00.000Z' }).lapseState).toBe('resume_gently');
  });

  it('plans a restart for the current due template, credits it once, and keeps progression hold-only', () => {
    const block = movementBlock();
    const plan = requireHaleSessionPlan({
      activeBlock: block,
      training: defaultTrainingState(),
      safetyProfile: safety(),
      today: '2026-06-15T08:00:00.000Z',
    });
    const result = completedResult(plan);
    const base = completionForPlan(block, plan, result, '2026-06-15T09:00:00.000Z');
    const credited = annotateAgainstSchedule(block, [], base, base.completedAt);
    const after = getBlockScheduleState({ block, completions: [credited], today: '2026-06-16T08:00:00.000Z' });
    const duplicateState = recordTrainingSessionCompletion(recordTrainingSessionCompletion(defaultAdherenceStoreState(), credited), credited);
    const progression = applyProgressionEvidenceFromSession({
      state: defaultTrainingState(),
      sessionPlan: plan,
      completion: credited,
      activeBlock: block,
      sessionResult: result,
      perceivedEffort: 2,
      painReported: false,
      trackingQuality: 'good',
    });

    expect(plan.sessionType).toBe('restart');
    expect(plan.metadata?.source).toBe('block_generated');
    expect(plan.metadata?.templateId).toBe('strength-A');
    expect(plan.metadata?.schedule).toMatchObject({ weekNumber: 1, lapseState: 'restart_recommended', nextTemplateId: 'strength-A' });
    expect(plan.metadata?.progressionEvidencePolicy).toBe('hold_only');
    expect(credited.scheduleCredit).toMatchObject({ credited: true, weekNumber: 1, templateId: 'strength-A' });
    expect(after.nextTemplateId).toBe('strength-B');
    expect(after.totalCredits).toBe(1);
    expect(blockProgress(block, duplicateState.completions).completedSessions).toBe(1);
    expect(progression.eligibility).toMatchObject({ eligible: true, progressionEvidencePolicy: 'hold_only' });
    expect(progression.nextState.ladderProgressById).toEqual({});
  });

  it('routes day-7 clean slate sessions through restart while keeping non-credit restarts protected', () => {
    const block = movementBlock();
    const resumePlan = requireHaleSessionPlan({
      activeBlock: block,
      training: defaultTrainingState(),
      safetyProfile: safety(),
      today: '2026-06-08T08:00:00.000Z',
    });
    expect(resumePlan.sessionType).toBe('restart');

    const denied = [
      nonCreditCompletion(block, 'restart-supporting-only', 'primary_focus_not_completed', { sessionType: 'restart' }),
      nonCreditCompletion(block, 'restart-fallback-only', 'no_primary_focus_planned', { sessionType: 'restart' }),
      nonCreditCompletion(block, 'restart-zero-work', 'no_completed_work', { sessionType: 'restart' }),
    ];
    const schedule = getBlockScheduleState({ block, completions: denied, today: '2026-06-15T12:00:00.000Z' });
    expect(schedule.totalCredits).toBe(0);
    expect(schedule.nextTemplateId).toBe('strength-A');
    expect(schedule.diagnostics.filter((diagnostic) => diagnostic.reason === 'main_plan_rejected')).toHaveLength(3);
  });

  it('blocks official re-test from calendar age, incomplete training, same-date final training, and manual checks', () => {
    const block = movementBlock();
    const baseline = baselineAssessment(block);
    const incompleteOptions = getManualCheckupOptions({
      latestAssessment: baseline,
      activeBlock: block,
      completions: [],
      now: '2026-06-29T08:00:00.000Z',
    });
    expect(incompleteOptions.map((option) => option.type)).not.toContain('official_retest');
    expect(getHaleAppLifecycle({
      profile: profile(),
      history: [],
      training: defaultTrainingState(),
      adherence: { ...defaultAdherenceStoreState(), assessments: [baseline], blocks: [block], completions: [] },
      today: '2026-06-29T08:00:00.000Z',
    }).state).not.toBe('monthly_retest_due');

    const lateFinal = [
      ...weekCredits(block, 1, '2026-06-01'),
      ...weekCredits(block, 2, '2026-06-08'),
      ...weekCredits(block, 3, '2026-06-15'),
      completion(block, 'strength-A', '2026-06-22T09:00:00.000Z', { id: 'gate-w4-a' }),
      completion(block, 'strength-B', '2026-06-24T09:00:00.000Z', { id: 'gate-w4-b' }),
      completion(block, 'strength-C', '2026-06-29T09:00:00.000Z', { id: 'gate-w4-c' }),
    ];
    expect(getManualCheckupOptions({
      latestAssessment: baseline,
      activeBlock: block,
      completions: lateFinal,
      now: '2026-06-29T12:00:00.000Z',
    }).map((option) => option.type)).not.toContain('official_retest');
    const nextDayManualOptions = getManualCheckupOptions({
      latestAssessment: baseline,
      activeBlock: block,
      completions: lateFinal,
      now: '2026-06-30T08:00:00.000Z',
    });
    expect(nextDayManualOptions.map((option) => option.type)).toEqual(['micro_check', 'manual_extra_v2']);
    expect(nextDayManualOptions.map((option) => option.isOfficialForProgress)).toEqual([false, false]);
    expect(getHaleAppLifecycle({
      profile: profile(),
      history: [],
      training: defaultTrainingState(),
      adherence: { ...defaultAdherenceStoreState(), assessments: [baseline], blocks: [block], completions: lateFinal },
      today: '2026-06-30T08:00:00.000Z',
    }).state).toBe('monthly_retest_due');
  });
});

describe('Stage 5G.1 restore, stale cache, consumers, and retest transition idempotency', () => {
  it('keeps local serialize/restore schedule-equivalent for denied same-day evidence and generated-summary duplicates', () => {
    const block = movementBlock({ completedSessions: 12 });
    const a = annotateAgainstSchedule(block, [], completion(block, 'strength-A', '2026-06-01T09:00:00.000Z', { id: 'restore-a' }), '2026-06-01T09:00:00.000Z');
    const b = annotateAgainstSchedule(block, [a], completion(block, 'strength-B', '2026-06-01T11:00:00.000Z', { id: 'restore-b' }), '2026-06-01T11:00:00.000Z');
    const summaries = [generatedSummaryFor(b, 'restore-b-summary'), generatedSummaryFor(a, 'restore-a-summary')];
    const training: TrainingState = { ...defaultTrainingState(), generatedSessionSummaries: summaries };
    const adherence = { ...defaultAdherenceStoreState(), blocks: [block], completions: [b, a] };
    const before = getBlockScheduleState({
      block,
      completions: adherence.completions,
      generatedSessionSummaries: training.generatedSessionSummaries,
      today: '2026-06-02T08:00:00.000Z',
    });
    const restoredAdherence = deserializeAdherenceState(serializeAdherenceState(adherence));
    const restoredTraining = deserializeTrainingState(serializeTrainingState(training));
    if (!restoredAdherence || !restoredTraining) throw new Error('restore failed');
    const after = getBlockScheduleState({
      block: restoredAdherence.blocks[0],
      completions: restoredAdherence.completions,
      generatedSessionSummaries: restoredTraining.generatedSessionSummaries,
      today: '2026-06-02T08:00:00.000Z',
    });

    expect(scheduleFingerprint(after)).toEqual(scheduleFingerprint(before));
    expect(after.totalCredits).toBe(1);
    expect(after.nextTemplateId).toBe('strength-B');
    expect(restoredAdherence.completions.find((completion) => completion.id === b.id)?.scheduleCredit).toMatchObject({
      credited: false,
      reason: 'daily_credit_already_used',
    });
  });

  it('keeps stale counters, stale completed status, and stale retest flags from promoting progress', () => {
    const block = movementBlock({ completedSessions: 12, status: 'completed' });
    const schedule = getBlockScheduleState({ block, completions: [], today: '2026-06-29T08:00:00.000Z' });
    const staleRetestOnly = getBlockScheduleState({
      block,
      completions: [makeTrainingSessionCompletion({ block, sessionType: 'retest', completedAt: '2026-06-29T08:00:00.000Z', plannedDate: 'retest' })],
      today: '2026-06-29T09:00:00.000Z',
    });
    const retest = getRetestDueSummary({ activeBlock: block, today: '2026-06-29T08:00:00.000Z', hasBaseline: true, completions: [] });

    expect(schedule.status).toBe('session_due');
    expect(schedule.totalCredits).toBe(0);
    expect(schedule.nextTemplateId).toBe('strength-A');
    expect(staleRetestOnly.status).toBe('session_due');
    expect(staleRetestOnly.totalCredits).toBe(0);
    expect(retest.due).toBe(false);
    expect(defaultTrainingState().progress.retestDueAt).toBeNull();
  });

  it('uses schedule truth consistently across Today, Plan, Progress, milestones, and progression', () => {
    const block = movementBlock();
    const a = annotateAgainstSchedule(block, [], completion(block, 'strength-A', '2026-06-01T09:00:00.000Z', { id: 'consumer-a' }), '2026-06-01T09:00:00.000Z');
    const b = annotateAgainstSchedule(block, [a], completion(block, 'strength-B', '2026-06-01T11:00:00.000Z', { id: 'consumer-b' }), '2026-06-01T11:00:00.000Z');
    const adherence = {
      ...defaultAdherenceStoreState(),
      assessments: [baselineAssessment(block)],
      blocks: [block],
      completions: [a, b],
    };
    const lifecycle = getHaleAppLifecycle({
      profile: profile(),
      history: [],
      training: defaultTrainingState(),
      adherence,
      today: '2026-06-02T08:00:00.000Z',
    });
    const retest = getRetestDueSummary({ activeBlock: block, today: '2026-06-29T08:00:00.000Z', hasBaseline: true, completions: adherence.completions });
    const milestones = generateMilestones({ block, completions: adherence.completions, existing: [], nowIso: '2026-06-02T08:00:00.000Z' });

    expect(lifecycle.activeBlockSummary).toMatchObject({
      weekNumber: 1,
      sessionsCompleteThisWeek: 1,
      sessionsTargetThisWeek: 3,
    });
    expect(lifecycle.weekSessionStatuses?.map((session) => session.status)).toEqual(['complete', 'next', 'later']);
    expect(retest.due).toBe(false);
    expect(milestones.map((milestone) => milestone.type)).not.toContain('first_week_completed');
  });

  it('keeps official re-test transition effects stable across repeated callbacks with different fallback clocks', () => {
    const block = movementBlock({ sourceCheckUpId: BASELINE_CHECKUP_ID });
    const baseline = baselineAssessment(block);
    const fullCredits = [
      ...weekCredits(block, 1, '2026-06-01'),
      ...weekCredits(block, 2, '2026-06-08'),
      ...weekCredits(block, 3, '2026-06-15'),
      ...weekCredits(block, 4, '2026-06-22'),
    ];
    const retestCheckUp = syntheticCheckUp('2026-06-29T08:00:00.000Z');
    const scored = createCurrentVersionedScoreSnapshot(retestCheckUp);
    let state: AdherenceStoreState = {
      ...defaultAdherenceStoreState(),
      assessments: [baseline],
      blocks: [block],
      completions: fullCredits,
    };
    state = applyOfficialRetestTransition({
      state,
      block,
      baseline,
      latestScore: scored.score,
      latestScoreSnapshot: scored.snapshot,
      checkUpId: retestCheckUp.startedAt,
      fallbackClock: '2026-06-29T09:15:00.000Z',
    });
    state = applyOfficialRetestTransition({
      state,
      block,
      baseline,
      latestScore: scored.score,
      latestScoreSnapshot: scored.snapshot,
      checkUpId: retestCheckUp.startedAt,
      fallbackClock: '2026-06-29T10:30:00.000Z',
    });

    const reports = state.reports.filter((report) => report.blockId === block.id);
    const nextBlocks = state.blocks.filter((item) => item.sourceCheckUpId === retestCheckUp.startedAt);
    const retestCompletions = state.completions.filter((completion) => completion.blockId === block.id && completion.sessionType === 'retest');

    expect(checkUpCompletionTimestamp(retestCheckUp, '2026-06-29T10:30:00.000Z')).toBe(retestCheckUp.startedAt);
    expect(reports).toHaveLength(1);
    expect(reports[0].id).toBe(`block-report-${block.id}`);
    expect(reports[0].createdAt).toBe(retestCheckUp.startedAt);
    expect(nextBlocks).toHaveLength(1);
    expect(nextBlocks[0].startDate).toBe(retestCheckUp.startedAt);
    expect(retestCompletions).toHaveLength(1);
    expect(retestCompletions[0].completedAt).toBe(retestCheckUp.startedAt);
    expect(state.blocks.find((item) => item.id === block.id)?.status).toBe('completed');
  });
});

function movementBlock(overrides: Partial<MovementBlock> = {}): MovementBlock {
  return {
    id: 'movement-block-stage-5g-1',
    userId: 'local-device-user',
    status: 'active',
    startDate: START,
    endDate: '2026-06-29T08:00:00.000Z',
    retestDate: '2026-06-29T08:00:00.000Z',
    focusDomain: 'strength_power',
    secondaryDomains: ['balance', 'mobility'],
    sessionsPerWeekTarget: 3,
    totalPlannedSessions: 12,
    completedSessions: 0,
    microChecksCompleted: 0,
    sourceCheckUpId: BASELINE_CHECKUP_ID,
    createdAt: START,
    updatedAt: START,
    ...overrides,
  };
}

function completion(
  block: MovementBlock,
  templateId: string,
  completedAt: string,
  overrides: Partial<TrainingSessionCompletion> = {}
): TrainingSessionCompletion {
  return {
    id: `completion-${templateId}-${completedAt.replace(/[:.]/g, '-')}`,
    userId: 'local-device-user',
    blockId: block.id,
    plannedDate: `${templateId}:${completedAt.slice(0, 10)}`,
    completedAt,
    sessionType: 'standard',
    focusDomain: block.focusDomain,
    source: 'block_generated',
    templateId,
    mainPlanCredit: true,
    focusStimulusEvidence: focusEvidence(block),
    ...overrides,
  };
}

function nonCreditCompletion(
  block: MovementBlock,
  id: string,
  status: TrainingFocusStimulusEvidenceSummary['status'],
  overrides: Partial<TrainingSessionCompletion> = {}
): TrainingSessionCompletion {
  return completion(block, 'strength-A', '2026-06-15T09:00:00.000Z', {
    id,
    sessionType: 'standard',
    mainPlanCredit: false,
    focusStimulusEvidence: focusEvidence(block, {
      status,
      exclusionReason: status === 'no_completed_work' ? 'no_completed_work' : 'primary_focus_not_completed',
      mainPlanCredit: false,
      completedPrimaryFocusExerciseCount: 0,
      completedPrimaryFocusExerciseIds: [],
    }),
    ...overrides,
  });
}

function weekCredits(block: MovementBlock, weekNumber: number, startDateKey: string): TrainingSessionCompletion[] {
  const [year, month, day] = startDateKey.split('-').map(Number);
  const base = Date.UTC(year, month - 1, day, 9);
  return ['A', 'B', 'C'].map((label, index) => {
    const completedAt = new Date(base + index * 86400000).toISOString();
    return completion(block, `strength-${label}`, completedAt, { id: `week-${weekNumber}-${label}` });
  });
}

function focusEvidence(
  block: MovementBlock,
  overrides: Partial<TrainingFocusStimulusEvidenceSummary> = {}
): TrainingFocusStimulusEvidenceSummary {
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
    plannedPrimaryFocusExerciseIds: ['sit-to-stand-level-1'],
    completedPrimaryFocusExerciseIds: ['sit-to-stand-level-1'],
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

function generatedSummaryFor(completion: TrainingSessionCompletion, id: string) {
  return {
    id,
    blockId: completion.blockId,
    source: 'block_generated' as const,
    templateId: completion.templateId,
    plannedDateKey: completion.plannedDate,
    sessionType: completion.sessionType,
    status: 'completed' as const,
    mainPlanCredit: completion.mainPlanCredit,
    scheduleCredit: completion.scheduleCredit,
    focusStimulusEvidence: completion.focusStimulusEvidence,
    title: 'Generated session',
    completedAt: completion.completedAt,
    exerciseIds: ['sit-to-stand-level-1'],
  };
}

function annotateAgainstSchedule(
  block: MovementBlock,
  existing: readonly TrainingSessionCompletion[],
  candidate: TrainingSessionCompletion,
  today: string
): TrainingSessionCompletion {
  return annotateCompletionWithScheduleCredit(
    candidate,
    getBlockScheduleState({ block, completions: [...existing, candidate], today })
  );
}

function scheduleFingerprint(schedule: ReturnType<typeof getBlockScheduleState>) {
  return {
    status: schedule.status,
    weekNumber: schedule.currentWeekNumber,
    weekStart: schedule.currentWeekStartDateKey,
    nextUnlock: schedule.nextUnlockDateKey,
    credited: schedule.creditedTemplateIds,
    nextTemplate: schedule.nextTemplateId,
    totalCredits: schedule.totalCredits,
    lastCreditDate: schedule.lastCreditDateKey,
    lapseState: schedule.lapseState,
    retestNotBefore: schedule.retestNotBeforeDateKey,
    reasons: schedule.diagnostics.map((diagnostic) => `${diagnostic.eventId}:${diagnostic.reason}`).sort(),
  };
}

function safety(): MovementSafetyProfile {
  return {
    id: 'safety-stage-5g-1',
    userId: 'local-device-user',
    age: 61,
    activityLevel: 'lightly_active',
    feelsSafeStandingFromChair: true,
    feelsSafeBalancing: true,
    availableEquipment: ['chair', 'wall', 'resistance_band', 'stairs', 'floor_space'],
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
      updatedAt: START,
    },
    preferredWorkoutDays: ['Mon', 'Wed', 'Fri'],
    createdAt: START,
    updatedAt: START,
  };
}

function profile(): UserProfile {
  const prefs = defaultPreferences();
  return {
    ...prefs.profile,
    name: 'Sam',
    age: 61,
    lifeGoal: createLifeGoal({ category: 'stairs', nowIso: START }),
    safetyProfile: safety(),
  };
}

function baselineAssessment(block: MovementBlock): MovementAssessment {
  const checkUp = syntheticCheckUp(block.sourceCheckUpId ?? BASELINE_CHECKUP_ID);
  const scored = createCurrentVersionedScoreSnapshot(checkUp);
  return createMovementAssessment({
    checkUpId: checkUp.startedAt,
    type: 'baseline',
    score: scored.score,
    scoreSnapshot: scored.snapshot,
    completedAt: checkUp.startedAt,
    isOfficialForProgress: true,
  });
}

function completedResult(plan: HaleSessionPlan): TrainingSessionResult {
  return {
    startedAt: START,
    items: plan.exercises.map((exercise) => ({ exerciseId: exercise.id, status: 'completed' as const, sets: [] })),
  };
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

function applyOfficialRetestTransition({
  state,
  block,
  baseline,
  latestScore,
  latestScoreSnapshot,
  checkUpId,
  fallbackClock,
}: {
  state: AdherenceStoreState;
  block: MovementBlock;
  baseline: MovementAssessment;
  latestScore: CheckUpScore;
  latestScoreSnapshot: ReturnType<typeof createCurrentVersionedScoreSnapshot>['snapshot'];
  checkUpId: string;
  fallbackClock: string;
}): AdherenceStoreState {
  const completedAt = checkUpCompletionTimestamp({ startedAt: checkUpId, bodyUnit: null, items: [] }, fallbackClock);
  const assessment = createMovementAssessment({
    checkUpId,
    type: 'official_retest',
    score: latestScore,
    scoreSnapshot: latestScoreSnapshot,
    sourceBlockId: block.id,
    completedAt,
    isOfficialForProgress: true,
  });
  let next = upsertMovementAssessment(state, assessment);
  next = recordTrainingSessionCompletion(next, makeTrainingSessionCompletion({ block, sessionType: 'retest', completedAt, plannedDate: 'retest' }));
  next = markMovementBlockComplete(next, block.id, completedAt);
  const updatedBlock = next.blocks.find((item) => item.id === block.id) ?? block;
  next = upsertMovementBlockReport(
    next,
    createMovementBlockReport({
      block: updatedBlock,
      baselineAssessment: baseline,
      retestAssessment: assessment,
      previousScore: null,
      latestScore,
      previousScoreSnapshot: null,
      latestScoreSnapshot,
      completions: next.completions,
      nowIso: completedAt,
    })
  );
  next = upsertMovementBlock(
    next,
    createMovementBlockFromAssessment({
      latestAssessment: { score: latestScore, scoreSnapshot: latestScoreSnapshot, sourceCheckUpId: checkUpId, assessment },
      lifeGoal: profile().lifeGoal,
      startDate: completedAt,
    })
  );
  return next;
}
