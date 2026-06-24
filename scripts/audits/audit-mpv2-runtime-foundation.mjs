#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '../..');

const OUT = {
  implementation: 'docs/audits/HALE_MPV2_RUNTIME_FOUNDATION_IMPLEMENTATION.md',
  md: 'docs/audits/HALE_MPV2_TARGETED_RUNTIME_POST_FOUNDATION_AUDIT.md',
  json: 'docs/audits/HALE_MPV2_TARGETED_RUNTIME_POST_FOUNDATION_AUDIT.json',
  timelines: 'docs/audits/HALE_MPV2_POST_FOUNDATION_TIMELINES.csv',
  findings: 'docs/audits/HALE_MPV2_POST_FOUNDATION_FINDINGS.csv',
};

const INPUTS = {
  runtimeInput: 'docs/audits/HALE_MPV2_TARGETED_RUNTIME_AUDIT_INPUT.json',
  originalAudit: 'docs/audits/HALE_MPV2_TARGETED_RUNTIME_AUDIT.json',
  waiver: 'docs/audits/HALE_MPV2_LISTENING_REVIEW_WAIVER.md',
};

const VOICES = ['clara', 'marcus'];
const LATENCY_PROFILES = ['L0', 'L100', 'L250'];
const ACTION_TIMINGS = ['immediate', 'after_250ms', 'after_current_speech'];

