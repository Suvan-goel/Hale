# Pearl Logic Verification Stage 2A.1

Date: 2026-06-19

## 1. Scope

Stage 2A.1 was a narrow verification and hardening pass for movement camera readiness. It corrected the confirmed ambiguous-orientation guidance defect, added automated coverage for readiness timing, countdown invalidation, active interruption, resets, ROM no-measurement propagation, Stage 1A eligibility, and invalid official re-test guards, and did not begin Stage 3.

## 2. Initial Worktree Status

Initial `git status --short --untracked-files=all`:

```text
?? docs/audits/Pearl_Stage_2A_1_Verification_and_Hardening_Prompt.md
```

Initial `git diff --name-only`: empty.

Initial `git diff --stat`: empty.

The untracked Stage 2A.1 prompt file was treated as user-owned input. No destructive Git commands were used.

## 3. Current Stage 2A Architecture Verified

Runtime path verified: `CheckUpScreen` / `AssessmentScreen` -> `PoseDetectionView` -> `PosePipeline` -> `PreflightCheck` -> `MovementCameraReadinessTracker` -> `SessionController` -> countdown -> active grader -> movement result -> `scoreCheckUp` -> `MovementAssessment` -> Stage 1A eligibility -> block/re-test orchestration.

The readiness result shape remains `{ ready, requiredView, detectedView, requiredReliableSideChains, reliableSideChains, stableForMs, reason, promptCue, setupCaption }` in [movementCameraReadiness.ts](/Users/suvangoel/Pearl/src/preflight/movementCameraReadiness.ts:33). Prompt reason codes remain `ready`, `invalid-pose`, `turn-side-on`, `face-camera`, `ambiguous-view`, `insufficient-reliable-chains`, and `hold-still`.

Front/side thresholds remain unchanged: front is shoulder ratio `>= 0.38` and hip ratio `>= 0.22`; side is shoulder ratio `<= 0.22` and hip ratio `<= 0.18` in [movementCameraReadiness.ts](/Users/suvangoel/Pearl/src/preflight/movementCameraReadiness.ts:136).

## 4. Ambiguous-View Prompt Defect

Confirmed defect: `ambiguous-view` previously used `hold-still`, making three-quarter/unclear orientation indistinguishable from correct orientation with an incomplete dwell. That violated the locked rule that ambiguity must be directional.

Fixed in [movementCameraReadiness.ts](/Users/suvangoel/Pearl/src/preflight/movementCameraReadiness.ts:159): ambiguous + front maps to `face-forward`; ambiguous + side/side_oblique maps to `turn-side-on`; not-required ambiguity falls back to whole-body framing.

## 5. Exact Prompt Mapping Before And After

Before:

```text
turn-side-on -> turn-side-on
face-camera -> face-forward
ambiguous-view -> hold-still
hold-still -> hold-still
insufficient-reliable-chains / invalid-pose -> step-into-frame
```

After:

```text
clear wrong side-required view -> turn-side-on
clear wrong front-required view -> face-forward
ambiguous side-required view -> turn-side-on
ambiguous front-required view -> face-forward
correct view + chains + usable geometry + dwell incomplete -> hold-still
insufficient chains / invalid pose / unusable torso geometry -> step-into-frame
ready -> no setup caption
```

Visible ambiguous captions are now:

```text
side: "Turn a little more so your side faces the camera."
front: "Turn a little more to face the camera."
```

## 6. Readiness Timing And Boundary Rule

The boundary rule is unchanged and now explicitly tested: continuous valid elapsed timestamp time `>= 500 ms` is ready; `499 ms` is not ready. A single valid frame starts dwell at `0 ms`; readiness is not based on frame count.

The implementation computes `stableForMs = max(0, timestampMs - stableSinceMs)` and sets `ready` only when base readiness is true and `stableForMs >= stableMs` in [movementCameraReadiness.ts](/Users/suvangoel/Pearl/src/preflight/movementCameraReadiness.ts:89).

Duplicate and decreasing timestamps do not create negative stable duration and do not falsely advance readiness.

## 7. Countdown Invalidation Results

`SessionController` checks setup readiness on every countdown frame and returns to preflight when readiness is lost before `go` in [sessionController.ts](/Users/suvangoel/Pearl/src/assessment/sessionController.ts:192). The new test matrix covers:

