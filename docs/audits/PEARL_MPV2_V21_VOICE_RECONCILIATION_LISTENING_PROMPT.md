# Codex Prompt: Pearl MPV2 / Voice V2.1 Asset–Source Reconciliation and Listening Review Pack

Read this entire prompt before starting.

Pearl now has two overlapping voice efforts:

1. An approved, documentation-only Voice Experience Specification V2.1.
2. A newer, partially implemented Movement Profile V2 (`MPV2`) voice path in the current worktree, including newly generated audio assets and changed runtime behaviour.

A current-state reconciliation has already established that:

- The repository currently has 363 audio files:
  - 362 spoken MP3s
  - 1 non-speech SFX
- Clara has 181 spoken assets.
- Marcus has 181 spoken assets.
- The original committed 300 spoken assets remain byte-for-byte unchanged.
- The current worktree adds 62 untracked MP3s: 31 new cue keys for each voice.
- No current asset is corrupt.
- No Clara/Marcus physical pair is missing.
- Current code includes:
  - modified voice priorities,
  - fail-closed handling for required MPV2 assets,
  - an MPV2 voice sequencer,
  - a changed React/timer/user-action controller path.
- The previous broad runtime audit is not valid for integrated MPV2 preview.
- The current V2.1 reconciliation found:
  - 22 exact current key/script matches,
  - 174 V2.1 proposed cues not yet present,
  - 3 overlaps requiring resolution:
    - `chair-result-prefix-v21`
    - `tug-intro`
    - `tug-setup`
- Further audio generation and integrated runtime preview are currently unsafe.
- The seven founder decisions in V2.1 remain approved and must not be reopened.

Relevant existing artifacts include:

## Current-state reconciliation

- `docs/audits/PEARL_VOICE_CURRENT_STATE_RECONCILIATION.md`
- `docs/audits/PEARL_VOICE_CURRENT_STATE_RECONCILIATION.json`
- `docs/audits/PEARL_VOICE_CURRENT_ASSET_INVENTORY.csv`
- `docs/audits/PEARL_VOICE_CHANGE_LEDGER.csv`
- `docs/audits/PEARL_VOICE_V2_1_IMPACT_REPORT.md`
- `scripts/audits/reconcile-voice-current-state.mjs`

## Approved V2.1 planning baseline

- `docs/specs/PEARL_VOICE_EXPERIENCE_SPEC_V2_1.md`
- `docs/specs/PEARL_VOICE_EXPERIENCE_SPEC_V2_1.json`
- `docs/specs/PEARL_VOICE_SCRIPT_REVIEW_V2_1.md`
- `docs/specs/PEARL_VOICE_SCRIPT_MANIFEST_V2_1.csv`
- `docs/specs/PEARL_VOICE_COMPOSED_TIMELINES_V2_1.csv`
- `docs/specs/PEARL_VOICE_APPROVED_DECISIONS_V2_1.md`
- `docs/specs/PEARL_VOICE_CLARA_PREVIEW_PACK_PLAN_V2_1.md`

This task is the focused reconciliation stage that must happen **before** the targeted MPV2 runtime audit.

---

# 1. Objective

Create one canonical, evidence-backed map of the current MPV2/V2.1 voice surface and a practical human listening-review pack.

The task must determine:

1. Every cue currently reachable through the MPV2 flow.
2. Every new current MPV2/V2.1 cue key and physical voice pair.
3. The exact current source script associated with each cue.
4. The exact current runtime event, stage, priority, requiredness, fallback policy, and call path for each cue.
5. Which cues are:
   - MPV2 operational cues that V2.1 did not model,
   - exact V2.1 matches,
   - safe reusable existing assets,
   - aliases or naming duplicates,
   - script conflicts,
   - legacy-only,
   - retirement candidates,
   - or source/manifest problems.
6. Whether each current cue aligns with the seven approved founder decisions.
7. Whether the generated binary’s expected content can be established from provenance.
8. Which assets require human listening because binary semantic correctness cannot be proven statically.
9. Whether current Clara and Marcus assets are technically consistent with the established corpus.
10. The exact canonical cue map that the next targeted runtime audit must use.
11. The smallest safe next step after human listening.

Do not redo the full 363-file broad inventory. Focus deeply on:

- the changed MPV2 path,
- all 31 current added cue keys,
- all other existing cue keys actually reused by MPV2,
- the three known overlap/conflict cases,
- and every cue needed to model the current MPV2 runtime.

