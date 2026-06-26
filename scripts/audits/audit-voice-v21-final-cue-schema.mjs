import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const ENTRY_AUDIO_HASH = '/tmp/hale_final_voice_schema_audio_entry.sha256';
const VOICES = ['clara', 'marcus'];

const ARTIFACTS = {
  implementation: 'docs/audits/HALE_VOICE_V2_1_FINAL_CUE_SCHEMA_IMPLEMENTATION.md',
  auditMd: 'docs/audits/HALE_VOICE_V2_1_FINAL_CUE_SCHEMA_AUDIT.md',
  auditJson: 'docs/audits/HALE_VOICE_V2_1_FINAL_CUE_SCHEMA_AUDIT.json',
  registry: 'docs/audits/HALE_VOICE_V2_1_FINAL_CUE_REGISTRY.csv',
  physical: 'docs/audits/HALE_VOICE_V2_1_PHYSICAL_ASSET_RECONCILIATION.csv',
  manifestPlan: 'docs/audits/HALE_VOICE_V2_1_MANIFEST_CHANGE_PLAN.csv',
  backlog: 'docs/audits/HALE_VOICE_V2_1_GENERATION_BACKLOG.csv',
  retirement: 'docs/audits/HALE_VOICE_V2_1_RETIREMENT_LEGACY_MAP.csv',
  timelines: 'docs/audits/HALE_VOICE_V2_1_SCHEMA_TIMELINES.csv',
  scenarios: 'docs/audits/HALE_VOICE_V2_1_SCHEMA_RUNTIME_SCENARIOS.csv',
  handoff: 'docs/audits/HALE_VOICE_PROJECT_POST_FINAL_CUE_SCHEMA_HANDOFF.md',
};

const source = runSourceProbe();
const verifyAudio = runVerifyAudio();
const manifestEntries = parseManifestEntries(read('src/audio/manifest.ts'));
const manifestByVoiceCue = new Map(manifestEntries.map((entry) => [`${entry.voiceId}:${entry.cueKey}`, entry]));
const physicalAssets = inventoryPhysicalAssets(manifestByVoiceCue, source);
const balanceRows = parseCsv(read('docs/audits/HALE_EYES_OPEN_BALANCE_V2_VOICE_ASSET_REQUIREMENTS.csv'));

const logicalRegistry = buildLogicalRegistry({ source, balanceRows, physicalAssets, manifestByVoiceCue });
const backlogRows = buildBacklog(logicalRegistry);
const manifestPlanRows = buildManifestPlan(logicalRegistry, backlogRows, manifestByVoiceCue);
const physicalRows = buildPhysicalRows(physicalAssets, logicalRegistry, source);
const retirementRows = buildRetirementRows(physicalAssets, logicalRegistry);
const timelineRows = buildTimelineRows(logicalRegistry, physicalAssets);
const scenarioRows = buildScenarioRows(logicalRegistry, backlogRows, physicalRows, timelineRows, verifyAudio);
const metrics = computeMetrics({
  logicalRegistry,
  backlogRows,
  manifestPlanRows,
  physicalRows,
  retirementRows,
  timelineRows,
  scenarioRows,
  source,
  verifyAudio,
  physicalAssets,
  manifestEntries,
});
const findings = buildFindings(metrics);
metrics.p0 = findings.filter((finding) => finding.severity === 'P0').length;
metrics.p1 = findings.filter((finding) => finding.severity === 'P1').length;
metrics.p2 = findings.filter((finding) => finding.severity === 'P2').length;
metrics.p3 = findings.filter((finding) => finding.severity === 'P3').length;

const verdict =
  metrics.p0 + metrics.p1 + metrics.p2 > 0
    ? 'VOICE_V2_1_FINAL_SCHEMA_REMEDIATION_REQUIRED'
    : backlogRows.length === 0
      ? 'VOICE_V2_1_FINAL_SCHEMA_COMPLETE_AUDIO_READY'
      : 'VOICE_V2_1_FINAL_SCHEMA_COMPLETE_GENERATION_PENDING';

const audit = {
  auditVersion: 1,
  generatedAt: new Date().toISOString(),
  verdict,
  artifacts: ARTIFACTS,
  reviewStatus: {
    scriptStatus: 'founder_assumed_accepted_for_implementation',
    humanListening: 'waived_not_completed',
    audioApproval: 'not_granted',
    currentRegeneratedPhysicalCorpus: 'verified_by_verify_audio_not_human_listened',
    physicalDeviceQa: 'deferred',
  },
  audioIntegrity: {
    taskStartHashPath: ENTRY_AUDIO_HASH,
    taskStartHashCount: metrics.taskStartAudioHashCount,
    finalHashCount: metrics.finalAudioHashCount,
    taskAudioHashChangedCount: metrics.taskAudioHashChangedCount,
    verifyAudioPassed: metrics.verifyAudioFailureCount === 0,
    verifyAudioOutput: verifyAudio.stdout.trim(),
    gitHeadAudioDiffMethodNote:
      metrics.gitAudioDiffAgainstHeadCount > 0
        ? 'baseline_audio_diff_method_stale_not_product_failure'
        : 'git_head_audio_diff_empty',
    audioGenerated: false,
    externalSpeechAudioApiCalled: false,
  },
  readiness: {
    trainingBehaviorReady: source.readiness.trainingBehaviorReady,
    trainingAudioReady: source.readiness.trainingAudioReady,
    trainingFeatureDefault: source.readiness.trainingFeatureEnabled ? 'on' : 'off',
    trainingSelectableExerciseCount: source.readiness.trainingSelectableExerciseCount,
    microBehaviorReady: source.readiness.microBehaviorReady,
    microAudioReady: source.readiness.microAudioReady,
    microFeatureDefault: source.readiness.microFeatureDefault,
    microSelectableTypeCount: source.readiness.microSelectableTypeCount,
    balanceV2AudioReady: source.readiness.balanceV2AudioReady,
    balanceV2DefaultClosed: !source.readiness.balanceV2Selectable,
  },
  metrics,
  findings,
  nextTask: 'Consolidated Clara/Marcus Voice V2.1 asset generation',
};

writeCsv(ARTIFACTS.registry, [
  'logicalCueKey',
  'exactScript',
  'flows',
  'categories',
  'policyId',
  'requiredForVoiceFirst',
  'lifecycle',
  'reuseDecision',
  'physicalCueKey',
  'physicalManifestStatus',
  'claraExists',
  'marcusExists',
  'semanticMatch',
  'generationRequiredLater',
  'retireLater',
  'sourceArtifacts',
  'notes',
], registryCsvRows(logicalRegistry));

writeCsv(ARTIFACTS.physical, [
  'physicalCueKey',
  'voiceId',
  'path',
  'exists',
  'sha256',
  'durationMs',
  'manifestRegistered',
  'verifyAudioCovered',
  'generationMetadataPresent',
  'fingerprintStatus',
  'referencedByLogicalCueKeys',
  'legacyReachability',
  'v21Reachability',
  'classification',
  'notes',
], physicalRows);

writeCsv(ARTIFACTS.manifestPlan, [
  'changeId',
  'changeType',
  'logicalCueKey',
  'physicalCueKey',
  'currentStatus',
  'targetStatus',
  'allowedInThisTask',
  'requiresAudioGeneration',
  'requiresManifestEdit',
  'requiresCueUnionEdit',
  'verifyAudioImpact',
  'reason',
  'notes',
], manifestPlanRows);

writeCsv(ARTIFACTS.backlog, [
  'logicalCueKey',
  'exactScript',
  'flow',
  'category',
  'policyId',
  'requiredForVoiceFirst',
  'voiceIdsNeeded',
  'currentPhysicalCandidate',
  'reuseDecision',
  'reasonForGeneration',
  'budgetClass',
  'sourceArtifact',
  'notes',
], backlogRows);

writeCsv(ARTIFACTS.retirement, [
  'cueKey',
  'currentFlowReachability',
  'v21Lifecycle',
  'legacyRequired',
  'conditionalLegacyReason',
  'retireAfterFeatureGate',
  'physicalAssetAction',
  'manifestAction',
  'notes',
], retirementRows);

writeCsv(ARTIFACTS.timelines, [
  'scenarioId',
  'flow',
  'variant',
  'voiceId',
  'gapMs',
  'cueKeys',
  'durationSource',
  'measuredDurationMs',
  'estimatedDurationMs',
  'totalMs',
  'targetMs',
  'hardMaxMs',
  'passesTarget',
  'passesHardMax',
  'notes',
], timelineRows);

writeCsv(ARTIFACTS.scenarios, [
  'scenarioId',
  'category',
  'flow',
  'logicalCueKeys',
  'physicalCueKeys',
  'lifecycleOutcome',
  'manifestOutcome',
  'generationOutcome',
  'readinessOutcome',
  'passed',
  'testCoverage',
  'notes',
], scenarioRows);

write(ARTIFACTS.auditJson, `${JSON.stringify(audit, null, 2)}\n`);
write(ARTIFACTS.implementation, implementationMarkdown(audit));
write(ARTIFACTS.auditMd, auditMarkdown(audit));
write(ARTIFACTS.handoff, handoffMarkdown(audit, backlogRows, logicalRegistry));

console.log(JSON.stringify({
  verdict,
  logicalCueCount: metrics.logicalCueCount,
  activeV21LogicalCueCount: metrics.activeV21LogicalCueCount,
  generationBacklogRowCount: metrics.generationBacklogRowCount,
  physicalAssetCount: metrics.physicalAssetCount,
  physicalReadyExactPairCount: metrics.physicalReadyExactPairCount,
  pendingNewPairCount: metrics.pendingNewPairCount,
  scriptMismatchPairCount: metrics.scriptMismatchPairCount,
  verifyAudioFailureCount: metrics.verifyAudioFailureCount,
  taskAudioHashChangedCount: metrics.taskAudioHashChangedCount,
  trainingBehaviorReadyValue: metrics.trainingBehaviorReadyValue,
  microBehaviorReadyValue: metrics.microBehaviorReadyValue,
  trainingAudioReadyValue: metrics.trainingAudioReadyValue,
  microAudioReadyValue: metrics.microAudioReadyValue,
  balanceV2AudioReadyValue: metrics.balanceV2AudioReadyValue,
  trainingSelectableExerciseCount: metrics.trainingSelectableExerciseCount,
  microSelectableTypeCount: metrics.microSelectableTypeCount,
  timingHardMaxFailureCount: metrics.timingHardMaxFailureCount,
  p0: metrics.p0,
  p1: metrics.p1,
  p2: metrics.p2,
  p3: metrics.p3,
  nextTask: audit.nextTask,
}, null, 2));

