# Codex Prompt: Hale MPV2 Targeted Runtime Audit — Founder-Waived Listening Review

Read this entire prompt before starting.

Hale has completed the current-state and MPV2/V2.1 voice reconciliation work. A local human listening review was prepared, but the founder has explicitly chosen **not to perform it at this stage** and wants to proceed with the targeted runtime audit under the assumption that the current audio files are acceptable.

This is a deliberate review waiver, not evidence that anyone listened to the files.

Do not fabricate a listening-review export. Do not mark any asset as human-verified. Instead, record the following audit assumption exactly:

```text
Founder listening decision: waived for this stage.
Runtime-audit assumption: every current MPV2 Clara and Marcus asset is assumed to contain its source-expected wording, be intelligible, and have acceptable pronunciation, tone, level, and technical quality.
Verification status: assumed-pass-by-founder, not human-verified.
Residual risk: audible wording or quality defects may still be discovered later during device QA or beta use.
```

The runtime audit must proceed using:

- current source text,
- current manifests,
- actual measured MP3 durations,
- current controller behaviour,
- current cue priorities,
- current worktree state,
- and the prepared event/scenario handoff.

The listening waiver must not weaken the runtime, timing, state-machine, failure-path, or safety analysis.

---

# 1. Existing inputs

Use these artifacts:

## Canonical MPV2 runtime handoff

- `docs/audits/HALE_MPV2_TARGETED_RUNTIME_AUDIT_INPUT.json`
- `docs/audits/HALE_MPV2_TARGETED_RUNTIME_AUDIT_SCOPE.md`
- `docs/audits/HALE_MPV2_VOICE_CANONICAL_MAP.csv`
- `docs/audits/HALE_MPV2_VOICE_ASSET_QC.csv`

## MPV2/V2.1 reconciliation

- `docs/audits/HALE_MPV2_V21_VOICE_RECONCILIATION.md`
- `docs/audits/HALE_MPV2_V21_VOICE_RECONCILIATION.json`
- `docs/audits/HALE_MPV2_VOICE_LISTENING_REVIEW_GUIDE.md`
- `docs/audits/HALE_MPV2_VOICE_LISTENING_REVIEW.html`
- `scripts/audits/reconcile-mpv2-v21-voice.mjs`

## Broader current-state baseline

- `docs/audits/HALE_VOICE_CURRENT_STATE_RECONCILIATION.md`
- `docs/audits/HALE_VOICE_CURRENT_STATE_RECONCILIATION.json`
- `docs/audits/HALE_VOICE_CURRENT_ASSET_INVENTORY.csv`
- `docs/audits/HALE_VOICE_CHANGE_LEDGER.csv`

## Approved future design

- `docs/specs/HALE_VOICE_EXPERIENCE_SPEC_V2_1.md`
- `docs/specs/HALE_VOICE_EXPERIENCE_SPEC_V2_1.json`
- `docs/specs/HALE_VOICE_APPROVED_DECISIONS_V2_1.md`

## Earlier runtime baseline

- `docs/audits/HALE_VOICE_RUNTIME_TIMELINE_AUDIT.md`
- `docs/audits/HALE_VOICE_RUNTIME_TIMELINE_AUDIT.json`
- `docs/audits/HALE_VOICE_ASSET_DURATIONS.csv`

The prepared handoff currently describes:

- the `movement_profile_v2_checkup` flow,
- 29 event-graph entries,
- 42 required scenario ids,
- 28 currently runtime-reachable MPV2 cue keys,
- priorities in the current MPV2 50–100 range,
- actual Clara and Marcus asset durations,
- current fail-closed asset resolution followed by player-level catch/skip behaviour,
- an internal chair countdown with no spoken `three`, `two`, `one`, or `go`,
- current eyes-open single-leg balance attempts rather than the full proposed V2.1 balance ladder.

Independently verify these facts against the live repository before relying on them.

---

# 2. Objective

Perform the targeted runtime timing, collision, cancellation, and state-consistency audit for the **current MPV2 check-up path only**.

The audit must determine:

1. What a user would hear in every current MPV2 branch.
2. Whether every cue is emitted once, at the right state, and at a usable time.
3. Whether React effects, timers, user actions, coordinator transitions, and audio playback can race.
4. Whether incoming cues are played, dropped, interrupted, skipped, duplicated, or left stale.
5. Whether state progression waits for essential speech where required.
6. Whether measurement begins before the user receives an audible start signal.
7. Whether the current internal chair countdown is acceptable or requires remediation.
8. Whether priority 50–100 behaviour produces deterministic or latency-sensitive failures.
9. Whether required-cue “fail closed” behaviour actually fails closed end-to-end.
10. Whether missing assets or playback errors create silent progression.
11. Whether cues continue after navigation, cancellation, backgrounding, retry, recovery, or meaningful state exit.
12. Whether rapid user input can skip essential guidance or create stale narration.
13. Whether Clara and Marcus duration differences alter state or cue outcomes.
14. Whether left/right shoulder instructions match controller state and grader side.
15. Whether balance attempt, rest, retry, use-best, and completion narration remains coherent.
16. Whether hinge valid/no-measurement branches speak coherent completion.
17. Whether the current recovery screen is voice-complete.
18. Whether the three bundled-but-not-emitted shared cues should affect the runtime verdict.
19. Whether current MPV2 is safe to move into an integrated device preview.
20. The exact smallest remediation sequence if it is not ready.

This is an audit-only task. Do not implement fixes.

---

# 3. Founder listening waiver

Create an explicit waiver record inside every main output.

Use:

```json
{
  "listeningReview": {
    "status": "waived_assumed_pass_by_founder",
    "humanVerified": false,
    "assumedForThisAudit": [
      "binary wording matches current source expectation",
      "speech is intelligible",
      "pronunciation is acceptable",
      "tone is acceptable",
      "level and technical quality are acceptable"
    ],
    "notEstablished": [
      "actual wording was listened to",
      "actual pronunciation was reviewed",
      "actual tone was approved",
      "phone-speaker quality was checked",
      "Clara and Marcus semantic parity was heard"
    ],
    "residualRisk": "Audible content or quality defects may still be found later."
  }
}
```

## Rules

- Do not create a fake listening-review JSON export.
- Do not change `pending` statuses in existing source artifacts.
- Apply the waiver as an audit overlay only.
- Use actual source scripts as expected audible content.
- Use actual MP3 durations and technical metadata.
- Treat the 15 technical QC outlier rows as accepted for this audit unless they create a measurable runtime/timing risk.
- Do not recommend regeneration solely because the listening review was skipped.
- Still report missing, corrupt, or structurally inconsistent assets if newly discovered.
- Runtime readiness and audio-quality approval remain separate concepts.

---

# 4. Strict scope

## Do not

- Change production TypeScript or React Native code
- Change MPV2 state machines
- Change timers
- Change cue priorities
- Change `VoiceChannel`
- Change manifests
- Change cue scripts
- Change generation scripts
- Change tests
- Generate or regenerate audio
- Rename, move, delete, or edit audio assets
- Call ElevenLabs
- Call any external API
- Install dependencies
- Change `package.json` or `package-lock.json`
- Implement audible `go`
- Implement tracking-loss/recovery narration
- Implement retry narration
- Implement V2.1 balance ladder
- Implement side persistence
- Modify existing audit/spec artifacts
- Commit, stash, reset, checkout, or clean the dirty worktree
- Mark listening as completed or verified

## You may

- Add the requested audit artifacts
- Add an audit-only runtime model/harness under `scripts/audits/`
- Add audit-only tests under `scripts/audits/` or a clearly non-production audit location
- Reuse pure production functions where practical
- Use fake clocks and deterministic schedulers
- Inspect production source and existing tests
- Hash/probe assets non-destructively
- Run current test suites and static checks
- Use temporary local files and remove them before finishing

All pre-existing production, test, manifest, and audio files must remain untouched.

---

# 5. Required deliverables

Create these six artifacts:

1. `docs/audits/HALE_MPV2_TARGETED_RUNTIME_AUDIT.md`
2. `docs/audits/HALE_MPV2_TARGETED_RUNTIME_AUDIT.json`
3. `docs/audits/HALE_MPV2_RUNTIME_TIMELINES.csv`
4. `docs/audits/HALE_MPV2_RUNTIME_FINDINGS.csv`
5. `docs/audits/HALE_MPV2_RUNTIME_REMEDIATION_PLAN.md`
6. `docs/audits/HALE_MPV2_LISTENING_REVIEW_WAIVER.md`

You may add one reproducible audit-only generator/harness, for example:

- `scripts/audits/audit-mpv2-runtime.mjs`
- or `scripts/audits/audit-mpv2-runtime.ts`

Do not overwrite the prepared runtime input or scope.

---

# 6. Live repository snapshot and input drift

At the beginning record:

- UTC timestamp
- branch
- full and short `HEAD`
- upstream
- `git status --short`
- relevant staged, unstaged, and untracked files
- Node/npm versions
- `expo-audio` version

