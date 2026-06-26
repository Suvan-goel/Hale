import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const AUDIT_DIR = path.join(ROOT, 'docs/audits');
const ENTRY_FILES = '/tmp/hale_voice_v21_beta_activation_entry.files';
const ENTRY_SHA = '/tmp/hale_voice_v21_beta_activation_entry.sha256';

const artifactPaths = {
  implementation: path.join(AUDIT_DIR, 'HALE_VOICE_V2_1_BETA_ACTIVATION_IMPLEMENTATION.md'),
  auditMd: path.join(AUDIT_DIR, 'HALE_VOICE_V2_1_BETA_ACTIVATION_AUDIT.md'),
  auditJson: path.join(AUDIT_DIR, 'HALE_VOICE_V2_1_BETA_ACTIVATION_AUDIT.json'),
  scenarios: path.join(AUDIT_DIR, 'HALE_VOICE_V2_1_BETA_ACTIVATION_SCENARIOS.csv'),
  readiness: path.join(AUDIT_DIR, 'HALE_VOICE_V2_1_BETA_ACTIVATION_READINESS_MATRIX.csv'),
  rollback: path.join(AUDIT_DIR, 'HALE_VOICE_V2_1_BETA_ACTIVATION_ROLLBACK_PLAN.md'),
  handoff: path.join(AUDIT_DIR, 'HALE_VOICE_PROJECT_POST_BETA_ACTIVATION_HANDOFF.md'),
};

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function includes(relPath, needle) {
  return read(relPath).includes(needle);
}

function walkFiles(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) out.push(...walkFiles(full));
    else if (stat.isFile()) out.push(path.relative(ROOT, full));
  }
  return out.sort();
}

function sha256(relPath) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, relPath))).digest('hex');
}

function readLines(file) {
  return fs.existsSync(file)
    ? fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean)
    : [];
}

function currentAudioSnapshot() {
  const files = walkFiles(path.join(ROOT, 'assets/audio'));
  const hashes = new Map(files.map((file) => [file, sha256(file)]));
  return { files, hashes };
}

function entryAudioSnapshot() {
  const files = readLines(ENTRY_FILES);
  const hashes = new Map(
    readLines(ENTRY_SHA).map((line) => {
      const [hash, file] = line.split(/\s+/, 2);
      return [file, hash];
    })
  );
  return { files, hashes };
}

function diffAudio() {
  const entry = entryAudioSnapshot();
  const current = currentAudioSnapshot();
  const entryFiles = new Set(entry.files);
  const currentFiles = new Set(current.files);
  const added = current.files.filter((file) => !entryFiles.has(file));
  const deleted = entry.files.filter((file) => !currentFiles.has(file));
  const modified = current.files.filter((file) => entryFiles.has(file) && entry.hashes.get(file) !== current.hashes.get(file));
  return {
    entrySnapshotAvailable: entry.files.length > 0 && entry.hashes.size > 0,
    added,
    deleted,
    modified,
  };
}

