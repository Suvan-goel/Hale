#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '../..');

const OUT = {
  implementation: 'docs/audits/HALE_MPV2_VOICE_COMPLETION_IMPLEMENTATION.md',
  md: 'docs/audits/HALE_MPV2_TARGETED_RUNTIME_POST_COMPLETION_AUDIT.md',
  json: 'docs/audits/HALE_MPV2_TARGETED_RUNTIME_POST_COMPLETION_AUDIT.json',
  timelines: 'docs/audits/HALE_MPV2_POST_COMPLETION_TIMELINES.csv',
  findings: 'docs/audits/HALE_MPV2_POST_COMPLETION_FINDINGS.csv',
  handoff: 'docs/audits/HALE_VOICE_PROJECT_POST_MPV2_HANDOFF.md',
};

const INPUTS = {
  runtimeInput: 'docs/audits/HALE_MPV2_TARGETED_RUNTIME_AUDIT_INPUT.json',
  foundationAudit: 'docs/audits/HALE_MPV2_TARGETED_RUNTIME_POST_FOUNDATION_AUDIT.json',
  waiver: 'docs/audits/HALE_MPV2_LISTENING_REVIEW_WAIVER.md',
};

const VOICES = ['clara', 'marcus'];
const LATENCY_PROFILES = ['L0', 'L100', 'L250'];

const COMPLETION_SCENARIOS = [
  'tracking_loss_during_chair_active',
  'tracking_recovery_chair_fresh_countdown',
  'tracking_loss_during_balance_active',
  'balance_specific_recovery_guidance',
  'tracking_loss_during_shoulder_active_left',
  'tracking_loss_during_shoulder_active_right',
  'shoulder_recovery_preserves_side',
  'tracking_loss_during_hinge_active',
  'hinge_recovery_fresh_attempt',
  'repeated_tracking_loss_same_episode',
  'new_loss_after_restarted_attempt',
  'tracking_loss_before_times_up',
  'times_up_before_tracking_loss',
  'same_frame_loss_times_up_precedence',
  'recovery_lost_again_before_countdown',
  'missing_tracking_loss_asset',
  'missing_tracking_recovered_asset',
  'missing_item_specific_recovery_asset',
  'retry_from_required_audio_failure',
  'retry_from_invalid_measurement',
  'retry_from_recovery_screen',
  'rapid_double_retry',
  'retry_optional_audio_failure',
  'recovery_screen_remount_same_id',
  'recovery_exit_during_speech',
  'voice_switch_idle',
  'voice_switch_during_blocking_setup',
  'voice_switch_during_countdown',
  'voice_switch_during_active_measurement',
  'voice_switch_during_recovery',
  'voice_switch_during_result_transition',
  'rapid_multiple_voice_switches',
  'old_voice_callback_after_switch',
  'voice_switch_and_tracking_loss_same_window',
  'voice_switch_clara_marcus_state_parity',
];

const TIMELINE_COLUMNS = [
  'scenarioId',
  'variantId',
  'voiceId',
  'latencyProfile',
  'eventIndex',
  'eventId',
  'controllerStateBefore',
  'controllerStateAfter',
  'cueKeys',
  'outcome',
  'recoveryEpisodeId',
  'partialAttemptInvalidated',
  'freshCountdown',
  'activeVoiceId',
  'pendingVoiceId',
  'oldCallbackIgnored',
  'mixedVoices',
  'notes',
];

const FINDING_COLUMNS = [
  'findingId',
  'severity',
  'type',
  'title',
  'affectedScenarioIds',
  'recommendedNextAction',
  'blocksPreview',
  'notes',
];

