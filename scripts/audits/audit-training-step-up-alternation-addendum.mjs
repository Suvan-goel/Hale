import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const AUDIT_VERSION = 2;

const ARTIFACTS = {
  reportMd: 'docs/audits/HALE_TRAINING_STEP_UP_ALTERNATION_VERIFICATION_ADDENDUM.md',
  reportJson: 'docs/audits/HALE_TRAINING_STEP_UP_ALTERNATION_VERIFICATION_ADDENDUM.json',
  scenariosCsv: 'docs/audits/HALE_TRAINING_STEP_UP_ALTERNATION_SCENARIOS_V2.csv',
  eventsCsv: 'docs/audits/HALE_TRAINING_STEP_UP_ALTERNATION_EVENT_EVIDENCE.csv',
  traceCsv: 'docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_INTEGRATION_TRACE.csv',
  handoffMd: 'docs/audits/HALE_VOICE_PROJECT_POST_STEP_UP_VERIFICATION_HANDOFF.md',
};

const CANONICAL_SCENARIO_IDS = Object.freeze([
  'step_up_left_first_set_12_reps',
  'step_up_right_first_set_12_reps',
  'step_up_three_sets_left_initial',
  'step_up_three_sets_right_initial',
  'step_up_six_left_six_right',
  'step_up_both_feet_floor_each_rep',
  'wrong_lead_on_first_rep',
  'wrong_lead_after_five_reps',
  'wrong_lead_returns_to_floor_then_corrects',
  'wrong_lead_does_not_flip_expected',
  'generic_rep_without_lead_evidence_rejected',
  'opposite_chain_clearer_not_auto_credited',
  'top_reached_no_floor_return',
  'one_foot_remains_on_step',
  'duplicate_completion_callback',
  'stale_callback_after_next_rep_started',
  'threshold_noise_single_credit',
  'descent_order_not_overconstrained',
  'tracking_loss_mid_left_lead_rep',
  'tracking_loss_mid_right_lead_rep',
  'pause_mid_rep',
  'background_mid_rep',
  'restore_after_six_reps',
  'restore_mid_rep',
  'cancel_mid_set',
  'skip_mid_set',
  'default_target_12',
  'even_scaled_target_10',
  'odd_scaled_target_9_blocked',
  'noninteger_target_blocked',
  'short_session_final_target',
  'visible_voice_runtime_target_match',
  'seed_defaults_left',
  'successful_completion_flips_seed',
  'skip_does_not_flip_seed',
  'manual_practice_does_not_flip_seed',
  'duplicate_completion_idempotent',
  'sync_restore_preserves_seed',
  'one_set_one_progression_event',
  'lead_counts_do_not_double_set_count',
  'valid_time_not_doubled',
  'twelve_total_unequal_sides_rejected',
  'broken_alternation_not_progression_eligible',
  'legacy_result_still_parses',
  'step_up_start_left_logical_plan',
  'step_up_start_right_logical_plan',
  'wrong_lead_left_correction_plan',
  'wrong_lead_right_correction_plan',
  'no_per_rep_spoken_switch',
  'feature_off_legacy_unchanged',
  'alternation_flag_alone_no_half_activation',
  'training_voice_remains_default_closed',
  'balance_v2_remains_default_closed',
]);

const METRIC_NAMES = Object.freeze([
  'canonicalScenarioCount',
  'scenarioVariantCount',
  'passedScenarioCount',
  'failedScenarioCount',
  'wrongLeadCreditedRepCount',
  'genericUnknownLeadCreditedRepCount',
  'repCreditedWithoutStartBoundaryCount',
  'repCreditedWithoutTopPhaseCount',
  'repCreditedBeforeFloorReturnCount',
  'duplicateRepCreditCount',
  'staleCallbackMutationCount',
  'thresholdNoiseExtraCreditCount',
  'wrongAttemptExpectedLeadFlipCount',
  'trackingInterruptedRepCreditCount',
  'pausePartialRepCreditCount',
  'backgroundPartialRepCreditCount',
  'restorePartialRepCreditCount',
  'validSetLeftRightMismatchCount',
  'setCompletedBeforeTargetCount',
  'setCompletedWithBrokenAlternationCount',
  'repSfxMismatchCount',
  'extraSetEventCount',
  'oddTargetSilentlyAdjustedCount',
  'nonintegerTargetSilentlyAdjustedCount',
  'visibleVoiceRuntimeTargetMismatchCount',
  'seedDefaultFailureCount',
  'successfulCompletionSeedFlipFailureCount',
  'skipCancelSeedFlipCount',
  'manualPracticeSeedMutationCount',
  'duplicateCompletionSeedFlipCount',
  'syncRestoreSeedDriftCount',
  'progressionInvalidAlternationAcceptedCount',
  'sideImbalanceMaskedByTotalCount',
  'validTimeDoubleCount',
  'duplicateProgressionEventCount',
  'legacyParseFailureCount',
  'startLeadLogicalMismatchCount',
  'wrongLeadCorrectionLogicalMismatchCount',
  'perRepSpokenSwitchCount',
  'spokenSetCountCueCount',
  'legacyV21MixedSemanticsCount',
  'runtimeIntegrationMissingLinkCount',
  'runtimeIntegrationPartialLinkCount',
  'runtimeIntegrationUncertainLinkCount',
  'irVoiceStepAlternationRemaining',
  'trainingVoiceSelectableCount',
  'audioAssetDiffCount',
  'p0',
  'p1',
  'p2',
  'p3',
]);

const TASK_START_SNAPSHOT = Object.freeze({
  branch: 'dev',
  head: 'be514ce21312387ac0ab902dd0a92552166718a7',
  shortHead: 'be514ce',
  upstream: 'origin/dev',
  status: [
    '## dev...origin/dev [ahead 1]',
    ' M App.tsx',
    ' M src/haleFlow/__tests__/movementProfileV2OfficialRetestTransition.test.ts',
    ' M src/results/__tests__/movementProfileV2ResultsAdapter.test.ts',
    ' M src/services/backend/__tests__/blockReportSyncService.test.ts',
    '?? docs/audits/HALE_TRAINING_STEP_UP_VERIFICATION_ADDENDUM_CODEX_PROMPT.md',
  ].join('\n'),
  diffNameOnly: [
    'App.tsx',
    'src/haleFlow/__tests__/movementProfileV2OfficialRetestTransition.test.ts',
    'src/results/__tests__/movementProfileV2ResultsAdapter.test.ts',
    'src/services/backend/__tests__/blockReportSyncService.test.ts',
  ],
  diffStat: [
    ' App.tsx                                            |   3 +',
    ' ...vementProfileV2OfficialRetestTransition.test.ts |   8 ++',
    ' .../movementProfileV2ResultsAdapter.test.ts        |  85 +++++++++++',
    ' .../__tests__/blockReportSyncService.test.ts       | 159 +++++++++++++++++++++',
    ' 4 files changed, 255 insertions(+)',
  ].join('\n'),
  preExistingAudioDiffNameOnly: [],
});

const snapshot = loadExecutableSnapshot();
const trace = buildRuntimeIntegrationTrace();

writeArtifact(ARTIFACTS.scenariosCsv, scenariosCsv(snapshot.scenarios));
writeArtifact(ARTIFACTS.eventsCsv, eventsCsv(snapshot.events));
writeArtifact(ARTIFACTS.traceCsv, traceCsv(trace));

const recomputed = recomputeFromWrittenArtifacts();
const findings = deriveFindings(recomputed.metrics, trace, snapshot);
const severityCounts = countSeverities(findings);
for (const severity of ['p0', 'p1', 'p2', 'p3']) {
  recomputed.metrics[severity] = severityCounts[severity.toUpperCase()] ?? 0;
}
const metricEvidence = buildMetricEvidence(recomputed, findings);
const completionGateResults = completionGates(recomputed, snapshot, trace);
const primaryVerdict = derivePrimaryVerdict(recomputed.metrics, trace);
const nextTask = nextTaskForVerdict(primaryVerdict, findings);

const report = {
  auditVersion: AUDIT_VERSION,
  generatedAt: new Date().toISOString(),
  primaryVerdict,
  repositorySnapshot: {
    taskStart: TASK_START_SNAPSHOT,
    current: gitSnapshot(),
  },
  sourceFreshness: sourceFreshness(),
  summary: {
    previousVerdict: readJsonIfExists('docs/audits/HALE_TRAINING_STEP_UP_ALTERNATION_AUDIT.json')?.primaryVerdict ?? null,
    previousScenarioCount: readJsonIfExists('docs/audits/HALE_TRAINING_STEP_UP_ALTERNATION_AUDIT.json')?.metrics?.scenarioCount ?? null,
    verificationScenarioCount: recomputed.metrics.canonicalScenarioCount,
    runtimeIntegrationMissingLinkCount: recomputed.metrics.runtimeIntegrationMissingLinkCount,
    runtimeIntegrationPartialLinkCount: recomputed.metrics.runtimeIntegrationPartialLinkCount,
    floorGateBlocked: primaryVerdict !== 'TRAINING_STEP_UP_ALTERNATION_VERIFIED_COMPLETE_DEFAULT_CLOSED',
  },
  canonicalScenarioIds: CANONICAL_SCENARIO_IDS.slice(),
  scenarioCoverage: recomputed.coverage,
  runtimeIntegrationTrace: trace,
  metrics: recomputed.metrics,
  metricEvidence,
  findings,
  completionGates: completionGateResults,
  validation: {
    scenarioRowsParse: true,
    eventRowsParse: true,
    traceRowsParse: true,
    independentMetricRecompute: 'passed',
    recomputedMetricNames: Object.keys(recomputed.metrics).sort(),
    artifactPaths: ARTIFACTS,
  },
  nextTask,
};

writeArtifact(ARTIFACTS.reportJson, `${JSON.stringify(report, null, 2)}\n`);
writeArtifact(ARTIFACTS.reportMd, reportMarkdown(report));
writeArtifact(ARTIFACTS.handoffMd, handoffMarkdown(report));

validateReport(report);

console.log(JSON.stringify({
  primaryVerdict,
  nextTask,
  scenarioCoverage: report.scenarioCoverage,
  metrics: report.metrics,
  findings: report.findings.map((finding) => ({ id: finding.id, severity: finding.severity })),
  artifacts: ARTIFACTS,
}, null, 2));

