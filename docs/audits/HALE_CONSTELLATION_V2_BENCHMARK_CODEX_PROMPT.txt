# Codex task: Build Hale Constellation V2 benchmark renderers while preserving the current 900-dot baseline

## Context

Hale’s current dense point-cloud / pose-constellation figure is still the strongest visual direction.

Several more literal human-body experiments were rejected because they looked cheap, toy-like, mannequin-like, or disconnected from the user. The 900-dot constellation remains the most premium-looking option because it is:

- abstract but still recognisably human;
- visually rich;
- textured;
- body-like without entering the uncanny valley;
- calm and sophisticated;
- well suited to Hale’s intended audience of adults around 45–65.

The goal is therefore **not** to replace the constellation aesthetic.

The goal is to refine it visually and rebuild its rendering architecture so Hale can preserve the premium 900-dot appearance with much lower renderer overhead and latency.

## Existing validated pose pipeline

The Android pose pipeline has already been physically validated on a Samsung Galaxy S22:

- model asset: `pose_landmarker_full.task`
- requested delegate: GPU
- selected delegate: GPU
- GPU fallback: false
- running mode: `LIVE_STREAM`
- rotation mode: MediaPipe rotation metadata
- analysis resolution: `640x480`
- camera timestamp source: `REALTIME`
- latest-only native event delivery
- latest-only renderer scheduling
- raw landmarks for the visual path
- no renderer smoothing

The native profile is exposed in the benchmark as:

```text
LIVE meta 640
```

Do not change this pipeline in this pass.

## Existing physical benchmark results

### Raw skeleton + LIVE meta 640

- native preprocessing p95: approximately `3.26 ms`
- source age at MediaPipe callback p95: approximately `169.65 ms`
- renderer publication: approximately `13 Hz`
- stale/out-of-order frames: `0`

### 450-dot point cloud + LIVE meta 640

- geometry p50/p95/p99: approximately `3 / 10 / 17 ms`
- native event enqueue p95: approximately `28.44 ms`
- source age at MediaPipe callback p95: approximately `194.53 ms`
- source age at native emit p95: approximately `206.82 ms`
- renderer publication: approximately `13 Hz`
- stale/out-of-order frames: `0`

### Current 900-dot production-style point cloud + LIVE meta 640

- geometry p50/p95/p99: approximately `5 / 14 / 34 ms`
- native event enqueue p95: approximately `33.34 ms`
- source age at MediaPipe callback p95: approximately `203.87 ms`
- source age at native emit p95: approximately `212.50 ms`
- renderer publication: approximately `12 Hz`
- stale/out-of-order frames: `0`

The current latest-frame schedulers are working: there is no growing queue and no out-of-order replacement. The remaining issue is renderer cost and system contention.

## Primary objective

Add two new benchmark-only constellation renderers while preserving the current 900-dot implementation unchanged as the baseline:

1. **Constellation V2 · 900**
   - approximately 900 visible dots;
   - fixed topology;
   - stable point identity;
   - native batched rendering;
   - refined visual distribution;
   - intended to prove whether Hale can keep the preferred 900-dot richness without the current React Native SVG overhead.

2. **Constellation V2 · 600**
   - approximately 600 visible dots;
   - same fixed-topology native renderer;
   - perceptually optimised density;
   - stronger silhouette weighting;
   - intended to test whether a better distribution can look almost as rich as 900 dots while being even cheaper.

The current 900-dot implementation must remain available as a separate benchmark option so the user can compare all three directly:

```text
Current 900-dot SVG
Constellation V2 · 900
Constellation V2 · 600
```

Do not replace or silently modify the current 900-dot baseline.

Do not integrate either V2 renderer into production screens in this pass.

## Read first

Inspect the real repository before making changes, including:

- `src/screens/PoseOverlayBenchmarkScreen.tsx`
- the current 900-dot point-cloud mode used in the benchmark
- `src/render/PointCloudBodyRenderer.tsx` or the actual equivalent
- current point-cloud geometry generation
- any legacy constellation renderer
- `src/render/latestFrameRafScheduler.ts`
- renderer mode/type definitions
- pose-avatar defaults
- pose latency diagnostics
- benchmark JSON export
- the local Expo pose-detection module
- Android `PoseDetectionView`
- Android native timing and event coalescing code
- renderer replay tooling
- relevant renderer and diagnostics tests
- `docs/audits/HALE_POSE_OVERLAY_LATENCY_AUDIT.md`
- `docs/audits/HALE_POSE_OVERLAY_PHYSICAL_DEVICE_BENCHMARK.md`
- `docs/audits/HALE_POSE_PIPELINE_LATENCY_REMEDIATION.md`

Verify actual filenames and architecture rather than assuming the paths above are exact.

Also inspect whether React Native Skia or another approved single-surface renderer already exists in the repository.

## Critical terminology

The repository may already contain a renderer named “constellation.”

Do not accidentally reuse or modify a legacy constellation implementation merely because the names are similar.

For this task:

```text
Constellation V2
```

means a new fixed-topology, stable-identity, batched point renderer derived from the current premium 900-dot point-cloud aesthetic.

It is not a return to a line skeleton, sparse landmark constellation, or old renderer.

## Non-negotiable scope constraints

- Benchmark screen only.
- Preserve the current 900-dot renderer unchanged.
- Add V2 900 and V2 600 as separate options.
- Do not change Hale’s production renderer default.
- Do not change recording, training, check-up, micro-check or other production screens.
- Do not change MediaPipe model, delegate, running mode, confidence thresholds, rotation, resolution or camera behaviour.
- Do not change assessment logic, measurement filtering, rep detection, safety logic or workout logic.
- Do not change native latest-only event delivery.
- Do not change the corrected metadata-rotation coordinate contract.
- Use raw landmarks.
- Do not add pose smoothing.
- Do not use springs, timing animations, delayed interpolation or any smoothing that causes visual trailing.
- Do not use hundreds of React components.
- Do not render one React element per dot.
- Do not use 900 SVG `<Circle>` nodes.
- Do not rebuild random topology every frame.
- Do not add blur, glow, particle trails, shadows or SVG filters.
- Do not add a 3D engine.
- Do not add a large new dependency without a compelling repository-specific reason.
- Do not commit or push unless explicitly instructed.
- Do not overwrite unrelated working-tree changes.

## Required rendering architecture

### Primary implementation: Android native batched point renderer

Because the benchmark data indicates that React Native SVG path generation/parsing/drawing is the likely source of renderer pressure, the new V2 modes should not be implemented through the same current SVG path pipeline.

Implement a benchmark-only Android native constellation overlay inside Hale’s existing local Expo pose-detection module.

The native renderer should consume the newest native pose result directly, before JavaScript is required for visual publication.

Preferred architecture:

```text
CameraX frame
→ MediaPipe Full native result
→ latest native landmarks
    ├── native Constellation V2 renderer
    └── existing latest-only native-to-JS event path
```

The V2 visual should not wait for:

```text
native event emission
→ JavaScript processing
→ React state
→ SVG path parsing
→ react-native-svg drawing
```

The existing JS event path must remain active so Hale’s benchmark diagnostics and future measurement logic still receive the same pose results.

### Native view implementation

Create a benchmark-only Android custom overlay view, using the actual repository conventions.

Suggested conceptual name:

```text
ConstellationV2OverlayView
```

It should:

- draw on a transparent hardware-accelerated Android `View`;
- sit over the same white-card/pose viewport as the current benchmark overlay;
- receive the latest corrected upright native landmarks;
- retain at most one latest pose snapshot;
- call `postInvalidateOnAnimation()` for the newest pose;
- draw only the newest available pose;
- never queue a sequence of visual frames;
- clear/reset safely when modes change;
- detach safely on unmount;
- remain completely disabled outside the diagnostics benchmark.

### Batched drawing

Use preallocated native `FloatArray` point buffers and a small fixed number of Android Canvas draw calls.

