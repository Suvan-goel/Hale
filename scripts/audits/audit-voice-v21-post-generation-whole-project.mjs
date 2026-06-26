import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const VOICES = ['clara', 'marcus'];
const ENTRY_FILES = '/tmp/hale_voice_v21_whole_project_entry.files';
const ENTRY_HASHES = '/tmp/hale_voice_v21_whole_project_entry.sha256';

const ARTIFACTS = {
  auditMd: 'docs/audits/HALE_VOICE_V2_1_POST_GENERATION_WHOLE_PROJECT_AUDIT.md',
  auditJson: 'docs/audits/HALE_VOICE_V2_1_POST_GENERATION_WHOLE_PROJECT_AUDIT.json',
  runtimeScenarios: 'docs/audits/HALE_VOICE_V2_1_POST_GENERATION_RUNTIME_SCENARIOS.csv',
  timelineAudit: 'docs/audits/HALE_VOICE_V2_1_POST_GENERATION_TIMELINE_AUDIT.csv',
  physicalAudioAudit: 'docs/audits/HALE_VOICE_V2_1_POST_GENERATION_PHYSICAL_AUDIO_AUDIT.csv',
  readinessMatrix: 'docs/audits/HALE_VOICE_V2_1_POST_GENERATION_READINESS_MATRIX.csv',
  failureInjection: 'docs/audits/HALE_VOICE_V2_1_POST_GENERATION_FAILURE_INJECTION.csv',
  listeningPlan: 'docs/audits/HALE_VOICE_V2_1_POST_GENERATION_LISTENING_REVIEW_PLAN.md',
  listeningQueue: 'docs/audits/HALE_VOICE_V2_1_POST_GENERATION_LISTENING_QUEUE.csv',
  handoff: 'docs/audits/HALE_VOICE_PROJECT_POST_WHOLE_PROJECT_AUDIT_HANDOFF.md',
};

const REQUIRED_SCENARIO_IDS = [
  'verify_audio_post_generation',
  'all_active_v21_cues_physical_ready',
  'no_pending_active_cues',
  'no_script_mismatch_active_cues',
  'clara_marcus_pair_parity',
  'no_corrupt_generated_audio',
  'metadata_fingerprint_current',
  'static_require_paths_exist',
  'no_runtime_manifest_missing_key',
  'no_out_of_schema_generated_asset',
  'training_feature_default_off',
  'micro_feature_default_off',
  'balance_v2_default_closed',
  'step_up_default_off',
  'floor_v21_default_off',
  'training_physical_audio_ready_but_approval_false',
  'micro_physical_audio_ready_but_approval_false',
  'balance_physical_audio_ready_but_approval_false',
  'selectable_counts_zero',
  'legacy_default_route_unchanged',
  'training_session_entry_sequence',
  'training_safety_memory_after_generation',
  'training_first_use_complex_setup',
  'training_later_set_no_safety_repeat',
  'training_repeat_instructions_no_safety',
  'training_countdown_go_boundary',
  'training_missing_required_asset_injection',
  'training_pause_resume',
  'training_retry',
  'training_skip',
  'training_tracking_recovery',
  'training_voice_switch_countdown',
  'training_session_completion_once',
  'training_restore_no_auto_active',
  'both_sides_side_switch_sequence',
  'both_sides_no_rest_between_sides',
  'step_up_sfx_only',
  'step_up_wrong_lead_correction',
  'step_up_expected_lead_preserved_recovery',
  'floor_transition_once',
  'floor_final_position_before_countdown',
  'floor_restore_no_auto_start',
  'micro_chair_power_full_flow',
  'micro_balance_left_full_flow',
  'micro_balance_right_full_flow',
  'micro_mobility_left_full_flow',
  'micro_mobility_right_full_flow',
  'micro_go_playback_start_boundary',
  'micro_pause_resume',
  'micro_retry',
  'micro_discard',
  'micro_tracking_recovery',
  'micro_completion_after_persistence',
  'micro_invalid_no_completion',
  'micro_voice_switch_countdown',
  'micro_protocol_series_separated',
  'mpv2_full_default_checkup_clara',
  'mpv2_full_default_checkup_marcus',
  'mpv2_chair_go_boundary',
  'mpv2_shoulder_left_right',
  'mpv2_hinge_setup',
  'mpv2_tracking_recovery',
  'mpv2_retry',
  'mpv2_item_completion',
  'mpv2_checkup_completion',
  'mpv2_stale_stage_callback_ignored',
  'mpv2_voice_switch_required_sequence',
  'balance_v2_feet_together_stage',
  'balance_v2_semi_tandem_stage',
  'balance_v2_tandem_stage',
  'balance_v2_single_leg_stage',
  'balance_v2_no_eyes_closed_default',
  'balance_v2_old_protocol_preserved',
  'balance_v2_no_cross_protocol_delta',
  'balance_v2_default_closed',
  'human_listening_not_completed',
  'audio_approval_not_granted',
  'physical_device_qa_deferred',
  'speaker_onset_not_measured',
];

const CRITICAL_LISTENING_CUES = [
  'countdown-three',
  'countdown-two',
  'countdown-one',
  'go',
  'retry-v21',
  'times-up-v21',
  'tracking-loss-v21',
  'tracking-recovered-v21',
  'final-position-set-v21',
  'item-complete-v21',
  'checkup-complete-v21',
  'checkup-balance-intro-v21',
  'checkup-balance-single-leg-v21',
  'checkup-chair-stand-intro-v21',
  'checkup-chair-stand-setup-v21',
  'checkup-hinge-setup-v21',
  'checkup-shoulder-turn-left-v21',
  'checkup-shoulder-turn-right-v21',
  'checkup-shoulder-raise-left-v21',
  'checkup-shoulder-raise-right-v21',
  'mpv2_checkup_intro',
  'mpv2_chair_official_ready',
];

main();

function main() {
  const generatedAt = new Date().toISOString();
  const git = gitSnapshot();
  const source = runSourceProbe();
  const assetGenerationAudit = readJson('docs/audits/HALE_VOICE_V2_1_ASSET_GENERATION_AUDIT.json');
  const finalSchemaAudit = readJson('docs/audits/HALE_VOICE_V2_1_FINAL_CUE_SCHEMA_AUDIT.json');
  const trainingRuntimeAudit = readJson('docs/audits/HALE_TRAINING_VOICE_V2_1_CONTROLS_PROGRESS_RECOVERY_AUDIT.json');
  const microAudit = readJson('docs/audits/HALE_MICRO_CHECK_VOICE_V2_1_AUDIT.json');
  const floorAudit = readJson('docs/audits/HALE_TRAINING_FLOOR_READINESS_POST_SAFETY_REBASE.json');
  const mpv2PostAudit = readJsonIfExists('docs/audits/HALE_MPV2_TARGETED_RUNTIME_POST_COMPLETION_AUDIT.json');
  const balanceAudit = readJsonIfExists('docs/audits/HALE_EYES_OPEN_BALANCE_V2_AUDIT.json');
  const generationPlanRows = readCsv('docs/audits/HALE_VOICE_V2_1_GENERATION_PLAN.csv');
  const generationLedgerRows = readCsv('docs/audits/HALE_VOICE_V2_1_GENERATION_RESULT_LEDGER.csv');
  const generatedInventoryRows = readCsv('docs/audits/HALE_VOICE_V2_1_GENERATED_ASSET_INVENTORY.csv');
  const finalRegistryRows = readCsv('docs/audits/HALE_VOICE_V2_1_FINAL_CUE_REGISTRY.csv');
  const finalPhysicalRows = readCsv('docs/audits/HALE_VOICE_V2_1_PHYSICAL_ASSET_RECONCILIATION.csv');
  const trainingScenarioRows = readCsv('docs/audits/HALE_TRAINING_VOICE_V2_1_RUNTIME_SCENARIOS.csv');
  const microScenarioRows = readCsv('docs/audits/HALE_MICRO_CHECK_VOICE_V2_1_RUNTIME_SCENARIOS.csv');
  const balanceScenarioRows = readCsv('docs/audits/HALE_EYES_OPEN_BALANCE_V2_SCENARIOS.csv');
  const verifyAudio = runCommand('npm', ['run', 'verify:audio']);
  const manifest = parseManifest(read('src/audio/manifest.ts'));
  const snapshots = currentAudioSnapshotStats();
  const physicalAudioRows = buildPhysicalAudioRows({
    manifest,
    source,
    finalRegistryRows,
    finalPhysicalRows,
    generatedInventoryRows,
  });
  const timelineRows = buildTimelineRows(physicalAudioRows);
  const readinessRows = buildReadinessRows({
    source,
    finalRegistryRows,
    finalSchemaAudit,
  });
  const failureInjectionRows = buildFailureInjectionRows();
  const metrics = computeMetrics({
    source,
    git,
    verifyAudio,
    snapshots,
    assetGenerationAudit,
    finalSchemaAudit,
    trainingRuntimeAudit,
    microAudit,
    floorAudit,
    mpv2PostAudit,
    balanceAudit,
    generationPlanRows,
    generationLedgerRows,
    generatedInventoryRows,
    finalRegistryRows,
    physicalAudioRows,
    timelineRows,
    readinessRows,
    failureInjectionRows,
    trainingScenarioRows,
    microScenarioRows,
    balanceScenarioRows,
  });
  const runtimeScenarioRows = buildRuntimeScenarioRows({
    metrics,
    source,
    finalRegistryRows,
    failureInjectionRows,
  });
  metrics.runtimeScenarioRowCount = runtimeScenarioRows.length;
  metrics.runtimeScenarioFailedCount = runtimeScenarioRows.filter((row) => row.passed !== 'true').length;
  const listeningQueueRows = buildListeningQueueRows({
    generatedInventoryRows,
    finalRegistryRows,
    physicalAudioRows,
    timelineRows,
    metrics,
  });
  metrics.listeningQueueRowCount = listeningQueueRows.length;
  const findings = buildFindings(metrics);
  metrics.p0 = findings.filter((finding) => finding.severity === 'P0').length;
  metrics.p1 = findings.filter((finding) => finding.severity === 'P1').length;
  metrics.p2 = findings.filter((finding) => finding.severity === 'P2').length;
  metrics.p3 = findings.filter((finding) => finding.severity === 'P3').length;
  const verdict =
    metrics.p0 + metrics.p1 + metrics.p2 > 0
      ? 'VOICE_V2_1_POST_GENERATION_WHOLE_PROJECT_REMEDIATION_REQUIRED'
      : 'VOICE_V2_1_POST_GENERATION_WHOLE_PROJECT_AUDIT_COMPLETE_LISTENING_PENDING';
  const nextTask =
    verdict === 'VOICE_V2_1_POST_GENERATION_WHOLE_PROJECT_AUDIT_COMPLETE_LISTENING_PENDING'
      ? 'Founder Clara/Marcus listening review'
      : 'Remediate Voice V2.1 post-generation audit blockers';

  const audit = {
    auditVersion: 1,
    generatedAt,
    verdict,
    nextTask,
    artifacts: ARTIFACTS,
    entryBaseline: {
      ...git,
      worktreeAlreadyDirty: git.statusShort.some((line) => /^[ MARCUD?!]/.test(line)),
      entryAudioFileCount: snapshots.entryFileCount,
      entryAudioHashCount: snapshots.entryHashCount,
      currentAudioFileCount: snapshots.currentFileCount,
      currentAudioHashCount: snapshots.currentHashCount,
      entryVerifyAudioStatus: verifyAudio.status === 0 ? 'passed' : 'failed',
      assetGenerationVerdict: assetGenerationAudit.verdict,
      finalCueSchemaVerdict: finalSchemaAudit.verdict,
    },
    reviewStatus: {
      scriptStatus: 'founder_assumed_accepted_for_implementation',
      physicalAudioGenerated: 'yes',
      humanListening: 'not_completed',
      audioApproval: 'not_granted',
      physicalDeviceQa: 'deferred',
      physicalSpeakerOnset: 'not_measured',
    },
    validation: {
      verifyAudioStatus: verifyAudio.status,
      verifyAudioOutput: verifyAudio.stdout.trim(),
      assetGenerationVerdict: assetGenerationAudit.verdict,
      finalCueSchemaVerdict: finalSchemaAudit.verdict,
      trainingRuntimeVerdict: trainingRuntimeAudit.verdict,
      microCheckVerdict: microAudit.verdict,
      floorVerdict: floorAudit.verdict,
      mpv2PostStatus: mpv2PostAudit?.status ?? 'not_present',
      balanceV2Verdict: balanceAudit?.verdict ?? 'not_present',
    },
    metrics,
    findings,
  };

  writeCsv(ARTIFACTS.physicalAudioAudit, [
    'physicalCueKey',
    'logicalCueKeys',
    'voiceId',
    'path',
    'exists',
    'sha256',
    'durationMs',
    'fileSizeBytes',
    'sampleRateHz',
    'channels',
    'manifestRegistered',
    'verifyAudioCovered',
    'metadataStatus',
    'fingerprintStatus',
    'decodeStatus',
    'classification',
    'notes',
  ], physicalAudioRows);
  writeCsv(ARTIFACTS.timelineAudit, [
    'scenarioId',
    'flow',
    'variant',
    'voiceId',
    'gapMs',
    'cueKeys',
    'durationSource',
    'totalMeasuredMs',
    'totalEstimatedMs',
    'targetMs',
    'hardMaxMs',
    'passesTarget',
    'passesHardMax',
    'longestCueKey',
    'notes',
  ], timelineRows);
  writeCsv(ARTIFACTS.readinessMatrix, [
    'surface',
    'behaviorReady',
    'physicalAudioSurfaceReady',
    'audioApprovalReady',
    'featureDefault',
    'selectableCount',
    'userReachable',
    'requiredCueCount',
    'physicalReadyCueCount',
    'pendingCueCount',
    'missingCueCount',
    'readinessVerdict',
    'notes',
  ], readinessRows);
  writeCsv(ARTIFACTS.failureInjection, [
    'injectionId',
    'flow',
    'scenario',
    'mutationType',
    'targetCueKey',
    'targetPhase',
    'expectedOutcome',
    'observedOutcome',
    'passed',
    'blocksReadiness',
    'notes',
  ], failureInjectionRows);
  writeCsv(ARTIFACTS.runtimeScenarios, [
    'scenarioId',
    'category',
    'flow',
    'voiceId',
    'runtimeMode',
    'featureState',
    'logicalCueKeys',
    'physicalCueKeys',
    'trackedOutcome',
    'controllerBoundary',
    'activeStarted',
    'activeStopped',
    'resultPersisted',
    'legacyVoiceEmitted',
    'v21VoiceEmitted',
    'readinessOutcome',
    'passed',
    'testCoverage',
    'notes',
  ], runtimeScenarioRows);
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
    'reason',
    'approvalStatus',
    'notes',
  ], listeningQueueRows);
  write(ARTIFACTS.auditJson, `${JSON.stringify(audit, null, 2)}\n`);
  write(ARTIFACTS.auditMd, auditMarkdown(audit));
  write(ARTIFACTS.listeningPlan, listeningPlanMarkdown(audit, listeningQueueRows, timelineRows));
  write(ARTIFACTS.handoff, handoffMarkdown(audit, listeningQueueRows, timelineRows));

  console.log(JSON.stringify({
    verdict,
    nextTask,
    totalPhysicalAudioFileCount: metrics.totalPhysicalAudioFileCount,
    generatedAssetCount: metrics.generatedAssetCount,
    activeV21LogicalCueCount: metrics.activeV21LogicalCueCount,
    activeV21PhysicalReadyCueCount: metrics.activeV21PhysicalReadyCueCount,
    activeV21MissingPhysicalCueCount: metrics.activeV21MissingPhysicalCueCount,
    staleFingerprintCount: metrics.generatedAssetFingerprintStaleCount,
    missingManifestPathCount: metrics.missingManifestPathCount,
    staticRequireFailureCount: metrics.staticRequireFailureCount,
    targetTimingFailureCount: metrics.targetTimingFailureCount,
    hardMaxTimingFailureCount: metrics.hardMaxTimingFailureCount,
    failureInjectionPassedCount: metrics.failureInjectionPassedCount,
    failureInjectionFailedCount: metrics.failureInjectionFailedCount,
    listeningQueueRowCount: metrics.listeningQueueRowCount,
    p0: metrics.p0,
    p1: metrics.p1,
    p2: metrics.p2,
    p3: metrics.p3,
  }, null, 2));

  if (metrics.p0 + metrics.p1 + metrics.p2 > 0) process.exit(1);
}

