/**
 * Privacy-preserving response scorer for Pearl's paired Clarity task.
 *
 * This module owns a frozen visual go/no-go schedule and consumes only a
 * monotonic timestamp plus a speech-presence boolean. It deliberately has no
 * speech-recognition, recording, history, or persistence dependency.
 */

export const CLARITY_RESPONSE_PROTOCOL_ID = 'pearl_visual_go_no_go_v1' as const;
export const CLARITY_RESPONSE_PROTOCOL_VERSION = 1 as const;
export const CLARITY_RESPONSE_SEQUENCE_ALGORITHM_ID = 'fixed_balanced_forms_v1' as const;

export const CLARITY_RESPONSE_SEQUENCE_SEED_IDS = [
  'pearl_vgng_form_a_v1',
  'pearl_vgng_form_b_v1',
] as const;

export type ClarityResponseSequenceSeedId =
  (typeof CLARITY_RESPONSE_SEQUENCE_SEED_IDS)[number];

export const DEFAULT_CLARITY_RESPONSE_SEQUENCE_SEED_ID: ClarityResponseSequenceSeedId =
  'pearl_vgng_form_a_v1';

/** Timings are relative to the confirmed start of the dual balance hold. */
export const CLARITY_RESPONSE_TIMING = Object.freeze({
  leadInMs: 750,
  promptVisibleMs: 600,
  responseWindowMs: 1500,
  promptCadenceMs: 2400,
  promptCount: 16,
  minimumPresentedCount: 4,
});

export type ClarityVisualPromptKind = 'target' | 'non_target';

export interface ClarityVisualPrompt {
  readonly index: number;
  readonly kind: ClarityVisualPromptKind;
  readonly startsAtMs: number;
  readonly visibleEndsAtMs: number;
  readonly responseEndsAtMs: number;
}

export interface ClarityResponseProtocolMetadata {
  readonly protocolId: typeof CLARITY_RESPONSE_PROTOCOL_ID;
  readonly protocolVersion: typeof CLARITY_RESPONSE_PROTOCOL_VERSION;
  readonly sequenceAlgorithmId: typeof CLARITY_RESPONSE_SEQUENCE_ALGORITHM_ID;
  readonly sequenceSeedId: ClarityResponseSequenceSeedId;
  readonly responseSignal: 'speech_presence_boolean';
  readonly responseRule: 'respond_on_target_only';
  readonly leadInMs: number;
  readonly promptVisibleMs: number;
  readonly responseWindowMs: number;
  readonly promptCadenceMs: number;
  readonly promptCount: number;
  readonly minimumPresentedCount: number;
}

export interface ClaritySpeechPresenceEvent {
  readonly timestampMs: number;
  readonly speaking: boolean;
}

/** Structurally accepted by PairedClarityRuntime.completeCognitiveOutcome(). */
export interface ClarityResponseAggregate {
  readonly attempts: number;
  readonly correct: number;
  readonly errors: number;
}

export interface ClarityResponseScorerInput {
  /** Monotonic timestamp at which the dual balance hold was confirmed. */
  readonly trialStartedAtMs: number;
  readonly sequenceSeedId?: ClarityResponseSequenceSeedId;
  readonly minimumPresentedCount?: number;
}

type PromptResponse = 0 | 1;
type PromptScore = 'correct_hit' | 'correct_inhibition' | 'error' | 'miss';

/*
 * Frozen, balanced forms: eight targets and eight non-targets in each. The
 * identity, rather than the array itself, is the persisted protocol field.
 */
const FIXED_SEQUENCE_FORMS: Readonly<
  Record<ClarityResponseSequenceSeedId, readonly ClarityVisualPromptKind[]>
> = Object.freeze({
  pearl_vgng_form_a_v1: Object.freeze<ClarityVisualPromptKind[]>([
    'target',
    'non_target',
    'non_target',
    'target',
    'non_target',
    'target',
    'target',
    'non_target',
    'target',
    'non_target',
    'non_target',
    'target',
    'target',
    'non_target',
    'target',
    'non_target',
  ]),
  pearl_vgng_form_b_v1: Object.freeze<ClarityVisualPromptKind[]>([
    'non_target',
    'target',
    'target',
    'non_target',
    'target',
    'non_target',
    'non_target',
    'target',
    'non_target',
    'target',
    'target',
    'non_target',
    'non_target',
    'target',
    'non_target',
    'target',
  ]),
});

/** Build the immutable schedule the visual layer renders during the hold. */
export function createClarityResponseSequence(
  trialStartedAtMs: number,
  sequenceSeedId: ClarityResponseSequenceSeedId =
    DEFAULT_CLARITY_RESPONSE_SEQUENCE_SEED_ID
): readonly ClarityVisualPrompt[] {
  if (!Number.isFinite(trialStartedAtMs)) {
    throw new Error('invalid Clarity response trial start');
  }
  const form = FIXED_SEQUENCE_FORMS[sequenceSeedId];
  if (!form) throw new Error('unknown Clarity response sequence');

  return Object.freeze(
    form.map((kind, index) => {
      const startsAtMs =
        trialStartedAtMs +
        CLARITY_RESPONSE_TIMING.leadInMs +
        index * CLARITY_RESPONSE_TIMING.promptCadenceMs;
      return Object.freeze({
        index,
        kind,
        startsAtMs,
        visibleEndsAtMs: startsAtMs + CLARITY_RESPONSE_TIMING.promptVisibleMs,
        responseEndsAtMs: startsAtMs + CLARITY_RESPONSE_TIMING.responseWindowMs,
      });
    })
  );
}

