# Decision log

Significant choices, newest last. Each entry: date, decision, why, alternatives rejected.

## 2026-06-12 — Stage 1 kickoff

- **Expo SDK 56 (latest stable at time of scaffold)**, TypeScript strict, `blank-typescript`
  template (no expo-router — V1 is a small number of screens; plain navigation keeps the
  frame path simple and avoids a dependency we don't need yet).
- **Continuous Native Generation (CNG):** `android/` and `ios/` are gitignored and produced by
  `npx expo prebuild`. The only native code we own lives in `modules/expo-pose-detection`.
- **MediaPipe model binaries are not committed.** `scripts/download-models.sh` fetches
  `pose_landmarker_lite.task` into the module's Android assets and iOS resources. Run it once
  after clone, before prebuild.
- **Pipeline is pure TS with zero React/Expo imports** (`src/pose/`), so the identical code
  runs on-device and in the headless replay CLI / Jest. This is what makes record/replay
  deterministic.
- **VIDEO running mode** (synchronous `detectForVideo`/`detect(videoFrame:)` on the camera
  analysis thread) with monotonic timestamps, per the transferred Forma learnings — not
  LIVE_STREAM mode.

## 2026-06-12 — Stage 1 implementation notes

- **react-native-svg (15.15.4) added** for the skeleton renderer. Rationale: one
  `setNativeProps({d})` call per path per frame (3 calls/frame total) beats 50+ positioned
  Views, and core `Animated` can't drive arbitrary path geometry. It's the lightest viable
  option given Reanimated is banned. Flagging per the "ask before heavy dependencies"
  agreement — swap out if vetoed.
- **tsx (dev-only)** runs the replay CLI and fixture generator directly from TS.
- **Native deps pinned:** MediaPipe `tasks-vision:0.10.35`, CameraX `1.6.1` (latest stable on
  Google Maven at setup time), `MediaPipeTasksVision ~> 0.10` pod.
- **Android lifecycle:** RN 0.85's dependency tree resolves the *Java* androidx.lifecycle API —
  `PoseDetectionView` overrides `getLifecycle()` and drives `LifecycleRegistry` via
  `handleLifecycleEvent` (the `currentState` setter doesn't exist there). If a future RN bumps
  to the Kotlin lifecycle API, this must flip to `override val lifecycle`.
- **Landmark event payload** is a flat 165-double array + timestamp; an **empty array still
  emits** per frame — the pipeline needs frame continuity to drive subject-gone detection.
- **Coordinates:** normalized [0..1], upright portrait, unmirrored on both platforms
  (Android rotates via MediaPipe `ImageProcessingOptions`, iOS rotates the capture
  connection). Front-camera mirroring is applied only in the renderer.
- **Camera analysis at 640×480** — the lite model downscales to 256px internally; higher
  capture resolution buys nothing but battery drain.
- **Fixture policy:** synthetic recordings + `.expected.json` summaries are committed and
  regenerated only via `npm run fixtures`; the diff is reviewed like code. Real device
  recordings get added as fixtures when behaviors surprise us (working agreement).
- **Pre-flight overlaps pipeline warmup** intentionally: warmup gates *counting*, not framing
  guidance. Lighting check measures jitter on the RAW frame (smoothing hides the signal).
- **Test-driven pipeline fixes:** chain reliability ramps over its window (no instant trust on
  frame 1); subject validity needs only 4 visible core landmarks (side views must stay
  valid); calibration stillness gate uses EMA'd hip speed (raw jitter was resetting it).
- **jest-expo:** don't override `transformIgnorePatterns` — the preset's default is what
  transforms expo-modules-core; overriding it breaks the test bootstrap.
- **Model binaries not committed** (5.7MB each, regenerable): `scripts/download-models.sh`
  must run after clone and before prebuild, or the app throws `model-not-bundled` at runtime.
- **APK model compression (caught in verification):** AGP Deflate-compresses `.task` assets by
  default and library-level `androidResources.noCompress` does NOT govern final APK packaging —
  MediaPipe mmaps models, so this breaks at runtime. Fixed with a config plugin
  (`modules/expo-pose-detection/app.plugin.js`) that injects `noCompress += ["task","tflite"]`
  into the generated app build.gradle; verified by `unzip -v` showing `Stored` for the asset.
  This is the predicted "MediaPipe gradle quirk" — the budget for it was real.

## 2026-06-13 — Stage 2: grading engine, chair stand, voice flow, noise floor

- **Grading primitives are signal-agnostic scalars.** The four archetypes (+RepVelocity)
  consume scalar signals (knee angle, hip height, hold booleans), not frames; movement
  definitions own landmark→signal extraction. Keeps the primitives reusable across all five
  assessment items and trivially unit-testable. Rejected: frame-consuming trackers (would
  couple every archetype to landmark layout).
- **Rep crediting = hysteresis commit at the TOP (down→up), re-arm at the bottom.** A rise
  that stalls between thresholds is an explicit `ascent-abort` (partial rises never count).
  `resetState()` re-anchors to 'unknown' on subject-gone, keeping credited reps — re-entry
  can't double-count (the Forma lesson, now load-bearing in tests).
- **Rise velocity uses the NEAR-SIDE hip, not the hip midpoint.** CLAUDE.md says "hip
  midpoint", but in a side view the far hip is occlusion garbage and would poison the
  midpoint. Same proxy semantics (vertical pelvis motion), more robust side-on; side
  selection is sticky while a rep is in flight so the signal can't hop sides mid-rise.
  Velocity is displacement/duration over the hysteresis-bounded concentric window — for the
  trend product, a *consistent* window beats a *complete* one.
- **Chair-stand thresholds:** knee angle up-enter 155° / down-enter 110° (seated ≈90°,
  standing ≈175°); tune only via replay recordings. Push-off = wrist within 0.15 bu of the
  hip→knee segment for ≥50% of rise frames — logged per rep, never voiced (product law 3).
- **expo-audio added** (SDK 56 canonical audio module) for bundled playback. Audio mode:
  `mixWithOthers` + recording disabled, configured at app start BEFORE the camera mounts —
  audio config must never interrupt the camera session. Voice channel plays one line at a
  time and DROPS lower-priority lines when busy (no stale queue); rep chime is a separate
  SFX channel.
- **Voice lines are committed assets** (~900 KB: 58 lines + chime), generated by
  `npm run audio` via macOS `say` (Samantha) + `afconvert`. Numbers 0–40 are bundled as
  separate words and results are stitched ("You completed" + "twelve" + "chair stands").
  Production voice = regenerate the same filenames with a pro TTS; the manifest
  (`src/audio/manifest.ts`) is generated to keep require() calls static for Metro.
- **Session controller is pure TS** driven by frame timestamps + a `voiceBusy` input from
  the player, so the entire voice-guided flow (preflight prompts → auto-start → countdown →
  30s window → spoken result) replays deterministically in Jest. The screen only plays cues
  and mirrors state at 10fps.
- **Noise-floor experiment** (docs/noise-floor-report.md): synthetic setup-variance dry run
  (same body, identical true velocity, varied distance/angle/placement/jitter) measures the
  chain's own contribution at **0.44% CV** vs **10.9% unnormalized** — body-unit
  normalization is load-bearing and now guarded by a regression test (CV ≤ 2%, ≥5× better
  than raw). Real-person recordings are still required for the go/no-go; protocol + pull/
  analysis tooling are in place (`scripts/pull-recordings.sh`, `npm run noise-floor`).
- **Synthetic chair-stand generator drives hip height, not joint angles** (two-link IK
  derives the knee angle), so true hip velocity is piecewise-linear and known exactly —
  that's what makes "velocity within tolerance" assertions honest.

## 2026-06-14 — Stage 3 M6: wire the Check-Up flow into the app

- **Integration milestone, not new logic.** The battery orchestrator, the five definitions,
  norms/scoring, history, and both `CheckUpScreen`/`ResultsScreen` already existed and were
  unit-tested (M1–M5); they were just never reachable. M6 adds only the glue: a `HomeScreen`,
  an App-level screen state machine, and the `HistoryStore` instantiation. No grading or
  scoring code was touched or duplicated.
- **Plain App-level navigation, no router** (consistent with the Stage 1 decision to skip
  expo-router). `App.tsx` holds a 5-state `Screen` union (`home` → `checkup` → `results`, plus
  `dev-assessment`/`dev-live` behind `__DEV__`). The Stage 2 single-chair-stand screen and the
  live dev view are preserved as dev-only entries rather than deleted — they remain the fastest
  way to exercise one item / the raw pipeline.
- **Home mounts no camera.** Making `home` the default (not the assessment screen) means a cold
  launch renders a stable UI without touching MediaPipe — the camera mounts only when the user
  begins a check-up. Convenient side effect: the app no longer hits the emulator's MediaPipe
  GPU-inference crash just by opening (the emulator still can't run an actual check-up — that
  needs a real device).
- **Persist-then-reload feeds trends.** On completion `App` calls `store.save(checkUp)`
  synchronously, navigates to `ResultsScreen` with the raw `checkUp` (drives the current
  domain cards), and reloads `loadAll()` into `history` (drives the trend sparklines, now
  including the just-saved point). The results screen reads the current score from the live
  `checkUp` and trends from `history`, so a brief reload race can only delay a sparkline, never
  the headline.
- **`HistoryStore` is constructed with `expoHistoryFs`** (the only place the native
  expo-file-system adapter enters app code — pure modules and tests still use `createMemoryFs`).
  The wired seam (finished CheckUp → save → loadAll across a restart → score + trends, including
  the skip/unmeasured + NaN→null round-trip) is guarded by a new integration test
  (`src/checkup/__tests__/checkupFlow.integration.test.ts`); 148 tests pass, typecheck clean,
  full Android bundle compiles. End-to-end on-device run of the battery still pending a physical
  device (emulator MediaPipe limitation).

## 2026-06-14 — Stage 4: training sessions (the loop closes)

- **Training exercises got a PARALLEL registry, not an overload of `MovementDefinition`.**
  `src/exercises/` (`ExerciseDefinition` + registry) mirrors the assessment movement pattern but
  is its own thing because training has a different lifecycle: multi-set with spoken rest,
  velocity autoregulation, and a progression ladder. It **reuses the four grading primitives**
  and the shared `CameraViewSpec`/`EquipmentTag`/`GraderVoice` types — no measurement logic is
  duplicated. `src/training/` holds the orchestration (player, progression, block, micro-check,
  store). Rejected: bolting sets/levels onto the assessment `MovementDefinition` (would bloat the
  one-shot measurement path that the check-up depends on).
- **One family per file (not strictly one definition per file).** A ladder (cushion → standard →
  slow-eccentric → power STS) is naturally one item with linked levels; each level still
  `registerExercise()`s individually and carries `progressionId`/`regressionId`. A catalog test
  enforces ladder integrity (contiguous levels, symmetric links, links resolve).
- **Three set-grader bases compose the primitives** (`RepsSetGrader`=RepVelocity, `HoldSetGrader`,
  `RomSetGrader`); each exercise file supplies only a thin landmark→signal config (which joint
  cycles, which landmark rises). Near-side selection + the subject-gone reset discipline are
  lifted verbatim from the chair-stand grader. Deep replay coverage lives on the knee/hip-driven
  rep path (the chair-stand synthetic is the workhorse); the other per-exercise landmark choices
  are validated structurally (registry/links/construction) and await on-device tuning — the same
  depth distribution as the assessment side.
- **Velocity autoregulation is the leg-power-aware "stop the set":** >25% below the SET'S OWN
  best for 2 consecutive reps ends the set, voiced "good, that's your set" and logged as a NORMAL
  completion (never a failure). It's a pure scalar `VelocityAutoregulator` composed into
  `RepsSetGrader` and proven end-to-end through the player on a real decaying-velocity recording.
- **Progression is deterministic rules, no ML** (V1 non-goal): promote on full completion + no
  autoregulation + velocity ≥ personal trend (first time, no trend → completion alone promotes);
  demote on a genuine struggle or *early* autoregulation; hold otherwise (including a normal late
  autoregulation stop, and any unmeasured/skipped session — we never demote on a tracking
  failure). Levels clamp to the family ladder; velocity trend = rolling per-exercise mean.
- **Block stores SLOTS, resolves levels at LAUNCH.** A 12-session 4-week block keeps a fixed
  ~20-min slot template; the player resolves slot → family's *current* level (from
  `ProgressionState`) + equipment substitution each session, so progression stays live across the
  block. Bias = the weak domain's primary slot leads and the finisher targets it. Confirmed
  product decision: a small **local equipment profile** (chair/wall/floor/cushion assumed;
  `stair`/`band` toggles) drives substitution deterministically — no per-session prompts (keeps
  audio-first/no-touch intact). No-stair → step-up becomes power sit-to-stand (the "one
  auto-substitution" acceptance); no-band → press becomes reach.
- **The re-test "schedule" is an in-app marker, not an OS notification** (push notifications are a
  V1 non-goal): completing all 12 sessions stamps `retestDueAt`, which Home surfaces as "time to
  re-test". The weekly **micro-check** (5 fast chair stands → rise velocity, or a single-leg hold)
  reuses the set graders and feeds the EXISTING trend keys via an optional `extra` arg on
  `computeTrends` (history stays decoupled from training via a structural `ExtraTrendPoint`).
- **Persistence mirrors the history store:** schema-versioned `TrainingStore` over the same
  injectable `HistoryFs` — one mutable `training-state.json` + an append-only micro-check log,
  NaN→null round-trip, forward-compatible version skipping. 201 tests pass, typecheck + expo
  config clean. The acceptance pieces that are testable headless are covered (full-session replay
  with one autoregulation trigger + one equipment substitution, progression promote/demote, block
  completion → re-test, fresh-user check-up→block→session with no dead ends); the **hands-free
  on-device 20-minute run remains the open frontier** — the emulator can't run MediaPipe, so it
  needs a physical device, consistent with Stage 3.

## 2026-06-15 — Visual redesign + navigation rework (product-owner directed)

- **Warm "sandstone" design system, single source of truth.** Replaced the ad-hoc dark
  green-on-black inline styles with one token module (`src/theme`): warm cream palette, espresso
  text, terracotta/clay accents, Fraunces (serif headings) + Inter (body) via bundled
  `@expo-google-fonts/*` (new deps; loaded with `useFonts`), a restrained type scale (body ≥17px),
  soft warm shadows + hairline borders, pill/rounded radii, ≥44–48px tap targets. Every screen now
  references tokens; no hardcoded hex remain in app source.
- **Skeleton is now dark-on-cream (Law 1 backdrop overridden by product owner).** Law 1's privacy
  core — *never show camera video* — is fully intact (still a skeleton, never a preview), but the
  backdrop changed from black to bg-base cream with a dark espresso skeleton. Required flipping the
  native `PoseDetectionView` background constant on **both** iOS (Swift) and Android (Kotlin) — kept
  in sync with the `#F4ECDD` token. Needs a fresh prebuild to take effect; **unverified on-device**.
- **Tab navigation (Home · Learn · Family · Settings) via a lightweight custom `TabBar`,** not a nav
  library — consistent with the 2026-06-12 "no expo-router, plain navigation" decision. App.tsx now
  separates bottom *tabs* from full-screen *flows* (check-up/training/micro-check/dev), which hide
  the bar. Outline SVG icons via the existing react-native-svg.
- **Three requested features were documented V1 non-goals; surfaced to the owner, who chose
  prototype-grade scope (no architecture reversal):**
  - **Family page** (social + accounts/backend, all non-goals) → built as a **local mock**
    (`src/family/fixture.ts`), supportive tone, no leaderboard (Law 5), with an in-UI "preview /
    sharing is opt-in later" note. No network, fully reversible.
  - **Workout reminders** (push = non-goal; the re-test marker is deliberately "never an OS
    notification") → **stored preference + toggle only**, no `expo-notifications`, no scheduling
    yet; copy stays gentle (Law 5). Real local delivery deferred.
  - **Home "profile details"** (no profile/account model existed) → **lightweight local profile**
    (name/age/goal) in a new schema-versioned `ProfileStore` over the shared `HistoryFs`, edited in
    Settings. Still no backend/accounts.
- **Trainer-voice picker scaffolded, one real voice.** Voice lines are bundled per-voice audio
  sets; only the default ("Calm") has assets, others show "coming soon". Preference is stored;
  swapping the active manifest is the remaining seam (VoiceChannel untouched to keep the audio hot
  path safe).
- **Learn tab** ships bundled longevity articles (`src/learn/articles.ts`), wellness-side language
  only (Law 4). 208 tests pass (added preferences serialize/store round-trip), typecheck + expo
  config clean.

## 2026-06-15 — Mannequin figure + Fabric-safe skeleton rendering

- **The skeleton is now a filled, rounded FIGURE, not stick lines.** `skeletonGeometry`
  builds capsules (stadiums) for limbs/feet, a three-capsule torso (shoulder bar + hip bar +
  spine trunk) and an ellipse head; drawn in one fill colour the overlapping shapes union into a
  single silhouette. Limb widths scale off a per-frame shoulder-to-hip reference so proportions
  hold at any camera distance. Reliability gating preserved (occluded chains fill dim). A dev
  preview (`npm run skeleton-preview`, gitignored output) renders it to SVG without a device.
- **setNativeProps doesn't work for react-native-svg under the New Architecture (Fabric), which
  is enabled here (RN 0.85, newArchEnabled=true).** The original SkeletonView poked path `d`
  strings via `setNativeProps` for zero React re-renders — but on Fabric that's a no-op, so the
  figure never drew (latent since Stage 1; only surfaced now because the emulator can't run
  MediaPipe and this was the first live render). **Fix:** SkeletonView drives the three `d` props
  through React state, throttled to ~25fps (`DRAW_INTERVAL_MS`) and isolated to that small
  component. The heavy per-frame pipeline work still runs off React in the screen's onLandmarks;
  only the three path strings re-render. Reanimated (the usual fully-imperative route) stays
  banned. This refines the CLAUDE.md "keep React render cycles out of the frame path" rule: that
  was a Paper/setNativeProps assumption; on Fabric a throttled, isolated SVG re-render is the
  correct approach. **Still unverified on a physical device** (no device available in this
  session); if the figure still doesn't appear, the next suspects are pose-detection/lighting or
  a zero-size layout, not the draw path.

## 2026-06-15 — Android camera rotation fix (figure rendered sideways)

- **Symptom:** on device the filled figure rendered rotated 90° (a standing person drawn
  horizontally), and only intermittently — sometimes appearing when the user turned away. Root
  cause: the Android view relied on `ImageProcessingOptions.setRotationDegrees(rotation)` to make
  MediaPipe rotate `BitmapImageBuilder` input internally, but on-device the output landmarks came
  back in the RAW LANDSCAPE sensor space (the rotation wasn't applied to the normalized results).
  So body length ran along the sensor's width axis → drawn sideways; the malformed proportions
  also tripped the subject-validity gate inconsistently (hence "appears when turned away").
- **Fix:** physically rotate the bitmap to upright with a `Matrix().postRotate(rotationDegrees)`
  before building the MPImage, and drop the `setRotationDegrees` option (use the 2-arg
  `detectForVideo`). Landmarks now arrive genuinely upright and unmirrored; emitted source
  dimensions are the rotated bitmap's. JS mirroring on display is unchanged. iOS was already
  correct (the capture connection physically rotates to portrait). **Requires an Android rebuild
  (`npx expo run:android`)** — native change, not a Metro reload. Unverified on a device in this
  session.

## 2026-06-15 — Figure latency (movement → on-screen lag)

- **Symptom:** noticeable lag between the user moving and the figure moving.
- **Two causes, both fixed in JS (no native rebuild):**
  1. The figure rendered the MEASUREMENT-smoothed frame (One-Euro minCutoff 1.2 — stability-biased
     for rep/velocity accuracy), which adds visible group delay. Fix: the pipeline now also
     produces a `displayFrame` via a second, lighter `DISPLAY_ONE_EURO` smoother (minCutoff 2.6,
     beta 1.5) used for rendering only; the measurement `frame` is untouched, so grading accuracy
     is unchanged. The bold filled silhouette hides the small extra jitter. The display smoother
     resets alongside the measurement one on every interruption (gap / warmup-drop / subject-gone).
  2. SkeletonView throttled redraws to ~25fps (a leftover from the Fabric state-render change).
     Removed the throttle — it now redraws every delivered frame.
- Inherent camera+inference latency (~50–80ms) remains and is unavoidable; if more responsiveness
  is wanted, push `DISPLAY_ONE_EURO` lighter (toward rendering `rawFrame`) at the cost of more
  jitter. 209 tests pass, tsc clean. Unverified on a device this session.

## 2026-06-15 — Design refresh: "refined warm" (cleaner, more deliberate, premium)

- **Goal:** make the app feel cleaner, more professional, modern and premium without abandoning
  the warm sandstone identity (product-owner direction: evolve, don't re-skin to cool/minimal).
- **Root visual issue fixed:** the surface ladder was inverted — cards (`bgSurface #EBE0CC`) sat
  *darker* than the canvas (`bgBase #F4ECDD`), so cards read heavy/muddy. New deliberate
  three-step elevation: cream canvas (`bgBase`, unchanged) → warm near-white raised cards
  (`bgSurface #FFFCF6`) → latte "object" moment (`bgMaterial #E6D6B7`, lightened/cleaned).
  Hairline border softened to `#E7DCC6`. **`bgBase` is held fixed** because it is mirrored in the
  native camera backdrop — changing it would desync JS and native.
- **Type:** added slight negative tracking to the Fraunces display/h1/h2 for a tighter modern
  headline; widened the uppercase eyebrow tracking to 1.4.
- **Form/depth:** card radius 16→20, input 12→14; two shadow tokens now — `soft` (ordinary cards,
  more diffuse) and `lifted` (the one hero card per screen + primary buttons). Pressed states added
  to all buttons/tappable cards (scale 0.99 + accentDeep/opacity).
- **Primitives:** new shared `ScreenHeader` (eyebrow/serif title/subtitle) so every tab opens with
  the same rhythm; Learn/Family/Settings adopt it. Home snapshot and Family stats gained hairline
  dividers for a cleaner tabular read. TabBar got a raised top shadow and a latte pill behind the
  active icon as a clear selected affordance.
- **Scope:** purely presentational — design tokens, `src/components/ui.tsx`, the four tab screens,
  Results, Article, TabBar. No logic, data, or pose-pipeline changes. 209 tests pass, tsc clean.
  Unverified on a physical device this session.

## 2026-06-15 — Trainer voices via ElevenLabs (Flash v2.5), build-time only

- **What:** Replaced the macOS `say`/`afconvert` voice-line generator with the **ElevenLabs
  text-to-speech API** (model `eleven_flash_v2_5`) in `scripts/generate-audio.ts`, and shipped
  **two named trainer voices** — **Clara** (female) and **Marcus** (male). The Settings picker,
  previously cosmetic, now drives playback: the selected `voiceId` threads from prefs →
  CheckUp/Training/MicroCheck screens → `VoiceChannel`.
- **Where the API lives:** generation **only**. The audio law (no runtime TTS in the session
  path — latency + failure modes) is untouched; lines are synthesized once and committed as
  bundled assets. `npm run audio` reads `ELEVENLABS_API_KEY` from the environment (never
  committed); each voice's ElevenLabs voice id lives in `src/profile/voices.ts` (not secret).
- **Asset layout:** per-voice folders `assets/audio/voice/<voiceId>/<key>.mp3` (ElevenLabs emits
  mp3; expo-audio plays it on both platforms). The manifest became
  `VOICE_MANIFEST[voiceId][cue]` with a per-cue fallback to the default voice, so a partially
  generated voice still speaks. The rep-credit chime stays a voice-independent WAV in
  `SFX_MANIFEST`.
- **Interim state:** until `ELEVENLABS_API_KEY` + the two voice ids are supplied and
  `npm run audio` is run, the default voice (Clara) still points at the previously-bundled
  `say` set so the app keeps speaking; Marcus is marked `available: false` (shown "coming
  soon") until its set is generated.
- **Scope:** generator, voices catalog, audio manifest/player, three session screens, App
  wiring, one test fix (default voice id `calm`→`clara`). tsc clean; audio/profile tests pass.
  Not run against the real ElevenLabs API yet (awaiting key + voice ids).

## 2026-06-15 — Figure redesign (premium silhouette)

- The first filled figure read as a toy: flat single-tone fill, thick equal-width capsules
  (balloon limbs), a "snowman" torso of stacked shoulder/hip balls, hard edges, no depth.
- **Redesigned `skeletonGeometry` into a refined human silhouette:** limbs are now TAPERED
  capsules (`taper()` = convex hull of two circles, slim and narrowing toward the extremities);
  the torso is a single smooth shouldered path (`torsoPath()` — shoulders sloping up to a raised
  neck base, curved sides drawn in through a waist, hip line across the bottom), aligned to the
  shoulder→hip axis and symmetric off the centre line (robust + clean on side-on poses); a short
  tapered neck and an ellipse head complete it. All shapes share consistent winding so the
  nonzero fill unions them hole-free.
- **`SkeletonView` fills the body with a soft vertical gradient** (`skeleton.figureTop` →
  `figureBottom`) for a tactile, dimensional object; occluded parts fall to a muted
  `skeleton.dim`. (The gradient tones were re-pitched to ink in the 2026-06-15 visual redesign
  below; the geometry is unchanged.)
- Tuned entirely against the `npm run skeleton-preview` SVG → PNG render (no device needed).
  JS-only — reload picks it up, no rebuild. Geometry test updated for the new shape counts
  (12 bright). 209 tests pass, tsc clean.

## 2026-06-15 — Visual identity redesign (warm "sandstone" → cool editorial "paper & ink")

- **Why:** product owner asked for a cleaner, more professional and modern feel — explicitly an
  Aesop-style editorial look. The previous warm cream/terracotta "sandstone" identity, while
  deliberate, read as softer/warmer than the target.
- **What changed (`src/theme` only — every screen references tokens, nothing hardcodes colour):**
  - **Palette** → neutral "paper & ink": canvas `bgBase #F3F2ED` (was `#F4ECDD`), surfaces
    `#FBFBF9`, the "object" material a soft greige `#E7E5DC`; text near-black ink `#1C1B19` /
    grey `#5A574F`; one restrained **deep-evergreen** accent `#3D5A4C` (deep `#2D463A`). Added a
    muted-clay `caution` token so a *declining* trend never renders in the (green) accent;
    Results' down-trend now uses it. `accentGold` retoned to a muted ochre (decorative only).
  - **Depth** → near-flat: shadow opacities dropped (`soft` 0.05→0.04, `lifted` 0.10→0.07) and
    the shadow colour cooled; surfaces lean on hairline borders, per the editorial look.
  - **Form** → crisper corners (`card` 20→14, `input` 14→10) and **primary buttons are now
    soft rectangles** (`radius.input`) rather than full pills — a more premium editorial button.
    Pills retained for chips/badges/avatars/tab indicator.
  - **Type** → tightened the serif display/headings' tracking and the eyebrow label (12px /
    1.8 tracking); body sizes (≥17px for the 45–65 audience) unchanged.
  - **Figure** → gradient re-pitched to ink (`figureTop #4A4843` → `figureBottom #1C1B19`),
    `dim` lightened for the lighter canvas.
- **Native:** `bgBase` is mirrored in the camera view, so the Android (`PoseDetectionView.kt`)
  and iOS (`PoseDetectionView.swift`) backdrop literals and `app.json` `backgroundColor` were
  updated to `#F3F2ED` — a prebuild is needed for the native change to take effect on device.
- **Kept:** Fraunces (serif) + Inter (sans) pairing — already editorial; the single-light-theme
  model; product law 1's wording was updated to match.

## 2026-06-16 — Warm longevity dashboard redesign

- **Why:** product owner supplied a new premium longevity/wellness reference direction: warm,
  polished, calm, consumer-friendly for adults 50+, with ivory backgrounds, forest green, sage,
  champagne-gold accents, soft cards, spacious metrics, and editorial Discover content.
- **Theme:** `src/theme` now owns a warm longevity palette (`bgBase #F7F2EA`, `bgSurface
  #FFFDF8`, deep forest `#123D32`, sage `#7FA37A`, gold `#B99A55`, green-black type
  `#102A24`), a readable 50+ type scale, zero letter-spacing, soft shadows, rounded panels,
  and a green-black figure gradient. `bgBase` was also synchronized into `app.json`, native
  `PoseDetectionView` backgrounds on iOS/Android, and `scripts/skeleton-preview.ts`; a native
  rebuild is needed for the camera backdrop change on device.
- **Primitives:** expanded `src/components/ui.tsx` with reusable screen, premium/material cards,
  primary/secondary buttons, section headers, pills, badges, metric cards, score rings,
  daily-plan rows, health-metric rows, and empty states so screens share one product language.
- **Screens:** Home became a daily longevity dashboard (greeting, movement-age profile card,
  today's plan, key indicators) without adding a composite medical score; Results became a
  movement dashboard with focus callout, domain cards, metric rows, and green trend lines; Discover
  gained category filters and editorial cards; Family and Profile/Settings moved to spacious
  card/row layouts while preserving local-only mock/profile/reminder scope. Session HUDs,
  preflight prompts, and the tab bar were rethemed to match.
- **Scope:** visual/system refactor only. Routes, stores, pose pipeline, scoring, training logic,
  audio flow, local-only data model, and no-video privacy law are unchanged.

## 2026-06-16 — MVP adherence stack

- **Adherence is a separate local module, not folded into pose/training hot paths.** Added
  `src/adherence` with typed life goals, purpose-framed 4-week movement blocks, completion logs,
  lapse state, Support Circle privacy, notification stubs, weekly summaries, block reports, and
  identity milestones. The existing `TrainingBlock` still owns runnable exercise slots and
  progression; the new `MovementBlock` owns adherence/product state.
- **Life goal lives in the existing local profile record.** `UserProfile.lifeGoal` stores the
  structured primary goal while the older `profile.goal` text is kept in sync for current UI
  compatibility. No accounts or backend were added.
- **Completions are append-only and deduped by block/type/day.** Standard and restart sessions
  count toward the week; micro-check and re-test completions are tracked separately. Restart
  sessions use the existing voice-guided player with a shorter resolved exercise list, preserving
  the audio-first session path.
- **Support Circle is privacy-first and local-only.** The tab now uses Support terminology,
  supports one local pending invite, sharing levels, opt-in missed-week notifications, milestone
  toggles, and privacy-filtered summaries. `InviteService` and `NotificationService` are stubs
  with TODO seams for future email/SMS/deep-link/provider integration.
- **Tone is centralized.** `adherenceCopy` owns purpose, recovery, protection, weekly, report,
  and notification language with tests guarding against shame/streak/medical phrasing.
- **Verification:** `npm run typecheck`, `npm test -- --runInBand`, and `npx expo config` pass.

## 2026-06-16 — Flag-gated constellation pose avatar (Phase 0 + 1)

- **Scope:** added a renderer abstraction behind the existing `SkeletonView` import. The current
  filled figure is preserved as `classic`; the new `constellation` renderer is now the default
  when no env flag is set, and can also be selected explicitly with
  `EXPO_PUBLIC_POSE_AVATAR_RENDERER=constellation` or by passing a renderer mode prop. Invalid
  explicit flags fall back to `classic`.
- **Renderer:** constellation draws only existing MediaPipe keypoints, subtle bone lines, and
  deterministic sampled dots along bones. It deliberately does not add a dense body mesh, torso/head
  dot volume, confidence glow, rep pulses, or measurement-state styling. It uses `react-native-svg`
  already in the app: one path for lines and three dot paths, not hundreds of React components.
- **Pipeline safety:** pose detection, smoothing used for grading, chain reliability, scoring,
  rep/hold trackers, audio, and session players are unchanged. The constellation layer maps the
  pipeline's `displayFrame` through the same cover-fit coordinate helper as the classic renderer,
  then applies a light screen-space EMA for visual jitter only.
- **Guardrails:** dot count is capped, sampled offsets are deterministic (no per-frame randomness),
  low-confidence/missing landmarks skip affected joints/segments, and opt-in dev diagnostics log
  renderer mode, dot/line counts, geometry time, smoothing state, and skipped landmarks at most
  every few seconds.
- **Verification:** `npm run typecheck`, `npm test -- --runInBand`, and `npx expo config` pass.

## 2026-06-16 — Constellation avatar latency pass

- **Finding:** the constellation avatar was double-smoothed: `PosePipeline.displayFrame` already
  applies a light One-Euro filter for rendering, then the renderer added a fixed screen-space EMA
  at `alpha=0.38`. That made the visual calm but visibly trailing.
- **Change:** constellation now defaults to the latest `rawFrame` for visual rendering, with an
  adaptive screen-space EMA only as a light stabilizer. Defaults favor attachment: fixed alpha
  `0.78`, adaptive range `0.58–0.90`, and 2 snap frames after pose reacquisition. Low-latency mode
  disables renderer smoothing by default, drops sampled-dot density, lowers the max dot cap, and
  keeps the frame source raw.
- **Debug comparison:** `EXPO_PUBLIC_POSE_AVATAR_DEBUG=true` enables a dev-only on-screen avatar
  switcher for classic, constellation smoothing on/off, and sampled dots on/off. Env presets also
  exist through `EXPO_PUBLIC_POSE_AVATAR_DEBUG_VARIANT`.
- **Rendering:** sampled-dot offsets/radii are precomputed, sampled dots can be skipped or density
  reduced, and SVG path state updates are coalesced through `requestAnimationFrame` so the latest
  pose wins per paint frame. No dense mesh, body volume, glow, pulses, or measurement-state visuals
  were added.

## 2026-06-16 — Pose avatar Phase 2 torso/head volume

- **Scope:** added Phase 2 as a default-on constellation-only body-volume layer. It can be disabled
  with `EXPO_PUBLIC_POSE_AVATAR_BODY_VOLUME=0` or the dev variant `constellation-volume-off`. The
  Phase 1 constellation skeleton and the classic renderer remain available; no pose inference,
  scoring, session-player, or workout/check-up logic changed.
- **Visual:** deterministic torso dots map from stable local `u/v` seeds into the current
  shoulder/hip quadrilateral; deterministic head dots map into a simple estimated ellipse. Optional
  shoulder/hip density accents exist but default off. The volume draws behind bone lines and joint
  dots with lower opacity so the pose remains readable.
- **Performance:** no per-dot React components and no per-frame randomness. Seeds are cached by
  count, dots are emitted as batched SVG path strings, and volume has its own cap. Default normal
  volume is 86 torso + 22 head dots under a 150-dot cap; low-latency mode keeps the feature disabled
  unless explicitly enabled and uses 32 torso + 10 head dots under a 60-dot cap.
- **Robustness:** torso volume requires both shoulders and hips above confidence threshold; head
  volume uses ears/nose when available and cautious shoulder-based fallback otherwise. Low-confidence
  volume fades via opacity scale or skips safely rather than leaving stale dots.
- **Verification:** `npm run typecheck`, `npm test -- --runInBand`, and `npx expo config` pass.

## 2026-06-16 — Pose avatar Phase 3 confidence-aware visuals

- **Scope:** added confidence-aware visual behavior only. Pose inference, chain reliability, grading,
  rep counting, scoring, audio, and session-player logic are unchanged. Classic renderer fallback,
  Phase 1 skeleton, Phase 2 body-volume toggles, and low-latency mode remain available.
- **Confidence model:** `src/render/confidenceVisuals.ts` centralizes confidence extraction
  (`confidence`, `score`, `visibility`, `presence`, `probability`), confidence buckets, visual
  multipliers, bone confidence, average pose confidence, fade opacity, pose visual tracking state,
  and recognition-pulse dedupe. Missing confidence defaults to normal rendering rather than blocking.
- **Rendering:** constellation geometry now emits high/medium/low path buckets for bone lines,
  sampled dots, and keypoint dots. The SVG layer applies restrained opacity differences at the group
  level, not per-dot components. The avatar also has a cheap group-level reacquisition fade that
  changes opacity only, never coordinates, so it does not add positional lag.
- **Recognition pulse:** a typed `recognitionEvent` seam and dedupe helper exist, but production
  screens do not yet pass workout events. Pulse remains disabled by default and is also suppressed
  in low-latency mode. No fake rep/event inference was added.
- **Config:** Phase 3 is default-on with subtle strength. It can be disabled with
  `EXPO_PUBLIC_POSE_AVATAR_PHASE3=0`, or tuned with `EXPO_PUBLIC_POSE_AVATAR_CONFIDENCE_FADING`,
  `EXPO_PUBLIC_POSE_AVATAR_CONFIDENCE_INTENSITY`,
  `EXPO_PUBLIC_POSE_AVATAR_REACQUISITION_FADE`,
  `EXPO_PUBLIC_POSE_AVATAR_RECOGNITION_PULSE`, and
  `EXPO_PUBLIC_POSE_AVATAR_CONFIDENCE_STRENGTH=off|subtle|medium`.
- **Low latency:** confidence opacity mapping stays cheap; reacquisition fade defaults off in
  low-latency mode, and recognition pulse is disabled there even if requested.

## 2026-06-16 — Central Hale product flow state

- **Central next action:** added `src/haleFlow` as the pure product-flow layer for onboarding,
  baseline Movement Check-Up, block creation, session due, weekly micro-check, lapse recovery,
  official re-test, report, and next-block states. Home now renders its primary CTA from
  `getNextBestAction` instead of rebuilding flow decisions screen by screen.
- **Local metadata around raw check-ups:** raw `CheckUp` files still live in `HistoryStore`;
  adherence state now also stores typed `MovementAssessment` records and `MovementBlockReport`
  records so official baseline/re-test results can be distinguished from manual extras and quick
  re-checks without changing the CV pipeline.
- **Onboarding sequence:** added welcome, short safety/profile intake, camera setup, and manual
  check-up guardrail screens in the existing `App.tsx` flow shell. Safety profile remains
  local-only and feeds equipment substitutions; no backend, account, push, or medical workflow was
  introduced.
- **Training seams:** starter sessions now count toward block progress, restart sessions stay
  shorter, completion feedback captures effort and pain/safety flags, and `generateTodaySession`
  describes the current session for future progression/autoregulation without replacing the
  existing voice-guided training player.
- **Verification:** `npm run typecheck`, `npm test -- --runInBand`, `npx expo config --type public`,
  and a dev-client Metro startup check on port 8082 pass. A separate Hale Metro instance was already
  running on 8081, so the duplicate 8082 server was stopped after verification.

## 2026-06-16 — Focus-specific mobility micro-check

- **Mobility block check-ins now use a mobility primitive.** `getMicroCheckForBlock` maps
  mobility-focused blocks to a seated reach micro-check instead of reusing chair power. The runner
  composes the existing `RomSetGrader` and emits a separate `seated-reach-angle` trend, so it does
  not pretend to be the full forward-reach assessment metric.
- **Audio and camera laws are unchanged.** The new mobility check reuses the bundled hamstring-reach
  voice line, keeps the skeleton-only camera path, and adds no runtime TTS or model changes.
  Strength/power and balance micro-checks keep their existing rise-velocity and single-leg-hold
  trend mappings.

## 2026-06-16 — V1 ladder exercise catalogue

- **Exercise catalogue is now ladder-first.** `src/exercises/ladders.ts` groups registered
  training exercises into V1 user-facing ladders with release status, measurement tier, domain,
  equipment, camera view, instructions, and legacy-id mapping. The old exercise registry remains
  the runnable source of truth so historical ids still resolve.
- **New V1 exercise levels stay simple.** Added loaded sit-to-stand, slow/loaded squat,
  chair-supported split squat, supported toe raise, band rows/pull-apart, supported side step,
  mini-band lateral walk, thoracic rotation, hip-flexor stretch, and wall calf stretch. New rows
  reuse generic rep counting where robust; lateral/mobility items use a timer grader rather than
  brittle bespoke pose scoring.
- **Default training uses ladders and equipment gates.** Session generation now rotates through
  A/B/C templates with lower-body, upper-body push/pull, balance/lateral stability, and mobility.
  Band, mini-band, stair, and load-dependent exercises substitute to safe alternatives when missing;
  floor push-ups and loaded progressions remain optional rather than beginner defaults.
- **Official V1 check-up hides TUG.** The default Movement Check-Up includes chair stand, balance
  ladder, shoulder reach, and forward reach. Timed Up and Go remains implemented behind
  `BETA_BATTERY_WITH_TUG` and historical scoring/trends still tolerate existing TUG records.
- **Balance scoring follows the V1 battery.** Balance domain age mapping now uses the balance
  ladder's single-leg eyes-open hold with Bohannon single-limb-stance norms; TUG appears only as
  historical supporting detail when present.
- **Verification:** `npm run typecheck` and `npm test -- --runInBand` pass.

## 2026-06-16 — Dynamic workout generation v1

- **Blocks are generated from weakest domain, not random picks.** `src/training/workoutGeneration.ts`
  creates 4-week, 3-session/week blocks from Movement Check-Up output and assigns deterministic A/B/C
  templates for strength/power, balance/stability, or mobility/flexibility focus.
- **Today sessions resolve slots through ladders at launch.** The generator selects exercise levels
  from current ladder progress, filters to V1-visible levels, applies equipment gates, substitutes
  safer ladders when setup is missing, and adapts volume/order for readiness states including
  short-on-time, low-energy, stiffness, and pain-area avoidance. It keeps the product rule that Hale
  measures and guides; it does not diagnose or critique form.
- **Progression uses feedback, not streaks.** Ladder progress advances after repeated easy,
  pain-free, well-tracked completions; pain, high effort, repeated low completion, or poor setup
  holds/regresses conservatively. Poor tracking repeats the level instead of counting as user
  failure.
- **Extra sessions share the same engine.** Added seven preset templates for mobility reset,
  gentle restart, steady balance, no-equipment strength, band upper-back, stairs confidence, and
  quick full-body practice; they use the same equipment/readiness filters as block sessions.
- **Compatibility:** `src/haleFlow/sessionPlanning.ts` now adapts generated sessions back into the
  existing `HaleSessionPlan` shape so Home can surface "Today's Hale Session" without rewriting the
  current UI/player path.
- **Verification:** `npm run typecheck`, `npm test -- --runInBand`, and
  `npx expo config --type public` pass.

## 2026-06-16 — Workout generation debug previews

- **Dev preview utility:** added `generateDebugWorkoutScenarios()` in `src/training/debugWorkoutScenarios.ts`
  to inspect generated sessions across realistic equipment, focus-domain, readiness, pain, and
  progression scenarios without changing production behavior.
- **Product guardrails tightened:** default generated sessions now stay on V1 core levels unless an
  optional level is explicitly enabled, short-on-time sessions report as 10-minute sessions, knee
  pain avoids the squat ladder and falls through to sit-to-stand, and shoulder pain avoids the
  shoulder reach/press ladder. The old `loaded-march` id remains stable, but its user-facing name is
  now "March in Place" so no-load sessions do not present loaded work.
- **Tests:** debug scenario tests assert durable product properties rather than snapshotting copy:
  exercise counts, equipment gates, pull coverage with bands, pain substitutions, no default TUG or
  neck rotations, and no banned medical language.

## 2026-06-16 — Pose avatar Phase 4 measurement states

- **Constellation avatar is now context-aware.** The renderer accepts optional measurement states
  (`setup`, `framing`, `ready`, `checkup`, `micro_check`, `training`, `rest`, `retest`, `paused`,
  `success`, `tracking_lost`, `low_confidence`) plus active domain and tracking quality. Phase 4 is
  presentation-only: it changes opacity, radius, optional setup guides, and subtle domain emphasis,
  but never changes pose inference, grading, rep counting, scoring, or workout/check-up state
  machines.
- **Low-latency remains first.** State transitions interpolate only style multipliers, never old
  coordinates. Low-latency mode disables scan lines, shortens/removes transitions, keeps style
  multipliers static, and preserves the newest pose frame path. The optional scan line remains off
  by default.
- **Screen wiring uses existing state only.** Check-up, micro-check, assessment, training, and the
  live camera screen pass their existing phase/domain context into `SkeletonView`. Re-test remains
  an available renderer state for the future official re-test flow rather than being inferred.
- **Verification:** render utility tests cover measurement states, tracking quality, domain
  emphasis, config flags, and geometry overlays. Typecheck and the render test suite pass.
