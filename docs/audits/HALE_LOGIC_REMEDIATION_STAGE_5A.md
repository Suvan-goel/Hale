# Hale Logic Remediation Stage 5A

Date: 2026-06-20

Scope: Stage 5A only, covering F5-001 through F5-004 from `docs/audits/HALE_LOGIC_AUDIT_STAGE_5.md` and the Stage 5A prompt. Stage 5B/C/D/E/F/G/H/I/J items remain deferred.

## Starting State

The working tree was already dirty before Stage 5A began. I did not revert or normalize unrelated user changes.

Initial `git status --short --untracked-files=all`:

```text
 M CLAUDE.md
 M assets/android-icon.png
 M assets/icon.png
 M assets/ios-icon.png
 M docs/decisions.md
 M scripts/skeleton-preview.ts
 M src/adherence/screens/RestartSessionScreen.tsx
 M src/adherence/types.ts
 M src/components/ui.tsx
 M src/exercises/__tests__/catalog.test.ts
 M src/exercises/balanceRung.ts
 M src/exercises/heelRaise.ts
 M src/exercises/ladders.ts
 M src/exercises/loadedMarch.ts
 M src/exercises/mobilityDrills.ts
 M src/exercises/pullUpperBack.ts
 M src/exercises/pushUp.ts
 M src/exercises/stepUp.ts
 M src/exercises/supportedSquat.ts
 M src/haleFlow/__tests__/exploreViewModel.test.ts
 M src/haleFlow/__tests__/sessionPlanning.test.ts
 M src/haleFlow/exploreViewModel.ts
 M src/haleFlow/sessionPlanning.ts
 M src/haleFlow/types.ts
 M src/movements/types.ts
 M src/profile/serialize.ts
 M src/screens/ArticleScreen.tsx
 M src/screens/CameraExplanationScreen.tsx
 M src/screens/CameraSetupScreen.tsx
 M src/screens/ExploreDetailScreens.tsx
 M src/screens/ExploreScreen.tsx
 M src/screens/ManualCheckupStartScreen.tsx
 M src/screens/OnboardingEquipmentScreen.tsx
 M src/screens/PlanScreen.tsx
 M src/screens/ProgressScreen.tsx
 M src/screens/ResultsScreen.tsx
 M src/screens/SafetyProfileScreen.tsx
 M src/screens/SessionPreviewScreen.tsx
 M src/screens/SettingsScreen.tsx
 M src/screens/TodayScreen.tsx
 M src/theme/index.ts
 M src/training/__tests__/workoutGeneration.test.ts
 M src/training/debugWorkoutScenarios.ts
 M src/training/dynamicState.ts
 M src/training/index.ts
 M src/training/serialize.ts
 M src/training/workoutGeneration.ts
?? assets/hale-logo-icon-groove-connected.png
?? assets/hale-logo-icon-groove-exact.png
?? assets/hale-logo-icon-groove.png
?? assets/hale-logo-icon.png
?? assets/hale-logo-mark.png
?? assets/images/explore-library-balance.png
?? assets/images/explore-library-heel-toe-raise.png
?? assets/images/explore-library-hero.png
?? assets/images/explore-library-hinge-glutes.png
?? assets/images/explore-library-lateral-stability.png
?? assets/images/explore-library-mobility-flexibility.png
?? assets/images/explore-library-pull-upper-back.png
?? assets/images/explore-library-push.png
?? assets/images/explore-library-shoulder-reach-press.png
?? assets/images/explore-library-sit-to-stand.png
?? assets/images/explore-library-squat.png
?? assets/images/explore-library-step-up.png
?? assets/images/hale-home-hero-botanical.png
?? assets/images/progress-hero-botanical.png
?? docs/audits/HALE_LOGIC_AUDIT_STAGE_5.md
?? docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4A.md
?? docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4B.md
?? docs/audits/Hale_Stage_4A_Catalogue_Safety_Gating_Prompt.md
?? docs/audits/Hale_Stage_4B_Stimulus_Domain_Progression_Prompt.md
?? docs/audits/Hale_Stage_5A_Main_Plan_Rotation_Completion_Integrity_Prompt.md
?? docs/audits/Hale_Stage_5_Dynamic_Workout_Generation_Audit_Prompt.md
?? src/components/BackArrowButton.tsx
?? src/components/HeaderLogo.tsx
?? src/haleFlow/extraSessionCopy.ts
?? src/screens/exploreImages.ts
?? src/training/equipmentSafety.ts
?? tmp/hale-logo-mark-preview.png
?? tmp/logo/component-mask-colored.png
?? tmp/logo/exact-groove-clean-w18.png
?? tmp/logo/exact-groove-clean-w24.png
?? tmp/logo/exact-groove-clean-w30.png
?? tmp/logo/exact-groove-literal-w18.png
?? tmp/logo/exact-groove-literal-w24.png
?? tmp/logo/exact-groove-literal-w30.png
?? tmp/logo/exact-groove-sheet.png
?? tmp/logo/exact-groove-smooth-w18.png
?? tmp/logo/exact-groove-smooth-w24.png
?? tmp/logo/exact-groove-smooth-w30.png
?? tmp/logo/hale-flat-traced-candidate.png
?? tmp/logo/hale-flat-traced-smooth-hires.png
?? tmp/logo/hale-flat-traced-smoothed.png
?? tmp/logo/mask-threshold-sheet.png
?? tmp/logo/reference-shoulder-crop.png
```

