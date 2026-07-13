# Pearl Sculpted Figure Benchmark Prototype

Date: 2026-06-24

Scope: diagnostics-only renderer prototype for a premium, low-complexity pose figure. This pass
does not change production sessions, check-ups, training screens, MediaPipe configuration,
measurement logic, or the live metadata coordinate contract.

## Design Rationale

The sculpted figure is a deliberately simple filled silhouette, closer to a graphite gallery
sculpture than a skeleton or particle effect. It keeps Pearl's privacy rule intact by rendering
only pose-derived shapes, never camera video. The goal is visual evaluation and benchmark
comparison against raw skeleton and point-cloud modes, not production integration.

## Palette

| Role | Color |
| --- | --- |
| Primary graphite | `#26312F` |
| Rear/depth graphite | `#63706B` |
| Pearl emerald accent | `#087A5B` |
| Optional active accent | `#12A078` |
| Low-confidence grey | `#9EA7A3` |
| Card background | `#FFFFFF` |
| Card border | `#E6E9E7` |

The emerald is limited to one seam path. The figure avoids skin tones, glow, blur, shadows,
particle effects, and gradients.

## Shape Inventory

Normal pose output is 16 primitives:

| Primitive group | Count | Rendering form |
| --- | ---: | --- |
| Head | 1 | Static transformed oval unit path |
| Torso | 1 | Dynamic filled path |
| Pelvis | 1 | Static transformed capsule unit path |
| Upper/lower arms | 4 | Static transformed tapered capsule unit path |
| Thighs/lower legs | 4 | Static transformed tapered capsule unit path |
| Hands | 2 | Static transformed capsule unit path |
| Feet | 2 | Static transformed capsule unit path |
| Pearl seam | 1 | Dynamic stroked path |

Dynamic path count is 2. Static transformed shape count is 14. The static shape slot array is
fixed and reused by the geometry builder.

## Landmark Mapping

| Shape | Landmarks |
| --- | --- |
| Head | nose/ears with shoulder fallback via `getHeadEstimate` |
| Torso | shoulders and hips via `getTorsoEstimate` |
| Pelvis | left/right hips |
| Upper arms | shoulder to elbow |
| Forearms | elbow to wrist |
| Thighs | hip to knee |
| Lower legs | knee to ankle |
| Hands | wrist to index with wrist fallback |
| Feet | ankle to foot index with ankle fallback |

The renderer consumes raw pose landmarks mapped into the benchmark card viewport. It does not
smooth joint positions, infer body composition, or reconstruct the user's silhouette.

## Rendering Architecture

Files added or extended:

- `src/render/sculptedFigureConfig.ts`
- `src/render/sculptedFigureGeometry.ts`
- `src/render/SculptedPoseRenderer.tsx`
- `src/render/PoseAvatarRenderer.tsx`
- `src/render/poseAvatarTypes.ts`
- `src/screens/PoseOverlayBenchmarkScreen.tsx`
- `src/diagnostics/poseRendererReplay.ts`
- focused tests under `src/render/__tests__` and `src/diagnostics/__tests__`

Rendering uses the existing `react-native-svg` dependency. The renderer owns an opaque white
diagnostics card and maps raw pose coordinates into that card. It is selected only by the
diagnostics benchmark mode:

```text
benchmark mode: sculpted-figure
renderer mode: sculpted_body
```

`resolvePoseAvatarRendererMode` does not accept `sculpted_body` from env/default renderer
selection; benchmark code passes it explicitly as a prop.

## Primitive Counts

| Metric | Value |
| --- | ---: |
| Configured shape count | 16 |
| Max normal shape count | 16 |
| Dynamic path count | 2 |
| Static transformed shape count | 14 |
| Dot count | 0 |
| Line count | 0 |

Benchmark JSON now records scheduled, published, coalesced, rejected, and cancelled renderer
events, plus average/max shape count, dynamic path count, and static transformed shape count when
a renderer emits those metrics. Existing dot and line metrics remain unchanged for older
renderers.

