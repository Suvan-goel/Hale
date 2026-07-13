# Pearl Unified Movement Check-Up Stage H3.1 End-to-End Verification

Date: 2026-06-25

## 1. Scope

H3.1 verified the Stage H3 public baseline/onboarding cutover end to end without starting H4. The work added a production-faithful integration suite for the public unified Movement Check-Up lifecycle, re-ran the release gates, and recorded the evidence here.

The implementation scope was deliberately verification-first:

- add focused integration coverage;
- use production helpers for raw Check-Up capture, artifact materialization, result presentation, block creation, restore, and scheduling;
- make no production runtime fixes unless a failing H3.1 test proved a real H3 defect;
- do not change package dependencies, lockfiles, audio assets, prior reports, or `docs/decisions.md`.

## 2. Why H3.1 Was Required

H3 proved the baseline/onboarding cutover in focused slices. H3.1 was required because the release boundary crosses multiple asynchronous callbacks and persisted artifacts:

- release flag selection;
- raw V2 Check-Up completion before reference details;
- reference detail submission;
- snapshot, assessment, block, result, and CTA creation;
- onboarding state transitions;
- idempotent replay;
- restore and sync-pending behavior;
- kill-switch behavior;
- official-retest containment.

The key risk was not an isolated helper failure. It was a lifecycle leak where a public flag-on path could accidentally create a V1 score, V1 assessment, V1 block, duplicate V2 artifacts, or route into an unsupported retest.

## 3. H3 Prerequisite Evidence

The H3 report and prerequisite reports were read before H3.1 work:

- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H3_BASELINE_ONBOARDING_CUTOVER.md`
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H2_V1_RESULTS_SHELL_V2_PROFILE.md`
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H1_V1_SHELL_V2_ADAPTER.md`
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H0_HEALTH_GATE.md`
- Stage 3D-B, Stage 5G.1, and Stage 5H handoff/audit material in `docs/audits`
- project rules from `AGENTS.md`, `CLAUDE.md`, and `docs/decisions.md`

Carried-forward H3 decisions:

- release flag defaults off and parses only exact `1`;
- flag off preserves the public V1 baseline path;
- flag on sends public `baseline` and `baseline_retake` to unified Movement Profile V2;
- internal harness flags remain separate from the public release flag;
- official retest remains contained for V2-origin blocks;
- result CTA text remains `View my 4-week plan`;
- CTA navigates only and does not create the block;
- V1 migrations remain out of scope;
- Warden remains deferred;
- chair remains raw-only for V2;
- no physical/device validation is claimed.

## 4. Initial Git Status

The worktree was already dirty before H3.1 edits. The captured pre-edit tracked diff stat was:

```text
73 files changed, 4144 insertions(+), 3886 deletions(-)
```

Pre-edit tracked changes included broad app, native module, render, training, backend, history, checkup, and website files. Pre-edit untracked files included prior audit reports/prompts and multiple Stage 3D-B, Stage 5, render, voice, training, and H0-H3 artifacts.

No attempt was made to revert or normalize unrelated changes.

## 5. Baseline Validation

Before H3.1 edits, these gates passed:

```text
npm test -- --runInBand <H3 focused suite list>
```

Result: 29 suites passed, 241 tests passed.

```text
npm run verify:audio
```

Result: audio verification passed with safety 44 cues / 88 required assets, Movement Profile V2 31 cues / 62 required assets, total 150 required assets.

```text
npm test -- --runInBand
```

Result: 139 suites passed, 1147 tests passed.

```text
npm run typecheck
npm --prefix website run typecheck
npx --no-install expo config --type public
git diff --check
npx --no-install expo export --platform all --output-dir /tmp/pearl-unified-h31-baseline-export
```

All passed. Expo config/export printed existing Sentry config warnings and environment variable names only, not secret values. The temporary baseline export directory was removed.

## 6. Actual H3 Production Callback Map

The H3.1 inspection confirmed the production path:

- `beginCheckUp` calls `selectPublicMovementCheckUpLaunch`.
- Flag off public `baseline` routes to the V1 Check-Up flow.
- Flag on public `baseline` and `baseline_retake` route to unified Movement Profile V2.
- `beginUnifiedMovementProfileV2Public` resumes pending raw when present, otherwise starts unified capture.
- `handleMovementProfileV2RawComplete` saves raw V2 history before reference details.
- `handleMovementProfileV2ReferenceSubmit` materializes V2 snapshot, V2 assessment, V2-origin block, unified result state, and plan state.
- `handleMovementProfileV2ViewPlan` navigates only:
  - public onboarding completes profile state and routes to `block-intro`;
  - standard flow routes to the Plan tab.
