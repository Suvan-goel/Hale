/**
 * Symptom-picture selection logic (REPOSITION_TDD §2.1, approved 2026-07-06),
 * shared by the onboarding safety setup and Settings so the two surfaces can
 * never drift. Rules: optional and skippable (null = not answered, never
 * chased); 'None of these' and 'Prefer not to say' are exclusive answers;
 * deselecting the last symptom returns to unanswered rather than storing an
 * empty selection. Personalisation context only — never scoring.
 */

import {
  MENOPAUSE_SYMPTOM_OPTIONS,
  type MenopauseSymptom,
  type MenopauseSymptomPicture,
} from './types';

export type SymptomPictureToggle = MenopauseSymptom | 'none_of_these' | 'prefer_not_to_say';

export const SYMPTOM_PICTURE_TOGGLE_OPTIONS: readonly {
  value: SymptomPictureToggle;
  label: string;
}[] = [
  ...MENOPAUSE_SYMPTOM_OPTIONS,
  { value: 'none_of_these', label: 'None of these' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export function toggleSymptomPicture(
  current: MenopauseSymptomPicture | null,
  toggle: SymptomPictureToggle
): MenopauseSymptomPicture | null {
  if (toggle === 'none_of_these' || toggle === 'prefer_not_to_say') {
    return current?.kind === toggle ? null : { kind: toggle };
  }
  const selected = current?.kind === 'selected' ? current.symptoms : [];
  const next = selected.includes(toggle)
    ? selected.filter((symptom) => symptom !== toggle)
    : [...selected, toggle];
  return next.length > 0 ? { kind: 'selected', symptoms: next } : null;
}

export function isSymptomToggleSelected(
  current: MenopauseSymptomPicture | null,
  toggle: SymptomPictureToggle
): boolean {
  if (toggle === 'none_of_these' || toggle === 'prefer_not_to_say') {
    return current?.kind === toggle;
  }
  return current?.kind === 'selected' && current.symptoms.includes(toggle);
}
