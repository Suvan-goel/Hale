# Pearl Training Step-Up Alternation Verification Addendum

## 1. Executive Verdict

TRAINING_STEP_UP_ALTERNATION_MODEL_COMPLETE_RUNTIME_INTEGRATION_PENDING

The isolated/default-closed step-up model verifies cleanly across all 53 canonical scenarios, but the runtime trace does not prove end-to-end integration. The floor-transfer gate should not begin yet.

Exact next task: Training step-up alternation runtime integration patch

## 2. Why the Addendum Was Required

The original audit had 27 scenarios and did not distinguish a correct isolated model from a live internal runtime path. This addendum expands scenario coverage, derives metrics from written CSV artifacts, and adds an explicit source-level runtime integration trace.

## 3. Worktree and Source Freshness

- Task-start branch: dev
- Task-start HEAD: be514ce
- Upstream: origin/dev
- Pre-existing diff files: App.tsx, src/pearlFlow/__tests__/movementProfileV2OfficialRetestTransition.test.ts, src/results/__tests__/movementProfileV2ResultsAdapter.test.ts, src/services/backend/__tests__/blockReportSyncService.test.ts
- Pre-existing audio diff files: 0
- Source freshness: current source could be verified; no rebase required

## 4. Current Implementation Surface

- Step-up definition remains 3 sets x 12 reps.
- Alternation model files live under `src/training/stepUpAlternation/`.
- Generated exercise and local serializer types can carry step-up alternation metadata.
- Training Voice V2.1 can plan logical start-lead and wrong-lead cues when supplied `stepUpContext`.
- Live legacy `TrainingSessionPlayer` still consumes `ExerciseSetGrader` directly.

## 5. Runtime Integration Trace

| Link | Status | Blocker | Evidence |
|---:|---|---|---|
| 1 | connected_verified |  | Step-up registry definition is present and generated exercise metadata type can represent exerciseId/sets/reps. |
| 2 | connected_verified |  | Plan derivation from generated exercise preserves 12 total reps and 6/6 split. |
| 3 | model_only_not_connected | F-STEPUP-RUNTIME-INTEGRATION | Selector exists, but TrainingSessionPlayer has no branch that selects a step-up alternation runtime owner. |
| 4 | model_only_not_connected | F-STEPUP-RUNTIME-INTEGRATION | Screen creates TrainingSessionPlayer(exerciseIds, preflight) only; player owns ExerciseSetGrader only. |
| 5 | model_only_not_connected | F-STEPUP-POSE-EVIDENCE-ADAPTER | RepsSetGrader reports generic repCredited/repCount and sticky near side, but does not emit observed lead, both-feet-floor boundary, or top/floor evidence for StepUpRepEvidence. |
| 6 | model_only_not_connected | F-STEPUP-RUNTIME-INTEGRATION | Pure action works in scenarios, but no live adapter dispatches it. |
| 7 | legacy_only | F-STEPUP-RUNTIME-INTEGRATION | Screen plays SFX from generic grader update, not from step-up alternation accepted evidence. |
| 8 | model_only_not_connected | F-STEPUP-RUNTIME-INTEGRATION | Adapter produces SetResult in scenarios, but TrainingSessionPlayer still pushes grader.finish(ts). |
| 9 | partially_connected | F-STEPUP-RUNTIME-INTEGRATION | Progression accepts adapted SetResult if supplied, but live runtime does not supply it. |
| 10 | not_applicable |  | Step-up rep SetResults have no validTime payload; summarizeValidTimeSets returns null. |
| 11 | partially_connected | F-STEPUP-RUNTIME-INTEGRATION | Generated metadata and model runtime envelopes serialize, but live TrainingState has no active step-up runtime state field. |
| 12 | partially_connected | F-STEPUP-RUNTIME-INTEGRATION | Deserializer accepts generated metadata and runtime envelope helper validates fingerprint, but live restore does not reconstruct a session-owned alternation state. |
| 13 | partially_connected | F-STEPUP-BACKEND-SYNC | Backend sanitizer omits stepUpAlternationPlan and stepUpInitialLeadSide from generated exercise summaries. |
| 14 | partially_connected | F-STEPUP-RUNTIME-INTEGRATION | Seed helper supports step-up and is idempotent, but no live completion path calls it for step-up. |
| 15 | partially_connected | F-STEPUP-RUNTIME-INTEGRATION | Helper can avoid manual mutation with countsTowardMainPlan=false, but live manual/explore completion is not integrated with the helper. |
| 16 | connected_verified |  | Planner emits start-left/start-right and wrong-lead correction logical plans from StepUpContext; V2.1 remains default closed. |

Missing/partial links: 12

## 6. Canonical Scenario Coverage

- Canonical scenario ids present: 53 / 53
- Omitted canonical scenario count: 0
- Scenario rows: 54
- Event rows: 134