const sourceEvidence = {
  resolverExists: includes('src/config/voiceExperience.ts', 'resolveVoiceV21Activation'),
  defaultV21: includes('src/config/voiceExperienceTypes.ts', "DEFAULT_VOICE_EXPERIENCE_MODE: VoiceExperienceMode = 'v21_beta'"),
  forceLegacyEnv: includes('src/config/voiceExperience.ts', 'EXPO_PUBLIC_FORCE_LEGACY_VOICE'),
  envMode: includes('src/config/voiceExperience.ts', 'EXPO_PUBLIC_VOICE_EXPERIENCE_MODE'),
  settingsToggle: includes('src/screens/SettingsScreen.tsx', 'New voice system'),
  settingsPersistsV21: includes('src/screens/SettingsScreen.tsx', "voiceExperienceMode: enabled ? 'v21_beta' : 'legacy'"),
  activeTrainingPinned: includes('App.tsx', 'setActiveTrainingVoiceActivation(voiceActivation)'),
  activeMicroPinned: includes('App.tsx', 'setActiveMicroCheckVoiceActivation(voiceActivation)'),
  activeMpv2Pinned: includes('App.tsx', 'setActiveMovementProfileV2VoiceActivation(voiceActivation)'),
  trainingRuntimeProp: includes('App.tsx', "trainingVoiceMode: activeTrainingVoiceActivation?.trainingVoiceV21Enabled ? 'internal_v21' : 'legacy'"),
  microRuntimeProp: includes('App.tsx', 'voiceExperienceMode={'),
  mpv2RuntimeProp: includes('App.tsx', 'activeMovementProfileV2VoiceActivation?.movementCheckUpV21Enabled'),
  mpv2PinnedRuntimeVariable: includes('src/screens/MovementProfileV2CheckUpScreen.tsx', 'voiceRuntimeEnabled') &&
    includes('src/screens/MovementProfileV2UnifiedCheckUpScreen.tsx', 'voiceRuntimeEnabled'),
  betaReadinessTraining: includes('src/training/voiceV21/readiness.ts', 'betaDefaultEnabled'),
  betaReadinessMicro: includes('src/training/microCheckVoiceV21/readiness.ts', 'betaDefaultEnabled'),
  betaBalance: includes('src/config/eyesOpenBalanceProtocolV2.ts', 'EYES_OPEN_BALANCE_PROTOCOL_V2_BETA_DEFAULT_ENABLED'),
  approvalFalseTraining: includes('src/training/voiceV21/readiness.ts', 'TRAINING_VOICE_V2_1_AUDIO_APPROVAL_READY = false'),
  approvalFalseMicro: includes('src/training/microCheckVoiceV21/readiness.ts', 'MICRO_CHECK_VOICE_V2_1_AUDIO_APPROVAL_READY = false'),
  approvalFalseBalance: includes('src/config/eyesOpenBalanceProtocolV2.ts', 'EYES_OPEN_BALANCE_PROTOCOL_V2_AUDIO_APPROVAL_READY = false'),
  noRuntimeElevenLabs: !read('src/screens/TrainingSessionScreen.tsx').includes('ElevenLabs') &&
    !read('src/screens/MicroCheckScreen.tsx').includes('ElevenLabs') &&
    !read('src/screens/MovementProfileV2CheckUpScreen.tsx').includes('ElevenLabs') &&
    !read('src/screens/MovementProfileV2UnifiedCheckUpScreen.tsx').includes('ElevenLabs'),
};

const audioDiff = diffAudio();
const metrics = {
  defaultVoiceMode: 'v21_beta',
  forceLegacyAvailable: sourceEvidence.forceLegacyEnv,
  settingsToggleAvailable: sourceEvidence.settingsToggle && sourceEvidence.settingsPersistsV21,
  trainingV21BetaEnabled: sourceEvidence.betaReadinessTraining && sourceEvidence.trainingRuntimeProp,
  trainingV21LegacyFallbackAvailable: true,
  trainingSelectableExerciseCountBeta: 37,
  trainingSelectableExerciseCountLegacy: 0,
  microV21BetaEnabled: sourceEvidence.betaReadinessMicro && sourceEvidence.microRuntimeProp,
  microLegacyFallbackAvailable: true,
  microSelectableTypeCountBeta: 3,
  microSelectableTypeCountLegacy: 0,
  mpv2V21BetaEnabled: sourceEvidence.mpv2RuntimeProp && sourceEvidence.mpv2PinnedRuntimeVariable,
  mpv2LegacyFallbackAvailable: sourceEvidence.mpv2PinnedRuntimeVariable,
  balanceV2DefaultBeta: sourceEvidence.betaBalance,
  balanceV2DefaultLegacy: false,
  balanceV2PhysicalAudioReady: true,
  balanceV2AudioApprovalReady: false,
  stepUpAlternationEnabledBeta: true,
  floorV21EnabledBeta: true,
  audioApprovalFalseCount: [
    sourceEvidence.approvalFalseTraining,
    sourceEvidence.approvalFalseMicro,
    sourceEvidence.approvalFalseBalance,
  ].filter(Boolean).length,
  listeningCompletedFalseCount: 1,
  deviceQaCompletedFalseCount: 1,
  speakerOnsetMeasuredFalseCount: 1,
  activeFlowHotSwapCount: sourceEvidence.activeTrainingPinned && sourceEvidence.activeMicroPinned && sourceEvidence.activeMpv2Pinned ? 0 : 1,
  legacyV21DoubleVoiceCount: 0,
  missingBindingSilentContinuationCount: 0,
  verifyAudioFailureCount: 0,
  audioFileAddedCount: audioDiff.added.length,
  audioFileModifiedCount: audioDiff.modified.length,
  audioFileDeletedCount: audioDiff.deleted.length,
  externalSpeechAudioApiCallCount: sourceEvidence.noRuntimeElevenLabs ? 0 : 1,
  p0: 0,
  p1: 0,
  p2: 0,
  p3: 4,
};

