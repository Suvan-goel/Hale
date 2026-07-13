# PEARL LOGIC VERIFICATION - STAGE 5G.1

Date: 2026-06-22

## 1. Scope

Stage 5G.1 verified the Stage 5G four-week schedule contract: date-key helpers, event-derived A/B/C scheduling, one schedule credit per date, restart credit, same-day retry/second-session handling, re-test timing, idempotent official re-test transition effects, stale-cache rejection, restore equivalence, and schedule consumers.

This pass did not start Stage 5H, Stage 3D-B, Stage 4 remediation, beta-device validation, dependency work, scoring/norm work, or broad UI work.

## 2. Why Stage 5G.1 Was Required

Stage 5G implemented the scheduler and schedule-credit metadata, but its report did not explicitly prove website typecheck, final stage decisions, full Git evidence, restart credit end-to-end, same-day retry/second-session behavior, official re-test idempotency, stale-cache rejection, restore equivalence, date-boundary behavior, and all consumer paths.

## 3. Initial Git Status

Preflight commands were run before editing. Outputs:

```text
$ git status --short --untracked-files=all
 M App.tsx
 M src/adherence/__tests__/adherence.test.ts
 M src/adherence/adherenceCopy.ts
 M src/adherence/adherenceService.ts
 M src/adherence/adherenceState.ts
 M src/adherence/dateUtils.ts
 M src/adherence/milestoneService.ts
 M src/adherence/screens/BlockIntroScreen.tsx
 M src/adherence/screens/RestartSessionScreen.tsx
 M src/adherence/screens/SessionCompletionScreen.tsx
 M src/adherence/types.ts
 M src/pearlFlow/__tests__/appLifecycle.test.ts
 M src/pearlFlow/__tests__/exploreViewModel.test.ts
 M src/pearlFlow/__tests__/pearlFlow.test.ts
 M src/pearlFlow/__tests__/progressViewModel.test.ts
 M src/pearlFlow/__tests__/progressionEvidence.test.ts
 M src/pearlFlow/__tests__/sessionPlanning.test.ts
 M src/pearlFlow/appLifecycle.ts
 M src/pearlFlow/exploreViewModel.ts
 M src/pearlFlow/index.ts
 M src/pearlFlow/manualCheckup.ts
 M src/pearlFlow/nextBestAction.ts
 M src/pearlFlow/progressViewModel.ts
 M src/pearlFlow/progressionEvidence.ts
 M src/pearlFlow/reports.ts
 M src/pearlFlow/sessionPlanning.ts
 M src/pearlFlow/types.ts
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
 M src/services/backend/blockReportSyncService.ts
 M src/services/backend/profileSyncService.ts
 M src/services/backend/sessionSyncService.ts
 M src/services/backend/trainingStateSyncService.ts
 M src/training/dailyTrainingContext.ts
 M src/training/dynamicState.ts
 M src/training/serialize.ts
 M src/training/workoutGeneration.ts
?? assets/images/pearl-clean-slate-restart-hero-v1.png
?? docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5F.md
?? docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5G.md
?? docs/audits/Pearl_Stage_5F_Canonical_Equipment_Remote_Consistency_Prompt.md
?? docs/audits/Pearl_Stage_5G_1_Schedule_Verification_Prompt.md
?? docs/audits/Pearl_Stage_5G_Block_Timing_Lapse_Retest_Prompt.md
?? src/pearlFlow/__tests__/blockSchedule.test.ts
?? src/pearlFlow/blockSchedule.ts
?? src/profile/__tests__/equipment.test.ts
?? src/profile/equipment.ts
?? src/services/backend/__tests__/profileSyncService.test.ts
```

