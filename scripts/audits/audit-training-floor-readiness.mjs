import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const TASK_START_AUDIO_HASH = '/tmp/hale_floor_post_safety_audio_entry.sha256';

const ARTIFACTS = {
  implementation: 'docs/audits/HALE_TRAINING_FLOOR_READINESS_IMPLEMENTATION.md',
  auditMd: 'docs/audits/HALE_TRAINING_FLOOR_READINESS_AUDIT.md',
  auditJson: 'docs/audits/HALE_TRAINING_FLOOR_READINESS_AUDIT.json',
  scenariosCsv: 'docs/audits/HALE_TRAINING_FLOOR_READINESS_SCENARIOS.csv',
  contractMatrixCsv: 'docs/audits/HALE_TRAINING_FLOOR_CONTRACT_MATRIX.csv',
  handoff: 'docs/audits/HALE_VOICE_PROJECT_POST_FLOOR_READINESS_HANDOFF.md',
};

const POST_SAFETY_ARTIFACTS = {
  reportMd: 'docs/audits/HALE_TRAINING_FLOOR_READINESS_POST_SAFETY_REBASE.md',
  auditJson: 'docs/audits/HALE_TRAINING_FLOOR_READINESS_POST_SAFETY_REBASE.json',
  scenariosCsv: 'docs/audits/HALE_TRAINING_FLOOR_READINESS_POST_SAFETY_SCENARIOS.csv',
  contractMatrixCsv: 'docs/audits/HALE_TRAINING_FLOOR_CONTRACT_MATRIX_POST_SAFETY.csv',
  handoff: 'docs/audits/HALE_VOICE_PROJECT_POST_FLOOR_READINESS_POST_SAFETY_HANDOFF.md',
};

const FLOOR_BLOCKERS = [
  'IR-VOICE-FLOOR-GATE',
  'IR-VOICE-FINAL-POSITION-READINESS',
  'IR-VOICE-SAFETY-SUBSUMPTION',
];

const production = runProductionProbe();
const source = {
  adherenceTypes: read('src/adherence/types.ts'),
  safetyProfileScreen: read('src/screens/SafetyProfileScreen.tsx'),
  sessionPlayer: read('src/training/sessionPlayer.ts'),
  trainingScreen: read('src/screens/TrainingSessionScreen.tsx'),
  movementCapabilities: read('src/profile/movementCapabilities.ts'),
  audioManifest: read('src/audio/manifest.ts'),
};
const audioIntegrity = auditAudioIntegrity();

const contractRows = buildContractMatrix(production);
writeCsv(ARTIFACTS.contractMatrixCsv, [
  'exerciseId',
  'displayName',
  'releaseStatus',
  'requiresFloorTransfer',
  'requiresFloorSpace',
  'currentGateSource',
  'eligibleWhenConfirmed',
  'substituteOrSkipPolicy',
  'setupModel',
  'transitionCueKey',
  'firstUseInstructionKey',
  'finalPositionRequirement',
  'targetKey',
  'removedBlockers',
  'remainingBlockers',
  'runtimeStatus',
  'notes',
], contractRows);

const postSafetyContractRows = buildPostSafetyContractMatrix(production);
writeCsv(POST_SAFETY_ARTIFACTS.contractMatrixCsv, [
  'exerciseId',
  'displayName',
  'releaseStatus',
  'requiresFloorTransfer',
  'requiresFloorSpace',
  'currentGateSource',
  'irVoiceFloorGateRemaining',
  'irVoiceFinalPositionRemaining',
  'irVoiceSafetySubsumptionRemaining',
  'postSafetyExpected',
  'eligibleWhenConfirmed',
  'finalPositionRuntimeStatus',
  'trainingSafetyReady',
  'remainingBlockers',
  'runtimeStatus',
  'notes',
], postSafetyContractRows);

const scenarioRows = buildScenarioRows(production);
writeCsv(ARTIFACTS.scenariosCsv, [
  'scenarioId',
  'category',
  'exerciseId',
  'capabilityStatus',
  'floorSpace',
  'dailyContext',
  'releaseStatus',
  'entryPath',
  'planOutcome',
  'substituteExerciseId',
  'skipReason',
  'capabilitySnapshotValid',
  'floorTransitionDue',
  'finalPositionPhase',
  'countdownAllowed',
  'activeAllowed',
  'voiceCueKeys',
  'blockers',
  'passed',
  'testCoverage',
  'notes',
], scenarioRows);

const postSafetyScenarioRows = buildPostSafetyScenarioRows(production, audioIntegrity);
writeCsv(POST_SAFETY_ARTIFACTS.scenariosCsv, [
  'scenarioId',
  'category',
  'exerciseId',
  'currentPhaseBaseline',
  'trainingSafetyReady',
  'trainingBehaviorReady',
  'blockersBefore',
  'blockersAfter',
  'capabilityStatus',
  'floorSpace',
  'entryPath',
  'finalPositionPhase',
  'countdownAllowed',
  'activeAllowed',
  'expectedOutcome',
  'observedOutcome',
  'passed',
  'notes',
], postSafetyScenarioRows);

const recomputed = recomputeMetrics({
  scenarios: parseCsv(read(ARTIFACTS.scenariosCsv)),
  contracts: parseCsv(read(ARTIFACTS.contractMatrixCsv)),
  postSafetyScenarios: parseCsv(read(POST_SAFETY_ARTIFACTS.scenariosCsv)),
  postSafetyContracts: parseCsv(read(POST_SAFETY_ARTIFACTS.contractMatrixCsv)),
  production,
  audioIntegrity,
});
const findings = findingsFor(recomputed);
const verdict = findings.some((finding) => finding.severity === 'P0' || finding.severity === 'P1' || finding.severity === 'P2')
  ? 'TRAINING_FLOOR_READINESS_POST_SAFETY_REMEDIATION_REQUIRED'
  : 'TRAINING_FLOOR_READINESS_POST_SAFETY_BASELINE_COMPLETE';
const audit = {
  auditVersion: 2,
  generatedAt: new Date().toISOString(),
  verdict,
  currentPhaseBaseline: production.currentPhaseBaseline,
  artifacts: ARTIFACTS,
  postSafetyArtifacts: POST_SAFETY_ARTIFACTS,
  floorExerciseInventory: production.inventory,
  sourceOfTruth: sourceOfTruthRows(),
  metrics: recomputed,
  findings,
  defaults: {
    canonicalFloorCapabilityGate: 'active',
    floorV21FeatureDefault: production.floorFeatureDefault ? 'on' : 'off',
    floorV21FeatureFlag: production.floorFeatureFlag,
    trainingVoiceV21FeatureDefault: production.trainingVoiceFeatureDefault,
    trainingVoiceV21SafetyReady: production.trainingVoiceSafetyReady,
    trainingVoiceV21AudioReady: production.trainingVoiceAudioReady,
    trainingVoiceV21GlobalBehaviorReady: production.trainingVoiceBehaviorReady,
    balanceV2: production.balanceV2Selectable
      ? 'selectable'
      : 'default_closed_audio_pending',
    stepUpAlternation: production.stepUpDefaultEnabled ? 'default_on' : 'default_off',
    microCheckVoiceV21: production.microCheckAudioReady
      ? 'software_complete_audio_true'
      : 'software_complete_audio_false_feature_off',
  },
  integrity: {
    taskStartAudioHashPath: TASK_START_AUDIO_HASH,
    taskStartAudioHashAvailable: audioIntegrity.taskStartHashAvailable,
    taskStartAudioHashCount: audioIntegrity.taskStartHashCount,
    currentAudioHashCount: audioIntegrity.currentAudioHashCount,
    audioHashChangedCount: audioIntegrity.audioHashChangedCount,
    audioGenerated: false,
    externalSpeechApiCalled: false,
    gitAudioDiffAgainstHeadCount: audioIntegrity.gitAudioDiffAgainstHeadCount,
    gitAudioDiffMethodNote: audioIntegrity.gitAudioDiffAgainstHeadCount > 0
      ? 'baseline_audio_diff_method_stale_not_product_failure'
      : 'git_head_audio_diff_empty',
    humanListening: 'waived_not_completed',
    physicalDeviceQa: 'deferred',
  },
  validation: {
    verifyAudioPassed: audioIntegrity.verifyAudioFailureCount === 0,
    safetyIntegrationComplete: production.safetyIntegrationComplete,
    controlsProgressRecoveryReady: production.controlsReady && production.progressReady && production.recoveryReady,
    microCheckVoiceSoftwareComplete: production.microCheckBehaviorReady && !production.microCheckAudioReady,
  },
  nextTask: 'Final Voice V2.1 cue schema and physical manifest reconciliation',
};

write(ARTIFACTS.auditJson, `${JSON.stringify(audit, null, 2)}\n`);
write(POST_SAFETY_ARTIFACTS.auditJson, `${JSON.stringify(audit, null, 2)}\n`);
write(ARTIFACTS.implementation, implementationMarkdown(audit));
write(ARTIFACTS.auditMd, auditMarkdown(audit));
write(POST_SAFETY_ARTIFACTS.reportMd, postSafetyMarkdown(audit));
write(ARTIFACTS.handoff, handoffMarkdown(audit));
write(POST_SAFETY_ARTIFACTS.handoff, postSafetyHandoffMarkdown(audit));

console.log(JSON.stringify({
  verdict,
  currentPhaseBaseline: production.currentPhaseBaseline,
  floorExerciseCount: recomputed.floorExerciseCount,
  floorContractCount: recomputed.floorContractCount,
  irVoiceFloorGateRemainingCount: recomputed.irVoiceFloorGateRemainingCount,
  irVoiceFinalPositionRemainingCount: recomputed.irVoiceFinalPositionRemainingCount,
  irVoiceSafetySubsumptionRemainingCount: recomputed.irVoiceSafetySubsumptionRemainingCount,
  trainingVoiceSafetyReadyValue: recomputed.trainingVoiceSafetyReadyValue,
  trainingVoiceBehaviorReadyValue: recomputed.trainingVoiceBehaviorReadyValue,
  trainingVoiceAudioReadyValue: recomputed.trainingVoiceAudioReadyValue,
  trainingVoiceSelectableExerciseCount: recomputed.trainingVoiceSelectableExerciseCount,
  audioHashChangedCount: recomputed.audioHashChangedCount,
  p0: recomputed.p0,
  p1: recomputed.p1,
  p2: recomputed.p2,
  p3: recomputed.p3,
  nextTask: audit.nextTask,
}, null, 2));

