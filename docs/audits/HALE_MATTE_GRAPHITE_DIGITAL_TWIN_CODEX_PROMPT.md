# Codex task: Replace the benchmark-only sculpted figure with a Matte Graphite Digital Twin

## Context

Hale currently uses a MediaPipe Pose Landmarker Full pipeline and has a diagnostics-only pose-overlay benchmark screen.

The Android pipeline has already been optimised and physically validated on a Samsung Galaxy S22:

- model: `pose_landmarker_full.task`
- requested delegate: GPU
- selected delegate: GPU
- GPU fallback: false
- running mode: `LIVE_STREAM`
- rotation path: MediaPipe rotation metadata
- analysis resolution: `640x480`
- camera timestamp source: `REALTIME`
- latest-only native event delivery
- latest-only renderer scheduling
- raw landmarks for the display path
- no renderer smoothing

Relevant physical measurements:

### Raw skeleton + LIVE meta 640

- source age at MediaPipe callback p95: approximately `169.65 ms`
- native preprocessing p95: approximately `3.26 ms`
- renderer publication: approximately `13 Hz`
- stale/out-of-order frames: `0`

### 450-dot point cloud + LIVE meta 640

- geometry p50/p95/p99: approximately `3 / 10 / 17 ms`
- native event enqueue p95: approximately `28.44 ms`
- source age at MediaPipe callback p95: approximately `194.53 ms`
- renderer publication: approximately `13 Hz`
- stale/out-of-order frames: `0`

### 900-dot production-style point cloud + LIVE meta 640

- geometry p50/p95/p99: approximately `5 / 14 / 34 ms`
- native event enqueue p95: approximately `33.34 ms`
- source age at MediaPipe callback p95: approximately `203.87 ms`
- renderer publication: approximately `12 Hz`
- stale/out-of-order frames: `0`

A previous benchmark-only “sculpted figure” was implemented from simple body pieces. It looks cheap, toy-like and mannequin-like. It is not suitable for Hale and should be replaced rather than refined.

The point-cloud figure still looks more premium because it has abstraction, visual mass and surface richness. The new design must preserve those qualities while using far fewer rendering primitives.

## Primary objective

Replace the existing benchmark-only sculpted figure with a new benchmark-only renderer called:

```text
Matte graphite digital twin
```

Suggested IDs:

```text
renderer mode: matte_graphite_digital_twin
benchmark mode: matte-graphite-digital-twin
```

This figure must:

1. Have clear filled surface area.
2. Feel like an actual digital representation of the user’s current body and movement.
3. Look continuous and human rather than assembled from body parts.
4. Feel premium, mature, calm and appropriate for adults aged roughly 45–65.
5. Remain body-neutral and gender-neutral.
6. Be clearly visible on a white card.
7. Use a low-complexity rendering architecture that is substantially cheaper than the 450-dot point cloud.
8. Exist only on the diagnostics benchmark screen in this pass.
9. Replace the previous sculpted benchmark option rather than adding another competing prototype.
10. Leave all production screens and production renderer defaults unchanged.

Do not integrate this renderer into check-ups, training sessions, micro-checks, recording screens or any other production flow yet.

## Read first

Inspect the actual repository before changing anything, including:

- `src/screens/PoseOverlayBenchmarkScreen.tsx`
- the existing benchmark-only sculpted renderer and its geometry/config/tests
- the pose renderer entry point and renderer-mode types
- the point-cloud renderer
- the raw/classic skeleton renderer
- `src/render/latestFrameRafScheduler.ts`
- pose-avatar configuration and defaults
- pose latency diagnostics
- benchmark JSON export
- synthetic renderer replay tooling
- relevant renderer tests
- `docs/audits/HALE_POSE_OVERLAY_LATENCY_AUDIT.md`
- `docs/audits/HALE_POSE_OVERLAY_PHYSICAL_DEVICE_BENCHMARK.md`
- `docs/audits/HALE_POSE_PIPELINE_LATENCY_REMEDIATION.md`
- the previous sculpted-figure benchmark report, if present

Verify the real architecture and filenames. Treat the paths above as hints rather than assumptions.

## Non-negotiable scope constraints

