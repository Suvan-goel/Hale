# Fit Frame + Premium Pose Trace Final Integration Verification

Date: 2026-06-29

> Default rollout note, 2026-06-29: Fit Frame + Premium Pose Trace is now default-on for all
> four recording flows, with temporary `EXPO_PUBLIC_DISABLE_FIT_FRAME_*` rollback flags. The
> original report below is retained as the pre-rollout default-off verification. See
> `docs/audits/FIT_FRAME_POSE_TRACE_DEFAULT_ROLLOUT.md` for the current default behavior,
> rollback semantics, validation results, and remaining manual QA checklist.

Scope: final verification only. This pass did not implement new functionality, change feature
defaults, integrate new flows, or change scoring, readiness, countdown, recovery, persistence,
Supabase sync, voice assets, or runtime TTS. The only file added by this final pass is this
audit report.

## Final Recommendation

Fit Frame + Premium Pose Trace is ready for physical QA behind default-off developer flags.
It is not ready for beta default. Keep the feature experimental until the manual device QA
checklist below passes on real Android and iOS devices for all four flows.

## Feature Flags and Defaults

| Flow | Flag | Config file | Default | Enable rule | Flag-off behavior |
| --- | --- | --- | --- | --- | --- |
| Legacy Movement Check-Up | `EXPO_PUBLIC_ENABLE_FIT_FRAME_CHECKUP` | `src/config/fitFrameCheckUpRecordingVisual.ts` | Off (`0` in `.env.example`) | Strict `value === '1'` | `CheckUpRecordingShell.renderRecordingArea` is `undefined`, so the existing shell `SkeletonView` path renders. |
| Micro-Check | `EXPO_PUBLIC_ENABLE_FIT_FRAME_MICRO_CHECK` | `src/config/fitFrameMicroCheckRecordingVisual.ts` | Off (`0` in `.env.example`) | Strict `value === '1'` | The existing Micro-Check `SkeletonView` branch renders. |
| Training | `EXPO_PUBLIC_ENABLE_FIT_FRAME_TRAINING` | `src/config/fitFrameTrainingRecordingVisual.ts` | Off (`0` in `.env.example`) | Strict `value === '1'` | Existing native skeleton overlay behavior remains enabled and no `RecordingVisualSurface` is rendered. |
| MPV2 | `EXPO_PUBLIC_ENABLE_FIT_FRAME_MPV2` | `src/config/fitFrameMpv2RecordingVisual.ts` | Off (`0` in `.env.example`) | Strict `value === '1'` | `CheckUpRecordingShell.renderRecordingArea` is `undefined`, so the existing shell `SkeletonView` path renders. |

Confirmed default entries in `.env.example`:

```env
EXPO_PUBLIC_ENABLE_FIT_FRAME_CHECKUP=0
EXPO_PUBLIC_ENABLE_FIT_FRAME_MICRO_CHECK=0
EXPO_PUBLIC_ENABLE_FIT_FRAME_TRAINING=0
EXPO_PUBLIC_ENABLE_FIT_FRAME_MPV2=0
```

## Files Touched by the Fit Frame Work

Core Fit Frame renderer and geometry:

- `src/render/FitFramePoseTraceRenderer.tsx`
- `src/render/fitFramePoseTraceGeometry.ts`
- `src/render/PrivacyShadowRenderer.tsx`
- `src/render/__tests__/fitFramePoseTraceGeometry.test.ts`

Shared recording visual surface and flow guidance:

- `src/recording/RecordingVisualSurface.tsx`
- `src/recording/recordingVisualGuidance.ts`
- `src/recording/__tests__/RecordingVisualSurface.test.ts`
- `src/recording/__tests__/recordingVisualGuidance.test.ts`
- `src/recording/__tests__/checkUpFitFrameRecordingVisual.test.ts`

Feature flags and examples:

- `.env.example`
- `src/config/fitFrameCheckUpRecordingVisual.ts`
- `src/config/fitFrameMicroCheckRecordingVisual.ts`
- `src/config/fitFrameTrainingRecordingVisual.ts`
- `src/config/fitFrameMpv2RecordingVisual.ts`

Flow integrations:

- `src/screens/CheckUpScreen.tsx`
- `src/screens/MicroCheckScreen.tsx`
- `src/screens/TrainingSessionScreen.tsx`
- `src/screens/MovementProfileV2UnifiedCheckUpScreen.tsx`
- `src/movementProfileV2/liveCoordinator.ts`
- `src/movementProfileV2/__tests__/liveCoordinator.test.ts`
- `src/screens/__tests__/MicroCheckScreen.fitFrameRecordingVisual.test.ts`
- `src/screens/__tests__/TrainingSessionScreen.fitFrameRecordingVisual.test.ts`
- `src/screens/__tests__/MovementProfileV2UnifiedCheckUpScreen.fitFrameRecordingVisual.test.ts`
- `src/screens/__tests__/MovementProfileV2UnifiedCheckUpScreen.voiceRuntime.test.ts`

Developer preview and documentation:

- `App.tsx`
- `src/screens/SettingsScreen.tsx`
- `src/screens/FitFramePoseTracePreviewScreen.tsx`
- `docs/decisions.md`
- `docs/audits/FIT_FRAME_POSE_TRACE_RECORDING_INTEGRATION_AUDIT.md`
- `docs/audits/FIT_FRAME_POSE_TRACE_FINAL_INTEGRATION_VERIFICATION.md`

Note: the working tree also contains unrelated voice/profile changes. They are outside the
Fit Frame integration scope except where the requested test suites exercised shared screens.

## Flow-by-Flow Integration Summary

### Legacy Movement Check-Up

- Flag-off preserves the old shell visual path because `renderRecordingArea` is omitted.
- Flag-on passes `renderFitFrameRecordingArea` into `CheckUpRecordingShell`.
- The flag-on recording area renders `RecordingVisualSurface` with the existing renderer ref,
  raw frame source, shell `poseWindow`, and guidance derived from the existing Check-Up
  snapshot.
- `CheckUpRecordingShell` still owns the camera unavailable notice, top chrome, help affordance,
  footer metrics, controls, latency overlay, discard modal, and camera event wiring.
- Fit Frame remains downstream of `CheckUpOrchestrator.update`; it receives already-produced
  pipeline/snapshot state and does not start, block, score, capture, persist, or complete the
  check-up.

### Micro-Check

- Flag-off preserves the old `SkeletonView` recording visual branch.
- Flag-on swaps only the central visual branch to `RecordingVisualSurface`.
- The existing `SafePoseDetectionView`, preflight, side setup, runner creation, countdown,
  scoring, summary completion, recorder, and voice path remain authoritative.
- Top bar, setup notice, help control, footer metric card, and control behavior remain around
  the visual branch and are not owned by the Fit Frame surface.
- The visual guidance is derived from existing Micro-Check state and pipeline tracking state.

### Training

- Flag-off preserves the old native overlay path because
  `nativeSkeletonOverlayEnabled={!FIT_FRAME_TRAINING_RECORDING_VISUAL_ENABLED}` evaluates to
  true.
- Flag-on disables the native skeleton overlay and renders `RecordingVisualSurface` in the
  existing avatar viewport.
- The existing training player, voice busy gate, preflight, floor setup, countdown, rep/timer/
  hold/ROM metrics, session completion, persistence, and sync behavior remain authoritative.
- Top bar, setup notice, help control, footer metrics, and control behavior remain outside the
  visual renderer.

### MPV2

- Flag-off preserves the old `CheckUpRecordingShell` default visual path.
- Flag-on passes `renderFitFrameRecordingArea` into `CheckUpRecordingShell`.
- The screen consumes `live.recordingVisualGuidance` from `MovementProfileV2LiveCoordinator`.
- Readiness, recovery, backgrounding, hands-free state, voice prerequisites, and metric
  protection for the visual guidance are coordinator-owned; the screen does not duplicate
  readiness inference for the Fit Frame visual.
- MPV2 scoring, stage progression, official fallback, side selection, recovery, raw check-up
  materialization, persistence, sync, and voice runtime remain authoritative outside the visual
  renderer.

## Confirmed Non-Changes

- No camera preview is rendered in Fit Frame mode. `RecordingVisualSurface` renders only
  `FitFramePoseTraceRenderer`, and the native `PoseDetectionView` implementation documents
  that no preview layer or preview surface is attached on either platform.
- Native/raw skeleton overlays are hidden in normal Fit Frame mode. Training explicitly disables
  `nativeSkeletonOverlayEnabled` when its Fit Frame flag is on; the other Fit Frame branches
  replace the visible shell visual slot with `RecordingVisualSurface`.
- Existing UI shells are preserved. Legacy Check-Up and MPV2 continue through
  `CheckUpRecordingShell`; Micro-Check and Training keep their existing screen chrome, notices,
  footers, and controls around the renderer substitution.
