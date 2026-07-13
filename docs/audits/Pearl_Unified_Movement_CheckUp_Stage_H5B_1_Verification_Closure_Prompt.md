You are carrying out the evidence-closure stage for Pearl’s Balanced micro-check implementation:

PEARL UNIFIED MOVEMENT CHECK-UP — STAGE H5B.1
BALANCED MICRO-CHECK END-TO-END VERIFICATION,
DOMAIN NON-REGRESSION,
SCHEDULER / SLOT / CREDIT CONTAINMENT,
PERSISTENCE / RESTORE / REPORT-COUNT PROOF,
AND H5C RELEASE-GATE DECISION

This is a verification-first continuation after Stage H5B.

Do not begin H5C or H5D in this task.

## Why H5B.1 is required

Stage H5B implemented the intended product direction and passed the full repository gate, but its report is intentionally short and does not provide the complete evidence needed before retiring public V1 Check-Up/results routing.

Required H5B report:

```text
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5B_BALANCED_MICRO_CHECK_POLICY.md
```

That report states:

```text
Stage H5B is implemented and verified.
```

and records the Balanced policy:

```text
Week 1 -> strength_power -> chair-power
Week 2 -> balance -> single-leg-balance
Week 3 -> mobility -> mobility-reach
Week 4 -> no micro-check -> balanced_week_4_official_retest
```

It also states:

- scheduler week is authoritative;
- a micro-check becomes due only after at least one schedule-credited session in the active week and before the week completes;
- stable slot identity exists;
- no carry-over/backfill exists;
- domain-focused behavior uses the same resolver;
- launch surfaces use the resolved target;
- stale routes fail closed;
- result/completion records carry slot metadata;
- local save, remote upsert, and restore use slot-first identity;
- micro-checks remain optional, non-credit, non-progression, and non-official;
- full validation passed:
  - 154 suites / 1,263 tests;
  - 150 audio assets;
  - app and website typechecks;
  - Expo config/export;
  - `git diff --check`.

However, the report does not provide the detailed proof matrix required to make H5C safe:

- exact domain-focused behavior before/after H5B, including week 4;
- scheduler evidence with zero, one, two, and three credited sessions;
- same-schedule-week lapse behavior;
- complete no-carry-over/backfill matrix;
- stable slot identity through local save, completion, sync, restore, and replay;
- same-slot/different-material conflict handling;
- complete schedule-credit/main-plan-credit/progression containment;
- complete Movement Profile/history/report containment;
- `microChecksCompleted` count for Balanced blocks with zero through three unique slots;
- Today, Home/next-best-action, Plan, Progress, and manual Check-Up-option consistency;
- true V1 rollback behavior;
- explicit final stage verdicts, especially whether H5C is unblocked.

H5B.1 must close those evidence gaps.

## H5A and H4 prerequisites

Read in full:

```text
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5A_V2_CANONICAL_PROGRESS_HISTORY.md
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_1_1_POLICY_ALIGNED_CLOSURE_CONTINUATION.md
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_OFFICIAL_RETEST_REPORT_NEXT_BLOCK.md
docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5G_1.md
docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5H.md
```

Carried-forward truths:

- accepted V2 state is canonical in Progress;
- official V2 Movement Profile history and block-report history are source-bound/read-only;
- micro-checks must remain separate from official history;
- H4 report `microChecksCompleted` describes the completed prior block;
- scheduler evidence, not stale counters, owns training week/retest state;
- main-plan/schedule credit and progression are tightly fail-closed;
- physical-device validation is not claimed;
- public release remains blocked.

## Locked H5B product policy

### Balanced rotation

For a genuine Balanced V2 block:

```text
schedule week 1 -> Strength -> chair-power
schedule week 2 -> Balance -> single-leg-balance
schedule week 3 -> Mobility -> mobility-reach
schedule week 4 -> no micro-check
```

### Scheduler authority

Rotation and due state use authoritative Stage 5 schedule state.

They do not use:

- ISO/calendar week;
- elapsed week count;
- stale `block.currentWeek`;
- raw session count;
- cached completed sessions;
- number of micro-checks already completed;
- install date;
- callback time.

### Due window

A target may be due only when:

```text
the current schedule week is active
+ at least one schedule-credited main-plan session exists in that week
+ fewer than all three required schedule templates are credited
+ the stable slot is not completed
+ target eligibility passes
```

### No carry-over/backfill

A skipped, unavailable, cancelled, or incomplete slot expires when the authoritative scheduler advances to the next schedule week.

It does not become an overdue task.

Examples:

```text
week 1 Strength skipped
-> week 2 target is Balance
-> no Strength backlog
```

```text
week 2 Balance skipped
-> week 3 target is Mobility
```

### Same-week lapse

Calendar time passing does not rotate the target.

If the authoritative schedule week remains unchanged:

- target remains unchanged;
- slot ID remains unchanged;
- completion remains deduped.

### Week 4

Balanced schedule week 4 has no micro-check.

The subsequent official Movement Check-Up is the block-level measurement event.

Do not add a disabled or hidden week-4 micro-check that can be launched through a stale route.

### Domain-focused blocks

Preserve the exact pre-H5B/current approved domain-focused behavior.

H5B.1 must reconstruct and document it from current code and pre-H5B tests.

Do not assume domain week-4 behavior.

Required process:

1. Trace current production logic.
2. Trace pre-H5B behavior from current Git diff/history where available and existing tests/reports.
3. State exactly whether a domain-focused micro-check is available in schedule week 4.
4. Prove H5B did not unintentionally change it.
5. Do not change it unless a failing test proves an objective regression against the existing policy.