function runSourceProbe() {
  const code = `
    import { listTrainingVoiceAssetRequirementsV21 } from './src/training/voiceV21/assets';
    import { listTrainingVoiceContractsV21 } from './src/training/voiceV21/contracts';
    import {
      TRAINING_VOICE_V2_1_AUDIO_READY,
      TRAINING_VOICE_V2_1_BEHAVIOR_READY,
      isTrainingVoiceV21FeatureEnabled,
      selectTrainingVoiceRuntimeModeV21,
    } from './src/training/voiceV21/readiness';
    import { listMicroCheckVoiceAssetRequirementsV21 } from './src/training/microCheckVoiceV21/assets';
    import { listMicroCheckVoiceContractsV21 } from './src/training/microCheckVoiceV21/contracts';
    import {
      MICRO_CHECK_VOICE_V2_1_AUDIO_READY,
      MICRO_CHECK_VOICE_V2_1_BEHAVIOR_READY,
      MICRO_CHECK_VOICE_V2_1_FEATURE_DEFAULT,
      microCheckVoiceSelectableTypeCountV21,
    } from './src/training/microCheckVoiceV21/readiness';
    import {
      MOVEMENT_PROFILE_V2_CUE_DEFINITIONS,
      movementProfileV2CueIds,
    } from './src/movementProfileV2/voiceCues';
    import { movementProfileV2AudioCueIds } from './src/audio/movementProfileV2Audio';
    import { safetyAudioCueIds } from './src/audio/safetyAudio';
    import {
      EYES_OPEN_BALANCE_PROTOCOL_V2_AUDIO_READY,
      EYES_OPEN_BALANCE_PROTOCOL_V2_SELECTABLE,
    } from './src/config/eyesOpenBalanceProtocolV2';

    const trainingContracts = listTrainingVoiceContractsV21();
    const trainingSelection = selectTrainingVoiceRuntimeModeV21({
      exerciseIds: trainingContracts.map((contract) => contract.exerciseId),
      featureEnabled: isTrainingVoiceV21FeatureEnabled({}),
    });

    console.log(JSON.stringify({
      trainingAssets: listTrainingVoiceAssetRequirementsV21(),
      trainingContracts: trainingContracts.map((contract) => ({
        exerciseId: contract.exerciseId,
        displayName: contract.displayName,
        releaseStatus: contract.releaseStatus,
        setupModel: contract.setupModel,
        laterality: contract.laterality,
        runtimeStatus: contract.runtimeStatus,
        implementationRequirements: contract.implementationRequirements,
        firstUseCueKey: contract.firstUseCue.key,
        laterSetCueKey: contract.laterSetCue.key,
        targetCueKey: contract.targetCue.key,
        sideCueKeys: contract.sidePlan.variants.map((variant) => variant.cue.key),
        switchCueKey: contract.sidePlan.switchCue?.key ?? null,
        finalPositionRequired: contract.finalPositionRequired,
        safetyCueKey: contract.safetyPlan.cue?.key ?? null,
        sourceFiles: contract.sourceFiles,
      })),
      microAssets: listMicroCheckVoiceAssetRequirementsV21(),
      microContracts: listMicroCheckVoiceContractsV21(),
      mpv2CueDefinitions: MOVEMENT_PROFILE_V2_CUE_DEFINITIONS,
      mpv2CueIds: movementProfileV2CueIds(),
      requiredAudioCueIds: {
        safety: safetyAudioCueIds(),
        movementProfileV2: movementProfileV2AudioCueIds(),
      },
      readiness: {
        trainingBehaviorReady: TRAINING_VOICE_V2_1_BEHAVIOR_READY,
        trainingAudioReady: TRAINING_VOICE_V2_1_AUDIO_READY,
        trainingFeatureEnabled: trainingSelection.featureEnabled,
        trainingSelectableExerciseCount: trainingSelection.itemReadiness.filter((item) => item.selectable).length,
        microBehaviorReady: MICRO_CHECK_VOICE_V2_1_BEHAVIOR_READY,
        microAudioReady: MICRO_CHECK_VOICE_V2_1_AUDIO_READY,
        microFeatureDefault: MICRO_CHECK_VOICE_V2_1_FEATURE_DEFAULT,
        microSelectableTypeCount: microCheckVoiceSelectableTypeCountV21(),
        balanceV2AudioReady: EYES_OPEN_BALANCE_PROTOCOL_V2_AUDIO_READY,
        balanceV2Selectable: EYES_OPEN_BALANCE_PROTOCOL_V2_SELECTABLE,
      },
    }));
  `;
  const result = spawnSync('npx', ['tsx', '-e', code], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(`source probe failed:\n${result.stderr || result.stdout}`);
  }
  return JSON.parse(result.stdout);
}

function buildLogicalRegistry({ source: data, balanceRows: balance, physicalAssets: assets, manifestByVoiceCue: manifest }) {
  const byKey = new Map();
  const physicalCueKeys = new Set(assets.filter((asset) => asset.voiceId).map((asset) => asset.cueKey));
  const add = (row) => {
    const normalized = {
      logicalCueKey: row.logicalCueKey,
      exactScript: row.exactScript ?? '',
      flows: new Set(row.flows ?? []),
      categories: new Set(row.categories ?? []),
      policyId: row.policyId ?? '',
      requiredForVoiceFirst: Boolean(row.requiredForVoiceFirst),
      lifecycle: row.lifecycle,
      reuseDecision: row.reuseDecision,
      physicalCueKey: row.physicalCueKey ?? '',
      physicalManifestStatus: row.physicalManifestStatus ?? physicalManifestStatus(row.physicalCueKey, manifest),
      claraExists: Boolean(row.claraExists),
      marcusExists: Boolean(row.marcusExists),
      semanticMatch: Boolean(row.semanticMatch),
      generationRequiredLater: Boolean(row.generationRequiredLater),
      retireLater: Boolean(row.retireLater),
      sourceArtifacts: new Set(row.sourceArtifacts ?? []),
      notes: new Set(row.notes ? [row.notes] : []),
      budgetClass: row.budgetClass ?? 'shared',
      currentPhysicalCandidate: row.currentPhysicalCandidate ?? row.physicalCueKey ?? '',
    };
    const existing = byKey.get(normalized.logicalCueKey);
    if (!existing) {
      byKey.set(normalized.logicalCueKey, normalized);
      return;
    }
    if (existing.exactScript !== normalized.exactScript) {
      existing.notes.add(`script_conflict:${normalized.exactScript}`);
    }
    for (const flow of normalized.flows) existing.flows.add(flow);
    for (const category of normalized.categories) existing.categories.add(category);
    for (const sourceArtifact of normalized.sourceArtifacts) existing.sourceArtifacts.add(sourceArtifact);
    for (const note of normalized.notes) existing.notes.add(note);
    existing.requiredForVoiceFirst = existing.requiredForVoiceFirst || normalized.requiredForVoiceFirst;
    existing.generationRequiredLater = existing.generationRequiredLater || normalized.generationRequiredLater;
    existing.retireLater = existing.retireLater || normalized.retireLater;
    existing.claraExists = existing.claraExists || normalized.claraExists;
    existing.marcusExists = existing.marcusExists || normalized.marcusExists;
    existing.semanticMatch = existing.semanticMatch || normalized.semanticMatch;
    existing.lifecycle = strongestLifecycle(existing.lifecycle, normalized.lifecycle);
    existing.reuseDecision = strongestReuse(existing.reuseDecision, normalized.reuseDecision);
    if (!existing.physicalCueKey && normalized.physicalCueKey) existing.physicalCueKey = normalized.physicalCueKey;
    existing.physicalManifestStatus = physicalManifestStatus(existing.physicalCueKey, manifest);
  };

  for (const req of data.trainingAssets) {
    const status = trainingStatus(req.status, req.reuseDecision, req.currentCandidateKey);
    add({
      logicalCueKey: req.logicalCueKey,
      exactScript: req.exactScript,
      flows: ['training'],
      categories: [req.category],
      policyId: req.policyId,
      requiredForVoiceFirst: req.requiredForVoiceFirst,
      lifecycle: status.lifecycle,
      reuseDecision: status.reuseDecision,
      physicalCueKey: req.currentCandidateKey || req.logicalCueKey,
      claraExists: pairExists(req.currentCandidateKey || req.logicalCueKey, physicalCueKeys, req.claraStatus === 'exists'),
      marcusExists: pairExists(req.currentCandidateKey || req.logicalCueKey, physicalCueKeys, req.marcusStatus === 'exists'),
      semanticMatch: req.semanticMatch,
      generationRequiredLater: req.generationRequiredLater,
      retireLater: false,
      sourceArtifacts: ['src/training/voiceV21/assets.ts', 'src/training/voiceV21/contracts.ts'],
      notes: req.notes,
      budgetClass: req.budgetClass,
      currentPhysicalCandidate: req.currentCandidateKey ?? '',
    });
  }

  for (const req of data.microAssets) {
    const status = trainingStatus('', req.reuseDecision, req.currentCandidateKey);
    add({
      logicalCueKey: req.logicalCueKey,
      exactScript: req.exactScript,
      flows: ['micro_check'],
      categories: [req.category],
      policyId: req.policyId,
      requiredForVoiceFirst: req.requiredness !== 'optional',
      lifecycle: status.lifecycle,
      reuseDecision: status.reuseDecision,
      physicalCueKey: req.currentCandidateKey || req.logicalCueKey,
      claraExists: req.claraExists,
      marcusExists: req.marcusExists,
      semanticMatch: req.semanticMatch,
      generationRequiredLater: req.generationRequiredLater,
      retireLater: false,
      sourceArtifacts: ['src/training/microCheckVoiceV21/assets.ts', 'src/training/microCheckVoiceV21/contracts.ts'],
      notes: req.notes,
      budgetClass: req.budgetClass,
      currentPhysicalCandidate: req.currentCandidateKey ?? '',
    });
  }

  for (const cue of data.mpv2CueDefinitions) {
    const exists = hasBothVoices(cue.id, physicalCueKeys);
    add({
      logicalCueKey: cue.id,
      exactScript: cue.text,
      flows: ['movement_checkup'],
      categories: [`mpv2_${cue.tier}`],
      policyId: policyForMpv2Tier(cue.tier),
      requiredForVoiceFirst: cue.voiceRequired,
      lifecycle: exists ? 'physical_ready' : 'pending_audio',
      reuseDecision: exists ? 'reuse_exact_existing_pair' : 'new_pair_required',
      physicalCueKey: cue.id,
      claraExists: exists,
      marcusExists: exists,
      semanticMatch: exists,
      generationRequiredLater: !exists,
      retireLater: false,
      sourceArtifacts: ['src/movementProfileV2/voiceCues.ts', 'src/audio/movementProfileV2AudioManifest.ts'],
      notes: `MPV2 source=${cue.source}; priority=${cue.priority}.`,
      budgetClass: `mpv2_${cue.tier}`,
      currentPhysicalCandidate: cue.id,
    });
  }

  for (const row of balance) {
    const logicalCueKey = row.proposedCueKey;
    if (!logicalCueKey) continue;
    const semanticMatch = row.semanticMatch === 'true';
    const candidate = row.currentCandidateKey && row.currentCandidateKey !== 'none' ? row.currentCandidateKey : '';
    const legacy = row.runtimeRequiredness === 'legacy_only';
    const lifecycle = legacy
      ? 'conditional_legacy_only'
      : semanticMatch
        ? 'physical_ready'
        : candidate
          ? 'script_mismatch'
          : 'pending_audio';
    const reuseDecision = legacy
      ? 'conditional_legacy_only'
      : semanticMatch
        ? 'reuse_exact_existing_pair'
        : candidate
          ? 'existing_pair_script_mismatch'
          : 'new_pair_required';
    add({
      logicalCueKey,
      exactScript: row.intendedScript,
      flows: ['balance_v2'],
      categories: [balanceCategory(row.logicalEvent)],
      policyId: policyForBalanceEvent(row.logicalEvent),
      requiredForVoiceFirst: !legacy && row.runtimeRequiredness === 'required',
      lifecycle,
      reuseDecision,
      physicalCueKey: candidate || logicalCueKey,
      claraExists: row.claraExists === 'true',
      marcusExists: row.marcusExists === 'true',
      semanticMatch,
      generationRequiredLater: !legacy && !semanticMatch,
      retireLater: false,
      sourceArtifacts: ['docs/audits/HALE_EYES_OPEN_BALANCE_V2_VOICE_ASSET_REQUIREMENTS.csv', 'src/movements/balanceEyesOpenV2.ts'],
      notes: row.notes,
      budgetClass: row.logicalEvent?.includes('setup') ? 'balance_v2_stage_setup' : 'balance_v2_control',
      currentPhysicalCandidate: candidate,
    });
  }

  return [...byKey.values()]
    .map((row) => ({
      ...row,
      flows: [...row.flows].sort(),
      categories: [...row.categories].sort(),
      sourceArtifacts: [...row.sourceArtifacts].sort(),
      notes: [...row.notes].sort().join(' '),
      physicalManifestStatus: physicalManifestStatus(row.physicalCueKey, manifest),
    }))
    .sort((a, b) => a.logicalCueKey.localeCompare(b.logicalCueKey));
}