- Today, Plan, Progress, and direct `beginCheckUp('official_retest')` use the same selector and are blocked for active V2-origin blocks.
- Public unified routes are gated by `PUBLIC_MOVEMENT_PROFILE_V2_FLOWS` when the release flag is enabled and the entry context is not internal.

## 7. Integration-Harness Architecture

Added `src/checkup/__tests__/publicUnifiedMovementCheckUpLifecycle.integration.test.ts`.

The harness uses production helpers rather than fake artifacts:

- `selectPublicMovementCheckUpLaunch`;
- `createMovementProfileV2InternalFlow` and `movementProfileV2InternalFlowReducer`;
- `MovementProfileV2LiveCoordinator`;
- `movementProfileV2RawCheckUpFromFlow`;
- `HistoryStore` with `createMemoryFs`;
- `materializeOfficialMovementProfileV2Artifacts`;
- `materializeMovementProfileV2Block`;
- `buildMovementProfileV2ResultsViewModel`;
- `buildMovementProfileV2UnifiedResultsPresentation`;
- `serializeCheckUp` and `deserializeCheckUp`;
- `mapRemotePearlSnapshotToLocal`;
- app lifecycle, plan, progress, schedule, and session-planning helpers.

The test file includes a Jest-safe `lib/supabase` mock so restore mapping can be tested without loading native AsyncStorage.

## 8. Flag-Off V1 Proof

The test suite proves `releaseEnabled: false` selects `legacy_v1` for public onboarding baseline.

It then runs the current V1 artifact path:

- synthetic V1 Check-Up;
- V1 score snapshot via `createCurrentVersionedScoreSnapshot`;
- V1 MovementAssessment via `createMovementAssessment`;
- V1 MovementBlock via `createMovementBlockFromAssessment`;
- history serialization with `scoreSnapshotCompatibility: current`.

It asserts no V2 snapshot or V2 assessment appears in the flag-off V1 baseline record.

## 9. Flag Matrix Proof

The flag matrix test proves:

```text
release=false, internal=false -> public engine legacy_v1, internal rows hidden
release=false, internal=true  -> public engine legacy_v1, internal rows shown
release=true,  internal=false -> public engine unified_movement_profile, internal rows hidden
release=true,  internal=true  -> public engine unified_movement_profile, internal rows shown
```

It also asserts `parseUnifiedMovementCheckUpReleaseFlag` returns true only for exact `1`; `undefined`, `0`, and `true` are false.

## 10. Flag-On Domain Onboarding Proof

The domain onboarding test uses a raw baseline produced by `MovementProfileV2LiveCoordinator`. It proceeds through:

- chair;
- one-leg balance;
- shoulder;
- hinge;
- raw history save;
- entered reference details;
- snapshot creation;
- assessment creation;
- block creation;
- result view model;
- presentation CTA.

The resulting V2 assessment is a domain focus, currently `balance`, and the V2-origin block has `origin.kind: movement_profile_v2_assessment`.

## 11. Flag-On Balanced Onboarding Proof

The Balanced onboarding test uses captured raw V2 input that produces a Balanced assessment.

It proves:

- assessment focus kind is `balanced`;
- block focus kind is `balanced`;
- `movementBlockIsBalanced(block)` is true;
- `movementBlockDomainFocus(block)` is null;
- no fake `focusDomain` is injected;
- required main plan templates are `balanced-A`, `balanced-B`, and `balanced-C`;
- unified result CTA remains `View my 4-week plan`;
- onboarding CTA target is `block-intro`.

## 12. No-V1-Artifact Proof

The flag-on public onboarding tests assert:

- raw V2 history has `scoreSnapshotCompatibility: unsupported_checkup_protocol`;
- no V1 score snapshot is stored;
- no V1 MovementAssessment is added to adherence;
- no legacy/V1-origin block exists;
- snapshot and assessment are stored as Movement Profile V2 artifacts;
- block id uses `movement-block-v2:<assessment-id>`.

## 13. Reference-Details Variants

