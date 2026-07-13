# Codex Prompt: Pearl Final Voice V2.1 Cue Schema and Physical Manifest Reconciliation

Read this entire prompt before changing anything.

Pearl's V2.1 voice behavior is now software-complete for Training and Micro-Check, and the next phase is:

```text
Final Voice V2.1 cue schema and physical manifest reconciliation
```

This task freezes the final V2.1 cue surface and prepares the consolidated Clara/Marcus generation backlog. It must **not** generate audio, call ElevenLabs, enable any feature, or perform device QA.

---

## 0. Current known state

Use the latest reports and source, not memory. The expected state is:

```text
Training Voice V2.1 behavior ready: true
Training Voice V2.1 audio ready: false
Training Voice V2.1 feature: default off
Training Voice V2.1 selectable exercises: 0

Micro-Check Voice V2.1 behavior ready: true
Micro-Check Voice V2.1 audio ready: false
Micro-Check Voice V2.1 feature: default off
Micro-Check selectable types: 0

Micro-Check Voice V2.1 verdict: MICRO_CHECK_VOICE_V2_1_SOFTWARE_COMPLETE
Balance Eyes-Open V2: software complete, audio pending, default closed
Step-up alternation: software complete, default off
Floor V2.1: software complete, default off
Human listening: waived, not completed
Physical-device QA: deferred
```

Expected successful verdict for this task:

```text
VOICE_V2_1_FINAL_SCHEMA_COMPLETE_GENERATION_PENDING
```

The exact next task after this one should be:

```text
Consolidated Clara/Marcus Voice V2.1 asset generation
```

---

## 1. Critical regenerated-audio baseline note

The founder intentionally regenerated the current Clara and Marcus audio corpus using a new ElevenLabs generation model before the successful Micro-Check V2.1 implementation.

At task start, `npm run verify:audio` should pass against that regenerated corpus:

```text
safety: 44 required cues / 88 Clara+Marcus assets
movementProfileV2: 31 required cues / 62 Clara+Marcus assets
total required assets: 150
```

The Micro-Check task also verified a task-start audio hash snapshot of 377 files and ended with the same 377 hashes, with 0 audio changes relative to task start.

Git may still show regenerated audio as modified or untracked relative to HEAD. Treat all audio files, audio metadata, fingerprints, generation-source changes, and model identifiers already present at task start as user-owned baseline work.

### Required entry snapshot

Run and record:

```bash
npm run verify:audio
git status --short -- assets/audio scripts/generate-audio.ts scripts/verify-audio.ts src/audio
git diff --stat -- assets/audio scripts/generate-audio.ts scripts/verify-audio.ts src/audio
find assets/audio -type f | sort | xargs shasum -a 256 > /tmp/pearl_final_voice_schema_audio_entry.sha256
```

### Required exit snapshot

Run and record:

```bash
find assets/audio -type f | sort | xargs shasum -a 256 > /tmp/pearl_final_voice_schema_audio_exit.sha256
diff -u /tmp/pearl_final_voice_schema_audio_entry.sha256 /tmp/pearl_final_voice_schema_audio_exit.sha256
```

Success requires 0 audio-file hash changes relative to task start, not relative to Git HEAD.

Older audits that compare audio directly to Git HEAD may fail because of the regenerated corpus. Do not "fix" those by reverting, deleting, or regenerating audio. Supersede stale Git-HEAD audio-diff checks with current `npm run verify:audio` plus the task-start hash snapshot.

---

## 2. Mandatory entry baseline

Before editing production code, run and record:

```bash
npm run verify:audio
npx tsc --noEmit --pretty false
```

Run current relevant audits where present:

```bash
node scripts/audits/audit-micro-check-voice-v21.mjs
node scripts/audits/audit-training-voice-v21-controls-progress-recovery.mjs
node scripts/audits/audit-training-voice-v21-live-safety-integration.mjs
node scripts/audits/audit-training-floor-readiness.mjs
node scripts/audits/audit-eyes-open-balance-v2.mjs
```

If `audit-eyes-open-balance-v2.mjs` fails only because it compares regenerated audio against Git HEAD rather than the task-start regenerated baseline, record that as:

```text
baseline_audio_diff_method_stale_not_product_failure
```

Do not modify audio to satisfy a stale Git-HEAD comparison.

If any relevant failure exists in audio verification, typecheck, cue registry, physical manifests, Training V2.1, Micro-Check V2.1, MPV2, or Balance V2, stop and return:

```text
FINAL_VOICE_SCHEMA_REMEDIATION_REQUIRED
```

or:

```text
CURRENT_SOURCE_REBASE_REQUIRED
```

with exact evidence.

---

## 3. Source artifacts to read

Read current source and these artifacts.

### Micro-Check Voice V2.1

