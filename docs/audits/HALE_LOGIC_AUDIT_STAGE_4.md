# Hale Logic Audit - Stage 4 Exercise Catalogue

Date: 2026-06-20
Scope: read-only audit of exercise catalogue, ladders, substitutions, training-session assembly, Explore/practice exposure, safety suitability, and Stage 5 catalogue input readiness.

No production code, tests, exercise definitions, scoring logic, workout logic, progression logic, config, dependencies, or assets were intentionally edited for this audit. The only intended repository file created by this stage is this report.

## 1. Executive Verdict

The exercise catalogue has a real, test-covered architecture: 37 registered exercise definitions, 11 product-facing ladders, static import registration, generated sessions, preset sessions, manual ladder practice, and Explore cards all resolve from the same catalogue surface. The catalogue is coherent enough to audit and already avoids the worst failure modes such as dangling exercise IDs or duplicate registry entries.

The catalogue is not yet ready to serve as the stable Stage 5 dynamic-generation substrate without remediation. The largest risks are not syntax or reachability; they are product-trust risks: bandless upper-body pull degrades into shoulder mobility, no-equipment plans can skip or dilute focus-domain work, floor and step-up movements lack explicit gating for a 45-65 consumer cohort, balance progression is thin, and progression criteria are generic rather than exercise-specific.

Stage 4 should be considered complete as an audit, but it exposes remediation that should happen before Stage 5 starts consuming this catalogue as authoritative generation input.

## 2. Baseline Validation And Repository Status

### Prior-stage context read

The audit was checked against the current Stage 0 through Stage 3D reports and prompts. The most important carry-forward constraints are:

- Stage 1A: invalid/no-domain baseline cannot create a training block.
- Stage 2A/2A.1: camera readiness and ROM gates should fail closed.
- Stage 3A: malformed scoring should fail closed.
- Stage 3B: official Check-Ups require all three headline domains; manual/quick isolated outputs remain explicitly non-official.
- Stage 3C/3C.1: versioned score snapshots and source identity are required to prevent silent rescoring.
- Stage 3D-A/C/D: display copy is softer, exact tie/near-tie policies are explicit, and neutral change labels avoid over-claiming.
- Stage 3D-B norm provenance remains required before beta and is carried forward in the final decisions.

### Validation commands

Targeted catalogue/session validation:

```text
npm test -- --runInBand src/exercises/__tests__/catalog.test.ts src/exercises/__tests__/setGraders.test.ts src/exercises/__tests__/validTime.test.ts src/exercises/__tests__/autoregulation.test.ts src/training/__tests__/workoutGeneration.test.ts src/training/__tests__/progression.test.ts src/training/__tests__/validTimeProgression.test.ts src/training/__tests__/sessionPlayer.test.ts src/training/__tests__/autoregulationFlow.test.ts src/training/__tests__/freshUser.integration.test.ts src/haleFlow/__tests__/sessionPlanning.test.ts src/haleFlow/__tests__/exploreViewModel.test.ts src/adherence/__tests__/blockServiceEligibility.test.ts src/adherence/__tests__/adherence.test.ts
```

Result: PASS. 14 test suites passed, 113 tests passed, 0 snapshots. The command emitted a Watchman recrawl warning and expected `sessionPlanning` fallback warnings from tests that deliberately exercise missing active blocks and unsupported exercise IDs.

Full validation:

```text
npm test -- --runInBand
```

Result: PASS. 84 test suites passed, 595 tests passed, 0 snapshots. The command emitted expected backend sync logs/warnings and the standard Jest open-handle warning after completion.

```text
npm run typecheck
```

Result: PASS. `tsc --noEmit` exited 0.

```text
npx --no-install expo config --type public
```

Result: PASS. Expo config exited 0 and printed the public app config. It warned that `@sentry/react-native/expo` is missing explicit organization/project config and will fall back to environment variables during build.

```text
git diff --check
```

Result: PASS. No whitespace errors reported.

### Initial preflight repository snapshot

The initial preflight snapshot was taken before the audit. It showed a dirty worktree with user-owned tracked and untracked changes already present.

