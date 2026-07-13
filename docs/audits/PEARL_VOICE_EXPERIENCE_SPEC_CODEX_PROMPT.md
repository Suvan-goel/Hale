# Codex Prompt: Pearl Voice Experience Specification and Final Script Design

Read this entire prompt before starting.

Pearl has now completed two evidence-backed voice audits:

- `docs/audits/PEARL_VOICE_CUE_INVENTORY.md`
- `docs/audits/PEARL_VOICE_CUE_INVENTORY.json`
- `docs/audits/PEARL_VOICE_RUNTIME_TIMELINE_AUDIT.md`
- `docs/audits/PEARL_VOICE_RUNTIME_TIMELINE_AUDIT.json`
- `docs/audits/PEARL_VOICE_ASSET_DURATIONS.csv`

The runtime audit found, among other things:

- 300 physical MP3 assets: 150 Clara and 150 Marcus
- 37 exact registered training levels
- 374 modelled runtime scenarios
- 0 deterministic drops and 0 deterministic interruptions in the modelled normal paths
- 22 semantic instruction mismatches
- 24 voice-first coverage gaps
- 11 exact training levels with no effective movement instruction
- 11 exact training levels whose family-level instruction is misleading for the actual variant
- Extremely long safety/setup narration for some exercises
- Active timing begins on the same frame as `go`
- Skip, pause, resume, and tracking recovery lack useful spoken confirmation
- Several assessment and micro-check side-selection rules are ambiguous
- Chair-stand spoken numbers are clamped at 40 even though accepted results may exceed 40

This task is the **product and engineering specification stage**. It must convert those audits into one decisive, implementation-ready voice experience design.

The output will be reviewed before any production code is changed or any audio is regenerated.

---

# 1. Objective

Create the definitive Pearl Voice Experience Specification for:

1. Training sessions
2. Full Movement Check-Ups
3. Weekly micro check-ups
4. Shared camera setup and countdown behaviour
5. Pause, resume, repeat, retry, skip, tracking-loss, recovery, cancel, and completion behaviour
6. The bundled-audio cue architecture and future regeneration manifest

The specification must answer:

- Exactly what the user should hear
- Exactly when each cue should play
- Which cues should be full recordings versus composable fragments
- Which information must be spoken for eyes-off use
- Which information should remain visual-only to avoid over-coaching
- How instructions differ by exact exercise level
- How safety narration is consolidated
- How side selection remains consistent across measurements
- How `go` aligns with active timing
- Which existing cue assets are kept, rewritten, split, merged, retired, or replaced
- Which new assets are required
- What production changes will later be needed
- What tests and device QA will be required

Do not merely restate the audits. Make final recommendations and produce final proposed scripts.

Where the repository and product principles support a clear choice, make the choice. Do not provide several vague alternatives.

Only leave a decision unresolved where it genuinely requires protocol validation, clinical/safety review, or information not present in the repository. Every unresolved decision must have a named owner, exact evidence needed, and a safe default for implementation planning.

---

# 2. Strict scope

This is a specification-only task.

## Do not

- Change production TypeScript or React Native code
- Change assessment scoring
- Change exercise programming
- Change generated plans
- Change release flags
- Change runtime cue selection
- Change timers or queue priorities
- Change manifests
- Change tests
- Regenerate MP3s
- Call ElevenLabs or any external API
- Replace bundled audio with runtime TTS
- Add npm dependencies
- Change `package.json` or `package-lock.json`
- Delete or rename existing assets
- Implement the new specification
- Commit unrelated formatting changes

## You may

- Add the requested specification artifacts under `docs/specs/`
- Use temporary local analysis scripts, but remove them before finishing
- Add no production or audit script unless absolutely necessary
- Reuse the existing audit JSON and CSV programmatically
- Inspect every relevant production source file and test
- Calculate word counts and duration estimates

Production behaviour must remain unchanged.

---

# 3. Required deliverables

Create all four files:

1. `docs/specs/PEARL_VOICE_EXPERIENCE_SPEC.md`
2. `docs/specs/PEARL_VOICE_EXPERIENCE_SPEC.json`
3. `docs/specs/PEARL_VOICE_SCRIPT_REVIEW.md`
4. `docs/specs/PEARL_VOICE_SCRIPT_MANIFEST.csv`

Do not overwrite the audit files.

## Purpose of each artifact

### `PEARL_VOICE_EXPERIENCE_SPEC.md`

The definitive product and engineering specification. It must describe the final behaviour, timing model, safety policy, cue architecture, protocol decisions, implementation phases, and acceptance criteria.

### `PEARL_VOICE_EXPERIENCE_SPEC.json`

A machine-readable version of all final decisions, scripts, mappings, timing rules, exercise contracts, protocol rules, and implementation requirements.

### `PEARL_VOICE_SCRIPT_REVIEW.md`

A clean human-review document containing the proposed final spoken scripts in the order a user would hear them. It should not be cluttered with source-code analysis.

It must be suitable for reading aloud and approving line by line before audio generation.

### `PEARL_VOICE_SCRIPT_MANIFEST.csv`

One row per proposed final cue asset or composable cue fragment.