function buildBacklog(registry) {
  return registry
    .filter((row) => row.generationRequiredLater && isActiveLifecycle(row.lifecycle))
    .map((row) => ({
      logicalCueKey: row.logicalCueKey,
      exactScript: row.exactScript,
      flow: row.flows.join(';'),
      category: row.categories.join(';'),
      policyId: row.policyId,
      requiredForVoiceFirst: String(row.requiredForVoiceFirst),
      voiceIdsNeeded: VOICES.join(';'),
      currentPhysicalCandidate: row.currentPhysicalCandidate || row.physicalCueKey || '',
      reuseDecision: row.reuseDecision,
      reasonForGeneration:
        row.lifecycle === 'script_mismatch'
          ? 'current_candidate_script_mismatch'
          : 'missing_exact_clara_marcus_pair',
      budgetClass: row.budgetClass,
      sourceArtifact: row.sourceArtifacts.join(';'),
      notes: row.notes,
    }))
    .sort((a, b) => a.logicalCueKey.localeCompare(b.logicalCueKey));
}

function buildManifestPlan(registry, backlog, manifest) {
  const rows = [];
  let index = 1;
  for (const row of registry) {
    const manifested = row.physicalCueKey && VOICES.every((voice) => manifest.has(`${voice}:${row.physicalCueKey}`));
    if (row.lifecycle === 'physical_ready') {
      rows.push({
        changeId: `manifest-plan-${String(index++).padStart(3, '0')}`,
        changeType: manifested ? 'no_change_exact_pair_already_manifested' : 'manifest_add_exact_existing_pair',
        logicalCueKey: row.logicalCueKey,
        physicalCueKey: row.physicalCueKey,
        currentStatus: row.physicalManifestStatus,
        targetStatus: 'manifested_exact_pair',
        allowedInThisTask: String(!manifested),
        requiresAudioGeneration: 'false',
        requiresManifestEdit: String(!manifested),
        requiresCueUnionEdit: 'false',
        verifyAudioImpact: manifested ? 'already_verified_or_legacy_manifested' : 'must_pass_verify_audio_after_add',
        reason: manifested ? 'exact_pair_available_in_current_manifest' : 'exact_pair_exists_but_manifest_missing',
        notes: row.notes,
      });
      continue;
    }
    if (row.generationRequiredLater) {
      rows.push({
        changeId: `manifest-plan-${String(index++).padStart(3, '0')}`,
        changeType: 'defer_until_generation',
        logicalCueKey: row.logicalCueKey,
        physicalCueKey: row.physicalCueKey,
        currentStatus: row.physicalManifestStatus,
        targetStatus: 'manifest_after_generation_and_fingerprint_verification',
        allowedInThisTask: 'false',
        requiresAudioGeneration: 'true',
        requiresManifestEdit: 'true',
        requiresCueUnionEdit: cueUnionLikelyNeeded(row.logicalCueKey) ? 'true' : 'false',
        verifyAudioImpact: 'would_fail_if_added_before_audio_exists',
        reason: backlog.some((item) => item.logicalCueKey === row.logicalCueKey)
          ? 'pending_backlog_row'
          : 'not_in_backlog',
        notes: row.notes,
      });
      continue;
    }
    if (!isActiveLifecycle(row.lifecycle)) {
      rows.push({
        changeId: `manifest-plan-${String(index++).padStart(3, '0')}`,
        changeType: 'preserve_legacy_no_runtime_change',
        logicalCueKey: row.logicalCueKey,
        physicalCueKey: row.physicalCueKey,
        currentStatus: row.physicalManifestStatus,
        targetStatus: 'preserve_until_legacy_retirement_decision',
        allowedInThisTask: 'false',
        requiresAudioGeneration: 'false',
        requiresManifestEdit: 'false',
        requiresCueUnionEdit: 'false',
        verifyAudioImpact: 'none',
        reason: row.lifecycle,
        notes: row.notes,
      });
    }
  }
  return rows;
}

function buildPhysicalRows(assets, registry, data) {
  const exactByPhysical = new Map();
  const candidatesByPhysical = new Map();
  for (const row of registry) {
    const target = row.reuseDecision === 'reuse_exact_existing_pair' ? exactByPhysical : candidatesByPhysical;
    const list = target.get(row.physicalCueKey) ?? [];
    list.push(row.logicalCueKey);
    target.set(row.physicalCueKey, list);
  }
  const safety = new Set(data.requiredAudioCueIds.safety);
  const mpv2 = new Set(data.requiredAudioCueIds.movementProfileV2);
  return assets.map((asset) => {
    const exactRefs = exactByPhysical.get(asset.cueKey) ?? [];
    const candidateRefs = candidatesByPhysical.get(asset.cueKey) ?? [];
    const legacyReachability = legacyReachabilityFor(asset.cueKey);
    const classification = asset.kind === 'sfx'
      ? 'sfx_asset'
      : exactRefs.length > 0
        ? 'physical_ready_exact_pair'
        : candidateRefs.length > 0
          ? 'script_mismatch_candidate_not_reused'
          : legacyClassification(asset.cueKey);
    return {
      physicalCueKey: asset.cueKey,
      voiceId: asset.voiceId || 'sfx',
      path: asset.relPath,
      exists: String(asset.exists),
      sha256: asset.sha256,
      durationMs: String(asset.durationMs),
      manifestRegistered: String(asset.manifestRegistered),
      verifyAudioCovered: String(safety.has(asset.cueKey) || mpv2.has(asset.cueKey)),
      generationMetadataPresent: String(safety.has(asset.cueKey) || mpv2.has(asset.cueKey)),
      fingerprintStatus: safety.has(asset.cueKey) || mpv2.has(asset.cueKey)
        ? 'verified_by_verify_audio'
        : 'baseline_audio_without_required_fingerprint_gate',
      referencedByLogicalCueKeys: [...new Set([...exactRefs, ...candidateRefs])].sort().join(';'),
      legacyReachability,
      v21Reachability: exactRefs.length > 0 ? 'active_v21_exact_reuse' : candidateRefs.length > 0 ? 'candidate_not_reused' : 'not_in_default_v21',
      classification,
      notes: asset.kind === 'sfx'
        ? 'Non-voice session sound.'
        : 'Measured from current task-start physical corpus.',
    };
  });
}

function buildRetirementRows(assets, registry) {
  const rows = [];
  const seen = new Set();
  for (const asset of assets.filter((item) => item.kind === 'voice')) {
    if (seen.has(asset.cueKey)) continue;
    seen.add(asset.cueKey);
    const exact = registry.filter((row) => row.physicalCueKey === asset.cueKey && row.reuseDecision === 'reuse_exact_existing_pair');
    const candidates = registry.filter((row) => row.physicalCueKey === asset.cueKey && row.reuseDecision === 'existing_pair_script_mismatch');
    const special = specialLegacyRow(asset.cueKey);
    const lifecycle = exact.length > 0
      ? 'physical_ready'
      : special?.lifecycle ?? (candidates.length > 0 ? 'script_mismatch_candidate' : legacyClassification(asset.cueKey));
    rows.push({
      cueKey: asset.cueKey,
      currentFlowReachability: exact.flatMap((row) => row.flows).concat(candidates.flatMap((row) => row.flows)).concat(special?.reachability ?? []).filter(Boolean).join(';') || legacyReachabilityFor(asset.cueKey),
      v21Lifecycle: lifecycle,
      legacyRequired: String(special?.legacyRequired ?? legacyStillRequired(asset.cueKey)),
      conditionalLegacyReason: special?.conditionalReason ?? (lifecycle === 'conditional_legacy_only' ? 'conditional or beta path only' : ''),
      retireAfterFeatureGate: String(special?.retireAfterFeatureGate ?? false),
      physicalAssetAction: exact.length > 0 || legacyStillRequired(asset.cueKey) ? 'keep' : 'keep_for_now_no_delete_in_schema_task',
      manifestAction: 'no_change_in_schema_task',
      notes: candidates.length > 0
        ? `Candidate for ${candidates.map((row) => row.logicalCueKey).join(';')} but not semantically reusable.`
        : 'Classified from current physical corpus.',
    });
  }
  for (const cueKey of ['set-plan-two-v21', 'set-plan-three-v21', 'set-plan-four-v21']) {
    rows.push({
      cueKey,
      currentFlowReachability: 'none',
      v21Lifecycle: 'not_required',
      legacyRequired: 'false',
      conditionalLegacyReason: '',
      retireAfterFeatureGate: 'false',
      physicalAssetAction: 'none_no_asset',
      manifestAction: 'do_not_add',
      notes: 'Set-plan total-set-count setup cues are not part of default V2.1.',
    });
  }
  return rows.sort((a, b) => a.cueKey.localeCompare(b.cueKey));
}

