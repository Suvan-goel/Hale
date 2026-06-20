You are implementing Stage 3B of Hale’s production-readiness work:

OFFICIAL EVIDENCE SUFFICIENCY, PARTIAL CHECK-UP RECOVERY, MANUAL-EXTRA ISOLATION, AND EXACT CHECK-UP-TYPE SEMANTICS

This is a focused production-code remediation task.

Do not begin Stage 3C, Stage 3D, Stage 4, Stage 5, or any later audit in this task.

## Required prior reading

Read these documents in full before changing code:

- docs/audits/HALE_LOGIC_AUDIT_STAGE_0.md
- docs/audits/HALE_LOGIC_AUDIT_STAGE_1.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_1A.md
- docs/audits/HALE_LOGIC_AUDIT_STAGE_2.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_2A.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_2A_1.md
- docs/audits/HALE_LOGIC_AUDIT_STAGE_3.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3A.md

The current working tree is the final source of truth. Re-verify all paths before editing because report line numbers may no longer be exact.

## Stage 3A baseline

Stage 3A is complete.

It introduced:

- `validateCheckUpForScoring`
- `scoreCheckUpWithDiagnostics`
- Defensive runtime validation of Check-Up items and movement results.
- Duplicate-known-movement rejection.
- Protocol-derived bounds for chair stand, balance, and shoulder flexion.
- Safe scoring for malformed local and restored data.
- Stage 1A protection against malformed-only evidence.

Stage 3A intentionally preserved:

- One-domain eligibility.
- Two-domain eligibility.
- Manual-extra history behaviour.
- Current assessment confidence/status semantics.
- Current Check-Up-type persistence behaviour.
- Current Progress selectors.
- Current next-block source selection.
- Current scoring/norm versioning behaviour.
- Current tie behaviour.
- Current progress/report comparison semantics.

Do not weaken or bypass any Stage 3A validation contract.

## Approved product decisions

The product owner has approved these Hale rules.

### Official result evidence

An official baseline, baseline retake, or official monthly re-test is complete only when all three headline domains are measured:

- Strength.
- Balance.
- Mobility.

In the current scoring architecture, these headline domains are driven by:

- Strength: valid chair-stand headline evidence.
- Balance: valid balance-ladder headline evidence.
- Mobility: valid shoulder-flexion headline evidence.

Supporting metrics do not determine completeness:

- Chair rise velocity.
- Earlier balance stages.
- Balance sway.
- TUG.
- Hinge reach.

A missing supporting metric must not make an otherwise complete three-domain Check-Up incomplete.

### Partial Check-Ups

A Check-Up with one or two measured headline domains:

- May show the successfully measured domains.
- Must be labelled incomplete.
- Must not identify an official weakest domain.
- Must not create or replace a training block.
- Must not complete onboarding.
- Must not complete an official re-test.
- Must not generate a block report.
- Must not become the latest usable official result.
- Must not affect official Progress.
- Must offer a targeted retry for missing headline domains where the existing architecture can support it safely.

### Manual and quick Check-Ups

`manual_extra` and `quick_recheck` Check-Ups:

- May be saved.
- May be viewed as extra Check-Ups.
- May show their measured domains.
- Must not affect official Progress.
- Must not replace the latest official result.
- Must not alter baseline comparisons.
- Must not generate block reports.
- Must not affect lifecycle routing.
- Must not create or replace a training block.
- Must not seed automatic next-block creation.

This remains true even when all three domains are measured.

### Exact Check-Up types

The following types must remain identifiable through local history, backend sync metadata, restoration, and selectors:

- `baseline`
- `baseline_retake`
- `official_retest`
- `manual_extra`
- `quick_recheck`
- `micro_check`, where represented in the relevant persistence path

Historical records whose type genuinely cannot be recovered must fail closed as a non-official legacy/unknown type.

Do not guess that an untyped historical record is official merely because it is old, first, latest, or block-eligible.

### Baseline retakes

Preserve the existing baseline-retake confirmation and replacement semantics.

Do not silently change which completed baseline or baseline retake is authoritative beyond what is required to:

- enforce all-three-domain completeness,
- preserve exact type,
- and exclude partial/invalid attempts.

### Weakest-domain ties

Do not implement the final exact-tie or near-tie policy in Stage 3B.

For a complete three-domain result, preserve current scoring output until the later tie remediation.

For an incomplete result, do not present or use any weakest-domain conclusion.

### Movement-age claims and progress significance

Do not change:

- Norm tables.
- Movement-age formulas.
- Movement-age wording for complete results.
- Meaningful-change rules.
- Improvement/decline wording.
- Tie handling.
- Scoring/norm versioning.

Those belong to later Stage 3 work.

## Confirmed findings being addressed

### F3-001 — P1: one-domain results can create blocks

Current behaviour before Stage 3B:

- One measured domain creates medium confidence.
- Medium confidence defaults to `completed`.
- Stage 1A eligibility accepts one finite focus domain.
- A chair-only or shoulder-only Check-Up can create a block.

Stage 3B must close this finding.

### F3-002 — P1: manual-extra history can contaminate official flows

Confirmed paths include:

- Progress latest summary uses latest raw history.
- Domain progress compares first raw Check-Up with latest raw Check-Up.
- Lifecycle scans raw history for the latest block-eligible score.
- `handleStartNextBlock` may use `lastResult` or latest raw history.
- Raw history does not currently encode exact Check-Up type.

A valid manual extra can therefore influence Progress and next-block creation despite product copy saying it does not replace the official trend.

Stage 3B must close this finding.

### F3-009 — P2: local Check-Up types can collapse remotely

Current backend mapping may collapse types such as:

- `baseline_retake`
- `quick_recheck`
- `micro_check`

to remote `unknown`.

Restore may then recover an incorrect non-official type or rely on derived metadata inconsistently.

Stage 3B must preserve exact canonical type semantics without requiring a broad backend schema redesign unless the repository already contains a safe migration path.

## Primary objective

Create one authoritative evidence-and-officialness contract so that every consumer can distinguish:

1. Invalid attempt:
   - zero measured headline domains.

2. Incomplete attempt:
   - one or two measured headline domains.

