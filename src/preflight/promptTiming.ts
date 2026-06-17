import type { VoiceCueKey } from '../audio/cues';

export const MIN_FRAMING_PROMPT_GAP_MS = 5000;

export function shouldSpeakFramingPrompt({
  cue,
  lastCue,
  lastSpokenAtMs,
  nowMs,
  repeatMs,
}: {
  cue: VoiceCueKey;
  lastCue: VoiceCueKey | null;
  lastSpokenAtMs: number;
  nowMs: number;
  repeatMs: number;
}): boolean {
  if (!Number.isFinite(lastSpokenAtMs)) return true;
  const elapsed = nowMs - lastSpokenAtMs;
  if (elapsed < MIN_FRAMING_PROMPT_GAP_MS) return false;
  if (cue !== lastCue) return true;
  return elapsed >= repeatMs;
}
