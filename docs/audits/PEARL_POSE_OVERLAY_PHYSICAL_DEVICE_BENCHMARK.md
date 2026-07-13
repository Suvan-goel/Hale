# Pearl Pose Overlay Physical-Device Benchmark

Date: 2026-06-22

Scope: physical-device benchmark readiness for Pearl's real-time pose overlay, plus the point-cloud renderer scheduling audit requested in `docs/audits/PEARL_POSE_OVERLAY_PHYSICAL_DEVICE_BENCHMARK_PROMPT.txt`.

## Executive Verdict

No physical Android benchmark numbers were collected in this pass. `adb devices -l` exposed only an emulator (`emulator-5554`, `sdk_gphone64_arm64`), not a physical phone, and emulator timing would be misleading for camera, MediaPipe, RN/SVG, and display latency.

The confirmed finding is code-level rather than device-level: the point-cloud renderer's RAF backpressure semantics were not correct for a latest-frame renderer. A new scheduler now stores the newest accepted pose before coalescing behind a pending RAF, rejects out-of-order/equal-order frames, keeps at most one RAF pending, and cancels cleanly on unmount/clear. Tests cover those semantics.

The dominant physical bottleneck is still not confirmed. The two leading candidates remain:

- RN/SVG render and draw cost for the dense point-cloud figure, especially 900-dot production mode.
- Android native preprocessing before MediaPipe, especially per-frame `ImageProxy.toBitmap()` and rotation work.

Current beta recommendation: include the latest-frame scheduler fix, keep diagnostics disabled by default, and do not make a permanent visual downgrade without physical numbers. If a beta must be shipped before measurement on a mid-range Android target, use the current production point-cloud with transitions already disabled; the first fallback to try is `production-point-cloud-no-transitions` or a 450-dot point-cloud, not raw skeleton.

## Device And Build Status

Physical device status: not available in this environment.

Observed `adb devices -l` output:

```text
List of devices attached
emulator-5554          device product:sdk_gphone64_arm64 model:sdk_gphone64_arm64 device:emu64a transport_id:14
```

Project/build facts verified locally:

| Item | Value |
| --- | --- |
| Expo package | `~56.0.11` |
| Expo SDK from config | `56.0.0` |
| React Native | `0.85.3` |
| `react-native-svg` | `15.15.4` |
| Android New Architecture | `newArchEnabled=true` |
| Android Hermes | `hermesEnabled=true` |
| Local native build checked | `cd android && ./gradlew :app:assembleDebug` succeeded |

This pass did not install or run a release/profileable build on physical hardware.

## Benchmark Interface Added

Added a diagnostics-only screen at `src/screens/PoseOverlayBenchmarkScreen.tsx`. It is inaccessible unless `EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS === '1'`.

Access path when enabled:

1. Open Settings.
2. Open Developer.
3. Tap Pose overlay benchmark.

The screen runs one native `SafePoseDetectionView` and one `PosePipeline`; mode changes swap only the overlay renderer. It does not run MediaPipe twice. Mode changes reset the metrics window and pipeline state.

Available modes:

| Mode | Purpose |
| --- | --- |
| No overlay | Camera/native/JS pipeline baseline without skeleton rendering |
| Raw skeleton | Classic raw-landmark skeleton baseline |
| Minimal constellation | Low-density constellation without volume/transitions |
| Full constellation | Higher constellation density with torso/head volume |
| Point cloud 225 | Point-cloud body with 225-dot cap |
| Point cloud 450 | Point-cloud body with 450-dot cap |
| Point cloud 900 | Point-cloud body with 900-dot cap |
| Production point cloud | Current production-style point-cloud config |
| Production, no transitions | Production geometry with measurement/domain transitions off |

Controls:

- Run 30s
- Run 60s
- Stop
- Export JSON via native share sheet

The exported JSON includes build/device fields, selected mode, duration, diagnostics snapshot, average/max rendered dot and line counts, and an explicit `unavailableMetrics` list for values the app cannot honestly know without platform frame/Perfetto data.

