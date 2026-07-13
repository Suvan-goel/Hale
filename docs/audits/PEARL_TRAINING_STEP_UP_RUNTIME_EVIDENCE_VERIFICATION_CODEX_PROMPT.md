# Codex Prompt: Pearl Step-Up Runtime Integration Evidence Verification Addendum

Read this entire prompt before doing any work.

Pearl’s step-up alternation runtime integration has been implemented behind default-closed internal gates.

The current implementation audit reports:

```text
Primary verdict:
TRAINING_STEP_UP_RUNTIME_INTEGRATION_COMPLETE_WITH_DEVICE_QA_PENDING

Original canonical scenarios retained:
53

Integration scenarios added:
37

Scenario rows:
91

Event-evidence rows:
37

Runtime trace:
15 connected_verified
1 not_applicable
0 missing
0 partial
0 legacy-only
0 uncertain
```

The implementation itself appears structurally strong. However, the current audit harness does **not** yet prove several of its most important zero-valued metrics.

The current audit script computes some metrics from rows, but assigns the following directly to literal zero:

```text
duplicateStaleCreditCount
genericAlternationDoubleCreditCount
setResultDuplicationCount
invalidProgressionAcceptanceCount
localRoundTripFailureCount
backendRoundTripFailureCount
seedMutationFailureCount
voiceContextMismatchCount
p0
p1
p2
```

It then labels all of them as:

```text
recomputed_from_written_csv
```

This is not sufficient evidence.

This task is a final **audit-only evidence verification addendum**. It must prove every critical metric from executed scenarios, written evidence rows, independent recomputation, and mutation/sensitivity checks before the project proceeds to the floor-transfer readiness gate.

Do not alter the production implementation in this task.

---

# 1. Existing artifacts

Read and use:

## Current runtime integration

- `docs/audits/PEARL_TRAINING_STEP_UP_RUNTIME_INTEGRATION_IMPLEMENTATION.md`
- `docs/audits/PEARL_TRAINING_STEP_UP_RUNTIME_INTEGRATION_AUDIT.md`
- `docs/audits/PEARL_TRAINING_STEP_UP_RUNTIME_INTEGRATION_AUDIT.json`
- `docs/audits/PEARL_TRAINING_STEP_UP_RUNTIME_INTEGRATION_SCENARIOS.csv`
- `docs/audits/PEARL_TRAINING_STEP_UP_RUNTIME_EVENT_EVIDENCE.csv`
- `docs/audits/PEARL_TRAINING_STEP_UP_RUNTIME_INTEGRATION_TRACE_V2.csv`
- `docs/audits/PEARL_VOICE_PROJECT_POST_STEP_UP_RUNTIME_HANDOFF.md`
- `scripts/audits/audit-training-step-up-runtime-integration.mjs`

## Prior verification

- `docs/audits/PEARL_TRAINING_STEP_UP_ALTERNATION_VERIFICATION_ADDENDUM.md`
- `docs/audits/PEARL_TRAINING_STEP_UP_ALTERNATION_VERIFICATION_ADDENDUM.json`
- `docs/audits/PEARL_TRAINING_STEP_UP_ALTERNATION_SCENARIOS_V2.csv`
- `docs/audits/PEARL_TRAINING_STEP_UP_ALTERNATION_EVENT_EVIDENCE.csv`
- `docs/audits/PEARL_TRAINING_STEP_UP_RUNTIME_INTEGRATION_TRACE.csv`
- `scripts/audits/audit-training-step-up-alternation-addendum.mjs`

The earlier addendum already used richer event filters and metric-evidence records. Reuse the sound parts of that approach, but verify the current integrated runtime rather than the old isolated model.

## Production implementation to execute

Inspect and import current production functions from at least:

- `src/training/setRuntime.ts`
- `src/training/sessionPlayer.ts`
- `src/training/stepUpAlternation/runtime.ts`
- `src/training/stepUpAlternation/evidenceAdapter.ts`
- all other current files under `src/training/stepUpAlternation/`
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
- relevant focused tests

## Project boundaries

Preserve:

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

---

# 2. Objective

Produce a reproducible verification addendum that proves or disproves:

1. Duplicate rep evidence cannot produce duplicate credit.
2. Stale callbacks cannot mutate a newer rep/set/runtime.
3. The generic legacy rep-credit path and alternation accepted-rep path cannot both credit or play SFX for one logical rep.
4. One completed set emits exactly one canonical `SetResult`.
5. Invalid alternation and side imbalance cannot reach progression as eligible.
6. Local serialization/restore preserves the canonical safe state.
7. Backend sanitize/sync/restore preserves the canonical generated plan, active state, and side seed.
8. Successful main-plan completion flips the seed exactly once.
9. Skip, cancel, incomplete, manual, and Explore paths do not incorrectly flip the main-plan seed.
10. Live expected lead and target reach Training Voice V2.1 logical planning without mismatch.
11. The 16-link integration trace remains current.
12. Every P0/P1/P2/P3 count is derived from the findings array.
13. Every finding is derived from explicit metric/finding rules.
14. Every critical metric responds correctly when a synthetic failure is injected into an in-memory copy of the evidence.
15. The final verdict is computed from the completion gates rather than assigned as a constant.
16. No production code, production tests, manifests, package files, or audio are changed.

The floor-transfer phase may proceed only if this addendum returns the evidence-verified verdict.

---

# 3. Strict scope

## Do not

- Change production TypeScript or React Native code
- Change production tests
- Change the step-up implementation
- Change the pose-evidence adapter
- Change progression
- Change persistence or backend mappings
- Change feature flags/defaults
- Change Training Voice V2.1 contracts
- Change audio manifests
- Generate, replace, rename, move, or delete audio
- Call ElevenLabs or any external speech/audio API
- Install dependencies
- Change `package.json` or lockfiles
- Implement the floor-transfer readiness gate
- Overwrite any existing step-up audit
- Commit, push, stash, reset, clean, checkout, or discard work
- Hide a discovered failure
- Remove failed scenario rows
- Set a critical metric directly to zero
- Set P0/P1/P2/P3 directly as numeric constants
- Claim a metric was recomputed from CSV when no row/filter can reproduce it

## You may

- Add the requested verification artifacts
- Add one audit-only harness under `scripts/audits/`
- Add audit-only fixtures under `scripts/audits/fixtures/` if needed
- Import and execute current production pure/runtime functions
- Instantiate the current session/runtime with deterministic fakes
- Use synthetic pose-frame sequences
- Use fake clocks
- Run existing tests
- Read test output
- Use temporary files and remove them before finishing

If a production defect is discovered, report it. Do not repair it in this task.

---

# 4. Worktree safety

At task start record:

```bash
git status --short --branch
git diff --name-only
git diff --stat
git diff -- assets/audio
```

Record:

- current branch
- full and short `HEAD`
- upstream
- whether the worktree was already dirty
- pre-existing relevant changes
- pre-existing audio diff

Rules:

1. Treat all current files as user-owned.
2. Do not reset, stash, checkout, clean, rebase, or discard.
3. Do not delete untracked files.
4. Do not overwrite unrelated work.
5. Do not commit or push.
6. At task end distinguish this addendum’s footprint from pre-existing changes.

---

# 5. Required deliverables

Create these seven artifacts:

1. `docs/audits/PEARL_TRAINING_STEP_UP_RUNTIME_EVIDENCE_VERIFICATION.md`
2. `docs/audits/PEARL_TRAINING_STEP_UP_RUNTIME_EVIDENCE_VERIFICATION.json`
3. `docs/audits/PEARL_TRAINING_STEP_UP_RUNTIME_VERIFICATION_SCENARIOS.csv`
4. `docs/audits/PEARL_TRAINING_STEP_UP_RUNTIME_VERIFICATION_EVENTS.csv`
5. `docs/audits/PEARL_TRAINING_STEP_UP_RUNTIME_VERIFICATION_LIFECYCLES.csv`
6. `docs/audits/PEARL_TRAINING_STEP_UP_RUNTIME_VERIFICATION_FINDINGS.csv`
7. `docs/audits/PEARL_VOICE_PROJECT_POST_STEP_UP_EVIDENCE_HANDOFF.md`

Add one audit-only harness:

- `scripts/audits/audit-training-step-up-runtime-evidence.mjs`

Do not overwrite the current integration audit or its CSV files.

---

# 6. Current harness defect ledger

The addendum must explicitly record the current audit weakness.

At minimum include these ledger rows:

| ID | Current metric | Current problem | Required correction |
|---|---|---|---|
| EV-001 | `duplicateStaleCreditCount` | literal zero | derive duplicate and stale metrics separately from event rows |
| EV-002 | `genericAlternationDoubleCreditCount` | literal zero | execute one logical rep through both potential authorities and count authority collisions |
| EV-003 | `setResultDuplicationCount` | literal zero | record every emitted SetResult by runtime/set identity |
| EV-004 | `invalidProgressionAcceptanceCount` | literal zero | execute invalid results through real progression entry point |
| EV-005 | `localRoundTripFailureCount` | literal zero | execute serializer/deserializer and compare canonical state |
| EV-006 | `backendRoundTripFailureCount` | literal zero | execute actual sanitizer/sync/restore mapping and compare canonical metadata |
| EV-007 | `seedMutationFailureCount` | literal zero | execute main/manual/Explore/duplicate/skip/cancel completion paths |
| EV-008 | `voiceContextMismatchCount` | literal zero | compare live runtime context with actual logical voice plan |
| EV-009 | `p0/p1/p2` | literal zeros | derive from generated findings array |
| EV-010 | `metricEvidence` | generic label only | provide scenario ids, filters, recompute function, and sensitivity check |

Do not modify the original harness. This addendum supersedes its evidence claims only.

---

# 7. Evidence architecture

Use three evidence tables.

## 7.1 Scenario table

One row per executed scenario/variant.

Required columns:

```text
scenarioId,variantId,category,evidenceMethod,productionEntryPoint,sourceFunctions,initialState,eventSequence,expectedOutcome,observedOutcome,passed,findingRuleIds,metricTags,testCoverage,notes
```

## 7.2 Event table

One row per significant runtime event.

Required columns:

```text
scenarioId,variantId,eventIndex,timestampMs,runtimeId,setId,setIndex,repAttemptId,authority,eventType,phaseBefore,phaseAfter,expectedLeadBefore,observedLead,bothFeetAtStart,topPhaseValid,bothFeetReturnedToFloor,trackingValid,evidenceOutcome,credited,repSfxEmitted,expectedLeadAfter,acceptedRepCount,leftLeadRepCount,rightLeadRepCount,setCompleted,setResultId,setResultEmitted,progressionConsumed,progressionEligible,serialized,restored,seedBefore,seedAfter,voiceExpectedLead,voiceTarget,notes
```

Allowed `authority` values should include:

```text
alternation_runtime
legacy_grader
session_player
sfx_channel
set_result_adapter
progression
local_serializer
backend_sanitizer
backend_restore
seed_updater
voice_planner
```

## 7.3 Lifecycle table

Use for round trips, completion identity, seed and voice checks.

Required columns:

```text
scenarioId,variantId,lifecycleType,entityId,operationIndex,operation,inputFingerprint,outputFingerprint,canonicalFieldsBefore,canonicalFieldsAfter,equal,duplicateSuppressed,errorCode,sourceFunction,notes
```

Required lifecycle types:

```text
set_result
local_roundtrip
backend_roundtrip
seed_update
voice_context
runtime_ownership
```

The rows must be sufficient to independently recompute every critical metric.

---

# 8. Preserve current scenario coverage

Re-run or re-import with current-source freshness checks:

- all 53 original canonical step-up scenarios
- all 37 runtime-integration scenarios

Requirements:

- all 90 canonical ids remain represented
- the original extra variant remains represented where still applicable
- current source/functions are rerun; do not merely copy old `passed=true`
- current source drift is reported
- failed scenarios remain present

Add the targeted verification scenarios below.

---

# 9. Required targeted verification scenarios

Add at least these 28 canonical scenario ids.

## Duplicate and stale evidence

1. `verify_duplicate_same_attempt_terminal_evidence`
2. `verify_duplicate_replayed_accepted_event`
3. `verify_stale_attempt_after_new_attempt_started`
4. `verify_stale_attempt_after_set_completed`
5. `verify_stale_callback_after_restore`
6. `verify_threshold_noise_multiple_terminal_frames`

## Authority isolation and SFX

7. `verify_same_rep_generic_and_alternation_authorities`
8. `verify_generic_rep_event_suppressed_internal_runtime`
9. `verify_accepted_event_single_sfx`
10. `verify_duplicate_accepted_event_no_second_sfx`
11. `verify_wrong_lead_no_sfx`
12. `verify_unknown_lead_no_sfx`

