You are implementing Stage 3D-C of Hale’s production-readiness work:

EXACT TIE POLICY, TIE METADATA, BALANCED/GENERAL FOCUS HANDLING, AND TIE-SAFE USER COPY

This is a focused production-code remediation task.

Do not begin Stage 3D-B, Stage 3D-D, Stage 4, Stage 5, workout-generation remediation, exercise-catalogue remediation, near-tie policy, meaningful-change thresholds, or beta-device validation in this task.

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
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3B.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3C.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_3C_1.md
- docs/audits/HALE_LOGIC_AUDIT_STAGE_3D.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_A.md

The current working tree is the source of truth. Re-verify relevant call paths before editing because report line numbers may no longer be exact.

## Stage 3D-C product policy approved by the product owner

The product owner has approved this exact-tie policy:

1. First official baseline exact tie:
   - Prefer a `balanced` / `general` focus if the architecture supports it.
   - If balanced focus is not yet supported end-to-end, use a deterministic fallback but document it and present the result as “closely matched” rather than a clear weakest area.

2. Official re-test exact tie:
   - Preserve the current active block focus when possible.
   - Do not silently flip the user into a different focus because of an exact tie.

3. Manual/quick Check-Up exact ties:
   - Display only.
   - No block creation.
   - No Progress authority.
   - No lifecycle effect.

4. Near ties:
   - Do not implement near-tie margins in this task.
   - Near ties require device repeatability data and belong to Stage 3D-D.

5. Score snapshots/results:
   - Store enough tie metadata to make historical exact-tie results explainable after reload/restore.
   - Do not silently lose tie information.

6. User-facing copy:
   - Use “closely matched” / “suggested focus” / “balanced starting point” style language.
   - Do not use “weakest” or imply a clear weakness when there is an exact tie.

## Current problem being fixed

Stage 3D confirmed that the current weakest-domain algorithm is deterministic but implicit:

- Domain order is strength, balance, mobility.
- The algorithm updates focus only when a domain midpoint is strictly greater than the current oldest midpoint.
- Exact ties therefore keep the first domain in order.
- Exact three-way ties default to strength.
- Snapshots store only one `weakestDomain`, not tie metadata.
- Assessment/block focus therefore can silently inherit a hidden priority.

This is not safe enough for beta because it lets Hale tell a user that strength is the suggested focus even when strength, balance, and mobility are exactly tied.

## Primary objective

Implement an explicit exact-tie contract so that Hale can:

1. Detect exact ties among complete official domain scores.

2. Store exact-tie metadata in score snapshots and MovementAssessments.

3. Display tie-aware copy.

4. Use a balanced/general focus for first-baseline exact ties when supported.

5. Preserve the current active block focus on official re-test exact ties.

6. Keep manual/quick exact ties display-only.

7. Preserve current behavior for non-tied complete results.

8. Preserve Stage 3A, Stage 3B, Stage 3C, and Stage 3D-A protections.

9. Leave near-tie and meaningful-change policy untouched.

## Scope boundary

This task may change:

- weakest-domain selection helper;
- tie metadata type(s);
- score snapshot schema, if necessary and versioned/compatible;
- current snapshot creation/parsing;
- MovementAssessment tie/focus metadata;
- assessment eligibility focus handling;
- first-block focus selection;
- re-test next-block focus selection;
- block report focus copy if tie-related;
- result/onboarding/progress/report view models and copy where they display focus;
- typed backend metadata for tie fields;
- restore logic for tie metadata;
- tests;
- the Stage 3D-C remediation report.

This task must not change:

- scoring formulas.
- norm tables.
- norm anchors.
- movement-age calculations.
- Stage 3A malformed-input validation.
- Stage 3B all-three-domain officialness.
- Stage 3B manual/quick isolation.
- Stage 3C frozen historical score behavior.
- Stage 3C source-identity hardening.
- Stage 3D-A performance-band/copy softening.
- near-tie policy.
- meaningful-change thresholds.
- device validation.
- Check-Up measurement logic.
- camera readiness.
- exercise catalogue.
- workout generation content.
- workout progression.
- session completion semantics.
- account isolation.
- backend schema unless existing JSON metadata can safely carry the field.
- broad UI redesign.

Do not perform opportunistic refactors.

## Important distinction

This task handles only exact ties.

Exact tie means the internal comparable values used for focus selection are exactly equal after current scoring/snapshot parsing.

Do not introduce:

- a 1-year margin,
- a 5-year margin,
- rounding-based tie,
- device-noise margin,
- domain-specific repeatability margin,
- “almost tied” behavior.

Those belong to Stage 3D-D.

If display rounding makes two domains look equal while internal values differ, do not treat that as a tie in this task. Instead, document it as a remaining near-tie/rounding issue.

## Locked Stage 3D-C rules

### 1. Tie detection

For a complete three-domain score:

- Determine the focus-comparison value for strength.
- Determine the focus-comparison value for balance.
- Determine the focus-comparison value for mobility.
- Find the maximum/worst value according to current scoring semantics.
- Any domain exactly equal to that maximum is tied for suggested focus.
- If tied domain count is one, it is a clear focus.
- If tied domain count is two or three, it is an exact tie.

Do not include unmeasured domains.

Do not include supporting metrics.

Do not include manual/quick Check-Ups in official focus decisions.

### 2. Tie metadata

Add tie metadata in a minimal, backwards-compatible way.

Conceptually, a focus-selection result may include:

```ts
type FocusSelection =
  | {
      kind: 'clear';
      focusDomain: ScoreDomain;
      tiedDomains: [ScoreDomain];
      tieBreakReason?: null;
    }
  | {
      kind: 'exact_tie';
      focusDomain: ScoreDomain | 'balanced';
      tiedDomains: ScoreDomain[];
      tieBreakReason:
        | 'balanced_first_block'
        | 'preserve_current_focus'
        | 'deterministic_fallback';
    };
```

Adapt this to the actual repository types.

Requirements:

- Store tied domains in stable domain order.
- Store whether the focus is clear or exact tie.
- Store the effective focus used for block creation.
- Store the reason for that effective focus when tied.
- Preserve old snapshots without tie metadata as legacy/no-tie-metadata.
- Do not make old snapshots invalid solely because they lack the new tie metadata.
- Do not silently rewrite old snapshots.
- Do not break Stage 3C compatibility.

If adding tie metadata to the score snapshot requires a schema change, do it explicitly and safely:
- increment schema version only if the codebase’s Stage 3C snapshot compatibility architecture requires it;
- preserve parsing of existing schema v1 snapshots;
- document whether tie metadata is optional extension metadata or schema v2;
- add tests for old snapshots.

Prefer a backwards-compatible optional field if safe.

### 3. First official baseline exact tie

When creating the first block from a complete official baseline or confirmed baseline retake:

- If tie metadata shows a clear focus:
  - preserve current behavior.

- If there is an exact tie:
  - prefer `balanced` / `general` focus if the adherence/training/block architecture supports it end-to-end.

If the architecture does not support balanced/general focus end-to-end:

- use a deterministic fallback only at the final block-focus conversion boundary;
- record the fallback reason as `deterministic_fallback`;
- display tie-aware copy, not a clear “focus is X” claim;
- document the limitation in the remediation report;
- do not pretend balanced focus is implemented.

Do not invent a half-supported balanced focus that breaks workout generation.

If balanced/general focus is supported, add tests proving:
- block creation accepts it;
- downstream session planning can handle it;
- UI can display it;
- no crash occurs.

If it is not supported, add tests proving:
- the deterministic fallback is stable;
- the user-facing copy says “closely matched”;
- the fallback is recorded as fallback metadata;
- the block can still be created safely.

### 4. Official re-test exact tie

When a complete official re-test produces an exact tie:

- If there is an active block with a valid current focus domain that is among the tied domains:
  - preserve the current active block focus.

- If the active block focus is not among the tied domains:
  - prefer balanced/general focus if supported.
  - otherwise use deterministic fallback and record the reason.

- If there is no active block:
  - treat it like first-baseline tie policy.

This rule prevents exact-tie re-tests from creating arbitrary focus flips.

### 5. Manual/quick exact tie

Manual extra and quick recheck results may store/display tie metadata.

They must not:
- create a block;
- seed next-block creation;
- affect official Progress;
- affect lifecycle;
- replace official focus.

### 6. Copy rules

For exact ties, use copy like:

- “Your results are closely matched.”
- “Hale found a balanced starting point.”
- “These areas were closely matched, so Hale is using a balanced starting focus.”
- “These areas were closely matched, so Hale is keeping your current focus.”
- “Suggested focus”

Avoid:

- “weakest”
- “weakness”
- “main opportunity”
- “clear weakest area”
- “problem area”

This must preserve Stage 3D-A copy softening.

### 7. Snapshot and historical behavior

