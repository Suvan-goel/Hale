# Fit Frame + Premium Pose Trace Recording Integration Audit

Date: 2026-06-29

Scope: audit only. This document reviews how the experimental Fit Frame + Premium Pose Trace preview should graduate into Hale's production recording surfaces without changing scoring, session completion, data persistence, Supabase/backend code, or the camera/native inference contract.

## Executive Summary

The Fit Frame + Premium Pose Trace renderer is a strong candidate for Hale's recording visual, but it should not be integrated screen-by-screen in its current preview shape. The safe path is to introduce a shared recording visual surface and a small guidance adapter that translates existing pose/readiness/session states into visual states. The renderer must remain downstream of the current measurement state machines.

Recommended decision: build a shared `RecordingVisualSurface` around `FitFramePoseTraceRenderer`, then adopt it behind a feature flag in this order:

1. Fit Frame preview parity and adapter tests.
2. Legacy Movement Check-Up through `CheckUpRecordingShell.renderRecordingArea`.
3. Micro-check, including hands-free side setup.
4. Training, after extracting the duplicated recording viewport and disabling the native skeleton overlay outside debug.
5. Movement Profile V2 official check-up last, after exposing coordinator-owned guidance state rather than duplicating MPV2 setup inference.

The largest risk is not visual rendering. The largest risk is letting a visual edge/highlight heuristic become a second source of truth for readiness, countdown, tracking loss, or side selection. Hale already has several production-grade sources of truth: `PosePipeline`, `PreflightCheck`, `MovementCameraReadinessTracker`, `SessionController`, `TrainingSessionPlayer`, `MicroCheckRunner`, `MicroCheckCameraSideResolver`, and `MovementProfileV2LiveCoordinator`. The Fit Frame layer should consume those states, never replace them.

## Current Recording Architecture

### Native Camera And Pose Event Layer

`PoseDetectionView` owns camera and MediaPipe inference natively and emits landmark arrays to JS; the camera image itself is never rendered (`modules/expo-pose-detection/src/PoseDetectionView.tsx:9`). Its defaults preserve the side-view-friendly MediaPipe confidence settings at 0.35 and render a canvas rather than video (`modules/expo-pose-detection/src/PoseDetectionView.tsx:17`). The landmark payload is normalized, upright portrait, unmirrored, and timestamped in monotonic milliseconds (`modules/expo-pose-detection/src/ExpoPoseDetection.types.ts:129`).

`SafePoseDetectionView` wraps the native view with camera availability checks and swaps in a camera-unavailable notice (`src/components/SafePoseDetectionView.tsx:23`). Any production Fit Frame integration should continue to use this wrapper.

### Pose Pipeline Layer

`PosePipeline` is the core hot path: parse, smooth, compute chain reliability, validate subject plausibility, gate warmup, emit tracking interruptions, and calibrate body units (`src/pose/pipeline.ts:1`). Its output distinguishes `no-subject`, `warmup`, `tracking`, and `interrupted` states and includes both measurement-smoothed and display-smoothed frames (`src/pose/pipeline.ts:82`). The renderer may use `rawFrame` or `displayFrame` for visuals, but scoring and readiness must continue to use pipeline/controller outputs.

### Current Renderer Stack

`SkeletonView` currently delegates to `PoseAvatarRenderer`, whose production default resolves to the point-cloud body renderer unless debug/env config changes it. `PoseAvatarRenderer` exposes a simple imperative `update(output, sourceAspect)` handle (`src/render/PoseAvatarRenderer.tsx:40`), which is the correct shape to preserve for Fit Frame.

`FitFramePoseTraceRenderer` already implements that same imperative handle (`src/render/FitFramePoseTraceRenderer.tsx:142`). It accepts `visualState`, `contentWindow`, `mirrored`, and `frameSource` props (`src/render/FitFramePoseTraceRenderer.tsx:24`). It computes a constrained fit frame from the recording card's pose-analysis window (`src/render/fitFramePoseTraceGeometry.ts:158`) and builds clipped trace paths plus edge flags (`src/render/fitFramePoseTraceGeometry.ts:194`). Edge flags currently come from raw landmark positions and confidence, including top/bottom signals for weak nose/ankle visibility (`src/render/fitFramePoseTraceGeometry.ts:320`).

