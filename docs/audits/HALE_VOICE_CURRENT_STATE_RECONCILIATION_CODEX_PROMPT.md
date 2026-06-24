# Codex Prompt: Hale Voice Current-State Reconciliation Audit

Read this entire prompt before starting.

Hale has already completed a detailed voice audit and a proposed V2.1 voice specification. However, the repository may have changed since those documents were produced. Before any script approval, preview generation, production implementation, or further voice work, we need a fresh, evidence-backed snapshot of the **actual current repository state**.

The purpose of this task is to answer one decision:

> Can Hale continue with the V2.1 voice plan as written, does the plan need a limited asset/manifest refresh, does the specification need to be rebased, or is the current voice asset state inconsistent and in need of repair first?

This is a reconciliation audit only.

---

# 1. Existing baseline artifacts

Use these as historical and planning baselines:

## Original static/runtime audit

- `docs/audits/HALE_VOICE_CUE_INVENTORY.md`
- `docs/audits/HALE_VOICE_CUE_INVENTORY.json`
- `docs/audits/HALE_VOICE_RUNTIME_TIMELINE_AUDIT.md`
- `docs/audits/HALE_VOICE_RUNTIME_TIMELINE_AUDIT.json`
- `docs/audits/HALE_VOICE_ASSET_DURATIONS.csv`

The prior audit reported, at that point in time:

- 300 physical MP3 files
- 150 Clara assets
- 150 Marcus assets
- 110 distinct spoken cue templates
- Number assets `num-0` through `num-40`
- Bundled audio at runtime rather than runtime TTS
- Build-time generation through `scripts/generate-audio.ts`
- Runtime playback through `VoiceChannel` and `expo-audio`
- One sequence at a time
- Lower/equal-priority incoming speech dropped while busy
- Higher-priority incoming speech interrupting current playback

Do not assume any of those facts are still true.

## Current planning baseline

- `docs/specs/HALE_VOICE_EXPERIENCE_SPEC_V2_1.md`
- `docs/specs/HALE_VOICE_EXPERIENCE_SPEC_V2_1.json`
- `docs/specs/HALE_VOICE_SCRIPT_REVIEW_V2_1.md`
- `docs/specs/HALE_VOICE_SCRIPT_MANIFEST_V2_1.csv`
- `docs/specs/HALE_VOICE_COMPOSED_TIMELINES_V2_1.csv`
- `docs/specs/HALE_VOICE_APPROVED_DECISIONS_V2_1.md`
- `docs/specs/HALE_VOICE_CLARA_PREVIEW_PACK_PLAN_V2_1.md`

V2.1 is a proposed future design, not proof of current runtime behaviour. It currently describes:

- 37 exact training contracts
- A proposed active cue surface
- Four conditional legacy cues
- Approved founder decisions
- A planned Clara preview pack
- No authorization to generate or integrate audio

The current repository may now contain some, all, or none of the proposed V2.1 assets or code.

---

# 2. Objective

Create a complete current-state reconciliation that determines:

1. What voice and audio assets physically exist now.
2. What their exact hashes, durations, metadata, and pairing status are.
3. Which assets have been added, removed, modified, renamed, or duplicated since the prior audit baseline.
4. Which current cue definitions and generation scripts exist.
5. Which current assets are represented by:
   - generation source,
   - cue types,
   - manifests,
   - runtime references,
   - tests.
6. Which current cue keys are actually reachable in:
   - training,
   - Movement Check-Up,
   - micro checks,
   - shared setup/recovery.
7. Whether runtime voice architecture, priority, queueing, timing, or cancellation has changed.
8. Whether exercise, assessment, safety, side, or protocol changes invalidate any V2.1 assumptions.
9. Whether any V2.1 proposed cue keys or scripts have already been generated or integrated.
10. Whether current binaries and current source definitions appear synchronized.
11. Whether Clara and Marcus remain structurally and semantically paired.
12. Whether the existing V2.1 script, manifest, preview plan, and timelines remain valid.
13. The exact smallest next action.

The final audit must issue one primary verdict and may issue secondary flags.

---

# 3. Strict scope

## Do not

