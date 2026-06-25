# Hale Eyes-Open Balance Protocol V2 Implementation

## 1. Result

Implemented the approved FD-003 eyes-open balance protocol as additive software, with verdict `software_complete_audio_pending`. The new protocol is registered, typed, test-covered, persistence-safe, and separated from the old MPV2 single-leg protocol. The live MPV2 default remains the old rollback path because exact V2 stage-specific voice pairs are not yet generated.

## 2. Approved FD-003 Contract

The implemented protocol is eyes-open only:

1. `feet_together_eyes_open_v2` - 10,000 ms
2. `semi_tandem_eyes_open_v2` - 10,000 ms
3. `tandem_eyes_open_v2` - 10,000 ms
4. `single_leg_eyes_open_v2` - 12,000 ms

Eyes-closed stages are not part of the V2 default path.

## 3. Old and New Protocol Separation

Old MPV2 balance remains `mpv2_single_leg_balance_45s_v1` on movement `one-leg-balance-45s-v2`. New V2 balance uses movement `balance-eyes-open-v2`, protocol `home_balance_eyes_open_v2`, version `2`, and comparison group `home_balance_eyes_open_ladder`. No old result is rewritten or aliased.

## 4. Protocol and Battery Versioning

`movement_profile_v2_battery` now has version `1` for old MPV2 single-leg balance and version `2` for the eyes-open ladder. Existing stored `measurementProtocol` is preserved during normalization. Missing battery metadata is inferred from actual items, so old records do not become V2 because of a current default.

## 5. Stage Descriptors

Stage descriptors live in `src/movements/balanceEyesOpenV2.ts` as an immutable descriptor list. Stage 1 is side-independent. Stages 2 and 3 use the selected side as lead foot. Stage 4 uses it as standing leg.

## 6. Stage State Machine

`BalanceEyesOpenV2ProtocolController` models setup, stage setup, stage ready, stage active, tracking recovery, ladder complete, and cancelled states. A stage cannot start until setup is confirmed and the external runtime calls `startCurrentStageFromGo`.

## 7. Progression and Early-Termination Rules

A harder stage begins only after the current stage records `completed_cap`. Early `step_detected`, `stance_lost`, `touchdown`, `support_touch_user_reported`, or `user_stopped` ends the ladder and saves the maintained time as a valid raw outcome.

## 8. Tracking Recovery

Tracking interruption records a retry event with discarded partial time, stores no valid stage result for that partial attempt, and returns to the same stage for a fresh setup/countdown.

## 9. Side and Lead-Foot Semantics

The protocol-level side is selected standing leg. Semi-tandem and tandem reuse that side as the lead foot. Retry, recovery, persistence, and micro-check recommendation preserve the selected side.

## 10. Voice Runtime Integration

No new MPV2 cue IDs were added because new MP3 generation is out of scope. Existing required-speech infrastructure is preserved. The V2 live gate is default-closed through `EXPO_PUBLIC_ENABLE_EYES_OPEN_BALANCE_PROTOCOL_V2` plus `EYES_OPEN_BALANCE_PROTOCOL_V2_AUDIO_READY=false`.

## 11. Cue Reuse and Pending Assets

Reusable exact pairs include `checkup-balance-intro-v21`, `final-position-set-v21`, countdown cues, `go`, `times-up-v21`, `tracking-loss-v21`, `tracking-recovered-v21`, `retry-v21`, `item-complete-v21`, and `mpv2_balance_complete`. Stage-specific side-aware setup cues remain pending.

## 12. Result Evidence and Scoring Boundary

The V2 result stores per-stage evidence, selected side, total maintained ms, total cap ms, completed stage count, terminal stage, and completion reason. The reference engine treats V2 balance as `raw_only_reference_unavailable`; it does not feed V2 evidence into Springer 45-second best-of-three scoring.

## 13. Persistence, Sync, and Restore

The result is JSON-safe and additive. History serialization preserves stored measurement protocol metadata and stage arrays. Old clients can ignore additive result fields.

## 14. History and Comparability

Old and new balance protocols have separate series. Same-protocol same-side V2 retests can compare later; first V2 establishes a new V2 baseline. Old/new direct deltas are suppressed.

## 15. Micro-Check Side Recommendation

Balance micro-check side setup now prefers a valid official V2 standing-leg anchor, then falls back to old MPV2 single-leg. The micro-check still establishes its own series and never overwrites the official anchor.

## 16. Feature Flag and Rollback

Flag: `EXPO_PUBLIC_ENABLE_EYES_OPEN_BALANCE_PROTOCOL_V2`. Default: off. Audio readiness constant: `false`. Runtime selectable only when the flag is `1` and audio readiness is true. Current live default remains old MPV2 single-leg balance.

## 17. Diagnostics

The audit harness checks protocol selection, stage integrity, tracking discard behavior, old/new separation, cue policy, pending asset gating, and audio diff status. No raw video, landmarks, names, or account identifiers are logged.

## 18. Tests

Added/updated focused tests for registry, comparability, controller stages, tracking discard, internal flow ordering, micro-check anchor precedence, feature flag gating, and reference-engine raw-only behavior.

## 19. Files Changed

Production files changed: `src/config/eyesOpenBalanceProtocolV2.ts`, `src/checkup/protocolSetup.ts`, `src/checkup/index.ts`, `src/checkup/measurementProtocolRegistry.ts`, `src/checkup/measurementMetadata.ts`, `src/checkup/movementProfileV2.ts`, `src/movements/index.ts`, `src/movements/balanceEyesOpenV2.ts`, `src/movementProfileV2/internalCheckupFlow.ts`, `src/training/microCheckSideSetup.ts`, `src/reference/movementProfileV2/types.ts`, `src/reference/movementProfileV2/engine.ts`, `src/reference/movementProfileV2/snapshot.ts`, and `src/movementProfileV2/viewModel.ts`.

## 20. Worktree Integrity

The worktree was already dirty before this task. No reset, checkout, stash, clean, commit, push, audio generation, or external speech/audio API call was performed.

## 21. Exact Next Phase

Training Voice V2.1 implementation foundation and exact instruction mapping for all 37 registered exercise levels.