This is useful for visual feedback, but it is not a readiness engine.

### Shared Check-Up Shell

`CheckUpRecordingShell` is already the cleanest integration point. It owns the full-screen `SafePoseDetectionView`, computes the 9:16 recording card and 3:4 pose-estimation window, renders recording chrome, handles camera-unavailable UI, and accepts an optional `renderRecordingArea` override (`src/screens/CheckUpRecordingShell.tsx:68`, `src/screens/CheckUpRecordingShell.tsx:126`). The default area renders `SkeletonView`; the Fit Frame preview already uses the override.

This shell is used by:

- Legacy `CheckUpScreen`.
- `MovementProfileV2UnifiedCheckUpScreen`.
- `FitFramePoseTracePreviewScreen`.

It is not used by:

- `TrainingSessionScreen`, which duplicates the recording card and uses the native skeleton overlay.
- `MicroCheckScreen`, which duplicates the recording card but uses JS `SkeletonView`.

### Fit Frame Preview

`FitFramePoseTracePreviewScreen` is useful proof that the renderer can sit inside the real camera shell. It wires `PosePipeline`, `PreflightCheck`, and `FitFramePoseTraceRenderer` through `CheckUpRecordingShell.renderRecordingArea` (`src/screens/FitFramePoseTracePreviewScreen.tsx:57`, `src/screens/FitFramePoseTracePreviewScreen.tsx:86`).

The preview also contains preview-only readiness copy. It maps `PreflightStatus` directly to instructions and adds an ad hoc `feetVisible` check from raw per-landmark confidence (`src/screens/FitFramePoseTracePreviewScreen.tsx:154`, `src/screens/FitFramePoseTracePreviewScreen.tsx:234`). That is acceptable for a Settings preview, but it should not be copied into production recording flows. Production flows already have stronger, movement-aware readiness state.

## Flow-by-Flow Audit

### Legacy Movement Check-Up

Current architecture:

- `CheckUpScreen` processes frames, records dev JSONL, passes frames into `CheckUpOrchestrator`, throttles UI snapshots at 100 ms, and updates `skeletonRef` (`src/screens/CheckUpScreen.tsx:149`).
- `CheckUpOrchestrator` chains battery items and resets `PreflightCheck` plus `MovementCameraReadinessTracker` per item (`src/checkup/checkup.ts:247`).
- Each item uses `SessionController`, which blocks measurement until generic preflight is ready, body unit exists, and movement-specific camera readiness is ready (`src/assessment/sessionController.ts:343`).
- Active tracking loss is converted into an explicit interrupted frame for graders (`src/assessment/sessionController.ts:218`).

Integration difficulty: low to medium.

Why: the shell already supports `renderRecordingArea`, and the controller already emits setup prompts and captions. Fit Frame can replace `SkeletonView` without touching scoring.

Risk areas:

- Do not let Fit Frame edge flags start or block the item. `SessionController.setupBlock` is the source of truth.
- Do not replace the footer metrics. `checkupStageDisplay` owns active reps/time metrics, while guidance belongs in the existing top setup notice.
- Make active tracking loss visually clear, but keep the reset semantics inside `SessionController`.

Recommendation:

Use legacy Check-Up as the first production-like adoption after preview parity because its shell seam is already present and its setup controller is mature.

### Movement Profile V2 Unified Check-Up

Current architecture:

- `MovementProfileV2UnifiedCheckUpScreen` uses `CheckUpRecordingShell` and default `SkeletonView` (`src/screens/MovementProfileV2UnifiedCheckUpScreen.tsx:394`).
- `MovementProfileV2LiveCoordinator` owns official live stages, hands-free setup, recovery, diagnostics, and final raw check-up materialization (`src/movementProfileV2/liveCoordinator.ts:293`).
- It derives tracking quality from the pipeline and stores recovery episodes in the live snapshot (`src/movementProfileV2/liveCoordinator.ts:278`, `src/movementProfileV2/liveCoordinator.ts:383`).
- Hands-free setup logic is coordinator-private: chair seated readiness, balance standing-leg inference, shoulder side inference, shoulder auto-capture, hinge setup readiness (`src/movementProfileV2/liveCoordinator.ts:736`, `src/movementProfileV2/liveCoordinator.ts:1628`).
- Shell notice already prioritizes audio failure, background interruption, recovery, side-change warning, then stage instructions (`src/screens/MovementProfileV2UnifiedCheckUpScreen.tsx:798`).

