# Codex Prompt: Pearl Consolidated Clara/Marcus Voice V2.1 Asset Generation

Read this entire prompt before doing anything.

Pearl’s final Voice V2.1 cue schema reconciliation is complete.

Current final-schema verdict:

```text
VOICE_V2_1_FINAL_SCHEMA_COMPLETE_GENERATION_PENDING
```

Current final-schema metrics:

```text
logical cues:
214

active V2.1 logical cues:
212

physical assets:
365

exact-ready physical pairs:
36

pending new pairs:
141

script-mismatch pairs:
35

generation backlog rows:
176

manifest additions made:
0

manifest additions deferred:
176

cue union additions deferred:
16

verify:audio failures:
0

task audio hash changes in schema task:
0

P0 / P1 / P2 / P3:
0 / 0 / 0 / 4
```

The exact next phase is:

```text
Consolidated Clara/Marcus Voice V2.1 asset generation
```

This task is now authorised to generate the final missing and semantically changed Voice V2.1 physical audio assets for Clara and Marcus, using the final frozen generation backlog.

It must use the existing/canonical audio generation pipeline.

It must not enable any V2.1 feature.

It must not perform listening review or physical-device QA.

It must not generate any cue that is not in the final generation backlog.

It must not blindly regenerate the whole corpus.

---

# 1. Critical regenerated-audio baseline note

Before this task, the founder intentionally regenerated the existing Clara and Marcus audio corpus using a new ElevenLabs generation model.

That regenerated corpus is already the current user-owned baseline.

The final cue schema task verified:

```text
task-start audio hash count:
365

final audio hash count:
365

task audio hash changes:
0

npm run verify:audio:
passed

current physical audio corpus:
valid for currently registered assets, but not human-listened
```

Git may still show regenerated audio as dirty or untracked relative to Git HEAD. Do not revert, delete, rename, or overwrite the regenerated baseline except for the specific generated backlog assets authorised by this task.

When deciding what this task changed, compare against the task-start snapshot, not against Git HEAD.

---

# 2. Entry baseline

Before generating anything, run and record:

```bash
git status --short --branch
git diff --name-only
git diff --stat
git diff -- assets/audio
git diff -- src/audio scripts/generate-audio.ts scripts/verify-audio.ts
npm run verify:audio
npx tsc --noEmit --pretty false
node scripts/audits/audit-voice-v21-final-cue-schema.mjs
```

Create task-start snapshots:

```bash
find assets/audio -type f | sort | xargs shasum -a 256 > /tmp/pearl_voice_v21_generation_audio_entry.sha256
find assets/audio -type f | sort > /tmp/pearl_voice_v21_generation_audio_entry.files
```

Record:

- branch,
- full and short `HEAD`,
- upstream,
- whether the worktree is already dirty,
- regenerated baseline status,
- task-start audio hash count,
- task-start audio file count,
- current `npm run verify:audio` result,
- current final schema audit verdict,
- current final schema generation backlog row count.

## Entry stop rule

Stop before generation and return a blocking verdict if:

- `npm run verify:audio` fails,
- typecheck fails in a relevant source area,
- final cue schema audit fails,
- the generation backlog is missing or malformed,
- the backlog has duplicate unresolved logical cue keys,
- any backlog row lacks an exact script,
- the selected ElevenLabs provider/model/voice config is missing,
- the generator cannot run in dry-run mode,
- or current source cannot distinguish exact-ready pairs from backlog rows.

Do not proceed with partial generation over a broken baseline.

---

# 3. Source artifacts to read

Read and use these current artifacts.

## Final cue schema

- `docs/audits/PEARL_VOICE_V2_1_FINAL_CUE_SCHEMA_IMPLEMENTATION.md`
- `docs/audits/PEARL_VOICE_V2_1_FINAL_CUE_SCHEMA_AUDIT.md`
- `docs/audits/PEARL_VOICE_V2_1_FINAL_CUE_SCHEMA_AUDIT.json`
- `docs/audits/PEARL_VOICE_V2_1_FINAL_CUE_REGISTRY.csv`
- `docs/audits/PEARL_VOICE_V2_1_PHYSICAL_ASSET_RECONCILIATION.csv`
- `docs/audits/PEARL_VOICE_V2_1_MANIFEST_CHANGE_PLAN.csv`
- `docs/audits/PEARL_VOICE_V2_1_GENERATION_BACKLOG.csv`
- `docs/audits/PEARL_VOICE_V2_1_RETIREMENT_LEGACY_MAP.csv`
- `docs/audits/PEARL_VOICE_V2_1_SCHEMA_TIMELINES.csv`
- `docs/audits/PEARL_VOICE_V2_1_SCHEMA_RUNTIME_SCENARIOS.csv`
- `docs/audits/PEARL_VOICE_PROJECT_POST_FINAL_CUE_SCHEMA_HANDOFF.md`
- `scripts/audits/audit-voice-v21-final-cue-schema.mjs`

