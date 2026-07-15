import {
  PROGRAMME_SESSION_RPE_OPTIONS,
  checkupOfferFor,
  healthAnswersRequiredBeforeBaseline,
  nextProgrammeSessionInput,
  onboardingCompletionRoute,
  patternTitle,
  postSessionSurface,
  preSessionPrompt,
  programmeLevelRows,
  programmeTodayViewModel,
} from '../appLifecycle';
import { markSurfaceShown } from '../postOnboarding';
import { defaultProgrammeState } from '../serialize';
import type { ProgrammeSessionPlan } from '../session';
import { PROGRAMME_PATTERNS, type ProgrammeState, type PromotionDecision } from '../types';

const NOW = '2026-07-20T10:00:00.000Z';
const DAY_MS = 24 * 60 * 60 * 1000;

function daysBeforeNow(days: number): string {
  return new Date(Date.parse(NOW) - days * DAY_MS).toISOString();
}

function onboarded(overrides: Partial<ProgrammeState['profile']> = {}): ProgrammeState {
  const state = defaultProgrammeState();
  state.profile = { ...state.profile, consentHealthData: true, hasStairs: true, ...overrides };
  state.onboardingCompletedAtIso = daysBeforeNow(14);
  return state;
}

/** A returning user: first session behind them, training normally. */
function training(overrides: Partial<ProgrammeState> = {}): ProgrammeState {
  const state = onboarded({ firstSessionStarted: true, assessmentStatus: 'done' });
  state.completedSessionCount = 1;
  state.lastSessionAtIso = daysBeforeNow(2);
  return { ...state, ...overrides };
}

/** Minimal plan stub for the pre-session trigger helpers (they read only `main`). */
function planWithMain(
  main: readonly { pattern: (typeof PROGRAMME_PATTERNS)[number]; level: number }[]
): ProgrammeSessionPlan {
  return { main } as unknown as ProgrammeSessionPlan;
}

describe('nextProgrammeSessionInput (the one A/B + preset rule)', () => {
  it('first-ever session: template A on even parity, 15-minute minimum-dose preset', () => {
    const input = nextProgrammeSessionInput(onboarded());
    expect(input).toEqual({ template: 'A', preset: 'first_session', lastSessionEffort: null });
  });

  it('alternates A/B by completed-session parity and passes the persisted effort through', () => {
    const one = training({ lastSessionEffort: 'lots' });
    expect(nextProgrammeSessionInput(one)).toEqual({
      template: 'B',
      preset: 'standard',
      lastSessionEffort: 'lots',
    });
    const two = training({ completedSessionCount: 2, lastSessionEffort: 'a_few' });
    expect(nextProgrammeSessionInput(two).template).toBe('A');
  });
});

