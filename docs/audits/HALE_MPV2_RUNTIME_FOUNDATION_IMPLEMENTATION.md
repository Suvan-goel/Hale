# Hale MPV2 Voice-Runtime Foundation Implementation

## 1. Result

Implemented tracked voice playback, MPV2 stage-scoped voice runtime, required failure retry state, user-action guards, and chair countdown/go start boundary. Static/runtime gates pass: yes.

## 2. P1 Findings Addressed

- MPV2-RT-001: chair measurement now starts from the go playback-start event, with countdown-three/two/one/go.
- MPV2-RT-002: required actions are blocked while prerequisite speech is pending.
- MPV2-RT-003: required tracked failures resolve structured outcomes and enter visible retry.
- MPV2-RT-004: measured attempts observe voice boundary actions before starting.

## 3. VoiceChannel Tracked Contract

`VoiceChannel.speakTracked` returns request id, accepted flag, and a completion promise with structured outcomes.

## 4. Required/Optional Failure Semantics

Required tracked failures stop the sequence and block MPV2 progression. Optional failures remain best-effort.

## 5. MPV2 Stage and Scope Model

`MovementProfileV2VoiceRuntime` owns stage scopes and cancels stale work by scope/epoch.

## 6. User-Action Gating

Screen buttons use runtime disabled state and handlers also call `canDispatchAction`.

## 7. Chair Countdown and Go-Start Contract

Countdown cadence is one second between cue starts. Chair active starts from `chair_go_playback_started`, dispatched by the go playback-start event.

## 8. Visible Failure and Retry

Failure copy: "Audio guidance couldn't start. Try again before continuing the check-up." Actions: Try again, Exit check-up.

## 9. Stage-Scoped Cancellation

Tracked requests are cancelled by scope on stage change, retry, background, and unmount.

## 10. Diagnostics

Runtime records bounded request/cue/cancellation/go-start diagnostics without video, landmarks, results, or identifiers.

## 11. Compatibility With Legacy Flows

Legacy `speak()` remains fire-and-forget and keeps existing priority/drop behavior.

## 12. Tests

Focused tracked voice, coordinator, runtime, and screen wiring tests were added.

## 13. Post-Fix Audit Results

- Scenarios: 42
- Variants: 378
- Timeline rows: 604
- P0/P1/P2/P3: 0/0/2/1

## 14. Remaining P2/P3 Findings

Tracking/recovery narration, mounted voice switching, and device QA remain follow-up work.

## 15. Device-Only QA

Still device-only: offset between playback-start event and sound reaching the speaker.

## 16. Files Changed

See `git diff --stat` for the current dirty worktree; this task touched audio voice player, MPV2 coordinator/runtime/screen, focused tests, and audit artifacts.

## 17. Worktree Integrity

The worktree was dirty before this patch. No audio was generated or modified by this script.
