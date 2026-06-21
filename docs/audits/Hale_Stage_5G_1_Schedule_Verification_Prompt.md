You are carrying out Stage 5G.1 of Hale’s production-readiness work:

FOUR-WEEK SCHEDULE VERIFICATION, RESTART CREDIT PROOF, SAME-DAY GATING, RE-TEST IDEMPOTENCY, RESTORE EQUIVALENCE, DATE-BOUNDARY HARDENING, AND STAGE 5G SIGN-OFF

This is a narrow verification-and-remediation pass following Stage 5G.

Do not begin Stage 5H, Stage 3D-B, further Stage 4 remediation, beta-device validation, or unrelated product/UI work in this task.

The default expectation is:

1. Reconstruct and verify the current Stage 5G scheduler.
2. Add authoritative tests for the acceptance cases that the Stage 5G report did not prove in enough detail.
3. Modify production code only when a new test exposes a real violation of the locked Stage 5G contract.
4. Rerun all release gates, including the website typecheck.
5. Produce a complete verification report with explicit stage decisions and exact Git evidence.

## Required prior reading

Read these documents in full before changing anything:

- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5G.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5F.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5E_1.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5E.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5D_1.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5D.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5C.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5B_1.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5B.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5A.md
- docs/audits/HALE_LOGIC_AUDIT_STAGE_5.md

Treat the current working tree as the source of truth. Re-verify every relevant path because report line numbers and implementation details may no longer be exact.

## Why Stage 5G.1 is required

Stage 5G reports that it implemented:

- `src/haleFlow/blockSchedule.ts` as the deterministic scheduler;
- schedule-credit metadata through planning, completions, progression evidence, lifecycle/UI, reports, sync, and restore;
- four sequential training weeks;
- three credited A/B/C templates per week;
- one schedule credit per calendar date;
- seven-day week pacing;
- lapse states;
- restart flow integration;
- re-test timing based on:
  - 12 valid scheduled credits;
  - block start + 28 calendar days;
  - the day after the final scheduled credit;
- schedule-derived counts rather than raw completion counters.

Stage 5G reported:

- focused HaleFlow tests: 4 suites / 76 tests passed;
- full Jest: 93 suites / 729 tests passed;
- app typecheck passed;
- Expo config passed;
- `git diff --check` passed.

However, the Stage 5G report does not provide sufficiently explicit proof for all acceptance cases.

Missing or abbreviated evidence includes:

1. No website typecheck result.

2. No explicit final stage decisions:
   - `STAGE 5G COMPLETE` or blocked;
   - `STAGE 5H UNBLOCKED` or blocked;
   - beta-generation status.

3. No final exact Git status, diff inventory, or complete files-changed list.

4. No detailed end-to-end proof that:
   - a restart session targets the currently due A/B/C template;
   - a credited restart satisfies that template exactly once;
   - restart progression is `hold_only`;
   - a supporting-only restart remains non-credit.

5. No detailed end-to-end proof that a second valid main-plan session on the same date:
   - may remain in history;
   - receives no schedule credit;
   - does not advance A/B/C;
   - does not complete the week;
   - does not trigger milestones;
   - does not trigger re-test timing;
   - does not provide official Stage 5D progression evidence.

6. No explicit proof that a same-day retry after an earlier zero-work or non-credit attempt can still earn the date’s schedule credit.

7. No detailed official re-test transition idempotency proof across:
   - repeated callback;
   - repeated button press;
   - app resume;
   - sync retry;
   - restore.

8. No pre/post-restore schedule-equivalence matrix.

9. No explicit stale-cache proof:
   - stale stored week number;
   - stale completion count;
   - stale re-test-due flag;
   - stale schedule summary;
   - reordered completion evidence.

10. No explicit date-boundary matrix for:
    - month/year boundaries;
    - leap year;
    - daylight-saving date keys;
    - midnight using injected dates;
    - device date moving backward;
    - future-dated restored events;
    - pre-block events.

11. No explicit proof that all schedule consumers use the same derived schedule truth:
    - Today;
    - Plan;
    - Progress;
    - milestones;
    - progression;
    - official re-test gating;
    - sync/restore.

12. No explicit verification that calendar age alone cannot make a re-test official when training credits are incomplete.

13. No explicit verification that finishing training early waits for day 28, while finishing late waits until the day after the final credit.

