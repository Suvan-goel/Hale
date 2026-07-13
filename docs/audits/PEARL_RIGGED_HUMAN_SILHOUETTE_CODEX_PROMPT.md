# Codex task: Replace the rejected experimental figure with an original rigged human silhouette

## Context

Pearl has a diagnostics-only pose-overlay benchmark screen used to compare renderer designs and measure their effect on latency.

The Android pose pipeline has already been optimised and physically validated on a Samsung Galaxy S22:

- MediaPipe model: `pose_landmarker_full.task`
- requested delegate: GPU
- selected delegate: GPU
- GPU fallback: false
- running mode: `LIVE_STREAM`
- rotation path: MediaPipe rotation metadata
- analysis resolution: `640x480`
- camera timestamp source: `REALTIME`
- latest-only native event delivery
- latest-only renderer scheduling
- raw landmarks for the visual path
- no renderer smoothing

Relevant release-build measurements:

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

### 900-dot point cloud + LIVE meta 640

- geometry p50/p95/p99: approximately `5 / 14 / 34 ms`
- native event enqueue p95: approximately `33.34 ms`
- source age at MediaPipe callback p95: approximately `203.87 ms`
- renderer publication: approximately `12 Hz`
- stale/out-of-order frames: `0`

The point-cloud figure feels more premium than a raw skeleton, but it is still not the desired visual direction and creates significant renderer overhead.

Two previous experimental benchmark figures were rejected:

1. A capsule/body-part “sculpted figure”
2. A matte-graphite digital-twin attempt built from simplified constructed shapes

Both looked cheap, toy-like and mannequin-like. Do not refine either design.

## User-approved visual direction

The user supplied a reference image of a continuous, filled human silhouette on a white background.

Use the reference only for the following high-level qualities:

- immediately recognisable full human body;
- continuous filled surface;
- natural human proportions;
- no visible skeleton;
- no visible joint circles;
- no capsule construction;
- no floating head;
- no separate pelvis block;
- arms and legs feel attached to the body;
- the entire body reads as one coherent person.

Do not trace, copy, embed or redistribute the watermarked stock image.

Create an original, gender-neutral adult silhouette for Pearl.

The desired product direction is:

> A continuous, featureless, matte-graphite human silhouette whose invisible internal rig follows the MediaPipe skeleton.

The skeleton is only the rig. The user must never see it.

## Primary objective

Replace the current rejected benchmark-only experimental figure with a new renderer called:

```text
Rigged human silhouette
```

Suggested IDs:

```text
renderer mode: rigged_human_silhouette
benchmark mode: rigged-human-silhouette
```

The new renderer must:

1. Look like a filled human body, not a graphic built around landmarks.
2. Have meaningful surface area.
3. Feel visually connected to the user’s movement.
4. Use an invisible 2D skeletal rig driven by MediaPipe landmarks.
5. Preserve a continuous, natural outer body silhouette.
6. Avoid all visible mannequin construction.
7. Be original and body-neutral.
8. Stand out clearly on a white card.
9. Be substantially cheaper to render than the 450-dot point cloud.
10. Exist only on the diagnostics benchmark screen in this pass.
11. Replace the previous experimental figure rather than adding another permanent prototype.
12. Leave every production screen and production renderer default unchanged.

## Read first

Inspect the real repository before making changes, including:

- `src/screens/PoseOverlayBenchmarkScreen.tsx`
- the current experimental sculpted/digital-twin benchmark renderer
- its geometry, configuration and tests
- the central pose-avatar renderer entry point
- renderer mode/type definitions
- the raw/classic skeleton renderer
- the point-cloud renderer
- `src/render/latestFrameRafScheduler.ts`
- pose-avatar configuration and production defaults
- pose latency diagnostics
- benchmark JSON export
- synthetic renderer replay tooling
- relevant renderer tests
- `docs/audits/PEARL_POSE_OVERLAY_LATENCY_AUDIT.md`
- `docs/audits/PEARL_POSE_OVERLAY_PHYSICAL_DEVICE_BENCHMARK.md`
- `docs/audits/PEARL_POSE_PIPELINE_LATENCY_REMEDIATION.md`
- previous experimental-figure reports, if present

Verify actual filenames and architecture. Treat the paths above as hints.

## Non-negotiable scope constraints

