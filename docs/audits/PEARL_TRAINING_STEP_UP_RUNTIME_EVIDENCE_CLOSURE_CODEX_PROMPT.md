# Codex Prompt: Pearl Step-Up Runtime Evidence Closure — Full Coverage and Per-Metric Proof

Read this entire prompt before doing any work.

This is the final audit-only correction for Pearl’s step-up alternation runtime phase.

The current production implementation is not being reopened in this task. The purpose is to correct the remaining evidence defects in the most recent audit package so that the project can either:

```text
A. proceed to the floor-transfer readiness gate with defensible evidence
```

or:

```text
B. remain blocked with an exact evidence or software finding
```

Do not assume outcome A.

---

# 1. Why this correction is required

The latest evidence addendum reported:

```text
TRAINING_STEP_UP_RUNTIME_EVIDENCE_VERIFIED_WITH_DEVICE_QA_PENDING
```

but it does not satisfy the requested evidence gates.

The defects to correct are:

## 1.1 Incomplete canonical coverage

The current evidence addendum retained:

```text
54 rows from the older 53-scenario model audit
+ 29 newly executed rows
```

It did not retain and validate the full current runtime-integration scenario surface:

```text
53 original canonical ids
+ 37 runtime-integration canonical ids
= 90 existing canonical ids
```

The final correction must include:

```text
90 existing canonical ids
+ 28 targeted evidence-verification ids
= at least 118 unique canonical scenario ids
```

The scenario-coverage gate must be explicit and verdict-blocking.

## 1.2 Incomplete mutation/sensitivity proof

The current addendum mutation-tests only a subset of aggregate metrics.

The final correction must give **every critical defect metric**:

- row-level evidence,
- a named reducer,
- independent disk recomputation,
- and a sensitivity mutation proving the reducer, finding rule, severity count, completion gate, and verdict respond correctly.

## 1.3 Missing required validation evidence

The latest artifacts do not establish all required commands inside the generated audit:

- `npm run verify:audio`
- `npx tsc --noEmit --pretty false`
- focused Jest
- full Jest
- generator mode
- independent `--verify-existing` mode

The final JSON must contain the exact command, exit code, timestamp, summary, and output digest for every required validation command.

## 1.4 Backend evidence is not strong enough

Backend round-trip verification must execute the actual current production sanitizer/serializer/restore/merge functions.

Do not mirror their object shape inside the audit harness and call that production verification.

## 1.5 Verdict naming drift

Use only the exact verdict enum defined in this prompt.

Deferred physical-device QA and waived listening belong in findings and boundaries, not in an invented primary verdict name.

---

# 2. Existing artifacts and source

Read and use:

## Latest evidence package

- `docs/audits/PEARL_TRAINING_STEP_UP_RUNTIME_EVIDENCE_VERIFICATION.md`
- `docs/audits/PEARL_TRAINING_STEP_UP_RUNTIME_EVIDENCE_VERIFICATION.json`
- `docs/audits/PEARL_TRAINING_STEP_UP_RUNTIME_VERIFICATION_SCENARIOS.csv`
- `docs/audits/PEARL_TRAINING_STEP_UP_RUNTIME_VERIFICATION_EVENTS.csv`
- `docs/audits/PEARL_TRAINING_STEP_UP_RUNTIME_VERIFICATION_LIFECYCLES.csv`
- `docs/audits/PEARL_TRAINING_STEP_UP_RUNTIME_VERIFICATION_FINDINGS.csv`
- `docs/audits/PEARL_VOICE_PROJECT_POST_STEP_UP_EVIDENCE_HANDOFF.md`
- `scripts/audits/audit-training-step-up-runtime-evidence.mjs`

## Runtime-integration package

- `docs/audits/PEARL_TRAINING_STEP_UP_RUNTIME_INTEGRATION_IMPLEMENTATION.md`
- `docs/audits/PEARL_TRAINING_STEP_UP_RUNTIME_INTEGRATION_AUDIT.md`
- `docs/audits/PEARL_TRAINING_STEP_UP_RUNTIME_INTEGRATION_AUDIT.json`
- `docs/audits/PEARL_TRAINING_STEP_UP_RUNTIME_INTEGRATION_SCENARIOS.csv`
- `docs/audits/PEARL_TRAINING_STEP_UP_RUNTIME_EVENT_EVIDENCE.csv`
- `docs/audits/PEARL_TRAINING_STEP_UP_RUNTIME_INTEGRATION_TRACE_V2.csv`
- `docs/audits/PEARL_VOICE_PROJECT_POST_STEP_UP_RUNTIME_HANDOFF.md`
- `scripts/audits/audit-training-step-up-runtime-integration.mjs`

## Earlier 53-scenario verification

