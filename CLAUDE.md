# PROJECT CONTEXT — Pearl MVP

> This file is the project's source of truth for product rules, pose-detection knowledge, and
> architecture. Future sessions depend on it. Do not delete content; update carefully.
> Significant decisions are logged in `docs/decisions.md`.

### Authority order

For audience, positioning, MVP scope, claims, and product decisions, use this file first, then
`README.md` and `Idea.md`. Dated files under `docs/audits/`, old QA protocols, migration plans,
and implementation handoffs are historical engineering evidence. They may accurately describe
code or decisions that have since been retired, but they are never authority for Pearl's current
audience or product promise. When historical material conflicts with this file, this file wins.

## Product identity — read this before making any product decision

**Pearl is not a broad general-longevity app.** That was an earlier concept and is not the
product being built. Do not use it as the audience, positioning, information
architecture, copy frame, exercise rationale, acquisition thesis, or default basis for a new
feature.

Pearl is a private, structured **12-week strength programme for women roughly 45–60 who are in
perimenopause or early postmenopause**, understand that strength matters, are not training
consistently, and want to begin safely at home. Pearl answers three questions:

1. Where am I starting in Strength and Balance?
2. What should I work on now?
3. Is the work changing my own results?

The journey is Foundations (weeks 1–4), Build (weeks 5–8), and Progress (weeks 9–12). Three
voice-paced sessions are planned each week; two is explicitly a successful week. Comparable
Movement Check-Ups happen at baseline, week 4, week 8, and week 12. Each accepted check-up
chooses a Strength, Balance, or Balanced physical emphasis for the next phase. The camera is a
**measuring instrument, never a form judge**. Daily training is voice-paced and does not use
the camera.

Pearl also tracks **Everyday Clarity**, because brain fog, word-finding difficulty,
concentration, mental fatigue, and everyday lapses are important to this audience. The live
MVP currently offers an optional five-item self-report at each official check-up. A matched
solo/dual balance instrument (“Steadiness while thinking”) is implemented and headless-tested
but must remain unmounted until its real-device camera/microphone and target-user validity
gates pass. Clarity is observational: it never changes exercise selection, dose, progression,
pace, or guidance; it is never combined with Strength or Balance; and Pearl never claims to
diagnose, treat, or objectively score “brain fog.” Product language should use the hierarchy
**measure Strength and Balance; track Everyday Clarity**.

Strategic frame: the camera is the sensor; adherence and proof over twelve weeks are the
product. The founder team previously built a gym form-feedback app (Forma) on MediaPipe +
React Native; the technical notes below transfer its hard-won pose-detection knowledge, not
its form-coaching product model.

## Product laws (non-negotiable design rules, validated in user interviews)

1. **Never show self-view camera video.** Render a clean figure; Pearl's users want presence
   without a mirror. Everyday screens use a true-black canvas, `#181818` graphite cards,
   white as the primary action/text accent, and dusty-orchid `#B77BC3` as Pearl's secondary
   brand accent. Active camera/session focus surfaces remain separately controlled. All
   tokens live in `src/theme`; no screen hardcodes colour.
2. **Voice-paced training.** Daily sessions use bundled voice guidance and a tiny on-device
   command vocabulary with complete tap parity. Pearl waits for the user before work begins.
   The camera is reserved for official measurement, not daily workouts.
3. **Silence by default.** The camera speaks only on high-confidence findings. No rep-by-rep
   form critique, ever — one false positive kills trust permanently. High precision, low
   recall, or nothing.
4. **No medical or causal claims.** Wellness-side language only. Do not claim Pearl measures
   hormones, bone density, fracture risk, cognition, or what menopause caused. Do not claim
   the programme caused a Clarity change. Strength and Balance results lead; population
   comparison is subordinate and opt-in where eligibility permits; no composite age score.
5. **No gamification** (streak-shaming, badges, social feeds). Pearl motivates through a
   finite programme, evidence, routine, and compassionate consistency.
6. **Zero-equipment start.** Chair, wall, floor, bottom stair, cushion. Every exercise must
   have a zero-equipment regression so a missing item substitutes, never blocks.
7. **Comparable means identical protocol.** Baseline and retests use the same frozen core
   battery. A partial or different check-up must never be presented as comparable progress.
8. **Clarity stays separate.** Everyday Clarity and any future objective Clarity instrument
   render as separate personal series, never a combined score and never a training input.
9. **Protect the audience definition.** Optimise onboarding, safety, programme language,
   examples, research, and marketing for women 45–60 in perimenopause or early postmenopause.
   General-adult capability may remain for compatibility, but it is not product direction.
10. **Online profiles stay narrow.** Optional Supabase accounts may sync only the explicit
    non-health profile allowlist: identity/reference details, predefined movement-goal category,
    trainer voice, and
    comparison preference. Menopause/symptom/safety context, programme state, workouts, check-ups,
    Everyday Clarity, camera data, and landmarks remain on-device. A wider sync is a separate
    product, consent, security, and privacy decision.

## Hard-won pose-detection knowledge (MediaPipe, mobile, real homes)

