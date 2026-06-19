You are implementing Stage 2A of Hale’s production-readiness work:

MOVEMENT-SPECIFIC CAMERA READINESS AND ROM VALID-CAPTURE REMEDIATION

This is a narrowly scoped production-code remediation task addressing confirmed findings F2-001, F2-002, and F2-003 from the Stage 2 Movement Check-Up audit.

Read these documents in full before making changes:

- docs/audits/HALE_LOGIC_AUDIT_STAGE_0.md
- docs/audits/HALE_LOGIC_AUDIT_STAGE_1.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_1A.md
- docs/audits/HALE_LOGIC_AUDIT_STAGE_2.md

Do not begin Stage 3 in this task.

## Confirmed defects being fixed

Stage 2 confirmed three production measurement defects.

### F2-001: movement-specific camera readiness is not enforced

The production Movement Check-Up currently performs generic preflight checks for:

- Plausible subject.
- Full-body framing.
- Distance.
- Centring.
- Visibility.
- Stability.
- Lighting.
- Body-unit calibration where required.

However, the session can start without enforcing the current movement’s declared:

- Required camera view.
- Required number of reliable side chains.

The movement definitions describe front or side view, and the app speaks view-change instructions, but these requirements are not part of the actual readiness gate.

As a result:

- A generic standing feed can advance side-view assessments.
- A side-on or insufficiently bilateral pose can advance the front-view balance assessment.
- Voice guidance can tell the user to turn while measurement logic does not verify that they actually turned.
- A plausible but geometrically inappropriate pose can produce an official result.

### F2-002: shoulder flexion fallback can become official evidence

Shoulder flexion has a configured valid-capture target, currently approximately three seconds.

The grader currently:

- Tracks a fallback ROM peak before the valid-capture requirement has completed.
- Returns the fallback peak when the primary valid capture is absent.
- Omits the `no-measurement` result classification when that fallback is finite.
- Allows scoring to treat the fallback as an official measured mobility value.

### F2-003: hinge reach fallback can become official evidence

Hinge reach has the same defect:

- Fallback reach is accumulated outside the valid-capture gate.
- The fallback can be returned as the official result.
- A standing-only sequence is currently accepted by an existing test as a measured result.
- Scoring can therefore trust a value that did not satisfy the intended hinge-validity condition.

## Objective

Implement a conservative measurement contract so that:

1. Every production assessment must pass generic preflight and movement-specific camera readiness before instructions/countdown can progress into active measurement.

2. The app must verify both:
   - The required reliable side-chain count.
   - The required front-versus-side camera orientation.

3. Wrong, ambiguous, unstable, or insufficiently reliable camera views fail closed.

4. Losing the required camera view during active measurement prevents those frames from contributing to the result.

5. Shoulder flexion and hinge reach become officially measured only when their configured valid-capture target completes.

6. Shoulder and hinge fallback values cannot enter:
   - Official result metrics.
   - Scoring.
   - Progress history as measured evidence.
   - Weakest-domain selection.
   - Stage 1A block-creation eligibility.

7. Valid existing measurements continue to produce the same metric values and downstream behaviour.

## Locked product decisions for Stage 2A

Use the following rules for this patch.

### Camera-readiness rule

Retain the existing generic preflight and add a separate movement-specific readiness gate.

Do not replace the entire generic preflight implementation unless the current architecture makes a small extension clearly safer than a separate gate.

A movement may progress toward active measurement only when all are true:

- Generic preflight is ready.
- Required body-unit calibration is available where applicable.
- The required number of reliable side chains is present.
- The detected camera view matches the movement definition.
- The matching view has remained stable for a sustained readiness window.
- The pose values used for readiness are finite and internally usable.
- Voice state permits the next transition.

A single good frame is not sufficient.

### Wrong-view rule

Wrong or ambiguous view must block measurement.

Use calm prompts such as:

- “Turn so your side faces the camera.”
- “Turn to face the camera.”
- “Hold that position for a moment.”
- “Make sure your whole body is visible.”

Do not:

- Silently allow a wrong view.
- Automatically skip the assessment.
- Treat chain count alone as proof of orientation.
- Repeatedly speak the same prompt every frame.
- Display a technical tracking error.
- Show the camera preview.

### ROM valid-capture rule

For shoulder flexion and hinge reach:

- The official metric requires completion of the current configured valid-time target.
- Preserve the current target durations and movement-validity thresholds in this task.
- Do not change the current shoulder-angle or hinge-trunk-angle thresholds.
- Do not change scoring norms or age bands.
- Do not use a fallback peak/reach as an official result.
- If valid capture does not complete, return an explicit no-measurement/unmeasured outcome.
- The user should be offered a calm retry path.
- A fallback may remain internal diagnostic data only if there is already a safe, clearly non-scoreable diagnostics representation.
- Do not add a new persisted result field solely to preserve a fallback.
- It is acceptable to discard the fallback instead of persisting it.
- No user-facing result screen may show the fallback as their measured result.

### Check-Up-type rule

The per-assessment measurement-validity contract is the same for:

- Baseline.
- Official re-test.
- Manual extra Check-Up.

Manual extra Check-Ups may remain non-official at the overall product level, but they must not display unreliable measurements as though they were valid.

### Balance interruption rule

Do not change the balance-ladder interruption clock policy in this task.

The current behaviour—hold accumulation stops while the fixed stage schedule continues—is a separate product decision.

Camera-view loss during balance should use the existing interruption mechanism, but this task must not redesign the ladder schedule.

### Chair-stand velocity rule

Do not change chair-stand velocity formulas, rep thresholds, timestamp handling, or smoothing in this task.

Real-device chair-stand noise-floor validation remains a separate Stage 2B requirement.

## Explicitly out of scope

Do not fix these items in Stage 2A:

- Chair-stand velocity noise-floor validation.
- Native timestamp coercion.
- Subject identity continuity when another person enters frame.
- Global non-finite landmark sanitisation outside the new readiness boundary.
- Balance stage-clock policy.
- Check-Up history filename collisions.
- Scoring norms or movement-age bands.
- Stage 3 scoring interpretation.
- Account/local-data isolation.
- Dynamic workout generation.
- Exercise catalogue metadata.
- Training-session completion semantics.
- Legacy workout fallback.
- Session-type filtering.
- UI redesign unrelated to setup/retry guidance.
- TUG implementation.
- Any unrelated navigation, Today, Plan, Progress, Explore, or Settings work.

Do not perform opportunistic refactors.

## Working-tree safety

The Stage 2 audit observed concurrent external changes while it was running.

Before editing:

1. Run:

   `git status --short --untracked-files=all`

   `git diff --name-only`

   `git diff --stat`

2. Record the full initial status.

3. Inspect the current diffs in every file that this remediation may touch.

4. Verify that the Stage 2 call paths still match the current working tree.

5. Record any material differences from the Stage 2 report.

6. Treat all existing changes as user-owned.

7. Do not revert, overwrite, format, move, or delete unrelated work.

8. Do not modify the Stage 0, Stage 1, Stage 1A, or Stage 2 reports.

9. Do not use destructive Git commands.

10. Do not commit or push.

11. If unrelated files begin changing while this task is running:
    - Do not overwrite them.
    - Do not attempt to clean the worktree.
    - Record the concurrent changes.
    - Continue only where the task’s files remain safe and unambiguous.
    - Otherwise stop code mutation and report the conflict honestly.

## Step 1: Re-verify the production path

Before implementing, trace the current code path:

`CheckUpScreen`
-> `PoseDetectionView`
-> native landmark event
-> `PosePipeline`
-> `PreflightCheck`
-> `CheckUpOrchestrator`
-> current `MovementDefinition`
-> `SessionController`
-> movement grader
-> `CheckUpItem`
-> `scoreCheckUp`
-> `createMovementAssessment`
-> Stage 1A eligibility

Verify:

- Where `MovementDefinition.cameraView` is defined.
- Its exact current type and fields.
- How `requiredReliableSideChains` is represented.
- How chain reliability is exposed by `PosePipeline`.
- Whether any camera-view inference helper already exists.
- Whether the controller already receives the current movement definition.
- How status and prompts reach `CheckUpScreen`.
- How a tracking interruption is represented to graders.
- How retry resets controller and preflight state.
- How shoulder/hinge valid-time completion is represented.
- How `no-measurement` is represented in current result types.
- How unmeasured item results reach scoring and Stage 1A.

Do not assume the Stage 2 line numbers remain exact.

## Step 2: Add an authoritative movement-camera-readiness contract

Create or identify one pure, reusable source of truth for movement-specific camera readiness.

Use the location that best fits the current architecture, such as:

- `src/preflight/movementCameraReadiness.ts`
- `src/pose/cameraViewReadiness.ts`
- A narrowly scoped extension to an existing readiness module.

Do not duplicate camera-view logic independently inside all four movement graders.

A conceptual result shape could resemble:

```ts
type DetectedCameraView = 'front' | 'side' | 'ambiguous';

type MovementCameraReadinessReason =
  | 'ready'
  | 'invalid_pose'
  | 'insufficient_reliable_chains'
  | 'turn_side_on'
  | 'face_camera'
  | 'unstable_view';

type MovementCameraReadinessResult = {
  ready: boolean;
  requiredView: 'front' | 'side';
  detectedView: DetectedCameraView;
  reliableSideChains: number;
  stableForMs: number;
  reason: MovementCameraReadinessReason;
};
```

Adapt this to the real types.

Requirements:

- Pure or encapsulated behind a small deterministic state object.
- Uses the actual `MovementDefinition.cameraView` contract.
- Uses existing chain-reliability output rather than reimplementing confidence windows.
- Treats chain count and orientation as separate requirements.
- Handles mirrored coordinates correctly.
- Uses scale-invariant body geometry.
- Does not rely on hard-coded pixel dimensions.
- Does not depend on camera-preview layout dimensions.
- Does not use a single frame as sufficient proof.
- Classifies uncertain geometry as ambiguous.
- Fails closed on non-finite values.
- Supports reset.
- Supports pause/time-shift if needed by the existing orchestrator.
- Produces stable reason codes for UI, voice, tests, and observability.
- Does not throw for ordinary wrong-view or low-confidence poses.

### Critical orientation requirement

Do not implement this as only:

```ts
reliableSideChains >= requiredReliableSideChains
```

That is necessary but insufficient.

A clearly front-facing pose with two reliable chains must not automatically satisfy a side-view assessment merely because it has at least one reliable chain.

A clearly side-on pose with one reliable chain must not satisfy the front-view balance assessment.

Inspect the existing landmark geometry and use a conservative front/side classifier.

A suitable approach may use normalized, scale-invariant relationships such as:

- Visible horizontal shoulder separation relative to torso length.
- Visible horizontal hip separation relative to torso length.
- Agreement between shoulder and hip geometry.
- Existing reliable-chain state.
- A sustained sample rather than a single-frame classification.

This is only a conceptual direction. Use the safest implementation supported by the actual code.

Do not tune the implementation solely to make one synthetic fixture pass.

Requirements for the view classifier:

- Clearly front -> front.
- Clearly side -> side.
- Uncertain or transitional -> ambiguous.
- Mirrored front -> still front.
- Mirrored side -> still side.
- Low-confidence/non-finite geometry -> ambiguous or invalid.
- Brief rotation noise -> no immediate ready/not-ready flip.
- Side detection must allow either the left or right side to face the camera.

If the current pose contract genuinely cannot support a defensible orientation classifier, do not pretend that chain-count enforcement solves F2-001. Implement what is provable, document the unresolved blocker, and do not mark F2-001 complete.

## Step 3: Use sustained movement-specific readiness

Movement-camera readiness must require stability over time.

Prefer reusing or deriving from an existing readiness/stability duration rather than introducing an unrelated arbitrary number.

If a separate duration is necessary:

- Centralise it in configuration.
- Document its purpose.
- Use timestamps, not frame count alone.
- Ensure low and high frame rates have equivalent semantics.
- Make the boundary deterministic and directly tested.