describe('programmeTodayViewModel', () => {
  it('makes the accepted baseline the first action for an eligible new user', () => {
    const vm = programmeTodayViewModel(onboarded(), NOW);
    expect(vm.state).toBe('baseline_due');
    expect(vm.primaryAction).toMatchObject({
      type: 'start_baseline_checkup',
      title: 'Start with your Movement Check-Up',
      ctaLabel: 'Start check-up',
    });
    expect(vm.primaryAction.subtitle).toContain('before Week 1');
    expect(vm.sessionDetail).toContain('Strength, Balance');
    expect(vm.checkupOffer).toBeNull();
  });

  it('first session: minimum-dose preview with the stated duration matching the generated estimate', () => {
    const vm = programmeTodayViewModel(onboarded({ assessmentStatus: 'done' }), NOW);
    expect(vm.state).toBe('first_session_ready');
    expect(vm.primaryAction.type).toBe('start_first_session');
    expect(vm.sessionPreview.preset).toBe('first_session');
    expect(vm.sessionPreview.template).toBe('A');
    // Truthful-duration discipline: the number spoken in copy IS the estimate.
    const minutes = Math.round(vm.sessionPreview.estimatedMinutes);
    expect(vm.primaryAction.subtitle).toContain(`About ${minutes} minutes`);
    expect(vm.sessionDetail).toContain(`about ${minutes} minutes`);
    // Fresh placement, nothing deferred/skipped → no check-up affordance yet.
    expect(vm.checkupOffer).toBeNull();
  });

  it('normal training day: session detail lists the plan patterns in plain words', () => {
    const vm = programmeTodayViewModel(training(), NOW);
    expect(vm.state).toBe('session_ready');
    expect(vm.primaryAction.type).toBe('start_today_session');
    expect(vm.sessionPreview.template).toBe('B');
    expect(vm.sessionDetail).toMatch(/^Today: [a-z, ]+(?: and [a-z]+)? — about \d+ minutes\.$/);
    // Naming law: plain pattern words, never internal ids.
    for (const title of vm.sessionPreview.mainPatternTitles) {
      expect(title).not.toContain('.');
      expect(PROGRAMME_PATTERNS.map(patternTitle)).toContain(title);
    }
  });

  it('14+ days away: gentle returning state, preview built on the eased ladders, input state untouched', () => {
    const state = training({ lastSessionAtIso: daysBeforeNow(20) });
    for (const pattern of PROGRAMME_PATTERNS) {
      state.ladders[pattern] = { ...state.ladders[pattern], currentLevel: 3 };
    }
    const before = JSON.stringify(state);
    const vm = programmeTodayViewModel(state, NOW);
    expect(vm.state).toBe('returning_after_break');
    expect(vm.primaryAction.type).toBe('start_gentle_restart');
    expect(vm.primaryAction.tone).toBe('gentle');
    // Pure projection: the caller's state object is never mutated — the
    // easing is persisted at session start, not at render.
    expect(JSON.stringify(state)).toBe(before);
  });

  it('a short gap does not read as a break', () => {
    const vm = programmeTodayViewModel(training({ lastSessionAtIso: daysBeforeNow(13) }), NOW);
    expect(vm.state).toBe('session_ready');
  });

  it('a legacy deferred state leads with the baseline before any generic session', () => {
    const state = onboarded({ assessmentStatus: 'deferred' });
    const vm = programmeTodayViewModel(state, NOW);
    expect(vm.state).toBe('baseline_due');
    expect(vm.primaryAction).toMatchObject({
      type: 'start_baseline_checkup',
      ctaLabel: 'Start check-up',
    });
    expect(vm.primaryAction.subtitle).toContain('before Week 1');
    expect(vm.sessionDetail).toContain('Strength, Balance');
    expect(vm.sessionDetail).not.toContain('Today:');
    expect(vm.checkupOffer).toBeNull();
  });

  it('makes a due monthly check-up the single Home hero action', () => {
    const due = training();
    due.profile = {
      ...due.profile,
      assessmentStatus: 'done',
      lastAssessmentAtIso: daysBeforeNow(29),
    };
    const vm = programmeTodayViewModel(due, NOW);
    expect(vm.state).toBe('baseline_due');
    expect(vm.primaryAction).toMatchObject({
      type: 'start_baseline_checkup',
      title: 'Your next 12-week check-up is ready',
      ctaLabel: 'Start check-up',
    });
    expect(vm.primaryAction.subtitle).toContain('Everyday Clarity');
    expect(vm.checkupOffer?.kind).toBe('routine_due');
  });

  it.each(['skipped', null] as const)(
    'legacy/interrupted %p state requires the baseline immediately',
    (assessmentStatus) => {
      const state = onboarded({ assessmentStatus });
      expect(programmeTodayViewModel(state, NOW).state).toBe('baseline_due');
    }
  );

  it('requires health-answer review instead of exposing Week 1 after consent was declined', () => {
    const declined = onboarded();
    declined.profile = {
      ...declined.profile,
      assessmentStatus: 'skipped',
      consentHealthData: false,
    };
    const vm = programmeTodayViewModel(declined, NOW);
    expect(healthAnswersRequiredBeforeBaseline(declined)).toBe(true);
    expect(vm.state).toBe('health_answers_required');
    expect(vm.primaryAction).toMatchObject({
      type: 'review_health_answers',
      ctaLabel: 'Review health answers',
    });
    expect(vm.primaryAction.subtitle).toContain('accepted starting check-up');
    expect(vm.sessionDetail).not.toContain('Today:');
  });

  it('does not force the baseline through the active B1 Gentle Start safety gate', () => {
    const gentle = onboarded();
    gentle.profile = {
      ...gentle.profile,
      assessmentStatus: 'bypassed_b1',
      gentleStartActive: true,
      gpConfirmed: false,
    };
    expect(programmeTodayViewModel(gentle, NOW).state).toBe('first_session_ready');
  });

  it('does not lock an already-assessed programme if health answers are removed later', () => {
    const assessed = training();
    assessed.profile = { ...assessed.profile, consentHealthData: false };
    expect(healthAnswersRequiredBeforeBaseline(assessed)).toBe(false);
    expect(programmeTodayViewModel(assessed, NOW).primaryAction.type).toBe(
      'start_today_session'
    );
  });
});

