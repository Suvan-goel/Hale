# Hale Logic Remediation Stage 4F-R.1

Date: 2026-06-22

## 1. Scope

Stage 4F-R.1 implemented the production-code remediation for progression-model enforcement, explicit movement-specific transition policy, conservative controlled-beta auto-progression ceilings, non-linear ladder containment, and F4R-008 software/content closure.

Out of scope and unchanged: Stage 4G-R presentation/rotation work, Stage 3D-B physical-device validation, store release work, exercise IDs, scoring, norms, Check-Up logic, safety cue text/audio generation, package installation, lockfiles, staging, commits, branches, and pushes.

## 2. Initial Git Status

Initial status captured at this continuation start before validation and before this report was added:

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
?? docs/audits/HALE_POSE_OVERLAY_LATENCY_AUDIT.md
?? docs/audits/Hale_Stage_4F_R_1_Progression_Model_Enforcement_Prompt.md
?? scripts/pose-renderer-replay.ts
?? src/diagnostics/PoseLatencyDiagnosticsOverlay.tsx
?? src/diagnostics/__tests__/poseLatencyDiagnostics.test.ts
?? src/diagnostics/poseLatencyDiagnostics.ts
?? src/diagnostics/poseRendererReplay.ts
?? src/exercises/__tests__/progressionPolicy.test.ts
?? src/exercises/progressionPolicy.ts
```

Initial `git diff --name-only`:

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

Initial `git diff --stat`:

```text
 App.tsx                                            |  20 ++
 .../posedetection/ExpoPoseDetectionModule.kt       |   3 +
 .../modules/posedetection/PoseDetectionView.kt     |  72 ++++++-
 .../ios/ExpoPoseDetectionModule.swift              |   3 +
 .../ios/PoseDetectionView.swift                    |  57 +++++-
 .../src/ExpoPoseDetection.types.ts                 |  18 ++
 .../expo-pose-detection/src/PoseDetectionView.tsx  |   1 +
 package.json                                       |   3 +-
 src/exercises/__tests__/catalog.test.ts            |  13 +-
 src/exercises/index.ts                             |  35 +++-
 src/exercises/ladders.ts                           |   6 +-
 src/haleFlow/__tests__/exploreViewModel.test.ts    |  52 ++++-
 src/haleFlow/__tests__/progressionEvidence.test.ts |  71 ++++++-
 src/haleFlow/__tests__/sessionPlanning.test.ts     | 123 +++++++----
 src/haleFlow/exploreViewModel.ts                   |  37 +++-
 src/haleFlow/progressionEvidence.ts                | 106 +++++++++-
 src/haleFlow/sessionPlanning.ts                    | 220 +++++++++++++++++++-
 src/haleFlow/types.ts                              |   9 +
 src/render/ClassicPoseRenderer.tsx                 |   2 +-
 src/render/ConstellationPoseRenderer.tsx           |   2 +-
 src/render/PointCloudBodyPoseRenderer.tsx          |  12 +-
 src/screens/CheckUpScreen.tsx                      |  20 +-
 src/screens/LiveSessionScreen.tsx                  |  19 +-
 src/screens/MicroCheckScreen.tsx                   |  20 +-
 src/screens/TrainingSessionScreen.tsx              |  20 +-
 .../backend/__tests__/restoreService.test.ts       |   6 +-
 src/services/backend/trainingStateSyncService.ts   |   4 +
 src/training/__tests__/workoutGeneration.test.ts   | 140 +++++++++----
 src/training/dailyTrainingContext.ts               |   5 +-
 src/training/dynamicState.ts                       |   9 +
 src/training/serialize.ts                          |  66 ++++++
 src/training/workoutGeneration.ts                  | 226 ++++++++++++++++++---
 website/app/layout.tsx                             |  12 +-
 website/app/page.tsx                               |   2 +-
 website/src/components/ConsentBanner.tsx           |   2 +-
 website/src/components/LandingPage.tsx             |  48 ++---
 website/src/components/SiteFooter.tsx              |   4 +-
 website/src/config/site.ts                         |   2 +-
 website/src/content/landing.ts                     |  68 +++----
 website/tests/e2e/landing.spec.ts                  |   4 +-
 40 files changed, 1297 insertions(+), 245 deletions(-)
