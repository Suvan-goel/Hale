# Codex Prompt: Hale Post-Generation Whole-Project Voice V2.1 Static/Runtime Audit With Measured Durations

Read this entire prompt before doing anything.

Hale’s consolidated Clara/Marcus Voice V2.1 asset-generation pass is complete.

Current reported asset-generation state:

```text
Asset-generation verdict:
VOICE_V2_1_ASSET_GENERATION_COMPLETE_AUDIO_QA_PENDING

Generated MP3s:
352 total
176 Clara
176 Marcus

Generation jobs:
352 / 352 completed
0 failed
0 skipped

Generation backlog:
176 rows before generation
0 rows after generation

Generated pairs:
141 new pairs
35 script-mismatch pairs regenerated

Exact-ready pairs regenerated:
0

Out-of-backlog generated assets:
0

Unexpected audio changes:
0

Modified/deleted existing audio assets:
0

Provider:
ElevenLabs

Model:
eleven_multilingual_v2

Output format:
mp3_44100_128

Final audio verification:
npm run verify:audio passed

Current required verified assets:
502 total

Human listening:
not completed

Audio approval:
not granted

Physical-device QA:
deferred

Feature gates:
closed
```

The exact next phase is:

```text
Post-generation whole-project Voice V2.1 static/runtime audit with measured durations
```

This task must audit the entire Voice V2.1 surface after physical asset generation, using the newly generated and measured Clara/Marcus MP3 durations.

It must not generate audio.

It must not call ElevenLabs or any speech/audio API.

It must not enable any feature.

It must not perform listening review or physical-device QA.

The purpose is to decide whether Hale is ready for the next phase:

```text
Founder listening review for Clara and Marcus
```

or whether any software, manifest, timing, readiness, or runtime blocker remains.

---

# 1. Entry baseline

Before changing or generating any artifact, run and record:

```bash
git status --short --branch
git diff --name-only
git diff --stat
git diff -- assets/audio
git diff -- src/audio scripts/generate-audio.ts scripts/verify-audio.ts
npm run verify:audio
npx tsc --noEmit --pretty false
node scripts/audits/audit-voice-v21-asset-generation.mjs
node scripts/audits/audit-voice-v21-final-cue-schema.mjs
```

Create entry snapshots:

```bash
find assets/audio -type f | sort > /tmp/hale_voice_v21_post_generation_entry.files
find assets/audio -type f | sort | xargs shasum -a 256 > /tmp/hale_voice_v21_post_generation_entry.sha256
```

Record:

- branch,
- full and short HEAD,
- upstream,
- whether the worktree is already dirty,
- task-start audio file count,
- task-start audio hash count,
- current `npm run verify:audio` result,
- current asset-generation verdict,
- current final-schema verdict,
- current full required-audio count,
- current Voice V2.1 asset count,
- current Clara/Marcus pair counts.

## Entry stop rule

Stop before auditing and return a blocking verdict if:

- `npm run verify:audio` fails,
- typecheck fails in a relevant voice/audio/runtime area,
- asset-generation audit fails,
- final cue schema audit fails,
- generated asset inventory is missing or malformed,
- generation result ledger has failed/incomplete jobs,
- any required V2.1 physical cue is missing Clara or Marcus,
- any newly generated asset is corrupt or undecodable,
- or current source cannot determine readiness values.

Do not layer a whole-project audit over a broken generated corpus.

---

# 2. Source artifacts to read

Read and use the current artifacts.

## Asset generation

- `docs/audits/HALE_VOICE_V2_1_ASSET_GENERATION_IMPLEMENTATION.md`
- `docs/audits/HALE_VOICE_V2_1_ASSET_GENERATION_AUDIT.md`
- `docs/audits/HALE_VOICE_V2_1_ASSET_GENERATION_AUDIT.json`
- `docs/audits/HALE_VOICE_V2_1_GENERATION_PLAN.csv`
- `docs/audits/HALE_VOICE_V2_1_GENERATION_RESULT_LEDGER.csv`
- `docs/audits/HALE_VOICE_V2_1_GENERATED_ASSET_INVENTORY.csv`
- `docs/audits/HALE_VOICE_V2_1_POST_GENERATION_MANIFEST_CHANGES.csv`
- `docs/audits/HALE_VOICE_V2_1_POST_GENERATION_TIMELINES.csv`
- `docs/audits/HALE_VOICE_V2_1_POST_GENERATION_READINESS.csv`
- `docs/audits/HALE_VOICE_V2_1_LISTENING_REVIEW_QUEUE.csv`
- `docs/audits/HALE_VOICE_V2_1_LISTENING_REVIEW_GUIDE.md`
- `docs/audits/HALE_VOICE_V2_1_LISTENING_REVIEW.html`
- `docs/audits/HALE_VOICE_PROJECT_POST_ASSET_GENERATION_HANDOFF.md`
- `scripts/audits/audit-voice-v21-asset-generation.mjs`

Expected current result:

```text
VOICE_V2_1_ASSET_GENERATION_COMPLETE_AUDIO_QA_PENDING
```

## Final cue schema

