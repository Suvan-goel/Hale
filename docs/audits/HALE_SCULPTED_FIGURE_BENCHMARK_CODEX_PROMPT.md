Implement a benchmark-only prototype of a new premium, low-complexity pose figure for Hale.

## Context

Hale currently renders a point-cloud body over MediaPipe pose landmarks. Physical release-build testing on a Samsung Galaxy S22 showed:

### Raw skeleton + LIVE meta 640

- MediaPipe Full
- GPU delegate confirmed
- LIVE_STREAM
- rotation metadata
- 640x480
- source age at callback p95: approximately 169.65 ms
- preprocessing p95: approximately 3.26 ms
- renderer publication: approximately 13 Hz

### 450-dot point-cloud + LIVE meta 640

- geometry p50/p95/p99: 3 / 10 / 17 ms
- native event enqueue p95: approximately 28.44 ms
- source age at callback p95: approximately 194.53 ms
- renderer publication: approximately 13 Hz
- no stale or out-of-order frames

### 900-dot production-style point-cloud + LIVE meta 640

- geometry p50/p95/p99: 5 / 14 / 34 ms
- native event enqueue p95: approximately 33.34 ms
- source age at callback p95: approximately 203.87 ms
- renderer publication: approximately 12 Hz
- no stale or out-of-order frames

The current point-cloud figures are not visually premium enough for Hale’s intended target market and create meaningful renderer overhead.

We now want to prototype a substantially simpler figure that:

1. Looks premium, calm, mature and trustworthy.
2. Is highly visible on a white card.
3. Appeals to adults around 45–65.
4. Does not resemble a medical skeleton, game character or AI particle effect.
5. Uses dramatically fewer visual primitives than the point-cloud figure.
6. Preserves the freshest possible movement.
7. Can be benchmarked fairly against the raw skeleton and point-cloud modes.
8. Is implemented only on the diagnostics benchmark screen for now.

Do not integrate this figure into production sessions, check-ups or training screens in this pass.

## Read first

Inspect:

- `src/screens/PoseOverlayBenchmarkScreen.tsx`
- the current pose renderer entry point
- the classic/raw skeleton renderer
- the point-cloud body renderer
- the constellation renderer
- `src/render/latestFrameRafScheduler.ts`
- pose avatar renderer types/configuration
- pose latency diagnostics
- renderer replay diagnostics
- existing benchmark JSON export logic
- relevant renderer tests
- `docs/audits/HALE_POSE_OVERLAY_LATENCY_AUDIT.md`
- `docs/audits/HALE_POSE_OVERLAY_PHYSICAL_DEVICE_BENCHMARK.md`
- `docs/audits/HALE_POSE_PIPELINE_LATENCY_REMEDIATION.md`

Verify the actual architecture and filenames rather than assuming the paths above are complete.

## Objective

Add a new benchmark renderer mode called:

```text
Sculpted figure
```

Suggested internal IDs:

```text
renderer mode: sculpted_body
benchmark mode: sculpted-figure
```

The figure should look like a minimalist graphite sculpture displayed on a clean white gallery card.

It should be recognisably human and easy to follow during movement, while using approximately 14–18 filled shapes rather than hundreds of dots.

The prototype should be polished enough for a real visual evaluation, but isolated enough that it cannot accidentally become the production renderer.

## Non-negotiable scope rules

- Benchmark screen only.
- Do not change Hale’s production renderer default.
- Do not change any production recording, check-up, micro-check or training screen.
- Do not change MediaPipe configuration.
- Do not change assessment logic, movement grading, rep detection, safety logic or measurement filtering.
- Do not change the existing LIVE metadata coordinate contract.
- Do not change current point-cloud, constellation or classic-skeleton behavior.
- Do not add renderer smoothing.
- Consume raw pose landmarks.
- Preserve latest-frame-only scheduling.
- Do not add a new dependency unless it is already present in the repository.
- Do not add a 3D engine.
- Do not add image assets.
- Do not use blur, glow, shadows, particle effects or complex gradients.
- Do not use hundreds of SVG nodes.
- Do not commit or push unless explicitly instructed.
- Do not overwrite unrelated worktree changes.

