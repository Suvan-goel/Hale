# Pearl Constellation V2 Benchmark

Date: 2026-06-24

## 1. Why The Constellation Aesthetic Was Retained

The existing dense point-cloud figure remains the strongest Pearl visual direction: abstract but recognisably human, textured, premium, and less likely to feel like a toy mannequin or medical skeleton. This pass keeps that aesthetic and changes the renderer architecture used for benchmark comparison.

## 2. Current Baseline Architecture

The preserved baseline mode is `point-cloud-900`, shown in the benchmark UI as `Current 900-dot SVG`.

It still uses the existing JavaScript/React Native SVG path renderer:

- `SkeletonView`
- `PoseAvatarRenderer`
- `PointCloudBodyPoseRenderer`
- `buildPointCloudBodyGeometry`
- latest-frame JS RAF scheduler
- raw landmarks
- no renderer smoothing in the benchmark configuration

Only the display title was clarified. Its renderer props, dot cap, density, dot scale, keypoints, and path pipeline were not ported or changed.

## 3. V2 Native Architecture

The new benchmark-only modes are:

- `constellation-v2-900-native` -> native overlay prop `constellation-v2-900`
- `constellation-v2-600-native` -> native overlay prop `constellation-v2-600`

Both are Android-only in this pass. The backend is `android-native-canvas` inside the local Expo pose-detection module:

```text
CameraX frame
-> MediaPipe PoseLandmarker native result
-> upright raw landmark array
   -> native Constellation V2 latest-frame overlay
   -> existing latest-only native-to-JS event path
```

The V2 overlay does not wait for JS, React state, SVG path generation, or the JS RAF scheduler.

## 4. Fixed-Topology Model

Topology is generated deterministically for each V2 mode from stable region allocations and hash/low-discrepancy local coordinates. Point metadata is fixed for the lifetime of the mode activation:

- point id
- body region
- local coordinates
- one or two influence labels and weights
- role: boundary, interior, or structural
- radius tier
- tone role
- draw batch

Topology is not rebuilt per frame.

## 5. Stable Point Identity

Every point keeps its id, region, role, radius tier, tone, and batch. Per-frame work only maps the fixed local point into the current raw landmark rig and writes x/y into preallocated draw buffers.

## 6. Body-Region And Virtual-Rig Mapping

The native rig uses 17 regions:

```text
head, neck, upper torso, lower torso, pelvis,
left/right upper arm, left/right forearm, left/right hand,
left/right thigh, left/right lower leg, left/right foot
```

Torso and pelvis use shoulder, hip, and spine-derived anchors. Limbs use tapered capsules around MediaPipe bone chains. Hands and feet use simplified endpoint masses with distal landmark fallback.

## 7. 900-Point Distribution

The V2 900 topology uses exactly 900 points:

- head/neck: 81
- torso: 265
- pelvis: 72
- arms/hands: 182
- legs/feet: 300

The role allocation is inside the target range:

- boundary: 30-38%
- structural/accent: 8-12%
- remaining points are interior volume

## 8. 600-Point Perceptual-900 Distribution

The V2 600 topology uses exactly 600 points and is tuned to read closer to the current
900-dot point-cloud baseline rather than as a sparse outline. Boundary, structural, and
interior roles use role-local sampling so sparse roles span the full length of each body
region.

- head/neck: 58
- torso: 178
- pelvis: 50
- arms/hands: 128
- legs/feet: 186

The role allocation is inside the target range:

- boundary: 33-39%
- structural/accent: 8-12%
- remaining points are interior volume

## 9. Radius Tiers

Each point receives exactly one fixed radius tier:

- micro interior
- standard body
- larger boundary

V2 600 uses slightly larger stroke radii than 900, but avoids the oversized outline-heavy
treatment from the first 600 pass.

## 10. Palette And Depth Strategy

The active native Canvas paints align with the app palette:

- primary ink: `#111412`
- far stone: `#68706A`
- Pearl green: `#414C34`
- card/background inherited from the native view canvas

Depth is deterministic in this pass: right-side limb regions use the far graphite role. No per-point noisy Z recolouring is applied.

## 11. Calibration Strategy

The renderer draws immediately from neutral/live proportions. During the first 30 valid transform frames it collects:

- shoulder width
- hip width
- torso length
- head scale
- upper-arm length
- forearm length
- thigh length
- lower-leg length

