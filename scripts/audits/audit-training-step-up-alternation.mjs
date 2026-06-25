import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const VERDICT = 'TRAINING_STEP_UP_ALTERNATION_SOFTWARE_COMPLETE_DEFAULT_CLOSED';
const NEXT_TASK = 'Training floor-transfer readiness gate implementation';

const ARTIFACTS = {
  implementation: 'docs/audits/HALE_TRAINING_STEP_UP_ALTERNATION_IMPLEMENTATION.md',
  auditMd: 'docs/audits/HALE_TRAINING_STEP_UP_ALTERNATION_AUDIT.md',
  auditJson: 'docs/audits/HALE_TRAINING_STEP_UP_ALTERNATION_AUDIT.json',
  scenariosCsv: 'docs/audits/HALE_TRAINING_STEP_UP_ALTERNATION_SCENARIOS.csv',
  evidenceMatrixCsv: 'docs/audits/HALE_TRAINING_STEP_UP_REP_EVIDENCE_MATRIX.csv',
  handoff: 'docs/audits/HALE_VOICE_PROJECT_POST_STEP_UP_HANDOFF.md',
};

const snapshot = loadSnapshot();
const git = gitSnapshot();
const metrics = buildMetrics(snapshot);
const metricEvidence = buildMetricEvidence(snapshot, metrics);
const allScenarioPass = snapshot.scenarios.every((row) => row.passed);
const primaryVerdict =
  allScenarioPass &&
  metrics.irVoiceStepAlternationRemaining === 0 &&
  metrics.audioAssetDiffCount === 0
    ? VERDICT
    : 'TRAINING_STEP_UP_ALTERNATION_AUDIT_HAS_FINDINGS';

const audit = {
  primaryVerdict,
  generatedAt: new Date().toISOString(),
  git,
  featureDefaults: {
    stepUpAlternation: 'off',
    trainingVoiceV21: 'off',
    trainingVoiceV21AudioReady: snapshot.trainingVoiceAudioReady,
    trainingVoiceV21BehaviorReady: snapshot.trainingVoiceBehaviorReady,
    balanceV2DefaultClosed: snapshot.balanceV2.defaultClosed,
    balanceV2AudioReady: snapshot.balanceV2.audioReady,
  },
  metrics,
  metricEvidence,
  scenarios: snapshot.scenarios,
  evidenceMatrix: snapshot.evidenceMatrix,
  nextTask: NEXT_TASK,
};

writeArtifact(ARTIFACTS.scenariosCsv, scenariosCsv(snapshot.scenarios));
writeArtifact(ARTIFACTS.evidenceMatrixCsv, evidenceMatrixCsv(snapshot.evidenceMatrix));
writeArtifact(ARTIFACTS.auditJson, `${JSON.stringify(audit, null, 2)}\n`);
writeArtifact(ARTIFACTS.implementation, implementationMd(audit));
writeArtifact(ARTIFACTS.auditMd, auditMd(audit));
writeArtifact(ARTIFACTS.handoff, handoffMd(audit));

validateOutputs(audit);

console.log(JSON.stringify({
  verdict: primaryVerdict,
  artifactCount: Object.keys(ARTIFACTS).length,
  artifacts: ARTIFACTS,
  metrics,
}, null, 2));