- `docs/audits/PEARL_TRAINING_STEP_UP_ALTERNATION_VERIFICATION_ADDENDUM.md`
- `docs/audits/PEARL_TRAINING_STEP_UP_ALTERNATION_VERIFICATION_ADDENDUM.json`
- `docs/audits/PEARL_TRAINING_STEP_UP_ALTERNATION_SCENARIOS_V2.csv`
- `docs/audits/PEARL_TRAINING_STEP_UP_ALTERNATION_EVENT_EVIDENCE.csv`
- `docs/audits/PEARL_TRAINING_STEP_UP_RUNTIME_INTEGRATION_TRACE.csv`
- `scripts/audits/audit-training-step-up-alternation-addendum.mjs`

## Current production implementation

Inspect and execute current production functions from at least:

- `src/training/setRuntime.ts`
- `src/training/sessionPlayer.ts`
- `src/training/stepUpAlternation/runtime.ts`
- `src/training/stepUpAlternation/evidenceAdapter.ts`
- all other files under `src/training/stepUpAlternation/`
- `src/training/workoutGeneration.ts`
- `src/training/serialize.ts`
- `src/training/progression.ts`
- `src/training/validTimeProgression.ts`
- `src/training/bothSidesRounds/startSide.ts`
- `src/training/voiceV21/sequencePlanner.ts`
- `src/training/voiceV21/readiness.ts`
- `src/screens/TrainingSessionScreen.tsx`
- `src/services/backend/trainingStateSyncService.ts`
- `src/services/backend/restoreService.ts`
- actual duplicate/merge helpers used by these services
- relevant current production tests

Follow current imports and symbols. Do not trust stale line numbers.

---

# 3. Project boundaries to preserve

These remain unchanged:

```text
Step-up alternation feature:
default off

Training Voice V2.1:
default off

Training Voice V2.1 audio ready:
false

Training Voice V2.1 global behaviour ready:
false

Balance V2:
default closed / audio pending

Human listening:
waived, not completed

Physical-device QA:
deferred
```

No primary verdict may claim physical-device or listening completion.

---

# 4. Strict task scope

This task is audit-only.

## Do not

- change production TypeScript or React Native code,
- change production tests,
- change feature flags or defaults,
- change the step-up implementation,
- change progression,
- change persistence/backend mappings,
- change Training Voice V2.1 contracts,
- change manifests,
- change package files or lockfiles,
- generate, alter, rename, move, or delete audio,
- call ElevenLabs or another external speech/audio API,
- install dependencies,
- begin the floor-transfer gate,
- overwrite prior audit artifacts,
- remove failed rows,
- hard-code a passing verdict,
- hard-code a zero defect metric,
- hard-code P0/P1/P2/P3 counts,
- claim a command ran when it did not,
- use a mirrored backend mapper when the production mapper can be executed,
- commit, push, stash, reset, checkout, clean, rebase, or discard work.

## You may

- add the requested audit artifacts,
- add one audit-only harness,
- add audit-only fixtures under `scripts/audits/fixtures/`,
- import and execute current production pure/runtime functions,
- use `npx tsx` child processes to execute production TypeScript,
- use deterministic synthetic pose frames,
- use fake clocks,
- run existing tests and validation commands,
- create temporary files and remove them before finishing.

If production is defective, report it. Do not repair it here.

---

# 5. Worktree safety

At task start record:

```bash
git status --short --branch
git diff --name-only
git diff --stat
git diff -- assets/audio
```

Record:

- branch,
- full and short `HEAD`,
- upstream,
- whether the worktree was already dirty,
- pre-existing production/test/audio/package diffs,
- hashes of every file this task is forbidden to change.

At task end:

1. Recompute the same snapshot.
2. Exclude only this task’s requested audit artifacts and audit-only harness/fixtures.
3. Prove this task changed:
   - production files: `0`
   - production tests: `0`
   - audio files: `0`
   - manifests: `0`
   - package/lockfiles: `0`

Do not confuse pre-existing dirty files with this task’s footprint.

---

# 6. Required deliverables

Create these eight artifacts:

1. `docs/audits/PEARL_TRAINING_STEP_UP_RUNTIME_EVIDENCE_CLOSURE.md`
2. `docs/audits/PEARL_TRAINING_STEP_UP_RUNTIME_EVIDENCE_CLOSURE.json`
3. `docs/audits/PEARL_TRAINING_STEP_UP_RUNTIME_EVIDENCE_CLOSURE_SCENARIOS.csv`
4. `docs/audits/PEARL_TRAINING_STEP_UP_RUNTIME_EVIDENCE_CLOSURE_EVENTS.csv`
5. `docs/audits/PEARL_TRAINING_STEP_UP_RUNTIME_EVIDENCE_CLOSURE_LIFECYCLES.csv`
6. `docs/audits/PEARL_TRAINING_STEP_UP_RUNTIME_EVIDENCE_CLOSURE_FINDINGS.csv`
7. `docs/audits/PEARL_TRAINING_STEP_UP_RUNTIME_EVIDENCE_CLOSURE_VALIDATION.csv`
8. `docs/audits/PEARL_VOICE_PROJECT_POST_STEP_UP_EVIDENCE_CLOSURE_HANDOFF.md`