For a newly created current-version result:
- tie metadata must be stored.
- restored historical display must preserve tie metadata.
- backend metadata must preserve tie metadata where current JSON metadata allows.
- source identity checks from Stage 3C.1 must still apply.

For old snapshots without tie metadata:
- continue to display/use them according to existing Stage 3C compatibility.
- do not claim a tie unless metadata exists or can be safely recomputed only for a current new score.
- do not silently recompute old raw Check-Ups to determine tie metadata.

### 8. Block eligibility and focus identity

Block eligibility must distinguish:

- score’s clear/tied focus metadata;
- assessment’s effective focus;
- block’s effective focus;
- whether the focus was balanced, preserved, or fallback.

A block should not be created with a focus that cannot be traced back to:
- clear weakest domain, or
- approved tie policy.

### 9. Preserve non-tie behavior

For non-tied complete official results:
- score output remains the same.
- assessment focus remains the same.
- block focus remains the same.
- user copy remains Stage 3D-A softened but not tie-specific.
- snapshots remain compatible.
- reports remain compatible.
- tests for normal focus continue passing.

## Working-tree safety

Before editing:

1. Run:

   git status --short --untracked-files=all

   git diff --name-only

   git diff --stat

2. Record exact outputs in the remediation report.

3. Treat all existing modifications and untracked files as user-owned.

4. Inspect current diffs in every file this task may touch.

5. Do not revert, overwrite, reformat, move, or delete unrelated work.

6. Do not modify prior audit/remediation reports.

7. Do not use destructive Git commands.

8. Do not install packages.

9. Do not stage, commit, create a branch, or push.

10. If unrelated files change during this task:
    - record them;
    - do not overwrite them;
    - continue only if task-owned files remain safe;
    - otherwise stop code mutation and report the conflict.

## Step 1: Re-verify current focus and tie architecture

Before editing, inspect:

- src/scoring/scoring.ts
- src/scoring/scoreSnapshot.ts
- src/scoring/versions.ts
- src/haleFlow/assessments.ts
- src/haleFlow/assessmentEligibility.ts
- src/haleFlow/assessmentEvidence.ts
- src/haleFlow/assessmentResultState.ts
- src/haleFlow/checkupHistory.ts
- src/haleFlow/reports.ts
- src/adherence/types.ts
- src/adherence/blockService.ts
- src/training/workoutGeneration.ts
- src/haleFlow/sessionPlanning.ts
- App.tsx
- Results/OnboardingResults/Progress/BlockReport screens
- backend check-up sync/restore
- block report sync/restore
- relevant tests.

Document:

- exact current weakest-domain algorithm;
- exact domain order;
- exact comparison value used;
- how `weakestDomain` enters `MovementAssessment`;
- how focus domain maps from score domain to movement/adherence domain;
- whether block types support balanced/general focus;
- whether session planning supports balanced/general focus;
- whether any UI supports balanced/general focus;
- whether snapshots can store optional tie metadata without schema change;
- current backend JSON metadata shape;
- current tests that assert focus behavior.

Do not edit until this trace is complete.

## Step 2: Add pure focus-selection helper

Create one authoritative pure helper if one does not already exist.

Possible locations:
- src/scoring/focusSelection.ts
- src/haleFlow/focusSelection.ts
- or a narrow existing scoring/assessment module.

The helper should accept a complete current score or score snapshot and return a structured focus-selection result.

Requirements:

- Pure and deterministic.
- Stable domain order.
- Uses current score midpoint/focus comparison semantics.
- Handles clear focus.
- Handles two-way exact ties.
- Handles three-way exact ties.
- Handles incomplete/unmeasured scores by returning no official focus.
- Handles malformed bounds by failing closed.
- Does not mutate input.
- Does not depend on current date.
- Does not use display-rounded values.
- Does not implement near-tie margins.
- Does not rescore historical raw Check-Ups.

Add direct tests for:
- strength clear.
- balance clear.
- mobility clear.
- strength/balance exact tie.
- strength/mobility exact tie.
- balance/mobility exact tie.
- three-way exact tie.
- incomplete score.
- malformed measured domain.
- display-rounded equality but internal non-tie.

## Step 3: Add tie metadata to current score snapshots

Update snapshot creation/parsing so newly created current snapshots preserve focus-selection metadata.

Required tests:

- clear focus snapshot has clear metadata.
- two-way tie snapshot preserves tied domains.
- three-way tie snapshot preserves tied domains.
- effective focus is stored.
- tie-break reason is stored when applicable.
- JSON round-trip preserves metadata.
- old snapshot without tie metadata parses safely.
- source mismatch still fails closed.
- future/invalid snapshot behavior remains unchanged.
- missing tie metadata on old current snapshot does not break display, but is treated as no explicit tie metadata.
- no raw historical rescore is used to recreate tie metadata for old snapshots.

If schema version changes:
- update compatibility tests.
- preserve existing schema parsing.
- document why schema changed.

If optional metadata is used:
- document why schema did not change.
- test optional field absence.

## Step 4: Update MovementAssessment creation

MovementAssessment must carry enough tie/focus metadata for later block creation and display.

Required behavior:

- clear focus complete official score -> authoritative focus unchanged.
- exact tie complete official score -> assessment records tied domains and effective focus policy.
- incomplete/invalid score -> no authoritative focus.
- manual/quick complete score -> tie metadata may be stored but remains non-official.
- old restored assessment without tie metadata remains usable according to Stage 3C compatibility but does not claim tie.

Tests:
- clear focus assessment.
- baseline exact tie.
- re-test exact tie with current active focus among tied domains.
- re-test exact tie with current active focus not among tied domains.
- manual exact tie.
- old assessment without metadata.

## Step 5: Implement first-baseline exact-tie policy

Trace first-block creation:

- result screen / onboarding result screen;
- `handleStartPlan`;
- assessment eligibility;
- block service;
- legacy block creation;
- MovementBlock creation;
- session planning.

Determine whether balanced/general focus is supported end-to-end.

### If balanced/general is supported

Implement first-baseline exact ties as balanced/general.

Tests:
- exact three-way baseline tie creates balanced/general focus.
- exact two-way baseline tie creates balanced/general focus or documented balanced subset if supported.
- block service accepts balanced/general focus.
- session planning does not crash.
- UI displays balanced starting point.
- backend sync/restore preserves focus metadata.

### If balanced/general is not supported

Implement deterministic fallback at the narrowest final boundary.

Recommended fallback order for V1 if no balanced support:
- strength_power, balance, mobility, matching current stable order.

But copy and metadata must reveal that this was a fallback due to exact tie.

Tests:
- exact tie records `deterministic_fallback`.
- fallback focus is stable.
- copy says closely matched.
- no “weakest” language appears.
- block creation still works.
- no crash in session planning.
- report documents balanced/general unsupported in this stage.

Do not add fake balanced focus that later code cannot handle.

## Step 6: Implement official re-test exact-tie policy

When a complete official re-test is tied:

- If there is an active block with a valid current focus domain that is among the tied domains, preserve it.
- If active block focus is not among the tied domains, use balanced/general if supported; otherwise deterministic fallback.
- If no active block exists, use first-baseline policy.

Tests:
- active focus strength and tie includes strength -> preserves strength.
- active focus balance and tie includes balance -> preserves balance.
- active focus mobility and tie includes mobility -> preserves mobility.
- active focus not tied -> balanced/general if supported or deterministic fallback with reason.
- no active block -> first-baseline behavior.
- preserved focus is stored in snapshot/assessment/report/next block metadata.
- copy says current focus is being kept because areas are closely matched.
- no focus flip on exact tie.

## Step 7: Manual/quick tie behavior

Tests:
- full manual exact tie stores/display tie metadata.
- full manual exact tie creates no block.
- full manual exact tie does not affect official Progress.
- full quick exact tie behaves the same.
- manual result screen uses closely matched copy but no plan CTA.
- manual tie is not used by next-block creation.

## Step 8: Update block eligibility and block service

Eligibility must accept effective focus only when it was produced by approved tie policy.

Tests:
- clear focus current official eligible.
- baseline exact tie eligible only with approved effective focus.
- re-test exact tie eligible only with approved effective focus.
- missing tie metadata where tie exists fails closed for new current records.
- inconsistent tied domains/effective focus fails closed.
- tie metadata says preserve current focus but no current focus exists -> fails or falls back according to policy.
- unsupported balanced focus fails closed unless deterministic fallback is used.
- direct block-service caller cannot bypass.

Do not weaken Stage 3B all-three-domain requirement.

Do not weaken Stage 3C current-version requirement.

## Step 9: Update UI/view-model tie copy

Update user-facing surfaces where focus is shown:

- ResultsScreen
- OnboardingResultsScreen
- ProgressScreen
- BlockReportScreen
- Today/Plan focus summaries, if they display this focus
- any relevant view models.

Required copy behavior:

### Clear focus
Use Stage 3D-A softened wording:
- “Suggested focus”
- “area to focus on”

