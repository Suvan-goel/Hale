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

## 2026-06-22 — Dev-only onboarding synthetic check-up shortcut

- **Change:** the onboarding camera setup screen now shows a `__DEV__`-only "Dev: use sample
  check-up" action. It feeds `syntheticCheckUp()` through the normal baseline completion path,
  so history, scoring, movement assessment, first-block preparation, and the onboarding results
  pages behave as if a real baseline Movement Check-Up completed.
- **Product boundary:** production users still cannot skip into personalized results. The
  user-facing "Do this later" path remains non-synthetic and still creates no check-up,
  movement-age estimate, assessment, or block.
- **Implementation boundary:** the synthetic fixture is required only inside the guarded dev
  callback, not imported into the production execution path.

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

## 2026-06-23 — Onboarding age bands are separate from exact age

- **Change:** onboarding age selection now stores `profile.ageBand` separately from exact
  `profile.age`. The safety profile may still carry a representative age for broad recovery
  tuning, but display and profile sync preserve the selected band instead of pretending it is an
  exact age.
- **Compatibility:** legacy saved profiles that only contain representative ages such as `60`
  migrate to the matching `ageBand`; exact ages entered after this change keep `ageBand: null`.
- **Life goal copy:** the neutral `noticed_decline` option is labeled "Feel stronger overall" to
  keep the original broad-goal tone while preserving its no-bias workout behavior.

## 2026-06-24 — Android pose latency remediation keeps Full as production model

- **Change:** the native pose module and live camera screens now default/pass
  `modelVariant="full"`, making `pose_landmarker_full.task` the production path again. The
  Android diagnostics path records the exact loaded asset, requested/selected delegate, GPU
  fallback status, running mode, analysis resolution, image dimensions/format/rotation, rates,
  and native event coalescing counters.
- **Latency controls:** Android diagnostics can A/B `full-video-sync` (`RunningMode.VIDEO` +
  `detectForVideo`) against `full-live-stream` (`RunningMode.LIVE_STREAM` + `detectAsync`), and
  can compare explicit rotated bitmaps with unrotated bitmap input plus
  `ImageProcessingOptions.rotationDegrees`. Analysis-resolution profiles are available for
  640x480, 512x384, and 480x360 without changing preview/video product rules.
- **Freshness boundary:** native landmark event delivery is latest-only: newer accepted results
  replace a pending main-thread emission, older/equal frame ids are rejected, and live-stream
  mode closes busy frames before bitmap conversion instead of queueing or converting frames that
  cannot be submitted.

## 2026-06-24 — Android LIVE metadata rotation emits upright landmarks

- **Root cause:** the Android metadata rotation profile passed `ImageProcessingOptions` to
  MediaPipe but forwarded returned landmarks as if MediaPipe had changed the landmark coordinate
  space. MediaPipe uses the rotation option for the graph input/normalized rect; returned x/y
  landmarks still need to be normalized into Hale's upright, unmirrored output contract.
- **Fix:** metadata mode now keeps passing CameraX's normalized rotation degrees to MediaPipe and
  rotates emitted landmark x/y once in native code before JavaScript sees them. Width/height are
  swapped only in the emitted upright source dimensions for 90/270 degrees. Front-camera mirroring
  remains display-only in the renderer.
- **Boundary:** the existing rotated-bitmap path remains unchanged as the known-correct fallback.
  Diagnostics now show proxy size/rotation, ImageProcessingOptions rotation, MPImage size,
  emitted upright size, camera facing, mirror state, and renderer input dimensions.

## 2026-06-24 — Movement Profile V2 auto-prepares local closed-beta plans

- **Change:** when a valid internal Movement Profile V2 Check-Up freezes its snapshot and
  assessment, Hale now automatically creates or reuses a local 4-week `MovementBlock` before
  showing the Movement Profile. The results CTA is "View my 4-week plan" and only navigates to
  the already-prepared plan; it does not build, create, generate, or personalise a plan.
- **Contract:** V2 blocks carry `origin.kind = movement_profile_v2_assessment`, the frozen
  assessment/snapshot fingerprints, the source check-up type, a deterministic block
  fingerprint, and a stable id of `movement-block-v2:<encoded-assessment-id>`. Same-id/same-
  fingerprint material is reused. Same-id/different-fingerprint, source mismatch, malformed or
  future artifacts, needs-retake outcomes, and active-block conflicts fail closed.
- **Balanced blocks:** `balanced` remains a block focus kind, not a `MovementDomain`. Balanced
  V2 blocks have no fake `focusDomain`; their A/B/C sessions use explicit source templates:
  `balanced-A -> strength-A`, `balanced-B -> balance-B`, and `balanced-C -> mobility-C`.
- **Waiver truth:** this is software implementation for invite-only closed beta only.

```text
PHYSICAL DEVICE VALIDATION NOT PERFORMED
PHYSICAL DEVICE VALIDATION WAIVED BY PRODUCT OWNER FOR INVITE-ONLY CLOSED BETA
DEVICE BEHAVIOUR NOT YET VERIFIED
BETA TESTERS WILL BE THE INITIAL DEVICE-VALIDATION COHORT
PUBLIC RELEASE REMAINS BLOCKED
```

## 2026-06-24 — Sculpted figure stays diagnostics-only for visual benchmarking

- **Change:** added a benchmark-only `sculpted-figure` mode backed by explicit renderer mode
  `sculpted_body`. It uses the existing SVG stack, raw pose landmarks, the latest-frame RAF
  scheduler, and a fixed low-complexity graphite figure: 14 static transformed shapes plus 2
  dynamic paths.
- **Boundary:** production defaults remain `point_cloud_body`; `sculpted_body` is not accepted
  through the env/default renderer resolver and is not selected by live session, check-up,
  micro-check, or training screens.
- **Evidence:** synthetic replay over 180 frames measured sculpted geometry at p50 0.015 ms,
  p95 0.059 ms, p99 0.379 ms, max 0.705 ms with exactly 16 primitives. No physical benchmark was
  collected in this pass.

## 2026-06-24 — Matte graphite digital twin replaces sculpted benchmark prototype

- **Change:** the rejected `sculpted-figure`/`sculpted_body` benchmark prototype was removed and
  replaced with `matte-graphite-digital-twin` backed by explicit renderer mode
  `matte_graphite_digital_twin`. The new renderer uses one SVG root, static matte graphite
  gradients, and 8 dynamic filled surface paths: a continuous head-neck-torso-pelvis shell, four
  continuous limb surfaces, two tonal overlays, and one tiny Hale sternum accent.
- **Calibration:** raw landmark positions remain unsmoothed. Only slow-changing body proportions
  are calibrated from a short benchmark-run sample window and then locked; renderer remount/reset
  clears both metrics and calibration.
- **Boundary:** production defaults remain `point_cloud_body`; the digital twin is still
  benchmark-only, not accepted through env/default renderer selection, and not selected by
  check-up, training, micro-check, recording, or production session screens.
- **Evidence:** synthetic replay over 180 frames measured matte-graphite geometry at p50
  0.044 ms, p95 0.187 ms, p99 0.675 ms, max 1.338 ms with 8 surface paths and 92 internal
  control vertices. No physical benchmark was collected in this pass.

## 2026-06-24 — Rigged human silhouette replaces matte benchmark prototype

- **Change:** the rejected `matte-graphite-digital-twin`/`matte_graphite_digital_twin`
  prototype was removed from active source and replaced with `rigged-human-silhouette` backed
  by explicit renderer mode `rigged_human_silhouette`. The new renderer remains SVG-only and
  benchmark-only: one SVG root, 7 visible filled surface paths, no filters, no raster assets,
  and no new runtime dependency.
- **Rig:** the renderer uses an original normalized front/side rest template with identical
  112-control-point topology, 17 virtual bones, one- or two-influence control-point skinning,
  width-based front/side orientation hysteresis, and benchmark-run proportion calibration.
  Landmark positions stay raw and unsmoothed; only proportions and orientation state are
  low-frequency state.
- **Boundary:** production defaults remain `point_cloud_body`; `rigged_human_silhouette` is not
  accepted through env/default renderer selection and is not selected by check-up, training,
  micro-check, recording, or production session screens. The JavaScript benchmark renderer still
  uses the existing latest-frame RAF scheduler and does not change MediaPipe, native camera,
  or scheduler behavior.
- **Evidence:** synthetic replay over 180 frames measured rigged-silhouette geometry at p50
  0.046 ms, p95 0.131 ms, p99 0.318 ms, max 1.711 ms with 7 visible surface paths, 112 internal
  control points, and 17 virtual bones. No physical benchmark was collected in this pass.

## 2026-06-24 — Measurement protocol and side metadata becomes canonical

- **Change:** check-up and micro-check persistence now use canonical measurement protocol and
  side metadata: protocol id/version/variant, side role, selected side, observed side when
  available, side source, anchor side, comparability status, and stable reason codes.
  Metadata is additive inside the existing local/backend JSON envelopes; no Supabase migration
  was introduced.
- **Policy:** FD-002 is enforced in history/trend surfaces by requiring matching protocol and
  side series before showing direct change claims. Legacy side-dependent records with missing
  side remain valid raw history but default to `side_unknown_raw_only`. Chair stand, chair
  power, TUG, and standing hinge reach remain side-independent comparison series.
- **Boundary:** the future eyes-open balance protocol was not implemented or registered.
  Single-leg and mobility micro-checks now fail closed to raw-only unless explicit side metadata
  is supplied by a later side-aware UI/voice pass. MPV2 side selectors prefer stored
  `measurementContext` and fall back to older raw side fields.
- **Evidence:** `npx tsc --noEmit`, `npm run verify:audio`, focused metadata/history/backend/
  progress suites, and MPV2 live/voice/recovery suites passed. Audit verdict is
  `REMEDIATION_REQUIRED` for deferred side-aware micro-check UI and dedicated opposite-side
  fallback copy/action. Physical-device QA remains deferred.

## 2026-06-24 — Side-aware measurement UX pins side before capture

- **Change:** side-dependent micro-checks now resolve side through a pure setup helper before
  camera capture: existing side-known micro-check series first, compatible official balance
  anchor second, explicit user choice otherwise. The runner is only created after the side is
  pinned, and the resulting measurement context travels through the existing local/backend
  persistence path.
- **Policy:** mobility micro-checks do not borrow official shoulder, hinge, or balance side
  metadata. MPV2 balance and shoulder retests show a normal same-side path plus a dedicated
  "Use the other side" warning path. Confirmed fallback persists as reduced comparability and
  does not overwrite the usual side anchor.
- **Boundary:** eyes-open balance protocol V2 was not implemented. No audio assets were
  generated or changed, and no external speech/audio API was called.
- **Evidence:** post-UX audit verdict is `SIDE_PROTOCOL_FOUNDATION_COMPLETE` with P0/P1/P2/P3
  counts `0/0/0/1`; the remaining P3 is deferred physical Android/iOS QA.

## 2026-06-24 — Constellation V2 benchmark modes use Android native Canvas

- **Change:** the diagnostics benchmark now preserves `point-cloud-900` as the clarified
  `Current 900-dot SVG` baseline and adds Android-only `constellation-v2-900-native` and
  `constellation-v2-600-native` modes. The V2 modes are rendered inside the local
  `expo-pose-detection` native view with deterministic fixed topology, stable point identity,
  preallocated point buffers, and up to 7 `Canvas.drawPoints` batches.
- **Boundary:** production renderer defaults and screens remain unchanged. V2 modes are exposed
  only through the diagnostics benchmark, iOS accepts the shared props as no-ops, and no Skia or
  other dependency was added. The MediaPipe model, delegate, rotation metadata path, latest-only
  native-to-JS event delivery, and JS benchmark baseline renderer were not changed.
- **Evidence:** Android unit tests cover topology determinism/counts/roles, transform finiteness,
  contain/mirror mapping, calibration reset/lock, and the existing native latest-event scheduler.
  JVM synthetic transform metrics were V2 900 p50/p95/p99 `0.0774/0.2115/0.2293 ms` and V2 600
  p50/p95/p99 `0.0301/0.0431/0.0555 ms`; no physical benchmark was collected in this pass.

## 2026-06-24 — Constellation V2 600 retuned toward the 900-dot figure

- **Finding:** the first `constellation-v2-600` pass read too sparse and outline-heavy compared
  with the current 900-dot point-cloud baseline. Sparse roles could also bunch within only part of
  a body capsule because local coordinates were generated from the whole-region index range.
- **Change:** the 600 topology now uses role-local sampling so boundary, structural, and interior
  points span the full length of each body region. Its allocation was retuned toward a perceptual
  900-dot body: more torso/neck/forearm/hand continuity, fewer oversized foot clusters, a calmer
  boundary ratio, and a slightly stronger structural/accent allowance. Native Canvas paints now use
  the app's inky text, secondary stone, and mature Hale green (`#111412`, `#68706A`, `#414C34`)
  with less oversized 600-mode dot radii.
- **Boundary:** this remains Android benchmark-only and visual-only. Production renderer defaults,
  JS point-cloud baseline, MediaPipe inference, pose pipeline, scoring, check-up, and training
  logic are unchanged.
- **Evidence:** focused native unit tests passed for Constellation V2 topology and transform
  coverage: `./gradlew :expo-pose-detection:testDebugUnitTest --tests
  'expo.modules.posedetection.ConstellationV2TopologyTest' --tests
  'expo.modules.posedetection.ConstellationV2TransformTest'`. Physical-device visual review is
  still required before promoting any V2 native mode.

## 2026-06-24 — Android recording screens remain on video rotation at 640x480

- **Change:** after a brief live-stream metadata experiment, training, Movement Check-Up,
  micro-check, and the direct internal MPV2 check-up camera views now share
  `ANDROID_VIDEO_ROT_640_POSE_PROFILE`: MediaPipe synchronous video mode, rotated bitmap
  handling, and 640x480 Android analysis resolution. The unified MPV2 shell inherits this
  through `CheckUpRecordingShell`.
- **Boundary:** this restores the production recording-screen native profile to the benchmark
  equivalent of `VIDEO rot 640`. iOS continues to treat the Android profile props as no-ops,
  and benchmark-only renderer modes remain benchmark-only.
- **Evidence:** `npx tsc --noEmit` passed before this rollback; a fresh typecheck should be run
  with the final worktree before release. Physical Android regression testing remains required
  for chair reps/rise velocity, balance holds, ROM peaks, and micro-check timing.

## 2026-06-24 — Shadow silhouette benchmark renderer follows MediaPipe limbs

- **Change:** added a benchmark-only `shadow-silhouette` renderer mode that builds a filled,
  continuous-looking human shadow directly from MediaPipe landmarks. The body uses an overlapping
  sculpted head, neck bridge, torso, pelvis, tapered arm, hand, leg, foot, and restrained material
  highlight paths so shoulders, hips, elbows, and knees read as seamless body surfaces instead of
  exposed skeleton lines or dot clusters.
- **Boundary:** production recording screens and renderer defaults remain unchanged. The new mode
  is accepted only when passed explicitly through renderer props, is rejected by env/default
  renderer selection, uses no image/raster assets, and does not add dependencies.
- **Evidence:** focused geometry tests cover low path count, finite paths, far-side limb dropping,
  and limb-following movement. The headless renderer replay includes the new mode and measured 6
  visible surface paths, 14 simple sub-shapes, and local JS geometry p50/p95 `0.041/0.088 ms` over
  the synthetic replay stream. Physical-device visual review remains required before replacing the
  current 900-dot production figure.

## 2026-06-25 — Stipple sensor shadow explores a refined particle-human figure

- **Change:** replaced the discarded volumetric/matte benchmark direction with a user-facing
  `stipple-sensor-shadow` benchmark inspired by the current 900-dot figure and the product-owner
  reference: a dense, technical-but-refined microdot human silhouette. The internal renderer still
  uses `volumetric_shadow` explicit props, but the benchmark now requests 3,000 logical dots,
  shifts deterministic density toward torso/head/neck mass, uses tiny batched circles instead of
  toy-like blobs, and adds only a very low-opacity MediaPipe-following silhouette haze underneath
  the dots to close gaps.
- **Boundary:** production recording screens and renderer defaults remain unchanged. The mode is
  explicit-props only, rejected by env/default renderer selection, uses no raster assets, makes no
  runtime image-generation calls, and adds no dependencies. This is still a benchmark prototype
  for visual review before any production recording-screen replacement.
- **Evidence:** focused geometry tests cover finite batched paths, capped dense mark count,
  far-side confidence degradation, and landmark-following movement. The headless replay includes
  the new mode and measured 3,000 logical dots, 3,005 rendered primitives including the subtle
  haze surfaces, 9 active SVG path layers on the synthetic stream, and local JS geometry p50/p95
  `0.985/1.641 ms`. Physical Android/iOS visual and latency review remains required before
  promoting this heavier figure beyond the benchmark screen.