describe('checkupOfferFor (dev-shell home semantics preserved)', () => {
  it('routine 28-day cadence: persistent card while due, only for done placements', () => {
    const due = training();
    due.profile = { ...due.profile, assessmentStatus: 'done', lastAssessmentAtIso: daysBeforeNow(29) };
    expect(checkupOfferFor(due, NOW)).toEqual({
      kind: 'routine_due',
      title: 'Your next Movement Check-Up is ready',
      ctaLabel: 'Start check-up',
    });

    const fresh = training();
    fresh.profile = { ...fresh.profile, assessmentStatus: 'done', lastAssessmentAtIso: daysBeforeNow(10) };
    expect(checkupOfferFor(fresh, NOW)).toBeNull();
  });

  it('deferred placement: the standing entry appears after the first completed session, not before', () => {
    const deferredNoSessions = onboarded({ assessmentStatus: 'deferred' });
    expect(checkupOfferFor(deferredNoSessions, NOW)).toBeNull();

    const deferredOneSession = training();
    deferredOneSession.profile = { ...deferredOneSession.profile, assessmentStatus: 'deferred' };
    expect(checkupOfferFor(deferredOneSession, NOW)?.kind).toBe('standing_entry');
  });

  it('B1 bypass: NO check-up surface exists until gp_confirmed (conformance Q1)', () => {
    const bypassed = training();
    bypassed.profile = {
      ...bypassed.profile,
      assessmentStatus: 'bypassed_b1',
      gentleStartActive: true,
      gpConfirmed: false,
    };
    expect(checkupOfferFor(bypassed, NOW)).toBeNull();
  });

  it('does not surface an unusable due check-up after health answers are removed', () => {
    const declined = training();
    declined.profile = {
      ...declined.profile,
      consentHealthData: false,
      lastAssessmentAtIso: daysBeforeNow(40),
    };
    expect(checkupOfferFor(declined, NOW)).toBeNull();
    expect(programmeTodayViewModel(declined, NOW).primaryAction.type).toBe(
      'start_today_session'
    );
  });

  it('does not silently start a fifth checkpoint after the 12-week journey completes', () => {
    const completed = training();
    completed.profile = {
      ...completed.profile,
      assessmentStatus: 'done',
      lastAssessmentAtIso: daysBeforeNow(40),
    };
    completed.journey = {
      ...completed.journey,
      status: 'completed',
      startedAtIso: daysBeforeNow(120),
      completedAtIso: daysBeforeNow(40),
      currentPhase: null,
      currentPhaseStartedAtIso: null,
    };
    expect(checkupOfferFor(completed, NOW)).toBeNull();
  });
});

describe('preSessionPrompt (in-context questions, dev-shell order)', () => {
  it('band question wins over the doming check when both are due', () => {
    const state = training();
    const plan = planWithMain([
      { pattern: 'pull', level: 4 },
      { pattern: 'core', level: 1 },
    ]);
    expect(preSessionPrompt(state, plan)?.kind).toBe('band_question');
  });

  it('doming check fires at the first core feature and never recurs once shown', () => {
    const state = training();
    const plan = planWithMain([{ pattern: 'core', level: 1 }]);
    expect(preSessionPrompt(state, plan)?.kind).toBe('doming_check');
    const shown = markSurfaceShown(state, 'doming_check');
    expect(preSessionPrompt(shown, plan)).toBeNull();
  });
});