```

## 3. Findings Addressed

- F4F-001: `progressionModel` is now enforced as a mutation contract. Linear ladders require explicit transition policy. Supporting sets and collections do not mutate adjacent members.
- F4F-002: Generic easy evidence is no longer sufficient for safety-sensitive transitions. Blocked transitions record stable reasons such as domain review, device validation, manual-only, or non-linear model.
- F4F-003: Mixed ladders were contained. Heel/toe raise, upper-pull, and hinge/glutes were reclassified to `supporting_set`.
- F4F-004: Release visibility remains separate from automatic reachability. Core levels can remain manually practiceable while not being auto-reachable.
- F4F-005: Tests now prove movement-specific transition correctness, blocked transitions, non-linear containment, policy fingerprints, and restore/planning behavior.
- F4F-006: Assessment-to-training calibration gaps were handled conservatively by blocking or capping transitions until domain/device evidence exists.

## 4. Finding Deferred

F4F-007 remains deferred. Physical-device validation is still required for beta release and for future relaxation of blocked transitions involving balance, step-up safety, floor work, band/door-anchor setup, incline height, support independence, and camera-assisted transition reliability.

## 5. Prior Progression Architecture

Before this remediation, catalogue order and generic easy-exposure thresholds could act as progression authority. That allowed adjacent movement-family changes in ladders that were descriptive, not safe difficulty sequences.

## 6. Approved Controlled-Beta Policy

Current catalogue and policy counts:

- 37 registered levels.
- 11 registered ladders.
- 30 `v1_core` levels.
- 7 `v1_optional` levels, all still hidden from controlled beta.
- 5 `linear_progression` ladders.
- 5 `supporting_set` ladders.
- 1 `collection` ladder.
- 11 controlled-beta progression policies.
- 37 policy-covered levels.
- 2 allowed automatic forward transitions.
- 2 allowed automatic regressions.
- 48 explicitly blocked transitions.

## 7. Canonical Transition-Policy Architecture

`src/exercises/progressionPolicy.ts` is the canonical pure policy module. It provides:

- schema version `1`;
- deterministic compact policy fingerprint;
- per-ladder policy registry;
- explicit transition lookup;
- transition evidence keys scoped to policy/from/to/direction/status/requirements;
- effective current level resolution for controlled beta;
- compact planned progression-policy snapshots;
- start-time snapshot validation helpers.

The policy depends on the existing Stage 4E-R release policy rather than duplicating release visibility.

## 8. Complete Per-Ladder Policy Table

| Ladder | Model | Default auto selection | Auto ceiling | Allowed auto forward | Allowed auto regression | Blocked/held examples |
| --- | --- | --- | --- | --- | --- | --- |
| sit-to-stand | linear_progression | `sts-standard` | `sts-standard` | `sts-cushion -> sts-standard` | `sts-standard -> sts-cushion` | standard->slow, slow->power, loaded |
| squat | linear_progression | `squat-supported` | `squat-supported` | none | none | supported->free, slow, loaded, split |
| step-up | linear single-level maintenance | `step-up` | `step-up` | none | none | no level mutation |
| heel-toe-raise | supporting_set | `heel-raise-supported` | `heel-raise-supported` | none | none | heel-free, toe-raise adjacency |
| push | linear_progression | `push-up-wall` | `push-up-wall` | none | none | wall->incline, floor |
| pull-upper-back | supporting_set | `seated-band-row` | `seated-band-row` | none | none | standing row, pull-apart adjacency |
| hinge-glutes | supporting_set | `hip-hinge-wall` | `hip-hinge-wall` | none | none | free hinge, bridge hold, bridge reps adjacency |
| shoulder-reach-press | supporting_set | `overhead-reach` | `overhead-reach` | none | none | reach->band press |
| balance | linear_progression | `balance-feet-together-hold` | `balance-tandem-hold` | `feet-together -> tandem` with strong valid-time evidence | `tandem -> feet-together` | tandem->single-leg |
| lateral-stability | supporting_set | `supported-side-step` | `supported-side-step` | none | none | mini-band hidden, march adjacency |
| mobility-flexibility | collection | `seated-hamstring-reach` | `seated-hamstring-reach` | none | none | all mobility item adjacency, neck hidden |

## 9. Model Reclassification

Reclassified to `supporting_set`:

- `heel-toe-raise`
- `pull-upper-back`
- `hinge-glutes`

Kept as `supporting_set`:

- `shoulder-reach-press`
- `lateral-stability`

Kept as `collection`:

- `mobility-flexibility`

No level IDs, release statuses, safety cue profiles, or audio mappings were changed.

## 10. Transition-Scoped Evidence

`LadderProgress` now carries transition evidence metadata:

- `transitionEvidenceKey`
- `progressionPolicyFingerprint`
- `lastProgressionDecisionReason`

Positive readiness only accumulates for the same ladder, same `fromLevelId`, same explicit transition policy, same current policy fingerprint, normal progression policy, and eligible evidence. Hold-only, non-linear, blocked, stale-policy, pain, tracking, reset, or invalid evidence cannot leak into a future transition.

## 11. Sit-to-Stand Behavior

Two normal easy credited `sts-cushion` exposures can progress to `sts-standard`. `sts-standard -> sts-slow-eccentric` and `sts-slow-eccentric -> sts-power` hold pending domain/device validation. Historical slow/power/loaded states are preserved in storage while current generated planning caps to `sts-standard`.

## 12. Squat Behavior

No automatic squat forward transition is allowed. `squat-supported` is the controlled-beta default and auto ceiling. Historical higher squat state remains readable and preserved, while generated planning uses the conservative effective level.

## 13. Step-Up Behavior

`step-up` remains a single-level maintenance ladder with no forward/backward mutation. Existing Stage 4C-R environment, equipment, capability, daily context, and template gates remain authoritative.

## 14. Heel/Toe Behavior

Heel/toe raise is contained as a `supporting_set`. `heel-raise-supported`, `heel-raise-free`, and `toe-raise-supported` are not ranked as automatic difficulty steps. Evidence on one member cannot mutate or regress another member.

## 15. Push Behavior

`push-up-wall` is the controlled-beta default and auto ceiling. `push-up-wall -> push-up-incline` is blocked pending device validation of surface height/load/stability. Historical incline/floor state is preserved but not used as current auto authority.

## 16. Upper-Pull Behavior

Upper-pull is contained as a `supporting_set`. `seated-band-row`, `standing-band-row`, and `band-pull-apart` are explicit members, not automatic ranks. Door-anchor/band members can only be selected through explicit template/manual logic and existing gates.

## 17. Hinge/Glutes Behavior

Hinge/glutes is contained as a `supporting_set`. Wall hinge, free hinge, bridge hold, and bridge reps do not auto-progress or auto-regress across movement families. Floor bridge remains governed by floor-space/floor-transfer/daily-context/release/safety gates when explicitly selected.

## 18. Shoulder Reach/Press Behavior

Shoulder reach/press remains a `supporting_set`. `overhead-press-band` is not inferred as progress from `overhead-reach`. Band press remains explicit cross-domain supporting work only.

## 19. Static-Balance Behavior

Balance remains linear. `balance-feet-together-hold -> balance-tandem-hold` requires two normal credited exposures with strong valid-time evidence and no pain, resets, incomplete result, poor tracking, or uncertain tracking. `balance-tandem-hold -> balance-single-leg-hold` is blocked pending domain/device validation. Safe regression to feet-together remains allowed.

## 20. Lateral-Stability Behavior

Lateral stability remains a `supporting_set`. Supported side step, hidden mini-band lateral walk, and March in Place do not automatically mutate through adjacency. March can only be reached through explicit selection/template logic under current gates.

## 21. Mobility Behavior

Mobility/flexibility remains a `collection`. Hamstring reach, thoracic rotation, hip-flexor stretch, calf stretch, and hidden neck rotation are variety/coverage items, not automatic difficulty ranks. Collection evidence never mutates `currentLevelId`.

## 22. Effective-Level Resolution

Generated current planning uses `effectiveLevelIdForControlledBetaProgression(...)`:

1. validate ladder and stored level;
2. apply controlled-beta release availability;
3. apply movement-specific automatic progression ceiling/default;
4. apply daily readiness regression where applicable;
5. continue through equipment/capability/discomfort and session generation.

Stored historical levels are preserved. Planning derives a conservative current effective level and records diagnostics such as `release_cap_applied`, `auto_progression_cap_applied`, `legacy_progression_policy_capped`, `non_linear_default_selected`, and `daily_regression_applied`.

## 23. Progression Evidence/Application

Progression evidence now carries policy schema/fingerprint and `fromLevelId`. Application fails closed for stale/unsupported policy identity, blocked transitions, non-linear models, hold-only evidence, and duplicates. Duplicate event IDs remain idempotent and old applied event IDs remain applied.

## 24. Policy Snapshot/Start Validation

New generated plans include compact progression-policy snapshots with schema, policy fingerprint, snapshot fingerprint, and deterministic per-exercise entries. Start-time validation now rejects missing, unsupported, stale, inconsistent, non-linear-invalid, or above-ceiling progression policy snapshots before player launch. Recovery copy keeps the user-facing message calm and non-shaming.

## 25. Restore/Migration

Restore preserves historical `currentLevelId`, applied event IDs, and readable historical completions. It does not replay evidence or rewrite old state on read. Current planning re-derives effective controlled-beta levels from the canonical policy.

## 26. Explore/Manual/Copy Truthfulness

Explore uses effective current auto-progression levels for linear ladders and does not show false harder/easier ordering for supporting-set or collection members. Manual practice remains non-main-plan, non-schedule-credit, and progression-ineligible. Copy remains maintenance/hold oriented when no level changed.

## 27. Main-Plan/Schedule-Credit Behavior

Held or capped levels can still earn valid main-plan and schedule credit. Progression level mutation remains separate from Stage 5A/5B main-plan credit and Stage 5G schedule credit.

## 28. Safety-Audio/Optional-Level Non-Regression

`npm run verify:audio` passed:

```text
AUDIO VERIFICATION PASS requiredCues=44 voices=clara,marcus requiredAssets=88 totalBytes=4637324 durationRange=1.858-5.155s
```

No audio was regenerated. No provider call was made. No `.env` contents or provider secrets were inspected, copied, printed, or committed. All 7 optional levels remain `v1_optional` and hidden from controlled-beta automatic reachability.

## 29. Files Changed

Task-owned production/test/report files:

- `App.tsx`
- `src/exercises/index.ts`
- `src/exercises/ladders.ts`
- `src/exercises/progressionPolicy.ts`
- `src/exercises/__tests__/catalog.test.ts`
- `src/exercises/__tests__/progressionPolicy.test.ts`
- `src/haleFlow/exploreViewModel.ts`
- `src/haleFlow/progressionEvidence.ts`
- `src/haleFlow/sessionPlanning.ts`
- `src/haleFlow/types.ts`
- `src/haleFlow/__tests__/exploreViewModel.test.ts`
- `src/haleFlow/__tests__/progressionEvidence.test.ts`
- `src/haleFlow/__tests__/sessionPlanning.test.ts`
- `src/services/backend/trainingStateSyncService.ts`
- `src/services/backend/__tests__/restoreService.test.ts`
- `src/training/dailyTrainingContext.ts`
- `src/training/dynamicState.ts`
- `src/training/serialize.ts`
- `src/training/workoutGeneration.ts`
- `src/training/__tests__/workoutGeneration.test.ts`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4F_R_1.md`