### Optional and non-blocking

A micro-check never:

- blocks the next training session;
- blocks week completion;
- blocks official retest;
- becomes a fourth required session;
- produces overdue debt;
- creates shame/streak-loss copy.

### No substitution

Balanced target order is fixed.

If the target is unsafe/unavailable, that slot is unavailable.

Do not silently substitute another domain.

### Non-official containment

A micro-check must never create or mutate:

- official V2 snapshot;
- official V2 assessment;
- current Movement Profile;
- suggested focus;
- V2 comparison;
- V2 block report;
- current plan origin;
- next block;
- official Check-Up history.

### No credit/progression

A micro-check must never create:

- main-plan credit;
- schedule credit;
- A/B/C advancement;
- week completion;
- ladder progression evidence;
- progression mutation;
- block completion;
- official-retest eligibility.

### Claim policy

Do not add:

- improved;
- declined;
- increased;
- decreased;
- better;
- worse;
- stronger;
- steadier;
- more mobile;
- younger;
- older;
- meaningful change;
- percentage change;
- score change;
- percentile change;
- trend arrows;
- pass/fail;
- Movement Age;
- weakest-domain copy.

### Warden

Warden remains deferred.

Chair official and chair-power micro-check output remain non-percentile.

### Release rollback

An existing V2 block continues its H5B micro-check policy even if the unified Check-Up release flag is later off.

A true V1 rollback block preserves its current V1 micro-check behavior.

## Required prior reading and code inspection

Read in full:

- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5B_BALANCED_MICRO_CHECK_POLICY.md`
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5A_V2_CANONICAL_PROGRESS_HISTORY.md`
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_1_1_POLICY_ALIGNED_CLOSURE_CONTINUATION.md`
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_OFFICIAL_RETEST_REPORT_NEXT_BLOCK.md`
- `docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5G_1.md`
- `docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5H.md`
- current micro-check audit/side/protocol reports;
- current Stage 4 safety/capability reports.

Also inspect:

```text
AGENTS.md
CLAUDE.md
docs/decisions.md
App.tsx
src/pearlFlow/microCheckPolicy.ts
src/pearlFlow/microCheck.ts
src/training/microCheck.ts
src/screens/MicroCheckScreen.tsx
src/pearlFlow/appLifecycle.ts
src/pearlFlow/nextBestAction.ts
src/pearlFlow/blockSchedule.ts
src/pearlFlow/progressViewModel.ts
src/pearlFlow/movementProfileV2ProgressViewModel.ts
src/screens/TodayScreen.tsx
src/screens/PlanScreen.tsx
src/screens/ProgressScreen.tsx
src/pearlFlow/manualCheckup.ts
src/adherence/types.ts
src/adherence/adherenceState.ts
src/adherence/adherenceService.ts
src/training/serialize.ts
src/training/dynamicState.ts
src/history/*
src/services/backend/microCheckSyncService.ts
src/services/backend/trainingStateSyncService.ts
src/services/backend/restoreService.ts
src/services/backend/dataExportService.ts
src/services/backend/accountDataService.ts
src/pearlFlow/movementProfileV2BlockReport.ts
```

Inspect all related tests.

Search broadly for:

```text
micro_check
microCheck
MicroCheck
chair-power
single-leg-balance
mobility-reach
microChecksCompleted
slotId
microCheckSlotId
microCheckPolicy
balanced_week_4_official_retest
focusDomain
movementBlockIsBalanced
movementBlockDomainFocus
currentWeekIndex
scheduleCredit
selectedStandingLeg
measurementContext
protocolId
```

Treat current code, including untracked production files, as source of truth.

## Verification/remediation mode

This is verification-first.

Permitted changes:

1. New or expanded production-faithful tests.
2. Small test fixtures built from production helpers.
3. Narrow production fixes only after a failing H5B.1 test proves a real defect.
4. One H5B.1 report.

Do not proactively redesign H5B.

Do not begin H5C/H5D.

If App orchestration cannot be tested without duplicating logic, extract the smallest pure production helper and make App use it.

Any extraction must:

- preserve behavior;
- have a failing test first;
- create no parallel authority;
- avoid UI redesign;
- avoid H5C/H5D work;
- be documented.

# PART A — WORKTREE SAFETY AND RE-ENTRY GATE

## Step 1: Capture exact initial state

Before analysis or edits, run:

```bash
git status --short --untracked-files=all
git diff --name-only
git diff --stat
git ls-files --others --exclude-standard
```

Record exact output in the report.

Rules:

1. Treat every existing tracked/untracked change as user-owned.
2. Inspect current diffs before touching a file.
3. Preserve concurrent App, micro-check, Progress, Step-Up, render, backend, training, website, and docs work.
4. Do not revert, delete, move, or broadly reformat unrelated work.
5. Do not edit prior reports or `docs/decisions.md`.
6. Do not use destructive Git commands.
7. Do not install packages.
8. Do not modify lockfiles.
9. Do not regenerate audio.
10. Do not stage, commit, branch, push, or open a PR.
11. Do not inspect or expose `.env` values or provider credentials.
12. Do not modify or share font files.
13. If concurrent work makes micro-check authority ambiguous, stop and mark H5B.1 blocked.

## Step 2: Mandatory app typecheck

Run first:

```bash
npm run typecheck
```

If it fails solely in unrelated concurrent work:

- do not repair that work;
- create the H5B.1 report with a blocked verdict;
- record exact diagnostics;
- stop before adding H5B.1 tests.

## Step 3: Baseline focused slice

