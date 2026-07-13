# Codex Prompt: Pearl Voice Runtime Timeline, Accuracy, and Collision Audit

Read this entire prompt before making any changes.

We have already completed a static inventory of Pearl’s voice cues:

- `docs/audits/PEARL_VOICE_CUE_INVENTORY.md`
- `docs/audits/PEARL_VOICE_CUE_INVENTORY.json`

Those files identified 110 spoken cue templates and confirmed that Pearl uses bundled MP3 files at runtime through `VoiceChannel` in `src/audio/voicePlayer.ts`, rather than runtime TTS.

The inventory is the starting point for this task, not a substitute for inspecting the current production code. Independently verify every important claim against the repository.

## Objective

Perform a second-stage, evidence-backed audit that reconstructs what a real Pearl user would actually hear during:

1. Every reachable training exercise and progression level
2. The default Movement Check-Up
3. Conditional or beta check-up protocols that remain in the repository
4. All three micro check-up types
5. Setup, framing, orientation, countdown, pause, retry, skip, tracking-loss, recovery, transition, rest, completion, and cancellation paths

The purpose is to determine:

- The exact runtime order of spoken cues
- The actual duration of every bundled voice asset
- Whether cues finish before the next state transition
- Whether cues are dropped, interrupted, cancelled, duplicated, or spoken too late
- Whether the spoken instruction accurately describes the exact exercise level or assessment being performed
- How much safety narration the user hears in a real session
- Whether Pearl is genuinely usable as a voice-first, eyes-off-screen experience
- Which cues should eventually be kept, rewritten, split, merged, removed, added, or retimed

This is still an audit and design-analysis task.

## Strict scope

Do not:

- Change production behaviour
- Rewrite production cue text
- Regenerate any ElevenLabs audio
- Call ElevenLabs or any external speech API
- Replace bundled audio with runtime TTS
- Change exercise programming, scoring, assessment protocols, progression logic, safety eligibility, or generated plans
- Change audio priorities, timers, queueing, or cancellation behaviour
- Add new runtime voice cues
- Remove runtime voice cues
- Modify app UI
- Update snapshots or test expectations merely to make tests pass
- Add an npm dependency unless it is absolutely unavoidable
- Change `package-lock.json` for this audit

You may:

- Add audit reports
- Add a machine-readable audit artifact
- Add a small audit-only script under `scripts/audits/` if it materially improves reproducibility
- Add audit-only tests or harnesses that do not alter production behaviour
- Use temporary local scripts and remove them before finishing
- Use existing system tools such as `ffprobe`, `ffmpeg`, or equivalent local metadata readers if available

If you add any audit tooling, clearly separate it from production code and report it in the final response.

## Required deliverables

Create:

1. `docs/audits/PEARL_VOICE_RUNTIME_TIMELINE_AUDIT.md`
2. `docs/audits/PEARL_VOICE_RUNTIME_TIMELINE_AUDIT.json`
3. `docs/audits/PEARL_VOICE_ASSET_DURATIONS.csv`

The Markdown report must be readable by a product and engineering team.

The JSON must contain the detailed scenario and event data needed for a later implementation pass.

The CSV must contain one row per physical voice asset, including both Clara and Marcus.

Do not overwrite the existing voice cue inventory files.

---

# Part 1: Establish the exact runtime timing model

Inspect the complete runtime path from controller event to audible playback.

At minimum inspect:

- `src/audio/voicePlayer.ts`
- `src/audio/manifest.ts`
- `src/audio/cues.ts`
- `src/audio/safetyAudio.ts`
- `src/audio/safetyAudioManifest.ts`
- `src/profile/voices.ts`
- `src/training/sessionPlayer.ts`
- `src/training/microCheck.ts`
- `src/assessment/sessionController.ts`
- `src/checkup/checkup.ts`
- `src/preflight/preflight.ts`
- `src/preflight/movementCameraReadiness.ts`
- `src/preflight/promptTiming.ts`
- The three screen components that relay `VoiceUpdate` objects
- Relevant graders, exercise definitions, movement definitions, timers, and tests

Document precisely:

- What clock drives each controller
- Whether progression is based on landmark timestamps, `Date.now()`, React timers, audio callbacks, or another clock
- Whether state progression waits for speech completion
- Whether instruction dwell time is fixed or derived from audio duration
- Whether the next state can begin while speech is still playing
- Whether cue arrays are submitted as one `speak()` call or as multiple calls
- How the player handles a new call while busy
- What happens for lower, equal, and higher priorities
- What `stop()` clears
- Whether a stopped asset can still issue a stale completion callback
- Whether pending cues survive pause, retry, skip, navigation, or unmount
- Whether the player can ever overlap speech and SFX
- Whether the rep-credit sound effect affects spoken audio
- How missing assets are handled
- How a voice change affects already-created channels or pending speech
- Whether there are platform-specific assumptions in the code

Do not describe intended behaviour where the code establishes different behaviour.

## Timing terminology

Use these terms consistently:

- `scheduledAtMs`: when the controller emits the event
- `speakCalledAtMs`: when the screen invokes `VoiceChannel.speak`
- `playbackStartMs`: estimated start based on the runtime model
- `assetDurationMs`: measured MP3 duration
- `sequenceDurationMs`: sum of assets in one cue sequence, excluding unknown native gaps
- `playbackEndMs`: expected end from measured duration
- `nextControllerEventMs`: when the controller next emits a potentially competing event
- `timingMarginMs`: `nextControllerEventMs - playbackEndMs`
- `outcome`: played, partially-played, dropped, interrupted, cancelled, missing, or statically-indeterminate

A negative timing margin means the next event is scheduled before the current speech would finish.

For unknown native startup and callback latency, keep measured file duration separate from uncertainty. Do not invent false precision.

Where helpful, give sensitivity results for:

- zero additional native latency
- 100 ms additional latency per asset
- 250 ms additional latency per asset

Label these as modelling assumptions, not measured device facts.

---

# Part 2: Measure every bundled audio asset

Enumerate all physical MP3 files used by Pearl’s voice system for both voices.

For every asset record:

- Voice id
- Cue key
- File path
- File size
- Duration in milliseconds
- Codec/container if locally available
- Sample rate if locally available
- Channel count if locally available
- Whether it is referenced by the manifest
- Whether it has matching cue metadata
- Whether the corresponding asset exists for the other voice
- Duration difference between Clara and Marcus
- Whether the filename is orphaned, duplicated, or missing

Use the actual media file metadata. Do not estimate duration from word count.

The CSV should have columns similar to:

```text
voiceId,cueKey,path,durationMs,fileSizeBytes,codec,sampleRateHz,channels,inManifest,hasCueDefinition,pairedVoiceAssetExists,pairedDurationDeltaMs,status,notes
```

Validation requirements:

- Account for every MP3 under the relevant voice asset directories
- Account for every manifest entry
- Account for every cue in the existing inventory
- Verify all number assets
- Verify all safety assets
- Verify Clara and Marcus separately
- Report mismatches rather than silently ignoring them

Produce summary statistics:

- Shortest and longest asset
- Median and 95th percentile duration
- Longest setup instruction
- Longest safety instruction
- Longest cue sequence used by each flow
- Largest Clara–Marcus duration difference
- Assets longer than 3, 5, 8, and 10 seconds
- Total storage per voice

---

# Part 3: Build a deterministic runtime scenario harness

Reconstruct representative and boundary runtime timelines without requiring a physical device.

Prefer a pure audit harness that:

- Uses the actual production controller/state-machine logic where practical
- Uses a fake or controlled clock
- Uses measured MP3 durations
- Emulates the current `VoiceChannel` priority/drop/interrupt policy
- Records every emitted `VoiceUpdate`
- Records whether each cue would play, be dropped, or be interrupted
- Does not instantiate `expo-audio`
- Does not change production behaviour

Do not create a simplified model that ignores important production branches. If production code cannot be reused cleanly, explain exactly what was modelled and what remains uncertain.

For each scenario, capture an ordered event log similar to:

| Time | Flow state | Source event | Cues | Priority | Sequence duration | Voice state before call | Outcome | End time | Next event | Margin | Evidence |
|---:|---|---|---|---:|---:|---|---|---:|---|---:|---|

Every collision finding must identify:

- The first cue or sequence
- The competing cue or sequence
- Both priorities
- Both scheduled times
- Measured durations for Clara and Marcus
- The result under the current player policy
- Whether the problem is deterministic or merely possible
- The exact source locations that establish it

## Required timing questions

Explicitly answer all of these:

1. Can `framing-ready` still be playing when the exercise or assessment instruction is submitted?
2. Are `framing-ready` and instructions sent in one cue array or separate calls?
3. Can a setup safety cue be dropped because an instruction of equal priority is playing?
4. Can an instruction be interrupted by the countdown?
5. Does countdown timing begin after the instruction sequence finishes, or after a fixed dwell?
6. Can `countdown-two`, `countdown-one`, or `go` be dropped because the previous countdown asset is still playing at the same priority?
7. Does the active set or measurement timer begin when `go` is emitted, when the file begins, or independently?
8. Can movement begin while `go` is still playing?
9. Can result or transition speech interrupt the final active cue?
10. Can rest narration extend beyond the rest period?
11. Can the next exercise setup begin while rest or transition speech is playing?
12. Can repeated preflight prompts be dropped because a previous prompt is still playing?
13. Can changed prompts interrupt or be suppressed incorrectly?
14. Can tracking-loss narration interrupt safety, instruction, countdown, or result speech?
15. Is there a positive confirmation when tracking has recovered?
16. Can pause, retry, skip, cancel, or unmount leave stale playback callbacks?
17. On resume, does Pearl replay essential instructions or continue with missing context?
18. Are skip confirmations silent despite the generated `exercise-skipped` asset?
19. Does a missing first asset in a sequence still allow later assets to play correctly?
20. Do Clara and Marcus produce different collision outcomes because their asset durations differ?

---

# Part 4: Exhaustive training-session analysis

Do not stop at exercise-family cue mappings.

Enumerate every registered exercise level that can exist in:

- A generated training session
- An adjusted session
- A readiness-scaled session
- A pain-substitution path
- An equipment-gated path
- A short session
- Explore/manual practice where the same session player is used
- A hidden or controlled-beta path still reachable through configuration

Discover the current exact exercise and level count from the repository. Do not assume the count from an older audit.

## One row per exact exercise level

For every exact level record:

- Exercise id
- Display name
- Ladder/family
- Release status
- Reachability
- Domain
- Camera orientation
- Required equipment
- Required support
- Floor-space requirement
- Bilateral or unilateral
- Starting side
- Whether a side switch is required
- Set type: reps, timed hold, duration, ROM, or other
- Default and allowed set counts
- Default and allowed rep/time targets
- Tempo or hold requirement
- Loaded or unloaded
- Exercise instruction cue key
- Exact spoken instruction
- Safety cue ids selected
- Safety cue order
- Total spoken setup duration for Clara
- Total spoken setup duration for Marcus
- Whether the countdown waits for setup speech
- Whether active movement can begin during speech
- Whether the instruction is semantically accurate for this exact level
- Whether all essential eyes-off-screen information is spoken

## Semantic accuracy verdict

Use one of:

- `accurate`
- `incomplete_but_safe`
- `misleading`
- `potentially_unsafe`
- `missing`
- `uncertain`

Evaluate the spoken instruction against the actual movement definition, not merely the family name.

Compare at least:

- Movement pattern
- Starting position
- Support
- Equipment
- Load
- Rep versus hold behaviour
- Range
- Tempo
- Side
- Direction
- Camera orientation
- Target
- Completion rule

Explicitly verify the following suspected mismatches. Do not assume they are defects until the code proves them:

- The generic squat cue used by chair-supported split squat
- The heel-raise cue used by toe raise
- The glute-bridge repetition instruction used by a bridge hold
- The wall-tap hip-hinge instruction used by free hinge
- The wall-or-floor push-up instruction used by incline push-ups
- The overhead-reach instruction used by a band overhead press
- The marching instruction used by loaded marching
- The generic balance instruction saying “the position I describe” when no stance-specific training cue may be emitted
- Sit-to-stand cues across cushion, slow eccentric, power, and loaded variants
- Any loaded exercise whose spoken instruction omits the load
- Any unilateral exercise whose spoken instruction omits the starting side or side-change rule

For each confirmed mismatch, state the exact user consequence.

Examples of consequence labels:

- User performs the wrong movement
- User uses the wrong equipment
- User expects repetitions during a hold
- User does not know which side to use
- User cannot complete the exercise without looking at the screen
- Cue is technically incomplete but unlikely to alter movement
- Cue is safe but not premium
- Cue creates a measurement-consistency risk

## Canonical and boundary timelines

For every exact training level, create at least:

1. A normal first-set setup timeline
2. A later-set timeline
3. A final-set timeline
4. A normal transition to the next exercise
5. Any unique unilateral/side-switch timeline
6. Any unique tracking-loss timeline
7. Any unique autoregulation/early-completion timeline

