import {
  BALANCE_FEET_TOGETHER_ID,
  STS_CUSHION_ID,
  STS_POWER_ID,
  STS_SLOW_ECC_ID,
  STS_STANDARD_ID,
  getExercise,
  getExerciseLadder,
} from '../../exercises';
import {
  makeTrainingSessionCompletion,
  type MovementBlock,
  type MovementSafetyProfile,
  type TrainingSessionCompletion,
} from '../../adherence';
import {
  defaultTrainingState,
  type GeneratedExercise,
  type GeneratedSession,
  type TrainingSessionResult,
} from '../../training';
import { evaluateCompletedFocusStimulusEvidence, focusStimulusEvidenceSummary } from '../focusStimulusEvidence';
import { evaluateSessionWorkEvidence } from '../sessionWorkEvidence';
import {
  applyProgressionEvidenceFromSession,
  progressionEventIdFor,
} from '../progressionEvidence';
import {
  planLadderPracticeSession,
  requireHaleSessionPlan,
} from '../sessionPlanning';
import { BLOCK_SCHEDULE_POLICY_VERSION } from '../blockSchedule';
import type { HaleSessionPlan } from '../types';

const START = '2026-06-01T08:00:00.000Z';
const COMPLETED_AT = '2026-06-01T09:00:00.000Z';