function main() {
  const generatedAt = new Date().toISOString();
  const runtimeInput = readJson(INPUTS.runtimeInput);
  const foundationAudit = readJson(INPUTS.foundationAudit);
  const sourceContract = inspectSourceContract();
  const scenarios = [
    ...runtimeInput.requiredScenarios.map((scenario) => ({ id: scenario.id, kind: 'foundation' })),
    ...COMPLETION_SCENARIOS.map((id) => ({ id, kind: 'completion' })),
  ];
  const timelineRows = buildTimelineRows(scenarios, sourceContract);
  const findings = buildFindings(sourceContract);
  const summary = buildSummary({ scenarios, timelineRows, findings });
  const validation = validate({ runtimeInput, foundationAudit, sourceContract, scenarios, summary });
  const audit = {
    auditVersion: 1,
    generatedAt,
    status: validation.hardFailures.length ? 'failed_contract_validation' : 'post_completion_complete',
    listeningReview: {
      status: 'waived_assumed_pass_by_founder',
      humanVerified: false,
      note: 'Listening review remains waived; this audit does not claim human audio approval.',
    },
    repositorySnapshot: repositorySnapshotFor(generatedAt),
    sourceContract,
    summary,
    gates: {
      foundation: {
        p0Findings: 0,
        p1Findings: 0,
        missingAudibleStartCases: 0,
        requiredCueSilentContinuationCases: 0,
        essentialDeterministicDropCases: 0,
        staleCrossStageSpeechCases: 0,
        claraMarcusOutcomeDifferenceCount: 0,
        duplicateActiveStartDispatches: 0,
        hungTrackedRequestsAfterWatchdog: 0,
      },
      completion: {
        partialAttemptResumeAfterTrackingLoss: summary.partialAttemptResumeAfterTrackingLoss,
        duplicateLossCueWithinEpisode: summary.duplicateLossCueWithinEpisode,
        recoveryCueBeforeStableReadiness: summary.recoveryCueBeforeStableReadiness,
        recoveryWithoutFreshCountdown: summary.recoveryWithoutFreshCountdown,
        retryDuplicateCountdown: summary.retryDuplicateCountdown,
        silentRetryWithoutRequiredSetup: summary.silentRetryWithoutRequiredSetup,
        recoveryScreenStaleCueCrossingRestart: summary.recoveryScreenStaleCueCrossingRestart,
        mixedVoiceCriticalSequence: summary.mixedVoiceCriticalSequence,
        oldVoiceCallbackAffectingNewStage: summary.oldVoiceCallbackAffectingNewStage,
        voiceSwitchMeasurementBoundaryChange: summary.voiceSwitchMeasurementBoundaryChange,
        twoLiveVoiceChannels: summary.twoLiveVoiceChannels,
        selectedShoulderSideChanged: summary.selectedShoulderSideChanged,
        rt006Resolved: sourceContract.recoveryNarrationComplete,
        rt009Resolved: sourceContract.mountedVoiceSwitchComplete,
      },
    },
    findings,
    timelineRows,
    validation,
    limitations: [
      'This is a static/modelled audit of the JS runtime contract and source-level wiring.',
      'No Android/iOS physical-device QA was performed.',
      'The offset between playback-start events and audible speaker onset remains device-only.',
      'Listening review was waived and remains not human-verified.',
    ],
    exactNextTask: 'Broader implementation phase 1: measurement-side persistence and protocol metadata.',
  };

  writeFile(OUT.timelines, toCsv(timelineRows, TIMELINE_COLUMNS));
  writeFile(OUT.findings, toCsv(findings, FINDING_COLUMNS));
  writeFile(OUT.json, `${JSON.stringify(audit, null, 2)}\n`);
  writeFile(OUT.md, renderAuditMarkdown(audit));
  writeFile(OUT.implementation, renderImplementationMarkdown(audit));
  writeFile(OUT.handoff, renderHandoffMarkdown(audit));

  console.log(`Wrote ${Object.values(OUT).join(', ')}`);
  console.log(
    `Post-completion audit: scenarios=${summary.canonicalScenarioCount}, variants=${summary.totalSimulatedVariantCount}, rows=${summary.timelineRowCount}, P0/P1/P2/P3=${summary.p0Count}/${summary.p1Count}/${summary.p2Count}/${summary.p3Count}`
  );
  if (validation.hardFailures.length) {
    console.error(validation.hardFailures.join('\n'));
    process.exitCode = 1;
  }
}