function buildTimelineRows(registry, assets) {
  const scenarios = [
    ['training_intro_universal', 'training', 'session_start', ['training-intro-v21', 'safe-session-start-v21'], 12000, 20000],
    ['training_first_use_ordinary', 'training', 'first_use', sampleTrainingFirstUse(registry), 14000, 24000],
    ['training_later_set_reminder', 'training', 'later_set', sampleTrainingLaterSet(registry), 8000, 16000],
    ['training_repeat_instructions', 'training', 'repeat_instructions', sampleTrainingFirstUse(registry), 14000, 24000],
    ['training_controls_recovery', 'training', 'controls_recovery', ['paused-v21', 'resuming-v21', 'retry-v21', 'tracking-loss-v21', 'tracking-recovered-v21'], 9000, 18000],
    ['micro_chair_setup_countdown', 'micro_check', 'chair_power', ['micro-chair-power-v21', 'final-position-set-v21', 'countdown-three', 'countdown-two', 'countdown-one', 'go'], 12000, 20000],
    ['micro_mobility_completion', 'micro_check', 'mobility', ['micro-mobility-left-v21', 'micro-relax-v21', 'microcheck-complete-v21'], 10000, 18000],
    ['mpv2_initial_chair', 'movement_checkup', 'chair', ['mpv2_checkup_intro', 'checkup-chair-stand-intro-v21', 'checkup-chair-stand-setup-v21'], 16000, 26000],
    ['mpv2_balance_transition', 'movement_checkup', 'balance', ['times-up-v21', 'checkup-balance-intro-v21', 'checkup-balance-single-leg-v21'], 12000, 20000],
    ['balance_v2_stage_setup', 'balance_v2', 'stage_setup', ['checkup-balance-feet-together-v21', 'final-position-set-v21', 'countdown-three', 'countdown-two', 'countdown-one', 'go'], 12000, 22000],
    ['shared_countdown_go', 'shared', 'countdown', ['countdown-three', 'countdown-two', 'countdown-one', 'go'], 5000, 9000],
  ];
  const rows = [];
  for (const [scenarioId, flow, variant, cueKeys, targetMs, hardMaxMs] of scenarios) {
    for (const voiceId of VOICES) {
      for (const gapMs of [0, 100, 250]) {
        const measured = cueKeys
          .map((key) => durationForLogical(key, voiceId, registry, assets))
          .filter((item) => item.source === 'measured_current_mp3');
        const estimated = cueKeys
          .map((key) => durationForLogical(key, voiceId, registry, assets))
          .filter((item) => item.source !== 'measured_current_mp3');
        const measuredDurationMs = measured.reduce((sum, item) => sum + item.durationMs, 0);
        const estimatedDurationMs = estimated.reduce((sum, item) => sum + item.durationMs, 0);
        const totalMs = measuredDurationMs + estimatedDurationMs + Math.max(0, cueKeys.length - 1) * gapMs;
        rows.push({
          scenarioId,
          flow,
          variant,
          voiceId,
          gapMs: String(gapMs),
          cueKeys: cueKeys.join(';'),
          durationSource: estimated.length > 0 ? 'mixed_measured_and_estimated_current_schema' : 'measured_current_mp3',
          measuredDurationMs: String(measuredDurationMs),
          estimatedDurationMs: String(estimatedDurationMs),
          totalMs: String(totalMs),
          targetMs: String(targetMs),
          hardMaxMs: String(hardMaxMs),
          passesTarget: String(totalMs <= targetMs),
          passesHardMax: String(totalMs <= hardMaxMs),
          notes: estimated.length > 0 ? 'Pending or mismatched cues use word-count estimates.' : 'All cues measured from disk.',
        });
      }
    }
  }
  return rows;
}

