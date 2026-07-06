/**
 * In-context mic permission gate (founder requirement 2, N3): pure decision
 * logic so the no-nagging rules are testable headlessly.
 *
 * Rules:
 * - First voice session with permission undecided → show the one honest
 *   prompt, ONCE ever. Dismissing it counts as asked.
 * - Granted + on-device recognition available → listen; the always-on
 *   safety-word line is spoken exactly once, ever, so the OS mic indicator
 *   is never a surprise.
 * - Anything else (denied, dismissed, recognizer unavailable) → full-function
 *   tap mode. No re-prompts, no nagging — voice is re-offered only from
 *   Settings, never mid-flow.
 */

import type {
  OnDeviceAvailability,
  VoicePermissionResponse,
} from '../../modules/expo-voice-commands';

export interface VoiceSetupPrefs {
  /** The in-context permission prompt has been shown (or dismissed) once. */
  promptShown: boolean;
  /** The one-time always-on safety-word explanation has been spoken/shown. */
  safetyLineShown: boolean;
}

export const DEFAULT_VOICE_SETUP_PREFS: VoiceSetupPrefs = {
  promptShown: false,
  safetyLineShown: false,
};

export type VoiceGateDecision =
  | { kind: 'show_permission_prompt' }
  | { kind: 'listen'; showSafetyLine: boolean }
  | { kind: 'tap_only' };

export function decideVoiceGate(input: {
  prefs: VoiceSetupPrefs;
  permission: VoicePermissionResponse | null;
  availability: OnDeviceAvailability | null;
}): VoiceGateDecision {
  const { prefs, permission, availability } = input;
  if (permission?.granted && availability?.available) {
    return { kind: 'listen', showSafetyLine: !prefs.safetyLineShown };
  }
  if (permission?.status === 'undetermined' && !prefs.promptShown) {
    return { kind: 'show_permission_prompt' };
  }
  return { kind: 'tap_only' };
}

/**
 * User-facing copy for the gate — claims-disciplined, implementation-true
 * (pinned by the guardrail-adjacent copy test). The mic prompt is the "one
 * honest sentence"; the safety line explains always-on listening.
 */
export const VOICE_GATE_COPY = {
  permissionPrompt:
    'Hale can listen for short session words like “I’m ready” and “done” — processed on your phone only, never recorded, never uploaded.',
  permissionAccept: 'Use voice',
  permissionDecline: 'Not now — I’ll tap',
  safetyLine:
    'I listen for “stop” and “that hurts” throughout your workout — on your phone only, never recorded.',
} as const;
