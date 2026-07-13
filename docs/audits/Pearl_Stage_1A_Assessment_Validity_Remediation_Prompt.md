You are implementing Stage 1A of Pearl’s production-readiness work:

ASSESSMENT VALIDITY AND BLOCK-CREATION REMEDIATION

This is a narrowly scoped code-remediation task addressing confirmed finding F-001 and closely related assessment-validity contradictions from the Stage 1 logic audit.

Read these reports in full before changing code:

- docs/audits/PEARL_LOGIC_AUDIT_STAGE_0.md
- docs/audits/PEARL_LOGIC_AUDIT_STAGE_1.md

The Stage 1 report is evidence and guidance, but the current working tree is the final source of truth. Re-verify every relevant call path before editing because `App.tsx` appeared as an external/concurrent modification during the Stage 1 audit.

Do not begin Stage 2 in this task.

## Confirmed defect being fixed

Stage 1 confirmed this production path:

CheckUpScreen
-> handleCheckUpComplete
-> results screen
-> handleStartPlan
-> scoreCheckUp
-> buildBlock
-> createMovementBlockFromAssessment

A check-up containing no valid measured domains can produce:

- `score.weakestDomain === null`
- an invalid or low-confidence MovementAssessment
- an implicit conversion from null to `strength_power`
- an active legacy block
- an active MovementBlock
- a strength-focused training plan despite Pearl having obtained no reliable measurement evidence

This is a P0 trust defect.

Pearl’s camera is presented as a measuring instrument. The app must never claim to have identified a training focus or create a personalised block when no valid focus was measured.

## Objective

Implement a defensive, reusable assessment-validity contract that prevents any invalid or no-domain assessment from:

- Creating a first training block.
- Creating a next training block.
- Completing or replacing a block after an invalid re-test.
- Creating a block report from an invalid re-test.
- Being selected as the latest usable official assessment.
- Advancing onboarding to a completed-plan state.
- Silently defaulting its training focus to strength.

Invalid results may still be retained in history where useful for debugging, retry, sync, or user explanation, but they must not become authoritative training evidence.

## Scope boundary

This task should fix only assessment validity and block-creation eligibility.

Do not fix these other Stage 1 findings yet:

- F-002 account/local-data isolation.
- F-003 non-training completions entering session planning.
- F-004 all-skipped session credit.
- F-005 legacy fallback containment.
- F-006 planning date injection.
- Equipment-source consolidation.
- Exercise metadata mismatches.
- General legacy/dynamic training architecture.
- Manual extra check-up policy beyond invalid-result protection.
- Exercise-science thresholds or scoring norms.
- TUG.
- Session-player behaviour.
- Visual redesign unrelated to the invalid-result state.

Do not combine unrelated clean-up with this patch.

## Interim product rule for this patch

This patch is a hard minimum trust gate. Stage 2 and Stage 3 may later tighten the precise evidence requirements.

A check-up or assessment must not create or replace a training block when any of the following are true:

1. The derived assessment status is not `completed`, or its equivalent in the current implementation.

2. `score.weakestDomain` is null, undefined, unsupported, or cannot be explicitly mapped to a Pearl movement domain.

3. There are zero valid measured domains.

4. The proposed focus-domain score is unmeasured or contains non-finite values where finite values are required.

5. The result has only skipped, missing, or explicitly `no-measurement` assessment items.

6. The assessment object and score disagree about whether usable evidence exists.

For this Stage 1A patch:

- Do not silently map a missing domain to `strength_power`.
- Do not invent a fallback focus.
- Do not create a generic block as though it were personalised.
- Do not classify an invalid result as completed official evidence.
- Do not decide the final one-domain versus two-domain versus three-domain policy unless the existing assessment status already encodes that decision.
- Reuse the existing `MovementAssessment.status` and scoring semantics where sound.
- Treat this as a minimum safety boundary, not final clinical validation.

A valid existing check-up must continue to create the same block as before this patch.

## Working-tree safety

Before editing:

1. Run:

   `git status --short --untracked-files=all`

   `git diff --name-only`

   `git diff --stat`

2. Inspect the current diff for `App.tsx`.

3. Determine whether the relevant handlers still match the Stage 1 report.

4. Record any material differences between the audited version and the current working tree.

5. Do not revert, overwrite, or reformat unrelated user changes.

