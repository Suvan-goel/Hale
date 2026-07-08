# PROJECT CONTEXT — Hale (V1)

> This file is the project's source of truth for product rules, pose-detection knowledge, and
> architecture. Future sessions depend on it. Do not delete content; update carefully.
> Significant decisions are logged in `docs/decisions.md`.

## What we are building

A consumer mobile app for adults ~45–65 that measures how their body is aging — strength,
balance, mobility — using only the phone camera, then delivers voice-guided home training
targeting their weakest domain. Core loop: monthly camera-graded "Movement Check-Up"
(validated clinical tests: 30-second chair stand with per-rep rise velocity, balance holds,
Timed Up and Go, shoulder flexion peak, hinge reach) → per-domain "ages" vs published norms →
4-week training block → re-test. The camera is a **measuring instrument, never a form judge**.
Strategic frame: CV is the sensor; adherence is the product. The founder team previously built
a gym form-feedback app (Forma) on MediaPipe + React Native; this context distills a year of
its hard-won pose-detection and architecture knowledge. You have none of that code — these
notes are the transfer.

*(2026-07-05 repositioning — menopause reframe, Phase 1: the target user is now **women
~40–60 in perimenopause and menopause**, positioned around menopausal muscle loss and
fall/fracture-relevant functional decline. The measurement engine is unchanged — the live V2
battery already compares by age + sex via published sources (Warden 2022 sex-specific 30s STS
percentiles 18–80, Gill 2020 shoulder IQR by sex, Springer 2007 balance benchmarks). What
changed is the copy layer: the V2 result is presented as the "Strength Profile" (the spoken
noun "Movement Check-Up" is unchanged — bundled audio says it), Welcome leads with the
menopause strength narrative, and the profile gains an optional `menopauseStage` field
(perimenopausal / postmenopausal / neither-or-unsure / prefer-not-to-say, asked only for the
female reference group) that shapes **copy and content only, never measurements** — no
reference source is stage-stratified, so scoring stays keyed to age + referenceSex. Hard
claim red lines, enforced by `copyGuardrails.test.ts`: never claim to measure/estimate bone
density or hormones, no fracture-risk/osteoporosis language, no HRT or menopause-treatment
claims — Hale measures functional strength/balance/mobility, nothing else. Men remain fully
supported (male norms intact); the positioning, not the product, is women-first. The rename,
impact-loading programming, GLP-1 sub-mode, and any composite score are deliberately deferred
pending positioning validation. See docs/decisions.md.)*

*(2026-07-05 direction — voice-guided sessions: v1 daily training sessions use NO camera.
The app speaks instructions and the user answers with a tiny voice vocabulary ("I'm ready" /
"done" / skip / repeat / pause / resume — on-device recognition only, windowed listening,
never while the app speaks, tap parity for every command) or taps. The camera remains the
measurement instrument — Movement Check-Up and micro-checks unchanged. The camera-conducted
session mode ("conductor") is parked as v2 behind a feature flag, nothing deleted; promotion
trigger is churn-location telemetry. Reps in voice sessions are REPORTED (prescribed target
confirmed on "done", adjustable on the rest screen), never presented as measured. Design of
record: TDD.md (v2 conductor) + TDD-ADDENDUM.md (approved v1). See docs/decisions.md.)*

*(2026-07-06 direction — programme engine v2: the five-pattern exercise-ladder engine and
screening-first onboarding (docs/specs/exercise-ladders-spec.md + onboarding-spec.md, read
with their v0.3 changelog annotations) are being built as a REPLACEMENT programming layer in
`src/programme`, flag-gated (`EXPO_PUBLIC_ENABLE_PROGRAMME_ENGINE_V2`, audited unsafe for
beta/release) alongside the existing engine, which keeps shipping until promotion — nothing
deleted before then. Rulings of record (docs/decisions.md): the Impact bone-finisher track,
the B2 bone-screening questions, and the osteoporosis hard gate are deferred AS A PACKAGE —
so **v1 ships ZERO hard gates**, acceptable only because v1 content is uniformly low-risk
(programme-wide spinal-flexion ban enforced by test, no impact loading, conservative starts);
**clinical review must bless this before launch**, and the zero-count is pinned by test.
Gateway levels are TEACH-ONLY (demo + logged rehearsal exposures + self-confirmation) — the
camera-never-judges-form law is unchanged. Promotion is an adherence/effort decision over
REPORTED data (effort = existing RPE 1–5 mapped to lots/a-few/none); camera check-ups are the
measured reconciliation point. Programme health flags are LOCAL-ONLY — excluded from Supabase
backup shapes, pinned by a structural test. first_session_started is the onboarding success
metric, local telemetry only.)*

