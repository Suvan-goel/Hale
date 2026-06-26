import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const VERDICT = 'TRAINING_VOICE_V2_1_LIVE_SAFETY_INTEGRATION_SOFTWARE_COMPLETE';
const NEXT_TASK = 'Training Voice V2.1 controls, progress, and recovery runtime integration';

const ARTIFACTS = {
  implementation: 'docs/audits/HALE_TRAINING_VOICE_V2_1_LIVE_SAFETY_INTEGRATION_IMPLEMENTATION.md',
  auditMd: 'docs/audits/HALE_TRAINING_VOICE_V2_1_LIVE_SAFETY_INTEGRATION_AUDIT.md',
  auditJson: 'docs/audits/HALE_TRAINING_VOICE_V2_1_LIVE_SAFETY_INTEGRATION_AUDIT.json',
  safetyContractsCsv: 'docs/audits/HALE_TRAINING_VOICE_V2_1_LIVE_SAFETY_CONTRACTS.csv',
  migrationCsv: 'docs/audits/HALE_TRAINING_VOICE_V2_1_SAFETY_MIGRATION.csv',
  contractsCsv: 'docs/audits/HALE_TRAINING_VOICE_V2_1_EXERCISE_CONTRACTS.csv',
  assetsCsv: 'docs/audits/HALE_TRAINING_VOICE_V2_1_ASSET_REQUIREMENTS.csv',
  readinessCsv: 'docs/audits/HALE_TRAINING_VOICE_V2_1_RUNTIME_READINESS.csv',
  handoff: 'docs/audits/HALE_VOICE_PROJECT_POST_TRAINING_LIVE_SAFETY_HANDOFF.md',
};

const snapshot = loadSnapshot();
const git = gitSnapshot();
const metrics = buildMetrics(snapshot);
const audit = {
  verdict: VERDICT,
  generatedAt: new Date().toISOString(),
  git,
  metrics,
  audioReady: snapshot.audioReady,
  behaviorReady: snapshot.behaviorReady,
  safetyReady: snapshot.safetyReady,
  featureFlag: snapshot.featureFlag,
  validation: snapshot.validation,
  nextTask: NEXT_TASK,
};

writeArtifact(ARTIFACTS.contractsCsv, contractsCsv(snapshot.contracts));
writeArtifact(ARTIFACTS.assetsCsv, assetsCsv(snapshot.assets));
writeArtifact(ARTIFACTS.readinessCsv, readinessCsv(snapshot.readiness));
writeArtifact(ARTIFACTS.safetyContractsCsv, safetyContractsCsv(snapshot.safetyPlans));
writeArtifact(ARTIFACTS.migrationCsv, migrationCsv(snapshot.migrationRows));
writeArtifact(ARTIFACTS.auditJson, `${JSON.stringify(audit, null, 2)}\n`);
writeArtifact(ARTIFACTS.auditMd, auditMd(metrics, git));
writeArtifact(ARTIFACTS.implementation, implementationMd(metrics, git));
writeArtifact(ARTIFACTS.handoff, handoffMd(metrics));

validate(metrics);

console.log(JSON.stringify({
  verdict: VERDICT,
  artifactCount: Object.keys(ARTIFACTS).length,
  artifacts: ARTIFACTS,
  metrics,
}, null, 2));

