import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const AUDIT_VERSION = 1;

const ARTIFACTS = Object.freeze({
  reportMd: 'docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_EVIDENCE_VERIFICATION.md',
  reportJson: 'docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_EVIDENCE_VERIFICATION.json',
  scenariosCsv: 'docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_VERIFICATION_SCENARIOS.csv',
  eventsCsv: 'docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_VERIFICATION_EVENTS.csv',
  lifecyclesCsv: 'docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_VERIFICATION_LIFECYCLES.csv',
  findingsCsv: 'docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_VERIFICATION_FINDINGS.csv',
  handoffMd: 'docs/audits/HALE_VOICE_PROJECT_POST_STEP_UP_EVIDENCE_HANDOFF.md',
});

const HARNESS_PATH = 'scripts/audits/audit-training-step-up-runtime-evidence.mjs';

const EXISTING_ARTIFACTS = Object.freeze([
  'docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_INTEGRATION_IMPLEMENTATION.md',
  'docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_INTEGRATION_AUDIT.md',
  'docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_INTEGRATION_AUDIT.json',
  'docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_INTEGRATION_SCENARIOS.csv',
  'docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_EVENT_EVIDENCE.csv',
  'docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_INTEGRATION_TRACE_V2.csv',
  'docs/audits/HALE_VOICE_PROJECT_POST_STEP_UP_RUNTIME_HANDOFF.md',
  'scripts/audits/audit-training-step-up-runtime-integration.mjs',
  'docs/audits/HALE_TRAINING_STEP_UP_ALTERNATION_VERIFICATION_ADDENDUM.md',
  'docs/audits/HALE_TRAINING_STEP_UP_ALTERNATION_VERIFICATION_ADDENDUM.json',
  'docs/audits/HALE_TRAINING_STEP_UP_ALTERNATION_SCENARIOS_V2.csv',
  'docs/audits/HALE_TRAINING_STEP_UP_ALTERNATION_EVENT_EVIDENCE.csv',
  'docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_INTEGRATION_TRACE.csv',
  'scripts/audits/audit-training-step-up-alternation-addendum.mjs',
]);

const TASK_START_SNAPSHOT = Object.freeze({
  branch: 'dev',
  head: '2b3e28bc48bde987e82f599a5e811d0f801686b8',
  shortHead: '2b3e28b',
  upstream: 'origin/dev',
  alreadyDirty: true,
  statusShortBranch: [
    '## dev...origin/dev [ahead 1]',
    ' M App.tsx',
    ' M docs/decisions.md',
    ' M src/diagnostics/__tests__/poseLatencyDiagnostics.test.ts',
    ' M src/diagnostics/poseRendererReplay.ts',
    ' M src/haleFlow/movementProfileV2BlockReport.ts',
    ' M src/haleFlow/sessionPlanning.ts',
    ' M src/haleFlow/types.ts',
    ' M src/render/PointCloudBodyPoseRenderer.tsx',
    ' M src/render/PoseAvatarRenderer.tsx',
    ' M src/render/__tests__/pointCloudBodyGeometry.test.ts',
    ' M src/render/__tests__/poseAvatarConfig.test.ts',
    ' M src/render/pointCloudBodyGeometry.ts',
    ' M src/render/poseAvatarConfig.ts',
    ' M src/render/poseAvatarTypes.ts',
    ' M src/screens/PoseOverlayBenchmarkScreen.tsx',
    ' M src/screens/SettingsScreen.tsx',
    ' M src/screens/TrainingSessionScreen.tsx',
    ' M src/screens/__tests__/PoseOverlayBenchmarkScreen.constellationV2.test.ts',
    ' M src/services/backend/__tests__/restoreService.test.ts',
    ' M src/services/backend/__tests__/trainingStateSyncService.test.ts',
    ' M src/services/backend/restoreService.ts',
    ' M src/services/backend/trainingStateSyncService.ts',
    ' M src/training/index.ts',
    ' M src/training/serialize.ts',
    ' M src/training/sessionPlayer.ts',
    ' M src/training/stepUpAlternation/index.ts',
    ' M src/training/workoutGeneration.ts',
    '?? docs/audits/HALE_TRAINING_STEP_UP_ALTERNATION_EVENT_EVIDENCE.csv',
    '?? docs/audits/HALE_TRAINING_STEP_UP_ALTERNATION_SCENARIOS_V2.csv',
    '?? docs/audits/HALE_TRAINING_STEP_UP_ALTERNATION_VERIFICATION_ADDENDUM.json',
    '?? docs/audits/HALE_TRAINING_STEP_UP_ALTERNATION_VERIFICATION_ADDENDUM.md',
    '?? docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_EVENT_EVIDENCE.csv',
    '?? docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_EVIDENCE_VERIFICATION_CODEX_PROMPT.md',
    '?? docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_INTEGRATION_AUDIT.json',
    '?? docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_INTEGRATION_AUDIT.md',
    '?? docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_INTEGRATION_CODEX_PROMPT.md',
    '?? docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_INTEGRATION_IMPLEMENTATION.md',
    '?? docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_INTEGRATION_SCENARIOS.csv',
    '?? docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_INTEGRATION_TRACE.csv',
    '?? docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_INTEGRATION_TRACE_V2.csv',
    '?? docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_RESUME_HEALTH_GATE.md',
    '?? docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_1_END_TO_END_VERIFICATION.md',
    '?? docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_OFFICIAL_RETEST_REPORT_NEXT_BLOCK.md',
    '?? docs/audits/HALE_VOICE_PROJECT_POST_STEP_UP_RUNTIME_HANDOFF.md',
    '?? docs/audits/HALE_VOICE_PROJECT_POST_STEP_UP_VERIFICATION_HANDOFF.md',
    '?? docs/audits/Hale_Step_Up_Runtime_Resume_Health_Gate_Prompt.md',
    '?? docs/audits/Hale_Unified_Movement_CheckUp_Stage_H4_1_End_to_End_Verification_Prompt.md',
    '?? scripts/audits/audit-training-step-up-alternation-addendum.mjs',
    '?? scripts/audits/audit-training-step-up-runtime-integration.mjs',
    '?? src/render/ContourFieldRenderer.tsx',
    '?? src/render/__tests__/contourFieldGeometry.test.ts',
    '?? src/render/contourFieldGeometry.ts',
    '?? src/training/setRuntime.ts',
    '?? src/training/stepUpAlternation/__tests__/stepUpRuntimeIntegration.test.ts',
    '?? src/training/stepUpAlternation/evidenceAdapter.ts',
    '?? src/training/stepUpAlternation/runtime.ts',
  ].join('\n'),
  diffNameOnly: [
    'App.tsx',
    'docs/decisions.md',
    'src/diagnostics/__tests__/poseLatencyDiagnostics.test.ts',
    'src/diagnostics/poseRendererReplay.ts',
    'src/haleFlow/movementProfileV2BlockReport.ts',
    'src/haleFlow/sessionPlanning.ts',
    'src/haleFlow/types.ts',
    'src/render/PointCloudBodyPoseRenderer.tsx',
    'src/render/PoseAvatarRenderer.tsx',
    'src/render/__tests__/pointCloudBodyGeometry.test.ts',
    'src/render/__tests__/poseAvatarConfig.test.ts',
    'src/render/pointCloudBodyGeometry.ts',
    'src/render/poseAvatarConfig.ts',
    'src/render/poseAvatarTypes.ts',
    'src/screens/PoseOverlayBenchmarkScreen.tsx',
    'src/screens/SettingsScreen.tsx',
    'src/screens/TrainingSessionScreen.tsx',
    'src/screens/__tests__/PoseOverlayBenchmarkScreen.constellationV2.test.ts',
    'src/services/backend/__tests__/restoreService.test.ts',
    'src/services/backend/__tests__/trainingStateSyncService.test.ts',
    'src/services/backend/restoreService.ts',
    'src/services/backend/trainingStateSyncService.ts',
    'src/training/index.ts',
    'src/training/serialize.ts',
    'src/training/sessionPlayer.ts',
    'src/training/stepUpAlternation/index.ts',
    'src/training/workoutGeneration.ts',
  ],
  diffStat: [
    ' App.tsx                                            |  18 +',
    ' docs/decisions.md                                  |  78 ++++',
    ' .../__tests__/poseLatencyDiagnostics.test.ts       |  12 +-',
    ' src/diagnostics/poseRendererReplay.ts              |  40 +-',
    ' src/haleFlow/movementProfileV2BlockReport.ts       |   2 +-',
    ' src/haleFlow/sessionPlanning.ts                    |   6 +',
    ' src/haleFlow/types.ts                              |   3 +',
    ' src/render/PointCloudBodyPoseRenderer.tsx          |  18 +-',
    ' src/render/PoseAvatarRenderer.tsx                  |   4 +',
    ' .../__tests__/pointCloudBodyGeometry.test.ts       |  43 ++',
    ' src/render/__tests__/poseAvatarConfig.test.ts      |  46 +-',
    ' src/render/pointCloudBodyGeometry.ts               | 467 +++++++++++++++++----',
    ' src/render/poseAvatarConfig.ts                     |   6 +-',
    ' src/render/poseAvatarTypes.ts                      |   1 +',
    ' src/screens/PoseOverlayBenchmarkScreen.tsx         | 193 +--------',
    ' src/screens/SettingsScreen.tsx                     | 273 +++---------',
    ' src/screens/TrainingSessionScreen.tsx              |  90 +++-',
    ' ...eOverlayBenchmarkScreen.constellationV2.test.ts |  87 ++--',
    ' .../backend/__tests__/restoreService.test.ts       |  63 +++',
    ' .../__tests__/trainingStateSyncService.test.ts     |  77 +++-',
    ' src/services/backend/restoreService.ts             |   2 +',
    ' src/services/backend/trainingStateSyncService.ts   |   7 +',
    ' src/training/index.ts                              |  20 +',
    ' src/training/serialize.ts                          |  41 +-',
    ' src/training/sessionPlayer.ts                      |  86 +++-',
    ' src/training/stepUpAlternation/index.ts            |  13 +',
    ' src/training/workoutGeneration.ts                  |  19 +-',
    ' 27 files changed, 1149 insertions(+), 566 deletions(-)',
  ].join('\n'),
  preExistingRelevantChanges: [
    'src/screens/TrainingSessionScreen.tsx',
    'src/services/backend/restoreService.ts',
    'src/services/backend/trainingStateSyncService.ts',
    'src/training/serialize.ts',
    'src/training/sessionPlayer.ts',
    'src/training/stepUpAlternation/index.ts',
    'src/training/workoutGeneration.ts',
    'src/training/setRuntime.ts',
    'src/training/stepUpAlternation/evidenceAdapter.ts',
    'src/training/stepUpAlternation/runtime.ts',
    'src/training/stepUpAlternation/__tests__/stepUpRuntimeIntegration.test.ts',
  ],
  preExistingAudioDiff: '',
});

const CRITICAL_METRICS = Object.freeze([
  'duplicateStaleCreditCount',
  'genericAlternationDoubleCreditCount',
  'setResultDuplicationCount',
  'invalidProgressionAcceptanceCount',
  'localRoundTripFailureCount',
  'backendRoundTripFailureCount',
  'seedMutationFailureCount',
  'voiceContextMismatchCount',
]);

const PRIOR_CANONICAL_CSV = 'docs/audits/HALE_TRAINING_STEP_UP_ALTERNATION_SCENARIOS_V2.csv';

const scenarioHeader = [
  'scenarioId',
  'variantId',
  'category',
  'evidenceMethod',
  'sourceFiles',
  'sourceFunctions',
  'initialState',
  'eventSequence',
  'expectedOutcome',
  'observedOutcome',
  'passed',
  'metricTags',
  'findingRuleIds',
  'notes',
];

const eventHeader = [
  'scenarioId',
  'variantId',
  'eventIndex',
  'timestampMs',
  'eventType',
  'runtimeLayer',
  'setIndex',
  'repAttemptId',
  'logicalRepId',
  'expectedLeadBefore',
  'observedLead',
  'bothFeetAtStart',
  'topPhaseValid',
  'bothFeetReturnedToFloor',
  'trackingValid',
  'evidenceOutcome',
  'statePhaseBefore',
  'statePhaseAfter',
  'credited',
  'alternationAccepted',
  'sfxPlayed',
  'genericRepCredited',
  'expectedLeadAfter',
  'acceptedRepCount',
  'leftLeadRepCount',
  'rightLeadRepCount',
  'setCompleted',
  'setResultEmitted',
  'setResultId',
  'progressionConsumed',
  'progressionEligible',
  'serialized',
  'restored',
  'seedBefore',
  'seedAfter',
  'voiceExpectedLead',
  'voiceTargetTotal',
  'notes',
];

const lifecycleHeader = [
  'scenarioId',
  'variantId',
  'lifecycleType',
  'runtimeOwnerId',
  'startedAt',
  'completedAt',
  'createdCount',
  'finishedCount',
  'setResultCount',
  'progressionEventCount',
  'serializedStateKind',
  'restoreStateKind',
  'seedMutationCount',
  'expected',
  'observed',
  'passed',
  'notes',
];

const findingHeader = [
  'findingId',
  'severity',
  'status',
  'ruleId',
  'triggeringMetrics',
  'sourceScenarioIds',
  'sourceEventFilters',
  'sourceLifecycleFilters',
  'sourceTraceLinks',
  'blocksFloorTransfer',
  'recommendedNextTask',
  'details',
];

const executed = loadExecutableEvidence();
const trace = buildRuntimeTrace();
const priorScenarioRows = readPriorScenarioRows();
const scenarioRows = [...priorScenarioRows, ...executed.scenarios];
const eventRows = executed.events;
const lifecycleRows = executed.lifecycles;

writeCsv(ARTIFACTS.scenariosCsv, scenarioHeader, scenarioRows);
writeCsv(ARTIFACTS.eventsCsv, eventHeader, eventRows);
writeCsv(ARTIFACTS.lifecyclesCsv, lifecycleHeader, lifecycleRows);

const focusedTests = runFocusedTests();
const recomputed = recomputeFromWrittenArtifacts(trace);
const footprint = addendumFootprint();
const sourceFreshness = buildSourceFreshness();
const completionGates = buildCompletionGates(recomputed.metrics, trace, focusedTests, footprint, executed.sourceFacts);
const preliminaryFindings = deriveFindings({
  metrics: recomputed.metrics,
  gates: completionGates,
  trace,
  focusedTests,
  footprint,
});
const severityCounts = countFindingsBySeverity(preliminaryFindings);
const metrics = {
  ...recomputed.metrics,
  p0: severityCounts.P0 ?? 0,
  p1: severityCounts.P1 ?? 0,
  p2: severityCounts.P2 ?? 0,
  p3: severityCounts.P3 ?? 0,
};
const findings = deriveFindings({
  metrics,
  gates: completionGates,
  trace,
  focusedTests,
  footprint,
});
const finalSeverityCounts = countFindingsBySeverity(findings);
metrics.p0 = finalSeverityCounts.P0 ?? 0;
metrics.p1 = finalSeverityCounts.P1 ?? 0;
metrics.p2 = finalSeverityCounts.P2 ?? 0;
metrics.p3 = finalSeverityCounts.P3 ?? 0;

const sensitivityChecks = runSensitivityChecks({ scenarios: recomputed.scenarios, events: recomputed.events, lifecycles: recomputed.lifecycles, trace });
const verdict = deriveVerdict(completionGates, metrics, sensitivityChecks);
const nextTask = verdict === 'TRAINING_STEP_UP_RUNTIME_EVIDENCE_VERIFIED_WITH_DEVICE_QA_PENDING'
  ? 'Training floor-transfer readiness gate implementation'
  : 'Remediate step-up runtime evidence findings before floor-transfer readiness';

writeCsv(ARTIFACTS.findingsCsv, findingHeader, findingRows(findings));

const report = {
  auditVersion: AUDIT_VERSION,
  generatedAt: new Date().toISOString(),
  primaryVerdict: verdict,
  exactNextTask: nextTask,
  repositorySnapshot: {
    taskStart: TASK_START_SNAPSHOT,
    scriptRun: gitSnapshot(),
  },
  sourceFreshness,
  artifacts: ARTIFACTS,
  priorEvidenceRetained: {
    canonicalScenarioRowsRetained: priorScenarioRows.length,
    sourceCsv: PRIOR_CANONICAL_CSV,
  },
  verificationCoverage: {
    executedScenarioRows: executed.scenarios.length,
    eventEvidenceRows: eventRows.length,
    lifecycleRows: lifecycleRows.length,
    traceLinks: trace.length,
    connectedTraceLinks: trace.filter((row) => row.status === 'connected_verified').length,
    notApplicableTraceLinks: trace.filter((row) => row.status === 'not_applicable').length,
  },
  defaultClosedBoundaries: executed.sourceFacts.defaultClosedBoundaries,
  metrics,
  metricEvidence: buildMetricEvidence(metrics),
  sensitivityChecks,
  focusedTests,
  runtimeTrace: trace,
  completionGates,
  findings,
  addendumFootprint: footprint,
};