## 2026-06-25 — Refined 900-dot benchmark keeps the point-cloud direction lightweight

- **Change:** added a benchmark-only `refined-point-cloud-900` variant beside the existing
  current 900-dot SVG baseline. It keeps the same point-cloud renderer and dot-first visual
  identity, but uses a new `refined` body shape profile with fewer extremity/keypoint marks, more
  visual mass in the torso/head/neck, larger dot scale, unique deterministic cluster seeds, and
  explicit joint/collar/pelvis bridge clusters so shoulders, hips, elbows, knees, pelvis, and the
  head-to-neck transition read as one fuller dot-built figure rather than separate body parts.
- **Boundary:** production recording screens and renderer defaults remain unchanged. The profile
  is opt-in through explicit renderer props, uses no raster assets or image-generation runtime,
  adds no native or JS dependency, and keeps the benchmark at a 900-dot cap with no connection
  lines.
- **Evidence:** focused geometry/config/benchmark/diagnostics tests pass, and `npm run
  pose-renderer-replay` includes the new mode. On the synthetic replay stream, the refined profile
  rendered 900 dots / 900 primitives with no lines and local JS geometry p50/p95 `0.285/0.431 ms`,
  compared with the current full point-cloud body at 894 dots and p50/p95 `0.273/0.356 ms`.
  Physical-device visual review remains required before promoting it beyond the benchmark screen.

## 2026-06-25 — Landing page shifts to one-page empathy-to-trust narrative

- **Change:** the website landing page is now planned and implemented as a single scrollable
  ad destination for adults 45+ who may be skeptical, privacy-conscious, and reluctant to pay
  for another fitness product. The structure moves from emotional recognition, to measurement
  explanation, to practical home training, to privacy/trust, to beta access and FAQ.
- **Rationale:** splitting the product story across several pages adds navigation decisions for
  less tech-confident users and weakens the guided conversation. A single page lets Hale connect
  everyday friction (chairs, stairs, stiffness, steadiness and independence) to the Movement
  Check-Up, then show why the home plan is calmer and more personal than generic exercise videos.
- **Boundary:** the landing page remains wellness-only and avoids medical claims. Privacy copy
  continues to emphasize skeleton-only camera display, no mirror view, no public profiles, and
  beta transparency.

## 2026-06-25 — Training both-sides rounds preserve source dose behind closed gates

- **Change:** added a default-closed both-sides round engine for the six FD-001 training levels:
  single-leg hold, tandem hold, chair-supported split squat, seated hamstring reach, supported
  hip-flexor stretch, and wall calf stretch. Each generated internal plan pins an initial side,
  alternates first side by round, completes both sides before rest, and preserves the source
  active dose exactly.
- **Policy:** no source-proven minimum currently forces an adjustment, so all six use direct
  half-set conversion. Main-plan start-side seeds default left and flip only after successful
  main-plan completion; manual practice does not mutate the main-plan seed. Hip-flexor side
  semantics store the stretched rear hip side, not the forward foot.
- **Boundary:** live legacy training remains unchanged. Training Voice V2.1 and Balance V2 remain
  default-closed; no audio was generated, changed, listened to, or approved, and no external
  speech/audio API was called. Step-up alternating-leading-leg support was not implemented.
- **Evidence:** audit verdict is `TRAINING_BOTH_SIDES_ROUNDS_SOFTWARE_COMPLETE` with P0/P1/P2/P3
  `0/0/0/0`. `npm run verify:audio`, `npx tsc --noEmit`, the focused both-sides/V2.1 suites,
  broader training/backend/MPV2/measurement regressions, and the Balance V2 audit passed.

## 2026-06-25 — Step-up alternation model is software-complete and default-closed

- **Change:** added a default-closed FD-005 step-up alternation model. A valid step-up set remains
  one 12-rep set with 6 accepted left-leading reps and 6 accepted right-leading reps. The expected
  lead flips only after an accepted rep; wrong, invalid, duplicate, stale, interrupted, paused, and
  restored partial attempts do not credit, flip, or play rep SFX.
- **Policy:** set start lead is pinned from the shared main-plan start-side seed and alternates by
  set start (`L/R/L` or `R/L/R`). The seed flips only after successful main-plan completion;
  manual/Explore practice does not mutate it.
- **Boundary:** live legacy step-up grading was not replaced. Training Voice V2.1 remains
  default-closed, safety/audio/global gates remain closed, no audio assets or manifests changed,
  Balance V2 remains default-closed, and the floor-transfer readiness gate was not implemented.
- **Evidence:** audit verdict is `TRAINING_STEP_UP_ALTERNATION_SOFTWARE_COMPLETE_DEFAULT_CLOSED`
  with 27/27 scenarios passing, P0/P1/P2/P3 `0/0/0/0`, remaining
  `IR-VOICE-STEP-ALTERNATION` blockers `0`, and audio asset diffs `0`.

## 2026-06-25 — Landing page proof pass makes the beta offer more tangible

- **Change:** added concrete check-up examples, an explicitly labelled HTML/CSS sample result,
  plain credibility copy, and beta signup reassurance to the website landing page. The proof pass
  avoids new imagery and keeps all new content editable in the landing content module.
- **Boundary:** the sample result is illustrative only and does not change app scoring, pricing,
  signup persistence, store-link behavior, or public APIs. Copy remains wellness-only: movement-age
  ranges are framed as guidance where appropriate, not diagnosis or exact biological age.
- **Evidence:** website unit and e2e tests now guard the sample-result label, concrete movement
  examples, equipment truthfulness, no payment-detail collection on the signup form, and no
  diagnostic positioning.

## 2026-06-25 — Landing page visual polish reduces card-heavy structure

- **Change:** refined the website landing page structure so the hero flows into a full-width page
  guide, the proof and credibility material reads as editorial bands, and repeated process,
  measurement and trust details use ruled layouts instead of stacked cards.
- **Boundary:** this is a visual and structural CSS pass only. It does not change the landing copy
  claims, pricing behavior, signup flow, public APIs, imagery, or dependencies.
- **Evidence:** live desktop and mobile visual checks showed no horizontal overflow and a clearer
  section rhythm; website lint, typecheck and unit tests passed before the final build and e2e
  verification.

## 2026-06-25 — Contour field avatar added as benchmark-only visual candidate

- **Change:** added a benchmark-only `contour-field-avatar` mode backed by explicit renderer mode
  `contour_field`. The renderer builds a line-field human from MediaPipe torso, head, pelvis and
  limb chains, with head/neck, collar, torso, pelvis, limb, hand and foot contours batched into
  four SVG paths.
- **Rationale:** this explores a direction between the 900-dot technical point cloud and the
  filled silhouette attempts: more premium and human-shaped than sparse dots, but still procedural,
  lightweight and free of image-generation assets or runtime raster compositing.
- **Boundary:** production recording screens and env/default renderer selection remain
  `point_cloud_body`. The contour field is selectable only through benchmark props/replay, adds no
  dependency, uses no camera self-view, and does not change grading, smoothing, or movement logic.
- **Evidence:** focused contour/config/benchmark/diagnostics tests pass, `npm run typecheck`
  passes, and `npm run pose-renderer-replay` reports the contour field at 96 particles, about 149
  contour lines, 245 primitives, 4 dynamic paths, and local JS geometry p50/p95 `0.133/0.227 ms`.
  The same replay reports the refined 900-dot body at 900 primitives and p50/p95
  `0.284/0.410 ms`. Physical-device visual review remains required before promotion.

## 2026-06-25 — Benchmark screen prunes rejected avatar experiments

- **Change:** simplified the pose overlay benchmark selector to the useful comparison set: no
  overlay, raw skeleton, current 900-dot SVG, organic dense dot SVG, production point cloud,
  production without transitions, and Android-only native Constellation V2 900/600.
- **Rationale:** the experimental silhouette, stipple, contour-field, old constellation, and
  225/450 point-cloud density probes were cluttering the screen and no longer represented visual
  directions worth comparing during product design review.
- **Boundary:** this removes those modes from the visible benchmark selector only. The underlying
  experimental renderer modules and replay diagnostics remain available for code archaeology or
  future cleanup, and production recording screens are unchanged.
- **Evidence:** focused benchmark/config tests and `npm run typecheck` pass.

## 2026-06-25 — Balanced organic dot avatar keeps the baseline shape at lower cost

- **Change:** replaced the visible refined 900-dot benchmark candidate with an opt-in
  `organic-balanced-dot-1400` profile. It keeps the procedural point-cloud body renderer but uses
  a lower benchmark-only dot budget than the previous 2,200-dot experiment, removes keypoint marks,
  and uses slightly larger sage dots so the figure stays fuller than the current 894-dot baseline
  with fewer primitives. After visual review, the organic silhouette was pulled back toward the
  current 894-dot figure's baseline proportions: slimmer limb capsules, a less stylized torso
  curve, and subtler pelvis clusters that add cohesion without changing the body outline.
- **Rationale:** the 900-dot figure remains the most polished production direction, but its sparse
  landmarks leave visible breaks at the head/neck and pelvis/leg joins. A denser dot-only profile
  tests the user's particle-human reference without adding raster assets, generated image parts,
  underlays, or connection lines.
- **Boundary:** production recording screens and env/default renderer caps remain at the existing
  point-cloud body budget unless explicit props request the heavier benchmark variant. The profile
  adds no dependency, makes no image-generation/runtime raster calls, and does not change pose
  detection, grading, smoothing, or native camera behavior.
- **Evidence:** focused geometry/config/benchmark/diagnostics tests pass, `npm run typecheck`
  passes, and `npm run pose-renderer-replay` reports the balanced organic profile at 1,400 dots
  with local JS geometry p50/p95 about `0.505/0.711 ms`, compared with the full point-cloud body
  at 894 dots and p50/p95 about `0.284/0.351 ms`. Physical Android/iOS visual and latency review
  remains required before any production promotion.

## 2026-06-25 — Step-up alternation runtime integrated behind internal gates

- **Change:** connected the default-closed step-up alternation model to an explicit training set
  runtime abstraction. `TrainingSessionPlayer` now owns one set runtime, selects the alternation
  runtime only for valid generated step-up items with the feature flag, internal V2.1 mode, and
  injected runtime capability, and suppresses generic rep-credit SFX in that internal path.
- **Policy:** lead evidence is conservative: the runtime requires a per-set bilateral floor
  baseline, one foot initiating while the other remains at the floor boundary, a valid top phase,
  and a stable both-feet return before credit. Wrong or unknown leads do not credit, play SFX, or
  flip the expected side.
- **Persistence:** generated summaries and compact backend sync/restore now retain
  `stepUpAlternationPlan`, `stepUpInitialLeadSide`, `activeSetRuntime`, and the shared
  `bothSidesStartSideSeed`. Successful main-plan step-up completion flips the shared seed once;
  manual/Explore/non-credit paths remain isolated.
- **Boundary:** ordinary app sessions remain legacy because the app passes metadata but not the
  internal runtime readiness switch. Training Voice V2.1 and Balance V2 remain default-closed; no
  audio was generated, changed, listened to, or approved, and the floor-transfer readiness gate was
  not implemented.
- **Evidence:** audit verdict is
  `TRAINING_STEP_UP_RUNTIME_INTEGRATION_COMPLETE_WITH_DEVICE_QA_PENDING` with 53 canonical original
  scenarios retained, 37 integration scenarios added, 16/16 trace links connected or genuinely
  not applicable, missing/partial/legacy/uncertain links `0/0/0/0`, P0/P1/P2/P3 `0/0/0/2`, and
  physical-device QA plus human listening still deferred/waived.

## 2026-06-25 — Matte limb sprite avatar added as a benchmark-only latency probe

- **Change:** added a benchmark-only `sprite-limb-avatar` / `sprite_limb_avatar` renderer option
  named "Matte limb sprites." It maps one static central body mask plus static upper/lower limb,
  hand/foot, and shoulder/hip cap masks onto MediaPipe bone transforms, with small elbow/knee gaps
  so the segments can articulate without overlap.
- **Rationale:** this tests the user's suggestion that generated/static body-part assets could
  reduce latency by replacing a 900-1,400 dot field with a handful of transformed body-part
  surfaces. The first implementation uses deterministic SVG masks rather than PNG assets so the
  pose mapping, primitive count, and motion behavior can be judged before adding generated bitmap
  asset management.
- **Boundary:** production recording screens remain unchanged. The renderer adds no runtime
  image-generation call, no camera self-view, no new dependency, and no grading/pipeline changes.
  If this visual direction is promoted later, the static SVG masks could be swapped for bundled
  generated PNG/WebP textures using the same transform contract.
- **Evidence:** focused sprite geometry, benchmark selector, config, and diagnostics tests pass.
  `npm run pose-renderer-replay` reports the sprite avatar at 0 dots, up to 18 transformed shapes,
  0 dynamic paths, and local JS geometry p50/p95 about `0.019/0.052 ms`, compared with the
  balanced 1,400-dot avatar at p50/p95 about `0.486/0.649 ms` in the same run. Full
  `npm run typecheck` is currently blocked by an unrelated existing audit fixture error in
  `scripts/audits/fixtures/step-up-runtime-evidence-closure/production-runner.ts`.

## 2026-06-25 — Soft continuous silhouette avatar added as option-1 benchmark prototype

- **Change:** added a benchmark-only `soft-continuous-silhouette` option backed by renderer mode
  `soft_silhouette_avatar`. It builds a cohesive matte inky-green figure from five SVG surfaces:
  a continuous head/neck/torso/pelvis core, blended limbs, subtle joint cover shapes, a faint
  internal highlight, and a low-opacity rim stroke.
- **Rationale:** after dot, stipple, contour, and sprite experiments still felt too technical,
  noisy, or puppet-like, this tests the simplest premium wellness direction: one calm human
  presence that follows MediaPipe landmarks without visible dots, hard joints, or generated image
  assets.
- **Boundary:** production recording screens remain on the existing point-cloud renderer. The new
  mode is explicit-props/benchmark-only, adds no dependency, makes no image-generation/runtime
  raster call, and does not alter camera, pose detection, grading, smoothing, or audio behavior.
- **Evidence:** focused soft-silhouette, sprite, benchmark selector, config, and diagnostics tests
  pass. `npm run pose-renderer-replay` reports the soft silhouette at 0 dots, 5 dynamic paths, and
  local JS geometry p50/p95 about `0.037/0.066 ms`, compared with the balanced 1,400-dot avatar at
  p50/p95 about `0.488/0.676 ms` and the current full point-cloud body at about `0.275/0.351 ms`
  in the same run. Full `npm run typecheck` remains blocked by the unrelated audit fixture noted
  above.

## 2026-06-25 — Soft silhouette unified-contour refinement

- **Change:** refined the benchmark-only soft silhouette so its normal path is one unified
  exterior body contour instead of a separately painted torso plus limb capsules. The happy path is
  now three SVG surfaces: unified body fill, subtle internal highlight, and a faint rim. Separate
  limb/blend surfaces are retained only as fallback behavior when the full contour cannot be built.
- **Rationale:** the split-shape version made the arms and legs read as attached tubes and left the
  head/neck/shoulder join feeling puppet-like. A single contour keeps the latency profile low while
  making the torso, limbs, hips, traps, neck, and head feel more cohesive for benchmark review.
- **Evidence:** focused soft-silhouette, benchmark selector, config, diagnostics tests, and
  `npm run typecheck` pass. `npm run pose-renderer-replay` reports the refined soft silhouette at
  0 dots, 3 dynamic paths, and local JS geometry p50/p95 about `0.033/0.067 ms`, compared with the
  balanced 1,400-dot avatar at about `0.482/0.685 ms` and the current 894-dot body at about
  `0.272/0.369 ms` in the same run.

## 2026-06-25 — Benchmark-only Soft Digital Twin renderer added

- **Change:** added a separate benchmark option labeled "Soft digital twin" that renders a
  premium humanoid from MediaPipe landmarks. The initial segmented mannequin pass was refined into
  13 SVG surface paths: continuous left/right arm surfaces, continuous left/right leg surfaces,
  head, neck, ribcage, pelvis, hands, feet, and one subtle occlusion path, with deep
  emerald/graphite gradients instead of dots or skeleton lines.
- **Rationale:** this explores the lower-latency direction of a pose-driven human silhouette with
  believable surface area while keeping it isolated from production camera screens until the visual
  quality is approved. Distal low-confidence landmarks fade or drop only their local segment so one
  bad wrist/ankle does not distort the entire body. Visible elbow/knee/hip joint discs were
  removed because they read as construction markers.
- **Evidence:** focused soft-digital-twin geometry, benchmark selector, config, diagnostics
  replay tests, `npm run pose-renderer-replay`, and `npm run typecheck` pass. The replay reports
  Soft Digital Twin at 0 dots, 13 dynamic paths, and local JS geometry p50/p95 about
  `0.037/0.068 ms`, compared with the 894-dot body at about `0.282/0.366 ms` in the same run.

