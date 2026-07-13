# Pearl Unified Movement Check-Up Stage H3 Baseline / Onboarding Cutover

Date: 2026-06-25

## 1. Scope

Stage H3 implements the controlled public baseline/onboarding cutover to the unified Movement Profile V2 engine behind one fail-closed build-time flag:

```text
EXPO_PUBLIC_ENABLE_UNIFIED_MOVEMENT_CHECKUP=1
```

The flag defaults off. Flag off keeps the existing V1 public baseline path. Flag on routes public baseline and baseline retake starts through the existing H1 unified Check-Up shell, V2 live protocol engine, raw-first local persistence, reference details, frozen V2 snapshot/assessment, automatic V2 block materialisation, H2 unified Movement Profile results, and the exact navigation-only CTA `View my 4-week plan`.

H3 does not implement official V2 retest, V2 reports, next-block transition, public Progress migration, Warden chair transforms, V1 legacy-result migration, new dependencies, audio generation, or lockfile changes.

## 2. H2 Prerequisite Evidence

Read in full before implementation:

- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H2_V1_RESULTS_SHELL_V2_PROFILE.md`
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H1_V1_SHELL_V2_ADAPTER.md`
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H0_HEALTH_GATE.md`
- `docs/audits/PEARL_MOVEMENT_CHECKUP_V1_V2_CURRENT_IMPLEMENTATION_AUDIT.md`
- Stage 3D-B, Stage 5G.1, and Stage 5H reports listed in the prompt.

H2 was treated as complete and authoritative: shared polished result shell implemented, V1 result parity verified, frozen V2 Movement Profile adapter implemented, internal unified V2 results flow verified, public routing unchanged, V2 plan CTA navigation-only, Progress migration deferred, Warden deferred, chair reference claim raw-only.

## 3. Founder Decisions Carried Forward

- One canonical future public product is the unified Movement Check-Up backed by V2 raw-result contracts and frozen Movement Profile artifacts.
- V1 remains only as the H3 rollback implementation.
- No V1-user migration was added.
- Plan creation remains automatic before results.
- The CTA is exactly `View my 4-week plan` and only navigates.
- Chair remains raw-only.
- Physical-device validation is not claimed.
- Public release remains blocked.

## 4. Initial Git Status

Initial state was captured before H3 edits with:

```bash
git status --short --untracked-files=all
git diff --name-only
git diff --stat
git ls-files --others --exclude-standard
```

The worktree was already dirty. Tracked modified files included `.env.example`, `App.tsx`, `docs/decisions.md`, native pose files, adherence/checkup/config/diagnostics/history/movementProfileV2/reference/render/screens/backend/training files, and `website/next-env.d.ts`. Tracked deletions included the matte graphite renderer/config/geometry files. Untracked files included H0/H1/H2/H3 audit prompts/reports, multiple pose/render/training/voice audit files, V2 result shell files, unified check-up/result screens, measurement metadata files, and voice V2.1 files.

User-owned concurrent work was preserved. No destructive Git command was used.

## 5. Baseline Validation

Pre-edit focused validation passed:

```bash
npm test -- --runInBand src/results/__tests__/movementProfileV2ResultsAdapter.test.ts src/results/__tests__/resultsArchitecture.test.ts src/screens/__tests__/CheckUpRecordingShell.test.ts src/screens/__tests__/MovementProfileV2CheckUpScreen.voiceRuntime.test.ts src/config/__tests__/movementProfileV2Internal.test.ts src/movementProfileV2/__tests__/viewModel.test.ts src/movementProfileV2/__tests__/recovery.test.ts src/movementProfileV2/__tests__/internalCheckupFlow.test.ts src/movementProfileV2/__tests__/liveCoordinator.test.ts src/movementProfileV2/__tests__/voiceRuntime.test.ts src/movementProfileV2/__tests__/voiceCues.test.ts src/pearlFlow/__tests__/movementProfileV2Block.test.ts src/pearlFlow/__tests__/appLifecycle.test.ts src/pearlFlow/__tests__/progressViewModel.test.ts src/pearlFlow/__tests__/copyGuardrails.test.ts src/reference/movementProfileV2/__tests__/snapshot.test.ts src/reference/movementProfileV2/__tests__/assessment.test.ts src/reference/movementProfileV2/__tests__/persistence.test.ts src/history/__tests__/history.test.ts src/checkup/__tests__/checkupFlow.integration.test.ts src/assessment/__tests__/sessionController.test.ts src/screens/__tests__/recordingViewport.test.ts src/onboarding/__tests__/onboarding.test.ts src/pearlFlow/__tests__/stage5g1ScheduleVerification.test.ts src/pearlFlow/__tests__/stage5hLifecycle.integration.test.ts
```

Result: 25 suites passed, 191 tests passed. Existing Watchman recrawl warning.

Pre-edit full validation passed:

- `npm run verify:audio`: safety 44 cues / 88 assets; Movement Profile V2 31 cues / 62 assets; total 150 assets.
- `npm test -- --runInBand`: 135 suites passed, 1115 tests passed. Existing Watchman recrawl warning and Jest open-handle notice.
- `npm run typecheck`: passed.
- `npm --prefix website run typecheck`: passed.
- `npx --no-install expo config --type public`: passed with existing Sentry config warning.
- `git diff --check`: passed.
- `npx --no-install expo export --platform all --output-dir /tmp/pearl-unified-h3-baseline-export`: passed, Android/iOS bundles, 444 assets, existing Sentry and `NO_COLOR`/`FORCE_COLOR` warnings; temp dir removed.

## 6. Current Public Onboarding Architecture

Flag-off public onboarding remains:

```text
welcome
-> life-goal / safety-profile / equipment
-> camera-explanation
-> camera-setup
-> beginCheckUp('baseline')
-> checkup
-> V1 CheckUpScreen
-> results
-> V1 OnboardingResultsScreen
-> automatic V1 block preparation
-> onboarding-block
-> Today / first session readiness
```

Persistent checkpoints:

- `prefs.onboarding.currentStep` advances through onboarding.
- `beginOnboardingCheckUp()` records `baseline_checkup`.
- V1 `handleCheckUpComplete()` saves checkup, score snapshot, `MovementAssessment`, and automatic block, then records `currentStep: 'results'`.
- `handleOnboardingResultsContinue()` marks onboarding complete and opens the existing onboarding block route.

## 7. V1 Assumption Inventory

| Consumer | Current V1 assumption | H3 flag-off behavior | H3 flag-on behavior |
| --- | --- | --- | --- |
| `beginCheckUp` | Launches V1 `CheckUpScreen` for baseline | Unchanged | Delegates baseline/baseline_retake to unified V2 |
| `handleCheckUpComplete` | Creates V1 score snapshot and `MovementAssessment` | Unchanged | Not used by public unified baseline |
| V1 results | Reads `CheckUpScore` and V1 assessment | Unchanged | Not used for public unified baseline |
| Onboarding result state | Uses V1 result route for V1 | Unchanged | V2 onboarding result uses H2 unified result variant |
| Block creation | V1 `createAutomaticMovementBlock` | Unchanged | Existing V2 `materializeMovementProfileV2Block` |
| Official retest | V1 block retest can use V1 | Unchanged for V1-origin blocks | V2-origin blocks fail closed |
| Progress | V1/history presentation | Unchanged | No public migration |

V2 artifacts are not cast into V1 `MovementAssessment`.

## 8. Release-Flag Architecture

Added:

- `src/config/unifiedMovementCheckUpRelease.ts`
- `src/config/__tests__/unifiedMovementCheckUpRelease.test.ts`

Parser:

```ts
parseUnifiedMovementCheckUpReleaseFlag(value: unknown): boolean {
  return value === '1';
}
```

Default:

```text
.env.example: EXPO_PUBLIC_ENABLE_UNIFIED_MOVEMENT_CHECKUP=0
```

No user, backend, profile, restore, remote JSON, `__DEV__`, Settings, or diagnostics value can enable the cutover.

## 9. Flag Precedence Matrix

| Release flag | Internal V2 flag | Public baseline | Developer V2 rows |
| --- | --- | --- | --- |
| off | off | V1 | hidden |
| off | on | V1 | visible internally |
| on | off | unified V2 | hidden |
| on | on | unified V2 | visible internally |

Settings rows remain gated only by `MOVEMENT_PROFILE_V2_INTERNAL_ENABLED`.

## 10. Public Engine-Selector Contract

Added:

- `src/checkup/publicCheckUpEngine.ts`
- `src/checkup/__tests__/publicCheckUpEngine.test.ts`

The pure selector takes explicit source type, entry context, release flag, accepted prior V2 baseline context, and active block origin kind. It performs no ambient history reads and does not log.

Ready engines:

- `legacy_v1`
- `unified_movement_profile`

Unavailable reasons:

- `unsupported_public_checkup_source`
- `v2_official_retest_not_available_in_this_build`

## 11. Baseline / Baseline-Retake Rules

- Release off baseline -> `legacy_v1`.
- Release off baseline retake -> `legacy_v1`.
- Release on baseline -> `unified_movement_profile`.
- Release on baseline retake -> `unified_movement_profile`.
- Release on baseline with prior accepted V2 baseline -> source type freezes as `baseline_retake`.
- Manual extra, quick recheck, and micro check stay legacy.
- `legacy_unknown` fails closed.

The App freezes the selected source type and entry context at launch by storing V2 initial flow state or V1 pending checkup state. A launched unified check-up does not switch to V1 mid-run.

## 12. Official-Retest Containment Rule

If an active/current block has `origin.kind === 'movement_profile_v2_assessment'`, `beginCheckUp('official_retest')` returns typed unavailable recovery before creating V1 pending check-up state.

Recovery route:

```text
movement-profile-v2-retest-unavailable
```

User copy is calm and does not mention V1/V2:

```text
Your next Check-Up is coming soon.
Your current plan and progress are saved.
```

No V1 Check-Up, V1 score, V1 report, or next block is created.

## 13. Public H1 Check-Up Routing

Flag-on public baseline mounts:

```text
MovementProfileV2UnifiedCheckUpScreen
-> CheckUpRecordingShell
```

Added public/internal entry mode prop. Public accessibility label is `Leave Movement Check-Up`; internal comparison label is `Leave Movement Profile`.

The camera explanation/setup screens are unchanged. Public users do not need Settings or developer rows.

## 14. Public Reference-Details Routing

`MovementProfileV2ReferenceDetailsScreen` is reused. Added `entryMode` prop:

- public label: `Back to Movement Check-Up`
- internal label: `Back to Movement Profile`

Reference details remain per-checkup, optional, skip allowed, no profile mutation, and raw result remains saved before details.

## 15. Artifact / Materialisation Reuse

The public flow reuses the existing H2/H1 application boundary:

```text
raw V2 Check-Up
-> materializeOfficialMovementProfileV2Artifacts
-> local checkup with frozen snapshot + assessment
-> materializeMovementProfileV2Block
-> local block
-> best-effort remote sync
-> H2 unified results
```

No duplicate snapshot, assessment, focus, prior-focus, block, or sync implementation was added.

## 16. Proof of No V1 Artifacts in Flag-On Path

Flag-on baseline exits `beginCheckUp` before V1 pending state is created:

```text
selectPublicMovementCheckUpLaunch(...)
-> engine unified_movement_profile
-> setPendingCheckup(null)
-> beginUnifiedMovementProfileV2Public(...)
-> movement-profile-v2-unified-checkup
```

The V1 path remains isolated in `handleCheckUpComplete()`. Public unified completion uses `handleMovementProfileV2RawComplete()` and `handleMovementProfileV2ReferenceSubmit()`, which call the V2 artifact and block materialisers.

Tests/source guards cover the release flag, selector, App route selection, unified route, recovery route, public labels, and exact CTA adapter behavior.

## 17. Public H2 Results Routing

Flag-on public result route:

```text
movement-profile-v2-unified-results
-> MovementProfileV2UnifiedResultsScreen
-> CheckUpResultsShell
```

Variant:

- onboarding entry -> `onboarding`
- standard entry -> `standard`

Standalone V2 result harness remains available under the internal flag.

## 18. Automatic Plan / CTA Behavior

The V2 block is created or reused before results render. The CTA remains:

```text
View my 4-week plan
```

CTA behavior:

- Standard/internal result: navigate to Plan tab.
- Public onboarding result: mark onboarding complete and navigate to existing `block-intro`.
- No plan is created, regenerated, replaced, synced, or started by the CTA.

No `Build my plan`, `Create my plan`, `Generate my plan`, or `Personalise my plan` action was added.

## 19. Onboarding State Integration

Public V2 onboarding records:

- `baseline_checkup` before launch via existing `beginOnboardingCheckUp()`.
- `results` only after materialized local V2 snapshot/assessment/block flow has completed.
- `complete` only when the user taps `View my 4-week plan`.

The CTA opens `block-intro`, which uses the active V2-origin block. No session starts automatically.

## 20. Domain and Balanced Onboarding

H2 results already represent domain and Balanced focus. `BlockIntroScreen` handles balanced focus through `movementBlockDomainFocus(block) ?? 'Balanced'` style copy and does not need a fake focus domain. H3 routes onboarding CTA to `block-intro`, not the older onboarding block screen that assumes a domain fallback.

## 21. Resume / Relaunch Matrix

Implemented/reused behavior:

| Boundary | H3 behavior |
| --- | --- |
| Exit during live V2 stages | Existing V2 flow state stays in the launched screen; no V1 fallback is introduced |
| Raw complete before reference details | Raw V2 check-up saved locally; `latestPendingMovementProfileV2RawCheckUp` resumes details |
| Reference details submitted | Existing materializer attaches frozen snapshot/assessment |
| Block sync failed | Local-ready plan state remains usable |
| Results shown before CTA | V2 result state holds plan block id/state; CTA remains navigation-only |
| CTA tapped before close | Onboarding prefs move to complete and `block-intro` opens |
| Duplicate raw/reference callbacks | Existing stable checkup IDs and V2 materialization policy are reused |

No partial V2 flow is routed into V1 by H3.

## 22. Restore / Idempotency

Existing local-first and remote restore services remain unchanged. H3 does not recompute V2 artifacts on restore and does not add remote rollout authority. Existing accepted V2 artifacts remain parseable and the matching V2 block remains trainable. Pending raw V2 resumes reference details only when the unified/public/internal flow is explicitly started under an allowed route.

## 23. Rollback / Kill-Switch Behavior

Release flag off controls starting new public unified measurements. Existing V2 artifacts and active V2 blocks are not converted to V1 or deleted. A V2-origin official retest is still contained and cannot launch V1. A new public baseline with flag off uses the legacy V1 route.

## 24. Settings / Internal Harness Behavior

Release flag alone does not expose developer Settings rows. Internal flag on still exposes:

- standalone Movement Profile V2 check-up harness;
- unified internal H1/H2 path;
- latest V2 Movement Profile view in Progress where already implemented.

Internal H1/H2/V2 reference harnesses are retained.

## 25. Public Copy Guardrails

Public unified flow avoids user-facing:

- internal/developer wording in back labels;
- V2/unified engine labels;
- diagnostics/schema/policy/fingerprint/source ID wording;
- Movement Age/body age/weakest domain wording;
- physical-validation claims;
- plan-build CTAs.

Allowed public names remain Movement Check-Up, Movement Profile, Suggested focus, and `View my 4-week plan`.

## 26. Deep-Link / Route Protection

No public deep links were added. Existing route handling still enters checkups through `beginCheckUp`, which calls the selector. Movement Profile V2 flows remain guarded: internal routes require the internal flag; public unified routes require the release flag and public entry context except the explicit V2-retet unavailable recovery.

## 27. Observability / Privacy

Added bounded breadcrumbs:

- public launch with engine/source/entry context;
- unavailable checkup launch with reason/source type.

No landmarks, video/images, pose coordinates, profile free text, auth tokens, provider secrets, or health notes are logged.

## 28. Product Containment

No changes were made to Warden, V2 protocol algorithms, reference transforms, snapshot/assessment schema, focus policy, V2 block policy, exercise catalog, Stage 4/5 rules, Progress presentation, audio text/assets, native pose/camera configuration, website source, dependencies, lockfiles, or fonts.

## 29. Files Changed

H3-authored files:

- `.env.example`: documented `EXPO_PUBLIC_ENABLE_UNIFIED_MOVEMENT_CHECKUP=0`.
- `App.tsx`: release selector integration, public unified launcher, public result/CTA routing, V2-origin official-retest containment, public route guard.
- `src/config/unifiedMovementCheckUpRelease.ts`: strict release flag module.
- `src/config/__tests__/unifiedMovementCheckUpRelease.test.ts`: parser/default tests.
- `src/checkup/publicCheckUpEngine.ts`: pure public engine selector.
- `src/checkup/__tests__/publicCheckUpEngine.test.ts`: selector and App/source guard tests.
- `src/screens/MovementProfileV2UnifiedCheckUpScreen.tsx`: public/internal entry label prop.
- `src/screens/MovementProfileV2ReferenceDetailsScreen.tsx`: public/internal entry label prop.
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H3_BASELINE_ONBOARDING_CUTOVER.md`: this report.

