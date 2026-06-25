# Codex Prompt: Hale Step-Up Alternation Verification Addendum

Read this entire prompt before doing any work.

Hale’s default-closed step-up alternation implementation has reported:

```text
Primary verdict:
TRAINING_STEP_UP_ALTERNATION_SOFTWARE_COMPLETE_DEFAULT_CLOSED

Current audit:
27 scenarios
27 passed
P0/P1/P2/P3: 0 / 0 / 0 / 0
```

The implementation direction appears correct, but the current audit is not yet sufficient to close the phase:

1. The original required scenario scope was substantially larger than 27 scenarios.
2. Several important restore, boundary, target, progression, seed, and runtime-isolation cases are absent.
3. The current P0/P1/P2/P3 zero values do not have meaningful finding-rule evidence.
4. The verification must distinguish:
   - a correct isolated software model,
   - from a model that is actually connected end to end to the internal/default-closed training runtime.
5. The next floor-transfer phase must not begin until this distinction is proven.

This task is a **verification addendum only**.

Do not rewrite the implementation merely to make the audit pass.

If a defect or missing runtime connection is discovered, report it and return the appropriate blocking verdict. A later remediation task will fix it.

---

# 1. Existing artifacts

Read and use:

## Step-up implementation

- `docs/audits/HALE_TRAINING_STEP_UP_ALTERNATION_IMPLEMENTATION.md`
- `docs/audits/HALE_TRAINING_STEP_UP_ALTERNATION_AUDIT.md`
- `docs/audits/HALE_TRAINING_STEP_UP_ALTERNATION_AUDIT.json`
- `docs/audits/HALE_TRAINING_STEP_UP_ALTERNATION_SCENARIOS.csv`
- `docs/audits/HALE_TRAINING_STEP_UP_REP_EVIDENCE_MATRIX.csv`
- `docs/audits/HALE_VOICE_PROJECT_POST_STEP_UP_HANDOFF.md`
- `scripts/audits/audit-training-step-up-alternation.mjs`

## Source implementation

Inspect all current files under:

```text
src/training/stepUpAlternation/
```

and every production integration point modified by the step-up task, including:

- generated-session attachment
- `GeneratedExercise` metadata
- training serialization
- `SetResult`
- training exports
- shared main-plan start-side seed
- Training Voice V2.1 contract/planner/readiness
- training session runtime/screen integration
- step-up exercise definition and grader
- progression and valid-time integration
- backend training-state sync/restore

## Earlier foundations that must remain green

- `docs/audits/HALE_TRAINING_BOTH_SIDES_ROUNDS_AUDIT.md`
- `docs/audits/HALE_TRAINING_VOICE_V2_1_FOUNDATION_AUDIT.md`
- `docs/audits/HALE_EYES_OPEN_BALANCE_V2_AUDIT.md`
- MPV2 voice/runtime post-completion audit
- measurement-side post-UX audit

The current project boundaries remain:

```text
Training Voice V2.1: default off
Training Voice V2.1 audio ready: false
Training Voice V2.1 global behaviour ready: false
Step-up alternation feature: default off
Balance V2: default closed / audio pending
Human listening: waived, not completed
Physical-device QA: deferred
```

Do not change those boundaries.

---

# 2. Objective

Produce an independently reproducible verification addendum that determines whether the step-up phase is truly ready to hand off to the floor-transfer gate.

The addendum must prove or disprove:

1. The full approved 12-rep, 6-left/6-right contract.
2. Alternation after every accepted rep.
3. No expected-leg flip after invalid or wrong-leg attempts.
4. Both-feet-floor boundary before credit and before the next rep.
5. Conservative lead-leg evidence.
6. No duplicate/stale rep credit.
7. Restore, pause, background, retry, skip, and cancel correctness.
8. Even scaled-target support and odd-target rejection.
9. Main-plan seed persistence and idempotence.
10. Manual/Explore isolation.
11. One-set/one-progression-event aggregation.
12. No doubled valid time.
13. No side imbalance hidden by total reps.
14. Accurate Training Voice V2.1 logical plans.
15. Default-closed feature isolation.
16. Actual end-to-end runtime integration, if claimed.
17. Every reported metric derived from executable evidence rather than a literal expected zero.
18. Severity counts derived from explicit finding rules.