- `docs/audits/PEARL_MICRO_CHECK_VOICE_V2_1_IMPLEMENTATION.md`
- `docs/audits/PEARL_MICRO_CHECK_VOICE_V2_1_AUDIT.md`
- `docs/audits/PEARL_MICRO_CHECK_VOICE_V2_1_AUDIT.json`
- `docs/audits/PEARL_MICRO_CHECK_VOICE_V2_1_CONTRACT_MATRIX.csv`
- `docs/audits/PEARL_MICRO_CHECK_VOICE_V2_1_PROTOCOL_COMPATIBILITY_MATRIX.csv`
- `docs/audits/PEARL_MICRO_CHECK_VOICE_V2_1_RUNTIME_SCENARIOS.csv`
- `docs/audits/PEARL_MICRO_CHECK_VOICE_V2_1_COMPOSED_TIMELINES.csv`
- `docs/audits/PEARL_MICRO_CHECK_VOICE_V2_1_ASSET_REQUIREMENTS.csv`
- `docs/audits/PEARL_VOICE_PROJECT_POST_MICRO_CHECK_V2_1_HANDOFF.md`
- `src/training/microCheckVoiceV21/**`

### Training Voice V2.1

- `docs/audits/PEARL_TRAINING_VOICE_V2_1_CONTROLS_PROGRESS_RECOVERY_IMPLEMENTATION.md`
- `docs/audits/PEARL_TRAINING_VOICE_V2_1_CONTROLS_PROGRESS_RECOVERY_AUDIT.md`
- `docs/audits/PEARL_TRAINING_VOICE_V2_1_CONTROLS_PROGRESS_RECOVERY_AUDIT.json`
- `docs/audits/PEARL_TRAINING_VOICE_V2_1_CONTROL_CONTRACT_MATRIX.csv`
- `docs/audits/PEARL_TRAINING_VOICE_V2_1_PROGRESS_SCHEDULE_MATRIX.csv`
- `docs/audits/PEARL_TRAINING_VOICE_V2_1_REACTIVE_SAFETY_MIGRATION.csv`
- `docs/audits/PEARL_TRAINING_VOICE_V2_1_RUNTIME_SCENARIOS.csv`
- `docs/audits/PEARL_TRAINING_VOICE_V2_1_CONTROL_TIMELINES.csv`
- `docs/audits/PEARL_TRAINING_VOICE_V2_1_CONTROL_ASSET_REQUIREMENTS.csv`
- `docs/audits/PEARL_VOICE_PROJECT_POST_TRAINING_RUNTIME_HANDOFF.md`
- `docs/audits/PEARL_TRAINING_VOICE_V2_1_SAFETY_*`
- `docs/audits/PEARL_TRAINING_VOICE_V2_1_FOUNDATION_*`
- `src/training/voiceV21/**`

### MPV2 / Movement Check-Up

- `docs/audits/PEARL_MPV2_TARGETED_RUNTIME_POST_COMPLETION_AUDIT.md`
- `docs/audits/PEARL_VOICE_PROJECT_POST_MPV2_HANDOFF.md`
- `docs/audits/PEARL_MPV2_V21_VOICE_RECONCILIATION.md`
- `docs/audits/PEARL_MPV2_V21_VOICE_RECONCILIATION.json`
- `docs/audits/PEARL_MPV2_VOICE_CANONICAL_MAP.csv`
- `docs/audits/PEARL_MPV2_VOICE_ASSET_QC.csv`
- `src/movementProfileV2/**`
- `src/audio/movementProfileV2Audio*.ts`

### Eyes-Open Balance V2

- `docs/audits/PEARL_EYES_OPEN_BALANCE_V2_IMPLEMENTATION.md`
- `docs/audits/PEARL_EYES_OPEN_BALANCE_V2_AUDIT.md`
- `docs/audits/PEARL_EYES_OPEN_BALANCE_V2_AUDIT.json`
- `docs/audits/PEARL_EYES_OPEN_BALANCE_V2_SCENARIOS.csv`
- `docs/audits/PEARL_EYES_OPEN_BALANCE_V2_VOICE_ASSET_REQUIREMENTS.csv`
- `docs/audits/PEARL_VOICE_PROJECT_POST_BALANCE_V2_HANDOFF.md`
- current Balance V2 source

### Approved V2.1 specs

- `docs/specs/PEARL_VOICE_EXPERIENCE_SPEC_V2_1.md`
- `docs/specs/PEARL_VOICE_EXPERIENCE_SPEC_V2_1.json`
- `docs/specs/PEARL_VOICE_SCRIPT_REVIEW_V2_1.md`
- `docs/specs/PEARL_VOICE_SCRIPT_MANIFEST_V2_1.csv`
- `docs/specs/PEARL_VOICE_COMPOSED_TIMELINES_V2_1.csv`
- `docs/specs/PEARL_VOICE_APPROVED_DECISIONS_V2_1.md`
- `docs/specs/PEARL_VOICE_CLARA_PREVIEW_PACK_PLAN_V2_1.md`

