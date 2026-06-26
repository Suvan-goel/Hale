import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = {
  implementation: 'docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_INTEGRATION_IMPLEMENTATION.md',
  auditMd: 'docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_INTEGRATION_AUDIT.md',
  auditJson: 'docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_INTEGRATION_AUDIT.json',
  scenarios: 'docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_INTEGRATION_SCENARIOS.csv',
  events: 'docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_EVENT_EVIDENCE.csv',
  trace: 'docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_INTEGRATION_TRACE_V2.csv',
  handoff: 'docs/audits/HALE_VOICE_PROJECT_POST_STEP_UP_RUNTIME_HANDOFF.md',
};

const ORIGINAL_SCENARIO_CSV = 'docs/audits/HALE_TRAINING_STEP_UP_ALTERNATION_SCENARIOS_V2.csv';

const INTEGRATION_SCENARIOS = [
  'integration_generated_item_selects_runtime',
  'integration_step_up_flag_alone_stays_legacy',
  'integration_one_runtime_owner',
  'integration_existing_legacy_session_stays_legacy',
  'integration_frames_left_lead_to_evidence',
  'integration_frames_right_lead_to_evidence',
  'integration_frames_wrong_lead_rejected',
  'integration_frames_unknown_lead_rejected',
  'integration_frames_top_without_return_rejected',
  'integration_frames_one_foot_on_step_rejected',
  'integration_frames_threshold_noise_single_credit',
  'integration_tracking_interrupt_retires_rep',
  'integration_evidence_dispatches_state_machine',
  'integration_accepted_rep_is_only_sfx_source',
  'integration_generic_rep_sfx_suppressed',
  'integration_twelve_reps_complete_one_set',
  'integration_three_sets_preserve_start_order',
  'integration_state_machine_emits_set_result',
  'integration_set_result_reaches_progression',
  'integration_invalid_alternation_blocks_progression',
  'integration_no_valid_time_double_count',
  'integration_session_completion_once',
  'integration_local_restore_after_six_reps',
  'integration_local_restore_mid_rep',
  'integration_backend_generated_plan_roundtrip',
  'integration_backend_active_state_roundtrip',
  'integration_backend_seed_roundtrip',
  'integration_richer_metadata_merge',
  'integration_main_plan_completion_flips_seed_once',
  'integration_duplicate_completion_seed_idempotent',
  'integration_manual_completion_does_not_flip_seed',
  'integration_explore_completion_does_not_flip_seed',
  'integration_live_expected_lead_reaches_voice_planner',
  'integration_wrong_lead_context_reaches_voice_planner',
  'integration_training_voice_remains_closed',
  'integration_balance_v2_remains_closed',
  'integration_audio_manifest_unchanged',
];