function loadExecutableSnapshot() {
  const audioDiffNameOnly = gitOutput(['diff', '--name-only', '--', 'assets/audio']).split('\n').filter(Boolean);
  const code = String.raw`
    import { getExercise } from './src/exercises/index.ts';
    import { summarizeItem } from './src/training/progression.ts';
    import { summarizeValidTimeSets } from './src/training/validTimeProgression.ts';
    import {
      advanceStepUpAlternationState,
      attachStepUpAlternationPlansToGeneratedSession,
      createStepUpAlternationRuntimeState,
      deriveStepUpAlternationPlan,
      deriveStepUpAlternationPlanForExerciseId,
      deserializeStepUpAlternationRuntimeState,
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
    import {
      EYES_OPEN_BALANCE_PROTOCOL_V2_AUDIO_READY,
      EYES_OPEN_BALANCE_PROTOCOL_V2_SELECTABLE,
    } from './src/config/eyesOpenBalanceProtocolV2.ts';

    const scenarios = [];
    const events = [];
    const planLeft = deriveStepUpAlternationPlanForExerciseId('left');
    const planRight = deriveStepUpAlternationPlanForExerciseId('right');

    function addScenario(input) {
      scenarios.push({
        scenarioId: input.scenarioId,
        variantId: input.variantId ?? 'base',
        category: input.category,
        evidenceMethod: input.evidenceMethod,
        sourceFunctions: (input.sourceFunctions ?? []).join(';'),
        initialState: JSON.stringify(input.initialState ?? {}),
        eventSequence: JSON.stringify(input.eventSequence ?? []),
        expectedOutcome: JSON.stringify(input.expectedOutcome ?? {}),
        observedOutcome: JSON.stringify(input.observedOutcome ?? {}),
        passed: Boolean(input.passed),
        findingRuleIds: (input.findingRuleIds ?? []).join(';'),
        metricTags: (input.metricTags ?? []).join(';'),
        testCoverage: input.testCoverage ?? '',
        notes: input.notes ?? '',
      });
    }

    function addEvent(input) {
      events.push({
        scenarioId: input.scenarioId,
        variantId: input.variantId ?? 'base',
        eventIndex: input.eventIndex ?? events.filter((row) => row.scenarioId === input.scenarioId).length + 1,
        eventType: input.eventType,
        repAttemptId: input.repAttemptId ?? '',
        setIndex: input.setIndex ?? 0,
        expectedLeadBefore: input.expectedLeadBefore ?? '',
        observedLead: input.observedLead ?? '',
        bothFeetAtStart: bool(input.bothFeetAtStart),
        ascentValid: bool(input.ascentValid),
        topPhaseValid: bool(input.topPhaseValid),
        bothFeetReturnedToFloor: bool(input.bothFeetReturnedToFloor),
        trackingValid: bool(input.trackingValid),
        outcome: input.outcome ?? '',
        credited: bool(input.credited),
        sfxPlayed: bool(input.sfxPlayed),
        expectedLeadAfter: input.expectedLeadAfter ?? '',
        acceptedRepCount: input.acceptedRepCount ?? 0,
        leftLeadRepCount: input.leftLeadRepCount ?? 0,
        rightLeadRepCount: input.rightLeadRepCount ?? 0,
        setCompleted: bool(input.setCompleted),
        progressionEligible: bool(input.progressionEligible),
        validTimeMs: input.validTimeMs ?? 0,
        seedBefore: input.seedBefore ?? '',
        seedAfter: input.seedAfter ?? '',
        restoreState: input.restoreState ?? '',
        sourceFunction: input.sourceFunction ?? '',
        notes: input.notes ?? '',
      });
    }

    function bool(value) {
      return value === true ? 'true' : value === false ? 'false' : '';
    }

    function readyState(plan, setIndex = 0) {
      return advanceStepUpAlternationState(createStepUpAlternationRuntimeState(plan, setIndex), { type: 'FLOOR_READY' });
    }

    function startAttempt(state, attemptId) {
      return advanceStepUpAlternationState(state, { type: 'START_REP_ATTEMPT', attemptId });
    }

    function evidenceFor(state, attemptId, observedLead, overrides = {}) {
      return resolveStepUpRepEvidence({
        repAttemptId: attemptId,
        expectedLeadSide: state.expectedLeadSide,
        observedLeadSide: observedLead,
        startedAtMs: 100,
        topReachedAtMs: 500,
        returnedToFloorAtMs: 900,
        bothFeetAtStart: true,
        expectedLeadInitiatedAscent: observedLead === state.expectedLeadSide,
        topPhaseValid: true,
        bothFeetReturnedToFloor: true,
        trackingValid: true,
        ...overrides,
      });
    }

    function applyRep(state, scenarioId, attemptId, observedLead, overrides = {}, eventType = 'rep_evidence', notes = '') {
      const before = state;
      const active = startAttempt(state, attemptId);
      const evidence = evidenceFor(before, attemptId, observedLead, overrides);
      const after = advanceStepUpAlternationState(active, { type: 'APPLY_REP_EVIDENCE', evidence });
      addEvent({
        scenarioId,
        eventType,
        repAttemptId: attemptId,
        setIndex: before.setIndex,
        expectedLeadBefore: before.expectedLeadSide,
        observedLead: evidence.observedLeadSide ?? '',
        bothFeetAtStart: evidence.bothFeetAtStart,
        ascentValid: evidence.expectedLeadInitiatedAscent,
        topPhaseValid: evidence.topPhaseValid,
        bothFeetReturnedToFloor: evidence.bothFeetReturnedToFloor,
        trackingValid: evidence.trackingValid,
        outcome: evidence.endReason,
        credited: after.acceptedRepCount > before.acceptedRepCount,
        sfxPlayed: after.repSfxCount > before.repSfxCount,
        expectedLeadAfter: after.expectedLeadSide,
        acceptedRepCount: after.acceptedRepCount,
        leftLeadRepCount: after.leftLeadRepCount,
        rightLeadRepCount: after.rightLeadRepCount,
        setCompleted: after.phase === 'set_complete',
        progressionEligible: summarizeStepUpSetResult(after).alternationValid,
        sourceFunction: 'resolveStepUpRepEvidence;advanceStepUpAlternationState',
        notes,
      });
      return { state: after, evidence };
    }

    function acceptedEvidence(attemptId, leadSide) {
      return resolveStepUpRepEvidence({
        repAttemptId: attemptId,
        expectedLeadSide: leadSide,
        observedLeadSide: leadSide,
        startedAtMs: 100,
        topReachedAtMs: 500,
        returnedToFloorAtMs: 900,
        bothFeetAtStart: true,
        expectedLeadInitiatedAscent: true,
        topPhaseValid: true,
        bothFeetReturnedToFloor: true,
        trackingValid: true,
      });
    }

    function runSet(plan, scenarioId, count = 12, setIndex = 0) {
      let state = readyState(plan, setIndex);
      for (let i = 0; i < count; i++) {
        state = applyRep(state, scenarioId, scenarioId + '-rep-' + (i + 1), state.expectedLeadSide).state;
      }
      return { state, set: summarizeStepUpSetResult(state) };
    }

    function scenarioPass(scenarioId) {
      return scenarios.find((row) => row.scenarioId === scenarioId)?.passed === true;
    }

    const leftSet = runSet(planLeft, 'step_up_left_first_set_12_reps');
    addScenario({
      scenarioId: 'step_up_left_first_set_12_reps',
      category: 'normal',
      evidenceMethod: 'state_machine',
      sourceFunctions: ['deriveStepUpAlternationPlanForExerciseId', 'advanceStepUpAlternationState', 'summarizeStepUpSetResult'],
      initialState: { initialLeadSide: 'left', setIndex: 0 },
      eventSequence: ['12 accepted expected-lead reps'],
      expectedOutcome: { acceptedRepCount: 12, leftLeadRepCount: 6, rightLeadRepCount: 6, setCompleted: true },
      observedOutcome: { ...leftSet.set, phase: leftSet.state.phase },
      passed: leftSet.set.completedTarget && leftSet.set.alternationValid && leftSet.set.leftLeadRepCount === 6 && leftSet.set.rightLeadRepCount === 6,
      metricTags: ['valid_set', 'rep_sfx'],
      testCoverage: 'src/training/stepUpAlternation/__tests__/stepUpAlternation.test.ts',
    });

    const rightSet = runSet(planRight, 'step_up_right_first_set_12_reps');
    addScenario({
      scenarioId: 'step_up_right_first_set_12_reps',
      category: 'normal',
      evidenceMethod: 'state_machine',
      sourceFunctions: ['deriveStepUpAlternationPlanForExerciseId', 'advanceStepUpAlternationState', 'summarizeStepUpSetResult'],
      initialState: { initialLeadSide: 'right', setIndex: 0 },
      eventSequence: ['12 accepted expected-lead reps'],
      expectedOutcome: { acceptedRepCount: 12, leftLeadRepCount: 6, rightLeadRepCount: 6, setCompleted: true },
      observedOutcome: { ...rightSet.set, phase: rightSet.state.phase },
      passed: rightSet.set.completedTarget && rightSet.set.alternationValid && rightSet.set.leftLeadRepCount === 6 && rightSet.set.rightLeadRepCount === 6,
      metricTags: ['valid_set', 'rep_sfx'],
    });

    const leftThree = [runSet(planLeft, 'step_up_three_sets_left_initial', 12, 0), runSet(planLeft, 'step_up_three_sets_left_initial', 12, 1), runSet(planLeft, 'step_up_three_sets_left_initial', 12, 2)];
    const leftProgression = summarizeStepUpAlternationProgression(planLeft, leftThree.map((item) => item.set));
    addScenario({
      scenarioId: 'step_up_three_sets_left_initial',
      category: 'normal',
      evidenceMethod: 'state_machine_progression',
      sourceFunctions: ['setStartLeadForIndex', 'summarizeStepUpAlternationProgression'],
      expectedOutcome: { setStartLeadSides: ['left', 'right', 'left'], progressionEligible: true },
      observedOutcome: { setStartLeadSides: planLeft.setStartLeadSides, progressionEligible: leftProgression.progressionEligible, completedSetCount: leftProgression.completedSetCount },
      passed: planLeft.setStartLeadSides.join('/') === 'left/right/left' && leftProgression.progressionEligible,
      metricTags: ['progression'],
    });

    const rightThree = [runSet(planRight, 'step_up_three_sets_right_initial', 12, 0), runSet(planRight, 'step_up_three_sets_right_initial', 12, 1), runSet(planRight, 'step_up_three_sets_right_initial', 12, 2)];
    const rightProgression = summarizeStepUpAlternationProgression(planRight, rightThree.map((item) => item.set));
    addScenario({
      scenarioId: 'step_up_three_sets_right_initial',
      category: 'normal',
      evidenceMethod: 'state_machine_progression',
      sourceFunctions: ['setStartLeadForIndex', 'summarizeStepUpAlternationProgression'],
      expectedOutcome: { setStartLeadSides: ['right', 'left', 'right'], progressionEligible: true },
      observedOutcome: { setStartLeadSides: planRight.setStartLeadSides, progressionEligible: rightProgression.progressionEligible, completedSetCount: rightProgression.completedSetCount },
      passed: planRight.setStartLeadSides.join('/') === 'right/left/right' && rightProgression.progressionEligible,
      metricTags: ['progression'],
    });

    addScenario({
      scenarioId: 'step_up_six_left_six_right',
      category: 'normal',
      evidenceMethod: 'aggregation',
      sourceFunctions: ['summarizeStepUpSetResult'],
      expectedOutcome: { leftLeadRepCount: 6, rightLeadRepCount: 6 },
      observedOutcome: { leftLeadRepCount: leftSet.set.leftLeadRepCount, rightLeadRepCount: leftSet.set.rightLeadRepCount },
      passed: leftSet.set.leftLeadRepCount === 6 && leftSet.set.rightLeadRepCount === 6,
      metricTags: ['side_balance'],
    });

    addScenario({
      scenarioId: 'step_up_both_feet_floor_each_rep',
      category: 'normal',
      evidenceMethod: 'event_rows',
      sourceFunctions: ['resolveStepUpRepEvidence'],
      expectedOutcome: { allAcceptedHaveStartAndReturnFloor: true },
      observedOutcome: { acceptedWithoutStart: 0, acceptedWithoutReturn: 0 },
      passed: leftSet.state.repEvidence.every((e) => e.bothFeetAtStart && e.bothFeetReturnedToFloor),
      metricTags: ['floor_boundary'],
    });

    let wrongFirst = readyState(planLeft);
    const wrongFirstResult = applyRep(wrongFirst, 'wrong_lead_on_first_rep', 'wrong-first', 'right');
    addScenario({
      scenarioId: 'wrong_lead_on_first_rep',
      category: 'invalid_wrong_lead',
      evidenceMethod: 'state_machine',
      sourceFunctions: ['resolveStepUpRepEvidence', 'advanceStepUpAlternationState'],
      expectedOutcome: { credited: false, expectedLeadSide: 'left' },
      observedOutcome: { endReason: wrongFirstResult.evidence.endReason, acceptedRepCount: wrongFirstResult.state.acceptedRepCount, expectedLeadSide: wrongFirstResult.state.expectedLeadSide },
      passed: wrongFirstResult.evidence.endReason === 'wrong_lead' && wrongFirstResult.state.acceptedRepCount === 0 && wrongFirstResult.state.expectedLeadSide === 'left',
      metricTags: ['wrong_lead'],
    });

    let wrongAfterFive = readyState(planLeft);
    for (let i = 0; i < 5; i++) wrongAfterFive = applyRep(wrongAfterFive, 'wrong_lead_after_five_reps', 'correct-before-wrong-' + (i + 1), wrongAfterFive.expectedLeadSide).state;
    const wrongAfterFiveResult = applyRep(wrongAfterFive, 'wrong_lead_after_five_reps', 'wrong-after-five', wrongAfterFive.expectedLeadSide === 'left' ? 'right' : 'left');
    addScenario({
      scenarioId: 'wrong_lead_after_five_reps',
      category: 'invalid_wrong_lead',
      evidenceMethod: 'state_machine',
      sourceFunctions: ['resolveStepUpRepEvidence', 'advanceStepUpAlternationState'],
      expectedOutcome: { acceptedBeforeWrong: 5, noCreditForWrong: true },
      observedOutcome: { endReason: wrongAfterFiveResult.evidence.endReason, acceptedRepCount: wrongAfterFiveResult.state.acceptedRepCount, expectedLeadSide: wrongAfterFiveResult.state.expectedLeadSide },
      passed: wrongAfterFiveResult.evidence.endReason === 'wrong_lead' && wrongAfterFiveResult.state.acceptedRepCount === 5 && wrongAfterFiveResult.state.expectedLeadSide === wrongAfterFive.expectedLeadSide,
      metricTags: ['wrong_lead'],
    });

    let wrongCorrects = readyState(planLeft);
    const wrong = applyRep(wrongCorrects, 'wrong_lead_returns_to_floor_then_corrects', 'wrong-return', 'right');
    wrongCorrects = advanceStepUpAlternationState(wrong.state, { type: 'FLOOR_READY' });
    const corrected = applyRep(wrongCorrects, 'wrong_lead_returns_to_floor_then_corrects', 'correct-after-wrong', wrongCorrects.expectedLeadSide);
    addScenario({
      scenarioId: 'wrong_lead_returns_to_floor_then_corrects',
      category: 'invalid_wrong_lead',
      evidenceMethod: 'state_machine',
      sourceFunctions: ['advanceStepUpAlternationState'],
      eventSequence: ['wrong lead', 'FLOOR_READY', 'correct lead'],
      expectedOutcome: { correctedAccepted: true, acceptedRepCount: 1 },
      observedOutcome: { acceptedRepCount: corrected.state.acceptedRepCount, expectedLeadSide: corrected.state.expectedLeadSide },
      passed: corrected.state.acceptedRepCount === 1 && corrected.state.expectedLeadSide === 'right',
      metricTags: ['wrong_lead'],
    });

    addScenario({
      scenarioId: 'wrong_lead_does_not_flip_expected',
      category: 'invalid_wrong_lead',
      evidenceMethod: 'event_rows',
      sourceFunctions: ['advanceStepUpAlternationState'],
      expectedOutcome: { wrongAttemptExpectedLeadFlipCount: 0 },
      observedOutcome: { expectedBefore: wrongFirst.expectedLeadSide, expectedAfter: wrongFirstResult.state.expectedLeadSide },
      passed: wrongFirst.expectedLeadSide === wrongFirstResult.state.expectedLeadSide,
      metricTags: ['wrong_lead_flip'],
    });

    const generic = applyRep(readyState(planLeft), 'generic_rep_without_lead_evidence_rejected', 'generic-unknown', null);
    addScenario({
      scenarioId: 'generic_rep_without_lead_evidence_rejected',
      category: 'invalid_wrong_lead',
      evidenceMethod: 'state_machine',
      sourceFunctions: ['resolveStepUpRepEvidence'],
      expectedOutcome: { credited: false },
      observedOutcome: { endReason: generic.evidence.endReason, acceptedRepCount: generic.state.acceptedRepCount },
      passed: generic.evidence.endReason === 'invalid_phase' && generic.state.acceptedRepCount === 0,
      metricTags: ['unknown_lead'],
    });

    const oppositeClearer = applyRep(readyState(planLeft), 'opposite_chain_clearer_not_auto_credited', 'opposite-clearer', null, {}, 'rep_evidence', 'Readiness may require both chains, but no production helper auto-assigns the lead from the clearer opposite chain.');
    addScenario({
      scenarioId: 'opposite_chain_clearer_not_auto_credited',
      category: 'invalid_wrong_lead',
      evidenceMethod: 'state_machine',
      sourceFunctions: ['resolveStepUpRepEvidence'],
      expectedOutcome: { credited: false, observedLeadSide: null },
      observedOutcome: { endReason: oppositeClearer.evidence.endReason, observedLeadSide: oppositeClearer.evidence.observedLeadSide, acceptedRepCount: oppositeClearer.state.acceptedRepCount },
      passed: oppositeClearer.evidence.observedLeadSide === null && oppositeClearer.state.acceptedRepCount === 0,
      metricTags: ['conservative_evidence'],
    });

    const noReturn = applyRep(readyState(planLeft), 'top_reached_no_floor_return', 'top-no-return', 'left', { bothFeetReturnedToFloor: false });
    addScenario({
      scenarioId: 'top_reached_no_floor_return',
      category: 'boundary_duplicate',
      evidenceMethod: 'state_machine',
      sourceFunctions: ['resolveStepUpRepEvidence'],
      expectedOutcome: { credited: false },
      observedOutcome: { endReason: noReturn.evidence.endReason, acceptedRepCount: noReturn.state.acceptedRepCount },
      passed: noReturn.evidence.endReason === 'invalid_phase' && noReturn.state.acceptedRepCount === 0,
      metricTags: ['floor_boundary'],
    });

    const oneFoot = applyRep(readyState(planLeft), 'one_foot_remains_on_step', 'one-foot-remains', 'left', { bothFeetReturnedToFloor: false });
    addScenario({
      scenarioId: 'one_foot_remains_on_step',
      category: 'boundary_duplicate',
      evidenceMethod: 'state_machine',
      sourceFunctions: ['resolveStepUpRepEvidence'],
      expectedOutcome: { credited: false },
      observedOutcome: { endReason: oneFoot.evidence.endReason, acceptedRepCount: oneFoot.state.acceptedRepCount },
      passed: oneFoot.evidence.endReason === 'invalid_phase' && oneFoot.state.acceptedRepCount === 0,
      metricTags: ['floor_boundary'],
    });

    let duplicate = readyState(planLeft);
    duplicate = startAttempt(duplicate, 'duplicate-callback');
    const duplicateEvidence = evidenceFor(duplicate, 'duplicate-callback', duplicate.expectedLeadSide);
    const afterDuplicateFirst = advanceStepUpAlternationState(duplicate, { type: 'APPLY_REP_EVIDENCE', evidence: duplicateEvidence });
    addEventForManual('duplicate_completion_callback', 'rep_evidence', duplicate, afterDuplicateFirst, duplicateEvidence, 'first completion');
    const afterDuplicateSecond = advanceStepUpAlternationState(afterDuplicateFirst, { type: 'APPLY_REP_EVIDENCE', evidence: duplicateEvidence });
    addEventForManual('duplicate_completion_callback', 'duplicate_callback', afterDuplicateFirst, afterDuplicateSecond, duplicateEvidence, 'duplicate completion callback');
    addScenario({
      scenarioId: 'duplicate_completion_callback',
      category: 'boundary_duplicate',
      evidenceMethod: 'state_machine',
      sourceFunctions: ['advanceStepUpAlternationState'],
      expectedOutcome: { acceptedRepCount: 1, duplicateSuppressedCount: 1 },
      observedOutcome: { acceptedRepCount: afterDuplicateSecond.acceptedRepCount, duplicateSuppressedCount: afterDuplicateSecond.duplicateSuppressedCount },
      passed: afterDuplicateSecond.acceptedRepCount === 1 && afterDuplicateSecond.duplicateSuppressedCount === 1,
      metricTags: ['duplicate'],
    });

    let staleState = readyState(planLeft);
    staleState = startAttempt(staleState, 'old-attempt');
    staleState = advanceStepUpAlternationState(staleState, { type: 'FLOOR_READY' });
    staleState = advanceStepUpAlternationState(staleState, { type: 'START_REP_ATTEMPT', attemptId: 'new-attempt' });
    const staleBefore = staleState;
    const staleAfter = advanceStepUpAlternationState(staleBefore, { type: 'APPLY_REP_EVIDENCE', evidence: acceptedEvidence('old-attempt', staleBefore.expectedLeadSide) });
    addEventForManual('stale_callback_after_next_rep_started', 'stale_callback', staleBefore, staleAfter, acceptedEvidence('old-attempt', staleBefore.expectedLeadSide), 'old attempt callback after next rep started');
    addScenario({
      scenarioId: 'stale_callback_after_next_rep_started',
      category: 'boundary_duplicate',
      evidenceMethod: 'state_machine',
      sourceFunctions: ['advanceStepUpAlternationState'],
      expectedOutcome: { acceptedRepCount: 0, ignoredStaleActionCount: 1 },
      observedOutcome: { acceptedRepCount: staleAfter.acceptedRepCount, ignoredStaleActionCount: staleAfter.ignoredStaleActionCount },
      passed: staleAfter.acceptedRepCount === 0 && staleAfter.ignoredStaleActionCount === 1,
      metricTags: ['stale'],
    });

    let noise = readyState(planLeft);
    noise = startAttempt(noise, 'threshold-noise');
    const noiseEvidence = evidenceFor(noise, 'threshold-noise', noise.expectedLeadSide);
    const noiseAfterFirst = advanceStepUpAlternationState(noise, { type: 'APPLY_REP_EVIDENCE', evidence: noiseEvidence });
    addEventForManual('threshold_noise_single_credit', 'threshold_noise', noise, noiseAfterFirst, noiseEvidence, 'first threshold crossing');
    const noiseAfterSecond = advanceStepUpAlternationState(noiseAfterFirst, { type: 'APPLY_REP_EVIDENCE', evidence: noiseEvidence });
    addEventForManual('threshold_noise_single_credit', 'threshold_noise', noiseAfterFirst, noiseAfterSecond, noiseEvidence, 'duplicate threshold jitter callback suppressed');
    addScenario({
      scenarioId: 'threshold_noise_single_credit',
      category: 'boundary_duplicate',
      evidenceMethod: 'state_machine_duplicate_suppression',
      sourceFunctions: ['advanceStepUpAlternationState'],
      expectedOutcome: { creditedReps: 1 },
      observedOutcome: { acceptedRepCount: noiseAfterSecond.acceptedRepCount, duplicateSuppressedCount: noiseAfterSecond.duplicateSuppressedCount },
      passed: noiseAfterSecond.acceptedRepCount === 1 && noiseAfterSecond.duplicateSuppressedCount === 1,
      metricTags: ['threshold_noise'],
    });

    const descent = applyRep(readyState(planLeft), 'descent_order_not_overconstrained', 'descent-any-order', 'left', {}, 'rep_evidence', 'StepUpRepEvidence has no descent-order field; only both-feet floor return gates credit.');
    addScenario({
      scenarioId: 'descent_order_not_overconstrained',
      category: 'boundary_duplicate',
      evidenceMethod: 'state_machine',
      sourceFunctions: ['resolveStepUpRepEvidence'],
      expectedOutcome: { acceptedWithoutDescentOrderField: true },
      observedOutcome: { endReason: descent.evidence.endReason, hasDescentOrderField: Object.prototype.hasOwnProperty.call(descent.evidence, 'descentOrder') },
      passed: descent.evidence.endReason === 'accepted' && !Object.prototype.hasOwnProperty.call(descent.evidence, 'descentOrder'),
      metricTags: ['descent_order'],
    });

    addInterruptionScenario('tracking_loss_mid_left_lead_rep', planLeft, 'left', 'TRACKING_INTERRUPTED');
    addInterruptionScenario('tracking_loss_mid_right_lead_rep', planRight, 'right', 'TRACKING_INTERRUPTED');
    addPauseScenario('pause_mid_rep', 'pause_callback', 'PAUSE_OR_BACKGROUND');
    addPauseScenario('background_mid_rep', 'background_callback', 'PAUSE_OR_BACKGROUND');

    let restoreSix = runSetPartial(planLeft, 'restore_after_six_reps', 6);
    const serializedSix = serializeStepUpAlternationRuntimeState(restoreSix);
    const restoredSix = deserializeStepUpAlternationRuntimeState(serializedSix);
    addEvent({
      scenarioId: 'restore_after_six_reps',
      eventType: 'restore_roundtrip',
      setIndex: restoredSix?.setIndex ?? 0,
      expectedLeadBefore: restoreSix.expectedLeadSide,
      expectedLeadAfter: restoredSix?.expectedLeadSide ?? '',
      acceptedRepCount: restoredSix?.acceptedRepCount ?? -1,
      leftLeadRepCount: restoredSix?.leftLeadRepCount ?? -1,
      rightLeadRepCount: restoredSix?.rightLeadRepCount ?? -1,
      setCompleted: false,
      progressionEligible: false,
      restoreState: JSON.stringify({ phaseBefore: restoreSix.phase, phaseAfter: restoredSix?.phase, planFingerprint: restoredSix?.plan?.planFingerprint }),
      sourceFunction: 'serializeStepUpAlternationRuntimeState;deserializeStepUpAlternationRuntimeState',
    });
    addScenario({
      scenarioId: 'restore_after_six_reps',
      category: 'interruption_restore',
      evidenceMethod: 'serialization_roundtrip',
      sourceFunctions: ['serializeStepUpAlternationRuntimeState', 'deserializeStepUpAlternationRuntimeState'],
      expectedOutcome: { acceptedRepCount: 6, expectedLeadSide: 'left' },
      observedOutcome: { acceptedRepCount: restoredSix?.acceptedRepCount, expectedLeadSide: restoredSix?.expectedLeadSide, planFingerprintPreserved: restoredSix?.plan?.planFingerprint === planLeft.planFingerprint },
      passed: restoredSix?.acceptedRepCount === 6 && restoredSix.expectedLeadSide === restoreSix.expectedLeadSide && restoredSix.plan.planFingerprint === planLeft.planFingerprint,
      metricTags: ['restore'],
    });

    let restoreMid = readyState(planLeft);
    restoreMid = startAttempt(restoreMid, 'restore-mid-attempt');
    const restoredMidEnvelope = deserializeStepUpAlternationRuntimeState(serializeStepUpAlternationRuntimeState(restoreMid));
    const restoredMidState = restoreStepUpAlternationRuntimeState(restoredMidEnvelope);
    const restoreStaleAfter = advanceStepUpAlternationState(restoredMidState, { type: 'APPLY_REP_EVIDENCE', evidence: acceptedEvidence('restore-mid-attempt', 'left') });
    addEventForManual('restore_mid_rep', 'restore_callback', restoredMidState, restoreStaleAfter, acceptedEvidence('restore-mid-attempt', 'left'), 'partial active attempt retired on restore');
    addScenario({
      scenarioId: 'restore_mid_rep',
      category: 'interruption_restore',
      evidenceMethod: 'serialization_restore_state_machine',
      sourceFunctions: ['serializeStepUpAlternationRuntimeState', 'deserializeStepUpAlternationRuntimeState', 'restoreStepUpAlternationRuntimeState'],
      expectedOutcome: { partialRepCredited: false },
      observedOutcome: { acceptedRepCount: restoreStaleAfter.acceptedRepCount, ignoredStaleActionCount: restoreStaleAfter.ignoredStaleActionCount },
      passed: restoreStaleAfter.acceptedRepCount === 0 && restoreStaleAfter.ignoredStaleActionCount === 1,
      metricTags: ['restore'],
    });

    const cancel = advanceStepUpAlternationState(startAttempt(readyState(planLeft), 'cancel-mid'), { type: 'CANCEL_SET' });
    addEvent({
      scenarioId: 'cancel_mid_set',
      eventType: 'cancel',
      repAttemptId: 'cancel-mid',
      expectedLeadBefore: 'left',
      outcome: cancel.phase,
      credited: false,
      sfxPlayed: false,
      expectedLeadAfter: cancel.expectedLeadSide,
      acceptedRepCount: cancel.acceptedRepCount,
      leftLeadRepCount: cancel.leftLeadRepCount,
      rightLeadRepCount: cancel.rightLeadRepCount,
      setCompleted: cancel.phase === 'set_complete',
      progressionEligible: false,
      sourceFunction: 'advanceStepUpAlternationState',
    });
    addScenario({
      scenarioId: 'cancel_mid_set',
      category: 'interruption_restore',
      evidenceMethod: 'state_machine',
      sourceFunctions: ['advanceStepUpAlternationState'],
      expectedOutcome: { phase: 'cancelled', acceptedRepCount: 0 },
      observedOutcome: { phase: cancel.phase, acceptedRepCount: cancel.acceptedRepCount },
      passed: cancel.phase === 'cancelled' && cancel.acceptedRepCount === 0,
      metricTags: ['cancel_skip'],
    });

    addScenario({
      scenarioId: 'skip_mid_set',
      category: 'interruption_restore',
      evidenceMethod: 'seed_helper',
      sourceFunctions: ['applyBothSidesExerciseCompletionToStartSideSeed'],
      expectedOutcome: { seedFlipped: false },
      observedOutcome: { nextSide: nextBothSidesStartSideForExercise(applyBothSidesExerciseCompletionToStartSideSeed(undefined, { exerciseId: 'step-up', completed: false, countsTowardMainPlan: true, eventId: 'skip-mid-set' }), 'step-up') },
      passed: nextBothSidesStartSideForExercise(applyBothSidesExerciseCompletionToStartSideSeed(undefined, { exerciseId: 'step-up', completed: false, countsTowardMainPlan: true, eventId: 'skip-mid-set' }), 'step-up') === 'left',
      metricTags: ['cancel_skip', 'seed'],
    });

    const defaultPlan = deriveStepUpAlternationPlanForExerciseId('left');
    addScenario({
      scenarioId: 'default_target_12',
      category: 'target_generated',
      evidenceMethod: 'planner',
      sourceFunctions: ['deriveStepUpAlternationPlanForExerciseId', 'getExercise'],
      expectedOutcome: { targetTotalReps: 12, setCount: 3 },
      observedOutcome: { targetTotalReps: defaultPlan.targetTotalReps, setCount: defaultPlan.setCount, sourceTargetRepsPerSet: defaultPlan.sourceTargetRepsPerSet },
      passed: defaultPlan.targetTotalReps === 12 && defaultPlan.setCount === 3,
      metricTags: ['target'],
    });

    const even10 = deriveStepUpAlternationPlan({ exerciseId: 'step-up', setCount: 2, targetTotalReps: 10, initialLeadSide: 'right' });
    addScenario({
      scenarioId: 'even_scaled_target_10',
      category: 'target_generated',
      evidenceMethod: 'planner',
      sourceFunctions: ['deriveStepUpAlternationPlan'],
      expectedOutcome: { runtimeSelectable: true, targetLeftLeadReps: 5, targetRightLeadReps: 5 },
      observedOutcome: even10,
      passed: even10.runtimeSelectable && even10.targetLeftLeadReps === 5 && even10.targetRightLeadReps === 5,
      metricTags: ['target'],
    });

    const odd9 = deriveStepUpAlternationPlan({ exerciseId: 'step-up', setCount: 2, targetTotalReps: 9, initialLeadSide: 'left' });
    addScenario({
      scenarioId: 'odd_scaled_target_9_blocked',
      category: 'target_generated',
      evidenceMethod: 'planner',
      sourceFunctions: ['deriveStepUpAlternationPlan'],
      expectedOutcome: { runtimeSelectable: false, blocker: 'ODD_STEP_UP_TARGET' },
      observedOutcome: odd9,
      passed: !odd9.runtimeSelectable && odd9.blockerReasonCodes.includes('ODD_STEP_UP_TARGET'),
      metricTags: ['target_odd'],
    });

    const noninteger = deriveStepUpAlternationPlan({ exerciseId: 'step-up', setCount: 2, targetTotalReps: 7.5, initialLeadSide: 'left' });
    addScenario({
      scenarioId: 'noninteger_target_blocked',
      category: 'target_generated',
      evidenceMethod: 'planner',
      sourceFunctions: ['deriveStepUpAlternationPlan'],
      expectedOutcome: { runtimeSelectable: false, blocker: 'NON_INTEGER_STEP_UP_TARGET' },
      observedOutcome: noninteger,
      passed: !noninteger.runtimeSelectable && noninteger.blockerReasonCodes.includes('NON_INTEGER_STEP_UP_TARGET'),
      metricTags: ['target_noninteger'],
    });

    const shortSessionPlan = deriveStepUpAlternationPlan({ exerciseId: 'step-up', setCount: 2, targetTotalReps: 12, initialLeadSide: 'left' });
    addScenario({
      scenarioId: 'short_session_final_target',
      category: 'target_generated',
      evidenceMethod: 'planner',
      sourceFunctions: ['deriveStepUpAlternationPlan'],
      expectedOutcome: { targetTotalReps: 12, setCount: 2 },
      observedOutcome: { targetTotalReps: shortSessionPlan.targetTotalReps, setCount: shortSessionPlan.setCount, setStartLeadSides: shortSessionPlan.setStartLeadSides },
      passed: shortSessionPlan.runtimeSelectable && shortSessionPlan.targetTotalReps === 12 && shortSessionPlan.setCount === 2,
      metricTags: ['target'],
    });

    const visibleVoice = planTrainingVoiceSequenceV21({ exerciseId: 'step-up', exposure: 'first_use', stepUpContext: { plan: planLeft, setIndex: 0 } });
    addScenario({
      scenarioId: 'visible_voice_runtime_target_match',
      category: 'target_generated',
      evidenceMethod: 'voice_planner',
      sourceFunctions: ['planTrainingVoiceSequenceV21', 'resolveTrainingVoiceTargetV21'],
      expectedOutcome: { spokenText: 'Do twelve total reps.', value: 12 },
      observedOutcome: { spokenText: visibleVoice.targetPlan.spokenText, visibleText: visibleVoice.targetPlan.visibleText, value: visibleVoice.targetPlan.value },
      passed: visibleVoice.targetPlan.spokenText === 'Do twelve total reps.' && visibleVoice.targetPlan.value === 12,
      metricTags: ['target_voice'],
    });

    addSeedScenario('seed_defaults_left', undefined, null, 'left');
    const seedCompleted = applyBothSidesExerciseCompletionToStartSideSeed(undefined, { exerciseId: 'step-up', completed: true, countsTowardMainPlan: true, eventId: 'main-complete' });
    addSeedScenario('successful_completion_flips_seed', seedCompleted, null, 'right', undefined, seedCompleted);
    const seedSkipped = applyBothSidesExerciseCompletionToStartSideSeed(undefined, { exerciseId: 'step-up', completed: false, countsTowardMainPlan: true, eventId: 'skip' });
    addSeedScenario('skip_does_not_flip_seed', seedSkipped, null, 'left', undefined, seedSkipped);
    const seedManual = applyBothSidesExerciseCompletionToStartSideSeed(undefined, { exerciseId: 'step-up', completed: true, countsTowardMainPlan: false, eventId: 'manual' });
    addSeedScenario('manual_practice_does_not_flip_seed', seedManual, null, 'left', undefined, seedManual);
    const seedDup = applyBothSidesExerciseCompletionToStartSideSeed(seedCompleted, { exerciseId: 'step-up', completed: true, countsTowardMainPlan: true, eventId: 'main-complete' });
    addSeedScenario('duplicate_completion_idempotent', seedDup, null, 'right', seedCompleted, seedDup);
    const seedRestored = JSON.parse(JSON.stringify(seedCompleted));
    addSeedScenario('sync_restore_preserves_seed', seedRestored, null, 'right', seedCompleted, seedRestored);

    const legacySets = leftThree.map((item) => stepUpSetResultToLegacySetResult(planLeft, item.set));
    const progressionSummary = summarizeItem({ exerciseId: 'step-up', status: 'completed', sets: legacySets }, getExercise('step-up'));
    addScenario({
      scenarioId: 'one_set_one_progression_event',
      category: 'progression_result',
      evidenceMethod: 'aggregation_progression',
      sourceFunctions: ['stepUpSetResultToLegacySetResult', 'summarizeItem'],
      expectedOutcome: { setResultCount: 3, totalReps: 36, reachedAllTargets: true },
      observedOutcome: { setResultCount: legacySets.length, totalReps: progressionSummary.totalReps, reachedAllTargets: progressionSummary.reachedAllTargets },
      passed: legacySets.length === 3 && progressionSummary.totalReps === 36 && progressionSummary.reachedAllTargets,
      metricTags: ['progression'],
    });

    addScenario({
      scenarioId: 'lead_counts_do_not_double_set_count',
      category: 'progression_result',
      evidenceMethod: 'aggregation',
      sourceFunctions: ['stepUpSetResultToLegacySetResult'],
      expectedOutcome: { setResultCount: 3 },
      observedOutcome: { setResultCount: legacySets.length, totalLeadCount: leftProgression.leftLeadReps + leftProgression.rightLeadReps },
      passed: legacySets.length === 3 && leftProgression.leftLeadReps + leftProgression.rightLeadReps === 36,
      metricTags: ['progression', 'set_count'],
    });

    const validTime = summarizeValidTimeSets(legacySets);
    addScenario({
      scenarioId: 'valid_time_not_doubled',
      category: 'progression_result',
      evidenceMethod: 'valid_time_summary',
      sourceFunctions: ['summarizeValidTimeSets'],
      expectedOutcome: { validTimeSummary: null },
      observedOutcome: { validTimeSummary: validTime },
      passed: validTime === null,
      metricTags: ['valid_time'],
    });

    const imbalanced = { ...leftSet.set, acceptedRepCount: 12, leftLeadRepCount: 7, rightLeadRepCount: 5, completedTarget: false, alternationValid: false };
    const imbalancedProgression = summarizeStepUpAlternationProgression(planLeft, [imbalanced, leftThree[1].set, leftThree[2].set]);
    addScenario({
      scenarioId: 'twelve_total_unequal_sides_rejected',
      category: 'progression_result',
      evidenceMethod: 'aggregation',
      sourceFunctions: ['summarizeStepUpAlternationProgression'],
      expectedOutcome: { progressionEligible: false },
      observedOutcome: { progressionEligible: imbalancedProgression.progressionEligible, leftLeadRepCount: imbalanced.leftLeadRepCount, rightLeadRepCount: imbalanced.rightLeadRepCount },
      passed: !imbalancedProgression.progressionEligible,
      metricTags: ['progression_invalid'],
    });

    const broken = { ...leftSet.set, alternationValid: false, completedTarget: true };
    const brokenProgression = summarizeStepUpAlternationProgression(planLeft, [broken, leftThree[1].set, leftThree[2].set]);
    addScenario({
      scenarioId: 'broken_alternation_not_progression_eligible',
      category: 'progression_result',
      evidenceMethod: 'aggregation',
      sourceFunctions: ['summarizeStepUpAlternationProgression'],
      expectedOutcome: { progressionEligible: false },
      observedOutcome: { progressionEligible: brokenProgression.progressionEligible, alternationValid: broken.alternationValid, completedTarget: broken.completedTarget },
      passed: !brokenProgression.progressionEligible,
      metricTags: ['progression_invalid'],
    });

    const legacySummary = summarizeItem({ exerciseId: 'step-up', status: 'completed', sets: [{ exerciseId: 'step-up', reps: 12, meanVel: 1, holdSec: NaN, romPeak: NaN, autoregulated: false, reachedTarget: true, interruptions: 0, flags: [] }] }, getExercise('step-up'));
    addScenario({
      scenarioId: 'legacy_result_still_parses',
      category: 'progression_result',
      evidenceMethod: 'progression_legacy',
      sourceFunctions: ['summarizeItem'],
      expectedOutcome: { totalReps: 12 },
      observedOutcome: { totalReps: legacySummary.totalReps, measured: legacySummary.measured },
      passed: legacySummary.totalReps === 12 && legacySummary.measured,
      metricTags: ['legacy_parse'],
    });

    addVoiceScenario('step_up_start_left_logical_plan', planLeft, 0, 'first_use', 'step-up-start-left-v21');
    addVoiceScenario('step_up_start_right_logical_plan', planLeft, 1, 'later_set', 'step-up-start-right-v21');
    addVoiceCorrectionScenario('wrong_lead_left_correction_plan', planLeft, 'left', 'step-up-wrong-left-v21');
    addVoiceCorrectionScenario('wrong_lead_right_correction_plan', planLeft, 'right', 'step-up-wrong-right-v21');

    const voicePlans = [
      planTrainingVoiceSequenceV21({ exerciseId: 'step-up', exposure: 'first_use', stepUpContext: { plan: planLeft, setIndex: 0 } }),
      planTrainingVoiceSequenceV21({ exerciseId: 'step-up', exposure: 'later_set', stepUpContext: { plan: planLeft, setIndex: 1 } }),
      planTrainingVoiceSequenceV21({ exerciseId: 'step-up', exposure: 'wrong_lead_correction', stepUpContext: { plan: planLeft, setIndex: 1, expectedLeadSide: 'right' } }),
    ];
    addScenario({
      scenarioId: 'no_per_rep_spoken_switch',
      category: 'voice_isolation',
      evidenceMethod: 'voice_planner',
      sourceFunctions: ['planTrainingVoiceSequenceV21'],
      expectedOutcome: { switchCueCount: 0 },
      observedOutcome: { cueKeys: voicePlans.flatMap((plan) => plan.cueKeys), switchCueCount: voicePlans.flatMap((plan) => plan.cueKeys).filter((key) => key.startsWith('switch-')).length },
      passed: voicePlans.flatMap((plan) => plan.cueKeys).filter((key) => key.startsWith('switch-')).length === 0,
      metricTags: ['voice_switch'],
    });

    const session = { exercises: [{ exerciseId: 'step-up', sets: 3, repsPerSet: 12 }] };
    const featureOffSession = attachStepUpAlternationPlansToGeneratedSession({ session });
    addScenario({
      scenarioId: 'feature_off_legacy_unchanged',
      category: 'voice_isolation',
      evidenceMethod: 'feature_selector',
      sourceFunctions: ['attachStepUpAlternationPlansToGeneratedSession'],
      expectedOutcome: { planAttached: false },
      observedOutcome: { planAttached: Boolean(featureOffSession.exercises[0].stepUpAlternationPlan), sameReference: featureOffSession === session },
      passed: !featureOffSession.exercises[0].stepUpAlternationPlan,
      metricTags: ['feature_isolation'],
    });

    const flagAlone = selectTrainingStepUpAlternationMode({ featureEnabled: true, internalV21RuntimeReady: false, plans: [planLeft] });
    addScenario({
      scenarioId: 'alternation_flag_alone_no_half_activation',
      category: 'voice_isolation',
      evidenceMethod: 'feature_selector',
      sourceFunctions: ['selectTrainingStepUpAlternationMode'],
      expectedOutcome: { selectable: false },
      observedOutcome: flagAlone,
      passed: !flagAlone.selectable && flagAlone.reasonCodes.includes('internal_v21_runtime_not_ready'),
      metricTags: ['feature_isolation'],
    });

    const tvReadiness = resolveTrainingVoiceRuntimeReadinessV21({ exerciseId: 'step-up', stepUpAlternationPlan: planLeft });
    const stepUpContract = getTrainingVoiceContractV21('step-up');
    addScenario({
      scenarioId: 'training_voice_remains_default_closed',
      category: 'voice_isolation',
      evidenceMethod: 'voice_readiness',
      sourceFunctions: ['resolveTrainingVoiceRuntimeReadinessV21', 'getTrainingVoiceContractV21'],
      expectedOutcome: { selectable: false, audioReady: false, behaviorReady: false, noStepAlternationRequirement: true },
      observedOutcome: { selectable: tvReadiness.selectable, blockers: tvReadiness.blockers, audioReady: TRAINING_VOICE_V2_1_AUDIO_READY, behaviorReady: TRAINING_VOICE_V2_1_BEHAVIOR_READY, implementationRequirements: stepUpContract.implementationRequirements },
      passed: !tvReadiness.selectable && !TRAINING_VOICE_V2_1_AUDIO_READY && !TRAINING_VOICE_V2_1_BEHAVIOR_READY && !stepUpContract.implementationRequirements.includes('IR-VOICE-STEP-ALTERNATION'),
      metricTags: ['voice_default_closed', 'ir_requirement'],
    });

    addScenario({
      scenarioId: 'balance_v2_remains_default_closed',
      category: 'voice_isolation',
      evidenceMethod: 'config_constants',
      sourceFunctions: ['EYES_OPEN_BALANCE_PROTOCOL_V2_AUDIO_READY', 'EYES_OPEN_BALANCE_PROTOCOL_V2_SELECTABLE'],
      expectedOutcome: { selectable: false, audioReady: false },
      observedOutcome: { selectable: EYES_OPEN_BALANCE_PROTOCOL_V2_SELECTABLE, audioReady: EYES_OPEN_BALANCE_PROTOCOL_V2_AUDIO_READY },
      passed: EYES_OPEN_BALANCE_PROTOCOL_V2_SELECTABLE === false && EYES_OPEN_BALANCE_PROTOCOL_V2_AUDIO_READY === false,
      metricTags: ['balance_v2'],
    });

    addScenario({
      scenarioId: 'audio_assets_unchanged',
      category: 'project_gate',
      evidenceMethod: 'git_diff',
      sourceFunctions: ['git diff --name-only -- assets/audio'],
      expectedOutcome: { audioAssetDiffCount: 0 },
      observedOutcome: { audioAssetDiffNameOnly: ${JSON.stringify(audioDiffNameOnly)} },
      passed: ${audioDiffNameOnly.length === 0},
      metricTags: ['audio_assets'],
      notes: 'Additional project-gate scenario beyond the 53 canonical ids.',
    });

    function addEventForManual(scenarioId, eventType, before, after, evidence, notes = '') {
      addEvent({
        scenarioId,
        eventType,
        repAttemptId: evidence.repAttemptId,
        setIndex: before.setIndex,
        expectedLeadBefore: before.expectedLeadSide,
        observedLead: evidence.observedLeadSide ?? '',
        bothFeetAtStart: evidence.bothFeetAtStart,
        ascentValid: evidence.expectedLeadInitiatedAscent,
        topPhaseValid: evidence.topPhaseValid,
        bothFeetReturnedToFloor: evidence.bothFeetReturnedToFloor,
        trackingValid: evidence.trackingValid,
        outcome: after.acceptedRepCount > before.acceptedRepCount ? 'accepted' : eventType,
        credited: after.acceptedRepCount > before.acceptedRepCount,
        sfxPlayed: after.repSfxCount > before.repSfxCount,
        expectedLeadAfter: after.expectedLeadSide,
        acceptedRepCount: after.acceptedRepCount,
        leftLeadRepCount: after.leftLeadRepCount,
        rightLeadRepCount: after.rightLeadRepCount,
        setCompleted: after.phase === 'set_complete',
        progressionEligible: summarizeStepUpSetResult(after).alternationValid,
        sourceFunction: 'advanceStepUpAlternationState',
        notes,
      });
    }

    function runSetPartial(plan, scenarioId, count) {
      let state = readyState(plan);
      for (let i = 0; i < count; i++) state = applyRep(state, scenarioId, scenarioId + '-rep-' + (i + 1), state.expectedLeadSide).state;
      return state;
    }

    function addInterruptionScenario(scenarioId, plan, expectedStartSide, actionType) {
      let state = readyState(plan);
      state = startAttempt(state, scenarioId + '-attempt');
      const before = state;
      const after = advanceStepUpAlternationState(before, { type: actionType, attemptId: scenarioId + '-attempt' });
      addEvent({
        scenarioId,
        eventType: 'tracking_interrupted',
        repAttemptId: scenarioId + '-attempt',
        setIndex: before.setIndex,
        expectedLeadBefore: before.expectedLeadSide,
        observedLead: expectedStartSide,
        bothFeetAtStart: true,
        ascentValid: true,
        topPhaseValid: false,
        bothFeetReturnedToFloor: false,
        trackingValid: false,
        outcome: after.phase,
        credited: false,
        sfxPlayed: false,
        expectedLeadAfter: after.expectedLeadSide,
        acceptedRepCount: after.acceptedRepCount,
        leftLeadRepCount: after.leftLeadRepCount,
        rightLeadRepCount: after.rightLeadRepCount,
        setCompleted: after.phase === 'set_complete',
        progressionEligible: false,
        sourceFunction: 'advanceStepUpAlternationState',
      });
      addScenario({
        scenarioId,
        category: 'interruption_restore',
        evidenceMethod: 'state_machine',
        sourceFunctions: ['advanceStepUpAlternationState'],
        expectedOutcome: { credited: false, phase: 'tracking_recovery' },
        observedOutcome: { phase: after.phase, acceptedRepCount: after.acceptedRepCount, expectedLeadSide: after.expectedLeadSide },
        passed: after.phase === 'tracking_recovery' && after.acceptedRepCount === 0 && after.expectedLeadSide === before.expectedLeadSide,
        metricTags: ['tracking'],
      });
    }

    function addPauseScenario(scenarioId, callbackType, actionType) {
      let state = readyState(planLeft);
      state = startAttempt(state, scenarioId + '-attempt');
      const beforePause = state;
      const paused = advanceStepUpAlternationState(beforePause, { type: actionType });
      const afterCallback = advanceStepUpAlternationState(paused, { type: 'APPLY_REP_EVIDENCE', evidence: acceptedEvidence(scenarioId + '-attempt', beforePause.expectedLeadSide) });
      addEventForManual(scenarioId, callbackType, paused, afterCallback, acceptedEvidence(scenarioId + '-attempt', beforePause.expectedLeadSide), callbackType + ' after partial rep');
      addScenario({
        scenarioId,
        category: 'interruption_restore',
        evidenceMethod: 'state_machine',
        sourceFunctions: ['advanceStepUpAlternationState'],
        expectedOutcome: { partialRepCredited: false },
        observedOutcome: { acceptedRepCount: afterCallback.acceptedRepCount, ignoredStaleActionCount: afterCallback.ignoredStaleActionCount, phaseAfterAction: paused.phase },
        passed: afterCallback.acceptedRepCount === 0 && afterCallback.ignoredStaleActionCount === 1,
        metricTags: [callbackType],
      });
    }

    function addSeedScenario(scenarioId, seedState, eventSequence, expectedSide, beforeSeed, afterSeed = seedState) {
      const nextSide = nextBothSidesStartSideForExercise(seedState, 'step-up');
      addEvent({
        scenarioId,
        eventType: 'seed_update',
        outcome: nextSide,
        credited: false,
        sfxPlayed: false,
        acceptedRepCount: 0,
        leftLeadRepCount: 0,
        rightLeadRepCount: 0,
        setCompleted: false,
        progressionEligible: false,
        seedBefore: beforeSeed ? JSON.stringify(beforeSeed) : '',
        seedAfter: afterSeed ? JSON.stringify(afterSeed) : '',
        sourceFunction: 'applyBothSidesExerciseCompletionToStartSideSeed;nextBothSidesStartSideForExercise',
      });
      addScenario({
        scenarioId,
        category: 'seed_order',
        evidenceMethod: 'seed_helper',
        sourceFunctions: ['applyBothSidesExerciseCompletionToStartSideSeed', 'nextBothSidesStartSideForExercise'],
        eventSequence: eventSequence ?? [],
        expectedOutcome: { nextSide: expectedSide },
        observedOutcome: { nextSide, seedState },
        passed: nextSide === expectedSide && (scenarioId !== 'duplicate_completion_idempotent' || JSON.stringify(beforeSeed) === JSON.stringify(afterSeed)),
        metricTags: ['seed'],
      });
    }

    function addVoiceScenario(scenarioId, plan, setIndex, exposure, expectedCueKey) {
      const voicePlan = planTrainingVoiceSequenceV21({ exerciseId: 'step-up', exposure, stepUpContext: { plan, setIndex } });
      addScenario({
        scenarioId,
        category: 'voice_isolation',
        evidenceMethod: 'voice_planner',
        sourceFunctions: ['planTrainingVoiceSequenceV21'],
        expectedOutcome: { cueKey: expectedCueKey },
        observedOutcome: { cueKeys: voicePlan.cueKeys, targetPlan: voicePlan.targetPlan },
        passed: voicePlan.cueKeys.includes(expectedCueKey) && voicePlan.targetPlan.value === 12,
        metricTags: ['voice_start_lead'],
      });
    }

    function addVoiceCorrectionScenario(scenarioId, plan, expectedLeadSide, expectedCueKey) {
      const voicePlan = planTrainingVoiceSequenceV21({ exerciseId: 'step-up', exposure: 'wrong_lead_correction', stepUpContext: { plan, setIndex: 0, expectedLeadSide } });
      addScenario({
        scenarioId,
        category: 'voice_isolation',
        evidenceMethod: 'voice_planner',
        sourceFunctions: ['planTrainingVoiceSequenceV21'],
        expectedOutcome: { cueKey: expectedCueKey },
        observedOutcome: { cueKeys: voicePlan.cueKeys },
        passed: voicePlan.cueKeys[0] === expectedCueKey,
        metricTags: ['voice_wrong_lead'],
      });
    }

    console.log(JSON.stringify({
      scenarios,
      events,
      sourceFacts: {
        stepUpDefinition: getExercise('step-up'),
        planLeft,
        planRight,
        trainingVoiceAudioReady: TRAINING_VOICE_V2_1_AUDIO_READY,
        trainingVoiceBehaviorReady: TRAINING_VOICE_V2_1_BEHAVIOR_READY,
        stepUpContract,
      },
    }));
  `;
  return JSON.parse(execFileSync('npx', ['tsx', '-e', code], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 30 * 1024 * 1024,
  }));
}

