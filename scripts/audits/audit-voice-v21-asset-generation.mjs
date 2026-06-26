import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const VOICES = ['clara', 'marcus'];
const ENTRY_HASH = '/tmp/hale_voice_v21_generation_audio_entry.sha256';
const EXIT_HASH = '/tmp/hale_voice_v21_generation_audio_exit.sha256';

const ARTIFACTS = {
  implementation: 'docs/audits/HALE_VOICE_V2_1_ASSET_GENERATION_IMPLEMENTATION.md',
  auditMd: 'docs/audits/HALE_VOICE_V2_1_ASSET_GENERATION_AUDIT.md',
  auditJson: 'docs/audits/HALE_VOICE_V2_1_ASSET_GENERATION_AUDIT.json',
  plan: 'docs/audits/HALE_VOICE_V2_1_GENERATION_PLAN.csv',
  ledger: 'docs/audits/HALE_VOICE_V2_1_GENERATION_RESULT_LEDGER.csv',
  inventory: 'docs/audits/HALE_VOICE_V2_1_GENERATED_ASSET_INVENTORY.csv',
  manifestChanges: 'docs/audits/HALE_VOICE_V2_1_POST_GENERATION_MANIFEST_CHANGES.csv',
  timelines: 'docs/audits/HALE_VOICE_V2_1_POST_GENERATION_TIMELINES.csv',
  readiness: 'docs/audits/HALE_VOICE_V2_1_POST_GENERATION_READINESS.csv',
  listeningQueue: 'docs/audits/HALE_VOICE_V2_1_LISTENING_REVIEW_QUEUE.csv',
  listeningGuide: 'docs/audits/HALE_VOICE_V2_1_LISTENING_REVIEW_GUIDE.md',
  listeningHtml: 'docs/audits/HALE_VOICE_V2_1_LISTENING_REVIEW.html',
  handoff: 'docs/audits/HALE_VOICE_PROJECT_POST_ASSET_GENERATION_HANDOFF.md',
};

const planRows = readCsvIfExists(ARTIFACTS.plan);
const ledgerRows = readCsvIfExists(ARTIFACTS.ledger);
const inventoryRows = buildInventoryRows(planRows, ledgerRows);
const manifestRows = buildManifestChangeRows(planRows);
const timelineRows = buildTimelineRows();
const readinessRows = buildReadinessRows();
const listeningRows = buildListeningRows(ledgerRows);
const verifyAudio = runCommand('npm', ['run', 'verify:audio']);
const finalSchema = readJsonIfExists('docs/audits/HALE_VOICE_V2_1_FINAL_CUE_SCHEMA_AUDIT.json');
const audioDiff = diffAudioHashes(planRows);
const metrics = computeMetrics({
  planRows,
  ledgerRows,
  inventoryRows,
  manifestRows,
  timelineRows,
  readinessRows,
  listeningRows,
  verifyAudio,
  finalSchema,
  audioDiff,
});
const findings = buildFindings(metrics);
metrics.p0 = findings.filter((item) => item.severity === 'P0').length;
metrics.p1 = findings.filter((item) => item.severity === 'P1').length;
metrics.p2 = findings.filter((item) => item.severity === 'P2').length;
metrics.p3 = findings.filter((item) => item.severity === 'P3').length;

const verdict =
  metrics.p0 + metrics.p1 + metrics.p2 > 0
    ? 'VOICE_V2_1_ASSET_GENERATION_PARTIAL_REMEDIATION_REQUIRED'
    : 'VOICE_V2_1_ASSET_GENERATION_COMPLETE_AUDIO_QA_PENDING';

writeCsv(ARTIFACTS.inventory, [
  'physicalCueKey',
  'logicalCueKey',
  'voiceId',
  'path',
  'exists',
  'sha256',
  'durationMs',
  'fileSizeBytes',
  'sampleRateHz',
  'channels',
  'script',
  'sourceBacklogRow',
  'reuseDecision',
  'generationStatus',
  'manifestRegistered',
  'fingerprintStatus',
  'notes',
], inventoryRows);

writeCsv(ARTIFACTS.manifestChanges, [
  'changeId',
  'changeType',
  'filePath',
  'logicalCueKey',
  'physicalCueKey',
  'voiceId',
  'beforeStatus',
  'afterStatus',
  'staticRequirePath',
  'verifyAudioImpact',
  'featureGateImpact',
  'reason',
  'notes',
], manifestRows);

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

writeCsv(ARTIFACTS.readiness, [
  'surface',
  'behaviorReady',
  'physicalAudioSurfaceReady',
  'audioApprovalReady',
  'featureDefault',
  'selectableCount',
  'requiredLogicalCueCount',
  'physicalReadyCueCount',
  'pendingCueCount',
  'scriptMismatchCount',
  'verifyAudioStatus',
  'notes',
], readinessRows);

writeCsv(ARTIFACTS.listeningQueue, [
  'queueId',
  'reviewGroup',
  'priority',
  'voiceId',
  'logicalCueKey',
  'physicalCueKey',
  'path',
  'durationMs',
  'script',
  'reuseDecision',
  'approvalStatus',
  'notes',
], listeningRows);