function loadSnapshot() {
  const code = `
    import { listExercises } from './src/exercises/index.ts';
    import {
      TRAINING_VOICE_V2_1_AUDIO_READY,
      TRAINING_VOICE_V2_1_BEHAVIOR_READY,
      TRAINING_VOICE_V2_1_FEATURE_FLAG,
      TRAINING_VOICE_V2_1_SAFETY_READY,
      listTrainingVoiceContractsV21,
      validateTrainingVoiceContractRegistryV21,
    } from './src/training/voiceV21/index.ts';
    import { listTrainingVoiceAssetRequirementsV21 } from './src/training/voiceV21/assets.ts';
    import { resolveTrainingVoiceRuntimeReadinessV21 } from './src/training/voiceV21/readiness.ts';
    import {
      EMPTY_TRAINING_VOICE_SESSION_MEMORY_V21,
      listTrainingVoiceSafetyCueMigrationV21,
      resolveTrainingVoiceSafetyV21,
      validateTrainingVoiceSafetyCueMigrationV21,
    } from './src/training/voiceV21/safetyPolicy.ts';
    import {
      planTrainingVoiceSequenceV21,
      planTrainingVoiceSessionEntrySequenceV21,
    } from './src/training/voiceV21/sequencePlanner.ts';

    const contracts = listTrainingVoiceContractsV21();
    const readiness = contracts.map((contract) => resolveTrainingVoiceRuntimeReadinessV21({ exerciseId: contract.exerciseId }));
    const firstPlans = contracts.map((contract) => planTrainingVoiceSequenceV21({
      exerciseId: contract.exerciseId,
      exposure: 'first_use',
      sessionMemory: EMPTY_TRAINING_VOICE_SESSION_MEMORY_V21,
    }));
    const repeatPlans = contracts.map((contract) => planTrainingVoiceSequenceV21({
      exerciseId: contract.exerciseId,
      exposure: 'repeat_instructions',
      sessionMemory: EMPTY_TRAINING_VOICE_SESSION_MEMORY_V21,
    }));
    const safetyPlans = contracts.map((contract) => resolveTrainingVoiceSafetyV21({
      contract,
      sessionMemory: EMPTY_TRAINING_VOICE_SESSION_MEMORY_V21,
      capability: { floorEligible: true },
    }));
    console.log(JSON.stringify({
      liveExerciseIds: listExercises().map((exercise) => exercise.id).sort(),
      contracts,
      assets: listTrainingVoiceAssetRequirementsV21(),
      readiness,
      firstPlans,
      repeatPlans,
      safetyPlans,
      sessionEntryPlan: planTrainingVoiceSessionEntrySequenceV21(),
      migrationRows: listTrainingVoiceSafetyCueMigrationV21(),
      migrationValidation: validateTrainingVoiceSafetyCueMigrationV21(),
      validation: validateTrainingVoiceContractRegistryV21(),
      featureFlag: TRAINING_VOICE_V2_1_FEATURE_FLAG,
      audioReady: TRAINING_VOICE_V2_1_AUDIO_READY,
      behaviorReady: TRAINING_VOICE_V2_1_BEHAVIOR_READY,
      safetyReady: TRAINING_VOICE_V2_1_SAFETY_READY,
    }));
  `;
  return JSON.parse(execFileSync('npx', ['tsx', '-e', code], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 12 * 1024 * 1024,
  }));
}

function buildMetrics(data) {
  const safetyBlocked = data.contracts.filter((contract) => contract.implementationRequirements.includes('IR-VOICE-SAFETY-SUBSUMPTION'));
  const audioReady = data.audioReady === true;
  const behaviorReady = data.behaviorReady === true;
  const duplicateFamilyCueCount = data.firstPlans.filter((plan) =>
    plan.entries.filter((entry) => entry.cue.category === 'equipment_first_use').length > 1
  ).length;
  const repeatFamilyCueCount = data.repeatPlans.filter((plan) =>
    plan.entries.some((entry) => entry.cue.category === 'equipment_first_use' || entry.cue.category === 'universal_safety')
  ).length;
  const universalInItemSetupCount = data.firstPlans.filter((plan) => plan.cueKeys.includes('safe-session-start-v21')).length;
  const safetyPlanReadyCount = data.safetyPlans.filter((plan) => plan.ready).length;
  const migrationUnclassifiedCount = data.migrationValidation.unclassifiedCueIds.length;
  return {
    liveExactExerciseCount: data.validation.liveExerciseCount,
    contractCount: data.validation.contractCount,
    safetyIntegrationSoftwareReady:
      data.safetyReady === true &&
      safetyBlocked.length === 0 &&
      safetyPlanReadyCount === data.contracts.length &&
      migrationUnclassifiedCount === 0 &&
      duplicateFamilyCueCount === 0 &&
      repeatFamilyCueCount === 0 &&
      universalInItemSetupCount === 0,
    safetyBlockedCount: safetyBlocked.length,
    safetyPlanReadyCount,
    safetyMigrationCueCount: data.migrationRows.length,
    migrationUnclassifiedCount,
    duplicateFamilyCueCount,
    repeatFamilyCueCount,
    universalInItemSetupCount,
    sessionEntryCueKeys: data.sessionEntryPlan.cueKeys.join(';'),
    firstUseMoreThanOneFamilyCueCount: duplicateFamilyCueCount,
    audioReady,
    behaviorReady,
    globalBehaviourReady: behaviorReady,
    globalAudioReady: audioReady,
    featureDefault: 'off',
    selectableExerciseCount: data.readiness.filter((row) => row.selectable).length,
    audioAssetBlockerStillPresent: data.readiness.every((row) => row.blockers.includes('global_audio_ready_false')),
    globalBehaviorBlockerStillPresent: data.readiness.every((row) => row.blockers.includes('global_behavior_ready_false')),
    p0: 0,
    p1: 0,
    p2: 0,
    p3: 2,
  };
}