## Measurement Results

Physical measurements were not collected. Do not use these rows for a product decision.

| Mode | Pose Age p50 | Pose Age p95 | JS Event Hz | Renderer Published Hz | Native Inference p95 | Geometry p95 | Stale/Out-of-order | Result |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| No overlay | n/a | n/a | n/a | n/a | n/a | n/a | n/a | Not collected; no physical device |
| Raw skeleton | n/a | n/a | n/a | n/a | n/a | n/a | n/a | Not collected; no physical device |
| Minimal constellation | n/a | n/a | n/a | n/a | n/a | n/a | n/a | Not collected; no physical device |
| Full constellation | n/a | n/a | n/a | n/a | n/a | n/a | n/a | Not collected; no physical device |
| Point cloud 225 | n/a | n/a | n/a | n/a | n/a | n/a | n/a | Not collected; no physical device |
| Point cloud 450 | n/a | n/a | n/a | n/a | n/a | n/a | n/a | Not collected; no physical device |
| Point cloud 900 | n/a | n/a | n/a | n/a | n/a | n/a | n/a | Not collected; no physical device |
| Production point cloud | n/a | n/a | n/a | n/a | n/a | n/a | n/a | Not collected; no physical device |
| Production, no transitions | n/a | n/a | n/a | n/a | n/a | n/a | n/a | Not collected; no physical device |

Density ablation is ready but unmeasured:

| Density | Expected Question | Physical Result |
| --- | --- | --- |
| 225 dots | Is low-density point cloud visually fresh enough? | Not collected |
| 450 dots | Does medium density preserve freshness with acceptable premium look? | Not collected |
| 900 dots | Does current high density saturate RN/SVG draw? | Not collected |

## Trace Findings

No Perfetto trace was captured because no physical Android target was available.

Trace markers exist on Android when diagnostics are enabled:

- `PearlPose.preprocess`
- `PearlPose.mediapipe`
- `PearlPose.nativeResultConversion`
- `PearlPose.eventEmit`

Android now also emits source-age fields in the native latency payload:

- `sourceAgeAtMediapipeSubmitMs`
- `sourceAgeAtMediapipeCallbackMs`
- `sourceAgeAtNativeEventEmitMs`

These fields use the same native monotonic clock as the Android source timestamp, so they are stronger evidence for native queue/preprocess age than JS-side approximate clock-offset measurements.

## Renderer Scheduling Audit

Previous point-cloud behavior used the pending RAF as a hard early exit for newer visual updates. That avoided extra render work, but it meant a newer frame arriving while a RAF was pending could be dropped before becoming the latest render candidate. For a live camera overlay, that is the wrong freshness tradeoff.

New behavior:

- `src/render/latestFrameRafScheduler.ts` stores the newest accepted frame before checking for an existing RAF.
- It rejects non-finite, equal-order, and older-order frames.
- It keeps at most one RAF pending.
- The point-cloud renderer snapshots the newest pipeline output into preallocated render storage, then renders that latest snapshot when the RAF fires.
- The renderer emits `scheduled`, `coalesced`, `rejected`, `cancelled`, and `published` diagnostics events.
- Tests in `src/render/__tests__/latestFrameRafScheduler.test.ts` verify burst-newest behavior, old-frame rejection, one-RAF scheduling, and cancellation safety.

Conclusion: latest-frame semantics were not correct before this pass. They are now correct at the scheduler level and covered by focused unit tests.

## Instrumentation Coverage

Existing diagnostics were extended to support the physical benchmark:

- `src/diagnostics/poseLatencyDiagnostics.ts` now has `benchmark` mode.
- It tracks renderer published frames, coalesced frames, rejected frames, and published Hz.
- It records Android native source-age timing fields when present.
- `src/diagnostics/PoseLatencyDiagnosticsOverlay.tsx` surfaces published Hz plus coalesced/rejected visual counts.
- Renderer props now expose `onRendererScheduleEvent` so benchmark code can separate update submissions from visible path publication.