Compare the live repository with the prepared input:

- source files,
- cue keys,
- priorities,
- scripts,
- physical paths,
- SHA-256 hashes,
- durations,
- event graph,
- scenario ids.

Classify the handoff as:

- `current_exact`
- `minor_nonsemantic_drift`
- `material_runtime_drift`
- `cannot_validate`

If material runtime drift exists:

- do not blindly audit stale assumptions,
- rebuild the affected runtime model from current source inside the new audit artifacts,
- identify every difference,
- issue `INPUT_REBASE_REQUIRED` if the drift prevents reliable completion.

Do not modify the original input file.

---

# 7. Source files to inspect

At minimum inspect current versions of:

- `src/audio/voicePlayer.ts`
- `src/audio/cues.ts`
- `src/audio/manifest.ts`
- `src/audio/movementProfileV2Audio.ts`
- `src/audio/movementProfileV2AudioManifest.ts`
- `src/audio/__tests__/voicePlayer.test.ts`
- `src/audio/__tests__/movementProfileV2Audio.test.ts`
- `src/movementProfileV2/voiceCues.ts`
- `src/movementProfileV2/liveCoordinator.ts`
- `src/movementProfileV2/recovery.ts`
- `src/movementProfileV2/liveDiagnostics.ts`
- `src/movementProfileV2/__tests__/voiceCues.test.ts`
- `src/movementProfileV2/__tests__/liveCoordinator.test.ts`
- `src/movementProfileV2/__tests__/recovery.test.ts`
- `src/screens/MovementProfileV2CheckUpScreen.tsx`
- `src/screens/MovementProfileV2RecoveryScreen.tsx`
- `src/checkup/movementProfileV2.ts`
- `src/checkup/protocolEvidence.ts`
- current shoulder, chair, balance, and hinge graders used by MPV2
- relevant AppState/background/audio configuration
- all source files referenced by the runtime handoff

Follow imports and call graphs. Do not rely only on text search.

---

# 8. Establish the exact current runtime model

Document precisely:

## VoiceChannel

- one-sequence-at-a-time behaviour,
- busy state,
- pending cue storage,
- current priority,
- lower-priority incoming request,
- equal-priority incoming request,
- higher-priority incoming request,
- interruption path,
- `stop()` behaviour,
- player release,
- status listeners,
- stale completion guards,
- playback creation failures,
- playback start failures,
- missing asset resolution,
- catch/continue behaviour,
- completion callback behaviour,
- selected voice lifecycle,
- SFX interaction,
- AppState/audio mode behaviour.

## MPV2 sequencer

- how transition keys are produced,
- once-per-transition deduplication,
- how initial speech differs from transition speech,
- where priority is selected,
- whether sequences contain mixed-priority cues,
- whether the highest priority or one event priority is used,
- whether requiredness affects controller state,
- whether cue completion is observed by the controller,
- whether missing speech blocks or merely logs/skips.

## Screen/controller timing

- mount effects,
- state effects,
- timers,
- user button actions,
- pose/grader callbacks,
- coordinator actions,
- internal countdown,
- active measurement start,
- active measurement end,
- recovery transitions,
- unmount,
- cancel,
- app background,
- foreground/resume,
- voice selection changes.

## Clocks

For every event identify whether it is driven by:

- `Date.now()`,
- `performance.now()`,
- React Native timer,
- frame timestamp,
- media callback,
- user action,
- reducer/coordinator transition,
- effect execution.

State whether different clocks can drift or race.

---

# 9. Deterministic audit harness

Build a reproducible audit-only model.

Prefer to reuse actual pure production functions for:

- coordinator transitions,
- cue selection,
- priorities,
- transition keys,
- recovery decisions.

Use:

- a fake monotonic clock,
- controlled React/timer event scheduling where practical,
- actual measured Clara/Marcus MP3 durations,
- a faithful model of the current `VoiceChannel` policy,
- explicit state-exit and cancellation events,
- actual current cue sequences.

Do not instantiate native `expo-audio`.

If production logic cannot be reused directly:

- model it explicitly,
- cite the source that establishes each rule,
- identify the approximation.

## Required latency sensitivities

Run each timing-sensitive scenario under:

1. `L0`
   - playback startup delay: 0 ms
   - completion callback delay: 0 ms

2. `L100`
   - playback startup delay: 100 ms per asset
   - completion callback delay: 100 ms per asset

3. `L250`
   - playback startup delay: 250 ms per asset
   - completion callback delay: 250 ms per asset

Also model:

- user action immediately when enabled,
- user action 250 ms after enabled,
- user action after current speech finishes,

