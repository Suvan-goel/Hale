import {
  CONTROLLED_BETA_HIDDEN_OPTIONAL_LEVEL_IDS,
  BALANCE_FEET_TOGETHER_ID,
  BALANCE_TANDEM_ID,
  LOADED_STS_ID,
  PUSHUP_INCLINE_ID,
  PUSHUP_WALL_ID,
  SQUAT_FREE_ID,
  SQUAT_SUPPORTED_ID,
  STS_CUSHION_ID,
  STS_POWER_ID,
  STS_SLOW_ECC_ID,
  STS_STANDARD_ID,
  controlledBetaProgressionPolicyFingerprint,
  getControlledBetaProgressionPolicy,
  listControlledBetaProgressionPolicies,
  listExerciseLadders,
  transitionPolicyFor,
} from '../index';

describe('controlled-beta progression policy', () => {
  const ladders = listExerciseLadders();
  const policies = listControlledBetaProgressionPolicies();

  it('covers every registered ladder and level deterministically', () => {
    expect(ladders).toHaveLength(11);
    expect(ladders.flatMap((ladder) => ladder.levels)).toHaveLength(37);
    expect(policies.map((policy) => policy.ladderId).sort()).toEqual(
      ladders.map((ladder) => ladder.id).sort()
    );

    for (const ladder of ladders) {
      const policy = getControlledBetaProgressionPolicy(ladder.id);
      expect(policy.model).toBe(ladder.progressionModel);
      expect(policy.levelIds).toEqual(ladder.levels.map((level) => level.id));
      expect(policy.schemaVersion).toBe(1);
      expect(ladder.levels.map((level) => level.id)).toContain(policy.defaultSelectionLevelId);
      expect(ladder.levels.map((level) => level.id)).toContain(policy.autoProgressionCeilingLevelId);
    }

    expect(controlledBetaProgressionPolicyFingerprint()).toBe(controlledBetaProgressionPolicyFingerprint());
  });

  it('declares no duplicate transitions and never allows hidden optional beta auto-reachability', () => {
    const hidden = new Set<string>(CONTROLLED_BETA_HIDDEN_OPTIONAL_LEVEL_IDS);
    for (const policy of policies) {
      const seen = new Set<string>();
      for (const transition of policy.transitions) {
        const key = `${transition.fromLevelId}->${transition.toLevelId}:${transition.direction}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
        expect(policy.levelIds).toContain(transition.fromLevelId);
        expect(policy.levelIds).toContain(transition.toLevelId);
        if (transition.controlledBetaAllowed) expect(hidden.has(transition.toLevelId)).toBe(false);
      }
    }
  });

  it('allows the gentle step-up forward transitions up to each released ceiling', () => {
    const allowed = policies.flatMap((policy) =>
      policy.transitions
        .filter((transition) => transition.direction === 'forward' && transition.controlledBetaAllowed)
        .map((transition) => `${policy.ladderId}:${transition.fromLevelId}->${transition.toLevelId}`)
    );

    expect(allowed.sort()).toEqual([
      `balance:${BALANCE_FEET_TOGETHER_ID}->${BALANCE_TANDEM_ID}`,
      `push:${PUSHUP_WALL_ID}->${PUSHUP_INCLINE_ID}`,
      `sit-to-stand:${STS_CUSHION_ID}->${STS_STANDARD_ID}`,
      `sit-to-stand:${STS_SLOW_ECC_ID}->${STS_POWER_ID}`,
      `sit-to-stand:${STS_STANDARD_ID}->${STS_SLOW_ECC_ID}`,
      `squat:${SQUAT_SUPPORTED_ID}->${SQUAT_FREE_ID}`,
    ].sort());
  });

  it('keeps supporting sets and collections non-mutating', () => {
    for (const policy of policies.filter((item) => item.model !== 'linear_progression')) {
      expect(policy.transitions.some((transition) => transition.controlledBetaAllowed)).toBe(false);
    }
  });

  it('still fails closed past each released ceiling and for non-linear ladders', () => {
    // Power is the top released sit-to-stand level; loaded stays optional/hidden.
    expect(transitionPolicyFor('sit-to-stand', STS_POWER_ID, LOADED_STS_ID, 'forward')).toMatchObject({
      controlledBetaAllowed: false,
      status: 'blocked_manual_only',
    });
    // Free is the top released squat level; the slow-eccentric progression stays gated.
    expect(transitionPolicyFor('squat', SQUAT_FREE_ID, 'squat-slow-eccentric', 'forward')).toMatchObject({
      controlledBetaAllowed: false,
      status: 'blocked_pending_domain_review',
    });
    expect(transitionPolicyFor('mobility-flexibility', 'seated-hamstring-reach', 'thoracic-rotation', 'forward')).toMatchObject({
      controlledBetaAllowed: false,
      status: 'blocked_non_linear_model',
    });
  });
});