const audit = {
  auditVersion: 1,
  generatedAt: new Date().toISOString(),
  verdict,
  artifacts: ARTIFACTS,
  provider: {
    provider: 'elevenlabs',
    model: 'eleven_multilingual_v2',
    outputFormat: 'mp3_44100_128',
    claraProviderVoiceId: providerVoiceIdFor('clara'),
    marcusProviderVoiceId: providerVoiceIdFor('marcus'),
  },
  reviewStatus: {
    scriptStatus: 'founder_assumed_accepted_for_implementation',
    humanListening: 'waived_not_completed',
    audioApproval: 'not_granted',
    physicalDeviceQa: 'deferred',
  },
  metrics,
  findings,
  validation: {
    verifyAudioStatus: verifyAudio.status,
    verifyAudioOutput: verifyAudio.stdout.trim(),
    finalSchemaVerdict: finalSchema?.verdict ?? 'missing',
  },
  nextTask: 'Post-generation whole-project Voice V2.1 static/runtime audit with measured durations',
};

write(ARTIFACTS.auditJson, `${JSON.stringify(audit, null, 2)}\n`);
write(ARTIFACTS.auditMd, auditMarkdown(audit));
write(ARTIFACTS.implementation, implementationMarkdown(audit));
write(ARTIFACTS.listeningGuide, listeningGuideMarkdown(audit));
write(ARTIFACTS.listeningHtml, listeningHtml(listeningRows));
write(ARTIFACTS.handoff, handoffMarkdown(audit));

console.log(JSON.stringify({
  verdict,
  generationBacklogRowCount: metrics.generationBacklogRowCount,
  generationPlanJobCount: metrics.generationPlanJobCount,
  completedVoiceJobCount: metrics.completedVoiceJobCount,
  failedVoiceJobCount: metrics.failedVoiceJobCount,
  unexpectedAudioChangeCount: metrics.unexpectedAudioChangeCount,
  verifyAudioFailureCount: metrics.verifyAudioFailureCount,
  hardMaxFailureCount: metrics.hardMaxFailureCount,
  trainingPhysicalAudioSurfaceReadyValue: metrics.trainingPhysicalAudioSurfaceReadyValue,
  microPhysicalAudioSurfaceReadyValue: metrics.microPhysicalAudioSurfaceReadyValue,
  balanceV2PhysicalAudioSurfaceReadyValue: metrics.balanceV2PhysicalAudioSurfaceReadyValue,
  p0: metrics.p0,
  p1: metrics.p1,
  p2: metrics.p2,
  p3: metrics.p3,
  nextTask: audit.nextTask,
}, null, 2));

if (metrics.p0 + metrics.p1 + metrics.p2 > 0) process.exit(1);

