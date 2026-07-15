/**
 * Onboarding-funnel record + store + transition mapper: events derive from
 * real flow-machine transitions (never hand-built states), records round-trip
 * through the shared in-memory fs, and the two funnel logs sharing one
 * directory never read each other's records.
 */

import { createMemoryFs } from '../../history/store';
import {
  acknowledgeOnboardingStep,
  initialOnboardingFlowState,
  recordOnboardingAnswer,
  undoLastOnboardingStep,
  type ProgrammeOnboardingFlowState,
} from '../../programme/onboarding/flow';
import {
  ONBOARDING_FUNNEL_SCHEMA_VERSION,
  buildOnboardingFunnelEvent,
  deserializeOnboardingFunnelEvent,
  onboardingFunnelEventsForTransition,
  serializeOnboardingFunnelEvent,
} from '../onboardingFunnelRecord';
import { OnboardingFunnelStore } from '../onboardingFunnelStore';
import { SessionFunnelStore } from '../sessionFunnelStore';

function transition(
  prev: ProgrammeOnboardingFlowState,
  advance: (state: ProgrammeOnboardingFlowState) => ProgrammeOnboardingFlowState
) {
  const next = advance(prev);
  return { next, events: onboardingFunnelEventsForTransition(prev, next) };
}

describe('onboarding funnel record', () => {
  it('round-trips an event', () => {
    const record = buildOnboardingFunnelEvent({
      event: 'welcome_continued',
      atIso: '2026-07-14T09:00:00.000Z',
    });
    const back = deserializeOnboardingFunnelEvent(serializeOnboardingFunnelEvent(record));
    expect(back).toEqual(record);
    expect(back!.schemaVersion).toBe(ONBOARDING_FUNNEL_SCHEMA_VERSION);
  });

  it('skips unknown schemas, unknown events, and foreign records', () => {
    const record = buildOnboardingFunnelEvent({
      event: 'baseline_accepted',
      atIso: '2026-07-14T09:00:00.000Z',
    });
    expect(
      deserializeOnboardingFunnelEvent(JSON.stringify({ ...record, schemaVersion: 999 }))
    ).toBeNull();
    expect(
      deserializeOnboardingFunnelEvent(JSON.stringify({ ...record, event: 'future_event' }))
    ).toBeNull();
    expect(
      deserializeOnboardingFunnelEvent(JSON.stringify({ ...record, kind: 'training' }))
    ).toBeNull();
    expect(deserializeOnboardingFunnelEvent('not json')).toBeNull();
  });

  it('never records answer content, only funnel locations', () => {
    const record = buildOnboardingFunnelEvent({
      event: 'advisory_required',
      atIso: '2026-07-14T09:00:00.000Z',
    });
    const json = serializeOnboardingFunnelEvent(record);
    expect(json).not.toMatch(/heart|joint|goal.*:.*(stairs|grandchildren|carry|independence)/i);
    expect(Object.keys(JSON.parse(json)).sort()).toEqual([
      'atIso',
      'event',
      'kind',
      'schemaVersion',
    ]);
  });
});

describe('transition mapper (through the real flow machine)', () => {
  it('walks the happy path emitting each step once', () => {
    let state = initialOnboardingFlowState();

    let step = transition(state, (s) => acknowledgeOnboardingStep(s, 'welcome'));
    expect(step.events).toEqual(['welcome_continued']);
    state = step.next;

    step = transition(state, (s) =>
      recordOnboardingAnswer(s, { step: 'a1_life_goal', value: 'independence' })
    );
    expect(step.events).toEqual(['goal_answered']);
    state = step.next;

    step = transition(state, (s) => recordOnboardingAnswer(s, { step: 'b1_heart', value: 'no' }));
    expect(step.events).toEqual([]);
    state = step.next;

    // b1 = no → answering B3 completes safety AND lands on the start surface.
    step = transition(state, (s) =>
      recordOnboardingAnswer(s, { step: 'b3_joints', value: ['knee'] })
    );
    expect(step.events).toEqual(['safety_questions_completed', 'start_screen_reached']);
  });

  it('flags the advisory path and reaches start only after confirmation', () => {
    let state = acknowledgeOnboardingStep(initialOnboardingFlowState(), 'welcome');
    state = recordOnboardingAnswer(state, { step: 'a1_life_goal', value: 'skipped' });

    let step = transition(state, (s) => recordOnboardingAnswer(s, { step: 'b1_heart', value: 'yes' }));
    expect(step.events).toEqual(['advisory_required']);
    state = step.next;

    step = transition(state, (s) => recordOnboardingAnswer(s, { step: 'b3_joints', value: [] }));
    expect(step.events).toEqual(['safety_questions_completed']);
    state = step.next;

    step = transition(state, (s) => acknowledgeOnboardingStep(s, 'b1_advisory'));
    expect(step.events).toEqual(['advisory_confirmed', 'start_screen_reached']);
  });

  it('emits goal_skipped for the explicit later path and nothing on undo', () => {
    let state = acknowledgeOnboardingStep(initialOnboardingFlowState(), 'welcome');
    let step = transition(state, (s) =>
      recordOnboardingAnswer(s, { step: 'a1_life_goal', value: 'skipped' })
    );
    expect(step.events).toEqual(['goal_skipped']);
    state = step.next;

    step = transition(state, (s) => undoLastOnboardingStep(s));
    expect(step.events).toEqual([]);
  });
});

describe('OnboardingFunnelStore', () => {
  it('persists events across a simulated restart, oldest first', async () => {
    const files = new Map<string, string>();
    const store = new OnboardingFunnelStore(createMemoryFs(files));
    store.save(
      buildOnboardingFunnelEvent({ event: 'checkup_started', atIso: '2026-07-14T09:05:00.000Z' })
    );
    store.save(
      buildOnboardingFunnelEvent({ event: 'welcome_continued', atIso: '2026-07-14T09:00:00.000Z' })
    );
    files.set('foreign.json', 'not a funnel');

    const reloaded = new OnboardingFunnelStore(createMemoryFs(files));
    const all = await reloaded.loadAll();
    expect(all.map((record) => record.event)).toEqual(['welcome_continued', 'checkup_started']);
  });

  it('gives same-instant events distinct files and ignores training records', async () => {
    const files = new Map<string, string>();
    const store = new OnboardingFunnelStore(createMemoryFs(files));
    const atIso = '2026-07-14T09:00:00.000Z';
    store.save(buildOnboardingFunnelEvent({ event: 'safety_questions_completed', atIso }));
    store.save(buildOnboardingFunnelEvent({ event: 'start_screen_reached', atIso }));
    expect(files.size).toBe(2);

    // The two funnel logs share one directory; neither reads the other.
    const sessionStore = new SessionFunnelStore(createMemoryFs(files));
    expect(await sessionStore.loadAll()).toEqual([]);
    const all = await new OnboardingFunnelStore(createMemoryFs(files)).loadAll();
    expect(all).toHaveLength(2);
  });
});