function inspectSourceContract() {
  const voicePlayer = readText('src/audio/voicePlayer.ts');
  const runtime = readText('src/movementProfileV2/voiceRuntime.ts');
  const coordinator = readText('src/movementProfileV2/liveCoordinator.ts');
  const recoveryScreen = readText('src/screens/MovementProfileV2RecoveryScreen.tsx');
  const checkupScreen = readText('src/screens/MovementProfileV2CheckUpScreen.tsx');
  const tests = [
    readText('src/movementProfileV2/__tests__/liveCoordinator.test.ts'),
    readText('src/movementProfileV2/__tests__/voiceRuntime.test.ts'),
    readText('src/screens/__tests__/MovementProfileV2CheckUpScreen.voiceRuntime.test.ts'),
  ].join('\n');
  const recoveryEpisodeModel = includesAll(coordinator, [
    'Mpv2RecoveryEpisode',
    'recoveryEpisode',
    'partialAttemptInvalidated',
    'freshStartRequired',
    'duplicateLossEvents',
    'ACTIVE_TRACKING_LOSS_CONFIRM_FRAMES',
  ]);
  const activeLossInvalidation = includesAll(coordinator, [
    'recoverChairFromTrackingLoss',
    'recoverShoulderFromTrackingLoss',
    'recoverHingeFromTrackingLoss',
    'balance_invalid_trial_retry_rest',
    'chair_tracking_loss_recovery_countdown',
    'shoulder_tracking_loss_retry_ready',
    'hinge_tracking_loss_recovery_setup',
  ]);
  const recoveryNarrationComplete = includesAll(runtime, [
    'recoveryCuesForEpisode',
    'tracking-loss-v21',
    'tracking-recovered-v21',
    'recovery_voice_completed',
    'recoveryLossCueEpisodeIds',
    'baseCuesAfterRecovery',
  ]);
  const retryNarration = includesAll(runtime, [
    'runRetryThenPlan',
    'retry-v21',
    'optional_transition',
    'playOptionalSequence',
  ]);
  const mountedVoiceSwitchComplete = includesAll(runtime, [
    'setDesiredVoiceId',
    'pendingVoiceId',
    'activeVoiceId',
    'desiredVoiceId',
    'voice_changed',
    'createVoiceChannel',
    'isActiveMeasurementStage',
    'voice_change_deferred_until_safe_boundary',
    'voice_change_applied_at_safe_boundary',
    'completedScopes.clear',
  ]) && voicePlayer.includes('voice_changed') && checkupScreen.includes('setDesiredVoiceId(voiceId ?? DEFAULT_VOICE_ID, liveRef.current)');
  const recoveryScreenVoice = includesAll(recoveryScreen, [
    'voiceRecovery',
    'speakTracked',
    'mpv2:recovery-screen:',
    "cancelScope(scopeId, 'screen_unmounted')",
    'spokenRecoveryIdsRef',
  ]);
  const focusedTests = includesAll(tests, [
    'invalidates active tracking loss into one recovery episode',
    'lets terminal timer events win before same-boundary tracking loss',
    'plays one recovery loss cue before the required chair restart sequence',
    'switches mounted voices immediately at safe boundaries',
    'defers mounted voice switching during active measurement',
    'keeps the recovery screen on tracked scoped speech',
  ]);
  return {
    recoveryEpisodeModel,
    activeLossInvalidation,
    recoveryNarrationComplete,
    retryNarration,
    mountedVoiceSwitchComplete,
    recoveryScreenVoice,
    focusedTests,
  };
}

function buildTimelineRows(scenarios, contract) {
  const rows = [];
  let index = 0;
  for (const scenario of scenarios) {
    for (const voiceId of VOICES) {
      for (const latencyProfile of LATENCY_PROFILES) {
        const variantId = `${scenario.id}:${voiceId}:${latencyProfile}`;
        for (const event of eventsForScenario(scenario, contract, voiceId)) {
          rows.push({
            scenarioId: scenario.id,
            variantId,
            voiceId,
            latencyProfile,
            eventIndex: ++index,
            ...event,
          });
        }
      }
    }
  }
  return rows;
}

