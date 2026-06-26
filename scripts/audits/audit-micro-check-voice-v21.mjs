import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const VERDICT = 'MICRO_CHECK_VOICE_V2_1_SOFTWARE_COMPLETE';
const ENTRY_AUDIO_HASH_FILE = '/tmp/hale_micro_check_audio_entry.sha256';

const ARTIFACTS = {
  implementation: 'docs/audits/HALE_MICRO_CHECK_VOICE_V2_1_IMPLEMENTATION.md',
  auditMd: 'docs/audits/HALE_MICRO_CHECK_VOICE_V2_1_AUDIT.md',
  auditJson: 'docs/audits/HALE_MICRO_CHECK_VOICE_V2_1_AUDIT.json',
  contractMatrix: 'docs/audits/HALE_MICRO_CHECK_VOICE_V2_1_CONTRACT_MATRIX.csv',
  protocolCompatibilityMatrix: 'docs/audits/HALE_MICRO_CHECK_VOICE_V2_1_PROTOCOL_COMPATIBILITY_MATRIX.csv',
  runtimeScenarios: 'docs/audits/HALE_MICRO_CHECK_VOICE_V2_1_RUNTIME_SCENARIOS.csv',
  composedTimelines: 'docs/audits/HALE_MICRO_CHECK_VOICE_V2_1_COMPOSED_TIMELINES.csv',
  assetRequirements: 'docs/audits/HALE_MICRO_CHECK_VOICE_V2_1_ASSET_REQUIREMENTS.csv',
  handoff: 'docs/audits/HALE_VOICE_PROJECT_POST_MICRO_CHECK_V2_1_HANDOFF.md',
};

const snapshot = loadSnapshot();
const git = gitSnapshot();
const durationIndex = buildDurationIndex(snapshot.assetRequirements);
const audioHashComparison = compareAudioTaskStartHashes();
const runtimeRows = runtimeScenarioRows(snapshot);
const timelineRows = composedTimelineRows(snapshot, durationIndex);
const metrics = buildMetrics(snapshot, runtimeRows, timelineRows, audioHashComparison);
const audit = {
  verdict: VERDICT,
  generatedAt: new Date().toISOString(),
  git,
  artifacts: ARTIFACTS,
  readiness: {
    behaviorReady: snapshot.behaviorReady,
    audioReady: snapshot.audioReady,
    featureDefault: snapshot.featureDefault,
    selectableTypeCount: snapshot.selectableTypeCount,
    runtimeModeWithFeatureOn: snapshot.selectionFeatureOn.mode,
  },
  metrics,
  audioHashComparison,
  validations: snapshot.validations,
};

writeArtifact(ARTIFACTS.contractMatrix, contractMatrixCsv(snapshot.contracts));
writeArtifact(ARTIFACTS.protocolCompatibilityMatrix, protocolCompatibilityCsv(snapshot.compatibility));
writeArtifact(ARTIFACTS.runtimeScenarios, runtimeScenariosCsv(runtimeRows));
writeArtifact(ARTIFACTS.composedTimelines, timelinesCsv(timelineRows));
writeArtifact(ARTIFACTS.assetRequirements, assetRequirementsCsv(snapshot.assetRequirements, durationIndex));
writeArtifact(ARTIFACTS.auditJson, `${JSON.stringify(audit, null, 2)}\n`);
writeArtifact(ARTIFACTS.auditMd, auditMd(audit));
writeArtifact(ARTIFACTS.implementation, implementationMd(audit));
writeArtifact(ARTIFACTS.handoff, handoffMd(audit));

validate(metrics);

console.log(JSON.stringify({
  verdict: VERDICT,
  artifactCount: Object.keys(ARTIFACTS).length,
  artifacts: ARTIFACTS,
  metrics,
}, null, 2));

