# Pearl Logic Remediation Stage 3B: Evidence Officialness

Date: 2026-06-19

## 1. Scope

Stage 3B implemented the approved evidence sufficiency and officialness policy for Movement Check-Ups. This pass covered all-three-headline-domain official completion, partial Check-Up recovery, manual/quick isolation, exact local Check-Up type preservation, and backend type round-trip hardening.

It did not implement Stage 3C score/norm versioning, Stage 3D tie or meaningful-change rules, Stage 4 training-content progression audit, Stage 5 beta validation, new norm tables, scientific source review, database migrations, or broad UI redesign.

## 2. Prior Inputs Read

Before code changes, the Stage 3B prompt and the required prior reports were read: Stage 0, Stage 1, Stage 1A, Stage 2, Stage 2A, Stage 2A.1, Stage 3, and Stage 3A.

Carry-forward constraints used here: Stage 2A/2A.1 made camera readiness and ROM official-capture gating trustworthy enough for downstream policy; Stage 3A made malformed scoring inputs fail closed; Stage 3B therefore focused on officialness, completeness, and recovery rather than pose or scoring thresholds.

## 3. Findings Addressed

- F3-001: one-domain results can no longer create completed official assessments or training blocks.
- F3-002: manual and quick Check-Ups no longer contaminate official progress, lifecycle, or next-block creation.
- F3-009: exact local Check-Up type is preserved in local history and remote JSON metadata even when the remote enum is lossy.

## 4. Findings Not Addressed

Not addressed in this stage: F3-004 score/norm versioning, F3-005 norm provenance/science sign-off, F3-007 tie handling, F3-008 meaningful-change thresholds, and remaining beta/device validation items.

## 5. Official Evidence Rule

An official baseline, baseline retake, or official monthly retest is completed only when all three headline domains are measured:

- Strength/Power: chair stand.
- Balance: balance ladder single-leg headline.
- Mobility: shoulder flexion headline.

Supporting metrics do not determine official completeness: rise velocity, earlier balance stages, sway, TUG, and hinge reach remain supporting/detail evidence only.

## 6. Headline Evidence Helper

Added `src/pearlFlow/assessmentEvidence.ts` as the shared pure evidence helper. It maps `CheckUpScore` or `MovementAssessment` evidence into stable headline domains, missing domains, measured count, completion, confidence, and status.

The helper uses fixed domain order: `strength_power`, `balance`, `mobility`.

## 7. Status Mapping

`CheckupStatus` now includes `incomplete`.

Score-derived assessment status is:

- 0 headline domains: `invalid`, low confidence.
- 1 or 2 headline domains: `incomplete`, medium confidence.
- 3 headline domains: `completed`, high confidence.

Completed no longer means "some valid measurement"; it means all three headline domains.

## 8. Authoritative Weakest Domain

`createMovementAssessment` now withholds `results.weakestDomain` unless headline evidence is complete. Partial and invalid attempts can still store finite measured domain scores, but they do not carry an authoritative official focus.

## 9. Block Eligibility

`getBlockCreationEligibility` now requires:

- a present source assessment;
- official exact type: `baseline`, `baseline_retake`, or `official_retest`;
- `isOfficialForProgress === true`;
- status `completed`;
- all three headline domains present;
- finite focus domain;
- score and assessment domain/focus/check-up-id consistency.

Score-only block creation now fails closed as non-official.

## 10. Ineligibility Reasons

The eligibility boundary now reports Stage 3B-specific reasons including `assessment_invalid`, `assessment_incomplete`, `missing_headline_domains`, `non_official_assessment`, and `score_assessment_mismatch`.

The block service continues to throw `IneligibleMovementBlockError` for direct callers that ignore typed failure results.

## 11. Partial Official Results

Partial official attempts can still be saved and shown. They do not:

- create or replace a block;
- complete onboarding;
- complete a retest;
- create a block report;
- create a next block;
- become latest usable official progress;
- publish an official weakest domain.

## 12. Targeted Retry

Added `src/checkup/retry.ts`.

Missing headline domains map only to supported headline movements:

- missing strength -> chair stand;
- missing balance -> balance ladder;
- missing mobility -> shoulder flexion;
- all missing -> chair, balance, shoulder.

Hinge and TUG are not included in targeted retry batteries.

## 13. Retry Merge

`mergeCheckUpRetry` creates a new Check-Up at the retry timestamp, preserves valid non-retried base items, replaces only retried movement IDs, keeps default battery order, and avoids duplicates.

Failed retry sections do not erase unrelated valid evidence from the base attempt.

