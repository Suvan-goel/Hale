import {
  applyCheckupPlacement,
  applyInactivityRegressionIfDue,
  crossLadderPrereqMet,
  evaluatePatternOutcome,
  freshPatternLadderState,
  isGatewayComplete,
  recordGatewayDemoWatched,
  recordGatewaySelfConfirmation,
  recordRehearsalExposure,
} from '../promotion';
import { defaultProgrammeState } from '../serialize';
import {
  DEFAULT_REQUIRED_REHEARSAL_EXPOSURES,
  getProgrammeLevel,
  HINGE_REHEARSAL_DRILL_ID,
  PROGRAMME_LADDERS,
} from '../ladders';
import type {
  EffortAnswer,
  PatternLadderState,
  PatternSessionOutcome,
  ProgrammePattern,
} from '../types';

function outcome(input: {
  pattern: ProgrammePattern;
  level: number;
  sets: number[];
  effort?: EffortAnswer | null;
  pain?: boolean;
  at?: string;
}): PatternSessionOutcome {
  return {
    pattern: input.pattern,
    levelPerformed: input.level,
    sets: input.sets.map((achieved) => ({ achieved })),
    effort: input.effort === undefined ? 'a_few' : input.effort,
    painFlag: input.pain ?? false,
    performedAtIso: input.at ?? '2026-07-06T10:00:00.000Z',
  };
}

function statesAt(levels: Partial<Record<ProgrammePattern, number>>) {
  const out = {} as Record<ProgrammePattern, PatternLadderState>;
  for (const pattern of Object.keys(PROGRAMME_LADDERS) as ProgrammePattern[]) {
    out[pattern] = freshPatternLadderState(pattern, levels[pattern] ?? 1);
  }
  return out;
}

describe('standard promotion', () => {
  it('promotes after top-of-range on 2 consecutive sessions with effort a_few', () => {
    const all = statesAt({ squat: 3 }); // L3: 2 × 8–15, not entry
    const first = evaluatePatternOutcome(
      all.squat,
      outcome({ pattern: 'squat', level: 3, sets: [15, 15], effort: 'a_few' }),
      all
    );
    expect(first.decision).toEqual({ kind: 'hold' });
    expect(first.nextState.consecutiveTopSessions).toBe(1);

    const second = evaluatePatternOutcome(
      first.nextState,
      outcome({ pattern: 'squat', level: 3, sets: [15, 15], effort: 'a_few' }),
      { ...all, squat: first.nextState }
    );
    expect(second.decision).toEqual({ kind: 'promote', toLevel: 4, reason: 'standard' });
    expect(second.nextState.currentLevel).toBe(4);
    expect(second.nextState.consecutiveTopSessions).toBe(0);
  });

  it('accepts effort none at top of range (spec: {none, a_few})', () => {
    const all = statesAt({ squat: 3 });
    const first = evaluatePatternOutcome(
      all.squat,
      outcome({ pattern: 'squat', level: 3, sets: [15, 15], effort: 'none' }),
      all
    );
    const second = evaluatePatternOutcome(
      first.nextState,
      outcome({ pattern: 'squat', level: 3, sets: [15, 15], effort: 'none' }),
      { ...all, squat: first.nextState }
    );
    expect(second.decision).toEqual({ kind: 'promote', toLevel: 4, reason: 'standard' });
  });

  it('does not promote on one top session, on a broken streak, or with a missing set', () => {
    const all = statesAt({ squat: 3 });
    const top = evaluatePatternOutcome(
      all.squat,
      outcome({ pattern: 'squat', level: 3, sets: [15, 15] }),
      all
    );
    expect(top.decision).toEqual({ kind: 'hold' });

    // Streak broken by a mid-range session.
    const broken = evaluatePatternOutcome(
      top.nextState,
      outcome({ pattern: 'squat', level: 3, sets: [12, 12] }),
      { ...all, squat: top.nextState }
    );
    expect(broken.decision).toEqual({ kind: 'hold' });
    expect(broken.nextState.consecutiveTopSessions).toBe(0);

    // Only one of two prescribed sets is not "all sets".
    const short = evaluatePatternOutcome(
      all.squat,
      outcome({ pattern: 'squat', level: 3, sets: [15] }),
      all
    );
    expect(short.nextState.consecutiveTopSessions).toBe(0);
  });

  it('treats unanswered effort conservatively: never standard/fast promotes', () => {
    const all = statesAt({ squat: 3 });
    let state = all.squat;
    for (let session = 0; session < 3; session++) {
      const result = evaluatePatternOutcome(
        state,
        outcome({ pattern: 'squat', level: 3, sets: [15, 15], effort: null }),
        { ...all, squat: state }
      );
      expect(result.decision).toEqual({ kind: 'hold' });
      state = result.nextState;
    }
  });

  it('blocks standard promotion when the previous session had a pain flag', () => {
    const all = statesAt({ squat: 4 });
    // Pain at L4 regresses to L3.
    const pain = evaluatePatternOutcome(
      all.squat,
      outcome({ pattern: 'squat', level: 4, sets: [10, 10], pain: true }),
      all
    );
    expect(pain.decision).toEqual({ kind: 'regress', toLevel: 3, reason: 'pain' });

    // First clean top session after pain: streak is only 1, holds.
    const s1 = evaluatePatternOutcome(
      pain.nextState,
      outcome({ pattern: 'squat', level: 3, sets: [15, 15] }),
      { ...all, squat: pain.nextState }
    );
    expect(s1.decision).toEqual({ kind: 'hold' });

    // Second clean top session: last two sessions are pain-free → promotes.
    const s2 = evaluatePatternOutcome(
      s1.nextState,
      outcome({ pattern: 'squat', level: 3, sets: [15, 15] }),
      { ...all, squat: s1.nextState }
    );
    expect(s2.decision).toEqual({ kind: 'promote', toLevel: 4, reason: 'standard' });
  });
});

