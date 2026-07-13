# Pearl Logic Remediation - Stage 3D-A Display Copy Softening

Date: 2026-06-20

## Scope

Stage 3D-A was limited to production display copy, view-model labels, beta-safe interpretation language, and copy guardrail tests. This pass did not start Stage 3D-B, Stage 3D-C, Stage 4, Stage 5, exercise validation, workout logic, device validation, or scoring/norm remediation.

## Initial Status

The worktree was already dirty before this pass. Initial status included many modified files across app screens, adherence, Pearl flow, history, backend sync, theme, native pose modules, and docs, plus untracked Stage 3B/3C/3D audit artifacts and scoring/history helper files. Pre-edit `npm run typecheck` passed.

Initial untracked files included:

- `docs/audits/PEARL_LOGIC_AUDIT_STAGE_3D.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3B.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3C.md`
- `docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_3C_1.md`
- `docs/audits/Pearl_Stage_3B_Evidence_Officialness_Prompt.md`
- `docs/audits/Pearl_Stage_3C_1_Versioned_Snapshot_Verification_Prompt.md`
- `docs/audits/Pearl_Stage_3C_Scoring_Norm_Versioning_Prompt.md`
- `docs/audits/Pearl_Stage_3D_A_Display_Copy_Softening_Prompt.md`
- `docs/audits/Pearl_Stage_3D_Norm_Claims_Audit_Prompt.md`
- `src/checkup/retry.ts`
- `src/pearlFlow/__tests__/checkupHistory.test.ts`
- `src/pearlFlow/assessmentEvidence.ts`
- `src/pearlFlow/checkupHistory.ts`
- `src/scoring/__tests__/scoreSnapshot.test.ts`
- `src/scoring/scoreSnapshot.ts`
- `src/scoring/versions.ts`

## Production Code Changed

Yes. Changes were limited to display/copy and view-model label surfaces, plus the iOS camera permission string.

## Movement-Age Display Policy Implemented

- Result and home surfaces now lead with performance bands: `Strong`, `Building`, or `Starting point`.
- Strength may retain a clearly labelled beta age range: `Beta home estimate: age X-Y`.
- Balance and mobility no longer surface age ranges in the primary result/progress evidence copy; they use source-specific labels such as `One-leg balance hold estimate` and `Shoulder mobility estimate`.
- Stored legacy results say the beta estimate interpretation is unavailable instead of implying missing authoritative movement-age interpretation.
- Family/mock data is labelled `Sample estimate` and remains explicitly prototype/local.

## Key Copy Changes

- `Camera measured` became `Camera estimated` where shown to users.
- `Typical of age`, `Typical ages`, and unqualified `movement age` presentation were removed from the targeted user-facing surfaces.
- `Main opportunity`, `weakest/best place` style language became `Suggested focus`.
- Trend and report language now says `recorded higher`, `recorded lower`, `similar result`, `changed in the latest re-test`, or `added another data point` instead of claiming improvement/decline/held-steady outcomes.
- `Protect/protected progress` language was softened to `support/supported progress`.
- Re-test copy now says the next check-up adds another data point rather than "shows what changed."
- Learn/Explore explanations now describe Pearl estimating movement signals and using home estimates for coaching context.
- The iOS `NSCameraUsageDescription` now says the camera estimates movement as a skeleton outline.

## Guardrails Added Or Updated

- Expanded `src/pearlFlow/__tests__/copyGuardrails.test.ts` to ban high-risk user-copy phrases including unqualified movement age, typical age, camera measured, main opportunity, best place to focus, protected/protect progress, held steady, and declined.
- Added a production source-copy scan over result/progress/home/report/family/welcome/plan/settings screen files.
- Added an App permission-copy assertion so the camera permission copy stays on `estimate`, not `measure`.
- Updated progress view-model tests to assert beta-safe home estimate labels and neutral trend copy.
- Updated adherence copy tests to assert `supported` progress and ban reintroduction of protected/protect progress claims.

## Files Changed In This Stage 3D-A Pass

Production/display surfaces:

- `App.tsx`
- `app.json`
- `src/screens/ResultsScreen.tsx`
- `src/screens/OnboardingResultsScreen.tsx`
- `src/screens/ProgressScreen.tsx`
- `src/screens/HomeScreen.tsx`
- `src/screens/FamilyScreen.tsx`
- `src/screens/WelcomeScreen.tsx`
- `src/screens/PlanScreen.tsx`
- `src/screens/OnboardingBlockScreen.tsx`
- `src/screens/SettingsScreen.tsx`
- `src/adherence/screens/BlockReportScreen.tsx`
- `src/adherence/components/LifeGoalSelector.tsx`
- `src/adherence/adherenceCopy.ts`
- `src/adherence/milestoneService.ts`
- `src/family/fixture.ts`
- `src/pearlFlow/appLifecycle.ts`
- `src/pearlFlow/copy.ts`
- `src/pearlFlow/exploreViewModel.ts`
- `src/pearlFlow/planViewModel.ts`
- `src/pearlFlow/progressViewModel.ts`
- `src/learn/articles.ts`

Tests:

- `src/pearlFlow/__tests__/copyGuardrails.test.ts`
- `src/pearlFlow/__tests__/progressViewModel.test.ts`
- `src/adherence/__tests__/adherence.test.ts`

Report:

- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_A.md`

## Validation

Targeted validation:

- `npm test -- --runInBand src/pearlFlow/__tests__/copyGuardrails.test.ts src/pearlFlow/__tests__/progressViewModel.test.ts src/adherence/__tests__/adherence.test.ts` - passed, 3 suites / 24 tests.

Full validation:

- `npm test -- --runInBand` - passed, 83 suites / 567 tests.
- `npm run typecheck` - passed.
- `npx --no-install expo config --type public` - passed. It emitted the existing Sentry plugin warning about missing organization/project config and showed the updated camera permission copy.
- `git diff --check` - passed.
- Production phrase sweep for Stage 3D-A high-risk strings across App/app.json/user-facing app directories - no matches after excluding internal scoring/history/training/grading/pose/render mechanics.

Observed non-blocking warnings:

- Watchman recrawl warning during Jest.
- Jest open-handle notice after the full test run.
- Existing Sentry Expo config warning during Expo config generation.

## Final Status

Final `git status --short --untracked-files=all` showed 98 changed/untracked paths overall and 81 tracked modified files. This includes the dirty worktree inherited at the start of the pass, the Stage 3D-A copy/test changes, and this new report. No files were staged or committed.

New Stage 3D-A report path:

- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_A.md`

## Norms, Scoring, And Snapshot Contracts

Unchanged by this pass:

- Scoring formulas.
- Norm tables and norm anchors.
- Score snapshot shape/versioning.
- Weakest-domain/tie policy.
- Near-tie policy.
- Meaningful-change thresholds.
- Check-Up measurement, camera readiness, exercise catalogue, workout generation, block focus logic, backend schema, and dependencies.

Internal scoring comments and types still refer to movement-age semantics because that is the internal scoring representation. Stage 3D-A changed user-facing presentation, not the underlying scoring model.

## Stage 3A/3B/3C Protections

Existing malformed-input, evidence officialness, versioned snapshot, compatibility, and replay-adjacent protections remained intact in the full test suite. Relevant suites including scoring input validation, score snapshot tests, check-up history tests, assessment eligibility tests, backend restore/sync tests, and full Jest all passed.

## Remaining Blockers

None for Stage 3D-A.

Residual notes:

- Jest still reports an open-handle notice after passing all tests.
- Watchman still reports a recrawl warning.
- Stage 3D-B/3D-C remain intentionally untouched.

## Stage Decisions

- Use performance-band-first display for all domains.
- Permit beta-labelled age range display only for strength in the primary result/progress evidence surfaces.
- Hide balance/mobility age ranges in those surfaces until source review and better explanatory context exist.
- Use `Suggested focus` for focus selection copy without changing focus selection logic.
- Treat progress deltas as observations, not meaningful-change claims, until validated thresholds exist.
- Keep all changes local to copy/view-model/test/report surfaces.