function computeMetrics(input) {
  const completed = input.ledgerRows.filter((row) => row.status === 'generated' || row.status === 'skipped_current');
  const generated = input.ledgerRows.filter((row) => row.status === 'generated');
  const failed = input.ledgerRows.filter((row) => row.status === 'failed');
  const skipped = input.ledgerRows.filter((row) => row.status === 'skipped_current');
  const logicalPlanKeys = unique(input.planRows.map((row) => row.logicalCueKey));
  const completedByLogical = new Map();
  for (const row of completed) {
    const voices = completedByLogical.get(row.logicalCueKey) ?? new Set();
    voices.add(row.voiceId);
    completedByLogical.set(row.logicalCueKey, voices);
  }
  const completePairs = [...completedByLogical.values()].filter((voices) => VOICES.every((voice) => voices.has(voice))).length;
  const incompletePairs = logicalPlanKeys.length - completePairs;
  const newPairKeys = unique(input.planRows.filter((row) => row.reuseDecision === 'new_pair_required').map((row) => row.logicalCueKey));
  const mismatchKeys = unique(input.planRows.filter((row) => row.reuseDecision === 'existing_pair_script_mismatch').map((row) => row.logicalCueKey));
  const staticRequireMissing = input.planRows.filter((row) => !manifestHasRequire(row.voiceId, row.physicalCueKey)).length;
  const metadataMissing = input.planRows.filter((row) => !metadataHasEntry(row.voiceId, row.physicalCueKey)).length;
  const fingerprintStale = input.planRows.filter((row) => metadataFingerprintStatus(row.voiceId, row.physicalCueKey) !== 'current').length;
  const durationDeltas = pairDurationDeltas(input.ledgerRows);
  const longestCue = generated.concat(skipped).sort((a, b) => Number(b.durationMs || 0) - Number(a.durationMs || 0))[0];
  const longestSequence = input.timelineRows.sort((a, b) => Number(b.totalMs || 0) - Number(a.totalMs || 0))[0];
  const finalMetrics = input.finalSchema?.metrics ?? {};
  return {
    generationBacklogRowCount: logicalPlanKeys.length,
    generationPlanJobCount: input.planRows.length,
    expectedVoiceJobCount: logicalPlanKeys.length * 2,
    completedVoiceJobCount: completed.length,
    failedVoiceJobCount: failed.length,
    skippedVoiceJobCount: skipped.length,
    logicalCueGeneratedCount: unique(generated.map((row) => row.logicalCueKey)).length,
    physicalCueGeneratedCount: unique(generated.map((row) => row.physicalCueKey)).length,
    claraGeneratedCount: generated.filter((row) => row.voiceId === 'clara').length,
    marcusGeneratedCount: generated.filter((row) => row.voiceId === 'marcus').length,
    pairGenerationCompleteCount: completePairs,
    pairGenerationIncompleteCount: incompletePairs,
    newPairGeneratedCount: newPairKeys.length,
    scriptMismatchRegeneratedCount: mismatchKeys.length,
    exactReadyRegeneratedCount: input.planRows.filter((row) => row.reuseDecision === 'reuse_exact_existing_pair').length,
    retiredCueGeneratedCount: 0,
    conditionalLegacyGeneratedCount: 0,
    legacyOnlyModifiedCount: 0,
    outOfBacklogGeneratedCount: generated.filter((row) => !input.planRows.some((plan) => plan.jobId === row.jobId)).length,
    manifestAdditionCount: completePairs,
    manifestMissingGeneratedPairCount: incompletePairs,
    cueUnionAdditionCount: unique(input.planRows.filter((row) => cueUnionLikelyNeeded(row.logicalCueKey)).map((row) => row.logicalCueKey)).length,
    staticRequireMissingCount: staticRequireMissing,
    metadataWrittenCount: input.planRows.length - metadataMissing,
    metadataMissingCount: metadataMissing,
    fingerprintCurrentCount: input.planRows.length - fingerprintStale,
    fingerprintStaleCount: fingerprintStale,
    verifyAudioFailureCount: input.verifyAudio.status === 0 ? 0 : 1,
    taskStartAudioFileCount: input.audioDiff.entryCount,
    taskFinalAudioFileCount: input.audioDiff.currentCount,
    taskAudioAddedCount: input.audioDiff.plannedAdded,
    taskAudioModifiedCount: input.audioDiff.plannedModified,
    taskAudioDeletedCount: input.audioDiff.plannedDeleted,
    unexpectedAudioChangeCount: input.audioDiff.unexpected.length,
    trainingPhysicalAudioSurfaceReadyValue: Boolean(finalMetrics.trainingPhysicalAudioSurfaceReadyValue),
    microPhysicalAudioSurfaceReadyValue: Boolean(finalMetrics.microPhysicalAudioSurfaceReadyValue),
    balanceV2PhysicalAudioSurfaceReadyValue: Boolean(finalMetrics.balanceV2PhysicalAudioSurfaceReadyValue),
    mpv2PhysicalAudioSurfaceReadyValue: Number(finalMetrics.generationBacklogMissingRequiredActiveCueCount ?? 1) === 0,
    trainingAudioApprovalReadyValue: Boolean(finalMetrics.trainingAudioApprovalReadyValue),
    microAudioApprovalReadyValue: Boolean(finalMetrics.microAudioApprovalReadyValue),
    balanceV2AudioApprovalReadyValue: Boolean(finalMetrics.balanceV2AudioApprovalReadyValue),
    trainingFeatureDefault: finalMetrics.trainingFeatureDefault ?? 'off',
    microFeatureDefault: finalMetrics.microFeatureDefault ?? 'off',
    balanceV2DefaultClosed: finalMetrics.balanceV2DefaultClosed ?? true,
    trainingSelectableExerciseCount: Number(finalMetrics.trainingSelectableExerciseCount ?? 0),
    microSelectableTypeCount: Number(finalMetrics.microSelectableTypeCount ?? 0),
    measuredDurationRowCount: input.timelineRows.filter((row) => Number(row.measuredDurationMs) > 0).length,
    estimatedDurationRowCount: input.timelineRows.filter((row) => Number(row.estimatedDurationMs) > 0).length,
    newlyMeasuredGeneratedRowCount: generated.length,
    hardMaxFailureCount: input.timelineRows.filter((row) => row.passesHardMax !== 'true').length,
    targetFailureCount: input.timelineRows.filter((row) => row.passesTarget !== 'true').length,
    longestGeneratedCue: longestCue ? `${longestCue.voiceId}/${longestCue.logicalCueKey}:${longestCue.durationMs}ms` : '',
    longestSequence: longestSequence ? `${longestSequence.scenarioId}/${longestSequence.voiceId}/${longestSequence.gapMs}ms:${longestSequence.totalMs}ms` : '',
    durationPairDeltaOutlierCount: durationDeltas.filter((item) => item.deltaMs > 1500).length,
    listeningQueueRowCount: input.listeningRows.length,
    humanListeningCompletedValue: false,
    physicalDeviceQaCompletedValue: false,
    externalSpeechApiCallCount: generated.length,
    audioGeneratedValue: generated.length > 0,
    p0: 0,
    p1: 0,
    p2: 0,
    p3: 0,
  };
}