Note: several touched files were already modified or untracked before H3. External user-owned changes were preserved.

## 30. Tests Added / Changed

Added:

- `src/config/__tests__/unifiedMovementCheckUpRelease.test.ts`
- `src/checkup/__tests__/publicCheckUpEngine.test.ts`

Existing H2 adapter test was rerun unchanged and remains green.

## 31. Exact Targeted Validation

Final targeted command:

```bash
npm test -- --runInBand src/config/__tests__/unifiedMovementCheckUpRelease.test.ts src/checkup/__tests__/publicCheckUpEngine.test.ts src/results/__tests__/movementProfileV2ResultsAdapter.test.ts
```

Result:

```text
Test Suites: 3 passed, 3 total
Tests: 14 passed, 14 total
```

Existing Watchman recrawl warning appeared.

## 32. Exact Full Validation

Final full Jest:

```bash
npm test -- --runInBand
```

Result:

```text
Test Suites: 138 passed, 138 total
Tests: 1129 passed, 1129 total
Snapshots: 0 total
```

Existing warnings/notices:

- Watchman recrawl warning.
- Expected backend sync test logs/warnings.
- Jest open-handle notice.

## 33. Audio Verification

```bash
npm run verify:audio
```

Result:

```text
AUDIO VERIFICATION PASS safety: requiredCues=44 voices=clara,marcus requiredAssets=88 totalBytes=4637324 durationRange=1.858-5.155s movementProfileV2: requiredCues=31 voices=clara,marcus requiredAssets=62 totalBytes=3057566 durationRange=0.743-6.037s total: requiredAssets=150
```

