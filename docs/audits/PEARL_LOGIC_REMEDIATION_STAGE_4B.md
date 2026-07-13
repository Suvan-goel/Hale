# Pearl Logic Remediation - Stage 4B

Date: 2026-06-20

## 1. Scope

Stage 4B addressed domain/stimulus semantics after the Stage 4A safety-gating pass. The work was limited to exercise metadata, generated-session stimulus classification, upper-pull equipment semantics, no-equipment transparency, Explore/manual practice consistency, and focused tests.

This stage did not change scoring formulas, norm tables, score snapshots, Check-Up measurement, camera readiness, officialness/manual isolation, Stage 3D focus semantics, backend schema, dependencies, assets, staging, commits, branches, or pushes.

## 2. Initial Git Status

Captured before editing.

`git status --short --untracked-files=all`

```text
 M src/adherence/types.ts
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
 M src/pearlFlow/__tests__/exploreViewModel.test.ts
 M src/pearlFlow/__tests__/sessionPlanning.test.ts
 M src/pearlFlow/exploreViewModel.ts
 M src/pearlFlow/sessionPlanning.ts
 M src/movements/types.ts
 M src/profile/serialize.ts
 M src/screens/ExploreScreen.tsx
 M src/screens/OnboardingEquipmentScreen.tsx
 M src/screens/PlanScreen.tsx
 M src/screens/SettingsScreen.tsx
 M src/training/__tests__/workoutGeneration.test.ts
 M src/training/workoutGeneration.ts
?? assets/pearl-logo-icon-groove-connected.png
?? assets/pearl-logo-icon-groove.png
?? assets/pearl-logo-icon.png
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
?? docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4A.md
?? docs/audits/Pearl_Stage_4A_Catalogue_Safety_Gating_Prompt.md
?? docs/audits/Pearl_Stage_4B_Stimulus_Domain_Progression_Prompt.md
?? src/pearlFlow/extraSessionCopy.ts
?? src/training/equipmentSafety.ts
?? tmp/logo/pearl-flat-traced-candidate.png
?? tmp/logo/pearl-flat-traced-smooth-hires.png
?? tmp/logo/pearl-flat-traced-smoothed.png
```

`git diff --name-only`

```text
src/adherence/types.ts
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
src/pearlFlow/__tests__/exploreViewModel.test.ts
src/pearlFlow/__tests__/sessionPlanning.test.ts
src/pearlFlow/exploreViewModel.ts
src/pearlFlow/sessionPlanning.ts
src/movements/types.ts
src/profile/serialize.ts
src/screens/ExploreScreen.tsx
src/screens/OnboardingEquipmentScreen.tsx
src/screens/PlanScreen.tsx
src/screens/SettingsScreen.tsx
src/training/__tests__/workoutGeneration.test.ts
src/training/workoutGeneration.ts
```

`git diff --stat`

```text
 src/adherence/types.ts                           |   1 +
 src/exercises/__tests__/catalog.test.ts          |  43 +++
 src/exercises/balanceRung.ts                     |   8 +-
 src/exercises/heelRaise.ts                       |   4 +-
 src/exercises/ladders.ts                         |  24 +-
 src/exercises/loadedMarch.ts                     |  10 +-
 src/exercises/mobilityDrills.ts                  |   2 +-
 src/exercises/pullUpperBack.ts                   |   2 +-
 src/exercises/pushUp.ts                          |   2 +-
 src/exercises/stepUp.ts                          |  10 +-
 src/exercises/supportedSquat.ts                  |   4 +-
 src/pearlFlow/__tests__/exploreViewModel.test.ts  |  65 ++++
 src/pearlFlow/__tests__/sessionPlanning.test.ts   |  95 ++++-
 src/pearlFlow/exploreViewModel.ts                 | 113 ++++--
 src/pearlFlow/sessionPlanning.ts                  |  47 ++-
 src/movements/types.ts                           |   7 +-
 src/profile/serialize.ts                         |   1 +
 src/screens/ExploreScreen.tsx                    | 456 ++++++++++++++++++-----
 src/screens/OnboardingEquipmentScreen.tsx        |   3 +
 src/screens/PlanScreen.tsx                       |  12 +-
 src/screens/SettingsScreen.tsx                   |   5 +
 src/training/__tests__/workoutGeneration.test.ts |  94 ++++-
 src/training/workoutGeneration.ts                |  99 +++--
 23 files changed, 886 insertions(+), 221 deletions(-)
```

## 3. Stage 4 Findings Addressed