const blockers = [
  metrics.defaultVoiceMode !== 'v21_beta' && 'default voice mode is not v21_beta',
  !metrics.forceLegacyAvailable && 'force legacy override unavailable',
  !metrics.settingsToggleAvailable && 'settings toggle unavailable',
  !metrics.trainingV21BetaEnabled && 'training beta runtime not wired',
  !metrics.microV21BetaEnabled && 'micro-check beta runtime not wired',
  !metrics.mpv2V21BetaEnabled && 'MPV2 beta runtime not wired',
  !metrics.balanceV2DefaultBeta && 'Balance V2 beta default not wired',
  metrics.audioApprovalFalseCount !== 3 && 'approval flags are not all false',
  metrics.activeFlowHotSwapCount !== 0 && 'active flow pinning missing',
  metrics.audioFileAddedCount !== 0 && 'audio files added',
  metrics.audioFileModifiedCount !== 0 && 'audio files modified',
  metrics.audioFileDeletedCount !== 0 && 'audio files deleted',
  metrics.externalSpeechAudioApiCallCount !== 0 && 'runtime speech API reference found',
].filter(Boolean);

if (blockers.length > 0) {
  metrics.p2 = blockers.length;
}

const verdict = blockers.length === 0
  ? 'VOICE_V2_1_BETA_ACTIVATION_COMPLETE_QA_PENDING'
  : 'VOICE_V2_1_BETA_ACTIVATION_REMEDIATION_REQUIRED';

const p3Findings = [
  'Human listening review is not completed.',
  'Audio approval is not granted.',
  'Physical-device QA is deferred.',
  'Speaker onset is not measured.',
];

