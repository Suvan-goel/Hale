import type { CheckUpScore, Domain, DomainResult } from '../../scoring';
import {
  createLifeGoal,
  createMovementBlockFromAssessment,
  makeTrainingSessionCompletion,
  type MovementBlock,
  type MovementSafetyProfile,
} from '../../adherence';
import {
  canReplaceBaselineWithRetake,
  createMovementAssessment,
  createMovementBlockReport,
  generateTodaySession,
  getManualCheckupOptions,
  getNextBestAction,
} from '../index';

const START = '2026-06-01T08:00:00.000Z';

function domainResult(domain: Domain, age: number, measured = true): DomainResult {
  return {
    domain,
    label: domain,
    measured,
    ageLow: age - 2,
    ageHigh: age + 2,
    estimated: false,
    interpretation: 'Measured range.',
    rows: [],
  };
}

function score(weakestDomain: Domain = 'balance'): CheckUpScore {
  return {
    startedAt: START,
    weakestDomain,
    domains: [
      domainResult('strength', weakestDomain === 'strength' ? 70 : 58),
      domainResult('balance', weakestDomain === 'balance' ? 70 : 57),
      domainResult('mobility', weakestDomain === 'mobility' ? 70 : 56),
    ],
  };
}

function safety(): MovementSafetyProfile {
  return {
    id: 'safety-1',
    userId: 'local-device-user',
    age: 61,
    activityLevel: 'lightly_active',
    feelsSafeStandingFromChair: true,
    feelsSafeBalancing: true,
    availableEquipment: ['chair', 'wall'],
    preferredWorkoutDays: ['Mon', 'Wed', 'Fri'],
    createdAt: START,
    updatedAt: START,
  };
}

function assessment(type: 'baseline' | 'official_retest' | 'manual_extra' = 'baseline') {
  return createMovementAssessment({
    checkUpId: START,
    type,
    score: score('balance'),
    completedAt: START,
  });
}

function block(): MovementBlock {
  return createMovementBlockFromAssessment({
    latestAssessment: { score: score('balance'), id: 'assessment-1' },
    lifeGoal: createLifeGoal({ category: 'stairs', nowIso: START }),
    startDate: START,
  });
}

describe('getNextBestAction', () => {
  it('routes a new user to life goal first', () => {
    expect(getNextBestAction({ now: START }).state).toBe('needs_life_goal');
  });

  it('routes a profiled user with no baseline to check-up', () => {
    const goal = createLifeGoal({ category: 'stairs', nowIso: START });
    const action = getNextBestAction({
      profile: { safetyProfile: safety() },
      lifeGoal: goal,
      now: START,
    });
    expect(action.state).toBe('needs_baseline_checkup');
    expect(action.primaryRoute).toBe('camera-setup');
  });

  it('routes completed baseline with no block to block creation', () => {
    const goal = createLifeGoal({ category: 'stairs', nowIso: START });
    expect(
      getNextBestAction({
        profile: { safetyProfile: safety() },
        lifeGoal: goal,
        latestAssessment: assessment(),
        now: START,
      }).state
    ).toBe('baseline_complete_needs_block');
  });

  it('shows session due before a weekly micro-check when no session is done', () => {
    const goal = createLifeGoal({ category: 'stairs', nowIso: START });
    const action = getNextBestAction({
      profile: { safetyProfile: safety() },
      lifeGoal: goal,
      latestAssessment: assessment(),
      activeBlock: block(),
      sessionCompletions: [],
      now: '2026-06-02T08:00:00.000Z',
    });
    expect(action.state).toBe('active_block_session_due');
  });

  it('shows micro-check due once a weekly session has been completed', () => {
    const b = block();
    const action = getNextBestAction({
      profile: { safetyProfile: safety() },
      lifeGoal: createLifeGoal({ category: 'stairs', nowIso: START }),
      latestAssessment: assessment(),
      activeBlock: b,
      sessionCompletions: [
        makeTrainingSessionCompletion({
          block: b,
          sessionType: 'standard',
          completedAt: '2026-06-02T08:00:00.000Z',
          plannedDate: 'session-1',
        }),
        makeTrainingSessionCompletion({
          block: b,
          sessionType: 'standard',
          completedAt: '2026-06-04T08:00:00.000Z',
          plannedDate: 'session-2',
        }),
        makeTrainingSessionCompletion({
          block: b,
          sessionType: 'standard',
          completedAt: '2026-06-06T08:00:00.000Z',
          plannedDate: 'session-3',
        }),
      ],
      now: '2026-06-06T12:00:00.000Z',
    });
    expect(action.state).toBe('active_block_micro_check_due');
  });

  it('shows re-test due near the end of the block', () => {
    const action = getNextBestAction({
      profile: { safetyProfile: safety() },
      lifeGoal: createLifeGoal({ category: 'stairs', nowIso: START }),
      latestAssessment: assessment(),
      activeBlock: block(),
      sessionCompletions: [],
      now: '2026-06-28T08:00:00.000Z',
    });
    expect(action.state).toBe('active_block_retest_due');
  });

  it('shows report ready after a completed block has a report', () => {
    const b = { ...block(), status: 'completed' as const };
    const report = createMovementBlockReport({
      block: b,
      previousScore: score('balance'),
      latestScore: score('mobility'),
      completions: [],
      nowIso: '2026-06-30T08:00:00.000Z',
    });
    expect(
      getNextBestAction({
        profile: { safetyProfile: safety() },
        lifeGoal: createLifeGoal({ category: 'stairs', nowIso: START }),
        latestAssessment: assessment('official_retest'),
        activeBlock: b,
        latestReport: report,
        now: '2026-06-30T08:00:00.000Z',
      }).state
    ).toBe('report_ready');
  });
});