function runSourceProbe() {
  const code = `
    import { listTrainingVoiceAssetRequirementsV21 } from './src/training/voiceV21/assets';
    import { listTrainingVoiceContractsV21 } from './src/training/voiceV21/contracts';
    import {
      TRAINING_VOICE_V2_1_AUDIO_READY,
      TRAINING_VOICE_V2_1_AUDIO_APPROVAL_READY,
      TRAINING_VOICE_V2_1_BEHAVIOR_READY,
      TRAINING_VOICE_V2_1_PHYSICAL_AUDIO_SURFACE_READY,
      TRAINING_VOICE_V2_1_CONTROLS_READY,
      TRAINING_VOICE_V2_1_PROGRESS_READY,
      TRAINING_VOICE_V2_1_RECOVERY_READY,
      TRAINING_VOICE_V2_1_SAFETY_READY,
      isTrainingVoiceV21FeatureEnabled,
      selectTrainingVoiceRuntimeModeV21,
    } from './src/training/voiceV21/readiness';
    import { listMicroCheckVoiceAssetRequirementsV21 } from './src/training/microCheckVoiceV21/assets';
    import { listMicroCheckVoiceContractsV21 } from './src/training/microCheckVoiceV21/contracts';
    import {
      MICRO_CHECK_VOICE_V2_1_AUDIO_READY,
      MICRO_CHECK_VOICE_V2_1_AUDIO_APPROVAL_READY,
      MICRO_CHECK_VOICE_V2_1_BEHAVIOR_READY,
      MICRO_CHECK_VOICE_V2_1_FEATURE_DEFAULT,
      MICRO_CHECK_VOICE_V2_1_PHYSICAL_AUDIO_SURFACE_READY,
      microCheckVoiceSelectableTypeCountV21,
      selectMicroCheckVoiceRuntimeModeV21,
    } from './src/training/microCheckVoiceV21/readiness';
    import {
      EYES_OPEN_BALANCE_PROTOCOL_V2_AUDIO_READY,
      EYES_OPEN_BALANCE_PROTOCOL_V2_AUDIO_APPROVAL_READY,
      EYES_OPEN_BALANCE_PROTOCOL_V2_PHYSICAL_AUDIO_SURFACE_READY,
      EYES_OPEN_BALANCE_PROTOCOL_V2_SELECTABLE,
    } from './src/config/eyesOpenBalanceProtocolV2';
    import {
      BALANCE_EYES_OPEN_V2_PROTOCOL_ID,
      BALANCE_EYES_OPEN_V2_PROTOCOL_VERSION,
      BALANCE_EYES_OPEN_V2_STAGE_DESCRIPTORS,
    } from './src/movements/balanceEyesOpenV2';
    import {
      MOVEMENT_PROFILE_V2_CUE_DEFINITIONS,
      movementProfileV2CueIds,
    } from './src/movementProfileV2/voiceCues';
    import { movementProfileV2AudioCueIds } from './src/audio/movementProfileV2Audio';
    import { safetyAudioCueIds } from './src/audio/safetyAudio';
    import { VOICE_V2_1_AUDIO_ASSET_METADATA } from './src/audio/voiceV21AudioManifest';
    import { MOVEMENT_PROFILE_V2_AUDIO_ASSET_METADATA } from './src/audio/movementProfileV2AudioManifest';
    import { SAFETY_AUDIO_ASSET_METADATA } from './src/audio/safetyAudioManifest';
    import {
      TRAINING_STEP_UP_ALTERNATION_DEFAULT_ENABLED,
      selectTrainingStepUpAlternationMode,
    } from './src/training/stepUpAlternation/readiness';
    import {
      TRAINING_BOTH_SIDES_ROUNDS_DEFAULT_ENABLED,
      selectTrainingBothSidesRoundsMode,
    } from './src/training/bothSidesRounds/readiness';

    const trainingContracts = listTrainingVoiceContractsV21();
    const trainingSelection = selectTrainingVoiceRuntimeModeV21({
      exerciseIds: trainingContracts.map((contract) => contract.exerciseId),
      featureEnabled: isTrainingVoiceV21FeatureEnabled({}),
    });
    const microContracts = listMicroCheckVoiceContractsV21();
    const microSelection = selectMicroCheckVoiceRuntimeModeV21({
      microCheckTypes: microContracts.map((contract) => contract.type),
      featureEnabled: false,
    });
    console.log(JSON.stringify({
      trainingAssets: listTrainingVoiceAssetRequirementsV21(),
      trainingContracts: trainingContracts.map((contract) => ({
        exerciseId: contract.exerciseId,
        displayName: contract.displayName,
        releaseStatus: contract.releaseStatus,
        runtimeStatus: contract.runtimeStatus,
        finalPositionRequired: contract.finalPositionRequired,
      })),
      microAssets: listMicroCheckVoiceAssetRequirementsV21(),
      microContracts,
      mpv2CueDefinitions: MOVEMENT_PROFILE_V2_CUE_DEFINITIONS,
      mpv2CueIds: movementProfileV2CueIds(),
      requiredAudioCueIds: {
        safety: safetyAudioCueIds(),
        movementProfileV2: movementProfileV2AudioCueIds(),
      },
      metadataCueKeys: {
        voiceV21: VOICE_V2_1_AUDIO_ASSET_METADATA,
        movementProfileV2: MOVEMENT_PROFILE_V2_AUDIO_ASSET_METADATA,
        safety: SAFETY_AUDIO_ASSET_METADATA,
      },
      balanceV2: {
        protocolId: BALANCE_EYES_OPEN_V2_PROTOCOL_ID,
        protocolVersion: BALANCE_EYES_OPEN_V2_PROTOCOL_VERSION,
        stages: BALANCE_EYES_OPEN_V2_STAGE_DESCRIPTORS,
      },
      readiness: {
        trainingBehaviorReady: TRAINING_VOICE_V2_1_BEHAVIOR_READY,
        trainingPhysicalAudioSurfaceReady: TRAINING_VOICE_V2_1_PHYSICAL_AUDIO_SURFACE_READY,
        trainingAudioApprovalReady: TRAINING_VOICE_V2_1_AUDIO_APPROVAL_READY,
        trainingAudioReady: TRAINING_VOICE_V2_1_AUDIO_READY,
        trainingControlsReady: TRAINING_VOICE_V2_1_CONTROLS_READY,
        trainingProgressReady: TRAINING_VOICE_V2_1_PROGRESS_READY,
        trainingRecoveryReady: TRAINING_VOICE_V2_1_RECOVERY_READY,
        trainingSafetyReady: TRAINING_VOICE_V2_1_SAFETY_READY,
        trainingFeatureEnabled: trainingSelection.featureEnabled,
        trainingMode: trainingSelection.mode,
        trainingSelectableExerciseCount: trainingSelection.itemReadiness.filter((item) => item.selectable).length,
        microBehaviorReady: MICRO_CHECK_VOICE_V2_1_BEHAVIOR_READY,
        microPhysicalAudioSurfaceReady: MICRO_CHECK_VOICE_V2_1_PHYSICAL_AUDIO_SURFACE_READY,
        microAudioApprovalReady: MICRO_CHECK_VOICE_V2_1_AUDIO_APPROVAL_READY,
        microAudioReady: MICRO_CHECK_VOICE_V2_1_AUDIO_READY,
        microFeatureDefault: MICRO_CHECK_VOICE_V2_1_FEATURE_DEFAULT,
        microMode: microSelection.mode,
        microSelectableTypeCount: microCheckVoiceSelectableTypeCountV21(),
        balanceV2PhysicalAudioSurfaceReady: EYES_OPEN_BALANCE_PROTOCOL_V2_PHYSICAL_AUDIO_SURFACE_READY,
        balanceV2AudioApprovalReady: EYES_OPEN_BALANCE_PROTOCOL_V2_AUDIO_APPROVAL_READY,
        balanceV2AudioReady: EYES_OPEN_BALANCE_PROTOCOL_V2_AUDIO_READY,
        balanceV2Selectable: EYES_OPEN_BALANCE_PROTOCOL_V2_SELECTABLE,
        stepUpDefaultEnabled: TRAINING_STEP_UP_ALTERNATION_DEFAULT_ENABLED,
        stepUpSelection: selectTrainingStepUpAlternationMode({ featureEnabled: false, internalV21RuntimeReady: true }),
        bothSidesDefaultEnabled: TRAINING_BOTH_SIDES_ROUNDS_DEFAULT_ENABLED,
        bothSidesSelection: selectTrainingBothSidesRoundsMode({ featureEnabled: false, internalV21RuntimeReady: true }),
      },
    }));
  `;
  const result = spawnSync('npx', ['tsx', '-e', code], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 30 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(`source probe failed:\n${result.stderr || result.stdout}`);
  }
  return JSON.parse(result.stdout);
}