## 14. CheckUpScreen Battery

`CheckUpScreen` now accepts an optional `battery` prop and passes it into `CheckUpOrchestrator`. Normal Check-Ups still use the default V1 battery.

## 15. App Completion Path

`handleCheckUpComplete` now:

- merges targeted retries before scoring when retry metadata is pending;
- creates an assessment from the merged result;
- saves exact type metadata with local history;
- syncs the exact type metadata to backend payloads;
- saves incomplete official attempts without performing retest/report/next-block side effects.

## 16. Manual And Quick Isolation

Manual extra and quick recheck attempts may save and display results, including all three domains. They are non-official and cannot:

- create a block;
- become latest official progress;
- replace baseline comparison;
- drive lifecycle create-block state;
- drive report or next-block creation.

Result copy now states complete extra Check-Ups are saved but do not replace official progress.

## 17. Official Selectors

Added `src/pearlFlow/checkupHistory.ts`.

Official history selectors require exact official type plus a usable matching assessment. Legacy untyped records can recover a type only when exactly one assessment matches the same Check-Up id. Ambiguous or unmatched legacy records remain `legacy_unknown`.

## 18. Progress Isolation

Progress view models now use usable official Check-Up records. Manual, quick, partial, invalid, and ambiguous legacy records are excluded from latest summary, domain progress, and retest history.

`ProgressScreen` now passes assessments to those selectors.

## 19. Lifecycle Isolation

`getPearlAppLifecycle` now derives baseline existence and movement snapshot from usable official records/assessments only. Raw manual or partial history no longer moves the user into create-block or progress states.

## 20. Onboarding Isolation

Onboarding restart logic now requires a usable official baseline record with a matching assessment. Partial baseline attempts return to camera setup/retry rather than completing onboarding.

## 21. Result Screen Authority

`ResultsScreen` and `OnboardingResultsScreen` now receive the matching assessment and pass it into `getAssessmentResultState`. CTA authority therefore comes from official assessment eligibility, not from score-only evidence.

## 22. Next Block And Report Guards

`handleStartNextBlock` now uses `latestUsableOfficialCheckUpRecord`; it no longer uses `lastResult` or latest raw history as a next-block source.

Block-report latest score lookup no longer falls back to latest raw manual history when a report retest assessment is unavailable.

## 23. Local History Type

`StoredCheckUp` now includes exact `checkupType`, optional `sourceAssessmentId`, and optional `retryOfCheckUpId`.

New `HistoryStore.save` calls can write this metadata. Missing or invalid legacy type loads as `legacy_unknown`.

## 24. Legacy Behavior

Untyped local history is not guessed by position. It resolves to an exact type only via a single matching assessment. Multiple matches or no matches produce `legacy_unknown`, which is non-official.

## 25. Backend Sync

`mapLocalCheckupToRemotePayload` still uses the existing coarse remote `checkup_type` enum, mapping unsupported variants to `unknown`, but now also writes exact local type to `derived_scores_json.checkupType`, `derived_scores_json.exactCheckupType`, and `raw_checkup_json.checkupType`.

## 26. Backend Restore

Restore now prefers exact type metadata from derived JSON, then raw JSON, then the coarse remote enum. Lossy `unknown` without exact metadata becomes `legacy_unknown`, not `manual_extra`.

Remote `completed` status is normalized through headline evidence so old completed partial rows restore as `incomplete` or `invalid`.

## 27. Tests Added

Added `src/pearlFlow/__tests__/checkupHistory.test.ts` covering:

- official selector exclusion of manual results;
- unambiguous legacy type recovery;
- incomplete official attempt selection;
- targeted retry battery mapping;
- retry merge preservation/no duplicates/completion.

## 28. Tests Updated

Updated tests under `src/pearlFlow`, `src/adherence`, `src/history`, `src/onboarding`, and `src/services/backend` to assert:

- partial evidence is incomplete and block-ineligible;
- score-only block creation is non-official;
- score/assessment Check-Up id mismatch fails;
- exact type metadata persists locally and remotely;
- progress/lifecycle/onboarding use official matching assessments;
- existing direct block-service callers supply a valid assessment.

## 29. Validation Commands

Targeted Stage 3B suite:

