import { resolveVoiceV21Activation } from '../../config/voiceExperience';
import { isEyesOpenBalanceProtocolV2Selectable } from '../../config/eyesOpenBalanceProtocolV2';
import { selectMicroCheckVoiceRuntimeModeV21 } from '../microCheckVoiceV21';
import { selectTrainingVoiceRuntimeModeV21 } from '../voiceV21';

describe('default voice runtime selection', () => {
  it('selects Training Voice V2.1 for the default app voice path', () => {
    const activation = resolveVoiceV21Activation();

    expect(
      selectTrainingVoiceRuntimeModeV21({
        exerciseIds: ['squat-free'],
        featureEnabled: activation.trainingVoiceV21Enabled,
        betaDefaultEnabled: true,
      })
    ).toMatchObject({ mode: 'training_voice_v2_1', v21Selectable: true });
  });

  it('selects Micro-Check Voice V2.1 once physical audio is complete', () => {
    const activation = resolveVoiceV21Activation();

    expect(
      selectMicroCheckVoiceRuntimeModeV21({
        microCheckTypes: ['chair-power', 'single-leg-balance', 'mobility-reach'],
        featureEnabled: activation.microCheckVoiceV21Enabled,
        betaDefaultEnabled: true,
      })
    ).toMatchObject({ mode: 'micro_check_voice_v2_1', v21Selectable: true });
  });

  it('selects MPV2 voice runtime and eyes-open balance in the default app voice path', () => {
    const activation = resolveVoiceV21Activation();

    expect(activation.movementCheckUpV21Enabled).toBe(true);
    expect(activation.eyesOpenBalanceV2Enabled).toBe(true);
    expect(isEyesOpenBalanceProtocolV2Selectable({ betaDefaultEnabled: true })).toBe(true);
  });
});