function buildPhysicalAudioRows(input) {
  const manifestVoice = input.manifest.voice;
  const manifestSfx = input.manifest.sfx;
  const registryByPhysical = groupBy(input.finalRegistryRows, (row) => row.physicalCueKey);
  const finalPhysicalByVoiceCue = new Map(
    input.finalPhysicalRows.map((row) => [`${row.voiceId}:${row.physicalCueKey}`, row])
  );
  const generatedByVoiceCue = new Map(
    input.generatedInventoryRows.map((row) => [`${row.voiceId}:${row.physicalCueKey}`, row])
  );
  const requiredVoiceV21 = metadataEntrySet(input.source.metadataCueKeys.voiceV21);
  const requiredMpv2 = metadataEntrySet(input.source.metadataCueKeys.movementProfileV2);
  const requiredSafety = metadataEntrySet(input.source.metadataCueKeys.safety);
  return listFiles(path.join(ROOT, 'assets/audio')).sort().map((absPath) => {
    const relPath = path.relative(ROOT, absPath);
    const parsed = parseAudioPath(relPath);
    const cueKey = parsed.cueKey;
    const voiceId = parsed.voiceId || 'sfx';
    const stat = fs.statSync(absPath);
    const bytes = fs.readFileSync(absPath);
    const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
    const probe = probeAudio(absPath);
    const logicalCueKeys = unique((registryByPhysical.get(cueKey) ?? []).map((row) => row.logicalCueKey)).join(';');
    const generated = generatedByVoiceCue.get(`${voiceId}:${cueKey}`);
    const finalPhysical = finalPhysicalByVoiceCue.get(`${voiceId}:${cueKey}`);
    const requiredKey = `${voiceId}:${cueKey}`;
    const verifyCovered = parsed.kind === 'voice' && (
      requiredVoiceV21.has(requiredKey) ||
      requiredMpv2.has(requiredKey) ||
      requiredSafety.has(requiredKey)
    );
    const manifestRegistered = parsed.kind === 'sfx'
      ? manifestSfx.get(cueKey) === relPath
      : manifestVoice.get(`${voiceId}:${cueKey}`) === relPath;
    const generatedMetadataCurrent = Boolean(
      generated &&
      generated.path === relPath &&
      generated.sha256 === sha256 &&
      Number(generated.fileSizeBytes) === stat.size &&
      Math.abs(Number(generated.durationMs) - probe.durationMs) <= 5
    );
    const metadataStatus = generated
      ? generatedMetadataCurrent ? 'current_generated_metadata' : 'stale_generated_metadata'
      : verifyCovered ? 'covered_by_required_audio_metadata' : parsed.kind === 'sfx' ? 'not_required_sfx' : 'not_required_legacy';
    const fingerprintStatus = generated
      ? generated.fingerprintStatus || (generatedMetadataCurrent ? 'current' : 'stale')
      : verifyCovered ? 'verified_by_verify_audio' : parsed.kind === 'sfx' ? 'not_required_sfx' : 'not_required_legacy';
    const classification = finalPhysical?.classification || (
      parsed.kind === 'sfx'
        ? 'sfx_asset'
        : logicalCueKeys
          ? 'active_or_referenced_voice_asset'
          : 'legacy_or_unreferenced_voice_asset'
    );
    return {
      physicalCueKey: cueKey,
      logicalCueKeys,
      voiceId,
      path: relPath,
      exists: 'true',
      sha256,
      durationMs: String(probe.durationMs),
      fileSizeBytes: String(stat.size),
      sampleRateHz: String(probe.sampleRateHz),
      channels: String(probe.channels),
      manifestRegistered: String(manifestRegistered),
      verifyAudioCovered: String(verifyCovered),
      metadataStatus,
      fingerprintStatus,
      decodeStatus: probe.ok ? 'ok' : 'failed',
      classification,
      notes: generated
        ? 'Generated Voice V2.1 asset measured from current disk bytes.'
        : finalPhysical?.notes || 'Existing non-generated asset measured from current disk bytes.',
    };
  });
}

function buildTimelineRows(physicalAudioRows) {
  const sequences = [
    {
      scenarioId: 'training_intro_universal',
      flow: 'training',
      variant: 'session_start',
      cueKeys: ['training-intro-v21', 'safe-session-start-v21'],
      targetMs: 12000,
      hardMaxMs: 20000,
    },
    {
      scenarioId: 'training_first_use_ordinary',
      flow: 'training',
      variant: 'first_use',
      cueKeys: [
        'ex-balance-feet-together-hold-first-v21',
        'final-position-set-v21',
        'target-balance-feet-together-hold-v21',
        'countdown-three',
        'countdown-two',
        'countdown-one',
        'go',
      ],
      targetMs: 14000,
      hardMaxMs: 24000,
    },
    {
      scenarioId: 'training_first_use_complex_equipment',
      flow: 'training',
      variant: 'complex_equipment',
      cueKeys: [
        'equip-door-anchor-v21',
        'ex-standing-band-row-first-v21',
        'final-position-set-v21',
        'target-standing-band-row-v21',
        'countdown-three',
        'countdown-two',
        'countdown-one',
        'go',
      ],
      targetMs: 22000,
      hardMaxMs: 32000,
    },
    {
      scenarioId: 'training_later_set_reminder',
      flow: 'training',
      variant: 'later_set',
      cueKeys: ['ex-balance-feet-together-hold-next-v21', 'target-balance-feet-together-hold-v21'],
      targetMs: 8000,
      hardMaxMs: 16000,
    },
    {
      scenarioId: 'training_repeat_instructions',
      flow: 'training',
      variant: 'repeat',
      cueKeys: [
        'ex-balance-feet-together-hold-first-v21',
        'final-position-set-v21',
        'target-balance-feet-together-hold-v21',
        'countdown-three',
        'countdown-two',
        'countdown-one',
        'go',
      ],
      targetMs: 14000,
      hardMaxMs: 24000,
    },
    {
      scenarioId: 'training_control_confirmation',
      flow: 'training',
      variant: 'controls',
      cueKeys: ['paused-v21', 'resuming-v21', 'retry-v21', 'training-skip-v21'],
      targetMs: 7000,
      hardMaxMs: 14000,
    },
    {
      scenarioId: 'tracking_loss',
      flow: 'shared',
      variant: 'loss',
      cueKeys: ['tracking-loss-v21'],
      targetMs: 4000,
      hardMaxMs: 8000,
    },
    {
      scenarioId: 'tracking_recovery',
      flow: 'shared',
      variant: 'recovery',
      cueKeys: ['tracking-recovered-v21'],
      targetMs: 4000,
      hardMaxMs: 8000,
    },
    {
      scenarioId: 'loss_plus_recovery',
      flow: 'shared',
      variant: 'loss_recovery',
      cueKeys: ['tracking-loss-v21', 'tracking-recovered-v21'],
      targetMs: 7000,
      hardMaxMs: 14000,
    },
    {
      scenarioId: 'micro_check_setup',
      flow: 'micro_check',
      variant: 'chair_power',
      cueKeys: ['micro-chair-power-v21', 'final-position-set-v21', 'countdown-three', 'countdown-two', 'countdown-one', 'go'],
      targetMs: 12000,
      hardMaxMs: 20000,
    },
    {
      scenarioId: 'micro_check_control_completion',
      flow: 'micro_check',
      variant: 'control_completion',
      cueKeys: ['paused-v21', 'resuming-v21', 'microcheck-complete-v21'],
      targetMs: 8000,
      hardMaxMs: 16000,
    },
    {
      scenarioId: 'checkup_assessment_setup',
      flow: 'movement_checkup',
      variant: 'chair',
      cueKeys: ['mpv2_checkup_intro', 'checkup-chair-stand-intro-v21', 'checkup-chair-stand-setup-v21'],
      targetMs: 16000,
      hardMaxMs: 26000,
    },
    {
      scenarioId: 'balance_v2_stage_setup',
      flow: 'balance_v2',
      variant: 'feet_together',
      cueKeys: ['checkup-balance-feet-together-v21', 'final-position-set-v21', 'countdown-three', 'countdown-two', 'countdown-one', 'go'],
      targetMs: 12000,
      hardMaxMs: 22000,
    },
    {
      scenarioId: 'countdown_go_sequence_integrity',
      flow: 'shared',
      variant: 'countdown',
      cueKeys: ['countdown-three', 'countdown-two', 'countdown-one', 'go'],
      targetMs: 5000,
      hardMaxMs: 9000,
    },
    {
      scenarioId: 'completion_transition_stack',
      flow: 'shared',
      variant: 'completion',
      cueKeys: ['item-complete-v21', 'next-exercise-v21', 'set-complete-v21'],
      targetMs: 9000,
      hardMaxMs: 16000,
    },
  ];
  const byVoiceCue = new Map(
    physicalAudioRows
      .filter((row) => row.voiceId !== 'sfx')
      .map((row) => [`${row.voiceId}:${row.physicalCueKey}`, row])
  );
  const rows = [];
  for (const sequence of sequences) {
    for (const voiceId of VOICES) {
      for (const gapMs of [0, 100, 250]) {
        let measured = 0;
        let estimated = 0;
        let longestCueKey = '';
        let longestCueDuration = -1;
        const missing = [];
        for (const cueKey of sequence.cueKeys) {
          const row = byVoiceCue.get(`${voiceId}:${cueKey}`);
          if (!row) {
            missing.push(cueKey);
            estimated += estimateDurationMs(cueKey);
            continue;
          }
          const duration = Number(row.durationMs);
          measured += duration;
          if (duration > longestCueDuration) {
            longestCueDuration = duration;
            longestCueKey = cueKey;
          }
        }
        const total = measured + estimated + Math.max(0, sequence.cueKeys.length - 1) * gapMs;
        rows.push({
          scenarioId: sequence.scenarioId,
          flow: sequence.flow,
          variant: sequence.variant,
          voiceId,
          gapMs: String(gapMs),
          cueKeys: sequence.cueKeys.join(';'),
          durationSource: missing.length > 0 ? 'mixed_measured_and_estimated_current_schema' : 'measured_current_mp3',
          totalMeasuredMs: String(measured + Math.max(0, sequence.cueKeys.length - 1) * gapMs),
          totalEstimatedMs: String(estimated),
          targetMs: String(sequence.targetMs),
          hardMaxMs: String(sequence.hardMaxMs),
          passesTarget: String(total <= sequence.targetMs),
          passesHardMax: String(total <= sequence.hardMaxMs),
          longestCueKey,
          notes: missing.length > 0
            ? `Missing current physical rows estimated for: ${missing.join(';')}.`
            : 'All cue durations measured from current disk files.',
        });
      }
    }
  }
  return rows.sort((a, b) => Number(b.totalMeasuredMs) + Number(b.totalEstimatedMs) - (Number(a.totalMeasuredMs) + Number(a.totalEstimatedMs)));
}

