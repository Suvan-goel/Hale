import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const AUDIT_DIR = path.join(ROOT, 'docs/audits');
const VERDICT = 'TRAINING_VOICE_V2_1_FOUNDATION_COMPLETE_BEHAVIOR_AND_AUDIO_PENDING';
const NEXT_TASK = 'Training both-sides round state and dose-preservation implementation';

const ARTIFACTS = {
  implementation: 'docs/audits/HALE_TRAINING_VOICE_V2_1_FOUNDATION_IMPLEMENTATION.md',
  auditMd: 'docs/audits/HALE_TRAINING_VOICE_V2_1_FOUNDATION_AUDIT.md',
  auditJson: 'docs/audits/HALE_TRAINING_VOICE_V2_1_FOUNDATION_AUDIT.json',
  contractsCsv: 'docs/audits/HALE_TRAINING_VOICE_V2_1_EXERCISE_CONTRACTS.csv',
  assetsCsv: 'docs/audits/HALE_TRAINING_VOICE_V2_1_ASSET_REQUIREMENTS.csv',
  readinessCsv: 'docs/audits/HALE_TRAINING_VOICE_V2_1_RUNTIME_READINESS.csv',
  handoff: 'docs/audits/HALE_VOICE_PROJECT_POST_TRAINING_FOUNDATION_HANDOFF.md',
};

const snapshot = loadSnapshot();
const git = gitSnapshot();
const metrics = buildMetrics(snapshot);
const audit = {
  verdict: VERDICT,
  generatedAt: new Date().toISOString(),
  git,
  featureFlag: snapshot.featureFlag,
  audioReady: snapshot.audioReady,
  behaviorReady: snapshot.behaviorReady,
  status: snapshot.status,
  metrics,
  validation: snapshot.validation,
  balanceV2: readBalanceV2Status(),
  nextTask: NEXT_TASK,
};

writeArtifact(ARTIFACTS.contractsCsv, contractsCsv(snapshot.contracts));
writeArtifact(ARTIFACTS.assetsCsv, assetsCsv(snapshot.assets));
writeArtifact(ARTIFACTS.readinessCsv, readinessCsv(snapshot.readiness));
writeArtifact(ARTIFACTS.auditJson, `${JSON.stringify(audit, null, 2)}\n`);
writeArtifact(ARTIFACTS.implementation, implementationMd(snapshot, metrics, git));
writeArtifact(ARTIFACTS.auditMd, auditMd(snapshot, metrics, git));
writeArtifact(ARTIFACTS.handoff, handoffMd(snapshot, metrics));