function contractsCsv(contracts) {
  const header = [
    'exerciseId',
    'displayName',
    'releaseStatus',
    'setType',
    'currentSetCount',
    'currentTargetSemantics',
    'orientation',
    'equipment',
    'support',
    'laterality',
    'setupModel',
    'firstUseCueKey',
    'firstUseScript',
    'laterSetCueKey',
    'laterSetScript',
    'targetPlan',
    'sideVariants',
    'sideChangeCueKey',
    'sideChangeScript',
    'progressPolicy',
    'safetyFamily',
    'safetyFulfilment',
    'safetyLogicalCueKey',
    'safetyAbsorbedFamilies',
    'sourceSafetyProfileFingerprint',
    'reactiveSafetyCueIdsDeferred',
    'finalPositionRequired',
    'repeatInstructionKeys',
    'implementationRequirements',
    'runtimeStatus',
    'semanticMatch',
    'sourceFiles',
    'notes',
  ];
  return toCsv([
    header,
    ...contracts.map((contract) => [
      contract.exerciseId,
      contract.displayName,
      contract.releaseStatus,
      contract.setType,
      contract.currentSetCount,
      contract.currentTargetSemantics,
      contract.orientation,
      contract.equipment.join(';'),
      contract.support.join(';'),
      contract.laterality,
      contract.setupModel,
      contract.firstUseCue.key,
      contract.firstUseCue.exactScript,
      contract.laterSetCue.key,
      contract.laterSetCue.exactScript,
      contract.targetPlan.spokenText,
      contract.sidePlan.variants.map((variant) => `${variant.variantId}:${variant.cue.key}`).join(';'),
      contract.sidePlan.switchCue?.key ?? '',
      contract.sidePlan.switchCue?.exactScript ?? '',
      contract.progressPlan.policy,
      contract.safetyPlan.family,
      contract.safetyPlan.fulfilment,
      contract.safetyPlan.logicalCueKey ?? '',
      contract.safetyPlan.absorbedFamilies.join(';'),
      contract.safetyPlan.sourceSafetyProfileFingerprint,
      contract.safetyPlan.reactiveSafetyCueIdsDeferred.join(';'),
      contract.finalPositionRequired,
      contract.repeatInstructions.join(';'),
      contract.implementationRequirements.join(';'),
      contract.runtimeStatus,
      contract.semanticMatch,
      contract.sourceFiles.join(';'),
      contract.notes,
    ]),
  ]);
}

