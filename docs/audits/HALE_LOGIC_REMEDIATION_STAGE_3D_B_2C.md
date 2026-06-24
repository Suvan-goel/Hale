# HALE LOGIC REMEDIATION STAGE 3D-B.2C

## 1. Scope

Implemented the immutable Movement Profile V2 snapshot, official evidence eligibility, source Check-Up binding, local persistence, backend sync/restore, compatibility, and V1 containment layer.

No Movement Profile UI, profile/reference onboarding, suggested focus, MovementAssessment V2, MovementBlock creation, reports, public routing, feature rollout, or physical-device validation was implemented.

## 2. Product Policies Implemented

- V1 Movement Age snapshots and V2 Movement Profile snapshots are separate contracts.
- V2 snapshots freeze raw-first reference interpretation at Check-Up completion.
- Missing age/reference sex does not invalidate raw-complete V2 snapshots.
- Chair remains raw-only in production while the Warden transform is disabled.
- V1/V2 longitudinal interpretation is incompatible.
- V2 remains unavailable to current UI/focus/block/report flows.

## 3. Initial Git Status

Initial worktree safety snapshot was captured before Stage 3D-B.2C edits. The repo was already heavily dirty with user-owned Stage 3D-B.2A/2B, Stage 4/5, native pose, auth/settings, diagnostics, render, and screen work.

Initial status included modified files such as `App.tsx`, native pose modules, `src/checkup/checkup.ts`, `src/checkup/index.ts`, `src/checkup/types.ts`, scoring files/tests, history serialization, backend check-up sync tests/service, many screens, render files, diagnostics, and responsive theme files.

Initial untracked files included `app.config.js`, Stage 3D-B.2A/2B reports/prompts, the Stage 3D-B.2C prompt, V2 check-up/protocol files, V2 movement files, V2 reference-engine files, and `src/render/MediaPipeSkeletonRenderer.tsx`.

Initial `git diff --stat` recorded before this implementation:

```text
52 files changed, 1363 insertions(+), 329 deletions(-)
```

No existing dirty work was reverted, reformatted, deleted, staged, committed, branched, or pushed.

## 4. Existing V1 Snapshot Architecture

V1 snapshots remain in `src/scoring/scoreSnapshot.ts` and use the existing `VersionedCheckUpScoreSnapshot` contract with schema/scoring/norm versions. V1 does not have a separate snapshot ID; source binding is by `sourceCheckUpId` and `score.startedAt`.

The V1 parser still accepts only V1 score snapshots with current supported schema/version metadata and JSON-safe score data. Source mismatch remains fail-closed in history, sync, and restore. Backend sync still stores V1 score data in derived JSON and V1 compact score columns only for legacy Movement Age records.

## 5. Existing V2 Protocol/Reference Contracts

Reused Stage 3D-B.2A V2 protocol policy/results:

- `movement_profile_v2`
- `chair-rise-30s-v2`
- `one-leg-balance-45s-v2`
- `active-shoulder-reach-v2`
- setup metadata, evidence states, selected standing leg/shoulder side, and changed-from-prior fields.

Reused Stage 3D-B.2B reference engine/source contracts:

- engine schema/version `1/1`
- source set ID `movement_profile_v2_reference_sources_v1`
- current source-set fingerprint `mpv2-source-set-v1-0r09281`
- Warden chair source with disabled transform
- Springer balance benchmark task bands
- Gill shoulder active-flexion IQR categories.

## 6. V2 Snapshot Version Architecture

Added separate V2 snapshot constants in `src/reference/movementProfileV2/snapshot.ts`:

- `MOVEMENT_PROFILE_V2_SNAPSHOT_SCHEMA_VERSION = 1`
- `MOVEMENT_PROFILE_V2_DISPLAY_POLICY_VERSION = 1`
- `MOVEMENT_PROFILE_V2_OFFICIAL_EVIDENCE_POLICY_VERSION = 1`
- `MOVEMENT_PROFILE_V2_SNAPSHOT_KIND = 'movement_profile_v2_snapshot'`

These do not reuse V1 `SCORE_SNAPSHOT_SCHEMA_VERSION`, scoring version, or norm version.