The generation backlog is the source of truth for this task.

Expected final-schema state from the audit:

```text
exact-ready pairs:
36

generation backlog rows:
176

pending new pairs:
141

script mismatch pairs:
35

manifest additions deferred:
176

cue union additions deferred:
16
```

Derive actual counts from current files, not from this prompt alone.

## Current audio generation and verification

Inspect:

- `scripts/generate-audio.ts`
- `scripts/verify-audio.ts`
- `src/profile/voices.ts`
- `src/audio/cues.ts`
- `src/audio/manifest.ts`
- `src/audio/movementProfileV2Audio.ts`
- `src/audio/movementProfileV2AudioManifest.ts`
- `src/audio/safetyAudio.ts`
- `src/audio/safetyAudioManifest.ts`
- `src/audio/voicePlayer.ts`
- all existing audio-manifest tests
- all existing generator/verify tests

Use the current configured ElevenLabs model and voice IDs. Do not silently change provider/model/voice settings unless the current source already encodes the founder’s new intended generation model.

If model metadata is ambiguous, stop with:

```text
VOICE_V2_1_ASSET_GENERATION_BLOCKED_MODEL_CONFIG_AMBIGUOUS
```

## Completed behavior gates to keep green

Read and preserve:

- Micro-Check Voice V2.1 audit and source
- Training controls/progress/recovery audit and source
- Training live safety audit and source
- floor-readiness post-safety audit and source
- step-up closure audit and source
- both-sides rounds audit and source
- MPV2 runtime completion audit and source
- Eyes-Open Balance V2 audit and source
- measurement-side post-UX audit and source

Do not change behavior code as part of audio generation unless a tiny type/manifest wiring change is strictly required by the physical asset map.

---

# 4. Review and approval status

Use these exact statuses:

```text
Script status:
founder_assumed_accepted_for_implementation

Human listening:
waived, not completed

Audio approval:
not granted

Physical-device QA:
deferred
```

This task may generate audio, but it must not claim:

- human listening completed,
- audio approved,
- phone-speaker quality approved,
- pronunciation approved,
- tone approved,
- physical speaker onset measured,
- Android/iOS device QA complete,
- or production activation ready.

The generated MP3s remain pending human listening and final device QA.

---

# 5. Objective

Generate, register, fingerprint, and verify the consolidated Clara/Marcus Voice V2.1 physical audio surface, while preserving all feature gates.

The task must guarantee:

1. The final generation plan is derived only from `PEARL_VOICE_V2_1_GENERATION_BACKLOG.csv`.
2. Exact-ready physical pairs are not regenerated.
3. Retired cues are not generated.
4. Conditional legacy-only cues are not generated unless the backlog explicitly requires them for a current conditional flow.
5. Legacy-only cues are not changed.
6. Every generated row has one exact script.
7. Every generated row has exactly the expected voice targets.
8. Clara and Marcus are generated as a pair for every required backlog row unless the backlog explicitly says otherwise.
9. Script-mismatch rows are generated to the intended V2.1 physical key without breaking legacy flows.
10. If a script-mismatch key is still used by a legacy flow with different semantics, create or use a separate V2.1 physical key according to the manifest plan rather than overwriting the legacy asset.
11. Missing new-pair rows generate new physical assets with deterministic filenames.
12. No old exact-ready asset is overwritten.
13. No audio outside the approved generation plan is modified.
14. No generated file is promoted to a runtime manifest until both Clara and Marcus exist, decode correctly, have metadata/fingerprints, and pass semantic key/script checks.
15. Every manifest addition is deterministic and static-require compatible.
16. `npm run verify:audio` passes after generation and manifest/fingerprint updates.
17. All generated assets have current generation metadata:
    - provider,
    - model,
    - voice id,
    - voice settings,
    - output format,
    - script,
    - logical cue key,
    - physical cue key,
    - sha256,
    - duration.