Add:

- `scripts/audits/audit-training-step-up-runtime-evidence-closure.mjs`

Optional audit-only fixtures may live under:

- `scripts/audits/fixtures/step-up-runtime-evidence-closure/`

Do not overwrite previous reports.

---

# 7. Exact required canonical scenario coverage

The final audit must contain all **118 unique required canonical ids** below.

A scenario may have multiple variants, but each canonical id must appear at least once.

No required id may be satisfied by a differently named aggregate row.

## 7.1 Original model scenarios — 53

```text
step_up_left_first_set_12_reps
step_up_right_first_set_12_reps
step_up_three_sets_left_initial
step_up_three_sets_right_initial
step_up_six_left_six_right
step_up_both_feet_floor_each_rep
wrong_lead_on_first_rep
wrong_lead_after_five_reps
wrong_lead_returns_to_floor_then_corrects
wrong_lead_does_not_flip_expected
generic_rep_without_lead_evidence_rejected
opposite_chain_clearer_not_auto_credited
top_reached_no_floor_return
one_foot_remains_on_step
duplicate_completion_callback
stale_callback_after_next_rep_started
threshold_noise_single_credit
descent_order_not_overconstrained
tracking_loss_mid_left_lead_rep
tracking_loss_mid_right_lead_rep
pause_mid_rep
background_mid_rep
restore_after_six_reps
restore_mid_rep
cancel_mid_set
skip_mid_set
default_target_12
even_scaled_target_10
odd_scaled_target_9_blocked
noninteger_target_blocked
short_session_final_target
visible_voice_runtime_target_match
seed_defaults_left
successful_completion_flips_seed
skip_does_not_flip_seed
manual_practice_does_not_flip_seed
duplicate_completion_idempotent
sync_restore_preserves_seed
one_set_one_progression_event
lead_counts_do_not_double_set_count
valid_time_not_doubled
twelve_total_unequal_sides_rejected
broken_alternation_not_progression_eligible
legacy_result_still_parses
step_up_start_left_logical_plan
step_up_start_right_logical_plan
wrong_lead_left_correction_plan
wrong_lead_right_correction_plan
no_per_rep_spoken_switch
feature_off_legacy_unchanged
alternation_flag_alone_no_half_activation
training_voice_remains_default_closed
balance_v2_remains_default_closed
```

## 7.2 Runtime-integration scenarios — 37

```text
integration_generated_item_selects_runtime
integration_step_up_flag_alone_stays_legacy
integration_one_runtime_owner
integration_existing_legacy_session_stays_legacy
integration_frames_left_lead_to_evidence
integration_frames_right_lead_to_evidence
integration_frames_wrong_lead_rejected
integration_frames_unknown_lead_rejected
integration_frames_top_without_return_rejected
integration_frames_one_foot_on_step_rejected
integration_frames_threshold_noise_single_credit
integration_tracking_interrupt_retires_rep
integration_evidence_dispatches_state_machine
integration_accepted_rep_is_only_sfx_source
integration_generic_rep_sfx_suppressed
integration_twelve_reps_complete_one_set
integration_three_sets_preserve_start_order
integration_state_machine_emits_set_result
integration_set_result_reaches_progression
integration_invalid_alternation_blocks_progression
integration_no_valid_time_double_count
integration_session_completion_once
integration_local_restore_after_six_reps
integration_local_restore_mid_rep
integration_backend_generated_plan_roundtrip
integration_backend_active_state_roundtrip
integration_backend_seed_roundtrip
integration_richer_metadata_merge
integration_main_plan_completion_flips_seed_once
integration_duplicate_completion_seed_idempotent
integration_manual_completion_does_not_flip_seed
integration_explore_completion_does_not_flip_seed
integration_live_expected_lead_reaches_voice_planner
integration_wrong_lead_context_reaches_voice_planner
integration_training_voice_remains_closed
integration_balance_v2_remains_closed
integration_audio_manifest_unchanged
```

## 7.3 Targeted closure scenarios — 28