- Change production code
- Change tests
- Change audio manifests
- Change generation scripts
- Change cue definitions
- Generate audio
- Regenerate audio
- Delete, rename, move, normalize, or repair audio
- Call ElevenLabs
- Call any external speech, transcription, or audio API
- Install dependencies
- Change `package.json` or `package-lock.json`
- Modify existing audit or specification files
- Checkout, reset, stash, clean, revert, or otherwise alter the Git worktree
- Commit anything
- Infer the spoken content of a changed MP3 solely from its filename
- Claim that a binary contains the expected words unless provenance establishes that fact

## You may

- Add the requested audit artifacts
- Add one audit-only script under `scripts/audits/` if useful
- Use local tools already available, including `git`, `ffprobe`, `ffmpeg`, `shasum`, `sha256sum`, Node, or `tsx`
- Read Git history
- Read current source and tests
- Hash and inspect assets
- Decode-test assets locally without rewriting them
- Use temporary files and remove them before finishing

All existing production and audio files must remain byte-for-byte untouched by this task.

---

# 4. Required deliverables

Create these five artifacts:

1. `docs/audits/HALE_VOICE_CURRENT_STATE_RECONCILIATION.md`
2. `docs/audits/HALE_VOICE_CURRENT_STATE_RECONCILIATION.json`
3. `docs/audits/HALE_VOICE_CURRENT_ASSET_INVENTORY.csv`
4. `docs/audits/HALE_VOICE_CHANGE_LEDGER.csv`
5. `docs/audits/HALE_VOICE_V2_1_IMPACT_REPORT.md`

If an audit-only script is added, place it under:

- `scripts/audits/`

Do not overwrite any previous audit.

---

# 5. Establish the repository snapshot first

Before analysing assets, record the exact repository state.

Capture:

- Current UTC timestamp
- Current branch
- Current `HEAD` commit
- Short commit hash
- Full commit hash
- Whether `HEAD` is detached
- Upstream branch if configured
- `git status --short`
- Staged relevant changes
- Unstaged relevant changes
- Untracked relevant files
- Relevant files ignored by Git
- Whether Git LFS is used for audio
- Whether any audio file is an LFS pointer instead of a hydrated binary
- Whether submodules affect audio
- Current Node and package-manager versions
- Current Expo/React Native audio package versions from the repository
- Current `expo-audio`, `expo-av`, or other audio dependencies

Relevant paths include at minimum:

```text
assets/audio/**
src/audio/**
src/profile/voices.ts
scripts/generate-audio.ts
src/training/sessionPlayer.ts
src/training/microCheck.ts
src/training/safetyCueDefinitions.ts
src/training/safetyCues.ts
src/assessment/**
src/checkup/**
src/movements/**
src/exercises/**
src/preflight/**
src/screens/TrainingSessionScreen.tsx
src/screens/CheckUpScreen.tsx
src/screens/MicroCheckScreen.tsx
App.tsx
docs/specs/HALE_VOICE_*
docs/audits/HALE_VOICE_*
```

Do not assume a clean working tree.

Distinguish clearly between:

- committed current state,
- staged changes,
- unstaged changes,
- untracked changes.

A current uncommitted asset is still part of the user's current repository state and must be audited.

---

# 6. Establish the best available historical baseline

Use the strongest available evidence in this order.

## Baseline method A: Git commit containing the prior audited asset state

Attempt to identify:

- the commit that introduced the prior audit artifacts, or
- the latest commit at or before those audit artifacts where the audited audio paths match the old inventory.

Use Git history and path-specific logs.

If found, record:

- baseline commit hash,
- baseline commit date,
- why it is the correct baseline,
- confidence.

Where possible, compare current files with the actual historical blobs from that commit, including SHA-256 hashes.

## Baseline method B: previous audit artifacts

If a reliable baseline commit cannot be identified, use:

- prior physical path list,
- prior duration CSV,
- prior cue inventory,
- prior manifest summary,
- prior generation-source summary.

State that exact historical binary equality cannot be proven where no baseline hash or Git blob is available.

## Baseline method C: repository history for individual files

For changed files, inspect path history and rename detection where useful.

Do not use filesystem modification timestamps as proof of when content changed. They may be reported only as low-confidence supporting metadata.

The report must state the baseline method and confidence.

---

# 7. Discover every current audio asset

Search the repository rather than assuming only the old directories exist.

Enumerate all audio files under the repository, including at minimum:

- `.mp3`
- `.wav`
- `.m4a`
- `.aac`
- `.ogg`
- `.caf`
- any platform-specific bundled audio format

Classify each as:

