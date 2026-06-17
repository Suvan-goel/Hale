import { MIN_FRAMING_PROMPT_GAP_MS, shouldSpeakFramingPrompt } from '../promptTiming';

describe('framing prompt timing', () => {
  it('allows the first prompt immediately', () => {
    expect(
      shouldSpeakFramingPrompt({
        cue: 'step-into-frame',
        lastCue: null,
        lastSpokenAtMs: -Infinity,
        nowMs: 0,
        repeatMs: 4000,
      })
    ).toBe(true);
  });

  it('holds changed prompts until the minimum gentle gap has elapsed', () => {
    expect(
      shouldSpeakFramingPrompt({
        cue: 'step-back',
        lastCue: 'center-yourself',
        lastSpokenAtMs: 0,
        nowMs: MIN_FRAMING_PROMPT_GAP_MS - 1,
        repeatMs: 4000,
      })
    ).toBe(false);
    expect(
      shouldSpeakFramingPrompt({
        cue: 'step-back',
        lastCue: 'center-yourself',
        lastSpokenAtMs: 0,
        nowMs: MIN_FRAMING_PROMPT_GAP_MS,
        repeatMs: 4000,
      })
    ).toBe(true);
  });

  it('keeps unchanged prompt repeats on the slower repeat cadence', () => {
    expect(
      shouldSpeakFramingPrompt({
        cue: 'step-into-frame',
        lastCue: 'step-into-frame',
        lastSpokenAtMs: 0,
        nowMs: MIN_FRAMING_PROMPT_GAP_MS,
        repeatMs: 4000,
      })
    ).toBe(false);
    expect(
      shouldSpeakFramingPrompt({
        cue: 'step-into-frame',
        lastCue: 'step-into-frame',
        lastSpokenAtMs: 0,
        nowMs: 4000,
        repeatMs: 4000,
      })
    ).toBe(true);
  });
});