- **Engine:** MediaPipe Tasks Vision PoseLandmarker (33 landmarks), run **fully native**
  (Android: `com.google.mediapipe:tasks-vision`, CameraX; iOS: `MediaPipeTasksVision` pod,
  AVFoundation) inside a local Expo module exposing a `PoseDetectionView` that owns camera +
  inference and emits one landmark-array event per frame to JS at ~30fps. Never push camera
  frames across the JS bridge. Use VIDEO running mode with monotonic timestamps; GPU delegate
  on Android; start with the `lite` model for 30fps on mid-range devices, upgrade to `full`
  only if profiling allows.
- **Detection confidence:** the 0.5 default misses side-on poses. **0.35 worked** for side
  views in production. Expect Android to need patch-package fixes for MediaPipe gradle/runtime
  quirks; budget for it.
- **Per-frame visibility scores are noisy and untrustworthy.** Gate all decisions on
  reliability **smoothed over windows, per limb chain** (e.g., shoulder→hip→knee→ankle), not
  raw per-frame visibility.
- **Side-view movements:** the far-side limb is garbage (occlusion). Dynamically select the
  reliable near side; require only 1 reliable limb chain for side-view items, 2 for front-view
  bilateral items. Encode a per-movement camera-view spec (side vs front + required chains)
  and surface a live "camera readiness" status from it.
- **Subject validity:** before processing, verify the skeleton is a plausible present human
  (landmark dispersion, proportions, size in frame). Without this, furniture and wall art
  become subjects.
- **Subject-gone handling (painful lesson):** when the subject leaves frame mid-activity, emit
  an explicit tracking-interruption and **reset rep/hold state machines**. Otherwise re-entry
  double-counts reps.
- **Warmup gate:** the first ~1–2 s of detection are unstable. Never count anything until a
  stability window passes.
- **Jitter:** raw landmarks jitter at 30fps. Smooth angles/positions (EMA or One-Euro filter)
  before thresholding, and use **hysteresis** (separate up/down thresholds) on all rep-state
  transitions or you will double-count.
- **2D pose cannot see rotation** (transverse plane) — except head yaw, which is estimable
  from nose/ear landmark geometry. Design every graded movement in the sagittal or frontal
  plane.
- **Units (critical for this product):** never use absolute pixels. Define a body-unit scale
  (median hip-to-ankle landmark distance captured during a calibration stance) and express all
  distances and velocities in body units; angles in degrees. Camera distance varies between
  sessions, and the product's entire payload is **longitudinal trends** — between-session
  setup variance is the #1 measurement threat. The framing/placement flow ("stand where you
  stood last time — you're framed") is measurement hygiene, not just UX.
- **Rise velocity** (the headline metric, a leg-power proxy): vertical velocity of the
  smoothed hip midpoint during the concentric phase of a chair stand, in body units/sec;
  record per-rep mean and peak, and the session mean. At 30fps a rise spans ~25–45 frames;
  per-rep values jitter but the session mean over 10+ reps is robust.
- **Lighting:** warm/dim domestic evening lighting degrades detection well before it looks
  dark to a human. Build a pre-flight check (sample detection confidence + landmark stability
  for ~2 s; if poor, voice prompt: "turn on the main light").
- **Hot path rules (30fps):** the per-frame update path must be pure, synchronous,
  allocation-free — mutate pre-allocated structures, use refs, `.push()` not spread. Throttle
  UI state updates to ~10fps. Keep heavy work (landmark parse/smooth/grade) out of React.
  *(2026-06-15: the New Architecture (Fabric) is enabled, and `setNativeProps` is a no-op for
  react-native-svg there — the skeleton/figure renderer can't poke `d` imperatively. It now
  drives its 3 path strings via THROTTLED React state isolated to SkeletonView (~25fps); the
  pipeline still runs off React. Reanimated, the fully-imperative alternative, stays banned. See
  docs/decisions.md.)*

## Architecture requirements (proven pattern — replicate it)

- **Registry pattern:** one `MovementDefinition` per file (id, display name, camera-view spec,
  grading config, voice script, progression/regression links, equipment tag), all internals
  module-private, registered in a central registry. Screens are movement-agnostic; adding a
  movement never touches player code.
- **Four grading archetypes as shared primitives** — every assessment and exercise composes
  these; build them once, test them hard:
  1. `RepCycleTracker` — angle-threshold cycles with hysteresis + smoothing (chair stands,
     push-ups, curls…)
  2. `HoldTracker` — timed hold with configurable termination conditions (balance: raised-foot
     touchdown via ankle-landmark separation/height; plus sway proxy = SD of pelvis-midpoint x
     in body units)
  3. `TimedTaskTracker` — state machine with start-pose, phase transitions, end-pose,
     wall-clock per phase (TUG, floor get-up)
  4. `MaxRomTracker` — peak angle/distance capture per session (shoulder flexion, hinge reach)

  Plus a `RepVelocity` derivative layered on RepCycleTracker.
- **Record/replay from day one (non-negotiable):** a dev-mode recorder writing timestamped
  landmark frames to JSONL, and a headless replay harness that feeds recordings through the
  full pipeline and asserts outputs (rep counts, hold durations, velocities). This is how
  thresholds get tuned and regressions get caught without a human performing chair stands at
  every code change. It was essential on the previous project; build it in Stage 1, not later.