## Visual direction

### Overall concept

Create a gender-neutral, body-neutral, softly sculpted human form.

It should feel like:

- a modern graphite or dark bronze sculpture;
- a premium editorial illustration;
- calm and dignified;
- tactile but not photorealistic;
- human without using facial features;
- appropriate for a health and longevity product;
- clearly visible from normal phone-viewing distance.

It must not feel like:

- a stick figure;
- a visible MediaPipe skeleton;
- a medical anatomy model;
- a robot;
- a superhero;
- a gaming avatar;
- a bodybuilding figure;
- a particle cloud;
- a child-oriented cartoon;
- a neon AI visual.

The result should have a strong filled silhouette rather than relying on thin outlines.

### Card presentation

Display the figure on an opaque white card:

```text
Card background: #FFFFFF
Card border:     #E6E9E7
```

Use the benchmark screen’s existing card/layout system where possible.

Do not add a dynamic card shadow as part of the renderer benchmark. A static existing card style may remain, but the figure itself must not rely on shadow or glow for visibility.

### Figure palette

Use:

```text
Primary graphite:       #26312F
Rear/depth graphite:    #63706B
Hale emerald accent:    #087A5B
Optional active accent: #12A078
Low-confidence grey:    #9EA7A3
Card background:        #FFFFFF
```

Guidelines:

- The primary graphite should make up most of the figure.
- Rear limbs may use the lighter graphite to create clear layering.
- Emerald should occupy no more than approximately 5–10% of the figure.
- Do not use semi-transparent pale body shapes that wash out against white.
- Avoid skin tones.
- Avoid making the entire figure green.
- Avoid gradients in the initial prototype.
- Avoid animated colour pulsing.

## Figure construction

Build the figure from a small fixed set of visual primitives.

Recommended structure:

1. Head
2. Torso
3. Pelvis
4. Left upper arm
5. Left forearm
6. Right upper arm
7. Right forearm
8. Left thigh
9. Left lower leg
10. Right thigh
11. Right lower leg
12. Left hand, optional
13. Right hand, optional
14. Left foot, optional
15. Right foot, optional
16. One restrained Hale seam/accent path

Maximum normal primitive count should remain below approximately 18–20.

### Head

Use a simple oval or softly sculpted rounded shape.

Requirements:

- No face.
- No eyes.
- No hair.
- No ears unless represented only through the head geometry.
- Do not make it a perfect circle if that makes it look toy-like.
- Use a proportion that reads clearly without becoming oversized.

Estimate the head centre robustly using the available face/head landmarks and shoulder geometry.

Have a safe fallback if individual face landmarks are unavailable.

### Torso

The torso is the visual anchor.

Construct it as a single softly tapered filled shape between the shoulders and hips.

It should:

- be broader at the shoulders;
- taper gently toward the waist;
- transition cleanly into the pelvis;
- have rounded rather than sharp corners;
- avoid looking like a rectangle or armour plate;
- remain stable in front, side and angled poses.

The torso may be one dynamic path derived from shoulder and hip positions.

Do not attempt to infer the user’s exact body fat, chest shape or waist shape.

The figure should use neutral standardised proportions rather than visually judging the user’s real body.

### Pelvis

Use one rounded pelvis shape or short horizontal capsule.

It should visually connect the torso and legs and hide gaps where the thigh shapes meet the hips.

Avoid visible hip-joint circles.

### Limbs

Represent each upper/lower limb segment as a softly tapered capsule.

Examples:

```text
shoulder → elbow
elbow → wrist
hip → knee
knee → ankle
```

Each segment should:

- taper gently from proximal to distal end;
- have rounded ends;
- overlap adjacent shapes slightly;
- hide visible gaps at elbows, knees, shoulders and hips;
- remain clear at small display sizes;
- avoid looking like straight mechanical rods.

