/**
 * Parallel-forms rotation (CLARITY_INSTRUMENTS_TDD §5.2, FL2; F3 categories).
 * Deterministic and HISTORY-DERIVED — no new store, crash-safe: the next
 * category is computed from the fluency results already saved on official
 * check-ups, so the schedule can never drift from what actually happened.
 *
 * Rules: fixed order (FLUENCY_CATEGORY_IDS); a category is consumed only by
 * a MEASURED run (skips/invalid/unavailable never advance the rotation — she
 * hasn't done that form yet); no category repeats until the whole set is
 * exhausted, then the cycle restarts.
 */

import { FLUENCY_CATEGORY_IDS, type FluencyCategoryId } from './clarityInstruments';
import type { StoredCheckUp } from '../history';

export function nextFluencyCategory(
  history: readonly StoredCheckUp[] | null | undefined
): FluencyCategoryId {
  const measuredInOrder = (history ?? [])
    .filter(
      (record) =>
        record.checkupType === 'baseline' ||
        record.checkupType === 'baseline_retake' ||
        record.checkupType === 'official_retest'
    )
    .slice()
    .sort((a, b) => Date.parse(a.checkUp.startedAt) - Date.parse(b.checkUp.startedAt))
    .flatMap((record) => {
      const fluency = record.checkUp.clarityInstruments?.fluency;
      return fluency && fluency.status === 'measured' ? [fluency.categoryId] : [];
    });

  const usedThisCycle = new Set<FluencyCategoryId>();
  for (const categoryId of measuredInOrder) {
    usedThisCycle.add(categoryId);
    if (usedThisCycle.size === FLUENCY_CATEGORY_IDS.length) usedThisCycle.clear();
  }
  return FLUENCY_CATEGORY_IDS.find((categoryId) => !usedThisCycle.has(categoryId)) ?? FLUENCY_CATEGORY_IDS[0];
}

/** Display prompt per category — the task line spoken/shown to her. */
export const FLUENCY_CATEGORY_PROMPTS: Readonly<Record<FluencyCategoryId, string>> = {
  animals: 'Name as many ANIMALS as you can.',
  foods: 'Name as many FOODS as you can.',
  countries: 'Name as many COUNTRIES as you can.',
  kitchen_things: 'Name as many THINGS IN A KITCHEN as you can.',
};
