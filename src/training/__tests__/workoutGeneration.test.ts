import {
  BALANCE_FEET_TOGETHER_ID,
  BALANCE_SINGLE_LEG_ID,
  BALANCE_TANDEM_ID,
  BRIDGE_HOLD_ID,
  HINGE_FREE_ID,
  LOADED_MARCH_ID,
  SEATED_BAND_ROW_ID,
  STANDING_BAND_ROW_ID,
  STEP_UP_ID,
  PUSHUP_INCLINE_ID,
  PUSHUP_STANDARD_ID,
  STS_POWER_ID,
  STS_SLOW_ECC_ID,
  STS_STANDARD_ID,
} from '../../exercises';
import {
  createSessionTemplatesForFocus,
  createTrainingBlockFromAssessment,
  generatePresetSession,
  generateTodaySession,
  getTemplateSelection,
  listExtraSessionPresets,
  selectNextSessionTemplate,
  updateLadderProgressAfterSession,
  type LadderProgress,
} from '../workoutGeneration';
import { formatDebugWorkoutScenarios, generateDebugWorkoutScenarios } from '../debugWorkoutScenarios';
import type { ValidTimeProgressionSignal, ValidTimeProgressionSummary } from '../validTimeProgression';

const START = '2026-06-01T08:00:00.000Z';