Do not draw joint circles.

Use slightly thicker, more readable proportions rather than an extremely thin fashion-illustration body.

### Hands and feet

Hands and feet are optional, but include them if they materially improve the figure’s readability.

Keep them simple:

- hands may be small tapered rounded shapes;
- feet may be short rounded wedges/capsules;
- no fingers;
- no toes;
- no detailed anatomy.

If hand or foot tracking is poor, degrade gracefully rather than letting the shape jump or stretch.

### Hale seam

Add one restrained emerald signature detail.

Preferred design:

- a thin, subtly curved line running from the upper torso toward the pelvis;
- optionally extending a short distance toward one leg;
- visually similar to an engraved seam in a sculpture;
- no glow;
- no pulse;
- no “energy beam” appearance.

It should help make the figure feel like Hale’s own visual language rather than a generic mannequin.

This should be no more than one or two paths.

## Shape-generation architecture

Prioritise minimal recurring geometry work.

Preferred implementation order:

1. If the repository already contains an approved single-canvas renderer suitable for this use, use it.
2. Otherwise use the existing `react-native-svg` dependency with one `<Svg>` and a very small fixed number of paths/shapes.
3. Do not add Skia solely for this prototype unless Skia already exists in the repository and is already approved.

For an SVG implementation:

- Use static reusable unit shapes for limbs where possible.
- Position limb shapes using translation, rotation and scaling.
- Avoid rebuilding complex path strings for every limb on every frame.
- It is acceptable for the torso or pelvis to use one small dynamic path.
- Keep the total node count fixed.
- Do not create one React component per landmark.
- Do not create per-dot components.
- Do not create arrays of hundreds of points.
- Do not use SVG filters.
- Do not use clipping masks unless absolutely necessary.
- Do not use blur, drop shadow or glow filters.

Keep the geometry model renderer-agnostic enough that it could later move to a native or Skia surface if the prototype is visually approved.

Suggested files, adjusted to fit the repository:

```text
src/render/SculptedPoseRenderer.tsx
src/render/sculptedFigureGeometry.ts
src/render/sculptedFigureConfig.ts
src/render/__tests__/sculptedFigureGeometry.test.ts
```

Do not create unnecessary abstraction layers.

## Pose responsiveness

The renderer must prioritise movement freshness.

Use:

```text
frameSource="raw"
smoothingEnabled={false}
```

or the actual equivalent in Hale’s renderer architecture.

Do not use:

- measurement-smoothed landmarks;
- display One-Euro smoothing;
- renderer EMA smoothing;
- spring animations;
- timing animations toward each pose;
- interpolation that deliberately stays behind the latest result.

Use the existing latest-frame scheduler semantics:

- every incoming valid frame becomes the newest candidate;
- at most one RAF is pending;
- the scheduled callback consumes the newest frame;
- older/equal frame IDs cannot replace newer ones;
- frames may be coalesced;
- frames must never queue;
- unmount must cancel safely.

Reuse `latestFrameRafScheduler.ts` rather than implementing a competing scheduler.

## Stable visual proportions without movement lag

The figure’s joint positions must remain raw and responsive.

It is acceptable to stabilise only slow visual properties such as:

- head size;
- torso width;
- limb thickness;
- pelvis width;
- near/far limb designation.

Do not smooth the actual joint positions to achieve this.

Use body-scale-derived standardised widths with sensible clamps.

For example:

- derive a stable body scale from shoulder width, hip width and torso length;
- use that body scale to choose limb thickness;
- clamp impossible values;
- preserve the prior valid width briefly if one frame is noisy;
- update widths more slowly than positions if needed.

Do not allow limb thickness or torso width to flicker.

Do not reconstruct the user’s actual body silhouette.

## Depth and draw order

Use two solid graphite tones to distinguish front and rear limbs.

If MediaPipe Z values are used:

- inspect Hale’s actual Z sign convention;
- use a stable per-side depth estimate;
- add hysteresis;
- preserve the previous ordering when the depth difference is ambiguous;
- do not swap limb colours or draw order every frame;
- do not let noisy Z values create flicker.

