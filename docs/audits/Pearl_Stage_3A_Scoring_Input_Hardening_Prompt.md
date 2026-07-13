You are implementing Stage 3A of Pearl’s production-readiness work:

SCORING-INPUT VALIDATION, MALFORMED-DATA HARDENING, AND SAFE FAILURE

This is a narrowly scoped production-code remediation task.

Do not begin Stage 3B, Stage 3C, Stage 3D, Stage 4, or Stage 5 in this task.

## Required prior reading

Read these documents in full before making changes:

- docs/audits/PEARL_LOGIC_AUDIT_STAGE_0.md
- docs/audits/PEARL_LOGIC_AUDIT_STAGE_1.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_1A.md
- docs/audits/PEARL_LOGIC_AUDIT_STAGE_2.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_2A.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_2A_1.md
- docs/audits/PEARL_LOGIC_AUDIT_STAGE_3.md

The current working tree is the source of truth. Re-verify all paths before editing because report line numbers may no longer be exact.

## Stage 3 decisions already approved by the product owner

The following are now approved Pearl product rules:

1. Official results and automatic plan creation will ultimately require all three headline domains:
   - strength,
   - balance,
   - mobility.

2. Partial results may remain visible but must be marked incomplete and must not automatically create a plan.

3. Manual extra Check-Ups must remain separate from official progress, reports, and automatic plan creation.

4. Malformed, duplicated, missing, non-finite, or structurally impossible movement measurements must fail closed:
   - no coercion,
   - no invented value,
   - no flattering clamp,
   - no crash,
   - no corrupted official score.

5. Other valid domains must be preserved when one domain is malformed.

6. Official scoring and norm versions will be pinned in a later remediation.

7. Supporting metrics currently remain supporting metrics:
   - chair rise velocity,
   - earlier balance stages,
   - balance sway,
   - TUG,
   - hinge reach.

8. Exact weakest-domain ties will not silently default to strength, but tie handling belongs to a later remediation.

9. Improvement/decline claims will remain neutral until meaningful-change thresholds are validated.

10. Movement-age outputs remain provisional until norm provenance is approved.

11. Check-Up types must eventually remain exact through local persistence, backend sync, and restore.

This Stage 3A task implements only rule 4 and the immediately necessary defensive parts of rule 5.

Do not implement the other approved policies yet.

## Confirmed findings being addressed

Stage 3 confirmed:

### F3-003 — P1: malformed chair-stand data can score or crash

Current confirmed behaviours include:

- Missing chair-stand `reps` can produce a young-looking strength age.
- String `"14"` can be coerced and scored as 14 repetitions.
- Missing `result.flags` can throw:
  `TypeError: Cannot read properties of undefined (reading 'includes')`
- A malformed strength-only result can become completed and block-eligible under the current Stage 3B-unresolved evidence policy.

### F3-010 — P2: duplicate movement items are not rejected

Current lookup behaviour uses the first matching movement result.

Therefore:

- Result order can determine which duplicate is trusted.
- One valid and one invalid duplicate can produce different outcomes depending on order.
- A stale duplicate can silently replace newer evidence.
- Duplicate movement IDs are currently not treated as an integrity failure.

### F3-011 — P2: structurally impossible finite values can score

Confirmed examples include:

- Negative single-leg balance seconds being scored as measured.
- `999` seconds of single-leg balance receiving a young balance estimate.
- Negative shoulder-flexion ROM being scored as measured.
- `999` degrees of shoulder flexion receiving a young mobility estimate.

Stage 3 also found no tests for:

- Missing chair reps.
- String chair reps.
- Missing flags.
- Duplicate movement items.
- Implausible negative/extreme values.

## Primary objective

Create one authoritative, reusable scoring-input validation boundary so that malformed or impossible runtime data cannot:

- Crash `scoreCheckUp`.
- Become a measured domain.
- Produce an age band.
- Produce a domain interpretation based on invalid evidence.
- Become the weakest domain.
- Become a plan focus.
- Appear as a valid user-facing result row.
- Become valid after JSON serialization or backend restoration.
- Be silently selected from duplicate movement entries.

Valid production-generated Check-Ups must continue to produce exactly the same scores, rows, weakest domain, and Stage 1A eligibility as before this patch.

## Scope boundary

This task may change:

- Scoring-input validation.
- Movement-result shape guards.
- Duplicate movement detection.
- Protocol-derived plausibility checks.
- Scoring tests.
- Narrow scoring-related history/backend integration tests.
- Safe malformed-input observability where it fits existing architecture.
- The Stage 3A remediation report.

This task must not change:

- The all-three-domain officialness rule; that belongs to Stage 3B.
- Current assessment confidence rules.
- Current assessment status rules.
- Current one-domain or two-domain eligibility behaviour for otherwise valid data.
- Manual-extra Check-Up authority.
- Progress selectors.
- Latest official selectors.
- Block-report logic.
- Check-Up-type persistence.
- Scoring or norm versioning.
- Norm tables.
- Norm breakpoints.
- Movement-age formulas.
- Movement-age copy.
- Weakest-domain tie handling.
- Meaningful-change thresholds.
- Domain composition.
- Which metric drives each domain age.
- Chair-stand measurement logic.
- Balance measurement logic.
- Shoulder measurement logic.
- Hinge measurement logic.
- Camera readiness.
- Workout generation.
- Exercise catalogue.
- Session completion logic.
- Account isolation.
- Visual redesign.
- TUG release status.

