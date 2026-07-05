import { NativeModule, requireNativeModule } from 'expo';

import type {
  ExpoVoiceCommandsEvents,
  OnDeviceAvailability,
  StartListeningOptions,
  VoicePermissionResponse,
} from './ExpoVoiceCommands.types';

declare class ExpoVoiceCommandsNativeModule extends NativeModule<ExpoVoiceCommandsEvents> {
  /** Requests mic (both platforms) + speech recognition (iOS). */
  requestPermissionsAsync(): Promise<VoicePermissionResponse>;
  getPermissionsAsync(): Promise<VoicePermissionResponse>;
  getOnDeviceAvailabilityAsync(locale: string): Promise<OnDeviceAvailability>;
  startListeningAsync(options: StartListeningOptions): Promise<void>;
  stopListeningAsync(): Promise<void>;
}

const unavailablePermissionResponse: VoicePermissionResponse = {
  status: 'undetermined',
  granted: false,
  canAskAgain: false,
};

/**
 * Same optional-native pattern as expo-pose-detection: in test/jest and in
 * builds without the native module (it is not in any release build until the
 * week-4 config change), every call is a safe no-op and availability reports
 * not_available — voice UI then never offers the mic path, tap parity carries
 * the session.
 */
const fallbackModule = {
  requestPermissionsAsync: () => Promise.resolve(unavailablePermissionResponse),
  getPermissionsAsync: () => Promise.resolve(unavailablePermissionResponse),
  getOnDeviceAvailabilityAsync: () =>
    Promise.resolve({ available: false, reason: 'not_available' } as OnDeviceAvailability),
  startListeningAsync: () => Promise.resolve(),
  stopListeningAsync: () => Promise.resolve(),
  addListener: () => ({ remove: () => {} }),
  removeAllListeners: () => {},
} as unknown as ExpoVoiceCommandsNativeModule;

function requireOptionalModule(): ExpoVoiceCommandsNativeModule {
  try {
    return requireNativeModule<ExpoVoiceCommandsNativeModule>('ExpoVoiceCommands');
  } catch {
    return fallbackModule;
  }
}

const ExpoVoiceCommandsModule = requireOptionalModule();

export default ExpoVoiceCommandsModule;

export function requestVoicePermissionsAsync(): Promise<VoicePermissionResponse> {
  return ExpoVoiceCommandsModule.requestPermissionsAsync();
}

export function getVoicePermissionsAsync(): Promise<VoicePermissionResponse> {
  return ExpoVoiceCommandsModule.getPermissionsAsync();
}

export function getOnDeviceAvailabilityAsync(locale = 'en-GB'): Promise<OnDeviceAvailability> {
  return ExpoVoiceCommandsModule.getOnDeviceAvailabilityAsync(locale);
}

export function startListeningAsync(options: StartListeningOptions = {}): Promise<void> {
  return ExpoVoiceCommandsModule.startListeningAsync(options);
}

export function stopListeningAsync(): Promise<void> {
  return ExpoVoiceCommandsModule.stopListeningAsync();
}