14. No exact targeted command inventory covering all Stage 5G consumers.

Stage 5G.1 must prove these contracts before Stage 5H begins.

## Locked Stage 5G product contract

Do not change these rules during verification.

### 1. Four-week hybrid schedule

A block has:

- 4 sequential training weeks;
- 3 required A/B/C templates per week;
- 12 schedule-credited main-plan sessions total.

A week completes only after credited A/B/C coverage.

Calendar time alone cannot complete:

- a session;
- a week;
- the training phase;
- the MovementBlock;
- the official re-test requirement.

### 2. Minimum seven-day pacing

Each week lasts at least seven calendar days.

Week 1 starts at the block start date.

For the next week:

```text
scheduledBoundary = previousWeekStart + 7 calendar days
dayAfterLastCredit = previousWeekLatestScheduledCredit + 1 calendar day
nextWeekStart = later of those two dates
```

If A/B/C is completed early, the app enters a waiting state.

If A/B/C is completed late, the next week begins no earlier than the next calendar day.

### 3. Canonical A/B/C coverage

The due-template order remains:

```text
A -> B -> C
```

Credited coverage is derived by template identity, not row count.

Examples:

- A/C credited -> B due;
- B only -> A due;
- duplicate A -> B due;
- unknown/wrong-block template -> ignored.

### 4. At most one schedule credit per date

A block receives at most one schedule credit on one canonical date key.

- A non-credit attempt does not consume the date.
- A valid retry later that date may earn credit.
- After one schedule credit, another main-plan session that date is non-schedule-credit.
- Duplicate representations count once.
- Two different valid templates on the same date do not advance twice.

### 5. Missed sessions extend the current week

If seven days pass and A/B/C is incomplete:

- remain in the same week;
- keep the earliest missing template due;
- do not skip;
- do not credit;
- do not increment the week;
- do not make the official re-test due.

### 6. Lapse states

Derive lapse from the latest schedule-credited main-plan completion, or block start when no credit exists.

- `active`: fewer than 7 full calendar days;
- `resume_gently`: 7–13 full calendar days;
- `restart_recommended`: 14 or more full calendar days.

Lapse does not automatically:

- reset history;
- reset week/template coverage;
- change focus;
- archive the block;
- create a new block;
- rewrite ladder progression.

### 7. Restart session

A restart session:

- targets the currently due A/B/C template;
- remains part of the same block/week;
- uses all Stage 4A–5F safety, equipment, focus-credit, and planning contracts;
- earns schedule/main-plan credit only if it passes Stage 5A/5B and the date is unused;
- satisfies the due template exactly once;
- uses Stage 5E `hold_only` progression;
- remains non-credit if supporting-only/fallback-only/zero-work;
- is not an extra week/session credit.

### 8. Training-phase completion

Training completes only after all four weeks have credited A/B/C coverage under the schedule rules.

After week 4 training completes:

- the MovementBlock remains active;
- no next block is created yet;
- enter a waiting-for-retest or retest-due state depending on timing.

### 9. Official re-test timing

The official re-test is due no earlier than:

```text
max(
  blockStartDateKey + 28 calendar days,
  finalScheduleCreditedTrainingDateKey + 1 calendar day
)
```

Also required:

- all 12 schedule credits;
- complete current-version official re-test evidence;
- existing Stage 3B/3C source/version/identity gates.

Consequences:

- day 28 with incomplete training -> not due;
- training completed before day 28 -> wait until day 28;
- training completed after day 28 -> wait until next calendar day;
- final training and official re-test cannot share one date key;
- manual/quick re-check cannot complete the block.

### 10. Block completion is idempotent

Only one valid official re-test transition may:

- create one report;
- complete/archive one block;
- create one next block.

Repeated callback/button/resume/sync/restore must not duplicate these effects.

### 11. Explicit dates only

Pure schedule logic receives explicit date keys.

Do not use hidden `new Date()` when an explicit date exists.

Date arithmetic is calendar-based, not raw 24-hour duration arithmetic.

### 12. Event-derived schedule is authoritative

Do not trust stale mutable counters as authority:

- session count;
- week number;
- completed-this-week count;
- cached retest-due boolean;
- cached block-complete boolean.

Cached summaries may exist only when validated against authoritative event evidence.

