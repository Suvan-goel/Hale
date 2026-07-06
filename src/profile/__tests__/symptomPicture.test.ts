import { isSymptomToggleSelected, toggleSymptomPicture } from '../symptomPicture';
import type { MenopauseSymptomPicture } from '../types';

describe('symptom picture selection (REPOSITION_TDD §2.1)', () => {
  it('multi-selects symptoms and returns to unanswered when the last is removed', () => {
    const one = toggleSymptomPicture(null, 'brain_fog');
    expect(one).toEqual({ kind: 'selected', symptoms: ['brain_fog'] });
    const two = toggleSymptomPicture(one, 'sleep_disruption');
    expect(two).toEqual({ kind: 'selected', symptoms: ['brain_fog', 'sleep_disruption'] });
    const backToOne = toggleSymptomPicture(two, 'brain_fog');
    expect(backToOne).toEqual({ kind: 'selected', symptoms: ['sleep_disruption'] });
    // Deselecting the last symptom is honest non-answer, never an empty list.
    expect(toggleSymptomPicture(backToOne, 'sleep_disruption')).toBeNull();
  });

  it('keeps "none of these" and "prefer not to say" exclusive, and tappable off', () => {
    const selected: MenopauseSymptomPicture = { kind: 'selected', symptoms: ['joint_aches'] };
    expect(toggleSymptomPicture(selected, 'none_of_these')).toEqual({ kind: 'none_of_these' });
    expect(toggleSymptomPicture({ kind: 'none_of_these' }, 'prefer_not_to_say')).toEqual({
      kind: 'prefer_not_to_say',
    });
    // Tapping the active exclusive answer clears it back to unanswered.
    expect(toggleSymptomPicture({ kind: 'prefer_not_to_say' }, 'prefer_not_to_say')).toBeNull();
    // Picking a symptom from an exclusive state starts a fresh selection.
    expect(toggleSymptomPicture({ kind: 'none_of_these' }, 'low_mood')).toEqual({
      kind: 'selected',
      symptoms: ['low_mood'],
    });
  });

  it('reports selection state for every toggle kind', () => {
    const picture: MenopauseSymptomPicture = { kind: 'selected', symptoms: ['hot_flushes'] };
    expect(isSymptomToggleSelected(picture, 'hot_flushes')).toBe(true);
    expect(isSymptomToggleSelected(picture, 'low_mood')).toBe(false);
    expect(isSymptomToggleSelected(picture, 'none_of_these')).toBe(false);
    expect(isSymptomToggleSelected({ kind: 'none_of_these' }, 'none_of_these')).toBe(true);
    expect(isSymptomToggleSelected(null, 'prefer_not_to_say')).toBe(false);
  });
});