## 2026-06-25 — Anatomical flow silhouette refinement

- **Change:** pushed the benchmark-only soft silhouette toward the anatomical reference direction:
  the visible option is now labeled "Anatomical flow silhouette" and renders a low-opacity human
  envelope with one batched contour-flow stroke path and one batched node path over the body. The
  head, neck, shoulders, ribcage, pelvis, limbs, hands, and feet use broader proportion envelopes
  instead of reading directly as simple bone capsules.
- **Rationale:** the flat filled silhouette still looked like an abstract pose glyph rather than a
  premium human figure. The reference image works because it describes body anatomy with contour
  lines and landmark density, so this keeps the low-latency SVG-path approach while moving the
  benchmark closer to that visual language.
- **Evidence:** focused soft-silhouette, benchmark selector, config, diagnostics tests, and
  `npm run typecheck` pass. `npm run pose-renderer-replay` reports the anatomical flow silhouette
  at 0 dots, 5 dynamic paths, and local JS geometry p50/p95 about `0.083/0.159 ms`, compared with
  the 894-dot body at about `0.287/0.488 ms` and the balanced 1,400-dot avatar at about
  `0.497/0.709 ms` in the same run.

## 2026-06-25 — Soft silhouette restored to matte surface with outline-only anatomy refinement

- **Change:** removed the anatomical contour and node overlay from the benchmark soft silhouette
  after review clarified that the reference image should inform only the body outline, not the
  surface style. The option is again labeled "Soft continuous silhouette" and uses the previous
  inky-green matte fill and subtle rim, with revised head, neck, shoulder, torso, pelvis, arm, and
  leg envelopes. A follow-up head pass added explicit jaw-angle controls, narrowed the neck under
  the jaw, and softened the trapezius-to-shoulder curve. A torso pass then narrowed the ribcage
  under the shoulder line, reduced the abrupt waist pinch, softened the trunk curves, and restrained
  the pelvis flare so the body reads less like a rigid shield. An arm pass refined the upper-arm,
  elbow, forearm, wrist, and hand width profile so the arms read less like uniform tubes while still
  following the same MediaPipe shoulder-elbow-wrist chain. The internal torso highlight was removed
  after it read as an unintended mark, leaving only the filled body path and rim in the happy path.
  A leg pass smoothed the waist-to-hip-to-thigh tangent, narrowed the upper-thigh root, and replaced
  the pointed groin bridge with a centered U-curve so the legs connect more naturally to the pelvis.
- **Rationale:** the copied contour-field treatment changed the visual direction too much. The
  desired direction is the calmer premium matte figure, but with a more human outline borrowed from
  the reference's silhouette proportions.
- **Evidence:** focused soft-silhouette, benchmark selector, config, and diagnostics tests pass.
  `npm run pose-renderer-replay` reports the restored matte silhouette at 0 dots, 2 dynamic paths,
  and local JS geometry p50/p95 about `0.035/0.075 ms`, compared with the 894-dot body at about
  `0.279/0.368 ms` and the balanced 1,400-dot avatar at about `0.498/0.743 ms` in the same run.
  Full `npm run typecheck` is currently blocked by unrelated `training/voiceV21` safety-policy
  type/module errors.

## 2026-06-25 — Training floor-transfer readiness gate closed at software level

- **Change:** reused `MovementCapabilityProfile.floorTransfer.status` as the sole floor-transfer
  authority, added the approved FD-007 Yes/No/Not sure Safety/Profile question, centralized floor
  exercise eligibility in `deriveFloorExerciseEligibility`, and added default-off Training Floor
  V2.1 setup state so floor sessions require explicit user confirmation plus movement-camera
  readiness before `final-position-set-v21`, countdown, or active work.
- **Rationale:** `floor_space` is only an environment requirement; it must never imply the user can
  get down to the floor and back up. The camera cannot robustly prove every exact floor posture
  without a fragile classifier, so the safe software contract is explicit confirmation after the
  instruction plus stable movement-specific visibility/readiness.
- **Boundary:** no audio was generated or changed, no Training Voice V2.1 default was enabled, no
  Balance V2 or step-up alternation default changed, and live safety-family narration remains the
  next task. `push-up-standard` stays `v1_optional` and release-blocked for generated eligibility.
- **Evidence:** `node scripts/audits/audit-training-floor-readiness.mjs` reports
  `TRAINING_FLOOR_READINESS_SOFTWARE_COMPLETE` with P0/P1/P2/P3 `0/0/0/2`, floor exercise count 3,
  duplicate floor authority count 0, and no audio manifest/file changes.

## 2026-06-25 — Training Voice V2.1 live safety-family integration complete

- **Change:** connected the canonical Training Voice V2.1 safety-family policy to live contract
  resolution without replacing `SafetyCueProfile` authority. Each V2.1 safety plan now records the
  source safety profile schema/fingerprint, source cue ids, deferred reactive cue ids, fulfilment
  mode, absorbed families, subsumed families, and reason codes. Session safety memory now tracks
  universal safety completion, introduced families, first-use ids, and delegates floor-family
  introduction to `TrainingFloorSessionMemory.floorFamilyIntroduced`.
- **Rationale:** V2.1 needs concise normal setup narration, but safety eligibility and current
  hazard requirements must continue to come from the existing safety profile/snapshot system. The
  bridge removes redundant family narration while preserving reactive stop/recovery work as an
  explicit later phase.
- **Boundary:** no audio was generated or changed, no pending logical V2.1 safety cue was added to
  the physical manifest, Training Voice V2.1 remains default off, global behaviour/audio readiness
  remain false, Balance V2 remains closed, step-up alternation remains default off, and V2.1 has
  zero selectable exercises.
- **Evidence:** `node scripts/audits/audit-training-voice-v21-live-safety-integration.mjs` reports
  `TRAINING_VOICE_V2_1_LIVE_SAFETY_INTEGRATION_SOFTWARE_COMPLETE` with 37/37 safety plans ready,
  44/44 atomic safety cues classified, `IR-VOICE-SAFETY-SUBSUMPTION` count 0, duplicate family cue
  count 0, repeat family cue count 0, universal-in-item-setup count 0, and P0/P1/P2/P3 `0/0/0/2`.

## 2026-06-25 — Training Voice V2.1 controls, progress, transitions, and recovery behavior complete

- **Change:** added the default-closed Training Voice V2.1 behavior layer: typed control contracts,
  tracked countdown/go start, optional active progress scheduling, transition de-duplication,
  tracking-loss recovery episodes, reactive safety destinations, mounted voice-switch boundaries,
  and a persisted `activeTrainingVoiceRuntime` envelope. The live player now has an injected
  internal V2.1 path that waits for `go` playback-start before entering active work; legacy remains
  the default path.
- **Rationale:** after safety-family integration, the remaining software blocker was not script
  content but runtime authority: voice may gate a boundary, yet the training controller must remain
  authoritative for accepted reps, skips, sets, recovery, progression, and persistence.
- **Boundary:** no audio was generated or changed, no physical manifest entries were added,
  Training Voice V2.1 remains default off, audio ready remains false, selectable exercises remain
  zero, Balance V2 remains closed/audio pending, step-up alternation remains default off, floor
  V2.1 remains default off, human listening remains waived, and physical-device QA remains
  deferred.
- **Evidence:** `node scripts/audits/audit-training-voice-v21-controls-progress-recovery.mjs`
  reports `TRAINING_VOICE_V2_1_CONTROLS_PROGRESS_RECOVERY_SOFTWARE_COMPLETE`, controls/progress/
  recovery/safety ready all true, global behavior ready true, audio ready false, V2.1 selectable
  exercise count 0, `IR-VOICE-TRAINING-CONTROLS` and `IR-VOICE-TRAINING-RECOVERY` remaining counts
  0, timing hard-max failures 0, audio asset changes 0, and P0/P1/P2/P3 `0/0/0/4`.

## 2026-06-25 — Premium constellation human benchmark renderer added

- **Change:** added a separate `premium_constellation_human` benchmark renderer with three
  presets: `constellationVolume180`, `constellationVolume300`, and `constellationVolume450`.
  It uses the existing deterministic organic point-cloud body rig but renders only premium
  dot-volume paths: no keypoint dots, skeleton lines, solid mannequin surfaces, blur filters, or
  random per-frame particles. The renderer keeps per-preset dot buffers capped to the configured
  budget and fades the previous figure softly when tracking is lost.
- **Rationale:** the solid Soft Digital Twin direction still reads as a geometric mannequin. The
  constellation direction better preserves Hale's privacy-first, sensor-like presence while avoiding
  a mirror, a cartoon avatar, and the overly technical feel of the full 900-dot baseline.
- **Boundary:** production defaults remain `point_cloud_body`; the new renderer is explicit
  benchmark/replay-only and is not accepted by public env renderer selection.
- **Evidence:** focused benchmark/config/replay tests pass, `npx tsc --noEmit --pretty false`
  passes, and `npm run pose-renderer-replay` reports the new presets at 180/300/450 dots with
  geometry p50/p95 about `0.083/0.182 ms`, `0.117/0.185 ms`, and `0.161/0.244 ms`, compared with
  the current 894-dot body at about `0.289/0.490 ms` in the same synthetic run.

## 2026-06-25 — Premium constellation human switched to structured templates

- **Change:** replaced the premium constellation renderer's organic scatter builder with
  deterministic body-part templates for head, neck, torso, upper arms, forearms, hands, thighs,
  shins, and feet. Each preset now has explicit anatomical dot budgets and a surface-biased mix:
  outer silhouette dots carry the head/shoulder/torso/limb shape, while lower-opacity internal dots
  add quiet depth without random dust. The optional guide structure remains off by default.
- **Rationale:** the 450-dot direction was abstractly promising but still read as a random particle
  cloud. Structured local templates make the figure feel more intentionally designed while keeping
  the same pose-driven, non-mannequin visual direction.
- **Boundary:** benchmark options and production defaults are unchanged; this remains an explicit
  benchmark/replay renderer, not a public env-selected production default.
- **Evidence:** focused benchmark/config/replay tests pass, `npx tsc --noEmit --pretty false`
  passes, and `npm run pose-renderer-replay` reports the structured 180/300/450 presets at
  geometry p50/p95 about `0.100/0.186 ms`, `0.144/0.185 ms`, and `0.214/0.296 ms`, compared with
  the current 894-dot body at about `0.277/0.367 ms` in the same run.

## 2026-06-25 — ElevenLabs default generation model moved to Multilingual v2

- **Change:** changed the default build-time ElevenLabs model from `eleven_flash_v2_5` to
  `eleven_multilingual_v2` while keeping the no-runtime-TTS audio law unchanged.
- **Rationale:** Hale bundles voice lines at build time, so low-latency generation is not valuable
  in the user session. Multilingual v2 is the better fit for calm, stable, higher-quality trainer
  narration than the Flash model optimized for real-time applications.
- **Evidence:** `npm run audio` regenerated 364 voice lines for Clara and Marcus plus the
  rep-credit chime using `eleven_multilingual_v2`; `npm run verify:audio` passed with 88 safety
  assets and 62 Movement Profile V2 assets verified.

## 2026-06-25 — Soft Digital Twin matte silhouette polish

- **Change:** refined the benchmark-only Soft Digital Twin renderer without adding a new visual
  direction. The solid figure now removes visible elbow/knee cap emphasis, replaces the dark
  pelvis/crotch patch with a subdued hip bridge, shortens and softens the lower torso closure,
  narrows the neck, restores a more natural egg-shaped head scale, gives limbs a stronger tapered
  width profile, overlaps hands/feet more softly, and centralizes visual tuning constants for head,
  neck, shoulder, limb taper, joint blend, pelvis contrast, material depth, and self-shadow
  opacity.
- **Rationale:** the dot/constellation direction was visually rejected for now, while the solid
  matte human has the best foundation for a calm, premium, non-mirror movement avatar. This pass
  keeps the renderer efficient and benchmark-isolated while reducing mannequin cues and awkward
  anatomical emphasis.
- **Evidence:** focused soft-digital-twin/benchmark/config/diagnostics tests pass, `npx tsc
  --noEmit --pretty false` passes, and `npm run pose-renderer-replay` reports Soft Digital Twin at
  0 dots, 13 dynamic paths, and local JS geometry p50/p95 about `0.037/0.069 ms`, compared with the
  current 894-dot body at about `0.279/0.386 ms` in the same synthetic run.

## 2026-06-25 — Premium Human Balanced preset restores matte figure mass

- **Change:** split the Soft Digital Twin renderer into named visual presets. The previous thin
  tuning remains selectable as `Premium Human · Lean`, while the default benchmark option is now
  `Premium Human Balanced`: broader shoulders/ribcage/hips, a larger egg-shaped head, shorter and
  wider neck, fuller upper arms and thighs, heavier distal hand/foot integration, and a low-contrast
  hip bridge layered over the thigh roots to restore human weight without returning to visible
  elbow/knee discs or a dark crotch patch.
- **Rationale:** the cleaner matte pass removed mannequin seams but overcorrected into a thin
  alien/coat-hanger figure. The balanced preset keeps the same low-latency segmented renderer and
  matte material while moving back toward the earlier solid figure's mass and presence.
- **Evidence:** focused soft-digital-twin/benchmark/config/diagnostics tests pass, `npx tsc
  --noEmit --pretty false` passes, and `npm run pose-renderer-replay` reports both Soft Digital
  Twin presets at 0 dots and 13 dynamic paths. In the synthetic replay, `Premium Human Balanced`
  reports local JS geometry p50/p95 about `0.037/0.055 ms`; `Premium Human · Lean` reports about
  `0.038/0.072 ms`.

## 2026-06-26 — Final Voice V2.1 cue schema frozen for generation

- **Change:** added an audit-owned final Voice V2.1 cue schema reconciliation that writes the
  canonical logical cue registry, physical asset classification, manifest change plan, generation
  backlog, retirement/legacy map, timing rows, scenarios, implementation report, audit JSON, and
  handoff. The harness measures current MP3 durations from disk and compares audio against the
  task-start hash snapshot instead of stale Git-HEAD audio diffs.
- **Rationale:** Training Voice V2.1, Micro-Check Voice V2.1, MPV2, and Balance V2 are
  software-complete but still audio-pending. The generation phase needs one exact Clara/Marcus
  backlog with no ambiguous reuse, no pending cue accidentally added to the live manifest, and no
  feature gate change.
- **Boundary:** no audio was generated or modified, no external speech/audio API was called, no
  runtime feature was enabled, and the post-safety floor baseline remains authoritative:
  `IR-VOICE-FLOOR-GATE`, `IR-VOICE-FINAL-POSITION-READINESS`, and
  `IR-VOICE-SAFETY-SUBSUMPTION` all remain at zero.
- **Evidence:** `node scripts/audits/audit-voice-v21-final-cue-schema.mjs` reports
  `VOICE_V2_1_FINAL_SCHEMA_COMPLETE_GENERATION_PENDING`, `npm run verify:audio` passes, the
  task-start audio hash diff is `0`, and the final-schema artifact test pins the no-P0/P1/P2,
  audio-pending, feature-off, and floor-baseline invariants.

## 2026-06-27 — Safety profile collects DOB, not raw age

- **Change:** onboarding Safety Profile and Settings personal details now collect date of birth
  (`YYYY-MM-DD` in local persistence, entered as `MM/DD/YYYY`) and derive the current whole-year
  age from it. `profile.exactAge`, `profile.age`, `profile.ageBand`, and `safetyProfile.age`
  remain compatibility mirrors for existing scoring, planning, and reference-comparison paths.
- **Rationale:** the product intent is that users provide date of birth once and Hale calculates
  age dynamically, instead of asking them to maintain a raw age field after birthdays.
- **Boundary:** existing legacy profiles that only have exact age still load and can complete
  onboarding; historical result snapshots continue to freeze age-at-test and are not recomputed.

## 2026-06-28 — Obsolete Movement Profile V2 developer launchers removed

- **Change:** removed the Settings developer rows for the standalone Movement Profile V2 harness
  and the Movement Profile V2 unified-shell comparison launcher. The standalone check-up screen
  and app route they depended on were deleted; the public unified Movement Check-Up remains the
  only live V2 check-up entry point.
- **Rationale:** Movement Profile V2 is already integrated into the normal app flow, so these
  internal launch shortcuts no longer provide useful product or QA coverage.
- **Boundary:** this does not change Movement Profile V2 measurement logic, public Check-Up
  routing, reference-detail collection, frozen result materialization, or Progress history views.

## 2026-06-28 — ElevenLabs voice settings updated

- **Change:** changed the shared build-time ElevenLabs voice settings to stability `0.35` and
  similarity boost `0.85`, while keeping speaker boost enabled and speed at `0.92`.
