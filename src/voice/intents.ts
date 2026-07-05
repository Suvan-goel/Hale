/**
 * Voice-command intent matching — pure TS, no Expo imports, replay-testable.
 *
 * The native recognizers (iOS SFSpeechRecognizer on-device, Android on-device
 * SpeechRecognizer) return TRANSCRIPTS; this module turns a transcript into at
 * most one session intent. Everything tunable is plain data in
 * VOICE_INTENT_CONFIG (JSON-serializable — the spike harness sweeps it, and
 * the one allowed post-spike tuning iteration edits it), per the working rule
 * that thresholds live in config with their evidence, never in logic.
 *
 * Matching policy (recall vs precision, per TDD-ADDENDUM §1.3 and the frozen
 * spike criteria in docs/specs/VOICE_KWS_SPIKE_GO_NO_GO.md):
 * - The caller passes the intents VALID IN THE CURRENT WINDOW (the player
 *   knows its state); everything else is ignored. Context is the first and
 *   cheapest precision filter — "done" can't fire while waiting to start.
 * - Exact and contained-phrase matches always count (recognizers pad real
 *   speech: "yeah I'm ready now").
 * - Fuzzy matching (edit distance 1) applies only to words long enough that a
 *   one-letter slip can't reach a different common word — "done" stays exact
 *   so "down" can never fire it.
 * - Destructive-ish intents (skip) additionally require a SHORT utterance:
 *   "skip" fires, "we could skip the news tonight" does not. Zero false skips
 *   is a gating criterion.
 * - Ambiguity (two intents matched) resolves to the longer matched phrase,
 *   then to null. Silence is always safer than a wrong action; the windows
 *   re-listen continuously and tap parity is ever-present.
 *
 * Production stores no transcripts: callers consume the returned intent and
 * drop the string. (The dev spike harness logs transcripts locally for
 * diagnosis; that is a dev tool, not this module.)
 */

export type VoiceIntent =
  | 'ready'
  | 'done'
  | 'skip'
  | 'repeat'
  | 'pause'
  | 'resume'
  // Safety-word slice (approved 2026-07-05, pre-spike amendment):
  | 'stop'
  | 'pain';

/**
 * Hot vocabulary — enabled for the ENTIRE session, the one approved exception
 * to windowed listening. The runtime keeps these in every enabled-intent set,
 * including while the app itself is speaking (self-trigger risk is handled by
 * the script-lint guardrail: no bundled session line may contain a hot
 * phrase — see copyGuardrails).
 */
export const HOT_INTENTS: readonly VoiceIntent[] = ['stop', 'pain', 'pause'];

/**
 * Matched BEFORE commands: any safety match beats any command match
 * regardless of phrase length (recall beats precision on this vocabulary —
 * founder rule). Within safety, longer phrase wins; a pure tie resolves to
 * 'stop' (halting is the least destructive safe response; 'pain' also skips
 * the exercise).
 */
export const SAFETY_PRIORITY_INTENTS: readonly VoiceIntent[] = ['stop', 'pain'];

export interface IntentPhraseConfig {
  /** Accepted phrases, matched after normalization (case/punctuation-free). */
  readonly phrases: readonly string[];
  /**
   * Minimum word length for edit-distance-1 fuzzy matching within phrases.
   * Words shorter than this must match exactly. Provisional pre-spike values;
   * the spike's single tuning iteration adjusts here.
   */
  readonly fuzzyMinWordLength: number;
  /**
   * Reject the intent when the whole transcript exceeds this many words —
   * a long utterance containing the phrase is conversation, not a command.
   * Infinity = no cap.
   */
  readonly maxTranscriptWords: number;
}

export type VoiceIntentConfig = Record<VoiceIntent, IntentPhraseConfig>;

/**
 * Provisional pre-spike vocabulary (≤8 intents by spec; 6 used). Evidence for
 * every value lands with the spike results (VOICE_KWS_SPIKE_RESULTS.md).
 */