The task must issue a truthful verdict even if that verdict blocks the floor-transfer phase.

---

# 3. Strict scope

## Do not

- Change production code
- Change production tests
- Change exercise programming
- Change the step-up target or set count
- Change the step-up grader
- Change training runtime behaviour
- Change feature flags/defaults
- Change Training Voice V2.1 contracts
- Change progression
- Change persistence schemas
- Change manifests
- Generate or modify audio
- Call ElevenLabs or another speech/audio API
- Install dependencies
- Change `package.json` or lockfiles
- Implement the floor-transfer gate
- Commit, push, stash, reset, clean, checkout, or discard work
- Overwrite the original step-up reports
- Hard-code a passing verdict
- Hard-code zero defect counts

## You may

- Add the requested verification artifacts
- Add one audit-only harness under `scripts/audits/`
- Add audit-only fixtures under `scripts/audits/fixtures/` if needed
- Import and execute current production pure functions
- Build deterministic state-machine scenarios
- Inspect source statically where native pose/runtime execution is unavailable
- Run existing tests
- Use temporary files and remove them before finishing

If verification exposes a production defect, do not fix it in this task.

---

# 4. Worktree safety

The repository is already heavily dirty.

At task start record:

```bash
git status --short --branch
git diff --name-only
git diff --stat
```

Record:

- current branch
- full and short `HEAD`
- upstream
- pre-existing relevant changes
- pre-existing untracked artifacts/audio

Rules:

1. Treat all current work as user-owned.
2. Do not reset, stash, checkout, clean, rebase, or discard.
3. Do not overwrite unrelated work.
4. Do not delete untracked files.
5. Do not commit or push.
6. At task end distinguish files added by this verification from pre-existing changes.

---

# 5. Required deliverables

Create these six artifacts:

1. `docs/audits/HALE_TRAINING_STEP_UP_ALTERNATION_VERIFICATION_ADDENDUM.md`
2. `docs/audits/HALE_TRAINING_STEP_UP_ALTERNATION_VERIFICATION_ADDENDUM.json`
3. `docs/audits/HALE_TRAINING_STEP_UP_ALTERNATION_SCENARIOS_V2.csv`
4. `docs/audits/HALE_TRAINING_STEP_UP_ALTERNATION_EVENT_EVIDENCE.csv`
5. `docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_INTEGRATION_TRACE.csv`
6. `docs/audits/HALE_VOICE_PROJECT_POST_STEP_UP_VERIFICATION_HANDOFF.md`

Add one audit-only harness:

- `scripts/audits/audit-training-step-up-alternation-addendum.mjs`

Do not overwrite the original 27-scenario audit.

---

# 6. Live source reconciliation

Before generating scenarios, independently verify:

## Plan

- Current default target
- Current set count
- Even-target support
- Odd-target failure
- Initial lead
- Set-start sequence
- Plan fingerprint
- Feature/default selection

## Rep evidence

- What production function creates `StepUpRepEvidence`
- Whether expected and observed lead are distinct
- Whether both-feet-at-start is required
- Whether top phase is required
- Whether both-feet-returned-to-floor is required
- Whether tracking validity is required
- What prevents duplicate acceptance
- What prevents stale callback mutation
- Whether descent-foot order is deliberately unconstrained

## Runtime state

- State phases
- Accepted-rep transition
- Expected-lead flip point
- Wrong-lead transition
- Tracking interruption
- Pause/background semantics
- Restore semantics
- Set completion
- Progression eligibility

## Integration

Trace the complete intended/default-closed path:

```text
generated step-up session item
→ attached alternation plan
→ TrainingSessionScreen/session runtime
→ pose/grader frame or rep event
→ lead-leg evidence adapter
→ step-up alternation state machine
→ SetResult
→ progression/session completion
→ serialization
→ restore/backend state
```

Do not assume this path exists because types and helpers exist.

---

# 7. Runtime integration proof

Create an explicit source-level integration trace.

The trace CSV must include one row for each link:

1. Exercise registry to generated session item
2. Final prescription to alternation plan
3. Feature/readiness selection to internal runtime path
4. Training screen/session controller to alternation runtime owner
5. Pose/grader output to lead-leg evidence
6. Lead-leg evidence to state-machine action
7. Accepted rep to rep-credit SFX
8. State machine to `SetResult`
9. `SetResult` to progression
10. `SetResult` to valid-time summary
11. Session item/state to local serialization
12. Local serialization to restore
13. Training state to backend JSON sync/restore
14. Successful main-plan completion to initial-lead seed flip
15. Manual/Explore path to no-main-seed mutation
16. Training Voice V2.1 planner to current expected lead/target

Suggested columns:

```text
linkId,fromComponent,toComponent,sourceFile,sourceSymbol,reachableWhenEnabled,evidenceType,evidenceDetail,testCoverage,status,blockerId,notes
```

Allowed `status`:

- `connected_verified`
- `connected_but_not_exercised`
- `model_only_not_connected`
- `partially_connected`
- `legacy_only`
- `not_applicable`
- `uncertain`

## Critical rule

If any of links 3–10 is `model_only_not_connected`, `partially_connected`, or `uncertain`, do not use a “verified complete” verdict.

Use:

```text
TRAINING_STEP_UP_ALTERNATION_MODEL_COMPLETE_RUNTIME_INTEGRATION_PENDING
```

unless a more severe remediation verdict is required.

A correct isolated model is valuable, but it is not the same as end-to-end software completion.

---

# 8. Canonical scenario set

The addendum must include all 53 canonical scenario ids below.

Do not replace them with broad aggregate rows.

Variants may create multiple rows per scenario, but every id must appear.

## Normal

1. `step_up_left_first_set_12_reps`
2. `step_up_right_first_set_12_reps`
3. `step_up_three_sets_left_initial`
4. `step_up_three_sets_right_initial`
5. `step_up_six_left_six_right`
6. `step_up_both_feet_floor_each_rep`

## Invalid and wrong lead

7. `wrong_lead_on_first_rep`
8. `wrong_lead_after_five_reps`
9. `wrong_lead_returns_to_floor_then_corrects`
10. `wrong_lead_does_not_flip_expected`
11. `generic_rep_without_lead_evidence_rejected`
12. `opposite_chain_clearer_not_auto_credited`

## Boundary and duplicate handling

13. `top_reached_no_floor_return`
14. `one_foot_remains_on_step`
15. `duplicate_completion_callback`
16. `stale_callback_after_next_rep_started`
17. `threshold_noise_single_credit`
18. `descent_order_not_overconstrained`

## Interruption and restore

19. `tracking_loss_mid_left_lead_rep`
20. `tracking_loss_mid_right_lead_rep`
21. `pause_mid_rep`
22. `background_mid_rep`
23. `restore_after_six_reps`
24. `restore_mid_rep`
25. `cancel_mid_set`
26. `skip_mid_set`

## Targets and generated prescriptions

27. `default_target_12`
28. `even_scaled_target_10`
29. `odd_scaled_target_9_blocked`
30. `noninteger_target_blocked`
31. `short_session_final_target`
32. `visible_voice_runtime_target_match`

## Seed and order

33. `seed_defaults_left`
34. `successful_completion_flips_seed`
35. `skip_does_not_flip_seed`
36. `manual_practice_does_not_flip_seed`
37. `duplicate_completion_idempotent`
38. `sync_restore_preserves_seed`

## Progression and result aggregation