Reset sustained readiness when:

- The assessment changes.
- The user retries.
- Subject-gone occurs.
- A stream gap invalidates current tracking.
- The required view becomes ambiguous or wrong.
- Required chain reliability falls below the movement’s requirement.
- The pose becomes non-finite or invalid.
- The user cancels.

Do not reset the global body-unit calibration merely because the item-specific view gate resets unless existing product logic explicitly requires that.

## Step 4: Integrate readiness into session start

Wire the authoritative readiness contract into the production assessment path.

The current assessment must not leave setup/preflight for instructions/countdown until all relevant gates are satisfied.

The effective readiness rule should be conceptually equivalent to:

```text
genericPreflightReady
AND requiredBodyUnitAvailable
AND movementCameraViewReady
AND voiceTransitionReady
```

Update the appropriate combination of:

- `PreflightCheck`
- `CheckUpOrchestrator`
- `SessionController`
- Check-Up status/view-model types
- `CheckUpScreen`

Use the smallest coherent architecture.

Preferred separation:

- Generic `PreflightCheck` continues to own general framing, lighting, distance, and stability.
- A movement-specific readiness object owns front/side orientation and required reliable chains.
- `SessionController` or the orchestrator combines them into one start gate.

Do not create separate independent readiness implementations inside the screen and controller.

### Required behaviour

For chair stand:

- Require side view.
- Require the declared reliable-chain count.
- Do not begin countdown from a clearly front-facing pose.

For balance:

- Require front view.
- Require the declared bilateral/two-chain reliability.
- Do not begin countdown from a clearly side-on or one-chain pose.

For shoulder flexion:

- Require side view.
- Require the declared reliable-chain count.
- Do not begin countdown from a clearly front-facing pose.

For hinge reach:

- Require side view.
- Require the declared reliable-chain count.
- Do not begin countdown from a clearly front-facing pose.

For transitions:

- Reset movement-specific readiness for every new assessment, including shoulder-to-hinge even though both use side view.
- Allow correct view to reacquire quickly through the normal sustained window.
- Do not carry a previous assessment’s ready state into the next assessment.

## Step 5: Enforce view validity during active measurement

Do not limit the fix to the instant before countdown.

Continue evaluating movement-camera readiness while the assessment is active.

When view validity or required chain reliability is lost beyond the normal transient tolerance:

- Stop forwarding those pose frames as valid measurement evidence.
- Emit or invoke the existing canonical tracking-interruption behaviour.
- Reset any in-flight partial state according to that grader’s existing interruption semantics.
- Preserve already credited complete chair-stand repetitions.
- Do not complete a partial chair-stand repetition.
- Do not accumulate balance hold time.
- Do not accumulate shoulder/hinge valid time.
- Do not update official shoulder/hinge peaks.
- Require sustained correct-view reacquisition before valid frames resume.

Do not misuse a subject-gone event if the architecture already has a more accurate interruption concept.

If no suitable interruption event exists, add the narrowest possible representation and map it to the existing grader reset semantics.

Do not redesign the balance fixed-stage clock in this task. It may continue to consume schedule time during interruption according to current behaviour.

## Step 6: Align visual and spoken guidance

The visible setup state, spoken prompt, controller state, and measurement gate must agree.

Required UI states should distinguish at least:

- General framing issue.
- Need to face the camera.
- Need to turn side-on.
- Insufficient reliable body visibility.
- Correct position, hold still.
- Ready/countdown.
- Measurement interrupted, return to position.

Reuse existing bundled voice cues wherever possible.

Do not:

- Add runtime text-to-speech.
- Add a second overlapping voice channel.
- Repeatedly replay the same cue every frame.
- Start countdown while a repositioning cue is still active.
- Continue saying “turn sideways” after active measurement has already started.
- Show one movement while the controller measures another.

Respect existing voice-priority and cooldown behaviour.

The setup timeout and retry/skip controls must remain available when the user cannot satisfy view readiness.

## Step 7: Harden shoulder-flexion official measurement

Inspect the current:

- Fallback peak.
- Primary valid peak.
- Valid-time state.
- Completion result.
- Result flags.
- Scoring handoff.
- Tests.

Implement this rule:

```text
shoulder flexion is officially measured
ONLY IF
the configured valid-capture target completed
AND
the official peak is finite
AND
the required camera view/chains were valid for contributing frames
```

When the rule is not satisfied:

- Return the repository’s canonical no-measurement/unmeasured state.
- Do not expose fallback peak as `peakFlexionDeg` or equivalent official metric.
- Do not let `CheckUpOrchestrator` classify it as measured.
- Do not let scoring use it.
- Do not let it affect mobility domain output.
- Do not let it affect weakest-domain selection.
- Do not let it make Stage 1A eligibility succeed.
- Do not show the fallback number to the user.
- Offer a retry path.

A fallback may remain only as:

- An internal local variable.
- A development diagnostic.
- An existing clearly non-scoreable diagnostics field.

Do not introduce a broad schema migration solely to retain it.

Preserve:

- Current valid-position predicate.
- Current target duration.
- Current smoothing.
- Current angle calculation.
- Current valid-result value.
- Current valid-result flags.
- Existing interruption semantics unless directly required for this fix.

## Step 8: Harden hinge-reach official measurement

Apply the equivalent rule:

```text
hinge reach is officially measured
ONLY IF
the configured valid-capture target completed
AND
the official reach metric is finite
AND
the required camera view/chains were valid for contributing frames
```

When the rule is not satisfied:

- Return canonical no-measurement/unmeasured state.
- Do not expose fallback reach as the official metric.
- Do not allow standing-only frames to produce a measured hinge result.
- Do not allow scoring to use the value.
- Do not allow it to influence the mobility domain or weakest domain.
- Do not show a numeric result.
- Offer a retry path.

Update the current standing-only test. The expected behaviour must become:

- Unmeasured/no-measurement.
- Retry guidance available.
- No official hinge metric.

Preserve:

- Current trunk-angle predicate.
- Current target duration.
- Current body-unit normalisation.
- Current smoothing.
- Current valid result for a genuinely completed capture.
- Current valid-result ordering and scale-invariance behaviour.

Do not redesign the hinge metric in this task.

## Step 9: Add calm retry behaviour

When shoulder or hinge ends without valid capture:

- Do not describe the result as a successful measurement.
- Do not blame the user.
- Do not use technical pose terminology.
- Do not automatically create a number from partial evidence.

Use calm copy such as:

“We couldn’t get a reliable measurement for this movement.”

Supporting copy may say:

“Try once more and hold the position until Hale confirms the measurement.”

The user should be able to:

- Retry the current assessment.
- Return to setup.
- Skip according to existing Check-Up rules.
- Cancel the Check-Up according to existing rules.

Retry must reset:

- Movement-specific view readiness.
- The assessment controller.
- Grader state.
- Valid-time state.
- Primary and fallback peaks/reaches.
- Interruption flags that should not survive a fresh attempt.
- Any result already staged for the current item.

Retry must not reset:

- Previously completed assessment results.
- The entire Check-Up.
- Body-unit calibration unless current architecture requires recalibration.
- Check-Up type.
- Stage 1A eligibility state from previously completed results.

Avoid infinite forced-retry loops. Skip must remain explicit.

## Step 10: Preserve Stage 1A behaviour

After the changes, verify the full handoff:

### Invalid ROM-only evidence

A Check-Up where:

- Chair stand is skipped/unmeasured.
- Balance is skipped/unmeasured.
- Shoulder has only fallback evidence.
- Hinge has only fallback or standing-only evidence.

Must result in:

- Shoulder item unmeasured.
- Hinge item unmeasured.
- No measured domain.
- Ineligible Stage 1A result.
- No plan creation.
- No official re-test report or next block.

### Mixed valid and invalid evidence

A Check-Up where:

- Strength or balance is valid.
- Shoulder/hinge valid capture fails.

Must:

- Keep shoulder/hinge unmeasured.
- Preserve valid strength/balance evidence.
- Follow the current partial-assessment policy.
- Not invent a mobility score from fallback values.

