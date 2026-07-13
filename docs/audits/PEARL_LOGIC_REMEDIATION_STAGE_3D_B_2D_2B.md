# Pearl Logic Remediation Stage 3D-B.2D.2B

Date: 2026-06-24

Stage: Internal Movement Profile V2 Check-Up flow, per-check-up reference details, frozen artifact materialization, Movement Profile UI, and Progress integration.

## Summary

Implemented a gated internal Movement Profile V2 path while keeping V1 as the public/default Check-Up:

- Added strict compile-time gate `EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_INTERNAL=1`.
- Added an internal Settings developer entry when the gate is enabled.
- Added a dedicated V2 Check-Up screen that uses the V2 protocol controllers/helpers and does not route through the legacy generic `SessionController`.
- Added a pure internal V2 flow reducer for source type, battery order, duplicate-result protection, raw Check-Up construction, prior leg/shoulder selection, and pending raw resume.
- Persisted complete raw V2 Check-Ups before reference details.
- Added per-Check-Up reference-details draft helpers and screen, including explicit skip, exact-age handling, no profile/reference-sex mutation, and prior frozen V2 snapshot prefill only for baseline retakes.
- Materialized frozen V2 snapshot + assessment through `materializeOfficialMovementProfileV2Artifacts`.
- Saved/synced frozen artifacts through the existing history/backend surfaces without creating V1 scores, MovementBlocks, or reports.
- Added a pure frozen-artifact V2 Movement Profile view model.
- Added V2 results + reusable domain-detail UI.
- Added a latest Movement Profile card to Progress when a valid V2 artifact exists, without trend/improvement/decline comparison.

## Containment

Kept out of scope:

- No V2 MovementBlock creation.
- No V2 report.
- No V2 public onboarding replacement.
- No V2 official retest UI route.
- No Warden chair transform.
- No profile schema field for reference sex.
- No backend schema change.
- No dependency or lockfile changes.
- No staged files, commits, branches, or pushes.

## Files Added

- `src/config/movementProfileV2Internal.ts`
- `src/config/__tests__/movementProfileV2Internal.test.ts`
- `src/movementProfileV2/internalCheckupFlow.ts`
- `src/movementProfileV2/referenceDetailsDraft.ts`
- `src/movementProfileV2/viewModel.ts`
- `src/movementProfileV2/__tests__/internalCheckupFlow.test.ts`
- `src/movementProfileV2/__tests__/referenceDetailsDraft.test.ts`
- `src/movementProfileV2/__tests__/viewModel.test.ts`
- `src/screens/MovementProfileV2CheckUpScreen.tsx`
- `src/screens/MovementProfileV2ReferenceDetailsScreen.tsx`
- `src/screens/MovementProfileV2ResultsScreen.tsx`

## Files Touched For Integration

- `.env.example`
- `App.tsx`
- `src/screens/SettingsScreen.tsx`
- `src/screens/ProgressScreen.tsx`

The working tree already contained many user-owned changes before this stage. I preserved them and did not revert unrelated edits.

## Initial Worktree Safety

### `git status --short --untracked-files=all`

