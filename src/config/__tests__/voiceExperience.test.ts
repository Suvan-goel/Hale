import {
  FORCE_LEGACY_VOICE_ENV,
  VOICE_EXPERIENCE_MODE_ENV,
  resolveVoiceV21Activation,
} from '../voiceExperience';

describe('Voice V2.1 beta activation resolver', () => {
  it('defaults fresh installs to V2.1 beta without marking approval true', () => {
    const activation = resolveVoiceV21Activation({ env: {} });

    expect(activation).toMatchObject({
      mode: 'v21_beta',
      source: 'default',
      trainingVoiceV21Enabled: true,
      microCheckVoiceV21Enabled: true,
      movementCheckUpV21Enabled: true,
      eyesOpenBalanceV2Enabled: true,
      stepUpAlternationEnabled: true,
      floorV21Enabled: true,
      audioApprovalReady: false,
      legacyFallbackAvailable: true,
    });
    expect(activation.trainingSelectableExerciseCount).toBeGreaterThan(0);
    expect(activation.microCheckSelectableTypeCount).toBe(3);
  });

  it('uses persisted legacy and V2.1 settings when no emergency override is active', () => {
    expect(resolveVoiceV21Activation({ persistedMode: 'legacy', env: {} })).toMatchObject({
      mode: 'legacy',
      source: 'persisted_setting',
      trainingVoiceV21Enabled: false,
      microCheckVoiceV21Enabled: false,
    });

    expect(resolveVoiceV21Activation({ persistedMode: 'v21_beta', env: {} })).toMatchObject({
      mode: 'v21_beta',
      source: 'persisted_setting',
      trainingVoiceV21Enabled: true,
      microCheckVoiceV21Enabled: true,
    });
  });

  it('lets force legacy env override all persisted or explicit env mode values', () => {
    const activation = resolveVoiceV21Activation({
      persistedMode: 'v21_beta',
      env: {
        [FORCE_LEGACY_VOICE_ENV]: '1',
        [VOICE_EXPERIENCE_MODE_ENV]: 'v21_beta',
      },
    });

    expect(activation).toMatchObject({
      mode: 'legacy',
      source: 'force_legacy_env',
      trainingVoiceV21Enabled: false,
      microCheckVoiceV21Enabled: false,
    });
    expect(activation.reasonCodes).toContain('force_legacy_env_override');
  });

  it('falls back safely for invalid persisted values with deterministic reasons', () => {
    const activation = resolveVoiceV21Activation({ persistedMode: 'not-a-mode', env: {} });

    expect(activation.mode).toBe('v21_beta');
    expect(activation.source).toBe('default');
    expect(activation.reasonCodes).toEqual(
      expect.arrayContaining([
        'mode:v21_beta',
        'source:default',
        'beta_default_enabled',
        'invalid_persisted_mode_defaulted',
      ])
    );
  });

  it('reports beta and legacy selectable counts separately', () => {
    const beta = resolveVoiceV21Activation({ persistedMode: 'v21_beta', env: {} });
    const legacy = resolveVoiceV21Activation({ persistedMode: 'legacy', env: {} });

    expect(beta.trainingSelectableExerciseCount).toBeGreaterThan(0);
    expect(beta.microCheckSelectableTypeCount).toBe(3);
    expect(legacy.trainingSelectableExerciseCount).toBe(0);
    expect(legacy.microCheckSelectableTypeCount).toBe(0);
    expect(beta.trainingSelectableExerciseCountLegacy).toBe(0);
    expect(beta.microCheckSelectableTypeCountLegacy).toBe(0);
  });
});