- spoken voice
- non-speech SFX
- music
- unknown
- test fixture
- generated output
- legacy
- preview
- orphan candidate

Inspect all likely locations, not only `assets/audio/voice/`.

Explicitly determine whether new directories or naming schemes now exist, including potential V2, V2.1, preview, temporary, or alternate-voice directories.

---

# 8. Current physical asset inventory

For every physical audio asset record:

- Asset id
- Voice id, if applicable
- Cue key inferred from current manifest or generation source
- Relative path
- File extension
- SHA-256
- Git blob id if tracked
- File size
- Duration in milliseconds
- Codec
- Container
- Sample rate
- Channel count
- Bit rate if available
- Decode/parse health
- Git tracking status
- Committed/staged/unstaged/untracked status
- LFS status
- Current manifest reference status
- Current cue-definition status
- Current generation-source status
- Current runtime-reference status
- Current test-reference status
- Paired voice asset path
- Paired voice exists
- Paired duration delta
- Paired source script equality
- Exact duplicate hash paths
- Previous baseline status
- V2.1 status
- Notes

Use actual file metadata. Do not estimate current asset duration from text.

The CSV should have columns similar to:

```text
assetId,voiceId,cueKey,path,extension,sha256,gitBlobId,fileSizeBytes,durationMs,codec,container,sampleRateHz,channels,bitRate,decodeStatus,gitTrackingStatus,worktreeStatus,lfsStatus,inCurrentManifest,hasCurrentCueDefinition,hasCurrentGenerationSource,hasCurrentRuntimeReference,hasCurrentTestReference,pairedVoicePath,pairedVoiceExists,pairedDurationDeltaMs,pairedSourceScriptEqual,duplicateHashPaths,baselineStatus,v21Status,notes
```

---

# 9. Asset integrity checks

Perform non-destructive integrity checks.

At minimum identify:

- zero-byte files,
- unreadable files,
- malformed containers,
- files that `ffprobe` cannot parse,
- files that fail a local decode-to-null check where practical,
- stereo files where the voice corpus is expected to be mono,
- unexpected sample rates,
- unexpectedly long or short files,
- duplicate binaries under different keys,
- duplicate keys pointing to different binaries,
- identical Clara and Marcus binaries,
- asymmetrical voice pairs,
- missing counterpart assets,
- manifest entries with no file,
- physical files with no manifest entry,
- cue definitions with no manifest entry,
- manifest entries with no cue definition,
- generator lines with no asset,
- assets with no generation source,
- runtime references to missing keys,
- current assets that exist only in tests,
- preview or temporary assets accidentally inside production asset directories.

Do not automatically classify exact duplicate binaries as an error. Explain whether the duplication is intentional or suspicious.

---

# 10. Current cue and generation-source inventory

Inspect the current source of truth for spoken text and generation.

At minimum inspect:

- `scripts/generate-audio.ts`
- any newly added audio generation scripts
- `src/audio/cues.ts`
- `src/audio/manifest.ts`
- `src/audio/safetyAudio.ts`
- `src/audio/safetyAudioManifest.ts`
- `src/training/safetyCueDefinitions.ts`
- `src/training/safetyCues.ts`
- `src/profile/voices.ts`
- any generated manifest files
- any audio metadata/sidecar files
- any preview-generation scripts
- any alternate voice registry

For every current cue key determine:

- Exact expected spoken script from current source
- Source file and symbol
- Cue category
- Voice variants expected
- Physical asset variants present
- Manifest mapping
- Whether generated dynamically
- Number range if dynamic
- Whether active, conditional, inactive, retired, or test-only
- Current runtime call sites
- Current priority
- Current queue/interrupt policy
- Current feature flag
- Current release status
- Whether it appears in V2.1
- Whether the current expected script equals the V2.1 proposed script
- Whether the same key has conflicting expected scripts

Explicitly inspect whether the current number range is still `0..40`, has been extended to `0..64`, or has changed in another way.

---

# 11. Search for any new speech implementation

Search broadly for:

- `speak`
- `speech`
- `tts`
- `textToSpeech`
- `expo-speech`
- `VoiceChannel`
- `AudioPlayer`
- `expo-audio`
- `expo-av`
- `playAsync`
- `createAudioPlayer`
- `ElevenLabs`
- `voiceId`
- `audioAsset`
- `manifest`
- `narration`
- `cue`
- `prompt`
- `voice`
- `audio`

Determine whether Hale still uses bundled audio only at runtime.

