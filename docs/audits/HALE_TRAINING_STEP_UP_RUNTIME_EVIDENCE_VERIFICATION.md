# Hale Training Step-Up Runtime Evidence Verification

## Primary Verdict

TRAINING_STEP_UP_RUNTIME_EVIDENCE_VERIFIED_WITH_DEVICE_QA_PENDING

Exact next task: Training floor-transfer readiness gate implementation

## Worktree Safety Record

- Task-start branch: dev
- Task-start HEAD: 2b3e28b
- Upstream: origin/dev
- Already dirty at task start: true
- Pre-existing relevant changes: src/screens/TrainingSessionScreen.tsx, src/services/backend/restoreService.ts, src/services/backend/trainingStateSyncService.ts, src/training/serialize.ts, src/training/sessionPlayer.ts, src/training/stepUpAlternation/index.ts, src/training/workoutGeneration.ts, src/training/setRuntime.ts, src/training/stepUpAlternation/evidenceAdapter.ts, src/training/stepUpAlternation/runtime.ts, src/training/stepUpAlternation/__tests__/stepUpRuntimeIntegration.test.ts
- Pre-existing audio diff: none
- Audit-disallowed written files: 0
- Outside-addendum diff currently present: src/screens/CameraExplanationScreen.tsx, src/screens/ExploreDetailScreens.tsx, src/screens/ExploreScreen.tsx, src/screens/MovementProfileV2BlockReportScreen.tsx, src/screens/MovementProfileV2ResultsScreen.tsx, src/screens/PlanScreen.tsx, src/screens/ProgressScreen.tsx, src/screens/SafetyProfileScreen.tsx, src/screens/TodayScreen.tsx, src/theme/index.ts, docs/audits/Hale_Unified_Movement_CheckUp_Stage_H4_1_Continuation_Prompt.md

## Critical Metrics

- duplicateStaleCreditCount: 0
- genericAlternationDoubleCreditCount: 0
- setResultDuplicationCount: 0
- invalidProgressionAcceptanceCount: 0
- localRoundTripFailureCount: 0
- backendRoundTripFailureCount: 0
- seedMutationFailureCount: 0
- voiceContextMismatchCount: 0
- p0/p1/p2/p3: 0/0/0/2

All P-counts are derived from the findings array. Critical zero-valued metrics are recomputed from the written scenario, event, and lifecycle CSV rows, then mutation-tested in memory.

## Coverage

- Prior canonical rows retained: 54
- Executed scenario rows: 29
- Event-evidence rows: 71
- Lifecycle rows: 11
- Runtime trace: 15 connected_verified, 1 not_applicable
- Focused Jest status: passed

## Completion Gates

| Gate | Status | Observed | Required |
|---|---|---|---|
| duplicate_stale_credit_zero | pass | 0 | 0 |
| generic_alternation_double_credit_zero | pass | 0 | 0 |
| set_result_duplication_zero | pass | 0 | 0 |
| invalid_progression_acceptance_zero | pass | 0 | 0 |
| local_roundtrip_failure_zero | pass | 0 | 0 |
| backend_roundtrip_failure_zero | pass | 0 | 0 |
| seed_mutation_failure_zero | pass | 0 | 0 |
| voice_context_mismatch_zero | pass | 0 | 0 |
| trace_16_links_current | pass | 15 connected, 1 not_applicable, 0 uncertain | 15 connected, 1 not_applicable, 0 missing/partial/legacy/uncertain |
| focused_jest_passed | pass | passed | passed |
| default_closed_boundaries_preserved | pass | 0 | 0 |
| audio_unchanged | pass | 0/0 | 0/0 |
| addendum_footprint_audit_only | pass |  | audit wrote only requested audit artifacts and harness |

## Runtime Trace

| Link | Status | Path | Evidence |
|---:|---|---|---|
| 1 | connected_verified | Exercise registry -> Generated session item | GeneratedExercise can carry step-up alternation metadata. |
| 2 | connected_verified | Final prescription -> Alternation plan | Generated sessions can receive one pinned step-up plan when gated. |
| 3 | connected_verified | Feature/readiness selector -> Active internal runtime path | Selector routes only gated internal V2.1-capable step-up items. |
| 4 | connected_verified | Training screen/session controller -> Alternation runtime owner | Screen can pass internal capabilities and player owns one runtime. |
| 5 | connected_verified | Pose/grader output -> Lead-leg and floor-boundary evidence | Adapter derives observed lead, top phase, return, floor baseline, and tracking validity. |
| 6 | connected_verified | Evidence -> Alternation state-machine action | Runtime dispatches terminal evidence to the reducer and reducer suppresses duplicate/stale callbacks. |
| 7 | connected_verified | Accepted alternation rep -> Rep-credit SFX | Internal SFX is driven by alternation acceptedRepEvent, while generic repCredited remains false. |
| 8 | connected_verified | Alternation state -> SetResult | Runtime finish emits an adapted SetResult with step-up metadata. |
| 9 | connected_verified | SetResult -> Progression | Progression consumes adapted SetResult as one reps set. |
| 10 | not_applicable | SetResult -> Valid-time summary | Step-up is rep-based and has no valid-time payload to double. |
| 11 | connected_verified | Active alternation state -> Local serialization | Active runtime envelope is schema-versioned and JSON-safe. |
| 12 | connected_verified | Local serialization -> Live restore | Restore validates fingerprint and retires partial attempts. |
| 13 | connected_verified | Training state -> Backend JSON sync/restore | Compact backend state retains generated plan, active runtime, and seed. |
| 14 | connected_verified | Successful main-plan completion -> Initial-lead seed flip | Main-plan step-up completion flips the shared seed once. |
| 15 | connected_verified | Manual/Explore completion -> No main-plan seed mutation | Seed helper remains gated to main-plan completion; manual/explore scenarios use false main-plan credit. |
| 16 | connected_verified | Active alternation state -> Training Voice V2.1 planner | Live context carries pinned plan and expected lead for logical V2.1 planning. |

## Findings

- F-STEPUP-PHYSICAL-DEVICE-QA-DEFERRED (P3, deferred): Physical-device QA remains explicitly deferred by project boundary.
- F-STEPUP-HUMAN-LISTENING-WAIVED (P3, waived): Human listening remains waived; no audio assets were generated, renamed, moved, or replaced.

## Mutation Sensitivity

- sensitivity_duplicate_stale_credit: pass (0 -> 1)
- sensitivity_generic_alternation_double_credit: pass (0 -> 1)
- sensitivity_set_result_duplication: pass (0 -> 2)
- sensitivity_invalid_progression_acceptance: pass (0 -> 1)
- sensitivity_local_roundtrip_failure: pass (0 -> 1)
- sensitivity_backend_roundtrip_failure: pass (0 -> 1)
- sensitivity_seed_mutation_failure: pass (0 -> 1)
- sensitivity_voice_context_mismatch: pass (0 -> 1)
- sensitivity_p0_from_findings: pass (0 -> 1)
- sensitivity_p1_from_findings: pass (0 -> 1)
- sensitivity_p2_from_findings: pass (0 -> 1)
- sensitivity_verdict_from_gates: pass (computed from gates -> TRAINING_STEP_UP_RUNTIME_EVIDENCE_REMEDIATION_REQUIRED)

## Project Boundaries Preserved

- Step-up alternation feature: default off
- Training Voice V2.1: default off
- Training Voice V2.1 audio ready: false
- Training Voice V2.1 global behaviour ready: false
- Balance V2: default closed / audio pending
- Human listening: waived, not completed
- Physical-device QA: deferred
- Audio/API: no audio generated and no external speech API called
