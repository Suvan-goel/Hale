/**
 * Local-only training store (no accounts/backend in V1), reusing the injectable
 * HistoryFs so the seam — including "survives restart" — is unit-testable with
 * an in-memory map. The single mutable TrainingState lives in one file
 * (overwritten in place); micro-checks are an append-only log (one file each,
 * no rewrite races), read back and sorted on load.
 *
 * The real expo-file-system adapter is the SAME one history uses (see
 * history/fsAdapter); this store just writes different filenames.
 */

import { HistoryFs } from '../history';
import { MicroCheckResult } from './microCheck';
import {
  TrainingState,
  defaultTrainingState,
  deserializeMicroCheck,
  deserializeTrainingState,
  serializeMicroCheck,
  serializeTrainingState,
} from './serialize';

const STATE_FILE = 'training-state.json';
const MICROCHECK_PREFIX = 'microcheck-';

export class TrainingStore {
  private readonly fs: HistoryFs;

  constructor(fs: HistoryFs) {
    this.fs = fs;
  }

  /** The current training state, or a fresh default when absent/unreadable. */
  async loadState(): Promise<TrainingState> {
    const json = await this.fs.read(STATE_FILE);
    if (!json) return defaultTrainingState();
    return deserializeTrainingState(json) ?? defaultTrainingState();
  }

  saveState(state: TrainingState): void {
    this.fs.write(STATE_FILE, serializeTrainingState(state));
  }

  /** Append one micro-check (one file per check, like the check-up log). */
  saveMicroCheck(result: MicroCheckResult): void {
    const stamp = result.startedAt.replace(/[:.]/g, '-');
    this.fs.write(`${MICROCHECK_PREFIX}${stamp}.json`, serializeMicroCheck(result));
  }

  /** All stored micro-checks, oldest first; unreadable/foreign files skipped. */
  async loadMicroChecks(): Promise<MicroCheckResult[]> {
    const out: MicroCheckResult[] = [];
    for (const name of this.fs.list()) {
      if (!name.startsWith(MICROCHECK_PREFIX) || !name.endsWith('.json')) continue;
      const json = await this.fs.read(name);
      if (!json) continue;
      const record = deserializeMicroCheck(json);
      if (record) out.push(record);
    }
    out.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
    return out;
  }
}
