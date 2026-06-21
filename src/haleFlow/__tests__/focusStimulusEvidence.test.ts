import type { MovementBlock, MovementDomain } from '../../adherence';
import {
  BALANCE_TANDEM_ID,
  HAMSTRING_REACH_ID,
  STS_SLOW_ECC_ID,
  STS_STANDARD_ID,
  THORACIC_ROTATION_ID,
} from '../../exercises';
import type { TrainingSessionResult } from '../../training';
import type { TrainingDomain } from '../../training/workoutGeneration';
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

function domainPlan({
  focusDomain,
  exerciseId,
  trainingDomain,
}: {
  focusDomain: MovementDomain;
  exerciseId: string;
  trainingDomain: TrainingDomain;
}): HaleSessionPlan {
  const templatePrefix = focusDomain === 'balance' ? 'balance' : focusDomain === 'mobility' ? 'mobility' : 'strength';
  return {
    ...plan(),
    id: `generated-${templatePrefix}-A`,
    title: `${templatePrefix} Session A`,
    focusDomain,
    exercises: [
      {
        id: exerciseId,
        family: focusDomain === 'balance' ? 'tandem_balance' : focusDomain === 'mobility' ? 'hip_mobility' : 'sit_to_stand',
        name: `${templatePrefix} primary`,
        domain: focusDomain,
        level: 1,
      },
    ],
    metadata: {
      source: 'block_generated',
      generatedSessionId: `generated-${templatePrefix}-A`,
      templateId: `${templatePrefix}-A`,
      plannedDateKey: `${templatePrefix}-A:2026-06-01`,
      generatedExercises: [
        {
          exerciseId,
          intendedDomain: trainingDomain,
          stimulusRole: 'primary',
          stimulusReason: 'direct_match',
        },
      ],
      slotStimulus: [
        {
          slotId: `${templatePrefix}-primary-a`,
          slotType: focusDomain === 'balance' ? 'balance' : focusDomain === 'mobility' ? 'mobility' : 'lower_body_strength',
          slotTitle: `${templatePrefix} primary`,
          intendedDomain: trainingDomain,
          role: 'primary',
          reason: 'direct_match',
          message: 'Matched.',
          exerciseId,
        },
      ],
    },
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

  it.each([
    ['strength', 'strength_power', 'strength_power', STS_STANDARD_ID],
    ['balance', 'balance', 'balance_stability', BALANCE_TANDEM_ID],
    ['mobility', 'mobility', 'mobility_flexibility', HAMSTRING_REACH_ID],
  ] as const)('finds planned primary focus stimulus for %s blocks', (_label, focusDomain, trainingDomain, exerciseId) => {
    const evidence = evaluatePlannedFocusStimulus(
      domainPlan({ focusDomain, trainingDomain, exerciseId }),
      block({ focusDomain })
    );

    expect(evidence.status).toBe('eligible');
    expect(evidence.mainPlanCreditPotential).toBe(true);
    expect(evidence.blockFocusDomain).toBe(focusDomain);
    expect(evidence.blockFocusTrainingDomain).toBe(trainingDomain);
    expect(evidence.plannedPrimaryFocusExerciseIds).toEqual([exerciseId]);
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

  it('allows partial credit when one planned primary focus exercise is completed and other work is skipped', () => {
    const evidence = evaluateCompletedFocusStimulusEvidence({
      sessionPlan: plan(),
      result: {
        startedAt: '2026-06-01T09:00:00.000Z',
        items: [
          { exerciseId: STS_STANDARD_ID, status: 'completed', sets: [] },
          { exerciseId: BALANCE_TANDEM_ID, status: 'skipped', sets: [] },
        ],
      },
      activeBlock: block(),
    });

    expect(evidence.mainPlanCredit).toBe(true);
    expect(evidence.status).toBe('credited_focus_work');
    expect(evidence.completedPrimaryFocusExerciseIds).toEqual([STS_STANDARD_ID]);
    expect(evidence.workEvidence.skippedExerciseIds).toEqual([BALANCE_TANDEM_ID]);
  });

  it('fails closed when duplicate or malformed result evidence targets the primary focus exercise', () => {
    const duplicate = evaluateCompletedFocusStimulusEvidence({
      sessionPlan: plan(),
      result: result([STS_STANDARD_ID, STS_STANDARD_ID]),
      activeBlock: block(),
    });
    const malformed = evaluateCompletedFocusStimulusEvidence({
      sessionPlan: plan(),
      result: {
        startedAt: '2026-06-01T09:00:00.000Z',
        items: [{ exerciseId: STS_STANDARD_ID, status: 'completed' } as never],
      },
      activeBlock: block(),
    });

    expect(duplicate.mainPlanCredit).toBe(false);
    expect(duplicate.status).toBe('no_completed_work');
    expect(duplicate.workEvidence.duplicateExerciseIds).toEqual([STS_STANDARD_ID]);
    expect(malformed.mainPlanCredit).toBe(false);
    expect(malformed.status).toBe('no_completed_work');
    expect(malformed.workEvidence.malformedExerciseIds).toEqual([STS_STANDARD_ID]);
  });

  it('reports cross-domain-only work when a wrong-domain primary is completed instead of the block focus', () => {
    const evidence = evaluateCompletedFocusStimulusEvidence({
      sessionPlan: {
        ...plan(),
        exercises: [
          ...plan().exercises,
          {
            id: HAMSTRING_REACH_ID,
            family: 'hip_mobility',
            name: 'Hamstring reach',
            domain: 'mobility',
            level: 1,
          },
        ],
        metadata: {
          ...plan().metadata!,
          generatedExercises: [
            ...(plan().metadata?.generatedExercises ?? []),
            {
              exerciseId: HAMSTRING_REACH_ID,
              intendedDomain: 'mobility_flexibility',
              stimulusRole: 'primary',
              stimulusReason: 'direct_match',
            },
          ],
        },
      },
      result: result([HAMSTRING_REACH_ID]),
      activeBlock: block(),
    });

    expect(evidence.mainPlanCredit).toBe(false);
    expect(evidence.status).toBe('primary_focus_not_completed');
    expect(evidence.exclusionReason).toBe('cross_domain_only');
    expect(evidence.completedCrossDomainExerciseIds).toEqual([HAMSTRING_REACH_ID]);
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

  it('fails closed when duplicate generated metadata makes primary focus identity ambiguous', () => {
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
    expect(evidence.status).toBe('missing_stimulus_metadata');
    expect(evidence.malformedMetadataExerciseIds).toEqual([STS_STANDARD_ID]);
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

  it('uses the concrete active block focus for exact or near ties instead of recomputing from plan content', () => {
    const exactTieBlock = block({
      focusDomain: 'balance',
      focusSelectionKind: 'exact_tie',
      focusTiedDomains: ['strength_power', 'balance'],
      focusTieBreakReason: 'deterministic_fallback',
    });
    const nearTieBlock = block({
      focusDomain: 'mobility',
      focusSelectionKind: 'near_tie',
      focusTiedDomains: ['strength_power', 'mobility'],
      focusTieBreakReason: 'near_tie_deterministic_fallback',
      focusNearTieMarginYears: 2,
    });

    expect(
      evaluateCompletedFocusStimulusEvidence({
        sessionPlan: domainPlan({
          focusDomain: 'balance',
          trainingDomain: 'balance_stability',
          exerciseId: BALANCE_TANDEM_ID,
        }),
        result: result([BALANCE_TANDEM_ID]),
        activeBlock: exactTieBlock,
      }).mainPlanCredit
    ).toBe(true);
    const nearTieEvidence = evaluateCompletedFocusStimulusEvidence({
      sessionPlan: domainPlan({
        focusDomain: 'mobility',
        trainingDomain: 'mobility_flexibility',
        exerciseId: THORACIC_ROTATION_ID,
      }),
      result: result([THORACIC_ROTATION_ID]),
      activeBlock: nearTieBlock,
    });

    expect(nearTieEvidence.mainPlanCredit).toBe(true);
    expect(nearTieEvidence.blockFocusDomain).toBe('mobility');
    expect(nearTieEvidence.plannedPrimaryFocusExerciseIds).toEqual([THORACIC_ROTATION_ID]);
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
