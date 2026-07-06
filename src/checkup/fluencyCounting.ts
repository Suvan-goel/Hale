/**
 * Fluency word counting — INSIDE THE TRUST BOUNDARY.
 *
 * PURITY CONTRACT (founder hardening requirement 1, 2026-07-06; enforced by
 * fluencyPrivacy.test.ts — a silence canary AND a source scan of this file):
 * everything in this module must be a PURE FUNCTION — tokens in, number out.
 * Concretely banned here, by scan: console.* in any form, any logging, any
 * telemetry/breadcrumb/Sentry import, any store or filesystem import, any
 * network access, timers, and closure capture of token arrays (nothing in
 * this module may hold a reference to tokens beyond the call). FL2+ counting
 * rules are written inside this contract; a future edit that violates it
 * fails CI, not review.
 *
 * The counter receives her words exactly once, synchronously, from the seam's
 * counting callback (src/voice/fluencyTranscriber.ts) and must let them die
 * on return.
 */

/** Tokens in, number out. No I/O, no logging, no retention. */
export type FluencyWordCounter = (tokens: readonly string[]) => number;

/**
 * COUNTING RULES (CLARITY_INSTRUMENTS_TDD §5.3, FL2 — documented honestly):
 * 1. Split every token on whitespace (engines sometimes emit phrases), then
 *    lowercase and strip everything but letters, digits, hyphens, apostrophes.
 * 2. Drop a small filler stoplist (hesitations and connective speech).
 * 3. Fold naive plurals: a trailing "s" is removed unless the word ends in
 *    "ss" or is ≤3 characters ("cats"→"cat"; "glass", "gas" untouched).
 * 4. Count DISTINCT remaining words — repetitions collapse via deduplication.
 *
 * Multi-word entities therefore count as their words ("polar bear" → 2):
 * consistent every month, and honest because the count is only ever compared
 * with HER OWN counts in the SAME category. INTRUSIONS (out-of-category
 * words) ARE NOT DETECTED in v1 (recorded limitation, TDD F5-flag): the
 * metric is "distinct words named in 60 seconds", not a clinically scored
 * fluency test — and it never claims to be. These rules never change without
 * minting a new metric id, so months always compare like with like.
 */

const FILLER_WORDS: ReadonlySet<string> = new Set([
  'uh', 'um', 'er', 'erm', 'hmm', 'mm',
  'a', 'an', 'and', 'the', 'like', 'so', 'well', 'okay', 'ok',
  'let', 'me', 'think', 'know', 'i', "i'm", 'oh', 'no', 'yes', 'yeah',
  'what', 'else', 'more',
]);

function normalizeWord(rawWord: string): string {
  const cleaned = rawWord.toLowerCase().replace(/[^a-z0-9'-]/g, '');
  if (cleaned.length > 3 && cleaned.endsWith('s') && !cleaned.endsWith('ss')) {
    return cleaned.slice(0, -1);
  }
  return cleaned;
}

export const countValidFluencyWords: FluencyWordCounter = (tokens) => {
  const distinct = new Set<string>();
  for (const token of tokens) {
    for (const rawWord of token.split(/\s+/)) {
      const word = normalizeWord(rawWord);
      if (word.length === 0 || FILLER_WORDS.has(word)) continue;
      distinct.add(word);
    }
  }
  return distinct.size;
};
