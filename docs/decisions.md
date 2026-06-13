# Decision log

Significant choices, newest last. Each entry: date, decision, why, alternatives rejected.

## 2026-06-12 — Stage 1 kickoff

- **Expo SDK 56 (latest stable at time of scaffold)**, TypeScript strict, `blank-typescript`
  template (no expo-router — V1 is a small number of screens; plain navigation keeps the
  frame path simple and avoids a dependency we don't need yet).
- **Continuous Native Generation (CNG):** `android/` and `ios/` are gitignored and produced by
  `npx expo prebuild`. The only native code we own lives in `modules/expo-pose-detection`.
- **MediaPipe model binaries are not committed.** `scripts/download-models.sh` fetches
  `pose_landmarker_lite.task` into the module's Android assets and iOS resources. Run it once
  after clone, before prebuild.
- **Pipeline is pure TS with zero React/Expo imports** (`src/pose/`), so the identical code
  runs on-device and in the headless replay CLI / Jest. This is what makes record/replay
  deterministic.
- **VIDEO running mode** (synchronous `detectForVideo`/`detect(videoFrame:)` on the camera
  analysis thread) with monotonic timestamps, per the transferred Forma learnings — not
  LIVE_STREAM mode.

## 2026-06-12 — Stage 1 implementation notes

- **react-native-svg (15.15.4) added** for the skeleton renderer. Rationale: one
  `setNativeProps({d})` call per path per frame (3 calls/frame total) beats 50+ positioned
  Views, and core `Animated` can't drive arbitrary path geometry. It's the lightest viable
  option given Reanimated is banned. Flagging per the "ask before heavy dependencies"
  agreement — swap out if vetoed.
- **tsx (dev-only)** runs the replay CLI and fixture generator directly from TS.
- **Native deps pinned:** MediaPipe `tasks-vision:0.10.35`, CameraX `1.6.1` (latest stable on
  Google Maven at setup time), `MediaPipeTasksVision ~> 0.10` pod.
- **Android lifecycle:** RN 0.85's dependency tree resolves the *Java* androidx.lifecycle API —
  `PoseDetectionView` overrides `getLifecycle()` and drives `LifecycleRegistry` via
  `handleLifecycleEvent` (the `currentState` setter doesn't exist there). If a future RN bumps
  to the Kotlin lifecycle API, this must flip to `override val lifecycle`.
- **Landmark event payload** is a flat 165-double array + timestamp; an **empty array still
  emits** per frame — the pipeline needs frame continuity to drive subject-gone detection.
- **Coordinates:** normalized [0..1], upright portrait, unmirrored on both platforms
  (Android rotates via MediaPipe `ImageProcessingOptions`, iOS rotates the capture
  connection). Front-camera mirroring is applied only in the renderer.
- **Camera analysis at 640×480** — the lite model downscales to 256px internally; higher
  capture resolution buys nothing but battery drain.
- **Fixture policy:** synthetic recordings + `.expected.json` summaries are committed and
  regenerated only via `npm run fixtures`; the diff is reviewed like code. Real device
  recordings get added as fixtures when behaviors surprise us (working agreement).
- **Pre-flight overlaps pipeline warmup** intentionally: warmup gates *counting*, not framing
  guidance. Lighting check measures jitter on the RAW frame (smoothing hides the signal).
- **Test-driven pipeline fixes:** chain reliability ramps over its window (no instant trust on
  frame 1); subject validity needs only 4 visible core landmarks (side views must stay
  valid); calibration stillness gate uses EMA'd hip speed (raw jitter was resetting it).
- **jest-expo:** don't override `transformIgnorePatterns` — the preset's default is what
  transforms expo-modules-core; overriding it breaks the test bootstrap.
- **Model binaries not committed** (5.7MB each, regenerable): `scripts/download-models.sh`
  must run after clone and before prebuild, or the app throws `model-not-bundled` at runtime.
- **APK model compression (caught in verification):** AGP Deflate-compresses `.task` assets by
  default and library-level `androidResources.noCompress` does NOT govern final APK packaging —
  MediaPipe mmaps models, so this breaks at runtime. Fixed with a config plugin
  (`modules/expo-pose-detection/app.plugin.js`) that injects `noCompress += ["task","tflite"]`
  into the generated app build.gradle; verified by `unzip -v` showing `Stored` for the asset.
  This is the predicted "MediaPipe gradle quirk" — the budget for it was real.
