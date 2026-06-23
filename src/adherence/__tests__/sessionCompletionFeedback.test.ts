import type {
  MovementBlock,
  TrainingFocusStimulusEvidenceSummary,
  TrainingFocusStimulusPlanStatus,
  TrainingSessionCompletion,
} from '../types';
import { focusStimulusPreviewCopy, sessionPreviewTitle } from '../../screens/SessionPreviewScreen';
import { buildSessionFeedback, sessionCompletionCopy } from '../screens/SessionCompletionScreen';
import type { HaleSessionPlan } from '../../haleFlow';

describe('SessionCompletionScreen feedback payload', () => {
  it('submits RPE with no discomfort by default', () => {
    expect(buildSessionFeedback({ effort: 3, painReported: false })).toEqual({
      perceivedEffort: 3,
      painReported: false,
      painArea: undefined,
      completed: true,
      trackingQuality: 'good',
    });
  });

  it('submits discomfort and pain area when selected', () => {
    expect(buildSessionFeedback({ effort: 5, painReported: true, painArea: 'knee', trackingQuality: 'poor' })).toEqual({
      perceivedEffort: 5,
      painReported: true,
      painArea: 'knee',
      completed: true,
      trackingQuality: 'poor',
    });
  });
});

describe('session completion and preview credit copy', () => {
  it('distinguishes zero-work, supporting-only, fallback-only, and credited primary-focus work', () => {
    const b = block();
    const zero = completion(b, {
      mainPlanCredit: false,
      workEvidence: {
        plannedExerciseCount: 2,
        resultItemCount: 0,
        completedExerciseCount: 0,
        skippedExerciseCount: 0,
        missingResultCount: 2,
        duplicateResultCount: 0,
        malformedResultCount: 0,
        unmatchedResultCount: 0,
      },
    });
    const supporting = completion(b, {
      mainPlanCredit: false,
      workEvidence: { ...zero.workEvidence!, resultItemCount: 1, completedExerciseCount: 1, missingResultCount: 1 },
      focusStimulusEvidence: focusEvidence({
        status: 'primary_focus_not_completed',
        exclusionReason: 'supporting_only',
        mainPlanCredit: false,
        completedPrimaryFocusExerciseCount: 0,
        completedSupportingExerciseCount: 1,
      }),
    });
    const fallback = completion(b, {
      mainPlanCredit: false,
      workEvidence: { ...zero.workEvidence!, resultItemCount: 1, completedExerciseCount: 1, missingResultCount: 1 },
      focusStimulusEvidence: focusEvidence({
        status: 'primary_focus_not_completed',
        exclusionReason: 'fallback_only',
        mainPlanCredit: false,
        completedPrimaryFocusExerciseCount: 0,
        completedFallbackExerciseCount: 1,
      }),
    });
    const credited = completion(b, {
      mainPlanCredit: true,
      focusStimulusEvidence: focusEvidence(),
    });
    const adjustedCredited = completion(b, {
      mainPlanCredit: true,
      focusStimulusEvidence: focusEvidence(),
      progressionEvidencePolicy: 'hold_only',
    });

    expect(copyFor(b, zero).title).toBe('No plan credit added.');
    expect(copyFor(b, supporting).eyebrow).toBe('Session saved');
    expect(copyFor(b, supporting).cardTitle).toBe('Your main plan is unchanged.');
    expect(copyFor(b, fallback).eyebrow).toBe('Session saved');
    expect(copyFor(b, fallback).subtitle).toContain('did not move your main plan forward');
    expect(copyFor(b, credited).eyebrow).toBe('Session saved');
    expect(copyFor(b, credited).cardTitle).toBe('Your plan moved forward.');
    expect(copyFor(b, adjustedCredited).cardTitle).toBe('Your plan moved forward.');
    expect(copyFor(b, adjustedCredited).body).toContain('keep the next session at this level');
  });

  it('explains non-credit preview states before a block-generated session starts', () => {
    expect(focusStimulusPreviewCopy(plan('no_primary_focus_planned'))).toContain('could not safely include');
    expect(focusStimulusPreviewCopy(plan('focus_mismatch'))).toContain('different from your main');
    expect(focusStimulusPreviewCopy(plan('missing_stimulus_metadata'))).toContain('cannot confirm');
    expect(focusStimulusPreviewCopy(plan('eligible', true))).toBeNull();
    expect(focusStimulusPreviewCopy(plan('eligible', true, 'hold_only'))).toBeNull();
    expect(focusStimulusPreviewCopy(plan('eligible', true, 'hold_only', 'shorter'))).toBe(
      'Hale has shortened today\'s session.'
    );
    expect(focusStimulusPreviewCopy(plan('eligible', true, 'hold_only', 'gentler'))).toBe(
      'Hale has made today\'s session gentler.'
    );
    expect(focusStimulusPreviewCopy(plan('eligible', true, 'hold_only', 'something_hurts'))).toBe(
      'Hale has adjusted today\'s session to be more careful.'
    );
    expect(focusStimulusPreviewCopy(plan('eligible', true, 'normal', 'no_equipment'))).toBe(
      'Hale has adjusted today\'s session for the setup you have today.'
    );
  });

  it('uses the selected workout name for session preview titles', () => {
    const standardPlan = plan('eligible', true);
    expect(sessionPreviewTitle(standardPlan)).toBe('Strength Session A');

    const presetPlan = plan('eligible', true);
    presetPlan.title = 'Quick Full-Body Hale Session';
    presetPlan.metadata = {
      ...presetPlan.metadata!,
      source: 'preset',
      templateId: 'preset-quick-full-body',
    };

    expect(sessionPreviewTitle(presetPlan)).toBe('Quick Full Body');
  });
});

