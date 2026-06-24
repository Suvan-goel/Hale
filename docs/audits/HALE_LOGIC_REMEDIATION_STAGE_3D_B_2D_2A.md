# Hale Logic Remediation Stage 3D-B.2D.2A

Date: 2026-06-24

Task: Movement Profile V2 assessment persistence and orchestration.

## Result

`STAGE 3D-B.2D.2A IMPLEMENTED`

Stage 3D-B.2D.2A adds immutable persistence and pure orchestration for the already-defined Movement Profile V2 assessment artifact. It does not wire V2 assessment into UI, V1 `MovementAssessment`, block creation, reports, copy, feature flags, or training selection.

## Scope Implemented

Added `src/reference/movementProfileV2/persistence.ts` with:

- `MOVEMENT_PROFILE_V2_ASSESSMENT_PERSISTENCE_POLICY_VERSION`
- `MOVEMENT_PROFILE_V2_ASSESSMENT_PERSISTENCE_POLICY_FINGERPRINT`
- `MOVEMENT_PROFILE_V2_ARTIFACT_ORCHESTRATION_POLICY_VERSION`
- `MOVEMENT_PROFILE_V2_ARTIFACT_ORCHESTRATION_POLICY_FINGERPRINT`
- `validateMovementProfileV2AssessmentSource`
- `getMovementProfileV2AssessmentPersistenceEligibility`
- `validMovementProfileV2AssessmentForCheckUp`
- `attachMovementProfileV2Assessment`
- V2 assessment history selectors
- `priorMovementProfileV2FocusContextForCheckUp`
- `materializeOfficialMovementProfileV2Artifacts`

The persistence helper accepts only source-bound official Movement Profile V2 assessments whose focus is `domain` or `balanced`. It rejects V1, manual/quick/micro/legacy source types, malformed/future/fingerprint-invalid assessments, source/snapshot mismatches, missing snapshots, and non-persistable focus outcomes.

## Orchestration Rules

The pure materializer:

- validates official V2 source eligibility first;
- reuses a valid frozen snapshot without rerunning reference interpretation;
- creates a missing snapshot from explicit reference profile and timestamp;
- preserves existing frozen snapshot on live reference-profile/source-set drift and returns diagnostics;
- reuses a valid frozen assessment without recomputing focus;
- creates a missing assessment from the frozen snapshot, explicit life goal, explicit timestamp, and prior-focus selector;
- treats missing prior artifacts referenced by a frozen current assessment as non-blocking diagnostics;
- performs no persistence I/O, backend calls, ambient clock reads, live-profile reads, block creation, report creation, or UI mutation.

## Persistence and Sync

`CheckUp` now has optional `movementProfileV2Assessment`.

Local history stores V2 assessment as a top-level artifact beside `movementProfileV2Snapshot` and strips embedded snapshot/assessment copies from raw `checkUp` JSON. Malformed or mismatched assessments are omitted while raw check-up and valid snapshot remain readable.

Backend check-up sync preserves bounded `movementProfileV2Assessment` JSON in existing JSON payloads and omits invalid/mismatched assessments without deriving or uploading V1 compact score fields for V2 check-ups.

Backend restore passes the remote assessment candidate through local history parsing, validates source binding against the selected snapshot, and never recomputes V2 snapshot or focus from raw measurements.

Duplicate restore policy now prefers:

- valid V2 snapshot over raw-only duplicate;
- valid V2 assessment over snapshot-only duplicate;
- identical assessment fingerprints as deduped;
- first accepted frozen artifact on same-ID/different-fingerprint conflict.

Data export already preserves bounded backend JSON; tests now cover V2 assessment JSON alongside V2 snapshot JSON.

Account clear did not need a separate orphan-store change because V2 assessment is stored inside the source check-up record/file and is removed with that check-up.

## Supabase Check

The Supabase changelog was checked before backend work. No Supabase schema or migration change was required because this stage uses the existing JSON payload architecture for `movement_checkups`.

## Files Changed By This Stage

Production:

- `src/checkup/types.ts`
- `src/reference/movementProfileV2/index.ts`
- `src/reference/movementProfileV2/persistence.ts`
- `src/haleFlow/checkupHistory.ts`
- `src/history/serialize.ts`
- `src/services/backend/checkupSyncService.ts`
- `src/services/backend/restoreService.ts`

Tests:

- `src/reference/movementProfileV2/__tests__/persistence.test.ts`
- `src/history/__tests__/history.test.ts`
- `src/haleFlow/__tests__/checkupHistory.test.ts`
- `src/services/backend/__tests__/checkupSyncService.test.ts`
- `src/services/backend/__tests__/restoreService.test.ts`
- `src/services/backend/__tests__/dataExportService.test.ts`

Report:

- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2D_2A.md`

## Explicit Non-Changes

No intentional Stage 3D-B.2D.2A changes were made to:

- V2 assessment focus rules or schema semantics;
- V2 snapshot schema semantics;
- V2 reference transforms, source tables, or Warden status;
- V1 focus/score/block/report logic;
- UI screens, navigation, copy, reports, training blocks, or feature flags;
- dependencies, lockfiles, audio assets, source PDFs, workbook files, or secrets.

The worktree contains unrelated pre-existing/concurrent UI, voice-audit, and Stage 3D-B.2D.1 files. They were not reverted or edited for this stage.

## Focused Coverage Added

New focused tests cover:

- policy fingerprint stability;
- valid official source-bound assessment eligibility;
- rejection of manual source type and source mismatch;
- attachment idempotency;
- same-ID/different-fingerprint conflict preservation;
- deterministic assessment selectors;
- duplicate identical artifact dedupe;
- latest and source-specific selectors;
- prior focus only for official retests;
- pure materializer creation of missing artifacts;
- reuse of frozen artifacts on reference drift;
- missing prior artifact diagnostic without recomputing current assessment;
- local history round-trip;
- malformed/mismatched assessment omission while preserving raw and snapshot;
- backend sync preservation/omission;
- backend restore preservation/omission;
- remote duplicate selection;
- data export preservation.

## Validation

Baseline before edits:

```bash
npm test -- --runInBand src/checkup/__tests__/protocolPolicy.test.ts src/movements/__tests__/movementProfileV2Protocols.test.ts src/reference/movementProfileV2/__tests__/referenceEngine.test.ts src/reference/movementProfileV2/__tests__/snapshot.test.ts src/reference/movementProfileV2/__tests__/assessment.test.ts src/history/__tests__/history.test.ts src/haleFlow/__tests__/checkupHistory.test.ts src/services/backend/__tests__/checkupSyncService.test.ts src/services/backend/__tests__/restoreService.test.ts src/services/backend/__tests__/dataExportService.test.ts src/services/backend/__tests__/accountDataService.test.ts src/scoring/__tests__/scoreSnapshot.test.ts src/scoring/__tests__/scoringInputValidation.test.ts src/scoring/__tests__/focusSelection.test.ts src/haleFlow/__tests__/assessmentEligibility.test.ts src/adherence/__tests__/adherence.test.ts src/adherence/__tests__/blockServiceEligibility.test.ts src/exercises/__tests__/progressionPolicy.test.ts src/training/__tests__/collectionSelection.test.ts src/haleFlow/__tests__/stage5hLifecycle.integration.test.ts
```

Result: passed. 20 suites, 226 tests.

Focused stage edge tests:

```bash
npm test -- --runInBand src/reference/movementProfileV2/__tests__/persistence.test.ts src/history/__tests__/history.test.ts src/haleFlow/__tests__/checkupHistory.test.ts src/services/backend/__tests__/checkupSyncService.test.ts src/services/backend/__tests__/restoreService.test.ts src/services/backend/__tests__/dataExportService.test.ts
```

Result: passed. 6 suites, 70 tests.

Targeted validation after edits:

```bash
npm test -- --runInBand src/checkup/__tests__/protocolPolicy.test.ts src/movements/__tests__/movementProfileV2Protocols.test.ts src/reference/movementProfileV2/__tests__/referenceEngine.test.ts src/reference/movementProfileV2/__tests__/snapshot.test.ts src/reference/movementProfileV2/__tests__/assessment.test.ts src/reference/movementProfileV2/__tests__/persistence.test.ts src/history/__tests__/history.test.ts src/haleFlow/__tests__/checkupHistory.test.ts src/services/backend/__tests__/checkupSyncService.test.ts src/services/backend/__tests__/restoreService.test.ts src/services/backend/__tests__/dataExportService.test.ts src/services/backend/__tests__/accountDataService.test.ts src/scoring/__tests__/scoreSnapshot.test.ts src/scoring/__tests__/scoringInputValidation.test.ts src/scoring/__tests__/focusSelection.test.ts src/haleFlow/__tests__/assessmentEligibility.test.ts src/adherence/__tests__/adherence.test.ts src/adherence/__tests__/blockServiceEligibility.test.ts src/exercises/__tests__/progressionPolicy.test.ts src/training/__tests__/collectionSelection.test.ts src/haleFlow/__tests__/stage5hLifecycle.integration.test.ts
```

Result: passed. 21 suites, 241 tests.

Audio verification:

```bash
npm run verify:audio
```

Result: passed. Required cues 44, voices `clara,marcus`, required assets 88, total bytes 4,637,324, duration range 1.858-5.155s.

Full Jest:

```bash
npm test -- --runInBand
```

Result: passed. 113 suites, 976 tests.

App typecheck:

```bash
npm run typecheck
```

Result: passed.

Website typecheck:

```bash
npm --prefix website run typecheck
```

Result: passed.

Expo config:

```bash
npx --no-install expo config --type public
```

Result: passed.

Diff check:

```bash
git diff --check
```

Result: passed.

Expo export:

```bash
rm -rf /tmp/hale-stage3db2d2a-export
npx --no-install expo export --platform all --output-dir /tmp/hale-stage3db2d2a-export
rc=$?
rm -rf /tmp/hale-stage3db2d2a-export
exit $rc
```

Result: passed.

## Warning Inventory

- Watchman recrawl warning: present before edits and still present.
- Jest open-handle notice: present before edits and still present.
- Backend sync console logs/warnings: expected by existing failure-path tests.
- Expo Sentry organization/project warning: existing and still present.
- Expo export `NO_COLOR`/`FORCE_COLOR` warning: present during export.

No new unresolved Stage 3D-B.2D.2A defect remains.

## Final Status

`STAGE 3D-B.2D.2A COMPLETE`

`MOVEMENT PROFILE V2 ASSESSMENT PERSISTENCE AND PURE ORCHESTRATION READY FOR INTEGRATION`

Remaining broader caveats:

- physical-device camera validation remains outside this software stage;
- V2 assessment is intentionally not yet promoted into V1 block/report/UI flows;
- unrelated worktree changes remain user-owned/concurrent and were preserved.