- `docs/audits/HALE_VOICE_V2_1_FINAL_CUE_SCHEMA_IMPLEMENTATION.md`
- `docs/audits/HALE_VOICE_V2_1_FINAL_CUE_SCHEMA_AUDIT.md`
- `docs/audits/HALE_VOICE_V2_1_FINAL_CUE_SCHEMA_AUDIT.json`
- `docs/audits/HALE_VOICE_V2_1_FINAL_CUE_REGISTRY.csv`
- `docs/audits/HALE_VOICE_V2_1_PHYSICAL_ASSET_RECONCILIATION.csv`
- `docs/audits/HALE_VOICE_V2_1_MANIFEST_CHANGE_PLAN.csv`
- `docs/audits/HALE_VOICE_V2_1_GENERATION_BACKLOG.csv`
- `docs/audits/HALE_VOICE_V2_1_RETIREMENT_LEGACY_MAP.csv`
- `docs/audits/HALE_VOICE_V2_1_SCHEMA_TIMELINES.csv`
- `docs/audits/HALE_VOICE_V2_1_SCHEMA_RUNTIME_SCENARIOS.csv`
- `docs/audits/HALE_VOICE_PROJECT_POST_FINAL_CUE_SCHEMA_HANDOFF.md`
- `scripts/audits/audit-voice-v21-final-cue-schema.mjs`

Expected current relationship:

```text
pre-generation backlog:
176 rows

post-generation unresolved active backlog:
0 rows
```

## Training Voice V2.1 runtime

- `docs/audits/HALE_TRAINING_VOICE_V2_1_CONTROLS_PROGRESS_RECOVERY_IMPLEMENTATION.md`
- `docs/audits/HALE_TRAINING_VOICE_V2_1_CONTROLS_PROGRESS_RECOVERY_AUDIT.md`
- `docs/audits/HALE_TRAINING_VOICE_V2_1_CONTROLS_PROGRESS_RECOVERY_AUDIT.json`
- `docs/audits/HALE_TRAINING_VOICE_V2_1_CONTROL_CONTRACT_MATRIX.csv`
- `docs/audits/HALE_TRAINING_VOICE_V2_1_PROGRESS_SCHEDULE_MATRIX.csv`
- `docs/audits/HALE_TRAINING_VOICE_V2_1_REACTIVE_SAFETY_MIGRATION.csv`
- `docs/audits/HALE_TRAINING_VOICE_V2_1_RUNTIME_SCENARIOS.csv`
- `docs/audits/HALE_TRAINING_VOICE_V2_1_CONTROL_TIMELINES.csv`
- `docs/audits/HALE_TRAINING_VOICE_V2_1_CONTROL_ASSET_REQUIREMENTS.csv`
- `docs/audits/HALE_VOICE_PROJECT_POST_TRAINING_RUNTIME_HANDOFF.md`
- current source under `src/training/voiceV21/`

Expected current state:

```text
safety ready:
true

controls ready:
true

progress ready:
true

recovery ready:
true

global behavior ready:
true

physical audio surface:
ready after generation

audio approval:
false

feature default:
off

selectable exercise count:
0
```

## Micro-Check Voice V2.1

- `docs/audits/HALE_MICRO_CHECK_VOICE_V2_1_IMPLEMENTATION.md`
- `docs/audits/HALE_MICRO_CHECK_VOICE_V2_1_AUDIT.md`
- `docs/audits/HALE_MICRO_CHECK_VOICE_V2_1_AUDIT.json`
- `docs/audits/HALE_MICRO_CHECK_VOICE_V2_1_CONTRACT_MATRIX.csv`
- `docs/audits/HALE_MICRO_CHECK_VOICE_V2_1_PROTOCOL_COMPATIBILITY_MATRIX.csv`
- `docs/audits/HALE_MICRO_CHECK_VOICE_V2_1_RUNTIME_SCENARIOS.csv`
- `docs/audits/HALE_MICRO_CHECK_VOICE_V2_1_COMPOSED_TIMELINES.csv`
- `docs/audits/HALE_MICRO_CHECK_VOICE_V2_1_ASSET_REQUIREMENTS.csv`
- `docs/audits/HALE_VOICE_PROJECT_POST_MICRO_CHECK_V2_1_HANDOFF.md`
- current source under `src/training/microCheckVoiceV21/`

Expected current state:

```text
software complete:
true

behavior ready:
true

physical audio surface:
ready after generation

audio approval:
false

feature default:
off

selectable type count:
0
```

## MPV2 / Movement Check-Up

Read current source and artifacts:

- `docs/audits/HALE_MPV2_TARGETED_RUNTIME_POST_COMPLETION_AUDIT.md`
- `docs/audits/HALE_MPV2_TARGETED_RUNTIME_POST_COMPLETION_AUDIT.json` if present
- `docs/audits/HALE_VOICE_PROJECT_POST_MPV2_HANDOFF.md`
- `docs/audits/HALE_MPV2_V21_VOICE_RECONCILIATION.md`
- `docs/audits/HALE_MPV2_V21_VOICE_RECONCILIATION.json`
- `docs/audits/HALE_MPV2_VOICE_CANONICAL_MAP.csv`
- `docs/audits/HALE_MPV2_VOICE_ASSET_QC.csv`
- current source under `src/movementProfileV2/`

Expected current state:

```text
static/runtime P0/P1/P2:
0/0/0

human listening:
not completed

device QA:
deferred
```

## Eyes-Open Balance V2

- `docs/audits/HALE_EYES_OPEN_BALANCE_V2_IMPLEMENTATION.md`
- `docs/audits/HALE_EYES_OPEN_BALANCE_V2_AUDIT.md`
- `docs/audits/HALE_EYES_OPEN_BALANCE_V2_AUDIT.json`
- `docs/audits/HALE_EYES_OPEN_BALANCE_V2_SCENARIOS.csv`
- `docs/audits/HALE_EYES_OPEN_BALANCE_V2_VOICE_ASSET_REQUIREMENTS.csv`
- `docs/audits/HALE_VOICE_PROJECT_POST_BALANCE_V2_HANDOFF.md`
- current Balance V2 source

Important: older Balance V2 audit may contain stale audio-Git-diff expectations from before regenerated/generated audio. This task must verify Balance V2 physical readiness through current manifests, `verify:audio`, and task-start/task-end hashes, not by old Git-HEAD audio comparison.