3. Complete Check-Up:
   - all three measured headline domains.

4. Official usable Check-Up:
   - complete,
   - official Check-Up type,
   - internally consistent,
   - Stage 3A-valid evidence.

5. Extra/non-official Check-Up:
   - manual or quick,
   - displayable,
   - never automatically authoritative.

Then ensure:

- Blocks use only complete official evidence.
- Official Progress uses only complete official evidence.
- Manual/quick results remain isolated.
- Partial attempts remain recoverable.
- Exact Check-Up type survives local and remote round trips.
- Existing valid full official flows continue to work.
- Stage 3A malformed-input protection remains intact.

## Scope boundary

This task may change:

- Assessment evidence-status logic.
- Assessment status types.
- Assessment confidence/status derivation.
- Block eligibility.
- Result-state helpers.
- Local typed-history metadata.
- History serialization/deserialization.
- History selectors.
- Progress selectors and view models.
- Lifecycle assessment selection.
- Initial-plan and next-block source selection.
- Baseline and official re-test partial-result handling.
- Manual-extra and quick-recheck isolation.
- Check-Up-type backend metadata mapping.
- Restore mapping.
- Targeted retry helpers and narrow UI wiring.
- Result-screen incomplete-state copy and CTAs.
- Relevant tests.
- The Stage 3B remediation report.

This task must not change:

- Scoring formulas.
- Norm tables.
- Norm anchors.
- Movement-age formulas.
- Domain composition.
- Which metric drives each headline domain.
- Stage 3A plausibility bounds.
- Camera or movement measurement logic.
- Exercise catalogue.
- Workout-generation logic.
- Training-session completion semantics.
- Tie or near-tie handling for complete scores.
- Meaningful-change thresholds.
- Progress improvement/decline thresholds.
- Scoring/norm versioning.
- Account-local-data isolation.
- Legacy workout fallback.
- Equipment state.
- TUG release status.
- Broad UI redesign.

Do not perform opportunistic refactors.

## Locked Stage 3B contracts

### 1. Headline-domain completeness

Create one authoritative pure helper for headline evidence.

Conceptually:

```ts
type HeadlineDomain = 'strength' | 'balance' | 'mobility';

type HeadlineEvidenceState = {
  measuredDomains: HeadlineDomain[];
  missingDomains: HeadlineDomain[];
  measuredDomainCount: number;
  complete: boolean;
};
```

Adapt names to the repository.

Requirements:

- Uses the final Stage 3A-validated `CheckUpScore`.
- Strength counts only when `score.strength.measured === true` and its headline bounds are finite.
- Balance counts only when `score.balance.measured === true` and its headline bounds are finite.
- Mobility counts only when `score.mobility.measured === true` and its headline bounds are finite.
- Complete means exactly all three headline domains are measured.
- Supporting detail rows do not affect completeness.
- Hinge reach is not required.
- Rise velocity is not required.
- TUG is not required.
- Domain order is stable and explicit.
- The helper is pure and deterministic.
- Missing or malformed score shapes fail closed.
- No caller independently recreates the three-domain rule.

A suitable location may be:

- `src/haleFlow/assessmentEvidence.ts`
- or an existing assessment-eligibility module if that creates a cleaner single source of truth.

### 2. Assessment status semantics

The assessment status model must distinguish:

- `invalid`
- `incomplete`
- `completed`

If current types do not contain `incomplete`, add it narrowly and update all exhaustive consumers.

Required mapping:

```text
0 measured headline domains
-> status: invalid
-> confidence: low

1 or 2 measured headline domains
-> status: incomplete
-> confidence: medium

3 measured headline domains
-> status: completed
-> confidence: high
```

Requirements:

- Confidence and status are separate concepts.
- A medium-confidence assessment is not completed.
- A completed assessment always has all three headline domains.
- An incomplete assessment never has an authoritative official weakest domain.
- An invalid assessment never has an authoritative official weakest domain.
- Existing historical assessments marked `completed` with fewer than three measured headline domains must be normalized as incomplete when read or restored for decision-making.
- Do not silently mutate old persisted files unless the existing migration architecture safely supports it.
- Preserve the raw attempt for history/debugging.

For incomplete assessments:

- `weakestDomain` on the authoritative `MovementAssessment` should be null or otherwise explicitly non-authoritative.
- If `CheckUpScore.weakestDomain` remains populated internally from measured domains for compatibility, no UI, block, Progress, lifecycle, or report consumer may treat it as official.

### 3. Officialness is independent of completeness

Official Check-Up types remain:

- `baseline`
- `baseline_retake`
- `official_retest`

Non-official types remain:

- `manual_extra`
- `quick_recheck`
- `micro_check`
- unknown/legacy type

A Check-Up can therefore be:

- official type but incomplete,
- official type but invalid,
- non-official but complete,
- non-official and incomplete.

Only:

```text
official type
AND status completed
AND all three headline domains measured
AND internal score/assessment consistency
```

is a usable official assessment.

Create or harden explicit helpers such as:

- `isOfficialCheckupType`
- `isCompleteHeadlineAssessment`
- `isUsableOfficialAssessment`
- `latestOfficialAttempt`
- `latestUsableOfficialAssessment`
- `latestIncompleteOfficialAttempt`

Adapt to current architecture.

Do not overload one ambiguous “latest” helper with all meanings.

### 4. Block eligibility

Harden `getBlockCreationEligibility` and every block-service boundary.

Automatic block creation requires:

- Assessment status `completed`.
- All three headline domains measured.
- Exact score/assessment domain-count consistency.
- Official Check-Up type.
- `isOfficialForProgress === true`.
- Finite explicit focus domain.
- No invalid Stage 3A evidence.
- No unsupported or missing type.

Add stable ineligibility reasons where appropriate, such as:

- `assessment_invalid`
- `assessment_incomplete`
- `missing_headline_domains`
- `non_official_assessment`
- `score_assessment_mismatch`
- existing focus-related reasons

Do not silently map:

- manual to official,
- partial to complete,
- missing type to baseline,
- missing focus to strength.

Defend both:

- `createMovementBlockFromAssessment`
- legacy block creation orchestration in `App.tsx`

A hidden button must not be the only guard.