describe('authoritative progression evidence', () => {
  it('builds stable per-ladder event ids from authoritative identities', () => {
    const base = {
      completionId: 'completion-1',
      blockId: 'movement-block-1',
      templateId: 'strength-A',
      ladderId: 'sit-to-stand',
    };

    expect(progressionEventIdFor(base)).toBe(progressionEventIdFor({ ...base }));
    expect(progressionEventIdFor({ ...base, ladderId: 'balance' })).not.toBe(progressionEventIdFor(base));
    expect(progressionEventIdFor({ ...base, completionId: 'completion-2' })).not.toBe(progressionEventIdFor(base));
  });

  it('applies a credited current main-plan event once and skips duplicate feedback', () => {
    const b = block();
    const plan = sessionPlan(b, singleExerciseSession());
    const result = completedResult([STS_STANDARD_ID]);
    const completion = creditedCompletion(b, plan, result);
    const initial = defaultTrainingState();

    const first = applyProgressionEvidenceFromSession({
      state: initial,
      sessionPlan: plan,
      completion,
      activeBlock: b,
      sessionResult: result,
      perceivedEffort: 2,
      painReported: false,
      trackingQuality: 'good',
    });
    const duplicate = applyProgressionEvidenceFromSession({
      state: first.nextState,
      sessionPlan: plan,
      completion,
      activeBlock: b,
      sessionResult: result,
      perceivedEffort: 2,
      painReported: false,
      trackingQuality: 'good',
    });

    expect(first.eligibility.eligible).toBe(true);
    expect(first.appliedEvents).toHaveLength(1);
    expect(first.nextState.appliedProgressionEventIds).toEqual([first.appliedEvents[0].progressionEventId]);
    expect(first.nextState.ladderProgressById['sit-to-stand'].currentLevelId).toBe(STS_STANDARD_ID);
    expect(duplicate.appliedEvents).toHaveLength(0);
    expect(duplicate.skippedDuplicateEvents).toHaveLength(1);
    expect(duplicate.nextState).toEqual(first.nextState);
  });

  it('progresses allowed cushion sit-to-stand evidence across distinct completions', () => {
    const b = block();
    const plan = sessionPlan(b, singleExerciseSession(STS_CUSHION_ID));
    const result = completedResult([STS_CUSHION_ID]);
    const firstCompletion = creditedCompletion(b, plan, result);
    const secondCompletion = {
      ...firstCompletion,
      id: 'completion-distinct-same-planned-date',
      completedAt: '2026-06-03T09:00:00.000Z',
    };

    const first = applyProgressionEvidenceFromSession({
      state: defaultTrainingState(),
      sessionPlan: plan,
      completion: firstCompletion,
      activeBlock: b,
      sessionResult: result,
      perceivedEffort: 2,
      painReported: false,
      trackingQuality: 'good',
    });
    const second = applyProgressionEvidenceFromSession({
      state: first.nextState,
      sessionPlan: plan,
      completion: secondCompletion,
      activeBlock: b,
      sessionResult: result,
      perceivedEffort: 2,
      painReported: false,
      trackingQuality: 'good',
    });

    expect(second.appliedEvents).toHaveLength(1);
    expect(second.nextState.appliedProgressionEventIds).toHaveLength(2);
    expect(second.nextState.ladderProgressById['sit-to-stand'].currentLevelId).toBe(STS_STANDARD_ID);
    expect(second.decisions[0].decisionKind).toBe('progressed');
  });

  it('keeps partial-rep sessions from accruing progression evidence', () => {
    const b = block();
    const plan = sessionPlan(b, singleExerciseSession(STS_CUSHION_ID));
    const partialSet = {
      exerciseId: STS_CUSHION_ID,
      reps: 3,
      meanVel: 0.4,
      holdSec: NaN,
      romPeak: NaN,
      autoregulated: false,
      reachedTarget: false,
      interruptions: 0,
      flags: [],
    };
    const result: TrainingSessionResult = {
      startedAt: START,
      items: [{ exerciseId: STS_CUSHION_ID, status: 'completed', sets: [partialSet, partialSet] }],
    };
    const completion = creditedCompletion(b, plan, result);

    const applied = applyProgressionEvidenceFromSession({
      state: defaultTrainingState(),
      sessionPlan: plan,
      completion,
      activeBlock: b,
      sessionResult: result,
      perceivedEffort: 2,
      painReported: false,
      trackingQuality: 'good',
    });

    expect(applied.eligibility.eligible).toBe(true);
    expect(applied.appliedEvents).toHaveLength(1);
    // 6 of the 16 planned reps: measured, not self-reported.
    const plannedReps =
      (getExercise(STS_CUSHION_ID).prescription.repsPerSet ?? 0) *
      getExercise(STS_CUSHION_ID).prescription.sets;
    expect(applied.appliedEvents[0].result.completionRate).toBeCloseTo(6 / plannedReps, 5);
    const progress = applied.nextState.ladderProgressById['sit-to-stand'];
    // A low-effort report cannot turn a mostly-incomplete dose into an easy exposure.
    expect(progress.currentLevelId).toBe(STS_CUSHION_ID);
    expect(progress.completedSessionsAtLevel).toBe(0);
    expect(progress.readyToProgress).toBeFalsy();
  });

  it('records hold-only adjusted evidence without advancing after easy completions', () => {
    const b = block();
    const plan = {
      ...sessionPlan(b, singleExerciseSession()),
      metadata: {
        ...sessionPlan(b, singleExerciseSession()).metadata!,
        progressionEvidencePolicy: 'hold_only' as const,
      },
    };
    const result = completedResult([STS_STANDARD_ID]);
    const firstCompletion = creditedCompletion(b, plan, result);
    const secondCompletion = {
      ...firstCompletion,
      id: 'completion-hold-only-2',
      completedAt: '2026-06-03T09:00:00.000Z',
    };

    const first = applyProgressionEvidenceFromSession({
      state: defaultTrainingState(),
      sessionPlan: plan,
      completion: firstCompletion,
      activeBlock: b,
      sessionResult: result,
      perceivedEffort: 2,
      painReported: false,
      trackingQuality: 'good',
    });
    const second = applyProgressionEvidenceFromSession({
      state: first.nextState,
      sessionPlan: plan,
      completion: secondCompletion,
      activeBlock: b,
      sessionResult: result,
      perceivedEffort: 2,
      painReported: false,
      trackingQuality: 'good',
    });

    expect(first.eligibility).toMatchObject({ eligible: true, progressionEvidencePolicy: 'hold_only' });
    expect(first.appliedEvents).toHaveLength(1);
    expect(first.nextState.appliedProgressionEventIds).toHaveLength(1);
    expect(first.nextState.ladderProgressById['sit-to-stand']).toBeUndefined();
    expect(second.nextState.appliedProgressionEventIds).toHaveLength(2);
    expect(second.nextState.ladderProgressById['sit-to-stand']).toBeUndefined();
    expect(second.diagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ reason: 'progression_held_by_policy' })]));
  });

  it('fails closed and preserves idempotency for stale progression policy evidence', () => {
    const b = block();
    const plan = sessionPlan(b, singleExerciseSession(STS_CUSHION_ID));
    const snapshot = plan.metadata?.progressionPolicySnapshot;
    if (!snapshot) throw new Error('expected progression policy snapshot');
    const stalePlan: HaleSessionPlan = {
      ...plan,
      metadata: {
        ...plan.metadata!,
        progressionPolicySnapshot: {
          ...snapshot,
          policyFingerprint: 'stale-policy',
          fingerprint: 'stale-plan',
        },
      },
    };
    const result = completedResult([STS_CUSHION_ID]);
    const completion = creditedCompletion(b, stalePlan, result);

    const applied = applyProgressionEvidenceFromSession({
      state: defaultTrainingState(),
      sessionPlan: stalePlan,
      completion,
      activeBlock: b,
      sessionResult: result,
      perceivedEffort: 2,
      painReported: false,
      trackingQuality: 'good',
    });
    const duplicate = applyProgressionEvidenceFromSession({
      state: applied.nextState,
      sessionPlan: stalePlan,
      completion,
      activeBlock: b,
      sessionResult: result,
      perceivedEffort: 2,
      painReported: false,
      trackingQuality: 'good',
    });

    expect(applied.appliedEvents).toHaveLength(1);
    expect(applied.decisions[0]).toMatchObject({ decisionKind: 'held', afterLevelId: undefined });
    expect(applied.nextState.ladderProgressById['sit-to-stand']).toBeUndefined();
    expect(applied.diagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ reason: 'stale_progression_policy' })]));
    expect(duplicate.appliedEvents).toHaveLength(0);
    expect(duplicate.skippedDuplicateEvents).toHaveLength(1);
  });

  it('allows hold-only evidence to apply conservative pain regression once', () => {
    const b = block();
    const plan = {
      ...sessionPlan(b, singleExerciseSession()),
      metadata: {
        ...sessionPlan(b, singleExerciseSession()).metadata!,
        progressionEvidencePolicy: 'hold_only' as const,
      },
    };
    const result = completedResult([STS_STANDARD_ID]);
    const completion = creditedCompletion(b, plan, result);
    const initial = {
      ...defaultTrainingState(),
      ladderProgressById: {
        'sit-to-stand': {
          ladderId: 'sit-to-stand',
          currentLevelId: STS_SLOW_ECC_ID,
          completedSessionsAtLevel: 0,
          failedSessionsAtLevel: 1,
          recentCompletionRates: [0.5],
          recentRpe: [5],
          recentPain: [false],
          updatedAt: START,
        },
      },
    };

    const applied = applyProgressionEvidenceFromSession({
      state: initial,
      sessionPlan: plan,
      completion,
      activeBlock: b,
      sessionResult: result,
      perceivedEffort: 5,
      painReported: true,
      painAreas: ['knee'],
      trackingQuality: 'good',
    });
    const duplicate = applyProgressionEvidenceFromSession({
      state: applied.nextState,
      sessionPlan: plan,
      completion,
      activeBlock: b,
      sessionResult: result,
      perceivedEffort: 5,
      painReported: true,
      painAreas: ['knee'],
      trackingQuality: 'good',
    });

    // Slow-lower regresses one released level to standard (the intermediate
    // levels are now reachable rather than capped away).
    expect(applied.nextState.ladderProgressById['sit-to-stand'].currentLevelId).toBe(STS_STANDARD_ID);
    expect(applied.nextState.appliedProgressionEventIds).toHaveLength(1);
    expect(duplicate.appliedEvents).toHaveLength(0);
    expect(duplicate.skippedDuplicateEvents).toHaveLength(1);
    expect(duplicate.nextState).toEqual(applied.nextState);
  });

  it('requires feedback before progression evidence can improve a ladder', () => {
    const b = block();
    const plan = sessionPlan(b, singleExerciseSession());
    const result = completedResult([STS_STANDARD_ID]);
    const completion = creditedCompletion(b, plan, result);

    const applied = applyProgressionEvidenceFromSession({
      state: defaultTrainingState(),
      sessionPlan: plan,
      completion,
      activeBlock: b,
      sessionResult: result,
      painReported: false,
      trackingQuality: 'good',
    });

    expect(applied.appliedEvents).toHaveLength(0);
    expect(applied.evidenceEvents).toHaveLength(0);
    expect(applied.diagnostics.map((diagnostic) => diagnostic.reason)).toContain('missing_feedback');
    expect(applied.nextState.ladderProgressById).toEqual({});
  });

  it('excludes fallback evidence while applying valid same-session primary evidence once per ladder', () => {
    const b = block();
    const plan = sessionPlan(b, primaryPlusFallbackSameLadderSession());
    const result = completedResult([STS_STANDARD_ID, STS_SLOW_ECC_ID]);
    const completion = creditedCompletion(b, plan, result);

    const applied = applyProgressionEvidenceFromSession({
      state: defaultTrainingState(),
      sessionPlan: plan,
      completion,
      activeBlock: b,
      sessionResult: result,
      perceivedEffort: 2,
      painReported: false,
      trackingQuality: 'good',
    });

    expect(applied.evidenceEvents).toHaveLength(1);
    expect(applied.evidenceEvents[0].ladderId).toBe('sit-to-stand');
    expect(applied.evidenceEvents[0].sourceExerciseIds).toEqual([STS_STANDARD_ID]);
    expect(applied.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ exerciseId: STS_SLOW_ECC_ID, reason: 'fallback_role' }),
      ])
    );
  });

  it('allows supporting work in a credited session to affect only its own ladder', () => {
    const b = block();
    const plan = sessionPlan(b, primaryPlusSupportingSession());
    const result = completedResult([STS_STANDARD_ID, BALANCE_FEET_TOGETHER_ID]);
    const completion = creditedCompletion(b, plan, result);

    const applied = applyProgressionEvidenceFromSession({
      state: defaultTrainingState(),
      sessionPlan: plan,
      completion,
      activeBlock: b,
      sessionResult: result,
      perceivedEffort: 2,
      painReported: false,
      trackingQuality: 'good',
    });

    expect(applied.appliedEvents.map((event) => event.ladderId).sort()).toEqual(['balance', 'sit-to-stand']);
    expect(applied.nextState.ladderProgressById.balance.currentLevelId).toBe(BALANCE_FEET_TOGETHER_ID);
    expect(applied.nextState.ladderProgressById['sit-to-stand'].currentLevelId).toBe(STS_STANDARD_ID);
  });

  it('holds at the released power ceiling when easy evidence has no higher level to reach', () => {
    const b = block();
    const plan = sessionPlan(b, generatedSession([generatedExercise({ exerciseId: STS_POWER_ID, role: 'primary' })]));
    const result = completedResult([STS_POWER_ID]);
    const completion = creditedCompletion(b, plan, result);
    const initial = {
      ...defaultTrainingState(),
      ladderProgressById: {
        'sit-to-stand': {
          ladderId: 'sit-to-stand',
          currentLevelId: STS_POWER_ID,
          completedSessionsAtLevel: 1,
          failedSessionsAtLevel: 0,
          recentCompletionRates: [0.95],
          recentRpe: [2],
          recentPain: [false],
          updatedAt: START,
        },
      },
    };

    const applied = applyProgressionEvidenceFromSession({
      state: initial,
      sessionPlan: plan,
      completion,
      activeBlock: b,
      sessionResult: result,
      perceivedEffort: 2,
      painReported: false,
      trackingQuality: 'good',
    });

    expect(applied.appliedEvents).toHaveLength(1);
    // Power is the top released level; easy evidence holds at the ceiling.
    expect(applied.nextState.ladderProgressById['sit-to-stand'].currentLevelId).toBe(STS_POWER_ID);
    expect(applied.decisions[0]).toMatchObject({ decisionKind: 'held', afterLevelId: STS_POWER_ID });
    expect(applied.diagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ reason: 'auto_progression_cap_reached' })]));
  });

  it('fails closed for wrong-ladder metadata without blocking unrelated valid primary evidence', () => {
    const b = block();
    const generated = primaryPlusSupportingSession({
      supporting: { ladderId: 'sit-to-stand', levelId: BALANCE_FEET_TOGETHER_ID },
    });
    const plan = sessionPlan(b, generated);
    const result = completedResult([STS_STANDARD_ID, BALANCE_FEET_TOGETHER_ID]);
    const completion = creditedCompletion(b, plan, result);

    const applied = applyProgressionEvidenceFromSession({
      state: defaultTrainingState(),
      sessionPlan: plan,
      completion,
      activeBlock: b,
      sessionResult: result,
      perceivedEffort: 2,
      painReported: false,
      trackingQuality: 'good',
    });

    expect(applied.appliedEvents.map((event) => event.ladderId)).toEqual(['sit-to-stand']);
    expect(applied.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ exerciseId: BALANCE_FEET_TOGETHER_ID, reason: 'selected_level_mismatch' }),
      ])
    );
    expect(applied.nextState.ladderProgressById.balance).toBeUndefined();
  });

  it('keeps manual ladder practice non-authoritative even when work is completed', () => {
    const b = block();
    const practice = planLadderPracticeSession({
      ladderId: 'sit-to-stand',
      activeBlock: b,
      training: defaultTrainingState(),
      safetyProfile: safety(),
      adjustment: null,
      today: START,
    });
    if (!practice) throw new Error('expected practice plan');
    const result = completedResult([practice.exercises[0].id]);
    const completion = creditedCompletion(b, practice, result, { mainPlanCredit: true });

    const applied = applyProgressionEvidenceFromSession({
      state: defaultTrainingState(),
      sessionPlan: practice,
      completion: { ...completion, source: 'manual' },
      activeBlock: b,
      sessionResult: result,
      perceivedEffort: 2,
      painReported: false,
      trackingQuality: 'good',
    });

    expect(applied.eligibility).toEqual({ eligible: false, reason: 'manual_practice' });
    expect(applied.appliedEvents).toHaveLength(0);
    expect(applied.nextState.ladderProgressById).toEqual({});
  });

  it('does not mutate legacy progression state when applying current dynamic evidence', () => {
    const b = block();
    const plan = sessionPlan(b, singleExerciseSession());
    const result = completedResult([STS_STANDARD_ID]);
    const completion = creditedCompletion(b, plan, result);
    const training = {
      ...defaultTrainingState(),
      progression: { levels: { 'sit-to-stand': 4 }, velHistory: { [STS_STANDARD_ID]: [1.1] } },
    };

    const applied = applyProgressionEvidenceFromSession({
      state: training,
      sessionPlan: plan,
      completion,
      activeBlock: b,
      sessionResult: result,
      perceivedEffort: 2,
      painReported: false,
      trackingQuality: 'good',
    });

    expect(applied.nextState.ladderProgressById['sit-to-stand'].currentLevelId).toBe(STS_STANDARD_ID);
    expect(training.progression).toEqual({ levels: { 'sit-to-stand': 4 }, velHistory: { [STS_STANDARD_ID]: [1.1] } });
  });
});

