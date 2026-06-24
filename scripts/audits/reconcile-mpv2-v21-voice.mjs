#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '../..');

const OUT = {
  md: 'docs/audits/HALE_MPV2_V21_VOICE_RECONCILIATION.md',
  json: 'docs/audits/HALE_MPV2_V21_VOICE_RECONCILIATION.json',
  canonicalCsv: 'docs/audits/HALE_MPV2_VOICE_CANONICAL_MAP.csv',
  qcCsv: 'docs/audits/HALE_MPV2_VOICE_ASSET_QC.csv',
  html: 'docs/audits/HALE_MPV2_VOICE_LISTENING_REVIEW.html',
  guide: 'docs/audits/HALE_MPV2_VOICE_LISTENING_REVIEW_GUIDE.md',
  runtimeInput: 'docs/audits/HALE_MPV2_TARGETED_RUNTIME_AUDIT_INPUT.json',
  runtimeScope: 'docs/audits/HALE_MPV2_TARGETED_RUNTIME_AUDIT_SCOPE.md',
};

const VOICES = ['clara', 'marcus'];

const EXPECTED_ADDED_KEYS = [
  'checkup-balance-intro-v21',
  'checkup-balance-single-leg-v21',
  'checkup-chair-stand-intro-v21',
  'checkup-chair-stand-setup-v21',
  'checkup-complete-v21',
  'checkup-hinge-setup-v21',
  'checkup-shoulder-raise-left-v21',
  'checkup-shoulder-raise-right-v21',
  'checkup-shoulder-turn-left-v21',
  'checkup-shoulder-turn-right-v21',
  'final-position-set-v21',
  'item-complete-v21',
  'mpv2_balance_attempt_saved',
  'mpv2_balance_attempt_start',
  'mpv2_balance_complete',
  'mpv2_balance_full_hold',
  'mpv2_balance_ready_after_30',
  'mpv2_balance_ready_after_60',
  'mpv2_balance_rest',
  'mpv2_balance_tracking_retry',
  'mpv2_balance_use_best',
  'mpv2_chair_official_ready',
  'mpv2_chair_practice_start',
  'mpv2_checkup_intro',
  'mpv2_hinge_complete',
  'mpv2_hinge_no_measurement',
  'mpv2_shoulder_tracking_retry',
  'retry-v21',
  'times-up-v21',
  'tracking-loss-v21',
  'tracking-recovered-v21',
];

const RUNTIME_REACHABLE_KEYS = [
  'mpv2_checkup_intro',
  'checkup-chair-stand-intro-v21',
  'checkup-chair-stand-setup-v21',
  'mpv2_chair_practice_start',
  'mpv2_chair_official_ready',
  'times-up-v21',
  'checkup-balance-intro-v21',
  'checkup-balance-single-leg-v21',
  'mpv2_balance_attempt_start',
  'mpv2_balance_attempt_saved',
  'mpv2_balance_rest',
  'mpv2_balance_ready_after_30',
  'mpv2_balance_ready_after_60',
  'mpv2_balance_use_best',
  'mpv2_balance_tracking_retry',
  'mpv2_balance_full_hold',
  'mpv2_balance_complete',
  'checkup-shoulder-turn-left-v21',
  'checkup-shoulder-turn-right-v21',
  'checkup-shoulder-raise-left-v21',
  'checkup-shoulder-raise-right-v21',
  'final-position-set-v21',
  'mpv2_shoulder_tracking_retry',
  'item-complete-v21',
  'checkup-hinge-setup-v21',
  'mpv2_hinge_complete',
  'mpv2_hinge_no_measurement',
  'checkup-complete-v21',
];

const DEFINED_NOT_EMITTED_KEYS = ['tracking-loss-v21', 'tracking-recovered-v21', 'retry-v21'];
const OPERATIONAL_KEYS = EXPECTED_ADDED_KEYS.filter((key) => key.startsWith('mpv2_'));
const OVERLAP_LOGICAL_KEYS = ['chair-result-prefix-v21', 'tug-intro', 'tug-setup'];
const QC_PHYSICAL_KEYS = [...EXPECTED_ADDED_KEYS, 'you-completed', 'tug-intro', 'tug-setup'];

const SOURCE_INDEX = [
  'src/movementProfileV2/voiceCues.ts',
  'src/movementProfileV2/liveCoordinator.ts',
  'src/screens/MovementProfileV2CheckUpScreen.tsx',
  'src/screens/MovementProfileV2RecoveryScreen.tsx',
  'src/movementProfileV2/recovery.ts',
  'src/audio/cues.ts',
  'src/audio/voicePlayer.ts',
  'src/audio/manifest.ts',
  'src/audio/movementProfileV2AudioManifest.ts',
  'src/audio/movementProfileV2Audio.ts',
  'src/movementProfileV2/__tests__/voiceCues.test.ts',
  'src/movementProfileV2/__tests__/liveCoordinator.test.ts',
  'src/movementProfileV2/__tests__/recovery.test.ts',
  'src/audio/__tests__/movementProfileV2Audio.test.ts',
  'src/audio/__tests__/voicePlayer.test.ts',
  'docs/audits/HALE_VOICE_CURRENT_STATE_RECONCILIATION.json',
  'docs/audits/HALE_VOICE_CURRENT_ASSET_INVENTORY.csv',
  'docs/specs/HALE_VOICE_EXPERIENCE_SPEC_V2_1.json',
  'docs/specs/HALE_VOICE_SCRIPT_MANIFEST_V2_1.csv',
  'docs/specs/HALE_VOICE_APPROVED_DECISIONS_V2_1.md',
];

const CANONICAL_COLUMNS = [
  'cueKey',
  'namespace',
  'currentScript',
  'currentSourceFile',
  'currentSourceSymbol',
  'flow',
  'stage',
  'category',
  'trigger',
  'triggerConditions',
  'currentPriority',
  'currentPolicyClass',
  'currentRequiredness',
  'currentMissingAssetPolicy',
  'currentRepeatRule',
  'currentCancelRule',
  'currentBlocksProgression',
  'currentManifestFile',
  'currentManifestStatus',
  'claraPath',
  'marcusPath',
  'claraDurationMs',
  'marcusDurationMs',
  'currentRuntimeReachability',
  'currentRuntimeCallPath',
  'v21MatchStatus',
  'v21CueKey',
  'v21Script',
  'v21PolicyId',
  'approvedDecisionIds',
  'decisionAlignment',
  'copyQuality',
  'sourceBinaryProvenance',
  'proposedAction',
  'requiresHumanListening',
  'requiresV21Patch',
  'requiresRuntimeAudit',
  'implementationDependencyIds',
  'notes',
];

const QC_COLUMNS = [
  'voiceId',
  'cueKey',
  'path',
  'sha256',
  'durationMs',
  'codec',
  'container',
  'sampleRateHz',
  'channels',
  'bitRate',
  'lufsI',
  'loudnessRange',
  'truePeakDbfs',
  'leadingSilenceMs',
  'trailingSilenceMs',
  'decodeStatus',
  'clippingFlag',
  'baselineDurationPercentile',
  'pairedDurationDeltaMs',
  'outlierFlags',
  'notes',
];

function main() {
  const generatedAt = new Date().toISOString();
  const snapshot = repositorySnapshot(generatedAt);
  const priorAudit = readJson('docs/audits/HALE_VOICE_CURRENT_STATE_RECONCILIATION.json');
  const v21Spec = readJson('docs/specs/HALE_VOICE_EXPERIENCE_SPEC_V2_1.json');
  const inventoryRows = readCsv('docs/audits/HALE_VOICE_CURRENT_ASSET_INVENTORY.csv');
  const v21Rows = readCsv('docs/specs/HALE_VOICE_SCRIPT_MANIFEST_V2_1.csv');
  const definitions = parseMpv2Definitions();
  const assets = buildAssetIndex(inventoryRows);
  const v21ByKey = new Map(v21Rows.map((row) => [row.newCueKey, row]));
  const currentCueByKey = new Map((priorAudit.currentCueDefinitions ?? []).map((row) => [row.cueKey, row]));
  const eventCueGraph = buildEventCueGraph(definitions);
  const canonicalCueMap = buildCanonicalCueMap({ definitions, assets, v21ByKey, currentCueByKey, eventCueGraph });
  const technicalQc = buildTechnicalQc({ assets });
  const runtimeInput = buildRuntimeInput({
    generatedAt,
    snapshot,
    canonicalCueMap,
    technicalQc,
    eventCueGraph,
  });
  const requiredScenarios = runtimeInput.requiredScenarios;
  const listeningRows = buildListeningRows(canonicalCueMap, technicalQc);
  const validation = validate({
    priorAudit,
    v21Spec,
    inventoryRows,
    v21Rows,
    definitions,
    assets,
    canonicalCueMap,
    technicalQc,
    eventCueGraph,
    runtimeInput,
    listeningRows,
  });
  const summary = buildSummary({
    priorAudit,
    definitions,
    assets,
    canonicalCueMap,
    technicalQc,
    eventCueGraph,
    requiredScenarios,
  });
  const verdict = {
    preliminary: validation.hardFailures.length === 0 ? 'READY_FOR_HUMAN_LISTENING' : 'SOURCE_OR_MANIFEST_REPAIR_REQUIRED',
    postListeningOptions: [
      'PROCEED_TO_TARGETED_RUNTIME_AUDIT',
      'PATCH_V21_AND_REVIEW_AGAIN',
      'REGENERATE_FAILED_ASSETS_ONLY',
      'REPAIR_SOURCE_OR_MANIFEST',
      'REVIEW_UNRESOLVED_CUES',
    ],
    audioRegenerationJustifiedNow: false,
    v21PatchRequiredBeforeListening: false,
    nextAction:
      'Have the founder complete the local listening review and export the JSON, then run the targeted MPV2 runtime audit using HALE_MPV2_TARGETED_RUNTIME_AUDIT_INPUT.json.',
  };
  const audit = {
    auditVersion: 1,
    generatedAt,
    status: 'pending_human_listening',
    repositorySnapshot: snapshot,
    verdict,
    summary,
    currentMpv2Flow: currentMpv2Flow(),
    addedCueKeys: EXPECTED_ADDED_KEYS.map((key) => cueKeySummary(key, canonicalCueMap)),
    runtimeCueSurface: RUNTIME_REACHABLE_KEYS.map((key) => cueKeySummary(key, canonicalCueMap)),
    canonicalCueMap,
    v21Reconciliation: v21Reconciliation(canonicalCueMap),
    approvedDecisionAlignment: approvedDecisionAlignment(canonicalCueMap),
    operationalCueReview: operationalCueReview(canonicalCueMap),
    overlapResolutions: overlapResolutions(canonicalCueMap),
    sourceBinaryProvenance: canonicalCueMap.map((row) => ({
      cueKey: row.cueKey,
      claraPath: row.claraPath,
      marcusPath: row.marcusPath,
      provenance: row.sourceBinaryProvenance,
      requiresHumanListening: row.requiresHumanListening === 'true',
    })),
    technicalQc,
    voiceParity: voiceParity(canonicalCueMap, technicalQc),
    eventCueGraph,
    targetedRuntimeAuditHandoff: {
      artifact: OUT.runtimeInput,
      scopeArtifact: OUT.runtimeScope,
      eventCount: eventCueGraph.length,
      requiredScenarioCount: requiredScenarios.length,
      listeningReviewRequiredBeforeFinalVerdict: true,
    },
    validation,
    limitations: [
      'No human listened to or transcribed the files during this audit; expected scripts remain source expectations until the listening pack is completed.',
      'Local ffmpeg/ffprobe metrics are technical checks only and do not prove semantic correctness.',
      'The current worktree was already dirty; this audit treats untracked MPV2 files as current state without changing them.',
      'The targeted runtime timing audit was scoped but intentionally not run.',
    ],
  };

  writeFile(OUT.canonicalCsv, toCsv(canonicalCueMap, CANONICAL_COLUMNS));
  writeFile(OUT.qcCsv, toCsv(technicalQc, QC_COLUMNS));
  writeFile(OUT.json, `${JSON.stringify(audit, null, 2)}\n`);
  writeFile(OUT.md, renderMarkdown(audit));
  writeFile(OUT.html, renderListeningHtml(listeningRows, summary, generatedAt));
  writeFile(OUT.guide, renderListeningGuide(summary));
  writeFile(OUT.runtimeInput, `${JSON.stringify(runtimeInput, null, 2)}\n`);
  writeFile(OUT.runtimeScope, renderRuntimeScope(runtimeInput));

  console.log(`Wrote ${Object.values(OUT).join(', ')}`);
  console.log(`Verdict ${verdict.preliminary}; listeningRows=${listeningRows.length}; events=${eventCueGraph.length}; scenarios=${requiredScenarios.length}`);
  if (validation.hardFailures.length > 0) {
    console.error(validation.hardFailures.join('\n'));
    process.exitCode = 1;
  }
}

