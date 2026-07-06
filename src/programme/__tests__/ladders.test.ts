import {
  ADAPTATION_BRANCHES,
  allProgrammeExercises,
  DEFAULT_REQUIRED_REHEARSAL_EXPOSURES,
  getProgrammeLevel,
  HINGE_REHEARSAL_DRILL_ID,
  PROGRAMME_LADDERS,
  QUIET_FINISHER_ITEMS,
} from '../ladders';
import { allProgrammeDisplayNames, hasProgrammeDisplayName, programmeDisplayName } from '../naming';
import { PROGRAMME_PATTERNS, type ProgrammePattern } from '../types';

const EXPECTED_LEVEL_COUNTS: Record<ProgrammePattern, number> = {
  squat: 9,
  hinge: 8,
  push: 8,
  pull: 8,
  core: 8,
};

describe('ladder structure (spec tables §3–§7)', () => {
  it('has the spec level counts with contiguous 1-based numbering', () => {
    for (const pattern of PROGRAMME_PATTERNS) {
      const levels = PROGRAMME_LADDERS[pattern].levels;
      expect(levels).toHaveLength(EXPECTED_LEVEL_COUNTS[pattern]);
      levels.forEach((level, index) => {
        expect(level.level).toBe(index + 1);
        expect(level.pattern).toBe(pattern);
      });
    }
  });

  it('marks exactly L1–L2 as entry levels on every ladder (spec §1)', () => {
    for (const pattern of PROGRAMME_PATTERNS) {
      for (const level of PROGRAMME_LADDERS[pattern].levels) {
        expect(level.isEntryLevel).toBe(level.level <= 2);
      }
    }
  });

  it('defaults every level to 2 hard working sets (spec §1)', () => {
    for (const pattern of PROGRAMME_PATTERNS) {
      for (const level of PROGRAMME_LADDERS[pattern].levels) {
        expect(level.sets).toBe(2);
      }
    }
  });

  it('places gateways exactly at Squat L8/L9 and Hinge L5, teach-only', () => {
    const gateways: [ProgrammePattern, number][] = [];
    for (const pattern of PROGRAMME_PATTERNS) {
      for (const level of PROGRAMME_LADDERS[pattern].levels) {
        if (level.gateway) gateways.push([pattern, level.level]);
      }
    }
    expect(gateways.sort()).toEqual([
      ['hinge', 5],
      ['squat', 8],
      ['squat', 9],
    ]);

    const hingeGate = getProgrammeLevel('hinge', 5).gateway;
    expect(hingeGate?.rehearsalDrillId).toBe(HINGE_REHEARSAL_DRILL_ID);
    expect(hingeGate?.requiredRehearsalExposures).toBe(DEFAULT_REQUIRED_REHEARSAL_EXPOSURES);
    // No rehearsal drill exists for split squats: demo + confirmation only.
    expect(getProgrammeLevel('squat', 8).gateway?.requiredRehearsalExposures).toBe(0);
    expect(getProgrammeLevel('squat', 9).gateway?.requiredRehearsalExposures).toBe(0);
  });

  it('has exactly one cross-ladder prerequisite: Pull L8 ⇐ Hinge L5', () => {
    const prereqs: string[] = [];
    for (const pattern of PROGRAMME_PATTERNS) {
      for (const level of PROGRAMME_LADDERS[pattern].levels) {
        if (level.crossLadderPrereq) {
          prereqs.push(
            `${pattern}:${level.level}->${level.crossLadderPrereq.pattern}:${level.crossLadderPrereq.level}`
          );
        }
      }
    }
    expect(prereqs).toEqual(['pull:8->hinge:5']);
  });

  it('cues power intent from Squat L3 and Hinge L5 onward (spec §1)', () => {
    for (const level of PROGRAMME_LADDERS.squat.levels) {
      expect(!!level.powerIntentCue).toBe(level.level >= 3);
    }
    for (const level of PROGRAMME_LADDERS.hinge.levels) {
      expect(!!level.powerIntentCue).toBe(level.level >= 5);
    }
  });

  it('matches the spec prescriptions on spot-checked levels', () => {
    expect(getProgrammeLevel('squat', 5).scheme).toEqual({ kind: 'reps_per_side', min: 6, max: 10 });
    expect(getProgrammeLevel('hinge', 8).scheme).toEqual({ kind: 'reps_per_side', min: 8, max: 12 });
    expect(getProgrammeLevel('push', 6).scheme).toEqual({ kind: 'reps', min: 5, max: 10 });
    expect(getProgrammeLevel('pull', 4).scheme).toEqual({ kind: 'reps', min: 10, max: 20 });
    expect(getProgrammeLevel('core', 5).scheme).toEqual({ kind: 'seconds', min: 20, max: 45 });
  });

  it('strictly volume-caps the lower-only press-up (spec §5 soreness warning)', () => {
    const level5 = getProgrammeLevel('push', 5);
    expect(level5.occasionalVariation?.id).toBe('push.lower_only_push_up');
    expect(level5.occasionalVariation?.volumeCap).toEqual({ sets: 2, reps: 5 });
  });

  it('gives every stairs-dependent exercise a no-stairs alternative (onboarding C1)', () => {
    for (const exercise of allProgrammeExercises()) {
      if (exercise.requiresStairs) {
        expect(typeof exercise.noStairsAlternativeId).toBe('string');
        expect(hasProgrammeDisplayName(exercise.noStairsAlternativeId as string)).toBe(true);
      }
    }
  });
});