function block(): MovementBlock {
  return {
    id: 'movement-block-main-plan',
    userId: 'local-device-user',
    status: 'active',
    startDate: '2026-06-01T08:00:00.000Z',
    endDate: '2026-06-29T08:00:00.000Z',
    retestDate: '2026-06-29T08:00:00.000Z',
    focusDomain: 'strength_power',
    secondaryDomains: ['balance', 'mobility'],
    sessionsPerWeekTarget: 3,
    totalPlannedSessions: 12,
    completedSessions: 0,
    microChecksCompleted: 0,
    createdAt: '2026-06-01T08:00:00.000Z',
    updatedAt: '2026-06-01T08:00:00.000Z',
  };
}

function completion(
  b: MovementBlock,
  overrides: Partial<TrainingSessionCompletion> = {}
): TrainingSessionCompletion {
  return {
    id: 'completion-strength-A',
    userId: 'local-device-user',
    blockId: b.id,
    plannedDate: 'strength-A:2026-06-01',
    completedAt: '2026-06-01T09:00:00.000Z',
    sessionType: 'standard',
    focusDomain: b.focusDomain,
    source: 'block_generated',
    templateId: 'strength-A',
    mainPlanCredit: true,
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
    focusStimulusEvidence: focusEvidence(),
    ...overrides,
  };
}

function focusEvidence(
  overrides: Partial<TrainingFocusStimulusEvidenceSummary> = {}
): TrainingFocusStimulusEvidenceSummary {
  return {
    planStatus: 'eligible',
    status: 'credited_focus_work',
    exclusionReason: 'none',
    mainPlanCredit: true,
    blockFocusDomain: 'strength_power',
    plannedPrimaryFocusExerciseCount: 1,
    completedPrimaryFocusExerciseCount: 1,
    completedSupportingExerciseCount: 0,
    completedFallbackExerciseCount: 0,
    completedCrossDomainExerciseCount: 0,
    plannedPrimaryFocusExerciseIds: ['sts-standard'],
    completedPrimaryFocusExerciseIds: ['sts-standard'],
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

function copyFor(block: MovementBlock, completion: TrainingSessionCompletion) {
  return sessionCompletionCopy({
    block,
    completion,
    credited: completion.mainPlanCredit === true && completion.focusStimulusEvidence?.mainPlanCredit === true,
    restarted: completion.sessionType === 'restart',
    progressionEvidencePolicy: completion.progressionEvidencePolicy,
  });
}

function plan(
  status: TrainingFocusStimulusPlanStatus,
  mainPlanCreditPotential = false,
  progressionEvidencePolicy: NonNullable<HaleSessionPlan['metadata']>['progressionEvidencePolicy'] = 'normal',
  userAdjustment: NonNullable<HaleSessionPlan['metadata']>['userAdjustment'] = null
): HaleSessionPlan {
  return {
    id: 'generated-strength-A',
    blockId: 'movement-block-main-plan',
    title: 'Strength Session A',
    purposeCopy: 'Move comfortably.',
    sessionType: 'standard',
    estimatedMinutes: 20,
    focusDomain: 'strength_power',
    exercises: [],
    metadata: {
      source: 'block_generated',
      templateId: 'strength-A',
      plannedDateKey: 'strength-A:2026-06-01',
      progressionEvidencePolicy,
      userAdjustment,
      focusStimulus: {
        status,
        mainPlanCreditPotential,
        blockFocusDomain: 'strength_power',
        blockFocusTrainingDomain: 'strength_power',
        plannedPrimaryFocusExerciseIds: mainPlanCreditPotential ? ['sts-standard'] : [],
        plannedSupportingExerciseIds: [],
        plannedFallbackExerciseIds: [],
        plannedCrossDomainExerciseIds: [],
        fallbackFocusSlotIds: status === 'no_primary_focus_planned' ? ['lower-strength-a'] : [],
        skippedFocusSlotIds: [],
        focusStimulusExclusionReasons: [],
        missingMetadataExerciseIds: [],
        malformedMetadataExerciseIds: status === 'missing_stimulus_metadata' ? ['sts-standard'] : [],
        focusMismatchExerciseIds: status === 'focus_mismatch' ? ['sts-standard'] : [],
      },
    },
  };
}