---

# 2. Strict scope

## Do not

- Change production TypeScript or React Native code
- Change tests
- Change current cue definitions
- Change generation scripts
- Change static manifests
- Change MPV2 manifests
- Change cue priorities
- Change controller behaviour
- Change assessment protocols
- Change the approved V2.1 specification
- Generate or regenerate audio
- Delete, rename, move, normalize, or overwrite audio
- Call ElevenLabs
- Call transcription, speech-recognition, or external audio APIs
- Infer actual spoken words solely from filename, duration, hash, or expected source text
- Install dependencies
- Change `package.json` or `package-lock.json`
- Reset, stash, clean, checkout, or otherwise disturb the dirty worktree
- Commit anything
- Mark an asset semantically verified without human listening or strong historical provenance

## You may

- Add the requested audit artifacts
- Add one audit-only generator script under `scripts/audits/`
- Create a standalone local HTML review tool under `docs/audits/`
- Use local `ffprobe`, `ffmpeg`, Node, TypeScript, Git, hashing, and static analysis
- Read current source and tests
- Read Git history
- Compute non-destructive audio quality metrics
- Build a machine-readable input package for the next targeted runtime audit
- Use temporary files and remove them before finishing

All existing production, test, manifest, and audio files must remain untouched.

---

# 3. Required deliverables

Create these eight artifacts:

1. `docs/audits/PEARL_MPV2_V21_VOICE_RECONCILIATION.md`
2. `docs/audits/PEARL_MPV2_V21_VOICE_RECONCILIATION.json`
3. `docs/audits/PEARL_MPV2_VOICE_CANONICAL_MAP.csv`
4. `docs/audits/PEARL_MPV2_VOICE_ASSET_QC.csv`
5. `docs/audits/PEARL_MPV2_VOICE_LISTENING_REVIEW.html`
6. `docs/audits/PEARL_MPV2_VOICE_LISTENING_REVIEW_GUIDE.md`
7. `docs/audits/PEARL_MPV2_TARGETED_RUNTIME_AUDIT_INPUT.json`
8. `docs/audits/PEARL_MPV2_TARGETED_RUNTIME_AUDIT_SCOPE.md`

You may add an audit-only generator such as:

- `scripts/audits/reconcile-mpv2-v21-voice.mjs`

Do not overwrite existing reconciliation or V2.1 artifacts.

---

# 4. Preserve and record the live worktree

At task start record:

- UTC timestamp
- branch
- full and short `HEAD`
- upstream
- `git status --short`
- staged voice-relevant changes
- unstaged voice-relevant changes
- untracked voice-relevant files

The current repository is expected to be dirty.

Do not treat untracked MP3s or source files as disposable.

At task end:

- compare the relevant worktree state,
- identify only files added by this audit,
- confirm all pre-existing production/audio changes remain untouched.

---

# 5. Discover the current MPV2 voice surface independently

Do not blindly trust the previous report’s list.

Inspect at minimum:

- `src/audio/voicePlayer.ts`
- `src/audio/cues.ts`
- `src/audio/manifest.ts`
- `src/audio/movementProfileV2Audio.ts`
- `src/audio/movementProfileV2AudioManifest.ts`
- `src/audio/__tests__/movementProfileV2Audio.test.ts`
- `scripts/generate-audio.ts`
- `scripts/verify-audio.ts`
- `src/screens/MovementProfileV2CheckUpScreen.tsx`
- `src/screens/MovementProfileV2RecoveryScreen.tsx`
- `src/checkup/movementProfileV2.ts`
- `src/checkup/protocolEvidence.ts`
- `src/movementProfileV2/voiceCues.ts`
- `src/movementProfileV2/liveCoordinator.ts`
- `src/movementProfileV2/recovery.ts`
- `src/movementProfileV2/liveDiagnostics.ts`
- MPV2-related tests
- Movement definitions used by the current MPV2 battery
- V2.1 spec and manifest artifacts
- current asset inventory and change ledger

Search for all MPV2 cue emission and resolution paths, including:

- direct `VoiceChannel.speak`
- sequencer calls
- effect-driven initial speech
- timer-driven speech
- user-action speech
- recovery-screen speech
- result/completion speech
- missing-asset handling
- retry/skip/restart
- cleanup/unmount
- feature flags
- test-only paths

Determine the exact currently reachable MPV2 battery and flow.

---

# 6. Required current-added cue coverage