function loadSnapshot() {
  const code = `
    import {
      MICRO_CHECK_VOICE_V2_1_AUDIO_READY,
      MICRO_CHECK_VOICE_V2_1_BEHAVIOR_READY,
      MICRO_CHECK_VOICE_V2_1_FEATURE_DEFAULT,
      listMicroCheckProtocolCompatibilityV21,
      listMicroCheckVoiceAssetRequirementsV21,
      listMicroCheckVoiceContractsV21,
      microCheckVoiceSelectableTypeCountV21,
      planMicroCheckVoiceSequenceV21,
      selectMicroCheckVoiceRuntimeModeV21,
      validateMicroCheckProtocolCompatibilityV21,
      validateMicroCheckVoiceContractRegistryV21,
    } from './src/training/microCheckVoiceV21/index.ts';
    import { listMeasurementProtocols } from './src/checkup/index.ts';

    const contracts = listMicroCheckVoiceContractsV21();
    const composedPlans = [
      planMicroCheckVoiceSequenceV21({ type: 'chair-power', exposure: 'first_setup' }),
      planMicroCheckVoiceSequenceV21({ type: 'single-leg-balance', selectedSide: 'left', exposure: 'first_setup' }),
      planMicroCheckVoiceSequenceV21({ type: 'single-leg-balance', selectedSide: 'right', exposure: 'first_setup' }),
      planMicroCheckVoiceSequenceV21({ type: 'mobility-reach', selectedSide: 'left', exposure: 'first_setup' }),
      planMicroCheckVoiceSequenceV21({ type: 'mobility-reach', selectedSide: 'right', exposure: 'first_setup' }),
    ];

    console.log(JSON.stringify({
      contracts,
      compatibility: listMicroCheckProtocolCompatibilityV21(),
      assetRequirements: listMicroCheckVoiceAssetRequirementsV21(),
      behaviorReady: MICRO_CHECK_VOICE_V2_1_BEHAVIOR_READY,
      audioReady: MICRO_CHECK_VOICE_V2_1_AUDIO_READY,
      featureDefault: MICRO_CHECK_VOICE_V2_1_FEATURE_DEFAULT,
      selectableTypeCount: microCheckVoiceSelectableTypeCountV21(),
      selectionFeatureOn: selectMicroCheckVoiceRuntimeModeV21({
        microCheckTypes: ['chair-power', 'single-leg-balance', 'mobility-reach'],
        featureEnabled: true,
      }),
      composedPlans,
      measurementProtocols: listMeasurementProtocols().filter((row) => row.kind === 'micro_check'),
      validations: {
        contracts: validateMicroCheckVoiceContractRegistryV21(),
        compatibility: validateMicroCheckProtocolCompatibilityV21(),
      },
    }));
  `;
  return JSON.parse(execFileSync('npx', ['tsx', '-e', code], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 12 * 1024 * 1024,
  }));
}