- Benchmark screen only.
- Replace the old sculpted benchmark mode; do not retain both in the benchmark carousel.
- Remove obsolete sculpted renderer code if it has no other consumers.
- Do not change Hale’s production renderer default.
- Do not change any production screen.
- Do not change MediaPipe model, delegate, confidence values, running mode, camera configuration, analysis resolution or rotation logic.
- Do not change assessment logic, measurement filtering, exercise progression, rep detection or safety logic.
- Do not change the latest-only native event scheduler.
- Do not change the existing metadata-rotation coordinate contract.
- Do not add pose smoothing.
- Consume the newest raw pose landmarks.
- Reuse `latestFrameRafScheduler.ts`.
- Do not add a 3D engine.
- Do not add a heavy dependency.
- Do not use camera segmentation.
- Do not use blur, glow, drop shadows, particle systems or SVG filters.
- Do not use one React component per vertex, triangle, landmark or body point.
- Do not render a visible low-poly triangle mesh.
- Do not commit or push unless explicitly instructed.
- Do not overwrite unrelated working-tree changes.

## Design direction

### Overall visual concept

The figure should look like:

> A continuous, featureless, softly shaded graphite human form — somewhere between a modern matte sculpture and a premium health-tech digital twin.

It should have visual mass and a coherent body surface.

It should feel like the user is seeing a simplified digital version of themselves moving, not a graphic drawn over their skeleton.

The design should be:

- recognisably human;
- filled rather than outlined;
- continuous rather than assembled;
- softly organic rather than mechanical;
- understated rather than theatrical;
- premium rather than playful;
- abstract enough to avoid uncanny realism;
- substantial enough to feel connected to the user.

### It must not look like

- a toy mannequin;
- a wooden artist’s figure;
- a collection of capsules;
- a stick figure;
- a skeleton;
- a line drawing;
- a ribbon drawing;
- a robot;
- a low-poly game character;
- a superhero;
- a bodybuilding anatomy model;
- a cartoon avatar;
- a medical model;
- an egg head attached to a body;
- a particle cloud;
- a flat black silhouette with no surface treatment.

### White-card context

The renderer will appear on a white card.

Use:

```text
Card background: #FFFFFF
Card border:     #E6E9E7
```

The figure must remain highly legible at normal phone-viewing distance.

Do not rely on a card shadow or figure shadow to create separation.

## Colour and surface treatment

Use a restrained matte graphite palette:

```text
Deep graphite shadow:      #18211F
Primary graphite surface:  #2A3632
Mid graphite:              #44514C
Soft graphite highlight:   #6B7771
Far-side graphite:         #35413D
Hale emerald accent:       #087A5B
Low-confidence graphite:   #89938E
Card background:           #FFFFFF
```

Guidelines:

- Most of the body should be graphite.
- The figure should not be pure black.
- Use two or three broad tones to create volume.
- Emerald should occupy no more than approximately 1–3% of the visible figure.
- Do not use skin tones.
- Do not make the whole body green.
- Do not use neon.
- Do not use glow.
- Do not use animated colour pulses.
- Do not use many tiny highlight fragments.
- Avoid harsh, glossy highlights; the material should feel matte.

### Preferred surface rendering

Use one or two reusable, simple linear gradients if the existing renderer technology supports them cheaply.

For example:

```text
body gradient: deep graphite → primary graphite → soft graphite highlight
rear gradient: deep graphite → far-side graphite
```

The gradients must be static/reusable definitions, not rebuilt per frame.

If gradients materially complicate or slow the implementation, use a small number of broad flat tonal surface panels instead.

Do not add dynamic lighting calculations.

Do not use clipping filters, blur filters or drop-shadow filters.

## User representation and body neutrality

The digital twin should reflect the user’s:

- current pose;
- shoulder width;
- hip width;
- torso length;
- upper-arm length;
- forearm length;
- thigh length;
- lower-leg length;
- head-to-body proportion;
- front/side orientation;
- relative limb depth where stable.

It must not attempt to infer:

- body fat;
- weight;
- muscularity;
- sex;
- chest shape;
- exact waist shape;
- age;
- clothing silhouette.

Use neutral, standardised body thickness ratios anchored to the user’s measured skeletal proportions.

The result should feel personalised through proportions and movement, not through speculative body-shape estimation.

### Stable proportion calibration

Use raw landmarks for pose position, but stabilise only slow-changing shape proportions.

Recommended behaviour:

1. When this renderer mode opens, collect a short set of valid frames.
2. Derive robust proportions from shoulder width, hip width, torso length and limb lengths.
3. Use a median, trimmed mean or similarly robust statistic.
4. Lock or heavily stabilise those proportions for the current benchmark run.
5. Reset calibration when the renderer mode changes or the benchmark is reset.
6. Fall back to neutral proportions if calibration is incomplete.

Do not delay rendering while waiting for perfect calibration.

Do not smooth joint positions.

Do not let body width pulse or flicker frame to frame.

## Body construction

The figure should be visually continuous, but it does not need to be one giant self-intersecting path internally.

Use the smallest practical set of continuous filled surfaces.

A recommended visual surface inventory is:

1. One continuous head-neck-torso-pelvis shell.
2. One continuous left-arm surface from shoulder through elbow to hand.
3. One continuous right-arm surface from shoulder through elbow to hand.
4. One continuous left-leg surface from hip through knee to foot.
5. One continuous right-leg surface from hip through knee to foot.
6. Optional broad torso highlight surface.
7. Optional left-side highlight/shadow surface.
8. Optional right-side highlight/shadow surface.
9. One very small emerald detail.

Target:

```text
5–9 major filled surfaces
1–3 tonal overlay surfaces
1 small accent
approximately 7–12 rendered paths total
```

Hard cap the normal rendered path/node count at approximately `14`.

The final result must not reveal the internal construction.

### Central body shell

The head, neck, torso and pelvis should read as one continuous form.

Requirements:

- The head must transition into a neck.
- The neck must transition into the shoulders.
- The torso must transition into the waist and pelvis.
- There must be no floating oval head.
- There must be no separate pelvis block.
- There must be no visible shoulder sockets or hip sockets.
- The shoulder line should slope naturally.
- The torso should have subtle asymmetry based on the current pose.
- The waist should taper gently.
- The pelvis should have enough width to connect naturally to the thighs.
- The surface should remain stable in front-facing, angled and side-facing poses.

The head may be featureless, with a subtle jaw taper and a slightly flatter lower contour. Avoid a perfect egg or perfect circle.

Use face landmarks only as stable anchors. Do not render facial features.

### Arms

Each arm should be one continuous filled surface from shoulder to wrist/hand.

The elbow should bend the surface internally; it must not split the arm into upper-arm and forearm capsules.

Requirements:

- natural taper from shoulder to wrist;
- subtle elbow volume without a joint circle;
- no visible seam at the elbow;
- no gap at the shoulder;
- simple integrated hand shape;
- graceful behaviour during arm raises and crossed-arm poses;
- stable thickness;
- no rubber-hose appearance;
- no sudden kinks.

A practical implementation can construct a curved centreline through shoulder, elbow and wrist, then generate left/right surface boundaries from tangents and normals with tapered widths.

Use smooth quadratic or cubic curves through the joint rather than two straight capsules.

### Legs

Each leg should be one continuous filled surface from hip to ankle/foot.

Requirements:

- natural thigh-to-calf taper;
- subtle knee volume without a joint circle;
- no visible seam at the knee;
- no gap at the hip;
- simple integrated foot shape;
- readable during sit-to-stand, squat, hip hinge and single-leg balance;
- no rubber-hose appearance;
- stable thickness;
- correct knee bend.

A practical implementation can use a curved centreline through hip, knee and ankle, with separate proximal/distal width profiles blended continuously through the knee.

### Hands and feet

Keep hands and feet simplified but integrated.

- no fingers;
- no toes;
- no detached bulbs;
- no mitten-like circles;
- no oversized feet;
- no extreme rotation jitter.

Hands may taper from the wrist into a small organic wedge.

Feet may extend from the ankle using heel/foot-index landmarks where reliable, with a safe fallback when they are not.

## Internal geometry model

Implement a low-complexity 2D soft-body model.

Preferred approaches, in order:

### Option A: continuous surface paths from curved centreline geometry

Use body landmarks to generate smooth outer boundaries around:

- central body shell;
- each continuous arm;
- each continuous leg.

This is acceptable if it produces stable, organic, continuous surfaces.

### Option B: low-resolution skinned 2D mesh used internally

Use a small rest-pose mesh with approximately:

```text
60–120 internal vertices
10–15 virtual bones
1–2 bone influences per vertex where possible
```

