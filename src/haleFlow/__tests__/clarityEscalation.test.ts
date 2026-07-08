import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  buildClarityGpSummary,
  evaluateClarityEscalation,
} from '../clarityEscalation';
import type { StoredCheckUp } from '../../history';

const steady: (0 | 1 | 2 | 3 | 4)[] = [1, 1, 1, 1, 1]; // clarity reading 3
const clouded: (0 | 1 | 2 | 3 | 4)[] = [4, 4, 4, 4, 4]; // clarity reading 0

function month(
  index: number,
  itemScores: (0 | 1 | 2 | 3 | 4)[] | null,
  covariates?: { sleepQuality?: 1 | 2 | 3; symptomLoad?: 1 | 2 | 3 }
): StoredCheckUp {
  return {
    schemaVersion: 1,
    checkupType: 'official_retest',
    scoreSnapshotCompatibility: 'unsupported_checkup_protocol',
    checkUp: {
      startedAt: new Date(Date.UTC(2026, index, 1, 9)).toISOString(),
      bodyUnit: 1,
      items: [],
      ...(itemScores || covariates
        ? {
            selfReport: {
              schemaVersion: 1 as const,
              ...(itemScores ? { clarity: { itemSetId: 'clarity_items_v1' as const, itemScores } } : {}),
              ...(covariates ? { covariates } : {}),
            },
          }
        : {}),
    },
  };
}

function months(scores: ((0 | 1 | 2 | 3 | 4)[] | null)[]): StoredCheckUp[] {
  return scores.map((itemScores, index) => month(index, itemScores));
}

describe('GP-escalation trigger (§6.2 — synthetic multi-month histories)', () => {
  it('fires at exactly three consecutive below-band months with enough lifetime readings', () => {
    // 3 steady months build the band; then 3 clouded months in a row.
    const fires = evaluateClarityEscalation(months([steady, steady, steady, clouded, clouded, clouded]));
    expect(fires.triggered).toBe(true);
    expect(fires.seriesId).toBe('subjective');
    expect(fires.copy).toContain('worth a conversation with your GP');

    // Two below months never fire.
    const two = evaluateClarityEscalation(months([steady, steady, steady, clouded, clouded]));
    expect(two.triggered).toBe(false);
  });

  it('a within-band month resets the run', () => {
    const reset = evaluateClarityEscalation(
      months([steady, steady, steady, clouded, clouded, steady, clouded])
    );
    expect(reset.triggered).toBe(false);
  });

  it('needs at least five lifetime readings — early dips stay quiet', () => {
    // Only 4 readings total, even with a low tail: below the floor.
    const early = evaluateClarityEscalation(months([steady, steady, steady, clouded]));
    expect(early.triggered).toBe(false);
  });

  // ————— Episode semantics (founder requirement, 2026-07-06) —————
  // The card is STATELESS PERSISTENCE, not an alert: it renders while the
  // below-band run is ≥3 and disappears when recovery closes the episode.
  // There is no notification, modal, or per-month event anywhere — nothing
  // exists that could "re-fire".

  it('episode: continuing decline persists the card quietly — no re-fire, same episode', () => {
    const third = evaluateClarityEscalation(months([steady, steady, steady, clouded, clouded, clouded]));
    const fifth = evaluateClarityEscalation(
      months([steady, steady, steady, clouded, clouded, clouded, clouded, clouded])
    );
    expect(third.triggered).toBe(true);
    expect(fifth.triggered).toBe(true);
    // Identical presentation month after month: same series, same calm copy —
    // a continuing episode adds nothing new to say.
    expect(fifth.seriesId).toBe(third.seriesId);
    expect(fifth.copy).toBe(third.copy);
  });

  it('episode: recovery closes it; relapse must earn the FULL trigger again', () => {
    const base = [steady, steady, steady, clouded, clouded, clouded];
    // Recovery month rejoins the band → episode closes, card gone.
    const recovered = evaluateClarityEscalation(months([...base, steady]));
    expect(recovered.triggered).toBe(false);
    // One or two relapse months: still closed — no shortcut back.
    expect(evaluateClarityEscalation(months([...base, steady, clouded])).triggered).toBe(false);
    expect(evaluateClarityEscalation(months([...base, steady, clouded, clouded])).triggered).toBe(false);
    // The third relapse month opens a NEW episode.
    const relapse = evaluateClarityEscalation(months([...base, steady, clouded, clouded, clouded]));
    expect(relapse.triggered).toBe(true);
  });

  it('episode: covariate-heavy months never fire, before or during an episode', () => {
    // Heavy covariates on steady readings: nothing.
    const heavySteady = [0, 1, 2, 3, 4, 5].map((index) =>
      month(index, steady, { sleepQuality: 1, symptomLoad: 3 })
    );
    expect(evaluateClarityEscalation(heavySteady).triggered).toBe(false);
    // And during a two-month dip, heavy covariates never substitute for the
    // third below-band month.
    const twoDipsHeavy = [
      month(0, steady),
      month(1, steady),
      month(2, steady),
      month(3, clouded, { sleepQuality: 1, symptomLoad: 3 }),
      month(4, clouded, { sleepQuality: 1, symptomLoad: 3 }),
    ];
    expect(evaluateClarityEscalation(twoDipsHeavy).triggered).toBe(false);
  });

  it('covariates can NEVER fire it alone', () => {
    const roughMonths = [0, 1, 2, 3, 4, 5].map((index) =>
      month(index, null, { sleepQuality: 1, symptomLoad: 3 })
    );
    expect(evaluateClarityEscalation(roughMonths).triggered).toBe(false);
  });

  it('the card copy passes the claims fences (no disease words, no urgency, no diagnosis)', () => {
    const fires = evaluateClarityEscalation(months([steady, steady, steady, clouded, clouded, clouded]));
    expect(fires.copy).not.toMatch(
      /dementia|alzheimer|urgent|immediately|risk|diagnos|symptom of|cognitive decline/i
    );
  });
});

