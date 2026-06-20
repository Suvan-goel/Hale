You are implementing Stage 3D-D of Hale’s production-readiness work:

INTERIM NEAR-TIE POLICY, FOCUS-STABILITY RULES, AND MEANINGFUL-CHANGE NEUTRALIZATION

This is a focused production-code remediation and verification task.

Do not begin Stage 3D-B, Stage 4, Stage 5, workout-generation remediation, exercise-catalogue remediation, norm-source verification, or beta-device validation in this task.

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
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_C.md

Treat the current working tree as the source of truth. Re-verify relevant call paths before editing because report line numbers may no longer be exact.

## Current stage status

Completed:
- Stage 3A: malformed scoring input fails closed.
- Stage 3B: all-three-domain officialness, partial recovery, manual/quick isolation.
- Stage 3C + 3C.1: versioned frozen score snapshots, source-identity hardening, no silent historical rescoring.
- Stage 3D-A: beta-safe display/copy softening.
- Stage 3D-C: exact tie detection, exact tie metadata, deterministic fallback, active-focus preservation on exact tied re-tests, tie-safe copy.

Still required:
- Stage 3D-B: norm provenance/source verification and documentation.
- Stage 3D-D: interim near-tie policy and meaningful-change neutralization.
- Stage 4: exercise catalogue/progression audit.
- Stage 5: dynamic workout generation audit.

Stage 3D-C made exact-tie inputs ready, but it explicitly left near ties, rounding equality, and meaningful-change thresholds out of scope.

## Product policy for Stage 3D-D

The product direction is:

1. Do not pretend we have precise device-repeatability thresholds yet.
2. Do not implement domain-specific smallest-detectable-change thresholds until real-device validation exists.
3. Add a conservative interim near-tie / closely-matched policy so tiny differences do not silently flip the user’s focus.
4. For first official baseline near ties:
   - Use the same concrete deterministic fallback as Stage 3D-C if balanced/general focus is not supported end-to-end.
   - Display “closely matched” / “suggested focus” copy.
   - Record that the focus came from an interim near-tie fallback.
5. For official re-test near ties:
   - Preserve the current active block focus if that focus is in the near-tied group.
   - Do not flip focus based on a tiny difference.
6. For manual/quick near ties:
   - Display only.
   - No block creation.
   - No Progress authority.
   - No lifecycle effect.
7. For improvement/decline:
   - Do not claim “improved,” “declined,” or “held steady” from small numerical differences.
   - Use neutral copy unless the code can justify a clearly meaningful threshold.
   - Prefer “recorded higher,” “recorded lower,” “similar result,” “another data point,” and “not enough evidence to call this a meaningful change.”
8. Mark all near-tie and change thresholds as interim beta policy, not scientific truth.

## Primary objective

Implement a beta-safe interim policy so Hale avoids overreacting to tiny score differences before device-repeatability validation.

Specifically:
1. Add explicit near-tie detection for complete official domain scores.
2. Store near-tie metadata in current snapshots and assessments where safe.
3. Preserve the current active focus on official re-tests when the active focus is near-tied.
4. Use deterministic fallback for first-baseline near ties if balanced/general focus is still unsupported.
5. Keep manual/quick near ties display-only.
6. Neutralize any remaining improvement/decline/held-steady claims that still imply validated meaningful change.
7. Preserve Stage 3A, 3B, 3C/3C.1, 3D-A, and 3D-C behavior.
8. Keep scoring formulas, norms, and raw score values unchanged.
9. Make Stage 5 inputs stable enough to audit dynamic workout generation against clear focus-selection semantics.

## Scope boundary

This task may change:
- focus-selection helper(s);
- focus-selection metadata;
- score snapshot optional metadata;
- MovementAssessment focus metadata;
- block eligibility around near-tie effective focus;
- re-test next-block focus selection;
- view-model copy for near ties;
- report/progress display language around change;
- copy guardrail tests;
- tests for focus selection, snapshots, assessments, eligibility, reports, progress, sync/restore;
- the Stage 3D-D remediation report.

