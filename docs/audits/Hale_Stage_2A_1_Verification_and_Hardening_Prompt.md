You are implementing Stage 2A.1 of Hale’s production-readiness work:

MOVEMENT CAMERA-READINESS VERIFICATION AND HARDENING

This is a narrow verification-and-remediation pass following Stage 2A.

Do not begin Stage 3 in this task.

Read these documents in full before making changes:

- docs/audits/HALE_LOGIC_AUDIT_STAGE_0.md
- docs/audits/HALE_LOGIC_AUDIT_STAGE_1.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_1A.md
- docs/audits/HALE_LOGIC_AUDIT_STAGE_2.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_2A.md

The current working tree is the final source of truth. Re-verify the implementation rather than assuming the reports remain line-accurate.

## Why this pass exists

Stage 2A implemented:

- Movement-specific front/side camera readiness.
- Required reliable side-chain enforcement.
- A 500 ms stable readiness dwell.
- Countdown blocking when view validity is lost.
- Active-frame interruption when view validity is lost.
- Removal of official fallback evidence for shoulder flexion and hinge reach.
- `no-measurement` results when ROM valid capture does not complete.

The full test suite passed after that remediation.

However, the Stage 2A report does not explicitly demonstrate every acceptance condition requested by the original remediation prompt.

There is also one confirmed guidance problem in the implemented prompt mapping:

- An ambiguous three-quarter view currently maps to `hold-still`.
- A correct view that is merely waiting to complete the 500 ms dwell also maps to `hold-still`.

These are different states.

A user who is steadily positioned at an ambiguous angle should be told to turn further, not to remain still.

## Primary objectives

This task has two objectives:

1. Correct movement-camera guidance so that directional ambiguity produces a directional cue.

2. Add authoritative automated coverage proving that the Stage 2A camera-readiness and ROM validity contracts hold across:
   - countdown interruption,
   - active interruption,
   - reacquisition,
   - retry,
   - assessment transition,
   - subject loss,
   - stream gaps,
   - different frame rates,
   - malformed geometry,
   - scoring,
   - Stage 1A eligibility,
   - invalid official re-test handling.

Do not redesign the measurement system.

## Locked product rules

Implement and verify the following rules.

### 1. Ambiguous orientation is directional

When the detected view is `ambiguous`:

- If the movement requires side view, route to the existing side-turn guidance:
  - voice cue: `turn-side-on`
  - visible intent: “Turn a little more so your side faces the camera.”

- If the movement requires front view, route to the existing forward-facing guidance:
  - voice cue: `face-forward`
  - visible intent: “Turn a little more to face the camera.”

Do not use `hold-still` for ambiguous orientation.

### 2. `hold-still` has one specific meaning

Use `hold-still` only when all of the following are true:

- The detected orientation matches the movement’s required orientation.
- Required reliable side-chain count is satisfied.
- Required pose geometry is finite and usable.
- Generic preflight is otherwise ready.
- The 500 ms continuous stable-readiness dwell has not yet completed.

In other words:

```text
correct orientation
+ sufficient chain reliability
+ usable pose
+ dwell incomplete
= hold-still
```

### 3. Insufficient visibility remains separate

When required chain reliability or usable torso geometry is missing:

- Continue to use the existing whole-body/framing guidance.
- Do not mislabel the state as orientation ambiguity.
- Do not tell the user to hold still if Hale cannot reliably see what it needs.

### 4. Reacquisition requires a fresh dwell

If readiness is lost during countdown or active measurement:

- Previous readiness must be invalidated.
- Returning to the correct orientation must not immediately resume valid measurement.
- The user must satisfy a fresh uninterrupted 500 ms readiness dwell.
- No evidence collected during the invalid or reacquisition period may reach the grader as valid movement evidence.

### 5. Existing valid measurement behaviour is preserved

Do not change:

- Chair-stand thresholds.
- Chair-stand rep counting.
- Chair-stand velocity calculation.
- Balance ladder stage timing.
- Balance interruption product policy.
- Shoulder-flexion angle threshold.
- Hinge-reach trunk-angle threshold.
- ROM valid-time targets.
- Scoring norms.
- Movement-age bands.
- Stage 1A minimum-domain policy.
- Default battery contents.
- TUG release status.

## Scope boundary

This task may change only what is necessary to:

- Correct ambiguous-view prompt routing.
- Harden readiness reset and reacquisition semantics if a test proves they are incomplete.
- Add missing tests.
- Add the required verification report.