## Floor readiness post-safety

- `docs/audits/HALE_TRAINING_FLOOR_READINESS_POST_SAFETY_REBASE.md`
- `docs/audits/HALE_TRAINING_FLOOR_READINESS_POST_SAFETY_REBASE.json`
- `docs/audits/HALE_TRAINING_FLOOR_READINESS_POST_SAFETY_SCENARIOS.csv`
- `docs/audits/HALE_TRAINING_FLOOR_CONTRACT_MATRIX_POST_SAFETY.csv`
- `docs/audits/HALE_VOICE_PROJECT_POST_FLOOR_READINESS_POST_SAFETY_HANDOFF.md`
- `scripts/audits/audit-training-floor-readiness.mjs`

Current expected floor state:

```text
TRAINING_FLOOR_READINESS_POST_SAFETY_BASELINE_COMPLETE

IR-VOICE-FLOOR-GATE remaining:
0

IR-VOICE-FINAL-POSITION-READINESS remaining:
0

IR-VOICE-SAFETY-SUBSUMPTION remaining:
0
```

## Other completed foundations

Read current source/audits for:

- both-sides rounds
- step-up runtime/evidence closure
- measurement-side post-UX foundation
- side/protocol metadata
- audio verifier/generator
- VoiceChannel tracked playback

---

# 3. Review and QA status

Use these exact statuses:

```text
Script status:
founder_assumed_accepted_for_implementation

Physical audio generated:
yes

Human listening:
not_completed

Audio approval:
not_granted

Physical-device QA:
deferred

Physical speaker onset:
not_measured
```

This task may prove static/runtime software and audio-manifest correctness.

It must not claim that the generated voices sound good, are approved, or work on actual phone speakers.

---

# 4. Objective

Perform a whole-project post-generation audit that proves or disproves:

1. Every active V2.1 logical cue has a verified Clara/Marcus physical pair.
2. Every active V2.1 cue is statically reachable through manifests without dynamic require issues.
3. `npm run verify:audio` covers all required surfaces and passes.
4. The 352 newly generated MP3s are registered, fingerprint-current, decodeable, and duration-measured.
5. No exact-ready pre-existing pair was unnecessarily regenerated.
6. No legacy-only or retired asset was modified by generation.
7. No out-of-backlog audio was generated.
8. No physical asset is missing, corrupt, unpaired, or orphaned from the final schema.
9. Training Voice V2.1 still has behavior ready true and now has physical audio surface ready.
10. Micro-Check Voice V2.1 still has behavior ready true and now has physical audio surface ready.
11. Balance V2 now has physical audio surface ready if all required stage cue pairs exist.
12. MPV2 / Movement Check-Up physical audio surface is ready.
13. Audio approval remains false.
14. Feature defaults remain off/closed.
15. Selectable exercise/type counts remain zero.
16. Existing legacy voice flows remain reachable and unchanged in default mode.
17. V2.1 runtime selection remains closed without explicit internal/test readiness.
18. No V2.1 path mixes legacy and V2.1 voice authority.
19. Required tracked speech still blocks the correct boundaries.
20. Active timing still starts on `go` playback-start in all relevant V2.1 paths.
21. Missing-asset failure injection still fails closed.
22. Stale callback guards still work across:
    - item,
    - set,
    - side,
    - attempt,
    - control,
    - recovery,
    - voice change,
    - completion.
23. Mounted voice switching still prevents mixed required sequences.
24. Pause/resume/retry/discard/skip/cancel semantics remain correct.
25. Tracking loss/recovery still requires fresh setup/countdown where required.
26. Side/protocol metadata remains correct across MPV2, Micro-Check, Balance V2, and official retests.
27. Both-sides rounds, step-up alternation, floor final position, and Micro-Check side pinning remain intact.
28. All hard timing budgets pass using measured MP3 durations.
29. Target timing warnings are recorded for listening review but do not block if hard max passes.
30. Longest generated cues and largest voice-duration deltas are highlighted for listening review.
31. The listening review package includes all generated assets plus critical exact-ready shared cues.
32. No human listening approval is claimed.
33. The exact next phase becomes:
    - Founder Clara/Marcus listening review.

---

# 5. Strict scope

## In scope

- Whole-project static cue/schema/manifest audit.
- Whole-project runtime/timeline audit using measured durations.
- Rerun or supersede older stale audio-diff audits.
- Audio manifest verification.
- VoiceChannel/tracked playback failure-path audit.
- Training runtime audit.
- Micro-Check runtime audit.
- MPV2 runtime audit.
- Balance V2 audio/runtime audit.
- Side/protocol comparability audit.
- Feature-gate/readiness audit.
- Timing recomputation.
- Listening review package refresh.
- Audit artifacts and tests.

## Out of scope

Do not:

- generate more audio;
- call ElevenLabs or any speech/audio API;
- alter audio files;
- delete or rename audio files;
- change scripts/copy;
- change runtime behavior unless a small audit-only harness fix is needed;
- enable Training Voice V2.1;
- enable Micro-Check Voice V2.1;
- enable Balance V2;
- enable step-up/floor V2.1 by default;
- perform human listening review;
- mark audio approved;
- perform physical-device QA;
- measure physical speaker onset;
- change protocol/scoring semantics;
- change exercise prescriptions;
- change feature flags to on;
- install packages;
- change lockfiles;
- commit/push/reset/stash/clean/checkout/rebase/discard work.

If a real defect is found, report it. Do not hide it behind an audit-only pass.

---

# 6. Worktree and audio safety

The repo is heavily dirty and now includes generated V2.1 audio.