Where parameters vary, include boundary scenarios for:

- Minimum and maximum set count
- Minimum and maximum rep target
- Minimum and maximum timed target
- Short-session variants
- Readiness reductions
- Pain substitutions
- Equipment substitutions or skips
- Hidden/controlled-beta levels

Avoid a combinatorial explosion by grouping scenarios only when the emitted voice sequence and timing are provably identical. State the equivalence rule.

---

# Part 5: Safety narration load and duplication

The existing inventory contains a large safety cue surface. Determine what a user actually hears rather than counting all definitions.

For every exact training level, list:

- Global safety cues selected
- Setup safety cues selected
- Active or tracking-recovery cues selected
- Rest cues selected
- Whether each cue is spoken once per session, once per exercise, once per set, or reactively
- Exact order relative to exercise instructions
- Cue priority
- Combined duration for Clara
- Combined duration for Marcus
- Whether any safety cue is dropped or interrupted
- Whether any cue duplicates another cue spoken in the same setup
- Whether internal implementation language reaches the user

Calculate:

- Minimum, median, 95th percentile, and maximum safety narration per exercise setup
- Maximum uninterrupted spoken setup before a user can begin
- Maximum total safety narration in a plausible 20-minute session
- Number of duplicate or near-duplicate support warnings in a single session
- Number of times global advice can repeat
- Whether safety narration materially shortens rests or delays movement
- Whether safety cues with priority 6 compete with exercise instructions at priority 6

Classify every safety cue provisionally as:

- `global_once_per_session`
- `specific_once_per_exercise`
- `reactive_only`
- `duplicate`
- `internal_language`
- `questionable_relevance`
- `keep_as_is`
- `requires_product_review`

Do not rewrite the safety copy in this task.

Explicitly inspect language such as:

- “for this V1 training level”
- “wait for Pearl to reset”
- “tracking paused”
- “just for the camera”

Determine whether it is active, when it is spoken, and whether it exposes implementation details.

---

# Part 6: Movement Check-Up runtime timelines

Audit the complete default check-up from entry to completion.

Include:

- Check-up intro
- Transition into each assessment
- Orientation changes
- Generic preflight
- Movement-specific readiness
- Framing-ready confirmation
- Assessment instructions
- Countdown
- Active measurement
- Stage transitions
- Tracking interruption
- Recovery
- End cue
- Result cue
- Retry
- Skip
- Timeout
- Completion

## Default assessment battery

At minimum verify the current default paths for:

- 30-second chair stand
- Balance ladder
- Shoulder flexion or its current production replacement
- Hinge reach or its current production replacement

Also audit:

- V2/raw-first protocols still reachable
- TUG or any beta/custom battery path still present
- Any legacy movement that can still be selected

## Assessment-specific questions

### Chair stand

- When exactly does the 30-second timer start relative to `go`?
- Can the timer start before `go` finishes?
- Is the final rep window affected by spoken timing?
- Does `times-up` interrupt anything?
- Is the result sequence submitted as one array?
- What happens at 0 reps?
- What happens for every count range?
- Does spoken count clamping differ from accepted scoring range?
- Verify whether values above 40 can be valid and, if so, whether they are spoken incorrectly.
- Does the singular/plural wording remain correct?
- Does retry fully reset speech and measurement state?

### Balance ladder

- List the actual default stage order.
- Verify whether semi-tandem is skipped.
- Record stage duration and cue duration for every stage.
- Determine whether a stance cue can still be playing when measurement for that stance begins.
- Determine whether a later stance cue can drop or interrupt an earlier one.
- Determine whether eyes-open/eyes-closed cues fit within stage timing.
- Verify which foot leads in tandem.
- Verify which leg is used for single-leg balance.
- Determine whether side choice is stable across baseline and re-test.
- Identify any measurement-comparability risk caused by ambiguous side selection.
- Identify whether closing the eyes is appropriate and reachable under the current protocol; report code evidence only.

### Shoulder

- Identify which arm is measured.
- Determine how the app establishes “that arm.”
- Verify whether the same arm is used at later re-tests.
- Determine whether the hold begins before the instruction or countdown finishes.
- Check whether orientation correction can use “for the next movement” during an active recovery.

### Hinge

- Verify whether “Last one” is always true for every reachable battery.
- Determine whether the movement can be reordered or used alone.
- Check whether the user is told when to stop holding.
- Determine whether the return-to-standing cue is timed safely.

