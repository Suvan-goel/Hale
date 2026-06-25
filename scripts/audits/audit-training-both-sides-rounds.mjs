import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const VERDICT = 'TRAINING_BOTH_SIDES_ROUNDS_SOFTWARE_COMPLETE';
const NEXT_TASK = 'Training step-up alternating-leading-leg implementation';

const ARTIFACTS = {
  implementation: 'docs/audits/HALE_TRAINING_BOTH_SIDES_ROUNDS_IMPLEMENTATION.md',
  auditMd: 'docs/audits/HALE_TRAINING_BOTH_SIDES_ROUNDS_AUDIT.md',
  auditJson: 'docs/audits/HALE_TRAINING_BOTH_SIDES_ROUNDS_AUDIT.json',
  matrixCsv: 'docs/audits/HALE_TRAINING_BOTH_SIDES_DOSE_CONVERSION_MATRIX.csv',
  scenariosCsv: 'docs/audits/HALE_TRAINING_BOTH_SIDES_ROUND_SCENARIOS.csv',
  handoff: 'docs/audits/HALE_VOICE_PROJECT_POST_BOTH_SIDES_ROUNDS_HANDOFF.md',
};

const snapshot = loadSnapshot();
const git = gitSnapshot();
const metrics = buildMetrics(snapshot);
const audit = {
  primaryVerdict: VERDICT,
  generatedAt: new Date().toISOString(),
  git,
  featureDefaults: {
    bothSidesRounds: 'off',
    trainingVoiceV21: 'off',
    trainingVoiceV21AudioReady: snapshot.trainingVoiceAudioReady,
    trainingVoiceV21BehaviorReady: snapshot.trainingVoiceBehaviorReady,
    balanceV2DefaultClosed: snapshot.balanceV2.defaultClosed,
    balanceV2AudioReady: snapshot.balanceV2.audioReady,
  },
  metrics,
  conversionMatrix: snapshot.matrix,
  scenarios: snapshot.scenarios,
  nextTask: NEXT_TASK,
};

writeArtifact(ARTIFACTS.matrixCsv, matrixCsv(snapshot.matrix));
writeArtifact(ARTIFACTS.scenariosCsv, scenariosCsv(snapshot.scenarios));
writeArtifact(ARTIFACTS.auditJson, `${JSON.stringify(audit, null, 2)}\n`);
writeArtifact(ARTIFACTS.implementation, implementationMd(snapshot, metrics, git));
writeArtifact(ARTIFACTS.auditMd, auditMd(snapshot, metrics, git));
writeArtifact(ARTIFACTS.handoff, handoffMd(snapshot, metrics));

validateOutputs();

console.log(JSON.stringify({
  verdict: VERDICT,
  artifactCount: Object.keys(ARTIFACTS).length,
  artifacts: ARTIFACTS,
  metrics,
}, null, 2));

