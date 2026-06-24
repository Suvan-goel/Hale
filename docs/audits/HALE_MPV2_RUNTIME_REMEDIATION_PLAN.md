# Hale MPV2 Runtime Remediation Plan

Do not implement this plan from the audit alone; it is the ordered remediation sequence for the next engineering task.

## 1. Audible measurement start

Purpose: Add spoken countdown and go, then align active timing to audible go onset.

Affected files: src/movementProfileV2/liveCoordinator.ts, src/movementProfileV2/voiceCues.ts, src/screens/MovementProfileV2CheckUpScreen.tsx

Risk: high

Tests: fake-clock active-window tests, device onset QA

Feature flag: internal MPV2 flag

Rollback: fall back to current internal preview-disabled path

Completion gate: active start is at audible go onset on Android/iOS

## 2. Essential-speech gating

Purpose: Prevent user actions/timers from bypassing required setup/start cues.

Affected files: src/screens/MovementProfileV2CheckUpScreen.tsx, src/movementProfileV2/voiceCues.ts

Risk: medium

Tests: button gating tests, timeline regression tests

Feature flag: internal MPV2 flag

Rollback: restore non-gated controls

Completion gate: essential guidance cannot be dropped by immediate actions

## 3. Required-cue failure semantics

Purpose: Make required cue failures controller-blocking with visible fallback and retry.

Affected files: src/audio/voicePlayer.ts, src/screens/MovementProfileV2CheckUpScreen.tsx

Risk: high

Tests: missing-asset injection tests

Feature flag: dev injection flag

Rollback: disable blocking only for non-required cues

Completion gate: no measurement starts after required cue failure

## 4. Stage-scoped cancellation

Purpose: Cancel stale speech on meaningful state transitions and guard completion callbacks.

Affected files: src/audio/voicePlayer.ts, src/screens/MovementProfileV2CheckUpScreen.tsx

Risk: medium

Tests: state-exit and callback tests

Feature flag: internal MPV2 flag

Rollback: existing stop behavior

Completion gate: no old operational cue crosses stage boundary

## 5. Tracking/retry/recovery voice

Purpose: Wire tracking-loss/recovered/retry cues where appropriate and add recovery screen narration.

Affected files: src/movementProfileV2/voiceCues.ts, src/movementProfileV2/liveCoordinator.ts, src/screens/MovementProfileV2RecoveryScreen.tsx

Risk: medium

Tests: recovery branch tests

Feature flag: internal MPV2 flag

Rollback: visual recovery fallback

Completion gate: voice-first recovery branches are complete

## 6. Priority policy

Purpose: Verify or revise 50-100 classes so distinct essential transitions are not equal-priority drops.

Affected files: src/movementProfileV2/voiceCues.ts, src/audio/voicePlayer.ts

Risk: medium

Tests: priority matrix tests

Feature flag: internal MPV2 flag

Rollback: restore current priorities

Completion gate: equal-priority collisions are intentional and documented

## 7. Protocol/spec reconciliation

Purpose: Keep current single-leg balance distinct from future V2.1 staged ladder.

Affected files: docs/specs/HALE_VOICE_EXPERIENCE_SPEC_V2_1.md, src/checkup/movementProfileV2.ts

Risk: low

Tests: spec conformance checks

Feature flag: documentation only

Rollback: no runtime change

Completion gate: docs and runtime names describe actual protocol

## 8. Tests

Purpose: Add fake-clock controller, VoiceChannel failure, and full-flow timeline regression tests.

Affected files: src/movementProfileV2/__tests__, src/audio/__tests__

Risk: medium

Tests: new tests

Feature flag: n/a

Rollback: remove tests with feature

Completion gate: runtime regressions fail CI

## 9. Physical-device QA

Purpose: Measure Android/iOS audible onset, callbacks, Bluetooth, background/foreground, and voice switching.

Affected files: manual QA plan, diagnostics logging

Risk: high

Tests: device logs and waveform review

Feature flag: internal build only

Rollback: do not preview beyond internal device QA

Completion gate: device timing matches model tolerances
