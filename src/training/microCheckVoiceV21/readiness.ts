import type { MicroCheckType } from '../microCheck';
import { maybeMicroCheckVoiceContractV21, validateMicroCheckVoiceContractRegistryV21 } from './contracts';
import {
  listMicroCheckVoiceAssetRequirementsV21,
  requiredAssetCueKeysMissingForMicroCheckContractV21,
} from './assets';
import type {
  MicroCheckVoiceRuntimeReadinessV21,
  MicroCheckVoiceRuntimeSelectionV21,
} from './types';

export const MICRO_CHECK_VOICE_V2_1_FEATURE_FLAG = 'EXPO_PUBLIC_ENABLE_MICRO_CHECK_VOICE_V2_1' as const;
export const MICRO_CHECK_VOICE_V2_1_BEHAVIOR_READY = true as const;
export const MICRO_CHECK_VOICE_V2_1_PHYSICAL_AUDIO_SURFACE_READY = microCheckVoicePhysicalAudioSurfaceReadyV21();
export const MICRO_CHECK_VOICE_V2_1_AUDIO_APPROVAL_READY = false as const;
export const MICRO_CHECK_VOICE_V2_1_AUDIO_READY = false as const;
export const MICRO_CHECK_VOICE_V2_1_FEATURE_DEFAULT = 'off' as const;

export function microCheckVoicePhysicalAudioSurfaceReadyV21(): boolean {
  return listMicroCheckVoiceAssetRequirementsV21().every((row) => !row.generationRequiredLater);
}

export function resolveMicroCheckVoiceRuntimeReadinessV21(
  type: MicroCheckType
): MicroCheckVoiceRuntimeReadinessV21 {
  const contract = maybeMicroCheckVoiceContractV21(type);
  if (!contract) {
    return {
      type,
      softwareContractValid: false,
      behaviorReady: false,
      audioReady: false,
      selectable: false,
      blockers: [`missing_contract:${type}`],
      legacyFallbackAvailable: true,
      notes: 'Unknown micro-check fails closed for Micro-Check Voice V2.1.',
    };
  }
  const registry = validateMicroCheckVoiceContractRegistryV21();
  const missingAudioCueKeys = requiredAssetCueKeysMissingForMicroCheckContractV21(contract);
  const behaviorBlockers = contract.implementationRequirements
    .filter((requirement) => requirement !== 'IR-MICRO-VOICE-AUDIO-ASSETS' && requirement !== 'IR-MICRO-VOICE-FINAL-SCHEMA')
    .map((requirement) => `behavior_dependency:${requirement}`);
  const blockers: string[] = [];
  if (!registry.valid) blockers.push('registry_invalid');
  if (!MICRO_CHECK_VOICE_V2_1_BEHAVIOR_READY) blockers.push('global_behavior_ready_false');
  if (!MICRO_CHECK_VOICE_V2_1_AUDIO_READY) blockers.push('global_audio_ready_false');
  for (const requirement of behaviorBlockers) blockers.push(requirement);
  for (const cueKey of missingAudioCueKeys) blockers.push(`missing_audio:${cueKey}`);
  const softwareContractValid = registry.valid && missingAudioCueKeys.length >= 0;
  const behaviorReady = MICRO_CHECK_VOICE_V2_1_BEHAVIOR_READY && behaviorBlockers.length === 0;
  const audioReady = MICRO_CHECK_VOICE_V2_1_AUDIO_READY && missingAudioCueKeys.length === 0;
  return {
    type,
    softwareContractValid,
    behaviorReady,
    audioReady,
    selectable: softwareContractValid && behaviorReady && audioReady,
    blockers: unique(blockers),
    legacyFallbackAvailable: true,
    notes:
      blockers.length === 0
        ? 'Micro-Check Voice V2.1 item is selectable.'
        : 'Micro-Check Voice V2.1 is blocked and must use the legacy micro-check path.',
  };
}

export function selectMicroCheckVoiceRuntimeModeV21(input: {
  readonly microCheckTypes: readonly MicroCheckType[];
  readonly featureEnabled?: boolean;
}): MicroCheckVoiceRuntimeSelectionV21 {
  const featureEnabled = input.featureEnabled ?? isMicroCheckVoiceV21FeatureEnabled();
  const typeReadiness = input.microCheckTypes.map(resolveMicroCheckVoiceRuntimeReadinessV21);
  const reasonCodes: string[] = [];
  if (!featureEnabled) reasonCodes.push('feature_flag_off');
  if (!MICRO_CHECK_VOICE_V2_1_BEHAVIOR_READY) reasonCodes.push('behavior_ready_false');
  if (!MICRO_CHECK_VOICE_V2_1_AUDIO_READY) reasonCodes.push('audio_ready_false');
  for (const readiness of typeReadiness) {
    if (!readiness.selectable) reasonCodes.push(...readiness.blockers);
  }
  const v21Selectable =
    featureEnabled &&
    typeReadiness.length > 0 &&
    typeReadiness.every((readiness) => readiness.selectable);
  return {
    mode: v21Selectable ? 'micro_check_voice_v2_1' : 'legacy',
    featureEnabled,
    reasonCodes: unique(reasonCodes),
    typeReadiness,
    v21Selectable,
  };
}

export function microCheckVoiceSelectableTypeCountV21(
  types: readonly MicroCheckType[] = ['chair-power', 'single-leg-balance', 'mobility-reach']
): number {
  return types.filter((type) => resolveMicroCheckVoiceRuntimeReadinessV21(type).selectable).length;
}

export function isMicroCheckVoiceV21FeatureEnabled(
  env: Record<string, string | undefined> = process.env
): boolean {
  const raw = env[MICRO_CHECK_VOICE_V2_1_FEATURE_FLAG];
  return raw === '1' || raw === 'true' || raw === 'TRUE';
}

function unique(items: readonly string[]): string[] {
  const out: string[] = [];
  for (const item of items) {
    if (!out.includes(item)) out.push(item);
  }
  return out;
}