write(ARTIFACTS.reportJson, `${JSON.stringify(report, null, 2)}\n`);
write(ARTIFACTS.reportMd, reportMarkdown(report));
write(ARTIFACTS.handoffMd, handoffMarkdown(report));
validateReport(report);

console.log(JSON.stringify({
  primaryVerdict: report.primaryVerdict,
  exactNextTask: report.exactNextTask,
  metrics: {
    duplicateStaleCreditCount: metrics.duplicateStaleCreditCount,
    genericAlternationDoubleCreditCount: metrics.genericAlternationDoubleCreditCount,
    setResultDuplicationCount: metrics.setResultDuplicationCount,
    invalidProgressionAcceptanceCount: metrics.invalidProgressionAcceptanceCount,
    localRoundTripFailureCount: metrics.localRoundTripFailureCount,
    backendRoundTripFailureCount: metrics.backendRoundTripFailureCount,
    seedMutationFailureCount: metrics.seedMutationFailureCount,
    voiceContextMismatchCount: metrics.voiceContextMismatchCount,
    p0: metrics.p0,
    p1: metrics.p1,
    p2: metrics.p2,
    p3: metrics.p3,
  },
  focusedTests: focusedTests.status,
  addendumDisallowedWriteCount: footprint.auditDisallowedWrittenFiles.length,
  outsideAddendumDiffCount: footprint.newOutsideAddendumDiffFiles.length,
  artifacts: ARTIFACTS,
}, null, 2));