describe('manual check-up rules', () => {
  it('marks mid-block manual check-ups as manual_extra and not official', () => {
    const options = getManualCheckupOptions({
      latestAssessment: assessment(),
      activeBlock: block(),
      completions: [],
      now: '2026-06-03T08:00:00.000Z',
    });
    const manual = options.find((o) => o.type === 'manual_extra');
    expect(manual?.isOfficialForProgress).toBe(false);
  });

  it('allows baseline retake replacement only with confirmation', () => {
    const original = assessment('baseline');
    const retake = createMovementAssessment({
      checkUpId: '2026-06-02T08:00:00.000Z',
      type: 'baseline_retake',
      score: score('strength'),
      completedAt: '2026-06-02T08:00:00.000Z',
    });
    expect(canReplaceBaselineWithRetake({ original, retake, confirmed: false })).toBe(false);
    expect(canReplaceBaselineWithRetake({ original, retake, confirmed: true })).toBe(true);
  });

  it('marks official re-tests as official progress assessments', () => {
    expect(assessment('official_retest').isOfficialForProgress).toBe(true);
  });
});

describe('session planning and reports', () => {
  it('adapts generated sessions to the focus domain', () => {
    const b = createMovementBlockFromAssessment({
      latestAssessment: { score: score('mobility'), id: 'assessment-1' },
      lifeGoal: createLifeGoal({ category: 'gardening_hobbies', nowIso: START }),
      startDate: START,
    });
    const session = generateTodaySession({
      activeBlock: b,
      safetyProfile: safety(),
      recentCompletions: [],
      adherenceState: 'on_track',
    });
    expect(session.focusDomain).toBe('mobility');
    expect(session.sessionType).toBe('starter');
    expect(session.exercises.some((e) => e.domain === 'mobility')).toBe(true);
  });

  it('makes restart sessions shorter and countable as completions', () => {
    const b = block();
    const session = generateTodaySession({
      activeBlock: b,
      safetyProfile: safety(),
      adherenceState: 'inactive_this_week',
    });
    const completion = makeTrainingSessionCompletion({
      block: b,
      sessionType: session.sessionType,
      completedAt: '2026-06-08T08:00:00.000Z',
    });
    expect(session.sessionType).toBe('restart');
    expect(session.estimatedMinutes).toBeLessThan(20);
    expect(completion.sessionType).toBe('restart');
  });

  it('does not fabricate report domain changes when scores are missing', () => {
    const report = createMovementBlockReport({ block: block(), completions: [], previousScore: null, latestScore: null });
    expect(report.domainChanges).toEqual({});
    expect(report.summary).toContain('will appear here');
  });

  it('keeps core flow copy away from banned phrases', () => {
    const samples = [
      getNextBestAction({
        profile: { safetyProfile: safety() },
        lifeGoal: createLifeGoal({ category: 'stairs', nowIso: START }),
        latestAssessment: assessment(),
        activeBlock: block(),
        sessionCompletions: [],
        now: '2026-06-02T08:00:00.000Z',
      }).body,
      getManualCheckupOptions({ latestAssessment: assessment(), activeBlock: block(), completions: [] })
        .map((o) => `${o.title} ${o.body}`)
        .join(' '),
    ].join(' ');
    expect(samples.toLowerCase()).not.toMatch(
      /failed|lost streak|fall risk|diagnosis|treatment|frailty|disease|patient|medical-grade|prevent falls|prevent disease/
    );
  });
});
