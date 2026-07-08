import { isEyesOpenBalanceProtocolV2Selectable } from '../../config/eyesOpenBalanceProtocolV2';
import { selectTrainingVoiceRuntimeModeV21 } from '../voiceV21';

// Trimmed with the old-engine cleanup (2026-07-08): the micro-check voice
// runtime and its voiceExperience activation config were deleted (nothing
// mounts micro-checks since promotion). The live pins below are unchanged:
// the training voice V2.1 runtime is the default session voice path, and the
// eyes-open balance protocol V2 stays selectable.

describe('default voice runtime selection', () => {
  it('selects Training Voice V2.1 for the default app voice path', () => {
    expect(
      selectTrainingVoiceRuntimeModeV21({
        exerciseIds: ['squat-free'],
        featureEnabled: true,
        betaDefaultEnabled: true,
      })
    ).toMatchObject({ mode: 'training_voice_v2_1', v21Selectable: true });
  });

  it('keeps eyes-open balance protocol V2 selectable in the default app path', () => {
    expect(isEyesOpenBalanceProtocolV2Selectable({ betaDefaultEnabled: true })).toBe(true);
  });
});