Run current focused tests for:

- H5B micro-check policy;
- H5A Progress/history containment;
- H4.1.1 official lifecycle;
- scheduler;
- app lifecycle/next-best action;
- micro-check runner;
- local persistence;
- micro-check sync/restore;
- report count;
- V1 rollback.

Then run the full pre-edit gate:

```bash
npm run verify:audio
npm test -- --runInBand
npm run typecheck
npm --prefix website run typecheck
npx --no-install expo config --type public
git diff --check
```

Also run:

```bash
rm -rf /tmp/pearl-unified-h5b1-baseline-export
npx --no-install expo export --platform all --output-dir /tmp/pearl-unified-h5b1-baseline-export
rc=$?
rm -rf /tmp/pearl-unified-h5b1-baseline-export
exit $rc
```

Record exact counts and warnings.

# PART B — INVENTORY H5B IMPLEMENTATION

## Step 4: Inventory task-owned/current modules

Create:

| Responsibility | Current module | Pure/side-effecting | Existing tests | H5B.1 proof required |
| --- | --- | --- | --- | --- |

At minimum inventory:

- policy version/fingerprint;
- domain/Balanced target resolver;
- scheduler due resolver;
- stable slot ID;
- launch route validation;
- result record;
- adherence completion metadata;
- local file identity;
- backend upsert identity;
- restore dedupe;
- report count;
- Today/Home/Plan/Progress/manual-option copy and actions;
- V1 rollback.

## Step 5: Trace the production callback chain

Trace:

```text
active block
-> scheduler
-> micro-check target resolver
-> lifecycle/next-best action
-> Today/Home/Plan/Progress/manual option
-> App launch validation
-> MicroCheckScreen
-> raw/valid result
-> local micro-check save
-> adherence completion
-> backend sync
-> restore
-> report count / Progress separate section
```

For each boundary record:

- inputs;
- authority;
- output;
- stable ID;
- local write;
- remote write;
- duplicate behavior;
- failure behavior.

# PART C — VERIFY POLICY CONSTANTS AND PURITY

## Step 6: Policy constants

Verify the current policy has explicit deterministic version/fingerprint material.

Assert the fingerprint excludes:

- clock;
- environment;
- backend;
- live profile;
- current measured results;
- random IDs.

If H5B omitted a required explicit version/fingerprint while persisting it, add a failing test and the narrowest correction.

## Step 7: Pure authority

Verify the policy/target resolver:

- reads explicit block/scheduler/completion/eligibility inputs only;
- performs no I/O;
- does not log;
- does not mutate inputs;
- does not read environment;
- does not read current life goal/result;
- does not infer calendar week.

# PART D — BALANCED ROTATION MATRIX

## Step 8: Build a real Balanced V2 block

Use production V2 block materialisation.

Do not manually inject `focusDomain`.

Assert:

- `focus.kind === 'balanced'`;
- no fake domain;
- balanced A/B/C templates remain intact.

## Step 9: Week 1

Create scheduler state with:

- week 1 active;
- zero current-week credits -> no micro-check;
- one current-week credit -> Strength/chair-power due;
- two current-week credits -> same Strength/chair-power slot still due;
- three credits/week complete -> no micro-check.

Assert one stable week-1 slot ID.

## Step 10: Week 2

Advance through production schedule credits/timing.

Assert:

- zero week-2 credits -> no micro-check;
- one/two week-2 credits -> Balance/single-leg-balance due;
- three -> no micro-check;
- no week-1 Strength backlog;
- week-2 slot ID differs from week 1.

## Step 11: Week 3

Equivalent proof for Mobility/mobility-reach.

## Step 12: Week 4

Assert no Balanced micro-check for:

- zero credits;
- one credit;
- two credits;
- three credits;
- any stale direct route/type request.

Reason must be the current explicit week-4 policy, not merely missing focus.

## Step 13: No carry-over

Verify:

- skipped week-1 Strength does not appear in week 2;
- unavailable week-1 Strength does not appear in week 2;
- cancelled/incomplete week-2 Balance does not appear in week 3;
- week 4 has no backlog;
- old slot remains historical/incomplete only and is not current due.

## Step 14: Same-week lapse

Advance calendar time without schedule-week advancement.

Assert:

- target unchanged;
- slot ID unchanged;
- no duplicate prompt/completion;
- no rotation.

## Step 15: Calendar-week independence

Cross ISO week/month/year boundaries while scheduler week remains unchanged.

Target/slot must remain unchanged.

# PART E — DOMAIN-FOCUSED NON-REGRESSION

## Step 16: Reconstruct exact domain policy

For Strength, Balance, and Mobility blocks, document:

- target type;
- due window;
- week-1 through week-4 behavior;
- lapse behavior;
- completion behavior.

Do not infer from Balanced policy.

## Step 17: Pre/post H5B comparison

Use existing pre-H5B tests/reports/current diff where possible.

Prove H5B changed only target selection/slot identity needed for the unified resolver and did not alter approved domain UX.

If behavior changed, classify:

- intended normalization;
- real regression;
- ambiguous product policy.

Do not silently approve an unexplained change.

## Step 18: Domain week-4 result

State and test the actual current product policy.

H5C remains blocked if domain week-4 behavior is unexplained or inconsistent across consumers.

## Step 19: V1 domain rollback

Prove true V1 rollback micro-check behavior remains current.

Do not force V2 Balanced slot metadata into V1 authority.

# PART F — SCHEDULER AND CREDIT AUTHORITY

## Step 20: Triggering evidence

Verify only authoritative current-week schedule credit can open the due window.