The CSV must make later generation, manifest updates, migration, review, and QA straightforward.

Suggested columns:

```text
newCueKey,action,oldCueKeys,flow,category,trigger,exactScript,isComposable,compositionRole,firstUseOrRepeat,priorityClass,interruptPolicy,estimatedClaraMs,estimatedMarcusMs,targetMaxMs,wordCount,requiredForVoiceFirst,sourceContract,implementationPhase,reviewStatus,notes
```

Use valid CSV escaping.

---

# 4. Sources and evidence

Treat the two audits as inputs, not unquestionable truth.

Independently inspect the current repository wherever a final script or protocol decision depends on:

- Exercise movement definitions
- Set graders
- Exercise targets
- Exercise safety profiles
- Equipment requirements
- Support requirements
- Side or stance behaviour
- Camera orientation
- Assessment graders
- Assessment scoring
- Check-up battery order
- Micro-check termination rules
- Pause/retry/skip behaviour
- Runtime event availability
- Existing visible copy
- Cue priorities and queue behaviour
- Audio generation and manifest structure

At minimum inspect the sources listed by the audits, including:

- `scripts/generate-audio.ts`
- `src/audio/cues.ts`
- `src/audio/manifest.ts`
- `src/audio/voicePlayer.ts`
- `src/audio/safetyAudio.ts`
- `src/audio/safetyAudioManifest.ts`
- `src/profile/voices.ts`
- `src/training/sessionPlayer.ts`
- `src/training/microCheck.ts`
- `src/training/safetyCueDefinitions.ts`
- `src/training/safetyCues.ts`
- `src/assessment/sessionController.ts`
- `src/checkup/checkup.ts`
- `src/preflight/preflight.ts`
- `src/preflight/movementCameraReadiness.ts`
- `src/preflight/promptTiming.ts`
- `src/exercises/index.ts`
- `src/exercises/ladders.ts`
- `src/exercises/releasePolicy.ts`
- `src/exercises/common.ts`
- `src/exercises/setGraders.ts`
- Every exact exercise definition
- Every current assessment definition
- The three relevant session screens
- Relevant tests

Every final instruction must be traceable to an exact movement or flow contract in production code.

Do not copy visible UI instructions blindly if they conflict with the actual grader or movement definition.

---

# 5. Pearl product principles

The final voice experience must reflect these product principles.

## Audience

Pearl is primarily for adults aged approximately 45–65 who want to remain strong, steady, mobile, and independent.

The experience must feel:

- Calm
- Premium
- Mature
- Warm
- Clear
- Trustworthy
- Evidence-based
- Non-medical
- Non-childish
- Non-competitive

## Product role

The camera is a measuring instrument, not a constant form critic.

Voice should:

- Establish the movement clearly
- Communicate the target
- Tell the user when to start and stop
- Give sparse, useful progress information
- Help the user recover from problems
- Allow the user to complete the flow with minimal screen dependence

Voice should not:

- Narrate every second
- Criticise form continuously
- Expose implementation details
- Repeatedly praise the user in a patronising way
- Repeat generic safety language before every exercise
- Create fear or medicalise normal movement
- Use terms such as `V1`, `reset state`, `tracking pipeline`, or other internal language
- Use shame, failure, streak, or frailty language
- Claim diagnosis, treatment, medical-grade measurement, or disease prevention

## Terminology

Prefer:

- Session
- Movement Check-Up
- Micro check
- Set
- Re-test
- Stronger
- Steadier
- More mobile
- Stay capable
- Comfortable range
- Sturdy support
- Back in view

Avoid:

- Workout where the product uses session
- Test failure
- Frailty
- Fall risk
- Diagnosis
- Treatment
- Medical-grade
- Tracking reset
- V1 training level
- “Just for the camera”
- Overly enthusiastic or childish coaching

---

# 6. Voice design principles

Define and apply a final set of voice design principles.

At minimum include:

## Accuracy before reuse

Never reuse a family-level instruction where it changes the movement, equipment, load, tempo, stance, side, support, or rep-versus-hold behaviour.

Reuse is allowed only where the spoken contract remains fully accurate for every mapped level.

## Eyes-off, not voice-saturated

A user should be able to complete the core flow without staring at the screen, but Pearl should not talk constantly.

The spoken experience should be sparse and event-driven.

## First exposure versus repetition

The first set or first use of an exercise in a session may use a fuller instruction.

Later sets should use a concise reminder, target, and countdown rather than replaying the full setup and safety script.

A user-triggered “Repeat instructions” action should replay the essential instruction and target, not every global safety line.

## Whole recordings versus composition

Define an atomicity policy.

Use full, naturally recorded lines for:

- Exercise setup instructions
- Complex equipment instructions
- Safety instructions
- Recovery instructions
- Session/check-up introductions
- Completion messages

Use composable assets only where short fragments can sound natural and remain unambiguous, such as:

- Numbers
- Rep/reps
- Second/seconds
- Set numbers
- Left/right
- Short target phrases
- Short progress milestones

Do not propose highly fragmented sentence construction that would sound robotic with bundled MP3 playback.

## No false precision in timing

Use measured or estimated duration carefully.

