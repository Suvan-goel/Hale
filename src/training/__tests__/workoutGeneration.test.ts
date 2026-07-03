import {
  BALANCE_FEET_TOGETHER_ID,
  BALANCE_SINGLE_LEG_ID,
  BALANCE_TANDEM_ID,
  BRIDGE_HOLD_ID,
  CONTROLLED_BETA_HIDDEN_OPTIONAL_LEVEL_IDS,
  HAMSTRING_REACH_ID,
  LOADED_STS_ID,
  LOADED_MARCH_ID,
  NECK_ROTATION_ID,
  SEATED_BAND_ROW_ID,
  SQUAT_FREE_ID,
  SQUAT_LOADED_ID,
  STANDING_BAND_ROW_ID,
  STEP_UP_ID,
  PUSHUP_STANDARD_ID,
  SQUAT_SUPPORTED_ID,
  STS_POWER_ID,
  STS_CUSHION_ID,
  STS_SLOW_ECC_ID,
  STS_STANDARD_ID,
  THORACIC_ROTATION_ID,
  WALL_CALF_STRETCH_ID,
  listExerciseLadders,
} from '../../exercises';
import {
  createBalancedSessionTemplates,
  createSessionTemplatesForFocus,
  createTrainingBlockFromAssessment,
  generatePresetSession,
  generateTodaySession,
  getTemplateSelection,
  initialLadderProgressFromCheckUp,
  initialLadderProgressFromMeasuredCapability,
  listExtraSessionPresets,
  selectNextSessionTemplate,
  updateLadderProgressAfterSession,
  type LadderProgress,
} from '../workoutGeneration';
import type { CheckUpScore } from '../../scoring';
import { createLifeGoal, getLifeGoalWorkoutBias, type MovementSafetyProfile } from '../../adherence';
import type { CollectionExposure } from '../collectionSelection';
import { formatDebugWorkoutScenarios, generateDebugWorkoutScenarios } from '../debugWorkoutScenarios';
import type { ValidTimeProgressionSignal, ValidTimeProgressionSummary } from '../validTimeProgression';

const START = '2026-06-01T08:00:00.000Z';
const CONFIRMED_MOVEMENT_CAPABILITIES = {
  schemaVersion: 1,
  floorTransfer: { status: 'confirmed' as const },
  stepUpEnvironment: {
    status: 'confirmed' as const,
    lowStableStep: true,
    fixedSupport: true,
    clearDryArea: true,
    phoneOutOfPath: true,
  },
  singleLegBalance: { status: 'confirmed_with_support' as const },
  revision: 1,
  updatedAt: START,
};