Test non-triggering:

- manual practice;
- Explore;
- preset/extra;
- micro-check completion;
- official retest;
- raw completion without schedule credit;
- zero-work;
- all-skipped;
- supporting-only;
- wrong block;
- wrong template;
- same-day denied credit;
- stale cached counters;
- legacy completion;
- denied restart.

## Step 21: Valid restart

If current Stage 5 policy can grant a restart session normal schedule credit, prove that it affects due state only through that authoritative credit.

Do not special-case restart in H5B.

## Step 22: Waiting/terminal scheduler states

No micro-check due in:

- week complete waiting;
- training complete waiting retest;
- retest due;
- block completed;
- schedule unavailable.

## Step 23: Optional/non-blocking

Complete or skip a micro-check and prove:

- next plan session remains startable;
- week completes from A/B/C only;
- retest timing unchanged;
- no overdue debt.

# PART G — SLOT IDENTITY AND RECORD BINDING

## Step 24: Stable slot identity

Assert same material gives same slot ID across:

- repeated resolver calls;
- different callback clocks;
- app restart;
- local serialize/deserialize;
- remote sync/restore;
- equivalent input ordering.

Assert different ID for:

- different block;
- different schedule week;
- different target type/domain;
- different approved policy version/fingerprint.

## Step 25: Slot-to-target binding

A slot must bind to:

- block ID;
- schedule week index/number;
- target source;
- target domain;
- micro-check type;
- policy version/fingerprint.

A crafted route with mismatched type/domain/slot fails closed.

## Step 26: One record/completion per slot

Repeated valid completion must produce:

- one local micro-check record;
- one adherence completion/slot-completion authority;
- one remote identity;
- one report-count contribution.

## Step 27: Same-slot conflicting material

Test:

- same slot/same material -> reuse/dedupe;
- same slot/different result or metadata -> current immutable/conflict policy;
- first accepted truth preserved;
- no double count;
- fail closed rather than overwrite silently.

Document whether micro-check results are immutable or last-write-wins by product contract. If current code has no explicit safe policy, add a failing test and narrow correction.

# PART H — ELIGIBILITY AND SIDE/PROTOCOL METADATA

## Step 28: Eligibility reuse

Verify target startability reuses canonical:

- equipment;
- movement capability;
- safety;
- release;
- setup/player support.

No duplicated safety policy.

## Step 29: No substitution

For each Balanced target, make it ineligible.

Assert:

- slot unavailable;
- no substitute domain;
- plan unchanged;
- next schedule week rotates normally with no backlog.

## Step 30: Chair-power metadata

Verify:

- side-independent product semantics;
- no left/right longitudinal claim;
- no percentile;
- protocol ID/version round-trip.

## Step 31: Balance metadata

Verify current behavior for:

- source standing-leg prefill if supported;
- explicit confirmation/change;
- selected leg persistence;
- no camera inference;
- changed leg does not change block/focus;
- no official profile comparison creation.

## Step 32: Mobility metadata

Verify:

- current mobility-reach protocol ID/version;
- no assumption it equals official shoulder reach;
- no automatic official shoulder-side reuse unless current same-protocol policy explicitly owns it;
- no official Mobility-profile comparison.

# PART I — COMPLETION AND IDEMPOTENCY

## Step 33: Valid completion

Run a valid completion for each H5B target:

- domain Strength/Balance/Mobility;
- Balanced week 1/2/3.

Assert stable local/remote record and completed slot.

## Step 34: Duplicate callback matrix

Replay:

- screen completion callback;
- local save;
- adherence completion;
- remote upsert;
- app resume;
- restore of identical remote row.

Assert one slot completion.

## Step 35: Invalid/cancelled/incomplete

Assert:

- slot not completed;
- no report count;
- no credit/progression;
- no official artifact;
- slot may remain available only while same schedule week/due window remains.

## Step 36: Stale completion

A completion from an expired prior-week slot:

- may remain historical;
- must not satisfy the current slot;
- must not suppress the new target;
- must not be rewritten to the current week.

# PART J — CREDIT / PROGRESSION CONTAINMENT

## Step 37: Runtime proof

For a valid micro-check completion assert:

```text
mainPlanCredit !== true
scheduleCredit.credited !== true
no MainPlanCreditEvent
no A/B/C template advancement
no week completion
no progression event
no ladder mutation
no block completion
no retest-not-before change
```

Use production predicates and scheduler.

## Step 38: Malicious/legacy-looking metadata

Attempt to attach:

- `mainPlanCredit: true`;
- schedule-credit-looking metadata;
- primary focus evidence;
- a block template ID.

Current persisted-credit classifiers must still reject a micro-check source/session type.

## Step 39: Multiple micro-checks

Even multiple valid micro-checks in one schedule week must not affect training credit or scheduler state.

# PART K — OFFICIAL MOVEMENT PROFILE CONTAINMENT

## Step 40: Artifact absence

After completion assert no creation/mutation of:

- V2 snapshot;
- V2 assessment;
- focus;
- comparison;
- V2 block report;
- active block;
- next block.

## Step 41: H5A Progress containment

Verify micro-check records do not become:

- latest profile;
- official profile history;
- report history;
- read-only Movement Profile detail;
- H4 comparison.

## Step 42: Current plan/focus containment

Micro-check result, including low/high values, must not:

- change focus;
- change plan source;
- change exercise selection;
- replace block;
- change next block.

## Step 43: No aggregate trend

Verify Progress does not mix official and micro-check values in one trend/chart/comparison.