Preferred strategy:

- use `Canvas.drawPoints(...)`;
- use anti-aliased `Paint`;
- use round stroke caps so points render as circular marks;
- use separate fixed buffers by:
  - graphite tone;
  - radius tier;
  - optional emerald accent.

Target a maximum of approximately:

```text
2 graphite tones
3 radius tiers
1 accent batch
<= 7 draw calls per visual frame
```

For example:

```text
near graphite × micro
near graphite × standard
near graphite × boundary
far graphite × micro
far graphite × standard
far graphite × boundary
emerald accents
```

Do not build 900 circle paths every frame.

Do not allocate 900 point objects every frame.

Do not create a `Path` containing 900 circles unless profiling proves that it is faster than `drawPoints`.

Reuse:

- point arrays;
- paint objects;
- topology;
- region metadata;
- bone weights;
- colour assignments;
- radius assignments;
- batch indices.

### Existing-approved alternative

If the repository already contains an approved Skia/native single-surface renderer that can consume the native pose stream without returning to the current SVG/React bottleneck, Codex may use it.

However:

- do not add Skia solely for this prototype if it is not already installed and approved;
- do not implement the V2 modes as the same RN-SVG architecture with cosmetic changes;
- document the selected backend and why it satisfies the purpose of the benchmark.

### Platform isolation

This benchmark is currently intended for Android physical-device testing.

Requirements:

- Android release build must work.
- TypeScript and shared code must remain valid.
- iOS builds must not be broken.
- If the native V2 modes are Android-only in this pass, include them in the benchmark mode list only on Android and document that clearly.
- Do not create a misleading slower iOS fallback and compare it as though it were the same architecture.

## Fixed topology and stable point identity

The most important visual and performance change is that every dot must have a permanent identity.

At renderer initialisation or benchmark-mode activation, generate or load one deterministic canonical topology.

Every point must store fixed metadata such as:

```text
point ID
body region
local region coordinates
bone influence 1
bone influence 1 weight
optional bone influence 2
optional bone influence 2 weight
radius tier
tone role
silhouette/interior/structural role
optional accent role
batch index
```

Once created, this metadata must not be regenerated each pose frame.

Every incoming pose should only:

1. calculate a small set of virtual body transforms;
2. transform the existing fixed points into current screen positions;
3. write positions into preallocated batch buffers;
4. request one native draw.

There must be:

- no per-frame random point generation;
- no per-frame resampling;
- no changing point count;
- no changing point identity;
- no changing size assignment;
- no changing colour assignment;
- no visual “swimming” caused by points being recreated;
- no density flicker.

## Deterministic topology generation

Use a fixed seed and deterministic point placement.

The distribution should be evenly irregular:

- not a grid;
- not visibly concentric;
- not randomly clumped;
- not obviously procedural;
- not re-randomised between frames.

Use an inexpensive deterministic strategy such as:

- precomputed low-discrepancy samples;
- deterministic blue-noise-like sampling;
- stratified jittered sampling with a fixed seed;
- a checked-in generated topology table;
- another stable approach suitable for the repository.

Do not run an expensive Poisson-disc solver every session.

It is acceptable to generate topology once at build time or commit a deterministic topology definition if that produces better results and remains maintainable.

Document the approach.

## Body-region model

Bind the point topology to a small virtual body rig.

Suggested virtual regions/bones:

```text
head
neck
upper torso
lower torso
pelvis
left upper arm
left forearm
left hand
right upper arm
right forearm
right hand
left thigh
left lower leg
left foot
right thigh
right lower leg
right foot
```

Use actual MediaPipe landmarks and derived anchors.

Each point should normally have one or two influences.

Examples:

```text
forearm interior point:
100% forearm

elbow transition point:
55% upper arm
45% forearm

shoulder transition point:
65% upper torso
35% upper arm

hip transition point:
60% pelvis
40% thigh
```

Keep the influence model simple and fixed.

Do not use a general-purpose 3D skinning engine.