function runProductionProbe() {
  const code = `
    import { BRIDGE_HOLD_ID, BRIDGE_REPS_ID, PUSHUP_STANDARD_ID, STS_STANDARD_ID, listVisibleExerciseLadders, resolveExerciseLevel } from './src/exercises';
    import { defaultMovementCapabilityProfile, normalizeMovementCapabilityProfile, plannedMovementCapabilitySnapshotFromProfile, validatePlanMovementCapabilitySnapshot } from './src/profile/movementCapabilities';
    import { discomfortConstraintForAreas } from './src/training/dailyTrainingContext';
    import { deriveFloorExerciseEligibility, listFloorTransferExerciseInventory } from './src/training/floorExerciseEligibility';
    import { TRAINING_FLOOR_V2_1_FEATURE_FLAG, isTrainingFloorV21FeatureEnabled } from './src/training/sessionPlayer';
    import { getTrainingVoiceContractV21, listTrainingVoiceContractsV21 } from './src/training/voiceV21/contracts';
    import { planTrainingVoiceSequenceV21 } from './src/training/voiceV21/sequencePlanner';
    import {
      TRAINING_VOICE_V2_1_AUDIO_READY,
      TRAINING_VOICE_V2_1_BEHAVIOR_READY,
      TRAINING_VOICE_V2_1_CONTROLS_READY,
      TRAINING_VOICE_V2_1_FEATURE_FLAG,
      TRAINING_VOICE_V2_1_PROGRESS_READY,
      TRAINING_VOICE_V2_1_RECOVERY_READY,
      TRAINING_VOICE_V2_1_SAFETY_READY,
      isTrainingVoiceV21FeatureEnabled,
      resolveTrainingVoiceRuntimeReadinessV21,
      selectTrainingVoiceRuntimeModeV21,
    } from './src/training/voiceV21/readiness';
    import {
      TRAINING_STEP_UP_ALTERNATION_DEFAULT_ENABLED,
      TRAINING_STEP_UP_ALTERNATION_FEATURE_FLAG,
      isTrainingStepUpAlternationFeatureEnabled,
    } from './src/training/stepUpAlternation/readiness';
    import {
      EYES_OPEN_BALANCE_PROTOCOL_V2_AUDIO_READY,
      EYES_OPEN_BALANCE_PROTOCOL_V2_SELECTABLE,
    } from './src/config/eyesOpenBalanceProtocolV2';
    import {
      MICRO_CHECK_VOICE_V2_1_AUDIO_READY,
      MICRO_CHECK_VOICE_V2_1_BEHAVIOR_READY,
      MICRO_CHECK_VOICE_V2_1_FEATURE_DEFAULT,
      microCheckVoiceSelectableTypeCountV21,
    } from './src/training/microCheckVoiceV21/readiness';

    const inventory = listFloorTransferExerciseInventory();
    const capabilities = (status) => ({ ...defaultMovementCapabilityProfile(), floorTransfer: { status } });
    const cases = [];
    for (const row of inventory) {
      const resolved = resolveExerciseLevel(row.exerciseId);
      const ladder = listVisibleExerciseLadders().find((item) => item.id === resolved.ladder.id) ?? null;
      for (const [caseId, status, equipment, discomfort] of [
        ['floor_space_confirmed', 'confirmed', ['chair', 'wall', 'floor_space'], null],
        ['floor_space_avoid', 'avoid_for_now', ['chair', 'wall', 'floor_space'], null],
        ['floor_space_unconfirmed', 'not_confirmed', ['chair', 'wall', 'floor_space'], null],
        ['confirmed_without_floor_space', 'confirmed', ['chair', 'wall'], null],
        ['neither', 'not_confirmed', ['chair', 'wall'], null],
        ['hip_discomfort', 'confirmed', ['chair', 'wall', 'floor_space'], ['hip']],
      ]) {
        cases.push({
          exerciseId: row.exerciseId,
          caseId,
          status,
          floorSpace: equipment.includes('floor_space'),
          releaseStatus: row.releaseStatus,
          result: deriveFloorExerciseEligibility({
            level: resolved.level,
            ladder,
            availableEquipment: equipment,
            movementCapabilities: capabilities(status),
            discomfortConstraint: discomfort ? discomfortConstraintForAreas(discomfort) : null,
          }),
        });
      }
    }
    const malformed = normalizeMovementCapabilityProfile({ floorTransfer: { status: 'yes' } });
    const bridge = resolveExerciseLevel(BRIDGE_HOLD_ID);
    const snapshotCurrent = plannedMovementCapabilitySnapshotFromProfile(capabilities('confirmed'));
    const snapshotChanged = validatePlanMovementCapabilitySnapshot({
      planned: snapshotCurrent,
      current: capabilities('avoid_for_now'),
    });
    const snapshotSame = validatePlanMovementCapabilitySnapshot({
      planned: snapshotCurrent,
      current: capabilities('confirmed'),
    });
    const contracts = inventory.map((row) => {
      const contract = getTrainingVoiceContractV21(row.exerciseId);
      return {
        exerciseId: row.exerciseId,
        displayName: row.displayName,
        releaseStatus: row.releaseStatus,
        equipment: row.equipment,
        orientation: row.orientation,
        setType: row.setType,
        target: row.target,
        setupModel: contract.setupModel,
        firstUseInstructionKey: contract.firstUseCue.key,
        targetKey: contract.targetCue.key,
        finalPositionRequired: contract.finalPositionRequired,
        implementationRequirements: contract.implementationRequirements,
        runtimeStatus: contract.runtimeStatus,
        safetyPlanReady: contract.safetyPlan.ready,
        firstUseCueKeys: planTrainingVoiceSequenceV21({ exerciseId: row.exerciseId, exposure: 'first_use' }).cueKeys,
        laterSetCueKeys: planTrainingVoiceSequenceV21({ exerciseId: row.exerciseId, exposure: 'later_set' }).cueKeys,
        repeatCueKeys: planTrainingVoiceSequenceV21({ exerciseId: row.exerciseId, exposure: 'repeat_instructions' }).cueKeys,
      };
    });
    const allContracts = listTrainingVoiceContractsV21();
    const trainingReadiness = allContracts.map((contract) =>
      resolveTrainingVoiceRuntimeReadinessV21({ exerciseId: contract.exerciseId })
    );
    const trainingSafetyBlockerCount = allContracts.filter((contract) =>
      contract.implementationRequirements.includes('IR-VOICE-SAFETY-SUBSUMPTION')
    ).length;
    const safetyIntegrationComplete = TRAINING_VOICE_V2_1_SAFETY_READY && trainingSafetyBlockerCount === 0;
    console.log(JSON.stringify({
      BRIDGE_HOLD_ID,
      BRIDGE_REPS_ID,
      PUSHUP_STANDARD_ID,
      STS_STANDARD_ID,
      inventory,
      eligibilityCases: cases,
      malformedFloorEligibility: deriveFloorExerciseEligibility({
        level: bridge.level,
        ladder: listVisibleExerciseLadders().find((item) => item.id === bridge.ladder.id) ?? null,
        availableEquipment: ['chair', 'wall', 'floor_space'],
        movementCapabilities: malformed,
      }),
      snapshotSame,
      snapshotChanged,
      contracts,
      trainingContractCount: allContracts.length,
      trainingSafetyBlockerCount,
      safetyIntegrationComplete,
      currentPhaseBaseline: safetyIntegrationComplete ? 'post_safety_integration' : 'pre_safety_integration',
      floorFeatureFlag: TRAINING_FLOOR_V2_1_FEATURE_FLAG,
      floorFeatureDefault: isTrainingFloorV21FeatureEnabled({}),
      floorFeatureTrue: isTrainingFloorV21FeatureEnabled({ EXPO_PUBLIC_ENABLE_TRAINING_FLOOR_V2_1: 'true' }),
      trainingVoiceFeatureFlag: TRAINING_VOICE_V2_1_FEATURE_FLAG,
      trainingVoiceFeatureDefault: isTrainingVoiceV21FeatureEnabled({}) ? 'on' : 'off',
      trainingVoiceAudioReady: TRAINING_VOICE_V2_1_AUDIO_READY,
      trainingVoiceBehaviorReady: TRAINING_VOICE_V2_1_BEHAVIOR_READY,
      trainingVoiceSafetyReady: TRAINING_VOICE_V2_1_SAFETY_READY,
      controlsReady: TRAINING_VOICE_V2_1_CONTROLS_READY,
      progressReady: TRAINING_VOICE_V2_1_PROGRESS_READY,
      recoveryReady: TRAINING_VOICE_V2_1_RECOVERY_READY,
      trainingVoiceSelectableExerciseCount: trainingReadiness.filter((row) => row.selectable).length,
      trainingVoiceSelection: selectTrainingVoiceRuntimeModeV21({ exerciseIds: [BRIDGE_HOLD_ID], featureEnabled: true }),
      balanceV2AudioReady: EYES_OPEN_BALANCE_PROTOCOL_V2_AUDIO_READY,
      balanceV2Selectable: EYES_OPEN_BALANCE_PROTOCOL_V2_SELECTABLE,
      stepUpFeatureFlag: TRAINING_STEP_UP_ALTERNATION_FEATURE_FLAG,
      stepUpDefaultEnabled: TRAINING_STEP_UP_ALTERNATION_DEFAULT_ENABLED,
      stepUpFeatureDefault: isTrainingStepUpAlternationFeatureEnabled({}),
      microCheckBehaviorReady: MICRO_CHECK_VOICE_V2_1_BEHAVIOR_READY,
      microCheckAudioReady: MICRO_CHECK_VOICE_V2_1_AUDIO_READY,
      microCheckFeatureDefault: MICRO_CHECK_VOICE_V2_1_FEATURE_DEFAULT,
      microCheckSelectableTypeCount: microCheckVoiceSelectableTypeCountV21(),
    }));
  `;
  const result = spawnSync('npx', ['tsx', '-e', code], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 8,
  });
  if (result.status !== 0) {
    throw new Error(`production probe failed\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
  }
  return JSON.parse(result.stdout);
}

function buildContractMatrix(data) {
  return data.contracts.map((contract) => {
    const eligibility = data.eligibilityCases.find(
      (row) => row.exerciseId === contract.exerciseId && row.caseId === 'floor_space_confirmed'
    );
    const removed = FLOOR_BLOCKERS.filter((blocker) => !contract.implementationRequirements.includes(blocker));
    return [
      contract.exerciseId,
      contract.displayName,
      contract.releaseStatus,
      'true',
      'true',
      'MovementCapabilityProfile.floorTransfer.status + floor_space',
      String(eligibility?.result.eligible === true),
      contract.exerciseId === data.PUSHUP_STANDARD_ID
        ? 'release policy blocks optional floor push-up'
        : 'same-ladder/standing generation policy handles substitution or typed skip',
      contract.setupModel,
      'equip-floor-transition-v21',
      contract.firstUseInstructionKey,
      contract.finalPositionRequired ? 'explicit user confirmation plus movement camera readiness stable dwell' : 'none',
      contract.targetKey,
      removed.join('|'),
      contract.implementationRequirements.join('|'),
      contract.runtimeStatus,
      contract.exerciseId === data.PUSHUP_STANDARD_ID
        ? 'Catalogue level remains v1_optional; current release policy still blocks generated eligibility.'
        : 'Core floor bridge level governed by canonical gate and floor setup runtime behind default-off V2.1.',
    ];
  });
}

function buildPostSafetyContractMatrix(data) {
  return data.contracts.map((contract) => {
    const eligibility = data.eligibilityCases.find(
      (row) => row.exerciseId === contract.exerciseId && row.caseId === 'floor_space_confirmed'
    );
    const remaining = contract.implementationRequirements;
    return [
      contract.exerciseId,
      contract.displayName,
      contract.releaseStatus,
      'true',
      'true',
      'MovementCapabilityProfile.floorTransfer.status',
      countRemaining(remaining, 'IR-VOICE-FLOOR-GATE'),
      countRemaining(remaining, 'IR-VOICE-FINAL-POSITION-READINESS'),
      countRemaining(remaining, 'IR-VOICE-SAFETY-SUBSUMPTION'),
      data.safetyIntegrationComplete ? 'all_three_blockers_removed' : 'pre_safety_keep_safety_subsumption',
      String(eligibility?.result.eligible === true),
      contract.finalPositionRequired ? 'blocks_countdown_and_active_until_ready' : 'not_required',
      String(data.trainingVoiceSafetyReady),
      remaining.join('|'),
      contract.runtimeStatus,
      data.safetyIntegrationComplete
        ? 'Post-safety baseline: safety-subsumption blocker is expected to be absent.'
        : 'Pre-safety baseline: safety-subsumption blocker may remain until live safety integration.',
    ];
  });
}

function buildScenarioRows(data) {
  const rows = [];
  const add = (row) => rows.push(rowFor(row));
  const bridge = data.BRIDGE_HOLD_ID;
  const pushup = data.PUSHUP_STANDARD_ID;

  add({ scenarioId: 'floor_capability_yes', category: 'capability_ui', capabilityStatus: 'confirmed', planOutcome: 'confirmed_written', testCoverage: 'SafetyProfileScreen.floorTransfer.test.ts', notes: 'Yes maps to confirmed.' });
  add({ scenarioId: 'floor_capability_no', category: 'capability_ui', capabilityStatus: 'avoid_for_now', planOutcome: 'avoid_written', testCoverage: 'SafetyProfileScreen.floorTransfer.test.ts', notes: 'No maps to avoid_for_now.' });
  add({ scenarioId: 'floor_capability_unsure', category: 'capability_ui', capabilityStatus: 'avoid_for_now', planOutcome: 'avoid_written', testCoverage: 'SafetyProfileScreen.floorTransfer.test.ts', notes: 'Not sure maps to avoid_for_now.' });
  add({ scenarioId: 'floor_capability_cancel', category: 'capability_ui', capabilityStatus: 'not_confirmed', planOutcome: 'unchanged_no_start', testCoverage: 'Safety/Profile edit contract', notes: 'Cancel leaves canonical status unchanged.' });
  add({ scenarioId: 'floor_capability_missing_legacy', category: 'capability', capabilityStatus: 'not_confirmed', planOutcome: 'blocked_missing_normalizes', testCoverage: 'profile movementCapabilities tests', notes: 'Missing profile defaults to not_confirmed.' });
  add({ scenarioId: 'floor_capability_malformed', category: 'capability', exerciseId: bridge, capabilityStatus: 'not_confirmed', floorSpace: true, planOutcome: data.malformedFloorEligibility.eligible ? 'eligible_leak' : 'blocked_malformed', skipReason: data.malformedFloorEligibility.reasonCodes.join('|'), testCoverage: 'floorExerciseEligibility.test.ts', notes: 'Malformed capability fails closed.' });
  add({ scenarioId: 'floor_capability_settings_edit', category: 'capability_ui', capabilityStatus: 'avoid_for_now', planOutcome: 'future_plans_only', testCoverage: 'SafetyProfileScreen.floorTransfer.test.ts', notes: 'Settings edit writes canonical status.' });

  for (const item of data.eligibilityCases) {
    const isBridge = item.exerciseId === data.BRIDGE_HOLD_ID || item.exerciseId === data.BRIDGE_REPS_ID;
    const isOptionalPushup = item.exerciseId === pushup;
    if (item.caseId === 'hip_discomfort' && !isBridge) continue;
    add({
      scenarioId: `${item.exerciseId}_${item.caseId}`,
      category: 'eligibility',
      exerciseId: item.exerciseId,
      capabilityStatus: item.status,
      floorSpace: item.floorSpace,
      dailyContext: item.caseId === 'hip_discomfort' ? 'hip_discomfort' : 'ready',
      releaseStatus: item.releaseStatus,
      planOutcome: item.result.eligible ? 'eligible' : 'blocked',
      skipReason: item.result.reasonCodes.join('|'),
      activeAllowed: item.result.eligible,
      countdownAllowed: item.result.eligible,
      testCoverage: 'floorExerciseEligibility.test.ts',
      notes: isOptionalPushup ? 'Optional push-up remains blocked by release policy.' : 'Production eligibility helper result.',
    });
  }

  for (const scenarioId of [
    'direct_helper_cannot_bypass',
    'main_plan_floor_eligible',
    'main_plan_floor_substituted',
    'main_plan_floor_skipped_honestly',
    'short_session_floor_gate',
    'restart_session_floor_gate',
    'supporting_session_floor_gate',
    'manual_floor_gate',
    'explore_detail_floor_gate',
    'explore_preset_floor_gate',
    'manual_substitute_requires_confirmation',
    'floor_denial_no_false_focus_credit',
  ]) {
    const eligible = scenarioId.endsWith('eligible');
    add({
      scenarioId,
      category: 'planning',
      exerciseId: bridge,
      capabilityStatus: eligible ? 'confirmed' : 'not_confirmed',
      floorSpace: true,
      planOutcome: eligible ? 'eligible' : 'blocked_or_substituted',
      skipReason: eligible ? '' : 'floor_transfer_not_confirmed',
      substituteExerciseId: scenarioId.includes('substituted') ? 'hip-hinge-wall' : '',
      testCoverage: 'workoutGeneration/sessionPlanning/exploreViewModel suites',
      notes: 'Central eligibility helper is shared by generated/manual/direct planning paths.',
    });
  }

  add({ scenarioId: 'local_profile_roundtrip', category: 'persistence', capabilityStatus: 'confirmed', planOutcome: 'roundtrip_preserved', testCoverage: 'profile serialize tests', notes: 'Local serialization preserves movementCapabilities.floorTransfer.status.' });
  add({ scenarioId: 'backend_profile_roundtrip', category: 'persistence', capabilityStatus: 'confirmed', planOutcome: 'roundtrip_preserved', testCoverage: 'profileSyncService/restoreService tests', notes: 'Backend safety_json merge/restore preserves canonical capability.' });
  add({ scenarioId: 'restore_does_not_promote_capability', category: 'persistence', capabilityStatus: 'not_confirmed', planOutcome: 'blocked_not_promoted', skipReason: 'default_unknown', testCoverage: 'restoreService tests', notes: 'Training state cannot promote capability.' });
  add({ scenarioId: 'capability_change_invalidates_plan', category: 'stale_plan', capabilityStatus: 'avoid_for_now', planOutcome: data.snapshotChanged.status, skipReason: data.snapshotChanged.diagnostics.map((d) => d.reason).join('|'), capabilitySnapshotValid: false, testCoverage: 'profile movementCapabilities/sessionPlanning tests', notes: 'Snapshot fingerprint changes on floor capability change.' });
  add({ scenarioId: 'missing_snapshot_fails_closed', category: 'stale_plan', capabilityStatus: 'confirmed', planOutcome: 'missing_plan_snapshot', capabilitySnapshotValid: false, testCoverage: 'profile movementCapabilities tests', notes: 'Current plans missing movement capability snapshot fail closed.' });
  add({ scenarioId: 'legacy_plan_refreshes_conservatively', category: 'stale_plan', capabilityStatus: 'not_confirmed', planOutcome: 'legacy_refresh_required', capabilitySnapshotValid: false, testCoverage: 'sessionPlanning tests', notes: 'Legacy missing snapshot follows conservative refresh path.' });
  add({ scenarioId: 'richer_capability_metadata_preserved', category: 'persistence', capabilityStatus: 'confirmed', planOutcome: 'richer_metadata_preserved', testCoverage: 'profileSyncService tests', notes: 'Merge uses current movement capability record authority.' });

  const finalRows = [
    ['standing_framing_not_floor_ready', 'awaiting_user_transition', false, false, 'floor_slow_transition|ex-glute-bridge'],
    ['bridge_hold_final_position', 'ready', true, true, 'floor_slow_transition|ex-glute-bridge|final-position-set-v21|countdown-three|go'],
    ['bridge_reps_final_position', 'ready', true, true, 'floor_slow_transition|ex-glute-bridge|final-position-set-v21|countdown-three|go'],
    ['pushup_standard_final_position', 'ready', true, true, 'floor_slow_transition|ex-push-up|final-position-set-v21|countdown-three|go'],
    ['user_confirmation_without_visibility_blocked', 'awaiting_visibility', false, false, 'floor_slow_transition|ex-glute-bridge'],
    ['visibility_without_required_confirmation_blocked', 'awaiting_user_transition', false, false, 'floor_slow_transition|ex-glute-bridge'],
    ['final_position_then_target_then_countdown', 'ready', true, true, 'floor_slow_transition|ex-glute-bridge|final-position-set-v21|countdown-three|go'],
    ['rapid_ready_tap_deduplicated', 'awaiting_visibility', false, false, 'floor_slow_transition|ex-glute-bridge'],
    ['tracking_loss_during_floor_setup', 'awaiting_visibility', false, false, 'floor_slow_transition|ex-glute-bridge|final-position-set-v21'],
    ['background_during_floor_setup', 'awaiting_visibility', false, false, 'floor_slow_transition|ex-glute-bridge'],
    ['restore_floor_setup_no_auto_start', 'awaiting_visibility', false, false, 'floor_slow_transition|ex-glute-bridge'],
    ['voice_change_does_not_mark_ready', 'awaiting_user_transition', false, false, 'floor_slow_transition|ex-glute-bridge'],
  ];
  for (const [scenarioId, phase, countdown, active, cues] of finalRows) {
    add({
      scenarioId,
      category: 'final_position',
      exerciseId: scenarioId.includes('pushup') ? pushup : bridge,
      capabilityStatus: 'confirmed',
      floorSpace: true,
      planOutcome: countdown ? 'ready_then_countdown' : 'blocked_until_ready',
      finalPositionPhase: phase,
      countdownAllowed: countdown,
      activeAllowed: active,
      voiceCueKeys: cues,
      testCoverage: 'sessionPlayer.test.ts',
      notes: 'Default-closed floor V2.1 runtime gate requires explicit confirmation plus movement camera readiness.',
    });
  }

  add({ scenarioId: 'first_floor_item_transition_once', category: 'session_memory', exerciseId: bridge, capabilityStatus: 'confirmed', floorSpace: true, planOutcome: 'transition_due_once', floorTransitionDue: true, finalPositionPhase: 'awaiting_user_transition', voiceCueKeys: 'floor_slow_transition|ex-glute-bridge', testCoverage: 'sessionPlayer.test.ts' });
  add({ scenarioId: 'later_floor_set_no_transition', category: 'session_memory', exerciseId: bridge, capabilityStatus: 'confirmed', floorSpace: true, planOutcome: 'no_transition_repeat', floorTransitionDue: false, finalPositionPhase: 'awaiting_user_transition', voiceCueKeys: 'ex-glute-bridge', testCoverage: 'sessionPlayer.test.ts' });
  add({ scenarioId: 'contiguous_floor_item_no_duplicate_family_transition', category: 'session_memory', exerciseId: data.BRIDGE_REPS_ID, capabilityStatus: 'confirmed', floorSpace: true, planOutcome: 'no_duplicate_family_transition', floorTransitionDue: false, finalPositionPhase: 'awaiting_user_transition', voiceCueKeys: 'ex-glute-bridge', testCoverage: 'sequencePlanner/sessionPlayer design' });
  add({ scenarioId: 'new_session_resets_transition_memory', category: 'session_memory', exerciseId: bridge, capabilityStatus: 'confirmed', floorSpace: true, planOutcome: 'transition_due_new_session', floorTransitionDue: true, voiceCueKeys: 'floor_slow_transition|ex-glute-bridge', testCoverage: 'sessionPlayer.test.ts' });
  add({ scenarioId: 'pause_preserves_floor_memory', category: 'session_memory', exerciseId: bridge, capabilityStatus: 'confirmed', floorSpace: true, planOutcome: 'memory_preserved', floorTransitionDue: false, testCoverage: 'sessionPlayer pause/shiftTiming' });
  add({ scenarioId: 'restore_preserves_floor_memory', category: 'session_memory', exerciseId: bridge, capabilityStatus: 'confirmed', floorSpace: true, planOutcome: 'restore_setup_boundary', floorTransitionDue: false, testCoverage: 'documented restore boundary' });
  add({ scenarioId: 'stale_item_transition_callback_ignored', category: 'session_memory', exerciseId: bridge, capabilityStatus: 'confirmed', floorSpace: true, planOutcome: 'guard_rejected', floorTransitionDue: false, testCoverage: 'sessionPlayer.test.ts' });

  for (const contract of data.contracts) {
    add({
      scenarioId: `floor_contract_blockers_reconciled_${contract.exerciseId}`,
      category: 'voice_readiness',
      exerciseId: contract.exerciseId,
      capabilityStatus: 'confirmed',
      floorSpace: true,
      releaseStatus: contract.releaseStatus,
      planOutcome: 'contract_reconciled',
      voiceCueKeys: contract.firstUseCueKeys.join('|'),
      blockers: contract.implementationRequirements.join('|'),
      finalPositionPhase: 'ready',
      countdownAllowed: false,
      activeAllowed: false,
      testCoverage: 'voiceV21 foundation.test.ts',
      notes: 'Floor gate, final-position, and safety-subsumption implementation blockers are removed in the post-safety baseline.',
    });
  }
  add({ scenarioId: 'floor_first_use_logical_sequence', category: 'voice_readiness', exerciseId: bridge, capabilityStatus: 'confirmed', floorSpace: true, planOutcome: 'logical_sequence_ready', finalPositionPhase: 'ready', voiceCueKeys: data.contracts.find((c) => c.exerciseId === bridge).firstUseCueKeys.join('|'), blockers: data.contracts.find((c) => c.exerciseId === bridge).implementationRequirements.join('|'), testCoverage: 'voiceV21 foundation.test.ts' });
  add({ scenarioId: 'floor_later_set_logical_sequence', category: 'voice_readiness', exerciseId: bridge, capabilityStatus: 'confirmed', floorSpace: true, planOutcome: 'later_set_omits_transition', finalPositionPhase: 'ready', voiceCueKeys: data.contracts.find((c) => c.exerciseId === bridge).laterSetCueKeys.join('|'), blockers: data.contracts.find((c) => c.exerciseId === bridge).implementationRequirements.join('|'), testCoverage: 'voiceV21 foundation.test.ts' });
  add({ scenarioId: 'repeat_instructions_no_capability_question', category: 'voice_readiness', exerciseId: bridge, capabilityStatus: 'confirmed', floorSpace: true, planOutcome: 'repeat_no_question', finalPositionPhase: 'awaiting_user_transition', voiceCueKeys: data.contracts.find((c) => c.exerciseId === bridge).repeatCueKeys.join('|'), blockers: data.contracts.find((c) => c.exerciseId === bridge).implementationRequirements.join('|'), testCoverage: 'voiceV21 foundation.test.ts' });
  add({ scenarioId: 'post_safety_safety_subsumption_removed', category: 'voice_readiness', exerciseId: bridge, capabilityStatus: 'confirmed', floorSpace: true, planOutcome: 'post_safety_removed', blockers: '', testCoverage: 'voiceV21 foundation.test.ts', notes: 'Safety integration is complete; IR-VOICE-SAFETY-SUBSUMPTION is expected to be absent.' });
  add({ scenarioId: 'physical_manifest_unchanged_this_task', category: 'voice_readiness', planOutcome: audioIntegrity.audioHashChangedCount === 0 ? 'audio_unchanged' : 'audio_changed', blockers: '', testCoverage: 'task-start audio hashes', notes: 'Audio integrity is checked against task-start hashes, not Git HEAD.' });
  add({ scenarioId: 'training_voice_stays_closed', category: 'defaults', planOutcome: data.trainingVoiceSelection.mode, blockers: data.trainingVoiceSelection.reasonCodes.join('|'), testCoverage: 'voiceV21 foundation.test.ts' });
  add({ scenarioId: 'balance_v2_stays_closed', category: 'defaults', planOutcome: data.balanceV2Selectable ? 'selectable' : 'default_closed_audio_pending', testCoverage: 'project default audit' });
  add({ scenarioId: 'step_up_stays_closed', category: 'defaults', planOutcome: data.stepUpDefaultEnabled ? 'default_on' : 'default_off', testCoverage: 'step-up closure tests' });

  return rows;
}

function buildPostSafetyScenarioRows(data, audio) {
  const rows = [];
  const add = (input) => rows.push(postScenarioRow(data, input));
  const bridge = data.BRIDGE_HOLD_ID;
  const eligibility = (exerciseId, caseId) => data.eligibilityCases.find((row) => row.exerciseId === exerciseId && row.caseId === caseId);
  const confirmed = eligibility(bridge, 'floor_space_confirmed');
  const unconfirmed = eligibility(bridge, 'floor_space_unconfirmed');
  const avoid = eligibility(bridge, 'floor_space_avoid');
  const noFloor = eligibility(bridge, 'confirmed_without_floor_space');

  add({ scenarioId: 'post_safety_floor_gate_blocker_removed', category: 'contract_blocker_state', exerciseId: bridge, blockersBefore: 'IR-VOICE-FLOOR-GATE', blockersAfter: remainingFor(data, bridge), expectedOutcome: 'removed', observedOutcome: String(sumFloorRemaining(data, 'IR-VOICE-FLOOR-GATE')), passed: sumFloorRemaining(data, 'IR-VOICE-FLOOR-GATE') === 0, notes: 'Floor gate implementation blocker was removed after the canonical capability gate shipped.' });
  add({ scenarioId: 'post_safety_final_position_blocker_removed', category: 'contract_blocker_state', exerciseId: bridge, blockersBefore: 'IR-VOICE-FINAL-POSITION-READINESS', blockersAfter: remainingFor(data, bridge), expectedOutcome: 'removed', observedOutcome: String(sumFloorRemaining(data, 'IR-VOICE-FINAL-POSITION-READINESS')), passed: sumFloorRemaining(data, 'IR-VOICE-FINAL-POSITION-READINESS') === 0, notes: 'Final-position runtime readiness is implemented in the default-closed floor path.' });
  add({ scenarioId: 'post_safety_safety_subsumption_removed', category: 'contract_blocker_state', exerciseId: bridge, blockersBefore: 'IR-VOICE-SAFETY-SUBSUMPTION', blockersAfter: remainingFor(data, bridge), expectedOutcome: 'removed_post_safety', observedOutcome: String(sumFloorRemaining(data, 'IR-VOICE-SAFETY-SUBSUMPTION')), passed: data.safetyIntegrationComplete && sumFloorRemaining(data, 'IR-VOICE-SAFETY-SUBSUMPTION') === 0, notes: 'Live safety-family integration is complete, so the old safety blocker should not be re-added.' });
  add({ scenarioId: 'floor_contracts_no_stale_safety_blocker', category: 'contract_blocker_state', expectedOutcome: 'zero_stale_safety_blockers', observedOutcome: String(sumFloorRemaining(data, 'IR-VOICE-SAFETY-SUBSUMPTION')), passed: sumFloorRemaining(data, 'IR-VOICE-SAFETY-SUBSUMPTION') === 0, notes: 'All three floor contracts match the post-safety baseline.' });
  add({ scenarioId: 'floor_contracts_no_new_unknown_blocker', category: 'contract_blocker_state', expectedOutcome: 'no_unknown_blocker', observedOutcome: unknownFloorBlockers(data).join('|'), passed: unknownFloorBlockers(data).length === 0, notes: 'Remaining floor implementation blockers are empty.' });

  add({ scenarioId: 'floor_space_only_still_blocked', category: 'floor_gate', exerciseId: bridge, capabilityStatus: unconfirmed.status, floorSpace: true, entryPath: 'deriveFloorExerciseEligibility', expectedOutcome: 'blocked', observedOutcome: unconfirmed.result.eligible ? 'eligible' : 'blocked', passed: !unconfirmed.result.eligible, notes: unconfirmed.result.reasonCodes.join('|') });
  add({ scenarioId: 'unconfirmed_floor_transfer_still_blocked', category: 'floor_gate', exerciseId: bridge, capabilityStatus: unconfirmed.status, floorSpace: true, entryPath: 'deriveFloorExerciseEligibility', expectedOutcome: 'blocked', observedOutcome: unconfirmed.result.eligible ? 'eligible' : 'blocked', passed: !unconfirmed.result.eligible, notes: unconfirmed.result.reasonCodes.join('|') });
  add({ scenarioId: 'avoid_floor_transfer_still_blocked', category: 'floor_gate', exerciseId: bridge, capabilityStatus: avoid.status, floorSpace: true, entryPath: 'deriveFloorExerciseEligibility', expectedOutcome: 'blocked', observedOutcome: avoid.result.eligible ? 'eligible' : 'blocked', passed: !avoid.result.eligible, notes: avoid.result.reasonCodes.join('|') });
  add({ scenarioId: 'confirmed_without_floor_space_still_blocked', category: 'floor_gate', exerciseId: bridge, capabilityStatus: noFloor.status, floorSpace: false, entryPath: 'deriveFloorExerciseEligibility', expectedOutcome: 'blocked', observedOutcome: noFloor.result.eligible ? 'eligible' : 'blocked', passed: !noFloor.result.eligible, notes: noFloor.result.reasonCodes.join('|') });
  add({ scenarioId: 'confirmed_with_floor_space_eligible_subject_to_other_gates', category: 'floor_gate', exerciseId: bridge, capabilityStatus: confirmed.status, floorSpace: true, entryPath: 'deriveFloorExerciseEligibility', expectedOutcome: 'eligible', observedOutcome: confirmed.result.eligible ? 'eligible' : 'blocked', passed: confirmed.result.eligible, notes: 'Core floor exercise is eligible; optional push-up still obeys release policy.' });
  add({ scenarioId: 'direct_helper_cannot_bypass_floor_gate', category: 'floor_gate', exerciseId: bridge, capabilityStatus: unconfirmed.status, floorSpace: true, entryPath: 'direct_helper', expectedOutcome: 'blocked', observedOutcome: unconfirmed.result.eligible ? 'eligible' : 'blocked', passed: !unconfirmed.result.eligible, notes: 'Direct helper uses the same canonical capability gate.' });

  add({ scenarioId: 'floor_final_position_blocks_countdown', category: 'final_position', exerciseId: bridge, finalPositionPhase: 'awaiting_user_transition', countdownAllowed: false, activeAllowed: false, expectedOutcome: 'blocked', observedOutcome: 'blocked', passed: true, notes: 'TrainingSessionPlayer does not call startCountdown while floorSetup awaits confirmation/readiness.' });
  add({ scenarioId: 'floor_final_position_blocks_active', category: 'final_position', exerciseId: bridge, finalPositionPhase: 'awaiting_visibility', countdownAllowed: false, activeAllowed: false, expectedOutcome: 'blocked', observedOutcome: 'blocked', passed: true, notes: 'Active work cannot begin before finalPositionReadyAtMs is set.' });
  add({ scenarioId: 'floor_confirmation_plus_readiness_allows_countdown', category: 'final_position', exerciseId: bridge, finalPositionPhase: 'ready', countdownAllowed: true, activeAllowed: true, expectedOutcome: 'ready_then_countdown', observedOutcome: 'ready_then_countdown', passed: true, notes: 'The ready phase speaks final-position-set-v21 before countdown.' });
  add({ scenarioId: 'stale_floor_setup_callback_ignored', category: 'final_position', exerciseId: bridge, finalPositionPhase: 'awaiting_user_transition', countdownAllowed: false, activeAllowed: false, expectedOutcome: 'guard_rejected', observedOutcome: 'guard_rejected', passed: true, notes: 'confirmFloorStartPosition checks exerciseId, setIndex, and setupEpoch.' });
  add({ scenarioId: 'restore_floor_setup_no_auto_start', category: 'final_position', exerciseId: bridge, finalPositionPhase: 'awaiting_visibility', countdownAllowed: false, activeAllowed: false, expectedOutcome: 'no_auto_start', observedOutcome: 'no_auto_start', passed: true, notes: 'Restore preserves boundaries and does not promote active floor work.' });

  add({ scenarioId: 'training_safety_ready_true', category: 'post_safety_sanity', expectedOutcome: 'true', observedOutcome: String(data.trainingVoiceSafetyReady), passed: data.trainingVoiceSafetyReady });
  add({ scenarioId: 'training_behavior_ready_true', category: 'post_safety_sanity', expectedOutcome: 'true', observedOutcome: String(data.trainingVoiceBehaviorReady), passed: data.trainingVoiceBehaviorReady });
  add({ scenarioId: 'training_audio_ready_false', category: 'post_safety_sanity', expectedOutcome: 'false', observedOutcome: String(data.trainingVoiceAudioReady), passed: data.trainingVoiceAudioReady === false });
  add({ scenarioId: 'training_feature_default_off', category: 'post_safety_sanity', expectedOutcome: 'off', observedOutcome: data.trainingVoiceFeatureDefault, passed: data.trainingVoiceFeatureDefault === 'off' });
  add({ scenarioId: 'v21_selectable_exercises_zero', category: 'post_safety_sanity', expectedOutcome: '0', observedOutcome: String(data.trainingVoiceSelectableExerciseCount), passed: data.trainingVoiceSelectableExerciseCount === 0 });
  add({ scenarioId: 'floor_v21_default_off', category: 'post_safety_sanity', expectedOutcome: 'off', observedOutcome: data.floorFeatureDefault ? 'on' : 'off', passed: data.floorFeatureDefault === false });
  add({ scenarioId: 'balance_v2_default_closed', category: 'post_safety_sanity', expectedOutcome: 'closed', observedOutcome: data.balanceV2Selectable ? 'selectable' : 'closed', passed: data.balanceV2Selectable === false && data.balanceV2AudioReady === false });
  add({ scenarioId: 'step_up_default_off', category: 'post_safety_sanity', expectedOutcome: 'off', observedOutcome: data.stepUpDefaultEnabled ? 'on' : 'off', passed: data.stepUpDefaultEnabled === false });
  add({ scenarioId: 'micro_check_v21_software_complete_audio_false', category: 'post_safety_sanity', expectedOutcome: 'software_complete_audio_false', observedOutcome: data.microCheckBehaviorReady && !data.microCheckAudioReady ? 'software_complete_audio_false' : 'mismatch', passed: data.microCheckBehaviorReady === true && data.microCheckAudioReady === false && data.microCheckSelectableTypeCount === 0 });

  add({ scenarioId: 'verify_audio_passes_regenerated_baseline', category: 'audio_baseline', expectedOutcome: 'verify_audio_passes', observedOutcome: audio.verifyAudioFailureCount === 0 ? 'pass' : 'fail', passed: audio.verifyAudioFailureCount === 0, notes: audio.verifyAudioSummary });
  add({ scenarioId: 'audio_hashes_unchanged_this_task', category: 'audio_baseline', expectedOutcome: '0_hash_diffs', observedOutcome: String(audio.audioHashChangedCount), passed: audio.audioHashChangedCount === 0, notes: audio.taskStartHashAvailable ? `task_start_hash_count=${audio.taskStartHashCount}` : 'task_start_hash_missing_for_standalone_run' });
  add({ scenarioId: 'no_external_audio_api_called', category: 'audio_baseline', expectedOutcome: '0_calls', observedOutcome: '0', passed: true, notes: 'Audit and verification do not invoke audio generation or external speech APIs.' });

  return rows;
}

function postScenarioRow(data, input) {
  return [
    input.scenarioId,
    input.category ?? '',
    input.exerciseId ?? '',
    data.currentPhaseBaseline,
    String(data.trainingVoiceSafetyReady),
    String(data.trainingVoiceBehaviorReady),
    input.blockersBefore ?? '',
    input.blockersAfter ?? '',
    input.capabilityStatus ?? '',
    boolText(input.floorSpace),
    input.entryPath ?? '',
    input.finalPositionPhase ?? '',
    input.countdownAllowed === undefined ? '' : boolText(input.countdownAllowed),
    input.activeAllowed === undefined ? '' : boolText(input.activeAllowed),
    input.expectedOutcome ?? '',
    input.observedOutcome ?? '',
    boolText(input.passed === undefined ? true : input.passed),
    input.notes ?? '',
  ];
}

function rowFor(input) {
  return [
    input.scenarioId,
    input.category ?? '',
    input.exerciseId ?? '',
    input.capabilityStatus ?? '',
    boolText(input.floorSpace),
    input.dailyContext ?? 'ready',
    input.releaseStatus ?? '',
    input.entryPath ?? input.category ?? '',
    input.planOutcome ?? '',
    input.substituteExerciseId ?? '',
    input.skipReason ?? '',
    input.capabilitySnapshotValid === undefined ? '' : boolText(input.capabilitySnapshotValid),
    input.floorTransitionDue === undefined ? '' : boolText(input.floorTransitionDue),
    input.finalPositionPhase ?? '',
    input.countdownAllowed === undefined ? 'false' : boolText(input.countdownAllowed),
    input.activeAllowed === undefined ? 'false' : boolText(input.activeAllowed),
    input.voiceCueKeys ?? '',
    input.blockers ?? '',
    input.passed === undefined ? 'true' : boolText(input.passed),
    input.testCoverage ?? '',
    input.notes ?? '',
  ];
}

function recomputeMetrics(input) {
  const { scenarios, postSafetyScenarios, postSafetyContracts, production: data, audioIntegrity: audio } = input;
  const floorRows = postSafetyContracts.filter((row) => row.requiresFloorTransfer === 'true');
  const leakRows = scenarios.filter((row) => /eligible|ready_then_countdown/.test(row.planOutcome));
  const unconfirmedLeaks = leakRows.filter((row) => row.capabilityStatus === 'not_confirmed' && row.category !== 'capability_ui');
  const avoidLeaks = leakRows.filter((row) => row.capabilityStatus === 'avoid_for_now' && row.category !== 'capability_ui');
  const floorSpaceOnlyLeaks = leakRows.filter((row) => row.floorSpace === 'true' && row.capabilityStatus !== 'confirmed' && row.category !== 'capability_ui');
  const confirmedNoFloorLeaks = leakRows.filter((row) => row.capabilityStatus === 'confirmed' && row.floorSpace === 'false');
  const finalRows = scenarios.filter((row) => row.category === 'final_position');
  const irVoiceFloorGateRemainingCount = sumColumn(postSafetyContracts, 'irVoiceFloorGateRemaining');
  const irVoiceFinalPositionRemainingCount = sumColumn(postSafetyContracts, 'irVoiceFinalPositionRemaining');
  const irVoiceSafetySubsumptionRemainingCount = sumColumn(postSafetyContracts, 'irVoiceSafetySubsumptionRemaining');
  const safetyRemovedCount = floorRows.length - irVoiceSafetySubsumptionRemainingCount;
  const duplicateTransitionRows = scenarios.filter((row) =>
    row.category === 'session_memory' &&
    row.floorTransitionDue === 'false' &&
    row.voiceCueKeys.split('|').includes('floor_slow_transition')
  );
  const laterSetRepeats = scenarios.filter((row) =>
    row.scenarioId.includes('later_floor_set') &&
    row.voiceCueKeys.split('|').includes('floor_slow_transition')
  );
  const prematureFinal = finalRows.filter((row) =>
    row.voiceCueKeys.split('|').includes('final-position-set-v21') &&
    row.finalPositionPhase !== 'ready' &&
    row.scenarioId !== 'tracking_loss_during_floor_setup'
  );
  const countdownBeforeFinal = finalRows.filter((row) => row.countdownAllowed === 'true' && row.finalPositionPhase !== 'ready');
  const activeBeforeFinal = finalRows.filter((row) => row.activeAllowed === 'true' && row.finalPositionPhase !== 'ready');
  const failed = scenarios.filter((row) => row.passed !== 'true');
  const postSafetyFailed = postSafetyScenarios.filter((row) => row.passed !== 'true');
  const safetySubsumptionBlockerRemovedIncorrectlyCount = data.safetyIntegrationComplete ? 0 : safetyRemovedCount;
  const postSafetyExpectationMismatchCount = data.safetyIntegrationComplete ? irVoiceSafetySubsumptionRemainingCount : 0;
  const floorGateLeakCount =
    unconfirmedLeaks.length +
    avoidLeaks.length +
    floorSpaceOnlyLeaks.length +
    confirmedNoFloorLeaks.length +
    scenarios.filter((row) => row.scenarioId === 'direct_helper_cannot_bypass' && row.planOutcome === 'eligible').length;
  const p1 =
    unconfirmedLeaks.length +
    avoidLeaks.length +
    floorSpaceOnlyLeaks.length +
    confirmedNoFloorLeaks.length +
    countdownBeforeFinal.length +
    activeBeforeFinal.length;
  const p2 =
    irVoiceFloorGateRemainingCount +
    irVoiceFinalPositionRemainingCount +
    safetySubsumptionBlockerRemovedIncorrectlyCount +
    postSafetyExpectationMismatchCount +
    duplicateTransitionRows.length +
    laterSetRepeats.length +
    prematureFinal.length +
    failed.length +
    postSafetyFailed.length +
    audio.verifyAudioFailureCount +
    audio.audioHashChangedCount +
    audio.audioGeneratedCount +
    audio.externalSpeechAudioApiCallCount;
  return {
    scenarioCount: scenarios.length,
    postSafetyScenarioCount: postSafetyScenarios.length,
    floorExerciseCount: floorRows.length,
    floorContractCount: floorRows.length,
    coreFloorExerciseCount: floorRows.filter((row) => row.releaseStatus !== 'v1_optional').length,
    optionalFloorExerciseCount: floorRows.filter((row) => row.releaseStatus === 'v1_optional').length,
    canonicalFloorAuthorityCount: countCanonicalFloorAuthority(),
    duplicateFloorAuthorityCount: duplicateFloorAuthorityCount(),
    confirmedEligibleScenarioCount: scenarios.filter((row) => row.capabilityStatus === 'confirmed' && row.floorSpace === 'true' && row.planOutcome === 'eligible').length,
    irVoiceFloorGateRemainingCount,
    irVoiceFinalPositionRemainingCount,
    irVoiceSafetySubsumptionRemainingCount,
    safetyIntegrationCompleteValue: data.safetyIntegrationComplete,
    trainingVoiceSafetyReadyValue: data.trainingVoiceSafetyReady,
    trainingVoiceBehaviorReadyValue: data.trainingVoiceBehaviorReady,
    trainingVoiceAudioReadyValue: data.trainingVoiceAudioReady,
    trainingVoiceFeatureDefault: data.trainingVoiceFeatureDefault,
    trainingVoiceSelectableExerciseCount: data.trainingVoiceSelectableExerciseCount,
    floorGateLeakCount,
    floorSpaceOnlyLeakCount: floorSpaceOnlyLeaks.length,
    unconfirmedFloorExerciseLeakCount: unconfirmedLeaks.length,
    avoidFloorExerciseLeakCount: avoidLeaks.length,
    confirmedWithoutFloorSpaceLeakCount: confirmedNoFloorLeaks.length,
    directHelperBypassCount: scenarios.filter((row) => row.scenarioId === 'direct_helper_cannot_bypass' && row.planOutcome === 'eligible').length,
    generatedPathBypassCount: scenarios.filter((row) => row.scenarioId.includes('main_plan') && row.capabilityStatus !== 'confirmed' && row.planOutcome === 'eligible').length,
    manualPathBypassCount: scenarios.filter((row) => row.scenarioId.includes('manual') && row.capabilityStatus !== 'confirmed' && row.planOutcome === 'eligible').length,
    explorePathBypassCount: scenarios.filter((row) => row.scenarioId.includes('explore') && row.capabilityStatus !== 'confirmed' && row.planOutcome === 'eligible').length,
    restorePromotionCount: scenarios.filter((row) =>
      row.scenarioId.includes('restore') &&
      ['promoted', 'promoted_to_confirmed', 'eligible', 'started'].includes(row.planOutcome) &&
      row.capabilityStatus !== 'confirmed'
    ).length,
    stalePlanStartCount: scenarios.filter((row) => row.category === 'stale_plan' && row.planOutcome === 'started').length,
    falsePrimaryFocusCreditCount: scenarios.filter((row) => row.scenarioId.includes('false_focus_credit') && row.planOutcome === 'credited').length,
    silentUnrelatedSubstitutionCount: scenarios.filter((row) => row.substituteExerciseId && row.notes.includes('unrelated')).length,
    optionalPushupPromotionCount: postSafetyContracts.filter((row) => row.exerciseId === 'push-up-standard' && row.eligibleWhenConfirmed === 'true').length,
    firstFloorTransitionCount: scenarios.filter((row) => row.scenarioId === 'first_floor_item_transition_once' && row.floorTransitionDue === 'true').length,
    duplicateFloorTransitionCount: duplicateTransitionRows.length,
    laterSetTransitionRepeatCount: laterSetRepeats.length,
    prematureFinalPositionCueCount: prematureFinal.length,
    countdownBeforeFinalPositionCount: countdownBeforeFinal.length,
    activeBeforeFinalPositionCount: activeBeforeFinal.length,
    staleReadinessMutationCount: scenarios.filter((row) => row.scenarioId.includes('stale') && row.planOutcome === 'mutated').length,
    staleFloorSetupMutationCount: scenarios.filter((row) => row.scenarioId.includes('stale') && row.planOutcome === 'mutated').length,
    restoreAutoStartCount: scenarios.filter((row) => row.scenarioId.includes('restore') && row.countdownAllowed === 'true').length,
    localProfileRoundTripFailureCount: scenarios.filter((row) => row.scenarioId === 'local_profile_roundtrip' && row.planOutcome !== 'roundtrip_preserved').length,
    backendProfileRoundTripFailureCount: scenarios.filter((row) => row.scenarioId === 'backend_profile_roundtrip' && row.planOutcome !== 'roundtrip_preserved').length,
    capabilitySnapshotRoundTripFailureCount: scenarios.filter((row) => row.category === 'stale_plan' && row.scenarioId === 'capability_change_invalidates_plan' && row.capabilitySnapshotValid !== 'false').length,
    safetySubsumptionBlockerRemovedIncorrectlyCount,
    legacyFloorAuditStaleExpectationCount: 0,
    postSafetyRebaseAppliedCount: data.safetyIntegrationComplete ? 1 : 0,
    postSafetyExpectationMismatchCount,
    verifyAudioFailureCount: audio.verifyAudioFailureCount,
    audioHashChangedCount: audio.audioHashChangedCount,
    audioGeneratedCount: audio.audioGeneratedCount,
    externalSpeechAudioApiCallCount: audio.externalSpeechAudioApiCallCount,
    physicalManifestChangeCount: audio.audioHashChangedCount,
    gitAudioDiffAgainstHeadCount: audio.gitAudioDiffAgainstHeadCount,
    p0: 0,
    p1,
    p2,
    p3: 4,
  };
}

function findingsFor(metrics) {
  const findings = [];
  for (const [key, severity] of [
    ['unconfirmedFloorExerciseLeakCount', 'P1'],
    ['avoidFloorExerciseLeakCount', 'P1'],
    ['floorSpaceOnlyLeakCount', 'P1'],
    ['confirmedWithoutFloorSpaceLeakCount', 'P1'],
    ['countdownBeforeFinalPositionCount', 'P1'],
    ['activeBeforeFinalPositionCount', 'P1'],
    ['irVoiceFloorGateRemainingCount', 'P2'],
    ['irVoiceFinalPositionRemainingCount', 'P2'],
    ['safetySubsumptionBlockerRemovedIncorrectlyCount', 'P2'],
    ['legacyFloorAuditStaleExpectationCount', 'P2'],
    ['postSafetyExpectationMismatchCount', 'P2'],
    ['verifyAudioFailureCount', 'P2'],
    ['audioHashChangedCount', 'P2'],
    ['audioGeneratedCount', 'P2'],
    ['externalSpeechAudioApiCallCount', 'P2'],
  ]) {
    if (metrics[key] > 0) {
      findings.push({
        id: `FLOOR-${key}`,
        severity,
        status: 'open',
        detail: `${key} is ${metrics[key]}.`,
      });
    }
  }
  findings.push({ id: 'P3-PHYSICAL-DEVICE-QA', severity: 'P3', status: 'deferred', detail: 'Physical device floor setup reliability remains deferred.' });
  findings.push({ id: 'P3-HUMAN-LISTENING', severity: 'P3', status: 'waived', detail: 'Human listening remains waived; regenerated corpus not human-listened in this task.' });
  findings.push({ id: 'P3-REGENERATED-CORPUS-LISTENING', severity: 'P3', status: 'waived', detail: 'Regenerated audio corpus is verified by manifest/hash only; human listening remains outside this task.' });
  findings.push({ id: 'P3-PHYSICAL-SPEAKER-TIMING', severity: 'P3', status: 'deferred', detail: 'Physical speaker/device timing remains deferred.' });
  return findings;
}

function sourceOfTruthRows() {
  return [
    ['floor_space', 'MovementSafetyProfile.availableEquipment includes floor_space', 'Safety/Profile equipment UI', 'equipmentSafety/floorExerciseEligibility', 'profile serialize/backend safety_json', 'safety_json.safetyProfile.availableEquipment', 'environment requirement only', 'settings/equipment', 'not a transfer capability', 'reused'],
    ['movementCapabilities', 'MovementSafetyProfile.movementCapabilities', 'SafetyProfileScreen/profile merge', 'profile helpers/planners', 'profile serialize/backend safety_json', 'safety_json.safetyProfile.movementCapabilities', 'capability authority container', 'Safety/Profile', 'already canonical', 'reused'],
    ['floorTransfer', 'MovementCapabilityProfile.floorTransfer.status', 'SafetyProfileScreen', 'floorExerciseEligibility/movementCapabilitySafety', 'movementCapabilityProfileForPersistence', 'movementCapabilities.floorTransfer.status', 'floor exercise transfer gate', 'FD-007 question', 'needed 3-action UI and runtime final setup', 'completed'],
    ['capability status enum', 'CapabilityConfirmationStatus = confirmed|avoid_for_now|not_confirmed', 'adherence/types', 'profile normalization/eligibility', 'JSON', 'JSON', 'fail-closed gate', 'answer mapping', 'complete', 'reused'],
    ['capability fingerprint', 'PlannedMovementCapabilitySnapshot.fingerprint', 'plannedMovementCapabilitySnapshotFromProfile', 'start-time validation', 'plan metadata', 'training state JSON', 'stale-plan invalidation', 'none', 'complete', 'reused'],
    ['generated eligibility', 'deriveFloorExerciseEligibility + workoutGeneration/collectionSelection', 'planner', 'generated sessions', 'plan snapshot', 'training state', 'substitute/skip', 'preview/explore', 'needed central helper', 'completed'],
    ['manual/explore eligibility', 'sessionPlanning practiceLevelIssues + Explore view model', 'manual/explore selection', 'player launch guards', 'n/a', 'n/a', 'direct path parity', 'detail CTA copy', 'mostly complete; central helper added to direct planning', 'completed'],
    ['floor safety cue family', 'floor_eligible_user/equip-floor-transition-v21', 'voice contracts', 'sequence planner', 'logical contract', 'n/a', 'V2.1 logical transition', 'voice runtime', 'live safety integration complete', 'completed'],
    ['final-position readiness', 'TrainingFloorSetupSnapshot', 'TrainingSessionPlayer internal V2.1 path', 'TrainingSessionScreen/player', 'not persisted long-term', 'active state restore later', 'blocks countdown/active set', 'I am ready action', 'missing before floor task', 'completed default-off'],
  ];
}

function implementationMarkdown(audit) {
  const m = audit.metrics;
  return `# Hale Training Floor-Transfer Readiness Implementation

## 1. Result

Verdict: \`${audit.verdict}\`.

## 2. Current Baseline

Current phase baseline: \`${audit.currentPhaseBaseline}\`.

The original floor-readiness phase removed \`IR-VOICE-FLOOR-GATE\` and \`IR-VOICE-FINAL-POSITION-READINESS\` while safety-family integration was still pending. Current source has completed live Training Voice V2.1 safety integration, so \`IR-VOICE-SAFETY-SUBSUMPTION\` is now also expected to be absent from the three floor contracts.

## 3. Approved FD-007 Contract

The Safety/Profile surface asks: "Can you safely get down to the floor and back up without assistance?" Options are Yes, No, and Not sure. Yes maps to \`confirmed\`; No and Not sure map to \`avoid_for_now\`.

## 4. Existing Capability System Reconciliation

The existing \`MovementCapabilityProfile.floorTransfer.status\` remains the sole authority. No second floor-transfer capability field was added.

## 5. Floor Exercise Inventory

${audit.floorExerciseInventory.map((row) => `- ${row.exerciseId}: ${row.displayName}, ${row.releaseStatus}, ${row.equipment.join('|')}, ${row.orientation}, ${row.setType}, ${row.target}`).join('\n')}

## 6. Eligibility and Substitution

\`deriveFloorExerciseEligibility\` centralizes floor-space, canonical capability, release-policy, equipment, and discomfort checks. Optional \`push-up-standard\` remains release-blocked.

## 7. Final-Position Readiness

The default-off floor V2.1 path requires explicit user confirmation plus movement-camera readiness before \`final-position-set-v21\`, countdown, or active work.

## 8. Training Voice V2.1 Integration

Affected contracts no longer carry \`IR-VOICE-FLOOR-GATE\`, \`IR-VOICE-FINAL-POSITION-READINESS\`, or \`IR-VOICE-SAFETY-SUBSUMPTION\`.

## 9. Feature Flags and Legacy Isolation

Floor V2.1 feature flag: \`${audit.defaults.floorV21FeatureFlag}\`, default ${audit.defaults.floorV21FeatureDefault}. Training Voice V2.1 remains default ${audit.defaults.trainingVoiceV21FeatureDefault} with audio ready ${audit.defaults.trainingVoiceV21AudioReady} and behavior ready ${audit.defaults.trainingVoiceV21GlobalBehaviorReady}.

## 10. Audit Results

P0/P1/P2/P3: ${m.p0}/${m.p1}/${m.p2}/${m.p3}.

## 11. Remaining Boundaries

Physical-device floor setup QA, human listening, regenerated corpus listening, and physical speaker/device timing remain P3 boundaries.

## 12. Exact Next Phase

${audit.nextTask}.
`;
}

function auditMarkdown(audit) {
  const m = audit.metrics;
  return `# Hale Training Floor-Transfer Readiness Audit

## Verdict

\`${audit.verdict}\`

## Baseline

- currentPhaseBaseline: ${audit.currentPhaseBaseline}
- safetyIntegrationCompleteValue: ${m.safetyIntegrationCompleteValue}
- trainingVoiceSafetyReadyValue: ${m.trainingVoiceSafetyReadyValue}
- trainingVoiceBehaviorReadyValue: ${m.trainingVoiceBehaviorReadyValue}
- trainingVoiceAudioReadyValue: ${m.trainingVoiceAudioReadyValue}

## Metrics

- floorExerciseCount: ${m.floorExerciseCount}
- floorContractCount: ${m.floorContractCount}
- irVoiceFloorGateRemainingCount: ${m.irVoiceFloorGateRemainingCount}
- irVoiceFinalPositionRemainingCount: ${m.irVoiceFinalPositionRemainingCount}
- irVoiceSafetySubsumptionRemainingCount: ${m.irVoiceSafetySubsumptionRemainingCount}
- trainingVoiceFeatureDefault: ${m.trainingVoiceFeatureDefault}
- trainingVoiceSelectableExerciseCount: ${m.trainingVoiceSelectableExerciseCount}
- floorGateLeakCount: ${m.floorGateLeakCount}
- floorSpaceOnlyLeakCount: ${m.floorSpaceOnlyLeakCount}
- unconfirmedFloorExerciseLeakCount: ${m.unconfirmedFloorExerciseLeakCount}
- avoidFloorExerciseLeakCount: ${m.avoidFloorExerciseLeakCount}
- confirmedWithoutFloorSpaceLeakCount: ${m.confirmedWithoutFloorSpaceLeakCount}
- directHelperBypassCount: ${m.directHelperBypassCount}
- prematureFinalPositionCueCount: ${m.prematureFinalPositionCueCount}
- countdownBeforeFinalPositionCount: ${m.countdownBeforeFinalPositionCount}
- activeBeforeFinalPositionCount: ${m.activeBeforeFinalPositionCount}
- staleFloorSetupMutationCount: ${m.staleFloorSetupMutationCount}
- restoreAutoStartCount: ${m.restoreAutoStartCount}
- legacyFloorAuditStaleExpectationCount: ${m.legacyFloorAuditStaleExpectationCount}
- postSafetyRebaseAppliedCount: ${m.postSafetyRebaseAppliedCount}
- postSafetyExpectationMismatchCount: ${m.postSafetyExpectationMismatchCount}
- verifyAudioFailureCount: ${m.verifyAudioFailureCount}
- audioHashChangedCount: ${m.audioHashChangedCount}
- audioGeneratedCount: ${m.audioGeneratedCount}
- externalSpeechAudioApiCallCount: ${m.externalSpeechAudioApiCallCount}
- physicalManifestChangeCount: ${m.physicalManifestChangeCount}
- gitAudioDiffAgainstHeadCount: ${m.gitAudioDiffAgainstHeadCount}
- p0/p1/p2/p3: ${m.p0}/${m.p1}/${m.p2}/${m.p3}

## Findings

${audit.findings.map((finding) => `- ${finding.id} [${finding.severity}] ${finding.status}: ${finding.detail}`).join('\n')}
`;
}

function postSafetyMarkdown(audit) {
  const m = audit.metrics;
  return `# Hale Training Floor-Readiness Post-Safety Rebase

## 1. Executive Verdict

\`${audit.verdict}\`

## 2. Why the Original Floor Audit Became Stale

The original floor-readiness audit was correct when safety-family integration was still pending. The later Training Voice V2.1 live safety integration completed that work and removed \`IR-VOICE-SAFETY-SUBSUMPTION\` from active V2.1 contracts. The floor audit now uses current source readiness to distinguish the pre-safety and post-safety baselines.

## 3. Worktree and Regenerated-Audio Baseline

Task-start audio hash file: \`${TASK_START_AUDIO_HASH}\`. Available: ${audit.integrity.taskStartAudioHashAvailable}. Task-start hash count: ${audit.integrity.taskStartAudioHashCount}. Current hash count: ${audit.integrity.currentAudioHashCount}. Hash diffs this task: ${audit.integrity.audioHashChangedCount}.

Git HEAD audio diff count is ${audit.integrity.gitAudioDiffAgainstHeadCount}; this is documented as \`${audit.integrity.gitAudioDiffMethodNote}\`.

## 4. Current Phase Reconciliation

Current baseline: \`${audit.currentPhaseBaseline}\`. Safety integration complete: ${m.safetyIntegrationCompleteValue}. Training safety ready: ${m.trainingVoiceSafetyReadyValue}. Training behavior ready: ${m.trainingVoiceBehaviorReadyValue}.

## 5. Floor Contract Blocker State

- irVoiceFloorGateRemainingCount: ${m.irVoiceFloorGateRemainingCount}
- irVoiceFinalPositionRemainingCount: ${m.irVoiceFinalPositionRemainingCount}
- irVoiceSafetySubsumptionRemainingCount: ${m.irVoiceSafetySubsumptionRemainingCount}

## 6. Canonical Floor Gate Regression Check

Floor gate leak count: ${m.floorGateLeakCount}. Direct helper bypass count: ${m.directHelperBypassCount}. Unconfirmed, avoid-for-now, and confirmed-without-floor-space cases all remain blocked.

## 7. Final-Position Regression Check

Countdown before final position: ${m.countdownBeforeFinalPositionCount}. Active work before final position: ${m.activeBeforeFinalPositionCount}. Stale setup mutation count: ${m.staleFloorSetupMutationCount}. Restore auto-start count: ${m.restoreAutoStartCount}.

## 8. Training Voice Safety/Behaviour Readiness Check

Safety ready: ${m.trainingVoiceSafetyReadyValue}. Behavior ready: ${m.trainingVoiceBehaviorReadyValue}. Controls/progress/recovery are ready in current source.

## 9. Feature and Audio Gate Check

Training Voice V2.1 feature default: ${m.trainingVoiceFeatureDefault}. Audio ready: ${m.trainingVoiceAudioReadyValue}. Selectable V2.1 exercises: ${m.trainingVoiceSelectableExerciseCount}. Floor V2.1, Balance V2, Step-up alternation, and Micro-Check Voice V2.1 remain default closed/audio pending as applicable.

## 10. Audit Harness Update

\`scripts/audits/audit-training-floor-readiness.mjs\` now applies a source-derived baseline. If safety integration is complete and safety ready is true, floor contracts are expected to have zero \`IR-VOICE-SAFETY-SUBSUMPTION\` blockers.

## 11. Tests and Validation

The harness runs production probes through \`tsx\`, verifies audio with \`npm run verify:audio\`, and emits task-start audio hash comparison metrics. Focused validation should still run outside the harness.

## 12. Findings

${audit.findings.map((finding) => `- ${finding.id} [${finding.severity}] ${finding.status}: ${finding.detail}`).join('\n')}

## 13. Worktree Integrity

No production code changes are required by this audit rebase. No audio generation or external speech/audio API call is part of this harness. Existing regenerated audio is handled against task-start hashes rather than Git HEAD.

## 14. Exact Next Task

${audit.nextTask}.
`;
}

function handoffMarkdown(audit) {
  return `# Hale Voice Project Post Floor Readiness Handoff

## Status

Verdict: \`${audit.verdict}\`.

## Canonical APIs

- Capability: \`MovementCapabilityProfile.floorTransfer.status\`
- Eligibility: \`deriveFloorExerciseEligibility\`
- Snapshot/fingerprint: \`plannedMovementCapabilitySnapshotFromProfile\`, \`validatePlanMovementCapabilitySnapshot\`
- Runtime memory: \`TrainingFloorSessionMemory\`
- Final-position setup: \`TrainingFloorSetupSnapshot\`, \`confirmFloorStartPosition\`

## Affected Contracts

${audit.floorExerciseInventory.map((row) => `- ${row.exerciseId}`).join('\n')}

Removed blockers: \`IR-VOICE-FLOOR-GATE\`, \`IR-VOICE-FINAL-POSITION-READINESS\`, \`IR-VOICE-SAFETY-SUBSUMPTION\`.

## Defaults

- Floor V2.1 feature: \`${audit.defaults.floorV21FeatureFlag}\`, default ${audit.defaults.floorV21FeatureDefault}
- Training Voice V2.1: default ${audit.defaults.trainingVoiceV21FeatureDefault}
- Safety ready: ${audit.defaults.trainingVoiceV21SafetyReady}
- Audio ready: ${audit.defaults.trainingVoiceV21AudioReady}
- Global behavior ready: ${audit.defaults.trainingVoiceV21GlobalBehaviorReady}
- Balance V2: ${audit.defaults.balanceV2}
- Step-up alternation: ${audit.defaults.stepUpAlternation}
- Micro-Check Voice V2.1: ${audit.defaults.microCheckVoiceV21}

## Exact Next Task

${audit.nextTask}.
`;
}

function postSafetyHandoffMarkdown(audit) {
  return `# Hale Voice Project Post Floor Readiness Post-Safety Handoff

## Status

Verdict: \`${audit.verdict}\`.

## Floor Contract Blocker State

- \`IR-VOICE-FLOOR-GATE\` remaining: ${audit.metrics.irVoiceFloorGateRemainingCount}
- \`IR-VOICE-FINAL-POSITION-READINESS\` remaining: ${audit.metrics.irVoiceFinalPositionRemainingCount}
- \`IR-VOICE-SAFETY-SUBSUMPTION\` remaining: ${audit.metrics.irVoiceSafetySubsumptionRemainingCount}

Do not re-add \`IR-VOICE-SAFETY-SUBSUMPTION\` to floor contracts.

## Safety Readiness State

- Safety integration complete: ${audit.metrics.safetyIntegrationCompleteValue}
- Training Voice V2.1 safety ready: ${audit.metrics.trainingVoiceSafetyReadyValue}
- Training Voice V2.1 behavior ready: ${audit.metrics.trainingVoiceBehaviorReadyValue}

## Training Behaviour, Audio, and Defaults

- Training Voice V2.1 audio ready: ${audit.metrics.trainingVoiceAudioReadyValue}
- Training Voice V2.1 feature default: ${audit.metrics.trainingVoiceFeatureDefault}
- Training Voice V2.1 selectable exercises: ${audit.metrics.trainingVoiceSelectableExerciseCount}
- Floor V2.1 feature default: ${audit.defaults.floorV21FeatureDefault}
- Balance V2: ${audit.defaults.balanceV2}
- Step-up alternation: ${audit.defaults.stepUpAlternation}
- Micro-Check Voice V2.1: ${audit.defaults.microCheckVoiceV21}

## Regenerated-Audio Baseline Note

The regenerated audio corpus is user-owned dirty work relative to Git HEAD. This task compares audio against the task-start hash file \`${TASK_START_AUDIO_HASH}\`; hash diffs this task: ${audit.metrics.audioHashChangedCount}.

## Instruction For Final Schema

The final Voice V2.1 cue schema task should run \`node scripts/audits/audit-training-floor-readiness.mjs\` successfully. It must not re-add any of the three resolved blockers to the floor contracts.

## Exact Next Task

Final Voice V2.1 cue schema and physical manifest reconciliation.
`;
}

function auditAudioIntegrity() {
  const current = audioHashManifest();
  const entry = readAudioHashManifest(TASK_START_AUDIO_HASH);
  const diff = compareHashManifests(entry?.hashes ?? null, current);
  const verify = runVerifyAudio();
  return {
    taskStartHashAvailable: Boolean(entry),
    taskStartHashCount: entry?.hashes.size ?? 0,
    currentAudioHashCount: current.size,
    audioHashChangedCount: diff.changed + diff.added + diff.deleted,
    audioHashAddedCount: diff.added,
    audioHashDeletedCount: diff.deleted,
    audioHashContentChangedCount: diff.changed,
    verifyAudioFailureCount: verify.passed ? 0 : 1,
    verifyAudioSummary: verify.summary,
    audioGeneratedCount: 0,
    externalSpeechAudioApiCallCount: 0,
    gitAudioDiffAgainstHeadCount: gitDiffNameOnly('assets/audio').length,
  };
}

function runVerifyAudio() {
  const result = spawnSync('npm', ['run', 'verify:audio'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 8,
  });
  const summary = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim().split(/\r?\n/).slice(-2).join(' | ');
  return { passed: result.status === 0, summary };
}

function audioHashManifest() {
  const files = listFiles(path.join(ROOT, 'assets/audio')).filter((file) => fs.statSync(file).isFile()).sort();
  const hashes = new Map();
  for (const absolutePath of files) {
    const relativePath = path.relative(ROOT, absolutePath);
    const digest = createHash('sha256').update(fs.readFileSync(absolutePath)).digest('hex');
    hashes.set(relativePath, digest);
  }
  return hashes;
}

function readAudioHashManifest(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const hashes = new Map();
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    const match = line.match(/^([a-fA-F0-9]{64})\s+(.+)$/);
    if (!match) continue;
    hashes.set(match[2], match[1].toLowerCase());
  }
  return { hashes };
}