Do not assume the active timer should wait until the complete 604 ms `go` asset finishes.

The intended contract should align active timing to the **audible onset** of `go`, not to the end of the word and not merely to the controller’s `speak()` call.

Specify:

- The desired user-perceived timing
- The implementation contract
- The fallback if reliable native playback-start callbacks are unavailable
- The device measurement required
- Any small guard or calibration policy

Do not prescribe a blind 604 ms delay.

## Semantic parity across voices

Clara and Marcus must communicate identical meaning and event timing.

Different recorded durations must not change:

- Measurement windows
- Rest lengths
- Whether a cue is heard
- Cue selection
- Exercise meaning
- Side selection
- Completion logic

---

# 7. Timing and duration budgets

Create final duration budgets and validate every proposed script against them.

Use the current transcripts and measured MP3 durations to estimate approximate speech rates for Clara and Marcus.

Document the estimation method.

For every proposed line include:

- Word count
- Estimated Clara duration
- Estimated Marcus duration
- Target maximum duration
- Whether it passes the target
- Whether it passes the hard maximum

Use the following as starting guardrails unless repository evidence justifies a better value:

| Experience segment | Target | Hard maximum |
|---|---:|---:|
| Training intro plus universal safety | 12–15 s | 18 s |
| Check-up intro | 10–12 s | 15 s |
| Micro-check type intro | 5–8 s | 10 s |
| Generic preflight prompt | ≤3 s | 4 s |
| Orientation correction | ≤3 s | 4 s |
| Framing-ready confirmation | ≤2 s | 3 s |
| First-set exercise instruction | ≤12 s | 16 s |
| First-set instruction plus one specific safety line | ≤16 s | 20 s |
| Later-set reminder and target | ≤5 s | 7 s |
| Rest narration | ≤4 s | 6 s |
| Tracking-loss cue | ≤4 s | 6 s |
| Tracking-recovered cue | ≤3 s | 5 s |
| Skip/pause/resume confirmation | ≤2.5 s | 4 s |
| Session/check-up completion | ≤5 s | 7 s |

A complex equipment check may exceed an ordinary exercise instruction only if it:

- Is spoken once per equipment family per session
- Is not repeated for every set
- Is not repeated for every exercise using the same equipment
- Has a clearly justified safety purpose
- Does not delay every session indefinitely
- Is preferably handled before active camera setup rather than inside the exercise countdown path

No normal exercise should have anything close to the current 40–50 second safety narration before movement.

---

# 8. Final cue architecture

Design the final cue architecture.

At minimum specify cue classes for:

1. Session-level introduction and universal safety
2. Equipment-family first-use checks
3. Exercise first-use instruction
4. Later-set reminder
5. Dynamic target
6. Camera setup prompt
7. Orientation transition
8. Orientation correction
9. Framing-ready confirmation
10. Countdown
11. Active progress
12. Side switch
13. Set completion
14. Rest
15. Exercise transition
16. Tracking loss
17. Tracking recovery
18. Pause
19. Resume
20. Repeat instructions
21. Skip
22. Retry
23. Assessment result
24. Flow completion
25. Error/fallback

For each class specify:

- Purpose
- Trigger
- Priority class
- Whether it can interrupt
- Whether it may be dropped
- Whether it is replayable
- Whether it is first-use only
- Whether it blocks controller progression
- Whether it is a whole recording or composable
- Maximum duration
- What happens if the asset is missing

Define a named priority model such as:

- `critical_recovery`
- `start_stop`
- `instruction`
- `transition`
- `progress`
- `ambient_confirmation`

Map the named model to later numeric implementation values, but do not change the current numeric values in this task.

The specification should preserve the current architecture where it works. The audits found no deterministic normal-path drops or interruptions, so do not propose a complete player rewrite without a strong reason.

---

# 9. Training-session experience specification

Specify the final training experience from session entry through completion.

## Required final timeline

Define the exact intended sequence for:

1. Session entry
2. Universal safety
3. Equipment preparation, if required
4. First exercise transition
5. Camera setup
6. Framing confirmation
7. First-set exercise instruction
8. Target
9. Countdown
10. Active set
11. Progress cues
12. Set completion
13. Rest
14. Later-set reminder
15. Side switch where applicable
16. Exercise transition
17. Final exercise completion
18. Session completion
19. Pause/resume/repeat/skip/tracking branches

State which phases wait for audio completion and which are aligned to audible onset.

## Voice-first information contract

For every exact training level, decide whether speech must communicate:

- Exercise name
- Equipment
- Support
- Starting position
- Camera orientation
- Starting side
- Side-switch rule
- Rep target
- Time or hold target
- Tempo
- Range
- Load
- When to start
- How progress is communicated
- When to stop
- Rest duration or rest state
- Number of sets or final-set status

Do not force every field into one long instruction. Split it into natural, timed cue classes.

## Active guidance policy

Define a sparse active-guidance policy.

At minimum decide:

### Rep-based sets

- Whether the target is spoken before countdown
- Whether accepted reps remain SFX-only
- Whether a halfway cue is useful
- Whether a final-reps cue is useful
- How target changes from readiness scaling are spoken
- How autoregulated early completion is explained
- What happens if rep tracking is interrupted