18. Stale metadata/fingerprints are zero after generation.
19. Missing Clara/Marcus pairs are zero for every physical-ready V2.1 cue.
20. Corrupt or undecodable generated assets are zero.
21. Generated durations are measured from disk after writing.
22. Timing audits use measured durations for generated assets, not estimates.
23. Any generated duration hard-max failure is reported and blocks the success verdict.
24. The final schema audit is rerun and no longer reports generation-pending rows for successfully generated active cues.
25. The generation backlog is transformed into a post-generation ledger:
    - generated successfully,
    - reused exact existing pair,
    - blocked,
    - skipped because not required,
    - failed.
26. The post-generation physical audio surface is complete if and only if all active required V2.1 cues have verified Clara/Marcus pairs.
27. Audio-ready source values may become physically ready only if current architecture treats them as physical-asset readiness.
28. Feature defaults remain off regardless of physical readiness.
29. V2.1 selectable exercise/type counts remain zero unless the architecture has a separate explicit activation gate that still keeps user routes closed.
30. Human listening remains not completed.
31. Device QA remains deferred.
32. No runtime behavior is changed.
33. No feature is enabled.
34. The exact next phase becomes:
    - Post-generation whole-project Voice V2.1 static/runtime audit with measured durations.

---

# 6. Strict scope

## In scope

- Backlog validation.
- Generator dry-run support if needed.
- Targeted generation of the 176 backlog rows, or current derived backlog count.
- Generation of Clara/Marcus MP3s for backlog rows.
- Deterministic filename/key assignment for new V2.1 assets.
- Safe regeneration/replacement for script-mismatch rows only when legacy semantics are not broken.
- Manifest additions for generated physical-ready pairs.
- Cue union additions required for generated physical-ready pairs.
- Generation metadata and fingerprint updates through the canonical generator.
- Static require maps.
- Audio verification updates needed for the expanded manifest.
- Post-generation physical asset inventory.
- Post-generation duration measurement.
- Post-generation timing recomputation.
- Listening review package creation.
- Audit artifacts and tests.
- Handoff to whole-project audit.

## Out of scope

Do not:

- generate audio outside the backlog;
- call any speech/audio API other than the existing ElevenLabs generation path used by the generator;
- use runtime TTS;
- enable Training Voice V2.1;
- enable Micro-Check Voice V2.1;
- enable Balance V2;
- enable step-up/floor V2.1 by default;
- perform listening review;
- mark audio approved;
- perform physical-device QA;
- change voice scripts beyond current final schema/backlog truth;
- edit approved V2.1 spec artifacts in place;
- change measurement protocols;
- change exercise prescriptions;
- change runtime behavior;
- delete legacy audio assets;
- delete retired audio assets;
- remove legacy manifest entries still used by legacy flows;
- manually edit MP3 binary metadata outside the generator;
- install packages;
- change lockfiles;
- commit, push, reset, stash, checkout, clean, rebase, or discard user work.

---

# 7. Worktree safety

The repository is heavily dirty.

Before any write, record:

```bash
git status --short --branch
git diff --name-only
git diff --stat
git diff -- assets/audio
git diff -- src/audio scripts/generate-audio.ts scripts/verify-audio.ts
```

Rules:

1. Treat all current uncommitted work as user-owned.
2. Do not reset, stash, checkout, clean, rebase, or discard anything.
3. Do not delete untracked files.
4. Do not rename/move existing audio unless the final manifest change plan explicitly requires a deterministic migration and it is safer than adding a new key. Prefer adding new V2.1 keys over renaming legacy assets.
5. Do not overwrite legacy audio used by a legacy flow.
6. Do not regenerate the whole corpus.
7. Do not commit or push.
8. Make the smallest safe changes.
9. At the end, distinguish:
   - task-start regenerated baseline work,
   - newly generated V2.1 assets,
   - manifest/source changes made by this task,
   - unchanged pre-existing dirty work.

---

# 8. Backlog semantics

Load:

```text
docs/audits/PEARL_VOICE_V2_1_GENERATION_BACKLOG.csv
```

For each row, derive:

```text
logicalCueKey
exactScript
flow
category
policyId
requiredForVoiceFirst
voiceIdsNeeded
currentPhysicalCandidate
reuseDecision
reasonForGeneration
budgetClass
sourceArtifact
notes
```

## Required validation

Fail before generation if any row has:

- missing `logicalCueKey`;
- missing `exactScript`;
- missing flow/category/policy;
- duplicate logical key with conflicting script;
- `reuseDecision` that does not require generation;
- exact-ready physical pair already available unless the row explicitly says script mismatch/regenerate;
- retired cue;
- conditional legacy-only cue without current conditional-generation reason;
- script that conflicts with final cue registry;
- physical candidate collision with a legacy-required cue;
- unsafe filename/key derivation.

