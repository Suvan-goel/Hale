import { resolveVoiceV21Activation } from '../voiceExperience';

describe('voice activation resolver', () => {
  it('enables the bundled default voice path without marking approval true', () => {
    const activation = resolveVoiceV21Activation();

    expect(activation).toMatchObject({
      trainingVoiceV21Enabled: true,
      microCheckVoiceV21Enabled: true,
      movementCheckUpV21Enabled: true,
      eyesOpenBalanceV2Enabled: true,
      stepUpAlternationEnabled: true,
      floorV21Enabled: true,
      audioApprovalReady: false,
      featureSelectable: true,
    });
    expect(activation.trainingSelectableExerciseCount).toBeGreaterThan(0);
    expect(activation.microCheckSelectableTypeCount).toBe(3);
    expect(activation.reasonCodes).toEqual(
      expect.arrayContaining([
        'default_voice_system_enabled',
      ])
    );
  });

  it('reports selectable coverage for the default voice path', () => {
    const activation = resolveVoiceV21Activation();

    expect(activation.trainingSelectableExerciseCount).toBeGreaterThan(0);
    expect(activation.microCheckSelectableTypeCount).toBe(3);
    expect(activation.reasonCodes).toContain('default_voice_system_enabled');
  });
});