This task must not change:
- scoring formulas.
- norm tables.
- norm anchors.
- movement-age calculations.
- Stage 3A malformed-input validation.
- Stage 3B officialness/manual isolation.
- Stage 3C frozen historical behavior.
- Stage 3C source-identity hardening.
- Stage 3D-A copy/display softening.
- Stage 3D-C exact-tie behavior.
- Check-Up measurement logic.
- camera readiness.
- exercise catalogue.
- workout generation content.
- workout progression.
- session completion semantics.
- backend schema unless existing JSON metadata can carry the field.
- account isolation.
- broad UI design.
- device-validation experiments.

Do not perform opportunistic refactors.

## Important distinction

This task introduces an interim beta near-tie policy, not validated clinical thresholds.

Near-tie policy is for focus stability only. It should prevent tiny differences from causing arbitrary training-focus changes.

Meaningful-change policy is for user-facing progress/report language only. It should avoid claims until thresholds are validated.

Do not rewrite the scoring model. Do not change stored domain age ranges or scores. Do not modify norms. Do not claim the thresholds are scientifically validated.

## Working interim definitions

Use the current focus-comparison value already used for focus selection, likely the domain age-range midpoint or equivalent internal score.

Recommended interim near-tie policy:

- Define `INTERIM_NEAR_TIE_MARGIN_YEARS = 5` for focus-selection values expressed as age years.
- A domain is in the near-tied focus group if its focus-comparison value is within 5 years of the worst/highest focus-comparison value.
- If near-tied group size is 1, it is a clear focus.
- If near-tied group size is 2 or 3, it is a near tie.
- Exact ties remain exact ties and should preserve Stage 3D-C exact-tie metadata/reasons.
- Near ties should have separate metadata from exact ties.

Reason for 5 years:
- It is conservative enough to prevent false precision from sub-year and tiny multi-year differences.
- It aligns with Stage 3D’s recommendation to avoid sub-5-year user-facing improvement claims.
- It is explicitly interim until real-device repeatability data exists.

If you find a better existing project constant or policy, use it only if it is already documented. Otherwise use the 5-year interim margin and document that it is a product safety threshold, not a validated measurement threshold.

## Locked Stage 3D-D rules

### 1. Exact ties remain exact ties

Do not degrade exact-tie behavior implemented in Stage 3D-C.

If domains are exactly equal:
- keep `kind: exact_tie` or the existing exact-tie metadata.
- keep exact tie-break reasons.
- keep exact tie tests passing.
- do not reclassify exact ties as near ties.

### 2. Near-tie detection

For a complete three-domain current score:
- Compute the worst/highest focus-comparison value.
- Include domains whose value is within the interim near-tie margin of that worst value.
- If the group contains two or three domains and the values are not exactly tied, classify as near tie.
- Store stable tied/near-tied domains in stable score-domain order.
- Do not use display-rounded values.
- Do not include unmeasured domains.
- Do not include supporting metrics.
- Do not include manual/quick results in official decisions.

### 3. Near-tie metadata

Add minimal, backwards-compatible metadata.

Conceptually:

```ts
type FocusSelectionKind = 'clear' | 'exact_tie' | 'near_tie';

type FocusSelection = {
  kind: FocusSelectionKind;
  focusDomain: ScoreDomain;
  tiedDomains: ScoreDomain[];
  nearTiedDomains?: ScoreDomain[];
  tieBreakReason?:
    | 'deterministic_fallback'
    | 'preserve_current_focus'
    | 'near_tie_deterministic_fallback'
    | 'near_tie_preserve_current_focus'
    | null;
  nearTieMarginYears?: number;
  policyVersion?: number;
};
```

Adapt this to the actual repository types.

Requirements:
- Preserve existing exact-tie metadata.
- Store the margin used for near ties.
- Store effective focus.
- Store reason for effective focus.
- Preserve old snapshots without near-tie metadata.
- Do not invalidate old snapshots solely due to missing near-tie metadata.
- Do not silently rewrite old snapshots.
- Do not rescore historical raw Check-Ups to create near-tie metadata.

### 4. First official baseline near tie