# PART L — PERSISTENCE, SYNC, RESTORE, EXPORT, ACCOUNT CLEAR

## Step 44: Local round-trip

Round-trip current H5B records and completion metadata.

Assert exact:

- slot ID;
- block/week binding;
- target source/domain/type;
- policy version/fingerprint;
- protocol/side metadata;
- result;
- validity/completion time.

## Step 45: Backend upsert

Verify slot-first identity.

Test:

- first upsert;
- identical retry;
- duplicate callback;
- legacy no-slot row;
- slot-backed row plus legacy-looking duplicate.

No duplicate current slot.

## Step 46: Sync failure/local-first

Fail remote upsert.

Assert:

- local slot remains complete;
- current target no longer prompts locally;
- training plan remains usable;
- retry does not duplicate.

## Step 47: Restore dedupe

Test:

- identical slot rows;
- same slot conflicting material;
- stale remote row;
- malformed/future schema;
- wrong block;
- wrong schedule week;
- wrong target type;
- legacy fallback identity.

Current H5B slot-backed row must not be satisfied by an unrelated legacy row.

## Step 48: Reordered records

Restore rows in different orders and assert deterministic accepted truth.

## Step 49: Export

Verify bounded metadata and result only.

Exclude:

- landmarks;
- frames;
- video/image/base64;
- local private paths/URIs;
- auth tokens;
- provider secrets;
- free-text health notes;
- source document content.

## Step 50: Account clear

Verify micro-check files, slot completions, and associated local state are removed with account clear.

No orphan slot metadata remains.

# PART M — REPORT COUNT VERIFICATION

## Step 51: Unique slot counting

Verify `microChecksCompleted` counts unique valid completed slots for the completed prior block, not:

- raw record count;
- duplicate callbacks;
- remote duplicates;
- legacy duplicate identity;
- active next block state.

## Step 52: Balanced count matrix

For a completed Balanced prior block verify report count:

```text
0 completed slots -> 0
week 1 only -> 1
weeks 1-2 -> 2
weeks 1-3 -> 3
```

Week 4 contributes nothing and is not “missed.”

## Step 53: Skipped/unavailable slots

Skipped, cancelled, invalid, unavailable, or expired slots do not count.

## Step 54: Duplicate/conflict count

Identical duplicate slot counts once.

Conflicting same-slot material does not count twice and follows fail-closed policy.

## Step 55: Frozen report

After report creation:

- changing next-block micro-check state;
- completing more micro-checks in another block;
- restoring duplicate micro-check rows;

must not change the accepted report fingerprint/count.

# PART N — CONSUMER CONSISTENCY

## Step 56: Canonical states

Create production states for:

```text
A. no current-week credit
B. one credit, current slot due
C. two credits, current slot due
D. slot completed
E. week complete/waiting
F. next schedule week with prior slot skipped
G. target unavailable
H. training complete/retest due
I. release flag off with existing V2 block
J. true V1 rollback block
```

## Step 57: Today

Verify target/copy/action for A-J.

No stale route and no arbitrary caller-selected type.

## Step 58: Home / next-best action

Verify same due/target truth and action priority.

## Step 59: Plan

Verify optional check-in presentation does not appear as a required fourth session.

## Step 60: Progress

Verify separate micro-check section, actual domain label, no official-history leakage, no trend claim.

## Step 61: Manual Check-Up options

Recommend a micro-check only when the current slot is due.

No stale previous-week recommendation.

## Step 62: Cross-consumer equality

For identical state, all consumers agree on:

- due/not due;
- target domain/type;
- slot identity;
- availability reason.

# PART O — COPY / ACCESSIBILITY / RESPONSIVE

## Step 63: Copy guardrails

Assert no:

- overdue;
- missed;
- catch up;
- streak lost;
- incomplete week;
- improved/declined;
- percentage/delta;
- Movement Age;
- weakest;
- Warden/percentile;
- internal enum IDs.

Balanced UI should name the actual domain check-in, not “Balanced result.”

## Step 64: Completion copy

Preserve calm factual copy, materially equivalent to:

```text
Check-in saved
This does not change your Movement Profile or plan.
```

No new audio.

## Step 65: Accessibility

Verify:

- action names actual domain;
- optional nature is clear;
- unavailable state is calm;
- raw result includes units;
- no color-only meaning;
- touch targets preserved.

## Step 66: Responsive

Verify compact/standard/large widths and large text for week-specific copy.

# PART P — V1 / V2 ROLLBACK AND MIXED STATE

## Step 67: Existing V2 block with release flag off

H5B target policy continues.

No fallback to V1.

## Step 68: True V1 block

Current V1 micro-check behavior remains.

No V2 official artifact or fake Balanced rotation.

## Step 69: Mixed state

Where both V1 and accepted V2 state exist:

- active/current V2 block owns V2 H5B policy;
- no mixed series;
- malformed V2 fails closed rather than selecting V1.

# PART Q — ARCHITECTURE SOURCE GUARDS

## Step 70: No official artifact imports

Micro-check target/completion modules must not import/call:

- V2 snapshot builder;
- V2 assessment builder;
- focus selector;
- H4 comparison builder;
- H4 report builder;
- official-retest transition;
- V2 block materialiser.

## Step 71: No credit/progression imports

Micro-check completion must not call:

- schedule-credit annotation;
- main-plan event creation;
- progression application;
- plan-session completion mutation.

If shared types are imported, source guards should distinguish types from authority calls.

## Step 72: Screen non-authority

`MicroCheckScreen` renders a validated selected target.

It must not select an arbitrary target from route input.

# PART R — ALLOWED NARROW FIXES