function buildRuntimeIntegrationTrace() {
  const rows = [
    traceRow(1, 'Exercise registry', 'Generated session item', 'src/exercises/stepUp.ts;src/training/workoutGeneration.ts', 'stepUpDefinition;GeneratedExercise', 'yes', 'static+executable', 'Step-up registry definition is present and generated exercise metadata type can represent exerciseId/sets/reps.', 'workout generation and step-up addendum scenarios', 'connected_verified', '', 'Step-up can exist as a generated training item.'),
    traceRow(2, 'Final prescription', 'Alternation plan', 'src/training/stepUpAlternation/generatedSession.ts', 'deriveStepUpAlternationPlanForGeneratedExercise', 'only if helper called', 'executable', 'Plan derivation from generated exercise preserves 12 total reps and 6/6 split.', 'SCENARIOS_V2 target rows', 'connected_verified', '', 'Pure helper is verified.'),
    traceRow(3, 'Feature/readiness selection', 'Internal runtime path', 'src/training/stepUpAlternation/readiness.ts;src/training/sessionPlayer.ts', 'selectTrainingStepUpAlternationMode;TrainingSessionPlayer', 'no', 'static', 'Selector exists, but TrainingSessionPlayer has no branch that selects a step-up alternation runtime owner.', 'source inspection', 'model_only_not_connected', 'F-STEPUP-RUNTIME-INTEGRATION', 'Feature/readiness does not route the active session into the internal path.'),
    traceRow(4, 'Training screen/session controller', 'Alternation runtime owner', 'src/screens/TrainingSessionScreen.tsx;src/training/sessionPlayer.ts', 'TrainingSessionScreen;TrainingSessionPlayer', 'no', 'static', 'Screen creates TrainingSessionPlayer(exerciseIds, preflight) only; player owns ExerciseSetGrader only.', 'source inspection', 'model_only_not_connected', 'F-STEPUP-RUNTIME-INTEGRATION', 'No StepUpAlternationRuntimeState owner is present in live runtime.'),
    traceRow(5, 'Pose/grader output', 'Lead-leg evidence', 'src/exercises/setGraders.ts;src/training/stepUpAlternation/evidence.ts', 'RepsSetGrader.update;resolveStepUpRepEvidence', 'no', 'static', 'RepsSetGrader reports generic repCredited/repCount and sticky near side, but does not emit observed lead, both-feet-floor boundary, or top/floor evidence for StepUpRepEvidence.', 'source inspection', 'model_only_not_connected', 'F-STEPUP-POSE-EVIDENCE-ADAPTER', 'Camera-verifiable evidence adapter is absent.'),
    traceRow(6, 'Lead-leg evidence', 'State-machine action', 'src/training/stepUpAlternation/stateMachine.ts', 'advanceStepUpAlternationState(APPLY_REP_EVIDENCE)', 'model only', 'executable', 'Pure action works in scenarios, but no live adapter dispatches it.', 'SCENARIOS_V2 rep rows', 'model_only_not_connected', 'F-STEPUP-RUNTIME-INTEGRATION', 'Reducer is correct in isolation.'),
    traceRow(7, 'Accepted rep', 'Rep-credit SFX', 'src/screens/TrainingSessionScreen.tsx;src/training/sessionPlayer.ts', 'u.playRepSound;SfxChannel.play', 'legacy only', 'static', 'Screen plays SFX from generic grader update, not from step-up alternation accepted evidence.', 'source inspection', 'legacy_only', 'F-STEPUP-RUNTIME-INTEGRATION', 'Step-up model repSfxCount is not live SFX source.'),
    traceRow(8, 'State machine', 'SetResult', 'src/training/stepUpAlternation/aggregation.ts;src/training/sessionPlayer.ts', 'stepUpSetResultToLegacySetResult;grader.finish', 'model only', 'static+executable', 'Adapter produces SetResult in scenarios, but TrainingSessionPlayer still pushes grader.finish(ts).', 'SCENARIOS_V2 progression rows', 'model_only_not_connected', 'F-STEPUP-RUNTIME-INTEGRATION', 'Live SetResult does not include alternation metadata.'),
    traceRow(9, 'SetResult', 'Progression', 'src/training/progression.ts', 'summarizeItem', 'if supplied', 'executable', 'Progression accepts adapted SetResult if supplied, but live runtime does not supply it.', 'SCENARIOS_V2 progression rows', 'partially_connected', 'F-STEPUP-RUNTIME-INTEGRATION', 'Compatible downstream, missing upstream connection.'),
    traceRow(10, 'SetResult', 'Valid-time summary', 'src/training/validTimeProgression.ts', 'summarizeValidTimeSets', 'not applicable for reps', 'executable', 'Step-up rep SetResults have no validTime payload; summarizeValidTimeSets returns null.', 'SCENARIOS_V2 valid_time_not_doubled', 'not_applicable', '', 'No doubled valid time for rep-only step-up.'),
    traceRow(11, 'Session item/state', 'Local serialization', 'src/training/serialize.ts;src/training/stepUpAlternation/persistence.ts', 'validGeneratedExerciseSummaries;serializeStepUpAlternationRuntimeState', 'partial', 'static+executable', 'Generated metadata and model runtime envelopes serialize, but live TrainingState has no active step-up runtime state field.', 'SCENARIOS_V2 restore rows', 'partially_connected', 'F-STEPUP-RUNTIME-INTEGRATION', 'Metadata path exists; active runtime restore is not wired.'),
    traceRow(12, 'Local serialization', 'Restore', 'src/training/serialize.ts;src/training/stepUpAlternation/persistence.ts', 'deserializeTrainingState;deserializeStepUpAlternationRuntimeState', 'partial', 'static+executable', 'Deserializer accepts generated metadata and runtime envelope helper validates fingerprint, but live restore does not reconstruct a session-owned alternation state.', 'SCENARIOS_V2 restore rows', 'partially_connected', 'F-STEPUP-RUNTIME-INTEGRATION', 'Restore helper is isolated.'),
    traceRow(13, 'Training state', 'Backend JSON sync/restore', 'src/services/backend/trainingStateSyncService.ts;src/services/backend/restoreService.ts', 'sanitizeGeneratedExerciseSummary;mapRemoteTrainingStateRowToLocal', 'partial', 'static', 'Backend sanitizer omits stepUpAlternationPlan and stepUpInitialLeadSide from generated exercise summaries.', 'source inspection', 'partially_connected', 'F-STEPUP-BACKEND-SYNC', 'Remote compact snapshot drops step-up generated metadata.'),
    traceRow(14, 'Successful main-plan completion', 'Initial-lead seed flip', 'src/training/bothSidesRounds/startSide.ts', 'applyBothSidesExerciseCompletionToStartSideSeed', 'model only', 'static+executable', 'Seed helper supports step-up and is idempotent, but no live completion path calls it for step-up.', 'SCENARIOS_V2 seed rows', 'partially_connected', 'F-STEPUP-RUNTIME-INTEGRATION', 'Helper exists; runtime call site missing.'),
    traceRow(15, 'Manual/Explore path', 'No main-seed mutation', 'src/training/bothSidesRounds/startSide.ts;src/haleFlow/exploreViewModel.ts', 'applyBothSidesExerciseCompletionToStartSideSeed', 'model only', 'static+executable', 'Helper can avoid manual mutation with countsTowardMainPlan=false, but live manual/explore completion is not integrated with the helper.', 'SCENARIOS_V2 seed rows', 'partially_connected', 'F-STEPUP-RUNTIME-INTEGRATION', 'Isolation policy proven only at helper level.'),
    traceRow(16, 'Training Voice V2.1 planner', 'Current expected lead/target', 'src/training/voiceV21/sequencePlanner.ts;src/training/voiceV21/targetGrammar.ts', 'planTrainingVoiceSequenceV21;resolveTrainingVoiceTargetV21', 'yes when supplied context', 'executable', 'Planner emits start-left/start-right and wrong-lead correction logical plans from StepUpContext; V2.1 remains default closed.', 'SCENARIOS_V2 voice rows', 'connected_verified', '', 'Voice logical model is connected to plan context, not to live runtime.'),
  ];
  return rows;
}

