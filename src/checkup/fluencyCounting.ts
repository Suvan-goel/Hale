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

// Counting rules land in FL2 (countValidFluencyWords) — written inside the
// contract above.