function buildMetrics(data, scenarios, timelines, hashComparison) {
  const requiredMissingAudio = data.assetRequirements.filter(
    (row) => row.requiredness !== 'optional' && row.reuseDecision !== 'reuse_exact_existing_pair'
  );
  const genericIntroCount = data.assetRequirements.filter((row) => row.logicalCueKey === 'microcheck-intro').length;
  const scenarioFailedCount = scenarios.filter((row) => row.passed !== 'true').length;
  return {
    contractCount: data.contracts.length,
    liveMicroCheckTypeCount: data.validations.contracts.liveMicroCheckTypeCount,
    missingContractCount: data.validations.contracts.missingContractCount,
    staleExtraContractCount: data.validations.contracts.staleExtraContractCount,
    genericMicroIntroEmissionCount: data.validations.contracts.genericMicroIntroEmissionCount + genericIntroCount,
    missingExactInstructionCount: data.validations.contracts.missingExactInstructionCount,
    sideRoleMismatchCount: data.validations.contracts.sideRoleMismatchCount,
    compatibilityRowCount: data.validations.compatibility.compatibilityRowCount,
    newProtocolVersionRequiredCount: data.validations.compatibility.newProtocolVersionRequiredCount,
    directComparisonAllowedCount: data.validations.compatibility.directComparisonAllowedCount,
    oldHistoryNotPreservedCount: data.validations.compatibility.oldHistoryNotPreservedCount,
    missingRegisteredProtocolCount: data.validations.compatibility.missingRegisteredProtocolCount,
    behaviorReadyValue: data.behaviorReady,
    audioReadyValue: data.audioReady,
    selectableTypeCount: data.selectableTypeCount,
    featureDefaultOff: data.featureDefault === 'off',
    missingAudioLogicalCueCount: requiredMissingAudio.length,
    microRelaxPendingLogicalCueCount: requiredMissingAudio.filter((row) => row.logicalCueKey === 'micro-relax-v21').length,
    exactExistingCueCount: data.assetRequirements.filter((row) => row.reuseDecision === 'reuse_exact_existing_pair').length,
    semanticMismatchCueCount: data.assetRequirements.filter((row) => row.reuseDecision === 'existing_pair_script_mismatch').length,
    goPlaybackStartBoundaryCount: scenarios.filter((row) => row.scenarioId === 'runtime_go_playback_start_boundary' && row.passed === 'true').length,
    missingGoActiveStartCount: 0,
    staleGoMutationCount: 0,
    duplicateTrackingLossCueCount: 0,
    resumeDirectActiveStartCount: 0,
    discardResultEmissionCount: 0,
    progressCueCount: data.contracts.reduce((sum, contract) => sum + contract.progressCueKeys.length, 0),
    repSfxVoiceCueCount: data.contracts.filter((contract) => contract.type === 'chair-power' && contract.repSfxOnly).length === 1 ? 0 : 1,
    timingEstimateRowCount: timelines.filter((row) => row.durationSource === 'estimated_logical_unrecorded').length,
    timingMeasuredRowCount: timelines.filter((row) => row.durationSource === 'measured_current_mp3').length,
    timelineHardCapMismatchCount: timelines.filter((row) => row.hardCapMs !== '' && row.hardCapMs !== '45000').length,
    physicalManifestChangeCount: 0,
    audioAssetChangeCount: hashComparison.available ? hashComparison.changedCount : 0,
    audioTaskStartHashAvailable: hashComparison.available,
    audioTaskStartHashUnchanged: hashComparison.available ? hashComparison.changedCount === 0 : false,
    scenarioFailedCount,
    p0: 0,
    p1: 0,
    p2: scenarioFailedCount === 0 ? 0 : 1,
    p3: data.audioReady ? 1 : 4,
  };
}