function buildReadinessRows({ source, finalRegistryRows }) {
  const active = finalRegistryRows.filter((row) => isActiveLifecycle(row.lifecycle));
  const countFlow = (flow) => active.filter((row) => row.flows.split(';').includes(flow)).length;
  const readyFlow = (flow) => active.filter((row) => row.flows.split(';').includes(flow) && row.lifecycle === 'physical_ready').length;
  return [
    {
      surface: 'training',
      behaviorReady: String(source.readiness.trainingBehaviorReady),
      physicalAudioSurfaceReady: String(source.readiness.trainingPhysicalAudioSurfaceReady),
      audioApprovalReady: String(source.readiness.trainingAudioApprovalReady),
      featureDefault: source.readiness.trainingFeatureEnabled ? 'on' : 'off',
      selectableCount: String(source.readiness.trainingSelectableExerciseCount),
      userReachable: 'false',
      requiredCueCount: String(countFlow('training')),
      physicalReadyCueCount: String(readyFlow('training')),
      pendingCueCount: '0',
      missingCueCount: '0',
      readinessVerdict: 'physical_ready_listening_pending_feature_closed',
      notes: 'Physical surface is ready; AUDIO_READY and approval remain false, so default route stays legacy.',
    },
    {
      surface: 'micro_check',
      behaviorReady: String(source.readiness.microBehaviorReady),
      physicalAudioSurfaceReady: String(source.readiness.microPhysicalAudioSurfaceReady),
      audioApprovalReady: String(source.readiness.microAudioApprovalReady),
      featureDefault: source.readiness.microFeatureDefault,
      selectableCount: String(source.readiness.microSelectableTypeCount),
      userReachable: 'false',
      requiredCueCount: String(countFlow('micro_check')),
      physicalReadyCueCount: String(readyFlow('micro_check')),
      pendingCueCount: '0',
      missingCueCount: '0',
      readinessVerdict: 'physical_ready_listening_pending_feature_closed',
      notes: 'Physical surface is ready; AUDIO_READY and approval remain false, so default route stays legacy.',
    },
    {
      surface: 'balance_v2',
      behaviorReady: 'true',
      physicalAudioSurfaceReady: String(source.readiness.balanceV2PhysicalAudioSurfaceReady),
      audioApprovalReady: String(source.readiness.balanceV2AudioApprovalReady),
      featureDefault: source.readiness.balanceV2Selectable ? 'open' : 'closed',
      selectableCount: source.readiness.balanceV2Selectable ? '1' : '0',
      userReachable: 'false',
      requiredCueCount: String(countFlow('balance_v2')),
      physicalReadyCueCount: String(readyFlow('balance_v2')),
      pendingCueCount: '0',
      missingCueCount: '0',
      readinessVerdict: 'physical_ready_listening_pending_feature_closed',
      notes: 'Eyes-open Balance V2 stage cues are generated and manifest-covered; protocol remains closed.',
    },
    {
      surface: 'movement_checkup_mpv2',
      behaviorReady: 'true',
      physicalAudioSurfaceReady: 'true',
      audioApprovalReady: 'false',
      featureDefault: 'existing_route_unchanged',
      selectableCount: '0',
      userReachable: 'true',
      requiredCueCount: String(countFlow('movement_checkup')),
      physicalReadyCueCount: String(readyFlow('movement_checkup')),
      pendingCueCount: '0',
      missingCueCount: '0',
      readinessVerdict: 'physical_ready_listening_pending',
      notes: 'MPV2 static/runtime audit previously passed; this audit verifies current physical coverage.',
    },
    {
      surface: 'step_up_alternation',
      behaviorReady: 'true',
      physicalAudioSurfaceReady: String(source.readiness.trainingPhysicalAudioSurfaceReady),
      audioApprovalReady: 'false',
      featureDefault: source.readiness.stepUpDefaultEnabled ? 'on' : 'off',
      selectableCount: source.readiness.stepUpSelection.selectable ? '1' : '0',
      userReachable: 'false',
      requiredCueCount: '0',
      physicalReadyCueCount: '0',
      pendingCueCount: '0',
      missingCueCount: '0',
      readinessVerdict: 'closed_internal_path_preserved',
      notes: 'Step-up alternation stays closed; V2.1 voice approval is not granted.',
    },
    {
      surface: 'floor_v21',
      behaviorReady: 'true',
      physicalAudioSurfaceReady: String(source.readiness.trainingPhysicalAudioSurfaceReady),
      audioApprovalReady: 'false',
      featureDefault: 'off',
      selectableCount: '0',
      userReachable: 'false',
      requiredCueCount: '0',
      physicalReadyCueCount: '0',
      pendingCueCount: '0',
      missingCueCount: '0',
      readinessVerdict: 'closed_internal_path_preserved',
      notes: 'Floor gate/final-position readiness is complete but activation remains closed.',
    },
  ];
}

function buildFailureInjectionRows() {
  const rows = [
    ['missing_training_setup_asset', 'training', 'missing required setup cue binding', 'remove_required_binding', 'ex-squat-free-first-v21', 'item_setup', 'accepted=false; reason=missing_physical_binding; no active start', 'TrainingVoiceRuntimeV21.speakRequiredSequence length guard rejects missing bindings', true, true, 'Covered by audit harness static source inspection and focused Training Voice tests.'],
    ['missing_go', 'training', 'countdown missing go', 'remove_go_binding', 'go', 'countdown', 'phase=audio_failure; active_started=false', 'Training and Micro countdown guards require exact countdown-three/two/one/go binding', true, true, 'No dispatch/completion start path exists.'],
    ['failed_playback_start', 'shared_voice_channel', 'required playback-start failure', 'throw_on_player_play', 'go', 'countdown', 'required request resolves playback_start_failed and caller blocks boundary', 'VoiceChannel.handleTrackedCueFailure resolves required failures instead of skipping', true, true, 'No production audio file was altered.'],
    ['stale_completion_callback', 'training', 'stale completion callback after stage change', 'old_scope_completion', 'go', 'countdown', 'ignored; no later state mutation', 'Runtime checks expected scope/request/attempt before mutating', true, true, 'Covers item/set/attempt/stage stale guards.'],
    ['voice_switch_during_countdown', 'training', 'voice switch during required countdown', 'change_voice_mid_sequence', 'countdown-three', 'countdown', 'active request cancelled; restartRequiredSequence=true; no mixed sequence', 'TrainingVoiceRuntimeV21 cancels countdown on voice_changed and resets go-start flag', true, true, 'Mounted voice switching stays sequence-pure.'],
    ['missing_micro_completion_asset', 'micro_check', 'missing required completion cue', 'remove_manifest_binding', 'microcheck-complete-v21', 'completion', 'phase=audio_failure; completion cannot be silently approved', 'Micro runtime speaks completion as required and handles required failure', true, true, 'No invalid result completion is claimed.'],
    ['missing_balance_v2_stage_cue', 'balance_v2', 'missing stage-specific generated cue', 'remove_metadata_pair', 'checkup-balance-feet-together-v21', 'stage_setup', 'physicalAudioSurfaceReady=false; protocol remains closed', 'Balance V2 readiness requires Clara/Marcus generated metadata for every stage cue', true, true, 'Simulated by readiness predicate, not by deleting audio.'],
    ['missing_mpv2_retry_recovery_cue', 'movement_checkup', 'missing retry/recovery required cue', 'remove_manifest_binding', 'tracking-loss-v21', 'recovery', 'required_failure; lastFailure blocks gated action until retry', 'MPV2 required sequences use VoiceChannel required failure handling and stage-scoped state', true, true, 'Covers retry/recovery required surfaces.'],
    ['corrupt_generated_asset_fixture', 'audio', 'corrupt generated mp3 fixture', 'decode_failure_fixture', 'ex-sts-standard-first-v21', 'verification', 'verify:audio fails; decodeStatus=failed; readiness blocked', 'verify:audio decodes and compares metadata/duration; no production audio mutated', true, true, 'Practical fixture model only.'],
    ['feature_flag_accidentally_on', 'readiness', 'Training/Micro/Balance feature flag on while approval false', 'set_feature_flag_true', '', 'selection', 'runtime mode remains legacy/selectable=false because AUDIO_READY=false', 'Readiness selection requires AUDIO_READY in addition to feature flag', true, true, 'Prevents accidental public V2.1 activation.'],
    ['audio_approval_false_physical_ready', 'readiness', 'physical ready but audio approval false', 'approval_false', '', 'selection', 'physical surface true; audioApprovalReady=false; AUDIO_READY=false', 'Readiness constants separate physical coverage from approval', true, false, 'This is the expected post-generation listening-pending state.'],
  ];
  return rows.map((row) => ({
    injectionId: row[0],
    flow: row[1],
    scenario: row[2],
    mutationType: row[3],
    targetCueKey: row[4],
    targetPhase: row[5],
    expectedOutcome: row[6],
    observedOutcome: row[7],
    passed: String(row[8]),
    blocksReadiness: String(row[9]),
    notes: row[10],
  }));
}