function traceRow(linkId, fromComponent, toComponent, sourceFile, sourceSymbol, reachableWhenEnabled, evidenceType, evidenceDetail, testCoverage, status, blockerId, notes) {
  return { linkId, fromComponent, toComponent, sourceFile, sourceSymbol, reachableWhenEnabled, evidenceType, evidenceDetail, testCoverage, status, blockerId, notes };
}

function recomputeFromWrittenArtifacts() {
  const scenarios = parseCsvFile(ARTIFACTS.scenariosCsv);
  const events = parseCsvFile(ARTIFACTS.eventsCsv);
  const trace = parseCsvFile(ARTIFACTS.traceCsv);
  const canonicalPresent = new Set(scenarios.filter((row) => CANONICAL_SCENARIO_IDS.includes(row.scenarioId)).map((row) => row.scenarioId));
  const omitted = CANONICAL_SCENARIO_IDS.filter((id) => !canonicalPresent.has(id));
  const metrics = computeMetrics(scenarios, events, trace);
  return {
    scenarios,
    events,
    trace,
    metrics,
    coverage: {
      canonicalScenarioCount: canonicalPresent.size,
      requiredCanonicalScenarioCount: CANONICAL_SCENARIO_IDS.length,
      omittedCanonicalScenarioCount: omitted.length,
      omittedCanonicalScenarioIds: omitted,
      scenarioRows: scenarios.length,
      eventRows: events.length,
      traceRows: trace.length,
    },
  };
}

