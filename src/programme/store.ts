/**
 * Local-only programme state store, on the injectable HistoryFs seam — the
 * same pattern (and the same expo-file-system adapter) as the preferences,
 * check-up, and training stores. One file, overwritten in place.
 *
 * NEVER SYNCED: contains special-category health flags (2026-07-06 ruling);
 * see serialize.ts header and programmeLocalOnly.test.ts.
 */

import type { HistoryFs } from '../history';
import type { ProgrammeState } from './types';
import {
  defaultProgrammeState,
  deserializeProgrammeState,
  serializeProgrammeState,
} from './serialize';

const PROGRAMME_STATE_FILE = 'programme.json';

export class ProgrammeStore {
  private readonly fs: HistoryFs;

  constructor(fs: HistoryFs) {
    this.fs = fs;
  }

  /** Current state, or fresh conservative defaults when absent/unreadable. */
  async load(): Promise<ProgrammeState> {
    const json = await this.fs.read(PROGRAMME_STATE_FILE);
    if (!json) return defaultProgrammeState();
    return deserializeProgrammeState(json) ?? defaultProgrammeState();
  }

  save(state: ProgrammeState): void {
    this.fs.write(PROGRAMME_STATE_FILE, serializeProgrammeState(state));
  }
}