## 30. Tests Added/Changed

Added:

- `src/exercises/__tests__/progressionPolicy.test.ts`

Changed:

- `src/exercises/__tests__/catalog.test.ts`
- `src/training/__tests__/workoutGeneration.test.ts`
- `src/haleFlow/__tests__/exploreViewModel.test.ts`
- `src/haleFlow/__tests__/progressionEvidence.test.ts`
- `src/haleFlow/__tests__/sessionPlanning.test.ts`
- `src/services/backend/__tests__/restoreService.test.ts`

## 31. Exact Validation Results

Targeted command:

```bash
npm test -- --runInBand src/exercises/__tests__/catalog.test.ts src/exercises/__tests__/progressionPolicy.test.ts src/exercises/__tests__/releasePolicy.test.ts src/training/__tests__/workoutGeneration.test.ts src/training/__tests__/validTimeProgression.test.ts src/training/__tests__/dailyTrainingContext.test.ts src/training/__tests__/store.test.ts src/training/__tests__/safetyCues.test.ts src/training/__tests__/sessionPlayer.test.ts src/audio/__tests__/safetyAudio.test.ts src/audio/__tests__/voicePlayer.test.ts src/haleFlow/__tests__/progressionEvidence.test.ts src/haleFlow/__tests__/sessionPlanning.test.ts src/haleFlow/__tests__/exploreViewModel.test.ts src/haleFlow/__tests__/progressViewModel.test.ts src/haleFlow/__tests__/mainPlanEvents.test.ts src/haleFlow/__tests__/blockSchedule.test.ts src/haleFlow/__tests__/focusStimulusEvidence.test.ts src/haleFlow/__tests__/stage5g1ScheduleVerification.test.ts src/haleFlow/__tests__/stage5hLifecycle.integration.test.ts src/services/backend/__tests__/trainingStateSyncService.test.ts src/services/backend/__tests__/restoreService.test.ts src/profile/__tests__/movementCapabilities.test.ts src/profile/__tests__/equipment.test.ts
```