### Timed holds

- Target duration before countdown
- Optional halfway cue
- Optional 10-second or 5-second remaining cues
- Stop cue
- What happens if the hold ends early
- How side changes work

### Duration-based movements

- Target duration
- Sparse progress milestones
- Stop cue
- Side switch if applicable

### Mobility/ROM movements

- Comfortable range language
- Hold or return cue
- Whether the system needs active coaching
- Completion cue

Do not add spoken rep-by-rep counting unless there is a clear product reason. Pearl should not become noisy.

---

# 10. Exact training-level instruction contracts

Create a final row for every currently registered exact training level.

The prior audit found these 37 ids; independently discover the current list and reconcile any difference:

- `balance-feet-together-hold`
- `balance-single-leg-hold`
- `balance-tandem-hold`
- `band-pull-apart`
- `chair-supported-split-squat`
- `glute-bridge-hold`
- `glute-bridge-reps`
- `heel-raise-free`
- `heel-raise-supported`
- `hip-hinge-free`
- `hip-hinge-wall`
- `loaded-march`
- `loaded-sit-to-stand`
- `mini-band-lateral-walk`
- `neck-rotation`
- `overhead-press-band`
- `overhead-reach`
- `push-up-incline`
- `push-up-standard`
- `push-up-wall`
- `seated-band-row`
- `seated-hamstring-reach`
- `squat-free`
- `squat-loaded`
- `squat-slow-eccentric`
- `squat-supported`
- `standing-band-row`
- `step-up`
- `sts-cushion`
- `sts-power`
- `sts-slow-eccentric`
- `sts-standard`
- `supported-hip-flexor-stretch`
- `supported-side-step`
- `thoracic-rotation`
- `toe-raise-supported`
- `wall-calf-stretch`

For every exact level provide:

- Exercise id
- Display name
- Release status
- Domain
- Set type
- Exact movement contract from code
- Equipment
- Load
- Support
- Orientation
- Bilateral or unilateral
- Starting side rule
- Side-switch rule
- Tempo
- Target ranges
- First-use instruction cue key
- Exact final first-use script
- Later-set reminder cue key
- Exact final later-set script
- Dynamic target grammar
- One specific safety cue, if genuinely required
- Active progress policy
- Completion behaviour
- Repeat-instructions content
- Eyes-off verdict after the proposed design
- Estimated durations
- Existing cue mapping
- Migration action
- Source files/symbols
- Notes or protocol dependencies

## Required semantic corrections

Explicitly resolve all previously identified issues:

- Ordinary squat cue used for chair-supported split squat
- Heel-raise cue used for toe raise
- Rep-based bridge cue used for bridge hold
- Wall-tap hinge cue used for free hinge
- Wall/floor push-up wording used for incline push-up
- Overhead reach used for band overhead press
- Sit-to-stand family omitting cushion, slow lowering, power intent, or load
- Squat family omitting load or slow lowering
- Loaded movements omitting equipment/load
- Balance cue referring to a position that is never spoken
- Exercises with no current movement instruction
- Unilateral exercises with no side rule
- Exercises where visible copy is required to understand the movement

Do not solve a mismatch by creating an excessively long generic cue. Create accurate level-specific cues or a small, provably accurate reuse group.

---

# 11. Safety narration policy

Replace the current many-line safety experience with a final policy.

Do not remove important safeguards. Consolidate them.

## Required safety layers

Design four layers:

### A. Universal session safety

Spoken once per training session.

It should cover only the most important universal behaviours, such as:

- Clear space
- Stop for sharp or increasing pain
- Pause for dizziness or feeling unwell
- Keep required support stable

Do not read a legal disclaimer.

### B. Equipment-family first-use safety

Spoken once per equipment family per session, not once per exercise and not once per set.

At minimum evaluate:

- Chair
- Step/stair
- Long resistance band
- Door anchor
- Mini band
- Floor transfer/support

### C. Exercise-specific safety

At most one concise line where the exact exercise has a material, non-obvious risk not already covered.

### D. Reactive recovery

Only spoken when a real problem occurs:

- Tracking lost
- Support moved
- User leaves frame
- Attempt must restart
- Pain/readiness adjustment if the product has a reliable event for it

## Required outputs

For every existing safety cue, assign:

- `keep`
- `rewrite`
- `merge_into_universal`
- `merge_into_equipment_family`
- `merge_into_exercise_instruction`
- `reactive_only`
- `retire`

Produce the exact final merged scripts.

Remove internal language from the proposed scripts, including:

- `V1 training level`
- `tracking paused`
- `wait for Pearl to reset`
- `just for the camera`

Decide whether the user-facing word `camera` is needed at all. Prefer direct action language where possible.

Calculate the proposed maximum safety narration:

- At session start
- Before an ordinary bodyweight exercise
- Before a chair exercise
- Before a step exercise
- Before a band exercise
- Before a door-anchor exercise
- Before a floor exercise
- Across a plausible full 20-minute session

Compare the proposed totals with the current audit totals.

---

# 12. Shared setup and camera guidance

