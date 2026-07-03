/**
 * Local-only session-funnel log. One JSON file per session (append-only — no
 * rewrite races, mirrors the check-up history store), read back, migrated,
 * and sorted on load. File I/O is behind the same injectable adapter surface
 * as HistoryStore so the store is unit-testable with an in-memory map; the
 * real expo-file-system adapter lives in ./fsAdapter (app-only, never
 * imported by tests).
 */

import type { HistoryFs } from '../history/store';
import {
  deserializeSessionFunnel,
  serializeSessionFunnel,
  StoredSessionFunnel,
} from './sessionFunnelRecord';

export class SessionFunnelStore {
  private readonly fs: HistoryFs;

  constructor(fs: HistoryFs) {
    this.fs = fs;
  }

  /** Persist one session's funnel (completed or abandoned). */
  save(record: StoredSessionFunnel): void {
    const stamp = record.startedAt.replace(/[:.]/g, '-');
    this.fs.write(`funnel-${stamp}.json`, serializeSessionFunnel(record));
  }

  /** All stored funnels, oldest first; unreadable/foreign files are skipped. */
  async loadAll(): Promise<StoredSessionFunnel[]> {
    const out: StoredSessionFunnel[] = [];
    for (const name of this.fs.list()) {
      if (!name.endsWith('.json')) continue;
      const json = await this.fs.read(name);
      if (!json) continue;
      const record = deserializeSessionFunnel(json);
      if (record) out.push(record);
    }
    out.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
    return out;
  }
}