```text
### git status --short --untracked-files=all
 M AGENTS.md
 M App.tsx
 M CLAUDE.md
 M app.json
 M assets/images/hale-home-hero-premium.png
 M docs/decisions.md
 M modules/expo-pose-detection/android/src/main/java/expo/modules/posedetection/PoseDetectionView.kt
 M modules/expo-pose-detection/ios/PoseDetectionView.swift
 M scripts/skeleton-preview.ts
 M src/adherence/__tests__/adherence.test.ts
 M src/adherence/__tests__/blockServiceEligibility.test.ts
 M src/adherence/adherenceCopy.ts
 M src/adherence/blockService.ts
 M src/adherence/components/CurrentBlockCard.tsx
 M src/adherence/components/LifeGoalSelector.tsx
 M src/adherence/milestoneService.ts
 M src/adherence/screens/BlockIntroScreen.tsx
 M src/adherence/screens/BlockReportScreen.tsx
 M src/adherence/screens/RestartSessionScreen.tsx
 M src/adherence/screens/SessionCompletionScreen.tsx
 M src/adherence/screens/SupportCircleScreen.tsx
 M src/adherence/screens/WeeklySummaryScreen.tsx
 M src/adherence/types.ts
 M src/checkup/index.ts
 M src/components/AccountAuthCard.tsx
 M src/components/ui.tsx
 M src/family/fixture.ts
 M src/haleFlow/__tests__/appLifecycle.test.ts
 M src/haleFlow/__tests__/assessmentEligibility.test.ts
 M src/haleFlow/__tests__/copyGuardrails.test.ts
 M src/haleFlow/__tests__/exploreViewModel.test.ts
 M src/haleFlow/__tests__/haleFlow.test.ts
 M src/haleFlow/__tests__/progressViewModel.test.ts
 M src/haleFlow/__tests__/sessionPlanning.test.ts
 M src/haleFlow/appLifecycle.ts
 M src/haleFlow/assessmentEligibility.ts
 M src/haleFlow/assessmentResultState.ts
 M src/haleFlow/assessments.ts
 M src/haleFlow/copy.ts
 M src/haleFlow/exploreViewModel.ts
 M src/haleFlow/index.ts
 M src/haleFlow/planViewModel.ts
 M src/haleFlow/progressViewModel.ts
 M src/haleFlow/reports.ts
 M src/haleFlow/types.ts
 M src/history/__tests__/history.test.ts
 M src/history/index.ts
 M src/history/serialize.ts
 M src/history/store.ts
 M src/learn/articles.ts
 M src/navigation/TabBar.tsx
 M src/navigation/__tests__/TabBar.test.ts
 M src/navigation/icons.tsx
 M src/onboarding/__tests__/onboarding.test.ts
 M src/onboarding/state.ts
 M src/preflight/PreflightBanner.tsx
 M src/preflight/SetupHelpPanel.tsx
 M src/scoring/index.ts
 M src/screens/ArticleScreen.tsx
 M src/screens/AssessmentScreen.tsx
 M src/screens/AuthScreen.tsx
 M src/screens/CheckUpScreen.tsx
 M src/screens/ExploreDetailScreens.tsx
 M src/screens/ExploreScreen.tsx
 M src/screens/FamilyScreen.tsx
 M src/screens/HomeScreen.tsx
 M src/screens/LearnScreen.tsx
 M src/screens/ManualCheckupStartScreen.tsx
 M src/screens/MicroCheckScreen.tsx
 M src/screens/OnboardingBlockScreen.tsx
 M src/screens/OnboardingResultsScreen.tsx
 M src/screens/PlanScreen.tsx
 M src/screens/ProgressScreen.tsx
 M src/screens/ResultsScreen.tsx
 M src/screens/SessionPreviewScreen.tsx
 M src/screens/SettingsScreen.tsx
 M src/screens/TodayScreen.tsx
 M src/screens/TrainingSessionScreen.tsx
 M src/screens/WelcomeScreen.tsx
 M src/services/backend/__tests__/blockReportSyncService.test.ts
 M src/services/backend/__tests__/checkupSyncService.test.ts
 M src/services/backend/__tests__/restoreService.test.ts
 M src/services/backend/blockReportSyncService.ts
 M src/services/backend/checkupSyncService.ts
 M src/services/backend/microCheckSyncService.ts
 M src/services/backend/restoreService.ts
 M src/theme/index.ts
?? assets/images/explore-insight-protein.png
?? assets/images/explore-insight-sleep.png
?? assets/images/explore-insight-strength-balance.png
?? assets/images/explore-insight-walking.png
?? assets/images/explore-learn-balance-practice.png
?? assets/images/explore-learn-camera-setup.png
?? assets/images/explore-learn-chair-rise.png
?? assets/images/explore-learn-checkup-guide.png
?? assets/images/explore-learn-mobility-basics.png
?? assets/images/explore-learn-monthly-retest.png
?? assets/images/explore-learn-movement-discomfort.png
?? assets/images/explore-learn-resistance-band.png
?? docs/audits/HALE_LOGIC_AUDIT_STAGE_3D.md
?? docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3B.md
?? docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3C.md
?? docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_A.md
?? docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_C.md
?? docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_D.md
?? docs/audits/HALE_LOGIC_VERIFICATION_STAGE_3C_1.md
?? docs/audits/Hale_Stage_3B_Evidence_Officialness_Prompt.md
?? docs/audits/Hale_Stage_3C_1_Versioned_Snapshot_Verification_Prompt.md
?? docs/audits/Hale_Stage_3C_Scoring_Norm_Versioning_Prompt.md
?? docs/audits/Hale_Stage_3D_A_Display_Copy_Softening_Prompt.md
?? docs/audits/Hale_Stage_3D_C_Exact_Tie_Policy_Prompt.md
?? docs/audits/Hale_Stage_3D_D_Near_Tie_Meaningful_Change_Prompt.md
?? docs/audits/Hale_Stage_3D_Norm_Claims_Audit_Prompt.md
?? docs/audits/Hale_Stage_4_Exercise_Catalogue_Audit_Prompt.md
?? src/checkup/retry.ts
?? src/haleFlow/__tests__/checkupHistory.test.ts
?? src/haleFlow/assessmentEvidence.ts
?? src/haleFlow/checkupHistory.ts
?? src/scoring/__tests__/focusSelection.test.ts
?? src/scoring/__tests__/scoreSnapshot.test.ts
?? src/scoring/focusSelection.ts
?? src/scoring/scoreSnapshot.ts
?? src/scoring/versions.ts

### git diff --name-only
AGENTS.md
App.tsx
CLAUDE.md
app.json
assets/images/hale-home-hero-premium.png
docs/decisions.md
modules/expo-pose-detection/android/src/main/java/expo/modules/posedetection/PoseDetectionView.kt
modules/expo-pose-detection/ios/PoseDetectionView.swift
scripts/skeleton-preview.ts
src/adherence/__tests__/adherence.test.ts
src/adherence/__tests__/blockServiceEligibility.test.ts
src/adherence/adherenceCopy.ts
src/adherence/blockService.ts
src/adherence/components/CurrentBlockCard.tsx
src/adherence/components/LifeGoalSelector.tsx
src/adherence/milestoneService.ts
src/adherence/screens/BlockIntroScreen.tsx
src/adherence/screens/BlockReportScreen.tsx
src/adherence/screens/RestartSessionScreen.tsx
src/adherence/screens/SessionCompletionScreen.tsx
src/adherence/screens/SupportCircleScreen.tsx
src/adherence/screens/WeeklySummaryScreen.tsx
src/adherence/types.ts
src/checkup/index.ts
src/components/AccountAuthCard.tsx
src/components/ui.tsx
src/family/fixture.ts
src/haleFlow/__tests__/appLifecycle.test.ts
src/haleFlow/__tests__/assessmentEligibility.test.ts
src/haleFlow/__tests__/copyGuardrails.test.ts
src/haleFlow/__tests__/exploreViewModel.test.ts
src/haleFlow/__tests__/haleFlow.test.ts
src/haleFlow/__tests__/progressViewModel.test.ts
src/haleFlow/__tests__/sessionPlanning.test.ts
src/haleFlow/appLifecycle.ts
src/haleFlow/assessmentEligibility.ts
src/haleFlow/assessmentResultState.ts
src/haleFlow/assessments.ts
src/haleFlow/copy.ts
src/haleFlow/exploreViewModel.ts
src/haleFlow/index.ts
src/haleFlow/planViewModel.ts
src/haleFlow/progressViewModel.ts
src/haleFlow/reports.ts
src/haleFlow/types.ts
src/history/__tests__/history.test.ts
src/history/index.ts
src/history/serialize.ts
src/history/store.ts
src/learn/articles.ts
src/navigation/TabBar.tsx
src/navigation/__tests__/TabBar.test.ts
src/navigation/icons.tsx
src/onboarding/__tests__/onboarding.test.ts
src/onboarding/state.ts
src/preflight/PreflightBanner.tsx
src/preflight/SetupHelpPanel.tsx
src/scoring/index.ts
src/screens/ArticleScreen.tsx
src/screens/AssessmentScreen.tsx
src/screens/AuthScreen.tsx
src/screens/CheckUpScreen.tsx
src/screens/ExploreDetailScreens.tsx
src/screens/ExploreScreen.tsx
src/screens/FamilyScreen.tsx
src/screens/HomeScreen.tsx
src/screens/LearnScreen.tsx
src/screens/ManualCheckupStartScreen.tsx
src/screens/MicroCheckScreen.tsx
src/screens/OnboardingBlockScreen.tsx
src/screens/OnboardingResultsScreen.tsx
src/screens/PlanScreen.tsx
src/screens/ProgressScreen.tsx
src/screens/ResultsScreen.tsx
src/screens/SessionPreviewScreen.tsx
src/screens/SettingsScreen.tsx
src/screens/TodayScreen.tsx
src/screens/TrainingSessionScreen.tsx
src/screens/WelcomeScreen.tsx
src/services/backend/__tests__/blockReportSyncService.test.ts
src/services/backend/__tests__/checkupSyncService.test.ts
src/services/backend/__tests__/restoreService.test.ts
src/services/backend/blockReportSyncService.ts
src/services/backend/checkupSyncService.ts
src/services/backend/microCheckSyncService.ts
src/services/backend/restoreService.ts
src/theme/index.ts

### git diff --stat
 AGENTS.md                                          |    4 +-
 App.tsx                                            |  255 +++--
 CLAUDE.md                                          |    2 +-
 app.json                                           |    6 +-
 assets/images/hale-home-hero-premium.png           |  Bin 1753564 -> 1880702 bytes
 docs/decisions.md                                  |   75 ++
 .../modules/posedetection/PoseDetectionView.kt     |    4 +-
 .../ios/PoseDetectionView.swift                    |    4 +-
 scripts/skeleton-preview.ts                        |    4 +-
 src/adherence/__tests__/adherence.test.ts          |   36 +-
 .../__tests__/blockServiceEligibility.test.ts      |  130 ++-
 src/adherence/adherenceCopy.ts                     |   32 +-
 src/adherence/blockService.ts                      |   34 +-
 src/adherence/components/CurrentBlockCard.tsx      |   10 +-
 src/adherence/components/LifeGoalSelector.tsx      |    2 +-
 src/adherence/milestoneService.ts                  |   22 +-
 src/adherence/screens/BlockIntroScreen.tsx         |    4 +-
 src/adherence/screens/BlockReportScreen.tsx        |   93 +-
 src/adherence/screens/RestartSessionScreen.tsx     |    4 +-
 src/adherence/screens/SessionCompletionScreen.tsx  |    4 +-
 src/adherence/screens/SupportCircleScreen.tsx      |    4 +-
 src/adherence/screens/WeeklySummaryScreen.tsx      |    4 +-
 src/adherence/types.ts                             |   40 +-
 src/checkup/index.ts                               |    1 +
 src/components/AccountAuthCard.tsx                 |   11 +-
 src/components/ui.tsx                              |   57 +-
 src/family/fixture.ts                              |    2 +-
 src/haleFlow/__tests__/appLifecycle.test.ts        |   84 +-
 .../__tests__/assessmentEligibility.test.ts        |  419 +++++++-
 src/haleFlow/__tests__/copyGuardrails.test.ts      |   56 +-
 src/haleFlow/__tests__/exploreViewModel.test.ts    |   35 +-
 src/haleFlow/__tests__/haleFlow.test.ts            |   32 +-
 src/haleFlow/__tests__/progressViewModel.test.ts   |  327 ++++++-
 src/haleFlow/__tests__/sessionPlanning.test.ts     |   14 +-
 src/haleFlow/appLifecycle.ts                       |   41 +-
 src/haleFlow/assessmentEligibility.ts              |  267 +++++-
 src/haleFlow/assessmentResultState.ts              |   48 +-
 src/haleFlow/assessments.ts                        |  119 ++-
 src/haleFlow/copy.ts                               |   18 +-
 src/haleFlow/exploreViewModel.ts                   |  233 ++++-
 src/haleFlow/index.ts                              |    2 +
 src/haleFlow/planViewModel.ts                      |    6 +-
 src/haleFlow/progressViewModel.ts                  |  202 ++--
 src/haleFlow/reports.ts                            |   75 +-
 src/haleFlow/types.ts                              |    3 +-
 src/history/__tests__/history.test.ts              |   90 +-
 src/history/index.ts                               |    2 +-
 src/history/serialize.ts                           |  100 +-
 src/history/store.ts                               |    6 +-
 src/learn/articles.ts                              |   15 +-
 src/navigation/TabBar.tsx                          |   83 +-
 src/navigation/__tests__/TabBar.test.ts            |    9 +-
 src/navigation/icons.tsx                           |   11 +-
 src/onboarding/__tests__/onboarding.test.ts        |   59 +-
 src/onboarding/state.ts                            |    8 +-
 src/preflight/PreflightBanner.tsx                  |    6 +-
 src/preflight/SetupHelpPanel.tsx                   |    8 +-
 src/scoring/index.ts                               |   46 +
 src/screens/ArticleScreen.tsx                      |   10 +-
 src/screens/AssessmentScreen.tsx                   |    4 +-
 src/screens/AuthScreen.tsx                         |   11 +-
 src/screens/CheckUpScreen.tsx                      |   15 +-
 src/screens/ExploreDetailScreens.tsx               |   19 +-
 src/screens/ExploreScreen.tsx                      | 1003 ++++++++++++++++----
 src/screens/FamilyScreen.tsx                       |   12 +-
 src/screens/HomeScreen.tsx                         |   71 +-
 src/screens/LearnScreen.tsx                        |   14 +-
 src/screens/ManualCheckupStartScreen.tsx           |    4 +-
 src/screens/MicroCheckScreen.tsx                   |    4 +-
 src/screens/OnboardingBlockScreen.tsx              |    2 +-
 src/screens/OnboardingResultsScreen.tsx            |   90 +-
 src/screens/PlanScreen.tsx                         |  760 ++++++++++-----
 src/screens/ProgressScreen.tsx                     |  806 ++++++++++++++--
 src/screens/ResultsScreen.tsx                      |  169 +++-
 src/screens/SessionPreviewScreen.tsx               |   21 +-
 src/screens/SettingsScreen.tsx                     |  407 +++++---
 src/screens/TodayScreen.tsx                        |  655 +++++++------
 src/screens/TrainingSessionScreen.tsx              |    6 +-
 src/screens/WelcomeScreen.tsx                      |   20 +-
 .../__tests__/blockReportSyncService.test.ts       |    8 +-
 .../backend/__tests__/checkupSyncService.test.ts   |  159 ++++
 .../backend/__tests__/restoreService.test.ts       |  206 +++-
 src/services/backend/blockReportSyncService.ts     |    6 +
 src/services/backend/checkupSyncService.ts         |   70 +-
 src/services/backend/microCheckSyncService.ts      |    5 +
 src/services/backend/restoreService.ts             |   92 +-
 src/theme/index.ts                                 |   77 +-
 87 files changed, 6238 insertions(+), 1756 deletions(-)
```