## Per-region deformation

### Head

Generate a stable filled oval/cranial point volume.

Requirements:

- enough points to form a clear head;
- not a sparse ring;
- not a perfect circular disc;
- subtle jaw/neck taper;
- connected visually to the torso;
- no face;
- no facial landmarks rendered;
- fixed point identity.

### Torso

The torso should carry the highest density and visual mass.

Map torso points using stable shoulder, chest, hip and spine anchors.

Use:

- a shoulder-to-hip local coordinate frame;
- a width profile that is broader at shoulders and gently tapers;
- a stable lower torso/pelvis transition;
- fixed local coordinates;
- no per-frame point resampling.

The torso must not look like:

- a rectangle;
- a hollow ring;
- a skeleton cage;
- random sand;
- disconnected limb clusters.

### Pelvis

Use enough points to connect torso and thighs coherently.

Avoid:

- a separate obvious oval;
- a gap between torso and legs;
- a bright hip line;
- visible joint circles.

### Limbs

Represent each limb as a tapered point volume around its bone chain.

Each point stores:

```text
longitudinal coordinate t
signed perpendicular offset
local width fraction
bone influence(s)
```

At runtime:

- calculate the current bone direction;
- calculate the perpendicular normal;
- map the fixed local coordinates into the current limb surface;
- blend around elbows and knees.

Requirements:

- stable taper;
- no gaps at joints;
- no sudden width changes;
- no random point movement;
- no skeleton lines;
- no visible joint circles.

### Hands and feet

Keep them simplified.

Use enough points to imply a hand/foot mass, but do not attempt fingers or toes.

Use wrist/ankle/heel/foot-index landmarks where reliable.

Fallback safely if distal landmarks are weak.

## Proportion calibration

The V2 constellation should reflect the user’s skeletal proportions while keeping dot identity stable.

When a V2 mode activates:

1. Render immediately using neutral proportions.
2. Collect a short sequence of valid frames.
3. Estimate stable:
   - shoulder width;
   - hip width;
   - torso length;
   - head scale;
   - upper-arm length;
   - forearm length;
   - thigh length;
   - lower-leg length.
4. Use a robust estimator such as a median or trimmed mean.
5. Lock or heavily stabilise those region scales for the current benchmark run.
6. Do not rebuild topology.
7. Apply calibration only as region/bone scale transforms.
8. Reset calibration on mode change, benchmark reset, subject replacement or unmount.

Do not smooth live joint positions.

Do not delay the first visible frame while calibration completes.

Expose a low-frequency benchmark label:

```text
Calibration: neutral / collecting / locked
```

## Visual refinement goals

The V2 modes should retain the current point-cloud premium quality while feeling more deliberate and coherent.

### Stable material

The dots should appear like one body made from a stable field of points.

Avoid:

- sparkling;
- twinkling;
- swimming;
- random popping;
- density changes;
- per-dot confidence flicker;
- large state transitions.

### Silhouette emphasis

Allocate a meaningful share of points to maintaining a clear outer body shape.

For V2 900, target approximately:

```text
30–38% silhouette/boundary-role points
52–60% interior-volume points
8–12% structural/accent-role points
```

For V2 600, weight the silhouette more strongly:

```text
38–45% silhouette/boundary-role points
48–56% interior-volume points
5–10% structural/accent-role points
```

These percentages are design goals, not reasons to create unstable per-frame classifications.

Each point’s role must be assigned once.

### Regional density

Do not distribute dots uniformly across all regions.

Suggested visual priorities:

```text
torso + pelvis: highest density
head + neck: sufficient density for a complete form
thighs: high density
upper arms: medium density
forearms + lower legs: lower but continuous density
hands + feet: simplified density
```

A reasonable starting allocation is:

```text
head + neck:   ~9%
torso:         ~29%
pelvis:        ~8%
both arms:     ~18%
both legs:     ~31%
hands + feet:  ~5%
```

Adjust after inspecting the current renderer and visual output.

### Radius tiers