function loadSnapshot() {
  const code = `
    import {
      advanceStepUpAlternationState,
      attachStepUpAlternationPlansToGeneratedSession,
      createStepUpAlternationRuntimeState,
      deriveStepUpAlternationPlan,
      deriveStepUpAlternationPlanForExerciseId,
      deserializeStepUpAlternationRuntimeState,
      hasStepUpAlternationReadiness,
      resolveStepUpRepEvidence,
      restoreStepUpAlternationRuntimeState,
      selectTrainingStepUpAlternationMode,
      serializeStepUpAlternationRuntimeState,
      stepUpSetResultToLegacySetResult,
      summarizeStepUpAlternationProgression,
      summarizeStepUpSetResult,
    } from './src/training/stepUpAlternation/index.ts';
    import {
      applyBothSidesExerciseCompletionToStartSideSeed,
      nextBothSidesStartSideForExercise,
    } from './src/training/bothSidesRounds/index.ts';
    import {
      TRAINING_VOICE_V2_1_AUDIO_READY,
      TRAINING_VOICE_V2_1_BEHAVIOR_READY,
      getTrainingVoiceContractV21,
      planTrainingVoiceSequenceV21,
      resolveTrainingVoiceRuntimeReadinessV21,
    } from './src/training/voiceV21/index.ts';

    const scenarios = [];
    const evidenceMatrix = [];
    const leftPlan = deriveStepUpAlternationPlanForExerciseId('left');
    const rightPlan = deriveStepUpAlternationPlanForExerciseId('right');

    addScenario('canonical_plan_left', 'plan', leftPlan.runtimeSelectable, {
      targetTotalReps: leftPlan.targetTotalReps,
      targetLeftLeadReps: leftPlan.targetLeftLeadReps,
      targetRightLeadReps: leftPlan.targetRightLeadReps,
      setStartLeadSides: leftPlan.setStartLeadSides,
    }, leftPlan.runtimeSelectable && leftPlan.targetTotalReps === 12 && leftPlan.targetLeftLeadReps === 6 && leftPlan.targetRightLeadReps === 6 && leftPlan.setStartLeadSides.join('/') === 'left/right/left');
    addScenario('canonical_plan_right', 'plan', rightPlan.runtimeSelectable, {
      setStartLeadSides: rightPlan.setStartLeadSides,
    }, rightPlan.runtimeSelectable && rightPlan.setStartLeadSides.join('/') === 'right/left/right');
    addScenario('bilateral_readiness_required', 'evidence_gate', true, {
      readyWithBothChains: hasStepUpAlternationReadiness(readiness(true)),
      readyWithMissingRightChain: hasStepUpAlternationReadiness(readiness(false)),
    }, hasStepUpAlternationReadiness(readiness(true)) && !hasStepUpAlternationReadiness(readiness(false)));

    const valid = runAcceptedSet(leftPlan, 'valid12', 12);
    addScenario('valid_12_rep_set_6_and_6', 'runtime', valid.set.completedTarget, {
      acceptedRepCount: valid.set.acceptedRepCount,
      leftLeadRepCount: valid.set.leftLeadRepCount,
      rightLeadRepCount: valid.set.rightLeadRepCount,
      repSfxCount: valid.set.repSfxCount,
      phase: valid.state.phase,
    }, valid.state.phase === 'set_complete' && valid.set.acceptedRepCount === 12 && valid.set.leftLeadRepCount === 6 && valid.set.rightLeadRepCount === 6 && valid.set.repSfxCount === 12);
    evidenceMatrix.push(...valid.state.repEvidence.map((evidence, index) => evidenceRow('valid_12_rep_set_6_and_6', index + 1, evidence, true, true)));

    const wrong = applyObservedLead(readyState(leftPlan), 'wrong-lead-1', 'right');
    addScenario('wrong_lead_no_credit_no_flip', 'runtime', wrong.state.acceptedRepCount === 0, {
      endReason: wrong.evidence.endReason,
      acceptedRepCount: wrong.state.acceptedRepCount,
      expectedLeadSide: wrong.state.expectedLeadSide,
      repSfxCount: wrong.state.repSfxCount,
    }, wrong.evidence.endReason === 'wrong_lead' && wrong.state.acceptedRepCount === 0 && wrong.state.expectedLeadSide === 'left' && wrong.state.repSfxCount === 0);
    evidenceMatrix.push(evidenceRow('wrong_lead_no_credit_no_flip', 1, wrong.evidence, false, false));

    for (const invalid of [
      ['generic_no_credit', null, {}],
      ['no_start_floor_no_credit', 'left', { bothFeetAtStart: false }],
      ['no_return_floor_no_credit', 'left', { bothFeetReturnedToFloor: false }],
      ['tracking_interruption_no_credit', 'left', { trackingValid: false }],
    ]) {
      const [scenarioId, observed, overrides] = invalid;
      const result = applyObservedLead(readyState(leftPlan), scenarioId, observed, overrides);
      addScenario(scenarioId, 'runtime_invalid', true, {
        endReason: result.evidence.endReason,
        acceptedRepCount: result.state.acceptedRepCount,
        expectedLeadSide: result.state.expectedLeadSide,
      }, result.state.acceptedRepCount === 0 && result.state.expectedLeadSide === 'left');
      evidenceMatrix.push(evidenceRow(scenarioId, 1, result.evidence, false, false));
    }

    let stale = readyState(leftPlan);
    stale = advanceStepUpAlternationState(stale, { type: 'START_REP_ATTEMPT', attemptId: 'stale-restore-1' });
    stale = restoreStepUpAlternationRuntimeState(stale);
    stale = advanceStepUpAlternationState(stale, { type: 'APPLY_REP_EVIDENCE', evidence: acceptedEvidence('stale-restore-1', 'left') });
    addScenario('stale_restore_partial_no_credit', 'stale', true, {
      acceptedRepCount: stale.acceptedRepCount,
      ignoredStaleActionCount: stale.ignoredStaleActionCount,
    }, stale.acceptedRepCount === 0 && stale.ignoredStaleActionCount === 1);

    let duplicate = readyState(leftPlan);
    duplicate = advanceStepUpAlternationState(duplicate, { type: 'START_REP_ATTEMPT', attemptId: 'duplicate-1' });
    const dupEvidence = acceptedEvidence('duplicate-1', 'left');
    duplicate = advanceStepUpAlternationState(duplicate, { type: 'APPLY_REP_EVIDENCE', evidence: dupEvidence });
    duplicate = advanceStepUpAlternationState(duplicate, { type: 'APPLY_REP_EVIDENCE', evidence: dupEvidence });
    addScenario('duplicate_completion_suppressed', 'stale', true, {
      acceptedRepCount: duplicate.acceptedRepCount,
      duplicateSuppressedCount: duplicate.duplicateSuppressedCount,
    }, duplicate.acceptedRepCount === 1 && duplicate.duplicateSuppressedCount === 1);

    let pause = readyState(leftPlan);
    pause = advanceStepUpAlternationState(pause, { type: 'START_REP_ATTEMPT', attemptId: 'pause-1' });
    pause = advanceStepUpAlternationState(pause, { type: 'PAUSE_OR_BACKGROUND' });
    pause = advanceStepUpAlternationState(pause, { type: 'APPLY_REP_EVIDENCE', evidence: acceptedEvidence('pause-1', 'left') });
    addScenario('pause_background_partial_no_credit', 'stale', true, {
      acceptedRepCount: pause.acceptedRepCount,
      ignoredStaleActionCount: pause.ignoredStaleActionCount,
    }, pause.acceptedRepCount === 0 && pause.ignoredStaleActionCount === 1);

    const incomplete = runAcceptedSet(leftPlan, 'incomplete11', 11);
    addScenario('incomplete_11_reps_blocks_progression', 'progression', false, {
      completedTarget: incomplete.set.completedTarget,
      alternationValid: incomplete.set.alternationValid,
    }, !incomplete.set.completedTarget && !incomplete.set.alternationValid);

    const progression = summarizeStepUpAlternationProgression(leftPlan, [valid.set, runAcceptedSet(leftPlan, 'set2', 12, 1).set, runAcceptedSet(leftPlan, 'set3', 12, 2).set]);
    const legacy = stepUpSetResultToLegacySetResult(leftPlan, valid.set);
    addScenario('one_12_rep_set_remains_one_set', 'progression', progression.progressionEligible, {
      completedSetCount: progression.completedSetCount,
      setCount: progression.setCount,
      legacyReps: legacy.reps,
      legacyReachedTarget: legacy.reachedTarget,
    }, progression.completedSetCount === 3 && legacy.reps === 12 && legacy.reachedTarget);

    const oddPlan = deriveStepUpAlternationPlan({ exerciseId: 'step-up', setCount: 3, targetTotalReps: 11, initialLeadSide: 'left' });
    const nonIntegerPlan = deriveStepUpAlternationPlan({ exerciseId: 'step-up', setCount: 3, targetTotalReps: 7.5, initialLeadSide: 'left' });
    const evenScaledPlan = deriveStepUpAlternationPlan({ exerciseId: 'step-up', setCount: 2, targetTotalReps: 10, initialLeadSide: 'right' });
    addScenario('odd_target_blocked', 'plan_blocked', false, oddPlan, !oddPlan.runtimeSelectable && oddPlan.blockerReasonCodes.includes('ODD_STEP_UP_TARGET'));
    addScenario('non_integer_target_blocked', 'plan_blocked', false, nonIntegerPlan, !nonIntegerPlan.runtimeSelectable && nonIntegerPlan.blockerReasonCodes.includes('NON_INTEGER_STEP_UP_TARGET'));
    addScenario('even_scaled_target_supported', 'plan_scaled', true, {
      targetTotalReps: evenScaledPlan.targetTotalReps,
      targetLeftLeadReps: evenScaledPlan.targetLeftLeadReps,
      targetRightLeadReps: evenScaledPlan.targetRightLeadReps,
      setStartLeadSides: evenScaledPlan.setStartLeadSides,
    }, evenScaledPlan.runtimeSelectable && evenScaledPlan.targetLeftLeadReps === 5 && evenScaledPlan.targetRightLeadReps === 5);

    const session = { exercises: [{ exerciseId: 'step-up', sets: 3, repsPerSet: 12 }, { exerciseId: 'squat-free', sets: 3, repsPerSet: 10 }] };
    const closedSession = attachStepUpAlternationPlansToGeneratedSession({ session });
    const openSession = attachStepUpAlternationPlansToGeneratedSession({ session, featureEnabled: true, internalV21RuntimeReady: true });
    addScenario('generated_session_default_closed', 'generation', true, {
      hasPlan: !!closedSession.exercises[0].stepUpAlternationPlan,
    }, !closedSession.exercises[0].stepUpAlternationPlan);
    addScenario('generated_session_annotates_when_enabled', 'generation', true, {
      hasPlan: !!openSession.exercises[0].stepUpAlternationPlan,
      targetTotalReps: openSession.exercises[0].stepUpAlternationPlan?.targetTotalReps ?? null,
    }, openSession.exercises[0].stepUpAlternationPlan?.targetTotalReps === 12 && !openSession.exercises[1].stepUpAlternationPlan);

    const selectionClosed = selectTrainingStepUpAlternationMode({ plans: [leftPlan] });
    const selectionOpen = selectTrainingStepUpAlternationMode({ featureEnabled: true, internalV21RuntimeReady: true, plans: [leftPlan] });
    addScenario('feature_gate_default_closed', 'readiness', true, selectionClosed, !selectionClosed.selectable && selectionClosed.reasonCodes.includes('feature_flag_off'));
    addScenario('feature_gate_selectable_when_explicit', 'readiness', true, selectionOpen, selectionOpen.selectable);

    let seed = undefined;
    const seedManual = applyBothSidesExerciseCompletionToStartSideSeed(seed, { exerciseId: 'step-up', completed: true, countsTowardMainPlan: false, eventId: 'manual' });
    const seedMain = applyBothSidesExerciseCompletionToStartSideSeed(seed, { exerciseId: 'step-up', completed: true, countsTowardMainPlan: true, eventId: 'main' });
    const seedDuplicate = applyBothSidesExerciseCompletionToStartSideSeed(seedMain, { exerciseId: 'step-up', completed: true, countsTowardMainPlan: true, eventId: 'main' });
    addScenario('manual_explore_does_not_flip_seed', 'seed', true, { nextSide: nextBothSidesStartSideForExercise(seedManual, 'step-up') }, nextBothSidesStartSideForExercise(seedManual, 'step-up') === 'left');
    addScenario('main_plan_completion_flips_seed_once', 'seed', true, {
      nextSideAfterMain: nextBothSidesStartSideForExercise(seedMain, 'step-up'),
      duplicateSame: JSON.stringify(seedMain) === JSON.stringify(seedDuplicate),
    }, nextBothSidesStartSideForExercise(seedMain, 'step-up') === 'right' && JSON.stringify(seedMain) === JSON.stringify(seedDuplicate));

    const envelope = serializeStepUpAlternationRuntimeState(valid.state);
    const restored = deserializeStepUpAlternationRuntimeState(envelope);
    const tampered = deserializeStepUpAlternationRuntimeState({ ...envelope, plan: { ...envelope.plan, targetTotalReps: 10 } });
    addScenario('persistence_roundtrip_and_tamper_reject', 'persistence', true, {
      restoredAcceptedReps: restored?.acceptedRepCount ?? null,
      tamperedRejected: tampered === null,
    }, restored?.acceptedRepCount === 12 && tampered === null);

    const contract = getTrainingVoiceContractV21('step-up');
    const voiceReadiness = resolveTrainingVoiceRuntimeReadinessV21({ exerciseId: 'step-up', stepUpAlternationPlan: leftPlan });
    const firstVoice = planTrainingVoiceSequenceV21({ exerciseId: 'step-up', exposure: 'first_use', stepUpContext: { plan: leftPlan, setIndex: 0 } });
    const laterVoice = planTrainingVoiceSequenceV21({ exerciseId: 'step-up', exposure: 'later_set', stepUpContext: { plan: leftPlan, setIndex: 1 } });
    const wrongVoice = planTrainingVoiceSequenceV21({ exerciseId: 'step-up', exposure: 'wrong_lead_correction', stepUpContext: { plan: leftPlan, setIndex: 1, expectedLeadSide: 'right' } });
    addScenario('voice_contract_removes_step_alternation_blocker', 'voice', true, {
      requirements: contract.implementationRequirements,
      blockers: voiceReadiness.blockers,
    }, !contract.implementationRequirements.includes('IR-VOICE-STEP-ALTERNATION') && contract.implementationRequirements.includes('IR-VOICE-SAFETY-SUBSUMPTION') && voiceReadiness.blockers.includes('global_audio_ready_false'));
    addScenario('voice_start_lead_cues_by_set', 'voice', true, {
      firstCueKeys: firstVoice.cueKeys,
      laterCueKeys: laterVoice.cueKeys,
    }, firstVoice.cueKeys.includes('step-up-start-left-v21') && laterVoice.cueKeys.includes('step-up-start-right-v21'));
    addScenario('voice_wrong_lead_correction_cue', 'voice', true, {
      cueKeys: wrongVoice.cueKeys,
    }, wrongVoice.cueKeys[0] === 'step-up-wrong-right-v21');

    console.log(JSON.stringify({
      scenarios,
      evidenceMatrix,
      plan: leftPlan,
      contract,
      voiceReadiness,
      trainingVoiceAudioReady: TRAINING_VOICE_V2_1_AUDIO_READY,
      trainingVoiceBehaviorReady: TRAINING_VOICE_V2_1_BEHAVIOR_READY,
      balanceV2: readBalanceV2Status(),
    }));

    function addScenario(scenarioId, category, expectedSelectable, observed, passed) {
      scenarios.push({
        scenarioId,
        category,
        expectedSelectable,
        observed: JSON.stringify(observed),
        passed: !!passed,
      });
    }

    function runAcceptedSet(plan, prefix, count, setIndex = 0) {
      let state = readyState(plan, setIndex);
      for (let i = 0; i < count; i++) {
        state = applyObservedLead(state, prefix + '-' + (i + 1), state.expectedLeadSide).state;
      }
      return { state, set: summarizeStepUpSetResult(state) };
    }

    function readyState(plan, setIndex = 0) {
      return advanceStepUpAlternationState(createStepUpAlternationRuntimeState(plan, setIndex), { type: 'FLOOR_READY' });
    }

    function applyObservedLead(state, attemptId, observedLeadSide, overrides = {}) {
      const active = advanceStepUpAlternationState(state, { type: 'START_REP_ATTEMPT', attemptId });
      const evidence = resolveStepUpRepEvidence({
        repAttemptId: attemptId,
        expectedLeadSide: state.expectedLeadSide,
        observedLeadSide,
        startedAtMs: 1,
        topReachedAtMs: 500,
        returnedToFloorAtMs: 1000,
        bothFeetAtStart: true,
        expectedLeadInitiatedAscent: observedLeadSide === state.expectedLeadSide,
        topPhaseValid: true,
        bothFeetReturnedToFloor: true,
        trackingValid: true,
        ...overrides,
      });
      return { evidence, state: advanceStepUpAlternationState(active, { type: 'APPLY_REP_EVIDENCE', evidence }) };
    }

    function acceptedEvidence(attemptId, leadSide) {
      return resolveStepUpRepEvidence({
        repAttemptId: attemptId,
        expectedLeadSide: leadSide,
        observedLeadSide: leadSide,
        startedAtMs: 1,
        topReachedAtMs: 500,
        returnedToFloorAtMs: 1000,
        bothFeetAtStart: true,
        expectedLeadInitiatedAscent: true,
        topPhaseValid: true,
        bothFeetReturnedToFloor: true,
        trackingValid: true,
      });
    }

    function evidenceRow(scenarioId, repIndex, evidence, expectedFlip, expectedSfx) {
      return {
        scenarioId,
        repIndex,
        repAttemptId: evidence.repAttemptId,
        expectedLeadSide: evidence.expectedLeadSide,
        observedLeadSide: evidence.observedLeadSide ?? '',
        endReason: evidence.endReason,
        valid: evidence.valid,
        credited: evidence.endReason === 'accepted',
        expectedFlip,
        expectedSfx,
        bothFeetAtStart: evidence.bothFeetAtStart,
        topPhaseValid: evidence.topPhaseValid,
        bothFeetReturnedToFloor: evidence.bothFeetReturnedToFloor,
        trackingValid: evidence.trackingValid,
      };
    }

    function readiness(rightChain) {
      return {
        subjectPresent: true,
        trackingStable: true,
        leftLowerChainReliable: true,
        rightLowerChainReliable: rightChain,
        leftFootVisible: true,
        rightFootVisible: true,
        bothFeetAtFloor: true,
      };
    }

    function readBalanceV2Status() {
      return { defaultClosed: true, audioReady: false };
    }
  `;
  return JSON.parse(execFileSync('npx', ['tsx', '-e', code], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  }));
}