### Exact tie first baseline
Use:
- “Your results were closely matched.”
- “Hale is using a balanced starting focus.”
or, if fallback:
- “Your results were closely matched. Hale is starting with [focus] as a practical first focus.”

### Exact tie official re-test with preserved focus
Use:
- “Your results were closely matched, so Hale is keeping your current focus.”

### Manual/quick tie
Use:
- “These areas were closely matched.”
No block/focus authority.

Avoid:
- “weakest”
- “weakness”
- “main opportunity”
- “clear lowest”
- “problem area”

Add or update tests for each state.

## Step 10: Update reports and next-block copy

For re-test exact ties:

- report should not imply a new weakness.
- if preserving focus, report should say focus is being kept because areas were closely matched.
- if fallback/balanced, report should state it softly.
- compatible report calculations remain unchanged.
- comparison-unavailable behavior remains unchanged.
- next-block creation uses the approved effective focus.

Tests:
- clear focus report unchanged except Stage 3D-A softened copy.
- tie preserve-current-focus report.
- tie fallback/balanced report.
- incompatible report still neutral.

## Step 11: Backend sync/restore

Tie metadata must round-trip through existing JSON metadata.

Tests:
- current snapshot with clear focus syncs/restores.
- current snapshot with two-way tie syncs/restores.
- current snapshot with three-way tie syncs/restores.
- assessment tie metadata syncs/restores.
- missing tie metadata in old snapshot remains safe.
- malformed tie metadata fails closed.
- source mismatch still fails closed.
- exact Check-Up type remains preserved.
- no raw historical rescore is used to recreate tie metadata.

Do not add a database migration unless absolutely required. Prefer existing JSON metadata.

## Step 12: Preserve Stage 3D-A copy guardrails

Update copy guardrails to ban or catch:
- “weakest area”
- “weakness”
- “main opportunity”
- tie result claiming a clear focus.
- “balanced” copy used when balanced focus is not actually supported, unless it is clearly phrased as “closely matched” with documented fallback.

Ensure existing Stage 3D-A guardrails still pass:
- no unqualified movement-age claims;
- no “camera measured”;
- no “typical age” without caveat;
- no “protect progress” claims.

## Step 13: Regression matrix

Run and/or add tests proving:

### Stage 3A
- malformed input fails closed.
- duplicate movement items fail closed.
- valid output unchanged.

### Stage 3B
- all three domains required.
- manual/quick isolated.
- partial results retryable.
- exact types preserved.

### Stage 3C/3C.1
- snapshots frozen.
- source identity checked.
- incompatible versions fail closed.
- current valid block eligibility still works.

### Stage 3D-A
- beta-safe copy remains.
- performance-band-first display remains.
- no unqualified movement-age copy returns.

### Current task
- exact tie metadata works.
- first baseline tie policy works.
- re-test preserve-current-focus works.
- manual/quick tie display-only works.
- non-tie behavior unchanged.
- near-tie not implemented.

## Validation commands

Run targeted tests for:

- scoring/focus selection.
- score snapshots.
- assessments.
- assessment eligibility.
- checkup history.
- progress view models.
- reports.
- block service.
- backend check-up sync/restore.
- backend block report sync/restore.
- result/onboarding/progress/report screen tests.
- copy guardrails.
- Stage 3A/3B/3C/3D-A regression suites.

Then run:

```bash
npm test -- --runInBand
npm run typecheck
npx --no-install expo config --type public
git diff --check
```

Do not install packages.

Record:
- exact targeted command;
- targeted suite/test counts;
- full suite/test counts;
- typecheck result;
- Expo config result;
- diff-check result;
- warnings;
- skipped tests;
- whether any command changed files.

## Remediation report

Create exactly one new report:

docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_C.md

Do not edit previous reports.

The report must include:

1. Scope.
2. Initial Git status.
3. Stage 3D finding addressed.
4. Approved exact-tie policy implemented.
5. Current focus-selection architecture.
6. Exact tie detection rule.
7. Tie metadata shape.
8. Snapshot tie metadata behavior.
9. MovementAssessment tie metadata behavior.
10. First-baseline exact-tie behavior.
11. Official re-test exact-tie behavior.
12. Manual/quick exact-tie behavior.
13. Balanced/general support verdict.
14. Deterministic fallback behavior, if used.
15. User-facing copy changes.
16. Block eligibility changes.
17. Report/next-block changes.
18. Backend sync/restore changes.
19. Files changed.
20. Tests added/changed.
21. Exact validation results.
22. Stage 3A/3B/3C/3D-A regression verification.
23. Remaining Stage 3D blockers.
24. Whether Stage 5 inputs are now ready or still blocked.
25. Initial and final Git status.
26. Concurrent external changes.
27. Confirmation that no commit/staging/branch/push occurred.