### 5. Partial-result presentation

A partial Check-Up with one or two measured headline domains must:

- Show the valid measured domain cards.
- Show unmeasured headline domains as pending/incomplete.
- State the exact measured count, such as “2 of 3 areas measured.”
- Avoid an overall weakest-domain or plan-focus statement.
- Avoid “Create my 4-week block.”
- Avoid claiming that Hale has completed the full Movement Check-Up.
- Offer a retry action for the missing headline measurements.
- Allow the user to leave without losing successfully measured evidence.
- Remain calm and non-blaming.

Suitable copy:

Title:

“Let’s complete your Movement Check-Up”

Body:

“We measured 2 of 3 areas. Complete the remaining measurement before Hale builds your plan.”

Primary action:

“Retry missing measurement”

or, for multiple missing domains:

“Complete missing measurements”

Avoid:

- “Failure”
- “Invalid user”
- “You did it wrong”
- Medical terminology
- Claiming a diagnosis
- Claiming a weakest domain from partial evidence

Measured domain age cards may remain visible under the current provisional movement-age policy.

### 6. Targeted retry

Implement targeted retry where the current Check-Up architecture can support it safely.

Headline-domain-to-movement mapping:

- Strength -> chair stand.
- Balance -> balance ladder.
- Mobility -> shoulder flexion.

Do not require hinge reach to complete the mobility domain.

A pure helper should produce the retry battery from missing headline domains.

Requirements:

- Missing strength only -> retry chair stand only.
- Missing balance only -> retry balance ladder only.
- Missing mobility only -> retry shoulder flexion only.
- Missing strength + mobility -> chair then shoulder.
- All missing -> chair, balance, shoulder.
- No missing -> no retry battery.
- Hinge missing alone -> no retry required.
- TUG never included.
- Empty missing list does not start a retry.
- Unknown domains fail closed.
- The default full battery remains unchanged for a new Check-Up.

Prefer extending `CheckUpScreen` or its orchestrator with an explicit battery prop rather than duplicating the Check-Up implementation.

Do not create separate assessment screens for retries.

### 7. Retry result merge

Create one pure retry-merge helper.

Conceptually:

```ts
mergeCheckUpRetry({
  baseCheckUp,
  retryCheckUp,
  retriedMovementIds,
})
```

Requirements:

- Preserve valid non-retried items from the base attempt.
- Replace only the targeted movement items.
- Never append duplicate known movement IDs.
- Preserve default battery ordering.
- A failed retry does not erase unrelated valid domains.
- A successful retry can turn an incomplete result into a complete result.
- Repeated retries remain deterministic.
- Reversing retry-item order does not alter the merged result.
- Stage 3A validation runs on the final merged result.
- The merged Check-Up is a new saved attempt with a unique current attempt identity/timestamp according to the existing history architecture.
- Preserve the original partial attempt rather than silently rewriting its historical evidence.
- Preserve the original canonical Check-Up type.
- Record retry lineage only if the current history metadata model can do so narrowly and safely.
- Do not invent a broad event-sourcing system.

If the existing Check-Up identity is based on `startedAt`, ensure the merged attempt cannot overwrite the original partial file.

Do not solve the separate general same-timestamp filename-collision issue beyond what is necessary for safe retry persistence.

### 8. Retry after restart

A saved incomplete official attempt must remain recoverable after app restart.

Requirements:

- The latest incomplete baseline attempt can lead the user back to missing headline measurements.
- The latest incomplete official re-test can lead the user back to missing headline measurements.
- The app must not resume directly inside an active camera timer.
- The user explicitly starts the retry.
- Missing domains are derived again from the stored score, not from stale in-memory state.
- A newer invalid/incomplete official attempt does not hide the older usable official result in Progress.
- The incomplete attempt may be surfaced as a pending action.
- Existing lifecycle states should be reused where practical.
- Do not add unnecessary lifecycle states if current state metadata can express the pending action safely.

### 9. Manual and quick Check-Up isolation

For `manual_extra` and `quick_recheck`:

- Save the raw Check-Up.
- Save its assessment metadata.
- Preserve exact type.
- Allow the immediate result screen.
- Never enable automatic block creation.
- Never enable next-block creation.
- Never mark onboarding complete.
- Never satisfy baseline requirements.
- Never satisfy official re-test completion.
- Never generate a block report.
- Never become `latestUsableOfficialAssessment`.
- Never replace official Progress summaries.
- Never become an official comparison endpoint.
- Never affect lifecycle state.
- Never become the fallback assessment used to create a plan.

A full three-domain manual Check-Up may have:

- status `completed`,
- confidence `high`,
- non-official type,
- `isOfficialForProgress === false`.

It remains block-ineligible because it is non-official.

### 10. Extra Check-Up history

Do not delete or hide manual and quick Check-Ups.

Add one authoritative typed selector for extra Check-Ups.

Examples:

- `getExtraCheckUps`
- `getLatestExtraCheckUp`

Extra Check-Ups should be distinguishable from official Progress.

Where the existing Progress architecture allows a narrow addition:

- Show an “Extra Check-Ups” section.
- Keep it visually and semantically separate from official progress.
- Do not show official trend arrows or before/after claims for extra Check-Ups.
- Allow the user to open the result.
- Do not show a plan-creation CTA.

Do not perform a broad Progress redesign.

If adding a visible section would require a disproportionate refactor:

- implement the typed selector and immediate result access,
- preserve the records,
- document the UI limitation in the report,
- but do not let this limitation weaken official isolation.

### 11. Canonical typed history

Raw history currently lacks authoritative Check-Up type.

Create one canonical typed-history representation.

Prefer a stored envelope rather than coupling product type deeply into movement measurement logic.

A conceptual shape may resemble:

```ts
type StoredCheckUpRecord = {
  id: string;
  checkUp: CheckUp;
  checkupType: CheckUpType | 'legacy_unknown';
  sourceAssessmentId?: string;
  retryOfCheckUpId?: string;
};
```

Adapt this to existing `StoredCheckUp` and serializer types.

Requirements:

- New saved Check-Ups always include exact canonical type.
- History selectors receive typed records.
- Type is not inferred from array position.
- Type is not inferred from first/latest ordering.
- Type is not inferred from score eligibility.
- Type is not inferred from active-block state.
- Assessment type and history type must agree for new records.
- Mismatch fails closed and produces a safe diagnostic.
- The raw `CheckUp` measurement object may remain product-type agnostic if that preserves cleaner architecture.
- Do not maintain two independently writable canonical type fields without a consistency check.

### 12. Legacy history migration

Old local history may not contain Check-Up type.

Migration/read rules:

1. If a stored record contains a valid exact type:
   - use it.

2. Otherwise, if it can be matched unambiguously to one `MovementAssessment` through the existing stable source Check-Up identifier:
   - use that assessment’s exact type.

3. Otherwise:
   - classify it as `legacy_unknown`,
   - treat it as non-official,
   - do not use it for block creation or official Progress.

Do not infer official type from:

- being the first history row,
- being the latest history row,
- having three measured domains,
- having an active block nearby,
- being older than another record.

Preserve the record for viewing/export.

Do not destructively rewrite old files unless current migration infrastructure explicitly supports safe atomic migration.

### 13. Exact backend type preservation

Inspect:

- local-to-remote check-up mapping,
- remote enum constraints,
- `raw_checkup_json`,
- `derived_scores_json`,
- assessment metadata,
- restore precedence.

Preserve exact canonical type for every new synced record.

If the remote database enum cannot represent every local type without a schema migration:

- retain the closest safe remote enum value required by the current schema,
- store the exact canonical type in sanitized JSON metadata,
- restore from the exact canonical metadata first,
- use the remote enum only as a fallback,
- never lose officialness semantics.

Required exact round trips:

- baseline -> baseline.
- baseline_retake -> baseline_retake.
- official_retest -> official_retest.
- manual_extra -> manual_extra.
- quick_recheck -> quick_recheck.
- micro_check -> micro_check where this sync path handles it.

When neither exact metadata nor a reliable enum is available:

- restore as `legacy_unknown`,
- non-official,
- block-ineligible.

Do not restore remote `unknown` as `manual_extra` merely as a convenient default.

Do not add a live production database migration unless:

- the repository already has a migration mechanism,
- the migration is necessary,
- and it can be tested safely.

Prefer metadata preservation in this task.

### 14. Official history selectors

Create or harden canonical selectors using typed history and assessment metadata.

Required selectors should support:

- latest official attempt.
- latest usable official result.
- earliest/authoritative usable baseline according to existing retake semantics.
- latest incomplete official attempt.
- extra/manual history.
- exact raw Check-Up matching a MovementAssessment.

Official selectors must require:

- official type.
- completed status.
- all three headline domains.
- valid source association.
- Stage 3A-valid score.

Do not fall back from “latest usable official” to:

- any eligible assessment,
- latest raw history,
- manual extra,
- quick recheck,
- synthetic baseline created from untyped history.

When no usable official result exists:

- return null,
- keep the user in the appropriate baseline/re-test recovery flow,
- do not invent one.

### 15. Progress isolation

Update official Progress surfaces.

Official Progress must use:

- typed official history,
- usable completed official assessments,
- matching raw Check-Ups.

It must not use:

- latest raw history without type filtering,
- manual extra,
- quick recheck,
- incomplete official attempt,
- invalid official attempt,
- `legacy_unknown`.

Update at minimum:

- latest Check-Up summary.
- domain progress cards.
- baseline/current comparison selection.
- latest official result card.
- any Today/Plan summary using official result.
- block-report endpoint selectors where applicable.

Requirements:

- A manual extra completed after the official re-test does not replace the latest official card.
- A partial official re-test does not replace the latest usable official result.
- An invalid attempt does not replace the latest usable result.
- If only one usable official result exists, do not fabricate a trend.
- Progress selectors fail closed when raw history and assessment metadata cannot be matched.
- Supporting extra history can remain separately accessible.

Do not change meaningful-change thresholds in this task.

### 16. Lifecycle isolation

Remove raw-history eligibility fallbacks from lifecycle decisions.

Lifecycle may use:

- latest usable official assessment,
- latest incomplete official attempt for recovery,
- exact typed official history.

Lifecycle must not use a block-eligible raw score independent of type.

Required behaviour:

- Manual extra does not satisfy baseline.
- Quick recheck does not satisfy baseline.
- Manual extra does not satisfy re-test due state.
- Partial baseline remains baseline incomplete.
- Partial official re-test leaves re-test due.
- Complete valid official baseline can lead to first-block creation.
- Complete valid official re-test can complete the re-test path.
- Older valid official result remains authoritative while a newer incomplete attempt is pending.

### 17. Initial block creation

Trace and update:

- `OnboardingResultsScreen`
- `ResultsScreen`
- `handleStartPlan`
- legacy `buildBlock`
- `createMovementBlockFromAssessment`
- onboarding completion state

Required:

- Only a completed official baseline or confirmed completed baseline retake may create the first block.
- One-domain or two-domain baseline cannot.
- Manual/quick cannot.
- Untyped legacy cannot.
- Direct handler invocation cannot bypass the rule.
- Partial baseline does not mark onboarding complete.
- No legacy block write occurs.
- No MovementBlock write occurs.
- No focus-domain copy is shown.
- Targeted retry remains available.

Valid full baseline behaviour must remain unchanged.

### 18. Official re-test completion

A complete official re-test requires all three headline domains.

For incomplete or invalid official re-test:

- Save the attempt with exact type and status.
- Do not complete or archive the current block.
- Do not generate a block report.
- Do not create a next block.
- Do not replace the latest usable official assessment.
- Do not alter official Progress.
- Offer targeted retry.
- Preserve the existing active block.
- Preserve the previous official result.
- App restart must recover to the pending re-test state.

For a complete official re-test:

- Preserve current valid block completion.
- Preserve report generation.
- Preserve next-block creation.
- Preserve sync.
- Avoid duplicate report/block creation.
- Use only the current complete official re-test, not latest raw history.

### 19. Next-block creation

Harden `handleStartNextBlock` and every equivalent path.

Required source:

- A complete usable official assessment.
- A matching typed raw Check-Up.
- Usually the completed official re-test associated with the current block lifecycle.

