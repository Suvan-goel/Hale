# Hale Logic Remediation Stage 3C

Date: 2026-06-20

Stage 3C addressed F3-004: scoring and norm versions were not pinned, allowing historical Check-Up interpretations to drift when scoring code, norm tables, restore behavior, or comparison/report paths changed.

## Summary

Implemented versioned score snapshots as the authoritative interpretation layer for Movement Check-Ups.

Newly scored Check-Ups now receive centralized `CURRENT_SCORING_VERSION = 1`, `CURRENT_NORM_VERSION = 1`, and `SCORE_SNAPSHOT_SCHEMA_VERSION = 1`. The JSON-safe frozen snapshot stores the score the user originally saw, including domain age bands, measured flags, interpretation copy, weakest domain, source Check-Up id, and version metadata.

Historical official Progress, block creation, reports, local history, and backend sync/restore now use frozen snapshots instead of silently rescoring raw historical measurements. Legacy unversioned records are preserved but fail closed for current official decisions.

## Key Changes

- Added centralized scoring/norm version constants and snapshot parsing/serialization helpers in `src/scoring/versions.ts` and `src/scoring/scoreSnapshot.ts`.
- Extended local history records with `scoreSnapshot` and `scoreSnapshotCompatibility`; `HistoryStore.save` now accepts metadata and persists snapshots.
- Updated MovementAssessment creation to stamp snapshot version/source metadata into `results.rawMetrics`.
- Hardened block creation eligibility so new blocks require a complete official assessment plus a current, valid, source-consistent frozen snapshot.
- Split historical official selectors into current-version usable records and historical snapshot records, with exact-version comparison gating.
- Updated Progress, lifecycle, onboarding, Results, and block-report screens to consume stored snapshots and to show neutral unavailable states when no authoritative frozen interpretation exists.
- Updated block reports to store endpoint version metadata and suppress improved/declined/held-steady claims when endpoints are missing or incompatible.
- Updated backend check-up sync to write snapshots/version metadata and backend restore to rebuild local history/assessments from stored snapshots, not by rescoring raw Check-Ups.
- Updated backend block-report sync/restore to preserve comparison compatibility metadata and classify old reports as legacy unversioned.

## Compatibility Behavior

- Current snapshot + current snapshot with identical schema/scoring/norm versions: comparable.
- Legacy unversioned record: preserved, not current official evidence, not a block source, not a comparison endpoint.
- Incompatible known version: may remain historical if the snapshot is parseable, but is excluded from current block creation and direct progress deltas.
- Malformed or unsupported future snapshot: fails closed without crash or silent rescore.
- Existing active blocks are not destroyed by historical incompatibility; a current-version official re-test can complete the block and seed the next block.

## Tests Added Or Updated

- Added snapshot unit coverage in `src/scoring/__tests__/scoreSnapshot.test.ts`.
- Extended official history selector tests for legacy and incompatible snapshot behavior.
- Extended Progress/report tests so incompatible endpoints produce “starting point”/comparison-unavailable states rather than fake deltas.
- Extended backend sync/restore tests for score snapshot persistence and no silent legacy rescoring.
- Updated existing block-creation, adherence, lifecycle, onboarding, and session-planning fixtures to pass current score snapshots where current-version decisions are expected.

## Validation

Passed:

- `npm run typecheck`
- `npm test -- --runInBand`  
  Result: 83 suites passed, 552 tests passed.
- `npx expo config`

Observed non-failing warnings:

- Watchman recrawl warning during Jest.
- Jest open-handle notice after the suite completes.
- Existing expected console warnings from fallback-path tests.
- `npx expo config` warns that Sentry organization/project config is missing and environment variables will be used as fallback.

## Notes

- No scoring formulas or norm tables were changed.
- No user-facing re-analysis workflow was added.
- Prior Stage 3B files and prompt/report artifacts were already present in the working tree at the start of Stage 3C; this report is limited to the Stage 3C remediation.

## Status

F3-004 is closed for Stage 3C.
