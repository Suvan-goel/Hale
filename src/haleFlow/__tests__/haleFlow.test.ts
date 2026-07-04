import { createMovementBlockReport } from '../testing/legacyBlockReportFixture';
import type { CheckUpScore, Domain, DomainResult, VersionedCheckUpScoreSnapshot } from '../../scoring';
import { toStoredScoreSnapshot } from '../../scoring';
import {
  createLifeGoal,
  createMovementBlockFromAssessment,
  makeTrainingSessionCompletion,
  type MovementBlock,
  type MovementSafetyProfile,
  type TrainingFocusStimulusEvidenceSummary,
} from '../../adherence';
import {
  canReplaceBaselineWithRetake,
  createMovementAssessment,
  generateTodaySession,
  getManualCheckupCopy,
  getManualCheckupOptions,
} from '../index';
import { getBlockScheduleState } from '../blockSchedule';
import {
  getBlockMicroCheckTarget,
  microCheckSlotMetadataFromTarget,
} from '../microCheckPolicy';

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
    primaryMetricValue: age,
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
  const inputScore = score('balance');
  return createMovementAssessment({
    checkUpId: START,
    type,
    score: inputScore,
    scoreSnapshot: scoreSnapshotFor(inputScore),
    completedAt: START,
  });
}

function block(): MovementBlock {
  const inputScore = score('balance');
  const scoreSnapshot = scoreSnapshotFor(inputScore);
  const sourceAssessment = assessment('baseline');
  return createMovementBlockFromAssessment({
    latestAssessment: { score: inputScore, scoreSnapshot, id: 'assessment-1', assessment: sourceAssessment },
    lifeGoal: createLifeGoal({ category: 'stairs', nowIso: START }),
    startDate: START,
  });
}

function scoreSnapshotFor(inputScore: CheckUpScore): VersionedCheckUpScoreSnapshot {
  return toStoredScoreSnapshot(inputScore)!;
}

function creditedCompletion(b: MovementBlock, templateId: string, completedAt: string) {
  return makeTrainingSessionCompletion({
    block: b,
    sessionType: 'standard',
    completedAt,
    plannedDate: `${templateId}:${completedAt.slice(0, 10)}`,
    source: 'block_generated',
    templateId,
    mainPlanCredit: true,
    focusStimulusEvidence: focusEvidence(b, templateId),
  });
}

function microCheckCompletion(b: MovementBlock, completedAt: string) {
  const mainCompletions = [creditedCompletion(b, `${templatePrefix(b)}-A`, '2026-06-02T08:00:00.000Z')];
  const schedule = getBlockScheduleState({ block: b, completions: mainCompletions, today: completedAt });
  const target = getBlockMicroCheckTarget({ block: b, schedule, completions: mainCompletions });
  if (target.status !== 'available') throw new Error(`Expected available micro-check target, got ${target.reason}`);
  return makeTrainingSessionCompletion({
    block: b,
    sessionType: 'micro_check',
    completedAt,
    plannedDate: target.slotId,
    durationMinutes: 1,
    mainPlanCredit: false,
    microCheckSlot: microCheckSlotMetadataFromTarget(target),
  });
}