If a test proves a real defect, fix only that defect.

Permitted examples:

- wrong domain week behavior;
- calendar time rotates target;
- prior skipped slot carries over;
- slot ID drifts across persistence;
- duplicate completion/count;
- same-slot conflict overwrites silently;
- micro-check creates schedule/progression credit;
- micro-check enters official history;
- report count uses raw records or next block;
- consumer displays stale/incorrect target;
- stale route launches wrong micro-check;
- restore promotes malformed row.

Not permitted:

- H5C route retirement;
- H5D release hardening;
- official Check-Up/reference/focus changes;
- new micro-check battery;
- week-4 Balanced micro-check;
- domain substitution;
- Warden;
- new audio;
- broad App/state rewrite.

Every production fix must have a failing regression first.

# PART S — REQUIRED TEST FILES / QUALITY

Add or extend repository-consistent suites, for example:

```text
src/pearlFlow/__tests__/microCheckPolicyH5B1.test.ts
src/pearlFlow/__tests__/microCheckLifecycleH5B1.integration.test.ts
src/services/backend/__tests__/microCheckPersistenceH5B1.integration.test.ts
```

Use current naming conventions.

Tests must:

- use production scheduler;
- use real V2 domain/Balanced blocks;
- create schedule credits through production helpers;
- use production target resolver;
- use real micro-check record/completion contracts;
- use real local/backend serializers/restore;
- use deterministic explicit timestamps;
- exercise current view models/actions;
- assert input non-mutation;
- assert credit and official containment.

Tests must not:

- mock every layer;
- duplicate policy logic in test code;
- cast malformed objects into accepted types;
- use real camera/network;
- use wall-clock sleeps;
- install packages;
- regenerate audio;
- embed Warden data;
- weaken scheduler/source/immutability guards.

# PART T — VALIDATION

## Step 73: Focused H5B.1 validation

Run all new H5B.1 tests plus relevant current suites for:

- H5B policy;
- scheduler;
- app lifecycle/next-best action;
- MicroCheck runner/screen;
- local persistence;
- micro-check sync/restore/export/account clear;
- report count;
- H5A Progress containment;
- H4.1.1 lifecycle;
- V1 rollback;
- Stage 5G.1/H.

Record exact command and counts.

## Step 74: Full release gate

Run exactly:

```bash
npm run verify:audio
npm test -- --runInBand
npm run typecheck
npm --prefix website run typecheck
npx --no-install expo config --type public
git diff --check
```

Then:

```bash
rm -rf /tmp/pearl-unified-h5b1-export
npx --no-install expo export --platform all --output-dir /tmp/pearl-unified-h5b1-export
rc=$?
rm -rf /tmp/pearl-unified-h5b1-export
exit $rc
```

Record:

- new H5B.1 suites/tests;
- focused aggregate suites/tests;
- full suites/tests;
- audio:
  - safety 44 cues / 88 assets;
  - Movement Profile V2 31 cues / 62 assets;
  - total 150 assets;
- app typecheck;
- website typecheck;
- Expo config;
- Android/iOS export;
- asset count;
- `git diff --check`;
- known warnings;
- new warnings;
- whether validation changed files.

# PART U — MANUAL SOFTWARE TRACE

After automated validation, trace:

## Balanced week 1

```text
zero credits -> no check-in
one credit -> Strength slot due
completion -> one slot complete
two credits -> no duplicate
three credits -> week complete
```

## Balanced week 2

```text
week 1 skipped/completed
-> week 2 after scheduler unlock
-> Balance slot
-> no Strength backlog
```

## Balanced week 3

```text
Mobility slot
```

## Balanced week 4

```text
no micro-check at any credit count
-> official retest later
```

## Domain block

Trace all four weeks according to reconstructed existing policy.

## Lapse

```text
calendar time passes
+ same scheduler week
-> same target/slot
```

## Offline

```text
local completion
-> remote failure
-> slot remains complete
-> retry no duplicate
```

## Progress/report

```text
micro-check saved
-> separate Progress section
-> excluded from official history
-> completed prior-block report counts unique slots
```

## Rollback

```text
existing V2 block + release off -> H5B continues
true V1 block -> current V1 behavior
```

# PART V — REPORT

Create exactly one new report:

```text
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5B_1_VERIFICATION_CLOSURE.md
```

Do not edit the H5B report or `docs/decisions.md`.

Required sections:

1. Scope.
2. Why H5B.1 was required.
3. H5B/H5A/H4 prerequisites.
4. Initial Git status.
5. Re-entry/baseline validation.
6. H5B module inventory.
7. Production callback map.
8. Policy version/fingerprint/purity.
9. Balanced week-1 proof.
10. Balanced week-2 proof.
11. Balanced week-3 proof.
12. Balanced week-4 proof.
13. No carry-over/backfill proof.
14. Same-week lapse/calendar independence.
15. Domain-focused behavior reconstruction.
16. Domain pre/post-H5B non-regression.
17. Domain week-4 behavior.
18. V1 domain rollback behavior.
19. Scheduler trigger/non-trigger matrix.
20. Waiting/terminal states.
21. Stable slot identity.
22. Slot/target binding.
23. Same-slot conflict policy.
24. Eligibility/safety/no-substitution.
25. Side/protocol metadata.
26. Completion/idempotency.
27. Schedule/main-plan/progression containment.
28. Official Movement Profile containment.
29. H5A Progress/history containment.
30. Local persistence.
31. Backend sync/failure/retry.
32. Restore/conflict/reordering.
33. Export/account clear.
34. H4 report unique-slot count.
35. Balanced report count matrix.
36. Frozen report behavior.
37. Today behavior.
38. Home/next-best-action behavior.
39. Plan behavior.
40. Progress behavior.
41. Manual Check-Up-option behavior.
42. Cross-consumer equality.
43. Copy/accessibility/responsive.
44. V1/V2 rollback/mixed-state behavior.
45. Architecture/source guards.
46. Defects found.
47. Production fixes, if any.
48. Files changed.
49. Tests added/changed.
50. Exact focused validation.
51. Exact full validation.
52. Audio verification.
53. App/website typechecks.
54. Expo config/export.
55. H0-H5B/Stage 3D-B/Stage 4/Stage 5/Step-Up regression.
56. Remaining H5C/H5D/device work.
57. Whether H5C is unblocked.
58. Initial/final Git status.
59. Complete files-changed inventory.
60. Concurrent external changes.
61. Confirmation that no package install, lockfile change, audio regeneration, staging, commit, branch, push, or H5C/H5D work occurred.

