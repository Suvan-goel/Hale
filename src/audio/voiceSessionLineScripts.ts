/**
 * Voice-guided session line scripts (2026-07-06 slice). Pure data, imported
 * by scripts/generate-audio.ts for ElevenLabs generation AND linted in CI by
 * the hot-phrase guardrail (src/voice/__tests__/hotPhraseGuardrail.test.ts) —
 * no line here may contain a hot phrase or a word in the matcher's fuzzy
 * neighborhood of one, because the safety vocabulary listens while these
 * lines play.
 *
 * Tone rules (reviewed against the working agreement): patient, warm, never
 * clinical, never judgmental, never apologetic about technology. The app
 * waits for her; it never hurries her. Claims discipline applies to every
 * string.
 */

export const VOICE_SESSION_LINE_SCRIPTS: Record<string, string> = {
  'voice-say-ready':
    "Take all the time you need to get set. When you are, say ‘I'm ready’ — or tap the button.",
  'voice-say-ready-reprompt':
    "No rush at all. Whenever you're set, just say ‘I'm ready’, or use the button on screen.",
  'voice-done-reprompt':
    "Still here with you. Say ‘done’ when you've finished, or tap the button whenever you like.",
  'voice-resume-counts':
    "Welcome back. Pick up right where you left off — every rep you've done this set still counts.",
  'pain-acknowledge':
    "Okay — we'll leave that one for today. Nothing to push through. Let's move on together.",
};