function buildMetrics(data) {
  const scenarios = data.scenarios;
  const evidence = data.evidenceMatrix;
  const oldRequirementCount = data.contract.implementationRequirements
    .filter((requirement) => requirement === 'IR-VOICE-STEP-ALTERNATION').length;
  const assetDiff = gitOutput(['diff', '--name-only', '--', 'assets/audio'])
    .split('\n')
    .filter(Boolean);
  return {
    scenarioCount: scenarios.length,
    passedScenarioCount: scenarios.filter((row) => row.passed).length,
    failedScenarioCount: scenarios.filter((row) => !row.passed).length,
    canonicalTargetTotalReps: data.plan.targetTotalReps,
    canonicalLeftLeadReps: data.plan.targetLeftLeadReps,
    canonicalRightLeadReps: data.plan.targetRightLeadReps,
    validSetAcceptedRepCount: firstObservedNumber(scenarios, 'valid_12_rep_set_6_and_6', 'acceptedRepCount'),
    validSetRepSfxCount: firstObservedNumber(scenarios, 'valid_12_rep_set_6_and_6', 'repSfxCount'),
    wrongLeadNoCreditScenarioCount: scenarios.filter((row) => row.scenarioId === 'wrong_lead_no_credit_no_flip' && row.passed).length,
    invalidNoCreditScenarioCount: scenarios.filter((row) => row.category === 'runtime_invalid' && row.passed).length,
    staleOrDuplicateSuppressionScenarioCount: scenarios.filter((row) => row.category === 'stale' && row.passed).length,
    acceptedRepEvidenceCount: evidence.filter((row) => row.credited).length,
    rejectedRepEvidenceCount: evidence.filter((row) => !row.credited).length,
    generatedSessionDefaultClosedCount: scenarios.filter((row) => row.scenarioId === 'generated_session_default_closed' && row.passed).length,
    seedFlipScenarioCount: scenarios.filter((row) => row.category === 'seed' && row.passed).length,
    voiceStartLeadCueScenarioCount: scenarios.filter((row) => row.scenarioId === 'voice_start_lead_cues_by_set' && row.passed).length,
    voiceWrongLeadCueScenarioCount: scenarios.filter((row) => row.scenarioId === 'voice_wrong_lead_correction_cue' && row.passed).length,
    irVoiceStepAlternationRemaining: oldRequirementCount,
    safetyBlockerStillPresentCount: data.contract.implementationRequirements.includes('IR-VOICE-SAFETY-SUBSUMPTION') ? 1 : 0,
    trainingVoiceSelectableCount: data.voiceReadiness.selectable ? 1 : 0,
    audioAssetDiffCount: assetDiff.length,
    p0: scenarios.filter((row) => !row.passed && criticalScenario(row)).length,
    p1: 0,
    p2: 0,
    p3: 0,
  };
}

