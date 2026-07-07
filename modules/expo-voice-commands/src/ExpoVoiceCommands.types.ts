/**
 * expo-voice-commands — on-device speech command recognition for voice-guided
 * training sessions. Privacy contract (TDD-ADDENDUM §2, CLAUDE.md audio-law
 * amendment 2026-07-05): recognition runs on-device only, listening happens in
 * explicit windows the JS layer opens/closes, no audio is stored, nothing
 * leaves the device. Transcripts exist transiently so src/voice/intents.ts
 * can match them; production code never persists them.
 */

export type VoicePermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface VoicePermissionResponse {
  status: VoicePermissionStatus;
  granted: boolean;
  canAskAgain: boolean;
}

export type OnDeviceAvailabilityReason =
  /** iOS: SFSpeechRecognizer with supportsOnDeviceRecognition for the locale. */
  | 'on_device_supported'
  /** Android 12+: SpeechRecognizer.isOnDeviceRecognitionAvailable. */
  | 'on_device_api'
  /**
   * Android < 12 (or on-device API unavailable): recognition exists and
   * EXTRA_PREFER_OFFLINE is requested, but the platform cannot HARD-guarantee
   * the on-device path. The spike's airplane-mode pass is the honest check.
   */
  | 'prefer_offline_fallback'
  | 'no_recognizer'
  | 'locale_unsupported'
  | 'not_available';

export interface OnDeviceAvailability {
  available: boolean;
  reason: OnDeviceAvailabilityReason;
}

export interface StartListeningOptions {
  /** BCP-47 tag; default en-GB (the audience). */
  locale?: string;
  /**
   * Keep the window open across recognizer end-of-utterance restarts (session
   * use). false = single-shot (spike harness trials).
   */
  continuous?: boolean;
  /**
   * PRESENCE-ONLY mode (clarity dual-task VAD, second scoped amendment):
   * transcript events are suppressed entirely — text never crosses the
   * bridge — and onSpeechActivity emits speaking booleans derived natively.
   */
  presenceOnly?: boolean;
}

export interface SpeechActivityEventPayload {
  speaking: boolean;
  timestampMs: number;
}

export interface TranscriptEventPayload {
  transcript: string;
  isFinal: boolean;
  timestampMs: number;
}

export type ListeningChangeReason =
  /** Recognizer is live and capturing. */
  | 'started'
  /** JS closed the window (stopListeningAsync). */
  | 'stopped'
  /** Single-shot window ended on end-of-utterance/silence. */
  | 'ended'
  | 'error';

export interface ListeningChangePayload {
  listening: boolean;
  reason: ListeningChangeReason;
}

export interface VoiceErrorPayload {
  /** Stable, platform-prefixed code (e.g. 'android_error_7', 'ios_no_speech'). */
  code: string;
  message: string;
}

export type ExpoVoiceCommandsEvents = {
  onTranscript: (payload: TranscriptEventPayload) => void;
  onListeningChange: (payload: ListeningChangePayload) => void;
  onVoiceError: (payload: VoiceErrorPayload) => void;
  /** presenceOnly windows only — booleans and timestamps, never text. */
  onSpeechActivity: (payload: SpeechActivityEventPayload) => void;
};