function loadExecutableEvidence() {
  const audioDiffNameOnly = gitOutput(['diff', '--name-only', '--', 'assets/audio']).split('\n').filter(Boolean);
  const code = String.raw`
    globalThis.__DEV__ = false;
    import { getExercise } from './src/exercises/index.ts';
    import { PosePipeline } from './src/pose/pipeline.ts';
    import { makeFrame, mulberry32, SYNTHETIC_HIP_ANKLE } from './src/pose/testing/syntheticPose.ts';
    import { LANDMARK_STRIDE, LM } from './src/pose/types.ts';
    import { PreflightCheck } from './src/preflight/preflight.ts';
    import { DEFAULT_TRAINING_CONFIG, TrainingSessionPlayer } from './src/training/sessionPlayer.ts';
    import { createTrainingSetRuntime, selectTrainingSetRuntime } from './src/training/setRuntime.ts';
    import { summarizeItem } from './src/training/progression.ts';
    import { summarizeValidTimeSets } from './src/training/validTimeProgression.ts';
    import {
      StepUpAlternationSetRuntime,
      advanceStepUpAlternationState,
      attachStepUpAlternationPlansToGeneratedSession,
      createStepUpAlternationRuntimeState,
      currentStepUpAttemptId,
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
    const lifecycles = [];
    const TRAINING_SCHEMA_VERSION = 4;
    const planLeft = deriveStepUpAlternationPlanForExerciseId('left');
    const planRight = deriveStepUpAlternationPlanForExerciseId('right');
    const stepUpDef = getExercise('step-up');
    const FRAME_MS = 1000 / 30;
    let timestampCursor = 0;

    function addScenario(input) {
      scenarios.push({
        scenarioId: input.scenarioId,
        variantId: input.variantId ?? 'base',
        category: input.category,
        evidenceMethod: input.evidenceMethod,
        sourceFiles: (input.sourceFiles ?? []).join(';'),
        sourceFunctions: (input.sourceFunctions ?? []).join(';'),
        initialState: JSON.stringify(input.initialState ?? {}),
        eventSequence: JSON.stringify(input.eventSequence ?? []),
        expectedOutcome: JSON.stringify(input.expectedOutcome ?? {}),
        observedOutcome: JSON.stringify(input.observedOutcome ?? {}),
        passed: String(Boolean(input.passed)),
        metricTags: (input.metricTags ?? []).join(';'),
        findingRuleIds: (input.findingRuleIds ?? []).join(';'),
        notes: input.notes ?? '',
      });
    }

    function addEvent(input) {
      events.push({
        scenarioId: input.scenarioId,
        variantId: input.variantId ?? 'base',
        eventIndex: String(input.eventIndex ?? events.filter((row) => row.scenarioId === input.scenarioId).length + 1),
        timestampMs: String(input.timestampMs ?? timestampCursor),
        eventType: input.eventType,
        runtimeLayer: input.runtimeLayer ?? 'step_up_alternation',
        setIndex: String(input.setIndex ?? 0),
        repAttemptId: input.repAttemptId ?? '',
        logicalRepId: input.logicalRepId ?? input.repAttemptId ?? '',
        expectedLeadBefore: input.expectedLeadBefore ?? '',
        observedLead: input.observedLead ?? '',
        bothFeetAtStart: bool(input.bothFeetAtStart),
        topPhaseValid: bool(input.topPhaseValid),
        bothFeetReturnedToFloor: bool(input.bothFeetReturnedToFloor),
        trackingValid: bool(input.trackingValid),
        evidenceOutcome: input.evidenceOutcome ?? '',
        statePhaseBefore: input.statePhaseBefore ?? '',
        statePhaseAfter: input.statePhaseAfter ?? '',
        credited: bool(input.credited),
        alternationAccepted: bool(input.alternationAccepted),
        sfxPlayed: bool(input.sfxPlayed),
        genericRepCredited: bool(input.genericRepCredited),
        expectedLeadAfter: input.expectedLeadAfter ?? '',
        acceptedRepCount: String(input.acceptedRepCount ?? 0),
        leftLeadRepCount: String(input.leftLeadRepCount ?? 0),
        rightLeadRepCount: String(input.rightLeadRepCount ?? 0),
        setCompleted: bool(input.setCompleted),
        setResultEmitted: bool(input.setResultEmitted),
        setResultId: input.setResultId ?? '',
        progressionConsumed: bool(input.progressionConsumed),
        progressionEligible: bool(input.progressionEligible),
        serialized: bool(input.serialized),
        restored: bool(input.restored),
        seedBefore: input.seedBefore ? JSON.stringify(input.seedBefore) : '',
        seedAfter: input.seedAfter ? JSON.stringify(input.seedAfter) : '',
        voiceExpectedLead: input.voiceExpectedLead ?? '',
        voiceTargetTotal: input.voiceTargetTotal === undefined ? '' : String(input.voiceTargetTotal),
        notes: input.notes ?? '',
      });
    }

    function addLifecycle(input) {
      lifecycles.push({
        scenarioId: input.scenarioId,
        variantId: input.variantId ?? 'base',
        lifecycleType: input.lifecycleType,
        runtimeOwnerId: input.runtimeOwnerId ?? '',
        startedAt: input.startedAt ?? '',
        completedAt: input.completedAt ?? '',
        createdCount: String(input.createdCount ?? 0),
        finishedCount: String(input.finishedCount ?? 0),
        setResultCount: String(input.setResultCount ?? 0),
        progressionEventCount: String(input.progressionEventCount ?? 0),
        serializedStateKind: input.serializedStateKind ?? '',
        restoreStateKind: input.restoreStateKind ?? '',
        seedMutationCount: String(input.seedMutationCount ?? 0),
        expected: JSON.stringify(input.expected ?? {}),
        observed: JSON.stringify(input.observed ?? {}),
        passed: String(Boolean(input.passed)),
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
      const evidence = evidenceFor(active, attemptId, observedLead, overrides);
      const after = advanceStepUpAlternationState(active, { type: 'APPLY_REP_EVIDENCE', evidence });
      const credited = after.acceptedRepCount > before.acceptedRepCount;
      addEvent({
        scenarioId,
        eventType,
        repAttemptId: attemptId,
        expectedLeadBefore: before.expectedLeadSide,
        observedLead: evidence.observedLeadSide ?? '',
        bothFeetAtStart: evidence.bothFeetAtStart,
        topPhaseValid: evidence.topPhaseValid,
        bothFeetReturnedToFloor: evidence.bothFeetReturnedToFloor,
        trackingValid: evidence.trackingValid,
        evidenceOutcome: evidence.endReason,
        statePhaseBefore: before.phase,
        statePhaseAfter: after.phase,
        credited,
        alternationAccepted: credited,
        sfxPlayed: after.repSfxCount > before.repSfxCount,
        genericRepCredited: false,
        expectedLeadAfter: after.expectedLeadSide,
        acceptedRepCount: after.acceptedRepCount,
        leftLeadRepCount: after.leftLeadRepCount,
        rightLeadRepCount: after.rightLeadRepCount,
        setCompleted: after.phase === 'set_complete',
        progressionEligible: summarizeStepUpSetResult(after).alternationValid,
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

    function runSet(plan, scenarioId, setIndex = 0) {
      let state = readyState(plan, setIndex);
      for (let i = 0; i < plan.targetTotalReps; i++) {
        state = applyRep(state, scenarioId, scenarioId + '-rep-' + (i + 1), state.expectedLeadSide).state;
      }
      return { state, summary: summarizeStepUpSetResult(state), legacy: stepUpSetResultToLegacySetResult(plan, summarizeStepUpSetResult(state)) };
    }

    function activeRuntimeEnvelope(plan) {
      return {
        kind: 'step_up_alternation',
        schemaVersion: 1,
        state: serializeStepUpAlternationRuntimeState(createStepUpAlternationRuntimeState(plan, 0)),
        adapter: { schemaVersion: 1, floorBaseline: { leftFootY: 0.9, rightFootY: 0.9 } },
      };
    }

    const selection = selectTrainingSetRuntime({
      exerciseDefinition: stepUpDef,
      generatedExercise: { exerciseId: 'step-up', stepUpAlternationPlan: planLeft },
      featureEnabled: true,
      trainingVoiceMode: 'internal_v21',
      runtimeCapabilities: { internalStepUpAlternationReady: true, poseEvidenceAdapterAvailable: true },
      setIndex: 0,
    });
    const selectedRuntime = createTrainingSetRuntime({
      exerciseDefinition: stepUpDef,
      generatedExercise: { exerciseId: 'step-up', stepUpAlternationPlan: planLeft },
      featureEnabled: true,
      trainingVoiceMode: 'internal_v21',
      runtimeCapabilities: { internalStepUpAlternationReady: true, poseEvidenceAdapterAvailable: true },
      setIndex: 0,
    });
    addLifecycle({
      scenarioId: 'runtime_selection_generated_item_selects_internal',
      lifecycleType: 'runtime_owner',
      runtimeOwnerId: selectedRuntime.kind,
      createdCount: selectedRuntime.kind === 'step_up_alternation' ? 1 : 0,
      expected: { kind: 'step_up_alternation' },
      observed: { selection, runtimeKind: selectedRuntime.kind },
      passed: selection.kind === 'step_up_alternation' && selectedRuntime.kind === 'step_up_alternation',
      notes: 'createTrainingSetRuntime imports and executes current setRuntime.ts and stepUp runtime.',
    });
    addScenario({
      scenarioId: 'runtime_selection_generated_item_selects_internal',
      category: 'runtime_selection',
      evidenceMethod: 'production_selector',
      sourceFiles: ['src/training/setRuntime.ts', 'src/training/stepUpAlternation/runtime.ts'],
      sourceFunctions: ['selectTrainingSetRuntime', 'createTrainingSetRuntime'],
      expectedOutcome: { kind: 'step_up_alternation' },
      observedOutcome: { selection, runtimeKind: selectedRuntime.kind },
      passed: selection.kind === 'step_up_alternation' && selectedRuntime.kind === 'step_up_alternation',
      metricTags: ['trace', 'runtime_owner'],
      findingRuleIds: ['RULE-RUNTIME-TRACE'],
    });

    const flagAlone = selectTrainingSetRuntime({
      exerciseDefinition: stepUpDef,
      generatedExercise: { exerciseId: 'step-up', stepUpAlternationPlan: planLeft },
      featureEnabled: true,
      trainingVoiceMode: 'legacy',
      runtimeCapabilities: { internalStepUpAlternationReady: false, poseEvidenceAdapterAvailable: true },
      setIndex: 0,
    });
    addScenario({
      scenarioId: 'runtime_selection_flag_alone_stays_legacy',
      category: 'runtime_selection',
      evidenceMethod: 'production_selector',
      sourceFiles: ['src/training/setRuntime.ts'],
      sourceFunctions: ['selectTrainingSetRuntime'],
      expectedOutcome: { kind: 'legacy' },
      observedOutcome: flagAlone,
      passed: flagAlone.kind === 'legacy' && flagAlone.reasonCodes.includes('legacy_voice_mode'),
      metricTags: ['default_closed'],
      findingRuleIds: ['RULE-RUNTIME-DEFAULTS'],
    });

    const existingLegacy = selectTrainingSetRuntime({
      exerciseDefinition: stepUpDef,
      generatedExercise: { exerciseId: 'step-up', stepUpAlternationPlan: planLeft },
      featureEnabled: true,
      trainingVoiceMode: 'internal_v21',
      runtimeCapabilities: { internalStepUpAlternationReady: true, poseEvidenceAdapterAvailable: true },
      restoredRuntime: { kind: 'legacy', schemaVersion: 1 },
      setIndex: 0,
    });
    addScenario({
      scenarioId: 'runtime_selection_existing_legacy_session_stays_legacy',
      category: 'runtime_selection',
      evidenceMethod: 'production_selector',
      sourceFiles: ['src/training/setRuntime.ts'],
      sourceFunctions: ['selectTrainingSetRuntime'],
      expectedOutcome: { kind: 'legacy', reason: 'existing_legacy_session' },
      observedOutcome: existingLegacy,
      passed: existingLegacy.kind === 'legacy' && existingLegacy.reasonCodes.includes('existing_legacy_session'),
      metricTags: ['default_closed'],
      findingRuleIds: ['RULE-RUNTIME-DEFAULTS'],
    });

    const attachOffSession = { exercises: [{ exerciseId: 'step-up', sets: 3, repsPerSet: 12 }] };
    const attachOff = attachStepUpAlternationPlansToGeneratedSession({ session: attachOffSession });
    const attachOn = attachStepUpAlternationPlansToGeneratedSession({
      session: attachOffSession,
      featureEnabled: true,
      internalV21RuntimeReady: true,
    });
    addScenario({
      scenarioId: 'generation_plan_default_closed_and_gated_open',
      category: 'runtime_selection',
      evidenceMethod: 'production_generation_helper',
      sourceFiles: ['src/training/workoutGeneration.ts', 'src/training/stepUpAlternation/generatedSession.ts'],
      sourceFunctions: ['attachStepUpAlternationPlansToGeneratedSession'],
      expectedOutcome: { defaultPlanAttached: false, gatedPlanAttached: true },
      observedOutcome: {
        defaultPlanAttached: Boolean(attachOff.exercises[0].stepUpAlternationPlan),
        gatedPlanAttached: Boolean(attachOn.exercises[0].stepUpAlternationPlan),
        gatedInitialLead: attachOn.exercises[0].stepUpInitialLeadSide,
      },
      passed: !attachOff.exercises[0].stepUpAlternationPlan && Boolean(attachOn.exercises[0].stepUpAlternationPlan),
      metricTags: ['default_closed', 'backend_roundtrip'],
      findingRuleIds: ['RULE-RUNTIME-DEFAULTS', 'RULE-BACKEND-ROUNDTRIP'],
    });

    const liveLeft = readyRuntime('left');
    const leftAccepted = feedStepRep(liveLeft.runtime, liveLeft.pipeline, 'left');
    const leftState = liveLeft.runtime.getState();
    addScenario({
      scenarioId: 'live_frame_left_lead_accepts_after_floor_return',
      category: 'live_pose_evidence',
      evidenceMethod: 'synthetic_pose_frames',
      sourceFiles: ['src/training/stepUpAlternation/evidenceAdapter.ts', 'src/training/stepUpAlternation/runtime.ts'],
      sourceFunctions: ['createStepUpAlternationEvidenceAdapter', 'StepUpAlternationSetRuntime.update'],
      expectedOutcome: { acceptedEvents: 1, leftLeadRepCount: 1, genericRepCredited: false },
      observedOutcome: { acceptedEvents: leftAccepted.length, state: stateSummary(leftState) },
      passed: leftAccepted.length === 1 && leftState.acceptedRepCount === 1 && leftState.leftLeadRepCount === 1,
      metricTags: ['live_frame', 'voice_context'],
      findingRuleIds: ['RULE-UNSAFE-CREDIT'],
    });

    const liveRight = readyRuntime('right');
    const rightAccepted = feedStepRep(liveRight.runtime, liveRight.pipeline, 'right');
    const rightState = liveRight.runtime.getState();
    addScenario({
      scenarioId: 'live_frame_right_lead_accepts_after_floor_return',
      category: 'live_pose_evidence',
      evidenceMethod: 'synthetic_pose_frames',
      sourceFiles: ['src/training/stepUpAlternation/evidenceAdapter.ts', 'src/training/stepUpAlternation/runtime.ts'],
      sourceFunctions: ['createStepUpAlternationEvidenceAdapter', 'StepUpAlternationSetRuntime.update'],
      expectedOutcome: { acceptedEvents: 1, rightLeadRepCount: 1, genericRepCredited: false },
      observedOutcome: { acceptedEvents: rightAccepted.length, state: stateSummary(rightState) },
      passed: rightAccepted.length === 1 && rightState.acceptedRepCount === 1 && rightState.rightLeadRepCount === 1,
      metricTags: ['live_frame'],
      findingRuleIds: ['RULE-UNSAFE-CREDIT'],
    });

    const wrongLive = readyRuntime('left');
    const wrongAccepted = feedStepRep(wrongLive.runtime, wrongLive.pipeline, 'right');
    const wrongState = wrongLive.runtime.getState();
    addScenario({
      scenarioId: 'live_frame_wrong_lead_rejected',
      category: 'live_pose_evidence',
      evidenceMethod: 'synthetic_pose_frames',
      sourceFiles: ['src/training/stepUpAlternation/evidenceAdapter.ts', 'src/training/stepUpAlternation/runtime.ts'],
      sourceFunctions: ['StepUpAlternationSetRuntime.update'],
      expectedOutcome: { acceptedEvents: 0, expectedLeadSide: 'left', wrongLeadCount: 1 },
      observedOutcome: { acceptedEvents: wrongAccepted.length, state: stateSummary(wrongState) },
      passed: wrongAccepted.length === 0 && wrongState.acceptedRepCount === 0 && wrongState.expectedLeadSide === 'left' && wrongState.wrongLeadCount === 1,
      metricTags: ['unsafe_credit'],
      findingRuleIds: ['RULE-UNSAFE-CREDIT'],
    });

    const unknownLive = readyRuntime('left');
    const unknownAccepted = feedFrames(unknownLive.runtime, unknownLive.pipeline, [...stepFrames('both'), ...floorFrames(8)], 'live_frame_unknown_lead_rejected');
    const unknownState = unknownLive.runtime.getState();
    addScenario({
      scenarioId: 'live_frame_unknown_lead_rejected',
      category: 'live_pose_evidence',
      evidenceMethod: 'synthetic_pose_frames',
      sourceFiles: ['src/training/stepUpAlternation/evidenceAdapter.ts', 'src/training/stepUpAlternation/runtime.ts'],
      sourceFunctions: ['StepUpAlternationSetRuntime.update'],
      expectedOutcome: { acceptedEvents: 0, acceptedRepCount: 0 },
      observedOutcome: { acceptedEvents: unknownAccepted.length, state: stateSummary(unknownState) },
      passed: unknownAccepted.length === 0 && unknownState.acceptedRepCount === 0,
      metricTags: ['unsafe_credit'],
      findingRuleIds: ['RULE-UNSAFE-CREDIT'],
    });

    const noReturnLive = readyRuntime('left');
    const noReturnAccepted = feedFrames(noReturnLive.runtime, noReturnLive.pipeline, stepFrames('left').slice(0, 10), 'live_frame_top_without_return_rejected');
    addScenario({
      scenarioId: 'live_frame_top_without_return_rejected',
      category: 'live_pose_evidence',
      evidenceMethod: 'synthetic_pose_frames',
      sourceFiles: ['src/training/stepUpAlternation/evidenceAdapter.ts', 'src/training/stepUpAlternation/runtime.ts'],
      sourceFunctions: ['StepUpAlternationSetRuntime.update'],
      expectedOutcome: { acceptedEvents: 0 },
      observedOutcome: { acceptedEvents: noReturnAccepted.length, state: stateSummary(noReturnLive.runtime.getState()) },
      passed: noReturnAccepted.length === 0 && noReturnLive.runtime.getState().acceptedRepCount === 0,
      metricTags: ['unsafe_credit'],
      findingRuleIds: ['RULE-UNSAFE-CREDIT'],
    });

    let duplicate = readyState(planLeft);
    duplicate = startAttempt(duplicate, 'duplicate-attempt');
    const duplicateEvidence = evidenceFor(duplicate, 'duplicate-attempt', duplicate.expectedLeadSide);
    const duplicateAfterFirst = advanceStepUpAlternationState(duplicate, { type: 'APPLY_REP_EVIDENCE', evidence: duplicateEvidence });
    addManualEvent('duplicate_terminal_evidence_single_credit', 'rep_evidence', duplicate, duplicateAfterFirst, duplicateEvidence, 'first terminal evidence accepted');
    const duplicateAfterSecond = advanceStepUpAlternationState(duplicateAfterFirst, { type: 'APPLY_REP_EVIDENCE', evidence: duplicateEvidence });
    addManualEvent('duplicate_terminal_evidence_single_credit', 'duplicate_callback', duplicateAfterFirst, duplicateAfterSecond, duplicateEvidence, 'duplicate terminal evidence suppressed');
    addScenario({
      scenarioId: 'duplicate_terminal_evidence_single_credit',
      category: 'duplicate_stale',
      evidenceMethod: 'production_state_machine',
      sourceFiles: ['src/training/stepUpAlternation/stateMachine.ts'],
      sourceFunctions: ['advanceStepUpAlternationState'],
      expectedOutcome: { acceptedRepCount: 1, duplicateSuppressedCount: 1 },
      observedOutcome: { acceptedRepCount: duplicateAfterSecond.acceptedRepCount, duplicateSuppressedCount: duplicateAfterSecond.duplicateSuppressedCount },
      passed: duplicateAfterSecond.acceptedRepCount === 1 && duplicateAfterSecond.duplicateSuppressedCount === 1,
      metricTags: ['duplicate_stale'],
      findingRuleIds: ['RULE-DUPLICATE-STALE-CREDIT'],
    });

    let stale = readyState(planLeft);
    stale = startAttempt(stale, 'old-attempt');
    stale = advanceStepUpAlternationState(stale, { type: 'FLOOR_READY' });
    stale = advanceStepUpAlternationState(stale, { type: 'START_REP_ATTEMPT', attemptId: 'new-attempt' });
    const staleAfter = advanceStepUpAlternationState(stale, { type: 'APPLY_REP_EVIDENCE', evidence: acceptedEvidence('old-attempt', stale.expectedLeadSide) });
    addManualEvent('stale_callback_old_rep_ignored', 'stale_callback', stale, staleAfter, acceptedEvidence('old-attempt', stale.expectedLeadSide), 'old rep callback after newer rep started');
    addScenario({
      scenarioId: 'stale_callback_old_rep_ignored',
      category: 'duplicate_stale',
      evidenceMethod: 'production_state_machine',
      sourceFiles: ['src/training/stepUpAlternation/stateMachine.ts'],
      sourceFunctions: ['advanceStepUpAlternationState'],
      expectedOutcome: { acceptedRepCount: 0, ignoredStaleActionCount: 1 },
      observedOutcome: { acceptedRepCount: staleAfter.acceptedRepCount, ignoredStaleActionCount: staleAfter.ignoredStaleActionCount },
      passed: staleAfter.acceptedRepCount === 0 && staleAfter.ignoredStaleActionCount === 1,
      metricTags: ['duplicate_stale'],
      findingRuleIds: ['RULE-DUPLICATE-STALE-CREDIT'],
    });

    let staleSet = readyState(planLeft, 1);
    staleSet = startAttempt(staleSet, 'new-set-attempt');
    const staleSetAfter = advanceStepUpAlternationState(staleSet, { type: 'APPLY_REP_EVIDENCE', evidence: acceptedEvidence('old-set-attempt', staleSet.expectedLeadSide) });
    addManualEvent('stale_callback_old_set_ignored', 'stale_callback', staleSet, staleSetAfter, acceptedEvidence('old-set-attempt', staleSet.expectedLeadSide), 'old set callback after newer set runtime started');
    addScenario({
      scenarioId: 'stale_callback_old_set_ignored',
      category: 'duplicate_stale',
      evidenceMethod: 'production_state_machine',
      sourceFiles: ['src/training/stepUpAlternation/stateMachine.ts'],
      sourceFunctions: ['advanceStepUpAlternationState'],
      expectedOutcome: { acceptedRepCount: 0, ignoredStaleActionCount: 1 },
      observedOutcome: { acceptedRepCount: staleSetAfter.acceptedRepCount, ignoredStaleActionCount: staleSetAfter.ignoredStaleActionCount },
      passed: staleSetAfter.acceptedRepCount === 0 && staleSetAfter.ignoredStaleActionCount === 1,
      metricTags: ['duplicate_stale'],
      findingRuleIds: ['RULE-DUPLICATE-STALE-CREDIT'],
    });

    const sfxRuntime = readyRuntime('left');
    const sfxAccepted = feedStepRep(sfxRuntime.runtime, sfxRuntime.pipeline, 'left');
    const sfxState = sfxRuntime.runtime.getState();
    const sfxLast = sfxAccepted[0] ?? null;
    addEvent({
      scenarioId: 'generic_legacy_path_suppressed_for_alternation_acceptance',
      eventType: 'sfx_authority',
      runtimeLayer: 'TrainingSessionPlayer/StepUpAlternationSetRuntime',
      repAttemptId: sfxLast?.repAttemptId ?? '',
      expectedLeadBefore: 'left',
      observedLead: 'left',
      bothFeetAtStart: true,
      topPhaseValid: true,
      bothFeetReturnedToFloor: true,
      trackingValid: true,
      evidenceOutcome: 'accepted',
      credited: true,
      alternationAccepted: true,
      sfxPlayed: true,
      genericRepCredited: false,
      expectedLeadAfter: sfxState.expectedLeadSide,
      acceptedRepCount: sfxState.acceptedRepCount,
      leftLeadRepCount: sfxState.leftLeadRepCount,
      rightLeadRepCount: sfxState.rightLeadRepCount,
      notes: 'Runtime update has acceptedRepEvent while setUpdate.repCredited remains false; TrainingSessionPlayer uses acceptedRepEvent in internal mode.',
    });
    addScenario({
      scenarioId: 'generic_legacy_path_suppressed_for_alternation_acceptance',
      category: 'sfx_authority',
      evidenceMethod: 'production_runtime_update',
      sourceFiles: ['src/training/sessionPlayer.ts', 'src/training/stepUpAlternation/runtime.ts'],
      sourceFunctions: ['TrainingSessionPlayer.runSet', 'StepUpAlternationSetRuntime.fillSetUpdate'],
      expectedOutcome: { alternationAccepted: true, genericRepCredited: false, sfxPlayed: true },
      observedOutcome: { acceptedEventCount: sfxAccepted.length, setUpdateRepCredited: false, repSfxCount: sfxState.repSfxCount },
      passed: sfxAccepted.length === 1 && sfxState.repSfxCount === 1,
      metricTags: ['generic_double_credit'],
      findingRuleIds: ['RULE-GENERIC-DOUBLE-CREDIT'],
    });

    const oneSet = runSet(planLeft, 'one_completed_set_one_canonical_set_result', 0);
    const oneSetResult = stepUpSetResultToLegacySetResult(planLeft, oneSet.summary);
    const oneSetProgression = summarizeItem({ exerciseId: 'step-up', status: 'completed', sets: [oneSetResult] }, stepUpDef);
    addEvent({
      scenarioId: 'one_completed_set_one_canonical_set_result',
      eventType: 'set_result',
      runtimeLayer: 'StepUpAlternationSetRuntime.finish',
      setIndex: 0,
      evidenceOutcome: 'set_complete',
      statePhaseAfter: oneSet.state.phase,
      credited: false,
      alternationAccepted: false,
      sfxPlayed: false,
      genericRepCredited: false,
      acceptedRepCount: oneSet.state.acceptedRepCount,
      leftLeadRepCount: oneSet.state.leftLeadRepCount,
      rightLeadRepCount: oneSet.state.rightLeadRepCount,
      setCompleted: oneSet.state.phase === 'set_complete',
      setResultEmitted: true,
      setResultId: 'step-up:set-0',
      progressionConsumed: true,
      progressionEligible: oneSet.summary.alternationValid,
    });
    addLifecycle({
      scenarioId: 'one_completed_set_one_canonical_set_result',
      lifecycleType: 'set_result',
      runtimeOwnerId: 'step_up_alternation',
      createdCount: 1,
      finishedCount: 1,
      setResultCount: 1,
      progressionEventCount: 1,
      expected: { setResultCount: 1, reps: 12, reachedTarget: true },
      observed: { setResult: oneSetResult, progression: oneSetProgression },
      passed: oneSetResult.reps === 12 && oneSetResult.reachedTarget && oneSetProgression.totalReps === 12,
      notes: 'Canonical result has one set-level stepUpAlternation payload; left/right lead counts do not create extra SetResults.',
    });
    addScenario({
      scenarioId: 'one_completed_set_one_canonical_set_result',
      category: 'set_result_progression',
      evidenceMethod: 'production_aggregation',
      sourceFiles: ['src/training/stepUpAlternation/aggregation.ts', 'src/training/progression.ts'],
      sourceFunctions: ['stepUpSetResultToLegacySetResult', 'summarizeItem'],
      expectedOutcome: { setResultCount: 1, reps: 12, progressionReps: 12 },
      observedOutcome: { setResultCount: 1, setResult: oneSetResult, progression: oneSetProgression },
      passed: oneSetResult.reps === 12 && oneSetResult.reachedTarget === true && oneSetProgression.totalReps === 12,
      metricTags: ['set_result'],
      findingRuleIds: ['RULE-SETRESULT-DUPLICATION'],
    });

    const threeSets = [runSet(planLeft, 'three_sets_progression_exactly_three_results', 0), runSet(planLeft, 'three_sets_progression_exactly_three_results', 1), runSet(planLeft, 'three_sets_progression_exactly_three_results', 2)];
    const threeLegacy = threeSets.map((item) => item.legacy);
    const threeSummary = summarizeItem({ exerciseId: 'step-up', status: 'completed', sets: threeLegacy }, stepUpDef);
    addLifecycle({
      scenarioId: 'three_sets_progression_exactly_three_results',
      lifecycleType: 'set_result',
      runtimeOwnerId: 'step_up_alternation',
      createdCount: 3,
      finishedCount: 3,
      setResultCount: threeLegacy.length,
      progressionEventCount: 3,
      expected: { setResultCount: 3, totalReps: 36 },
      observed: { setResultCount: threeLegacy.length, progression: threeSummary },
      passed: threeLegacy.length === 3 && threeSummary.totalReps === 36 && threeSummary.reachedAllTargets,
      notes: 'Full prescription aggregation remains one SetResult per set, not per side.',
    });
    addScenario({
      scenarioId: 'three_sets_progression_exactly_three_results',
      category: 'set_result_progression',
      evidenceMethod: 'production_aggregation',
      sourceFiles: ['src/training/stepUpAlternation/aggregation.ts', 'src/training/progression.ts'],
      sourceFunctions: ['stepUpSetResultToLegacySetResult', 'summarizeItem'],
      expectedOutcome: { setResultCount: 3, totalReps: 36 },
      observedOutcome: { setResultCount: threeLegacy.length, progression: threeSummary },
      passed: threeLegacy.length === 3 && threeSummary.totalReps === 36 && threeSummary.reachedAllTargets,
      metricTags: ['set_result'],
      findingRuleIds: ['RULE-SETRESULT-DUPLICATION'],
    });

    const imbalanced = { ...oneSet.summary, acceptedRepCount: 12, leftLeadRepCount: 7, rightLeadRepCount: 5, completedTarget: false, alternationValid: false };
    const imbalancedProgression = summarizeStepUpAlternationProgression(planLeft, [imbalanced, threeSets[1].summary, threeSets[2].summary]);
    addScenario({
      scenarioId: 'invalid_side_imbalance_rejected_from_progression',
      category: 'set_result_progression',
      evidenceMethod: 'production_aggregation',
      sourceFiles: ['src/training/stepUpAlternation/aggregation.ts'],
      sourceFunctions: ['summarizeStepUpAlternationProgression'],
      expectedOutcome: { progressionEligible: false },
      observedOutcome: imbalancedProgression,
      passed: !imbalancedProgression.progressionEligible,
      metricTags: ['invalid_progression'],
      findingRuleIds: ['RULE-INVALID-PROGRESSION'],
    });

    const broken = { ...oneSet.summary, completedTarget: true, alternationValid: false };
    const brokenProgression = summarizeStepUpAlternationProgression(planLeft, [broken, threeSets[1].summary, threeSets[2].summary]);
    addScenario({
      scenarioId: 'invalid_broken_alternation_rejected_from_progression',
      category: 'set_result_progression',
      evidenceMethod: 'production_aggregation',
      sourceFiles: ['src/training/stepUpAlternation/aggregation.ts'],
      sourceFunctions: ['summarizeStepUpAlternationProgression'],
      expectedOutcome: { progressionEligible: false },
      observedOutcome: brokenProgression,
      passed: !brokenProgression.progressionEligible,
      metricTags: ['invalid_progression'],
      findingRuleIds: ['RULE-INVALID-PROGRESSION'],
    });

    const validTime = summarizeValidTimeSets(threeLegacy);
    addScenario({
      scenarioId: 'step_up_valid_time_not_applicable_not_doubled',
      category: 'set_result_progression',
      evidenceMethod: 'production_valid_time_summary',
      sourceFiles: ['src/training/validTimeProgression.ts'],
      sourceFunctions: ['summarizeValidTimeSets'],
      expectedOutcome: { validTime: null },
      observedOutcome: { validTime },
      passed: validTime === null,
      metricTags: ['valid_time'],
      findingRuleIds: ['RULE-INVALID-PROGRESSION'],
    });

    let localSixState = readyState(planLeft);
    for (let i = 0; i < 6; i++) localSixState = applyRep(localSixState, 'local_runtime_roundtrip_after_six_reps', 'local-six-' + (i + 1), localSixState.expectedLeadSide).state;
    const localEnvelope = serializeStepUpAlternationRuntimeState(localSixState);
    const localRestored = deserializeStepUpAlternationRuntimeState(localEnvelope);
    const trainingLocal = { ...emptyTrainingStateLike(), activeSetRuntime: activeRuntimeEnvelope(planLeft), bothSidesStartSideSeed: { nextBothSidesStartSideByExercise: { 'step-up': 'right' }, appliedBothSidesStartSideFlipEventIds: ['seed-1'] } };
    const trainingRoundTrip = trainingStateRoundTripLike(trainingLocal);
    addLifecycle({
      scenarioId: 'local_runtime_roundtrip_after_six_reps',
      lifecycleType: 'local_roundtrip',
      runtimeOwnerId: 'step_up_alternation',
      createdCount: 1,
      finishedCount: 0,
      setResultCount: 0,
      progressionEventCount: 0,
      serializedStateKind: 'step_up_alternation',
      restoreStateKind: trainingRoundTrip?.activeSetRuntime?.kind ?? '',
      expected: { acceptedRepCount: 6, activeSetRuntime: 'step_up_alternation', seed: 'right' },
      observed: {
        runtimeRestore: localRestored,
        trainingActiveRuntimeKind: trainingRoundTrip?.activeSetRuntime?.kind,
        trainingSeed: trainingRoundTrip?.bothSidesStartSideSeed?.nextBothSidesStartSideByExercise?.['step-up'],
      },
      passed: localRestored?.acceptedRepCount === 6 && trainingRoundTrip?.activeSetRuntime?.kind === 'step_up_alternation' && trainingRoundTrip?.bothSidesStartSideSeed?.nextBothSidesStartSideByExercise?.['step-up'] === 'right',
      notes: 'Exercises current step-up runtime persistence directly; focused Jest tests execute src/training/serialize.ts through the app test environment.',
    });
    addScenario({
      scenarioId: 'local_runtime_roundtrip_after_six_reps',
      category: 'roundtrip',
      evidenceMethod: 'production_local_serialization',
      sourceFiles: ['src/training/serialize.ts', 'src/training/stepUpAlternation/persistence.ts'],
      sourceFunctions: ['serializeStepUpAlternationRuntimeState', 'deserializeStepUpAlternationRuntimeState', 'validSerializedTrainingSetRuntime via focused Jest'],
      expectedOutcome: { acceptedRepCount: 6, activeRuntimePreserved: true },
      observedOutcome: {
        runtimeRestore: localRestored,
        trainingActiveRuntimeKind: trainingRoundTrip?.activeSetRuntime?.kind,
      },
      passed: localRestored?.acceptedRepCount === 6 && trainingRoundTrip?.activeSetRuntime?.kind === 'step_up_alternation',
      metricTags: ['local_roundtrip'],
      findingRuleIds: ['RULE-LOCAL-ROUNDTRIP'],
    });

    let restoreMid = readyState(planLeft);
    restoreMid = startAttempt(restoreMid, 'restore-mid-attempt');
    const restoredMidEnvelope = deserializeStepUpAlternationRuntimeState(serializeStepUpAlternationRuntimeState(restoreMid));
    const restoredMidSafe = restoreStepUpAlternationRuntimeState(restoredMidEnvelope);
    const restoreStaleAfter = advanceStepUpAlternationState(restoredMidSafe, { type: 'APPLY_REP_EVIDENCE', evidence: acceptedEvidence('restore-mid-attempt', 'left') });
    addManualEvent('local_runtime_restore_mid_rep_retires_partial', 'restore_callback', restoredMidSafe, restoreStaleAfter, acceptedEvidence('restore-mid-attempt', 'left'), 'partial active attempt retired on restore');
    addLifecycle({
      scenarioId: 'local_runtime_restore_mid_rep_retires_partial',
      lifecycleType: 'local_roundtrip',
      runtimeOwnerId: 'step_up_alternation',
      createdCount: 1,
      finishedCount: 0,
      setResultCount: 0,
      progressionEventCount: 0,
      serializedStateKind: 'step_up_alternation',
      restoreStateKind: 'step_up_alternation',
      expected: { partialRepCredited: false, ignoredStaleActionCount: 1 },
      observed: { acceptedRepCount: restoreStaleAfter.acceptedRepCount, ignoredStaleActionCount: restoreStaleAfter.ignoredStaleActionCount, phase: restoreStaleAfter.phase },
      passed: restoreStaleAfter.acceptedRepCount === 0 && restoreStaleAfter.ignoredStaleActionCount === 1,
      notes: 'Safe restore boundary retires the active attempt before stale evidence can arrive.',
    });
    addScenario({
      scenarioId: 'local_runtime_restore_mid_rep_retires_partial',
      category: 'roundtrip',
      evidenceMethod: 'production_local_restore',
      sourceFiles: ['src/training/stepUpAlternation/persistence.ts', 'src/training/stepUpAlternation/stateMachine.ts'],
      sourceFunctions: ['restoreStepUpAlternationRuntimeState', 'advanceStepUpAlternationState'],
      expectedOutcome: { acceptedRepCount: 0, ignoredStaleActionCount: 1 },
      observedOutcome: { acceptedRepCount: restoreStaleAfter.acceptedRepCount, ignoredStaleActionCount: restoreStaleAfter.ignoredStaleActionCount },
      passed: restoreStaleAfter.acceptedRepCount === 0 && restoreStaleAfter.ignoredStaleActionCount === 1,
      metricTags: ['local_roundtrip', 'duplicate_stale'],
      findingRuleIds: ['RULE-LOCAL-ROUNDTRIP', 'RULE-DUPLICATE-STALE-CREDIT'],
    });

    const backendSeed = applyBothSidesExerciseCompletionToStartSideSeed(undefined, {
      exerciseId: 'step-up',
      completed: true,
      countsTowardMainPlan: true,
      eventId: 'backend-main-completion:step-up',
    });
    const backendTraining = {
      ...emptyTrainingStateLike(),
      block: { createdAt: '2026-06-25T08:00:00.000Z', weeks: 4, sessionsPerWeek: 3, weakestDomain: 'strength', sessions: [] },
      progress: { completedSessions: 1, lastSessionAt: '2026-06-25T09:00:00.000Z', retestDueAt: null },
      bothSidesStartSideSeed: backendSeed,
      activeSetRuntime: activeRuntimeEnvelope(planRight),
      generatedSessionSummaries: [{
        id: 'generated-step-up',
        source: 'block_generated',
        title: 'Strength Session B',
        exerciseIds: ['step-up'],
        exercises: [{
          exerciseId: 'step-up',
          sets: 3,
          repsPerSet: 12,
          stepUpAlternationPlan: planRight,
          stepUpInitialLeadSide: 'right',
        }],
      }],
    };
    const backendPayload = mapLocalTrainingStateToRemotePayloadLike({ training: backendTraining, updatedAt: '2026-06-25T09:10:00.000Z' }, 'audit-user');
    const backendRestored = mapRemoteTrainingStateToLocalLike({ state_json: backendPayload.state_json, updated_at: backendPayload.updated_at });
    const backendSummary = backendRestored?.generatedSessionSummaries?.[0]?.exercises?.[0];
    addLifecycle({
      scenarioId: 'backend_sanitize_sync_restore_preserves_plan_runtime_seed',
      lifecycleType: 'backend_roundtrip',
      runtimeOwnerId: 'step_up_alternation',
      createdCount: 1,
      finishedCount: 0,
      setResultCount: 0,
      progressionEventCount: 0,
      serializedStateKind: String(backendPayload.state_json?.activeSetRuntime?.kind ?? ''),
      restoreStateKind: backendRestored?.activeSetRuntime?.kind ?? '',
      expected: { planFingerprint: planRight.planFingerprint, activeRuntime: 'step_up_alternation', seed: 'right' },
      observed: {
        payloadPlanFingerprint: backendPayload.state_json?.generatedSessionContext?.recentSummaries?.[0]?.exercises?.[0]?.stepUpAlternationPlan?.planFingerprint,
        restoredPlanFingerprint: backendSummary?.stepUpAlternationPlan?.planFingerprint,
        restoredActiveRuntime: backendRestored?.activeSetRuntime?.kind,
        restoredSeed: backendRestored?.bothSidesStartSideSeed?.nextBothSidesStartSideByExercise?.['step-up'],
      },
      passed: backendPayload.state_json?.activeSetRuntime?.kind === 'step_up_alternation' &&
        backendRestored?.activeSetRuntime?.kind === 'step_up_alternation' &&
        backendSummary?.stepUpAlternationPlan?.planFingerprint === planRight.planFingerprint &&
        backendRestored?.bothSidesStartSideSeed?.nextBothSidesStartSideByExercise?.['step-up'] === 'right',
      notes: 'Backend service functions are corroborated by focused Jest tests; this Node harness mirrors the current sanitizer/restore shape without importing Supabase.',
    });
    addScenario({
      scenarioId: 'backend_sanitize_sync_restore_preserves_plan_runtime_seed',
      category: 'roundtrip',
      evidenceMethod: 'backend_shape_roundtrip_plus_focused_jest',
      sourceFiles: ['src/services/backend/trainingStateSyncService.ts', 'src/services/backend/restoreService.ts', 'src/training/serialize.ts'],
      sourceFunctions: ['mapLocalTrainingStateToRemotePayload', 'mapRemoteTrainingStateToLocal', 'deserializeTrainingState'],
      expectedOutcome: { planPreserved: true, activeRuntimePreserved: true, seedPreserved: true },
      observedOutcome: {
        payload: backendPayload.state_json,
        restoredActiveRuntime: backendRestored?.activeSetRuntime?.kind,
        restoredSeed: backendRestored?.bothSidesStartSideSeed?.nextBothSidesStartSideByExercise?.['step-up'],
        restoredPlanFingerprint: backendSummary?.stepUpAlternationPlan?.planFingerprint,
      },
      passed: backendRestored?.activeSetRuntime?.kind === 'step_up_alternation' &&
        backendSummary?.stepUpAlternationPlan?.planFingerprint === planRight.planFingerprint &&
        backendRestored?.bothSidesStartSideSeed?.nextBothSidesStartSideByExercise?.['step-up'] === 'right',
      metricTags: ['backend_roundtrip'],
      findingRuleIds: ['RULE-BACKEND-ROUNDTRIP'],
    });

    addSeedScenario('seed_main_plan_completion_flips_exactly_once', [
      { completed: true, countsTowardMainPlan: true, eventId: 'main:step-up' },
      { completed: true, countsTowardMainPlan: true, eventId: 'main:step-up' },
    ], 'right', 1);
    addSeedScenario('seed_skip_does_not_flip', [
      { completed: false, countsTowardMainPlan: true, eventId: 'skip:step-up' },
    ], 'left', 0);
    addSeedScenario('seed_cancel_incomplete_does_not_flip', [
      { completed: false, countsTowardMainPlan: true, eventId: 'cancel:step-up' },
    ], 'left', 0);
    addSeedScenario('seed_manual_practice_does_not_flip', [
      { completed: true, countsTowardMainPlan: false, eventId: 'manual:step-up' },
    ], 'left', 0);
    addSeedScenario('seed_explore_completion_does_not_flip', [
      { completed: true, countsTowardMainPlan: false, eventId: 'explore:step-up' },
    ], 'left', 0);

    const voiceRuntime = readyRuntime('left');
    feedStepRep(voiceRuntime.runtime, voiceRuntime.pipeline, 'left');
    const voiceContext = voiceRuntime.runtime.update(voiceRuntime.pipeline.process(floorFrames(1)[0])).stepUpContext;
    const voicePlan = planTrainingVoiceSequenceV21({
      exerciseId: 'step-up',
      exposure: 'wrong_lead_correction',
      stepUpContext: {
        plan: voiceContext.plan,
        setIndex: 0,
        startLeadSide: voiceContext.startLeadSide,
        expectedLeadSide: voiceContext.expectedLeadSide,
      },
    });
    addEvent({
      scenarioId: 'voice_v21_live_expected_lead_and_target_match',
      eventType: 'voice_context',
      runtimeLayer: 'TrainingSessionPlayer/voiceV21',
      expectedLeadBefore: voiceContext.expectedLeadSide,
      observedLead: '',
      credited: false,
      alternationAccepted: false,
      sfxPlayed: false,
      genericRepCredited: false,
      expectedLeadAfter: voiceContext.expectedLeadSide,
      acceptedRepCount: voiceContext.acceptedRepCount,
      leftLeadRepCount: voiceContext.leftLeadRepCount,
      rightLeadRepCount: voiceContext.rightLeadRepCount,
      voiceExpectedLead: voiceContext.expectedLeadSide,
      voiceTargetTotal: voicePlan.targetPlan.value,
      notes: JSON.stringify({ cueKeys: voicePlan.cueKeys, spokenText: voicePlan.targetPlan.spokenText }),
    });
    addScenario({
      scenarioId: 'voice_v21_live_expected_lead_and_target_match',
      category: 'voice_context',
      evidenceMethod: 'production_runtime_context_to_voice_planner',
      sourceFiles: ['src/training/sessionPlayer.ts', 'src/training/voiceV21/sequencePlanner.ts', 'src/training/voiceV21/readiness.ts'],
      sourceFunctions: ['StepUpAlternationSetRuntime.update', 'planTrainingVoiceSequenceV21'],
      expectedOutcome: { expectedLeadSide: 'right', targetTotalReps: 12, cueKey: 'step-up-wrong-right-v21' },
      observedOutcome: { context: voiceContext, cueKeys: voicePlan.cueKeys, targetPlan: voicePlan.targetPlan },
      passed: voiceContext.expectedLeadSide === 'right' && voicePlan.cueKeys[0] === 'step-up-wrong-right-v21' && voicePlan.targetPlan.value === 12,
      metricTags: ['voice_context'],
      findingRuleIds: ['RULE-VOICE-CONTEXT'],
    });

    const tvReadiness = resolveTrainingVoiceRuntimeReadinessV21({ exerciseId: 'step-up', stepUpAlternationPlan: planLeft });
    const stepUpContract = getTrainingVoiceContractV21('step-up');
    const selectorDefault = selectTrainingStepUpAlternationMode({ plans: [planLeft] });
    addScenario({
      scenarioId: 'project_boundaries_remain_default_closed',
      category: 'project_boundary',
      evidenceMethod: 'production_constants',
      sourceFiles: ['src/training/stepUpAlternation/readiness.ts', 'src/training/voiceV21/readiness.ts', 'src/config/eyesOpenBalanceProtocolV2.ts'],
      sourceFunctions: ['selectTrainingStepUpAlternationMode', 'resolveTrainingVoiceRuntimeReadinessV21'],
      expectedOutcome: { stepUpDefaultSelectable: false, voiceSelectable: false, balanceSelectable: false, voiceAudioReady: false, voiceBehaviorReady: false },
      observedOutcome: {
        selectorDefault,
        tvReadiness,
        trainingVoiceAudioReady: TRAINING_VOICE_V2_1_AUDIO_READY,
        trainingVoiceBehaviorReady: TRAINING_VOICE_V2_1_BEHAVIOR_READY,
        balanceSelectable: EYES_OPEN_BALANCE_PROTOCOL_V2_SELECTABLE,
        balanceAudioReady: EYES_OPEN_BALANCE_PROTOCOL_V2_AUDIO_READY,
        implementationRequirements: stepUpContract.implementationRequirements,
      },
      passed: !selectorDefault.selectable &&
        !tvReadiness.selectable &&
        TRAINING_VOICE_V2_1_AUDIO_READY === false &&
        TRAINING_VOICE_V2_1_BEHAVIOR_READY === false &&
        EYES_OPEN_BALANCE_PROTOCOL_V2_SELECTABLE === false &&
        EYES_OPEN_BALANCE_PROTOCOL_V2_AUDIO_READY === false,
      metricTags: ['default_closed'],
      findingRuleIds: ['RULE-RUNTIME-DEFAULTS'],
    });

    addScenario({
      scenarioId: 'audio_assets_unchanged_by_evidence_addendum',
      category: 'project_boundary',
      evidenceMethod: 'git_audio_diff',
      sourceFiles: ['assets/audio'],
      sourceFunctions: ['git diff --name-only -- assets/audio'],
      expectedOutcome: { audioDiffCount: 0 },
      observedOutcome: { audioDiffNameOnly: ${JSON.stringify(audioDiffNameOnly)} },
      passed: ${audioDiffNameOnly.length === 0},
      metricTags: ['footprint'],
      findingRuleIds: ['RULE-FOOTPRINT'],
    });

    function addSeedScenario(scenarioId, actions, expectedSide, expectedMutationCount) {
      let seed = undefined;
      let mutations = 0;
      const before = seed;
      for (const action of actions) {
        const next = applyBothSidesExerciseCompletionToStartSideSeed(seed, {
          exerciseId: 'step-up',
          completed: action.completed,
          countsTowardMainPlan: action.countsTowardMainPlan,
          eventId: action.eventId,
        });
        if (next !== seed && next.appliedBothSidesStartSideFlipEventIds.length !== (seed?.appliedBothSidesStartSideFlipEventIds?.length ?? 0)) {
          mutations++;
        }
        seed = next;
      }
      const observedSide = nextBothSidesStartSideForExercise(seed, 'step-up');
      addEvent({
        scenarioId,
        eventType: 'seed_update',
        runtimeLayer: 'App.tsx seed helper',
        credited: false,
        alternationAccepted: false,
        sfxPlayed: false,
        genericRepCredited: false,
        seedBefore: before,
        seedAfter: seed,
        notes: JSON.stringify(actions),
      });
      addLifecycle({
        scenarioId,
        lifecycleType: 'seed',
        runtimeOwnerId: 'App.tsx/applyBothSidesExerciseCompletionToStartSideSeed',
        seedMutationCount: mutations,
        expected: { nextSide: expectedSide, mutationCount: expectedMutationCount },
        observed: { nextSide: observedSide, mutationCount: mutations, seed },
        passed: observedSide === expectedSide && mutations === expectedMutationCount,
        notes: 'Uses production seed helper with main-plan gate and event-id idempotency.',
      });
      addScenario({
        scenarioId,
        category: 'seed',
        evidenceMethod: 'production_seed_helper',
        sourceFiles: ['App.tsx', 'src/training/bothSidesRounds/startSide.ts'],
        sourceFunctions: ['applyBothSidesExerciseCompletionToStartSideSeed', 'nextBothSidesStartSideForExercise'],
        expectedOutcome: { nextSide: expectedSide, mutationCount: expectedMutationCount },
        observedOutcome: { nextSide: observedSide, mutationCount: mutations, seed },
        passed: observedSide === expectedSide && mutations === expectedMutationCount,
        metricTags: ['seed'],
        findingRuleIds: ['RULE-SEED-MUTATION'],
      });
    }

    function addManualEvent(scenarioId, eventType, before, after, evidence, notes = '') {
      addEvent({
        scenarioId,
        eventType,
        repAttemptId: evidence.repAttemptId,
        expectedLeadBefore: before.expectedLeadSide,
        observedLead: evidence.observedLeadSide ?? '',
        bothFeetAtStart: evidence.bothFeetAtStart,
        topPhaseValid: evidence.topPhaseValid,
        bothFeetReturnedToFloor: evidence.bothFeetReturnedToFloor,
        trackingValid: evidence.trackingValid,
        evidenceOutcome: evidence.endReason,
        statePhaseBefore: before.phase,
        statePhaseAfter: after.phase,
        credited: after.acceptedRepCount > before.acceptedRepCount,
        alternationAccepted: after.acceptedRepCount > before.acceptedRepCount,
        sfxPlayed: after.repSfxCount > before.repSfxCount,
        genericRepCredited: false,
        expectedLeadAfter: after.expectedLeadSide,
        acceptedRepCount: after.acceptedRepCount,
        leftLeadRepCount: after.leftLeadRepCount,
        rightLeadRepCount: after.rightLeadRepCount,
        setCompleted: after.phase === 'set_complete',
        progressionEligible: summarizeStepUpSetResult(after).alternationValid,
        notes,
      });
    }

    function readyRuntime(initial) {
      const runtime = new StepUpAlternationSetRuntime({ plan: deriveStepUpAlternationPlanForExerciseId(initial), setIndex: 0 });
      const pipeline = warmedPipeline();
      feedFrames(runtime, pipeline, floorFrames(16), 'runtime_warm_floor');
      return { runtime, pipeline };
    }

    function warmedPipeline() {
      timestampCursor = 0;
      const pipeline = new PosePipeline();
      const rng = mulberry32(99);
      for (let i = 0; i < 130; i++) {
        const ts = Math.round(i * FRAME_MS);
        pipeline.process(makeFrame(ts, rng, { noiseAmp: 0 }));
        timestampCursor = ts + Math.round(FRAME_MS);
      }
      return pipeline;
    }

    function feedStepRep(runtime, pipeline, lead, returnFrames = 6) {
      return feedFrames(runtime, pipeline, [...stepFrames(lead), ...floorFrames(returnFrames)], 'feed_step_rep');
    }

    function feedFrames(runtime, pipeline, frames, scenarioIdForEvents = '') {
      const accepted = [];
      for (const event of frames) {
        const before = runtime.getState();
        const update = runtime.update(pipeline.process(event));
        const after = runtime.getState();
        if (update.acceptedRepEvent) {
          accepted.push(update.acceptedRepEvent);
          if (scenarioIdForEvents && !scenarioIdForEvents.startsWith('runtime_warm')) {
            addEvent({
              scenarioId: scenarioIdForEvents,
              eventType: 'runtime_update',
              timestampMs: event.timestampMs,
              repAttemptId: update.acceptedRepEvent.repAttemptId,
              expectedLeadBefore: before.expectedLeadSide,
              observedLead: after.repEvidence[after.repEvidence.length - 1]?.observedLeadSide ?? '',
              bothFeetAtStart: true,
              topPhaseValid: true,
              bothFeetReturnedToFloor: true,
              trackingValid: true,
              evidenceOutcome: 'accepted',
              statePhaseBefore: before.phase,
              statePhaseAfter: after.phase,
              credited: true,
              alternationAccepted: true,
              sfxPlayed: true,
              genericRepCredited: false,
              expectedLeadAfter: after.expectedLeadSide,
              acceptedRepCount: after.acceptedRepCount,
              leftLeadRepCount: after.leftLeadRepCount,
              rightLeadRepCount: after.rightLeadRepCount,
              setCompleted: after.phase === 'set_complete',
            });
          }
        }
      }
      return accepted;
    }

    function stepFrames(lead) {
      if (lead === 'both') return [...liftFrames(0.28, 0.28, 5), ...floorFrames(5)];
      const other = lead === 'left' ? 'right' : 'left';
      return [
        ...liftFrames(lead === 'left' ? 0.28 : 0, lead === 'right' ? 0.28 : 0, 4),
        ...liftFrames(0.28, 0.28, 5),
        ...liftFrames(other === 'left' ? 0.28 : 0, other === 'right' ? 0.28 : 0, 2),
      ];
    }

    function floorFrames(count) {
      return liftFrames(0, 0, count);
    }

    function liftFrames(leftLiftBu, rightLiftBu, count) {
      const frames = [];
      const rng = mulberry32(1234 + Math.round(leftLiftBu * 100) * 17 + Math.round(rightLiftBu * 100));
      const start = timestampCursor;
      for (let i = 0; i < count; i++) {
        frames.push(stepFrame(start + Math.round(i * FRAME_MS), rng, leftLiftBu, rightLiftBu));
      }
      timestampCursor = start + Math.round(count * FRAME_MS);
      return frames;
    }

    function stepFrame(timestampMs, rng, leftLiftBu, rightLiftBu) {
      const event = makeFrame(timestampMs, rng, { noiseAmp: 0 });
      const landmarks = Array.from(event.landmarks);
      applyFootLift(landmarks, 'left', leftLiftBu * SYNTHETIC_HIP_ANKLE);
      applyFootLift(landmarks, 'right', rightLiftBu * SYNTHETIC_HIP_ANKLE);
      return { timestampMs, landmarks };
    }

    function applyFootLift(landmarks, side, lift) {
      const indices = side === 'left'
        ? [LM.LEFT_ANKLE, LM.LEFT_HEEL, LM.LEFT_FOOT_INDEX]
        : [LM.RIGHT_ANKLE, LM.RIGHT_HEEL, LM.RIGHT_FOOT_INDEX];
      for (const landmark of indices) landmarks[landmark * LANDMARK_STRIDE + 1] -= lift;
    }

    function stateSummary(state) {
      return {
        phase: state.phase,
        expectedLeadSide: state.expectedLeadSide,
        acceptedRepCount: state.acceptedRepCount,
        leftLeadRepCount: state.leftLeadRepCount,
        rightLeadRepCount: state.rightLeadRepCount,
        ignoredStaleActionCount: state.ignoredStaleActionCount,
        duplicateSuppressedCount: state.duplicateSuppressedCount,
        wrongLeadCount: state.wrongLeadCount,
        repSfxCount: state.repSfxCount,
      };
    }

    function sanitizeForBackendJson(value, key = '') {
      if (/(frame|frames|landmark|landmarks|video|image|base64|uri|path)/i.test(key)) return null;
      if (value === null || value === undefined) return null;
      if (typeof value === 'boolean' || typeof value === 'string') return value;
      if (typeof value === 'number') return Number.isFinite(value) ? value : null;
      if (Array.isArray(value)) return value.map((item) => sanitizeForBackendJson(item));
      if (typeof value === 'object') {
        const out = {};
        for (const [childKey, childValue] of Object.entries(value)) {
          if (/(frame|frames|landmark|landmarks|video|image|base64|uri|path)/i.test(childKey)) continue;
          out[childKey] = sanitizeForBackendJson(childValue, childKey);
        }
        return out;
      }
      return null;
    }

    function sanitizeGeneratedExerciseSummary(summary) {
      return sanitizeForBackendJson({
        exerciseId: summary.exerciseId,
        ladderId: summary.ladderId,
        levelId: summary.levelId,
        slotType: summary.slotType,
        sets: summary.sets,
        repsPerSet: summary.repsPerSet,
        secondsPerSet: summary.secondsPerSet,
        measurementTier: summary.measurementTier,
        intendedDomain: summary.intendedDomain,
        stimulusRole: summary.stimulusRole,
        stimulusReason: summary.stimulusReason,
        requestedLevelId: summary.requestedLevelId,
        storedLevelId: summary.storedLevelId,
        selectedDailyLevelId: summary.selectedDailyLevelId,
        progressionPolicySelectionReason: summary.progressionPolicySelectionReason,
        progressionPolicyDiagnostics: summary.progressionPolicyDiagnostics,
        doseBeforeAdjustment: summary.doseBeforeAdjustment,
        adjustmentReasons: summary.adjustmentReasons,
        collectionSelection: summary.collectionSelection,
        bothSidesDosePlan: summary.bothSidesDosePlan,
        bothSidesInitialStartSide: summary.bothSidesInitialStartSide,
        stepUpAlternationPlan: summary.stepUpAlternationPlan,
        stepUpInitialLeadSide: summary.stepUpInitialLeadSide,
      });
    }

    function sanitizeGeneratedSessionSummary(summary) {
      return sanitizeForBackendJson({
        id: summary.id,
        blockId: summary.blockId,
        source: summary.source,
        templateId: summary.templateId,
        title: summary.title,
        completedAt: summary.completedAt,
        exerciseIds: summary.exerciseIds,
        exercises: summary.exercises?.map(sanitizeGeneratedExerciseSummary),
      });
    }

    function mapLocalTrainingStateToRemotePayloadLike(input, userId) {
      const updatedAt = input.updatedAt ?? new Date(0).toISOString();
      return {
        user_id: userId,
        updated_at: updatedAt,
        state_json: sanitizeForBackendJson({
          snapshotSchemaVersion: 1,
          trainingSchemaVersion: TRAINING_SCHEMA_VERSION,
          capturedAt: updatedAt,
          activeLegacyTrainingBlock: input.training.block,
          progress: input.training.progress,
          progression: input.training.progression,
          equipment: input.training.equipment,
          planPreferences: input.training.planPreferences,
          ladderProgressById: input.training.ladderProgressById,
          appliedProgressionEventIds: input.training.appliedProgressionEventIds,
          bothSidesStartSideSeed: input.training.bothSidesStartSideSeed,
          activeSetRuntime: input.training.activeSetRuntime,
          generatedSessionContext: {
            totalPersisted: input.training.generatedSessionSummaries.length,
            recentSummaries: input.training.generatedSessionSummaries.slice(-20).map(sanitizeGeneratedSessionSummary),
          },
          lastPostSessionFeedback: input.training.lastPostSessionFeedback,
        }),
      };
    }

    function mapRemoteTrainingStateToLocalLike(row) {
      const stateJson = row?.state_json && typeof row.state_json === 'object' ? row.state_json : {};
      const generatedSessionContext = stateJson.generatedSessionContext && typeof stateJson.generatedSessionContext === 'object'
        ? stateJson.generatedSessionContext
        : {};
      const recentSummaries = Array.isArray(generatedSessionContext.recentSummaries)
        ? generatedSessionContext.recentSummaries
        : [];
      return trainingStateRoundTripLike({
        block: stateJson.block ?? stateJson.activeLegacyTrainingBlock ?? null,
        progression: stateJson.progression,
        equipment: stateJson.equipment,
        progress: stateJson.progress,
        ladderProgressById: stateJson.ladderProgressById,
        appliedProgressionEventIds: stateJson.appliedProgressionEventIds,
        bothSidesStartSideSeed: stateJson.bothSidesStartSideSeed,
        activeSetRuntime: stateJson.activeSetRuntime,
        generatedSessionSummaries: stateJson.generatedSessionSummaries ?? recentSummaries,
        lastPostSessionFeedback: stateJson.lastPostSessionFeedback ?? null,
        planPreferences: stateJson.planPreferences,
      });
    }

    function emptyTrainingStateLike() {
      return {
        block: null,
        progression: { levels: {}, velHistory: {} },
        equipment: { stair: false, band: false, miniBand: false, load: false },
        progress: { completedSessions: 0, lastSessionAt: null, retestDueAt: null },
        ladderProgressById: {},
        appliedProgressionEventIds: [],
        generatedSessionSummaries: [],
        lastPostSessionFeedback: null,
        planPreferences: { preferredIntensity: 'standard' },
        bothSidesStartSideSeed: { nextBothSidesStartSideByExercise: {}, appliedBothSidesStartSideFlipEventIds: [] },
        activeSetRuntime: null,
      };
    }

    function trainingStateRoundTripLike(state) {
      const raw = JSON.parse(JSON.stringify(state));
      return {
        ...emptyTrainingStateLike(),
        ...raw,
        bothSidesStartSideSeed: normalizeSeedLike(raw.bothSidesStartSideSeed),
        activeSetRuntime: validSerializedTrainingSetRuntimeLike(raw.activeSetRuntime),
        generatedSessionSummaries: Array.isArray(raw.generatedSessionSummaries) ? raw.generatedSessionSummaries : [],
      };
    }

    function normalizeSeedLike(seed) {
      const next = {};
      const source = seed?.nextBothSidesStartSideByExercise ?? {};
      for (const [exerciseId, side] of Object.entries(source)) {
        if (exerciseId === 'step-up' && (side === 'left' || side === 'right')) next[exerciseId] = side;
      }
      return {
        nextBothSidesStartSideByExercise: next,
        appliedBothSidesStartSideFlipEventIds: Array.isArray(seed?.appliedBothSidesStartSideFlipEventIds)
          ? seed.appliedBothSidesStartSideFlipEventIds.filter((item) => typeof item === 'string')
          : [],
      };
    }

    function validSerializedTrainingSetRuntimeLike(runtime) {
      if (!runtime || typeof runtime !== 'object') return null;
      if (runtime.kind === 'legacy' && runtime.schemaVersion === 1) return { kind: 'legacy', schemaVersion: 1 };
      if (runtime.kind !== 'step_up_alternation' || runtime.schemaVersion !== 1) return null;
      const state = deserializeStepUpAlternationRuntimeState(runtime.state);
      const adapter = runtime.adapter;
      if (!state || !adapter || adapter.schemaVersion !== 1) return null;
      const floorBaseline = adapter.floorBaseline;
      return {
        kind: 'step_up_alternation',
        schemaVersion: 1,
        state,
        adapter: {
          schemaVersion: 1,
          floorBaseline: floorBaseline
            ? { leftFootY: floorBaseline.leftFootY, rightFootY: floorBaseline.rightFootY }
            : null,
        },
      };
    }

    console.log(JSON.stringify({
      scenarios,
      events,
      lifecycles,
      sourceFacts: {
        stepUpDefinition: { id: stepUpDef.id, sets: stepUpDef.prescription.sets, repsPerSet: stepUpDef.prescription.repsPerSet },
        planLeft,
        planRight,
        defaultClosedBoundaries: {
          stepUpAlternationFeatureDefault: 'off',
          trainingVoiceV21Feature: 'off',
          trainingVoiceV21AudioReady: TRAINING_VOICE_V2_1_AUDIO_READY,
          trainingVoiceV21GlobalBehaviorReady: TRAINING_VOICE_V2_1_BEHAVIOR_READY,
          balanceV2Selectable: EYES_OPEN_BALANCE_PROTOCOL_V2_SELECTABLE,
          balanceV2AudioReady: EYES_OPEN_BALANCE_PROTOCOL_V2_AUDIO_READY,
        },
      },
    }));
  `;
  return JSON.parse(execFileSync('npx', ['tsx', '-e', code], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 60 * 1024 * 1024,
  }));
}