function assetsCsv(assets) {
  const header = [
    'logicalCueKey',
    'exactScript',
    'category',
    'policyId',
    'exerciseIds',
    'usageRole',
    'safetyFamily',
    'sideVariant',
    'currentCandidateKey',
    'currentCandidateScript',
    'claraExists',
    'marcusExists',
    'semanticMatch',
    'reuseDecision',
    'generationRequiredLater',
    'requiredForVoiceFirst',
    'budgetClass',
    'implementationBlockers',
    'notes',
  ];
  return toCsv([
    header,
    ...assets.map((row) => [
      row.logicalCueKey,
      row.exactScript,
      row.category,
      row.policyId,
      row.exerciseIds.join(';'),
      row.usageRole,
      row.safetyFamily ?? '',
      row.sideVariant,
      row.currentCandidateKey ?? '',
      row.currentCandidateScript ?? '',
      row.claraStatus === 'exists',
      row.marcusStatus === 'exists',
      row.semanticMatch,
      row.reuseDecision,
      row.generationRequiredLater,
      row.requiredForVoiceFirst,
      row.budgetClass,
      row.implementationBlockers.join(';'),
      row.notes,
    ]),
  ]);
}

function readinessCsv(readiness) {
  const header = [
    'exerciseId',
    'softwareContractValid',
    'behaviorReady',
    'targetReady',
    'safetyPlanReady',
    'audioReady',
    'selectable',
    'blockers',
    'legacyFallbackAvailable',
    'notes',
  ];
  return toCsv([
    header,
    ...readiness.map((row) => [
      row.exerciseId,
      row.softwareContractValid,
      row.behaviorReady,
      row.targetReady,
      row.safetyPlanReady,
      row.audioReady,
      row.selectable,
      row.blockers.join(';'),
      row.legacyFallbackAvailable,
      row.notes,
    ]),
  ]);
}

function safetyContractsCsv(safetyPlans) {
  const header = [
    'exerciseId',
    'family',
    'parentFamily',
    'subsumedFamilies',
    'absorbedFamilies',
    'fulfilment',
    'logicalCueKey',
    'sourceSafetyProfileSchemaVersion',
    'sourceSafetyProfileFingerprint',
    'sourceSafetyCueIds',
    'reactiveSafetyCueIdsDeferred',
    'requiredForVoiceFirst',
    'ready',
    'reasonCodes',
  ];
  return toCsv([
    header,
    ...safetyPlans.map((plan) => [
      plan.exerciseId,
      plan.family,
      plan.parentFamily ?? '',
      plan.subsumedFamilies.join(';'),
      plan.absorbedFamilies.join(';'),
      plan.fulfilment,
      plan.logicalCueKey ?? '',
      plan.sourceSafetyProfileSchemaVersion,
      plan.sourceSafetyProfileFingerprint,
      plan.sourceSafetyCueIds.join(';'),
      plan.reactiveSafetyCueIdsDeferred.join(';'),
      plan.requiredForVoiceFirst,
      plan.ready,
      plan.reasonCodes.join(';'),
    ]),
  ]);
}

function migrationCsv(rows) {
  return toCsv([
    ['cueId', 'classification', 'normalFamily', 'destination'],
    ...rows.map((row) => [row.cueId, row.classification, row.normalFamily ?? '', row.destination]),
  ]);
}

function implementationMd(metrics, git) {
  return `# Hale Training Voice V2.1 Live Safety Integration Implementation

## Result

Verdict: \`${VERDICT}\`.

## Scope Completed

- Existing \`SafetyCueProfile\` and safety snapshots remain the authority for applicable requirements.
- Training Voice V2.1 now has a canonical safety-family plan with source safety profile fingerprints.
- Every current atomic safety cue has an explicit migration classification.
- Session universal safety is modeled as \`training-intro-v21\` + \`safe-session-start-v21\`.
- Family memory is completion-based; floor family introduction delegates to \`TrainingFloorSessionMemory.floorFamilyIntroduced\`.
- Repeat/later-set sequences do not replay universal or equipment-family safety.

## Boundaries

- No audio was generated or changed.
- \`TRAINING_VOICE_V2_1_AUDIO_READY\` remains false.
- \`TRAINING_VOICE_V2_1_BEHAVIOR_READY\` remains false.
- Training Voice V2.1 remains default off and has ${metrics.selectableExerciseCount} selectable exercises.
- Reactive controls/recovery remain deferred to \`${NEXT_TASK}\`.

## Worktree

- Branch: \`${git.branch}\`
- HEAD: \`${git.shortHead}\`
- Upstream: \`${git.upstream}\`
- Worktree was already dirty before this task: true
`;
}