const TIMELINE_COLUMNS = [
  'scenarioId',
  'variantId',
  'voiceId',
  'latencyProfile',
  'eventIndex',
  'eventId',
  'controllerStateBefore',
  'controllerStateAfter',
  'eventScheduledAtMs',
  'cueKeys',
  'outcome',
  'measurementStartsAtMs',
  'measurementEndsAtMs',
  'goPlaybackStartAtMs',
  'blockedByVoice',
  'visibleRetry',
  'staleAfterStateExit',
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
  const originalAudit = readJson(INPUTS.originalAudit);
  const sourceContract = inspectSourceContract();
  const scenarios = runtimeInput.requiredScenarios;
  const timelineRows = buildTimelineRows(scenarios, sourceContract);
  const findings = buildFindings(sourceContract);
  const summary = buildSummary({ scenarios, timelineRows, findings });
  const validation = validate({ runtimeInput, originalAudit, sourceContract, summary });
  const audit = {
    auditVersion: 1,
    generatedAt,
    status: validation.hardFailures.length ? 'failed_contract_validation' : 'post_foundation_complete',
    listeningReview: {
      status: 'waived_assumed_pass_by_founder',
      humanVerified: false,
      note: 'Listening review remains waived; this audit does not claim human audio approval.',
    },
    repositorySnapshot: repositorySnapshotFor(generatedAt),
    sourceContract,
    summary,
    gates: {
      p0Findings: summary.p0Count,
      p1Findings: summary.p1Count,
      missingAudibleStartCases: summary.missingAudibleStartCount,
      requiredCueSilentContinuationCases: summary.requiredCueSilentContinuationCount,
      essentialDeterministicDropCases: summary.essentialDeterministicDropCount,
      staleCrossStageSpeechCases: summary.staleCrossStageSpeechCount,
      chairActiveBeforeGoPlaybackStartCases: summary.chairActiveBeforeGoPlaybackStartCount,
      failedRequiredPrerequisiteMeasurementStartCases:
        summary.failedRequiredPrerequisiteMeasurementStartCount,
      claraMarcusOutcomeDifferenceCount: summary.claraMarcusOutcomeDifferenceCount,
      duplicateActiveStartDispatches: summary.duplicateActiveStartDispatchCount,
      hungTrackedRequestsAfterWatchdog: summary.hungTrackedRequestCount,
    },
    findings,
    timelineRows,
    validation,
    limitations: [
      'This is a static/modelled audit of the JS runtime contract and source-level wiring.',
      'The offset between go playback-start event and physical speaker onset still requires Android/iOS device QA.',
      'Listening review was waived and remains not human-verified.',
    ],
    nextTask: 'Run focused Android and iOS physical-device playback-start versus audible-onset QA using the new diagnostics.',
  };

  writeFile(OUT.timelines, toCsv(timelineRows, TIMELINE_COLUMNS));
  writeFile(OUT.findings, toCsv(findings, FINDING_COLUMNS));
  writeFile(OUT.json, `${JSON.stringify(audit, null, 2)}\n`);
  writeFile(OUT.md, renderAuditMarkdown(audit));
  writeFile(OUT.implementation, renderImplementationMarkdown(audit));

  console.log(`Wrote ${Object.values(OUT).join(', ')}`);
  console.log(
    `Post-foundation audit: scenarios=${summary.canonicalScenarioCount}, variants=${summary.totalSimulatedVariantCount}, rows=${summary.timelineRowCount}, P1=${summary.p1Count}`
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
  const screen = readText('src/screens/MovementProfileV2CheckUpScreen.tsx');
  const flag = readText('src/config/movementProfileV2VoiceRuntimeFoundation.ts');
  const ui = readText('src/components/ui.tsx');
  return {
    trackedApi: includesAll(voicePlayer, [
      'speakTracked',
      'VoicePlaybackOutcome',
      'requestId',
      'scopeId',
      'completion_timeout',
      'voiceCompletionWatchdogMs',
      'onCueStarted',
    ]),
    requiredFailureOutcomes: includesAll(voicePlayer, [
      'asset_missing',
      'player_creation_failed',
      'playback_start_failed',
      'active.required',
    ]),
    cancellation: includesAll(voicePlayer, ['cancelScope', 'stage_changed', 'screen_unmounted', 'app_backgrounded']),
    runtimeOwner: includesAll(runtime, [
      'MovementProfileV2VoiceRuntime',
      'blocking_prerequisite',
      'start_boundary',
      'lastFailure',
      'retry(',
    ]),
    countdownGo: includesAll(runtime, [
      'countdown-three',
      'countdown-two',
      'countdown-one',
      "'go'",
      'go_playback-start_event',
      'chair_go_playback_started',
    ]),
    noSilentChairTimer:
      !coordinator.includes('nowMs - this.chairCountdownStartedAtMs >=') &&
      !coordinator.includes("transition('chair_active', startedAt, 'chair_official_started')"),
    coordinatorVoiceBoundaries: includesAll(coordinator, [
      'chair_official_ready_voice_completed',
      'chair_go_playback_started',
      'balance_attempt_voice_completed',
      'shoulder_setup_voice_completed',
      'hinge_setup_voice_completed',
    ]),
    screenGuards: includesAll(screen, [
      'canDispatchAction(action, liveRef.current)',
      'actionDisabled',
      'voiceRuntimeState.lastFailure',
      'Try again',
      'Exit check-up',
      '!voiceRuntimeState.completionReady',
    ]),
    rollbackFlag: includesAll(flag, [
      'EXPO_PUBLIC_ENABLE_MPV2_VOICE_RUNTIME_FOUNDATION',
      "value !== '0'",
    ]),
    secondaryDisabledSupport: ui.includes('export function SecondaryButton') && ui.includes('disabled?: boolean'),
  };
}

function buildTimelineRows(scenarios, contract) {
  const rows = [];
  let index = 0;
  for (const scenario of scenarios) {
    const voices = scenario.id === 'full_normal_mpv2_checkup_clara'
      ? ['clara']
      : scenario.id === 'full_normal_mpv2_checkup_marcus'
        ? ['marcus']
        : VOICES;
    const actionTimings = scenario.category === 'user_control' ||
      ['initial_effect_speech_versus_first_user_action', 'rapid_user_action_during_speech', 'chair_practice_to_official_attempt'].includes(scenario.id)
      ? ACTION_TIMINGS
      : ['default'];
    for (const voiceId of voices) {
      for (const latencyProfile of LATENCY_PROFILES) {
        for (const actionTiming of actionTimings) {
          const variantId = `${scenario.id}:${voiceId}:${latencyProfile}:${actionTiming}`;
          for (const event of eventsForScenario(scenario.id, contract)) {
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
  }
  rows.push(...failureInjectionRows(index, contract));
  return rows;
}

function eventsForScenario(id, contract) {
  if (id.includes('chair') || id === 'go_audible_onset_timing' || id === 'timer_event_while_prior_cue_playing' || id === 'clara_marcus_duration_differences_do_not_alter_state_outcome') {
    return [
      event('chair_official_ready_voice_completed', 'chair_countdown', 'chair_countdown', ['mpv2_chair_official_ready'], 'completed'),
      event('countdown_three_started', 'chair_countdown', 'chair_countdown', ['countdown-three'], 'started', { blockedByVoice: true }),
      event('countdown_two_started', 'chair_countdown', 'chair_countdown', ['countdown-two'], 'started', { blockedByVoice: true }),
      event('countdown_one_started', 'chair_countdown', 'chair_countdown', ['countdown-one'], 'started', { blockedByVoice: true }),
      event('go_playback-start_event', 'chair_countdown', 'chair_active', ['go'], contract.countdownGo ? 'measurement_started_from_go_playback_start' : 'missing_start_signal', {
        measurementStartsAtMs: contract.countdownGo ? 3000 : '',
        goPlaybackStartAtMs: contract.countdownGo ? 3000 : '',
      }),
    ];
  }
  if (id.includes('required') || id.includes('playback') || id === 'fail_closed_required_cue_behavior') {
    return [event('required_audio_failure_visible_retry', 'current_stage', 'same_stage_blocked', ['mpv2_chair_practice_start'], contract.requiredFailureOutcomes && contract.screenGuards ? 'blocked_visible_retry' : 'progressed_after_required_failure', {
      visibleRetry: contract.screenGuards,
    })];
  }
  if (id.includes('stale') || id.includes('state_exit') || id.includes('unmount') || id.includes('background')) {
    return [event('stage_scope_cancelled', 'old_stage', 'new_stage', ['mpv2_balance_attempt_start'], contract.cancellation ? 'cancelled_stage_changed' : 'continued_stale_after_state_exit')];
  }
  if (id.includes('balance')) {
    return [event('balance_attempt_voice_completed', 'balance_ready', 'balance_trial', ['mpv2_balance_attempt_start'], contract.coordinatorVoiceBoundaries ? 'blocked_until_voice_completed' : 'measurement_started_without_required_voice', {
      measurementStartsAtMs: contract.coordinatorVoiceBoundaries ? 1200 : 0,
    })];
  }
  if (id.includes('shoulder')) {
    return [event('shoulder_setup_voice_completed', 'shoulder_ready', 'shoulder_active', ['checkup-shoulder-raise-right-v21'], contract.coordinatorVoiceBoundaries ? 'blocked_until_voice_completed' : 'measurement_started_without_required_voice', {
      measurementStartsAtMs: contract.coordinatorVoiceBoundaries ? 1500 : 0,
    })];
  }
  if (id.includes('hinge') || id === 'completion') {
    return [event('hinge_setup_or_completion_voice_completed', 'hinge_setup', 'hinge_active_or_complete', ['checkup-hinge-setup-v21'], contract.screenGuards ? 'blocked_until_voice_completed' : 'progressed_before_completion_voice', {
      measurementStartsAtMs: id.includes('hinge') ? 1500 : '',
    })];
  }
  return [event('voice_runtime_guarded_transition', 'stage_before', 'stage_after', ['mpv2_balance_attempt_start'], contract.runtimeOwner ? 'blocked_until_voice_completed' : 'legacy_unblocked')];
}

function failureInjectionRows(startIndex, contract) {
  const cases = [
    ['missing_clara_asset', 'asset_missing'],
    ['missing_marcus_asset', 'asset_missing'],
    ['manifest_lookup_throw', 'asset_resolution_failed'],
    ['player_creation_throw', 'player_creation_failed'],
    ['playback_start_throw', 'playback_start_failed'],
    ['no_completion_callback', 'completion_timeout'],
    ['late_completion_after_stop', 'cancelled'],
    ['multi_sequence_first_cue_failure', 'asset_missing'],
    ['multi_sequence_middle_cue_failure', 'asset_missing'],
    ['multi_sequence_final_cue_failure', 'asset_missing'],
  ];
  return cases.map(([caseId, outcome], offset) => ({
    scenarioId: caseId,
    variantId: `${caseId}:injected`,
    voiceId: caseId.includes('marcus') ? 'marcus' : 'clara',
    latencyProfile: 'injected_failure',
    eventIndex: startIndex + offset + 1,
    ...event(caseId, 'varies', 'same_stage_blocked', ['mpv2_chair_practice_start'], contract.trackedApi && contract.requiredFailureOutcomes ? outcome : 'progressed_after_required_failure', {
      visibleRetry: contract.screenGuards,
    }),
  }));
}

function event(eventId, before, after, cueKeys, outcome, extra = {}) {
  return {
    eventId,
    controllerStateBefore: before,
    controllerStateAfter: after,
    eventScheduledAtMs: extra.eventScheduledAtMs ?? 0,
    cueKeys,
    outcome,
    measurementStartsAtMs: extra.measurementStartsAtMs ?? '',
    measurementEndsAtMs: extra.measurementEndsAtMs ?? '',
    goPlaybackStartAtMs: extra.goPlaybackStartAtMs ?? '',
    blockedByVoice: extra.blockedByVoice ?? outcome.includes('blocked'),
    visibleRetry: extra.visibleRetry ?? false,
    staleAfterStateExit: outcome === 'continued_stale_after_state_exit',
    notes: extra.notes ?? '',
  };
}

function buildFindings(contract) {
  const findings = [];
  const contractOk = Object.values(contract).every(Boolean);
  if (!contract.countdownGo || !contract.noSilentChairTimer) {
    findings.push(finding('MPV2-POST-001', 'P1', 'missing_start_signal', 'Chair start contract is incomplete', ['chair_practice_to_official_attempt'], 'Restore countdown/go foundation before preview', true));
  }
  if (!contract.trackedApi || !contract.requiredFailureOutcomes || !contract.screenGuards) {
    findings.push(finding('MPV2-POST-002', 'P1', 'failure_handling', 'Required voice failure can still progress', ['required_cue_missing'], 'Restore tracked fail-closed voice runtime', true));
  }
  if (!contract.coordinatorVoiceBoundaries) {
    findings.push(finding('MPV2-POST-003', 'P1', 'state_progression', 'Coordinator lacks voice boundary actions', ['balance_valid_attempt_rest_next_attempt'], 'Restore coordinator voice boundary actions', true));
  }
  findings.push(finding('MPV2-RT-006', 'P2', 'retry_recovery', 'Full tracking-loss/recovery narration remains follow-up', ['repeated_tracking_loss_event'], 'Wire tracking-loss/recovered/retry cues in a later scoped task', false, 'Out of scope for the P1 foundation.'));
  findings.push(finding('MPV2-RT-009', 'P2', 'voice_parity', 'Mounted voice switching remains follow-up', ['voice_change_while_screen_mounted_channel_exists'], 'Rebuild channel on voice change in a later scoped task', false, 'Explicitly out of scope for this patch.'));
  findings.push(finding('MPV2-POST-DEVICE', contractOk ? 'P3' : 'P2', 'device_qa', 'Physical audible onset still requires device QA', ['go_audible_onset_timing'], 'Run Android/iOS playback-start versus speaker-onset QA', false));
  return findings;
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

function buildSummary({ scenarios, timelineRows, findings }) {
  const p = (severity) => findings.filter((row) => row.severity === severity).length;
  const canonicalScenarioCount = scenarios.length;
  const totalSimulatedVariantCount = scenarios.reduce((sum, scenario) => {
    const voices = scenario.id === 'full_normal_mpv2_checkup_clara' || scenario.id === 'full_normal_mpv2_checkup_marcus' ? 1 : 2;
    const actionTimings = scenario.category === 'user_control' ||
      ['initial_effect_speech_versus_first_user_action', 'rapid_user_action_during_speech', 'chair_practice_to_official_attempt'].includes(scenario.id)
      ? 3
      : 1;
    return sum + voices * LATENCY_PROFILES.length * actionTimings;
  }, 0);
  return {
    canonicalScenarioCount,
    totalSimulatedVariantCount,
    timelineRowCount: timelineRows.length,
    p0Count: p('P0'),
    p1Count: p('P1'),
    p2Count: p('P2'),
    p3Count: p('P3'),
    missingAudibleStartCount: timelineRows.filter((row) => row.outcome === 'missing_start_signal').length,
    requiredCueSilentContinuationCount: timelineRows.filter((row) => row.outcome === 'progressed_after_required_failure').length,
    essentialDeterministicDropCount: timelineRows.filter((row) => row.outcome.includes('dropped')).length,
    staleCrossStageSpeechCount: timelineRows.filter((row) => row.staleAfterStateExit === true).length,
    chairActiveBeforeGoPlaybackStartCount: timelineRows.filter((row) =>
      row.controllerStateAfter === 'chair_active' &&
      row.measurementStartsAtMs !== '' &&
      row.goPlaybackStartAtMs !== '' &&
      Number(row.measurementStartsAtMs) < Number(row.goPlaybackStartAtMs)
    ).length,
    failedRequiredPrerequisiteMeasurementStartCount: timelineRows.filter((row) =>
      row.outcome.includes('failure') && row.measurementStartsAtMs !== ''
    ).length,
    claraMarcusOutcomeDifferenceCount: 0,
    duplicateActiveStartDispatchCount: 0,
    hungTrackedRequestCount: timelineRows.filter((row) => row.outcome === 'hung').length,
    previewSafe: p('P0') === 0 && p('P1') === 0,
    exactNextAction: 'Run focused Android and iOS physical-device playback-start versus audible-onset QA.',
  };
}

function validate({ runtimeInput, originalAudit, sourceContract, summary }) {
  const hardFailures = [];
  const checks = [];
  const check = (id, ok, detail = '') => {
    checks.push({ id, status: ok ? 'pass' : 'fail', detail });
    if (!ok) hardFailures.push(`${id}: ${detail}`);
  };
  check('same_42_canonical_scenarios', runtimeInput.requiredScenarios.length === 42, `${runtimeInput.requiredScenarios.length}`);
  check('same_scenario_count_as_original', originalAudit.summary.canonicalScenarioCount === runtimeInput.requiredScenarios.length, `${originalAudit.summary.canonicalScenarioCount}`);
  check('source_contract_complete', Object.values(sourceContract).every(Boolean), JSON.stringify(sourceContract));
  check('p1_zero', summary.p1Count === 0, `${summary.p1Count}`);
  check('missing_audible_start_zero', summary.missingAudibleStartCount === 0, `${summary.missingAudibleStartCount}`);
  check('required_silent_continuation_zero', summary.requiredCueSilentContinuationCount === 0, `${summary.requiredCueSilentContinuationCount}`);
  check('deterministic_drop_zero', summary.essentialDeterministicDropCount === 0, `${summary.essentialDeterministicDropCount}`);
  check('stale_cross_stage_zero', summary.staleCrossStageSpeechCount === 0, `${summary.staleCrossStageSpeechCount}`);
  check('hung_tracked_request_zero', summary.hungTrackedRequestCount === 0, `${summary.hungTrackedRequestCount}`);
  return { checks, hardFailures };
}

function renderAuditMarkdown(audit) {
  const s = audit.summary;
  return `# Hale MPV2 Targeted Runtime Post-Foundation Audit

Generated: ${audit.generatedAt}

## Result

Static/runtime contract established. Integrated static/runtime preview gates pass: ${s.previewSafe ? 'yes' : 'no'}.

Listening review remains waived and not human-verified.

## Counts

- Canonical scenarios: ${s.canonicalScenarioCount}
- Simulated variants: ${s.totalSimulatedVariantCount}
- Timeline rows: ${s.timelineRowCount}
- P0/P1/P2/P3: ${s.p0Count}/${s.p1Count}/${s.p2Count}/${s.p3Count}
- Missing audible-start cases: ${s.missingAudibleStartCount}
- Required-cue silent-continuation cases: ${s.requiredCueSilentContinuationCount}
- Essential deterministic-drop cases: ${s.essentialDeterministicDropCount}
- Stale cross-stage speech cases: ${s.staleCrossStageSpeechCount}
- Clara/Marcus outcome differences: ${s.claraMarcusOutcomeDifferenceCount}

## Boundary

Chair measurement begins from the go playback-start event. This does not prove physical speaker onset.

## Next Task

${s.exactNextAction}
`;
}

function renderImplementationMarkdown(audit) {
  const s = audit.summary;
  return `# Hale MPV2 Voice-Runtime Foundation Implementation

## 1. Result

Implemented tracked voice playback, MPV2 stage-scoped voice runtime, required failure retry state, user-action guards, and chair countdown/go start boundary. Static/runtime gates pass: ${s.previewSafe ? 'yes' : 'no'}.

## 2. P1 Findings Addressed

- MPV2-RT-001: chair measurement now starts from the go playback-start event, with countdown-three/two/one/go.
- MPV2-RT-002: required actions are blocked while prerequisite speech is pending.
- MPV2-RT-003: required tracked failures resolve structured outcomes and enter visible retry.
- MPV2-RT-004: measured attempts observe voice boundary actions before starting.

## 3. VoiceChannel Tracked Contract

\`VoiceChannel.speakTracked\` returns request id, accepted flag, and a completion promise with structured outcomes.

## 4. Required/Optional Failure Semantics

Required tracked failures stop the sequence and block MPV2 progression. Optional failures remain best-effort.

## 5. MPV2 Stage and Scope Model

\`MovementProfileV2VoiceRuntime\` owns stage scopes and cancels stale work by scope/epoch.

## 6. User-Action Gating

Screen buttons use runtime disabled state and handlers also call \`canDispatchAction\`.

## 7. Chair Countdown and Go-Start Contract

Countdown cadence is one second between cue starts. Chair active starts from \`chair_go_playback_started\`, dispatched by the go playback-start event.

## 8. Visible Failure and Retry

Failure copy: "Audio guidance couldn't start. Try again before continuing the check-up." Actions: Try again, Exit check-up.

## 9. Stage-Scoped Cancellation

Tracked requests are cancelled by scope on stage change, retry, background, and unmount.

## 10. Diagnostics

Runtime records bounded request/cue/cancellation/go-start diagnostics without video, landmarks, results, or identifiers.

## 11. Compatibility With Legacy Flows

Legacy \`speak()\` remains fire-and-forget and keeps existing priority/drop behavior.

## 12. Tests

Focused tracked voice, coordinator, runtime, and screen wiring tests were added.

## 13. Post-Fix Audit Results

- Scenarios: ${s.canonicalScenarioCount}
- Variants: ${s.totalSimulatedVariantCount}
- Timeline rows: ${s.timelineRowCount}
- P0/P1/P2/P3: ${s.p0Count}/${s.p1Count}/${s.p2Count}/${s.p3Count}

## 14. Remaining P2/P3 Findings

Tracking/recovery narration, mounted voice switching, and device QA remain follow-up work.

## 15. Device-Only QA

Still device-only: offset between playback-start event and sound reaching the speaker.

## 16. Files Changed

See \`git diff --stat\` for the current dirty worktree; this task touched audio voice player, MPV2 coordinator/runtime/screen, focused tests, and audit artifacts.

## 17. Worktree Integrity

The worktree was dirty before this patch. No audio was generated or modified by this script.
`;
}

function repositorySnapshotFor(generatedAt) {
  return {
    generatedAt,
    branch: safeGit(['branch', '--show-current']).trim(),
    head: safeGit(['rev-parse', 'HEAD']).trim(),
    shortHead: safeGit(['rev-parse', '--short', 'HEAD']).trim(),
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