Do not perform opportunistic refactors.

## Locked Stage 3A product rules

### 1. Fail closed; never coerce

Do not use:

- `Number(value)`
- `parseInt`
- `parseFloat`
- unary `+`
- loose numeric comparison on unknown runtime values
- truthiness as proof of a valid number

A metric is numeric only when:

```ts
typeof value === 'number' && Number.isFinite(value)
```

Movement-specific rules may additionally require:

- integer values,
- positive values,
- protocol-derived ranges.

Strings such as `"14"` must not score as 14.

### 2. Invalidity is movement-local

When one movement result is malformed:

- The affected movement is unusable.
- The domain that depends on that movement may become unmeasured.
- Other valid movements and domains remain available.
- The entire Check-Up must not crash.
- The scorer must not silently replace the malformed value with zero, a norm boundary, or a fallback.

Examples:

- Malformed chair stand + valid balance + valid shoulder:
  - strength unmeasured,
  - balance preserved,
  - mobility preserved.

- Valid chair stand + malformed TUG:
  - strength preserved,
  - TUG supporting row omitted,
  - balance still depends only on valid balance-ladder evidence.

### 3. Duplicate known movement IDs invalidate that movement

If `CheckUp.items` contains more than one item for the same known movement ID:

- Do not trust the first.
- Do not trust the last.
- Do not merge them.
- Do not select the measured item over the skipped item.
- Mark that movement’s scoring input unusable.
- Emit one safe diagnostic issue for that movement.
- Preserve unrelated movements.

This applies even when:

- One item is measured and one is skipped.
- Both are measured.
- One is malformed.
- Both contain identical data.

Examples:

- Duplicate chair stand -> strength input unusable.
- Duplicate balance ladder -> balance input unusable.
- Duplicate shoulder -> mobility headline input unusable.
- Duplicate hinge -> hinge supporting row omitted, but valid shoulder may still measure mobility.
- Duplicate TUG -> TUG supporting row omitted, but valid balance ladder may still measure balance.

Unknown movement IDs may be ignored safely, but must never alter production domains.

### 4. Missing flags do not default to an empty list

`result.flags` is part of the scoring validity contract.

For a movement result considered measured:

- `flags` must exist.
- `flags` must be an array.
- Every member must be a string.

If flags are missing or malformed:

- The movement result is unusable.
- Do not assume `[]`.
- Do not throw.
- Do not score.

A valid empty string array remains acceptable.

### 5. Status and result must agree

Only a correctly shaped item with the canonical measured status may contribute.

Rules:

- `skipped` item -> never scores, even if a result object exists.
- `unmeasured` or equivalent item -> never scores.
- Measured status with missing result -> unusable.
- Measured status with malformed result -> unusable.
- Measured status with `no-measurement` flag -> unmeasured.
- Non-measured status with a finite result -> ignore the result.
- Unknown status -> unusable.
- Conflicting fields fail closed.

Do not repair contradictory state by guessing intent.

### 6. Reject invalid values; do not clamp malformed evidence

Norm lookup may continue to clamp a legitimate valid metric according to current norm behaviour.

However, structurally invalid or protocol-impossible input must be rejected before norm lookup.

Examples:

- `999` balance seconds is invalid input, not an excellent result.
- `999` shoulder degrees is invalid input, not an excellent result.
- `-5` balance seconds is invalid input, not an old-age estimate.
- Missing chair reps is invalid input, not zero or a young result.

### 7. Use only defensible plausibility bounds

Do not invent clinical thresholds.

Use only constraints that are directly supported by one of:

- Type semantics.
- Mathematical output range.
- Existing production movement definition.
- Existing hard assessment cap.
- Existing official valid-position contract.
- Existing configured capture duration.
- Existing explicit rep cap.

Where possible, share or import authoritative constants rather than copying numeric thresholds into a second file.

If sharing a constant would introduce a circular dependency, create the smallest neutral pure contract module used by both scorer and movement implementation.

Do not change the values.

### 8. Supporting metrics cannot invalidate valid primary evidence unless the whole result envelope is malformed

Examples:

- Valid chair reps + invalid/non-finite rise velocity:
  - strength may still score from reps,
  - rise-velocity row is omitted.

- Valid shoulder + invalid hinge:
  - mobility may still score from shoulder,
  - hinge supporting row is omitted.

- Valid balance ladder + invalid TUG:
  - balance may still score from the ladder,
  - TUG supporting row is omitted.

However:

- Missing/malformed `flags` on the movement result makes that movement result unusable because its no-measurement state cannot be trusted.

### 9. Scoring remains pure and deterministic

Validation and scoring must:

- Not mutate the Check-Up.
- Not mutate item results.
- Not depend on current date.
- Not depend on object insertion order.
- Not depend on duplicate ordering.
- Produce the same output for equal inputs.
- Never throw for ordinary malformed persisted/restored data.

### 10. Diagnostics are safe and structured

Create stable, non-sensitive diagnostic reason codes.

Suitable conceptual reasons include:

- `invalid_checkup_items`
- `invalid_item_shape`
- `duplicate_movement`
- `unknown_item_status`
- `missing_result`
- `invalid_result_shape`
- `missing_flags`
- `invalid_flags`
- `no_measurement`
- `invalid_metric_type`
- `non_finite_metric`
- `out_of_protocol_range`
- `non_integer_rep_count`
- `conflicting_result_state`

Adapt names to the existing code.

Diagnostics must not include:

- Raw landmarks.
- Pose frames.
- Video.
- Images.
- Free-form safety/profile text.
- Auth tokens.
- Full raw payload dumps.

Prefer a pure validation result that contains issue codes.

Use existing observability infrastructure at an appropriate high-trust boundary where practical.

Do not make the core pure scorer noisy or side-effectful solely to log warnings.

If clean production observability would require a broad architectural refactor:

- expose structured issues from the validation layer,
- preserve pure scoring,
- document the remaining observability integration point,
- do not add unrelated architecture.

## Working-tree safety

Before editing:

1. Run:

   `git status --short --untracked-files=all`

   `git diff --name-only`

   `git diff --stat`

2. Record the complete initial status.

3. Inspect diffs in every file this task may touch.

4. Treat every existing modification and untracked file as user-owned.

5. Do not revert, overwrite, reformat, move, or delete unrelated work.

6. Do not modify previous audit/remediation reports.

7. Do not use destructive Git commands.

8. Do not install dependencies.

9. Do not stage, commit, create a branch, or push.

10. If unrelated files change during the task:
    - record them,
    - do not overwrite them,
    - continue only where task-owned files remain safe,
    - otherwise stop code mutation and report the conflict.

## Step 1: Re-verify the current runtime paths

Trace the current code before editing.

At minimum inspect:

- `src/scoring/scoring.ts`
- `src/scoring/norms.ts`
- `src/scoring/__tests__/scoring.test.ts`
- `src/checkup/types.ts`
- Movement result types for:
  - chair stand,
  - balance ladder,
  - shoulder flexion,
  - hinge reach,
  - TUG.
- `src/pearlFlow/assessments.ts`
- `src/pearlFlow/assessmentEligibility.ts`
- `src/adherence/blockService.ts`
- `src/history/serialize.ts`
- `src/history/store.ts`
- `src/services/backend/checkupSyncService.ts`
- `src/services/backend/restoreService.ts`
- Relevant tests.

Trace:

```text
raw CheckUp
-> item lookup
-> usable-result check
-> movement-specific cast/access
-> norm lookup
-> DomainResult
-> weakest-domain selection
-> MovementAssessment
-> Stage 1A eligibility
-> block service
```

Also trace:

```text
local JSON / backend raw_checkup_json
-> deserialize/restore
-> scoreCheckUp
-> derived score / assessment
```

Before changing anything, establish:

- Current `CheckUpItem.status` values.
- Current `MovementResultBase` fields.
- Whether `flags` is typed as required.
- Whether runtime deserializers enforce it.
- Current movement IDs.
- Current item lookup helper.
- Current duplicate behaviour.
- Current chair rep cap.
- Current balance single-leg maximum opportunity.
- Current shoulder mathematical and valid-position ranges.
- Current TUG duration contract.
- Current supporting-metric display behaviour.
- Whether scoring helpers are exported and callable independently.
- Whether scoring currently has any diagnostics representation.

Document any difference from Stage 3.

## Step 2: Add one authoritative scoring-input validation layer

Create or identify one pure module responsible for validating runtime scoring inputs.

An appropriate location might be:

- `src/scoring/scoringInputValidation.ts`
- `src/scoring/inputValidation.ts`

Choose the architecture that best fits the current repository.

Do not spread separate ad hoc checks throughout each screen and backend service.

A conceptual shape could resemble:

```ts
type ScoringInputIssueCode =
  | 'invalid_checkup_items'
  | 'invalid_item_shape'
  | 'duplicate_movement'
  | 'unknown_item_status'
  | 'missing_result'
  | 'invalid_result_shape'
  | 'missing_flags'
  | 'invalid_flags'
  | 'invalid_metric_type'
  | 'non_finite_metric'
  | 'out_of_protocol_range'
  | 'non_integer_rep_count'
  | 'conflicting_result_state';

type ScoringInputIssue = {
  code: ScoringInputIssueCode;
  movementId?: string;
  field?: string;
};

type ValidatedScoringInputs = {
  byMovement: Partial<Record<MovementId, ValidatedMovementInput>>;
  issues: ScoringInputIssue[];
};
```

Adapt this to the current types.

Requirements:

- Pure.
- Deterministic.
- No mutation.
- No throwing for malformed runtime objects.
- Validates the actual runtime shape instead of relying on TypeScript assertions.
- Detects duplicates before selecting an item.
- Separates:
  - invalid whole Check-Up shape,
  - invalid item shape,
  - invalid movement result,
  - invalid supporting metric.
- Preserves unrelated valid inputs.
- Produces stable issue codes.
- Does not expose sensitive raw data.
- Does not change `scoreCheckUp`’s public output shape unless absolutely necessary.
- Keeps existing call sites source-compatible where practical.

A good architecture may be:

```text
validateCheckUpForScoring(checkUp)
-> validated canonical movement inputs + issues

scoreCheckUp(checkUp)
-> uses only validated canonical inputs
-> returns existing CheckUpScore shape
```

An optional additional exported API may return both score and issues:

```ts
scoreCheckUpWithDiagnostics(checkUp)
-> { score, issues }
```

Keep `scoreCheckUp(checkUp)` as a compatibility wrapper if useful.

Do not make every caller handle diagnostics before scoring can work safely.

## Step 3: Replace first-match lookup with duplicate-safe indexing

Do not use `Array.find` as the authoritative lookup for known movement scoring inputs.

Build a duplicate-aware movement index.

For each known movement ID:

- Zero items -> absent.
- Exactly one item -> validate it.
- More than one item -> duplicate issue; movement unusable.

Required known production/historical movement handling includes:

- chair stand.
- balance ladder.
- shoulder flexion.
- hinge reach.
- TUG historical support.

Unknown movement IDs:

- Must not crash.
- Must not affect strength, balance, or mobility.
- May generate a low-severity diagnostic if the architecture already supports it.
- Must not make the entire Check-Up invalid.

Order invariants:

- Reordering unique items produces the same score.
- Reordering duplicate items produces the same invalid movement outcome.
- Valid item first versus invalid item first makes no difference.

## Step 4: Validate the common item/result envelope

Before accessing movement-specific fields, establish:

1. The item is an object.
2. The movement ID is a string.
3. The item status is a known current status.
4. The status is `measured` before scoring is attempted.
5. The result is a non-null object and not an array.
6. `flags` exists.
7. `flags` is an array.
8. Every flag is a string.
9. `no-measurement` is not present.
10. Any movement ID embedded in the result, if present, agrees with the item.
11. Fields required by the scoring path exist with correct runtime types.

Rules:

- Missing result -> movement unusable.
- Missing flags -> movement unusable.
- `flags: null` -> movement unusable.
- `flags: "none"` -> movement unusable.
- `flags: [1]` -> movement unusable.
- `flags: []` -> valid envelope.
- `no-measurement` -> canonical unmeasured, not an exception.
- Unknown status -> movement unusable.
- Skipped/unmeasured status with a numeric result -> result ignored.
- Do not infer measured status from the presence of numbers.

## Step 5: Harden chair-stand scoring

Chair repetitions are the current headline strength-age input.

A chair-stand result is eligible to drive strength age only when:

- Common envelope is valid.
- `reps` exists.
- `typeof reps === 'number'`.
- `Number.isFinite(reps)`.
- `Number.isInteger(reps)`.
- `reps > 0`.
- `reps` is no greater than the authoritative production chair-stand rep cap.

Stage 2 identified the current production cap as 64 repetitions. Re-verify the current code.

Do not copy `64` into multiple independent modules if an authoritative constant already exists.

If no reusable constant exists:

- expose or move the existing cap into a small pure shared contract module,
- keep the value unchanged,
- use it in both movement generation/result logic and scoring validation where safe,
- avoid a circular import.

Required outcomes:

- Missing `reps` -> strength unmeasured.
- `reps: undefined` -> strength unmeasured.
- `reps: null` -> strength unmeasured.
- `reps: "14"` -> strength unmeasured.
- `reps: NaN` -> strength unmeasured.
- `reps: Infinity` -> strength unmeasured.
- `reps: -1` -> strength unmeasured.
- `reps: 0` -> strength unmeasured.
- `reps: 1.5` -> strength unmeasured.
- `reps` above the configured cap -> strength unmeasured.
- Valid integer repetitions within the cap -> existing score unchanged.

Do not clamp an excessive rep count to the cap.

Do not turn missing repetitions into zero.

### Rise velocity

Rise velocity remains supporting information only.

For any velocity field shown in result rows:

- Require number type.
- Require finite value.
- Require strictly positive value where velocity semantics require positive upward speed.
- Omit invalid velocity rows.
- Do not invalidate otherwise valid chair repetitions solely because optional velocity is missing or invalid.
- Do not introduce a new arbitrary upper bound without code/domain evidence.
- Do not let a non-finite value reach user-facing rows.

Do not change how valid velocity is calculated or displayed.

### Other chair fields

Inspect other fields accessed by scoring, such as assistance/push-off or interruption flags.

Do not assume a missing nested field is safe.

If a field is optional by the production type:

- handle it as optional.

If scoring requires it to establish validity:

- validate it explicitly.

Do not allow a missing optional supporting field to invalidate valid repetitions unnecessarily.

## Step 6: Harden balance scoring

The current headline balance-age input is `singleLegEyesOpenSec`.

It is eligible only when:

- Common envelope is valid.
- Value is a number.
- Value is finite.
- Value is strictly greater than zero.
- Value does not exceed the maximum opportunity permitted by the production balance-ladder protocol.

Re-verify the configured stage duration and how the result is capped.

Do not invent a clinical maximum.

Use the actual protocol maximum from the balance movement definition.

Required outcomes:

- Missing value -> balance unmeasured.
- String value -> balance unmeasured.
- `NaN`/Infinity -> balance unmeasured.
- Negative value -> balance unmeasured.
- Zero -> balance unmeasured unless the current production result contract explicitly defines zero as completed usable evidence; if so, document and justify before preserving it.
- Above protocol maximum -> balance unmeasured.
- Valid in-range hold -> existing score unchanged.

Do not clamp `999` seconds down to the protocol maximum.

### Supporting balance metrics

For supporting rows such as TUG or other durations:

- Require numeric finite values.
- Require positive values where duration semantics require positive time.
- Apply a maximum only when directly supported by an existing assessment timeout/protocol cap.
- Invalid supporting values are omitted.
- Invalid TUG must not invalidate a valid balance-ladder headline result.
- TUG remains supporting only.
- Do not add TUG to balance age or weakest-domain scoring.

Earlier balance stages and sway remain unchanged.

## Step 7: Harden shoulder-flexion scoring

Shoulder flexion is the current headline mobility-age input.

A shoulder result may drive mobility age only when:

- Common envelope is valid.
- `peakFlexionDeg` or current equivalent exists.
- It is a finite number.
- It lies within the mathematical range of the production angle calculation.
- It is consistent with the existing production valid-position contract.

Stage 2 identified:

- Shoulder angle calculation is degree-based.
- Production valid position currently requires approximately `angle >= 35`.
- Stage 2A requires completed valid capture before a finite official peak is emitted.

Re-verify all current values and constants.

Use shared authoritative constants where practical.

Do not alter the threshold.

Required outcomes:

- Missing shoulder peak -> mobility unmeasured.
- String shoulder peak -> mobility unmeasured.
- `NaN`/Infinity -> mobility unmeasured.
- Negative shoulder angle -> mobility unmeasured.
- Angle above the mathematical maximum -> mobility unmeasured.
- A measured persisted value that violates the production valid-position minimum -> mobility unmeasured.
- Valid official shoulder value -> existing mobility score unchanged.

Do not clamp `999` degrees to the youngest norm anchor.

Do not allow malformed shoulder data to create mobility focus.

## Step 8: Harden hinge-reach supporting data

Hinge reach currently remains a supporting mobility row and does not determine mobility age.

Rules:

- Common envelope must be valid.
- Hinge metric must be numeric and finite before display/use.
- Do not use string coercion.
- Do not let `NaN`/Infinity reach result rows.
- Preserve the existing sign convention only if the algorithm and UI intentionally support negative values.
- Do not reject all negative hinge values merely because they are negative; Stage 2 found that a wrist below the estimated floor can produce a negative value.
- Do not invent a clinical range.
- If a defensible mathematical or protocol-derived range exists in current code, enforce it.
- Otherwise restrict Stage 3A to shape/finite validation and document the remaining plausibility-bound decision.
- Invalid hinge data must not invalidate a valid shoulder headline result.
- Hinge must remain supporting only.

Do not change hinge measurement, scoring role, or copy.

## Step 9: Harden historical TUG supporting data

TUG remains beta-hidden/historical support and does not drive balance age.

For TUG rows:

- Require a valid common result envelope.
- Require a finite numeric duration.
- Require positive duration.
- Apply a maximum only if an authoritative existing TUG assessment timeout or cap exists.
- Omit malformed TUG rows.
- Do not let malformed TUG invalidate valid balance-ladder scoring.
- Do not activate TUG in the production battery.
- Do not make TUG affect weakest-domain selection.

## Step 10: Ensure norm lookup receives only validated inputs

Inspect every call into norm inversion/lookup functions.

Requirements:

- No malformed movement metric reaches norm lookup.
- No string reaches arithmetic.
- No non-finite number reaches norm lookup.
- No protocol-impossible value reaches norm lookup.
- Existing valid norm boundary behaviour remains unchanged.
- Existing clamping of legitimate valid inputs remains unchanged.
- Norm tables and breakpoints remain untouched.

If low-level norm helpers are exported or reused independently:

- add narrow defensive checks where appropriate,
- ensure they fail safely for non-finite runtime values,
- do not change valid outputs.

A malformed metric should produce an unmeasured domain, not an arbitrary norm result.

## Step 11: Sanitize domain output invariants

After scoring:

- `measured: true` must imply finite age bounds.
- `ageLow` must be finite.
- `ageHigh` must be finite.
- `ageLow <= ageHigh`.
- A measured domain may not contain `undefined`, string, `NaN`, or Infinity in its headline fields.
- User-facing rows may not contain invalid numeric values.
- Weakest-domain selection may consider only measured domains with finite valid bounds.
- If a domain result somehow violates these invariants, fail that domain closed before returning the final score.

Do not change the existing interpretation copy for valid data.

Do not add a composite score.

## Step 12: Preserve current Stage 3B-unresolved eligibility semantics

This task must not accidentally implement the all-three-domain policy early.

After Stage 3A:

- A malformed-only Check-Up must produce zero measured domains and remain Stage 1A-ineligible.
- A valid one-domain Check-Up may still follow the current eligibility behaviour until Stage 3B.
- A valid two-domain Check-Up may still follow the current eligibility behaviour until Stage 3B.
- A malformed domain alongside one valid domain must not contaminate the valid domain.
- Do not change confidence/status merely to make Stage 3A tests pass.

Add comments in tests where current one-domain eligibility is intentionally preserved only until Stage 3B.

Do not weaken Stage 1A.

## Step 13: Verify local serialization and backend restore safety

Stage 3A is not a persistence-schema migration.

However, malformed local or remote data must no longer crash or score falsely.

Add narrow integration tests proving:

### Local/JSON cases

- A numeric field serialized as `null` is treated as unmeasured.
- Missing `flags` after deserialization does not crash.
- String numeric fields do not score.
- Duplicate items remain duplicate after round-trip and invalidate the movement.
- Other valid domains survive.