describe('fast promotion', () => {
  it('promotes after ONE top-of-range session when effort is lots', () => {
    const all = statesAt({ squat: 3 });
    const result = evaluatePatternOutcome(
      all.squat,
      outcome({ pattern: 'squat', level: 3, sets: [15, 15], effort: 'lots' }),
      all
    );
    expect(result.decision).toEqual({ kind: 'promote', toLevel: 4, reason: 'fast' });
  });

  it('does not fast-promote below top of range', () => {
    const all = statesAt({ squat: 3 });
    const result = evaluatePatternOutcome(
      all.squat,
      outcome({ pattern: 'squat', level: 3, sets: [14, 15], effort: 'lots' }),
      all
    );
    expect(result.decision).toEqual({ kind: 'hold' });
  });
});

describe('entry promotion', () => {
  it('promotes entry levels after ONE session at top of range', () => {
    const all = statesAt({ squat: 1 }); // L1: 2 × 10–20, entry
    const result = evaluatePatternOutcome(
      all.squat,
      outcome({ pattern: 'squat', level: 1, sets: [20, 20], effort: 'a_few' }),
      all
    );
    expect(result.decision).toEqual({ kind: 'promote', toLevel: 2, reason: 'entry' });
  });

  it('blocks entry promotion on unanswered effort — the deliberate stricter-than-§12 amendment', () => {
    const all = statesAt({ push: 2 }); // L2 entry: 2 × 8–15
    const unanswered = evaluatePatternOutcome(
      all.push,
      outcome({ pattern: 'push', level: 2, sets: [15, 15], effort: null }),
      all
    );
    expect(unanswered.decision).toEqual({ kind: 'hold' });

    // Any actual answer (even 'none') lets the entry rule fire.
    const answered = evaluatePatternOutcome(
      all.push,
      outcome({ pattern: 'push', level: 2, sets: [15, 15], effort: 'none' }),
      all
    );
    expect(answered.decision).toEqual({ kind: 'promote', toLevel: 3, reason: 'entry' });
  });
});

describe('pain regression', () => {
  it('regresses to the last pain-free level', () => {
    const all = statesAt({ hinge: 3 });
    const painFree = evaluatePatternOutcome(
      all.hinge,
      outcome({ pattern: 'hinge', level: 3, sets: [8, 8] }),
      all
    );
    // Promote-by-hand to L6 to simulate history, then pain.
    const atSix: PatternLadderState = { ...painFree.nextState, currentLevel: 6 };
    const pain = evaluatePatternOutcome(
      atSix,
      outcome({ pattern: 'hinge', level: 6, sets: [8, 8], pain: true }),
      { ...all, hinge: atSix }
    );
    expect(pain.decision).toEqual({ kind: 'regress', toLevel: 3, reason: 'pain' });
    expect(pain.nextState.currentLevel).toBe(3);
    expect(pain.nextState.consecutiveTopSessions).toBe(0);
  });

  it('falls back to one level down with no pain-free history, flooring at 1', () => {
    const all = statesAt({ core: 2 });
    const pain = evaluatePatternOutcome(
      all.core,
      outcome({ pattern: 'core', level: 2, sets: [6, 6], pain: true }),
      all
    );
    expect(pain.decision).toEqual({ kind: 'regress', toLevel: 1, reason: 'pain' });

    const allAtFloor = statesAt({ core: 1 });
    const painAtFloor = evaluatePatternOutcome(
      allAtFloor.core,
      outcome({ pattern: 'core', level: 1, sets: [8, 8], pain: true }),
      allAtFloor
    );
    expect(painAtFloor.decision).toEqual({ kind: 'regress', toLevel: 1, reason: 'pain' });
  });
});