Do not decide the final minimum-domain policy in this patch. Stage 3 will audit it.

## Step 11: Preserve valid measurements exactly

For valid synthetic inputs already accepted by the current tests:

- Chair-stand rep counts must remain unchanged.
- Chair-stand rise velocity must remain unchanged.
- Balance hold measurements must remain unchanged.
- Valid shoulder peak must remain unchanged.
- Valid hinge reach must remain unchanged.
- Scoring for a fully valid four-item Check-Up must remain unchanged.
- Stage 1A eligibility for a fully valid Check-Up must remain unchanged.
- Valid baseline block creation must remain unchanged.
- Valid official re-test behaviour must remain unchanged.

Document any unavoidable output difference.

Do not change existing measurement thresholds to make new readiness tests easier to pass.

## Required automated tests

Add tests at the lowest authoritative level plus integration tests proving the real path.

Do not rely only on UI snapshots.

### A. Camera-view classification tests

Cover at least:

1. Clearly front-facing pose:
   - Classified front.
   - Satisfies front after sustained readiness.
   - Does not satisfy side.

2. Clearly side-facing pose:
   - Classified side.
   - Satisfies side after sustained readiness.
   - Does not satisfy front.

3. Mirrored front-facing pose:
   - Still classified front.

4. Mirrored side-facing pose:
   - Still classified side.

5. Ambiguous three-quarter pose:
   - Classified ambiguous.
   - Does not become ready.

6. One-frame correct view:
   - Does not become ready.

7. Sustained correct view:
   - Becomes ready at the configured boundary.

8. Brief jitter across the classification threshold:
   - Does not rapidly flip into ready.

9. Non-finite coordinate:
   - Fails closed without throwing.

10. Insufficient chain reliability:
    - Correct orientation alone is not enough.

11. Required one-chain side assessment:
    - One reliable side chain can satisfy chain requirement.

12. Required two-chain front assessment:
    - One reliable chain cannot satisfy readiness.

### B. Session-controller readiness tests

Prove:

1. Generic preflight ready plus wrong view:
   - Instructions/countdown do not start.

2. Generic preflight ready plus correct view but insufficient chains:
   - Instructions/countdown do not start.

3. Generic preflight ready plus correct sustained view and chains:
   - Normal phase progression occurs.

4. Voice busy while view becomes ready:
   - Countdown does not begin early.

5. View becomes invalid during countdown:
   - Active measurement does not start from stale readiness.

6. View becomes invalid during active measurement:
   - Invalid frames do not reach the grader as valid evidence.

7. Correct view is reacquired:
   - Measurement resumes only after the sustained readiness window.

8. Retry:
   - Clears previous ready state.

9. New assessment:
   - Clears previous ready state.

10. Subject-gone:
    - Clears movement-specific readiness.

### C. Per-assessment wrong-view tests

Chair stand:

- Front-facing feed cannot start or count chair-stand reps.
- Correct side view can start.
- Mid-rep view loss cannot complete the rep.

Balance:

- Side-on/one-chain feed cannot start the balance ladder.
- Correct bilateral front view can start.
- Mid-hold view loss stops valid hold accumulation.

Shoulder:

- Front-facing feed cannot start official capture.
- Correct side view can start.
- Wrong-view frames cannot update official peak.

Hinge:

- Front-facing feed cannot start official capture.
- Correct side view can start.
- Wrong-view frames cannot update official reach.

### D. Shoulder valid-capture tests

Cover:

1. Full valid capture:
   - Measured.
   - Existing peak preserved.

2. High fallback peak but valid-time target incomplete:
   - Unmeasured/no-measurement.
   - No official peak.

3. Exactly below valid-time boundary:
   - Unmeasured.

4. Exactly at valid-time boundary:
   - Measured according to one documented inclusive/exclusive rule.

5. Valid time followed by tracking interruption:
   - Behaviour follows the current valid-time contract and is explicitly tested.

6. One extreme outlier before valid capture:
   - Cannot become official result.

7. Retry after failed capture:
   - Previous fallback/peak is cleared.