### TUG and conditional protocols

- Clearly distinguish default, beta, custom, legacy, and unreachable paths.
- Do not imply TUG is part of the default check-up unless the current code proves it.
- Reconstruct the full timeline for any reachable conditional path.

---

# Part 7: Micro check-up runtime timelines

Audit all current micro check-up types:

- Chair power
- Single-leg balance
- Mobility reach

For each type record:

- Selection logic
- Entry state
- Whether the generic micro-check intro is used
- Setup and framing sequence
- Exact instruction
- Countdown timing
- Active termination rule
- Result/completion cue
- Tracking-loss behaviour
- Pause/resume behaviour
- Discard behaviour
- Retry behaviour if present
- Side selection
- Measurement consistency
- Total spoken duration
- Whether the user can complete it without looking at the screen

Explicitly determine:

- Whether “five quick chair stands” ends on the fifth accepted rep or on a timer
- Whether the user receives rep progress or only SFX
- Which leg is used for single-leg balance
- Whether the same leg is used on future micro-checks
- Which leg is extended during the seated hamstring reach
- Whether the mobility instruction and actual grader evaluate the same side/body chain
- Whether `microcheck-intro` should remain inactive, based on current flow structure
- Whether the micro-check begins too abruptly without a general context cue

Do not decide final copy yet.

---

# Part 8: Shared setup, preflight, and countdown analysis

Audit every shared setup cue in real timing context.

For each prompt determine:

- Exact trigger
- Prompt suppression rule
- Same-prompt repeat interval
- Changed-prompt minimum interval
- Priority
- Duration for both voices
- Whether a changed prompt is dropped while another is playing
- Whether the visible state can change before the spoken prompt finishes
- Whether the prompt remains semantically accurate for every trigger grouped under it

Explicitly examine:

- `step-into-frame`
- `center-yourself`
- `step-back`
- `step-closer`
- `hold-still`
- `turn-on-light`
- `framing-ready`
- `turn-side-on`
- `face-forward`
- `countdown-three`
- `countdown-two`
- `countdown-one`
- `go`

Determine whether:

- “about three big steps back” is always appropriate
- `turn-on-light` can be triggered by non-lighting causes
- `hold-still` can be spoken when the system is already ready
- “for the next movement” can be emitted during correction of the current movement
- orientation prompts can compete with transition cues
- the four countdown files fit inside one-second intervals for both voices
- any countdown cue is deterministically dropped under current equal-priority handling
- `go` timing aligns with the actual active-state start

---

# Part 9: Pause, resume, retry, skip, cancel, and tracking recovery

Create explicit scenario timelines for:

- Pause during session intro
- Pause during setup instruction
- Pause during countdown
- Pause during active exercise
- Pause during rest
- Resume from each paused state
- Repeat instructions while paused
- Retry during setup
- Retry after a failed measurement
- Skip during spoken instructions
- Skip during countdown
- Skip during an active exercise
- Cancel/discard during playback
- Navigation/unmount during playback
- Tracking lost during setup
- Tracking lost during countdown
- Tracking lost during an active set
- Tracking recovered quickly
- Tracking recovered after a long gap
- Repeated tracking loss
- Missing asset
- Rapid successive high-priority events

For each scenario state:

- Which audio is stopped
- Which pending cues are cleared
- Which controller state is preserved
- Which instruction is replayed
- Whether the user receives confirmation
- Whether the timer is paused or continues
- Whether the current rep/hold state resets
- Whether stale callbacks can affect the new state
- Whether the user can understand what to do next without looking at the screen

Distinguish speech-system problems from controller-state problems.

---

# Part 10: Voice-first and eyes-off-screen coverage

Pearl’s spoken introduction says the user can follow the voice without touching the screen. Test that promise against actual information coverage.

For every exact training level and every assessment/micro-check, mark whether the following is conveyed through speech:

- Exercise or test name
- Required equipment
- Required support
- Starting position
- Camera orientation
- Starting side
- Side-switch instruction
- Rep target
- Hold-duration target
- Timed-set target
- Tempo
- Range instruction
- When to start
- Current progress
- Halfway or time remaining
- When to stop
- Set number
- Sets remaining
- Rest status
- Next action
- Tracking lost
- Tracking recovered
- Skip confirmation
- Pause confirmation
- Resume confirmation
- Completion confirmation

Use these values:

- `spoken`
- `sfx_only`
- `visible_only`
- `inferable`
- `not_required`
- `missing`
- `uncertain`