```text
verify_duplicate_same_attempt_terminal_evidence
verify_duplicate_replayed_accepted_event
verify_stale_attempt_after_new_attempt_started
verify_stale_attempt_after_set_completed
verify_stale_callback_after_restore
verify_threshold_noise_multiple_terminal_frames
verify_same_rep_generic_and_alternation_authorities
verify_generic_rep_event_suppressed_internal_runtime
verify_accepted_event_single_sfx
verify_duplicate_accepted_event_no_second_sfx
verify_wrong_lead_no_sfx
verify_unknown_lead_no_sfx
verify_single_set_single_setresult
verify_duplicate_finish_single_setresult
verify_setresult_replayed_progression_once
verify_broken_alternation_progression_rejected
verify_side_imbalance_progression_rejected
verify_valid_6_6_progression_accepted_once
verify_valid_time_not_doubled_end_to_end
verify_local_roundtrip_safe_boundary
verify_local_roundtrip_mid_rep_retires_partial
verify_backend_roundtrip_generated_plan
verify_backend_roundtrip_active_state
verify_backend_roundtrip_side_seed
verify_backend_richer_metadata_merge
verify_seed_all_completion_paths
verify_voice_context_left_right_wrong_lead_and_target
verify_feature_defaults_and_runtime_ownership
```

## Coverage gates

The JSON must report:

```text
requiredOriginalCanonicalCount = 53
requiredIntegrationCanonicalCount = 37
requiredTargetedCanonicalCount = 28
requiredTotalCanonicalCount = 118
observedUniqueCanonicalCount
missingRequiredCanonicalIds
duplicateCanonicalIdsWithNoVariantDistinction
unexpectedCanonicalIds
```

For an evidence-verified verdict:

```text
observedUniqueCanonicalCount >= 118
missingRequiredCanonicalIds.length = 0
```

Coverage must be computed from the written closure scenarios CSV after reopening it from disk.

---

# 8. Scenario execution rules

Do not copy prior `passed=true` values as current evidence.

For every required id:

- execute current production functions where an executable path exists,
- record the exact production entry point,
- record the event sequence,
- record the observed output,
- compute pass/fail,
- retain failed rows.

Prior artifacts may supply the expected scenario identity and expected outcome, but current source must be re-executed or revalidated.

Allowed evidence methods:

```text
production_function_execution
session_runtime_execution
production_serializer_roundtrip
production_backend_roundtrip
production_voice_planner_execution
source_runtime_trace_plus_executed_link
static_default_query
```

Not allowed:

```text
copied_prior_pass
assumed_expected
literal_success
mirrored_backend_mapper
source_string_only_when_runtime_execution_exists
```

---

# 9. Required evidence tables

## 9.1 Scenario CSV

Use columns:

```text
scenarioId,variantId,scenarioGroup,evidenceMethod,productionEntryPoint,sourceFunctions,initialState,eventSequence,expectedOutcome,observedOutcome,passed,findingRuleIds,metricTags,testCoverage,notes
```

## 9.2 Event CSV

Use columns:

```text
scenarioId,variantId,eventIndex,timestampMs,runtimeId,setId,setIndex,repAttemptId,logicalRepId,authority,eventType,phaseBefore,phaseAfter,expectedLeadBefore,observedLead,bothFeetAtStart,ascentValid,topPhaseValid,bothFeetReturnedToFloor,trackingValid,evidenceOutcome,credited,repSfxEmitted,expectedLeadAfter,acceptedRepCount,leftLeadRepCount,rightLeadRepCount,setCompleted,setResultId,setResultEmitted,progressionEventId,progressionConsumed,progressionEligible,sessionCompletionEventId,validTimeMs,serialized,restored,seedBefore,seedAfter,voiceExpectedLead,voiceTarget,notes
```

Allowed `authority` values include:

```text
alternation_runtime
legacy_grader
session_player
sfx_channel
set_result_adapter
progression
session_completion
local_serializer
backend_sanitizer
backend_restore
backend_merge
seed_updater
voice_planner
feature_selector
```

## 9.3 Lifecycle CSV

Use columns:

```text
scenarioId,variantId,lifecycleType,entityId,operationIndex,operation,inputFingerprint,outputFingerprint,canonicalFieldsBefore,canonicalFieldsAfter,equal,duplicateSuppressed,errorCode,productionFunction,notes
```

Required lifecycle types:

```text
set_result
progression
session_completion
local_roundtrip
backend_roundtrip
backend_merge
seed_update
voice_context
runtime_ownership
validation_command
```

## 9.4 Findings CSV

Use columns:

```text
findingId,severity,title,triggerMetric,triggerValue,affectedScenarioIds,sourceEvidence,userConsequence,blocksFloorGate,recommendedNextTask,status,notes
```

## 9.5 Validation CSV

Use columns:

```text
validationId,command,startedAt,finishedAt,exitCode,status,summary,stdoutSha256,stderrSha256,artifactOrTestScope,notes
```

Do not claim a validation command ran unless a row with its actual exit code exists.

---

# 10. Production backend execution requirement

Backend verification must call current production functions.

Use the actual current exports or the actual internal functions reached through public production entry points for:

- generated exercise/session summary sanitization,
- active training-state sanitization,
- backend payload creation,
- backend restore mapping,
- duplicate/richer metadata merge,
- shared side-seed preservation.

A valid approach is for the `.mjs` harness to spawn `npx tsx` with a small audit-only TypeScript runner that imports production modules and emits JSON.

Do not:

- reconstruct the expected backend shape in the harness,
- create an audit-only mapper that happens to match current source,
- treat a focused Jest pass as the sole round-trip evidence.

The lifecycle CSV must identify the exact production functions executed.

---

# 11. Critical metrics

Compute at least these metrics.

## 11.1 Rep validity and authority

```text
wrongLeadLiveCreditCount
unknownLeadLiveCreditCount
preFloorReturnCreditCount
duplicateRepCreditCount
staleCallbackMutationCount
thresholdNoiseExtraCreditCount
genericAlternationDoubleCreditCount
acceptedRepSfxMismatchCount
wrongOrUnknownLeadSfxCount
runtimeOwnershipConflictCount
```

## 11.2 SetResult, progression, and completion

```text
setResultDuplicationCount
progressionDuplicateConsumptionCount
sessionCompletionDuplicationCount
invalidProgressionAcceptanceCount
sideImbalanceProgressionAcceptanceCount
validTimeDoubleCount
```

## 11.3 Local persistence

```text
localRoundTripFailureCount
localPartialRepRestoreCreditCount
localExpectedLeadDriftCount
localPlanFingerprintDriftCount
```

## 11.4 Backend persistence

```text
backendGeneratedPlanLossCount
backendActiveStateLossCount
backendSeedDriftCount
backendRicherMetadataLossCount
backendRoundTripFailureCount
```

## 11.5 Seed policy

```text
successfulMainPlanSeedFlipFailureCount
duplicateCompletionSeedFlipCount
skipCancelIncompleteSeedFlipCount
manualExploreSeedMutationCount
seedMutationFailureCount
```

## 11.6 Voice context

```text
voiceExpectedLeadMismatchCount
voiceTargetMismatchCount
voiceContextMismatchCount
perRepSpokenSwitchCount
spokenSetCountCueCount
```

## 11.7 Runtime trace and defaults

```text
runtimeIntegrationMissingLinkCount
runtimeIntegrationPartialLinkCount
runtimeIntegrationLegacyOnlyLinkCount
runtimeIntegrationUncertainLinkCount
stepUpFeatureDefaultErrorCount
trainingVoiceDefaultErrorCount
trainingVoiceAudioReadyErrorCount
trainingVoiceBehaviorReadyErrorCount
balanceV2DefaultErrorCount
physicalManifestChangeCount
```

## 11.8 Coverage and integrity

```text
observedUniqueCanonicalCount
missingRequiredCanonicalCount
failedScenarioCount
productionFileChangeCount
productionTestChangeCount
audioAssetChangeCount
manifestChangeCount
packageFileChangeCount
```

## 11.9 Compatibility aliases

Report, but derive:

```text
duplicateStaleCreditCount =
duplicateRepCreditCount + staleCallbackMutationCount

backendRoundTripFailureCount =
backendGeneratedPlanLossCount
+ backendActiveStateLossCount
+ backendSeedDriftCount
+ backendRicherMetadataLossCount

seedMutationFailureCount =
successfulMainPlanSeedFlipFailureCount
+ duplicateCompletionSeedFlipCount
+ skipCancelIncompleteSeedFlipCount
+ manualExploreSeedMutationCount

voiceContextMismatchCount =
voiceExpectedLeadMismatchCount
+ voiceTargetMismatchCount
```

Do not independently assign aggregate values.

---

# 12. Reducer-only metric construction

Create one named pure reducer per metric.

A suitable architecture is:

```js
const METRIC_REDUCERS = Object.freeze({
  duplicateRepCreditCount: countDuplicateRepCredits,
  staleCallbackMutationCount: countStaleCallbackMutations,
  // ...
});

function buildMetrics(parsedEvidence) {
  return Object.fromEntries(
    Object.entries(METRIC_REDUCERS).map(([name, reducer]) => [
      name,
      reducer(parsedEvidence),
    ]),
  );
}
```

## Prohibited patterns

Do not include final critical metrics as direct numeric literals:

```js
duplicateRepCreditCount: 0
p1: 0
```

Do not initialize a “passing metrics” object and overwrite only failures.

Do not calculate severity directly inside `buildMetrics`.

## Harness static self-check

The harness must inspect its own source and fail if:

- a critical metric appears as a direct numeric property assignment,
- `severityCounts` is written as a fixed literal,
- the primary verdict is assigned before completion gates are evaluated.

Use a conservative source check; document its limitations.

---

# 13. Metric evidence

For every metric, JSON must contain:

```json
{
  "value": 0,
  "sourceTables": ["events"],
  "sourceScenarioIds": ["..."],
  "rowFilter": "...",
  "reducerName": "...",
  "recomputeMethod": "...",
  "independentRecomputeValue": 0,
  "sensitivityCheckIds": ["..."],
  "sensitivityPassed": true
}
```

Requirements:

- a zero metric must still have evaluated source rows,
- source scenario ids may not be empty for scenario-derived metrics,
- source query details must be present for static/default/trace metrics,
- `independentRecomputeValue` comes from reopening the written CSVs,
- aggregate metrics cite their component reducers.

---

# 14. Per-metric mutation sensitivity

Every defect/default/integrity metric below requires at least one mutation probe:

```text
wrongLeadLiveCreditCount
unknownLeadLiveCreditCount
preFloorReturnCreditCount
duplicateRepCreditCount
staleCallbackMutationCount
thresholdNoiseExtraCreditCount
genericAlternationDoubleCreditCount
acceptedRepSfxMismatchCount
wrongOrUnknownLeadSfxCount
runtimeOwnershipConflictCount

setResultDuplicationCount
progressionDuplicateConsumptionCount
sessionCompletionDuplicationCount
invalidProgressionAcceptanceCount
sideImbalanceProgressionAcceptanceCount
validTimeDoubleCount

localRoundTripFailureCount
localPartialRepRestoreCreditCount
localExpectedLeadDriftCount
localPlanFingerprintDriftCount

backendGeneratedPlanLossCount
backendActiveStateLossCount
backendSeedDriftCount
backendRicherMetadataLossCount
backendRoundTripFailureCount

successfulMainPlanSeedFlipFailureCount
duplicateCompletionSeedFlipCount
skipCancelIncompleteSeedFlipCount
manualExploreSeedMutationCount
seedMutationFailureCount

voiceExpectedLeadMismatchCount
voiceTargetMismatchCount
voiceContextMismatchCount
perRepSpokenSwitchCount
spokenSetCountCueCount

runtimeIntegrationMissingLinkCount
runtimeIntegrationPartialLinkCount
runtimeIntegrationLegacyOnlyLinkCount
runtimeIntegrationUncertainLinkCount
stepUpFeatureDefaultErrorCount
trainingVoiceDefaultErrorCount
trainingVoiceAudioReadyErrorCount
trainingVoiceBehaviorReadyErrorCount
balanceV2DefaultErrorCount
physicalManifestChangeCount

missingRequiredCanonicalCount
failedScenarioCount
productionFileChangeCount
productionTestChangeCount
audioAssetChangeCount
manifestChangeCount
packageFileChangeCount
```

## Probe requirements

For each metric:

1. Clone only the relevant in-memory evidence.
2. Inject exactly one documented defect where practical.
3. Re-run the same reducer.
4. Assert the metric changes by the expected amount.
5. Assert the correct finding rule fires.
6. Assert severity counts change where applicable.
7. Assert a blocking defect prevents the verified verdict.
8. Keep canonical CSVs unchanged.
9. Record the probe result in JSON.

## Aggregate probes

For aggregate metrics such as:

- `backendRoundTripFailureCount`
- `seedMutationFailureCount`
- `voiceContextMismatchCount`

inject one component defect and prove both component and aggregate increment.

## Severity/verdict probes

At minimum prove:

- one P1 trigger produces one P1 finding,
- one P2 trigger produces one P2 finding,
- severity counts derive from findings,
- the verified verdict becomes unavailable.

The JSON must report:

```text
requiredSensitivityMetricCount
executedSensitivityMetricCount
passedSensitivityMetricCount
failedSensitivityMetricCount
missingSensitivityMetrics
```

For a verified verdict:

```text
missingSensitivityMetrics.length = 0
failedSensitivityMetricCount = 0
```

---

# 15. Findings and severity derivation

Generate findings from metric rules.

Do not define P0/P1/P2/P3 as fixed counts.

## P1 triggers

Any nonzero:

```text
wrongLeadLiveCreditCount
unknownLeadLiveCreditCount
preFloorReturnCreditCount
duplicateRepCreditCount
staleCallbackMutationCount
genericAlternationDoubleCreditCount
setResultDuplicationCount
invalidProgressionAcceptanceCount
sideImbalanceProgressionAcceptanceCount
localPartialRepRestoreCreditCount
runtimeOwnershipConflictCount
```

## P2 triggers

Any nonzero:

```text
acceptedRepSfxMismatchCount
wrongOrUnknownLeadSfxCount
progressionDuplicateConsumptionCount
sessionCompletionDuplicationCount
validTimeDoubleCount
localRoundTripFailureCount
backendRoundTripFailureCount
seedMutationFailureCount
voiceContextMismatchCount
runtimeIntegrationMissingLinkCount
runtimeIntegrationPartialLinkCount
runtimeIntegrationLegacyOnlyLinkCount
runtimeIntegrationUncertainLinkCount
missingRequiredCanonicalCount
failedScenarioCount
```