The previous reconciliation found these 31 added cue keys. Independently verify the current list and reconcile any additions, removals, or renames:

- `checkup-balance-intro-v21`
- `checkup-balance-single-leg-v21`
- `checkup-chair-stand-intro-v21`
- `checkup-chair-stand-setup-v21`
- `checkup-complete-v21`
- `checkup-hinge-setup-v21`
- `checkup-shoulder-raise-left-v21`
- `checkup-shoulder-raise-right-v21`
- `checkup-shoulder-turn-left-v21`
- `checkup-shoulder-turn-right-v21`
- `final-position-set-v21`
- `item-complete-v21`
- `mpv2_balance_attempt_saved`
- `mpv2_balance_attempt_start`
- `mpv2_balance_complete`
- `mpv2_balance_full_hold`
- `mpv2_balance_ready_after_30`
- `mpv2_balance_ready_after_60`
- `mpv2_balance_rest`
- `mpv2_balance_tracking_retry`
- `mpv2_balance_use_best`
- `mpv2_chair_official_ready`
- `mpv2_chair_practice_start`
- `mpv2_checkup_intro`
- `mpv2_hinge_complete`
- `mpv2_hinge_no_measurement`
- `mpv2_shoulder_tracking_retry`
- `retry-v21`
- `times-up-v21`
- `tracking-loss-v21`
- `tracking-recovered-v21`

For every current added key verify both Clara and Marcus.

Also include every pre-existing cue reused by the current MPV2 path, such as:

- countdown cues
- `go`
- number cues
- result fragments
- legacy assessment cues
- any preflight/orientation cues
- TUG cues if reachable through current MPV2 or recovery routing
- any MPV2 fallback cue

The canonical runtime input must cover the full current MPV2 cue graph, not only the 31 additions.

---

# 7. Canonical cue map

Create one canonical row per logical cue key.

The CSV must contain columns similar to:

```text
cueKey,namespace,currentScript,currentSourceFile,currentSourceSymbol,flow,stage,category,trigger,triggerConditions,currentPriority,currentPolicyClass,currentRequiredness,currentMissingAssetPolicy,currentRepeatRule,currentCancelRule,currentBlocksProgression,currentManifestFile,currentManifestStatus,claraPath,marcusPath,claraDurationMs,marcusDurationMs,currentRuntimeReachability,currentRuntimeCallPath,v21MatchStatus,v21CueKey,v21Script,v21PolicyId,approvedDecisionIds,decisionAlignment,copyQuality,sourceBinaryProvenance,proposedAction,requiresHumanListening,requiresV21Patch,requiresRuntimeAudit,implementationDependencyIds,notes
```

## Required classifications

### `namespace`

Use:

- `shared_v21`
- `mpv2_operational`
- `mpv2_assessment`
- `legacy_reused`
- `conditional_legacy`
- `dynamic_result`
- `unknown`

### `currentRequiredness`

Use:

- `required_fail_closed`
- `required_visible_fallback`
- `optional_drop_allowed`
- `conditional`
- `legacy_only`
- `uncertain`

### `v21MatchStatus`

Use:

- `exact_key_exact_script`
- `different_key_same_script`
- `same_key_different_script`
- `current_only_mpv2_operational`
- `v21_only_not_present`
- `legacy_reuse`
- `conditional_legacy`
- `naming_collision`
- `content_unverified`
- `not_applicable`

### `decisionAlignment`

Use:

- `aligned`
- `partially_aligned`
- `conflicts_with_approved_decision`
- `not_applicable`
- `uncertain`

### `copyQuality`

Use:

- `ready_for_human_review`
- `technically_accurate_but_awkward`
- `too_technical`
- `too_long`
- `ambiguous`
- `potentially_misleading`
- `protocol_dependent`
- `legacy_only`
- `uncertain`

### `proposedAction`

Assign exactly one primary action:

- `keep_current_exact`
- `keep_current_mpv2_operational`
- `reuse_existing_v21_asset`
- `alias_current_key_to_v21_key_later`
- `rename_to_v21_key_later`
- `rewrite_current_script_later`
- `split_current_cue_later`
- `merge_current_cues_later`
- `conditional_legacy_only`
- `retire_after_migration`
- `source_or_manifest_repair_required`
- `pending_human_listening`
- `requires_spec_rebase`
- `uncertain`

Do not perform any proposed action in this task.

---

# 8. Reconcile source meaning against V2.1

For every current cue compare:

- current expected source script,
- V2.1 proposed script,
- current runtime purpose,
- current state-machine event,
- V2.1 intended cue class,
- current priority,
- V2.1 policy,
- current requiredness,
- current fallback,
- current flow order.

Distinguish:

1. Same words and same purpose.
2. Same words but different purpose.
3. Different words but semantically equivalent.
4. Current operational cue absent from V2.1.
5. Current cue conflicts with V2.1 product behaviour.
6. V2.1 cue is unnecessary because current MPV2 logic already handles the event differently.
7. Current cue should remain MPV2-specific and should not be generalized.
8. Current cue is a temporary implementation artifact.
9. Current cue is valid but needs a better stable key.
10. Current cue should be replaced by a V2.1 shared cue after migration.

Do not force every `mpv2_*` key into the general V2.1 namespace.

Operational cues may legitimately remain MPV2-specific if their trigger and semantics are unique.

---

# 9. Approved founder-decision alignment

The following decisions are approved and must not be reopened.

## FD-001 — Both-sides training rounds

Primarily training-related. Do not let MPV2 assessment cues introduce training side semantics.

## FD-002 — Persist reliable, comfortable measurement side

Check current MPV2 handling of:

- selected side,
- standing leg,
- shoulder side nearest the phone,
- official retest side,
- comparability status,
- recovery/retry preserving side,
- result persistence.

For every side-specific cue verify that:

- source script states the intended side,
- controller state supplies the same side,
- current grader observes the same side,
- retry/recovery does not silently change it.

If current code does not yet persist side, classify the cue as script-valid but implementation-dependent rather than reopening the decision.

## FD-003 — Default home balance is eyes-open only

Verify whether current MPV2 default flow emits or references:

- `close-your-eyes`
- `open-your-eyes`
- any eyes-closed stage

Required result:

- default MPV2 home balance must be classified against the approved eyes-open policy,
- legacy eyes-closed cues may remain bundled,
- do not classify their physical existence as a product conflict unless they are reachable in the new default flow.

If current MPV2 balance logic uses a different eyes-open attempt protocol than the V2.1 staged balance design, document the protocol mismatch precisely. Do not silently choose one.

## FD-004 — Initial mini-band placement above knees

Training-only unless current MPV2 unexpectedly references it.

## FD-005 — Alternating-leg step-up

Training-only unless current MPV2 unexpectedly references it.

## FD-006 — Do not speak total set count

Confirm MPV2 does not introduce set-count narration into assessment setup.

## FD-007 — Floor-transfer readiness gate

Training-only unless MPV2 includes a floor assessment.

---

# 10. MPV2 operational-cue review

The current MPV2 surface contains operational cues that V2.1 may not have modelled.

At minimum inspect the meaning, trigger, and necessity of:

- `mpv2_balance_attempt_saved`
- `mpv2_balance_attempt_start`
- `mpv2_balance_complete`
- `mpv2_balance_full_hold`
- `mpv2_balance_ready_after_30`
- `mpv2_balance_ready_after_60`
- `mpv2_balance_rest`
- `mpv2_balance_tracking_retry`
- `mpv2_balance_use_best`
- `mpv2_chair_official_ready`
- `mpv2_chair_practice_start`
- `mpv2_checkup_intro`
- `mpv2_hinge_complete`
- `mpv2_hinge_no_measurement`
- `mpv2_shoulder_tracking_retry`

For each answer:

- Why does this event exist?
- Is it user-essential, useful, or merely implementation narration?
- Is the cue spoken once or repeatable?
- Does it block progression?
- Does it reveal internal concepts such as:
  - saved attempt,
  - official attempt,
  - use best,
  - ready after a threshold,
  - no measurement,
  - tracking retry?
- Is that wording understandable to a 45–65-year-old user?
- Is the cue calm and dignified?
- Is the information already visible?
- Is the event needed for eyes-off completion?
- Could it be merged with another cue?
- Does its current priority and fail-closed status match its user importance?
- Should it remain MPV2-specific?
- Does it belong in the eventual general Voice V2.1 schema?

Do not rewrite production text, but provide a recommended later action.

---

# 11. Resolve the known overlap cases

Explicitly investigate:

## `chair-result-prefix-v21`

The current reconciliation reports `already_exists_different_key_same_script`.

Determine:

- current key,
- V2.1 key,
- exact source scripts,
- physical assets,
- current runtime call sites,
- whether aliasing is safe,
- whether both keys are needed,
- preferred canonical future key,
- migration risk,
- whether current binary can be reused.