## Expected row classes

At minimum support:

```text
new_pair_required
existing_pair_script_mismatch
```

If the current backlog has other decisions, reconcile them explicitly and safely.

## Per-voice expansion

For each logical backlog row, derive one generation job per needed voice.

Expected voices:

```text
clara
marcus
```

Expected generated MP3 count is normally:

```text
generationBacklogRowCount * 2
```

unless a row explicitly says otherwise.

Report the expected and actual counts.

---

# 9. Dry-run plan

Before calling ElevenLabs, run a dry-run generation plan.

The dry-run must output:

- logical cue key,
- physical cue key,
- filename,
- voice id,
- exact script,
- model,
- provider voice id,
- output path,
- whether it will create new file or replace an approved mismatch file,
- whether a legacy asset would be affected,
- manifest target,
- metadata target,
- verification expectation.

Create:

```text
docs/audits/PEARL_VOICE_V2_1_GENERATION_PLAN.csv
```

Do not proceed from dry-run to generation if:

- planned job count does not match expected;
- any planned job targets an exact-ready pair;
- any planned job targets a legacy-only physical asset;
- any planned job targets a conditional legacy-only physical asset without explicit approval;
- any planned file path is outside `assets/audio/voice/{clara,marcus}`;
- any planned physical key collides with a different script;
- any job lacks model/voice/provider config;
- any job cannot be represented in the manifest.

---

# 10. Generation execution

Use the canonical generator.

Preferred command shape, if supported:

```bash
npm run generate:audio -- --from-backlog docs/audits/PEARL_VOICE_V2_1_GENERATION_BACKLOG.csv --voices clara,marcus --mode v2.1 --targeted
```

If no such command exists, add a safe targeted mode to `scripts/generate-audio.ts`.

## Generator requirements

- Reads the final backlog.
- Supports dry-run and execute modes.
- Generates only selected rows.
- Uses current configured ElevenLabs model and voice ids.
- Writes per-file metadata/fingerprint through the same mechanism used by `verify:audio`.
- Supports idempotency:
  - if an existing generated file has matching script/model/voice/fingerprint, skip or confirm unchanged;
  - if mismatched, regenerate only when row authorises it.
- Generates to staging first.
- Validates staging MP3 decode/duration.
- Promotes only after successful pair generation.
- Never leaves a Clara-only or Marcus-only manifest-ready cue.
- On partial failure:
  - stop,
  - do not update manifests for incomplete pairs,
  - report partial staging paths,
  - preserve any already-promoted completed pair only if metadata and manifests remain internally consistent,
  - otherwise leave staging only and no manifest change.
- Records provider/API call count and failures.
- Never logs full API keys.

## Staging

Use a deterministic staging location such as:

```text
/tmp/pearl_voice_v21_generation_staging/<timestamp>/
```

or an ignored project temp directory.

Do not include staging MP3s in app manifests.

Clean staging only after promotion and audit, or document where it remains for debugging.

---

# 11. Physical key and file naming policy

Use final schema/manifests if they already define a physical key.

If a backlog row is a new V2.1 cue, prefer physical key = logical cue key, unless:

- logical key is not valid in the current physical `VoiceCueId` convention;
- a legacy key already exists with different meaning;
- final manifest plan specifies a different key;
- current source has a canonical physical alias.

If a script-mismatch row points to an existing physical candidate:

## Safe to replace existing physical key only when:

- the existing physical key is not required by any legacy or conditional legacy runtime;
- the final manifest plan explicitly allows replacing it;
- both Clara and Marcus will be regenerated;
- all metadata/fingerprints will be updated;
- `verify:audio` passes;
- tests confirm no legacy flow changed unexpectedly.

## Otherwise:

- create a new V2.1 physical key;
- preserve the legacy physical key and file;
- map the V2.1 logical cue to the new physical key;
- classify the old physical key as legacy-only or retired-later.

Never let two different scripts share one physical key.

---

# 12. Manifest, cue union, and static require updates

After successful generation, update only the necessary physical-manifest source files.

Likely files:

- `src/audio/cues.ts`
- `src/audio/manifest.ts`
- `src/audio/movementProfileV2Audio.ts`
- `src/audio/movementProfileV2AudioManifest.ts`
- `src/audio/safetyAudio.ts`
- `src/audio/safetyAudioManifest.ts`
- any final V2.1 schema/asset map files added by the previous task

