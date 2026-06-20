You are implementing Stage 3D-A of Hale’s production-readiness work:

MOVEMENT-AGE DISPLAY, CLAIM SOFTENING, AND BETA-SAFE INTERPRETATION COPY

This is a focused production-code remediation task.

Do not begin Stage 3D-B, Stage 3D-C, Stage 4, Stage 5, workout-generation remediation, exercise-catalogue remediation, or beta-device validation in this task.

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

Treat the current working tree as the source of truth. Re-verify relevant call paths before editing because report line numbers may no longer be exact.

## Stage 3D baseline

Stage 3D was a read-only audit. It concluded:

- STAGE 3D REMEDIATION REQUIRED.
- STAGE 4 UNBLOCKED.
- STAGE 5 INPUTS BLOCKED.

Stage 3D found that Hale’s scoring pipeline is now much safer after Stages 3A, 3B, 3C, and 3C.1, but the interpretation/copy layer still overstates certainty.

Key Stage 3D findings:

- Norm provenance requires external review for all domains.
- Strength/power age is beta-provisional.
- Balance age is beta-blocked for public age claims.
- Mobility age is beta-blocked for public age claims.
- Movement-age display should use beta-labelled ranges only after source review; performance bands are safer for beta.
- Exact tie policy is still missing.
- Near-tie policy should wait for device repeatability data.
- Meaningful-change thresholds are not validated.
- Progress/report language currently treats tiny numerical changes as improvement/decline.
- Several user-facing claims should be softened, beta-labelled, hidden, or removed.

This Stage 3D-A task addresses only the highest-ROI copy/display problem: reduce overclaiming and make the current beta interpretation safer without altering scoring or training logic.

## Confirmed risks being addressed

Stage 3D audited 27 user-facing claims and classified them as:

- 2 safe as-is.
- 15 safe if softened.
- 7 safe only with beta/provisional label.
- 2 should be hidden until validation.
- 1 should be removed.

The highest-risk claim categories are:

1. Authoritative “movement age” / “typical age” claims.
2. “Camera measured” language that sounds too certain.
3. “Validated movement tests” language that sounds clinical.
4. “Weakest area” / “main opportunity” language that hides tie and measurement uncertainty.
5. “Improved” / “declined” / “held steady” language without meaningful-change thresholds.
6. “Protects progress” / “stay capable” copy that may imply guaranteed independence or preservation.
7. Family/mock movement-age fixture values that may appear real.

## Primary objective

Make Hale’s result, progress, report, onboarding, and summary copy beta-safe by:

1. Replacing authoritative movement-age presentation with softer performance-band-first interpretation.

2. Labelling any remaining age-like output as a beta home movement estimate.

3. Hiding or de-emphasising balance-age and mobility-age claims until norm provenance and protocol issues are resolved.

4. Replacing “measured” certainty language with “estimated” where appropriate.

5. Replacing “weakest area” / “main opportunity” with “suggested focus” or equivalent.

6. Removing or softening “improved,” “declined,” and “held steady” claims until meaningful-change thresholds exist.

7. Removing or softening claims that imply medical-grade validation, diagnosis, fall-risk prediction, treatment, disease prevention, or guaranteed independence.

8. Preserving the underlying score snapshots, raw scores, frozen historical values, and block focus data for future remediation.

This is a user-facing interpretation/copy safety patch. It is not a scoring patch.

## Scope boundary

This task may change:

- Result-screen copy.
- Onboarding result copy.
- Progress copy/view-model labels.
- Block report copy/view-model labels.
- Today/Plan summary wording where it repeats score claims.
- Home/Welcome/Safety copy where it overstates evidence.
- Family/mock movement-age display if reachable.
- Copy guardrail tests.
- Screen/view-model tests that assert old overconfident wording.
- Narrow helper names/types only if needed to distinguish display labels from scoring semantics.
- The Stage 3D-A remediation report.

This task must not change:

- scoring formulas.
- norm tables.
- norm anchors.
- movement-age calculations.
- score snapshots.
- scoring/norm versioning.
- Stage 3A malformed-input validation.
- Stage 3B all-three-domain officialness.
- Stage 3C frozen historical score behavior.
- exact Check-Up type handling.
- official/manual isolation.
- Check-Up measurement logic.
- camera readiness.
- exercise catalogue.
- workout generation.
- block focus logic.
- tie policy.
- near-tie policy.
- meaningful-change thresholds.
- device validation requirements.
- backend schema.
- account isolation.
- broad visual redesign.

Do not perform opportunistic refactors.

## Important distinction

The internal score may still contain age ranges because Stage 3C freezes historical score snapshots.

Do not remove age fields from score snapshots.

Do not change the score object shape.

Do not delete historical age ranges from data.

Instead, change what the app emphasizes to users during beta.

It is acceptable for internal scores and snapshots to retain age ranges, while user-facing UI displays:

- performance bands,
- beta estimate labels,
- neutral descriptions,
- and supporting metric rows.

## Locked Stage 3D-A product rules

### 1. Performance-band-first beta display

For beta, the primary user-facing interpretation should be a performance band or plain-language status, not an authoritative age.

Preferred examples:

- “Strong”
- “Building”
- “Starting point”
- “Needs practice”
- “Good baseline”
- “Home movement estimate”
- “Beta estimate”

Use the app’s existing calm, premium, mature tone.

Do not introduce gamified, childish, clinical, or shame-based labels.

Avoid:

- “bad”
- “poor”
- “failed”
- “frail”
- “risk”
- “diagnosis”
- “medical-grade”

### 2. Movement-age language becomes beta/provisional where retained

Where an age range remains visible, it must be clearly caveated.

Acceptable patterns:

- “Beta estimate: typical of age X–Y”
- “Home movement estimate: age X–Y”
- “Estimated range: X–Y”
- “This is an estimate from your home Movement Check-Up.”

Prefer hiding age ranges for balance and mobility until later norm review if the UI can remain coherent using bands and raw metrics.

Do not show unqualified:

- “Typical of age X–Y”
- “Your movement age is X”
- “Your balance age is X”
- “Your mobility age is X”

### 3. Domain-specific wording

Use wording that matches the metric that actually drives the score.

Strength:

- Current headline driver: chair-stand repetitions.
- Rise velocity is supporting only.
- Safer wording:
  - “Chair-rise strength”
  - “Lower-body strength estimate”
  - “Chair-stand result”
- Avoid implying that “power age” is driven by rise velocity.

Balance:

- Current headline driver: single-leg hold.
- Safer wording:
  - “One-leg balance hold”
  - “Balance hold estimate”
- Avoid broad authoritative “balance age” claims.

Mobility:

- Current headline driver: shoulder flexion.
- Hinge reach is supporting only.
- Safer wording:
  - “Shoulder mobility estimate”
  - “Shoulder reach result”
  - “Forward reach” as a separate supporting row.
- Avoid implying that hinge reach and shoulder flexion jointly determine “mobility age.”

### 4. Weakest-domain language becomes “suggested focus”

Do not use overconfident wording such as:

- “weakest area”
- “your weakness”
- “main weakness”
- “problem area”

Use:

- “suggested focus”
- “area to focus on”
- “first focus”
- “a useful area to train”
- “Hale’s suggested focus from this Check-Up”

This preserves the training loop while reducing false precision.

### 5. Improvement/decline language becomes neutral

Until meaningful-change thresholds exist, avoid:

- “improved”
- “declined”
- “got worse”
- “held steady”
- “main improvement”
- “progress protected”
- “you improved by X years”

Use neutral alternatives:

- “changed”
- “recorded higher”
- “recorded lower”
- “latest result”
- “compared with last time”
- “new data point”
- “similar to last time”
- “not enough evidence to call this a meaningful change”

