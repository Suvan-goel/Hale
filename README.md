# Longevity App

Camera-measured movement health for adults 45–65: monthly voice-guided
Movement Check-Ups graded by pose detection, per-domain "movement ages",
and home training targeting the weakest domain. See [CLAUDE.md](CLAUDE.md)
for product laws and architecture; [docs/decisions.md](docs/decisions.md)
for the decision log.

**Stage 1 status:** foundation + pose pipeline (native camera/MediaPipe
module, pure-TS pose pipeline, skeleton renderer, record/replay harness,
pre-flight check).

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
- `src/recording/` + `src/replay/` — JSONL recorder, replay summaries.
- `scripts/` — replay CLI, fixture generation, model download.

`android/` and `ios/` are generated (`npx expo prebuild`) and gitignored.
