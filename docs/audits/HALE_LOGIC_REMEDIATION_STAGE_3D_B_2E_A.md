# Hale Logic Remediation - Stage 3D-B.2E-A

Date: 2026-06-24

Stage: Live Movement Profile V2 pose/device-readiness integration

Status: software integration implemented and validated in deterministic replay; physical-device validation not performed.

## 1. Objective

Stage 3D-B.2E-A replaced the internal Movement Profile V2 screen's normal button-driven synthetic measurement path with live pose-driven controller events.

The stage adds a narrow live adapter/coordinator boundary between native pose events and the already-approved pure V2 protocol controllers. The coordinator handles movement and attempt epochs, stale/duplicate/out-of-order frames, app backgrounding, timer deadlines independent of frame arrival, bounded internal diagnostics, and recovery UI controls.

This stage does not claim camera accuracy, device timer accuracy, home-environment reliability, beta readiness, public rollout readiness, V2 block creation, V2 reports, or official V2 retest scheduling.

## 2. Worktree Safety

Rules followed:

- No destructive Git commands.
- No package installs.
- No lockfile edits.
- No staging, commit, branch, push, or PR.
- Existing voice assets were not regenerated.
- `.env` values were not printed in full or edited.
- Unrelated untracked `docs/audits/HALE_VOICE_SPEC_V2_1_APPROVED_DECISIONS_CODEX_PROMPT.md` is present and was not touched.

Final worktree command outputs before this report:

```text
$ git status --short --untracked-files=all
 M .env.example
 M src/screens/MovementProfileV2CheckUpScreen.tsx
?? docs/audits/HALE_VOICE_SPEC_V2_1_APPROVED_DECISIONS_CODEX_PROMPT.md
?? src/movementProfileV2/__tests__/liveCoordinator.test.ts
?? src/movementProfileV2/liveCoordinator.ts
?? src/movementProfileV2/liveDiagnostics.ts
```

```text
$ git diff --name-only
.env.example
src/screens/MovementProfileV2CheckUpScreen.tsx
```

```text
$ git diff --stat
 .env.example                                   |   1 +
 src/screens/MovementProfileV2CheckUpScreen.tsx | 394 ++++++++++++++++++-------
 2 files changed, 294 insertions(+), 101 deletions(-)
```

Note: the new live coordinator, diagnostics module, replay tests, and this report are untracked new files, so they do not appear in `git diff --stat`.

## 3. Files Changed

Task-owned edits:

- `.env.example`
  - Added `EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_DIAGNOSTICS=0`.
- `src/movementProfileV2/liveCoordinator.ts`
  - Added live pose sample/coordinator, protocol adapters, epoch policy, monotonic clock bridge, timer deadlines, recovery handling, and bounded diagnostics.
- `src/movementProfileV2/liveDiagnostics.ts`
  - Added strict internal-only diagnostics gate and sanitized JSON export.
- `src/screens/MovementProfileV2CheckUpScreen.tsx`
  - Replaced synthetic measurement buttons with live coordinator integration and legitimate protocol/recovery controls.