8. Scoring:
   - Failed capture contributes no mobility measurement.

### E. Hinge valid-capture tests

Cover:

1. Full valid capture:
   - Measured.
   - Existing reach preserved.

2. Standing-only sequence:
   - Unmeasured/no-measurement.

3. Large fallback reach with incomplete valid time:
   - Unmeasured.

4. Exactly below target:
   - Unmeasured.

5. Exactly at target:
   - Measured according to the documented boundary.

6. Tracking interruption before completion:
   - Cannot return fallback as official.

7. Retry:
   - Clears fallback and valid-time state.

8. Scoring:
   - Failed capture contributes no mobility measurement.

### F. Orchestrator integration tests

Cover:

1. Generic standing feed no longer advances all four production assessments as measured.

2. Battery transition from chair side view to balance front view:
   - Balance waits for front readiness.

3. Battery transition from balance front view to shoulder side view:
   - Shoulder waits for side readiness.

4. Shoulder-to-hinge:
   - New item readiness is reset even though both require side view.

5. Failed shoulder/hinge capture:
   - Item status is unmeasured.
   - Retry is possible.
   - Skipping remains explicit.

6. Full valid four-item battery:
   - Completes once.
   - Results remain measured.
   - Existing score remains unchanged.

7. TUG:
   - Remains excluded from `DEFAULT_BATTERY`.

### G. Stage 1A integration tests

Cover:

1. Only fallback shoulder/hinge evidence:
   - No measured domain.
   - Block creation ineligible.

2. Invalid official re-test containing only fallback mobility evidence:
   - Does not complete active block.
   - Does not create report.
   - Does not create next block.

3. Valid strength plus invalid mobility:
   - Mobility remains unmeasured.
   - Valid strength is preserved.
   - Current partial-evidence policy is unchanged.

## Test-quality requirements

Tests must:

- Exercise real production helpers where practical.
- Use timestamps, not only frame counts.
- Include low- and high-frame-rate variants for readiness stability.
- Avoid reproducing implementation formulas line for line.
- Assert observable state transitions and result classifications.
- Fail if chain-count-only gating is mistakenly used as full orientation validation.
- Fail if fallback ROM returns as an official metric.
- Fail if the screen/controller can start measurement while the required view is wrong.
- Fail if stale readiness carries between assessments.

Do not:

- Update snapshots merely to force a pass.
- Weaken existing assertions without explaining why the old assertion encoded the defect.
- Mock the grader so heavily that invalid capture cannot occur.
- Assert only that a helper was called.
- Mark wrong-view tests as device-only when the state transition is testable synthetically.

## Validation commands

Run:

1. Targeted tests for:
   - Pose/view readiness.
   - Preflight.
   - Session controller.
   - Check-Up orchestrator.
   - Chair stand.
   - Balance.
   - Shoulder flexion.
   - Hinge reach.
   - Scoring handoff.
   - Stage 1A eligibility.

2. Full suite:

   `npm test -- --runInBand`

3. Type checking:

   `npm run typecheck`

4. Expo config:

   `npx --no-install expo config --json`

5. Diff validation:

   `git diff --check`

Record:

- Exact commands.
- Exit codes.
- Suite counts.
- Test counts.
- Snapshot counts.
- Skipped tests.
- Warnings.
- Whether the existing Jest open-handle warning remains.
- Whether any new warning was introduced.
- Whether any command changed a file unexpectedly.

Do not install dependencies.

## Manual source verification after tests

After all tests pass, manually retrace:

### Chair stand

Generic preflight
-> side-view gate
-> countdown
-> active measurement
-> view loss
-> grader interruption
-> result

Confirm wrong/front view cannot contribute reps or velocity.

### Balance

Generic preflight
-> front/two-chain gate
-> countdown
-> active hold
-> view/chain loss
-> interruption

Confirm invalid frames do not count as hold time.

### Shoulder

Generic preflight
-> side-view gate
-> valid-time capture
-> official peak

Confirm fallback-only evidence becomes unmeasured.

### Hinge

Generic preflight
-> side-view gate
-> valid-time capture
-> official reach

