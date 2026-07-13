# Pearl Logic Remediation - Stage 3D-C

Date: 2026-06-20

## Verdict

STAGE 3D-C COMPLETE.

Exact ties among complete official domain scores now have explicit policy, persisted metadata, lifecycle behavior, tie-safe copy, and validation coverage. Near ties, meaningful-change thresholds, scoring math, and norm tables were not changed.

## Initial Worktree State

Before edits, the required preflight commands were run:

- `git status --short --untracked-files=all`
- `git diff --name-only`
- `git diff --stat`

Initial state was already dirty with 81 tracked modified files plus untracked audit/remediation files and Stage 3B/3C artifacts. Initial diff stat was `81 files changed, 4333 insertions(+), 1625 deletions(-)`. Those concurrent changes were treated as user-owned context and were not reverted.

## Policy Implemented

- Exact tie definition: complete official headline domains only; compare current focus-comparison values using exact range midpoints; tied domains are those exactly equal to the max midpoint; 2 or 3 tied domains are an exact tie.
- No near-tie margin, rounding equality, or meaningful-change threshold was introduced.
- Stable score-domain order is `strength`, `balance`, `mobility`.
- Clear result metadata stores `kind: "clear"`, effective `focusDomain`, and one `tiedDomains` entry.
- Exact tie metadata stores `kind: "exact_tie"`, effective `focusDomain`, all exact `tiedDomains`, and `tieBreakReason`.
- Balanced/general focus is not supported end to end in the current codebase: movement blocks, legacy training blocks, generated templates, sessions, sync mappings, and screens all expect concrete focus domains. Exact ties therefore use concrete fallback policy rather than a balanced block.
- First official baseline exact tie: deterministic fallback to the first tied domain in stable order; reason `deterministic_fallback`.
- Official re-test exact tie: preserves the active block focus when that focus is among the tied score domains; reason `preserve_current_focus`. If active focus is not tied, fallback is deterministic.
- Manual/extra/quick check-up ties remain display-only because non-official assessments are still ineligible for block creation.

## Production Changes

- Added `src/scoring/focusSelection.ts` for exact tie selection, metadata validation, exact-equality matching, stable tied-domain ordering, and effective focus application.
- Extended current score snapshots with optional `focusSelection` metadata without bumping the snapshot schema. Older snapshots without metadata still parse.
- Current snapshot creation now applies exact-tie focus policy to the returned/stored score focus while leaving domain score values and norms unchanged.
- Official assessment creation mirrors snapshot focus metadata in raw metrics and uses the snapshot's effective focus for `results.weakestDomain`.
- Block creation eligibility now fails closed when a complete exact tie lacks metadata, rejects contradictory tie metadata, rejects unsupported `balanced_first_block`, and keeps direct callers behind the same policy.
- Movement blocks now record optional focus selection origin fields: kind, tied movement domains, and tie-break reason.
- Official re-test completion passes the active block focus into snapshot creation so tied re-tests can preserve the current focus.
- Results, onboarding results, home, progress summary, and block report copy now use "closely matched" / "suggested focus" language for exact ties.
- Backend sync/restore behavior continues to carry the full score snapshot; tests now pin exact-tie metadata through those paths.

## Files Touched For Stage 3D-C

- `App.tsx`
- `src/scoring/focusSelection.ts`
- `src/scoring/scoreSnapshot.ts`
- `src/scoring/index.ts`
- `src/scoring/__tests__/focusSelection.test.ts`
- `src/scoring/__tests__/scoreSnapshot.test.ts`
- `src/pearlFlow/assessments.ts`
- `src/pearlFlow/assessmentEligibility.ts`
- `src/pearlFlow/__tests__/assessmentEligibility.test.ts`
- `src/adherence/types.ts`
- `src/adherence/blockService.ts`
- `src/screens/ResultsScreen.tsx`
- `src/screens/OnboardingResultsScreen.tsx`
- `src/screens/HomeScreen.tsx`
- `src/pearlFlow/progressViewModel.ts`
- `src/adherence/screens/BlockReportScreen.tsx`
- `src/services/backend/__tests__/checkupSyncService.test.ts`
- `src/services/backend/__tests__/restoreService.test.ts`

## Validation

- `npx jest src/scoring/__tests__/focusSelection.test.ts src/scoring/__tests__/scoreSnapshot.test.ts src/pearlFlow/__tests__/assessmentEligibility.test.ts src/services/backend/__tests__/checkupSyncService.test.ts src/services/backend/__tests__/restoreService.test.ts --runInBand`
  - Passed: 5 suites, 50 tests.
- `npx tsc --noEmit`
  - Passed.
- `npm test -- --runInBand`
  - Passed: 84 suites, 582 tests.
  - Jest reported its existing post-run open-handle notice after the successful run.
- `npx expo config --type public`
  - Passed.
  - Reported existing Sentry config warning: organization/project missing, environment variables used as fallback.

## Stage Boundaries

- STAGE 3D-B REQUIRED: interim/noisy provisional focus policy remains out of scope.
- STAGE 3D-D REQUIRED: post-remediation audit/verification remains required.
- STAGE 4 UNBLOCKED: Stage 3D-C no longer blocks Stage 4, assuming Stage 3D-D verification passes.
- STAGE 5 INPUTS READY: exact-tie policy inputs are ready; Stage 5 still depends on Stage 3D-B and Stage 3D-D as applicable.

## Final Worktree State

Final status remains dirty because the branch already contained many uncommitted tracked and untracked changes before Stage 3D-C. No commit, branch, push, or staging action was performed.