- **Audio:** pre-generate and bundle voice lines as audio files (one-time TTS generation is
  fine); do not depend on runtime TTS APIs in the session path (latency + failure modes). One
  voice line at a time; if busy, drop lower-priority lines rather than queueing stale ones.
  iOS audio mode: MixWithOthers-equivalent interruption mode, recording disabled — **audio
  configuration must never interrupt the camera session** (this caused real production pain).
- **Data:** local-first for V1. Results/history, programme state, health context, Everyday Clarity,
  and landmark recordings remain local and schema-versioned (recordings behind a dev toggle).
  Optional Supabase authentication and owner-only online profiles may store only Product Law 10's
  non-health allowlist; RLS and self-service account deletion are required.

## Platform learnings (React Native / Expo — apply with judgment to current versions)

Use the **latest stable Expo SDK** and current RN — research what's current before pinning; do
not blindly inherit these pins. But know the history:

- On RN 0.79.x, a `jsinspector-modern` bug (`LOG(FATAL)` on WebSocket reconnection) crashed
  iOS debug builds under Hermes; the workaround was JSC on iOS + testing in Release. **Check
  whether your RN version has the upstream fix; verify iOS debug-build stability on a real
  device in week one**, and if you hit it, switch iOS to JSC and test Release.
- Config files (`app.config.js`, `babel.config.js`, `metro.config.js`): CommonJS only.
- If any chance of JSC: no `btoa`/`atob`, and `FileReader.readAsDataURL` hangs on binary
  blobs — use `arrayBuffer()` + pure-JS base64.
- Animations: core `Animated` only. Reanimated caused iOS crashes in the predecessor and was
  removed; do not add it without explicit approval.
- Never add a native dependency that isn't imported in code; verify autolinking + a clean
  prebuild after each native dep; `npx tsc --noEmit` and `npx expo config` must always pass;
  debug overlays behind `__DEV__`.
- Iterate primarily on an Android device (fastest loop), verify iOS regularly including
  Release mode. Both platforms must work.

## Official Pearl MVP check-up

The repeated physical protocol's frozen serialized identifier is
`pearl_monthly_strength_balance_v1`; that token is retained only so existing records remain
comparable and does not define the product cadence. It runs at baseline, week 4, week 8, and
week 12. The protocol is voice-guided with the phone propped around hip height and consists of:

1. **A fixed one-minute warm-up** — not measured; the same preparation improves comparability.
2. **One-leg balance** — front view, one anchored standing side, eyes open, timed to valid
   touchdown or the protocol ceiling; support stays within reach.
3. **30-second chair stand** — side view, repetitions plus rise-velocity evidence where the
   live protocol supports it; maximal effort comes last.

Only Strength and Balance determine the next phase's prescription. Historical full-battery
machinery (Timed Up and Go, shoulder flexion, hinge reach, balance ladders, Mobility evidence)
may remain as versioned compatibility and research infrastructure, but it is not the official
MVP journey and must not leak into current product framing.

After the physical battery, the live MVP offers the optional complete Everyday Clarity
self-report with sleep and symptom context. The matched solo/rest/dual task is a release-gated
instrument, not a shipped promise. Verbal fluency is not an MVP surface.

Published references must be cited and fingerprinted. Female reference data covering the
target ages is preferred. Where evidence is unavailable, Pearl shows raw personal evidence or
suppresses the comparison; it never invents precision or converts results into a “movement
age.” Personal change is only stated when protocol comparability and measurement evidence
permit it.

## MVP non-goals (do not build or resurrect)

- A general longevity or “body-age” product for all adults.
- A male/general-adult acquisition experience; compatibility support is not positioning.
- Composite movement age, brain age, Clarity score, diagnosis, treatment, or causal claims.
- Camera-based daily form coaching, rep-by-rep critique, or the retired conductor surface.
- The historical full movement battery as the default official journey.
- Verbal fluency, impact/bone programming, pelvic-floor treatment, or GLP-1 modes before their
  separate evidence and product decisions.
- Programme, check-up, Clarity, or health-data sync. Optional non-health online profiles may be
  presented only when sign-up, sign-in, restore/conflict handling, RLS, truthful privacy copy,
  sign-out, and self-service account deletion work end to end.
- Payments, push notifications, social features, PDF reports, passive monitoring, or a Learn
  content library.
- Rotation-graded movements (except explicitly approved neck-yaw research), floor-pose form
  grading, or any learned form-quality model.

**Clara is Pearl's sole trainer voice and the default.** Her lines are synthesized once at build
time with ElevenLabs Multilingual v2 by `scripts/generate-audio.ts` and bundled under
`assets/audio/voice/clara/`; runtime sessions never call ElevenLabs or any cloud TTS. The
generation key is environment-only and never committed.

## Working agreements

Incremental commits per milestone with clear messages. Ask before adding heavy dependencies or
deviating from the architecture above. When a pose-detection behavior surprises you, capture a
landmark recording of it and add a replay test before fixing. Maintain a `docs/decisions.md`
log of significant choices.