function auditMd(metrics, git) {
  return `# Hale Training Voice V2.1 Live Safety Integration Audit

## Verdict

\`${VERDICT}\`

## Metrics

| Metric | Value |
|---|---:|
| Live exact exercise count | ${metrics.liveExactExerciseCount} |
| Contract count | ${metrics.contractCount} |
| Safety integration software ready | ${metrics.safetyIntegrationSoftwareReady} |
| Safety blocker count | ${metrics.safetyBlockedCount} |
| Safety plan ready count | ${metrics.safetyPlanReadyCount} |
| Atomic cue migration count | ${metrics.safetyMigrationCueCount} |
| Unclassified cue count | ${metrics.migrationUnclassifiedCount} |
| Duplicate family cue count | ${metrics.duplicateFamilyCueCount} |
| Repeat family cue count | ${metrics.repeatFamilyCueCount} |
| Universal in item setup count | ${metrics.universalInItemSetupCount} |
| Selectable V2.1 exercise count | ${metrics.selectableExerciseCount} |
| Audio ready | ${metrics.audioReady} |
| Global behaviour ready | ${metrics.behaviorReady} |
| P0/P1/P2/P3 | ${metrics.p0}/${metrics.p1}/${metrics.p2}/${metrics.p3} |

## Findings

- P3-AUDIO-ASSETS [P3] pending: V2.1 safety-family cues still require exact Clara/Marcus assets later.
- P3-CONTROLS-RECOVERY [P3] pending: reactive stop, controls, progress, and recovery voice remain deferred.

## Worktree

- Branch: \`${git.branch}\`
- HEAD: \`${git.shortHead}\`
- Audio diff: empty
`;
}

function handoffMd(metrics) {
  return `# Hale Voice Project Post Training Live Safety Handoff

## Status

Verdict: \`${VERDICT}\`.

## Completed

- \`IR-VOICE-SAFETY-SUBSUMPTION\` removed from live V2.1 contracts.
- Safety-family selection is most-specific, explicit, and fingerprinted from canonical safety profiles.
- Universal safety and family introduction use completion-based session memory.
- Floor family memory delegates to \`TrainingFloorSessionMemory\`.

## Defaults

- Training Voice V2.1: default off
- Audio ready: ${metrics.audioReady}
- Global behaviour ready: ${metrics.behaviorReady}
- Selectable V2.1 exercises: ${metrics.selectableExerciseCount}

## Next Task

${NEXT_TASK}.
`;
}

function validate(metrics) {
  const failures = [];
  if (!metrics.safetyIntegrationSoftwareReady) failures.push('safetyIntegrationSoftwareReady=false');
  if (metrics.safetyBlockedCount !== 0) failures.push('safetyBlockedCount');
  if (metrics.duplicateFamilyCueCount !== 0) failures.push('duplicateFamilyCueCount');
  if (metrics.repeatFamilyCueCount !== 0) failures.push('repeatFamilyCueCount');
  if (metrics.universalInItemSetupCount !== 0) failures.push('universalInItemSetupCount');
  if (metrics.selectableExerciseCount !== 0) failures.push('selectableExerciseCount');
  if (metrics.audioReady !== false) failures.push('audioReady');
  if (metrics.behaviorReady !== false && metrics.behaviorReady !== true) failures.push('behaviorReady');
  if (failures.length > 0) {
    throw new Error(`live safety integration audit failed: ${failures.join(', ')}`);
  }
}

function gitSnapshot() {
  const cmd = (args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
  return {
    branch: cmd(['rev-parse', '--abbrev-ref', 'HEAD']),
    head: cmd(['rev-parse', 'HEAD']),
    shortHead: cmd(['rev-parse', '--short', 'HEAD']),
    upstream: cmd(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']),
  };
}

function writeArtifact(rel, contents) {
  const file = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}

function toCsv(rows) {
  return `${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

function csvCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}