Forbidden sources:

- `lastResult` when it is manual/quick/incomplete/untyped.
- latest raw history.
- any eligible non-official assessment.
- an incomplete assessment.
- an invalid attempt.
- a synthetic fallback assessment.
- a stale raw score with no matching official metadata.

If the required official source cannot be resolved:

- fail closed,
- show a recovery action,
- do not generate a block,
- emit safe observability.

Do not silently use an older manual or raw result.

### 20. Result-screen authority

Pass explicit Check-Up type and assessment evidence state to result screens.

Do not let the screen infer authority solely from the raw score.

Screen states:

#### Complete official baseline

- Full result.
- Existing plan CTA.
- Existing block-focus copy, subject to later tie/norm work.

#### Incomplete official baseline

- Measured domain cards.
- Missing domain indicators.
- No weakest-domain statement.
- No block CTA.
- Retry missing measurements CTA.

#### Complete official re-test

- Full result.
- Existing valid re-test continuation.

#### Incomplete official re-test

- Measured domain cards.
- No progress/report conclusion.
- No next-block CTA.
- Retry missing measurements CTA.

#### Complete manual/quick

- Results visible.
- Clearly labelled “Extra Check-Up” or equivalent.
- No official Progress claim.
- No block CTA.

#### Incomplete manual/quick

- Measured domains visible.
- Labelled extra/incomplete.
- Retry optional.
- User may finish without affecting official state.

Do not redesign the visual system.

## Working-tree safety

Before editing:

1. Run:

   `git status --short --untracked-files=all`

   `git diff --name-only`

   `git diff --stat`

2. Record the complete initial state.

3. Inspect current diffs in every file this task may touch.

4. Treat all existing modifications and untracked files as user-owned.

5. Do not revert, overwrite, reformat, move, or delete unrelated work.

6. Do not modify previous audit/remediation reports.

7. Do not use destructive Git commands.

8. Do not install dependencies.

9. Do not stage, commit, create a branch, or push.

10. If unrelated files change during the task:
    - record the change,
    - do not overwrite it,
    - continue only if task-owned files remain safe,
    - otherwise stop code mutation and report the conflict.

## Step 1: Re-verify the current architecture

Before changing code, trace at minimum:

- `App.tsx`
- `src/haleFlow/assessments.ts`
- `src/haleFlow/assessmentEligibility.ts`
- `src/haleFlow/assessmentResultState.ts`
- `src/haleFlow/progressViewModel.ts`
- `src/haleFlow/appLifecycle.ts`
- `src/haleFlow/manualCheckup.ts`
- `src/haleFlow/reports.ts`
- `src/adherence/blockService.ts`
- `src/adherence/types.ts`
- `src/history/store.ts`
- `src/history/serialize.ts`
- `src/history/types.ts`, if present
- `src/history/trends.ts`
- `src/checkup/checkup.ts`
- `src/screens/CheckUpScreen.tsx`
- `src/screens/ResultsScreen.tsx`
- `src/screens/OnboardingResultsScreen.tsx`
- `src/screens/ProgressScreen.tsx`
- `src/services/backend/checkupSyncService.ts`
- `src/services/backend/restoreService.ts`
- Relevant tests.

Establish:

- Current `MovementAssessment.status` union.
- Current confidence derivation.
- Current source Check-Up identifier.
- Current `StoredCheckUp` shape.
- Current history file format and schema version.
- Current save/load signatures.
- Current Check-Up type union.
- Current assessment type field.
- Current remote enum values.
- Current exact type metadata in remote JSON.
- Current latest/history selectors.
- Current baseline-retake confirmation path.
- Current partial result flow.
- Whether `CheckUpScreen` already accepts a custom battery.
- Whether the orchestrator supports battery subsets.
- Whether retry merge helpers already exist.
- Whether result screens know the pending Check-Up type.
- Every caller of `getBlockCreationEligibility`.
- Every caller of `latestOfficialAssessment`.
- Every caller that reads latest raw history for Progress/lifecycle/block creation.

Document deviations from the Stage 3 report before editing.

## Step 2: Implement the headline evidence contract

Add the pure headline-domain helper.

Test it directly for:

- zero domains.
- strength only.
- balance only.
- mobility only.
- strength + balance.
- strength + mobility.
- balance + mobility.
- all three.
- malformed measured domain bounds.
- supporting metrics only.
- valid shoulder with missing hinge.
- valid chair reps with missing velocity.
- TUG-only.
- hinge-only.

Requirements:

- Supporting-only evidence never counts as a headline domain.
- All three exactly means complete.
- Output order is stable.
- Input is not mutated.

## Step 3: Update assessment creation and normalization

Update `createMovementAssessment` and relevant restore normalization.

Required outputs:

| Headline domains measured | Confidence | Status |
|---:|---|---|
| 0 | low | invalid |
| 1 | medium | incomplete |
| 2 | medium | incomplete |
| 3 | high | completed |

For incomplete/invalid:

- no authoritative weakest domain.
- not usable official.
- not block eligible.

For complete manual/quick:

- status completed.
- confidence high.
- non-official.
- not block eligible.

Normalize old persisted assessments for decision-making:

- old `completed` + fewer than three headline domains -> incomplete.
- old completed official with malformed/missing evidence -> invalid or incomplete according to validated score.
- old type missing -> legacy unknown/non-official.

Do not rewrite history destructively merely to normalize runtime behaviour.

## Step 4: Harden eligibility and block services

Update eligibility tests that currently assert one-domain eligibility.

The old one-domain expectation must be removed.

Add direct tests:

- Full official baseline -> eligible.
- Full official baseline retake -> eligible only through existing confirmed retake semantics.
- Full official re-test -> eligible.
- One-domain official -> incomplete/ineligible.
- Two-domain official -> incomplete/ineligible.
- Zero-domain official -> invalid/ineligible.
- Full manual -> non-official/ineligible.
- Full quick recheck -> non-official/ineligible.
- Full legacy unknown -> ineligible.
- Score/assessment mismatch -> ineligible.
- Direct block-service call cannot bypass.

Verify both legacy and adherence block writes remain absent for ineligible cases.

## Step 5: Add typed local history

Update local serialization and history-store APIs.