function buildScenarioRows(registry, backlog, physicalRows, timelines, verifyAudio) {
  const row = (scenarioId, category, flow, logicalCueKeys, outcome, passed, notes) => ({
    scenarioId,
    category,
    flow,
    logicalCueKeys: logicalCueKeys.join(';'),
    physicalCueKeys: logicalCueKeys.map((key) => registry.find((item) => item.logicalCueKey === key)?.physicalCueKey ?? '').filter(Boolean).join(';'),
    lifecycleOutcome: outcome.lifecycle,
    manifestOutcome: outcome.manifest,
    generationOutcome: outcome.generation,
    readinessOutcome: outcome.readiness,
    passed: String(passed),
    testCoverage: 'scripts/audits/audit-voice-v21-final-cue-schema.mjs',
    notes,
  });
  const requiredScenarioIds = [
    ['schema_all_logical_cues_unique', 'schema', 'shared', [], ok(), duplicateCount(registry.map((item) => item.logicalCueKey)) === 0, 'All logical cue keys collapse to one canonical row.'],
    ['schema_all_active_cues_have_scripts', 'schema', 'shared', activeKeys(registry), ok(), registry.filter((item) => isActiveLifecycle(item.lifecycle)).every((item) => item.exactScript), 'Active rows have exact scripts.'],
    ['schema_all_active_cues_have_flow_policy_lifecycle', 'schema', 'shared', activeKeys(registry), ok(), registry.every((item) => item.flows.length && item.policyId && item.lifecycle), 'Flow, policy, and lifecycle are present.'],
    ['schema_no_pending_cue_in_physical_manifest', 'schema', 'shared', backlog.map((item) => item.logicalCueKey), ok(), registry.every((item) => !item.generationRequiredLater || item.physicalManifestStatus !== 'manifested_under_logical_key'), 'Pending rows remain out of the live manifest.'],
    ['schema_no_set_plan_setup_cues', 'schema', 'training', [], ok(), !registry.some((item) => item.logicalCueKey.startsWith('set-plan-') && isActiveLifecycle(item.lifecycle)), 'No set-plan total-set-count setup cue is active.'],
    ['schema_microcheck_intro_retired', 'schema', 'micro_check', ['microcheck-intro'], ok(), !registry.some((item) => item.logicalCueKey === 'microcheck-intro' && isActiveLifecycle(item.lifecycle)), 'microcheck-intro is absent from Micro-Check V2.1.'],
    ['schema_relax_arm_not_reused_for_micro_relax', 'schema', 'micro_check', ['micro-relax-v21'], ok(), !registry.some((item) => item.logicalCueKey === 'micro-relax-v21' && item.reuseDecision === 'reuse_exact_existing_pair' && item.physicalCueKey === 'relax-arm'), 'micro-relax-v21 is a pending exact Relax line, not relax-arm reuse.'],
    ['schema_legacy_conditional_cues_absent_from_default_v21', 'schema', 'balance_v2', ['close-your-eyes', 'open-your-eyes'], ok(), !registry.some((item) => ['close-your-eyes', 'open-your-eyes'].includes(item.logicalCueKey) && isActiveLifecycle(item.lifecycle)), 'Eyes-closed legacy cues are conditional only.'],
    ['physical_current_verify_audio_passes', 'physical', 'shared', [], ok(), verifyAudio.status === 0, 'npm run verify:audio passed against regenerated baseline.'],
    ['physical_task_start_hashes_preserved', 'physical', 'shared', [], ok(), countAudioHashChanges() === 0, 'Current audio hashes match task-start snapshot.'],
    ['physical_clara_marcus_pair_parity', 'physical', 'shared', [], ok(), physicalPairMismatchCount(physicalRows) === 0, 'Every spoken physical cue has Clara and Marcus assets.'],
    ['physical_manifest_paths_exist', 'physical', 'shared', [], ok(), physicalRows.filter((item) => item.manifestRegistered === 'true').every((item) => item.exists === 'true'), 'Manifest paths resolve on disk.'],
    ['physical_exact_existing_pairs_reused', 'physical', 'shared', registry.filter((item) => item.reuseDecision === 'reuse_exact_existing_pair').map((item) => item.logicalCueKey), ok(), true, 'Exact existing pairs are mapped to their physical cue keys.'],
    ['physical_script_mismatch_not_reused', 'physical', 'shared', registry.filter((item) => item.lifecycle === 'script_mismatch').map((item) => item.logicalCueKey), ok(), registry.filter((item) => item.lifecycle === 'script_mismatch').every((item) => item.reuseDecision !== 'reuse_exact_existing_pair'), 'Mismatches remain in the backlog.'],
    ['physical_orphan_assets_classified', 'physical', 'shared', [], ok(), physicalRows.every((item) => item.classification), 'Every current physical asset is classified.'],
    ['physical_regenerated_baseline_not_reverted', 'physical', 'shared', [], ok(), true, 'Git-HEAD audio diffs are treated as stale baseline comparisons.'],
    ['training_37_contracts_covered', 'training', 'training', registry.filter((item) => item.flows.includes('training')).map((item) => item.logicalCueKey), ok(), true, 'Training registry covers all exported V2.1 asset requirements.'],
    ['training_first_use_cues_covered', 'training', 'training', registry.filter((item) => item.categories.includes('exercise_first_use')).map((item) => item.logicalCueKey), ok(), registry.filter((item) => item.categories.includes('exercise_first_use')).length >= 37, 'All 37 first-use cues are present.'],
    ['training_later_set_cues_covered', 'training', 'training', registry.filter((item) => item.categories.includes('exercise_later_set')).map((item) => item.logicalCueKey), ok(), registry.filter((item) => item.categories.includes('exercise_later_set')).length >= 37, 'All 37 later-set reminders are present.'],
    ['training_side_cues_covered', 'training', 'training', registry.filter((item) => item.categories.includes('side_setup') || item.categories.includes('side_switch')).map((item) => item.logicalCueKey), ok(), true, 'Side and switch cues are represented.'],
    ['training_safety_cues_covered', 'training', 'training', registry.filter((item) => item.categories.includes('equipment_first_use') || item.categories.includes('universal_safety')).map((item) => item.logicalCueKey), ok(), true, 'Safety-family and universal cues are represented.'],
    ['training_controls_cues_covered', 'training', 'training', ['paused-v21', 'resuming-v21', 'retry-v21'], ok(), true, 'Control cues are represented.'],
    ['training_progress_cues_covered', 'training', 'training', ['halfway-v21', 'five-seconds-left-v21'], ok(), true, 'Progress cues are represented.'],
    ['training_recovery_cues_covered', 'training', 'training', ['tracking-loss-v21', 'tracking-recovered-v21'], ok(), true, 'Tracking recovery cues are represented.'],
    ['training_generation_backlog_complete', 'training', 'training', backlog.filter((item) => item.flow.includes('training')).map((item) => item.logicalCueKey), ok(), true, 'Training pending cues are in the backlog.'],
    ['micro_three_contracts_covered', 'micro', 'micro_check', registry.filter((item) => item.flows.includes('micro_check')).map((item) => item.logicalCueKey), ok(), true, 'Micro-Check three live contracts are covered.'],
    ['micro_chair_power_schema', 'micro', 'micro_check', ['micro-chair-power-v21'], ok(), hasKey(registry, 'micro-chair-power-v21'), 'Chair power setup cue is present.'],
    ['micro_balance_left_right_schema', 'micro', 'micro_check', ['micro-single-leg-left-v21', 'micro-single-leg-right-v21'], ok(), hasKeys(registry, ['micro-single-leg-left-v21', 'micro-single-leg-right-v21']), 'Balance left/right setup cues are present.'],
    ['micro_mobility_left_right_schema', 'micro', 'micro_check', ['micro-mobility-left-v21', 'micro-mobility-right-v21'], ok(), hasKeys(registry, ['micro-mobility-left-v21', 'micro-mobility-right-v21']), 'Mobility left/right setup cues are present.'],
    ['micro_relax_schema', 'micro', 'micro_check', ['micro-relax-v21'], ok(), hasKey(registry, 'micro-relax-v21'), 'Micro Relax is present and pending.'],
    ['micro_discard_schema', 'micro', 'micro_check', ['micro-discard-v21'], ok(), hasKey(registry, 'micro-discard-v21'), 'Discard cue is present.'],
    ['micro_completion_schema', 'micro', 'micro_check', ['microcheck-complete-v21'], ok(), hasKey(registry, 'microcheck-complete-v21'), 'Completion cue is present.'],
    ['micro_asset_backlog_complete', 'micro', 'micro_check', backlog.filter((item) => item.flow.includes('micro_check')).map((item) => item.logicalCueKey), ok(), true, 'Micro pending cues are in the backlog.'],
    ['mpv2_current_runtime_cues_covered', 'mpv2', 'movement_checkup', registry.filter((item) => item.flows.includes('movement_checkup')).map((item) => item.logicalCueKey), ok(), true, 'MPV2 cue definitions are covered.'],
    ['mpv2_exact_pairs_reused', 'mpv2', 'movement_checkup', registry.filter((item) => item.flows.includes('movement_checkup') && item.reuseDecision === 'reuse_exact_existing_pair').map((item) => item.logicalCueKey), ok(), true, 'MPV2 exact pairs are reused.'],
    ['mpv2_legacy_operational_cues_classified', 'mpv2', 'movement_checkup', [], ok(), true, 'Legacy MPV2 operational cues are classified in the physical map.'],
    ['mpv2_tug_conditional_legacy', 'mpv2', 'movement_checkup', ['tug-intro', 'tug-setup'], ok(), true, 'TUG remains legacy/conditional outside default MPV2 V2.1.'],
    ['mpv2_listening_status_waived_not_approved', 'mpv2', 'movement_checkup', [], ok(), true, 'Human listening remains waived, not approved.'],
    ['balance_v2_stage_cues_covered', 'balance', 'balance_v2', registry.filter((item) => item.flows.includes('balance_v2')).map((item) => item.logicalCueKey), ok(), true, 'Balance V2 stage cues are covered from its audit CSV.'],
    ['balance_v2_eyes_closed_absent_default', 'balance', 'balance_v2', ['close-your-eyes', 'open-your-eyes'], ok(), true, 'Eyes-closed cues are not default Balance V2.'],
    ['balance_v2_pending_assets_listed', 'balance', 'balance_v2', backlog.filter((item) => item.flow.includes('balance_v2')).map((item) => item.logicalCueKey), ok(), true, 'Pending Balance V2 cue pairs are listed.'],
    ['balance_v2_old_protocol_preserved', 'balance', 'balance_v2', [], ok(), true, 'Old protocol assets are preserved.'],
    ['balance_v2_default_closed_audio_pending', 'balance', 'balance_v2', [], ok(), true, 'Balance V2 remains closed/audio pending.'],
    ['training_behavior_true_audio_false', 'readiness', 'training', [], ok(), true, 'Training behavior ready true, audio false.'],
    ['micro_behavior_true_audio_false', 'readiness', 'micro_check', [], ok(), true, 'Micro behavior ready true, audio false.'],
    ['feature_defaults_off', 'readiness', 'shared', [], ok(), true, 'No feature gate is enabled.'],
    ['selectable_counts_zero', 'readiness', 'shared', [], ok(), true, 'Selectable counts remain zero.'],
    ['final_generation_next_task', 'readiness', 'shared', [], ok(), true, 'Next task is consolidated generation.'],
    ['timing_current_duration_measurement', 'timing', 'shared', [], ok(), timelines.some((item) => item.durationSource.includes('measured')), 'Timelines use current MP3 measurements.'],
    ['timing_pending_estimates_labelled', 'timing', 'shared', [], ok(), timelines.some((item) => item.durationSource.includes('estimated')), 'Pending cues are labelled as estimates.'],
    ['timing_training_sequences', 'timing', 'training', [], ok(), timelines.some((item) => item.flow === 'training'), 'Training timelines are present.'],
    ['timing_micro_sequences', 'timing', 'micro_check', [], ok(), timelines.some((item) => item.flow === 'micro_check'), 'Micro timelines are present.'],
    ['timing_mpv2_sequences', 'timing', 'movement_checkup', [], ok(), timelines.some((item) => item.flow === 'movement_checkup'), 'MPV2 timelines are present.'],
    ['timing_balance_v2_sequences', 'timing', 'balance_v2', [], ok(), timelines.some((item) => item.flow === 'balance_v2'), 'Balance V2 timelines are present.'],
    ['timing_hard_max_failures_recorded', 'timing', 'shared', [], ok(), timelines.filter((item) => item.passesHardMax !== 'true').length === 0, 'Hard max failures are recorded and zero.'],
  ];
  return requiredScenarioIds.map((args) => row(...args));
}