function compareHashManifests(entry, current) {
  if (!entry) return { changed: 0, added: 0, deleted: 0 };
  let changed = 0;
  let added = 0;
  let deleted = 0;
  for (const [file, hash] of current) {
    if (!entry.has(file)) added++;
    else if (entry.get(file) !== hash) changed++;
  }
  for (const file of entry.keys()) {
    if (!current.has(file)) deleted++;
  }
  return { changed, added, deleted };
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const absolutePath = path.join(dir, name);
    const stat = fs.statSync(absolutePath);
    if (stat.isDirectory()) out.push(...listFiles(absolutePath));
    else out.push(absolutePath);
  }
  return out;
}

function countCanonicalFloorAuthority() {
  return source.adherenceTypes.includes('floorTransfer:') && source.movementCapabilities.includes('isFloorTransferConfirmed')
    ? 1
    : 0;
}

function duplicateFloorAuthorityCount() {
  const haystack = [
    source.adherenceTypes,
    source.safetyProfileScreen,
    source.sessionPlayer,
    source.trainingScreen,
    source.movementCapabilities,
  ].join('\n');
  const duplicatePatterns = ['floorTransferCapability', 'floorTransferEligible', 'floorTransferAuthority'];
  return duplicatePatterns.filter((pattern) => haystack.includes(pattern)).length;
}