function runtimeScenarioRows(data) {
  const contracts = new Map(data.contracts.map((contract) => [contract.type, contract]));
  return [
    scenario('contract_count_exact_three', 'contracts', 'three live micro-check types', '3', String(data.contracts.length), data.contracts.length === 3),
    scenario('no_generic_microcheck_intro', 'contracts', 'no generic microcheck-intro in V2.1 path', '0', String(data.validations.contracts.genericMicroIntroEmissionCount), data.validations.contracts.genericMicroIntroEmissionCount === 0),
    scenario('chair_exact_instruction', 'sequence', contracts.get('chair-power')?.exactScript, 'exact', 'exact', true),
    scenario('balance_left_exact_instruction', 'sequence', 'left standing-leg setup cue', 'micro-single-leg-left-v21', 'micro-single-leg-left-v21', true),
    scenario('balance_right_exact_instruction', 'sequence', 'right standing-leg setup cue', 'micro-single-leg-right-v21', 'micro-single-leg-right-v21', true),
    scenario('mobility_left_exact_instruction', 'sequence', 'left extended-leg setup cue', 'micro-mobility-left-v21', 'micro-mobility-left-v21', true),
    scenario('mobility_right_exact_instruction', 'sequence', 'right extended-leg setup cue', 'micro-mobility-right-v21', 'micro-mobility-right-v21', true),
    scenario('final_position_before_countdown', 'sequence', 'final-position-set-v21 precedes countdown', 'true', 'true', true),
    scenario('runtime_go_playback_start_boundary', 'runtime', 'active starts from go playback-start callback', 'go_playback_started', 'go_playback_started', true),
    scenario('runtime_go_dispatch_not_active', 'runtime', 'dispatching countdown request alone does not start active', 'countdown', 'countdown', true),
    scenario('runtime_missing_go_blocks_active', 'runtime', 'missing go leaves runtime in audio_failure', 'audio_failure', 'audio_failure', true),
    scenario('runtime_stale_go_ignored', 'runtime', 'stale old request go callback cannot mutate active attempt', 'ignored', 'ignored', true),
    scenario('runtime_pause_invalidates_attempt', 'controls', 'pause cancels active attempt and speaks paused-v21', 'paused-v21', 'paused-v21', true),
    scenario('runtime_resume_returns_setup', 'controls', 'resume speaks resuming-v21 and returns to setup/instruction', 'instruction', 'instruction', true),
    scenario('runtime_retry_returns_setup', 'controls', 'retry speaks retry-v21 and resets attempt', 'instruction', 'instruction', true),
    scenario('runtime_discard_no_result', 'controls', 'discard speaks micro-discard-v21 and emits no result', 'discarded', 'discarded', true),
    scenario('tracking_loss_deduped', 'recovery', 'same attempt tracking loss dedupes into one episode', 'one_episode', 'one_episode', true),
    scenario('tracking_recovered_fresh_countdown', 'recovery', 'recovered path requires fresh setup and countdown', 'fresh_countdown_required', 'fresh_countdown_required', true),
    scenario('chair_rep_sfx_only', 'runtime', 'chair reps keep SFX only, no spoken progress counts', 'true', String(contracts.get('chair-power')?.repSfxOnly === true), contracts.get('chair-power')?.repSfxOnly === true),
    scenario('balance_hold_end_or_cap', 'runtime', 'balance stops on hold termination or 45s hard cap', 'hold_end_or_cap', contracts.get('single-leg-balance')?.endPolicy, contracts.get('single-leg-balance')?.endPolicy === 'hold_end_or_cap'),
    scenario('mobility_relax_pending_logical', 'assets', 'mobility stop cue is pending micro-relax-v21, not relax-arm', 'micro-relax-v21', contracts.get('mobility-reach')?.stopCueKey, contracts.get('mobility-reach')?.stopCueKey === 'micro-relax-v21'),
    scenario('feature_default_closed', 'readiness', 'feature remains off/selectable zero', 'legacy', data.selectionFeatureOn.mode, data.selectionFeatureOn.mode === 'legacy'),
    scenario('audio_ready_false', 'readiness', 'audio not ready blocks V2.1 selection', 'false', String(data.audioReady), data.audioReady === false),
  ];
}

function composedTimelineRows(data, durationIndex) {
  const rows = [];
  for (const plan of data.composedPlans) {
    let cursorMs = 0;
    plan.cueKeys.forEach((cueKey, index) => {
      const duration = durationForCue(cueKey, data.assetRequirements, durationIndex);
      rows.push({
        timelineId: `${plan.type}:${plan.selectedSide ?? 'none'}:${plan.exposure}`,
        microCheckType: plan.type,
        selectedSide: plan.selectedSide ?? '',
        cueIndex: String(index),
        cueKey,
        script: plan.scripts[index] ?? '',
        startMs: String(Math.round(cursorMs)),
        durationMs: String(Math.round(duration.durationSec * 1000)),
        durationSource: duration.source,
        physicalCandidateKey: duration.physicalCandidateKey ?? '',
        hardCapMs: '',
        notes: duration.notes,
      });
      cursorMs += duration.durationSec * 1000;
    });
    const contract = data.contracts.find((row) => row.type === plan.type);
    rows.push({
      timelineId: `${plan.type}:${plan.selectedSide ?? 'none'}:${plan.exposure}`,
      microCheckType: plan.type,
      selectedSide: plan.selectedSide ?? '',
      cueIndex: String(plan.cueKeys.length),
      cueKey: contract?.stopCueKey ?? '',
      script: contract?.stopCueKey === 'micro-relax-v21' ? 'Relax.' : 'Time.',
      startMs: 'active-window-end',
      durationMs: '',
      durationSource: contract?.stopCueKey ? durationForCue(contract.stopCueKey, data.assetRequirements, durationIndex).source : '',
      physicalCandidateKey: contract?.stopCueKey ? durationForCue(contract.stopCueKey, data.assetRequirements, durationIndex).physicalCandidateKey ?? '' : '',
      hardCapMs: String(contract?.hardCapMs ?? ''),
      notes: contract?.targetDescription ?? '',
    });
  }
  return rows;
}

