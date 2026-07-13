# Pearl Pose Pipeline Latency Remediation

Date: 2026-06-24

Scope: Android upstream camera-to-pose pipeline latency. This pass preserves MediaPipe Pose
Landmarker Full, current JS measurement logic, latest-frame semantics, and the no-video product
law. It does not redesign the figure renderer.

## Executive Summary

Implemented the requested diagnostics and low-risk queue removal work. Production camera screens
now request `pose_landmarker_full.task`, and the native module default is Full on both Android and
iOS. Android diagnostics now report the actual model/delegate/running-mode path that succeeded
instead of assuming GPU.

The main latency remediation is native latest-only event delivery plus true live-stream A/B
support. In `full-live-stream` mode, Android checks an atomic in-flight flag before bitmap
conversion; busy frames are closed immediately and are never converted or queued. Result delivery
also coalesces pending native-to-JS events so a burst emits the newest frame, not the first stale
frame.

The rotation-copy optimization is implemented as a diagnostics A/B path, not a production default.
The default remains the current explicit rotated-bitmap path because a prior production lesson
found MediaPipe rotation metadata unreliable with `BitmapImageBuilder`. The metadata path is now
available for physical verification and reports upright source dimensions for 90/270 degree input.

## Implemented

- Runtime diagnostics report:
  - loaded model asset
  - requested delegate
  - selected delegate
  - GPU fallback status and failure message
  - running mode
  - configured analysis resolution
  - actual `ImageProxy` width, height, format, and rotation
  - CameraX target rotation
  - `MPImage` dimensions
  - `numPoses`
  - segmentation-mask setting
  - camera input, accepted frame, submitted inference, and result rates
  - bitmap conversion, explicit rotation, `MPImage` build, flattening, and payload timings
  - native event scheduled/coalesced/rejected/emitted counts

- Diagnostics-only Android modes:
  - `full-video-sync`: `RunningMode.VIDEO` + `detectForVideo`
  - `full-live-stream`: `RunningMode.LIVE_STREAM` + `detectAsync`

- Diagnostics-only Android rotation modes:
  - `rotated-bitmap`: current explicit `Bitmap.createBitmap(..., Matrix)` path
  - `metadata`: unrotated bitmap plus `ImageProcessingOptions.rotationDegrees`

- Diagnostics-only Android analysis resolutions:
  - `640x480`
  - `512x384`
  - `480x360`

- Native event coalescing:
  - newest result replaces the pending main-thread event
  - at most one main-thread emission runnable is pending
  - older/equal frame IDs are rejected
  - stop/unmount cancels pending emission
  - counters are emitted in native diagnostics

- Mapping/queue tests:
  - Kotlin unit tests cover native latest-only burst behavior, older/equal rejection, cancellation,
    display X mirroring, and upright dimensions for 90/270 degree rotation metadata
  - existing JS scheduler tests still cover renderer latest-frame behavior

## Benchmark Screen Updates

`PoseOverlayBenchmarkScreen` now benchmarks renderer mode separately from native pipeline profile.
The native profile row contains the requested combinations:

| Profile | MediaPipe mode | Rotation path | Analysis resolution |
| --- | --- | --- | --- |
| VIDEO rot 640 | `detectForVideo` | explicit rotated bitmap | 640x480 |
| LIVE rot 640 | `detectAsync` | explicit rotated bitmap | 640x480 |
| LIVE meta 640 | `detectAsync` | rotation metadata | 640x480 |
| LIVE meta 512 | `detectAsync` | rotation metadata | 512x384 |
| LIVE meta 480 | `detectAsync` | rotation metadata | 480x360 |

The benchmark export includes the selected native profile, the native runtime snapshot, native
source-age metrics, preprocessing breakdowns, and renderer publication/coalescing counters.

## Physical Device Status

A physical Android device was connected:

| Item | Value |
| --- | --- |
| Model | SM-S901B |
| Android | 15 |
| Hardware | s5e9925 |
| Thermal status before manual benchmark | 0 |
| AP / BAT / SKIN temperatures before manual benchmark | 32.6 C / 33.0 C / 33.5 C |

A diagnostics-enabled release APK assembled successfully:

```bash
EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS=1 \
EXPO_PUBLIC_ALLOW_DIAGNOSTICS_IN_RELEASE=1 \
./gradlew :app:assembleRelease
```

No movement benchmark numbers are reported here. The requested 60-second rapid movement,
60-second sit-to-stand, and 10-minute sustained runs require a human operating the physical
phone/camera setup and exporting benchmark JSON from the app. I did not fabricate those numbers.

## Current Recommendation

Keep production on `full-video-sync` + `rotated-bitmap` + `640x480` until the physical benchmark
proves a better candidate. That is the known-correct coordinate path and preserves existing
assessment behavior.

Candidate ranking before physical data:

| Optimization | Expected latency effect | Implementation risk | Accuracy risk | Maintainability | Android/iOS parity |
| --- | --- | --- | --- | --- | --- |
| Native event coalescing | Medium under main-thread/JS pressure | Low | Low | Good | Android-only for now |
| LIVE_STREAM busy-before-convert | Medium if Full inference is slower than camera input | Medium | Low if callbacks remain stable | Moderate | Android-only for now |
| Rotation metadata | Potentially medium by removing explicit rotation copy | Medium | Medium until coordinates are physically verified | Good if verified | Android-only |
| 512x384 / 480x360 analysis | Potentially medium/high | Low | Medium; tracking loss must be checked | Good | Android-only profile |
| Bitmap/payload pooling | Low/unknown | Medium | Low if immutable payloads preserved | Mixed | Android-only |

Do not recommend Lite as the primary answer in this pass.

## Verification

Passed locally:

```bash
npm test -- --runInBand src/diagnostics/__tests__/poseLatencyDiagnostics.test.ts src/render/__tests__/latestFrameRafScheduler.test.ts
npx tsc --noEmit
cd android && ./gradlew :expo-pose-detection:compileDebugKotlin --rerun-tasks
cd android && ./gradlew :expo-pose-detection:testDebugUnitTest --rerun-tasks
cd android && ./gradlew :app:assembleDebug
cd android && EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS=1 EXPO_PUBLIC_ALLOW_DIAGNOSTICS_IN_RELEASE=1 ./gradlew :app:assembleRelease
```

Known warnings:

- Existing Watchman recrawl warning during Jest.
- Existing Expo/Sentry config warnings during Gradle/Expo config creation.
- Existing Gradle deprecation warnings from dependencies/tooling.
