You are implementing Stage 5G of Pearl’s production-readiness work:

FOUR-WEEK BLOCK SCHEDULING, TRAINING-WEEK STATE, ONE-CREDIT-PER-DAY, LAPSE/RESTART RECOVERY, RE-TEST TIMING, AND DATE/RESTORE DETERMINISM

This is a focused production-code remediation task following the completed and verified Stage 5A–5F work.

Do not begin Stage 5H, Stage 3D-B, further Stage 4 remediation, beta-device validation, or broad workout-generation redesign in this task.

## Required prior reading

Read these documents in full before changing code:

- docs/audits/PEARL_LOGIC_AUDIT_STAGE_0.md
- docs/audits/PEARL_LOGIC_AUDIT_STAGE_1.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_1A.md
- docs/audits/PEARL_LOGIC_AUDIT_STAGE_2.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_2A.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_2A_1.md
- docs/audits/PEARL_LOGIC_AUDIT_STAGE_3.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3A.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3B.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3C.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_3C_1.md
- docs/audits/PEARL_LOGIC_AUDIT_STAGE_3D.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_A.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_C.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_D.md
- docs/audits/PEARL_LOGIC_AUDIT_STAGE_4.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4A.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4B.md
- docs/audits/PEARL_LOGIC_AUDIT_STAGE_5.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5A.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5B.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5B_1.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5C.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5D.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5D_1.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5E.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5E_1.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5F.md

Treat the current working tree as the source of truth. Re-verify every relevant path before editing because report line numbers and implementation details may no longer be exact.

## Verified baseline entering Stage 5G

Stage 5A is complete:

- only explicit active-block, block-generated, valid-template A/B/C events can count;
- non-training events do not affect rotation;
- all-skipped, zero-work, malformed, unmatched, and missing-result attempts receive no main-plan credit;
- explicit planned dates are authoritative;
- duplicate main-plan credit is deduped;
- week completion requires credited A/B/C template coverage rather than three arbitrary rows.

Stage 5B and Stage 5B.1 are complete and verified:

- main-plan credit requires completed primary work matching the concrete active MovementBlock focus;
- supporting-only, fallback-only, wrong-domain, missing-metadata, and legacy-fallback work is non-credit;
- short sessions do not receive automatic credit;
- restore cannot promote false focus credit.

Stage 5C is complete:

- current planning never silently falls back to legacy;
- generation failures return typed recovery states;
- valid supporting current sessions remain distinct and non-credit.

Stage 5D and Stage 5D.1 are complete and verified:

- `ladderProgressById` plus `appliedProgressionEventIds` is the sole current progression state;
- progression is exercise-local, per-ladder, feedback-gated, and idempotent;
- restore does not replay progression;
- canonical tab order is Today → Plan → Progress → Explore.

Stage 5E and Stage 5E.1 are complete and verified:

- daily readiness/discomfort is normalized once;
- safety precedes readiness and credit;
- temporary daily regression does not mutate persistent ladder state;
- cautious, short, and discomfort-adjusted sessions use `hold_only`;
- app and website TypeScript projects are independently green.

Stage 5F is complete:

- profile/safety `availableEquipment` is the canonical equipment authority;
- explicit no-equipment differs from unknown;
- legacy equipment cannot override current planning;
- current plans carry immutable equipment snapshots/fingerprints;
- stale unstarted plans are invalidated after equipment changes;
- remote structured stimulus/session metadata round-trips;
- pre/post-restore planning uses the same canonical equipment semantics.

Stage 5F validation passed:

- targeted: 8 suites / 101 tests;
- regression slice: 8 suites / 112 tests;
- full suite: 92 suites / 721 tests;
- app typecheck passed;
- website typecheck passed;
- Expo config passed with the existing Sentry warning;
- `git diff --check` passed.

Do not weaken or bypass any of these contracts.

## Why Stage 5G is required

The product promises a personalised four-week block with three planned sessions per week and an official re-test after the block.

Earlier audits found that the actual timing semantics were not explicit enough.

Open questions include:

- Is a “week” a calendar window, an arbitrary count of three sessions, or a completion cycle?
- Can users complete A/B/C in three consecutive days and immediately begin the next week?
- Can twelve sessions be compressed into twelve consecutive days and still be called a four-week block?
- What happens when a user misses one or more sessions?
- Does calendar time alone move or complete the block?
- Can an extra/manual/restart session alter week timing?
- Does a restart session count as the due A/B/C template?
- When exactly does the official re-test become due?
- Can a re-test become due on the same day as the final training session?
- Can same-day duplicate sessions earn multiple main-plan credits?
- How do local date keys, midnight, timezone changes, restore ordering, and offline completion affect the schedule?
- Can stale counters disagree with credited completion history?
- Can block/week/re-test transitions fire twice after retry or restore?

Stage 5G must create one deterministic, completion-backed, calendar-aware scheduling contract.

## Conservative Stage 5G product policy

Use this policy unless the current repository contains a newer explicit product-owner decision that directly conflicts. If such a conflict exists, stop before implementing the conflicting part and document it.

### 1. The block is hybrid: completion-backed and calendar-paced

A Pearl block contains:

- 4 sequential training weeks;
- 3 required main-plan templates per week:
  - A;
  - B;
  - C;