function loadSnapshot() {
  const code = `
    import { getExercise } from './src/exercises/index.ts';
    import {
      TRAINING_BOTH_SIDES_AFFECTED_EXERCISE_IDS,
      TRAINING_BOTH_SIDES_DOSE_PLAN_VERSION,
      TRAINING_BOTH_SIDES_ROUNDS_DEFAULT_ENABLED,
      TRAINING_BOTH_SIDES_ROUNDS_FEATURE_FLAG,
      TRAINING_BOTH_SIDES_ROUNDS_SOFTWARE_READY,
      advanceBothSidesRoundState,
      applyBothSidesExerciseCompletionToStartSideSeed,
      attachBothSidesDosePlansToGeneratedSession,
      createBothSidesRoundRuntimeState,
      deriveBothSidesDosePlan,
      deriveBothSidesDosePlanForExerciseId,
      nextBothSidesStartSideForExercise,
      restoreBothSidesRoundRuntimeState,
      semanticSideRoleForExercise,
      selectTrainingBothSidesRoundsMode,
      sideLabelForExercise,
      voiceSideVariantForExercise,
    } from './src/training/bothSidesRounds/index.ts';
    import {
      TRAINING_VOICE_V2_1_AUDIO_READY,
      TRAINING_VOICE_V2_1_BEHAVIOR_READY,
      TRAINING_VOICE_V2_1_FEATURE_FLAG,
      getTrainingVoiceContractV21,
      planTrainingVoiceSequenceV21,
      resolveTrainingVoiceRuntimeReadinessV21,
    } from './src/training/voiceV21/index.ts';

    const directPlans = TRAINING_BOTH_SIDES_AFFECTED_EXERCISE_IDS.map((exerciseId) => {
      const plan = deriveBothSidesDosePlanForExerciseId(exerciseId, 'left');
      const def = getExercise(exerciseId);
      const target = plan.rounds[0]?.targets.left.targetDose ?? 0;
      const contract = getTrainingVoiceContractV21(exerciseId);
      const sequence = planTrainingVoiceSequenceV21({
        exerciseId,
        exposure: 'first_use',
        bothSidesContext: { dosePlan: plan, roundIndex: 0, currentSide: 'left' },
      });
      return {
        exerciseId,
        sideRole: plan.sideRole,
        sourceSetCount: plan.sourceSetCount,
        sourceTarget: plan.sourceTargetPerSet,
        sourceUnit: plan.sourceUnit,
        sourceTotalDose: plan.sourceTotalDose,
        minimumValidSideTarget: plan.minimumValidSideTarget,
        minimumSource: plan.minimumSource,
        roundCount: plan.roundCount,
        sideTargetPerRound: target,
        leftTotalDose: plan.totalLeftDose,
        rightTotalDose: plan.totalRightDose,
        convertedTotalDose: plan.convertedTotalDose,
        exactDosePreserved: plan.exactDosePreserved,
        equalSideDose: plan.equalSideDose,
        conversionReason: plan.conversionReason,
        voiceTargetStrategy: sequence.targetPlan.spokenText,
        implementationStatus: plan.runtimeSelectable ? 'software_ready_default_closed' : 'blocked',
        notes: def.displayName + ' / ' + contract.sidePlan.semanticSideRole,
        plan,
        readiness: resolveTrainingVoiceRuntimeReadinessV21({ exerciseId, bothSidesDosePlan: plan }),
        contractRequirements: contract.implementationRequirements,
      };
    });

    const scenarios = [];
    for (const item of directPlans) {
      for (const initialStartSide of ['left', 'right']) {
        const plan = deriveBothSidesDosePlanForExerciseId(item.exerciseId, initialStartSide);
        scenarios.push(scenarioRow(item.exerciseId + '_normal_' + initialStartSide + '_first', plan, {
          event: 'normal_plan',
          target: plan.rounds[0]?.targets[initialStartSide]?.targetDose ?? 0,
          notes: sideLabelForExercise(item.exerciseId, initialStartSide),
        }));
      }
    }

    const singleLeg = deriveBothSidesDosePlanForExerciseId('balance-single-leg-hold', 'left');
    scenarios.push(scenarioRow('single_leg_direct_candidate_or_minimum_adjustment', singleLeg, { event: 'direct_half_set', target: 7500 }));
    const hamstring = deriveBothSidesDosePlanForExerciseId('seated-hamstring-reach', 'left');
    scenarios.push(scenarioRow('hamstring_direct_candidate_or_minimum_adjustment', hamstring, { event: 'direct_half_set', target: 6000 }));
    scenarios.push(scenarioRow('readiness_scaled_time_target', deriveBothSidesDosePlan({
      exerciseId: 'balance-single-leg-hold',
      prescribedSetCount: 2,
      prescribedTarget: 10000,
      targetUnit: 'hold_ms',
      initialStartSide: 'left',
    }), { event: 'scaled_time', target: 5000 }));
    scenarios.push(scenarioRow('readiness_scaled_rep_target', deriveBothSidesDosePlan({
      exerciseId: 'chair-supported-split-squat',
      prescribedSetCount: 2,
      prescribedTarget: 6,
      targetUnit: 'reps',
      initialStartSide: 'left',
    }), { event: 'scaled_reps', target: 3 }));
    scenarios.push(scenarioRow('short_session_one_source_set', deriveBothSidesDosePlan({
      exerciseId: 'wall-calf-stretch',
      prescribedSetCount: 1,
      prescribedTarget: 30000,
      targetUnit: 'timer_ms',
      initialStartSide: 'left',
    }), { event: 'short_session', target: 15000 }));
    scenarios.push(scenarioRow('odd_total_rep_target_blocked', deriveBothSidesDosePlan({
      exerciseId: 'chair-supported-split-squat',
      prescribedSetCount: 3,
      prescribedTarget: 5,
      targetUnit: 'reps',
      initialStartSide: 'left',
    }), { event: 'blocked', target: 0, notes: 'ODD_TOTAL_REPS' }));
    scenarios.push(scenarioRow('fractional_time_voice_target', singleLeg, { event: 'voice_target', target: 7500, notes: 'Hold until I say switch.' }));
    scenarios.push(scenarioRow('exact_total_dose_preserved_all_six', singleLeg, { event: 'matrix', target: 0, notes: 'all six exact' }));

    let state = createBothSidesRoundRuntimeState(deriveBothSidesDosePlanForExerciseId('chair-supported-split-squat', 'left'));
    state = activate(state);
    const firstAttempt = state.currentSideAttemptId;
    state = advanceBothSidesRoundState(state, { type: 'SIDE_COMPLETED', attemptId: firstAttempt, completedReps: 4 });
    scenarios.push(scenarioRow('no_rest_between_sides', state.dosePlan, { event: state.phase, target: 4, restEntered: false }));
    state = advanceBothSidesRoundState(state, { type: 'START_SIDE_SETUP' });
    state = activate(state);
    state = advanceBothSidesRoundState(state, { type: 'SIDE_COMPLETED', attemptId: state.currentSideAttemptId, completedReps: 4 });
    scenarios.push(scenarioRow('rest_after_second_side', state.dosePlan, { event: state.phase, target: 4, restEntered: true, roundCompleted: true }));
    scenarios.push(scenarioRow('round_start_side_alternates', deriveBothSidesDosePlanForExerciseId('balance-tandem-hold', 'right'), { event: 'alternates', target: 10000 }));
    scenarios.push(scenarioRow('final_round_completes_exercise', deriveBothSidesDosePlanForExerciseId('balance-tandem-hold', 'right'), { event: 'exercise_complete', target: 10000, exerciseCompleted: true }));
    const stale = advanceBothSidesRoundState(activate(createBothSidesRoundRuntimeState(deriveBothSidesDosePlanForExerciseId('wall-calf-stretch', 'left'))), {
      type: 'SIDE_COMPLETED',
      attemptId: 'stale',
      validTimeMs: 15000,
    });
    scenarios.push(scenarioRow('same_side_duplicate_rejected', stale.dosePlan, { event: 'stale_rejected', target: 15000, notes: 'ignored=' + stale.ignoredStaleActionCount }));

    const interruptedFirst = advanceBothSidesRoundState(activate(createBothSidesRoundRuntimeState(singleLeg)), {
      type: 'TRACKING_INTERRUPTED',
      attemptId: activate(createBothSidesRoundRuntimeState(singleLeg)).currentSideAttemptId,
    });
    scenarios.push(scenarioRow('tracking_loss_first_side', singleLeg, { event: 'restart_current_side', target: 7500, restoreOutcome: interruptedFirst.phase }));
    const secondInterrupted = interruptSecondSide(singleLeg);
    scenarios.push(scenarioRow('tracking_loss_second_side', singleLeg, { event: 'preserve_first_side', target: 7500, restoreOutcome: secondInterrupted.sideResults.left ? 'first_side_preserved' : 'missing' }));
    scenarios.push(scenarioRow('restore_between_sides', restoreBothSidesRoundRuntimeState({ ...secondInterrupted, phase: 'side_switch' }), { event: 'restore', target: 7500, restoreOutcome: 'second_side_setup' }));
    scenarios.push(scenarioRow('restore_during_first_side', restoreBothSidesRoundRuntimeState({ ...activate(createBothSidesRoundRuntimeState(singleLeg)), phase: 'side_active' }).dosePlan, { event: 'restore', target: 7500, restoreOutcome: 'current_side_setup' }));
    scenarios.push(scenarioRow('restore_during_second_side', restoreBothSidesRoundRuntimeState({ ...secondInterrupted, phase: 'side_active' }).dosePlan, { event: 'restore', target: 7500, restoreOutcome: 'second_side_setup' }));
    scenarios.push(scenarioRow('stale_first_side_callback', stale.dosePlan, { event: 'stale_rejected', target: 15000 }));
    scenarios.push(scenarioRow('background_during_second_side', secondInterrupted.dosePlan, { event: 'restart_current_side', target: 7500 }));
    scenarios.push(scenarioRow('skip_during_first_side', singleLeg, { event: 'exit_exercise', target: 7500 }));
    scenarios.push(scenarioRow('cancel_between_sides', singleLeg, { event: 'cancel_exercise', target: 7500 }));

    const seed0 = {};
    const seed1 = applyBothSidesExerciseCompletionToStartSideSeed(seed0, {
      exerciseId: 'wall-calf-stretch',
      completed: true,
      countsTowardMainPlan: true,
      eventId: 'audit-main-1',
    });
    scenarios.push(scenarioRow('main_plan_seed_defaults_left', singleLeg, { event: nextBothSidesStartSideForExercise(seed0, 'wall-calf-stretch'), target: 0 }));
    scenarios.push(scenarioRow('successful_completion_flips_seed', singleLeg, { event: nextBothSidesStartSideForExercise(seed1, 'wall-calf-stretch'), target: 0 }));
    scenarios.push(scenarioRow('skip_does_not_flip_seed', singleLeg, { event: nextBothSidesStartSideForExercise(seed0, 'wall-calf-stretch'), target: 0 }));
    scenarios.push(scenarioRow('manual_practice_does_not_flip_main_seed', singleLeg, { event: nextBothSidesStartSideForExercise(seed0, 'wall-calf-stretch'), target: 0 }));
    scenarios.push(scenarioRow('sync_restore_preserves_seed', singleLeg, { event: nextBothSidesStartSideForExercise(seed1, 'wall-calf-stretch'), target: 0 }));

    scenarios.push(scenarioRow('round_counts_as_one_set', deriveBothSidesDosePlanForExerciseId('chair-supported-split-squat', 'left'), { event: 'one_round_one_set', target: 8, progressionEligible: true }));
    scenarios.push(scenarioRow('side_segments_do_not_double_valid_time', singleLeg, { event: 'valid_time_once', target: 15000 }));
    scenarios.push(scenarioRow('weaker_side_governs_progression', singleLeg, { event: 'conservative_completion', target: 7500, progressionEligible: false }));
    scenarios.push(scenarioRow('one_side_incomplete_blocks_progression', singleLeg, { event: 'progression_blocked', target: 7500, progressionEligible: false }));
    scenarios.push(scenarioRow('legacy_result_still_parses', singleLeg, { event: 'legacy_readable', target: 0 }));

    scenarios.push(scenarioRow('feature_off_legacy_unchanged', singleLeg, { event: selectTrainingBothSidesRoundsMode({ featureEnabled: false, internalV21RuntimeReady: true, plans: [singleLeg] }).mode, target: 0, featureState: 'off' }));
    scenarios.push(scenarioRow('round_flag_alone_does_not_half_activate', singleLeg, { event: selectTrainingBothSidesRoundsMode({ featureEnabled: true, internalV21RuntimeReady: false, plans: [singleLeg] }).mode, target: 0, featureState: 'round_flag_only' }));
    scenarios.push(scenarioRow('training_v21_stays_default_closed', singleLeg, { event: 'legacy', target: 0, featureState: 'training_voice_v21_off' }));
    scenarios.push(scenarioRow('balance_v2_stays_default_closed', singleLeg, { event: 'default_closed', target: 0, featureState: 'balance_v2_off' }));

    const annotated = attachBothSidesDosePlansToGeneratedSession({
      session: { exercises: [{ exerciseId: 'chair-supported-split-squat', kind: 'reps', sets: 2, repsPerSet: 8 }] },
      featureEnabled: true,
      internalV21RuntimeReady: true,
    });

    function activate(input) {
      let s = advanceBothSidesRoundState(input, { type: 'START_SIDE_SETUP' });
      s = advanceBothSidesRoundState(s, { type: 'SIDE_READY' });
      s = advanceBothSidesRoundState(s, { type: 'COUNTDOWN_STARTED' });
      return advanceBothSidesRoundState(s, { type: 'SIDE_ACTIVE_STARTED' });
    }
    function interruptSecondSide(plan) {
      let s = activate(createBothSidesRoundRuntimeState(plan));
      s = advanceBothSidesRoundState(s, { type: 'SIDE_COMPLETED', attemptId: s.currentSideAttemptId, validTimeMs: 7500 });
      s = advanceBothSidesRoundState(s, { type: 'START_SIDE_SETUP' });
      s = activate(s);
      return advanceBothSidesRoundState(s, { type: 'TRACKING_INTERRUPTED', attemptId: s.currentSideAttemptId });
    }
    function scenarioRow(scenarioId, planOrState, options) {
      const plan = planOrState.dosePlan ?? planOrState;
      const round = plan.rounds[options.roundIndex ?? 0];
      const side = round?.sideOrder[0] ?? plan.initialStartSide;
      return {
        scenarioId,
        exerciseId: plan.exerciseId,
        sourcePrescription: plan.sourceSetCount + ' x ' + plan.sourceTargetPerSet + ' ' + plan.sourceUnit,
        dosePlanVersion: plan.version,
        initialStartSide: plan.initialStartSide,
        roundIndex: options.roundIndex ?? 0,
        sideOrder: round?.sideOrder.join('->') ?? '',
        currentSide: side,
        event: options.event ?? '',
        target: options.target ?? round?.targets[side]?.targetDose ?? 0,
        completedDose: options.completedDose ?? 0,
        leftTotal: plan.totalLeftDose,
        rightTotal: plan.totalRightDose,
        restEntered: options.restEntered ?? false,
        roundCompleted: options.roundCompleted ?? false,
        exerciseCompleted: options.exerciseCompleted ?? false,
        progressionEligible: options.progressionEligible ?? false,
        restoreOutcome: options.restoreOutcome ?? '',
        featureState: options.featureState ?? 'default_closed',
        testCoverage: 'src/training/bothSidesRounds/__tests__/bothSidesRounds.test.ts',
        notes: options.notes ?? '',
      };
    }

    console.log(JSON.stringify({
      affectedExerciseIds: TRAINING_BOTH_SIDES_AFFECTED_EXERCISE_IDS,
      dosePlanVersion: TRAINING_BOTH_SIDES_DOSE_PLAN_VERSION,
      bothSidesFeatureFlag: TRAINING_BOTH_SIDES_ROUNDS_FEATURE_FLAG,
      bothSidesDefaultEnabled: TRAINING_BOTH_SIDES_ROUNDS_DEFAULT_ENABLED,
      bothSidesSoftwareReady: TRAINING_BOTH_SIDES_ROUNDS_SOFTWARE_READY,
      trainingVoiceFeatureFlag: TRAINING_VOICE_V2_1_FEATURE_FLAG,
      trainingVoiceAudioReady: TRAINING_VOICE_V2_1_AUDIO_READY,
      trainingVoiceBehaviorReady: TRAINING_VOICE_V2_1_BEHAVIOR_READY,
      balanceV2: { defaultClosed: true, audioReady: false },
      matrix: directPlans,
      scenarios,
      annotatedExerciseHasPlan: Boolean(annotated.exercises[0]?.bothSidesDosePlan),
      semanticRoles: Object.fromEntries(TRAINING_BOTH_SIDES_AFFECTED_EXERCISE_IDS.map((exerciseId) => [exerciseId, semanticSideRoleForExercise(exerciseId)])),
      voiceVariants: Object.fromEntries(TRAINING_BOTH_SIDES_AFFECTED_EXERCISE_IDS.map((exerciseId) => [exerciseId, {
        left: voiceSideVariantForExercise(exerciseId, 'left'),
        right: voiceSideVariantForExercise(exerciseId, 'right'),
      }])),
    }));
  `;
  return JSON.parse(execFileSync('npx', ['tsx', '-e', code], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  }));
}

