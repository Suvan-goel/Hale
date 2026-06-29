import {
  EYES_OPEN_BALANCE_PROTOCOL_V2_AUDIO_APPROVAL_READY,
  EYES_OPEN_BALANCE_PROTOCOL_V2_PHYSICAL_AUDIO_SURFACE_READY,
} from './eyesOpenBalanceProtocolV2';
import { MPV2_VOICE_RUNTIME_FOUNDATION_ENABLED } from './movementProfileV2VoiceRuntimeFoundation';
import {
  MICRO_CHECK_VOICE_V2_1_AUDIO_APPROVAL_READY,
  MICRO_CHECK_VOICE_V2_1_BEHAVIOR_READY,
  MICRO_CHECK_VOICE_V2_1_PHYSICAL_AUDIO_SURFACE_READY,
  microCheckVoiceSelectableTypeCountV21,
} from '../training/microCheckVoiceV21/readiness';
import { TRAINING_STEP_UP_ALTERNATION_SOFTWARE_READY } from '../training/stepUpAlternation';
import { listTrainingVoiceContractsV21 } from '../training/voiceV21/contracts';
import {
  TRAINING_VOICE_V2_1_AUDIO_APPROVAL_READY,
  TRAINING_VOICE_V2_1_BEHAVIOR_READY,
  TRAINING_VOICE_V2_1_PHYSICAL_AUDIO_SURFACE_READY,
  resolveTrainingVoiceRuntimeReadinessV21,
} from '../training/voiceV21/readiness';

export interface VoiceV21Activation {
  readonly trainingVoiceV21Enabled: boolean;
  readonly microCheckVoiceV21Enabled: boolean;
  readonly movementCheckUpV21Enabled: boolean;
  readonly eyesOpenBalanceV2Enabled: boolean;
  readonly stepUpAlternationEnabled: boolean;
  readonly floorV21Enabled: boolean;
  readonly trainingSelectableExerciseCount: number;
  readonly microCheckSelectableTypeCount: number;
  readonly physicalAudioSurfaceReady: boolean;
  readonly audioApprovalReady: false;
  readonly featureSelectable: boolean;
  readonly reasonCodes: readonly string[];
}

export function resolveVoiceV21Activation(): VoiceV21Activation {
  const physicalAudioSurfaceReady =
    TRAINING_VOICE_V2_1_PHYSICAL_AUDIO_SURFACE_READY &&
    MICRO_CHECK_VOICE_V2_1_PHYSICAL_AUDIO_SURFACE_READY &&
    EYES_OPEN_BALANCE_PROTOCOL_V2_PHYSICAL_AUDIO_SURFACE_READY;
  const trainingVoiceV21Enabled =
    TRAINING_VOICE_V2_1_BEHAVIOR_READY && TRAINING_VOICE_V2_1_PHYSICAL_AUDIO_SURFACE_READY;
  const microCheckVoiceV21Enabled =
    MICRO_CHECK_VOICE_V2_1_BEHAVIOR_READY && MICRO_CHECK_VOICE_V2_1_PHYSICAL_AUDIO_SURFACE_READY;
  const movementCheckUpV21Enabled = MPV2_VOICE_RUNTIME_FOUNDATION_ENABLED;
  const eyesOpenBalanceV2Enabled = EYES_OPEN_BALANCE_PROTOCOL_V2_PHYSICAL_AUDIO_SURFACE_READY;
  const stepUpAlternationEnabled = TRAINING_STEP_UP_ALTERNATION_SOFTWARE_READY;
  const floorV21Enabled = trainingVoiceV21Enabled;
  const trainingSelectableExerciseCount = trainingVoiceV21Enabled
    ? listTrainingVoiceContractsV21().filter((contract) =>
        resolveTrainingVoiceRuntimeReadinessV21({
          exerciseId: contract.exerciseId,
          betaDefaultEnabled: true,
        }).selectable
      ).length
    : 0;
  const microCheckSelectableTypeCount = microCheckVoiceV21Enabled
    ? microCheckVoiceSelectableTypeCountV21({ betaDefaultEnabled: true })
    : 0;
  const reasonCodes: string[] = ['default_voice_system_enabled'];
  if (!TRAINING_VOICE_V2_1_PHYSICAL_AUDIO_SURFACE_READY) {
    reasonCodes.push('training_physical_audio_surface_not_ready');
  }
  if (!MICRO_CHECK_VOICE_V2_1_PHYSICAL_AUDIO_SURFACE_READY) {
    reasonCodes.push('micro_physical_audio_surface_not_ready');
  }
  if (!EYES_OPEN_BALANCE_PROTOCOL_V2_PHYSICAL_AUDIO_SURFACE_READY) {
    reasonCodes.push('balance_physical_audio_surface_not_ready');
  }
  if (!MPV2_VOICE_RUNTIME_FOUNDATION_ENABLED) reasonCodes.push('mpv2_voice_runtime_foundation_disabled');
  if (TRAINING_VOICE_V2_1_AUDIO_APPROVAL_READY) reasonCodes.push('training_audio_approval_true_unexpected');
  if (MICRO_CHECK_VOICE_V2_1_AUDIO_APPROVAL_READY) reasonCodes.push('micro_audio_approval_true_unexpected');
  if (EYES_OPEN_BALANCE_PROTOCOL_V2_AUDIO_APPROVAL_READY) reasonCodes.push('balance_audio_approval_true_unexpected');

  return {
    trainingVoiceV21Enabled,
    microCheckVoiceV21Enabled,
    movementCheckUpV21Enabled,
    eyesOpenBalanceV2Enabled,
    stepUpAlternationEnabled,
    floorV21Enabled,
    trainingSelectableExerciseCount,
    microCheckSelectableTypeCount,
    physicalAudioSurfaceReady,
    audioApprovalReady: false,
    featureSelectable:
      trainingVoiceV21Enabled &&
      microCheckVoiceV21Enabled &&
      movementCheckUpV21Enabled &&
      eyesOpenBalanceV2Enabled,
    reasonCodes: unique(reasonCodes),
  };
}

function unique(items: readonly string[]): string[] {
  const out: string[] = [];
  for (const item of items) {
    if (!out.includes(item)) out.push(item);
  }
  return out;
}