describe('postSessionSurface (precedence pinned)', () => {
  const lockedHinge: Partial<Record<(typeof PROGRAMME_PATTERNS)[number], PromotionDecision>> = {
    hinge: { kind: 'promotion_locked', toLevel: 2, reason: 'gateway_incomplete' },
  };

  it('a gateway-locked promotion wins over every re-offer', () => {
    const state = training();
    state.profile = { ...state.profile, assessmentStatus: 'deferred' };
    const surface = postSessionSurface(state, lockedHinge);
    expect(surface?.kind).toBe('gateway_teach');
    if (!surface) return;
    expect(surface.pattern).toBe('hinge');
    expect(surface.toLevel).toBe(2);
    // Naming law: the teach card names the level in plain language.
    expect(surface.levelDisplayName).not.toContain('.');
    expect(surface.title).toContain(surface.levelDisplayName);
    // No progress recorded yet → both steps outstanding.
    expect(surface.demoWatched).toBe(false);
    expect(surface.selfConfirmed).toBe(false);
  });

  it('non-gateway decisions return directly Home even when a Home check-up offer is due', () => {
    const state = training();
    state.profile = { ...state.profile, assessmentStatus: 'deferred' };
    const decisions: Partial<Record<(typeof PROGRAMME_PATTERNS)[number], PromotionDecision>> = {
      squat: { kind: 'promote', toLevel: 2, reason: 'standard' },
      hinge: { kind: 'hold' },
    };
    expect(postSessionSurface(state, decisions)).toBeNull();
    expect(checkupOfferFor(state, NOW)?.kind).toBe('standing_entry');
  });

  it('skipped check-ups stay on Home rather than interrupting session completion', () => {
    const state = training({ completedSessionCount: 2 });
    state.profile = { ...state.profile, assessmentStatus: 'skipped' };
    expect(postSessionSurface(state, {})).toBeNull();
    expect(checkupOfferFor(state, NOW)?.kind).toBe('standing_entry');
  });

  it('quiet default: no extra post-session surface', () => {
    expect(postSessionSurface(training(), {})).toBeNull();
  });
});

describe('programmeLevelRows', () => {
  it('one row per pattern in stable order, plain-language names, honest bounds', () => {
    const rows = programmeLevelRows(training());
    expect(rows.map((row) => row.pattern)).toEqual([...PROGRAMME_PATTERNS]);
    for (const row of rows) {
      expect(row.patternTitle).toBe(patternTitle(row.pattern));
      expect(row.currentLevel).toBeGreaterThanOrEqual(1);
      expect(row.maxLevel).toBeGreaterThanOrEqual(row.currentLevel);
      expect(row.levelDisplayName).not.toContain('.');
      expect(row.levelDisplayName.length).toBeGreaterThan(0);
    }
  });
});

describe('effort check-in options (C9)', () => {
  it('shows the three progression signals directly', () => {
    expect(PROGRAMME_SESSION_RPE_OPTIONS).toEqual([
      { value: 1, label: 'I could do lots more' },
      { value: 3, label: 'I could do a few more' },
      { value: 5, label: 'Nothing left' },
    ]);
  });
});

describe('onboardingCompletionRoute (flow.ts completion contract honored)', () => {
  it("assessment 'now' launches Check-up #0 first, keeping the CTA's first-session promise for after", () => {
    expect(
      onboardingCompletionRoute({ assessmentIntent: 'start_now' }, 'start_first_session')
    ).toEqual({ assessmentFirst: true, startFirstSession: true });
    expect(onboardingCompletionRoute({ assessmentIntent: 'start_now' }, 'schedule')).toEqual({
      assessmentFirst: true,
      startFirstSession: false,
    });
  });

  it('no assessment intent fails closed instead of exposing a session route', () => {
    expect(onboardingCompletionRoute({ assessmentIntent: null }, 'start_first_session')).toEqual({
      assessmentFirst: false,
      startFirstSession: false,
    });
    expect(onboardingCompletionRoute({ assessmentIntent: null }, 'schedule')).toEqual({
      assessmentFirst: false,
      startFirstSession: false,
    });
  });
});
