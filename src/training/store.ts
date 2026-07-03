/**
 * Local-only training store (no accounts/backend in V1), reusing the injectable
 * HistoryFs so the seam — including "survives restart" — is unit-testable with
 * an in-memory map. The single mutable TrainingState lives in one file
 * (overwritten in place); legacy micro-checks are one file per start time,
 * while slot-backed micro-checks keep the first accepted slot file for
 * idempotency and conflict containment.
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
import {
  TrainingSessionInProgress,
  deserializeSessionInProgress,
  serializeSessionInProgress,
} from './sessionResume';

const STATE_FILE = 'training-state.json';
const MICROCHECK_PREFIX = 'microcheck-';
const SESSION_IN_PROGRESS_FILE = 'training-session-in-progress.json';

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

  /** Save one micro-check, using the stable slot id when present. */
  saveMicroCheck(result: MicroCheckResult): void {
    const stamp = microCheckFileStem(result);
    const fileName = `${MICROCHECK_PREFIX}${stamp}.json`;
    if (result.slotId && this.fs.list().includes(fileName)) return;
    this.fs.write(fileName, serializeMicroCheck(result));
  }

  /** All stored micro-checks, oldest first; unreadable/foreign files skipped. */
  async loadMicroChecks(): Promise<MicroCheckResult[]> {
    const byIdentity = new Map<string, MicroCheckResult>();
    for (const name of this.fs.list()) {
      if (!name.startsWith(MICROCHECK_PREFIX) || !name.endsWith('.json')) continue;
      const json = await this.fs.read(name);
      if (!json) continue;
      const record = deserializeMicroCheck(json);
      if (record) byIdentity.set(microCheckIdentity(record), record);
    }
    const out = Array.from(byIdentity.values());
    out.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
    return out;
  }

  /** Overwrite the single in-flight session snapshot (one at a time by design). */
  saveSessionInProgress(snapshot: TrainingSessionInProgress): void {
    this.fs.write(SESSION_IN_PROGRESS_FILE, serializeSessionInProgress(snapshot));
  }

  /** The surviving mid-session snapshot, or null when absent/unreadable. */
  async loadSessionInProgress(): Promise<TrainingSessionInProgress | null> {
    const json = await this.fs.read(SESSION_IN_PROGRESS_FILE);
    return json ? deserializeSessionInProgress(json) : null;
  }

  clearSessionInProgress(): void {
    this.fs.delete?.(SESSION_IN_PROGRESS_FILE);
  }
}

function microCheckFileStem(result: MicroCheckResult): string {
  const identity = result.slotId ?? result.startedAt;
  return identity.replace(/[^A-Za-z0-9._-]/g, '-');
}

function microCheckIdentity(result: MicroCheckResult): string {
  return result.slotId ?? `${result.type}:${result.startedAt}`;
}