Before writing artifacts, record:

```bash
git status --short --branch
git diff --name-only
git diff --stat
git diff -- assets/audio
git diff -- src/audio scripts/generate-audio.ts scripts/verify-audio.ts
```

Create task-start snapshots:

```bash
find assets/audio -type f | sort > /tmp/hale_voice_v21_whole_project_entry.files
find assets/audio -type f | sort | xargs shasum -a 256 > /tmp/hale_voice_v21_whole_project_entry.sha256
```

At task end:

```bash
find assets/audio -type f | sort > /tmp/hale_voice_v21_whole_project_exit.files
find assets/audio -type f | sort | xargs shasum -a 256 > /tmp/hale_voice_v21_whole_project_exit.sha256
diff -u /tmp/hale_voice_v21_whole_project_entry.files /tmp/hale_voice_v21_whole_project_exit.files
diff -u /tmp/hale_voice_v21_whole_project_entry.sha256 /tmp/hale_voice_v21_whole_project_exit.sha256
```

Success requires:

```text
audio files added by this audit:
0

audio files modified by this audit:
0

audio files deleted by this audit:
0
```

Git may show generated audio as dirty/untracked relative to HEAD. That is not a failure.

The audit must compare audio changes relative to the task-start snapshot.

---

# 7. Current source to inspect

Follow current imports and runtime call paths.

## Audio

- `src/audio/cues.ts`
- `src/audio/manifest.ts`
- `src/audio/voiceV21Audio.ts`
- `src/audio/voiceV21AudioManifest.ts`
- `src/audio/movementProfileV2Audio.ts`
- `src/audio/movementProfileV2AudioManifest.ts`
- `src/audio/safetyAudio.ts`
- `src/audio/safetyAudioManifest.ts`
- `src/audio/voicePlayer.ts`
- `src/audio/__tests__/*`
- `scripts/generate-audio.ts`
- `scripts/verify-audio.ts`
- generated metadata/fingerprint files

## Training

- `src/training/voiceV21/`
- `src/training/sessionPlayer.ts`
- `src/training/setRuntime.ts`
- `src/screens/TrainingSessionScreen.tsx`
- both-sides, step-up, floor setup modules
- training serialize/backend state

## Micro-Check

- `src/training/microCheckVoiceV21/`
- `src/training/microCheck.ts`
- `src/screens/MicroCheckScreen.tsx`
- micro-check side setup
- micro-check sync/restore

## MPV2 and Balance V2

- `src/movementProfileV2/`
- `src/movements/balanceEyesOpenV2.ts`
- `src/checkup/measurementProtocolRegistry.ts`
- `src/checkup/measurementMetadata.ts`
- `src/checkup/measurementContext.ts`
- `src/screens/MovementProfileV2CheckUpScreen.tsx`

## General

- feature flags/config
- profile voice selection
- app audio configuration
- restore/backend services
- all current audit harnesses

Search for:

```text
VoiceV21
voiceV21Audio
audioReady
physicalAudioSurfaceReady
audioApprovalReady
selectable
EXPO_PUBLIC_ENABLE_TRAINING_VOICE_V2_1
EXPO_PUBLIC_ENABLE_MICRO_CHECK_VOICE_V2_1
EXPO_PUBLIC_ENABLE_EYES_OPEN_BALANCE_PROTOCOL_V2
speakTracked
playback-start
go
countdown-three
tracking-loss-v21
tracking-recovered-v21
microcheck-complete-v21
session-complete-v21
IR-VOICE
baseline_audio_diff_method_stale_not_product_failure
```

---

# 8. Required audit surfaces

The audit must cover these surfaces.

## 8.1 Physical audio

Verify:

- total audio files,
- spoken audio files,
- SFX files,
- Clara files,
- Marcus files,
- pair parity,
- decode success,
- sha256,
- duration,
- sample rate,
- channel count,
- file size,
- fingerprint status,
- metadata status,
- manifest registered,
- static require path exists,
- no stale metadata,
- no corrupt files,
- no missing pairs,
- no unknown V2.1 required physical key,
- no generated V2.1 asset outside schema,
- no unclassified physical asset.

## 8.2 Cue schema

Verify:

- all active logical V2.1 cues physical-ready,
- no duplicate logical keys,
- no missing scripts,
- no missing policy/lifecycle,
- no pending active cues,
- no script mismatches,
- no retired cue in active V2.1 sequences,
- no conditional legacy cue in default V2.1 sequences,
- no old set-plan cue in V2.1 setup,
- no `microcheck-intro` in Micro-Check V2.1,
- no `relax-arm-v21` mapped to `micro-relax-v21`,
- no eyes-closed cue in default Balance V2.

## 8.3 Runtime selection and feature gates

Verify:

- Training Voice V2.1 default off,
- Micro-Check Voice V2.1 default off,
- Balance V2 default closed,
- Step-up alternation default off,
- Floor V2.1 default off,
- no user route becomes V2.1 by default,
- selectable exercise/type counts remain zero unless explicitly internal-only and not user-reachable,
- legacy fallback/default remains available,
- audio approval remains false,
- physical audio surface ready values are separated from approval/feature readiness.

## 8.4 Training runtime

Verify:

- session intro/universal safety,
- first-use/later-set/repeat instructions,
- safety-family memory,
- countdown/go,
- active-start boundary,
- progress cues,
- SFX,
- pause/resume,
- retry/skip/cancel,
- times-up,
- transitions,
- both-sides rounds,
- step-up alternation,
- floor setup/final position,
- tracking recovery,
- mounted voice switching,
- restore/backend state.

## 8.5 Micro-Check runtime

Verify:

- three contracts,
- side pinning,
- exact type/side setup,
- final position,
- countdown/go,
- chair SFX only,
- balance/mobility no unsupported progress,
- mobility relax cue,
- pause/resume/retry/discard/cancel,
- tracking recovery,
- completion after persistence,
- no invalid result completion,
- voice switching,
- protocol/comparability separation.

## 8.6 MPV2 / Check-Up runtime

Verify:

- current MPV2 V2.1 cue set,
- check-up intro,
- chair setup and go,
- shoulder side cues,
- hinge setup,
- tracking loss/recovered,
- retry,
- item complete/check-up complete,
- Balance V2 stage cues where applicable,
- TUG remains conditional/beta if applicable,
- active starts at go playback-start,
- stage-scoped cancellation,
- mounted voice switching,
- no default eyes-closed cue for Balance V2,
- no stale old operational cue in V2 path.

## 8.7 Eyes-Open Balance V2

Verify:

- protocol `home_balance_eyes_open_v2` version 2,
- four eyes-open stages,
- no default eyes-closed stages,
- required stage cues physical-ready,
- old protocol preserved,
- old history not rewritten,
- no cross-protocol deltas,
- selected lead/standing side consistency,
- no missing fresh countdown,
- no stale callback,
- default remains closed until QA/activation.

## 8.8 Side/protocol metadata

Verify:

- MPV2 side/comparability metadata still works,
- Micro-Check side anchors still work,
- official opposite-side fallback remains reduced,
- no false same-side comparison,
- no false cross-protocol comparison,
- no official anchor overwrite,
- local/backend metadata round trips,
- legacy result parsing remains.

---

# 9. Timing model

Use measured physical durations from disk.

Do not use stale pre-generation estimates for any generated cue.

Use estimates only for a cue if it is not physically present, which should be zero for active V2.1 cues after successful generation.

Model at least:

- 0 ms additional gap,
- 100 ms additional gap,
- 250 ms additional gap,
- Clara,
- Marcus.

## Timing budgets

Use current approved budgets from the final schema/spec.

At minimum enforce hard maximums for:

```text
training intro + universal safety
ordinary first-use pre-countdown
complex equipment first-use pre-countdown
later-set reminder
repeat instructions
control confirmation
tracking loss
tracking recovery
loss + recovery
micro-check setup
micro-check control/completion
check-up assessment setup
Balance V2 stage setup
countdown/go sequence integrity
completion/transition stacks
```

## Output must report

```text
timelineRowCount
measuredDurationRowCount
estimatedDurationRowCount
durationSourceStaleCount
targetFailureCount
hardMaxFailureCount
longestCue
longestSequence
largestClaraMarcusDelta
generatedCueOutlierCount
sequenceRedundancyCount
```

Hard-max failures are P2 blockers unless explicitly excluded as legacy-only/nonactive.

Target failures below hard max are P3 listening-review warnings.

---

# 10. Static/runtime scenario requirements

Create canonical scenario rows for at least the following.

## Audio and schema

- `verify_audio_post_generation`
- `all_active_v21_cues_physical_ready`
- `no_pending_active_cues`
- `no_script_mismatch_active_cues`
- `clara_marcus_pair_parity`
- `no_corrupt_generated_audio`
- `metadata_fingerprint_current`
- `static_require_paths_exist`
- `no_runtime_manifest_missing_key`
- `no_out_of_schema_generated_asset`

## Feature and readiness gates

- `training_feature_default_off`
- `micro_feature_default_off`
- `balance_v2_default_closed`
- `step_up_default_off`
- `floor_v21_default_off`
- `training_physical_audio_ready_but_approval_false`
- `micro_physical_audio_ready_but_approval_false`
- `balance_physical_audio_ready_but_approval_false`
- `selectable_counts_zero`
- `legacy_default_route_unchanged`

## Training runtime

- `training_session_entry_sequence`
- `training_safety_memory_after_generation`
- `training_first_use_complex_setup`
- `training_later_set_no_safety_repeat`
- `training_repeat_instructions_no_safety`
- `training_countdown_go_boundary`
- `training_missing_required_asset_injection`
- `training_pause_resume`
- `training_retry`
- `training_skip`
- `training_tracking_recovery`
- `training_voice_switch_countdown`
- `training_session_completion_once`
- `training_restore_no_auto_active`

## Both-sides / step-up / floor

- `both_sides_side_switch_sequence`
- `both_sides_no_rest_between_sides`
- `step_up_sfx_only`
- `step_up_wrong_lead_correction`
- `step_up_expected_lead_preserved_recovery`
- `floor_transition_once`
- `floor_final_position_before_countdown`
- `floor_restore_no_auto_start`

## Micro-Check

- `micro_chair_power_full_flow`
- `micro_balance_left_full_flow`
- `micro_balance_right_full_flow`
- `micro_mobility_left_full_flow`
- `micro_mobility_right_full_flow`
- `micro_go_playback_start_boundary`
- `micro_pause_resume`
- `micro_retry`
- `micro_discard`
- `micro_tracking_recovery`
- `micro_completion_after_persistence`
- `micro_invalid_no_completion`
- `micro_voice_switch_countdown`
- `micro_protocol_series_separated`

## MPV2 / Check-Up

- `mpv2_full_default_checkup_clara`
- `mpv2_full_default_checkup_marcus`
- `mpv2_chair_go_boundary`
- `mpv2_shoulder_left_right`
- `mpv2_hinge_setup`
- `mpv2_tracking_recovery`
- `mpv2_retry`
- `mpv2_item_completion`
- `mpv2_checkup_completion`
- `mpv2_stale_stage_callback_ignored`
- `mpv2_voice_switch_required_sequence`

