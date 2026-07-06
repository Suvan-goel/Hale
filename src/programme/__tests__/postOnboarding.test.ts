import {
  CHECKUP_ZERO_PROTOCOL_SEQUENCE,
  assessmentInputsFromV2Results,
  assessmentReoffer,
  recordBandAnswer,
  recordDomingCheck,
  shouldAskBandQuestion,
  shouldShowDomingCheck,
} from '../postOnboarding';
import { generateProgrammeSession } from '../session';
import { defaultProgrammeState } from '../serialize';
import { freshPatternLadderState } from '../promotion';
import type { ProgrammeState } from '../types';

const NOW = '2026-07-20T10:00:00.000Z';

function onboarded(overrides: Partial<ProgrammeState['profile']> = {}): ProgrammeState {
  const state = defaultProgrammeState();
  state.profile = { ...state.profile, consentHealthData: true, hasStairs: true, ...overrides };
  state.onboardingCompletedAtIso = '2026-07-06T09:00:00.000Z';
  return state;
}

describe('Check-up #0 scope (founder ruling: two protocols, gentle-first)', () => {
  it('is exactly balance then chair rise — never the full battery', () => {
    // Pinned to the literal protocol ids: the 45 s balance hold first,
    // the 30-SECOND chair rise (the honest T3 instrument) last.
    expect(CHECKUP_ZERO_PROTOCOL_SEQUENCE).toEqual(['one-leg-balance-45s-v2', 'chair-rise-30s-v2']);
    // The full battery's other movements are excluded by construction.
    for (const id of CHECKUP_ZERO_PROTOCOL_SEQUENCE) {
      expect(id).not.toMatch(/shoulder|hinge/);
    }
    expect(CHECKUP_ZERO_PROTOCOL_SEQUENCE).toHaveLength(2);
  });
});

describe('T1/T3 adapter (camera → placement inputs; T2 deferred)', () => {
  it('maps chair-rise reps + hand flags and the worse balance side', () => {
    const inputs = assessmentInputsFromV2Results({
      chairRise: { reps: 13, flags: ['hand-push-off-detected'] },
      balanceLeft: { bestHoldSec: 22 },
      balanceRight: { bestHoldSec: 8 },
    });
    expect(inputs.t3).toEqual({ reps: 13, handsUsed: true });
    expect(inputs.t1).toEqual({ worseSideSeconds: 8 });
  });

  it('handles missing items and absent hand detection', () => {
    const inputs = assessmentInputsFromV2Results({ chairRise: { reps: 9, flags: [] } });
    expect(inputs.t3).toEqual({ reps: 9, handsUsed: false });
    expect(inputs.t1).toBeUndefined();
    expect(assessmentInputsFromV2Results({})).toEqual({});
  });
});

describe('assessment re-offer (§8) and the B1 bypass (conformance Q1/Q2)', () => {
  it('B1-bypassed users see NO assessment surface until gp_confirmed', () => {
    const bypassed = onboarded({ gentleStartActive: true, assessmentStatus: 'bypassed_b1' });
    bypassed.completedSessionCount = 5;
    expect(assessmentReoffer(bypassed, NOW)).toBe('none');

    const confirmed = onboarded({
      gentleStartActive: true,
      gpConfirmed: true,
      assessmentStatus: 'bypassed_b1',
    });
    expect(assessmentReoffer(confirmed, NOW)).toBe('post_gp_reoffer');
  });

  it('deferred re-offers at the end of session 1 (never before)', () => {
    const deferred = onboarded({ assessmentStatus: 'deferred' });
    expect(assessmentReoffer(deferred, NOW)).toBe('none'); // 0 sessions
    deferred.completedSessionCount = 1;
    expect(assessmentReoffer(deferred, NOW)).toBe('deferred_reoffer');
  });

  it('skipped gets the warm re-offer at week 1 OR 2 sessions, whichever first; consent-declined never (§4)', () => {
    const skipped = onboarded({ assessmentStatus: 'skipped' });
    expect(assessmentReoffer(skipped, '2026-07-10T09:00:00.000Z')).toBe('none');
    expect(assessmentReoffer(skipped, NOW)).toBe('skipped_warm_reoffer'); // week elapsed

    const twoSessions = onboarded({ assessmentStatus: 'skipped' });
    twoSessions.completedSessionCount = 2;
    expect(assessmentReoffer(twoSessions, '2026-07-08T09:00:00.000Z')).toBe('skipped_warm_reoffer');

    const oneSession = onboarded({ assessmentStatus: 'skipped' });
    oneSession.completedSessionCount = 1;
    expect(assessmentReoffer(oneSession, '2026-07-08T09:00:00.000Z')).toBe('none');

    const declined = onboarded({ consentHealthData: false, assessmentStatus: 'skipped' });
    declined.completedSessionCount = 10;
    expect(assessmentReoffer(declined, NOW)).toBe('none');
  });
});

describe('in-context band question (Pull L4 unlock)', () => {
  it('fires only when a session features Pull L4+ and has_band is unanswered', () => {
    const state = onboarded();
    const l1Plan = generateProgrammeSession({ state, template: 'A', preset: 'standard' });
    expect(shouldAskBandQuestion(state, l1Plan)).toBe(false);

    state.ladders.pull = freshPatternLadderState('pull', 4);
    const l4Plan = generateProgrammeSession({ state, template: 'A', preset: 'standard' });
    expect(shouldAskBandQuestion(state, l4Plan)).toBe(true);

    const answered = recordBandAnswer(state, true);
    expect(answered.profile.hasBand).toBe(true);
    expect(shouldAskBandQuestion(answered, l4Plan)).toBe(false);
  });
});

describe('doming check + pelvic physio signpost (conformance Q3)', () => {
  it('shows at the first core-featuring session, routes to the diastasis branch, signposts exactly once', () => {
    const state = onboarded();
    const plan = generateProgrammeSession({ state, template: 'A', preset: 'standard' });
    expect(shouldShowDomingCheck(state, plan)).toBe(true);

    const { state: flagged, showPhysioSignpost } = recordDomingCheck(state, true);
    expect(flagged.profile.diastasisFlag).toBe(true);
    expect(showPhysioSignpost).toBe(true);

    // Never recurs: not the check, not the signpost.
    expect(shouldShowDomingCheck(flagged, plan)).toBe(false);
    const again = recordDomingCheck(flagged, true);
    expect(again.showPhysioSignpost).toBe(false);

    // Diastasis pre-arms the branch in generated sessions.
    const branchedPlan = generateProgrammeSession({ state: flagged, template: 'A', preset: 'standard' });
    expect(branchedPlan.activeBranches).toContain('diastasis');
  });

  it('a clear check is also once-only', () => {
    const state = onboarded();
    const { state: cleared, showPhysioSignpost } = recordDomingCheck(state, false);
    expect(showPhysioSignpost).toBe(false);
    expect(cleared.profile.diastasisFlag).toBe(false);
    const plan = generateProgrammeSession({ state: cleared, template: 'A', preset: 'standard' });
    expect(shouldShowDomingCheck(cleared, plan)).toBe(false);
  });
});