Then give each flow item one voice-first verdict:

- `fully_eyes_off`
- `mostly_eyes_off`
- `screen_glance_required`
- `screen_dependency_significant`
- `cannot_complete_reliably_by_voice`

Do not assume every missing progress cue is a defect. Explain whether it is necessary, optional, or potentially distracting.

---

# Part 11: Findings and provisional action classification

For every confirmed issue assign:

## Severity

- `P0`: credible immediate safety risk or invalid measurement
- `P1`: wrong exercise instruction, deterministic cue loss, broken no-touch flow, or material protocol inconsistency
- `P2`: incomplete guidance, avoidable repetition, timing friction, or meaningful trust/premium-quality problem
- `P3`: wording polish or low-impact inconsistency

## Evidence confidence

- `confirmed_code_and_asset_duration`
- `confirmed_deterministic_simulation`
- `confirmed_static_semantics`
- `likely`
- `possible`
- `device_only`
- `uncertain`

## Provisional action

- `keep`
- `rewrite`
- `split`
- `merge`
- `remove`
- `add`
- `retime`
- `change_priority_or_queue_policy`
- `change_controller_wait_policy`
- `protocol_review`
- `device_test`
- `no_action`

Do not write final replacement scripts or final cue wording in this audit.

For each issue include:

- Finding id
- Severity
- Flow
- Exact affected cue ids
- Exact affected exercise or assessment ids
- User-visible consequence
- Evidence
- Source files and symbols
- Clara result
- Marcus result
- Recommended next-step category
- Whether production implementation can be isolated safely
- Tests that would be needed later

---

# Required Markdown report structure

Use this exact high-level structure:

# Pearl Voice Runtime Timeline Audit

## 1. Executive Summary

Include:

- Number of physical MP3 assets measured
- Number per voice
- Number of runtime scenarios modelled
- Number of exact training levels covered
- Number of deterministic drops
- Number of deterministic interruptions
- Number of possible timing collisions
- Number of semantic instruction mismatches
- Number of potentially unsafe mismatches
- Number of voice-first coverage gaps
- P0/P1/P2/P3 counts
- The five most important findings
- Whether production code changed

## 2. Scope, Method, and Limitations

Explain:

- How durations were measured
- How timelines were simulated
- What production logic was reused
- What was modelled
- What remains device-only
- Any assumptions

## 3. Audio Asset Duration Inventory

Include summary tables and reference the CSV.

## 4. Runtime Playback and Timing Model

Include:

- Controller-to-player sequence
- Priority policy
- Cancellation policy
- Timing sources
- A Mermaid diagram
- Timing terminology

## 5. Deterministic Cue Drop and Interruption Findings

List every confirmed case.

## 6. Shared Setup and Countdown Timelines

Include normal and adverse scenarios.

## 7. Training Session Runtime Timelines

Group by:

- Session entry
- Exercise setup
- Countdown
- Active set
- Rest
- Transition
- Completion
- Recovery branches

## 8. Exact Exercise-Level Instruction Accuracy Matrix

One row per exact exercise level.

## 9. Safety Narration Load

Include per-level and session-level totals.

## 10. Movement Check-Up Timelines

Use separate subsections for every assessment and conditional protocol.

## 11. Micro Check-Up Timelines

Use separate subsections for all three types.

## 12. Pause, Retry, Skip, Cancellation, and Tracking Recovery

Include scenario tables.

## 13. Voice-First Coverage Matrix

Include the eyes-off-screen verdicts.

## 14. Inactive Cue Product Decisions

Reassess:

- `set-done`
- `cooldown-now`
- `time-to-retest`
- `exercise-skipped`
- `balance-semi-tandem`
- `microcheck-intro`

Do not activate or remove them. Give a provisional decision and evidence.

## 15. Prioritised Findings

Order by severity and user impact.

## 16. Recommended Next Implementation Phase

Describe the smallest safe implementation sequence, but do not implement it.

Separate:

- Architecture/timing fixes
- Exercise-specific cue splitting
- Missing guidance
- Safety-cue consolidation
- Protocol decisions
- Copy rewrite
- Audio regeneration
- Device QA

## 17. Physical-Device Test Plan

Provide exact Android and iOS scenarios that static analysis cannot settle.

## 18. Validation and Commands Run

## 19. Complete Source Index

## Appendix A: Full Scenario Timeline Tables

## Appendix B: Full Asset Duration Statistics