## SetResult and progression

13. `verify_single_set_single_setresult`
14. `verify_duplicate_finish_single_setresult`
15. `verify_setresult_replayed_progression_once`
16. `verify_broken_alternation_progression_rejected`
17. `verify_side_imbalance_progression_rejected`
18. `verify_valid_6_6_progression_accepted_once`
19. `verify_valid_time_not_doubled_end_to_end`

## Local/backend persistence

20. `verify_local_roundtrip_safe_boundary`
21. `verify_local_roundtrip_mid_rep_retires_partial`
22. `verify_backend_roundtrip_generated_plan`
23. `verify_backend_roundtrip_active_state`
24. `verify_backend_roundtrip_side_seed`
25. `verify_backend_richer_metadata_merge`

## Seed and voice context

26. `verify_seed_all_completion_paths`
27. `verify_voice_context_left_right_wrong_lead_and_target`
28. `verify_feature_defaults_and_runtime_ownership`

The harness may add more.

Expected minimum canonical scenario ids:

```text
90 existing + 28 targeted = at least 118
```

Expected row count may be higher due to variants.

---

# 10. Executable scenario requirements

Use current production functions wherever possible.

## 10.1 Duplicate/stale

Execute the actual state/runtime update path with:

- same `repAttemptId` twice
- accepted event replay
- retired attempt id after a new attempt
- old attempt after set completion
- old attempt after serialize/restore
- repeated terminal frame observations

Observe:

- credit count
- state mutation
- expected lead
- SFX
- SetResult
- progression

## 10.2 Authority collision

For one logical rep:

- present the frame/update that could cause a generic legacy rep event
- also present the alternation accepted event
- run through the current internal session-player path
- prove only the alternation authority credits/SFXs

Do not infer this only from source text.

## 10.3 SetResult identity

Assign or derive a stable set identity.

Call finish/terminal processing more than once.

Record every emitted SetResult.

A duplicate is any second canonical SetResult for the same set identity.

## 10.4 Progression

Execute the actual progression entry point with:

- valid 6/6 result
- broken alternation result
- unequal 7/5 or equivalent result
- duplicate replay of valid result

Record:

- consumed
- eligible
- progression event identity/count
- session completion event identity/count

## 10.5 Local round trip

Use the actual training serializer/deserializer.

Canonical comparison must include at minimum:

- runtime schema version
- plan fingerprint
- set index
- set start lead
- expected lead
- accepted rep count
- left/right counts
- safe phase
- retired partial attempt behavior
- shared seed where stored

Do not compare only JSON parse success.

## 10.6 Backend round trip

Use the actual production sanitizer and restore mapper.

Verify at minimum:

- generated alternation plan
- initial lead
- plan fingerprint
- active runtime envelope
- accepted counts
- expected lead
- side seed
- richer/newer metadata merge

Do not use a hand-built mock mapper that bypasses production code.

## 10.7 Seed paths

Execute actual completion handling for:

- successful main-plan completion
- duplicate same completion id
- second distinct successful main-plan exposure
- skip
- cancel
- incomplete exercise
- manual practice
- Explore practice
- restored/replayed completion

Record seed before/after and idempotency key.

## 10.8 Voice context

Use the actual current Training Voice V2.1 logical planner.

Compare runtime context and plan output for:

- left start
- right start
- expected left after wrong-right attempt
- expected right after wrong-left attempt
- target 12
- supported even scaled target if current source reaches one

No physical audio is required.

---

# 11. Critical metrics

The new JSON must report at least:

```text
existingCanonicalScenarioCount
targetedCanonicalScenarioCount
totalCanonicalScenarioCount
scenarioVariantCount
eventEvidenceRowCount
lifecycleEvidenceRowCount
failedScenarioCount

wrongLeadLiveCreditCount
unknownLeadLiveCreditCount
preFloorReturnCreditCount

duplicateRepCreditCount
staleCallbackMutationCount
thresholdNoiseExtraCreditCount

genericAlternationDoubleCreditCount
acceptedRepSfxMismatchCount
wrongOrUnknownLeadSfxCount

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

runtimeOwnershipConflictCount
runtimeIntegrationMissingLinkCount
runtimeIntegrationPartialLinkCount
runtimeIntegrationLegacyOnlyLinkCount
runtimeIntegrationUncertainLinkCount

physicalManifestChangeCount
productionFileChangeCount
productionTestChangeCount

p0
p1
p2
p3
```