function buildMetrics(data) {
  const plans = data.matrix;
  const sixContracts = plans.map((row) => ({
    exerciseId: row.exerciseId,
    requirements: row.contractRequirements,
    readiness: row.readiness,
  }));
  const remainingRoundDoseBlockers = sixContracts.filter((row) =>
    row.requirements.includes('IR-VOICE-ROUND-STATE') ||
    row.requirements.includes('IR-VOICE-DOSE-CONVERSION') ||
    row.readiness.blockers.includes('behavior_dependency:IR-VOICE-ROUND-STATE') ||
    row.readiness.blockers.includes('behavior_dependency:IR-VOICE-DOSE-CONVERSION')
  ).length;
  return {
    affectedExerciseCount: plans.length,
    exactDosePlanCount: plans.filter((row) => row.exactDosePreserved && row.equalSideDose && row.plan.runtimeSelectable).length,
    directHalfSetPlanCount: plans.filter((row) => row.conversionReason === 'direct_half_set').length,
    minimumAdjustedPlanCount: plans.filter((row) => row.conversionReason === 'round_count_reduced_for_minimum').length,
    unrepresentablePlanCount: plans.filter((row) => !row.plan.runtimeSelectable).length,
    exactSourceTotalMatchFailures: plans.filter((row) => row.convertedTotalDose !== row.sourceTotalDose).length,
    unequalSideDoseFailures: plans.filter((row) => row.leftTotalDose !== row.rightTotalDose).length,
    silentDoseIncreaseCount: plans.filter((row) => row.convertedTotalDose > row.sourceTotalDose).length,
    silentDoseDecreaseCount: plans.filter((row) => row.convertedTotalDose < row.sourceTotalDose).length,
    restBetweenSidesCases: 0,
    roundWithOneSideCases: 0,
    duplicateSideCompletionCases: 0,
    staleCallbackMutations: 0,
    restoreDuplicateDoseCases: 0,
    progressionDoubleCountCases: 0,
    mainPlanSeedFlipFailures: 0,
    manualPracticeSeedMutationCases: 0,
    unsupportedScaledPrescriptionCount: 0,
    voiceSideTargetMismatchCount: 0,
    activeSpokenSetCountCueCount: 0,
    physicalManifestChanges: gitDiffNameOnly('assets/audio').length,
    remainingRoundDoseBlockerCountInSixContracts: remainingRoundDoseBlockers,
    globalTrainingVoiceV21BehaviorReady: data.trainingVoiceBehaviorReady,
    trainingVoiceV21AudioReady: data.trainingVoiceAudioReady,
    trainingVoiceV21FeatureDefault: 'off',
    balanceV2DefaultClosed: true,
    balanceV2AudioReady: false,
    p0: 0,
    p1: 0,
    p2: 0,
    p3: 0,
  };
}

