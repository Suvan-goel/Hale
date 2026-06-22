# Hale Logic Remediation Stage 4G-R

Date: 2026-06-22

Status: passed.

This remediation covers:

- F4R-009: mobility collection selection, rotation, persistence, and non-linear presentation.
- F4R-010: truthful controlled-beta equipment positioning across app and website copy.

No exercise IDs/counts were changed. No optional visibility, progression thresholds, safety cues, audio assets, readiness/discomfort policy, schedule credit rules, scoring/norms, native code, dependency pins, lockfiles, or bundled assets were changed for this stage. No package install, staging, commit, branch, push, audio regeneration, provider call, or prior audit report edit was performed.

## Initial Git State

Captured before Stage 4G-R edits with `git status --short --untracked-files=all`:

```text
 M App.tsx
 M modules/expo-pose-detection/android/src/main/java/expo/modules/posedetection/ExpoPoseDetectionModule.kt
 M modules/expo-pose-detection/android/src/main/java/expo/modules/posedetection/PoseDetectionView.kt
 M modules/expo-pose-detection/ios/ExpoPoseDetectionModule.swift
 M modules/expo-pose-detection/ios/PoseDetectionView.swift
 M modules/expo-pose-detection/src/ExpoPoseDetection.types.ts
 M modules/expo-pose-detection/src/PoseDetectionView.tsx
 M package.json
 M src/exercises/__tests__/catalog.test.ts
 M src/exercises/index.ts
 M src/exercises/ladders.ts
 M src/haleFlow/__tests__/exploreViewModel.test.ts
 M src/haleFlow/__tests__/progressionEvidence.test.ts
 M src/haleFlow/__tests__/sessionPlanning.test.ts
 M src/haleFlow/exploreViewModel.ts
 M src/haleFlow/progressionEvidence.ts
 M src/haleFlow/sessionPlanning.ts
 M src/haleFlow/types.ts
 M src/render/ClassicPoseRenderer.tsx
 M src/render/ConstellationPoseRenderer.tsx
 M src/render/PointCloudBodyPoseRenderer.tsx
 M src/render/poseAvatarTypes.ts
 M src/screens/CheckUpScreen.tsx
 M src/screens/LiveSessionScreen.tsx
 M src/screens/MicroCheckScreen.tsx
 M src/screens/TrainingSessionScreen.tsx
 M src/services/backend/__tests__/restoreService.test.ts
 M src/services/backend/trainingStateSyncService.ts
 M src/training/__tests__/workoutGeneration.test.ts
 M src/training/dailyTrainingContext.ts
 M src/training/dynamicState.ts
 M src/training/serialize.ts
 M src/training/workoutGeneration.ts
 M website/app/layout.tsx
 M website/app/page.tsx
 M website/src/components/ConsentBanner.tsx
 M website/src/components/LandingPage.tsx
 M website/src/components/SiteFooter.tsx
 M website/src/config/site.ts
 M website/src/content/landing.ts
 M website/tests/e2e/landing.spec.ts
?? docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4F_R_1.md
?? docs/audits/HALE_POSE_OVERLAY_LATENCY_AUDIT.md
?? docs/audits/HALE_POSE_OVERLAY_PHYSICAL_DEVICE_BENCHMARK_PROMPT.txt
?? docs/audits/Hale_Stage_4F_R_1_Progression_Model_Enforcement_Prompt.md
?? docs/audits/Hale_Stage_4G_R_Mobility_Rotation_Equipment_Positioning_Prompt.md
?? scripts/pose-renderer-replay.ts
?? src/diagnostics/PoseLatencyDiagnosticsOverlay.tsx
?? src/diagnostics/__tests__/poseLatencyDiagnostics.test.ts
?? src/diagnostics/poseLatencyDiagnostics.ts
?? src/diagnostics/poseRendererReplay.ts
?? src/exercises/__tests__/progressionPolicy.test.ts
?? src/exercises/progressionPolicy.ts
?? src/render/__tests__/latestFrameRafScheduler.test.ts
?? src/render/latestFrameRafScheduler.ts
```

Captured before Stage 4G-R edits with `git diff --name-only`:

```text
App.tsx
modules/expo-pose-detection/android/src/main/java/expo/modules/posedetection/ExpoPoseDetectionModule.kt
modules/expo-pose-detection/android/src/main/java/expo/modules/posedetection/PoseDetectionView.kt
modules/expo-pose-detection/ios/ExpoPoseDetectionModule.swift
modules/expo-pose-detection/ios/PoseDetectionView.swift
modules/expo-pose-detection/src/ExpoPoseDetection.types.ts
modules/expo-pose-detection/src/PoseDetectionView.tsx
package.json
src/exercises/__tests__/catalog.test.ts
src/exercises/index.ts
src/exercises/ladders.ts
src/haleFlow/__tests__/exploreViewModel.test.ts
src/haleFlow/__tests__/progressionEvidence.test.ts
src/haleFlow/__tests__/sessionPlanning.test.ts
src/haleFlow/exploreViewModel.ts
src/haleFlow/progressionEvidence.ts
src/haleFlow/sessionPlanning.ts
src/haleFlow/types.ts
src/render/ClassicPoseRenderer.tsx
src/render/ConstellationPoseRenderer.tsx
src/render/PointCloudBodyPoseRenderer.tsx
src/render/poseAvatarTypes.ts
src/screens/CheckUpScreen.tsx
src/screens/LiveSessionScreen.tsx
src/screens/MicroCheckScreen.tsx
src/screens/TrainingSessionScreen.tsx
src/services/backend/__tests__/restoreService.test.ts
src/services/backend/trainingStateSyncService.ts
src/training/__tests__/workoutGeneration.test.ts
src/training/dailyTrainingContext.ts
src/training/dynamicState.ts
src/training/serialize.ts
src/training/workoutGeneration.ts
website/app/layout.tsx
website/app/page.tsx
website/src/components/ConsentBanner.tsx
website/src/components/LandingPage.tsx
website/src/components/SiteFooter.tsx
website/src/config/site.ts
website/src/content/landing.ts
website/tests/e2e/landing.spec.ts
```

Captured before Stage 4G-R edits with `git diff --stat`:

```text
 App.tsx                                            |  20 +
 .../posedetection/ExpoPoseDetectionModule.kt       |   3 +
 .../modules/posedetection/PoseDetectionView.kt     |  78 ++-
 .../ios/ExpoPoseDetectionModule.swift              |   3 +
 .../ios/PoseDetectionView.swift                    |  57 +-
 .../src/ExpoPoseDetection.types.ts                 |  21 +
 .../expo-pose-detection/src/PoseDetectionView.tsx  |   1 +
 package.json                                       |   3 +-
 src/exercises/__tests__/catalog.test.ts            |  13 +-
 src/exercises/index.ts                             |  35 +-
 src/exercises/ladders.ts                           |   6 +-
 src/haleFlow/__tests__/exploreViewModel.test.ts    |  52 +-
 src/haleFlow/__tests__/progressionEvidence.test.ts |  71 ++-
 src/haleFlow/__tests__/sessionPlanning.test.ts     | 123 ++--
 src/haleFlow/exploreViewModel.ts                   |  37 +-
 src/haleFlow/progressionEvidence.ts                | 106 +++-
 src/haleFlow/sessionPlanning.ts                    | 220 ++++++-
 src/haleFlow/types.ts                              |   9 +
 src/render/ClassicPoseRenderer.tsx                 |  51 +-
 src/render/ConstellationPoseRenderer.tsx           |  46 +-
 src/render/PointCloudBodyPoseRenderer.tsx          | 638 ++++++++++++---------
 src/render/poseAvatarTypes.ts                      |  17 +
 src/screens/CheckUpScreen.tsx                      |  20 +-
 src/screens/LiveSessionScreen.tsx                  |  19 +-
 src/screens/MicroCheckScreen.tsx                   |  20 +-
 src/screens/TrainingSessionScreen.tsx              |  20 +-
 .../backend/__tests__/restoreService.test.ts       |   6 +-
 src/services/backend/trainingStateSyncService.ts   |   4 +
 src/training/__tests__/workoutGeneration.test.ts   | 140 +++--
 src/training/dailyTrainingContext.ts               |   5 +-
 src/training/dynamicState.ts                       |   9 +
 src/training/serialize.ts                          |  66 +++
 src/training/workoutGeneration.ts                  | 226 +++---
 website/app/layout.tsx                             |  12 +-
 website/app/page.tsx                               |   2 +-
 website/src/components/ConsentBanner.tsx           |   2 +-
 website/src/components/LandingPage.tsx             |  48 +-
 website/src/components/SiteFooter.tsx              |   4 +-
 website/src/config/site.ts                         |   2 +-
 website/src/content/landing.ts                     |  68 +--
 website/tests/e2e/landing.spec.ts                  |   4 +-
 41 files changed, 1763 insertions(+), 524 deletions(-)
```