## 3. Training-Content Architecture

The current training content is split into three layers.

First, individual exercise definitions live in `src/exercises/*` and self-register through `registerExercise`, with `src/exercises/index.ts` owning the import list. The registry rejects duplicate IDs and exposes `listExercises`, `getExercise`, `hasExercise`, and `familyLevels`.

Second, product-facing ladders live in `src/exercises/ladders.ts`. This layer carries domain, release status, measurement tier, equipment tags, camera view, instructions, setup notes, measurement notes, and default progression/regression copy. This is the primary Stage 4 catalogue surface.

Third, session assembly lives mostly in `src/training/workoutGeneration.ts`. It defines domain templates, extra-session presets, slot fallback ladders, equipment filtering, pain filtering, readiness adjustments, generated exercise payloads, and post-session ladder progression. `src/haleFlow/sessionPlanning.ts` adapts generated sessions into `HaleSessionPlan`, supports manual ladder practice, and still has a legacy fallback path. `src/haleFlow/exploreViewModel.ts` exposes extra-session cards and ladder cards/details.

Architectural verdict: sound enough to remediate in place. The main concern is not structure; it is the semantic quality and safety specificity of the catalogue data that this architecture now makes visible.

## 4. Full Exercise Inventory

Counts from live registry/ladders:

- Registered exercise definitions: 37.
- Exercise ladders: 11.
- Ladder levels: 37.
- Release statuses: 30 `v1_core`, 7 `v1_optional`.
- Level domains: 25 strength/power, 6 balance/stability, 6 mobility/flexibility.
- Measurement tiers: 15 measured, 19 camera-assisted, 3 voice-guided.
- Dangling exercise definitions: none found.
- Ladder levels with no registered definition: none found.