## Requirements

- Add generated physical cue keys to the appropriate physical cue union only when files exist for Clara and Marcus.
- Add static `require()` entries for both voices.
- Keep legacy entries.
- Do not add entries for missing files.
- Do not remove exact-ready entries.
- Do not remove retired entries if still legacy-reachable.
- Update tests if they assert cue union counts.
- Ensure Metro bundling can statically discover all new assets.
- Ensure `verify:audio` covers all newly required assets.
- Ensure no generated cue can be requested by default-off runtime unless the relevant audio and behaviour readiness gates are satisfied.

---

# 13. Metadata, fingerprints, and verification

Update generation metadata through the generator, not by manual patching.

For every generated file record:

- voice id,
- logical cue key,
- physical cue key,
- script,
- provider,
- model,
- provider voice id,
- voice settings,
- output format,
- generation timestamp,
- sha256,
- file size,
- duration,
- sample rate,
- channels,
- fingerprint.

Run:

```bash
npm run verify:audio
```

It must pass.

The verifier must report the expanded current asset requirements.

Do not weaken verification.

Do not remove current required checks.

If verification fails, do not proceed to a success verdict. Produce a remediation report with exact failing keys.

---

# 14. Readiness and feature gates

After generation, derive these values from current source:

```text
training behavior ready
training physical audio surface ready
training audio approval ready
training feature default
training selectable exercise count

micro behavior ready
micro physical audio surface ready
micro audio approval ready
micro feature default
micro selectable type count

Balance V2 physical audio surface ready
Balance V2 audio approval ready
Balance V2 default closed

MPV2/check-up physical audio surface ready
```

## Important distinction

The app may currently have only a single `audioReady` flag.

If `audioReady` means “physical files and manifests exist,” it may become true after this task.

If `audioReady` means “approved for user activation,” it must remain false until listening and device QA complete.

If the architecture does not distinguish these meanings, add/report a clear separation such as:

```text
physicalAudioSurfaceReady = true
audioApprovalReady = false
featureSelectable = false
```

Do not enable any user route.

Feature defaults must remain:

```text
Training Voice V2.1:
off

Micro-Check Voice V2.1:
off

Balance V2:
closed

Step-up alternation:
off

Floor V2.1:
off
```

Selectable counts should remain zero unless the system has a separate manual test-only internal injection that is not user-reachable.

---

# 15. Timing recomputation

After generation, remeasure all relevant MP3 durations from disk.

Do not use pre-generation estimates for generated cues.

Recompute timeline rows for:

- Training first-use setup
- Training later-set reminders
- Training repeat instructions
- Training safety/session intro
- Training controls/progress/recovery
- Training both-sides side-switch scenarios
- Training step-up start/wrong-lead scenarios
- Training floor scenarios
- Micro-check setup/control/recovery/completion
- MPV2 / Movement Check-Up setup, countdown, active stop, recovery, completion
- Eyes-Open Balance V2 stage setup and transitions
- Shared countdown/go and control sequences

Model:

- Clara
- Marcus
- 0 ms gaps
- 100 ms gaps
- 250 ms gaps

Report:

```text
measuredDurationRowCount
estimatedDurationRowCount
newlyMeasuredGeneratedRowCount
hardMaxFailureCount
targetFailureCount
longestGeneratedCue
longestSequence
durationPairDeltaOutlierCount
```

Hard-max failures after generation are blockers.

If a generated cue is much longer than expected but still under hard max, record it for listening review.

---

# 16. Listening review package

Create a local listening review package for the generated assets.

It should include:

- every generated Clara asset,
- every generated Marcus asset,
- every script-mismatch replacement,
- high-priority shared cues,
- longest-duration outliers,
- largest Clara/Marcus duration deltas,
- Balance V2 stage cues,
- Micro-Check cues,
- Training safety/control cues,
- any reused exact-ready pairs that are critical but not yet human-listened.

The package must clearly say:

```text
This is prepared for founder listening review.
It is not completed by this task.
```

Allowed outputs:

- Markdown review guide,
- HTML local review tool,
- CSV/JSON listening queue.

Do not mark rows approved.

Do not require network access for listening.

Do not upload audio externally.

---

# 17. Audits and artifacts

Create these artifacts:

1. `docs/audits/PEARL_VOICE_V2_1_ASSET_GENERATION_IMPLEMENTATION.md`
2. `docs/audits/PEARL_VOICE_V2_1_ASSET_GENERATION_AUDIT.md`
3. `docs/audits/PEARL_VOICE_V2_1_ASSET_GENERATION_AUDIT.json`
4. `docs/audits/PEARL_VOICE_V2_1_GENERATION_PLAN.csv`
5. `docs/audits/PEARL_VOICE_V2_1_GENERATION_RESULT_LEDGER.csv`
6. `docs/audits/PEARL_VOICE_V2_1_GENERATED_ASSET_INVENTORY.csv`
7. `docs/audits/PEARL_VOICE_V2_1_POST_GENERATION_MANIFEST_CHANGES.csv`
8. `docs/audits/PEARL_VOICE_V2_1_POST_GENERATION_TIMELINES.csv`
9. `docs/audits/PEARL_VOICE_V2_1_POST_GENERATION_READINESS.csv`
10. `docs/audits/PEARL_VOICE_V2_1_LISTENING_REVIEW_QUEUE.csv`
11. `docs/audits/PEARL_VOICE_V2_1_LISTENING_REVIEW_GUIDE.md`
12. `docs/audits/PEARL_VOICE_V2_1_LISTENING_REVIEW.html`
13. `docs/audits/PEARL_VOICE_PROJECT_POST_ASSET_GENERATION_HANDOFF.md`

Add one audit harness:

```text
scripts/audits/audit-voice-v21-asset-generation.mjs
```

If you add generator modes or schema files, list them clearly.

## Generation plan CSV columns

Use columns similar to:

```text
jobId,logicalCueKey,physicalCueKey,voiceId,exactScript,flow,category,policyId,reuseDecision,reasonForGeneration,provider,model,providerVoiceId,outputPath,willCreateNew,willReplaceExisting,legacyAffected,manifestTarget,metadataTarget,dryRunStatus,blockingReason,notes
```

## Result ledger CSV columns

Use columns similar to:

```text
jobId,logicalCueKey,physicalCueKey,voiceId,exactScript,outputPath,status,provider,model,providerVoiceId,fileSizeBytes,sha256,durationMs,sampleRateHz,channels,metadataWritten,manifestRegistered,verifyAudioCovered,errorCode,errorMessage,notes
```

## Generated asset inventory CSV columns

Use columns similar to:

```text
physicalCueKey,logicalCueKey,voiceId,path,exists,sha256,durationMs,fileSizeBytes,sampleRateHz,channels,script,sourceBacklogRow,reuseDecision,generationStatus,manifestRegistered,fingerprintStatus,notes
```

## Manifest changes CSV columns

Use columns similar to:

```text
changeId,changeType,filePath,logicalCueKey,physicalCueKey,voiceId,beforeStatus,afterStatus,staticRequirePath,verifyAudioImpact,featureGateImpact,reason,notes
```

## Readiness CSV columns

Use columns similar to:

```text
surface,behaviorReady,physicalAudioSurfaceReady,audioApprovalReady,featureDefault,selectableCount,requiredLogicalCueCount,physicalReadyCueCount,pendingCueCount,scriptMismatchCount,verifyAudioStatus,notes
```

---

# 18. Audit metrics

Report at minimum:

```text
generationBacklogRowCount
generationPlanJobCount
expectedVoiceJobCount
completedVoiceJobCount
failedVoiceJobCount
skippedVoiceJobCount

logicalCueGeneratedCount
physicalCueGeneratedCount
claraGeneratedCount
marcusGeneratedCount
pairGenerationCompleteCount
pairGenerationIncompleteCount

newPairGeneratedCount
scriptMismatchRegeneratedCount
exactReadyRegeneratedCount
retiredCueGeneratedCount
conditionalLegacyGeneratedCount
legacyOnlyModifiedCount
outOfBacklogGeneratedCount

manifestAdditionCount
manifestMissingGeneratedPairCount
cueUnionAdditionCount
staticRequireMissingCount

metadataWrittenCount
metadataMissingCount
fingerprintCurrentCount
fingerprintStaleCount
verifyAudioFailureCount

taskStartAudioFileCount
taskFinalAudioFileCount
taskAudioAddedCount
taskAudioModifiedCount
taskAudioDeletedCount
unexpectedAudioChangeCount

trainingPhysicalAudioSurfaceReadyValue
microPhysicalAudioSurfaceReadyValue
balanceV2PhysicalAudioSurfaceReadyValue
mpv2PhysicalAudioSurfaceReadyValue

trainingAudioApprovalReadyValue
microAudioApprovalReadyValue
balanceV2AudioApprovalReadyValue

trainingFeatureDefault
microFeatureDefault
balanceV2DefaultClosed
trainingSelectableExerciseCount
microSelectableTypeCount

measuredDurationRowCount
estimatedDurationRowCount
hardMaxFailureCount
targetFailureCount
durationPairDeltaOutlierCount

listeningQueueRowCount
humanListeningCompletedValue
physicalDeviceQaCompletedValue

externalSpeechApiCallCount
audioGeneratedValue

p0
p1
p2
p3
```