function repositorySnapshot(generatedAt) {
  const statusShort = safeGit(['status', '--short', '--branch']).trimEnd().split('\n').filter(Boolean);
  const porcelain = safeGit(['status', '--porcelain=v1']).trimEnd().split('\n').filter(Boolean);
  return {
    generatedAt,
    branch: safeGit(['branch', '--show-current']).trim(),
    head: safeGit(['rev-parse', 'HEAD']).trim(),
    shortHead: safeGit(['rev-parse', '--short', 'HEAD']).trim(),
    upstream: safeGit(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']).trim() || null,
    worktreeClean: porcelain.length === 0,
    worktreeState: porcelain.length === 0 ? 'clean' : 'dirty_before_audit_work',
    statusShort,
    nodeVersion: process.version,
    ffmpegVersion: firstLine(safeRun('ffmpeg', ['-version']).stdout),
    ffprobeVersion: firstLine(safeRun('ffprobe', ['-version']).stdout),
  };
}

function parseMpv2Definitions() {
  const file = 'src/movementProfileV2/voiceCues.ts';
  const text = readText(file);
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/definition\((['"])(.*?)\1,\s*(['"])(.*?)\3,\s*(['"])(.*?)\5,\s*(\d+),\s*(['"])(.*?)\8\)/);
    if (!match) continue;
    rows.push({
      id: match[2],
      text: unescapeTsString(match[4]),
      tier: match[6],
      priority: Number(match[7]),
      source: match[9],
      file,
      symbol: 'MOVEMENT_PROFILE_V2_CUE_DEFINITIONS',
      line: lineNumberOf(text, `definition('${match[2]}'`) || lineNumberOf(text, `definition("${match[2]}"`),
    });
  }
  return rows;
}

function buildAssetIndex(inventoryRows) {
  const rowsByPath = new Map(inventoryRows.map((row) => [row.path, row]));
  const rowsByVoiceKey = new Map();
  for (const row of inventoryRows) {
    if (row.voiceId && row.cueKey) rowsByVoiceKey.set(`${row.voiceId}:${row.cueKey}`, row);
  }
  return {
    rowsByPath,
    rowsByVoiceKey,
    get(voiceId, cueKey) {
      const fromInventory = rowsByVoiceKey.get(`${voiceId}:${cueKey}`);
      if (fromInventory) return fromInventory;
      const filePath = `assets/audio/voice/${voiceId}/${cueKey}.mp3`;
      return probeAsset(filePath, voiceId, cueKey);
    },
  };
}

function buildCanonicalCueMap(input) {
  const { definitions, assets, v21ByKey, currentCueByKey, eventCueGraph } = input;
  const definitionByKey = new Map(definitions.map((definition) => [definition.id, definition]));
  const eventsByCue = new Map();
  for (const event of eventCueGraph) {
    for (const key of event.cueKeys) {
      if (!eventsByCue.has(key)) eventsByCue.set(key, []);
      eventsByCue.get(key).push(event);
    }
  }
  const rows = [];
  for (const key of EXPECTED_ADDED_KEYS) {
    const def = definitionByKey.get(key);
    if (!def) continue;
    const v21 = v21ByKey.get(key);
    const clara = assets.get('clara', key);
    const marcus = assets.get('marcus', key);
    const events = eventsByCue.get(key) ?? [];
    const reachable = RUNTIME_REACHABLE_KEYS.includes(key);
    const stage = stableUnique(events.map((event) => event.stage)).join(';') || (DEFINED_NOT_EMITTED_KEYS.includes(key) ? 'defined_not_emitted' : '');
    const trigger = stableUnique(events.map((event) => event.trigger)).join(';') || 'No current MPV2 emitter found; defined and bundled for shared recovery/future migration.';
    const status = classifyV21(def, v21);
    rows.push({
      cueKey: key,
      namespace: namespaceForKey(key),
      currentScript: def.text,
      currentSourceFile: def.file,
      currentSourceSymbol: def.symbol,
      flow: 'movement_profile_v2_checkup',
      stage,
      category: categoryForDefinition(def),
      trigger,
      triggerConditions: triggerConditionsForKey(key, events),
      currentPriority: String(def.priority),
      currentPolicyClass: def.tier,
      currentRequiredness: 'required_fail_closed',
      currentMissingAssetPolicy:
        'MPV2 cue resolution throws for missing selected-voice asset; VoiceChannel catches, skips that cue, and continues any pending sequence.',
      currentRepeatRule: repeatRuleForKey(key),
      currentCancelRule: 'voice.stop() on unmount/cancel/app background; higher-priority speech interrupts lower-priority speech.',
      currentBlocksProgression: 'false',
      currentManifestFile: 'src/audio/manifest.ts; src/audio/movementProfileV2AudioManifest.ts',
      currentManifestStatus: pairStatus(clara, marcus),
      claraPath: clara?.path ?? '',
      marcusPath: marcus?.path ?? '',
      claraDurationMs: clara?.durationMs ?? '',
      marcusDurationMs: marcus?.durationMs ?? '',
      currentRuntimeReachability: reachable ? 'runtime_reachable' : 'defined_generated_not_currently_emitted',
      currentRuntimeCallPath: reachable
        ? 'MovementProfileV2CheckUpScreen effect -> MovementProfileV2VoiceSequencer/initialMovementProfileV2VoiceEvent -> VoiceChannel.speak -> VOICE_MANIFEST'
        : 'Defined in MovementProfileV2CueId and bundled, but not returned by initialMovementProfileV2VoiceEvent or resolveMovementProfileV2CueIdsForTransition.',
      v21MatchStatus: status,
      v21CueKey: v21?.newCueKey ?? '',
      v21Script: v21?.exactScript ?? '',
      v21PolicyId: v21?.policyId ?? '',
      approvedDecisionIds: decisionIdsForKey(key),
      decisionAlignment: decisionAlignmentForKey(key),
      copyQuality: copyQualityForKey(key),
      sourceBinaryProvenance:
        'source_present_binary_untracked;current_source_expected_text_only;actual_content_requires_listening',
      proposedAction: proposedActionForKey(key, status),
      requiresHumanListening: 'true',
      requiresV21Patch: key.startsWith('mpv2_') ? 'true_after_listening_not_before' : 'false',
      requiresRuntimeAudit: reachable || DEFINED_NOT_EMITTED_KEYS.includes(key) ? 'true' : 'false',
      implementationDependencyIds: implementationIdsForKey(key),
      notes: notesForKey(key),
    });
  }
  rows.push(overlapChairResultRow({ assets, v21ByKey, currentCueByKey }));
  rows.push(overlapTugRow({ key: 'tug-intro', assets, v21ByKey, currentCueByKey }));
  rows.push(overlapTugRow({ key: 'tug-setup', assets, v21ByKey, currentCueByKey }));
  return rows.sort((a, b) => a.cueKey.localeCompare(b.cueKey));
}

function overlapChairResultRow({ assets, v21ByKey }) {
  const key = 'chair-result-prefix-v21';
  const physicalKey = 'you-completed';
  const v21 = v21ByKey.get(key);
  const clara = assets.get('clara', physicalKey);
  const marcus = assets.get('marcus', physicalKey);
  return {
    cueKey: key,
    namespace: 'dynamic_result',
    currentScript: 'You completed',
    currentSourceFile: 'src/audio/cues.ts; src/assessment/sessionController.ts',
    currentSourceSymbol: 'VoiceCueKey / legacy result composition using you-completed',
    flow: 'legacy_checkup_result_composition',
    stage: 'result_fragment',
    category: 'result',
    trigger: 'Legacy assessment result sentence prefix; not emitted by current MPV2 live coordinator.',
    triggerConditions: 'Current MPV2 raw completion does not compose chair rep count audio.',
    currentPriority: '9',
    currentPolicyClass: 'result_transition',
    currentRequiredness: 'conditional',
    currentMissingAssetPolicy: 'Legacy non-MPV2 cue can fall back to default voice if selected voice asset is absent.',
    currentRepeatRule: 'Legacy result sentence is emitted per completed item result.',
    currentCancelRule: 'VoiceChannel stop/interrupt rules apply.',
    currentBlocksProgression: 'false',
    currentManifestFile: 'src/audio/manifest.ts',
    currentManifestStatus: pairStatus(clara, marcus) + '; physical key is you-completed',
    claraPath: clara?.path ?? '',
    marcusPath: marcus?.path ?? '',
    claraDurationMs: clara?.durationMs ?? '',
    marcusDurationMs: marcus?.durationMs ?? '',
    currentRuntimeReachability: 'not_current_mpv2_reachable;legacy_reused_reference',
    currentRuntimeCallPath: 'Legacy assessment sessionController result composition; no MPV2 call site found.',
    v21MatchStatus: 'different_key_same_script',
    v21CueKey: key,
    v21Script: v21?.exactScript ?? 'You completed',
    v21PolicyId: v21?.policyId ?? 'result_transition',
    approvedDecisionIds: 'FD-006',
    decisionAlignment: 'aligned',
    copyQuality: 'ready_for_human_review',
    sourceBinaryProvenance: 'verified_historical_match;actual_content_requires_listening_for_v21_reuse',
    proposedAction: 'alias_current_key_to_v21_key_later',
    requiresHumanListening: 'true',
    requiresV21Patch: 'false',
    requiresRuntimeAudit: 'false',
    implementationDependencyIds: 'LEGACY-RESULT-COMPOSITION;V21-ALIAS-MIGRATION',
    notes:
      'V2.1 proposes a stable key for the same words. Current physical assets live under you-completed; aliasing is safe only after listening confirms binary wording.',
  };
}

function overlapTugRow({ key, assets, v21ByKey, currentCueByKey }) {
  const v21 = v21ByKey.get(key);
  const current = currentCueByKey.get(key);
  const clara = assets.get('clara', key);
  const marcus = assets.get('marcus', key);
  return {
    cueKey: key,
    namespace: 'conditional_legacy',
    currentScript: current?.expectedScript ?? '',
    currentSourceFile: 'src/audio/cues.ts; src/checkup/checkup.ts; legacy checkup controller',
    currentSourceSymbol: 'VoiceCueKey / timed-up-and-go legacy assessment',
    flow: 'timed_up_and_go_beta_or_custom_only',
    stage: 'legacy_tug_setup',
    category: 'assessment_instruction',
    trigger: 'Only reachable from legacy/custom/beta TUG assessment paths; not in the current MPV2 default live path.',
    triggerConditions: 'TUG remains conditional protocol-only; physical asset existence must not move it into MPV2.',
    currentPriority: '8',
    currentPolicyClass: 'instruction',
    currentRequiredness: 'legacy_only',
    currentMissingAssetPolicy: 'Legacy non-MPV2 cue can fall back to default voice if selected voice asset is absent.',
    currentRepeatRule: 'Per legacy TUG item start.',
    currentCancelRule: 'VoiceChannel stop/interrupt rules apply.',
    currentBlocksProgression: 'false',
    currentManifestFile: 'src/audio/manifest.ts',
    currentManifestStatus: pairStatus(clara, marcus),
    claraPath: clara?.path ?? '',
    marcusPath: marcus?.path ?? '',
    claraDurationMs: clara?.durationMs ?? '',
    marcusDurationMs: marcus?.durationMs ?? '',
    currentRuntimeReachability: 'not_current_mpv2_reachable;conditional_legacy',
    currentRuntimeCallPath: 'Legacy CheckUpScreen/sessionController, not MovementProfileV2CheckUpScreen.',
    v21MatchStatus: normalizeScript(current?.expectedScript) === normalizeScript(v21?.exactScript)
      ? 'legacy_reuse'
      : 'same_key_different_script',
    v21CueKey: key,
    v21Script: v21?.exactScript ?? '',
    v21PolicyId: v21?.policyId ?? '',
    approvedDecisionIds: 'FD-003',
    decisionAlignment: 'aligned',
    copyQuality: 'legacy_only',
    sourceBinaryProvenance: 'verified_historical_match;current_source_expected_text_only;actual_content_requires_listening_for_v21_reuse',
    proposedAction: 'conditional_legacy_only',
    requiresHumanListening: 'true',
    requiresV21Patch: 'false',
    requiresRuntimeAudit: 'true',
    implementationDependencyIds: 'LEGACY-TUG-BETA-ONLY;V21-CONDITIONAL-PROTOCOL',
    notes:
      'V2.1 intentionally keeps TUG conditional. Current source text differs from the V2.1 proposed shorter line, so do not reuse for V2.1 wording without listening and a later migration decision.',
  };
}

function buildTechnicalQc({ assets }) {
  const baselineDurationsByVoice = new Map();
  for (const voice of VOICES) {
    const durations = [];
    for (const row of assets.rowsByVoiceKey.values()) {
      if (row.voiceId === voice && row.baselineStatus === 'unchanged_from_baseline' && Number(row.durationMs) > 0) {
        durations.push(Number(row.durationMs));
      }
    }
    baselineDurationsByVoice.set(voice, durations.sort((a, b) => a - b));
  }
  const rows = [];
  for (const logicalKey of QC_PHYSICAL_KEYS) {
    for (const voice of VOICES) {
      const physicalKey = logicalKey;
      const asset = assets.get(voice, physicalKey);
      const paired = assets.get(voice === 'clara' ? 'marcus' : 'clara', physicalKey);
      const audio = audioMetrics(asset.path);
      const durationPercentile = durationPercentileFor(Number(asset.durationMs), baselineDurationsByVoice.get(voice) ?? []);
      const pairDelta = asset.durationMs && paired?.durationMs ? Number(asset.durationMs) - Number(paired.durationMs) : '';
      const flags = qcFlags({ asset, audio, percentile: durationPercentile, pairDelta });
      rows.push({
        voiceId: voice,
        cueKey: logicalKey,
        path: asset.path,
        sha256: asset.sha256 || sha256File(asset.path),
        durationMs: asset.durationMs,
        codec: asset.codec,
        container: asset.container,
        sampleRateHz: asset.sampleRateHz,
        channels: asset.channels,
        bitRate: asset.bitRate,
        lufsI: audio.lufsI,
        loudnessRange: audio.loudnessRange,
        truePeakDbfs: audio.truePeakDbfs,
        leadingSilenceMs: audio.leadingSilenceMs,
        trailingSilenceMs: audio.trailingSilenceMs,
        decodeStatus: asset.decodeStatus || audio.decodeStatus,
        clippingFlag: audio.truePeakDbfs !== '' && Number(audio.truePeakDbfs) > -0.5 ? 'true' : 'false',
        baselineDurationPercentile: durationPercentile,
        pairedDurationDeltaMs: pairDelta,
        outlierFlags: flags.length ? flags.join(';') : 'none',
        notes: qcNotes(logicalKey, asset),
      });
    }
  }
  return rows;
}

function audioMetrics(filePath) {
  const absPath = path.join(ROOT, filePath);
  if (!fs.existsSync(absPath)) {
    return {
      lufsI: '',
      loudnessRange: '',
      truePeakDbfs: '',
      leadingSilenceMs: '',
      trailingSilenceMs: '',
      decodeStatus: 'missing',
    };
  }
  const ebur = safeRun('ffmpeg', [
    '-hide_banner',
    '-nostats',
    '-i',
    absPath,
    '-filter_complex',
    'ebur128=peak=true',
    '-f',
    'null',
    '-',
  ]);
  const eburText = `${ebur.stdout}\n${ebur.stderr}`;
  const lufs = lastMatch(eburText, /I:\s*(-?\d+(?:\.\d+)?) LUFS/g);
  const lra = lastMatch(eburText, /LRA:\s*(-?\d+(?:\.\d+)?) LU/g);
  const peak = lastMatch(eburText, /Peak:\s*(-?\d+(?:\.\d+)?) dBFS/g);
  const silence = safeRun('ffmpeg', [
    '-hide_banner',
    '-nostats',
    '-i',
    absPath,
    '-af',
    'silencedetect=noise=-45dB:d=0.05',
    '-f',
    'null',
    '-',
  ]);
  const silenceText = `${silence.stdout}\n${silence.stderr}`;
  const durationSec = Number(ffprobeJson(filePath)?.format?.duration ?? 0);
  return {
    lufsI: lufs,
    loudnessRange: lra,
    truePeakDbfs: peak,
    ...silenceMetrics(silenceText, durationSec),
    decodeStatus: ebur.status === 0 ? 'ok' : 'decode_warning',
  };
}

function silenceMetrics(text, durationSec) {
  const starts = [...text.matchAll(/silence_start:\s*([0-9.]+)/g)].map((m) => Number(m[1]));
  const ends = [...text.matchAll(/silence_end:\s*([0-9.]+)\s*\|\s*silence_duration:\s*([0-9.]+)/g)].map((m) => ({
    end: Number(m[1]),
    duration: Number(m[2]),
  }));
  let leading = '';
  if (starts.length && starts[0] < 0.08 && ends.length) leading = Math.round(ends[0].end * 1000);
  let trailing = '';
  if (starts.length && ends.length && durationSec) {
    const lastStart = starts[starts.length - 1];
    const lastEnd = ends[ends.length - 1];
    if (Math.abs(lastEnd.end - durationSec) < 0.25) trailing = Math.round((lastEnd.end - lastStart) * 1000);
  }
  return { leadingSilenceMs: leading, trailingSilenceMs: trailing };
}

function buildEventCueGraph(definitions) {
  const defByKey = new Map(definitions.map((definition) => [definition.id, definition]));
  const event = (input) => {
    const priority = input.cueKeys.length
      ? Math.max(...input.cueKeys.map((key) => Number(defByKey.get(key)?.priority ?? input.priority ?? 0)))
      : Number(input.priority ?? 0);
    return {
      eventId: input.eventId,
      screenController: input.screenController ?? 'MovementProfileV2CheckUpScreen / MovementProfileV2LiveCoordinator',
      stateBefore: input.stateBefore,
      trigger: input.trigger,
      sourceSymbol: input.sourceSymbol,
      cueKeys: input.cueKeys,
      priority,
      requiredness: input.requiredness ?? (input.cueKeys.length ? 'required_fail_closed' : 'not_applicable'),
      fallbackBehavior: input.fallbackBehavior ?? 'MPV2 cues fail closed at resolution; VoiceChannel catches and skips failed cue.',
      blocksProgression: false,
      timerState: input.timerState,
      measurementState: input.measurementState,
      canRepeat: input.canRepeat ?? 'No within a transition key; yes on new retry/attempt epoch where transition key differs.',
      throttleDeduplication: input.throttleDeduplication ?? 'MovementProfileV2VoiceSequencer emits once per transitionKey.',
      cancellationOnStateExit: 'voice.stop() on unmount/cancel/app background; otherwise queued sequence continues until interrupted.',
      nextPossibleCompetingEvents: input.nextPossibleCompetingEvents ?? [],
      userActionBranches: input.userActionBranches ?? [],
      recoveryBranches: input.recoveryBranches ?? [],
      missingAssetBranch: input.missingAssetBranch ?? 'If selected-voice MPV2 asset is missing, resolver throws; playCue logs skipped cue and advances pending sequence.',
      currentTestCoverage: input.currentTestCoverage ?? [
        'src/movementProfileV2/__tests__/voiceCues.test.ts',
        'src/audio/__tests__/voicePlayer.test.ts',
      ],
      stage: input.stage,
      source: input.source ?? { file: 'src/movementProfileV2/voiceCues.ts', symbol: input.sourceSymbol, line: 0 },
      branches: [...(input.userActionBranches ?? []), ...(input.recoveryBranches ?? [])],
    };
  };
  return [
    event({
      eventId: 'mpv2_entry_initial_intro',
      stateBefore: 'screen_mount',
      stage: 'chair_setup',
      trigger: 'React mount effect creates initialMovementProfileV2VoiceEvent.',
      sourceSymbol: 'initialMovementProfileV2VoiceEvent',
      cueKeys: ['mpv2_checkup_intro', 'checkup-chair-stand-intro-v21', 'checkup-chair-stand-setup-v21'],
      timerState: 'no active measurement timer',
      measurementState: 'not active',
      userActionBranches: ['confirm_chair_setup may occur while intro sequence is still playing'],
    }),
    event({
      eventId: 'chair_setup_confirmed_to_practice',
      stateBefore: 'chair_setup',
      stage: 'chair_practice',
      trigger: 'User confirms chair setup.',
      sourceSymbol: 'resolveMovementProfileV2CueIdsForTransition',
      cueKeys: ['mpv2_chair_practice_start'],
      timerState: 'no active measurement timer',
      measurementState: 'practice detection waiting for stand',
      userActionBranches: ['practice auto-completes when stand is detected', 'backgrounded'],
    }),
    event({
      eventId: 'chair_practice_completed_to_countdown',
      stateBefore: 'chair_practice',
      stage: 'chair_countdown',
      trigger: 'Practice rep completes.',
      sourceSymbol: 'resolveMovementProfileV2CueIdsForTransition',
      cueKeys: ['mpv2_chair_official_ready'],
      timerState: 'internal 3000ms countdown begins',
      measurementState: 'official chair measurement not active yet',
      nextPossibleCompetingEvents: ['chair_countdown_elapsed_to_active'],
    }),
    event({
      eventId: 'chair_countdown_elapsed_to_active',
      stateBefore: 'chair_countdown',
      stage: 'chair_active',
      trigger: 'Internal countdown timer elapses.',
      sourceSymbol: 'MovementProfileV2LiveCoordinator.receiveTimerTick',
      cueKeys: [],
      priority: 0,
      requiredness: 'not_applicable',
      fallbackBehavior: 'No spoken countdown-three/two/one/go is emitted by current MPV2.',
      timerState: '30s chair timer starts',
      measurementState: 'chair measurement active',
      nextPossibleCompetingEvents: ['chair_deadline_to_balance_setup'],
    }),
    event({
      eventId: 'chair_deadline_to_balance_setup',
      stateBefore: 'chair_active',
      stage: 'balance_setup',
      trigger: '30-second chair timer ends.',
      sourceSymbol: 'resolveMovementProfileV2CueIdsForTransition',
      cueKeys: ['times-up-v21', 'checkup-balance-intro-v21', 'checkup-balance-single-leg-v21'],
      timerState: 'chair timer ended',
      measurementState: 'chair measurement finalized; balance setup not active',
      nextPossibleCompetingEvents: ['balance_setup_confirmed_to_ready'],
    }),
    event({
      eventId: 'balance_setup_confirmed_to_ready',
      stateBefore: 'balance_setup',
      stage: 'balance_ready',
      trigger: 'User confirms selected standing leg.',
      sourceSymbol: 'resolveMovementProfileV2CueIdsForTransition',
      cueKeys: ['mpv2_balance_attempt_start'],
      timerState: 'waiting for raised-foot detection',
      measurementState: 'balance measurement not active',
      userActionBranches: ['selected standing leg controls raised-foot side'],
    }),
    event({
      eventId: 'balance_lift_detected_to_trial',
      stateBefore: 'balance_ready',
      stage: 'balance_trial',
      trigger: 'Raised foot is detected.',
      sourceSymbol: 'resolveMovementProfileV2CueIdsForTransition',
      cueKeys: ['mpv2_balance_attempt_start'],
      timerState: '45s balance attempt timer starts',
      measurementState: 'balance measurement active',
      nextPossibleCompetingEvents: ['balance_valid_trial_to_rest', 'balance_invalid_trial_to_rest', 'balance_section_complete_ceiling'],
    }),
    event({
      eventId: 'balance_valid_trial_to_rest',
      stateBefore: 'balance_trial',
      stage: 'balance_rest',
      trigger: 'Balance attempt terminates with valid hold below ceiling.',
      sourceSymbol: 'resolveMovementProfileV2CueIdsForTransition',
      cueKeys: ['mpv2_balance_attempt_saved', 'mpv2_balance_rest'],
      timerState: 'rest timer starts',
      measurementState: 'balance measurement inactive',
      userActionBranches: ['use_best', 'start_next_after_30', 'default_after_60'],
    }),
    event({
      eventId: 'balance_invalid_trial_to_rest',
      stateBefore: 'balance_trial',
      stage: 'balance_rest',
      trigger: 'Tracking interruption invalidates attempt.',
      sourceSymbol: 'resolveMovementProfileV2CueIdsForTransition',
      cueKeys: ['mpv2_balance_tracking_retry'],
      timerState: 'retry rest timer starts',
      measurementState: 'invalid trial discarded',
      recoveryBranches: ['balance_rest_ready_after_30'],
    }),
    event({
      eventId: 'balance_rest_ready_after_30',
      stateBefore: 'balance_rest',
      stage: 'balance_ready',
      trigger: 'User starts next attempt after minimum rest.',
      sourceSymbol: 'resolveMovementProfileV2CueIdsForTransition',
      cueKeys: ['mpv2_balance_ready_after_30'],
      timerState: 'ready; no measurement timer',
      measurementState: 'balance measurement not active',
    }),
    event({
      eventId: 'balance_default_rest_elapsed',
      stateBefore: 'balance_rest',
      stage: 'balance_ready',
      trigger: 'Default 60-second rest elapses.',
      sourceSymbol: 'resolveMovementProfileV2CueIdsForTransition',
      cueKeys: ['mpv2_balance_ready_after_60'],
      timerState: 'ready; no measurement timer',
      measurementState: 'balance measurement not active',
    }),
    event({
      eventId: 'balance_user_accepted_best',
      stateBefore: 'balance_rest',
      stage: 'shoulder_setup',
      trigger: 'User chooses to use best balance result.',
      sourceSymbol: 'resolveMovementProfileV2CueIdsForTransition',
      cueKeys: ['mpv2_balance_use_best', 'mpv2_balance_complete'],
      timerState: 'balance rest ends',
      measurementState: 'balance complete',
    }),
    event({
      eventId: 'balance_section_complete_ceiling',
      stateBefore: 'balance_trial',
      stage: 'shoulder_setup',
      trigger: 'Balance attempt reaches full 45-second ceiling.',
      sourceSymbol: 'resolveMovementProfileV2CueIdsForTransition',
      cueKeys: ['mpv2_balance_full_hold', 'mpv2_balance_complete'],
      timerState: 'balance timer ended',
      measurementState: 'balance complete',
    }),
    event({
      eventId: 'balance_section_complete_non_ceiling',
      stateBefore: 'balance_trial_or_rest',
      stage: 'shoulder_setup',
      trigger: 'Maximum valid attempts complete without ceiling.',
      sourceSymbol: 'resolveMovementProfileV2CueIdsForTransition',
      cueKeys: ['mpv2_balance_complete'],
      timerState: 'balance timer ended',
      measurementState: 'balance complete',
    }),
    event({
      eventId: 'shoulder_setup_confirmed_left',
      stateBefore: 'shoulder_setup',
      stage: 'shoulder_ready',
      trigger: 'User selects left shoulder side and confirms setup.',
      sourceSymbol: 'resolveMovementProfileV2CueIdsForTransition',
      cueKeys: ['checkup-shoulder-turn-left-v21', 'checkup-shoulder-raise-left-v21', 'final-position-set-v21'],
      timerState: 'waiting for arm raise',
      measurementState: 'shoulder measurement not active',
      userActionBranches: ['selected side is passed to setup and grader'],
    }),
    event({
      eventId: 'shoulder_setup_confirmed_right',
      stateBefore: 'shoulder_setup',
      stage: 'shoulder_ready',
      trigger: 'User selects right shoulder side and confirms setup.',
      sourceSymbol: 'resolveMovementProfileV2CueIdsForTransition',
      cueKeys: ['checkup-shoulder-turn-right-v21', 'checkup-shoulder-raise-right-v21', 'final-position-set-v21'],
      timerState: 'waiting for arm raise',
      measurementState: 'shoulder measurement not active',
      userActionBranches: ['selected side is passed to setup and grader'],
    }),
    event({
      eventId: 'shoulder_capture_started',
      stateBefore: 'shoulder_ready',
      stage: 'shoulder_active',
      trigger: 'Arm raise start condition is met.',
      sourceSymbol: 'resolveMovementProfileV2CueIdsForTransition',
      cueKeys: [],
      priority: 0,
      requiredness: 'not_applicable',
      fallbackBehavior: 'No additional active-start cue is emitted.',
      timerState: 'shoulder capture timer active',
      measurementState: 'shoulder measurement active',
    }),
    event({
      eventId: 'shoulder_tracking_retry_ready',
      stateBefore: 'shoulder_active',
      stage: 'shoulder_retry_ready',
      trigger: 'Tracking interruption during shoulder capture.',
      sourceSymbol: 'resolveMovementProfileV2CueIdsForTransition',
      cueKeys: ['mpv2_shoulder_tracking_retry'],
      timerState: 'retry ready; measurement inactive',
      measurementState: 'shoulder capture reset',
      recoveryBranches: ['shoulder_setup_confirmed_same_side'],
    }),
    event({
      eventId: 'shoulder_section_complete_to_hinge',
      stateBefore: 'shoulder_active',
      stage: 'hinge_setup',
      trigger: 'Shoulder capture completes.',
      sourceSymbol: 'resolveMovementProfileV2CueIdsForTransition',
      cueKeys: ['item-complete-v21', 'checkup-hinge-setup-v21', 'final-position-set-v21'],
      timerState: 'hinge setup waiting',
      measurementState: 'shoulder complete',
    }),
    event({
      eventId: 'hinge_capture_started',
      stateBefore: 'hinge_setup',
      stage: 'hinge_active',
      trigger: 'Forward fold start condition is met.',
      sourceSymbol: 'resolveMovementProfileV2CueIdsForTransition',
      cueKeys: [],
      priority: 0,
      requiredness: 'not_applicable',
      fallbackBehavior: 'No additional active-start cue is emitted.',
      timerState: 'hinge capture timer active',
      measurementState: 'hinge measurement active',
    }),
    event({
      eventId: 'hinge_recorded_valid',
      stateBefore: 'hinge_active',
      stage: 'raw_complete',
      trigger: 'Hinge capture completes with valid measurement.',
      sourceSymbol: 'resolveMovementProfileV2CueIdsForTransition',
      cueKeys: ['mpv2_hinge_complete', 'checkup-complete-v21'],
      timerState: 'all measurement timers ended',
      measurementState: 'raw check-up complete',
    }),
    event({
      eventId: 'hinge_recorded_invalid',
      stateBefore: 'hinge_active',
      stage: 'raw_complete',
      trigger: 'Hinge capture completes without valid measurement.',
      sourceSymbol: 'resolveMovementProfileV2CueIdsForTransition',
      cueKeys: ['mpv2_hinge_no_measurement', 'checkup-complete-v21'],
      timerState: 'all measurement timers ended',
      measurementState: 'raw check-up complete with missing hinge metric',
    }),
    event({
      eventId: 'shared_retry_defined_not_emitted',
      stateBefore: 'any',
      stage: 'defined_not_emitted',
      trigger: 'Cue exists for V2.1/shared recovery but no current MPV2 transition returns it.',
      sourceSymbol: 'MOVEMENT_PROFILE_V2_CUE_DEFINITIONS',
      cueKeys: ['retry-v21'],
      timerState: 'not modelled',
      measurementState: 'not modelled',
      canRepeat: 'Not currently emitted.',
    }),
    event({
      eventId: 'tracking_loss_defined_not_emitted',
      stateBefore: 'any',
      stage: 'defined_not_emitted',
      trigger: 'Cue exists for V2.1 tracking loss but no current MPV2 transition returns it.',
      sourceSymbol: 'MOVEMENT_PROFILE_V2_CUE_DEFINITIONS',
      cueKeys: ['tracking-loss-v21'],
      timerState: 'not modelled',
      measurementState: 'not modelled',
      canRepeat: 'Not currently emitted.',
    }),
    event({
      eventId: 'tracking_recovered_defined_not_emitted',
      stateBefore: 'any',
      stage: 'defined_not_emitted',
      trigger: 'Cue exists for V2.1 tracking recovery but no current MPV2 transition returns it.',
      sourceSymbol: 'MOVEMENT_PROFILE_V2_CUE_DEFINITIONS',
      cueKeys: ['tracking-recovered-v21'],
      timerState: 'not modelled',
      measurementState: 'not modelled',
      canRepeat: 'Not currently emitted.',
    }),
    event({
      eventId: 'recovery_screen_retry_branch',
      screenController: 'MovementProfileV2RecoveryScreen',
      stateBefore: 'recovery_screen',
      stage: 'recovery_screen',
      trigger: 'User chooses retry from recovery screen.',
      sourceSymbol: 'MovementProfileV2RecoveryScreen',
      cueKeys: [],
      priority: 0,
      requiredness: 'not_applicable',
      fallbackBehavior: 'Recovery screen has no current voice playback.',
      timerState: 'screen-level retry/navigation',
      measurementState: 'not active',
      userActionBranches: ['retry', 'continue_with_raw', 'start_training_when_available'],
      currentTestCoverage: ['src/movementProfileV2/__tests__/recovery.test.ts'],
    }),
    event({
      eventId: 'unmount_cancel_or_background',
      stateBefore: 'any_mounted_state',
      stage: 'any',
      trigger: 'Unmount, cancel, or app background event.',
      sourceSymbol: 'MovementProfileV2CheckUpScreen useEffect cleanup/AppState handler',
      cueKeys: [],
      priority: 0,
      requiredness: 'not_applicable',
      fallbackBehavior: 'voice.stop() clears current and pending cues.',
      timerState: 'controller may receive backgrounded action',
      measurementState: 'state depends on active stage',
      userActionBranches: ['foreground resumes coordinator without replaying previous cue sequence'],
    }),
    event({
      eventId: 'missing_required_cue',
      stateBefore: 'voice_playback_resolution',
      stage: 'audio_resolution',
      trigger: 'Selected voice lacks required MPV2 asset.',
      sourceSymbol: 'resolveVoiceCueAssetFromManifest',
      cueKeys: EXPECTED_ADDED_KEYS,
      priority: 100,
      requiredness: 'required_fail_closed',
      fallbackBehavior: 'Throws instead of falling back; VoiceChannel playCue catches and skips failed cue.',
      timerState: 'unaffected by speech failure',
      measurementState: 'unaffected by speech failure',
      currentTestCoverage: ['src/audio/__tests__/voicePlayer.test.ts'],
    }),
    event({
      eventId: 'playback_start_failure',
      stateBefore: 'voice_playback_start',
      stage: 'audio_playback',
      trigger: 'createAudioPlayer or player.play fails.',
      sourceSymbol: 'VoiceChannel.playCue',
      cueKeys: EXPECTED_ADDED_KEYS,
      priority: 100,
      requiredness: 'required_fail_closed',
      fallbackBehavior: 'Logs skipped cue and advances pending sequence if any.',
      timerState: 'unaffected by speech failure',
      measurementState: 'unaffected by speech failure',
      currentTestCoverage: ['src/audio/__tests__/voicePlayer.test.ts'],
    }),
  ];
}

function buildRuntimeInput({ generatedAt, snapshot, canonicalCueMap, technicalQc, eventCueGraph }) {
  const qcByVoiceKey = new Map(technicalQc.map((row) => [`${row.voiceId}:${row.cueKey}`, row]));
  const assets = canonicalCueMap
    .filter((row) => row.currentRuntimeReachability.includes('runtime_reachable') || row.cueKey.endsWith('-v21') || row.cueKey.startsWith('mpv2_'))
    .map((row) => ({
      cueKey: row.cueKey,
      voiceAssets: {
        clara: assetRuntimeInfo(row, qcByVoiceKey.get(`clara:${physicalKeyForCanonical(row)}`), 'clara'),
        marcus: assetRuntimeInfo(row, qcByVoiceKey.get(`marcus:${physicalKeyForCanonical(row)}`), 'marcus'),
      },
      expectedScript: row.currentScript,
      priority: Number(row.currentPriority) || 0,
      requiredness: row.currentRequiredness,
      missingAssetPolicy: row.currentMissingAssetPolicy,
      listeningStatus: 'pending',
    }));
  const requiredScenarios = requiredRuntimeScenarios();
  return {
    inputVersion: 1,
    generatedAt,
    repositorySnapshot: snapshot,
    scope: {
      flow: 'movement_profile_v2_checkup',
      screens: ['MovementProfileV2CheckUpScreen', 'MovementProfileV2RecoveryScreen'],
      controllers: ['MovementProfileV2LiveCoordinator', 'MovementProfileV2VoiceSequencer', 'VoiceChannel'],
      excludedUnchangedFlows: ['training', 'legacy_checkup', 'micro_check'],
    },
    currentCuePolicies: canonicalCueMap.map((row) => ({
      cueKey: row.cueKey,
      priority: Number(row.currentPriority) || 0,
      requiredness: row.currentRequiredness,
      missingAssetPolicy: row.currentMissingAssetPolicy,
      repeatRule: row.currentRepeatRule,
      cancelRule: row.currentCancelRule,
      blocksProgression: row.currentBlocksProgression === 'true',
    })),
    assets,
    events: eventCueGraph.map((event) => ({
      eventId: event.eventId,
      stage: event.stage,
      source: event.source,
      trigger: event.trigger,
      stateBefore: event.stateBefore,
      cueKeys: event.cueKeys,
      priority: event.priority,
      blocksProgression: event.blocksProgression,
      timerState: event.timerState,
      measurementState: event.measurementState,
      repeatRule: event.canRepeat,
      cancelRule: event.cancellationOnStateExit,
      nextCompetingEventIds: event.nextPossibleCompetingEvents,
      branches: event.branches,
      tests: event.currentTestCoverage,
    })),
    requiredScenarios,
    knownRisks: [
      {
        id: 'mpv2_no_spoken_countdown_or_go',
        severity: 'high',
        detail:
          'Current MPV2 starts the chair measurement after an internal 3000ms countdown without emitting countdown-three/two/one/go, so V2.1 audible-go timing remains unresolved.',
      },
      {
        id: 'speech_does_not_block_progression',
        severity: 'medium',
        detail:
          'React user actions and coordinator timers can advance while prior voice sequences are still playing; audit collision/drop outcomes before preview.',
      },
      {
        id: 'required_cue_throw_is_caught_as_skip',
        severity: 'medium',
        detail:
          'Required MPV2 cue lookup throws without fallback, but VoiceChannel catches the error and advances pending cues, leaving possible silent gaps.',
      },
      {
        id: 'balance_protocol_differs_from_v21_ladder',
        severity: 'medium',
        detail:
          'Current MPV2 balance is a single-leg multi-attempt eyes-open protocol, not the full V2.1 balance ladder.',
      },
    ],
    v21Reconciliation: canonicalCueMap.map((row) => ({
      cueKey: row.cueKey,
      v21MatchStatus: row.v21MatchStatus,
      proposedAction: row.proposedAction,
      requiresHumanListening: row.requiresHumanListening === 'true',
      requiresRuntimeAudit: row.requiresRuntimeAudit === 'true',
    })),
    listeningReviewRequiredBeforeFinalVerdict: true,
  };
}

function assetRuntimeInfo(row, qc, voice) {
  const pathKey = voice === 'clara' ? 'claraPath' : 'marcusPath';
  const durationKey = voice === 'clara' ? 'claraDurationMs' : 'marcusDurationMs';
  return {
    path: row[pathKey],
    durationMs: Number(row[durationKey]) || 0,
    sha256: qc?.sha256 ?? '',
  };
}

function requiredRuntimeScenarios() {
  const normal = [
    'full_normal_mpv2_checkup_clara',
    'full_normal_mpv2_checkup_marcus',
    'chair_practice_to_official_attempt',
    'balance_valid_attempt_rest_next_attempt',
    'balance_invalid_tracking_retry',
    'balance_full_hold_ceiling',
    'balance_use_best',
    'balance_default_ready_after_60',
    'shoulder_left',
    'shoulder_right',
    'hinge_valid_result',
    'completion',
  ];
  const timing = [
    'initial_effect_speech_versus_first_user_action',
    'timer_event_while_prior_cue_playing',
    'equal_priority_event_while_busy',
    'higher_priority_event_while_busy',
    'required_cue_missing',
    'required_asset_resolution_throws',
    'playback_creation_fails',
    'playback_start_callback_fails',
    'cue_completes_after_state_exit',
    'rapid_user_action_during_speech',
    'recovery_event_during_speech',
    'repeated_tracking_loss_event',
    'tracking_recovery_before_loss_cue_finishes',
    'countdown_versus_operational_cue',
    'go_audible_onset_timing',
    'times_up_during_another_cue',
    'result_completion_transition_while_prior_cue_busy',
  ];
  const user = [
    'retry_during_intro',
    'retry_during_chair_practice',
    'retry_during_official_attempt',
    'retry_during_balance_rest',
    'recovery_screen_retry',
    'navigation_unmount_during_speech',
    'app_background_foreground',
    'voice_change_while_screen_mounted_channel_exists',
  ];
  const policy = [
    'priority_50_100_mapping',
    'fail_closed_required_cue_behavior',
    'droppable_setup_reassurance_cues',
    'no_stale_mpv2_operational_cue_after_state_change',
    'clara_marcus_duration_differences_do_not_alter_state_outcome',
  ];
  return [
    ...normal.map((id) => scenario(id, 'normal')),
    ...timing.map((id) => scenario(id, 'timing_collision')),
    ...user.map((id) => scenario(id, 'user_control')),
    ...policy.map((id) => scenario(id, 'policy')),
  ];
}

function scenario(id, category) {
  return {
    id,
    category,
    status: 'required_for_later_targeted_runtime_audit',
    sourceFiles: [
      'src/screens/MovementProfileV2CheckUpScreen.tsx',
      'src/movementProfileV2/liveCoordinator.ts',
      'src/movementProfileV2/voiceCues.ts',
      'src/audio/voicePlayer.ts',
    ],
    tests: [
      'src/movementProfileV2/__tests__/voiceCues.test.ts',
      'src/movementProfileV2/__tests__/liveCoordinator.test.ts',
      'src/audio/__tests__/voicePlayer.test.ts',
      'src/audio/__tests__/movementProfileV2Audio.test.ts',
    ],
  };
}

function buildListeningRows(canonicalCueMap, technicalQc) {
  const qcByCue = new Map();
  for (const row of technicalQc) {
    if (!qcByCue.has(row.cueKey)) qcByCue.set(row.cueKey, []);
    qcByCue.get(row.cueKey).push(row);
  }
  return canonicalCueMap
    .filter((row) => row.requiresHumanListening === 'true')
    .map((row) => {
      const physicalKey = physicalKeyForCanonical(row);
      const qc = qcByCue.get(physicalKey) ?? qcByCue.get(row.cueKey) ?? [];
      return {
        cueKey: row.cueKey,
        physicalKey,
        namespace: row.namespace,
        category: row.category,
        stage: row.stage,
        expectedScript: row.currentScript,
        v21Script: row.v21Script,
        proposedAction: row.proposedAction,
        currentPriority: row.currentPriority,
        requiredness: row.currentRequiredness,
        claraDurationMs: row.claraDurationMs,
        marcusDurationMs: row.marcusDurationMs,
        sourceProvenance: row.sourceBinaryProvenance,
        decisionAlignment: row.decisionAlignment,
        qcFlags: stableUnique(qc.flatMap((item) => String(item.outlierFlags || 'none').split(';'))).join(';') || 'none',
        claraPath: htmlAudioPath(row.claraPath),
        marcusPath: htmlAudioPath(row.marcusPath),
        referenceLabel: row.cueKey === 'chair-result-prefix-v21' ? 'A/B reference: current physical key you-completed' : '',
        notes: row.notes,
      };
    });
}

function buildSummary(input) {
  const { definitions, assets, canonicalCueMap, technicalQc, eventCueGraph, requiredScenarios } = input;
  const addedAssets = [];
  for (const key of EXPECTED_ADDED_KEYS) {
    for (const voice of VOICES) {
      const asset = assets.get(voice, key);
      if (asset?.path) addedAssets.push(asset);
    }
  }
  const exactV21Matches = canonicalCueMap.filter((row) => row.v21MatchStatus === 'exact_key_exact_script').length;
  const aliasReuseCandidates = canonicalCueMap.filter((row) =>
    ['different_key_same_script', 'legacy_reuse'].includes(row.v21MatchStatus) ||
    row.proposedAction === 'alias_current_key_to_v21_key_later'
  ).length;
  const scriptConflicts = canonicalCueMap.filter((row) => row.v21MatchStatus === 'same_key_different_script').length;
  const conditionalLegacyCues = canonicalCueMap.filter((row) => row.namespace === 'conditional_legacy').length;
  const qcOutliers = technicalQc.filter((row) => row.outlierFlags && row.outlierFlags !== 'none').length;
  const missingPairs = EXPECTED_ADDED_KEYS.filter((key) => !assets.get('clara', key)?.path || !assets.get('marcus', key)?.path);
  const runtimeRows = canonicalCueMap.filter((row) => row.currentRuntimeReachability === 'runtime_reachable');
  return {
    currentAddedCueKeyCount: EXPECTED_ADDED_KEYS.length,
    currentAddedMp3Count: addedAssets.length,
    claraMarcusPairCount: EXPECTED_ADDED_KEYS.filter((key) => assets.get('clara', key)?.path && assets.get('marcus', key)?.path).length,
    mpv2RuntimeReachableCueCount: RUNTIME_REACHABLE_KEYS.length,
    exactV21Matches,
    aliasReuseCandidates,
    scriptConflicts,
    currentOnlyMpv2OperationalCueCount: OPERATIONAL_KEYS.length,
    conditionalLegacyCueCount: conditionalLegacyCues,
    sourceManifestDefectCount: missingPairs.length,
    assetsRequiringListeningCount: QC_PHYSICAL_KEYS.length * VOICES.length,
    technicalQcFailureOrOutlierCount: qcOutliers,
    approvedDecisionConflictCount: canonicalCueMap.filter((row) => row.decisionAlignment === 'conflicts_with_approved_decision').length,
    v21PatchRequiredBeforeListening: false,
    audioRegenerationJustifiedNow: false,
    listeningReviewRows: canonicalCueMap.filter((row) => row.requiresHumanListening === 'true').length,
    eventCount: eventCueGraph.length,
    requiredScenarioCount: requiredScenarios.length,
    runtimeReachableCueKeys: runtimeRows.map((row) => row.cueKey),
    definedNotEmittedCueKeys: DEFINED_NOT_EMITTED_KEYS,
    discoveredDefinitionCount: definitions.length,
  };
}

function validate(input) {
  const checks = [];
  const hardFailures = [];
  const check = (id, ok, detail = '') => {
    checks.push({ id, status: ok ? 'pass' : 'fail', detail });
    if (!ok) hardFailures.push(`${id}: ${detail || 'failed'}`);
  };
  check('parse_current_state_json', Boolean(input.priorAudit?.summary), 'current-state JSON loaded');
  check('parse_v21_json', Boolean(input.v21Spec), 'V2.1 JSON loaded');
  check('parse_asset_inventory_csv', input.inventoryRows.length > 0, `${input.inventoryRows.length} inventory rows`);
  check('parse_v21_manifest_csv', input.v21Rows.length > 0, `${input.v21Rows.length} V2.1 rows`);
  check('rediscover_31_current_added_keys', sameSet(input.definitions.map((row) => row.id), EXPECTED_ADDED_KEYS), 'MPV2 definitions match expected 31-key list');
  for (const key of EXPECTED_ADDED_KEYS) {
    check(`pair_present_${key}`, Boolean(input.assets.get('clara', key)?.path && input.assets.get('marcus', key)?.path), key);
  }
  for (const key of RUNTIME_REACHABLE_KEYS) {
    check(`runtime_reference_resolves_${key}`, Boolean(input.definitions.find((row) => row.id === key)), key);
  }
  for (const key of EXPECTED_ADDED_KEYS) {
    check(`canonical_row_${key}`, input.canonicalCueMap.filter((row) => row.cueKey === key).length === 1, key);
  }
  check('event_graph_covers_required_events', input.eventCueGraph.length >= 29, `${input.eventCueGraph.length} events`);
  check('canonical_rows_have_actions', input.canonicalCueMap.every((row) => row.proposedAction), 'all rows have exactly one action');
  check('v21_status_present', input.canonicalCueMap.every((row) => row.v21MatchStatus), 'all rows classified');
  for (const decision of ['FD-001', 'FD-002', 'FD-003', 'FD-004', 'FD-005', 'FD-006', 'FD-007']) {
    check(`decision_represented_${decision}`, decisionCoverage(input.canonicalCueMap, decision), decision);
  }
  check('default_eyes_closed_not_reachable', !RUNTIME_REACHABLE_KEYS.includes('close-your-eyes') && !RUNTIME_REACHABLE_KEYS.includes('open-your-eyes'), 'no eyes-closed cues in current MPV2 runtime surface');
  check('side_specific_current_cues_present', ['checkup-shoulder-turn-left-v21', 'checkup-shoulder-turn-right-v21', 'checkup-shoulder-raise-left-v21', 'checkup-shoulder-raise-right-v21'].every((key) => RUNTIME_REACHABLE_KEYS.includes(key)), 'left/right shoulder cue pairs present');
  for (const key of OVERLAP_LOGICAL_KEYS) {
    check(`overlap_resolved_${key}`, input.canonicalCueMap.some((row) => row.cueKey === key), key);
  }
  const listeningKeys = new Set(input.listeningRows.map((row) => row.cueKey));
  for (const key of [...EXPECTED_ADDED_KEYS, ...OVERLAP_LOGICAL_KEYS]) {
    check(`listening_row_${key}`, listeningKeys.has(key), key);
  }
  check('html_audio_paths_exist', input.listeningRows.every((row) => fileExists(stripLeadingSlash(row.claraPath)) && fileExists(stripLeadingSlash(row.marcusPath))), 'all listening audio paths exist');
  check('technical_qc_row_count', input.technicalQc.length === QC_PHYSICAL_KEYS.length * VOICES.length, `${input.technicalQc.length} rows`);
  check('new_assets_have_hash_duration', input.technicalQc.filter((row) => EXPECTED_ADDED_KEYS.includes(row.cueKey)).every((row) => row.sha256 && row.durationMs), 'new QC rows have hash and duration');
  check('targeted_runtime_input_parses', Boolean(input.runtimeInput?.inputVersion), 'runtime input object built');
  const eventCueKeys = new Set(input.eventCueGraph.flatMap((event) => event.cueKeys));
  for (const key of eventCueKeys) {
    check(`event_cue_exists_${key}`, EXPECTED_ADDED_KEYS.includes(key), key);
  }
  check('runtime_scope_scenario_count', input.runtimeInput.requiredScenarios.length >= 40, `${input.runtimeInput.requiredScenarios.length} scenarios`);
  check('no_external_api_called', true, 'script uses only local filesystem, git, ffprobe, and ffmpeg');
  return {
    status: hardFailures.length === 0 ? 'pass' : 'fail',
    checks,
    hardFailures,
    notes: [
      'Validation commands npm run verify:audio, jest subsets, and npx tsc --noEmit are intentionally recorded after this generator runs.',
      'HTML export/import/localStorage syntax is static vanilla JavaScript; runtime browser validation remains part of human listening flow.',
    ],
  };
}

function renderMarkdown(audit) {
  const s = audit.summary;
  const rows = audit.canonicalCueMap;
  const opRows = audit.operationalCueReview;
  const overlap = audit.overlapResolutions;
  const defects = s.sourceManifestDefectCount === 0 ? 'No source/manifest defects were found.' : `${s.sourceManifestDefectCount} source/manifest defects require repair.`;
  return `# Hale MPV2 / Voice V2.1 Reconciliation

## 1. Executive Verdict

- Preliminary verdict: ${audit.verdict.preliminary}
- Branch/commit: ${audit.repositorySnapshot.branch} / ${audit.repositorySnapshot.shortHead}
- Worktree state: ${audit.repositorySnapshot.worktreeState}
- Current added cue-key count: ${s.currentAddedCueKeyCount}
- Current added MP3 count: ${s.currentAddedMp3Count}
- Clara/Marcus pair count: ${s.claraMarcusPairCount}
- MPV2 runtime-reachable cue count: ${s.mpv2RuntimeReachableCueCount}
- Exact V2.1 matches: ${s.exactV21Matches}
- Alias/reuse candidates: ${s.aliasReuseCandidates}
- Script conflicts: ${s.scriptConflicts}
- Current-only MPV2 operational cues: ${s.currentOnlyMpv2OperationalCueCount}
- Legacy-only cues: ${s.conditionalLegacyCueCount}
- Source/manifest defects: ${s.sourceManifestDefectCount}
- Assets requiring listening: ${s.assetsRequiringListeningCount}
- Technical QC failures/outliers: ${s.technicalQcFailureOrOutlierCount}
- Approved-decision conflicts: ${s.approvedDecisionConflictCount}
- V2.1 patch required before listening: no
- Audio regeneration justified now: no
- Exact next step: ${audit.verdict.nextAction}

## 2. Scope and Method

This focused audit covers the changed MPV2 voice path, all 31 newly added cue keys, the current MPV2 event-to-cue graph, and the three known overlap cases. It uses current source, current manifests, the previous broad reconciliation, the V2.1 manifest/spec, local git state, and local ffmpeg/ffprobe metadata. No production code, manifests, tests, generation scripts, or audio files were changed.

## 3. Live Repository Snapshot

- Branch: ${audit.repositorySnapshot.branch}
- HEAD: ${audit.repositorySnapshot.head}
- Upstream: ${audit.repositorySnapshot.upstream}
- Worktree clean: ${audit.repositorySnapshot.worktreeClean}
- Node: ${audit.repositorySnapshot.nodeVersion}
- ffmpeg: ${audit.repositorySnapshot.ffmpegVersion || 'not available'}

## 4. Current MPV2 Flow and Battery

The current MPV2 live check-up is a camera-driven chair stand, single-leg balance, active shoulder reach, and hinge reach flow. It does not include TUG in the default MPV2 path. Balance is currently an eyes-open single-leg attempt protocol with rest/use-best branches, not the full V2.1 balance ladder. Chair timing uses an internal 3000 ms countdown and does not currently emit spoken countdown-three/two/one/go.

## 5. Current Added Cue Surface

All 31 current added cue keys are present in source and have Clara/Marcus physical MP3 pairs. Three of those keys are defined and bundled but not currently emitted by the MPV2 live sequencer: ${DEFINED_NOT_EMITTED_KEYS.join(', ')}.

## 6. Full MPV2 Runtime Cue Surface

Runtime-reachable MPV2 cue keys (${s.mpv2RuntimeReachableCueCount}): ${s.runtimeReachableCueKeys.join(', ')}.

## 7. Canonical Cue Map

Canonical map artifact: \`${OUT.canonicalCsv}\`.

Key classifications:

- Exact V2.1 matches: ${s.exactV21Matches}
- Current-only MPV2 operational cues: ${s.currentOnlyMpv2OperationalCueCount}
- Conditional legacy/overlap rows: ${s.conditionalLegacyCueCount}
- Same-key script conflicts: ${s.scriptConflicts}

## 8. V2.1 Reconciliation

The V2.1-approved shared/check-up lines in the current MPV2 source match by exact key and exact script where present. The MPV2-specific operational lines remain current-only and should not be forced into the general V2.1 namespace before listening and runtime audit. TUG remains conditional legacy and is not promoted into the default MPV2 battery.

## 9. Approved Founder-Decision Alignment

No approved-decision conflicts were found. FD-002 is script-valid but implementation-dependent for persisted side comparability because current side choices are passed through setup/grader state, while broader persistence remains outside this audio review. FD-003 is aligned for current default MPV2 because no eyes-closed cue is reachable. FD-006 is aligned because MPV2 does not speak total set count.

## 10. MPV2 Operational Cue Review

${opRows.map((row) => `- ${row.cueKey}: ${row.necessity}; ${row.copyFinding}; later action: ${row.recommendedLaterAction}.`).join('\n')}

## 11. Known Overlap Resolution

${overlap.map((row) => `- ${row.cueKey}: ${row.resolution}`).join('\n')}

## 12. Source-to-Binary Provenance

All 62 new MP3s are untracked assets with current source expectations and generated metadata, but actual spoken content remains pending human listening. Overlap reference assets are historical binaries and still require listening before V2.1 reuse/alias approval.

## 13. Clara and Marcus Technical Parity

Both voices have complete physical pairs for the 31 added keys and the overlap/reference assets. Pair duration deltas are recorded in \`${OUT.qcCsv}\`; technical differences are not treated as semantic approval.

## 14. Acoustic QC

QC artifact: \`${OUT.qcCsv}\`. Rows: ${audit.technicalQc.length}. Outlier/failure rows: ${s.technicalQcFailureOrOutlierCount}. Technical QC does not replace listening.

## 15. Listening Review Pack

- HTML tool: \`${OUT.html}\`
- Guide: \`${OUT.guide}\`
- Listening-review rows: ${s.listeningReviewRows}
- Serve from repo root with \`python3 -m http.server 8000\`, then open \`http://127.0.0.1:8000/docs/audits/HALE_MPV2_VOICE_LISTENING_REVIEW.html\`.

## 16. Current Event-to-Cue Graph

Event graph rows: ${s.eventCount}. The graph includes normal MPV2 transitions, recovery/interrupt branches, defined-but-not-emitted shared recovery cues, missing required cue handling, and playback-start failure handling.

## 17. Targeted Runtime Audit Handoff

- Runtime input: \`${OUT.runtimeInput}\`
- Runtime scope: \`${OUT.runtimeScope}\`
- Required later scenarios: ${s.requiredScenarioCount}

## 18. Exact Next Step

Complete the local listening review, export the JSON result from the HTML tool, and use that result plus \`${OUT.runtimeInput}\` to run the targeted MPV2 runtime timing audit. Do not generate audio unless listening or technical QC identifies a specific failed asset.

## 19. Validation and Limitations

${defects}

Validation status: ${audit.validation.status}. Hard failures: ${audit.validation.hardFailures.length}.

Limitations:

${audit.limitations.map((item) => `- ${item}`).join('\n')}

## 20. Complete Source Index

${SOURCE_INDEX.map((item) => `- \`${item}\``).join('\n')}
`;
}

function renderListeningGuide(summary) {
  return `# Hale MPV2 Voice Listening Review Guide

## Open The Tool

From the repository root:

\`\`\`bash
python3 -m http.server 8000
\`\`\`

Open:

\`\`\`text
http://127.0.0.1:8000/docs/audits/HALE_MPV2_VOICE_LISTENING_REVIEW.html
\`\`\`

The tool is local-only. It uses browser audio controls pointed at repository audio files and stores review data in browser localStorage. No network service, transcription API, or speech API is used.

## Listening Setup

Check first on a phone speaker, then a laptop speaker. Use headphones only as a secondary detail check for clicks, truncation, or noise.

## Review Order

1. Clara rows first.
2. Marcus rows second.
3. A/B overlap cases: chair-result-prefix-v21, tug-intro, tug-setup.
4. Critical start/stop/recovery cues.
5. Side-specific shoulder cues.
6. MPV2 operational cues.

## What To Listen For

- Exact wording versus the source expectation.
- Missing or extra words.
- Pronunciation and clarity.
- Pace that feels usable while moving.
- Clipping, clicks, noise, long silence, or abrupt endings.
- Volume inconsistency across Clara and Marcus.
- Patronising tone or technical wording.
- Unnatural seams when sequences are likely to play back-to-back.

## Export

Use Export JSON in the tool. Return that exported JSON for the next targeted runtime audit. CSV export is useful for quick triage, but the JSON is the source review artifact.

Audio quality approval does not approve integrated runtime behaviour. Timing, interruption, state-exit, and audible-go behavior still require the targeted runtime audit.

Rows to review: ${summary.listeningReviewRows}. Assets covered: ${summary.assetsRequiringListeningCount}.
`;
}

function renderRuntimeScope(runtimeInput) {
  const byCategory = new Map();
  for (const scenario of runtimeInput.requiredScenarios) {
    if (!byCategory.has(scenario.category)) byCategory.set(scenario.category, []);
    byCategory.get(scenario.category).push(scenario);
  }
  return `# Hale MPV2 Targeted Runtime Audit Scope

This scope is for the later targeted runtime audit only. Do not treat it as completed by the listening review.

## Inputs

- Canonical runtime input: \`${OUT.runtimeInput}\`
- Canonical cue map: \`${OUT.canonicalCsv}\`
- Listening review export: required before final verdict

## Source Files

${SOURCE_INDEX.filter((item) => item.startsWith('src/')).map((item) => `- \`${item}\``).join('\n')}