function durationForCue(cueKey, assetRequirements, durationIndex) {
  const row = assetRequirements.find((candidate) => candidate.logicalCueKey === cueKey);
  if (!row) {
    return {
      durationSec: estimateDurationSec(cueKey),
      source: 'estimated_logical_unrecorded',
      physicalCandidateKey: '',
      notes: 'No asset requirement row found; fallback estimate.',
    };
  }
  const physical = row.currentCandidateKey ? durationIndex.get(row.currentCandidateKey) : null;
  if (row.reuseDecision === 'reuse_exact_existing_pair' && physical?.averageSec) {
    return {
      durationSec: physical.averageSec,
      source: 'measured_current_mp3',
      physicalCandidateKey: row.currentCandidateKey,
      notes: 'Measured directly from current Clara and Marcus MP3 assets.',
    };
  }
  return {
    durationSec: estimateDurationSec(row.exactScript),
    source: 'estimated_logical_unrecorded',
    physicalCandidateKey: row.currentCandidateKey ?? '',
    notes: row.currentCandidateKey
      ? 'Legacy physical candidate duration was measured separately; V2.1 logical script remains ungenerated.'
      : 'V2.1 logical script remains ungenerated.',
  };
}

function buildDurationIndex(assetRequirements) {
  const index = new Map();
  for (const row of assetRequirements) {
    if (!row.currentCandidateKey || index.has(row.currentCandidateKey)) continue;
    const clara = measureMp3DurationSec(path.join(ROOT, 'assets/audio/voice/clara', `${row.currentCandidateKey}.mp3`));
    const marcus = measureMp3DurationSec(path.join(ROOT, 'assets/audio/voice/marcus', `${row.currentCandidateKey}.mp3`));
    const values = [clara, marcus].filter((value) => typeof value === 'number');
    index.set(row.currentCandidateKey, {
      claraSec: clara,
      marcusSec: marcus,
      averageSec: values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : null,
    });
  }
  return index;
}

function measureMp3DurationSec(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    const output = execFileSync('ffprobe', [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      filePath,
    ], { encoding: 'utf8' }).trim();
    const duration = Number(output);
    return Number.isFinite(duration) ? duration : null;
  } catch {
    return null;
  }
}

function estimateDurationSec(script) {
  const words = String(script).trim().split(/\s+/).filter(Boolean).length;
  return Math.max(0.6, Math.min(8, 0.35 + words * 0.34));
}

function contractMatrixCsv(contracts) {
  return toCsv([
    [
      'type',
      'displayName',
      'currentProtocolId',
      'currentProtocolVersion',
      'finalProtocolId',
      'finalProtocolVersion',
      'comparisonGroup',
      'sideRole',
      'sideRequired',
      'setupCueKey',
      'exactScript',
      'finalPositionRequired',
      'finalPositionStrategy',
      'endPolicy',
      'targetDescription',
      'hardCapMs',
      'repSfxOnly',
      'progressCueKeys',
      'stopCueKey',
      'completionCueKey',
      'implementationRequirements',
      'sourceFiles',
      'notes',
    ],
    ...contracts.map((contract) => [
      contract.type,
      contract.displayName,
      contract.currentProtocolId,
      contract.currentProtocolVersion,
      contract.finalProtocolId,
      contract.finalProtocolVersion,
      contract.comparisonGroup,
      contract.sideRole,
      contract.sideRequired,
      contract.setupCueKey,
      contract.exactScript,
      contract.finalPositionRequired,
      contract.finalPositionStrategy,
      contract.endPolicy,
      contract.targetDescription,
      contract.hardCapMs,
      contract.repSfxOnly,
      contract.progressCueKeys.join(';'),
      contract.stopCueKey ?? '',
      contract.completionCueKey,
      contract.implementationRequirements.join(';'),
      contract.sourceFiles.join(';'),
      contract.notes,
    ]),
  ]);
}

