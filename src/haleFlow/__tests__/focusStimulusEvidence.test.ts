import type { MovementBlock } from '../../adherence';
import { BALANCE_TANDEM_ID, STS_SLOW_ECC_ID, STS_STANDARD_ID } from '../../exercises';
import type { TrainingSessionResult } from '../../training';
import {
  evaluateCompletedFocusStimulusEvidence,
  evaluatePlannedFocusStimulus,
  focusStimulusEvidenceSummary,
} from '../focusStimulusEvidence';
import type { HaleSessionPlan } from '../types';

const START = '2026-06-01T08:00:00.000Z';

function block(overrides: Partial<MovementBlock> = {}): MovementBlock {
  return {
    id: 'movement-block-main-plan',
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
    createdAt: START,
    updatedAt: START,
    ...overrides,
  };
}

function plan(overrides: Partial<HaleSessionPlan> = {}): HaleSessionPlan {
  return {
    id: 'generated-strength-A',
    blockId: 'movement-block-main-plan',
    title: 'Strength Session A',
    purposeCopy: 'Move comfortably.',
    sessionType: 'standard',
    estimatedMinutes: 20,
    focusDomain: 'strength_power',
    exercises: [
      {
        id: STS_STANDARD_ID,
        family: 'sit_to_stand',
        name: 'Sit to stand',
        domain: 'strength_power',
        level: 1,
      },
      {
        id: BALANCE_TANDEM_ID,
        family: 'tandem_balance',
        name: 'Balance support',
        domain: 'balance',
        level: 1,
      },
    ],
    metadata: {
      source: 'block_generated',
      generatedSessionId: 'generated-strength-A',
      templateId: 'strength-A',
      plannedDateKey: 'strength-A:2026-06-01',
      generatedExercises: [
        {
          exerciseId: STS_STANDARD_ID,
          intendedDomain: 'strength_power',
          stimulusRole: 'primary',
          stimulusReason: 'direct_match',
        },
        {
          exerciseId: BALANCE_TANDEM_ID,
          intendedDomain: 'balance_stability',
          stimulusRole: 'supporting',
          stimulusReason: 'supporting_maintenance',
        },
      ],
      slotStimulus: [
        {
          slotId: 'lower-strength-a',
          slotType: 'lower_body_strength',
          slotTitle: 'Lower strength',
          intendedDomain: 'strength_power',
          role: 'primary',
          reason: 'direct_match',
          message: 'Matched.',
          exerciseId: STS_STANDARD_ID,
        },
      ],
    },
    ...overrides,
  };
}

function result(completedIds: readonly string[]): TrainingSessionResult {
  return {
    startedAt: '2026-06-01T09:00:00.000Z',
    items: completedIds.map((exerciseId) => ({ exerciseId, status: 'completed', sets: [] })),
  };
}