### Audio implementation

Inspect:

- `src/audio/cues.ts`
- `src/audio/manifest.ts`
- `src/audio/safetyAudio.ts`
- `src/audio/safetyAudioManifest.ts`
- `src/audio/movementProfileV2Audio.ts`
- `src/audio/movementProfileV2AudioManifest.ts`
- `src/audio/voicePlayer.ts`
- `scripts/generate-audio.ts`
- `scripts/verify-audio.ts`
- `src/profile/voices.ts`
- static `require()` maps

---

## 4. Review and QA status

Use these exact statuses:

```text
Script status: founder_assumed_accepted_for_implementation
Human listening: waived_not_completed
Audio approval: not_granted
Current regenerated physical corpus: verified_by_verify_audio_not_human_listened
Physical-device QA: deferred
```

Do not claim audio approval, listening completion, device readiness, or production feature readiness.

---

## 5. Objective

Create a final canonical V2.1 cue schema and physical-manifest reconciliation that guarantees:

1. Every V2.1 logical cue used by Training, Micro-Check, MPV2/Check-Up, Balance V2, shared controls, safety, progress, transitions, setup, countdown, and recovery is represented exactly once.
2. Every current physical voice asset is classified.
3. Every current physical manifest entry is classified.
4. Legacy-only cues remain available to legacy flows.
5. Conditional legacy cues are absent from default V2.1 paths.
6. Retired cues are absent from default V2.1 paths.
7. No pending logical cue is added to the live physical manifest unless both Clara and Marcus files exist and are semantically exact.
8. No physical cue is reused if script meaning differs by movement, side, equipment, target, tempo, safety scope, protocol, or control semantics.
9. Every exact existing reuse has evidence: logical key, physical key, script comparison, voice pair, duration, and current generation/fingerprint status.
10. Every missing V2.1 cue is in the generation backlog.
11. Every cue to generate later has one canonical exact script.
12. Every cue not to generate has a reason.
13. Clara/Marcus parity is preserved.
14. No `set-plan-*` total-set-count setup cue remains in V2.1.
15. `last-set-v21` remains allowed only as a pacing cue.
16. `microcheck-intro` remains retired/inactive for V2.1.
17. `relax-arm-v21` is not reused for `micro-relax-v21`.
18. `close-your-eyes` and `open-your-eyes` remain conditional legacy only and absent from default Balance V2.
19. Existing MPV2/check-up exact assets are reused where exact.
20. Regenerated current assets are measured from disk.
21. Old duration inventories are treated as stale if they predate the model switch.
22. `npm run verify:audio` remains green.
23. If adding a manifest entry would break `verify:audio`, do not add it.
24. Final generation backlog includes only missing pairs, script-mismatch pairs, and intentionally-regenerated pairs justified by schema policy.
25. Audio-ready remains false unless every required active cue pair exists, is manifested, is verified, and no pending generation remains.
26. No runtime feature is enabled.
27. No audio is generated or changed.
28. The next task becomes consolidated Clara/Marcus asset generation.

---

## 6. Strict scope

In scope:

- final logical cue inventory;
- final V2.1 cue key registry;
- cue lifecycle statuses;
- logical-to-physical mapping;
- physical asset inventory/classification;
- manifest reconciliation;
- safe manifest additions for exact existing pairs only, if they do not break `verify:audio`;
- deferred manifest changes for missing pairs;
- generation backlog;
- retirement/legacy map;
- script comparison;
- duration remeasurement;
- timing recomputation;
- tests and audits.

Out of scope:

- audio generation;
- ElevenLabs or external API calls;
- audio file changes;
- feature enablement;
- listening review;
- physical-device QA;
- new runtime behavior;
- exercise/protocol/scoring changes;
- editing approved V2.1 spec artifacts in place;
- package/lockfile changes;
- destructive Git operations.

---

## 7. Recommended architecture

Use repository conventions. A suitable implementation could be:

```text
src/audio/voiceV21/
  types.ts
  cueSchema.ts
  physicalAssetMap.ts
  lifecycle.ts
  registry.ts
  readiness.ts
  index.ts
```

If a better existing location exists, use it.

Do not import `docs/` artifacts at runtime.

Use strict, immutable, JSON-safe types. Suggested concepts:

```ts
export type VoiceV21Flow =
  | 'training'
  | 'micro_check'
  | 'movement_checkup'
  | 'balance_v2'
  | 'shared';

export type VoiceV21CueLifecycle =
  | 'active_v21'
  | 'pending_audio'
  | 'physical_ready'
  | 'script_mismatch'
  | 'legacy_only'
  | 'conditional_legacy_only'
  | 'retired'
  | 'not_required'
  | 'blocked_by_schema_policy';

export type VoiceV21ReuseDecision =
  | 'reuse_exact_existing_pair'
  | 'new_pair_required'
  | 'existing_pair_script_mismatch'
  | 'alias_to_exact_existing_pair'
  | 'retire_from_v21'
  | 'conditional_legacy_only'
  | 'legacy_only'
  | 'not_required';
```

---

## 8. Lifecycle policy

Use these classifications:

### `physical_ready`

Only when both Clara and Marcus files exist, paths are manifestable, scripts are semantically exact, fingerprints/metadata are current or baseline-accepted, and `verify:audio` passes.

### `pending_audio`

Logical cue is required by V2.1 but one or both physical files are missing, or manifesting it must wait for generation.

### `script_mismatch`

Physical files exist but the current physical/canonical script is not the V2.1 script. Do not reuse.

### `alias_to_exact_existing_pair`

Only when exact script and semantics match under a different key and aliasing is intentional and safe.

### `legacy_only`

Used by legacy flows, not active V2.1 default runtime.

### `conditional_legacy_only`

Preserved for beta/custom/legacy paths, absent from default V2.1. Examples may include TUG and old eyes-closed balance cues.

### `retired`

Should not emit in V2.1 and not needed by current active legacy flows. Do not delete in this task.

### `not_required`

Concept is absorbed into another cue or should not exist separately.

---

## 9. Cue surface to cover

At minimum cover:

### Training V2.1

- 37 exercise first-use instructions
- 37 later-set reminders
- target/dynamic target phrases
- side cues and side-switch cues
- both-sides cues
- step-up start/correction cues
- floor transition/final-position cues
- safety-family cues
- universal safety
- controls
- progress
- times-up
- set/rest/last-set/next/session transitions
- retry/tracking recovery
- reactive safety destinations
- Repeat Instructions dependencies

### Micro-Check V2.1

At minimum:

```text
micro-chair-power-v21
micro-single-leg-left-v21
micro-single-leg-right-v21
micro-mobility-left-v21
micro-mobility-right-v21
micro-relax-v21 if required
microcheck-complete-v21
micro-discard-v21
final-position-set-v21
paused-v21
resuming-v21
retry-v21
tracking-loss-v21
tracking-recovered-v21
countdown-three
countdown-two
countdown-one
go
times-up-v21
```

Confirm `microcheck-intro` is retired/inactive for V2.1.

### MPV2 / Movement Check-Up

Reconcile:

- check-up intro
- chair setup and chair official/practice cues
- shoulder side cues
- hinge setup
- final-position
- item complete
- times-up
- tracking loss/recovered
- retry
- check-up completion
- legacy/rollback MPV2 operational cues
- TUG if conditional/beta

### Eyes-Open Balance V2

Derive exact current cue needs from source. At minimum evaluate:

```text
checkup-balance-feet-together-v21
checkup-balance-semi-tandem-v21
checkup-balance-tandem-v21
checkup-balance-single-leg-v21
countdown-three
countdown-two
countdown-one
go
times-up-v21
tracking-loss-v21
tracking-recovered-v21
retry-v21
```

Do not invent unused Balance V2 cues.

### Shared cues

At minimum:

```text
training-intro-v21
safe-session-start-v21
final-position-set-v21
countdown-three
countdown-two
countdown-one
go
times-up-v21
paused-v21
resuming-v21
retry-v21
tracking-loss-v21
tracking-recovered-v21
halfway-v21
five-seconds-left-v21
```

### Retired / legacy

Classify:

- `microcheck-intro`
- old set-plan cues
- old broad exercise-family cues where V2.1 uses exact instructions
- old verbose safety cue packs
- eyes-closed balance cues
- old “logged” / implementation-language completion cues
- generated but unreachable cues
- TUG beta/conditional cues

---

## 10. Physical manifest reconciliation rules

For every logical cue, output:

```text
logicalCueKey
exactScript
physicalCandidateKey
manifestStatus
reuseDecision
generationRequiredLater
```

For every physical cue, output:

```text
physicalCueKey
voice
path
exists
manifested
referencedByLogicalKeys
legacyReachability
v21Reachability
orphanStatus
retireLater
```

A physical pair can be safely added to a manifest only if:

1. Clara exists.
2. Marcus exists.
3. Static `require()` is possible.
4. Exact semantics match.
5. No key collision changes meaning.
6. `npm run verify:audio` still passes.
7. No feature gate becomes enabled.
8. Audio-ready is not set true unless the entire active surface is complete.

If not, do not add it; put it in the manifest plan/backlog.

Do not add manifest entries for missing audio.