No audio was regenerated.

## 34. App / Website Typechecks

```bash
npm run typecheck
npm --prefix website run typecheck
```

Both passed.

## 35. Expo Config / Export

```bash
npx --no-install expo config --type public
```

Passed. Existing Sentry warning remained. The command printed env variable names only; no secret values were inspected or reported. The new release flag defaults off and was not enabled by local config.

```bash
rm -rf /tmp/pearl-unified-h3-export
npx --no-install expo export --platform all --output-dir /tmp/pearl-unified-h3-export
rc=$?
rm -rf /tmp/pearl-unified-h3-export
exit $rc
```

Passed:

- iOS bundle built.
- Android bundle built.
- Assets: 444.
- Existing Sentry warning.
- Existing `NO_COLOR` / `FORCE_COLOR` warning.
- Temp export directory removed.

`git diff --check` passed.

## 36. H0 / H1 / H2 / Stage 3D-B / Stage 4 / Stage 5 Regression

Regression coverage remained green through:

- H0 health gate constraints via current full suite.
- H1 shared Check-Up shell tests.
- H2 shared results shell and V2 Movement Profile adapter tests.
- Stage 3D-B V2 artifact/reference/persistence tests.
- Stage 4 measurement protocol/copy/history tests present in current suite.
- Stage 5G.1 and Stage 5H lifecycle integration tests.
- navigation, TypeScript boundaries, safety audio, and Movement Profile V2 audio tests.