Write final scripts and behavioural rules for:

- Enter frame
- Move to centre
- Step back
- Step closer
- Hold still
- Lighting/visibility problem
- Framing ready
- Turn side-on
- Face forward
- Tracking lost
- Tracking recovered

## Required corrections

### Enter-frame prompt

Do not assume “three big steps back” is appropriate for every room, camera lens, device, or movement.

The prompt should establish whole-body visibility without prescribing a potentially wrong distance.

### Lighting prompt

The current code may use the lighting cue for a wider confidence/stability failure.

Specify separate desired behaviour for:

- Confirmed low light
- General visibility/tracking difficulty
- User movement during calibration

Do not tell the user the room is dark unless the signal actually supports that conclusion.

### Orientation prompts

Separate:

- Transition to the orientation for the next movement
- Correction during setup for the current movement
- Recovery during an active attempt

Do not use “for the next movement” when correcting the current movement.

### Framing ready

Keep it short and avoid unnecessary praise before every exercise.

### Prompt repetition

Specify:

- First prompt timing
- Same-prompt repeat interval
- Changed-prompt minimum interval
- When a prompt should be cancelled
- When a recovery confirmation should play
- How to avoid speaking a stale prompt after the state is already ready

---

# 13. Countdown and `go` timing contract

Specify the final countdown contract for training, check-ups, and micro checks.

At minimum define:

- Three, two, one, go cadence
- Priority
- Whether the active clock starts on audible onset of `go`
- How audible onset is detected or calibrated
- How countdown behaves after pause
- How countdown behaves after retry
- How countdown behaves after tracking loss
- Whether countdown restarts in full
- Whether `go` may overlap active movement acoustically
- Whether a short start guard is used for grading
- How device latency is measured and tested

The user should naturally begin moving when they hear `go`.

Do not require waiting until the word has completely finished.

Measurement and timed-set windows must not begin materially before the user can hear the start signal.

---

# 14. Movement Check-Up specification

Define the final spoken experience for the default check-up and all conditional protocols still maintained in the repository.

## Default battery

Independently verify the current order and specify final scripts for:

- 30-second chair stand
- Balance ladder
- Shoulder assessment
- Hinge/forward reach

## Conditional protocols

Clearly document:

- Raw-first V2 assessment battery
- TUG beta/custom path
- Any legacy or hidden protocol retained

Do not imply that TUG is part of the default check-up.

## Required protocol decisions

### Chair stand

Specify:

- Exact introduction
- Chair placement
- Arm position
- Start timing
- End cue
- Result cue
- Zero-rep result
- Accepted spoken number range
- Singular/plural behaviour
- What happens above 40
- Retry behaviour
- Tracking interruption behaviour

The spoken result must never report a different number from the accepted result.

Recommend either:

- Extending exact bundled number support through the real accepted maximum, or
- A clearly defined truthful fallback above the exact spoken range

Choose one and justify it.

### Balance

Specify:

- Default stage order
- Whether semi-tandem remains out of default
- Feet-together cue
- Tandem cue
- Single-leg cue
- Eyes-open/eyes-closed behaviour if retained
- Leading foot
- Standing leg
- Support instructions
- Touch-down behaviour
- Stage-transition timing
- Tracking interruption behaviour
- Retest consistency

Do not add semi-tandem to the scored protocol merely because an asset exists. Any protocol change must be justified against scoring and comparability.

### Shoulder

Specify:

- Which arm is measured at baseline
- How the side is chosen
- How that side is persisted
- How official re-tests use the same side
- Safe fallback if the same side cannot be used
- Exact side-specific spoken instruction
- Start, hold, return, and completion cues

### Hinge/forward reach

Specify:

- Whether “last one” remains valid
- A battery-order-independent script
- Start cue
- Comfortable range
- Hold
- Return to standing
- Completion
- Tracking interruption

### Side-persistence policy

Create one explicit measurement-side policy for every unilateral or side-dependent assessment.

A strong default policy is:

1. Baseline chooses or assigns a side using a deterministic rule
2. The chosen side is stored with the result
3. Official re-tests instruct and measure the same side
4. Opposite-side fallback requires an explicit reason and marks comparability
5. Manual extra checks do not silently overwrite official side history

Inspect the existing data model and state whether it can support this policy later.

Do not implement it now.

---

# 15. Micro-check specification

Define the final spoken experience for:

- Chair power
- Single-leg balance
- Mobility reach

For each specify:

- Entry script
- Whether a generic micro-check intro is needed
- Setup
- Side
- Target
- Countdown
- Active progress
- Stop/completion
- Retry
- Tracking interruption
- Discard
- Result confirmation
- Retest consistency

Resolve:

- Whether chair power ends on five accepted reps
- Whether accepted rep progress remains SFX-only
- Which leg is used for single-leg balance
- How that leg is persisted
- Which leg is extended for mobility reach
- How that side is persisted
- Whether `microcheck-intro` is retained, rewritten, or retired
- Whether the current flow begins too abruptly

Micro checks should feel quick. Do not add an unnecessary long introduction.

---

# 16. Pause, resume, repeat, retry, skip, cancel, and recovery