# REQUIRED INVARIANTS

After H5B.1:

1. App typecheck passes before verification work.
2. Balanced week 1 targets Strength only after scheduler credit.
3. Balanced week 2 targets Balance only after scheduler credit.
4. Balanced week 3 targets Mobility only after scheduler credit.
5. Balanced week 4 has no micro-check.
6. No fake Balanced focus domain exists.
7. Skipped/unavailable/cancelled slots do not carry over.
8. Calendar time alone does not rotate.
9. Same scheduler week preserves target/slot.
10. Domain behavior is explicitly reconstructed and non-regressed.
11. Domain week-4 behavior is explicit and consistent.
12. Only authoritative schedule credit opens due state.
13. Micro-check completion never creates schedule/main-plan credit.
14. Micro-check never advances A/B/C/week.
15. Micro-check never creates progression evidence/mutation.
16. Micro-check never affects retest timing.
17. Stable slot identity survives replay/persistence/sync/restore.
18. One accepted completion exists per slot.
19. Same-slot conflicts are deterministic/fail-closed.
20. Eligibility reuses canonical safety/capability gates.
21. No silent domain substitution occurs.
22. Side/protocol metadata is truthful.
23. No V2 snapshot/assessment/comparison/report/block is created.
24. Micro-check never becomes latest/official profile/history.
25. Local completion survives remote failure.
26. Restore dedupes identical rows.
27. Malformed/future/mismatched rows fail closed.
28. Export is bounded/private.
29. Account clear leaves no orphan slot state.
30. Report counts unique valid slots from the completed prior block.
31. Balanced report count is 0-3 only.
32. Week-4 omission is not treated as missed.
33. Frozen report cannot change from next-block micro-check state.
34. Today/Home/Plan/Progress/manual options agree.
35. No overdue/shame/directional claims appear.
36. Existing V2 block continues when release flag is off.
37. True V1 rollback behavior remains.
38. No mixed V1/V2 micro-check authority appears.
39. No H5C/H5D work is implemented.
40. Warden remains deferred.
41. Audio remains 150 assets.
42. Full repository gate passes.
43. Physical-device validation is not claimed.
44. Public release remains blocked.

# ACCEPTANCE CRITERIA

Do not mark H5B.1 verified unless:

1. Balanced 1/2/3/4 matrix is production-tested.
2. Domain behavior and week 4 are reconstructed and non-regressed.
3. Scheduler trigger/non-trigger matrix passes.
4. No carry-over and same-week lapse behavior pass.
5. Slot identity/idempotency/conflict behavior pass.
6. Eligibility fails closed without substitution.
7. Credit/progression containment passes.
8. Official-profile/history/report creation containment passes.
9. Persistence/sync/restore/export/account-clear pass.
10. Balanced report 0/1/2/3 count matrix passes.
11. Consumers agree.
12. V1 rollback remains green.
13. Any production fix has a prior failing test.
14. Focused tests pass.
15. Full Jest passes.
16. Audio verification passes.
17. App typecheck passes.
18. Website typecheck passes.
19. Expo config passes.
20. Android/iOS export passes.
21. `git diff --check` passes.
22. No unrelated work is overwritten.
23. No package/lockfile/audio change occurs.
24. No staging/commit/branch/push occurs.

Do not mark verified if:

- domain behavior is assumed rather than proven;
- Balanced week 4 has any launchable stale slot;
- a skipped slot becomes overdue;
- micro-check credit/progression contamination exists;
- a micro-check enters official V2 history;
- report counts raw duplicate records;
- consumer targets disagree;
- H5C is partially implemented.

# STAGE DECISIONS

At the end of the report state exactly one:

```text
UNIFIED MOVEMENT CHECK-UP STAGE H5B.1 VERIFIED
UNIFIED MOVEMENT CHECK-UP STAGE H5B.1 BLOCKED
```

Also state exactly one:

```text
BALANCED SCHEDULE-WEEK MICRO-CHECK MATRIX VERIFIED
BALANCED MICRO-CHECK MATRIX BLOCKED
```

Also state exactly one:

```text
DOMAIN MICRO-CHECK NON-REGRESSION VERIFIED
DOMAIN MICRO-CHECK NON-REGRESSION BLOCKED
```

Also state exactly one:

```text
MICRO-CHECK SCHEDULER / SLOT IDENTITY VERIFIED
MICRO-CHECK SCHEDULER / SLOT VERIFICATION BLOCKED
```

Also state exactly one:

```text
MICRO-CHECK CREDIT / PROGRESSION CONTAINMENT VERIFIED
MICRO-CHECK CREDIT CONTAINMENT BLOCKED
```