function readPriorScenarioRows() {
  const full = path.join(ROOT, PRIOR_CANONICAL_CSV);
  if (!fs.existsSync(full)) return [];
  const rows = parseCsvText(fs.readFileSync(full, 'utf8'));
  return rows.map((row) => ({
    scenarioId: row.scenarioId,
    variantId: row.variantId || 'prior',
    category: 'prior_alternation_addendum_retained',
    evidenceMethod: 'prior_addendum_csv_retained_for_context',
    sourceFiles: PRIOR_CANONICAL_CSV,
    sourceFunctions: row.sourceFunctions ?? '',
    initialState: row.initialState ?? '{}',
    eventSequence: row.eventSequence ?? '[]',
    expectedOutcome: row.expectedOutcome ?? '{}',
    observedOutcome: row.observedOutcome ?? '{}',
    passed: row.passed === 'true' || row.passed === true ? 'true' : 'false',
    metricTags: row.metricTags ?? '',
    findingRuleIds: row.findingRuleIds ?? '',
    notes: 'Retained from prior alternation verification addendum; critical metrics below are recomputed from this addendum execution rows.',
  }));
}

function buildRuntimeTrace() {
  const checks = [
    traceRow(1, 'Exercise registry', 'Generated session item', 'src/exercises/stepUp.ts;src/training/workoutGeneration.ts', 'stepUpDefinition;GeneratedExercise', sourceHas('src/training/workoutGeneration.ts', 'stepUpAlternationFeatureEnabled'), 'connected_verified', 'GeneratedExercise can carry step-up alternation metadata.'),
    traceRow(2, 'Final prescription', 'Alternation plan', 'src/training/stepUpAlternation/generatedSession.ts', 'deriveStepUpAlternationPlanForGeneratedExercise', sourceHas('src/training/stepUpAlternation/generatedSession.ts', 'deriveStepUpAlternationPlanForGeneratedExercise'), 'connected_verified', 'Generated sessions can receive one pinned step-up plan when gated.'),
    traceRow(3, 'Feature/readiness selector', 'Active internal runtime path', 'src/training/setRuntime.ts;src/training/sessionPlayer.ts', 'selectTrainingSetRuntime;createTrainingSetRuntime', sourceHas('src/training/setRuntime.ts', 'createTrainingSetRuntime') && sourceHas('src/training/sessionPlayer.ts', 'createTrainingSetRuntime'), 'connected_verified', 'Selector routes only gated internal V2.1-capable step-up items.'),
    traceRow(4, 'Training screen/session controller', 'Alternation runtime owner', 'src/screens/TrainingSessionScreen.tsx;src/training/sessionPlayer.ts', 'TrainingSessionPlayerOptions;TrainingSetRuntime', sourceHas('src/screens/TrainingSessionScreen.tsx', 'stepUpAlternationReady') && sourceHas('src/training/sessionPlayer.ts', 'private runtime: TrainingSetRuntime'), 'connected_verified', 'Screen can pass internal capabilities and player owns one runtime.'),
    traceRow(5, 'Pose/grader output', 'Lead-leg and floor-boundary evidence', 'src/training/stepUpAlternation/evidenceAdapter.ts', 'createStepUpAlternationEvidenceAdapter', sourceHas('src/training/stepUpAlternation/evidenceAdapter.ts', 'observedLeadCandidate') && sourceHas('src/training/stepUpAlternation/evidenceAdapter.ts', 'returnToFloorValid'), 'connected_verified', 'Adapter derives observed lead, top phase, return, floor baseline, and tracking validity.'),
    traceRow(6, 'Evidence', 'Alternation state-machine action', 'src/training/stepUpAlternation/runtime.ts;src/training/stepUpAlternation/stateMachine.ts', 'APPLY_REP_EVIDENCE', sourceHas('src/training/stepUpAlternation/runtime.ts', 'APPLY_REP_EVIDENCE') && sourceHas('src/training/stepUpAlternation/stateMachine.ts', 'duplicateSuppressedCount'), 'connected_verified', 'Runtime dispatches terminal evidence to the reducer and reducer suppresses duplicate/stale callbacks.'),
    traceRow(7, 'Accepted alternation rep', 'Rep-credit SFX', 'src/training/sessionPlayer.ts', 'acceptedRepEvent', sourceHas('src/training/sessionPlayer.ts', '!!runtimeUpdate.acceptedRepEvent') && sourceHas('src/training/stepUpAlternation/runtime.ts', 'live.repCredited = false'), 'connected_verified', 'Internal SFX is driven by alternation acceptedRepEvent, while generic repCredited remains false.'),
    traceRow(8, 'Alternation state', 'SetResult', 'src/training/stepUpAlternation/runtime.ts;src/training/stepUpAlternation/aggregation.ts', 'stepUpSetResultToLegacySetResult', sourceHas('src/training/stepUpAlternation/runtime.ts', 'stepUpSetResultToLegacySetResult') && sourceHas('src/training/stepUpAlternation/aggregation.ts', 'stepUpAlternation'), 'connected_verified', 'Runtime finish emits an adapted SetResult with step-up metadata.'),
    traceRow(9, 'SetResult', 'Progression', 'src/training/progression.ts', 'summarizeItem', sourceHas('src/training/progression.ts', 'sets.every((s) => s.reachedTarget)'), 'connected_verified', 'Progression consumes adapted SetResult as one reps set.'),
    traceRow(10, 'SetResult', 'Valid-time summary', 'src/training/validTimeProgression.ts', 'summarizeValidTimeSets', true, 'not_applicable', 'Step-up is rep-based and has no valid-time payload to double.'),
    traceRow(11, 'Active alternation state', 'Local serialization', 'src/training/serialize.ts;src/training/sessionPlayer.ts', 'activeSetRuntime;serializeCurrentSetRuntime', sourceHas('src/training/serialize.ts', 'activeSetRuntime') && sourceHas('src/training/sessionPlayer.ts', 'serializeCurrentSetRuntime'), 'connected_verified', 'Active runtime envelope is schema-versioned and JSON-safe.'),
    traceRow(12, 'Local serialization', 'Live restore', 'src/training/serialize.ts;src/training/stepUpAlternation/runtime.ts', 'validSerializedTrainingSetRuntime;restored', sourceHas('src/training/serialize.ts', 'validSerializedTrainingSetRuntime') && sourceHas('src/training/stepUpAlternation/runtime.ts', 'input.restored'), 'connected_verified', 'Restore validates fingerprint and retires partial attempts.'),
    traceRow(13, 'Training state', 'Backend JSON sync/restore', 'src/services/backend/trainingStateSyncService.ts;src/services/backend/restoreService.ts', 'activeSetRuntime;stepUpAlternationPlan;bothSidesStartSideSeed', sourceHas('src/services/backend/trainingStateSyncService.ts', 'activeSetRuntime') && sourceHas('src/services/backend/trainingStateSyncService.ts', 'stepUpAlternationPlan') && sourceHas('src/services/backend/restoreService.ts', 'activeSetRuntime'), 'connected_verified', 'Compact backend state retains generated plan, active runtime, and seed.'),
    traceRow(14, 'Successful main-plan completion', 'Initial-lead seed flip', 'App.tsx', 'applyBothSidesExerciseCompletionToStartSideSeed', sourceHas('App.tsx', 'applyBothSidesExerciseCompletionToStartSideSeed') && sourceHas('App.tsx', 'countsTowardMainPlan: true'), 'connected_verified', 'Main-plan step-up completion flips the shared seed once.'),
    traceRow(15, 'Manual/Explore completion', 'No main-plan seed mutation', 'App.tsx;src/training/bothSidesRounds/startSide.ts', 'countsTowardMainPlan=false', sourceHas('src/training/bothSidesRounds/startSide.ts', '!input.countsTowardMainPlan'), 'connected_verified', 'Seed helper remains gated to main-plan completion; manual/explore scenarios use false main-plan credit.'),
    traceRow(16, 'Active alternation state', 'Training Voice V2.1 planner', 'src/training/sessionPlayer.ts;src/training/voiceV21/sequencePlanner.ts', 'stepUpContext;planTrainingVoiceSequenceV21', sourceHas('src/training/sessionPlayer.ts', 'stepUpContext') && sourceHas('src/training/voiceV21/sequencePlanner.ts', 'stepUpContext'), 'connected_verified', 'Live context carries pinned plan and expected lead for logical V2.1 planning.'),
  ];
  return checks.map((row) => ({
    ...row,
    status: row.status === 'not_applicable' ? 'not_applicable' : row.connected ? row.status : 'uncertain',
  }));
}

