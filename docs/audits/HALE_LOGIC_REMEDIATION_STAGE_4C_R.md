# Hale Logic Remediation Stage 4C-R

Date: 2026-06-22

## 1. Scope

Implemented the Stage 4C-R movement-capability and non-main safety boundary:

- floor-transfer confirmation separate from `floor_space`;
- step-up environment confirmation separate from stairs/support equipment;
- single-leg balance confidence separate from generic support equipment and ladder progress;
- capability persistence/sync/restore;
- plan capability snapshots and start-time stale-plan validation;
- Explore/manual/preset daily-context parity using the existing Stage 5E daily context model.

No Stage 4D-R band cueing, catalogue-wide stop-rule work, optional-level policy change, movement-specific progression review, Stage 3D-B work, native/device validation, package install, or release work was attempted.

## 2. Initial Git Status

Initial `git status --short --untracked-files=all` recorded before Stage 4C-R edits:

```text
 M App.tsx
 M docs/decisions.md
 M src/components/ui.tsx
 M src/history/fsAdapter.ts
 M src/screens/AuthScreen.tsx
 M src/screens/ExploreDetailScreens.tsx
 M src/screens/ExploreScreen.tsx
 M src/screens/PlanScreen.tsx
 M src/screens/ProgressScreen.tsx
 M src/screens/SettingsScreen.tsx
 M src/screens/TodayScreen.tsx
 M src/screens/WelcomeScreen.tsx
 M src/services/backend/accountDataService.ts
?? docs/audits/HALE_LOGIC_VERIFICATION_STAGE_4_REMAINING.md
?? docs/audits/Hale_Stage_4C_R_Capability_Screening_Safety_Parity_Prompt.md
?? docs/audits/Hale_Stage_4R_Post_Stage5_Remaining_Findings_Verification_Prompt.md
?? src/history/__tests__/localScope.test.ts
?? src/history/localScope.ts
?? src/theme/responsive.ts
```

Initial `git diff --name-only`:

```text
App.tsx
docs/decisions.md
src/components/ui.tsx
src/history/fsAdapter.ts
src/screens/AuthScreen.tsx
src/screens/ExploreDetailScreens.tsx
src/screens/ExploreScreen.tsx
src/screens/PlanScreen.tsx
src/screens/ProgressScreen.tsx
src/screens/SettingsScreen.tsx
src/screens/TodayScreen.tsx
src/screens/WelcomeScreen.tsx
src/services/backend/accountDataService.ts
```

Initial `git diff --stat`:

```text
 App.tsx                                    | 183 +++++++++++++++++++----------
 docs/decisions.md                          |  11 ++
 src/components/ui.tsx                      |  15 ++-
 src/history/fsAdapter.ts                   |  80 +++++++------
 src/screens/AuthScreen.tsx                 |  17 +--
 src/screens/ExploreDetailScreens.tsx       |   7 +-
 src/screens/ExploreScreen.tsx              |   2 -
 src/screens/PlanScreen.tsx                 |  34 ++++--
 src/screens/ProgressScreen.tsx             |  55 +++++++--
 src/screens/SettingsScreen.tsx             |   3 -
 src/screens/TodayScreen.tsx                |  18 +--
 src/screens/WelcomeScreen.tsx              |   2 +-
 src/services/backend/accountDataService.ts |  23 +++-
 13 files changed, 307 insertions(+), 143 deletions(-)
```

## 3. Findings Addressed

- F4R-001: `floor_space` no longer unlocks floor exercise eligibility unless floor transfer is explicitly confirmed.
- F4R-002: step-up now requires stairs/support plus explicit step-up environment confirmation and the full setup checklist.
- F4R-006: `balance-single-leg-hold` now requires explicit supported single-leg confidence.
- F4R-007: Explore preset starts and manual ladder practice now require explicit daily readiness/discomfort context and use the Stage 5E discomfort policy before player launch.

## 4. Findings Explicitly Deferred

- F4R-003: band and door-anchor safety cueing remains deferred to Stage 4D-R.
- F4R-004: catalogue-wide spoken/text stop-rule and cue standard remains deferred to Stage 4D-R.
- F4R-005: load-specific cueing and loaded optional-level policy remain deferred.
- F4R-008: movement-specific progression prerequisite review remains deferred to Stage 4F-R/domain review.
- F4R-009: mobility collection labels/rotation polish remains deferred.
- F4R-010: minimal-equipment positioning copy remains deferred.