6. Do not modify the existing Stage 0 or Stage 1 audit reports.

7. Do not commit or push.

8. Do not use destructive Git commands.

## Required implementation

### 1. Add one authoritative eligibility function

Create or identify one pure helper responsible for deciding whether a check-up-derived result can create or replace a training block.

Use an appropriate existing Pearl flow/scoring module or create a narrowly scoped module such as:

`src/pearlFlow/assessmentEligibility.ts`

Choose the location that best matches the current architecture.

The helper should return structured information rather than only a boolean.

A suitable shape would be conceptually similar to:

```ts
type BlockCreationEligibility =
  | {
      eligible: true;
      focusDomain: MovementDomain;
      measuredDomains: MovementDomain[];
    }
  | {
      eligible: false;
      reason:
        | 'assessment_not_completed'
        | 'no_measured_domains'
        | 'missing_focus_domain'
        | 'invalid_focus_measurement'
        | 'inconsistent_assessment';
      measuredDomains: MovementDomain[];
    };
```

Adapt names and types to the actual repository.

Requirements:

- Pure and deterministic.
- No dependence on screen state.
- No ambient date.
- No implicit strength fallback.
- Handles malformed or legacy-compatible inputs defensively.
- Never throws for ordinary invalid user measurements.
- Returns a stable reason code suitable for tests, UI copy, and observability.
- Centralises the eligibility rule instead of recreating it in multiple screens.
- Clearly distinguishes “measurement was invalid” from an unexpected programmer error.

Do not duplicate scoring calculations unnecessarily. Consume the existing score and assessment outputs where possible.

### 2. Harden domain conversion

Inspect all uses of the function currently mapping score domains to movement domains, including any behaviour equivalent to:

`movementDomainFromScoreDomain(null) -> strength_power`

Do not make a broad breaking change without tracing all callers.

At minimum:

- Block-creation paths must never receive an implicitly defaulted domain.
- Null, undefined, or unsupported domains must be rejected before block creation.
- The type system should make accidental fallback difficult.
- Any compatibility fallback retained elsewhere must be explicit and documented.
- Add a direct test proving that a null weakest domain cannot become a strength block.

Prefer an explicit conversion result such as `MovementDomain | null` or a typed eligibility result over a hidden default.

### 3. Defend every block-creation entry point

Trace and update every production-reachable path capable of creating or replacing a block, including:

- Initial onboarding block creation.
- Results-screen block creation.
- `handleStartPlan`.
- `handleStartNextBlock`.
- Official re-test next-block creation.
- Block-report or Progress actions that create another block.
- Direct calls to legacy `buildBlock`.
- Direct calls to `createMovementBlockFromAssessment`.
- Any restored or compatibility path that can call the same services.

For every entry point:

1. Recompute or consume the authoritative eligibility result.

2. Refuse the mutation when ineligible.

3. Do not write either:
   - `TrainingState.block`
   - `MovementBlock`

4. Do not archive or complete an existing active block.

5. Do not generate a report or next block.

6. Do not mark onboarding or lifecycle state as plan-complete.

7. Route the user to an appropriate retake/recovery state.

8. Ensure direct handler invocation cannot bypass a hidden or disabled UI button.

The service/business-logic layer must reject an invalid block request even if a future UI accidentally exposes the action.

### 4. Fix invalid baseline behaviour

For a baseline with no usable measured domain:

- It may be saved as an attempted check-up if current persistence semantics require that.
- It may be displayed as an incomplete result.
- It must not expose an enabled “Create my plan” or equivalent CTA.
- It must not create a legacy block.
- It must not create a MovementBlock.
- It must not default to strength.
- It must not make onboarding appear complete.
- It must not cause the next app launch to skip the required baseline.
- The primary recovery action should be to retake the Movement Check-Up.
- Reuse the existing retake and camera-setup flows rather than introducing a duplicate check-up implementation.

Use calm Pearl copy, for example:

“We couldn’t get enough reliable measurements to build your plan.”

Supporting copy may explain that the user can repeat the check-up after adjusting the phone setup.

Avoid:

- “Failure”
- “Invalid user”
- Medical terminology
- Blaming the user
- Claiming that a diagnosis or safety determination was made

Do not redesign the screen beyond what is necessary to communicate the state and provide the retake action.

### 5. Fix invalid official re-test behaviour