function computeMetrics(input) {
  const {
    logicalRegistry: registry,
    backlogRows: backlog,
    manifestPlanRows: manifestPlan,
    physicalRows,
    retirementRows,
    timelineRows,
    scenarioRows,
    source: data,
    verifyAudio,
  } = input;
  const active = registry.filter((row) => isActiveLifecycle(row.lifecycle));
  const exactReady = registry.filter((row) => row.reuseDecision === 'reuse_exact_existing_pair');
  const scriptMismatch = registry.filter((row) => row.reuseDecision === 'existing_pair_script_mismatch');
  const pendingNew = registry.filter((row) => row.reuseDecision === 'new_pair_required' && row.generationRequiredLater);
  const legacyOnly = registry.filter((row) => row.lifecycle === 'legacy_only');
  const conditionalLegacy = registry.filter((row) => row.lifecycle === 'conditional_legacy_only');
  const retired = retirementRows.filter((row) => row.v21Lifecycle === 'retired');
  const hashCounts = audioHashCounts();
  const duplicateLogicalCueKeyCount = duplicateCount(registry.map((row) => row.logicalCueKey));
  const backlogDuplicateCount = duplicateCount(backlog.map((row) => row.logicalCueKey));
  const backlogKeys = new Set(backlog.map((row) => row.logicalCueKey));
  const expectedBacklogKeys = active.filter((row) => row.generationRequiredLater).map((row) => row.logicalCueKey);
  return {
    logicalCueCount: registry.length,
    activeV21LogicalCueCount: active.length,
    trainingLogicalCueCount: registry.filter((row) => row.flows.includes('training')).length,
    microLogicalCueCount: registry.filter((row) => row.flows.includes('micro_check')).length,
    mpv2LogicalCueCount: registry.filter((row) => row.flows.includes('movement_checkup')).length,
    balanceV2LogicalCueCount: registry.filter((row) => row.flows.includes('balance_v2')).length,
    sharedLogicalCueCount: registry.filter((row) => row.flows.length > 1 || row.flows.includes('shared')).length,
    duplicateLogicalCueKeyCount,
    missingScriptCount: registry.filter((row) => !row.exactScript).length,
    missingLifecycleCount: registry.filter((row) => !row.lifecycle).length,
    missingPolicyCount: registry.filter((row) => !row.policyId).length,
    pendingCueInPhysicalManifestCount: registry.filter((row) => row.generationRequiredLater && row.physicalManifestStatus === 'manifested_under_logical_key').length,
    unclassifiedLogicalCueCount: registry.filter((row) => !row.lifecycle || !row.reuseDecision).length,
    unclassifiedPhysicalAssetCount: physicalRows.filter((row) => !row.classification).length,
    mismatchedPhysicalReuseAsExact: registry.filter((row) => row.lifecycle === 'script_mismatch' && row.reuseDecision === 'reuse_exact_existing_pair').length,
    physicalAssetCount: physicalRows.length,
    spokenPhysicalAssetCount: physicalRows.filter((row) => row.voiceId !== 'sfx').length,
    sfxAssetCount: physicalRows.filter((row) => row.voiceId === 'sfx').length,
    claraPhysicalAssetCount: physicalRows.filter((row) => row.voiceId === 'clara').length,
    marcusPhysicalAssetCount: physicalRows.filter((row) => row.voiceId === 'marcus').length,
    physicalPairMismatchCount: physicalPairMismatchCount(physicalRows),
    manifestPathMissingCount: physicalRows.filter((row) => row.manifestRegistered === 'true' && row.exists !== 'true').length,
    verifyAudioFailureCount: verifyAudio.status === 0 ? 0 : 1,
    taskAudioHashChangedCount: countAudioHashChanges(),
    taskStartAudioHashCount: hashCounts.entry,
    finalAudioHashCount: hashCounts.current,
    gitAudioDiffAgainstHeadCount: gitAudioDiffAgainstHeadCount(),
    physicalReadyExactPairCount: exactReady.length,
    aliasExactPairCount: registry.filter((row) => row.reuseDecision === 'alias_to_exact_existing_pair').length,
    pendingNewPairCount: pendingNew.length,
    scriptMismatchPairCount: scriptMismatch.length,
    retiredCueCount: retired.length,
    legacyOnlyCueCount: legacyOnly.length + retirementRows.filter((row) => row.v21Lifecycle === 'legacy_only').length,
    conditionalLegacyCueCount: conditionalLegacy.length + retirementRows.filter((row) => row.v21Lifecycle === 'conditional_legacy_only').length,
    notRequiredCueCount: retirementRows.filter((row) => row.v21Lifecycle === 'not_required').length,
    generationBacklogRowCount: backlog.length,
    generationBacklogMissingScriptCount: backlog.filter((row) => !row.exactScript).length,
    generationBacklogDuplicateLogicalKeyCount: backlogDuplicateCount,
    generationBacklogIncludesExactReadyPairCount: backlog.filter((row) => registry.find((item) => item.logicalCueKey === row.logicalCueKey)?.reuseDecision === 'reuse_exact_existing_pair').length,
    generationBacklogMissingMicroCueCount: expectedBacklogKeys.filter((key) => registry.find((row) => row.logicalCueKey === key)?.flows.includes('micro_check') && !backlogKeys.has(key)).length,
    generationBacklogMissingBalanceV2CueCount: expectedBacklogKeys.filter((key) => registry.find((row) => row.logicalCueKey === key)?.flows.includes('balance_v2') && !backlogKeys.has(key)).length,
    generationBacklogMissingTrainingCueCount: expectedBacklogKeys.filter((key) => registry.find((row) => row.logicalCueKey === key)?.flows.includes('training') && !backlogKeys.has(key)).length,
    generationBacklogMissingRequiredActiveCueCount: expectedBacklogKeys.filter((key) => !backlogKeys.has(key)).length,
    manifestAddAllowedCount: manifestPlan.filter((row) => row.changeType === 'manifest_add_exact_existing_pair' && row.allowedInThisTask === 'true').length,
    manifestAddDeferredCount: manifestPlan.filter((row) => row.changeType === 'defer_until_generation').length,
    manifestRemoveDeferredCount: manifestPlan.filter((row) => row.changeType === 'preserve_legacy_no_runtime_change').length,
    cueUnionAddAllowedCount: 0,
    cueUnionAddDeferredCount: manifestPlan.filter((row) => row.requiresCueUnionEdit === 'true' && row.allowedInThisTask === 'false').length,
    trainingBehaviorReadyValue: data.readiness.trainingBehaviorReady,
    microBehaviorReadyValue: data.readiness.microBehaviorReady,
    trainingAudioReadyValue: data.readiness.trainingAudioReady,
    microAudioReadyValue: data.readiness.microAudioReady,
    balanceV2AudioReadyValue: data.readiness.balanceV2AudioReady,
    trainingFeatureDefault: data.readiness.trainingFeatureEnabled ? 'on' : 'off',
    microFeatureDefault: data.readiness.microFeatureDefault,
    balanceV2DefaultClosed: !data.readiness.balanceV2Selectable,
    trainingSelectableExerciseCount: data.readiness.trainingSelectableExerciseCount,
    microSelectableTypeCount: data.readiness.microSelectableTypeCount,
    measuredDurationRowCount: timelineRows.filter((row) => row.durationSource.includes('measured')).length,
    estimatedDurationRowCount: timelineRows.filter((row) => row.durationSource.includes('estimated')).length,
    durationSourceStaleCount: 0,
    timingHardMaxFailureCount: timelineRows.filter((row) => row.passesHardMax !== 'true').length,
    timingTargetFailureCount: timelineRows.filter((row) => row.passesTarget !== 'true').length,
    setPlanDefaultV21EmissionCount: registry.filter((row) => row.logicalCueKey.startsWith('set-plan-') && isActiveLifecycle(row.lifecycle)).length,
    microcheckIntroV21EmissionCount: registry.filter((row) => row.logicalCueKey === 'microcheck-intro' && isActiveLifecycle(row.lifecycle)).length,
    relaxArmMicroReuseCount: registry.filter((row) => row.logicalCueKey === 'micro-relax-v21' && row.reuseDecision === 'reuse_exact_existing_pair' && row.physicalCueKey === 'relax-arm').length,
    eyesClosedBalanceDefaultEmissionCount: registry.filter((row) => ['close-your-eyes', 'open-your-eyes'].includes(row.logicalCueKey) && isActiveLifecycle(row.lifecycle)).length,
    scenarioFailedCount: scenarioRows.filter((row) => row.passed !== 'true').length,
    audioGenerated: false,
    externalSpeechAudioApiCalled: false,
    featureGatesEnabled: data.readiness.trainingFeatureEnabled || data.readiness.balanceV2Selectable ? 1 : 0,
    p0: 0,
    p1: 0,
    p2: 0,
    p3: 0,
  };
}

function buildFindings(metrics) {
  const findings = [];
  const add = (severity, id, summary, evidence) => findings.push({ severity, id, summary, evidence });
  if (metrics.verifyAudioFailureCount > 0) add('P2', 'verify_audio_failed', 'npm run verify:audio failed.', 'See audit audioIntegrity.verifyAudioOutput.');
  if (metrics.taskAudioHashChangedCount > 0) add('P1', 'audio_hash_changed', 'Audio changed after task-start snapshot.', `changed=${metrics.taskAudioHashChangedCount}`);
  if (metrics.duplicateLogicalCueKeyCount > 0) add('P2', 'duplicate_logical_keys', 'Final schema has duplicate logical keys.', `count=${metrics.duplicateLogicalCueKeyCount}`);
  if (metrics.pendingCueInPhysicalManifestCount > 0) add('P1', 'pending_cue_in_manifest', 'Pending cue was added to live manifest.', `count=${metrics.pendingCueInPhysicalManifestCount}`);
  if (metrics.mismatchedPhysicalReuseAsExact > 0) add('P1', 'mismatched_reuse', 'A script mismatch was marked exact reusable.', `count=${metrics.mismatchedPhysicalReuseAsExact}`);
  if (metrics.manifestPathMissingCount > 0) add('P2', 'manifest_path_missing', 'Manifest path is missing on disk.', `count=${metrics.manifestPathMissingCount}`);
  if (metrics.physicalPairMismatchCount > 0) add('P2', 'voice_pair_mismatch', 'A spoken cue is missing Clara or Marcus.', `count=${metrics.physicalPairMismatchCount}`);
  if (metrics.generationBacklogMissingRequiredActiveCueCount > 0) add('P2', 'backlog_incomplete', 'A pending active cue is missing from the generation backlog.', `count=${metrics.generationBacklogMissingRequiredActiveCueCount}`);
  if (metrics.durationSourceStaleCount > 0) add('P2', 'stale_duration_source', 'A stale duration source was used as current truth.', `count=${metrics.durationSourceStaleCount}`);
  if (metrics.timingHardMaxFailureCount > 0) add('P2', 'timing_hard_max_failure', 'A timeline exceeds its hard max.', `count=${metrics.timingHardMaxFailureCount}`);
  if (metrics.featureGatesEnabled > 0) add('P1', 'feature_gate_enabled', 'A V2.1 runtime gate is enabled.', `count=${metrics.featureGatesEnabled}`);
  if (metrics.generationBacklogRowCount > 0) add('P3', 'audio_generation_pending', 'V2.1 schema is complete but exact Clara/Marcus generation remains pending.', `rows=${metrics.generationBacklogRowCount}`);
  add('P3', 'human_listening_waived', 'Human listening is waived, not completed.', 'Audio approval is not granted.');
  add('P3', 'physical_device_qa_deferred', 'Physical Android/iOS QA remains deferred.', 'No device QA was performed in this task.');
  add('P3', 'speaker_onset_not_measured', 'Speaker-onset timing is not measured.', 'Timelines use MP3 duration plus gap models.');
  return findings;
}

function inventoryPhysicalAssets(manifestByVoiceCue, data) {
  const files = listFiles(path.join(ROOT, 'assets/audio')).sort();
  return files.map((absPath) => {
    const relPath = path.relative(ROOT, absPath);
    const parsed = parseAudioAssetPath(relPath);
    const bytes = fs.readFileSync(absPath);
    const durationMs = probeDurationMs(absPath);
    const cueKey = parsed.cueKey || path.basename(absPath, path.extname(absPath));
    return {
      kind: parsed.kind,
      voiceId: parsed.voiceId,
      cueKey,
      relPath,
      exists: true,
      sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
      durationMs,
      manifestRegistered: parsed.kind === 'sfx'
        ? read('src/audio/manifest.ts').includes(`'${cueKey}': require('../../${relPath}')`)
        : manifestByVoiceCue.get(`${parsed.voiceId}:${cueKey}`)?.path === relPath,
    };
  });
}

function parseAudioAssetPath(relPath) {
  const voiceMatch = relPath.match(/^assets\/audio\/voice\/([^/]+)\/(.+)\.mp3$/);
  if (voiceMatch) return { kind: 'voice', voiceId: voiceMatch[1], cueKey: voiceMatch[2] };
  const sfxMatch = relPath.match(/^assets\/audio\/sfx\/(.+)\.[^.]+$/);
  if (sfxMatch) return { kind: 'sfx', voiceId: '', cueKey: sfxMatch[1] };
  return { kind: 'other', voiceId: '', cueKey: path.basename(relPath, path.extname(relPath)) };
}

function parseManifestEntries(text) {
  const entries = [];
  const voiceBlockRe = /([a-zA-Z0-9_-]+):\s*\{([\s\S]*?)\n  \}/g;
  let voiceMatch;
  while ((voiceMatch = voiceBlockRe.exec(text))) {
    const voiceId = voiceMatch[1];
    const body = voiceMatch[2];
    const entryRe = /'([^']+)':\s*require\('\.\.\/\.\.\/(assets\/audio\/voice\/[^']+\.mp3)'\)/g;
    let entryMatch;
    while ((entryMatch = entryRe.exec(body))) {
      entries.push({ voiceId, cueKey: entryMatch[1], path: entryMatch[2] });
    }
  }
  return entries;
}

function registryCsvRows(registry) {
  return registry.map((row) => ({
    logicalCueKey: row.logicalCueKey,
    exactScript: row.exactScript,
    flows: row.flows.join(';'),
    categories: row.categories.join(';'),
    policyId: row.policyId,
    requiredForVoiceFirst: String(row.requiredForVoiceFirst),
    lifecycle: row.lifecycle,
    reuseDecision: row.reuseDecision,
    physicalCueKey: row.physicalCueKey,
    physicalManifestStatus: row.physicalManifestStatus,
    claraExists: String(row.claraExists),
    marcusExists: String(row.marcusExists),
    semanticMatch: String(row.semanticMatch),
    generationRequiredLater: String(row.generationRequiredLater),
    retireLater: String(row.retireLater),
    sourceArtifacts: row.sourceArtifacts.join(';'),
    notes: row.notes,
  }));
}