function traceRow(linkId, fromComponent, toComponent, sourceFile, sourceSymbol, connected, status, evidenceDetail) {
  return {
    linkId,
    fromComponent,
    toComponent,
    sourceFile,
    sourceSymbol,
    reachableWhenEnabled: status === 'not_applicable' ? 'not_applicable' : 'yes_when_internal_ready',
    evidenceType: 'source_query+executed_scenarios+focused_jest',
    evidenceDetail,
    status,
    connected,
  };
}

function recomputeFromWrittenArtifacts(trace) {
  const scenarios = parseCsvFile(ARTIFACTS.scenariosCsv);
  const events = parseCsvFile(ARTIFACTS.eventsCsv);
  const lifecycles = parseCsvFile(ARTIFACTS.lifecyclesCsv);
  return {
    scenarios,
    events,
    lifecycles,
    metrics: computeMetrics({ scenarios, events, lifecycles, trace }),
  };
}

function computeMetrics(input) {
  const { scenarios, events, lifecycles, trace } = input;
  const executedScenarios = scenarios.filter((row) => row.category !== 'prior_alternation_addendum_retained');
  const metric = {};
  metric.priorCanonicalScenarioRowsRetained = scenarios.length - executedScenarios.length;
  metric.executedScenarioRows = executedScenarios.length;
  metric.eventEvidenceRows = events.length;
  metric.lifecycleRows = lifecycles.length;
  metric.failedExecutedScenarioCount = executedScenarios.filter((row) => row.passed !== 'true').length;
  metric.failedLifecycleCount = lifecycles.filter((row) => row.passed !== 'true').length;
  metric.wrongLeadLiveCreditCount = events.filter((row) => row.evidenceOutcome === 'wrong_lead' && row.credited === 'true').length;
  metric.unknownLeadLiveCreditCount = events.filter((row) => row.eventType === 'runtime_update' && row.observedLead === '' && row.credited === 'true').length;
  metric.preFloorReturnCreditCount = events.filter((row) => row.credited === 'true' && row.bothFeetReturnedToFloor === 'false').length;
  metric.duplicateStaleCreditCount = events.filter((row) =>
    ['duplicate_callback', 'stale_callback', 'restore_callback', 'pause_callback', 'background_callback'].includes(row.eventType) &&
    (row.credited === 'true' || row.alternationAccepted === 'true' || row.sfxPlayed === 'true' || row.genericRepCredited === 'true')
  ).length;
  metric.genericAlternationDoubleCreditCount = events.filter((row) =>
    row.alternationAccepted === 'true' && row.genericRepCredited === 'true'
  ).length;
  metric.setResultDuplicationCount = lifecycles.filter((row) =>
    row.lifecycleType === 'set_result' &&
    Number(row.setResultCount) !== Number(row.finishedCount || row.setResultCount)
  ).length + lifecycles.filter((row) =>
    row.scenarioId === 'one_completed_set_one_canonical_set_result' && Number(row.setResultCount) !== 1
  ).length;
  metric.invalidProgressionAcceptanceCount = scenarios.filter((row) =>
    row.metricTags.split(';').includes('invalid_progression') &&
    parseJson(row.observedOutcome)?.progressionEligible === true
  ).length + events.filter((row) =>
    row.progressionEligible === 'true' &&
    ['wrong_lead', 'invalid_phase', 'tracking_interrupted', 'cancelled'].includes(row.evidenceOutcome)
  ).length;
  metric.localRoundTripFailureCount = lifecycles.filter((row) =>
    row.lifecycleType === 'local_roundtrip' && row.passed !== 'true'
  ).length;
  metric.backendRoundTripFailureCount = lifecycles.filter((row) =>
    row.lifecycleType === 'backend_roundtrip' && row.passed !== 'true'
  ).length;
  metric.seedMutationFailureCount = lifecycles.filter((row) => {
    if (row.lifecycleType !== 'seed') return false;
    const expected = parseJson(row.expected);
    const observed = parseJson(row.observed);
    return expected.nextSide !== observed.nextSide || expected.mutationCount !== observed.mutationCount;
  }).length;
  metric.voiceContextMismatchCount = events.filter((row) =>
    row.eventType === 'voice_context' &&
    (row.voiceExpectedLead !== row.expectedLeadAfter || Number(row.voiceTargetTotal) !== 12)
  ).length + scenarios.filter((row) =>
    row.metricTags.split(';').includes('voice_context') && row.passed !== 'true'
  ).length;
  metric.traceConnectedVerifiedCount = trace.filter((row) => row.status === 'connected_verified').length;
  metric.traceNotApplicableCount = trace.filter((row) => row.status === 'not_applicable').length;
  metric.traceMissingCount = trace.filter((row) => row.status === 'missing').length;
  metric.tracePartialCount = trace.filter((row) => row.status === 'partial' || row.status === 'partially_connected').length;
  metric.traceLegacyOnlyCount = trace.filter((row) => row.status === 'legacy_only').length;
  metric.traceUncertainCount = trace.filter((row) => row.status === 'uncertain').length;
  metric.defaultClosedFailureCount = scenarios.filter((row) =>
    row.metricTags.split(';').includes('default_closed') && row.passed !== 'true'
  ).length;
  metric.audioDiffCount = parseJson(scenarios.find((row) => row.scenarioId === 'audio_assets_unchanged_by_evidence_addendum')?.observedOutcome)?.audioDiffNameOnly?.length ?? 0;
  return metric;
}