describe('core ladder: anti-extension / anti-rotation / carries only (spec §7)', () => {
  it('assigns every core level an allowed stimulus — spinal flexion is unrepresentable', () => {
    const allowed = ['anti_extension', 'anti_rotation', 'anti_lateral_flexion', 'loaded_carry'];
    for (const level of PROGRAMME_LADDERS.core.levels) {
      expect(allowed).toContain(level.coreStimulus);
    }
  });
});

describe('programme-wide guardrails', () => {
  // Non-negotiable: no spinal-flexion exercise can ever exist in the
  // programme. Structural exclusion is above; this string scan catches a
  // renamed or smuggled entry in ids, names, or alternatives.
  const FLEXION_BANNED =
    /crunch|sit[-_ ]?ups?\b|curl[-_ ]?up|jack[-_ ]?knife|v[-_ ]sit|v[-_ ]up|russian[-_ ]twist|toe[-_ ]touch/i;

  it('never names or ids a spinal-flexion exercise anywhere', () => {
    for (const exercise of allProgrammeExercises()) {
      expect(exercise.id).not.toMatch(FLEXION_BANNED);
    }
    for (const item of QUIET_FINISHER_ITEMS) {
      expect(item.id).not.toMatch(FLEXION_BANNED);
    }
    for (const [, name] of allProgrammeDisplayNames()) {
      expect(name).not.toMatch(FLEXION_BANNED);
    }
  });

  // Naming rule (spec §1): user-facing names in plain language, never gym
  // jargon. Internal ids may stay technical.
  const JARGON_BANNED =
    /\brdl\b|\brfess\b|eccentric|concentric|isometric|romanian|bulgarian|unilateral|bilateral|scapular|\bprone\b|pallof|good morning|\brir\b|hypertrophy/i;

  it('keeps every display name jargon-free', () => {
    for (const [id, name] of allProgrammeDisplayNames()) {
      expect({ id, name: name.match(JARGON_BANNED)?.[0] ?? name }).toEqual({ id, name });
      expect(name).not.toMatch(JARGON_BANNED);
    }
  });

  it('registers a display name for every reachable exercise, alternative, drill, and finisher item', () => {
    for (const exercise of allProgrammeExercises()) {
      expect(() => programmeDisplayName(exercise.id)).not.toThrow();
    }
    for (const item of QUIET_FINISHER_ITEMS) {
      expect(() => programmeDisplayName(item.id)).not.toThrow();
    }
    expect(() => programmeDisplayName(HINGE_REHEARSAL_DRILL_ID)).not.toThrow();
    expect(() => programmeDisplayName('nonexistent.exercise')).toThrow();
  });
});

describe('quiet finisher track (universal v1 finisher, C1/C2 package deferral)', () => {
  it('contains only quiet_power items, ordered, with stomps as the only quiet-skip', () => {
    expect(QUIET_FINISHER_ITEMS).toHaveLength(6);
    QUIET_FINISHER_ITEMS.forEach((item, index) => {
      expect(item.track).toBe('quiet_power');
      expect(item.order).toBe(index + 1);
    });
    const quietSkips = QUIET_FINISHER_ITEMS.filter((i) => i.skipOnQuietRouting).map((i) => i.id);
    expect(quietSkips).toEqual(['finisher.moderate_stomps']);
  });

  it('keeps contact doses inside the 20–50 budget and stairs items substitutable', () => {
    for (const item of QUIET_FINISHER_ITEMS) {
      if (item.dose.kind === 'contacts') {
        expect(item.dose.min).toBeGreaterThanOrEqual(20);
        expect(item.dose.max).toBeLessThanOrEqual(50);
      }
      if (item.requiresStairs) {
        const alternative = QUIET_FINISHER_ITEMS.find((i) => i.id === item.noStairsAlternativeId);
        expect(alternative).toBeDefined();
        expect(alternative?.requiresStairs).toBeFalsy();
      }
    }
  });
});

describe('adaptation branches (spec §10; osteoporosis branch deferred with B2)', () => {
  it('ships the five v1 branches with trigger patterns', () => {
    expect(ADAPTATION_BRANCHES.map((b) => b.id).sort()).toEqual([
      'balance_limited',
      'diastasis',
      'knee_sensitive',
      'shoulder_sensitive',
      'wrist_sensitive',
    ]);
    for (const branch of ADAPTATION_BRANCHES) {
      expect(branch.triggerPatterns.length).toBeGreaterThan(0);
      expect(branch.modifications.length).toBeGreaterThan(0);
    }
  });
});