Use only three fixed dot sizes:

```text
micro interior
standard body
larger silhouette
```

Assign sizes once in topology metadata.

Boundary dots should generally skew larger.

Interior dots should generally skew smaller.

Do not modulate radius every frame.

### Palette on white

Use:

```text
Primary graphite:    #26312F
Mid graphite:        #43504B
Far-side graphite:   #65716C
Hale emerald:        #087A5B
Card background:     #FFFFFF
Card border:         #E6E9E7
```

Requirements:

- most points use primary graphite;
- far limbs/regions may use the lighter graphite;
- retain strong contrast on white;
- do not use glow;
- do not use blur;
- do not use shadows;
- do not use pale translucent points that disappear.

### Emerald restraint

Use only a tiny number of emerald points.

Suggested maximum:

```text
V2 900: 6–12 emerald points
V2 600: 4–8 emerald points
```

Assign them deterministically.

They may sit around a restrained torso measurement region or Hale signature cluster.

Do not create:

- emerald limbs;
- a green spine;
- a pulsing chest;
- large status animations;
- a neon effect.

### Depth

Use stable region-level near/far styling.

If MediaPipe Z is used:

- inspect actual sign convention;
- determine near/far at limb/region level;
- apply hysteresis;
- preserve prior ordering when ambiguous;
- never recolour individual points based on noisy Z every frame.

It is acceptable to use deterministic side ordering for the first benchmark if dynamic depth causes flicker.

### Confidence

For the base V2 benchmark:

- do not apply per-dot confidence fading;
- do not change dot radii with confidence;
- do not pulse on reacquisition.

If a complete region becomes unreliable, use a restrained region-level tone change or whole-figure opacity change.

The benchmark should measure the base renderer, not an effect stack.

## V2 900 requirements

Benchmark label:

```text
Constellation V2 · 900
```

Suggested ID:

```text
constellation-v2-900-native
```

Requirements:

- exactly or approximately 900 stable visible dots;
- use the refined fixed topology;
- use native batched rendering;
- target the same perceived richness as the current preferred 900-dot figure;
- preserve a dense torso/head/upper-leg presence;
- refine silhouette readability;
- no per-frame topology generation;
- no JS/SVG dot path generation.

This mode answers:

> Can Hale retain the full premium 900-dot appearance while removing most renderer overhead?

## V2 600 requirements

Benchmark label:

```text
Constellation V2 · 600
```

Suggested ID:

```text
constellation-v2-600-native
```

Requirements:

- exactly or approximately 600 stable visible dots;
- use the same renderer backend and topology system;
- use stronger silhouette weighting;
- use deliberate density allocation;
- use larger boundary dots where needed;
- preserve head, torso and limb continuity;
- avoid looking sparse;
- avoid looking like a skeleton;
- no JS/SVG dot path generation.

This mode answers:

> Can 600 intelligently placed dots look nearly as premium as 900 while creating additional performance headroom?

## Preserve the current baseline

The existing current 900-dot benchmark renderer must remain functionally and visually unchanged.

Only its benchmark display title may be clarified, for example:

```text
Current 900-dot SVG
```

Suggested baseline ID should remain whatever the repository currently uses.

Do not:

- port the current baseline to native;
- change its distribution;
- change its colours;
- change dot scale;
- disable additional effects beyond its existing benchmark configuration;
- reuse its metrics for V2.

The purpose is a truthful before/after comparison.

## Benchmark-screen integration

Add all three as separate selectable modes:

```text
Current 900-dot SVG
Constellation V2 · 900
Constellation V2 · 600
```

Requirements:

- selectable at runtime without rebuilding;
- changing renderer mode resets benchmark metrics;
- changing renderer mode resets V2 calibration and topology state where appropriate;
- all modes use one MediaPipe stream;
- MediaPipe must not run twice;
- only one visual renderer may be active at a time;
- V2 native overlay must be disabled when current SVG mode is selected;
- current JS/SVG overlay must be unmounted when a V2 native mode is selected;
- all modes support `LIVE meta 640`;
- preserve 30-second/60-second controls;
- preserve JSON export;
- preserve existing benchmark modes unless they are obsolete rejected experiments and removal is clearly safe.