### 13. Stage 5A/5B schedule eligibility remains authoritative

Only valid Stage 5A/5B main-plan credited events can become schedule credits.

Non-training, supporting-only, fallback-only, zero-work, wrong-block, malformed, missing-focus, and legacy events remain excluded.

### 14. Stage 5D progression requires schedule credit

A Stage 5A/5B-valid session that is not schedule-credited due to:

- same-day daily credit already used;
- early next-week attempt;
- wrong schedule template;

must not provide official Stage 5D progression evidence.

Restart schedule credit remains `hold_only`.

### 15. Historical event preservation

Schedule-ineligible but otherwise useful training may remain in history.

Do not rewrite it as if the user did no work.

But it must not affect:

- A/B/C coverage;
- week completion;
- training-phase completion;
- official re-test timing;
- official progression;
- milestones.

## Primary objectives

Stage 5G.1 must:

1. Reconstruct the current scheduler and all production consumers.

2. Prove the pure date-key utilities and four-week scheduler across boundary cases.

3. Prove the one-credit-per-date rule end to end.

4. Prove non-credit retry behavior on the same date.

5. Prove restart session planning, credit, non-credit, and hold-only progression.

6. Prove training-complete and official re-test timing.

7. Prove official re-test transition idempotency.

8. Prove stale counters/caches cannot override event-derived schedule truth.

9. Prove pre/post-restore schedule equivalence.

10. Prove Today/Plan/Progress/milestones/progression/re-test all consume the same schedule state.

11. Run website typecheck in addition to the app release gates.

12. Produce complete stage decisions and Git evidence.

13. Modify production code only when a new test exposes a real contract violation.

## Scope boundary

This task may change:

- Stage 5G date/schedule helpers, only if tests expose a defect;
- schedule-credit classification;
- restart session schedule integration;
- official re-test transition guards;
- cached schedule validation;
- local/backend schedule normalization;
- narrow UI/view-model state mapping;
- tests;
- the Stage 5G.1 verification report.

This task must not change:

- the approved four-week policy;
- Stage 5A/5B credit rules;
- Stage 5C planner authority;
- Stage 5D numeric progression thresholds or event identity;
- Stage 5E readiness/discomfort policy;
- Stage 5F equipment authority;
- exercise catalogue content;
- scoring;
- norms;
- Check-Up measurement/scoring;
- exact/near focus policy;
- broad UI design;
- dependencies;
- assets.

Do not perform opportunistic refactors.

## Working-tree safety

Before analysis or editing:

1. Run:

```bash
git status --short --untracked-files=all
git diff --name-only
git diff --stat
```

2. Record exact outputs in the verification report.

3. Treat all existing modifications and untracked files as user-owned.

4. Inspect all current diffs in files Stage 5G.1 may touch.

5. Do not revert, overwrite, reformat, move, or delete unrelated work.

6. Do not edit prior reports.

7. Do not use destructive Git commands.

8. Do not install packages.

9. Do not modify lockfiles.

10. Do not stage, commit, create a branch, or push.

11. If unrelated files change:
    - record them;
    - do not overwrite them;
    - continue only when task-owned edits remain safe and unambiguous;
    - otherwise stop production mutation and report the conflict.

## Step 1: Reconstruct the actual Stage 5G architecture

Inspect at minimum:

- src/haleFlow/blockSchedule.ts
- src/haleFlow/sessionPlanning.ts
- src/haleFlow/mainPlanEvents.ts
- src/haleFlow/appLifecycle.ts
- src/haleFlow/planViewModel.ts
- src/haleFlow/progressViewModel.ts
- src/haleFlow/types.ts
- src/haleFlow/blockAutomation.ts, if present
- App.tsx
- src/adherence/dateUtils.ts
- src/adherence/types.ts
- src/adherence/adherenceService.ts
- src/adherence/milestoneService.ts
- src/adherence/screens/RestartSessionScreen.tsx
- src/haleFlow/progressionEvidence.ts
- src/training/dynamicState.ts
- src/training/serialize.ts
- src/screens/TodayScreen.tsx
- src/screens/PlanScreen.tsx
- src/screens/ProgressScreen.tsx
- src/screens/SessionPlanningRecoveryScreen.tsx
- src/services/backend/sessionSyncService.ts
- src/services/backend/trainingStateSyncService.ts
- src/services/backend/blockSyncService.ts
- src/services/backend/blockReportSyncService.ts
- src/services/backend/restoreService.ts
- every Stage 5G test.

