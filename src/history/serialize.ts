/**
 * Persisted check-up record: schema-versioned from day one (CLAUDE.md data
 * rule). We store the RAW CheckUp (measurements) as the source of truth and
 * recompute domain scores/trends on load, so norm or scoring improvements
 * apply retroactively to history.
 *
 * Pure (de)serialization + migration — no I/O, fully unit-testable. Non-finite
 * numbers (NaN for unmeasured metrics) are stored as null and read back as
 * null; every consumer already guards with Number.isFinite.
 */

import { CheckUp } from '../checkup/types';

export const HISTORY_SCHEMA_VERSION = 1;

export interface StoredCheckUp {
  schemaVersion: number;
  checkUp: CheckUp;
}

function nanReplacer(_key: string, value: unknown): unknown {
  return typeof value === 'number' && !Number.isFinite(value) ? null : value;
}

export function serializeCheckUp(checkUp: CheckUp): string {
  const record: StoredCheckUp = { schemaVersion: HISTORY_SCHEMA_VERSION, checkUp };
  return JSON.stringify(record, nanReplacer);
}

/**
 * Migrate a parsed record forward to the current schema. Returns null for
 * anything unreadable or from a schema we don't understand (forward-compatible:
 * a newer app's file is skipped rather than crashing an older app).
 */
export function migrate(parsed: unknown): StoredCheckUp | null {
  if (!parsed || typeof parsed !== 'object') return null;
  const rec = parsed as Partial<StoredCheckUp>;
  if (rec.schemaVersion !== HISTORY_SCHEMA_VERSION) return null; // no older versions exist yet
  const checkUp = rec.checkUp;
  if (!checkUp || typeof checkUp !== 'object' || !Array.isArray(checkUp.items)) return null;
  if (typeof checkUp.startedAt !== 'string') return null;
  return rec as StoredCheckUp;
}

export function deserializeCheckUp(json: string): StoredCheckUp | null {
  try {
    return migrate(JSON.parse(json));
  } catch {
    return null;
  }
}