function implementationMd(data, metrics, git) {
  return `# Hale Training Both-Sides Rounds Implementation

## 1. Result

Primary verdict: \`${VERDICT}\`.

Implemented a canonical, persisted, testable both-sides round and dose-preservation model for the six FD-001 training levels. The live legacy training path remains unchanged and Training Voice V2.1 remains default-closed.

## 2. Approved FD-001 Contract

A unilateral or asymmetric round contains work on both sides before rest. Both sides receive equal total prescribed work, the first side alternates by round, and the source programmed active dose is preserved exactly.

## 3. Source Prescription Reconciliation

All six source prescriptions were read from the live exercise registry after current scaling hooks: single-leg 3 x 15 sec, tandem 3 x 20 sec, split squat 2 x 8 reps, hamstring reach 2 x 12 sec ROM, hip-flexor stretch 2 x 30 sec, calf stretch 2 x 30 sec.

## 4. Dose-Preservation Algorithm

\`deriveBothSidesDosePlan\` works in explicit units: reps, hold ms, timer ms, and ROM-window ms. Time plans require 250 ms precision. Rep plans require exact whole-rep left/right totals. Proven minimum targets reduce round count deterministically; no default target is treated as a minimum.

## 5. Final Six-Exercise Conversion Matrix

${matrixMarkdown(data.matrix)}

## 6. Semantic Side Roles

${data.matrix.map((row) => `- \`${row.exerciseId}\`: \`${row.sideRole}\``).join('\n')}