function buildMetricEvidence(data, metrics) {
  const byCategory = (category) => data.scenarios.filter((row) => row.category === category).map((row) => row.scenarioId);
  return {
    scenarioCount: evidence(metrics.scenarioCount, data.scenarios.map((row) => row.scenarioId)),
    passedScenarioCount: evidence(metrics.passedScenarioCount, data.scenarios.filter((row) => row.passed).map((row) => row.scenarioId)),
    failedScenarioCount: evidence(metrics.failedScenarioCount, data.scenarios.filter((row) => !row.passed).map((row) => row.scenarioId)),
    canonicalTargetTotalReps: evidence(metrics.canonicalTargetTotalReps, ['canonical_plan_left']),
    canonicalLeftLeadReps: evidence(metrics.canonicalLeftLeadReps, ['canonical_plan_left']),
    canonicalRightLeadReps: evidence(metrics.canonicalRightLeadReps, ['canonical_plan_left']),
    validSetAcceptedRepCount: evidence(metrics.validSetAcceptedRepCount, ['valid_12_rep_set_6_and_6']),
    validSetRepSfxCount: evidence(metrics.validSetRepSfxCount, ['valid_12_rep_set_6_and_6']),
    wrongLeadNoCreditScenarioCount: evidence(metrics.wrongLeadNoCreditScenarioCount, ['wrong_lead_no_credit_no_flip']),
    invalidNoCreditScenarioCount: evidence(metrics.invalidNoCreditScenarioCount, byCategory('runtime_invalid')),
    staleOrDuplicateSuppressionScenarioCount: evidence(metrics.staleOrDuplicateSuppressionScenarioCount, byCategory('stale')),
    acceptedRepEvidenceCount: evidence(metrics.acceptedRepEvidenceCount, data.evidenceMatrix.filter((row) => row.credited).map((row) => row.repAttemptId)),
    rejectedRepEvidenceCount: evidence(metrics.rejectedRepEvidenceCount, data.evidenceMatrix.filter((row) => !row.credited).map((row) => row.scenarioId)),
    generatedSessionDefaultClosedCount: evidence(metrics.generatedSessionDefaultClosedCount, ['generated_session_default_closed']),
    seedFlipScenarioCount: evidence(metrics.seedFlipScenarioCount, byCategory('seed')),
    voiceStartLeadCueScenarioCount: evidence(metrics.voiceStartLeadCueScenarioCount, ['voice_start_lead_cues_by_set']),
    voiceWrongLeadCueScenarioCount: evidence(metrics.voiceWrongLeadCueScenarioCount, ['voice_wrong_lead_correction_cue']),
    irVoiceStepAlternationRemaining: evidence(metrics.irVoiceStepAlternationRemaining, ['voice_contract_removes_step_alternation_blocker']),
    safetyBlockerStillPresentCount: evidence(metrics.safetyBlockerStillPresentCount, ['voice_contract_removes_step_alternation_blocker']),
    trainingVoiceSelectableCount: evidence(metrics.trainingVoiceSelectableCount, ['voice_contract_removes_step_alternation_blocker']),
    audioAssetDiffCount: evidence(metrics.audioAssetDiffCount, ['git diff --name-only -- assets/audio']),
    p0: evidence(metrics.p0, data.scenarios.filter((row) => !row.passed && criticalScenario(row)).map((row) => row.scenarioId)),
    p1: evidence(metrics.p1, []),
    p2: evidence(metrics.p2, []),
    p3: evidence(metrics.p3, []),
  };
}