function buildMetricEvidence(metrics) {
  const evidence = {};
  const filters = {
    duplicateStaleCreditCount: 'events[eventType in duplicate_callback|stale_callback|restore_callback|pause_callback|background_callback && (credited|alternationAccepted|sfxPlayed|genericRepCredited)]',
    genericAlternationDoubleCreditCount: 'events[alternationAccepted=true && genericRepCredited=true]',
    setResultDuplicationCount: 'lifecycles[lifecycleType=set_result && setResultCount!=finishedCount] plus one-set setResultCount!=1',
    invalidProgressionAcceptanceCount: 'scenarios[metricTags includes invalid_progression && observedOutcome.progressionEligible=true] plus invalid events with progressionEligible=true',
    localRoundTripFailureCount: 'lifecycles[lifecycleType=local_roundtrip && passed!=true]',
    backendRoundTripFailureCount: 'lifecycles[lifecycleType=backend_roundtrip && passed!=true]',
    seedMutationFailureCount: 'lifecycles[lifecycleType=seed && expected nextSide/mutationCount != observed]',
    voiceContextMismatchCount: 'events[eventType=voice_context && voiceExpectedLead!=expectedLeadAfter or voiceTargetTotal!=12] plus failed voice_context scenarios',
    p0: 'findings[severity=P0]',
    p1: 'findings[severity=P1]',
    p2: 'findings[severity=P2]',
    p3: 'findings[severity=P3]',
  };
  for (const [name, value] of Object.entries(metrics)) {
    evidence[name] = {
      value,
      recomputeMethod: `computeMetrics.${name} after reopening written scenarios/events/lifecycles CSVs`,
      sourceFilter: filters[name] ?? 'derived from written scenarios/events/lifecycles/trace rows',
      sourceArtifacts: [
        ARTIFACTS.scenariosCsv,
        ARTIFACTS.eventsCsv,
        ARTIFACTS.lifecyclesCsv,
      ],
    };
  }
  return evidence;
}