- Benchmark screen only.
- Replace the rejected experimental benchmark mode; do not show both old and new modes.
- Remove obsolete experimental renderer code when it has no remaining consumer.
- Do not change Pearl’s production renderer default.
- Do not change recording, check-up, training, micro-check or any other production screen.
- Do not change MediaPipe model, delegate, confidence thresholds, running mode, camera resolution or rotation logic.
- Do not change assessment logic, rep detection, measurement filtering, safety logic or workout logic.
- Do not change native latest-only event delivery.
- Do not change the corrected metadata-rotation coordinate contract.
- Consume raw pose landmarks.
- Do not add pose smoothing.
- Reuse `latestFrameRafScheduler.ts`.
- Do not add a 3D engine.
- Do not use camera segmentation.
- Do not use a stock image or raster silhouette asset.
- Do not add a heavy dependency.
- Do not use one React component per vertex, bone, triangle or landmark.
- Do not render visible triangulation.
- Do not use hundreds of SVG nodes.
- Do not use blur, glow, drop shadows, particle systems or SVG filters.
- Do not commit or push unless explicitly instructed.
- Do not overwrite unrelated worktree changes.

## Design target

### Overall appearance

The figure should look like:

- one continuous human silhouette;
- a featureless adult body;
- a matte graphite sculptural surface;
- an understated premium digital representation;
- a calm, mature health-product visual;
- a body with real visual mass;
- a coherent person even when limbs bend.

It must not look like:

- a capsule mannequin;
- a wooden artist’s model;
- a toy;
- a robot;
- a superhero;
- a game avatar;
- a medical anatomy model;
- a stick figure;
- a skeleton;
- a line drawing;
- a particle cloud;
- a low-poly character;
- a group of overlapping geometric pieces;
- an egg-shaped head attached to a torso;
- a flat icon with awkward limb attachments.

### Original neutral anatomy

Create an original neutral adult template.

Requirements:

- gender-neutral proportions;
- no pronounced chest;
- no exaggerated waist;
- no exaggerated hips;
- no exaggerated shoulder width;
- no visible muscles;
- no facial features;
- no hair;
- no fingers or toes;
- no clothing;
- no body-fat inference;
- no attempt to reproduce the user’s exact outer body shape.

The figure should feel personalised through:

- shoulder width;
- hip width;
- torso length;
- upper/lower arm lengths;
- upper/lower leg lengths;
- head-to-body ratio;
- current pose;
- body orientation;
- stable near/far limb ordering.

It must not infer weight, sex, muscularity or body fat.

## White-card presentation

The benchmark figure appears on a white card.

Use:

```text
Card background: #FFFFFF
Card border:     #E6E9E7
```

The figure must remain readable from normal phone-viewing distance.

Do not rely on shadows to separate it from the card.

## Colour and material system

Use a restrained matte graphite treatment:

```text
Deep graphite:        #17201E
Primary graphite:     #28332F
Mid graphite:         #3F4B46
Soft highlight:       #69756F
Far-side graphite:    #343F3B
Low-confidence grey:  #8C9691
Optional Pearl accent: #087A5B
Card:                 #FFFFFF
```

Guidelines:

- Most of the body should use the primary graphite.
- Do not use pure black.
- Use one subtle reusable matte gradient or a few broad tonal regions.
- No glossy highlights.
- No neon.
- No glow.
- No animated colour pulses.
- Emerald is optional and must occupy no more than approximately 1–2% of the figure.
- Do not add a long emerald body seam.
- Do not make the body look like a costume.

A completely flat single-colour silhouette is acceptable only as a fallback, not as the intended final visual. The preferred result has restrained surface depth.

## Core technical concept: an invisible 2D rig

Build an original neutral rest-pose silhouette and attach it to an internal 2D skeleton.

Suggested virtual bones:

```text
pelvis/root
lower spine
upper spine/chest
neck
head
left clavicle/shoulder
left upper arm
left forearm
left hand
right clavicle/shoulder
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

Map these to the appropriate MediaPipe landmarks and derived anchors.

The internal rig must not be visible.

## Preferred deformation architecture

Implement a low-resolution skinned 2D body model.

Target internal complexity:

```text
approximately 70–130 internal vertices/control points
approximately 12–18 virtual bones
1–2 bone influences per vertex where practical
fixed topology
preallocated/reused buffers
```

The mesh is an internal deformation model only.

Do not render one SVG polygon per triangle.

Do not expose facets.

Do not draw mesh lines.

Convert the deformed body into a very small number of smooth filled outer-surface paths.

### Visible surface inventory

A practical rendering structure is:

1. One central head-neck-torso-pelvis surface
2. One continuous left-arm surface
3. One continuous right-arm surface
4. One continuous left-leg surface
5. One continuous right-leg surface
6. Optional torso highlight surface
7. Optional near-side highlight surface
8. Optional far-side tonal surface
9. Optional tiny Pearl accent

Target:

```text
5 primary body surfaces
0–3 tonal overlay surfaces
0–1 tiny accent
approximately 5–9 visible paths preferred
hard cap of 12 visible body/tone paths
```

Separate internal surfaces are acceptable only when the final figure looks continuous.

### Why separate surfaces are allowed internally

A single outer contour for arbitrary crossed limbs is fragile and may self-intersect.

It is acceptable to use separate arm and leg surfaces if:

- arm roots extend underneath the central torso surface;
- thigh roots extend underneath the pelvis;
- all body surfaces use a coherent material;
- no outlines reveal the pieces;
- overlap order hides attachment seams;
- the user perceives one continuous body.

## Rest-pose template

Create the neutral template directly in code as original vector/mesh data.

Do not trace the supplied stock silhouette.

The rest pose should be:

- upright;
- arms slightly away from the torso;
- palms simplified;
- feet slightly separated;
- neutral head;
- natural shoulder slope;
- continuous neck;
- gently tapered torso;
- neutral pelvis;
- natural thigh and calf contours.

Use normalized coordinates so the template is resolution-independent.

Document the template coordinate system.

## Bone transforms

For every incoming pose:

1. Compute stable virtual joint anchors from raw MediaPipe landmarks.
2. Build 2D bone transforms from the rest skeleton to the current pose.
3. Apply transforms to the fixed internal mesh/control vertices.
4. Blend influences around shoulders, elbows, hips and knees.
5. Generate the small set of visible smooth surface paths.
6. Publish only the newest scheduled frame.

Use translation, rotation and scale along each bone.

Avoid uncontrolled non-uniform scaling that makes limbs look rubbery.

Use sensible anatomical clamps for bone-length and width changes.

### Joint blending

The elbow and knee must bend the silhouette without exposing a hinge.

Requirements:

- continuous arm contour through elbow;
- continuous leg contour through knee;
- no joint circles;
- no sharp wedge;
- no detached limb segments;
- no capsule overlap;
- subtle joint volume;
- no rubber-hose bend.

Use blended skin weights or curved-boundary control points around joints.

### Shoulder and hip attachment

These areas are critical.

Shoulders:

- arms must emerge naturally from the torso;
- no circular shoulder cap;
- no gap;
- no obvious overlap edge;
- shoulder contour should respond to arm elevation.

Hips:

- thighs must emerge naturally from the pelvis;
- no separate pelvis block;
- no hip-joint circles;
- no visible gap;
- preserve a coherent crotch/pelvic silhouette without anatomical detail.

## Central head-neck-torso-pelvis surface

This must read as one connected body.

Requirements:

- head connects to neck;
- neck connects to shoulders;
- shoulders flow into torso;
- torso flows into waist and pelvis;
- no floating head;
- no separate torso slab;
- no separate pelvis piece;
- no visible construction seams.

### Head

Use a featureless, slightly anatomical neutral head contour:

- softly rounded skull;
- subtle jaw taper;
- no perfect circle;
- no perfect egg;
- no eyes, nose, ears, mouth or hair;
- stable scale;
- connected neck.

Face landmarks may provide anchors, but facial features must not be rendered.

### Torso

The torso should:

- have a natural shoulder slope;
- gently taper toward the waist;
- retain enough width to feel substantial;
- avoid exaggerated gendered anatomy;
- respond to torso lean and rotation;
- remain coherent in front, three-quarter and side views.

### Pelvis

The pelvis should:

- connect the torso and thighs;
- remain understated;
- avoid a block shape;
- avoid pronounced hips;
- hide thigh attachment seams;
- remain stable during sit-to-stand and squats.

## Arms

Each visible arm should be one continuous surface from shoulder to hand.

Requirements:

- natural shoulder-to-wrist taper;
- slight upper-arm and forearm volume;
- integrated elbow;
- simplified integrated hand;
- no fingers;
- no detached hand;
- no bulbous mitten shape;
- stable width;
- coherent crossed-arm behaviour.

The hand can be an understated tapered paddle/wedge driven by wrist and optional index/thumb anchors where reliable.

## Legs

Each visible leg should be one continuous surface from hip to foot.

Requirements:

- natural thigh volume;
- narrower knee transition;
- calf contour;
- ankle taper;
- integrated foot;
- no toes;
- no detached foot;
- no cylinder appearance;
- stable during sit-to-stand, squat, hinge and balance poses.

Use ankle, heel and foot-index landmarks where reliable.

Provide a conservative fallback when foot landmarks are weak.

## Orientation handling

A front-only silhouette will distort when the user turns.

Implement a low-cost orientation-aware template strategy.

Preferred approach:

### Two compatible templates with identical topology

Create:

```text
front template
side template
```

Both must use the same vertex/control-point topology and bone weights.

Estimate orientation from:

- apparent shoulder width relative to torso length;
- apparent hip width;
- shoulder/hip landmark depth differences;
- torso direction;
- stable hysteresis.

Blend the rest template between front and side before applying pose skinning:

```text
blendedRestVertex =
frontVertex * (1 - orientationFactor)
+ sideVertex * orientationFactor
```

Requirements:

- orientation changes must be stable;
- no frame-to-frame width flicker;
- no sudden template snap;
- no gendered side profile;
- three-quarter views should emerge from blending;
- if Z is noisy, preserve the prior stable orientation factor.

If a two-template implementation is too risky for the initial prototype, implement a clearly documented, stable width-compression fallback—but do not ignore side-facing behaviour.

## Proportion calibration

The figure should adopt the user’s skeletal proportions without allowing body shape to flicker.

When the renderer becomes active:

1. Begin rendering immediately using neutral template proportions.
2. Collect several valid frames.
3. Estimate:
   - shoulder width;
   - hip width;
   - torso length;
   - upper-arm length;
   - forearm length;
   - thigh length;
   - lower-leg length;
   - head scale.
4. Use a median, trimmed mean or robust estimator.
5. Lock or heavily stabilise these proportions for the current benchmark run.
6. Reset calibration when:
   - mode changes;
   - benchmark metrics reset;
   - camera subject is replaced;
   - renderer unmounts.

Do not smooth joint positions.

Only stabilise shape proportions and orientation state.

Do not delay visible rendering while calibrating.

Add a low-frequency benchmark label:

```text
Calibration: neutral / collecting / locked
```

Do not update it every pose frame.

## Depth and draw order

Use stable near/far limb ordering.

If MediaPipe Z is reliable:

- determine near/far at limb level;
- apply hysteresis;
- keep prior order when ambiguous;
- do not swap every frame;
- use far-side graphite for rear limbs;
- keep rear limbs visible.

If Z is not stable, use deterministic ordering and document the limitation.

Do not let depth handling introduce flicker.

## Surface treatment

Preferred implementation:

- one reusable primary matte gradient;
- one reusable rear-limb gradient or darker flat tone;
- optional broad highlight path over torso/near side;
- no dynamic per-pixel lighting.

Static gradient definitions may be reused across frames.

Do not rebuild gradient definitions per pose.

Do not use:

- blur;
- glow;
- shadow;
- filters;
- masks unless absolutely necessary;
- many tiny highlight paths;
- glossy specular effects.

The silhouette shape must remain readable even if gradients are disabled.

## Confidence behaviour

Normal tracking:

```text
matte graphite body
```

Low-confidence limb:

- move toward `#8C9691`, or
- reduce contrast modestly.