function block(): MovementBlock {
  return {
    id: 'movement-block-1',
    userId: 'local-device-user',
    status: 'active',
    startDate: '2026-06-01T00:00:00.000Z',
    endDate: '2026-06-29T00:00:00.000Z',
    retestDate: '2026-06-29T00:00:00.000Z',
    focusDomain: 'strength_power',
    secondaryDomains: ['balance', 'mobility'],
    sessionsPerWeekTarget: 3,
    totalPlannedSessions: 12,
    completedSessions: 0,
    microChecksCompleted: 0,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
  };
}

function sessionPlan(b: MovementBlock, generated: GeneratedSession): HaleSessionPlan {
  return requireHaleSessionPlan({
    activeBlock: b,
    training: defaultTrainingState(),
    safetyProfile: safety(),
    today: START,
    generateSession: () => generated,
  });
}

function safety(): MovementSafetyProfile {
  return {
    id: 'safety-1',
    userId: 'local-device-user',
    age: 61,
    activityLevel: 'lightly_active',
    feelsSafeStandingFromChair: true,
    feelsSafeBalancing: true,
    availableEquipment: ['chair', 'wall', 'resistance_band'],
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

function creditedCompletion(
  b: MovementBlock,
  plan: HaleSessionPlan,
  result: TrainingSessionResult,
  overrides: Partial<TrainingSessionCompletion> = {}
): TrainingSessionCompletion {
  const workEvidence = evaluateSessionWorkEvidence(plan, result);
  const focus = evaluateCompletedFocusStimulusEvidence({
    sessionPlan: plan,
    result,
    activeBlock: b,
    workEvidence,
  });
  return {
    ...makeTrainingSessionCompletion({
      block: b,
      sessionType: plan.sessionType,
      completedAt: overrides.completedAt ?? COMPLETED_AT,
      plannedDate: plan.metadata?.plannedDateKey,
      source: plan.metadata?.source,
	      templateId: plan.metadata?.templateId,
	      mainPlanCredit: focus.mainPlanCredit,
	      scheduleCredit: focus.mainPlanCredit
	        ? {
	            policyVersion: BLOCK_SCHEDULE_POLICY_VERSION,
	            credited: true,
	            status: 'credited',
	            weekIndex: 0,
	            weekNumber: 1,
	            dateKey: (overrides.completedAt ?? COMPLETED_AT).slice(0, 10),
	            templateId: plan.metadata?.templateId,
	            creditId: plan.metadata?.plannedDateKey,
	          }
	        : undefined,
	      workEvidence: {
        plannedExerciseCount: workEvidence.plannedExerciseCount,
        resultItemCount: workEvidence.resultItemCount,
        completedExerciseCount: workEvidence.completedExerciseCount,
        skippedExerciseCount: workEvidence.skippedExerciseCount,
        missingResultCount: workEvidence.missingResultCount,
        duplicateResultCount: workEvidence.duplicateResultCount,
        malformedResultCount: workEvidence.malformedResultCount,
        unmatchedResultCount: workEvidence.unmatchedResultCount,
      },
      focusStimulusEvidence: focusStimulusEvidenceSummary(focus),
    }),
    ...overrides,
  };
}

function completedResult(completedExerciseIds: readonly string[], skippedExerciseIds: readonly string[] = []): TrainingSessionResult {
  return {
    startedAt: START,
    items: [
      ...completedExerciseIds.map((exerciseId) => ({ exerciseId, status: 'completed' as const, sets: [] })),
      ...skippedExerciseIds.map((exerciseId) => ({ exerciseId, status: 'skipped' as const, sets: [] })),
    ],
  };
}

function singleExerciseSession(exerciseId = STS_STANDARD_ID): GeneratedSession {
  return generatedSession([generatedExercise({ exerciseId, role: 'primary' })]);
}

function primaryPlusFallbackSameLadderSession(): GeneratedSession {
  return generatedSession([
    generatedExercise({ exerciseId: STS_STANDARD_ID, role: 'primary' }),
    generatedExercise({ exerciseId: STS_SLOW_ECC_ID, role: 'fallback' }),
  ]);
}

function primaryPlusSupportingSession(overrides: { supporting?: Partial<GeneratedExercise> } = {}): GeneratedSession {
  return generatedSession([
    generatedExercise({ exerciseId: STS_STANDARD_ID, role: 'primary' }),
    {
      ...generatedExercise({
        exerciseId: BALANCE_FEET_TOGETHER_ID,
        ladderId: 'balance',
        role: 'supporting',
        slotType: 'balance',
        intendedDomain: 'balance_stability',
      }),
      ...overrides.supporting,
    },
  ]);
}

function generatedSession(exercises: readonly GeneratedExercise[]): GeneratedSession {
  return {
    id: 'generated-strength-A',
    blockId: 'movement-block-1',
    templateId: 'strength-A',
    source: 'block_generated',
    title: 'Strength Session A',
    focusDomain: 'strength_power',
    dayLabel: 'A',
    estimatedMinutes: 12,
    durationLabel: '12 min',
    readiness: 'ready',
    painAreas: [],
    weekStatus: 'session_due',
    exercises,
    skippedSlots: [],
    skippedSlotReasons: [],
    slotStimulus: exercises.map((exercise, index) => ({
      slotId: `${exercise.slotType}-${index}`,
      slotType: exercise.slotType,
      slotTitle: exercise.name,
      intendedDomain: exercise.intendedDomain,
      role: exercise.stimulusRole,
      reason: exercise.stimulusReason,
      message: 'Planned work.',
      exerciseId: exercise.exerciseId,
      ladderId: exercise.ladderId,
      levelId: exercise.levelId,
      selectedDomain: exercise.domain,
    })),
    guidance: [],
  };
}

function generatedExercise({
  exerciseId,
  ladderId,
  role,
  slotType = 'lower_body_strength',
  intendedDomain = 'strength_power',
}: {
  exerciseId: string;
  ladderId?: string;
  role: GeneratedExercise['stimulusRole'];
  slotType?: GeneratedExercise['slotType'];
  intendedDomain?: GeneratedExercise['intendedDomain'];
}): GeneratedExercise {
  const def = getExercise(exerciseId);
  const resolvedLadderId = ladderId ?? def.family;
  const ladder = getExerciseLadder(resolvedLadderId);
  const level = ladder.levels.find((candidate) => candidate.id === exerciseId);
  if (!level) throw new Error(`No level ${exerciseId} in ladder ${resolvedLadderId}`);
  return {
    id: `${exerciseId}-generated`,
    exerciseId,
    ladderId: ladder.id,
    ladderTitle: ladder.title,
    levelId: level.id,
    level: level.level,
    name: level.name,
    slotType,
    domain: level.domain,
    kind: def.kind,
    releaseStatus: level.releaseStatus,
    measurementTier: level.measurementTier,
    cameraView: level.cameraView,
    equipment: level.equipment,
    instructions: level.instructions,
    whyItMatters: ladder.whyItMatters,
    sets: def.prescription.sets,
    repsPerSet: def.prescription.repsPerSet,
    secondsPerSet: def.prescription.holdSec ?? def.prescription.timerSec ?? def.prescription.captureSec,
    restSeconds: def.prescription.restSec ?? 30,
    estimatedMinutes: 4,
    rationale: 'Test generated exercise.',
    intendedDomain,
    stimulusRole: role,
    stimulusReason: role === 'fallback' ? 'equipment_limited' : role === 'supporting' ? 'supporting_maintenance' : 'direct_match',
  };
}