Result: 24 suites passed, 304 tests passed, 0 snapshots, 7.038 s.

Audio:

```bash
npm run verify:audio
```

Result: pass, 44 cues, voices `clara,marcus`, 88 required assets, 4,637,324 total bytes, 1.858-5.155 s duration range.

Full suite:

```bash
npm test -- --runInBand
```

Result: 103 suites passed, 844 tests passed, 0 snapshots, 15.328 s.

App typecheck:

```bash
npm run typecheck
```

Result: pass.

Website typecheck:

```bash
npm --prefix website run typecheck
```

Result: pass.

Expo config:

```bash
npx --no-install expo config --type public
```

Result: pass. Expo printed `.env` variable names only, not values. Sentry warning observed: missing organization/project config, environment variables used as fallback.

Diff check:

```bash
git diff --check
```

Result: pass with no output.

Expo export:

```bash
rm -rf /tmp/hale-stage4fr1-export
npx --no-install expo export --platform all --output-dir /tmp/hale-stage4fr1-export
rc=$?
rm -rf /tmp/hale-stage4fr1-export
exit $rc
```

Result: pass. iOS and Android bundles exported, 380 assets listed, temp export directory removed. Sentry warning observed again. Node warning observed: `NO_COLOR` ignored because `FORCE_COLOR` is set.

