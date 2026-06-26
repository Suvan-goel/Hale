# Hale Training Step-Up Runtime Evidence Closure

## 1. Executive Verdict
Primary verdict: `TRAINING_STEP_UP_RUNTIME_INTEGRATION_EVIDENCE_VERIFIED`.
Exact next task: `Training floor-transfer readiness gate implementation`.

## 2. Why the Previous Evidence Was Incomplete
- Previous addendum retained 54 older rows plus 29 new rows rather than reopening the full 90 existing runtime-integration canonical ids.
- Previous mutation coverage did not prove every critical metric reducer, finding rule, severity count, completion gate, and verdict transition.
- Previous validation evidence did not include all six required command rows with output digests.
- Previous backend evidence did not prove the current production sanitizer and restore mapper round trip strongly enough.
- Previous primary verdict used a device-QA-pending suffix outside the required enum.

## 3. Worktree and Source Freshness
Branch: `dev`; HEAD: `2b3e28bc48bde987e82f599a5e811d0f801686b8`; upstream: `origin/dev`.
Worktree already dirty at audit start: `true`.

## 4. Canonical Scenario Coverage
Original: 53/53.
Integration: 37/37.
Targeted: 28/28.
Total unique required ids: 118/118.
Missing ids: none.

## 5. Production Runtime Surface Re-executed
Production runner entry points: see JSON productionEntryPoint/sourceFunctions columns.

## 6. Duplicate, Stale, and Authority Isolation
duplicateRepCreditCount=0; staleCallbackMutationCount=0; genericAlternationDoubleCreditCount=0

## 7. SFX, SetResult, Progression, and Completion Identity
acceptedRepSfxMismatchCount=0; wrongOrUnknownLeadSfxCount=0; setResultDuplicationCount=0; progressionDuplicateConsumptionCount=0; sessionCompletionDuplicationCount=0

## 8. Local Serialization and Restore
localRoundTripFailureCount=0; localPartialRepRestoreCreditCount=0; localExpectedLeadDriftCount=0; localPlanFingerprintDriftCount=0

## 9. Production Backend Round Trips and Merge
backendGeneratedPlanLossCount=0; backendActiveStateLossCount=0; backendSeedDriftCount=0; backendRicherMetadataLossCount=0; backendRoundTripFailureCount=0

## 10. Main-Plan Seed and Manual/Explore Isolation
successfulMainPlanSeedFlipFailureCount=0; duplicateCompletionSeedFlipCount=0; skipCancelIncompleteSeedFlipCount=0; manualExploreSeedMutationCount=0; seedMutationFailureCount=0

## 11. Training Voice V2.1 Context
voiceExpectedLeadMismatchCount=0; voiceTargetMismatchCount=0; voiceContextMismatchCount=0; perRepSpokenSwitchCount=0; spokenSetCountCueCount=0

## 12. Runtime Integration Trace
- 1: connected_verified (integration_generated_item_selects_runtime)
- 2: connected_verified (integration_generated_item_selects_runtime)
- 3: connected_verified (integration_one_runtime_owner)
- 4: connected_verified (integration_accepted_rep_is_only_sfx_source)
- 5: connected_verified (integration_frames_left_lead_to_evidence)
- 6: connected_verified (integration_evidence_dispatches_state_machine)
- 7: connected_verified (integration_accepted_rep_is_only_sfx_source)
- 8: connected_verified (integration_state_machine_emits_set_result)
- 9: connected_verified (integration_set_result_reaches_progression)
- 10: not_applicable (integration_no_valid_time_double_count)
- 11: connected_verified (integration_local_restore_after_six_reps)
- 12: connected_verified (integration_local_restore_mid_rep)
- 13: connected_verified (integration_backend_generated_plan_roundtrip)
- 14: connected_verified (integration_main_plan_completion_flips_seed_once)
- 15: connected_verified (integration_manual_completion_does_not_flip_seed)
- 16: connected_verified (integration_live_expected_lead_reaches_voice_planner)

## 13. Metric Reducers and Row Provenance
Critical metrics without evidence: 0. Reducers are named in `metricEvidence` and recomputed from disk by `--verify-existing`.

## 14. Per-Metric Mutation Sensitivity
Required: 53; executed: 53; failed: 0.

## 15. Findings and Severity Derivation
Severity counts: {"P0":0,"P1":0,"P2":0,"P3":2}.
- F-STEPUP-PHYSICAL-DEVICE-QA-DEFERRED (P3): Physical-device validation remains deferred
- F-STEPUP-HUMAN-LISTENING-WAIVED (P3): Human listening remains waived

## 16. Validation Commands
- audio: exit 0, passed, stdout 12572e2148784aed4e53f2d03bafa88cfa26c05070fd9d629930610a989ad4b1, stderr e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
- typescript: exit 0, passed, stdout e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855, stderr e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
- focused_jest: exit 0, passed, stdout e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855, stderr de2d9646aa891bedf764d8961cfb752d05aa289d6783dde39e2d467944425bee
- full_jest: exit 0, passed, stdout df539cde8a1172a606da48eed8a7e7d28bfcdc244d9d86f0362a39e07c67583a, stderr 2b1555ffd84e04b4f9479707f6936934b7579495119317094796682d258fd282
- generation_mode: exit 0, passed, stdout a91c8d1f98245211e86db090956981ceaf0787832a2a8fc343e4e423224a4895, stderr e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
- verify_existing_mode: exit 0, passed, stdout 9fd3d4e1310ede1ef27a81096909f7fce7806a73484fbcf76ade1ceb81d4a88c, stderr e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855

## 17. Independent Verification
Generation recomputation mismatches: 0. Independent verifier mismatches: 0.

## 18. Completion-Gate Decision
- coverage_required_total: passed (118/118)
- coverage_missing_required_ids: passed ()
- coverage_failed_scenarios: passed (0)
- critical_metrics_have_row_evidence: passed ()
- required_sensitivity_metrics_present: passed ()
- required_sensitivity_metrics_pass: passed (0)
- generation_recompute: passed (0)
- independent_verifier: passed (0)
- software_defect_metrics_zero: passed (all zero)
- integration_trace_connected: passed (1:connected_verified;2:connected_verified;3:connected_verified;4:connected_verified;5:connected_verified;6:connected_verified;7:connected_verified;8:connected_verified;9:connected_verified;10:not_applicable;11:connected_verified;12:connected_verified;13:connected_verified;14:connected_verified;15:connected_verified;16:connected_verified)
- validation_commands_present: passed (audio;typescript;focused_jest;full_jest;generation_mode;verify_existing_mode)
- validation_commands_passed: passed (audio:0;typescript:0;focused_jest:0;full_jest:0;generation_mode:0;verify_existing_mode:0)
- defaults_closed: passed (all zero)
- task_integrity: passed (all zero)
- harness_static_self_check: passed ()
- p0_p1_p2_zero: passed ({"P0":0,"P1":0,"P2":0,"P3":2})

## 19. Worktree Integrity
productionFileChangeCount=0; productionTestChangeCount=0; audioAssetChangeCount=0; manifestChangeCount=0; packageFileChangeCount=0
No audio was generated and no external speech/audio API was called.

## 20. Deferred Device and Listening Boundaries
Physical-device QA is deferred. Human listening is waived, not completed. Both remain P3 boundaries only.

## 21. Exact Next Task
Training floor-transfer readiness gate implementation