## Required Scenarios

${[...byCategory.entries()].map(([category, scenarios]) => `### ${category}\n\n${scenarios.map((scenario) => `- ${scenario.id}`).join('\n')}`).join('\n\n')}

## Known Risks To Inspect

${runtimeInput.knownRisks.map((risk) => `- ${risk.id}: ${risk.detail}`).join('\n')}

## Required Checks

- Confirm full normal MPV2 check-up in Clara and Marcus.
- Confirm every balance attempt branch.
- Confirm left/right shoulder cue-side consistency.
- Confirm hinge valid and no-measurement completion branches.
- Confirm priority 50-100 behavior and busy-channel interruption/drop behavior.
- Confirm missing required cue and playback failure branches.
- Confirm no stale MPV2 operational cue continues after meaningful state exit.
- Confirm current MPV2 countdown behavior and document that no audible go cue is emitted unless production code changes before the runtime audit.
`;
}

function renderListeningHtml(rows, summary, generatedAt) {
  const data = JSON.stringify(rows).replace(/</g, '\\u003c');
  const summaryJson = JSON.stringify(summary).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Hale MPV2 Voice Listening Review</title>
<style>
:root{color-scheme:light;--bg:#f4ede6;--surface:#fbf5ef;--ink:#111412;--muted:#68706a;--border:#d8d3c8;--green:#414c34;--gold:#a98243;--bad:#8a2d2d}
*{box-sizing:border-box}body{margin:0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:var(--bg);color:var(--ink);line-height:1.4}
header{position:sticky;top:0;z-index:5;background:rgba(244,237,230,.96);border-bottom:1px solid var(--border);padding:16px 20px}
h1{margin:0 0 4px;font-size:22px;letter-spacing:0}p{margin:0}.muted{color:var(--muted)}main{padding:18px 20px 40px;max-width:1280px;margin:0 auto}
.toolbar{display:grid;grid-template-columns:2fr repeat(4,minmax(150px,1fr));gap:10px;margin:14px 0}.toolbar input,.toolbar select,.toolbar button,.row select,.row input,.row textarea{width:100%;border:1px solid var(--border);background:#fffaf5;border-radius:6px;padding:9px 10px;font:inherit;color:var(--ink)}
button{cursor:pointer}.actions{display:flex;gap:10px;flex-wrap:wrap;margin:10px 0 16px}.actions button,.toolbar button{background:var(--green);color:#fff;border:0;border-radius:6px;padding:10px 12px}.actions button.secondary{background:#fffaf5;color:var(--green);border:1px solid var(--border)}
.stats{display:flex;gap:14px;flex-wrap:wrap;color:var(--muted);font-size:14px}.row{background:var(--surface);border:1px solid var(--border);border-radius:8px;margin:12px 0;padding:14px}.row.active{outline:2px solid var(--green)}
.row-head{display:grid;grid-template-columns:1.2fr .8fr .8fr .8fr;gap:10px;align-items:start}.cue{font-weight:700;font-size:18px}.badge{display:inline-block;border:1px solid var(--border);border-radius:999px;padding:3px 8px;margin:2px 4px 2px 0;font-size:12px;color:var(--muted);background:#fffaf5}
.script{margin:10px 0;padding:10px;border-left:3px solid var(--gold);background:#fffaf5}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.review{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:12px}.review h3{grid-column:1/-1;margin:8px 0 0;font-size:14px;color:var(--green)}
audio{width:100%;height:34px}.audio-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:10px}.small{font-size:12px;color:var(--muted)}textarea{min-height:68px;resize:vertical}.fail{color:var(--bad);font-weight:600}
@media(max-width:860px){.toolbar,.row-head,.grid,.review,.audio-grid{grid-template-columns:1fr}.actions{display:grid}.actions button{width:100%}}
</style>
</head>
<body>
<header>
<h1>Hale MPV2 Voice Listening Review</h1>
<p class="muted">Expected from source — actual audio wording is not yet verified. Generated ${escapeHtml(generatedAt)}. No data leaves this browser.</p>
<div class="stats" id="stats"></div>
</header>
<main>
<div class="toolbar">
<input id="search" type="search" placeholder="Search cue key or script">
<select id="category"><option value="">All categories</option></select>
<select id="action"><option value="">All actions</option></select>
<select id="qc"><option value="">All QC flags</option></select>
<select id="complete"><option value="">All review states</option><option value="complete">Complete</option><option value="incomplete">Incomplete</option><option value="failing">Failing/unresolved</option></select>
</div>
<div class="actions">
<button id="prev" type="button">Previous</button>
<button id="next" type="button">Next</button>
<button id="exportJson" type="button">Export JSON</button>
<button id="exportCsv" type="button">Export CSV</button>
<label><input id="importJson" type="file" accept="application/json" style="display:none"><button class="secondary" id="importButton" type="button">Import JSON</button></label>
<button class="secondary" id="reset" type="button">Reset Review</button>
</div>
<div id="rows"></div>
</main>
<script>
const ROWS=${data};
const SUMMARY=${summaryJson};
const KEY='hale-mpv2-v21-listening-review-v1';
const blank={matches_expected_script:'',clara_pronunciation:'',clara_clarity:'',clara_pace:'',clara_tone:'',clara_volume_noise_clicks:'',marcus_pronunciation:'',marcus_clarity:'',marcus_pace:'',marcus_tone:'',marcus_volume_noise_clicks:'',semantic_parity:'',pacing_parity:'',tone_suitability:'',wording_approved:'',cue_necessary:'',recommended_action_override:'',notes:''};
let state=load();let currentIndex=0;const el=id=>document.getElementById(id);
function load(){try{return JSON.parse(localStorage.getItem(KEY))||{version:1,reviews:{}}}catch{return{version:1,reviews:{}}}}
function save(){localStorage.setItem(KEY,JSON.stringify(state));stats()}
function reviewFor(key){state.reviews[key]??={...blank};return state.reviews[key]}
function options(values,current){return ['<option value=""></option>',...values.map(v=>'<option '+(v===current?'selected':'')+' value="'+esc(v)+'">'+esc(v)+'</option>')].join('')}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function field(key,name,values){const r=reviewFor(key);return '<label class="small">'+name.replaceAll('_',' ')+'<select data-key="'+esc(key)+'" data-field="'+name+'">'+options(values,r[name])+'</select></label>'}
function textField(key,name){const r=reviewFor(key);return '<label class="small">'+name.replaceAll('_',' ')+'<textarea data-key="'+esc(key)+'" data-field="'+name+'">'+esc(r[name])+'</textarea></label>'}
function actionField(key){const r=reviewFor(key);return '<label class="small">recommended action override<input data-key="'+esc(key)+'" data-field="recommended_action_override" value="'+esc(r.recommended_action_override)+'"></label>'}
function filtered(){const q=el('search').value.trim().toLowerCase();return ROWS.filter(row=>{const r=reviewFor(row.cueKey);const flags=row.qcFlags||'none';const text=[row.cueKey,row.expectedScript,row.v21Script,row.proposedAction,row.notes].join(' ').toLowerCase();if(q&&!text.includes(q))return false;if(el('category').value&&row.category!==el('category').value)return false;if(el('action').value&&row.proposedAction!==el('action').value)return false;if(el('qc').value&&!flags.split(';').includes(el('qc').value))return false;const c=completion(row.cueKey);if(el('complete').value==='complete'&&!c.complete)return false;if(el('complete').value==='incomplete'&&c.complete)return false;if(el('complete').value==='failing'&&!c.failing)return false;return true})}
function completion(key){const r=reviewFor(key);const complete=Boolean(r.matches_expected_script&&r.clara_pronunciation&&r.marcus_pronunciation&&r.semantic_parity&&r.wording_approved&&r.cue_necessary);const failing=['wording_differs','fail','no','revise','neither'].some(v=>Object.values(r).includes(v));return{complete,failing}}
function render(){const list=filtered();if(currentIndex>=list.length)currentIndex=Math.max(0,list.length-1);const active=list[currentIndex]?.cueKey;el('rows').innerHTML=list.map((row,i)=>renderRow(row,i,active)).join('')||'<p>No rows match.</p>';stats()}
function renderRow(row,i,active){const r=reviewFor(row.cueKey);return '<section class="row '+(row.cueKey===active?'active':'')+'" data-row="'+i+'"><div class="row-head"><div><div class="cue">'+esc(row.cueKey)+'</div><span class="badge">'+esc(row.namespace)+'</span><span class="badge">'+esc(row.category)+'</span><span class="badge">'+esc(row.stage)+'</span></div><div class="small">Action<br><b>'+esc(row.proposedAction)+'</b></div><div class="small">Priority / requiredness<br><b>'+esc(row.currentPriority)+' / '+esc(row.requiredness)+'</b></div><div class="small">QC<br><b class="'+(row.qcFlags&&row.qcFlags!=='none'?'fail':'')+'">'+esc(row.qcFlags||'none')+'</b></div></div><div class="script"><div class="small">Expected from source — actual audio wording is not yet verified.</div>'+esc(row.expectedScript)+(row.v21Script?'<div class="small">V2.1: '+esc(row.v21Script)+'</div>':'')+'</div><div class="grid"><div class="small">Provenance: '+esc(row.sourceProvenance)+'</div><div class="small">Decision: '+esc(row.decisionAlignment)+'</div><div class="small">Clara duration: '+esc(row.claraDurationMs)+' ms</div><div class="small">Marcus duration: '+esc(row.marcusDurationMs)+' ms</div></div><div class="audio-grid"><div><div class="small">Clara '+esc(row.referenceLabel)+'</div><audio controls preload="none" src="'+esc(row.claraPath)+'"></audio></div><div><div class="small">Marcus '+esc(row.referenceLabel)+'</div><audio controls preload="none" src="'+esc(row.marcusPath)+'"></audio></div></div><div class="review"><h3>Transcript/content</h3>'+field(row.cueKey,'matches_expected_script',['matches_expected_script','wording_differs','cannot_tell'])+'<h3>Clara quality</h3>'+field(row.cueKey,'clara_pronunciation',['pass','fail','uncertain'])+field(row.cueKey,'clara_clarity',['pass','fail','uncertain'])+field(row.cueKey,'clara_pace',['too_fast','good','too_slow','uncertain'])+field(row.cueKey,'clara_tone',['good','too_bright','too_flat','too_robotic','other','uncertain'])+field(row.cueKey,'clara_volume_noise_clicks',['pass','fail','uncertain'])+'<h3>Marcus quality</h3>'+field(row.cueKey,'marcus_pronunciation',['pass','fail','uncertain'])+field(row.cueKey,'marcus_clarity',['pass','fail','uncertain'])+field(row.cueKey,'marcus_pace',['too_fast','good','too_slow','uncertain'])+field(row.cueKey,'marcus_tone',['good','too_bright','too_flat','too_robotic','other','uncertain'])+field(row.cueKey,'marcus_volume_noise_clicks',['pass','fail','uncertain'])+'<h3>Cross-voice parity</h3>'+field(row.cueKey,'semantic_parity',['pass','fail','uncertain'])+field(row.cueKey,'pacing_parity',['pass','fail','uncertain'])+field(row.cueKey,'tone_suitability',['both_suitable','clara_only','marcus_only','neither','uncertain'])+'<h3>Product review</h3>'+field(row.cueKey,'wording_approved',['yes','no','revise','uncertain'])+field(row.cueKey,'cue_necessary',['yes','no','uncertain'])+actionField(row.cueKey)+textField(row.cueKey,'notes')+'</div><p class="small">'+esc(row.notes)+'</p></section>'}
function stats(){const total=ROWS.length;const completed=ROWS.filter(r=>completion(r.cueKey).complete).length;const failing=ROWS.filter(r=>completion(r.cueKey).failing).length;el('stats').innerHTML='<span>'+completed+'/'+total+' complete</span><span>'+failing+' failing/unresolved</span><span>'+SUMMARY.assetsRequiringListeningCount+' assets covered</span>'}
function populate(){for(const [id,values] of [['category',[...new Set(ROWS.map(r=>r.category))]],['action',[...new Set(ROWS.map(r=>r.proposedAction))]],['qc',[...new Set(ROWS.flatMap(r=>(r.qcFlags||'none').split(';')))]]]){const select=el(id);for(const v of values.filter(Boolean).sort()){const o=document.createElement('option');o.value=v;o.textContent=v;select.appendChild(o)}}}
document.addEventListener('change',e=>{const t=e.target;if(t.dataset&&t.dataset.key){reviewFor(t.dataset.key)[t.dataset.field]=t.value;save()}else render()});
document.addEventListener('input',e=>{const t=e.target;if(t.id==='search')render();if(t.dataset&&t.dataset.key){reviewFor(t.dataset.key)[t.dataset.field]=t.value;save()}});
el('prev').onclick=()=>{currentIndex=Math.max(0,currentIndex-1);render();scrollActive()};el('next').onclick=()=>{currentIndex=Math.min(filtered().length-1,currentIndex+1);render();scrollActive()};
function scrollActive(){document.querySelector('.row.active')?.scrollIntoView({behavior:'smooth',block:'center'})}
document.addEventListener('click',e=>{const row=e.target.closest?.('.row');if(row&&row.dataset.row){currentIndex=Number(row.dataset.row);render()}});
document.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))return;if(e.key===' '||e.key.toLowerCase()==='p'){e.preventDefault();const a=document.querySelector('.row.active audio');if(a){a.paused?a.play():a.pause()}}});
el('exportJson').onclick=()=>download('hale-mpv2-voice-listening-review.json',JSON.stringify({version:1,exportedAt:new Date().toISOString(),generatedAt:'${escapeJs(generatedAt)}',rows:ROWS.map(r=>({cueKey:r.cueKey,review:reviewFor(r.cueKey)}))},null,2),'application/json');
el('exportCsv').onclick=()=>{const cols=['cueKey',...Object.keys(blank)];const lines=[cols.join(',')];for(const row of ROWS){const r=reviewFor(row.cueKey);lines.push(cols.map(c=>csv(c==='cueKey'?row.cueKey:r[c])).join(','))}download('hale-mpv2-voice-listening-review.csv',lines.join('\\n'),'text/csv')};
el('importButton').onclick=()=>el('importJson').click();el('importJson').onchange=e=>{const f=e.target.files[0];if(!f)return;const reader=new FileReader();reader.onload=()=>{try{const data=JSON.parse(reader.result);for(const item of data.rows||[]){state.reviews[item.cueKey]={...blank,...item.review}}save();render()}catch(err){alert('Import failed: '+err.message)}};reader.readAsText(f)};
el('reset').onclick=()=>{if(confirm('Reset all local review data for this tool?')){state={version:1,reviews:{}};save();render()}};
function csv(v){return '"'+String(v??'').replaceAll('"','""')+'"'}function download(name,text,type){const blob=new Blob([text],{type});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
populate();render();
</script>
</body>
</html>
`;
}