Do not fix:

- Chair-stand real-device noise-floor validation.
- Native timestamp correction.
- Subject identity continuity.
- Broad non-finite landmark sanitisation outside the readiness classifier.
- App background/resume policy.
- Balance ladder stage-clock policy.
- History filename collisions.
- Account/local-data isolation.
- Workout generation.
- Session completion credit.
- Equipment metadata.
- Legacy workout fallback.
- Scoring interpretation.
- Any Stage 3 issue.
- Any unrelated UI or navigation work.

Do not perform opportunistic refactors.

## Working-tree safety

The repository has had concurrent and unrelated edits during prior audits.

Before editing:

1. Run:

   `git status --short --untracked-files=all`

   `git diff --name-only`

   `git diff --stat`

2. Record the full initial status.

3. Inspect current diffs in every file this task may touch.

4. Treat every existing modification as user-owned.

5. Do not revert, overwrite, reformat, move, or delete unrelated work.

6. Do not modify previous audit or remediation reports.

7. Do not use destructive Git commands.

8. Do not install dependencies.

9. Do not commit, stage, create a branch, or push.

10. If unrelated files change while the task is running:
    - Record the change.
    - Do not overwrite it.
    - Continue only if task-owned files remain safe and unambiguous.
    - Otherwise stop code mutation and report the conflict.

## Step 1: Verify the current Stage 2A implementation

Trace the current runtime path:

`CheckUpScreen`
-> `PoseDetectionView`
-> `PosePipeline`
-> `PreflightCheck`
-> `movementCameraReadiness`
-> `SessionController`
-> countdown
-> active grader
-> movement result
-> scoring
-> MovementAssessment
-> Stage 1A eligibility
-> block/re-test orchestration

Inspect at minimum:

- `src/preflight/movementCameraReadiness.ts`
- `src/assessment/sessionController.ts`
- `src/checkup/checkup.ts`
- `src/screens/CheckUpScreen.tsx`
- `src/screens/AssessmentScreen.tsx`
- `src/pose/pipeline.ts`
- `src/movements/chairStand.ts`
- `src/movements/balanceLadder.ts`
- `src/movements/shoulderFlexion.ts`
- `src/movements/hingeReach.ts`
- `src/scoring/scoring.ts`
- `src/haleFlow/assessmentEligibility.ts`
- Relevant tests.

Document:

- Exact readiness state shape.
- Exact prompt reason codes.
- Exact front/side thresholds.
- Exact 500 ms boundary semantics.
- How readiness is reset.
- How countdown invalidation works.
- How active interruption works.
- How and when graders receive `tracking-interrupted`.
- How reacquisition becomes valid again.
- Whether an invalid frame can slip through on the same update that invalidates readiness.
- Whether readiness state carries between assessment items.
- Whether retry constructs a fresh readiness state.
- Whether a subject-gone or stream-gap event clears dwell state.
- Whether completed evidence survives interruption as intended.

Do not modify code until this trace is complete.

## Step 2: Correct ambiguous-view prompt routing

Update the authoritative movement-camera-readiness logic.

Required mapping:

| State | Side-view movement | Front-view movement |
|---|---|---|
| Detected view is clearly wrong | `turn-side-on` | `face-forward` |
| Detected view is ambiguous | `turn-side-on` | `face-forward` |
| Correct view, dwell incomplete | `hold-still` | `hold-still` |
| Required chains missing | whole-body / step-into-frame guidance | whole-body / step-into-frame guidance |
| Ready | ready state | ready state |

Requirements:

- Prompt routing must be determined in the authoritative readiness module, not recreated independently in screens.
- Visible copy and voice cue must describe the same corrective action.
- Reuse bundled cues.
- Do not add runtime text-to-speech.
- Do not add new audio dependencies.
- Do not add camera preview video.
- Preserve prompt throttling and voice priority.
- Do not repeatedly emit the same cue every frame.
- A directional cue must not remain latched after the correct view has been acquired.
- `hold-still` must not be emitted while detected view is ambiguous.

If visible copy cannot express “a little more” through current types, use the closest calm directional text supported by the existing architecture. Do not redesign the screen.

## Step 3: Verify and harden the readiness time contract

The readiness dwell remains 500 ms.

Establish and test one explicit boundary rule.

Recommended rule:

```text
ready when continuous valid elapsed time >= 500 ms
```

Verify:

- A single correct frame is not ready.
- 499 ms is not ready.
- Exactly 500 ms is ready.
- More than 500 ms is ready.
- Frame count does not determine readiness.
- A 10 FPS sequence and a 60 FPS sequence become ready according to elapsed timestamps, not number of samples.
- A wrong or ambiguous frame resets the dwell.
- Insufficient chains reset the dwell.
- Non-finite geometry resets or rejects the dwell.
- Subject-gone resets the dwell.
- Stream-gap interruption resets the dwell.
- Retry resets the dwell.
- New assessment resets the dwell.
- Cancellation clears the active readiness state.
- Correct view after a reset requires a fresh full dwell.

If duplicate or decreasing timestamps reach the readiness helper:

- They must not advance readiness.
- They must not create negative stable duration.
- They must fail closed or preserve the previous safe state.
- Do not change native timestamp behaviour in this task.

## Step 4: Verify countdown invalidation

Add authoritative tests for:

1. Correct view becomes ready.
2. Instructions complete.
3. Countdown begins.
4. View becomes wrong, ambiguous, unreliable, or non-finite before `go`.

Required result:

- Countdown is cancelled or returned to preflight according to the existing state machine.
- Active measurement does not begin.
- The grader does not consume countdown or invalid frames.
- A stale countdown callback cannot later enter active state.
- A stale `go` voice or visible state does not contradict the controller.
- Returning to correct view requires a fresh 500 ms dwell.
- A new countdown begins only after normal voice-idle rules are satisfied.

Test at least:

- Chair stand: side -> front during countdown.
- Balance: front -> side during countdown.
- Shoulder: side -> ambiguous during countdown.
- Hinge: side -> insufficient chains during countdown.

Do not create four duplicate implementations; tests may share helpers while preserving movement-specific assertions.

## Step 5: Verify active interruption for every production assessment

### Chair stand

Prove:

- A fully credited rep remains credited after later view loss.
- A rep that is partially complete when view becomes invalid does not complete.
- Invalid frames cannot update knee angle, rise window, or velocity.
- Reacquisition requires a fresh readiness dwell.
- The first valid frame after reacquisition does not reuse a pre-interruption partial rep state.
- A new full seated-to-standing cycle can be counted normally after reacquisition.

### Balance ladder

Prove:

- View or chain loss stops valid hold accumulation.
- Invalid frames cannot complete a hold stage.
- Existing fixed stage-clock behaviour remains unchanged.
- Reacquisition requires a fresh readiness dwell before valid hold time resumes.
- No pre-interruption hold tracker state leaks into the reacquired interval except where the current explicitly intended hold-interruption semantics preserve credited valid time.
- Do not decide or change whether the stage schedule itself pauses.

### Shoulder flexion

Prove:

- Wrong/ambiguous view cannot update valid time.
- Wrong/ambiguous view cannot update the official peak.
- An incomplete valid capture followed by view loss remains unmeasured.
- Reacquisition requires a fresh readiness dwell.
- A later genuinely complete capture can produce a valid result.
- A capture that completed before a later interruption remains valid under the Stage 2A contract.
- Invalid frames after completion cannot improve the official peak.

### Hinge reach

Prove:

- Wrong/ambiguous view cannot update valid time.
- Wrong/ambiguous view cannot update official reach.
- Standing-only or incomplete evidence remains unmeasured.
- Reacquisition requires a fresh readiness dwell.
- A later genuinely complete hinge can produce a valid result.
- A capture completed before later interruption remains valid under the Stage 2A contract.
- Invalid frames after completion cannot improve official reach.

## Step 6: Verify reset isolation between assessments

Test the production `DEFAULT_BATTERY` transitions:

1. Chair stand side view -> balance front view.
   - Chair readiness must not satisfy balance.
   - Balance waits for a new front-view dwell.

2. Balance front view -> shoulder side view.
   - Balance readiness must not satisfy shoulder.
   - Shoulder waits for a new side-view dwell.

3. Shoulder side view -> hinge side view.
   - Even though both require side view, shoulder readiness must not carry into hinge.
   - Hinge requires a fresh item-specific 500 ms dwell.

4. Retry current assessment.
   - Previous dwell, prompt state, controller state, partial grader state, and staged result are cleared.

5. Skip current assessment.
   - Its partial readiness and grader evidence do not enter the next item.

6. Subject-gone then another subject enters.
   - Existing dwell is cleared.
   - Do not attempt full identity continuity in this task.
   - New usable frames must satisfy readiness from zero.

