# Pearl Unified Movement Check-Up Stage H1 - V1 Shell / V2 Adapter

Date: 2026-06-24

## Scope

Stage H1 extracted the polished public V1 Movement Check-Up recording surface into a shared typed shell, kept V1 as the public/default check-up implementation, and added an internal-only Movement Profile V2 adapter that runs the existing live coordinator and voice runtime through that shell.

This stage did not change Movement Profile V2 protocols, scoring, source tables, Warden/reference materialization, audio assets, audio generation, package dependencies, lockfiles, font dependencies, or public route selection.

## Baseline

The worktree was already dirty before H1 began, including App, V2 check-up, micro-check, renderer, diagnostics, backend, history, and audit/documentation files. H1 edits were kept to the shell extraction and internal route/adapter files. Existing dirty changes were not reverted.

Baseline validation before H1 edits:

- Focused V1/V2 suite passed: 11 suites, 73 tests.
- `npm run verify:audio` passed: safety requiredAssets=88, movementProfileV2 requiredAssets=62, total requiredAssets=150.
- Full Jest passed: 129 suites, 1070 tests.
- `npm run typecheck`, `npm --prefix website run typecheck`, `npx --no-install expo config --type public`, and `git diff --check` passed.
- `npx --no-install expo export --platform all --output-dir /tmp/pearl-unified-h1-baseline-export` passed and the temp export directory was removed.

## Implementation

Added `src/screens/CheckUpRecordingShell.tsx`.

- Owns the shared polished recording presentation: full-screen safe pose view, skeleton viewport, Pearl logo chrome, compact setup notice, help button, footer metric card, bottom controls, help modal, and discard modal.
- Exposes typed view-model/action props: shell notice, footer meta, stage display, controls, modal mode, camera availability, skeleton ref, pose callbacks, avatar measurement state, and active domain.
- Remains presentation-only. It does not import V1 orchestrator logic, V2 live coordinator logic, scoring, reference materialization, or Warden/source table code.

Updated `src/screens/CheckUpScreen.tsx`.

- Keeps the V1 `CheckUpOrchestrator`, `PosePipeline`, `LandmarkRecorder`, voice, SFX, pause/resume/discard behavior, setup retry, skip, and repeat-instructions behavior in the V1 screen.
- Converts V1 state into `CheckUpRecordingShell` props.
- Preserves the public V1 route and camera/skeleton behavior. The hot path still processes frames outside React and submits renderer updates through `skeletonRef.current?.update(...)`.

Added `src/screens/MovementProfileV2UnifiedCheckUpScreen.tsx`.

- Uses `MovementProfileV2LiveCoordinator`, `createMovementProfileV2LivePoseSample`, `MovementProfileV2VoiceRuntime`, and the existing legacy voice sequencer rollback path.
- Preserves voice-gated actions via `canDispatchAction(...)`.
- Uses live pose samples, not canned captured results or mock controls.
- Maps V2 live stages to shell title, footer meta, compact notice, stage metric, avatar state/domain, and action buttons.
- Keeps V2 side-continuity behavior in the internal adapter controls: same-side continuation, explicit other-side fallback, and comparability warning notice.

Updated `App.tsx` and `src/screens/SettingsScreen.tsx`.

- Added internal flow `movement-profile-v2-unified-checkup`.
- Added it to camera-gated flows.
- Added an internal Settings row: "Movement Profile V2 unified shell".
- Preserved the existing internal `movement-profile-v2-checkup` route and `MovementProfileV2CheckUpScreen` comparison harness.
- Preserved the public `checkup` route rendering `CheckUpScreen`.

Added `src/screens/__tests__/CheckUpRecordingShell.test.ts`.

- Guards that the shared shell stays presentation-only.
- Guards that V1 uses the shell while keeping its controller.
- Guards that the V2 unified adapter uses the live coordinator/runtime and no canned captures.
- Guards that the new internal route is additive and does not replace the public V1 route or existing V2 harness.