describe('dynamic workout generation', () => {
  it('creates a 4-week block biased to the weakest assessment domain', () => {
    const block = createTrainingBlockFromAssessment({
      userId: 'user-1',
      assessmentId: 'assessment-1',
      domainScores: {
        strength_power: 74,
        balance_stability: 42,
        mobility_flexibility: 68,
      },
      startDate: START,
    });

    expect(block.focusDomain).toBe('balance_stability');
    expect(block.totalPlannedSessions).toBe(12);
    expect(block.templates).toHaveLength(3);
    expect(block.templates[0].id).toBe('balance-A');
  });

  it('selects the next A/B/C template and reports when the week is complete', () => {
    const block = createTrainingBlockFromAssessment({ focusDomain: 'strength_power', startDate: START });
    expect(selectNextSessionTemplate(block, [], START)?.id).toBe('strength-A');
    expect(
      selectNextSessionTemplate(
        block,
        [{ templateId: 'strength-A', completedAt: '2026-06-01T10:00:00.000Z' }],
        START
      )?.id
    ).toBe('strength-B');
    const selection = getTemplateSelection(
      block,
      [
        { templateId: 'strength-A', completedAt: '2026-06-01T10:00:00.000Z' },
        { templateId: 'strength-B', completedAt: '2026-06-03T10:00:00.000Z' },
        { templateId: 'strength-C', completedAt: '2026-06-05T10:00:00.000Z' },
      ],
      '2026-06-05T12:00:00.000Z'
    );
    expect(selection.status).toBe('week_complete');
    expect(selection.template).toBeNull();
  });

  it('does not let duplicate template completions substitute for missing A/B/C sessions', () => {
    const block = createTrainingBlockFromAssessment({ focusDomain: 'strength_power', startDate: START });
    expect(
      getTemplateSelection(
        block,
        [
          { templateId: 'strength-A', completedAt: '2026-06-01T10:00:00.000Z' },
          { templateId: 'strength-A', completedAt: '2026-06-02T10:00:00.000Z' },
          { templateId: 'strength-C', completedAt: '2026-06-05T10:00:00.000Z' },
        ],
        '2026-06-05T12:00:00.000Z'
      ).template?.id
    ).toBe('strength-B');
  });

  it('avoids missing bands, stairs, loads, and support equipment', () => {
    const block = createTrainingBlockFromAssessment({ focusDomain: 'strength_power', startDate: START });
    const session = generateTodaySession({
      block,
      today: START,
      availableEquipment: ['chair', 'wall'],
    });

    const equipment = session.exercises.flatMap((exercise) => exercise.equipment);
    expect(equipment).not.toContain('long_band');
    expect(equipment).not.toContain('mini_band');
    expect(equipment).not.toContain('stair');
    expect(equipment).not.toContain('backpack_or_weight');
  });

  it('requires explicit floor-space availability before selecting floor exercises', () => {
    const template = createSessionTemplatesForFocus('strength_power')[2];
    const ladderProgress = {
      'hinge-glutes': progress('hinge-glutes', BRIDGE_HOLD_ID),
    };
    const withoutFloor = generateTodaySession({
      template,
      today: START,
      availableEquipment: ['chair', 'wall'],
      ladderProgress,
    });
    const withFloor = generateTodaySession({
      template,
      today: START,
      availableEquipment: ['chair', 'wall', 'floor_space'],
      ladderProgress,
    });

    expect(withoutFloor.exercises.map((exercise) => exercise.exerciseId)).not.toContain(BRIDGE_HOLD_ID);
    expect(withoutFloor.exercises.map((exercise) => exercise.exerciseId)).toContain(HINGE_FREE_ID);
    expect(withoutFloor.exercises.flatMap((exercise) => exercise.equipment)).not.toContain('floor');
    expect(withFloor.exercises.map((exercise) => exercise.exerciseId)).toContain(BRIDGE_HOLD_ID);
    expect(withFloor.exercises.flatMap((exercise) => exercise.equipment)).toContain('floor');
  });

  it('requires stair plus nearby support before selecting step-up', () => {
    const template = createSessionTemplatesForFocus('strength_power')[1];
    const stairsOnly = generateTodaySession({
      template,
      today: START,
      availableEquipment: ['stairs'],
    });
    const stairsWithSupport = generateTodaySession({
      template,
      today: START,
      availableEquipment: ['stairs', 'wall'],
    });

    expect(stairsOnly.exercises.map((exercise) => exercise.exerciseId)).not.toContain(STEP_UP_ID);
    expect(stairsOnly.exercises.flatMap((exercise) => exercise.equipment)).not.toContain('stair');
    expect(stairsWithSupport.exercises.map((exercise) => exercise.exerciseId)).toContain(STEP_UP_ID);
  });

  it('does not give support-dependent balance drills to true no-equipment profiles', () => {
    const block = createTrainingBlockFromAssessment({ focusDomain: 'balance_stability', startDate: START });
    const session = generateTodaySession({
      block,
      today: START,
      availableEquipment: ['none'],
    });

    expect(session.exercises.map((exercise) => exercise.exerciseId)).not.toEqual(
      expect.arrayContaining(['balance-feet-together-hold', 'balance-tandem-hold', 'balance-single-leg-hold', 'supported-side-step', 'loaded-march'])
    );
    expect(session.exercises.some((exercise) => exercise.domain === 'balance_stability')).toBe(false);
    expect(session.skippedSlotReasons.join(' ')).toMatch(/support/);
    expect(session.slotStimulus.filter((stimulus) => stimulus.intendedDomain === 'balance_stability')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: 'skipped', reason: 'support_required' }),
      ])
    );
  });

  it('skips upper-back pulling honestly when no resistance band is available', () => {
    const template = createSessionTemplatesForFocus('strength_power')[0];
    const session = generateTodaySession({
      template,
      today: START,
      availableEquipment: ['chair', 'wall'],
    });

    expect(session.exercises.map((exercise) => exercise.ladderId)).not.toContain('pull-upper-back');
    expect(session.exercises.map((exercise) => exercise.exerciseId)).not.toContain('overhead-reach');
    expect(session.skippedSlots).toContain('upper-pull-a');
    expect(session.skippedSlotReasons.join(' ')).toMatch(/Upper-back pulling was skipped/);
    expect(session.skippedSlotReasons.join(' ')).toMatch(/did not replace it with shoulder mobility/);
    expect(session.slotStimulus.find((stimulus) => stimulus.slotId === 'upper-pull-a')).toMatchObject({
      role: 'skipped',
      reason: 'band_required',
    });
  });

  it('records stimulus roles for true no-equipment sessions instead of hiding dilution', () => {
    const strength = generateTodaySession({
      block: createTrainingBlockFromAssessment({ focusDomain: 'strength_power', startDate: START }),
      today: START,
      availableEquipment: ['none'],
    });
    const balance = generateTodaySession({
      block: createTrainingBlockFromAssessment({ focusDomain: 'balance_stability', startDate: START }),
      today: START,
      availableEquipment: ['none'],
    });
    const mobility = generateTodaySession({
      block: createTrainingBlockFromAssessment({ focusDomain: 'mobility_flexibility', startDate: START }),
      today: START,
      availableEquipment: ['none'],
    });

    for (const session of [strength, balance, mobility]) {
      expect(session.slotStimulus.length).toBeGreaterThan(0);
      expectNoUnsafeTrueNoEquipment(session);
      expect(session.slotStimulus.some((stimulus) => stimulus.role === 'primary')).toBe(true);
      expect(session.slotStimulus.every((stimulus) => stimulus.role !== 'invalid')).toBe(true);
    }

    expect(strength.slotStimulus.find((stimulus) => stimulus.slotType === 'upper_body_pull')).toMatchObject({
      role: 'skipped',
      reason: 'band_required',
    });
    expect(strength.guidance.join(' ')).toMatch(/resistance band/);
    expect(balance.exercises.some((exercise) => exercise.domain === 'balance_stability')).toBe(false);
    expect(balance.slotStimulus.filter((stimulus) => stimulus.intendedDomain === 'balance_stability')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: 'skipped', reason: 'support_required' }),
      ])
    );
    expect(mobility.slotStimulus.find((stimulus) => stimulus.intendedDomain === 'mobility_flexibility')).toMatchObject({
      role: 'primary',
    });
  });

  it('keeps supported focus-domain sessions primary when equipment makes them feasible', () => {
    const strength = generateTodaySession({
      block: createTrainingBlockFromAssessment({ focusDomain: 'strength_power', startDate: START }),
      today: START,
      availableEquipment: ['chair', 'wall'],
    });
    const balance = generateTodaySession({
      block: createTrainingBlockFromAssessment({ focusDomain: 'balance_stability', startDate: START }),
      today: START,
      availableEquipment: ['chair', 'wall'],
    });
    const mobility = generateTodaySession({
      block: createTrainingBlockFromAssessment({ focusDomain: 'mobility_flexibility', startDate: START }),
      today: START,
      availableEquipment: ['chair', 'wall'],
    });

    expect(strength.slotStimulus.find((stimulus) => stimulus.slotId === 'lower-strength-a')).toMatchObject({
      role: 'primary',
      reason: 'direct_match',
    });
    expect(balance.slotStimulus.find((stimulus) => stimulus.slotId === 'balance-a')).toMatchObject({
      role: 'primary',
      reason: 'direct_match',
      ladderId: 'balance',
    });
    expect(balance.slotStimulus.find((stimulus) => stimulus.slotId === 'lateral-a')).toMatchObject({
      role: 'primary',
      ladderId: 'lateral-stability',
    });
    expect(mobility.slotStimulus.find((stimulus) => stimulus.intendedDomain === 'mobility_flexibility')).toMatchObject({
      role: 'primary',
    });
  });

  it('treats the no-equipment quick preset as no optional equipment at home', () => {
    const session = generatePresetSession({
      presetId: 'preset-no-equipment-strength',
      today: START,
      availableEquipment: ['chair', 'wall'],
      sessionIntensity: 'beginner',
    });

    const equipment = session.exercises.flatMap((exercise) => exercise.equipment);
    expect(equipment).not.toContain('stair');
    expect(equipment).not.toContain('long_band');
    expect(equipment).not.toContain('mini_band');
    expect(equipment).not.toContain('backpack_or_weight');
    expect(session.exercises.map((exercise) => exercise.exerciseId)).toContain('sts-cushion');
    expect(session.exercises.map((exercise) => exercise.exerciseId)).toContain('push-up-wall');
  });

  it('compresses short-on-time sessions to strength, balance, and mobility', () => {
    const block = createTrainingBlockFromAssessment({ focusDomain: 'mobility_flexibility', startDate: START });
    const session = generateTodaySession({
      block,
      dailyReadiness: 'short_on_time',
      today: START,
      availableEquipment: ['chair', 'wall'],
    });

    expect(session.estimatedMinutes).toBe(10);
    expect(session.exercises.length).toBeLessThanOrEqual(3);
    expect(new Set(session.exercises.map((exercise) => exercise.domain))).toEqual(
      new Set(['strength_power', 'balance_stability', 'mobility_flexibility'])
    );
  });

  it('keeps short true-no-equipment sessions transparent when a domain cannot be safely trained', () => {
    const block = createTrainingBlockFromAssessment({ focusDomain: 'mobility_flexibility', startDate: START });
    const session = generateTodaySession({
      block,
      dailyReadiness: 'short_on_time',
      today: START,
      availableEquipment: ['none'],
    });

    expect(session.estimatedMinutes).toBe(10);
    expect(session.slotStimulus).toHaveLength(3);
    expectNoUnsafeTrueNoEquipment(session);
    expect(session.slotStimulus.find((stimulus) => stimulus.slotType === 'balance')).toMatchObject({
      role: 'skipped',
      reason: 'support_required',
    });
    expect(session.guidance.join(' ')).toMatch(/support/);
  });

  it('moves mobility first and eases the first strength prescription when a bit stiff', () => {
    const template = createSessionTemplatesForFocus('strength_power')[0];
    const ready = generateTodaySession({
      template,
      dailyReadiness: 'ready',
      today: START,
      availableEquipment: ['chair', 'wall'],
    });
    const stiff = generateTodaySession({
      template,
      dailyReadiness: 'a_bit_stiff',
      today: START,
      availableEquipment: ['chair', 'wall'],
    });

    expect(stiff.exercises[0].domain).toBe('mobility_flexibility');
    const readyStrength = ready.exercises.find((exercise) => exercise.domain === 'strength_power');
    const stiffStrength = stiff.exercises.find((exercise) => exercise.domain === 'strength_power');
    expect(stiffStrength?.repsPerSet ?? stiffStrength?.secondsPerSet).toBeLessThan(
      readyStrength?.repsPerSet ?? readyStrength?.secondsPerSet ?? Infinity
    );
  });

  it('avoids knee-sensitive choices when pain is reported', () => {
    const template = createSessionTemplatesForFocus('strength_power')[1];
    const session = generateTodaySession({
      template,
      dailyReadiness: 'something_hurts',
      painAreas: ['knee'],
      today: START,
      availableEquipment: ['chair', 'wall', 'stairs'],
    });

    expect(session.exercises.map((exercise) => exercise.ladderId)).not.toContain('step-up');
    expect(session.exercises.map((exercise) => exercise.exerciseId).join(' ')).not.toMatch(/split_squat|loaded_sit_to_stand/);
    expect(session.guidance.join(' ')).not.toMatch(/diagnosis|treatment|fall risk|frailty|medical-grade/i);
  });

  it('blocks shoulder rows and overhead work through the centralized discomfort policy', () => {
    const template = createSessionTemplatesForFocus('strength_power')[0];
    const session = generateTodaySession({
      template,
      dailyReadiness: 'something_hurts',
      painAreas: ['shoulder'],
      today: START,
      availableEquipment: ['chair', 'wall', 'resistance_band', 'door_anchor'],
    });

    expect(session.progressionEvidencePolicy).toBe('hold_only');
    expect(session.exercises.map((exercise) => exercise.exerciseId)).not.toEqual(
      expect.arrayContaining([SEATED_BAND_ROW_ID, STANDING_BAND_ROW_ID, 'band-pull-apart', 'overhead-reach', 'overhead-press-band'])
    );
    expect(session.slotStimulus.find((stimulus) => stimulus.slotType === 'upper_body_pull')).toMatchObject({
      role: 'skipped',
      reason: 'safety_limited',
    });
  });

  it('blocks ankle/foot-sensitive balance, marching, lateral, step, and calf work', () => {
    const template = createSessionTemplatesForFocus('balance_stability')[2];
    const session = generateTodaySession({
      template,
      dailyReadiness: 'something_hurts',
      painAreas: ['ankle'],
      today: START,
      availableEquipment: ['chair', 'wall', 'stairs'],
      ladderProgress: {
        balance: progress('balance', BALANCE_SINGLE_LEG_ID),
      },
    });

    const ids = session.exercises.map((exercise) => exercise.exerciseId);
    expect(ids).not.toContain(BALANCE_SINGLE_LEG_ID);
    expect(ids).not.toContain(LOADED_MARCH_ID);
    expect(session.exercises.map((exercise) => exercise.ladderId)).not.toEqual(
      expect.arrayContaining(['heel-toe-raise', 'lateral-stability', 'step-up'])
    );
  });

  it('fails closed for malformed daily inputs by producing a non-credit supporting session', () => {
    const template = createSessionTemplatesForFocus('strength_power')[0];
    const session = generateTodaySession({
      template,
      dailyReadiness: 'unknown' as never,
      painAreas: ['elbow'] as never,
      today: START,
      availableEquipment: ['chair', 'wall', 'resistance_band', 'door_anchor'],
    });

    expect(session.dailyContext?.inputStatus).toBe('malformed_fail_closed');
    expect(session.progressionEvidencePolicy).toBe('ineligible');
    expect(session.slotStimulus.every((stimulus) => stimulus.role !== 'primary')).toBe(true);
    expect(session.guidance.join(' ')).toMatch(/cautious supporting plan/);
  });

  it('temporarily lowers daily level for low readiness without mutating stored ladder progress', () => {
    const template = createSessionTemplatesForFocus('strength_power')[0];
    const ladderProgress = {
      'sit-to-stand': progress('sit-to-stand', STS_POWER_ID),
    };
    const session = generateTodaySession({
      template,
      dailyReadiness: 'low_energy',
      today: START,
      availableEquipment: ['chair', 'wall'],
      ladderProgress,
    });
    const strength = session.exercises.find((exercise) => exercise.ladderId === 'sit-to-stand');

    expect(session.progressionEvidencePolicy).toBe('hold_only');
    expect(strength?.requestedLevelId).toBe(STS_POWER_ID);
    expect(strength?.selectedDailyLevelId).toBe(STS_SLOW_ECC_ID);
    expect(strength?.sets).toBeLessThanOrEqual(strength?.doseBeforeAdjustment?.sets ?? Infinity);
    expect(ladderProgress['sit-to-stand'].currentLevelId).toBe(STS_POWER_ID);
  });

  it('keeps fully ready sessions normal for progression policy', () => {
    const session = generateTodaySession({
      block: createTrainingBlockFromAssessment({ focusDomain: 'strength_power', startDate: START }),
      today: START,
      availableEquipment: ['chair', 'wall'],
    });

    expect(session.dailyContext).toMatchObject({ readiness: 'ready', inputStatus: 'valid' });
    expect(session.progressionEvidencePolicy).toBe('normal');
  });

  it('progresses after two easy complete sessions at the same level', () => {
    const first = updateLadderProgressAfterSession(
      {},
      {
        completedAt: START,
        exercises: [
          {
            ladderId: 'sit-to-stand',
            levelId: STS_STANDARD_ID,
            completionRate: 0.9,
            perceivedEffort: 2,
            painReported: false,
            trackingQuality: 'good',
          },
        ],
      }
    );
    const second = updateLadderProgressAfterSession(first, {
      completedAt: '2026-06-03T08:00:00.000Z',
      exercises: [
        {
          ladderId: 'sit-to-stand',
          levelId: STS_STANDARD_ID,
          completionRate: 0.95,
          perceivedEffort: 2,
          painReported: false,
          trackingQuality: 'good',
        },
      ],
    });

    expect(first['sit-to-stand'].currentLevelId).toBe(STS_STANDARD_ID);
    expect(first['sit-to-stand'].readyToProgress).toBe(true);
    expect(second['sit-to-stand'].currentLevelId).toBe(STS_SLOW_ECC_ID);
  });

  it('lets strong valid-time work use the existing two-exposure progression rule', () => {
    const first = updateLadderProgressAfterSession(
      {},
      {
        completedAt: START,
        exercises: [
          {
            ladderId: 'balance',
            levelId: BALANCE_FEET_TOGETHER_ID,
            completionRate: 1,
            perceivedEffort: 2,
            painReported: false,
            trackingQuality: 'good',
            validTime: validTimeSummary('strong'),
          },
        ],
      }
    );
    const second = updateLadderProgressAfterSession(first, {
      completedAt: '2026-06-03T08:00:00.000Z',
      exercises: [
        {
          ladderId: 'balance',
          levelId: BALANCE_FEET_TOGETHER_ID,
          completionRate: 1,
          perceivedEffort: 2,
          painReported: false,
          trackingQuality: 'good',
          validTime: validTimeSummary('strong'),
        },
      ],
    });

    expect(first.balance.currentLevelId).toBe(BALANCE_FEET_TOGETHER_ID);
    expect(first.balance.readyToProgress).toBe(true);
    expect(second.balance.currentLevelId).toBe(BALANCE_TANDEM_ID);
  });

  it('holds a valid-time level when the target is reached with resets', () => {
    const first = updateLadderProgressAfterSession(
      {},
      {
        completedAt: START,
        exercises: [
          {
            ladderId: 'balance',
            levelId: BALANCE_FEET_TOGETHER_ID,
            completionRate: 1,
            perceivedEffort: 2,
            painReported: false,
            trackingQuality: 'good',
            validTime: validTimeSummary('completed_with_resets'),
          },
        ],
      }
    );
    const second = updateLadderProgressAfterSession(first, {
      completedAt: '2026-06-03T08:00:00.000Z',
      exercises: [
        {
          ladderId: 'balance',
          levelId: BALANCE_FEET_TOGETHER_ID,
          completionRate: 1,
          perceivedEffort: 2,
          painReported: false,
          trackingQuality: 'good',
          validTime: validTimeSummary('completed_with_resets'),
        },
      ],
    });

    expect(first.balance.currentLevelId).toBe(BALANCE_FEET_TOGETHER_ID);
    expect(first.balance.readyToProgress).toBe(false);
    expect(first.balance.completedSessionsAtLevel).toBe(0);
    expect(second.balance.currentLevelId).toBe(BALANCE_FEET_TOGETHER_ID);
  });

  it('restores pre-Phase-3 behavior when valid-time progression is disabled', () => {
    const first = updateLadderProgressAfterSession(
      {},
      {
        completedAt: START,
        exercises: [
          {
            ladderId: 'balance',
            levelId: BALANCE_FEET_TOGETHER_ID,
            completionRate: 1,
            perceivedEffort: 2,
            painReported: false,
            trackingQuality: 'good',
            validTime: validTimeSummary('completed_with_resets'),
          },
        ],
      },
      {},
      { validTimeProgressionEnabled: false }
    );
    const second = updateLadderProgressAfterSession(
      first,
      {
        completedAt: '2026-06-03T08:00:00.000Z',
        exercises: [
          {
            ladderId: 'balance',
            levelId: BALANCE_FEET_TOGETHER_ID,
            completionRate: 1,
            perceivedEffort: 2,
            painReported: false,
            trackingQuality: 'good',
            validTime: validTimeSummary('completed_with_resets'),
          },
        ],
      },
      {},
      { validTimeProgressionEnabled: false }
    );

    expect(first.balance.readyToProgress).toBe(true);
    expect(second.balance.currentLevelId).toBe(BALANCE_TANDEM_ID);
  });

  it('treats incomplete valid-time work as repeated difficulty, not a one-off regression', () => {
    const first = updateLadderProgressAfterSession(
      {},
      {
        completedAt: START,
        exercises: [
          {
            ladderId: 'balance',
            levelId: BALANCE_TANDEM_ID,
            completionRate: 1,
            perceivedEffort: 3,
            painReported: false,
            trackingQuality: 'good',
            validTime: validTimeSummary('incomplete'),
          },
        ],
      }
    );
    const second = updateLadderProgressAfterSession(first, {
      completedAt: '2026-06-03T08:00:00.000Z',
      exercises: [
        {
          ladderId: 'balance',
          levelId: BALANCE_TANDEM_ID,
          completionRate: 1,
          perceivedEffort: 3,
          painReported: false,
          trackingQuality: 'good',
          validTime: validTimeSummary('incomplete'),
        },
      ],
    });

    expect(first.balance.currentLevelId).toBe(BALANCE_TANDEM_ID);
    expect(first.balance.failedSessionsAtLevel).toBe(1);
    expect(second.balance.currentLevelId).toBe(BALANCE_FEET_TOGETHER_ID);
  });

  it('repeats the level instead of demoting when valid-time tracking is uncertain', () => {
    const progress: Record<string, LadderProgress> = {
      balance: {
        ladderId: 'balance',
        currentLevelId: BALANCE_TANDEM_ID,
        completedSessionsAtLevel: 1,
        failedSessionsAtLevel: 1,
        recentCompletionRates: [0.5],
        recentRpe: [4],
        recentPain: [false],
        updatedAt: START,
      },
    };
    const next = updateLadderProgressAfterSession(progress, {
      completedAt: '2026-06-03T08:00:00.000Z',
      exercises: [
        {
          ladderId: 'balance',
          levelId: BALANCE_TANDEM_ID,
          completionRate: 0.3,
          perceivedEffort: 4,
          painReported: false,
          trackingQuality: 'good',
          validTime: validTimeSummary('tracking_uncertain'),
        },
      ],
    });

    expect(next.balance.currentLevelId).toBe(BALANCE_TANDEM_ID);
    expect(next.balance.completedSessionsAtLevel).toBe(0);
    expect(next.balance.failedSessionsAtLevel).toBe(1);
    expect(next.balance.readyToProgress).toBe(false);
  });

  it('regresses or holds gently when pain, struggle, or poor tracking appears', () => {
    const progress: Record<string, LadderProgress> = {
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
    };
    const regressed = updateLadderProgressAfterSession(progress, {
      completedAt: '2026-06-03T08:00:00.000Z',
      exercises: [
        {
          ladderId: 'sit-to-stand',
          completionRate: 0.5,
          perceivedEffort: 5,
          painReported: true,
          trackingQuality: 'good',
        },
      ],
    });
    const poorTracking = updateLadderProgressAfterSession(regressed, {
      completedAt: '2026-06-05T08:00:00.000Z',
      exercises: [
        {
          ladderId: 'sit-to-stand',
          completionRate: 1,
          perceivedEffort: 2,
          painReported: false,
          trackingQuality: 'poor',
        },
      ],
    });

    expect(regressed['sit-to-stand'].currentLevelId).toBe(STS_STANDARD_ID);
    expect(poorTracking['sit-to-stand'].currentLevelId).toBe(STS_STANDARD_ID);
    expect(poorTracking['sit-to-stand'].lastTrackingQuality).toBe('poor');
  });

  it('exposes the seven extra-session presets and runs them through the same gates', () => {
    expect(listExtraSessionPresets().map((preset) => preset.title)).toEqual([
      '10-Minute Mobility Reset',
      'Gentle Restart Session',
      'Steady Balance Practice',
      'Chair + Wall Strength',
      'Band Upper-Back',
      'Stairs Confidence',
      'Quick Full-Body Hale Session',
    ]);

    const withBand = generatePresetSession({
      presetId: 'preset-band-upper-back',
      today: START,
      availableEquipment: ['chair', 'wall', 'resistance_band'],
    });
    const withoutBand = generatePresetSession({
      presetId: 'preset-band-upper-back',
      today: START,
      availableEquipment: ['chair', 'wall'],
    });
    expect(withBand.exercises.some((exercise) => exercise.ladderId === 'pull-upper-back')).toBe(true);
    expect(withoutBand.exercises.flatMap((exercise) => exercise.equipment)).not.toContain('long_band');
    expect(withoutBand.slotStimulus.find((stimulus) => stimulus.slotId === 'band-row')).toMatchObject({
      role: 'skipped',
      reason: 'band_required',
    });
  });

  it('distinguishes a band from a door anchor for upper-back row progressions', () => {
    const ladderProgress = {
      'pull-upper-back': progress('pull-upper-back', STANDING_BAND_ROW_ID),
    };
    const withoutAnchor = generatePresetSession({
      presetId: 'preset-band-upper-back',
      today: START,
      availableEquipment: ['chair', 'wall', 'resistance_band'],
      ladderProgress,
    });
    const withAnchor = generatePresetSession({
      presetId: 'preset-band-upper-back',
      today: START,
      availableEquipment: ['chair', 'wall', 'resistance_band', 'door_anchor'],
      ladderProgress,
    });

    expect(withoutAnchor.exercises.map((exercise) => exercise.exerciseId)).toContain(SEATED_BAND_ROW_ID);
    expect(withoutAnchor.exercises.map((exercise) => exercise.exerciseId)).not.toContain(STANDING_BAND_ROW_ID);
    expect(withoutAnchor.slotStimulus.find((stimulus) => stimulus.slotId === 'band-row')).toMatchObject({
      role: 'primary',
      reason: 'equipment_limited',
      exerciseId: SEATED_BAND_ROW_ID,
    });
    expect(withAnchor.exercises.map((exercise) => exercise.exerciseId)).toContain(STANDING_BAND_ROW_ID);
    expect(withAnchor.slotStimulus.find((stimulus) => stimulus.slotId === 'band-row')).toMatchObject({
      role: 'primary',
      reason: 'direct_match',
      exerciseId: STANDING_BAND_ROW_ID,
    });
  });

  it('filters out optional levels when V1 core-only mode is requested', () => {
    const template = createSessionTemplatesForFocus('strength_power')[1];
    const session = generateTodaySession({
      template,
      today: START,
      availableEquipment: ['chair', 'wall'],
      includeOptionalLevels: false,
      ladderProgress: {
        push: {
          ladderId: 'push',
          currentLevelId: PUSHUP_STANDARD_ID,
          completedSessionsAtLevel: 0,
          failedSessionsAtLevel: 0,
          recentCompletionRates: [],
          recentRpe: [],
          recentPain: [],
          updatedAt: START,
        },
      },
    });

    expect(session.exercises.map((exercise) => exercise.releaseStatus)).not.toContain('v1_optional');
    expect(session.exercises.map((exercise) => exercise.exerciseId)).toContain(PUSHUP_INCLINE_ID);
  });

  it('previews realistic debug scenarios without brittle copy snapshots', () => {
    const previews = generateDebugWorkoutScenarios();
    expect(previews).toHaveLength(12);
    expect(previews.map((preview) => preview.id)).toEqual([
      'beginner_no_optional_equipment',
      'travel_true_no_equipment',
      'beginner_long_band',
      'strength_power_weakest',
      'balance_stability_weakest',
      'mobility_flexibility_weakest',
      'low_energy_day',
      'short_on_time',
      'knee_pain',
      'shoulder_pain',
      'stronger_ready_to_progress',
      'no_band_upper_pull',
    ]);

    for (const preview of previews) {
      expect(preview.blockFocus).toMatch(/strength_power|balance_stability|mobility_flexibility/);
      expect(preview.selectedSession.length).toBeGreaterThan(0);
      expect(preview.exercises.length).toBeLessThanOrEqual(4);
      for (const exercise of preview.exercises) {
        expect(exercise.name.length).toBeGreaterThan(0);
        expect(exercise.prescription).toMatch(/\d+/);
        expect(exercise.equipmentRequired.length).toBeGreaterThan(0);
        expect(exercise.measurementTier).toMatch(/measured|camera_assisted|voice_guided/);
        expect(exercise.rationale.length).toBeGreaterThan(0);
      }
    }
  });

  it('debug previews satisfy product guardrails across scenarios', () => {
    const previews = generateDebugWorkoutScenarios();
    const byId = Object.fromEntries(previews.map((preview) => [preview.id, preview]));
    const exerciseText = (id: string) => JSON.stringify(byId[id].exercises).toLowerCase();
    const allText = JSON.stringify(previews).toLowerCase();

    expect(byId.short_on_time.estimatedMinutes).toBe(10);
    expect(byId.short_on_time.durationLabel.toLowerCase()).toContain('about 10');
    expect(byId.short_on_time.exercises.length).toBeLessThanOrEqual(3);
    expect(byId.beginner_no_optional_equipment.exercises.map((exercise) => exercise.exerciseId)).toEqual(
      expect.arrayContaining(['sts-cushion', 'push-up-wall', 'balance-feet-together-hold'])
    );
    expect(byId.beginner_no_optional_equipment.exercises.every((exercise) => !exercise.prescription.startsWith('3 x'))).toBe(true);
    expect(byId.travel_true_no_equipment.exercises.flatMap((exercise) => exercise.equipmentRequired)).toEqual(
      expect.arrayContaining(['none'])
    );
    const travelEquipment = byId.travel_true_no_equipment.exercises.flatMap((exercise) => exercise.equipmentRequired);
    for (const forbidden of ['chair', 'wall', 'wall/counter support', 'stair', 'long_band', 'backpack_or_weight']) {
      expect(travelEquipment).not.toContain(forbidden);
    }
    expect(byId.beginner_long_band.exercises.every((exercise) => !exercise.prescription.startsWith('3 x'))).toBe(true);
    expect(byId.beginner_long_band.exercises.some((exercise) => exercise.ladderId === 'pull-upper-back')).toBe(true);
    expect(byId.no_band_upper_pull.exercises.flatMap((exercise) => exercise.equipmentRequired)).not.toContain('long_band');
    expect(byId.no_band_upper_pull.skippedSlots).toContain('upper-pull-a');
    expect(byId.no_band_upper_pull.guidance.join(' ')).toMatch(/Upper-back pulling was skipped/);
    expect(byId.no_band_upper_pull.guidance.join(' ')).toMatch(/did not replace it with shoulder mobility/);
    expect(exerciseText('knee_pain')).not.toMatch(/step-up|split-squat|squat-free|squat-slow|squat-loaded/);
    expect(exerciseText('knee_pain')).not.toMatch(/mini-band-lateral-walk/);
    const kneeSideStep = byId.knee_pain.exercises.find((exercise) => exercise.exerciseId === 'supported-side-step');
    if (kneeSideStep) {
      expect(kneeSideStep.prescription).toMatch(/1 x 20s/);
      expect(`${kneeSideStep.rationale} ${kneeSideStep.fallbackReason ?? ''}`.toLowerCase()).toMatch(/gentle|comfortable/);
    }
    expect(exerciseText('shoulder_pain')).not.toMatch(/push-up|overhead|press|pull-apart/);
    expect(byId.stronger_ready_to_progress.title).toBe('Stronger user ready to progress');
    expect(byId.stronger_ready_to_progress.exercises.map((exercise) => exercise.exerciseId)).toEqual(
      expect.arrayContaining(['loaded-sit-to-stand', 'standing-band-row', 'balance-tandem-hold', 'thoracic-rotation'])
    );

    for (const preview of previews) {
      const equipment = preview.exercises.flatMap((exercise) => exercise.equipmentRequired);
      if (!['strength_power_weakest', 'stronger_ready_to_progress'].includes(preview.id)) {
        expect(equipment).not.toContain('stair');
      }
      if (preview.id !== 'stronger_ready_to_progress') {
        expect(equipment).not.toContain('backpack_or_weight');
        expect(preview.exercises.map((exercise) => exercise.name.toLowerCase()).join(' ')).not.toContain('loaded');
      }
      if (!['beginner_long_band', 'strength_power_weakest', 'low_energy_day', 'stronger_ready_to_progress'].includes(preview.id)) {
        expect(equipment).not.toContain('long_band');
      }
    }

    expect(allText).not.toMatch(/up and go|timed up|tug/);
    expect(allText).not.toContain('neck-rotation');
    expect(allText).not.toMatch(/diagnosis|treatment|fall risk|frailty|failed|skipped workout|lost streak|medical-grade/);
    expect(formatDebugWorkoutScenarios(previews)).toContain('Beginner, no optional equipment');
  });

  it('keeps pulling in the weekly mix when a band is available', () => {
    const templates = createSessionTemplatesForFocus('strength_power');
    const sessions = templates.map((template) =>
      generateTodaySession({
        template,
        today: START,
        availableEquipment: ['chair', 'wall', 'resistance_band'],
      })
    );
    expect(sessions.flatMap((session) => session.exercises).some((exercise) => exercise.ladderId === 'pull-upper-back')).toBe(true);
  });
});