- 12 credited main-plan sessions total.

A training week completes only when its credited A/B/C set is complete.

Calendar time alone cannot complete:

- a session;
- a week;
- the training phase;
- a block;
- a re-test.

Each training week also lasts at least seven calendar days.

This prevents the four-week block from being compressed into a few days while allowing missed sessions to extend the block without punishment.

### 2. Training-week start and unlock rule

For week 1:

```text
weekStartDateKey = blockStartDateKey
```

For week N+1:

```text
scheduledBoundary = addCalendarDays(previousWeekStartDateKey, 7)
dayAfterLastCredit = addCalendarDays(previousWeekLatestCreditedDateKey, 1)
nextWeekStartDateKey = max(scheduledBoundary, dayAfterLastCredit)
```

Week N+1 is available only when:

- week N has credited A, B, and C;
- the current schedule date is on or after `nextWeekStartDateKey`.

Consequences:

- Completing A/B/C early creates `week_complete_waiting`.
- The user cannot begin the next main-plan week early.
- Missing A/B/C extends the current week until they are completed.
- Once a late week completes, the next week begins no earlier than the next calendar day.
- No shame, reset, or lost credit is applied.

### 3. Canonical A/B/C order

The planned order remains:

```text
A -> B -> C
```

The scheduler derives the next due template from credited template coverage.

For restored or out-of-order valid evidence:

- A/C credited -> B due;
- B only -> A due;
- duplicate A -> B due;
- unknown or wrong-block template -> ignored.

Do not discard valid out-of-order credits, but do not let them change the canonical missing-template order.

### 4. At most one credited main-plan session per schedule date

A block may receive at most one credited A/B/C main-plan completion for a given canonical date key.

Rules:

- a zero-work or non-credit attempt does not consume the day;
- a later valid retry on the same day may earn the day’s credit;
- after one credited main-plan completion, another main-plan attempt that day is saved as extra/non-credit for schedule purposes;
- duplicate representations of the same completion count once;
- two different credited templates on the same date do not advance the schedule twice;
- extra/manual/supporting sessions may still be performed according to current product rules but do not affect block timing.

This protects recovery time and prevents accelerated block completion.

### 5. Week-complete waiting state

After credited A/B/C but before the next week unlock date:

- no new main-plan A/B/C session is due;
- return a typed `week_complete_waiting` or equivalent state;
- preserve the active block;
- show when the next week begins;
- optional Explore/supporting sessions remain non-credit;
- no progression/main-plan mutation occurs merely from waiting.

Do not treat waiting as a generator failure.

### 6. Missed sessions extend rather than skip

If the seven-day window ends and A/B/C is incomplete:

- remain in the same training week;
- keep the earliest missing template due;
- do not auto-skip it;
- do not auto-credit it;
- do not increment week number;
- do not automatically offer the official re-test;
- copy should use clean-slate/resume language.

### 7. Lapse policy

Calculate lapse from the latest credited main-plan completion for the active block.

If no credited completion exists, calculate from the block’s start date key.

Use these product states:

- `active`:
  - fewer than 7 full calendar days since the reference credit/start;
- `resume_gently`:
  - 7–13 full calendar days;
- `restart_recommended`:
  - 14 or more full calendar days.

Do not archive, reset, regress, or complete the block automatically because of lapse.

Do not use shame/streak-loss language.

### 8. Restart-session policy

When `restart_recommended`:

- offer a block-generated restart session based on the currently due A/B/C template;
- preserve the active block/week/template;
- restart session must use all Stage 4A–5F safety, equipment, focus-credit, and current-planner contracts;
- restart session receives main-plan credit only if:
  - it is tied to the currently due template;
  - it earns Stage 5A/5B credit;
  - no main-plan credit has already been used for that date;
- restart credit satisfies that due template exactly once;
- restart session uses `hold_only` progression under Stage 5E;
- a supporting-only restart remains non-credit;
- no separate extra week credit is created.

A restart session is a gentler route back into the same block, not a new block and not an extra completion.

### 9. Quick re-check after lapse

If existing UX offers a quick/manual re-check:

- it may be offered after a long lapse;
- it remains non-official;
- it does not complete the block;
- it does not rewrite the block focus;
- it does not advance A/B/C;
- it does not replace the official re-test.

Do not implement a new measurement flow if none exists.

### 10. Training-phase completion

The training phase completes only when all four training weeks have credited A/B/C coverage under the scheduling rules.

That means:

- 12 credited main-plan templates;
- at most one schedule credit per canonical date;
- each week respected its minimum seven-day start/unlock boundary.

After week 4 completes:

- the MovementBlock remains active;
- enter `training_complete_waiting_retest` or equivalent;
- do not archive/complete the MovementBlock yet;
- do not create the next block yet.

### 11. Official re-test timing

The official re-test becomes due no earlier than:

```text
max(
  addCalendarDays(blockStartDateKey, 28),
  addCalendarDays(finalCreditedSessionDateKey, 1)
)
```

Requirements:

- all four weeks must be training-complete;
- the final training session and official re-test cannot receive the same date key;
- if the user completes training later than day 28, the re-test becomes due the next calendar day;
- if the user finishes training early, wait until the four-week boundary;
- calendar day 28 without 12 credited sessions does not make the official re-test due;
- manual/quick Check-Ups do not satisfy the official re-test;
- only a valid complete current-version official re-test completes the block and can create the next block.

### 12. Block completion

A MovementBlock becomes completed/archived only after:

- training phase complete;
- re-test timing gate satisfied;
- valid complete current-version official re-test;
- existing Stage 3B/3C source/version/identity gates;
- idempotent block-report and next-block transition.

Elapsed time alone never completes or archives the block.

### 13. Current date is explicit

Scheduling helpers must receive an explicit current date/date key.

Do not call `new Date()` inside pure block scheduling when an explicit date is available.

Use the Stage 5A planned-date contract.

### 14. Canonical date-key policy

Re-use and harden the existing canonical `YYYY-MM-DD` date-key utilities.

Requirements:

- validate date-key shape and real calendar validity;
- perform calendar-day arithmetic on date components, not raw `24 * 60 * 60 * 1000` duration arithmetic;
- DST transitions must not add or remove a training day;
- input order does not alter results;
- no locale-string parsing;
- planning/completion date keys remain immutable;
- current device timezone changes must not rewrite historical event date keys.

If the existing app already stores an authoritative schedule timezone, use it consistently.

If it does not, use stored local date keys as the schedule ledger and document the travel-timezone limitation. Do not add a new dependency.

### 15. Future and pre-block events fail closed

A completion event must not affect the block schedule if its date key is:

- before the block start date key;
- malformed;
- missing;
- from another block;
- from another template set;
- in the future relative to the explicit schedule-evaluation date;
- source/credit-invalid under Stage 5A/5B.

Preserve excluded records historically and emit diagnostics.

### 16. Same-date deterministic tie breaking

When multiple distinct credit-looking events exist on one date:

1. discard ineligible/duplicate representations;
2. sort by authoritative completion timestamp when valid;
3. use stable completion id as a tie breaker;
4. count at most the first schedule-eligible event;
5. classify later events as `daily_credit_already_used`.

Do not use input array order.

### 17. Derived schedule state is authoritative

Create one pure scheduler derived from:

- active MovementBlock;
- required A/B/C templates;
- block start date key;
- credited main-plan completion events;
- explicit current date key.

Do not trust mutable counters such as:

- raw session count;
- stored week count;
- calendar week number;
- number of all completion rows.

Persisted schedule summaries may be cached, but restore must validate/recompute them from authoritative event evidence.

### 18. Schedule state contract

Create or harden a typed result conceptually similar to:

```ts
type BlockScheduleState = {
  policyVersion: number;
  blockId: string;
  blockStartDateKey: string;
  currentDateKey: string;
  currentWeekIndex: 0 | 1 | 2 | 3;
  currentWeekNumber: 1 | 2 | 3 | 4;
  currentWeekStartDateKey: string;
  nextWeekUnlockDateKey?: string;
  requiredTemplateIds: readonly string[];
  creditedTemplateIds: readonly string[];
  nextTemplateId?: string;
  totalCreditedMainPlanSessions: number;
  lastCreditedDateKey?: string;
  lapseState: 'active' | 'resume_gently' | 'restart_recommended';
  status:
    | 'session_due'
    | 'week_complete_waiting'
    | 'training_complete_waiting_retest'
    | 'retest_due'
    | 'block_completed'
    | 'schedule_unavailable';
  retestNotBeforeDateKey?: string;
  diagnostics: readonly BlockScheduleDiagnostic[];
};
```

Adapt to actual architecture.

Requirements:

- pure;
- deterministic;
- exhaustive;
- JSON-safe;
- no hidden clock access;
- stable reason codes;
- no state mutation.

### 19. One schedule-credit classifier

Build on Stage 5A/5B rather than reimplementing credit.

A completion is schedule-eligible only when:

- Stage 5A main-plan identity is valid;
- Stage 5A work evidence is valid;
- Stage 5B focus credit is positive;
- it belongs to the active block;
- it maps to a required A/B/C template;
- it has a valid immutable planned date key;
- it is not duplicate evidence;
- the date has not already consumed a schedule credit.

Restart sessions are eligible only under the restart rules above.

### 20. Existing A/B/C generator uses the schedule state

Current planning should use the authoritative scheduler to determine:

- current training week;
- next due template;
- week waiting;
- training complete;
- re-test due;
- restart recommendation;
- daily credit already used.

Do not let `getTemplateSelection` or raw recent-session counts maintain a conflicting independent schedule.

Prefer one schedule helper feeding the existing generator/template selection.

### 21. More-than-three-session behavior

After a week has credited A/B/C:

- additional guided attempts before the next week unlock do not create main-plan credit;
- they may be offered as extra/supporting sessions only if current product flow explicitly supports that;
- they do not progress block timing;
- they do not start next week early.

After one credited main-plan session on a date:

- another main-plan session that date cannot receive schedule/main-plan credit;
- it must not create A/B/C advancement or official progression evidence.

### 22. Main-plan credit vs schedule credit

Stage 5A/5B determines whether the session earned valid main-plan training credit.

Stage 5G adds calendar/schedule eligibility.

A completed session must satisfy both to advance the block schedule.

