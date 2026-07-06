/**
 * C6 ruling (2026-07-06): the repo's pinned F2 stage taxonomy wins, extended
 * ADDITIVELY with 'surgical_medical' (onboarding-spec A2 — menopause after
 * surgery or medical treatment). v9/v10 records deserialize unchanged.
 * Copy/content only, never scoring — same rule as every other stage value.
 */

import { MENOPAUSE_STAGE_OPTIONS } from '../types';
import {
  defaultPreferences,
  deserializePreferences,
  PREFERENCES_SCHEMA_VERSION,
  serializePreferences,
} from '../serialize';

describe('surgical_medical menopause stage (v11 additive)', () => {
  it('is offered with the spec A2 label, between post-menopause and not-sure', () => {
    const values = MENOPAUSE_STAGE_OPTIONS.map((o) => o.value);
    expect(values).toEqual([
      'perimenopausal',
      'menopausal',
      'postmenopausal',
      'surgical_medical',
      'neither_or_unsure',
      'prefer_not_to_say',
    ]);
    expect(
      MENOPAUSE_STAGE_OPTIONS.find((o) => o.value === 'surgical_medical')?.label
    ).toBe('Menopause after surgery or medical treatment');
  });

  it('round-trips through preferences serialization', () => {
    expect(PREFERENCES_SCHEMA_VERSION).toBe(11);
    const prefs = defaultPreferences();
    prefs.profile.menopauseStage = 'surgical_medical';
    const restored = deserializePreferences(serializePreferences(prefs));
    expect(restored?.profile.menopauseStage).toBe('surgical_medical');
  });

  it('leaves earlier-schema records unchanged (additive migration)', () => {
    const v10 = defaultPreferences();
    v10.profile.menopauseStage = 'menopausal';
    const json = serializePreferences(v10).replace('"schemaVersion":11', '"schemaVersion":10');
    expect(deserializePreferences(json)?.profile.menopauseStage).toBe('menopausal');
  });

  it('still drops unknown stage tokens to null', () => {
    const prefs = defaultPreferences();
    const json = serializePreferences(prefs).replace(
      '"menopauseStage":null',
      '"menopauseStage":"surgical"'
    );
    expect(deserializePreferences(json)?.profile.menopauseStage).toBeNull();
  });
});
