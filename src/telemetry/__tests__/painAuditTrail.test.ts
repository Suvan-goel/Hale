/**
 * Founder confirmation (2026-07-06): the Settings reversal toggle clears
 * RECURRENCE STATE ONLY. The telemetry pain_event record is an immutable
 * audit trail — never deleted, never rewritten. Pinned here end-to-end with
 * in-memory stores standing in for both file systems.
 */

import type { HistoryFs } from '../../history/store';
import { STS_STANDARD_ID } from '../../exercises';
import {
  defaultPainHistory,
  recordSessionPainEvents,
  reinstateLadder,
} from '../../training/painHistory';
import {
  buildStoredSessionFunnel,
  deserializeSessionFunnel,
  serializeSessionFunnel,
  SESSION_FUNNEL_SCHEMA_VERSION,
} from '../sessionFunnelRecord';
import { SessionFunnelStore } from '../sessionFunnelStore';

function memoryFs(): { fs: HistoryFs; files: Map<string, string> } {
  const files = new Map<string, string>();
  return {
    files,
    fs: {
      list: () => [...files.keys()],
      read: async (name: string) => files.get(name) ?? null,
      write: (name: string, contents: string) => {
        files.set(name, contents);
      },
    } as unknown as HistoryFs,
  };
}

const FUNNEL = {
  timeToFirstSetMs: 4000,
  timeToFirstRepMs: null,
  setupIssueCount: 0,
  items: [
    { exerciseId: STS_STANDARD_ID, framingMs: null, toFirstSetMs: 4000, setupIssues: 0, skippedDuringSetup: false },
  ],
  endedInPhase: 'done',
  completed: true,
};

const PAIN_EVENTS = [{ exerciseId: STS_STANDARD_ID, setIndex: 0, timestampMs: 61000 }];

describe('pain audit trail immutability', () => {
  it('reinstating a ladder clears recurrence state but never touches funnel records', () => {
    const { fs, files } = memoryFs();
    const store = new SessionFunnelStore(fs);

    // Two sessions with pain → exclusion in the product store, audit records
    // in telemetry.
    let history = defaultPainHistory();
    for (const startedAt of ['2026-07-01T08:00:00.000Z', '2026-07-03T08:00:00.000Z']) {
      store.save(
        buildStoredSessionFunnel({
          startedAt,
          endedAt: startedAt,
          outcome: 'completed',
          funnel: FUNNEL,
          sessionMode: 'voice_guided',
          painEvents: PAIN_EVENTS,
        })
      );
      history = recordSessionPainEvents(history, PAIN_EVENTS, startedAt).history;
    }
    expect(history.exclusions.map((x) => x.ladderId)).toEqual(['sit-to-stand']);
    const auditBytesBefore = new Map(files);

    // The Settings toggle.
    const reinstated = reinstateLadder(history, 'sit-to-stand');
    expect(reinstated.exclusions).toEqual([]);
    expect(reinstated.events).toEqual([]); // recurrence state cleared…

    // …while every telemetry byte is exactly as written.
    expect(files.size).toBe(auditBytesBefore.size);
    for (const [name, bytes] of auditBytesBefore) {
      expect(files.get(name)).toBe(bytes);
    }
    // And the records still carry the pain events on read-back.
    for (const json of files.values()) {
      const record = deserializeSessionFunnel(json);
      expect(record?.painEvents).toEqual(PAIN_EVENTS);
    }
  });

  it('the funnel store is append-only by construction: no delete/rewrite API', () => {
    const storeApi = Object.getOwnPropertyNames(SessionFunnelStore.prototype).filter(
      (name) => name !== 'constructor'
    );
    expect(storeApi.sort()).toEqual(['loadAll', 'save']);
  });

  it('v2 records round-trip audit fields; v1 records stay readable', () => {
    const v2 = buildStoredSessionFunnel({
      startedAt: '2026-07-06T09:00:00.000Z',
      endedAt: '2026-07-06T09:20:00.000Z',
      outcome: 'abandoned',
      funnel: { ...FUNNEL, endedInPhase: 'set', completed: false },
      sessionMode: 'voice_guided',
      voiceIntentCounts: { done: 3, ready: 4 },
      tapActionCounts: { done: 1 },
      painEvents: PAIN_EVENTS,
    });
    expect(v2.schemaVersion).toBe(SESSION_FUNNEL_SCHEMA_VERSION);
    expect(v2.completionPoint).toBe('abandoned_mid_set');
    const restored = deserializeSessionFunnel(serializeSessionFunnel(v2));
    expect(restored?.painEvents).toEqual(PAIN_EVENTS);
    expect(restored?.voiceIntentCounts).toEqual({ done: 3, ready: 4 });
    expect(restored?.sessionMode).toBe('voice_guided');

    const v1 = {
      schemaVersion: 1,
      kind: 'training',
      startedAt: '2026-06-30T09:00:00.000Z',
      endedAt: '2026-06-30T09:20:00.000Z',
      outcome: 'completed',
      funnel: FUNNEL,
    };
    const restoredV1 = deserializeSessionFunnel(JSON.stringify(v1));
    expect(restoredV1).not.toBeNull();
    expect(restoredV1?.painEvents).toBeUndefined();
  });
});
