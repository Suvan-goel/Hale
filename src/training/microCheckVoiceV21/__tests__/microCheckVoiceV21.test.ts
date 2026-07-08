import {
  MICRO_CHECK_VOICE_TYPES_V21,
  listMicroCheckVoiceContractsV21,
  validateMicroCheckVoiceContractRegistryV21,
} from '../contracts';
import { planMicroCheckVoiceSequenceV21 } from '../sequencePlanner';

// Trimmed with the old-engine cleanup (2026-07-08, founder direction): the
// micro-check voice RUNTIME (runtime/readiness/assets/protocolCompatibility)
// was deleted — nothing has mounted micro-checks since promotion. The
// contracts and the sequence planner stay: the micro-check MEASUREMENT
// machinery (MicroCheckRunner) still plans its voice sequences through them,
// and live cue types derive from the contracts.

describe('Micro-Check Voice V2.1 contracts', () => {
  it('defines exactly the three live micro-check contracts and exact instruction scripts', () => {
    expect(MICRO_CHECK_VOICE_TYPES_V21).toEqual([
      'chair-power',
      'single-leg-balance',
      'mobility-reach',
    ]);
    expect(validateMicroCheckVoiceContractRegistryV21()).toMatchObject({
      valid: true,
      liveMicroCheckTypeCount: 3,
      contractCount: 3,
      genericMicroIntroEmissionCount: 0,
    });
    expect(listMicroCheckVoiceContractsV21()).toEqual([
      expect.objectContaining({
        type: 'chair-power',
        sideRole: 'not_applicable',
        sideRequired: false,
        setupCueKey: 'micro-chair-power-v21',
        exactScript: 'Five quick chair stands. Arms crossed. Stand and sit five times as quickly as safely comfortable.',
        endPolicy: 'accepted_rep_target_or_cap',
        repSfxOnly: true,
        progressCueKeys: [],
      }),
      expect.objectContaining({
        type: 'single-leg-balance',
        sideRole: 'standing_leg',
        sideRequired: true,
        setupCueKey: 'micro-single-leg-left-v21',
        exactScript: 'Quick balance check. Stand on your left leg with support nearby. Hold as long as comfortable.',
        endPolicy: 'hold_end_or_cap',
        repSfxOnly: false,
        progressCueKeys: [],
      }),
      expect.objectContaining({
        type: 'mobility-reach',
        sideRole: 'not_applicable',
        sideRequired: false,
        setupCueKey: 'micro-mobility-left-v21',
        exactScript: 'Quick mobility check. Stand side-on, hinge forward, and reach toward the floor until I say stand tall.',
        endPolicy: 'fixed_rom_window',
        stopCueKey: null,
        progressCueKeys: [],
      }),
    ]);
  });
});

describe('Micro-Check Voice V2.1 sequence planning', () => {
  it('plans side-specific setup, final position, and countdown without microcheck-intro', () => {
    const firstSetup = planMicroCheckVoiceSequenceV21({
      type: 'single-leg-balance',
      selectedSide: 'right',
      exposure: 'first_setup',
    }).cueKeys;
    expect(firstSetup).toEqual([
      'micro-single-leg-right-v21',
      'final-position-set-v21',
      'countdown-three',
      'countdown-two',
      'countdown-one',
      'go',
    ]);
    expect(firstSetup).not.toContain('microcheck-intro');
    expect(
      planMicroCheckVoiceSequenceV21({
        type: 'mobility-reach',
        exposure: 'repeat_instructions',
      }).cueKeys
    ).toEqual(['micro-mobility-left-v21']);
  });
});
