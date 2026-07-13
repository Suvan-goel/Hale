# Pearl Unified Movement Check-Up Stage H4 Official Retest Report Next Block

Date: 2026-06-25

## Outcome

Stage H4 is implemented and verified.

V2-origin official retests now launch through the unified Movement Profile V2 check-up only when the release flag is enabled, the active V2 block is `retest_due`, and the prior accepted V2 source artifacts match the active block. The retest path preserves the prior balance leg and shoulder side into setup, materializes the official retest as V2 artifacts, completes the prior V2 block, writes a claim-neutral V2 block report, and creates the next V2 block from the latest Movement Profile.

The retest result CTA is `View my block report`. The V2 block report CTA is `View my next 4-week plan`. Both are navigation-only.

## Product Guardrails

- No self-view camera behavior was changed.
- No runtime TTS or audio generation was added.
- No medical, fall-risk, improvement, decline, younger/older, percentage, delta, or Warden chair percentile claim was added to the V2 retest/report surfaces.
- No main Progress hero/history migration was started.
- No package installs, lockfile edits, audio regeneration, branch, commit, push, or PR work was performed.
- `docs/decisions.md` was not edited.

## Implementation Summary

- Added policy-fingerprinted V2 previous/current comparison artifacts.
- Added V2 block report artifacts distinct from legacy V1 directional reports.
- Added a pure official-retest transition that completes the prior V2 block, records the retest completion, creates/reuses the next V2 block, writes/reuses the V2 report, and fails closed on immutable conflicts.
- Updated public launch selection so V2-origin official retests route through the unified V2 flow only after release, schedule, and source-artifact gates pass.
- Wired App launch, reference-details prefill, official retest materialization, report navigation, next-plan navigation, and backend sync.
- Added a separate V2 block report screen; Progress was left untouched.
- Updated local deserialize and backend report sync to preserve V2 reports and use V2 prior/current check-up IDs for remote links.

## Verification

Passed:

- `npm run typecheck`
- `npm test -- --runInBand`
  - 142 suites passed
  - 1180 tests passed
- Focused H4 tests:
  - `src/pearlFlow/__tests__/movementProfileV2OfficialRetestTransition.test.ts`
  - `src/checkup/__tests__/publicCheckUpEngine.test.ts`
  - `src/services/backend/__tests__/blockReportSyncService.test.ts`
  - `src/results/__tests__/movementProfileV2ResultsAdapter.test.ts`
- `npm run verify:audio`
  - safety required assets: 88
  - Movement Profile V2 required assets: 62
  - total required assets: 150
- `npm --prefix website run typecheck`
- `npx --no-install expo config --type public`
- `npx --no-install expo export --platform all --output-dir /tmp/pearl-unified-h4-export`
  - Android bundle passed
  - iOS bundle passed
  - assets: 444
  - temp export directory removed after verification
- `git diff --check`

Expected existing warnings observed:

- Watchman recrawl warning during Jest.
- Jest open-handle notice after test completion.
- Existing backend sync warning logs in tests that intentionally exercise failed lookup paths.
- Sentry Expo config warning about missing organization/project fallback.
- Expo export `NO_COLOR` / `FORCE_COLOR` warnings.

## Notes

The final tracked diff at report time showed only the micro-check count correction in `src/pearlFlow/movementProfileV2BlockReport.ts` plus this audit report. The broader H4 files were already present in the working tree and verified by the full test/export suite.