For a complete official baseline or baseline retake:
- If focus selection is clear, preserve current clear behavior.
- If exact tie, preserve Stage 3D-C behavior.
- If near tie:
  - if balanced/general focus is unsupported, use deterministic concrete fallback among near-tied domains in stable order.
  - record reason `near_tie_deterministic_fallback`.
  - display closely matched copy.
  - create block only if the effective focus is valid and traceable.

Do not add fake balanced/general focus.

### 5. Official re-test near tie

For a complete official re-test:
- If active block focus is among near-tied domains:
  - preserve active focus.
  - record reason `near_tie_preserve_current_focus`.
- If active block focus is not among near-tied domains:
  - use deterministic fallback among near-tied domains.
  - record reason `near_tie_deterministic_fallback`.
- If no active block exists:
  - use first-baseline near-tie policy.

This prevents tiny differences from causing focus flips.

### 6. Manual/quick near tie

Manual extra and quick recheck near ties may store/display near-tie metadata.

They must not:
- create a block;
- seed next block;
- affect official Progress;
- affect lifecycle;
- replace official focus.

### 7. Meaningful-change neutralization

Do not add validated improvement/decline thresholds.

Instead:
- Audit current progress/report labels after Stage 3D-A.
- Remove or neutralize any remaining “improved,” “declined,” “worse,” “held steady,” or equivalent claim where it implies meaningful change.
- Keep raw metric observations if useful:
  - “recorded higher”
  - “recorded lower”
  - “similar result”
  - “added another data point”
- For small differences, use:
  - “similar result”
  - “not enough evidence to call this a meaningful change”
  - “Hale will look for repeatable change over time.”

If existing code has statuses named `improved` internally, either:
- keep internal names but map to neutral display labels, or
- introduce display-level neutral statuses.
Do not overhaul internal data contracts unless necessary.

### 8. Copy rules

Near-tie copy:
- “Your results were closely matched.”
- “These areas are close enough that Hale is using a practical starting focus.”
- “These areas are closely matched, so Hale is keeping your current focus.”
- “Suggested focus”
- “Another data point”

Avoid:
- “weakest”
- “weakness”
- “main opportunity”
- “clear weakest”
- “problem area”
- “improved”
- “declined”
- “held steady”
- “better/worse” unless clearly framed as raw recorded value, not meaningful change.

### 9. Preserve non-near-tie behavior

For clear complete official scores:
- focus behavior remains unchanged.
- block creation remains unchanged.
- copy remains Stage 3D-A softened.
- score snapshots remain compatible.
- reports remain compatible.

For exact ties:
- Stage 3D-C behavior remains unchanged.

For old records:
- no historical rescore.
- no metadata injection on read.
- no rewrite on read.

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

## Step 1: Re-verify current Stage 3D-C focus architecture

Before editing, inspect:
- src/scoring/focusSelection.ts
- src/scoring/scoring.ts
- src/scoring/scoreSnapshot.ts
- src/scoring/versions.ts
- src/haleFlow/assessments.ts
- src/haleFlow/assessmentEligibility.ts
- src/haleFlow/assessmentResultState.ts
- src/haleFlow/checkupHistory.ts
- src/haleFlow/progressViewModel.ts
- src/haleFlow/reports.ts
- src/adherence/types.ts
- src/adherence/blockService.ts
- src/adherence/screens/BlockReportScreen.tsx
- App.tsx
- Results/OnboardingResults/Progress/BlockReport screens
- backend sync/restore tests
- relevant copy guardrails and focus tests.

Document:
- exact tie metadata shape from Stage 3D-C;
- exact deterministic fallback order;
- active-focus preservation path;
- snapshot optional metadata approach;
- assessment metadata approach;
- block eligibility checks;
- result/progress/report tie copy;
- remaining places that use change/improvement language.

Do not edit until this trace is complete.

## Step 2: Extend focus-selection helper for near ties

Update the authoritative focus-selection helper.

Required behavior:
- clear focus when only one domain is within margin.
- exact tie when values exactly equal.
- near tie when two or three domains are within margin but not exactly equal.
- stable order.
- no display-rounded values.
- no unmeasured/supporting metrics.
- fail closed on malformed bounds.
- preserve current exact-tie behavior.
- support an optional active/current focus input for re-test preservation.