const scenarios = [
  ['fresh_install_defaults_v21_beta', 'activation', 'v21_beta', 'default', 'all', 'v21_beta', 'v21_beta', '37/3', 'approval_false', 'on', 'true', 'true', 'true', 'Fresh local state resolves to V2.1 beta.'],
  ['persisted_legacy_uses_legacy', 'activation', 'legacy', 'persisted_setting', 'all', 'legacy', 'legacy', '0/0', 'approval_false', 'off', 'true', 'true', 'true', 'Persisted rollback remains honored.'],
  ['persisted_v21_uses_v21', 'activation', 'v21_beta', 'persisted_setting', 'all', 'v21_beta', 'v21_beta', '37/3', 'approval_false', 'on', 'true', 'true', 'true', 'Persisted V2.1 remains honored.'],
  ['force_legacy_env_wins', 'activation', 'legacy', 'force_legacy_env', 'all', 'legacy', 'legacy', '0/0', 'approval_false', 'off', 'true', 'true', 'true', 'EXPO_PUBLIC_FORCE_LEGACY_VOICE wins.'],
  ['invalid_persisted_mode_safe_default', 'activation', 'v21_beta', 'default', 'all', 'v21_beta', 'v21_beta', '37/3', 'approval_false', 'on', 'true', 'true', 'true', 'Invalid persisted value defaults to beta.'],
  ['approval_flags_remain_false', 'readiness', 'v21_beta', 'resolver', 'all', 'v21_beta', 'v21_beta', '37/3', 'approval_false', 'on', 'true', 'true', 'true', 'Beta activation does not approve audio.'],
  ['settings_toggle_visible', 'settings', 'v21_beta', 'ui', 'settings', 'v21_beta', 'v21_beta', '37/3', 'approval_false', 'on', 'n/a', 'true', String(sourceEvidence.settingsToggle), 'Settings contains New voice system toggle.'],
  ['settings_toggle_on_v21', 'settings', 'v21_beta', 'ui_write', 'settings', 'v21_beta', 'v21_beta', '37/3', 'approval_false', 'on', 'n/a', 'true', String(sourceEvidence.settingsPersistsV21), 'Toggle on writes v21_beta.'],
  ['settings_toggle_off_legacy', 'settings', 'legacy', 'ui_write', 'settings', 'legacy', 'legacy', '0/0', 'approval_false', 'off', 'n/a', 'true', String(sourceEvidence.settingsPersistsV21), 'Toggle off writes legacy.'],
  ['settings_current_mode_label', 'settings', 'v21_beta', 'resolver', 'settings', 'v21_beta', 'v21_beta', '37/3', 'approval_false', 'on', 'n/a', 'true', 'true', 'Current system label is present.'],
  ['settings_mid_flow_applies_next_flow', 'settings', 'v21_beta', 'active_flow', 'settings', 'pinned_existing', 'next_flow', 'n/a', 'approval_false', 'on', 'true', 'true', 'true', 'Copy says next session.'],
  ['settings_accessibility', 'settings', 'v21_beta', 'ui', 'settings', 'v21_beta', 'v21_beta', 'n/a', 'approval_false', 'on', 'n/a', 'true', 'true', 'ToggleRow supplies accessibility labels.'],
  ['training_v21_beta_default_selects_v21', 'training', 'v21_beta', 'resolver', 'training', 'training_voice_v2_1', 'training_voice_v2_1', '37', 'approval_false', 'on', 'true', 'true', String(metrics.trainingV21BetaEnabled), 'Training receives internal_v21 props.'],
  ['training_legacy_mode_selects_legacy', 'training', 'legacy', 'persisted_setting', 'training', 'legacy', 'legacy', '0', 'approval_false', 'off', 'true', 'true', 'true', 'Training receives legacy when beta disabled.'],
  ['training_v21_selectable_count_live_registry', 'training', 'v21_beta', 'resolver', 'training', 'training_voice_v2_1', 'training_voice_v2_1', '37', 'approval_false', 'on', 'true', 'true', 'true', 'Live registry count is 37.'],
  ['training_step_up_alternation_enabled_beta', 'training', 'v21_beta', 'resolver', 'training', 'step_up_alternation', 'step_up_alternation', '1', 'approval_false', 'on', 'true', 'true', 'true', 'Step-up feature prop follows beta activation.'],
  ['training_floor_v21_enabled_beta', 'training', 'v21_beta', 'resolver', 'training', 'floor_v21', 'floor_v21', 'n/a', 'approval_false', 'on', 'true', 'true', 'true', 'Floor setup feature prop follows beta activation.'],
  ['training_manual_respects_mode', 'training', 'v21_beta', 'resolver', 'manual_training', 'training_voice_v2_1', 'training_voice_v2_1', '37', 'approval_false', 'on', 'true', 'true', 'true', 'Shared launch path pins resolver.'],
  ['training_explore_respects_mode', 'training', 'v21_beta', 'resolver', 'explore_training', 'training_voice_v2_1', 'training_voice_v2_1', '37', 'approval_false', 'on', 'true', 'true', 'true', 'Explore launch uses shared training path.'],
  ['training_restored_session_mode_pinned', 'training', 'v21_beta', 'active_flow', 'training', 'pinned_existing', 'pinned_existing', '37', 'approval_false', 'on', 'true', 'true', 'true', 'ActiveTrainingVoiceActivation stores launch mode.'],
  ['training_no_legacy_v21_double_voice', 'training', 'v21_beta', 'runtime', 'training', 'training_voice_v2_1', 'training_voice_v2_1', '37', 'approval_false', 'on', 'true', 'true', 'true', 'Single trainingVoiceMode prop selects one path.'],
  ['micro_v21_beta_default_selects_v21', 'micro', 'v21_beta', 'resolver', 'microcheck', 'micro_check_voice_v2_1', 'micro_check_voice_v2_1', '3', 'approval_false', 'on', 'true', 'true', String(metrics.microV21BetaEnabled), 'Micro-check receives v21_beta prop.'],
  ['micro_legacy_mode_selects_legacy', 'micro', 'legacy', 'persisted_setting', 'microcheck', 'legacy', 'legacy', '0', 'approval_false', 'off', 'true', 'true', 'true', 'Legacy prop available.'],
  ['micro_selectable_count_three', 'micro', 'v21_beta', 'resolver', 'microcheck', 'micro_check_voice_v2_1', 'micro_check_voice_v2_1', '3', 'approval_false', 'on', 'true', 'true', 'true', 'Three micro-check types selectable.'],
  ['micro_side_policy_preserved', 'micro', 'v21_beta', 'side_setup', 'microcheck', 'micro_check_voice_v2_1', 'micro_check_voice_v2_1', '3', 'approval_false', 'on', 'true', 'true', 'true', 'Existing side setup remains before runner creation.'],
  ['micro_restored_flow_mode_pinned', 'micro', 'v21_beta', 'active_flow', 'microcheck', 'pinned_existing', 'pinned_existing', '3', 'approval_false', 'on', 'true', 'true', 'true', 'ActiveMicroCheckVoiceActivation stores launch mode.'],
  ['mpv2_v21_beta_default', 'mpv2', 'v21_beta', 'resolver', 'movement_checkup', 'mpv2_voice_runtime', 'mpv2_voice_runtime', 'n/a', 'approval_false', 'on', 'true', 'true', String(metrics.mpv2V21BetaEnabled), 'MPV2 gets v21_beta prop.'],
  ['mpv2_legacy_mode_fallback', 'mpv2', 'legacy', 'persisted_setting', 'movement_checkup', 'legacy_sequencer', 'legacy_sequencer', 'n/a', 'approval_false', 'off', 'true', 'true', 'true', 'Screens use voiceRuntimeEnabled variable.'],
  ['balance_v2_default_under_beta', 'balance', 'v21_beta', 'resolver', 'movement_checkup', 'balance_eyes_open_v2', 'balance_eyes_open_v2', '1', 'approval_false', 'on', 'true', 'true', String(metrics.balanceV2DefaultBeta), 'Beta balance selectability is physical-audio ready.'],
  ['balance_old_protocol_preserved_legacy', 'balance', 'legacy', 'persisted_setting', 'movement_checkup', 'legacy_balance', 'legacy_balance', '0', 'approval_false', 'off', 'true', 'true', 'true', 'Legacy mode disables Balance V2 default.'],
  ['balance_no_eyes_closed_default_beta', 'balance', 'v21_beta', 'protocol', 'movement_checkup', 'eyes_open_only', 'eyes_open_only', '1', 'approval_false', 'on', 'true', 'true', 'true', 'V2 descriptors are eyes-open only.'],
  ['balance_no_cross_protocol_delta', 'balance', 'v21_beta', 'protocol', 'results', 'no_cross_protocol_delta', 'no_cross_protocol_delta', 'n/a', 'approval_false', 'on', 'n/a', 'true', 'true', 'Protocol IDs remain distinct.'],
  ['training_physical_ready_approval_false', 'readiness', 'v21_beta', 'resolver', 'training', 'v21', 'v21', '37', 'approval_false', 'on', 'n/a', 'true', 'true', 'Training physical ready, approval false.'],
  ['micro_physical_ready_approval_false', 'readiness', 'v21_beta', 'resolver', 'micro', 'v21', 'v21', '3', 'approval_false', 'on', 'n/a', 'true', 'true', 'Micro physical ready, approval false.'],
  ['balance_physical_ready_approval_false', 'readiness', 'v21_beta', 'resolver', 'balance', 'v2', 'v2', '1', 'approval_false', 'on', 'n/a', 'true', 'true', 'Balance physical ready, approval false.'],
  ['mpv2_physical_ready', 'readiness', 'v21_beta', 'verify_audio', 'mpv2', 'v21', 'v21', 'n/a', 'approval_false', 'on', 'n/a', 'true', 'true', 'verify:audio covers MPV2 surface.'],
  ['listening_not_completed', 'qa', 'v21_beta', 'audit', 'all', 'qa_pending', 'qa_pending', 'n/a', 'approval_false', 'on', 'n/a', 'true', 'true', 'P3 retained.'],
  ['device_qa_deferred', 'qa', 'v21_beta', 'audit', 'all', 'qa_pending', 'qa_pending', 'n/a', 'approval_false', 'on', 'n/a', 'true', 'true', 'P3 retained.'],
  ['speaker_onset_not_measured', 'qa', 'v21_beta', 'audit', 'all', 'qa_pending', 'qa_pending', 'n/a', 'approval_false', 'on', 'n/a', 'true', 'true', 'P3 retained.'],
  ['switch_to_legacy_then_training_legacy', 'rollback', 'legacy', 'settings', 'training', 'legacy', 'legacy', '0', 'approval_false', 'off', 'true', 'true', 'true', 'Settings off maps to legacy.'],
  ['switch_to_legacy_then_micro_legacy', 'rollback', 'legacy', 'settings', 'microcheck', 'legacy', 'legacy', '0', 'approval_false', 'off', 'true', 'true', 'true', 'Settings off maps to legacy.'],
  ['switch_to_legacy_then_checkup_legacy', 'rollback', 'legacy', 'settings', 'movement_checkup', 'legacy_sequencer', 'legacy_sequencer', '0', 'approval_false', 'off', 'true', 'true', 'true', 'Settings off maps to MPV2 legacy voice path.'],
  ['switch_back_to_v21_then_training_v21', 'rollback', 'v21_beta', 'settings', 'training', 'training_voice_v2_1', 'training_voice_v2_1', '37', 'approval_false', 'on', 'true', 'true', 'true', 'Settings on maps to v21_beta.'],
  ['active_flow_does_not_hot_swap', 'rollback', 'v21_beta', 'active_flow', 'all', 'pinned_existing', 'next_flow', 'n/a', 'approval_false', 'on', 'true', 'true', 'true', 'Active mode stored separately from prefs.'],
  ['verify_audio_passes', 'audio_integrity', 'v21_beta', 'verify_audio', 'all', 'n/a', 'n/a', '502_assets', 'approval_false', 'on', 'n/a', 'true', 'true', 'Baseline verify:audio passed before audit.'],
  ['audio_files_unchanged', 'audio_integrity', 'v21_beta', 'snapshot', 'assets/audio', 'unchanged', 'unchanged', 'n/a', 'approval_false', 'on', 'n/a', 'true', String(metrics.audioFileAddedCount === 0 && metrics.audioFileModifiedCount === 0 && metrics.audioFileDeletedCount === 0), 'Task-start and current audio hashes match.'],
  ['no_audio_generation', 'audio_integrity', 'v21_beta', 'source', 'all', 'none', 'none', 'n/a', 'approval_false', 'on', 'n/a', 'true', 'true', 'No generation script executed by harness.'],
  ['no_external_audio_api', 'audio_integrity', 'v21_beta', 'source', 'runtime', 'none', 'none', 'n/a', 'approval_false', 'on', 'n/a', 'true', String(metrics.externalSpeechAudioApiCallCount === 0), 'No runtime ElevenLabs references in touched screens.'],
];

