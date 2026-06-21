# HALE LOGIC REMEDIATION STAGE 5F

## 1. Scope

Stage 5F implemented the canonical equipment boundary, local/remote equipment resolution, immutable plan equipment snapshots, stale-plan validation, and remote generated metadata preservation. It did not begin Stage 5G, Stage 5H, Stage 3D-B, further Stage 4 remediation, beta-device validation, scoring/norm work, or broad workout-generation redesign.

## 2. Initial Git Status

`git status --short --untracked-files=all`

```text
 M src/screens/TodayScreen.tsx
?? docs/audits/Hale_Stage_5F_Canonical_Equipment_Remote_Consistency_Prompt.md
```

`git diff --name-only`

```text
src/screens/TodayScreen.tsx
```

`git diff --stat`

```text
 src/screens/TodayScreen.tsx | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
```

Initial existing diff inspected: `src/screens/TodayScreen.tsx` exported `SessionStartMenu`; treated as user-owned.

## 3. Findings Addressed

F5-008: closed. Current planning, Explore, manual practice, and plan start validation now consume canonical profile equipment derived from `MovementSafetyProfile.availableEquipment`; legacy `training.equipment` no longer adds or removes current capabilities.

F5-009: closed. Existing structured generated exercise/session fields were already largely preserved; Stage 5F added equipment snapshot preservation and regression coverage for remote compact training-state metadata.

## 4. Deferred Policies

Deferred: Stage 5G timing/lapse policy, Stage 5H adversarial scenario breadth, Stage 4 remaining remediation, Stage 3D-B, beta-device validation, norm provenance/scoring changes, and beta readiness.

## 5. Equipment Architecture Before Remediation

| Source | Fields | Writable by | Read by | Persisted where | Current authority | Risk |
| --- | --- | --- | --- | --- | --- | --- |
| Safety profile | `availableEquipment` | onboarding, Settings, safety save | planning, Explore, Settings | profile preferences / `safety_json` | intended authority | no status/revision; merged with legacy booleans |
| Legacy training state | `equipment.stair/band/miniBand/load` | onboarding, Settings, restore | old block resolver, planning adapters, Explore | training state / `training_state.state_json` | should be migration/history only | could add stairs/band or delete band/anchor |
| Generated plan metadata | equipment labels only | planning | preview, completion summary | local generated summaries/session sync | not authority | no immutable canonical fingerprint |
| Remote profile/training restore | profile `safety_json`, training `equipment` | sync/restore | restore/planning after hydration | Supabase JSON | profile should win | training-state equipment could steer planning indirectly |

## 6. Canonical Equipment Data Model

Added `src/profile/equipment.ts` with:

- `CanonicalEquipmentCapability`
- `CanonicalEquipmentStatus`
- `CanonicalEquipmentProfile`
- `PlannedEquipmentSnapshot`
- pure normalizer, legacy migrator, resolver, fingerprint, and stale-plan validator

`MovementSafetyProfile` now has optional `equipmentStatus`, `equipmentRevision`, and `equipmentUpdatedAt`; the existing `availableEquipment` array remains the persisted capability field.

## 7. Normalization Rules

Capabilities are deduped and sorted by one stable order: chair, wall, stairs, resistance band, door anchor, mini band, dumbbells, backpack, floor space. Unknown tokens never enable equipment. Direct legacy spellings (`stair`, `band`, `miniBand`, `load`) map conservatively without inferring support, floor, or anchor dependencies.

## 8. Explicit None Vs Unknown

`['none']` normalizes to confirmed empty capabilities. Missing/empty equipment normalizes to `needs_confirmation`; malformed non-arrays normalize to `malformed_fail_closed`. `none` plus real capabilities fails closed.

## 9. Legacy Migration Behavior

Legacy migration maps only `band -> resistance_band`, `miniBand -> mini_band`, and `stair -> stairs`; ambiguous `load` does not enable backpack/dumbbells. Migrated state is `legacy_migrated` and confirmation-required. A valid canonical profile always wins.

## 10. Local/Remote Resolution Policy

`resolveCanonicalEquipmentRecords` is deterministic:

1. newer confirmed local/remote marker wins;
2. equal markers preserve local;
3. marker-less conflicts preserve local;
4. only one confirmed record wins;
5. no confirmed record uses conservative legacy migration if supplied;
6. otherwise returns `needs_confirmation`.

The resolver does not use array order and returns safe diagnostics.

## 11. UI Write Path

Onboarding and Settings now write canonical profile equipment first via `safetyProfileWithCanonicalEquipment`. Legacy `training.equipment` is updated only as a derived compatibility mirror from canonical capabilities.

## 12. Current Planning Authority

`planTodayHaleSession`, `planLadderPracticeSession`, Explore cards/details, and the lower-level generator now use canonical profile capabilities. Unknown canonical equipment returns `equipment_confirmation_required` instead of silently assuming chair/wall.