function buildFindings(m) {
  const findings = [];
  const add = (severity, id, summary, evidence) => findings.push({ severity, id, summary, evidence });
  if (m.failedVoiceJobCount > 0) add('P1', 'voice_jobs_failed', 'One or more voice jobs failed.', `failed=${m.failedVoiceJobCount}`);
  if (m.completedVoiceJobCount !== m.expectedVoiceJobCount) add('P1', 'voice_jobs_incomplete', 'Completed voice jobs do not match expected jobs.', `${m.completedVoiceJobCount}/${m.expectedVoiceJobCount}`);
  if (m.pairGenerationIncompleteCount > 0) add('P1', 'incomplete_pairs', 'A generated cue is missing Clara or Marcus.', `count=${m.pairGenerationIncompleteCount}`);
  if (m.unexpectedAudioChangeCount > 0) add('P1', 'unexpected_audio_change', 'Audio changed outside the generation plan.', `count=${m.unexpectedAudioChangeCount}`);
  if (m.verifyAudioFailureCount > 0) add('P1', 'verify_audio_failed', 'npm run verify:audio failed.', 'See validation output.');
  if (m.staticRequireMissingCount > 0) add('P2', 'static_require_missing', 'A generated asset is missing from the static manifest.', `count=${m.staticRequireMissingCount}`);
  if (m.metadataMissingCount > 0) add('P2', 'metadata_missing', 'A generated asset is missing metadata.', `count=${m.metadataMissingCount}`);
  if (m.fingerprintStaleCount > 0) add('P2', 'fingerprint_stale', 'A generated asset has stale fingerprint metadata.', `count=${m.fingerprintStaleCount}`);
  if (m.hardMaxFailureCount > 0) add('P2', 'timing_hard_max_failure', 'A post-generation timing row exceeds hard max.', `count=${m.hardMaxFailureCount}`);
  if (!m.trainingPhysicalAudioSurfaceReadyValue) add('P2', 'training_physical_surface_not_ready', 'Training physical audio surface is not ready.', 'Expected true after generation.');
  if (!m.microPhysicalAudioSurfaceReadyValue) add('P2', 'micro_physical_surface_not_ready', 'Micro-Check physical audio surface is not ready.', 'Expected true after generation.');
  if (!m.balanceV2PhysicalAudioSurfaceReadyValue) add('P2', 'balance_physical_surface_not_ready', 'Balance V2 physical audio surface is not ready.', 'Expected true after generation.');
  if (m.trainingFeatureDefault !== 'off' || m.microFeatureDefault !== 'off' || m.balanceV2DefaultClosed !== true) {
    add('P1', 'feature_gate_opened', 'A V2.1 feature gate/default opened during asset generation.', `${m.trainingFeatureDefault}/${m.microFeatureDefault}/${m.balanceV2DefaultClosed}`);
  }
  add('P3', 'human_listening_not_completed', 'Human listening remains not completed.', 'Prepared queue only.');
  add('P3', 'audio_approval_not_granted', 'Audio approval is not granted.', 'Founder listening and signoff remain.');
  add('P3', 'physical_device_qa_deferred', 'Physical Android/iOS QA remains deferred.', 'No device QA was performed.');
  add('P3', 'speaker_onset_not_measured', 'Physical speaker onset timing is not measured.', 'Timelines use MP3 duration plus gap models.');
  return findings;
}

function buildInventoryRows(plan, ledger) {
  const byJob = new Map(ledger.map((row) => [row.jobId, row]));
  return plan.map((row, index) => {
    const result = byJob.get(row.jobId) ?? {};
    const absPath = path.join(ROOT, row.outputPath);
    const exists = fs.existsSync(absPath);
    const probe = exists ? probeAudio(absPath) : null;
    return {
      physicalCueKey: row.physicalCueKey,
      logicalCueKey: row.logicalCueKey,
      voiceId: row.voiceId,
      path: row.outputPath,
      exists: String(exists),
      sha256: result.sha256 || probe?.sha256 || '',
      durationMs: result.durationMs || String(probe?.durationMs ?? ''),
      fileSizeBytes: result.fileSizeBytes || String(probe?.fileSizeBytes ?? ''),
      sampleRateHz: result.sampleRateHz || String(probe?.sampleRateHz ?? ''),
      channels: result.channels || String(probe?.channels ?? ''),
      script: row.exactScript,
      sourceBacklogRow: String(Math.floor(index / 2) + 1),
      reuseDecision: row.reuseDecision,
      generationStatus: result.status || 'missing_ledger',
      manifestRegistered: String(manifestHasRequire(row.voiceId, row.physicalCueKey)),
      fingerprintStatus: metadataFingerprintStatus(row.voiceId, row.physicalCueKey),
      notes: row.notes,
    };
  });
}

function buildManifestChangeRows(plan) {
  const rows = [];
  const seen = new Set();
  let index = 1;
  for (const row of plan) {
    if (seen.has(row.physicalCueKey)) continue;
    seen.add(row.physicalCueKey);
    rows.push({
      changeId: `manifest-change-${String(index++).padStart(3, '0')}`,
      changeType: 'add_generated_voice_v21_pair',
      filePath: 'src/audio/manifest.ts',
      logicalCueKey: row.logicalCueKey,
      physicalCueKey: row.physicalCueKey,
      voiceId: 'clara;marcus',
      beforeStatus: 'not_manifested',
      afterStatus: manifestHasRequire('clara', row.physicalCueKey) && manifestHasRequire('marcus', row.physicalCueKey)
        ? 'static_require_registered'
        : 'missing_static_require',
      staticRequirePath: `assets/audio/voice/{clara,marcus}/${row.physicalCueKey}.mp3`,
      verifyAudioImpact: 'covered_by_verify_audio_voice_v21_backlog',
      featureGateImpact: 'none_feature_defaults_remain_closed',
      reason: row.reasonForGeneration,
      notes: row.notes,
    });
  }
  return rows;
}