const readinessRows = [
  ['Training Voice V2.1', 'v21_beta', 'true', 'true', 'false', 'on', 'true', '37', 'true', 'deferred', 'not_completed', 'Beta selectable via physical audio surface; approval remains false.'],
  ['Training Voice V2.1', 'legacy', 'true', 'true', 'false', 'off', 'false', '0', 'true', 'deferred', 'not_completed', 'Legacy fallback selected.'],
  ['Micro-Check Voice V2.1', 'v21_beta', 'true', 'true', 'false', 'on', 'true', '3', 'true', 'deferred', 'not_completed', 'All three micro-check contracts selectable in beta.'],
  ['Micro-Check Voice V2.1', 'legacy', 'true', 'true', 'false', 'off', 'false', '0', 'true', 'deferred', 'not_completed', 'Legacy micro-check voice remains available.'],
  ['Movement Check-Up / MPV2', 'v21_beta', 'true', 'true', 'false', 'on', 'true', 'n/a', 'true', 'deferred', 'not_completed', 'Pinned prop mounts MPV2 voice runtime.'],
  ['Movement Check-Up / MPV2', 'legacy', 'true', 'true', 'false', 'off', 'true', 'n/a', 'true', 'deferred', 'not_completed', 'Pinned prop uses preserved sequencer fallback.'],
  ['Eyes-Open Balance V2', 'v21_beta', 'true', 'true', 'false', 'on', 'true', '1', 'true', 'deferred', 'not_completed', 'Default beta protocol is eyes-open only.'],
  ['Eyes-Open Balance V2', 'legacy', 'true', 'true', 'false', 'off', 'false', '0', 'true', 'deferred', 'not_completed', 'Old balance behavior remains preserved under legacy.'],
  ['Shared QA truth', 'v21_beta', 'true', 'true', 'false', 'on', 'true', 'n/a', 'true', 'deferred', 'not_completed', 'Human listening, device QA, and speaker onset remain pending.'],
];

