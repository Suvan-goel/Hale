# Fit Frame + Premium Pose Trace Default Rollout

Date: 2026-06-29

## Summary

Fit Frame + Premium Pose Trace is now the default recording visual for:

- Legacy Movement Check-Up
- Micro-Check
- Training Session
- Movement Profile V2 unified Check-Up

The previous skeleton/native-overlay visuals remain available only through temporary rollback
environment flags for one more QA cycle. This rollout did not change scoring, readiness,
preflight, countdown/tracked start, active measurement, rep/hold/ROM metrics, grader logic,
side inference or persistence, recovery, completion, result materialisation, evidence policy,
persistence, Supabase sync, voice assets, runtime TTS, or audio cue sequencing.

## Config

Unset env values mean Fit Frame is on. Exact `1` on a rollback flag restores the previous visual
path for that flow. `0`, unset, or any other value keeps Fit Frame on.

| Flow | Temporary rollback flag | Default | Rollback behavior |
| --- | --- | --- | --- |
| Legacy Movement Check-Up | `EXPO_PUBLIC_DISABLE_FIT_FRAME_CHECKUP` | Fit Frame on | Restores the shell default `SkeletonView` recording area. |
| Micro-Check | `EXPO_PUBLIC_DISABLE_FIT_FRAME_MICRO_CHECK` | Fit Frame on | Restores the previous `SkeletonView` visual branch. |
| Training | `EXPO_PUBLIC_DISABLE_FIT_FRAME_TRAINING` | Fit Frame on | Restores the native skeleton overlay path. |
| MPV2 unified Check-Up | `EXPO_PUBLIC_DISABLE_FIT_FRAME_MPV2` | Fit Frame on | Restores the shell default `SkeletonView` recording area. |

Setting all four rollback flags to `1` restores the previous visuals across all four recording
flows. The old `EXPO_PUBLIC_ENABLE_FIT_FRAME_*` opt-in flags are no longer part of the documented
rollout config.

Changing Expo public env values requires restarting Metro and rebuilding the JS bundle.

## Flow Behavior

- Legacy Movement Check-Up passes `renderFitFrameRecordingArea` through
  `CheckUpRecordingShell.renderRecordingArea` by default. The shell still owns camera unavailable
  UI, chrome, footer, controls, notices, and camera event wiring.
- Micro-Check renders `RecordingVisualSurface` in the central recording visual branch by default.
  Side setup, manual fallback, tracked-go, metrics, persistence, sync, and voice remain owned by
  the existing runner and screen state.
- Training renders `RecordingVisualSurface` by default and sets
  `nativeSkeletonOverlayEnabled={!FIT_FRAME_TRAINING_RECORDING_VISUAL_ENABLED}`, so the native
  skeleton overlay is disabled in normal mode.
- MPV2 passes `renderFitFrameRecordingArea` through `CheckUpRecordingShell.renderRecordingArea`
  by default and consumes `live.recordingVisualGuidance` from
  `MovementProfileV2LiveCoordinator`. The screen does not add duplicate readiness inference for
  the visual.

## Settings Cleanup

The preview remains available only when pose latency diagnostics are enabled. In Settings it is
named "Recording visual diagnostics" and lives under the Developer section, so normal users do
not see an experimental renderer choice.

## Preserved Visual Policy

The active edge-warning policy is unchanged:

- setup/preflight uses strong amber edge warnings;
- active uses subtle critical-only amber edge warnings;
- lost/recovery overrides active edge warnings;
- wrist-only active clipping remains calm;
- head, feet, and side active warnings remain conservative and visual-only.

Fit Frame remains visual-only. It does not start, block, stop, capture, reset, score, select side,
count reps, complete sessions, write storage, sync data, play audio, or queue voice.

## Validation Results

| Command | Result |
| --- | --- |
| `npx tsc --noEmit --pretty false` | Passed. |
| `npm test -- --runInBand src/recording/__tests__` | Passed: 4 suites, 45 tests. |
| `npm test -- --runInBand src/render/__tests__/fitFramePoseTraceGeometry.test.ts` | Passed: 1 suite, 20 tests. |
| `npm test -- --runInBand src/screens/__tests__/*fitFrameRecordingVisual*` | Passed: 3 suites, 17 tests. |
| `npm test -- --runInBand src/screens/__tests__/CheckUpRecordingShell.test.ts` | Passed: 1 suite, 4 tests. |
| `npm test -- --runInBand src/checkup src/assessment` | Passed: 9 suites, 56 tests. |
| `npm test -- --runInBand src/training/__tests__` | Passed: 16 suites, 169 tests. |
| `npm test -- --runInBand src/movementProfileV2` | Passed: 7 suites, 54 tests. |
| `npm test -- --runInBand src/config/__tests__` | Passed: 6 suites, 22 tests. |
| `npm run pose-renderer-replay -- 180` | Passed/completed with 180 frames and renderer summaries. |
| `git diff --check` | Passed. |

Non-failing notes:

- Jest emitted the existing Watchman recrawl warning.
- The `src/checkup src/assessment` run emitted the existing non-failing Jest open-handle note
  after all suites passed.

## Remaining Manual Device QA

Do not mark these complete until they have been run on real Android and iOS devices.

All flows:

- [ ] no person detected
- [ ] too close
- [ ] too far
- [ ] feet near or missing bottom edge
- [ ] head near or missing top edge
- [ ] off-centre left/right
- [ ] ready dwell
- [ ] countdown / tracked start / capture prep
- [ ] active movement
- [ ] active critical edge warning
- [ ] wrist-only active clipping stays calm
- [ ] tracking lost
- [ ] recovery
- [ ] completion/result path
- [ ] camera unavailable path
- [ ] rollback flag path

Legacy Check-Up:

- [ ] chair stand
- [ ] balance
- [ ] shoulder
- [ ] hinge
- [ ] skip/unmeasured path

Micro-Check:

- [ ] hands-free side setup
- [ ] manual side fallback
- [ ] runner creation
- [ ] tracked go
- [ ] weekly persistence

Training:

- [ ] floor setup
- [ ] active reps
- [ ] timed hold
- [ ] ROM/mobility
- [ ] valid-time recovery
- [ ] step-up correction
- [ ] rest/set transition
- [ ] session completion

MPV2:

- [ ] chair setup/active
- [ ] balance side inference/hold
- [ ] shoulder side inference/auto-capture
- [ ] hinge setup/active
- [ ] recovery episode
- [ ] background/foreground interruption
- [ ] audio blocking
- [ ] side-change warning
- [ ] raw check-up materialisation
- [ ] official result path