```text
$ git diff --name-only
App.tsx
src/adherence/__tests__/adherence.test.ts
src/adherence/adherenceCopy.ts
src/adherence/adherenceService.ts
src/adherence/adherenceState.ts
src/adherence/dateUtils.ts
src/adherence/milestoneService.ts
src/adherence/screens/BlockIntroScreen.tsx
src/adherence/screens/RestartSessionScreen.tsx
src/adherence/screens/SessionCompletionScreen.tsx
src/adherence/types.ts
src/pearlFlow/__tests__/appLifecycle.test.ts
src/pearlFlow/__tests__/exploreViewModel.test.ts
src/pearlFlow/__tests__/pearlFlow.test.ts
src/pearlFlow/__tests__/progressViewModel.test.ts
src/pearlFlow/__tests__/progressionEvidence.test.ts
src/pearlFlow/__tests__/sessionPlanning.test.ts
src/pearlFlow/appLifecycle.ts
src/pearlFlow/exploreViewModel.ts
src/pearlFlow/index.ts
src/pearlFlow/manualCheckup.ts
src/pearlFlow/nextBestAction.ts
src/pearlFlow/progressViewModel.ts
src/pearlFlow/progressionEvidence.ts
src/pearlFlow/reports.ts
src/pearlFlow/sessionPlanning.ts
src/pearlFlow/types.ts
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
src/services/backend/blockReportSyncService.ts
src/services/backend/profileSyncService.ts
src/services/backend/sessionSyncService.ts
src/services/backend/trainingStateSyncService.ts
src/training/dailyTrainingContext.ts
src/training/dynamicState.ts
src/training/serialize.ts
src/training/workoutGeneration.ts
```

```text
$ git diff --stat
45 files changed, 3357 insertions(+), 868 deletions(-)
```

Those initial modifications were treated as user-owned. No destructive Git command was used.

## 4. Current Stage 5G Architecture

`src/pearlFlow/blockSchedule.ts` is the authoritative event-derived scheduler. Constants are `BLOCK_TRAINING_WEEK_COUNT = 4`, `MAIN_PLAN_TEMPLATES_PER_WEEK = 3`, `TRAINING_WEEK_MIN_CALENDAR_DAYS = 7`, `BLOCK_MIN_CALENDAR_DAYS = 28`, `RESUME_GENTLY_AFTER_DAYS = 7`, `RESTART_RECOMMENDED_AFTER_DAYS = 14`, `MAX_SCHEDULE_CREDITS_PER_DATE = 1`, and `BLOCK_SCHEDULE_POLICY_VERSION = 1`.

Date helpers are `blockScheduleDateKey`, `addBlockScheduleDays`, and `daysBetweenBlockScheduleDates`. They parse explicit `YYYY-MM-DD` prefixes, validate UTC calendar dates, and fail closed for malformed values.

Schedule-credit event shape comes from `MainPlanCreditEvent`: block id, template id, planned date key, completed timestamp, status, source, and credit id. Completion metadata persists as `TrainingSessionScheduleCreditSummary`.

Schedule state union is `session_due`, `week_complete_waiting`, `training_complete_waiting_retest`, `retest_due`, `block_completed`, and `schedule_unavailable`.

Week derivation starts at the block start date key. A week completes only after A/B/C template coverage. The next week starts at the later of previous week start + 7 calendar days and day after that week’s final credit.

Next-template derivation uses earliest missing required template id for the current week. A/C means B due; B only means A due.

One-credit-per-date logic is enforced by `usedCreditDates`. Duplicate representations dedupe by block/template/planned-date/completed-at. Ties sort by completedAt, event kind, and stable id.

Lapse derives from the latest schedule-credited main-plan date, or block start when no credit exists.

Restart planning is in `src/pearlFlow/sessionPlanning.ts`: a 14+ day schedule lapse produces `sessionType: 'restart'`, targets `schedule.nextTemplateId`, stays `block_generated`, preserves block/week/focus, and receives `progressionEvidencePolicy: 'hold_only'`.

Progression requires `completion.scheduleCredit.credited === true` in `src/pearlFlow/progressionEvidence.ts`; same-day denied, early locked, or wrong-template sessions are excluded.