## 37. Remaining Unified Lifecycle Work

Deferred to H4/H5:

- official V2 retest;
- compatible previous/current V2 comparison;
- V2 block report;
- automatic next V2 block;
- public Progress migration;
- Warden chair transform.

## 38. H4 Unblock Decision

H4 is unblocked for implementation planning because H3 now contains:

- fail-closed release flag;
- public baseline/baseline-retake selector;
- flag-off V1 rollback route;
- flag-on public unified baseline route;
- raw-first V2 persistence;
- public reference details;
- frozen V2 artifact and automatic block reuse;
- H2 results routing;
- navigation-only plan CTA;
- official V2 retest containment.

Physical release remains blocked until device validation.

## 39. Initial / Final Git Status

Initial status: dirty before H3, with extensive user-owned tracked and untracked work. H3 did not revert, delete, stage, commit, branch, push, or overwrite unrelated work.

Final status remains dirty because both existing user-owned work and H3 files are present. H3-authored new files are:

- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H3_BASELINE_ONBOARDING_CUTOVER.md`
- `src/checkup/publicCheckUpEngine.ts`
- `src/checkup/__tests__/publicCheckUpEngine.test.ts`
- `src/config/unifiedMovementCheckUpRelease.ts`
- `src/config/__tests__/unifiedMovementCheckUpRelease.test.ts`

## 40. Complete Files-Changed Inventory

Final tracked modified/deleted files from `git diff --name-only` include:

```text
.env.example
App.tsx
docs/decisions.md
modules/expo-pose-detection/android/src/main/java/expo/modules/posedetection/ExpoPoseDetectionModule.kt
modules/expo-pose-detection/android/src/main/java/expo/modules/posedetection/PoseDetectionView.kt
modules/expo-pose-detection/ios/ExpoPoseDetectionModule.swift
modules/expo-pose-detection/ios/PoseDetectionView.swift
modules/expo-pose-detection/src/ExpoPoseDetection.types.ts
modules/expo-pose-detection/src/PoseDetectionView.tsx
src/adherence/types.ts
src/checkup/__tests__/checkupFlow.integration.test.ts
src/checkup/index.ts
src/checkup/movementProfileV2.ts
src/checkup/protocolSetup.ts
src/checkup/types.ts
src/config/__tests__/movementProfileV2Internal.test.ts
src/diagnostics/__tests__/poseLatencyDiagnostics.test.ts
src/diagnostics/poseLatencyDiagnostics.ts
src/diagnostics/poseRendererReplay.ts
src/pearlFlow/__tests__/copyGuardrails.test.ts
src/pearlFlow/__tests__/progressViewModel.test.ts
src/pearlFlow/progressViewModel.ts
src/pearlFlow/reports.ts
src/history/__tests__/history.test.ts
src/history/serialize.ts
src/history/trends.ts
src/movementProfileV2/__tests__/internalCheckupFlow.test.ts
src/movementProfileV2/internalCheckupFlow.ts
src/movementProfileV2/viewModel.ts
src/movements/__tests__/movementProfileV2Protocols.test.ts
src/movements/index.ts
src/reference/movementProfileV2/__tests__/referenceEngine.test.ts
src/reference/movementProfileV2/engine.ts
src/reference/movementProfileV2/snapshot.ts
src/reference/movementProfileV2/types.ts
src/render/MatteGraphiteDigitalTwinRenderer.tsx
src/render/PoseAvatarRenderer.tsx
src/render/__tests__/matteGraphiteDigitalTwinGeometry.test.ts
src/render/__tests__/poseAvatarConfig.test.ts
src/render/matteGraphiteDigitalTwinConfig.ts
src/render/matteGraphiteDigitalTwinGeometry.ts
src/render/poseAvatarTypes.ts
src/screens/CheckUpScreen.tsx
src/screens/MicroCheckScreen.tsx
src/screens/MovementProfileV2CheckUpScreen.tsx
src/screens/MovementProfileV2ReferenceDetailsScreen.tsx
src/screens/OnboardingResultsScreen.tsx
src/screens/PoseOverlayBenchmarkScreen.tsx
src/screens/ProgressScreen.tsx
src/screens/ResultsScreen.tsx
src/screens/SettingsScreen.tsx
src/screens/TrainingSessionScreen.tsx
src/services/backend/__tests__/checkupSyncService.test.ts
src/services/backend/__tests__/microCheckSyncService.test.ts
src/services/backend/__tests__/restoreService.test.ts
src/services/backend/checkupSyncService.ts
src/services/backend/microCheckSyncService.ts
src/services/backend/restoreService.ts
src/training/__tests__/microCheck.test.ts
src/training/index.ts
src/training/microCheck.ts
src/training/serialize.ts
website/next-env.d.ts
```

Important H3 new untracked files are listed in section 39. Other untracked files were already present from concurrent work and are not H3-owned unless listed in section 29.

## 41. Concurrent External Changes

Concurrent changes observed and preserved:

- `docs/decisions.md` modified before H3 and not edited.
- Native pose/camera files modified/untracked before H3 and not edited.
- Measurement metadata, eyes-open balance, training voice, render, backend, and Progress work present before H3 and not reverted.
- Existing `.env.example`, `App.tsx`, and V2 screen files already had user-owned deltas; H3 integrated narrowly.

## 42. No Mutation Confirmation

Confirmed:

- No package install.
- No dependency changes.
- No lockfile changes.
- No audio regeneration.
- No font modifications.
- No `.env` value inspection or secret reporting.
- No staging.
- No commit.
- No branch creation.
- No push.
- No pull request.

## Manual Software Trace

Flag off:

```text
normal onboarding -> camera setup -> selector -> legacy_v1 -> CheckUpScreen -> V1 results -> existing V1 plan path
```

Flag on onboarding:

```text
normal onboarding -> camera setup -> selector -> MovementProfileV2UnifiedCheckUpScreen -> raw V2 saved -> public reference details -> frozen snapshot + assessment -> automatic V2 block -> H2 onboarding Movement Profile -> View my 4-week plan -> matching block-intro
```

Flag on standard baseline:

```text
standard baseline/baseline_retake -> selector -> unified V2 Check-Up -> H2 standard Movement Profile
```

Rollback:

```text
completed V2 block + later flag-off build -> training remains usable -> no V1 conversion
```

Official retest:

```text
V2-origin block retest_due -> typed unavailable -> no V1 retest/report/next block
```

Internal comparison:

```text
internal flag on -> standalone V2 harnesses and internal unified H1/H2 paths remain available
```

## Stage Decisions

UNIFIED MOVEMENT CHECK-UP STAGE H3 COMPLETE

FAIL-CLOSED UNIFIED RELEASE FLAG IMPLEMENTED

PUBLIC BASELINE / ONBOARDING V2 CUTOVER IMPLEMENTED

UNIFIED ONBOARDING ARTIFACT AND PLAN FLOW VERIFIED

ROLLBACK / KILL-SWITCH BEHAVIOR VERIFIED

UNIFIED MOVEMENT CHECK-UP STAGE H4 UNBLOCKED

UNIFIED RELEASE FLAG DEFAULTS OFF

FLAG OFF PRESERVES V1 PUBLIC BASELINE

FLAG ON ROUTES PUBLIC BASELINE TO THE UNIFIED V2 ENGINE

PLAN CREATION REMAINS AUTOMATIC

V2 PLAN CTA IS NAVIGATION-ONLY

NO BUILD MY PLAN ACTION

NO V1 LEGACY-RESULT MIGRATION REQUIRED

PUBLIC PROGRESS MIGRATION NOT PERFORMED

OFFICIAL V2 RETEST NOT IMPLEMENTED

V2 REPORT / NEXT-BLOCK FLOW NOT IMPLEMENTED

INTERNAL H1/H2/V2 REFERENCE HARNESSES RETAINED

WARDEN TRANSFORM DEFERRED

CHAIR REFERENCE CLAIM REMAINS RAW-ONLY

STAGE 4 REMEDIATION COMPLETE

STAGE 5 REMEDIATION COMPLETE

PHYSICAL DEVICE VALIDATION NOT CLAIMED

PUBLIC RELEASE REMAINS BLOCKED

## Next Stage

H4 remains:

```text
PEARL UNIFIED MOVEMENT CHECK-UP - STAGE H4
PUBLIC V2 OFFICIAL RETEST, CLAIM-NEUTRAL PREVIOUS/CURRENT COMPARISON,
V2 BLOCK REPORT, AND AUTOMATIC NEXT BLOCK
```