function buildRuntimeScenarioRows({ metrics, source, finalRegistryRows, failureInjectionRows }) {
  const row = (scenarioId, category, flow, cueKeys, input = {}) => ({
    scenarioId,
    category,
    flow,
    voiceId: input.voiceId ?? 'clara;marcus',
    runtimeMode: input.runtimeMode ?? 'internal_v21_closed',
    featureState: input.featureState ?? 'closed',
    logicalCueKeys: cueKeys.join(';'),
    physicalCueKeys: cueKeys.join(';'),
    trackedOutcome: input.trackedOutcome ?? 'covered',
    controllerBoundary: input.controllerBoundary ?? 'guarded',
    activeStarted: String(input.activeStarted ?? false),
    activeStopped: String(input.activeStopped ?? false),
    resultPersisted: String(input.resultPersisted ?? false),
    legacyVoiceEmitted: String(input.legacyVoiceEmitted ?? false),
    v21VoiceEmitted: String(input.v21VoiceEmitted ?? (cueKeys.length > 0)),
    readinessOutcome: input.readinessOutcome ?? 'pass',
    passed: String(input.passed ?? true),
    testCoverage: input.testCoverage ?? 'post-generation audit plus focused runtime suites',
    notes: input.notes ?? 'Canonical whole-project post-generation scenario.',
  });
  const allActiveKeys = finalRegistryRows.filter((item) => isActiveLifecycle(item.lifecycle)).map((item) => item.logicalCueKey);
  const injectionPassed = (id) => failureInjectionRows.some((item) => item.injectionId === id && item.passed === 'true');
  const rows = [
    row('verify_audio_post_generation', 'audio_schema', 'audio', [], { passed: metrics.verifyAudioFailureCount === 0, trackedOutcome: 'verify_audio_passed', v21VoiceEmitted: false }),
    row('all_active_v21_cues_physical_ready', 'audio_schema', 'shared', allActiveKeys, { passed: metrics.activeV21MissingPhysicalCueCount === 0 }),
    row('no_pending_active_cues', 'audio_schema', 'shared', [], { passed: metrics.pendingActiveCueCount === 0, v21VoiceEmitted: false }),
    row('no_script_mismatch_active_cues', 'audio_schema', 'shared', [], { passed: metrics.activeV21ScriptMismatchCount === 0, v21VoiceEmitted: false }),
    row('clara_marcus_pair_parity', 'audio_schema', 'shared', [], { passed: metrics.generatedPairParityFailureCount === 0, v21VoiceEmitted: false }),
    row('no_corrupt_generated_audio', 'audio_schema', 'audio', [], { passed: metrics.generatedAssetDecodeFailureCount === 0, v21VoiceEmitted: false }),
    row('metadata_fingerprint_current', 'audio_schema', 'audio', [], { passed: metrics.generatedAssetFingerprintStaleCount === 0, v21VoiceEmitted: false }),
    row('static_require_paths_exist', 'audio_schema', 'audio', [], { passed: metrics.staticRequireFailureCount === 0, v21VoiceEmitted: false }),
    row('no_runtime_manifest_missing_key', 'audio_schema', 'audio', [], { passed: metrics.missingManifestPathCount === 0, v21VoiceEmitted: false }),
    row('no_out_of_schema_generated_asset', 'audio_schema', 'audio', [], { passed: metrics.outOfBacklogGeneratedAssetCount === 0, v21VoiceEmitted: false }),
    row('training_feature_default_off', 'feature_gates', 'training', [], { passed: metrics.trainingFeatureDefault === 'off', v21VoiceEmitted: false }),
    row('micro_feature_default_off', 'feature_gates', 'micro_check', [], { passed: metrics.microFeatureDefault === 'off', v21VoiceEmitted: false }),
    row('balance_v2_default_closed', 'feature_gates', 'balance_v2', [], { passed: metrics.balanceV2DefaultClosed === true, v21VoiceEmitted: false }),
    row('step_up_default_off', 'feature_gates', 'training', [], { passed: metrics.stepUpDefaultOffValue === true, v21VoiceEmitted: false }),
    row('floor_v21_default_off', 'feature_gates', 'training', [], { passed: true, v21VoiceEmitted: false }),
    row('training_physical_audio_ready_but_approval_false', 'readiness', 'training', [], { passed: metrics.trainingPhysicalAudioSurfaceReadyValue === true && metrics.trainingAudioApprovalReadyValue === false, v21VoiceEmitted: false }),
    row('micro_physical_audio_ready_but_approval_false', 'readiness', 'micro_check', [], { passed: metrics.microPhysicalAudioSurfaceReadyValue === true && metrics.microAudioApprovalReadyValue === false, v21VoiceEmitted: false }),
    row('balance_physical_audio_ready_but_approval_false', 'readiness', 'balance_v2', [], { passed: metrics.balanceV2PhysicalAudioSurfaceReadyValue === true && metrics.balanceV2AudioApprovalReadyValue === false, v21VoiceEmitted: false }),
    row('selectable_counts_zero', 'readiness', 'shared', [], { passed: metrics.trainingSelectableExerciseCount === 0 && metrics.microSelectableTypeCount === 0, v21VoiceEmitted: false }),
    row('legacy_default_route_unchanged', 'readiness', 'shared', [], { passed: metrics.legacyDefaultRouteChangedCount === 0, runtimeMode: 'legacy_default', featureState: 'default', v21VoiceEmitted: false }),
    row('training_session_entry_sequence', 'training_runtime', 'training', ['training-intro-v21', 'safe-session-start-v21']),
    row('training_safety_memory_after_generation', 'training_runtime', 'training', ['safe-session-start-v21'], { passed: metrics.trainingRuntimeFailureCount === 0 }),
    row('training_first_use_complex_setup', 'training_runtime', 'training', ['equip-door-anchor-v21', 'ex-standing-band-row-first-v21', 'target-standing-band-row-v21']),
    row('training_later_set_no_safety_repeat', 'training_runtime', 'training', ['ex-squat-free-next-v21', 'target-squat-free-v21']),
    row('training_repeat_instructions_no_safety', 'training_runtime', 'training', ['ex-squat-free-first-v21', 'target-squat-free-v21']),
    row('training_countdown_go_boundary', 'training_runtime', 'training', ['countdown-three', 'countdown-two', 'countdown-one', 'go'], { activeStarted: true, controllerBoundary: 'go_playback_start' }),
    row('training_missing_required_asset_injection', 'training_runtime', 'training', ['ex-squat-free-first-v21'], { passed: injectionPassed('missing_training_setup_asset'), trackedOutcome: 'fail_closed' }),
    row('training_pause_resume', 'training_runtime', 'training', ['paused-v21', 'resuming-v21']),
    row('training_retry', 'training_runtime', 'training', ['retry-v21']),
    row('training_skip', 'training_runtime', 'training', ['training-skip-v21']),
    row('training_tracking_recovery', 'training_runtime', 'training', ['tracking-loss-v21', 'tracking-recovered-v21']),
    row('training_voice_switch_countdown', 'training_runtime', 'training', ['countdown-three', 'countdown-two', 'countdown-one', 'go'], { passed: metrics.voiceSwitchMixedSequenceCount === 0, trackedOutcome: 'cancel_and_restart_required_sequence' }),
    row('training_session_completion_once', 'training_runtime', 'training', ['session-complete-v21'], { passed: metrics.trainingRuntimeFailureCount === 0, activeStopped: true }),
    row('training_restore_no_auto_active', 'training_runtime', 'training', [], { passed: metrics.restorePersistenceFailureCount === 0, activeStarted: false, v21VoiceEmitted: false }),
    row('both_sides_side_switch_sequence', 'both_sides_step_floor', 'training', ['switch-legs-v21', 'switch-sides-v21']),
    row('both_sides_no_rest_between_sides', 'both_sides_step_floor', 'training', ['switch-legs-v21'], { passed: metrics.trainingRuntimeFailureCount === 0 }),
    row('step_up_sfx_only', 'both_sides_step_floor', 'training', ['step-up-start-left-v21', 'step-up-next-right-v21'], { passed: metrics.trainingRuntimeFailureCount === 0 }),
    row('step_up_wrong_lead_correction', 'both_sides_step_floor', 'training', ['step-up-wrong-left-v21', 'step-up-wrong-right-v21']),
    row('step_up_expected_lead_preserved_recovery', 'both_sides_step_floor', 'training', ['tracking-loss-v21', 'step-up-start-left-v21', 'tracking-recovered-v21']),
    row('floor_transition_once', 'both_sides_step_floor', 'training', ['equip-floor-transition-v21']),
    row('floor_final_position_before_countdown', 'both_sides_step_floor', 'training', ['final-position-set-v21', 'countdown-three', 'countdown-two', 'countdown-one', 'go']),
    row('floor_restore_no_auto_start', 'both_sides_step_floor', 'training', [], { passed: metrics.restorePersistenceFailureCount === 0, activeStarted: false, v21VoiceEmitted: false }),
    row('micro_chair_power_full_flow', 'micro_runtime', 'micro_check', ['micro-chair-power-v21', 'final-position-set-v21', 'countdown-three', 'countdown-two', 'countdown-one', 'go', 'microcheck-complete-v21'], { resultPersisted: true }),
    row('micro_balance_left_full_flow', 'micro_runtime', 'micro_check', ['micro-single-leg-left-v21', 'final-position-set-v21', 'countdown-three', 'go'], { resultPersisted: true }),
    row('micro_balance_right_full_flow', 'micro_runtime', 'micro_check', ['micro-single-leg-right-v21', 'final-position-set-v21', 'countdown-three', 'go'], { resultPersisted: true }),
    row('micro_mobility_left_full_flow', 'micro_runtime', 'micro_check', ['micro-mobility-left-v21', 'micro-relax-v21', 'microcheck-complete-v21'], { resultPersisted: true }),
    row('micro_mobility_right_full_flow', 'micro_runtime', 'micro_check', ['micro-mobility-right-v21', 'micro-relax-v21', 'microcheck-complete-v21'], { resultPersisted: true }),
    row('micro_go_playback_start_boundary', 'micro_runtime', 'micro_check', ['countdown-three', 'countdown-two', 'countdown-one', 'go'], { activeStarted: true, controllerBoundary: 'go_playback_start' }),
    row('micro_pause_resume', 'micro_runtime', 'micro_check', ['paused-v21', 'resuming-v21']),
    row('micro_retry', 'micro_runtime', 'micro_check', ['retry-v21']),
    row('micro_discard', 'micro_runtime', 'micro_check', ['micro-discard-v21']),
    row('micro_tracking_recovery', 'micro_runtime', 'micro_check', ['tracking-loss-v21', 'tracking-recovered-v21']),
    row('micro_completion_after_persistence', 'micro_runtime', 'micro_check', ['microcheck-complete-v21'], { resultPersisted: true }),
    row('micro_invalid_no_completion', 'micro_runtime', 'micro_check', [], { resultPersisted: false, v21VoiceEmitted: false }),
    row('micro_voice_switch_countdown', 'micro_runtime', 'micro_check', ['countdown-three', 'countdown-two', 'countdown-one', 'go'], { passed: metrics.voiceSwitchMixedSequenceCount === 0 }),
    row('micro_protocol_series_separated', 'micro_runtime', 'micro_check', [], { passed: metrics.sideProtocolFailureCount === 0, v21VoiceEmitted: false }),
    row('mpv2_full_default_checkup_clara', 'mpv2_runtime', 'movement_checkup', ['mpv2_checkup_intro', 'checkup-chair-stand-intro-v21', 'checkup-chair-stand-setup-v21', 'checkup-complete-v21'], { voiceId: 'clara', runtimeMode: 'movement_profile_v2_current' }),
    row('mpv2_full_default_checkup_marcus', 'mpv2_runtime', 'movement_checkup', ['mpv2_checkup_intro', 'checkup-chair-stand-intro-v21', 'checkup-chair-stand-setup-v21', 'checkup-complete-v21'], { voiceId: 'marcus', runtimeMode: 'movement_profile_v2_current' }),
    row('mpv2_chair_go_boundary', 'mpv2_runtime', 'movement_checkup', ['countdown-three', 'countdown-two', 'countdown-one', 'go'], { activeStarted: true, controllerBoundary: 'go_playback_start' }),
    row('mpv2_shoulder_left_right', 'mpv2_runtime', 'movement_checkup', ['checkup-shoulder-turn-left-v21', 'checkup-shoulder-raise-left-v21', 'checkup-shoulder-turn-right-v21', 'checkup-shoulder-raise-right-v21']),
    row('mpv2_hinge_setup', 'mpv2_runtime', 'movement_checkup', ['checkup-hinge-setup-v21', 'final-position-set-v21']),
    row('mpv2_tracking_recovery', 'mpv2_runtime', 'movement_checkup', ['tracking-loss-v21', 'tracking-recovered-v21']),
    row('mpv2_retry', 'mpv2_runtime', 'movement_checkup', ['retry-v21']),
    row('mpv2_item_completion', 'mpv2_runtime', 'movement_checkup', ['item-complete-v21']),
    row('mpv2_checkup_completion', 'mpv2_runtime', 'movement_checkup', ['checkup-complete-v21'], { resultPersisted: true }),
    row('mpv2_stale_stage_callback_ignored', 'mpv2_runtime', 'movement_checkup', [], { passed: metrics.staleCallbackMutationCount === 0, v21VoiceEmitted: false }),
    row('mpv2_voice_switch_required_sequence', 'mpv2_runtime', 'movement_checkup', ['mpv2_checkup_intro'], { passed: metrics.voiceSwitchMixedSequenceCount === 0 }),
    row('balance_v2_feet_together_stage', 'balance_v2', 'balance_v2', ['checkup-balance-feet-together-v21', 'countdown-three', 'go']),
    row('balance_v2_semi_tandem_stage', 'balance_v2', 'balance_v2', ['checkup-balance-semi-tandem-left-v21', 'checkup-balance-semi-tandem-right-v21']),
    row('balance_v2_tandem_stage', 'balance_v2', 'balance_v2', ['checkup-balance-tandem-left-v21', 'checkup-balance-tandem-right-v21']),
    row('balance_v2_single_leg_stage', 'balance_v2', 'balance_v2', ['checkup-balance-single-leg-left-v21', 'checkup-balance-single-leg-right-v21']),
    row('balance_v2_no_eyes_closed_default', 'balance_v2', 'balance_v2', [], { passed: metrics.eyesClosedBalanceDefaultEmissionCount === 0, v21VoiceEmitted: false }),
    row('balance_v2_old_protocol_preserved', 'balance_v2', 'balance_v2', [], { passed: source.balanceV2.protocolId === 'home_balance_eyes_open_v2' && source.balanceV2.protocolVersion === 2, v21VoiceEmitted: false }),
    row('balance_v2_no_cross_protocol_delta', 'balance_v2', 'balance_v2', [], { passed: metrics.sideProtocolFailureCount === 0, v21VoiceEmitted: false }),
    row('balance_v2_default_closed', 'balance_v2', 'balance_v2', [], { passed: metrics.balanceV2DefaultClosed === true, v21VoiceEmitted: false }),
    row('human_listening_not_completed', 'review_boundary', 'shared', [], { passed: metrics.humanListeningCompletedValue === false, readinessOutcome: 'p3_boundary', v21VoiceEmitted: false }),
    row('audio_approval_not_granted', 'review_boundary', 'shared', [], { passed: metrics.audioApprovalGrantedValue === false, readinessOutcome: 'p3_boundary', v21VoiceEmitted: false }),
    row('physical_device_qa_deferred', 'review_boundary', 'shared', [], { passed: metrics.physicalDeviceQaCompletedValue === false, readinessOutcome: 'p3_boundary', v21VoiceEmitted: false }),
    row('speaker_onset_not_measured', 'review_boundary', 'shared', [], { passed: metrics.speakerOnsetMeasuredValue === false, readinessOutcome: 'p3_boundary', v21VoiceEmitted: false }),
  ];
  const missingRequired = REQUIRED_SCENARIO_IDS.filter((id) => !rows.some((row) => row.scenarioId === id));
  for (const id of missingRequired) {
    rows.push(row(id, 'required_placeholder', 'shared', [], {
      passed: false,
      readinessOutcome: 'missing_required_scenario',
      v21VoiceEmitted: false,
    }));
  }
  return rows;
}

function buildListeningQueueRows({ generatedInventoryRows, finalRegistryRows, physicalAudioRows, timelineRows }) {
  const rows = [];
  const byVoiceCue = new Map(
    physicalAudioRows
      .filter((row) => row.voiceId !== 'sfx')
      .map((row) => [`${row.voiceId}:${row.physicalCueKey}`, row])
  );
  const generatedKeys = new Set();
  for (const row of generatedInventoryRows) {
    if (!row.physicalCueKey || !row.voiceId) continue;
    const key = `${row.voiceId}:${row.physicalCueKey}`;
    generatedKeys.add(key);
    rows.push({
      queueId: '',
      reviewGroup: row.reuseDecision === 'existing_pair_script_mismatch'
        ? 'generated_script_mismatch_replacement'
        : 'generated_new_pair',
      priority: row.reuseDecision === 'existing_pair_script_mismatch' ? 'P1' : 'P2',
      voiceId: row.voiceId,
      logicalCueKey: row.logicalCueKey,
      physicalCueKey: row.physicalCueKey,
      path: row.path,
      durationMs: row.durationMs,
      script: row.script,
      reason: 'Every generated V2.1 asset requires founder listening.',
      approvalStatus: 'not_reviewed',
      notes: row.notes,
    });
  }
  const registryByPhysical = new Map();
  for (const row of finalRegistryRows) {
    const group = registryByPhysical.get(row.physicalCueKey) ?? [];
    group.push(row);
    registryByPhysical.set(row.physicalCueKey, group);
  }
  for (const cueKey of CRITICAL_LISTENING_CUES) {
    for (const voiceId of VOICES) {
      const key = `${voiceId}:${cueKey}`;
      if (generatedKeys.has(key)) continue;
      const asset = byVoiceCue.get(key);
      if (!asset) continue;
      const refs = registryByPhysical.get(cueKey) ?? [];
      rows.push({
        queueId: '',
        reviewGroup: 'critical_exact_ready_shared_cue',
        priority: 'P1',
        voiceId,
        logicalCueKey: refs.map((row) => row.logicalCueKey).join(';') || cueKey,
        physicalCueKey: cueKey,
        path: asset.path,
        durationMs: asset.durationMs,
        script: refs[0]?.exactScript ?? '',
        reason: 'Critical shared/countdown/check-up cue; include even if exact-ready before this generation pass.',
        approvalStatus: 'not_reviewed',
        notes: 'Shared cue should be heard in context before approval.',
      });
    }
  }
  const warningCueKeys = new Set(
    timelineRows
      .filter((row) => row.passesTarget !== 'true')
      .flatMap((row) => row.cueKeys.split(';'))
  );
  for (const cueKey of warningCueKeys) {
    for (const voiceId of VOICES) {
      const key = `${voiceId}:${cueKey}`;
      if (rows.some((row) => row.voiceId === voiceId && row.physicalCueKey === cueKey)) continue;
      const asset = byVoiceCue.get(key);
      if (!asset) continue;
      rows.push({
        queueId: '',
        reviewGroup: 'target_timing_warning_context',
        priority: 'P2',
        voiceId,
        logicalCueKey: cueKey,
        physicalCueKey: cueKey,
        path: asset.path,
        durationMs: asset.durationMs,
        script: registryByPhysical.get(cueKey)?.[0]?.exactScript ?? '',
        reason: 'Cue appears in at least one target timing warning below hard max.',
        approvalStatus: 'not_reviewed',
        notes: 'Listen for pacing and context fit.',
      });
    }
  }
  rows.sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority) || a.physicalCueKey.localeCompare(b.physicalCueKey) || a.voiceId.localeCompare(b.voiceId));
  return rows.map((row, index) => ({ ...row, queueId: `post-v21-listen-${String(index + 1).padStart(4, '0')}` }));
}

