# Pearl Logic Remediation Stage 1A

Date: 2026-06-19  
Scope: assessment-validity and block-creation eligibility remediation for Stage 1 finding F-001 only.  
Status: production code and tests changed; no commit or push performed.

## 1. Scope

This patch fixes the P0 trust defect where a no-domain or invalid Movement Check-Up could create a personalised training block. It does not begin Stage 2 and intentionally does not address F-002 through F-006, equipment consolidation, catalogue metadata, session completion credit, account isolation, TUG, or exercise-science thresholds.

## 2. Original Confirmed Defect

Stage 1 confirmed this runtime path:

```text
CheckUpScreen -> handleCheckUpComplete -> results -> handleStartPlan
-> scoreCheckUp -> buildBlock -> createMovementBlockFromAssessment
```

When the check-up had no usable measurements, `score.weakestDomain` was `null`, `createMovementAssessment` could still carry a fabricated `strength_power` weakest domain, and `createMovementBlockFromAssessment` mapped missing focus to a strength block. That let Pearl create a 4-week plan from no reliable measurement evidence.

## 3. Final Eligibility Contract

The authoritative contract is `getBlockCreationEligibility` in `src/pearlFlow/assessmentEligibility.ts`.

Eligible means:

- Assessment status is `completed` when an assessment object is present.
- `score.weakestDomain` explicitly maps to a Pearl movement domain.
- At least one valid measured domain has finite movement-age bounds.
- The focus domain itself is measured and finite.
- Score and assessment evidence do not disagree.

Ineligible returns stable reasons: `assessment_not_completed`, `no_measured_domains`, `missing_focus_domain`, `invalid_focus_measurement`, or `inconsistent_assessment`.

## 4. Files Changed

Stage 1A changes:

- `App.tsx`
- `src/adherence/blockService.ts`
- `src/adherence/types.ts`
- `src/adherence/screens/BlockReportScreen.tsx`
- `src/pearlFlow/assessmentEligibility.ts`
- `src/pearlFlow/assessmentResultState.ts`
- `src/pearlFlow/assessments.ts`
- `src/pearlFlow/appLifecycle.ts`
- `src/pearlFlow/index.ts`
- `src/pearlFlow/reports.ts`
- `src/onboarding/state.ts`
- `src/screens/OnboardingResultsScreen.tsx`
- `src/screens/ResultsScreen.tsx`
- Tests under `src/adherence`, `src/pearlFlow`, and `src/onboarding`.

Pre-existing unrelated dirty files were left alone: `src/navigation/TabBar.tsx`, `src/navigation/icons.tsx`, `src/screens/TodayScreen.tsx`, and `src/theme/index.ts`.

## 5. Runtime Paths Updated

- `handleStartPlan` now checks eligibility before `buildBlock`, `createMovementBlockFromAssessment`, milestones, persistence, sync, or onboarding completion.
- `handleStartNextBlock` now checks eligibility before either block write.
- Official retest completion now saves the attempted check-up/assessment, then exits before retest completion, block archival, report creation, or next-block creation when ineligible.
- `createMovementBlockFromAssessment` now fails closed. Callers can use `tryCreateMovementBlockFromAssessment`; direct invalid callers receive `IneligibleMovementBlockError`.
- `createMovementAssessment` no longer stores a fabricated weakest domain when the score has no explicit focus.
- `latestUsableOfficialAssessment` excludes invalid official attempts while `latestOfficialAssessmentAttempt` preserves attempt history.
- Lifecycle and onboarding restart logic require usable baseline evidence, not just any stored history row.

## 6. UI Recovery Behaviour

Invalid results can still be displayed, but result screens use `getAssessmentResultState` and show retake recovery copy:

```text
We couldn't get enough reliable measurements to build your plan.
```

The create-plan CTA is not exposed for ineligible results. The recovery action returns to the existing retake/camera setup path.

## 7. Official Re-Test Behaviour

Invalid official retests may still be saved and synced as attempts with invalid status. They do not:

- complete or archive the current block,
- create a block report,
- create the next legacy block,
- create the next MovementBlock,
- replace the latest usable official assessment.

The active block remains recoverable and lifecycle continues to offer the retest route.

## 8. Tests Added

Added:

- `src/pearlFlow/__tests__/assessmentEligibility.test.ts`
- `src/pearlFlow/__tests__/assessmentResultState.test.ts`
- `src/adherence/__tests__/blockServiceEligibility.test.ts`

Updated:

- `src/onboarding/__tests__/onboarding.test.ts`
- `src/pearlFlow/__tests__/appLifecycle.test.ts`

Coverage includes real no-measurement check-up scoring, skipped/no-measurement cases, malformed domains, null focus, invalid status, non-finite focus, valid partial evidence, newer invalid official attempt over older valid official assessment, service-boundary rejection, onboarding restart, lifecycle retry, and unchanged TUG exclusion.

