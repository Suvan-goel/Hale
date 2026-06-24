#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '../..');

const OUT = {
  md: 'docs/audits/HALE_MPV2_TARGETED_RUNTIME_AUDIT.md',
  json: 'docs/audits/HALE_MPV2_TARGETED_RUNTIME_AUDIT.json',
  timelines: 'docs/audits/HALE_MPV2_RUNTIME_TIMELINES.csv',
  findings: 'docs/audits/HALE_MPV2_RUNTIME_FINDINGS.csv',
  remediation: 'docs/audits/HALE_MPV2_RUNTIME_REMEDIATION_PLAN.md',
  waiver: 'docs/audits/HALE_MPV2_LISTENING_REVIEW_WAIVER.md',
};

const INPUTS = {
  runtimeInput: 'docs/audits/HALE_MPV2_TARGETED_RUNTIME_AUDIT_INPUT.json',
  runtimeScope: 'docs/audits/HALE_MPV2_TARGETED_RUNTIME_AUDIT_SCOPE.md',
  reconciliationJson: 'docs/audits/HALE_MPV2_V21_VOICE_RECONCILIATION.json',
  canonicalCsv: 'docs/audits/HALE_MPV2_VOICE_CANONICAL_MAP.csv',
  qcCsv: 'docs/audits/HALE_MPV2_VOICE_ASSET_QC.csv',
  v21Json: 'docs/specs/HALE_VOICE_EXPERIENCE_SPEC_V2_1.json',
};

const LISTENING_REVIEW = {
  status: 'waived_assumed_pass_by_founder',
  humanVerified: false,
  assumedForThisAudit: [
    'binary wording matches current source expectation',
    'speech is intelligible',
    'pronunciation is acceptable',
    'tone is acceptable',
    'level and technical quality are acceptable',
  ],
  notEstablished: [
    'actual wording was listened to',
    'actual pronunciation was reviewed',
    'actual tone was approved',
    'phone-speaker quality was checked',
    'Clara and Marcus semantic parity was heard',
  ],
  residualRisk: 'Audible content or quality defects may still be found later.',
};

const WAIVER_TEXT = `Founder listening decision: waived for this stage.
Runtime-audit assumption: every current MPV2 Clara and Marcus asset is assumed to contain its source-expected wording, be intelligible, and have acceptable pronunciation, tone, level, and technical quality.
Verification status: assumed-pass-by-founder, not human-verified.
Residual risk: audible wording or quality defects may still be discovered later during device QA or beta use.`;

const VOICES = ['clara', 'marcus'];
const LATENCY_PROFILES = {
  L0: { startupDelayMs: 0, completionDelayMs: 0 },
  L100: { startupDelayMs: 100, completionDelayMs: 100 },
  L250: { startupDelayMs: 250, completionDelayMs: 250 },
};
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
  'speakCalledAtMs',
  'cueKeys',
  'incomingPriority',
  'voiceBusyBefore',
  'currentPriority',
  'audibleStartEstimatedAtMs',
  'assetDurationMs',
  'sequenceDurationMs',
  'playbackEndEstimatedAtMs',
  'completionCallbackAtMs',
  'measurementStartsAtMs',
  'measurementEndsAtMs',
  'stateExitAtMs',
  'outcome',
  'timingMarginMs',
  'staleAfterStateExit',
  'userImpact',
  'confidence',
  'notes',
];

const FINDING_COLUMNS = [
  'findingId',
  'severity',
  'type',
  'title',
  'affectedScenarioIds',
  'affectedCueKeys',
  'affectedVoices',
  'deterministic',
  'latencyProfiles',
  'userConsequence',
  'sourceEvidence',
  'timelineEvidence',
  'currentTestCoverage',
  'recommendedRemediation',
  'blocksPreview',
  'confidence',
  'notes',
];

const SOURCE_INDEX = [
  'src/audio/voicePlayer.ts',
  'src/audio/cues.ts',
  'src/audio/manifest.ts',
  'src/audio/movementProfileV2Audio.ts',
  'src/audio/movementProfileV2AudioManifest.ts',
  'src/audio/__tests__/voicePlayer.test.ts',
  'src/audio/__tests__/movementProfileV2Audio.test.ts',
  'src/movementProfileV2/voiceCues.ts',
  'src/movementProfileV2/liveCoordinator.ts',
  'src/movementProfileV2/recovery.ts',
  'src/movementProfileV2/liveDiagnostics.ts',
  'src/movementProfileV2/__tests__/voiceCues.test.ts',
  'src/movementProfileV2/__tests__/liveCoordinator.test.ts',
  'src/movementProfileV2/__tests__/recovery.test.ts',
  'src/screens/MovementProfileV2CheckUpScreen.tsx',
  'src/screens/MovementProfileV2RecoveryScreen.tsx',
  'src/checkup/movementProfileV2.ts',
  'src/checkup/protocolEvidence.ts',
  'src/movements/chairRiseV2.ts',
  'src/movements/oneLegBalanceV2.ts',
  'src/movements/activeShoulderReachV2.ts',
  'src/movements/hingeReach.ts',
  'App.tsx',
  INPUTS.runtimeInput,
  INPUTS.runtimeScope,
  INPUTS.canonicalCsv,
  INPUTS.qcCsv,
];

function main() {
  const generatedAt = new Date().toISOString();
  const repositorySnapshot = repositorySnapshotFor(generatedAt);
  const runtimeInput = readJson(INPUTS.runtimeInput);
  const reconciliation = readJson(INPUTS.reconciliationJson);
  const v21Spec = readJson(INPUTS.v21Json);
  const canonicalRows = readCsv(INPUTS.canonicalCsv);
  const qcRows = readCsv(INPUTS.qcCsv);
  const liveDefinitions = parseLiveCueDefinitions();
  const sourceEvidence = buildSourceEvidence();
  const assets = buildAssets(runtimeInput, canonicalRows, qcRows);
  const inputFreshness = compareInputFreshness({ runtimeInput, canonicalRows, qcRows, liveDefinitions, assets });
  const scenarios = buildScenarioDefinitions(runtimeInput.requiredScenarios);
  const simulation = runSimulation({ scenarios, assets, sourceEvidence });
  const failureInjectionResults = buildFailureInjectionResults(simulation.timelineRows, sourceEvidence);
  simulation.timelineRows.push(...failureInjectionTimelineRows(failureInjectionResults));
  const findings = buildFindings({ timelineRows: simulation.timelineRows, failureInjectionResults, sourceEvidence });
  const summary = buildSummary({
    runtimeInput,
    scenarios,
    timelineRows: simulation.timelineRows,
    findings,
    failureInjectionResults,
  });
  const verdict = {
    primary:
      summary.p0Count > 0 || summary.p1Count > 0
        ? 'RUNTIME_REMEDIATION_REQUIRED_BEFORE_PREVIEW'
        : summary.p2Count > 0
          ? 'RUNTIME_READY_WITH_NONBLOCKING_ISSUES'
          : 'RUNTIME_READY_FOR_INTEGRATED_PREVIEW',
    secondaryFlags: [
      'ADD_AUDIBLE_COUNTDOWN_GO',
      'BLOCK_USER_ACTION_UNTIL_INSTRUCTION_COMPLETE',
      'MAKE_REQUIRED_CUES_CONTROLLER_BLOCKING',
      'ADD_TRACKING_RECOVERY_VOICE',
      'ADD_RETRY_VOICE',
      'CANCEL_STALE_STAGE_SPEECH',
      'REBUILD_CHANNEL_ON_VOICE_CHANGE',
      'REBASE_V21_CHECKUP_SPEC',
      'DEVICE_LATENCY_QA_REQUIRED',
      'LISTENING_REVIEW_WAIVED',
    ],
    integratedPreviewSafe: false,
    nextAction:
      'Implement audible countdown/go with active timing aligned to audible onset before integrated device preview.',
  };
  const validation = validate({
    runtimeInput,
    reconciliation,
    v21Spec,
    canonicalRows,
    qcRows,
    inputFreshness,
    scenarios,
    timelineRows: simulation.timelineRows,
    findings,
    failureInjectionResults,
    assets,
  });
  const audit = {
    auditVersion: 1,
    generatedAt,
    status: 'complete_with_listening_waiver',
    listeningReview: LISTENING_REVIEW,
    listeningWaiverText: WAIVER_TEXT,
    repositorySnapshot,
    inputFreshness,
    verdict,
    summary,
    runtimeModel: runtimeModel(sourceEvidence),
    assets: assets.map((asset) => ({
      cueKey: asset.cueKey,
      currentScript: asset.currentScript,
      priority: asset.priority,
      voiceAssets: asset.voiceAssets,
    })),
    events: runtimeInput.events,
    scenarios: simulation.scenarios,
    priorityMatrix: priorityMatrix(),
    failureInjectionResults,
    voiceParity: voiceParity(simulation.timelineRows),
    sideConsistency: sideConsistency(),
    protocolImpact: protocolImpact(),
    findings,
    remediationPlan: remediationPlan(),
    deviceQaPlan: deviceQaPlan(),
    validation,
    limitations: [
      'Listening review was waived; audio wording and quality are assumed for this audit and not human-verified.',
      'The timing model uses measured MP3 durations plus synthetic startup/completion callback delays; it is not native playback-onset measurement.',
      'The harness models React/controller event order from source and tests but does not instantiate React Native or expo-audio.',
      'The current worktree was already dirty and contains unrelated source changes; this audit only adds audit artifacts and an audit-only harness.',
    ],
  };

  writeFile(OUT.timelines, toCsv(simulation.timelineRows, TIMELINE_COLUMNS));
  writeFile(OUT.findings, toCsv(findings, FINDING_COLUMNS));
  writeFile(OUT.json, `${JSON.stringify(audit, null, 2)}\n`);
  writeFile(OUT.md, renderMarkdown(audit));
  writeFile(OUT.remediation, renderRemediationPlan(audit));
  writeFile(OUT.waiver, renderWaiver());

  console.log(`Wrote ${Object.values(OUT).join(', ')}`);
  console.log(`Verdict ${verdict.primary}; variants=${summary.totalSimulatedVariantCount}; timelineRows=${summary.timelineRowCount}; findings=${findings.length}`);
  if (validation.hardFailures.length) {
    console.error(validation.hardFailures.join('\n'));
    process.exitCode = 1;
  }
}