| ID | Name | Ladder | Domain | Status | Tier | Equipment | Dose | Regression | Progression | Substitute |
|---|---|---|---|---|---|---|---|---|---|---|
| sts-cushion | Cushion Sit-to-Stand | sit-to-stand | strength_power | v1_core | measured | chair+cushion | 2x8 reps |  | sts-standard |  |
| sts-standard | Sit-to-Stand | sit-to-stand | strength_power | v1_core | measured | chair | 3x10 reps | sts-cushion | sts-slow-eccentric |  |
| sts-slow-eccentric | Slow-Lower Sit-to-Stand | sit-to-stand | strength_power | v1_core | measured | chair | 3x8 reps | sts-standard | sts-power |  |
| sts-power | Power Sit-to-Stand | sit-to-stand | strength_power | v1_core | measured | chair | 3x12 reps | sts-slow-eccentric | loaded-sit-to-stand |  |
| loaded-sit-to-stand | Loaded Sit-to-Stand | sit-to-stand | strength_power | v1_optional | measured | chair+backpack_or_weight | 3x8 reps | sts-power |  | sts-power |
| squat-supported | Supported Squat | squat | strength_power | v1_core | measured | chair+counter | 2x10 reps |  | squat-free |  |
| squat-free | Squat | squat | strength_power | v1_core | measured | none | 3x12 reps | squat-supported | squat-slow-eccentric |  |
| squat-slow-eccentric | Slow-Lower Squat | squat | strength_power | v1_optional | measured | none | 3x8 reps | squat-free | squat-loaded |  |
| squat-loaded | Loaded Squat | squat | strength_power | v1_optional | measured | backpack_or_weight | 3x8 reps | squat-slow-eccentric | chair-supported-split-squat | squat-slow-eccentric |
| chair-supported-split-squat | Chair-Supported Split Squat | squat | strength_power | v1_optional | camera_assisted | chair+counter | 2x8 reps | squat-loaded |  |  |
| step-up | Step-Up | step-up | strength_power | v1_core | camera_assisted | stair | 3x12 reps |  |  | sts-standard |
| heel-raise-supported | Supported Heel Raise | heel-toe-raise | strength_power | v1_core | camera_assisted | wall+counter | 2x15 reps |  | heel-raise-free |  |
| heel-raise-free | Heel Raise | heel-toe-raise | strength_power | v1_core | camera_assisted | none | 3x18 reps | heel-raise-supported | toe-raise-supported |  |
| toe-raise-supported | Supported Toe Raise | heel-toe-raise | strength_power | v1_core | camera_assisted | wall+counter | 2x30s timer | heel-raise-free |  |  |
| glute-bridge-hold | Bridge Hold | hinge-glutes | strength_power | v1_core | camera_assisted | floor | 3x20s hold |  | glute-bridge-reps |  |
| glute-bridge-reps | Glute Bridge | hinge-glutes | strength_power | v1_core | camera_assisted | floor | 3x12 reps | glute-bridge-hold |  |  |
| push-up-wall | Wall Push-Up | push | strength_power | v1_core | camera_assisted | wall | 2x10 reps |  | push-up-incline |  |
| push-up-incline | Incline Push-Up | push | strength_power | v1_core | camera_assisted | chair+counter | 3x10 reps | push-up-wall | push-up-standard |  |
| push-up-standard | Push-Up | push | strength_power | v1_optional | camera_assisted | floor | 3x8 reps | push-up-incline |  |  |
| overhead-reach | Overhead Reach | shoulder-reach-press | mobility_flexibility | v1_core | measured | none | 2x12 reps |  | overhead-press-band |  |
| overhead-press-band | Band Overhead Press | shoulder-reach-press | strength_power | v1_core | camera_assisted | long_band | 3x12 reps | overhead-reach |  | overhead-reach |
| hip-hinge-wall | Wall-Tap Hinge | hinge-glutes | strength_power | v1_core | measured | wall | 2x10 reps |  | hip-hinge-free |  |
| hip-hinge-free | Hip Hinge | hinge-glutes | strength_power | v1_core | measured | none | 3x12 reps | hip-hinge-wall |  |  |
| balance-feet-together-hold | Feet-Together Hold | balance | balance_stability | v1_core | measured | counter | 3x20s hold |  | balance-tandem-hold |  |
| balance-tandem-hold | Tandem Hold | balance | balance_stability | v1_core | measured | counter | 3x20s hold | balance-feet-together-hold | balance-single-leg-hold |  |
| balance-single-leg-hold | Single-Leg Hold | balance | balance_stability | v1_core | measured | counter | 3x15s hold | balance-tandem-hold |  |  |
| seated-hamstring-reach | Seated Hamstring Reach | mobility-flexibility | mobility_flexibility | v1_core | camera_assisted | chair | 2x12s capture |  |  |  |
| neck-rotation | Neck Rotations | mobility-flexibility | mobility_flexibility | v1_optional | voice_guided | none | 1x14s capture |  |  |  |
| loaded-march | March in Place | lateral-stability | balance_stability | v1_core | camera_assisted | none | 3x16 reps |  |  |  |
| seated-band-row | Seated Band Row | pull-upper-back | strength_power | v1_core | camera_assisted | chair+long_band | 2x10 reps |  | standing-band-row | overhead-reach |
| standing-band-row | Standing Band Row | pull-upper-back | strength_power | v1_core | camera_assisted | long_band+door_anchor | 3x10 reps | seated-band-row | band-pull-apart | overhead-reach |
| band-pull-apart | Band Pull-Apart | pull-upper-back | strength_power | v1_core | camera_assisted | long_band | 2x30s timer | standing-band-row |  | overhead-reach |
| supported-side-step | Supported Side Step | lateral-stability | balance_stability | v1_core | camera_assisted | counter | 2x30s timer |  | mini-band-lateral-walk |  |
| mini-band-lateral-walk | Mini-Band Lateral Walk | lateral-stability | balance_stability | v1_optional | camera_assisted | mini_band | 2x30s timer | supported-side-step |  | supported-side-step |
| thoracic-rotation | Thoracic Rotation | mobility-flexibility | mobility_flexibility | v1_core | camera_assisted | chair | 2x30s timer |  |  |  |
| supported-hip-flexor-stretch | Supported Hip Flexor Stretch | mobility-flexibility | mobility_flexibility | v1_core | voice_guided | chair+counter | 2x30s timer |  |  |  |
| wall-calf-stretch | Wall Calf Stretch | mobility-flexibility | mobility_flexibility | v1_core | voice_guided | wall | 2x30s timer |  |  |  |

## 5. Domain Mapping Audit

Strength/power is the strongest mapping. Chair stand, squat, step-up, heel/toe raise, push, pull, hinge/glute, and overhead press cover enough beginner-to-intermediate strength patterns for a V1 home app. The chair-rise assessment maps especially well to sit-to-stand and power sit-to-stand progression.

Balance/stability has a plausible but thin mapping. The static balance ladder maps to the balance assessment, and lateral stepping/marching introduces dynamic balance. However, the highest core lateral level is `loaded-march`, a no-equipment march with no support requirement, and there is no training analogue for eyes-closed balance even though the assessment ladder includes eyes-open and eyes-closed conditions.

Mobility/flexibility has partial mapping. Shoulder flexion maps to `overhead-reach`; hinge reach maps partly to hip hinge and seated hamstring reach; calf, hip flexor, and thoracic rotation add useful general mobility. The mobility ladder is a collection, not a true progression in one movement quality.

One explicit domain mismatch should be fixed: `overhead-press-band` is a strength/power level inside the `shoulder-reach-press` ladder, while that ladder is declared mobility/flexibility (`src/exercises/ladders.ts:479-511`). This matters for Stage 5 because a generator consuming ladder-level and ladder-level domains may make different choices depending on which field it trusts.

Domain verdicts:

- Strength/power: mostly adequate, with an upper-pull equipment gap.
- Balance/stability: needs safety and progression remediation.
- Mobility/flexibility: useful coverage, but not yet a rigorous ladder model.

## 6. Progression Ladder Audit

The catalogue has clear progressions for sit-to-stand, squat, heel/toe raise, push-up, pull/upper-back, hinge/glutes, shoulder reach/press, balance holds, lateral stability, and mobility. Generic criteria are centralized in `STANDARD_PROGRESS` and `STANDARD_REGRESS` (`src/exercises/ladders.ts:60-79`), and generated progression updates are handled in `updateLadderProgressAfterSession` (`src/training/workoutGeneration.ts:460-551`).

Main issues:

- Progression criteria are generic across every level. They do not mention movement-specific safety gates such as step height, band anchoring, floor transfer confidence, balance support, or loaded movement setup.
- Generated progression can advance after two sessions at completion >= 0.85 and average RPE <= 3 if no recent pain is present (`src/training/workoutGeneration.ts:516-525`). That is reasonable as a first pass but does not incorporate rep quality, velocity trend, balance reset quality beyond valid-time signals, or exercise-specific constraints.
- `validTime` signals correctly hold or regress when tracking is uncertain, incomplete, or completed with resets (`src/training/workoutGeneration.ts:496-515`), but only where the exercise produces those signals.
- The step-up ladder is a single level (`src/exercises/ladders.ts:240-263`), so there is no in-catalogue easier/harder stair progression. Its only substitute is outside the ladder through `sts-standard`.
- Mobility levels are ordered, but the order is not a true progression. Hamstring reach -> thoracic rotation -> hip flexor stretch -> calf stretch does not represent increasing difficulty.
- Definition `level` values are one-based inside several exercise families, while ladder level ordinals are zero-based. Runtime uses ladder level indices for generated sessions, but the mismatch is an avoidable Stage 5 data-shape hazard.