function focusEvidence(
  block: MovementBlock,
  templateId: string,
  overrides: Partial<TrainingFocusStimulusEvidenceSummary> = {}
): TrainingFocusStimulusEvidenceSummary {
  const exerciseId = `${templateId}-primary`;
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
    plannedPrimaryFocusExerciseIds: [exerciseId],
    completedPrimaryFocusExerciseIds: [exerciseId],
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


describe('manual check-up rules', () => {
  it('keeps retired V1 manual options hidden while exposing optional V2 choices', () => {
    const options = getManualCheckupOptions({
      latestAssessment: assessment(),
      activeBlock: block(),
      completions: [],
      now: '2026-06-03T08:00:00.000Z',
    });
    expect(options.find((o) => o.type === 'manual_extra')).toBeUndefined();
    expect(options.find((o) => o.type === 'quick_recheck')).toBeUndefined();
    expect(options.find((o) => o.type === 'micro_check')).toMatchObject({
      title: 'Quick micro check-up',
      route: 'optional-microcheck',
      isOfficialForProgress: false,
    });
    expect(options.find((o) => o.type === 'manual_extra_v2')).toMatchObject({
      title: 'Full Movement Check-Up',
      route: 'manual-extra-v2-checkup',
      isOfficialForProgress: false,
    });
  });

  it('uses optional curiosity copy for the extra check-up choice', () => {
    const header = getManualCheckupCopy({ activeBlock: true });
    const options = getManualCheckupOptions({
      latestAssessment: assessment(),
      activeBlock: block(),
      completions: [],
      now: '2026-06-03T08:00:00.000Z',
    });

    expect(header).toEqual({
      title: 'Check in on your progress',
      body: "Choose a quick check-in or complete a full Movement Check-Up whenever you're curious. These optional check-ups won't change your plan or Movement Profile.",
    });
    expect(options.map((option) => option.type)).toEqual(['micro_check', 'manual_extra_v2']);
    expect(options.find((option) => option.type === 'manual_extra')).toBeUndefined();
  });

  it('keeps optional manual check-up choices separate from the scheduled slot target', () => {
    const b = block();
    const options = getManualCheckupOptions({
      latestAssessment: assessment(),
      activeBlock: b,
      completions: [creditedCompletion(b, 'balance-A', '2026-06-02T08:00:00.000Z')],
      now: '2026-06-03T08:00:00.000Z',
    });

    expect(options.find((option) => option.type === 'micro_check')).toMatchObject({
      title: 'Quick micro check-up',
      route: 'optional-microcheck',
      recommended: true,
      isOfficialForProgress: false,
    });
    expect(options.find((option) => option.type === 'manual_extra_v2')).toMatchObject({
      title: 'Full Movement Check-Up',
      route: 'manual-extra-v2-checkup',
      recommended: false,
      isOfficialForProgress: false,
    });
    expect(options.find((option) => option.type === 'manual_extra')).toBeUndefined();
  });

  it('allows baseline retake replacement only with confirmation', () => {
    const original = assessment('baseline');
    const retake = createMovementAssessment({
      checkUpId: '2026-06-02T08:00:00.000Z',
      type: 'baseline_retake',
      score: score('strength'),
      scoreSnapshot: scoreSnapshotFor(score('strength')),
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
    const inputScore = score('mobility');
    const scoreSnapshot = scoreSnapshotFor(inputScore);
    const sourceAssessment = createMovementAssessment({
      checkUpId: START,
      type: 'baseline',
      score: inputScore,
      scoreSnapshot,
      completedAt: START,
      isOfficialForProgress: true,
    });
    const b = createMovementBlockFromAssessment({
      latestAssessment: { score: inputScore, scoreSnapshot, id: 'assessment-1', assessment: sourceAssessment },
      lifeGoal: createLifeGoal({ category: 'gardening_hobbies', nowIso: START }),
      startDate: START,
    });
    const session = generateTodaySession({
      activeBlock: b,
      safetyProfile: safety(),
      recentCompletions: [],
      adherenceState: 'on_track',
      today: START,
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
    expect(report.summary).toContain("direct comparison isn't available");
    expect(report.comparison?.status).toBe('missing_snapshot');
  });

  it('keeps core flow copy away from banned phrases', () => {
    const samples = getManualCheckupOptions({ latestAssessment: assessment(), activeBlock: block(), completions: [] })
      .map((o) => `${o.title} ${o.body}`)
      .join(' ');
    expect(samples.toLowerCase()).not.toMatch(
      /failed|lost streak|fall risk|diagnosis|treatment|frailty|disease|patient|medical-grade|prevent falls|prevent disease/
    );
  });
});

function scheduledBlockCompletions(block: MovementBlock): ReturnType<typeof makeTrainingSessionCompletion>[] {
  return [
    ...scheduledWeekCompletions(block, '2026-06-01'),
    ...scheduledWeekCompletions(block, '2026-06-08'),
    ...scheduledWeekCompletions(block, '2026-06-15'),
    ...scheduledWeekCompletions(block, '2026-06-22'),
  ];
}

function retestCompletion(block: MovementBlock): ReturnType<typeof makeTrainingSessionCompletion> {
  return makeTrainingSessionCompletion({
    block,
    sessionType: 'retest',
    completedAt: '2026-06-29T08:00:00.000Z',
    plannedDate: 'retest',
  });
}

function scheduledWeekCompletions(block: MovementBlock, startDateKey: string): ReturnType<typeof makeTrainingSessionCompletion>[] {
  const [year, month, day] = startDateKey.split('-').map(Number);
  const base = Date.UTC(year, month - 1, day, 9);
  return ['A', 'B', 'C'].map((label, index) => {
    const completedAt = new Date(base + index * 86400000).toISOString();
    const templateId = `${templatePrefix(block)}-${label}`;
    return creditedCompletion(block, templateId, completedAt);
  });
}

function templatePrefix(block: MovementBlock): 'strength' | 'balance' | 'mobility' {
  if (block.focusDomain === 'balance') return 'balance';
  if (block.focusDomain === 'mobility') return 'mobility';
  return 'strength';
}