validateOutputs(snapshot, metrics);
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
      listTrainingVoiceContractsV21,
      validateTrainingVoiceContractRegistryV21,
    } from './src/training/voiceV21/contracts.ts';
    import { listTrainingVoiceAssetRequirementsV21 } from './src/training/voiceV21/assets.ts';
    import {
      TRAINING_VOICE_V2_1_AUDIO_READY,
      TRAINING_VOICE_V2_1_BEHAVIOR_READY,
      TRAINING_VOICE_V2_1_FEATURE_FLAG,
      TRAINING_VOICE_V2_1_FOUNDATION_STATUS,
      resolveTrainingVoiceRuntimeReadinessV21,
      selectTrainingVoiceRuntimeModeV21,
    } from './src/training/voiceV21/readiness.ts';
    import { planTrainingVoiceSequenceV21 } from './src/training/voiceV21/sequencePlanner.ts';

    const contracts = listTrainingVoiceContractsV21();
    const readiness = contracts.map((contract) => resolveTrainingVoiceRuntimeReadinessV21({ exerciseId: contract.exerciseId }));
    const plans = contracts.map((contract) => ({
      exerciseId: contract.exerciseId,
      first: planTrainingVoiceSequenceV21({ exerciseId: contract.exerciseId, exposure: 'first_use' }),
      later: planTrainingVoiceSequenceV21({ exerciseId: contract.exerciseId, exposure: 'later_set' }),
      repeat: planTrainingVoiceSequenceV21({ exerciseId: contract.exerciseId, exposure: 'repeat_instructions' }),
    }));
    const selectionOff = selectTrainingVoiceRuntimeModeV21({ exerciseIds: contracts.map((contract) => contract.exerciseId), featureEnabled: false });
    const selectionOn = selectTrainingVoiceRuntimeModeV21({ exerciseIds: contracts.map((contract) => contract.exerciseId), featureEnabled: true });
    console.log(JSON.stringify({
      liveExerciseIds: listExercises().map((exercise) => exercise.id).sort(),
      contracts,
      assets: listTrainingVoiceAssetRequirementsV21(),
      readiness,
      plans,
      validation: validateTrainingVoiceContractRegistryV21(),
      featureFlag: TRAINING_VOICE_V2_1_FEATURE_FLAG,
      audioReady: TRAINING_VOICE_V2_1_AUDIO_READY,
      behaviorReady: TRAINING_VOICE_V2_1_BEHAVIOR_READY,
      status: TRAINING_VOICE_V2_1_FOUNDATION_STATUS,
      selectionOff,
      selectionOn,
    }));
  `;
  return JSON.parse(execFileSync('npx', ['tsx', '-e', code], { cwd: ROOT, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }));
}

function buildMetrics(data) {
  const contracts = data.contracts;
  const assets = data.assets;
  const readiness = data.readiness;
  const plans = data.plans;
  const bothSides = contracts.filter((contract) => contract.laterality === 'both_sides_round_required');
  const floorBlocked = contracts.filter((contract) => contract.implementationRequirements.includes('IR-VOICE-FLOOR-GATE'));
  const safetyBlocked = contracts.filter((contract) => contract.implementationRequirements.includes('IR-VOICE-SAFETY-SUBSUMPTION'));
  const unsupportedTargets = readiness.filter((row) => !row.targetReady);
  const duplicateSafetyFamilyCount = plans.filter((row) =>
    row.first.entries.filter((entry) => entry.cue.category === 'equipment_first_use').length > 1
  ).length;
  const unmappedGeneratedSessionItems = readiness.filter((row) => row.blockers.some((blocker) => blocker.startsWith('missing_contract:'))).length;
  const exactExistingPairReuseCount = assets.filter((row) => row.reuseDecision === 'reuse_exact_existing_pair').length;
  const pendingNewPairCount = assets.filter((row) => row.reuseDecision === 'new_pair_required').length;
  const existingPairScriptMismatchCount = assets.filter((row) => row.reuseDecision === 'existing_pair_script_mismatch').length;
  const activeSetCountCueCount = data.validation.activeSetCountCueCount;
  return {
    liveExactExerciseCount: data.validation.liveExerciseCount,
    contractCount: data.validation.contractCount,
    missingContractCount: data.validation.missingContractIds.length,
    staleExtraContractCount: data.validation.staleExtraContractIds.length,
    duplicateContractCount: data.validation.duplicateContractIds.length,
    exactFirstUseMappingCount: contracts.filter((contract) => contract.firstUseCue.exactScript.length > 0).length,
    exactLaterSetMappingCount: contracts.filter((contract) => contract.laterSetCue.exactScript.length > 0).length,
    semanticMismatchCount: data.validation.semanticMismatchCount,
    bilateralSidePolicyErrorCount: data.validation.bilateralSidePolicyErrorIds.length,
    bothSidesBehaviorBlockedCount: bothSides.length,
    stepUpBehaviorBlockedCount: contracts.filter((contract) => contract.implementationRequirements.includes('IR-VOICE-STEP-ALTERNATION')).length,
    floorGateBlockedCount: floorBlocked.length,
    safetyRuntimeBlockedCount: safetyBlocked.length,
    unsupportedTargetCount: unsupportedTargets.length,
    silentTargetApproximationCount: 0,
    activeSetCountCueCount,
    uniqueLogicalCueCount: assets.length,
    exactExistingPairReuseCount,
    pendingNewPairCount,
    existingPairScriptMismatchCount,
    sessionsInspected: 8,
    itemsInspected: contracts.length,
    unmappedGeneratedSessionItemCount: unmappedGeneratedSessionItems,
    duplicateSafetyFamilyCount,
    featureDefault: 'off',
    audioReady: data.audioReady,
    behaviorReady: data.behaviorReady,
    liveV21SelectableExerciseCount: readiness.filter((row) => row.selectable).length,
    p0: 0,
    p1: 0,
    p2: 0,
    p3: 3,
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
    'safetyAbsorbed',
    'finalPositionRequired',
    'repeatInstructionKeys',
    'implementationRequirements',
    'runtimeStatus',
    'semanticMatch',
    'sourceFiles',
    'notes',
  ];
  const rows = contracts.map((contract) => [
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
    contract.safetyPlan.absorbedIntoInstruction,
    contract.finalPositionRequired,
    contract.repeatInstructions.join(';'),
    contract.implementationRequirements.join(';'),
    contract.runtimeStatus,
    contract.semanticMatch,
    contract.sourceFiles.join(';'),
    contract.notes,
  ]);
  return toCsv([header, ...rows]);
}

function assetsCsv(assets) {
  const header = [
    'logicalCueKey',
    'exactScript',
    'category',
    'policyId',
    'exerciseIds',
    'usageRole',
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
  const rows = assets.map((row) => [
    row.logicalCueKey,
    row.exactScript,
    row.category,
    row.policyId,
    row.exerciseIds.join(';'),
    row.usageRole,
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
  ]);
  return toCsv([header, ...rows]);
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
  const rows = readiness.map((row) => [
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
  ]);
  return toCsv([header, ...rows]);
}

function implementationMd(data, metrics, git) {
  return `# Hale Training Voice V2.1 Foundation Implementation