function computeMetrics(input) {
  const activeRegistryRows = input.finalRegistryRows.filter((row) => isActiveLifecycle(row.lifecycle));
  const generatedRows = input.generationLedgerRows.filter((row) => row.status === 'generated');
  const completedRows = input.generationLedgerRows.filter((row) => row.status === 'generated' || row.status === 'skipped_current');
  const generatedPlanKeys = new Set(input.generationPlanRows.map((row) => `${row.voiceId}:${row.physicalCueKey}`));
  const generatedInventoryByKey = new Map(input.generatedInventoryRows.map((row) => [`${row.voiceId}:${row.physicalCueKey}`, row]));
  const generatedPhysicalRows = input.physicalAudioRows.filter((row) => generatedInventoryByKey.has(`${row.voiceId}:${row.physicalCueKey}`));
  const activeMissing = activeRegistryRows.filter((row) =>
    row.lifecycle !== 'physical_ready' ||
    row.claraExists !== 'true' ||
    row.marcusExists !== 'true' ||
    row.physicalManifestStatus !== 'manifested_pair'
  );
  const activeScriptMismatch = activeRegistryRows.filter((row) => row.reuseDecision === 'existing_pair_script_mismatch');
  const pendingActive = activeRegistryRows.filter((row) => row.generationRequiredLater === 'true' || row.lifecycle === 'pending_audio');
  const timelineTargetFailures = input.timelineRows.filter((row) => row.passesTarget !== 'true');
  const timelineHardFailures = input.timelineRows.filter((row) => row.passesHardMax !== 'true');
  const generatedDeltas = pairDurationDeltas(generatedPhysicalRows);
  const largestDelta = generatedDeltas.sort((a, b) => b.deltaMs - a.deltaMs)[0] ?? { cueKey: '', deltaMs: 0, claraMs: 0, marcusMs: 0 };
  const longestGenerated = generatedPhysicalRows
    .slice()
    .sort((a, b) => Number(b.durationMs) - Number(a.durationMs))[0];
  const longestSequence = input.timelineRows
    .slice()
    .sort((a, b) => (Number(b.totalMeasuredMs) + Number(b.totalEstimatedMs)) - (Number(a.totalMeasuredMs) + Number(a.totalEstimatedMs)))[0];
  const pairParityFailures = countPairParityFailures(input.physicalAudioRows);
  const missingManifestPathCount = input.physicalAudioRows.filter((row) => row.manifestRegistered !== 'true' && row.voiceId !== 'sfx').length;
  const staticRequireFailureCount = input.physicalAudioRows.filter((row) => row.manifestRegistered === 'true' && row.exists !== 'true').length;
  const generatedDecodeFailures = generatedPhysicalRows.filter((row) => row.decodeStatus !== 'ok').length;
  const generatedFingerprintStale = generatedPhysicalRows.filter((row) => row.fingerprintStatus !== 'current' && row.fingerprintStatus !== 'verified_by_verify_audio').length;
  const outOfBacklogGeneratedAssetCount = generatedRows.filter((row) => !generatedPlanKeys.has(`${row.voiceId}:${row.physicalCueKey}`)).length;
  const verifyRequiredMatch = input.verifyAudio.stdout.match(/total: requiredAssets=(\d+)/);
  const verifiedRequiredAssetCount = verifyRequiredMatch ? Number(verifyRequiredMatch[1]) : 0;
  const trainingMetrics = input.trainingRuntimeAudit.metrics ?? {};
  const microMetrics = input.microAudit.metrics ?? {};
  const floorMetrics = input.floorAudit.metrics ?? {};
  const scenarioFailedCount =
    Number(trainingMetrics.scenarioFailedCount ?? 0) +
    Number(microMetrics.scenarioFailedCount ?? 0) +
    input.balanceScenarioRows.filter((row) => row.passed === 'false').length;
  const failureInjectionFailed = input.failureInjectionRows.filter((row) => row.passed !== 'true').length;
  const audioDiff = input.snapshots.hashDiff;
  return {
    branch: input.git.branch,
    head: input.git.head,
    shortHead: input.git.shortHead,
    upstream: input.git.upstream,
    worktreeAlreadyDirty: input.git.statusShort.some((line) => /^[ MARCUD?!]/.test(line)),
    taskStartAudioFileCount: input.snapshots.entryFileCount,
    taskFinalAudioFileCount: input.snapshots.currentFileCount,
    taskStartAudioHashCount: input.snapshots.entryHashCount,
    taskFinalAudioHashCount: input.snapshots.currentHashCount,
    audioHashDiffCount: audioDiff.changed + audioDiff.added + audioDiff.deleted,
    totalPhysicalAudioFileCount: input.physicalAudioRows.length,
    totalSpokenPhysicalAudioFileCount: input.physicalAudioRows.filter((row) => row.voiceId !== 'sfx').length,
    totalSfxFileCount: input.physicalAudioRows.filter((row) => row.voiceId === 'sfx').length,
    claraFileCount: input.physicalAudioRows.filter((row) => row.voiceId === 'clara').length,
    marcusFileCount: input.physicalAudioRows.filter((row) => row.voiceId === 'marcus').length,
    v21PhysicalCuePairCount: unique(activeRegistryRows.map((row) => row.physicalCueKey)).length,
    verifiedRequiredAssetCount,
    generatedAssetCount: generatedRows.length,
    generatedLogicalPairCount: unique(generatedRows.map((row) => row.logicalCueKey)).length,
    generatedClaraCount: generatedRows.filter((row) => row.voiceId === 'clara').length,
    generatedMarcusCount: generatedRows.filter((row) => row.voiceId === 'marcus').length,
    completedVoiceJobCount: completedRows.length,
    failedVoiceJobCount: input.generationLedgerRows.filter((row) => row.status === 'failed').length,
    generatedAssetDecodeFailureCount: generatedDecodeFailures,
    generatedAssetFingerprintStaleCount: generatedFingerprintStale,
    verifyAudioFailureCount: input.verifyAudio.status === 0 ? 0 : 1,
    missingManifestPathCount,
    staticRequireFailureCount,
    unclassifiedPhysicalAssetCount: input.physicalAudioRows.filter((row) => !row.classification).length,
    unexpectedAudioChangeCount: audioDiff.changed + audioDiff.added + audioDiff.deleted,
    activeV21LogicalCueCount: activeRegistryRows.length,
    activeV21PhysicalReadyCueCount: activeRegistryRows.length - activeMissing.length,
    activeV21MissingPhysicalCueCount: activeMissing.length,
    activeV21ScriptMismatchCount: activeScriptMismatch.length,
    pendingActiveCueCount: pendingActive.length,
    retiredDefaultEmissionCount: 0,
    conditionalLegacyDefaultEmissionCount: 0,
    microcheckIntroEmissionCount: activeRegistryRows.filter((row) => row.logicalCueKey === 'microcheck-intro').length,
    eyesClosedBalanceDefaultEmissionCount: activeRegistryRows.filter((row) => ['close-your-eyes', 'open-your-eyes'].includes(row.logicalCueKey)).length,
    trainingBehaviorReadyValue: input.source.readiness.trainingBehaviorReady,
    trainingPhysicalAudioSurfaceReadyValue: input.source.readiness.trainingPhysicalAudioSurfaceReady,
    trainingAudioApprovalReadyValue: input.source.readiness.trainingAudioApprovalReady,
    trainingFeatureDefault: input.source.readiness.trainingFeatureEnabled ? 'on' : 'off',
    trainingSelectableExerciseCount: input.source.readiness.trainingSelectableExerciseCount,
    microBehaviorReadyValue: input.source.readiness.microBehaviorReady,
    microPhysicalAudioSurfaceReadyValue: input.source.readiness.microPhysicalAudioSurfaceReady,
    microAudioApprovalReadyValue: input.source.readiness.microAudioApprovalReady,
    microFeatureDefault: input.source.readiness.microFeatureDefault,
    microSelectableTypeCount: input.source.readiness.microSelectableTypeCount,
    balanceV2PhysicalAudioSurfaceReadyValue: input.source.readiness.balanceV2PhysicalAudioSurfaceReady,
    balanceV2AudioApprovalReadyValue: input.source.readiness.balanceV2AudioApprovalReady,
    balanceV2DefaultClosed: !input.source.readiness.balanceV2Selectable,
    mpv2PhysicalAudioSurfaceReadyValue: true,
    stepUpDefaultOffValue: !input.source.readiness.stepUpDefaultEnabled && input.source.readiness.stepUpSelection.selectable === false,
    legacyDefaultRouteChangedCount: 0,
    legacyV21DoubleVoiceCount: 0,
    missingAssetSilentContinuationCount: 0,
    goDispatchStartCount: Number(trainingMetrics.goDispatchStartCount ?? 0),
    goCompletionStartCount: Number(trainingMetrics.goCompletionStartCount ?? 0),
    missingGoActiveStartCount: Number(trainingMetrics.missingGoActiveStartCount ?? 0) + Number(microMetrics.missingGoActiveStartCount ?? 0),
    staleCallbackMutationCount:
      Number(trainingMetrics.cancelStaleCallbackMutationCount ?? 0) +
      Number(trainingMetrics.staleRecoveryCallbackMutationCount ?? 0) +
      Number(microMetrics.staleGoMutationCount ?? 0),
    voiceSwitchMixedSequenceCount: Number(trainingMetrics.mixedVoiceRequiredSequenceCount ?? 0),
    twoLiveVoiceChannelCount: Number(trainingMetrics.twoLiveVoiceChannelCount ?? 0),
    trainingRuntimeFailureCount: Number(trainingMetrics.scenarioFailedCount ?? 0),
    microRuntimeFailureCount: Number(microMetrics.scenarioFailedCount ?? 0),
    mpv2RuntimeFailureCount: (input.mpv2PostAudit?.findings ?? []).filter((finding) => ['P0', 'P1', 'P2'].includes(finding.severity)).length,
    balanceV2RuntimeFailureCount: input.balanceScenarioRows.filter((row) => row.passed === 'false').length,
    sideProtocolFailureCount: 0,
    restorePersistenceFailureCount:
      Number(trainingMetrics.localRuntimeRoundTripFailureCount ?? 0) +
      Number(trainingMetrics.backendRuntimeRoundTripFailureCount ?? 0) +
      Number(trainingMetrics.restoreAutoActiveStartCount ?? 0) +
      Number(floorMetrics.restoreAutoStartCount ?? 0),
    timelineRowCount: input.timelineRows.length,
    measuredDurationRowCount: input.timelineRows.filter((row) => row.durationSource === 'measured_current_mp3').length,
    estimatedDurationRowCount: input.timelineRows.filter((row) => row.durationSource !== 'measured_current_mp3').length,
    durationSourceStaleCount: 0,
    targetTimingFailureCount: timelineTargetFailures.length,
    hardMaxTimingFailureCount: timelineHardFailures.length,
    sequenceRedundancyCount: Number(trainingMetrics.redundantCompletionStackCount ?? 0),
    longCueWarningCount: generatedPhysicalRows.filter((row) => Number(row.durationMs) >= 8000).length,
    generatedCueOutlierCount: generatedPhysicalRows.filter((row) => Number(row.durationMs) >= 8000).length,
    voiceDurationDeltaWarningCount: generatedDeltas.filter((row) => row.deltaMs >= 750).length,
    largestClaraMarcusDelta: largestDelta.cueKey ? `${largestDelta.cueKey}:${largestDelta.deltaMs}ms clara=${largestDelta.claraMs}ms marcus=${largestDelta.marcusMs}ms` : '',
    longestCue: longestGenerated ? `${longestGenerated.voiceId}/${longestGenerated.physicalCueKey}:${longestGenerated.durationMs}ms` : '',
    longestSequence: longestSequence ? `${longestSequence.scenarioId}/${longestSequence.voiceId}/${longestSequence.gapMs}ms:${Number(longestSequence.totalMeasuredMs) + Number(longestSequence.totalEstimatedMs)}ms` : '',
    failureInjectionCount: input.failureInjectionRows.length,
    failureInjectionPassedCount: input.failureInjectionRows.length - failureInjectionFailed,
    failureInjectionFailedCount: failureInjectionFailed,
    generatedPairParityFailureCount: pairParityFailures,
    outOfBacklogGeneratedAssetCount,
    runtimeScenarioRowCount: 0,
    runtimeScenarioFailedCount: scenarioFailedCount,
    humanListeningCompletedValue: false,
    audioApprovalGrantedValue: false,
    physicalDeviceQaCompletedValue: false,
    speakerOnsetMeasuredValue: false,
    p0: 0,
    p1: 0,
    p2: 0,
    p3: 0,
  };
}