/**
 * One-use scorer. Create a new instance for every dual balance hold.
 *
 * Speech is reduced immediately to one bit per response window. Repeated
 * starts inside the same window are debounced, and events outside all windows
 * cannot affect the result. `complete()` returns null when the hold ended
 * before the minimum number of full response windows had elapsed.
 */
export class ClarityResponseScorer {
  readonly protocol: ClarityResponseProtocolMetadata;
  readonly prompts: readonly ClarityVisualPrompt[];

  private readonly responses: PromptResponse[];
  private speaking = false;
  private lastEventAtMs: number;
  private completed = false;
  private aggregate_: ClarityResponseAggregate | null = null;

  constructor(input: ClarityResponseScorerInput) {
    const sequenceSeedId =
      input.sequenceSeedId ?? DEFAULT_CLARITY_RESPONSE_SEQUENCE_SEED_ID;
    const minimumPresentedCount =
      input.minimumPresentedCount ?? CLARITY_RESPONSE_TIMING.minimumPresentedCount;
    if (
      !Number.isInteger(minimumPresentedCount) ||
      minimumPresentedCount < 1 ||
      minimumPresentedCount > CLARITY_RESPONSE_TIMING.promptCount
    ) {
      throw new Error('invalid Clarity response minimum presented count');
    }

    this.prompts = createClarityResponseSequence(input.trialStartedAtMs, sequenceSeedId);
    this.responses = new Array<PromptResponse>(this.prompts.length).fill(0);
    this.lastEventAtMs = input.trialStartedAtMs;
    this.protocol = Object.freeze({
      protocolId: CLARITY_RESPONSE_PROTOCOL_ID,
      protocolVersion: CLARITY_RESPONSE_PROTOCOL_VERSION,
      sequenceAlgorithmId: CLARITY_RESPONSE_SEQUENCE_ALGORITHM_ID,
      sequenceSeedId,
      responseSignal: 'speech_presence_boolean',
      responseRule: 'respond_on_target_only',
      leadInMs: CLARITY_RESPONSE_TIMING.leadInMs,
      promptVisibleMs: CLARITY_RESPONSE_TIMING.promptVisibleMs,
      responseWindowMs: CLARITY_RESPONSE_TIMING.responseWindowMs,
      promptCadenceMs: CLARITY_RESPONSE_TIMING.promptCadenceMs,
      promptCount: CLARITY_RESPONSE_TIMING.promptCount,
      minimumPresentedCount,
    });
  }

  /** Active visible prompt for rendering; null during gaps and response tails. */
  visiblePromptAt(nowMs: number): ClarityVisualPrompt | null {
    if (!Number.isFinite(nowMs)) return null;
    for (const prompt of this.prompts) {
      if (nowMs >= prompt.startsAtMs && nowMs < prompt.visibleEndsAtMs) return prompt;
      if (nowMs < prompt.startsAtMs) return null;
    }
    return null;
  }

  /** Consume a presence transition; only an in-window false-to-true edge counts. */
  recordSpeechPresence(event: ClaritySpeechPresenceEvent): void {
    if (
      this.completed ||
      !Number.isFinite(event.timestampMs) ||
      typeof event.speaking !== 'boolean'
    ) {
      return;
    }
    if (event.timestampMs < this.lastEventAtMs) return;
    this.lastEventAtMs = event.timestampMs;

    const risingEdge = event.speaking && !this.speaking;
    this.speaking = event.speaking;
    if (!risingEdge) return;

    for (let index = 0; index < this.prompts.length; index++) {
      const prompt = this.prompts[index];
      if (event.timestampMs < prompt.startsAtMs) return;
      if (event.timestampMs < prompt.responseEndsAtMs) {
        this.responses[index] = 1;
        return;
      }
    }
  }

  /**
   * Finalize at the actual hold-end timestamp. Only windows fully completed by
   * that moment are attempts; a partially shown final prompt is excluded.
   */
  complete(trialEndedAtMs: number): ClarityResponseAggregate | null {
    if (this.completed) return this.aggregate_;
    this.completed = true;
    if (!Number.isFinite(trialEndedAtMs)) return null;

    let attempts = 0;
    let correct = 0;
    let errors = 0;
    for (let index = 0; index < this.prompts.length; index++) {
      const prompt = this.prompts[index];
      if (prompt.responseEndsAtMs > trialEndedAtMs) break;
      attempts++;
      const responded = this.responses[index] === 1;
      const score = classifyPrompt(prompt.kind, responded);
      if (score === 'correct_hit' || score === 'correct_inhibition') correct++;
      else errors++;
    }

    if (attempts < this.protocol.minimumPresentedCount) return null;
    this.aggregate_ = Object.freeze({ attempts, correct, errors });
    return this.aggregate_;
  }
}

function classifyPrompt(kind: ClarityVisualPromptKind, responded: boolean): PromptScore {
  if (kind === 'target') return responded ? 'correct_hit' : 'miss';
  return responded ? 'error' : 'correct_inhibition';
}