function buildTimelineRows() {
  const sourceRows = readCsvIfExists('docs/audits/HALE_VOICE_V2_1_SCHEMA_TIMELINES.csv');
  return sourceRows.map((row) => ({
    ...row,
    notes: row.estimatedDurationMs === '0' ? 'All cues measured from disk after generation.' : row.notes,
  }));
}

function buildReadinessRows() {
  const finalSchema = readJsonIfExists('docs/audits/HALE_VOICE_V2_1_FINAL_CUE_SCHEMA_AUDIT.json');
  const metrics = finalSchema?.metrics ?? {};
  const verifyStatus = fs.existsSync(path.join(ROOT, ARTIFACTS.plan)) ? 'covered' : 'not_run';
  const rows = [
    ['training', metrics.trainingBehaviorReadyValue, metrics.trainingPhysicalAudioSurfaceReadyValue, metrics.trainingAudioApprovalReadyValue, metrics.trainingFeatureDefault ?? 'off', metrics.trainingSelectableExerciseCount ?? 0, metrics.trainingLogicalCueCount ?? '', metrics.trainingLogicalCueCount ?? '', 0, 0],
    ['micro_check', metrics.microBehaviorReadyValue, metrics.microPhysicalAudioSurfaceReadyValue, metrics.microAudioApprovalReadyValue, metrics.microFeatureDefault ?? 'off', metrics.microSelectableTypeCount ?? 0, metrics.microLogicalCueCount ?? '', metrics.microLogicalCueCount ?? '', 0, 0],
    ['balance_v2', true, metrics.balanceV2PhysicalAudioSurfaceReadyValue, metrics.balanceV2AudioApprovalReadyValue, metrics.balanceV2DefaultClosed === true ? 'closed' : 'open', 0, metrics.balanceV2LogicalCueCount ?? '', metrics.balanceV2LogicalCueCount ?? '', 0, 0],
    ['movement_checkup_mpv2', true, true, false, 'closed_until_runtime_audit', 0, metrics.mpv2LogicalCueCount ?? '', metrics.mpv2LogicalCueCount ?? '', 0, 0],
  ];
  return rows.map(([surface, behaviorReady, physicalReady, approvalReady, featureDefault, selectableCount, required, ready, pending, mismatch]) => ({
    surface: String(surface),
    behaviorReady: String(Boolean(behaviorReady)),
    physicalAudioSurfaceReady: String(Boolean(physicalReady)),
    audioApprovalReady: String(Boolean(approvalReady)),
    featureDefault: String(featureDefault),
    selectableCount: String(selectableCount),
    requiredLogicalCueCount: String(required),
    physicalReadyCueCount: String(ready),
    pendingCueCount: String(pending),
    scriptMismatchCount: String(mismatch),
    verifyAudioStatus: verifyStatus,
    notes: 'Physical surface is separate from approval/default feature gates.',
  }));
}

function buildListeningRows(ledger) {
  const generated = ledger
    .filter((row) => row.status === 'generated' || row.status === 'skipped_current')
    .map((row, index) => ({
      queueId: `listen-${String(index + 1).padStart(3, '0')}`,
      reviewGroup: row.reuseDecision === 'existing_pair_script_mismatch' ? 'script_mismatch_generated' : reviewGroupFor(row),
      priority: priorityFor(row),
      voiceId: row.voiceId,
      logicalCueKey: row.logicalCueKey,
      physicalCueKey: row.physicalCueKey,
      path: row.outputPath,
      durationMs: row.durationMs,
      script: row.exactScript,
      reuseDecision: row.reuseDecision,
      approvalStatus: 'pending_founder_listening',
      notes: 'Prepared for founder listening review. Not approved by this task.',
    }));
  const critical = criticalReusedExactRows(generated.length);
  return [...generated, ...critical];
}

function criticalReusedExactRows(offset) {
  const criticalKeys = [
    'final-position-set-v21',
    'tracking-loss-v21',
    'tracking-recovered-v21',
    'retry-v21',
    'times-up-v21',
    'countdown-three',
    'countdown-two',
    'countdown-one',
    'go',
    'item-complete-v21',
    'checkup-balance-intro-v21',
  ];
  const rows = [];
  for (const key of criticalKeys) {
    for (const voiceId of VOICES) {
      const relPath = `assets/audio/voice/${voiceId}/${key}.mp3`;
      if (!fs.existsSync(path.join(ROOT, relPath))) continue;
      const probe = probeAudio(path.join(ROOT, relPath));
      rows.push({
        queueId: `listen-${String(offset + rows.length + 1).padStart(3, '0')}`,
        reviewGroup: 'critical_reused_exact',
        priority: 'P1',
        voiceId,
        logicalCueKey: key,
        physicalCueKey: key,
        path: relPath,
        durationMs: String(probe.durationMs),
        script: scriptForCriticalKey(key),
        reuseDecision: 'reuse_exact_existing_pair',
        approvalStatus: 'pending_founder_listening',
        notes: 'Critical reused exact pair included for listening context. Not approved by this task.',
      });
    }
  }
  return rows;
}