If a Stage 5A/5B-valid session occurs:

- before its week unlock;
- after daily credit was already used;
- for a template not currently schedule-eligible;

preserve it as historical/non-schedule-credit rather than rewriting it as invalid work.

It must not advance:

- A/B/C schedule coverage;
- week completion;
- training-phase completion;
- re-test timing.

Document whether adherence display still shows it as useful training and keep product copy honest.

### 23. Progression interaction

Only schedule-credited current main-plan completions may provide official Stage 5D progression evidence.

This is the conservative Stage 5G rule.

Therefore:

- same-day second main-plan session does not progress;
- early next-week attempt does not progress;
- waiting-period extra/supporting work does not progress;
- restart session may progress only according to Stage 5E `hold_only`;
- non-schedule-credit history remains preserved.

Update Stage 5D eligibility by reusing schedule-credit metadata, not by duplicating date logic.

### 24. Milestones, adherence, and Progress

Week/session/block counts shown in:

- Today;
- Plan;
- Progress;
- milestones;
- re-test due state;
- Support Circle summaries;
- backend reports;

must derive from schedule-credited A/B/C coverage, not raw completion row count.

Do not count:

- same-day second credits;
- extra/manual/micro/re-test events;
- non-credit attempts;
- future/pre-block events;
- early next-week attempts.

### 25. Lapse copy and recovery

Use Pearl’s existing tone:

#### Resume gently

- “Your next session is ready when you are.”
- “Your plan is still here.”

#### Restart recommended

- “Clean slate.”
- “Start with a shorter session to ease back in.”
- “You’re back. That’s the important part.”

Avoid:

- lost streak;
- failure;
- behind;
- overdue shame;
- punishment;
- medical claims.

### 26. No implicit block reset

No lapse duration automatically:

- deletes history;
- resets A/B/C coverage;
- resets week 1;
- changes focus;
- creates a new block;
- archives the current block;
- rewrites ladder progress.

A user-triggered explicit restart-block flow, if it exists, remains separate and must preserve audit/history.

### 27. Local persistence

Persist only the fields required to preserve authoritative identity and efficient restore, such as:

- block start date key;
- schedule policy version;
- credited completion metadata already present;
- cached schedule summary if used;
- latest schedule evaluation date key if needed;
- re-test not-before date key if derived and validated.

Do not persist mutable derived counters as sole authority.

Old records missing schedule fields:

- use authoritative block start/completion events when possible;
- fail conservatively when timing cannot be reconstructed;
- do not invent credited sessions;
- do not rewrite on read.

### 28. Backend sync/restore

Preserve:

- block schedule policy/version;
- block start date key;
- credited completion planned date keys;
- session/template/block/source identity;
- schedule-credit outcome/reason where useful;
- restart-session source;
- re-test not-before state if cached;
- immutable history.

Requirements:

- restore recomputes or validates the schedule;
- duplicate local/remote events dedupe;
- remote ordering does not alter outcome;
- future/pre-block malformed events remain excluded;
- stale cached week/re-test state cannot override recomputation;
- no unavailable/waiting state syncs as a completion;
- no database migration unless current JSON storage cannot preserve the narrow fields.

### 29. Restore ordering

On fresh restore:

1. Resolve profile/canonical equipment from Stage 5F.
2. Restore active MovementBlock.
3. Restore authoritative current progression.
4. Restore credited main-plan completions and generated summaries.
5. Derive/validate block schedule.
6. Only then plan today’s session.

Do not plan from partial schedule state.

### 30. Block/re-test idempotency

The following transitions must be one-shot/idempotent:

- week complete;
- week unlock;
- training phase complete;
- re-test due;
- official re-test report creation;
- block completion/archive;
- next-block creation.

Repeated app resume, restore, sync retry, button tap, or callback must not duplicate them.

Re-use existing stable ids/guards from Stage 3C and Stage 5A–5F.

### 31. Observability

Emit safe structured diagnostics for:

- invalid date key;
- event before block start;
- future event excluded;
- daily credit already used;
- duplicate event deduped;
- early next-week event excluded;
- week waiting;
- lapse state transition;
- restart session offered/credited/non-credit;
- training complete;
- re-test not yet due;
- re-test due;
- schedule cache mismatch;
- restore recomputation;
- clock/date anomaly.

Include only:

- reason code;
- block/template/completion ids where safe;
- date keys;
- week number;
- schedule status;
- lapse state;
- counts.

Exclude:

- pose/video/landmarks;
- health notes;
- free-text symptoms;
- auth data;
- raw payload dumps.

Keep pure helpers side-effect free.

## Primary objective

Implement one deterministic block schedule so that:

1. Pearl’s four-week block cannot be compressed into a few days.

2. Each week requires credited A/B/C and at least seven calendar days.

3. Missed sessions extend the current week rather than being skipped.

4. At most one main-plan schedule credit is granted per date.

5. Lapse states are explicit and non-punitive.

6. Restart sessions re-enter the current due template safely.

7. The official re-test is not due until training is complete and timing gates are met.

8. Calendar time alone never completes the block.

9. Date/time/restore ordering cannot change the schedule.

10. Week, block, re-test, milestone, Progress, and progression consumers use the same schedule truth.