Required tests:

- Every exact new Check-Up type round-trips locally.
- Type remains associated with the correct raw Check-Up.
- Type/assessment mismatch fails closed.
- Old untyped record with unique matching assessment recovers its exact type.
- Old untyped unmatched record becomes legacy unknown.
- Old untyped record is never guessed official by position.
- Manual remains manual after reload.
- Official re-test remains official re-test after reload.
- Baseline retake remains baseline retake.
- Quick recheck remains quick recheck.
- New serializer remains backward compatible.
- Stage 3A malformed-result handling remains intact.

Do not add raw frames or sensitive data.

## Step 6: Replace raw-history authority paths

Update all official consumers to use typed official selectors.

At minimum prove:

- `getLatestCheckUpSummary` ignores newer manual extra.
- `getDomainProgressCards` ignores manual/quick/incomplete/invalid.
- Lifecycle ignores manual and quick.
- `latestAssessment` no longer falls back to any eligible assessment or synthetic untyped raw baseline.
- Next-block creation ignores `lastResult` if it is not the matching complete official result.
- Results/trends preserve extra records separately.
- A newer incomplete official attempt does not hide the older usable official result.
- A completed baseline and later manual extra leave official Progress unchanged.

## Step 7: Implement targeted retry helpers

Add pure tests for:

- Missing strength -> chair battery.
- Missing balance -> balance battery.
- Missing mobility -> shoulder battery.
- Missing strength + mobility -> chair then shoulder.
- All missing -> chair, balance, shoulder.
- No missing -> no retry battery.
- Hinge missing alone -> no retry required.
- TUG never included.
- Default full battery remains chair, balance, shoulder, hinge.

Add retry merge tests:

- Preserve valid base balance/mobility while replacing chair.
- Preserve valid base strength/mobility while replacing balance.
- Preserve valid base strength/balance while replacing shoulder.
- Failed retry remains incomplete.
- Successful retry becomes complete.
- No duplicate movement IDs.
- Repeated retry is deterministic.
- Retry order does not alter merged score.
- Base attempt is not mutated.
- Merged attempt uses exact original Check-Up type.
- Merged attempt has a distinct persistence identity.
- Stage 3A validator accepts valid merged output.
- Malformed retry evidence fails closed.

## Step 8: Wire partial baseline recovery

Test the complete pathway:

```text
partial baseline
-> typed save
-> incomplete assessment
-> result screen
-> no plan CTA
-> retry missing domains
-> merged complete baseline
-> completed assessment
-> eligible block
```

Also test:

- User exits after partial baseline.
- App restarts.
- Onboarding still requires baseline completion.
- Retry only missing headline domains is offered.
- Manual extra cannot satisfy the missing baseline.
- Quick recheck cannot satisfy the missing baseline.
- Full valid baseline path remains unchanged.

## Step 9: Wire partial official re-test recovery

Test:

```text
active block
-> partial official re-test
-> exact typed save
-> incomplete assessment
-> no block completion
-> no report
-> no next block
-> retry missing domain
-> merged complete official re-test
-> existing valid completion/report/next-block path
```

Also prove:

- Current block remains active after partial attempt.
- Previous usable official result remains latest official Progress result.
- Partial attempt remains available for retry.
- Restart preserves pending re-test recovery.
- A manual extra completed after the partial re-test cannot complete the re-test.
- Invalid retry does not erase previous valid domains.
- Completion/report/next block fire once after the final complete result.

Do not overhaul transaction semantics beyond this scope.

## Step 10: Isolate manual and quick Check-Ups

Test:

- Full manual extra does not become latest official.
- Full manual extra does not affect latest official summary.
- Full manual extra does not affect progress cards.
- Full manual extra does not affect lifecycle.
- Full manual extra cannot create first block.
- Full manual extra cannot create next block.
- Full manual extra cannot generate report.
- Full manual extra remains viewable.
- Partial manual remains viewable/incomplete.
- Full quick recheck follows the same non-official isolation.
- Extra history ordering is deterministic.
- Extra history does not create official trend arrows.
- Immediate result screen has no plan CTA.

## Step 11: Preserve exact backend type

Add table-driven mapping and restore tests for every canonical type.

Verify:

- Exact type is present in sanitized remote metadata.
- Remote enum limitations do not destroy exact type.
- Restore prefers exact canonical metadata.
- Unknown remote enum without exact metadata restores as legacy unknown.
- Unknown does not default to manual extra.
- Officialness is restored correctly.
- Partial/completed status is recomputed or normalized from validated evidence.
- Manual remains non-official.
- Baseline retake remains official.
- Quick recheck remains non-official.
- No raw frames, landmarks, video, or sensitive profile data are added.

## Step 12: Align UI and voice-independent flows

No camera or voice changes are expected except custom retry battery wiring.

Screen/view-model tests should prove:

### Partial official result

- Shows measured count.
- Shows measured cards.
- Shows pending domains.
- No weakest-domain copy.
- No plan CTA.
- Retry CTA present.

### Complete official result

- Existing full flow remains.

### Manual/quick result

- Clearly labelled extra/non-official.
- No plan CTA.
- No official trend claim.
- Finish/back action remains.

### Retry completion

- Result screen receives merged typed result.
- It does not accidentally display only the retry subset.
- Previously measured domains remain visible.

## Step 13: Add safe observability

At defended orchestration boundaries, record safe structured diagnostics for:

- incomplete official plan attempt,
- non-official block attempt,
- type mismatch,
- missing raw/assessment association,
- legacy unknown being rejected,
- incomplete official re-test blocked.

Include only:

- stable reason code,
- Check-Up type,
- measured-domain count,
- missing-domain names,
- source identifier where already safe.

Exclude:

- raw pose data,
- landmarks,
- video,
- raw movement values,
- free-form profile data,
- auth data.

Expected incomplete results are recoverable product states, not fatal exceptions.

Keep pure evidence/selectors side-effect free.

## Required automated test matrix

### A. Evidence/status matrix

Cover:

- 0 headline domains.
- Every 1-domain combination.
- Every 2-domain combination.
- All 3 domains.
- Supporting details missing.
- Supporting details present without headline domain.
- Stage 3A malformed domain plus two valid domains.