export const VOICE_INTENT_CONFIG: VoiceIntentConfig = {
  ready: {
    phrases: ["i'm ready", 'i am ready', 'ready', 'okay', 'ok'],
    fuzzyMinWordLength: 5,
    // "ready" embedded in a longer sentence is still a clear start signal,
    // but cap generously to shed dictation-length recognitions.
    maxTranscriptWords: 6,
  },
  done: {
    // Highest-recall intent (breathless user): several natural completions.
    phrases: ['done', "i'm done", 'i am done', 'all done', 'finished', "i'm finished", 'that is done'],
    // "done" (4 letters) stays exact — edit distance 1 would admit "down".
    fuzzyMinWordLength: 5,
    maxTranscriptWords: 6,
  },
  skip: {
    // Precision-critical: a false skip loses an exercise. Exact words only
    // (fuzzyMinWordLength above word lengths) and a short-utterance cap.
    phrases: ['skip', 'skip it', 'skip this', 'skip this one'],
    fuzzyMinWordLength: 99,
    maxTranscriptWords: 4,
  },
  repeat: {
    phrases: ['repeat', 'repeat that', 'say that again'],
    fuzzyMinWordLength: 5,
    maxTranscriptWords: 5,
  },
  pause: {
    phrases: ['pause', 'pause it'],
    fuzzyMinWordLength: 5,
    maxTranscriptWords: 4,
  },
  resume: {
    phrases: ['resume', 'continue', 'keep going'],
    fuzzyMinWordLength: 5,
    maxTranscriptWords: 4,
  },
  stop: {
    // Safety word — recall via VARIANTS rather than fuzz: "stop" is 4 letters
    // and edit-distance 1 reaches "step", a word this audience actually says
    // during step-ups. A false stop is a recoverable pause, but a per-set
    // recurring one would erode trust in the hot vocabulary.
    phrases: ['stop', 'stop it', 'stop now', 'stop please', 'please stop', 'stop stop'],
    fuzzyMinWordLength: 5,
    maxTranscriptWords: 6,
  },
  pain: {
    // Recall beats precision here (founder rule) — but fuzz starts at 5
    // letters, not 4: mangled breathless speech still fires via "hurts"/
    // "hurting" (ed-1), while the 4-letter words stay exact because their
    // ed-1 neighborhoods are everyday speech — "ouch" reaches much/such/
    // touch/couch, "sore" reaches sure, "hurt" reaches hut/curt. A false
    // pain fire skips an exercise; that cost rules those neighborhoods out.
    // Generous word cap — pain arrives wrapped in speech ("oh that really
    // hurts").
    phrases: [
      'that hurts',
      'it hurts',
      'this hurts',
      'that hurt',
      'it hurt',
      'hurts',
      'hurting',
      'ow',
      'ouch',
      'that is sore',
      'too sore',
    ],
    fuzzyMinWordLength: 5,
    maxTranscriptWords: 8,
  },
};

/**
 * Script-lint comparator for bundled voice lines: does this line contain any
 * HOT phrase or a word inside the matcher's OWN fuzzy neighborhood of one?
 * Uses the exact matcher comparator (not a precomputed word list), so the
 * lint can never drift from what the live matcher would hear — and it ignores
 * maxTranscriptWords, because a hot phrase inside a long TTS line is still a
 * self-trigger risk. Consumed by the hot-phrase guardrail test; must pass on
 * every bundled session line before hot listening ships.
 */
export function hotPhraseViolations(
  text: string,
  config: VoiceIntentConfig = VOICE_INTENT_CONFIG
): { intent: VoiceIntent; phrase: string }[] {
  const words = normalizeTranscript(text);
  const violations: { intent: VoiceIntent; phrase: string }[] = [];
  if (words.length === 0) return violations;
  for (const intent of HOT_INTENTS) {
    const c = config[intent];
    if (!c) continue;
    for (const phrase of c.phrases) {
      if (phraseMatchLength(words, phrase, c.fuzzyMinWordLength) > 0) {
        violations.push({ intent, phrase });
      }
    }
  }
  return violations;
}