## Balance V2

- `balance_v2_feet_together_stage`
- `balance_v2_semi_tandem_stage`
- `balance_v2_tandem_stage`
- `balance_v2_single_leg_stage`
- `balance_v2_no_eyes_closed_default`
- `balance_v2_old_protocol_preserved`
- `balance_v2_no_cross_protocol_delta`
- `balance_v2_default_closed`

## Listening and device boundaries

- `human_listening_not_completed`
- `audio_approval_not_granted`
- `physical_device_qa_deferred`
- `speaker_onset_not_measured`

The audit may add more.

---

# 11. Failure injection requirements

The audit must include controlled source/runtime injection or simulated binding rows for:

- missing required training setup asset,
- missing `go`,
- failed playback start,
- stale completion callback,
- voice switch during countdown,
- missing micro-check completion asset,
- missing Balance V2 stage cue,
- missing MPV2 retry/recovery cue,
- corrupt generated asset fixture where practical,
- feature flag accidentally on,
- audio approval false with physical audio ready.

Do not actually corrupt production audio files.

Use mocks, fixtures, or runtime binding overrides.

Every injected failure must prove the expected fail-closed or blocked-readiness behavior.

---

# 12. Required artifacts

Create:

1. `docs/audits/HALE_VOICE_V2_1_POST_GENERATION_WHOLE_PROJECT_AUDIT.md`
2. `docs/audits/HALE_VOICE_V2_1_POST_GENERATION_WHOLE_PROJECT_AUDIT.json`
3. `docs/audits/HALE_VOICE_V2_1_POST_GENERATION_RUNTIME_SCENARIOS.csv`
4. `docs/audits/HALE_VOICE_V2_1_POST_GENERATION_TIMELINE_AUDIT.csv`
5. `docs/audits/HALE_VOICE_V2_1_POST_GENERATION_PHYSICAL_AUDIO_AUDIT.csv`
6. `docs/audits/HALE_VOICE_V2_1_POST_GENERATION_READINESS_MATRIX.csv`
7. `docs/audits/HALE_VOICE_V2_1_POST_GENERATION_FAILURE_INJECTION.csv`
8. `docs/audits/HALE_VOICE_V2_1_POST_GENERATION_LISTENING_REVIEW_PLAN.md`
9. `docs/audits/HALE_VOICE_V2_1_POST_GENERATION_LISTENING_QUEUE.csv`
10. `docs/audits/HALE_VOICE_PROJECT_POST_WHOLE_PROJECT_AUDIT_HANDOFF.md`

Add one audit-only harness:

```text
scripts/audits/audit-voice-v21-post-generation-whole-project.mjs
```

Do not overwrite generation or final-schema artifacts.

## Runtime scenarios CSV columns

Use columns similar to:

```text
scenarioId,category,flow,voiceId,runtimeMode,featureState,logicalCueKeys,physicalCueKeys,trackedOutcome,controllerBoundary,activeStarted,activeStopped,resultPersisted,legacyVoiceEmitted,v21VoiceEmitted,readinessOutcome,passed,testCoverage,notes
```

## Timeline CSV columns

Use columns similar to:

```text
scenarioId,flow,variant,voiceId,gapMs,cueKeys,durationSource,totalMeasuredMs,totalEstimatedMs,targetMs,hardMaxMs,passesTarget,passesHardMax,longestCueKey,notes
```

## Physical audio CSV columns

Use columns similar to:

```text
physicalCueKey,logicalCueKeys,voiceId,path,exists,sha256,durationMs,fileSizeBytes,sampleRateHz,channels,manifestRegistered,verifyAudioCovered,metadataStatus,fingerprintStatus,decodeStatus,classification,notes
```

## Readiness matrix CSV columns

Use columns similar to:

```text
surface,behaviorReady,physicalAudioSurfaceReady,audioApprovalReady,featureDefault,selectableCount,userReachable,requiredCueCount,physicalReadyCueCount,pendingCueCount,missingCueCount,readinessVerdict,notes
```

## Failure injection CSV columns

Use columns similar to:

```text
injectionId,flow,scenario,mutationType,targetCueKey,targetPhase,expectedOutcome,observedOutcome,passed,blocksReadiness,notes
```

---

# 13. Audit metrics

Report at minimum:

```text
totalPhysicalAudioFileCount
totalSpokenPhysicalAudioFileCount
totalSfxFileCount
claraFileCount
marcusFileCount
v21PhysicalCuePairCount
verifiedRequiredAssetCount
generatedAssetCount
generatedAssetDecodeFailureCount
generatedAssetFingerprintStaleCount
missingManifestPathCount
staticRequireFailureCount
unclassifiedPhysicalAssetCount
unexpectedAudioChangeCount

activeV21LogicalCueCount
activeV21PhysicalReadyCueCount
activeV21MissingPhysicalCueCount
activeV21ScriptMismatchCount
pendingActiveCueCount
retiredDefaultEmissionCount
conditionalLegacyDefaultEmissionCount
microcheckIntroEmissionCount
eyesClosedBalanceDefaultEmissionCount

trainingBehaviorReadyValue
trainingPhysicalAudioSurfaceReadyValue
trainingAudioApprovalReadyValue
trainingFeatureDefault
trainingSelectableExerciseCount

microBehaviorReadyValue
microPhysicalAudioSurfaceReadyValue
microAudioApprovalReadyValue
microFeatureDefault
microSelectableTypeCount

balanceV2PhysicalAudioSurfaceReadyValue
balanceV2AudioApprovalReadyValue
balanceV2DefaultClosed

mpv2PhysicalAudioSurfaceReadyValue

legacyDefaultRouteChangedCount
legacyV21DoubleVoiceCount
missingAssetSilentContinuationCount
goDispatchStartCount
goCompletionStartCount
missingGoActiveStartCount
staleCallbackMutationCount
voiceSwitchMixedSequenceCount
twoLiveVoiceChannelCount

trainingRuntimeFailureCount
microRuntimeFailureCount
mpv2RuntimeFailureCount
balanceV2RuntimeFailureCount
sideProtocolFailureCount
restorePersistenceFailureCount

timelineRowCount
measuredDurationRowCount
estimatedDurationRowCount
durationSourceStaleCount
targetTimingFailureCount
hardMaxTimingFailureCount
sequenceRedundancyCount
longCueWarningCount
voiceDurationDeltaWarningCount

failureInjectionCount
failureInjectionPassedCount
failureInjectionFailedCount

humanListeningCompletedValue
audioApprovalGrantedValue
physicalDeviceQaCompletedValue
speakerOnsetMeasuredValue

p0
p1
p2
p3
```

