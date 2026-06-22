# Decision log

Significant choices, newest last. Each entry: date, decision, why, alternatives rejected.

## 2026-06-12 — Stage 1 kickoff

- **Expo SDK 56 (latest stable at time of scaffold)**, TypeScript strict, `blank-typescript`
  template (no expo-router — V1 is a small number of screens; plain navigation keeps the
  frame path simple and avoids a dependency we don't need yet).
- **Continuous Native Generation (CNG):** `android/` and `ios/` are gitignored and produced by
  `npx expo prebuild`. The only native code we own lives in `modules/expo-pose-detection`.
- **MediaPipe model binaries are not committed.** `scripts/download-models.sh` fetches
  `pose_landmarker_lite.task` and `pose_landmarker_full.task` into the module's Android assets
  and iOS resources. Run it once after clone, before prebuild.
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
- **Model binaries not committed** (regenerable): `scripts/download-models.sh` must run after
  clone and before prebuild, or the app throws `model-not-bundled` at runtime.
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

## 2026-06-17 — Workout preview product-quality refinements

- **No-equipment language now matches Hale's home context.** The no-equipment quick preset is labeled
  and generated as "No Optional Equipment": no band, mini-band, stair, or load, while still assuming
  ordinary home supports such as a chair and wall/counter. The debug utility has a separate
  travel/true-no-equipment scenario for bodyweight-only days.
- **Beginner previews are gentler.** `GenerateSessionInput.sessionIntensity` lets dev/debug and
  low-confidence paths request easier starting levels and lower-volume prescriptions without
  weakening normal block sessions. Beginner examples now favor cushion sit-to-stand, wall push-ups,
  short balance holds, and simple mobility.
- **Fallback copy is clearer.** No-band upper-body pull fallbacks now explicitly say that a resistance
  band is needed for upper-back pulling work and that shoulder mobility is being used today instead.
- **Pain guardrails are calmer.** Knee pain avoids step-up, squat, split squat, and lateral-stability
  ladders; the fallback uses balance or mobility instead. Pain guidance says to move only in a
  comfortable range and stop at any time, without medical language.
- **Short sessions avoid false precision.** Generated sessions keep `estimatedMinutes: 10` for layout
  and planning, while debug/user-facing preview copy uses `durationLabel: "About 10 min"`.

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

## 2026-06-17 — Side-view tolerant avatar volume

- **Finding:** Phase 2 body volume was enabled by default, but the torso layer required both
  shoulders and both hips above confidence. In Hale's side-view movements, the far-side
  shoulder/hip often fall below confidence, so the volume layer could disappear and leave only the
  Phase 1 skeleton lines/dots.
- **Change:** torso volume now uses the full shoulder/hip quadrilateral when all four landmarks are
  reliable, and falls back to a conservative one-side shoulder-to-hip estimate when exactly one side
  is reliable. The fallback is lower-opacity and presentation-only; it does not change pose
  inference, grading, scoring, or session logic.
- **Verification:** body-volume tests now cover far-side occlusion and all-torso-low confidence.

## 2026-06-17 — Stage 8 polish guardrails

- **Optional Explore and ladder-practice sessions stay outside the main plan.** A shared
  `countsTowardMainPlan` helper now gates main block completion, weekly adherence, and ladder
  progression for `preset`, `manual`, and `retest_prep` sessions. Their generated summaries can
  still be saved locally for continuity. Rejected: letting optional practice advance the primary
  block, because Explore should support the plan rather than quietly reshape it.
- **Stage 8 QA is documented in `docs/hale-v1-manual-qa.md`.** The checklist covers first-run,
  returning-user, Plan A/B/C, Progress/re-test/report, Explore, old state, and accessibility
  passes without adding new product features.

## 2026-06-17 — Point-cloud body avatar default

- **Finding:** enabling all existing avatar phases still rendered a skeleton-forward
  constellation. Phase 2 added torso/head volume, but limbs remained bone lines plus sampled
  points, so the "full avatar" could still read visually as a skeleton.
- **Change:** added a renderer mode, `point_cloud_body`, and made it the default. It builds a
  deterministic body-part point cloud: head ellipse, tapered torso, capsule volumes for arms and
  legs, and small hand/foot clusters. Skeleton lines are off by default; keypoints are subtle; local
  dot connections are optional. `EXPO_PUBLIC_POSE_AVATAR_BODY_STYLE=point_cloud_body` and
  `EXPO_PUBLIC_POSE_AVATAR_RENDERER=point_cloud_body` both select the new body renderer.
- **Performance guardrails:** normal density targets a body-like 550-850 visible dots under an
  800-dot default cap; low-latency mode uses the low density, caps at 400 by default, disables
  optional connections/skeleton lines, and keeps the renderer path batched as SVG paths rather than
  per-dot React components.
- **Compatibility:** classic and constellation debug variants remain available for comparison. This
  is presentation-only and does not change pose inference, grading, scoring, workout, or check-up
  logic.

## 2026-06-17 — Point-cloud avatar visibility tuning

- **Finding:** the new body renderer read correctly as a body, but the medium preset still looked
  too sparse on device. Raising dot size is the cheapest visibility win because it keeps the same
  number of SVG paths and avoids per-dot React components.
- **Change:** medium density now fills closer to the existing 800-dot cap, and
  `pointCloudBodyDotScale` defaults to `1.26` in normal mode and `1.16` in low-latency mode. The
  value can be tuned with `EXPO_PUBLIC_POSE_AVATAR_POINT_CLOUD_BODY_DOT_SCALE`. Low-latency mode
  still uses the low density and a lower cap.
- **Guardrail:** tests assert medium density remains capped, low-latency stays lower, and dot-scale
  changes only radius, not dot count. Presentation-only; no pose, scoring, workout, or check-up
  logic changed.

## 2026-06-17 — Point-cloud avatar muscle-focus colour

- **Change:** the point-cloud avatar can now render selected body-region dots in a restrained
  olive focus colour (`colors.restorativeGreen`). Training sessions map the current exercise to
  coarse body regions: sit-to-stand/squats highlight thighs for quads, bridge/hinge highlight
  hips/thighs, calf work highlights lower legs/feet, and upper-body work highlights torso/arms.
- **Boundary:** this is educational feedback about the current exercise target, not form feedback
  or scoring. It does not affect pose inference, rep counting, grading, progression, check-ups, or
  workout logic.
- **Performance:** active dots remain batched into SVG path buckets; no per-dot React components
  were added.

## 2026-06-17 — Live avatar high-visibility display

- **Finding:** the 260-dot low-latency live avatar was responsive but too hard to read on device.
- **Change:** check-up, training, micro-check, dev assessment, and live camera screens now use the
  high-density point-cloud body with a 900-dot cap and larger `pointCloudBodyDotScale`, while
  keeping display smoothing disabled for responsiveness. Normal point-cloud defaults were also
  raised to high density / 900 dots / larger dots, and low-latency mode remains available as a
  smaller fallback rather than the hard-coded live default.
- **Colour rule:** non-target body dots render in the app's near-black text colour. Training target
  muscle dots remain the only coloured dots, using restrained olive `colors.restorativeGreen`.
- **Stability rule:** visible point-cloud dots use stable opacity buckets rather than per-frame
  confidence/body-opacity multipliers. Tracking confidence may still remove unrenderable body parts
  or the whole avatar when pose is lost, but valid dots should not pulse lighter/darker during
  normal movement.
- **Completeness rule:** the point-cloud body keeps denser hand/foot clusters and hand/foot centers
  biased toward index/toe landmarks so the figure reads as continuous at the extremities. The head
  is rendered slightly larger than the raw estimate and joins the torso through a sparse, narrow
  neck connector so the figure reads as connected without a heavy dotted neck column.
- **Boundary:** pose inference, measurement smoothing, rep/hold state machines, scoring, and workout
  generation are unchanged. This affects only the displayed avatar.

## 2026-06-17 — Live pose latency correction

- **Finding:** the live avatar still lagged because the camera module had drifted to MediaPipe's
  heavier `pose_landmarker_full.task` default, and the 900-dot avatar could rebuild redundant SVG
  paths while a previous visual update was still waiting to paint.
- **Change:** `PoseDetectionView` defaults back to `pose_landmarker_lite.task` in JS, Android, and
  iOS, and all live camera screens pass `modelVariant="lite"` explicitly. The full model remains
  bundled and available through the explicit prop for profiling or non-live experiments.
- **Renderer:** live avatar screens explicitly use raw frame coordinates, disable renderer-level
  smoothing/fades/pulses/state transitions, and the point-cloud renderer now drops visual-only frames
  while a prior SVG update is pending. Live frame callbacks now run measurement/preflight/session
  logic before invoking the avatar renderer so dense dot generation cannot hold up rep/hold/check-up
  state.
- **Diagnostics:** native `inferenceMs` is carried through the JS pose pipeline into the avatar
  performance log so future profiling can separate model runtime from geometry/render cost.
- **Runtime:** native pose estimation still requests the GPU delegate first and falls back to CPU if
  the delegate is unavailable on a device or simulator.

## 2026-06-17 — Setup trust controls for live flows

- **Change:** check-up and workout setup timeouts now surface an explicit setup-help state instead
  of silently auto-skipping. Users can try again, open setup help, or skip the current movement /
  exercise, and skipped items are still recorded as skipped/missing rather than completed.
- **Controls:** live check-up and workout screens now keep visible Pause, Repeat, Help, Skip, and
  Stop controls while preserving the hands-free default voice flow.
- **Copy:** the check-up intro visible text uses the active battery count, the generated-audio
  source now uses a generic no-count check-up intro, and the framing-ready cue is softened to
  "That looks good. Stay there."

## 2026-06-17 — Gentler framing prompt cadence

- **Change:** framing voice prompts now have a hard five-second minimum gap between spoken prompts,
  even when the requested correction changes from one frame window to the next. Unchanged prompts
  keep the slower ten-second repeat cadence.
- **Scope:** the rule is shared by the check-up assessment controller, training session player, and
  micro-check runner so setup guidance feels calm across live camera flows.

## 2026-06-17 — Unobstructed recording viewport

- **Change:** live check-up and workout screens now place the pose avatar in a bounded, centered
  portrait viewport with all instructions, counts, timers, setup help, and controls arranged above
  or below it. Nothing user-facing overlays the avatar viewport.
- **Display fit:** avatar mapping now supports `contain` in addition to the prior full-screen
  `cover` behavior. Recording screens opt into `contain` so the full camera coordinate plane remains
  visible on any phone aspect ratio; other renderers keep the existing default.
- **Boundary:** camera video is still never displayed. The native camera view remains the sensor
  layer; only the pose-derived avatar layout changed.

## 2026-06-17 — Phase 1 valid active-time timers

- **Change:** a generic valid-time accumulator now gates Phase 1 training holds/captures: balance
  holds, bridge hold, and seated hamstring reach. These sets wait for a brief valid setup, count
  accumulated valid time, tolerate short landmark jitter, pause on sustained invalid/tracking loss,
  resume after reacquisition, and store optional valid-time metadata on set results.
- **Assessment boundary:** shoulder flexion and hinge reach still use the existing fixed check-up
  capture windows for protocol stability, but their graders prefer stable valid samples when
  available and store optional valid-time metadata. Chair stand, balance ladder, TUG, rep-based
  training, and later broad setup-gated timers are unchanged.
- **UX boundary:** no runtime TTS or new bundled voice cues were added; pause/resume guidance is
  visible workout copy only, using supportive language.

## 2026-06-17 — Phase 2 broad setup-gated workout timers

- **Change:** selected timer-based training drills now opt in to `broad_setup_gated` valid time:
  thoracic rotation, supported hip flexor stretch, wall calf stretch, supported side step, and
  mini-band lateral walk. They reuse the Phase 1 `ValidTimeAccumulator` with a more forgiving
  500 ms start/resume debounce, 1.5 s grace, and 2.0 s sustained-loss pause threshold.
- **Pose boundary:** these predicates are broad setup gates, not form judges. They check for a
  plausible tracked subject, expected view visibility, upright setup, and coarse participation
  where reliable; they deliberately avoid exact hip extension, heel-down, rotation range, step
  width, knee angle, or band-tension scoring.
- **Scope boundary:** March in Place and Overhead Reach remain rep-based; toe/heel raises,
  band pull-aparts, row variants, band overhead press, rep-based exercises, 30-second chair stand,
  and TUG were not converted. Broad timers remain explicit per-exercise opt-ins rather than a
  default for every timer.
- **UX boundary:** no runtime TTS or new bundled voice cues were added. Broad timer captions use
  supportive visible copy such as "Get into position", "Keep moving", and
  "Timer paused - return to position".

## 2026-06-17 — Phase 3 conservative valid-time progression

- **Change:** generated-session ladder progression now consumes valid-time metadata through a
  feature-flagged classifier. Strong valid-time work can count toward the existing repeated-exposure
  progression rule, reset-heavy completions get credit without advancing, incomplete valid-time work
  is treated as repeat difficulty, and tracking-uncertain attempts repeat the level without demotion.
- **Rollback:** `VALID_TIME_PROGRESSION_ENABLED` gates only the Phase 3 progression interpretation.
  Phase 1/2 valid-time timers and metadata emission continue unchanged when Phase 3 is disabled.
- **UX boundary:** session completion can show at most a few plain-language steady-time notes. It does
  not expose raw tracking ratios, medical claims, or form critique.

## 2026-06-17 — Supabase social auth app-side support

- **Change:** required account access now supports Google on iOS/Android through Supabase OAuth with
  the app scheme redirect, while Apple sign-in uses native iOS credentials exchanged with Supabase via
  `signInWithIdToken`.
- **Config:** the Expo app registers the `hale` scheme, keeps `expo-web-browser` configured for the
  OAuth browser session, and enables the Apple sign-in config plugin/entitlement path. Provider
  client secrets stay in Supabase, Google Cloud, and Apple dashboards, never in the mobile app.
- **Scope boundary:** email/password auth remains available. Check-ups, movement blocks, training
  state, session completions, micro-checks, scoring, pose logic, and local file-backed stores are not
  connected to Supabase in this step.

## 2026-06-17 — Refined premium visual system

- **Change:** the central theme now uses the refined warm longevity palette (`bg-base #F6F0E7`,
  restrained cream surfaces, deep olive actions, soft sage selected states, and quieter clay accents).
  Shared cards, inputs, buttons, chips, badges, tab chrome, onboarding choices, and camera HUD panels
  use less-rounded shapes and subtler shadows.
- **Auth screen:** the signed-out account gate now uses calmer copy focused on keeping Movement
  Check-Up results, training blocks, and monthly progress history connected. The required badge was
  removed from this gate; signed-in account state still appears quietly in settings.
- **Scope boundary:** this was a visual/design-system refactor only. Auth logic, backend calls,
  onboarding flow, check-up/session state machines, pose detection, scoring, workout generation, and
  sync contracts were not rewritten.

## 2026-06-17 — Stage 1 shared UI primitives

- **Change:** the theme now exposes reusable component recipes for cards, buttons, inputs, chips,
  list rows, and progress bars. `src/components/ui.tsx` now provides generic `Button`, `Input`,
  `Typography`, `Chip`, `SegmentedTabs`, `ListRow`, and `ProgressBar` primitives while preserving
  existing aliases such as `ScreenContainer`, `Card`, `PrimaryButton`, `SecondaryButton`, `Pill`,
  and `MetricRing`.
- **Scope boundary:** no individual screen was redesigned in this stage. Existing screens can adopt
  the new primitives incrementally without changing route names, auth/backend behavior, pose logic,
  scoring, workout generation, or state flow.

## 2026-06-17 — Stage 2 auth and onboarding visual refactor

- **Change:** the signed-out auth gate and first-run onboarding screens now use the Stage 1 premium
  primitives for refined cards, inputs, segmented mode switching, option rows, setup rows, summary
  cards, and calm primary/secondary actions.
- **Scope boundary:** the refactor is visual/layout only. Supabase auth methods, onboarding state,
  profile persistence, camera permission flow, check-up creation, block creation, route names, pose
  detection, scoring, workout generation, dashboard, progress, training/session, and profile/settings
  logic were not rewritten.

## 2026-06-17 — Stage 2 premium health-tech correction

- **Change:** the visual system was corrected away from warm spa/beige styling toward a crisper
  premium health-tech direction: `bgBase #F7F5EF`, white cards, restrained borders, deep-green
  actions, smaller radii, near-flat shadows, sans-led headings, text-tab auth switching, focused
  inputs, and quieter badges.
- **Auth/onboarding:** the signed-out account gate now removes placeholder app-icon branding, uses
  the required "Keep your movement progress connected." copy, trims repeated explanatory text, and
  presents account access in a flatter white card with 14-20 px shape language. Onboarding option
  rows use the same white-card foundation with calmer selected states and non-dot markers.
- **Scope boundary:** this correction remains visual-only. Auth handlers, Supabase calls, onboarding
  state, route names, camera permission flow, check-up/session logic, pose detection, scoring,
  workout generation, and sync contracts were not rewritten.

## 2026-06-17 — No standing target on recording screens

- **Change:** live recording screens disable the avatar setup guide target so the recording area only
  shows the pose avatar and screen chrome.
- **Scope boundary:** camera inference, framing readiness checks, voice prompts, workout/check-up
  progression, and measurement logic are unchanged.

## 2026-06-17 — Full-width recording viewport

- **Change:** the main check-up and workout recording pages now size the visible pose-avatar viewport
  to the full phone width and derive height from the portrait camera aspect ratio. Text and fallback
  action controls are stacked in separate bands above and below the viewport; short screens can scroll
  rather than overlapping the avatar.
- **Scope boundary:** pose estimation, camera capture, contain-fit avatar mapping, framing prompts,
  and workout/check-up progression are unchanged.

## 2026-06-19 — White-stone + deep-emerald colour refinement

- **Change:** the central theme moved from the warm cream/olive system to a cleaner premium
  longevity palette: `bgBase #F7F7F3`, white cards/surfaces, `accent #0F4A36`,
  `accentHover #0A3627`, `accentSoft #DDE9E1`, secondary sage `#B9CABC`, text `#111814`,
  secondary text `#69726C`, dividers `#E7E5DD`, and milestone accent `#B89B5E`.
- **Mirrors:** `app.json`, both native `PoseDetectionView` backgrounds, and the skeleton preview
  script were kept in sync with the new `bgBase`; the pose figure gradient now uses deep emerald.
- **Scope boundary:** this was a colour-system polish pass only. Layout, copy, onboarding flow,
  auth/backend sync, pose detection, check-up/session state machines, scoring, and workout
  generation were not changed.

## 2026-06-19 — Stronger white-stone + emerald colour polish

- **Change:** the central palette was strengthened so the app no longer reads as cream/olive:
  `bgBase #F8F9F6`, white cards, elevated `#FCFCFA` surfaces, primary emerald `#005C43`,
  deep emerald `#073B2D`, pressed emerald `#03402F`, soft emerald fill `#E7F2ED`, pale mint
  fill `#F0F7F3`, text `#111714/#68736D/#8B938D`, borders `#E1E6DF`, and milestone accent
  `#B79A5B`.
- **Today card:** the Daily Focus card moved away from the dark image-overlay treatment to a white
  premium card with charcoal/emerald copy, a pale mint detail area, and an emerald primary CTA.
- **Mirrors:** `app.json`, both native `PoseDetectionView` backgrounds, and the skeleton preview
  script were kept in sync with the cooler `bgBase`; the pose figure gradient now uses the stronger
  emerald tokens.
- **Scope boundary:** this remains a visual colour/card-styling pass only. Layout flow, copy,
  onboarding, auth/backend sync, pose detection, check-up/session state machines, scoring, and
  workout generation were not changed.

## 2026-06-19 — Warm-stone + inky-green premium correction

- **Change:** the central palette moved away from mint-heavy wellness styling toward a warmer,
  more mature longevity identity: `bgBase #F7F5EF`, white cards, elevated `#FBFAF7` surfaces,
  primary ink `#111412`, secondary text `#68706A`, tertiary text `#8A908A`, brand green
  `#123C2E`, pressed green `#0B2B21`, progress/success emerald `#007A5A`, transparent soft
  fills, stone borders `#E4E0D6/#D8D3C8`, warm accent `#A98243`, and soft gold
  fill `#F4EFE4`.
- **Today card:** the Daily Focus card returned to a deep brand-green hero treatment with
  warm-white copy, a warm-white CTA, and only restrained line texture, removing the generic pale
  mint illustration panel.
- **Scope boundary:** visual palette and card styling only. App logic, navigation, auth/backend
  sync, pose detection, check-up flow, training generation, and product copy are unchanged.

## 2026-06-19 — Reference-aligned Profile tab

- **Change:** Profile now lives as the fifth bottom-tab destination instead of opening as a
  full-screen settings flow. The default Profile surface was simplified to a reference-style hub:
  profile summary card, compact settings rows, account row, export/sign-out actions, and a delete
  account link.
- **Interaction:** editable details, plan preferences, trainer voice, equipment, privacy, and help
  remain available behind row taps so the first view stays visually calm while preserving the local
  setup controls.
- **Scope boundary:** profile presentation/navigation only. Auth handlers, account deletion/export
  services, local profile persistence, plan generation, reminders, camera setup, pose detection,
  check-up/session state machines, and backend sync contracts are unchanged.

## 2026-06-20 — Warm clay canvas and borderless cards

- **Change:** the app canvas moved to `bgBase #F4EDE6`; base and elevated card surfaces now share
  `#FBF5EF`. Shared `Card` variants and matching one-off card panels no longer draw outer borders,
  relying on fill and soft shadow for separation.
- **Mirrors:** `app.json`, both native `PoseDetectionView` backgrounds, and the skeleton preview
  script were kept in sync with the new `bgBase`.
- **Scope boundary:** visual palette/card styling only. Product copy, navigation, pose detection,
  check-up/session state machines, scoring, persistence, auth/backend sync, and training logic are
  unchanged.

## 2026-06-20 — Plan-card recipe promoted app-wide

- **Change:** the Plan page cards became the app-wide card reference: `#FBF5EF` fill, 16px radius,
  `0 10px 24px rgba(17,20,18,0.06)` shadow, compact 18/24 serif card titles, 14/20 card body copy,
  and 14/19 row titles. Shared `Card`, `MaterialCard`, `MetricCard`, list rows, health rows, and
  matching one-off panels now use these tokens where they present card content.
- **Scope boundary:** styling only. Navigation, app state, training/check-up logic, scoring,
  persistence, auth/backend sync, and copy semantics are unchanged.

## 2026-06-20 — Unified compact page headers

- **Change:** page-level titles now share a compact Programs-style treatment: 28/34 serif regular,
  primary text colour, 14/20 secondary subtitle, and a consistent `spacing.pageTop` top offset.
  Shared `ScreenHeader` and custom top headers on Plan, Progress, Explore, Profile, Results,
  Session Preview, Article, Auth, Home, and Today were aligned to those tokens.
- **Scope boundary:** header styling only. Card typography, controls, navigation, state, scoring,
  pose/session logic, persistence, and backend/auth behaviour are unchanged.

## 2026-06-20 — Profile settings rows open detail pages

- **Change:** Profile row taps now swap the tab into a dedicated detail page with a back control
  instead of expanding content below the menu card. Profile details, Camera & Safety, Plan
  Preferences, Trainer Voice, Equipment Setup, Privacy, and Help all use the same local detail-page
  pattern.
- **Scope boundary:** profile tab interaction only. Existing preference state, account actions,
  camera setup, safety profile flow, persistence, auth/backend sync, pose detection, and training
  logic are unchanged.

## 2026-06-20 — Shared page width matches Plan

- **Change:** the Plan page container became the app-wide page-width reference via theme tokens:
  `spacing.pageMaxWidth` is `430` and `spacing.pageHorizontal` is `18`. Shared `Screen` content
  plus custom Today, Profile, Explore, Auth, Article, and splash containers now use those values so
  normal pages share the same horizontal footprint.
- **Scope boundary:** outer page layout only. Inner card padding, camera/session HUD layouts,
  navigation, persistence, auth/backend sync, pose detection, scoring, and training logic are
  unchanged.

## 2026-06-20 — Unified green accent colour

- **Change:** green buttons, primary accent tokens, success/progress green, Today hero greens, and
  green tab/icon accents now use `#414C34`. Hardcoded green RGBA overlays on the Explore featured
  post and Plan week pill were updated to the same RGB value.
- **Scope boundary:** colour styling only. Layout, copy, navigation, state, persistence, auth/backend
  sync, pose detection, scoring, and training logic are unchanged.

## 2026-06-20 — Settings moved to page headers

- **Change:** Settings was removed from the bottom tab bar, leaving the primary loop as Today,
  Plan, Progress, and Explore. The Settings screen keeps the internal `profile` route key, but it
  is opened from a gear icon in the headers of those four primary pages. The screen title,
  help/back accessibility labels, and cross-links now refer to Settings instead of Profile.
- **Scope boundary:** navigation chrome and user-facing copy only. Stored profile/preferences data,
  route keys, account actions, persistence, auth/backend sync, and settings section behaviour are
  unchanged.

## 2026-06-20 — Floating primary tab bar

- **Change:** the four-item primary tab bar became an inset floating capsule on the warm base
  canvas, with a soft ivory fill, thin stone border, light lift, and colour-only active state using
  the shared `#414C34` green.
- **Scope boundary:** navigation chrome styling only. Tab membership, route keys, screen state,
  persistence, auth/backend sync, and settings access are unchanged.

## 2026-06-20 — Soft fills moved off green tint

- **Change:** pale selected/button/icon-well backgrounds moved from sage-tinted fills to transparent
  outline treatments: shared `accentSoft`/`sageMist`/`bgSage` and Today `iconFill` are now
  transparent, while borders and foreground labels carry the state. Direct translucent green
  overlays/press states were neutralized. The dark `#414C34` brand accent remains for text, icons,
  progress, and primary actions.
- **Scope boundary:** visual styling only. Copy, interaction state, route keys, persistence,
  auth/backend sync, pose detection, scoring, and training logic are unchanged.

## 2026-06-20 — Trial palette snapshot before evergreen test

- **Preserved previous palette:** before testing the evergreen palette, the active colours were
  `bgBase #F4EDE6`, card/elevated surfaces `#FBF5EF`, primary text `#111412`, secondary text
  `#68706A`, tertiary text `#8A908A`, unified green accent `#414C34`, transparent soft fills,
  borders `#E4E0D6/#D8D3C8`, brass accent `#A98243`, and Today hero/tab greens `#414C34`.
- **Why:** this snapshot is the rollback reference if the palette trial does not feel right.

## 2026-06-20 — Evergreen palette trial

- **Change:** the app is temporarily testing the first premium palette option: warm-stone canvas
  `#F3ECE4`, ivory cards `#FCF6EF`, elevated surfaces `#FFF9F2`, evergreen accent `#123A2D`,
  deep evergreen `#08251D`, soft accent fill `#E9F0E8`, stone border `#DDD5C8`, and brass
  `#9E7A3D`.
- **Mirrors:** `app.json`, both native `PoseDetectionView` backgrounds, and the skeleton preview
  script were kept in sync with the trial `bgBase`.
- **Scope boundary:** colour tokens only. Layout, copy, navigation, state, persistence,
  auth/backend sync, pose detection, scoring, and training logic are unchanged.

## 2026-06-20 — Cleaner warm-stone palette trial

- **Change:** the active palette trial moved from the first evergreen option to the second,
  slightly cleaner warm-stone option: canvas `#F6F0E8`, cards `#FFFAF4`, elevated surfaces
  `#FBF5EF`, primary text `#101310`, evergreen accent `#0F3B2E`, deep evergreen `#08261D`,
  soft accent fill `#EAF1EA`, borders `#E2DACF/#D8D0C2`, and gold `#A98243`.
- **Mirrors:** `app.json`, both native `PoseDetectionView` backgrounds, and the skeleton preview
  script were kept in sync with the new trial `bgBase`.
- **Scope boundary:** colour tokens only. Layout, copy, navigation, state, persistence,
  auth/backend sync, pose detection, scoring, and training logic are unchanged.

## 2026-06-20 — Editorial warm-stone palette trial

- **Change:** the active palette trial moved to the richer editorial/luxury option: canvas
  `#F1E9DF`, cards `#FCF5ED`, elevated surfaces `#FFF8EF`, primary text `#11110F`,
  secondary/tertiary text `#625F58/#827B72`, evergreen accent `#17382F`, deep evergreen
  `#071F19`, soft accent fill `#E8EFE8`, borders `#D8CEC0/#CEC2B2`, and brass `#98713A`.
- **Mirrors:** `app.json`, both native `PoseDetectionView` backgrounds, and the skeleton preview
  script were kept in sync with the new trial `bgBase`.
- **Scope boundary:** colour tokens only. Layout, copy, navigation, state, persistence,
  auth/backend sync, pose detection, scoring, and training logic are unchanged.

## 2026-06-20 — Soft evergreen palette trial

- **Change:** the active palette trial moved to the fourth softer-wellness option: canvas
  `#F5EFE7`, cards `#FCF8F1`, elevated surfaces `#FFFDF7`, primary text `#121512`,
  secondary/tertiary text `#6B716A/#858A80`, evergreen accent `#1A4336`, deep evergreen
  `#0B2A22`, soft accent fill `#EDF3EC`, borders `#E1DBD0/#D7CFC4`, and warm accent
  `#A88A58`.
- **Mirrors:** `app.json`, both native `PoseDetectionView` backgrounds, and the skeleton preview
  script were kept in sync with the new trial `bgBase`.
- **Scope boundary:** colour tokens only. Layout, copy, navigation, state, persistence,
  auth/backend sync, pose detection, scoring, and training logic are unchanged.

## 2026-06-20 — Hale logo applied to app chrome

- **Change:** the selected flat green movement-mark icon is now the source for the iOS, Android,
  and generic Expo launcher icons. A transparent mark-only asset is used beside page/header titles
  so in-app chrome carries the same brand signal without repeating the full rounded icon tile.
- **Scope boundary:** branding assets and header presentation only. Navigation, route keys,
  persistence, auth/backend sync, pose detection, scoring, and training logic are unchanged.

## 2026-06-20 — Progress framed around independence

- **Change:** the Progress page now translates check-up/training signals into daily-life meaning.
  When a local life goal is available, the page shows goal-specific copy and domain rows explaining
  how strength, balance, and mobility support that goal. Without a goal, it falls back to broad
  independence framing.
- **Scope boundary:** Progress-page presentation and copy only. Measurement scoring, training
  progression, persistence, auth/backend sync, pose detection, and navigation behaviour are
  unchanged.

## 2026-06-20 — Original warm-stone palette restored

- **Change:** after testing the four premium palette options, the active palette was restored to
  the prior warm-stone + inky-green system: `bgBase #F4EDE6`, card/elevated surfaces
  `#FBF5EF`, primary text `#111412`, secondary/tertiary text `#68706A/#8A908A`, unified green
  accent `#414C34`, transparent soft fills, borders `#E4E0D6/#D8D3C8`, brass accent `#A98243`,
  and Today hero/tab greens `#414C34`.
- **Mirrors:** `app.json`, both native `PoseDetectionView` backgrounds, and the skeleton preview
  script were returned to the restored `bgBase`.
- **Scope boundary:** colour tokens only. Layout, copy, navigation, state, persistence,
  auth/backend sync, pose detection, scoring, and training logic are unchanged.

## 2026-06-20 — Main-plan credit is explicit evidence, not inferred history

- **Change:** Stage 5A remediation introduced a shared main-plan event classifier and session
  work-evidence summary. A session now earns main-plan/adherence/rotation/progression/sync credit
  only when it is an active-block generated A/B/C template and at least one planned exercise is
  explicitly completed.
- **Fail-closed rule:** preset/manual/retest-prep/legacy-fallback sessions, missing template/date
  metadata, missing `mainPlanCredit`, all-skipped results, duplicate/malformed result items, and
  restored legacy rows no longer advance A/B/C rotation or block progress.
- **Scope boundary:** this closes Stage 5A F5-001 through F5-004 only. Stage 5B primary-focus
  minimum stimulus checks and later timing/profile/selection safeguards remain separate follow-up
  work.

## 2026-06-20 — Main-plan credit requires completed primary focus stimulus

- **Change:** Stage 5B remediation added a focus-stimulus evidence gate. A block-generated A/B/C
  session advances the main plan only when the user completes at least one planned exercise whose
  structured metadata has `stimulusRole === 'primary'` and whose `intendedDomain` matches the
  active `MovementBlock.focusDomain`.
- **Honesty rule:** supporting-, fallback-, maintenance-, malformed-metadata-, missing-metadata-,
  legacy-fallback-, and cross-domain-only attempts can be saved as non-credit generated session
  summaries, but they do not advance rotation, adherence, week completion, milestones, block
  completion, or retest due state.
- **Metadata:** generated plans now expose `metadata.focusStimulus`, and generated session
  summaries/completion JSON can carry `focusStimulusEvidence` alongside Stage 5A work evidence.
- **Scope boundary:** this closes Stage 5B F5-006 only. Generator selection, safety gates,
  stimulus-role definitions, exercise progression policy for non-credit work, and later Stage 5
  timing/profile/equipment safeguards are unchanged.

## 2026-06-21 — Clean Ivory palette trial

- **Change:** the active palette trial moved to the cleaner white/ivory option: canvas
  `#FAF8F4`, cards `#FFFFFF`, elevated surfaces `#FCFBF8`, primary text `#111412`,
  secondary/tertiary text `#68706A/#8A908A`, primary green `#3F4A38`, deeper pressed green
  `#364030`, soft green fill `#EEF3EA`, borders `#E7E4DE/#DAD6CD`, and brass accent
  `#A98243`.
- **Revert memory:** the original warm-stone palette is retained in code as
  `previousWarmStonePalette` and was `bgBase #F4EDE6`, card/elevated surfaces `#FBF5EF`,
  unified green `#414C34`, transparent soft fills, borders `#E4E0D6/#D8D3C8`, brass
  `#A98243`, and soft gold `#F4EFE4`.
- **Mirrors:** `app.json`, both native `PoseDetectionView` backgrounds, and the skeleton preview
  script were kept in sync with the new trial `bgBase`.
- **Scope boundary:** colour tokens only. Layout, copy, navigation, state, persistence,
  auth/backend sync, pose detection, scoring, and training logic are unchanged.

## 2026-06-21 — White Botanical palette trial

- **Change:** the active palette trial moved to the fresher White Botanical option: canvas
  `#F8FAF7`, cards `#FFFFFF`, elevated surfaces `#FDFEFC`, primary text `#101513`,
  secondary/tertiary text `#66716A/#8A948D`, primary green `#2F4A3D`, deeper pressed green
  `#263E33`, soft green fill `#ECF4EF`, borders `#E1E7E0/#D6DED5`, and brass accent
  `#A77A3B`.
- **Revert memory:** the original warm-stone palette is still retained in code as
  `previousWarmStonePalette` and was `bgBase #F4EDE6`, card/elevated surfaces `#FBF5EF`,
  unified green `#414C34`, transparent soft fills, borders `#E4E0D6/#D8D3C8`, brass
  `#A98243`, and soft gold `#F4EFE4`.
- **Mirrors:** `app.json`, both native `PoseDetectionView` backgrounds, and the skeleton preview
  script were kept in sync with the new trial `bgBase`.
- **Scope boundary:** colour tokens only. Layout, copy, navigation, state, persistence,
  auth/backend sync, pose detection, scoring, and training logic are unchanged.

## 2026-06-21 — Porcelain Sage palette trial

- **Change:** the active palette trial moved to the third cleaner option: porcelain canvas
  `#F7F6F1`, cards `#FFFFFF`, elevated surfaces `#FCFBF7`, primary text `#111412`,
  secondary/tertiary text `#636C66/#89918A`, sage-green action colour `#385346`, deeper
  pressed green `#2D4338`, soft green fill `#EEF3EF`, borders `#E4E5DD/#D8DCD3`, and brass
  accent `#9E7C45`.
- **Revert memory:** the original warm-stone palette is still retained in code as
  `previousWarmStonePalette` and was `bgBase #F4EDE6`, card/elevated surfaces `#FBF5EF`,
  unified green `#414C34`, transparent soft fills, borders `#E4E0D6/#D8D3C8`, brass
  `#A98243`, and soft gold `#F4EFE4`.
- **Mirrors:** `app.json`, both native `PoseDetectionView` backgrounds, and the skeleton preview
  script were kept in sync with the new trial `bgBase`.
- **Scope boundary:** colour tokens only. Layout, copy, navigation, state, persistence,
  auth/backend sync, pose detection, scoring, and training logic are unchanged.

## 2026-06-21 — Pearl Eucalyptus palette trial

- **Change:** the active palette trial moved to the fourth, cleanest option: pearl canvas
  `#FAFAF7`, cards `#FFFFFF`, elevated surfaces `#F7F8F4`, primary text `#0F1412`,
  secondary/tertiary text `#5F6A64/#848F88`, eucalyptus action colour `#244B3D`, deeper
  pressed green `#1D3D32`, soft green fill `#F0F5F1`, borders `#E8EAE2/#DCE2D7`, and brass
  accent `#A67B3F`.
- **Revert memory:** the original warm-stone palette is still retained in code as
  `previousWarmStonePalette` and was `bgBase #F4EDE6`, card/elevated surfaces `#FBF5EF`,
  unified green `#414C34`, transparent soft fills, borders `#E4E0D6/#D8D3C8`, brass
  `#A98243`, and soft gold `#F4EFE4`.
- **Mirrors:** `app.json`, both native `PoseDetectionView` backgrounds, and the skeleton preview
  script were kept in sync with the new trial `bgBase`.
- **Scope boundary:** colour tokens only. Layout, copy, navigation, state, persistence,
  auth/backend sync, pose detection, scoring, and training logic are unchanged.

## 2026-06-21 — Original warm-stone palette restored after clean trials

- **Change:** after testing the cleaner Palette 1-4 options, the active palette returned to the
  original warm-stone + inky-green system: `bgBase #F4EDE6`, card/elevated surfaces
  `#FBF5EF`, primary text `#111412`, secondary/tertiary text `#68706A/#8A908A`, unified green
  accent `#414C34`, transparent soft fills, borders `#E4E0D6/#D8D3C8`, brass accent
  `#A98243`, and Today hero/tab greens `#414C34`.
- **Mirrors:** `app.json`, both native `PoseDetectionView` backgrounds, and the skeleton preview
  script were restored to the original `bgBase`.
- **Scope boundary:** colour tokens only. Layout, copy, navigation, state, persistence,
  auth/backend sync, pose detection, scoring, and training logic are unchanged.

## 2026-06-21 — Warm-stone surfaces lightened

- **Change:** to make the original palette feel cleaner and more modern without changing the
  brand system, the active canvas was lifted from `#F4EDE6` to `#F7F1EA`, and card/elevated
  surfaces were lifted from `#FBF5EF` to `#FFFDF9`. Text, green actions, borders, brass accents,
  and soft-fill behaviour remain on the restored warm-stone system.
- **Mirrors:** `app.json`, both native `PoseDetectionView` backgrounds, and the skeleton preview
  script were kept in sync with the lighter `bgBase`.
- **Scope boundary:** surface colour tokens only. Layout, copy, navigation, state, persistence,
  auth/backend sync, pose detection, scoring, and training logic are unchanged.

## 2026-06-21 — Warm-stone canvas lifted again

- **Change:** after reviewing the lighter warm-stone pass, the canvas was nudged slightly closer
  to white from `#F7F1EA` to `#F9F5EF`. Card/elevated surfaces remain `#FFFDF9`, and the green,
  text, borders, brass accents, and soft-fill behaviour are unchanged.
- **Mirrors:** `app.json`, both native `PoseDetectionView` backgrounds, and the skeleton preview
  script were kept in sync with the lighter `bgBase`.
- **Scope boundary:** background colour token only. Layout, copy, navigation, state, persistence,
  auth/backend sync, pose detection, scoring, and training logic are unchanged.

## 2026-06-21 — Card shadows softened

- **Change:** shared depth tokens were reduced so cards feel quieter on the lighter canvas:
  `shadow.card` moved from a `0 10px 24px rgba(17,20,18,0.06)` lift to
  `0 6px 16px rgba(17,20,18,0.035)`, native shadow opacity/radius/offset were lowered, and
  Today's helper shadow colour dropped from `rgba(17,20,18,0.06)` to `rgba(17,20,18,0.04)`.
- **Scope boundary:** shadow/depth tokens only. Surface colours, layout, copy, navigation, state,
  persistence, auth/backend sync, pose detection, scoring, and training logic are unchanged.

## 2026-06-21 — Card shadows centered

- **Change:** shared card shadows were changed from bottom-weighted to even halos by setting
  `boxShadow` vertical offset to `0`, native `shadowOffset` height to `0`, and shared Android
  `elevation` to `0`. This makes card depth equally noticeable around the card instead of
  pooling below it.
- **Scope boundary:** shared shadow/depth tokens only. Surface colours, layout, copy, navigation,
  state, persistence, auth/backend sync, pose detection, scoring, and training logic are
  unchanged.

## 2026-06-21 — Developer mock app data toggle

- **Change:** Settings now exposes a development-only `Use mock app data` toggle. It stores
  `settings.devMockDataEnabled` locally, defaults to off, and is ignored by release builds. In
  development, enabled mode feeds deterministic fixture history, assessments, movement blocks,
  completions, reports, and ladder progress into the main tabs so the app can be reviewed as if a
  user has completed a Movement Check-Up and several sessions.
- **New-user preview:** in development with the toggle disabled, the main tabs receive a
  display-only completed-onboarding profile plus empty check-up/block/session state. This previews
  the first-use dashboard after onboarding but before the first Movement Check-Up without deleting
  real local data.
- **Scope boundary:** display state and local settings only. Persisted history, adherence,
  training, auth/backend sync, scoring, pose detection, and real session logic are unchanged.

## 2026-06-21 — First Movement Check-Up can be deferred

- **Change:** onboarding now offers a user-facing "Do this later" action on camera setup. It
  completes the first-run setup and returns the user to Today without creating a synthetic
  check-up, assessment, movement-age estimate, or training block.
- **Product boundary:** the Movement Check-Up remains the gateway to personalization. If the
  user defers it, Today stays in the "Start Movement Check-Up" state until a usable official
  baseline is completed.
- **Replaced:** the dev-only "skip Movement Check-Up" shortcut was removed from the onboarding
  camera setup screen.

## 2026-06-21 — Camera-unavailable fallback for recording screens

- **Change:** camera-backed recording screens now check whether the requested camera is
  available before mounting the native pose view. If the camera or MediaPipe startup path is
  unavailable, the recording viewport shows a centered "Camera not available" notice instead
  of crashing or replacing the whole app screen.
- **Emulator guard:** development Android emulators are treated as camera-unavailable in the
  JS safe wrapper before native mount. Their virtual camera can be advertised by Android while
  still being unusable for the native pose pipeline, especially when the dev client has not
  been rebuilt with the latest native availability probe.
- **Scope boundary:** this is a resilience and emulator-design fallback only. It does not
  synthesize landmark frames, complete measurements, or change scoring/training behavior.

## 2026-06-21 — Isolated beta landing website

- **Change:** a separate `website/` Next.js application was added for the Hale beta landing
  page. It reuses the current app logo, approved image assets, Inter/Fraunces font files, and
  active warm-stone + inky-green tokens without importing React Native code.
- **Signup:** beta interest is handled by a server-side route with a Supabase-first persistence
  path and a local development/test fallback. Service-role credentials stay server-only.
- **Scope boundary:** the mobile app runtime, navigation, training logic, pose pipeline,
  Supabase mobile auth/sync services, and existing app package remain unchanged.

## 2026-06-21 — Movement Dashboard made read-only

- **Change:** eligible official Movement Check-Ups now prepare the current 4-week block
  automatically. The Movement Dashboard is a read-only results snapshot; it no longer asks the
  user to create a block manually.
- **Flow:** baseline completion saves the result, creates the first block, and shows the
  starting picture. Official re-tests continue to complete the old block, create a report, and
  prepare the next block. Extra/manual check-ups remain display-only and never overwrite the
  active plan.
- **Recovery:** if local state has an eligible official check-up but no active block, Hale
  prepares the missing block quietly from the same eligibility rules instead of surfacing a
  manual creation step.

## 2026-06-21 — Movement block source ID clarified

- **Change:** `MovementBlock` now stores its originating check-up local ID as
  `sourceCheckUpId`. The previous `sourceAssessmentId` name is retained only as a deprecated
  legacy persistence alias and is migrated on load.
- **Why:** block creation, report generation, and backend sync resolve reports from the check-up
  record, not always from a `MovementAssessment.id`; the old name obscured that contract and
  invited future detail/report bugs.
- **Compatibility:** backend sync and report sync resolve either field while old local data is
  still present. `StoredCheckUp.sourceAssessmentId` remains unchanged because that field really
  does point to the movement assessment attached to the stored check-up.

## 2026-06-22 — Clean-slate lapses route to restart session

- **Change:** active blocks that reach the 7-day `resume_gently` lapse state now route Today
  to the clean-slate restart intro and generate a shorter `restart` session. The 14-day
  `restart_recommended` state keeps the same route.
- **Why:** the restart intro is the useful recovery doorway. A weekly summary for an inactive
  week duplicated the same message but only offered `Done`, so missed-week recovery now sends
  users directly to action.
- **Scope boundary:** the weekly summary data model remains available for future completed or
  partially completed week reflection, but the inactive weekly-summary screen is not mounted
  in the active app flow and the unused screen component was removed.

## 2026-06-22 — Local Hale data is scoped to the signed-in user

- **Change:** the app's local profile, check-up history, training, micro-check, and adherence
  stores now use a per-auth-user filesystem scope under the existing local store root.
- **Why:** signing in with a different Google/Apple/email account on the same device must never
  inherit another user's onboarding state, results, training plan, or progress. A new account
  should see clean local state and either run onboarding or restore only its own remote data.
- **Sign-out behavior:** signing out no longer needs to delete the returning user's local cache.
  The signed-in app shell remounts by authenticated user id, and local sync/restore work waits
  for a concrete user id before reading or writing account-bound data.

## 2026-06-22 — Canonical training safety cues

- **Change:** V1 training now resolves setup, active, repeated-set, recovery, and session-global
  safety guidance from canonical cue IDs. Generated and manual session plans persist cue IDs and a
  fingerprint, while visible text is resolved from the current cue vocabulary.
- **Player path:** the training player surfaces global stop rules once, exercise setup cues before
  countdown, short between-set reminders, and tracking/setup recovery guidance. Pause, repeat,
  skip, and stop controls remain available in the live session screen.
- **Audio boundary:** safety cue wording is wired into the build-time audio generator, but no new
  bundled ElevenLabs assets were generated in this pass. Until those files are produced and
  committed, safety cue text is present and the player skips unavailable bundled cue assets rather
  than crashing; full text/voice parity remains blocked on audio generation.

## 2026-06-22 — Micro-check becomes prominent after weekly training target

- **Change:** the weekly micro-check is now a post-target check-in. Today keeps training as the
  primary action while the current week's main-plan session target is still incomplete. Once the
  target is complete, Hale promotes the 60-second micro-check if it has not already been completed
  in that schedule window.
- **Why:** the micro-check is progress evidence, not the core habit. Surfacing it only after the
  weekly target is complete avoids competing with the main training flow while still keeping the
  trend line alive between full Movement Check-Ups.
- **Consistency:** the rule lives in `isMicroCheckDueForSchedule` and is shared by Today lifecycle
  and the older next-best-action helper. End-of-block waiting before re-test uses the same
  due/uncompleted check.

## 2026-06-22 — Life goals bias workout choices without overriding check-up focus

- **Change:** structured life goals now produce a workout-bias profile: preferred support
  domains, slot types, and ladder IDs. Session generation applies that bias by reordering
  compatible slot ladder preferences and non-primary support slots before the existing safety,
  equipment, release, discomfort, and movement-capability filters run.
- **Boundary:** a clear Movement Check-Up focus remains authoritative. Life goals can only affect
  focus selection when the scoring policy already marked an exact or near tie and no active
  focus is being preserved.
- **Compatibility:** `custom` remains readable for legacy local data but is not exposed as an
  onboarding preset. Goals such as `noticed_decline` intentionally stay close to the check-up
  result with no ladder-level bias.

## 2026-06-22 — Safety Profile answers influence generated sessions

- **Change:** saved setup discomfort now maps known notes such as knee, hip, back, shoulder,
  ankle/foot, and neck into the existing discomfort policy when no daily pain input is supplied.
  Daily pain still wins for that session.
- **Activity and age:** `very_inactive` applies a gentler starting session intensity so first
  sessions choose lower volume/easier levels where available. Age does not select movements or
  levels; the oldest onboarding band only adds a small rest buffer.
- **Boundary:** check-up focus, movement capability gates, equipment, release policy, daily
  readiness, and daily pain remain stronger than saved profile preferences.