Assert status, confidence, measured/missing domains, weakest-domain authority, official usability, and eligibility.

### B. Officialness matrix

For every Check-Up type, test:

- invalid evidence.
- incomplete evidence.
- complete evidence.

Assert:

- type preserved,
- official flag,
- status,
- latest-official eligibility,
- block eligibility,
- Progress eligibility,
- report eligibility.

### C. First-block matrix

Cover:

- complete baseline.
- incomplete baseline.
- invalid baseline.
- complete baseline retake.
- incomplete baseline retake.
- full manual.
- full quick recheck.
- legacy unknown.

### D. Re-test matrix

Cover:

- complete official re-test.
- one-domain official re-test.
- two-domain official re-test.
- invalid official re-test.
- retry completes missing domain.
- retry remains incomplete.
- manual completed after partial official re-test.

### E. Progress isolation

Cover chronological sequences:

1. Baseline only.
2. Baseline -> manual extra.
3. Baseline -> quick recheck.
4. Baseline -> incomplete official re-test.
5. Baseline -> complete official re-test.
6. Baseline -> complete re-test -> later manual extra.
7. Baseline -> invalid attempt -> complete re-test.
8. Legacy unknown mixed with official history.

Assert latest summary, trend pair, domain cards, pending action, and extra-history selector.

### F. Next-block contamination

Cover:

- `lastResult` manual but complete official re-test exists.
- latest raw history manual.
- latest raw history quick.
- latest raw history incomplete official.
- complete official assessment missing matching raw record.
- complete official re-test with matching typed raw record.

Only the final valid official matched case may create the next block.

### G. Typed-history persistence

Round-trip every type.

Cover:

- old untyped with unique assessment match.
- old untyped with no match.
- conflicting history/assessment type.
- duplicate source association.
- remote unknown with exact JSON type.
- remote unknown without exact JSON type.

### H. Targeted retry

Cover battery derivation, merge, persistence identity, repeated retry, failed retry, complete retry, restart recovery, and no duplicate items.

### I. Regression

Prove:

- Fully valid baseline score unchanged.
- Fully valid baseline block unchanged.
- Fully valid official re-test report/next block unchanged.
- Stage 3A malformed inputs still fail closed.
- Stage 2A ROM fallback remains unmeasured.
- TUG remains excluded from `DEFAULT_BATTERY`.
- Hinge remains supporting-only.
- Norm tables unchanged.
- Tie behaviour for complete results unchanged.
- No meaningful-change logic introduced.

## Test-quality requirements

Tests must:

- Exercise production evidence helpers.
- Exercise production eligibility.
- Exercise real typed-history serializers.
- Exercise real Progress/lifecycle selectors.
- Exercise real backend mappers.
- Assert observable mutations or non-mutations.
- Fail if one-domain eligibility returns.
- Fail if manual history enters official Progress.
- Fail if manual history seeds next block.
- Fail if a partial re-test completes a block.
- Fail if exact type is lost.
- Fail if legacy unknown becomes official.
- Fail if targeted retry produces duplicates.
- Preserve Stage 3A adversarial coverage.

Tests must not:

- Assert only that a helper was called.
- Mock officialness at every layer.
- Infer type from array position.
- Update snapshots merely to force a pass.
- Add scoring/norm versions.
- change norms.
- change tie policy.
- change meaningful-change policy.
- change workout generation.
- depend on network access.
- depend on wall-clock sleeps.

Use deterministic timestamps and IDs.

## Validation commands

Run targeted suites for:

- assessment evidence.
- assessments.
- assessment eligibility.
- assessment result state.
- local history serialization/store.
- Progress view models.
- lifecycle.
- baseline/onboarding.
- official re-test guards.
- block service.
- reports.
- check-up sync mapping.
- restore mapping.
- result screens.
- targeted retry/merge.
- Stage 3A scoring integration.

Then run:

```bash
npm test -- --runInBand
npm run typecheck
npx --no-install expo config --type public
git diff --check
```

Do not install packages.

Record:

- Exact commands.
- Exit codes.
- Targeted suite count.
- Targeted test count.
- Full suite count.
- Full test count.
- Snapshot count.
- Skipped tests.
- Watchman warning status.
- Jest open-handle warning status.
- Sentry Expo warning status.
- Any new warning.
- Any files unexpectedly changed by validation.

Stage 3A ended with:

- 81 suites passed.
- 534 tests passed.
- Typecheck passed.
- Expo config passed with existing Sentry warning.
- `git diff --check` passed.

Verify the current baseline rather than assuming it is unchanged.

## Manual source verification after tests

Retrace these production paths.

### Partial baseline

```text
Check-Up complete
-> Stage 3A scoring
-> headline evidence
-> incomplete assessment
-> typed history save
-> results
-> retry missing domain
```

Confirm no plan or onboarding-complete mutation occurs.

### Completed baseline after retry

```text
partial base
-> targeted retry
-> merged full Check-Up
-> completed official assessment
-> eligibility
-> block creation
```

Confirm valid behaviour is unchanged.

### Partial official re-test

```text
partial re-test
-> typed history
-> incomplete assessment
-> no block completion
-> no report
-> no next block
-> pending retry
```

### Manual extra

```text
manual completion
-> typed history
-> non-official assessment
-> immediate result
-> extra history
```

Confirm official Progress, lifecycle, and block state remain unchanged.

### Next block

```text
next-block action
-> latest usable official assessment
-> matching typed raw Check-Up
-> eligibility
```

Confirm no raw/manual fallback remains.

### Restore

```text
remote row
-> exact type metadata
-> typed local history
-> normalized assessment
-> selectors
```

Confirm exact officialness survives.

## Remediation report

Create exactly one new report:

`docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3B.md`

Do not edit previous reports.

The report must include:

1. Scope.
2. Initial Git status.
3. Findings addressed:
   - F3-001.
   - F3-002.
   - F3-009.