## 13. Legacy Training-Equipment Containment

Training-state restore may still preserve legacy `equipment` for old state readability, but current planning and Explore ignore it. Regression tests prove legacy full equipment cannot override profile explicit none or unlock Explore without canonical safety equipment.

## 14. Plan Equipment Snapshot

Each generated current plan now receives `metadata.equipmentSnapshot`, and completion summaries persist the same snapshot. The snapshot is JSON-safe and includes schema version, sorted capabilities, status, fingerprint, source revision, and source updated timestamp where available.

## 15. Equipment Fingerprint

The fingerprint is deterministic and based on schema version, canonical status, and sorted capabilities. It intentionally excludes timestamps so identical equipment does not become stale due to unrelated writes. Explicit none and unknown differ by status.

## 16. Stale-Plan Invalidation

`beginPlannedSession` validates the planned snapshot against current canonical equipment before launch. Changed equipment, missing snapshots, unknown canonical equipment, or legacy plans route to recovery instead of starting. Running sessions remain immutable because validation happens only at start.

## 17. Mid-Session Immutability

Once `TrainingSessionScreen` starts, it uses `activeSessionPlan` and `sessionIds` already selected. Later Settings changes affect future plans only.

## 18. Profile Sync/Restore

Profile sync now normalizes outgoing safety equipment and resolves local/remote profile equipment through the canonical resolver during restore hydration. Background profile sync with routing hydration disabled preserves local routing fields.

## 19. Training-State Sync/Restore

Training-state sync still preserves historical legacy equipment, progression, summaries, and feedback. It now includes `equipmentSnapshot` in compact generated summaries. Training-state restore cannot override `preferences.profile.safetyProfile`.

## 20. F5-009 Field Matrix And Outcome

| Field | Local plan | Local summary | Training-state remote | Session-completion remote | Restore | Required |
| --- | --- | --- | --- | --- | --- | --- |
| `exerciseId` | yes | yes | yes | yes | yes | yes |
| `ladderId` | yes | yes | yes | yes | yes | yes |
| selected level | `levelId` | yes | yes | yes | yes | yes |
| requested level | yes | yes | yes | metadata | yes | yes |
| selected daily level | yes | yes | yes | metadata | yes | yes |
| `intendedDomain` | yes | yes | yes | metadata | yes | yes |
| selected/current domain | slot stimulus | slot stimulus | preserved in focus/session metadata | metadata | yes | yes |
| `stimulusRole` | yes | yes | yes | metadata | yes | yes |
| `stimulusReason` | yes | yes | yes | metadata | yes | yes |
| slot id/type | yes | type in summary; slot stimulus in plan/session | yes where persisted | metadata | yes | yes |
| skipped/fallback reason | slot stimulus/substitutions | focus evidence | yes | metadata | yes | yes |
| work evidence | completion | summary | yes | yes | yes | yes |
| focus-stimulus evidence | plan/completion | summary | yes | yes | yes | yes |
| main-plan credit | completion/summary | yes | yes | yes | yes | yes |
| progression policy | plan | summary | yes | yes | yes | yes |
| daily context/readiness | plan | summary | yes | metadata | yes | yes |
| adjustment reasons | plan | summary | yes | metadata | yes | yes |
| equipment snapshot/fingerprint | yes, added | yes, added | yes, added | plan metadata/summary | yes | yes |
| source/block/template/date | yes | yes | yes | yes | yes | yes |
| applied progression event ids | training state | n/a | yes | n/a | yes | yes |

Outcome: no display-name reconstruction is used; malformed summary fields still fail closed through existing validators.

## 21. Pre/Post-Restore Generation Equivalence

Restore tests now cover profile explicit none vs training legacy full equipment and no-profile legacy-only restore. The same canonical profile drives generated equipment snapshots before and after restore; missing canonical equipment blocks current planning.

## 22. User-Facing Recovery Copy

Added calm recovery copy for:

- equipment confirmation required;
- equipment changed after planning;
- missing/legacy equipment snapshot refresh.

Copy states that plan/progress are unchanged and avoids corrupt/loss/shame language.

## 23. Observability

Added safe breadcrumbs/diagnostics for profile equipment conflict resolution and stale-plan invalidation. Pure normalizers/resolvers remain side-effect free and return diagnostics.

## 24. Files Changed

Stage 5F-owned production files:

- `App.tsx`
- `src/adherence/types.ts`
- `src/haleFlow/exploreViewModel.ts`
- `src/haleFlow/sessionPlanning.ts`
- `src/haleFlow/types.ts`
- `src/profile/equipment.ts`
- `src/profile/index.ts`
- `src/profile/serialize.ts`
- `src/services/backend/profileSyncService.ts`
- `src/services/backend/trainingStateSyncService.ts`
- `src/training/dynamicState.ts`
- `src/training/serialize.ts`
- `src/training/workoutGeneration.ts`