Document:

- date-key helper functions;
- schedule policy constants;
- schedule-credit event shape;
- schedule state union;
- week derivation;
- next-template derivation;
- one-credit-per-date logic;
- lapse derivation;
- restart plan source/type/template;
- progression schedule-credit requirement;
- training-complete logic;
- retest-not-before logic;
- official re-test gate;
- block/report/next-block idempotency;
- cached schedule fields;
- local/remote persistence;
- every production consumer of schedule state.

Do not edit until this trace is complete.

## Step 2: Verify date-key utilities exhaustively

Use the actual production utilities.

Cover:

1. Valid normal date.

2. Invalid month/day.

3. Non-leap February 29.

4. Leap-year February 29.

5. Month end:
   - January 31 + 1;
   - April 30 + 1.

6. Year end:
   - December 31 + 1.

7. Leap-year crossings.

8. Same date difference = 0.

9. Earlier/later comparisons.

10. Spring daylight-saving date keys.

11. Autumn daylight-saving date keys.

12. Negative difference.

13. Malformed strings.

14. Input non-mutation.

Required:

- arithmetic is calendar-based;
- no locale parsing;
- no raw 24-hour assumptions;
- deterministic output;
- invalid inputs fail closed.

## Step 3: Verify the pure scheduler for all four weeks

Build complete deterministic schedule fixtures.

### Week 1

- no credits -> A due;
- A -> B;
- A/B -> C;
- A/B/C before day 7 -> waiting;
- unlock boundary -> week 2 A;
- A/C -> B;
- B only -> A;
- duplicate A;
- wrong-block A;
- unknown template;
- future event;
- pre-block event;
- malformed date.

### Week 2

- cannot begin before computed unlock;
- late week-1 completion shifts week-2 start to at least next day;
- A/B/C coverage works;
- incomplete beyond seven days remains week 2.

### Week 3

- same invariants;
- restore/reorder does not alter state.

### Week 4

- early complete -> training complete waiting;
- late complete -> re-test due no earlier than following date;
- incomplete on day 28 -> still session due;
- all 12 credits required.

Assert every derived field:

- current week;
- week start;
- next unlock;
- credited template ids;
- next template;
- total credits;
- last credit date;
- lapse state;
- status;
- retest not-before.

## Step 4: Verify deterministic same-date event resolution

Construct multiple events on one date.

Cases:

1. Duplicate representation of same completion.

2. Two distinct eligible templates same date, distinct timestamps.

3. Same timestamp, stable completion-id tie break.

4. One eligible and one non-credit attempt.

5. One eligible and one wrong-block event.

6. One eligible and one malformed event.

7. Input array reversed.

Required:

- one date produces at most one schedule credit;
- tie-breaking is stable;
- input order does not change the winner;
- duplicate representation is deduped;
- later same-date events are classified `daily_credit_already_used` or equivalent;
- diagnostic reason is stable.

## Step 5: Mandatory same-day retry and second-session end-to-end proof

This is a required Stage 5G.1 acceptance case.

### Retry after non-credit

Sequence:

1. User attempts due A.
2. Attempt is zero-work/supporting-only/fallback-only.
3. No schedule credit is granted.
4. Later on the same date, user completes valid primary-focus A.
5. A receives schedule credit.

Assert:

- first attempt remains historical/non-credit;
- date remains unused after first attempt;
- second attempt advances A exactly once;
- progression applies only for the schedule-credited valid attempt according to Stage 5D/E;
- no duplicate milestone.

### Second valid main-plan session after daily credit used

Sequence:

1. User earns valid schedule credit for A.
2. Later the same date, user completes valid B.

Assert:

- B may remain useful history according to current product representation;
- B receives no schedule credit;
- next due remains B;
- week coverage contains A only;
- no progression from B;
- no milestone/week-complete change;
- no re-test timing change;
- backend/restored state preserves B as non-schedule-credit;
- UI does not claim the plan advanced twice.

Exercise the actual completion/orchestration boundary, not only the pure scheduler.

## Step 6: Mandatory restart-session verification

This is a required Stage 5G.1 acceptance case.

Construct:

1. Active block in week 1/2/3/4 with a due template.

