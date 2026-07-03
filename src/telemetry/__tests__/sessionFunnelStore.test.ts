/**
 * Session-funnel record + store: round-trip through the in-memory fs,
 * forward-compatible skipping of unknown schemas, and non-finite-number
 * hygiene — mirrors the check-up history store's guarantees.
 */

import { createMemoryFs } from '../../history/store';
import type { TrainingSessionFunnel } from '../../training/sessionFunnel';
import {
  SESSION_FUNNEL_SCHEMA_VERSION,
  buildStoredSessionFunnel,
  deserializeSessionFunnel,
  serializeSessionFunnel,
} from '../sessionFunnelRecord';
import { SessionFunnelStore } from '../sessionFunnelStore';

function funnel(overrides: Partial<TrainingSessionFunnel> = {}): TrainingSessionFunnel {
  return {
    timeToFirstSetMs: 42000,
    timeToFirstRepMs: null,
    setupIssueCount: 0,
    items: [
      {
        exerciseId: 'sts_standard',
        framingMs: 6100,
        toFirstSetMs: 21000,
        setupIssues: 0,
        skippedDuringSetup: false,
      },
    ],
    endedInPhase: 'done',
    completed: true,
    ...overrides,
  };
}

describe('session funnel record', () => {
  it('round-trips a completed record', () => {
    const record = buildStoredSessionFunnel({
      startedAt: '2026-07-03T09:00:00.000Z',
      endedAt: '2026-07-03T09:14:00.000Z',
      outcome: 'completed',
      funnel: funnel(),
    });
    const back = deserializeSessionFunnel(serializeSessionFunnel(record));
    expect(back).toEqual(record);
    expect(back!.schemaVersion).toBe(SESSION_FUNNEL_SCHEMA_VERSION);
  });

  it('stores non-finite numbers as null', () => {
    const record = buildStoredSessionFunnel({
      startedAt: '2026-07-03T09:00:00.000Z',
      endedAt: '2026-07-03T09:01:00.000Z',
      outcome: 'abandoned',
      funnel: funnel({ timeToFirstSetMs: NaN as unknown as number }),
    });
    const back = deserializeSessionFunnel(serializeSessionFunnel(record));
    expect(back!.funnel.timeToFirstSetMs).toBeNull();
  });

  it('skips unknown schemas and malformed records instead of crashing', () => {
    const record = buildStoredSessionFunnel({
      startedAt: '2026-07-03T09:00:00.000Z',
      endedAt: '2026-07-03T09:14:00.000Z',
      outcome: 'completed',
      funnel: funnel(),
    });
    const future = JSON.stringify({ ...record, schemaVersion: 999 });
    expect(deserializeSessionFunnel(future)).toBeNull();
    expect(deserializeSessionFunnel('not json')).toBeNull();
    expect(deserializeSessionFunnel('{"schemaVersion":1}')).toBeNull();
  });
});

describe('SessionFunnelStore', () => {
  it('persists records across a simulated restart, oldest first', async () => {
    const files = new Map<string, string>();
    const store = new SessionFunnelStore(createMemoryFs(files));
    store.save(
      buildStoredSessionFunnel({
        startedAt: '2026-07-03T09:00:00.000Z',
        endedAt: '2026-07-03T09:14:00.000Z',
        outcome: 'completed',
        funnel: funnel(),
      })
    );
    store.save(
      buildStoredSessionFunnel({
        startedAt: '2026-07-01T08:00:00.000Z',
        endedAt: '2026-07-01T08:02:00.000Z',
        outcome: 'abandoned',
        funnel: funnel({ completed: false, endedInPhase: 'preflight' }),
      })
    );
    files.set('foreign.json', 'not a funnel');

    const reloaded = new SessionFunnelStore(createMemoryFs(files));
    const all = await reloaded.loadAll();
    expect(all).toHaveLength(2);
    expect(all[0].outcome).toBe('abandoned');
    expect(all[1].outcome).toBe('completed');
  });
});
