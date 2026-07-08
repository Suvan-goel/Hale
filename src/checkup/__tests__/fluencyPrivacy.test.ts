import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { serializeCheckUp, deserializeCheckUp } from '../../history/serialize';
import { validClarityInstruments, type FluencyResult } from '../clarityInstruments';
import {
  createSanitizedFluencyTranscriber,
  defaultFluencyTranscriber,
  type FluencyTranscriber,
  type RawFluencyEngine,
} from '../../voice/fluencyTranscriber';
import * as sentry from '../../services/observability/sentry';
import type { CheckUp } from '../types';

jest.mock('../../services/observability/sentry', () => ({
  addBreadcrumb: jest.fn(),
  captureError: jest.fn(),
}));

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
    // No PUBLIC API returns tokens: the outcome type is count-or-enum only.
    // (RawFluencyEngine legitimately mentions tokens — it is the UNTRUSTED
    // input the sanitizer consumes, never what leaves the seam.)
    const outcomeType = seam.match(/export type FluencyCountOutcome =[\s\S]*?\n\n/)?.[0] ?? '';
    expect(outcomeType).toContain('validWordCount: number');
    expect(outcomeType).not.toContain('tokens');
    expect(outcomeType).not.toMatch(/string\[\]/);
    expect(seam).not.toMatch(/audio(Data|Buffer|File)/i);
    // Production default: PLANNED until device Block 8 — never offers itself.
    const transcriber = defaultFluencyTranscriber();
    await expect(transcriber.availability()).resolves.toBe('unavailable');
    await expect(transcriber.countWords(60, () => 0)).resolves.toEqual({
      ok: false,
      reason: 'engine_unavailable',
    });
  });

  // ————— Founder hardening requirement 1: counter purity —————

  it('counting a distinctive-word list is SILENT: zero console output, zero telemetry writes', async () => {
    const consoleSpies = (['log', 'warn', 'error', 'info', 'debug'] as const).map((method) =>
      jest.spyOn(console, method).mockImplementation(() => undefined)
    );
    jest.mocked(sentry.addBreadcrumb).mockClear();
    jest.mocked(sentry.captureError).mockClear();
    try {
      const transcriber = createSanitizedFluencyTranscriber({
        availability: () => Promise.resolve('available'),
        transcribeOnce: () => Promise.resolve({ tokens: CANARIES }),
      });
      const outcome = await transcriber.countWords(60, (tokens) => tokens.length);
      expect(outcome).toEqual({ ok: true, validWordCount: 4 });
      for (const spy of consoleSpies) {
        expect(spy).not.toHaveBeenCalled();
      }
      expect(sentry.addBreadcrumb).not.toHaveBeenCalled();
      expect(sentry.captureError).not.toHaveBeenCalled();
    } finally {
      for (const spy of consoleSpies) spy.mockRestore();
    }
  });

  it('the counting module is pure by scan: no console/logging/telemetry/store imports, no token retention', () => {
    const counting = source('src/checkup/fluencyCounting.ts');
    // The contract is documented at the module (FL2 rules live inside it)...
    expect(counting).toContain('PURITY CONTRACT');
    // ...and the CODE (comments stripped) is held to it by scan.
    const code = counting.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/.*$/gm, ' ');
    expect(code).not.toMatch(/console\./);
    expect(code).not.toMatch(/addBreadcrumb|captureError|Sentry|telemetry/i);
    expect(code).not.toMatch(/from '.*(store|history|services|telemetry)/);
    expect(code).not.toMatch(/fetch\(|XMLHttpRequest|FileSystem|AsyncStorage/);
    expect(code).not.toMatch(/setTimeout|setInterval/);
    // No module-level mutable state that could retain a token array.
    expect(code).not.toMatch(/^\s*(let|var)\s/m);
  });

  // ————— Founder hardening requirement 2: error-path sanitization —————

  it('engine errors carrying recognized text surface as enum codes only — the words appear nowhere', async () => {
    const consoleSpies = (['log', 'warn', 'error', 'info', 'debug'] as const).map((method) =>
      jest.spyOn(console, method).mockImplementation(() => undefined)
    );
    jest.mocked(sentry.addBreadcrumb).mockClear();
    jest.mocked(sentry.captureError).mockClear();
    try {
      const leakyError = Object.assign(new Error(`recognition result: ${CANARIES.join(' ')}`), {
        bestTranscription: CANARIES.join(' '),
        metadata: { partial: CANARIES },
      });
      const throwingEngine: RawFluencyEngine = {
        availability: () => Promise.reject(leakyError),
        transcribeOnce: () => Promise.reject(leakyError),
      };
      const transcriber = createSanitizedFluencyTranscriber(throwingEngine);

      // Nothing throws; only enum codes come back.
      await expect(transcriber.availability()).resolves.toBe('unavailable');
      const outcome = await transcriber.countWords(60, (tokens) => tokens.length);
      expect(outcome).toEqual({ ok: false, reason: 'recognition_failed' });
      expect(JSON.stringify(outcome)).not.toMatch(/wombat|aardvark|pangolin|ninety/);

      // A coded rejection maps by CODE VALUE, never by message text.
      const codedEngine: RawFluencyEngine = {
        availability: () => Promise.resolve('available'),
        transcribeOnce: () =>
          Promise.reject(Object.assign(new Error(`heard: ${CANARIES[0]}`), { code: 'permission_denied' })),
      };
      const coded = await createSanitizedFluencyTranscriber(codedEngine).countWords(60, () => 0);
      expect(coded).toEqual({ ok: false, reason: 'permission_denied' });

      // And nothing was logged or reported anywhere along the way.
      for (const spy of consoleSpies) {
        expect(spy).not.toHaveBeenCalled();
      }
      expect(sentry.addBreadcrumb).not.toHaveBeenCalled();
      expect(sentry.captureError).not.toHaveBeenCalled();
    } finally {
      for (const spy of consoleSpies) spy.mockRestore();
    }
  });

  it('empty transcription windows map to no_speech, never to a zero-word measurement', async () => {
    const silentEngine: RawFluencyEngine = {
      availability: () => Promise.resolve('available'),
      transcribeOnce: () => Promise.resolve({ tokens: [] }),
    };
    const outcome = await createSanitizedFluencyTranscriber(silentEngine).countWords(60, (t) => t.length);
    expect(outcome).toEqual({ ok: false, reason: 'no_speech' });
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

  // The consent-copy pin retired with the fluency UI (founder-directed
  // deletion 2026-07-08): FluencyConsentScreen was deleted with the other
  // Clarity screens. The engine seams above stay pinned; any future fluency
  // UI re-registers its consent copy here and in the Clarity copy fence.
});