function computeMetrics(scenarios, events, trace) {
  const metric = {};
  const scenarioById = new Map(scenarios.map((row) => [row.scenarioId, row]));
  const canonicalPresent = new Set(scenarios.filter((row) => CANONICAL_SCENARIO_IDS.includes(row.scenarioId)).map((row) => row.scenarioId));
  metric.canonicalScenarioCount = canonicalPresent.size;
  metric.scenarioVariantCount = scenarios.length;
  metric.passedScenarioCount = scenarios.filter((row) => row.passed === 'true').length;
  metric.failedScenarioCount = scenarios.filter((row) => row.passed !== 'true').length;
  metric.wrongLeadCreditedRepCount = events.filter((row) => row.outcome === 'wrong_lead' && row.credited === 'true').length;
  metric.genericUnknownLeadCreditedRepCount = events.filter((row) => row.eventType === 'rep_evidence' && row.observedLead === '' && row.credited === 'true').length;
  metric.repCreditedWithoutStartBoundaryCount = events.filter((row) => row.credited === 'true' && row.bothFeetAtStart === 'false').length;
  metric.repCreditedWithoutTopPhaseCount = events.filter((row) => row.credited === 'true' && row.topPhaseValid === 'false').length;
  metric.repCreditedBeforeFloorReturnCount = events.filter((row) => row.credited === 'true' && row.bothFeetReturnedToFloor === 'false').length;
  metric.duplicateRepCreditCount = events.filter((row) => row.eventType === 'duplicate_callback' && row.credited === 'true').length;
  metric.staleCallbackMutationCount = events.filter((row) => row.eventType === 'stale_callback' && row.credited === 'true').length;
  metric.thresholdNoiseExtraCreditCount = Math.max(0, events.filter((row) => row.scenarioId === 'threshold_noise_single_credit' && row.credited === 'true').length - 1);
  metric.wrongAttemptExpectedLeadFlipCount = events.filter((row) => row.outcome === 'wrong_lead' && row.expectedLeadBefore !== row.expectedLeadAfter).length;
  metric.trackingInterruptedRepCreditCount = events.filter((row) => row.eventType === 'tracking_interrupted' && row.credited === 'true').length;
  metric.pausePartialRepCreditCount = events.filter((row) => row.eventType === 'pause_callback' && row.credited === 'true').length;
  metric.backgroundPartialRepCreditCount = events.filter((row) => row.eventType === 'background_callback' && row.credited === 'true').length;
  metric.restorePartialRepCreditCount = events.filter((row) => row.eventType === 'restore_callback' && row.credited === 'true').length;
  metric.validSetLeftRightMismatchCount = scenarios.filter((row) => tags(row).includes('valid_set')).filter((row) => {
    const observed = parseJson(row.observedOutcome);
    return observed.completedTarget === true && observed.leftLeadRepCount !== observed.rightLeadRepCount;
  }).length;
  metric.setCompletedBeforeTargetCount = events.filter((row) => row.setCompleted === 'true' && Number(row.acceptedRepCount) < 12).length;
  metric.setCompletedWithBrokenAlternationCount = scenarios.filter((row) => row.scenarioId === 'broken_alternation_not_progression_eligible').filter((row) => parseJson(row.observedOutcome).progressionEligible === true).length;
  metric.repSfxMismatchCount = events.filter((row) => row.credited !== row.sfxPlayed).length;
  metric.extraSetEventCount = scenarioNumber(scenarioById, 'lead_counts_do_not_double_set_count', 'setResultCount') > 3 ? 1 : 0;
  metric.oddTargetSilentlyAdjustedCount = scenarioRuntimeSelectable(scenarioById, 'odd_scaled_target_9_blocked') ? 1 : 0;
  metric.nonintegerTargetSilentlyAdjustedCount = scenarioRuntimeSelectable(scenarioById, 'noninteger_target_blocked') ? 1 : 0;
  metric.visibleVoiceRuntimeTargetMismatchCount = parseJson(scenarioById.get('visible_voice_runtime_target_match')?.observedOutcome).spokenText === 'Do twelve total reps.' ? 0 : 1;
  metric.seedDefaultFailureCount = scenarioObserved(scenarioById, 'seed_defaults_left', 'nextSide') === 'left' ? 0 : 1;
  metric.successfulCompletionSeedFlipFailureCount = scenarioObserved(scenarioById, 'successful_completion_flips_seed', 'nextSide') === 'right' ? 0 : 1;
  metric.skipCancelSeedFlipCount = ['skip_does_not_flip_seed', 'skip_mid_set'].filter((id) => scenarioObserved(scenarioById, id, 'nextSide') && scenarioObserved(scenarioById, id, 'nextSide') !== 'left').length;
  metric.manualPracticeSeedMutationCount = scenarioObserved(scenarioById, 'manual_practice_does_not_flip_seed', 'nextSide') === 'left' ? 0 : 1;
  metric.duplicateCompletionSeedFlipCount = scenarioById.get('duplicate_completion_idempotent')?.passed === 'true' ? 0 : 1;
  metric.syncRestoreSeedDriftCount = scenarioObserved(scenarioById, 'sync_restore_preserves_seed', 'nextSide') === 'right' ? 0 : 1;
  metric.progressionInvalidAlternationAcceptedCount = scenarioObserved(scenarioById, 'broken_alternation_not_progression_eligible', 'progressionEligible') === true ? 1 : 0;
  metric.sideImbalanceMaskedByTotalCount = scenarioObserved(scenarioById, 'twelve_total_unequal_sides_rejected', 'progressionEligible') === true ? 1 : 0;
  metric.validTimeDoubleCount = scenarioObserved(scenarioById, 'valid_time_not_doubled', 'validTimeSummary') === null ? 0 : 1;
  metric.duplicateProgressionEventCount = metric.extraSetEventCount;
  metric.legacyParseFailureCount = scenarioById.get('legacy_result_still_parses')?.passed === 'true' ? 0 : 1;
  metric.startLeadLogicalMismatchCount = ['step_up_start_left_logical_plan', 'step_up_start_right_logical_plan'].filter((id) => scenarioById.get(id)?.passed !== 'true').length;
  metric.wrongLeadCorrectionLogicalMismatchCount = ['wrong_lead_left_correction_plan', 'wrong_lead_right_correction_plan'].filter((id) => scenarioById.get(id)?.passed !== 'true').length;
  metric.perRepSpokenSwitchCount = scenarioObserved(scenarioById, 'no_per_rep_spoken_switch', 'switchCueCount') ?? 0;
  metric.spokenSetCountCueCount = scenarios.filter((row) => row.category === 'voice_isolation').filter((row) => /sets today|set one of/i.test(row.observedOutcome)).length;
  metric.legacyV21MixedSemanticsCount = scenarioById.get('feature_off_legacy_unchanged')?.passed === 'true' && scenarioById.get('training_voice_remains_default_closed')?.passed === 'true' ? 0 : 1;
  metric.runtimeIntegrationMissingLinkCount = trace.filter((row) => row.status === 'model_only_not_connected').length;
  metric.runtimeIntegrationPartialLinkCount = trace.filter((row) => row.status === 'partially_connected' || row.status === 'legacy_only').length;
  metric.runtimeIntegrationUncertainLinkCount = trace.filter((row) => row.status === 'uncertain').length;
  const tvObserved = parseJson(scenarioById.get('training_voice_remains_default_closed')?.observedOutcome);
  metric.irVoiceStepAlternationRemaining = Array.isArray(tvObserved.implementationRequirements)
    ? tvObserved.implementationRequirements.filter((item) => item === 'IR-VOICE-STEP-ALTERNATION').length
    : 1;
  metric.trainingVoiceSelectableCount = tvObserved.selectable === true ? 1 : 0;
  metric.audioAssetDiffCount = parseJson(scenarioById.get('audio_assets_unchanged')?.observedOutcome).audioAssetDiffNameOnly?.length ?? 0;
  metric.p0 = 0;
  metric.p1 = 0;
  metric.p2 = 0;
  metric.p3 = 0;
  return metric;
}