function repositorySnapshotFor(generatedAt) {
  const statusShort = safeGit(['status', '--short', '--branch']).trimEnd().split('\n').filter(Boolean);
  const porcelain = safeGit(['status', '--porcelain=v1']).trimEnd().split('\n').filter(Boolean);
  const packageJson = JSON.parse(readText('package.json'));
  return {
    generatedAt,
    branch: safeGit(['branch', '--show-current']).trim(),
    head: safeGit(['rev-parse', 'HEAD']).trim(),
    shortHead: safeGit(['rev-parse', '--short', 'HEAD']).trim(),
    upstream: safeGit(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']).trim() || null,
    worktreeClean: porcelain.length === 0,
    worktreeState: porcelain.length ? 'dirty_before_audit_work' : 'clean',
    statusShort,
    relevantChanges: porcelain.map((line) => ({ status: line.slice(0, 2), path: parsePorcelainPath(line) })),
    nodeVersion: process.version,
    npmVersion: safeRun('npm', ['--version']).stdout.trim(),
    expoAudioVersion: packageJson.dependencies?.['expo-audio'] ?? packageJson.devDependencies?.['expo-audio'] ?? null,
  };
}

function parseLiveCueDefinitions() {
  const file = 'src/movementProfileV2/voiceCues.ts';
  const text = readText(file);
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/definition\((['"])(.*?)\1,\s*(['"])(.*?)\3,\s*(['"])(.*?)\5,\s*(\d+),\s*(['"])(.*?)\8\)/);
    if (!match) continue;
    rows.push({
      cueKey: match[2],
      currentScript: unescapeTsString(match[4]),
      tier: match[6],
      priority: Number(match[7]),
      source: match[9],
      sourceFile: file,
      sourceLine: lineNumberOf(text, `definition('${match[2]}'`) || lineNumberOf(text, `definition("${match[2]}"`),
    });
  }
  return rows;
}

function buildSourceEvidence() {
  const evidence = {};
  const voicePlayer = readText('src/audio/voicePlayer.ts');
  const voiceCues = readText('src/movementProfileV2/voiceCues.ts');
  const live = readText('src/movementProfileV2/liveCoordinator.ts');
  const screen = readText('src/screens/MovementProfileV2CheckUpScreen.tsx');
  const app = readText('App.tsx');
  evidence.voiceChannelDrop = sourceRef('src/audio/voicePlayer.ts', lineNumberOf(voicePlayer, 'if (priority <= this.currentPriority) return false;'), 'lower-or-equal priority speak() calls return false while busy');
  evidence.voiceChannelInterrupt = sourceRef('src/audio/voicePlayer.ts', lineNumberOf(voicePlayer, 'this.stop();'), 'higher-priority speak() calls stop current playback before starting new request');
  evidence.voiceChannelCatch = sourceRef('src/audio/voicePlayer.ts', lineNumberOf(voicePlayer, "reason: 'missing_bundled_asset'"), 'missing asset/player creation errors are caught and skipped, with pending cues continuing');
  evidence.voiceChannelPlayCatch = sourceRef('src/audio/voicePlayer.ts', lineNumberOf(voicePlayer, "reason: 'playback_start_failed'"), 'playback start errors are caught and skipped, with pending cues continuing');
  evidence.listenerGuard = sourceRef('src/audio/voicePlayer.ts', lineNumberOf(voicePlayer, 'this.player !== player'), 'released/stale player completion callbacks are ignored by identity guard');
  evidence.initialEffect = sourceRef('src/screens/MovementProfileV2CheckUpScreen.tsx', lineNumberOf(screen, 'initialMovementProfileV2VoiceEvent();'), 'initial MPV2 intro is one speak() call on screen mount');
  evidence.voiceState = sourceRef('src/screens/MovementProfileV2CheckUpScreen.tsx', lineNumberOf(screen, 'new VoiceChannel(voiceId)'), 'VoiceChannel is captured in React state and is not rebuilt when voiceId prop changes');
  evidence.appStateStop = sourceRef('src/screens/MovementProfileV2CheckUpScreen.tsx', lineNumberOf(screen, 'voice.stop();'), 'unmount/background path stops voice playback');
  evidence.transitionEffect = sourceRef('src/screens/MovementProfileV2CheckUpScreen.tsx', lineNumberOf(screen, 'voiceSequencerRef.current.next(live)'), 'transition speech is emitted from a live snapshot effect');
  evidence.actionNoVoiceGate = sourceRef('src/screens/MovementProfileV2CheckUpScreen.tsx', lineNumberOf(screen, 'runLiveAction'), 'button actions call coordinator immediately and do not wait for voice completion');
  evidence.initialCues = sourceRef('src/movementProfileV2/voiceCues.ts', lineNumberOf(voiceCues, 'initialMovementProfileV2VoiceEvent'), 'initial cue sequence is mpv2_checkup_intro -> chair intro -> chair setup');
  evidence.transitionCues = sourceRef('src/movementProfileV2/voiceCues.ts', lineNumberOf(voiceCues, 'resolveMovementProfileV2CueIdsForTransition'), 'transition-to-cue mapping is defined in resolveMovementProfileV2CueIdsForTransition');
  evidence.eventPriority = sourceRef('src/movementProfileV2/voiceCues.ts', lineNumberOf(voiceCues, 'Math.max(...cues.map'), 'event priority is max priority across the sequence');
  evidence.transitionKey = sourceRef('src/movementProfileV2/voiceCues.ts', lineNumberOf(voiceCues, 'transition.atMs'), 'transition dedupe key includes timestamp, from/to/reason, movement epoch, and attempt epoch');
  evidence.countdown = sourceRef('src/movementProfileV2/liveCoordinator.ts', lineNumberOf(live, 'const COUNTDOWN_MS = 3000'), 'chair countdown is internal 3000 ms');
  evidence.chairActiveStart = sourceRef('src/movementProfileV2/liveCoordinator.ts', lineNumberOf(live, 'this.chair.startActive(startedAt)'), 'chair active measurement starts at countdownStartedAt + 3000 ms');
  evidence.chairDeadline = sourceRef('src/movementProfileV2/liveCoordinator.ts', lineNumberOf(live, 'this.recordChairResult(this.chair.finish(deadline)'), 'chair measurement stops at activeStartedAt + 30000 ms independent of audio');
  evidence.balanceRest = sourceRef('src/movementProfileV2/liveCoordinator.ts', lineNumberOf(live, 'const BALANCE_REST_MIN_MS = 30000'), 'balance minimum/default rest timers are 30000/60000 ms');
  evidence.balanceProtocol = sourceRef('src/movementProfileV2/liveCoordinator.ts', lineNumberOf(live, 'DEFAULT_ONE_LEG_BALANCE_V2_CONFIG.maxTrialMs'), 'current balance is one-leg, max 45000 ms, up to 3 valid trials');
  evidence.shoulderSide = sourceRef('src/movementProfileV2/liveCoordinator.ts', lineNumberOf(live, 'selectedSide: action.shoulderSide'), 'selected shoulder side is passed into setup and stored in flow/diagnostics');
  evidence.shoulderGrader = sourceRef('src/movementProfileV2/liveCoordinator.ts', lineNumberOf(live, 'shoulderReachAngleDegForSide(sample.output.frame, side)'), 'shoulder angle uses the current flow shoulder side');
  evidence.hingeNoVoiceStart = sourceRef('src/movementProfileV2/liveCoordinator.ts', lineNumberOf(live, "this.transition('hinge_active'"), 'hinge active starts on button action without a start cue');
  evidence.audioMode = sourceRef('src/audio/voicePlayer.ts', lineNumberOf(voicePlayer, 'setAudioModeAsync'), 'audio mode is configured for mixWithOthers, no recording, no background playback');
  evidence.configureSessionAudio = sourceRef('App.tsx', lineNumberOf(app, 'configureSessionAudio()'), 'audio configuration runs during app startup');
  return evidence;
}

function sourceRef(file, line, note) {
  return `${file}:${line} (${note})`;
}

function buildAssets(runtimeInput, canonicalRows, qcRows) {
  const byKey = new Map();
  for (const row of canonicalRows) {
    byKey.set(row.cueKey, row);
  }
  const qcByVoiceKey = new Map(qcRows.map((row) => [`${row.voiceId}:${row.cueKey}`, row]));
  const assets = [];
  for (const item of runtimeInput.assets) {
    const row = byKey.get(item.cueKey);
    assets.push({
      cueKey: item.cueKey,
      currentScript: item.expectedScript,
      priority: Number(item.priority) || Number(row?.currentPriority) || 0,
      requiredness: item.requiredness,
      voiceAssets: Object.fromEntries(VOICES.map((voice) => {
        const physicalKey = item.cueKey === 'chair-result-prefix-v21' ? 'you-completed' : item.cueKey;
        const source = item.voiceAssets?.[voice] ?? {};
        const qc = qcByVoiceKey.get(`${voice}:${physicalKey}`) ?? qcByVoiceKey.get(`${voice}:${item.cueKey}`) ?? {};
        return [voice, {
          path: source.path || qc.path || '',
          durationMs: Number(source.durationMs || qc.durationMs || 0),
          sha256: source.sha256 || qc.sha256 || '',
          currentSha256: source.path ? sha256File(source.path) : '',
          qcFlags: qc.outlierFlags || 'none',
        }];
      })),
    });
  }
  return assets;
}

function compareInputFreshness({ runtimeInput, canonicalRows, qcRows, liveDefinitions, assets }) {
  const differences = [];
  const liveByKey = new Map(liveDefinitions.map((row) => [row.cueKey, row]));
  const policyByKey = new Map(runtimeInput.currentCuePolicies.map((row) => [row.cueKey, row]));
  for (const [key, policy] of policyByKey.entries()) {
    const live = liveByKey.get(key);
    if (!live && key.startsWith('mpv2_')) differences.push({ type: 'missing_live_definition', cueKey: key });
    if (live && Number(policy.priority) !== Number(live.priority)) differences.push({ type: 'priority_drift', cueKey: key, input: policy.priority, live: live.priority });
  }
  for (const asset of assets) {
    for (const voice of VOICES) {
      const voiceAsset = asset.voiceAssets[voice];
      if (!voiceAsset.path || !fileExists(voiceAsset.path)) {
        differences.push({ type: 'missing_asset', cueKey: asset.cueKey, voice });
      } else if (voiceAsset.sha256 && voiceAsset.currentSha256 && voiceAsset.sha256 !== voiceAsset.currentSha256) {
        differences.push({ type: 'asset_hash_drift', cueKey: asset.cueKey, voice, input: voiceAsset.sha256, live: voiceAsset.currentSha256 });
      }
    }
  }
  if (runtimeInput.events.length !== 29) differences.push({ type: 'event_count_drift', input: runtimeInput.events.length, expected: 29 });
  if (runtimeInput.requiredScenarios.length !== 42) differences.push({ type: 'scenario_count_drift', input: runtimeInput.requiredScenarios.length, expected: 42 });
  const canonicalCueCount = canonicalRows.filter((row) => row.currentRuntimeReachability === 'runtime_reachable').length;
  if (canonicalCueCount !== 28) differences.push({ type: 'runtime_cue_count_drift', input: canonicalCueCount, expected: 28 });
  const classification = differences.length === 0 ? 'current_exact' : differences.every((d) => ['asset_hash_drift'].includes(d.type)) ? 'minor_nonsemantic_drift' : 'material_runtime_drift';
  return {
    classification,
    differenceCount: differences.length,
    differences,
    checked: {
      sourceDefinitions: liveDefinitions.length,
      canonicalRows: canonicalRows.length,
      qcRows: qcRows.length,
      eventGraphEntries: runtimeInput.events.length,
      scenarioIds: runtimeInput.requiredScenarios.length,
      assetEntries: assets.length,
    },
  };
}

function buildScenarioDefinitions(requiredScenarios) {
  return requiredScenarios.map((row) => ({
    scenarioId: row.id,
    category: row.category,
    timingSensitive: true,
    userActionVariants: row.category === 'user_control' ||
      ['initial_effect_speech_versus_first_user_action', 'rapid_user_action_during_speech', 'chair_practice_to_official_attempt'].includes(row.id),
  }));
}

function runSimulation({ scenarios, assets, sourceEvidence }) {
  const assetByKey = new Map(assets.map((asset) => [asset.cueKey, asset]));
  const scenarioOutputs = [];
  const timelineRows = [];
  let globalEventIndex = 0;
  for (const scenario of scenarios) {
    const voices = scenario.scenarioId === 'full_normal_mpv2_checkup_clara'
      ? ['clara']
      : scenario.scenarioId === 'full_normal_mpv2_checkup_marcus'
        ? ['marcus']
        : VOICES;
    const actionTimings = scenario.userActionVariants ? ACTION_TIMINGS : ['default'];
    const scenarioEntry = { scenarioId: scenario.scenarioId, category: scenario.category, variants: [] };
    for (const voice of voices) {
      for (const [latencyProfile, latency] of Object.entries(LATENCY_PROFILES)) {
        for (const actionTiming of actionTimings) {
          const variantId = `${scenario.scenarioId}:${voice}:${latencyProfile}:${actionTiming}`;
          const voiceModel = new VoiceModel({ voiceId: voice, latencyProfile, latency, assetByKey });
          const events = eventsForScenario(scenario.scenarioId, { voice, latency, actionTiming, assetByKey });
          const variantRows = [];
          for (const event of events) {
            globalEventIndex++;
            const produced = applyEvent({
              event,
              voiceModel,
              scenarioId: scenario.scenarioId,
              variantId,
              voiceId: voice,
              latencyProfile,
              eventIndex: globalEventIndex,
            });
            variantRows.push(...produced);
            timelineRows.push(...produced);
          }
          scenarioEntry.variants.push({
            variantId,
            voiceId: voice,
            latencyProfile,
            actionTiming,
            timelineRowCount: variantRows.length,
            outcomes: summarizeOutcomes(variantRows),
          });
        }
      }
    }
    scenarioOutputs.push(scenarioEntry);
  }
  return { scenarios: scenarioOutputs, timelineRows };
}

function applyEvent({ event, voiceModel, scenarioId, variantId, voiceId, latencyProfile, eventIndex }) {
  if (event.kind === 'speak') {
    return [voiceModel.speak({ ...event, scenarioId, variantId, voiceId, latencyProfile, eventIndex })];
  }
  if (event.kind === 'stop') {
    return [voiceModel.stop({ ...event, scenarioId, variantId, voiceId, latencyProfile, eventIndex })];
  }
  return [baseTimelineRow({
    scenarioId,
    variantId,
    voiceId,
    latencyProfile,
    eventIndex,
    eventId: event.eventId,
    controllerStateBefore: event.controllerStateBefore,
    controllerStateAfter: event.controllerStateAfter,
    eventScheduledAtMs: event.at,
    speakCalledAtMs: '',
    cueKeys: [],
    incomingPriority: event.priority ?? '',
    voiceBusyBefore: voiceModel.isBusyAt(event.at),
    currentPriority: voiceModel.currentPriorityAt(event.at),
    outcome: event.outcome ?? 'not_emitted',
    measurementStartsAtMs: event.measurementStartsAtMs ?? '',
    measurementEndsAtMs: event.measurementEndsAtMs ?? '',
    stateExitAtMs: event.stateExitAtMs ?? '',
    staleAfterStateExit: false,
    userImpact: event.userImpact ?? '',
    confidence: event.confidence ?? 'confirmed_source',
    notes: event.notes ?? '',
  })];
}

class VoiceModel {
  constructor({ voiceId, latencyProfile, latency, assetByKey }) {
    this.voiceId = voiceId;
    this.latencyProfile = latencyProfile;
    this.latency = latency;
    this.assetByKey = assetByKey;
    this.current = null;
  }

  isBusyAt(nowMs) {
    return this.current !== null && nowMs < this.current.completionCallbackAtMs;
  }

  currentPriorityAt(nowMs) {
    return this.isBusyAt(nowMs) ? this.current.priority : '';
  }

  speak(event) {
    const busy = this.isBusyAt(event.at);
    const currentPriority = this.currentPriorityAt(event.at);
    const incomingPriority = event.priority ?? priorityFor(event.cueKeys, this.assetByKey);
    if (busy && incomingPriority <= currentPriority) {
      return baseTimelineRow({
        scenarioId: event.scenarioId,
        variantId: event.variantId,
        voiceId: event.voiceId,
        latencyProfile: event.latencyProfile,
        eventIndex: event.eventIndex,
        eventId: event.eventId,
        controllerStateBefore: event.controllerStateBefore,
        controllerStateAfter: event.controllerStateAfter,
        eventScheduledAtMs: event.at,
        speakCalledAtMs: event.at,
        cueKeys: event.cueKeys,
        incomingPriority,
        voiceBusyBefore: true,
        currentPriority,
        outcome: incomingPriority === currentPriority ? 'dropped_equal_priority' : 'dropped_lower_priority',
        measurementStartsAtMs: event.measurementStartsAtMs ?? '',
        measurementEndsAtMs: event.measurementEndsAtMs ?? '',
        stateExitAtMs: event.stateExitAtMs ?? '',
        timingMarginMs: event.timingMarginMs ?? '',
        staleAfterStateExit: false,
        userImpact: event.userImpact ?? 'incoming cue not heard because the channel is busy',
        confidence: 'confirmed_deterministic_model',
        notes: event.notes ?? '',
      });
    }
    if (busy && incomingPriority > currentPriority && this.current?.row) {
      this.current.row.outcome = 'played_partially_then_interrupted';
      this.current.row.playbackEndEstimatedAtMs = event.at;
      this.current.row.completionCallbackAtMs = event.at;
      this.current.row.notes = appendNote(this.current.row.notes, `Interrupted by ${event.eventId} at ${event.at}ms.`);
    }
    const timing = sequenceTiming(event.cueKeys, this.voiceId, this.assetByKey, this.latency);
    const row = baseTimelineRow({
      scenarioId: event.scenarioId,
      variantId: event.variantId,
      voiceId: event.voiceId,
      latencyProfile: event.latencyProfile,
      eventIndex: event.eventIndex,
      eventId: event.eventId,
      controllerStateBefore: event.controllerStateBefore,
      controllerStateAfter: event.controllerStateAfter,
      eventScheduledAtMs: event.at,
      speakCalledAtMs: event.at,
      cueKeys: event.cueKeys,
      incomingPriority,
      voiceBusyBefore: busy,
      currentPriority,
      audibleStartEstimatedAtMs: event.at + this.latency.startupDelayMs,
      assetDurationMs: timing.assetDurationMs,
      sequenceDurationMs: timing.sequenceDurationMs,
      playbackEndEstimatedAtMs: event.at + timing.playbackEndOffsetMs,
      completionCallbackAtMs: event.at + timing.completionOffsetMs,
      measurementStartsAtMs: event.measurementStartsAtMs ?? '',
      measurementEndsAtMs: event.measurementEndsAtMs ?? '',
      stateExitAtMs: event.stateExitAtMs ?? '',
      outcome: 'played_fully',
      timingMarginMs: event.timingMarginMs ?? timingMargin(event, event.at + this.latency.startupDelayMs, event.at + timing.playbackEndOffsetMs),
      staleAfterStateExit: event.stateExitAtMs !== undefined && event.stateExitAtMs !== '' && event.at + timing.playbackEndOffsetMs > Number(event.stateExitAtMs),
      userImpact: event.userImpact ?? '',
      confidence: event.confidence ?? 'confirmed_deterministic_model',
      notes: event.notes ?? '',
    });
    if (row.staleAfterStateExit === true) row.outcome = 'continued_stale_after_state_exit';
    this.current = {
      priority: incomingPriority,
      completionCallbackAtMs: event.at + timing.completionOffsetMs,
      playbackEndEstimatedAtMs: event.at + timing.playbackEndOffsetMs,
      row,
    };
    return row;
  }

  stop(event) {
    const busy = this.isBusyAt(event.at);
    let outcome = 'not_applicable';
    if (busy && this.current?.row) {
      this.current.row.outcome = 'cancelled_on_stop';
      this.current.row.playbackEndEstimatedAtMs = event.at;
      this.current.row.completionCallbackAtMs = event.at;
      this.current.row.notes = appendNote(this.current.row.notes, `Cancelled by ${event.eventId}.`);
      outcome = 'cancelled_on_stop';
    }
    this.current = null;
    return baseTimelineRow({
      scenarioId: event.scenarioId,
      variantId: event.variantId,
      voiceId: event.voiceId,
      latencyProfile: event.latencyProfile,
      eventIndex: event.eventIndex,
      eventId: event.eventId,
      controllerStateBefore: event.controllerStateBefore,
      controllerStateAfter: event.controllerStateAfter,
      eventScheduledAtMs: event.at,
      speakCalledAtMs: '',
      cueKeys: [],
      incomingPriority: '',
      voiceBusyBefore: busy,
      currentPriority: busy ? 'cleared' : '',
      outcome,
      stateExitAtMs: event.at,
      staleAfterStateExit: false,
      userImpact: event.userImpact ?? 'voice channel stopped and pending cues cleared',
      confidence: 'confirmed_source',
      notes: event.notes ?? '',
    });
  }
}

function eventsForScenario(id, ctx) {
  if (id === 'full_normal_mpv2_checkup_clara' || id === 'full_normal_mpv2_checkup_marcus') return fullNormalEvents(ctx);
  if (id === 'initial_effect_speech_versus_first_user_action' || id === 'retry_during_intro' || id === 'rapid_user_action_during_speech') return initialActionCollisionEvents(ctx);
  if (id === 'chair_practice_to_official_attempt' || id === 'countdown_versus_operational_cue' || id === 'go_audible_onset_timing') return chairCountdownEvents(ctx);
  if (id === 'timer_event_while_prior_cue_playing') return timerWhileSpeechEvents(ctx);
  if (id === 'equal_priority_event_while_busy') return equalPriorityEvents(ctx);
  if (id === 'higher_priority_event_while_busy' || id === 'recovery_event_during_speech') return higherPriorityEvents(ctx);
  if (id === 'required_cue_missing' || id === 'required_asset_resolution_throws') return failureScenarioEvents(id, ctx, 'skipped_resolution_error');
  if (id === 'playback_creation_fails') return failureScenarioEvents(id, ctx, 'skipped_playback_creation_error');
  if (id === 'playback_start_callback_fails') return failureScenarioEvents(id, ctx, 'skipped_playback_start_error');
  if (id === 'cue_completes_after_state_exit' || id === 'navigation_unmount_during_speech') return stateExitEvents(ctx);
  if (id === 'times_up_during_another_cue') return timesUpInterruptEvents(ctx);
  if (id === 'result_completion_transition_while_prior_cue_busy') return resultCollisionEvents(ctx);
  if (id === 'balance_valid_attempt_rest_next_attempt') return balanceValidEvents(ctx);
  if (id === 'balance_invalid_tracking_retry' || id === 'repeated_tracking_loss_event' || id === 'tracking_recovery_before_loss_cue_finishes') return balanceRetryEvents(ctx);
  if (id === 'balance_full_hold_ceiling') return balanceFullHoldEvents(ctx);
  if (id === 'balance_use_best' || id === 'retry_during_balance_rest') return balanceUseBestEvents(ctx);
  if (id === 'balance_default_ready_after_60') return balanceDefaultRestEvents(ctx);
  if (id === 'shoulder_left') return shoulderEvents(ctx, 'left');
  if (id === 'shoulder_right') return shoulderEvents(ctx, 'right');
  if (id === 'retry_during_chair_practice' || id === 'retry_during_official_attempt') return retrySilentEvents(id);
  if (id === 'recovery_screen_retry') return recoveryScreenEvents();
  if (id === 'app_background_foreground') return backgroundEvents(ctx);
  if (id === 'voice_change_while_screen_mounted_channel_exists') return voiceChangeEvents(ctx);
  if (id === 'hinge_valid_result' || id === 'completion') return hingeCompletionEvents(ctx, true);
  if (id === 'hinge_no_measurement') return hingeCompletionEvents(ctx, false);
  if (id === 'priority_50_100_mapping' || id === 'droppable_setup_reassurance_cues') return priorityPolicyEvents(ctx);
  if (id === 'fail_closed_required_cue_behavior') return failureScenarioEvents(id, ctx, 'skipped_resolution_error');
  if (id === 'no_stale_mpv2_operational_cue_after_state_change') return stateExitEvents(ctx);
  if (id === 'clara_marcus_duration_differences_do_not_alter_state_outcome') return chairCountdownEvents(ctx);
  return genericScenarioEvents(id, ctx);
}

function fullNormalEvents(ctx) {
  const events = [];
  let t = 0;
  events.push(speak('mpv2_entry_initial_intro', 'screen_mount', 'chair_setup', t, [
    'mpv2_checkup_intro',
    'checkup-chair-stand-intro-v21',
    'checkup-chair-stand-setup-v21',
  ], 'Initial intro sequence; in normal path user waits for speech.'));
  t += seqMs(['mpv2_checkup_intro', 'checkup-chair-stand-intro-v21', 'checkup-chair-stand-setup-v21'], ctx) + 500;
  events.push(speak('chair_setup_confirmed_to_practice', 'chair_setup', 'chair_practice', t, ['mpv2_chair_practice_start']));
  t += seqMs(['mpv2_chair_practice_start'], ctx) + 2000;
  const officialAt = t;
  events.push(speak('chair_practice_completed_to_countdown', 'chair_practice', 'chair_countdown', officialAt, ['mpv2_chair_official_ready'], 'Internal countdown starts with this cue.', {
    measurementStartsAtMs: officialAt + 3000,
    timingMarginMs: 3000 - seqPlaybackMs(['mpv2_chair_official_ready'], ctx),
    userImpact: 'chair active window starts without spoken go and before this cue ends',
  }));
  events.push(noCue('chair_countdown_elapsed_to_active', 'chair_countdown', 'chair_active', officialAt + 3000, {
    outcome: 'not_emitted',
    measurementStartsAtMs: officialAt + 3000,
    userImpact: 'no countdown-three/two/one/go cue emitted',
    notes: 'Measurement starts from coordinator timer only.',
  }));
  t = officialAt + 33000;
  events.push(speak('chair_deadline_to_balance_setup', 'chair_active', 'balance_setup', t, [
    'times-up-v21',
    'checkup-balance-intro-v21',
    'checkup-balance-single-leg-v21',
  ], 'Chair measurement stops independent of speech.', { measurementEndsAtMs: t }));
  t += seqMs(['times-up-v21', 'checkup-balance-intro-v21', 'checkup-balance-single-leg-v21'], ctx) + 500;
  events.push(speak('balance_setup_confirmed_to_ready', 'balance_setup', 'balance_ready', t, ['mpv2_balance_attempt_start']));
  t += seqMs(['mpv2_balance_attempt_start'], ctx) + 1000;
  events.push(speak('balance_lift_detected_to_trial', 'balance_ready', 'balance_trial', t, ['mpv2_balance_attempt_start'], 'Foot lift starts balance measurement.', { measurementStartsAtMs: t }));
  t += 10000;
  events.push(speak('balance_valid_trial_to_rest', 'balance_trial', 'balance_rest', t, ['mpv2_balance_attempt_saved', 'mpv2_balance_rest'], '', { measurementEndsAtMs: t }));
  t += 30000;
  events.push(speak('balance_rest_ready_after_30', 'balance_rest', 'balance_ready', t, ['mpv2_balance_ready_after_30']));
  t += seqMs(['mpv2_balance_ready_after_30'], ctx) + 1000;
  events.push(speak('balance_user_accepted_best', 'balance_ready', 'shoulder_setup', t, ['mpv2_balance_use_best', 'mpv2_balance_complete']));
  t += seqMs(['mpv2_balance_use_best', 'mpv2_balance_complete'], ctx) + 500;
  events.push(speak('shoulder_setup_confirmed_right', 'shoulder_setup', 'shoulder_ready', t, [
    'checkup-shoulder-turn-right-v21',
    'checkup-shoulder-raise-right-v21',
    'final-position-set-v21',
  ]));
  t += seqMs(['checkup-shoulder-turn-right-v21', 'checkup-shoulder-raise-right-v21', 'final-position-set-v21'], ctx) + 500;
  events.push(noCue('shoulder_capture_started', 'shoulder_ready', 'shoulder_active', t, {
    outcome: 'not_emitted',
    measurementStartsAtMs: t,
    notes: 'Shoulder capture starts on button action; no active-start voice cue.',
  }));
  t += 9000;
  events.push(speak('shoulder_section_complete_to_hinge', 'shoulder_active', 'hinge_setup', t, [
    'item-complete-v21',
    'checkup-hinge-setup-v21',
    'final-position-set-v21',
  ], '', { measurementEndsAtMs: t }));
  t += seqMs(['item-complete-v21', 'checkup-hinge-setup-v21', 'final-position-set-v21'], ctx) + 500;
  events.push(noCue('hinge_capture_started', 'hinge_setup', 'hinge_active', t, {
    outcome: 'not_emitted',
    measurementStartsAtMs: t,
    notes: 'Hinge capture starts on button action; no active-start voice cue.',
  }));
  t += 9000;
  events.push(speak('hinge_recorded_valid', 'hinge_active', 'raw_complete', t, [
    'mpv2_hinge_complete',
    'checkup-complete-v21',
  ], '', { measurementEndsAtMs: t, stateExitAtMs: t + seqMs(['mpv2_hinge_complete', 'checkup-complete-v21'], ctx) + 500 }));
  events.push(stop('navigation_state_exit', 'raw_complete', 'unmounted', t + seqMs(['mpv2_hinge_complete', 'checkup-complete-v21'], ctx) + 500));
  return events;
}

function initialActionCollisionEvents(ctx) {
  const actionAt = actionTime(ctx, ['mpv2_checkup_intro', 'checkup-chair-stand-intro-v21', 'checkup-chair-stand-setup-v21']);
  return [
    speak('mpv2_entry_initial_intro', 'screen_mount', 'chair_setup', 0, [
      'mpv2_checkup_intro',
      'checkup-chair-stand-intro-v21',
      'checkup-chair-stand-setup-v21',
    ]),
    speak('chair_setup_confirmed_to_practice', 'chair_setup', 'chair_practice', actionAt, ['mpv2_chair_practice_start'], 'Confirm setup button is available before intro speech completes.', {
      userImpact: 'practice-start instruction may be dropped before the user hears it',
    }),
  ];
}

function chairCountdownEvents(ctx) {
  const practiceAt = 0;
  const officialAt = ctx.actionTiming === 'after_current_speech'
    ? seqMs(['mpv2_chair_practice_start'], ctx) + 500
    : ctx.actionTiming === 'after_250ms'
      ? 250
      : 0;
  return [
    speak('chair_setup_confirmed_to_practice', 'chair_setup', 'chair_practice', practiceAt, ['mpv2_chair_practice_start']),
    speak('chair_practice_completed_to_countdown', 'chair_practice', 'chair_countdown', officialAt, ['mpv2_chair_official_ready'], 'Practice can complete while the practice cue is still playing.', {
      measurementStartsAtMs: officialAt + 3000,
      timingMarginMs: 3000 - seqPlaybackMs(['mpv2_chair_official_ready'], ctx),
      userImpact: 'official 30-second measurement starts without an audible go and before ready cue end',
    }),
    noCue('chair_countdown_elapsed_to_active', 'chair_countdown', 'chair_active', officialAt + 3000, {
      measurementStartsAtMs: officialAt + 3000,
      userImpact: 'missing audible start signal',
      notes: 'No countdown-three/two/one/go emitted by current MPV2.',
    }),
  ];
}

function timerWhileSpeechEvents(ctx) {
  return [
    speak('chair_practice_completed_to_countdown', 'chair_practice', 'chair_countdown', 0, ['mpv2_chair_official_ready'], '', {
      measurementStartsAtMs: 3000,
      timingMarginMs: 3000 - seqPlaybackMs(['mpv2_chair_official_ready'], ctx),
      userImpact: 'timer reaches active state while official-ready cue is still audible',
    }),
    noCue('chair_countdown_elapsed_to_active', 'chair_countdown', 'chair_active', 3000, {
      measurementStartsAtMs: 3000,
      userImpact: 'active measurement begins while prior cue may still be playing',
    }),
  ];
}

function equalPriorityEvents() {
  return [
    speak('balance_valid_trial_to_rest', 'balance_trial', 'balance_rest', 0, ['mpv2_balance_attempt_saved', 'mpv2_balance_rest']),
    speak('balance_user_accepted_best', 'balance_rest', 'shoulder_setup', 250, ['mpv2_balance_use_best', 'mpv2_balance_complete'], 'Equal-priority completion branch can be requested while rest narration is busy.'),
  ];
}

function higherPriorityEvents() {
  return [
    speak('mpv2_setup_guidance_low_priority', 'balance_ready', 'balance_trial', 0, ['mpv2_balance_attempt_start']),
    speak('mpv2_tracking_retry_high_priority', 'balance_trial', 'balance_rest', 250, ['mpv2_balance_tracking_retry'], 'Recovery priority 100 interrupts active-transition priority 60.'),
  ];
}

function failureScenarioEvents(id, ctx, outcome) {
  return [
    {
      kind: 'failure',
      eventId: id,
      controllerStateBefore: 'chair_setup',
      controllerStateAfter: 'chair_practice',
      at: 0,
      cueKeys: ['mpv2_chair_practice_start'],
      priority: 60,
      outcome,
      userImpact: 'required instruction is skipped; controller would still progress in current implementation',
      notes: 'Failure injection is modelled without modifying physical assets.',
    },
  ];
}

function stateExitEvents(ctx) {
  return [
    speak('hinge_recorded_valid', 'hinge_active', 'raw_complete', 0, ['mpv2_hinge_complete', 'checkup-complete-v21'], 'Completion speech begins at raw_complete.', {
      stateExitAtMs: ctx.actionTiming === 'after_current_speech' ? seqMs(['mpv2_hinge_complete', 'checkup-complete-v21'], ctx) + 500 : ctx.actionTiming === 'after_250ms' ? 250 : 0,
      userImpact: 'completion narration can be cancelled by navigation/unmount',
    }),
    stop('navigation_state_exit', 'raw_complete', 'unmounted', ctx.actionTiming === 'after_current_speech' ? seqMs(['mpv2_hinge_complete', 'checkup-complete-v21'], ctx) + 500 : ctx.actionTiming === 'after_250ms' ? 250 : 0),
  ];
}

function timesUpInterruptEvents() {
  return [
    speak('mpv2_balance_tracking_retry_busy', 'balance_trial', 'balance_rest', 0, ['mpv2_balance_tracking_retry']),
    speak('chair_deadline_to_balance_setup', 'chair_active', 'balance_setup', 250, ['times-up-v21', 'checkup-balance-intro-v21', 'checkup-balance-single-leg-v21'], 'Both incoming and current are priority 100, so times-up is dropped if a critical cue is busy.', {
      measurementEndsAtMs: 250,
      userImpact: 'stop cue may be dropped in equal-priority collision',
    }),
  ];
}

function resultCollisionEvents() {
  return [
    speak('chair_deadline_to_balance_setup', 'chair_active', 'balance_setup', 0, ['times-up-v21', 'checkup-balance-intro-v21', 'checkup-balance-single-leg-v21']),
    speak('balance_setup_confirmed_to_ready', 'balance_setup', 'balance_ready', 250, ['mpv2_balance_attempt_start'], 'User can confirm balance setup while transition sequence is still priority 100.', {
      userImpact: 'attempt-start cue is dropped by still-playing chair transition sequence',
    }),
  ];
}

function balanceValidEvents() {
  return [
    speak('balance_setup_confirmed_to_ready', 'balance_setup', 'balance_ready', 0, ['mpv2_balance_attempt_start']),
    speak('balance_lift_detected_to_trial', 'balance_ready', 'balance_trial', 250, ['mpv2_balance_attempt_start'], 'Same cue can be emitted from ready and trial transitions; dedupe key differs by stage/attempt.', {
      measurementStartsAtMs: 250,
    }),
    speak('balance_valid_trial_to_rest', 'balance_trial', 'balance_rest', 10000, ['mpv2_balance_attempt_saved', 'mpv2_balance_rest'], '', { measurementEndsAtMs: 10000 }),
    speak('balance_rest_ready_after_30', 'balance_rest', 'balance_ready', 40000, ['mpv2_balance_ready_after_30']),
  ];
}

function balanceRetryEvents() {
  return [
    speak('balance_setup_confirmed_to_ready', 'balance_setup', 'balance_ready', 0, ['mpv2_balance_attempt_start']),
    noCue('balance_lift_detected_measurement_start', 'balance_ready', 'balance_trial', 1000, { measurementStartsAtMs: 1000 }),
    speak('balance_invalid_trial_to_rest', 'balance_trial', 'balance_rest', 2000, ['mpv2_balance_tracking_retry'], 'Tracking invalidates attempt and enters rest.', {
      measurementEndsAtMs: 2000,
      userImpact: 'retry guidance is spoken, but tracking-loss/recovered shared cues are not emitted',
    }),
    noCue('tracking_loss_defined_not_emitted', 'balance_trial', 'balance_rest', 2000, {
      outcome: 'not_emitted',
      userImpact: 'tracking-loss-v21 and tracking-recovered-v21 are bundled but silent in current MPV2',
    }),
  ];
}

function balanceFullHoldEvents() {
  return [
    speak('balance_lift_detected_to_trial', 'balance_ready', 'balance_trial', 0, ['mpv2_balance_attempt_start'], '', { measurementStartsAtMs: 0 }),
    speak('balance_section_complete_ceiling', 'balance_trial', 'shoulder_setup', 45000, ['mpv2_balance_full_hold', 'mpv2_balance_complete'], '', { measurementEndsAtMs: 45000 }),
  ];
}

function balanceUseBestEvents(ctx) {
  const useAt = ctx.actionTiming === 'after_current_speech'
    ? seqMs(['mpv2_balance_attempt_saved', 'mpv2_balance_rest'], ctx) + 500
    : ctx.actionTiming === 'after_250ms'
      ? 250
      : 0;
  return [
    speak('balance_valid_trial_to_rest', 'balance_trial', 'balance_rest', 0, ['mpv2_balance_attempt_saved', 'mpv2_balance_rest']),
    speak('balance_user_accepted_best', 'balance_rest', 'shoulder_setup', useAt, ['mpv2_balance_use_best', 'mpv2_balance_complete'], 'Use-best action is available while rest narration may still be playing.'),
  ];
}

function balanceDefaultRestEvents() {
  return [
    speak('balance_valid_trial_to_rest', 'balance_trial', 'balance_rest', 0, ['mpv2_balance_attempt_saved', 'mpv2_balance_rest']),
    speak('balance_default_rest_elapsed', 'balance_rest', 'balance_ready', 60000, ['mpv2_balance_ready_after_60']),
  ];
}

function shoulderEvents(ctx, side) {
  const turn = side === 'left' ? 'checkup-shoulder-turn-left-v21' : 'checkup-shoulder-turn-right-v21';
  const raise = side === 'left' ? 'checkup-shoulder-raise-left-v21' : 'checkup-shoulder-raise-right-v21';
  const confirmAt = ctx.actionTiming === 'after_current_speech'
    ? seqMs(['mpv2_balance_use_best', 'mpv2_balance_complete'], ctx) + 500
    : ctx.actionTiming === 'after_250ms'
      ? 250
      : 0;
  return [
    speak('balance_user_accepted_best', 'balance_rest', 'shoulder_setup', 0, ['mpv2_balance_use_best', 'mpv2_balance_complete']),
    speak(`shoulder_setup_confirmed_${side}`, 'shoulder_setup', 'shoulder_ready', confirmAt, [turn, raise, 'final-position-set-v21'], 'Selected side determines turn and raise cues; grader reads same flow side.', {
      userImpact: 'side-specific setup cues can be dropped if user confirms while balance completion is busy',
    }),
    noCue('shoulder_capture_started', 'shoulder_ready', 'shoulder_active', confirmAt + 1000, { measurementStartsAtMs: confirmAt + 1000 }),
  ];
}

function retrySilentEvents(id) {
  return [
    noCue(id, 'current_stage', 'same_or_restarted_stage', 0, {
      outcome: 'not_emitted',
      userImpact: 'No explicit retry-v21 cue is wired for this branch.',
      notes: 'Current MPV2 has no generic retry user action in the live screen.',
    }),
  ];
}

function recoveryScreenEvents() {
  return [
    noCue('recovery_screen_retry_branch', 'recovery_screen', 'checkup_restart_or_navigation', 0, {
      outcome: 'not_emitted',
      userImpact: 'Recovery screen is visual only; retry/use-saved/open-profile actions have no voice guidance.',
    }),
  ];
}

function backgroundEvents(ctx) {
  return [
    speak('balance_lift_detected_to_trial', 'balance_ready', 'balance_trial', 0, ['mpv2_balance_attempt_start'], '', { measurementStartsAtMs: 0 }),
    stop('app_background_voice_stop', 'balance_trial', 'balance_rest_backgrounded', 1000, 'voice.stop() is called in AppState background handler.'),
    speak('balance_invalid_trial_to_rest_after_background', 'balance_trial', 'balance_rest', 1000, ['mpv2_balance_tracking_retry'], 'The live snapshot effect can still see the background-induced transition after voice.stop().', {
      userImpact: 'background transition can create silent or stale recovery context; foreground does not replay essential guidance',
    }),
    noCue('app_foreground_resume', 'backgrounded', 'balance_rest', 5000, {
      outcome: 'not_emitted',
      userImpact: 'foreground resume does not replay essential context',
    }),
  ];
}

function voiceChangeEvents() {
  return [
    speak('mpv2_entry_initial_intro', 'screen_mount', 'chair_setup', 0, ['mpv2_checkup_intro']),
    noCue('voice_change_while_mounted', 'mounted_with_initial_voice', 'mounted_with_same_voice_channel', 500, {
      outcome: 'not_applicable',
      userImpact: 'VoiceChannel is created once in React state; changing prefs voiceId while mounted does not rebuild the channel.',
    }),
  ];
}

function hingeCompletionEvents(ctx, valid) {
  const keys = [valid ? 'mpv2_hinge_complete' : 'mpv2_hinge_no_measurement', 'checkup-complete-v21'];
  return [
    noCue('hinge_capture_started', 'hinge_setup', 'hinge_active', 0, { measurementStartsAtMs: 0 }),
    speak(valid ? 'hinge_recorded_valid' : 'hinge_recorded_invalid', 'hinge_active', 'raw_complete', 9000, keys, 'Hinge completion and check-up completion are one speak() sequence.', {
      measurementEndsAtMs: 9000,
      stateExitAtMs: ctx.actionTiming === 'after_current_speech' ? 9000 + seqMs(keys, ctx) + 500 : 9000,
      userImpact: valid ? 'completion can be cancelled by immediate navigation' : 'no-measurement is spoken, not silent, if not cancelled',
    }),
  ];
}

function priorityPolicyEvents() {
  return [
    speak('setup_priority_60', 'chair_setup', 'chair_practice', 0, ['mpv2_chair_practice_start']),
    speak('completion_priority_70', 'balance_trial', 'balance_rest', 250, ['mpv2_balance_attempt_saved'], 'Priority 70 interrupts setup priority 60.'),
    speak('critical_priority_100', 'balance_trial', 'balance_rest', 500, ['mpv2_balance_tracking_retry'], 'Priority 100 interrupts completion priority 70.'),
  ];
}

function genericScenarioEvents(id, ctx) {
  return [
    speak(id, 'generic_before', 'generic_after', 0, ['mpv2_balance_attempt_start'], 'Generic coverage row for prepared scenario id.'),
  ];
}

function speak(eventId, before, after, at, cueKeys, notes = '', extra = {}) {
  return {
    kind: 'speak',
    eventId,
    controllerStateBefore: before,
    controllerStateAfter: after,
    at,
    cueKeys,
    priority: extra.priority,
    notes,
    ...extra,
  };
}

function noCue(eventId, before, after, at, extra = {}) {
  return {
    kind: 'noCue',
    eventId,
    controllerStateBefore: before,
    controllerStateAfter: after,
    at,
    ...extra,
  };
}

function stop(eventId, before, after, at, notes = '') {
  return {
    kind: 'stop',
    eventId,
    controllerStateBefore: before,
    controllerStateAfter: after,
    at,
    notes,
  };
}

function actionTime(ctx, cueKeys) {
  if (ctx.actionTiming === 'after_current_speech') return seqMs(cueKeys, ctx) + 500;
  if (ctx.actionTiming === 'after_250ms') return 250;
  return 0;
}

function seqMs(cueKeys, ctx) {
  return sequenceTiming(cueKeys, ctx.voice, ctx.assetByKey, ctx.latency).completionOffsetMs;
}

function seqPlaybackMs(cueKeys, ctx) {
  return sequenceTiming(cueKeys, ctx.voice, ctx.assetByKey, ctx.latency).playbackEndOffsetMs;
}

function sequenceTiming(cueKeys, voiceId, assetByKey, latency) {
  let assetDurationMs = 0;
  let playbackEndOffsetMs = 0;
  let completionOffsetMs = 0;
  for (const cueKey of cueKeys) {
    const duration = durationFor(cueKey, voiceId, assetByKey);
    assetDurationMs += duration;
    playbackEndOffsetMs = completionOffsetMs + latency.startupDelayMs + duration;
    completionOffsetMs = playbackEndOffsetMs + latency.completionDelayMs;
  }
  return {
    assetDurationMs,
    playbackEndOffsetMs,
    completionOffsetMs,
    sequenceDurationMs: completionOffsetMs,
  };
}

function durationFor(cueKey, voiceId, assetByKey) {
  const asset = assetByKey.get(cueKey);
  return Number(asset?.voiceAssets?.[voiceId]?.durationMs ?? 0);
}

function priorityFor(cueKeys, assetByKey) {
  return Math.max(...cueKeys.map((cueKey) => Number(assetByKey.get(cueKey)?.priority ?? 0)), 0);
}

function timingMargin(event, audibleStart, playbackEnd) {
  if (event.measurementStartsAtMs !== undefined && event.measurementStartsAtMs !== '') {
    return Number(event.measurementStartsAtMs) - playbackEnd;
  }
  return '';
}

function baseTimelineRow(input) {
  const row = {};
  for (const column of TIMELINE_COLUMNS) row[column] = input[column] ?? '';
  row.cueKeys = Array.isArray(row.cueKeys) ? row.cueKeys.join(';') : row.cueKeys;
  row.voiceBusyBefore = row.voiceBusyBefore === true ? 'true' : row.voiceBusyBefore === false ? 'false' : row.voiceBusyBefore;
  row.staleAfterStateExit = row.staleAfterStateExit === true ? 'true' : row.staleAfterStateExit === false ? 'false' : row.staleAfterStateExit;
  return row;
}

function summarizeOutcomes(rows) {
  const out = {};
  for (const row of rows) out[row.outcome] = (out[row.outcome] ?? 0) + 1;
  return out;
}

function appendNote(existing, note) {
  return existing ? `${existing} ${note}` : note;
}

function buildFailureInjectionResults(timelineRows, sourceEvidence) {
  const cases = [
    ['missing_clara_asset', 'clara', 'mpv2_chair_practice_start', 'skipped_missing_asset', 'first cue missing for selected voice'],
    ['missing_marcus_asset', 'marcus', 'mpv2_chair_practice_start', 'skipped_missing_asset', 'first cue missing for selected voice'],
    ['manifest_lookup_throw', 'clara', 'mpv2_chair_practice_start', 'skipped_resolution_error', 'resolver throws required MPV2 cue error'],
    ['player_creation_throw', 'clara', 'mpv2_chair_practice_start', 'skipped_playback_creation_error', 'createAudioPlayer unavailable or malformed'],
    ['playback_start_throw', 'clara', 'mpv2_chair_practice_start', 'skipped_playback_start_error', 'player.play throws'],
    ['no_completion_callback', 'clara', 'mpv2_balance_attempt_start', 'statically_indeterminate', 'channel remains busy until interrupted or stopped'],
    ['late_completion_after_stop', 'clara', 'mpv2_balance_attempt_start', 'cancelled_on_stop', 'listener identity guard ignores released player callback'],
    ['multi_sequence_first_cue_failure', 'clara', 'mpv2_hinge_complete;checkup-complete-v21', 'skipped_resolution_error', 'first cue skipped, pending completion cue continues'],
    ['multi_sequence_middle_cue_failure', 'clara', 'mpv2_checkup_intro;checkup-chair-stand-intro-v21;checkup-chair-stand-setup-v21', 'skipped_resolution_error', 'middle cue skipped, final setup cue continues'],
    ['multi_sequence_final_cue_failure', 'clara', 'mpv2_hinge_complete;checkup-complete-v21', 'skipped_resolution_error', 'final cue skipped, busy state clears'],
  ];
  return cases.map(([caseId, voiceId, cueKeys, outcome, injectedFailure]) => ({
    caseId,
    voiceId,
    cueKeys: cueKeys.split(';'),
    injectedFailure,
    outcome,
    whatUserHears:
      caseId.includes('multi_sequence_middle')
        ? 'first and final cues only'
        : caseId.includes('multi_sequence_first')
          ? 'remaining pending cues only'
          : caseId.includes('multi_sequence_final')
            ? 'earlier cues only'
            : outcome === 'statically_indeterminate'
              ? 'current cue may audibly play, but future lower/equal cues remain blocked if completion callback never arrives'
              : 'nothing for the failed cue',
    pendingCuesContinue: !caseId.includes('final') && !caseId.includes('no_completion'),
    busyStateClears: !caseId.includes('no_completion_callback'),
    controllerProgresses: true,
    measurementStarts: ['missing_clara_asset', 'missing_marcus_asset', 'manifest_lookup_throw', 'player_creation_throw', 'playback_start_throw'].includes(caseId),
    visibleFallbackExists: false,
    retryPossible: 'manual navigation/retry only; no controller-level voice retry gate',
    currentTestCoverage:
      'src/audio/__tests__/voicePlayer.test.ts covers missing/playback-start and priority interruption; no test covers no-completion callback or multi-cue failure positions.',
    sourceEvidence: `${sourceEvidence.voiceChannelCatch}; ${sourceEvidence.voiceChannelPlayCatch}`,
  }));
}

function failureInjectionTimelineRows(results) {
  return results.map((result, index) => baseTimelineRow({
    scenarioId: result.caseId,
    variantId: `${result.caseId}:${result.voiceId}:injected`,
    voiceId: result.voiceId,
    latencyProfile: 'injected_failure',
    eventIndex: 100000 + index,
    eventId: result.caseId,
    controllerStateBefore: 'varies',
    controllerStateAfter: result.controllerProgresses ? 'progresses_without_voice_block' : 'blocked',
    eventScheduledAtMs: 0,
    speakCalledAtMs: 0,
    cueKeys: result.cueKeys,
    incomingPriority: '',
    voiceBusyBefore: false,
    currentPriority: '',
    outcome: result.outcome,
    userImpact: result.whatUserHears,
    confidence: 'confirmed_deterministic_model',
    notes: result.injectedFailure,
  }));
}

function buildFindings({ timelineRows, failureInjectionResults, sourceEvidence }) {
  const finding = (input) => ({
    findingId: input.findingId,
    severity: input.severity,
    type: input.type,
    title: input.title,
    affectedScenarioIds: input.affectedScenarioIds.join(';'),
    affectedCueKeys: input.affectedCueKeys.join(';'),
    affectedVoices: input.affectedVoices.join(';'),
    deterministic: input.deterministic ? 'true' : 'false',
    latencyProfiles: input.latencyProfiles.join(';'),
    userConsequence: input.userConsequence,
    sourceEvidence: input.sourceEvidence.join(' | '),
    timelineEvidence: input.timelineEvidence,
    currentTestCoverage: input.currentTestCoverage,
    recommendedRemediation: input.recommendedRemediation,
    blocksPreview: input.blocksPreview ? 'true' : 'false',
    confidence: input.confidence,
    notes: input.notes ?? '',
  });
  const missingStartRows = timelineRows.filter((row) => row.eventId === 'chair_countdown_elapsed_to_active');
  const dropRows = timelineRows.filter((row) => row.outcome === 'dropped_equal_priority' || row.outcome === 'dropped_lower_priority');
  const interruptionRows = timelineRows.filter((row) => row.outcome === 'played_partially_then_interrupted');
  const staleRows = timelineRows.filter((row) => row.outcome === 'continued_stale_after_state_exit' || row.staleAfterStateExit === 'true');
  return [
    finding({
      findingId: 'MPV2-RT-001',
      severity: 'P1',
      type: 'missing_start_signal',
      title: 'Chair active measurement starts without spoken countdown or audible go',
      affectedScenarioIds: ['chair_practice_to_official_attempt', 'countdown_versus_operational_cue', 'go_audible_onset_timing', 'full_normal_mpv2_checkup_clara', 'full_normal_mpv2_checkup_marcus'],
      affectedCueKeys: ['mpv2_chair_official_ready'],
      affectedVoices: VOICES,
      deterministic: true,
      latencyProfiles: Object.keys(LATENCY_PROFILES),
      userConsequence: 'The 30-second chair window starts from an internal timer before the user receives an explicit audible start moment; this can invalidate measurement timing and eyes-off usability.',
      sourceEvidence: [sourceEvidence.countdown, sourceEvidence.chairActiveStart, sourceEvidence.transitionCues],
      timelineEvidence: evidenceFromRows(missingStartRows),
      currentTestCoverage: 'src/movementProfileV2/__tests__/liveCoordinator.test.ts covers active transition; no runtime audio-onset test covers go.',
      recommendedRemediation: 'ADD_AUDIBLE_COUNTDOWN_GO',
      blocksPreview: true,
      confidence: 'confirmed_deterministic_model',
      notes: 'The official-ready asset is longer than 3000 ms for both voices even before startup latency.',
    }),
    finding({
      findingId: 'MPV2-RT-002',
      severity: 'P1',
      type: 'drop',
      title: 'User actions can deterministically drop essential setup guidance',
      affectedScenarioIds: ['initial_effect_speech_versus_first_user_action', 'rapid_user_action_during_speech', 'shoulder_left', 'shoulder_right', 'result_completion_transition_while_prior_cue_busy'],
      affectedCueKeys: ['mpv2_chair_practice_start', 'mpv2_balance_attempt_start', 'checkup-shoulder-turn-left-v21', 'checkup-shoulder-turn-right-v21', 'checkup-shoulder-raise-left-v21', 'checkup-shoulder-raise-right-v21'],
      affectedVoices: VOICES,
      deterministic: true,
      latencyProfiles: Object.keys(LATENCY_PROFILES),
      userConsequence: 'The UI can advance state while equal or higher-priority prior speech is still busy; distinct instructions are dropped rather than queued.',
      sourceEvidence: [sourceEvidence.voiceChannelDrop, sourceEvidence.actionNoVoiceGate, sourceEvidence.transitionEffect],
      timelineEvidence: evidenceFromRows(dropRows),
      currentTestCoverage: 'src/audio/__tests__/voicePlayer.test.ts covers lower-priority drop; no full MPV2 user-action collision regression exists.',
      recommendedRemediation: 'BLOCK_USER_ACTION_UNTIL_INSTRUCTION_COMPLETE',
      blocksPreview: true,
      confidence: 'confirmed_deterministic_model',
    }),
    finding({
      findingId: 'MPV2-RT-003',
      severity: 'P1',
      type: 'failure_handling',
      title: 'Required MPV2 cue failure is not fail-closed end to end',
      affectedScenarioIds: ['required_cue_missing', 'required_asset_resolution_throws', 'playback_creation_fails', 'playback_start_callback_fails', 'fail_closed_required_cue_behavior'],
      affectedCueKeys: ['all_required_mpv2_cues'],
      affectedVoices: VOICES,
      deterministic: true,
      latencyProfiles: ['injected_failure'],
      userConsequence: 'A required instruction can be skipped while the controller continues and measurement can still start silently.',
      sourceEvidence: [sourceEvidence.voiceChannelCatch, sourceEvidence.voiceChannelPlayCatch, sourceEvidence.actionNoVoiceGate],
      timelineEvidence: failureInjectionResults.filter((row) => row.controllerProgresses).map((row) => row.caseId).join(';'),
      currentTestCoverage: 'Existing tests assert no crash/busy for missing/playback-start; they do not assert controller blocking.',
      recommendedRemediation: 'MAKE_REQUIRED_CUES_CONTROLLER_BLOCKING',
      blocksPreview: true,
      confidence: 'confirmed_source',
    }),
    finding({
      findingId: 'MPV2-RT-004',
      severity: 'P1',
      type: 'state_progression',
      title: 'State progression does not observe voice completion for timed captures',
      affectedScenarioIds: ['chair_practice_to_official_attempt', 'hinge_valid_result', 'completion'],
      affectedCueKeys: ['mpv2_chair_official_ready', 'checkup-hinge-setup-v21', 'mpv2_hinge_complete', 'checkup-complete-v21'],
      affectedVoices: VOICES,
      deterministic: true,
      latencyProfiles: Object.keys(LATENCY_PROFILES),
      userConsequence: 'The user can enter a measurement or leave the screen before essential start/setup/completion narration finishes.',
      sourceEvidence: [sourceEvidence.actionNoVoiceGate, sourceEvidence.hingeNoVoiceStart, sourceEvidence.chairActiveStart],
      timelineEvidence: evidenceFromRows([...missingStartRows, ...staleRows]),
      currentTestCoverage: 'Coordinator tests cover state transitions but not voice-completion gating.',
      recommendedRemediation: 'BLOCK_USER_ACTION_UNTIL_INSTRUCTION_COMPLETE',
      blocksPreview: true,
      confidence: 'confirmed_deterministic_model',
    }),
    finding({
      findingId: 'MPV2-RT-005',
      severity: 'P2',
      type: 'stale_speech',
      title: 'Completion or transition speech can be cancelled or stale across meaningful state exit',
      affectedScenarioIds: ['cue_completes_after_state_exit', 'navigation_unmount_during_speech', 'no_stale_mpv2_operational_cue_after_state_change'],
      affectedCueKeys: ['mpv2_hinge_complete', 'mpv2_hinge_no_measurement', 'checkup-complete-v21'],
      affectedVoices: VOICES,
      deterministic: true,
      latencyProfiles: Object.keys(LATENCY_PROFILES),
      userConsequence: 'Check-up completion may be cut off by navigation; if not unmounted, prior stage speech can continue into a new stage.',
      sourceEvidence: [sourceEvidence.appStateStop, sourceEvidence.listenerGuard, sourceEvidence.transitionEffect],
      timelineEvidence: evidenceFromRows(staleRows),
      currentTestCoverage: 'No full-screen navigation/voice cancellation regression found.',
      recommendedRemediation: 'CANCEL_STALE_STAGE_SPEECH',
      blocksPreview: false,
      confidence: 'confirmed_deterministic_model',
    }),
    finding({
      findingId: 'MPV2-RT-006',
      severity: 'P2',
      type: 'retry_recovery',
      title: 'Shared tracking-loss/recovered/retry cues are bundled but not emitted',
      affectedScenarioIds: ['repeated_tracking_loss_event', 'tracking_recovery_before_loss_cue_finishes', 'recovery_screen_retry'],
      affectedCueKeys: ['tracking-loss-v21', 'tracking-recovered-v21', 'retry-v21'],
      affectedVoices: VOICES,
      deterministic: true,
      latencyProfiles: Object.keys(LATENCY_PROFILES),
      userConsequence: 'Some recovery branches are silent or rely on screen text, weakening voice-first recovery.',
      sourceEvidence: [sourceEvidence.transitionCues],
      timelineEvidence: 'tracking_loss_defined_not_emitted;recovery_screen_retry_branch',
      currentTestCoverage: 'Voice cue tests cover definitions; no test expects these cues to be emitted.',
      recommendedRemediation: 'ADD_TRACKING_RECOVERY_VOICE',
      blocksPreview: false,
      confidence: 'confirmed_source',
    }),
    finding({
      findingId: 'MPV2-RT-007',
      severity: 'P2',
      type: 'failure_handling',
      title: 'Missing playback completion callback can leave VoiceChannel busy indefinitely',
      affectedScenarioIds: ['playback_start_callback_fails'],
      affectedCueKeys: ['any_playing_cue'],
      affectedVoices: VOICES,
      deterministic: false,
      latencyProfiles: ['device_only'],
      userConsequence: 'Future lower/equal-priority guidance can be dropped until a higher-priority cue interrupts or the screen calls stop().',
      sourceEvidence: [sourceEvidence.listenerGuard, sourceEvidence.voiceChannelDrop],
      timelineEvidence: 'failure injection no_completion_callback',
      currentTestCoverage: 'No existing test models absent didJustFinish callback.',
      recommendedRemediation: 'CANCEL_STALE_STAGE_SPEECH',
      blocksPreview: false,
      confidence: 'possible',
    }),
    finding({
      findingId: 'MPV2-RT-008',
      severity: 'P2',
      type: 'state_progression',
      title: 'Background/foreground does not replay essential context and may model transition speech after stop',
      affectedScenarioIds: ['app_background_foreground'],
      affectedCueKeys: ['mpv2_balance_tracking_retry', 'checkup-balance-intro-v21', 'mpv2_hinge_no_measurement'],
      affectedVoices: VOICES,
      deterministic: false,
      latencyProfiles: Object.keys(LATENCY_PROFILES),
      userConsequence: 'A user returning from background may not hear the context needed to recover the current stage.',
      sourceEvidence: [sourceEvidence.appStateStop, sourceEvidence.transitionEffect],
      timelineEvidence: 'app_background_voice_stop;app_foreground_resume',
      currentTestCoverage: 'Coordinator background tests exist; screen-level voice/AppState effect ordering is not covered.',
      recommendedRemediation: 'ADD_TRACKING_RECOVERY_VOICE',
      blocksPreview: false,
      confidence: 'likely',
    }),
    finding({
      findingId: 'MPV2-RT-009',
      severity: 'P2',
      type: 'voice_parity',
      title: 'Mounted VoiceChannel does not rebuild when selected voice changes',
      affectedScenarioIds: ['voice_change_while_screen_mounted_channel_exists'],
      affectedCueKeys: ['all_mpv2_cues'],
      affectedVoices: VOICES,
      deterministic: true,
      latencyProfiles: Object.keys(LATENCY_PROFILES),
      userConsequence: 'Changing trainer voice while the screen is mounted does not affect the current session channel.',
      sourceEvidence: [sourceEvidence.voiceState],
      timelineEvidence: 'voice_change_while_mounted',
      currentTestCoverage: 'No screen-level voice-change lifecycle test found.',
      recommendedRemediation: 'REBUILD_CHANNEL_ON_VOICE_CHANGE',
      blocksPreview: false,
      confidence: 'confirmed_source',
    }),
    finding({
      findingId: 'MPV2-RT-010',
      severity: 'P2',
      type: 'protocol_divergence',
      title: 'Current MPV2 balance protocol differs from future V2.1 staged ladder',
      affectedScenarioIds: ['balance_valid_attempt_rest_next_attempt', 'balance_full_hold_ceiling', 'balance_use_best'],
      affectedCueKeys: ['checkup-balance-intro-v21', 'checkup-balance-single-leg-v21', 'mpv2_balance_attempt_start'],
      affectedVoices: VOICES,
      deterministic: true,
      latencyProfiles: Object.keys(LATENCY_PROFILES),
      userConsequence: 'Runtime is internally coherent, but spec/test language must not imply the full V2.1 ladder is implemented.',
      sourceEvidence: [sourceEvidence.balanceProtocol],
      timelineEvidence: 'balance_* scenarios',
      currentTestCoverage: 'Live coordinator tests cover current single-leg attempt flow.',
      recommendedRemediation: 'REBASE_V21_CHECKUP_SPEC',
      blocksPreview: false,
      confidence: 'confirmed_source',
    }),
    finding({
      findingId: 'MPV2-RT-011',
      severity: 'P2',
      type: 'interrupt',
      title: 'Higher-priority recovery can interrupt useful in-progress instructions',
      affectedScenarioIds: ['higher_priority_event_while_busy', 'recovery_event_during_speech'],
      affectedCueKeys: ['mpv2_balance_attempt_start', 'mpv2_balance_tracking_retry', 'mpv2_shoulder_tracking_retry'],
      affectedVoices: VOICES,
      deterministic: true,
      latencyProfiles: Object.keys(LATENCY_PROFILES),
      userConsequence: 'The interruption is policy-compliant, but interrupted lower-priority setup context is not replayed after recovery.',
      sourceEvidence: [sourceEvidence.voiceChannelInterrupt],
      timelineEvidence: evidenceFromRows(interruptionRows),
      currentTestCoverage: 'VoiceChannel test covers higher-priority interruption.',
      recommendedRemediation: 'ADD_TRACKING_RECOVERY_VOICE',
      blocksPreview: false,
      confidence: 'confirmed_existing_test',
    }),
    finding({
      findingId: 'MPV2-RT-012',
      severity: 'P3',
      type: 'test_gap',
      title: 'No audit-regression test locks the full voice timeline',
      affectedScenarioIds: ['all'],
      affectedCueKeys: ['all_mpv2_cues'],
      affectedVoices: VOICES,
      deterministic: true,
      latencyProfiles: Object.keys(LATENCY_PROFILES),
      userConsequence: 'Future changes could reintroduce drops/timing regressions without a targeted fake-clock test.',
      sourceEvidence: [sourceEvidence.transitionEffect],
      timelineEvidence: `generated ${timelineRows.length} audit rows`,
      currentTestCoverage: 'Existing tests cover pieces, not the integrated voice timeline.',
      recommendedRemediation: 'ADD_RUNTIME_TIMELINE_TESTS',
      blocksPreview: false,
      confidence: 'confirmed_source',
    }),
  ];
}

function evidenceFromRows(rows, max = 8) {
  return rows.slice(0, max).map((row) => `${row.scenarioId}/${row.variantId}/${row.eventId}/${row.outcome}`).join(';');
}

function priorityMatrix() {
  const priorities = [
    ['50', 'final-position-set-v21;tracking-recovered-v21', 'lowest MPV2 setup/recovery reassurance; dropped by almost everything while busy'],
    ['60', 'intro/setup/active-transition cues', 'drops against equal intro/setup and all completion/recovery/critical cues'],
    ['70', 'completion/rest/retry-v21', 'interrupts setup 60, drops against other 70, interrupted by 90/100'],
    ['90', 'mpv2_chair_official_ready', 'interrupts setup/completion, interrupted/dropped by critical 100'],
    ['100', 'times-up-v21;tracking-loss-v21;mpv2_*_tracking_retry', 'critical; equal 100 collisions drop incoming cue'],
  ];
  return priorities.map(([priority, cueKeys, behavior]) => ({ priority: Number(priority), cueKeys, behavior }));
}

function runtimeModel(sourceEvidence) {
  return {
    voiceChannel: {
      oneSequenceAtATime: true,
      lowerOrEqualPriorityWhileBusy: 'incoming speak() returns false; cue/sequence is dropped',
      higherPriorityWhileBusy: 'stop current player, clear pending cues, start incoming sequence',
      pendingCueStorage: 'pendingCues = cues.slice(1)',
      completion: 'didJustFinish listener starts next pending cue or clears busy state',
      failureHandling: 'resolution/player/play failures are caught and skipped; pending cues may continue',
      stop: 'release player, clear pending cues, playing=false, priority=-1',
      sourceEvidence: [sourceEvidence.voiceChannelDrop, sourceEvidence.voiceChannelCatch, sourceEvidence.listenerGuard],
    },
    mpv2Sequencer: {
      initialSpeech: 'separate mount effect speaks initialMovementProfileV2VoiceEvent in one speak() call',
      transitionSpeech: 'live snapshot effect asks MovementProfileV2VoiceSequencer.next(live)',
      dedupe: 'once per transitionKey composed of atMs/from/to/reason/movementEpoch/attemptEpoch',
      priority: 'max priority across cue sequence',
      controllerObservesCueCompletion: false,
      sourceEvidence: [sourceEvidence.initialEffect, sourceEvidence.transitionEffect, sourceEvidence.transitionKey, sourceEvidence.eventPriority],
    },
    clocks: {
      appActions: 'defaultNowMs, currently Date.now fallback/performance where available through diagnostics helper',
      coordinatorTimers: 'React Native setInterval every 250 ms calls receiveTimerTick',
      poseFrames: 'frame source timestamp bridged to app ms by MonotonicFrameClockBridge',
      audio: 'expo-audio native callbacks, not used by coordinator',
      driftRisk: 'controller and audio clocks are independent; current code does not align active windows to audible onset',
    },
  };
}

function sideConsistency() {
  return {
    status: 'script_valid_but_runtime_gating_needed',
    selectedSideControlsCue: true,
    selectedSideControlsGrader: true,
    retryPreservesSide: true,
    risk: 'left/right setup sequence can be dropped if user confirms while prior completion cue is busy',
  };
}

function protocolImpact() {
  return {
    currentBalanceProtocol: 'eyes-open single-leg attempts, max 45s each, up to 3 valid trials, rest/use-best branches',
    v21Target: 'future staged balance ladder remains not implemented in current MPV2 path',
    runtimeBlocker: false,
    specRebaseNeeded: true,
    notes: 'Do not promote TUG or eyes-closed cues into current default MPV2 runtime by implication.',
  };
}

function voiceParity(timelineRows) {
  const outcomeByKey = new Map();
  for (const row of timelineRows) {
    if (!row.variantId || row.latencyProfile === 'injected_failure') continue;
    const key = row.variantId.replace(':clara:', ':VOICE:').replace(':marcus:', ':VOICE:');
    if (!outcomeByKey.has(key)) outcomeByKey.set(key, {});
    const bucket = outcomeByKey.get(key);
    bucket[row.voiceId] = `${bucket[row.voiceId] ?? ''}|${row.eventId}:${row.outcome}`;
  }
  const differences = [];
  for (const [key, bucket] of outcomeByKey.entries()) {
    if (bucket.clara && bucket.marcus && bucket.clara !== bucket.marcus) differences.push(key);
  }
  return {
    outcomeDifferenceCount: differences.length,
    differences,
    durationFinding: 'Clara/Marcus duration differences change margins but did not change modelled controller states/outcome classes.',
  };
}

function remediationPlan() {
  return [
    phase('Audible measurement start', 'Add spoken countdown and go, then align active timing to audible go onset.', ['src/movementProfileV2/liveCoordinator.ts', 'src/movementProfileV2/voiceCues.ts', 'src/screens/MovementProfileV2CheckUpScreen.tsx'], 'high', ['fake-clock active-window tests', 'device onset QA'], 'internal MPV2 flag', 'fall back to current internal preview-disabled path', 'active start is at audible go onset on Android/iOS'),
    phase('Essential-speech gating', 'Prevent user actions/timers from bypassing required setup/start cues.', ['src/screens/MovementProfileV2CheckUpScreen.tsx', 'src/movementProfileV2/voiceCues.ts'], 'medium', ['button gating tests', 'timeline regression tests'], 'internal MPV2 flag', 'restore non-gated controls', 'essential guidance cannot be dropped by immediate actions'),
    phase('Required-cue failure semantics', 'Make required cue failures controller-blocking with visible fallback and retry.', ['src/audio/voicePlayer.ts', 'src/screens/MovementProfileV2CheckUpScreen.tsx'], 'high', ['missing-asset injection tests'], 'dev injection flag', 'disable blocking only for non-required cues', 'no measurement starts after required cue failure'),
    phase('Stage-scoped cancellation', 'Cancel stale speech on meaningful state transitions and guard completion callbacks.', ['src/audio/voicePlayer.ts', 'src/screens/MovementProfileV2CheckUpScreen.tsx'], 'medium', ['state-exit and callback tests'], 'internal MPV2 flag', 'existing stop behavior', 'no old operational cue crosses stage boundary'),
    phase('Tracking/retry/recovery voice', 'Wire tracking-loss/recovered/retry cues where appropriate and add recovery screen narration.', ['src/movementProfileV2/voiceCues.ts', 'src/movementProfileV2/liveCoordinator.ts', 'src/screens/MovementProfileV2RecoveryScreen.tsx'], 'medium', ['recovery branch tests'], 'internal MPV2 flag', 'visual recovery fallback', 'voice-first recovery branches are complete'),
    phase('Priority policy', 'Verify or revise 50-100 classes so distinct essential transitions are not equal-priority drops.', ['src/movementProfileV2/voiceCues.ts', 'src/audio/voicePlayer.ts'], 'medium', ['priority matrix tests'], 'internal MPV2 flag', 'restore current priorities', 'equal-priority collisions are intentional and documented'),
    phase('Protocol/spec reconciliation', 'Keep current single-leg balance distinct from future V2.1 staged ladder.', ['docs/specs/HALE_VOICE_EXPERIENCE_SPEC_V2_1.md', 'src/checkup/movementProfileV2.ts'], 'low', ['spec conformance checks'], 'documentation only', 'no runtime change', 'docs and runtime names describe actual protocol'),
    phase('Tests', 'Add fake-clock controller, VoiceChannel failure, and full-flow timeline regression tests.', ['src/movementProfileV2/__tests__', 'src/audio/__tests__'], 'medium', ['new tests'], 'n/a', 'remove tests with feature', 'runtime regressions fail CI'),
    phase('Physical-device QA', 'Measure Android/iOS audible onset, callbacks, Bluetooth, background/foreground, and voice switching.', ['manual QA plan', 'diagnostics logging'], 'high', ['device logs and waveform review'], 'internal build only', 'do not preview beyond internal device QA', 'device timing matches model tolerances'),
  ];
}

function phase(title, purpose, affectedFiles, risk, tests, featureFlag, rollback, completionGate) {
  return { title, purpose, affectedFiles, risk, tests, featureFlag, rollback, completionGate };
}

function deviceQaPlan() {
  return [
    'Run Clara and Marcus full MPV2 check-up on Android physical device using phone speaker.',
    'Run Clara and Marcus full MPV2 check-up on iOS physical device using phone speaker and silent switch enabled.',
    'Repeat chair countdown/go path over Bluetooth and compare callback latency.',
    'Measure UI/controller timestamp, playback request timestamp, audible waveform onset, and first accepted movement timestamp.',
    'Perform rapid button action tests immediately when controls enable.',
    'Background/foreground during chair, balance, shoulder, and hinge active windows.',
    'Inject missing required asset in dev build without deleting files and confirm controller blocks.',
    'Change selected voice while screen is mounted and after remount.',
    'Record full check-up screen/audio/video for timing review; do not use self-view in product UI.',
  ].map((item, index) => ({ id: `DQA-${String(index + 1).padStart(2, '0')}`, test: item }));
}

function buildSummary({ runtimeInput, scenarios, timelineRows, findings, failureInjectionResults }) {
  const counts = severityCounts(findings);
  const deterministicDrops = timelineRows.filter((row) => row.outcome === 'dropped_equal_priority' || row.outcome === 'dropped_lower_priority').length;
  const deterministicInterruptions = timelineRows.filter((row) => row.outcome === 'played_partially_then_interrupted').length;
  const staleSpeechCases = timelineRows.filter((row) => row.outcome === 'continued_stale_after_state_exit' || row.staleAfterStateExit === 'true').length;
  const missingStartSignalCases = timelineRows.filter((row) => row.eventId === 'chair_countdown_elapsed_to_active').length;
  const requiredCueSilentContinuationCases = failureInjectionResults.filter((row) => row.controllerProgresses && !row.visibleFallbackExists).length;
  return {
    founderListeningStatus: LISTENING_REVIEW.status,
    canonicalScenarioCount: runtimeInput.requiredScenarios.length,
    totalSimulatedVariantCount: scenarios.reduce((sum, scenario) => {
      const voices = scenario.scenarioId === 'full_normal_mpv2_checkup_clara' || scenario.scenarioId === 'full_normal_mpv2_checkup_marcus' ? 1 : 2;
      const actionTimings = scenario.userActionVariants ? 3 : 1;
      return sum + voices * Object.keys(LATENCY_PROFILES).length * actionTimings;
    }, 0),
    timelineRowCount: timelineRows.length,
    deterministicDropCount: deterministicDrops,
    deterministicInterruptionCount: deterministicInterruptions,
    staleSpeechCount: staleSpeechCases,
    missingAudibleStartCount: missingStartSignalCases,
    requiredCueSilentContinuationCount: requiredCueSilentContinuationCases,
    claraMarcusOutcomeDifferenceCount: voiceParity(timelineRows).outcomeDifferenceCount,
    p0Count: counts.P0,
    p1Count: counts.P1,
    p2Count: counts.P2,
    p3Count: counts.P3,
    previewSafe: false,
    exactNextAction: 'Implement audible countdown/go with active timing aligned to audible onset before integrated device preview.',
  };
}

function severityCounts(findings) {
  return {
    P0: findings.filter((row) => row.severity === 'P0').length,
    P1: findings.filter((row) => row.severity === 'P1').length,
    P2: findings.filter((row) => row.severity === 'P2').length,
    P3: findings.filter((row) => row.severity === 'P3').length,
  };
}

function validate({ runtimeInput, reconciliation, v21Spec, canonicalRows, qcRows, inputFreshness, scenarios, timelineRows, findings, failureInjectionResults, assets }) {
  const checks = [];
  const hardFailures = [];
  const check = (id, ok, detail = '') => {
    checks.push({ id, status: ok ? 'pass' : 'fail', detail });
    if (!ok) hardFailures.push(`${id}: ${detail}`);
  };
  check('parse_runtime_input', runtimeInput.inputVersion === 1, 'runtime input JSON parsed');
  check('parse_reconciliation_json', reconciliation.auditVersion === 1, 'reconciliation JSON parsed');
  check('parse_v21_json', Boolean(v21Spec), 'V2.1 JSON parsed');
  check('parse_canonical_csv', canonicalRows.length > 0, `${canonicalRows.length} rows`);
  check('parse_asset_qc_csv', qcRows.length > 0, `${qcRows.length} rows`);
  check('input_freshness', ['current_exact', 'minor_nonsemantic_drift'].includes(inputFreshness.classification), inputFreshness.classification);
  check('runtime_cue_references_resolve', runtimeInput.events.flatMap((event) => event.cueKeys ?? []).every((cueKey) => assets.some((asset) => asset.cueKey === cueKey)), 'all event cue keys have asset/policy rows');
  check('physical_assets_exist', assets.every((asset) => VOICES.every((voice) => fileExists(asset.voiceAssets[voice].path))), 'all voice assets exist');
  check('hashes_match', assets.every((asset) => VOICES.every((voice) => !asset.voiceAssets[voice].sha256 || asset.voiceAssets[voice].sha256 === asset.voiceAssets[voice].currentSha256)), 'input hashes match live files');
  check('canonical_scenarios_42', runtimeInput.requiredScenarios.length === 42, `${runtimeInput.requiredScenarios.length}`);
  const scenarioIds = new Set(scenarios.map((row) => row.scenarioId));
  for (const scenario of runtimeInput.requiredScenarios) check(`scenario_represented_${scenario.id}`, scenarioIds.has(scenario.id), scenario.id);
  check('both_voices_for_timing_sensitive', scenarios.every((scenario) => {
    if (scenario.scenarioId === 'full_normal_mpv2_checkup_clara' || scenario.scenarioId === 'full_normal_mpv2_checkup_marcus') return true;
    const variants = timelineRows.filter((row) => row.scenarioId === scenario.scenarioId);
    return variants.some((row) => row.voiceId === 'clara') && variants.some((row) => row.voiceId === 'marcus');
  }), 'all non-voice-specific scenarios include both voices');
  for (const profile of Object.keys(LATENCY_PROFILES)) {
    check(`latency_profile_${profile}`, timelineRows.some((row) => row.latencyProfile === profile), profile);
  }
  for (const timing of ACTION_TIMINGS) {
    check(`user_action_timing_${timing}`, timelineRows.some((row) => row.variantId.includes(`:${timing}`)), timing);
  }
  check('priority_outcomes_present', timelineRows.some((row) => row.outcome === 'dropped_equal_priority') && timelineRows.some((row) => row.outcome === 'played_partially_then_interrupted'), 'drop and interrupt outcomes modelled');
  check('internal_countdown_modelled', timelineRows.some((row) => row.eventId === 'chair_countdown_elapsed_to_active'), 'chair active start row present');
  check('times_up_modelled', timelineRows.some((row) => row.cueKeys.includes('times-up-v21')), 'times-up row present');
  check('balance_branches_modelled', ['balance_valid_attempt_rest_next_attempt', 'balance_invalid_tracking_retry', 'balance_full_hold_ceiling', 'balance_use_best', 'balance_default_ready_after_60'].every((id) => timelineRows.some((row) => row.scenarioId === id)), 'balance scenario rows present');
  check('shoulder_left_right_modelled', ['shoulder_left', 'shoulder_right'].every((id) => timelineRows.some((row) => row.scenarioId === id)), 'shoulder scenario rows present');
  check('hinge_branches_modelled', timelineRows.some((row) => row.eventId === 'hinge_recorded_valid'), 'valid hinge modelled');
  check('retry_recovery_modelled', timelineRows.some((row) => row.eventId === 'recovery_screen_retry_branch'), 'recovery screen modelled');
  check('background_foreground_modelled', timelineRows.some((row) => row.scenarioId === 'app_background_foreground'), 'background scenario present');
  check('voice_change_modelled', timelineRows.some((row) => row.scenarioId === 'voice_change_while_screen_mounted_channel_exists'), 'voice change modelled');
  check('failure_injection_cases', failureInjectionResults.length >= 10, `${failureInjectionResults.length}`);
  check('finding_evidence', findings.every((finding) => finding.timelineEvidence && finding.sourceEvidence), 'all findings include source/timeline evidence');
  check('p1_blocks_preview', findings.filter((finding) => finding.severity === 'P1').every((finding) => finding.blocksPreview === 'true'), 'all P1 block preview');
  check('waiver_present', LISTENING_REVIEW.status === 'waived_assumed_pass_by_founder', 'waiver applied');
  check('no_fake_listening_export', !fs.existsSync(path.join(ROOT, 'docs/audits/hale-mpv2-voice-listening-review.json')), 'no fake export file');
  return {
    status: hardFailures.length ? 'fail' : 'pass',
    checks,
    hardFailures,
    commandsToRunAfterGeneration: [
      'npm run verify:audio',
      'npx jest src/movementProfileV2/__tests__/voiceCues.test.ts src/movementProfileV2/__tests__/liveCoordinator.test.ts src/movementProfileV2/__tests__/recovery.test.ts src/audio/__tests__/movementProfileV2Audio.test.ts src/audio/__tests__/voicePlayer.test.ts --runInBand',
      'npx tsc --noEmit',
      'node scripts/audits/audit-mpv2-runtime.mjs',
    ],
  };
}

function renderMarkdown(audit) {
  const s = audit.summary;
  const pCounts = `P0 ${s.p0Count}, P1 ${s.p1Count}, P2 ${s.p2Count}, P3 ${s.p3Count}`;
  return `# Hale MPV2 Targeted Runtime Audit

## 1. Executive Verdict

- Primary verdict: ${audit.verdict.primary}
- Secondary flags: ${audit.verdict.secondaryFlags.join(', ')}
- Founder listening status: ${audit.listeningReview.status}; human verified: ${audit.listeningReview.humanVerified}
- Input freshness: ${audit.inputFreshness.classification}
- Current branch/commit: ${audit.repositorySnapshot.branch} / ${audit.repositorySnapshot.shortHead}
- Canonical scenarios: ${s.canonicalScenarioCount}
- Total simulated variants: ${s.totalSimulatedVariantCount}
- Total timeline rows: ${s.timelineRowCount}
- Deterministic drops: ${s.deterministicDropCount}
- Deterministic interruptions: ${s.deterministicInterruptionCount}
- Stale-speech cases: ${s.staleSpeechCount}
- Missing-start-signal cases: ${s.missingAudibleStartCount}
- Required-cue silent-continuation cases: ${s.requiredCueSilentContinuationCount}
- Clara/Marcus outcome differences: ${s.claraMarcusOutcomeDifferenceCount}
- Finding counts: ${pCounts}
- Preview safe: no
- Exact next action: ${s.exactNextAction}

## 2. Listening Review Waiver

${WAIVER_TEXT}

This is an audit overlay only. It does not mark any asset as human-verified and does not authorize additional audio generation.

## 3. Scope and Method

This audit covers only the current Movement Profile V2 check-up path. The harness reads the prepared handoff, canonical cue map, asset QC, live source, and actual MP3 durations/hashes. It models the current voice channel with L0, L100, and L250 playback/callback latency profiles and user-action timing variants. It does not instantiate native \`expo-audio\` or implement fixes.

## 4. Live Repository and Input Freshness

- Worktree state: ${audit.repositorySnapshot.worktreeState}
- HEAD: ${audit.repositorySnapshot.head}
- Upstream: ${audit.repositorySnapshot.upstream}
- expo-audio: ${audit.repositorySnapshot.expoAudioVersion}
- Freshness classification: ${audit.inputFreshness.classification}
- Drift differences: ${audit.inputFreshness.differenceCount}

## 5. Current MPV2 Runtime Architecture

The screen owns a single \`VoiceChannel\` created from the initial \`voiceId\` prop. Initial speech is a mount-effect \`speak()\` call. Transition speech is emitted from a live-snapshot effect through \`MovementProfileV2VoiceSequencer\`. The coordinator never waits for cue completion.

## 6. Timing and VoiceChannel Model

\`VoiceChannel\` allows one sequence at a time. Lower-or-equal priority incoming speech is dropped. Higher priority stops current playback and clears pending cues. Missing required MPV2 assets throw during resolution, but \`playCue\` catches the error, skips the cue, and continues pending cues.

## 7. Full Normal Clara Timeline

See \`${OUT.timelines}\` rows for \`full_normal_mpv2_checkup_clara\`. In the wait-for-speech normal path, cues play in order, but chair active still starts from the internal timer before an explicit spoken go.

## 8. Full Normal Marcus Timeline

See \`${OUT.timelines}\` rows for \`full_normal_mpv2_checkup_marcus\`. Marcus has different asset durations but the same outcome classes as Clara.

## 9. Chair Practice, Countdown, Active Window, and Result

Practice start can be dropped if chair setup is confirmed while the initial intro is still busy. Practice completion submits \`mpv2_chair_official_ready\`, starts the internal 3000 ms countdown, and then chair active begins without \`three/two/one/go\`. The official-ready cue is longer than 3000 ms for both voices before added startup latency.

## 10. Balance Attempt and Rest Branches

Current balance is eyes-open single-leg, max 45 seconds per trial, up to 3 valid trials. Attempt-start can be emitted from both ready and trial transitions; the second instance can be dropped while the first is busy. Rest narration is safely shorter than the 30-second minimum rest, but use-best can be pressed while rest narration is busy and drop the use-best/completion sequence.

## 11. Shoulder Left/Right Consistency

Selected shoulder side determines both turn and raise cues, and the grader reads the same flow side. The risk is not side mismatch; it is that side-specific setup speech can be dropped if the user confirms shoulder setup while balance completion speech is still busy.

## 12. Hinge and Completion Branches

Valid hinge speaks \`mpv2_hinge_complete -> checkup-complete-v21\`; no-measurement speaks \`mpv2_hinge_no_measurement -> checkup-complete-v21\`. Both are one sequence. Navigation can occur before completion narration finishes.

## 13. User Actions, Retry, Recovery, and Navigation

The current live screen has visual controls for retry-like paths but does not wire \`retry-v21\`, \`tracking-loss-v21\`, or \`tracking-recovered-v21\` into emitted MPV2 transitions. The recovery screen is visual only.

## 14. Priority, Drop, and Interruption Matrix

${audit.priorityMatrix.map((row) => `- ${row.priority}: ${row.cueKeys} — ${row.behavior}`).join('\n')}

## 15. Required-Cue and Playback-Failure Injection

The audit model injects missing selected-voice assets, resolver throws, player creation failure, playback start failure, absent completion callback, late callback after stop, and first/middle/final failures in multi-cue sequences. Current behavior skips failed cues and lets controller state continue; this is not fail-closed end to end.

## 16. State Exit and Stale-Speech Analysis

Unmount/background calls \`voice.stop()\`, clears pending cues, and the player identity guard prevents released callbacks from mutating the new state. Meaningful stage transitions without unmount do not automatically cancel prior speech, so lower-priority next-stage guidance can be dropped while prior transition speech continues.

## 17. Clara/Marcus Outcome Parity

Outcome-difference count: ${s.claraMarcusOutcomeDifferenceCount}. Duration differences change timing margins but did not change simulated controller outcome classes.

## 18. V2.1 Runtime and Protocol Impact

The current MPV2 balance protocol remains an eyes-open single-leg attempt flow rather than the future V2.1 staged ladder. That is not the main preview blocker, but it must be documented as a current-protocol divergence.

## 19. Prioritised Findings

${audit.findings.map((finding) => `- ${finding.findingId} [${finding.severity}] ${finding.title} — blocks preview: ${finding.blocksPreview}`).join('\n')}

## 20. Preview Readiness Decision

Integrated preview is not safe yet. The missing audible start for a timed measurement and non-blocking required-cue failures are P1 preview blockers.

## 21. Remediation Sequence

See \`${OUT.remediation}\`.

## 22. Physical-Device QA Plan

${audit.deviceQaPlan.map((item) => `- ${item.id}: ${item.test}`).join('\n')}

## 23. Validation, Limitations, and Source Index

Validation status: ${audit.validation.status}; hard failures: ${audit.validation.hardFailures.length}.

Limitations:

${audit.limitations.map((item) => `- ${item}`).join('\n')}

Source index:

${SOURCE_INDEX.map((item) => `- \`${item}\``).join('\n')}
`;
}

function renderRemediationPlan(audit) {
  return `# Hale MPV2 Runtime Remediation Plan

Do not implement this plan from the audit alone; it is the ordered remediation sequence for the next engineering task.

${audit.remediationPlan.map((phase, index) => `## ${index + 1}. ${phase.title}

Purpose: ${phase.purpose}

Affected files: ${phase.affectedFiles.join(', ')}

Risk: ${phase.risk}

Tests: ${phase.tests.join(', ')}

Feature flag: ${phase.featureFlag}

Rollback: ${phase.rollback}

Completion gate: ${phase.completionGate}
`).join('\n')}
`;
}

function renderWaiver() {
  return `# Hale MPV2 Listening Review Waiver

## Decision

The founder elected to proceed without completing the prepared 34-row/68-asset listening review at this stage.

## Assumptions Used

${LISTENING_REVIEW.assumedForThisAudit.map((item) => `- ${item}`).join('\n')}

## What This Does Not Prove

${LISTENING_REVIEW.notEstablished.map((item) => `- ${item}`).join('\n')}

## Risks Accepted

${LISTENING_REVIEW.residualRisk}

## Effect on Runtime Audit

The runtime audit proceeds using source-expected wording, actual MP3 durations, current manifests, current controller behavior, and the prepared event/scenario handoff. The waiver does not weaken timing, state-machine, failure-path, or safety analysis.

## Effect on Audio Generation

This waiver does not by itself authorize additional audio generation.

## Effect on Device QA

Later listening on real devices remains required before broad beta release. This document must not be read as audio approval.
`;
}

function toCsv(rows, columns) {
  const quote = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  return `${columns.join(',')}\n${rows.map((row) => columns.map((column) => quote(row[column])).join(',')).join('\n')}\n`;
}

function readJson(filePath) {
  return JSON.parse(readText(filePath));
}

function readText(filePath) {
  return fs.readFileSync(path.join(ROOT, filePath), 'utf8');
}

function writeFile(filePath, text) {
  fs.mkdirSync(path.dirname(path.join(ROOT, filePath)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, filePath), text);
}

function readCsv(filePath) {
  const rows = parseCsv(readText(filePath).replace(/^\uFEFF/, ''));
  if (!rows.length) return [];
  const headers = rows[0];
  return rows.slice(1).filter((row) => row.some((cell) => cell !== '')).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])));
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') inQuotes = true;
    else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (char !== '\r') {
      cell += char;
    }
  }
  if (row.length || cell) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function safeGit(args) {
  return safeRun('git', args).stdout;
}

function safeRun(command, args) {
  const result = spawnSync(command, args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1024 * 1024 * 20 });
  return { status: result.status ?? 1, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

function parsePorcelainPath(line) {
  return line.slice(3).replace(/^"|"$/g, '');
}

function fileExists(filePath) {
  return Boolean(filePath) && fs.existsSync(path.join(ROOT, filePath));
}

function sha256File(filePath) {
  if (!fileExists(filePath)) return '';
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, filePath))).digest('hex');
}

function lineNumberOf(text, needle) {
  const index = text.indexOf(needle);
  if (index < 0) return 0;
  return text.slice(0, index).split(/\r?\n/).length;
}

function unescapeTsString(value) {
  return value.replaceAll("\\'", "'").replaceAll('\\"', '"');
}

main();