where the scenario involves user input.

These are modelling assumptions, not device measurements.

---

# 10. Timeline terminology

Use consistently:

- `scenarioId`
- `variantId`
- `voiceId`
- `latencyProfile`
- `eventId`
- `controllerStateBefore`
- `controllerStateAfter`
- `eventScheduledAtMs`
- `speakCalledAtMs`
- `assetResolutionAtMs`
- `playbackRequestedAtMs`
- `audibleStartEstimatedAtMs`
- `assetDurationMs`
- `sequenceDurationMs`
- `playbackEndEstimatedAtMs`
- `completionCallbackAtMs`
- `measurementStartsAtMs`
- `measurementEndsAtMs`
- `stateExitAtMs`
- `voiceBusyBefore`
- `incomingPriority`
- `currentPriority`
- `outcome`
- `timingMarginMs`
- `staleAfterStateExit`
- `userImpact`
- `confidence`

## Allowed `outcome` values

- `played_fully`
- `played_partially_then_interrupted`
- `dropped_lower_priority`
- `dropped_equal_priority`
- `skipped_missing_asset`
- `skipped_resolution_error`
- `skipped_playback_creation_error`
- `skipped_playback_start_error`
- `cancelled_on_stop`
- `continued_stale_after_state_exit`
- `deduplicated`
- `not_emitted`
- `not_applicable`
- `statically_indeterminate`

---

# 11. Required scenario coverage

Run every scenario in `HALE_MPV2_TARGETED_RUNTIME_AUDIT_SCOPE.md`.

There must be 42 canonical scenario ids, reconciled against current source.

## Normal scenarios

- `full_normal_mpv2_checkup_clara`
- `full_normal_mpv2_checkup_marcus`
- `chair_practice_to_official_attempt`
- `balance_valid_attempt_rest_next_attempt`
- `balance_invalid_tracking_retry`
- `balance_full_hold_ceiling`
- `balance_use_best`
- `balance_default_ready_after_60`
- `shoulder_left`
- `shoulder_right`
- `hinge_valid_result`
- `completion`

## Timing/collision scenarios

- `initial_effect_speech_versus_first_user_action`
- `timer_event_while_prior_cue_playing`
- `equal_priority_event_while_busy`
- `higher_priority_event_while_busy`
- `required_cue_missing`
- `required_asset_resolution_throws`
- `playback_creation_fails`
- `playback_start_callback_fails`
- `cue_completes_after_state_exit`
- `rapid_user_action_during_speech`
- `recovery_event_during_speech`
- `repeated_tracking_loss_event`
- `tracking_recovery_before_loss_cue_finishes`
- `countdown_versus_operational_cue`
- `go_audible_onset_timing`
- `times_up_during_another_cue`
- `result_completion_transition_while_prior_cue_busy`

## User-control scenarios

- `retry_during_intro`
- `retry_during_chair_practice`
- `retry_during_official_attempt`
- `retry_during_balance_rest`
- `recovery_screen_retry`
- `navigation_unmount_during_speech`
- `app_background_foreground`
- `voice_change_while_screen_mounted_channel_exists`

## Policy scenarios

- `priority_50_100_mapping`
- `fail_closed_required_cue_behavior`
- `droppable_setup_reassurance_cues`
- `no_stale_mpv2_operational_cue_after_state_change`
- `clara_marcus_duration_differences_do_not_alter_state_outcome`

If current source makes a prepared scenario obsolete:

- retain its id,
- classify it `obsolete_due_to_current_source`,
- explain the replacement scenario,
- add the replacement without reducing coverage.

---

# 12. Scenario expansion rules

For every timing-sensitive canonical scenario, model:

- Clara L0/L100/L250
- Marcus L0/L100/L250

For user-action scenarios, also model the relevant action timing variants.

The final variant count will therefore be greater than 42.

Do not report only one voice where voice duration can affect the result.

## Full normal path

The full normal Clara and Marcus paths must show, in order:

1. Mount
2. Initial intro sequence
3. Chair setup confirmation
4. Practice start
5. Practice completion
6. Official-ready transition
7. Internal countdown
8. Chair active start
9. Chair times-up
10. Chair result/next transition
11. Balance intro/setup
12. Balance attempt start
13. Valid attempt
14. Saved/rest
15. Next-attempt or use-best branch
16. Balance completion
17. Shoulder selected-side turn cue
18. Shoulder selected-side raise cue
19. Shoulder completion
20. Hinge setup
21. Valid hinge completion
22. Check-up completion
23. Navigation/state exit