Add tests for:
1. clear strength focus outside margin.
2. clear balance focus outside margin.
3. clear mobility focus outside margin.
4. exact strength/balance tie remains exact tie.
5. exact three-way tie remains exact tie.
6. near strength/balance tie within 5 years.
7. near strength/mobility tie within 5 years.
8. near balance/mobility tie within 5 years.
9. near three-way tie within 5 years.
10. just outside margin is clear.
11. exactly at margin counts as near tie.
12. display-rounded equality but outside internal margin is not near tie.
13. malformed measured domain fails closed.
14. incomplete score has no official focus.
15. active focus among near-tied domains is preserved.
16. active focus not in near-tied domains falls back.
17. manual/quick metadata can exist but is not official.

## Step 3: Extend snapshot metadata

Update current snapshot creation/parsing to preserve near-tie metadata.

Tests:
- clear snapshot unchanged except optional policy metadata if applicable.
- exact tie snapshot unchanged from Stage 3D-C.
- near tie snapshot stores near-tied domains.
- near tie snapshot stores margin.
- near tie snapshot stores reason.
- JSON round-trip preserves near-tie metadata.
- backend-safe serialization.
- old snapshot without near-tie metadata parses safely.
- malformed near-tie metadata fails closed.
- source mismatch still fails closed.
- no historical rescore to create near-tie metadata.

Do not bump schema unless absolutely necessary. Prefer optional metadata compatible with Stage 3C.

## Step 4: Update MovementAssessment metadata

MovementAssessment should mirror near-tie metadata for current new assessments.

Tests:
- clear focus assessment.
- exact tie assessment unchanged.
- near-tie first baseline assessment.
- near-tie re-test preserves current focus.
- near-tie manual assessment is non-official.
- old restored assessment without near-tie metadata remains safe.
- contradictory near-tie metadata fails closed in eligibility.

## Step 5: Update block eligibility and block service

Eligibility must accept near-tie effective focus only when it follows approved policy.

Tests:
- clear focus current official eligible.
- exact tie current official eligible under Stage 3D-C policy.
- near-tie baseline eligible with deterministic fallback.
- near-tie re-test eligible with preserved active focus when active focus is in near-tied group.
- near-tie re-test fallback when active focus not in near-tied group.
- near-tie missing metadata fails closed for new current records where near tie is detectable.
- contradictory near-tie metadata fails closed.
- unsupported balanced focus remains rejected.
- manual near tie remains ineligible.
- direct block-service caller cannot bypass.

Do not weaken Stage 3B or Stage 3C gates.

## Step 6: Update re-test/next-block flow

Trace the official re-test completion path.

Ensure the active block focus is passed into focus selection/snapshot creation so near-tied re-tests can preserve current focus.

Tests:
- active strength block + near tie includes strength -> next block keeps strength.
- active balance block + near tie includes balance -> next block keeps balance.
- active mobility block + near tie includes mobility -> next block keeps mobility.
- active focus not in near-tie group -> fallback.
- exact tie behavior from Stage 3D-C still passes.
- clear focus still changes when genuinely outside margin.
- no active block -> first-baseline behavior.
- report copy explains closely matched/preserved focus.
- backend restore preserves the selected focus.

## Step 7: Neutralize remaining meaningful-change claims

Search production user-facing copy and view-model output for:
- improved
- improvement
- declined
- decline
- worsened
- worse
- held steady
- better
- poorer
- progress protected
- meaningful change
- main improvement

Classify each as:
- internal/test-only;
- safe aspirational;
- raw metric observation;
- unsafe meaningful-change claim.

Update unsafe production user-facing copy to neutral alternatives.

Do not remove useful raw observations.

Do not introduce thresholds.

Add tests/guardrails so unsafe claims cannot reappear in result/progress/report contexts.

## Step 8: Update Progress and Report view models

Ensure Progress and Reports communicate changes neutrally.

Required behavior:
- Compatible current-version comparisons may still show raw/domain observations.
- They must not claim meaningful improvement/decline without thresholds.
- Small differences should not produce “improved”/“declined” user labels.
- Incompatible comparisons remain unavailable.
- Near-tie focus copy is clear.
- Exact-tie copy remains clear.
- Manual/quick isolation remains.

