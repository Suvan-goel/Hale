# Pearl Rigged Human Silhouette Benchmark

Date: 2026-06-24

Scope: diagnostics-only benchmark renderer replacing the rejected matte-graphite digital-twin
prototype. Production camera screens, production renderer defaults, native MediaPipe settings,
and native camera scheduling are unchanged.

## 1. Files Changed

- `src/render/RiggedHumanSilhouetteRenderer.tsx`
- `src/render/riggedHumanSilhouetteGeometry.ts`
- `src/render/riggedHumanSilhouetteConfig.ts`
- `src/render/__tests__/riggedHumanSilhouetteGeometry.test.ts`
- `src/render/PoseAvatarRenderer.tsx`
- `src/render/poseAvatarTypes.ts`
- `src/render/__tests__/poseAvatarConfig.test.ts`
- `src/screens/PoseOverlayBenchmarkScreen.tsx`
- `src/diagnostics/poseRendererReplay.ts`
- `src/diagnostics/__tests__/poseLatencyDiagnostics.test.ts`
- `docs/decisions.md`
- `docs/audits/PEARL_RIGGED_HUMAN_SILHOUETTE_BENCHMARK.md`

## 2. Rejected Experimental Files

Active matte prototype files were renamed/replaced and no longer exist as active source:

- `src/render/MatteGraphiteDigitalTwinRenderer.tsx`
- `src/render/matteGraphiteDigitalTwinGeometry.ts`
- `src/render/matteGraphiteDigitalTwinConfig.ts`
- `src/render/__tests__/matteGraphiteDigitalTwinGeometry.test.ts`

Historical audit reports and prompts for the sculpted and matte prototypes remain in `docs/audits`
because they are project history, not active runtime code.

## 3. New Benchmark Mode ID

- Benchmark mode: `rigged-human-silhouette`
- Renderer mode: `rigged_human_silhouette`

`resolvePoseAvatarRendererMode` still rejects this mode for env/default production selection.
An explicit benchmark prop can select it.

## 4. Rendering Technology

The renderer uses the existing `react-native-svg` stack with one SVG root. It renders a fixed
set of filled `Path` surfaces using matte graphite gradients. It does not use filters, blur,
shadows, particles, raster assets, 3D, or new native/runtime dependencies.

## 5. Rest-Template Strategy

The geometry module defines original normalized front and side rest templates with identical
topology. The templates are generated once from 14 neutral body rings with 8 control points per
ring, for 112 internal control points total. They are not copied from an image and are not
displayed directly as triangles.

## 6. Skinning And Deformation

The internal rig has 17 virtual bones:

`pelvisRoot`, `lowerSpine`, `upperSpine`, `neck`, `head`, left/right clavicle, left/right upper
arm, left/right forearm, left/right thigh, left/right lower leg, and left/right foot.

Each internal control point has one or two bone influences. The visible silhouette is emitted as
smooth filled SVG surface paths anchored to the current raw MediaPipe landmarks: central
head-neck-torso-pelvis shell, left/right arms, left/right legs, torso highlight, and far-side
shade.

## 7. Internal Vertex/Control-Point Count

- Internal control points: 112
- Fixed topology: yes
- Preallocated output buffer: yes, on geometry creation

## 8. Virtual Bone Count

- Virtual bones: 17

## 9. Visible Surface/Path Count

- Visible surface paths in synthetic replay: 7
- Hard cap in config: 8
- Dynamic path count in synthetic replay: 7

The hidden `sternumAccent` slot remains available in the fixed surface array but is not visible;
the rendered body is featureless graphite rather than branded with an accent mark.

## 10. Front/Side Orientation Strategy

`ScreenPoseLandmarks` does not expose MediaPipe Z, so near/far depth ordering uses deterministic
right-rear/left-front fallback. Orientation is estimated from apparent shoulder and hip width
relative to torso length and calibrated proportions. A renderer-local orientation state applies
hysteresis, producing `front`, `three-quarter`, or `side` plus an orientation factor.

## 11. Proportion Calibration

Calibration samples reliable shoulder/hip/head/limb proportions while the benchmark renderer is
active. After 12 valid samples, proportions lock. Calibration resets when the benchmark renderer
remounts and when tracking is lost. Raw joint positions are not smoothed.

States:

- `neutral`
- `collecting`
- `locked`

## 12. New Dependencies

No new dependencies were added.

## 13. Production Behaviour

No production behaviour changed. Production defaults remain `point_cloud_body`. The new mode is
not selected by live session, check-up, micro-check, Movement Profile V2 check-up, training, or
recording screens, and it is not accepted by env/default renderer resolution.

## 14. Synthetic Geometry Results

Command:

```text
npm run pose-renderer-replay -- 180
```

Result for `rigged-human-silhouette`:

```text
p50 geometry: 0.046 ms
p95 geometry: 0.131 ms
p99 geometry: 0.318 ms
max geometry: 1.711 ms
visible surface paths: 7
dynamic paths: 7
internal control points: 112
virtual bones: 17
calibration state: locked
orientation profile: front
```

Comparison from the same run:

```text
raw-skeleton p95: 0.033 ms, 12 line primitives
minimal-constellation p95: 0.047 ms, ~61 average primitives
full-constellation p95: 0.175 ms, ~203 average primitives
full-point-cloud-body p95: 0.422 ms, 894 primitives
```

## 15. Physical Benchmark

A physical Samsung SM-S901B LIVE meta 640 benchmark was not collected in this pass. The synthetic
replay results above must not be treated as a device-profile benchmark.

## 16. How To Open And Run

1. Build/run with pose latency diagnostics enabled:

```text
EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS=1
EXPO_PUBLIC_ALLOW_DIAGNOSTICS_IN_RELEASE=1
```

2. Open the diagnostics Pose Overlay Benchmark screen.
3. Select `Rigged human silhouette`.
4. Select `LIVE meta 640`.
5. Run the 60-second benchmark sequence: stand still, arm sweeps, torso movement, repeated chair
   stands, stand still again.
6. Export JSON and compare against `Raw skeleton` and `Point cloud 450`.

## 17. Validation Results

Passed:

- `npx jest src/render/__tests__/riggedHumanSilhouetteGeometry.test.ts src/render/__tests__/poseAvatarConfig.test.ts src/diagnostics/__tests__/poseLatencyDiagnostics.test.ts --runInBand`
- `npx jest src/render/__tests__ src/diagnostics/__tests__/poseLatencyDiagnostics.test.ts --runInBand`
- `npm run pose-renderer-replay -- 180`
- `npx tsc --noEmit --pretty false`
- `npx expo config --type public`
- `./gradlew :app:assembleDebug`
- `./gradlew :app:assembleRelease`

Expected existing warnings observed:

- Watchman recrawl warning during Jest
- Sentry organization/project fallback warning during Expo/Android config
- Missing `NODE_ENV` warning during Gradle Expo config
- Gradle deprecation warning

## 18. Known Visual Limitations

- Depth ordering is deterministic because mapped screen landmarks do not include Z.
- Orientation is width-based and can mistake narrow front-facing posture for a side profile.
- The visible paths still approximate a smooth silhouette; they are not a full mesh render.
- Hands and feet use conservative integrated fallbacks when terminal landmarks are unreliable.
- Physical device visual continuity, perceived connection, and premium appearance still need the
  requested SM-S901B benchmark and subjective review.