function safetyProfile(overrides: Partial<MovementSafetyProfile> = {}): MovementSafetyProfile {
  return {
    id: 'safety-1',
    userId: 'local-device-user',
    age: 60,
    activityLevel: 'lightly_active',
    feelsSafeStandingFromChair: true,
    feelsSafeBalancing: true,
    availableEquipment: ['chair', 'wall', 'stairs', 'resistance_band', 'door_anchor'],
    movementCapabilities: CONFIRMED_MOVEMENT_CAPABILITIES,
    preferredWorkoutDays: ['Mon', 'Wed', 'Fri'],
    createdAt: START,
    updatedAt: START,
    ...overrides,
  };
}

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
    const floorSpaceOnly = generateTodaySession({
      template,
      today: START,
      availableEquipment: ['chair', 'wall', 'floor_space'],
      ladderProgress,
    });
    const withFloor = generateTodaySession({
      template,
      today: START,
      availableEquipment: ['chair', 'wall', 'floor_space'],
      movementCapabilities: CONFIRMED_MOVEMENT_CAPABILITIES,
      ladderProgress,
    });

    expect(withoutFloor.exercises.map((exercise) => exercise.exerciseId)).not.toContain(BRIDGE_HOLD_ID);
    expect(withoutFloor.exercises.map((exercise) => exercise.exerciseId)).toContain('hip-hinge-wall');
    expect(withoutFloor.exercises.flatMap((exercise) => exercise.equipment)).not.toContain('floor');
    expect(floorSpaceOnly.exercises.map((exercise) => exercise.exerciseId)).not.toContain(BRIDGE_HOLD_ID);
    expect(floorSpaceOnly.exercises.map((exercise) => exercise.exerciseId)).toContain('hip-hinge-wall');
    expect(withFloor.exercises.map((exercise) => exercise.exerciseId)).toContain('hip-hinge-wall');
    expect(withFloor.exercises.flatMap((exercise) => exercise.equipment)).not.toContain('floor');
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
      movementCapabilities: CONFIRMED_MOVEMENT_CAPABILITIES,
    });
    const stairsWithSupportNoChecklist = generateTodaySession({
      template,
      today: START,
      availableEquipment: ['stairs', 'wall'],
    });

    expect(stairsOnly.exercises.map((exercise) => exercise.exerciseId)).not.toContain(STEP_UP_ID);
    expect(stairsOnly.exercises.flatMap((exercise) => exercise.equipment)).not.toContain('stair');
    expect(stairsWithSupportNoChecklist.exercises.map((exercise) => exercise.exerciseId)).not.toContain(STEP_UP_ID);
    expect(stairsWithSupportNoChecklist.slotStimulus.map((stimulus) => stimulus.reason)).toContain('movement_setup_required');
    expect(stairsWithSupport.exercises.map((exercise) => exercise.exerciseId)).toContain(STEP_UP_ID);
  });

  it('lets a stairs goal prefer step-up work inside a strength-focused session when setup is confirmed', () => {
    const block = createTrainingBlockFromAssessment({ focusDomain: 'strength_power', startDate: START });
    const session = generateTodaySession({
      block,
      today: START,
      availableEquipment: ['chair', 'wall', 'stairs'],
      movementCapabilities: CONFIRMED_MOVEMENT_CAPABILITIES,
      lifeGoalBias: getLifeGoalWorkoutBias(createLifeGoal({ category: 'stairs', nowIso: START })),
    });

    expect(session.focusDomain).toBe('strength_power');
    expect(session.exercises[0]).toMatchObject({
      exerciseId: STEP_UP_ID,
      ladderId: 'step-up',
      stimulusRole: 'primary',
    });
  });

  it('falls back safely from stairs-goal step-up preference when stair setup is not confirmed', () => {
    const block = createTrainingBlockFromAssessment({ focusDomain: 'strength_power', startDate: START });
    const session = generateTodaySession({
      block,
      today: START,
      availableEquipment: ['chair', 'wall', 'stairs'],
      lifeGoalBias: getLifeGoalWorkoutBias(createLifeGoal({ category: 'stairs', nowIso: START })),
    });

    expect(session.exercises.map((exercise) => exercise.exerciseId)).not.toContain(STEP_UP_ID);
    expect(session.exercises[0]?.ladderId).toBe('sit-to-stand');
    expect(session.slotStimulus.find((stimulus) => stimulus.slotId === 'lower-strength-a')).toMatchObject({
      role: 'fallback',
      reason: 'movement_setup_required',
    });
  });

  it('uses carrying-loads bias to bring upper-back and hinge support forward when safe', () => {
    const template = createSessionTemplatesForFocus('mobility_flexibility')[1];
    const session = generateTodaySession({
      template,
      today: START,
      availableEquipment: ['chair', 'wall', 'resistance_band', 'door_anchor'],
      lifeGoalBias: getLifeGoalWorkoutBias(createLifeGoal({ category: 'carrying_loads', nowIso: START })),
    });

    const ladderIds = session.exercises.map((exercise) => exercise.ladderId);
    expect(ladderIds[0]).toBe('mobility-flexibility');
    expect(ladderIds.indexOf('pull-upper-back')).toBeGreaterThan(0);
    expect(ladderIds.indexOf('pull-upper-back')).toBeLessThan(ladderIds.indexOf('shoulder-reach-press'));
  });

  it('uses saved setup discomfort as a baseline caution when no daily pain is provided', () => {
    const template = createSessionTemplatesForFocus('strength_power')[1];
    const session = generateTodaySession({
      template,
      today: START,
      safetyProfile: safetyProfile({ hasCurrentPain: true, painNotes: 'knee' }),
    });

    expect(session.painAreas).toEqual(['knee']);
    expect(session.exercises.map((exercise) => exercise.ladderId)).not.toContain('step-up');
    expect(session.guidance.join(' ')).toContain('Hale used gentler options around the area you marked in setup.');
    expect(session.adjustmentReasons).toContain('setup_discomfort_reported');
  });

  it('lets daily discomfort override saved setup discomfort for today', () => {
    const template = createSessionTemplatesForFocus('strength_power')[1];
    const session = generateTodaySession({
      template,
      today: START,
      safetyProfile: safetyProfile({ hasCurrentPain: true, painNotes: 'knee' }),
      painAreas: ['shoulder'],
    });

    expect(session.painAreas).toEqual(['shoulder']);
    expect(session.exercises.map((exercise) => exercise.ladderId)).toContain('step-up');
    expect(session.guidance.join(' ')).not.toContain('area you marked in setup');
    expect(session.adjustmentReasons).not.toContain('setup_discomfort_reported');
  });

  it('uses very inactive activity level for a gentler starting dose without changing the check-up focus', () => {
    const block = createTrainingBlockFromAssessment({ focusDomain: 'strength_power', startDate: START });
    const lightlyActive = generateTodaySession({
      block,
      today: START,
      safetyProfile: safetyProfile({ activityLevel: 'lightly_active' }),
    });
    const veryInactive = generateTodaySession({
      block,
      today: START,
      safetyProfile: safetyProfile({ activityLevel: 'very_inactive' }),
    });
    const defaultStrength = lightlyActive.exercises.find((exercise) => exercise.ladderId === 'sit-to-stand');
    const gentleStrength = veryInactive.exercises.find((exercise) => exercise.ladderId === 'sit-to-stand');

    expect(veryInactive.focusDomain).toBe('strength_power');
    expect(veryInactive.progressionEvidencePolicy).toBe('hold_only');
    expect(gentleStrength?.sets).toBeLessThanOrEqual(defaultStrength?.sets ?? 0);
    expect(gentleStrength?.levelId).toBe(STS_CUSHION_ID);
    expect(veryInactive.adjustmentReasons).toContain('activity_level_gentle_start');
  });

  it('uses regular exercise activity level for a bounded dose bump without changing exercises', () => {
    const template = createSessionTemplatesForFocus('strength_power')[0];
    const standard = generateTodaySession({
      template,
      today: START,
      safetyProfile: safetyProfile({ activityLevel: 'lightly_active' }),
      dailyReadiness: 'ready',
      painAreas: [],
    });
    const regular = generateTodaySession({
      template,
      today: START,
      safetyProfile: safetyProfile({ activityLevel: 'very_active' }),
      dailyReadiness: 'ready',
      painAreas: [],
    });
    const standardPull = standard.exercises.find((exercise) => exercise.ladderId === 'pull-upper-back');
    const regularPull = regular.exercises.find((exercise) => exercise.ladderId === 'pull-upper-back');

    expect(regular.exercises.map((exercise) => exercise.exerciseId)).toEqual(
      standard.exercises.map((exercise) => exercise.exerciseId)
    );
    expect(regular.adjustmentReasons).toContain('activity_level_regular_start');
    expect(regularPull?.sets).toBe(Math.min(3, (standardPull?.sets ?? 0) + 1));
  });

  it('does not let regular exercise activity level override discomfort safety gates', () => {
    const template = createSessionTemplatesForFocus('strength_power')[1];
    const session = generateTodaySession({
      template,
      today: START,
      safetyProfile: safetyProfile({
        activityLevel: 'very_active',
        hasCurrentPain: true,
        painNotes: 'knee',
      }),
      dailyReadiness: 'ready',
    });

    expect(session.adjustmentReasons).not.toContain('activity_level_regular_start');
    expect(session.exercises.map((exercise) => exercise.ladderId)).not.toContain('step-up');
    expect(session.painAreas).toEqual(['knee']);
  });

  it('uses age only as a small recovery buffer and does not change capable exercise selection', () => {
    const template = createSessionTemplatesForFocus('strength_power')[1];
    const age60 = generateTodaySession({
      template,
      today: START,
      safetyProfile: safetyProfile({ age: 60 }),
    });
    const age76 = generateTodaySession({
      template,
      today: START,
      safetyProfile: safetyProfile({ age: 76 }),
    });

    expect(age76.exercises.map((exercise) => exercise.exerciseId)).toEqual(
      age60.exercises.map((exercise) => exercise.exerciseId)
    );
    expect(age76.exercises[0]?.restSeconds).toBe((age60.exercises[0]?.restSeconds ?? 0) + 5);
    expect(age76.adjustmentReasons).toContain('age_recovery_buffer');
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

  it('does not overstate session length when equipment limits skip a slot', () => {
    const session = generatePresetSession({
      presetId: 'preset-band-upper-back',
      today: START,
      availableEquipment: ['chair', 'wall'], // no band: the pull slot is skipped, leaving two short mobility items
    });

    expect(session.skippedSlots.length).toBeGreaterThan(0);
    expect(session.exercises.length).toBeGreaterThan(0);
    // The old behaviour floored every session at ~12 minutes; a two-item
    // mobility-only session should now read shorter than that floor.
    expect(session.estimatedMinutes).toBeLessThan(12);
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
    expect(mobility.slotStimulus.find((stimulus) => stimulus.intendedDomain === 'mobility_flexibility')?.role).not.toBe('invalid');
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
    expect(strength?.selectedDailyLevelId).toBe(STS_CUSHION_ID);
    expect(strength?.adjustmentReasons).toEqual(expect.arrayContaining(['auto_progression_cap', 'legacy_progression_policy_capped', 'reduced_readiness']));
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

  it('progresses sit-to-stand only from cushion to standard after two easy sessions', () => {
    const first = updateLadderProgressAfterSession(
      {},
      {
        completedAt: START,
        exercises: [
          {
            ladderId: 'sit-to-stand',
            levelId: STS_CUSHION_ID,
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
          levelId: STS_CUSHION_ID,
          completionRate: 0.95,
          perceivedEffort: 2,
          painReported: false,
          trackingQuality: 'good',
        },
      ],
    });

    expect(first['sit-to-stand'].currentLevelId).toBe(STS_CUSHION_ID);
    expect(first['sit-to-stand'].readyToProgress).toBe(true);
    expect(second['sit-to-stand'].currentLevelId).toBe(STS_STANDARD_ID);
    expect(second['sit-to-stand'].lastProgressionDecisionReason).toBe('progression_allowed_transition');
  });

  it('holds blocked sit-to-stand cadence progression despite generic easy evidence', () => {
    const first = updateLadderProgressAfterSession(
      {},
      {
        completedAt: START,
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

    expect(second['sit-to-stand'].currentLevelId).toBe(STS_STANDARD_ID);
    expect(second['sit-to-stand'].readyToProgress).toBe(false);
    expect(second['sit-to-stand'].lastProgressionDecisionReason).toBe('domain_review_required');
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

  it('does not progress balance when strong valid-time evidence is unavailable', () => {
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

    expect(first.balance.readyToProgress).toBe(false);
    expect(second.balance.currentLevelId).toBe(BALANCE_FEET_TOGETHER_ID);
    expect(second.balance.lastProgressionDecisionReason).toBe('transition_not_auto_approved');
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

    expect(regressed['sit-to-stand'].currentLevelId).toBe(STS_CUSHION_ID);
    expect(poorTracking['sit-to-stand'].currentLevelId).toBe(STS_CUSHION_ID);
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

  it('defaults upper-back supporting-set selection to seated row instead of stored adjacency', () => {
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
    expect(withAnchor.exercises.map((exercise) => exercise.exerciseId)).toContain(SEATED_BAND_ROW_ID);
    expect(withAnchor.exercises.map((exercise) => exercise.exerciseId)).not.toContain(STANDING_BAND_ROW_ID);
    expect(withAnchor.slotStimulus.find((stimulus) => stimulus.slotId === 'band-row')).toMatchObject({
      role: 'primary',
      reason: 'equipment_limited',
      exerciseId: SEATED_BAND_ROW_ID,
    });
  });

  it('ignores legacy optional-level requests in controlled beta generation', () => {
    const template = createSessionTemplatesForFocus('strength_power')[1];
    const session = generateTodaySession({
      template,
      today: START,
      availableEquipment: ['chair', 'wall', 'floor_space'],
      movementCapabilities: CONFIRMED_MOVEMENT_CAPABILITIES,
      includeOptionalLevels: true,
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
    expect(session.exercises.map((exercise) => exercise.exerciseId)).toContain('push-up-wall');
    expect(session.exercises.find((exercise) => exercise.ladderId === 'push')).toMatchObject({
      requestedLevelId: PUSHUP_STANDARD_ID,
      selectedDailyLevelId: 'push-up-wall',
      adjustmentReasons: expect.arrayContaining(['controlled_beta_release_cap', 'auto_progression_cap']),
    });
  });

  it('caps restored optional progress at the automatic beta ceiling without mutating input progress', () => {
    const template = createSessionTemplatesForFocus('strength_power')[0];
    const ladderProgress: Record<string, LadderProgress> = {
      'sit-to-stand': {
        ladderId: 'sit-to-stand',
        currentLevelId: LOADED_STS_ID,
        completedSessionsAtLevel: 1,
        failedSessionsAtLevel: 0,
        recentCompletionRates: [0.95],
        recentRpe: [2],
        recentPain: [false],
        updatedAt: START,
      },
    };

    const session = generateTodaySession({
      template,
      today: START,
      availableEquipment: ['chair', 'wall', 'backpack'],
      ladderProgress,
    });
    const selected = session.exercises.find((exercise) => exercise.ladderId === 'sit-to-stand');

    expect(selected).toMatchObject({
      exerciseId: STS_STANDARD_ID,
      requestedLevelId: LOADED_STS_ID,
      selectedDailyLevelId: STS_STANDARD_ID,
      adjustmentReasons: expect.arrayContaining(['controlled_beta_release_cap', 'auto_progression_cap', 'legacy_progression_policy_capped']),
    });
    expect(ladderProgress['sit-to-stand'].currentLevelId).toBe(LOADED_STS_ID);
  });

  it('never selects any current optional level across controlled beta generation helpers', () => {
    const optionalIds = new Set<string>(CONTROLLED_BETA_HIDDEN_OPTIONAL_LEVEL_IDS);
    const session = generateTodaySession({
      template: createSessionTemplatesForFocus('strength_power')[1],
      today: START,
      availableEquipment: ['chair', 'wall', 'floor_space', 'backpack', 'mini_band'],
      movementCapabilities: CONFIRMED_MOVEMENT_CAPABILITIES,
      includeOptionalLevels: true,
      ladderProgress: Object.fromEntries(
        listExerciseLadders().flatMap((ladder) =>
          ladder.levels
            .filter((level) => optionalIds.has(level.id))
            .map((level) => [
              ladder.id,
              {
                ladderId: ladder.id,
                currentLevelId: level.id,
                completedSessionsAtLevel: 1,
                failedSessionsAtLevel: 0,
                recentCompletionRates: [0.95],
                recentRpe: [2],
                recentPain: [false],
                updatedAt: START,
              },
            ])
        )
      ) as Record<string, LadderProgress>,
    });
    const preset = generatePresetSession({
      presetId: 'preset-no-equipment-strength',
      today: START,
      availableEquipment: ['chair', 'wall', 'floor_space', 'backpack', 'mini_band'],
      movementCapabilities: CONFIRMED_MOVEMENT_CAPABILITIES,
      includeOptionalLevels: true,
    });

    expect(session.exercises.some((exercise) => optionalIds.has(exercise.exerciseId))).toBe(false);
    expect(preset.exercises.some((exercise) => optionalIds.has(exercise.exerciseId))).toBe(false);
  });

  it('caps automatic squat progression at supported squat even for historical free-squat state', () => {
    const progress: Record<string, LadderProgress> = {
      squat: {
        ladderId: 'squat',
        currentLevelId: SQUAT_FREE_ID,
        completedSessionsAtLevel: 1,
        failedSessionsAtLevel: 0,
        recentCompletionRates: [0.95],
        recentRpe: [2],
        recentPain: [false],
        updatedAt: START,
      },
    };

    const next = updateLadderProgressAfterSession(
      progress,
      {
        completedAt: '2026-06-03T08:00:00.000Z',
        exercises: [{ ladderId: 'squat', levelId: SQUAT_FREE_ID, completionRate: 1, perceivedEffort: 2, painReported: false }],
      },
      { completedAt: '2026-06-03T08:00:00.000Z', perceivedEffort: 2, painReported: false, trackingQuality: 'good' }
    );

    expect(next.squat.currentLevelId).toBe(SQUAT_SUPPORTED_ID);
    expect(next.squat.currentLevelId).not.toBe(SQUAT_LOADED_ID);
    expect(next.squat.readyToProgress).toBe(false);
    expect(next.squat.lastProgressionDecisionReason).toBe('domain_review_required');
  });

  it.each([
    ['heel-toe-raise', 'heel-raise-supported'],
    ['pull-upper-back', SEATED_BAND_ROW_ID],
    ['hinge-glutes', 'hip-hinge-wall'],
    ['shoulder-reach-press', 'overhead-reach'],
    ['lateral-stability', 'supported-side-step'],
    ['mobility-flexibility', 'seated-hamstring-reach'],
  ])('does not auto-mutate non-linear ladder %s by adjacency', (ladderId, levelId) => {
    const next = updateLadderProgressAfterSession(
      {
        [ladderId]: {
          ladderId,
          currentLevelId: levelId,
          completedSessionsAtLevel: 1,
          failedSessionsAtLevel: 0,
          recentCompletionRates: [1],
          recentRpe: [2],
          recentPain: [false],
          updatedAt: START,
        },
      },
      {
        completedAt: '2026-06-03T08:00:00.000Z',
        exercises: [{ ladderId, levelId, completionRate: 1, perceivedEffort: 2, painReported: false, trackingQuality: 'good' }],
      }
    );

    expect(next[ladderId].currentLevelId).toBe(levelId);
    expect(next[ladderId].readyToProgress).toBe(false);
    expect(next[ladderId].lastProgressionDecisionReason).toBe('non_linear_progression_model');
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
      expect.arrayContaining(['sts-standard', 'seated-band-row', 'balance-tandem-hold', 'seated-hamstring-reach'])
    );
    const optionalIds = new Set<string>(CONTROLLED_BETA_HIDDEN_OPTIONAL_LEVEL_IDS);
    for (const preview of previews) {
      expect(preview.exercises.some((exercise) => optionalIds.has(exercise.exerciseId))).toBe(false);
    }

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
    expect(formatDebugWorkoutScenarios(previews)).toContain('Beginner, household support only');
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

  it('rotates mobility collection members from explicit current-block exposure without mutating progression', () => {
    const block = createTrainingBlockFromAssessment({ focusDomain: 'mobility_flexibility', startDate: START });
    const first = generateTodaySession({
      block,
      template: block.templates[0],
      today: START,
      availableEquipment: ['chair', 'wall'],
      movementCapabilities: CONFIRMED_MOVEMENT_CAPABILITIES,
    });
    const afterHamstring = generateTodaySession({
      block,
      template: block.templates[0],
      today: START,
      availableEquipment: ['chair', 'wall'],
      movementCapabilities: CONFIRMED_MOVEMENT_CAPABILITIES,
      collectionExposures: [mobilityExposure(HAMSTRING_REACH_ID, '2026-06-01')],
      ladderProgress: {
        'mobility-flexibility': progress('mobility-flexibility', WALL_CALF_STRETCH_ID),
      },
    });

    expect(first.exercises.find((exercise) => exercise.ladderId === 'mobility-flexibility')).toMatchObject({
      exerciseId: HAMSTRING_REACH_ID,
      collectionSelection: expect.objectContaining({ reason: 'never_practised_first' }),
      progressionPolicySelectionReason: 'explicit_template_member',
    });
    expect(afterHamstring.exercises.find((exercise) => exercise.ladderId === 'mobility-flexibility')).toMatchObject({
      exerciseId: THORACIC_ROTATION_ID,
      collectionSelection: expect.objectContaining({ reason: 'never_practised_first' }),
      storedLevelId: WALL_CALF_STRETCH_ID,
    });

    const updated = updateLadderProgressAfterSession(
      { 'mobility-flexibility': progress('mobility-flexibility', WALL_CALF_STRETCH_ID) },
      {
        id: afterHamstring.id,
        templateId: afterHamstring.templateId,
        completedAt: '2026-06-02T09:00:00.000Z',
        exercises: afterHamstring.exercises.map((exercise) => ({
          ladderId: exercise.ladderId,
          levelId: exercise.levelId,
          completionRate: 1,
          perceivedEffort: 2,
          painReported: false,
          trackingQuality: 'good',
        })),
      }
    );

    expect(updated['mobility-flexibility'].currentLevelId).toBe(WALL_CALF_STRETCH_ID);
    expect(updated['mobility-flexibility'].lastProgressionDecisionReason).toBe('non_linear_progression_model');
  });

  it('avoids duplicate mobility collection members inside one generated session when another member is eligible', () => {
    const preset = generatePresetSession({
      presetId: 'preset-mobility-reset',
      today: START,
      availableEquipment: ['chair', 'wall'],
      movementCapabilities: CONFIRMED_MOVEMENT_CAPABILITIES,
      dailyReadiness: 'ready',
      painAreas: [],
      dailyContextSource: 'user_daily_check',
    });
    const mobilityIds = preset.exercises
      .filter((exercise) => exercise.ladderId === 'mobility-flexibility')
      .map((exercise) => exercise.exerciseId);

    expect(mobilityIds).toEqual([HAMSTRING_REACH_ID, THORACIC_ROTATION_ID]);
    expect(preset.exercises.map((exercise) => exercise.exerciseId)).not.toContain(NECK_ROTATION_ID);
  });

  it('uses the only eligible mobility member honestly when setup leaves one collection member available', () => {
    const preset = generatePresetSession({
      presetId: 'preset-mobility-reset',
      today: START,
      availableEquipment: ['none'],
      movementCapabilities: CONFIRMED_MOVEMENT_CAPABILITIES,
      dailyReadiness: 'ready',
      painAreas: [],
      dailyContextSource: 'user_daily_check',
    });
    const mobility = preset.exercises.filter((exercise) => exercise.ladderId === 'mobility-flexibility');

    expect(mobility.map((exercise) => exercise.exerciseId)).toEqual([THORACIC_ROTATION_ID, THORACIC_ROTATION_ID]);
    expect(mobility.every((exercise) => exercise.collectionSelection?.reason === 'only_eligible_member')).toBe(true);
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

function mobilityExposure(exerciseId: string, date: string): CollectionExposure {
  return {
    blockId: 'training-block-2026-06-01T08-00-00-000Z',
    exerciseId,
    plannedDateKey: `${date}:mobility-A`,
    completedAt: `${date}T09:00:00.000Z`,
    completionId: `completion-${exerciseId}-${date}`,
  };
}

describe('valid-time measurement targets under daily adjustments', () => {
  it('adjusts sets but never the per-set valid-time target', () => {
    const { getExercise } = require('../../exercises') as typeof import('../../exercises');
    const block = createTrainingBlockFromAssessment({ focusDomain: 'balance_stability', startDate: START });
    const session = generateTodaySession({
      block,
      today: START,
      availableEquipment: ['chair', 'wall', 'resistance_band'],
      sessionIntensity: 'beginner',
    });

    const validTimeExercises = session.exercises.filter(
      (exercise) => getExercise(exercise.exerciseId).timing?.mode === 'valid_time'
    );
    expect(validTimeExercises.length).toBeGreaterThan(0);
    for (const exercise of validTimeExercises) {
      // The measurement target is an instrument setting: identical to the
      // unadjusted dose no matter what the daily adjustment did.
      expect(exercise.secondsPerSet).toBe(exercise.doseBeforeAdjustment?.secondsPerSet);
    }
    // The volume adjustment itself still applies (beginner set clamps).
    expect(
      session.exercises.some(
        (exercise) => (exercise.doseBeforeAdjustment?.sets ?? 0) > exercise.sets
      )
    ).toBe(true);
  });
});

describe('initial ladder progress from measured capability', () => {
  const NOW = '2026-07-02T08:00:00.000Z';

  function domainResult(overrides: Partial<CheckUpScore['domains'][number]>): CheckUpScore['domains'][number] {
    return {
      domain: 'strength',
      label: 'Strength & Power',
      measured: true,
      ageLow: 50,
      ageHigh: 58,
      estimated: false,
      interpretation: 'typical',
      rows: [],
      primaryMetricValue: NaN,
      ...overrides,
    };
  }

  it('starts a very weak chair-stand result one level easier than the ladder default', () => {
    const next = initialLadderProgressFromMeasuredCapability({
      previousLadderProgress: {},
      chairStandReps: 6, // at/below the oldest published Rikli & Jones anchor
      nowIso: NOW,
    });
    expect(next['sit-to-stand']?.currentLevelId).toBe(STS_CUSHION_ID);
    expect(next['sit-to-stand']?.completedSessionsAtLevel).toBe(0);
    expect(next.balance).toBeUndefined();
  });

  it('starts a very strong chair-stand result one level harder than the ladder default, never an optional level', () => {
    const next = initialLadderProgressFromMeasuredCapability({
      previousLadderProgress: {},
      chairStandReps: 25, // above the youngest published anchor
      nowIso: NOW,
    });
    expect(next['sit-to-stand']?.currentLevelId).toBe(STS_SLOW_ECC_ID);
  });

  it('leaves the ladder default alone for an ordinary chair-stand result', () => {
    const next = initialLadderProgressFromMeasuredCapability({
      previousLadderProgress: {},
      chairStandReps: 13,
      nowIso: NOW,
    });
    expect(next['sit-to-stand']).toBeUndefined();
  });

  it('only ever steps the balance ladder up (its default is already the easiest level)', () => {
    const strongHold = initialLadderProgressFromMeasuredCapability({
      previousLadderProgress: {},
      singleLegHoldSec: 35,
      nowIso: NOW,
    });
    expect(strongHold.balance?.currentLevelId).toBe(BALANCE_TANDEM_ID);

    const weakHold = initialLadderProgressFromMeasuredCapability({
      previousLadderProgress: {},
      singleLegHoldSec: 3,
      nowIso: NOW,
    });
    expect(weakHold.balance).toBeUndefined();
  });

  it('never overwrites a ladder that already has training-earned progress', () => {
    const existing: LadderProgress = {
      ladderId: 'sit-to-stand',
      currentLevelId: STS_POWER_ID,
      completedSessionsAtLevel: 3,
      failedSessionsAtLevel: 0,
      recentCompletionRates: [1],
      recentRpe: [],
      recentPain: [],
      updatedAt: NOW,
    };
    const next = initialLadderProgressFromMeasuredCapability({
      previousLadderProgress: { 'sit-to-stand': existing },
      chairStandReps: 4, // would otherwise seed the cushion level
      nowIso: NOW,
    });
    expect(next['sit-to-stand']).toBe(existing);
  });

  it('ignores missing/non-finite values and leaves ladders untouched', () => {
    const next = initialLadderProgressFromMeasuredCapability({
      previousLadderProgress: {},
      chairStandReps: null,
      singleLegHoldSec: undefined,
      nowIso: NOW,
    });
    expect(next).toEqual({});
  });

  it('initialLadderProgressFromCheckUp reads the same signal from a CheckUpScore, never from age', () => {
    const score: CheckUpScore = {
      startedAt: NOW,
      weakestDomain: 'strength',
      domains: [
        domainResult({ domain: 'strength', primaryMetricValue: 6 }),
        domainResult({ domain: 'balance', label: 'Balance', primaryMetricValue: 35 }),
        domainResult({ domain: 'mobility', label: 'Mobility', measured: false, primaryMetricValue: NaN }),
      ],
    };
    const next = initialLadderProgressFromCheckUp({ previousLadderProgress: {}, score, nowIso: NOW });
    expect(next['sit-to-stand']?.currentLevelId).toBe(STS_CUSHION_ID);
    expect(next.balance?.currentLevelId).toBe(BALANCE_TANDEM_ID);
  });

  it('initialLadderProgressFromCheckUp ignores an unmeasured domain entirely', () => {
    const score: CheckUpScore = {
      startedAt: NOW,
      weakestDomain: null,
      domains: [domainResult({ domain: 'strength', measured: false, primaryMetricValue: NaN })],
    };
    const next = initialLadderProgressFromCheckUp({ previousLadderProgress: {}, score: score, nowIso: NOW });
    expect(next).toEqual({});
    expect(initialLadderProgressFromCheckUp({ previousLadderProgress: {}, score: null, nowIso: NOW })).toEqual({});
  });
});

describe('balanced session template rotation', () => {
  it('defaults to the original strength-A/balance-B/mobility-C combo with no seed', () => {
    const templates = createBalancedSessionTemplates();
    expect(templates.map((t) => t.sourceTemplateId)).toEqual(['strength-A', 'balance-B', 'mobility-C']);
  });

  it('is deterministic for a given block id and covers more than one combo across ids', () => {
    const first = createBalancedSessionTemplates('movement-block-v2:abc');
    const again = createBalancedSessionTemplates('movement-block-v2:abc');
    expect(first.map((t) => t.sourceTemplateId)).toEqual(again.map((t) => t.sourceTemplateId));

    const combos = new Set(
      Array.from({ length: 30 }, (_, i) => `movement-block-v2:seed-${i}`).map((seed) =>
        createBalancedSessionTemplates(seed).map((t) => t.sourceTemplateId).join(',')
      )
    );
    expect(combos.size).toBeGreaterThan(1);
  });

  it('always keeps template ids and per-slot domains stable regardless of rotation', () => {
    for (const seed of ['a', 'b', 'c', 'd', 'e']) {
      const templates = createBalancedSessionTemplates(seed);
      expect(templates.map((t) => t.id)).toEqual(['balanced-A', 'balanced-B', 'balanced-C']);
      expect(templates.map((t) => t.focusDomain)).toEqual(['strength_power', 'balance_stability', 'mobility_flexibility']);
    }
  });
});
