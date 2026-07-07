/**
 * Bridge data-plane tests: plan → voice-player inputs, and a REAL voice
 * session (the actual TrainingSessionPlayer in voice mode, driven through
 * VoiceSessionController with the injected catalogue seams — no registry)
 * mapped back into ProgrammeSessionResults with reported-only semantics.
 */

import type { HistoryFs } from '../../history/store';
import { SessionFunnelStore } from '../../telemetry/sessionFunnelStore';
import type { TrainingSessionResult } from '../../training/sessionPlayer';
import { VoiceSessionController } from '../../voice/voiceSessionController';
import { defaultProgrammeState } from '../serialize';
import { generateProgrammeSession, type ProgrammeSessionPlan } from '../session';
import type { ProgrammeState } from '../types';
import { PROGRAMME_PREP_ITEM_ID } from '../voiceCatalog';
import { programmeResultsFromVoiceSession, voiceSessionInputsFromPlan } from '../voiceSession';

function onboardedState(overrides: Partial<ProgrammeState['profile']> = {}): ProgrammeState {
  const state = defaultProgrammeState();
  state.profile = { ...state.profile, consentHealthData: true, hasStairs: true, ...overrides };
  state.onboardingCompletedAtIso = '2026-07-06T09:00:00.000Z';
  return state;
}

function memoryFunnelStore(): SessionFunnelStore {
  const files = new Map<string, string>();
  return new SessionFunnelStore({
    list: () => [...files.keys()],
    read: async (name: string) => files.get(name) ?? null,
    write: (name: string, contents: string) => {
      files.set(name, contents);
    },
  } as unknown as HistoryFs);
}

interface RunOptions {
  /** exerciseIds to end via pain instead of done. */
  painOn?: ReadonlySet<string>;
  /** exerciseIds to skip outright at the ready prompt. */
  skipOn?: ReadonlySet<string>;
  /** ±rep adjustment applied right after completing this exercise's last set. */
  adjustAfter?: Map<string, number>;
}

/** Drives a full voice session through the real player; returns its result. */
function runVoiceSession(plan: ProgrammeSessionPlan, options: RunOptions = {}): TrainingSessionResult {
  const inputs = voiceSessionInputsFromPlan(plan);
  const results: TrainingSessionResult[] = [];
  const controller = new VoiceSessionController({
    startedAtIso: '2026-07-06T09:00:00.000Z',
    exerciseIds: inputs.exerciseIds,
    generatedExercises: inputs.generatedExercises,
    resolveExercise: inputs.resolveExercise,
    resolveSafetyProfile: inputs.resolveSafetyProfile,
    funnelStore: memoryFunnelStore(),
    onComplete: (result) => results.push(result),
    nowIso: () => '2026-07-06T09:40:00.000Z',
  });

  let ts = 0;
  let voiceBusyUntil = -1;
  const tick = () => {
    ts += 250;
    const update = controller.tick(ts, ts < voiceBusyUntil);
    if (update.voice) voiceBusyUntil = ts + update.voice.cues.length * 1200;
    return update;
  };
  const tickUntil = (pred: (u: ReturnType<typeof tick>) => boolean) => {
    const deadline = ts + 60 * 60 * 1000;
    let update = tick();
    while (!pred(update) && ts < deadline) update = tick();
    if (!pred(update)) throw new Error(`tickUntil timeout in phase ${update.phase}`);
    return update;
  };

  let guard = 0;
  while (results.length === 0 && guard++ < 200) {
    const update = tickUntil(
      (u) =>
        u.phase === 'done' ||
        (u.phase === 'waiting_ready' && ts >= voiceBusyUntil) ||
        u.phase === 'set' ||
        u.phase === 'rest'
    );
    if (update.phase === 'done') break;
    const id = update.currentExerciseId ?? '';
    if (update.phase === 'waiting_ready') {
      if (options.skipOn?.has(id)) controller.handleTap('skip', ts);
      else controller.handleTap('ready', ts);
    } else if (update.phase === 'set') {
      ts += 4000;
      if (options.painOn?.has(id)) {
        controller.handleTap('pain', ts);
      } else {
        const lastSet = update.setIndex + 1 >= update.totalSets;
        controller.handleTap('done', ts);
        const adjust = options.adjustAfter?.get(id);
        if (lastSet && adjust) {
          for (let i = 0; i < Math.abs(adjust); i++) {
            controller.handleTap(adjust > 0 ? 'adjust_reps_up' : 'adjust_reps_down', ts);
          }
        }
      }
    } else if (update.phase === 'rest') {
      controller.handleTap('skip_rest', ts);
    }
  }
  tickUntil((u) => u.phase === 'done');
  expect(results).toHaveLength(1);
  return results[0];
}