Define the exact final behaviour and proposed script for every control state.

## Pause

Specify:

- Whether current speech stops immediately
- Whether timers and graders freeze
- Whether “Paused” is spoken
- Whether the pause cue itself may play after stopping existing speech
- What the user sees
- What context is preserved

## Resume

Specify:

- Whether Pearl says “Resuming”
- Whether it replays exercise name, side, and target
- Whether it performs a fresh countdown
- Whether an interrupted rep/hold is discarded
- Whether full instructions replay automatically or only on request

## Repeat instructions

Specify exactly what is replayed:

- Essential movement instruction
- Side
- Target
- One relevant safety line
- Not universal session safety
- Not every equipment warning

## Retry

Specify how check-up and micro-check retries reset:

- Speech
- Timer
- Grader
- Side
- Attempt data
- Camera setup
- Countdown

## Skip

Create a concise skip-confirmation policy.

The existing approximately three-second “No problem…” line may be too long.

Decide whether the final confirmation should be a shorter phrase such as a brief “Skipped. Moving on.” style message, but write the final approved proposed script yourself.

Specify:

- Training skip
- Check-up skip
- Whether micro checks can skip or only discard
- Whether skipping invalidates a required official check-up
- When the next transition cue begins

## Tracking loss

Specify:

- Immediate timer/grader action
- Spoken cue
- Whether the attempt resumes or restarts
- What setup position is required
- How repeated loss is handled
- How cue repetition is throttled

## Tracking recovery

Add a positive, concise recovery confirmation where helpful.

Specify:

- When it plays
- Whether it is followed by a fresh countdown
- Whether it blocks state progression
- How stale recovery cues are avoided

## Cancel/discard/unmount

Specify that all current and pending speech is cancelled safely and no stale callback can advance the old flow.

---

# 17. Dynamic target and progress grammar

Pearl uses bundled audio, not runtime TTS.

Design a practical asset grammar for dynamic values.

## Required domains

Cover actual ranges found in production for:

- Rep targets
- Hold durations
- Timed-set durations
- Set numbers
- Side selection
- Countdown
- Chair-stand results
- Progress milestones
- Rest, if spoken numerically

## Required decisions

For each dynamic concept decide whether it uses:

- A whole pre-recorded phrase
- Number plus unit composition
- A limited set of common complete phrases
- Existing SFX
- No speech

Avoid a combinatorial explosion of assets and avoid robotic sentence assembly.

At minimum define:

- Supported number range
- `rep` versus `reps`
- `second` versus `seconds`
- `set one of three` style phrases, if used
- Left/right cue keys
- “Switch sides”
- “Halfway”
- “Ten seconds left”
- “Five seconds left”
- “Two reps left”, if retained
- Result wording
- Number fallback behaviour

Inspect actual generated target ranges before deciding asset coverage.

Do not assume every integer from 0 to an arbitrary large number is needed.

---

# 18. Existing cue migration map

Create a mapping for every existing cue template from the original inventory.

Every one of the 110 existing cue templates must receive exactly one primary action:

- `keep_as_is`
- `keep_but_retime`
- `rewrite_same_key`
- `split_into_new_keys`
- `merge_into_new_key`
- `replace_with_new_key`
- `retire`
- `conditional_protocol_only`
- `requires_protocol_decision`

For each include:

- Existing audit id
- Existing cue key
- Existing script
- Primary action
- New cue key or keys
- Final proposed script
- Flow
- Trigger
- Reason
- User impact
- Audio regeneration required
- Production mapping change required
- Implementation phase
- Tests required

Do not silently omit inactive cues.

Explicitly decide the future of:

- `set-done`
- `cooldown-now`
- `time-to-retest`
- `exercise-skipped`
- `balance-semi-tandem`
- `microcheck-intro`

Use the prior product direction unless repository evidence contradicts it:

- `set-done`: likely retire or keep unused because other set-completion cues exist
- `cooldown-now`: retire until a real cooldown phase exists
- `time-to-retest`: keep out of ordinary session playback and handle in the block-completion product flow
- `exercise-skipped`: replace with a shorter active confirmation
- `balance-semi-tandem`: protocol-dependent; do not add to default solely because the asset exists
- `microcheck-intro`: likely retire or leave unused if the concise type-specific intro supplies enough context

---

# 19. New cue manifest

List every new cue required by the final design.

At minimum consider whether new assets are needed for:

- Exact exercise-level instructions
- Later-set reminders
- Rep target composition
- Hold target composition
- Left/right
- Switch sides
- Tracking recovered
- Pause
- Resume
- Short skip confirmation
- Retry
- Visibility problem distinct from low light
- Current-movement orientation correction distinct from next-movement transition
- Accurate chair-stand numbers above 40
- Equipment-family first-use safety
- Concise global safety
- Timed progress milestones
- Side-specific assessment instructions

For every proposed new cue include:

- Stable key
- Exact script
- Trigger
- Reuse scope
- Whole/composable status
- Priority class
- Estimated duration
- Required voice variants
- Source contract
- Audio generation order
- Test coverage

Use stable, descriptive naming.

Avoid embedding transient implementation details in cue keys.

---

# 20. Script-writing standard