Warnings/notices recorded:

- Watchman recrawl warning during Jest runs.
- Jest open-handle notice after targeted and full Jest runs.
- Backend sync tests intentionally logged success/warning scenarios.
- Sentry config warning during Expo config/export.
- `NO_COLOR`/`FORCE_COLOR` warning during Expo export.

Validation did not change tracked Git status.

## 32. Stage 4A-4E-R and Stage 5 Regression Verification

Stage 4C-R, 4D-R, 4D-R.1, 4E-R, and Stage 5 protections were included through the targeted suite, full Jest suite, safety-audio verification, app typecheck, website typecheck, Expo config, Expo export, and `git diff --check`.

Covered paths included catalogue/release/policy integrity, safetyAudio, voicePlayer, safetyCues, sessionPlayer, valid-time progression, session planning/start validation, Explore/manual behavior, backend restore/sync, Stage 5G schedule verification, and Stage 5H lifecycle.

## 33. F4R-008 Status

F4R-008 is closed for controlled beta in software/content. Risky automatic transitions are now explicitly blocked or safely gated, and no P0/P1 progression-content defect remains in the controlled-beta automatic progression path.

## 34. Remaining Stage 4 Findings

Remaining work is outside Stage 4F-R.1:

- Stage 4G-R is still required for mobility presentation/rotation and minimal-equipment positioning.
- Stage 3D-B is still required.
- Physical-device validation remains required before overall beta release.
- Overall beta release remains blocked.

## 35. Stage 4G-R Unblocked

Stage 4G-R is unblocked because no P0/P1 progression-content blocker remains after the controlled-beta containment implemented here.

## 36. Core Progression Controlled-Beta Readiness

Core progression is software/content-ready for controlled beta. This does not declare overall beta readiness because physical-device validation and later stage work remain required.

## 37. Initial and Final Git Status

