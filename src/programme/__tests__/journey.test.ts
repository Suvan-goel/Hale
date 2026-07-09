import type {
  MovementProfileV2Assessment,
  MovementProfileV2SuggestedFocus,
} from '../../reference/movementProfileV2/assessment';
import {
  PROGRAMME_JOURNEY_PLANNED_SESSION_COUNT,
  PROGRAMME_JOURNEY_PLANNED_SESSIONS_PER_WEEK,
  PROGRAMME_JOURNEY_SUFFICIENT_SESSION_COUNT,
  PROGRAMME_JOURNEY_SUFFICIENT_SESSIONS_PER_WEEK,
  PROGRAMME_JOURNEY_TOTAL_WEEK_COUNT,
  applyOfficialAssessmentToProgrammeJourney,
  createEmptyProgrammeJourneyState,
  isProgrammeJourneyRetestDue,
  programmeJourneyProgressAt,
  programmeJourneyRetestDueAtIso,
  programmeJourneyWeekSummaries,
  recordProgrammeJourneySession,
  type ProgrammeJourneyState,
} from '../journey';

const BASELINE_AT = '2026-06-01T08:00:00.000Z';

describe('12-week programme journey', () => {
  it('defines three planned sessions and two sufficient sessions across 12 weeks', () => {
    expect(PROGRAMME_JOURNEY_TOTAL_WEEK_COUNT).toBe(12);
    expect(PROGRAMME_JOURNEY_PLANNED_SESSIONS_PER_WEEK).toBe(3);
    expect(PROGRAMME_JOURNEY_SUFFICIENT_SESSIONS_PER_WEEK).toBe(2);
    expect(PROGRAMME_JOURNEY_PLANNED_SESSION_COUNT).toBe(36);
    expect(PROGRAMME_JOURNEY_SUFFICIENT_SESSION_COUNT).toBe(24);
  });

  it('starts phase 1 from a valid baseline and applies that source only once', () => {
    const empty = createEmptyProgrammeJourneyState();
    const source = assessment({ sourceCheckUpId: 'baseline-1', sourceCheckUpType: 'baseline' });
    const applied = applyOfficialAssessmentToProgrammeJourney(empty, {
      assessment: source,
      completedAtIso: BASELINE_AT,
    });

    expect(applied.kind).toBe('advanced');
    if (applied.kind !== 'advanced') return;
    expect(applied.startedPhase).toBe(1);
    expect(applied.state).toMatchObject({
      status: 'active',
      startedAtIso: BASELINE_AT,
      currentPhase: 1,
      currentPhaseStartedAtIso: BASELINE_AT,
      checkpoints: {
        baseline: {
          sourceCheckUpId: 'baseline-1',
          startedPhase: 1,
          physicalFocus: 'strength',
        },
      },
      phasePrescriptions: {
        1: { physicalFocus: 'strength', sourceCheckUpId: 'baseline-1' },
      },
    });

    const replay = applyOfficialAssessmentToProgrammeJourney(applied.state, {
      assessment: source,
      completedAtIso: '2026-06-02T08:00:00.000Z',
    });
    expect(replay.kind).toBe('already_applied');
    expect(replay.state).toBe(applied.state);
    expect(
      replay.kind === 'already_applied' ? replay.checkpoint.checkpointId : null
    ).toBe(applied.checkpoint.checkpointId);
  });

  it('does not start or advance from a needs-retake assessment', () => {
    const empty = createEmptyProgrammeJourneyState();
    const source = assessment({
      sourceCheckUpId: 'baseline-needs-retake',
      sourceCheckUpType: 'baseline',
      focus: {
        kind: 'needs_retake',
        planMode: 'needs_retake',
        reason: 'v2_focus_needs_retake',
        invalidDomains: ['balance'],
      },
    });
    const result = applyOfficialAssessmentToProgrammeJourney(empty, {
      assessment: source,
      completedAtIso: BASELINE_AT,
    });

    expect(result).toMatchObject({ kind: 'rejected', reason: 'needs_retake' });
    expect(result.state).toBe(empty);
  });

  it('credits at most once per local day and caps a week at its three planned sessions', () => {
    let state = activeJourney();
    const firstInput = session('session-1', localIso(2026, 6, 1, 9), 'A');
    const first = recordProgrammeJourneySession(state, firstInput);
    expect(first.kind).toBe('credited');
    if (first.kind !== 'credited') return;
    state = first.state;
    expect(first.credit.localDateKey).toBe('2026-06-01');

    const replay = recordProgrammeJourneySession(state, firstInput);
    expect(replay.kind).toBe('already_recorded');
    expect(replay.state).toBe(state);

    const sameDay = recordProgrammeJourneySession(
      state,
      session('session-same-day', localIso(2026, 6, 1, 22), 'B')
    );
    expect(sameDay).toMatchObject({ kind: 'rejected', reason: 'daily_credit_already_used' });

    state = mustCredit(state, session('session-2', localIso(2026, 6, 2, 9), 'B'));
    let week = programmeJourneyWeekSummaries(state, 1)[0];
    expect(week).toMatchObject({
      creditedSessions: 2,
      sufficientSessions: 2,
      sufficient: true,
      plannedSessions: 3,
      plannedComplete: false,
    });

    state = mustCredit(state, session('session-3', localIso(2026, 6, 3, 9), 'A'));
    week = programmeJourneyWeekSummaries(state, 1)[0];
    expect(week).toMatchObject({ creditedSessions: 3, sufficient: true, plannedComplete: true });

    const fourth = recordProgrammeJourneySession(
      state,
      session('session-4', localIso(2026, 6, 4, 9), 'B')
    );
    expect(fourth).toMatchObject({ kind: 'rejected', reason: 'weekly_plan_complete' });
    expect(fourth.state.sessionCredits).toHaveLength(3);
  });

  it('advances baseline → phase 1 → phase 2 → phase 3 → complete on 28-day checkpoints', () => {
    let state = activeJourney();
    expect(programmeJourneyRetestDueAtIso(state)).toBe('2026-06-29T08:00:00.000Z');
    expect(isProgrammeJourneyRetestDue(state, '2026-06-29T07:59:59.999Z')).toBe(false);
    expect(isProgrammeJourneyRetestDue(state, '2026-06-29T08:00:00.000Z')).toBe(true);

    const early = applyOfficialAssessmentToProgrammeJourney(state, {
      assessment: assessment({
        sourceCheckUpId: 'week4-early',
        sourceCheckUpType: 'official_retest',
        focus: domainFocus('balance'),
      }),
      completedAtIso: '2026-06-28T08:00:00.000Z',
    });
    expect(early).toMatchObject({
      kind: 'rejected',
      reason: 'not_due',
      dueAtIso: '2026-06-29T08:00:00.000Z',
    });

    const week4At = '2026-07-03T10:30:00.000Z';
    state = mustAdvance(
      state,
      assessment({
        sourceCheckUpId: 'week4-delayed',
        sourceCheckUpType: 'official_retest',
        focus: domainFocus('balance'),
      }),
      week4At,
      2
    );
    // Delayed re-test gives phase 2 its own full four weeks from actual completion.
    expect(state.currentPhaseStartedAtIso).toBe(week4At);
    expect(programmeJourneyRetestDueAtIso(state)).toBe('2026-07-31T10:30:00.000Z');

    const week8At = '2026-08-05T07:15:00.000Z';
    state = mustAdvance(
      state,
      assessment({
        sourceCheckUpId: 'week8-delayed',
        sourceCheckUpType: 'official_retest',
        focus: balancedFocus(),
      }),
      week8At,
      3
    );
    expect(state.currentPhaseStartedAtIso).toBe(week8At);
    expect(programmeJourneyRetestDueAtIso(state)).toBe('2026-09-02T07:15:00.000Z');

    const finalAssessment = assessment({
      sourceCheckUpId: 'week12-final',
      sourceCheckUpType: 'official_retest',
      focus: domainFocus('strength_power'),
    });
    const completed = applyOfficialAssessmentToProgrammeJourney(state, {
      assessment: finalAssessment,
      completedAtIso: '2026-09-06T12:00:00.000Z',
    });
    expect(completed).toMatchObject({
      kind: 'completed',
      state: {
        status: 'completed',
        currentPhase: null,
        currentPhaseStartedAtIso: null,
        completedAtIso: '2026-09-06T12:00:00.000Z',
        checkpoints: { week12: { sourceCheckUpId: 'week12-final', startedPhase: null } },
      },
    });
    if (completed.kind !== 'completed') return;

    const replay = applyOfficialAssessmentToProgrammeJourney(completed.state, {
      assessment: finalAssessment,
      completedAtIso: '2026-09-07T12:00:00.000Z',
    });
    expect(replay.kind).toBe('already_applied');
    expect(replay.state).toBe(completed.state);
  });

  it('keeps session sufficiency separate from the time-based retest gate', () => {
    const state = activeJourney();
    const progress = programmeJourneyProgressAt(state, '2026-06-29T08:00:00.000Z');

    expect(progress).toMatchObject({
      currentPhase: 1,
      currentWeek: 4,
      phaseCreditedSessions: 0,
      phaseSufficientWeeks: 0,
      retestDue: true,
    });
  });
});