Tracking lost:

- calmly reduce whole-body opacity;
- do not flash individual limbs;
- do not pulse;
- do not show confidence numbers inside the figure.

No reacquisition animation in this prototype.

## Rendering technology

Use the lightest already-approved renderer available in the repository.

Preferred order:

1. Existing approved single-canvas/native drawing surface, if already available.
2. Existing `react-native-svg` with one `<Svg>` and a fixed small number of `<Path>` elements.
3. Do not add Skia solely for this benchmark unless Skia already exists and is approved.

### If using react-native-svg

Requirements:

- one `<Svg>` root;
- no more than 12 visible body/tone paths;
- fixed node count;
- no per-vertex React components;
- no per-triangle polygons;
- no per-landmark components;
- reuse static gradient definitions;
- preallocate geometry buffers where practical;
- avoid per-frame creation of styles/config objects;
- no SVG filters;
- no hundreds of commands unrelated to the actual contour;
- batch same-fill surfaces where practical.

The geometry model should remain renderer-agnostic enough to move to native/Skia later.

## Pose freshness

Use:

```text
frameSource="raw"
smoothingEnabled={false}
```

or the actual equivalent.

Do not use:

- measurement-smoothed landmarks;
- display One-Euro smoothing;
- renderer EMA smoothing;
- spring animations;
- timing animations;
- interpolation that intentionally stays behind the newest pose.

