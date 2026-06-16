/**
 * Profile + preferences entry point. Like the history barrel, the
 * expo-file-system store adapter is NOT re-exported here — app code constructs
 * ProfileStore with the shared fs adapter directly — so importing this barrel
 * never pulls in a native module.
 */

export type { AppSettings, OnboardingState, OnboardingStep, Preferences, UserProfile } from './types';
export { EMPTY_PROFILE } from './types';
export {
  PREFERENCES_SCHEMA_VERSION,
  defaultPreferences,
  deserializePreferences,
  serializePreferences,
} from './serialize';
export { ProfileStore } from './store';
export { DEFAULT_VOICE_ID, VOICE_OPTIONS, getVoice } from './voices';
export type { VoiceOption } from './voices';
