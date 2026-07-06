import { countValidFluencyWords } from '../fluencyCounting';
import { fluencyResultFromOutcome, skippedFluencyResult } from '../fluencyOutcome';
import { nextFluencyCategory } from '../fluencyRotation';
import { FLUENCY_CATEGORY_IDS, type FluencyResult } from '../clarityInstruments';
import type { StoredCheckUp } from '../../history';

describe('fluency counting rules (§5.3 — documented, stable, honest)', () => {
  it('counts distinct non-filler words with repetitions collapsed', () => {
    expect(countValidFluencyWords(['dog', 'cat', 'dog', 'um', 'horse'])).toBe(3);
  });

  it('folds naive plurals so "cats" and "cat" are one answer', () => {
    expect(countValidFluencyWords(['cats', 'cat', 'horses'])).toBe(2);
    // Short words and -ss words are untouched by the fold.
    expect(countValidFluencyWords(['gas', 'glass', 'bus'])).toBe(3);
  });

  it('splits engine phrases and counts multi-word entities as their words', () => {
    expect(countValidFluencyWords(['polar bear', 'bear'])).toBe(2); // polar + bear
    expect(countValidFluencyWords(['let me think', 'zebra'])).toBe(1);
  });

  it('normalizes case/punctuation and returns 0 for empty or all-filler input', () => {
    expect(countValidFluencyWords(['Dog!', 'dog', 'DOG.'])).toBe(1);
    expect(countValidFluencyWords([])).toBe(0);
    expect(countValidFluencyWords(['um', 'uh', 'well', 'okay'])).toBe(0);
  });
});

describe('parallel-forms rotation (§5.2 — deterministic, history-derived)', () => {
  function recordWith(fluency: FluencyResult | null, atIso: string): StoredCheckUp {
    return {
      schemaVersion: 1,
      checkupType: 'official_retest',
      scoreSnapshotCompatibility: 'unsupported_checkup_protocol',
      checkUp: {
        startedAt: atIso,
        bodyUnit: 1,
        items: [],
        ...(fluency ? { clarityInstruments: { schemaVersion: 1 as const, fluency } } : {}),
      },
    };
  }
  const measured = (categoryId: FluencyResult['categoryId']): FluencyResult => ({
    schemaVersion: 1,
    categoryId,
    status: 'measured',
    validWordCount: 12,
    durationSec: 60,
  });

  it('walks the fixed order and never repeats until the set is exhausted', () => {
    expect(nextFluencyCategory([])).toBe('animals');
    const history = [recordWith(measured('animals'), '2026-01-01T09:00:00.000Z')];
    expect(nextFluencyCategory(history)).toBe('foods');
    history.push(recordWith(measured('foods'), '2026-02-01T09:00:00.000Z'));
    history.push(recordWith(measured('countries'), '2026-03-01T09:00:00.000Z'));
    expect(nextFluencyCategory(history)).toBe('kitchen_things');
    // Exhaustion restarts the cycle.
    history.push(recordWith(measured('kitchen_things'), '2026-04-01T09:00:00.000Z'));
    expect(nextFluencyCategory(history)).toBe('animals');
  });

  it('skips and invalid runs never consume a form — she has not done it yet', () => {
    const history = [
      recordWith(measured('animals'), '2026-01-01T09:00:00.000Z'),
      recordWith(skippedFluencyResult('foods'), '2026-02-01T09:00:00.000Z'),
      recordWith(null, '2026-03-01T09:00:00.000Z'),
    ];
    expect(nextFluencyCategory(history)).toBe('foods');
  });

  it('has exactly the four F3 categories in a fixed order', () => {
    expect(FLUENCY_CATEGORY_IDS).toEqual(['animals', 'foods', 'countries', 'kitchen_things']);
  });
});

describe('outcome → record mapping (enum codes in, honest statuses out)', () => {
  it('maps every seam code without inventing measurements', () => {
    const base = { categoryId: 'animals' as const };
    expect(fluencyResultFromOutcome({ ...base, outcome: { ok: true, validWordCount: 14 } })).toMatchObject({
      status: 'measured',
      validWordCount: 14,
    });
    expect(
      fluencyResultFromOutcome({ ...base, outcome: { ok: false, reason: 'no_speech' } })
    ).toMatchObject({ status: 'invalid', invalidReason: 'no_speech_detected' });
    expect(
      fluencyResultFromOutcome({ ...base, outcome: { ok: false, reason: 'permission_denied' } })
    ).toMatchObject({ status: 'invalid', invalidReason: 'user_declined' });
    expect(
      fluencyResultFromOutcome({ ...base, outcome: { ok: false, reason: 'engine_unavailable' } })
    ).toMatchObject({ status: 'unavailable' });
    expect(
      fluencyResultFromOutcome({ ...base, outcome: { ok: false, reason: 'recognition_failed' } })
    ).toMatchObject({ status: 'invalid', invalidReason: 'transcriber_failed' });
    // Backgrounding wins over any outcome.
    expect(
      fluencyResultFromOutcome({ ...base, outcome: { ok: true, validWordCount: 9 }, backgrounded: true })
    ).toMatchObject({ status: 'invalid', invalidReason: 'app_backgrounded' });
  });
});