Every proposed script must pass these checks.

## Correctness

- Describes the exact movement
- Matches equipment
- Matches load
- Matches support
- Matches rep versus hold behaviour
- Matches tempo
- Matches side
- Matches the grader
- Matches the actual target

## Clarity

- Short sentences
- One action at a time
- No ambiguous pronouns such as “that arm” unless the arm was just established
- No ambiguous “one leg” where side consistency matters
- No unnecessary jargon
- No overly specific room-distance assumptions

## Tone

- Calm
- Respectful
- Direct
- Warm but not patronising
- Minimal generic praise
- No childish encouragement
- No fear framing
- No medical claims

## Acoustic suitability

- Natural when spoken aloud
- No awkward punctuation dependency
- No long lists inside a single recording
- No compositional boundary that would sound unnatural
- Works for both Clara and Marcus
- Fits the timing budget

Read every proposed line as prose and revise awkward scripts before writing the final artifacts.

---

# 21. Human script review document

`PEARL_VOICE_SCRIPT_REVIEW.md` must be easy to review without reading the engineering specification.

Use this structure:

# Pearl Voice Script Review

## Review Principles

A short description of tone, pace, and what reviewers should check.

## Training Session

### Session entry

Show the exact sequence.

### Universal safety

### Equipment first-use checks

### Exact exercise instructions

Create one subsection per exact exercise level:

- First-use line
- Target composition example
- Later-set line
- Side-switch line if applicable
- Progress cues
- Completion/rest cues
- Specific safety line if applicable
- Estimated Clara and Marcus durations

### Controls and recovery

### Session completion

## Movement Check-Up

Show exact scripts in runtime order for each assessment.

## Micro Checks

Show exact scripts in runtime order for all three types.

## Shared Camera Guidance

## Dynamic Fragments

## Retired Lines

List old lines that should no longer be generated or emitted, with a brief reason.

## Unresolved Protocol Review

Only genuinely unresolved items.

Do not include long source-code excerpts.

---

# 22. JSON structure

Use a top-level structure similar to:

```json
{
  "specVersion": 1,
  "generatedAt": "...",
  "status": "proposed_for_human_review",
  "sourceAudits": [],
  "principles": [],
  "timingBudgets": [],
  "priorityModel": [],
  "cueClasses": [],
  "flowTimelines": {
    "training": [],
    "movementCheckUp": [],
    "microCheckUp": []
  },
  "exerciseContracts": [
    {
      "exerciseId": "...",
      "displayName": "...",
      "releaseStatus": "...",
      "movementContract": {},
      "voiceContract": {
        "firstUseCueKey": "...",
        "firstUseScript": "...",
        "laterSetCueKey": "...",
        "laterSetScript": "...",
        "targetGrammar": [],
        "activeGuidance": [],
        "sideSwitch": null,
        "specificSafetyCueKey": null,
        "repeatInstructions": []
      },
      "durationEstimates": {
        "claraMs": 0,
        "marcusMs": 0,
        "targetMaxMs": 0,
        "passes": true
      },
      "eyesOffVerdict": "fully_eyes_off",
      "existingCueKeys": [],
      "migrationAction": "...",
      "sources": [],
      "notes": []
    }
  ],
  "safetyPolicy": {
    "universal": [],
    "equipmentFamilies": [],
    "exerciseSpecific": [],
    "reactive": [],
    "existingCueActions": []
  },
  "assessmentContracts": [],
  "microCheckContracts": [],
  "controlContracts": [],
  "dynamicGrammar": {
    "numbers": {},
    "units": {},
    "sides": {},
    "milestones": {}
  },
  "existingCueMigration": [],
  "newCueManifest": [],
  "retiredCues": [],
  "protocolDecisions": [],
  "unresolvedDecisions": [],
  "implementationPlan": [],
  "acceptanceCriteria": [],
  "deviceQaPlan": [],
  "validation": {}
}
```

Keep the JSON valid and do not include comments.

---

# 23. Required Markdown specification structure

Use this exact high-level structure:

# Pearl Voice Experience Specification

## 1. Executive Decision Summary

Include:

- Total existing cue templates reviewed
- Number kept as-is
- Number kept but retimed
- Number rewritten
- Number split
- Number merged
- Number replaced
- Number retired
- Number of new cue assets/fragments proposed
- Number of exact training levels with final accurate instructions
- Number expected to be fully or mostly eyes-off after implementation
- Maximum proposed training intro duration
- Maximum proposed ordinary exercise setup duration
- Maximum proposed complex equipment setup duration
- Unresolved protocol decisions
- Confirmation that production code and audio assets were unchanged

## 2. Product and Voice Principles

## 3. Final Timing Budgets

## 4. Final Cue Architecture and Priority Model

## 5. Whole-Recording and Composable-Audio Policy

## 6. Training Session Timeline

## 7. Active Guidance Policy

## 8. Exact Training-Level Voice Contracts

One row per exact registered level.

## 9. Safety Narration Policy

## 10. Shared Camera and Orientation Guidance

## 11. Countdown and Audible-Start Contract

## 12. Movement Check-Up Voice Contracts