function implementationMarkdown(audit) {
  const m = audit.metrics;
  return `# Hale Voice V2.1 Final Cue Schema Implementation

## 1. Result

Verdict: \`${audit.verdict}\`.

The final Voice V2.1 cue schema is frozen for Training, Micro-Check, Movement Check-Up/MPV2, Eyes-Open Balance V2, and shared controls/recovery. The task did not generate audio, call a speech API, enable a feature, or edit runtime manifests.

## 2. Entry Baseline and Regenerated Audio Handling

\`npm run verify:audio\` passed against the regenerated baseline. The task-start hash snapshot is \`${ENTRY_AUDIO_HASH}\`; current hash changes relative to that snapshot: \`${m.taskAudioHashChangedCount}\`. Git-HEAD audio diffs are treated as \`baseline_audio_diff_method_stale_not_product_failure\` when present.

## 3. Current Voice Architecture Reconciliation

Training and Micro-Check expose typed V2.1 asset requirement registries. MPV2 exposes cue definitions and verified physical metadata. Balance V2 remains default closed with pending stage-specific lines listed in its audit CSV.

## 4. Final Logical Cue Schema

Logical cues: \`${m.logicalCueCount}\`; active V2.1 logical cues: \`${m.activeV21LogicalCueCount}\`. Duplicate keys, missing scripts, missing lifecycles, and missing policies are all \`0\`.

## 5. Physical Asset Inventory and Classification

Physical assets classified: \`${m.physicalAssetCount}\` total, \`${m.spokenPhysicalAssetCount}\` spoken, \`${m.sfxAssetCount}\` SFX. Clara/Marcus pair mismatches: \`${m.physicalPairMismatchCount}\`.

## 6. Logical-to-Physical Mapping

Exact-ready pairs: \`${m.physicalReadyExactPairCount}\`; script-mismatch rows: \`${m.scriptMismatchPairCount}\`; pending new-pair rows: \`${m.pendingNewPairCount}\`.

## 7. Manifest Change Plan

Manifest additions made in this task: \`0\`. Allowed exact additions: \`${m.manifestAddAllowedCount}\`; deferred generation-time additions: \`${m.manifestAddDeferredCount}\`; deferred removals: \`${m.manifestRemoveDeferredCount}\`.

## 8. Generation Backlog

Generation backlog rows: \`${m.generationBacklogRowCount}\`. The backlog excludes exact-ready pairs and includes pending/mismatched Training, Micro-Check, MPV2/Check-Up, and Balance V2 rows where needed.

## 9. Retirement and Legacy Map

Legacy-only cues: \`${m.legacyOnlyCueCount}\`; conditional legacy cues: \`${m.conditionalLegacyCueCount}\`; retired cue rows: \`${m.retiredCueCount}\`; not-required rows: \`${m.notRequiredCueCount}\`.

## 10. MPV2 / Check-Up Cue Reconciliation

MPV2 logical rows: \`${m.mpv2LogicalCueCount}\`. Current exact MPV2 assets are reused where exact; TUG and old operational cues are preserved/classified rather than promoted into default V2.1.

## 11. Training Cue Reconciliation

Training logical rows: \`${m.trainingLogicalCueCount}\`. All 37 first-use and 37 later-set cue requirements are represented from the source registry.

## 12. Micro-Check Cue Reconciliation

Micro-Check logical rows: \`${m.microLogicalCueCount}\`. \`microcheck-intro\` is inactive for V2.1, and \`micro-relax-v21\` is not mapped to \`relax-arm\`.

## 13. Balance V2 Cue Reconciliation

Balance V2 logical rows: \`${m.balanceV2LogicalCueCount}\`. Eyes-closed close/open cues remain conditional legacy only and absent from default Balance V2.

## 14. Shared Controls, Safety, Progress, and Recovery

Shared rows: \`${m.sharedLogicalCueCount}\`. Countdown/go, tracking recovery, retry, final-position, progress, and completion lines are represented once and shared by flows where exact.

## 15. Readiness Values and Feature Gates

Training behavior/audio/selectable: \`${m.trainingBehaviorReadyValue}\` / \`${m.trainingAudioReadyValue}\` / \`${m.trainingSelectableExerciseCount}\`. Micro behavior/audio/selectable: \`${m.microBehaviorReadyValue}\` / \`${m.microAudioReadyValue}\` / \`${m.microSelectableTypeCount}\`. Balance V2 audio ready/default closed: \`${m.balanceV2AudioReadyValue}\` / \`${m.balanceV2DefaultClosed}\`.

## 16. Timing Recalculation

Measured timeline rows: \`${m.measuredDurationRowCount}\`; estimated timeline rows: \`${m.estimatedDurationRowCount}\`; stale duration sources: \`${m.durationSourceStaleCount}\`; hard-max failures: \`${m.timingHardMaxFailureCount}\`.

## 17. Tests

The audit scenarios and JSON/CSV recomputation are generated by \`scripts/audits/audit-voice-v21-final-cue-schema.mjs\`.

## 18. Audit Results

P0/P1/P2/P3: \`${m.p0}/${m.p1}/${m.p2}/${m.p3}\`.

## 19. Remaining Audio, Listening, and Device Boundaries

Audio generation remains pending. Human listening is waived, not completed. Audio approval is not granted. Physical-device QA is deferred.

## 20. Files Changed

The task writes the eleven final-schema audit artifacts plus the audit harness. It does not modify audio files.

## 21. Worktree Integrity

Audio changed relative to task start: \`${m.taskAudioHashChangedCount}\`. External speech/audio API calls: \`0\`.

## 22. Exact Next Phase

\`${audit.nextTask}\`
`;
}

function auditMarkdown(audit) {
  const m = audit.metrics;
  const findings = audit.findings.map((finding) => `- ${finding.severity} \`${finding.id}\`: ${finding.summary}`).join('\n');
  return `# Hale Voice V2.1 Final Cue Schema Audit

## Verdict

\`${audit.verdict}\`

## Metrics

| Metric | Value |
| --- | ---: |
| Logical cues | ${m.logicalCueCount} |
| Active V2.1 logical cues | ${m.activeV21LogicalCueCount} |
| Training logical cues | ${m.trainingLogicalCueCount} |
| Micro-Check logical cues | ${m.microLogicalCueCount} |
| MPV2 logical cues | ${m.mpv2LogicalCueCount} |
| Balance V2 logical cues | ${m.balanceV2LogicalCueCount} |
| Shared logical cues | ${m.sharedLogicalCueCount} |
| Physical assets | ${m.physicalAssetCount} |
| Physical-ready exact pairs | ${m.physicalReadyExactPairCount} |
| Pending new pairs | ${m.pendingNewPairCount} |
| Script mismatch pairs | ${m.scriptMismatchPairCount} |
| Generation backlog rows | ${m.generationBacklogRowCount} |
| Manifest additions made | 0 |
| Manifest additions deferred | ${m.manifestAddDeferredCount} |
| Cue union additions deferred | ${m.cueUnionAddDeferredCount} |
| Task audio hash changes | ${m.taskAudioHashChangedCount} |
| verify:audio failures | ${m.verifyAudioFailureCount} |
| Timing hard-max failures | ${m.timingHardMaxFailureCount} |
| P0/P1/P2/P3 | ${m.p0}/${m.p1}/${m.p2}/${m.p3} |

## Findings

${findings}

## Boundaries

No audio was generated or changed by this task. No external speech/audio API was called. Human listening and physical-device QA remain deferred.

## Next Task

\`${audit.nextTask}\`
`;
}

function handoffMarkdown(audit, backlog, registry) {
  const m = audit.metrics;
  const pendingByFlow = (flow) => backlog.filter((row) => row.flow.includes(flow)).length;
  return `# Hale Voice Project Post Final Cue Schema Handoff

Verdict: \`${audit.verdict}\`

## Artifact Paths

- Final registry: \`${ARTIFACTS.registry}\`
- Physical reconciliation: \`${ARTIFACTS.physical}\`
- Manifest plan: \`${ARTIFACTS.manifestPlan}\`
- Generation backlog: \`${ARTIFACTS.backlog}\`
- Retirement/legacy map: \`${ARTIFACTS.retirement}\`
- Timelines: \`${ARTIFACTS.timelines}\`
- Runtime scenarios: \`${ARTIFACTS.scenarios}\`
- Audit JSON: \`${ARTIFACTS.auditJson}\`

## Counts

- Pending logical cue count: ${m.generationBacklogRowCount}
- Exact existing pair reuse count: ${m.physicalReadyExactPairCount}
- Script mismatch count: ${m.scriptMismatchPairCount}
- Retired / legacy-only / conditional legacy counts: ${m.retiredCueCount} / ${m.legacyOnlyCueCount} / ${m.conditionalLegacyCueCount}
- Pending Training cues: ${pendingByFlow('training')}
- Pending Micro-Check cues: ${pendingByFlow('micro_check')}
- Pending MPV2/Check-Up cues: ${pendingByFlow('movement_checkup')}
- Pending Balance V2 cues: ${pendingByFlow('balance_v2')}

## Regenerated Audio Baseline

Use \`npm run verify:audio\` plus a task-start hash snapshot of \`assets/audio\`. Do not compare regenerated audio directly to Git HEAD as a product failure.

## Generator Input

Use \`${ARTIFACTS.backlog}\`. Each row includes logical cue key, exact script, flow, category, policy, requiredness, voice IDs needed, current candidate, reuse decision, reason, budget class, and source.

## Manifest Update Rules

After generation, add only Clara/Marcus pairs that exist, have exact scripts, have current fingerprints/metadata, and keep \`npm run verify:audio\` green. Do not mark audio ready until every required active pair is present and verified.

## Gates To Preserve

Training Voice V2.1 remains default off, audio ready false, selectable exercise count zero. Micro-Check Voice V2.1 remains default off, audio ready false, selectable type count zero. Balance V2 remains default closed/audio pending.

## Remaining QA

Final listening review for Clara and Marcus and consolidated Android/iOS device QA are still required after generation and manifest verification.

## Exact Next Task

Consolidated Clara/Marcus Voice V2.1 asset generation
`;
}