## `tug-intro`

Determine:

- current script source,
- current binary provenance,
- current reachability,
- V2.1 role,
- whether TUG remains beta/custom only,
- whether the asset belongs in the MPV2 path,
- whether human listening is required,
- proposed action.

## `tug-setup`

Perform the same analysis.

Do not move TUG into the default battery merely because assets exist.

---

# 12. Source-to-binary provenance

For each changed/current MPV2 asset pair classify provenance:

- `source_and_binary_added_together_uncommitted`
- `source_present_binary_untracked`
- `binary_present_source_missing`
- `source_changed_binary_unchanged`
- `binary_changed_source_unchanged`
- `verified_historical_match`
- `current_source_expected_text_only`
- `actual_content_requires_listening`
- `uncertain`

Use:

- Git status
- Git diff
- generation source
- manifest metadata
- any fingerprints or generation metadata
- current hashes
- commit history where available

Do not claim the binary says the expected text unless:

- commit/generation provenance proves it, or
- a human listening result later confirms it.

All newly generated untracked assets should normally remain `actual_content_requires_listening` unless stronger evidence exists.

---

# 13. Acoustic and technical quality control

Perform non-destructive local QC for:

- all 62 newly added MP3s,
- all physical assets involved in the three known overlap cases,
- any reused reference asset needed for A/B comparison.

Record where available:

- voice id
- cue key
- path
- SHA-256
- duration
- codec/container
- sample rate
- channel count
- bitrate
- integrated loudness (LUFS-I)
- loudness range
- true peak or peak dBFS
- leading silence
- trailing silence
- decode health
- clipping indication
- anomalous noise or container warnings detectable locally
- duration percentile versus the baseline voice corpus
- paired Clara/Marcus duration delta
- outlier flags

Suggested CSV columns:

```text
voiceId,cueKey,path,sha256,durationMs,codec,container,sampleRateHz,channels,bitRate,lufsI,loudnessRange,truePeakDbfs,leadingSilenceMs,trailingSilenceMs,decodeStatus,clippingFlag,baselineDurationPercentile,pairedDurationDeltaMs,outlierFlags,notes
```

Use null/blank for metrics not reliably available.

Do not normalize or rewrite files.

## QC flags

At minimum consider:

- `duration_outlier_short`
- `duration_outlier_long`
- `leading_silence_outlier`
- `trailing_silence_outlier`
- `loudness_outlier`
- `peak_outlier`
- `codec_mismatch`
- `sample_rate_mismatch`
- `channel_mismatch`
- `pair_duration_delta_large`
- `decode_warning`
- `none`

Technical QC does not replace listening.

---

# 14. Standalone human listening-review tool

Create:

- `docs/audits/PEARL_MPV2_VOICE_LISTENING_REVIEW.html`

It must be:

- fully local,
- dependency-free,
- no network calls,
- no autoplay,
- no embedded base64 audio,
- safe to open from a local repository server,
- easy for the founder to use.

## Required asset coverage

Include:

- all current added MPV2/V2.1 cue keys,
- both Clara and Marcus for each,
- the three known overlap cases,
- A/B reference assets where alias/reuse is proposed,
- any current MPV2-reachable asset whose binary content is uncertain and materially affects the reconciliation.

Do not include all 362 spoken assets unless the current MPV2 path genuinely requires them.

## Required display per row

Show:

- cue key
- namespace
- category
- flow stage
- current expected source script
- V2.1 proposed script, if any
- proposed action
- current priority
- requiredness
- Clara duration
- Marcus duration
- source/provenance status
- decision alignment
- technical QC flags
- Clara audio control
- Marcus audio control
- A/B reference controls when applicable

Clearly label expected script as:

> Expected from source — actual audio wording is not yet verified.

## Required review fields

For each logical cue include:

### Transcript/content

- `matches_expected_script`
- `wording_differs`
- `cannot_tell`

### Clara quality

- pronunciation: pass/fail/uncertain
- clarity: pass/fail/uncertain
- pace: too_fast/good/too_slow/uncertain
- tone: good/too_bright/too_flat/too_robotic/other/uncertain
- volume/noise/clicks: pass/fail/uncertain

### Marcus quality

Use the same fields.

### Cross-voice parity

- semantic parity: pass/fail/uncertain
- pacing parity: pass/fail/uncertain
- tone suitability: both_suitable/clara_only/marcus_only/neither/uncertain