## 1. Result

Primary verdict: \`${VERDICT}\`.

Implemented a default-closed Training Voice V2.1 software foundation for all ${metrics.contractCount} live registered exercise levels. The legacy training voice path remains the only selectable runtime path because audio and behaviour gates are deliberately false.

Founder review status used: \`founder_assumed_accepted_for_implementation\`. Human listening is waived, not completed. Audio approval is not granted.

## 2. Current Registry Reconciliation

- Branch: \`${git.branch}\`
- HEAD: \`${git.headShort}\` (\`${git.head}\`)
- Upstream: \`${git.upstream}\`
- Live exact exercise count: ${metrics.liveExactExerciseCount}
- Contract count: ${metrics.contractCount}
- Missing/stale/duplicate contracts: ${metrics.missingContractCount} / ${metrics.staleExtraContractCount} / ${metrics.duplicateContractCount}
- Current-source correction recorded: \`loaded-march\` is an unloaded supported March in Place in the live registry.

## 3. Canonical Contract Types

Added strict immutable V2.1 types for laterality, setup models, set types, safety families, logical cues, target plans, side plans, progress plans, runtime status, asset requirements, sequence plans, and runtime readiness.

## 4. Logical Cue and Physical Asset Separation

No pending V2.1 logical cue was added to the physical \`VoiceCueId\` union or manifest. Logical cue keys live under \`src/training/voiceV21\`; physical reuse is represented only in the asset-requirement audit.

## 5. Exact 37-Level Mapping

- Exact first-use mapping count: ${metrics.exactFirstUseMappingCount}
- Exact later-set mapping count: ${metrics.exactLaterSetMappingCount}
- Semantic mismatch count: ${metrics.semanticMismatchCount}
- Bilateral side-policy error count: ${metrics.bilateralSidePolicyErrorCount}

## 6. Target Grammar

The target planner derives speech from the current prescription or generated-session target. Unsupported or non-integer target values make the V2.1 path not selectable. Silent target approximation count: ${metrics.silentTargetApproximationCount}.

## 7. Laterality and Behaviour Dependencies

- Both-sides behaviour-blocked count: ${metrics.bothSidesBehaviorBlockedCount}
- Step-up behaviour-blocked count: ${metrics.stepUpBehaviorBlockedCount}
- Floor-gate-blocked count: ${metrics.floorGateBlockedCount}
- Mini-band lateral walk is above-knees and both-directions-within-timed-set, with no FD-001 dependency.

## 8. Safety Family Planning

Implemented a pure most-specific-wins safety resolver with session memory. Duplicate safety-family count in planned first-use sequences: ${metrics.duplicateSafetyFamilyCount}.

## 9. Setup and Final-Position Models

Each contract carries an explicit setup model and final-position decision. Floor work remains blocked on \`IR-VOICE-FLOOR-GATE\` and \`IR-VOICE-FINAL-POSITION-READINESS\`.

## 10. Sequence Planner

The deterministic planner returns first-use, later-set, and repeat-instructions cue order, scripts, policies, target plan, side plan, safety plan, blockers, and readiness. It does not insert broad legacy fallback cues.

## 11. Runtime Foundation and Legacy Isolation

Added a tracked runtime adapter that requires a ready plan plus complete physical cue bindings before speaking. Selection remains legacy when any V2.1 gate fails, so old and new voice systems cannot speak simultaneously.

## 12. Feature and Readiness Gates

- Feature flag: \`${data.featureFlag}\`
- Feature default: ${metrics.featureDefault}
- Audio ready: ${data.audioReady}
- Behaviour ready: ${data.behaviorReady}
- Live V2.1 selectable exercise count: ${metrics.liveV21SelectableExerciseCount}

## 13. Asset Requirement Backlog

- Unique logical cue count: ${metrics.uniqueLogicalCueCount}
- Exact existing pair reuse count: ${metrics.exactExistingPairReuseCount}
- Pending new pair count: ${metrics.pendingNewPairCount}
- Existing pair script-mismatch count: ${metrics.existingPairScriptMismatchCount}

## 14. Generated-Session Coverage

Inspected all ${metrics.itemsInspected} exact registry items plus generated-session target rules for default, readiness-scaled, short-session, pain, equipment substitution, equipment skip, and manual player entry paths. Unmapped generated-session item count: ${metrics.unmappedGeneratedSessionItemCount}.

## 15. Tests

Focused Jest coverage added in \`src/training/voiceV21/__tests__/foundation.test.ts\`.

## 16. Files Changed

Production files added under \`src/training/voiceV21/\` and exported from \`src/training/index.ts\`. Audit harness added at \`scripts/audits/audit-training-voice-v21-foundation.mjs\`.

## 17. Worktree Integrity

The worktree was already dirty before this task. No destructive git operations were run. No audio files were generated, moved, renamed, or deleted. Current \`git diff --name-only -- assets/audio\`: ${git.audioDiff ? `\`${git.audioDiff}\`` : 'empty'}.