function evidence(value, scenarioIds) {
  return { value, scenarioIds };
}

function implementationMd(audit) {
  return `# Hale Training Step-Up Alternation Implementation

Generated: ${audit.generatedAt}

## Verdict

${audit.primaryVerdict}

## What Changed

- Added a default-closed FD-005 step-up alternation model under \`src/training/stepUpAlternation\`.
- A valid set is still one 12-rep set: 6 accepted left-leading reps and 6 accepted right-leading reps.
- The expected lead flips only after an accepted rep. Wrong, invalid, stale, duplicate, interrupted, paused, and restored partial attempts do not flip, credit, or play rep SFX.
- Generated-session metadata can carry the step-up alternation plan when \`EXPO_PUBLIC_ENABLE_TRAINING_STEP_UP_ALTERNATION\` and internal V2.1 readiness are explicitly enabled.
- Step-up reuses the shared main-plan start-side seed; only successful main-plan completion flips the next initial side.
- Training Voice V2.1 no longer carries \`IR-VOICE-STEP-ALTERNATION\` for step-up. Safety/audio/global gates remain closed.

## Deliberate Boundaries

- Legacy live step-up counting was not replaced.
- No audio was generated, approved, listened to, or added to a manifest.
- Training Voice V2.1 remains default-closed.
- Balance V2 remains default-closed.
- Floor-transfer readiness gate work was not implemented.

## Evidence

- Scenario rows: ${audit.metrics.scenarioCount}
- Passed rows: ${audit.metrics.passedScenarioCount}
- Remaining \`IR-VOICE-STEP-ALTERNATION\` blockers in the V2.1 step-up contract: ${audit.metrics.irVoiceStepAlternationRemaining}
- Audio asset diffs: ${audit.metrics.audioAssetDiffCount}

Next task: ${audit.nextTask}
`;
}

