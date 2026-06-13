# Longevity App

Camera-measured movement health for adults 45–65: monthly voice-guided
Movement Check-Ups graded by pose detection, per-domain "movement ages",
and home training targeting the weakest domain. See [CLAUDE.md](CLAUDE.md)
for product laws and architecture; [docs/decisions.md](docs/decisions.md)
for the decision log.

**Stage 1 status:** foundation + pose pipeline (native camera/MediaPipe
module, pure-TS pose pipeline, skeleton renderer, record/replay harness,
pre-flight check).

**Stage 2 status:** grading engine (four shared primitives + RepVelocity),
movement registry with the 30-second chair stand (reps, per-rep rise
velocity in body units/s, push-off flag), voice-guided assessment flow with
bundled pre-generated audio, and noise-floor tooling
([docs/noise-floor-report.md](docs/noise-floor-report.md) — synthetic dry
run passed at 0.44% CV; real-data run pending recordings).

**Stage 3 status:** the full Movement Check-Up — all five assessments
(chair stand, Timed Up and Go, balance ladder, shoulder flexion, hinge
reach), the voice-guided battery orchestrator with re-framing and graceful
skip, published-norm per-domain "movement ages", a results screen with the
weakest-domain focus and longitudinal trends, and schema-versioned local
history — wired end-to-end (`home → check-up → results`). End-to-end on a
physical device is still pending (the camera/MediaPipe path can't run on an
emulator).

## Setup

```bash
npm install
./scripts/download-models.sh   # fetches MediaPipe model binaries (gitignored)
```

The app needs a development build (it has a local native module — Expo Go
won't work):

```bash
npx expo run:android    # primary dev loop
npx expo run:ios
```

## Development

```bash
npm run typecheck       # tsc --noEmit, must always pass
npm test                # jest unit + fixture-replay tests
npm run replay -- <recording.jsonl>             # headless pipeline replay
npm run replay -- <rec.jsonl> --assert <expected.json>
npm run fixtures        # regenerate committed synthetic fixtures
npm run audio           # regenerate bundled voice lines + chime (macOS only)
npm run noise-floor -- recordings/   # rise-velocity CV analysis
npm run noise-floor -- --synthetic   # setup-variance dry run
./scripts/pull-recordings.sh         # pull device recordings (Android)
```

Landmark recordings: in a dev build, use the overlay's record button; files
land in the app's documents directory under `recordings/`. Pull them with
`adb` (Android) or Finder/Files (iOS), replay them headlessly, and when a
pose behavior surprises you, commit the recording + an expected summary as
a regression test.

## Layout

- `modules/expo-pose-detection/` — local Expo module: native camera +
  MediaPipe PoseLandmarker (Android: CameraX/Kotlin, iOS: AVFoundation/
  Swift). Emits landmark events; never renders camera video.
- `src/pose/` — pure-TS pipeline: parsing, One-Euro smoothing, per-chain
  reliability windows, subject validity, warmup/subject-gone state machine,
  body-unit calibration. No React imports — runs identically on-device and
  in headless replay.
- `src/render/` — skeleton-on-black renderer (imperative SVG path updates
  at 30fps; React state only for the `__DEV__` overlay at 10fps).
- `src/preflight/` — framing/distance/lighting pre-flight state machine.
- `src/grading/` — the four grading archetypes (RepCycle, Hold, TimedTask,
  MaxRom) + RepVelocity. Pure TS, allocation-free per-frame updates.
- `src/movements/` — MovementDefinition registry; one movement per file
  (first: 30s chair stand). Screens are movement-agnostic.
- `src/assessment/` — voice-guided session controller (pure TS state
  machine, replay-testable).
- `src/audio/` — cue keys, generated asset manifest, expo-audio playback
  channels (one voice line at a time, priority-drop).
- `src/recording/` + `src/replay/` — JSONL recorder, replay summaries,
  headless grading replays, noise-floor analysis.
- `scripts/` — replay CLI, fixture generation, model download, audio
  generation, noise-floor CLI, recording pull.

`android/` and `ios/` are generated (`npx expo prebuild`) and gitignored.
