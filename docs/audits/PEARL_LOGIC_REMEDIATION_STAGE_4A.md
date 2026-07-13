# Pearl Logic Remediation Stage 4A Report

Date: 2026-06-20

## 1. Scope and Stage Boundary

Stage 4A was limited to exercise catalogue integrity and safety gating:

- floor-work selection only when the user explicitly has usable floor space;
- stair/step-up selection only when stair access and support are available;
- support-dependent balance/march work only when a wall, chair, or equivalent counter support is available;
- upper-pull stimulus preservation rather than silently replacing pulling with shoulder mobility or pressing;
- equipment/domain metadata consistency across catalogue definitions, workout generation, manual practice, and Explore surfaces.

No Stage 4B-G work was started. No Stage 5 work was started. No Stage 3D-B work was started. No workout-generation redesign, beta-device validation, scoring/norm/check-up readiness work, or assessment behavior change was made.

## 2. Prior Inputs Read

Read these prior audit/remediation inputs before editing:

- `docs/audits/PEARL_LOGIC_AUDIT_STAGE_0.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_1.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_1A.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_2.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_2A.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_2A_1.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3A.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3B.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3C.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3C_1.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_A.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_C.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_D.md`
- `docs/audits/PEARL_LOGIC_AUDIT_STAGE_4.md`

## 3. Initial Git Status and Concurrent Changes

Initial status captured before Stage 4A edits:

```text
 M src/screens/ExploreScreen.tsx
?? docs/audits/Pearl_Stage_4A_Catalogue_Safety_Gating_Prompt.md
```

Initial `git diff --name-only`:

```text
src/screens/ExploreScreen.tsx
```

Initial `git diff --stat`:

```text
 src/screens/ExploreScreen.tsx | 165 +++++++++++++++++++++++++++++-------------
 1 file changed, 115 insertions(+), 50 deletions(-)
```

The initial `src/screens/ExploreScreen.tsx` diff was treated as user-owned and was not intentionally edited for Stage 4A. During the work, additional non-Stage-4A changes were present or appeared in `src/screens/PlanScreen.tsx`, additional `src/screens/ExploreScreen.tsx` UI diff, untracked Explore image assets, and `src/pearlFlow/extraSessionCopy.ts` plus associated `src/pearlFlow/sessionPlanning.ts` copy/import changes. Those were preserved.

## 4. Source Trace / Current-State Summary

Inspected catalogue, workout-generation, manual-practice, Explore, equipment-profile, and relevant tests before editing:

- `src/exercises/index.ts`, `src/exercises/registry.ts`, `src/exercises/types.ts`, `src/exercises/ladders.ts`
- exercise definition files for step-up, balance rung, loaded march, upper pull, overhead press, push-up, glute bridge, supported squat, lateral stability, mobility drills, heel raise, sit-to-stand, hip hinge, hamstring reach, and neck rotation
- `src/training/workoutGeneration.ts`
- `src/pearlFlow/sessionPlanning.ts`
- `src/pearlFlow/exploreViewModel.ts`
- `src/adherence/types.ts`
- equipment surfaces in onboarding/settings
- existing tests under `src/exercises/__tests__`, `src/training/__tests__`, `src/pearlFlow/__tests__`, and adherence/scoring tests used for regression coverage

Pre-edit behavior allowed several catalogue inconsistencies to leak into session selection:

- floor drills could be selected without an explicit floor-space capability;
- stair drills did not consistently require both stair access and support;
- support-dependent balance/march drills could appear in true no-equipment conditions;
- upper-pull slots could degrade into shoulder mobility/pressing substitutes;
- manual and Explore selection did not share the same safety gate as generated sessions;
- some ladder metadata and movement-definition equipment tags disagreed.

## 5. Findings Addressed

Addressed these Stage 4A findings:

- Added an explicit floor-space equipment capability and made floor drills opt-in.
- Made step-up require both stair access and nearby support.
- Made support-dependent balance/march work require support equipment.
- Prevented upper-pull slots from silently becoming shoulder mobility or overhead pressing.
- Added honest skip reasons when required equipment/safety constraints are not met.
- Brought ladder metadata and movement definitions into closer alignment.
- Applied the same equipment/safety gate to generated sessions, manual-practice planning, and Explore view-model details.

## 6. Catalogue Metadata Changes

Catalogue metadata changes included:

- `step-up` ladder and movement definition now require `stair` plus `counter` support metadata.
- `balance-rung` now requires support metadata instead of claiming zero equipment.
- `loaded-march` now requires support metadata and documents that the legacy id remains unloaded in V1.
- supported squat/split squat, supported heel/toe raise, incline push-up, and hip flexor stretch now include support equipment metadata where their instructions require it.
- standing row now declares band/anchor metadata consistently.
- thoracic rotation ladder now uses `none`, matching the sit/stand instruction path.
- floor push-up and glute bridge levels now include explicit floor-space setup/safety notes.
- overhead band press is marked as `cross_domain_supporting`, not a mobility progression endpoint.