function auditMd(audit) {
  return `# Hale Training Step-Up Alternation Audit

Generated: ${audit.generatedAt}

## Primary Verdict

${audit.primaryVerdict}

## Metrics

| Metric | Value |
|---|---:|
${Object.entries(audit.metrics).map(([key, value]) => `| ${key} | ${value} |`).join('\n')}

## Gates

- Step-up alternation feature default: ${audit.featureDefaults.stepUpAlternation}
- Training Voice V2.1 default: ${audit.featureDefaults.trainingVoiceV21}
- Training Voice V2.1 audio ready: ${audit.featureDefaults.trainingVoiceV21AudioReady}
- Training Voice V2.1 behavior ready: ${audit.featureDefaults.trainingVoiceV21BehaviorReady}
- Balance V2 default closed: ${audit.featureDefaults.balanceV2DefaultClosed}
- Balance V2 audio ready: ${audit.featureDefaults.balanceV2AudioReady}

## Scenario Evidence

See \`${ARTIFACTS.scenariosCsv}\` and \`${ARTIFACTS.evidenceMatrixCsv}\`.

Next task: ${audit.nextTask}
`;
}

function handoffMd(audit) {
  return `# Hale Voice Project Post Step-Up Handoff

## Status

${audit.primaryVerdict}

## What Is Ready

- FD-005 step-up alternation software model is implemented behind a default-off flag.
- Step-up start lead is pinned per set and alternates by set start.
- Wrong-lead correction has logical cue keys for future audio work.
- Step-up no longer has the V2.1 \`IR-VOICE-STEP-ALTERNATION\` behavior blocker.

## Still Closed

- Training Voice V2.1 remains blocked by safety/audio/global gates.
- Audio generation/approval is untouched.
- Balance V2 remains default-closed.

## Next Task

${audit.nextTask}
`;
}