For reports, prefer:

- “What changed”
- “Latest re-test”
- “Comparison”
- “Another data point”
- “Direct comparison unavailable”

Do not implement meaningful-change thresholds in this task.

### 6. Evidence/medical safety copy

Replace or soften overconfident terms:

- “Camera measured” -> “Camera estimated”
- “validated movement tests” -> “published movement tests” or “guided movement checks”
- “protects progress” -> “supports the progress you’re working on”
- “stay capable” can remain if framed aspirationally, not as a guarantee.
- “diagnosis”, “fall risk”, “medical-grade”, “treatment”, “disease prevention”, “guaranteed independence” must not appear.

Keep or add calm disclaimers where appropriate:

- “Hale is not a medical assessment.”
- “These are home movement estimates.”
- “Small changes can reflect setup or day-to-day variation.”
- “Hale looks for repeatable changes over time.”

Do not make the app sound scary or clinical.

### 7. Copy must remain premium and pleasant

The app is for adults roughly aged 45–65.

Tone:

- calm,
- warm,
- premium,
- trustworthy,
- mature,
- non-medical,
- non-childish.

Avoid:

- alarmist copy,
- shame,
- infantilizing language,
- technical jargon,
- exaggerated longevity claims.

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
    - record them,
    - do not overwrite them,
    - continue only if task-owned files remain safe,
    - otherwise stop code mutation and report the conflict.

Important: Stage 3D reported a concurrent/user-owned `ExploreScreen` import/typecheck issue. Before implementing, check whether `npm run typecheck` currently fails for unrelated Explore files. If it does, do not fix that issue in this task unless it is necessary to restore the validation baseline and clearly user-approved. Record it honestly.

## Step 1: Re-verify current copy and display surfaces

Before editing, inspect every surface listed in Stage 3D’s claim register.

At minimum inspect:

- src/screens/ResultsScreen.tsx
- src/screens/OnboardingResultsScreen.tsx
- src/screens/ProgressScreen.tsx
- src/screens/TodayScreen.tsx
- src/screens/PlanScreen.tsx
- src/screens/HomeScreen.tsx, if present
- src/screens/WelcomeScreen.tsx
- src/screens/SafetyProfileScreen.tsx
- src/adherence/screens/BlockReportScreen.tsx
- src/haleFlow/progressViewModel.ts
- src/haleFlow/reports.ts
- src/haleFlow/assessmentResultState.ts
- src/haleFlow/copy.ts
- src/family/fixture.ts, if present/reachable
- copy guardrail tests
- result/progress/report screen tests
- any Learn/explanation content related to results, movement age, or progress.

Create an internal checklist from the Stage 3D claim register.

Do not edit until you know which claims are still present in the current working tree.

## Step 2: Replace unqualified age claims

Find all user-visible instances of:

- “Typical of age”
- “Typical ages”
- “movement age”
- “strength age”
- “balance age”
- “mobility age”
- “age range”
- any equivalent wording.

Classify each instance as:

- result screen primary display;
- supporting detail;
- historical display;
- mock/family fixture;
- test-only;
- documentation/comment.

For production user-facing UI:

- Prefer performance-band-first display.
- If age range remains visible, add beta/home-estimate label.
- Hide balance/mobility age ranges if a clear band/raw metric can replace them without breaking the UI.
- Do not remove frozen score data.
- Do not change scoring values.

Update tests to assert safer wording.

## Step 3: Soften result-screen interpretation

For `ResultsScreen` and `OnboardingResultsScreen`:

Required behavior:

- Complete official result still shows all measured domain cards.
- Primary copy uses “home movement estimate” or equivalent.
- Domain cards show performance bands first.
- Age range, if shown, is labelled beta/provisional.
- “weakest area” becomes “suggested focus.”
- Plan CTA copy does not imply clinical certainty.
- Partial/incomplete states from Stage 3B remain intact.
- Manual/quick non-official states remain intact.
- No plan CTA appears for manual/quick/incomplete.
- Supporting rows remain visible where useful.
- Hinge reach is clearly supporting, not the driver of mobility age.
- Rise velocity is clearly supporting, not the driver of strength age.