Integration difficulty: high.

Why: MPV2 is official evidence and contains its own nuanced hands-free gates. If a Fit Frame adapter duplicates those private readiness checks, it will drift from official protocol behavior.

Risk areas:

- Duplicating `chairSetupReady`, `inferBalanceStandingLeg`, `shoulderReadyForAutoCapture`, or `hingeSetupReady` in a visual adapter would create a second protocol implementation.
- Recovery visuals must track `live.recoveryEpisode` and `live.backgrounded`, not raw renderer edge confidence.
- The voice runtime can block actions while required audio is in progress; visual "ready" should not imply the user/action is allowed if the runtime is blocking.

Recommendation:

Adopt last. First add a coordinator-owned `visualGuidance` or `recordingGuidance` field to `MovementProfileV2LiveSnapshot`, derived inside the coordinator from the same private setup/recovery state. Then the shared visual adapter can consume that snapshot without re-implementing official setup inference.

### Training Session

Current architecture:

- `TrainingSessionScreen` owns a separate recording surface instead of `CheckUpRecordingShell`.
- It currently mounts `SafePoseDetectionView` inside the recording card with `nativeSkeletonOverlayEnabled` and no JS `SkeletonView` (`src/screens/TrainingSessionScreen.tsx:532`).
- The frame loop processes `PosePipeline`, updates `TrainingSessionPlayer`, handles tracked countdown voice, throttles snapshots, and plays rep sound effects (`src/screens/TrainingSessionScreen.tsx:295`).
- `TrainingSessionPlayer` owns preflight, floor setup, movement readiness, countdown, set runtime, rest, completion, and safety cues (`src/training/sessionPlayer.ts:461`).
- Training top notice priority is already nontrivial: pause/help, valid-time captions, step-up correction, floor setup, save/transition, setup prompts, instructions/countdown, and active ROM measuring (`src/screens/TrainingSessionScreen.tsx:976`).

Integration difficulty: medium to high.

Why: training needs a layout extraction before renderer replacement. It also currently relies on a native skeleton overlay that will visually conflict with the Fit Frame trace unless disabled.

Risk areas:

- Native skeleton overlay must become debug-only or be disabled when Fit Frame is enabled.
- Long sessions raise stale-guidance risk. Visual guidance must reset per item/set and when paused/resumed.
- Valid-time captions, step-up correction, and floor setup notices are higher priority than generic framing copy.
- Training voice has tracked countdown boundaries. Visual state must not imply "active" before the audible `go` boundary starts the set.

Recommendation:

Extract a shared recording card/surface from training and micro-check before integrating Fit Frame. Reuse `TrainingFrameUpdate.setupPrompt`, `floorSetup`, `validTimeCaption`, `stepUpCorrection`, and phase as adapter inputs.

### Micro-Check

Current architecture:

- `MicroCheckScreen` owns a separate recording surface with full-screen `SafePoseDetectionView` and JS `SkeletonView` (`src/screens/MicroCheckScreen.tsx:546`, `src/screens/MicroCheckScreen.tsx:607`).
- Before a runner exists, hands-free side setup may run `PreflightCheck` and `MicroCheckCameraSideResolver` (`src/screens/MicroCheckScreen.tsx:292`, `src/screens/MicroCheckScreen.tsx:299`).
- Once a runner exists, `MicroCheckRunner` owns preflight, instructions, countdown, active grading, completion, and result normalization (`src/training/microCheck.ts:102`).
- The V2.1 micro-check countdown starts active measurement on the tracked `go` cue callback (`src/screens/MicroCheckScreen.tsx:364`).
- Session notice already prioritizes hands-free side setup copy before generic preflight copy (`src/screens/MicroCheckScreen.tsx:1126`).