If actual current flow differs, document the exact current order.

---

# 13. Critical runtime questions

Answer every question explicitly.

## Initial intro and first user action

1. Is the initial intro emitted in one `speak()` call?
2. Which cue durations make up the sequence?
3. Can chair setup be confirmed while the intro is still playing?
4. If so, what happens to `mpv2_chair_practice_start`?
5. Is it dropped, queued, interrupted, or played later?
6. Does the UI enable the action before essential speech finishes?
7. Can the user enter practice without hearing the chair setup instruction?

## Chair practice and official countdown

8. When practice completion occurs, when is `mpv2_chair_official_ready` submitted?
9. Does the internal 3000 ms countdown begin before, with, or after that cue?
10. How long is the cue for Clara and Marcus?
11. Under L0/L100/L250, is it still playing when chair measurement starts?
12. Does the user hear an explicit start moment?
13. Is there any spoken `three`, `two`, `one`, or `go`?
14. Can the first chair movement happen before any audible start cue?
15. Does this violate the approved audible-start contract?
16. Is the current flow usable eyes-off?
17. Does retry restart speech and the countdown coherently?

## Chair active and times-up

18. At 30 seconds, what cue is spoken?
19. What priority does it use?
20. Can it be dropped or delayed by another cue?
21. Does measurement stop independently of its playback?
22. Can result/transition narration begin while `times-up-v21` is still playing?
23. Can the result screen appear before the user hears the stop cue?

## Balance

24. What exact protocol is currently active?
25. How many attempts can occur?
26. Which cues fire at attempt start, save, rest, 30 seconds, 60 seconds, full hold, use best, retry, and complete?
27. Can a rest timer expire while rest narration is still playing?
28. Can a user choose use-best while another cue is playing?
29. Can `mpv2_balance_attempt_start` be emitted from more than one transition and collide with itself?
30. Does transition-key deduplication prevent duplicate speech without suppressing a valid new attempt?
31. Can a tracking retry cue be stale by the time it finishes?
32. Does the current flow speak enough information to recover without looking?
33. Does current MPV2 single-leg balance conflict with the future V2.1 staged ladder?
34. Is that a runtime blocker, a spec-rebase issue, or a deliberate current-protocol divergence?

## Shoulder

35. Does selected side determine both turn and raise cue?
36. Does the grader evaluate the same side?
37. Can retry/recovery change side silently?
38. Can left/right cue sequences be dropped because of prior item completion speech?
39. Does the user begin moving before setup speech ends?
40. Does `mpv2_shoulder_tracking_retry` fit before state progression?

## Hinge

41. What exact cues play for valid result?
42. What exact cues play for no measurement?
43. Can `mpv2_hinge_complete` or `mpv2_hinge_no_measurement` collide with `checkup-complete-v21`?
44. Are both sent as one sequence or separate requests?
45. Can navigation occur before completion narration finishes?
46. Is “no measurement” handled as a calm recoverable result or as silent loss?

## Tracking and recovery

47. Are `tracking-loss-v21`, `tracking-recovered-v21`, and `retry-v21` currently emitted anywhere in MPV2?
48. If not, what does the user hear during corresponding branches?
49. Does active tracking loss stop measurement?
50. Does recovery restart a fresh timing window?
51. Can repeated tracking-loss events spam or collide?
52. Is recovery screen retry silent?
53. Does current behaviour satisfy voice-first recovery?

## Required cue failure

54. What does `required_fail_closed` mean at resolver level?
55. What does `VoiceChannel` do after the resolver throws?
56. Does it skip and continue?
57. Does controller progression continue?
58. Can a required instruction fail silently while measurement still starts?
59. Is this truly fail-closed end to end?
60. Which required cues can produce the highest user/safety impact if absent?

## State exit

61. Does unmount call `voice.stop()`?
62. Does backgrounding call `voice.stop()`?
63. Can a status callback from a released player affect the new state?
64. Can queued cues survive a state change without unmount?
65. Can an old operational cue be audible in the next stage?
66. Does foregrounding replay essential context?
67. Does voice change rebuild the mounted `VoiceChannel`?

## Priority policy

68. List every current MPV2 priority.
69. Verify equal-priority behaviour.
70. Verify higher-priority interruption.
71. Verify whether setup/reassurance priorities are actually droppable.
72. Identify all deterministic drops.
73. Identify all deterministic interruptions.
74. Identify all latency-dependent collisions.
75. Determine whether priority classes match the semantic importance of each cue.

---

# 14. Required-cue failure injection

The audit harness must explicitly inject failure for:

- missing Clara asset,
- missing Marcus asset,
- manifest lookup throw,
- player creation throw,
- playback start throw/rejection,
- no playback completion callback,
- late completion callback after stop,
- failure of first cue in a multi-cue sequence,
- failure of middle cue,
- failure of final cue.

For each determine:

- what the user hears,
- whether pending cues continue,
- whether busy state clears,
- whether controller progresses,
- whether measurement starts,
- whether visible fallback exists,
- whether retry is possible,
- whether current tests cover it.

Do not alter physical files to simulate missing assets. Use an audit model or mocks.

---

# 15. Runtime verdict criteria

Issue exactly one primary verdict.

## `RUNTIME_READY_FOR_INTEGRATED_PREVIEW`

Use only if:

- no P0 or P1 runtime issue,
- essential instructions are not deterministically dropped,
- measurement windows have clear usable start/stop signalling,
- required-cue failures cannot silently continue into measurement,
- no stale cue survives meaningful state exit,
- retries and recovery remain understandable,
- Clara/Marcus durations do not change state outcomes.

## `RUNTIME_READY_WITH_NONBLOCKING_ISSUES`

Use if:

- only P2/P3 issues remain,
- no measurement validity or user-safety issue,
- integrated preview can safely expose the remaining issues for device QA.

## `RUNTIME_REMEDIATION_REQUIRED_BEFORE_PREVIEW`

Use if any of these occur:

- missing audible start for timed measurement,
- essential cue deterministically dropped,
- required cue failure allows silent measurement,
- stale cue crosses into a new stage,
- retry/recovery loses essential context,
- priority/timer race materially changes the user instruction,
- Clara/Marcus produce different state outcomes,
- current flow violates an approved protocol contract in a way that affects measurement validity.

## `INPUT_REBASE_REQUIRED`

Use if live source materially differs from the prepared input and cannot be reliably rebuilt in this task.

## `CURRENT_SOURCE_REPAIR_REQUIRED`

Use if source, manifest, assets, or tests are structurally inconsistent.

Secondary flags may include:

- `ADD_AUDIBLE_COUNTDOWN_GO`
- `BLOCK_USER_ACTION_UNTIL_INSTRUCTION_COMPLETE`
- `MAKE_REQUIRED_CUES_CONTROLLER_BLOCKING`
- `ADD_TRACKING_RECOVERY_VOICE`
- `ADD_RETRY_VOICE`
- `CANCEL_STALE_STAGE_SPEECH`
- `REBUILD_CHANNEL_ON_VOICE_CHANGE`
- `REBASE_V21_CHECKUP_SPEC`
- `DEVICE_LATENCY_QA_REQUIRED`
- `LISTENING_REVIEW_WAIVED`

---

# 16. Finding classification

For every finding assign:

## Severity

- `P0`: credible safety issue or invalid measurement likely in normal use
- `P1`: deterministic loss of essential instruction, invalid timing window, silent required-cue failure, or stale cross-stage speech
- `P2`: recoverability, usability, timing friction, voice-first gap, or likely latency-dependent collision
- `P3`: low-impact polish or test/documentation gap

## Confidence

- `confirmed_source`
- `confirmed_deterministic_model`
- `confirmed_existing_test`
- `likely`
- `possible`
- `device_only`
- `uncertain`

## Type

- `timing`
- `drop`
- `interrupt`
- `stale_speech`
- `missing_start_signal`
- `failure_handling`
- `state_progression`
- `retry_recovery`
- `voice_parity`
- `side_consistency`
- `protocol_divergence`
- `test_gap`
- `device_only`
- `documentation`

For each include:

- finding id,
- affected scenarios,
- affected cue keys,
- affected voice(s),
- source evidence,
- exact timeline evidence,
- user consequence,
- current test coverage,
- recommended remediation category,
- whether it blocks preview.

---

# 17. Runtime timeline CSV

Use columns similar to:

```text
scenarioId,variantId,voiceId,latencyProfile,eventIndex,eventId,controllerStateBefore,controllerStateAfter,eventScheduledAtMs,speakCalledAtMs,cueKeys,incomingPriority,voiceBusyBefore,currentPriority,audibleStartEstimatedAtMs,assetDurationMs,sequenceDurationMs,playbackEndEstimatedAtMs,completionCallbackAtMs,measurementStartsAtMs,measurementEndsAtMs,stateExitAtMs,outcome,timingMarginMs,staleAfterStateExit,userImpact,confidence,notes
```

One row per significant event/cue outcome.

All timeline timestamps must be relative to scenario start.