A required metric without evidence or sensitivity proof must also generate a P2 evidence finding.

## P3 findings

Generate from explicit current project facts:

- physical pose/device reliability deferred,
- human listening waived,
- final phone-speaker/native timing deferred where relevant.

## Severity counts

```text
P0/P1/P2/P3 =
groupBy(findings, severity)
```

The findings CSV and JSON findings array are the source of truth.

---

# 16. Runtime integration trace

Re-evaluate all 16 trace links.

Allowed statuses:

```text
connected_verified
not_applicable
model_only_not_connected
partially_connected
legacy_only
uncertain
```

A link may be `connected_verified` only when:

- current source path exists,
- runtime reachability is demonstrated,
- at least one current closure scenario executes it,
- test/harness evidence is named.

For verified closure:

```text
model_only_not_connected = 0
partially_connected = 0
legacy_only = 0
uncertain = 0
```

Do not mark a link connected only because a source symbol exists.

---

# 17. Required validation commands

Run and record all of these.

## 17.1 Audio verification

```bash
npm run verify:audio
```

## 17.2 TypeScript

```bash
npx tsc --noEmit --pretty false
```

## 17.3 Focused Jest

Run a focused command covering at minimum:

- step-up model,
- step-up evidence adapter,
- step-up runtime integration,
- session player,
- progression/valid time,
- training serialization,
- backend training-state sync,
- backend restore,
- shared side seed,
- Training Voice V2.1 context.

Record exact test paths or pattern.

## 17.4 Full Jest

Run the repository’s full Jest command.

Record:

- exit code,
- suite count,
- test count,
- warnings after successful exit.

## 17.5 Generation mode

```bash
node scripts/audits/audit-training-step-up-runtime-evidence-closure.mjs
```

## 17.6 Independent verification mode

```bash
node scripts/audits/audit-training-step-up-runtime-evidence-closure.mjs --verify-existing
```

The `--verify-existing` mode must:

- not regenerate artifacts,
- reopen all eight generated artifacts,
- recompute coverage,
- recompute metrics,
- recompute findings,
- recompute severity,
- recompute gates,
- recompute verdict,
- verify validation rows,
- fail on mismatch.

## Recording requirements

For each command store:

- exact command,
- start/end time,
- exit code,
- concise summary,
- SHA-256 of captured stdout,
- SHA-256 of captured stderr,
- whether warnings occurred.

Do not invent counts that cannot be parsed reliably; state `not_parsed` honestly.

---

# 18. Independent disk recomputation

After generating artifacts:

1. Close/discard in-memory generated row arrays.
2. Reopen CSVs from disk.
3. Reopen JSON from disk.
4. Recompute:
   - coverage,
   - every metric,
   - every finding,
   - severity counts,
   - all completion gates,
   - verdict.
5. Compare with JSON.
6. Fail on any mismatch.

Then run the separate `--verify-existing` process.

JSON must report:

```text
generationRecomputeMismatchCount
independentVerifierMismatchCount
```

Both must be zero for verified closure.

---

# 19. Primary verdict enum

Use exactly one of these values.

## `TRAINING_STEP_UP_RUNTIME_INTEGRATION_EVIDENCE_VERIFIED`

Use only when:

- all 118 required canonical ids are present,
- all scenario rows pass,
- every critical metric has evidence,
- every required sensitivity probe passes,
- independent disk recomputation passes,
- `--verify-existing` passes,
- P0/P1/P2 are zero,
- all applicable runtime links are connected verified,
- all required validation commands passed,
- this task changed no production/test/audio/manifest/package files,
- only P3 device/listening boundaries remain.

Exact next task:

```text
Training floor-transfer readiness gate implementation
```

## `TRAINING_STEP_UP_RUNTIME_INTEGRATION_EVIDENCE_INCOMPLETE`

Use when:

- implementation may be correct,
- but coverage, evidence, sensitivity, validation, or independent verification is incomplete.

Exact next task:

```text
Complete the missing evidence items listed in this report
```

Do not proceed to floor-transfer work.

## `TRAINING_STEP_UP_RUNTIME_INTEGRATION_REMEDIATION_REQUIRED`

Use when any software/runtime defect metric is nonzero.

Exact next task:

```text
Remediate findings <ids>
```

## `CURRENT_SOURCE_REBASE_REQUIRED`

Use when source drift prevents reliable verification.

Do not invent a `...WITH_DEVICE_QA_PENDING` primary verdict. Device QA remains a P3 boundary under the exact verified verdict.

---

# 20. Completion gates

The verified verdict requires all of the following.

## Coverage

```text
required total canonical ids = 118
missing required ids = 0
failed scenarios = 0
```