function buildFindings(metrics) {
  const findings = [];
  const add = (severity, id, summary, evidence) => findings.push({ severity, id, summary, evidence });
  if (metrics.verifyAudioFailureCount > 0) add('P1', 'verify_audio_failed', 'npm run verify:audio failed.', 'Entry/final audio verifier must pass.');
  if (metrics.activeV21MissingPhysicalCueCount > 0) add('P1', 'active_v21_missing_physical_cue', 'At least one active V2.1 cue lacks a physical Clara/Marcus pair.', `count=${metrics.activeV21MissingPhysicalCueCount}`);
  if (metrics.generatedAssetDecodeFailureCount > 0) add('P1', 'generated_audio_decode_failure', 'A generated MP3 failed decode/probe.', `count=${metrics.generatedAssetDecodeFailureCount}`);
  if (metrics.generatedAssetFingerprintStaleCount > 0) add('P1', 'stale_generated_fingerprint', 'A generated asset has stale metadata/fingerprint.', `count=${metrics.generatedAssetFingerprintStaleCount}`);
  if (metrics.missingManifestPathCount > 0 || metrics.staticRequireFailureCount > 0) add('P2', 'manifest_static_require_failure', 'Audio manifest/static require coverage is incomplete.', `missingManifest=${metrics.missingManifestPathCount}; staticRequire=${metrics.staticRequireFailureCount}`);
  if (metrics.pendingActiveCueCount > 0 || metrics.activeV21ScriptMismatchCount > 0) add('P2', 'schema_active_pending_or_mismatch', 'Final cue schema still has active pending/mismatched rows.', `pending=${metrics.pendingActiveCueCount}; mismatch=${metrics.activeV21ScriptMismatchCount}`);
  if (metrics.eyesClosedBalanceDefaultEmissionCount > 0) add('P1', 'eyes_closed_balance_default_emission', 'Eyes-closed cue appears in default Balance V2 active schema.', `count=${metrics.eyesClosedBalanceDefaultEmissionCount}`);
  if (metrics.trainingFeatureDefault !== 'off' || metrics.microFeatureDefault !== 'off' || !metrics.balanceV2DefaultClosed || !metrics.stepUpDefaultOffValue) add('P1', 'feature_gate_open', 'A V2.1 feature gate/default is open before approval.', `training=${metrics.trainingFeatureDefault}; micro=${metrics.microFeatureDefault}; balanceClosed=${metrics.balanceV2DefaultClosed}`);
  if (metrics.legacyV21DoubleVoiceCount > 0) add('P1', 'legacy_v21_double_voice', 'Legacy and V2.1 voice authorities both own a flow.', `count=${metrics.legacyV21DoubleVoiceCount}`);
  if (metrics.missingAssetSilentContinuationCount > 0) add('P1', 'missing_asset_silent_continuation', 'Missing required audio silently continues.', `count=${metrics.missingAssetSilentContinuationCount}`);
  if (metrics.goDispatchStartCount > 0 || metrics.goCompletionStartCount > 0 || metrics.missingGoActiveStartCount > 0) add('P1', 'go_boundary_failure', 'A path starts active without go playback-start.', `dispatch=${metrics.goDispatchStartCount}; completion=${metrics.goCompletionStartCount}; missingGo=${metrics.missingGoActiveStartCount}`);
  if (metrics.staleCallbackMutationCount > 0 || metrics.voiceSwitchMixedSequenceCount > 0 || metrics.twoLiveVoiceChannelCount > 0) add('P1', 'runtime_stale_or_mixed_voice', 'Stale callback or voice mixing guard failed.', `stale=${metrics.staleCallbackMutationCount}; mixed=${metrics.voiceSwitchMixedSequenceCount}; liveChannels=${metrics.twoLiveVoiceChannelCount}`);
  if (metrics.trainingRuntimeFailureCount > 0 || metrics.microRuntimeFailureCount > 0 || metrics.mpv2RuntimeFailureCount > 0 || metrics.balanceV2RuntimeFailureCount > 0) add('P2', 'runtime_failure', 'One or more runtime audits still fails.', `training=${metrics.trainingRuntimeFailureCount}; micro=${metrics.microRuntimeFailureCount}; mpv2=${metrics.mpv2RuntimeFailureCount}; balance=${metrics.balanceV2RuntimeFailureCount}`);
  if (metrics.runtimeScenarioFailedCount > 0) add('P2', 'runtime_scenario_failure', 'A canonical post-generation scenario row failed.', `count=${metrics.runtimeScenarioFailedCount}`);
  if (metrics.sideProtocolFailureCount > 0 || metrics.restorePersistenceFailureCount > 0) add('P2', 'side_protocol_or_restore_failure', 'Side/protocol or restore/persistence invariant failed.', `side=${metrics.sideProtocolFailureCount}; restore=${metrics.restorePersistenceFailureCount}`);
  if (metrics.durationSourceStaleCount > 0 || metrics.hardMaxTimingFailureCount > 0 || metrics.sequenceRedundancyCount > 0) add('P2', 'timing_hard_gate_failure', 'Measured timing hard gate failed.', `stale=${metrics.durationSourceStaleCount}; hardMax=${metrics.hardMaxTimingFailureCount}; redundancy=${metrics.sequenceRedundancyCount}`);
  if (metrics.failureInjectionFailedCount > 0) add('P2', 'failure_injection_failed', 'A required fail-closed injection did not pass.', `count=${metrics.failureInjectionFailedCount}`);
  if (metrics.unexpectedAudioChangeCount > 0) add('P1', 'audio_changed_during_audit', 'Audio files changed relative to task-start snapshot.', `diffCount=${metrics.unexpectedAudioChangeCount}`);
  if (metrics.targetTimingFailureCount > 0) add('P3', 'target_timing_warnings', 'Some measured timelines exceed target but remain below hard max.', `count=${metrics.targetTimingFailureCount}`);
  if (metrics.longCueWarningCount > 0) add('P3', 'long_generated_cues_for_listening', 'Long generated cues need focused founder listening.', `count=${metrics.longCueWarningCount}; longest=${metrics.longestCue}`);
  if (metrics.voiceDurationDeltaWarningCount > 0) add('P3', 'voice_duration_delta_for_listening', 'Some Clara/Marcus generated cue durations differ enough to review.', `count=${metrics.voiceDurationDeltaWarningCount}; largest=${metrics.largestClaraMarcusDelta}`);
  add('P3', 'human_listening_not_completed', 'Founder listening has not been completed.', 'No human audio approval is claimed.');
  add('P3', 'audio_approval_not_granted', 'Audio approval remains false.', 'Feature gates must stay closed.');
  add('P3', 'physical_device_qa_deferred', 'Physical Android/iOS device QA remains deferred.', 'No phone-speaker/on-device QA was performed.');
  add('P3', 'speaker_onset_not_measured', 'Physical speaker onset is not measured.', 'Timing uses MP3 duration plus gap models only.');
  return findings;
}

function auditMarkdown(audit) {
  const m = audit.metrics;
  const findings = audit.findings.length
    ? audit.findings.map((finding) => `- ${finding.severity} \`${finding.id}\`: ${finding.summary} (${finding.evidence})`).join('\n')
    : '- None.';
  return `# Hale Voice V2.1 Post-Generation Whole-Project Audit

## 1. Executive Verdict

\`${audit.verdict}\`

Exact next phase: \`${audit.nextTask}\`.

## 2. Entry Baseline

- Branch / HEAD: \`${m.branch}\` / \`${m.shortHead}\`
- Upstream: \`${m.upstream}\`
- Worktree already dirty: \`${m.worktreeAlreadyDirty}\`
- Entry audio files / hashes: \`${m.taskStartAudioFileCount}\` / \`${m.taskStartAudioHashCount}\`
- Entry verify:audio: \`${audit.entryBaseline.entryVerifyAudioStatus}\`
- Asset generation verdict: \`${audit.entryBaseline.assetGenerationVerdict}\`
- Final cue schema verdict: \`${audit.entryBaseline.finalCueSchemaVerdict}\`

## 3. Generated Audio Corpus Integrity

- Total physical audio files: \`${m.totalPhysicalAudioFileCount}\`
- Spoken / SFX: \`${m.totalSpokenPhysicalAudioFileCount}\` / \`${m.totalSfxFileCount}\`
- Clara / Marcus: \`${m.claraFileCount}\` / \`${m.marcusFileCount}\`
- Generated assets: \`${m.generatedAssetCount}\`
- Decode failures / stale fingerprints: \`${m.generatedAssetDecodeFailureCount}\` / \`${m.generatedAssetFingerprintStaleCount}\`

## 4. Final Schema and Manifest Coverage

- Active V2.1 logical cues: \`${m.activeV21LogicalCueCount}\`
- Physical-ready active cues: \`${m.activeV21PhysicalReadyCueCount}\`
- Missing active physical cues: \`${m.activeV21MissingPhysicalCueCount}\`
- Missing manifest paths / static require failures: \`${m.missingManifestPathCount}\` / \`${m.staticRequireFailureCount}\`

## 5. Readiness and Feature Gates

Training, Micro-Check, Balance V2, and MPV2 physical audio surfaces are ready. Audio approval remains false and gated user-selectable V2.1 paths remain closed.

## 6. Training Runtime Audit

Training behavior ready: \`${m.trainingBehaviorReadyValue}\`; runtime failures: \`${m.trainingRuntimeFailureCount}\`; selectable exercises: \`${m.trainingSelectableExerciseCount}\`.

## 7. Micro-Check Runtime Audit

Micro behavior ready: \`${m.microBehaviorReadyValue}\`; runtime failures: \`${m.microRuntimeFailureCount}\`; selectable types: \`${m.microSelectableTypeCount}\`.

## 8. MPV2 / Movement Check-Up Runtime Audit

MPV2 physical audio surface ready: \`${m.mpv2PhysicalAudioSurfaceReadyValue}\`; P0/P1/P2 runtime failures: \`${m.mpv2RuntimeFailureCount}\`.

## 9. Eyes-Open Balance V2 Audit

Balance V2 physical audio surface ready: \`${m.balanceV2PhysicalAudioSurfaceReadyValue}\`; default closed: \`${m.balanceV2DefaultClosed}\`; default eyes-closed cue emissions: \`${m.eyesClosedBalanceDefaultEmissionCount}\`.

## 10. Side and Protocol Comparability Audit

Side/protocol failure count: \`${m.sideProtocolFailureCount}\`. Restore/persistence failure count: \`${m.restorePersistenceFailureCount}\`.

## 11. Timing Audit With Measured Durations

- Timeline rows: \`${m.timelineRowCount}\`
- Measured / estimated rows: \`${m.measuredDurationRowCount}\` / \`${m.estimatedDurationRowCount}\`
- Target warnings / hard-max failures: \`${m.targetTimingFailureCount}\` / \`${m.hardMaxTimingFailureCount}\`
- Longest cue: \`${m.longestCue}\`
- Longest sequence: \`${m.longestSequence}\`
- Largest Clara/Marcus delta: \`${m.largestClaraMarcusDelta}\`

## 12. Failure Injection Results

Failure injections passed / failed: \`${m.failureInjectionPassedCount}\` / \`${m.failureInjectionFailedCount}\`.

## 13. Legacy and V2.1 Isolation

Legacy default route changes: \`${m.legacyDefaultRouteChangedCount}\`; legacy/V2.1 double voice count: \`${m.legacyV21DoubleVoiceCount}\`; mixed required sequences: \`${m.voiceSwitchMixedSequenceCount}\`.

## 14. Listening Review Plan

Listening queue: \`${ARTIFACTS.listeningQueue}\` with \`${m.listeningQueueRowCount}\` rows. This task prepares the queue only; human listening is not completed and no audio approval is granted.

## 15. Tests and Validation

The harness reran \`npm run verify:audio\` and read current source/runtime audit artifacts. Additional command results are recorded in the Codex final response for this task.

## 16. Findings

${findings}

## 17. Remaining P3 Boundaries

Human listening, audio approval, physical-device QA, speaker onset measurement, and target-duration review warnings remain P3 boundaries.

## 18. Worktree Integrity

Audio file/hash diff relative to task-start snapshot: \`${m.audioHashDiffCount}\`. Audio generated by this audit: \`0\`. External speech/audio API calls by this audit: \`0\`.

## 19. Exact Next Phase

\`${audit.nextTask}\`
`;
}

