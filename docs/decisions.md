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