11. Block/re-test transitions are idempotent.

12. Stage 5H is unblocked only when no P0/P1 timing/lapse/re-test gap remains.

## Scope boundary

This task may change:

- block schedule/date utility helpers;
- MovementBlock schedule metadata;
- A/B/C template selection;
- session planning result types;
- lifecycle/re-test due logic;
- restart-session planning;
- same-day credit gating;
- schedule-credit metadata;
- adherence/milestone/Progress week counts;
- local serialization;
- backend block/training/session sync and restore;
- narrow Today/Plan/Progress/recovery copy;
- tests;
- the Stage 5G remediation report.

This task must not change:

- Stage 5F canonical equipment rules;
- Stage 5E pain/readiness rules;
- Stage 5D progression thresholds/event architecture;
- Stage 5C current-planner authority;
- Stage 5B primary-focus credit;
- Stage 5A work/main-plan identity;
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

2. Record exact output in the remediation report.

3. Treat all existing modifications and untracked files as user-owned.

4. Inspect current diffs in every file Stage 5G may touch.

5. Do not revert, overwrite, reformat, move, or delete unrelated work.

6. Do not edit prior reports.

7. Do not use destructive Git commands.

8. Do not install packages.

9. Do not modify lockfiles.

10. Do not stage, commit, create a branch, or push.

11. If unrelated files change:
    - record them;
    - do not overwrite them;
    - continue only when task-owned edits remain safe;
    - otherwise stop code mutation and report the conflict.

## Step 1: Reconstruct every current timing/schedule path

Before editing, inspect at minimum:

- App.tsx
- src/adherence/dateUtils.ts
- src/adherence/types.ts
- src/adherence/blockService.ts
- src/adherence/adherenceService.ts
- src/adherence/milestoneService.ts
- src/adherence/screens/RestartSessionScreen.tsx
- src/pearlFlow/appLifecycle.ts
- src/pearlFlow/blockAutomation.ts, if present
- src/pearlFlow/mainPlanEvents.ts
- src/pearlFlow/sessionPlanning.ts
- src/pearlFlow/planViewModel.ts
- src/pearlFlow/progressViewModel.ts
- src/pearlFlow/types.ts
- src/training/workoutGeneration.ts
- src/training/block.ts
- src/training/dynamicState.ts
- src/training/serialize.ts
- src/screens/TodayScreen.tsx
- src/screens/PlanScreen.tsx
- src/screens/ProgressScreen.tsx
- src/screens/SessionPreviewScreen.tsx
- src/services/backend/blockSyncService.ts
- src/services/backend/trainingStateSyncService.ts
- src/services/backend/sessionSyncService.ts
- src/services/backend/restoreService.ts
- block-report/re-test services;
- all date/lifecycle/block/session/restore tests.

Search for:

- `week`
- `weekIndex`
- `currentWeek`
- `sessionsPerWeek`
- `completedThisWeek`
- `totalCompleted`
- `week_complete`
- `block_complete`
- `retest_due`
- `retest_prep`
- `restart`
- `lapse`
- `inactive`
- `14`
- `28`
- `dateKey`
- `plannedDateKey`
- `startedAt`
- `completedAt`
- `now`
- `new Date`
- `addDays`
- `differenceInDays`
- raw completion counts.

Document:

- every schedule state/counter;
- every timing helper;
- every week-complete consumer;
- every re-test due consumer;
- current restart behavior;
- current lapse thresholds;
- current date-key arithmetic;
- current same-day behavior;
- current sync/restore fields;
- current duplicate transition guards.

Do not edit until this trace is complete.

## Step 2: Create canonical date-key utilities

Create or harden pure utilities for:

- validate date key;
- compare date keys;
- add calendar days;
- difference in calendar days;
- max date key;
- sort events deterministically.

Requirements:

- real calendar validation;
- leap year;
- month/year boundaries;
- DST independent;
- no locale parsing;
- no raw 24-hour millisecond arithmetic;
- deterministic;
- non-mutating.

Tests:

- month end;
- year end;
- February/leap year;
- spring/fall DST date keys;
- malformed dates;
- ordering;
- negative differences;
- same date.

## Step 3: Define schedule policy constants

Centralize:

```ts
BLOCK_TRAINING_WEEK_COUNT = 4
MAIN_PLAN_TEMPLATES_PER_WEEK = 3
TRAINING_WEEK_MIN_CALENDAR_DAYS = 7
BLOCK_MIN_CALENDAR_DAYS = 28
RESTART_RECOMMENDED_AFTER_DAYS = 14
RESUME_GENTLY_AFTER_DAYS = 7
MAX_SCHEDULE_CREDITS_PER_DATE = 1
BLOCK_SCHEDULE_POLICY_VERSION = 1
```

Adapt names.

Do not scatter literals.

Tests assert positive integer relationships and the four-week contract.

## Step 4: Implement schedule-credit classification

Build on Stage 5A/5B.

Direct tests:

- valid credited A/B/C;
- non-credit attempt;
- supporting/fallback-only;
- zero-work;
- extra/manual/micro/re-test;
- wrong block;
- invalid template;
- missing/malformed date;
- pre-block event;
- future event;
- duplicate representation;
- same-day second distinct completion;
- restart session for current due template;
- restart for wrong template;
- early next-week attempt.