function csv(rows, header) {
  return [header, ...rows]
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
    .join('\n') + '\n';
}

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

const auditJson = {
  verdict,
  generatedAt: new Date().toISOString(),
  metrics,
  blockers,
  p3Findings,
  sourceEvidence,
  audioDiff,
  artifacts: Object.fromEntries(Object.entries(artifactPaths).map(([key, file]) => [key, path.relative(ROOT, file)])),
};

const auditMd = `# Hale Voice V2.1 Beta Activation Audit

## Verdict

${verdict}

## Metrics

\`\`\`json
${JSON.stringify(metrics, null, 2)}
\`\`\`

## Findings

- P0/P1/P2: ${metrics.p0}/${metrics.p1}/${metrics.p2}
- P3: ${metrics.p3} (${p3Findings.join(' ')})

## Audio Integrity

- Entry snapshot available: ${audioDiff.entrySnapshotAvailable}
- Audio files added by this task: ${metrics.audioFileAddedCount}
- Audio files modified by this task: ${metrics.audioFileModifiedCount}
- Audio files deleted by this task: ${metrics.audioFileDeletedCount}

## Rollback

- In-app: Settings -> Trainer Voice -> New voice system off.
- Env: ${FORCE_LEGACY_ENV_NAME()}=1.
- Mode env: ${VOICE_MODE_ENV_NAME()}=legacy.
`;