7. Stream gap longer than the pipeline interruption threshold.
   - Existing readiness is cleared.
   - Resume requires a fresh dwell.

## Step 7: Verify malformed and boundary geometry

Add tests for the movement readiness classifier using realistic minimum pose objects.

Cover:

- `NaN` shoulder coordinate.
- `Infinity` hip coordinate.
- Zero or near-zero torso length.
- Missing shoulder landmark.
- Missing hip landmark.
- Visibility/reliability below requirement.
- One valid chain for a two-chain movement.
- Mirrored side view.
- Mirrored front view.
- Borderline geometry on each side of front threshold.
- Borderline geometry on each side of side threshold.
- Geometry between thresholds.

Required behaviour:

- No throw.
- No false ready state.
- Non-finite or unusable geometry fails closed.
- Threshold boundary behaviour is deterministic.
- Ambiguous geometry gives the directional cue required by the current movement.
- The classifier does not depend on screen pixels or preview dimensions.

Do not broaden this into a global native-payload sanitisation refactor.

## Step 8: Verify ROM result classification end to end

Construct realistic Check-Up outcomes through the real movement graders and scoring path.

### Fallback-only mobility evidence

Create a Check-Up where:

- Chair stand is skipped or unmeasured.
- Balance is skipped or unmeasured.
- Shoulder produces a high temporary peak but does not complete valid capture.
- Hinge produces standing-only or temporary reach but does not complete valid capture.

Prove:

- Shoulder metric is non-finite/canonical no-measurement.
- Hinge metric is non-finite/canonical no-measurement.
- Both item statuses are unmeasured.
- Mobility is not scored from fallback data.
- No weakest domain is invented.
- Stage 1A eligibility is false.
- Null focus is not converted to strength.
- No block can be created through the defended block service.

### Mixed valid and invalid evidence

Create a Check-Up where:

- Strength is valid.
- Balance is valid.
- Shoulder and hinge fail valid capture.

Prove:

- Valid strength and balance data remain intact.
- Mobility remains unmeasured.
- No fallback mobility value is created.
- Current partial-assessment policy remains unchanged.
- This task does not decide whether the partial assessment should be allowed to create a plan.

### Fully valid battery

Prove:

- All four items remain measured.
- Existing raw metrics are unchanged.
- Existing score is unchanged.
- Existing weakest domain is unchanged.
- Stage 1A remains eligible.
- Valid block creation remains unchanged.

## Step 9: Verify invalid official re-test integration

Using the smallest authoritative orchestration layer available, prove that an official re-test whose only apparent mobility evidence is invalid shoulder/hinge fallback:

- Is stored, if current attempted-history semantics require it, as an invalid/unmeasured attempt.
- Does not become the latest usable official assessment.
- Does not complete or archive the active block.
- Does not generate a block report.
- Does not create a next block.
- Does not overwrite the previous valid official assessment.
- Leaves a retry route.

Prefer testing existing pure orchestration helpers.

Do not introduce a large `App.tsx` refactor solely for this test.

If full app orchestration cannot be tested without an unreasonable refactor:

- Prove the scoring -> MovementAssessment -> Stage 1A eligibility -> defended block service chain.
- Prove existing official re-test guard helpers reject it.
- Document the remaining App-level integration gap honestly.
- Do not claim full acceptance closure without evidence.

## Step 10: Verify screen and guidance behaviour

Inspect the Check-Up setup and result UI.

Prove at the screen/view-model level where practical:

- Ambiguous side-required view displays directional side-turn guidance.
- Ambiguous front-required view displays directional face-forward guidance.
- Correct orientation while waiting for dwell displays `hold-still`.
- Insufficient visibility displays framing/whole-body guidance.
- Failed shoulder or hinge capture does not show a numeric result.
- Failed capture offers retry.
- Explicit skip remains available according to existing rules.
- Retry returns to clean setup.
- The screen, voice cue, controller reason, and movement ID remain aligned.
- No new runtime TTS or camera self-view is introduced.

Do not perform a visual redesign.

## Required automated-test matrix

At minimum, add or extend tests covering the following.

### Readiness prompt semantics

- Ambiguous + side required -> `turn-side-on`.
- Ambiguous + front required -> `face-forward`.
- Correct side + dwell incomplete -> `hold-still`.
- Correct front + dwell incomplete -> `hold-still`.
- Insufficient chains -> whole-body/framing cue.
- Correct view at 500 ms -> ready, no stale directional prompt.