- Upper-body pull remains band-required and is never silently replaced by shoulder mobility or overhead pressing.
- Generated sessions now classify every slot as `primary`, `supporting`, `fallback`, `skipped`, or `invalid`, with a machine-readable reason.
- True no-equipment sessions now expose missing focus-domain stimulus in `slotStimulus` and guidance.
- Static balance and lateral/dynamic balance are distinguishable in ladder metadata.
- The mixed mobility ladder is explicitly marked as a `collection`.
- Door-anchor row work is gated separately from generic resistance-band availability.
- Stage 5 now has catalogue-level semantics for progression model and stimulus kind.

## 4. Stage 4 Findings Not Addressed

- No no-band primary upper-pull exercise was added. V1 handling is to skip honestly and recommend band availability through product copy/settings.
- No eyes-closed balance progression was added.
- Mobility content was not split into separate sub-ladders.
- Broader dynamic generation strategy remains Stage 5 work.
- Stage 4C/4E cueing, pain/readiness polish, and beta-device validation remain outside this task.

## 5. Post-4A Architecture Trace

- `src/training/equipmentSafety.ts` is the shared equipment gate used by generated workouts, Explore, and manual practice.
- Stage 4A already gated `floor` through `floor_space`, `stair` through stairs, and `counter` through chair/wall support.
- Before Stage 4B, `door_anchor` was treated like any resistance band. Stage 4B split it into explicit `door_anchor` availability.
- Skipped generated slots existed as string arrays only: `skippedSlots` and `skippedSlotReasons`.
- Upper-pull missing-band behavior already skipped the slot after Stage 4A, but had no structured reason code.
- Balance no-support output skipped support-dependent drills, but did not expose structured stimulus semantics.
- The mobility ladder contained useful drills but looked like a linear progression in data.
- `domainRole` existed on levels and Stage 4A marked overhead band press as `cross_domain_supporting`; Stage 4B added ladder-level progression/stimulus semantics.

## 6. Stimulus Role/Data Model Changes

Added `SlotStimulusRole`, `SlotStimulusReason`, and `SlotStimulus` in `src/training/workoutGeneration.ts`.

Each generated slot now records:

- slot identity and intended domain;
- selected exercise/ladder/level when present;
- selected domain when present;
- role: `primary`, `supporting`, `fallback`, `skipped`, or `invalid`;
- reason: `direct_match`, `equipment_limited`, `safety_limited`, `supporting_maintenance`, `no_safe_option`, `band_required`, `floor_required`, `support_required`, or `stair_support_required`;
- calm user-facing message.

`GeneratedExercise` now carries `intendedDomain`, `stimulusRole`, and `stimulusReason`. `PearlSessionPlanMetadata`, generated exercise metadata, local generated-session summaries, and serializers preserve these fields.

## 7. Upper-Pull Behavior

Final strategy: approved option A/C.

- True upper-back pull remains band-required.
- No-band users get the upper-pull slot skipped with reason `band_required`.
- Pearl does not count shoulder mobility or overhead pressing as primary upper-pull work.
- Session guidance says: "Upper-back pulling was skipped because it needs a resistance band. Pearl did not replace it with shoulder mobility or another movement."
- A long band without a door anchor can still use seated band row.
- Standing band row requires both a resistance band and explicit `door_anchor`.
- Long band plus door anchor allows standing band row.

## 8. Balance Progression Semantics

- `balance` ladder is now `progressionModel: 'linear_progression'` and `stimulusKind: 'static_balance'`.
- Static balance order remains feet-together, tandem, single-leg.
- `lateral-stability` is now `progressionModel: 'supporting_set'` and `stimulusKind: 'dynamic_balance'`.
- Lateral/dynamic drills are not treated as direct static-balance progression endpoints.
- Supported side step and march remain support-gated.
- March naming is preserved as "March in Place"; metadata notes the legacy id is an unloaded supported balance drill.
- True no-equipment balance sessions skip unsupported balance slots and expose `support_required`.

## 9. Mobility Progression/Collection Semantics

- `mobility-flexibility` is now `progressionModel: 'collection'` and `stimulusKind: 'mobility_collection'`.
- Stage 5 must not treat hamstring reach -> thoracic rotation -> hip flexor stretch -> calf stretch -> neck rotations as linear difficulty progression.
- `shoulder-reach-press` is now `progressionModel: 'supporting_set'`, with overhead band press still explicitly `cross_domain_supporting`.

## 10. No-Equipment Session Behavior

True no-equipment sessions now:

- do not select floor, stair, chair, wall/counter, long band, door anchor, mini-band, or load-dependent work;
- skip upper-pull with `band_required`;
- skip support-dependent balance with `support_required`;
- preserve primary work when a genuinely no-equipment option exists, such as squat or thoracic rotation;
- mark fallback/supporting/skipped slots explicitly in `slotStimulus`;
- include equipment/stimulus limitation guidance.

Short true-no-equipment sessions may be partial, but they now expose the skipped balance stimulus rather than presenting as complete all-domain training.

## 11. Skipped-Slot/Session Guidance Behavior

Generated guidance now includes non-primary slot messages:

- skipped due to `band_required`;
- skipped due to `floor_required`;
- skipped due to `support_required`;
- skipped due to `stair_support_required`;
- supporting maintenance;
- lower-equipment fallback.

Primary matches are represented in metadata but not repeated in guidance.

## 12. Catalogue/Domain Consistency Changes

- Added `progressionModel` and `stimulusKind` to every exercise ladder.
- Kept `domainRole` defaulted to `primary`, with cross-domain levels explicitly marked.
- Added tests that every ladder has progression/stimulus semantics.
- Added tests that mobility collection is not linear.
- Added tests that overhead band press is not a mobility endpoint.
- Added explicit `door_anchor` to available-equipment serialization and profile UI.

## 13. Files Changed

Production code changed by Stage 4B:

- `src/adherence/types.ts`
- `src/exercises/ladders.ts`
- `src/pearlFlow/exploreViewModel.ts`
- `src/pearlFlow/sessionPlanning.ts`
- `src/pearlFlow/types.ts`
- `src/profile/serialize.ts`
- `src/screens/OnboardingEquipmentScreen.tsx`
- `src/screens/SettingsScreen.tsx`
- `src/training/debugWorkoutScenarios.ts`
- `src/training/dynamicState.ts`
- `src/training/equipmentSafety.ts`
- `src/training/index.ts`
- `src/training/serialize.ts`
- `src/training/workoutGeneration.ts`

Pre-existing Stage 4A/user-owned files remained dirty and were not reverted.

## 14. Tests Added/Changed

- `src/exercises/__tests__/catalog.test.ts`
  - progression model and stimulus kind coverage;
  - mobility collection guard;
  - static/dynamic balance distinction;
  - cross-domain shoulder strength guard.
- `src/training/__tests__/workoutGeneration.test.ts`
  - no-equipment stimulus metadata scenarios;
  - supported focus-domain primary scenarios;
  - upper-pull no-band skipped metadata;
  - band/no-door-anchor seated row;
  - band plus door-anchor standing row;
  - short true-no-equipment transparency.
- `src/pearlFlow/__tests__/sessionPlanning.test.ts`
  - metadata propagation to session plans and summaries;
  - manual practice door-anchor gating.
- `src/pearlFlow/__tests__/exploreViewModel.test.ts`
  - Explore ladder detail door-anchor gating.

## 15. Exact Validation Results

Targeted:

```text
npm test -- --runInBand src/exercises/__tests__/catalog.test.ts src/training/__tests__/workoutGeneration.test.ts
Test Suites: 2 passed, 2 total
Tests:       42 passed, 42 total
```

```text
npm test -- --runInBand src/pearlFlow/__tests__/sessionPlanning.test.ts src/pearlFlow/__tests__/exploreViewModel.test.ts
Test Suites: 2 passed, 2 total
Tests:       30 passed, 30 total
```

```text
npm test -- --runInBand src/adherence/__tests__/adherence.test.ts src/adherence/__tests__/blockServiceEligibility.test.ts src/training/__tests__/block.test.ts src/training/__tests__/freshUser.integration.test.ts src/training/__tests__/store.test.ts
Test Suites: 5 passed, 5 total
Tests:       34 passed, 34 total
```

```text
npm test -- --runInBand src/scoring/__tests__/focusSelection.test.ts src/scoring/__tests__/scoreSnapshot.test.ts src/pearlFlow/__tests__/assessmentEligibility.test.ts src/pearlFlow/__tests__/copyGuardrails.test.ts src/pearlFlow/__tests__/progressViewModel.test.ts
Test Suites: 5 passed, 5 total
Tests:       58 passed, 58 total
```

```text
npm test -- --runInBand src/training/__tests__/validTimeProgression.test.ts src/training/__tests__/microCheck.test.ts src/training/__tests__/autoregulationFlow.test.ts src/training/__tests__/progression.test.ts src/training/__tests__/sessionPlayer.test.ts
Test Suites: 5 passed, 5 total
Tests:       26 passed, 26 total
```

