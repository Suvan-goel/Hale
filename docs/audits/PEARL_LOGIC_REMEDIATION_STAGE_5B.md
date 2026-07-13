# Pearl Logic Remediation Stage 5B

Date: 2026-06-20

Scope: Stage 5B only, covering F5-006 from `docs/audits/PEARL_LOGIC_AUDIT_STAGE_5.md` and the Stage 5B prompt. Stage 5C/D/E/F/G/H, Stage 3D-B, further Stage 4 remediation, and beta-device validation remain deferred.

## Starting State

The working tree was already dirty before Stage 5B began. I did not revert or normalize unrelated user changes.

Initial `git status --short --untracked-files=all` included many pre-existing modified and untracked files, including prior Stage 4/5 audit artifacts, app visual updates, backend sync tests, and Stage 5A files. The Stage 5B implementation touched only the focused credit-gating, metadata, persistence/sync, copy, tests, and documentation paths listed below.

Representative initial dirty areas before Stage 5B:

```text
 M App.tsx
 M docs/decisions.md
 M src/adherence/__tests__/adherence.test.ts
 M src/adherence/adherenceService.ts
 M src/adherence/screens/SessionCompletionScreen.tsx
 M src/adherence/types.ts
 M src/pearlFlow/__tests__/sessionPlanning.test.ts
 M src/pearlFlow/sessionPlanning.ts
 M src/pearlFlow/types.ts
 M src/screens/SessionPreviewScreen.tsx
 M src/services/backend/__tests__/restoreService.test.ts
 M src/services/backend/__tests__/sessionSyncService.test.ts
 M src/services/backend/blockReportSyncService.ts
 M src/services/backend/sessionSyncService.ts
 M src/services/backend/trainingStateSyncService.ts
 M src/training/__tests__/store.test.ts
 M src/training/dynamicState.ts
 M src/training/serialize.ts
?? docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5A.md
?? docs/audits/Pearl_Stage_5B_Primary_Focus_Stimulus_Credit_Prompt.md
?? src/pearlFlow/__tests__/mainPlanEvents.test.ts
?? src/pearlFlow/__tests__/sessionWorkEvidence.test.ts
?? src/pearlFlow/mainPlanEvents.ts
?? src/pearlFlow/sessionWorkEvidence.ts
```

## Implementation Summary

Stage 5B adds a fail-closed primary-focus stimulus contract on top of Stage 5A work evidence.

- Added `src/pearlFlow/focusStimulusEvidence.ts`, a pure evaluator for planned focus eligibility and completed focus evidence.
- Added plan metadata at `PearlSessionPlan.metadata.focusStimulus`, including primary focus exercise ids, supporting/fallback/cross-domain ids, fallback/skipped focus slot ids, reason codes, and whether the plan can ever earn main-plan credit.
- Changed session completion credit orchestration in `App.tsx` so `mainPlanCredit` is true only when Stage 5A work evidence and Stage 5B completed primary-focus evidence both pass.
- Preserved Stage 5A fail-closed work evidence: empty, all-skipped, duplicate, malformed, unmatched, or missing planned results remain non-credit.
- Required qualifying planned exercise ids to resolve through the current exercise catalogue.
- Saved supporting/fallback-only generated attempts as generated session summaries with `status: 'partial'`, `mainPlanCredit: false`, `workEvidence`, and `focusStimulusEvidence`.
- Kept non-credit attempts out of adherence completions, so they do not advance A/B/C rotation, week completion, milestones, block completion, or retest due state.
- Added supporting/fallback honesty copy in preview and completion screens.
- Added optional `focusStimulusEvidence` to local completion/summary types and JSON sync snapshots, including fallback/skipped focus slot ids and reason codes where available.

## Credit Rule

A session advances the main plan only if:

1. It is an explicit active-block generated A/B/C main-plan session under the Stage 5A classifier.
2. The result contains at least one explicitly completed planned exercise under Stage 5A work evidence.
3. At least one completed planned exercise has structured metadata with `stimulusRole === 'primary'`.
4. That exercise's `intendedDomain` matches the active `MovementBlock.focusDomain`.

Supporting, fallback, skipped, invalid, malformed, missing-metadata, and cross-domain-only work remains non-credit. Legacy fallback remains non-credit and is not inferred from exercise names, ladders, or raw exercise domains.

## Files Added

- `src/pearlFlow/focusStimulusEvidence.ts`
- `src/pearlFlow/__tests__/focusStimulusEvidence.test.ts`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5B.md`

## Files Updated

- `App.tsx`
- `docs/decisions.md`
- `src/adherence/adherenceService.ts`
- `src/adherence/screens/SessionCompletionScreen.tsx`
- `src/adherence/types.ts`
- `src/pearlFlow/__tests__/sessionPlanning.test.ts`
- `src/pearlFlow/index.ts`
- `src/pearlFlow/sessionPlanning.ts`
- `src/pearlFlow/types.ts`
- `src/screens/SessionPreviewScreen.tsx`
- `src/services/backend/__tests__/sessionSyncService.test.ts`
- `src/services/backend/blockReportSyncService.ts`
- `src/services/backend/sessionSyncService.ts`
- `src/services/backend/trainingStateSyncService.ts`
- `src/training/__tests__/store.test.ts`
- `src/training/dynamicState.ts`
- `src/training/serialize.ts`

## Test Coverage

New and updated tests cover:

- planned primary focus eligibility;
- completed primary focus credit;
- supporting-only completion exclusion;
- block-generated no-primary-focus plans;
- missing old stimulus metadata fail-closed;
- legacy fallback non-credit even with primary-looking names/domains;
- focus-domain mismatch exclusion;
- one valid primary remaining creditable when another metadata row is malformed;
- generated plan metadata stamping;
- local persistence of focus evidence;
- remote session summary JSON carrying focus evidence.

## Validation

Commands run:

```text
npx jest src/pearlFlow/__tests__/focusStimulusEvidence.test.ts src/pearlFlow/__tests__/sessionWorkEvidence.test.ts src/pearlFlow/__tests__/mainPlanEvents.test.ts src/pearlFlow/__tests__/sessionPlanning.test.ts --runInBand
npx tsc --noEmit
npx jest src/training/__tests__/store.test.ts src/services/backend/__tests__/sessionSyncService.test.ts src/services/backend/__tests__/restoreService.test.ts src/adherence/__tests__/adherence.test.ts --runInBand
npx expo config --type public
npx jest --runInBand
```

Results:

- Focused Jest: passed, 31 tests.
- TypeScript: passed.
- Persistence/sync/adherence Jest: passed, 30 tests.
- Expo config: passed with the existing Sentry missing organization/project warning.
- Full Jest: passed, 87 suites / 628 tests.

Observed existing warnings:

- Watchman recrawl warning.
- Jest open-handle notice after completion.
- Existing expected console warnings in fallback/sync tests.

## Deferred

The following remain intentionally out of scope:

- Stage 5C legacy fallback containment.
- Stage 5D official progression-evidence policy for non-credit supporting/fallback work.
- Stage 5E pain/readiness strategy.
- Stage 5F equipment canonicalization.
- Stage 5G timing/lapse policy.
- Stage 5H or later remediation.
- Beta-device validation.