- Chair stand: side-ready countdown invalidated by front view.
- Balance ladder: front-ready countdown invalidated by side view.
- Shoulder flexion: side-ready countdown invalidated by ambiguous view.
- Hinge reach: side-ready countdown invalidated by insufficient chains.

The stale-go condition is covered by asserting the controller remains in preflight at a later would-have-been `go` timestamp and `controller.result` remains null.

## 8. Active Interruption Results By Assessment

Active readiness loss is converted to a synthetic `tracking-interrupted` frame before the grader sees it in [sessionController.ts](/Users/suvangoel/Pearl/src/assessment/sessionController.ts:218). The first invalid frame in a continuous invalid span carries the event; subsequent invalid frames remain `interrupted` without duplicate event emission until reacquisition.

Production grader contract coverage was added for chair stand, balance ladder, shoulder flexion, and hinge reach in [trackingInterruptionContract.test.ts](/Users/suvangoel/Pearl/src/movements/__tests__/trackingInterruptionContract.test.ts:1). Each official grader now has a test proving controller-level camera loss is non-measuring, increments interruption count, and sets `tracking-interrupted`.

Existing movement acceptance tests still cover credited chair reps surviving later interruption, no double counting after subject-gone, balance interruption policy, and ROM captures that survive later interruption when already valid.

## 9. Reacquisition Behaviour

Readiness loss resets `stableSinceMs` to `-1` and `stableForMs` to `0` in [movementCameraReadiness.ts](/Users/suvangoel/Pearl/src/preflight/movementCameraReadiness.ts:91). Reacquisition must satisfy a fresh full dwell. The new readiness tests cover wrong-view reset, chain-loss reset, subject-gone reset, stream-gap/interrupted reset, retry reset, and explicit tracker reset.

During active measurement, the controller does not resume valid grader input until `setupBlock(...)` returns null and pipeline state is `tracking`.

## 10. Reset Behaviour

Retry: `retrySetup()` clears setup issue, resets generic preflight, movement readiness, controller, and item entered timestamp in [checkup.ts](/Users/suvangoel/Pearl/src/checkup/checkup.ts:138). A new orchestrator test proves retry recovers from a latched setup issue and reaches non-preflight item flow after fresh valid framing.

Subject-gone: `PosePipeline` emits `subject-gone` and resets smoother/window state on absence during tracking in [pipeline.ts](/Users/suvangoel/Pearl/src/pose/pipeline.ts:211). Readiness sees interrupted/non-tracking output as invalid and clears dwell.

Stream gap: `PosePipeline` treats gaps over `frameGapMs` as interruption, emits `subject-gone` when previously tracking, resets smoothers and chain windows in [pipeline.ts](/Users/suvangoel/Pearl/src/pose/pipeline.ts:234). Readiness tests cover interrupted stream-gap-style frames clearing dwell.

New item: `enterTransition()` resets preflight and movement readiness at every item transition in [checkup.ts](/Users/suvangoel/Pearl/src/checkup/checkup.ts:222). Existing full battery tests cover side chair -> front balance and front balance -> side shoulder transition cues; readiness reset is code-verified and dwell reset is covered at the tracker and retry levels.

Skip: `skipCurrentItem()` records skip, clears setup issue, advances to the next item, and `enterTransition()` resets readiness for that next item in [checkup.ts](/Users/suvangoel/Pearl/src/checkup/checkup.ts:147). Existing setup issue tests cover skip behaviour.

Cancel: `CheckUpScreen` stop cancels the screen flow, stops voice, and unmount cleanup stops recorder/releases audio in [CheckUpScreen.tsx](/Users/suvangoel/Pearl/src/screens/CheckUpScreen.tsx:107). No persistent readiness object is retained after screen teardown.

## 11. Low/High FPS Results

Added readiness tests prove:

- 10 FPS sequence becomes ready at elapsed `500 ms`.
- High-FPS sequence remains unready before elapsed `500 ms` and ready after.
- Frame count alone cannot satisfy readiness.

The 500 ms dwell was not reduced in tests.

## 12. Non-Finite And Malformed Geometry Results

