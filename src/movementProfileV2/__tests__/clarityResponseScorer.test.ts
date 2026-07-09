import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { PairedClarityCognitiveAggregateInput } from '../pairedClarityRuntime';
import {
  CLARITY_RESPONSE_PROTOCOL_ID,
  CLARITY_RESPONSE_SEQUENCE_ALGORITHM_ID,
  CLARITY_RESPONSE_TIMING,
  ClarityResponseScorer,
  createClarityResponseSequence,
  type ClarityResponseAggregate,
  type ClarityVisualPrompt,
} from '../clarityResponseScorer';

function respond(scorer: ClarityResponseScorer, prompt: ClarityVisualPrompt): void {
  scorer.recordSpeechPresence({ timestampMs: prompt.startsAtMs + 100, speaking: true });
  scorer.recordSpeechPresence({ timestampMs: prompt.startsAtMs + 200, speaking: false });
}

function assertAcceptedByPairedRuntime(
  aggregate: ClarityResponseAggregate
): PairedClarityCognitiveAggregateInput {
  return aggregate;
}

describe('ClarityResponseScorer', () => {
  it('builds frozen, deterministic, balanced forms with fixed timing and seed identity', () => {
    const first = createClarityResponseSequence(1000, 'pearl_vgng_form_a_v1');
    const repeated = createClarityResponseSequence(1000, 'pearl_vgng_form_a_v1');
    const alternate = createClarityResponseSequence(1000, 'pearl_vgng_form_b_v1');

    expect(first).toEqual(repeated);
    expect(first.map((prompt) => prompt.kind)).not.toEqual(
      alternate.map((prompt) => prompt.kind)
    );
    expect(first).toHaveLength(CLARITY_RESPONSE_TIMING.promptCount);
    expect(first.filter((prompt) => prompt.kind === 'target')).toHaveLength(8);
    expect(first.filter((prompt) => prompt.kind === 'non_target')).toHaveLength(8);
    expect(first[0]).toEqual({
      index: 0,
      kind: 'target',
      startsAtMs: 1750,
      visibleEndsAtMs: 2350,
      responseEndsAtMs: 3250,
    });
    expect(first[1].startsAtMs - first[0].startsAtMs).toBe(2400);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first[0])).toBe(true);

    const scorer = new ClarityResponseScorer({
      trialStartedAtMs: 1000,
      sequenceSeedId: 'pearl_vgng_form_b_v1',
    });
    expect(scorer.protocol).toMatchObject({
      protocolId: CLARITY_RESPONSE_PROTOCOL_ID,
      protocolVersion: 1,
      sequenceAlgorithmId: CLARITY_RESPONSE_SEQUENCE_ALGORITHM_ID,
      sequenceSeedId: 'pearl_vgng_form_b_v1',
      responseSignal: 'speech_presence_boolean',
      responseRule: 'respond_on_target_only',
      minimumPresentedCount: 4,
    });
    expect(Object.isFrozen(scorer.protocol)).toBe(true);
  });

  it('scores target hits and non-target inhibitions as a coherent perfect aggregate', () => {
    const scorer = new ClarityResponseScorer({ trialStartedAtMs: 0 });
    for (const prompt of scorer.prompts) {
      if (prompt.kind === 'target') respond(scorer, prompt);
    }

    const aggregate = scorer.complete(
      scorer.prompts[scorer.prompts.length - 1].responseEndsAtMs
    );
    expect(aggregate).toEqual({ attempts: 16, correct: 16, errors: 0 });
    expect(assertAcceptedByPairedRuntime(aggregate as ClarityResponseAggregate)).toBe(aggregate);
    expect((aggregate as ClarityResponseAggregate).attempts).toBe(
      (aggregate as ClarityResponseAggregate).correct +
        (aggregate as ClarityResponseAggregate).errors
    );
  });

  it('counts a target miss and non-target response as errors', () => {
    const scorer = new ClarityResponseScorer({ trialStartedAtMs: 0 });
    const missedTarget = scorer.prompts.find((prompt) => prompt.kind === 'target');
    const falsePositive = scorer.prompts.find((prompt) => prompt.kind === 'non_target');
    if (!missedTarget || !falsePositive) throw new Error('test form must contain both prompt kinds');

    for (const prompt of scorer.prompts) {
      if (
        (prompt.kind === 'target' && prompt !== missedTarget) ||
        prompt === falsePositive
      ) {
        respond(scorer, prompt);
      }
    }

    expect(
      scorer.complete(scorer.prompts[scorer.prompts.length - 1].responseEndsAtMs)
    ).toEqual({ attempts: 16, correct: 14, errors: 2 });
  });

  it('scores only fully completed windows when the balance hold ends early', () => {
    const scorer = new ClarityResponseScorer({ trialStartedAtMs: 0 });
    const firstFive = scorer.prompts.slice(0, 5);
    for (const prompt of firstFive) {
      if (prompt.kind === 'target') respond(scorer, prompt);
    }
    // This response belongs to a prompt whose window will not finish.
    respond(scorer, scorer.prompts[5]);

    expect(scorer.complete(firstFive[4].responseEndsAtMs)).toEqual({
      attempts: 5,
      correct: 5,
      errors: 0,
    });

    const belowFloor = new ClarityResponseScorer({ trialStartedAtMs: 0 });
    expect(belowFloor.complete(belowFloor.prompts[2].responseEndsAtMs)).toBeNull();
  });

  it('debounces repeated bursts per prompt and ignores speech outside response windows', () => {
    const scorer = new ClarityResponseScorer({ trialStartedAtMs: 1000 });
    const firstTarget = scorer.prompts[0];
    const firstNonTarget = scorer.prompts[1];

    scorer.recordSpeechPresence({ timestampMs: 1100, speaking: true }); // lead-in
    scorer.recordSpeechPresence({ timestampMs: 1200, speaking: false });
    respond(scorer, firstTarget);
    respond(scorer, firstTarget); // same prompt, still only one response bit
    scorer.recordSpeechPresence({
      timestampMs: firstTarget.responseEndsAtMs + 50,
      speaking: true,
    }); // gap
    scorer.recordSpeechPresence({
      timestampMs: firstTarget.responseEndsAtMs + 100,
      speaking: false,
    });

    expect(scorer.visiblePromptAt(firstTarget.startsAtMs)).toBe(firstTarget);
    expect(scorer.visiblePromptAt(firstTarget.visibleEndsAtMs)).toBeNull();
    expect(scorer.complete(firstNonTarget.responseEndsAtMs)).toBeNull(); // two is below floor

    const fourPromptScorer = new ClarityResponseScorer({ trialStartedAtMs: 0 });
    for (const prompt of fourPromptScorer.prompts.slice(0, 4)) {
      if (prompt.kind === 'target') {
        respond(fourPromptScorer, prompt);
        respond(fourPromptScorer, prompt);
      }
    }
    expect(fourPromptScorer.complete(fourPromptScorer.prompts[3].responseEndsAtMs)).toEqual({
      attempts: 4,
      correct: 4,
      errors: 0,
    });
  });

  it('never lets content-bearing input escape and stays isolated from content or history systems', () => {
    const scorer = new ClarityResponseScorer({ trialStartedAtMs: 0 });
    const target = scorer.prompts.find((prompt) => prompt.kind === 'target');
    if (!target) throw new Error('test form must contain a target');
    scorer.recordSpeechPresence({
      timestampMs: target.startsAtMs + 100,
      speaking: true,
      transcript: 'private-canary',
      recording: 'private-canary',
      tokens: ['private-canary'],
    } as unknown as { timestampMs: number; speaking: boolean });
    scorer.recordSpeechPresence({ timestampMs: target.startsAtMs + 200, speaking: false });

    const aggregate = scorer.complete(scorer.prompts[3].responseEndsAtMs);
    expect(Object.keys(aggregate ?? {})).toEqual(['attempts', 'correct', 'errors']);
    expect(JSON.stringify({ protocol: scorer.protocol, aggregate })).not.toContain('private-canary');

    const source = readFileSync(
      join(process.cwd(), 'src/movementProfileV2/clarityResponseScorer.ts'),
      'utf8'
    )
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/\/\/.*$/gm, ' ');
    expect(source).not.toMatch(/(?:from|require\s*\()[^\n]*(?:history|fluency|recognition|recording)/i);
    expect(source).not.toMatch(/\b(?:transcript|tokens|recording)\b/i);
  });

  it('rejects invalid scorer configuration and ignores non-monotonic presence events', () => {
    expect(
      () => new ClarityResponseScorer({ trialStartedAtMs: 0, minimumPresentedCount: 0 })
    ).toThrow('invalid Clarity response minimum presented count');
    expect(() => createClarityResponseSequence(Number.NaN)).toThrow(
      'invalid Clarity response trial start'
    );

    const scorer = new ClarityResponseScorer({ trialStartedAtMs: 0 });
    const target = scorer.prompts[0];
    scorer.recordSpeechPresence({ timestampMs: target.startsAtMs + 200, speaking: false });
    scorer.recordSpeechPresence({ timestampMs: target.startsAtMs + 100, speaking: true });
    respond(scorer, scorer.prompts[3]);
    expect(scorer.complete(scorer.prompts[3].responseEndsAtMs)).toEqual({
      attempts: 4,
      correct: 3,
      errors: 1,
    });
  });
});