---

# 18. Runtime findings CSV

Use columns similar to:

```text
findingId,severity,type,title,affectedScenarioIds,affectedCueKeys,affectedVoices,deterministic,latencyProfiles,userConsequence,sourceEvidence,timelineEvidence,currentTestCoverage,recommendedRemediation,blocksPreview,confidence,notes
```

---

# 19. Remediation plan

Create:

- `docs/audits/HALE_MPV2_RUNTIME_REMEDIATION_PLAN.md`

Do not implement it.

Order fixes by dependency and risk.

At minimum evaluate these likely phases:

1. **Audible measurement start**
   - Spoken countdown and `go`
   - Align active timing to audible onset
   - Retry/recovery use fresh countdown

2. **Essential-speech gating**
   - Prevent user action or timer progression from bypassing required instructions
   - Define which cues block progression

3. **Required-cue failure semantics**
   - Make fail-closed truly fail closed
   - Visible fallback and retry
   - No silent measurement start

4. **Stage-scoped cancellation**
   - Cancel stale speech on meaningful state transitions
   - Guard completion callbacks

5. **Tracking/retry/recovery voice**
   - Wire currently bundled cues if appropriate
   - Recovery screen narration
   - Fresh context after foreground/resume

6. **Priority policy**
   - Verify or revise 50–100 mapping
   - Prevent equal-priority loss of distinct essential transitions

7. **Protocol/spec reconciliation**
   - Current single-leg balance attempts versus future staged V2.1 protocol
   - Do not conflate runtime fix with later protocol migration

8. **Tests**
   - Fake-clock controller tests
   - VoiceChannel failure tests
   - Full-flow timeline regression tests

9. **Physical-device QA**
   - Android and iOS start latency
   - actual audible onset,
   - callback timing,
   - background/foreground,
   - Bluetooth,
   - silent switch,
   - voice switching.

For every phase include:

- purpose,
- affected files,
- risk,
- tests,
- feature flag,
- rollback,
- completion gate.

---

# 20. Device-only QA plan

Static modelling cannot establish actual native playback onset.

Provide exact future device tests for:

- Clara and Marcus,
- Android physical device,
- iOS physical device,
- phone speaker,
- Bluetooth,
- silent mode,
- rapid button action,
- background/foreground,
- tracking loss,
- missing-asset debug injection,
- voice change,
- full check-up recording.

For audible start, specify how to measure:

- UI/controller timestamp,
- playback request timestamp,
- audible waveform onset,
- first accepted movement timestamp.

Do not claim the current audit measures native onset.

---

# 21. Required Markdown structure

Use exactly:

# Hale MPV2 Targeted Runtime Audit

## 1. Executive Verdict

Include:

- primary verdict,
- secondary flags,
- founder listening status,
- input freshness,
- current branch/commit,
- canonical scenarios,
- total simulated variants,
- total timeline rows,
- deterministic drops,
- deterministic interruptions,
- stale-speech cases,
- missing-start-signal cases,
- required-cue silent-continuation cases,
- Clara/Marcus outcome differences,
- P0/P1/P2/P3 counts,
- preview safe: yes/no,
- exact next action.

## 2. Listening Review Waiver

## 3. Scope and Method

## 4. Live Repository and Input Freshness

## 5. Current MPV2 Runtime Architecture

## 6. Timing and VoiceChannel Model

## 7. Full Normal Clara Timeline

## 8. Full Normal Marcus Timeline

## 9. Chair Practice, Countdown, Active Window, and Result

## 10. Balance Attempt and Rest Branches

## 11. Shoulder Left/Right Consistency

## 12. Hinge and Completion Branches

## 13. User Actions, Retry, Recovery, and Navigation

## 14. Priority, Drop, and Interruption Matrix

## 15. Required-Cue and Playback-Failure Injection

## 16. State Exit and Stale-Speech Analysis

## 17. Clara/Marcus Outcome Parity

## 18. V2.1 Runtime and Protocol Impact

## 19. Prioritised Findings

## 20. Preview Readiness Decision

## 21. Remediation Sequence

## 22. Physical-Device QA Plan

## 23. Validation, Limitations, and Source Index

---

# 22. Required JSON structure

Use a top-level structure similar to:

```json
{
  "auditVersion": 1,
  "generatedAt": "...",
  "status": "complete_with_listening_waiver",
  "listeningReview": {
    "status": "waived_assumed_pass_by_founder",
    "humanVerified": false,
    "assumedForThisAudit": [],
    "notEstablished": [],
    "residualRisk": "..."
  },
  "repositorySnapshot": {},
  "inputFreshness": {},
  "verdict": {
    "primary": "RUNTIME_REMEDIATION_REQUIRED_BEFORE_PREVIEW",
    "secondaryFlags": [],
    "integratedPreviewSafe": false,
    "nextAction": "..."
  },
  "summary": {},
  "runtimeModel": {},
  "assets": [],
  "events": [],
  "scenarios": [
    {
      "scenarioId": "...",
      "category": "...",
      "variants": []
    }
  ],
  "priorityMatrix": [],
  "failureInjectionResults": [],
  "voiceParity": {},
  "sideConsistency": {},
  "protocolImpact": {},
  "findings": [],
  "remediationPlan": [],
  "deviceQaPlan": [],
  "validation": {},
  "limitations": []
}
```

Keep JSON valid and comment-free.

---

# 23. Listening waiver document

Create:

- `docs/audits/HALE_MPV2_LISTENING_REVIEW_WAIVER.md`

Use:

# Hale MPV2 Listening Review Waiver

## Decision

State that the founder elected to proceed without completing the prepared 34-row/68-asset listening review.

## Assumptions Used

## What This Does Not Prove

## Risks Accepted

## Effect on Runtime Audit

## Effect on Audio Generation

State that this waiver does not by itself authorize additional audio generation.

## Effect on Device QA

State that later listening on real devices remains required before broad beta release.

Do not write that the audio was approved.

---

# 24. Validation requirements

Before finishing:

1. Parse `HALE_MPV2_TARGETED_RUNTIME_AUDIT_INPUT.json`.
2. Parse `HALE_MPV2_V21_VOICE_RECONCILIATION.json`.
3. Parse `HALE_VOICE_EXPERIENCE_SPEC_V2_1.json`.
4. Parse the canonical cue CSV.
5. Parse the asset QC CSV.
6. Verify live source drift against the prepared input.
7. Verify all current MPV2 runtime cue references resolve.
8. Verify all physical Clara/Marcus assets used in scenarios exist.
9. Verify actual durations and hashes.
10. Verify 42 canonical scenario ids are represented.
11. Verify all timing-sensitive scenarios include both voices.
12. Verify L0/L100/L250 variants.
13. Verify user-action timing variants where required.
14. Verify all current priorities.
15. Verify lower/equal/higher busy-channel outcomes.
16. Verify internal countdown timing.
17. Verify chair active-start timing.
18. Verify times-up timing.
19. Verify all balance branches.
20. Verify shoulder left/right consistency.
21. Verify hinge valid and no-measurement branches.
22. Verify retry and recovery-screen behaviour.
23. Verify unmount/background/foreground.
24. Verify voice-change lifecycle.
25. Verify all failure-injection cases.
26. Verify every finding references a timeline or source.
27. Verify every P0/P1 finding blocks preview.
28. Verify Clara/Marcus outcome comparison.
29. Verify the waiver is present in Markdown and JSON.
30. Verify no fake listening export was created.
31. Verify all generated JSON and CSV files parse.
32. Verify Markdown/JSON/CSV counts agree.
33. Run `npm run verify:audio`.
34. Run focused MPV2/voice Jest suites.
35. Run `npx tsc --noEmit`.
36. Run any audit-only tests.
37. Inspect `git status --short --branch`.
38. Inspect `git diff --stat`.
39. Confirm only requested audit artifacts and audit-only tooling were added.
40. Confirm no production, test, manifest, generation-source, or audio file changed.
41. Confirm no audio was generated.
42. Confirm no external API was called.
43. Remove temporary files.

Do not modify tests to make validation pass.

---

# 25. Final Codex response

When finished, respond with:

- Paths to all six generated artifacts
- Any audit-only harness/script added
- Confirmation that no production code changed
- Confirmation that no tests changed
- Confirmation that no manifest or generation source changed
- Confirmation that no audio changed or was generated
- Confirmation that no fake listening review was created
- Founder listening status
- Current branch and commit
- Input freshness classification
- Canonical scenario count
- Total simulated variant count
- Timeline row count
- Deterministic drop count
- Deterministic interruption count
- Stale-speech count
- Missing audible-start count
- Required-cue silent-continuation count
- Clara/Marcus outcome-difference count
- P0/P1/P2/P3 counts
- Primary verdict
- Secondary flags
- Whether integrated runtime preview is safe
- The five most important findings
- Exact next remediation task
- Device-only questions remaining
- Tests and validation commands run
- A concise confidence statement

Do not implement fixes, change production behaviour, or generate audio in this task.