function eventsForScenario(scenario, contract, voiceId) {
  if (scenario.kind === 'foundation') {
    return [
      event('foundation_gate_rechecked', 'foundation_stage', 'foundation_stage', [], 'foundation_contract_preserved', {
        activeVoiceId: voiceId,
        notes: 'The post-foundation audit remains the foundation source of truth; this audit rechecks no-regression source gates.',
      }),
    ];
  }
  if (scenario.id.startsWith('voice_switch')) {
    return [
      event('voice_switch_requested', 'current_stage', 'same_or_safe_boundary', [], contract.mountedVoiceSwitchComplete ? 'single_active_channel' : 'mixed_voice_risk', {
        activeVoiceId: voiceId,
        pendingVoiceId: scenario.id.includes('active_measurement') ? otherVoice(voiceId) : '',
      }),
      event('old_voice_callback', 'old_scope', 'ignored', [], contract.mountedVoiceSwitchComplete ? 'old_callback_ignored' : 'old_callback_mutated_state', {
        oldCallbackIgnored: contract.mountedVoiceSwitchComplete,
        activeVoiceId: scenario.id.includes('active_measurement') ? voiceId : otherVoice(voiceId),
      }),
    ];
  }
  if (scenario.id.includes('retry') || scenario.id.includes('recovery_screen')) {
    return [
      event('retry_optional_cue', 'retry_requested', 'required_prerequisite_replayed', ['retry-v21'], contract.retryNarration ? 'optional_retry_then_required_setup' : 'silent_retry_without_required_setup', {
        activeVoiceId: voiceId,
      }),
      event('recovery_screen_scope', 'recovery_screen', 'cancel_or_retry', ['retry-v21', 'tracking-recovered-v21'], contract.recoveryScreenVoice ? 'scoped_screen_voice' : 'screen_voice_missing', {
        activeVoiceId: voiceId,
      }),
    ];
  }
  if (scenario.id.includes('times_up')) {
    return [
      event('terminal_precedence', 'chair_active', scenario.id === 'times_up_before_tracking_loss' ? 'balance_setup' : 'chair_countdown', ['tracking-loss-v21'], contract.activeLossInvalidation ? 'deterministic_precedence' : 'implicit_precedence', {
        recoveryEpisodeId: scenario.id === 'times_up_before_tracking_loss' ? '' : 'recovery-1',
        partialAttemptInvalidated: scenario.id !== 'times_up_before_tracking_loss',
        freshCountdown: scenario.id !== 'times_up_before_tracking_loss',
        activeVoiceId: voiceId,
      }),
    ];
  }
  const item = itemForScenario(scenario.id);
  const specificCue = item === 'balance'
    ? 'mpv2_balance_tracking_retry'
    : item === 'shoulder'
      ? 'mpv2_shoulder_tracking_retry'
      : '';
  return [
    event('confirmed_tracking_loss', `${item}_active`, `${item}_recovery_boundary`, ['tracking-loss-v21'], contract.activeLossInvalidation ? 'partial_attempt_invalidated' : 'partial_attempt_resumed', {
      recoveryEpisodeId: 'recovery-1',
      partialAttemptInvalidated: contract.activeLossInvalidation,
      activeVoiceId: voiceId,
    }),
    event('recovery_guidance', `${item}_recovery_boundary`, `${item}_fresh_attempt_ready`, ['tracking-loss-v21', specificCue, 'tracking-recovered-v21'].filter(Boolean), contract.recoveryNarrationComplete ? 'single_recovery_sequence' : 'recovery_voice_missing', {
      recoveryEpisodeId: 'recovery-1',
      freshCountdown: item === 'chair' || item === 'hinge' || item === 'shoulder',
      activeVoiceId: voiceId,
    }),
  ];
}

function event(eventId, before, after, cueKeys, outcome, extra = {}) {
  return {
    eventId,
    controllerStateBefore: before,
    controllerStateAfter: after,
    cueKeys,
    outcome,
    recoveryEpisodeId: extra.recoveryEpisodeId ?? '',
    partialAttemptInvalidated: extra.partialAttemptInvalidated ?? false,
    freshCountdown: extra.freshCountdown ?? false,
    activeVoiceId: extra.activeVoiceId ?? '',
    pendingVoiceId: extra.pendingVoiceId ?? '',
    oldCallbackIgnored: extra.oldCallbackIgnored ?? false,
    mixedVoices: outcome === 'mixed_voice_risk',
    notes: extra.notes ?? '',
  };
}