```text
 M App.tsx
 M src/adherence/__tests__/adherence.test.ts
 M src/adherence/components/LifeGoalSelector.tsx
 M src/adherence/goalDomainMapping.ts
 M src/adherence/screens/LifeGoalOnboardingScreen.tsx
 M src/adherence/screens/RestartSessionScreen.tsx
 M src/checkup/types.ts
 M src/components/AccountAuthCard.tsx
 M src/components/SafePoseDetectionView.tsx
 M src/components/ui.tsx
 M src/pearlFlow/__tests__/checkupHistory.test.ts
 M src/pearlFlow/checkupHistory.ts
 M src/history/__tests__/history.test.ts
 M src/history/serialize.ts
 M src/navigation/TabBar.tsx
 M src/onboarding/__tests__/onboarding.test.ts
 M src/reference/movementProfileV2/assessment.ts
 M src/reference/movementProfileV2/index.ts
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
?? docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2D_1.md
?? docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2D_2A.md
?? docs/audits/PEARL_VOICE_ASSET_DURATIONS.csv
?? docs/audits/PEARL_VOICE_EXPERIENCE_SPEC_CODEX_PROMPT.md
?? docs/audits/PEARL_VOICE_RUNTIME_TIMELINE_AUDIT.json
?? docs/audits/PEARL_VOICE_RUNTIME_TIMELINE_AUDIT.md
?? docs/audits/PEARL_VOICE_RUNTIME_TIMELINE_AUDIT_CODEX_PROMPT.md
?? docs/audits/Pearl_Stage_3D_B_2D_2A_V2_Assessment_Persistence_Orchestration_Prompt.md
?? docs/audits/Pearl_Stage_3D_B_2D_2B_Internal_V2_CheckUp_Movement_Profile_UI_Prompt.md
?? scripts/audits/generate-voice-runtime-audit.ts
?? src/reference/movementProfileV2/__tests__/assessment.test.ts
?? src/reference/movementProfileV2/__tests__/persistence.test.ts
?? src/reference/movementProfileV2/persistence.ts
```

### `git diff --name-only`

```text
App.tsx
src/adherence/__tests__/adherence.test.ts
src/adherence/components/LifeGoalSelector.tsx
src/adherence/goalDomainMapping.ts
src/adherence/screens/LifeGoalOnboardingScreen.tsx
src/adherence/screens/RestartSessionScreen.tsx
src/checkup/types.ts
src/components/AccountAuthCard.tsx
src/components/SafePoseDetectionView.tsx
src/components/ui.tsx
src/pearlFlow/__tests__/checkupHistory.test.ts
src/pearlFlow/checkupHistory.ts
src/history/__tests__/history.test.ts
src/history/serialize.ts
src/navigation/TabBar.tsx
src/onboarding/__tests__/onboarding.test.ts
src/reference/movementProfileV2/assessment.ts
src/reference/movementProfileV2/index.ts
src/screens/CameraExplanationScreen.tsx
src/screens/CameraSetupScreen.tsx
src/screens/CheckUpScreen.tsx
src/screens/ExploreDetailScreens.tsx
src/screens/ExploreScreen.tsx
src/screens/ManualCheckupStartScreen.tsx
src/screens/MicroCheckScreen.tsx
src/screens/OnboardingEquipmentScreen.tsx
src/screens/OnboardingResultsScreen.tsx
src/screens/PlanScreen.tsx
src/screens/ProgressScreen.tsx
src/screens/ResultsScreen.tsx
src/screens/SafetyProfileScreen.tsx
src/screens/SessionPlanningRecoveryScreen.tsx
src/screens/SettingsScreen.tsx
src/screens/TodayScreen.tsx
src/screens/TrainingSessionScreen.tsx
src/screens/WelcomeScreen.tsx
src/services/backend/__tests__/checkupSyncService.test.ts
src/services/backend/__tests__/dataExportService.test.ts
src/services/backend/__tests__/restoreService.test.ts
src/services/backend/checkupSyncService.ts
src/services/backend/restoreService.ts
src/theme/responsive.ts
```

### `git diff --stat`

```text
42 files changed, 1083 insertions(+), 261 deletions(-)
```

## Baseline Validation Before Edits

- Broad targeted baseline: 23 suites passed, 262 tests passed.
- `npm run verify:audio`: passed, `requiredCues=44`, `voices=clara,marcus`, `requiredAssets=88`, `totalBytes=4637324`, `durationRange=1.858-5.155s`.
- `npm test -- --runInBand`: 113 suites passed, 977 tests passed.
- `npm run typecheck`: passed.
- `npm --prefix website run typecheck`: passed.
- `npx --no-install expo config --type public`: passed with existing Sentry missing org/project warning and env variable names only.
- `git diff --check`: passed.
- `npx --no-install expo export --platform all --output-dir /tmp/pearl-stage3db2d2b-export`: passed, Android/iOS bundles exported, 380 assets, temp export directory removed.