39. `one_set_one_progression_event`
40. `lead_counts_do_not_double_set_count`
41. `valid_time_not_doubled`
42. `twelve_total_unequal_sides_rejected`
43. `broken_alternation_not_progression_eligible`
44. `legacy_result_still_parses`

## Voice and runtime isolation

45. `step_up_start_left_logical_plan`
46. `step_up_start_right_logical_plan`
47. `wrong_lead_left_correction_plan`
48. `wrong_lead_right_correction_plan`
49. `no_per_rep_spoken_switch`
50. `feature_off_legacy_unchanged`
51. `alternation_flag_alone_no_half_activation`
52. `training_voice_remains_default_closed`
53. `balance_v2_remains_default_closed`

The harness may add scenarios, but it may not omit these.

---

# 9. Scenario execution quality

Each scenario must execute actual current production pure functions wherever possible.

## Not acceptable

- A row whose `passed` value is written directly without running the state machine
- A row that only checks whether source text contains a word when executable behaviour exists
- A scenario copied from the old audit without recomputation
- A synthetic expected result presented as an observed result
- A defect count assigned directly to zero
- A verdict assigned as a constant

## Acceptable evidence

- Executed planner output
- Executed reducer/state-machine transitions
- Executed serialization/restore round trip
- Executed progression aggregation
- Executed feature selection
- Executed Training Voice V2.1 sequence planner
- Static source trace only where a true runtime path cannot be instantiated
- Existing focused Jest test as secondary corroboration, not the only scenario result

Every scenario row must identify its evidence method.

---

# 10. Scenario CSV schema

Use columns similar to:

```text
scenarioId,variantId,category,evidenceMethod,sourceFunctions,initialState,eventSequence,expectedOutcome,observedOutcome,passed,findingRuleIds,metricTags,testCoverage,notes
```

Requirements:

- `eventSequence` and state values may be JSON strings.
- `observedOutcome` must contain actual derived values.
- `passed` must be computed.
- Each canonical scenario id appears at least once.
- Failed rows remain in the CSV.
- No row is removed to obtain a passing verdict.

---

# 11. Event-evidence CSV

Create detailed rows for rep/state scenarios.

Use columns similar to:

```text
scenarioId,variantId,eventIndex,eventType,repAttemptId,setIndex,expectedLeadBefore,observedLead,bothFeetAtStart,ascentValid,topPhaseValid,bothFeetReturnedToFloor,trackingValid,outcome,credited,sfxPlayed,expectedLeadAfter,acceptedRepCount,leftLeadRepCount,rightLeadRepCount,setCompleted,progressionEligible,validTimeMs,seedBefore,seedAfter,restoreState,sourceFunction,notes
```

Requirements:

- All accepted/rejected rep evidence used by metrics appears here.
- Duplicate and stale events remain visible.
- Restore scenarios expose pre-save and post-restore state.
- Progression scenarios expose event count and eligibility.
- CSV rows must be sufficient to recompute all defect counts.

---

# 12. Derived metric requirements

At minimum derive these metrics from scenario/event rows:

```text
canonicalScenarioCount
scenarioVariantCount
passedScenarioCount
failedScenarioCount

wrongLeadCreditedRepCount
genericUnknownLeadCreditedRepCount
repCreditedWithoutStartBoundaryCount
repCreditedWithoutTopPhaseCount
repCreditedBeforeFloorReturnCount
duplicateRepCreditCount
staleCallbackMutationCount
thresholdNoiseExtraCreditCount

wrongAttemptExpectedLeadFlipCount
trackingInterruptedRepCreditCount
pausePartialRepCreditCount
backgroundPartialRepCreditCount
restorePartialRepCreditCount

validSetLeftRightMismatchCount
setCompletedBeforeTargetCount
setCompletedWithBrokenAlternationCount
repSfxMismatchCount
extraSetEventCount

oddTargetSilentlyAdjustedCount
nonintegerTargetSilentlyAdjustedCount
visibleVoiceRuntimeTargetMismatchCount

seedDefaultFailureCount
successfulCompletionSeedFlipFailureCount
skipCancelSeedFlipCount
manualPracticeSeedMutationCount
duplicateCompletionSeedFlipCount
syncRestoreSeedDriftCount

progressionInvalidAlternationAcceptedCount
sideImbalanceMaskedByTotalCount
validTimeDoubleCount
duplicateProgressionEventCount
legacyParseFailureCount

startLeadLogicalMismatchCount
wrongLeadCorrectionLogicalMismatchCount
perRepSpokenSwitchCount
spokenSetCountCueCount
legacyV21MixedSemanticsCount

runtimeIntegrationMissingLinkCount
runtimeIntegrationPartialLinkCount
runtimeIntegrationUncertainLinkCount

irVoiceStepAlternationRemaining
trainingVoiceSelectableCount
audioAssetDiffCount

p0
p1
p2
p3
```