Note: additional unrelated files appeared in the worktree during the remediation, including auth/benchmark surfaces and a benchmark audit. They were treated as user-owned parallel work and were not reverted.

## Remediation Summary

### F4R-009: Mobility Collection and Presentation

Status: fixed.

Implemented a dedicated mobility collection selector in `src/training/collectionSelection.ts`:

- The controlled-beta collection is exactly the four V1 mobility members:
  `seated-hamstring-reach`, `thoracic-rotation`, `supported-hip-flexor-stretch`, and `wall-calf-stretch`.
- Hidden neck rotation is excluded from the collection selection surface.
- Eligibility respects release status, equipment, movement capabilities, discomfort constraints, and same-session duplicate avoidance.
- Selection prefers never-practised eligible members in canonical order, then least-recently practised members.
- If setup constraints leave only one eligible member, duplicates are explicit and labelled with `only_eligible_member` instead of pretending rotation is possible.
- Exposure history only counts authoritative current-block generated completions with current block id, block-generated source/completion source, starter/standard/restart session type, non-skipped status, valid planned/completed timestamps, valid work evidence, no duplicate/malformed/unmatched result counts, and primary/supporting non-fallback collection members.

Integrated selection into generated sessions:

- `generateTodaySession` now passes current-block collection exposure history into block-generated planning.
- Mobility collection slots select an exercise member without mutating the stored ladder level.
- `GeneratedExercise` and persisted session summaries now preserve `collectionSelection`.
- Duplicate generated exercise validation remains strict, with a narrow exception only for valid mobility collection duplicates whose reason is `only_eligible_member`.
- Serialization/restore validates and preserves collection-selection metadata.

Updated non-linear presentation:

- Added `src/exercises/ladderPresentation.ts` to distinguish linear ladders, supporting sets, and collections.
- Explore and detail screens no longer present supporting sets or mobility collections as ranked "current/easier/harder" ladders.
- Mobility detail/card copy presents coverage/variety language such as "N of M mobility areas practised this block" instead of false level progress.
- Progress surfaces label non-linear groups as recently included or available in plan, not as current ranked levels.

### F4R-010: Equipment Positioning

Status: fixed.

Added `src/haleFlow/equipmentPositioning.ts` as the canonical controlled-beta equipment positioning source:

- Start with a sturdy chair and a wall or counter for support.
- No specialist gym equipment is needed to begin.
- A long resistance band is recommended for fuller upper-body training and required for pulling exercises.
- Floor space, a low stable step, and a door anchor are only used when confirmed.
- Hale plans around what the user has, but some movements may be unavailable without household support or a resistance band.

Applied this positioning across app and website surfaces:

- Onboarding equipment, settings, session preview, Today adjustment copy, Explore extra-session copy, and website landing/FAQ/training copy now avoid "zero equipment" or "no equipment needed" product positioning.
- Internal IDs such as `preset-no-equipment-strength` were not renamed because that would be a broader persisted identity change.
- Copy guardrails now test for misleading equipment claims and non-linear ladder wording.

## Files Authored or Touched for Stage 4G-R

New stage files:

- `src/training/collectionSelection.ts`
- `src/training/__tests__/collectionSelection.test.ts`
- `src/exercises/ladderPresentation.ts`
- `src/haleFlow/equipmentPositioning.ts`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4G_R.md`

Stage edits in existing files:

- `src/training/workoutGeneration.ts`
- `src/training/dynamicState.ts`
- `src/training/serialize.ts`
- `src/training/index.ts`
- `src/training/debugWorkoutScenarios.ts`
- `src/training/__tests__/workoutGeneration.test.ts`
- `src/training/__tests__/store.test.ts`
- `src/haleFlow/sessionPlanning.ts`
- `src/haleFlow/types.ts`
- `src/haleFlow/exploreViewModel.ts`
- `src/haleFlow/progressViewModel.ts`
- `src/haleFlow/index.ts`
- `src/haleFlow/__tests__/copyGuardrails.test.ts`
- `src/haleFlow/__tests__/exploreViewModel.test.ts`
- `src/screens/ExploreScreen.tsx`
- `src/screens/ExploreDetailScreens.tsx`
- `src/screens/ProgressScreen.tsx`
- `src/screens/OnboardingEquipmentScreen.tsx`
- `src/screens/SettingsScreen.tsx`
- `src/screens/SessionPreviewScreen.tsx`
- `src/screens/TodayScreen.tsx`
- `App.tsx`
- `src/exercises/index.ts`
- `src/exercises/ladders.ts`
- `src/exercises/overheadPress.ts`
- `src/exercises/neckRotation.ts`
- `website/src/content/landing.ts`
- `website/tests/unit/components.test.tsx`

Some of these files had pre-existing changes from earlier stages; only the Stage 4G-R areas above were intentionally modified.

## Validation

Targeted validation:

```text
npm test -- --runInBand src/training/__tests__/collectionSelection.test.ts src/training/__tests__/workoutGeneration.test.ts src/training/__tests__/store.test.ts src/haleFlow/__tests__/exploreViewModel.test.ts src/haleFlow/__tests__/copyGuardrails.test.ts src/haleFlow/__tests__/sessionPlanning.test.ts src/exercises/__tests__/progressionPolicy.test.ts src/exercises/__tests__/catalog.test.ts src/services/backend/__tests__/restoreService.test.ts src/services/backend/__tests__/trainingStateSyncService.test.ts src/haleFlow/__tests__/stage5hLifecycle.integration.test.ts
PASS: 11 suites, 197 tests.
Note: Jest printed the existing watchman recrawl warning and the usual open-handle notice.
```

Website targeted validation:

```text
npm --prefix website run test -- components.test.tsx
PASS: 1 file, 6 tests.
```

Required validation:

```text
npm run verify:audio
PASS: AUDIO VERIFICATION PASS requiredCues=44 voices=clara,marcus requiredAssets=88 totalBytes=4637324 durationRange=1.858-5.155s
```

```text
npm test -- --runInBand
PASS: 105 suites, 861 tests.
Note: Jest printed the existing watchman recrawl warning, expected backend-sync console output/warnings from tests, and the usual open-handle notice.
```

```text
npm run typecheck
PASS
```

```text
npm --prefix website run typecheck
PASS
```

```text
npx --no-install expo config --type public
PASS
Note: Expo config printed the existing Sentry organization/project warning and env variable names while loading config; no secret values were inspected or displayed.
```

```text
git diff --check
PASS
```

```text
rm -rf /tmp/hale-stage4gr-export
npx --no-install expo export --platform all --output-dir /tmp/hale-stage4gr-export
rc=$?
rm -rf /tmp/hale-stage4gr-export
exit $rc
PASS
Note: export printed the existing Sentry config warning and repeated NO_COLOR/FORCE_COLOR Node warnings. Android and iOS bundles exported successfully, and /tmp/hale-stage4gr-export was removed.
```

## Scope Guardrails Checked

- Exercise IDs/counts: unchanged.
- Hidden optional movement visibility: unchanged except explicitly excluding hidden neck rotation from the mobility collection selection surface.
- Progression policies and thresholds: unchanged for this stage; collection presentation avoids ranked progression semantics.
- Safety cues/audio: unchanged; `verify:audio` passed.
- Readiness/discomfort policy: unchanged; collection eligibility uses existing discomfort constraints.
- Credit/schedule rules: unchanged; exposure counting reads only authoritative generated-completion history and does not alter credit.
- Scoring/norms/Check-Up/native code/dependencies/lockfiles/assets: unchanged by this stage.
- Prior reports: not edited.
- New reports authored by this stage: exactly this file.

## Residual Notes

- `package.json` was already dirty before this task with the `pose-renderer-replay` script. No dependency or lockfile change was made by this remediation.
- Current git status includes unrelated parallel auth/benchmark and pose-renderer files that were not part of Stage 4G-R and were not reverted.
- Internal identifiers containing `no-equipment` remain as stable IDs only; user-facing app/website copy now uses household setup language.