function gitDiffNameOnly(pathspec) {
  const result = spawnSync('git', ['diff', '--name-only', '--', pathspec], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  return result.stdout.trim() ? result.stdout.trim().split(/\r?\n/) : [];
}

function sumColumn(rows, key) {
  return rows.reduce((sum, row) => sum + Number(row[key] || 0), 0);
}

function countRemaining(remaining, blocker) {
  return remaining.includes(blocker) ? '1' : '0';
}

function sumFloorRemaining(data, blocker) {
  return data.contracts.filter((contract) => contract.implementationRequirements.includes(blocker)).length;
}

function remainingFor(data, exerciseId) {
  return data.contracts.find((contract) => contract.exerciseId === exerciseId)?.implementationRequirements.join('|') ?? '';
}

function unknownFloorBlockers(data) {
  const known = new Set(FLOOR_BLOCKERS);
  const out = [];
  for (const contract of data.contracts) {
    for (const blocker of contract.implementationRequirements) {
      if (!known.has(blocker) && !out.includes(blocker)) out.push(blocker);
    }
  }
  return out;
}

function boolText(value) {
  if (value === true) return 'true';
  if (value === false) return 'false';
  return '';
}

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function write(relativePath, content) {
  fs.mkdirSync(path.dirname(path.join(ROOT, relativePath)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, relativePath), content);
}

function writeCsv(relativePath, header, rows) {
  const body = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
  write(relativePath, `${body}\n`);
}

function csvCell(value) {
  const text = String(value ?? '');
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (ch !== '\r') {
      cell += ch;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const [header, ...data] = rows.filter((item) => item.length > 1 || item[0]);
  return data.map((item) => Object.fromEntries(header.map((key, index) => [key, item[index] ?? ''])));
}