`poseUsable` now requires finite core landmarks and usable torso geometry in [movementCameraReadiness.ts](/Users/suvangoel/Pearl/src/preflight/movementCameraReadiness.ts:75). A zero/near-zero torso no longer routes as directional ambiguity inside readiness; it fails closed as `invalid-pose` with whole-body guidance.

Tests cover NaN core geometry, zero torso length, mirrored side, mirrored front via existing front fixture, side/front threshold-adjacent geometry, ambiguous threshold interval, insufficient chains, and one-chain failure for a two-chain movement.

## 13. ROM Classification Chain

ROM graders still publish no official metric unless valid capture completes. Shoulder flexion returns `NaN` + `no-measurement` unless `validTime.completedByValidTime` and finite peak exist in [shoulderFlexion.ts](/Users/suvangoel/Pearl/src/movements/shoulderFlexion.ts:124). Hinge reach follows the same pattern in [hingeReach.ts](/Users/suvangoel/Pearl/src/movements/hingeReach.ts:127).

Scoring drops any item flagged `no-measurement` in [scoring.ts](/Users/suvangoel/Pearl/src/scoring/scoring.ts:69). Mobility requires official shoulder flexion; hinge can remain a detail row but cannot alone create a mobility age in [scoring.ts](/Users/suvangoel/Pearl/src/scoring/scoring.ts:172).

Added scoring coverage proves valid hinge detail does not score mobility when shoulder capture is `no-measurement`.

## 14. Stage 1A Eligibility Integration

`createMovementAssessment()` marks zero measured domains as `invalid` via confidence `low` in [assessments.ts](/Users/suvangoel/Pearl/src/pearlFlow/assessments.ts:21). `getBlockCreationEligibility()` rejects invalid assessment status, no measured domains, missing focus domain, non-finite focus measurement, and inconsistent evidence in [assessmentEligibility.ts](/Users/suvangoel/Pearl/src/pearlFlow/assessmentEligibility.ts:28).

Existing and rerun tests prove fallback-only/no-measurement Check-Ups cannot pass Stage 1A and cannot create a block through the defended block service.

## 15. Official Re-Test Integration

The official re-test completion path computes eligibility before side effects. If ineligible, it persists the assessment attempt and returns to results before retest completion, block completion, report creation, or next-block creation in [App.tsx](/Users/suvangoel/Pearl/App.tsx:1281).

Pure tested guards prove invalid official attempts are excluded from `latestUsableOfficialAssessment()` in [assessments.ts](/Users/suvangoel/Pearl/src/pearlFlow/assessments.ts:68), and block creation rejects ineligible evidence in [blockService.ts](/Users/suvangoel/Pearl/src/adherence/blockService.ts:47). Existing lifecycle tests also prove an invalid official retest leaves the active block recoverable and still due for retry.

Remaining gap: no full `App.tsx` UI integration test was added, because doing so would require a large app harness/refactor outside the prompt's scope. The code path and pure orchestration guards were verified.

## 16. Screen/Voice/Controller Alignment

The authoritative readiness module now supplies both voice cue and visible setup caption. `SessionController` relays those values through `setupBlock()` and prompt throttling remains unchanged in [sessionController.ts](/Users/suvangoel/Pearl/src/assessment/sessionController.ts:343). `CheckUpScreen` displays `u.item.setupCaption` and speaks `u.voice` without recreating prompt logic in [CheckUpScreen.tsx](/Users/suvangoel/Pearl/src/screens/CheckUpScreen.tsx:131). `AssessmentScreen` does the same for the chair stand path in [AssessmentScreen.tsx](/Users/suvangoel/Pearl/src/screens/AssessmentScreen.tsx:90).

No runtime TTS, new audio dependency, visual redesign, or camera self-view was introduced. Existing retry and skip controls remain in `SetupHelpPanel` usage on `CheckUpScreen`.

## 17. Tests Added Or Changed

Changed:

- `src/preflight/__tests__/movementCameraReadiness.test.ts`: ambiguous prompt semantics, hold-still semantics, 499/500 ms boundary, low/high FPS, duplicate/decreasing timestamps, reset cases, malformed geometry.
- `src/assessment/__tests__/sessionController.test.ts`: countdown invalidation matrix and active interrupted-frame handoff.
- `src/checkup/__tests__/checkup.test.ts`: retry recovery after latched setup issue.
- `src/scoring/__tests__/scoring.test.ts`: hinge detail cannot score mobility when shoulder no-measurement.