describe('hold + reduce', () => {
  it('suspends the bonus set after effort none at the bottom of the range twice in a row', () => {
    const all = statesAt({ squat: 3 }); // bottom = 8
    const first = evaluatePatternOutcome(
      all.squat,
      outcome({ pattern: 'squat', level: 3, sets: [8, 8], effort: 'none' }),
      all
    );
    expect(first.decision).toEqual({ kind: 'hold' });
    expect(first.nextState.bonusSetSuspended).toBe(false);

    const second = evaluatePatternOutcome(
      first.nextState,
      outcome({ pattern: 'squat', level: 3, sets: [8, 7], effort: 'none' }),
      { ...all, squat: first.nextState }
    );
    expect(second.decision).toEqual({ kind: 'hold_reduce' });
    expect(second.nextState.bonusSetSuspended).toBe(true);
    expect(second.nextState.currentLevel).toBe(3);
  });

  it('lifts the suspension once the top of the range is rebuilt', () => {
    const all = statesAt({ squat: 3 });
    const suspended: PatternLadderState = { ...all.squat, bonusSetSuspended: true };
    const rebuilt = evaluatePatternOutcome(
      suspended,
      outcome({ pattern: 'squat', level: 3, sets: [15, 15] }),
      { ...all, squat: suspended }
    );
    expect(rebuilt.nextState.bonusSetSuspended).toBe(false);
  });

  it('does not fire on bottom-of-range with effort a_few', () => {
    const all = statesAt({ squat: 3 });
    let state = all.squat;
    for (let session = 0; session < 3; session++) {
      const result = evaluatePatternOutcome(
        state,
        outcome({ pattern: 'squat', level: 3, sets: [8, 8], effort: 'a_few' }),
        { ...all, squat: state }
      );
      expect(result.decision).toEqual({ kind: 'hold' });
      state = result.nextState;
    }
  });
});

describe('teach-only gateways (C3 ruling)', () => {
  it('locks promotion into Hinge L5 until demo + rehearsals + self-confirmation', () => {
    const all = statesAt({ hinge: 4 }); // L4: 2 × 6–10 per side; L5 is the gateway
    const first = evaluatePatternOutcome(
      all.hinge,
      outcome({ pattern: 'hinge', level: 4, sets: [10, 10] }),
      all
    );
    const second = evaluatePatternOutcome(
      first.nextState,
      outcome({ pattern: 'hinge', level: 4, sets: [10, 10] }),
      { ...all, hinge: first.nextState }
    );
    expect(second.decision).toEqual({
      kind: 'promotion_locked',
      toLevel: 5,
      reason: 'gateway_incomplete',
    });
    // The earned streak is not thrown away while locked.
    expect(second.nextState.consecutiveTopSessions).toBe(2);

    // Teach-only completion: demo, rehearsals (accrued in movement prep), confirm.
    let state = recordGatewayDemoWatched(second.nextState, 5);
    for (let i = 0; i < DEFAULT_REQUIRED_REHEARSAL_EXPOSURES; i++) {
      state = recordRehearsalExposure(state, HINGE_REHEARSAL_DRILL_ID);
    }
    state = recordGatewaySelfConfirmation(state, 5);
    expect(isGatewayComplete(state, getProgrammeLevel('hinge', 5))).toBe(true);

    const third = evaluatePatternOutcome(
      state,
      outcome({ pattern: 'hinge', level: 4, sets: [10, 10] }),
      { ...all, hinge: state }
    );
    expect(third.decision).toEqual({ kind: 'promote', toLevel: 5, reason: 'standard' });
  });

  it('remains locked with rehearsals but no self-confirmation (and vice versa)', () => {
    const base = statesAt({ hinge: 4 }).hinge;
    let rehearsedOnly = recordGatewayDemoWatched(base, 5);
    for (let i = 0; i < DEFAULT_REQUIRED_REHEARSAL_EXPOSURES; i++) {
      rehearsedOnly = recordRehearsalExposure(rehearsedOnly, HINGE_REHEARSAL_DRILL_ID);
    }
    expect(isGatewayComplete(rehearsedOnly, getProgrammeLevel('hinge', 5))).toBe(false);

    let confirmedOnly = recordGatewayDemoWatched(base, 5);
    confirmedOnly = recordGatewaySelfConfirmation(confirmedOnly, 5);
    expect(isGatewayComplete(confirmedOnly, getProgrammeLevel('hinge', 5))).toBe(false);
  });

  it('Squat L8 gateway needs only demo + self-confirmation (no rehearsal drill exists)', () => {
    const all = statesAt({ squat: 7 });
    const locked = evaluatePatternOutcome(
      { ...all.squat, consecutiveTopSessions: 1 },
      outcome({ pattern: 'squat', level: 7, sets: [10, 10] }),
      all
    );
    expect(locked.decision).toEqual({
      kind: 'promotion_locked',
      toLevel: 8,
      reason: 'gateway_incomplete',
    });

    let state = recordGatewayDemoWatched(locked.nextState, 8);
    state = recordGatewaySelfConfirmation(state, 8);
    const promoted = evaluatePatternOutcome(
      state,
      outcome({ pattern: 'squat', level: 7, sets: [10, 10] }),
      { ...all, squat: state }
    );
    expect(promoted.decision).toEqual({ kind: 'promote', toLevel: 8, reason: 'standard' });
  });

  it('rehearsal exposures accrue from day one, long before the gateway', () => {
    let state = freshPatternLadderState('hinge', 1);
    state = recordRehearsalExposure(state, HINGE_REHEARSAL_DRILL_ID);
    state = recordRehearsalExposure(state, HINGE_REHEARSAL_DRILL_ID);
    expect(state.gatewayProgress[5]?.rehearsalExposures).toBe(2);
  });
});