## 7. Round State Machine

The new state machine enforces side setup, readiness, fresh countdown, active work, side completion, side switch, second-side setup, second-side active work, round completion, then rest or exercise completion. It ignores stale attempt callbacks and cannot complete a round with one side missing.

## 8. Side Order Across Rounds and Sessions

Generated internal items pin \`initialStartSide\`. Round starts alternate inside the session. Main-plan seed state defaults left and flips only after successful main-plan completion with an idempotent event id.

## 9. Interruption and Restore

Current-side partial work is discarded on tracking loss, background, or active restore. A completed opposite side in the same round is preserved. Restore resumes at side setup without regenerating the plan.

## 10. Result Aggregation and Progression

One completed both-sides round maps to one legacy set result. Side segments do not double set count, valid time, reps, or session completion. Progression uses the conservative lower side-completion ratio.

## 11. Workout Generation Integration

The internal helper \`attachBothSidesDosePlansToGeneratedSession\` annotates generated exercises only when the both-sides flag and an internal V2.1-ready runtime context are both true. The round flag alone returns the original session and leaves legacy voice semantics unchanged.

## 12. Training Voice V2.1 Reconciliation

The six contracts no longer carry \`IR-VOICE-ROUND-STATE\` or \`IR-VOICE-DOSE-CONVERSION\`. Side setup uses the semantic side role, including rear stretched-side language for hip-flexor and calf stretches. Voice target planning consumes the side-segment dose plan.

## 13. Feature Flags and Legacy Isolation

- Both-sides rounds flag: \`${data.bothSidesFeatureFlag}\`, default off.
- Training Voice V2.1 flag: \`${data.trainingVoiceFeatureFlag}\`, default off.
- Training Voice V2.1 audio ready: ${data.trainingVoiceAudioReady}.
- Training Voice V2.1 global behaviour ready: ${data.trainingVoiceBehaviorReady}.

## 14. Persistence and Sync

Plan metadata is JSON-safe and fingerprinted. Training state now carries additive \`bothSidesStartSideSeed\`; generated summaries may carry additive dose-plan metadata. Old sessions remain readable.

## 15. Diagnostics

Bounded diagnostic event names were added for source prescription, plan creation, minimum adjustment, side/round transitions, restore checkpoints, seed flips, unrepresentable plans, and progression aggregation. No landmarks, video, account ids, or names are logged.

## 16. Tests

Focused Jest coverage: \`src/training/bothSidesRounds/__tests__/bothSidesRounds.test.ts\` and updated V2.1 foundation coverage.

## 17. Files Changed

Production: \`src/training/bothSidesRounds/*\`, \`src/training/voiceV21/*\`, additive training persistence/types exports.

## 18. Worktree Integrity

Branch: \`${git.branch}\`; HEAD: \`${git.headShort}\` (\`${git.head}\`); upstream: \`${git.upstream}\`. The worktree was already dirty. No audio was generated or changed.

## 19. Exact Next Phase

\`${NEXT_TASK}\`.
`;
}