Progression verdict: the scaffolding is good, but the ladder semantics are not yet reliable enough for autonomous dynamic progression without Stage 4 remediation.

## 7. Regression And Substitution Audit

Positive findings:

- Most equipment-dependent advanced strength levels have explicit regression or substitute IDs.
- `selectExerciseForSlot` searches from the desired ladder level down and then up, which gives daily setup/readiness a chance to find a safer level (`src/training/workoutGeneration.ts:728-776`).
- Pain and readiness can reduce level index, sets, and reps (`src/training/workoutGeneration.ts:778-897`).
- Extra sessions and manual practice also reuse catalogue levels instead of hardcoding isolated exercise IDs.

Gaps:

- Upper-body pulling is band-dependent. Without a resistance band, `upper_body_pull` falls back to `shoulder-reach-press` (`src/training/workoutGeneration.ts:244-258`), and the user-facing reason explicitly says shoulder mobility will replace upper-back pulling (`src/training/workoutGeneration.ts:798-810`). This preserves a session slot but loses the pull stimulus.
- `seated-band-row`, `standing-band-row`, and `band-pull-apart` all substitute to `overhead-reach`, so the exercise-level substitution has the same stimulus problem.
- `floor` is treated as always supported by equipment filtering (`src/training/workoutGeneration.ts:964-981`) and is filtered out of session equipment labels (`src/haleFlow/sessionPlanning.ts:843-848`). That hides an important access and safety requirement for bridge and floor push-up work.
- Counter support has different meanings across layers. Balance ladder levels require `counter`, but balance exercise definitions list `none`. Generated sessions use ladder equipment; lower-level consumers using definitions directly may miss support.
- Pain filtering is good for obvious cases, but incomplete for adjacent movement stress. Hip/back pain can still select step-up in strength sessions; shoulder pain can still allow seated band row because only push, shoulder-reach-press, overhead, and pull-apart are excluded (`src/training/workoutGeneration.ts:984-1019`).

Regression verdict: functional, but substitutions sometimes preserve app flow at the cost of training intent.

## 8. Safety Suitability Audit

Safety issue count by severity:

- High: 3.
- Medium: 8.
- Low: 5.

High severity:

1. Floor-based work is allowed without floor-transfer screening. `glute-bridge-hold`, `glute-bridge-reps`, and `push-up-standard` require floor access, but `floor` always passes equipment support and is omitted from equipment labels (`src/training/workoutGeneration.ts:964-981`, `src/haleFlow/sessionPlanning.ts:843-848`).
2. Step-up is a core strength path when stairs are available, but the catalogue lacks explicit step-height, rail/counter support, stair surface, or space requirements (`src/exercises/ladders.ts:240-263`). The measurement note says Hale does not score foot placement or stair height.
3. `loaded-march` is a no-equipment core balance/stability level with no support cue (`src/exercises/ladders.ts:602-614`). In no-equipment scenarios it becomes the dominant balance substitute, even for balance-focus sessions.

Medium severity:

1. Single-leg balance can become reachable through generic progression without a stronger balance-confidence gate.
2. Banded row/press movements lack detailed band anchoring and snap-back safety guidance.
3. Loaded sit-to-stand and loaded squat rely on user-selected load but lack load-selection stop rules.
4. Split squat and mini-band lateral walk are optional but would benefit from explicit prerequisite checks.
5. Pain filtering misses adjacent stress patterns, especially hip/back pain with step-ups and shoulder pain with rows.
6. Generic safety notes say to stop if unsafe but do not consistently mention dizziness, breath holding, sharp pain, unstable surfaces, or clearing nearby obstacles.
7. Step and balance movements rely on the phrase "support nearby" but do not verify support availability in all code paths.
8. Dynamic progression does not use movement-specific safety history beyond pain, completion, RPE, tracking, and valid-time signals.

Low severity:

1. The `loaded-march` source name no longer matches the displayed exercise.
2. Level numbering differs between definitions and ladders.
3. Mobility collection appears as a ladder despite being a mixed set of drills.
4. Explore practice guidance is generic for all ladders.
5. Equipment labels may understate floor/counter nuance.

Safety verdict: not unsafe by intent, but under-specified for the target age cohort and for an audio-first session flow.

## 9. Minimal Equipment And Stimulus Audit

Default chair+wall sessions are generally workable. They provide lower-body strength, basic push, supported balance/lateral work, and simple mobility.

Chair-only and wall-only profiles still produce sessions, but stimulus varies. Chair-only can substitute free hinge/heel raise; wall-only can force bodyweight squat and wall calf stretch.

True no-equipment profiles are the weakest path. Scenario sweeps showed examples such as:

- Strength no-equipment: squat-free, overhead-reach, loaded-march, hip-hinge-free, with one strength-B slot skipped.
- Balance no-equipment: loaded-march plus strength/mobility substitutions, with primary balance/lateral slots skipped.
- Mobility no-equipment: some sessions become mostly strength and marching, with trunk or upper-pull slots skipped.

Minimal-equipment adequacy by domain:

- Strength/power: adequate with chair+wall; partial with true no-equipment; inadequate for upper-body pull without a band.
- Balance/stability: adequate with a counter-like support; weak with true no-equipment because safe static balance work depends on support.
- Mobility/flexibility: adequate with chair+wall; partial without chair/wall; true no-equipment can lose hamstring/calf/hip-flexor specificity.

Minimal-equipment verdict: the product law of zero-equipment start is not fully met at stimulus quality level. Sessions do not always block, but they sometimes become diluted or skipped.

## 10. Cueing And Execution Audit

The catalogue language mostly respects the product rule that the camera is a measuring instrument, not a form judge. Measurement notes repeatedly avoid over-claiming: "broad tempo", "rough trend", "does not score", and "timer/completion only" are appropriate.

Cueing gaps remain:

- Step-up needs rail/support, step height, surface, and "use the lowest step" cues.
- Balance and marching need a clearer "fingertips near support" standard wherever balance challenge is present.
- Floor work needs "only if getting down and up from the floor is comfortable today" and a non-floor substitute.
- Band work needs anchor security and light-resistance selection.
- Loaded work needs load-selection guidance and a rule to stop or regress if the user changes movement to complete reps.
- Mobility work needs clearer "mild stretch, no sharp pain, no bounce" language.
- Breathing/dizziness/stop cues are not consistently present.

Cueing verdict: measurement humility is good; safety and setup copy need a Stage 4 pass.

## 11. Session-Template Readiness Audit

The generator defines three sessions per focus domain and seven extra-session presets (`src/training/workoutGeneration.ts:580-708`). Short-on-time compaction keeps one strength, one balance, and one mobility slot when possible (`src/training/workoutGeneration.ts:941-948`). Default equipment falls back to chair+wall (`src/training/workoutGeneration.ts:1113-1117`).

Strength templates are broadly coherent, but upper-pull and stair/power slots are the most fragile. Balance templates include useful cross-domain support but depend heavily on supported side-step and basic holds. Mobility templates are balanced in default equipment but can degrade into strength/march substitutions with no equipment.

The generator records skipped slots and provides guidance when slots are skipped (`src/training/workoutGeneration.ts:1029-1042`). That is a good safety behavior, but Stage 5 should not normalize skipped slots as an acceptable dynamic-generation outcome for core domain sessions.

Session-template verdict: ready for human-authored V1 sessions after remediation; not ready as an autonomous generation substrate.