- Fit Frame remains downstream of existing flow state machines. It consumes snapshots,
  coordinator output, and pipeline frames; it does not own flow transitions.
- No visual renderer plays audio. The renderer/surface do not import or call `VoiceChannel`,
  `VoicePlayer`, `speak`, runtime TTS, or audio assets. `RecordingVisualGuidance.voiceCue` is
  descriptive guidance data and is not dispatched by the renderer; MPV2 coordinator guidance
  sets `voiceCue: null`.
- No visual renderer writes storage or Supabase. The renderer/surface do not import or call
  `AsyncStorage`, Supabase clients, `LandmarkRecorder`, persistence stores, or sync paths.
- No visual renderer starts, blocks, scores, captures, or completes sessions. Blocking fields
  in guidance are descriptive for visuals; the surface maps only `visualState` to renderer
  state and ignores capture/session control.
- Scoring, readiness, countdown, recovery, persistence, Supabase sync, voice assets, and runtime
  TTS were not changed by this final verification pass.

## Validation Results

| Command | Result |
| --- | --- |
| `npx tsc --noEmit --pretty false` | Passed. |
| `npm test -- --runInBand src/recording/__tests__` | Passed: 3 suites, 40 tests. |
| `npm test -- --runInBand src/render/__tests__/fitFramePoseTraceGeometry.test.ts` | Passed: 1 suite, 15 tests. |
| `npm test -- --runInBand src/screens/__tests__/*fitFrameRecordingVisual*` | Passed: 3 suites, 17 tests. |
| `npm test -- --runInBand src/checkup src/assessment` | Passed: 9 suites, 56 tests. |
| `npm test -- --runInBand src/training/__tests__` | Passed: 16 suites, 169 tests. |
| `npm test -- --runInBand src/movementProfileV2` | Passed: 7 suites, 54 tests. |
| `npm run pose-renderer-replay -- 180` | Passed/completed with 180 frames and renderer summaries. |
| `git diff --check` | Passed. |

Non-failing notes:

- Watchman emitted recrawl warnings during Jest runs.
- The checkup/assessment Jest run emitted a non-failing open-handle warning after completion.

## Remaining Manual Device QA Checklist

Run on real Android and iOS devices. For each flow, verify both flag-off and flag-on launches.

- [ ] Legacy Movement Check-Up flag-off shows the previous visual behavior.
- [ ] Legacy Movement Check-Up flag-on shows Fit Frame with no camera preview.
- [ ] Micro-Check flag-off shows the previous visual behavior.
- [ ] Micro-Check flag-on shows Fit Frame with no camera preview.
- [ ] Training flag-off shows the previous native skeleton overlay behavior.
- [ ] Training flag-on shows Fit Frame and no native skeleton overlay.
- [ ] MPV2 flag-off shows the previous shell visual behavior.
- [ ] MPV2 flag-on shows Fit Frame with no camera preview.
- [ ] No-subject state shows safe lost/step-into-frame visual behavior.
- [ ] Too-close state shows adjustment guidance without starting or blocking flow logic.
- [ ] Feet near or missing the lower edge highlights the lower edge correctly.
- [ ] Head near or missing the upper edge highlights the upper edge correctly.
- [ ] Off-center left and right states highlight the correct displayed side, including mirrored
  display behavior.
- [ ] Chair setup, seated readiness, countdown, and active measurement remain flow-owned.
- [ ] Balance setup, standing-leg inference, active hold, rest, and recovery remain flow-owned.
- [ ] Shoulder setup, side inference, active capture, retry, and completion remain flow-owned.
- [ ] Hinge setup, active capture, and completion remain flow-owned.
- [ ] Countdown/pre-capture audio still gates only through the existing flow/voice runtime.
- [ ] Required audio failure/retry behavior is unchanged.
- [ ] App backgrounding or tracking interruption enters the existing recovery behavior.
- [ ] Side-change or setup warning behavior is unchanged.
- [ ] Official result path and raw check-up materialization are unchanged.
- [ ] Camera unavailable path still uses the existing shell notice and controls.
- [ ] No visual-only state can start capture, continue a stage, skip a stage, complete a session,
  write a result, or sync data.

## Conclusion

The integration is structurally safe for physical QA: it is isolated by four default-off flags,
uses `RecordingVisualSurface` only in flag-on visual slots, preserves old visual paths when
flags are off, and leaves flow authority with the existing state machines. It should remain
experimental until the manual device checklist passes; do not make it a beta default yet.