## 5. Prior Architecture

The existing Stage 4A/4B/5 architecture was preserved:

- canonical equipment remains the authority for environmental equipment;
- dynamic generation still owns stimulus roles and skipped/supporting semantics;
- Stage 5E daily context remains the only pain/readiness model;
- Stage 5F equipment snapshots remain the first start-time stale-plan gate;
- manual/Explore remains non-main-plan and progression-ineligible;
- no training state can override profile safety authority.

## 6. Movement-Capability Data Model

Added one canonical movement-capability profile in the safety/profile domain:

- `CapabilityConfirmationStatus = 'confirmed' | 'avoid_for_now' | 'not_confirmed'`;
- `SingleLegBalanceCapabilityStatus = 'confirmed_with_support' | 'supported_balance_only' | 'not_confirmed'`;
- `MovementCapabilityProfile` with `floorTransfer`, `stepUpEnvironment`, `singleLegBalance`, optional `revision`, and optional `updatedAt`.

The model is JSON-safe, enum/boolean-only, and contains no free text, symptoms, medical notes, pose data, video, images, landmarks, paths, or auth data.

## 7. Normalization/Default Policy

Capability normalization lives in `src/profile/movementCapabilities.ts`.

Policy verified:

- missing legacy capability data becomes `not_confirmed`;
- malformed capability data fails closed;
- partial step-up checklist data does not pass;
- explicit `avoid_for_now` and `supported_balance_only` are preserved;
- no field defaults to confirmed;
- capability fingerprinting ignores revision/update marker changes and changes only when eligibility-relevant fields change.

## 8. Profile Serialization/Sync

Local preferences serialization now normalizes and persists `movementCapabilities` inside `safetyProfile`.

Backend profile sync now:

- writes normalized capability data in `safety_json`;
- hydrates newer explicit remote capability records when local data is legacy/missing;
- preserves local explicit data when it is authoritative under existing resolution rules;
- logs conflict breadcrumbs without creating another profile authority;
- does not let training state confirm capabilities.

## 9. Floor-Transfer Behavior

Floor exercise eligibility now requires:

1. canonical equipment includes `floor_space`;
2. `floorTransfer.status === 'confirmed'`;
3. Stage 5E daily context permits the exercise;
4. release/optional policy permits the exercise;
5. existing Stage 4/5 gates pass.

`glute-bridge-hold`, `glute-bridge-reps`, and other floor-tagged levels are blocked when floor transfer is missing or avoided. Floor transfer alone does not bypass missing `floor_space`.

## 10. Step-Up Environment Behavior

Step-up eligibility now requires:

1. canonical equipment includes `stairs`;
2. existing support gate passes;
3. `stepUpEnvironment.status === 'confirmed'`;
4. `lowStableStep`, `fixedSupport`, `clearDryArea`, and `phoneOutOfPath` are all true;
5. Stage 5E discomfort policy permits step-up;
6. release/progression policy permits the level.

Partial checklist confirmation fails closed. Lighting and footwear remain session-time cue work for Stage 4D-R.

## 11. Single-Leg Balance Confidence Behavior

`balance-single-leg-hold` now requires:

1. current support/equipment gate passes;
2. `singleLegBalance.status === 'confirmed_with_support'`;
3. ladder/progression logic makes the level reachable;
4. Stage 5E daily context permits the level;
5. release policy permits the level.

Supported two-foot balance remains available when single-leg confidence is not confirmed. Capability denial does not mutate ladder progress.

## 12. Capability Snapshot/Fingerprint

New generated, preset, and manual plans preserve a `movementCapabilitySnapshot` containing:

- schema version;
- floor-transfer status;
- step-up status and checklist booleans;
- single-leg balance status;
- deterministic fingerprint;
- optional source revision/update markers.

The snapshot is immutable on the plan and survives local training serialization plus compact backend training-state sync.

## 13. Stale-Plan Behavior

Start-time validation now runs in this order:

1. equipment snapshot validation;
2. movement-capability snapshot validation;
3. player launch.