If reliable depth ordering would add significant complexity, use a stable deterministic side ordering for the first prototype and document the limitation.

The torso should remain the central visual anchor.

Ensure overlapping limbs remain understandable in:

- neutral standing;
- arm raises;
- crossed-arm motion;
- side-on movement;
- sit-to-stand;
- hip hinge;
- single-leg balance.

## Confidence behaviour

Keep confidence treatment restrained.

Normal tracking:

```text
primary/rear graphite fills
```

Low confidence for one segment:

```text
use #9EA7A3 or a modest opacity reduction
```

Tracking lost:

- reduce the whole figure’s opacity calmly;
- do not make individual parts flash;
- do not pulse;
- do not show technical confidence numbers in the figure.

Do not add animated reacquisition transitions in this first renderer prototype.

The benchmark mode should test the base design and base render cost, not an effect stack.

## Benchmark-screen integration

Add a new renderer option to `PoseOverlayBenchmarkScreen`:

```text
Title: Sculpted figure
Subtitle: Low-complexity graphite sculpture
```

Suggested mode metadata:

```ts
{
  id: 'sculpted-figure',
  title: 'Sculpted figure',
  subtitle: 'Low-complexity graphite sculpture',
  configuredShapeCount: 16
}
```

Requirements:

- New mode appears only when pose-latency diagnostics are enabled.
- It must not appear in normal production navigation.
- It must use the same native pose stream as every other benchmark renderer.
- It must not mount alongside another overlay.
- Changing to/from this mode resets benchmark metrics.
- It must support all existing native benchmark profiles.
- The intended primary test is `LIVE meta 640`.
- It must render inside the same white-card dimensions intended for the production figure.
- Preserve the current benchmark controls, JSON export and run durations.

Do not change the existing renderer modes.

## Benchmark metrics

Extend benchmark reporting for the sculpted renderer.

Record:

- renderer update calls;
- renderer published frames;
- renderer coalesced frames;
- renderer rejected frames;
- geometry p50/p90/p95/p99/max;
- renderer published Hz;
- shape count;
- maximum shape count;
- dynamic path count;
- static transformed-shape count;
- stale/out-of-order counts;
- latest-frame scheduler events.

Extend the exported renderer section with fields such as:

```json
{
  "averageShapeCount": 16,
  "maxShapeCount": 16,
  "averageDynamicPathCount": 2,
  "maxDynamicPathCount": 2
}
```

Retain existing dot and line metrics for other renderers.

Do not claim physical display presentation timing that Hale cannot measure.

## Synthetic replay benchmark

Extend the existing renderer replay script to include:

```text
sculpted-figure
```

Feed it the same synthetic pose sequence used by the other renderer modes.

Report:

- p50;
- p95;
- p99;
- max geometry time;
- average/max primitive count.

Do not compare synthetic desktop timings as though they were physical-device drawing timings.

Synthetic replay should measure only geometry/transformation work.

## Performance targets

The new renderer should aim to be substantially closer to the raw skeleton than to the 450-dot point cloud.

Targets for the Samsung S22 release benchmark:

```text
Geometry p50:               <= 1 ms preferred
Geometry p95:               <= 3 ms
Geometry p99:               <= 8 ms
Renderer publication:       >= 13 Hz with LIVE meta 640
Coalesced frames:            near zero
Rejected/stale frames:       zero
Native event enqueue p95:   preferably <= 15 ms
Callback source age p95:    preferably <= 180–185 ms
Additional smoothing delay: zero
```

Treat these as engineering targets, not values to fabricate.

If no physical benchmark is run, report that clearly.

## Visual acceptance criteria

The new figure should pass all of these:

### Readability

- Immediately recognisable as a person.
- Visible clearly against the white card.
- Head, torso, arms and legs remain distinguishable.
- The silhouette is legible at normal phone-viewing distance.
- Crossed or overlapping limbs remain reasonably understandable.