## 12. Measurement/Training Alignment Audit

Good alignments:

- 30-second chair stand maps well to sit-to-stand, power sit-to-stand, slow eccentric sit-to-stand, and loaded sit-to-stand.
- Balance assessment maps to feet-together, tandem, and single-leg holds, with valid-time signals available in progression.
- Shoulder flexion maps to overhead reach and, to a lesser extent, band overhead press.
- Hinge reach maps partly to hip hinge, seated hamstring reach, and posterior-chain mobility.

Weak alignments:

- Timed Up and Go has no direct training analogue. Step-up, lateral stepping, marching, and chair rise are related but not a TUG-specific practice ladder.
- Rise velocity exists as a measurement concept, but dynamic generated progression does not use velocity trends to advance or hold lower-body power levels.
- Balance assessment includes eyes-closed conditions; training does not expose eyes-closed progression or a carefully gated sensory progression.
- Hinge reach is standing; the core mobility reach drill is seated hamstring reach.

Alignment verdict: enough for a first 4-week block with clinician/product review, but not enough for unsupervised Stage 5 generation claims of precise domain-targeted remediation.

## 13. Explore/Practice Content Audit

Explore cards and ladder detail reuse the live catalogue. Extra-session cards are generated from presets and disabled when a band or stair-specific preset lacks the required equipment (`src/haleFlow/exploreViewModel.ts:156-191`). Ladder cards list visible `v1_core` ladders and detail pages filter optional levels out (`src/haleFlow/exploreViewModel.ts:194-245`).

Manual ladder practice is wired through `planLadderPracticeSession`, selects the current/default/core equipment-compatible level, creates a one-exercise plan, and adds generic guidance (`src/haleFlow/sessionPlanning.ts:193-243`).

Gaps:

- Practice sessions do not apply the full daily readiness/pain flow unless the caller has routed those constraints in.
- Practice guidance is generic and does not surface movement-specific safety constraints.
- Only featured extra sessions are surfaced in the Practice tab, while the generator contains seven presets. This may be intentional UI curation, but it should be explicit.
- Optional levels are hidden in Explore details, which is sensible for V1 trust, but Stage 5 needs a clear policy for when optional levels can be exposed.

Explore/practice verdict: coherent and not dead, but safety metadata needs to be richer before these surfaces are treated as dynamic training endpoints.

## 14. Dead/Reachable/Duplicate Exercise Audit

No dead catalogue definitions were found: every registered exercise definition has a ladder level, and every ladder level has a registered definition.

No duplicate registry IDs were found. The registry would throw on duplicate registration.

Reachability is broad:

- Generated Today sessions use ladders and slot fallback logic.
- Preset sessions use the same session generator.
- Manual ladder practice uses core ladder levels.
- Legacy block planning still exists as a fallback/supporting path in `src/training/block.ts`, with its own equipment substitution comments and tests.

Potential duplication/ambiguity:

- Ladder metadata and exercise definitions both carry equipment and level semantics, and they sometimes differ. Balance definitions say `none`; ladder levels say `counter`.
- `loaded-march` display copy is "March in Place", but source/legacy naming still says loaded.
- `shoulder-reach-press` mixes mobility and strength at the level level.

Dead/reachable verdict: no structural dead ends, but metadata duplication needs cleanup.

## 15. Test Coverage Audit

Existing tests cover a lot of catalogue mechanics:

- Registry integrity and substitutes in `src/exercises/__tests__/catalog.test.ts`.
- Set graders, valid-time, and autoregulation in exercise tests.
- Workout generation, progression, valid-time progression, session player, and fresh-user integration in `src/training/__tests__`.
- Session planning and Explore view-model behavior in `src/haleFlow/__tests__`.
- Block service/adherence eligibility tests in `src/adherence/__tests__`.

Coverage gaps to add during remediation:

- Scenario tests for true no-equipment profiles that assert no core domain session silently loses its focus-domain stimulus.
- Tests that upper-body pull without a band is either clearly skipped or replaced with a true no-equipment pull/posture alternative, not shoulder mobility.
- Tests that floor exercises require an explicit floor-safe profile flag before selection.
- Tests that step-up requires stair support metadata or falls back.
- Tests for domain consistency between ladder and level.
- Tests for balance support metadata consistency between ladder and definitions.
- Tests for optional-level exposure policy.
- Tests that pain areas avoid adjacent high-stress choices such as hip/back with step-ups and shoulder with rows.

Test verdict: mechanics are well covered; semantic/safety invariants need dedicated tests.

## 16. Stage 5 Catalogue Input Readiness

Stage 5 should not consume this catalogue as fully ready dynamic-generation input yet.

Reasons:

- The catalogue has stable IDs and reachability, but not enough safety metadata.
- Some substitutions preserve session completion while changing the intended stimulus.
- No-equipment outputs can be too weak, skipped, or domain-diluted.
- Domain mismatches and level-numbering mismatches can confuse automated selection.
- Progression criteria are too generic for autonomous exercise selection and advancement.
- Stage 3D-B norm provenance remains unresolved and must stay visible before beta claims.

Stage 5 readiness verdict: blocked until Stage 4 remediation lands and is validated.

## 17. Recommended Stage 4 Remediation Batches

1. Catalogue integrity cleanup:
   - Make ladder and level domain semantics consistent.
   - Resolve `overhead-press-band` placement or split shoulder mobility from overhead strength.
   - Align definition and ladder equipment metadata, especially balance support.
   - Normalize level numbering or document one canonical level index for Stage 5.
   - Rename or alias `loaded-march` so source/display/stimulus agree.

2. Safety gating:
   - Add explicit profile flags or constraints for floor-safe, stair-safe, and balance-support-available.
   - Block floor exercises unless the user has opted into floor work.
   - Require support/height guidance for step-ups.
   - Require support proximity for balance and march variants.

3. Substitution and minimal-equipment stimulus:
   - Add a true no-equipment upper-back/posture alternative or make upper-pull skipped with honest copy.
   - Add better no-equipment mobility substitutions for chairless/wallless users.
   - Make skipped core-domain slots fail loudly in tests and product copy.

4. Pain and readiness rules:
   - Expand pain-area contraindications for adjacent stress patterns.
   - Add movement-specific regression choices for pain profiles.
   - Ensure manual practice respects pain/readiness context.

5. Cueing copy:
   - Add movement-specific setup, support, stop, breathing, load, band-anchor, stair, and floor-transition copy.
   - Keep the current measurement humility language.

6. Progression policy:
   - Add exercise-specific progression/regression criteria.
   - Incorporate movement-specific valid-time/reset/velocity signals where available.
   - Treat optional levels as policy-gated, not simply `includeOptionalLevels`.

7. Semantic tests:
   - Add scenario sweeps for equipment profiles, pain profiles, readiness, optional-level exposure, domain consistency, and no skipped focus-domain stimulus.

## 18. Final Stage Decisions

STAGE 4 AUDIT COMPLETE

STAGE 4 REMEDIATION REQUIRED

STAGE 5 CATALOGUE INPUTS BLOCKED

STAGE 3D-B REQUIRED

## 19. Final Git Status