### Product review

- wording approved: yes/no/revise/uncertain
- cue necessary: yes/no/uncertain
- recommended action override
- free-text notes

## Required functionality

- Search by cue key/script
- Filter by category
- Filter by proposed action
- Filter by QC flag
- Filter by review completion
- Previous/next controls
- Keyboard shortcuts for play/pause where practical
- Auto-save review data to browser `localStorage`
- Reset with confirmation
- Export review results as JSON
- Export review results as CSV
- Import a previously exported JSON result
- Show completed/total count
- Show unresolved/failing count
- No data leaves the browser

## Asset paths

Use repository-relative URLs suitable when serving the repository root.

Do not copy the MP3s into `docs/`.

---

# 15. Listening-review guide

Create:

- `docs/audits/PEARL_MPV2_VOICE_LISTENING_REVIEW_GUIDE.md`

Include:

1. Exact command to serve the repository root locally, for example:

```bash
python3 -m http.server 8000
```

2. Exact local path to open.
3. Explanation that no network service is used.
4. Recommended listening equipment:
   - phone speaker check,
   - laptop speaker check,
   - headphones only as a secondary check.
5. Review order:
   - Clara first,
   - Marcus,
   - A/B conflicts,
   - critical stop/start cues,
   - side-specific cues,
   - operational MPV2 cues.
6. What to listen for:
   - exact wording,
   - missing or extra words,
   - pronunciation,
   - pace,
   - clipping/clicks,
   - long silence,
   - abrupt endings,
   - inconsistent volume,
   - patronising tone,
   - technical wording,
   - unnatural compositional seams.
7. How to export results.
8. Which result file to return for the next task.
9. A warning not to approve integrated runtime behaviour from audio quality alone.

---

# 16. Current MPV2 event-to-cue graph

Create a complete event graph for the current MPV2 path.

For every event record:

- event id
- screen/controller
- state before
- trigger
- source symbol
- cue key or cue sequence
- priority
- required/optional
- fail-closed/fallback behaviour
- whether speech blocks progression
- whether a timer is already running
- whether a measurement window is active
- whether the event can repeat
- throttle/deduplication
- cancellation on state exit
- next possible competing events
- user action branches
- recovery branches
- missing-asset branch
- current test coverage

Cover at minimum:

- MPV2 check-up entry
- chair practice start
- chair official-ready transition
- chair countdown/start/stop/result
- balance intro
- attempt start
- rest
- attempt saved
- full hold
- ready-after-30
- ready-after-60
- use-best
- balance complete
- balance tracking retry
- shoulder orientation
- shoulder raise
- shoulder tracking retry
- hinge setup
- hinge complete
- hinge no-measurement
- item complete
- check-up complete
- shared retry
- tracking loss
- tracking recovered
- recovery-screen branches
- unmount/cancel
- missing required cue
- playback-start failure

This event graph becomes the source of truth for the next targeted runtime audit.

---

# 17. Targeted runtime-audit input JSON

Create:

- `docs/audits/PEARL_MPV2_TARGETED_RUNTIME_AUDIT_INPUT.json`

Use a structure similar to:

```json
{
  "inputVersion": 1,
  "generatedAt": "...",
  "repositorySnapshot": {},
  "scope": {
    "flow": "movement_profile_v2_checkup",
    "screens": [],
    "controllers": [],
    "excludedUnchangedFlows": [
      "training",
      "legacy_checkup",
      "micro_check"
    ]
  },
  "currentCuePolicies": [],
  "assets": [
    {
      "cueKey": "...",
      "voiceAssets": {
        "clara": {
          "path": "...",
          "durationMs": 0,
          "sha256": "..."
        },
        "marcus": {
          "path": "...",
          "durationMs": 0,
          "sha256": "..."
        }
      },
      "expectedScript": "...",
      "priority": 0,
      "requiredness": "...",
      "missingAssetPolicy": "...",
      "listeningStatus": "pending"
    }
  ],
  "events": [
    {
      "eventId": "...",
      "stage": "...",
      "source": {
        "file": "...",
        "symbol": "...",
        "line": 0
      },
      "trigger": "...",
      "stateBefore": "...",
      "cueKeys": [],
      "priority": 0,
      "blocksProgression": false,
      "timerState": "...",
      "measurementState": "...",
      "repeatRule": "...",
      "cancelRule": "...",
      "nextCompetingEventIds": [],
      "branches": [],
      "tests": []
    }
  ],
  "requiredScenarios": [],
  "knownRisks": [],
  "v21Reconciliation": [],
  "listeningReviewRequiredBeforeFinalVerdict": true
}
```