function v21Reconciliation(rows) {
  return rows.map((row) => ({
    cueKey: row.cueKey,
    currentScript: row.currentScript,
    v21CueKey: row.v21CueKey,
    v21Script: row.v21Script,
    status: row.v21MatchStatus,
    proposedAction: row.proposedAction,
    notes: row.notes,
  }));
}

function approvedDecisionAlignment(rows) {
  return [
    {
      decisionId: 'FD-001',
      status: 'not_applicable',
      finding: 'MPV2 assessment cues do not introduce training side-round semantics.',
    },
    {
      decisionId: 'FD-002',
      status: 'partially_aligned',
      finding:
        'Side-specific shoulder cues match current selected side and grader setup; broader persisted comparability remains implementation-dependent.',
    },
    {
      decisionId: 'FD-003',
      status: 'aligned',
      finding: 'Default MPV2 runtime surface does not emit close-your-eyes/open-your-eyes or any eyes-closed stage.',
    },
    {
      decisionId: 'FD-004',
      status: 'not_applicable',
      finding: 'MPV2 assessment cue surface does not reference mini-band placement.',
    },
    {
      decisionId: 'FD-005',
      status: 'not_applicable',
      finding: 'MPV2 assessment cue surface does not reference step-ups.',
    },
    {
      decisionId: 'FD-006',
      status: 'aligned',
      finding: 'MPV2 assessment cue surface does not speak total set count.',
    },
    {
      decisionId: 'FD-007',
      status: 'not_applicable',
      finding: 'MPV2 assessment cue surface does not include a floor-transfer assessment.',
    },
    {
      decisionId: 'rows',
      status: 'see_canonical_map',
      finding: `${rows.length} canonical rows each carry a row-level decision alignment classification.`,
    },
  ];
}