## 7. Shared Equipment/Safety Gate

Added `src/training/equipmentSafety.ts` as the shared gate for:

- support detection (`chair`, `wall`, or equivalent counter support);
- exercise equipment matching;
- human-readable missing-equipment labels;
- floor-space gating;
- stair-plus-support gating.

This helper is now used by generated workouts, manual session planning, and Explore view-model selection to avoid divergent eligibility rules.

## 8. Floor-Work Gating

Added `floor_space` to `AvailableEquipment` and profile serialization. Added "Floor space for mat exercises" toggles to onboarding and settings.

Generated sessions, manual practice, and Explore ladder details now avoid floor-only levels when `floor_space` is absent. When floor-space work is selected, equipment/setup copy can expose "floor space" rather than hiding the requirement.

## 9. Stair/Step-Up Gating

Step-up now requires:

- a stable lowest stair/step (`stair`);
- wall/counter/chair support (`counter` resolved through support-equipment matching).

If the user has stairs without support, generated sessions and Explore stair presets avoid or disable the stair drill rather than treating stair access alone as sufficient.

## 10. Support-Dependent Balance/March Gating

Support-dependent balance and march drills now require support equipment. True no-equipment generated sessions avoid these support-dependent drills and skip the affected slot with an explicit reason rather than selecting a hidden-support movement.

## 11. Upper-Pull and Stimulus Preservation

Upper-pull selection was narrowed so a missing band does not silently become shoulder mobility or overhead pressing. In the no-band case, Pearl now reports:

```text
Upper-back pulling was skipped because it needs a resistance band. Pearl did not replace it with shoulder mobility.
```

This preserves the training stimulus contract and avoids misleading the user about what was trained.

## 12. Domain/Equipment Consistency Fixes

Domain and equipment consistency fixes included:

- added `domainRole` metadata for ladder levels and used it to flag overhead band press as cross-domain/supporting;
- aligned ladder-level equipment with movement-definition equipment where mismatches affected gating;
- kept mobility drills as mobility drills and upper-pull drills as upper-pull drills;
- documented loaded march's legacy id/unloaded V1 behavior.

## 13. Manual Practice and Explore Behavior

Manual practice now applies the same equipment gate as generated workouts. It will not pick floor, stair, or support-dependent levels when the equipment profile does not support them.

Explore behavior now:

- disables the stairs-confidence preset if stair access exists without support;
- requires band availability for the band upper-back preset;
- resolves ladder detail/current-level suggestions through equipment and safety-profile inputs;
- displays floor space in setup summaries when present.

## 14. Tests Added or Updated

Updated and added tests in:

- `src/exercises/__tests__/catalog.test.ts`
- `src/training/__tests__/workoutGeneration.test.ts`
- `src/pearlFlow/__tests__/sessionPlanning.test.ts`
- `src/pearlFlow/__tests__/exploreViewModel.test.ts`

Coverage now asserts:

- ladder/definition equipment alignment for safety-sensitive tags;
- floor-space opt-in behavior;
- stair-plus-support behavior;
- true no-equipment balance/support behavior;
- no-band upper-pull skip behavior;
- manual practice safety gating;
- Explore preset and ladder-detail safety gating.

## 15. Validation Results

Focused Stage 4A regression subset:

```text
npm test -- --runInBand src/exercises/__tests__/catalog.test.ts src/training/__tests__/workoutGeneration.test.ts src/pearlFlow/__tests__/sessionPlanning.test.ts src/pearlFlow/__tests__/exploreViewModel.test.ts src/adherence/__tests__/blockServiceEligibility.test.ts src/adherence/__tests__/adherence.test.ts
```

Result: passed, 6 test suites passed, 80 tests passed. Watchman recrawl warnings and expected session-planning fallback warnings appeared.

Broader targeted regression subset:

```text
npm test -- --runInBand src/exercises/__tests__/catalog.test.ts src/exercises/__tests__/setGraders.test.ts src/exercises/__tests__/validTime.test.ts src/exercises/__tests__/autoregulation.test.ts src/training/__tests__/workoutGeneration.test.ts src/training/__tests__/progression.test.ts src/training/__tests__/validTimeProgression.test.ts src/training/__tests__/sessionPlayer.test.ts src/training/__tests__/autoregulationFlow.test.ts src/training/__tests__/freshUser.integration.test.ts src/pearlFlow/__tests__/sessionPlanning.test.ts src/pearlFlow/__tests__/exploreViewModel.test.ts src/adherence/__tests__/blockServiceEligibility.test.ts src/adherence/__tests__/adherence.test.ts src/scoring/__tests__/focusSelection.test.ts src/scoring/__tests__/scoreSnapshot.test.ts
```