An invalid official re-test is especially important.

When an official re-test has no eligible training evidence:

- Saving the attempted measurement may remain allowed.
- The current block must not be completed or archived because of that invalid attempt.
- No block report should be generated from it.
- No next block should be created.
- The active block must remain recoverable and internally consistent.
- It must not become the latest usable official assessment.
- The user should be offered a re-test retry.
- Restarting the app must not leave the user stuck between blocks.
- Existing valid baseline and previous official results must remain authoritative.
- Backend sync must not turn the invalid attempt into completed official evidence.

Do not make broad transaction changes in this task, but make the invalid path fail before block/report mutations begin.

### 6. Align official-assessment selection

Review:

- `latestOfficialAssessment`
- `hasOfficialAssessment`
- Lifecycle callers.
- Progress callers.
- Block-creation callers.
- Restore-compatible assessment rows.

Make official selection consistent:

- “Latest usable official assessment” must require completed/eligible status.
- An invalid official attempt can remain in history but must not be returned as the latest usable official result.
- Do not delete historical invalid attempts merely to simplify selection.
- Existing valid older official assessments must remain selectable when a newer invalid attempt exists.

Use separate helpers if necessary to distinguish:

- Latest official attempt.
- Latest usable official assessment.

Do not overload one helper with ambiguous semantics.

### 7. Preserve manual check-up boundaries

For this patch:

- An invalid manual extra check-up must not create a block.
- A valid manual extra check-up may continue to behave according to the existing implementation.
- Do not solve the broader question of whether a valid manual extra check-up may automatically seed a future block; that belongs to Stage 3/7.
- Make no accidental change to official/manual type labels.

### 8. Add observability without adding dependencies

When an ineligible block-creation attempt reaches a defended handler:

- Record a safe diagnostic using Pearl’s existing observability infrastructure where practical.
- Include the reason code, check-up type, and measured-domain count.
- Do not include raw pose frames, landmarks, recordings, or sensitive free-form profile data.
- Do not show a technical error to the user.
- Do not add a new package.

A blocked invalid measurement is an expected recoverable product state, not necessarily an exception.

### 9. Preserve valid behaviour

Prove that a valid current baseline still:

- Produces the same score.
- Produces the same focus domain.
- Creates one legacy block where compatibility still requires it.
- Creates one MovementBlock.
- Routes to the same valid block-introduction flow.
- Does not create duplicate blocks.
- Does not change workout content.
- Does not alter exercise selection.
- Does not alter scoring thresholds.

This patch must not silently change valid user outcomes.

## Required automated tests

Add tests at the most authoritative practical level.

Do not only test that a button is hidden.

### Eligibility helper tests

Cover at least:

1. Fully valid assessment and score:
   - Eligible.
   - Explicit focus domain.
   - Existing behaviour preserved.

2. No measured items:
   - Ineligible.
   - Reason is no measured domains.
   - No strength fallback.

3. All items skipped:
   - Ineligible.

4. All items marked `no-measurement`:
   - Ineligible.

5. `weakestDomain === null`:
   - Ineligible.

6. Unsupported or malformed weakest-domain value:
   - Ineligible without crashing.

7. Assessment status invalid:
   - Ineligible even if a partial score object exists.

8. Assessment status completed but focus measurement is non-finite:
   - Ineligible.

9. Newer invalid official attempt plus older valid official assessment:
   - Latest usable official helper returns the older valid assessment.

10. Valid partial evidence currently classified as completed by existing assessment semantics:
    - Record current behaviour explicitly.
    - Do not invent a stricter policy in this patch.

### Block-service tests

Prove:

- Invalid assessment cannot create a MovementBlock.
- Null focus cannot become `strength_power`.
- Valid assessment still creates the expected block.
- Defensive service behaviour cannot be bypassed by a direct caller.

Use a typed result or an explicitly tested invariant failure rather than relying on an accidental runtime exception.

### Onboarding/result-flow tests

Prove:

- Invalid baseline results do not expose an enabled create-plan action.
- Retake is available.
- Directly invoking the create-plan handler still does not mutate block state.
- No onboarding-complete state is written.
- On restart/lifecycle derivation, the user still needs a valid baseline or plan.

### Official re-test tests

Prove that an invalid official re-test:

- Does not complete the current block.
- Does not create a report.
- Does not create a next block.
- Does not replace the last usable official assessment.
- Leaves a valid retry route.
- Does not strand lifecycle between blocks.

### Regression tests

Prove:

- Valid baseline creation remains unchanged.
- Valid official re-test behaviour remains unchanged.
- Manual-invalid results cannot create blocks.
- Existing valid history and restore tests continue to pass.
- TUG remains excluded from the production default battery.

Where full `App.tsx` testing would be excessively brittle, extract the smallest pure orchestration decision necessary and test that directly. Do not perform a large architectural refactor merely to make this patch testable.

## Test quality requirements

Tests must assert observable product rules, not duplicate implementation.

Avoid tests that:

- Recreate the eligibility helper line by line.
- Only snapshot a results screen.
- Mock scoring so heavily that no invalid score can occur.
- Assert only that the helper was called.
- Pass while a direct block-service call can still create an invalid block.

At least one test must construct a realistic no-measurement `CheckUp`, run it through the real scoring and assessment creation functions, and prove that no block-creation eligibility is returned.

## Validation commands

Run:

1. Relevant targeted test suites.
2. `npm test -- --runInBand`
3. `npm run typecheck`
4. `npx --no-install expo config --json`

No lint command is required unless a lint script now exists.

Record:

- Exact commands.
- Exit codes.
- Test-suite count.
- Test count.
- Warnings.
- Any changed snapshots.
- Whether the Jest open-handle warning remains.
- Whether any new warning was introduced.

Do not update snapshots merely to force a pass.

## Manual source inspection after implementation

After tests pass, trace these paths again from the current source:

### Invalid baseline

CheckUpScreen
-> check-up completion
-> scoring
-> assessment
-> results
-> attempted create plan
-> eligibility rejection
-> retake

Confirm no block write occurs.

### Valid baseline

CheckUpScreen
-> scoring
-> assessment
-> eligibility success
-> legacy compatibility block
-> MovementBlock
-> block introduction

Confirm valid behaviour is unchanged.

### Invalid official re-test

CheckUpScreen
-> scoring
-> assessment
-> eligibility rejection
-> no block completion
-> no report
-> no next block
-> retry route

### New invalid official attempt over older valid official result

Confirm the older valid assessment remains the latest usable official result.

## Remediation report

Create:

`docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_1A.md`

Include:

1. Scope.
2. Original confirmed defect.
3. Final eligibility contract.
4. Files changed.
5. Runtime paths updated.
6. UI recovery behaviour.
7. Official re-test behaviour.
8. Tests added.
9. Exact validation results.
10. Remaining policy questions for Stage 2 and Stage 3.
11. Remaining Stage 1 findings intentionally not fixed.
12. Initial and final Git status.
13. Any differences found between the audited `App.tsx` path and the current working tree.

Do not edit the Stage 0 or Stage 1 reports.

## Final acceptance criteria

Do not mark this remediation complete unless all are true:

1. A no-domain check-up cannot create either form of training block.

2. Null weakest domain cannot silently become strength.

3. An invalid assessment cannot drive block creation through a direct service call.

4. Invalid results cannot expose an enabled create-plan action.

5. A valid result still creates the same intended block.

6. An invalid official re-test cannot complete the current block.

7. An invalid official re-test cannot create a report or next block.

8. A newer invalid official attempt cannot hide an older valid official result.

9. Invalid manual extra results cannot create blocks.

10. Onboarding cannot become complete from invalid measurement evidence.

11. Tests cover the real scoring-to-eligibility path.

12. Full tests, typecheck, and Expo config pass.

13. No unrelated Stage 1 defect has been folded into this patch.

14. Existing user changes have not been reverted.

15. No commit or push has occurred.

## Final Codex response

Return a concise summary containing:

- Remediation report path.
- Exact product rule implemented.
- Files changed.
- Number of tests added.
- Full validation results.
- Confirmation that a no-domain baseline cannot create a plan.
- Confirmation that null focus no longer defaults to strength in block creation.
- Confirmation that an invalid official re-test cannot close the block or create the next one.
- Confirmation that valid baseline and re-test paths remain unchanged.
- Remaining unresolved assessment-validity questions for Stage 2/3.
- Initial and final Git status.
- Confirmation that no unrelated code was changed.
- Confirmation that no commit or push occurred.