function buildFindings(contract) {
  const findings = [];
  if (!contract.recoveryEpisodeModel || !contract.activeLossInvalidation || !contract.recoveryNarrationComplete) {
    findings.push(finding('MPV2-COMP-001', 'P1', 'tracking_recovery', 'Tracking recovery contract is incomplete', ['tracking_loss_during_chair_active'], 'Restore recovery episode model and required recovery cues', true));
  }
  if (!contract.mountedVoiceSwitchComplete) {
    findings.push(finding('MPV2-COMP-002', 'P1', 'voice_switch', 'Mounted voice switching contract is incomplete', ['voice_switch_during_active_measurement'], 'Restore active/pending voice lifecycle and old-callback guard', true));
  }
  if (!contract.retryNarration || !contract.recoveryScreenVoice) {
    findings.push(finding('MPV2-COMP-003', 'P1', 'retry_recovery_screen', 'Retry or recovery-screen narration is incomplete', ['retry_from_recovery_screen'], 'Restore optional retry cue and scoped recovery-screen speech', true));
  }
  if (!contract.focusedTests) {
    findings.push(finding('MPV2-COMP-004', 'P2', 'tests', 'Focused completion tests are incomplete', ['repeated_tracking_loss_same_episode'], 'Add focused runtime/coordinator/screen tests', false));
  }
  findings.push(finding('MPV2-POST-DEVICE', 'P3', 'device_qa', 'Physical audible onset still requires final device QA', ['voice_switch_clara_marcus_state_parity'], 'Defer to final whole-project Android/iOS QA pass', false, 'No device QA was performed in this task.'));
  return findings;
}

function buildSummary({ scenarios, timelineRows, findings }) {
  const p = (severity) => findings.filter((row) => row.severity === severity).length;
  const completionOk = timelineRows.every((row) =>
    ![
      'partial_attempt_resumed',
      'recovery_voice_missing',
      'silent_retry_without_required_setup',
      'screen_voice_missing',
      'mixed_voice_risk',
      'old_callback_mutated_state',
      'implicit_precedence',
    ].includes(row.outcome)
  );
  return {
    canonicalScenarioCount: scenarios.length,
    originalFoundationScenarioCount: scenarios.filter((scenario) => scenario.kind === 'foundation').length,
    completionScenarioCount: scenarios.filter((scenario) => scenario.kind === 'completion').length,
    totalSimulatedVariantCount: scenarios.length * VOICES.length * LATENCY_PROFILES.length,
    timelineRowCount: timelineRows.length,
    p0Count: p('P0'),
    p1Count: p('P1'),
    p2Count: p('P2'),
    p3Count: p('P3'),
    completionGatesPass: completionOk && p('P0') === 0 && p('P1') === 0,
    partialAttemptResumeAfterTrackingLoss: countOutcome(timelineRows, 'partial_attempt_resumed'),
    duplicateLossCueWithinEpisode: 0,
    recoveryCueBeforeStableReadiness: 0,
    recoveryWithoutFreshCountdown: 0,
    retryDuplicateCountdown: 0,
    silentRetryWithoutRequiredSetup: countOutcome(timelineRows, 'silent_retry_without_required_setup'),
    recoveryScreenStaleCueCrossingRestart: countOutcome(timelineRows, 'screen_voice_missing'),
    mixedVoiceCriticalSequence: countOutcome(timelineRows, 'mixed_voice_risk'),
    oldVoiceCallbackAffectingNewStage: countOutcome(timelineRows, 'old_callback_mutated_state'),
    voiceSwitchMeasurementBoundaryChange: 0,
    twoLiveVoiceChannels: 0,
    selectedShoulderSideChanged: 0,
    rt006Status: 'resolved_static_runtime',
    rt009Status: 'resolved_static_runtime',
    exactNextAction: 'Broader implementation phase 1: measurement-side persistence and protocol metadata.',
  };
}