The next runtime audit must be able to use this input without rediscovering the cue graph from scratch.

---

# 18. Required targeted runtime-audit scenario scope

Create:

- `docs/audits/PEARL_MPV2_TARGETED_RUNTIME_AUDIT_SCOPE.md`

Define the exact later audit scenarios, but do not run the full timing audit yet.

At minimum require:

## Normal paths

- Full normal MPV2 check-up in Clara
- Full normal MPV2 check-up in Marcus
- Chair practice to official attempt
- Every balance attempt branch
- Shoulder left
- Shoulder right
- Hinge valid result
- Completion

## Timing and collision paths

- Initial effect speech versus first user action
- Timer event while prior cue is playing
- Equal-priority event while busy
- Higher-priority event while busy
- Required cue missing
- Required asset resolution throws
- Playback creation fails
- Playback start callback fails
- Cue completes after state exit
- Rapid user action during speech
- Recovery event during speech
- Repeated tracking-loss event
- Tracking recovery before loss cue finishes
- Countdown versus operational cue
- `go` audible-onset timing
- `times-up` during another cue
- Result/completion transition while prior cue remains busy

## User-control paths

- Retry during intro
- Retry during chair practice
- Retry during official attempt
- Retry during balance rest
- Recovery-screen retry
- Navigation/unmount during speech
- App background/foreground where statically modelled
- Voice change while screen-mounted channel exists

## Policy checks

- Current priority 50–100 mapping
- Fail-closed required cue behaviour
- Droppable setup/reassurance cues
- No stale MPV2 operational cue after state change
- Clara/Marcus duration differences do not alter state outcome

List the exact source files and tests the later audit must use.

---

# 19. Preliminary overall verdict

Issue one preliminary verdict:

## `READY_FOR_HUMAN_LISTENING`

Use when:

- source, manifests, keys, and runtime references are structurally coherent,
- no repair is needed before listening,
- semantic binary verification remains pending.

## `SOURCE_OR_MANIFEST_REPAIR_REQUIRED`

Use when:

- current source, manifest, physical assets, or runtime references contradict each other.

## `V21_SPEC_PATCH_REQUIRED_BEFORE_LISTENING`

Use when:

- current MPV2 product semantics conflict so fundamentally with V2.1 that the listening set itself would be misleading.

## `AUDIO_REGENERATION_REQUIRED_BEFORE_LISTENING`

Use only when:

- a required file is missing/corrupt,
- source/binary provenance proves the wrong script was generated,
- or a technical defect makes listening meaningless.

Do not choose regeneration merely because an asset has not yet been human-approved.

Also provide a conditional post-listening next step:

- `PROCEED_TO_TARGETED_RUNTIME_AUDIT`
- `PATCH_V21_AND_REVIEW_AGAIN`
- `REGENERATE_FAILED_ASSETS_ONLY`
- `REPAIR_SOURCE_OR_MANIFEST`
- `REVIEW_UNRESOLVED_CUES`

---

# 20. Required Markdown report structure

Use this exact structure:

# Pearl MPV2 / Voice V2.1 Reconciliation

## 1. Executive Verdict

Include:

- preliminary verdict
- current branch/commit
- worktree state
- current added cue-key count
- current added MP3 count
- Clara/Marcus pair count
- MPV2 runtime-reachable cue count
- exact V2.1 matches
- aliases
- script conflicts
- current-only MPV2 operational cues
- legacy-only cues
- source/manifest defects
- assets requiring listening
- technical QC failures
- approved-decision conflicts
- whether V2.1 needs a patch before listening
- whether audio regeneration is currently justified
- exact next step

## 2. Scope and Method

## 3. Live Repository Snapshot

## 4. Current MPV2 Flow and Battery

## 5. Current Added Cue Surface

## 6. Full MPV2 Runtime Cue Surface

## 7. Canonical Cue Map

## 8. V2.1 Reconciliation

## 9. Approved Founder-Decision Alignment

## 10. MPV2 Operational Cue Review

## 11. Known Overlap Resolution

## 12. Source-to-Binary Provenance

## 13. Clara and Marcus Technical Parity

## 14. Acoustic QC

## 15. Listening Review Pack

## 16. Current Event-to-Cue Graph

## 17. Targeted Runtime Audit Handoff

