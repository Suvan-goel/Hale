# Hale Logic Remediation Stage 5G

Date: 2026-06-21

## Scope

Implemented deterministic 4-week block scheduling for Hale's main-plan flow. The remediation replaces calendar-only progress and raw completion counters with schedule-derived credit, lapse, week unlock, and official re-test eligibility state.

The core rule now is: a block reaches official re-test only after 12 valid A/B/C scheduled main-plan credits and the later of block start + 28 calendar days or the day after the final scheduled credit.

## Preflight Snapshot

These commands were run before remediation edits and before any staging or package changes.

`git status --short --untracked-files=all`

```text
 M App.tsx
 M src/adherence/screens/SessionCompletionScreen.tsx
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
 M src/screens/ResultsScreen.tsx
 M src/screens/SessionPlanningRecoveryScreen.tsx
 M src/screens/TodayScreen.tsx
 M src/services/backend/__tests__/restoreService.test.ts
 M src/services/backend/__tests__/trainingStateSyncService.test.ts
 M src/services/backend/profileSyncService.ts
 M src/services/backend/trainingStateSyncService.ts
 M src/training/dailyTrainingContext.ts
 M src/training/dynamicState.ts
 M src/training/serialize.ts
 M src/training/workoutGeneration.ts
?? .codex_tmp_recovery_preview/harness.tsx
?? .codex_tmp_recovery_preview/svg.web.tsx
?? docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5F.md
?? docs/audits/Hale_Stage_5F_Canonical_Equipment_Remote_Consistency_Prompt.md
?? docs/audits/Hale_Stage_5G_Block_Timing_Lapse_Retest_Prompt.md
?? src/profile/__tests__/equipment.test.ts
?? src/profile/equipment.ts
?? src/services/backend/__tests__/profileSyncService.test.ts
```

`git diff --name-only`

```text
App.tsx
src/adherence/screens/SessionCompletionScreen.tsx
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
src/screens/ResultsScreen.tsx
src/screens/SessionPlanningRecoveryScreen.tsx
src/screens/TodayScreen.tsx
src/services/backend/__tests__/restoreService.test.ts
src/services/backend/__tests__/trainingStateSyncService.test.ts
src/services/backend/profileSyncService.ts
src/services/backend/trainingStateSyncService.ts
src/training/dailyTrainingContext.ts
src/training/dynamicState.ts
src/training/serialize.ts
src/training/workoutGeneration.ts
```

`git diff --stat`

```text
 App.tsx                                            | 229 +++++++-----
 src/adherence/screens/SessionCompletionScreen.tsx  | 379 +++++++++++++++-----
 src/adherence/types.ts                             |   3 +
 src/haleFlow/__tests__/exploreViewModel.test.ts    |  38 +-
 src/haleFlow/__tests__/progressionEvidence.test.ts |  19 +
 src/haleFlow/__tests__/sessionPlanning.test.ts     | 152 ++++++++
 src/haleFlow/exploreViewModel.ts                   |  55 +--
 src/haleFlow/sessionPlanning.ts                    | 187 ++++++++--
 src/haleFlow/types.ts                              |   2 +
 src/profile/index.ts                               |  30 ++
 src/profile/serialize.ts                           |  32 +-
 src/screens/ManualCheckupStartScreen.tsx           | 234 +++++++++++--
 src/screens/PlanScreen.tsx                         | 125 ++++---
 src/screens/ProgressScreen.tsx                     |  29 +-
 src/screens/ResultsScreen.tsx                      | 306 +++++++++++-----
 src/screens/SessionPlanningRecoveryScreen.tsx      | 173 +++++++--
 src/screens/TodayScreen.tsx                        | 385 +++++++++++++++++----
 .../backend/__tests__/restoreService.test.ts       |  65 +++-
 .../__tests__/trainingStateSyncService.test.ts     |  18 +-
 src/services/backend/profileSyncService.ts         |  73 +++-
 src/services/backend/trainingStateSyncService.ts   |   1 +
 src/training/dailyTrainingContext.ts               |  12 +-
 src/training/dynamicState.ts                       |   2 +
 src/training/serialize.ts                          |  47 ++-
 src/training/workoutGeneration.ts                  |  12 +-
 25 files changed, 2063 insertions(+), 545 deletions(-)
```

## Implementation Summary

- Added `src/haleFlow/blockSchedule.ts` as the deterministic scheduler. It takes explicit block/completion/today inputs and never depends on ambient time.
- Added `src/haleFlow/__tests__/blockSchedule.test.ts` covering out-of-order A/B/C credit, one credit per calendar date, week unlock timing, lapse states, and re-test not-before behavior after late final credits.
- Added persisted schedule credit metadata on training completions and generated session summaries.
- Changed block progress, weekly progress, milestones, reports, restore/sync payloads, and progression evidence to require scheduled main-plan credit instead of raw completion count.
- Changed planning to select the next due A/B/C template from schedule state, reject requested templates ahead of schedule, keep `week_complete`, `block_complete`, and `retest_due` distinct, and pass schedule metadata into generated plans.
- Changed official re-test gating so manual or requested re-tests are only official when schedule state is `retest_due`; early attempts stay non-official/manual extra.
- Changed app lifecycle, next-best-action, Plan/Today/Progress UI, and restart surfaces to derive due, waiting, restart, and re-test states from schedule state.
- Added or updated tests across adherence, Hale flow, lifecycle, planning, progression, and progress view models to assert the new schedule-derived behavior.

## Policy Behaviors Covered

- Only valid Stage 5A/B main-plan completions can become schedule candidates.
- A/B/C templates are credited independently but next due is always the earliest missing template.
- At most one schedule credit is allowed per calendar date.
- The next week unlocks only after all A/B/C credits and both timing gates are satisfied: seven days from the week start and the day after the latest scheduled credit.
- Lapse state is derived from schedule credit dates or block start, not from raw generated sessions.
- A block cannot become re-test due from calendar age alone.
- Official re-test is not due on the same date as a late final scheduled credit.
- Completion and report totals are schedule-derived, not stale `completedSessions` counters.

## Verification

Passed:

```text
npm run typecheck
```

```text
npx jest src/haleFlow/__tests__/blockSchedule.test.ts src/haleFlow/__tests__/sessionPlanning.test.ts src/haleFlow/__tests__/appLifecycle.test.ts src/haleFlow/__tests__/progressionEvidence.test.ts --runInBand
```

Result: 4 suites passed, 76 tests passed.

```text
npm test -- --runInBand
```

Result: 93 suites passed, 729 tests passed.

```text
npx expo config
```

Result: command completed successfully.

Non-blocking warnings observed:

- Watchman reported repeated recrawls during Jest.
- Jest printed the existing "did not exit one second after the test run" open-handle warning after the full suite, but exited with code 0.
- `npx expo config` printed the existing Sentry `organization, project` config warning and fell back to environment variables.

## Worktree Notes

- No dependencies were installed.
- No lockfile was changed.
- No files were staged or committed.
- Pre-existing untracked Stage 5F/profile files were left untouched.
- `.codex_tmp_recovery_preview/*` was present in the initial preflight snapshot and was not modified by this remediation.