4. Approved product rules implemented.
5. Headline-domain evidence contract.
6. Assessment status/confidence contract.
7. Officialness contract.
8. Block-eligibility contract.
9. Typed-history architecture.
10. Legacy-history migration behaviour.
11. Exact backend-type preservation.
12. Official selector architecture.
13. Progress isolation.
14. Lifecycle isolation.
15. Manual/quick isolation.
16. Partial-result UX.
17. Targeted retry battery.
18. Retry merge semantics.
19. Baseline recovery.
20. Official re-test recovery.
21. Next-block source hardening.
22. Files changed.
23. Tests added/changed.
24. Exact validation results.
25. Stage 3A regression verification.
26. Stage 1A and Stage 2A compatibility.
27. Remaining Stage 3 blockers.
28. F3-001 status.
29. F3-002 status.
30. F3-009 status.
31. Initial and final Git status.
32. Concurrent external changes.
33. Confirmation that no commit/staging/branch/push occurred.

## Required invariant outcomes

After Stage 3B:

1. Zero headline domains -> invalid.
2. One headline domain -> incomplete.
3. Two headline domains -> incomplete.
4. Three headline domains -> completed.
5. High confidence requires three headline domains.
6. Incomplete assessment has no authoritative weakest domain.
7. Only official completed three-domain assessments are usable official results.
8. One-domain Check-Up cannot create a block.
9. Two-domain Check-Up cannot create a block.
10. Full manual cannot create a block.
11. Full quick recheck cannot create a block.
12. Partial baseline cannot complete onboarding.
13. Partial official re-test cannot complete a block.
14. Partial official re-test cannot create a report.
15. Partial official re-test cannot create a next block.
16. Manual/quick cannot affect official Progress.
17. Manual/quick cannot affect lifecycle.
18. Manual/quick cannot seed next block.
19. Exact Check-Up type survives new local round-trip.
20. Exact Check-Up type survives backend metadata round-trip.
21. Untyped unresolved legacy records remain non-official.
22. Latest usable official never falls back to raw/manual history.
23. Newer incomplete attempt does not hide older usable official result.
24. Official Progress compares only usable official results.
25. Supporting metrics do not block completeness.
26. Hinge is not required for mobility completeness.
27. Targeted retry includes only missing headline movements.
28. Retry merge creates no duplicate known movements.
29. Retry preserves prior valid domains.
30. Successful retry can create a complete official result.
31. Failed retry remains incomplete.
32. Valid full baseline behaviour is unchanged.
33. Valid full official re-test behaviour is unchanged.
34. Stage 3A malformed evidence still fails closed.
35. Stage 2A ROM fallback remains unmeasured.
36. Norms remain unchanged.
37. Scoring/norm versioning remains unchanged.
38. Complete-result tie behaviour remains unchanged.
39. Meaningful-change behaviour remains unchanged.
40. No unrelated product logic changes.

## Acceptance criteria

Do not mark Stage 3B complete unless all are true:

1. One authoritative headline-evidence helper exists.

2. Assessment status explicitly distinguishes incomplete from completed.

3. Completed requires all three headline domains.

4. Automatic block eligibility requires complete official evidence.

5. Direct block-service calls cannot bypass officialness.

6. Partial official results remain displayable but block-ineligible.

7. Partial baseline does not complete onboarding.

8. Partial official re-test does not mutate block/report/next-block state.

9. Manual and quick Check-Ups are isolated from official Progress and plans.

10. Raw history has exact canonical Check-Up type for new records.

11. Legacy untyped history fails closed when exact type cannot be recovered.

12. Backend round-trip preserves exact canonical type through metadata.

13. Latest official selectors do not use untyped/raw/manual fallbacks.

14. Next-block creation requires a matching complete official source.

15. Targeted retry safely handles missing headline domains.

16. Retry merge preserves prior valid evidence and avoids duplicates.

17. Full valid baseline remains unchanged.

18. Full valid official re-test remains unchanged.

19. Stage 3A validation remains intact.

20. Targeted tests pass.

21. Full suite passes.

22. Typecheck passes.

23. Expo config passes.

24. `git diff --check` passes.

25. No new warning is introduced without explanation.

26. No unrelated user work is reverted or overwritten.

27. No commit, staging, branch, or push occurs.

## Stage decision

At the end of the report, state exactly one:

- `STAGE 3B COMPLETE`
- `STAGE 3B BLOCKED`

Use `STAGE 3B COMPLETE` only if:

- F3-001 is closed.
- F3-002 is closed.
- F3-009 is closed or exact-type metadata preservation fully prevents semantic loss.
- Full validation passes.
- Valid full official flows remain unchanged.

Also state:

- `STAGE 3C REQUIRED`
- `STAGE 4 REMAINS BLOCKED`
- `STAGE 5 INPUTS REMAIN BLOCKED`

Stage 3C will address scoring/norm versioning and historical score preservation.

Stage 4 and Stage 5 remain blocked because versioning, norm/claim review, tie semantics, and meaningful-change policy are not complete.

## Final Codex response

Return a concise summary containing:

- Remediation report path.
- Whether production code changed.
- Final headline-evidence rule.
- Final assessment status/confidence mapping.
- Final automatic block-eligibility rule.
- Manual/quick isolation rule.
- Typed-history architecture.
- Legacy untyped-history behaviour.
- Backend exact-type preservation approach.
- Targeted retry architecture.
- Retry merge behaviour.
- Files changed.
- Tests added and changed.
- Targeted validation result.
- Full-suite validation result.
- Typecheck/config/diff results.
- Confirmation that one-domain and two-domain results cannot create blocks.
- Confirmation that partial official re-tests cannot close blocks or generate reports/next blocks.
- Confirmation that manual/quick Check-Ups cannot affect official Progress or block creation.
- Confirmation that exact Check-Up type survives local and backend round trips.
- Confirmation that valid full official flows remain unchanged.
- Confirmation that Stage 3A hardening remains intact.
- F3-001 status.
- F3-002 status.
- F3-009 status.
- Remaining Stage 3 blockers.
- `STAGE 3B COMPLETE` or `STAGE 3B BLOCKED`.
- `STAGE 3C REQUIRED`.
- `STAGE 4 REMAINS BLOCKED`.
- `STAGE 5 INPUTS REMAIN BLOCKED`.
- Initial and final Git status.
- Any concurrent external changes.
- Confirmation that no commit, staging, branch, or push occurred.
