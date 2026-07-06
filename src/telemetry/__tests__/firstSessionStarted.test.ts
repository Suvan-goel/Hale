/**
 * The activation event (onboarding-spec §10 — the flow's success metric),
 * mirrored into the local session-funnel record from day one of the
 * programme-v2 onboarding. Local telemetry only (ruling: no remote analytics).
 */

import {
  buildStoredSessionFunnel,
  deserializeSessionFunnel,
  SESSION_FUNNEL_SCHEMA_VERSION,
  serializeSessionFunnel,
} from '../sessionFunnelRecord';
import type { TrainingSessionFunnel } from '../../training/sessionFunnel';

function funnel(): TrainingSessionFunnel {
  return {
    timeToFirstSetMs: 1000,
    timeToFirstRepMs: null,
    setupIssueCount: 0,
    items: [],
    endedInPhase: 'done',
    completed: true,
  };
}

describe('firstSessionStarted (schema v3)', () => {
  it('is stamped on the first-ever session record and round-trips', () => {
    const record = buildStoredSessionFunnel({
      startedAt: '2026-07-06T10:00:00.000Z',
      endedAt: '2026-07-06T10:20:00.000Z',
      outcome: 'completed',
      funnel: funnel(),
      firstSessionStarted: true,
    });
    expect(record.schemaVersion).toBe(SESSION_FUNNEL_SCHEMA_VERSION);
    expect(record.firstSessionStarted).toBe(true);
    expect(deserializeSessionFunnel(serializeSessionFunnel(record))?.firstSessionStarted).toBe(true);
  });

  it('is absent (not false) on every later record', () => {
    const record = buildStoredSessionFunnel({
      startedAt: '2026-07-07T10:00:00.000Z',
      endedAt: '2026-07-07T10:20:00.000Z',
      outcome: 'completed',
      funnel: funnel(),
    });
    expect('firstSessionStarted' in record).toBe(false);
  });

  it('keeps v1 and v2 records readable with the field simply absent', () => {
    const v2 = serializeSessionFunnel({
      ...buildStoredSessionFunnel({
        startedAt: '2026-07-05T10:00:00.000Z',
        endedAt: '2026-07-05T10:20:00.000Z',
        outcome: 'abandoned',
        funnel: { ...funnel(), completed: false, endedInPhase: 'rest' },
      }),
      schemaVersion: 2,
    });
    const parsed = deserializeSessionFunnel(v2);
    expect(parsed).not.toBeNull();
    expect(parsed?.schemaVersion).toBe(2);
    expect('firstSessionStarted' in (parsed ?? {})).toBe(false);
  });
});
