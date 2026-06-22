# Hale Pose Overlay Latency Audit

Date: 2026-06-22

Scope: real-time pose figure overlay latency and jank across native camera inference,
JS pose processing, and React Native rendering.

This audit is intentionally evidence-driven. It includes code inspection, static/synthetic
benchmarks, and instrumentation added for real-device measurement. It does not claim physical
device end-to-end latency numbers because no real Galaxy S22 or iPhone capture session was run
during this pass.

## Executive Summary

The current audited state cannot be conclusively labeled as "latency" or "jank" without a
physical-device trace. The codebase previously had no trustworthy camera-to-render timing
instrumentation, so any conclusion based only on observation would be guesswork.

From code inspection and synthetic replay, the strongest current conclusion is:

- Upstream camera backpressure is mostly bounded. Android uses CameraX
  `STRATEGY_KEEP_ONLY_LATEST`; iOS uses `alwaysDiscardsLateVideoFrames = true`.
- Native inference is synchronous per accepted frame. If native preprocessing/inference is slow,
  the app should drop camera frames rather than accumulate an unbounded camera queue.
- Android has a likely native cost center: every frame is converted to a `Bitmap`, and rotated
  with `Bitmap.createBitmap` when needed before MediaPipe receives it.
- JS pose processing is mostly bounded and non-React. Session screens throttle UI state to
  roughly 10 Hz and submit skeleton updates imperatively.
- The default premium renderer is now `point_cloud_body`, not the older constellation renderer.
  The production figure can emit close to 900 SVG dot path segments per renderer update.
- Static Node replay shows pure geometry generation for the full point-cloud body is cheap
  on a desktop CPU (`p95 0.545 ms` over 120 synthetic frames), so the main renderer risk is
  probably React Native/SVG commit, path parsing, and device drawing cost, not the math that
  creates path strings.
- The point-cloud body renderer already has a visual-only backpressure guard: when a render
  RAF is pending, it skips generating another visual frame. The constellation renderer
  coalesces React state commits but still performs geometry generation for every incoming pose
  event.
- Double smoothing is mostly avoided in the main assessment/training screens because they pass
  `frameSource="raw"` and `smoothingEnabled={false}`. Other surfaces or default config paths
  can still add smoothing latency.

Primary recommendation: do not downgrade pose model quality or visual fidelity blindly. First
run a physical-device benchmark with the new diagnostics enabled and compare raw skeleton,
minimal constellation, full constellation, and full point-cloud body. If raw skeleton is fresh
but full point-cloud is stale or janky, keep the premium visual design but move the dense figure
off React/SVG reconciliation into a single batched draw path. If raw skeleton is already stale,
fix native capture/preprocess/inference/event timing before touching the renderer.

## What Changed In This Pass

### Native Latency Diagnostics

Added optional native timing fields behind a disabled-by-default prop:

- `latencyDiagnosticsEnabled?: boolean`
- monotonic `frameId`
- source camera timestamp where available
- native preprocess start/end
- MediaPipe submit/result callback timing
- native result conversion end
- native event dispatch time
- native clock identifier

Files:

- `modules/expo-pose-detection/src/ExpoPoseDetection.types.ts`
- `modules/expo-pose-detection/src/PoseDetectionView.tsx`
- `modules/expo-pose-detection/android/src/main/java/expo/modules/posedetection/ExpoPoseDetectionModule.kt`
- `modules/expo-pose-detection/android/src/main/java/expo/modules/posedetection/PoseDetectionView.kt`
- `modules/expo-pose-detection/ios/ExpoPoseDetectionModule.swift`
- `modules/expo-pose-detection/ios/PoseDetectionView.swift`

Android also now wraps major native stages in `Trace` sections when diagnostics are enabled:

- `HalePose.preprocess`
- `HalePose.mediapipe`
- `HalePose.nativeResultConversion`
- `HalePose.eventEmit`

### JS Latency Diagnostics

Added a disabled-by-default diagnostics collector and overlay:

- `src/diagnostics/poseLatencyDiagnostics.ts`
- `src/diagnostics/PoseLatencyDiagnosticsOverlay.tsx`

Wired it into:

- `src/screens/LiveSessionScreen.tsx`
- `src/screens/CheckUpScreen.tsx`
- `src/screens/TrainingSessionScreen.tsx`
- `src/screens/MicroCheckScreen.tsx`

Enable with:

```bash
EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS=1
```

The overlay reports rolling:

- native event Hz
- session output Hz
- renderer update submission Hz
- native preprocess / inference / postprocess / enqueue timings
- JS processing time
- approximate pose age at JS receipt
- approximate pose age at renderer submission
- stale and out-of-order frame counts

Pose age is explicitly approximate because Android, iOS, and JS clocks do not share a direct
epoch. The collector calibrates source/native timestamps to the JS monotonic clock using the
first observed event offset. This is good enough to detect large stale-frame behavior, but not
for sub-frame scientific timing.

### Synthetic Renderer Replay

Added:

- `src/diagnostics/poseRendererReplay.ts`
- `scripts/pose-renderer-replay.ts`
- npm script `pose-renderer-replay`

This benchmark feeds identical synthetic landmark motion through representative visual modes
and measures pure JS geometry generation. It does not measure native camera, MediaPipe, React
Native commit, react-native-svg parsing, GPU drawing, display vsync, or bridge/Fabric cost.

Command:

```bash
npm run pose-renderer-replay -- 120
```

Result from this pass:

| Mode | p50 | p95 | Max | Avg Dots | Max Dots |
| --- | ---: | ---: | ---: | ---: | ---: |
| raw-skeleton | 0.017 ms | 0.036 ms | 0.264 ms | 0.0 | 0 |
| minimal-constellation | 0.028 ms | 0.058 ms | 0.555 ms | 43.7 | 45 |
| full-constellation | 0.081 ms | 0.152 ms | 0.893 ms | 185.9 | 190 |
| full-point-cloud-body | 0.295 ms | 0.545 ms | 2.110 ms | 894.0 | 894 |

Interpretation: the point-cloud body has roughly 3.6x the synthetic geometry cost of the full
constellation and roughly 10.5x the minimal constellation, but the absolute JS geometry cost is
small on this machine. Real-device RN/SVG rendering remains the unmeasured risk.

## Pipeline Map

### Android

Current Android flow:

1. CameraX receives a frame.
2. `ImageAnalysis` is configured with:
   - `STRATEGY_KEEP_ONLY_LATEST`
   - target resolution `640x480`
   - `OUTPUT_IMAGE_FORMAT_RGBA_8888`
3. Analyzer runs on a single background executor.
4. Frame is converted via `imageProxy.toBitmap()`.
5. If rotation is non-zero, frame is copied again with `Bitmap.createBitmap(...)`.
6. Bitmap is wrapped in `BitmapImageBuilder`.
7. MediaPipe `PoseLandmarker.detectForVideo(...)` runs synchronously.
8. Landmark payload is flattened.
9. Event dispatch is posted back to the main thread.
10. JS receives `onLandmarks`.

Important native settings:

- `RunningMode.VIDEO`
- `numPoses(1)`
- confidence defaults around `0.35`
- default model asset `pose_landmarker_lite.task`
- GPU delegate first, CPU fallback

Latency risks:

- Bitmap conversion and rotation can cost real milliseconds per frame.
- Synchronous inference means accepted frames cannot overlap inference.
- Event dispatch returns through the main thread, so main-thread pressure can delay JS receipt.

Backpressure assessment:

- CameraX keep-latest prevents unbounded camera queue growth.
- The analyzer can still spend too long on accepted frames, reducing effective event Hz.
- The new frame IDs and approximate pose age metrics should reveal whether JS is receiving old
  frames or simply fewer fresh frames.

### iOS

Current iOS flow:

1. `AVCaptureVideoDataOutput` receives BGRA frames.
2. Capture preset uses `.vga640x480`.
3. `alwaysDiscardsLateVideoFrames = true`.
4. PoseLandmarker runs in `.video` mode synchronously on the video queue.
5. Landmark payload is flattened.
6. Event dispatch is sent to JS.

Important native settings:

- `RunningMode.video`
- `numPoses = 1`
- GPU delegate first, CPU fallback
- model asset `pose_landmarker_lite.task`

Latency risks:

- Synchronous inference on the capture queue can reduce effective frame rate.
- Main-thread dispatch and JS event delivery can still be delayed by app load.

Backpressure assessment:

- `alwaysDiscardsLateVideoFrames` is the right high-level posture for a live overlay.
- The new timing payload should show whether accepted frames remain fresh.

### JS Session Path

Current session screens follow this general pattern:

1. Native `onLandmarks` event arrives.
2. Optional dev recorder writes the event.
3. Diagnostics mark JS receipt when enabled.
4. `pipeline.process(event)` parses raw landmarks, validates subject, smooths pose data, and
   produces raw/display/measurement frames.
5. Session player or check-up orchestrator consumes the result.
6. UI state updates are throttled to `UI_UPDATE_INTERVAL_MS = 100`.
7. Skeleton/figure renderer is updated imperatively through `skeletonRef.current?.update(...)`.

Latency risks:

- Any synchronous work in `onLandmarks` competes with JS event handling.
- JS is still responsible for pose processing, session logic, and renderer update submission.
- React UI state is throttled, but the figure renderer still uses React state internally.

Backpressure assessment:

- The hot path is mostly outside whole-screen React rendering.
- UI state throttling protects the app shell.
- Renderer-level backpressure differs by renderer mode.

## Renderer Audit

### Current Default

`src/render/poseAvatarConfig.ts` sets:

```ts
DEFAULT_POSE_AVATAR_RENDERER_MODE = 'point_cloud_body'
```

This means the premium full-body figure is the default renderer, not the older constellation
mode.

### Point Cloud Body Renderer

Key properties:

- Batches many visual dots into a small number of SVG path strings.
- Uses RAF to coalesce React state commits.
- Has a visual-only backpressure guard:
  - if a RAF commit is already pending, it returns early and skips generating another visual
    frame.
- In assessment/training screens, commonly configured with:
  - `pointCloudBodyDensity="high"`
  - `pointCloudBodyMaxDots={900}`
  - `pointCloudBodyDotScale={1.72}`
  - `smoothingEnabled={false}`
  - `frameSource="raw"`

Likely behavior:

- It should not build an unbounded queue of visual frames.
- It may still consume meaningful time in RN/SVG commit, path parsing, and drawing on device.
- If commit/draw is slower than camera events, visual update Hz will fall, but freshness should
  remain bounded because skipped visual frames are dropped.

### Constellation Renderer

Key properties:

- RAF coalesces React state publication.
- Does not appear to early-return before geometry generation when a RAF is already pending.
- Therefore, it can still spend JS time building geometry for every pose event while only
  publishing the latest paths once per RAF.

Likely behavior:

- Less dense visually than point-cloud body.
- Potentially less drawing pressure.
- Potentially more unnecessary JS work than point-cloud body under high event rate because
  geometry generation is not skipped while a RAF is pending.

### Raw Skeleton

Raw skeleton is the best diagnostic baseline because it has the fewest visual primitives and
least styling complexity.

It should be used as the first physical-device comparator, but raw skeleton freshness was not
measured during this pass.

## Smoothing Audit

There are three relevant smoothing layers.

### Measurement One-Euro Smoothing

`src/pose/filters.ts`:

- `minCutoff = 1.2`
- `beta = 0.6`
- `dCutoff = 1.0`

At 30 fps and low movement speed, this produces an approximate alpha of `0.201`, with:

- half response in roughly 3 frames (`~103 ms`)
- 90% response in roughly 10 frames (`~343 ms`)

This is appropriate for stable measurement signals, but should not drive the live premium
figure if freshness is the priority.

### Display One-Euro Smoothing

`src/pose/filters.ts`:

- `minCutoff = 2.6`
- `beta = 1.5`
- `dCutoff = 1.0`

At 30 fps and low movement speed, this produces an approximate alpha of `0.352`, with:

- half response in roughly 2 frames (`~53 ms`)
- 90% response in roughly 5 frames (`~176 ms`)

During faster movement, `beta` increases responsiveness.

### Renderer Pose Smoothing

`src/render/poseSmoothing.ts` uses an EMA-like smoother with adaptive alpha:

- default alpha around `0.78`
- min alpha around `0.58`
- max alpha around `0.9`

At 30 fps:

- alpha `0.58` reaches 90% in roughly 3 frames (`~88 ms`)
- alpha `0.78` reaches 90% in roughly 2 frames (`~51 ms`)
- alpha `0.9` reaches 90% in roughly 1 frame (`~33 ms`)

Current main assessment/training screens pass `smoothingEnabled={false}` and `frameSource="raw"`.
That is good for freshness. If another surface uses display frames plus renderer smoothing, the
two smoothing layers can stack and make the figure visibly trail the body.

## Evidence Matrix

| Question | Current Evidence | Answer |
| --- | --- | --- |
| Is native camera capture queueing old frames? | Android keep-latest, iOS discard-late | Unbounded capture queue is unlikely |
| Is native inference too slow? | Not measured on device | Unknown |
| Is Android preprocessing costly? | Per-frame `Bitmap` conversion and possible rotation copy | Plausible |
| Is JS pipeline too slow? | Code is mostly preallocated/synchronous; not measured on device | Plausible but not proven |
| Is renderer geometry generation too slow? | Synthetic replay p95 under 1 ms on desktop | Not likely the dominant math cost |
| Is RN/SVG rendering too slow? | Dense 900-dot SVG paths, no device trace | Plausible and high priority to measure |
| Is smoothing causing intentional lag? | Main screens use raw + smoothing off; defaults elsewhere may smooth | Not dominant in main sessions, possible elsewhere |
| Is the issue latency, jank, or both? | No physical trace yet | Both are plausible; instrumentation now separates them |

## How To Measure On Device

### Build / Run

Use a development or release-like build on the physical device:

```bash
EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS=1 npx expo run:android --device
```

For iOS:

```bash
EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS=1 npx expo run:ios --device
```

Prefer a release-like build for final numbers because dev mode can distort JS and rendering
performance.

### Android Trace

Capture a Perfetto/Systrace session and filter for:

- `HalePose.preprocess`
- `HalePose.mediapipe`
- `HalePose.nativeResultConversion`
- `HalePose.eventEmit`

Also inspect:

- main thread stalls
- RenderThread frame misses
- JS thread long tasks
- GPU/compositor frame misses

### App Overlay

With diagnostics enabled, record these values for each visual mode:

- event Hz
- output Hz
- renderer update Hz
- native preprocess p50/p95
- native inference p50/p95
- JS processing p50/p95
- approximate pose age at JS p50/p95
- approximate pose age at render submission p50/p95
- stale frames
- out-of-order frames

### Required Comparisons

Run the same physical setup for:

1. raw skeleton
2. minimal constellation
3. full constellation
4. full point-cloud body
5. full point-cloud body with low-latency config

The comparison should answer:

- If raw skeleton is stale: native capture/preprocess/inference/event delivery is the issue.
- If raw skeleton is fresh but dense renderers are stale or visibly uneven: renderer commit/draw
  is the issue.
- If pose age is low but motion looks uneven: this is mostly jank/update cadence, not stale
  camera data.
- If pose age is high and update cadence is uneven: both latency and jank are present.

## Recommended Decision Tree

### Case A: Raw Skeleton Is Already Stale

Prioritize native and event delivery:

1. Reduce Android frame preprocessing cost.
2. Avoid unnecessary bitmap rotation/copy if MediaPipe can consume rotation metadata or a
   cheaper image path can be used.