Reuse `latestFrameRafScheduler.ts`.

Required scheduling semantics:

- every valid incoming pose replaces the latest candidate;
- at most one RAF is pending;
- the RAF consumes the newest candidate;
- older/equal frame IDs are rejected;
- bursts coalesce to the newest frame;
- no frame queue grows;
- reset/unmount cancels safely.

## Replace the current rejected benchmark renderer

Requirements:

- Replace the current sculpted/matte-digital-twin benchmark option with `Rigged human silhouette`.
- Do not show the rejected mode.
- Remove obsolete renderer files/config/tests when there are no other consumers.
- Preserve useful generic helpers only when justified.
- Update benchmark mode metadata.
- Update benchmark JSON export.
- Update synthetic replay.
- Do not alter any production renderer configuration.

Suggested benchmark metadata:

```ts
{
  id: 'rigged-human-silhouette',
  title: 'Rigged human silhouette',
  subtitle: 'Continuous human surface on an invisible pose rig',
}
```

## Benchmark-screen integration

The new mode must:

- appear only inside `PoseOverlayBenchmarkScreen`;
- remain inaccessible when diagnostics are disabled;
- use the same native pose stream as other renderers;
- not run MediaPipe twice;
- not mount with another overlay;
- support all existing native pipeline profiles;
- be tested primarily with `LIVE meta 640`;
- use the same white card;
- preserve 30-second/60-second controls;
- preserve JSON export;
- reset metrics, calibration and orientation state on mode changes.

Add low-frequency benchmark information for:

```text
visible surface paths
internal vertex/control-point count
virtual bone count
orientation profile
calibration state
```

## Metrics

Extend renderer export for this mode with fields such as:

```json
{
  "averageVisibleSurfacePathCount": 0,
  "maxVisibleSurfacePathCount": 0,
  "internalVertexCount": 0,
  "virtualBoneCount": 0,
  "averageDynamicPathCount": 0,
  "maxDynamicPathCount": 0,
  "calibrationState": "locked",
  "orientationFactor": 0
}
```

Use consistent actual field names.

Continue recording:

- renderer update calls;
- renderer published frames;
- coalesced frames;
- rejected frames;
- geometry p50/p90/p95/p99/max;
- renderer published Hz;
- stale/out-of-order counts;
- native event enqueue p95;
- source age at callback p95;
- source age at emit p95;
- JS transform time.

Do not claim unavailable physical presentation timestamps.

## Synthetic replay

Replace the rejected experimental figure in the renderer replay benchmark with:

```text
rigged-human-silhouette
```

Use the same deterministic pose sequence as other modes.

Report:

- geometry p50;
- p95;
- p99;
- max;
- visible path count;
- internal vertex/control-point count;
- virtual bone count.

Synthetic replay measures geometry only, not device drawing or physical presentation.

## Performance targets

The new renderer must be materially cheaper than the 450-dot point cloud.

Target on Samsung SM-S901B with `LIVE meta 640`:

```text
Geometry p50:                    <= 1.5 ms preferred
Geometry p95:                    <= 4 ms
Geometry p99:                    <= 8 ms
Visible surface paths:           <= 9 preferred
Hard path/node cap:              <= 12
Renderer publication:            >= 13 Hz
Coalesced frames:                near zero
Rejected/stale frames:           zero
Native event enqueue p95:        preferably <= 18 ms
Source age at callback p95:      preferably <= 185 ms
Source age at emit p95:          preferably <= 195 ms
Added smoothing delay:            zero
```

Do not fabricate results.

Visual quality is mandatory. Do not hit the performance target by producing another mannequin.

## Visual acceptance criteria

### Human form

- Immediately recognisable as a filled adult human.
- Meaningful surface area.
- Natural head-to-body ratio.
- Head connected to neck.
- Neck connected to shoulders.
- Torso connected to pelvis.
- Arms connected to shoulders.
- Legs connected to hips.
- No visible construction pieces.
- No visible skeleton.
- No joint circles.
- No capsule limbs.
- No floating head.
- No separate pelvis block.

### Premium feel

- Calm and mature.
- Subtle matte depth.
- Original and intentional.
- Appropriate for a premium health/longevity app.
- Not toy-like.
- Not cheap.
- Not cartoonish.
- Not robotic.
- Not a game avatar.
- Not a medical model.
- Not a low-poly mesh.
- Not a flat clip-art icon.
- Not a particle effect.

### Body neutrality