If old rejected sculpted/rigged prototype modes are still present and have no remaining purpose, Codex may remove them from the mode list after confirming they are benchmark-only and unused. Do not remove any useful current baseline.

## Native renderer configuration API

Extend the local native pose-detection module with diagnostics-only configuration sufficient to select:

```text
off
constellation-v2-900
constellation-v2-600
```

Suggested conceptual props:

```ts
nativeBenchmarkOverlayMode:
  | 'off'
  | 'constellation-v2-900'
  | 'constellation-v2-600'
```

This API must remain benchmark-only.

Do not expose it as a production renderer default.

The native view should receive:

- corrected upright landmarks;
- frame ID;
- source timestamp;
- source width/height;
- mirror state or already-correct display mapping;
- tracking/validity state;
- benchmark diagnostics enablement.

Reuse the existing corrected orientation and front-camera mapping contract.

## Coordinate mapping

The V2 native renderer must match the current white-card viewport exactly.

Verify:

- emitted upright dimensions;
- aspect-ratio contain mapping;
- front-camera mirroring;
- portrait orientation;
- card padding;
- landmark-to-view scaling;
- head/feet containment;
- no stretching;
- no double mirroring;
- no double rotation.

Add tests for:

```text
0°
90°
180°
270°
front-camera mirror
contain fit
common 480×640 emitted source
```

The figure must align with the same pose as the current raw skeleton and current 900-dot renderer.

## Latest-only scheduling

Use native latest-only semantics.

Required behaviour:

- every accepted pose result replaces the stored latest pose;
- at most one draw invalidation is outstanding;
- drawing consumes the newest available pose;
- older/equal frame IDs are rejected;
- no list/queue of poses is retained;
- if multiple poses arrive before the next vsync, only the newest is drawn;
- reset/unmount clears the latest state safely.

Do not send V2 point arrays through JavaScript each frame.

Do not use the JS RAF scheduler for the native visual.

Keep the existing JS scheduler unchanged for current JS/SVG modes.

## Native renderer diagnostics

Add native benchmark metrics for the V2 modes.

Record:

- renderer backend;
- requested point count;
- actual visible point count;
- topology generation count;
- topology generation time;
- calibration state;
- virtual bone/region count;
- draw batch count;
- point-buffer byte count;
- point transform p50/p90/p95/p99/max;
- native draw p50/p90/p95/p99/max;
- source age at native draw start p50/p95;
- source age at native draw end p50/p95;
- native overlay requested frames;
- native overlay published/drawn frames;
- native overlay coalesced frames;
- native overlay rejected frames;
- latest frame ID drawn;
- native overlay published Hz;
- dropped/invalid point count;
- non-finite geometry count.

Use the same native monotonic clock domain as the existing source-age diagnostics.

Do not label draw completion as physical display presentation.

### Benchmark export

Extend JSON export with a renderer-native section such as:

```json
{
  "backend": "android-native-canvas",
  "requestedPointCount": 900,
  "actualPointCount": 900,
  "topologyBuildCount": 1,
  "topologyBuildMs": 0,
  "virtualRegionCount": 0,
  "drawBatchCount": 0,
  "pointBufferBytes": 0,
  "transformMs": {
    "p50": 0,
    "p95": 0,
    "p99": 0
  },
  "drawMs": {
    "p50": 0,
    "p95": 0,
    "p99": 0
  },
  "sourceAgeAtDrawStartMs": {
    "p50": 0,
    "p95": 0
  },
  "sourceAgeAtDrawEndMs": {
    "p50": 0,
    "p95": 0
  },
  "framesRequested": 0,
  "framesDrawn": 0,
  "framesCoalesced": 0,
  "framesRejected": 0,
  "publishedHz": 0
}
```

Use actual consistent names chosen for the repository.