Warnings observed before edits: Watchman recrawl warning, Jest open-handle notice, existing backend-sync test console logs/warnings, existing Sentry config warning, and Expo export `NO_COLOR`/`FORCE_COLOR` warnings.

## Final Validation

### Targeted slice

Command:

```bash
npm test -- --runInBand src/checkup/__tests__/protocolPolicy.test.ts src/movements/__tests__/movementProfileV2Protocols.test.ts src/reference/movementProfileV2/__tests__/referenceEngine.test.ts src/reference/movementProfileV2/__tests__/snapshot.test.ts src/reference/movementProfileV2/__tests__/assessment.test.ts src/reference/movementProfileV2/__tests__/persistence.test.ts src/history/__tests__/history.test.ts src/pearlFlow/__tests__/checkupHistory.test.ts src/services/backend/__tests__/checkupSyncService.test.ts src/services/backend/__tests__/restoreService.test.ts src/services/backend/__tests__/dataExportService.test.ts src/services/backend/__tests__/accountDataService.test.ts src/checkup/__tests__/checkup.test.ts src/checkup/__tests__/checkupFlow.integration.test.ts src/screens/__tests__/recordingViewport.test.ts src/pearlFlow/__tests__/progressViewModel.test.ts src/pearlFlow/__tests__/assessmentResultState.test.ts src/pearlFlow/__tests__/stage5hLifecycle.integration.test.ts src/adherence/__tests__/adherence.test.ts src/adherence/__tests__/blockServiceEligibility.test.ts src/exercises/__tests__/progressionPolicy.test.ts src/training/__tests__/collectionSelection.test.ts src/training/__tests__/workoutGeneration.test.ts src/config/__tests__/movementProfileV2Internal.test.ts src/movementProfileV2/__tests__/internalCheckupFlow.test.ts src/movementProfileV2/__tests__/viewModel.test.ts src/movementProfileV2/__tests__/referenceDetailsDraft.test.ts
```

Result: 27 suites passed, 272 tests passed.

### Audio

Command:

```bash
npm run verify:audio
```

Result: passed, `requiredCues=44`, `voices=clara,marcus`, `requiredAssets=88`, `totalBytes=4637324`, `durationRange=1.858-5.155s`.

### Full Jest

Command:

```bash
npm test -- --runInBand
```

Result: 117 suites passed, 986 tests passed.

### Typechecks and Expo

- `npm run typecheck`: passed.
- `npm --prefix website run typecheck`: passed.
- `npx --no-install expo config --type public`: passed with existing Sentry missing org/project warning and env variable names only.
- `git diff --check`: passed.

### Export

Command:

```bash
rm -rf /tmp/pearl-stage3db2d2b-export
npx --no-install expo export --platform all --output-dir /tmp/pearl-stage3db2d2b-export
rc=$?
rm -rf /tmp/pearl-stage3db2d2b-export
exit $rc
```

Result: passed, iOS and Android bundles exported, 380 assets, temp export directory removed.

Warnings observed in final validation: Watchman recrawl warning, Jest open-handle notice, existing backend-sync test console logs/warnings, existing Sentry config warning, and Expo export `NO_COLOR`/`FORCE_COLOR` warnings.

## Notes And Deferred Work

- The internal V2 screen is dedicated and does not use the generic legacy `SessionController`, but the current implementation still uses button-driven captured controller outputs for the internal path. The full live pose/timer/rest/retry integration matrix for chair, balance, shoulder, and hinge remains Stage 3D-B.2E/physical-device hardening work.
- No new voice assets were generated. The screen reuses existing bundled cues only where the meaning is accurate and keeps visible text present. Full 45-second balance/rest voice parity remains a later hardening item if the live timer UI becomes audio-driven.
- The Progress integration intentionally implements only the latest valid V2 Movement Profile card. A multi-profile V2 history list is deferred.
- Raw-complete pending resume is implemented. Snapshot-only/malformed-artifact recovery is still primarily covered by the existing immutable artifact selectors/parsers and should get a fuller internal recovery UI in the next stage.
- No physical-device validation was performed in this task.
