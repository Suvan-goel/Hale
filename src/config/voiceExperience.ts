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
import {
  DEFAULT_VOICE_EXPERIENCE_MODE,
  parseVoiceExperienceMode,
  type VoiceExperienceMode,
} from './voiceExperienceTypes';

export { DEFAULT_VOICE_EXPERIENCE_MODE, parseVoiceExperienceMode, type VoiceExperienceMode };

export const FORCE_LEGACY_VOICE_ENV = 'EXPO_PUBLIC_FORCE_LEGACY_VOICE' as const;
export const VOICE_EXPERIENCE_MODE_ENV = 'EXPO_PUBLIC_VOICE_EXPERIENCE_MODE' as const;

export type VoiceActivationSource =
  | 'force_legacy_env'
  | 'env_mode'
  | 'persisted_setting'
  | 'default';

export interface VoiceV21Activation {
  readonly mode: VoiceExperienceMode;
  readonly source: VoiceActivationSource;
  readonly trainingVoiceV21Enabled: boolean;
  readonly microCheckVoiceV21Enabled: boolean;
  readonly movementCheckUpV21Enabled: boolean;
  readonly eyesOpenBalanceV2Enabled: boolean;
  readonly stepUpAlternationEnabled: boolean;
  readonly floorV21Enabled: boolean;
  readonly trainingSelectableExerciseCount: number;
  readonly microCheckSelectableTypeCount: number;
  readonly trainingSelectableExerciseCountLegacy: number;
  readonly microCheckSelectableTypeCountLegacy: number;
  readonly physicalAudioSurfaceReady: boolean;
  readonly audioApprovalReady: false;
  readonly voiceV21BetaDefaultEnabled: boolean;
  readonly featureSelectableForBeta: boolean;
  readonly legacyFallbackAvailable: boolean;
  readonly reasonCodes: readonly string[];
}

export interface ResolveVoiceV21ActivationInput {
  readonly persistedMode?: unknown;
  readonly env?: Record<string, string | undefined>;
}

export function resolveVoiceV21Activation(
  input: ResolveVoiceV21ActivationInput = {}
): VoiceV21Activation {
  const env = input.env ?? process.env;
  const forcedLegacy = isForceLegacyEnabled(env[FORCE_LEGACY_VOICE_ENV]);
  const envMode = parseVoiceExperienceMode(env[VOICE_EXPERIENCE_MODE_ENV]);
  const persistedMode = parseVoiceExperienceMode(input.persistedMode);
  const invalidPersistedMode =
    input.persistedMode !== undefined && input.persistedMode !== null && !persistedMode;
  const mode = forcedLegacy
    ? 'legacy'
    : envMode ?? persistedMode ?? DEFAULT_VOICE_EXPERIENCE_MODE;
  const source: VoiceActivationSource = forcedLegacy
    ? 'force_legacy_env'
    : envMode
      ? 'env_mode'
      : persistedMode
        ? 'persisted_setting'
        : 'default';
  const beta = mode === 'v21_beta';
  const physicalAudioSurfaceReady =
    TRAINING_VOICE_V2_1_PHYSICAL_AUDIO_SURFACE_READY &&
    MICRO_CHECK_VOICE_V2_1_PHYSICAL_AUDIO_SURFACE_READY &&
    EYES_OPEN_BALANCE_PROTOCOL_V2_PHYSICAL_AUDIO_SURFACE_READY;
  const trainingVoiceV21Enabled =
    beta && TRAINING_VOICE_V2_1_BEHAVIOR_READY && TRAINING_VOICE_V2_1_PHYSICAL_AUDIO_SURFACE_READY;
  const microCheckVoiceV21Enabled =
    beta && MICRO_CHECK_VOICE_V2_1_BEHAVIOR_READY && MICRO_CHECK_VOICE_V2_1_PHYSICAL_AUDIO_SURFACE_READY;
  const movementCheckUpV21Enabled = beta && MPV2_VOICE_RUNTIME_FOUNDATION_ENABLED;
  const eyesOpenBalanceV2Enabled = beta && EYES_OPEN_BALANCE_PROTOCOL_V2_PHYSICAL_AUDIO_SURFACE_READY;
  const stepUpAlternationEnabled = beta && TRAINING_STEP_UP_ALTERNATION_SOFTWARE_READY;
  const floorV21Enabled = beta && trainingVoiceV21Enabled;
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
  const reasonCodes: string[] = [
    `mode:${mode}`,
    `source:${source}`,
    beta ? 'beta_default_enabled' : 'legacy_mode_selected',
  ];
  if (forcedLegacy) reasonCodes.push('force_legacy_env_override');
  if (envMode) reasonCodes.push(`env_mode:${envMode}`);
  if (invalidPersistedMode) reasonCodes.push('invalid_persisted_mode_defaulted');
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
    mode,
    source,
    trainingVoiceV21Enabled,
    microCheckVoiceV21Enabled,
    movementCheckUpV21Enabled,
    eyesOpenBalanceV2Enabled,
    stepUpAlternationEnabled,
    floorV21Enabled,
    trainingSelectableExerciseCount,
    microCheckSelectableTypeCount,
    trainingSelectableExerciseCountLegacy: 0,
    microCheckSelectableTypeCountLegacy: 0,
    physicalAudioSurfaceReady,
    audioApprovalReady: false,
    voiceV21BetaDefaultEnabled: beta,
    featureSelectableForBeta:
      beta &&
      trainingVoiceV21Enabled &&
      microCheckVoiceV21Enabled &&
      movementCheckUpV21Enabled &&
      eyesOpenBalanceV2Enabled,
    legacyFallbackAvailable: true,
    reasonCodes: unique(reasonCodes),
  };
}

function isForceLegacyEnabled(value: unknown): boolean {
  return value === '1' || value === 'true' || value === 'TRUE' || value === 'legacy';
}

function unique(items: readonly string[]): string[] {
  const out: string[] = [];
  for (const item of items) {
    if (!out.includes(item)) out.push(item);
  }
  return out;
}