Keep compatibility aliases where useful:

```text
duplicateStaleCreditCount =
duplicateRepCreditCount + staleCallbackMutationCount
```

---

# 12. Metric computation rules

Every critical metric must be computed by a named pure reducer over parsed rows.

A suitable structure is:

```js
const METRIC_REDUCERS = {
  duplicateRepCreditCount: ({ events }) =>
    countDuplicateCreditsByLogicalRep(events),

  staleCallbackMutationCount: ({ events }) =>
    count(events, isStaleMutation),

  setResultDuplicationCount: ({ lifecycles }) =>
    countDuplicateSetResults(lifecycles),

  // ...
};
```

## Prohibited

Do not write:

```js
duplicateRepCreditCount: 0
```

Do not write:

```js
p1: 0
```

Do not initialize a final metric object with expected values.

Accumulator initialization inside a reducer is allowed, but final values must come from row evaluation.

## Required metric evidence

For each metric store:

```json
{
  "value": 0,
  "sourceTables": ["events"],
  "sourceScenarioIds": ["..."],
  "rowFilter": "...",
  "reducerName": "...",
  "recomputeMethod": "...",
  "independentRecomputeValue": 0,
  "sensitivityCheckId": "...",
  "sensitivityPassed": true
}
```

A zero with no evaluated source scenarios is invalid.

---

# 13. Metric sensitivity and mutation probes

This is mandatory.

For every critical defect metric:

1. Load the completed baseline evidence rows into memory.
2. Clone the relevant rows.
3. Inject one synthetic failure that should increment exactly that metric or a documented group.
4. Re-run the same metric reducer.
5. Assert the metric changes from baseline by the expected amount.
6. Assert the corresponding finding is generated.
7. Assert the verdict/gate changes when that finding is blocking.
8. Do not write mutated rows into the canonical audit CSV.

Examples:

## Duplicate credit mutation

Clone one accepted event with the same logical rep identity and `credited=true`.

Expected:

```text
duplicateRepCreditCount +1
P1 finding generated
verified verdict no longer allowed
```

## Stale mutation

Change one stale callback row so it mutates count/lead/state.

Expected:

```text
staleCallbackMutationCount +1
P1 finding generated
```

## Double authority

Mark one logical rep as credited by both:

```text
legacy_grader
alternation_runtime
```

Expected:

```text
genericAlternationDoubleCreditCount +1
P1 finding generated
```

## SetResult duplication

Duplicate one `set_result` lifecycle output for the same set identity.

## Invalid progression

Set `progressionConsumed=true` and `progressionEligible=true` for a broken-alternation result.

## Local/backend failure

Mutate one canonical field after round trip.

## Seed failure

Mutate a manual/Explore path to flip the main seed.

## Voice mismatch

Change the planned expected lead or target.

## Severity derivation

Inject a P1-triggering metric and prove:

- findings array gains a P1
- `p1` becomes at least 1
- verdict changes

The JSON must include a `metricSensitivity` section with one result per critical metric.

---

# 14. Independent recomputation

After writing all CSV artifacts:

1. Reopen every CSV from disk.
2. Parse from disk, not in-memory originals.
3. Recompute every metric.
4. Recompute findings.
5. Recompute severity counts.
6. Recompute completion gates.
7. Recompute verdict.
8. Compare with JSON.
9. Fail on any mismatch.

Also execute a separate child-process verifier mode, for example:

```bash
node scripts/audits/audit-training-step-up-runtime-evidence.mjs --verify-existing
```

The verifier must read existing files and recompute without regenerating them.

Record both:

- generation-pass result
- independent verification-pass result

---

# 15. Findings and severity rules

Generate findings from rules.

Do not create only the two fixed P3 findings.

## P0

Reserve for a credible immediate safety-critical software defect in the gated runtime.

Do not force a P0.

## P1 triggers

Any nonzero:

- wrongLeadLiveCreditCount
- unknownLeadLiveCreditCount
- preFloorReturnCreditCount
- duplicateRepCreditCount
- staleCallbackMutationCount
- genericAlternationDoubleCreditCount
- setResultDuplicationCount
- invalidProgressionAcceptanceCount
- sideImbalanceProgressionAcceptanceCount
- localPartialRepRestoreCreditCount
- runtimeOwnershipConflictCount

## P2 triggers

Any nonzero:

- progressionDuplicateConsumptionCount
- sessionCompletionDuplicationCount
- validTimeDoubleCount
- localRoundTripFailureCount
- backendRoundTripFailureCount
- seedMutationFailureCount
- voiceContextMismatchCount
- any missing/partial/legacy/uncertain integration link
- a required scenario that cannot be executed and remains indeterminate

## P3 findings

Derive from explicit project-boundary facts:

- physical pose/device reliability deferred
- human listening waived
- phone-speaker/native timing deferred where relevant

Severity counts must equal counts of findings grouped by severity.

---

# 16. Runtime integration trace recheck

Re-evaluate all 16 current trace links.

Allowed statuses:

- `connected_verified`
- `not_applicable`
- `model_only_not_connected`
- `partially_connected`
- `legacy_only`
- `uncertain`

Requirements for `connected_verified`:

- source path exists
- runtime reachability is shown
- at least one executed scenario exercises the link
- test/harness evidence is named

Do not mark a link connected solely because a symbol exists.

For a verified verdict:

```text
model_only_not_connected = 0
partially_connected = 0
legacy_only = 0
uncertain = 0
```

---

# 17. Source-change integrity

This task must remain audit-only.

At the end calculate:

```text
productionFileChangeCount
productionTestChangeCount
audioAssetChangeCount
manifestChangeCount
packageFileChangeCount
```

Exclude only the requested audit artifacts and audit-only harness/fixtures.

All must be zero.

If a pre-existing production diff exists, compare task-start and task-end snapshots so it is not falsely attributed to this addendum.

---

# 18. Primary verdicts

Issue exactly one.

## `TRAINING_STEP_UP_RUNTIME_INTEGRATION_EVIDENCE_VERIFIED`

Use only when:

- all required scenarios are present,
- all critical metrics have sensitivity checks,
- every sensitivity check passes,
- independent disk recomputation passes,
- P0/P1/P2 findings are zero,
- all applicable integration links are connected verified,
- production/test/audio integrity is clean for this task,
- only deferred P3 boundaries remain.

Exact next task:

```text
Training floor-transfer readiness gate implementation
```

## `TRAINING_STEP_UP_RUNTIME_INTEGRATION_EVIDENCE_INCOMPLETE`

Use when:

- implementation may be correct,
- but one or more metrics still lacks executable evidence,
- a sensitivity test is missing/fails,
- or an integration link cannot be exercised.

Exact next task:

```text
Complete the missing step-up runtime evidence cases listed in this addendum
```

Do not proceed to the floor gate.

## `TRAINING_STEP_UP_RUNTIME_INTEGRATION_REMEDIATION_REQUIRED`

Use when any software/runtime defect metric is nonzero.

Exact next task:

```text
Remediate findings <ids>
```

## `CURRENT_SOURCE_REBASE_REQUIRED`

Use when source drift prevents reliable verification.

---

# 19. Completion gates

The evidence-verified verdict requires:

## Coverage

- existing canonical ids represented: at least `90`
- targeted canonical ids represented: at least `28`
- total canonical ids represented: at least `118`
- omitted required ids: `0`
- failed scenario rows: `0`

## Evidence

- critical metrics with row evidence: all
- critical metrics with sensitivity check: all
- failed sensitivity checks: `0`
- independent disk recomputation mismatches: `0`
- finding/severity recomputation mismatches: `0`
- verdict recomputation mismatches: `0`

## Runtime defects

All P1-triggering metrics: `0`

All P2-triggering metrics: `0`

## Integration

- missing links: `0`
- partial links: `0`
- legacy-only links: `0`
- uncertain links: `0`

## Defaults

- step-up alternation remains default off
- Training Voice V2.1 remains default off
- Training Voice V2.1 audio ready remains false
- Training Voice V2.1 global behaviour ready remains false
- Balance V2 remains default closed/audio pending

## Integrity