Tests:
- 0.1-year difference -> neutral.
- 0.49-year difference -> neutral.
- 1-year difference -> neutral unless already explicitly raw-observation language.
- 4.9-year difference -> neutral.
- 5-year difference -> still not “improved” unless this task explicitly chooses a display-only threshold; recommended: neutral.
- one domain higher, one lower -> neutral mixed copy.
- supporting metric changes while headline score unchanged -> raw observation only.
- hinge changes while mobility age unchanged -> forward-reach observation, not mobility improved.
- report with near-tied re-test keeps focus and neutral copy.
- report with exact tie remains Stage 3D-C behavior.

## Step 9: Preserve backend sync/restore

Near-tie metadata must round-trip through existing JSON metadata.

Tests:
- current clear snapshot syncs/restores.
- exact tie snapshot syncs/restores.
- near-tie snapshot syncs/restores.
- near-tie assessment syncs/restores.
- malformed near-tie metadata fails closed.
- old snapshot without near-tie metadata remains safe.
- source mismatch remains fail closed.
- no raw historical rescore.

Do not add migrations unless absolutely required.

## Step 10: Preserve Stage 3D-A and Stage 3D-C copy guardrails

Update copy guardrails to include any remaining meaningful-change overclaim terms in user-facing result/progress/report contexts.

Ensure existing Stage 3D-A and 3D-C guardrails still pass:
- no unqualified movement-age claims.
- no camera measured.
- no typical age without caveat.
- no protect progress.
- no weakness/weakest area/main opportunity.
- no tie result claiming clear weakness.

Add guardrails for unsafe use of:
- improved;
- declined;
- held steady;
- worsened;
- main improvement;
- meaningful change claim without explicit threshold support.

Be careful not to ban harmless developer comments or test descriptions if scoped scanning can avoid them.

## Step 11: Regression matrix

Run and/or add tests proving:

### Stage 3A
- malformed input fails closed.
- valid output unchanged.

### Stage 3B
- all-three-domain requirement remains.
- manual/quick isolated.
- partial results retryable.
- exact types preserved.

### Stage 3C/3C.1
- snapshots frozen.
- source identity checked.
- incompatible versions fail closed.
- no historical rescore.

### Stage 3D-A
- performance-band-first display remains.
- beta-safe copy remains.
- no unqualified movement-age copy returns.

### Stage 3D-C
- exact tie behavior remains.
- exact tie metadata remains.
- re-test exact tie preserves active focus.
- no near-tie behavior corrupts exact-tie behavior.

### Current task
- near ties detected.
- first baseline near tie deterministic fallback works.
- re-test near tie preserves active focus.
- manual/quick near tie display-only.
- meaningful-change claims neutralized.
- no scoring/norm changes.

## Validation commands

Run targeted tests for:
- focus selection.
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
- Stage 3A/3B/3C/3D-A/3D-C regression suites.

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

docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_D.md

Do not edit previous reports.

The report must include:
1. Scope.
2. Initial Git status.
3. Stage 3D findings addressed.
4. Approved interim near-tie policy implemented.
5. Current focus-selection architecture.
6. Near-tie detection rule.
7. Exact-tie preservation.
8. Near-tie metadata shape.
9. Snapshot near-tie behavior.
10. MovementAssessment near-tie behavior.
11. First-baseline near-tie behavior.
12. Official re-test near-tie behavior.
13. Manual/quick near-tie behavior.
14. Meaningful-change neutralization.
15. Copy/guardrail changes.
16. Block eligibility changes.
17. Report/next-block changes.
18. Backend sync/restore changes.
19. Files changed.
20. Tests added/changed.
21. Exact validation results.
22. Stage 3A/3B/3C/3D-A/3D-C regression verification.
23. Remaining Stage 3D blockers.
24. Whether Stage 5 inputs are now ready or still blocked.
25. Initial and final Git status.
26. Concurrent external changes.
27. Confirmation that no commit/staging/branch/push occurred.

## Required invariant outcomes