Add or update tests for:

- full official result copy;
- incomplete official result copy;
- manual extra result copy;
- mobility card with shoulder + hinge;
- balance card;
- focus CTA.

## Step 4: Soften Progress copy and trends

For Progress surfaces and `progressViewModel`:

Required behavior:

- “Camera measured” becomes “Camera estimated” or equivalent.
- Latest official summary avoids authoritative age claims.
- Progress cards avoid “improved/declined/held steady” unless current code already has validated meaningful thresholds, which it does not.
- Use neutral labels:
  - “recorded higher”
  - “recorded lower”
  - “similar result”
  - “latest result”
  - “another data point”
- If a raw metric changes but threshold is not validated, do not call it “improvement.”
- Official Progress still uses Stage 3B/3C selectors and frozen snapshots.
- Manual/quick isolation remains intact.
- Incompatible comparison-unavailable states remain intact.
- No meaningful-change threshold is invented.

Update tests that asserted old “improving/stable/watch” copy.

Do not change the underlying raw trend calculations except where necessary to produce neutral labels.

If the current view model encodes semantic statuses like `improving`, `stable`, or `watch`, either:
- map them to neutral display labels without changing underlying type, or
- add beta-neutral display fields while preserving internal compatibility.

Do not introduce new official progress semantics.

## Step 5: Soften block report copy

For `BlockReportScreen` and `reports` view models:

Required behavior:

- Replace “Main improvement” with “What changed” or “Latest re-test.”
- Replace “Improved”, “Held steady”, and “Adjusted for next block” with neutral wording unless comparison is explicitly unavailable.
- Existing comparison-unavailable state remains neutral.
- Compatible current-version report calculations remain unchanged internally.
- No deltas are deleted from data; only claim wording is softened.
- Next-block CTA remains available when Stage 3C allows it.
- “protects progress” becomes “supports the progress you’re working on” or similar.
- No false causal claim that the block caused the change.

Update tests for compatible and incompatible reports.

Do not implement meaningful-change thresholds in this task.

## Step 6: Soften Today, Plan, Home, Welcome, and global copy

Review and update:

- Today movement snapshot.
- Plan focus copy.
- Home key indicators.
- Welcome product explanation.
- Safety disclaimers.
- Learn/result explanation copy, if present.
- Any copy from `src/haleFlow/copy.ts`.

Required changes:

- “validated movement tests” -> “guided movement checks” or “published movement tests,” depending on context.
- “area Hale measured first” -> “area Hale suggested first” or “focus from your Check-Up.”
- “protects progress” -> “supports progress.”
- “measure strength, balance, and mobility” -> “estimate strength, balance, and mobility from a guided home check-up.”
- Ensure “not medical care” / “not a medical assessment” remains clear.

Do not broadly redesign screens.

## Step 7: Family/mock movement-age handling

If `src/family/fixture.ts` or any family/support feature exposes `movementAge` or similar:

- Confirm whether it is production-reachable.
- If production-reachable, hide, remove, or clearly label as mock/prototype.
- If test/mock-only, update naming/comment to prevent accidental production use if needed.
- Do not build new family features.

Add or update tests if there is a production path.

## Step 8: Add copy guardrails

Expand copy guardrail tests so future copy cannot reintroduce high-risk claims.

At minimum, guard production user-facing strings against:

- “medical-grade”
- “diagnosis”
- “treatment”
- “fall risk”
- “frailty”
- “disease prevention”
- “guaranteed”
- unqualified “movement age”
- unqualified “typical of age”
- unqualified “balance age”
- unqualified “mobility age”
- “camera measured”
- “validated movement tests”
- “main improvement” without threshold support
- “weakest area” / “weakness”