Also state exactly one:

```text
MICRO-CHECK / OFFICIAL MOVEMENT PROFILE CONTAINMENT VERIFIED
OFFICIAL PROFILE CONTAINMENT BLOCKED
```

Also state exactly one:

```text
MICRO-CHECK PERSISTENCE / SYNC / RESTORE / EXPORT VERIFIED
MICRO-CHECK PERSISTENCE VERIFICATION BLOCKED
```

Also state exactly one:

```text
MICRO-CHECK REPORT COUNT / READ-ONLY BEHAVIOR VERIFIED
MICRO-CHECK REPORT VERIFICATION BLOCKED
```

Also state exactly one:

```text
TODAY / HOME / PLAN / PROGRESS / MANUAL-OPTION MICRO-CHECK CONSISTENCY VERIFIED
MICRO-CHECK CONSUMER CONSISTENCY BLOCKED
```

Also state exactly one:

```text
V1 MICRO-CHECK ROLLBACK VERIFIED
V1 MICRO-CHECK ROLLBACK BLOCKED
```

Also state exactly one:

```text
UNIFIED MOVEMENT CHECK-UP STAGE H5C UNBLOCKED
UNIFIED MOVEMENT CHECK-UP STAGE H5C BLOCKED
```

Use H5C unblocked only when:

- Balanced and domain behavior pass;
- scheduler/slot identity pass;
- credit and official-profile containment pass;
- persistence/report count pass;
- consumers agree;
- V1 rollback passes;
- no unresolved P0/P1 H5B defect remains.

Also state:

```text
BALANCED WEEK 1 MICRO-CHECK IS STRENGTH
BALANCED WEEK 2 MICRO-CHECK IS BALANCE
BALANCED WEEK 3 MICRO-CHECK IS MOBILITY
BALANCED WEEK 4 HAS NO MICRO-CHECK
MISSED BALANCED MICRO-CHECKS DO NOT CARRY OVER
MICRO-CHECKS REMAIN OPTIONAL
MICRO-CHECKS REMAIN NON-OFFICIAL
NO IMPROVEMENT OR DECLINE CLAIMS
NO V1 LEGACY-RESULT MIGRATION REQUIRED
OFFICIAL MOVEMENT PROFILE HISTORY REMAINS SEPARATE
PUBLIC V1 ROUTE RETIREMENT NOT PERFORMED
RELEASE-CANDIDATE HARDENING NOT PERFORMED
WARDEN TRANSFORM DEFERRED
CHAIR REFERENCE CLAIM REMAINS RAW-ONLY
PHYSICAL DEVICE VALIDATION NOT CLAIMED
PUBLIC RELEASE REMAINS BLOCKED
```

# NEXT STAGE

If H5B.1 verifies, the next stage is:

```text
PEARL UNIFIED MOVEMENT CHECK-UP — STAGE H5C
PUBLIC V1 CHECK-UP / RESULTS ROUTE RETIREMENT,
UNIFIED V2 DEFAULT ENABLEMENT,
INTERNAL-HARNESS CONTAINMENT,
AND ROLLBACK-BUILD POLICY
```

Do not begin H5C in this task.

# FINAL CODEX RESPONSE

Return a concise summary containing:

- Report path.
- Whether production runtime code changed.
- Defects found/fixed.
- Re-entry typecheck/baseline.
- H5B module inventory.
- Policy version/fingerprint/purity.
- Balanced week 1/2/3/week-4 result.
- No-carry-over result.
- Same-week lapse/calendar independence.
- Domain behavior and week-4 result.
- V1 domain rollback result.
- Scheduler trigger/non-trigger matrix.
- Stable slot identity.
- Same-slot conflict behavior.
- Eligibility/no-substitution.
- Side/protocol metadata.
- Completion/idempotency.
- Credit/progression containment.
- Official Movement Profile/history containment.
- Local persistence.
- Sync failure/retry.
- Restore/conflict/reordering.
- Export/account-clear.
- Report 0/1/2/3 unique-slot count.
- Frozen report behavior.
- Today/Home/Plan/Progress/manual-option consistency.
- Copy/accessibility/responsive result.
- V1/V2 rollback/mixed-state result.
- Files changed.
- Tests added/changed.
- Focused validation.
- Full Jest.
- Audio verification.
- App typecheck.
- Website typecheck.
- Expo config.
- Android/iOS export.
- `git diff --check`.
- Confirmation that H0-H5B, H4.1.1, Stage 3D-B, Stage 4, Stage 5, Step-Up resume, navigation, TypeScript boundaries, safety audio, and V2 audio remain green.
- `UNIFIED MOVEMENT CHECK-UP STAGE H5B.1 VERIFIED` or blocked.
- Balanced-matrix verdict.
- Domain-regression verdict.
- Scheduler/slot verdict.
- Credit-containment verdict.
- Official-profile-containment verdict.
- Persistence verdict.
- Report-count verdict.
- Consumer-consistency verdict.
- V1 rollback verdict.
- `UNIFIED MOVEMENT CHECK-UP STAGE H5C UNBLOCKED` or blocked.
- `WARDEN TRANSFORM DEFERRED`.
- `PHYSICAL DEVICE VALIDATION NOT CLAIMED`.
- `PUBLIC RELEASE REMAINS BLOCKED`.
- Initial/final Git status.
- Complete files-changed inventory.
- Concurrent external changes.
- Confirmation that no package install, lockfile change, audio regeneration, staging, commit, branch, push, or H5C/H5D work occurred.