The harness may add more.

---

# 13. Metric evidence

The JSON must contain a `metricEvidence` object.

Every metric must include:

```json
{
  "value": 0,
  "sourceScenarioIds": [],
  "sourceEventFilters": [],
  "recomputeMethod": "...",
  "independentCheck": "..."
}
```

## Zero-valued metrics

A zero is valid only if:

- a concrete evaluated scenario set exists,
- the filter is defined,
- and independent recomputation returns zero.

Do not use empty evidence for P0/P1/P2/P3.

## Independent recomputation

After writing both CSVs:

1. Re-open them from disk.
2. Recompute all scenario-derived metrics.
3. Compare recomputed values with JSON.
4. Fail on any mismatch.
5. Recompute the verdict from finding rules.

---

# 14. Finding rules and severity derivation

Create explicit finding rules.

At minimum:

## P0

Reserve for a credible immediate safety-critical defect in the enabled internal path, such as a state transition that can credit unsafe/incomplete movement and then advance into another rep without a valid floor boundary.

Do not force a P0 if none exists.

## P1

Generate a P1 when any of these is greater than zero:

- wrongLeadCreditedRepCount
- genericUnknownLeadCreditedRepCount
- repCreditedBeforeFloorReturnCount
- duplicateRepCreditCount
- restorePartialRepCreditCount
- validSetLeftRightMismatchCount
- setCompletedWithBrokenAlternationCount
- progressionInvalidAlternationAcceptedCount
- legacyV21MixedSemanticsCount

## P2

Generate a P2 when:

- the model is not connected end to end to the internal runtime,
- pose/grader output cannot actually supply the required lead/floor evidence,
- target/seed/persistence/runtime links are partial,
- or an important scenario is statically indeterminate.

## P3

Use for:

- deferred physical-device validation of lead-leg/floor-boundary reliability,
- deferred UI/device timing,
- human listening still waived.

Every finding must include:

- id
- severity
- title
- triggering metric/rule
- affected scenarios
- source evidence
- user consequence
- whether it blocks the floor-gate handoff
- recommended next task

Severity counts must be calculated from the findings array.

---

# 15. Runtime integration verdict boundary

Evaluate whether the implementation is:

## A. End-to-end internally connected

Required proof:

- An enabled internal generated step-up item selects the alternation path.
- Training runtime receives and owns the alternation state.
- Real grader/pose output is adapted into lead/floor evidence.
- Accepted evidence updates the state machine.
- State output drives `SetResult`.
- `SetResult` reaches progression and serialization.
- Restore reconstructs the state.
- Feature-off path remains legacy.

## B. A correct isolated/default-closed model

Indicators:

- Plans, state machine, serialization helpers, and tests exist.
- Generated metadata may be attached.
- But the screen/session player does not consume the state machine.
- Or no real grader output creates the evidence.
- Or results do not reach progression in the internal path.

Do not describe B as end-to-end complete.

---

# 16. Primary verdicts

Issue exactly one primary verdict.

## `TRAINING_STEP_UP_ALTERNATION_VERIFIED_COMPLETE_DEFAULT_CLOSED`