function activeJourney(): ProgrammeJourneyState {
  const source = assessment({ sourceCheckUpId: 'baseline-1', sourceCheckUpType: 'baseline' });
  const result = applyOfficialAssessmentToProgrammeJourney(createEmptyProgrammeJourneyState(), {
    assessment: source,
    completedAtIso: BASELINE_AT,
  });
  if (result.kind !== 'advanced') throw new Error(`baseline failed: ${result.kind}`);
  return result.state;
}

function mustAdvance(
  state: ProgrammeJourneyState,
  source: MovementProfileV2Assessment,
  completedAtIso: string,
  expectedPhase: 2 | 3
): ProgrammeJourneyState {
  const result = applyOfficialAssessmentToProgrammeJourney(state, {
    assessment: source,
    completedAtIso,
  });
  if (result.kind !== 'advanced') throw new Error(`checkpoint failed: ${result.kind}`);
  expect(result.startedPhase).toBe(expectedPhase);
  return result.state;
}

function mustCredit(
  state: ProgrammeJourneyState,
  input: ReturnType<typeof session>
): ProgrammeJourneyState {
  const result = recordProgrammeJourneySession(state, input);
  if (result.kind !== 'credited') throw new Error(`session failed: ${result.kind}`);
  return result.state;
}

function session(sessionId: string, completedAtIso: string, templateId: 'A' | 'B') {
  return { sessionId, completedAtIso, templateId } as const;
}