Integration difficulty: medium.

Why: visually it is close to Check-Up because it already uses JS `SkeletonView`, but hands-free side setup is a separate pre-runner state.

Risk areas:

- Do not let the renderer select or persist the side. `MicroCheckCameraSideResolver` and `pinMicroCheckSide` own that.
- Do not let visual ready start active measurement before tracked `go`.
- Active metrics are compact and should remain in the footer.
- Side setup needs its own adapter source, because `MicroCheckRunner` does not exist yet.

Recommendation:

Adopt after legacy Check-Up and before training if the shared recording surface is available. Include explicit tests for no-runner hands-free setup and manual fallback visibility.

## Guidance And Voice Policy

### Where Guidance Should Appear

Use the existing top setup notice as the primary text channel. It is already shared in the shell and duplicated in training/micro-check. Keep metrics in the footer.

Recommended placement:

| Session state | Top notice | Fit Frame visual | Footer |
| --- | --- | --- | --- |
| No subject / interrupted setup | "Step into frame" / existing recovery text | lost state, subdued frame | movement name/progress only |
| Generic preflight adjustment | existing prompt text | adjust state, edge highlight if body near edge | unchanged |
| Movement orientation setup | existing movement readiness caption | adjust/tracking, optional edge highlight | unchanged |
| Stable/ready dwell | "Hold still" / "Starting soon" | ready state/glow | unchanged |
| Countdown | current instruction/countdown notice | ready or tracking, no new adjustment text unless setup breaks | countdown metric if present |
| Active measurement | movement-specific active notice only when needed | tracking state; lost/recovery only on real interruption | reps/time/hold/peak/reach |
| Tracking reset/recovery | existing recovery notice | lost/adjust state | unchanged or recovery-safe metric |
| Camera unavailable | camera notice | no renderer | no metric |

Do not place long instructions inside the frame. The frame should be a measuring affordance, not a help card. Short top-copy plus subtle edge/ready state is enough.

### Which Messages Should Trigger Voice

Initial integration should add no new voice assets. Use the existing bundled cues:

- Generic preflight: `step-into-frame`, `center-yourself`, `step-back`, `step-closer`, `hold-still`, `turn-on-light`, `framing-ready`.
- View changes: `turn-side-on`, `face-forward`.
- Existing recovery/safety cues: `tracking_pause_and_reset`, `tracking-loss-v21`, `tracking-recovered-v21`, and MPV2 cue IDs where already used.

Voice should only fire from the existing controllers/runtimes, not from the renderer. The existing `shouldSpeakFramingPrompt` policy already enforces a minimum 5 s gap and repeat throttling (`src/preflight/promptTiming.ts:3`). `VoiceChannel` already drops lower-or-equal-priority stale lines and never calls runtime TTS (`src/audio/voicePlayer.ts:1`, `src/audio/voicePlayer.ts:228`).

Fit Frame visual-only signals that should not trigger new voice at first:

- A single edge glow when pose is near an edge.
- A weak-foot or weak-head visual if the existing preflight/controller state is otherwise not blocking.
- Minor confidence fading during active measurement.

If a future product pass needs exact "feet visible" narration, add it as a bundled cue through the existing audio generation path. Do not call runtime TTS, and do not add the cue inside the renderer.

## Proposed Shared Abstraction

### Component

Create a shared surface component, for example:

```ts
type RecordingVisualSurfaceProps = {
  rendererRef: React.Ref<PoseAvatarRendererHandle>;
  cameraAvailability: CameraAvailability;
  cameraViewport: { width: number; height: number };
  poseWindow: { left: number; top: number; width: number; height: number };
  guidance: RecordingVisualGuidance;
  mirrored?: boolean;
  frameSource?: 'raw' | 'display';
  debugOverlayEnabled?: boolean;
};
```

The component should render:

- `FitFramePoseTraceRenderer` with `contentWindow={poseWindow}`.
- Optional debug renderer only under `__DEV__`.
- No camera video.
- No production native skeleton overlay.
- No scoring/session logic.

For `CheckUpRecordingShell`, this can plug into the existing `renderRecordingArea`. For training and micro-check, extract the duplicated recording card or add an equivalent `renderRecordingArea` seam.