### Backend mapping/sync

- Mapping a malformed raw Check-Up does not crash.
- Derived score omits the malformed domain.
- No invalid numeric value is placed in `derived_scores_json`.
- No raw frames/landmarks are added to diagnostics.

### Restore

- A restored malformed chair result does not become a young strength result.
- Restore/scoring does not throw.
- A malformed-only restored Check-Up cannot become Stage 1A-eligible.
- Valid unrelated restored domains remain intact.

Do not overhaul the restore architecture.

Do not change backend enums in this task.

Do not add scoring/norm versions in this task.

## Step 14: Add safe observability

Inspect Pearl’s existing observability wrapper.

Where a clean high-trust integration point exists, emit one safe structured breadcrumb or diagnostic for malformed scoring input.

Suitable contexts include:

- New Check-Up completion.
- Backend restoration/rescoring.
- Backend mapping of malformed history.

Requirements:

- One aggregate diagnostic per score operation where possible, not one console log per field.
- Include:
  - issue codes,
  - affected movement IDs,
  - issue count,
  - Check-Up type where already known.
- Exclude raw values unless they are non-sensitive bounded metadata and necessary.
- Exclude landmarks, frames, video, profile text, and auth details.
- Do not show technical errors to the user.
- Do not add dependencies.
- Do not make expected `no-measurement` outcomes noisy errors.
- Do not crash if observability is disabled.

Keep the core validator and scorer pure.

If clean observability cannot be added without broad changes:

- expose diagnostics through a pure API,
- use it in the safest existing boundary,
- document remaining uninstrumented paths,
- do not expand scope.

## Required automated tests

Add tests at the authoritative scoring layer and selected integration boundaries.

Do not rely on snapshots alone.

### A. Valid-regression tests

Prove that existing valid fixtures remain exactly unchanged:

1. Fully valid four-item Check-Up:
   - same domain measured states,
   - same age bounds,
   - same detail rows,
   - same weakest domain.

2. Valid chair stand:
   - same strength age.

3. Valid balance ladder:
   - same balance age.

4. Valid shoulder:
   - same mobility age.

5. Valid supporting metrics:
   - same valid rows.

6. TUG remains supporting only.

7. Hinge remains supporting only.

8. TUG remains outside `DEFAULT_BATTERY`.

### B. Whole Check-Up shape tests

Using runtime casts where required, cover:

- Missing `items`.
- `items: null`.
- `items` string.
- `items` object.
- Empty items array.
- Array containing `null`.
- Array containing a primitive.
- Unknown movement item.
- Mixed malformed and valid items.

Required:

- No throw.
- Invalid entries do not score.
- Valid known entries remain usable.
- Output shape remains stable.

### C. Common result-envelope tests

For each relevant movement or a representative table-driven set:

- Missing result.
- `result: null`.
- Result is array.
- Missing flags.
- `flags: null`.
- `flags: "none"`.
- `flags: [1]`.
- `flags: []`.
- `flags: ['no-measurement']`.
- Unknown item status.
- Skipped item with valid-looking result.
- Unmeasured item with valid-looking result.
- Measured item with malformed result.

Required:

- No crash.
- No guessing.
- Affected movement is unusable.
- Other domains are preserved.

### D. Chair-stand tests

Cover:

- Missing reps.
- `undefined` reps.
- `null` reps.
- String `"14"`.
- Boolean reps.
- Object reps.
- `NaN`.
- Infinity.
- `-Infinity`.
- Negative integer.
- Zero.
- Fractional value.
- Exactly minimum valid positive integer.
- Exactly current maximum cap.
- Above cap.
- Valid reps plus missing flags.
- Valid reps plus invalid velocity.
- Valid reps plus non-finite velocity.
- Valid reps plus missing optional velocity.
- Valid reps plus malformed optional supporting field.

Assert:

- No invalid value produces a strength age.
- Valid reps still score.
- Invalid velocity is omitted without erasing valid strength.

### E. Balance tests

Cover:

- Missing single-leg value.
- String.
- `NaN`.
- Infinity.
- Negative.
- Zero.
- Small positive valid value.
- Exactly protocol maximum.
- Above protocol maximum.
- Valid balance plus malformed TUG.
- Valid balance plus negative TUG.
- Valid balance plus non-finite TUG.
- TUG-only malformed result.
- TUG-only valid result remains insufficient for balance age.

Assert:

- `999` cannot produce a young balance age.
- Invalid TUG does not erase valid balance.

### F. Shoulder tests

Cover:

- Missing peak.
- String peak.
- `NaN`.
- Infinity.
- Negative degrees.
- Below production valid-position minimum.
- Exactly valid-position minimum.
- Valid normal value.
- Mathematical maximum.
- Above mathematical maximum.
- `999`.

Assert:

- Invalid values do not measure mobility.
- Valid values preserve exact existing score.
- `999` cannot produce a young mobility age.

### G. Hinge and supporting-row tests

Cover:

- Missing hinge value.
- String.
- `NaN`.
- Infinity.
- Valid current negative value if supported by current contract.
- Normal finite value.
- Implausible extreme only if a defensible range is established.

Assert:

- Invalid hinge row is omitted.
- Valid shoulder still measures mobility.
- Hinge never changes mobility age or weakest domain.