3. Confirm GPU delegate is actually active.
4. Keep latest-frame semantics all the way through native-to-JS delivery.
5. Drop native events that are already stale before posting to JS.
6. Consider a lower analysis resolution only after measuring the quality impact.

Do not start by simplifying the premium renderer in this case; the renderer would be masking
the actual freshness issue.

### Case B: Raw Skeleton Is Fresh, Full Figure Is Stale Or Janky

Prioritize renderer architecture:

1. Keep the premium warm filled figure direction.
2. Move dense dot drawing off React/SVG reconciliation into one batched drawing surface.
3. Preserve visual-only frame dropping so renderer work never queues.
4. Keep assessment/session logic unchanged.
5. Keep native MediaPipe model and camera resolution unchanged unless traces show native cost.

Most likely implementation options:

- native custom drawing view fed with latest landmarks
- Skia/canvas-like batched draw path, if dependency risk is accepted
- a simpler temporary SVG renderer only as a beta fallback or diagnostic mode

Given the product law around a premium skeleton/figure and the current synthetic replay result,
this is the most likely long-term path if physical traces show raw pose freshness is good.

### Case C: Pose Age Is Low But Motion Looks Uneven

Treat it as jank:

1. Measure visual update Hz and dropped RAF publications.
2. Inspect RN/SVG commit and draw time.
3. Reduce path complexity or batch drawing more aggressively.
4. Keep using freshest raw pose frames.

### Case D: Pose Age Is High And Motion Looks Uneven

Treat it as both latency and jank:

1. Fix upstream freshness first.
2. Then fix renderer draw cadence.
3. Avoid adding smoothing to hide jank; it will make latency feel worse.

## Acceptance Criteria

For a beta-quality live overlay on a Galaxy S22-class Android device:

- native event Hz: at least 24 Hz during a normal framed body session
- renderer update submissions: at least 20 Hz for premium figure
- approximate pose age at JS p95: under 100 ms
- approximate pose age at render submission p95: under 130 ms
- JS pose processing p95: under 4 ms
- native preprocess p95: under 6 ms
- native inference p95: under 25 ms for lite model
- no steadily increasing stale-frame count during a 60-second session
- no visible freeze longer than 150 ms during ordinary movement

For iPhone-class devices:

- same freshness targets
- native inference budget may be tighter depending device class, but should remain below one
  frame interval for a 30 fps target whenever possible

These criteria should be revised after first real-device measurements.

## Validation Performed

Passed:

```bash
npm test -- --runInBand src/diagnostics/__tests__/poseLatencyDiagnostics.test.ts
npm run pose-renderer-replay -- 120
npx expo config --type public
git diff --check
cd android && ./gradlew :app:assembleDebug
```

`npx expo config --type public` emitted the existing Sentry config warning about missing
organization/project values, but completed successfully.

Failed due existing unrelated worktree issues:

```bash
npm run typecheck
npm test -- --runInBand
```

Typecheck failures observed:

- `src/exercises/progressionPolicy.ts(367,5)`
- `src/exercises/progressionPolicy.ts(509,5)`

Full test failures were concentrated in existing progression/session-planning expectations,
including:

- `src/haleFlow/__tests__/stage5hLifecycle.integration.test.ts`
- `src/haleFlow/__tests__/sessionPlanning.test.ts`
- `src/training/__tests__/workoutGeneration.test.ts`
- `src/haleFlow/__tests__/progressionEvidence.test.ts`
- `src/explore/__tests__/exploreViewModel.test.ts`

Those failures predate and are unrelated to the pose overlay diagnostics added in this pass.

## Final Recommendation

The safest next step is a measured renderer ablation on physical devices using the new
diagnostics. Do not reduce model quality, camera resolution, or premium visual fidelity until
the raw skeleton baseline proves where the delay begins.

If the raw skeleton is fresh and the full point-cloud body is not, pursue a batched non-React
drawing path for the premium figure. That preserves Hale's product direction while addressing
the most likely renderer bottleneck. If the raw skeleton is already stale, focus first on the
native Android bitmap/rotation/inference path and stale-event rejection.