Initial `git diff --name-only`:

```text
CLAUDE.md
assets/android-icon.png
assets/icon.png
assets/ios-icon.png
docs/decisions.md
scripts/skeleton-preview.ts
src/adherence/screens/RestartSessionScreen.tsx
src/adherence/types.ts
src/components/ui.tsx
src/exercises/__tests__/catalog.test.ts
src/exercises/balanceRung.ts
src/exercises/heelRaise.ts
src/exercises/ladders.ts
src/exercises/loadedMarch.ts
src/exercises/mobilityDrills.ts
src/exercises/pullUpperBack.ts
src/exercises/pushUp.ts
src/exercises/stepUp.ts
src/exercises/supportedSquat.ts
src/haleFlow/__tests__/exploreViewModel.test.ts
src/haleFlow/__tests__/sessionPlanning.test.ts
src/haleFlow/exploreViewModel.ts
src/haleFlow/sessionPlanning.ts
src/haleFlow/types.ts
src/movements/types.ts
src/profile/serialize.ts
src/screens/ArticleScreen.tsx
src/screens/CameraExplanationScreen.tsx
src/screens/CameraSetupScreen.tsx
src/screens/ExploreDetailScreens.tsx
src/screens/ExploreScreen.tsx
src/screens/ManualCheckupStartScreen.tsx
src/screens/OnboardingEquipmentScreen.tsx
src/screens/PlanScreen.tsx
src/screens/ProgressScreen.tsx
src/screens/ResultsScreen.tsx
src/screens/SafetyProfileScreen.tsx
src/screens/SessionPreviewScreen.tsx
src/screens/SettingsScreen.tsx
src/screens/TodayScreen.tsx
src/theme/index.ts
src/training/__tests__/workoutGeneration.test.ts
src/training/debugWorkoutScenarios.ts
src/training/dynamicState.ts
src/training/index.ts
src/training/serialize.ts
src/training/workoutGeneration.ts
```

Initial `git diff --stat`:

```text
 CLAUDE.md                                        |   4 +-
 assets/android-icon.png                          | Bin 1731012 -> 607917 bytes
 assets/icon.png                                  | Bin 393493 -> 607917 bytes
 assets/ios-icon.png                              | Bin 1752082 -> 607917 bytes
 docs/decisions.md                                |  73 +++
 scripts/skeleton-preview.ts                      |   4 +-
 src/adherence/screens/RestartSessionScreen.tsx   |   5 +-
 src/adherence/types.ts                           |   2 +
 src/components/ui.tsx                            |  14 +-
 src/exercises/__tests__/catalog.test.ts          |  86 +++
 src/exercises/balanceRung.ts                     |   8 +-
 src/exercises/heelRaise.ts                       |   4 +-
 src/exercises/ladders.ts                         |  59 +-
 src/exercises/loadedMarch.ts                     |  10 +-
 src/exercises/mobilityDrills.ts                  |   2 +-
 src/exercises/pullUpperBack.ts                   |   2 +-
 src/exercises/pushUp.ts                          |   2 +-
 src/exercises/stepUp.ts                          |  10 +-
 src/exercises/supportedSquat.ts                  |   4 +-
 src/haleFlow/__tests__/exploreViewModel.test.ts  | 106 ++++
 src/haleFlow/__tests__/sessionPlanning.test.ts   | 176 +++++-
 src/haleFlow/exploreViewModel.ts                 | 396 +++++++++----
 src/haleFlow/sessionPlanning.ts                  |  76 ++-
 src/haleFlow/types.ts                            |  28 +-
 src/movements/types.ts                           |   7 +-
 src/profile/serialize.ts                         |   2 +
 src/screens/ArticleScreen.tsx                    |  26 +-
 src/screens/CameraExplanationScreen.tsx          |   3 +-
 src/screens/CameraSetupScreen.tsx                |   3 +-
 src/screens/ExploreDetailScreens.tsx             | 468 ++++++++++++----
 src/screens/ExploreScreen.tsx                    | 484 +++++++++++-----
 src/screens/ManualCheckupStartScreen.tsx         |   5 +-
 src/screens/OnboardingEquipmentScreen.tsx        |  11 +-
 src/screens/PlanScreen.tsx                       |  39 +-
 src/screens/ProgressScreen.tsx                   | 684 +++++++++++++++--------
 src/screens/ResultsScreen.tsx                    |  14 +-
 src/screens/SafetyProfileScreen.tsx              |   5 +-
 src/screens/SessionPreviewScreen.tsx             |  18 +-
 src/screens/SettingsScreen.tsx                   |  57 +-
 src/screens/TodayScreen.tsx                      |  79 +--
 src/theme/index.ts                               |   6 +
 src/training/__tests__/workoutGeneration.test.ts | 252 ++++++++-
 src/training/debugWorkoutScenarios.ts            |   2 +-
 src/training/dynamicState.ts                     |   5 +
 src/training/index.ts                            |   3 +
 src/training/serialize.ts                        |  28 +
 src/training/workoutGeneration.ts                | 306 +++++++++-
 47 files changed, 2794 insertions(+), 784 deletions(-)
```