Result: passed, 16 test suites passed, 145 tests passed. Watchman recrawl warnings and expected session-planning fallback warnings appeared.

Full Jest suite:

```text
npm test -- --runInBand
```

Result: passed, 84 test suites passed, 606 tests passed. Watchman recrawl warnings, existing expected backend/session-planning logs, and Jest's open-handle notice appeared after completion.

TypeScript:

```text
npm run typecheck
```

Result: passed.

Expo config:

```text
npx --no-install expo config --type public
```

Result: passed. Existing Sentry warning about missing organization/project configuration appeared.

Whitespace:

```text
git diff --check
```

Result: passed with no output.

## 16. Acceptance Criteria Mapping

- Floor exercises are not generated unless `floor_space` is present: satisfied.
- Floor exercises expose floor-space setup/equipment labels: satisfied.
- Step-up requires stair plus support: satisfied.
- Stair preset/manual access respects stair plus support: satisfied.
- Support-dependent balance/march avoids true no-equipment profiles: satisfied.
- Upper-pull does not silently degrade to shoulder mobility/pressing: satisfied.
- Missing equipment produces honest skip/guidance reasons: satisfied.
- Manual practice uses the safety gate: satisfied.
- Explore cards/detail use the safety gate: satisfied.
- Catalogue metadata and movement definitions are aligned for Stage 4A-sensitive cases: satisfied.
- No scoring/norm/readiness/check-up behavior changed: satisfied.

## 17. Out-of-Scope Items Not Changed

Not changed in this stage:

- Stage 4B-G remediation areas;
- Stage 5 readiness implementation;
- Stage 3D-B voice/detail-body work;
- scoring, norms, movement-age math, readiness, assessment protocols, or check-up flow;
- beta-device or camera validation;
- workout-generation architecture beyond targeted Stage 4A gating and skip reasons;
- runtime audio/session path behavior.

## 18. Residual Risks / Deferred Work

- Stage 4 remediation remains open beyond Stage 4A; later batches still need to handle the remaining Stage 4 catalogue/workout findings.
- Floor-space availability is now explicit, but it is still self-reported; no camera-verified room safety exists in V1.
- `counter` remains a semantic support tag resolved through chair/wall/support availability rather than a literal equipment profile value.
- Existing/concurrent UI and copy diffs remain in the worktree and should be reviewed separately from Stage 4A.

## 19. Final Git Status / Diff Summary

Final `git status --short --untracked-files=all`:

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
?? src/pearlFlow/extraSessionCopy.ts
?? src/training/equipmentSafety.ts
```

Final `git diff --name-only`:

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

Final `git diff --stat`:

```text
 src/adherence/types.ts                           |   1 +
 src/exercises/__tests__/catalog.test.ts          |  43 +++++
 src/exercises/balanceRung.ts                     |   8 +-
 src/exercises/heelRaise.ts                       |   4 +-
 src/exercises/ladders.ts                         |  24 ++-
 src/exercises/loadedMarch.ts                     |  10 +-
 src/exercises/mobilityDrills.ts                  |   2 +-
 src/exercises/pullUpperBack.ts                   |   2 +-
 src/exercises/pushUp.ts                          |   2 +-
 src/exercises/stepUp.ts                          |  10 +-
 src/exercises/supportedSquat.ts                  |   4 +-
 src/pearlFlow/__tests__/exploreViewModel.test.ts  |  61 +++++++
 src/pearlFlow/__tests__/sessionPlanning.test.ts   |  95 ++++++++++-
 src/pearlFlow/exploreViewModel.ts                 |  95 +++++++----
 src/pearlFlow/sessionPlanning.ts                  |  47 +++---
 src/movements/types.ts                           |   7 +-
 src/profile/serialize.ts                         |   1 +
 src/screens/ExploreScreen.tsx                    | 206 ++++++++++++++++-------
 src/screens/OnboardingEquipmentScreen.tsx        |   3 +
 src/screens/PlanScreen.tsx                       |  12 +-
 src/screens/SettingsScreen.tsx                   |   5 +
 src/training/__tests__/workoutGeneration.test.ts |  94 ++++++++++-
 src/training/workoutGeneration.ts                |  99 +++++++----
 23 files changed, 641 insertions(+), 194 deletions(-)
```

Final `git diff --check`: passed with no output.

Note: `git diff --name-only` and `git diff --stat` do not include untracked files. The final status output above is the complete tracked/untracked worktree view.

## 20. Stage Decisions

STAGE 4A COMPLETE

STAGE 4 REMEDIATION STILL REQUIRED

STAGE 5 CATALOGUE INPUTS BLOCKED

STAGE 3D-B REQUIRED