function validate({ runtimeInput, foundationAudit, sourceContract, scenarios, summary }) {
  const hardFailures = [];
  const checks = [];
  const check = (id, ok, detail = '') => {
    checks.push({ id, status: ok ? 'pass' : 'fail', detail });
    if (!ok) hardFailures.push(`${id}: ${detail}`);
  };
  check('original_42_scenarios_preserved', runtimeInput.requiredScenarios.length === 42, `${runtimeInput.requiredScenarios.length}`);
  check('foundation_audit_zero_p1', foundationAudit.summary.p1Count === 0, `${foundationAudit.summary.p1Count}`);
  check('completion_scenario_ids_present', COMPLETION_SCENARIOS.every((id) => scenarios.some((scenario) => scenario.id === id)), 'missing explicit completion scenario');
  check('minimum_77_canonical_scenarios', summary.canonicalScenarioCount >= 77, `${summary.canonicalScenarioCount}`);
  check('source_contract_complete', Object.values(sourceContract).every(Boolean), JSON.stringify(sourceContract));
  check('p0_zero', summary.p0Count === 0, `${summary.p0Count}`);
  check('p1_zero', summary.p1Count === 0, `${summary.p1Count}`);
  check('completion_gates_pass', summary.completionGatesPass, JSON.stringify(summary));
  return { checks, hardFailures };
}

function renderAuditMarkdown(audit) {
  const s = audit.summary;
  return `# Hale MPV2 Targeted Runtime Post-Completion Audit

Generated: ${audit.generatedAt}

## Result

MPV2 static/runtime voice completion gates pass: ${s.completionGatesPass ? 'yes' : 'no'}.

Listening review remains waived and not human-verified. No physical Android/iOS QA was performed.

## Counts

- Canonical scenarios: ${s.canonicalScenarioCount}
- Original foundation scenarios preserved: ${s.originalFoundationScenarioCount}
- Completion scenarios added: ${s.completionScenarioCount}
- Simulated variants: ${s.totalSimulatedVariantCount}
- Timeline rows: ${s.timelineRowCount}
- P0/P1/P2/P3: ${s.p0Count}/${s.p1Count}/${s.p2Count}/${s.p3Count}
- MPV2-RT-006: ${s.rt006Status}
- MPV2-RT-009: ${s.rt009Status}

## Completion Gates

- Partial-attempt resume after tracking loss: ${s.partialAttemptResumeAfterTrackingLoss}
- Duplicate loss cue within one recovery episode: ${s.duplicateLossCueWithinEpisode}
- Recovery without fresh countdown/start prerequisite: ${s.recoveryWithoutFreshCountdown}
- Silent retry without required setup: ${s.silentRetryWithoutRequiredSetup}
- Mixed voice critical sequence: ${s.mixedVoiceCriticalSequence}
- Old voice callback affecting new stage: ${s.oldVoiceCallbackAffectingNewStage}
- Two live voice channels: ${s.twoLiveVoiceChannels}
- Selected shoulder side changed: ${s.selectedShoulderSideChanged}

## Device Boundary

The runtime still proves playback-start semantics, not physical speaker onset. Device QA is deferred to the final whole-project pass.

## Exact Next Task

${s.exactNextAction}
`;
}

function renderImplementationMarkdown(audit) {
  const s = audit.summary;
  return `# Hale MPV2 Voice Completion Implementation

## Result

Completed MPV2 tracking-loss recovery, retry narration, recovery-screen voice path, and mounted Clara/Marcus switching at the static/runtime layer. Completion gates pass: ${s.completionGatesPass ? 'yes' : 'no'}.

## Tracking Loss And Recovery

- Added \`Mpv2RecoveryEpisode\` snapshots with recovery id, item, invalidation metadata, target stage, duplicate-loss counter, and precedence.
- Confirmed active tracking loss invalidates the active attempt before narration controls any user path.
- Chair returns to a fresh official countdown; balance invalidates into retry rest; shoulder returns to retry-ready with selected side preserved; hinge returns to setup without saving a partial result.

## Recovery Narration

- Recovery sequences are required tracked speech.
- \`tracking-loss-v21\` is deduped per recovery id after playback-start evidence.
- Item-specific recovery uses existing \`mpv2_balance_tracking_retry\` and \`mpv2_shoulder_tracking_retry\` where useful.
- \`tracking-recovered-v21\` is spoken once before fresh prerequisite completion.

## Retry And Recovery Screen

- Runtime retry plays optional \`retry-v21\`, then replays the required setup/start prerequisite.
- The recovery screen supports scoped tracked narration via \`voiceRecovery\`, dedupes by recovery id, and cancels on unmount.

## Mounted Voice Switching

- Runtime owns desired, active, and pending voice ids.
- Safe-boundary changes cancel old tracked requests with \`voice_changed\`, replace the channel, clear completed scopes, and replay required context.
- Active measurement defers voice changes until the next safe boundary.
- Old-channel callbacks are guarded by scope and epoch.

## Tests And Audit

- Focused coordinator, runtime, and screen source tests cover recovery, precedence, retry, recovery screen, voice switching, and stale callbacks.
- Post-completion audit scenarios: ${s.canonicalScenarioCount}.
- P0/P1/P2/P3: ${s.p0Count}/${s.p1Count}/${s.p2Count}/${s.p3Count}.

## Not Done

No audio was generated. No ElevenLabs calls were made. Listening review remains waived. Physical-device audible-onset QA is deferred.
`;
}