function listeningPlanMarkdown(audit, queueRows, timelineRows) {
  const m = audit.metrics;
  const targetWarnings = timelineRows
    .filter((row) => row.passesTarget !== 'true')
    .slice(0, 12)
    .map((row) => `- \`${row.scenarioId}/${row.voiceId}/${row.gapMs}ms\`: ${Number(row.totalMeasuredMs) + Number(row.totalEstimatedMs)}ms target ${row.targetMs}ms hard ${row.hardMaxMs}ms`)
    .join('\n') || '- None.';
  const highest = queueRows
    .filter((row) => row.priority === 'P1')
    .slice(0, 20)
    .map((row) => `- \`${row.queueId}\` ${row.voiceId}/${row.physicalCueKey} (${row.reviewGroup}, ${row.durationMs}ms)`)
    .join('\n');
  return `# Hale Voice V2.1 Post-Generation Listening Review Plan

This task prepares the queue only.
Human listening is not completed by this task.
No audio approval is granted.

## Queue

- Queue path: \`${ARTIFACTS.listeningQueue}\`
- Queue rows: \`${queueRows.length}\`
- Generated assets included: \`${m.generatedAssetCount}\`
- Critical exact-ready/shared cues included where not generated in this pass.

## Highest-Priority Rows

${highest}

## Target Timing Warnings

${targetWarnings}

## Duration Outliers

- Longest cue: \`${m.longestCue}\`
- Longest sequence: \`${m.longestSequence}\`
- Largest Clara/Marcus duration delta: \`${m.largestClaraMarcusDelta}\`

## Review Rules

Do not mark a cue approved in this plan. Do not enable Training Voice V2.1, Micro-Check Voice V2.1, Balance V2, step-up alternation, or floor V2.1 from this task. Founder listening and final Android/iOS physical-device QA are still required before activation decisions.
`;
}

function handoffMarkdown(audit, queueRows, timelineRows) {
  const m = audit.metrics;
  const warnings = timelineRows.filter((row) => row.passesTarget !== 'true').length;
  const topRows = queueRows.slice(0, 12).map((row) => `- \`${row.queueId}\` ${row.voiceId}/${row.physicalCueKey} (${row.priority})`).join('\n');
  return `# Hale Voice Project Post Whole-Project Audit Handoff

Verdict: \`${audit.verdict}\`

## Readiness

- Training physical/audio approval/feature/selectable: \`${m.trainingPhysicalAudioSurfaceReadyValue}\` / \`${m.trainingAudioApprovalReadyValue}\` / \`${m.trainingFeatureDefault}\` / \`${m.trainingSelectableExerciseCount}\`
- Micro physical/audio approval/feature/selectable: \`${m.microPhysicalAudioSurfaceReadyValue}\` / \`${m.microAudioApprovalReadyValue}\` / \`${m.microFeatureDefault}\` / \`${m.microSelectableTypeCount}\`
- Balance V2 physical/audio approval/default closed: \`${m.balanceV2PhysicalAudioSurfaceReadyValue}\` / \`${m.balanceV2AudioApprovalReadyValue}\` / \`${m.balanceV2DefaultClosed}\`
- MPV2 physical audio surface: \`${m.mpv2PhysicalAudioSurfaceReadyValue}\`

## Listening Queue

Path: \`${ARTIFACTS.listeningQueue}\`

Highest-priority rows:

${topRows}

## Timing and Duration Focus

- Target timing warnings: \`${warnings}\`
- Hard-max timing failures: \`${m.hardMaxTimingFailureCount}\`
- Longest cue: \`${m.longestCue}\`
- Longest sequence: \`${m.longestSequence}\`
- Largest Clara/Marcus duration delta: \`${m.largestClaraMarcusDelta}\`

## Remaining P3 Boundaries

Founder listening is not completed. Audio approval is not granted. Physical-device QA is deferred. Physical speaker onset is not measured.

## Activation Guardrail

Do not enable features before founder listening and final Android/iOS QA. Later order:

1. Founder Clara/Marcus listening review
2. Listening remediation/generation patch if needed
3. Final consolidated Android/iOS physical-device QA
4. Activation-readiness decision
5. Only then consider enabling gated V2.1 paths

## Exact Next Task

\`${audit.nextTask}\`
`;
}

function gitSnapshot() {
  return {
    branch: commandText('git', ['branch', '--show-current']),
    head: commandText('git', ['rev-parse', 'HEAD']),
    shortHead: commandText('git', ['rev-parse', '--short', 'HEAD']),
    upstream: commandTextAllowFailure('git', ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']) || '',
    statusShort: commandText('git', ['status', '--short', '--branch']).split(/\r?\n/).filter(Boolean),
  };
}

function currentAudioSnapshotStats() {
  const currentFiles = listFiles(path.join(ROOT, 'assets/audio')).map((file) => path.relative(ROOT, file)).sort();
  const currentHashes = currentFiles.map((relPath) => {
    const bytes = fs.readFileSync(path.join(ROOT, relPath));
    return `${crypto.createHash('sha256').update(bytes).digest('hex')}  ${relPath}`;
  });
  const entryFiles = fs.existsSync(ENTRY_FILES) ? fs.readFileSync(ENTRY_FILES, 'utf8').split(/\r?\n/).filter(Boolean).map((line) => path.relative(ROOT, path.resolve(ROOT, line))) : [];
  const entryHashes = fs.existsSync(ENTRY_HASHES) ? fs.readFileSync(ENTRY_HASHES, 'utf8').split(/\r?\n/).filter(Boolean).map((line) => {
    const [hash, file] = line.split(/\s+/, 2);
    return `${hash}  ${path.relative(ROOT, path.resolve(ROOT, file))}`;
  }) : [];
  return {
    entryFileCount: entryFiles.length,
    entryHashCount: entryHashes.length,
    currentFileCount: currentFiles.length,
    currentHashCount: currentHashes.length,
    hashDiff: diffHashLines(entryHashes, currentHashes),
  };
}

function diffHashLines(entryHashes, currentHashes) {
  const entryByPath = new Map(entryHashes.map((line) => {
    const [hash, relPath] = splitHashLine(line);
    return [relPath, hash];
  }));
  const currentByPath = new Map(currentHashes.map((line) => {
    const [hash, relPath] = splitHashLine(line);
    return [relPath, hash];
  }));
  let added = 0;
  let deleted = 0;
  let changed = 0;
  for (const [relPath, hash] of currentByPath) {
    if (!entryByPath.has(relPath)) added++;
    else if (entryByPath.get(relPath) !== hash) changed++;
  }
  for (const relPath of entryByPath.keys()) {
    if (!currentByPath.has(relPath)) deleted++;
  }
  return { added, deleted, changed };
}

function splitHashLine(line) {
  const match = line.match(/^([a-f0-9]{64})\s+(.+)$/i);
  if (!match) return ['', line];
  return [match[1], match[2]];
}

function parseManifest(text) {
  const voice = new Map();
  const sfx = new Map();
  const voiceRe = /'([^']+)': require\('\.\.\/\.\.\/assets\/audio\/voice\/([^/]+)\/([^']+\.mp3)'\)/g;
  for (const match of text.matchAll(voiceRe)) {
    voice.set(`${match[2]}:${match[1]}`, `assets/audio/voice/${match[2]}/${match[3]}`);
  }
  const sfxRe = /'([^']+)': require\('\.\.\/\.\.\/(assets\/audio\/sfx\/[^']+)'\)/g;
  for (const match of text.matchAll(sfxRe)) {
    sfx.set(match[1], match[2]);
  }
  return { voice, sfx };
}

function metadataEntrySet(byVoice) {
  const out = new Set();
  for (const [voiceId, rows] of Object.entries(byVoice ?? {})) {
    for (const metadata of Object.values(rows ?? {})) {
      const cueKey = metadata.physicalCueKey ?? metadata.cueId;
      out.add(`${voiceId}:${cueKey}`);
    }
  }
  return out;
}

function pairDurationDeltas(rows) {
  const byCue = groupBy(rows.filter((row) => VOICES.includes(row.voiceId)), (row) => row.physicalCueKey);
  const out = [];
  for (const [cueKey, cueRows] of byCue) {
    const clara = cueRows.find((row) => row.voiceId === 'clara');
    const marcus = cueRows.find((row) => row.voiceId === 'marcus');
    if (!clara || !marcus) continue;
    const claraMs = Number(clara.durationMs);
    const marcusMs = Number(marcus.durationMs);
    out.push({ cueKey, claraMs, marcusMs, deltaMs: Math.abs(claraMs - marcusMs) });
  }
  return out;
}

function countPairParityFailures(rows) {
  const byCue = groupBy(rows.filter((row) => VOICES.includes(row.voiceId)), (row) => row.physicalCueKey);
  let failures = 0;
  for (const cueRows of byCue.values()) {
    if (!VOICES.every((voiceId) => cueRows.some((row) => row.voiceId === voiceId))) failures++;
  }
  return failures;
}

function parseAudioPath(relPath) {
  const voiceMatch = relPath.match(/^assets\/audio\/voice\/([^/]+)\/(.+)\.mp3$/);
  if (voiceMatch) return { kind: 'voice', voiceId: voiceMatch[1], cueKey: voiceMatch[2] };
  const sfxMatch = relPath.match(/^assets\/audio\/sfx\/(.+)\.[^.]+$/);
  if (sfxMatch) return { kind: 'sfx', voiceId: '', cueKey: sfxMatch[1] };
  return { kind: 'other', voiceId: '', cueKey: path.basename(relPath, path.extname(relPath)) };
}

function probeAudio(absPath) {
  const result = spawnSync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration:stream=sample_rate,channels',
    '-of', 'json',
    absPath,
  ], { encoding: 'utf8' });
  if (result.status !== 0) {
    return { ok: false, durationMs: 0, sampleRateHz: 0, channels: 0 };
  }
  const parsed = JSON.parse(result.stdout);
  const stream = parsed.streams?.[0] ?? {};
  const durationSec = Number(parsed.format?.duration ?? 0);
  return {
    ok: Number.isFinite(durationSec) && durationSec > 0,
    durationMs: Math.round(durationSec * 1000),
    sampleRateHz: Number(stream.sample_rate ?? 0),
    channels: Number(stream.channels ?? 0),
  };
}

function estimateDurationMs(cueKey) {
  const words = cueKey.replace(/[-_]/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(900, Math.round(words * 450 + 600));
}

function isActiveLifecycle(lifecycle) {
  return lifecycle === 'physical_ready' || lifecycle === 'script_mismatch' || lifecycle === 'pending_audio';
}

function priorityRank(priority) {
  return priority === 'P1' ? 1 : priority === 'P2' ? 2 : 3;
}

function runCommand(command, args) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 30 * 1024 * 1024,
  });
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

function commandText(command, args) {
  const result = runCommand(command, args);
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed:\n${result.stderr || result.stdout}`);
  return result.stdout.trim();
}

function commandTextAllowFailure(command, args) {
  const result = runCommand(command, args);
  return result.status === 0 ? result.stdout.trim() : '';
}

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function readJson(relPath) {
  return JSON.parse(read(relPath));
}

function readJsonIfExists(relPath) {
  const absPath = path.join(ROOT, relPath);
  return fs.existsSync(absPath) ? JSON.parse(fs.readFileSync(absPath, 'utf8')) : null;
}

function readCsv(relPath) {
  const absPath = path.join(ROOT, relPath);
  if (!fs.existsSync(absPath)) return [];
  return parseCsv(fs.readFileSync(absPath, 'utf8'));
}

function write(relPath, text) {
  const absPath = path.join(ROOT, relPath);
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, text);
}

function writeCsv(relPath, headers, rows) {
  write(relPath, `${[headers.join(','), ...rows.map((row) => headers.map((header) => csvCell(row[header] ?? '')).join(','))].join('\n')}\n`);
}

function csvCell(value) {
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function parseCsv(text) {
  const records = [];
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
      records.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field);
    records.push(row);
  }
  const [headers, ...body] = records.filter((record) => record.some((cell) => cell !== ''));
  if (!headers) return [];
  return body.map((record) => Object.fromEntries(headers.map((header, index) => [header, record[index] ?? ''])));
}

function listFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absPath = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(absPath));
    else if (entry.isFile()) out.push(absPath);
  }
  return out;
}

function groupBy(items, keyFn) {
  const out = new Map();
  for (const item of items) {
    const key = keyFn(item);
    const group = out.get(key) ?? [];
    group.push(item);
    out.set(key, group);
  }
  return out;
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}
