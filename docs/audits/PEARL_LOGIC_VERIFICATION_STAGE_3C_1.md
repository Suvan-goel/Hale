# Pearl Logic Verification - Stage 3C.1

Date: 2026-06-20

## Scope

Verified Stage 3C versioned frozen score snapshots against:

- `docs/audits/Pearl_Stage_3C_1_Versioned_Snapshot_Verification_Prompt.md`
- prior Stage 0, 1, 1A, 2, 2A, 2A.1, 3, 3A, 3B, and 3C audit/remediation reports

Constraints honored:

- No dependency install.
- No branch, commit, push, or staging.
- No Stage 3D/4/5 work.
- No edits to prior audit/remediation reports.
- Production changes only where failing tests proved a locked-contract gap.

## Verdict

Stage 3C is now verified and remediated for the V1 frozen-score-snapshot contract.

The Stage 3C baseline already had the main architecture in place: current snapshots, version constants, snapshot parsing/classification, snapshot-backed official selectors, version-gated block creation, comparison-unavailable report behavior, and backend restore/sync snapshot plumbing.

Stage 3C.1 found and fixed one important edge class: valid-looking snapshots whose `sourceCheckUpId` did not belong to the raw check-up, assessment, or report endpoint being used. Before the fix, those mismatches could still:

- persist through local history serialization as accepted snapshots,
- upload backend derived scores from the wrong endpoint,
- restore usable assessments from remote mismatch payloads,
- participate in historical official selectors,
- generate block-report domain deltas despite endpoint mismatch.

Those cases now fail closed as `invalid_snapshot` or are excluded from official selectors/comparison.

## Version Constants

Current locked constants:

- `SCORE_SNAPSHOT_SCHEMA_VERSION = 1`
- `CURRENT_SCORING_VERSION = 1`
- `CURRENT_NORM_VERSION = 1`

Tests now verify these are positive integers and that current snapshot creation stamps only these constants.

## Production Changes

Stage 3C.1 changed production code in five files:

- `src/history/serialize.ts`
  - Accepts a stored snapshot only if `snapshot.sourceCheckUpId` and `snapshot.score.startedAt` match the raw `CheckUp.startedAt`.
  - Drops mismatched snapshots and preserves explicit `invalid_snapshot` compatibility metadata.
  - Read paths still do not write or rewrite history files.

- `src/services/backend/checkupSyncService.ts`
  - Supplied snapshots are authoritative only if they belong to the raw check-up being synced.
  - Supplied frozen snapshot scores are used instead of caller-provided or rescored raw values.
  - Source-mismatched snapshots upload no derived domain scores, no weakest domain, no version metadata, and `scoreSnapshotCompatibility: invalid_snapshot`.

- `src/services/backend/restoreService.ts`
  - Restored assessments are built from the already validated restored history snapshot, not directly from arbitrary remote `derived_scores_json`.
  - This prevents remote source-mismatched snapshots from becoming usable assessments.

- `src/pearlFlow/checkupHistory.ts`
  - Usable and historical official selectors now reject snapshots whose source does not match the stored check-up and assessment.
  - Same-source incompatible snapshots remain historical but are not current-version-usable.

- `src/pearlFlow/reports.ts`
  - Block reports require snapshot endpoints to match their baseline/retest assessments before computing deltas.
  - Endpoint mismatch produces `invalid_snapshot`, empty `domainChanges`, and comparison-unavailable copy.

Test-only additions expanded:

- `src/scoring/__tests__/scoreSnapshot.test.ts`
- `src/pearlFlow/__tests__/assessmentEligibility.test.ts`
- `src/pearlFlow/__tests__/progressViewModel.test.ts`
- `src/pearlFlow/__tests__/checkupHistory.test.ts`
- `src/history/__tests__/history.test.ts`
- `src/services/backend/__tests__/checkupSyncService.test.ts`
- `src/services/backend/__tests__/restoreService.test.ts`

## Frozen Authority Checks

Verified:

- New official Check-Up completion creates one current snapshot and persists/syncs the snapshot with the check-up.
- Historical official progress reads frozen scores from snapshots, not current raw rescoring.
- Backend restore uses frozen snapshot scores even when raw Check-Up data would currently score differently.
- Backend sync with an existing supplied snapshot uses the supplied frozen score rather than rescoring raw measurements.
- Local history load/latest does not rewrite current, incompatible, legacy, or malformed files.
- Block reports compute deltas only when both endpoint snapshots are compatible and belong to the report endpoints.
- Incompatible version endpoints remain saved and historical, but direct comparison is unavailable.
- Legacy active blocks can be completed by a current re-test without retro-scoring the legacy baseline; the next block starts from the current re-test snapshot.
- A legacy baseline with no active block cannot seed a new block without a current snapshot.

## Failure Classification Matrix

Verified behaviors:

- Missing `scoringVersion` or `normVersion`: `legacy_unversioned`.
- Future schema version: `unsupported_schema`.
- Negative, zero, fractional, malformed, or source-mismatched versions/snapshots: `invalid_snapshot`.
- Future scoring or norm version with valid schema: `incompatible_version`.
- One missing endpoint in pair comparison: `missing_snapshot`.
- Compatible pair comparison requires exact schema, scoring, and norm versions.
- Source mismatch between score, snapshot, raw check-up, assessment, or report endpoint fails closed and is never directly comparable.

## Active Block Continuity

Verified active-block behavior:

- Current-version baseline to current-version re-test:
  - report can compute domain deltas,
  - completed block closes,
  - next active block starts from the re-test snapshot.

- Incompatible prior endpoint to current re-test:
  - prior endpoint remains historical,
  - report comparison is unavailable,
  - current re-test can seed the next block.

- Legacy prior endpoint to current re-test:
  - legacy baseline is not retro-scored,
  - report comparison status is `missing_snapshot`,
  - current re-test can seed the next block.

- Legacy baseline without an active block:
  - cannot create a new movement block because there is no current score snapshot.

## Call-Site Inventory

Production scoring/snapshot call-site classification from `rg`:

- Current-score creation:
  - `App.tsx` calls `createCurrentVersionedScoreSnapshot` on Check-Up completion.
  - `src/services/backend/checkupSyncService.ts` calls `createCurrentVersionedScoreSnapshot` only when no snapshot is supplied by the caller, covering fresh unsnapshotted local sync input.
  - `src/scoring/scoreSnapshot.ts` is the authoritative helper that calls `scoreCheckUpWithDiagnostics` and freezes the score.
  - `src/scoring/scoring.ts` exposes the scorer and wrapper.

- Snapshot reads/parsing:
  - `App.tsx`
  - `src/pearlFlow/assessmentEligibility.ts`
  - `src/pearlFlow/assessments.ts`
  - `src/pearlFlow/checkupHistory.ts`
  - `src/pearlFlow/reports.ts`
  - `src/history/serialize.ts`
  - `src/services/backend/checkupSyncService.ts`
  - `src/services/backend/restoreService.ts`

- Pair comparison:
  - `src/pearlFlow/checkupHistory.ts`
  - `src/pearlFlow/reports.ts`
  - `src/scoring/scoreSnapshot.ts`

- Raw metric trend extraction:
  - `src/history/trends.ts` uses `validateCheckUpForScoring` to extract raw measurement trend metrics. This is not movement-age rescoring and does not drive official score interpretation.

- Prohibited historical/restore rescoring:
  - No production `scoreCheckUp` call was found in restore.
  - No production `scoreCheckUp` call was found in history official selection, progress summaries, block reports, or restored assessment creation.

## Verification Commands

Targeted Stage 3C.1 suite:

```sh
npm test -- --runInBand src/scoring/__tests__/scoreSnapshot.test.ts src/pearlFlow/__tests__/assessmentEligibility.test.ts src/history/__tests__/history.test.ts src/services/backend/__tests__/checkupSyncService.test.ts src/services/backend/__tests__/restoreService.test.ts src/pearlFlow/__tests__/checkupHistory.test.ts src/pearlFlow/__tests__/progressViewModel.test.ts
```

Result:

- 7 test suites passed.
- 65 tests passed.
- 0 snapshots.
- Jest printed the existing Watchman recrawl warning and the existing post-run open-handle notice.

Full test suite:

```sh
npm test -- --runInBand
```

Result:

- 83 test suites passed.
- 564 tests passed.
- 0 snapshots.
- Existing console warnings from backend/session fallback tests were present.
- Jest printed the existing Watchman recrawl warning and the existing post-run open-handle notice.

Typecheck:

```sh
npm run typecheck
```

Result: pass.

Expo config:

```sh
npx expo config
```

Result: pass. Existing Sentry warning reported missing `organization` and `project` config, with environment-variable fallback.

Diff whitespace check:

```sh
git diff --check
```

Result: pass.

## Dirty Tree Audit

Initial status at the start of Stage 3C.1 had the existing Stage 3B/3C dirty baseline:

- 36 tracked modified files.
- Untracked prior audit/prompt files and new Stage 3B/3C files.
- `git diff --stat`: 36 files changed, 1434 insertions, 376 deletions.

Final status after Stage 3C.1 verification/remediation:

- 39 tracked modified files.
- `git diff --stat`: 39 files changed, 2186 insertions, 537 deletions.
- Existing untracked Stage 3B/3C audit/prompt/source files remain untracked.
- This report is the only new audit report intentionally added by Stage 3C.1.
- No `package.json` or lockfile changes.
- No branch/stage/commit/push actions.

Important diff note:

- `src/screens/PlanScreen.tsx`, `src/screens/SettingsScreen.tsx`, and `src/screens/TodayScreen.tsx` appeared as modified tracked files after the initial status snapshot. They were not edited as part of this Stage 3C.1 work and were left untouched.

## Stage Decision

- Stage 3C.1: complete.
- Stage 3C frozen-score snapshot contract: verified after source-identity fail-closed remediation.
- F3-004 remains closed.
- Stage 3D/4/5: not started.