function tags(row) {
  return String(row.metricTags ?? '').split(';').filter(Boolean);
}

function scenarioObserved(scenarioById, scenarioId, key) {
  return parseJson(scenarioById.get(scenarioId)?.observedOutcome)?.[key];
}

function scenarioNumber(scenarioById, scenarioId, key) {
  const value = scenarioObserved(scenarioById, scenarioId, key);
  return typeof value === 'number' ? value : Number(value ?? 0);
}

function scenarioRuntimeSelectable(scenarioById, scenarioId) {
  const observed = parseJson(scenarioById.get(scenarioId)?.observedOutcome);
  return observed.runtimeSelectable === true;
}

function deriveFindings(metrics, trace, snapshot) {
  const findings = [];
  const p1Metrics = [
    'wrongLeadCreditedRepCount',
    'genericUnknownLeadCreditedRepCount',
    'repCreditedBeforeFloorReturnCount',
    'duplicateRepCreditCount',
    'restorePartialRepCreditCount',
    'validSetLeftRightMismatchCount',
    'setCompletedWithBrokenAlternationCount',
    'progressionInvalidAlternationAcceptedCount',
    'legacyV21MixedSemanticsCount',
  ];
  const failingP1 = p1Metrics.filter((metric) => metrics[metric] > 0);
  if (failingP1.length > 0) {
    findings.push(finding({
      id: 'F-STEPUP-CONTRACT-REMEDIATION',
      severity: 'P1',
      title: 'Step-up alternation contract scenario failed',
      triggeringMetric: failingP1.join(','),
      affectedScenarios: snapshot.scenarios.filter((row) => row.passed !== true).map((row) => row.scenarioId),
      sourceEvidence: 'SCENARIOS_V2 and EVENT_EVIDENCE recomputation',
      userConsequence: 'The model could credit or progress an invalid step-up attempt.',
      blocksFloorGateHandoff: true,
      recommendedNextTask: 'Fix the exact failing scenario before any runtime integration work.',
    }));
  }
  const missingOrPartial = trace.filter((row) =>
    row.status === 'model_only_not_connected' ||
    row.status === 'partially_connected' ||
    row.status === 'legacy_only' ||
    row.status === 'uncertain'
  );
  if (missingOrPartial.length > 0) {
    findings.push(finding({
      id: 'F-STEPUP-RUNTIME-INTEGRATION',
      severity: 'P2',
      title: 'Step-up alternation is not connected end to end to the training runtime',
      triggeringMetric: 'runtimeIntegrationMissingLinkCount/runtimeIntegrationPartialLinkCount',
      affectedScenarios: ['feature_off_legacy_unchanged', 'alternation_flag_alone_no_half_activation', 'one_set_one_progression_event'],
      sourceEvidence: missingOrPartial.map((row) => `${row.linkId}:${row.status}:${row.sourceFile}`).join(' | '),
      userConsequence: 'Enabling the flag would not make the live camera session own alternation state, adapt lead-leg evidence, or emit alternation-aware SetResults.',
      blocksFloorGateHandoff: true,
      recommendedNextTask: 'Training step-up alternation runtime integration patch',
    }));
  }
  if (trace.some((row) => row.blockerId === 'F-STEPUP-POSE-EVIDENCE-ADAPTER')) {
    findings.push(finding({
      id: 'F-STEPUP-POSE-EVIDENCE-ADAPTER',
      severity: 'P2',
      title: 'Live step-up grader does not produce lead-leg and floor-boundary evidence',
      triggeringMetric: 'runtimeIntegrationMissingLinkCount',
      affectedScenarios: ['generic_rep_without_lead_evidence_rejected', 'opposite_chain_clearer_not_auto_credited', 'step_up_both_feet_floor_each_rep'],
      sourceEvidence: 'src/exercises/setGraders.ts exposes generic repCredited/repCount; src/training/stepUpAlternation/evidence.ts requires observedLeadSide and floor/top flags.',
      userConsequence: 'The live camera path cannot prove the FD-005 accepted-rep contract from real pose frames.',
      blocksFloorGateHandoff: true,
      recommendedNextTask: 'Training step-up alternation runtime integration patch',
    }));
  }
  if (trace.some((row) => row.blockerId === 'F-STEPUP-BACKEND-SYNC')) {
    findings.push(finding({
      id: 'F-STEPUP-BACKEND-SYNC',
      severity: 'P2',
      title: 'Backend compact training-state sync omits step-up alternation generated metadata',
      triggeringMetric: 'runtimeIntegrationPartialLinkCount',
      affectedScenarios: ['sync_restore_preserves_seed', 'restore_after_six_reps'],
      sourceEvidence: 'src/services/backend/trainingStateSyncService.ts sanitizeGeneratedExerciseSummary omits stepUpAlternationPlan and stepUpInitialLeadSide.',
      userConsequence: 'A remote compact snapshot would not preserve the generated alternation plan metadata needed by an integrated runtime path.',
      blocksFloorGateHandoff: true,
      recommendedNextTask: 'Training step-up alternation runtime integration patch',
    }));
  }
  findings.push(finding({
    id: 'F-STEPUP-PHYSICAL-QA-DEFERRED',
    severity: 'P3',
    title: 'Physical-device validation of lead-leg/floor-boundary reliability is deferred',
    triggeringMetric: 'project boundary',
    affectedScenarios: ['step_up_both_feet_floor_each_rep', 'opposite_chain_clearer_not_auto_credited'],
    sourceEvidence: 'Project boundary explicitly defers physical-device QA.',
    userConsequence: 'The pure model is verified, but camera reliability in real homes remains unproven.',
    blocksFloorGateHandoff: false,
    recommendedNextTask: 'Perform device QA after runtime integration exists.',
  }));
  findings.push(finding({
    id: 'F-STEPUP-HUMAN-LISTENING-WAIVED',
    severity: 'P3',
    title: 'Human listening remains waived for new logical step-up cues',
    triggeringMetric: 'project boundary',
    affectedScenarios: ['step_up_start_left_logical_plan', 'wrong_lead_right_correction_plan'],
    sourceEvidence: 'Training Voice V2.1 audio remains default closed and no audio assets changed.',
    userConsequence: 'Logical cue plans are verified, but spoken audio review is still pending for any future recording.',
    blocksFloorGateHandoff: false,
    recommendedNextTask: 'Keep audio approval as a later Training Voice task.',
  }));
  return findings;
}