- production changes by this task: `0`
- production-test changes by this task: `0`
- audio changes by this task: `0`
- manifest changes by this task: `0`
- package/lockfile changes by this task: `0`
- no audio generated
- no external speech/audio API called
- physical QA remains deferred
- listening remains waived

---

# 20. Findings CSV

Use columns:

```text
findingId,severity,title,triggerMetric,triggerValue,affectedScenarioIds,sourceEvidence,userConsequence,blocksFloorGate,recommendedNextTask,status,notes
```

Include P3 findings rather than hard-coding only severity counts.

If no P0/P1/P2 finding exists, those severity counts become zero because the findings array has none.

---

# 21. JSON structure

Use:

```json
{
  "auditVersion": 1,
  "generatedAt": "...",
  "primaryVerdict": "...",
  "repositorySnapshot": {},
  "currentHarnessDefectLedger": [],
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
  "validation": {},
  "integrity": {},
  "nextTask": "..."
}
```

Keep JSON valid and comment-free.

---

# 22. Markdown report structure

Use:

# Pearl Training Step-Up Runtime Evidence Verification

## 1. Executive Verdict

## 2. Why This Addendum Was Required

## 3. Worktree and Source Freshness

## 4. Current Harness Defect Ledger

## 5. Production Runtime Surface Rechecked

## 6. Scenario Coverage

## 7. Duplicate and Stale Evidence

## 8. Rep-Credit and SFX Authority Isolation

## 9. SetResult and Progression Identity

## 10. Local Serialization and Restore

## 11. Backend Sync and Restore

## 12. Main-Plan Seed and Manual/Explore Isolation

## 13. Training Voice V2.1 Context

## 14. Runtime Integration Trace

## 15. Metric Reducers and Provenance

## 16. Mutation/Sensitivity Verification

## 17. Findings and Severity Derivation

## 18. Completion-Gate Decision

## 19. Validation

## 20. Worktree Integrity

## 21. Exact Next Task

---

# 23. Handoff

Create:

- `docs/audits/PEARL_VOICE_PROJECT_POST_STEP_UP_EVIDENCE_HANDOFF.md`

## If evidence verified

Next task:

```text
Training floor-transfer readiness gate implementation
```

State that the floor phase is unblocked at the software/static level while physical step-up QA remains deferred to the final consolidated device pass.

## If evidence incomplete

List every missing metric/sensitivity/integration evidence item.

## If remediation required

List exact finding ids.

Do not automatically advance to the floor gate.

---

# 24. Validation commands

Run at minimum:

```bash
npm run verify:audio
npx tsc --noEmit --pretty false
```

Run existing focused suites for:

- step-up evidence adapter
- step-up runtime integration
- session player
- TrainingSessionScreen step-up runtime
- SetResult/progression
- local serialization/restore
- backend sync/restore
- side seed
- manual/Explore isolation
- Training Voice V2.1 context
- both-sides rounds
- Balance V2 regressions

Run the full Jest suite.

Run:

```bash
node scripts/audits/audit-training-step-up-runtime-evidence.mjs
node scripts/audits/audit-training-step-up-runtime-evidence.mjs --verify-existing
```

Parse every generated JSON/CSV artifact.

Inspect:

```bash
git status --short --branch
git diff --stat
git diff -- assets/audio
```

Existing Watchman/open-handle warnings may be reported if commands exit successfully.

Do not modify tests merely to make them pass.

---

# 25. Final Codex response

When finished, respond with:

- paths to all seven generated artifacts
- audit-only harness path
- confirmation that no production code changed
- confirmation that no production tests changed
- confirmation that no audio/manifests/package files changed
- confirmation that no audio was generated
- confirmation that no external speech/audio API was called
- branch and commit
- whether the worktree was already dirty
- current harness hard-coded metric count identified
- existing canonical scenario count
- targeted canonical scenario count
- total canonical scenario count
- scenario variant count
- event row count
- lifecycle row count
- finding row count
- sensitivity-check count
- failed sensitivity-check count
- independent recomputation mismatch count
- all critical metrics
- P0/P1/P2/P3 counts
- all 16 integration-link statuses
- primary verdict
- whether the floor-transfer phase is unblocked
- exact next task
- `npm run verify:audio` result
- typecheck result
- focused Jest result
- full Jest result
- generation-pass result
- `--verify-existing` result
- concise confidence statement

Do not change production behavior or begin the floor-transfer gate in this task.