### Premium appearance

- Calm and mature.
- Not toy-like.
- Not skeletal.
- Not robotic.
- Not overly athletic or muscular.
- No facial uncanny-valley effect.
- No particle/AI-demo appearance.
- Strong relationship to Hale’s graphite/emerald visual language.

### Body neutrality

- Gender-neutral.
- No exaggerated chest, waist, shoulders or hips.
- Does not imitate the user’s weight.
- Does not imply judgement of the user’s body shape.
- Suitable for a broad adult audience.

### Motion

- No visible gaps at joints.
- No detached hands or feet.
- No extreme limb stretching.
- No sudden torso-width changes.
- No left/right swapping.
- No depth-colour flicker.
- No added trailing caused by renderer smoothing.
- Correct orientation and mirroring.

### White-card contrast

- Primary silhouette remains dark and readable.
- Rear limbs remain visibly distinct.
- Emerald accent remains restrained.
- Low-confidence styling remains visible but calm.

## Testing

Add focused tests for:

- finite geometry output;
- degenerate zero-length limb segments;
- missing/low-confidence landmarks;
- torso construction;
- pelvis construction;
- limb tapering;
- shape-count cap;
- no unbounded primitive creation;
- correct 0/90/180/270 orientation assumptions inherited from emitted upright coordinates;
- front-camera mirror behavior;
- latest-frame scheduling;
- older/equal frame rejection;
- safe unmount/cancellation;
- card containment;
- no NaN/Infinity transforms;
- static unit-shape reuse where applicable.

Add at least a few deterministic pose fixtures:

- neutral standing;
- both arms raised;
- side-facing pose;
- chair-stand/squat position;
- one arm crossing the torso.

Tests should verify geometry contracts, not subjective visual beauty.

## Production isolation test

Add a test or static assertion where practical proving:

- the default Hale renderer has not changed;
- no production session screen selects `sculpted_body`;
- the new mode is accessible only through the diagnostics benchmark;
- diagnostics-off builds do not expose the mode through Settings.

Do not modify the app’s production renderer configuration.

## Documentation

Create:

```text
docs/audits/HALE_SCULPTED_FIGURE_BENCHMARK_PROTOTYPE.md
```

Include:

1. Design rationale
2. Palette
3. Shape inventory
4. Landmark-to-shape mapping
5. Rendering architecture
6. Primitive counts
7. Scheduler behavior
8. Synthetic benchmark results
9. Physical benchmark results, only if genuinely collected
10. Comparison targets versus raw skeleton, 450 dots and 900 dots
11. Known visual limitations
12. Exact manual physical benchmark instructions
13. Criteria for deciding whether to integrate it into production

## Manual benchmark instructions to include

After implementation, the intended physical test is:

```text
Renderer: Sculpted figure
Native profile: LIVE meta 640
Duration: 60 seconds
Build: release/profileable
Device: Samsung SM-S901B
```

Use the same movement sequence as prior tests:

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

The most important comparison fields are:

- geometry p95/p99;
- native event enqueue p95;
- source age at callback p95;
- source age at emit p95;
- renderer published Hz;
- coalesced frames;
- stale/out-of-order frames;
- subjective appearance and readability.

## Validation

Run all applicable checks:

```text
targeted sculpted-geometry tests
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

Do not fix unrelated failures unless they were introduced by this pass.

## Final terminal response

Report:

1. Files changed
2. Benchmark mode ID
3. Rendering technology used
4. Exact primitive count
5. Dynamic path count
6. Whether any new dependency was added
7. Whether production behavior changed
8. Synthetic geometry p50/p95/p99
9. Whether a physical benchmark was genuinely collected
10. How to open and run the new benchmark mode
11. Validation results
12. Any known visual or performance limitations

The goal of this pass is not merely to make a cheaper mannequin. The result should look deliberately designed for Hale: a dark, softly sculpted, mature human form with clear movement, restrained emerald branding and dramatically lower rendering complexity than the point-cloud figure.