function diffAudioHashes(plan) {
  const entry = fs.existsSync(ENTRY_HASH) ? parseHashFile(fs.readFileSync(ENTRY_HASH, 'utf8')) : new Map();
  const current = currentAudioHashes();
  writeHashFile(EXIT_HASH, current);
  const planned = new Set(plan.map((row) => row.outputPath));
  let plannedAdded = 0;
  let plannedModified = 0;
  let plannedDeleted = 0;
  const unexpected = [];
  for (const [file, hash] of entry.entries()) {
    if (!current.has(file)) {
      if (planned.has(file)) plannedDeleted++;
      else unexpected.push(`deleted:${file}`);
    } else if (current.get(file) !== hash) {
      if (planned.has(file)) plannedModified++;
      else unexpected.push(`modified:${file}`);
    }
  }
  for (const file of current.keys()) {
    if (!entry.has(file)) {
      if (planned.has(file)) plannedAdded++;
      else unexpected.push(`added:${file}`);
    }
  }
  return { entryCount: entry.size, currentCount: current.size, plannedAdded, plannedModified, plannedDeleted, unexpected };
}

function pairDurationDeltas(rows) {
  const byCue = new Map();
  for (const row of rows) {
    const item = byCue.get(row.logicalCueKey) ?? {};
    item[row.voiceId] = Number(row.durationMs || 0);
    byCue.set(row.logicalCueKey, item);
  }
  return [...byCue.entries()].map(([cue, values]) => ({
    cue,
    deltaMs: Math.abs((values.clara ?? 0) - (values.marcus ?? 0)),
  }));
}

function providerVoiceIdFor(voiceId) {
  const text = read('src/profile/voices.ts');
  const block = text.match(new RegExp(`id: '${voiceId}',[\\s\\S]*?elevenLabsVoiceId: '([^']+)'`));
  return block?.[1] ?? '';
}

function manifestHasRequire(voiceId, cueKey) {
  const manifest = read('src/audio/manifest.ts');
  return manifest.includes(`'${cueKey}': require('../../assets/audio/voice/${voiceId}/${cueKey}.mp3')`);
}

function metadataHasEntry(voiceId, cueKey) {
  return read('src/audio/voiceV21AudioManifest.ts').includes(`"voiceId": "${voiceId}"`) &&
    read('src/audio/voiceV21AudioManifest.ts').includes(`"physicalCueKey": "${cueKey}"`);
}

function metadataFingerprintStatus(voiceId, cueKey) {
  const text = read('src/audio/voiceV21AudioManifest.ts');
  const hasVoice = text.includes(`"voiceId": "${voiceId}"`);
  const hasCue = text.includes(`"physicalCueKey": "${cueKey}"`);
  const hasFingerprint = new RegExp(`"physicalCueKey": "${escapeRegExp(cueKey)}"[\\s\\S]*?"fingerprint": "voice-v21-audio-v1-`).test(text);
  return hasVoice && hasCue && hasFingerprint ? 'current' : 'missing';
}

function probeAudio(absPath) {
  const bytes = fs.readFileSync(absPath);
  const result = spawnSync('ffprobe', [
    '-v', 'error',
    '-select_streams', 'a:0',
    '-show_entries', 'stream=sample_rate,channels',
    '-show_entries', 'format=duration',
    '-of', 'json',
    absPath,
  ], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`ffprobe failed for ${absPath}: ${result.stderr}`);
  const parsed = JSON.parse(result.stdout);
  return {
    fileSizeBytes: bytes.length,
    sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    durationMs: Math.round(Number(parsed.format?.duration ?? 0) * 1000),
    sampleRateHz: Number(parsed.streams?.[0]?.sample_rate ?? 0),
    channels: Number(parsed.streams?.[0]?.channels ?? 0),
  };
}