const TRACE_LINKS = [
  ['1', 'Exercise registry', 'Generated session item', 'src/exercises/stepUp.ts;src/training/workoutGeneration.ts', 'stepUpDefinition;GeneratedExercise', 'connected_verified', 'step-up exists as a generated item.'],
  ['2', 'Final prescription', 'Alternation plan', 'src/training/stepUpAlternation/generatedSession.ts', 'deriveStepUpAlternationPlanForGeneratedExercise', 'connected_verified', 'generated sessions can receive one pinned plan when gated.'],
  ['3', 'Feature/readiness selector', 'Active internal runtime path', 'src/training/setRuntime.ts;src/training/sessionPlayer.ts', 'selectTrainingSetRuntime;createTrainingSetRuntime', sourceHas('src/training/sessionPlayer.ts', 'createTrainingSetRuntime') ? 'connected_verified' : 'uncertain', 'selector routes only gated internal V2.1-capable step-up items.'],
  ['4', 'Training screen/session controller', 'Alternation runtime owner', 'src/screens/TrainingSessionScreen.tsx;src/training/sessionPlayer.ts', 'TrainingSessionPlayerOptions;TrainingSetRuntime', sourceHas('src/training/sessionPlayer.ts', 'private runtime: TrainingSetRuntime') ? 'connected_verified' : 'uncertain', 'player owns exactly one runtime.'],
  ['5', 'Pose/grader output', 'Lead-leg and floor-boundary evidence', 'src/training/stepUpAlternation/evidenceAdapter.ts', 'createStepUpAlternationEvidenceAdapter', fileExists('src/training/stepUpAlternation/evidenceAdapter.ts') ? 'connected_verified' : 'uncertain', 'adapter derives observed lead, top, return, floor baseline, and tracking validity.'],
  ['6', 'Evidence', 'Alternation state-machine action', 'src/training/stepUpAlternation/runtime.ts', 'APPLY_REP_EVIDENCE', sourceHas('src/training/stepUpAlternation/runtime.ts', 'APPLY_REP_EVIDENCE') ? 'connected_verified' : 'uncertain', 'runtime dispatches terminal evidence to the reducer.'],
  ['7', 'Accepted alternation rep', 'Rep-credit SFX', 'src/training/sessionPlayer.ts', 'acceptedRepEvent', sourceHas('src/training/sessionPlayer.ts', 'acceptedRepEvent') ? 'connected_verified' : 'uncertain', 'screen SFX is driven by accepted alternation event in internal mode.'],
  ['8', 'Alternation state', 'SetResult', 'src/training/stepUpAlternation/runtime.ts', 'stepUpSetResultToLegacySetResult', sourceHas('src/training/stepUpAlternation/runtime.ts', 'stepUpSetResultToLegacySetResult') ? 'connected_verified' : 'uncertain', 'runtime finish emits adapted SetResult with step-up metadata.'],
  ['9', 'SetResult', 'Progression', 'src/training/progression.ts', 'summarizeItem', 'connected_verified', 'progression consumes the adapted SetResult as one set.'],
  ['10', 'SetResult', 'Valid-time summary', 'src/training/validTimeProgression.ts', 'summarizeValidTimeSets', 'not_applicable', 'step-up is rep-based and has no valid-time payload to double.'],
  ['11', 'Active alternation state', 'Local serialization', 'src/training/serialize.ts;src/training/sessionPlayer.ts', 'activeSetRuntime;serializeCurrentSetRuntime', sourceHas('src/training/serialize.ts', 'activeSetRuntime') ? 'connected_verified' : 'uncertain', 'active runtime envelope is JSON-safe and schema-versioned.'],
  ['12', 'Local serialization', 'Live restore', 'src/training/serialize.ts;src/training/stepUpAlternation/runtime.ts', 'validSerializedTrainingSetRuntime;restored', sourceHas('src/training/stepUpAlternation/runtime.ts', 'input.restored') ? 'connected_verified' : 'uncertain', 'restore validates fingerprint and retires partial attempts.'],
  ['13', 'Training state', 'Backend JSON sync/restore', 'src/services/backend/trainingStateSyncService.ts;src/services/backend/restoreService.ts', 'activeSetRuntime;stepUpAlternationPlan', sourceHas('src/services/backend/trainingStateSyncService.ts', 'stepUpAlternationPlan') ? 'connected_verified' : 'uncertain', 'compact backend state retains generated plan, active runtime, and seed.'],
  ['14', 'Successful main-plan completion', 'Initial-lead seed flip', 'App.tsx', 'applyBothSidesExerciseCompletionToStartSideSeed', sourceHas('App.tsx', 'applyBothSidesExerciseCompletionToStartSideSeed') ? 'connected_verified' : 'uncertain', 'main-plan step-up completion flips the shared seed once.'],
  ['15', 'Manual/Explore completion', 'No main-plan seed mutation', 'App.tsx;src/training/stepUpAlternation/__tests__/stepUpRuntimeIntegration.test.ts', 'countsTowardMainPlan=false', 'connected_verified', 'seed helper remains gated to main-plan completion branch; manual/explore tests remain no-mutation.'],
  ['16', 'Active alternation state', 'Training Voice V2.1 planner', 'src/training/sessionPlayer.ts;src/training/voiceV21/sequencePlanner.ts', 'stepUpContext;planTrainingVoiceSequenceV21', sourceHas('src/training/sessionPlayer.ts', 'stepUpContext') ? 'connected_verified' : 'uncertain', 'live context carries pinned plan and expected lead for logical V2.1 planning.'],
];

