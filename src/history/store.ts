/**
 * Local-only check-up history (no accounts/backend in V1). One JSON file per
 * check-up (append-only — no rewrite races, mirrors the landmark recorder),
 * read back, migrated, and sorted on load.
 *
 * File I/O is behind a tiny injectable adapter so the store — including
 * "survives restart" — is unit-testable with an in-memory map; the real
 * expo-file-system adapter lives in ./fsAdapter (app-only, never imported by
 * tests).
 */

import { CheckUp } from '../checkup/types';
import { deserializeCheckUp, serializeCheckUp, StoredCheckUp } from './serialize';

/**
 * Minimal filesystem surface the store needs. `read` is async because
 * expo-file-system's File.text() is async; list/write are synchronous there.
 */
export interface HistoryFs {
  /** File names present in the history directory. */
  list(): string[];
  /** File contents, or null if absent/unreadable. */
  read(name: string): Promise<string | null>;
  write(name: string, content: string): void;
}

/** In-memory adapter for tests/dev; pass a shared Map to simulate a restart. */
export function createMemoryFs(files: Map<string, string> = new Map()): HistoryFs {
  return {
    list: () => Array.from(files.keys()),
    read: (name) => Promise.resolve(files.has(name) ? (files.get(name) as string) : null),
    write: (name, content) => {
      files.set(name, content);
    },
  };
}

export class HistoryStore {
  private readonly fs: HistoryFs;

  constructor(fs: HistoryFs) {
    this.fs = fs;
  }

  /** Persist one completed check-up. */
  save(checkUp: CheckUp): void {
    const stamp = checkUp.startedAt.replace(/[:.]/g, '-');
    this.fs.write(`checkup-${stamp}.json`, serializeCheckUp(checkUp));
  }

  /** All stored check-ups, oldest first; unreadable/foreign files are skipped. */
  async loadAll(): Promise<StoredCheckUp[]> {
    const out: StoredCheckUp[] = [];
    for (const name of this.fs.list()) {
      if (!name.endsWith('.json')) continue;
      const json = await this.fs.read(name);
      if (!json) continue;
      const record = deserializeCheckUp(json);
      if (record) out.push(record);
    }
    out.sort((a, b) => a.checkUp.startedAt.localeCompare(b.checkUp.startedAt));
    return out;
  }

  /** Most recent check-up, or null. */
  async latest(): Promise<StoredCheckUp | null> {
    const all = await this.loadAll();
    return all.length > 0 ? all[all.length - 1] : null;
  }
}
