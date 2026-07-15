/**
 * Local-only onboarding-funnel log. One JSON file per event (append-only —
 * no rewrite races), sharing the session-funnel directory and adapter so
 * guest adoption and privacy erasure cover both logs identically. Each
 * store's deserializer skips the other's records by `kind`. File I/O stays
 * behind the injectable HistoryFs surface; the expo adapter lives in
 * ./fsAdapter (app-only, never imported by tests).
 */

import type { HistoryFs } from '../history/store';
import {
  deserializeOnboardingFunnelEvent,
  serializeOnboardingFunnelEvent,
  type StoredOnboardingFunnelEvent,
} from './onboardingFunnelRecord';

export class OnboardingFunnelStore {
  private readonly fs: HistoryFs;

  constructor(fs: HistoryFs) {
    this.fs = fs;
  }

  /** Persist one funnel event. The event name keys the file so two events
   * from the same flow transition never collide on a shared timestamp. */
  save(record: StoredOnboardingFunnelEvent): void {
    const stamp = record.atIso.replace(/[:.]/g, '-');
    this.fs.write(
      `onboarding-${stamp}-${record.event}.json`,
      serializeOnboardingFunnelEvent(record)
    );
  }

  /** All stored events, oldest first; unreadable/foreign files are skipped. */
  async loadAll(): Promise<StoredOnboardingFunnelEvent[]> {
    const out: StoredOnboardingFunnelEvent[] = [];
    for (const name of this.fs.list()) {
      if (!name.endsWith('.json')) continue;
      const json = await this.fs.read(name);
      if (!json) continue;
      const record = deserializeOnboardingFunnelEvent(json);
      if (record) out.push(record);
    }
    out.sort((a, b) => a.atIso.localeCompare(b.atIso));
    return out;
  }
}