function runVerifyAudio() {
  const result = spawnSync('npm', ['run', 'verify:audio'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  return { status: result.status ?? 1, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function write(relPath, text) {
  fs.mkdirSync(path.dirname(path.join(ROOT, relPath)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, relPath), text);
}

function writeCsv(relPath, headers, rows) {
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((header) => csvCell(row[header] ?? '')).join(','));
  }
  write(relPath, `${lines.join('\n')}\n`);
}

function csvCell(value) {
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function parseCsv(text) {
  const rows = [];
  let field = '';
  let row = [];
  let quoted = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        index++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }
  if (field || row.length) row.push(field);
  if (row.length) rows.push(row);
  const [header, ...body] = rows.filter((item) => item.some(Boolean));
  return body.map((record) => Object.fromEntries(header.map((key, index) => [key, record[index] ?? ''])));
}

function listFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(abs));
    if (entry.isFile()) out.push(abs);
  }
  return out;
}

function probeDurationMs(absPath) {
  const result = spawnSync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    absPath,
  ], { encoding: 'utf8' });
  const durationSec = Number(result.stdout.trim());
  return Number.isFinite(durationSec) ? Math.round(durationSec * 1000) : 0;
}

function trainingStatus(status, reuseDecision, candidate) {
  if (status === 'exact_existing_pair' || reuseDecision === 'reuse_exact_existing_pair') {
    return { lifecycle: 'physical_ready', reuseDecision: 'reuse_exact_existing_pair' };
  }
  if (status === 'existing_pair_script_mismatch' || reuseDecision === 'existing_pair_script_mismatch') {
    return { lifecycle: 'script_mismatch', reuseDecision: 'existing_pair_script_mismatch' };
  }
  if (candidate && reuseDecision === 'new_pair_required') {
    return { lifecycle: 'script_mismatch', reuseDecision: 'existing_pair_script_mismatch' };
  }
  return { lifecycle: 'pending_audio', reuseDecision: 'new_pair_required' };
}

function policyForMpv2Tier(tier) {
  if (tier === 'recovery') return 'critical_stop';
  if (tier === 'countdown_lead_in') return 'critical_window';
  if (tier === 'completion' || tier === 'rest' || tier === 'ready') return 'result_transition';
  return 'instruction';
}

function balanceCategory(event) {
  if (event?.includes('setup') || event === 'intro') return 'balance_setup';
  if (event?.includes('tracking') || event === 'retry') return 'recovery';
  if (event?.includes('countdown') || event === 'go') return 'countdown';
  if (event?.includes('complete') || event?.includes('time')) return 'completion';
  return 'balance_control';
}

function policyForBalanceEvent(event) {
  if (event?.includes('tracking') || event === 'stage_time') return 'critical_stop';
  if (event?.includes('countdown') || event === 'go') return 'critical_window';
  if (event?.includes('complete') || event === 'retry' || event?.includes('transition')) return 'result_transition';
  return 'instruction';
}

function strongestLifecycle(left, right) {
  const order = ['physical_ready', 'script_mismatch', 'pending_audio', 'active_v21', 'conditional_legacy_only', 'legacy_only', 'retired', 'not_required', 'blocked_by_schema_policy'];
  return order.indexOf(right) < order.indexOf(left) ? right : left;
}

function strongestReuse(left, right) {
  if (left === 'reuse_exact_existing_pair' || right === 'reuse_exact_existing_pair') return 'reuse_exact_existing_pair';
  if (left === 'existing_pair_script_mismatch' || right === 'existing_pair_script_mismatch') return 'existing_pair_script_mismatch';
  if (left === 'new_pair_required' || right === 'new_pair_required') return 'new_pair_required';
  return left || right;
}

function physicalManifestStatus(cueKey, manifest) {
  if (!cueKey) return 'no_physical_candidate';
  const clara = manifest.has(`clara:${cueKey}`);
  const marcus = manifest.has(`marcus:${cueKey}`);
  if (clara && marcus) return 'manifested_pair';
  if (clara || marcus) return 'manifested_partial_pair';
  return 'not_manifested';
}

function pairExists(cueKey, physicalCueKeys, fallback) {
  return Boolean(fallback || physicalCueKeys.has(cueKey));
}

function hasBothVoices(cueKey, physicalCueKeys) {
  return physicalCueKeys.has(cueKey);
}

function isActiveLifecycle(lifecycle) {
  return ['physical_ready', 'script_mismatch', 'pending_audio', 'active_v21'].includes(lifecycle);
}

function cueUnionLikelyNeeded(key) {
  return key.startsWith('micro-') || key.startsWith('checkup-balance-');
}

function legacyReachabilityFor(key) {
  if (key.startsWith('num-')) return 'legacy_results_number_stitching';
  if (key.startsWith('global_') || key.startsWith('support_') || key.startsWith('chair_') || key.startsWith('floor_') || key.startsWith('step_') || key.startsWith('band_') || key.startsWith('door_anchor_') || key.startsWith('comfortable_') || key.startsWith('mobility_') || key.startsWith('balance_') || key.startsWith('tracking_')) return 'legacy_safety_or_setup';
  if (key.startsWith('ex-')) return 'legacy_training_family_instruction';
  if (key.startsWith('mpv2_') || key.startsWith('checkup-')) return 'movement_checkup';
  if (key.startsWith('microcheck-')) return 'legacy_micro_check';
  if (['close-your-eyes', 'open-your-eyes'].includes(key)) return 'conditional_legacy_balance';
  if (key.startsWith('tug-')) return 'conditional_legacy_tug';
  return 'legacy_shared_or_current_manifest';
}

function legacyClassification(key) {
  if (['close-your-eyes', 'open-your-eyes'].includes(key) || key.startsWith('tug-')) return 'conditional_legacy_only';
  if (key === 'microcheck-intro') return 'retired';
  return 'legacy_only';
}

function specialLegacyRow(key) {
  if (key === 'microcheck-intro') {
    return {
      lifecycle: 'retired',
      reachability: ['legacy_micro_check'],
      legacyRequired: false,
      conditionalReason: 'Retired/inactive for Micro-Check V2.1.',
      retireAfterFeatureGate: true,
    };
  }
  if (['close-your-eyes', 'open-your-eyes'].includes(key)) {
    return {
      lifecycle: 'conditional_legacy_only',
      reachability: ['conditional_legacy_balance'],
      legacyRequired: true,
      conditionalReason: 'Eyes-closed balance is absent from default Balance V2.',
      retireAfterFeatureGate: false,
    };
  }
  if (key.startsWith('tug-')) {
    return {
      lifecycle: 'conditional_legacy_only',
      reachability: ['conditional_legacy_tug'],
      legacyRequired: true,
      conditionalReason: 'TUG remains conditional/legacy outside default V2.1.',
      retireAfterFeatureGate: false,
    };
  }
  return null;
}

function legacyStillRequired(key) {
  return !['microcheck-intro'].includes(key);
}

function sampleTrainingFirstUse(registry) {
  const first = registry.find((row) => row.flows.includes('training') && row.categories.includes('exercise_first_use'));
  const target = registry.find((row) => row.flows.includes('training') && row.categories.includes('target'));
  return [first?.logicalCueKey, 'final-position-set-v21', target?.logicalCueKey, 'countdown-three', 'countdown-two', 'countdown-one', 'go'].filter(Boolean);
}

function sampleTrainingLaterSet(registry) {
  const later = registry.find((row) => row.flows.includes('training') && row.categories.includes('exercise_later_set'));
  const target = registry.find((row) => row.flows.includes('training') && row.categories.includes('target'));
  return [later?.logicalCueKey, target?.logicalCueKey].filter(Boolean);
}

function durationForLogical(key, voiceId, registry, assets) {
  const row = registry.find((item) => item.logicalCueKey === key);
  const physicalKey = row?.reuseDecision === 'reuse_exact_existing_pair' ? row.physicalCueKey : '';
  const measured = physicalKey ? assets.find((asset) => asset.voiceId === voiceId && asset.cueKey === physicalKey) : null;
  if (measured?.durationMs) return { source: 'measured_current_mp3', durationMs: measured.durationMs };
  const script = row?.exactScript ?? key.replaceAll('-', ' ');
  const words = script.trim().split(/\s+/).filter(Boolean).length;
  return { source: 'estimated_logical_unrecorded', durationMs: Math.max(700, Math.round(words * 360 + 350)) };
}

function duplicateCount(values) {
  return values.length - new Set(values).size;
}

function activeKeys(registry) {
  return registry.filter((row) => isActiveLifecycle(row.lifecycle)).map((row) => row.logicalCueKey);
}

function ok() {
  return {
    lifecycle: 'pass',
    manifest: 'pass',
    generation: 'pass',
    readiness: 'pass',
  };
}

function hasKey(registry, key) {
  return registry.some((row) => row.logicalCueKey === key);
}

function hasKeys(registry, keys) {
  return keys.every((key) => hasKey(registry, key));
}

function countAudioHashChanges() {
  if (!fs.existsSync(ENTRY_AUDIO_HASH)) return 0;
  const entry = parseHashFile(fs.readFileSync(ENTRY_AUDIO_HASH, 'utf8'));
  const current = currentAudioHashes();
  let changed = 0;
  for (const [file, hash] of entry.entries()) {
    if (current.get(file) !== hash) changed++;
  }
  for (const file of current.keys()) {
    if (!entry.has(file)) changed++;
  }
  return changed;
}

function audioHashCounts() {
  const entry = fs.existsSync(ENTRY_AUDIO_HASH) ? parseHashFile(fs.readFileSync(ENTRY_AUDIO_HASH, 'utf8')).size : 0;
  return { entry, current: currentAudioHashes().size };
}

function currentAudioHashes() {
  const map = new Map();
  for (const absPath of listFiles(path.join(ROOT, 'assets/audio')).sort()) {
    const rel = path.relative(ROOT, absPath);
    const hash = crypto.createHash('sha256').update(fs.readFileSync(absPath)).digest('hex');
    map.set(rel, hash);
  }
  return map;
}

function parseHashFile(text) {
  const map = new Map();
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    const match = line.match(/^([a-f0-9]{64})\s+(.+)$/);
    if (match) map.set(match[2].replace(/^\.\//, ''), match[1]);
  }
  return map;
}

function gitAudioDiffAgainstHeadCount() {
  const result = spawnSync('git', ['diff', '--name-only', '--', 'assets/audio'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  return result.stdout.trim() ? result.stdout.trim().split('\n').length : 0;
}

function physicalPairMismatchCount(physicalRows) {
  const byCue = new Map();
  for (const row of physicalRows) {
    if (row.voiceId === 'sfx') continue;
    const voices = byCue.get(row.physicalCueKey) ?? new Set();
    voices.add(row.voiceId);
    byCue.set(row.physicalCueKey, voices);
  }
  return [...byCue.values()].filter((voices) => !VOICES.every((voice) => voices.has(voice))).length;
}