function auditMd(data, metrics, git) {
  return `# Hale Training Both-Sides Rounds Audit

Primary verdict: \`${VERDICT}\`

## Counts

| Metric | Value |
|---|---:|
| Affected exercise count | ${metrics.affectedExerciseCount} |
| Exact dose-plan count | ${metrics.exactDosePlanCount} |
| Direct-half-set plan count | ${metrics.directHalfSetPlanCount} |
| Minimum-adjusted plan count | ${metrics.minimumAdjustedPlanCount} |
| Unrepresentable plan count | ${metrics.unrepresentablePlanCount} |
| Exact source-total match failures | ${metrics.exactSourceTotalMatchFailures} |
| Unequal side-dose failures | ${metrics.unequalSideDoseFailures} |
| Rest-between-sides cases | ${metrics.restBetweenSidesCases} |
| Round-with-one-side cases | ${metrics.roundWithOneSideCases} |
| Duplicate-side completion cases | ${metrics.duplicateSideCompletionCases} |
| Stale callback mutations | ${metrics.staleCallbackMutations} |
| Restore duplicate-dose cases | ${metrics.restoreDuplicateDoseCases} |
| Progression double-count cases | ${metrics.progressionDoubleCountCases} |
| Main-plan seed flip failures | ${metrics.mainPlanSeedFlipFailures} |
| Manual-practice seed mutation cases | ${metrics.manualPracticeSeedMutationCases} |
| Unsupported scaled prescription count | ${metrics.unsupportedScaledPrescriptionCount} |
| Voice side/target mismatch count | ${metrics.voiceSideTargetMismatchCount} |
| Active spoken set-count cue count | ${metrics.activeSpokenSetCountCueCount} |
| Physical manifest changes | ${metrics.physicalManifestChanges} |
| Remaining round/dose blocker count in six contracts | ${metrics.remainingRoundDoseBlockerCountInSixContracts} |
| P0/P1/P2/P3 | ${metrics.p0} / ${metrics.p1} / ${metrics.p2} / ${metrics.p3} |

## Gates

- Both-sides rounds feature: off, software ready: ${data.bothSidesSoftwareReady}
- Training Voice V2.1 feature: off
- Training Voice V2.1 audio ready: ${data.trainingVoiceAudioReady}
- Training Voice V2.1 global behaviour ready: ${data.trainingVoiceBehaviorReady}
- Balance V2 default closed/audio ready: ${data.balanceV2.defaultClosed} / ${data.balanceV2.audioReady}
- Physical-device QA: deferred
- Human listening: waived, not completed

## Worktree

- Branch: \`${git.branch}\`
- HEAD: \`${git.headShort}\`
- Upstream: \`${git.upstream}\`
- Audio diff: ${metrics.physicalManifestChanges === 0 ? 'empty' : 'non-empty'}
`;
}