- **Boundary:** no runtime TTS was added and no existing bundled MP3 assets were regenerated in
  this pass; the updated settings apply the next time `npm run audio` is run with an
  `ELEVENLABS_API_KEY`.

## 2026-06-28 — Fit Frame Pose Trace preview added as an isolated experiment

- **Change:** added a Settings developer entry for `Try Fit Frame Pose Trace`, which opens a
  recording-shell preview using the real camera/pose pipeline and preflight status copy while
  swapping only the central renderer for a private fit-frame + sparse landmark trace.
- **Boundary:** Movement Check-Up, training, micro-check, benchmark defaults, result saving, plan
  progress, and sync flows are unchanged. The new renderer is not registered as a production
  pose-avatar mode and is only reached through the preview flow.
- **Evidence:** `npm test -- --runTestsByPath src/render/__tests__/fitFramePoseTraceGeometry.test.ts
  src/screens/__tests__/CheckUpRecordingShell.test.ts` passes, and `npx tsc --noEmit --pretty
  false` passes.

## 2026-06-29 — Trainer voice runtime is no longer user-selectable by system

- **Change:** Settings -> Trainer Voice now shows only the Clara/Marcus picker. The app no
  longer persists or reads a voice-runtime mode preference, and launch flows use the bundled
  default trainer-voice runtime directly.
- **Rationale:** the bundled voice runtime is now the product default, so keeping a visible
  system switch and rollback copy created stale product language.
- **Boundary:** the selected voice id still persists locally; historical compatibility code for
  old check-up/training data is unchanged.

## 2026-06-29 — Fit Frame Pose Trace gated for Micro-Check recording

- **Change:** added `EXPO_PUBLIC_ENABLE_FIT_FRAME_MICRO_CHECK=1` as a Micro-Check-only
  developer flag that swaps the central recording visual from the legacy `SkeletonView` to the
  shared `RecordingVisualSurface` and Fit Frame Pose Trace renderer.
- **Boundary:** Micro-Check `SafePoseDetectionView`, pose pipeline, side resolver, runner
  creation, countdown/tracked-go boundary, scoring, completion, persistence, sync, and voice
  behavior remain authoritative and unchanged. Training and MPV2 are not integrated.

## 2026-06-29 — Fit Frame Pose Trace gated for Training recording

- **Change:** added `EXPO_PUBLIC_ENABLE_FIT_FRAME_TRAINING=1` as a Training-only developer
  flag that keeps the existing native camera/pose path but disables the native skeleton overlay
  and renders the shared `RecordingVisualSurface` in the recording viewport.
- **Boundary:** TrainingSessionPlayer, preflight, floor setup, valid-time recovery, step-up
  correction, tracked-go countdown boundary, rep/timer/hold/ROM metrics, session completion,
  persistence, sync, and voice behavior remain authoritative and unchanged. MPV2 is not
  integrated.

## 2026-06-29 — MPV2 exposes coordinator-owned Fit Frame guidance only

- **Change:** `MovementProfileV2LiveSnapshot` now includes `recordingVisualGuidance`, derived
  inside `MovementProfileV2LiveCoordinator` from MPV2 stage, tracking quality, recovery,
  backgrounding, voice prerequisites, and hands-free readiness state.
- **Boundary:** MPV2 still does not render Fit Frame or `RecordingVisualSurface`, has no
  user-facing Fit Frame flag, and keeps official scoring, stage progression, side inference,
  recovery, materialization, persistence, sync, and voice behavior unchanged.

## 2026-06-29 — Fit Frame Pose Trace gated for MPV2 recording

- **Change:** added `EXPO_PUBLIC_ENABLE_FIT_FRAME_MPV2=1` as an MPV2-only developer flag that
  swaps the central MPV2 recording visual through `CheckUpRecordingShell.renderRecordingArea`
  to the shared `RecordingVisualSurface`, consuming coordinator-owned
  `live.recordingVisualGuidance`.
- **Boundary:** flag-off MPV2 keeps the existing shell default renderer. Flag-on MPV2 changes
  only the recording area renderer; the shell remains responsible for camera-unavailable UI,
  chrome, footer, notice priority, and layout. MPV2 scoring, stage progression, side inference,
  recovery, materialization, persistence, sync, and voice behavior remain unchanged. Legacy
  Check-Up, Micro-Check, and Training flags remain isolated.

## 2026-06-29 — Fit Frame Pose Trace is the default recording visual

- **Change:** Fit Frame + Premium Pose Trace now defaults on for legacy Movement Check-Up,
  Micro-Check, Training, and MPV2. The previous opt-in `EXPO_PUBLIC_ENABLE_FIT_FRAME_*` flags
  were replaced by temporary per-flow rollback flags:
  `EXPO_PUBLIC_DISABLE_FIT_FRAME_CHECKUP`,
  `EXPO_PUBLIC_DISABLE_FIT_FRAME_MICRO_CHECK`,
  `EXPO_PUBLIC_DISABLE_FIT_FRAME_TRAINING`, and `EXPO_PUBLIC_DISABLE_FIT_FRAME_MPV2`.
- **Rollback:** unset or `0` means Fit Frame stays on; exact `1` restores the previous visual
  path only for that flow. Setting all four rollback flags to `1` restores the previous visuals
  across all recording flows for one more QA cycle.
- **Settings:** the Fit Frame preview remains available only through the diagnostics/developer
  path as "Recording visual diagnostics"; it is no longer presented as a normal user-facing
  experimental visual choice.
- **Boundary:** this is visual-only. Scoring, readiness, preflight, countdown/tracked-start,
  active measurement, rep/hold/ROM metrics, side inference/persistence, recovery, completion,
  result materialisation, evidence policy, persistence, Supabase sync, voice assets, runtime TTS,
  and audio cue sequencing were not changed. The active edge-warning policy remains unchanged.
- **QA:** physical Android/iOS QA is still required before beta release, including default and
  rollback launches for all four flows plus no-subject, framing, active, lost/recovery,
  completion, and camera-unavailable paths.

## 2026-06-29 — Optional micro-checks require explicit domain choice

- **Change:** the Manual / Extra Check-Up -> Quick micro check-up route now always opens the
  Strength / Balance / Mobility chooser before camera capture. The selected domain still maps to
  the existing micro-check primitives: chair power, single-leg balance, or mobility reach.
- **Rationale:** the extra check-up entry point is an optional curiosity flow, so auto-picking from
  the active block focus or balanced-week rotation hides user intent. Scheduled Today micro-checks
  still use the scheduled slot target directly.
- **Boundary:** optional micro-check results remain non-scheduled and do not complete a weekly
  slot, change the active plan, create an official Movement Profile, or alter capture/scoring.

## 2026-06-29 — Rep-credit sound effect covers unified Movement Check-Up

- **Change:** MPV2 live snapshots now expose a monotonic `repCreditCount`, incremented whenever
  the live chair-rise detector credits a practice or official chair rep. The unified Movement
  Check-Up screen plays the shared `rep-credit` sound effect when that count advances.
- **Rationale:** Training, micro-check, and legacy Check-Up already play the chime from their
  `playRepSound` frame updates. MPV2 used a separate coordinator path, so credited chair reps
  could update the on-screen count without the audio confirmation.
- **Boundary:** scoring, rep detection thresholds, practice/official result separation, voice
  sequencing, and persistence are unchanged. The chime remains a sound effect, not spoken form
  feedback.

## 2026-06-29 — Recording sessions use a small premium SFX vocabulary

- **Change:** added bundled voice-independent sound effects for measurement saved,
  tracking paused, tracking recovered, and session complete, alongside the existing rep-credit
  tick. Legacy Check-Up, Training, Micro-Check, and MPV2 now trigger these cues from their
  measurement/session state rather than from visual UI state.
- **Rationale:** brief non-verbal confirmations help users know that reps, holds, captures,
  recovery, and final completion were recorded without adding more spoken chatter.
- **Boundary:** sound effects never replace required voice guidance and do not change pose
  detection, scoring, state progression, persistence, or the no-form-critique policy.

## 2026-06-29 — Release runtime blocks developer-only surfaces

- **Change:** added a shared release-surface policy and wired it into the app shell so release
  runtime blocks dev-live, pose benchmark, Fit Frame preview diagnostics, mock progress data,
  and internal Movement Profile V2 surfaces even if stale state or an unsafe env bundle points
  at them.
- **Boundary:** public unified Movement Profile V2 Check-Up/results, Fit Frame default recording
  visuals, training, micro-checks, settings, and safe beta flag verification remain unchanged.

## 2026-07-01 — Android beta uses EAS internal distribution

- **Change:** added an EAS `beta` build profile for Android release-style internal distribution.
  The profile builds an installable APK, uses the EAS `preview` environment, auto-increments
  build versions, and forces rollback, internal, diagnostic, renderer benchmark, Sentry, and
  Apple Sign-In flags off. The app config now omits the Sentry Expo plugin unless Sentry is
  explicitly enabled, so beta builds do not require Sentry project credentials.
- **Rationale:** first Android beta testers need a direct download link without Play Console
  setup, while still receiving a production-like binary rather than a dev client.
- **Boundary:** Google Play Internal Testing remains the later formal beta path. Supabase
  publishable client values stay in EAS environment variables, not committed source files.

## 2026-07-01 — Beta audio config avoids microphone permissions

- **Change:** configured the Expo Audio plugin for playback-only use: microphone permission,
  Android `RECORD_AUDIO`, background recording, and background playback are disabled at the
  native manifest/config-plugin layer.
- **Rationale:** Hale uses bundled foreground voice guidance and explicitly disables recording
  in the runtime audio mode, so beta testers should not see microphone/background-audio
  permissions that imply audio capture.
- **Boundary:** foreground guidance playback remains unchanged. If future sessions need
  background audio or microphone capture, this config must be revisited deliberately.

## 2026-07-01 — EAS beta builds fetch pose models before native generation

- **Change:** EAS now runs `scripts/download-models.sh` and `scripts/verify-pose-models.sh` in
  `eas-build-pre-install`, and the local Android beta command runs the same check before
  launching `eas build`. `SafePoseDetectionView` also treats the native camera bind as the source
  of truth on physical iOS/Android devices instead of blocking capture on a separate availability
  probe.
- **Rationale:** MediaPipe `.task` files are intentionally gitignored. A clean EAS worker can
  build an installable app without those binaries unless they are fetched during the build, which
  makes runtime landmarker startup fail and surface to testers as a misleading camera-unavailable
  state even after permission is granted. The pre-install hook runs before Expo prebuild/CocoaPods,
  so both Android assets and iOS pod resources see the downloaded models.
- **Boundary:** camera permission policy, no-video rendering, model variants, pose thresholds,
  and measurement logic are unchanged. Real camera bind failures still show the existing
  unavailable state.

## 2026-07-02 — Production-readiness fixes: interruption handling, permission timing, balance dwell

- **Change (interruption handling):** the MPV2 live coordinator and flow reducer now clear
  `backgrounded` when the app resumes (the flag previously latched forever, leaving the rest of
  a check-up in a permanent "Capture interrupted"/recovery visual state after any brief iOS
  `inactive` blip). TrainingSessionScreen and MicroCheckScreen now auto-pause on AppState
  `background`/`inactive` via their existing pause paths: both are frame-timestamp driven and
  camera clocks keep advancing while suspended, so an unpaused gap silently completed sets and
  rest timers. Resume stays explicit — after an interruption the user may not be in position.
  The micro-check only auto-pauses once a measurement runner exists; side setup has no clock to
  protect. The legacy V1 CheckUpScreen (release-gated off) was deliberately left unchanged.
- **Change (permission timing):** app startup now *checks* camera permission
  (`getCameraPermissionsAsync`) instead of requesting it, adding an `undetermined` state. The
  OS dialog first appears from the camera-explanation/setup screens (or the readiness gate's
  new "Allow camera access" action), after the privacy case is made — the cold prompt at first
  launch undermined the explanation flow and grant rates.
- **Change (balance measurement):** a one-leg balance trial now requires 150 ms of continuous
  lift evidence before starting (`BALANCE_LIFT_CONFIRM_MS`), and the trial clock plus the
  `balance_lift_detected` transition are retro-dated to the first lift frame so no hold time is
  lost. Previously a single jittery frame with >0.14 BU ankle separation started a trial,
  which could burn one of the three valid trials (~0.1 s "hold") and force a 30 s rest. Lift
  evidence also only accumulates after the attempt voice boundary, so an early lift during the
  cue can no longer backdate the clock to before "go". Support touches are now recorded with a
  distinct `support_touched` trial termination instead of folding into `user_stopped`.
- **Change (crash recovery):** pending raw MPV2 check-up recovery now also covers
  `official_retest` records. A crash between raw save and finalize previously stranded the
  retest permanently (never materialized, block transition never ran). The launch auto-finalize
  rebuilds the prior-block context from the active block's V2 origin; the baseline launch path
  explicitly ignores pending retest raws so they are never finalized as baselines.
- **Change (smaller):** the untracked `VoiceChannel.speak()` path gained a duration-based
  completion watchdog (a missed `didJustFinish` previously wedged the channel busy forever,
  silently dropping later cues and blocking session completion); `SfxChannel.play` no longer
  throws into the render path; post-session feedback only syncs completions to the backend
  that adherence actually recorded (non-credited sessions created remote records a restore
  could not reproduce); Android hardware back on the home tab now defers to the OS
  (backgrounds the app) instead of being swallowed; V1 onboarding result bands read movement
  age relative to the user's own age when known (absolute cutoffs remain only as a no-age
  fallback).
- **Rationale:** a pre-production audit found the shipped-quality risks concentrated in
  real-world interruptions (calls, notification pulls, crashes, jittery frames) rather than in
  the measurement logic itself. These changes close those paths without touching scoring,
  norms, thresholds, or the audio laws.
- **Boundary:** the MPV2 unified check-up still has no lighting/framing pre-flight (needs a
  seated-framing protocol design — the existing PreflightCheck assumes a standing subject);
  the eyes-open balance V2 protocol remains built but not wired into the live coordinator;
  the balance dwell change should still be validated against real landmark recordings per the
  working agreements.

## 2026-07-02 — Production-readiness fixes, round two: measurement integrity under pause, dose honesty, local schedule days

- **Context:** a second same-day audit focused on the live session/check-up runtimes and the
  plan/progression pipeline, after the first round's interruption fixes landed.
- **Change (pause = restart the set):** pausing a training session or micro-check mid-measurement
  (manual Pause or the AppState auto-pause) now discards the in-flight set/measurement and
  redoes it from the instructions dwell → countdown on resume. The graders are frame-timestamp
  driven and cannot represent a wall-clock gap: `shiftTiming` shifted only the player's own
  clocks, so on resume `HoldTracker` credited the entire pause into the hold
  (`holdMs = ts - startTs`) and `ValidTimeAccumulator` added the whole gap as one `dt` while
  `counting` — a phone call mid-balance-hold completed the set "at target" and could emit the
  `strong` valid-time signal that gates the balance auto-progression. Pipeline interruption
  events fired while paused also never reached the graders (the player is not called while
  paused), so rep/hold state machines were never reset across the gap. Sets already completed
  before the pause are kept; only the interrupted set restarts. Skipping an item now also
  preserves the sets finished before the skip in the result (still excluded from progression).
- **Change (MPV2 backgrounding = fresh restart):** backgrounding during an official measure
  (chair active window, shoulder capture, hinge capture) now follows the same contract as
  camera tracking loss: the truncated attempt is invalidated and the test restarts fresh via
  the existing recovery episode + voice flow. Previously the chair test *recorded* the
  truncated attempt as the official result (flagged raw-only) and moved on — a call at second
  10 of the 30-second test permanently downgraded the month's headline strength measurement —
  and a backgrounded hinge force-completed the whole check-up with `no-measurement`.
  Product-owner decision 2026-07-02: restart fresh.
- **Change (wall-clock deadlines require live frames):** `receiveTimerTick` no longer credits
  results the camera did not observe: a balance trial reaching its ceiling with stalled frames
  (>1.5 s since the last accepted frame) is invalidated instead of credited a maximal hold,
  and a chair deadline with stalled frames restarts the test instead of recording a silently
  truncated window.