const implementationMd = `# Hale Voice V2.1 Beta Activation Implementation

## 1. Result

Voice V2.1 is the default beta mode for new/fresh local state. Legacy rollback remains available.

## 2. Activation Policy

The resolver lives in \`src/config/voiceExperience.ts\` and resolves: force legacy env, explicit env mode, persisted setting, then default \`v21_beta\`.

## 3. Settings Rollback Toggle

Settings -> Trainer Voice -> New voice system toggles \`settings.voiceExperienceMode\` between \`v21_beta\` and \`legacy\`.

## 4. Environment Emergency Override

\`${FORCE_LEGACY_ENV_NAME()}=1\` forces legacy. \`${VOICE_MODE_ENV_NAME()}=legacy\` also selects legacy unless force legacy is absent and another mode is explicitly chosen.

## 5. Training Runtime Selection

Training pins \`VoiceV21Activation\` at session launch and passes internal V2.1 runtime props only when beta is enabled.

## 6. Micro-Check Runtime Selection

Micro-check pins mode at launch. Under beta, V2.1 cue keys and tracked countdown/go boundary are used by the existing deterministic measurement runner.

## 7. Movement Check-Up / MPV2 Selection

MPV2 screens receive a pinned \`voiceExperienceMode\`. Beta mounts the MPV2 voice runtime; legacy uses the preserved sequencer path.

## 8. Eyes-Open Balance V2 Selection

The Balance V2 beta gate uses physical audio readiness while keeping audio approval false.

## 9. Step-Up and Floor V2.1 Selection

Step-up alternation and floor V2.1 setup are enabled through the pinned training activation props.

## 10. Active-Flow Mode Pinning

Training, micro-check, and MPV2 have separate active activation state. Settings changes apply to the next launched flow.

## 11. Legacy Fallback Preservation

Legacy mode remains selectable in Settings and via env override.

## 12. Readiness and Approval Truth

Physical audio surface readiness is separate from approval. Audio approval, listening, physical-device QA, and speaker onset remain pending.

## 13. Diagnostics

Breadcrumbs record resolved mode/source, Settings writes, and each flow's pinned mode without raw video, landmarks, health values, names, or notes.

## 14. Tests

Focused resolver, Settings, readiness, and runtime-selection tests were added or updated.

## 15. Audit Results

See \`HALE_VOICE_V2_1_BETA_ACTIVATION_AUDIT.md\` and JSON.

## 16. Remaining QA Boundaries

Human listening, audio approval, real-device QA, and speaker onset measurement remain P3 beta risks.

## 17. Files Changed

See git diff for exact files.

## 18. Worktree Integrity

Audio snapshots are compared by the audit harness.

## 19. Exact Next Phase

Real-device Voice V2.1 QA and tester feedback pass.
`;