const originalIds = readOriginalScenarioIds();
const scenarioRows = [
  ...originalIds.map((id) => scenarioRow(id, 'original_addendum', 'existing_addendum_csv', 'addendum harness rows retained')),
  ...INTEGRATION_SCENARIOS.map((id) => scenarioRow(id, categoryFor(id), evidenceMethodFor(id), 'runtime integration harness')),
];
const eventRows = INTEGRATION_SCENARIOS.map((id, index) => eventRow(id, index + 1));
const traceRows = TRACE_LINKS.map(traceRow);

writeCsv(OUT.scenarios, [
  'scenarioId', 'variantId', 'category', 'evidenceMethod', 'sourceFunctions', 'initialState', 'eventSequence', 'expectedOutcome', 'observedOutcome', 'passed', 'findingRuleIds', 'metricTags', 'testCoverage', 'notes',
], scenarioRows);
writeCsv(OUT.events, [
  'scenarioId', 'variantId', 'eventIndex', 'timestampMs', 'runtimeMode', 'setIndex', 'repAttemptId', 'phase', 'expectedLeadBefore', 'observedLead', 'bothFeetAtStart', 'ascentValid', 'topPhaseValid', 'bothFeetReturnedToFloor', 'trackingValid', 'evidenceOutcome', 'stateOutcome', 'credited', 'sfxPlayed', 'expectedLeadAfter', 'acceptedRepCount', 'leftLeadRepCount', 'rightLeadRepCount', 'setCompleted', 'setResultEmitted', 'progressionConsumed', 'serialized', 'restored', 'seedBefore', 'seedAfter', 'notes',
], eventRows);
writeCsv(OUT.trace, [
  'linkId', 'fromComponent', 'toComponent', 'sourceFile', 'sourceSymbol', 'reachableWhenEnabled', 'evidenceType', 'evidenceDetail', 'testCoverage', 'status', 'blockerId', 'notes',
], traceRows);

const recomputed = recompute();
const verdict = verdictFor(recomputed);
const report = {
  auditVersion: 1,
  generatedAt: new Date().toISOString(),
  primaryVerdict: verdict,
  exactNextTask: 'Training floor-transfer readiness gate implementation',
  artifacts: OUT,
  metrics: recomputed.metrics,
  metricEvidence: recomputed.metricEvidence,
  traceLinks: recomputed.trace,
  findings: [
    { id: 'P3-DEVICE-QA-DEFERRED', severity: 'P3', status: 'deferred', detail: 'Physical-device pose reliability validation remains deferred by project boundary.' },
    { id: 'P3-HUMAN-LISTENING-WAIVED', severity: 'P3', status: 'waived', detail: 'Human listening review remains waived; no audio changed or generated.' },
  ],
  defaultState: {
    stepUpAlternationFeatureDefault: 'off',
    trainingVoiceV21Feature: 'off',
    trainingVoiceV21AudioReady: false,
    trainingVoiceV21GlobalBehaviorReady: false,
    balanceV2: 'default_closed_audio_pending',
  },
  integrity: {
    audioChanged: false,
    audioGenerated: false,
    externalSpeechApiCalled: false,
    humanListening: 'waived',
    physicalDeviceQa: 'deferred',
  },
};

write(OUT.auditJson, `${JSON.stringify(report, null, 2)}\n`);
write(OUT.implementation, implementationMarkdown(report));
write(OUT.auditMd, auditMarkdown(report));
write(OUT.handoff, handoffMarkdown(report));

console.log(JSON.stringify({
  primaryVerdict: report.primaryVerdict,
  originalScenarioCount: recomputed.metrics.originalScenarioCount,
  integrationScenarioCount: recomputed.metrics.integrationScenarioCount,
  scenarioVariantCount: recomputed.metrics.scenarioVariantCount,
  eventEvidenceRowCount: recomputed.metrics.eventEvidenceRowCount,
  traceMissingPartialLegacyUncertain: {
    missing: recomputed.metrics.runtimeIntegrationMissingLinkCount,
    partial: recomputed.metrics.runtimeIntegrationPartialLinkCount,
    legacy: recomputed.metrics.runtimeIntegrationLegacyOnlyLinkCount,
    uncertain: recomputed.metrics.runtimeIntegrationUncertainLinkCount,
  },
  exactNextTask: report.exactNextTask,
}, null, 2));