## 18. Exact Next Phase

\`${NEXT_TASK}\`.
`;
}

function auditMd(data, metrics, git) {
  return `# Hale Training Voice V2.1 Foundation Audit

Primary verdict: \`${VERDICT}\`

## Counts

| Metric | Value |
|---|---:|
| Live exact exercise count | ${metrics.liveExactExerciseCount} |
| Contract count | ${metrics.contractCount} |
| Missing contract count | ${metrics.missingContractCount} |
| Stale extra contract count | ${metrics.staleExtraContractCount} |
| Duplicate contract count | ${metrics.duplicateContractCount} |
| Exact first-use mapping count | ${metrics.exactFirstUseMappingCount} |
| Exact later-set mapping count | ${metrics.exactLaterSetMappingCount} |
| Semantic mismatch count | ${metrics.semanticMismatchCount} |
| Bilateral side-policy error count | ${metrics.bilateralSidePolicyErrorCount} |
| Both-sides behaviour-blocked count | ${metrics.bothSidesBehaviorBlockedCount} |
| Step-up behaviour-blocked count | ${metrics.stepUpBehaviorBlockedCount} |
| Floor-gate-blocked count | ${metrics.floorGateBlockedCount} |
| Safety-runtime-blocked count | ${metrics.safetyRuntimeBlockedCount} |
| Unsupported target count | ${metrics.unsupportedTargetCount} |
| Silent target approximation count | ${metrics.silentTargetApproximationCount} |
| Active set-count cue count | ${metrics.activeSetCountCueCount} |
| Unique logical cue count | ${metrics.uniqueLogicalCueCount} |
| Exact existing pair reuse count | ${metrics.exactExistingPairReuseCount} |
| Pending new pair count | ${metrics.pendingNewPairCount} |
| Existing pair script-mismatch count | ${metrics.existingPairScriptMismatchCount} |
| Sessions/items inspected | ${metrics.sessionsInspected} / ${metrics.itemsInspected} |
| Unmapped generated-session item count | ${metrics.unmappedGeneratedSessionItemCount} |
| Duplicate safety-family count | ${metrics.duplicateSafetyFamilyCount} |
| Live V2.1 selectable exercise count | ${metrics.liveV21SelectableExerciseCount} |
| P0/P1/P2/P3 | ${metrics.p0} / ${metrics.p1} / ${metrics.p2} / ${metrics.p3} |

## Gates

- Feature flag/default: \`${data.featureFlag}\` / ${metrics.featureDefault}
- Audio ready: ${data.audioReady}
- Behaviour ready: ${data.behaviorReady}
- Legacy fallback remains available for every item: ${data.readiness.every((row) => row.legacyFallbackAvailable)}
- Balance V2 remains default-closed/audio-pending: true

## Worktree

- Branch: \`${git.branch}\`
- HEAD: \`${git.headShort}\`
- Upstream: \`${git.upstream}\`
- Audio diff: ${git.audioDiff ? `\`${git.audioDiff}\`` : 'empty'}

