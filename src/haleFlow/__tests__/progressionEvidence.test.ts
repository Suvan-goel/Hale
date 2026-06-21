import {
  BALANCE_FEET_TOGETHER_ID,
  STS_SLOW_ECC_ID,
  STS_STANDARD_ID,
  getExercise,
  getExerciseLadder,
} from '../../exercises';
import {
  makeTrainingSessionCompletion,
  type MovementBlock,
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

  it('preserves the current easy-session decision behavior across distinct completions', () => {
    const b = block();
    const plan = sessionPlan(b, singleExerciseSession());
    const result = completedResult([STS_STANDARD_ID]);
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
    expect(second.nextState.ladderProgressById['sit-to-stand'].currentLevelId).toBe(STS_SLOW_ECC_ID);
    expect(second.decisions[0].decisionKind).toBe('progressed');
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
    today: START,
    generateSession: () => generated,
  });
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

function singleExerciseSession(): GeneratedSession {
  return generatedSession([generatedExercise({ exerciseId: STS_STANDARD_ID, role: 'primary' })]);
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