describe('plan → voice-player inputs', () => {
  it('orders warm-up → main → finisher and doses every item from the plan', () => {
    const plan = generateProgrammeSession({ state: onboardedState(), template: 'A', preset: 'standard' });
    const inputs = voiceSessionInputsFromPlan(plan);

    expect(inputs.exerciseIds[0]).toBe(PROGRAMME_PREP_ITEM_ID);
    expect(inputs.exerciseIds.slice(1, 1 + plan.main.length)).toEqual(
      plan.main.map((exercise) => exercise.exerciseId)
    );
    expect(inputs.exerciseIds.slice(1 + plan.main.length)).toEqual(plan.finisher.map((f) => f.id));

    const doseById = new Map(inputs.generatedExercises.map((dose) => [dose.exerciseId, dose]));
    expect(doseById.get(PROGRAMME_PREP_ITEM_ID)?.secondsPerSet).toBe(plan.prep.minutes * 60);
    for (const exercise of plan.main) {
      const dose = doseById.get(exercise.exerciseId)!;
      expect(dose.sets).toBe(exercise.sets);
      expect(dose.restSeconds).toBe(exercise.restSec);
      if (exercise.scheme.kind === 'reps' || exercise.scheme.kind === 'reps_per_side') {
        expect(dose.repsPerSet).toBe(exercise.repTargetPerSet);
      } else if (exercise.scheme.kind === 'seconds') {
        expect(dose.secondsPerSet).toBe(exercise.repTargetPerSet);
      } else {
        // Per-side window: both sides + the swap buffer.
        expect(dose.secondsPerSet).toBe(exercise.repTargetPerSet * 2 + 10);
      }
    }
  });

  it('every id in a no-stairs plan still resolves through the catalogue seam', () => {
    const plan = generateProgrammeSession({
      state: onboardedState({ hasStairs: false }),
      template: 'A',
      preset: 'standard',
    });
    const inputs = voiceSessionInputsFromPlan(plan);
    for (const id of inputs.exerciseIds) {
      expect(inputs.resolveExercise(id).id).toBe(id);
      expect(inputs.resolveSafetyProfile(id).exerciseId).toBe(id);
    }
  });

  it('support-variant exercises get the balance cues; others stay unchanged', () => {
    const plan = generateProgrammeSession({
      state: onboardedState({ balanceSupportDefault: true }),
      template: 'A',
      preset: 'standard',
    });
    const inputs = voiceSessionInputsFromPlan(plan);
    const supported = plan.main.find((exercise) => exercise.useSupportVariant);
    const unsupported = plan.main.find((exercise) => !exercise.useSupportVariant);
    expect(supported).toBeTruthy();
    expect(inputs.resolveSafetyProfile(supported!.exerciseId).activeCueIds).toContain(
      'balance_support_within_reach'
    );
    if (unsupported) {
      expect(inputs.resolveSafetyProfile(unsupported.exerciseId).activeCueIds).not.toContain(
        'balance_support_within_reach'
      );
    }
  });
});

describe('real voice session → programme results (reported-only, C10/N5)', () => {
  it('a clean full session reports every pattern at target, prep and finisher credited', () => {
    const plan = generateProgrammeSession({ state: onboardedState(), template: 'A', preset: 'standard' });
    const result = runVoiceSession(plan);
    const mapped = programmeResultsFromVoiceSession(plan, result, '2026-07-06T09:40:00.000Z');

    expect(mapped.prepCompleted).toBe(true);
    expect(mapped.finisherCompleted).toBe(true);
    expect(mapped.outcomes.map((outcome) => outcome.pattern)).toEqual(
      plan.main.map((exercise) => exercise.pattern)
    );
    for (const outcome of mapped.outcomes) {
      const planned = plan.main.find((exercise) => exercise.pattern === outcome.pattern)!;
      expect(outcome.levelPerformed).toBe(planned.level);
      expect(outcome.sets).toHaveLength(planned.sets);
      for (const set of outcome.sets) expect(set.achieved).toBe(planned.repTargetPerSet);
      expect(outcome.painFlag).toBe(false);
      expect(outcome.effort).toBeNull();
    }
  });

  it('carries her ±rep adjustment into the reported value', () => {
    const plan = generateProgrammeSession({ state: onboardedState(), template: 'A', preset: 'standard' });
    const repsExercise = plan.main.find(
      (exercise) => exercise.scheme.kind === 'reps' || exercise.scheme.kind === 'reps_per_side'
    )!;
    const result = runVoiceSession(plan, { adjustAfter: new Map([[repsExercise.exerciseId, -2]]) });
    const mapped = programmeResultsFromVoiceSession(plan, result, '2026-07-06T09:40:00.000Z');
    const outcome = mapped.outcomes.find((o) => o.pattern === repsExercise.pattern)!;
    const lastSet = outcome.sets[outcome.sets.length - 1];
    expect(lastSet.achieved).toBe(repsExercise.repTargetPerSet - 2);
  });

  it('pain mid-exercise → painFlag outcome keeping completed sets; deliberate skip → no outcome', () => {
    const plan = generateProgrammeSession({ state: onboardedState(), template: 'A', preset: 'standard' });
    const [painTarget, skipTarget] = [plan.main[1], plan.main[2]];
    const result = runVoiceSession(plan, {
      painOn: new Set([painTarget.exerciseId]),
      skipOn: new Set([skipTarget.exerciseId]),
    });
    const mapped = programmeResultsFromVoiceSession(plan, result, '2026-07-06T09:40:00.000Z');

    const painOutcome = mapped.outcomes.find((o) => o.pattern === painTarget.pattern);
    expect(painOutcome?.painFlag).toBe(true);
    expect(mapped.outcomes.some((o) => o.pattern === skipTarget.pattern)).toBe(false);
    // Untouched patterns still report normally.
    expect(mapped.outcomes.find((o) => o.pattern === plan.main[0].pattern)?.painFlag).toBe(false);
  });

  it('a skipped warm-up or finisher is never credited', () => {
    const plan = generateProgrammeSession({ state: onboardedState(), template: 'A', preset: 'standard' });
    const result = runVoiceSession(plan, {
      skipOn: new Set([PROGRAMME_PREP_ITEM_ID, ...plan.finisher.map((item) => item.id)]),
    });
    const mapped = programmeResultsFromVoiceSession(plan, result, '2026-07-06T09:40:00.000Z');
    expect(mapped.prepCompleted).toBe(false);
    expect(mapped.finisherCompleted).toBe(false);
    expect(mapped.outcomes).toHaveLength(plan.main.length);
  });
});
