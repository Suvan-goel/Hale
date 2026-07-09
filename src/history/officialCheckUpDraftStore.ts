/**
 * Crash-safe staging for an in-progress official Movement Check-Up.
 *
 * A completed movement battery is useful work, but it must not enter official
 * history until the optional appendices have been offered and the complete
 * record is materialized. This single local file keeps that boundary honest:
 * HistoryStore cannot parse the wrapper as a completed record, while this
 * store reuses the same defensive CheckUp serializer for its payload.
 */

import type { CheckUp } from '../checkup/types';
import type { HistoryFs } from './store';
import {
  deserializeCheckUp,
  serializeCheckUp,
  type StoredCheckUpType,
} from './serialize';

export const OFFICIAL_CHECKUP_DRAFT_FILE = 'checkup-official-draft.json' as const;
export const OFFICIAL_CHECKUP_DRAFT_SCHEMA_VERSION = 1 as const;

export type OfficialCheckUpDraftType = Extract<
  StoredCheckUpType,
  'baseline' | 'official_retest'
>;

export interface OfficialCheckUpDraft {
  schemaVersion: typeof OFFICIAL_CHECKUP_DRAFT_SCHEMA_VERSION;
  checkupType: OfficialCheckUpDraftType;
  updatedAtIso: string;
  checkUp: CheckUp;
}

interface StoredDraftEnvelope {
  schemaVersion: typeof OFFICIAL_CHECKUP_DRAFT_SCHEMA_VERSION;
  updatedAtIso: string;
  payload: string;
}

export class OfficialCheckUpDraftStore {
  constructor(private readonly fs: HistoryFs) {}

  save(
    checkUp: CheckUp,
    checkupType: OfficialCheckUpDraftType,
    updatedAtIso: string = new Date().toISOString()
  ): void {
    const envelope: StoredDraftEnvelope = {
      schemaVersion: OFFICIAL_CHECKUP_DRAFT_SCHEMA_VERSION,
      updatedAtIso,
      payload: serializeCheckUp(checkUp, { checkupType }),
    };
    this.fs.write(OFFICIAL_CHECKUP_DRAFT_FILE, JSON.stringify(envelope));
  }

  async load(): Promise<OfficialCheckUpDraft | null> {
    const json = await this.fs.read(OFFICIAL_CHECKUP_DRAFT_FILE);
    if (!json) return null;
    try {
      const parsed = JSON.parse(json) as Partial<StoredDraftEnvelope>;
      if (
        parsed.schemaVersion !== OFFICIAL_CHECKUP_DRAFT_SCHEMA_VERSION ||
        typeof parsed.updatedAtIso !== 'string' ||
        !Number.isFinite(Date.parse(parsed.updatedAtIso)) ||
        typeof parsed.payload !== 'string'
      ) {
        return null;
      }
      const record = deserializeCheckUp(parsed.payload);
      if (
        !record ||
        (record.checkupType !== 'baseline' && record.checkupType !== 'official_retest')
      ) {
        return null;
      }
      return {
        schemaVersion: OFFICIAL_CHECKUP_DRAFT_SCHEMA_VERSION,
        checkupType: record.checkupType,
        updatedAtIso: parsed.updatedAtIso,
        checkUp: record.checkUp,
      };
    } catch {
      return null;
    }
  }

  clear(): void {
    if (this.fs.delete) {
      this.fs.delete(OFFICIAL_CHECKUP_DRAFT_FILE);
      return;
    }
    // Adapters without deletion support still invalidate the draft safely.
    this.fs.write(OFFICIAL_CHECKUP_DRAFT_FILE, '');
  }
}