- **Change (the plan's dose is what the session runs):** the training player now honors the
  generated daily dose (sets, reps-per-set, seconds-per-set for player-clocked sets, and rest
  seconds — `restSeconds` added to the plan metadata) over the catalog prescription. Previously
  daily adjustments (something-hurts sets−1, short-on-time clamps, beginner rep caps, the 75+
  rest buffer) appeared in the preview but the session ran the full catalog dose — and a
  reduced-rep user who finished their promised reps stood waiting for the 120 s safety cap.
  Valid-time exercises are the deliberate exception: generation no longer adjusts their
  `secondsPerSet` (sets and rest still adapt) because the valid-time target is an instrument
  setting — measuring against the catalog target while promising a shorter one would read a
  perfectly-followed plan as failure evidence.
- **Change (progression reads measured completion):** progression evidence now computes
  `completionRate` from the graded set results against the planned dose (reps: credited/planned;
  hold/timer: accumulated seconds/planned) instead of a hardcoded 1. Self-reported RPE alone
  can no longer turn a mostly-incomplete dose into an "easy exposure" toward a ladder
  transition. Tracking artifacts stay neutral: any set flagged `no-measurement` or
  `tracking-interrupted` leaves the rate at 1 and defers to the validTime/tracking signals
  (never demote on a tracking failure).
- **Change (schedule days are local calendar days):** the block schedule, planned-date keys,
  and credit ids now derive date keys from the device-local calendar day instead of the UTC
  date. Under UTC keys, an evening session (or any session for users east of UTC) landed on
  the wrong "day": two local days could collide into one UTC date (second session denied
  `daily_credit_already_used`) or one local day could straddle two UTC dates (two credits in a
  day). Date-only strings pass through unchanged; week arithmetic stays pure date-key math.
- **Change (smaller):** the MPV2 voice runtime stops the old `VoiceChannel` before swapping
  voices mid-check-up; the legacy v1 progression engine (`training/progression.ts`) is marked
  deprecated — it is not wired into the app and survives only because `TrainingState` persists
  its shape; the controlled-beta ladder progression is authoritative.
- **Tests:** suite grew 1534 → 1544 (pause-restart and dose honoring in the player; micro-check
  pause restart against synthetic balance frames; MPV2 backgrounding restart, stall guard, and
  terminal-event precedence; local-day schedule credits built from local-time components so
  they hold in any machine timezone; measured completion-rate progression denial; valid-time
  target invariance under beginner adjustments). Coordinator test helpers now keep the camera
  "live" (seated subject) up to wall-clock deadlines, matching production frame flow.
- **Boundary:** per the working agreements, the pause-restart behavior should also be verified
  on a real device with a landmark recording (the synthetic tests model the screen contract,
  not real re-framing). Switching schedule days from UTC to local re-derives past credits from
  stored `completedAt` timestamps — fine pre-launch, but if any tester data matters, expect
  day boundaries near midnight UTC to shift by one day. The stall guard covers balance ceiling
  and chair deadline; shoulder/hinge deadlines were already safe via their valid-tracking
  minimums.

## 2026-07-02 — Training shared voice cues rewritten for hands-free older-adult guidance

- **Context:** the next voice-guidance pass after Movement Check-Up focused on Training Voice
  V2.1 shared cues: setup, safety, rest, pause/resume, recovery, skip, and session-completion
  lines. These cues are the glue between exercises, so they need to tell a 50+ novice exactly
  what to do without assuming they are looking at or touching the phone.
- **Change:** shared training cue copy now uses clearer, more reassuring instructions that name
  the action, the waiting state, and what the app will do next. The same shared cue text was
  synchronized across Training Voice V2.1, micro-check voice, and Movement Profile V2 where the
  ids overlap.
- **Change:** Clara and Marcus bundled audio was regenerated for the updated Training Voice V2.1
  shared cues. The overlapping Movement Profile V2 shared cues were regenerated with the same
  text, and `scripts/generate-audio.ts` now supports `--cue` for `movement_profile_v2` so a
  single changed check-up cue can be refreshed without forcing the entire group through the
  provider.
- **Boundary:** the repo still has a broader Movement Profile V2 audio-fingerprint backlog not
  caused by this pass. The updated/shared cues validate cleanly in targeted dry runs, but a full
  `verify:audio` will continue to fail until the remaining Movement Profile V2 stale assets are
  either regenerated or their source text is reconciled.

## 2026-07-02 — Training exercise setup cues drafted into source, audio intentionally pending

- **Context:** the next Training Voice V2.1 pass focused on higher-risk novice setup cues:
  sit-to-stand variants, balance/support holds, supported side steps, step-ups, and
  chair-supported split squats. These are the places where an older adult is most likely to need
  exact, reassuring hands-free guidance before the countdown starts.
- **Change:** first-use, later-set, target, side-switch, side-setup, and step-up correction cue
  scripts for those exercises now use fuller instructions: where to stand or sit, where support
  should be, what the movement looks like, what pace matters, and what the app will do next.
  Dynamic target grammar now preserves those reassuring suffixes when dose values are resolved
  from the live plan.
- **Boundary:** no Clara or Marcus audio was regenerated in this pass by product-owner request.
  The final cue registry marks the 51 changed cue keys as `audio_pending`, and a Voice V2.1
  dry-run reports 102 stale generation jobs (51 cue keys times 2 voices) for the later batch.

## 2026-07-02 — Floor exercise voice cues rewritten, audio intentionally pending

- **Context:** the next Training Voice V2.1 pass focused on floor transitions and floor
  exercises: the floor eligibility prompt, floor transition setup, bridge holds, bridge reps,
  and standard push-ups. This is a confidence-critical section for older novices because getting
  down to the floor and back up can be the most intimidating part of a hands-free session.
- **Change:** floor cues now explicitly give permission to skip if getting down and up is not
  safe, ask the user to take their time, mention support, and describe each start position and
  movement in plain language. Dynamic target grammar now keeps the reassuring floor-specific
  endings for hold, rep, and push-up targets when live plan doses are resolved.
- **Boundary:** no Clara or Marcus audio was regenerated in this pass. The final cue registry
  marks 11 additional floor cue keys as `audio_pending`; the Voice V2.1 dry-run now reports 124
  stale generation jobs total (62 cue keys times 2 voices) for the later batch.

## 2026-07-02 — Band and anchored-equipment voice cues rewritten, audio intentionally pending

- **Context:** the next Training Voice V2.1 pass focused on resistance-band and anchored-band
  setup cues: long-band inspection, door-anchor checks, band pull-aparts, overhead band presses,
  seated rows, standing rows, and mini-band lateral walks. These cues need to reduce uncertainty
  around equipment setup, tension, and when to skip.
- **Change:** band cues now explicitly ask the user to inspect the band, keep it away from the
  face, use light tension, test door anchors gently, and skip if the anchor does not feel secure.
  Exercise cues now name the band position, stance or chair setup, controlled movement, and
  comfort limits. Dynamic target grammar keeps the band-specific reassuring endings when live
  doses are resolved.
- **Boundary:** no Clara or Marcus audio was regenerated in this pass. The final cue registry
  marks 17 additional band cue keys as `audio_pending`; the Voice V2.1 dry-run now reports 158
  stale generation jobs total (79 cue keys times 2 voices) for the later batch.

## 2026-07-02 — Plan generation quality pass: measured-capability calibration, mobility rotation, balanced-block variety

- **Context:** a read-only audit of the workout/plan generation pipeline (block creation,
  session generation, progression, scheduling) found the algorithm itself sound but identified
  several gaps between what the app measures and what it actually uses to build a plan. This
  entry covers the fixes.
- **Starting exercise difficulty now reads the check-up's own measured value, never age.**
  `DomainResult` (src/scoring/scoring.ts) gained `primaryMetricValue` — the raw chair-stand
  reps / single-leg hold seconds / shoulder-flexion degrees behind each domain's age mapping,
  already computed but previously discarded after picking the focus domain. New
  `initialLadderProgressFromMeasuredCapability` (src/training/workoutGeneration.ts) seeds a
  ladder's starting level ±1 step from its catalog default — only onto a `v1_core` level, only
  for a ladder the user has never touched (training-earned progress always wins), and using
  absolute thresholds pinned to the whole published norm table's span (Rikli & Jones: ≤8 reps
  or ≥20 reps; Bohannon: ≥30s), never the user's age — preserving the existing "age never
  chooses exercises or levels" rule. Wired into both block-creation paths: the legacy V1
  `createAutomaticMovementBlock` (via a `CheckUpScore`-reading wrapper,
  `initialLadderProgressFromCheckUp`) and the current Movement Profile V2 flow (a new
  `measuredCapabilityFromMovementProfileV2Interpretation` in `movementProfileV2Block.ts`
  extracts the same two raw values from the V2 snapshot's interpretation, only trusting a raw
  metric with no invalid reason, and deliberately skipping `balance_eyes_open_total` since it
  is a different cumulative metric from the single hold this calibration models). Mobility has
  no leveled ladder (it is a rotation collection), so it is not calibrated.
- **Preset/Explore sessions now rotate mobility-collection exercises across repeat use.**
  Previously `collectionExposures` were force-emptied for any non-`block_generated` source, so
  a repeated preset like "10-Minute Mobility Reset" always landed on the same one or two
  stretches. New `presetCollectionExposuresFromGeneratedSessionSummaries` and
  `PRESET_COLLECTION_EXPOSURE_SCOPE_ID` (src/training/collectionSelection.ts) track exposure
  history for `preset`/`manual` sessions under a shared pseudo-block scope (no real block to key
  by); `generateTodaySession` now passes through whatever `collectionExposures` it is given
  instead of gating on source. Main-plan credit/progression semantics are unchanged — this only
  affects which of the interchangeable stretches gets picked.