Known unavailable values without platform tooling:

- True display presentation timestamp.
- Latest native frame ID that actually reached the physical display.
- GPU completion time.
- UI dropped-frame counts without Perfetto or platform frame metrics.

## Manual Physical Run Protocol

Use a real Android device, preferably the target beta-class phone. Do not use Expo Go. Do not use a remote JS debugger. Avoid dev overlays.

Build/install a release or profileable diagnostics build:

```bash
EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS=1 npx expo run:android --device --variant release
```

If release signing blocks local install, use the closest available profileable/internal variant and record that fact. Debug builds are acceptable only to validate that the UI works, not to make the beta latency decision.

For each mode:

1. Prop the phone in the normal Pearl setup position.
2. Open Settings -> Developer -> Pose overlay benchmark.
3. Select the mode.
4. Run 30 seconds stationary.
5. Run 30 seconds with arm sweeps and torso movement.
6. Run 30 seconds with chair-stand-like motion.
7. Export JSON after each run.
8. Capture a Perfetto trace covering at least one 30-second run in raw skeleton, point-cloud 450, and production point-cloud.

Record at minimum:

- Device model and Android version.
- Build type and JS engine.
- Mode.
- Pose age p50/p95 at renderer submission.
- Renderer published Hz.
- JS event Hz.
- Native source age at MediaPipe submit/callback/event emit.
- Native inference p50/p95.
- Geometry p50/p95.
- Renderer coalesced/rejected counts.
- Subjective visible lag or hitching.

## Root-Cause Ranking

Confirmed:

1. Point-cloud latest-frame scheduling bug. This could add visual staleness under bursty event delivery or UI congestion. It is fixed and tested.

Likely, pending physical data:

2. RN/SVG dense draw cost for 900-dot point-cloud modes. Desktop synthetic geometry cost was low in the earlier audit, so device-side commit/path/draw remains a plausible hot spot.
3. Android native preprocessing. CameraX is keep-latest, but every accepted frame still pays bitmap conversion and possible rotation before MediaPipe.

Weakened:

4. Unbounded camera queue/backlog. Android uses CameraX `STRATEGY_KEEP_ONLY_LATEST`; iOS uses `alwaysDiscardsLateVideoFrames`.
5. Double smoothing in main session screens. Current production session paths use raw landmarks and smoothing disabled for the point-cloud figure.

## Recommendation

Immediate beta config:

- Keep diagnostics disabled by default.
- Include the latest-frame scheduler fix.
- Keep the current production point-cloud settings unless a physical benchmark proves they are stale on target hardware.
- If target hardware shows visible lag before a deeper renderer rewrite, first try `production-point-cloud-no-transitions`, then `point-cloud-450`.

Long-term architecture:

- If raw skeleton is fresh but point-cloud modes are stale or janky, move the dense figure to one batched drawing surface rather than hundreds of RN/SVG path updates. Preferred direction is a native/custom drawing surface inside Pearl's existing local Expo module boundary, or another single-surface renderer after explicit dependency approval.
- If raw skeleton is already stale, optimize Android capture/preprocess before renderer work. The first native target is avoiding avoidable bitmap conversion/rotation cost before MediaPipe.

The next device pass should not decide whether "pose is slow" as a whole; it should decide whether the slow stage is native source age, MediaPipe/inference, JS processing, or visual publication.

## Verification

Passed locally:

```bash
npm test -- --runInBand src/render/__tests__/latestFrameRafScheduler.test.ts src/diagnostics/__tests__/poseLatencyDiagnostics.test.ts
npx tsc --noEmit
npx expo config --type public
git diff --check
cd android && ./gradlew :app:assembleDebug
```

Notes:

- `npx expo config --type public` reports the existing Sentry config warning about missing organization/project and environment fallback.
- Gradle reports existing deprecation warnings and the Expo `NODE_ENV` warning, but `:app:assembleDebug` succeeds.