*(2026-07-08 — PROMOTED: programme engine v2 IS the app. After the five-phase promotion
integration (the v2 logic wearing the established design language: merged screening
onboarding with step-wise back, Check-up #0 as the check-up of record, voice sessions on
the production player, four-tab shell with Progress/Explore/Settings, auth-scoped storage
with guest adoption) and the founder's device pass (informal declaration; the formal spike
evidence rules for BETA are unchanged), the flag `EXPO_PUBLIC_ENABLE_PROGRAMME_ENGINE_V2`
was RETIRED and ProgrammeV2Root became the unconditional app root. The old engine's shell
(AppGate, blocks, micro-check scheduling, old onboarding staging, PlanScreen, the old
WelcomeScreen and session-flow screens) was DELETED the same day by promotion commit 2;
the KEEP list held (registry, voice player, unified check-up machinery + results screens,
measurement stack, backup services, stateless preset generation for Explore, and the
parked conductor surface TrainingSessionScreen — "nothing deleted" ruling). App.tsx is now
a slim root (font/auth/recovery gates + status-bar chrome); the audio-before-camera
configuration and Android nav-bar immersion moved into the v2 shell. Known post-promotion
gaps, recorded in decisions.md: remote backup/restore launch sync is not yet wired into
the v2 shell (sign-in scopes storage and adopts guest data locally), and the Clarity
surfaces lost their mount — both re-enter with pre-beta work. Beta gates are
unchanged by promotion: clinical review of the zero-hard-gates posture, the formal voice
trial matrix, and the noise-floor real-data run all still stand between here and beta.
See docs/decisions.md.)*

## Product laws (non-negotiable design rules, validated in user interviews)

1. **Never show self-view camera video.** Render a clean skeleton; users this age want presence
   without a mirror. *(2026-06-15: the privacy core — never show video — is unchanged. The
   backdrop is the design-system `bg-base` canvas with a contrasting filled figure; the native
   `PoseDetectionView` background is held in sync on both platforms. The app's visual identity
   was redesigned 2026-06-16 to a warm premium longevity system inspired by consumer wellness
   dashboards; on 2026-06-19 the colour system was strengthened to a mature premium
   warm-stone + inky-green palette — `bgBase #F4EDE6`, borderless soft-ivory cards/surfaces `#FBF5EF`
   surfaces, green buttons and accent surfaces unified to `#414C34`,
   transparent soft fills with stone outlines, text `#111412/#68706A/#8A908A`, stone borders
   `#E4E0D6/#D8D3C8`, restrained `#A98243` milestone accents, and an inky green figure gradient.
   All tokens live in `src/theme`; no screen hardcodes colour. See docs/decisions.md.)*
2. **Audio-first.** Voice guides everything; after propping the phone, the user never touches
   the screen until the session ends. Auto-start when framed, auto-advance between items, rest
   timers spoken.
3. **Silence by default.** The camera speaks only on high-confidence findings. No rep-by-rep
   form critique, ever — one false positive kills trust permanently. High precision, low
   recall, or nothing.
4. **No medical claims.** Wellness-side language only. "Movement age," never "fall-risk
   diagnosis." Domain ages lead; any composite score is secondary garnish.
5. **No gamification** (streak-shaming, badges, social feeds). This demographic responds to
   evidence and routine.
6. **Zero-equipment start.** Chair, wall, floor, bottom stair, cushion. Every exercise must
   have a zero-equipment regression so a missing item substitutes, never blocks.

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
  *(2026-07-05 scoped amendment: a recording-capable audio session is permitted ONLY inside
  voice-guided training sessions — no camera runs there — owned by the voice-commands native
  module and restored to playback-only on exit. Camera flows (check-up, micro-check) never
  see a recording session and never initialize the voice module. Windowed listening only;
  no audio and no transcripts are ever stored — production emits intent events only.)*
  *(2026-07-06 second scoped amendment — clarity instruments, founder sign-off: a
  recording-capable session MAY additionally exist inside the official check-up ONLY during
  the dual-task run (voice-activity detection — speech presence, never content) and the
  fluency segment (per-use consented on-device transcription, count-only retention),
  activated after movement setup confirms and restored to playback-only immediately after
  the run. Command/safety-word listening in camera flows remains forbidden. HARD GATE:
  device Block 7.4 camera+mic coexistence — unreliable coexistence on the target device
  means the instrument ships `unavailable`, never flaky. See docs/decisions.md.)*