describe('focus stimulus evidence', () => {
  it('finds planned primary focus stimulus from explicit Stage 4B metadata', () => {
    const evidence = evaluatePlannedFocusStimulus(plan(), block());

    expect(evidence.status).toBe('eligible');
    expect(evidence.mainPlanCreditPotential).toBe(true);
    expect(evidence.plannedPrimaryFocusExerciseIds).toEqual([STS_STANDARD_ID]);
    expect(evidence.plannedSupportingExerciseIds).toEqual([BALANCE_TANDEM_ID]);
  });

  it('credits completion only when at least one planned primary focus exercise is completed', () => {
    const credited = evaluateCompletedFocusStimulusEvidence({
      sessionPlan: plan(),
      result: result([STS_STANDARD_ID]),
      activeBlock: block(),
    });
    const supportingOnly = evaluateCompletedFocusStimulusEvidence({
      sessionPlan: plan(),
      result: result([BALANCE_TANDEM_ID]),
      activeBlock: block(),
    });

    expect(credited.mainPlanCredit).toBe(true);
    expect(credited.status).toBe('credited_focus_work');
    expect(supportingOnly.mainPlanCredit).toBe(false);
    expect(supportingOnly.status).toBe('primary_focus_not_completed');
    expect(supportingOnly.exclusionReason).toBe('supporting_only');
  });

  it('marks block-generated supporting/fallback-only plans as unable to earn main-plan credit', () => {
    const supportingPlan = plan({
      exercises: [
        {
          id: STS_SLOW_ECC_ID,
          family: 'squat',
          name: 'Fallback strength',
          domain: 'strength_power',
          level: 1,
        },
        {
          id: BALANCE_TANDEM_ID,
          family: 'tandem_balance',
          name: 'Balance support',
          domain: 'balance',
          level: 1,
        },
      ],
      metadata: {
        source: 'block_generated',
        generatedSessionId: 'generated-strength-A',
        templateId: 'strength-A',
        plannedDateKey: 'strength-A:2026-06-01',
        generatedExercises: [
          {
            exerciseId: STS_SLOW_ECC_ID,
            intendedDomain: 'strength_power',
            stimulusRole: 'fallback',
            stimulusReason: 'equipment_limited',
          },
          {
            exerciseId: BALANCE_TANDEM_ID,
            intendedDomain: 'balance_stability',
            stimulusRole: 'supporting',
            stimulusReason: 'supporting_maintenance',
          },
        ],
        slotStimulus: [
          {
            slotId: 'lower-strength-a',
            slotType: 'lower_body_strength',
            slotTitle: 'Lower strength',
            intendedDomain: 'strength_power',
            role: 'fallback',
            reason: 'equipment_limited',
            message: 'Used a lower-equipment option.',
            exerciseId: STS_SLOW_ECC_ID,
          },
        ],
      },
    });
    const planned = evaluatePlannedFocusStimulus(supportingPlan, block());
    const completed = evaluateCompletedFocusStimulusEvidence({
      sessionPlan: supportingPlan,
      result: result([STS_SLOW_ECC_ID, BALANCE_TANDEM_ID]),
      activeBlock: block(),
    });

    expect(planned.status).toBe('no_primary_focus_planned');
    expect(planned.mainPlanCreditPotential).toBe(false);
    expect(planned.fallbackFocusSlotIds).toEqual(['lower-strength-a']);
    expect(planned.focusStimulusExclusionReasons).toEqual(['equipment_limited']);
    expect(completed.mainPlanCredit).toBe(false);
    expect(completed.status).toBe('no_primary_focus_planned');
    expect(focusStimulusEvidenceSummary(completed).focusStimulusExclusionReasons).toEqual(['equipment_limited']);
  });

  it('fails closed when current block-generated plans lack structured stimulus metadata', () => {
    const evidence = evaluateCompletedFocusStimulusEvidence({
      sessionPlan: {
        ...plan(),
        metadata: {
          source: 'block_generated',
          templateId: 'strength-A',
          plannedDateKey: 'strength-A:2026-06-01',
        },
      },
      result: result([STS_STANDARD_ID]),
      activeBlock: block(),
    });

    expect(evidence.mainPlanCredit).toBe(false);
    expect(evidence.status).toBe('missing_stimulus_metadata');
    expect(evidence.exclusionReason).toBe('missing_stimulus_metadata');
  });

  it('does not infer focus credit from exercise names or domains on legacy fallback plans', () => {
    const evidence = evaluateCompletedFocusStimulusEvidence({
      sessionPlan: {
        ...plan(),
        metadata: {
          source: 'legacy_fallback',
          templateId: 'strength-A',
          plannedDateKey: 'strength-A:2026-06-01',
          generatedExercises: [
            {
              exerciseId: STS_STANDARD_ID,
              intendedDomain: 'strength_power',
              stimulusRole: 'primary',
              stimulusReason: 'direct_match',
            },
          ],
        },
      },
      result: result([STS_STANDARD_ID]),
      activeBlock: block(),
    });

    expect(evidence.mainPlanCredit).toBe(false);
    expect(evidence.status).toBe('not_main_plan');
    expect(evidence.exclusionReason).toBe('not_main_plan');
  });

  it('reports focus mismatch for primary stimulus aimed at another domain', () => {
    const evidence = evaluatePlannedFocusStimulus(
      {
        ...plan(),
        metadata: {
          ...plan().metadata!,
          generatedExercises: [
            {
              exerciseId: STS_STANDARD_ID,
              intendedDomain: 'balance_stability',
              stimulusRole: 'primary',
              stimulusReason: 'direct_match',
            },
          ],
        },
      },
      block()
    );

    expect(evidence.status).toBe('focus_mismatch');
    expect(evidence.mainPlanCreditPotential).toBe(false);
    expect(evidence.focusMismatchExerciseIds).toEqual([STS_STANDARD_ID]);
  });

  it('keeps valid primary focus work creditable when another metadata row is malformed', () => {
    const evidence = evaluateCompletedFocusStimulusEvidence({
      sessionPlan: {
        ...plan(),
        metadata: {
          ...plan().metadata!,
          generatedExercises: [
            {
              exerciseId: STS_STANDARD_ID,
              intendedDomain: 'strength_power',
              stimulusRole: 'primary',
              stimulusReason: 'direct_match',
            },
            {
              exerciseId: BALANCE_TANDEM_ID,
              intendedDomain: 'balance_stability',
            },
          ],
        },
      },
      result: result([STS_STANDARD_ID]),
      activeBlock: block(),
    });

    expect(evidence.mainPlanCredit).toBe(true);
    expect(evidence.malformedMetadataExerciseIds).toEqual([BALANCE_TANDEM_ID]);
    expect(focusStimulusEvidenceSummary(evidence).completedPrimaryFocusExerciseCount).toBe(1);
  });
});