The suite covers both entered and skipped reference details:

- entered profile freezes age and sex into the V2 reference profile;
- skipped profile stores unknown reference fields;
- both variants can materialize valid V2 artifacts and a V2-origin block when raw evidence is valid.

The entered profile test also verifies chair remains raw-only rather than becoming a published reference claim.

## 14. Invalid-Headline Fail-Closed Proof

The suite mutates a complete public V2 raw record so one headline domain carries invalid balance evidence.

Result:

- artifact materialization returns `ok: false`;
- rejection reason is `v2_assessment_orchestration_ineligible_source`;
- no V2 snapshot is stored;
- no V2 assessment is stored;
- no V2 block can be materialized from the rejected artifacts;
- no result or plan is created.

The raw record can remain pending reference details, but the dangerous boundary is closed: invalid headline evidence cannot create a plan.

## 15. Standard/Baseline-Retake Proof

The suite covers standard baseline and `baseline_retake` behavior:

- a standard public V2 baseline can materialize a V2-origin block;
- a later `baseline_retake` creates a distinct immutable snapshot and assessment;
- the earlier assessment fingerprint is preserved;
- an already active V2-origin block is not replaced by the retake;
- conflicting active-block materialization fails closed instead of overwriting.

## 16. Duplicate-Callback/Idempotency Proof

The idempotency test covers:

- duplicate raw completion for the same `startedAt`;
- history dedupe through same checkup file identity;
- pending reference details state remains singular;
- duplicate reference submission reuses the existing snapshot;
- duplicate assessment submission reuses the existing assessment;
- duplicate block materialization reuses the existing block;
- repeated results CTA does not create a second block.

## 17. Resume Matrix

The test suite covers:

- raw-only history;
- snapshot-only history;
- assessment-without-block history;
- complete V2 state;
- flag-off partial V2 state;
- flag-off complete V2 state.

It asserts partial V2 states never become V1 artifacts, and complete V2 states remain usable when the release flag is off.

## 18. Remote Restore Proof

The remote restore test builds a backend-shaped snapshot with:

- V2 raw Check-Up JSON;
- V2 derived score JSON containing snapshot and assessment;
- V2 block JSON.

`mapRemotePearlSnapshotToLocal` parses these artifacts without recomputing them. The restored local state contains:

- one history record with the original snapshot fingerprint;
- one history record with the original assessment fingerprint;
- no legacy adherence assessments;
- a restored V2-origin block usable by session planning.

## 19. Local-First/Sync-Failure Proof

The suite injects `planSyncMode: sync_pending_local_ready` into unified results presentation.

It proves:

- local raw/snapshot/assessment/block are ready before backend success;
- result CTA still says `View my 4-week plan`;
- CTA target remains usable;
- no rollback to V1 occurs;
- retry/replay boundaries do not duplicate artifacts.

## 20. Kill-Switch Complete-State Proof

The complete-state kill-switch test proves:

- turning the public release flag off after a complete V2 baseline does not erase raw, snapshot, assessment, or block;
- the V2-origin block remains trainable;
- Plan and Progress models continue to use the active V2 block;
- no V1 retest is launched from that V2-origin block.

## 21. Kill-Switch Partial-State Proof

The partial-state kill-switch test proves:

- raw-complete pending V2 state is not scored as V1 when the flag is off;
- snapshot-only state remains V2 partial state;
- assessment-without-block remains V2 partial state;
- flag toggling does not rewrite or backfill artifacts.

## 22. Official-Retest Containment By Entry Point

The suite covers official-retest containment through:

- Today primary action;
- Plan `onStartRetest`;
- Progress `onStartRetest`;
- direct selector/action equivalent for `beginCheckUp('official_retest')`;
- Home exposure checks.

For a V2-origin active block, each entry is unavailable with reason `movement_profile_v2_retest_not_available` and does not launch V1.

The suite also proves true V1 rollback retest remains available for a V1-origin block.

## 23. Internal Harness/Public Copy Proof

The suite confirms:

- internal harness entry points still exist behind `MOVEMENT_PROFILE_V2_INTERNAL_ENABLED`;
- public release flag alone does not expose developer rows;
- public presentation copy does not include internal terms such as `v2`, `internal`, `developer`, `debug`, or `Warden`;
- the public CTA label remains `View my 4-week plan`.