## H1 Files

H1-owned changes:

- `src/screens/CheckUpRecordingShell.tsx`
- `src/screens/CheckUpScreen.tsx`
- `src/screens/MovementProfileV2UnifiedCheckUpScreen.tsx`
- `src/screens/__tests__/CheckUpRecordingShell.test.ts`
- `src/screens/SettingsScreen.tsx`
- `App.tsx` route/launcher additions only
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H1_V1_SHELL_V2_ADAPTER.md`

Note: `App.tsx` had unrelated pre-existing/concurrent micro-check side-setup changes; H1 did not revert them.

## Validation

Focused H1/V1/V2 suite:

`npm test -- --runInBand src/screens/__tests__/CheckUpRecordingShell.test.ts src/checkup/__tests__/checkup.test.ts src/checkup/__tests__/checkupFlow.integration.test.ts src/assessment/__tests__/sessionController.test.ts src/screens/__tests__/recordingViewport.test.ts src/movementProfileV2/__tests__/internalCheckupFlow.test.ts src/movementProfileV2/__tests__/liveCoordinator.test.ts src/movementProfileV2/__tests__/voiceRuntime.test.ts src/movementProfileV2/__tests__/voiceCues.test.ts src/screens/__tests__/MovementProfileV2CheckUpScreen.voiceRuntime.test.ts src/config/__tests__/movementProfileV2Internal.test.ts src/pearlFlow/__tests__/appLifecycle.test.ts`

Result: passed, 12 suites, 77 tests.

Full validation:

- `npm run typecheck`: passed.
- `npm run verify:audio`: passed.
  - safety: requiredCues=44, voices=clara,marcus, requiredAssets=88, totalBytes=4637324, durationRange=1.858-5.155s.
  - movementProfileV2: requiredCues=31, voices=clara,marcus, requiredAssets=62, totalBytes=3057566, durationRange=0.743-6.037s.
  - total requiredAssets=150.
- `npm --prefix website run typecheck`: passed.
- `npx --no-install expo config --type public`: passed.
  - Expo loaded local env files and printed env variable names only.
  - Existing Sentry config warning remained.
- `git diff --check`: passed.
- `npm test -- --runInBand`: passed, 131 suites, 1076 tests.
  - Existing Watchman recrawl warning remained.
  - Jest still emitted the existing post-run open-handle warning after successful completion.
- `npx --no-install expo export --platform all --output-dir /tmp/pearl-unified-h1-export`: passed.
  - Android bundle completed.
  - iOS bundle completed.
  - Assets: 444.
  - Temp export directory was removed after the command.
  - Existing Sentry config warning and Node `NO_COLOR` / `FORCE_COLOR` warnings remained.

## Product Containment

- Public Movement Check-Up still uses V1 `CheckUpScreen`.
- V2 unified shell flow is internal-only behind the existing Movement Profile V2 internal flag path.
- Existing standalone V2 internal harness remains reachable for comparison/debugging.
- Camera video remains hidden; the shared shell renders the skeleton/figure surface only.
- No form-judging copy or medical-claim copy was added.
- No audio files were generated or modified.
- No runtime TTS dependency was added.
- No package install, package manifest edit, or lockfile edit was performed.
- No Warden/reference/source-table/scoring/materialization changes were made.
- No device QA was performed in this stage; validation is software-level only.

## Status

UNIFIED MOVEMENT CHECK-UP STAGE H1 COMPLETE

SHARED POLISHED CHECKUP SHELL IMPLEMENTED

V1 CHECKUPSCREEN VISUAL AND BEHAVIOR PARITY VERIFIED

V2 LIVE COORDINATOR ADAPTER IMPLEMENTED

INTERNAL UNIFIED V2 SHELL FLOW VERIFIED

UNIFIED MOVEMENT CHECK-UP STAGE H2 UNBLOCKED