Prefer a pending logical schema separate from live `VoiceCueId`.

---

## 11. Generation backlog policy

The next generation task needs a clean backlog.

Allowed in this task:

- create final generation backlog CSV/JSON;
- add a typed final script registry for future generation;
- add generator dry-run/list support if safe;
- add tests validating backlog completeness.

Not allowed:

- running the generator;
- writing audio;
- updating fingerprints for files that do not exist;
- deleting legacy generator lines currently needed by legacy flows.

Backlog rows must include:

```text
logical cue key
exact script
flow
category
policy
requiredness
voice IDs needed
current candidate, if any
reuse decision
reason for generation
budget class
source artifact/source file
```

The backlog must exclude exact-ready pairs and retired/not-required cues.

---

## 12. Readiness expectations

Derive readiness from source and schema.

Expected after this task:

```text
Training Voice V2.1 behaviour ready: true
Micro-Check Voice V2.1 behaviour ready: true

Training Voice V2.1 audio ready: false if backlog nonempty
Micro-Check Voice V2.1 audio ready: false if backlog nonempty
Balance V2 audio ready: false if Balance V2 backlog nonempty

Training Voice V2.1 feature: off
Micro-Check Voice V2.1 feature: off
Balance V2 default: closed

Training selectable exercises: 0
Micro selectable types: 0
```

If every required pair is already physically ready, do not enable features. Report `audio_surface_complete_but_feature_still_manual_gate`.

---

## 13. Timing recomputation

Remeasure current MP3 durations from disk. Do not use stale duration CSVs from before the model switch as current truth.

For pending ungenerated cues, estimate and label clearly.

Recompute timelines for:

- Training intro/universal
- Training first-use ordinary/complex setup
- Training later-set reminders
- Training Repeat Instructions
- Training controls/progress/recovery
- Micro-check setup/control/recovery/completion
- MPV2 setup/countdown/active/transition
- Balance V2 stage setup
- countdown/go sequences
- completion/transition stacks

Use both voices and 0 / 100 / 250 ms gaps.

Report:

```text
measuredDurationRowCount
estimatedDurationRowCount
durationSourceStaleCount
timingHardMaxFailureCount
timingTargetFailureCount
```

Hard-max failures must either be zero or create a blocking finding.

---

## 14. Required artifacts

Create exactly these artifacts:

1. `docs/audits/PEARL_VOICE_V2_1_FINAL_CUE_SCHEMA_IMPLEMENTATION.md`
2. `docs/audits/PEARL_VOICE_V2_1_FINAL_CUE_SCHEMA_AUDIT.md`
3. `docs/audits/PEARL_VOICE_V2_1_FINAL_CUE_SCHEMA_AUDIT.json`
4. `docs/audits/PEARL_VOICE_V2_1_FINAL_CUE_REGISTRY.csv`
5. `docs/audits/PEARL_VOICE_V2_1_PHYSICAL_ASSET_RECONCILIATION.csv`
6. `docs/audits/PEARL_VOICE_V2_1_MANIFEST_CHANGE_PLAN.csv`
7. `docs/audits/PEARL_VOICE_V2_1_GENERATION_BACKLOG.csv`
8. `docs/audits/PEARL_VOICE_V2_1_RETIREMENT_LEGACY_MAP.csv`
9. `docs/audits/PEARL_VOICE_V2_1_SCHEMA_TIMELINES.csv`
10. `docs/audits/PEARL_VOICE_V2_1_SCHEMA_RUNTIME_SCENARIOS.csv`
11. `docs/audits/PEARL_VOICE_PROJECT_POST_FINAL_CUE_SCHEMA_HANDOFF.md`

You may add one audit-only harness:

```text
scripts/audits/audit-voice-v21-final-cue-schema.mjs
```

Do not overwrite prior artifacts.

### Final cue registry CSV columns

```text
logicalCueKey,exactScript,flows,categories,policyId,requiredForVoiceFirst,lifecycle,reuseDecision,physicalCueKey,physicalManifestStatus,claraExists,marcusExists,semanticMatch,generationRequiredLater,retireLater,sourceArtifacts,notes
```

### Physical asset reconciliation CSV columns

```text
physicalCueKey,voiceId,path,exists,sha256,durationMs,manifestRegistered,verifyAudioCovered,generationMetadataPresent,fingerprintStatus,referencedByLogicalCueKeys,legacyReachability,v21Reachability,classification,notes
```

### Manifest change plan CSV columns

```text
changeId,changeType,logicalCueKey,physicalCueKey,currentStatus,targetStatus,allowedInThisTask,requiresAudioGeneration,requiresManifestEdit,requiresCueUnionEdit,verifyAudioImpact,reason,notes
```

### Generation backlog CSV columns