2. Lapse of 14+ calendar days.

3. Restart recommendation.

4. Generated restart session.

Prove:

- restart targets the current due template;
- restart preserves block id/week/focus;
- Stage 4A–5F safety/equipment/focus contracts apply;
- restart is a current block-generated plan, not extra/legacy;
- restart plan uses Stage 5E `hold_only`;
- valid primary completion earns main-plan and schedule credit once;
- due template is satisfied exactly once;
- next due template advances correctly;
- same-day daily-credit rule applies;
- supporting-only restart is non-credit;
- fallback-only restart is non-credit;
- zero-work restart is non-credit;
- duplicate restart completion is idempotent;
- no new block/week is created;
- no permanent ladder regression occurs merely because restart was selected;
- copy remains clean-slate/non-shaming.

Also verify `resume_gently` for 7–13 days does not incorrectly force the 14+ day restart state.

## Step 7: Verify lapse boundaries exactly

Use explicit date keys.

Cover:

- day 0;
- day 6;
- day 7;
- day 13;
- day 14;
- no prior credits;
- prior credits in current week;
- week-complete waiting;
- training-complete waiting.

Required:

- exact boundary behavior;
- lapse never resets coverage;
- lapse never archives/completes block;
- current due template remains stable;
- no hidden clock.

## Step 8: Verify training-complete and re-test timing

Construct full 12-credit schedules.

### Early completion

- final valid credit before day 28;
- status remains training-complete waiting;
- retest not-before = block start + 28 days;
- official retest before boundary remains manual/non-official or fails closed under current flow.

### On-time completion

- final valid credit on/after day 28;
- retest not-before is the day after final credit;
- same-date retest blocked.

### Late completion

- final valid credit after day 28;
- retest due only next calendar day.

### Incomplete training

- day 28, fewer than 12 credits;
- no official re-test due.

### Manual/quick check

- does not satisfy official re-test;
- does not complete block.

Use real lifecycle/re-test gating where practical.

## Step 9: Mandatory official re-test transition idempotency

This is a required Stage 5G.1 acceptance case.

Starting state:

- training complete;
- timing gate satisfied;
- valid complete current-version official re-test.

Exercise:

1. First callback/submit.
2. Repeated callback.
3. Repeated CTA/button.
4. App resume.
5. Backend sync retry.
6. Restore and lifecycle recomputation.

Assert exactly once:

- report creation;
- current block completion/archive;
- next block creation;
- transition id;
- backend upsert identity;
- Progress/history entry.

Assert no duplicate:

- MovementBlock;
- report;
- next-block number;
- completion timestamp mutation;
- lifecycle route.

Also test:

- invalid/partial re-test remains non-transitioning;
- valid re-test before due date remains non-transitioning;
- manual/quick remains non-transitioning.

Reuse Stage 3C/3B idempotent guards rather than creating a parallel transition system.

## Step 10: Verify stale counters and cached schedule cannot override evidence

Construct restored states with deliberately contradictory cached fields:

- cached week 4 but evidence week 1;
- cached completed sessions 12 but evidence 2;
- cached re-test due true but training incomplete;
- cached block complete true but no official re-test;
- cached next template C but evidence A due;
- cached lapse state active but date implies restart;
- cached unlock date wrong;
- cached total credits duplicated.

Required:

- scheduler recomputes from authoritative event evidence;
- stale cache is ignored/replaced in memory;
- no read-time historical rewrite merely from opening;
- malformed cache cannot promote progress;
- diagnostics identify mismatch;
- planning/UI use recomputed schedule.

If current architecture persists a cache, verify it is validated before use.

## Step 11: Mandatory pre/post-restore schedule equivalence

This is a required Stage 5G.1 acceptance case.

For each scenario:

1. Derive schedule locally.
2. Serialize/sync relevant block/training/completion state.
3. Restore into fresh state.
4. Derive schedule again.

Assert exact semantic equivalence:

- status;
- week number;
- week start;
- unlock date;
- credited templates;
- next template;
- total credits;
- daily-credit usage;
- lapse state;
- re-test not-before;
- schedule diagnostics where deterministic.

Scenarios:

- clean week 1;
- week-complete waiting;
- late/incomplete week;
- same-day non-credit + valid retry;
- same-day second valid denied;
- restart recommended;
- credited restart;
- training complete waiting;
- re-test due;
- duplicate local/remote completion;
- reordered remote rows;
- stale cached schedule;
- future/pre-block malformed event.

Restore must not:

- duplicate schedule credit;
- alter winner for same-date tie;
- make re-test due early;
- replay progression;
- promote a non-credit event.

## Step 12: Verify date/time adversarial behavior

Cover:

- block start at month end;
- week unlock across month/year boundary;
- leap day;
- explicit date around spring DST;
- explicit date around autumn DST;
- app plan generated before midnight and completed with immutable planned date;
- device clock/date moves backward;
- future-dated restored event;
- pre-block event;
- same timestamp two ids;
- missing completion timestamp but valid immutable planned date, according to current contract;
- timezone change does not rewrite stored date keys.

If the current design has a known travel-timezone limitation, document it precisely.

Do not invent timezone migration.

## Step 13: Verify all production consumers use one schedule truth

Trace and test:

### Today

- due template;
- waiting;
- resume gently;
- restart recommended;
- training complete waiting;
- re-test due.

### Plan

- week number;
- A/B/C coverage;
- next unlock;
- no raw-row counting.

### Progress

- credited session count;
- four-week progress;
- re-test due;
- no same-day second-session inflation.

### Milestones/adherence

- one week-complete milestone;
- no milestone from same-day second session;
- no milestone from non-credit/extra/manual;
- no duplicate after restore.

### Progression

- only schedule-credited session provides official evidence;
- restart uses hold-only;
- same-day/early-next-week does not progress.

### Official re-test gate

- consumes scheduler status/not-before;
- no independent raw-count or calendar-only logic.

Create a consumer table:

| Consumer | Schedule field used | Old fallback/counter found? | Verification |

Remove or fix a conflicting consumer only if tests prove it still bypasses the scheduler.

## Step 14: Verify sync and restore metadata

Re-verify current compact payloads for:

- block start date key;
- schedule policy version;
- completion planned date;
- schedule-credit outcome/reason;
- restart source;
- block/template/source ids;
- retest not-before cache if present;
- schedule summary cache if present.

Required:

- malformed remote values fail closed;
- stale cache cannot override;
- duplicate local/remote rows dedupe;
- unavailable/waiting states do not sync as completions;
- no raw sensitive data added;
- remote row ordering does not alter schedule.

## Step 15: Verify user-facing waiting/restart/retest copy

At view-model/screen level:

### Week waiting

- clearly says the week is complete;
- gives next unlock date;
- does not imply failure or overdue;
- does not offer a current main-plan session early.

### Resume gently

- plan remains available;
- no shame.

### Restart recommended

- clean-slate/shorter restart;
- no lost streak.

### Training complete waiting

- training phase complete;
- re-test not yet due;
- no false next-block CTA.

### Re-test due

- official re-test CTA available;
- manual/quick remains separate.

No broad redesign.

## Step 16: Production-code restraint

Only change production code when a new authoritative test exposes a violation.

Likely allowable changes:

- schedule-credit classification;
- same-day completion integration;
- restart source/template metadata;
- schedule cache validation;
- re-test transition guards;
- restore normalization;
- view-model state mapping.

Do not assume changes are required.

Document every production change and the exact failing invariant that required it.

## Required automated test matrix

At minimum:

### Date utilities

- validity;
- calendar arithmetic;
- leap/month/year/DST cases.

### Scheduler

- all four weeks;
- early/late/incomplete;
- A/B/C order;
- one-credit-per-date;
- lapse;
- retest timing.

### Completion integration

- non-credit retry;
- same-day second valid;
- duplicate representations;
- progression/milestones.

### Restart

- due template;
- credit;
- non-credit;
- hold-only;
- idempotency.

### Re-test

- early/incomplete/manual blocked;
- due valid;
- transition idempotency.

### Cache/restore

- stale counters;
- pre/post equivalence;
- ordering;
- duplicate;
- malformed/future/pre-block.

### Consumers

- Today;
- Plan;
- Progress;
- milestones;
- progression;
- re-test gate.

### Regression

- Stage 5A–5F;
- Stage 4A/4B;
- Stage 3D;
- navigation;
- app/website TypeScript boundaries;
- scoring/norms unchanged.

## Test-quality requirements

Tests must:

- use real production scheduler/helpers;
- exercise actual completion and re-test boundaries where practical;
- assert mutations and non-mutations;
- use explicit deterministic date keys;
- distinguish main-plan credit from schedule credit;
- assert progression/milestone consequences;
- assert restore equivalence;
- fail if stale counters regain authority.

Tests must not:

- depend on wall-clock sleeps;
- use actual current date;
- install date libraries;
- mock every layer;
- assert only helper invocation;
- change the approved schedule policy;
- implement Stage 5H broadly;
- change scoring/norms.

## Validation commands

Run a targeted Stage 5G.1 suite covering at minimum:

- blockSchedule;
- dateUtils;
- mainPlanEvents;
- sessionPlanning;
- appLifecycle;
- blockAutomation;
- progressionEvidence;
- adherence/milestones;
- Today/Plan/Progress view models;
- block/session/training-state sync;
- restore;
- official re-test/report/next-block transition.

Then run exactly:

```bash
npm test -- --runInBand
npm run typecheck
npm --prefix website run typecheck
npx --no-install expo config --type public
git diff --check
```

Do not install dependencies.

Record:

- exact targeted command;
- targeted exit code;
- targeted suite count;
- targeted test count;
- full-suite exit code;
- full suite count;
- full test count;
- snapshots;
- skipped tests;
- app typecheck;
- website typecheck;
- Expo config;
- diff check;
- Watchman warning;
- Jest open-handle notice;
- Sentry warning;
- any new warnings;
- whether validation changed files.

Stage 5G reported a current full baseline of:

- 93 suites;
- 729 tests.

Verify the current baseline rather than assuming it.

## Manual source verification after tests

Retrace:

### Normal block

```text
block start
-> week 1 A/B/C
-> waiting/unlock
-> weeks 2–4
-> training complete
-> re-test not-before
```

### Same-day retry

Confirm failed attempt does not consume date and valid retry does.

### Same-day second valid

Confirm history may persist but schedule/progression/milestones do not advance.

### Restart

Confirm due template, one credit, hold-only, idempotency.

### Official re-test

Confirm one report/block completion/next block.

### Restore

Confirm identical schedule from identical event evidence.

## Verification report

Create exactly one new report:

```text
docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5G_1.md
```

Do not edit prior reports.

The report must contain:

1. Scope.
2. Why Stage 5G.1 was required.
3. Initial Git status.
4. Current Stage 5G architecture.
5. Locked schedule policy.
6. Date-key utility verification.
7. Four-week scheduler verification.
8. Same-date event resolution.
9. Same-day retry proof.
10. Same-day second-session proof.
11. Lapse boundary proof.
12. Restart-session proof.
13. Training-complete/re-test timing proof.
14. Official re-test transition idempotency.
15. Stale-cache/counter proof.
16. Pre/post-restore schedule equivalence.
17. Date/time adversarial proof.
18. Consumer schedule-truth matrix.
19. Today/Plan/Progress verification.
20. Milestone/adherence verification.
21. Progression schedule-credit verification.
22. Sync/restore metadata verification.
23. User-facing copy verification.
24. Production files changed, if any.
25. Exact reason for each production change.
26. Tests added/changed.
27. Exact targeted validation.
28. Exact full validation.
29. App typecheck result.
30. Website typecheck result.
31. Expo config result.
32. `git diff --check` result.
33. Stage 5A–5F regression verification.
34. Remaining Stage 5 blockers.
35. Whether Stage 5H is unblocked.
36. Initial and final Git status.
37. Complete files-changed inventory.
38. Concurrent external changes.
39. Confirmation that no package install, lockfile change, commit, staging, branch, or push occurred.

## Required invariant outcomes

After Stage 5G.1:

1. The scheduler remains pure and deterministic.
2. Four weeks require A/B/C coverage.
3. Each week respects the minimum seven-day boundary.
4. Missed sessions extend rather than skip.
5. One schedule credit per date is enforced.
6. Non-credit attempt does not consume date.
7. Same-day valid retry can earn credit.
8. Same-day second valid session cannot advance schedule.
9. Same-day second valid session cannot progress ladders.
10. Same-day second valid session cannot trigger milestones/retest timing.
11. Restart targets current due template.
12. Restart credit applies once.
13. Restart progression is hold-only.
14. Supporting/fallback/zero-work restart is non-credit.
15. Lapse boundaries are exact.
16. Training phase requires 12 schedule credits.
17. Day 28 alone is insufficient.
18. Early finish waits until day 28.
19. Late finish waits until next day.
20. Same-date final training/re-test is blocked.
21. Manual/quick re-check cannot complete block.
22. Official re-test transition is idempotent.
23. Stale counters/cache cannot override events.
24. Restore ordering does not alter schedule.
25. Duplicate local/remote evidence does not double count.
26. Future/pre-block/malformed events fail closed.
27. Today/Plan/Progress/milestones consume schedule truth.
28. Stage 5D progression requires schedule credit.
29. Website typecheck passes.
30. Stage 5A–5F protections remain.
31. Stage 4A/4B and Stage 3D remain.
32. Navigation and TypeScript boundaries remain.
33. No scoring/norm/Check-Up changes.
34. No unrelated product logic changes.

## Acceptance criteria

Do not mark Stage 5G verified unless:

1. Date utilities pass boundary tests.

2. The full four-week scheduler matrix passes.

3. Same-day retry and second-session integration are proven.

4. Restart credit/non-credit/hold-only behavior is proven.

5. Re-test timing is proven for early/on-time/late/incomplete training.

6. Official re-test transition idempotency is proven.

7. Stale cache/counters are proven non-authoritative.

8. Pre/post-restore schedule equivalence is proven.

9. All schedule consumers are verified.

10. Stage 5D progression schedule-credit requirement is verified.

11. Stage 5A–5F regressions pass.

12. Targeted tests pass.

13. Full suite passes.

14. App typecheck passes.

15. Website typecheck passes.

16. Expo config passes.

17. `git diff --check` passes.

18. No new warning is introduced without explanation.

19. No unrelated user work is reverted or overwritten.

20. No package install or lockfile change occurs.

21. No commit, staging, branch, or push occurs.

## Stage decisions

At the end of the report, state exactly one:

- `STAGE 5G VERIFIED`
- `STAGE 5G VERIFICATION BLOCKED`

Also state exactly one:

- `STAGE 5H UNBLOCKED`
- `STAGE 5H BLOCKED`

Use `STAGE 5H UNBLOCKED` only if no P0/P1 schedule/lapse/re-test gap remains.

Also state:

- `STAGE 5H REQUIRED`
- `STAGE 5 REMEDIATION STILL REQUIRED`
- `BETA AUTOMATIC PLAN GENERATION BLOCKED`
- `STAGE 4 REMEDIATION STILL REQUIRED`
- `STAGE 3D-B REQUIRED`
- `BETA DEVICE VALIDATION REQUIRED`

Stage 5G.1 must not declare beta readiness.

## Final Codex response

Return a concise summary containing:

- Verification report path.
- Whether production code changed.
- Exact reason for each production change.
- Four-week schedule result.
- One-credit-per-date result.
- Same-day retry result.
- Same-day second-session result.
- Lapse/restart result.
- Restart progression result.
- Training-complete/re-test timing result.
- Official re-test idempotency result.
- Stale-cache result.
- Pre/post-restore equivalence result.
- Date-boundary result.
- Consumer schedule-truth result.
- Files changed.
- Tests added/changed.
- Targeted validation result.
- Full-suite result.
- App typecheck result.
- Website typecheck result.
- Expo config result.
- `git diff --check` result.
- Confirmation that Stage 5A–5F, Stage 4A/4B, Stage 3D, navigation, and TypeScript-boundary protections remain.
- Remaining Stage 5 blockers.
- `STAGE 5G VERIFIED` or `STAGE 5G VERIFICATION BLOCKED`.
- `STAGE 5H UNBLOCKED` or `STAGE 5H BLOCKED`.
- `STAGE 5H REQUIRED`.
- `STAGE 5 REMEDIATION STILL REQUIRED`.
- `BETA AUTOMATIC PLAN GENERATION BLOCKED`.
- `STAGE 4 REMEDIATION STILL REQUIRED`.
- `STAGE 3D-B REQUIRED`.
- `BETA DEVICE VALIDATION REQUIRED`.
- Initial and final Git status.
- Complete files-changed inventory.
- Any concurrent external changes.
- Confirmation that no package install, lockfile change, commit, staging, branch, or push occurred.