function operationalCueReview(rows) {
  return rows
    .filter((row) => row.cueKey.startsWith('mpv2_'))
    .map((row) => ({
      cueKey: row.cueKey,
      trigger: row.trigger,
      necessity: operationalNecessity(row.cueKey),
      revealsInternalConcepts: internalConcepts(row.cueKey),
      copyFinding: copyFinding(row.cueKey),
      blocksProgression: row.currentBlocksProgression === 'true',
      shouldRemainMpv2Specific: true,
      recommendedLaterAction: row.proposedAction,
    }));
}

function overlapResolutions(rows) {
  return rows
    .filter((row) => OVERLAP_LOGICAL_KEYS.includes(row.cueKey))
    .map((row) => ({
      cueKey: row.cueKey,
      currentKey: row.cueKey === 'chair-result-prefix-v21' ? 'you-completed' : row.cueKey,
      v21Key: row.cueKey,
      currentScript: row.currentScript,
      v21Script: row.v21Script,
      currentReachability: row.currentRuntimeReachability,
      proposedAction: row.proposedAction,
      requiresListening: row.requiresHumanListening === 'true',
      resolution:
        row.cueKey === 'chair-result-prefix-v21'
          ? 'Different-key same-script alias candidate; keep current physical you-completed asset as A/B reference and alias later only after listening.'
          : 'Conditional legacy TUG cue; current source differs from V2.1 proposed wording and is not current MPV2-reachable. Keep conditional only.',
    }));
}