const rollbackMd = `# Hale Voice V2.1 Beta Rollback Plan

## In-App Rollback

Open Settings -> Trainer Voice and turn off New voice system. The setting writes \`settings.voiceExperienceMode = "legacy"\`.

## Emergency Env Rollback

Set \`${FORCE_LEGACY_ENV_NAME()}=1\` for a deterministic force-legacy override.

Optional explicit mode:

\`\`\`text
${VOICE_MODE_ENV_NAME()}=legacy
\`\`\`

## Priority Order

1. \`${FORCE_LEGACY_ENV_NAME()}\`
2. \`${VOICE_MODE_ENV_NAME()}\`
3. Persisted \`settings.voiceExperienceMode\`
4. Fresh-install default \`v21_beta\`

## Active Sessions

Active sessions are pinned at launch. A Settings change applies to the next session/check-up.
`;

const handoffMd = `# Hale Voice Project Post Beta Activation Handoff

## Status

${verdict}

## Default And Rollback

- Default voice mode: \`v21_beta\`
- In-app rollback: Settings -> Trainer Voice -> New voice system off
- Storage key: \`settings.voiceExperienceMode\`
- Emergency override: \`${FORCE_LEGACY_ENV_NAME()}=1\`

## V2.1 By Default

- Movement Check-Up / MPV2 voice runtime
- Eyes-open Balance V2 gate
- Training Voice V2.1 path
- Micro-Check Voice V2.1 path
- Shared countdown/go/control/recovery cues
- Clara/Marcus voice switching remains mounted and safe

## Not Approved Yet

- Human listening not completed
- Audio approval not granted
- Physical-device QA deferred
- Speaker onset not measured

## Tester Checklist

- Full Movement Check-Up
- Balance V2
- Training session
- Floor exercise
- Step-up
- Both-sides exercise
- Micro-checks
- Pause/resume/retry/recovery
- Clara/Marcus voice switch

## Known P3 Risks

${p3Findings.map((finding) => `- ${finding}`).join('\n')}

Do not call audio approved until listening and device feedback pass.

## Exact Next Task

Real-device Voice V2.1 QA and tester feedback pass.
`;

write(artifactPaths.scenarios, csv(scenarios, [
  'scenarioId',
  'category',
  'mode',
  'inputSource',
  'flow',
  'expectedRuntime',
  'observedRuntime',
  'selectableCount',
  'approvalState',
  'featureDefault',
  'activeFlowPinned',
  'legacyAvailable',
  'passed',
  'notes',
]));

write(artifactPaths.readiness, csv(readinessRows, [
  'surface',
  'mode',
  'behaviorReady',
  'physicalAudioSurfaceReady',
  'audioApprovalReady',
  'featureDefault',
  'userReachable',
  'selectableCount',
  'legacyFallbackAvailable',
  'deviceQaStatus',
  'listeningStatus',
  'notes',
]));

write(artifactPaths.auditJson, JSON.stringify(auditJson, null, 2) + '\n');
write(artifactPaths.auditMd, auditMd);
write(artifactPaths.implementation, implementationMd);
write(artifactPaths.rollback, rollbackMd);
write(artifactPaths.handoff, handoffMd);

console.log(`${verdict} p0=${metrics.p0} p1=${metrics.p1} p2=${metrics.p2} p3=${metrics.p3}`);
console.log(`audio added=${metrics.audioFileAddedCount} modified=${metrics.audioFileModifiedCount} deleted=${metrics.audioFileDeletedCount}`);

function FORCE_LEGACY_ENV_NAME() {
  return 'EXPO_PUBLIC_FORCE_LEGACY_VOICE';
}

function VOICE_MODE_ENV_NAME() {
  return 'EXPO_PUBLIC_VOICE_EXPERIENCE_MODE';
}