After Stage 3D-D:
1. Exact ties still behave exactly as Stage 3D-C specified.
2. Near ties are detected using explicit interim margin.
3. Near ties are separate from exact ties.
4. Near-tie metadata is stored for new current snapshots.
5. Near-tie metadata survives JSON round-trip.
6. Near-tie metadata survives backend sync/restore.
7. Old snapshots without near-tie metadata remain safe.
8. First baseline near tie uses documented deterministic fallback if balanced is unsupported.
9. First baseline near-tie copy says closely matched.
10. Re-test near tie preserves active focus when active focus is in near-tied group.
11. Re-test near tie does not arbitrarily flip focus.
12. Manual/quick near tie has no official effect.
13. Block eligibility requires approved focus origin.
14. Direct block-service caller cannot bypass near-tie policy.
15. Clear focus behavior remains unchanged when outside margin.
16. No meaningful-change threshold is claimed as validated.
17. User-facing improvement/decline/held-steady claims are neutralized.
18. Score formulas unchanged.
19. Norm tables unchanged.
20. Stage 3D-A copy softening remains.
21. Stage 3D-C exact-tie protections remain.
22. Stage 3C snapshot/source identity protections remain.
23. Stage 3B officialness remains.
24. Stage 3A malformed-input hardening remains.
25. No device-validation claim added.
26. No unrelated product logic changed.

## Acceptance criteria

Do not mark Stage 3D-D complete unless all are true:
1. Authoritative focus-selection helper supports exact ties and near ties distinctly.
2. Near-tie margin is explicit, tested, and documented as interim.
3. New current snapshots preserve near-tie metadata.
4. MovementAssessments preserve near-tie effective focus metadata.
5. First-baseline near-tie policy works.
6. Official re-test near-tie preserves active focus when appropriate.
7. Manual/quick near ties remain display-only.
8. User copy is near-tie-aware and does not claim clear weakness.
9. Remaining meaningful-change overclaims are neutralized.
10. Backend sync/restore preserves or safely rejects near-tie metadata.
11. Direct block creation cannot bypass near-tie policy.
12. Clear focus behavior remains unchanged.
13. Exact tie behavior remains unchanged.
14. Stage 3A/3B/3C/3D-A/3D-C regressions pass.
15. Targeted tests pass.
16. Full tests pass.
17. Typecheck passes.
18. Expo config passes.
19. git diff --check passes.
20. No new warning is introduced without explanation.
21. No unrelated user work is reverted or overwritten.
22. No commit, staging, branch, or push occurs.

## Stage decision

At the end of the report, state exactly one:
- STAGE 3D-D COMPLETE
- STAGE 3D-D BLOCKED

Also state:
- STAGE 3D-B REQUIRED
- STAGE 4 UNBLOCKED
- STAGE 5 INPUTS READY or STAGE 5 INPUTS BLOCKED

Use STAGE 5 INPUTS READY only if:
- clear focus, exact tie, and near-tie focus semantics are stable;
- first-baseline and re-test behavior are documented and tested;
- meaningful-change labels no longer contaminate next-block/focus interpretation;
- workout generation can now be audited against stable focus inputs even while norm-source verification remains pending.

## Final Codex response

Return a concise summary containing:
- Remediation report path.
- Whether production code changed.
- Interim near-tie policy implemented.
- Near-tie margin.
- Exact tie preservation.
- Baseline near-tie behavior.
- Re-test near-tie behavior.
- Manual/quick near-tie behavior.
- Meaningful-change neutralization.
- Snapshot near-tie metadata behavior.
- Assessment near-tie metadata behavior.
- Files changed.
- Tests added/changed.
- Targeted validation result.
- Full suite result.
- Typecheck result.
- Expo config result.
- git diff --check result.
- Confirmation that scoring/norms were unchanged.
- Confirmation that Stage 3A/3B/3C/3D-A/3D-C protections remain.
- Remaining Stage 3D blockers.
- STAGE 3D-D COMPLETE or STAGE 3D-D BLOCKED.
- STAGE 3D-B REQUIRED.
- STAGE 4 UNBLOCKED.
- STAGE 5 INPUTS READY or STAGE 5 INPUTS BLOCKED.
- Initial and final Git status.
- Any concurrent external changes.
- Confirmation that no commit, staging, branch, or push occurred.