Report any new:

- runtime TTS,
- streaming audio,
- remote audio URL,
- downloaded/cacheable audio,
- platform-native speech,
- alternate audio player,
- preview player,
- fallback speech path.

If runtime architecture has changed, explain the impact on the old runtime audit and V2.1.

---

# 12. Current runtime architecture comparison

Re-audit only enough runtime behaviour to determine whether the previous timing audit remains valid.

Compare the current implementation with the prior known model:

- One sequence at a time
- Lower/equal priority dropped while busy
- Higher priority interrupts
- `stop()` clears pending cues
- Voice id captured by channel construction
- SFX may overlap
- Countdown does not wait for voice busy
- Active timing begins around `go`
- Pause/retry/skip/unmount stop behaviour
- Missing-asset behaviour
- App audio-mode configuration
- Silent mode
- mixing/interruption mode
- Bluetooth/earpiece routing configuration
- background behaviour

For each prior claim assign:

- `unchanged_verified`
- `changed`
- `partially_changed`
- `not_verifiable`
- `removed`

Record exact source evidence.

If any of the following changed, issue the secondary verdict `RERUN_RUNTIME_AUDIT`:

- player queue semantics,
- priority values or comparisons,
- cancellation/stale callback handling,
- countdown timing,
- audible-`go` handling,
- controller wait policy,
- playback completion callbacks,
- voice selection lifecycle,
- audio-mode configuration,
- screen relay behaviour.

Do not perform the entire 374-scenario runtime audit again unless current changes make it necessary. State whether it is necessary.

---

# 13. Current runtime reachability

Trace current actual runtime usage.

For every current cue key classify:

- `verified_active_training`
- `verified_active_checkup`
- `verified_active_microcheck`
- `verified_active_shared`
- `feature_flagged`
- `conditional_protocol`
- `bundled_but_inactive`
- `orphan_asset`
- `test_only`
- `uncertain`

Follow the actual call path, not only text search.

Inspect:

- Training session controller
- Movement Check-Up controller
- Micro-check controller
- Preflight/readiness
- Safety cue selection
- Exercise registry
- Assessment registry
- Pause/resume/retry/skip/discard
- Tracking-loss/recovery
- Completion flows
- Feature flags
- Beta/custom protocols

If current exercise or assessment registrations changed, report:

- added levels,
- removed levels,
- renamed ids,
- changed voice instructions,
- changed targets,
- changed sides/laterality,
- changed equipment,
- changed safety profiles,
- changed assessment battery,
- changed micro-check types.

These may invalidate V2.1 even if audio files themselves did not change.

---

# 14. Historical change classification

For every difference from the best baseline, classify it as one of:

- `asset_added`
- `asset_removed`
- `asset_modified_binary`
- `asset_renamed`
- `asset_moved`
- `asset_duplicate_added`
- `voice_pair_added`
- `voice_pair_missing`
- `source_script_added`
- `source_script_removed`
- `source_script_changed`
- `cue_key_added`
- `cue_key_removed`
- `cue_key_renamed`
- `cue_type_changed`
- `manifest_added`
- `manifest_removed`
- `manifest_mapping_changed`
- `runtime_reference_added`
- `runtime_reference_removed`
- `runtime_reference_changed`
- `priority_changed`
- `queue_policy_changed`
- `timing_policy_changed`
- `voice_registry_changed`
- `generation_model_changed`
- `generation_setting_changed`
- `safety_mapping_changed`
- `exercise_mapping_changed`
- `assessment_protocol_changed`
- `test_only_change`
- `documentation_only`
- `unknown`

For every change record:

- Change id
- Classification
- Path/key
- Baseline value
- Current value
- Committed or uncommitted
- Git commit(s), if known
- Evidence confidence
- Current runtime impact
- V2.1 impact
- Required action
- Whether it blocks continuing

The change ledger CSV should have columns similar to:

```text
changeId,classification,pathOrKey,baselineValue,currentValue,gitState,commitEvidence,evidenceConfidence,currentRuntimeImpact,v21Impact,requiredAction,blocksProceeding,notes
```

---

# 15. Source-to-binary synchronization analysis

A physical file existing does not prove it contains the current expected words.

For each current spoken asset assign one provenance status:

- `unchanged_binary_from_verified_baseline`
- `generated_in_same_commit_as_source_change`
- `binary_and_source_changed_together`
- `source_changed_binary_unchanged`
- `binary_changed_source_unchanged`
- `new_binary_with_current_source`
- `new_binary_without_source`
- `source_without_binary`
- `historical_provenance_uncertain`
- `content_requires_listening`
- `conditional_or_legacy`

Use Git evidence where available.

Do not claim semantic audio correctness from duration or hash alone.

If an asset binary changed and its exact spoken content cannot be established without listening, mark it `content_requires_listening`.

If the current repository includes generation logs, metadata, sidecars, or commit messages that establish provenance, cite them.

---

# 16. Clara/Marcus parity

Reconcile both voices.

Report:

- Physical count per voice
- Manifest count per voice
- Paired-key count
- Missing pairs
- Script-source mismatches
- Unexpected duration deltas
- Binary-identical cross-voice pairs
- Keys existing for one voice only
- New voices
- Removed voices
- Changed default voice
- Changed voice ids
- Changed ElevenLabs voice ids
- Current generation model
- Current generation settings
- Any per-voice script divergence

Use semantic-source parity rather than duration equality as the main requirement.

If current assets may contain different wording but source provenance cannot prove parity, mark listening verification required.

---

# 17. V2.1 reconciliation

Compare the actual current repository with:

- `HALE_VOICE_EXPERIENCE_SPEC_V2_1.json`
- `HALE_VOICE_SCRIPT_MANIFEST_V2_1.csv`
- `HALE_VOICE_SCRIPT_REVIEW_V2_1.md`
- `HALE_VOICE_COMPOSED_TIMELINES_V2_1.csv`
- `HALE_VOICE_CLARA_PREVIEW_PACK_PLAN_V2_1.md`

For every V2.1 proposed cue classify:

- `already_exists_exact_key_exact_script`
- `already_exists_different_key_same_script`
- `already_exists_same_key_different_script`
- `already_exists_binary_but_content_unverified`
- `not_present`
- `current_asset_supersedes_v21`
- `v21_supersedes_current_asset`
- `naming_collision`
- `conditional_legacy_present`
- `retired_current_asset_still_active`
- `implementation_dependency_changed`

For every current cue not in V2.1 classify:

- should remain active,
- should be mapped into V2.1,
- should remain conditional legacy,
- should be retired later,
- newly discovered and requires V2.1 revision,
- unrelated.

Explicitly determine:

1. Whether any `-v21`, `v2_1`, preview, or equivalent new assets already exist.
2. Whether any of the 21 planned Clara preview cues already exist.
3. Whether any were generated for both voices rather than Clara only.
4. Whether their current scripts exactly match V2.1.
5. Whether current cue keys collide with V2.1 planned keys.
6. Whether current code already references proposed V2.1 keys.
7. Whether V2.1 cue count must change.
8. Whether V2.1 duration estimates must be recomputed from newly existing assets.
9. Whether the preview pack should reuse current files.
10. Whether any current changes make an approved founder decision obsolete or require reinterpretation.
11. Whether the new balance protocol, side persistence, round state, step alternation, safety subsumption, floor gate, or audible-`go` work has already begun.
12. Whether any partial implementation is inconsistent with the approved V2.1 design.

---

# 18. V2.1 impact severity

Classify each discovered change:

## `NO_IMPACT`

The change does not affect current voice runtime or V2.1.

## `BASELINE_REFRESH_ONLY`

Physical hash/duration/metadata changed, but cue key, expected script, routing, semantics, and runtime architecture remain compatible. Recompute the asset baseline and relevant timelines.

## `MANIFEST_RECONCILIATION`

Current assets or keys overlap V2.1 and the manifest/preview plan should be updated, but product scripts and flow design remain valid.

## `SCRIPT_REVIEW_UPDATE`

Current spoken source text changed and the human script review must be updated.

## `SPEC_REBASE_REQUIRED`

Exercise, assessment, safety, side, protocol, or flow changes invalidate V2.1 contracts.

## `RUNTIME_REAUDIT_REQUIRED`

Player, queue, priority, countdown, timing, or cancellation changes invalidate the previous runtime audit.

## `CURRENT_STATE_REPAIR_REQUIRED`

The repository has missing, corrupt, orphaned, asymmetrical, or contradictory assets/manifests that should be fixed before proceeding.

A change may receive more than one impact class.

---

# 19. Primary verdict

Issue exactly one primary verdict:

## `GO_AS_PLANNED`

Use only when:

- Current relevant runtime/source state is materially unchanged from the audited baseline, or all changes are already fully represented by V2.1.
- No asset-manifest inconsistency exists.
- No current change invalidates V2.1.
- No runtime architecture change requires re-audit.
- Any new assets are compatible and correctly mapped.

Next action: continue with V2.1 human script review and the planned small Clara preview task.

## `GO_AFTER_BASELINE_REFRESH`

Use when:

- Scripts, keys, routing, and product design remain valid.
- Only current binary hashes/durations/metadata changed.
- V2.1 timelines or asset reuse calculations need refreshing.

Next action: regenerate audit baselines and V2.1 duration/reuse fields, then continue.

## `RECONCILE_ASSETS_WITH_V2_1`

Use when:

- Current assets or cue keys have changed or partial V2.1 assets already exist.
- The product/voice design remains valid.
- V2.1 manifest, preview plan, or cue counts need a focused update.

Next action: perform a small V2.1 asset/manifest reconciliation pass before preview generation.

## `REBASE_V2_1_SPEC`

Use when:

- Exercise, assessment, safety, side, protocol, or flow changes invalidate proposed scripts or contracts.

Next action: revise affected V2.1 sections before any audio generation.

## `RERUN_RUNTIME_AUDIT`

Use when:

- Player, queue, timing, priority, or controller sequencing changed materially.

Next action: update the runtime timing audit before implementation or preview integration.

## `REPAIR_CURRENT_ASSET_STATE`

Use when:

- Current assets, manifests, sources, or voice pairs are inconsistent, missing, corrupt, or unsafe to build on.

Next action: repair and validate the current repository before continuing with V2.1.

If several are applicable, select the most blocking as primary and list the others as secondary flags.

---

# 20. Required recommendation matrix

The Markdown report must include:

| Area | Current state | Changed since baseline? | V2.1 still valid? | Action |
|---|---|---:|---:|---|
| Physical voice assets |  |  |  |  |
| Clara/Marcus parity |  |  |  |  |
| Cue definitions |  |  |  |  |
| Generation source |  |  |  |  |
| Manifests |  |  |  |  |
| Runtime playback architecture |  |  |  |  |
| Training cue mappings |  |  |  |  |
| Check-up cue mappings |  |  |  |  |
| Micro-check cue mappings |  |  |  |  |
| Safety cue mappings |  |  |  |  |
| Exercise/assessment catalogue |  |  |  |  |
| V2.1 cue manifest |  |  |  |  |
| V2.1 composed timelines |  |  |  |  |
| Clara preview pack |  |  |  |  |

End with:

- Primary verdict
- Secondary flags
- Exact next task
- Exact files that need updating
- Exact files that should remain untouched
- Whether audio generation is safe to begin
- Whether integrated runtime preview is safe to begin

---

# 21. Required Markdown structure

Use this exact structure:

# Hale Voice Current-State Reconciliation

## 1. Executive Verdict

Include:

- Primary verdict
- Secondary flags
- Current Git commit
- Worktree state
- Baseline method and confidence
- Current physical audio count
- Current spoken asset count
- Current SFX count
- Current voice count
- Current Clara count
- Current Marcus count
- Added assets
- Removed assets
- Modified assets
- Renamed/moved assets
- Missing pairs
- Corrupt assets
- Orphan assets
- Current cue-definition count
- Current runtime-reachable cue count
- Current V2.1 exact matches
- Current V2.1 key/script conflicts
- Whether the runtime audit remains valid
- Whether V2.1 remains valid
- Whether audio generation is safe
- Exact next action

## 2. Repository Snapshot

## 3. Baseline Establishment

## 4. Current Audio Asset Surface

## 5. Asset Integrity

## 6. Current Cue and Generation Source

## 7. Current Manifests and Pairing

## 8. Current Runtime Reachability

## 9. Runtime Architecture Delta

## 10. Git Change History

## 11. Source-to-Binary Synchronization

## 12. Clara and Marcus Parity

## 13. Exercise, Assessment, and Safety Changes

## 14. V2.1 Reconciliation

## 15. V2.1 Cue-by-Cue Impact Summary

## 16. Change Ledger

## 17. Recommendation Matrix

## 18. Exact Next Step

## 19. Validation and Limitations

## 20. Complete Source Index

---

# 22. Required JSON structure

Use a top-level structure similar to:

```json
{
  "auditVersion": 1,
  "generatedAt": "...",
  "repositorySnapshot": {
    "branch": "...",
    "head": "...",
    "worktreeClean": false,
    "relevantChanges": []
  },
  "baseline": {
    "method": "git_commit_or_prior_artifacts",
    "commit": null,
    "confidence": "high"
  },
  "verdict": {
    "primary": "GO_AS_PLANNED",
    "secondaryFlags": [],
    "audioGenerationSafe": false,
    "integratedPreviewSafe": false,
    "nextAction": "..."
  },
  "summary": {},
  "currentAssets": [],
  "integrityFindings": [],
  "currentCueDefinitions": [],
  "currentGenerationSources": [],
  "currentManifests": [],
  "runtimeArchitectureComparison": [],
  "runtimeReachability": [],
  "gitChanges": [],
  "sourceBinarySynchronization": [],
  "voiceParity": {},
  "catalogueChanges": [],
  "v21Reconciliation": [],
  "changeLedger": [],
  "recommendationMatrix": [],
  "validation": {},
  "limitations": []
}
```

Keep the JSON valid and do not include comments.

---

# 23. V2.1 impact report structure

`HALE_VOICE_V2_1_IMPACT_REPORT.md` should be concise and decision-focused.

Use:

# Hale Voice V2.1 Impact Report

## Verdict

## What Changed

## What Did Not Change

## Existing Assets We Can Reuse

## Existing Assets That Conflict With V2.1

## V2.1 Assets Already Present

## V2.1 Documents That Need Updating

## Runtime Audit Validity

## Preview Pack Impact

## Safe Next Step

## Blockers

Do not repeat the full inventory.

---

# 24. Validation requirements

Before finishing:

1. Parse all current relevant source audit/spec JSON files.
2. Parse current relevant CSV files.
3. Enumerate every current audio file exactly once.
4. Generate SHA-256 for every current audio file.
5. Verify current CSV row count equals physical file count.
6. Verify all audio paths exist.
7. Verify all tracked audio files are hydrated binaries rather than LFS pointers.
8. Run metadata parsing for every current audio file.
9. Record decode health.
10. Verify all current manifest entries resolve.
11. Verify all current cue definitions are accounted for.
12. Verify all current generation-source lines are accounted for.
13. Verify all runtime cue references resolve.
14. Verify Clara/Marcus pairing.
15. Verify number-cue range.
16. Verify active, inactive, conditional, orphan, and test-only classifications.
17. Verify every baseline difference has a change-ledger row.
18. Verify every V2.1 manifest row has a reconciliation status.
19. Verify every planned preview cue has a current-state status.
20. Verify current exercise ids and assessment ids against V2.1.
21. Verify runtime architecture claims against current source.
22. Verify no production or audio file changed during the task.
23. Verify no external API was called.
24. Run relevant existing tests if practical.
25. Run `npx tsc --noEmit` if practical.
26. Inspect `git status --short` after the audit.
27. Inspect `git diff --stat`.
28. Distinguish pre-existing changes from files added by this audit.
29. Remove temporary files.
30. Parse generated JSON and both CSV files successfully.
31. Ensure Markdown/JSON/CSV counts agree.
32. Ensure the primary verdict follows the criteria in this prompt.

Do not modify tests to make validation pass.

---

# 25. Final Codex response

When finished, respond with:

- Paths to all five generated artifacts
- Any audit-only script added
- Confirmation that no production code changed
- Confirmation that no existing audio changed
- Current branch and commit
- Whether the relevant worktree was already dirty
- Baseline method and confidence
- Current total audio asset count
- Current spoken asset count
- Current SFX count
- Current Clara count
- Current Marcus count
- Current voice count
- Added/removed/modified/renamed asset counts
- Missing pair count
- Corrupt/unreadable count
- Orphan asset count
- Current cue-definition count
- Current runtime-reachable cue count
- Number-cue range
- Number of V2.1 exact key/script matches
- Number of V2.1 naming/script conflicts
- Number of planned Clara preview cues already present
- Whether runtime architecture changed
- Whether the previous runtime audit remains valid
- Whether V2.1 remains valid
- Primary verdict
- Secondary flags
- Whether audio generation is safe
- Whether integrated runtime preview is safe
- Exact next action
- Tests and validation commands run
- A concise confidence statement

Do not generate or modify audio in this task.