Required final validation:

```text
npm test -- --runInBand
Test Suites: 84 passed, 84 total
Tests:       613 passed, 613 total
Snapshots:   0 total
```

```text
npm run typecheck
tsc --noEmit
Result: pass
```

```text
npx --no-install expo config --type public
Result: pass
Warning: [@sentry/react-native/expo] Missing config for organization, project. Environment variables will be used as a fallback during the build.
```

```text
git diff --check
Result: pass
```

Warnings observed:

- Watchman recrawl warning during Jest commands.
- Existing expected console warnings/logs in session planning/backend sync tests.
- Jest full suite printed the existing open-handle notice after completion.
- Expo config printed the existing Sentry organization/project warning.

No validation command intentionally changed files.

## 16. Regression Verification for Stage 1-4A Protections

- Stage 1A invalid/no-domain baseline behavior was not touched.
- Stage 2A camera readiness and ROM gates were not touched.
- Stage 3A malformed scoring validation was not touched.
- Stage 3B official Check-Up/manual isolation was not touched.
- Stage 3C score snapshots/versioning were not touched.
- Stage 3D focus/tie/copy regressions passed targeted tests.
- Stage 4A floor gating still passed.
- Stage 4A stair plus support gating still passed.
- Stage 4A balance support gating still passed.
- Stage 4A Explore/manual practice shared safety gate still passed.

## 17. Remaining Stage 4 Blockers

- Stage 4 remediation still has follow-up work outside 4B: cueing/pain/readiness polish and beta-device validation remain.
- Stage 3D-B norm provenance remains required.
- Stage 5 must still audit dynamic generation against the new catalogue semantics.

## 18. Stage 5 Catalogue Input Readiness

Stage 5 catalogue inputs are ready for audit. The catalogue now exposes enough structured semantics for Stage 5 to distinguish primary/supporting/fallback/skipped stimulus, static vs dynamic balance, linear vs collection mobility, and equipment-limited upper-pull behavior.

## 19. Initial and Final Git Status

Initial status is recorded in section 2.

Final `git status --short --untracked-files=all` after code changes and report creation:

```text
 M src/adherence/types.ts
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
 M src/pearlFlow/__tests__/exploreViewModel.test.ts
 M src/pearlFlow/__tests__/sessionPlanning.test.ts
 M src/pearlFlow/exploreViewModel.ts
 M src/pearlFlow/sessionPlanning.ts
 M src/pearlFlow/types.ts
 M src/movements/types.ts
 M src/profile/serialize.ts
 M src/screens/ExploreScreen.tsx
 M src/screens/OnboardingEquipmentScreen.tsx
 M src/screens/PlanScreen.tsx
 M src/screens/ProgressScreen.tsx
 M src/screens/SettingsScreen.tsx
 M src/training/__tests__/workoutGeneration.test.ts
 M src/training/debugWorkoutScenarios.ts
 M src/training/dynamicState.ts
 M src/training/index.ts
 M src/training/serialize.ts
 M src/training/workoutGeneration.ts
?? assets/pearl-logo-icon-groove-connected.png
?? assets/pearl-logo-icon-groove.png
?? assets/pearl-logo-icon.png
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
?? docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4A.md
?? docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4B.md
?? docs/audits/Pearl_Stage_4A_Catalogue_Safety_Gating_Prompt.md
?? docs/audits/Pearl_Stage_4B_Stimulus_Domain_Progression_Prompt.md
?? src/pearlFlow/extraSessionCopy.ts
?? src/training/equipmentSafety.ts
?? tmp/logo/pearl-flat-traced-candidate.png
?? tmp/logo/pearl-flat-traced-smooth-hires.png
?? tmp/logo/pearl-flat-traced-smoothed.png
```

## 20. Concurrent External Changes

`src/screens/ProgressScreen.tsx` appeared modified in final status but was not present in the initial status and was not edited during Stage 4B. It was treated as concurrent user-owned work and left untouched.

All other pre-existing dirty files and untracked files were treated as user-owned baseline unless Stage 4B needed a targeted edit in that same file.

## 21. Git Action Confirmation

No staging occurred.
No commit occurred.
No branch was created or switched.
No push occurred.

## Stage Decision

STAGE 4B COMPLETE

STAGE 4 REMEDIATION STILL REQUIRED

STAGE 5 CATALOGUE INPUTS READY

STAGE 3D-B REQUIRED