## 7. V2 Snapshot Schema

Added `StoredMovementProfileV2Snapshot` with:

- kind/schema
- stable snapshot ID and fingerprint
- exact source Check-Up ID/type/fingerprint
- explicit `createdAt`
- frozen protocol/evidence/display policy metadata
- normalized reference profile and fingerprint
- engine schema/version
- source-set ID/fingerprint
- full structured Stage 3D-B.2B interpretation output.

The parser rejects non-JSON-safe values, non-finite numbers, future schema, malformed domains, V1 artifacts, focus/block/report fields, source document content, raw frames, landmarks, and secrets.

## 8. Snapshot ID/Fingerprint Policy

Snapshot ID format:

```text
movement-profile-v2-snapshot:<encoded-source-checkup-id>
```

Snapshot fingerprint is deterministic over all material stored fields except `snapshotFingerprint`, using the existing stable fingerprint utility. Equal material produces equal fingerprints; changed raw data, source fingerprint, reference profile, version, createdAt, or interpretation changes the fingerprint.

The builder uses no random ID and no ambient clock.

## 9. Source Check-Up Fingerprint

Added canonical V2 source Check-Up fingerprinting over:

- source Check-Up ID and official type
- V2 protocol policy
- body unit
- headline movement IDs
- raw chair/balance/shoulder results
- setup metadata
- protocol evidence states
- selected leg/side and changed metadata
- active measurement window summaries
- raw completeness.

It excludes UI state, profile/training data, current reference registry, raw video, frames, and landmarks. Duplicate headline V2 movement IDs fail closed.

## 10. Official V2 Eligibility

Official V2 snapshot sources are exactly:

- `baseline`
- `baseline_retake`
- `official_retest`

Ineligible sources include manual extra, quick/micro/legacy, V1 protocol, malformed source, duplicate headline movement, partial source, and missing chair/balance/shoulder headline raw results.

Missing reference profile fields and disabled chair transform do not block snapshot creation when raw V2 evidence is complete.

## 11. Reference-Profile Freezing

Snapshot creation accepts an explicit `MovementProfileV2ReferenceProfile`, normalizes it through the Stage 3D-B.2B normalizer, stores the normalized input, and stores a deterministic reference-profile fingerprint.

The builder does not read the live profile, infer sex, promote legacy representative age bands to exact age, or call the clock.

## 12. Snapshot Builder

Added pure `createMovementProfileV2Snapshot`.

It validates official eligibility, normalizes reference profile, runs the current production V2 reference engine, validates engine/source metadata, builds the stored snapshot, fingerprints it, and returns typed diagnostics.

It does not mutate or persist the Check-Up and does not create focus, block, report, or V1 score output.

## 13. Chair Raw-Only Containment

Production snapshots preserve Warden chair source identity, disabled transform metadata, raw repetitions, evidence status, and `raw_only_source_transform_unapproved`.

No Warden workbook/PDF/table data was added. No exact percentile is stored. Percentile range remains possible only through the existing explicitly approved test/provider path, not production default creation.

## 14. Strict Parser/Cross-Field Validation

Added `parseStoredMovementProfileV2Snapshot` with fail-closed validation for:

- kind/schema/future schema
- snapshot ID shape
- source identity/type/fingerprint
- timestamps
- protocol/evidence/display policy metadata
- reference profile/fingerprint
- engine/source-set metadata
- interpretation shape
- chair transform/percentile consistency
- balance seconds/task-band/benchmark consistency
- shoulder side/IQR/category/pain-limited consistency
- snapshot fingerprint.

Malformed domain data invalidates the whole snapshot while raw Check-Up data remains recoverable separately.

## 15. Attachment Immutability/Conflict Policy

Added `attachMovementProfileV2Snapshot`.

Rules:

- source validation required
- no existing snapshot attaches
- identical fingerprint is idempotent
- source mismatch rejects
- invalid snapshot rejects
- different same-source material cannot overwrite the existing frozen snapshot.

## 16. Local Serialization/History

Added optional `movementProfileV2Snapshot` to `CheckUp`, but local serialization stores the snapshot as a top-level history artifact and strips nested snapshot copies from raw `checkUp`.