function progress(ladderId: string, currentLevelId: string): LadderProgress {
  return {
    ladderId,
    currentLevelId,
    completedSessionsAtLevel: 0,
    failedSessionsAtLevel: 0,
    recentCompletionRates: [],
    recentRpe: [],
    recentPain: [],
    updatedAt: START,
  };
}

function expectNoUnsafeTrueNoEquipment(session: ReturnType<typeof generateTodaySession>): void {
  const equipment = session.exercises.flatMap((exercise) => exercise.equipment);
  for (const forbidden of [
    'chair',
    'wall',
    'counter',
    'floor',
    'stair',
    'long_band',
    'door_anchor',
    'mini_band',
    'backpack_or_weight',
  ]) {
    expect(equipment).not.toContain(forbidden);
  }
}

function validTimeSummary(signal: ValidTimeProgressionSignal): ValidTimeProgressionSummary {
  return {
    signal,
    setCount: 1,
    targetValidSeconds: 20,
    accumulatedValidSeconds: signal === 'incomplete' ? 12 : 20,
    wallClockSeconds: signal === 'completed_with_resets' ? 40 : 22,
    pauseCount: signal === 'completed_with_resets' ? 3 : 0,
    longestContinuousValidSeconds: signal === 'completed_with_resets' ? 10 : signal === 'incomplete' ? 12 : 20,
    positionLostEvents: signal === 'completed_with_resets' ? 3 : 0,
    trackingLostSeconds: signal === 'tracking_uncertain' ? 8 : 0,
    completedByValidTime: signal !== 'incomplete' && signal !== 'tracking_uncertain',
    endedBySafetyCap: signal === 'incomplete',
    validationMode: 'strict_valid_position',
  };
}
