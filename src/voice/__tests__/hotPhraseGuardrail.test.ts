/**
 * Hot-phrase script-lint guardrail (founder directive, pre-spike 2026-07-05):
 * bundled session voice lines must not contain any HOT phrase or any word
 * inside the matcher's own fuzzy neighborhood of one — otherwise the app
 * could trigger its own safety vocabulary through the speaker while hot
 * listening is on. The lint uses the matcher's comparator, so neighborhood
 * coverage can never drift from live behavior.
 *
 * KNOWN_COLLIDING_LINES is a TEMPORARY allowlist of today's bundled lines
 * that speak "stop"/"pause(d)" — inventoried 2026-07-05, decision on
 * reword-vs-suppress pending the spike's self-echo test (criteria §8). It
 * MUST be emptied before hot listening ships (week 3); this test fails the
 * moment a NEW colliding line is added anywhere in the corpus.
 */

import { VOICE_V2_1_AUDIO_ASSET_METADATA } from '../../audio/voiceV21AudioManifest';
import { SAFETY_CUE_DEFINITIONS } from '../../training/safetyCueDefinitions';
import { HOT_INTENTS, hotPhraseViolations, matchIntent } from '../intents';

/** Session lines already speaking hot words — pending reword or echo-suppress. */
const KNOWN_COLLIDING_LINES: ReadonlySet<string> = new Set([
  // safetyCueDefinitions (spoken during sessions)
  'safety:global_stop_sharp_or_increasing_pain',
  'safety:global_stop_dizzy_or_lightheaded',
  'safety:global_stop_if_support_moves',
  'safety:global_pause_if_tracking_lost',
  'safety:tracking_pause_and_reset',
  'safety:floor_stop_if_transfer_unsteady',
  'safety:step_stop_if_unstable',
  'safety:band_stop_if_slips_or_shifts',
  'safety:door_anchor_stop_if_moves',
  // Voice V2.1 training scripts
  'v21:paused-v21',
  'v21:safe-session-start-v21',
  'v21:set-complete-v21',
  'v21:target-balance-feet-together-hold-v21',
  'v21:target-neck-rotation-v21',
  'v21:target-overhead-press-band-v21',
  'v21:target-push-up-standard-v21',
  'v21:target-supported-side-step-v21',
  'v21:training-intro-v21',
]);

function corpusLines(): { key: string; text: string }[] {
  const lines: { key: string; text: string }[] = [];
  for (const [id, definition] of Object.entries(SAFETY_CUE_DEFINITIONS)) {
    lines.push({ key: `safety:${id}`, text: definition.text });
  }
  // Scripts are identical across voices; lint one voice's metadata per cue.
  const clara = VOICE_V2_1_AUDIO_ASSET_METADATA.clara ?? {};
  for (const [cueKey, metadata] of Object.entries(clara)) {
    if (metadata?.script) lines.push({ key: `v21:${cueKey}`, text: metadata.script });
  }
  return lines;
}

describe('hot-phrase lint comparator', () => {
  it('flags exact hot phrases inside longer lines (word caps ignored)', () => {
    expect(hotPhraseViolations('Stop if you feel sharp pain or discomfort.').map((v) => v.intent)).toContain('stop');
    expect(hotPhraseViolations('If that hurts, ease off and rest.').map((v) => v.intent)).toContain('pain');
    expect(hotPhraseViolations('Paused. Take your time.').map((v) => v.intent)).toContain('pause');
  });

  it('flags the fuzzy neighborhood, not just exact words', () => {
    // "pauses" is edit-distance 1 from "pause" (a 5-letter fuzzy word).
    expect(hotPhraseViolations('If tracking pauses, return to your setup position.').map((v) => v.intent)).toContain(
      'pause'
    );
  });

  it('"set up for the couch stretch" is safely ignored by lint AND live matcher', () => {
    // "couch" is edit-distance 1 from "ouch", but pain fuzz starts at
    // 5-letter words, so ouch stays exact — the line needs no lint entry and
    // can never self-trigger during TTS playback.
    const line = 'Set up for the couch stretch.';
    expect(hotPhraseViolations(line)).toEqual([]);
    expect(matchIntent(line, HOT_INTENTS)).toBeNull();
  });

  it('everyday near-words of the 4-letter pain vocabulary never fire', () => {
    for (const phrase of ['thanks so much', 'such a good set', 'touch the chair', 'not too sure']) {
      expect(matchIntent(phrase, HOT_INTENTS)).toBeNull();
      expect(hotPhraseViolations(phrase)).toEqual([]);
    }
  });
});

describe('bundled session-line corpus', () => {
  const lines = corpusLines();

  it('reads a non-trivial corpus (imports intact)', () => {
    expect(lines.length).toBeGreaterThan(50);
  });

  it('contains no hot-phrase collisions outside the known temporary allowlist', () => {
    const offenders = lines
      .filter((line) => hotPhraseViolations(line.text).length > 0)
      .map((line) => line.key)
      .filter((key) => !KNOWN_COLLIDING_LINES.has(key));
    expect(offenders).toEqual([]);
  });

  it('tripwire: every allowlist entry still exists and still collides (stale entries must be pruned)', () => {
    const colliding = new Set(
      lines.filter((line) => hotPhraseViolations(line.text).length > 0).map((line) => line.key)
    );
    const stale = [...KNOWN_COLLIDING_LINES].filter((key) => !colliding.has(key));
    expect(stale).toEqual([]);
  });
});