Apply 2D linear blend skinning or an equivalent lightweight deformation.

Important:

- The mesh is an internal geometry model only.
- Do not render one SVG polygon per triangle.
- Do not expose visible facets or triangulation.
- Convert the deformed outer boundaries and broad tonal regions into a small number of smooth filled paths.
- Reuse fixed topology and preallocated buffers.
- Avoid per-frame object churn.

Choose whichever approach best fits the existing renderer architecture and produces the more coherent premium result.

Document the choice and why.

## Surface continuity rules

The figure must appear to be made from one material.

Use:

- same base material across central body and limbs;
- overlapping attachment regions hidden beneath the torso/pelvis;
- no strokes around individual body parts;
- no contrasting outlines at joints;
- no gaps;
- no visible construction seams;
- consistent highlight direction;
- stable far/near tone hierarchy.

It is acceptable for separate surfaces to overlap internally, as long as the user cannot perceive them as separate components.

## Depth and draw order

Use MediaPipe depth only when it is stable enough to improve readability.

Requirements:

- inspect the actual Z sign convention;
- estimate near/far side at the limb level, not per tiny segment;
- apply hysteresis;
- preserve prior ordering when ambiguous;
- avoid rapid side swapping;
- avoid colour flicker;
- keep the torso as the central anchor.

Far limbs may be slightly darker or lower contrast.

Near limbs may receive the softer highlight.

Do not use large opacity differences that make far limbs disappear.

If dynamic depth remains unstable, use a deterministic stable ordering in the first prototype and document the limitation.

## Small Hale accent

Do not reuse the long emerald seam from the previous sculpted figure.

Use one very small, restrained Hale detail, such as:

- a short inset mark near the sternum;
- a tiny curved accent on the upper torso;
- a small measurement glyph that appears only in benchmark mode.

Requirements:

- emerald occupies no more than roughly 1–3% of the body;
- no glow;
- no pulse;
- no large stripe;
- no superhero appearance;
- no energy-beam appearance.

The accent should feel like a subtle product signature, not a costume.

## Confidence and tracking behaviour

Normal tracking:

```text
matte graphite surface
```

Low-confidence limb:

- shift that limb toward `#89938E`, or
- reduce its contrast modestly.

Tracking lost:

- fade the entire body calmly;
- do not make individual limbs flash;
- do not pulse;
- do not display technical confidence numbers inside the figure.

For this prototype, avoid animated reacquisition effects.

Do not add smoothing to hide tracking noise.

## Rendering architecture

### Dependency policy

Use the renderer stack already approved in the repository.

Preferred order:

1. Existing approved single-canvas/native surface, if already present and appropriate.
2. Existing `react-native-svg` with one `<Svg>` and a very small fixed number of paths.
3. Do not add Skia solely for this benchmark prototype unless Skia already exists in the repository and is already approved.

### SVG implementation rules

If using `react-native-svg`:

- one `<Svg>` root;
- fixed small number of `<Path>` nodes;
- reuse gradient definitions;
- no SVG filters;
- no blur;
- no shadow;
- no mask unless absolutely unavoidable;
- no one-node-per-vertex implementation;
- no one-node-per-triangle implementation;
- no hundreds of objects;
- no per-landmark React components;
- no per-frame recreation of static style/config objects;
- preallocate geometry buffers where practical;
- batch surfaces by fill where practical;
- update only the newest pose.

Keep geometry generation renderer-agnostic enough that it could later move to a native or Skia surface.

## Pose freshness and scheduling

The digital twin must use:

```text
frameSource="raw"
smoothingEnabled={false}
```

or the actual equivalent.

Do not use:

- measurement-smoothed landmarks;
- display One-Euro smoothing;
- renderer EMA smoothing;
- springs;
- timing animations;
- interpolation that deliberately remains behind the latest pose.

Reuse `latestFrameRafScheduler.ts`.

Required semantics:

- every valid incoming frame replaces the current latest candidate;
- at most one RAF is pending;
- the scheduled callback consumes the newest candidate;
- older/equal frame IDs are rejected;
- bursts coalesce to the newest frame;
- no render queue grows;
- unmount/reset cancels safely.

Do not implement a second competing scheduler.

## Replace the old sculpted benchmark mode

The previous sculpted figure is rejected.