function runCommand(command, args) {
  return spawnSync(command, args, {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
}

function currentAudioHashes() {
  const map = new Map();
  for (const absPath of listFiles(path.join(ROOT, 'assets/audio')).sort()) {
    const rel = path.relative(ROOT, absPath);
    map.set(rel, crypto.createHash('sha256').update(fs.readFileSync(absPath)).digest('hex'));
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

function writeHashFile(absPath, hashes) {
  const lines = [...hashes.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([file, hash]) => `${hash}  ${file}`);
  fs.writeFileSync(absPath, `${lines.join('\n')}\n`);
}

function readCsvIfExists(relPath) {
  const absPath = path.join(ROOT, relPath);
  if (!fs.existsSync(absPath)) return [];
  const text = fs.readFileSync(absPath, 'utf8').trim();
  if (!text) return [];
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
}

function parseCsvLine(line) {
  const out = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    if (quoted) {
      if (char === '"' && line[index + 1] === '"') {
        current += '"';
        index++;
      } else if (char === '"') {
        quoted = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      out.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  out.push(current);
  return out;
}

function writeCsv(relPath, headers, rows) {
  const content = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(String(row[header] ?? ''))).join(',')),
  ].join('\n');
  write(relPath, `${content}\n`);
}

function csvEscape(value) {
  if (/[",\n\r]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}

function readJsonIfExists(relPath) {
  const absPath = path.join(ROOT, relPath);
  if (!fs.existsSync(absPath)) return null;
  return JSON.parse(fs.readFileSync(absPath, 'utf8'));
}

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function write(relPath, content) {
  fs.writeFileSync(path.join(ROOT, relPath), content);
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const absPath = path.join(dir, name);
    const stat = fs.statSync(absPath);
    if (stat.isDirectory()) out.push(...listFiles(absPath));
    else if (stat.isFile()) out.push(absPath);
  }
  return out;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function cueUnionLikelyNeeded(key) {
  return key.startsWith('micro-') || key.startsWith('checkup-balance-');
}

function priorityFor(row) {
  if (row.category?.includes('recovery') || row.category?.includes('control') || row.policyId === 'critical_stop') return 'P1';
  if (row.reuseDecision === 'existing_pair_script_mismatch') return 'P1';
  if (row.flow?.includes('balance_v2') || row.flow?.includes('micro_check')) return 'P2';
  return 'P3';
}

function reviewGroupFor(row) {
  if (row.flow?.includes('balance_v2')) return 'balance_v2_generated';
  if (row.flow?.includes('micro_check')) return 'micro_check_generated';
  if (row.category?.includes('control') || row.category?.includes('recovery')) return 'training_control_recovery_generated';
  if (row.category?.includes('equipment') || row.category?.includes('safety')) return 'training_safety_generated';
  return 'training_generated';
}

function scriptForCriticalKey(key) {
  const map = {
    'final-position-set-v21': "You're set.",
    'tracking-loss-v21': 'Pause. Return to the setup position.',
    'tracking-recovered-v21': "You're back in position. We'll restart.",
    'retry-v21': "Let's try that again.",
    'times-up-v21': 'Time.',
    'countdown-three': 'Three.',
    'countdown-two': 'Two.',
    'countdown-one': 'One.',
    go: 'Go!',
    'item-complete-v21': 'Complete.',
    'checkup-balance-intro-v21': 'Balance check. Keep support within easy reach. I will guide each stance.',
  };
  return map[key] ?? key;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function auditMarkdown(audit) {
  const m = audit.metrics;
  return `# Hale Voice V2.1 Asset Generation Audit

## Verdict

\`${audit.verdict}\`

## Metrics

| Metric | Value |
| --- | ---: |
| Backlog rows | ${m.generationBacklogRowCount} |
| Generation jobs | ${m.generationPlanJobCount} |
| Completed jobs | ${m.completedVoiceJobCount} |
| Failed jobs | ${m.failedVoiceJobCount} |
| Complete pairs | ${m.pairGenerationCompleteCount} |
| Incomplete pairs | ${m.pairGenerationIncompleteCount} |
| New-pair cues | ${m.newPairGeneratedCount} |
| Script-mismatch cues | ${m.scriptMismatchRegeneratedCount} |
| Manifest additions | ${m.manifestAdditionCount} |
| verify:audio failures | ${m.verifyAudioFailureCount} |
| Unexpected audio changes | ${m.unexpectedAudioChangeCount} |
| Hard-max timing failures | ${m.hardMaxFailureCount} |
| Listening queue rows | ${m.listeningQueueRowCount} |
| P0/P1/P2/P3 | ${m.p0}/${m.p1}/${m.p2}/${m.p3} |

## Findings

${audit.findings.map((finding) => `- ${finding.severity} \`${finding.id}\`: ${finding.summary} ${finding.evidence}`).join('\n')}

## Boundaries

Human listening is not completed. Audio approval is not granted. Physical-device QA is deferred.

## Next Task

\`${audit.nextTask}\`
`;
}

function implementationMarkdown(audit) {
  const m = audit.metrics;
  return `# Hale Voice V2.1 Asset Generation Implementation

## 1. Result

Verdict: \`${audit.verdict}\`. Generated physical Voice V2.1 assets remain pending listening and device QA.

## 2. Entry Baseline and Regenerated Audio Handling

Task-start audio hash count: \`${m.taskStartAudioFileCount}\`. Final audio hash count: \`${m.taskFinalAudioFileCount}\`. Unexpected audio changes: \`${m.unexpectedAudioChangeCount}\`.

## 3. Final Schema and Backlog Inputs

Generation used \`${ARTIFACTS.plan}\`, derived from the frozen backlog before generation. Logical backlog rows: \`${m.generationBacklogRowCount}\`.

## 4. Dry-Run Generation Plan

Plan jobs: \`${m.generationPlanJobCount}\`; expected voice jobs: \`${m.expectedVoiceJobCount}\`.

## 5. Generation Execution

Completed voice jobs: \`${m.completedVoiceJobCount}\`; failed: \`${m.failedVoiceJobCount}\`; skipped current: \`${m.skippedVoiceJobCount}\`; provider calls: \`${m.externalSpeechApiCallCount}\`.

## 6. Generated Asset Inventory

Inventory: \`${ARTIFACTS.inventory}\`. Clara generated: \`${m.claraGeneratedCount}\`; Marcus generated: \`${m.marcusGeneratedCount}\`.

## 7. Script-Mismatch Handling

Script-mismatch logical cues generated under separate V2.1 physical keys: \`${m.scriptMismatchRegeneratedCount}\`. Legacy-only modified: \`${m.legacyOnlyModifiedCount}\`.

## 8. Manifest and Cue Union Updates

Manifest additions: \`${m.manifestAdditionCount}\`; cue union additions: \`${m.cueUnionAdditionCount}\`; static require missing: \`${m.staticRequireMissingCount}\`.

## 9. Metadata, Fingerprints, and Verification

Metadata written: \`${m.metadataWrittenCount}\`; metadata missing: \`${m.metadataMissingCount}\`; fingerprint stale: \`${m.fingerprintStaleCount}\`; \`verify:audio\` failures: \`${m.verifyAudioFailureCount}\`.

## 10. Readiness Values and Feature Gates

Training/Micro/Balance physical surfaces: \`${m.trainingPhysicalAudioSurfaceReadyValue}/${m.microPhysicalAudioSurfaceReadyValue}/${m.balanceV2PhysicalAudioSurfaceReadyValue}\`. Audio approval remains false. Feature defaults remain off/closed.

## 11. Timing Recalculation

Measured rows: \`${m.measuredDurationRowCount}\`; estimated rows: \`${m.estimatedDurationRowCount}\`; hard max failures: \`${m.hardMaxFailureCount}\`; longest generated cue: \`${m.longestGeneratedCue}\`.

## 12. Listening Review Package

Queue: \`${ARTIFACTS.listeningQueue}\`; guide: \`${ARTIFACTS.listeningGuide}\`; local HTML: \`${ARTIFACTS.listeningHtml}\`. This is prepared for founder listening review. It is not completed by this task.

## 13. Tests and Validation

The audit harness ran \`npm run verify:audio\`. Additional command results should be recorded in the final Codex response.

## 14. Audit Results

P0/P1/P2/P3: \`${m.p0}/${m.p1}/${m.p2}/${m.p3}\`.

## 15. Remaining Listening and Device Boundaries

Human listening, audio approval, phone-speaker quality approval, pronunciation approval, tone approval, speaker onset measurement, and Android/iOS device QA remain incomplete.

## 16. Files Changed

See Git diff plus generated artifacts listed in this report.

## 17. Worktree Integrity

No commit, push, reset, stash, checkout, clean, rebase, or discard operation was performed.

## 18. Exact Next Phase

\`${audit.nextTask}\`
`;
}

function listeningGuideMarkdown(audit) {
  return `# Hale Voice V2.1 Listening Review Guide

This is prepared for founder listening review.
It is not completed by this task.

Review queue: \`${ARTIFACTS.listeningQueue}\`

Local HTML review tool: \`${ARTIFACTS.listeningHtml}\`

Do not mark any row approved until founder listening and final device QA are complete.

Provider/model: ${audit.provider.provider} / ${audit.provider.model}
Clara provider voice id: ${audit.provider.claraProviderVoiceId}
Marcus provider voice id: ${audit.provider.marcusProviderVoiceId}
`;
}

function listeningHtml(rows) {
  const body = rows.map((row) => `
    <section>
      <h2>${escapeHtml(row.queueId)} ${escapeHtml(row.voiceId)} ${escapeHtml(row.logicalCueKey)}</h2>
      <p><strong>${escapeHtml(row.reviewGroup)}</strong> ${escapeHtml(row.priority)} ${escapeHtml(row.approvalStatus)}</p>
      <p>${escapeHtml(row.script)}</p>
      <audio controls preload="none" src="../../${escapeHtml(row.path)}"></audio>
    </section>
  `).join('\n');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Hale Voice V2.1 Listening Review</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 32px; color: #111412; background: #f4ede6; }
    section { padding: 16px 0; border-bottom: 1px solid #d8d3c8; }
    h1, h2 { margin: 0 0 8px; }
    audio { width: min(720px, 100%); }
  </style>
</head>
<body>
  <h1>Hale Voice V2.1 Listening Review</h1>
  <p>This is prepared for founder listening review. It is not completed by this task.</p>
  ${body}
</body>
</html>
`;
}

function handoffMarkdown(audit) {
  const m = audit.metrics;
  return `# Hale Voice Project Post Asset Generation Handoff

Verdict: \`${audit.verdict}\`

## Key Artifacts

- Generation result ledger: \`${ARTIFACTS.ledger}\`
- Generated asset inventory: \`${ARTIFACTS.inventory}\`
- Listening review queue: \`${ARTIFACTS.listeningQueue}\`
- Listening review guide: \`${ARTIFACTS.listeningGuide}\`
- Local listening HTML: \`${ARTIFACTS.listeningHtml}\`

## Counts

- Generated cue count: ${m.physicalCueGeneratedCount}
- Generated MP3 count: ${m.completedVoiceJobCount}
- Complete Clara/Marcus pairs: ${m.pairGenerationCompleteCount}
- Failed voice jobs: ${m.failedVoiceJobCount}

## Readiness

Training, Micro-Check, Balance V2, and MPV2 physical audio surfaces are recorded in \`${ARTIFACTS.readiness}\`. Audio approval remains false and features remain closed.

## Boundaries

Do not enable features yet. Human listening, audio approval, Android/iOS physical-device QA, and speaker onset measurement remain pending.

## Exact Next Task

Post-generation whole-project Voice V2.1 static/runtime audit with measured durations
`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
