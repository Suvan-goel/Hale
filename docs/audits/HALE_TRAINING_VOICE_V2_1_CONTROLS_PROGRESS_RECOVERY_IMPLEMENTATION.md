# Hale Training Voice V2.1 Controls, Progress, and Recovery Implementation

## 1. Result

TRAINING_VOICE_V2_1_CONTROLS_PROGRESS_RECOVERY_SOFTWARE_COMPLETE

## 2. Entry Baseline

Entry gates were run before production edits: `npm run verify:audio`, `npx tsc --noEmit --pretty false`, the live-safety audit harness, and focused Training Voice/safety suites.

## 3. Controller and Voice Authority Boundary

The canonical training controller remains authoritative for reps, sets, skips, pause/restore, progression, and persistence. V2.1 voice owns tracked sequencing, countdown/go gating, optional progress, voice scopes, recovery narration, and stale callback rejection.

## 4. Runtime Phases and Scopes

Implemented phases: idle, session_entry, item_setup, repeat_instructions, countdown, active, paused, tracking_recovery, reactive_safety_stop, rest_transition, item_transition, session_completion, audio_failure, cancelled.

## 5. Audible Countdown and Go Start

Countdown is `Three. Two. One. Go!`; the default-closed internal path enters active work only from `go` playback-start.

## 6. Pause and Resume

Pause is controller-first and confirms with `paused-v21`. Resume confirms with `resuming-v21`, returns through setup/final-position/readiness, and requires a fresh countdown before active work.

## 7. Repeat Instructions

Repeat Instructions replays current exercise instruction, current side/lead context, and current target only; it excludes universal safety, family safety, set count, progress, and unrelated recovery.

## 8. Retry, Skip, and Cancel

Retry is an optional transition cue followed by required setup/countdown. Skip is accepted by the controller first and does not emit immediate `next-exercise-v21`. Cancel is silent and invalidates all callbacks.

## 9. Progress Scheduler and Rep SFX

Rep sets use SFX only. 15s uses five-left at 10s; 20s uses halfway at 10s and five-left at 15s; 30s uses halfway at 15s and five-left at 25s; 12/14s ROM and 6/7.5/10s side segments are silent.

## 10. Times-Up and Transition Planner

Timed windows use `times-up-v21` without redundant `set-complete-v21`. Rest starts at `rest-now-v21` playback-start in the V2.1 contract.

## 11. Both-Sides Runtime Integration

First-side completion emits only the semantic side-switch cue and fresh setup/countdown. The second side completes the round/set.

## 12. Step-Up Runtime Integration

Accepted step-up reps use SFX only. Wrong-lead correction remains event-driven, not per normal rep.

## 13. Floor Runtime Integration

Floor memory and final-position readiness are preserved. Controls/recovery return through final-position setup without repeating long floor transition unnecessarily.

## 14. Tracking-Loss and Recovery

One recovery episode is created per active attempt loss. Repeated loss dedupes; stable recovery requires current readiness and a fresh full countdown.

## 15. Reactive Safety Migration

14 deferred reactive safety rows now have destinations; unclassified rows, fake automatic detection, health auto-resume, and equipment auto-resume counts are zero.

## 16. Mounted Voice Switching

Setup/countdown/recovery switches cancel old scopes and replay required context. Active-work switches are deferred to a safe boundary.

## 17. Failure and Visible Fallback Semantics

Required setup/countdown/control failures enter visible audio failure or safe fallback. Missing optional progress is silently dropped.

## 18. Persistence and Restore

The additive `activeTrainingVoiceRuntime` envelope serializes safety memory, epochs, completed transitions, fired progress ids, and voice ids. Active restores to setup, not active work.

## 19. Generated, Manual, and Explore Parity

The runtime models are contract-driven by the final exercise id/target, so generated, short, restart, supporting, manual, Explore, and substituted paths share behavior when internal readiness is injected.

## 20. Runtime Readiness and Blocker Reconciliation

Controls/progress/recovery/safety ready are true; behavior ready is derived true. Audio ready remains false and selectable exercises remain zero.

## 21. Asset Requirements

Logical control assets are recorded in docs/audits/HALE_TRAINING_VOICE_V2_1_CONTROL_ASSET_REQUIREMENTS.csv. No physical manifest entries or audio files were added.

## 22. Timing Budgets

All estimated control/recovery timelines pass hard max budgets. Estimates are labelled; physical audible onset remains device QA.

## 23. Diagnostics

Runtime events carry session/item/set/attempt epochs and scope ids so stale callbacks cannot cross boundaries.

## 24. Tests

Focused tests cover controls, countdown/go, progress, transitions, recovery, reactive safety, serialization, backend compact sync/restore, and session-player tracked-go gating.

## 25. Audit Results

See docs/audits/HALE_TRAINING_VOICE_V2_1_CONTROLS_PROGRESS_RECOVERY_AUDIT.json.

## 26. Remaining Audio/Schema/Device Boundaries

Audio assets, final cue schema/physical manifests, human listening, and physical-device QA remain deferred.

## 27. Files Changed

Production: `src/training/voiceV21/*`, `src/training/sessionPlayer.ts`, `src/screens/TrainingSessionScreen.tsx`, `src/training/serialize.ts`, backend compact mappers, and cue typing.

## 28. Worktree Integrity

The worktree was already dirty. No audio files were changed or generated.

## 29. Exact Next Phase

Micro-Check Voice V2.1 implementation