Use only when:

- all 53 canonical scenarios are present,
- all completion gates pass,
- metrics are independently derived,
- the end-to-end internal runtime integration chain is verified,
- the feature remains default-closed,
- only device/listening P3 items remain.

Next task:

```text
Training floor-transfer readiness gate implementation
```

## `TRAINING_STEP_UP_ALTERNATION_MODEL_COMPLETE_RUNTIME_INTEGRATION_PENDING`

Use when:

- the isolated model/planner/state/persistence logic passes,
- but one or more critical runtime links are absent or partial.

Next task:

```text
Training step-up alternation runtime integration patch
```

Do not proceed to the floor gate yet.

## `TRAINING_STEP_UP_ALTERNATION_REMEDIATION_REQUIRED`

Use when:

- any contract, state, restore, progression, seed, or isolation completion gate fails.

Next task:

```text
Fix the exact findings listed in this addendum
```

## `CURRENT_SOURCE_REBASE_REQUIRED`

Use when:

- current source drift prevents reliable verification.

---

# 17. Completion gates

The addendum may use the verified-complete verdict only if:

## Coverage

- canonical scenario ids present: `53 / 53`
- omitted canonical scenario count: `0`
- scenario rows parse: yes
- event rows parse: yes
- independent metric recomputation passes: yes

## Rep validity

- wrongLeadCreditedRepCount: `0`
- genericUnknownLeadCreditedRepCount: `0`
- repCreditedWithoutStartBoundaryCount: `0`
- repCreditedWithoutTopPhaseCount: `0`
- repCreditedBeforeFloorReturnCount: `0`
- duplicateRepCreditCount: `0`
- staleCallbackMutationCount: `0`
- thresholdNoiseExtraCreditCount: `0`
- wrongAttemptExpectedLeadFlipCount: `0`

## Interruption and restore

- trackingInterruptedRepCreditCount: `0`
- pausePartialRepCreditCount: `0`
- backgroundPartialRepCreditCount: `0`
- restorePartialRepCreditCount: `0`
- expected-lead restore drift: `0`
- plan fingerprint restore drift: `0`

## Set and progression

- validSetLeftRightMismatchCount: `0`
- setCompletedBeforeTargetCount: `0`
- setCompletedWithBrokenAlternationCount: `0`
- repSfxMismatchCount: `0`
- extraSetEventCount: `0`
- progressionInvalidAlternationAcceptedCount: `0`
- sideImbalanceMaskedByTotalCount: `0`
- validTimeDoubleCount: `0`
- duplicateProgressionEventCount: `0`
- legacyParseFailureCount: `0`

## Targets and seeds

- oddTargetSilentlyAdjustedCount: `0`
- nonintegerTargetSilentlyAdjustedCount: `0`
- visibleVoiceRuntimeTargetMismatchCount: `0`
- seedDefaultFailureCount: `0`
- successfulCompletionSeedFlipFailureCount: `0`
- skipCancelSeedFlipCount: `0`
- manualPracticeSeedMutationCount: `0`
- duplicateCompletionSeedFlipCount: `0`
- syncRestoreSeedDriftCount: `0`

## Voice and isolation

- startLeadLogicalMismatchCount: `0`
- wrongLeadCorrectionLogicalMismatchCount: `0`
- perRepSpokenSwitchCount: `0`
- spokenSetCountCueCount: `0`
- legacyV21MixedSemanticsCount: `0`
- `IR-VOICE-STEP-ALTERNATION` remaining: `0`

## Integration

For a verified-complete verdict:

- runtimeIntegrationMissingLinkCount: `0`
- runtimeIntegrationPartialLinkCount: `0`
- runtimeIntegrationUncertainLinkCount: `0`

## Project gates

- step-up feature remains off by default
- Training Voice V2.1 remains off
- Training Voice V2.1 audio ready remains false
- Training Voice V2.1 global behaviour ready remains false
- Balance V2 remains default-closed/audio-pending
- no audio changed
- no audio generated
- no external speech/audio API called
- physical QA remains deferred
- human listening remains waived