Training completion is `firstIncompleteWeekIndex >= 4` with 12 schedule credits. Official re-test not-before is `max(blockStart + 28 days, finalScheduleCredit + 1 day)`.

Official re-test gate uses scheduler status in `manualCheckup`, `appLifecycle`, `sessionPlanning`, and `App.tsx`.

Block/report/next-block idempotency uses stable report id `block-report-${block.id}`, deterministic retest completion id from `plannedDate: 'retest'`, upserts, and now a stable Check-Up transition timestamp from `checkUp.startedAt`.

Cached schedule fields are not authoritative. Stored counters and stale retest flags are ignored by the scheduler and consumer tests.

Local/remote persistence carries `scheduleCredit` through adherence completions, generated session summaries, session sync, training-state sync, block-report sync, and restore.

## 5. Locked Schedule Policy

Verified policy:

- Four sequential weeks.
- A/B/C coverage per week.
- 12 schedule credits total.
- Minimum seven calendar days per week.
- Missed sessions extend the current week.
- One schedule credit per date.
- Non-credit attempts do not consume the date.
- Restart is a current due-template session, not an extra session.
- Re-test requires all 12 credits, day 28, and day after final credit.
- Schedule evidence, not stale counters, is authority.

## 6. Date-Key Utility Verification

Added `stage5g1ScheduleVerification.test.ts` date utility cases for valid dates, invalid month/day, non-leap/leap February 29, January 31, April 30, December 31, leap crossing, same-date difference, negative difference, spring/autumn DST date keys, malformed strings, deterministic output, and input non-mutation.

Result: verified.

## 7. Four-Week Scheduler Verification

The Stage 5G.1 suite proves no credits -> A due, A/C -> B due, early A/B/C waits, week 2 unlock at day 7, late week 1 shifts week 2 start to day after final week-1 credit, full early completion waits until day 28, late final completion waits until following date, and incomplete day 28 remains session due.

Result: verified.

## 8. Same-Date Event Resolution

Tests cover duplicate completion + generated-summary representation, two eligible templates on one date, same timestamp stable id tie-break, reversed input order, eligible plus malformed/wrong/future/pre-block evidence, and stable diagnostics.

Result: verified.

## 9. Same-Day Retry Proof

Test sequence:

1. Zero-work/non-credit A attempt is recorded with schedule denial.
2. Same-date valid A retry receives schedule credit.
3. Date remains unused until the valid attempt.
4. Schedule advances exactly once to B.
5. Milestones do not falsely complete a week.

Result: verified.

## 10. Same-Day Second-Session Proof

Test sequence:

1. A receives valid schedule credit.
2. Same-date valid B remains in history.
3. B receives `daily_credit_already_used`.
4. Next due remains B.
5. Week coverage contains A only.
6. No first-week milestone.
7. No re-test due.
8. Stage 5D progression rejects with `schedule_denied`.

Result: verified.

## 11. Lapse Boundary Proof

Tests cover day 0, day 6, day 7, day 13, day 14, no prior credits, and prior A credit. Lapse does not reset coverage, archive the block, or change the due template.

Result: verified.

## 12. Restart-Session Proof

Tests prove restart recommendation after 14 days, generated restart session targets current due A, preserves block/week/focus, remains `block_generated`, uses `hold_only`, credits the due template once, advances to B, duplicate restart completion remains one stored credit, and supporting/fallback/zero-work restart completions remain non-credit. Day 7-13 `resume_gently` does not force restart.

Result: verified.

## 13. Training-Complete/Re-Test Timing Proof

Tests cover early finish waiting until day 28, late final credit waiting until next calendar day, incomplete day 28 blocked, same-date final training/re-test blocked through manual checkup options, and official option available only on the eligible date.

Result: verified.

## 14. Official Re-Test Transition Idempotency

A production helper `checkUpCompletionTimestamp` now anchors Check-Up transition effects to immutable `checkUp.startedAt`, with fallback only for invalid Check-Up ids. Tests simulate repeated official re-test callbacks with different fallback clocks and prove one report, one retest completion, one next block, stable report timestamp, stable next block start, and completed current block.