```text
logicalCueKey,exactScript,flow,category,policyId,requiredForVoiceFirst,voiceIdsNeeded,currentPhysicalCandidate,reuseDecision,reasonForGeneration,budgetClass,sourceArtifact,notes
```

### Retirement/legacy map CSV columns

```text
cueKey,currentFlowReachability,v21Lifecycle,legacyRequired,conditionalLegacyReason,retireAfterFeatureGate,physicalAssetAction,manifestAction,notes
```

### Timeline CSV columns

```text
scenarioId,flow,variant,voiceId,gapMs,cueKeys,durationSource,measuredDurationMs,estimatedDurationMs,totalMs,targetMs,hardMaxMs,passesTarget,passesHardMax,notes
```

### Runtime scenario CSV columns

```text
scenarioId,category,flow,logicalCueKeys,physicalCueKeys,lifecycleOutcome,manifestOutcome,generationOutcome,readinessOutcome,passed,testCoverage,notes
```

---

## 15. Audit metrics

Report at minimum:

```text
logicalCueCount
activeV21LogicalCueCount
trainingLogicalCueCount
microLogicalCueCount
mpv2LogicalCueCount
balanceV2LogicalCueCount
sharedLogicalCueCount

duplicateLogicalCueKeyCount
missingScriptCount
missingLifecycleCount
missingPolicyCount
pendingCueInPhysicalManifestCount

physicalAssetCount
spokenPhysicalAssetCount
sfxAssetCount
claraPhysicalAssetCount
marcusPhysicalAssetCount
physicalPairMismatchCount
manifestPathMissingCount
verifyAudioFailureCount
taskAudioHashChangedCount

physicalReadyExactPairCount
aliasExactPairCount
pendingNewPairCount
scriptMismatchPairCount
retiredCueCount
legacyOnlyCueCount
conditionalLegacyCueCount
notRequiredCueCount

generationBacklogRowCount
generationBacklogMissingScriptCount
generationBacklogDuplicateLogicalKeyCount
generationBacklogIncludesExactReadyPairCount
generationBacklogMissingMicroCueCount
generationBacklogMissingBalanceV2CueCount
generationBacklogMissingTrainingCueCount

manifestAddAllowedCount
manifestAddDeferredCount
manifestRemoveDeferredCount
cueUnionAddAllowedCount
cueUnionAddDeferredCount

trainingBehaviorReadyValue
microBehaviorReadyValue
trainingAudioReadyValue
microAudioReadyValue
balanceV2AudioReadyValue
trainingFeatureDefault
microFeatureDefault
balanceV2DefaultClosed
trainingSelectableExerciseCount
microSelectableTypeCount

measuredDurationRowCount
estimatedDurationRowCount
durationSourceStaleCount
timingHardMaxFailureCount
timingTargetFailureCount

setPlanDefaultV21EmissionCount
microcheckIntroV21EmissionCount
relaxArmMicroReuseCount
eyesClosedBalanceDefaultEmissionCount

p0
p1
p2
p3
```

Severity counts must derive from findings.

---

## 16. Findings and verdicts

### P1 examples

- pending logical cue added to live physical manifest;
- semantically mismatched asset marked exact;
- feature enabled accidentally;
- audio-ready true despite missing required active cue;
- audio file changed/generated in this task;
- legacy runtime behavior changed by schema work.

### P2 examples

- required logical cue missing from final schema;
- generation backlog incomplete;
- physical asset unclassified;
- `verify:audio` fails;
- stale duration inventory used as current truth;
- readiness values hard-coded/inconsistent;
- manifest plan cannot support generation phase.

### P3 examples

- physical V2.1 assets pending;
- human listening waived;
- physical-device QA deferred;
- speaker-onset timing not measured;
- audio approval not granted.

Use exactly one verdict:

```text
VOICE_V2_1_FINAL_SCHEMA_COMPLETE_GENERATION_PENDING
VOICE_V2_1_FINAL_SCHEMA_COMPLETE_AUDIO_READY
VOICE_V2_1_FINAL_SCHEMA_REMEDIATION_REQUIRED
CURRENT_SOURCE_REBASE_REQUIRED
```

Expected successful verdict:

```text
VOICE_V2_1_FINAL_SCHEMA_COMPLETE_GENERATION_PENDING
```

---

## 17. Completion gates

Successful schema-complete/generation-pending requires:

```text
duplicateLogicalCueKeyCount = 0
missingScriptCount = 0
missingLifecycleCount = 0
missingPolicyCount = 0
pendingCueInPhysicalManifestCount = 0

verifyAudioFailureCount = 0
taskAudioHashChangedCount = 0
manifestPathMissingCount = 0
physicalPairMismatchCount = 0 for physical-ready cues

unclassifiedLogicalCueCount = 0
unclassifiedPhysicalAssetCount = 0
mismatchedPhysicalReuseAsExact = 0
setPlanDefaultV21EmissionCount = 0
microcheckIntroV21EmissionCount = 0
relaxArmMicroReuseCount = 0
eyesClosedBalanceDefaultEmissionCount = 0

generationBacklogMissingRequiredActiveCueCount = 0
generationBacklogMissingScriptCount = 0
generationBacklogDuplicateLogicalKeyCount = 0
generationBacklogIncludesExactReadyPairCount = 0

trainingBehaviorReadyValue = true
microBehaviorReadyValue = true
trainingFeatureDefault = off
microFeatureDefault = off
balanceV2DefaultClosed = true
trainingSelectableExerciseCount = 0
microSelectableTypeCount = 0

durationSourceStaleCount = 0
timingHardMaxFailureCount = 0

audioGenerated = false
externalSpeechAudioApiCalled = false
featureGatesEnabled = 0
```

Audio-ready values must match actual asset completion. If backlog is nonempty, audio-ready must remain false.

---

## 18. Required tests

Do not weaken/delete existing tests.

Add focused tests for:

### Schema registry

- all logical keys unique;
- active cues have exact scripts;
- active cues have lifecycle/flow/policy;
- pending cues absent from live physical manifest;
- physical-ready cues have Clara/Marcus;
- exact reuse has semantic evidence;
- script mismatches are not reusable;
- retired/conditional cues absent from V2.1 default sequences;
- no set-plan setup cues;
- `microcheck-intro` retired/inactive;
- `relax-arm-v21` not mapped to `micro-relax-v21`.

### Physical manifests

- current manifested cues verify;
- no missing asset in live manifest;
- static `require()` paths exist;
- legacy manifest paths remain available;
- MPV2 exact pairs mapped correctly;
- Balance V2 pending pairs remain pending if missing;
- task-start audio hashes unchanged;
- `npm run verify:audio` green.

### Generation backlog

- every pending active cue has one backlog row;
- backlog rows have exact script/category/policy/flow;
- backlog excludes exact-ready pairs;
- backlog excludes retired/not-required cues;
- backlog includes script mismatches;
- backlog includes Micro-Check, Balance V2, Training, and Check-Up pending cues where needed;
- no duplicate logical keys.

### Readiness/defaults

- Training behavior ready true;
- Micro behavior ready true;
- audio ready false when backlog nonempty;
- feature defaults off;
- selectable counts zero;
- Balance V2 closed.

### Timing

- durations measured from disk;
- pre-model-switch duration CSV not used as current truth;
- pending cue durations marked estimates;
- hard-max failure count derived from timeline rows.

Run relevant existing suites for audio, MPV2, Training Voice, Micro-Check Voice, Balance V2, measurement side, step-up, floor, session player, backend sync/restore.

---

## 19. Required audit scenarios

Create at least these canonical scenarios:

```text
schema_all_logical_cues_unique
schema_all_active_cues_have_scripts
schema_all_active_cues_have_flow_policy_lifecycle
schema_no_pending_cue_in_physical_manifest
schema_no_set_plan_setup_cues
schema_microcheck_intro_retired
schema_relax_arm_not_reused_for_micro_relax
schema_legacy_conditional_cues_absent_from_default_v21

physical_current_verify_audio_passes
physical_task_start_hashes_preserved
physical_clara_marcus_pair_parity
physical_manifest_paths_exist
physical_exact_existing_pairs_reused
physical_script_mismatch_not_reused
physical_orphan_assets_classified
physical_regenerated_baseline_not_reverted

training_37_contracts_covered
training_first_use_cues_covered
training_later_set_cues_covered
training_side_cues_covered
training_safety_cues_covered
training_controls_cues_covered
training_progress_cues_covered
training_recovery_cues_covered
training_generation_backlog_complete

micro_three_contracts_covered
micro_chair_power_schema
micro_balance_left_right_schema
micro_mobility_left_right_schema
micro_relax_schema
micro_discard_schema
micro_completion_schema
micro_asset_backlog_complete

mpv2_current_runtime_cues_covered
mpv2_exact_pairs_reused
mpv2_legacy_operational_cues_classified
mpv2_tug_conditional_legacy
mpv2_listening_status_waived_not_approved

balance_v2_stage_cues_covered
balance_v2_eyes_closed_absent_default
balance_v2_pending_assets_listed
balance_v2_old_protocol_preserved
balance_v2_default_closed_audio_pending

training_behavior_true_audio_false
micro_behavior_true_audio_false
feature_defaults_off
selectable_counts_zero
final_generation_next_task

timing_current_duration_measurement
timing_pending_estimates_labelled
timing_training_sequences
timing_micro_sequences
timing_mpv2_sequences
timing_balance_v2_sequences
timing_hard_max_failures_recorded
```