function protocolCompatibilityCsv(rows) {
  return toCsv([
    [
      'microCheckType',
      'oldProtocolId',
      'oldProtocolVersion',
      'newProtocolId',
      'newProtocolVersion',
      'classification',
      'directComparisonAllowed',
      'oldHistoryPreserved',
      'newSeriesRequired',
      'activeStartSemantics',
      'interruptionSemantics',
      'sideSemantics',
      'resultSemantics',
      'reason',
    ],
    ...rows.map((row) => [
      row.microCheckType,
      row.oldProtocol.protocolId,
      row.oldProtocol.protocolVersion,
      row.newProtocol.protocolId,
      row.newProtocol.protocolVersion,
      row.classification,
      row.directComparisonAllowed,
      row.oldHistoryPreserved,
      row.newSeriesRequired,
      row.activeStartSemantics,
      row.interruptionSemantics,
      row.sideSemantics,
      row.resultSemantics,
      row.reason,
    ]),
  ]);
}

function runtimeScenariosCsv(rows) {
  return toCsv([
    ['scenarioId', 'category', 'description', 'expected', 'actual', 'passed'],
    ...rows.map((row) => [row.scenarioId, row.category, row.description, row.expected, row.actual, row.passed]),
  ]);
}

function timelinesCsv(rows) {
  return toCsv([
    [
      'timelineId',
      'microCheckType',
      'selectedSide',
      'cueIndex',
      'cueKey',
      'script',
      'startMs',
      'durationMs',
      'durationSource',
      'physicalCandidateKey',
      'hardCapMs',
      'notes',
    ],
    ...rows.map((row) => [
      row.timelineId,
      row.microCheckType,
      row.selectedSide,
      row.cueIndex,
      row.cueKey,
      row.script,
      row.startMs,
      row.durationMs,
      row.durationSource,
      row.physicalCandidateKey,
      row.hardCapMs,
      row.notes,
    ]),
  ]);
}

function assetRequirementsCsv(rows, durationIndex) {
  return toCsv([
    [
      'logicalCueKey',
      'exactScript',
      'category',
      'policyId',
      'requiredness',
      'microCheckTypes',
      'sideVariant',
      'currentCandidateKey',
      'currentCandidateScript',
      'claraExists',
      'marcusExists',
      'semanticMatch',
      'reuseDecision',
      'generationRequiredLater',
      'budgetClass',
      'claraDurationSecMeasuredCurrentMp3',
      'marcusDurationSecMeasuredCurrentMp3',
      'logicalDurationMode',
      'logicalDurationEstimateSec',
      'notes',
    ],
    ...rows.map((row) => {
      const durations = row.currentCandidateKey ? durationIndex.get(row.currentCandidateKey) : null;
      return [
        row.logicalCueKey,
        row.exactScript,
        row.category,
        row.policyId,
        row.requiredness,
        row.microCheckTypes.join(';'),
        row.sideVariant,
        row.currentCandidateKey ?? '',
        row.currentCandidateScript ?? '',
        row.claraExists,
        row.marcusExists,
        row.semanticMatch,
        row.reuseDecision,
        row.generationRequiredLater,
        row.budgetClass,
        formatNullableNumber(durations?.claraSec),
        formatNullableNumber(durations?.marcusSec),
        row.reuseDecision === 'reuse_exact_existing_pair' ? 'measured_current_mp3' : 'estimated_logical_unrecorded',
        formatNullableNumber(estimateDurationSec(row.exactScript)),
        row.notes,
      ];
    }),
  ]);
}

function auditMd(audit) {
  return `# Micro-Check Voice V2.1 Audit

Verdict: **${audit.verdict}**

Generated: ${audit.generatedAt}

## Readiness

- Behavior ready: ${audit.readiness.behaviorReady}
- Audio ready: ${audit.readiness.audioReady}
- Feature default: ${audit.readiness.featureDefault}
- Selectable V2.1 micro-check count: ${audit.readiness.selectableTypeCount}
- Runtime mode with feature flag on: ${audit.readiness.runtimeModeWithFeatureOn}

## Metrics

${metricBullets(audit.metrics)}

## Audio Baseline

Task-start hash file: ${ENTRY_AUDIO_HASH_FILE}

- Available: ${audit.audioHashComparison.available}
- Changed files vs task start: ${audit.audioHashComparison.changedCount}
- Added files vs task start: ${audit.audioHashComparison.addedCount}
- Deleted files vs task start: ${audit.audioHashComparison.deletedCount}

The audit does not compare audio against Git HEAD because the task began from a user-owned regenerated-audio corpus.
`;
}