Severity counts must derive from findings.

---

# 19. Findings and verdicts

## P1 examples

- generated a cue outside the backlog;
- regenerated an exact-ready pair without explicit reason;
- modified a legacy-only asset;
- generated a retired cue;
- added a manifest entry for a missing/incomplete pair;
- `verify:audio` fails;
- enabled a user feature;
- audio is missing for a required generated pair after success;
- Clara/Marcus pair mismatch for a required cue.

## P2 examples

- generator cannot reproduce metadata/fingerprints;
- generation backlog incomplete or conflicting;
- script mismatch unresolved;
- hard-max timing failure after generation;
- physical audio surface readiness incorrectly reported;
- listening queue incomplete;
- final schema cannot be reconciled after generation.

## P3 examples

- human listening not completed;
- physical-device QA deferred;
- physical speaker onset not measured;
- generated audio not yet approved;
- minor target timing warning below hard max.

Issue exactly one primary verdict.

### `VOICE_V2_1_ASSET_GENERATION_COMPLETE_AUDIO_QA_PENDING`

Use when:

- every required backlog row generated or safely resolved;
- `verify:audio` passes;
- manifests/fingerprints are current;
- no unexpected audio changed;
- physical audio surface is complete;
- feature gates remain closed;
- only listening/device/approval work remains.

This is the expected successful verdict.

### `VOICE_V2_1_ASSET_GENERATION_PARTIAL_REMEDIATION_REQUIRED`

Use when:

- some generation succeeded but blockers remain;
- or verification/timing/manifest gates fail.

### `VOICE_V2_1_ASSET_GENERATION_BLOCKED`

Use when:

- generation could not safely start due to config/backlog/provider/source issues.

### `CURRENT_SOURCE_REBASE_REQUIRED`

Use when:

- current dirty source cannot be reconciled safely.

---

# 20. Completion gates

## Backlog and generation

```text
backlog rows with missing scripts = 0
generation jobs outside backlog = 0
completed voice jobs = expected voice jobs
failed voice jobs = 0
incomplete generated pairs = 0
exact-ready regenerated = 0
retired generated = 0
legacy-only modified = 0
unexpected audio changes = 0
```

## Manifest and verification

```text
manifest additions for generated complete pairs = expected
manifest entries for missing pairs = 0
static require missing = 0
metadata missing = 0
fingerprint stale = 0
verify:audio failures = 0
```

## Readiness

```text
physical audio surface ready values match generated asset reality
audio approval ready = false
feature defaults = off / closed
selectable counts = 0 unless only internal test injection exists and user routing remains closed
```

## Timing

```text
hard-max timing failures = 0
duration source stale used as current = 0
```

## Integrity

```text
no non-backlog audio modified
no audio deleted unexpectedly
no external non-ElevenLabs speech/audio API call
no listening approval claimed
no device QA claimed
```

---

# 21. Implementation report structure

Use:

# Pearl Voice V2.1 Asset Generation Implementation

## 1. Result

## 2. Entry Baseline and Regenerated Audio Handling

## 3. Final Schema and Backlog Inputs

## 4. Dry-Run Generation Plan

## 5. Generation Execution

## 6. Generated Asset Inventory

## 7. Script-Mismatch Handling

## 8. Manifest and Cue Union Updates

## 9. Metadata, Fingerprints, and Verification

## 10. Readiness Values and Feature Gates

## 11. Timing Recalculation

## 12. Listening Review Package

## 13. Tests and Validation

## 14. Audit Results

## 15. Remaining Listening and Device Boundaries

## 16. Files Changed

## 17. Worktree Integrity

## 18. Exact Next Phase

---

# 22. Handoff

Create:

```text
docs/audits/PEARL_VOICE_PROJECT_POST_ASSET_GENERATION_HANDOFF.md
```

If successful, the exact next task is:

```text
Post-generation whole-project Voice V2.1 static/runtime audit with measured durations
```

The handoff must include:

- generation result ledger path;
- generated asset inventory path;
- generated cue count;
- generated MP3 count;
- manifests updated;
- new physical-ready surfaces;
- remaining audio approval/listening/device boundaries;
- readiness values;
- any cues still blocked;
- any timing warnings;
- listening review package path;
- instruction not to enable features yet;
- instruction to run whole-project runtime audit before activation.

Later order:

1. Post-generation whole-project Voice V2.1 static/runtime audit with measured durations
2. Founder listening review for Clara and Marcus
3. Final consolidated Android/iOS physical-device QA
4. Only then consider enabling gated V2.1 paths

Do not do those later steps in this task.

---

# 23. Required validation commands

Run at minimum:

```bash
npm run verify:audio
npx tsc --noEmit --pretty false
node scripts/audits/audit-voice-v21-final-cue-schema.mjs
```

After generation, run:

```bash
npm run verify:audio
npx tsc --noEmit --pretty false
node scripts/audits/audit-voice-v21-asset-generation.mjs
```

Run current relevant audits:

```bash
node scripts/audits/audit-micro-check-voice-v21.mjs
node scripts/audits/audit-training-voice-v21-controls-progress-recovery.mjs
node scripts/audits/audit-training-voice-v21-live-safety-integration.mjs
node scripts/audits/audit-training-floor-readiness.mjs
```

Run or supersede the Balance V2 audit as follows:

- If `audit-eyes-open-balance-v2.mjs` still compares regenerated audio to Git HEAD and fails only for that stale method, document it as `baseline_audio_diff_method_stale_not_product_failure`.
- But after generation, create this task’s own Balance V2 physical-surface check using current task-start/task-final hashes and `verify:audio`.

Run focused Jest suites for:

- audio manifest and static requires,
- `verify:audio`,
- generator targeted mode,
- final cue schema artifacts,
- VoiceChannel,
- MPV2 audio/runtime,
- Training Voice V2.1,
- Micro-Check Voice V2.1,
- Balance V2,
- floor/step-up regressions where audio mappings are touched.

Run full Jest where practical.

Run:

```bash
git diff --check
git diff -- assets/audio
```

Also compare planned vs actual audio hash changes:

```bash
find assets/audio -type f | sort | xargs shasum -a 256 > /tmp/pearl_voice_v21_generation_audio_exit.sha256
find assets/audio -type f | sort > /tmp/pearl_voice_v21_generation_audio_exit.files
```

The final audit must classify every added/modified/deleted audio file as:

```text
planned_generated
planned_regenerated_script_mismatch
unexpected
pre_existing_baseline
```

There must be zero unexpected audio changes.

---

# 24. Final Codex response

When finished, respond with:

- summary of implementation;
- paths to all 13 generated artifacts;
- audit harness path;
- all production files changed/added;
- all tests changed/added;
- generator command(s) used;
- provider/model used;
- Clara provider voice id;
- Marcus provider voice id;
- number of API calls or generated voice jobs;
- confirmation that only backlog audio was generated;
- confirmation that no audio outside the plan changed;
- confirmation that no non-ElevenLabs external speech/audio API was called;
- confirmation that listening and physical QA remain deferred;
- branch and commit;
- whether worktree was already dirty;
- task-start verify:audio result;
- final verify:audio result;
- task-start audio file/hash count;
- final audio file/hash count;
- planned audio added/modified/deleted counts;
- unexpected audio change count;
- backlog row count;
- generation job count;
- completed/failed/skipped job counts;
- generated Clara count;
- generated Marcus count;
- complete pair count;
- incomplete pair count;
- new-pair generated count;
- script-mismatch regenerated count;
- exact-ready regenerated count;
- retired/legacy generated counts;
- manifest addition count;
- cue union addition count;
- static require missing count;
- metadata/fingerprint counts;
- training physical audio surface ready value;
- micro physical audio surface ready value;
- Balance V2 physical audio surface ready value;
- MPV2 physical audio surface ready value;
- training/micro/Balance audio approval ready values;
- feature default values;
- selectable counts;
- timing measured/estimated row counts;
- hard-max timing failure count;
- listening queue row count;
- all critical defect metrics;
- P0/P1/P2/P3 counts;
- verdict;
- whether whole-project static/runtime audit is unblocked;
- exact next task;
- typecheck result;
- focused/full test results;
- audit recomputation result;
- concise confidence statement.

Do not enable features, mark audio approved, perform listening review, perform physical-device QA, or start the whole-project audit in this task.