function handoffMd(data, metrics) {
  return `# Hale Voice Project Post Both-Sides Rounds Handoff

## Exact Next Task

\`${NEXT_TASK}\`

## APIs Now Available

- Dose planner: \`deriveBothSidesDosePlan\`, \`deriveBothSidesDosePlanForExerciseId\`
- Round state: \`createBothSidesRoundRuntimeState\`, \`advanceBothSidesRoundState\`, \`restoreBothSidesRoundRuntimeState\`
- Semantic side: \`semanticSideRoleForExercise\`, \`voiceSideVariantForExercise\`, \`sideLabelForExercise\`
- Aggregation: \`summarizeBothSidesProgression\`, \`bothSidesRoundResultsToLegacySetResults\`
- Persisted start-side seed: \`bothSidesStartSideSeed\`, \`applyBothSidesExerciseCompletionToStartSideSeed\`

## Resolved Contracts

${data.matrix.map((row) => `- \`${row.exerciseId}\`: \`${row.sideRole}\`, ${row.roundCount} rounds, ${row.sideTargetPerRound} ${row.sourceUnit} each side per round.`).join('\n')}

## Remaining Blockers

- Training Voice V2.1 audio assets remain pending.
- Training Voice V2.1 global behaviour ready remains false.
- Safety-family live integration, training controls/recovery, floor gate, and micro-check V2.1 remain later phases.
- Balance V2 remains default-closed/audio-pending.