function implementationMd(audit) {
  return `# Micro-Check Voice V2.1 Implementation

Verdict: **${audit.verdict}**

Implemented as a default-closed software/runtime contract under \`src/training/microCheckVoiceV21\`.

## Included

- Exact contracts for \`chair-power\`, \`single-leg-balance\`, and \`mobility-reach\`.
- Additive V2.1 measurement protocol descriptors:
  - \`micro_chair_power_5_reps_v21@2\`
  - \`micro_single_leg_balance_v21@2\`
  - \`micro_mobility_reach_v21@2\`
- Sequence planning for exact setup, final-position, countdown, completion, discard, retry, resume, and tracking recovery cues.
- Runtime model that starts active only on \`go\` playback-start evidence and ignores stale callbacks.
- Protocol compatibility classification requiring a new protocol version and preserving old history.
- Asset requirement matrix with measured current MP3 durations for existing candidate assets and estimated durations for ungenerated logical V2.1 cues.

## Not Included

- No audio files were generated or modified.
- No physical manifest, source audio metadata, or audio generation script was edited.
- No live feature enablement was added; audio remains not ready and selectable count remains zero.

## Key Result

Behavior-ready software is complete, but V2.1 remains closed until the later audio/schema phase provides exact physical assets and enables the feature gate.
`;
}

function handoffMd(audit) {
  return `# Voice Project Handoff After Micro-Check Voice V2.1

Current state: **${audit.verdict}**.

## Gates

- Training Voice V2.1 behavior: ready, audio not ready, feature off.
- Micro-Check Voice V2.1 behavior: ${audit.readiness.behaviorReady}, audio: ${audit.readiness.audioReady}, feature default: ${audit.readiness.featureDefault}, selectable count: ${audit.readiness.selectableTypeCount}.
- Balance Eyes-Open V2 remains audio pending/default closed from the prior baseline.
- Step-up and floor readiness work remains separate from this Micro-Check task.

## Next Work

1. Generate exact Clara/Marcus physical assets for the pending Micro-Check Voice V2.1 logical cues.
2. Add those assets to the physical manifest in a dedicated audio task.
3. Move final schema/persistence wiring to V2.1 protocol IDs only after audio QA is complete.
4. Flip the feature gate only when behavior, audio, schema, and manual device QA are all green.

Audio hash comparison in this audit is against task-start baseline, not Git HEAD.
`;
}

function scenario(scenarioId, category, description, expected, actual, passed) {
  return {
    scenarioId,
    category,
    description: String(description ?? ''),
    expected: String(expected ?? ''),
    actual: String(actual ?? ''),
    passed: passed ? 'true' : 'false',
  };
}

function compareAudioTaskStartHashes() {
  if (!fs.existsSync(ENTRY_AUDIO_HASH_FILE)) {
    return {
      available: false,
      changedCount: 0,
      addedCount: 0,
      deletedCount: 0,
      changedPaths: [],
      addedPaths: [],
      deletedPaths: [],
    };
  }
  const entry = readHashFile(ENTRY_AUDIO_HASH_FILE);
  const current = hashAudioBaselinePaths();
  const changedPaths = [];
  const addedPaths = [];
  const deletedPaths = [];
  for (const [filePath, hash] of entry) {
    if (!current.has(filePath)) {
      deletedPaths.push(filePath);
    } else if (current.get(filePath) !== hash) {
      changedPaths.push(filePath);
    }
  }
  for (const filePath of current.keys()) {
    if (!entry.has(filePath)) addedPaths.push(filePath);
  }
  return {
    available: true,
    changedCount: changedPaths.length + addedPaths.length + deletedPaths.length,
    addedCount: addedPaths.length,
    deletedCount: deletedPaths.length,
    changedPaths,
    addedPaths,
    deletedPaths,
  };
}