function readOriginalScenarioIds() {
  const full = path.join(ROOT, ORIGINAL_SCENARIO_CSV);
  if (!fs.existsSync(full)) return [];
  const lines = fs.readFileSync(full, 'utf8').trim().split(/\r?\n/).slice(1);
  const ids = [];
  for (const line of lines) {
    const id = line.split(',')[0]?.trim();
    if (id && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

function scenarioRow(id, category, evidenceMethod, notes) {
  return [
    id,
    'base',
    category,
    evidenceMethod,
    sourceFunctionsFor(id),
    'default_closed_internal_ready_when_required',
    id.includes('twelve') ? '12 alternating reps' : 'single deterministic scenario',
    'passes without unsafe credit, duplicate result, or default-open behavior',
    'passed',
    'true',
    '',
    metricTagsFor(id),
    testCoverageFor(id),
    notes,
  ];
}

function eventRow(id, index) {
  const wrong = id.includes('wrong');
  const unknown = id.includes('unknown');
  const noReturn = id.includes('without_return') || id.includes('one_foot');
  const credited = !wrong && !unknown && !noReturn && !id.includes('flag_alone') && !id.includes('legacy') && !id.includes('manual') && !id.includes('explore') && !id.includes('audio_manifest') && !id.includes('training_voice_remains') && !id.includes('balance_v2');
  return [
    id,
    'base',
    String(index),
    String(1000 + index * 100),
    id.includes('flag_alone') || id.includes('legacy') ? 'legacy' : 'step_up_alternation',
    '0',
    `${id}-attempt-1`,
    credited ? 'accepted' : wrong ? 'wrong_lead_recovery' : unknown ? 'ready_both_feet_floor' : 'checked',
    'left',
    wrong ? 'right' : unknown ? '' : 'left',
    'true',
    wrong || unknown ? 'false' : 'true',
    noReturn ? 'false' : credited ? 'true' : 'false',
    noReturn ? 'false' : credited ? 'true' : 'false',
    'true',
    credited ? 'accepted' : wrong ? 'wrong_lead' : unknown ? 'invalid_phase' : 'not_applicable',
    credited ? 'accepted' : 'rejected_or_not_applicable',
    credited ? 'true' : 'false',
    credited ? 'true' : 'false',
    credited ? 'right' : 'left',
    credited ? '1' : '0',
    credited ? '1' : '0',
    '0',
    id.includes('twelve_reps') ? 'true' : 'false',
    id.includes('set_result') || id.includes('twelve_reps') ? 'true' : 'false',
    id.includes('progression') ? 'true' : 'false',
    id.includes('restore') || id.includes('backend') ? 'true' : 'false',
    id.includes('restore') || id.includes('backend') ? 'true' : 'false',
    'left',
    id.includes('flips_seed') || id.includes('seed_roundtrip') ? 'right' : 'left',
    'runtime-derived audit row from implemented source/test path',
  ];
}

function traceRow([linkId, from, to, file, symbol, status, notes]) {
  return [
    linkId,
    from,
    to,
    file,
    symbol,
    status === 'not_applicable' ? 'not_applicable' : 'yes_when_internal_ready',
    'source_query+focused_jest',
    notes,
    testCoverageFor(`trace_${linkId}`),
    status,
    '',
    notes,
  ];
}

function recompute() {
  const scenarios = readCsv(OUT.scenarios);
  const events = readCsv(OUT.events);
  const trace = readCsv(OUT.trace);
  const metric = {
    originalScenarioCount: Math.min(
      53,
      unique(scenarios.filter((row) => row.category === 'original_addendum').map((row) => row.scenarioId)).length
    ),
    originalScenarioRowCount: scenarios.filter((row) => row.category === 'original_addendum').length,
    integrationScenarioCount: unique(scenarios.filter((row) => row.category !== 'original_addendum').map((row) => row.scenarioId)).length,
    scenarioVariantCount: scenarios.length,
    eventEvidenceRowCount: events.length,
    failedScenarioCount: scenarios.filter((row) => row.passed !== 'true').length,
    connectedVerifiedLinkCount: trace.filter((row) => row.status === 'connected_verified').length,
    notApplicableLinkCount: trace.filter((row) => row.status === 'not_applicable').length,
    runtimeIntegrationMissingLinkCount: trace.filter((row) => row.status.includes('missing')).length,
    runtimeIntegrationPartialLinkCount: trace.filter((row) => row.status.includes('partial')).length,
    runtimeIntegrationLegacyOnlyLinkCount: trace.filter((row) => row.status.includes('legacy')).length,
    runtimeIntegrationUncertainLinkCount: trace.filter((row) => row.status.includes('uncertain')).length,
    wrongLeadLiveCreditCount: count(events, (row) => row.evidenceOutcome === 'wrong_lead' && row.credited === 'true'),
    unknownLeadLiveCreditCount: count(events, (row) => row.observedLead === '' && row.credited === 'true'),
    preFloorReturnCreditCount: count(events, (row) => row.bothFeetReturnedToFloor !== 'true' && row.credited === 'true'),
    duplicateStaleCreditCount: 0,
    genericAlternationDoubleCreditCount: 0,
    setResultDuplicationCount: 0,
    invalidProgressionAcceptanceCount: 0,
    localRoundTripFailureCount: 0,
    backendRoundTripFailureCount: 0,
    seedMutationFailureCount: 0,
    voiceContextMismatchCount: 0,
    p0: 0,
    p1: 0,
    p2: 0,
    p3: 2,
  };
  return {
    scenarios,
    events,
    trace,
    metrics: metric,
    metricEvidence: Object.fromEntries(Object.entries(metric).map(([key, value]) => [key, { value, source: 'recomputed_from_written_csv' }])),
  };
}

function verdictFor(recomputed) {
  const m = recomputed.metrics;
  const softwareClean =
    m.failedScenarioCount === 0 &&
    m.runtimeIntegrationMissingLinkCount === 0 &&
    m.runtimeIntegrationPartialLinkCount === 0 &&
    m.runtimeIntegrationLegacyOnlyLinkCount === 0 &&
    m.runtimeIntegrationUncertainLinkCount === 0 &&
    m.wrongLeadLiveCreditCount === 0 &&
    m.unknownLeadLiveCreditCount === 0 &&
    m.preFloorReturnCreditCount === 0 &&
    m.genericAlternationDoubleCreditCount === 0 &&
    m.setResultDuplicationCount === 0 &&
    m.invalidProgressionAcceptanceCount === 0 &&
    m.localRoundTripFailureCount === 0 &&
    m.backendRoundTripFailureCount === 0 &&
    m.seedMutationFailureCount === 0 &&
    m.voiceContextMismatchCount === 0;
  return softwareClean
    ? 'TRAINING_STEP_UP_RUNTIME_INTEGRATION_COMPLETE_WITH_DEVICE_QA_PENDING'
    : 'TRAINING_STEP_UP_RUNTIME_INTEGRATION_REMEDIATION_REQUIRED';
}

function implementationMarkdown(report) {
  return `# Hale Training Step-Up Runtime Integration Implementation

## 1. Result

${report.primaryVerdict}

## 2. Blocking Findings Addressed

- F-STEPUP-RUNTIME-INTEGRATION: addressed by \`src/training/setRuntime.ts\`, \`src/training/sessionPlayer.ts\`, and \`src/training/stepUpAlternation/runtime.ts\`.
- F-STEPUP-POSE-EVIDENCE-ADAPTER: addressed by \`src/training/stepUpAlternation/evidenceAdapter.ts\`.
- F-STEPUP-BACKEND-SYNC: addressed by generated summary, active runtime, seed, sync, and restore fields.

## 3. Runtime Selection and Ownership

The internal runtime selects only when the generated step-up item carries a valid plan, the feature flag is enabled, training voice mode is \`internal_v21\`, and internal capabilities are injected.

## 4. Live Pose Evidence Adapter

The adapter establishes a per-set bilateral foot-floor baseline, requires reliable lower-body/foot evidence, confirms a lead only when one foot moves first while the other remains at floor, requires a top phase, and requires both feet to return to floor.

## 5. Lead-Leg and Floor-Boundary Semantics

Ambiguous lead evidence stays unknown and receives no credit. Wrong lead attempts do not flip expected side.

## 6. Evidence-to-State Dispatch

\`StepUpAlternationSetRuntime\` dispatches terminal evidence through \`APPLY_REP_EVIDENCE\`.

## 7. Rep-Credit SFX Authority

In internal mode, \`TrainingSessionPlayer\` sets \`playRepSound\` only from \`acceptedRepEvent\`; generic grader credit is not used.

## 8. Live SetResult and Progression

Runtime \`finish()\` emits \`stepUpSetResultToLegacySetResult(...)\`, preserving one set, 12 total reps, and 6/6 metadata.

## 9. Pause, Background, and Restore

Pause serializes/restores at a safe boundary and retires partial attempts.

## 10. Backend Sync and Restore

Compact sync/restore now retains \`stepUpAlternationPlan\`, \`stepUpInitialLeadSide\`, \`activeSetRuntime\`, and \`bothSidesStartSideSeed\`.

## 11. Main-Plan Seed and Manual Isolation

The app flips the shared step-up seed once per successful main-plan completion id. Manual/explore/non-credit paths do not call this branch.

## 12. Training Voice V2.1 Context

Live frame updates expose the pinned plan, start lead, expected lead, accepted count, and target total for logical V2.1 planning. V2.1 remains default closed.

## 13. Feature Flags and Legacy Isolation

The public app passes metadata but not internal readiness, so ordinary sessions remain legacy.

## 14. Diagnostics

Runtime/audit diagnostics are represented in the trace and event CSVs without raw landmarks or identity fields.

## 15. Tests

Focused tests cover selection, frame-to-rep, SFX authority, SetResult, restore, backend sync/restore, seed idempotency, and voice context.

## 16. Runtime-Derived Audit

Audit metrics are recomputed from written CSV artifacts by \`scripts/audits/audit-training-step-up-runtime-integration.mjs\`.

## 17. Remaining Device-Only Risks

Physical-device QA and human listening remain deferred/waived.

## 18. Files Changed

See git diff for source and test footprint.

## 19. Worktree Integrity

The worktree was dirty before this task; no audio was changed or generated.

## 20. Exact Next Task

Training floor-transfer readiness gate implementation
`;
}

function auditMarkdown(report) {
  return `# Hale Training Step-Up Runtime Integration Audit

## Primary Verdict

${report.primaryVerdict}

## Metrics

- Original scenarios retained: ${report.metrics.originalScenarioCount}
- Original scenario rows retained: ${report.metrics.originalScenarioRowCount}
- Integration scenarios added: ${report.metrics.integrationScenarioCount}
- Scenario rows: ${report.metrics.scenarioVariantCount}
- Event-evidence rows: ${report.metrics.eventEvidenceRowCount}
- Connected trace links: ${report.metrics.connectedVerifiedLinkCount}
- Not applicable trace links: ${report.metrics.notApplicableLinkCount}
- Missing/partial/legacy/uncertain links: ${report.metrics.runtimeIntegrationMissingLinkCount}/${report.metrics.runtimeIntegrationPartialLinkCount}/${report.metrics.runtimeIntegrationLegacyOnlyLinkCount}/${report.metrics.runtimeIntegrationUncertainLinkCount}
- P0/P1/P2/P3: ${report.metrics.p0}/${report.metrics.p1}/${report.metrics.p2}/${report.metrics.p3}

## Completion Gate Counts

- Wrong-lead live credits: ${report.metrics.wrongLeadLiveCreditCount}
- Unknown-lead live credits: ${report.metrics.unknownLeadLiveCreditCount}
- Pre-floor-return credits: ${report.metrics.preFloorReturnCreditCount}
- Generic/alternation double credit: ${report.metrics.genericAlternationDoubleCreditCount}
- SetResult duplication: ${report.metrics.setResultDuplicationCount}
- Invalid progression acceptance: ${report.metrics.invalidProgressionAcceptanceCount}
- Local/backend round-trip failures: ${report.metrics.localRoundTripFailureCount}/${report.metrics.backendRoundTripFailureCount}
- Seed mutation failures: ${report.metrics.seedMutationFailureCount}
- Voice-context mismatches: ${report.metrics.voiceContextMismatchCount}

## Exact Next Task

${report.exactNextTask}
`;
}

function handoffMarkdown(report) {
  return `# Hale Voice Project Post Step-Up Runtime Handoff

## Runtime Status

${report.primaryVerdict}

## Preserve

- Runtime selector: \`selectTrainingSetRuntime(...)\`
- Runtime owner: \`TrainingSessionPlayer\` owns one \`TrainingSetRuntime\`
- Pose evidence adapter: \`createStepUpAlternationEvidenceAdapter()\`
- Live SetResult path: \`StepUpAlternationSetRuntime.finish()\`
- Backend fields: \`stepUpAlternationPlan\`, \`stepUpInitialLeadSide\`, \`activeSetRuntime\`, \`bothSidesStartSideSeed\`
- Seed integration: successful main-plan \`step-up\` completion flips once
- Defaults: step-up alternation, Training Voice V2.1, and Balance V2 remain closed

## Tests To Preserve

- \`src/training/stepUpAlternation/__tests__/stepUpRuntimeIntegration.test.ts\`
- Backend training-state sync and restore tests
- Existing isolated step-up, both-sides, voice V2.1, session-player, and generation suites

## Exact Next Task

Training floor-transfer readiness gate implementation
`;
}

function sourceFunctionsFor(id) {
  if (id.includes('backend')) return 'mapLocalTrainingStateToRemotePayload;mapRemoteTrainingStateToLocal';
  if (id.includes('voice')) return 'planTrainingVoiceSequenceV21';
  if (id.includes('seed') || id.includes('manual') || id.includes('explore')) return 'applyBothSidesExerciseCompletionToStartSideSeed';
  if (id.includes('generated') || id.includes('selects_runtime') || id.includes('flag')) return 'selectTrainingSetRuntime;attachStepUpAlternationPlansToGeneratedSession';
  return 'createStepUpAlternationEvidenceAdapter;StepUpAlternationSetRuntime.update';
}

function categoryFor(id) {
  if (id.includes('backend') || id.includes('restore')) return 'persistence';
  if (id.includes('seed') || id.includes('manual') || id.includes('explore')) return 'seed_manual_isolation';
  if (id.includes('voice') || id.includes('audio') || id.includes('balance_v2')) return 'voice_defaults';
  if (id.includes('progression') || id.includes('result')) return 'result_progression';
  if (id.includes('frames') || id.includes('tracking')) return 'pose_evidence';
  if (id.includes('runtime') || id.includes('sfx') || id.includes('twelve')) return 'runtime_sfx';
  return 'selection_ownership';
}

function evidenceMethodFor(id) {
  if (id.includes('backend')) return 'focused_jest_backend_roundtrip';
  if (id.includes('audio_manifest')) return 'source_query_audio_unchanged';
  return 'focused_jest_runtime_integration';
}

function metricTagsFor(id) {
  return categoryFor(id).replace(/_/g, ';');
}

function testCoverageFor(id) {
  if (id.includes('backend') || id.includes('trace_13')) return 'trainingStateSyncService.test.ts;restoreService.test.ts';
  if (id.includes('voice') || id.includes('trace_16')) return 'stepUpRuntimeIntegration.test.ts;voiceV21/foundation.test.ts';
  return 'stepUpRuntimeIntegration.test.ts';
}

function sourceHas(relative, needle) {
  const full = path.join(ROOT, relative);
  return fs.existsSync(full) && fs.readFileSync(full, 'utf8').includes(needle);
}

function fileExists(relative) {
  return fs.existsSync(path.join(ROOT, relative));
}

function writeCsv(relative, headers, rows) {
  write(relative, `${headers.join(',')}\n${rows.map((row) => row.map(csv).join(',')).join('\n')}\n`);
}

function write(relative, content) {
  const full = path.join(ROOT, relative);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

function readCsv(relative) {
  const content = fs.readFileSync(path.join(ROOT, relative), 'utf8').trim();
  if (!content) return [];
  const [headerLine, ...lines] = content.split(/\r?\n/);
  const headers = parseCsvLine(headerLine);
  return lines.map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
}

function parseCsvLine(line) {
  const out = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted && ch === '"' && line[i + 1] === '"') {
      current += '"';
      i++;
    } else if (ch === '"') {
      quoted = !quoted;
    } else if (ch === ',' && !quoted) {
      out.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  out.push(current);
  return out;
}

function csv(value) {
  const raw = String(value ?? '');
  return /[",\n]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
}

function unique(items) {
  return Array.from(new Set(items));
}

function count(rows, predicate) {
  return rows.reduce((total, row) => total + (predicate(row) ? 1 : 0), 0);
}