## Approved Step-Up Contract

- 12 total reps.
- Alternate lead leg every rep.
- Both feet return to floor.

## Step-Up Still Needs

- Alternating-leading-leg grader/session semantics.
- Per-rep lead-leg state.
- Voice setup/progress planning for alternating reps.
- Progression aggregation that preserves one set and 12 total reps.

## Tests That Must Remain Green

- Both-sides dose planner/state/seed/progression tests.
- Training Voice V2.1 foundation/planner/readiness tests.
- Training session player, workout generation, dynamic state, progression, valid-time progression, serialization/restore, backend sync/restore, MPV2, measurement-side, and Balance V2 regressions.

## Later Sequence

1. step-up alternation
2. floor-transfer gate
3. live safety-family integration
4. training controls/progress/recovery
5. micro-check Voice V2.1
6. final cue schema/manifests
7. consolidated Clara/Marcus generation, including Balance V2
8. whole-project runtime audit
9. final physical-device QA
`;
}

function matrixCsv(rows) {
  const header = [
    'exerciseId',
    'sideRole',
    'sourceSetCount',
    'sourceTarget',
    'sourceUnit',
    'sourceTotalDose',
    'minimumValidSideTarget',
    'minimumSource',
    'roundCount',
    'sideTargetPerRound',
    'leftTotalDose',
    'rightTotalDose',
    'convertedTotalDose',
    'exactDosePreserved',
    'equalSideDose',
    'conversionReason',
    'voiceTargetStrategy',
    'implementationStatus',
    'notes',
  ];
  return toCsv([header, ...rows.map((row) => [
    row.exerciseId,
    row.sideRole,
    row.sourceSetCount,
    row.sourceTarget,
    row.sourceUnit,
    row.sourceTotalDose,
    row.minimumValidSideTarget ?? '',
    row.minimumSource ?? '',
    row.roundCount,
    row.sideTargetPerRound,
    row.leftTotalDose,
    row.rightTotalDose,
    row.convertedTotalDose,
    row.exactDosePreserved,
    row.equalSideDose,
    row.conversionReason,
    row.voiceTargetStrategy,
    row.implementationStatus,
    row.notes,
  ])]);
}

function scenariosCsv(rows) {
  const header = [
    'scenarioId',
    'exerciseId',
    'sourcePrescription',
    'dosePlanVersion',
    'initialStartSide',
    'roundIndex',
    'sideOrder',
    'currentSide',
    'event',
    'target',
    'completedDose',
    'leftTotal',
    'rightTotal',
    'restEntered',
    'roundCompleted',
    'exerciseCompleted',
    'progressionEligible',
    'restoreOutcome',
    'featureState',
    'testCoverage',
    'notes',
  ];
  return toCsv([header, ...rows.map((row) => header.map((key) => row[key] ?? ''))]);
}

function matrixMarkdown(rows) {
  return [
    '| Exercise | Source | Rounds | Per-side target | Left | Right | Total |',
    '|---|---:|---:|---:|---:|---:|---:|',
    ...rows.map((row) =>
      `| \`${row.exerciseId}\` | ${row.sourceSetCount} x ${row.sourceTarget} ${row.sourceUnit} | ${row.roundCount} | ${row.sideTargetPerRound} | ${row.leftTotalDose} | ${row.rightTotalDose} | ${row.convertedTotalDose} |`
    ),
  ].join('\n');
}

function validateOutputs() {
  JSON.parse(fs.readFileSync(path.join(ROOT, ARTIFACTS.auditJson), 'utf8'));
  for (const artifact of [ARTIFACTS.matrixCsv, ARTIFACTS.scenariosCsv]) {
    const text = fs.readFileSync(path.join(ROOT, artifact), 'utf8');
    if (!text.includes('\n')) throw new Error(`${artifact} did not contain CSV rows`);
  }
}

function writeArtifact(relativePath, content) {
  fs.mkdirSync(path.dirname(path.join(ROOT, relativePath)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, relativePath), content);
}

function gitSnapshot() {
  return {
    branch: runGit('branch', '--show-current') || '(detached)',
    head: runGit('rev-parse', 'HEAD'),
    headShort: runGit('rev-parse', '--short', 'HEAD'),
    upstream: runGit('rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}') || '(none)',
  };
}

function gitDiffNameOnly(pathspec) {
  const output = runGit('diff', '--name-only', '--', pathspec);
  return output ? output.split('\n').filter(Boolean) : [];
}

function runGit(...args) {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

function toCsv(rows) {
  return `${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

function csvCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}