## 13. Measurement Side-Persistence Policy

## 14. Micro-Check Voice Contracts

## 15. Pause, Resume, Repeat, Retry, Skip, and Recovery

## 16. Dynamic Target and Progress Grammar

## 17. Existing Cue Migration Map

## 18. New Cue Manifest

## 19. Retired and Conditional Cues

## 20. Implementation Phases

## 21. Acceptance Criteria

## 22. Audio Generation and Review Plan

## 23. Physical-Device QA Plan

## 24. Unresolved Protocol Decisions

## 25. Validation and Source Index

---

# 24. Implementation plan requirements

The specification must propose a staged implementation plan, but must not implement it.

Use small, reviewable phases.

A sensible sequence to evaluate is:

1. Cue schema and source-of-truth refactor
2. Exact training-level instruction mapping
3. Safety consolidation
4. Dynamic target and side grammar
5. Pause/resume/skip/tracking recovery
6. Check-up side persistence and number-range accuracy
7. Micro-check consistency
8. One-voice preview generation
9. Human script/audio review
10. Both-voice generation
11. Controller integration
12. Automated tests
13. Android/iOS physical-device QA
14. Controlled beta rollout

For every phase specify:

- Scope
- Files likely affected
- Behavioural risk
- Required tests
- Whether audio regeneration is required
- Rollback strategy
- Completion gate

Do not bundle all production changes and all audio regeneration into one giant phase.

---

# 25. Audio generation and review plan

The later audio process must avoid regenerating everything blindly.

Specify:

- Script approval gate
- Cue-key approval gate
- One-voice preview strategy
- Which voice should be previewed first and why
- Human listening checklist
- Duration verification
- Pronunciation review
- Prosody review
- Composable-fragment continuity review
- Both-voice generation
- Manifest update
- Asset completeness validation
- Orphan detection
- Regression timeline audit
- Physical-device listening test

Do not call ElevenLabs in this task.

Do not expose or print API keys.

---

# 26. Acceptance criteria

Write explicit acceptance criteria for the later implementation.

At minimum require:

## Coverage

- Every exact registered training level has an accurate instruction
- No training level relies on an inaccurate family cue
- No reachable exercise has a missing movement instruction
- Every unilateral measurement has a deterministic and persisted side rule
- Every voice-first-required target is spoken

## Duration

- All proposed scripts meet their timing budgets or have a documented exception
- No ordinary exercise setup exceeds the hard maximum
- Safety narration is spoken at the correct frequency
- No equipment-family safety check repeats unnecessarily

## Timing

- Active timers align to audible `go` onset
- Countdown remains natural
- Pause/resume/retry/tracking reset timing is deterministic
- No stale callback advances an old flow
- Clara and Marcus do not produce different state outcomes

## Accuracy

- Chair-stand spoken result always equals accepted result
- Rep/hold/tempo/load/side wording matches the exact exercise
- Check-up and micro-check side selection remains comparable over time

## Voice-first usability

- A user can complete core flows without reading essential movement instructions on screen
- Screen remains available for reassurance and accessibility
- Voice does not become continuous or overwhelming

## Tone

- No implementation language
- No medical claims
- No patronising repetition
- No `V1`, `tracking reset`, or “just for the camera” wording

## Testability

- Every cue trigger has automated coverage
- Every cue migration is accounted for
- Every generated asset exists for both voices
- Runtime timeline audit can be rerun after implementation

---

# 27. Validation requirements

Before finishing:

1. Parse both source audit JSON files.
2. Parse the asset-duration CSV.
3. Verify all 110 existing cue templates receive a migration action.
4. Verify every current exact registered exercise level has one final voice contract.
5. Verify every final exercise instruction against its production definition.
6. Verify every current assessment has a final voice contract or an explicit conditional/retired status.
7. Verify all three micro-check types have final voice contracts.
8. Verify every proposed cue key is unique.
9. Verify every retired cue is absent from the new active manifest.
10. Verify every composable fragment has a valid composition use.
11. Verify singular/plural grammar.
12. Verify side-specific grammar.
13. Verify target ranges against production target ranges.
14. Verify duration estimates exist for all final scripts.
15. Verify all hard-duration failures are resolved or explicitly justified.
16. Verify the Markdown, JSON, and CSV agree on counts.
17. Parse the generated JSON successfully.
18. Parse the generated CSV successfully.
19. Verify no production file changed.
20. Verify no MP3 file changed.
21. Verify no external API was called.
22. Inspect `git diff`.
23. Remove temporary analysis files.

Do not modify existing tests for this specification task.

---

# 28. Final Codex response

When finished, respond with:

- Paths to all four generated specification files
- Confirmation that no production code changed
- Confirmation that no audio asset changed or was generated
- Existing cue migration counts by action
- Number of new cue assets/fragments proposed
- Number of exact training levels with final scripts
- Number expected to become fully or mostly eyes-off
- Maximum proposed session-intro duration
- Maximum proposed ordinary exercise setup duration
- Maximum proposed complex equipment setup duration
- Number and names of unresolved protocol decisions
- The five most important final product decisions
- Validation commands run
- A concise confidence statement

Do not implement the specification in this task.