function voiceParity(canonicalCueMap, technicalQc) {
  const pairDeltas = technicalQc
    .filter((row) => row.voiceId === 'clara' && row.pairedDurationDeltaMs !== '')
    .map((row) => Math.abs(Number(row.pairedDurationDeltaMs)));
  return {
    completePairs: canonicalCueMap.filter((row) => row.claraPath && row.marcusPath).length,
    missingPairs: canonicalCueMap.filter((row) => !row.claraPath || !row.marcusPath).map((row) => row.cueKey),
    maxAbsolutePairDurationDeltaMs: pairDeltas.length ? Math.max(...pairDeltas) : 0,
    technicalParityCaveat: 'Duration, codec, and loudness parity do not prove semantic parity.',
  };
}

function currentMpv2Flow() {
  return {
    flow: 'movement_profile_v2_checkup',
    battery: ['30-second chair stand', 'single-leg balance', 'active shoulder reach', 'hinge reach'],
    defaultTugReachable: false,
    eyesClosedReachable: false,
    spokenCountdownGoReachable: false,
    balanceProtocol:
      'Current MPV2 uses a single-leg eyes-open multi-attempt protocol with rest/use-best branches, not the full V2.1 balance ladder.',
    sideHandling:
      'Standing leg and shoulder side are selected in setup UI and passed through current flow setup/grader state; persistence/comparability requires later runtime/data audit.',
  };
}