Retain current JS/SVG geometry metrics for the baseline.

Do not fake JS `geometryMs` for a renderer that performs geometry natively.

## Performance targets

For Samsung SM-S901B in a release/profileable build with `LIVE meta 640`:

### V2 900

```text
Native point transform p50:       <= 0.6 ms preferred
Native point transform p95:       <= 1.5 ms
Native point transform p99:       <= 3 ms
Native draw p95:                  <= 2 ms preferred
Draw calls/batches:               <= 7
Renderer publication:             >= 13 Hz
Native event enqueue p95:         preferably <= 15 ms
Source age at callback p95:       preferably <= 180–185 ms
Source age at native draw end p95: record honestly
Coalesced frames:                 near zero
Rejected/stale/out-of-order:      zero
Visible points:                   approximately 900
```

### V2 600

```text
Native point transform p50:       <= 0.4 ms preferred
Native point transform p95:       <= 1 ms
Native point transform p99:       <= 2 ms
Native draw p95:                  <= 1.5 ms preferred
Draw calls/batches:               <= 7
Renderer publication:             >= 13 Hz
Native event enqueue p95:         preferably <= 15 ms
Source age at callback p95:       preferably <= 180–185 ms
Coalesced frames:                 near zero
Rejected/stale/out-of-order:      zero
Visible points:                   approximately 600
```

These are targets, not values to fabricate.

## Visual acceptance criteria

### Premium quality

Both V2 modes should:

- feel at least as intentional as the current 900-dot figure;
- remain abstract and sophisticated;
- preserve a human body impression;
- feel calm and mature;
- avoid a game/AI-demo aesthetic;
- avoid a medical skeleton appearance;
- avoid random noisy particle behaviour;
- remain highly legible on white.

### Stable material

- Every dot retains identity.
- No point swimming.
- No density flicker.
- No random regeneration.
- No size flicker.
- No colour flicker.
- No sudden body-width changes.
- No visible topology reset during a run.

### Human readability

Inspect:

- neutral standing;
- both arms raised;
- one arm raised;
- arms crossing torso;
- torso rotation;
- side-facing stance;
- sit-to-stand;
- chair-stand bottom;
- hip hinge;
- single-leg balance.

The figure should show:

- clear head;
- coherent torso;
- connected arms and legs;
- no large joint gaps;
- no obvious skeleton lines;
- stable hands/feet;
- correct orientation;
- correct mirroring.

### V2 600 specific

The 600-dot mode should not simply look like the 900-dot version with random points removed.

It should use:

- stronger boundary weighting;
- deliberate region density;
- slightly larger silhouette dots;
- preserved torso/head density;
- simplified distal limbs.

Its perceived completeness should be much closer to V2 900 than its raw point count suggests.

## Automated tests

### Native topology tests

Add tests for:

- deterministic topology for a fixed seed;
- exact requested count for 900 mode;
- exact requested count for 600 mode;
- stable point IDs;
- fixed region assignments;
- fixed radius tiers;
- fixed tone assignments;
- valid batch assignments;
- no duplicate IDs;
- no non-finite local coordinates;
- bone weights sum correctly;
- maximum two influences where intended;
- expected boundary/interior allocation ranges;
- expected regional allocation ranges;
- emerald point cap;
- topology generated once per activation/reset, not once per frame.

### Native transform tests

Add tests for:

- finite transformed output;
- no `NaN`/`Infinity`;
- neutral standing;
- arm raise;
- elbow bend;
- knee bend;
- side-facing pose;
- zero-length bone fallback;
- missing distal landmarks;
- calibration neutral fallback;
- calibration lock/reset;
- correct mirror mapping;
- correct upright dimensions;
- no point-buffer overrun;
- exact buffer sizes;
- fixed draw-batch count;
- older/equal frame rejection;
- newest-frame coalescing;
- safe detach/reset.

### Benchmark integration tests

Add tests proving:

- current 900-dot baseline remains available;
- current 900-dot configuration is unchanged;
- V2 900 appears as a separate mode;
- V2 600 appears as a separate mode;
- only one overlay is active;
- V2 modes are benchmark-only;
- diagnostics-off builds do not expose them;
- production renderer default did not change;
- no production screen selects a V2 mode;
- V2 modes do not run MediaPipe twice;
- JSON export identifies renderer backend and point count correctly.

## Synthetic/native replay

Extend the existing replay or add a small deterministic native benchmark harness for V2 topology/transform cost.

Use the same synthetic landmark sequence for both V2 900 and V2 600.

Report:

- topology build time;
- point transform p50/p95/p99/max;
- actual point count;
- batch count;
- allocations where measurable.

Do not present desktop/JVM synthetic results as physical-device draw performance.

If native Canvas draw timing cannot be measured outside a real Android view, state that clearly.

## Physical benchmark protocol

After implementation, the user will run:

```text
Native profile: LIVE meta 640
Build: release/profileable
Device: Samsung SM-S901B
Duration: 60 seconds per mode
```

Modes:

```text
Current 900-dot SVG
Constellation V2 · 900
Constellation V2 · 600
```

Movement sequence:

- stand still;
- arm sweeps;
- torso movement;
- repeated chair stands;
- stand still again.

Most important comparison fields:

```text
visual preference
point stability
native point transform p95/p99
native draw p95/p99
current SVG geometry p95/p99
native event enqueue p95
source age at callback p95
source age at emit p95
source age at native draw end p95
renderer published Hz
coalesced frames
stale/out-of-order frames
```

The visual decision is:

- if V2 900 looks best and performs near raw skeleton, prefer V2 900;
- if V2 600 looks nearly as rich but performs materially better, prefer V2 600;
- do not reduce density merely because 600 is numerically smaller;
- preserve 900 if the native renderer removes the old cost.

## Documentation

Create:

```text
docs/audits/HALE_CONSTELLATION_V2_BENCHMARK.md
```

Include:

1. Why the constellation aesthetic was retained
2. Current baseline architecture
3. V2 native architecture
4. Fixed-topology model
5. Stable point identity
6. Body-region and virtual-rig mapping
7. 900-point distribution
8. 600-point perceptual-density distribution
9. Radius tiers
10. Palette and depth strategy
11. Calibration strategy
12. Native batching strategy
13. Draw-call count
14. Buffer and allocation strategy
15. Latest-only scheduling
16. Diagnostics schema
17. Synthetic benchmark results
18. Physical results only if genuinely collected
19. Comparison protocol
20. Known limitations
21. Criteria for production integration
22. Android/iOS parity considerations for a later production phase

## Validation

Run all applicable checks:

```text
native topology tests
native transform tests
native latest-frame tests
benchmark integration tests
pose diagnostics tests
existing JS latest-frame scheduler tests
renderer replay/native synthetic benchmark
npx tsc --noEmit
relevant Jest suites
npx expo config --type public
Android native unit tests
Android debug build
diagnostics-enabled Android release build
git diff --check
```

Do not repair unrelated failures unless introduced by this pass.

Do not fabricate a physical benchmark.

## Final terminal response

Report:

1. Files changed
2. Current baseline mode ID and confirmation it is unchanged
3. V2 900 mode ID
4. V2 600 mode ID
5. Renderer backend
6. Whether a new dependency was added
7. Where the native overlay is hosted
8. Point counts
9. Region counts
10. Radius tiers
11. Draw-batch count
12. Buffer/allocation strategy
13. Topology generation strategy
14. Calibration behaviour
15. Synthetic transform p50/p95/p99
16. Whether a physical benchmark was genuinely collected
17. Exact steps to open and run all three modes
18. Validation results
19. Known visual/performance limitations
20. Whether any production behaviour changed

The goal is not to simplify away the visual quality that made the current constellation successful.

The goal is to preserve and refine the premium 900-dot aesthetic while replacing the expensive React Native SVG rendering path with stable fixed topology and a small number of native batched draw calls.