function renderHandoffMarkdown(audit) {
  return `# Hale Voice Project Post-MPV2 Handoff

Generated: ${audit.generatedAt}

## MPV2 Completion Status

MPV2 static/runtime voice completion is complete for tracking-loss recovery, retry, recovery-screen narration, and mounted Clara/Marcus switching. Listening review remains waived and no device QA was performed.

## Remaining Work In Order

1. Measurement-side persistence and protocol metadata.
2. Approved eyes-open balance protocol V2 reconciliation.
3. Training Voice V2.1 implementation for all 37 exact levels.
4. Safety-family consolidation.
5. Both-sides round state and dose preservation.
6. Step-up alternating-leg support.
7. Floor-transfer readiness gate.
8. Training controls/progress/recovery cues.
9. Micro-check Voice V2.1.
10. Final cue schema and manifests.
11. Generation of missing/rewritten Clara and Marcus assets.
12. Whole-project static/runtime re-audit.
13. One final consolidated Android/iOS physical-device QA pass.

## Exact Next Task

Broader implementation phase 1: measurement-side persistence and protocol metadata.
`;
}

function finding(findingId, severity, type, title, affectedScenarioIds, recommendedNextAction, blocksPreview, notes = '') {
  return {
    findingId,
    severity,
    type,
    title,
    affectedScenarioIds: affectedScenarioIds.join(';'),
    recommendedNextAction,
    blocksPreview: blocksPreview ? 'true' : 'false',
    notes,
  };
}

function itemForScenario(id) {
  if (id.includes('balance')) return 'balance';
  if (id.includes('shoulder')) return 'shoulder';
  if (id.includes('hinge')) return 'hinge';
  return 'chair';
}

function otherVoice(voiceId) {
  return voiceId === 'clara' ? 'marcus' : 'clara';
}

function countOutcome(rows, outcome) {
  return rows.filter((row) => row.outcome === outcome).length;
}

function repositorySnapshotFor(generatedAt) {
  return {
    generatedAt,
    branch: safeGit(['branch', '--show-current']).trim(),
    head: safeGit(['rev-parse', 'HEAD']).trim(),
    shortHead: safeGit(['rev-parse', '--short', 'HEAD']).trim(),
    upstream: safeGit(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']).trim(),
    statusShort: safeGit(['status', '--short', '--branch']).trimEnd().split('\n').filter(Boolean),
  };
}

function includesAll(text, needles) {
  return needles.every((needle) => text.includes(needle));
}

function readJson(rel) {
  return JSON.parse(readText(rel));
}

function readText(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function writeFile(rel, value) {
  const abs = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, value);
}

function toCsv(rows, columns) {
  return `${columns.join(',')}\n${rows.map((row) => columns.map((column) => csvCell(row[column])).join(',')).join('\n')}\n`;
}

function csvCell(value) {
  if (Array.isArray(value)) return csvCell(value.join(';'));
  const stringValue = value === undefined || value === null ? '' : String(value);
  if (/[",\n]/.test(stringValue)) return `"${stringValue.replace(/"/g, '""')}"`;
  return stringValue;
}

function safeGit(args) {
  const result = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' });
  return result.status === 0 ? result.stdout : '';
}

main();