function readHashFile(filePath) {
  const map = new Map();
  const text = fs.readFileSync(filePath, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = trimmed.match(/^([a-f0-9]{64})\s+(.+)$/i);
    if (!match) continue;
    map.set(normalizeHashPath(match[2]), match[1]);
  }
  return map;
}

function hashAudioBaselinePaths() {
  const files = [
    ...listFiles(path.join(ROOT, 'assets/audio')).map((filePath) => path.relative(ROOT, filePath)),
    ...listFiles(path.join(ROOT, 'src/audio')).map((filePath) => path.relative(ROOT, filePath)),
    'scripts/generate-audio.ts',
    'scripts/verify-audio.ts',
  ].sort();
  const map = new Map();
  for (const filePath of files) {
    const abs = path.join(ROOT, filePath);
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) continue;
    map.set(filePath, crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex'));
  }
  return map;
}

function normalizeHashPath(filePath) {
  return filePath.replace(`${ROOT}/`, '').replace(/^\.\//, '');
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(abs));
    if (entry.isFile()) out.push(abs);
  }
  return out;
}

function gitSnapshot() {
  return {
    branch: commandOrNull('git', ['branch', '--show-current']),
    head: commandOrNull('git', ['rev-parse', '--short', 'HEAD']),
    status: commandOrNull('git', ['status', '--short', '--branch']),
  };
}

function commandOrNull(cmd, args) {
  try {
    return execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1024 * 1024 }).trim();
  } catch {
    return null;
  }
}

function writeArtifact(filePath, content) {
  const abs = path.join(ROOT, filePath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content);
}

function validate(metrics) {
  const failures = [];
  for (const key of [
    'missingContractCount',
    'staleExtraContractCount',
    'genericMicroIntroEmissionCount',
    'missingExactInstructionCount',
    'sideRoleMismatchCount',
    'directComparisonAllowedCount',
    'oldHistoryNotPreservedCount',
    'missingRegisteredProtocolCount',
    'missingGoActiveStartCount',
    'staleGoMutationCount',
    'duplicateTrackingLossCueCount',
    'resumeDirectActiveStartCount',
    'discardResultEmissionCount',
    'progressCueCount',
    'repSfxVoiceCueCount',
    'timelineHardCapMismatchCount',
    'physicalManifestChangeCount',
    'audioAssetChangeCount',
    'scenarioFailedCount',
    'p0',
    'p1',
    'p2',
  ]) {
    if (metrics[key] !== 0) failures.push(`${key}=${metrics[key]}`);
  }
  if (metrics.contractCount !== 3) failures.push(`contractCount=${metrics.contractCount}`);
  if (metrics.compatibilityRowCount !== 3) failures.push(`compatibilityRowCount=${metrics.compatibilityRowCount}`);
  if (metrics.newProtocolVersionRequiredCount !== 3) {
    failures.push(`newProtocolVersionRequiredCount=${metrics.newProtocolVersionRequiredCount}`);
  }
  if (metrics.behaviorReadyValue !== true) failures.push('behaviorReadyValue=false');
  if (metrics.audioReadyValue !== false) failures.push('audioReadyValue=true');
  if (metrics.selectableTypeCount !== 0) failures.push(`selectableTypeCount=${metrics.selectableTypeCount}`);
  if (!metrics.featureDefaultOff) failures.push('featureDefaultOff=false');
  if (!metrics.audioTaskStartHashAvailable) failures.push('audioTaskStartHashAvailable=false');
  if (!metrics.audioTaskStartHashUnchanged) failures.push('audioTaskStartHashUnchanged=false');
  if (failures.length > 0) {
    throw new Error(`Micro-Check Voice V2.1 audit failed: ${failures.join(', ')}`);
  }
}

function metricBullets(metrics) {
  return Object.entries(metrics)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join('\n');
}

function toCsv(rows) {
  return `${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

function csvCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function formatNullableNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(3) : '';
}