### Guidance Data Contract

Create a flow-agnostic adapter output, for example:

```ts
type RecordingVisualState = 'lost' | 'adjust' | 'tracking' | 'ready' | 'active' | 'recovery';

type RecordingVisualGuidanceSource =
  | 'pipeline'
  | 'preflight'
  | 'movement_camera_readiness'
  | 'training_floor_setup'
  | 'training_active'
  | 'micro_check_side_setup'
  | 'micro_check_active'
  | 'checkup_item'
  | 'mpv2_live'
  | 'camera_unavailable';

type RecordingVisualGuidance = {
  visualState: RecordingVisualState;
  source: RecordingVisualGuidanceSource;
  primaryText: string | null;
  blocksMeasurement: boolean;
  blocksAutoStart: boolean;
  voiceCue: VoiceCueKey | null;
  metricProtected: boolean;
  reason:
    | PreflightPrompt
    | MovementCameraReadinessReason
    | 'tracking_lost'
    | 'recovery'
    | 'countdown'
    | 'active'
    | 'ready'
    | 'none';
};
```

Important: `voiceCue` is informational for tests/diagnostics and should be emitted by existing controllers, not spoken by the visual component.

### Adapter Inputs By Flow

Use these existing sources:

- Pipeline: `PipelineFrameOutput.state`, `validity`, `bodyUnit`, `events`, `reliableSideChains`.
- Generic preflight: `PreflightStatus.phase` and `prompt`.
- Movement readiness: `MovementCameraReadinessResult.reason`, `promptCue`, `setupCaption`.
- Legacy Check-Up: `CheckUpFrameUpdate.setupPrompt`, `SessionFrameUpdate.setupCaption`, item phase.
- Training: `TrainingFrameUpdate.setupPrompt`, `floorSetup`, `validTimeCaption`, `stepUpCorrection`, `phase`, `measuring`.
- Micro-check: `MicroCheckFrameUpdate.setupPrompt`, hands-free side setup result/caption, phase.
- MPV2: a new coordinator-owned guidance snapshot derived inside `MovementProfileV2LiveCoordinator`.

Avoid adapter inputs that inspect raw landmarks to infer production readiness. The preview's `feetVisible` helper should either remain preview-only or be replaced by a preflight/controller-owned state.

## Staged Implementation Plan

### Stage 0 - Keep Audit Boundary

No production code changes. Leave the existing experimental renderer files untouched except for separate review/cleanup.

### Stage 1 - Stabilize Renderer Contract

- Keep `FitFramePoseTraceRenderer` on the same imperative `PoseAvatarRendererHandle`.
- Add/confirm tests for visual state mapping, edge flags, mirroring, frame rect, clipping, empty/no-subject frames, and interrupted frames.
- Decide whether `visualState` should add `active` and `recovery`, or whether those map to existing `tracking`/`lost`.
- Ensure per-frame updates remain low allocation and do not create layout churn.

### Stage 2 - Shared Recording Visual Surface

- Create `RecordingVisualSurface`.
- Add a small adapter module with pure functions for `PreflightStatus`, `MovementCameraReadinessResult`, and basic pipeline state.
- Wire the Settings preview to use the same surface and adapter, preserving preview behavior.
- Add tests for adapter priority and no voice side effects.

### Stage 3 - Legacy Check-Up Behind Feature Flag

- Use `CheckUpRecordingShell.renderRecordingArea`.
- Pass guidance from `CheckUpScreen` snapshots/controller outputs.
- Verify that result recording, skip/unmeasured behavior, interruption reset, and footer metrics do not change.

### Stage 4 - Micro-Check

- Use the shared surface in both runner and hands-free side setup states.
- Adapt `MicroCheckCameraSideSetupResult` into visual guidance before runner creation.
- Preserve manual side fallback controls and tracked `go` measurement boundary.

### Stage 5 - Training

- Extract the common recording card/surface from `TrainingSessionScreen`.
- Disable `nativeSkeletonOverlayEnabled` when Fit Frame is enabled; keep any native overlay as a dev/diagnostic path only.
- Map training floor setup, valid-time pause, step-up correction, rest, and set states into guidance without changing notice priority.