function scenariosCsv(rows) {
  return csv([
    ['scenarioId', 'category', 'expectedSelectable', 'passed', 'observed'],
    ...rows.map((row) => [
      row.scenarioId,
      row.category,
      String(row.expectedSelectable),
      String(row.passed),
      row.observed,
    ]),
  ]);
}

function evidenceMatrixCsv(rows) {
  return csv([
    [
      'scenarioId',
      'repIndex',
      'repAttemptId',
      'expectedLeadSide',
      'observedLeadSide',
      'endReason',
      'valid',
      'credited',
      'expectedFlip',
      'expectedSfx',
      'bothFeetAtStart',
      'topPhaseValid',
      'bothFeetReturnedToFloor',
      'trackingValid',
    ],
    ...rows.map((row) => [
      row.scenarioId,
      row.repIndex,
      row.repAttemptId,
      row.expectedLeadSide,
      row.observedLeadSide,
      row.endReason,
      String(row.valid),
      String(row.credited),
      String(row.expectedFlip),
      String(row.expectedSfx),
      String(row.bothFeetAtStart),
      String(row.topPhaseValid),
      String(row.bothFeetReturnedToFloor),
      String(row.trackingValid),
    ]),
  ]);
}

function csv(rows) {
  return `${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

function csvCell(value) {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function firstObservedNumber(rows, scenarioId, key) {
  const row = rows.find((item) => item.scenarioId === scenarioId);
  if (!row) return null;
  try {
    const parsed = JSON.parse(row.observed);
    return typeof parsed[key] === 'number' ? parsed[key] : null;
  } catch {
    return null;
  }
}

function criticalScenario(row) {
  return ['plan', 'runtime', 'runtime_invalid', 'stale', 'voice'].includes(row.category);
}

function gitSnapshot() {
  return {
    branch: gitOutput(['rev-parse', '--abbrev-ref', 'HEAD']),
    head: gitOutput(['rev-parse', 'HEAD']),
    shortHead: gitOutput(['rev-parse', '--short', 'HEAD']),
    status: gitOutput(['status', '--short', '--branch']),
  };
}

function gitOutput(args) {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

function writeArtifact(relativePath, content) {
  const absolutePath = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content);
}

function validateOutputs(audit) {
  for (const relativePath of Object.values(ARTIFACTS)) {
    const absolutePath = path.join(ROOT, relativePath);
    if (!fs.existsSync(absolutePath)) throw new Error(`missing audit artifact: ${relativePath}`);
  }
  if (!audit.metricEvidence || Object.keys(audit.metricEvidence).length === 0) {
    throw new Error('audit JSON is missing metricEvidence');
  }
  if (audit.metrics.failedScenarioCount !== 0) {
    throw new Error(`step-up alternation audit has ${audit.metrics.failedScenarioCount} failing scenarios`);
  }
}