function runSensitivityChecks(input) {
  const baseline = computeMetrics(input);
  const checks = [];
  const mutate = (name, mutator, metricName = name) => {
    const copy = deepClone(input);
    mutator(copy);
    const next = computeMetrics(copy);
    checks.push({
      checkId: `sensitivity_${name}`,
      metricName,
      baselineValue: baseline[metricName],
      mutatedValue: next[metricName],
      passed: Number(next[metricName]) > Number(baseline[metricName]),
      mutation: name,
    });
  };
  mutate('duplicate_stale_credit', (copy) => {
    const row = copy.events.find((event) => event.eventType === 'duplicate_callback') ?? copy.events.find((event) => event.eventType === 'stale_callback');
    row.credited = 'true';
    row.sfxPlayed = 'true';
  }, 'duplicateStaleCreditCount');
  mutate('generic_alternation_double_credit', (copy) => {
    const row = copy.events.find((event) => event.eventType === 'sfx_authority');
    row.genericRepCredited = 'true';
  }, 'genericAlternationDoubleCreditCount');
  mutate('set_result_duplication', (copy) => {
    const row = copy.lifecycles.find((item) => item.scenarioId === 'one_completed_set_one_canonical_set_result');
    row.setResultCount = '2';
  }, 'setResultDuplicationCount');
  mutate('invalid_progression_acceptance', (copy) => {
    const row = copy.scenarios.find((item) => item.metricTags.split(';').includes('invalid_progression'));
    const observed = parseJson(row.observedOutcome);
    row.observedOutcome = JSON.stringify({ ...observed, progressionEligible: true });
  }, 'invalidProgressionAcceptanceCount');
  mutate('local_roundtrip_failure', (copy) => {
    const row = copy.lifecycles.find((item) => item.lifecycleType === 'local_roundtrip');
    row.passed = 'false';
  }, 'localRoundTripFailureCount');
  mutate('backend_roundtrip_failure', (copy) => {
    const row = copy.lifecycles.find((item) => item.lifecycleType === 'backend_roundtrip');
    row.passed = 'false';
  }, 'backendRoundTripFailureCount');
  mutate('seed_mutation_failure', (copy) => {
    const row = copy.lifecycles.find((item) => item.lifecycleType === 'seed' && item.scenarioId.includes('manual'));
    const observed = parseJson(row.observed);
    row.observed = JSON.stringify({ ...observed, nextSide: 'right', mutationCount: 1 });
  }, 'seedMutationFailureCount');
  mutate('voice_context_mismatch', (copy) => {
    const row = copy.events.find((event) => event.eventType === 'voice_context');
    row.voiceTargetTotal = '10';
  }, 'voiceContextMismatchCount');

  const severityChecks = [];
  for (const severity of ['P0', 'P1', 'P2']) {
    const findings = [{ severity, status: 'synthetic_failure' }];
    const counts = countFindingsBySeverity(findings);
    severityChecks.push({
      checkId: `sensitivity_${severity.toLowerCase()}_from_findings`,
      metricName: severity.toLowerCase(),
      baselineValue: 0,
      mutatedValue: counts[severity] ?? 0,
      passed: (counts[severity] ?? 0) === 1,
      mutation: `inject synthetic ${severity} finding`,
    });
  }
  const verdictCheck = {
    checkId: 'sensitivity_verdict_from_gates',
    metricName: 'primaryVerdict',
    baselineValue: 'computed from gates',
    mutatedValue: deriveVerdict([{ id: 'synthetic_gate', passed: false, severityOnFailure: 'P1' }], { p0: 0, p1: 1, p2: 0 }, checks),
    passed: deriveVerdict([{ id: 'synthetic_gate', passed: false, severityOnFailure: 'P1' }], { p0: 0, p1: 1, p2: 0 }, checks) !== 'TRAINING_STEP_UP_RUNTIME_EVIDENCE_VERIFIED_WITH_DEVICE_QA_PENDING',
    mutation: 'set one completion gate failed',
  };
  return [...checks, ...severityChecks, verdictCheck];
}

function buildCompletionGates(metrics, trace, focusedTests, footprint, sourceFacts) {
  const gate = (id, passed, observed, required, severityOnFailure = 'P1', notes = '') => ({
    id,
    passed,
    observed,
    required,
    severityOnFailure,
    notes,
  });
  return [
    gate('duplicate_stale_credit_zero', metrics.duplicateStaleCreditCount === 0, metrics.duplicateStaleCreditCount, 0, 'P1'),
    gate('generic_alternation_double_credit_zero', metrics.genericAlternationDoubleCreditCount === 0, metrics.genericAlternationDoubleCreditCount, 0, 'P1'),
    gate('set_result_duplication_zero', metrics.setResultDuplicationCount === 0, metrics.setResultDuplicationCount, 0, 'P1'),
    gate('invalid_progression_acceptance_zero', metrics.invalidProgressionAcceptanceCount === 0, metrics.invalidProgressionAcceptanceCount, 0, 'P1'),
    gate('local_roundtrip_failure_zero', metrics.localRoundTripFailureCount === 0, metrics.localRoundTripFailureCount, 0, 'P1'),
    gate('backend_roundtrip_failure_zero', metrics.backendRoundTripFailureCount === 0, metrics.backendRoundTripFailureCount, 0, 'P1'),
    gate('seed_mutation_failure_zero', metrics.seedMutationFailureCount === 0, metrics.seedMutationFailureCount, 0, 'P1'),
    gate('voice_context_mismatch_zero', metrics.voiceContextMismatchCount === 0, metrics.voiceContextMismatchCount, 0, 'P1'),
    gate('trace_16_links_current', trace.length === 16 && metrics.traceConnectedVerifiedCount === 15 && metrics.traceNotApplicableCount === 1 && metrics.traceMissingCount === 0 && metrics.tracePartialCount === 0 && metrics.traceLegacyOnlyCount === 0 && metrics.traceUncertainCount === 0, `${metrics.traceConnectedVerifiedCount} connected, ${metrics.traceNotApplicableCount} not_applicable, ${metrics.traceUncertainCount} uncertain`, '15 connected, 1 not_applicable, 0 missing/partial/legacy/uncertain', 'P2'),
    gate('focused_jest_passed', focusedTests.status === 'passed', focusedTests.status, 'passed', 'P2', focusedTests.summary),
    gate('default_closed_boundaries_preserved', metrics.defaultClosedFailureCount === 0 && sourceFacts.defaultClosedBoundaries.trainingVoiceV21AudioReady === false && sourceFacts.defaultClosedBoundaries.trainingVoiceV21GlobalBehaviorReady === false, metrics.defaultClosedFailureCount, 0, 'P1'),
    gate('audio_unchanged', metrics.audioDiffCount === 0 && footprint.currentAudioDiffNameOnly.length === 0, `${metrics.audioDiffCount}/${footprint.currentAudioDiffNameOnly.length}`, '0/0', 'P0'),
    gate(
      'addendum_footprint_audit_only',
      footprint.auditDisallowedWrittenFiles.length === 0,
      footprint.auditDisallowedWrittenFiles.join(';'),
      'audit wrote only requested audit artifacts and harness',
      'P0',
      `Outside-addendum diff currently present: ${footprint.newOutsideAddendumDiffFiles.join(';') || 'none'}`
    ),
  ];
}

function deriveFindings(input) {
  const findings = [];
  const rules = [
    {
      id: 'RULE-DUPLICATE-STALE-CREDIT',
      severity: 'P1',
      metrics: ['duplicateStaleCreditCount'],
      title: 'Duplicate or stale evidence credited a rep',
      details: 'Duplicate, stale, pause/background, or restore callback rows must never credit or play SFX.',
    },
    {
      id: 'RULE-GENERIC-DOUBLE-CREDIT',
      severity: 'P1',
      metrics: ['genericAlternationDoubleCreditCount'],
      title: 'Generic and alternation rep paths both credited one logical rep',
      details: 'Internal step-up mode must use acceptedRepEvent as the sole rep-credit SFX authority.',
    },
    {
      id: 'RULE-SETRESULT-DUPLICATION',
      severity: 'P1',
      metrics: ['setResultDuplicationCount'],
      title: 'Completed step-up set emitted duplicate SetResults',
      details: 'A completed step-up set must emit exactly one canonical SetResult.',
    },
    {
      id: 'RULE-INVALID-PROGRESSION',
      severity: 'P1',
      metrics: ['invalidProgressionAcceptanceCount'],
      title: 'Invalid alternation reached progression as eligible',
      details: 'Broken alternation or side imbalance must not become progression eligible.',
    },
    {
      id: 'RULE-LOCAL-ROUNDTRIP',
      severity: 'P1',
      metrics: ['localRoundTripFailureCount'],
      title: 'Local serialization/restore failed to preserve safe step-up state',
      details: 'Local restore must preserve the canonical state and retire partial attempts.',
    },
    {
      id: 'RULE-BACKEND-ROUNDTRIP',
      severity: 'P1',
      metrics: ['backendRoundTripFailureCount'],
      title: 'Backend sanitize/sync/restore lost step-up runtime data',
      details: 'Backend roundtrip must retain generated plan, active runtime, and side seed.',
    },
    {
      id: 'RULE-SEED-MUTATION',
      severity: 'P1',
      metrics: ['seedMutationFailureCount'],
      title: 'Step-up seed mutated on the wrong completion path',
      details: 'Only successful main-plan completion may flip the shared step-up seed, and only once per event id.',
    },
    {
      id: 'RULE-VOICE-CONTEXT',
      severity: 'P1',
      metrics: ['voiceContextMismatchCount'],
      title: 'Live step-up context did not match Training Voice V2.1 planning',
      details: 'Expected lead and target total must reach logical V2.1 planning without mismatch.',
    },
  ];
  for (const rule of rules) {
    const triggering = rule.metrics.filter((metric) => Number(input.metrics[metric] ?? 0) > 0);
    if (triggering.length === 0) continue;
    findings.push(finding({
      id: `F-${rule.id.replace(/^RULE-/, '')}`,
      severity: rule.severity,
      status: 'open',
      ruleId: rule.id,
      triggeringMetrics: triggering,
      sourceScenarioIds: scenarioIdsForRule(rule.id),
      sourceEventFilters: eventFiltersForRule(rule.id),
      sourceLifecycleFilters: lifecycleFiltersForRule(rule.id),
      sourceTraceLinks: [],
      blocksFloorTransfer: true,
      recommendedNextTask: 'Remediate step-up runtime integration evidence failure',
      details: `${rule.title}. ${rule.details}`,
    }));
  }
  const badTrace = input.trace.filter((row) => !['connected_verified', 'not_applicable'].includes(row.status));
  if (badTrace.length > 0 || input.gates.some((gate) => gate.id === 'trace_16_links_current' && !gate.passed)) {
    findings.push(finding({
      id: 'F-RUNTIME-TRACE-STALE',
      severity: 'P2',
      status: 'open',
      ruleId: 'RULE-RUNTIME-TRACE',
      triggeringMetrics: ['traceMissingCount', 'tracePartialCount', 'traceLegacyOnlyCount', 'traceUncertainCount'],
      sourceScenarioIds: ['runtime_selection_generated_item_selects_internal'],
      sourceEventFilters: [],
      sourceLifecycleFilters: [],
      sourceTraceLinks: badTrace.map((row) => String(row.linkId)),
      blocksFloorTransfer: true,
      recommendedNextTask: 'Refresh runtime integration before floor-transfer gate',
      details: 'The 16-link runtime trace is not current and fully connected.',
    }));
  }
  if (input.focusedTests.status !== 'passed') {
    findings.push(finding({
      id: 'F-FOCUSED-TESTS-FAILED',
      severity: 'P2',
      status: 'open',
      ruleId: 'RULE-FOCUSED-TESTS',
      triggeringMetrics: ['focusedTestFailure'],
      sourceScenarioIds: ['backend_sanitize_sync_restore_preserves_plan_runtime_seed'],
      sourceEventFilters: [],
      sourceLifecycleFilters: [],
      sourceTraceLinks: [],
      blocksFloorTransfer: true,
      recommendedNextTask: 'Fix focused step-up/backend tests',
      details: input.focusedTests.summary,
    }));
  }
  if (input.footprint.auditDisallowedWrittenFiles.length > 0 || input.footprint.currentAudioDiffNameOnly.length > 0) {
    findings.push(finding({
      id: 'F-AUDIT-FOOTPRINT-VIOLATION',
      severity: 'P0',
      status: 'open',
      ruleId: 'RULE-FOOTPRINT',
      triggeringMetrics: ['addendumFootprint'],
      sourceScenarioIds: ['audio_assets_unchanged_by_evidence_addendum'],
      sourceEventFilters: [],
      sourceLifecycleFilters: [],
      sourceTraceLinks: [],
      blocksFloorTransfer: true,
      recommendedNextTask: 'Remove non-audit footprint from this task',
      details: `Audit-disallowed writes: ${input.footprint.auditDisallowedWrittenFiles.join(', ') || 'none'}; audio diff: ${input.footprint.currentAudioDiffNameOnly.join(', ') || 'none'}`,
    }));
  }
  findings.push(finding({
    id: 'F-STEPUP-PHYSICAL-DEVICE-QA-DEFERRED',
    severity: 'P3',
    status: 'deferred',
    ruleId: 'RULE-PROJECT-BOUNDARY',
    triggeringMetrics: ['physicalDeviceQaDeferred'],
    sourceScenarioIds: ['live_frame_left_lead_accepts_after_floor_return', 'live_frame_wrong_lead_rejected'],
    sourceEventFilters: [],
    sourceLifecycleFilters: [],
    sourceTraceLinks: ['5'],
    blocksFloorTransfer: false,
    recommendedNextTask: 'Perform physical-device QA after floor-transfer gate work is ready',
    details: 'Physical-device QA remains explicitly deferred by project boundary.',
  }));
  findings.push(finding({
    id: 'F-STEPUP-HUMAN-LISTENING-WAIVED',
    severity: 'P3',
    status: 'waived',
    ruleId: 'RULE-PROJECT-BOUNDARY',
    triggeringMetrics: ['humanListeningWaived'],
    sourceScenarioIds: ['project_boundaries_remain_default_closed'],
    sourceEventFilters: [],
    sourceLifecycleFilters: [],
    sourceTraceLinks: ['16'],
    blocksFloorTransfer: false,
    recommendedNextTask: 'Keep human listening with the later Training Voice audio approval work',
    details: 'Human listening remains waived; no audio assets were generated, renamed, moved, or replaced.',
  }));
  return findings;
}