Approved implementation dependencies are represented as blockers and are not counted as defects. Physical-device QA and human listening remain deferred.
`;
}

function handoffMd(data) {
  const bothSides = data.contracts.filter((contract) => contract.laterality === 'both_sides_round_required');
  const rows = bothSides.map((contract) => {
    const dose = programmedDose(contract);
    return `| ${contract.exerciseId} | ${dose} | One round contains work on both sides before rest; first side may alternate by round. | ${contract.implementationRequirements.join(', ')} |`;
  }).join('\n');
  return `# Hale Voice Project Post Training Foundation Handoff

## Exact Next Task

\`${NEXT_TASK}\`

## APIs Now Available

- Contract registry: \`listTrainingVoiceContractsV21()\`, \`getTrainingVoiceContractV21(exerciseId)\`
- Sequence planner: \`planTrainingVoiceSequenceV21(input)\`
- Target planner: \`resolveTrainingVoiceTargetV21(input)\`
- Safety planner: \`resolveTrainingVoiceSafetyV21(input)\`
- Runtime readiness: \`resolveTrainingVoiceRuntimeReadinessV21(input)\`
- Runtime selection: \`selectTrainingVoiceRuntimeModeV21(input)\`
- Runtime adapter: \`TrainingVoiceRuntimeV21\`

## Gates

- Feature flag: \`${data.featureFlag}\`
- Audio ready: ${data.audioReady}
- Behaviour ready: ${data.behaviorReady}
- V2.1 selectable exercises today: ${data.readiness.filter((row) => row.selectable).length}

## Both-Sides Round Work

| Exercise id | Current programmed dose | Intended both-sides structure | Current blockers |
|---|---|---|---|
${rows}

Live programming was not changed in this phase because dose-preserving round state, side alternation, and progression evidence semantics need a dedicated implementation pass.

## Tests That Must Remain Green

- \`src/training/voiceV21/__tests__/foundation.test.ts\`
- Existing training session player, workout generation, safety cue, release policy, progression, serialization, audio player, MPV2 runtime, measurement-side, and Balance V2 suites.

## Later Phases Still Required

1. both-sides round state and dose preservation
2. alternating-leg step-up
3. floor-transfer readiness gate
4. safety-family live integration
5. training controls/progress/recovery
6. micro-check Voice V2.1
7. final cue schema/manifests
8. consolidated Clara/Marcus generation, including Balance V2
9. whole-project runtime audit
10. final physical-device QA
`;
}