It then locks medians for the current benchmark run. Calibration resets on V2 mode change, native reset key change, view stop, or unmount. Live joint positions are not smoothed or delayed.

## 12. Native Batching Strategy

The overlay owns preallocated `FloatArray` point buffers. Each visual frame:

1. copies no camera frames to JS;
2. transforms fixed topology points into the current view;
3. fills native batch buffers;
4. draws with `Canvas.drawPoints`.

## 13. Draw-Call Count

The renderer uses at most 7 batches:

- primary graphite micro
- primary graphite standard
- primary graphite boundary
- far graphite micro
- far graphite standard
- far graphite boundary
- emerald accents

## 14. Buffer And Allocation Strategy

Each active mode allocates one set of fixed buffers sized for the topology. Runtime frame work reuses:

- topology metadata
- point buffers
- paint objects
- calibration storage
- metric windows

The measured buffer size is reported in native diagnostics as `pointBufferBytes`.

## 15. Latest-Only Scheduling

The V2 overlay keeps at most one latest pose snapshot. Older/equal frame ids are rejected. If a draw is already pending, newer accepted poses replace the stored pose and increment the coalesced count. The next draw consumes the newest pose.

The existing native-to-JS latest-event scheduler is unchanged.

## 16. Diagnostics Schema

Native renderer diagnostics are nested under `latency.nativeRenderer` and exported from the benchmark result as `rendererNative`.

Fields include:

- backend
- requested and actual point counts
- topology build count and time
- calibration state
- virtual region count
- draw batch count
- point buffer bytes
- transform and draw metric snapshots
- source age at draw start/end
- frames requested/drawn/coalesced/rejected
- latest frame id drawn
- published Hz
- dropped invalid point count
- non-finite geometry count
- last visible point count
- emerald point count

The existing JS/SVG baseline continues to report JS geometry metrics. Native V2 modes do not fabricate JS `geometryMs`.

## 17. Synthetic Benchmark Results

These are JVM unit-test transform timings from `ConstellationV2TransformTest.syntheticBenchmarkReportsTransformMetrics`. They are useful for deterministic transform cost comparison only. They are not physical-device Canvas draw timings.

```text
constellation-v2-900: points=900, batches=7, transformMs p50=0.2010, p95=0.2538, p99=2.4648, max=5.4438
constellation-v2-600: points=600, batches=7, transformMs p50=0.0383, p95=0.0455, p99=0.0722, max=1.1008
```

## 18. Physical Results

No physical benchmark was collected in this implementation pass.

Physical results must come from a release/profileable Android run on the target device. Do not compare the JVM synthetic numbers as real device draw performance.

## 19. Comparison Protocol

Use the diagnostics benchmark screen with:

```text
Native profile: LIVE meta 640
Build: release/profileable
Device: Samsung SM-S901B
Duration: 60 seconds per mode
```

Run:

```text
Current 900-dot SVG
Constellation V2 - 900
Constellation V2 - 600
```

Movement sequence:

- stand still
- arm sweeps
- torso movement
- repeated chair stands
- stand still again

Compare visual preference, point stability, native transform/draw p95/p99, native enqueue p95, source age, published Hz, coalesced frames, and stale/out-of-order frames.

## 20. Known Limitations

- V2 is Android-only in this pass.
- iOS has no V2 fallback mode, intentionally, to avoid misleading benchmark comparisons.
- Canvas draw timing is only collected from the live Android view.
- Depth is deterministic by side instead of dynamic Z.
- The V2 distribution has not yet received physical visual QA across all assessment poses.
- The native overlay currently lives inside the same view as the camera canvas rather than a separate child overlay view.

## 21. Criteria For Production Integration

Before production integration:

- collect physical Android benchmark results;
- inspect visual quality against the current 900-dot SVG baseline;
- verify no point swimming, density flicker, mirroring error, or orientation mismatch;
- decide whether V2 900 or V2 600 is the stronger visual/performance tradeoff;
- add iOS parity or explicitly defer it;
- keep the camera as a measuring instrument, never a form judge.

## 22. Android/iOS Parity Considerations

Android now has a benchmark-only native Canvas renderer. iOS only accepts the shared props as no-ops. A production phase should either implement an equivalent iOS single-surface renderer or keep V2 out of production until parity is available.