---

# 18. Handoff artifact

Create:

- `docs/audits/HALE_VOICE_PROJECT_POST_STEP_UP_VERIFICATION_HANDOFF.md`

Its next task must be determined by the verdict.

## If verified complete

Next task:

```text
Training floor-transfer readiness gate implementation
```

## If runtime integration is pending

Next task:

```text
Training step-up alternation runtime integration patch
```

List every missing/partial integration link.

## If remediation is required

Next task:

```text
Training step-up alternation remediation for findings <ids>
```

Do not mechanically retain the old floor-gate handoff if verification blocks it.

---

# 19. Addendum report structure

Use:

# Hale Training Step-Up Alternation Verification Addendum

## 1. Executive Verdict

## 2. Why the Addendum Was Required

## 3. Worktree and Source Freshness

## 4. Current Implementation Surface

## 5. Runtime Integration Trace

## 6. Canonical Scenario Coverage

## 7. Normal Alternation Results

## 8. Wrong-Lead and Evidence Rejection

## 9. Floor-Boundary and Duplicate Handling

## 10. Interruption, Pause, Background, and Restore

## 11. Target Variants

## 12. Seed and Order Persistence

## 13. Progression and Valid-Time Aggregation

## 14. Training Voice V2.1 and Feature Isolation

## 15. Derived Metric Method

## 16. Findings

## 17. Completion-Gate Decision

## 18. Tests and Validation

## 19. Worktree Integrity

## 20. Exact Next Task

---

# 20. JSON structure

Use a top-level structure similar to:

```json
{
  "auditVersion": 2,
  "generatedAt": "...",
  "primaryVerdict": "...",
  "repositorySnapshot": {},
  "sourceFreshness": {},
  "summary": {},
  "canonicalScenarioIds": [],
  "scenarioCoverage": {},
  "runtimeIntegrationTrace": [],
  "metrics": {},
  "metricEvidence": {},
  "findings": [],
  "completionGates": [],
  "validation": {},
  "nextTask": "..."
}
```

Keep JSON valid and comment-free.

---

# 21. Validation commands

Run at minimum:

```bash
npm run verify:audio
npx tsc --noEmit --pretty false
```

Run:

- existing focused step-up tests
- both-sides round tests
- Training Voice V2.1 foundation tests
- training session player tests
- workout generation tests
- progression/valid-time tests
- serialization/restore tests
- backend training-state tests
- Balance V2 regression audit
- the full Jest suite

Run the new addendum harness.

Parse all generated JSON and CSV files.

Independently recompute metrics from the written CSV files.

Inspect:

```bash
git status --short --branch
git diff --stat
git diff -- assets/audio
```

The existing post-pass Jest open-handle warning may be reported if Jest exits successfully; do not conceal it.

Do not modify tests merely to make them pass.

---

# 22. Final Codex response

When finished, respond with:

- Paths to all six addendum artifacts
- Audit-only harness path
- Confirmation that no production code changed
- Confirmation that no production tests changed
- Confirmation that no audio changed or was generated
- Confirmation that no external speech/audio API was called
- Current branch and commit
- Whether the worktree was already dirty
- Original scenario count
- New canonical scenario count
- New scenario variant count
- Omitted canonical scenario count
- Event-evidence row count
- Runtime integration link counts by status
- Whether pose/grader evidence is connected to the state machine
- Whether the state machine is connected to `SetResult`
- Whether `SetResult` is connected to progression
- Whether state is connected to serialization/restore/backend
- Every derived defect metric
- P0/P1/P2/P3 counts
- Primary verdict
- Whether the floor-transfer phase is now unblocked
- Exact next task
- `npm run verify:audio` result
- `npx tsc --noEmit` result
- Focused and full Jest results
- Independent metric recomputation result
- A concise confidence statement

Do not implement production fixes or begin the floor-transfer gate in this task.
