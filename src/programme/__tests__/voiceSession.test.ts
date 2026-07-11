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
import type { PhysicalTrainingFocus, ProgrammePhasePrescription } from '../prescription';
import type { ProgrammeState } from '../types';
import { PROGRAMME_PREP_ITEM_ID } from '../voiceCatalog';
import { programmeResultsFromVoiceSession, voiceSessionInputsFromPlan } from '../voiceSession';

function onboardedState(overrides: Partial<ProgrammeState['profile']> = {}): ProgrammeState {
  const state = defaultProgrammeState();
  state.profile = { ...state.profile, consentHealthData: true, hasStairs: true, ...overrides };
  state.onboardingCompletedAtIso = '2026-07-06T09:00:00.000Z';
  return state;
}

function activeFocusState(physicalFocus: PhysicalTrainingFocus): ProgrammeState {
  const state = onboardedState();
  const prescription: ProgrammePhasePrescription = {
    schemaVersion: 1,
    policyVersion: 1,
    policyFingerprint: 'focus-policy-test',
    prescriptionId: `phase-1-${physicalFocus}`,
    phase: 1,
    physicalFocus,
    dosePolicy: {
      plannedFocusBlocksPerWeek: 3,
      focusBlockStrategy:
        physicalFocus === 'strength'
          ? 'strength_each_session'
          : physicalFocus === 'balance'
            ? 'balance_each_session'
            : 'alternate_strength_balance',
    },
    canonicalFocus:
      physicalFocus === 'balanced'
        ? {
            kind: 'balanced',
            domain: null,
            planMode: 'balanced_insufficient_reference',
            decisionReason: 'v2_focus_balanced_no_unique_signal',
          }
        : {
            kind: 'domain',
            domain: physicalFocus === 'strength' ? 'strength_power' : 'balance',
            planMode: 'checkup_reference_focus',
            decisionReason: 'v2_focus_single_below_reference',
          },
    sourceAssessmentId: 'assessment-1',
    sourceAssessmentFingerprint: 'assessment-fingerprint-1',
    sourceCheckUpId: 'checkup-1',
    sourceCheckUpType: 'baseline',
    createdAtIso: '2026-07-06T09:00:00.000Z',
  };
  state.journey = {
    ...state.journey,
    status: 'active',
    startedAtIso: '2026-07-06T09:00:00.000Z',
    currentPhase: 1,
    currentPhaseStartedAtIso: '2026-07-06T09:00:00.000Z',
    phasePrescriptions: { 1: prescription },
  };
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

  it('keeps bonus-set machinery out of the promoted MVP session', () => {
    const plan = generateProgrammeSession({
      state: onboardedState(),
      template: 'A',
      preset: 'standard',
      lastSessionEffort: 'lots',
    });
    const inputs = voiceSessionInputsFromPlan(plan);
    expect('bonusSetOffer' in inputs).toBe(false);
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

  it('folds a Strength block into one voice item and carries the extra-set dose', () => {
    const plan = generateProgrammeSession({
      state: activeFocusState('strength'),
      template: 'A',
      preset: 'standard',
    });
    expect(plan.focusBlock?.kind).toBe('strength');
    const focusId = plan.focusBlock!.exerciseId;
    const inputs = voiceSessionInputsFromPlan(plan);
    expect(inputs.exerciseIds.filter((id) => id === focusId)).toHaveLength(1);
    expect(inputs.generatedExercises.filter((dose) => dose.exerciseId === focusId)).toHaveLength(1);
    expect(inputs.generatedExercises.find((dose) => dose.exerciseId === focusId)?.sets).toBe(3);
  });

  it('places a distinct supported Balance block between main work and the finisher', () => {
    const plan = generateProgrammeSession({
      state: activeFocusState('balance'),
      template: 'A',
      preset: 'standard',
    });
    expect(plan.focusBlock?.kind).toBe('balance');
    const focus = plan.focusBlock!;
    const inputs = voiceSessionInputsFromPlan(plan);
    expect(inputs.exerciseIds).toEqual([
      PROGRAMME_PREP_ITEM_ID,
      ...plan.main.map((exercise) => exercise.exerciseId),
      focus.exerciseId,
      ...plan.finisher.map((item) => item.id),
    ]);
    expect(inputs.generatedExercises.find((dose) => dose.exerciseId === focus.exerciseId)).toMatchObject({
      sets: 2,
      secondsPerSet: 20,
      restSeconds: 30,
    });
    expect(inputs.resolveExercise(focus.exerciseId).family).toBe('balance');
    const safety = inputs.resolveSafetyProfile(focus.exerciseId);
    expect(safety.setupCueIds).toContain('balance_support_within_reach');
    expect(safety.activeCueIds).toContain('balance_stop_if_unsteady');
    expect([...safety.setupCueIds, ...safety.activeCueIds, ...safety.recoveryCueIds]).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/^tracking_/)]),
    );
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

  it('records Balance-block completion without creating a strength-ladder outcome', () => {
    const plan = generateProgrammeSession({
      state: activeFocusState('balance'),
      template: 'A',
      preset: 'standard',
    });
    const result = runVoiceSession(plan);
    const mapped = programmeResultsFromVoiceSession(
      plan,
      result,
      '2026-07-06T09:40:00.000Z'
    );
    expect(mapped.focusBlockCompleted).toBe(true);
    expect(mapped.outcomes.map((outcome) => outcome.pattern)).toEqual(
      plan.main.map((exercise) => exercise.pattern)
    );
    expect(mapped.outcomes).toHaveLength(plan.main.length);
  });

  it('does not turn a painful Balance-block stop into a pattern regression', () => {
    const plan = generateProgrammeSession({
      state: activeFocusState('balance'),
      template: 'A',
      preset: 'standard',
    });
    const focusId = plan.focusBlock!.exerciseId;
    const result = runVoiceSession(plan, { painOn: new Set([focusId]) });
    const mapped = programmeResultsFromVoiceSession(
      plan,
      result,
      '2026-07-06T09:40:00.000Z'
    );
    expect(mapped.focusBlockCompleted).toBe(false);
    expect(mapped.outcomes).toHaveLength(plan.main.length);
    expect(mapped.outcomes.every((outcome) => outcome.painFlag === false)).toBe(true);
  });
});