Added:

- `src/movements/__tests__/trackingInterruptionContract.test.ts`: all four official graders consume controller-level `tracking-interrupted` as non-measuring interruption; interrupted-only ROM does not publish official values.

## 18. Production Files Changed

Changed production code:

- `src/preflight/movementCameraReadiness.ts`

Production change scope:

- Prompt/caption routing for ambiguous view now depends on required view.
- Readiness `poseUsable` now requires usable torso geometry so malformed core geometry gets whole-body framing guidance.

No chair thresholds, velocity code, balance timing/policy, ROM thresholds/valid-time targets, scoring norms, default battery, or TUG release status were changed.

## 19. Exact Validation Results

Targeted command:

```bash
npm test -- --runInBand src/preflight/__tests__/movementCameraReadiness.test.ts src/assessment/__tests__/sessionController.test.ts src/movements/__tests__/trackingInterruptionContract.test.ts src/scoring/__tests__/scoring.test.ts src/checkup/__tests__/checkup.test.ts src/pearlFlow/__tests__/assessmentEligibility.test.ts src/adherence/__tests__/blockServiceEligibility.test.ts
```

Result: exit 0. Targeted suites: 7 passed. Targeted tests: 51 passed. Snapshots: 0. Skipped tests: 0. Warning: existing Watchman recrawl warning.

Full test command:

```bash
npm test -- --runInBand
```

Result: exit 0. Full suites: 80 passed. Full tests: 515 passed. Snapshots: 0. Skipped tests: 0. Warnings/logs: existing backend sync console logs/warnings, existing session-planning fallback warnings, existing Watchman recrawl warning, and existing Jest open-handle notice remained.

Typecheck:

```bash
npm run typecheck
```

Result: exit 0.

Expo config:

```bash
npx --no-install expo config --type public
```

Result: exit 0. Existing Sentry Expo warning remained: missing organization/project config, environment fallback used.

Diff check:

```bash
git diff --check
```

Result: exit 0.

Validation commands did not change files unexpectedly.

## 20. Remaining Physical-Device Validations

Still required before beta/release:

- Real-device chair-stand rise velocity noise-floor and repeatability validation.
- Real-device front/side/ambiguous readiness threshold validation across homes, lighting, clothing, chair placement, and phone heights.
- Native timestamp monotonicity and app background/resume interruption validation.
- iOS and Android camera/audio coexistence validation on physical devices.
- iOS debug/release stability verification under the current Expo/RN stack.

## 21. Remaining Stage 2 Findings Not Addressed

Not addressed by this scoped pass:

- Subject identity continuity after another person enters frame.
- Native timestamp correction.
- Broad native-payload sanitisation beyond readiness core geometry.
- App background/resume policy.
- Balance ladder stage-clock product decision.
- History filename collisions.
- Account/local-data isolation and other non-Stage-2A product findings.

## 22. Whether Stage 3 Is Now Unblocked

The static software contracts for Stage 2A are verified by automated tests, the ambiguous guidance defect is corrected, and no new P0/P1 measurement-path software defect was found. Remaining items are physical-device validation, deferred product policy, or lower-priority hardening.

STAGE 3 UNBLOCKED

## 23. Initial And Final Git Status

Initial status is recorded in section 2.

Final `git status --short --untracked-files=all` after this report:

```text
 M src/assessment/__tests__/sessionController.test.ts
 M src/checkup/__tests__/checkup.test.ts
 M src/preflight/__tests__/movementCameraReadiness.test.ts
 M src/preflight/movementCameraReadiness.ts
 M src/scoring/__tests__/scoring.test.ts
?? docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_2A_1.md
?? docs/audits/Pearl_Stage_2A_1_Verification_and_Hardening_Prompt.md
?? src/movements/__tests__/trackingInterruptionContract.test.ts
```

No staging, commit, branch, or push occurred.

## 24. Concurrent External Changes Observed

No concurrent external changes were observed while this task was running. All modified files listed above are task-owned changes from Stage 2A.1, except the original untracked prompt file, which was user-owned input.