Changing capability state after planning invalidates an unstarted plan with `movement_capability_changed`. Missing capability snapshots on new/current plans fail closed with `missing_movement_capability_snapshot`. Legacy fallback plans continue through the existing legacy refresh path rather than inferring capability.

## 14. Explore/Manual Daily-Context Parity

Explore preset starts and manual ladder practice now use the existing `SessionStartMenu` before planning.

Production helpers enforce the same boundary:

- missing explicit daily context returns `daily_context_required`;
- malformed manual context returns `daily_context_required`;
- selected discomfort flows through `normalizeDailyTrainingContext`;
- Stage 5E movement-pattern exclusions run before a plan/player launch.

Preview cards may use an explicit safe preview context for display, but preview generation does not launch the player.

## 15. Manual-Practice Behavior

Manual practice now requires:

- explicit daily context;
- confirmed canonical equipment;
- movement capability gates;
- Stage 5E discomfort allowance;
- release eligibility for the requested level.

If the requested level is blocked, planning returns typed unavailable state and does not silently switch to another level or unrelated ladder. Manual plans retain `metadata.source = 'manual'`, remain non-credit, and remain progression-ineligible.

## 16. Explore Preset Behavior

Explore presets now require:

- confirmed canonical equipment;
- canonical movement capabilities;
- explicit daily context;
- Stage 5E discomfort filtering.

The stairs preset is disabled when stair/support equipment is missing and separately when step-up setup is not confirmed. A preset with no useful safe work returns typed recovery instead of launching an empty player.

## 17. UI/UX Collection Flow

Added a compact Movement setup section to `SafetyProfileScreen`, reachable through Settings:

- floor exercises: confirmed comfort getting down/up or not right now;
- step-up environment: use/avoid step-ups plus checklist for stable step, fixed support, clear dry area, and phone out of path;
- single-leg balance: support-nearby confirmation or supported balance only.

The flow uses explicit Save/Continue, large existing choice controls, calm non-medical language, and no automatic confirmation for existing users.

## 18. Recovery/Adjustment Copy

Added narrow typed recovery support for:

- daily context required;
- movement capability not confirmed;
- movement capability changed;
- missing movement capability snapshot.

User-facing copy remains calm and setup-oriented, for example reviewing movement setup rather than implying diagnosis or personal failure.

## 19. Local/Backend Restore

Restore behavior verified:

- local capability profile round-trips through preferences;
- backend profile sync preserves bounded capability fields;
- remote explicit capability can hydrate over local legacy missing data;
- malformed/missing restored capability remains unconfirmed;
- training state carries plan snapshots but cannot confirm capability profile;
- historical completions remain readable and are not rewritten.

## 20. Payload Safety

Backend profile/session/training payloads preserve only bounded enums, booleans, fingerprints, IDs, dates, and existing summary metadata.

Excluded by design:

- free-text movement setup;
- medical notes;
- pose/video/landmarks;
- image/base64/URI/path payloads;
- auth data in profile/training JSON.

## 21. Files Changed

Intentional Stage 4C-R production/test files:

- `App.tsx`
- `src/adherence/types.ts`
- `src/haleFlow/exploreViewModel.ts`
- `src/haleFlow/sessionPlanning.ts`
- `src/haleFlow/types.ts`
- `src/profile/index.ts`
- `src/profile/movementCapabilities.ts`
- `src/profile/serialize.ts`
- `src/screens/ExploreDetailScreens.tsx`
- `src/screens/ExploreScreen.tsx`
- `src/screens/SafetyProfileScreen.tsx`
- `src/services/backend/profileSyncService.ts`
- `src/services/backend/trainingStateSyncService.ts`
- `src/training/dynamicState.ts`
- `src/training/movementCapabilitySafety.ts`
- `src/training/serialize.ts`
- `src/training/workoutGeneration.ts`
- `src/profile/__tests__/movementCapabilities.test.ts`
- `src/profile/__tests__/serialize.test.ts`
- `src/services/backend/__tests__/profileSyncService.test.ts`
- `src/training/__tests__/workoutGeneration.test.ts`
- `src/haleFlow/__tests__/exploreViewModel.test.ts`
- `src/haleFlow/__tests__/progressionEvidence.test.ts`
- `src/haleFlow/__tests__/sessionPlanning.test.ts`
- `src/haleFlow/__tests__/stage5g1ScheduleVerification.test.ts`
- `src/haleFlow/__tests__/stage5hLifecycle.integration.test.ts`