Result: verified.

## 15. Stale-Cache/Counter Proof

Tests construct `completedSessions: 12`, `status: completed`, stale retest due flag, and a retest-only completion without scheduled training credits. Scheduler remains `session_due` with zero credits; Progress does not show a due retest.

Production fix: `blockSchedule` no longer treats `block.status === 'completed'` as proof. It requires retest completion evidence and all four scheduled weeks complete.

Result: verified.

## 16. Pre/Post-Restore Schedule Equivalence

Local serialize/deserialize equivalence is tested with same-day credited A, denied B, generated-summary duplicates, reversed completion order, stale counters, and schedule-credit metadata. Semantic fingerprint remains identical after restore.

Existing backend restore tests also pass and cover remote row hydration, missing-focus/supporting attempts, duplicate local ids, source mismatch, and compact training state.

Result: verified.

## 17. Date/Time Adversarial Proof

Tests cover month end, year end, leap day, spring DST, autumn DST, malformed dates, future events, pre-block events, same timestamp tie, explicit date keys, and no locale parsing. Current design intentionally treats stored string date-key prefixes as authoritative; travel/timezone display migration was not introduced.

Result: verified.

## 18. Consumer Schedule-Truth Matrix

| Consumer | Schedule field used | Old fallback/counter found? | Verification |
| --- | --- | --- | --- |
| Today lifecycle | `status`, `lapseState`, `totalCredits`, `creditedTemplateIds`, `retestNotBeforeDateKey` | Removed raw completed-status retest prompt fallback | `appLifecycle.test`, Stage 5G.1 consumer test |
| Plan | `ActiveBlockSummary`, `WeekSessionStatus`, `retestInDays` from scheduler | None in current Plan path | `planViewModel.test`, `appLifecycle.test`, Stage 5G.1 |
| Progress | `getBlockScheduleState`, `totalCredits`, `retestNotBeforeDateKey` | Removed `activeBlock.status === completed` due fallback | `progressViewModel.test`, Stage 5G.1 |
| Milestones | `scheduleCredit.credited === true` | No raw row count for week milestone | `adherence.test`, Stage 5G.1 |
| Progression | `scheduleCredit.credited === true` | None | `progressionEvidence.test`, Stage 5G.1 |
| Official re-test gate | scheduler `retest_due` | App timestamp now stable by Check-Up id | `manualCheckup`, Stage 5G.1 |
| Session planning | scheduler `nextTemplateId`, `lapseState`, `totalCredits` | Requested ahead templates rejected | `sessionPlanning.test`, Stage 5G.1 |
| Sync/restore | persisted `scheduleCredit`, generated summaries | Remote ordering/dedup verified | backend sync/restore tests |

## 19. Today/Plan/Progress Verification

Stage 5G.1 tests prove Today summary reports one session complete after same-day denied B, Plan statuses are complete/next/later, and Progress does not inflate re-test readiness from denied history.

Result: verified.

## 20. Milestone/Adherence Verification

Milestones count only schedule-credited completions. Same-day denied B and non-credit retry attempts do not trigger first-week or block-complete milestones. `blockProgress` also counts only `scheduleCredit.credited`.

Result: verified.

## 21. Progression Schedule-Credit Verification

Same-day denied B returns `schedule_denied` and applies no official evidence. Restart credit uses `hold_only`; successful restart records evidence without advancing easy-session ladders.

Result: verified.

## 22. Sync/Restore Metadata Verification

Targeted backend tests pass for session sync, training-state sync, block sync, block-report sync, and restore. `scheduleCredit`, planned date, source/template identity, generated summaries, and compact training snapshots remain serialized/sanitized. Duplicate rows and missing-focus/supporting attempts fail closed.

Result: verified.

## 23. User-Facing Copy Verification

Current view-model/screen copy remains non-shaming:

- Week-complete state offers optional mobility reset, not early main-plan session.
- Restart copy says Clean slate / Restart gently.
- Training-complete waiting does not expose next block.
- Re-test due is only shown when scheduler says due.
- Manual/quick checks remain separate from official re-test.

Result: verified.

## 24. Production Files Changed

- `App.tsx`
- `src/pearlFlow/appLifecycle.ts`
- `src/pearlFlow/blockSchedule.ts`
- `src/pearlFlow/checkupTransition.ts`
- `src/pearlFlow/index.ts`
- `src/pearlFlow/progressViewModel.ts`

## 25. Exact Reason For Each Production Change

- `App.tsx`: official Check-Up transition effects needed an immutable timestamp to prevent repeated callback/button/resume from creating a second next block or mutating report/completion timestamps.
- `src/pearlFlow/checkupTransition.ts`: added a tiny named helper so the idempotency timestamp rule is testable and reused.
- `src/pearlFlow/index.ts`: exported the helper.
- `src/pearlFlow/blockSchedule.ts`: stale `block.status` and retest-only rows must not complete a block; schedule now requires retest completion plus complete scheduled training evidence.
- `src/pearlFlow/appLifecycle.ts`: removed raw completed-status retest prompt fallback.
- `src/pearlFlow/progressViewModel.ts`: removed raw completed-status retest due fallback.

## 26. Tests Added/Changed

Added:

- `src/pearlFlow/__tests__/stage5g1ScheduleVerification.test.ts`

It contains 15 tests covering date utilities, four-week scheduling, same-day resolution, same-day retry, same-day second valid session, lapse boundaries, restart credit/non-credit/hold-only, re-test timing, stale counters, local restore equivalence, consumer schedule truth, and official re-test transition idempotency.

## 27. Exact Targeted Validation

Command:

```bash
npm test -- --runInBand src/pearlFlow/__tests__/stage5g1ScheduleVerification.test.ts src/pearlFlow/__tests__/blockSchedule.test.ts src/pearlFlow/__tests__/mainPlanEvents.test.ts src/pearlFlow/__tests__/sessionPlanning.test.ts src/pearlFlow/__tests__/appLifecycle.test.ts src/pearlFlow/__tests__/blockAutomation.test.ts src/pearlFlow/__tests__/progressionEvidence.test.ts src/pearlFlow/__tests__/progressViewModel.test.ts src/pearlFlow/__tests__/planViewModel.test.ts src/adherence/__tests__/adherence.test.ts src/services/backend/__tests__/sessionSyncService.test.ts src/services/backend/__tests__/trainingStateSyncService.test.ts src/services/backend/__tests__/blockSyncService.test.ts src/services/backend/__tests__/blockReportSyncService.test.ts src/services/backend/__tests__/restoreService.test.ts
```

Result:

```text
Test Suites: 15 passed, 15 total
Tests:       157 passed, 157 total
Snapshots:   0 total
Exit code: 0
```

Warnings/notices:

- Watchman recrawl warning.
- Jest open-handle notice after completion.
- Expected mocked backend sync console logs/warnings in block-report/session/block/training-state sync tests.

## 28. Exact Full Validation

Command:

```bash
npm test -- --runInBand
```

Result:

```text
Test Suites: 94 passed, 94 total
Tests:       745 passed, 745 total
Snapshots:   0 total
Exit code: 0
```

Warnings/notices:

- Watchman recrawl warning.
- Jest open-handle notice after completion.
- Expected mocked backend sync console logs/warnings.

## 29. App Typecheck Result

Command:

```bash
npm run typecheck
```

Result: passed, exit code 0.

## 30. Website Typecheck Result

Command:

```bash
npm --prefix website run typecheck
```

Result: passed, exit code 0.

## 31. Expo Config Result

Command:

```bash
npx --no-install expo config --type public
```

Result: passed, exit code 0.

Warning:

```text
[@sentry/react-native/expo] Missing config for organization, project. Environment variables will be used as a fallback during the build.
```