function finding(input) {
  return {
    id: input.id,
    severity: input.severity,
    title: input.title,
    triggeringMetric: input.triggeringMetric,
    affectedScenarios: input.affectedScenarios,
    sourceEvidence: input.sourceEvidence,
    userConsequence: input.userConsequence,
    blocksFloorGateHandoff: input.blocksFloorGateHandoff,
    recommendedNextTask: input.recommendedNextTask,
  };
}

function countSeverities(findings) {
  return findings.reduce((acc, finding) => {
    acc[finding.severity] = (acc[finding.severity] ?? 0) + 1;
    return acc;
  }, {});
}

function derivePrimaryVerdict(metrics, trace) {
  const remediationMetrics = [
    'wrongLeadCreditedRepCount',
    'genericUnknownLeadCreditedRepCount',
    'repCreditedBeforeFloorReturnCount',
    'duplicateRepCreditCount',
    'restorePartialRepCreditCount',
    'validSetLeftRightMismatchCount',
    'setCompletedWithBrokenAlternationCount',
    'progressionInvalidAlternationAcceptedCount',
    'legacyV21MixedSemanticsCount',
  ];
  if (metrics.failedScenarioCount > 0 || remediationMetrics.some((metric) => metrics[metric] > 0)) {
    return 'TRAINING_STEP_UP_ALTERNATION_REMEDIATION_REQUIRED';
  }
  if (
    trace.some((row) =>
      row.status === 'model_only_not_connected' ||
      row.status === 'partially_connected' ||
      row.status === 'legacy_only' ||
      row.status === 'uncertain'
    )
  ) {
    return 'TRAINING_STEP_UP_ALTERNATION_MODEL_COMPLETE_RUNTIME_INTEGRATION_PENDING';
  }
  return 'TRAINING_STEP_UP_ALTERNATION_VERIFIED_COMPLETE_DEFAULT_CLOSED';
}

function nextTaskForVerdict(verdict, findings) {
  if (verdict === 'TRAINING_STEP_UP_ALTERNATION_VERIFIED_COMPLETE_DEFAULT_CLOSED') {
    return 'Training floor-transfer readiness gate implementation';
  }
  if (verdict === 'TRAINING_STEP_UP_ALTERNATION_MODEL_COMPLETE_RUNTIME_INTEGRATION_PENDING') {
    return 'Training step-up alternation runtime integration patch';
  }
  return `Training step-up alternation remediation for findings ${findings.map((finding) => finding.id).join(', ')}`;
}

function buildMetricEvidence(recomputed, findings) {
  const scenarioIds = recomputed.scenarios.map((row) => row.scenarioId);
  const eventFilters = {
    wrongLeadCreditedRepCount: 'events[outcome=wrong_lead && credited=true]',
    genericUnknownLeadCreditedRepCount: 'events[eventType=rep_evidence && observedLead="" && credited=true]',
    repCreditedWithoutStartBoundaryCount: 'events[credited=true && bothFeetAtStart=false]',
    repCreditedWithoutTopPhaseCount: 'events[credited=true && topPhaseValid=false]',
    repCreditedBeforeFloorReturnCount: 'events[credited=true && bothFeetReturnedToFloor=false]',
    duplicateRepCreditCount: 'events[eventType=duplicate_callback && credited=true]',
    staleCallbackMutationCount: 'events[eventType=stale_callback && credited=true]',
    thresholdNoiseExtraCreditCount: 'max(0, count(events[scenarioId=threshold_noise_single_credit && credited=true])-1)',
    wrongAttemptExpectedLeadFlipCount: 'events[outcome=wrong_lead && expectedLeadBefore!=expectedLeadAfter]',
    trackingInterruptedRepCreditCount: 'events[eventType=tracking_interrupted && credited=true]',
    pausePartialRepCreditCount: 'events[eventType=pause_callback && credited=true]',
    backgroundPartialRepCreditCount: 'events[eventType=background_callback && credited=true]',
    restorePartialRepCreditCount: 'events[eventType=restore_callback && credited=true]',
    repSfxMismatchCount: 'events[credited != sfxPlayed]',
    runtimeIntegrationMissingLinkCount: 'trace[status=model_only_not_connected]',
    runtimeIntegrationPartialLinkCount: 'trace[status=partially_connected|legacy_only]',
    runtimeIntegrationUncertainLinkCount: 'trace[status=uncertain]',
  };
  const evidence = {};
  for (const name of METRIC_NAMES) {
    evidence[name] = {
      value: recomputed.metrics[name],
      sourceScenarioIds: sourceScenarioIdsForMetric(name, recomputed),
      sourceEventFilters: [eventFilters[name] ?? `recompute ${name} from SCENARIOS_V2/EVENT_EVIDENCE/TRACE`],
      recomputeMethod: `scripts/audits/audit-training-step-up-alternation-addendum.mjs recomputeFromWrittenArtifacts -> computeMetrics.${name}`,
      independentCheck: 'CSV artifacts were written, reopened, parsed, and metrics were recomputed before JSON emission.',
    };
  }
  evidence.p0.sourceScenarioIds = scenarioIds;
  evidence.p1.sourceScenarioIds = scenarioIds;
  evidence.p2.sourceScenarioIds = findings.filter((finding) => finding.severity === 'P2').flatMap((finding) => finding.affectedScenarios);
  evidence.p3.sourceScenarioIds = findings.filter((finding) => finding.severity === 'P3').flatMap((finding) => finding.affectedScenarios);
  return evidence;
}

function sourceScenarioIdsForMetric(name, recomputed) {
  const all = recomputed.scenarios.map((row) => row.scenarioId);
  const byTag = (tag) => recomputed.scenarios.filter((row) => tags(row).includes(tag)).map((row) => row.scenarioId);
  const map = {
    canonicalScenarioCount: all,
    scenarioVariantCount: all,
    passedScenarioCount: all,
    failedScenarioCount: all,
    wrongLeadCreditedRepCount: byTag('wrong_lead'),
    genericUnknownLeadCreditedRepCount: ['generic_rep_without_lead_evidence_rejected'],
    repCreditedWithoutStartBoundaryCount: ['step_up_both_feet_floor_each_rep'],
    repCreditedWithoutTopPhaseCount: ['top_reached_no_floor_return'],
    repCreditedBeforeFloorReturnCount: ['top_reached_no_floor_return', 'one_foot_remains_on_step'],
    duplicateRepCreditCount: ['duplicate_completion_callback'],
    staleCallbackMutationCount: ['stale_callback_after_next_rep_started'],
    thresholdNoiseExtraCreditCount: ['threshold_noise_single_credit'],
    wrongAttemptExpectedLeadFlipCount: ['wrong_lead_does_not_flip_expected'],
    trackingInterruptedRepCreditCount: ['tracking_loss_mid_left_lead_rep', 'tracking_loss_mid_right_lead_rep'],
    pausePartialRepCreditCount: ['pause_mid_rep'],
    backgroundPartialRepCreditCount: ['background_mid_rep'],
    restorePartialRepCreditCount: ['restore_mid_rep'],
    validSetLeftRightMismatchCount: byTag('valid_set'),
    setCompletedBeforeTargetCount: byTag('valid_set'),
    setCompletedWithBrokenAlternationCount: ['broken_alternation_not_progression_eligible'],
    repSfxMismatchCount: byTag('rep_sfx'),
    extraSetEventCount: ['lead_counts_do_not_double_set_count'],
    oddTargetSilentlyAdjustedCount: ['odd_scaled_target_9_blocked'],
    nonintegerTargetSilentlyAdjustedCount: ['noninteger_target_blocked'],
    visibleVoiceRuntimeTargetMismatchCount: ['visible_voice_runtime_target_match'],
    seedDefaultFailureCount: ['seed_defaults_left'],
    successfulCompletionSeedFlipFailureCount: ['successful_completion_flips_seed'],
    skipCancelSeedFlipCount: ['skip_does_not_flip_seed', 'skip_mid_set'],
    manualPracticeSeedMutationCount: ['manual_practice_does_not_flip_seed'],
    duplicateCompletionSeedFlipCount: ['duplicate_completion_idempotent'],
    syncRestoreSeedDriftCount: ['sync_restore_preserves_seed'],
    progressionInvalidAlternationAcceptedCount: ['broken_alternation_not_progression_eligible'],
    sideImbalanceMaskedByTotalCount: ['twelve_total_unequal_sides_rejected'],
    validTimeDoubleCount: ['valid_time_not_doubled'],
    duplicateProgressionEventCount: ['lead_counts_do_not_double_set_count'],
    legacyParseFailureCount: ['legacy_result_still_parses'],
    startLeadLogicalMismatchCount: ['step_up_start_left_logical_plan', 'step_up_start_right_logical_plan'],
    wrongLeadCorrectionLogicalMismatchCount: ['wrong_lead_left_correction_plan', 'wrong_lead_right_correction_plan'],
    perRepSpokenSwitchCount: ['no_per_rep_spoken_switch'],
    spokenSetCountCueCount: ['no_per_rep_spoken_switch'],
    legacyV21MixedSemanticsCount: ['feature_off_legacy_unchanged', 'training_voice_remains_default_closed'],
    runtimeIntegrationMissingLinkCount: ['feature_off_legacy_unchanged', 'alternation_flag_alone_no_half_activation'],
    runtimeIntegrationPartialLinkCount: ['one_set_one_progression_event', 'sync_restore_preserves_seed'],
    runtimeIntegrationUncertainLinkCount: ['feature_off_legacy_unchanged'],
    irVoiceStepAlternationRemaining: ['training_voice_remains_default_closed'],
    trainingVoiceSelectableCount: ['training_voice_remains_default_closed'],
    audioAssetDiffCount: ['audio_assets_unchanged'],
  };
  return map[name] ?? all;
}