- `src/movementProfileV2/__tests__/liveCoordinator.test.ts`
  - Added deterministic replay and source-guard coverage.
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2E_A.md`
  - This report.

## 4. Native Pose Contract

Inspected files:

- `src/components/SafePoseDetectionView.tsx`
- `modules/expo-pose-detection/src/ExpoPoseDetection.types.ts`
- `modules/expo-pose-detection/src/PoseDetectionView.tsx`
- Android `modules/expo-pose-detection/android/src/main/java/expo/modules/posedetection/PoseDetectionView.kt`
- iOS `modules/expo-pose-detection/ios/PoseDetectionView.swift`
- `src/diagnostics/poseLatencyDiagnostics.ts`

Current JS payload:

- `timestampMs`
- flat `landmarks` array as `[x, y, z, visibility, presence] * 33`, or empty when no pose
- `inferenceMs`
- `sourceWidth`
- `sourceHeight`
- optional `latency` diagnostics

Coordinate contract:

- x/y are normalized `[0, 1]`.
- Coordinates are upright portrait image space.
- Coordinates are unmirrored; front-camera mirroring remains renderer-owned.
- The V2 live sample records `rotationDegrees` and `mirrored`, defaulting to `0` and `false` because current JS payload is already normalized.

Timing/diagnostic contract:

- Android latency diagnostics expose `nativeClock: android.elapsedRealtimeNanos`, `frameId`, `sourceTimestampMs`, runtime fields, and event scheduler counters.
- Android camera source timestamps are boottime-monotonic and converted to ms for MediaPipe VIDEO mode.
- iOS latency diagnostics expose `nativeClock: ios.CACurrentMediaTime`, `frameId`, and `sourceTimestampMs`.
- iOS uses capture presentation timestamps for pose timestamping and `CACurrentMediaTime()` for diagnostics.
- `PoseLatencyDiagnostics` already tracks frame ID out-of-order, timestamp out-of-order, staleness at receipt/render, native source age, JS transform, and renderer metrics.

Native pipeline defaults preserved:

- `modelVariant="full"` for the V2 screen.
- Detection/tracking/presence confidence defaults remain `0.35`.
- Android pipeline default remains `full-video-sync`.
- Android rotation default remains `rotated-bitmap`.
- Android analysis resolution default remains `640x480`.
- The native camera owns frames; JS receives landmark arrays only.
- No camera preview video is rendered.

Event coalescing:

- Android uses `LatestNativeEventScheduler` ordered by `frameId`, with scheduled/coalesced/rejected/emitted counters.
- Android live-stream callback also rejects older/equal pending frame IDs.
- iOS dispatches processed frame payloads asynchronously to JS.
- The new V2 coordinator adds a second conservative JS-side guard for duplicate frame IDs, out-of-order source timestamps, stale frames, epoch mismatches, malformed timestamps, and frames after completion.

## 5. Synthetic Path Removed From Normal Internal V2 Screen

Before this stage, `MovementProfileV2CheckUpScreen` used a single action path that created canned results:

- chair: `createCapturedChairRiseV2Result({ reps: 12 })`
- balance: `createCapturedOneLegBalanceV2Result({ holdsSec: [28, 31, 30] })`
- shoulder: `createCapturedActiveShoulderReachV2Result({ peakFlexionDeg: 154 })`
- hinge: `createCapturedHingeReachResult(0.24)`

Those imports and buttons were removed from the screen.

Legitimate user controls retained:

- setup confirmation
- standing-leg selection
- shoulder-side selection
- balance support-touched
- balance stop
- balance rest ready
- balance use best result
- shoulder retry start
- shoulder pain-limited marker
- hinge start/finish
- cancel
- gated diagnostics export

The normal internal V2 path now receives live pose samples and lets the coordinator advance protocol state.

## 6. Live Pose Sample Boundary

Added `MovementProfileV2LivePoseSample` with:

- `frameId`
- `timestampMs`
- `receivedAtMs`
- `sourceWidth`
- `sourceHeight`
- `rotationDegrees`
- `mirrored`
- `movementEpochId`
- `attemptEpochId`
- `trackingQuality`
- `output: PipelineFrameOutput`

The sample is in-memory only. It is not persisted and diagnostics do not serialize landmarks or pose arrays.

The screen constructs samples from `PosePipeline.process(payload)` output, using:

- `payload.latency?.frameId` when available;
- `payload.latency?.sourceTimestampMs ?? payload.timestampMs`;
- app monotonic receipt time from `defaultNowMs()`;
- current movement/attempt epoch from the coordinator snapshot.

## 7. Coordinator Architecture

Added `MovementProfileV2LiveCoordinator` with:

- `receivePoseSample(sample)`
- `receiveTimerTick(nowMs)`
- `receiveUserAction(action, nowMs)`
- `snapshot(nowMs)`
- `exportDiagnostics()`

The coordinator has no React, navigation, persistence, backend, or storage dependency.

It consumes existing pure V2 controllers:

- `ChairRiseV2ProtocolController`
- `OneLegBalanceV2ProtocolController`
- `ActiveShoulderReachV2ProtocolController`

It writes completed results back through the existing internal flow reducer and finishes with `movementProfileV2RawCheckUpFromFlow`.

## 8. Monotonic Time Basis

Active protocol timing uses the app monotonic time from `defaultNowMs()` and normalized frame time from `MonotonicFrameClockBridge`.

Strategy:

- First accepted frame creates a fixed offset: `receivedAtMs - sourceTimestampMs`.
- Later source timestamps are projected into the same app monotonic time basis.
- Timer ticks use `defaultNowMs()` directly.
- Pure controllers only receive explicit `nowMs` values.
- No active protocol duration is based on ISO time or wall-clock `Date.now()` inside controller logic.

The coordinator drops frames when projected frame age at receipt exceeds `750ms`.

## 9. Timer Driver

The screen owns one interval at `250ms` and calls `receiveTimerTick(nowMs)`.

The timer advances:

- chair official countdown
- 30-second chair deadline
- 45-second balance attempt deadline
- 30-second minimum balance rest
- 60-second default balance ready transition
- 9-second shoulder capture deadline
- 9-second hinge capture deadline

Deadlines progress even when no pose frame arrives.

React state updates are bounded:

- pose frames update the skeleton path immediately through the existing renderer ref;
- coordinator state updates React only on revision changes;
- timer projection updates at 4Hz.

No per-frame React state is used for controller work.

## 10. Epoch And Frame Drop Policy

The coordinator issues deterministic movement and attempt epochs.

Drop counters:

- `staleFramesDropped`
- `duplicateFramesDropped`
- `outOfOrderFramesDropped`
- `epochMismatchFramesDropped`
- `malformedFramesDropped`

Rules implemented:

- wrong movement epoch drops;
- wrong attempt epoch drops;
- duplicate frame ID drops;
- source timestamp `<= lastSourceTimestampMs` drops;
- stale projected frame drops;
- completed check-up drops further frames;
- chair practice and official windows use separate attempt epochs;
- balance ready/trial/rest use separate attempt epochs;
- shoulder retry gets a fresh attempt epoch.

## 11. Chair Live Integration

Chair uses `ChairLiveAdapter`, backed by `RepVelocityTracker`.

Live behavior:

- setup confirmation moves to practice;
- one live practice stand is required;
- practice stand is not counted in official result;
- chair adapter resets before official counting;
- countdown starts after practice;
- official window starts at countdown start + 3000ms;
- official reps are credited only when completed at or before the 30-second deadline;
- mean/peak rise velocity and duration flow into the existing V2 chair controller;
- hand-push-off is stored as metadata only.

Tracking interruption:

- non-good tracking during active chair resets adapter state and marks controller interruption;
- app background during chair active finishes a conservative interrupted chair result and advances to balance setup.

## 12. Balance Live Integration

Balance uses selected standing leg and live ankle geometry.

Live behavior:

- setup confirmation stores standing leg;
- lifting the non-standing foot starts a 45-second attempt;
- touchdown is debounced over 4 frames;
- support-touched and stop controls complete the current live trial;
- best valid hold is retained;
- 30-second minimum rest is enforced before another attempt;
- 60-second default rest auto-transitions to ready;
- `Use this result` can accept the best saved trial;
- invalid tracking trial does not consume a valid attempt;
- invalid retry is bounded.

App background during a balance trial records an app-backgrounded invalid trial and enters recovery rest.

## 13. Shoulder Live Integration

Shoulder uses selected-side geometry and selected arm-chain reliability.

Live behavior:

- setup confirmation stores selected side;
- capture starts only from ready/retry-ready;
- capture has a 9-second deadline;
- valid capture requires selected-side arm reliability, upright torso, angle signal, and at least 3000ms valid tracking;
- peak active flexion flows into the existing V2 shoulder controller;
- one invalid-attempt retry is preserved;
- pain-limited flag is retained as raw protocol metadata.

App background during active shoulder capture records an invalid attempt and transitions to retry-ready when retry is available.

## 14. Hinge Supporting Capture

Hinge remains supporting evidence only.

Live behavior:

- capture starts from hinge setup;
- 9-second capture window;
- uses most reliable side chain;
- records minimum wrist-to-floor distance in body units;
- requires bent-trunk signal and 3000ms valid tracking;
- invalid or backgrounded hinge records `NaN` reach with `no-measurement` flags;
- hinge never substitutes for shoulder and never drives V2 reference interpretation or focus.

## 15. Screen Integration

`MovementProfileV2CheckUpScreen` now:

- instantiates `MovementProfileV2LiveCoordinator`;
- sends pose samples with current epoch IDs;
- sends app-state events;
- sends timer ticks at 4Hz;
- calls `onComplete` once the coordinator produces a raw V2 `CheckUp`;
- renders live status and metrics;
- offers only legitimate protocol/recovery controls;
- exposes diagnostics export only when both internal V2 and V2 diagnostics gates are enabled.

The skeleton renderer path remains separate from controller state.

## 16. Diagnostics Harness

Added strict opt-in diagnostics:

- env var: `EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_DIAGNOSTICS=1`
- requires internal V2 gate as well;
- exports sanitized JSON through `Share`;
- includes counters and bounded transition summaries;
- excludes raw landmarks, visibility arrays, personal identifiers, and video.

Transition history is bounded to 80 entries.

## 17. Voice And Text Parity

Text parity:

- The screen has active state text for setup, practice, countdown, active chair, balance ready/trial/rest, shoulder setup/ready/active/retry, hinge setup/active, background interruption, metrics, and recovery controls.

Voice integration:

- Reuses existing bundled cues only.
- No runtime TTS and no network calls were added.
- Existing cues used include `checkup-intro`, `chair-stand-setup`, countdown cues, `go`, `times-up`, `balance-setup`, `balance-single-leg`, `rest-now`, `shoulder-setup`, `tracking_pause_and_reset`, `hinge-setup`, and `checkup-complete`.
- `npm run verify:audio` still verifies the current required 44 cues for Clara and Marcus, 88 required assets.

Strict acceptance caveat:

- Full V2-specific voice parity for 45-second balance/rest/retry semantics remains incomplete because no new V2-specific cue assets were generated in this stage.
- This report therefore does not mark the stage as fully accepted under the prompt's strict "do not mark complete unless voice/text parity" condition.

## 18. Artifact Chain Result

The live coordinator produces a raw V2 `CheckUp` with:

- `chair-rise-30s-v2`
- `one-leg-balance-45s-v2`
- `active-shoulder-reach-v2`
- supporting `hinge-reach`

The replay test proves this raw live check-up can create an immutable V2 snapshot.

Current policy boundary:

- The live replay snapshot is created successfully.
- V2 assessment creation remains blocked with `v2_assessment_raw_incomplete` in the live test fixture because reference-complete focus promotion is still policy-gated.
- This preserves the current no-public-focus/no-V2-block boundary and avoids pretending the disabled Warden chair transform/focus chain is complete.

## 19. Recovery UI

Implemented in the live screen:

- camera-unavailable notice remains;
- backgrounded warning;
- balance support and stop controls;
- enforced rest countdown button disabled until minimum rest expires;
- use-best-result control;
- shoulder retry-ready state;
- pain-limited marker;
- hinge invalid/supporting completion;
- diagnostics export for internal device runs.

Still not implemented:

- A separate malformed-artifact recovery screen beyond existing snapshot/reference details behavior.
- A full device-run diagnostics dashboard overlay.

## 20. Tests Added

New suite: `src/movementProfileV2/__tests__/liveCoordinator.test.ts`

Coverage:

- duplicate, stale, out-of-order, malformed, and wrong-epoch frame drops;
- chair live practice versus official counting;
- live chair result is not canned 12 reps;
- balance foot-lift start, touchdown, rest enforcement, and use-best result;
- app background recovery for chair, balance, shoulder, and hinge;
- shoulder retry and selected-side capture;
- full raw live Check-Up plus V2 snapshot creation;
- assessment promotion blocked by current policy;
- diagnostics gate and sanitized export;
- source guard against restoring canned synthetic V2 screen controls.

## 21. Validation

Targeted V2 regression slice:

```text
PASS 7 suites / 39 tests
```

Full Jest:

```text
PASS 118 suites / 994 tests
```

Warnings:

- Watchman recrawl warning.
- Jest open-handle shutdown notice.
- Existing expected console logs/warnings from backend sync tests.

Audio:

```text
AUDIO VERIFICATION PASS requiredCues=44 voices=clara,marcus requiredAssets=88 totalBytes=4637324 durationRange=1.858-5.155s
```

Typecheck:

```text
npm run typecheck
PASS
```

Website typecheck:

```text
npm --prefix website run typecheck
PASS
```

Expo config:

```text
npx --no-install expo config --type public
PASS
```

Warning:

- `[@sentry/react-native/expo] Missing config for organization, project. Environment variables will be used as a fallback during the build.`

Diff whitespace:

```text
git diff --check
PASS
```

Expo export:

```text
rm -rf /tmp/hale-stage3db2ea-export
npx --no-install expo export --platform all --output-dir /tmp/hale-stage3db2ea-export
rc=$?
rm -rf /tmp/hale-stage3db2ea-export
exit $rc
PASS
```

Export produced iOS and Android bundles and cleaned the temp directory. Warnings were the same Sentry config warning and Node `NO_COLOR` ignored due to `FORCE_COLOR`.

## 22. Non-goals Preserved

Not changed:

- V1 public/default Check-Up.
- V1 scoring/norms/focus.
- V2 reference tables/transforms.
- Warden transform status.
- V2 snapshot or assessment schema semantics.
- Suggested-focus policy.
- Life-goal mappings.
- Profile schema.
- V2 MovementBlock creation.
- Balanced training templates.
- Stage 5 schedule/progression.
- Exercise catalog.
- Public navigation/onboarding.
- Website.
- Pose model asset.
- Native delegate/running-mode selection.
- Package dependencies.
- Lockfiles.
- Audio assets.

## 23. Physical Device Runbook

Next physical validation should run with:

```text
EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_INTERNAL=1
EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_DIAGNOSTICS=1
```

Minimum device script:

1. Fresh app launch with V2 internal gate enabled.
2. Enter internal Movement Profile V2 screen from Settings developer entry.
3. Confirm no video preview appears.
4. Run chair setup, live practice, countdown, and 30-second capture.
5. Confirm practice rep is excluded from official count.
6. Start balance by lifting foot.
7. Test touchdown, support-touched, stop, 30-second minimum rest, 60-second auto-ready, and use-best.
8. Run shoulder selected-side capture.
9. Force one invalid shoulder attempt and confirm retry-ready.
10. Run hinge supporting capture.
11. Background app during each active stage on separate runs.
12. Export diagnostics and confirm no landmarks/video/PII.
13. Confirm raw V2 Check-Up and snapshot path remain internal-only.

Device run must record:

- device model;
- OS version;
- app build;
- lighting;
- camera distance;
- selected side/leg;
- observed chair count versus human count;
- balance hold versus stopwatch;
- shoulder/hinge plausibility notes;
- exported diagnostic counters.

## 24. Final Assessment

Implemented:

- live V2 pose sample boundary;
- live V2 coordinator;
- movement/attempt epochs;
- stale/duplicate/out-of-order/drop counters;
- monotonic timer bridge;
- timer tick independent of pose frames;
- live chair practice/official counting;
- live balance trial/rest/retry/use-best flow;
- live selected-side shoulder capture and retry;
- supporting hinge capture;
- app background recovery;
- bounded diagnostics export;
- deterministic replay tests;
- normal internal V2 screen no longer uses canned measurement buttons.

Not complete under strict Stage 3D-B.2E-A acceptance:

- full V2-specific active-flow voice asset parity;
- final malformed-artifact recovery UI;
- physical-device validation.

Conclusion: software is ready to begin controlled physical-device validation, but the stage should not be marked fully accepted or beta-ready until V2-specific voice parity and real-device validation are completed.