Requirements:

- Replace its benchmark option with `Matte graphite digital twin`.
- Do not show both modes.
- Remove obsolete code, config and tests if they have no remaining consumer.
- Preserve any generic helpers that are genuinely useful.
- Update benchmark mode metadata and JSON export.
- Ensure no production screen references either the old or new benchmark-only renderer.
- Ensure production defaults remain unchanged.
- Ensure diagnostics-off builds do not expose the new mode.

Suggested benchmark option:

```ts
{
  id: 'matte-graphite-digital-twin',
  title: 'Matte graphite digital twin',
  subtitle: 'Continuous low-complexity body surface',
}
```

## Benchmark-screen integration

The new mode must:

- appear only inside `PoseOverlayBenchmarkScreen`;
- use the same native pose stream as all other benchmark renderers;
- not run MediaPipe twice;
- not mount simultaneously with another overlay;
- reset benchmark metrics and proportion calibration when selected;
- support all native benchmark profiles;
- be tested primarily with `LIVE meta 640`;
- render on the same white card;
- preserve 30-second/60-second controls and JSON export;
- preserve all existing benchmark modes except the rejected sculpted mode.

Add a small benchmark-only label showing:

```text
surface paths
internal control vertices
calibration state
```

Do not update this label every pose frame; use the existing low-frequency diagnostics cadence.

## Benchmark metrics

Extend the exported renderer data for this mode with:

```json
{
  "averageSurfacePathCount": 0,
  "maxSurfacePathCount": 0,
  "averageInternalVertexCount": 0,
  "maxInternalVertexCount": 0,
  "averageDynamicPathCount": 0,
  "maxDynamicPathCount": 0,
  "proportionCalibrationComplete": true
}
```

Use the actual final field names consistently.

Continue recording:

- renderer update calls;
- renderer published frames;
- renderer coalesced frames;
- renderer rejected frames;
- geometry p50/p90/p95/p99/max;
- renderer published Hz;
- stale/out-of-order counters;
- native event enqueue;
- native source age at callback;
- native source age at emit;
- JS transform time.

Do not claim physical presentation timestamps that are unavailable.

## Synthetic replay benchmark

Replace the old sculpted mode in the synthetic renderer replay with:

```text
matte-graphite-digital-twin
```

Use the same deterministic pose sequence as the other modes.

Report:

- geometry p50;
- p95;
- p99;
- max;
- surface-path count;
- internal control-vertex count;
- dynamic path count.

Synthetic results measure geometry/transformation only, not physical-device draw, main-thread, RenderThread or GPU performance.

## Performance targets

The new renderer should be materially cheaper than the 450-dot point cloud.

Target on Samsung SM-S901B with `LIVE meta 640`:

```text
Geometry p50:                    <= 1.5 ms preferred
Geometry p95:                    <= 4 ms
Geometry p99:                    <= 8 ms
Surface path count:              <= 12 preferred
Hard surface/path node cap:      <= 14
Renderer publication:            >= 13 Hz
Renderer coalesced frames:       near zero
Rejected/stale frames:           zero
Native event enqueue p95:        preferably <= 18 ms
Source age at callback p95:      preferably <= 185 ms
Source age at emit p95:          preferably <= 195 ms
Additional pose smoothing delay: zero
```

These are targets, not values to fabricate.

Visual quality is mandatory. Do not meet the path-count target by falling back to a cheap mannequin.

## Visual acceptance criteria

### Human representation

- Clearly reads as a filled human body.
- Has meaningful surface area.
- Feels connected to the user’s movement.
- Reflects the user’s skeletal proportions.
- Head, neck, torso and pelvis read as one form.
- Arms and legs read as continuous surfaces.
- No visible joints or construction pieces.

### Premium appearance

- Feels calm, mature and deliberate.
- Feels like a digital twin or contemporary sculpture.
- Has subtle matte depth.
- Does not feel toy-like.
- Does not feel cheap.
- Does not feel like a game avatar.
- Does not feel like a medical diagram.
- Does not resemble a capsule mannequin.
- Does not resemble a line drawing or skeleton.
- Does not expose low-poly triangles.
- Looks appropriate on a premium health/longevity app.

### Body neutrality

- Gender-neutral.
- No exaggerated shoulders, chest, waist, hips or muscles.
- No speculative body-fat or weight representation.
- No judgemental body-shape inference.
- Suitable for a broad adult audience.