### Stage 6 - Movement Profile V2

- Add coordinator-owned `visualGuidance` to the MPV2 live snapshot.
- Derive it inside the coordinator from existing hands-free, recovery, stage, and voice-runtime state.
- Use shell `renderRecordingArea` only after tests prove no change to official check-up lifecycle, artifacts, or recovery behavior.

### Stage 7 - Default Rollout

- Run on physical Android and iOS devices in realistic light.
- Capture dev recordings for any surprising framing or lost-subject behavior.
- Only then switch the default recording renderer.

## Test And QA Plan

### Unit Tests

- `fitFramePoseTraceGeometry`: edge flags, frame rect, clipping, mirroring, missing head/feet confidence.
- Adapter tests: preflight prompt to visual state; movement camera readiness to visual state; training floor setup priority; micro-check side setup priority; MPV2 recovery priority.
- Component tests for `CheckUpRecordingShell` render override to ensure footer/chrome still render.

### Replay Tests

- Use existing JSONL replay harness and pose renderer replay tooling.
- Add replay cases for:
  - subject absent -> warmup -> tracking -> ready;
  - subject leaves during active chair stands and re-enters;
  - side-view chair stand with one reliable chain;
  - front-view balance with both side chains required;
  - weak feet/ankles at bottom edge;
  - low-light preflight failure;
  - MPV2 recovery episode.
- Assert that visual guidance changes do not change rep counts, hold durations, ROM peaks, rise velocity, completion, skipped/unmeasured status, or persisted artifacts.

### Screen/Integration Tests

- Check-Up: setup, active, interruption, skip, completion.
- MPV2: hands-free chair, balance side inference/fallback, shoulder auto-capture, hinge setup, recovery, audio blocking.
- Training: preflight, floor setup, valid-time pause/recovery, step-up correction, rest, complete.
- Micro-check: no-runner hands-free side setup, runner preflight, tracked countdown `go`, active completion, manual fallback.

### Physical Device QA

- Android and iOS, Release and dev builds.
- Warm/dim home lighting, bright backlight, partial lower body near frame edge.
- Side-on and front-facing movements.
- Pausing/resuming, background/foreground, camera unavailable/emulator fallback.
- Confirm no self-view video appears and no native skeleton overlay appears in production Fit Frame mode.

### Performance QA

- Check JS frame/update cost with latency diagnostics enabled.
- Confirm UI state throttling remains around existing 100 ms screen snapshots and renderer path publication does not trigger full screen re-renders.
- Compare `npm run pose-renderer-replay` before and after integration.

Recommended validation commands after implementation:

```sh
npm test -- --runInBand src/render/__tests__/fitFramePoseTraceGeometry.test.ts
npm test -- --runInBand src/screens/__tests__/CheckUpRecordingShell.test.ts
npm test -- --runInBand src/assessment/__tests__/sessionController.test.ts src/checkup src/training src/movementProfileV2
npm run pose-renderer-replay -- 180
npx tsc --noEmit --pretty false
npx expo config
```

## Open Questions

1. Should Fit Frame have distinct `active` and `recovery` visual states, or should active map to `tracking` and recovery map to `lost`?
2. Should the "feet visible" preview heuristic become a formal preflight prompt, or remain a visual-only edge signal?
3. Should training and micro-check migrate onto `CheckUpRecordingShell`, or should a lower-level shared `RecordingCard` be extracted so naming stays flow-neutral?
4. What is the acceptable JS render/update budget for the Fit Frame trace on mid-range Android during long training sessions?
5. Should MPV2 expose a public `visualGuidance` snapshot now, or wait until the official flow's hands-free copy is finalized?

## Final Recommendation

Proceed, but only through a shared adapter/surface. The Fit Frame renderer should become the recording visual layer, not a second camera-readiness system. The first real production adoption should be legacy Movement Check-Up behind a flag because it already uses the shared shell and has clear controller-owned setup state. Training and micro-check need shared surface extraction. MPV2 should wait until its coordinator exposes visual guidance from the same official setup/recovery state it already uses for protocol decisions.