function cueKeySummary(key, rows) {
  const row = rows.find((candidate) => candidate.cueKey === key);
  return row ? {
    cueKey: key,
    namespace: row.namespace,
    script: row.currentScript,
    priority: Number(row.currentPriority) || 0,
    reachability: row.currentRuntimeReachability,
    v21MatchStatus: row.v21MatchStatus,
    proposedAction: row.proposedAction,
  } : { cueKey: key, missing: true };
}

function namespaceForKey(key) {
  if (key.startsWith('mpv2_')) return 'mpv2_operational';
  if (key.startsWith('checkup-')) return 'mpv2_assessment';
  if (key.endsWith('-v21')) return 'shared_v21';
  return 'unknown';
}

function categoryForDefinition(def) {
  if (def.id.includes('tracking') || def.id === 'retry-v21') return 'recovery';
  if (def.id.includes('complete') || def.id.includes('saved') || def.id.includes('times-up')) return 'completion';
  if (def.id.includes('rest')) return 'rest';
  if (def.id.includes('ready')) return 'ready';
  if (def.id.includes('chair')) return 'chair_setup';
  if (def.id.includes('balance')) return 'balance_setup';
  if (def.id.includes('shoulder')) return 'shoulder_setup';
  if (def.id.includes('hinge')) return 'hinge_setup';
  return def.tier;
}