### Time-based readiness

- 499 ms not ready.
- 500 ms ready.
- Low-FPS sequence.
- High-FPS sequence.
- Reset after one invalid sample.
- Duplicate timestamp does not advance.
- Decreasing timestamp does not advance.
- Retry reset.
- Subject-gone reset.
- Stream-gap reset.
- New-item reset.

### Countdown

- Chair wrong view during countdown.
- Balance wrong view during countdown.
- Shoulder ambiguous during countdown.
- Hinge insufficient chains during countdown.
- No stale callback enters active state.

### Active movement interruption

- Chair partial rep invalidated.
- Chair credited rep preserved.
- Balance invalid time not accumulated.
- Shoulder invalid frame cannot update peak/time.
- Hinge invalid frame cannot update reach/time.
- Fresh dwell required before resumption.
- Completed valid ROM survives later interruption without further invalid updates.

### Battery transitions

- Side chair -> front balance.
- Front balance -> side shoulder.
- Side shoulder -> side hinge still resets readiness.

### Geometry

- Non-finite core point.
- Missing core point.
- Zero torso length.
- Mirrored front.
- Mirrored side.
- Ambiguous threshold interval.
- Insufficient chain count.

### Downstream evidence

- Fallback-only mobility -> unmeasured.
- Fallback-only mobility -> no mobility score.
- Fallback-only battery -> Stage 1A ineligible.
- Fallback-only official re-test -> no report or next block through existing guards.
- Fully valid battery remains unchanged.

## Test-quality requirements

Tests must:

- Exercise production helpers and state machines.
- Assert observable state, output, or mutation.
- Use timestamps for dwell behaviour.
- Demonstrate low/high FPS equivalence.
- Fail if ambiguous orientation is mapped back to `hold-still`.
- Fail if stale readiness carries between items.
- Fail if invalid active frames reach graders.
- Fail if ROM fallback reaches scoring.
- Fail if invalid re-test evidence reaches block/report creation.

Tests must not:

- Recreate implementation formulas line by line.
- Assert only that a helper was called.
- Mock the orientation classifier in controller integration tests.
- Update snapshots merely to force a pass.
- Reduce the 500 ms dwell to make tests easier.
- Weaken existing validity thresholds.
- Change the balance clock policy.
- Change scoring norms.
- Depend on wall-clock sleeps.

Use deterministic supplied timestamps.

## Implementation restraint

Only change production code when a new test proves that the current implementation violates a locked rule.

Likely allowable production changes are limited to:

- `src/preflight/movementCameraReadiness.ts`
- Narrow status/view-model wiring for corrected prompt text.
- `src/assessment/sessionController.ts` only if reset or reacquisition is proven incomplete.
- `src/checkup/checkup.ts` only if item transition/retry reset is proven incomplete.
- Movement graders only if invalid-frame interruption is proven incomplete.

Do not assume these files all need changes.

Prefer test-only changes when the implementation already satisfies the invariant.

## Validation commands

Run targeted suites covering:

- Movement camera readiness.
- Pose pipeline interruption.
- Preflight.
- Session controller.
- Check-Up orchestrator.
- Chair stand.
- Balance ladder.
- Shoulder flexion.
- Hinge reach.
- Scoring.
- Assessment creation.
- Stage 1A eligibility.
- Block service eligibility.
- Official re-test orchestration helpers.
- Relevant Check-Up screens/view models.

Then run:

```bash
npm test -- --runInBand
npm run typecheck
npx --no-install expo config --type public
git diff --check
```

Do not install packages.

Record:

- Exact commands.
- Exit codes.
- Targeted suite count.
- Targeted test count.
- Full suite count.
- Full test count.
- Snapshot count.
- Skipped tests.
- Warnings.
- Whether the existing Jest open-handle warning remains.
- Whether the Sentry Expo warning remains.
- Whether a new warning was introduced.
- Whether validation commands changed files unexpectedly.

## Verification report

Create exactly one new report:

`docs/audits/HALE_LOGIC_VERIFICATION_STAGE_2A_1.md`

Do not edit previous reports.

The report must include:

1. Scope.
2. Initial worktree status.
3. Current Stage 2A architecture verified.
4. Ambiguous-view prompt defect.
5. Exact prompt mapping before and after.
6. Readiness timing and boundary rule.
7. Countdown invalidation results.
8. Active interruption results by assessment.
9. Reacquisition behaviour.
10. Reset behaviour:
    - retry,
    - subject-gone,
    - stream gap,
    - new item,
    - skip,
    - cancel.