Final status confirmed after adding this report:

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
?? docs/audits/Hale_Stage_4F_R_1_Progression_Model_Enforcement_Prompt.md
?? scripts/pose-renderer-replay.ts
?? src/diagnostics/PoseLatencyDiagnosticsOverlay.tsx
?? src/diagnostics/__tests__/poseLatencyDiagnostics.test.ts
?? src/diagnostics/poseLatencyDiagnostics.ts
?? src/diagnostics/poseRendererReplay.ts
?? src/exercises/__tests__/progressionPolicy.test.ts
?? src/exercises/progressionPolicy.ts
```

## 38. Complete Files-Changed Inventory

Tracked modified files:

- `App.tsx`
- `modules/expo-pose-detection/android/src/main/java/expo/modules/posedetection/ExpoPoseDetectionModule.kt`
- `modules/expo-pose-detection/android/src/main/java/expo/modules/posedetection/PoseDetectionView.kt`
- `modules/expo-pose-detection/ios/ExpoPoseDetectionModule.swift`
- `modules/expo-pose-detection/ios/PoseDetectionView.swift`
- `modules/expo-pose-detection/src/ExpoPoseDetection.types.ts`
- `modules/expo-pose-detection/src/PoseDetectionView.tsx`
- `package.json`
- `src/exercises/__tests__/catalog.test.ts`
- `src/exercises/index.ts`
- `src/exercises/ladders.ts`
- `src/haleFlow/__tests__/exploreViewModel.test.ts`
- `src/haleFlow/__tests__/progressionEvidence.test.ts`
- `src/haleFlow/__tests__/sessionPlanning.test.ts`
- `src/haleFlow/exploreViewModel.ts`
- `src/haleFlow/progressionEvidence.ts`
- `src/haleFlow/sessionPlanning.ts`
- `src/haleFlow/types.ts`
- `src/render/ClassicPoseRenderer.tsx`
- `src/render/ConstellationPoseRenderer.tsx`
- `src/render/PointCloudBodyPoseRenderer.tsx`
- `src/screens/CheckUpScreen.tsx`
- `src/screens/LiveSessionScreen.tsx`
- `src/screens/MicroCheckScreen.tsx`
- `src/screens/TrainingSessionScreen.tsx`
- `src/services/backend/__tests__/restoreService.test.ts`
- `src/services/backend/trainingStateSyncService.ts`
- `src/training/__tests__/workoutGeneration.test.ts`
- `src/training/dailyTrainingContext.ts`
- `src/training/dynamicState.ts`
- `src/training/serialize.ts`
- `src/training/workoutGeneration.ts`
- `website/app/layout.tsx`
- `website/app/page.tsx`
- `website/src/components/ConsentBanner.tsx`
- `website/src/components/LandingPage.tsx`
- `website/src/components/SiteFooter.tsx`
- `website/src/config/site.ts`
- `website/src/content/landing.ts`
- `website/tests/e2e/landing.spec.ts`

Untracked files:

- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4F_R_1.md`
- `docs/audits/HALE_POSE_OVERLAY_LATENCY_AUDIT.md`
- `docs/audits/Hale_Stage_4F_R_1_Progression_Model_Enforcement_Prompt.md`
- `scripts/pose-renderer-replay.ts`
- `src/diagnostics/PoseLatencyDiagnosticsOverlay.tsx`
- `src/diagnostics/__tests__/poseLatencyDiagnostics.test.ts`
- `src/diagnostics/poseLatencyDiagnostics.ts`
- `src/diagnostics/poseRendererReplay.ts`
- `src/exercises/__tests__/progressionPolicy.test.ts`
- `src/exercises/progressionPolicy.ts`

## 39. Concurrent External Changes

Concurrent/external changes observed and preserved:

- Pose detection native/module files under `modules/expo-pose-detection/`.
- Pose renderer files under `src/render/`.
- Screen files under `src/screens/`.
- Website files under `website/`.
- `package.json` modification.
- Pose latency diagnostics files under `src/diagnostics/`.
- `scripts/pose-renderer-replay.ts`.
- `docs/audits/HALE_POSE_OVERLAY_LATENCY_AUDIT.md`.
- The untracked Stage 4F-R.1 prompt file.

These were not reverted, reformatted, staged, committed, branched, or pushed.

## 40. Confirmation

No package install occurred. No lockfile changed. No audio regeneration occurred. No TTS/provider call occurred. No `.env` contents or provider secrets were exposed. No staging, commit, branch creation, or push occurred.

STAGE 4F-R.1 COMPLETE

F4R-008 CLOSED FOR CONTROLLED BETA

CORE PROGRESSION SOFTWARE/CONTENT-READY FOR CONTROLLED BETA

STAGE 4G-R UNBLOCKED

STAGE 4G-R REQUIRED

STAGE 4 REMEDIATION STILL REQUIRED

STAGE 5 REMEDIATION COMPLETE

DYNAMIC WORKOUT GENERATION SOFTWARE-READY FOR CONTROLLED BETA

OVERALL BETA RELEASE STILL BLOCKED

STAGE 3D-B REQUIRED

BETA DEVICE VALIDATION REQUIRED