describe('cross-ladder prerequisite (Pull L8 ⇐ Hinge L5 taught)', () => {
  function pullAtTopOfL7(hinge: PatternLadderState) {
    const all = statesAt({ pull: 7 });
    all.hinge = hinge;
    all.pull = { ...all.pull, consecutiveTopSessions: 1 };
    return all;
  }

  it('locks Pull L8 while the hinge is below L5', () => {
    const all = pullAtTopOfL7(freshPatternLadderState('hinge', 4));
    const result = evaluatePatternOutcome(
      all.pull,
      outcome({ pattern: 'pull', level: 7, sets: [15, 15] }),
      all
    );
    expect(result.decision).toEqual({
      kind: 'promotion_locked',
      toLevel: 8,
      reason: 'cross_ladder_prereq_unmet',
    });
  });

  it('locks Pull L8 at Hinge L5 with an incomplete gateway; unlocks once taught', () => {
    const atFiveUntaught = freshPatternLadderState('hinge', 5);
    expect(crossLadderPrereqMet(getProgrammeLevel('pull', 8), pullAtTopOfL7(atFiveUntaught))).toBe(
      false
    );

    let taught = recordGatewayDemoWatched(atFiveUntaught, 5);
    for (let i = 0; i < DEFAULT_REQUIRED_REHEARSAL_EXPOSURES; i++) {
      taught = recordRehearsalExposure(taught, HINGE_REHEARSAL_DRILL_ID);
    }
    taught = recordGatewaySelfConfirmation(taught, 5);
    const all = pullAtTopOfL7(taught);
    const result = evaluatePatternOutcome(
      all.pull,
      outcome({ pattern: 'pull', level: 7, sets: [15, 15] }),
      all
    );
    expect(result.decision).toEqual({ kind: 'promote', toLevel: 8, reason: 'standard' });
  });

  it('treats a hinge already beyond L5 as taught', () => {
    expect(
      crossLadderPrereqMet(
        getProgrammeLevel('pull', 8),
        pullAtTopOfL7(freshPatternLadderState('hinge', 6))
      )
    ).toBe(true);
  });
});