## 9. Validation Results

Commands run:

- `npm test -- --runInBand src/pearlFlow/__tests__/assessmentEligibility.test.ts src/pearlFlow/__tests__/assessmentResultState.test.ts src/adherence/__tests__/blockServiceEligibility.test.ts src/onboarding/__tests__/onboarding.test.ts src/pearlFlow/__tests__/appLifecycle.test.ts`
  - Exit 0
  - 5 suites passed, 40 tests passed, 0 snapshots.
  - Watchman recrawl warning remained.
- `npm test -- --runInBand`
  - Exit 0
  - 78 suites passed, 491 tests passed, 0 snapshots.
  - Watchman recrawl warning remained.
  - Existing backend/session-planning console logs and warnings remained.
  - Jest open-handle warning remained.
- `npm run typecheck`
  - Exit 0.
- `npx --no-install expo config --json`
  - Exit 0.
  - Parsed config: name `Pearl`, slug `pearl`, scheme `pearl`, 6 plugins, iOS `com.suvangoel.pearl`, Android `com.suvangoel.pearl`.
- `git diff --check`
  - Exit 0.

An earlier renderer-based result-screen test attempt failed due React Native/react-test-renderer environment teardown behavior; it was replaced with the pure `assessmentResultState` helper used by both result screens.

## 10. Remaining Policy Questions

- Stage 2/3 still need the final one-domain vs two-domain vs three-domain evidence threshold.
- Stage 3 still needs the broader policy for valid manual extra check-ups seeding future blocks.
- Stage 7 still needs full transaction/idempotency handling for retest report and next-block writes.

## 11. Intentionally Not Fixed

Not addressed in this patch:

- F-002 account/local-data isolation.
- F-003 non-training completions entering planning.
- F-004 all-skipped session credit.
- F-005 legacy fallback containment.
- F-006 planning date injection.
- Equipment-source consolidation.
- Exercise catalogue metadata mismatches.
- TUG/default battery changes.

## 12. Git Status

Initial status before Stage 1A edits:

```text
 M App.tsx
 M src/navigation/TabBar.tsx
 M src/navigation/icons.tsx
 M src/screens/TodayScreen.tsx
 M src/theme/index.ts
?? docs/audits/PEARL_LOGIC_AUDIT_STAGE_0.md
?? docs/audits/PEARL_LOGIC_AUDIT_STAGE_1.md
?? docs/audits/Pearl_Stage_1A_Assessment_Validity_Remediation_Prompt.md
```

Initial `App.tsx` diff was only:

```text
<TabBar active={tab} onChange={setTab} onOpenProfile={() => setFlow('settings')} />
```

The audited handlers still matched the Stage 1 report.

Final status observed:

```text
 M App.tsx
 M src/adherence/blockService.ts
 M src/adherence/screens/BlockReportScreen.tsx
 M src/adherence/types.ts
 M src/pearlFlow/__tests__/appLifecycle.test.ts
 M src/pearlFlow/appLifecycle.ts
 M src/pearlFlow/assessments.ts
 M src/pearlFlow/index.ts
 M src/pearlFlow/reports.ts
 M src/navigation/TabBar.tsx
 M src/navigation/icons.tsx
 M src/onboarding/__tests__/onboarding.test.ts
 M src/onboarding/state.ts
 M src/screens/OnboardingResultsScreen.tsx
 M src/screens/ResultsScreen.tsx
 M src/screens/TodayScreen.tsx
 M src/theme/index.ts
?? assets/images/pearl-home-hero-premium.png
?? docs/audits/PEARL_LOGIC_AUDIT_STAGE_0.md
?? docs/audits/PEARL_LOGIC_AUDIT_STAGE_1.md
?? docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_1A.md
?? docs/audits/Pearl_Stage_1A_Assessment_Validity_Remediation_Prompt.md
?? src/adherence/__tests__/blockServiceEligibility.test.ts
?? src/pearlFlow/__tests__/assessmentEligibility.test.ts
?? src/pearlFlow/__tests__/assessmentResultState.test.ts
?? src/pearlFlow/assessmentEligibility.ts
?? src/pearlFlow/assessmentResultState.ts
```

`assets/images/pearl-home-hero-premium.png` appeared as an unrelated untracked file during the task and was not touched by this remediation.

## 13. Source Inspection Confirmation

- Invalid baseline: scoring/assessment can persist the attempt; result state offers retake; guarded handlers reject mutation before either block write.
- Valid baseline: eligibility succeeds; legacy `buildBlock` and MovementBlock creation still run; valid focus is preserved.
- Invalid official retest: eligibility rejection happens before retest completion, `markMovementBlockComplete`, report creation, legacy next block, or MovementBlock next block.
- Newer invalid official over older valid official: latest attempt remains inspectable, while latest usable official returns the older valid assessment.