- Gender-neutral.
- No exaggerated shoulders, chest, waist or hips.
- No muscles.
- No speculative body-fat or weight representation.
- No facial features.
- Suitable for a broad adult audience.

### Motion

Visually inspect:

- neutral standing;
- both arms raised;
- one arm raised;
- arms crossing torso;
- side-facing stance;
- torso rotation;
- repeated chair stands;
- chair-stand bottom;
- squat;
- hip hinge;
- single-leg balance.

The renderer must show:

- no limb detachment;
- no shoulder/hip gaps;
- no elbow/knee seam;
- no width flicker;
- no template snapping;
- no left/right swapping;
- no depth-colour flicker;
- no extreme stretching;
- no added trailing;
- correct orientation;
- correct front-camera mirroring.

## Automated tests

Add focused tests for:

- finite geometry;
- no `NaN`/`Infinity`;
- fixed topology;
- hard visible-path cap;
- internal vertex count remains bounded;
- neutral-template validity;
- front/side topology compatibility;
- orientation blending;
- orientation hysteresis;
- proportion calibration collection;
- proportion lock;
- proportion reset;
- missing face landmarks;
- missing hand/foot landmarks;
- low-confidence limb;
- zero-length bone;
- skinning with one influence;
- skinning with two influences;
- elbow continuity;
- knee continuity;
- shoulder attachment;
- hip attachment;
- head-neck continuity;
- central shell continuity;
- bounds containment;
- deterministic output for deterministic input;
- front-camera mirror assumptions;
- upright-coordinate assumptions;
- latest-frame burst-newest behaviour;
- older/equal frame rejection;
- safe reset/unmount cancellation;
- production isolation.

Use deterministic pose fixtures for:

- neutral standing;
- both arms raised;
- arm crossing torso;
- side-facing pose;
- chair-stand bottom;
- hip hinge;
- single-leg stance.

Tests should enforce geometry and architecture contracts, not subjective beauty.

## Production isolation

Add a test or static assertion where practical proving:

- the default production renderer did not change;
- no production screen selects `rigged_human_silhouette`;
- the rejected experimental mode is removed from the benchmark;
- the new mode is benchmark-only;
- diagnostics-off builds do not expose it;
- no production pose-pipeline setting changed.

## Documentation

Create:

```text
docs/audits/PEARL_RIGGED_HUMAN_SILHOUETTE_BENCHMARK.md
```

Include:

1. Why the previous figure was rejected
2. Reference-image usage and originality safeguards
3. Design rationale
4. Neutral silhouette template
5. Virtual bone mapping
6. Skinning/deformation architecture
7. Surface/path inventory
8. Proportion calibration
9. Front/side orientation strategy
10. Depth-order strategy
11. Colour/material treatment
12. Scheduling and freshness behaviour
13. Synthetic benchmark results
14. Physical benchmark results only if genuinely collected
15. Comparison targets versus raw skeleton, 450 dots and 900 dots
16. Known visual limitations
17. Exact manual benchmark instructions
18. Criteria for production adoption

## Manual physical benchmark

After implementation, test:

```text
Renderer: Rigged human silhouette
Native profile: LIVE meta 640
Duration: 60 seconds
Build: release/profileable
Device: Samsung SM-S901B
```

Use the same sequence as earlier benchmarks:

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

Most important values:

- geometry p95/p99;
- visible surface path count;
- native event enqueue p95;
- source age at callback p95;
- source age at emit p95;
- renderer published Hz;
- coalesced frames;
- stale/out-of-order frames;
- subjective visual continuity;
- premium appearance;
- body readability on white;
- perceived connection to the user.

## Validation

Run all applicable checks:

```text
targeted silhouette geometry tests
skinning tests
proportion-calibration tests
orientation-blending tests
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
2. Rejected experimental files removed or retained, with reasons
3. New benchmark mode ID
4. Rendering technology used
5. Rest-template strategy
6. Skinning/deformation approach
7. Internal vertex/control-point count
8. Virtual bone count
9. Visible surface/path count
10. Front/side orientation strategy
11. Proportion-calibration behaviour
12. Whether any new dependency was added
13. Whether any production behaviour changed
14. Synthetic geometry p50/p95/p99
15. Whether a physical benchmark was genuinely collected
16. Exact steps to open and run the benchmark
17. Validation results
18. Known visual limitations

The goal is not another abstract “sculpted” avatar.

The result must look like an original, continuous, filled human silhouette similar in overall coherence to the user’s reference image, while being internally rigged to the MediaPipe skeleton and remaining fast enough for Pearl’s live benchmark.