Severity counts must derive from findings.

---

# 14. Findings and verdicts

## P1 examples

- A required active V2.1 physical asset is missing or corrupt.
- `verify:audio` fails.
- Active starts without `go` playback-start.
- Missing required asset silently continues.
- Legacy and V2.1 voices both own the same flow.
- Feature defaults are enabled by accident.
- Human-listening/audio-approval is falsely marked true.
- A stale callback can mutate a later state.
- A side/protocol mismatch creates false comparability.
- A generated asset is outside the schema/backlog and runtime-reachable.

## P2 examples

- Hard timing max failure.
- Runtime path is only modelled but not connected.
- Physical audio surface readiness is derived incorrectly.
- Restore/persistence loses voice/runtime state.
- Failure injection cannot prove fail-closed behavior.
- Listening queue misses generated or high-risk assets.
- Old stale audit blocks still exist without current interpretation.
- Schema/manifests are not internally consistent.

## P3 examples

- Human listening not completed.
- Audio approval not granted.
- Physical-device QA deferred.
- Physical speaker onset not measured.
- Target timing warnings below hard max.
- Long generated cue / voice duration delta warning.

Issue exactly one verdict.

### `VOICE_V2_1_POST_GENERATION_WHOLE_PROJECT_AUDIT_COMPLETE_LISTENING_PENDING`

Use when:

- all P0/P1/P2 counts are zero,
- physical audio surface is complete and verified,
- static/runtime software gates pass,
- measured timing hard maxes pass,
- feature gates remain closed,
- only listening/audio-approval/device P3 items remain.

This is the expected successful verdict.

### `VOICE_V2_1_POST_GENERATION_WHOLE_PROJECT_REMEDIATION_REQUIRED`

Use when:

- any software, manifest, audio, timing hard-max, readiness, or runtime gate fails.

### `CURRENT_SOURCE_REBASE_REQUIRED`

Use when:

- current dirty source cannot be reconciled safely.

---

# 15. Completion gates

## Physical audio

```text
verify:audio failures = 0
active V2.1 missing physical cue count = 0
generated asset decode failures = 0
generated asset stale fingerprints = 0
missing manifest paths = 0
static require failures = 0
unexpected audio changes during audit = 0
```

## Schema and lifecycle

```text
pending active cues = 0
active script mismatches = 0
retired default emissions = 0
conditional legacy default emissions = 0
microcheck-intro V2.1 emissions = 0
eyes-closed Balance V2 default emissions = 0
```

## Runtime

```text
legacy/V2.1 double voice = 0
missing asset silent continuation = 0
go dispatch starts = 0
go completion starts = 0
missing-go active starts = 0
stale callback mutations = 0
mixed voice required sequences = 0
two live channels = 0
training runtime failures = 0
micro runtime failures = 0
MPV2 runtime failures = 0
Balance V2 runtime failures = 0
side/protocol failures = 0
restore/persistence failures = 0
```

## Timing

```text
duration source stale = 0
hard max timing failures = 0
sequence redundancy = 0
```

Target timing failures may be P3 if under hard max.

## Failure injection

```text
failure injection failed = 0
```

## Readiness/defaults

```text
training behavior ready = true
training physical audio surface ready = true
training audio approval ready = false
training feature default = off
training selectable exercises = 0

micro behavior ready = true
micro physical audio surface ready = true
micro audio approval ready = false
micro feature default = off
micro selectable types = 0

Balance V2 physical audio surface ready = true
Balance V2 audio approval ready = false
Balance V2 default closed = true

human listening completed = false
physical device QA completed = false
speaker onset measured = false
```

---

# 16. Listening review package refresh

Refresh the listening review plan and queue.

The listening queue must include:

- every generated V2.1 asset,
- every high-priority shared cue,
- every critical stop/cue,
- every countdown/go cue,
- every MPV2/check-up cue,
- every Balance V2 stage cue,
- every Micro-Check cue,
- every Training first-use cue,
- longest cues,
- largest Clara/Marcus duration deltas,
- every target timing warning,
- every generated script-mismatch replacement.

The review plan must clearly say:

```text
This task prepares the queue only.
Human listening is not completed by this task.
No audio approval is granted.
```

Do not mark any cue approved.

---

# 17. Validation commands

Run at minimum:

```bash
npm run verify:audio
npx tsc --noEmit --pretty false
node scripts/audits/audit-voice-v21-asset-generation.mjs
node scripts/audits/audit-voice-v21-final-cue-schema.mjs
node scripts/audits/audit-voice-v21-post-generation-whole-project.mjs
```

Run current adjacent audits where present:

```bash
node scripts/audits/audit-micro-check-voice-v21.mjs
node scripts/audits/audit-training-voice-v21-controls-progress-recovery.mjs
node scripts/audits/audit-training-voice-v21-live-safety-integration.mjs
node scripts/audits/audit-training-floor-readiness.mjs
node scripts/audits/audit-eyes-open-balance-v2.mjs
node scripts/audits/audit-measurement-side-ux.mjs
```

If an older audit fails only because it compares generated audio against a stale Git HEAD baseline, document and supersede it using:

- current `verify:audio`,
- task-start/task-end audio hashes,
- generated asset inventory,
- and current physical manifest coverage.

Run focused Jest suites covering:

- audio manifests/static requires,
- verify-audio,
- generator targeted mode,
- final cue schema artifacts,
- asset generation artifacts,
- VoiceChannel/tracked playback,
- Training Voice V2.1,
- Micro-Check Voice V2.1,
- MPV2 runtime/audio,
- Eyes-Open Balance V2,
- floor readiness,
- step-up,
- both-sides,
- measurement side,
- restore/backend sync.

Run full Jest where practical.

Run:

```bash
git diff --check
```

At the end compare audio hashes and file lists, as described above.

---

# 18. Required artifacts

Create:

1. `docs/audits/HALE_VOICE_V2_1_POST_GENERATION_WHOLE_PROJECT_AUDIT.md`
2. `docs/audits/HALE_VOICE_V2_1_POST_GENERATION_WHOLE_PROJECT_AUDIT.json`
3. `docs/audits/HALE_VOICE_V2_1_POST_GENERATION_RUNTIME_SCENARIOS.csv`
4. `docs/audits/HALE_VOICE_V2_1_POST_GENERATION_TIMELINE_AUDIT.csv`
5. `docs/audits/HALE_VOICE_V2_1_POST_GENERATION_PHYSICAL_AUDIO_AUDIT.csv`
6. `docs/audits/HALE_VOICE_V2_1_POST_GENERATION_READINESS_MATRIX.csv`
7. `docs/audits/HALE_VOICE_V2_1_POST_GENERATION_FAILURE_INJECTION.csv`
8. `docs/audits/HALE_VOICE_V2_1_POST_GENERATION_LISTENING_REVIEW_PLAN.md`
9. `docs/audits/HALE_VOICE_V2_1_POST_GENERATION_LISTENING_QUEUE.csv`
10. `docs/audits/HALE_VOICE_PROJECT_POST_WHOLE_PROJECT_AUDIT_HANDOFF.md`

Add one audit-only harness:

```text
scripts/audits/audit-voice-v21-post-generation-whole-project.mjs
```

Do not overwrite generation/final-schema artifacts.

---

# 19. Report structure

Use:

# Hale Voice V2.1 Post-Generation Whole-Project Audit

## 1. Executive Verdict

## 2. Entry Baseline

## 3. Generated Audio Corpus Integrity

## 4. Final Schema and Manifest Coverage

## 5. Readiness and Feature Gates

## 6. Training Runtime Audit

## 7. Micro-Check Runtime Audit

## 8. MPV2 / Movement Check-Up Runtime Audit

## 9. Eyes-Open Balance V2 Audit

## 10. Side and Protocol Comparability Audit

## 11. Timing Audit With Measured Durations

## 12. Failure Injection Results

## 13. Legacy and V2.1 Isolation

## 14. Listening Review Plan

## 15. Tests and Validation

## 16. Findings

## 17. Remaining P3 Boundaries

## 18. Worktree Integrity

## 19. Exact Next Phase

---

# 20. Handoff

Create:

```text
docs/audits/HALE_VOICE_PROJECT_POST_WHOLE_PROJECT_AUDIT_HANDOFF.md
```

If successful, the exact next task is:

```text
Founder Clara/Marcus listening review
```

The handoff must include:

- verdict,
- physical audio readiness values,
- audio approval state,
- feature/default state,
- listening queue path,
- highest-priority listening rows,
- target timing warnings,
- duration outliers,
- all remaining P3 boundaries,
- instructions not to enable features before listening/device QA,
- final Android/iOS QA still required.

Later order:

1. Founder Clara/Marcus listening review
2. Listening remediation/generation patch if needed
3. Final consolidated Android/iOS physical-device QA
4. Activation-readiness decision
5. Only then consider enabling gated V2.1 paths

Do not perform listening or QA in this task.

---

# 21. Final Codex response

When finished, respond with:

- summary of audit,
- paths to all 10 generated artifacts,
- audit harness path,
- all files changed/added,
- confirmation that no audio changed,
- confirmation that no audio was generated,
- confirmation that no external speech/audio API was called,
- confirmation that listening and physical QA remain deferred,
- branch and commit,
- whether worktree was already dirty,
- entry `verify:audio` result,
- final `verify:audio` result,
- task-start/final audio file counts,
- task-start/final audio hash counts,
- audio hash diff count,
- total physical audio count,
- generated asset count,
- active V2.1 logical cue count,
- active V2.1 physical-ready count,
- missing active physical cue count,
- stale fingerprint count,
- manifest/static require failure counts,
- readiness values for Training, Micro, Balance V2, MPV2,
- feature defaults and selectable counts,
- key runtime failure metrics,
- timing row counts,
- target timing failure count,
- hard-max timing failure count,
- longest cue,
- longest sequence,
- largest Clara/Marcus duration delta,
- failure injection pass/fail counts,
- listening queue row count,
- P0/P1/P2/P3 counts,
- verdict,
- whether founder listening review is unblocked,
- exact next task,
- typecheck result,
- focused/full test results,
- adjacent audit results,
- audit recomputation result,
- concise confidence statement.

Do not enable features, mark audio approved, perform listening review, perform physical-device QA, or start activation work in this task.