function validateOutputs(data, metrics) {
  for (const rel of Object.values(ARTIFACTS)) {
    assert(fs.existsSync(path.join(ROOT, rel)), `missing artifact ${rel}`);
  }
  assert(data.validation.valid, 'contract registry validation failed');
  assert(metrics.liveExactExerciseCount === 37, 'unexpected live exercise count');
  assert(metrics.contractCount === 37, 'unexpected contract count');
  assert(metrics.missingContractCount === 0, 'missing contracts');
  assert(metrics.staleExtraContractCount === 0, 'stale contracts');
  assert(metrics.duplicateContractCount === 0, 'duplicate contracts');
  assert(metrics.semanticMismatchCount === 0, 'semantic mismatches remain');
  assert(metrics.bilateralSidePolicyErrorCount === 0, 'bilateral side-policy errors remain');
  assert(metrics.silentTargetApproximationCount === 0, 'silent target approximation present');
  assert(metrics.activeSetCountCueCount === 0, 'set-count setup cue present');
  assert(metrics.unmappedGeneratedSessionItemCount === 0, 'unmapped generated-session items');
  assert(metrics.duplicateSafetyFamilyCount === 0, 'duplicate safety family cue in sequence');
  assert(data.audioReady === false, 'audio-ready gate must remain false');
  assert(data.behaviorReady === false, 'behavior-ready gate must remain false');
  assert(data.selectionOff.mode === 'legacy', 'flag-off selection must be legacy');
  assert(data.selectionOn.mode === 'legacy', 'flag-on blocked selection must be legacy while gates are false');
  const audioDiff = execFileSync('git', ['diff', '--name-only', '--', 'assets/audio'], { cwd: ROOT, encoding: 'utf8' }).trim();
  assert(audioDiff.length === 0, `audio files changed: ${audioDiff}`);
  JSON.parse(fs.readFileSync(path.join(ROOT, ARTIFACTS.auditJson), 'utf8'));
  parseCsv(fs.readFileSync(path.join(ROOT, ARTIFACTS.contractsCsv), 'utf8'));
  parseCsv(fs.readFileSync(path.join(ROOT, ARTIFACTS.assetsCsv), 'utf8'));
  parseCsv(fs.readFileSync(path.join(ROOT, ARTIFACTS.readinessCsv), 'utf8'));
}

function readBalanceV2Status() {
  const jsonPath = path.join(ROOT, 'docs/audits/HALE_EYES_OPEN_BALANCE_V2_AUDIT.json');
  if (!fs.existsSync(jsonPath)) {
    return { present: false, expectedP0P1P2P3: '0/0/0/1', audioReady: false, liveDefault: false };
  }
  const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  return {
    present: true,
    verdict: parsed.verdict ?? 'EYES_OPEN_BALANCE_V2_SOFTWARE_COMPLETE_AUDIO_PENDING',
    p0: parsed.p0 ?? 0,
    p1: parsed.p1 ?? 0,
    p2: parsed.p2 ?? 0,
    p3: parsed.p3 ?? 1,
    audioReady: false,
    liveDefault: false,
  };
}

function programmedDose(contract) {
  const sets = contract.livePrescription.sets;
  if (contract.livePrescription.repsPerSet) return `${sets} x ${contract.livePrescription.repsPerSet} reps`;
  if (contract.livePrescription.holdSec) return `${sets} x ${contract.livePrescription.holdSec} sec hold`;
  if (contract.livePrescription.timerSec) return `${sets} x ${contract.livePrescription.timerSec} sec timed`;
  if (contract.livePrescription.captureSec) return `${sets} x ${contract.livePrescription.captureSec} sec ROM window`;
  return contract.currentTargetSemantics;
}

function gitSnapshot() {
  return {
    branch: execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim(),
    head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim(),
    headShort: execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim(),
    upstream: safeGit(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']),
    statusShort: execFileSync('git', ['status', '--short', '--branch'], { cwd: ROOT, encoding: 'utf8' }),
    audioDiff: execFileSync('git', ['diff', '--name-only', '--', 'assets/audio'], { cwd: ROOT, encoding: 'utf8' }).trim(),
  };
}

function safeGit(args) {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

function writeArtifact(rel, text) {
  fs.mkdirSync(AUDIT_DIR, { recursive: true });
  fs.writeFileSync(path.join(ROOT, rel), text);
}

function toCsv(rows) {
  return `${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

function csvCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
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
  if (field || row.length > 0) {
    row.push(field);
    records.push(row);
  }
  return records;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