The final dirty tree also contains pre-existing/concurrent changes listed in sections 32 and 33.

## 22. Tests Added/Changed

Added/changed coverage for:

- capability normalization, malformed/missing profiles, explicit avoid/support-only state;
- capability fingerprints and stale-plan validation;
- local preference serialization backfill and round-trip;
- profile sync hydration of remote explicit capability over local missing data;
- floor/step/single-leg generated selection gates;
- manual practice explicit daily context and capability gates;
- Explore card and start behavior for step-up setup;
- preset explicit daily context;
- progression evidence remaining non-authoritative for manual practice;
- Stage 5G/5H lifecycle fixtures carrying confirmed movement setup.

## 23. Exact Validation Results

Targeted command 1:

```bash
npm test -- --runInBand src/profile/__tests__/movementCapabilities.test.ts src/profile/__tests__/serialize.test.ts src/training/__tests__/workoutGeneration.test.ts src/haleFlow/__tests__/sessionPlanning.test.ts src/haleFlow/__tests__/exploreViewModel.test.ts src/services/backend/__tests__/profileSyncService.test.ts
```

Result: 6 passed suites, 115 passed tests, 0 snapshots. Watchman recrawl warning present. Jest open-handle notice present.

Targeted command 2:

```bash
npm test -- --runInBand src/profile/__tests__/equipment.test.ts src/training/__tests__/dailyTrainingContext.test.ts src/services/backend/__tests__/restoreService.test.ts src/services/backend/__tests__/trainingStateSyncService.test.ts src/haleFlow/__tests__/progressionEvidence.test.ts src/exercises/__tests__/catalog.test.ts src/haleFlow/__tests__/stage5g1ScheduleVerification.test.ts src/haleFlow/__tests__/stage5hLifecycle.integration.test.ts
```

Result: 8 passed suites, 97 passed tests, 0 snapshots. Watchman recrawl warning present. Jest open-handle notice present. Existing training-state sync console logs present.

Required full suite:

```bash
npm test -- --runInBand
```

Result: 97 passed suites, 781 passed tests, 0 snapshots. Watchman recrawl warning present. Jest open-handle notice present. Existing backend sync test console logs/warnings present, including block-report lookup failure warnings exercised by tests. No test failed.

Required app typecheck:

```bash
npm run typecheck
```

Result: pass, `tsc --noEmit`.

Required website typecheck:

```bash
npm --prefix website run typecheck
```

Result: pass, `tsc --noEmit`.

Required Expo config:

```bash
npx --no-install expo config --type public
```

Result: pass. Output loaded `.env`, exported Expo public environment variables, and emitted the existing Sentry warning: `[@sentry/react-native/expo] Missing config for organization, project. Environment variables will be used as a fallback during the build.`

Required diff check:

```bash
git diff --check
```

Result: pass with no output.

Validation did not install packages and did not intentionally change files. Full-suite baseline is now 97 suites and 781 tests, compared with the Stage 4R/Stage 5H reference baseline of 95 suites and 764 tests.

## 24. Stage 4A/4B and Stage 5 Regression Verification

Verified by source review and tests:

- Stage 4A equipment gates remain first-class and unchanged for floor space, stairs/support, band, door anchor, and balance support.
- Stage 4B stimulus roles and no-band/skipped/supporting semantics remain intact.
- Stage 5A/5B work evidence and primary-focus credit semantics remain intact.
- Stage 5C typed recovery handles daily context and capability setup failures.
- Stage 5D progression remains authoritative/idempotent and ignores manual practice.
- Stage 5E daily context/discomfort policy is reused rather than duplicated.
- Stage 5F stale-plan validation is extended rather than replaced.
- Stage 5G/5H schedule/lifecycle tests pass.
- Check-Up scoring, norms, pose detection, and movement assessment code were not changed for Stage 4C-R.

Manual source verification:

- floor requires both `floor_space` and confirmed floor transfer;
- step-up requires stairs/support and full step setup confirmation;
- single-leg balance requires explicit supported confidence;
- manual/Explore start paths go through explicit daily context, equipment, capability, discomfort, readiness, then player or typed recovery;
- capability change invalidates unstarted plans;
- missing/legacy capability remains unconfirmed on restore.