## Scheduler Behavior

`SculptedPoseRenderer` uses `createLatestFrameRafScheduler` with the same latest-frame semantics
as the point-cloud benchmark path:

- every accepted incoming frame stores the newest render snapshot;
- at most one RAF is pending;
- the RAF callback renders the newest stored frame;
- older or equal frame timestamps are rejected;
- pending callbacks cancel safely on unmount or clear.

The renderer uses `frameSource="raw"` and `smoothingEnabled={false}` in the benchmark mode.

## Synthetic Benchmark Results

Command:

```bash
npm run pose-renderer-replay -- 180
```

Environment: local Node/tsx synthetic replay. These numbers measure geometry/transformation work
only, not camera, MediaPipe, React Native commit, `react-native-svg` path parsing, GPU work, or
display presentation.

| Mode | p50 ms | p95 ms | p99 ms | Max ms | Avg primitives | Max primitives |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| raw-skeleton | 0.016 | 0.049 | 0.297 | 0.312 | 12.0 | 12 |
| sculpted-figure | 0.015 | 0.059 | 0.379 | 0.705 | 16.0 | 16 |
| minimal-constellation | 0.029 | 0.059 | 0.340 | 0.508 | 60.7 | 62 |
| full-constellation | 0.079 | 0.159 | 0.320 | 0.814 | 202.8 | 207 |
| full-point-cloud-body | 0.289 | 0.560 | 1.569 | 2.706 | 894.0 | 894 |

Sculpted-specific replay metrics:

| Metric | Value |
| --- | ---: |
| averageShapeCount | 16 |
| maxShapeCount | 16 |
| averageDynamicPathCount | 2 |
| maxDynamicPathCount | 2 |
| averageStaticTransformedShapeCount | 14 |
| maxStaticTransformedShapeCount | 14 |

## Physical Benchmark Results

No physical benchmark was collected in this implementation pass. Do not use synthetic desktop
timings as physical-device drawing timings.

## Comparison Targets

Prior physical targets from the benchmark prompt:

| Baseline | Physical reference |
| --- | --- |
| Raw skeleton + LIVE meta 640 | source age callback p95 about 169.65 ms; publication about 13 Hz |
| Point cloud 450 + LIVE meta 640 | geometry p95 about 10 ms; enqueue p95 about 28.44 ms; publication about 13 Hz |
| Point cloud 900 + LIVE meta 640 | geometry p95 about 14 ms; enqueue p95 about 33.34 ms; publication about 12 Hz |

The sculpted target is to stay substantially closer to raw skeleton than to the 450-dot point
cloud in physical release testing.

## Known Visual Limitations

- Depth ordering is deterministic rather than Z-based in this first prototype, so crossing limbs
  may not always match true camera depth.
- Limb tapering uses static transformed unit paths, so it is intentionally stylized rather than
  anatomical.
- The benchmark card is owned by `SculptedPoseRenderer`; production card integration has not been
  designed.
- Tracking-lost behavior clears the figure rather than preserving a faded last pose.
- Physical readability on Samsung SM-S901B has not been verified.

## Manual Physical Benchmark Instructions

Use:

```text
Renderer: Sculpted figure
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

Most important comparison fields:

- geometry p95/p99;
- native event enqueue p95;
- source age at callback p95;
- source age at emit p95;
- renderer published Hz;
- coalesced frames;
- stale/out-of-order frames;
- subjective appearance and readability.

## Production Integration Criteria

Do not integrate into production unless all are true:

- physical benchmark shows freshness close to raw skeleton and materially better than point cloud;
- real-device visual review passes readability on the white card during chair stands, hinge,
  arm raise, and balance;
- deterministic depth ordering is acceptable or a tested stable depth-ordering strategy is added;
- tracking-lost and low-confidence behavior are reviewed with recorded landmark replay;
- production card layout is designed without showing camera video;
- production isolation tests are replaced with positive integration tests for the chosen surface.