### Motion quality

- Correct orientation and mirroring.
- Head remains attached to neck.
- Limbs remain attached to torso/pelvis.
- No visible elbow or knee seams.
- No detached hands or feet.
- No body-width flicker.
- No sudden depth-colour swapping.
- No left/right swapping.
- No extreme stretching.
- No self-intersection artefacts during common Hale movements.
- No added trailing from smoothing.

### Required pose checks

Inspect visually in:

- neutral standing;
- both arms raised;
- one arm raised;
- arms crossing the torso;
- side-facing stance;
- torso rotation;
- sit-to-stand;
- squat/chair-stand bottom position;
- hip hinge;
- single-leg balance.

## Tests

Add focused automated tests for:

- finite output;
- no `NaN`/`Infinity`;
- hard path/node cap;
- fixed internal topology;
- stable neutral proportions;
- calibration fallback;
- proportion lock/reset;
- missing face landmarks;
- missing hand/foot landmarks;
- low-confidence limbs;
- zero-length bone segments;
- arm continuity through the elbow;
- leg continuity through the knee;
- central shell continuity;
- no detached head;
- no detached limbs;
- valid bounds;
- front-camera mirroring assumptions;
- emitted upright-coordinate assumptions;
- deterministic geometry for deterministic input;
- stable depth-order hysteresis;
- latest-frame burst-newest behaviour;
- old/equal frame rejection;
- safe unmount/reset cancellation;
- production isolation.

Use deterministic fixtures for:

- neutral standing;
- both arms raised;
- one arm crossing torso;
- side-facing pose;
- chair-stand bottom;
- single-leg stance.

Tests should enforce geometry and architecture contracts, not subjective beauty.

## Production isolation

Add a test or static assertion where practical proving:

- the default production renderer has not changed;
- no production screen selects `matte_graphite_digital_twin`;
- the old sculpted mode is gone from the benchmark;
- the new mode is benchmark-only;
- diagnostics-off builds do not expose it in Settings;
- no production pose pipeline setting changed.

## Documentation

Create:

```text
docs/audits/HALE_MATTE_GRAPHITE_DIGITAL_TWIN_BENCHMARK.md
```

Include:

1. Why the previous sculpted figure was rejected
2. Design rationale
3. User-representation strategy
4. Body-neutrality rules
5. Colour and material system
6. Surface inventory
7. Geometry/deformation architecture
8. Proportion calibration
9. Depth-order strategy
10. Render-node and path counts
11. Scheduler behaviour
12. Synthetic benchmark results
13. Physical benchmark results only if genuinely collected
14. Comparison targets versus raw skeleton, 450 dots and 900 dots
15. Known visual limitations
16. Exact manual benchmark instructions
17. Criteria for production adoption

## Manual physical benchmark instructions

After implementation, test:

```text
Renderer: Matte graphite digital twin
Native profile: LIVE meta 640
Duration: 60 seconds
Build: release/profileable
Device: Samsung SM-S901B
```

Use the same movement sequence as previous runs:

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

## Validation

Run all applicable checks:

```text
targeted digital-twin geometry tests
proportion-calibration tests
latest-frame scheduler tests
pose diagnostics tests
renderer replay benchmark
npx tsc --noEmit
relevant Jest suites
npx expo config --type public
Android debug compilation
diagnostics-enabled Android release compilation
git diff --check
```

Do not repair unrelated failures unless introduced by this pass.

## Final terminal response

Report:

1. Files changed
2. Old sculpted files removed or retained, with reasons
3. New benchmark mode ID
4. Rendering technology used
5. Geometry/deformation approach selected
6. Internal vertex/control-point count
7. Rendered surface/path count
8. Dynamic path count
9. Gradient/tone strategy
10. Whether any new dependency was added
11. Whether any production behaviour changed
12. Synthetic geometry p50/p95/p99
13. Whether a physical benchmark was genuinely collected
14. Exact steps to open and run the benchmark
15. Validation results
16. Known visual limitations

The goal is not a cheaper version of the previous mannequin.

The result must look like a continuous, filled, softly shaded graphite digital representation of the user: visually substantial, premium, body-neutral, clearly human and dramatically less expensive to render than the point-cloud figure.
