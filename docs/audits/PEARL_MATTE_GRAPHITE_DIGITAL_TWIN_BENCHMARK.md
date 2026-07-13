# Pearl Matte Graphite Digital Twin Benchmark

Date: 2026-06-24

Scope: diagnostics-only benchmark renderer replacing the rejected sculpted figure prototype. This
pass does not change production sessions, check-ups, training screens, micro-checks, MediaPipe
configuration, measurement logic, exercise progression, rotation handling, or the latest-only
native event scheduler.

## 1. Why The Previous Sculpted Figure Was Rejected

The previous benchmark-only sculpted figure achieved low primitive count, but it was built from
visible body pieces: transformed ovals, capsules, a separate pelvis shape, split upper/lower
limbs, and a long emerald seam. It read as a cheap capsule mannequin rather than a premium
body-neutral digital representation. Because the issue was conceptual, not just styling, the old
renderer was removed instead of refined.

## 2. Design Rationale

The replacement is a continuous, featureless, softly shaded graphite body surface: closer to a
matte health-tech digital twin than a skeleton, point cloud, robot, medical model, or toy avatar.
It keeps visual mass and abstraction while cutting render primitives dramatically below the
450-dot and 900-dot point-cloud modes.

## 3. User-Representation Strategy

The renderer uses current raw pose landmarks for movement and pose. It reflects shoulder width,
hip width, torso length, head-to-body proportion, and limb segment lengths through calibrated
proportions, but it does not infer body fat, weight, muscularity, sex, clothing silhouette, or
age. Personalisation comes from proportions and motion, not speculative body shape.

## 4. Body-Neutrality Rules

The surface uses neutral standardised thickness ratios anchored to measured skeletal proportions.
It avoids skin tones, chest/waist/hip emphasis, muscle anatomy, facial features, fingers, toes,
and any judgemental body-shape cues.

## 5. Colour And Material System

The benchmark card remains white with `#E6E9E7` border. The figure uses the requested matte
graphite palette:

| Role | Color |
| --- | --- |
| Deep graphite shadow | `#18211F` |
| Primary graphite surface | `#2A3632` |
| Mid graphite | `#44514C` |
| Soft graphite highlight | `#6B7771` |
| Far-side graphite | `#35413D` |
| Pearl emerald accent | `#087A5B` |
| Low-confidence graphite | `#89938E` |
| Card background | `#FFFFFF` |

Static reusable linear gradients provide broad matte volume. There are no filters, blur, glow,
drop shadows, particles, masks, or dynamic lighting calculations.

## 6. Surface Inventory

Normal output is 8 dynamic filled paths:

| Surface | Count | Notes |
| --- | ---: | --- |
| Continuous head-neck-torso-pelvis shell | 1 | One filled path, no floating head or separate pelvis block |
| Continuous arms | 2 | Shoulder through elbow, wrist, and integrated hand wedge |
| Continuous legs | 2 | Hip through knee, ankle, and integrated foot wedge |
| Tonal overlays | 2 | Broad highlight and restrained side shade |
| Pearl accent | 1 | Tiny sternum mark, no seam or stripe |

The normal rendered path count is 8, under the hard cap of 14.

## 7. Geometry/Deformation Architecture

The implementation uses continuous 2D surface paths from curved centreline geometry. Each limb is
generated from a shoulder/hip-to-terminal centreline with tapered widths and smooth cubic
boundaries, so elbows and knees bend inside one continuous surface instead of splitting into
capsules. The central body shell is one path connecting head, neck, shoulders, waist, and pelvis.

No 3D engine, Skia, camera segmentation, extra dependency, pose smoothing, or animation system was
added.

## 8. Proportion Calibration

`MatteGraphiteDigitalTwinRenderer` owns a benchmark-run calibration object. While the renderer is
mounted it collects valid frames, derives medians for body scale, shoulder width, hip width,
torso length, head proportion, and limb lengths, then locks after 12 samples. Rendering starts
immediately with fallback/current proportions; only slow-changing proportions are stabilised.
Joint positions remain the newest raw mapped landmarks.

Selecting a different benchmark mode, changing native profile, or starting a new benchmark run
remounts the renderer and resets calibration with the benchmark metrics.

## 9. Depth-Order Strategy

This first prototype uses deterministic ordering: right-side limbs render as rear surfaces, then
the central shell, then left-side limbs and overlays. MediaPipe Z is not consumed in this pass
because the existing mapped screen landmark type does not carry Z and rapid side swapping would
be worse than a stable deterministic limitation. Production adoption should revisit stable
limb-level Z ordering with hysteresis.

## 10. Render-Node And Path Counts

| Metric | Value |
| --- | ---: |
| SVG roots | 1 |
| Dynamic surface paths | 8 |
| Static transformed shape paths | 0 |
| Dots | 0 |
| Lines | 0 |
| Internal control vertices | 92 |
| Normal path cap | 8 of 14 |