Confirm standing-only and fallback-only evidence become unmeasured.

### Stage 1A

Unmeasured ROM result
-> scoring
-> MovementAssessment
-> eligibility

Confirm the eligibility gate receives truthful upstream status.

## Remediation report

Create:

`docs/audits/HALE_LOGIC_REMEDIATION_STAGE_2A.md`

Include:

1. Scope.
2. Original findings F2-001, F2-002, and F2-003.
3. Product rules implemented.
4. Final movement-camera-readiness contract.
5. View-classification approach.
6. Stable-readiness timing rule.
7. Active-measurement interruption behaviour.
8. Shoulder valid-capture contract.
9. Hinge valid-capture contract.
10. Retry and user-guidance behaviour.
11. Files changed.
12. Tests added or changed.
13. Existing tests whose old expectation encoded a defect.
14. Exact validation results.
15. Before/after status of relevant Stage 2 invariants.
16. Stage 1A handoff verification.
17. Remaining Stage 2 findings not fixed.
18. Physical-device validation still required.
19. Any limitations of synthetic camera-view classification.
20. Initial and final Git status.
21. Any concurrent external changes observed.

Do not edit previous audit reports.

## Required invariant outcomes

After Stage 2A, these must hold:

- Side-view requirements are enforced before side-view items start.
- Front-view bilateral requirements are enforced before balance starts.
- Required chain count is enforced.
- Correct chain count alone cannot bypass wrong orientation.
- Wrong/ambiguous view cannot start countdown.
- Stale ready state cannot carry to a new item.
- Invalid-view active frames cannot contribute measurement evidence.
- Shoulder official result requires completed valid capture.
- Shoulder fallback is not official.
- Hinge official result requires completed valid capture.
- Standing-only hinge is unmeasured.
- Hinge fallback is not official.
- `measured` means usable evidence exists for these ROM assessments.
- Scoring ignores failed ROM captures.
- Stage 1A rejects a Check-Up whose only apparent evidence is ROM fallback.
- Valid assessment outputs remain unchanged.

## Acceptance criteria

Do not mark Stage 2A complete unless all are true:

1. Generic preflight alone cannot start a movement assessment.

2. Item-specific view and chain requirements are part of the authoritative start gate.

3. Actual orientation is checked; chain count is not used as an orientation substitute.

4. Wrong and ambiguous views fail closed.

5. Camera readiness is sustained over time rather than accepted from one frame.

6. View readiness resets on retry, subject loss, stream gap, and item transition.

7. Invalid-view active frames do not update graders.

8. Shoulder fallback evidence cannot become measured.

9. Hinge fallback evidence cannot become measured.

10. Standing-only hinge is unmeasured.

11. Failed ROM capture produces calm retry guidance.

12. Valid shoulder and hinge output values remain unchanged.

13. Fully valid Check-Up scoring remains unchanged.

14. Stage 1A continues to block invalid evidence.

15. TUG remains outside the default battery.

16. Targeted and full tests pass.

17. Typecheck, Expo config, and diff check pass.

18. No unrelated Stage 2 finding is folded into the patch.

19. No unrelated user work is reverted or overwritten.

20. No commit or push occurs.

## Final Codex response

Return a concise summary containing:

- Remediation report path.
- Exact product rules implemented.
- Camera-view readiness architecture chosen.
- How front versus side view is detected.
- Stable-readiness duration and boundary rule.
- Files changed.
- Tests added and tests changed.
- Full targeted and full-suite validation results.
- Confirmation that wrong-view assessments cannot begin.
- Confirmation that chain count alone cannot satisfy orientation.
- Confirmation that shoulder fallback cannot become official.
- Confirmation that hinge fallback and standing-only input cannot become official.
- Confirmation that valid metrics remain unchanged.
- Confirmation that Stage 1A handoff remains correct.
- Remaining Stage 2 beta blockers.
- Physical-device validations still pending.
- Initial and final Git status.
- Any concurrent external changes observed.
- Confirmation that no unrelated code was changed.
- Confirmation that no commit or push occurred.