`src/history/serialize.ts` now:

- keeps V1 score snapshots V1-only
- marks V2 score snapshot compatibility as `unsupported_checkup_protocol`
- round-trips valid V2 snapshots
- omits malformed/mismatched V2 snapshots while preserving raw V2 Check-Ups
- reads old records without V2 fields.

Added V2 official snapshot selectors in `src/haleFlow/checkupHistory.ts`:

- `validOfficialMovementProfileV2Snapshots`
- `latestOfficialMovementProfileV2Snapshot`
- `movementProfileV2SnapshotForSourceCheckUpId`

Selectors verify source binding and do not create focus/block/report output.

## 17. Backend Sync

`src/services/backend/checkupSyncService.ts` now accepts optional V2 snapshots and preserves valid snapshots in bounded backend JSON while leaving V1 compact score columns empty/absent for V2.

V2 sync behavior:

- valid attached snapshot syncs
- missing snapshot syncs raw V2 only
- malformed/mismatched snapshot is omitted with compatibility metadata
- no V2 sync path calls the reference engine
- sanitized raw Check-Up excludes frames/landmarks/media-like keys.

V1 sync behavior remains unchanged.

## 18. Backend Restore

`src/services/backend/restoreService.ts` now parses V2 snapshots from derived/raw JSON, validates source binding, restores valid snapshots, and omits invalid/mismatched/future snapshots without recomputation.

Raw V2 Check-Ups remain restored even when the snapshot is missing or malformed. V2 restored history does not create legacy MovementAssessment records.

## 19. Duplicate/Conflict Resolution

For duplicate remote Check-Up identity:

- valid V2 snapshot beats a duplicate missing snapshot
- identical accepted snapshots dedupe
- conflicting snapshots preserve the already accepted frozen snapshot deterministically
- mismatched snapshots are not attached.

The attach helper also rejects replacement of an existing different snapshot fingerprint.

## 20. Export/Account-Data Behavior

No orphan snapshot store was added. V2 snapshots clear with their source Check-Up files through the existing local account-data deletion flow.

Data export already carries sanitized backend JSON; a test now proves bounded `movementProfileV2Snapshot` JSON is preserved while credential/media keys remain sanitized.

## 21. V1/V2 Compatibility Policy

Added `movementProfileSnapshotCompatibility`.

Outcomes:

- V1/V2 interpreted longitudinal comparison returns `snapshot_policy_changed`
- V2/V2 same policy returns structured raw/reference comparability
- changed balance standing leg marks balance non-comparable
- changed shoulder side marks shoulder non-comparable
- missing reference profile can leave raw comparability while reference comparability is false
- no improvement, decline, percentile change, or effect size is calculated.

## 22. V1/UI/Focus/Block/Report Containment

V2 snapshots do not satisfy the V1 score snapshot parser, do not make V2 Check-Ups V1-scoreable, and do not create V1 CheckUpScore, MovementAssessment, MovementBlock, block report, suggested focus, or UI route.

Current public/default Check-Up remains V1. No CheckUpScreen, Results, Progress, Home, profile, or onboarding V2 integration was added.

## 23. Payload/Observability Safety

Pure snapshot helpers return bounded diagnostics only. No helper logs raw payloads.

Diagnostics include safe fields such as Check-Up ID, snapshot ID/kind/schema, protocol ID/version, source-set ID/fingerprint, and domain key. They exclude frames, landmarks, raw video, free-text health notes, profile payloads, auth data, source document text, and provider secrets.

## 24. Files Changed

Task-owned implementation/test files changed or added:

- `src/checkup/types.ts`
- `src/reference/movementProfileV2/index.ts`
- `src/reference/movementProfileV2/snapshot.ts`
- `src/reference/movementProfileV2/__tests__/snapshot.test.ts`
- `src/history/serialize.ts`
- `src/history/__tests__/history.test.ts`
- `src/haleFlow/checkupHistory.ts`
- `src/haleFlow/__tests__/checkupHistory.test.ts`
- `src/services/backend/checkupSyncService.ts`
- `src/services/backend/__tests__/checkupSyncService.test.ts`
- `src/services/backend/restoreService.ts`
- `src/services/backend/__tests__/restoreService.test.ts`
- `src/services/backend/__tests__/dataExportService.test.ts`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2C.md`

Other dirty files in the worktree were pre-existing user-owned work and were not intentionally changed by this stage.

## 25. Tests Added/Changed

Added:

- `src/reference/movementProfileV2/__tests__/snapshot.test.ts`

Updated:

- `src/history/__tests__/history.test.ts`
- `src/haleFlow/__tests__/checkupHistory.test.ts`
- `src/services/backend/__tests__/checkupSyncService.test.ts`
- `src/services/backend/__tests__/restoreService.test.ts`
- `src/services/backend/__tests__/dataExportService.test.ts`

Tests cover version/type separation, eligibility, source binding, builder/parser validation, attachment immutability, local round-trip, sync/restore, duplicate handling, export preservation, compatibility, and V1 containment.

## 26. Exact Targeted Validation

Command:

```bash
npm test -- --runInBand src/checkup/__tests__/protocolPolicy.test.ts src/movements/__tests__/movementProfileV2Protocols.test.ts src/reference/movementProfileV2/__tests__/referenceEngine.test.ts src/reference/movementProfileV2/__tests__/snapshot.test.ts src/scoring/__tests__/scoreSnapshot.test.ts src/scoring/__tests__/scoringInputValidation.test.ts src/haleFlow/__tests__/assessmentEligibility.test.ts src/history/__tests__/history.test.ts src/haleFlow/__tests__/checkupHistory.test.ts src/services/backend/__tests__/checkupSyncService.test.ts src/services/backend/__tests__/restoreService.test.ts src/services/backend/__tests__/dataExportService.test.ts src/services/backend/__tests__/accountDataService.test.ts src/haleFlow/__tests__/stage5hLifecycle.integration.test.ts src/training/__tests__/workoutGeneration.test.ts
```

Result:

```text
15 passed, 15 total
223 passed, 223 total
```

Watchman recrawl warning and Jest open-handle notice were present. These warnings existed in earlier baseline runs.

## 27. Exact Full Validation

Command:

```bash
npm test -- --runInBand
```

Result:

```text
111 passed, 111 total
948 passed, 948 total
```

Existing backend test console logs/warnings were printed for expected mocked failure paths. Watchman recrawl warning and Jest open-handle notice were present.

## 28. Audio Verification

Command:

```bash
npm run verify:audio
```

Result:

```text
AUDIO VERIFICATION PASS requiredCues=44 voices=clara,marcus requiredAssets=88 totalBytes=4637324 durationRange=1.858-5.155s
```

## 29. App/Website Typechecks

Commands:

```bash
npm run typecheck
npm --prefix website run typecheck
```

Both passed.

## 30. Expo Config/Export

Command:

```bash
npx --no-install expo config --type public
```

Passed. Existing Sentry warning printed:

```text
[@sentry/react-native/expo] Missing config for organization, project. Environment variables will be used as a fallback during the build.
```

Expo export command:

```bash
rm -rf /tmp/hale-stage3db2c-export
npx --no-install expo export --platform all --output-dir /tmp/hale-stage3db2c-export
rc=$?
rm -rf /tmp/hale-stage3db2c-export
exit $rc
```

Passed for Android and iOS bundles. Existing Sentry fallback warning and Node `NO_COLOR` ignored due to `FORCE_COLOR` warnings printed. Temporary output directory was removed.

`git diff --check` passed.

## 31. Stage 2A.1/3/4/5 Regression Verification

Regression coverage remained green through targeted and full validation:

- Stage 3D-B.2A V2 protocol policy/controllers
- Stage 3D-B.2B V2 reference engine/source integrity
- V1 score snapshot/scoring containment
- Check-Up history serialization
- backend sync/restore
- Stage 4 closure/report/sync coverage
- Stage 5H lifecycle
- training generation/progression policies
- navigation tests
- TypeScript boundaries
- safety audio.

## 32. Remaining Stage 3D-B Work

Remaining Stage 3D-B work is Stage 3D-B.2D and later:

- Movement Profile UI/display integration
- exact-age/reference profile onboarding
- suggested-focus policy
- MovementAssessment/MovementBlock V2 design if approved
- reports/public routing
- feature rollout
- physical-device validation
- future chair Warden transform approval.

## 33. Whether Stage 3D-B.2D Is Unblocked

Stage 3D-B.2D is unblocked for design/implementation work that consumes immutable official V2 snapshots. It remains blocked from beta release until UI/focus/product decisions and physical-device validation are complete.

## 34. Initial And Final Git Status

Initial status: see section 3.

Final status after implementation and before staging/commit remained dirty with the same broad user-owned work plus Stage 3D-B.2C files. The final status included:

```text
M src/checkup/types.ts
M src/haleFlow/__tests__/checkupHistory.test.ts
M src/haleFlow/checkupHistory.ts
M src/history/__tests__/history.test.ts
M src/history/serialize.ts
M src/reference/movementProfileV2/index.ts
M src/services/backend/__tests__/checkupSyncService.test.ts
M src/services/backend/__tests__/dataExportService.test.ts
M src/services/backend/__tests__/restoreService.test.ts
M src/services/backend/checkupSyncService.ts
M src/services/backend/restoreService.ts
?? src/reference/movementProfileV2/__tests__/snapshot.test.ts
?? src/reference/movementProfileV2/snapshot.ts
?? docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2C.md
```

The worktree also still contained many pre-existing modified/untracked files listed in section 35.

## 35. Complete Files-Changed Inventory

Final `git status --short --untracked-files=all` inventory:

```text
 M App.tsx
 M modules/expo-pose-detection/android/src/main/java/expo/modules/posedetection/ExpoPoseDetectionModule.kt
 M modules/expo-pose-detection/android/src/main/java/expo/modules/posedetection/PoseDetectionView.kt
 M modules/expo-pose-detection/ios/ExpoPoseDetectionModule.swift
 M modules/expo-pose-detection/ios/PoseDetectionView.swift
 M modules/expo-pose-detection/src/ExpoPoseDetection.types.ts
 M modules/expo-pose-detection/src/PoseDetectionView.tsx
 M src/checkup/checkup.ts
 M src/checkup/index.ts
 M src/checkup/types.ts
 M src/components/AccountAuthCard.tsx
 M src/components/SafePoseDetectionView.tsx
 M src/components/ui.tsx
 M src/diagnostics/__tests__/poseLatencyDiagnostics.test.ts
 M src/diagnostics/poseLatencyDiagnostics.ts
 M src/haleFlow/__tests__/assessmentEligibility.test.ts
 M src/haleFlow/__tests__/checkupHistory.test.ts
 M src/haleFlow/assessmentEligibility.ts
 M src/haleFlow/checkupHistory.ts
 M src/history/__tests__/history.test.ts
 M src/history/serialize.ts
 M src/movements/__tests__/registry.test.ts
 M src/movements/index.ts
 M src/navigation/TabBar.tsx
 M src/render/PoseAvatarRenderer.tsx
 M src/render/SkeletonView.tsx
 M src/render/__tests__/poseAvatarConfig.test.ts
 M src/render/poseAvatarConfig.ts
 M src/render/poseAvatarTypes.ts
 M src/scoring/__tests__/scoreSnapshot.test.ts
 M src/scoring/__tests__/scoringInputValidation.test.ts
 M src/scoring/scoreSnapshot.ts
 M src/scoring/scoringInputValidation.ts
 M src/screens/CameraExplanationScreen.tsx
 M src/screens/CameraSetupScreen.tsx
 M src/screens/CheckUpScreen.tsx
 M src/screens/ExploreDetailScreens.tsx
 M src/screens/ExploreScreen.tsx
 M src/screens/ManualCheckupStartScreen.tsx
 M src/screens/MicroCheckScreen.tsx
 M src/screens/OnboardingEquipmentScreen.tsx
 M src/screens/OnboardingResultsScreen.tsx
 M src/screens/PlanScreen.tsx
 M src/screens/ProgressScreen.tsx
 M src/screens/ResultsScreen.tsx
 M src/screens/SafetyProfileScreen.tsx
 M src/screens/SessionPlanningRecoveryScreen.tsx
 M src/screens/SessionPreviewScreen.tsx
 M src/screens/SettingsScreen.tsx
 M src/screens/TodayScreen.tsx
 M src/screens/TrainingSessionScreen.tsx
 M src/screens/WelcomeScreen.tsx
 M src/services/backend/__tests__/checkupSyncService.test.ts
 M src/services/backend/__tests__/dataExportService.test.ts
 M src/services/backend/__tests__/restoreService.test.ts
 M src/services/backend/checkupSyncService.ts
 M src/services/backend/restoreService.ts
 M src/theme/responsive.ts