11. Low/high FPS results.
12. Non-finite and malformed geometry results.
13. ROM classification chain.
14. Stage 1A eligibility integration.
15. Official re-test integration.
16. Screen/voice/controller alignment.
17. Tests added or changed.
18. Production files changed, if any.
19. Exact validation results.
20. Remaining physical-device validations.
21. Remaining Stage 2 findings not addressed.
22. Whether Stage 3 is now unblocked.
23. Initial and final Git status.
24. Any concurrent external changes observed.

## Acceptance criteria

Do not mark Stage 2A.1 complete unless all are true:

1. Ambiguous side-required orientation produces directional side-turn guidance.

2. Ambiguous front-required orientation produces directional face-forward guidance.

3. `hold-still` is reserved for correct orientation while readiness dwell is incomplete.

4. Required chain failure remains distinct from orientation failure.

5. Readiness depends on elapsed timestamps, not frame count.

6. Exactly 500 ms satisfies the documented boundary.

7. Low- and high-FPS sequences follow equivalent time semantics.

8. Duplicate/decreasing timestamps cannot falsely advance readiness.

9. View loss during countdown prevents active measurement.

10. No stale countdown callback can start measurement.

11. Invalid active frames do not update any production grader.

12. Chair partial repetitions do not survive interruption.

13. Completed chair repetitions remain credited.

14. Balance invalid time does not accumulate.

15. Shoulder invalid frames do not update valid time or official peak.

16. Hinge invalid frames do not update valid time or official reach.

17. Reacquisition requires a fresh full dwell.

18. Retry clears readiness and partial measurement state.

19. Subject-gone and stream gaps clear readiness.

20. Every assessment transition clears readiness, including shoulder-to-hinge.

21. Non-finite and unusable orientation geometry fails closed.

22. Shoulder fallback-only evidence remains unmeasured.

23. Hinge fallback/standing-only evidence remains unmeasured.

24. Fallback-only mobility cannot reach scoring as a valid metric.

25. A fallback-only Check-Up cannot pass Stage 1A eligibility.

26. Invalid official re-test evidence cannot complete a block, create a report, or create a next block through the tested guards.

27. Fully valid measurements and scoring remain unchanged.

28. TUG remains excluded from `DEFAULT_BATTERY`.

29. Balance stage-clock semantics remain unchanged.

30. Chair-stand velocity logic remains unchanged.

31. All targeted and full tests pass.

32. Typecheck, Expo config, and diff check pass.

33. No unrelated product logic is changed.

34. No user-owned work is reverted or overwritten.

35. No commit, staging, branch, or push occurs.

## Stage 3 decision

At the end of the report, state one of:

- `STAGE 3 UNBLOCKED`
- `STAGE 3 BLOCKED`

Use `STAGE 3 UNBLOCKED` only if:

- The Stage 2A contracts are verified by tests.
- The ambiguous guidance issue is corrected.
- No new P0/P1 software defect is found in the production measurement path.
- Remaining issues are clearly physical-device validation, deferred product policy, or lower-priority hardening items.

Chair-stand real-device velocity validation may remain a pre-beta blocker without blocking the static Stage 3 scoring audit, provided Stage 3 explicitly treats rise velocity’s physical reliability as provisional.

## Final Codex response

Return a concise summary containing:

- Verification report path.
- Whether production code changed.
- Exact ambiguous-view prompt mapping implemented.
- Readiness timing boundary.
- Tests added and changed.
- Targeted validation results.
- Full-suite validation results.
- Confirmation of countdown invalidation.
- Confirmation of active interruption for all four assessments.
- Confirmation of fresh-dwell reacquisition.
- Confirmation of retry and item-transition resets.
- Confirmation of low/high FPS coverage.
- Confirmation of non-finite geometry handling.
- Confirmation that ROM fallback cannot reach scoring or Stage 1A eligibility.
- Confirmation of invalid official re-test protection.
- Confirmation that fully valid outputs remain unchanged.
- Remaining physical-device validations.
- Remaining design decisions.
- `STAGE 3 UNBLOCKED` or `STAGE 3 BLOCKED`.
- Initial and final Git status.
- Any concurrent external changes.
- Confirmation that no commit, staging, branch, or push occurred.