## Files Added

- `src/haleFlow/mainPlanEvents.ts`
- `src/haleFlow/sessionWorkEvidence.ts`
- `src/haleFlow/__tests__/mainPlanEvents.test.ts`
- `src/haleFlow/__tests__/sessionWorkEvidence.test.ts`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5A.md`

## Remediation Summary

F5-001: Main-plan classifier and A/B/C rotation

- Added a shared classifier for credited main-plan events.
- Valid credit now requires active block, supported session type, `block_generated` source, explicit `mainPlanCredit`, valid focus-specific A/B/C template, and explicit planned date key.
- Recent-session planning input now flows through this classifier and dedupes repeated template credit within a block week.
- `getTemplateSelection` now requires credited A/B/C template coverage for week completion; duplicate A sessions cannot substitute for B or C.
- Today lifecycle, weekly A/B/C status, micro-check prompting, and Progress weekly count now read credited template coverage rather than raw completion rows.

F5-002: Work-evidence gate for completion credit

- Added `evaluateSessionWorkEvidence`.
- Main-plan credit is awarded only when at least one planned exercise result is explicitly `completed`.
- All-skipped sessions, no result, missing planned result rows, duplicate result rows, malformed rows, and unmatched rows fail closed for that exercise.
- Zero-work attempts can be preserved as generated summaries with `mainPlanCredit: false`, but they do not create adherence completions, milestones, training progress, rotation credit, or syncable session rows.
- Completion screen copy now avoids false celebration when no credit is added.

F5-003: Progression and result mapping

- Dynamic ladder progression now exits without changing progress when work evidence is missing or the post-session completed flag is false.
- Progression result mapping no longer treats absent exercise results as completed.
- Skipped/missing exercises are not sent as failed progression evidence; only explicit completed planned exercises are mapped into ladder progress.

F5-004: Planned date identity and persistence/sync boundaries

- Generated plans now stamp `plannedDateKey` from the explicit planned date passed into planning, not ambient `new Date()`.
- `TrainingSessionCompletion` and generated session summaries now preserve source, template id, planned date key, explicit credit, and compact work-evidence metadata.
- Session sync now accepts only explicitly credited starter/standard/restart completions.
- Training-state sync preserves the new generated-summary credit fields.
- Remote restore keeps legacy completion rows as history but they do not count as credited progress without explicit credit metadata.

## Intentional Non-Changes

- Stage 5B primary-focus minimum stimulus gating is not implemented here.
- Stage 5C through Stage 5J audit findings remain open.
- No package installs, branch changes, staging, commits, or pushes were performed.

## Validation

Required commands run after remediation:

- `npm test -- --runInBand`
  - Result: passed, 86 suites / 621 tests.
  - Notes: Jest still prints the existing watchman recrawl warning and the post-run open-handle warning. Several backend tests intentionally log expected sync failure paths.
- `npm run typecheck`
  - Result: passed.
- `npx --no-install expo config --type public`
  - Result: passed.
  - Note: Expo printed the existing Sentry config warning about missing organization/project and environment fallback.
- `git diff --check`
  - Result: passed.

Additional focused suites run during implementation:

- `src/haleFlow/__tests__/mainPlanEvents.test.ts`
- `src/haleFlow/__tests__/sessionWorkEvidence.test.ts`
- `src/haleFlow/__tests__/sessionPlanning.test.ts`
- `src/training/__tests__/workoutGeneration.test.ts`
- `src/adherence/__tests__/adherence.test.ts`
- `src/services/backend/__tests__/sessionSyncService.test.ts`
- `src/services/backend/__tests__/trainingStateSyncService.test.ts`
- `src/services/backend/__tests__/restoreService.test.ts`
- `src/haleFlow/__tests__/appLifecycle.test.ts`
- `src/haleFlow/__tests__/haleFlow.test.ts`

## Residual Risk

- Main-plan credit now depends on new metadata. Existing legacy local rows without explicit credit will be preserved but ignored for main-plan advancement, by design.
- Stage 5B still needs the stricter primary-focus stimulus requirement; Stage 5A intentionally allows any genuinely completed planned exercise to earn current credit.
- Backend tests still leave Jest with its known open-handle warning after all tests pass.