## 25. F4R-001 Status

F4R-001 is closed in software for Stage 4C-R.

Floor space alone cannot unlock floor work. Missing/legacy floor-transfer capability fails closed. Floor-transfer confirmation alone still cannot unlock floor work without `floor_space`.

## 26. F4R-002 Status

F4R-002 is closed in software for Stage 4C-R.

Step-up now requires stairs, support, confirmed step-up environment status, and all checklist booleans. Partial checklist data fails closed. Lighting/footwear cue content remains intentionally deferred to Stage 4D-R.

## 27. F4R-006 Status

F4R-006 is closed in software for Stage 4C-R.

Single-leg balance requires support plus explicit `confirmed_with_support` confidence. Supported two-foot balance remains available when single-leg is not confirmed.

## 28. F4R-007 Status

F4R-007 is closed in software for Stage 4C-R.

Explore preset starts and manual practice require explicit daily context in production helpers and UI entrypoints. They consume the Stage 5E discomfort policy and return typed unavailable results instead of starting blocked work.

## 29. Remaining Stage 4 Findings

Remaining Stage 4 remediation:

- F4R-003: band and door-anchor safety cueing.
- F4R-004: catalogue-wide spoken/text stop-rule and cue standard.
- F4R-005: loaded optional-level/load-specific stop rules.
- F4R-008: movement-specific progression prerequisite review.
- F4R-009: mobility collection labels/rotation polish.
- F4R-010: minimal-equipment product-positioning copy.

## 30. Whether Stage 4D-R Is Unblocked

No P0/P1 movement-capability or Explore/manual daily-context parity defect is known to remain after this remediation and validation. Stage 4D-R can proceed to band/door-anchor cueing and stop-rule standardization.

## 31. Whether Exercise Catalogue Remains Beta-Blocked

The exercise catalogue remains beta-blocked because Stage 4D-R cueing/stop-rule work is still required and other deferred Stage 4 findings remain. Stage 4C-R does not declare catalogue beta readiness.

## 32. Initial and Final Git Status

Final branch: `dev`.

Final `git status --short --untracked-files=all`:

```text
 M App.tsx
 M docs/decisions.md
 M src/adherence/types.ts
 M src/components/AccountAuthCard.tsx
 M src/components/ui.tsx
 M src/haleFlow/__tests__/exploreViewModel.test.ts
 M src/haleFlow/__tests__/progressionEvidence.test.ts
 M src/haleFlow/__tests__/sessionPlanning.test.ts
 M src/haleFlow/__tests__/stage5g1ScheduleVerification.test.ts
 M src/haleFlow/__tests__/stage5hLifecycle.integration.test.ts
 M src/haleFlow/exploreViewModel.ts
 M src/haleFlow/sessionPlanning.ts
 M src/haleFlow/types.ts
 M src/history/fsAdapter.ts
 M src/profile/__tests__/serialize.test.ts
 M src/profile/index.ts
 M src/profile/serialize.ts
 M src/screens/AuthScreen.tsx
 M src/screens/ExploreDetailScreens.tsx
 M src/screens/ExploreScreen.tsx
 M src/screens/PlanScreen.tsx
 M src/screens/ProgressScreen.tsx
 M src/screens/SafetyProfileScreen.tsx
 M src/screens/SettingsScreen.tsx
 M src/screens/TodayScreen.tsx
 M src/screens/TrainingSessionScreen.tsx
 M src/screens/WelcomeScreen.tsx
 M src/services/backend/__tests__/profileSyncService.test.ts
 M src/services/backend/accountDataService.ts
 M src/services/backend/profileSyncService.ts
 M src/services/backend/trainingStateSyncService.ts
 M src/training/__tests__/workoutGeneration.test.ts
 M src/training/dynamicState.ts
 M src/training/serialize.ts
 M src/training/workoutGeneration.ts
?? docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4C_R.md
?? docs/audits/HALE_LOGIC_VERIFICATION_STAGE_4_REMAINING.md
?? docs/audits/Hale_Stage_4C_R_Capability_Screening_Safety_Parity_Prompt.md
?? docs/audits/Hale_Stage_4R_Post_Stage5_Remaining_Findings_Verification_Prompt.md
?? src/history/__tests__/localScope.test.ts
?? src/history/localScope.ts
?? src/profile/__tests__/movementCapabilities.test.ts
?? src/profile/movementCapabilities.ts
?? src/theme/responsive.ts
?? src/training/movementCapabilitySafety.ts
```