## Required invariant outcomes

After Stage 3D-C:

1. Exact two-way ties are detected.
2. Exact three-way ties are detected.
3. Non-ties remain non-ties.
4. Near ties are not treated as ties.
5. Tie metadata is stored for new current snapshots.
6. Tie metadata survives JSON round-trip.
7. Tie metadata survives backend sync/restore.
8. Old snapshots without tie metadata remain safe.
9. Baseline exact tie uses balanced/general if supported.
10. If balanced/general is not supported, baseline tie uses documented deterministic fallback.
11. Baseline tie copy says closely matched.
12. Re-test exact tie preserves active focus when tied.
13. Re-test tie does not arbitrarily flip focus.
14. Manual/quick tie has no official effect.
15. Block eligibility requires approved focus origin.
16. Direct block-service call cannot bypass tie policy.
17. Clear focus behavior remains unchanged.
18. Score formulas unchanged.
19. Norm tables unchanged.
20. Stage 3D-A copy softening remains.
21. Stage 3C snapshot/source identity protections remain.
22. Stage 3B officialness remains.
23. Stage 3A malformed-input hardening remains.
24. No meaningful-change threshold added.
25. No near-tie margin added.
26. No unrelated product logic changed.

## Acceptance criteria

Do not mark Stage 3D-C complete unless all are true:

1. One authoritative exact-tie detection/focus-selection helper exists.

2. New current snapshots preserve tie metadata.

3. MovementAssessments preserve approved effective focus and tie metadata.

4. First-baseline exact tie follows approved policy.

5. Official re-test exact tie preserves current active focus when appropriate.

6. Manual/quick ties remain display-only.

7. User copy is tie-aware and does not claim a clear weakness.

8. Backend sync/restore preserves or safely rejects tie metadata.

9. Direct block creation cannot bypass tie policy.

10. Non-tie behavior is unchanged.

11. Near-tie behavior is not implemented.

12. Stage 3A/3B/3C/3D-A regressions pass.

13. Targeted tests pass.

14. Full tests pass.

15. Typecheck passes.

16. Expo config passes.

17. git diff --check passes.

18. No new warning is introduced without explanation.

19. No unrelated user work is reverted or overwritten.

20. No commit, staging, branch, or push occurs.

## Stage decision

At the end of the report, state exactly one:

- STAGE 3D-C COMPLETE
- STAGE 3D-C BLOCKED

Also state:

- STAGE 3D-B REQUIRED
- STAGE 3D-D REQUIRED
- STAGE 4 UNBLOCKED
- STAGE 5 INPUTS READY or STAGE 5 INPUTS BLOCKED

Use STAGE 5 INPUTS READY only if exact tie policy is implemented enough that workout generation can be audited against stable focus-domain inputs, even while norm provenance and meaningful-change work remain pending.

If balanced/general focus is not supported and deterministic fallback is used, explicitly decide whether Stage 5 inputs are ready with fallback semantics or still blocked by lack of balanced focus.

## Final Codex response

Return a concise summary containing:

- Remediation report path.
- Whether production code changed.
- Exact tie policy implemented.
- Whether balanced/general focus is supported.
- Deterministic fallback policy, if any.
- Snapshot tie metadata behavior.
- Assessment tie metadata behavior.
- Baseline tie behavior.
- Re-test tie behavior.
- Manual/quick tie behavior.
- Files changed.
- Tests added/changed.
- Targeted validation result.
- Full suite result.
- Typecheck result.
- Expo config result.
- git diff --check result.
- Confirmation that near-tie policy was not implemented.
- Confirmation that scoring/norms were unchanged.
- Confirmation that Stage 3A/3B/3C/3D-A protections remain.
- Remaining Stage 3D blockers.
- STAGE 3D-C COMPLETE or STAGE 3D-C BLOCKED.
- STAGE 3D-B REQUIRED.
- STAGE 3D-D REQUIRED.
- STAGE 4 UNBLOCKED.
- STAGE 5 INPUTS READY or STAGE 5 INPUTS BLOCKED.
- Initial and final Git status.
- Any concurrent external changes.
- Confirmation that no commit, staging, branch, or push occurred.