## 24. Observability/Privacy Proof

The suite verifies the observability sanitizer removes sensitive data from breadcrumb-shaped objects:

- pose landmarks;
- raw video/media keys;
- auth tokens;
- local file paths.

The H3.1 public result/action assertions also avoid including pose/media/health text in public presentation payloads.

## 25. Defects Found

No production runtime defect was proven by H3.1.

Harness defects found and fixed while developing the integration test:

- a test string literal escaping error;
- restore-service import required the existing Jest-safe Supabase mock;
- invalid raw evidence is intentionally rejected at the public orchestration eligibility boundary;
- serialized remote fixture payloads needed JSON round-tripping for TypeScript.

## 26. Production Fixes, If Any

None.

No production source was changed for H3.1. The only code artifact added was a focused integration test.

## 27. Files Changed

H3.1-owned files:

- `src/checkup/__tests__/publicUnifiedMovementCheckUpLifecycle.integration.test.ts`
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H3_1_END_TO_END_VERIFICATION.md`

The worktree also contains many pre-existing or concurrent modifications and untracked files outside H3.1 scope. They were not reverted or normalized.

## 28. Tests Added/Changed

Added one integration test file:

```text
src/checkup/__tests__/publicUnifiedMovementCheckUpLifecycle.integration.test.ts
```

Contents:

- 11 integration tests;
- 1436 lines;
- domain and Balanced public onboarding paths;
- live-coordinator raw baseline path;
- flag matrix;
- flag-off V1 path;
- reference detail variants;
- invalid-headline fail-closed behavior;
- baseline-retake immutability;
- idempotency;
- resume/restore;
- local-ready sync-pending state;
- kill-switch state preservation;
- official-retest containment;
- internal harness/public copy/privacy checks.

## 29. Exact Focused Validation

Single new H3.1 suite:

```text
npm test -- --runInBand src/checkup/__tests__/publicUnifiedMovementCheckUpLifecycle.integration.test.ts
```

Result after final test edits:

```text
Test Suites: 1 passed, 1 total
Tests:       11 passed, 11 total
```

Focused H3/H3.1 regression set:

```text
npm test -- --runInBand src/checkup/__tests__/publicUnifiedMovementCheckUpLifecycle.integration.test.ts src/config/__tests__/unifiedMovementCheckUpRelease.test.ts src/checkup/__tests__/publicCheckUpEngine.test.ts src/screens/__tests__/CheckUpRecordingShell.test.ts src/results/__tests__/movementProfileV2ResultsAdapter.test.ts src/results/__tests__/resultsArchitecture.test.ts src/movementProfileV2/__tests__/liveCoordinator.test.ts src/movementProfileV2/__tests__/internalCheckupFlow.test.ts src/reference/movementProfileV2/__tests__/persistence.test.ts src/pearlFlow/__tests__/movementProfileV2Block.test.ts src/onboarding/__tests__/onboarding.test.ts src/history/__tests__/history.test.ts src/services/backend/__tests__/restoreService.test.ts src/pearlFlow/__tests__/appLifecycle.test.ts src/pearlFlow/__tests__/progressViewModel.test.ts src/pearlFlow/__tests__/planViewModel.test.ts src/pearlFlow/__tests__/stage5g1ScheduleVerification.test.ts src/pearlFlow/__tests__/stage5hLifecycle.integration.test.ts
```

Result:

```text
Test Suites: 18 passed, 18 total
Tests:       176 passed, 176 total
```

Warnings: existing Watchman recrawl warning and Jest open-handle notice.

## 30. Exact Full Validation

Full Jest after adding the H3.1 suite:

```text
npm test -- --runInBand
```

Result after the final H3.1 test-harness edits:

```text
Test Suites: 140 passed, 140 total
Tests:       1158 passed, 1158 total
```

Warnings/logs:

- existing Watchman recrawl warning;
- expected backend sync test logs;
- expected backend failure-path warnings in backend sync tests;
- existing Jest open-handle notice.

## 31. Audio Verification

Command:

```text
npm run verify:audio
```

Result:

```text
AUDIO VERIFICATION PASS safety: requiredCues=44 voices=clara,marcus requiredAssets=88 totalBytes=4637324 durationRange=1.858-5.155s movementProfileV2: requiredCues=31 voices=clara,marcus requiredAssets=62 totalBytes=3057566 durationRange=0.743-6.037s total: requiredAssets=150
```

No audio was regenerated.

## 32. App/Website Typechecks

Commands:

```text
npm run typecheck
npm --prefix website run typecheck
```

Results:

- app TypeScript passed after fixing test-harness-only fixture typing;
- website TypeScript passed;
- both app and website TypeScript were rerun after a concurrent website diff-stat shift and still passed.

## 33. Expo Config/Export

Expo config:

```text
npx --no-install expo config --type public
```

Result: passed.

Notes:

- output printed environment variable names only, not secret values;
- `UNIFIED_MOVEMENT_CHECKUP_RELEASE_ENABLED` was not exported/enabled in public config;
- existing Sentry organization/project warning remained;
- public config included `enablePoseLatencyDiagnostics: true` and `allowDiagnosticsInRelease: true` from local environment.

Export:

```text
rm -rf /tmp/pearl-unified-h31-export
npx --no-install expo export --platform all --output-dir /tmp/pearl-unified-h31-export
rc=$?
rm -rf /tmp/pearl-unified-h31-export
exit $rc
```

Result: passed.

Export details:

- Android bundled;
- iOS bundled;
- assets: 444;
- output directory removed after command;
- existing Sentry warning and `NO_COLOR`/`FORCE_COLOR` warning remained.

## 34. H0/H1/H2/H3/Stage 3D-B/Stage 4/Stage 5 Regression

The focused and full gates cover:

- H0 health gate persistence/scoring safety through history, scoring, and restore tests;
- H1 shell/adapter behavior through Check-Up recording shell and public engine tests;
- H2 result shell/V2 profile through results adapter and architecture tests;
- H3 baseline/onboarding cutover through public engine, onboarding, app lifecycle, V2 block, and H3.1 lifecycle tests;
- Stage 3D-B render/native work through render, pose overlay, and native config/export checks;
- Stage 5G.1 and Stage 5H training lifecycle through schedule, plan, app lifecycle, and session-planning tests.

No H4 behavior was added.

## 35. Remaining H4/H5 Work

Remaining work is outside H3.1:

- physical/device validation;
- real camera validation on Android/iOS;
- release-candidate QA;
- public rollout decision;
- any future H4/H5 scope explicitly approved by the product owner.

Public release readiness is not claimed by H3.1.

## 36. Whether H4 Is Unblocked

H3.1 software verification passed and can be used as the handoff into H4.

H4 itself was not started. Public release remains blocked until H4/H5 and physical/device validation are complete.

## 37. Initial/Final Git Status

Initial pre-edit tracked diff stat:

```text
73 files changed, 4144 insertions(+), 3886 deletions(-)
```

Final tracked diff stat from the refreshed worktree:

```text
74 files changed, 4559 insertions(+), 3876 deletions(-)
```

Final untracked count:

```text
119
```

The final status includes the H3.1 report itself as an additional untracked file.

## 38. Complete Files-Changed Inventory

Tracked modified/deleted files present in the final refreshed worktree:

```text
M .env.example
M App.tsx
M docs/decisions.md
M modules/expo-pose-detection/android/src/main/java/expo/modules/posedetection/ExpoPoseDetectionModule.kt
M modules/expo-pose-detection/android/src/main/java/expo/modules/posedetection/PoseDetectionView.kt
M modules/expo-pose-detection/ios/ExpoPoseDetectionModule.swift
M modules/expo-pose-detection/ios/PoseDetectionView.swift
M modules/expo-pose-detection/src/ExpoPoseDetection.types.ts
M modules/expo-pose-detection/src/PoseDetectionView.tsx
M src/adherence/types.ts
M src/checkup/__tests__/checkupFlow.integration.test.ts
M src/checkup/index.ts
M src/checkup/movementProfileV2.ts
M src/checkup/protocolSetup.ts
M src/checkup/types.ts
M src/config/__tests__/movementProfileV2Internal.test.ts
M src/diagnostics/__tests__/poseLatencyDiagnostics.test.ts
M src/diagnostics/poseLatencyDiagnostics.ts
M src/diagnostics/poseRendererReplay.ts
M src/pearlFlow/__tests__/copyGuardrails.test.ts
M src/pearlFlow/__tests__/progressViewModel.test.ts
M src/pearlFlow/progressViewModel.ts
M src/pearlFlow/reports.ts
M src/history/__tests__/history.test.ts
M src/history/serialize.ts
M src/history/trends.ts
M src/movementProfileV2/__tests__/internalCheckupFlow.test.ts
M src/movementProfileV2/internalCheckupFlow.ts
M src/movementProfileV2/viewModel.ts
M src/movements/__tests__/movementProfileV2Protocols.test.ts
M src/movements/index.ts
M src/reference/movementProfileV2/__tests__/referenceEngine.test.ts
M src/reference/movementProfileV2/engine.ts
M src/reference/movementProfileV2/snapshot.ts
M src/reference/movementProfileV2/types.ts
D src/render/MatteGraphiteDigitalTwinRenderer.tsx
M src/render/PoseAvatarRenderer.tsx
D src/render/__tests__/matteGraphiteDigitalTwinGeometry.test.ts
M src/render/__tests__/poseAvatarConfig.test.ts
D src/render/matteGraphiteDigitalTwinConfig.ts
D src/render/matteGraphiteDigitalTwinGeometry.ts
M src/render/poseAvatarTypes.ts
M src/screens/CheckUpScreen.tsx
M src/screens/MicroCheckScreen.tsx
M src/screens/MovementProfileV2CheckUpScreen.tsx
M src/screens/MovementProfileV2ReferenceDetailsScreen.tsx
M src/screens/OnboardingResultsScreen.tsx
M src/screens/PoseOverlayBenchmarkScreen.tsx
M src/screens/ProgressScreen.tsx
M src/screens/ResultsScreen.tsx
M src/screens/SettingsScreen.tsx
M src/screens/TrainingSessionScreen.tsx
M src/services/backend/__tests__/checkupSyncService.test.ts
M src/services/backend/__tests__/microCheckSyncService.test.ts
M src/services/backend/__tests__/restoreService.test.ts
M src/services/backend/checkupSyncService.ts
M src/services/backend/microCheckSyncService.ts
M src/services/backend/restoreService.ts
M src/training/__tests__/microCheck.test.ts
M src/training/dynamicState.ts
M src/training/index.ts
M src/training/microCheck.ts
M src/training/serialize.ts
M src/training/workoutGeneration.ts
M website/app/globals.css
M website/app/layout.tsx
M website/app/page.tsx
M website/src/components/LandingPage.tsx
M website/src/components/SiteFooter.tsx
M website/src/components/SiteHeader.tsx
M website/src/config/site.ts
M website/src/content/landing.ts
M website/tests/e2e/landing.spec.ts
M website/tests/unit/components.test.tsx
```

H3.1-owned untracked files:

```text
?? src/checkup/__tests__/publicUnifiedMovementCheckUpLifecycle.integration.test.ts
?? docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H3_1_END_TO_END_VERIFICATION.md
```

Other untracked files were inherited or concurrent audit/implementation artifacts outside the H3.1-owned scope. Final untracked count is 119.

## 39. Concurrent External Changes

The worktree contained unrelated tracked and untracked changes before H3.1. During H3.1, those files were left alone.

Observed unrelated areas included:

- native pose detection modules;
- renderers and render geometry;
- checkup protocol/metadata work;
- backend sync/restore work;
- training voice and both-sides-rounds work;
- website landing-page work;
- prior audit reports/prompts.

During final validation, the tracked diff stat shifted from the earlier captured `73 files changed, 4156 insertions(+), 3886 deletions(-)` to `74 files changed, 4559 insertions(+), 3876 deletions(-)`, with the visible stat movement in `docs/decisions.md` and website files. App and website TypeScript were rerun after this shift and passed.

No unrelated edits were reverted.

## 40. No Package/Lockfile/Audio/Git Mutation Confirmation

Confirmed:

- no package install occurred;
- no lockfile change was made by H3.1;
- no audio regeneration occurred;
- no `.env` values were inspected or exposed;
- no staging occurred;
- no commit occurred;
- no branch was created or switched;
- no push occurred;
- no pull request was opened;
- no prior reports were edited;
- `docs/decisions.md` was not edited by H3.1;
- H4 was not started.

## Release Decision

H3.1 verifies the H3 software lifecycle for the unified public Movement Check-Up cutover.

Public release remains blocked. H3.1 does not claim physical/device validation, H4 completion, H5 completion, or production rollout readiness.