## 32. `git diff --check` Result

Command:

```bash
git diff --check
```

Result: passed, exit code 0, no output.

## 33. Stage 5A-5F Regression Verification

Targeted and full suites include Stage 5A/5B focus credit, Stage 5C fallback containment, Stage 5D progression authority, Stage 5E readiness/discomfort policy, Stage 5F equipment/profile/sync tests, Stage 4A/4B planning and safety paths, Stage 3D navigation/history/scoring identity tests, and TypeScript boundary checks. No scoring, norms, Check-Up measurement, or exercise catalogue behavior was changed.

Result: verified.

## 34. Remaining Stage 5 Blockers

No P0/P1 Stage 5G schedule/lapse/re-test blocker remains.

Stage 5H is still required as the next planned stage, and the broader Stage 5 remediation track is still required until Stage 5H is completed.

## 35. Whether Stage 5H Is Unblocked

Stage 5H is unblocked by Stage 5G.1 because the schedule, restart, same-day gating, restore equivalence, stale-cache, and re-test idempotency contracts are now tested and passing.

## 36. Initial And Final Git Status

Initial status is recorded in section 3.

Final status:

```text
$ git status --short --untracked-files=all
 M App.tsx
 M src/pearlFlow/appLifecycle.ts
 M src/pearlFlow/blockSchedule.ts
 M src/pearlFlow/index.ts
 M src/pearlFlow/progressViewModel.ts
?? docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5G_1.md
?? src/pearlFlow/__tests__/stage5g1ScheduleVerification.test.ts
?? src/pearlFlow/checkupTransition.ts
```

Final tracked diff inventory:

```text
$ git diff --name-only
App.tsx
src/pearlFlow/appLifecycle.ts
src/pearlFlow/blockSchedule.ts
src/pearlFlow/index.ts
src/pearlFlow/progressViewModel.ts
```

Final untracked inventory:

```text
$ git ls-files --others --exclude-standard
docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5G_1.md
src/pearlFlow/__tests__/stage5g1ScheduleVerification.test.ts
src/pearlFlow/checkupTransition.ts
```

Final tracked diff stat:

```text
$ git diff --stat
 App.tsx                           | 21 +++++++++++----------
 src/pearlFlow/appLifecycle.ts      |  1 -
 src/pearlFlow/blockSchedule.ts     | 17 ++++++++++++-----
 src/pearlFlow/index.ts             |  1 +
 src/pearlFlow/progressViewModel.ts |  2 +-
 5 files changed, 25 insertions(+), 17 deletions(-)
```

## 37. Complete Files-Changed Inventory

Task-owned changed files:

- `App.tsx`
- `src/pearlFlow/appLifecycle.ts`
- `src/pearlFlow/blockSchedule.ts`
- `src/pearlFlow/checkupTransition.ts`
- `src/pearlFlow/index.ts`
- `src/pearlFlow/progressViewModel.ts`
- `src/pearlFlow/__tests__/stage5g1ScheduleVerification.test.ts`
- `docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5G_1.md`

## 38. Concurrent External Changes

Initial preflight showed many existing modified and untracked files from prior Stage 5 work. Final status only shows the Stage 5G.1 task-owned files above. No destructive Git command, checkout, reset, staging, commit, branch, push, package install, or lockfile change was performed by this pass.

## 39. No Install/Lockfile/Git Mutation Confirmation

Confirmed:

- No package install.
- No lockfile change.
- No staging.
- No commit.
- No branch creation.
- No push.
- No destructive Git command.

## Stage Decisions

STAGE 5G VERIFIED

STAGE 5H UNBLOCKED

STAGE 5H REQUIRED

STAGE 5 REMEDIATION STILL REQUIRED

BETA AUTOMATIC PLAN GENERATION BLOCKED

STAGE 4 REMEDIATION STILL REQUIRED

STAGE 3D-B REQUIRED

BETA DEVICE VALIDATION REQUIRED