---

# Required JSON structure

Use a top-level structure similar to:

```json
{
  "auditVersion": 1,
  "generatedAt": "...",
  "inventoryInputs": [
    "docs/audits/PEARL_VOICE_CUE_INVENTORY.md",
    "docs/audits/PEARL_VOICE_CUE_INVENTORY.json"
  ],
  "summary": {},
  "timingModel": {
    "controllerClocks": [],
    "voiceChannelPolicy": {},
    "latencyAssumptions": []
  },
  "assetDurations": [
    {
      "voiceId": "clara",
      "cueKey": "training-intro",
      "path": "...",
      "durationMs": 0,
      "fileSizeBytes": 0,
      "codec": null,
      "sampleRateHz": null,
      "channels": null,
      "manifestStatus": "referenced",
      "pairedAsset": {
        "voiceId": "marcus",
        "exists": true,
        "durationMs": 0,
        "deltaMs": 0
      },
      "notes": []
    }
  ],
  "scenarios": [
    {
      "id": "TRAIN-sts-standard-normal-clara",
      "flow": "training",
      "voiceId": "clara",
      "exerciseId": "sts-standard",
      "assessmentId": null,
      "microCheckType": null,
      "variant": "normal",
      "assumptions": [],
      "events": [
        {
          "scheduledAtMs": 0,
          "speakCalledAtMs": 0,
          "state": "setup",
          "source": {
            "file": "...",
            "symbol": "...",
            "line": 0
          },
          "cues": ["framing-ready"],
          "priority": 6,
          "assetDurationMs": 0,
          "sequenceDurationMs": 0,
          "playbackStartMs": 0,
          "playbackEndMs": 0,
          "nextControllerEventMs": 0,
          "timingMarginMs": 0,
          "voiceStateBeforeCall": "idle",
          "outcome": "played",
          "competingEventId": null,
          "reason": null,
          "confidence": "confirmed_deterministic_simulation"
        }
      ],
      "verdict": {},
      "notes": []
    }
  ],
  "exerciseAccuracy": [
    {
      "exerciseId": "...",
      "cueKey": "...",
      "verdict": "accurate",
      "dimensions": {
        "movement": "match",
        "equipment": "match",
        "support": "match",
        "load": "match",
        "repOrHold": "match",
        "tempo": "match",
        "side": "match",
        "target": "missing"
      },
      "userConsequence": [],
      "sources": [],
      "provisionalAction": "keep"
    }
  ],
  "safetyNarration": [],
  "voiceFirstCoverage": [],
  "findings": [],
  "inactiveCueDecisions": [],
  "deviceTestPlan": [],
  "validation": {}
}
```

Keep the JSON valid and do not include comments.

---

# Validation requirements

Before finishing:

1. Parse the generated JSON successfully.
2. Parse the CSV and verify its row count.
3. Verify every physical MP3 is represented exactly once in the CSV.
4. Verify every manifest asset is represented.
5. Verify both Clara and Marcus are covered.
6. Verify every exact registered exercise level has an accuracy row.
7. Verify every exact reachable training level has at least one runtime scenario.
8. Verify every default assessment has normal and interruption scenarios.
9. Verify all three micro-check types have normal and interruption scenarios.
10. Verify every cue id from the original inventory is either:
    - present in at least one scenario,
    - explicitly marked conditional, or
    - explicitly included in the inactive-cue decision table.
11. Verify every deterministic drop/interruption references measured asset durations.
12. Verify every source path exists.
13. Run relevant existing tests.
14. Run any audit-only tests or scripts added.
15. Run formatting/type-checking only where relevant and practical.
16. Inspect `git diff` and confirm no production behaviour changed.
17. Do not leave generated temporary files outside the requested audit artifacts.
18. Do not regenerate audio assets.

Where a conclusion cannot be established statically, state exactly what physical-device observation is required.

---

# Final Codex response

When finished, respond with:

- Paths to all created files
- Whether production code changed
- Any audit-only scripts or tests added
- Number of MP3 assets measured
- Number per voice
- Number of scenarios modelled
- Number of exact training levels covered
- Deterministic drop count
- Deterministic interruption count
- Possible collision count
- Semantic mismatch count
- P0/P1/P2/P3 counts
- The five most important findings
- Tests and validation commands run
- Physical-device questions still unresolved
- A concise confidence statement

Do not implement fixes, rewrite cues, or regenerate audio during this task.