```text
### git status --short --untracked-files=all
 M AGENTS.md
 M App.tsx
 M CLAUDE.md
 M app.json
 M assets/images/hale-home-hero-premium.png
 M docs/decisions.md
 M modules/expo-pose-detection/android/src/main/java/expo/modules/posedetection/PoseDetectionView.kt
 M modules/expo-pose-detection/ios/PoseDetectionView.swift
 M scripts/skeleton-preview.ts
 M src/adherence/__tests__/adherence.test.ts
 M src/adherence/__tests__/blockServiceEligibility.test.ts
 M src/adherence/adherenceCopy.ts
 M src/adherence/blockService.ts
 M src/adherence/components/CurrentBlockCard.tsx
 M src/adherence/components/LifeGoalSelector.tsx
 M src/adherence/milestoneService.ts
 M src/adherence/screens/BlockIntroScreen.tsx
 M src/adherence/screens/BlockReportScreen.tsx
 M src/adherence/screens/RestartSessionScreen.tsx
 M src/adherence/screens/SessionCompletionScreen.tsx
 M src/adherence/screens/SupportCircleScreen.tsx
 M src/adherence/screens/WeeklySummaryScreen.tsx
 M src/adherence/types.ts
 M src/checkup/index.ts
 M src/components/AccountAuthCard.tsx
 M src/components/ui.tsx
 M src/family/fixture.ts
 M src/haleFlow/__tests__/appLifecycle.test.ts
 M src/haleFlow/__tests__/assessmentEligibility.test.ts
 M src/haleFlow/__tests__/copyGuardrails.test.ts
 M src/haleFlow/__tests__/exploreViewModel.test.ts
 M src/haleFlow/__tests__/haleFlow.test.ts
 M src/haleFlow/__tests__/progressViewModel.test.ts
 M src/haleFlow/__tests__/sessionPlanning.test.ts
 M src/haleFlow/appLifecycle.ts
 M src/haleFlow/assessmentEligibility.ts
 M src/haleFlow/assessmentResultState.ts
 M src/haleFlow/assessments.ts
 M src/haleFlow/copy.ts
 M src/haleFlow/exploreViewModel.ts
 M src/haleFlow/index.ts
 M src/haleFlow/planViewModel.ts
 M src/haleFlow/progressViewModel.ts
 M src/haleFlow/reports.ts
 M src/haleFlow/types.ts
 M src/history/__tests__/history.test.ts
 M src/history/index.ts
 M src/history/serialize.ts
 M src/history/store.ts
 M src/learn/articles.ts
 M src/navigation/TabBar.tsx
 M src/navigation/__tests__/TabBar.test.ts
 M src/navigation/icons.tsx
 M src/onboarding/__tests__/onboarding.test.ts
 M src/onboarding/state.ts
 M src/preflight/PreflightBanner.tsx
 M src/preflight/SetupHelpPanel.tsx
 M src/scoring/index.ts
 M src/screens/ArticleScreen.tsx
 M src/screens/AssessmentScreen.tsx
 M src/screens/AuthScreen.tsx
 M src/screens/CheckUpScreen.tsx
 M src/screens/ExploreDetailScreens.tsx
 M src/screens/ExploreScreen.tsx
 M src/screens/FamilyScreen.tsx
 M src/screens/HomeScreen.tsx
 M src/screens/LearnScreen.tsx
 M src/screens/ManualCheckupStartScreen.tsx
 M src/screens/MicroCheckScreen.tsx
 M src/screens/OnboardingBlockScreen.tsx
 M src/screens/OnboardingResultsScreen.tsx
 M src/screens/PlanScreen.tsx
 M src/screens/ProgressScreen.tsx
 M src/screens/ResultsScreen.tsx
 M src/screens/SessionPreviewScreen.tsx
 M src/screens/SettingsScreen.tsx
 M src/screens/TodayScreen.tsx
 M src/screens/TrainingSessionScreen.tsx
 M src/screens/WelcomeScreen.tsx
 M src/services/backend/__tests__/blockReportSyncService.test.ts
 M src/services/backend/__tests__/checkupSyncService.test.ts
 M src/services/backend/__tests__/restoreService.test.ts
 M src/services/backend/blockReportSyncService.ts
 M src/services/backend/checkupSyncService.ts
 M src/services/backend/microCheckSyncService.ts
 M src/services/backend/restoreService.ts
 M src/theme/index.ts
?? assets/icons/settings-cog.png
?? assets/images/explore-insight-protein.png
?? assets/images/explore-insight-sleep.png
?? assets/images/explore-insight-strength-balance.png
?? assets/images/explore-insight-walking.png
?? assets/images/explore-learn-balance-practice.png
?? assets/images/explore-learn-camera-setup.png
?? assets/images/explore-learn-chair-rise.png
?? assets/images/explore-learn-checkup-guide.png
?? assets/images/explore-learn-mobility-basics.png
?? assets/images/explore-learn-monthly-retest.png
?? assets/images/explore-learn-movement-discomfort.png
?? assets/images/explore-learn-resistance-band.png
?? docs/audits/HALE_LOGIC_AUDIT_STAGE_3D.md
?? docs/audits/HALE_LOGIC_AUDIT_STAGE_4.md
?? docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3B.md
?? docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3C.md
?? docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_A.md
?? docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_C.md
?? docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_D.md
?? docs/audits/HALE_LOGIC_VERIFICATION_STAGE_3C_1.md
?? docs/audits/Hale_Stage_3B_Evidence_Officialness_Prompt.md
?? docs/audits/Hale_Stage_3C_1_Versioned_Snapshot_Verification_Prompt.md
?? docs/audits/Hale_Stage_3C_Scoring_Norm_Versioning_Prompt.md
?? docs/audits/Hale_Stage_3D_A_Display_Copy_Softening_Prompt.md
?? docs/audits/Hale_Stage_3D_C_Exact_Tie_Policy_Prompt.md
?? docs/audits/Hale_Stage_3D_D_Near_Tie_Meaningful_Change_Prompt.md
?? docs/audits/Hale_Stage_3D_Norm_Claims_Audit_Prompt.md
?? docs/audits/Hale_Stage_4_Exercise_Catalogue_Audit_Prompt.md
?? src/checkup/retry.ts
?? src/haleFlow/__tests__/checkupHistory.test.ts
?? src/haleFlow/assessmentEvidence.ts
?? src/haleFlow/checkupHistory.ts
?? src/scoring/__tests__/focusSelection.test.ts
?? src/scoring/__tests__/scoreSnapshot.test.ts
?? src/scoring/focusSelection.ts
?? src/scoring/scoreSnapshot.ts
?? src/scoring/versions.ts

### git diff --name-only
AGENTS.md
App.tsx
CLAUDE.md
app.json
assets/images/hale-home-hero-premium.png
docs/decisions.md
modules/expo-pose-detection/android/src/main/java/expo/modules/posedetection/PoseDetectionView.kt
modules/expo-pose-detection/ios/PoseDetectionView.swift
scripts/skeleton-preview.ts
src/adherence/__tests__/adherence.test.ts
src/adherence/__tests__/blockServiceEligibility.test.ts
src/adherence/adherenceCopy.ts
src/adherence/blockService.ts
src/adherence/components/CurrentBlockCard.tsx
src/adherence/components/LifeGoalSelector.tsx
src/adherence/milestoneService.ts
src/adherence/screens/BlockIntroScreen.tsx
src/adherence/screens/BlockReportScreen.tsx
src/adherence/screens/RestartSessionScreen.tsx
src/adherence/screens/SessionCompletionScreen.tsx
src/adherence/screens/SupportCircleScreen.tsx
src/adherence/screens/WeeklySummaryScreen.tsx
src/adherence/types.ts
src/checkup/index.ts
src/components/AccountAuthCard.tsx
src/components/ui.tsx
src/family/fixture.ts
src/haleFlow/__tests__/appLifecycle.test.ts
src/haleFlow/__tests__/assessmentEligibility.test.ts
src/haleFlow/__tests__/copyGuardrails.test.ts
src/haleFlow/__tests__/exploreViewModel.test.ts
src/haleFlow/__tests__/haleFlow.test.ts
src/haleFlow/__tests__/progressViewModel.test.ts
src/haleFlow/__tests__/sessionPlanning.test.ts
src/haleFlow/appLifecycle.ts
src/haleFlow/assessmentEligibility.ts
src/haleFlow/assessmentResultState.ts
src/haleFlow/assessments.ts
src/haleFlow/copy.ts
src/haleFlow/exploreViewModel.ts
src/haleFlow/index.ts
src/haleFlow/planViewModel.ts
src/haleFlow/progressViewModel.ts
src/haleFlow/reports.ts
src/haleFlow/types.ts
src/history/__tests__/history.test.ts
src/history/index.ts
src/history/serialize.ts
src/history/store.ts
src/learn/articles.ts
src/navigation/TabBar.tsx
src/navigation/__tests__/TabBar.test.ts
src/navigation/icons.tsx
src/onboarding/__tests__/onboarding.test.ts
src/onboarding/state.ts
src/preflight/PreflightBanner.tsx
src/preflight/SetupHelpPanel.tsx
src/scoring/index.ts
src/screens/ArticleScreen.tsx
src/screens/AssessmentScreen.tsx
src/screens/AuthScreen.tsx
src/screens/CheckUpScreen.tsx
src/screens/ExploreDetailScreens.tsx
src/screens/ExploreScreen.tsx
src/screens/FamilyScreen.tsx
src/screens/HomeScreen.tsx
src/screens/LearnScreen.tsx
src/screens/ManualCheckupStartScreen.tsx
src/screens/MicroCheckScreen.tsx
src/screens/OnboardingBlockScreen.tsx
src/screens/OnboardingResultsScreen.tsx
src/screens/PlanScreen.tsx
src/screens/ProgressScreen.tsx
src/screens/ResultsScreen.tsx
src/screens/SessionPreviewScreen.tsx
src/screens/SettingsScreen.tsx
src/screens/TodayScreen.tsx
src/screens/TrainingSessionScreen.tsx
src/screens/WelcomeScreen.tsx
src/services/backend/__tests__/blockReportSyncService.test.ts
src/services/backend/__tests__/checkupSyncService.test.ts
src/services/backend/__tests__/restoreService.test.ts
src/services/backend/blockReportSyncService.ts
src/services/backend/checkupSyncService.ts
src/services/backend/microCheckSyncService.ts
src/services/backend/restoreService.ts
src/theme/index.ts

### git diff --stat
 AGENTS.md                                          |    4 +-
 App.tsx                                            |  255 +++--
 CLAUDE.md                                          |    2 +-
 app.json                                           |    6 +-
 assets/images/hale-home-hero-premium.png           |  Bin 1753564 -> 1880702 bytes
 docs/decisions.md                                  |   75 ++
 .../modules/posedetection/PoseDetectionView.kt     |    4 +-
 .../ios/PoseDetectionView.swift                    |    4 +-
 scripts/skeleton-preview.ts                        |    4 +-
 src/adherence/__tests__/adherence.test.ts          |   36 +-
 .../__tests__/blockServiceEligibility.test.ts      |  130 ++-
 src/adherence/adherenceCopy.ts                     |   32 +-
 src/adherence/blockService.ts                      |   34 +-
 src/adherence/components/CurrentBlockCard.tsx      |   10 +-
 src/adherence/components/LifeGoalSelector.tsx      |    2 +-
 src/adherence/milestoneService.ts                  |   22 +-
 src/adherence/screens/BlockIntroScreen.tsx         |    4 +-
 src/adherence/screens/BlockReportScreen.tsx        |   93 +-
 src/adherence/screens/RestartSessionScreen.tsx     |    4 +-
 src/adherence/screens/SessionCompletionScreen.tsx  |    4 +-
 src/adherence/screens/SupportCircleScreen.tsx      |    4 +-
 src/adherence/screens/WeeklySummaryScreen.tsx      |    4 +-
 src/adherence/types.ts                             |   40 +-
 src/checkup/index.ts                               |    1 +
 src/components/AccountAuthCard.tsx                 |   11 +-
 src/components/ui.tsx                              |   57 +-
 src/family/fixture.ts                              |    2 +-
 src/haleFlow/__tests__/appLifecycle.test.ts        |   84 +-
 .../__tests__/assessmentEligibility.test.ts        |  419 +++++++-
 src/haleFlow/__tests__/copyGuardrails.test.ts      |   56 +-
 src/haleFlow/__tests__/exploreViewModel.test.ts    |   35 +-
 src/haleFlow/__tests__/haleFlow.test.ts            |   32 +-
 src/haleFlow/__tests__/progressViewModel.test.ts   |  327 +++++-
 src/haleFlow/__tests__/sessionPlanning.test.ts     |   14 +-
 src/haleFlow/appLifecycle.ts                       |   41 +-
 src/haleFlow/assessmentEligibility.ts              |  267 ++++-
 src/haleFlow/assessmentResultState.ts              |   48 +-
 src/haleFlow/assessments.ts                        |  119 ++-
 src/haleFlow/copy.ts                               |   18 +-
 src/haleFlow/exploreViewModel.ts                   |  233 ++++-
 src/haleFlow/index.ts                              |    2 +
 src/haleFlow/planViewModel.ts                      |    6 +-
 src/haleFlow/progressViewModel.ts                  |  202 ++--
 src/haleFlow/reports.ts                            |   75 +-
 src/haleFlow/types.ts                              |    3 +-
 src/history/__tests__/history.test.ts              |   90 +-
 src/history/index.ts                               |    2 +-
 src/history/serialize.ts                           |  100 +-
 src/history/store.ts                               |    6 +-
 src/learn/articles.ts                              |   15 +-
 src/navigation/TabBar.tsx                          |   83 +-
 src/navigation/__tests__/TabBar.test.ts            |    9 +-
 src/navigation/icons.tsx                           |   20 +-
 src/onboarding/__tests__/onboarding.test.ts        |   59 +-
 src/onboarding/state.ts                            |    8 +-
 src/preflight/PreflightBanner.tsx                  |    6 +-
 src/preflight/SetupHelpPanel.tsx                   |    8 +-
 src/scoring/index.ts                               |   46 +
 src/screens/ArticleScreen.tsx                      |   10 +-
 src/screens/AssessmentScreen.tsx                   |    4 +-
 src/screens/AuthScreen.tsx                         |   11 +-
 src/screens/CheckUpScreen.tsx                      |   15 +-
 src/screens/ExploreDetailScreens.tsx               |   19 +-
 src/screens/ExploreScreen.tsx                      | 1106 ++++++++++++++++----
 src/screens/FamilyScreen.tsx                       |   12 +-
 src/screens/HomeScreen.tsx                         |   71 +-
 src/screens/LearnScreen.tsx                        |   14 +-
 src/screens/ManualCheckupStartScreen.tsx           |    4 +-
 src/screens/MicroCheckScreen.tsx                   |    4 +-
 src/screens/OnboardingBlockScreen.tsx              |    2 +-
 src/screens/OnboardingResultsScreen.tsx            |   90 +-
 src/screens/PlanScreen.tsx                         |  760 ++++++++++----
 src/screens/ProgressScreen.tsx                     |  806 ++++++++++++--
 src/screens/ResultsScreen.tsx                      |  169 ++-
 src/screens/SessionPreviewScreen.tsx               |   21 +-
 src/screens/SettingsScreen.tsx                     |  407 ++++---
 src/screens/TodayScreen.tsx                        |  655 +++++++-----
 src/screens/TrainingSessionScreen.tsx              |    6 +-
 src/screens/WelcomeScreen.tsx                      |   20 +-
 .../__tests__/blockReportSyncService.test.ts       |    8 +-
 .../backend/__tests__/checkupSyncService.test.ts   |  159 +++
 .../backend/__tests__/restoreService.test.ts       |  206 +++-
 src/services/backend/blockReportSyncService.ts     |    6 +
 src/services/backend/checkupSyncService.ts         |   70 +-
 src/services/backend/microCheckSyncService.ts      |    5 +
 src/services/backend/restoreService.ts             |   92 +-
 src/theme/index.ts                                 |   85 +-
 87 files changed, 6347 insertions(+), 1767 deletions(-)
```