describe('session bookkeeping', () => {
  it('a session at another level carries pain/recency but never feeds counters', () => {
    const all = statesAt({ squat: 4 });
    const primed: PatternLadderState = { ...all.squat, consecutiveTopSessions: 1 };
    const result = evaluatePatternOutcome(
      primed,
      outcome({ pattern: 'squat', level: 3, sets: [15, 15], at: '2026-07-06T09:00:00.000Z' }),
      { ...all, squat: primed }
    );
    expect(result.decision).toEqual({ kind: 'not_applicable', reason: 'level_mismatch' });
    expect(result.nextState.consecutiveTopSessions).toBe(1);
    expect(result.nextState.lastPerformedAtIso).toBe('2026-07-06T09:00:00.000Z');
    expect(result.nextState.lastPainFreeLevel).toBe(3);
  });

  it('holds at the top of the ladder (progression beyond is load, not levels)', () => {
    const all = statesAt({ squat: 9 });
    const result = evaluatePatternOutcome(
      all.squat,
      outcome({ pattern: 'squat', level: 9, sets: [10, 10], effort: 'lots' }),
      all
    );
    expect(result.decision).toEqual({ kind: 'hold' });
  });

  it('promotions are single-step by construction', () => {
    const all = statesAt({ push: 1 });
    const result = evaluatePatternOutcome(
      all.push,
      outcome({ pattern: 'push', level: 1, sets: [20, 20], effort: 'lots' }),
      all
    );
    expect(result.decision).toEqual({ kind: 'promote', toLevel: 2, reason: 'entry' });
  });
});

describe('inactivity regression (14+ days)', () => {
  function stateWithLevels(levels: Partial<Record<ProgrammePattern, number>>, lastSessionAtIso: string) {
    const state = defaultProgrammeState();
    for (const [pattern, level] of Object.entries(levels) as [ProgrammePattern, number][]) {
      state.ladders[pattern] = freshPatternLadderState(pattern, level);
    }
    return { ...state, lastSessionAtIso };
  }

  it('drops one level on every ladder after 14+ days, flooring at 1', () => {
    const state = stateWithLevels({ squat: 5, hinge: 1, push: 3 }, '2026-06-20T10:00:00.000Z');
    const { state: next, applied } = applyInactivityRegressionIfDue(state, '2026-07-06T10:00:00.000Z');
    expect(applied).toBe(true);
    expect(next.ladders.squat.currentLevel).toBe(4);
    expect(next.ladders.hinge.currentLevel).toBe(1);
    expect(next.ladders.push.currentLevel).toBe(2);
    expect(next.ladders.pull.currentLevel).toBe(1);
  });

  it('applies at most once per inactivity gap', () => {
    const state = stateWithLevels({ squat: 5 }, '2026-06-20T10:00:00.000Z');
    const first = applyInactivityRegressionIfDue(state, '2026-07-06T10:00:00.000Z');
    const second = applyInactivityRegressionIfDue(first.state, '2026-07-07T10:00:00.000Z');
    expect(second.applied).toBe(false);
    expect(second.state.ladders.squat.currentLevel).toBe(4);
  });

  it('is a no-op under 14 days or with no session history', () => {
    const recent = stateWithLevels({ squat: 5 }, '2026-06-25T10:00:00.000Z');
    expect(applyInactivityRegressionIfDue(recent, '2026-07-06T10:00:00.000Z').applied).toBe(false);

    const fresh = { ...defaultProgrammeState(), lastSessionAtIso: null };
    expect(applyInactivityRegressionIfDue(fresh, '2026-07-06T10:00:00.000Z').applied).toBe(false);
  });
});

describe('check-up re-placement (the measured reconciliation point, C10)', () => {
  it('deferred-assessment completion moves levels upward only', () => {
    const state = defaultProgrammeState();
    state.ladders.squat = freshPatternLadderState('squat', 3);
    state.ladders.push = freshPatternLadderState('push', 1);
    const next = applyCheckupPlacement(state, { squat: 2, push: 2 }, { upwardOnly: true });
    expect(next.ladders.squat.currentLevel).toBe(3); // never lowered
    expect(next.ladders.push.currentLevel).toBe(2);
  });

  it('check-ups reconcile in both directions and may jump multiple levels', () => {
    const state = defaultProgrammeState();
    state.ladders.squat = freshPatternLadderState('squat', 6);
    const next = applyCheckupPlacement(state, { squat: 3 }, { upwardOnly: false });
    expect(next.ladders.squat.currentLevel).toBe(3);
    expect(next.ladders.squat.consecutiveTopSessions).toBe(0);

    const up = applyCheckupPlacement(next, { squat: 7 }, { upwardOnly: false });
    expect(up.ladders.squat.currentLevel).toBe(7);
  });

  it('clamps placement to ladder bounds', () => {
    const state = defaultProgrammeState();
    const next = applyCheckupPlacement(state, { squat: 99 }, { upwardOnly: false });
    expect(next.ladders.squat.currentLevel).toBe(9);
  });
});