- **Data:** local-first. The app runs fully on-device with no account (guest-first launch,
  2026-07-04); results/history live in a schema-versioned JSON store. Landmark recordings stay
  behind a dev toggle. *(Amendment history: the original V1 rule was "local-only, no accounts,
  no backend". A product-owner-directed Supabase backend was added 2026-06-17 for optional
  sign-in — backup/restore/sync of the same local state — and on 2026-07-04 the sign-in
  requirement was removed from launch: an account is optional, offered in Settings as backup.
  When a user first signs in on a device with guest data, the guest files are adopted (moved)
  into the account scope and synced up. Nothing in the measurement or session path depends on
  the network.)*

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

## Assessment battery — protocols and scoring (V1)

All voice-guided, phone propped at ~hip height, user 2.5–3.2 m away. Norms: encode published
reference tables with sources cited in code comments — Rikli & Jones Senior Fitness Test norms
(30s chair stand, ages 60–94), Bohannon reference values (single-leg stance across adult ages;
TUG meta-analysis norms). For ages 45–59 where tables thin out, use published reference
equations where available and **label extrapolated bands as estimates** in both code and UI.
Output per-domain results (Strength/Power, Balance, Mobility) as "typical of age X" ranges,
never false precision.

1. **30-second chair stand** (side view): reps + per-rep rise velocity (body units/s) +
   session mean. Detect hand-push-off on thighs only as a logged flag, not a user-facing
   critique.
2. **Balance ladder** (front view): feet-together → semi-tandem → tandem → single-leg, eyes
   open then closed (voice-confirmed). Timed to termination (raised-foot touchdown); record
   sway proxy. Safety script: fingertips near a counter.
3. **Timed Up and Go** (side-lateral framing so the 3 m walk path crosses the frame): timed
   from seat-off to re-seated, turn detected via hip-x velocity reversal. If the room can't
   fit it, offer a short-path variant and flag results as non-standard.
4. **Shoulder flexion peak** (side view): standing straight-arm forward raise, peak
   upper-arm-to-trunk angle via MaxRomTracker.
5. **Hinge reach** (side view): standing forward fold, wrist-to-floor distance in body units
   at max.

## V1 non-goals (do not build)

Accounts/backend/sync, payments, push notifications, ML/learned form feedback, social
features, PDF reports, passive monitoring, rotation-graded movements (except neck yaw),
floor-pose grading beyond bridge, any form-quality critique.

**2026-06-15 — product-owner-directed exceptions (prototype scope only):** a Home/Settings
**local profile** (name/age/goal; not an account requirement — sign-in is optional backup), and
an **Explore** tab of bundled articles and extra practice sessions. *(2026-07-04 simplification:
the earlier Family-tab mock and its headless support-circle services were deleted, the
never-functional workout-reminder toggle was removed — reminders return only as a real
local-notification feature if the 2026-07-03 proposal is approved — and Explore was trimmed to
Learn + Sessions.)* The trainer-voice picker offers two voices — **Clara** (female) and
**Marcus** (male) — whose lines are synthesized once at build time via the **ElevenLabs API
(Multilingual v2 model, `mp3_44100_128` output)** by `scripts/generate-audio.ts` and bundled per voice under
`assets/audio/voice/<voiceId>/`; nothing in the session path ever calls ElevenLabs at runtime
(the no-runtime-TTS audio law is unchanged). The `ELEVENLABS_API_KEY` is read from the
environment at generation time and never committed; each voice's ElevenLabs voice id lives in
`src/profile/voices.ts`. See docs/decisions.md.

## Working agreements

Incremental commits per milestone with clear messages. Ask before adding heavy dependencies or
deviating from the architecture above. When a pose-detection behavior surprises you, capture a
landmark recording of it and add a replay test before fixing. Maintain a `docs/decisions.md`
log of significant choices.