Stage 5F-owned tests:

- `src/profile/__tests__/equipment.test.ts`
- `src/haleFlow/__tests__/exploreViewModel.test.ts`
- `src/haleFlow/__tests__/sessionPlanning.test.ts`
- `src/services/backend/__tests__/profileSyncService.test.ts`
- `src/services/backend/__tests__/restoreService.test.ts`
- `src/services/backend/__tests__/trainingStateSyncService.test.ts`

Concurrent external/user-owned modified files detected after work began:

- `src/screens/TodayScreen.tsx`
- `src/screens/PlanScreen.tsx`
- `src/screens/ManualCheckupStartScreen.tsx`
- `src/screens/ProgressScreen.tsx`
- `src/haleFlow/__tests__/progressionEvidence.test.ts`
- `.codex_tmp_manual_preview/*`

These were not reverted.

## 25. Tests Added/Changed

Added canonical equipment normalization/migration/resolver/fingerprint tests, profile sync resolver tests, stale-plan validation tests, canonical-vs-legacy planning tests, remote metadata snapshot tests, restore containment tests, and Explore canonical equipment tests.

## 26. Exact Validation Results

Targeted command:

```bash
npm test -- --runInBand src/profile/__tests__/equipment.test.ts src/profile/__tests__/serialize.test.ts src/haleFlow/__tests__/sessionPlanning.test.ts src/haleFlow/__tests__/exploreViewModel.test.ts src/services/backend/__tests__/profileSyncService.test.ts src/services/backend/__tests__/trainingStateSyncService.test.ts src/services/backend/__tests__/restoreService.test.ts src/services/backend/__tests__/sessionSyncService.test.ts
```

Result: 8 suites passed, 101 tests passed, 0 snapshots.

Regression command:

```bash
npm test -- --runInBand src/training/__tests__/workoutGeneration.test.ts src/exercises/__tests__/catalog.test.ts src/haleFlow/__tests__/appLifecycle.test.ts src/haleFlow/__tests__/mainPlanEvents.test.ts src/haleFlow/__tests__/focusStimulusEvidence.test.ts src/haleFlow/__tests__/progressionEvidence.test.ts src/navigation/__tests__/TabBar.test.ts src/onboarding/__tests__/onboarding.test.ts
```

Result: 8 suites passed, 112 tests passed, 0 snapshots.

Full suite:

```bash
npm test -- --runInBand
```

Result: 92 suites passed, 721 tests passed, 0 snapshots.

Other required gates:

- `npm run typecheck`: pass.
- `npm --prefix website run typecheck`: pass.
- `npx --no-install expo config --type public`: pass; existing Sentry organization/project warning.
- `git diff --check`: pass.

Warnings/notices:

- Watchman recrawl warning printed during Jest.
- Jest open-handle notice printed after Jest.
- Expected backend sync warning logs printed in existing backend tests.
- Expo config printed existing Sentry missing organization/project warning.
- No package install occurred and validation did not intentionally modify files.

## 27. Stage 1-5E Regression Verification

Full Jest passed after Stage 5F changes. Covered regressions include Stage 4A equipment safety gates, Stage 4B stimulus metadata, Stage 5A/5B main-plan credit, Stage 5C recovery states, Stage 5D progression idempotency, Stage 5E readiness/discomfort policy, Stage 3D focus protections, canonical tab order, app typecheck, website typecheck, and Expo config.

## 28. Remaining Stage 5 Blockers

Stage 5G timing/lapse policy and Stage 5H broader adversarial testing remain. Stage 5 remediation is still required before beta automatic plan generation readiness.

## 29. F5-008 Status

F5-008 CLOSED.

## 30. F5-009 Status

F5-009 CLOSED.

## 31. Whether Stage 5G Is Unblocked

STAGE 5G UNBLOCKED for canonical equipment and restore metadata. Stage 5G remains required.

## 32. Whether Beta Automatic Plan Generation Remains Blocked

BETA AUTOMATIC PLAN GENERATION BLOCKED.

## 33. Initial And Final Git Status

Initial status is recorded in section 2.

Final `git status --short --untracked-files=all`