Final tracked `git diff --stat`:

```text
 App.tsx                                            | 237 ++++++++++----
 docs/decisions.md                                  |  11 +
 src/adherence/types.ts                             |  27 ++
 src/components/AccountAuthCard.tsx                 |   2 +-
 src/components/ui.tsx                              |  89 ++++-
 src/haleFlow/__tests__/exploreViewModel.test.ts    |  46 ++-
 src/haleFlow/__tests__/progressionEvidence.test.ts |  15 +
 src/haleFlow/__tests__/sessionPlanning.test.ts     | 135 +++++++-
 .../__tests__/stage5g1ScheduleVerification.test.ts |  14 +
 .../__tests__/stage5hLifecycle.integration.test.ts |  24 +-
 src/haleFlow/exploreViewModel.ts                   |  77 +++--
 src/haleFlow/sessionPlanning.ts                    | 286 ++++++++++++++++-
 src/haleFlow/types.ts                              |   2 +
 src/history/fsAdapter.ts                           |  80 +++--
 src/profile/__tests__/serialize.test.ts            |  73 +++++
 src/profile/index.ts                               |  26 ++
 src/profile/serialize.ts                           |  12 +
 src/screens/AuthScreen.tsx                         |  17 +-
 src/screens/ExploreDetailScreens.tsx               |  81 +++--
 src/screens/ExploreScreen.tsx                      |  94 +++---
 src/screens/PlanScreen.tsx                         |  34 +-
 src/screens/ProgressScreen.tsx                     |  73 ++++-
 src/screens/SafetyProfileScreen.tsx                | 171 +++++++++-
 src/screens/SettingsScreen.tsx                     |   3 -
 src/screens/TodayScreen.tsx                        |  74 +++--
 src/screens/TrainingSessionScreen.tsx              | 357 ++++++++++++++++-----
 src/screens/WelcomeScreen.tsx                      |   2 +-
 .../backend/__tests__/profileSyncService.test.ts   |  29 ++
 src/services/backend/accountDataService.ts         |  23 +-
 src/services/backend/profileSyncService.ts         |  37 +++
 src/services/backend/trainingStateSyncService.ts   |   1 +
 src/training/__tests__/workoutGeneration.test.ts   |  31 ++
 src/training/dynamicState.ts                       |   2 +
 src/training/serialize.ts                          |  12 +-
 src/training/workoutGeneration.ts                  |  66 +++-
 35 files changed, 1872 insertions(+), 391 deletions(-)
```

Untracked new Stage 4C-R files are not included in tracked diff stat:

- `src/profile/__tests__/movementCapabilities.test.ts`
- `src/profile/movementCapabilities.ts`
- `src/training/movementCapabilitySafety.ts`
- this report.

## 33. Concurrent External Changes

The worktree was dirty before Stage 4C-R began. Pre-existing user-owned/unrelated changes were preserved and not reverted.

Initial dirty files included `docs/decisions.md`, `src/components/ui.tsx`, `src/history/fsAdapter.ts`, several screen files, backend account data service changes, and untracked audit/local-scope/theme files. Final status also shows `src/components/AccountAuthCard.tsx` and `src/screens/TrainingSessionScreen.tsx` as modified; these are recorded as concurrent/external changes because they were not part of the Stage 4C-R implementation intent.

No destructive git command was run.

## 34. No Install/Git Mutation Confirmation

No package install occurred. No lockfile was changed. No git staging occurred. No commit occurred. No branch was created or switched. No push occurred. No pull request was opened.

STAGE 4C-R COMPLETE

STAGE 4D-R UNBLOCKED

STAGE 4D-R REQUIRED

STAGE 4 REMEDIATION STILL REQUIRED

EXERCISE CATALOGUE SOFTWARE/CONTENT-BLOCKED

STAGE 5 REMEDIATION COMPLETE

DYNAMIC WORKOUT GENERATION SOFTWARE-READY FOR CONTROLLED BETA

OVERALL BETA RELEASE STILL BLOCKED

STAGE 3D-B REQUIRED

BETA DEVICE VALIDATION REQUIRED