/** Lowercase, strip apostrophes/punctuation, collapse whitespace → word array. */
export function normalizeTranscript(raw: string): string[] {
  return raw
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

/** Levenshtein distance, early-exited at >1 (only distance ≤1 matters here). */
function withinEditDistanceOne(a: string, b: string): boolean {
  if (a === b) return true;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  // One substitution (equal length) or one insertion/deletion (length ±1).
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < la && j < lb) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (la === lb) {
      i++;
      j++;
    } else if (la > lb) {
      i++;
    } else {
      j++;
    }
  }
  return edits + (la - i) + (lb - j) <= 1;
}

function wordMatches(spoken: string, expected: string, fuzzyMinWordLength: number): boolean {
  if (spoken === expected) return true;
  if (expected.length < fuzzyMinWordLength) return false;
  return withinEditDistanceOne(spoken, expected);
}

/**
 * The phrase's words must appear as a CONTIGUOUS word sequence in the
 * transcript (per-word exact or fuzzy per config). Returns the phrase's word
 * count on match (used for longest-phrase tie-breaking), 0 otherwise.
 */
function phraseMatchLength(
  words: readonly string[],
  phrase: string,
  fuzzyMinWordLength: number
): number {
  const target = normalizeTranscript(phrase);
  if (target.length === 0 || target.length > words.length) return 0;
  for (let start = 0; start + target.length <= words.length; start++) {
    let all = true;
    for (let k = 0; k < target.length; k++) {
      if (!wordMatches(words[start + k], target[k], fuzzyMinWordLength)) {
        all = false;
        break;
      }
    }
    if (all) return target.length;
  }
  return 0;
}

export interface IntentMatch {
  intent: VoiceIntent;
  /** Word length of the matched phrase (diagnostic; longer = stronger). */
  matchedPhraseWords: number;
}

function bestIntentMatch(
  words: readonly string[],
  intents: readonly VoiceIntent[],
  config: VoiceIntentConfig
): { best: IntentMatch | null; tie: boolean } {
  let best: IntentMatch | null = null;
  let tie = false;
  for (const intent of intents) {
    const c = config[intent];
    if (!c || words.length > c.maxTranscriptWords) continue;
    let intentBest = 0;
    for (const phrase of c.phrases) {
      const len = phraseMatchLength(words, phrase, c.fuzzyMinWordLength);
      if (len > intentBest) intentBest = len;
    }
    if (intentBest === 0) continue;
    if (best === null || intentBest > best.matchedPhraseWords) {
      best = { intent, matchedPhraseWords: intentBest };
      tie = false;
    } else if (intentBest === best.matchedPhraseWords && intent !== best.intent) {
      tie = true;
    }
  }
  return { best, tie };
}

/**
 * Match a transcript against the intents valid in the current listening
 * window. Safety-priority intents are matched FIRST and win outright over
 * commands; within safety, iteration order makes 'stop' win pure ties. For
 * commands, ambiguity that survives the longest-phrase rule returns null
 * (silence over wrong action).
 */
export function matchIntent(
  transcript: string,
  enabled: readonly VoiceIntent[],
  config: VoiceIntentConfig = VOICE_INTENT_CONFIG
): IntentMatch | null {
  const words = normalizeTranscript(transcript);
  if (words.length === 0) return null;

  const safetyEnabled = SAFETY_PRIORITY_INTENTS.filter((intent) => enabled.includes(intent));
  if (safetyEnabled.length > 0) {
    // Fixed SAFETY_PRIORITY_INTENTS order + strictly-greater replacement in
    // bestIntentMatch means 'stop' takes pure ties; a tie never nulls here.
    const safety = bestIntentMatch(words, safetyEnabled, config);
    if (safety.best) return safety.best;
  }

  const commands = enabled.filter((intent) => !SAFETY_PRIORITY_INTENTS.includes(intent));
  const { best, tie } = bestIntentMatch(words, commands, config);
  return tie ? null : best;
}