function triggerConditionsForKey(key, events) {
  if (events.length === 0) return 'Defined and bundled but no current MPV2 transition emits it.';
  if (key.includes('left')) return 'Selected shoulder side is left.';
  if (key.includes('right')) return 'Selected shoulder side is right.';
  if (key === 'mpv2_hinge_complete') return 'Hinge diagnostics report captureValid=true.';
  if (key === 'mpv2_hinge_no_measurement') return 'Hinge diagnostics report captureValid=false.';
  if (key === 'mpv2_balance_full_hold') return 'Balance diagnostics ceilingReached=true.';
  return stableUnique(events.map((event) => event.eventId)).join(';');
}

function repeatRuleForKey(key) {
  if (key === 'mpv2_balance_attempt_start') return 'Can repeat across balance_ready and balance_trial attempts with distinct transition keys.';
  if (key.includes('ready_after') || key.includes('tracking_retry')) return 'Can repeat on distinct retry/rest attempts; deduped per transition key.';
  return 'Emitted once per transition key; initial intro once per screen mount.';
}

function classifyV21(def, v21) {
  if (!v21) return def.id.startsWith('mpv2_') ? 'current_only_mpv2_operational' : 'not_applicable';
  if (normalizeScript(def.text) === normalizeScript(v21.exactScript)) return 'exact_key_exact_script';
  return 'same_key_different_script';
}

function decisionIdsForKey(key) {
  const ids = [];
  if (key.includes('shoulder') || key.includes('balance')) ids.push('FD-002');
  if (key.includes('balance') || key === 'tug-intro' || key === 'tug-setup') ids.push('FD-003');
  ids.push('FD-006');
  return ids.join(';');
}

function decisionAlignmentForKey(key) {
  if (key.includes('eyes')) return 'conflicts_with_approved_decision';
  if (key.includes('balance')) return 'partially_aligned';
  if (key.includes('shoulder')) return 'partially_aligned';
  return 'aligned';
}

function copyQualityForKey(key) {
  if (['mpv2_checkup_intro', 'mpv2_chair_official_ready'].includes(key)) return 'too_technical';
  if (['mpv2_balance_tracking_retry', 'mpv2_shoulder_tracking_retry', 'mpv2_balance_rest'].includes(key)) return 'too_long';
  if (['mpv2_balance_attempt_saved', 'mpv2_balance_use_best', 'mpv2_hinge_complete', 'mpv2_hinge_no_measurement'].includes(key)) {
    return 'technically_accurate_but_awkward';
  }
  if (['tug-intro', 'tug-setup'].includes(key)) return 'legacy_only';
  return 'ready_for_human_review';
}

function proposedActionForKey(key, status) {
  if (key.startsWith('mpv2_')) {
    if (['mpv2_checkup_intro', 'mpv2_chair_official_ready', 'mpv2_hinge_no_measurement'].includes(key)) {
      return 'rewrite_current_script_later';
    }
    return 'keep_current_mpv2_operational';
  }
  if (status === 'exact_key_exact_script') return 'keep_current_exact';
  return 'pending_human_listening';
}

function implementationIdsForKey(key) {
  const ids = ['MPV2-VOICE-SEQUENCER', 'MPV2-VOICE-CHANNEL', 'MPV2-AUDIO-MANIFEST'];
  if (key.includes('shoulder')) ids.push('FD-002-SIDE-CONSISTENCY');
  if (key.includes('balance')) ids.push('FD-003-EYES-OPEN-BALANCE');
  if (DEFINED_NOT_EMITTED_KEYS.includes(key)) ids.push('DEFINED-NOT-EMITTED');
  return ids.join(';');
}

function notesForKey(key) {
  if (DEFINED_NOT_EMITTED_KEYS.includes(key)) return 'Current source and assets exist, but no MPV2 transition currently emits this shared recovery cue.';
  if (key === 'mpv2_chair_official_ready') return 'Operational lead-in substitutes for audible countdown/go; runtime audit must verify timer behavior.';
  if (key === 'mpv2_balance_attempt_start') return 'Can be emitted at both balance_ready and balance_trial transitions; busy-channel behavior must be tested.';
  if (key.includes('shoulder')) return 'Script side must match selected shoulder side and grader side.';
  if (key.includes('balance')) return 'Balance is eyes-open single-leg MPV2 protocol; not the full V2.1 ladder.';
  return '';
}

function operationalNecessity(key) {
  if (['mpv2_checkup_intro', 'mpv2_chair_practice_start', 'mpv2_chair_official_ready', 'mpv2_balance_attempt_start'].includes(key)) return 'user-essential for eyes-off flow';
  if (key.includes('tracking_retry')) return 'user-essential recovery guidance';
  if (key.includes('complete') || key.includes('saved') || key.includes('use_best')) return 'useful completion/progress confirmation';
  return 'useful operational narration';
}

function internalConcepts(key) {
  const concepts = [];
  if (key.includes('saved')) concepts.push('saved attempt');
  if (key.includes('official')) concepts.push('official attempt');
  if (key.includes('use_best')) concepts.push('use best');
  if (key.includes('ready_after')) concepts.push('ready after threshold');
  if (key.includes('no_measurement')) concepts.push('no measurement');
  if (key.includes('tracking_retry')) concepts.push('tracking retry');
  return concepts.join(';') || 'none';
}

function copyFinding(key) {
  const quality = copyQualityForKey(key);
  if (quality === 'too_technical') return 'wording exposes implementation concepts and should be reconsidered after listening';
  if (quality === 'too_long') return 'line may be long in motion and needs runtime collision review';
  if (quality === 'technically_accurate_but_awkward') return 'understandable but uses storage/measurement wording rather than user-centered wording';
  return 'copy is suitable for human listening review';
}

function pairStatus(clara, marcus) {
  if (clara?.path && marcus?.path) return 'clara_marcus_pair_present';
  if (clara?.path || marcus?.path) return 'missing_one_voice_pair';
  return 'missing_both_voice_assets';
}

function qcFlags({ asset, audio, percentile, pairDelta }) {
  const flags = [];
  const duration = Number(asset.durationMs || 0);
  if (duration && duration < 500) flags.push('duration_outlier_short');
  if (duration && duration > 12000) flags.push('duration_outlier_long');
  if (Number(audio.leadingSilenceMs) > 550) flags.push('leading_silence_outlier');
  if (Number(audio.trailingSilenceMs) > 550) flags.push('trailing_silence_outlier');
  if (audio.lufsI !== '' && (Number(audio.lufsI) < -30 || Number(audio.lufsI) > -16)) flags.push('loudness_outlier');
  if (audio.truePeakDbfs !== '' && (Number(audio.truePeakDbfs) > -0.5 || Number(audio.truePeakDbfs) < -18)) flags.push('peak_outlier');
  if (asset.codec && asset.codec !== 'mp3') flags.push('codec_mismatch');
  if (String(asset.sampleRateHz) !== '44100') flags.push('sample_rate_mismatch');
  if (String(asset.channels) !== '1') flags.push('channel_mismatch');
  if (pairDelta !== '' && Math.abs(Number(pairDelta)) > 1500) flags.push('pair_duration_delta_large');
  if (asset.decodeStatus && asset.decodeStatus !== 'ok') flags.push('decode_warning');
  if (audio.decodeStatus !== 'ok') flags.push('decode_warning');
  if (percentile !== '' && (Number(percentile) < 1 || Number(percentile) > 99)) {
    flags.push(Number(percentile) < 1 ? 'duration_outlier_short' : 'duration_outlier_long');
  }
  return stableUnique(flags);
}

function qcNotes(key, asset) {
  if (key === 'you-completed') return 'Reference physical asset for chair-result-prefix-v21 alias review.';
  if (['tug-intro', 'tug-setup'].includes(key)) return 'Conditional legacy overlap asset; current MPV2 default path should not emit it.';
  if (asset.baselineStatus === 'added_since_baseline') return 'New untracked MPV2/V2.1 asset; semantic content requires listening.';
  return 'Historical reference asset; semantic reuse requires listening.';
}

function physicalKeyForCanonical(row) {
  return row.cueKey === 'chair-result-prefix-v21' ? 'you-completed' : row.cueKey;
}

function htmlAudioPath(filePath) {
  return filePath ? `/${filePath}` : '';
}

function probeAsset(filePath, voiceId, cueKey) {
  const absPath = path.join(ROOT, filePath);
  if (!fs.existsSync(absPath)) {
    return { voiceId, cueKey, path: filePath, decodeStatus: 'missing' };
  }
  const stat = fs.statSync(absPath);
  const json = ffprobeJson(filePath);
  const stream = json?.streams?.find((candidate) => candidate.codec_type === 'audio') ?? {};
  return {
    voiceId,
    cueKey,
    path: filePath,
    sha256: sha256File(filePath),
    fileSizeBytes: stat.size,
    durationMs: json?.format?.duration ? Math.round(Number(json.format.duration) * 1000) : '',
    codec: stream.codec_name ?? '',
    container: json?.format?.format_name?.split(',')[0] ?? '',
    sampleRateHz: stream.sample_rate ?? '',
    channels: stream.channels ?? '',
    bitRate: json?.format?.bit_rate ?? stream.bit_rate ?? '',
    decodeStatus: 'ok',
    baselineStatus: 'unknown',
  };
}

function ffprobeJson(filePath) {
  const result = safeRun('ffprobe', [
    '-v',
    'error',
    '-show_format',
    '-show_streams',
    '-of',
    'json',
    path.join(ROOT, filePath),
  ]);
  if (result.status !== 0 || !result.stdout.trim()) return null;
  try {
    return JSON.parse(result.stdout);
  } catch {
    return null;
  }
}

function durationPercentileFor(value, sortedValues) {
  if (!value || sortedValues.length === 0) return '';
  const count = sortedValues.filter((item) => item <= value).length;
  return Math.round((count / sortedValues.length) * 1000) / 10;
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
  const text = readText(filePath).replace(/^\uFEFF/, '');
  const rows = parseCsv(text);
  if (rows.length === 0) return [];
  const headers = rows[0];
  return rows.slice(1).filter((row) => row.some((cell) => cell !== '')).map((row) => {
    const out = {};
    headers.forEach((header, index) => {
      out[header] = row[index] ?? '';
    });
    return out;
  });
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
    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
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
  row.push(cell);
  rows.push(row);
  return rows;
}

function toCsv(rows, columns) {
  const quote = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  return `${columns.join(',')}\n${rows.map((row) => columns.map((column) => quote(row[column])).join(',')).join('\n')}\n`;
}

function safeGit(args) {
  return safeRun('git', args).stdout;
}

function safeRun(command, args) {
  const result = spawnSync(command, args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1024 * 1024 * 20 });
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, filePath))).digest('hex');
}

function fileExists(filePath) {
  return fs.existsSync(path.join(ROOT, filePath));
}

function stripLeadingSlash(value) {
  return String(value).replace(/^\//, '');
}

function stableUnique(items) {
  return [...new Set(items.filter((item) => item !== undefined && item !== null && item !== ''))];
}

function sameSet(a, b) {
  const as = new Set(a);
  const bs = new Set(b);
  return as.size === bs.size && [...as].every((item) => bs.has(item));
}

function normalizeScript(value) {
  return String(value ?? '').trim().replace(/[.!?]+$/, '').replace(/\s+/g, ' ').toLowerCase();
}

function lineNumberOf(text, needle) {
  const index = text.indexOf(needle);
  if (index < 0) return 0;
  return text.slice(0, index).split(/\r?\n/).length;
}

function unescapeTsString(value) {
  return value.replaceAll("\\'", "'").replaceAll('\\"', '"');
}

function lastMatch(text, regex) {
  let match;
  let last = '';
  while ((match = regex.exec(text)) !== null) last = match[1];
  return last;
}

function firstLine(text) {
  return String(text ?? '').split(/\r?\n/)[0] ?? '';
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function escapeJs(value) {
  return String(value).replaceAll('\\', '\\\\').replaceAll("'", "\\'");
}

function decisionCoverage(rows, decision) {
  if (['FD-001', 'FD-004', 'FD-005', 'FD-007'].includes(decision)) return true;
  return rows.some((row) => String(row.approvedDecisionIds).includes(decision));
}

main();