function localIso(year: number, month1: number, day: number, hour: number): string {
  return new Date(year, month1 - 1, day, hour).toISOString();
}

function domainFocus(
  focusDomain: 'strength_power' | 'balance'
): MovementProfileV2SuggestedFocus {
  return {
    kind: 'domain',
    focusDomain,
    planMode: 'checkup_reference_focus',
    reason: 'v2_focus_single_below_reference',
    candidateDomains: [focusDomain],
  };
}

function balancedFocus(): MovementProfileV2SuggestedFocus {
  return {
    kind: 'balanced',
    planMode: 'balanced_insufficient_reference',
    reason: 'v2_focus_balanced_no_unique_signal',
    candidateDomains: [],
  };
}

function assessment({
  sourceCheckUpId,
  sourceCheckUpType,
  focus = domainFocus('strength_power'),
}: {
  sourceCheckUpId: string;
  sourceCheckUpType: 'baseline' | 'baseline_retake' | 'official_retest';
  focus?: MovementProfileV2SuggestedFocus;
}): MovementProfileV2Assessment {
  return {
    kind: 'movement_profile_v2_assessment',
    schemaVersion: 1,
    assessmentId: `assessment-${sourceCheckUpId}`,
    assessmentFingerprint: `assessment-fingerprint-${sourceCheckUpId}`,
    sourceSnapshotId: `snapshot-${sourceCheckUpId}`,
    sourceSnapshotFingerprint: `snapshot-fingerprint-${sourceCheckUpId}`,
    sourceCheckUpId,
    sourceCheckUpType,
    createdAt: BASELINE_AT,
    focus,
    focusProvenance: {
      decisionReason: focus.reason,
    },
  } as MovementProfileV2Assessment;
}