```bash
npm test -- --runInBand src/pearlFlow/__tests__/checkupHistory.test.ts src/pearlFlow/__tests__/assessmentEligibility.test.ts src/pearlFlow/__tests__/assessmentResultState.test.ts src/history/__tests__/history.test.ts src/services/backend/__tests__/checkupSyncService.test.ts src/services/backend/__tests__/restoreService.test.ts src/onboarding/__tests__/onboarding.test.ts src/pearlFlow/__tests__/appLifecycle.test.ts src/pearlFlow/__tests__/progressViewModel.test.ts src/adherence/__tests__/blockServiceEligibility.test.ts src/adherence/__tests__/adherence.test.ts src/pearlFlow/__tests__/pearlFlow.test.ts src/pearlFlow/__tests__/sessionPlanning.test.ts
```

Result: exit 0, 13 suites passed, 113 tests passed.

## 30. Full Validation

Commands run after final code changes:

- `npm test -- --runInBand`
  - Exit 0.
  - 82 suites passed, 543 tests passed, 0 snapshots.
  - Existing Watchman recrawl warning remained.
  - Existing Jest open-handle notice remained.
  - Expected backend/session-planning console logs and warnings remained.
- `npm run typecheck`
  - Exit 0.
- `npx --no-install expo config --type public`
  - Exit 0.
  - Existing Sentry Expo missing organization/project warning remained.
- `git diff --check`
  - Exit 0.

## 31. Files Changed

Production code changed:

- `App.tsx`
- `src/adherence/types.ts`
- `src/checkup/index.ts`
- `src/checkup/retry.ts`
- `src/pearlFlow/appLifecycle.ts`
- `src/pearlFlow/assessmentEligibility.ts`
- `src/pearlFlow/assessmentEvidence.ts`
- `src/pearlFlow/assessmentResultState.ts`
- `src/pearlFlow/assessments.ts`
- `src/pearlFlow/checkupHistory.ts`
- `src/pearlFlow/index.ts`
- `src/pearlFlow/progressViewModel.ts`
- `src/history/index.ts`
- `src/history/serialize.ts`
- `src/history/store.ts`
- `src/onboarding/state.ts`
- `src/screens/CheckUpScreen.tsx`
- `src/screens/OnboardingResultsScreen.tsx`
- `src/screens/ProgressScreen.tsx`
- `src/screens/ResultsScreen.tsx`
- `src/services/backend/checkupSyncService.ts`
- `src/services/backend/restoreService.ts`

Tests changed or added under `src/adherence`, `src/pearlFlow`, `src/history`, `src/onboarding`, and `src/services/backend`.

## 32. Final Git Status

Final `git status --short --untracked-files=all` before this report write showed:

```text
 M App.tsx
 M src/adherence/__tests__/adherence.test.ts
 M src/adherence/__tests__/blockServiceEligibility.test.ts
 M src/adherence/types.ts
 M src/checkup/index.ts
 M src/pearlFlow/__tests__/appLifecycle.test.ts
 M src/pearlFlow/__tests__/assessmentEligibility.test.ts
 M src/pearlFlow/__tests__/pearlFlow.test.ts
 M src/pearlFlow/__tests__/progressViewModel.test.ts
 M src/pearlFlow/__tests__/sessionPlanning.test.ts
 M src/pearlFlow/appLifecycle.ts
 M src/pearlFlow/assessmentEligibility.ts
 M src/pearlFlow/assessmentResultState.ts
 M src/pearlFlow/assessments.ts
 M src/pearlFlow/index.ts
 M src/pearlFlow/progressViewModel.ts
 M src/history/__tests__/history.test.ts
 M src/history/index.ts
 M src/history/serialize.ts
 M src/history/store.ts
 M src/onboarding/__tests__/onboarding.test.ts
 M src/onboarding/state.ts
 M src/screens/CheckUpScreen.tsx
 M src/screens/OnboardingResultsScreen.tsx
 M src/screens/ProgressScreen.tsx
 M src/screens/ResultsScreen.tsx
 M src/services/backend/__tests__/checkupSyncService.test.ts
 M src/services/backend/__tests__/restoreService.test.ts
 M src/services/backend/checkupSyncService.ts
 M src/services/backend/restoreService.ts
?? docs/audits/Pearl_Stage_3B_Evidence_Officialness_Prompt.md
?? src/checkup/retry.ts
?? src/pearlFlow/__tests__/checkupHistory.test.ts
?? src/pearlFlow/assessmentEvidence.ts
?? src/pearlFlow/checkupHistory.ts
```

This report is the only intended additional audit artifact.

No files were staged. No commit was created. No branch was created. No push was performed.

## 33. Final Status

STAGE 3B COMPLETE

STAGE 3C REQUIRED

STAGE 4 REMAINS BLOCKED

STAGE 5 INPUTS REMAIN BLOCKED