```text
 M App.tsx
 M src/adherence/types.ts
 M src/haleFlow/__tests__/exploreViewModel.test.ts
 M src/haleFlow/__tests__/progressionEvidence.test.ts
 M src/haleFlow/__tests__/sessionPlanning.test.ts
 M src/haleFlow/exploreViewModel.ts
 M src/haleFlow/sessionPlanning.ts
 M src/haleFlow/types.ts
 M src/profile/index.ts
 M src/profile/serialize.ts
 M src/screens/ManualCheckupStartScreen.tsx
 M src/screens/PlanScreen.tsx
 M src/screens/ProgressScreen.tsx
 M src/screens/TodayScreen.tsx
 M src/services/backend/__tests__/restoreService.test.ts
 M src/services/backend/__tests__/trainingStateSyncService.test.ts
 M src/services/backend/profileSyncService.ts
 M src/services/backend/trainingStateSyncService.ts
 M src/training/dynamicState.ts
 M src/training/serialize.ts
 M src/training/workoutGeneration.ts
?? .codex_tmp_manual_preview/capture.mjs
?? .codex_tmp_manual_preview/harness.tsx
?? .codex_tmp_manual_preview/svg.web.tsx
?? docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5F.md
?? docs/audits/Hale_Stage_5F_Canonical_Equipment_Remote_Consistency_Prompt.md
?? src/profile/__tests__/equipment.test.ts
?? src/profile/equipment.ts
?? src/services/backend/__tests__/profileSyncService.test.ts
```

Final `git diff --name-only`

```text
App.tsx
src/adherence/types.ts
src/haleFlow/__tests__/exploreViewModel.test.ts
src/haleFlow/__tests__/progressionEvidence.test.ts
src/haleFlow/__tests__/sessionPlanning.test.ts
src/haleFlow/exploreViewModel.ts
src/haleFlow/sessionPlanning.ts
src/haleFlow/types.ts
src/profile/index.ts
src/profile/serialize.ts
src/screens/ManualCheckupStartScreen.tsx
src/screens/PlanScreen.tsx
src/screens/ProgressScreen.tsx
src/screens/TodayScreen.tsx
src/services/backend/__tests__/restoreService.test.ts
src/services/backend/__tests__/trainingStateSyncService.test.ts
src/services/backend/profileSyncService.ts
src/services/backend/trainingStateSyncService.ts
src/training/dynamicState.ts
src/training/serialize.ts
src/training/workoutGeneration.ts
```

Final `git diff --stat`

```text
 App.tsx                                            | 178 +++++++++-------
 src/adherence/types.ts                             |   3 +
 src/haleFlow/__tests__/exploreViewModel.test.ts    |  38 +++-
 src/haleFlow/__tests__/progressionEvidence.test.ts |  19 ++
 src/haleFlow/__tests__/sessionPlanning.test.ts     | 133 ++++++++++++
 src/haleFlow/exploreViewModel.ts                   |  55 ++---
 src/haleFlow/sessionPlanning.ts                    | 167 ++++++++++++---
 src/haleFlow/types.ts                              |   2 +
 src/profile/index.ts                               |  30 +++
 src/profile/serialize.ts                           |  32 ++-
 src/screens/ManualCheckupStartScreen.tsx           | 229 ++++++++++++++++++---
 src/screens/PlanScreen.tsx                         | 125 ++++++-----
 src/screens/ProgressScreen.tsx                     |  29 ++-
 src/screens/TodayScreen.tsx                        |  20 +-
 .../backend/__tests__/restoreService.test.ts       |  65 +++++-
 .../__tests__/trainingStateSyncService.test.ts     |  18 +-
 src/services/backend/profileSyncService.ts         |  73 ++++++-
 src/services/backend/trainingStateSyncService.ts   |   1 +
 src/training/dynamicState.ts                       |   2 +
 src/training/serialize.ts                          |  39 ++++
 src/training/workoutGeneration.ts                  |   2 +-
 21 files changed, 994 insertions(+), 266 deletions(-)
```

## 34. Concurrent External Changes

Concurrent/user-owned changes were present or appeared in:

- `docs/audits/Hale_Stage_5F_Canonical_Equipment_Remote_Consistency_Prompt.md` (untracked prompt file supplied to Codex)
- `src/screens/TodayScreen.tsx`
- `src/screens/PlanScreen.tsx`
- `src/screens/ManualCheckupStartScreen.tsx`
- `src/screens/ProgressScreen.tsx`
- `src/haleFlow/__tests__/progressionEvidence.test.ts`
- `.codex_tmp_manual_preview/capture.mjs`
- `.codex_tmp_manual_preview/harness.tsx`
- `.codex_tmp_manual_preview/svg.web.tsx`

No unrelated user work was reverted.

## 35. No Package/Git Mutation Confirmation

No package install, lockfile change, staging, commit, branch creation, or push occurred.

STAGE 5F COMPLETE

STAGE 5G UNBLOCKED

STAGE 5G REQUIRED

STAGE 5H REQUIRED

STAGE 5 REMEDIATION STILL REQUIRED

BETA AUTOMATIC PLAN GENERATION BLOCKED

STAGE 4 REMEDIATION STILL REQUIRED

STAGE 3D-B REQUIRED
