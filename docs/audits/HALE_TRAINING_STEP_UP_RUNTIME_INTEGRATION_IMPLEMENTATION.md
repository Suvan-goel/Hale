# Hale Training Step-Up Runtime Integration Implementation

## 1. Result

TRAINING_STEP_UP_RUNTIME_INTEGRATION_COMPLETE_WITH_DEVICE_QA_PENDING

## 2. Blocking Findings Addressed

- F-STEPUP-RUNTIME-INTEGRATION: addressed by `src/training/setRuntime.ts`, `src/training/sessionPlayer.ts`, and `src/training/stepUpAlternation/runtime.ts`.
- F-STEPUP-POSE-EVIDENCE-ADAPTER: addressed by `src/training/stepUpAlternation/evidenceAdapter.ts`.
- F-STEPUP-BACKEND-SYNC: addressed by generated summary, active runtime, seed, sync, and restore fields.

## 3. Runtime Selection and Ownership

The internal runtime selects only when the generated step-up item carries a valid plan, the feature flag is enabled, training voice mode is `internal_v21`, and internal capabilities are injected.

## 4. Live Pose Evidence Adapter

The adapter establishes a per-set bilateral foot-floor baseline, requires reliable lower-body/foot evidence, confirms a lead only when one foot moves first while the other remains at floor, requires a top phase, and requires both feet to return to floor.

## 5. Lead-Leg and Floor-Boundary Semantics

Ambiguous lead evidence stays unknown and receives no credit. Wrong lead attempts do not flip expected side.

## 6. Evidence-to-State Dispatch

`StepUpAlternationSetRuntime` dispatches terminal evidence through `APPLY_REP_EVIDENCE`.

## 7. Rep-Credit SFX Authority

In internal mode, `TrainingSessionPlayer` sets `playRepSound` only from `acceptedRepEvent`; generic grader credit is not used.

## 8. Live SetResult and Progression

Runtime `finish()` emits `stepUpSetResultToLegacySetResult(...)`, preserving one set, 12 total reps, and 6/6 metadata.

## 9. Pause, Background, and Restore

Pause serializes/restores at a safe boundary and retires partial attempts.

## 10. Backend Sync and Restore

Compact sync/restore now retains `stepUpAlternationPlan`, `stepUpInitialLeadSide`, `activeSetRuntime`, and `bothSidesStartSideSeed`.

## 11. Main-Plan Seed and Manual Isolation

The app flips the shared step-up seed once per successful main-plan completion id. Manual/explore/non-credit paths do not call this branch.

## 12. Training Voice V2.1 Context

Live frame updates expose the pinned plan, start lead, expected lead, accepted count, and target total for logical V2.1 planning. V2.1 remains default closed.

## 13. Feature Flags and Legacy Isolation

The public app passes metadata but not internal readiness, so ordinary sessions remain legacy.

## 14. Diagnostics

Runtime/audit diagnostics are represented in the trace and event CSVs without raw landmarks or identity fields.

## 15. Tests

Focused tests cover selection, frame-to-rep, SFX authority, SetResult, restore, backend sync/restore, seed idempotency, and voice context.

## 16. Runtime-Derived Audit

Audit metrics are recomputed from written CSV artifacts by `scripts/audits/audit-training-step-up-runtime-integration.mjs`.

## 17. Remaining Device-Only Risks

Physical-device QA and human listening remain deferred/waived.

## 18. Files Changed

See git diff for source and test footprint.

## 19. Worktree Integrity

The worktree was dirty before this task; no audio was changed or generated.

## 20. Exact Next Task

Training floor-transfer readiness gate implementation
