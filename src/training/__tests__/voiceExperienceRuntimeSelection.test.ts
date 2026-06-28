import { resolveVoiceV21Activation } from '../../config/voiceExperience';
import { isEyesOpenBalanceProtocolV2Selectable } from '../../config/eyesOpenBalanceProtocolV2';
import { selectMicroCheckVoiceRuntimeModeV21 } from '../microCheckVoiceV21';
import { selectTrainingVoiceRuntimeModeV21 } from '../voiceV21';

describe('Voice experience runtime selection', () => {
  it('selects Training Voice V2.1 in beta mode and legacy in legacy mode', () => {
    const beta = resolveVoiceV21Activation({ persistedMode: 'v21_beta', env: {} });
    const legacy = resolveVoiceV21Activation({ persistedMode: 'legacy', env: {} });

    expect(
      selectTrainingVoiceRuntimeModeV21({
        exerciseIds: ['squat-free'],
        featureEnabled: beta.trainingVoiceV21Enabled,
        betaDefaultEnabled: beta.voiceV21BetaDefaultEnabled,
      })
    ).toMatchObject({ mode: 'training_voice_v2_1', v21Selectable: true });
    expect(
      selectTrainingVoiceRuntimeModeV21({
        exerciseIds: ['squat-free'],
        featureEnabled: legacy.trainingVoiceV21Enabled,
        betaDefaultEnabled: legacy.voiceV21BetaDefaultEnabled,
      })
    ).toMatchObject({ mode: 'legacy', v21Selectable: false });
  });

  it('selects Micro-Check Voice V2.1 in beta mode once physical audio is complete', () => {
    const beta = resolveVoiceV21Activation({ persistedMode: 'v21_beta', env: {} });
    const legacy = resolveVoiceV21Activation({ persistedMode: 'legacy', env: {} });

    expect(
      selectMicroCheckVoiceRuntimeModeV21({
        microCheckTypes: ['chair-power', 'single-leg-balance', 'mobility-reach'],
        featureEnabled: beta.microCheckVoiceV21Enabled,
        betaDefaultEnabled: beta.voiceV21BetaDefaultEnabled,
      })
    ).toMatchObject({ mode: 'micro_check_voice_v2_1', v21Selectable: true });
    expect(
      selectMicroCheckVoiceRuntimeModeV21({
        microCheckTypes: ['chair-power', 'single-leg-balance', 'mobility-reach'],
        featureEnabled: legacy.microCheckVoiceV21Enabled,
        betaDefaultEnabled: legacy.voiceV21BetaDefaultEnabled,
      })
    ).toMatchObject({ mode: 'legacy', v21Selectable: false });
  });

  it('selects MPV2 voice runtime and eyes-open balance only in beta mode', () => {
    const beta = resolveVoiceV21Activation({ persistedMode: 'v21_beta', env: {} });
    const legacy = resolveVoiceV21Activation({ persistedMode: 'legacy', env: {} });

    expect(beta.movementCheckUpV21Enabled).toBe(true);
    expect(beta.eyesOpenBalanceV2Enabled).toBe(true);
    expect(isEyesOpenBalanceProtocolV2Selectable({ betaDefaultEnabled: beta.voiceV21BetaDefaultEnabled })).toBe(true);
    expect(legacy.movementCheckUpV21Enabled).toBe(false);
    expect(legacy.eyesOpenBalanceV2Enabled).toBe(false);
    expect(isEyesOpenBalanceProtocolV2Selectable({ betaDefaultEnabled: legacy.voiceV21BetaDefaultEnabled })).toBe(false);
  });

  it('models active-flow pinning by keeping the launch activation stable after settings change', () => {
    const pinnedAtLaunch = resolveVoiceV21Activation({ persistedMode: 'v21_beta', env: {} });
    const changedSetting = resolveVoiceV21Activation({ persistedMode: 'legacy', env: {} });

    expect(pinnedAtLaunch.mode).toBe('v21_beta');
    expect(changedSetting.mode).toBe('legacy');
    expect(pinnedAtLaunch.trainingVoiceV21Enabled).toBe(true);
    expect(changedSetting.trainingVoiceV21Enabled).toBe(false);
  });
});