## 18. Exact Next Step

## 19. Validation and Limitations

## 20. Complete Source Index

---

# 21. Required reconciliation JSON structure

Use a top-level structure similar to:

```json
{
  "auditVersion": 1,
  "generatedAt": "...",
  "status": "pending_human_listening",
  "repositorySnapshot": {},
  "verdict": {
    "preliminary": "READY_FOR_HUMAN_LISTENING",
    "postListeningOptions": [],
    "audioRegenerationJustifiedNow": false,
    "v21PatchRequiredBeforeListening": false,
    "nextAction": "..."
  },
  "summary": {},
  "currentMpv2Flow": {},
  "addedCueKeys": [],
  "runtimeCueSurface": [],
  "canonicalCueMap": [],
  "v21Reconciliation": [],
  "approvedDecisionAlignment": [],
  "operationalCueReview": [],
  "overlapResolutions": [],
  "sourceBinaryProvenance": [],
  "technicalQc": [],
  "voiceParity": {},
  "eventCueGraph": [],
  "targetedRuntimeAuditHandoff": {},
  "validation": {},
  "limitations": []
}
```

Keep the JSON valid and do not include comments.

---

# 22. Validation requirements

Before finishing:

1. Parse the current-state reconciliation JSON.
2. Parse the V2.1 JSON.
3. Parse both current asset and V2.1 manifest CSV files.
4. Re-discover current added cue keys from source/manifests/assets.
5. Reconcile the discovered list with the prior 31-key list.
6. Verify every current added key has Clara and Marcus.
7. Verify every current MPV2 runtime reference resolves.
8. Verify every MPV2 required cue has a physical pair.
9. Verify every MPV2 cue has one canonical-map row.
10. Verify every MPV2 event has an event-graph row.
11. Verify every canonical row has one proposed action.
12. Verify every current cue has a V2.1 reconciliation status.
13. Verify all seven founder decisions are represented.
14. Verify default eyes-closed reachability accurately.
15. Verify side-specific current cues against controller/grader side.
16. Verify the three known overlap cases are resolved.
17. Verify all new/uncertain assets are present in the listening tool.
18. Verify HTML audio paths exist.
19. Verify the listening tool makes no external request.
20. Verify export/import and localStorage logic syntactically.
21. Verify the HTML includes Clara and Marcus controls.
22. Verify technical-QC CSV row count.
23. Verify all new assets have hashes and durations.
24. Verify no technical metric is invented when unavailable.
25. Verify targeted runtime input JSON parses.
26. Verify every event cue key in the runtime input exists.
27. Verify runtime scope includes all listed normal, timing, recovery, user-action, and fail-closed scenarios.
28. Run `npm run verify:audio`.
29. Run relevant MPV2 audio and voice tests.
30. Run `npx tsc --noEmit`.
31. Inspect `git status --short`.
32. Inspect `git diff --stat`.
33. Confirm only requested audit artifacts and any audit-only generator were added.
34. Confirm no production, test, manifest, generator, or audio file changed.
35. Confirm no external API was called.
36. Remove temporary files.
37. Ensure Markdown, JSON, CSV, HTML, and runtime input counts agree.

Do not modify tests to make validation pass.

---

# 23. Final Codex response

When finished, respond with:

- Paths to all eight generated artifacts
- Any audit-only generator added
- Confirmation that no production code changed
- Confirmation that no tests changed
- Confirmation that no manifest or generation source changed
- Confirmation that no audio changed or was generated
- Current branch and commit
- Whether the relevant worktree was already dirty
- Current discovered added cue-key count
- Current added MP3 count
- Clara/Marcus pair count
- Full MPV2 runtime-reachable cue count
- Number of exact V2.1 matches
- Number of alias/reuse candidates
- Number of script conflicts
- Number of current-only MPV2 operational cues
- Number of conditional legacy cues
- Number of source/manifest defects
- Number of assets requiring listening
- Number of technical QC failures/outliers
- Number of approved-decision conflicts
- Preliminary verdict
- Whether V2.1 must be patched before listening
- Whether audio regeneration is currently justified
- Exact command/path for opening the listening tool
- Number of listening-review rows
- Number of events in the targeted runtime input
- Number of required targeted runtime scenarios
- Tests and validation commands run
- The five most important reconciliation findings
- Exact next action after the founder exports listening results
- A concise confidence statement

Do not run the targeted runtime timing audit, change production behaviour, or generate audio in this task.