Return stable exclusion reasons.

## Step 5: Implement one pure block scheduler

Input:

- current MovementBlock;
- required template map;
- schedule-eligible completion events;
- explicit current date key.

Output:

- exhaustive `BlockScheduleState`.

Requirements:

- derive weeks sequentially;
- enforce minimum seven-day week duration;
- enforce one credit per date;
- canonical missing-template order;
- missed week extends;
- early next-week events excluded from schedule credit;
- deterministic same-date tie-break;
- derive lapse state;
- derive re-test not-before;
- no mutation;
- no hidden clock;
- diagnostics retained.

Add exhaustive unit tests.

## Step 6: Week transition tests

At minimum:

### Week 1

- no credits -> A due;
- A -> B;
- A/B -> C;
- A/B/C before day 7 -> waiting;
- day 7 boundary -> week 2 A due;
- A/C -> B;
- duplicate A;
- A and B same date -> only first schedule credit;
- incomplete after day 7 -> missing template remains due.

### Weeks 2–4

- same rules;
- week 2 cannot begin before computed start;
- late week completion extends block;
- week 4 complete early waits for re-test boundary;
- week 4 complete late sets re-test next day.

## Step 7: One-credit-per-day integration

At completion boundary:

- calculate schedule eligibility before final schedule mutation;
- valid Stage 5A/5B work can be preserved as useful history even when schedule credit is denied;
- schedule-denied second same-day session:
  - does not enter A/B/C coverage;
  - does not advance week;
  - does not provide Stage 5D progression;
  - does not trigger milestones/re-test;
  - carries explicit reason.

Do not deny a later same-day retry if earlier attempt was non-credit.

Add App/service-level tests.

## Step 8: Update template selection and planning states

Current planning must handle:

- `session_due`;
- `week_complete_waiting`;
- `training_complete_waiting_retest`;
- `retest_due`;
- `restart_recommended`;
- Stage 5C unavailable states;
- Stage 5B supporting sessions.

Use the scheduler’s `nextTemplateId`.

Do not maintain conflicting raw-count logic in `getTemplateSelection`.

Remove or quarantine old schedule counting where current planning no longer uses it.

## Step 9: Implement lapse and restart flow

Tests:

- no completion, 0–6 days;
- no completion, 7–13 days;
- no completion, 14+ days;
- lapse mid-week;
- lapse after A;
- lapse after A/B;
- lapse after week complete while waiting;
- restart session planned for correct due template;
- restart primary work credited;
- restart supporting-only non-credit;
- restart same-day daily credit used;
- restart uses hold-only progression;
- quick re-check remains non-official;
- no auto reset/archive.

Ensure copy and lifecycle state align.

## Step 10: Implement training-complete and re-test timing

Tests:

- day 28 but incomplete training -> no official re-test due;
- 12 credited sessions before day 28 -> waiting;
- 12 credited on/after day 28 -> due next day after final session;
- final session and re-test same date -> blocked;
- manual recheck does not complete block;
- valid official re-test before not-before date -> blocked/fail closed;
- valid official re-test on/after due date -> existing completion path;
- repeated official re-test callback -> one report/block completion/next block.

Do not change Stage 3B/3C official re-test evidence rules.

## Step 11: Update lifecycle and UI view models

Update only narrow state/copy.

### Today

- next due A/B/C;
- week complete waiting;
- resume gently;
- restart recommended;
- training complete waiting;
- re-test due.

### Plan

- current training week 1–4;
- credited A/B/C;
- next unlock date when waiting;
- no false overdue/shame.

### Progress

- schedule-credited session counts;
- four-week training phase;
- re-test due state.

Tests assert no raw row counts are used.

## Step 12: Milestone and adherence integration

Milestones must use:

- schedule-credited templates;
- week-complete transitions;
- training-phase completion.

Do not fire:

- week complete twice;
- week complete from three same-day sessions;
- week complete from non-training;
- block complete from elapsed time;
- re-test due milestone before not-before date.

Use stable transition ids where necessary.

## Step 13: Progression integration

Update Stage 5D eligibility to require schedule credit.

Tests:

- normal schedule-credit session can progress;
- same-day second session cannot progress;
- early next-week session cannot progress;
- restart credited session is hold-only;
- waiting-period extra cannot progress;
- restore replay remains blocked.

Do not change progression thresholds.

## Step 14: Serialization and restore

Persist/restore:

- block start date key;
- schedule policy version;
- schedule-credit metadata/reasons where stored;
- restart source;
- completion planned date key;
- cached schedule only if validated.

Tests:

- round-trip;
- stale cached week count ignored;
- event order randomization;
- local/remote duplicates;
- old block missing start date key;
- malformed date;
- future event;
- pre-block event;
- no read-time rewrite;
- same derived schedule before/after restore.

## Step 15: Backend sync/restore

Re-verify:

- MovementBlock sync;
- training-state sync;
- session completion sync;
- block report sync;
- restore ordering.

Tests prove:

- schedule inputs survive;
- same-day denied credit remains denied;
- remote order does not matter;
- duplicate completion dedupes;
- cached re-test state cannot override derivation;
- no unavailable/waiting state syncs as completion;
- official re-test transition remains idempotent.