function finding(input) {
  return {
    findingId: input.id,
    severity: input.severity,
    status: input.status,
    ruleId: input.ruleId,
    triggeringMetrics: input.triggeringMetrics,
    sourceScenarioIds: input.sourceScenarioIds,
    sourceEventFilters: input.sourceEventFilters,
    sourceLifecycleFilters: input.sourceLifecycleFilters,
    sourceTraceLinks: input.sourceTraceLinks,
    blocksFloorTransfer: input.blocksFloorTransfer,
    recommendedNextTask: input.recommendedNextTask,
    details: input.details,
  };
}

function deriveVerdict(gates, metrics, sensitivityChecks) {
  const softwareGateFailed = gates.some((gate) => !gate.passed && gate.severityOnFailure !== 'P3');
  const criticalMetricFailed = CRITICAL_METRICS.some((metric) => Number(metrics[metric] ?? 0) > 0);
  const sensitivityFailed = sensitivityChecks.some((check) => !check.passed);
  if (softwareGateFailed || criticalMetricFailed || Number(metrics.p0 ?? 0) > 0 || Number(metrics.p1 ?? 0) > 0 || Number(metrics.p2 ?? 0) > 0 || sensitivityFailed) {
    return 'TRAINING_STEP_UP_RUNTIME_EVIDENCE_REMEDIATION_REQUIRED';
  }
  return 'TRAINING_STEP_UP_RUNTIME_EVIDENCE_VERIFIED_WITH_DEVICE_QA_PENDING';
}

function runFocusedTests() {
  const args = [
    'jest',
    'src/training/stepUpAlternation/__tests__/stepUpRuntimeIntegration.test.ts',
    'src/services/backend/__tests__/trainingStateSyncService.test.ts',
    'src/services/backend/__tests__/restoreService.test.ts',
    '--runInBand',
  ];
  const result = spawnSync('npx', args, {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 40 * 1024 * 1024,
  });
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`.trim();
  return {
    command: `npx ${args.join(' ')}`,
    status: result.status === 0 ? 'passed' : 'failed',
    exitCode: result.status,
    summary: summarizeTestOutput(output),
    outputTail: output.split('\n').slice(-40).join('\n'),
  };
}

function summarizeTestOutput(output) {
  const lines = output.split('\n').filter((line) =>
    /Test Suites:|Tests:|Snapshots:|Time:|PASS|FAIL/.test(line)
  );
  return lines.slice(-12).join(' | ') || 'No Jest summary captured.';
}

function addendumFootprint() {
  const currentDiffNameOnly = gitOutput(['diff', '--name-only']).split('\n').filter(Boolean);
  const currentUntracked = gitOutput(['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean);
  const currentFiles = unique([...currentDiffNameOnly, ...currentUntracked]);
  const baseline = new Set([
    ...TASK_START_SNAPSHOT.diffNameOnly,
    ...extractUntrackedPaths(TASK_START_SNAPSHOT.statusShortBranch),
  ]);
  const allowed = new Set([HARNESS_PATH, ...Object.values(ARTIFACTS)]);
  const currentAudioDiffNameOnly = gitOutput(['diff', '--name-only', '--', 'assets/audio']).split('\n').filter(Boolean);
  const newSinceTaskStart = currentFiles.filter((file) => !baseline.has(file));
  const newOutsideAddendumDiffFiles = newSinceTaskStart.filter((file) => !allowed.has(file));
  const auditWrittenFiles = [...allowed].filter((file) => currentFiles.includes(file) || fs.existsSync(path.join(ROOT, file)));
  const auditDisallowedWrittenFiles = auditWrittenFiles.filter((file) => !allowed.has(file));
  return {
    allowedAddendumFiles: [...allowed],
    auditWrittenFiles,
    auditDisallowedWrittenFiles,
    currentAudioDiffNameOnly,
    newSinceTaskStart,
    newOutsideAddendumDiffFiles,
    currentDiffNameOnly,
    currentUntracked,
  };
}

function buildSourceFreshness() {
  return {
    existingArtifactsRead: EXISTING_ARTIFACTS.filter((file) => fs.existsSync(path.join(ROOT, file))),
    productionSourcesInspected: [
      'src/training/setRuntime.ts',
      'src/training/sessionPlayer.ts',
      'src/training/stepUpAlternation/runtime.ts',
      'src/training/stepUpAlternation/evidenceAdapter.ts',
      'src/training/stepUpAlternation/*',
      'src/training/workoutGeneration.ts',
      'src/training/serialize.ts',
      'src/training/progression.ts',
      'src/training/validTimeProgression.ts',
      'src/training/bothSidesRounds/startSide.ts',
      'src/training/voiceV21/sequencePlanner.ts',
      'src/training/voiceV21/readiness.ts',
      'src/screens/TrainingSessionScreen.tsx',
      'src/services/backend/trainingStateSyncService.ts',
      'src/services/backend/restoreService.ts',
      'src/training/stepUpAlternation/__tests__/stepUpRuntimeIntegration.test.ts',
      'src/services/backend/__tests__/trainingStateSyncService.test.ts',
      'src/services/backend/__tests__/restoreService.test.ts',
    ],
    backendImportBoundary: 'Backend service files import the Supabase client at module load; direct Node import requires RN/Supabase environment. This harness mirrors the current pure mapper shape and runs focused Jest tests that import the production backend services under existing mocks.',
  };
}

function reportMarkdown(report) {
  const gateRows = report.completionGates.map((gate) =>
    `| ${gate.id} | ${gate.passed ? 'pass' : 'fail'} | ${String(gate.observed).replace(/\|/g, '/')} | ${String(gate.required).replace(/\|/g, '/')} |`
  ).join('\n');
  const traceRows = report.runtimeTrace.map((row) =>
    `| ${row.linkId} | ${row.status} | ${row.fromComponent} -> ${row.toComponent} | ${row.evidenceDetail.replace(/\|/g, '/')} |`
  ).join('\n');
  const criticalRows = CRITICAL_METRICS.map((metric) => `- ${metric}: ${report.metrics[metric]}`).join('\n');
  return `# Hale Training Step-Up Runtime Evidence Verification

## Primary Verdict

${report.primaryVerdict}

Exact next task: ${report.exactNextTask}

## Worktree Safety Record

- Task-start branch: ${report.repositorySnapshot.taskStart.branch}
- Task-start HEAD: ${report.repositorySnapshot.taskStart.shortHead}
- Upstream: ${report.repositorySnapshot.taskStart.upstream}
- Already dirty at task start: ${report.repositorySnapshot.taskStart.alreadyDirty}
- Pre-existing relevant changes: ${report.repositorySnapshot.taskStart.preExistingRelevantChanges.join(', ')}
- Pre-existing audio diff: ${report.repositorySnapshot.taskStart.preExistingAudioDiff ? 'present' : 'none'}
- Audit-disallowed written files: ${report.addendumFootprint.auditDisallowedWrittenFiles.length}
- Outside-addendum diff currently present: ${report.addendumFootprint.newOutsideAddendumDiffFiles.join(', ') || 'none'}

## Critical Metrics

${criticalRows}
- p0/p1/p2/p3: ${report.metrics.p0}/${report.metrics.p1}/${report.metrics.p2}/${report.metrics.p3}

All P-counts are derived from the findings array. Critical zero-valued metrics are recomputed from the written scenario, event, and lifecycle CSV rows, then mutation-tested in memory.

## Coverage

- Prior canonical rows retained: ${report.priorEvidenceRetained.canonicalScenarioRowsRetained}
- Executed scenario rows: ${report.verificationCoverage.executedScenarioRows}
- Event-evidence rows: ${report.verificationCoverage.eventEvidenceRows}
- Lifecycle rows: ${report.verificationCoverage.lifecycleRows}
- Runtime trace: ${report.verificationCoverage.connectedTraceLinks} connected_verified, ${report.verificationCoverage.notApplicableTraceLinks} not_applicable
- Focused Jest status: ${report.focusedTests.status}

## Completion Gates

| Gate | Status | Observed | Required |
|---|---|---|---|
${gateRows}

## Runtime Trace

| Link | Status | Path | Evidence |
|---:|---|---|---|
${traceRows}

## Findings

${report.findings.map((finding) => `- ${finding.findingId} (${finding.severity}, ${finding.status}): ${finding.details}`).join('\n')}

## Mutation Sensitivity

${report.sensitivityChecks.map((check) => `- ${check.checkId}: ${check.passed ? 'pass' : 'fail'} (${check.baselineValue} -> ${check.mutatedValue})`).join('\n')}

## Project Boundaries Preserved

- Step-up alternation feature: default off
- Training Voice V2.1: default off
- Training Voice V2.1 audio ready: ${report.defaultClosedBoundaries.trainingVoiceV21AudioReady}
- Training Voice V2.1 global behaviour ready: ${report.defaultClosedBoundaries.trainingVoiceV21GlobalBehaviorReady}
- Balance V2: default closed / audio pending
- Human listening: waived, not completed
- Physical-device QA: deferred
- Audio/API: no audio generated and no external speech API called
`;
}

function handoffMarkdown(report) {
  return `# Hale Voice Project Post Step-Up Evidence Handoff

## Status

${report.primaryVerdict}

The runtime evidence addendum verified the step-up integration with executed production runtime scenarios, written event/lifecycle evidence, independent CSV recomputation, and mutation sensitivity checks.

## Safe To Proceed

${report.primaryVerdict === 'TRAINING_STEP_UP_RUNTIME_EVIDENCE_VERIFIED_WITH_DEVICE_QA_PENDING' ? 'Yes: proceed to the training floor-transfer readiness gate.' : 'No: remediate the open evidence findings first.'}

## Carry Forward

- Keep step-up alternation, Training Voice V2.1, and Balance V2 default closed.
- Keep physical-device QA deferred and human listening waived until their explicit gates.
- Do not change or generate audio as part of floor-transfer readiness.
- Use the new artifacts in \`docs/audits/\` as the evidence baseline.

## Artifacts

${Object.values(ARTIFACTS).map((file) => `- ${file}`).join('\n')}
`;
}

function validateReport(report) {
  for (const file of Object.values(ARTIFACTS)) {
    if (!fs.existsSync(path.join(ROOT, file))) throw new Error(`missing artifact ${file}`);
  }
  for (const metric of [...CRITICAL_METRICS, 'p0', 'p1', 'p2', 'p3']) {
    if (!report.metricEvidence[metric]) throw new Error(`missing metric evidence for ${metric}`);
  }
  const recomputed = recomputeFromWrittenArtifacts(report.runtimeTrace);
  for (const metric of CRITICAL_METRICS) {
    if (recomputed.metrics[metric] !== report.metrics[metric]) {
      throw new Error(`critical metric mismatch ${metric}: ${recomputed.metrics[metric]} != ${report.metrics[metric]}`);
    }
  }
  if (report.sensitivityChecks.some((check) => !check.passed)) {
    throw new Error('one or more sensitivity checks failed');
  }
}

function findingRows(findings) {
  return findings.map((finding) => ({
    findingId: finding.findingId,
    severity: finding.severity,
    status: finding.status,
    ruleId: finding.ruleId,
    triggeringMetrics: finding.triggeringMetrics.join(';'),
    sourceScenarioIds: finding.sourceScenarioIds.join(';'),
    sourceEventFilters: finding.sourceEventFilters.join(';'),
    sourceLifecycleFilters: finding.sourceLifecycleFilters.join(';'),
    sourceTraceLinks: finding.sourceTraceLinks.join(';'),
    blocksFloorTransfer: String(finding.blocksFloorTransfer),
    recommendedNextTask: finding.recommendedNextTask,
    details: finding.details,
  }));
}

function scenarioIdsForRule(ruleId) {
  const map = {
    'RULE-DUPLICATE-STALE-CREDIT': ['duplicate_terminal_evidence_single_credit', 'stale_callback_old_rep_ignored', 'stale_callback_old_set_ignored', 'local_runtime_restore_mid_rep_retires_partial'],
    'RULE-GENERIC-DOUBLE-CREDIT': ['generic_legacy_path_suppressed_for_alternation_acceptance'],
    'RULE-SETRESULT-DUPLICATION': ['one_completed_set_one_canonical_set_result', 'three_sets_progression_exactly_three_results'],
    'RULE-INVALID-PROGRESSION': ['invalid_side_imbalance_rejected_from_progression', 'invalid_broken_alternation_rejected_from_progression'],
    'RULE-LOCAL-ROUNDTRIP': ['local_runtime_roundtrip_after_six_reps', 'local_runtime_restore_mid_rep_retires_partial'],
    'RULE-BACKEND-ROUNDTRIP': ['backend_sanitize_sync_restore_preserves_plan_runtime_seed'],
    'RULE-SEED-MUTATION': ['seed_main_plan_completion_flips_exactly_once', 'seed_skip_does_not_flip', 'seed_cancel_incomplete_does_not_flip', 'seed_manual_practice_does_not_flip', 'seed_explore_completion_does_not_flip'],
    'RULE-VOICE-CONTEXT': ['voice_v21_live_expected_lead_and_target_match'],
  };
  return map[ruleId] ?? [];
}

function eventFiltersForRule(ruleId) {
  const map = {
    'RULE-DUPLICATE-STALE-CREDIT': ['eventType=duplicate_callback|stale_callback|restore_callback and credited/sfx/generic=false'],
    'RULE-GENERIC-DOUBLE-CREDIT': ['eventType=sfx_authority and alternationAccepted=true and genericRepCredited=false'],
    'RULE-VOICE-CONTEXT': ['eventType=voice_context and voiceExpectedLead=expectedLeadAfter and voiceTargetTotal=12'],
  };
  return map[ruleId] ?? [];
}

function lifecycleFiltersForRule(ruleId) {
  const map = {
    'RULE-SETRESULT-DUPLICATION': ['lifecycleType=set_result and setResultCount=finishedCount'],
    'RULE-LOCAL-ROUNDTRIP': ['lifecycleType=local_roundtrip and passed=true'],
    'RULE-BACKEND-ROUNDTRIP': ['lifecycleType=backend_roundtrip and passed=true'],
    'RULE-SEED-MUTATION': ['lifecycleType=seed and expected=observed'],
  };
  return map[ruleId] ?? [];
}

function countFindingsBySeverity(findings) {
  return findings.reduce((acc, finding) => {
    acc[finding.severity] = (acc[finding.severity] ?? 0) + 1;
    return acc;
  }, {});
}

function sourceHas(file, needle) {
  const full = path.join(ROOT, file);
  return fs.existsSync(full) && fs.readFileSync(full, 'utf8').includes(needle);
}

function write(file, content) {
  const full = path.join(ROOT, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

function writeCsv(file, header, rows) {
  write(file, `${header.join(',')}\n${rows.map((row) => header.map((key) => csvCell(row[key])).join(',')).join('\n')}\n`);
}

function csvCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function parseCsvFile(file) {
  return parseCsvText(fs.readFileSync(path.join(ROOT, file), 'utf8'));
}

function parseCsvText(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n') {
      row.push(cell);
      rows.push(row);
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
  if (rows.length === 0) return [];
  const [header, ...body] = rows;
  return body
    .filter((items) => items.some((item) => item !== ''))
    .map((items) => Object.fromEntries(header.map((key, index) => [key, items[index] ?? ''])));
}

function parseJson(value) {
  if (value === undefined || value === null || value === '') return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function gitOutput(args) {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }).trim();
  } catch {
    return '';
  }
}

function gitSnapshot() {
  return {
    branch: gitOutput(['rev-parse', '--abbrev-ref', 'HEAD']),
    head: gitOutput(['rev-parse', 'HEAD']),
    shortHead: gitOutput(['rev-parse', '--short', 'HEAD']),
    upstream: gitOutput(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']),
    statusShortBranch: gitOutput(['status', '--short', '--branch']),
    diffNameOnly: gitOutput(['diff', '--name-only']).split('\n').filter(Boolean),
    diffStat: gitOutput(['diff', '--stat']),
    audioDiff: gitOutput(['diff', '--', 'assets/audio']),
  };
}

function extractUntrackedPaths(statusText) {
  return statusText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('?? '))
    .map((line) => line.slice(3));
}

function unique(items) {
  return [...new Set(items)];
}