- **Balanced (tied-domain) blocks now vary their session content.** `createBalancedSessionTemplates`
  previously always composed `balanced-A/B/C` from the exact same
  strength-A/balance-B/mobility-C combo for every balanced block, ever. It now accepts an
  optional rotation seed (`sessionTemplatesForMovementBlock` passes `block.id`) and picks one of
  three source combos via a stable hash — template ids and each slot's domain stay constant
  (required by the schedule's per-block-constant required-template-ids), only which day-variant
  each slot sources from varies. `MOVEMENT_PROFILE_V2_BALANCED_TEMPLATE_POLICY_VERSION` bumped
  to 2 (the fingerprint is stamped provenance metadata only, never compared for validation, so
  this was safe to change without a snapshot-compatibility shim). The no-seed default is
  unchanged (still strength-A/balance-B/mobility-C), preserving existing behavior for the one
  call site that only needs template ids.
- **Smaller fixes:** `estimateSessionMinutes` no longer floors a session at ~12 minutes when
  equipment/pain skipped one or more slots — an honest (still template-capped) estimate is used
  instead, so a two-item fallback session no longer claims to be a full one.
  `beginnerPrescription`'s sit-to-stand rep caps now match on the typed `STS_CUSHION_ID`/
  `STS_STANDARD_ID` constants instead of `id.includes(...)` substring checks. Removed
  `countCreditedMainPlanTemplatesThisWeek` (and the `iso()` helper it alone used) from
  `mainPlanEvents.ts` — dead code (no callers outside its own file) with a week-boundary
  calculation that diverged from the authoritative `blockSchedule.ts` model, a latent trap for a
  future caller.
- **Verification:** `npx tsc --noEmit` and the full Jest suite pass (1554/1558; the 4 remaining
  failures are pre-existing, in unrelated Training Voice V2.1/voice-activation work already
  in progress on this branch — confirmed unaffected by this change via a scoped `git stash` of
  only the files this pass touched).

## 2026-07-03 — Sprint 1 of the trust/friction/habit plan: instrument, prime, resume, fast re-frame

- **Context:** product direction discussion (2026-07-03) prioritized reducing session friction
  and building instrument trust ahead of wider beta. Sprint 1 is deliberately
  measurement-first: instrument the setup funnel before optimizing it, and fix the known
  session-loss paths. Rise-velocity noise-floor validation proceeds in parallel with rollout
  (product-owner decision) and is explicitly not a blocker for this work.
- **Change (funnel instrumentation):** `TrainingSessionPlayer` now tracks a per-session setup
  funnel (per-item framing/first-set durations, setup-issue latches, time to first set/rep),
  frame-timestamp-driven so replays reproduce it exactly. Completed sessions carry it in the
  result; abandoned sessions are captured on screen unmount. Records persist to a new
  local-only `src/telemetry` store (schema-versioned JSON per session, deliberately separate
  from product data), with sanitized Sentry breadcrumbs on phase changes and outcomes. The
  go/no-go for the larger audio-only-session investment (Phase 3 of the friction plan) reads
  from this data, not assumptions.
- **Change (permission priming copy):** the camera-explanation screen now leads its privacy
  points with the camera promise itself, worded to stay accurate against current telemetry
  reality: images processed in the moment, never saved/shown/uploaded; movement *results*
  stored on this phone.
- **Change (session resume):** planned sessions write a schema-versioned snapshot of finished
  items at item boundaries (`TrainingStore`, single overwritten file) and clear it on
  completion. When the same plan (block + template + planned local day + exercise list) is
  started again, the session continues after the last finished item and the merged result is
  evaluated whole. Explicit stop keeps the snapshot (the preview offers Continue / Start over);
  in-flight sets are never restored — same honesty rule as the 2026-07-02 pause fix. A
  fully-banked snapshot (death during the closing line) clears and the session restarts rather
  than crediting an unfinalized run.
- **Change (preflight fast path):** `PreflightCheck` gains opt-in `passedSampleMs`
  (training config = 0.5 s): after one full 2 s lighting/stability pass in a session, later
  per-item re-checks keep the framing gate but shorten the sample. Camera-view changes and
  setup retries revoke it via `requireFullSample()`. Check-up/micro-check configs are
  untouched — the shortcut exists only where the camera is a session pacer, not an instrument.
- **Deferred:** the spoken week-position at session close ("that's two of three this week")
  waits for the in-flight Training Voice V2.1 cue rework to land — it needs new cue contracts
  and ElevenLabs generation for both voices, and colliding with that WIP now would tangle two
  unfinished changes in the same files.
- **Verification:** `npx tsc --noEmit` clean; targeted suites green (funnel, resume, preflight,
  player, check-up/assessment; 53 + 129 tests), plus the full-suite state matching the known
  4 pre-existing voice-activation failures. **Owed:** on-device verification of resume and the
  fast re-frame with a landmark recording, per working agreements (pose behavior can't be
  exercised in the emulator).

## 2026-07-03 — PROPOSAL: reopen the "no notifications" non-goal for on-device reminders

- **Context:** the workout-reminder toggle stores a preference and schedules nothing
  (2026-06-15 prototype exception). Habit analysis in today's product discussion identified
  the missing cue as the largest gap in the retention loop: the app has routine and repair
  machinery (restart sessions, flexible adjustments, week progress) but no cue side at all.
- **Proposal:** upgrade the toggle to real *local* scheduled notifications (expo-notifications)
  anchored to a user-chosen routine moment ("after morning coffee"), per implementation-
  intention evidence. No server push, nothing leaves the device — the original non-goal
  ("push notifications") targeted server infrastructure and engagement spam; an on-device,
  user-set, easily-silenced reminder violates neither the local-only rule nor the
  no-gamification law.
- **Status:** awaiting product-owner sign-off before any implementation. If approved, the
  V1 non-goals list in CLAUDE.md should be amended in the same change.

## 2026-07-03 — Screen stays awake while the camera runs (native, not expo-keep-awake)

- **Problem:** during hands-free sessions the OS idle timer dimmed and locked the screen
  mid-recording — the user never touches the screen (audio-first law), so nothing resets
  the timer.
- **Decision:** hold the screen awake inside `PoseDetectionView`'s native start/stop
  lifecycle on both platforms — Android `View.keepScreenOn`, iOS
  `UIApplication.isIdleTimerDisabled` — instead of the JS `useKeepAwake()` hook
  (expo-keep-awake ships transitively with the `expo` package, so either was dependency-free).
  Native wins because the wake lock's lifetime exactly matches the camera session: every
  current and future screen that runs the camera gets it for free, it can't be forgotten on
  a new screen, and it releases even if JS tears down uncleanly. Session screens keep the
  view `active` through rest timers, so the screen stays on for the whole session.
- **Verification:** `:expo-pose-detection:compileDebugKotlin` clean. **Owed:** on-device
  check that the screen no longer dims during a session; iOS compile is verified at the
  next iOS build (two-line change, stock UIKit API).

## 2026-07-03 — Segmentation-mask matte figure added behind a default-off flag (Android)

- **Context:** the fit-frame pose trace was judged too abstract and too jittery by the
  product owner. Direction chosen: render the MediaPipe person segmentation mask as the
  recording figure — the user's true contour as a tinted matte. This is not camera video:
  background pixels are never rendered, only a brand-green alpha matte of the person, so
  product law #1 (no self-view video) stands.
- **Change:** `PoseLandmarker` segmentation output and a native
  `SegmentationMaskFigureRenderer` (Android) — per-pixel asymmetric EMA over mask
  confidence (fast attack / slow release) to convert boundary flicker into a feathered
  edge, 2x downsample, upright-rotation remap, double-buffered bitmap, contain-fit +
  mirror draw identical to the JS fit-frame math. Wired via new view props
  `segmentationMaskFigureEnabled` / `segmentationMaskFigureColor` (iOS accepts and
  ignores). JS default comes from `EXPO_PUBLIC_SEGMENTATION_MASK_FIGURE` (off unless
  `1|on|true`) resolved in `SafePoseDetectionView`; when on, the fit-frame card fill goes
  transparent so the native figure shows through. Masks never cross the JS bridge.
- **Gates before this can default on:** (1) inference fps with masks enabled on the
  mid-range Android device — masks recreate the landmarker with segmentation output, which
  costs inference time; latency diagnostics already report `outputSegmentationMasks` and
  `resultFps`; (2) mask edge quality in dim domestic evening light at ~3 m; (3) alignment
  QA in shell flows whose `poseWindow` content window differs from the full viewport —
  the native figure contain-fits the whole native view, not the JS content window;
  (4) subject-gone behavior (figure hides instantly on empty landmarks — verify no ghost).
  iOS implementation is deliberately deferred until the Android spike passes.
- **Known limits:** record/replay stores landmark JSONL only — mask visuals are not
  reproducible in the replay harness; the mask segments any person, so multi-person scenes
  rely on the landmark-empty gate rather than subject validity. Extraction failures
  self-disable after 3 attempts and emit one `segmentation-mask-extract-failed` pose error.
- **Verification:** `npx tsc --noEmit` clean; targeted jest suites (recording visual,
  fit-frame geometry, new `segmentationMaskFigureConfig` tests) pass;
  `:expo-pose-detection:compileDebugKotlin` clean. **Owed:** all four on-device gates.

## 2026-07-03 — App-simplification Stage 1: dead code removed (product-owner directed)

- **Context:** a complexity audit (2026-07-03) found the app carrying unwired features and a
  duplicate "next action" engine. Product owner approved a staged simplification plan; this is
  Stage 1 — code with **no callers and no UI** only. Branch: `app-simplification`.
- **Removed — second next-action engine:** `haleFlow/nextBestAction.ts` plus its
  `HaleUserFlowState`/`NextBestAction*` types and `getNextBestActionCopy`. It duplicated the
  `appLifecycle.ts` state machine that actually drives Home; nothing imported it outside tests.
- **Removed — support-circle prototype:** `adherence/supportCircleService.ts`,
  `inviteService.ts` (stub: never sent anything), `notificationService.ts` (no-op scheduler),
  `privacyFilters.ts`, `weeklySummary.ts`; the `SupportConnection`/`NotificationEvent`/
  `WeeklySummary` types and their `AdherenceStoreState` fields; the never-passed-down
  App.tsx handlers; and the unused `supportSharingLevel` profile setting. This was the old
  Family-tab prototype living on as headless services. Old persisted JSON with these keys
  still parses (fields are simply ignored); no schema bump needed.
- **Removed — dead planViewModel helpers:** `formatPreferredDays`, `intensityLabel`.
- **Tests:** suites/assertions that exercised only the removed code were deleted; integration
  tests that asserted against both engines kept their live-engine assertions. 1576 tests pass;
  the same 4 pre-existing voice-activation failures as the recorded baseline remain; tsc and
  `expo config` clean.
- **If support/family returns:** design it against the real backend (invites, sharing) rather
  than reviving these local stubs; git history has them if needed.

## 2026-07-03 — App-simplification Stage 2: avatar experiment graveyard removed

- **Context:** Stage 2 of the approved simplification plan. The Fit Frame Pose Trace has been
  the default recording visual on every surface since 2026-06-29; twelve rejected renderer
  families, two developer screens, and four per-surface rollback flags remained.
- **Removed:** all benchmark-only renderers and their geometry (point cloud body, constellation,
  premium constellation human, rigged human silhouette, soft digital twin, soft/shadow/privacy/
  volumetric silhouettes, sprite limb, contour field, art-directed human, classic), the
  `PoseAvatarRenderer`/`SkeletonView` dispatch stack and `poseAvatarConfig` env machinery,
  `PoseOverlayBenchmarkScreen`, `FitFramePoseTracePreviewScreen` (+ its Settings row and flows),
  the `poseRendererReplay` benchmark harness + script, and the four
  `EXPO_PUBLIC_DISABLE_FIT_FRAME_*` rollback flags (env example, eas.json, configs).
  `EXPO_PUBLIC_ENABLE_POSE_RENDERER_BENCHMARKS` is gone from the release-flag audit,
  app.config.js, eas.json, and the verify scripts.
- **Kept:** `FitFramePoseTraceRenderer` (the shipped visual), `MediaPipeSkeletonRenderer`
  (debug skeleton; now drives the dev-only Live screen directly), `RecordingVisualSurface`
  as the single owner of the recording visual, the in-flight segmentation-mask figure work,
  and the record/replay + latency diagnostics that are not renderer-comparison tooling.
- **Behavioral note:** the removed rollback flags were unset everywhere, so every production
  surface already rendered Fit Frame unconditionally — runtime behavior is unchanged. The
  per-screen avatar-state plumbing (`avatarMeasurementState`/`avatarDomain` → SkeletonView)
  fed only the dead fallback and is gone; `CheckUpRecordingShell.renderRecordingArea` is now
  required. A new `recordingVisualSurfaceWiring` test guards the single-camera-path invariant.
- **Verification:** tsc clean, expo config clean, 1,413 tests passing with only the same 4
  pre-existing voice-activation failures as the recorded baseline. Owed: routine on-device
  smoke of one recording flow at the next device session (expected no visual change).
- **If a new figure direction is wanted:** build it as a candidate next to Fit Frame (like the
  segmentation-mask experiment), not by reviving the deleted dispatch stack; git history has
  every experiment.

## 2026-07-04 — App-simplification Stage 3a: legacy V1 check-up retired; unified engine is the only path

- **Context:** Stage 3 of the approved simplification plan. Since 2026-06-29 the unified
  Movement Profile check-up has been the public engine, with legacy V1 kept behind an
  emergency rollback flag and a 12-input arbitration layer. With no shipped users to roll
  back, the insurance cost more than it protected.
- **Removed:** `EXPO_PUBLIC_ENABLE_LEGACY_V1_CHECKUP_ROLLBACK` and the never-wired
  `EXPO_PUBLIC_ENABLE_UNIFIED_MOVEMENT_CHECKUP` (configs, eas.json, .env.example,
  app.config.js audit, verify scripts, release-flag audit); the `legacy_v1` engine and its
  unavailable-reasons from `publicCheckUpEngine` (now a unified-only decision);
  `CheckUpScreen`, `ResultsScreen`, `OnboardingResultsScreen`, `v1ResultsAdapter`; the
  App.tsx `'checkup'`/`'results'` flows, `handleCheckUpComplete` (legacy scoring/completion,
  ~250 lines), the visible-result chain, retake/retry-battery machinery, `pendingCheckup`
  state, and the legacy last-result state block.
- **Dev shortcut preserved:** the emulator synthetic check-up (`devFixture.syntheticCheckUp`)
  now builds a **unified V2** raw check-up through the internal flow reducer and completes via
  the same `handleMovementProfileV2RawComplete` path as a live capture. The old legacy-format
  synthetic moved to `src/checkup/testing/legacyCheckUpFixture.ts` for the tests that still
  exercise stored-snapshot scoring.
- **Still present (Stage 3b, deliberately deferred):** the legacy graders
  (`chairStand`/`balanceLadder`/`shoulderFlexion`/`tug`), `DEFAULT_BATTERY`, the legacy
  scoring/score-snapshot module (still parses stored snapshots and feeds
  `latestUsableOfficialCheckUpRecord` block repair), and ProgressScreen's legacy
  presentation + dev-mock builders (unreachable under V2 data authority). These are
  entangled with adherence/assessment types and come out in a follow-up pass.
- **Behavioral notes:** onboarding steps `results`/`create_block` no longer map to a flow —
  the pending-raw MPV2 recovery path owns results resumption; `handleStartNextBlock`'s
  blocked-eligibility fallback now lands on Progress instead of the deleted results screen;
  Progress "view check-up" rows are inert pending the Stage 3b V2 history surface (they
  already bounced home in the shipping config).
- **Verification:** tsc clean, `expo config` clean, 1,398 tests passing with only the same 4
  pre-existing voice-activation failures as the recorded baseline. Owed: on-device onboarding
  smoke (welcome → synthetic V2 baseline via dev shortcut → results → block intro).

## 2026-07-04 — App-simplification Stage 4: Voice V2.1 audio backlog cleared; V2.1 is the live default

- **Context:** Stage 4 of the approved simplification plan. The Voice V2.1 migration had been
  frozen mid-flight: cues rewritten in source, audio intentionally pending, and a readiness
  lattice holding the runtime on legacy voice until the assets existed. Four aspirational
  tests encoding the finished state were failing on purpose.
- **Change (target grammar):** both-sides per-side rep targets now speak the short form
  ("Aim for four reps.") without the per-exercise guidance suffix — the side/switch cues
  around them already carry the reassurance; the suffix stays for standard single-side
  targets. This was the in-flight cue-rework contract the failing test described.
- **Change (generation):** ran the ElevenLabs batch (Multilingual v2, mp3_44100_128) for the
  158 stale Voice V2.1 jobs (79 cue keys × Clara/Marcus) and the 46 stale Movement Profile V2
  check-up lines (23 keys × 2). `verify:audio` passes across all 502 required assets.
- **Effect:** the physical-audio-surface readiness (computed from the manifests) flipped on
  its own; `resolveVoiceV21Activation` now reports `featureSelectable: true` with 37
  selectable exercises and a single `default_voice_system_enabled` reason code. Training,
  micro-check, Movement Check-Up, eyes-open balance, and floor V2.1 voice paths are all the
  runtime default. Full suite green for the first time on this branch: 1,402/1,402.
- **Deliberately kept:** `AUDIO_APPROVAL_READY` stays `false` (the founder has not listened
  to the regenerated lines on device) and the legacy voice fallback for unknown exercises
  stays as the fail-closed path. **Owed:** founder listening pass on device; after approval,
  tear down the V2.0 cue paths and collapse the readiness lattice to a single constant.

## 2026-07-04 — App-simplification Stage 5a: guest-first launch; sign-in becomes optional backup

- **Context:** Stage 5 of the approved simplification plan. Requiring an email/password
  account before a 60-year-old has seen anything was the single most hostile step in a
  ten-stage onboarding funnel. Product owner approved deferring auth.
- **Change (AppGate):** the app now renders without an account. The auth screen appears only
  for password recovery; `HaleApp` is keyed by the user id or `'guest'`. Signing in lives in
  Settings → Account ("Sign in if you want Hale to keep your check-up history … available
  when you return"), which already had a full sign-in/sign-up card.
- **Change (storage):** guest data uses the existing unscoped local directory; signed-in data
  keeps its per-user scope. New `moveLocalFiles` (src/history/localScope.ts, unit-tested) and
  `adoptGuestLocalFiles`: when an account is first used on a device with guest data and the
  user scope is empty, the guest files are **moved** into the user scope before any remote
  restore — never overwriting, and emptying the guest scope so a second account cannot adopt
  another person's data. Launch sync then pushes the adopted state to the backend.
- **Change (restore gating):** a signed-out launch marks restore ready immediately (no remote
  to wait for). The Welcome screen's "Back to sign in" escape and the onboarding sign-out
  path are gone — Welcome is now the true first screen.
- **Sync behavior:** all sync effects were already gated on a signed-in session and now
  simply idle in guest mode.
- **Owed (device):** guest onboarding end-to-end; sign-in-after-guest-data adoption; sign-out
  → guest → sign-in round trip; password-recovery deep link. These require a real device and
  the Supabase project.
- **CLAUDE.md note:** the local-only/no-accounts language is now closer to true for the
  default experience; the doc is reconciled in Stage 7.

## 2026-07-04 — App-simplification Stage 5b: onboarding loses the standalone equipment step

- **Context:** onboarding asked seven equipment questions before the user had seen any value,
  even though the zero-equipment law guarantees nothing blocks without them, Settings already
  edits equipment, and session planning already validates and substitutes for it.
- **Change:** the equipment step is gone. Saving the safety profile during onboarding confirms
  the zero-equipment baseline (sturdy chair + wall, `status: 'confirmed'`) and goes straight
  to the camera explanation. `OnboardingEquipmentScreen` is deleted; the `equipment` flow is
  retired (stored `currentStep: 'equipment'` from existing dev installs resumes at the camera
  explanation); Explore's equipment route opens Settings. Optional items (band, stair, weight,
  mat space) are added in Settings when the user actually has them — which is also when the
  band-gated exercises unlock, unchanged.
- **Considered and rejected:** merging the life-goal question into the Welcome or safety
  profile screens. One decision per screen is the right pattern for this demographic; the
  funnel cost is decision count, not screen count, and the goal question is one warm decision
  that drives plan personalization. The funnel is now: Welcome → goal → profile →
  camera explanation → check-up → results (plan auto-created by the unified engine).
- **Verification:** tsc clean, 1,405/1,405 tests, expo config clean. Owed: on-device
  onboarding run-through alongside the Stage 5a guest checks.

## 2026-07-04 — App-simplification Stage 6: dead-end reminder toggle removed; Explore trimmed to two tabs; plain-language profile copy

- **Reminder toggle:** the Settings section literally titled "Phone reminders are not
  available yet" is gone (product-owner decision: remove rather than implement now). The
  stored `remindersEnabled` preference field remains for compatibility but has no UI. If
  reminders are built later (see the 2026-07-03 proposal), they should ship as a real
  local-notification feature with a fresh surface.
- **Explore:** trimmed from four tabs to two — **Learn** (articles) and **Sessions** (extra
  practice sessions). The Guides tab (step-by-step help duplicating in-context help modals)
  and the Movements ladder browser (a fitness-app browse pattern serving curiosity, not the
  core loop) are removed, along with `LadderDetailScreen` and the ladder-detail flow. The
  explore view-model keeps `getLearnDetail` (article details); its now-unconsumed library
  and ladder-card builders are Stage 7 cleanup candidates.
- **Copy:** the safety profile's clinical "Date of birth and reference group" section is now
  "About you" — "Hale uses your date of birth and sex to compare your results with people
  like you." The check-up chooser needed no change: the retired manual/quick-recheck options
  were already hidden, leaving exactly two user-facing concepts (quick check-in, full
  Movement Check-Up).
- **Verification:** tsc clean, 1,405/1,405 tests, expo config clean.

## 2026-07-04 — App-simplification Stage 7: CLAUDE.md reconciled; follow-up register

- **CLAUDE.md:** the data rule now reads local-first with optional sign-in (amendment history
  preserved in place), and the 2026-06-15 prototype-exception list reflects what actually
  remains after the cleanup (local profile, Explore Learn+Sessions, two build-time voices).
- **Simplification branch summary (`app-simplification`, 8 commits):** dead code (second
  next-action engine, headless support-circle), the avatar experiment graveyard (12 renderer
  families, 2 developer screens, per-surface visual flags), the legacy V1 check-up engine and
  its rollback arbitration, the Voice V2.1 audio backlog (now the live default), guest-first
  launch with guest-data adoption, the onboarding equipment step, the dead-end reminder
  toggle, the Explore Guides/Movements tabs, and plain-language profile copy.
  Net: **~34,600 lines removed**; the suite went from 4 known failures to fully green
  (1,405/1,405); tsc and expo config clean throughout.
- **Follow-up register (deferred deliberately):**
  1. *Stage 3b:* legacy graders (`chairStand`, `balanceLadder`, `shoulderFlexion`, `tug`),
     `DEFAULT_BATTERY`, stored-snapshot scoring paths, ProgressScreen's legacy presentation +
     dev-mock builders, and the inert Progress history-row handlers (wire to a V2 record view).
  2. *Voice V2.0 teardown:* after the founder's on-device listening pass approves the
     regenerated audio, delete the legacy cue paths and collapse the readiness lattice.
  3. *Opportunistic:* MPV2 provenance fingerprints → single schema version; session-plan
     stale-validators → regenerate-on-change; unused explore view-model builders.
  4. *On-device verification owed:* guest onboarding end-to-end (welcome → profile → camera →
     synthetic/real V2 baseline → results → block intro), sign-in-after-guest-data adoption,
     sign-out round trip, password-recovery link, one recording flow smoke (no visual change
     expected), and the Voice V2.1 listening pass.

## 2026-07-04 — Remaining-cleanups pass (product-owner approved): legacy internals out, plans self-heal

- **Progress (3b.1):** ProgressScreen is Movement Profile V2 only (2,758 → ~1,050 lines). The
  legacy hero/records/history presentation, its inert view-latest/view-check-up handlers, and
  the whole legacy-format dev-mock system (builders, Settings toggle, `devMockDataEnabled`
  preference, App display-overlay) are deleted. `selectProgressDataAuthority` keeps only
  reachable kinds. The former "inert history rows" gap is resolved by deletion: the V2
  presentation's own profile/report navigation is the history surface.
- **Legacy plumbing (3b.2):** deleted `history/trends.ts`, `haleFlow/reports.ts`,
  `checkup/retry.ts`, the legacy progress summary builders (progressViewModel is now just
  ladder cards), and the `microCheckTrendPoints` bridge. Integration tests that construct
  legacy stored data import explicit fixtures under `testing/` — stored legacy records still
  parse, so the coverage remains meaningful.
- **Kept with evidence (3b.3):** the four legacy movement graders (the rise-velocity
  noise-floor go/no-go harness grades recordings through `chair-stand-30s`; rebuilding that
  instrument on the V2 path right before the go/no-go runs would risk invalidating the
  metric), `CheckUpOrchestrator` (shared by the training session player), `DEFAULT_BATTERY`
  (orchestrator config), and the scoring engine (`checkupSyncService`, block auto-repair,
  and assessment eligibility still call it). These are instruments and stored-data plumbing,
  not dead code.
- **Explore view-model:** the unreachable library/ladder builders, section data, level-view
  helpers, and their guard tests are gone; live surfaces keep coverage.
- **Session plans self-heal:** `beginPlannedSession` still runs all five validators (one
  consolidated breadcrumb), but a stale plan now regenerates once from the same start
  request — preserving the user's shorter/gentler/equipment adjustment — and only a repeat
  failure or an unplannable state reaches the recovery screen.
- **Deferred, with triggers (the two items consciously not executed):**
  1. *MPV2 fingerprint collapse* — 322 references spanning stored artifact schemas, origin
     validation, retest transitions, sync payloads, and restore checks. Collapse it the next
     time a policy version genuinely changes (when the lattice's cost is paid anyway), after
     the on-device create→block→retest→sync→restore round trip can be exercised.
  2. *Voice V2.0 teardown* — gated on the founder's on-device listening pass;
     `AUDIO_APPROVAL_READY` encodes ears, not chat approval, and the legacy fallback is the
     designed fail-closed path for unknown exercises.
- **Verification:** tsc clean, expo config clean, 1,373/1,373 tests passing.

## 2026-07-04 — Quick-wins pass: bundle weight, taxonomy closure, legacy block-repair removal

- **Images:** ten unreferenced hero PNGs from the palette/redesign trials deleted —
  assets/images drops 51MB → 32MB of bundle weight.
- **Taxonomy closed:** `CheckupType` no longer includes the retired `manual_extra` and
  `quick_recheck`; stored or remote values from early dev installs normalize to
  `legacy_unknown`, which remains as the documented parser fallback. Restore now maps the
  wire-format `manual_extra` to the local `manual_extra_v2` practice type (fixing a latent
  restore mismatch where practice check-ups round-tripped as a retired type). `OnboardingStep`
  drops the retired `equipment` step (stored values resume at the camera explanation) and
  `OnboardingState` drops the unused `selectedEquipment` list.
- **Legacy block repair removed:** `blockAutomation.ts`, App's auto-repair effect,
  `prepareBlockFromOfficialCheckUp`, and the legacy `CheckUpScore → ladder seed` wrapper are
  gone — they could only ever fire for legacy-format stored records, which no user has.
  "Start a new plan" now simply launches a check-up (the engine resolves baseline vs retake),
  since unified check-ups create their block at materialization. Milestone generation on
  session completion passes a null legacy score; comparisons live in the V2 block report.
- **Verification:** tsc clean, expo config clean, 1,369/1,369 tests passing.

## 2026-07-04 — Onboarding simplification: one camera screen, lighter Welcome, deferred profile details, step indicator

- **Context:** an onboarding assessment (analysis-only pass) found the post-simplification
  funnel still carried redundant reading and no sense of progress — the exact "overwhelmed
  before they understand it" risk for the 45–65 target user. Four changes, all product-owner
  requested.
- **Two camera screens merged into one.** `CameraExplanationScreen` is deleted; the single
  `CameraSetupScreen` now owns the privacy reassurance ("you will not see a live video of
  yourself — just a simple outline", in the subtitle) and the "what to expect" line (four short
  movements, voice-guided, pause/stop anytime), plus the OS permission prompt. The reason:
  privacy/no-mirror was stated three times across Welcome + Explanation, and audio/chair/light
  were each duplicated. The `camera_explanation` `OnboardingStep` and the `camera-explanation`
  `Flow` are retired; `deriveOnboardingStep` collapses everything before a usable baseline to
  `camera_setup`; stored `camera_explanation`/`equipment` steps migrate to `camera_setup`
  (serialize, unit-tested). No schema bump (value migration only).
- **Welcome trimmed.** Dropped the "What happens today" 4-step timeline (it restated the flow
  the user is about to walk) and the "Before you begin" chair/audio/light prep list (it
  previewed the camera setup screen's own steps). Kept hero + one-line value + the
  "10 min · 3 areas · 4 weeks" metric strip + the privacy panel, and the body now names the
  "three short steps" so the copy matches the new indicator.
- **Safety Profile softened for onboarding.** New `showStartingDetails` prop (default true;
  App passes `!onboardingFlowActive`) hides the *starting pace* and *comfort/pain* sections
  during onboarding — they default sensibly (`lightly_active`, no pain) and are still edited in
  Settings, which renders the same screen in review mode. Onboarding drops from 7 inputs to 5
  on that screen; DOB + sex + the three capability questions (floor/step/single-leg) stay, as
  they gate norms comparison and exercise safety.
- **Step indicator added.** `ScreenHeader` gained an optional `progress={{ step, total }}` that
  renders a dot row + "Step X of 3" (accessibilityRole progressbar). Shown only during
  onboarding on Life goal (1/3), Safety profile (2/3), Camera setup (3/3); Welcome is the cover
  and the check-up/results/first-block follow. Reused screens (Settings review, retest) pass no
  progress. Net funnel: Welcome → goal (1/3) → profile (2/3) → camera setup (3/3) → check-up →
  results → first plan.
- **Verification:** tsc clean, expo config clean, 1,370/1,370 tests passing (added a serialize
  migration case). Owed: on-device onboarding run-through alongside the Stage 5 guest checks.

## 2026-07-04 — App-logic simplification: within-block progression turned on; dead legacy loop removed

- **Context:** an analysis-only pass over workout generation / progression / check-up /
  micro-check asked whether the app logic could be simplified for the 45–65 user and made easier
  to polish. The headline finding: the app carried the machinery of a fully adaptive
  progressive-overload system, but a "controlled beta" policy layer had switched almost all of it
  off — every forward transition in `progressionPolicy.ts` was `blocked`, so a user effectively
  stayed at their check-up-seeded level for the whole 4-week block. The app paid the full cost of
  a dynamic system while delivering an essentially static one.
- **Progression turned on (product-confirmed: "gentle auto step-ups").** The "step up after N
  clean, easy, pain-free sessions" engine already existed; it was only disabled by the policy
  tables. Flipped the linear-ladder forward transitions from `blocked` to `allowed` up to each
  exercise's highest RELEASED (v1_core) level, and raised the `autoProgressionCeilingLevelId`s to
  match: sit-to-stand cushion→standard→slow-lower→power; squat supported→free; push wall→incline;
  balance feet-together→tandem (single-leg stays gated as a fall-risk pending device validation).
  Safe one-level regressions on pain/struggle. Optional/hidden levels still release-cap down to
  the ceiling; supporting-set and collection ladders still never auto-progress by adjacency.
  Two clean sessions (completion ≥85%, RPE ≤3, no recent pain; strong valid-time for holds) earn
  a step-up.
- **Reasoned deviation — kept the progression safety machinery.** The original analysis proposed
  deleting the fingerprint / plan-snapshot / validator layer as "illegible machinery." After
  enabling the tables, they read as a clear step-up map, and that layer does real, tested work
  (detects when a persisted plan predates a policy change and regenerates it). Deleting it would
  trade a working safety property for line-count, so it stays.
- **Dead legacy `TrainingState` loop removed.** `buildBlock`, `resolveSession`/`-Slot`, the
  deterministic `decideLevel`/`applySession` progression engine, and `nextSession*`/
  `recordCompletedSession` had no production callers since the live plan path became
  `MovementBlock` + `haleFlow/sessionPlanning` + the exercise-ladder system. Deleted
  `src/training/state.ts`; trimmed `block.ts`/`progression.ts` to the persisted-shape TYPES only
  (serialize.ts still reads them for backward-compatible loads — no schema bump); dropped the dead
  barrel re-exports and obsolete tests (~460 lines net).
- **Reassessed as NOT worth the risk right now:** freezing the catalog by removing the 7
  v1_optional levels cascades into audio manifests, pose geometry, safety cues, and the LIVE
  voice-V2.1 contracts (19 files) and discards V2 headroom; the daily-adjustment model's only
  UI-unreachable state is `a_bit_stiff` (a plausible future chip). Parking the flag-off beta
  subsystems (both-sides rounds, step-up alternation, floor V2.1) remains desired but is a large
  detangle of the live voice-V2.1 sequence planner — recovery branch
  `parked/training-beta-subsystems` cut; best done as a dedicated pass with the owed on-device
  voice listening check.
- **Verification:** tsc clean; 1,345/1,345 tests passing (24 obsolete legacy-loop tests removed).
  Commits `7c078053` (progression) and `dd64ba70` (legacy removal). Owed: on-device confirmation
  that within-block step-ups feel right, alongside the noise-floor go/no-go.

## 2026-07-04 — Movement Check-Up production-robustness pass: recovery, deadlock, persistence, calibration

- **Context:** a deep audit of the V2 unified Movement Check-Up (engine, protocol controllers,
  voice runtime, screen, persistence) found four critical failure modes plus a set of
  measurement-validity and resilience gaps. All fixed in this pass; every fix carries a
  regression test. tsc + expo config clean; full suite 162/1,361 green.
- **Chair recovery recorded zero reps (critical, fixed).** `recoverChairFromTrackingLoss`
  rebuilt the controller with a `source: 'direct_call'` setup, which
  `setupHasUserConfirmation` rejects — `confirmSetup` failed silently, so the restarted
  controller never left phase `setup` and every redone stand was discarded (HUD frozen at 0,
  result recorded `no-measurement`). Any ~130 ms pose dropout or backgrounding during
  `chair_active` triggered it. Fix: the coordinator stores the setup the user confirmed for the
  item and reuses it on restart; `startActive`'s return value is now checked so a rejecting
  controller can never leave the coordinator in `chair_active` with a dead window. Recoveries
  are also now BOUNDED (chair and hinge cap at 2 restarts, mirroring balance/shoulder): after
  the cap the tracking-flagged partial result is recorded instead of looping the user through
  30-second redos forever in a dim room.
- **Backgrounding mid-countdown deadlocked the check-up (critical, fixed).** The voice runtime
  marked the `chair_countdown` plan's scope complete BEFORE running the 3-2-1-go countdown; a
  cancel (background / iOS `inactive`) mid-countdown meant `sync()` skipped the "completed"
  plan on resume and the coordinator waited for `chair_go_playback_started` forever — the only
  exit was Cancel (discarding everything). Fix: countdown plans complete only when `go` has
  actually played; `sync()` now refuses to auto-restart over any required failure (failure UI
  owns recovery) and recognizes derived scopes (`:countdown`, `:retry:N`) as in-flight.
- **Completed battery was hostage to the outro cue (critical, fixed).** The raw check-up was
  persisted only in `onComplete`, which was gated on the outro narration finishing; an audio
  failure at the finish line plus "Exit check-up" discarded four measured tests. Fix: new
  `onRawCheckUpReady` screen callback fires the moment the raw check-up exists and App saves it
  immediately (same `startedAt` filename — the later materialized save overwrites it, and the
  existing pending-raw recovery finalizes it on next launch if the user never reaches results).
  On outro failure with a completed battery the failure UI now offers "Continue to results"
  (forward exit) instead of only discard; mid-battery audio remains mandatory (no
  continue-without-audio).
- **Hands-free fallback never armed in `balance_ready` (critical, fixed).** Pose samples hit
  the `default` branch of `updateHandsFreeFromPose`, wiping the waiting clock every frame, so
  the 10-second manual-fallback timeout could never fire: "Save best result" was unreachable
  and an undetectable foot-lift (occluded ankles) stranded the user until the 6-minute hard
  cap. Fix: explicit no-op case keeps the clock armed. Added a `balance_skip` action + control
  (voice-gated, stage-checked) so a user whose lift is never detected can move on with an
  honest declined/no-measurement record. Deliberately NO manual trial start: a trial without a
  camera-verified lift could credit a hold that never happened.
- **Seated calibration variance (measurement, fixed).** The body-unit calibrator locked on the
  first still window with no posture requirement — and the V2 battery opens with the user
  SEATED, so most sessions calibrated on a knee-bent direct hip-to-ankle distance (~70% of leg
  length) while some locked standing: nondeterministic between-session scale variance on the
  product's headline metric. Fix: 1 body unit is now the anatomical leg length hip→knee +
  knee→ankle (segment sum) — identical for a straight leg, posture-invariant for a bent one —
  with aspect-corrected deltas. Replay fixtures regenerated (bodyUnit shifted ~0.03% on the
  synthetic standing fixtures; event timings unchanged). The session body unit is also now
  recorded into the flow (`record_body_unit`) so saved V2 CheckUps carry `bodyUnit` instead of
  null (comparability metadata).
- **Aspect-distorted angles (measurement, scoped fix).** Normalized portrait space is
  anisotropic; angles read mid-range errors up to ~10° on a 3:4 camera. `PoseFrame` now carries
  `aspect` (from source dimensions; 1 for legacy recordings/synthetic frames), the recording
  format propagates header dims onto replayed frames, and NEW `aspectCorrectedAngleAtDeg` /
  `aspectCorrectedDist` helpers exist. Adopted ONLY where values are reported or
  norm-compared: shoulder-flexion peak and the calibration length. Threshold-trigger angles
  tuned in raw space (rep-cycle knee 155/110, setup gates) deliberately keep `angleAtDeg` —
  their constants are self-consistent and re-tuning without real recordings would violate the
  replay-first agreement. The balance sway proxy now scales x by aspect so it shares units with
  the body scale across devices.
- **Balance touchdown debounce split (measurement, fixed).** Tracking-lost frames and leg-down
  frames shared one counter, so 3 glitch frames + 1 leg-down frame could end a trial as a
  "valid" touchdown timestamped at `nowMs`. Now separate counters: only 4 consecutive
  leg-down frames (good tracking) complete a touchdown, timestamped at the first down frame;
  a good frame clears loss evidence.
- **Wrong-leg lifts get told (UX, fixed).** Trials 2–3 must reuse the first trial's standing
  leg; a sustained wrong-leg lift previously did nothing. The coordinator now sets a notice and
  the status text says which leg to stand on. (A matching voice line needs an ElevenLabs
  generation run — follow-up; text-only until then.)
- **Leave-confirmation on every close path (UX, fixed).** Back arrow, Cancel controls, and
  Android hardware back (screen-level `BackHandler`, registered after App's so it wins) now
  route through one `requestClose` that shows the shell's existing discard modal when there is
  progress to lose; it skips the modal when nothing is at stake (untouched first setup, or raw
  check-up already saved).
- **iOS `inactive` grace (UX, fixed).** `inactive` fires for transient overlays (call banner,
  control centre); it previously invalidated the active measurement instantly. Now a 2-second
  grace window: only a persistent inactive or a real `background` dispatches the backgrounding
  contract. `resumed` is only dispatched when a backgrounding was actually dispatched.
- **Smaller:** the shell controls memo now depends on the full voice-runtime state (stale
  disabled-state fix); audit corrections — iOS keep-awake already existed natively
  (`isIdleTimerDisabled` in `PoseDetectionView.swift`), and V2's `status: 'measured'` +
  `evidenceStatus` duality was confirmed coherent end-to-end (reference engine handles
  `invalid_measurement` per item), so item status semantics were deliberately left unchanged.
- **Deferred with rationale:** mid-battery resume across app restarts (items would carry
  different body-unit calibrations across launches — a protocol-comparability decision for the
  product owner, and the discard-confirm + early raw save now cover the main loss paths);
  the V2 lighting/framing pre-flight (needs seated-framing protocol design + voice assets;
  the new recovery caps bound its worst-case symptom); wrong-leg voice line (asset generation).

## 2026-07-04 — Check-up product decisions executed: standing frame check, corrective voice, no-resume, ladder sequencing

- **Context:** the four product decisions deferred from the same-day robustness pass were
  resolved and carried out: build the pre-flight, generate the corrective voice line, decide
  against mid-battery resume, and schedule (not build) the balance-ladder protocol switch.
- **Standing frame check built (hands-free runtime only).** The unified check-up now opens
  with a `standing_frame_check` stage before the chair item, enabled via a coordinator option
  the screen sets alongside hands-free mode (`standingFrameCheckEnabled`) — the legacy button
  path and all existing coordinator tests keep the original first stage. Passing requires,
  after the voice boundary and the usual hands-free dwell: pipeline `tracking`, a locked
  body-unit calibration (which itself needs ~1.5 s of stillness), a reliable side chain, and a
  near-extended knee (≥150° raw-space) so a seated user cannot pass. One design solves three
  problems: a lighting/stability gate, the framing-hygiene promise ("stand where you stood
  last time"), and a GUARANTEED standing calibration lock at the camera spot each session —
  the segment-sum calibration made posture variance survivable; this makes it deterministic.
  Voice: `mpv2_checkup_intro` + the existing V1 pre-flight line `step-into-frame`; on pass the
  chair stage speaks `framing-ready` + the chair cues WITHOUT replaying the intro. After the
  10-second fallback timeout a "Skip camera check" control appears (no manual "confirm
  framing" — passing is camera-verified or nothing; skipping is honest and safe because the
  segment-sum scale stays comparable). If tracking is still not good at fallback time, a
  one-shot `turn-on-light` hint speaks and the status text explains — high-confidence only,
  per the silence-by-default law. Zero new audio was needed for the gate: the V1 pre-flight
  lines were already bundled.
- **One-shot advisory notices in the voice runtime.** New `noticePlanForSnapshot` channel:
  non-blocking, deduped per scope, only speaks when the stage's own plan is done and the
  channel is idle. Two notices ship: the balance wrong-leg correction (new generated line
  `balance-same-leg`, side-agnostic — "Stand on the same leg as your first attempt…" — one
  ElevenLabs run, both voices, `verify:audio` green across all 502 assets) and the frame-check
  lighting hint (reuses `turn-on-light`). The wrong-leg notice re-arms per balance attempt.
  Deliberately NOT added to the MPV2 cue-definition list: that list's policy fingerprint
  covers every MPV2 asset, so adding a definition would mark all ~62 approved takes stale and
  force a full regeneration; plain `VoiceCueKey` lines avoid that (V2 plans already mix them).
- **Decision — mid-battery resume will not be built.** A check-up resumed in a new app launch
  carries a different body-unit calibration, lighting, and fatigue state: a different protocol
  wearing the same name, which the evidence taxonomy would downgrade to raw-only anyway. With
  confirm-before-leave, the early raw save, and pending-raw recovery, an app crash mid-battery
  is the only remaining loss path, and its cost is one redo of a monthly 10-minute ritual.
  Revisit only if crash telemetry shows real frequency.
- **Decision — eyes-open balance ladder is held, with a deadline.** The built
  `BalanceEyesOpenV2ProtocolController` stays unwired through the noise-floor go/no-go and
  on-device verification (wiring a multi-stage protocol immediately after a hardening pass
  would reopen the seam-bug class just closed). It is scheduled as the LAST pre-launch
  protocol change: the 45-second single-leg ceiling under-discriminates the fit end of the
  45–65 demographic, and a protocol switch is free before first external users but resets
  everyone's balance baselines after.
- **Verification:** tsc, expo config, `verify:audio` clean; 159 suites / 1,327 tests green
  (suite count reflects the parallel parking of beta subsystems in `ade64afd`). New tests:
  frame-check pass/seated-reject/fallback-skip/lighting-hint (coordinator), frame-check plan +
  no-intro-replay + notice one-shot/dedupe (voice runtime), screen wiring (source test).
  On-device verification of the frame check with a landmark recording remains owed, alongside
  the pass's other on-device items.

## 2026-07-04 — Navigation simplification: dead flows removed, two drill-downs collapsed

- **Context:** a full screen/flow audit of the hand-rolled `App.tsx` navigation (4 tabs ×
  28 full-screen flows × 9 lifecycle states, 30 screen components) traced every flow to its
  setters. Goal: fewer screens and fewer stops between intent and action for the 45–65 user.
- **Dead surface deleted (no user-visible change), commit `88bca712`:** flows
  `onboarding-block` (superseded by `block-intro`), `dev-live` (+ `LiveSessionScreen`, the
  `isReleaseGatedFlowAllowed` release gate, and the dead `CAMERA_FLOWS` entry), and
  `manual-microcheck-unavailable` had **no setter anywhere**; `MovementProfileV2RecoveryScreen`
  was never wired into App at all (`git log -S` confirms — the MPV2 recovery behavior lives in
  `movementProfileV2/recovery.ts`); the `TEMP_PREVIEW_BLOCK_INTRO_SCREEN` flag was hardcoded
  `__DEV__ && false`. Also merged `movement-profile-v2-unified-domain-detail` into
  `movement-profile-v2-domain-detail`: the pair only encoded the back-target, which
  `movementProfileV2ResultSurface` (set on every entry path) already tracks. Flow union 28 → 24.
- **Quick micro-check is one screen away (product-owner approved), commit `f8db5092`:** the
  manual check-up entry drilled through two chooser screens (kind → domain) before a 60-second
  check. The domain choice (Strength / Balance / Mobility) now renders as inline 48px buttons
  on `ManualCheckupStartScreen` wherever the quick-check option appears;
  `ManualMicroCheckChoiceScreen.tsx` and flow `manual-microcheck-domain` are deleted. 24 → 23.
- **Starting a session is one stop (product-owner approved), commit `08ed0274`:** the daily
  path was Today → adjust sheet → Session Preview → camera. Start now goes straight to the
  preview, which gains an inline "Adjust for today" card (shorter / gentler / less equipment /
  something hurts + pain area). Selection state derives from the plan itself
  (`metadata.userAdjustment` / `painAreas`); toggling re-plans via
  `handleAdjustPreviewSession`, which preserves the original start target (template/preset)
  from `lastStartSessionPreferencesRef`, and the movement list updates to match. The card is
  hidden while resuming an interrupted session; navigation history dedupes the same-location
  re-plan so Back is unaffected. The `SessionStartMenu` sheet was deleted from Today and Plan.
- **Verified fine and left alone:** the onboarding chain, `AuthScreen` (password-recovery
  deep link only), both recovery screens (reachable fail-safes), and all 9 lifecycle states.
- **Verification:** tsc clean; 1,325/1,325 tests green after each commit; routing tests updated
  to the one-screen paths. Owed on device: the inline domain buttons, the adjust card +
  re-plan flow, and Back behavior around the preview.

## 2026-07-04 — Results unification: saved history renders through the one shared shell

- **Context:** the second screen/flow audit found the last structural duplication — the same
  official check-up rendered through the shared `CheckUpResultsShell` right after a check-up
  but through a bespoke 291-line `MovementProfileV2ResultsScreen` when opened later from
  Progress history: two visual dialects for identical data, double polish cost.
- **Change (commit `247434e5`):** a new `'history'` presentation variant in
  `movementProfileV2ResultsAdapter` ("Saved check-up" framing, plan section hidden and plan
  actions suppressed even when a plan state is ready, Done-only); the
  `movement-profile-v2-unified-results` flow merged into `movement-profile-v2-results` with
  the variant derived from `movementProfileV2ResultSurface`; the bespoke screen deleted and
  its domain-detail branch extracted to `MovementProfileV2DomainDetailScreen` (shared by both
  surfaces). Practice results deliberately stay their own plain screen — rendering practice
  numbers in the official shell would make non-official measurements look official.
- **Flow union 22 → 21** (from 28 at the start of the day's navigation work). Verification:
  tsc clean, 1,326/1,326 green. Owed on device: open a saved check-up from Progress and
  confirm the history framing + Done-to-Progress.

## 2026-07-04 — Plan screen pass: block auto-creation; one mention per fact

- **Context:** the screen-by-screen polish pass began with Plan (read-only review first). The
  screen's copy and empty state were strong; the findings were repetition (week number twice,
  the check-up in up to three places), a copy contradiction in the preparation state ("being
  prepared" + a "Prepare plan" button), an instruction sitting in the Equipment value slot, and
  a 36px edit button.
- **Blocks create themselves (product-owner decision), commit `c490a536`.**
  `needs_block_creation` is now a transient recovery state: an App effect re-materializes the
  block from the latest stored official Movement Profile (one attempt per source check-up,
  breadcrumbed; same ladder seeding + remote sync as the completion path). The lifecycle only
  enters the state when a stored profile can actually materialize — a baseline that cannot
  (legacy/V1-only) resolves honestly to `needs_baseline_checkup`. Both Today and the Plan
  empty state show a CTA-less "Preparing your plan… finishes on its own" (empty `ctaLabel`
  hides the buttons); the manual check-up path remains the escape hatch.
- **One mention per fact:** hero week pill removed (the timeline's "Week X of 4" carries it);
  `RetestCard` deleted — the check-up appears once as information (timeline sentence) and once
  as the single action (hero CTA when due). The hero + session-row duplication for "start next
  session" is kept deliberately as a shortcut.
- **Honest settings row:** Equipment shows the real summary ("Chair, wall, band +1") from the
  safety profile instead of "Change in Settings". Edit button now meets the 48px tap target;
  the week-progress segments gained an accessibility label.
- **Verification:** tsc clean; 1,327/1,327 green (new `v2Baseline` fixture, built through the
  production snapshot/assessment creators, keeps genuine `needs_block_creation` coverage).
  Owed on device: the auto-creation round-trip and the tightened Plan layout.
- **Follow-up (commit `54968821`, product-owner approved "lead with the focus"):** the weekly
  session rows now lead with each session's real template focus ("Balance focus"), with the
  focus initial as the mark and "Session N (· Done)" as the subtitle — truthful because
  template focus is stable while exact movements stay day-of-generated. Header settings button
  and section titles moved to the shared `SettingsIconButton`/`SectionTitle` primitives; dead
  copy removed (`getPlanSessionCategoryCopy` with its never-rendered `categories`, and
  `getRetestCopy`'s never-displayed `body`).

## 2026-07-04 — Settings pass: safety surfaced as one row, one safety card, canonical-only equipment toggles

- **Context:** screen-by-screen polish continued with Settings (read-only review first, then a
  product-owner-approved pass). The screen was information-rich but had duplicated safety
  surfaces, a buried safety-setup entry point, and two parallel equipment-toggle code paths.
- **Safety profile is a first-class menu row** in the Workouts group ("Support, comfort, and
  pain details."), replacing the Safety-setup tile buried in the details section; the
  `SetupActionTile` component and its style block are deleted.
- **One safety card, not two:** `SafetyActionsCard` merged into `SafetyReadinessCard` — phone
  placement guidance plus the "See camera setup tips" row in a single card. The safety
  overview's duplicate "Video is not saved by the app." meta line is gone (the privacy section
  already owns that fact).
- **Equipment toggles are canonical-only:** all six switches now read/write
  `safetyProfile.availableEquipment` via `onToggleAvailableEquipment`. The screen's legacy
  `EquipmentProfile` prop, App's `toggleEquipment` callback, and
  `legacyEquipmentKeyToCapability` are deleted. The store-level legacy mirror
  (`training.equipment`, written by `toggleAvailableEquipment`) is unchanged — this removed a
  duplicate UI path, not the compatibility layer.
- **Pointer/copy polish:** section headers to sentence case, ASCII `>` chevrons to `›`,
  redundant "Voice" header inside the Trainer-voice card dropped, and three sub-target
  controls (voice preview, birth-date button, age options) raised to the 48px tap target.
- **Orphaned primitives removed:** `Chip`/`Pill` in `src/components/ui.tsx` and the
  `componentStyles.chip` recipe had no consumers left after the onboarding `Choice` control
  took over selection UI; deleted rather than kept as speculative API.
- **Verification:** tsc clean outside the in-flight founder results refactor
  (`CheckUpResultsShell`); screens/components/theme suites 42/42 green. The 6 failing tests in
  the full run all live in that refactor's blast radius (results adapter copy changes), not in
  this pass. Owed on device: the Settings screen walk-through (row order, merged safety card,
  toggle round-trip).

## 2026-07-04 — Today pass: measured bands drive the snapshot copy; the hero copy has one source

- **Context:** screen-by-screen polish continued with Today (read-only review, then an
  approved pass). Layout was strong; the findings were truthfulness and duplication.
- **Honest snapshot rows (the headline fix):** the lifecycle computes a real per-domain band
  from measured age ranges (`strong`/`building`/`starting_point`), but the screen hardcoded
  the row copy — mobility always "Doing well for now", other domains always "Needs steady
  practice", regardless of data. Rows now map the band: strong → "Doing well", building →
  "Building steadily", starting_point → "A good place to start"; the focus-domain callout
  ("Your main focus") is unchanged. Evidence-first presentation is a product law; the label
  must reflect the measurement.
- **One source for the hero copy:** TodayScreen re-derived title/subtitle/CTA per action type
  on top of `getTodayPrimaryAction`, duplicating some lifecycle strings, contradicting others,
  discarding the micro-check's domain-aware title, and patching strings that no longer exist
  ("Today's Hale Session", "Start First Session", "Move with intention"). The winning copy was
  promoted into `appLifecycle` (`week_complete` → "Your week is complete",
  `inactive_restart` subtitle → "…keep your plan moving.", `normal_training_day` → "Today's
  session is ready" + simpler subtitle) and the entire screen-side rewrite layer deleted. The
  micro-check hero regains its domain-aware title ("Balance check-in").
- **Context strip earns its place or disappears:** the pre-plan "Next step" fallback repeated
  the hero (same action, compressed via a fragile `contextValue()` heuristic) and the snapshot
  intro (check-up status) — three check-up mentions on the onboarding screen. The strip now
  renders only with an active plan (week number + next check-up); the fallback branch and
  heuristic are gone. "Next Check-Up" → sentence case.
- **Polish:** settings button to the 48px tap target (kept the intentional transparent-on-warm
  look over the shared chip-style `SettingsIconButton`); snapshot card title unified to the
  serif card-title style; App.tsx's duplicate `TodayScreen` ternary branch collapsed into the
  fallback.
- **Verification:** tsc clean; 1,323/1,323 green (no test pinned the old copy). Owed on
  device: each lifecycle state's hero copy, band labels against a real check-up, and the
  strip's absence pre-plan.

## 2026-07-04 — Explore pass: one page, sessions first; the tab bar and the dead library layer are gone

- **Context:** the screen-by-screen polish reached Explore. The review found the screen mostly
  carrying residue from the earlier Explore trim, and a product question about its two
  internal tabs (Learn / Sessions).
- **Product decision (owner-approved): no internal tabs.** The Learn/Sessions segmented bar
  hid half the tab's content behind a second tap — Learn was the default, and no flow ever
  deep-linked to Sessions (Today's week-complete CTA starts the mobility reset directly).
  Explore is now one scrollable page: featured session → "More sessions" rows → "Learn"
  section (featured article + reads). Sessions lead because adherence is the product;
  articles stay because this demographic responds to evidence — they just don't warrant a
  navigation level. Contextual article placement (surfacing a relevant read from Today or
  Progress) noted as a possible future refinement.
- **Featured card honesty:** the hero previously hardcoded "A gentle reset for lighter days"
  regardless of which session was featured (and said "lighter days" three times across the
  tab). It now renders the featured session's own `cardTitle`/`detailBody`.
- **Unreachable content deleted:** the 8 `LEARN_ARTICLES` guides (never listed anywhere; only
  the 4 health-insight articles are reachable) plus their images, `LIBRARY_IMAGES` and 13
  library assets, `LEARN_IMAGES`, `ladderImageFor`, and `LearnDetailScreen`'s CTA branches for
  the deleted camera-setup/resistance-band articles. Camera-setup guidance lives in the real
  camera-setup flow.
- **exploreViewModel rebuilt around its live surface (866 → 306 lines):** the transitively
  dead ladder/checklist presentation layer (level pickers, checklist builders, `LADDER_*`
  copy tables) and the test-only `getEquipmentSetupSummary` are gone. The ignored legacy
  `equipment` input was removed end-to-end (view-model params → screen prop → App pass),
  matching the Settings-pass collapse; equipment resolves solely from the canonical
  safety-profile store.
- **Polish:** extra-session titles sentence-cased ("Mobility reset"), header settings button
  and row Start buttons raised to the 48px tap target. The stale copy-guardrail asserting
  "Camera estimated" in the explore source (a label that only existed in the deleted library
  layer) was removed.
- **Verification:** tsc and jest clean on this pass's surface (copyGuardrails +
  exploreViewModel suites green). The 11 suites failing at commit time all trace to the
  founder's in-flight LifeGoal category refactor, not this work. Net −1,340 lines. Owed on
  device: the merged Explore layout, featured-card copy, and article detail screens.

- **Follow-up (owner-directed):** the merged page briefly kept both tabs' heroes stacked —
  two 274px cards that read as two landing pages and gave the mid-scroll article the same
  visual weight as the page's primary action. Now one hero per page: the session hero leads
  (label "For lighter days" — its only occurrence again), Learn flattens to four uniform
  article rows, and `FeaturedInsightCard` is deleted. Act at the top, browse below.