## 7. Normal Alternation Results

Both left-first and right-first 12-rep sets complete as 6 left-leading and 6 right-leading reps. Three-set start orders verify as L/R/L and R/L/R.

## 8. Wrong-Lead and Evidence Rejection

Wrong lead, unknown lead, and opposite-chain-clearer-without-lead evidence all reject without credit, SFX, or expected-lead flip.

## 9. Floor-Boundary and Duplicate Handling

Top-without-return and one-foot-on-step attempts reject. Duplicate, stale, and threshold-noise callbacks are visible in the event CSV and do not add credit.

## 10. Interruption, Pause, Background, and Restore

Tracking loss, pause, background, and mid-rep restore retire partial attempts. Restore after six reps preserves counts, expected lead, and plan fingerprint.

## 11. Target Variants

Default target 12 and even target 10 are supported. Odd target 9 and non-integer targets are blocked, not silently adjusted.

## 12. Seed and Order Persistence

Seed defaults left, flips after successful main-plan completion, and remains stable for skip/manual/duplicate/sync-restore cases at helper level.

## 13. Progression and Valid-Time Aggregation

One 12-rep set remains one `SetResult`; lead counts do not double set count. Invalid alternation and side imbalance are not progression eligible. Step-up has no valid-time payload to double.

## 14. Training Voice V2.1 and Feature Isolation

Start-left/start-right and wrong-lead correction logical plans match the expected side. There is no per-rep spoken switch. Training Voice V2.1 remains default-closed and `IR-VOICE-STEP-ALTERNATION` remaining is 0.

## 15. Derived Metric Method

The harness writes scenario, event, and trace CSV files, reopens them from disk, recomputes metrics, derives findings, and only then emits JSON/Markdown.

## 16. Findings

### F-STEPUP-RUNTIME-INTEGRATION (P2)

Step-up alternation is not connected end to end to the training runtime

- Trigger: runtimeIntegrationMissingLinkCount/runtimeIntegrationPartialLinkCount
- Blocks floor gate: true
- Consequence: Enabling the flag would not make the live camera session own alternation state, adapt lead-leg evidence, or emit alternation-aware SetResults.
- Recommended next task: Training step-up alternation runtime integration patch

### F-STEPUP-POSE-EVIDENCE-ADAPTER (P2)

Live step-up grader does not produce lead-leg and floor-boundary evidence

- Trigger: runtimeIntegrationMissingLinkCount
- Blocks floor gate: true
- Consequence: The live camera path cannot prove the FD-005 accepted-rep contract from real pose frames.
- Recommended next task: Training step-up alternation runtime integration patch

### F-STEPUP-BACKEND-SYNC (P2)

Backend compact training-state sync omits step-up alternation generated metadata

- Trigger: runtimeIntegrationPartialLinkCount
- Blocks floor gate: true
- Consequence: A remote compact snapshot would not preserve the generated alternation plan metadata needed by an integrated runtime path.
- Recommended next task: Training step-up alternation runtime integration patch

### F-STEPUP-PHYSICAL-QA-DEFERRED (P3)

Physical-device validation of lead-leg/floor-boundary reliability is deferred

- Trigger: project boundary
- Blocks floor gate: false
- Consequence: The pure model is verified, but camera reliability in real homes remains unproven.
- Recommended next task: Perform device QA after runtime integration exists.

### F-STEPUP-HUMAN-LISTENING-WAIVED (P3)

Human listening remains waived for new logical step-up cues

- Trigger: project boundary
- Blocks floor gate: false
- Consequence: Logical cue plans are verified, but spoken audio review is still pending for any future recording.
- Recommended next task: Keep audio approval as a later Training Voice task.


## 17. Completion-Gate Decision

| Gate | Passed | Observed | Required |
|---|---:|---|---|
| coverage_canonical_53 | true | 53 | 53 |
| scenario_rows_parse | true | yes | yes |
| event_rows_parse | true | yes | yes |
| independent_metric_recompute | true | passed | passed |
| rep_validity | true | see metrics | all zero |
| interruption_restore | true | see metrics | all zero |
| set_progression | true | see metrics | all zero |
| target_seed | true | see metrics | all zero |
| voice_isolation | true | see metrics | all zero |
| runtime_integration | false | 5/7/0 | 0/0/0 |
| project_defaults | true | defaults closed | defaults closed |
| audio_unchanged | true | 0 | 0 |

Failed gates: runtime_integration

## 18. Tests and Validation

Required validation commands are listed in the JSON validation section. This report is generated by the addendum harness; command execution results should be captured after running the validation suite.

## 19. Worktree Integrity

This task added addendum artifacts and one audit-only harness. It did not change production source, production tests, package files, manifests, audio assets, or runtime behavior.

## 20. Exact Next Task

Training step-up alternation runtime integration patch
