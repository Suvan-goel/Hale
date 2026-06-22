import {
  CONTROLLED_BETA_HIDDEN_OPTIONAL_LEVEL_IDS,
  BALANCE_FEET_TOGETHER_ID,
  BALANCE_TANDEM_ID,
  STS_CUSHION_ID,
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

  it('allows only the controlled-beta automatic forward transitions', () => {
    const allowed = policies.flatMap((policy) =>
      policy.transitions
        .filter((transition) => transition.direction === 'forward' && transition.controlledBetaAllowed)
        .map((transition) => `${policy.ladderId}:${transition.fromLevelId}->${transition.toLevelId}`)
    );

    expect(allowed.sort()).toEqual([
      `balance:${BALANCE_FEET_TOGETHER_ID}->${BALANCE_TANDEM_ID}`,
      `sit-to-stand:${STS_CUSHION_ID}->${STS_STANDARD_ID}`,
    ].sort());
  });

  it('keeps supporting sets and collections non-mutating', () => {
    for (const policy of policies.filter((item) => item.model !== 'linear_progression')) {
      expect(policy.transitions.some((transition) => transition.controlledBetaAllowed)).toBe(false);
    }
  });

  it('fails closed for undeclared adjacent transitions', () => {
    expect(transitionPolicyFor('sit-to-stand', STS_STANDARD_ID, 'sts-slow-eccentric', 'forward')).toMatchObject({
      controlledBetaAllowed: false,
      status: 'blocked_pending_domain_review',
    });
    expect(transitionPolicyFor('push', 'push-up-wall', 'push-up-incline', 'forward')).toMatchObject({
      controlledBetaAllowed: false,
      status: 'blocked_pending_device_validation',
    });
    expect(transitionPolicyFor('mobility-flexibility', 'seated-hamstring-reach', 'thoracic-rotation', 'forward')).toMatchObject({
      controlledBetaAllowed: false,
      status: 'blocked_non_linear_model',
    });
  });
});