Benchmark JSON records average/max surface path count, average/max internal vertex count,
average/max dynamic path count, and whether proportion calibration completed.

## 11. Scheduler Behaviour

The renderer reuses `createLatestFrameRafScheduler`:

- every valid incoming frame replaces the latest candidate;
- at most one RAF is pending;
- the RAF callback consumes the newest candidate;
- older/equal frame timestamps are rejected;
- bursts coalesce to the newest frame;
- unmount and tracking loss cancel safely.

The benchmark passes `frameSource="raw"` and `smoothingEnabled={false}`. No renderer EMA, springs,
timing animation, interpolation, or display smoothing is added.

## 12. Synthetic Benchmark Results

Command:

```bash
npm run pose-renderer-replay -- 180
```

Environment: local Node/tsx synthetic replay on 2026-06-24. These numbers measure geometry and
path construction only. They do not measure physical camera, MediaPipe, React Native commit,
`react-native-svg` path parsing, RenderThread, GPU work, or display presentation.

| Mode | p50 ms | p95 ms | p99 ms | Max ms | Avg primitives | Max primitives |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| raw-skeleton | 0.015 | 0.041 | 0.213 | 0.363 | 12.0 | 12 |
| matte-graphite-digital-twin | 0.044 | 0.187 | 0.675 | 1.338 | 8.0 | 8 |
| minimal-constellation | 0.028 | 0.066 | 0.163 | 0.554 | 60.7 | 62 |
| full-constellation | 0.081 | 0.178 | 0.786 | 0.867 | 202.8 | 207 |
| full-point-cloud-body | 0.281 | 0.475 | 0.641 | 2.334 | 894.0 | 894 |

Digital-twin-specific metrics:

| Metric | Value |
| --- | ---: |
| averageSurfacePathCount | 8 |
| maxSurfacePathCount | 8 |
| averageInternalVertexCount | 92 |
| maxInternalVertexCount | 92 |
| averageDynamicPathCount | 8 |
| maxDynamicPathCount | 8 |
| proportionCalibrationComplete | true |

## 13. Physical Benchmark Results

No physical benchmark was collected in this implementation pass. Do not use the synthetic desktop
timings as physical-device drawing or end-to-end latency timings.

## 14. Comparison Targets

Prior physical references:

| Baseline | Physical reference |
| --- | --- |
| Raw skeleton + LIVE meta 640 | source age callback p95 about 169.65 ms; publication about 13 Hz |
| Point cloud 450 + LIVE meta 640 | geometry p95 about 10 ms; enqueue p95 about 28.44 ms; publication about 13 Hz |
| Point cloud 900 + LIVE meta 640 | geometry p95 about 14 ms; enqueue p95 about 33.34 ms; publication about 12 Hz |

The matte graphite target is to stay materially cheaper than the 450-dot point cloud while
looking substantially more premium and human than the rejected sculpted prototype.

## 15. Known Visual Limitations

- Depth ordering is deterministic rather than Z-based in this prototype.
- The central shell is abstract and may need hand tuning after real-device visual review.
- Side-facing poses rely on torso estimation and may not always match true limb depth.
- Tracking-lost behaviour dims the last rendered pose without animated reacquisition.
- Physical readability on Samsung SM-S901B has not been verified.

## 16. Exact Manual Benchmark Instructions

Use:

```text
Renderer: Matte graphite digital twin
Native profile: LIVE meta 640
Duration: 60 seconds
Build: release/profileable
Device: Samsung SM-S901B
```

Movement sequence:

- stand still;
- arm sweeps;
- torso movement;
- repeated chair stands;
- stand still again.

Compare against:

```text
Raw skeleton + LIVE meta 640
Point cloud 450 + LIVE meta 640
```

Most important fields:

- geometry p95/p99;
- surface path count;
- internal control vertex count;
- native event enqueue p95;
- source age at callback p95;
- source age at emit p95;
- renderer published Hz;
- coalesced frames;
- stale/out-of-order frames;
- visual continuity;
- premium appearance;
- readability on white;
- perceived connection to the user.

## 17. Criteria For Production Adoption

Do not integrate into production unless all are true:

- physical benchmark shows freshness close to raw skeleton and materially better than point cloud;
- real-device visual review passes neutral standing, arm raise, crossed arms, side stance,
  chair-stand bottom, hinge, and single-leg balance;
- stable limb-level depth ordering is either accepted as deterministic or implemented with
  tested hysteresis;
- tracking-lost and low-confidence behaviour are reviewed with recorded landmark replay;
- production card/layout integration is designed without camera video;
- production isolation tests are replaced with positive integration tests for the chosen surface.
