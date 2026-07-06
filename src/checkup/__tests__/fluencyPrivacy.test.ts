import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { serializeCheckUp, deserializeCheckUp } from '../../history/serialize';
import { validClarityInstruments, type FluencyResult } from '../clarityInstruments';
import { defaultFluencyTranscriber, type FluencyTranscriber } from '../../voice/fluencyTranscriber';
import type { CheckUp } from '../types';

/**
 * FL1 leak-proofing (CLARITY_INSTRUMENTS_TDD §5.4) — the same rigor as the
 * pain-audit and reported-vs-measured guarantees. The privacy model:
 * commands/safety words are NEVER transcribed (global promise, untouched);
 * fluency is a per-use consented, on-device, count-only exception. These
 * tests make the exception's containment structural, not conventional.
 */

const CANARIES = ['wombat', 'aardvark', 'pangolin', 'ninety seven'];

function source(file: string): string {
  return readFileSync(join(process.cwd(), file), 'utf8');
}

// A scripted transcriber standing in for the device-gated native one: it
// exercises the REAL seam shape — tokens go to the counter and only a number
// comes back.
function scriptedTranscriber(tokens: string[]): FluencyTranscriber {
  return {
    availability: () => Promise.resolve('available'),
    countWords: (_durationSec, counter) => Promise.resolve({ ok: true, validWordCount: counter(tokens) }),
  };
}

describe('fluency privacy containment (FL1)', () => {
  it('the seam never returns words: tokens die inside the counter callback', async () => {
    const transcriber = scriptedTranscriber(CANARIES);
    const outcome = await transcriber.countWords(60, (tokens) => tokens.length);
    expect(outcome).toEqual({ ok: true, validWordCount: 4 });
    // The outcome type carries numbers and enums only.
    expect(JSON.stringify(outcome)).not.toMatch(/wombat|aardvark|pangolin|ninety/);
  });

  it('a serialized check-up carrying a fluency result contains no canary words', async () => {
    const transcriber = scriptedTranscriber(CANARIES);
    const outcome = await transcriber.countWords(60, (tokens) => tokens.length);
    if (!outcome.ok) throw new Error('scripted transcriber failed');
    const fluency: FluencyResult = {
      schemaVersion: 1,
      categoryId: 'animals',
      status: 'measured',
      validWordCount: outcome.validWordCount,
      durationSec: 60,
    };
    const checkUp: CheckUp = {
      startedAt: '2026-07-06T09:00:00.000Z',
      bodyUnit: 1,
      items: [],
      clarityInstruments: { schemaVersion: 1, fluency },
    };
    const serialized = serializeCheckUp(checkUp, { checkupType: 'official_retest' });
    for (const canary of CANARIES) {
      expect(serialized).not.toContain(canary);
    }
    const restored = deserializeCheckUp(serialized);
    expect(restored?.checkUp.clarityInstruments?.fluency).toEqual(fluency);
  });

  it('the result type is numbers/literals/enums only — a smuggled string field drops at the boundary', () => {
    // Exhaustive key audit of a measured result.
    const measured: FluencyResult = {
      schemaVersion: 1,
      categoryId: 'foods',
      status: 'measured',
      validWordCount: 14,
      durationSec: 60,
    };
    const parsed = validClarityInstruments({ schemaVersion: 1, fluency: measured });
    expect(parsed?.fluency).toEqual(measured);
    for (const [key, value] of Object.entries(parsed?.fluency ?? {})) {
      if (typeof value === 'string') {
        // The only string-typed fields are closed enums.
        expect(['categoryId', 'status', 'invalidReason']).toContain(key);
      } else {
        expect(typeof value).toBe('number');
      }
    }
    // A field carrying free text is stripped by the defensive parse.
    const smuggled = validClarityInstruments({
      schemaVersion: 1,
      fluency: { ...measured, transcript: CANARIES.join(' ') },
    });
    expect(JSON.stringify(smuggled)).not.toContain('wombat');
  });

  it('the seam module exposes no transcript/audio surface and the default is unavailable', async () => {
    const seam = source('src/voice/fluencyTranscriber.ts');
    // No API returns tokens: countWords resolves to a count or a failure enum.
    expect(seam).toContain('{ ok: true; validWordCount: number }');
    expect(seam).not.toMatch(/tokens\s*:\s*readonly string\[\]\s*\}\s*>/); // never in a resolved type
    expect(seam).not.toMatch(/audio(Data|Buffer|File)/i);
    // Production default: PLANNED until device Block 8 — never offers itself.
    const transcriber = defaultFluencyTranscriber();
    await expect(transcriber.availability()).resolves.toBe('unavailable');
    await expect(transcriber.countWords(60, () => 0)).resolves.toEqual({
      ok: false,
      reason: 'unavailable',
    });
  });

  it('the global commands/safety promise is untouched: session paths never import the fluency seam', () => {
    for (const file of [
      'src/voice/intents.ts',
      'src/voice/sessionIntentPolicy.ts',
      'src/voice/voiceSessionController.ts',
      'src/voice/voicePermissionGate.ts',
      'src/training/sessionPlayer.ts',
    ]) {
      expect(source(file)).not.toContain('fluencyTranscriber');
    }
    // And the voice-session privacy line still promises intents-only.
    expect(source('src/voice/voicePermissionGate.ts')).toMatch(/never\s+recorded/i);
  });

  it('the consent copy is implementation-true and registered with the fences', () => {
    const consent = source('src/screens/FluencyConsentScreen.tsx');
    expect(consent).toContain('ON YOUR PHONE, only to');
    expect(consent).toContain('not stored and not sent');
    expect(consent).toContain('the count is all that');
    expect(consent).toContain('different from how the mic normally works');
    expect(consent).toContain('nothing');
    expect(consent).toContain('ever transcribed');
    expect(consent).toContain('Skip this part');
    // Per-use: no remember-my-choice surface exists on this screen
    // (comments stripped — the doc comment legitimately describes the rule).
    const consentCode = consent.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/.*$/gm, ' ');
    expect(consentCode).not.toMatch(/remember|don'?t ask again|always allow/i);
    // Registered in the Clarity copy fence (validated-ban + cognitive scan).
    expect(source('src/haleFlow/__tests__/copyGuardrails.test.ts')).toContain(
      'src/screens/FluencyConsentScreen.tsx'
    );
  });
});