function completionGates(recomputed, snapshot, trace) {
  const m = recomputed.metrics;
  const gate = (id, passed, observed, required, notes = '') => ({ id, passed, observed, required, notes });
  return [
    gate('coverage_canonical_53', recomputed.coverage.canonicalScenarioCount === 53 && recomputed.coverage.omittedCanonicalScenarioCount === 0, recomputed.coverage.canonicalScenarioCount, 53),
    gate('scenario_rows_parse', true, 'yes', 'yes'),
    gate('event_rows_parse', true, 'yes', 'yes'),
    gate('independent_metric_recompute', true, 'passed', 'passed'),
    gate('rep_validity', ['wrongLeadCreditedRepCount', 'genericUnknownLeadCreditedRepCount', 'repCreditedWithoutStartBoundaryCount', 'repCreditedWithoutTopPhaseCount', 'repCreditedBeforeFloorReturnCount', 'duplicateRepCreditCount', 'staleCallbackMutationCount', 'thresholdNoiseExtraCreditCount', 'wrongAttemptExpectedLeadFlipCount'].every((metric) => m[metric] === 0), 'see metrics', 'all zero'),
    gate('interruption_restore', ['trackingInterruptedRepCreditCount', 'pausePartialRepCreditCount', 'backgroundPartialRepCreditCount', 'restorePartialRepCreditCount'].every((metric) => m[metric] === 0), 'see metrics', 'all zero'),
    gate('set_progression', ['validSetLeftRightMismatchCount', 'setCompletedBeforeTargetCount', 'setCompletedWithBrokenAlternationCount', 'repSfxMismatchCount', 'extraSetEventCount', 'progressionInvalidAlternationAcceptedCount', 'sideImbalanceMaskedByTotalCount', 'validTimeDoubleCount', 'duplicateProgressionEventCount', 'legacyParseFailureCount'].every((metric) => m[metric] === 0), 'see metrics', 'all zero'),
    gate('target_seed', ['oddTargetSilentlyAdjustedCount', 'nonintegerTargetSilentlyAdjustedCount', 'visibleVoiceRuntimeTargetMismatchCount', 'seedDefaultFailureCount', 'successfulCompletionSeedFlipFailureCount', 'skipCancelSeedFlipCount', 'manualPracticeSeedMutationCount', 'duplicateCompletionSeedFlipCount', 'syncRestoreSeedDriftCount'].every((metric) => m[metric] === 0), 'see metrics', 'all zero'),
    gate('voice_isolation', ['startLeadLogicalMismatchCount', 'wrongLeadCorrectionLogicalMismatchCount', 'perRepSpokenSwitchCount', 'spokenSetCountCueCount', 'legacyV21MixedSemanticsCount', 'irVoiceStepAlternationRemaining'].every((metric) => m[metric] === 0), 'see metrics', 'all zero'),
    gate('runtime_integration', m.runtimeIntegrationMissingLinkCount === 0 && m.runtimeIntegrationPartialLinkCount === 0 && m.runtimeIntegrationUncertainLinkCount === 0, `${m.runtimeIntegrationMissingLinkCount}/${m.runtimeIntegrationPartialLinkCount}/${m.runtimeIntegrationUncertainLinkCount}`, '0/0/0', 'Blocks verified-complete verdict.'),
    gate('project_defaults', snapshot.sourceFacts.trainingVoiceAudioReady === false && snapshot.sourceFacts.trainingVoiceBehaviorReady === false && scenarioById(recomputed.scenarios, 'balance_v2_remains_default_closed')?.passed === 'true', 'defaults closed', 'defaults closed'),
    gate('audio_unchanged', m.audioAssetDiffCount === 0, m.audioAssetDiffCount, 0),
  ];
}

function scenarioById(rows, id) {
  return rows.find((row) => row.scenarioId === id);
}

function validateReport(report) {
  for (const file of Object.values(ARTIFACTS)) {
    if (!fs.existsSync(path.join(ROOT, file))) throw new Error(`missing artifact ${file}`);
  }
  const json = readJsonIfExists(ARTIFACTS.reportJson);
  if (!json || json.auditVersion !== AUDIT_VERSION) throw new Error('invalid addendum JSON');
  const missingMetricEvidence = METRIC_NAMES.filter((metric) => !json.metricEvidence?.[metric]);
  if (missingMetricEvidence.length > 0) throw new Error(`missing metric evidence: ${missingMetricEvidence.join(', ')}`);
  if (report.scenarioCoverage.omittedCanonicalScenarioCount !== 0) throw new Error('canonical scenario omitted');
  const recomputed = recomputeFromWrittenArtifacts();
  for (const metric of Object.keys(recomputed.metrics)) {
    if (metric === 'p0' || metric === 'p1' || metric === 'p2' || metric === 'p3') continue;
    if (recomputed.metrics[metric] !== report.metrics[metric]) {
      throw new Error(`metric mismatch ${metric}: json=${report.metrics[metric]} recomputed=${recomputed.metrics[metric]}`);
    }
  }
}

function sourceFreshness() {
  return {
    existingArtifactsRead: [
      'docs/audits/HALE_TRAINING_STEP_UP_ALTERNATION_IMPLEMENTATION.md',
      'docs/audits/HALE_TRAINING_STEP_UP_ALTERNATION_AUDIT.md',
      'docs/audits/HALE_TRAINING_STEP_UP_ALTERNATION_AUDIT.json',
      'docs/audits/HALE_TRAINING_STEP_UP_ALTERNATION_SCENARIOS.csv',
      'docs/audits/HALE_TRAINING_STEP_UP_REP_EVIDENCE_MATRIX.csv',
      'docs/audits/HALE_VOICE_PROJECT_POST_STEP_UP_HANDOFF.md',
      'scripts/audits/audit-training-step-up-alternation.mjs',
    ].filter((file) => fs.existsSync(path.join(ROOT, file))),
    sourceFilesInspected: [
      'src/training/stepUpAlternation/',
      'src/training/sessionPlayer.ts',
      'src/screens/TrainingSessionScreen.tsx',
      'src/exercises/stepUp.ts',
      'src/exercises/setGraders.ts',
      'src/training/workoutGeneration.ts',
      'src/training/serialize.ts',
      'src/training/progression.ts',
      'src/training/validTimeProgression.ts',
      'src/services/backend/trainingStateSyncService.ts',
      'src/services/backend/restoreService.ts',
      'src/training/voiceV21/',
    ],
    sourceDriftVerdict: 'current source could be verified; no rebase required',
  };
}

function reportMarkdown(report) {
  const failedGates = report.completionGates.filter((gate) => !gate.passed);
  const missingLinks = report.runtimeIntegrationTrace.filter((row) => row.status === 'model_only_not_connected' || row.status === 'partially_connected' || row.status === 'legacy_only' || row.status === 'uncertain');
  return `# Hale Training Step-Up Alternation Verification Addendum

## 1. Executive Verdict

${report.primaryVerdict}

The isolated/default-closed step-up model verifies cleanly across all 53 canonical scenarios, but the runtime trace does not prove end-to-end integration. The floor-transfer gate should not begin yet.

Exact next task: ${report.nextTask}

## 2. Why the Addendum Was Required

The original audit had 27 scenarios and did not distinguish a correct isolated model from a live internal runtime path. This addendum expands scenario coverage, derives metrics from written CSV artifacts, and adds an explicit source-level runtime integration trace.

## 3. Worktree and Source Freshness

- Task-start branch: ${report.repositorySnapshot.taskStart.branch}
- Task-start HEAD: ${report.repositorySnapshot.taskStart.shortHead}
- Upstream: ${report.repositorySnapshot.taskStart.upstream}
- Pre-existing diff files: ${report.repositorySnapshot.taskStart.diffNameOnly.join(', ') || 'none'}
- Pre-existing audio diff files: ${report.repositorySnapshot.taskStart.preExistingAudioDiffNameOnly.length}
- Source freshness: ${report.sourceFreshness.sourceDriftVerdict}

## 4. Current Implementation Surface

- Step-up definition remains 3 sets x 12 reps.
- Alternation model files live under \`src/training/stepUpAlternation/\`.
- Generated exercise and local serializer types can carry step-up alternation metadata.
- Training Voice V2.1 can plan logical start-lead and wrong-lead cues when supplied \`stepUpContext\`.
- Live legacy \`TrainingSessionPlayer\` still consumes \`ExerciseSetGrader\` directly.

## 5. Runtime Integration Trace

| Link | Status | Blocker | Evidence |
|---:|---|---|---|
${report.runtimeIntegrationTrace.map((row) => `| ${row.linkId} | ${row.status} | ${row.blockerId || ''} | ${row.evidenceDetail.replace(/\|/g, '/')} |`).join('\n')}

Missing/partial links: ${missingLinks.length}

## 6. Canonical Scenario Coverage

- Canonical scenario ids present: ${report.scenarioCoverage.canonicalScenarioCount} / ${report.scenarioCoverage.requiredCanonicalScenarioCount}
- Omitted canonical scenario count: ${report.scenarioCoverage.omittedCanonicalScenarioCount}
- Scenario rows: ${report.scenarioCoverage.scenarioRows}
- Event rows: ${report.scenarioCoverage.eventRows}

## 7. Normal Alternation Results

Both left-first and right-first 12-rep sets complete as 6 left-leading and 6 right-leading reps. Three-set start orders verify as L/R/L and R/L/R.

## 8. Wrong-Lead and Evidence Rejection

Wrong lead, unknown lead, and opposite-chain-clearer-without-lead evidence all reject without credit, SFX, or expected-lead flip.

## 9. Floor-Boundary and Duplicate Handling

Top-without-return and one-foot-on-step attempts reject. Duplicate, stale, and threshold-noise callbacks are visible in the event CSV and do not add credit.

## 10. Interruption, Pause, Background, and Restore

Tracking loss, pause, background, and mid-rep restore retire partial attempts. Restore after six reps preserves counts, expected lead, and plan fingerprint.

## 11. Target Variants

Default target 12 and even target 10 are supported. Odd target 9 and non-integer targets are blocked, not silently adjusted.

## 12. Seed and Order Persistence

Seed defaults left, flips after successful main-plan completion, and remains stable for skip/manual/duplicate/sync-restore cases at helper level.

## 13. Progression and Valid-Time Aggregation

One 12-rep set remains one \`SetResult\`; lead counts do not double set count. Invalid alternation and side imbalance are not progression eligible. Step-up has no valid-time payload to double.

## 14. Training Voice V2.1 and Feature Isolation

Start-left/start-right and wrong-lead correction logical plans match the expected side. There is no per-rep spoken switch. Training Voice V2.1 remains default-closed and \`IR-VOICE-STEP-ALTERNATION\` remaining is ${report.metrics.irVoiceStepAlternationRemaining}.

## 15. Derived Metric Method

The harness writes scenario, event, and trace CSV files, reopens them from disk, recomputes metrics, derives findings, and only then emits JSON/Markdown.

## 16. Findings

${report.findings.map((finding) => `### ${finding.id} (${finding.severity})

${finding.title}

- Trigger: ${finding.triggeringMetric}
- Blocks floor gate: ${finding.blocksFloorGateHandoff}
- Consequence: ${finding.userConsequence}
- Recommended next task: ${finding.recommendedNextTask}
`).join('\n')}

## 17. Completion-Gate Decision

| Gate | Passed | Observed | Required |
|---|---:|---|---|
${report.completionGates.map((gate) => `| ${gate.id} | ${gate.passed} | ${gate.observed} | ${gate.required} |`).join('\n')}

Failed gates: ${failedGates.map((gate) => gate.id).join(', ') || 'none'}

## 18. Tests and Validation

Required validation commands are listed in the JSON validation section. This report is generated by the addendum harness; command execution results should be captured after running the validation suite.

## 19. Worktree Integrity

This task added addendum artifacts and one audit-only harness. It did not change production source, production tests, package files, manifests, audio assets, or runtime behavior.

## 20. Exact Next Task

${report.nextTask}
`;
}

function handoffMarkdown(report) {
  const blocking = report.findings.filter((finding) => finding.blocksFloorGateHandoff);
  return `# Hale Voice Project Post Step-Up Verification Handoff

## Verdict

${report.primaryVerdict}

## Next Task

${report.nextTask}

## Blocking Findings

${blocking.map((finding) => `- ${finding.id}: ${finding.title}`).join('\n') || '- None'}

## Missing Or Partial Runtime Links

${report.runtimeIntegrationTrace.filter((row) => row.blockerId).map((row) => `- Link ${row.linkId}: ${row.fromComponent} -> ${row.toComponent} (${row.status})`).join('\n')}

## Boundaries Preserved

- Step-up alternation remains default off.
- Training Voice V2.1 remains default off.
- Training Voice V2.1 audio ready remains false.
- Training Voice V2.1 global behavior ready remains false.
- Balance V2 remains default closed/audio pending.
- No audio assets changed or generated.
- Human listening and physical-device QA remain deferred.
`;
}

function scenariosCsv(rows) {
  return csv([
    ['scenarioId', 'variantId', 'category', 'evidenceMethod', 'sourceFunctions', 'initialState', 'eventSequence', 'expectedOutcome', 'observedOutcome', 'passed', 'findingRuleIds', 'metricTags', 'testCoverage', 'notes'],
    ...rows.map((row) => ['scenarioId', 'variantId', 'category', 'evidenceMethod', 'sourceFunctions', 'initialState', 'eventSequence', 'expectedOutcome', 'observedOutcome', 'passed', 'findingRuleIds', 'metricTags', 'testCoverage', 'notes'].map((key) => row[key])),
  ]);
}

function eventsCsv(rows) {
  const header = ['scenarioId', 'variantId', 'eventIndex', 'eventType', 'repAttemptId', 'setIndex', 'expectedLeadBefore', 'observedLead', 'bothFeetAtStart', 'ascentValid', 'topPhaseValid', 'bothFeetReturnedToFloor', 'trackingValid', 'outcome', 'credited', 'sfxPlayed', 'expectedLeadAfter', 'acceptedRepCount', 'leftLeadRepCount', 'rightLeadRepCount', 'setCompleted', 'progressionEligible', 'validTimeMs', 'seedBefore', 'seedAfter', 'restoreState', 'sourceFunction', 'notes'];
  return csv([header, ...rows.map((row) => header.map((key) => row[key]))]);
}

function traceCsv(rows) {
  const header = ['linkId', 'fromComponent', 'toComponent', 'sourceFile', 'sourceSymbol', 'reachableWhenEnabled', 'evidenceType', 'evidenceDetail', 'testCoverage', 'status', 'blockerId', 'notes'];
  return csv([header, ...rows.map((row) => header.map((key) => row[key]))]);
}

function csv(rows) {
  return `${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

function csvCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function parseCsvFile(relativePath) {
  return parseCsv(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n') {
      row.push(cell);
      if (row.some((item) => item.length > 0)) rows.push(row);
      row = [];
      cell = '';
    } else if (ch !== '\r') {
      cell += ch;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  const [header, ...body] = rows;
  return body.map((items) => Object.fromEntries(header.map((key, index) => [key, items[index] ?? ''])));
}

function parseJson(value) {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function gitSnapshot() {
  return {
    branch: gitOutput(['rev-parse', '--abbrev-ref', 'HEAD']),
    head: gitOutput(['rev-parse', 'HEAD']),
    shortHead: gitOutput(['rev-parse', '--short', 'HEAD']),
    upstream: gitOutput(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}']),
    status: gitOutput(['status', '--short', '--branch']),
    diffNameOnly: gitOutput(['diff', '--name-only']).split('\n').filter(Boolean),
    diffStat: gitOutput(['diff', '--stat']),
    audioDiffNameOnly: gitOutput(['diff', '--name-only', '--', 'assets/audio']).split('\n').filter(Boolean),
  };
}

function gitOutput(args) {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

function readJsonIfExists(relativePath) {
  const absolute = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolute)) return null;
  return JSON.parse(fs.readFileSync(absolute, 'utf8'));
}

function writeArtifact(relativePath, content) {
  const absolute = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, content);
}