### H. Duplicate movement tests

For each:

- Duplicate chair.
- Duplicate balance.
- Duplicate shoulder.
- Duplicate hinge.
- Duplicate TUG.

Also cover:

- Valid then invalid.
- Invalid then valid.
- Measured then skipped.
- Skipped then measured.
- Two identical valid entries.
- Duplicate order reversed.

Assert:

- Affected movement outcome is invariant to order.
- Affected movement is unusable.
- Other movements remain valid.
- No first/last-item policy survives.

### I. Output-invariant tests

Assert for a broad malformed-input table:

- `scoreCheckUp` never throws.
- Score always contains strength, balance, mobility.
- Measured domains have finite ordered bounds.
- Unmeasured domains do not expose invalid headline numbers.
- No result row contains:
  - `undefined`,
  - string numeric values,
  - `NaN`,
  - Infinity.
- Weakest domain is null when no valid domains exist.
- Malformed input cannot silently default to strength.
- Reordering unique items does not alter score.
- Input objects are not mutated.

### J. Stage 1A integration tests

Cover:

1. Malformed chair-only Check-Up:
   - strength unmeasured,
   - zero measured domains,
   - assessment invalid,
   - Stage 1A ineligible,
   - no strength fallback.

2. Malformed shoulder-only Check-Up:
   - mobility unmeasured,
   - Stage 1A ineligible.

3. Duplicate-only Check-Up:
   - no measured domain,
   - Stage 1A ineligible.

4. Valid balance plus malformed chair:
   - balance preserved,
   - chair excluded,
   - current one-domain policy remains unchanged until Stage 3B.

5. Fully valid Check-Up:
   - Stage 1A eligibility unchanged.

### K. Backend/history integration tests

Cover:

- Malformed local JSON restored into scoring.
- `null` metric after JSON serialization.
- Missing flags in restored result.
- Duplicate restored items.
- Malformed backend raw payload.
- Valid unrelated domain survives.
- Derived remote score contains no invalid values.
- No crash during sync/restore mapping.

## Test-quality requirements

Tests must:

- Exercise real production scoring functions.
- Exercise real norm tables for valid regression cases.
- Use runtime-malformed objects rather than changing TypeScript production types to make invalid shapes legal.
- Assert observable score/domain/row behaviour.
- Assert no mutation.
- Assert order independence.
- Assert integration with Stage 1A.
- Fail if string coercion is reintroduced.
- Fail if missing flags default to `[]`.
- Fail if first-match duplicate handling returns.
- Fail if invalid extremes are clamped into flattering ages.
- Fail if one malformed domain erases unrelated valid domains.

Tests must not:

- Reimplement validation logic line by line.
- Assert only that a helper was called.
- Mock norm tables for valid regression tests.
- Update snapshots merely to force a pass.
- alter approved norms or thresholds.
- implement Stage 3B evidence policy.
- change movement graders to manufacture easier test data.
- depend on network access.
- depend on wall-clock timing.

Use table-driven tests where appropriate.

A deterministic adversarial corpus is encouraged.

Do not add a new fuzzing dependency.

## Validation commands

Run targeted suites for:

- scoring.
- scoring-input validation.
- MovementAssessment creation.
- Stage 1A eligibility.
- block-service eligibility.
- history serialization.
- check-up sync mapping.
- restore mapping.
- relevant result-state helpers.

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
- Whether validation commands changed files unexpectedly.

The Stage 3 baseline was:

- 80 suites passed.
- 515 tests passed.
- Typecheck passed.
- Expo config passed with the existing Sentry warning.
- `git diff --check` passed.

Do not assume the baseline is unchanged; verify it.

## Manual source verification after tests

After validation, manually retrace:

### Malformed chair completion

```text
malformed CheckUp
-> scoring validation
-> chair unusable
-> strength unmeasured
-> MovementAssessment
-> Stage 1A eligibility
-> block service
```

Confirm:

- no crash,
- no young-looking strength age,
- no implicit strength focus,
- no block from malformed-only evidence.

### Mixed valid/malformed Check-Up

```text
valid balance + valid shoulder + malformed chair
-> scorer
```

Confirm:

- strength excluded,
- balance unchanged,
- mobility unchanged,
- no malformed row,
- no mutation.

### Duplicate movement

```text
duplicate known movement
-> duplicate-aware index
-> affected movement unusable
```

Confirm order does not matter.

### Restored malformed history

```text
raw_checkup_json
-> restore
-> scoreCheckUp
-> assessment
```

Confirm:

- no crash,
- malformed domain excluded,
- no invalid numeric values persisted downstream.

### Fully valid Check-Up

Confirm byte-for-byte or deep-equal scoring output where practical.

## Remediation report

Create exactly one new report:

`docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3A.md`

Do not edit previous reports.

The report must contain:

1. Scope.
2. Initial Git status.
3. Findings addressed:
   - F3-003,
   - F3-010,
   - F3-011.