## Evidence

```text
critical metrics without row/source evidence = 0
required sensitivity metrics missing = 0
failed sensitivity checks = 0
generation recomputation mismatches = 0
independent verifier mismatches = 0
```

## Software metrics

All P1- and P2-triggering defect metrics must equal zero.

## Integration trace

```text
missing = 0
partial = 0
legacy-only = 0
uncertain = 0
```

## Validation

All six required validation commands must have:

```text
exitCode = 0
status = passed
```

## Defaults

- step-up alternation remains default off,
- Training Voice V2.1 remains default off,
- Training Voice V2.1 audio ready remains false,
- Training Voice V2.1 global behaviour ready remains false,
- Balance V2 remains default closed/audio pending.

## Integrity

This task’s:

```text
productionFileChangeCount = 0
productionTestChangeCount = 0
audioAssetChangeCount = 0
manifestChangeCount = 0
packageFileChangeCount = 0
```

---

# 21. JSON structure

Use:

```json
{
  "auditVersion": 1,
  "generatedAt": "...",
  "primaryVerdict": "...",
  "nextTask": "...",
  "repositorySnapshot": {},
  "priorEvidenceDefects": [],
  "requiredCanonicalScenarioIds": {
    "original": [],
    "integration": [],
    "targeted": []
  },
  "scenarioCoverage": {},
  "runtimeIntegrationTrace": [],
  "metrics": {},
  "metricEvidence": {},
  "metricSensitivity": {},
  "findings": [],
  "severityCounts": {
    "P0": 0,
    "P1": 0,
    "P2": 0,
    "P3": 0
  },
  "completionGates": [],
  "validation": {
    "commands": [],
    "generationRecomputeMismatchCount": 0,
    "independentVerifierMismatchCount": 0
  },
  "integrity": {},
  "boundaries": {
    "humanListening": "waived_not_completed",
    "physicalDeviceQa": "deferred"
  }
}
```

Keep JSON valid and comment-free.

---

# 22. Markdown report structure

Use:

# Pearl Training Step-Up Runtime Evidence Closure

## 1. Executive Verdict

## 2. Why the Previous Evidence Was Incomplete

## 3. Worktree and Source Freshness

## 4. Canonical Scenario Coverage

## 5. Production Runtime Surface Re-executed

## 6. Duplicate, Stale, and Authority Isolation

## 7. SFX, SetResult, Progression, and Completion Identity

## 8. Local Serialization and Restore

## 9. Production Backend Round Trips and Merge

## 10. Main-Plan Seed and Manual/Explore Isolation

## 11. Training Voice V2.1 Context

## 12. Runtime Integration Trace

## 13. Metric Reducers and Row Provenance

## 14. Per-Metric Mutation Sensitivity

## 15. Findings and Severity Derivation

## 16. Validation Commands

## 17. Independent Verification

## 18. Completion-Gate Decision

## 19. Worktree Integrity

## 20. Deferred Device and Listening Boundaries

## 21. Exact Next Task

---

# 23. Handoff behavior

Create:

- `docs/audits/PEARL_VOICE_PROJECT_POST_STEP_UP_EVIDENCE_CLOSURE_HANDOFF.md`

## If verified

State:

```text
Training floor-transfer readiness gate implementation
```

is unblocked at the software/static level.

Carry forward:

- step-up alternation remains default off,
- Training Voice V2.1 remains default off,
- audio remains pending,
- physical step-up validation remains part of the final consolidated device pass.

## If incomplete

List every:

- missing canonical id,
- missing metric evidence,
- missing sensitivity probe,
- failed validation command,
- recomputation mismatch.

## If remediation required

List exact finding ids.

Do not automatically advance.

---

# 24. Final response requirements

When finished, respond with:

- paths to all eight generated artifacts,
- harness path,
- confirmation that no production code changed,
- confirmation that no production tests changed,
- confirmation that no audio/manifests/package files changed,
- confirmation that no audio was generated,
- confirmation that no external speech/audio API was called,
- branch and commit,
- whether the worktree was already dirty,
- original canonical ids observed / required,
- integration canonical ids observed / required,
- targeted canonical ids observed / required,
- total unique canonical ids,
- missing required ids,
- scenario variant count,
- event row count,
- lifecycle row count,
- finding row count,
- required sensitivity metric count,
- executed sensitivity metric count,
- failed sensitivity check count,
- critical metrics without evidence count,
- generation recomputation mismatch count,
- independent verifier mismatch count,
- all critical defect metrics,
- P0/P1/P2/P3 counts,
- all 16 trace-link statuses,
- all six validation command results,
- primary verdict,
- whether floor-transfer work is unblocked,
- exact next task,
- concise confidence statement.

Do not change production behavior or begin the floor-transfer gate in this task.
