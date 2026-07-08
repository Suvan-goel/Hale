import { getHealthInsightCards, getLearnDetail } from '../exploreViewModel';

// The extra-practice session catalogue and its gating tests retired with the
// founder-directed simplification pass (2026-07-08): the Learn tab carries
// the articles only.
describe('exploreViewModel', () => {
  it('provides professional insight cards as a separate feed', () => {
    const cards = getHealthInsightCards();

    expect(cards.map((card) => card.id)).toEqual([
      'insight-menopause-muscle',
      'insight-strength-balance-aging',
      'insight-sleep-recovery-rhythm',
      'insight-protein-meal-rhythm',
      'insight-walking-breaks',
    ]);
    expect(cards.every((card) => card.categoryLabel && card.authorCredential && card.reviewedLabel)).toBe(true);
    expect(getLearnDetail(cards[0].id)?.sections.length).toBeGreaterThan(0);
  });

  it('guarantees the educational explainer leads for "Not sure" readers (F2 rule of record)', () => {
    // A personalization signal, never a gap: whatever the authored order
    // becomes, the menopause explainer is first for neither_or_unsure — and
    // nothing about the feed changes for other stages.
    expect(getHealthInsightCards({ menopauseStage: 'neither_or_unsure' })[0].id).toBe(
      'insight-menopause-muscle'
    );
    expect(getHealthInsightCards({ menopauseStage: 'menopausal' }).map((c) => c.id)).toEqual(
      getHealthInsightCards().map((c) => c.id)
    );
  });
});