## Step 16: Date/time adversarial tests

Cover:

- month/year/leap boundaries;
- DST date-key dates;
- planning just before/after midnight using explicit date;
- device clock/date moves backward;
- future-dated restored completion;
- same timestamp different ids;
- missing timestamp valid planned date;
- timezone change does not rewrite stored date keys;
- reordered restore;
- app resume on unlock date;
- app resume after long lapse.

If a clock anomaly cannot be safely resolved, return a typed schedule recovery state rather than inventing progress.

## Step 17: Observability and recovery copy

Add stable diagnostics and calm copy for:

- daily credit already used;
- week complete waiting;
- resume gently;
- restart recommended;
- training complete waiting;
- re-test not yet due;
- re-test due;
- invalid/future/pre-block event;
- schedule unavailable.

Do not expose technical dates unnecessarily, but showing “next week begins Monday” or a formatted date is acceptable using existing UI conventions.

## Required automated test matrix

### A. Date-key utilities

- validity/arithmetic/comparison;
- leap/month/year/DST cases.

### B. Schedule classifier

- eligible/ineligible event matrix;
- same-day;
- restart;
- future/pre-block.

### C. Four weeks

- A/B/C sequences for weeks 1–4;
- early completion;
- late completion;
- missed sessions;
- out-of-order;
- duplicates.

### D. Daily credit

- retry after non-credit;
- second credited session;
- duplicate representation;
- stable tie-break.

### E. Lapse/restart

- active/resume/restart thresholds;
- restart credit and non-credit;
- no reset.

### F. Re-test timing

- early training completion;
- late completion;
- day 28 incomplete;
- next-day rule;
- official vs manual;
- idempotency.

### G. UI/lifecycle

- Today/Plan/Progress states;
- milestones;
- no shame;
- no false counts.

### H. Progression

- schedule-credit requirement;
- same-day/early attempts excluded;
- restart hold-only;
- idempotency.

### I. Persistence/backend

- round-trip;
- ordering;
- duplicate;
- stale cache;
- malformed/future events;
- pre/post-restore equivalence.

### J. Regression

- Stage 4A/4B;
- Stage 5A–5F;
- Stage 3D;
- navigation;
- app/website typechecks;
- scoring/norms unchanged.

## Test-quality requirements

Tests must:

- exercise real scheduler and production consumers;
- use deterministic ids/date keys;
- assert state transitions and non-mutations;
- assert one credit per day;
- assert early next week cannot start;
- assert missed sessions extend;
- assert calendar alone cannot complete;
- assert re-test timing;
- assert restore equivalence.

Tests must not:

- use wall-clock sleeps;
- depend on actual current date;
- install date libraries;
- alter exercise content;
- change progression thresholds;
- implement Stage 5H broadly;
- change scoring/norms;
- mock every layer.

## Validation commands

Run targeted tests for:

- date utilities;
- block scheduler;
- main-plan events;
- session planning;
- app lifecycle;
- block automation;
- adherence/milestones;
- progression evidence;
- training serialization;
- block/session/training-state sync;
- restore;
- Today/Plan/Progress view models;
- Stage 5A–5F regressions.

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
- targeted suite/test counts;
- full suite/test counts;
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

## Manual source verification after tests

Retrace:

### Normal four-week schedule

```text
block start
-> week 1 A/B/C
-> seven-day unlock
-> week 2...
-> week 4
-> re-test not-before
```

### Missed session

Confirm week extends and due template remains.

### Same-day second session

Confirm useful history may remain but schedule/progression do not advance.

### Lapse/restart

Confirm restart targets current due template and uses hold-only progression.

### Re-test

Confirm calendar alone is insufficient and official evidence remains required.

### Restore

Confirm the same completion evidence produces the same schedule.

## Remediation report

Create exactly one new report:

docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5G.md

Do not edit prior reports.

The report must contain:

1. Scope.
2. Initial Git status.
3. Timing/lapse/re-test gaps addressed.
4. Deferred Stage 5H/Stage 4/Stage 3D-B/device work.
5. Prior timing architecture.
6. Stage 5G product policy.
7. Date-key utilities.
8. Schedule policy constants.
9. Schedule-credit classifier.
10. Authoritative block scheduler.
11. Training-week start/unlock behavior.
12. A/B/C behavior.
13. One-credit-per-day behavior.
14. Missed-session behavior.
15. Lapse-state behavior.
16. Restart-session behavior.
17. Training-phase completion.
18. Official re-test timing.
19. Block-completion idempotency.
20. Lifecycle/UI integration.
21. Milestone/adherence/Progress integration.
22. Progression integration.
23. Local serialization/restore.
24. Backend sync/restore.
25. Date/time adversarial behavior.
26. Observability/copy.
27. Files changed.
28. Tests added/changed.
29. Exact validation results.
30. Stage 1–5F regression verification.
31. Remaining Stage 5 blockers.
32. Whether Stage 5H is unblocked.
33. Whether beta automatic plan generation remains blocked.
34. Initial and final Git status.
35. Concurrent external changes.
36. Confirmation that no package install, lockfile change, commit, staging, branch, or push occurred.

## Required invariant outcomes

After Stage 5G:

1. A block has four sequential training weeks.
2. Each week requires credited A/B/C.
3. Each week lasts at least seven calendar days.
4. Early A/B/C completion waits for the next week boundary.
5. Missed sessions extend the week.
6. Calendar time alone cannot complete a week.
7. At most one main-plan schedule credit occurs per date.
8. Non-credit attempts do not consume the date.
9. A retry after non-credit may still earn that date’s credit.
10. A same-day second credited session does not advance schedule/progression.
11. Canonical A/B/C missing-template order remains deterministic.
12. Lapse states are active/resume/restart.
13. Lapse never auto-resets or archives the block.
14. Restart targets the current due template.
15. Credited restart counts once and is hold-only.
16. Supporting restart remains non-credit.
17. Training phase requires four complete weeks.
18. Re-test requires training complete.
19. Re-test waits until at least day 28.
20. Re-test waits until the day after final credited training.
21. Day 28 alone does not make re-test due.
22. Manual/quick re-check does not complete the block.
23. Only valid official re-test completes/archive block.
24. Week/block/re-test transitions are idempotent.
25. Date arithmetic is calendar-based and DST-safe.
26. Invalid/future/pre-block events fail closed.
27. Restore ordering does not change schedule.
28. Cached counters cannot override event-derived schedule.
29. Milestones/Progress use schedule-credit coverage.
30. Stage 5D progression requires schedule credit.
31. Stage 5A–5F protections remain.
32. Stage 4A/4B and Stage 3D remain.
33. Canonical equipment and plan snapshots remain.
34. Canonical tab order remains.
35. App and website typechecks remain.
36. No scoring/norm/Check-Up changes.
37. No unrelated product logic changes.

## Acceptance criteria

Do not mark Stage 5G complete unless:

1. One authoritative pure block scheduler exists.

2. One schedule-credit classifier exists and reuses Stage 5A/5B.

3. Four-week minimum calendar pacing is enforced.

4. Missed sessions extend rather than skip.

5. One-credit-per-date is enforced.

6. A/B/C selection consumes the scheduler.

7. Lapse and restart behavior are explicit and tested.

8. Re-test not-before logic is explicit and tested.

9. Calendar alone cannot complete the block.

10. Official re-test/block transition remains idempotent.

11. Lifecycle/UI/milestones/Progress consume schedule truth.

12. Stage 5D progression consumes schedule credit.

13. Local/backend restore produces equivalent schedule.

14. Date/time adversarial tests pass.

15. Stage 5A–5F regressions pass.

16. Targeted tests pass.

17. Full suite passes.

18. App typecheck passes.

19. Website typecheck passes.

20. Expo config passes.

21. `git diff --check` passes.

22. No new warning is introduced without explanation.

23. No unrelated user work is reverted or overwritten.

24. No package install or lockfile change occurs.

25. No commit, staging, branch, or push occurs.

## Stage decision

At the end of the report, state exactly one:

- STAGE 5G COMPLETE
- STAGE 5G BLOCKED

Also state exactly one:

- STAGE 5H UNBLOCKED
- STAGE 5H BLOCKED

Use `STAGE 5H UNBLOCKED` only if no P0/P1 block-timing/lapse/re-test gap remains.

Also state:

- STAGE 5H REQUIRED
- STAGE 5 REMEDIATION STILL REQUIRED
- BETA AUTOMATIC PLAN GENERATION BLOCKED
- STAGE 4 REMEDIATION STILL REQUIRED
- STAGE 3D-B REQUIRED
- BETA DEVICE VALIDATION REQUIRED

Stage 5G must not declare beta readiness. Stage 5H broad adversarial verification, remaining Stage 4 work, norm provenance, and physical-device validation remain.

## Final Codex response

Return a concise summary containing:

- Remediation report path.
- Whether production code changed.
- Four-week schedule policy.
- Training-week unlock rule.
- A/B/C rule.
- One-credit-per-date rule.
- Missed-session behavior.
- Lapse thresholds.
- Restart-session behavior.
- Training-phase completion rule.
- Official re-test not-before rule.
- Block-completion rule.
- Date-key policy.
- Restore/sync behavior.
- Milestone/Progress behavior.
- Progression schedule-credit behavior.
- Files changed.
- Tests added/changed.
- Targeted validation result.
- Full-suite validation result.
- App typecheck result.
- Website typecheck result.
- Expo config result.
- `git diff --check` result.
- Confirmation that Stage 4A/4B, Stage 5A–5F, Stage 3D, navigation, and TypeScript-boundary protections remain.
- Remaining Stage 5 blockers.
- STAGE 5G COMPLETE or STAGE 5G BLOCKED.
- STAGE 5H UNBLOCKED or STAGE 5H BLOCKED.
- STAGE 5H REQUIRED.
- STAGE 5 REMEDIATION STILL REQUIRED.
- BETA AUTOMATIC PLAN GENERATION BLOCKED.
- STAGE 4 REMEDIATION STILL REQUIRED.
- STAGE 3D-B REQUIRED.
- BETA DEVICE VALIDATION REQUIRED.
- Initial and final Git status.
- Any concurrent external changes.
- Confirmation that no package install, lockfile change, commit, staging, branch, or push occurred.