---

## 20. Implementation report structure

Use:

# Pearl Voice V2.1 Final Cue Schema Implementation

## 1. Result
## 2. Entry Baseline and Regenerated Audio Handling
## 3. Current Voice Architecture Reconciliation
## 4. Final Logical Cue Schema
## 5. Physical Asset Inventory and Classification
## 6. Logical-to-Physical Mapping
## 7. Manifest Change Plan
## 8. Generation Backlog
## 9. Retirement and Legacy Map
## 10. MPV2 / Check-Up Cue Reconciliation
## 11. Training Cue Reconciliation
## 12. Micro-Check Cue Reconciliation
## 13. Balance V2 Cue Reconciliation
## 14. Shared Controls, Safety, Progress, and Recovery
## 15. Readiness Values and Feature Gates
## 16. Timing Recalculation
## 17. Tests
## 18. Audit Results
## 19. Remaining Audio, Listening, and Device Boundaries
## 20. Files Changed
## 21. Worktree Integrity
## 22. Exact Next Phase

---

## 21. Handoff

Create:

```text
docs/audits/PEARL_VOICE_PROJECT_POST_FINAL_CUE_SCHEMA_HANDOFF.md
```

If successful, the exact next task is:

```text
Consolidated Clara/Marcus Voice V2.1 asset generation
```

The handoff must include:

- final schema artifact/API paths;
- generation backlog path;
- pending logical cue count;
- exact existing pair reuse count;
- script mismatch count;
- retired / legacy-only counts;
- pending Balance V2 cues;
- pending Micro-Check cues;
- pending Training cues;
- pending MPV2/check-up cues;
- regenerated audio baseline instructions;
- generator input format;
- manifest update rules for the generation phase;
- `verify:audio` expectations after generation;
- readiness gates to preserve;
- final listening/device QA still required.

Later order:

1. Consolidated Clara/Marcus Voice V2.1 asset generation
2. Post-generation manifest/fingerprint verification
3. Whole-project static/runtime audio audit using measured durations
4. Founder listening review for Clara and Marcus
5. Final consolidated Android/iOS physical-device QA
6. Only then consider enabling gated V2.1 paths

---

## 22. Validation commands

Run at minimum:

```bash
npm run verify:audio
npx tsc --noEmit --pretty false
```

Run relevant audits:

```bash
node scripts/audits/audit-micro-check-voice-v21.mjs
node scripts/audits/audit-training-voice-v21-controls-progress-recovery.mjs
node scripts/audits/audit-training-voice-v21-live-safety-integration.mjs
node scripts/audits/audit-training-floor-readiness.mjs
node scripts/audits/audit-eyes-open-balance-v2.mjs
```

Run focused Jest suites for:

- final cue schema / registry
- audio manifest
- VoiceChannel
- MPV2 audio/runtime
- Training Voice V2.1
- Micro-Check Voice V2.1
- Balance V2
- measurement-side
- generation backlog tests

Run full Jest where practical.

Run the new audit harness.

Parse all generated JSON/CSV artifacts.

Independently recompute audit metrics from written artifacts.

Inspect:

```bash
git status --short --branch
git diff --stat
git diff -- assets/audio
git diff --check
```

Do not modify tests merely to make them pass.

---

## 23. Final Codex response

When finished, respond with:

- summary of implementation;
- paths to all 11 artifacts;
- audit harness path;
- production files changed/added;
- tests changed/added;
- confirmation that no audio changed relative to task start;
- confirmation that no audio was generated;
- confirmation that no external speech/audio API was called;
- confirmation that listening and physical QA remain deferred;
- branch and commit;
- whether worktree was already dirty;
- task-start and final `verify:audio` results;
- task-start/final audio hash counts and diff count;
- logical cue count and active V2.1 cue count;
- training/micro/MPV2/balance/shared cue counts;
- physical asset count and Clara/Marcus pair counts;
- physical-ready exact pair count;
- alias exact pair count;
- pending new pair count;
- script mismatch pair count;
- retired / legacy-only / conditional legacy counts;
- generation backlog row count;
- manifest additions made/deferred;
- cue union additions made/deferred;
- readiness values for Training, Micro-Check, Balance V2;
- measured/estimated timing row counts;
- timing hard-max failures;
- prohibited emission counts:
  - set-plan default V2.1
  - microcheck-intro V2.1
  - relax-arm micro reuse
  - eyes-closed Balance V2 default
- critical defect metrics;
- P0/P1/P2/P3 counts;
- verdict;
- whether consolidated generation is unblocked;
- exact next task;
- typecheck result;
- focused/full test results;
- audit recomputation result;
- concise confidence statement.

Do not generate audio, enable any V2.1 feature, perform listening review, or perform physical-device QA in this task.