4. Findings explicitly not addressed.
5. Approved product rule implemented.
6. Final scoring-input validation architecture.
7. Common item/result-envelope contract.
8. Duplicate movement policy.
9. Chair-stand validation contract.
10. Balance validation contract.
11. Shoulder validation contract.
12. Hinge/TUG/supporting-metric contract.
13. Protocol-derived plausibility bounds.
14. Bounds deliberately not invented and why.
15. Safe diagnostics/observability.
16. Files changed.
17. Tests added or changed.
18. Exact targeted and full validation results.
19. Valid-score regression verification.
20. Stage 1A integration verification.
21. History/backend restore verification.
22. Before/after malformed examples.
23. Remaining Stage 3 blockers.
24. Whether F3-003 is closed.
25. Whether F3-010 is closed.
26. Whether F3-011 is:
    - closed,
    - partially closed,
    - or still open.
27. Initial and final Git status.
28. Any concurrent external changes.
29. Confirmation that no commit/staging/branch/push occurred.

## Required invariant outcomes

After Stage 3A:

1. Missing chair reps cannot score.
2. String chair reps cannot score.
3. Missing flags cannot crash.
4. Malformed flags cannot score.
5. Invalid item status cannot score.
6. Duplicate known movements cannot use first-match selection.
7. Duplicate ordering cannot affect the score.
8. Negative balance seconds cannot score.
9. Balance seconds above the protocol maximum cannot score.
10. Negative shoulder ROM cannot score.
11. Shoulder ROM above the mathematical maximum cannot score.
12. Malformed supporting metrics are omitted.
13. One malformed movement does not erase unrelated valid domains.
14. No malformed metric reaches norm lookup.
15. No malformed input creates a finite-looking age.
16. Scoring does not throw on ordinary malformed persisted/restored data.
17. No score row contains invalid numeric output.
18. Measured domain bounds are finite and ordered.
19. Weakest domain considers only valid measured domains.
20. Malformed-only evidence remains Stage 1A-ineligible.
21. Null focus cannot default to strength.
22. Fully valid scoring output is unchanged.
23. TUG remains supporting only and beta-hidden.
24. Hinge remains supporting only.
25. Norm tables remain unchanged.
26. Current one-domain eligibility policy remains unchanged until Stage 3B.
27. Manual-extra semantics remain unchanged until Stage 3B.
28. Scoring/norm versioning remains unchanged until Stage 3C.
29. Tie handling remains unchanged until its later remediation.
30. No unrelated product logic changes.

## Acceptance criteria

Do not mark Stage 3A complete unless all are true:

1. One authoritative scoring-input validation layer exists.

2. Runtime validation does not rely solely on TypeScript casts.

3. `scoreCheckUp` cannot throw for the defined malformed corpus.

4. Missing chair reps result in unmeasured strength.

5. String chair reps are rejected without coercion.

6. Missing/malformed flags fail closed.

7. Duplicate known movement IDs invalidate only the affected movement.

8. Duplicate item order cannot affect scoring.

9. Protocol-impossible headline values are rejected before norm lookup.

10. Invalid supporting values are omitted without erasing valid primary evidence.

11. Other valid domains remain intact.

12. Malformed-only Check-Ups cannot pass Stage 1A.

13. Fully valid Check-Ups produce unchanged scores.

14. No norm table or norm breakpoint changes.

15. No officialness/evidence-sufficiency policy changes.

16. No manual-extra policy changes.

17. No scoring-version changes.

18. Targeted tests pass.

19. Full tests pass.

20. Typecheck passes.

21. Expo config passes.

22. `git diff --check` passes.

23. No new warning is introduced without explanation.

24. No unrelated user work is reverted or overwritten.

25. No commit, staging, branch, or push occurs.

## Stage decision

At the end of the report, state exactly one:

- `STAGE 3A COMPLETE`
- `STAGE 3A BLOCKED`

Use `STAGE 3A COMPLETE` only if:

- F3-003 is closed.
- Duplicate first-match scoring is removed.
- Confirmed negative/extreme headline examples fail closed.
- Valid outputs are unchanged.
- Full validation passes.

Also state:

- `STAGE 3B REQUIRED`
- `STAGE 4 REMAINS BLOCKED`
- `STAGE 5 INPUTS REMAIN BLOCKED`

Stage 3A alone must not unblock Stage 4 or Stage 5 because evidence sufficiency, manual officialness, versioning, and norms remain unresolved.

## Final Codex response

Return a concise summary containing:

- Remediation report path.
- Whether production code changed.
- Validation architecture added.
- Exact duplicate movement policy.
- Exact chair-rep validity rule.
- Exact balance plausibility rule.
- Exact shoulder plausibility rule.
- Supporting-metric handling.
- Files changed.
- Tests added and changed.
- Targeted validation result.
- Full-suite validation result.
- Typecheck/config/diff results.
- Confirmation that missing chair reps no longer score.
- Confirmation that string reps no longer coerce.
- Confirmation that missing flags no longer crash.
- Confirmation that duplicates fail closed.
- Confirmation that negative/structurally impossible headline values fail closed.
- Confirmation that valid outputs remain unchanged.
- Confirmation that Stage 1A still blocks malformed-only evidence.
- Status of F3-003.
- Status of F3-010.
- Status of F3-011.
- Remaining Stage 3 blockers.
- `STAGE 3A COMPLETE` or `STAGE 3A BLOCKED`.
- `STAGE 3B REQUIRED`.
- `STAGE 4 REMAINS BLOCKED`.
- `STAGE 5 INPUTS REMAIN BLOCKED`.
- Initial and final Git status.
- Any concurrent external changes.
- Confirmation that no commit, staging, branch, or push occurred.
