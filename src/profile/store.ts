/**
 * Local-only preferences store (profile + settings), reusing the injectable
 * HistoryFs seam so it's unit-testable with an in-memory map — the same pattern
 * (and the same expo-file-system adapter) as the check-up and training stores.
 * One file, overwritten in place.
 */

import { HistoryFs } from '../history';
import { Preferences } from './types';
import { defaultPreferences, deserializePreferences, serializePreferences } from './serialize';

const PREFERENCES_FILE = 'preferences.json';

export class ProfileStore {
  private readonly fs: HistoryFs;

  constructor(fs: HistoryFs) {
    this.fs = fs;
  }

  /** Current preferences, or fresh defaults when absent/unreadable. */
  async load(): Promise<Preferences> {
    const json = await this.fs.read(PREFERENCES_FILE);
    if (!json) return defaultPreferences();
    return deserializePreferences(json) ?? defaultPreferences();
  }

  save(prefs: Preferences): void {
    this.fs.write(PREFERENCES_FILE, serializePreferences(prefs));
  }
}