?? app.config.js
?? docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2A.md
?? docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2B.md
?? docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2C.md
?? docs/audits/Hale_Stage_3D_B_2A_Assessment_Protocol_State_Machine_Implementation_Prompt.md
?? docs/audits/Hale_Stage_3D_B_2B_Reference_Engine_Implementation_Prompt.md
?? docs/audits/Hale_Stage_3D_B_2C_V2_Snapshots_Sync_Restore_Prompt.md
?? src/checkup/__tests__/protocolPolicy.test.ts
?? src/checkup/movementProfileV2.ts
?? src/checkup/protocolEvidence.ts
?? src/checkup/protocolPolicy.ts
?? src/checkup/protocolSetup.ts
?? src/movements/__tests__/movementProfileV2Protocols.test.ts
?? src/movements/activeShoulderReachV2.ts
?? src/movements/chairRiseV2.ts
?? src/movements/oneLegBalanceV2.ts
?? src/movements/protocolOnlyGrader.ts
?? src/reference/movementProfileV2/__tests__/referenceEngine.test.ts
?? src/reference/movementProfileV2/__tests__/snapshot.test.ts
?? src/reference/movementProfileV2/balance.ts
?? src/reference/movementProfileV2/chair.ts
?? src/reference/movementProfileV2/engine.ts
?? src/reference/movementProfileV2/fingerprint.ts
?? src/reference/movementProfileV2/index.ts
?? src/reference/movementProfileV2/referenceProfile.ts
?? src/reference/movementProfileV2/shoulder.ts
?? src/reference/movementProfileV2/snapshot.ts
?? src/reference/movementProfileV2/sources.ts
?? src/reference/movementProfileV2/transformations.ts
?? src/reference/movementProfileV2/types.ts
?? src/render/MediaPipeSkeletonRenderer.tsx
```

## 36. Concurrent External Changes

The repo remained heavily dirty throughout. Pre-existing changes were treated as user-owned. This implementation touched only the Stage 3D-B.2C files listed in section 24 and worked with existing Stage 3D-B.2A/2B modules instead of reverting them.

No unrelated product logic was intentionally changed.

## 37. Confirmation Of No Disallowed Operations

Confirmed:

- no package install
- no dependency or lockfile change
- no source PDF/workbook/table data commit
- no audio asset regeneration
- no `.env` inspection or credential exposure
- no staging
- no commit
- no branch creation
- no push
- no destructive Git command.

## Stage Decisions

STAGE 3D-B.2C COMPLETE

V2 SNAPSHOT CONTRACT IMPLEMENTED

V2 LOCAL PERSISTENCE IMPLEMENTED

V2 BACKEND SYNC/RESTORE IMPLEMENTED

STAGE 3D-B.2D UNBLOCKED

CHAIR WARDEN TRANSFORM NOT EMBEDDED

CHAIR REFERENCE CLAIM REMAINS RAW-ONLY IN PRODUCTION

MOVEMENT PROFILE V2 NOT USER-ENABLED

NO SUGGESTED-FOCUS IMPLEMENTATION

NO V2 MOVEMENTASSESSMENT OR MOVEMENTBLOCK

STAGE 4 REMEDIATION COMPLETE

STAGE 5 REMEDIATION COMPLETE

OVERALL BETA RELEASE STILL BLOCKED

PHYSICAL DEVICE VALIDATION REQUIRED