Be careful:

- Do not fail tests on internal comments if that creates noise.
- Scope guardrails to production user-facing copy where possible.
- Allow safe phrases such as “not a medical assessment.”
- Allow “age range” only where the string also includes beta/estimate/caveat.

## Step 9: Preserve score snapshots and downstream contracts

Add regression tests proving:

- Stage 3A malformed-input protection still passes.
- Stage 3B officialness and manual/quick isolation still pass.
- Stage 3C frozen snapshot behavior still passes.
- Complete official baseline still can create a block.
- Partial official result still cannot create a block.
- Manual extra still cannot create a block.
- Current re-test after incompatible history still can create next block.
- Incompatible report remains comparison unavailable.
- Norm tables unchanged.
- Scoring formulas unchanged.
- Age ranges in snapshots remain stored even if UI hides/softens them.
- Tie behavior unchanged.
- Meaningful-change thresholds not introduced.
- TUG remains hidden/supporting.
- Hinge remains supporting-only.

## Required automated tests

Add or update tests for:

### Result screens

- Complete official result uses beta/home estimate wording.
- Domain cards avoid unqualified “Typical of age.”
- Focus copy uses “suggested focus.”
- Mobility card does not imply hinge drives mobility age.
- Manual/quick complete result has no plan CTA and is labelled extra/non-official.
- Incomplete result has retry copy and no focus/plan claim.

### Progress

- Latest summary says estimated, not measured.
- Progress trend labels are neutral.
- Manual/quick isolation remains.
- Incompatible comparison remains unavailable.
- Age ranges, if visible, are beta-labelled.
- No “improved/declined/held steady” claim from tiny deltas.

### Block report

- Compatible report uses neutral wording.
- Incompatible report remains neutral.
- Next-block CTA still exists when appropriate.
- No “main improvement” claim.
- No “protects progress” guarantee.

### Global copy

- Home/Welcome/Plan copy uses estimate/check/support language.
- Safety/non-medical copy remains.
- Copy guardrails catch banned/high-risk phrases.

### Regression

- Stage 3A, 3B, 3C key tests still pass.
- Norms/scoring unchanged.

## Test-quality requirements

Tests must:

- Assert user-visible copy where the risk is copy.
- Use production view models/screens where practical.
- Avoid brittle full snapshots unless the repository already uses them safely.
- Preserve current data contracts.
- Fail if unqualified movement-age or medical-grade language returns.
- Fail if manual/quick results gain official plan/progress authority.
- Fail if age data is removed from frozen snapshots.

Tests must not:

- Change scoring/norm tables.
- Change movement measurements.
- Change block generation.
- Implement tie policy.
- Implement meaningful-change thresholds.
- Hide all useful user feedback.
- Use network access.
- Depend on wall-clock sleeps.

## Validation commands

Run targeted tests for:

- result screens.
- onboarding results.
- progress view model and screen.
- block reports.
- copy guardrails.
- scoring snapshots.
- Stage 3A scoring input validation.
- Stage 3B eligibility/history.
- Stage 3C snapshot/versioning.

Then run:

```bash
npm test -- --runInBand
npm run typecheck
npx --no-install expo config --type public
git diff --check
```

If `npm run typecheck` fails only because of the pre-existing ExploreScreen import issue, record that separately and do not hide it. Do not fix unrelated Explore work unless the user has made it part of this task.

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

docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_A.md

Do not edit previous reports.

The report must include:

1. Scope.
2. Initial Git status.
3. Stage 3D findings addressed.
4. Stage 3D findings not addressed.
5. Product rules implemented.
6. Movement-age display policy implemented.
7. Result-screen copy changes.
8. Progress copy changes.
9. Report copy changes.
10. Today/Plan/Home/Welcome/global copy changes.
11. Family/mock movement-age handling.
12. Copy guardrails added.
13. Files changed.
14. Tests added/changed.
15. Exact validation results.
16. Typecheck status, including whether ExploreScreen issue remains.
17. Stage 3A/3B/3C regression verification.
18. Norm/scoring unchanged confirmation.
19. Remaining Stage 3D blockers.
20. Whether Stage 4 remains unblocked.
21. Whether Stage 5 inputs remain blocked.
22. Initial and final Git status.
23. Any concurrent external changes.
24. Confirmation that no commit/staging/branch/push occurred.

## Required invariant outcomes

After Stage 3D-A:

1. No unqualified movement-age claim appears in production user-facing copy.
2. No unqualified “Typical of age X-Y” appears in production user-facing copy.
3. Balance-age and mobility-age claims are hidden or clearly beta/provisional.
4. “Camera measured” is replaced by “camera estimated” or equivalent.
5. “Validated movement tests” is softened.
6. “Weakest area” / “weakness” is replaced by suggested-focus language.
7. “Improved/declined/held steady” is not used as a meaningful-change claim without thresholds.
8. Block reports use neutral comparison language.
9. Incompatible reports remain comparison-unavailable.
10. “Protects progress” is softened.
11. Medical/diagnostic/fall-risk/treatment/disease-prevention claims do not appear.
12. Family/mock movement-age is hidden, labelled, or confirmed non-production.
13. Result screens still show useful feedback.
14. Complete official results still support plan creation.
15. Partial/manual/quick restrictions remain intact.
16. Frozen snapshots still store score data.
17. Norm tables unchanged.
18. Scoring formulas unchanged.
19. Tie behavior unchanged.
20. Meaningful-change thresholds unchanged.
21. Stage 4 remains unblocked.
22. Stage 5 remains blocked until tie/near-tie/focus semantics are remediated.

## Acceptance criteria

Do not mark Stage 3D-A complete unless all are true:

1. All high-risk claim strings from Stage 3D are addressed or explicitly justified.
2. Copy guardrails prevent the most dangerous claims from returning.
3. Results, Progress, and Reports use beta-safe interpretation wording.
4. Current data and scoring semantics remain unchanged.
5. Stage 3A/3B/3C regressions pass.
6. Targeted tests pass.
7. Full Jest passes.
8. Expo config passes.
9. `git diff --check` passes.
10. Typecheck passes, or fails only due a documented pre-existing unrelated Explore issue.
11. No unrelated user work is reverted or overwritten.
12. No commit, staging, branch, or push occurs.

## Stage decision

At the end of the report, state exactly one:

- STAGE 3D-A COMPLETE
- STAGE 3D-A BLOCKED

Also state:

- STAGE 3D-B REQUIRED
- STAGE 3D-C REQUIRED
- STAGE 4 UNBLOCKED
- STAGE 5 INPUTS BLOCKED

Stage 3D-B is norm provenance documentation/source verification.
Stage 3D-C is exact tie policy.
Stage 3D-D will later handle near-tie and meaningful-change thresholds after or alongside device-repeatability evidence.

## Final Codex response

Return a concise summary containing:

- Remediation report path.
- Whether production code changed.
- Movement-age display policy implemented.
- Key copy changes.
- Copy guardrails added.
- Files changed.
- Tests added/changed.
- Targeted validation result.
- Full suite result.
- Typecheck result.
- Expo config result.
- `git diff --check` result.
- Confirmation that norms/scoring were unchanged.
- Confirmation that Stage 3A/3B/3C protections remain.
- Remaining Stage 3D blockers.
- STAGE 3D-A COMPLETE or STAGE 3D-A BLOCKED.
- STAGE 3D-B REQUIRED.
- STAGE 3D-C REQUIRED.
- STAGE 4 UNBLOCKED.
- STAGE 5 INPUTS BLOCKED.
- Initial and final Git status.
- Any concurrent external changes.
- Confirmation that no commit, staging, branch, or push occurred.