describe('exportable GP summary', () => {
  it('carries dates, baseline-relative relations, and covariate context — nothing else exists to leak', () => {
    const history = [
      month(0, steady, { sleepQuality: 3 }),
      month(1, steady),
      month(2, steady),
      month(3, clouded, { sleepQuality: 1, symptomLoad: 3 }),
      month(4, clouded),
      month(5, clouded),
    ];
    const summary = buildClarityGpSummary(history, '2026-07-06T09:00:00.000Z');
    expect(summary).toContain('not a medical record');
    expect(summary).toContain('her own typical range — no population values');
    expect(summary).toContain('below her usual range');
    expect(summary).toContain('slept poorly the night before; heavy symptom week');
    // Never raw scores, never banned language.
    expect(summary).not.toMatch(/dementia|alzheimer|percentile|diagnos|score:/i);
  });
});

describe('the ONLY escalation path (guardrail)', () => {
  it('no product copy mentions GP/doctor outside the two recorded paths', () => {
    // Recorded paths: this escalation + the pain-recurrence swap note (which
    // lives in the pain store/generator). Settings LOST its mention with the
    // old-engine cleanup (2026-07-08): the swapped-out-movements reversal
    // card was dead UI behind never-passed props, so Settings now belongs on
    // the scanned side.
    const allowed = [
      'src/haleFlow/clarityEscalation.ts',
      'src/training/painHistory.ts',
      'src/training/workoutGeneration.ts',
    ];
    const scanned = [
      'src/haleFlow/clarityTrend.ts',
      'src/haleFlow/exploreViewModel.ts',
      'src/screens/ProgressScreen.tsx',
      'src/screens/TodayScreen.tsx',
      'src/screens/SettingsScreen.tsx',
      'src/movementProfileV2/viewModel.ts',
      'src/results/movementProfileV2ResultsAdapter.ts',
    ];
    for (const file of scanned) {
      const text = readFileSync(join(process.cwd(), file), 'utf8');
      expect({ file, mentionsGp: /\b(GP|doctor|physician|nurse)\b/.test(text) }).toEqual({
        file,
        mentionsGp: false,
      });
    }
    for (const file of allowed) {
      expect(readFileSync(join(process.cwd(), file), 'utf8')).toMatch(/\b(GP|doctor)\b/);
    }
  });
});
