You are implementing the second substage of Hale’s final unified Movement Check-Up migration:

HALE UNIFIED MOVEMENT CHECK-UP — STAGE H5B
BALANCED SCHEDULE-WEEK MICRO-CHECK ROTATION,
V2 DOMAIN MICRO-CHECK ALIGNMENT,
IDEMPOTENT MICRO-CHECK PERSISTENCE,
AND OFFICIAL MOVEMENT-PROFILE CONTAINMENT

This is a focused micro-check policy and lifecycle stage.

Do not implement H5C or H5D in this task.

## H5A prerequisite and current baseline

Stage H5A is complete.

Required report:

```text
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5A_V2_CANONICAL_PROGRESS_HISTORY.md
```

Recorded H5A outcomes include:

```text
UNIFIED MOVEMENT CHECK-UP STAGE H5A COMPLETE
V2-CANONICAL PROGRESS AUTHORITY IMPLEMENTED
CURRENT V2 MOVEMENT PROFILE PROGRESS PRESENTATION IMPLEMENTED
OFFICIAL V2 MOVEMENT PROFILE HISTORY IMPLEMENTED
V2 BLOCK-REPORT HISTORY IMPLEMENTED
V2 PROGRESS READ-ONLY NAVIGATION VERIFIED
V1 PROGRESS ROLLBACK VERIFIED
UNIFIED MOVEMENT CHECK-UP STAGE H5B UNBLOCKED
```

H5A established:

- accepted V2 state is canonical in Progress;
- V1 Progress remains a separate rollback mode only when no accepted V2 state exists;
- official V2 Movement Profiles and V2 block reports are source-bound and read-only;
- no mixed V1/V2 user history;
- no aggregate trend chart or improvement/decline claims;
- micro-check data remains separate from official Movement Profile history;
- domain-focused micro-check behavior was left unchanged;
- Balanced micro-check remains suppressed;
- H5B was deliberately deferred.

Latest reported validation:

```text
full Jest: 152 suites / 1244 tests
audio: 150 required assets
app typecheck: passed
website typecheck: passed
Expo config: passed
Android/iOS export: passed, 444 assets
git diff --check: passed
```

Re-run the current tree. Do not assume counts or worktree state remain unchanged.

## Why H5B exists

Current domain-focused blocks can select a weekly micro-check from the block focus.

Current Balanced blocks intentionally have no fake `focusDomain`, so their micro-check is suppressed.

H5B must add a deterministic Balanced policy without:

- inventing a fake block focus;
- treating a micro-check as an official Check-Up;
- changing the Movement Profile;
- changing the suggested focus;
- changing the plan;
- granting schedule credit;
- granting progression evidence;
- affecting official retest eligibility;
- creating a block report;
- mixing micro-check values into official history or trend claims.

## Product-owner policy locked for H5B

### Balanced weekly rotation

For a genuine Balanced V2 block:

```text
Schedule week 1 -> Strength micro-check
Schedule week 2 -> Balance micro-check
Schedule week 3 -> Mobility micro-check
Schedule week 4 -> no micro-check
```

The week-4 omission is intentional because the official Movement Check-Up follows the completed four-week block and measures the full Movement Profile.

### Rotation authority

Rotation follows the authoritative Stage 5 scheduler’s current training week.

It does not follow:

- ISO/calendar week number;
- elapsed wall-clock week;
- raw session count;
- stale `block.currentWeek`;
- cached `completedSessions`;
- micro-check completion count;
- the date the app was installed.

If a user takes longer than one calendar week to finish a schedule week, the target remains attached to that schedule week.

### No carry-over or backfill

A missed Balanced micro-check does not move into a later schedule week.

Examples:

```text
Week 1 Strength check-in skipped
-> Week 2 target is still Balance
-> no overdue Strength check-in
```

```text
Week 2 Balance check-in skipped
-> Week 3 target is still Mobility
```

The rotation is coverage-oriented, not a backlog.

### Domain-focused blocks

Preserve current domain-focused behavior.

A domain-focused block continues to use its frozen focus domain for its weekly micro-check according to the current due-window policy.

Do not change domain-block week-4 behavior in H5B unless current code is internally inconsistent with the existing product contract and a failing test proves the defect.

### Current due window

Preserve the current user-facing micro-check timing, but make its authority explicitly scheduler-derived.

The intended due window is:

```text
current schedule week is active
+ at least one schedule-credited main-plan session exists in that schedule week
+ the schedule week is not yet complete
+ the current micro-check slot has not been completed
-> micro-check is due/available
```

A micro-check must not become due from:

- a manual session;
- Explore;
- a preset;
- a restart attempt without schedule credit;
- a supporting/non-credit session;
- a skipped/zero-work attempt;
- another micro-check;
- stale counters.

If the current production domain-focused timing differs, reconstruct it precisely first and preserve its user experience while replacing any stale/raw authority with scheduler evidence.

### Optional and non-blocking

A micro-check is optional.

It must never:

- block the next plan session;
- block week completion;
- block official retest;
- cause shame/lost-streak copy;
- become a required plan task;
- create a missed-task debt.

### Stable target order

The Balanced order is fixed:

```text
strength -> balance -> mobility
```

Do not reorder by:

- life goal;
- latest result;
- current plan session order;
- which domain looks weakest;
- current readiness;
- equipment availability;
- prior micro-check result.

If the week’s target is unavailable or unsafe, fail closed for that micro-check slot rather than silently substituting another domain.

## Canonical existing micro-check types

Reuse the current production micro-check implementations and their actual IDs.

Expected conceptual mapping:

```text
Strength -> chair-power micro-check
Balance -> single-leg-balance micro-check
Mobility -> mobility-reach micro-check
```

Verify exact current identifiers and contracts before editing.

Do not create a new combined Balanced micro-check.

Do not add a three-test battery.

Do not add new voice assets.

## Official-profile containment

Micro-checks remain non-official.

A micro-check must never create or mutate:

- `movementProfileV2Snapshot`;
- `movementProfileV2Assessment`;
- V2 comparison;
- V2 block report;
- current suggested focus;
- current Movement Profile;
- current plan origin;
- next block;
- official Check-Up history.

Micro-check values may appear only in the existing separate micro-check/check-in presentation.

They must not become the `latestProfile` in H5A.

They must not appear in official Movement Profile history.

They must not be plotted together with official Check-Up measurements.

## Claim policy

H5B must not add:

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
- green/red directional semantics;
- pass/fail;
- Movement Age;
- weakest-domain copy.

Micro-check results are factual raw check-ins only.

## Warden and chair policy

Warden remains deferred.

The official chair Movement Profile remains raw-only.

The chair-power micro-check must not display a percentile or feed the Warden architecture.

## Side and protocol policy

Inspect and reuse any current canonical measurement-side/protocol metadata.

Do not create a second side model.

### Strength micro-check

Chair-power is side-independent as a product measurement.

A dynamically observed near camera side may remain implementation metadata, but it must not become a left/right longitudinal claim.

### Balance micro-check

Use the current single-leg micro-check protocol.

Where current canonical metadata supports it:

- prefill the standing leg from the current V2 block’s source Movement Profile;
- require explicit confirmation or deliberate change;
- persist selected standing leg and protocol identity;
- changing leg keeps the micro-check valid but prevents direct same-series comparability.

Do not infer a standing leg from old video, landmarks, filenames, or voice text.

### Mobility micro-check

Keep the current mobility-reach protocol.

Do not treat it as equivalent to the official V2 shoulder-reach measurement.

Do not infer its measurement side from the official shoulder side.

If the current micro-check protocol has a selected/extended side:

- collect or reuse its own same-protocol side metadata;
- persist it;
- do not claim official Mobility-profile comparability.

H5B does not need to add longitudinal micro-check comparison copy.

## Release and rollback posture

Accepted V2 blocks remain trainable when the unified Check-Up release flag is later off.

Therefore:

- an existing V2 domain/Balanced block may continue its H5B micro-check policy when the release flag is off;
- the release flag controls starting new public unified Check-Ups, not current-block training/check-ins;
- true V1 rollback blocks preserve current V1 domain micro-check behavior;
- no V1/V2 mixed micro-check series is shown.

## Primary objectives

H5B must:

1. Reconstruct the current micro-check architecture end to end.

2. Add one pure versioned micro-check target policy.

3. Add a deterministic target selector for domain and Balanced blocks.

4. Use scheduler week authority.

5. Implement the fixed Balanced week 1/2/3 rotation and week-4 omission.

6. Preserve current domain-block behavior.

7. Add a stable block/week/type micro-check slot identity.

8. Ensure one completion per slot.

9. Make duplicate callbacks idempotent.

10. Prevent carry-over/backfill.

11. Keep micro-check completion separate from schedule credit and progression.

12. Keep micro-check completion separate from official V2 artifacts.

13. Enforce existing equipment/capability/safety eligibility.

14. Fail closed rather than substitute another domain.

15. Preserve current MicroCheckScreen visual language.

16. Update Today/Home/Plan/Progress presentation only as needed for truthful Balanced targets.

17. Preserve H5A official-history containment.

18. Persist/sync/restore/export new bounded metadata through existing architecture.

19. Preserve account-clear behavior.

20. Keep report micro-check counts factual and source-bound to the completed block.

21. Add focused domain/Balanced/idempotency/restore tests.

22. Preserve all prior release gates.

## Required prior reading

Read in full:

- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5A_V2_CANONICAL_PROGRESS_HISTORY.md`
- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_1_1_POLICY_ALIGNED_CLOSURE_CONTINUATION.md`
- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_OFFICIAL_RETEST_REPORT_NEXT_BLOCK.md`
- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H3_1_END_TO_END_VERIFICATION.md`
- `docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5G_1.md`
- `docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5H.md`
- current micro-check audit/voice/measurement-side reports;
- current Stage 4 safety/capability reports.

Also inspect:

- `AGENTS.md`;
- `CLAUDE.md`;
- `docs/decisions.md`;
- `App.tsx`;
- `src/haleFlow/microCheck.ts`;
- `src/training/microCheck.ts`;
- `src/screens/MicroCheckScreen.tsx`;
- `src/haleFlow/appLifecycle.ts`;
- `src/haleFlow/nextBestAction.ts`;
- `src/haleFlow/blockSchedule.ts`;
- `src/haleFlow/progressViewModel.ts`;
- `src/haleFlow/movementProfileV2ProgressViewModel.ts`;
- `src/screens/TodayScreen.tsx`;
- `src/screens/PlanScreen.tsx`;
- `src/screens/ProgressScreen.tsx`;
- current adherence completion types/helpers;
- training serialization;
- micro-check local store;
- micro-check backend sync;
- restore;
- data export;
- account clear;
- V2 block/report materialisers;
- report micro-check count builder/tests;
- current measurement-side/protocol metadata modules;
- all micro-check and lifecycle tests.

Search broadly for:

```text
micro_check
microCheck
MicroCheck
chair-power
single-leg-balance
mobility-reach
microChecksCompleted
focusDomain
movementBlockIsBalanced
movementBlockDomainFocus
schedule.currentWeek
completedThisWeek
weeklyMicroCheck
selectedSide
standingLeg
extendedLeg
protocolId
```

Treat current code—including current untracked production files—as source of truth.

## Scope boundary

This task may change:

- micro-check target/due policy;
- Balanced block target selection;
- domain micro-check V2 metadata alignment;
- micro-check slot identity/metadata;
- App micro-check launch/completion orchestration;
- Today/Home/Plan/Progress micro-check presentation;
- MicroCheckScreen, narrowly;
- micro-check serialization/sync/restore/export/account-clear;
- report micro-check count tests, narrowly;
- focused tests;
- the H5B report.

This task may reuse but must not alter semantics of:

- current micro-check graders/runners;
- Stage 5 scheduler;
- main-plan credit;
- progression evidence;
- V2 snapshots/assessments;
- H4 comparison/report/transition;
- H5A Progress authority/history;
- existing safety/equipment/capability gates.

This task must not change:

- official Check-Up protocols;
- V2 reference engine;
- focus policy;
- block creation;
- official retest;
- report creation semantics;
- next-block creation;
- training A/B/C schedule;
- exercise progression;
- H5A official profile/history authority;
- public V1 route selection;
- public V1 route retirement;
- Warden;
- audio text/assets;
- native pose/camera;
- website;
- dependencies;
- lockfiles;
- fonts/unrelated assets.

Do not perform opportunistic refactors.

# PART A — WORKTREE SAFETY AND BASELINE

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

1. Treat all current tracked and untracked changes as user-owned.
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
13. If concurrent micro-check work makes authority ambiguous, stop and mark H5B blocked.

## Step 2: Mandatory app typecheck

Run first:

```bash
npm run typecheck
```

If it fails solely in unrelated concurrent work:

- do not repair unrelated work;
- create the H5B report as blocked;
- stop before H5B implementation.

## Step 3: Baseline validation

Run focused tests covering:

- H5A authority/Progress;
- H4.1.1 lifecycle;
- current micro-check selection;
- current micro-check runner;
- app lifecycle/next-best action;
- scheduler;
- session credit/progression;
- micro-check sync/restore/export/account clear;
- report micro-check count;
- V1 rollback.

Then run:

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
rm -rf /tmp/hale-unified-h5b-baseline-export
npx --no-install expo export --platform all --output-dir /tmp/hale-unified-h5b-baseline-export
rc=$?
rm -rf /tmp/hale-unified-h5b-baseline-export
exit $rc
```

Record exact counts and warnings.

# PART B — RECONSTRUCT CURRENT MICRO-CHECK ARCHITECTURE

## Step 4: Trace the current due decision

Trace:

```text
active block
-> app lifecycle / next-best action
-> micro-check target selection
-> Today/Home/Plan/Progress action
-> MicroCheckScreen
```

Document exact current conditions for:

- first session in week;
- second session in week;
- week complete;
- waiting for next week;
- training complete;
- retest due;
- block completed;
- lapse/restart;
- existing micro-check completed this week.

Create:

| Input fact | Current authority | H5B authority |
| --- | --- | --- |

## Step 5: Trace the current target mapping

Document exact mappings for:

- Strength block;
- Balance block;
- Mobility block;
- Balanced block;
- legacy/unknown focus;
- no active block.

Identify every current assumption that requires `focusDomain`.

## Step 6: Trace launch and completion

Trace:

```text
micro-check launch
-> selected type/protocol
-> setup/preflight
-> active runner
-> raw result
-> local micro-check save
-> adherence completion
-> remote sync
-> Today/Progress update
```

Record:

- identity;
- block binding;
- week binding;
- type;
- result;
- side/protocol metadata;
- completion identity;
- duplicate behavior;
- cancellation behavior;
- invalid-result behavior;
- app background behavior.

## Step 7: Trace persistence and consumers

Inventory:

- local micro-check record;
- micro-check adherence completion;
- training-state metadata;
- backend row/JSON;
- restore;
- export;
- account clear;
- report micro-check count;
- Progress presentation.

## Step 8: Verify current contamination guards

Prove current Stage 5 protections prevent micro-checks from:

- schedule credit;
- A/B/C rotation;
- main-plan credit;
- progression;
- plan session count;
- official retest completion.

If any current consumer still treats micro-check completion as training credit, add a failing test and fix it narrowly before Balanced policy work.

# PART C — VERSIONED MICRO-CHECK POLICY

## Step 9: Add one canonical pure policy module

Use a repository-consistent path, conceptually:

```text
src/haleFlow/microCheckPolicy.ts
```

Expose explicit constants:

```ts
MICRO_CHECK_POLICY_VERSION
MICRO_CHECK_POLICY_FINGERPRINT
BALANCED_MICRO_CHECK_POLICY_VERSION
BALANCED_MICRO_CHECK_POLICY_FINGERPRINT
```

Use the minimum number of constants required by current conventions.

The fingerprint must be deterministic and exclude:

- clock;
- environment;
- user profile;
- current results;
- backend;
- random IDs.

## Step 10: Canonical target type

Conceptual contract:

```ts
type BlockMicroCheckTarget =
  | {
      status: 'available';
      blockId: string;
      scheduleWeekIndex: 0 | 1 | 2 | 3;
      scheduleWeekNumber: 1 | 2 | 3 | 4;
      targetSource: 'domain_focus' | 'balanced_schedule_rotation';
      targetDomain: MovementDomain;
      microCheckType: MicroCheckType;
      slotId: string;
      policyVersion: number;
      policyFingerprint: string;
    }
  | {
      status: 'not_available';
      reason:
        | 'no_active_block'
        | 'schedule_unavailable'
        | 'week_not_started'
        | 'week_complete'
        | 'training_complete'
        | 'retest_due'
        | 'block_completed'
        | 'balanced_week_4_official_retest'
        | 'slot_already_completed'
        | 'target_ineligible'
        | 'invalid_block_focus'
        | 'unsupported_policy';
    };
```

Adapt to current types.

Do not add `balanced` to `MovementDomain`.

## Step 11: Stable target mapping

### Domain block

Map the frozen domain focus to the existing micro-check type.

Preserve current behavior.

### Balanced block

Map by schedule week:

```text
0 / week 1 -> Strength -> existing chair-power type
1 / week 2 -> Balance -> existing single-leg-balance type
2 / week 3 -> Mobility -> existing mobility-reach type
3 / week 4 -> not available: balanced_week_4_official_retest
```

No current-result or life-goal input.

## Step 12: Stable slot identity

Add one deterministic slot identity, conceptually:

```text
micro-check:<encoded-block-id>:week-<1..4>:<micro-check-type>:policy-<version>
```

Use repository ID conventions.

Identity must be based on:

- block ID;
- schedule week index;
- target type/domain;
- policy version/fingerprint where appropriate.

It must not be based on:

- callback time;
- completion time;
- calendar week number;
- sync time;
- random UUID.

Same material produces the same slot ID.

## Step 13: No policy snapshot conflict

Inspect whether the current block schema needs a micro-check policy snapshot.

Prefer not to mutate immutable V2 block fingerprints merely for H5B.

If a policy snapshot is required for correctness:

- add it in the smallest backward-compatible way;
- do not invalidate accepted H4 blocks;
- normalize current V2 blocks without a snapshot to approved H5B policy v1;
- document why.

Do not create a second block origin or focus authority.

# PART D — SCHEDULER-DERIVED DUE STATE

## Step 14: Use scheduler evidence

Due selection must consume the authoritative `getBlockScheduleState` result.

Do not infer from raw counts.

## Step 15: Active-week due window

A slot may be due only when:

- scheduler is in a current training week/session-due state;
- at least one current-week schedule credit exists;
- fewer than all three current-week templates are credited;
- slot is not completed;
- target is eligible.

Use actual scheduler fields/helpers rather than recomputing week logic independently.

## Step 16: Week transitions

When the schedule advances:

- old uncompleted slot expires;
- new week selects its own target;
- no backlog;
- no completion carried forward;
- no previous week target shown.

## Step 17: Waiting and retest states

No micro-check due during:

- `week_complete_waiting`;
- `training_complete_waiting_retest`;
- `retest_due`;
- `block_completed`;
- `schedule_unavailable`.

## Step 18: Lapse/restart

A lapse does not advance rotation.

If the user remains in the same schedule week:

- same target remains;
- slot identity remains stable;
- duplicate prompt/completion is prevented.

Restart completion affects micro-check due only if it receives normal authoritative schedule credit under existing Stage 5 policy.

# PART E — TARGET ELIGIBILITY AND SAFETY

## Step 19: Reuse current gates

Before a target becomes startable, reuse current canonical:

- equipment;
- movement capability;
- safety;
- setup;
- release;
- camera/player support.

Do not duplicate safety rules.

## Step 20: Strength eligibility

Use current chair-power requirements.

If chair/setup is unavailable:

- target is unavailable for that slot;
- no silent Balance/Mobility substitution;
- no plan impact.

## Step 21: Balance eligibility

Use current balance support/capability rules.

At minimum:

- required support within reach;
- current single-leg confidence/capability policy;
- selected standing leg handling;
- current safety copy.

If unavailable:

- no substitute;
- no block impact;
- no carried backlog.

## Step 22: Mobility eligibility

Use current mobility-reach requirements.

Do not claim equivalence with official shoulder reach.

## Step 23: Calm unavailable behavior

Use calm copy such as:

```text
This week’s check-in isn’t available with your current setup.
Your plan is unchanged.
```

Do not show failure, missed-task, or warning styling.

# PART F — MICRO-CHECK RECORD CONTRACT

## Step 24: Extend the current record narrowly

Use the existing record/store.

Add bounded metadata as needed:

- schema version;
- stable record/check-in ID;
- slot ID;
- block ID;
- schedule week index/number;
- target source;
- target domain;
- micro-check type;
- policy version/fingerprint;
- protocol identity/version;
- selected measurement side/role where applicable;
- result;
- completed timestamp;
- validity/status.

Do not add official V2 artifact fields.

## Step 25: Source binding

A current V2 micro-check record must bind to:

- current block ID;
- current slot ID;
- selected target;
- schedule week.

Optional source-profile IDs may be stored only when needed for side/setup context.

They must not make the record an official snapshot.

## Step 26: JSON safety and privacy

Record must exclude:

- landmarks;
- frames;
- video/image/base64;
- local file paths/URIs;
- full profile;
- free-text health notes;
- auth tokens;
- secrets.

Non-finite values fail closed or normalize according to the current micro-check result contract.

## Step 27: Backward compatibility

Preserve current V1/domain micro-check records.

Do not infer Balanced schedule slots from legacy timestamps.

Current V2 Balanced authoritative completion requires the new slot metadata.

Because no real user has completed a V1 Check-Up, no public migration UI is required.

# PART G — SIDE / PROTOCOL METADATA

## Step 28: Reuse the canonical metadata module

Search for existing measurement-side/protocol types.

Use them.

Do not create a second `BodySide`/protocol contract.

## Step 29: Balance standing leg

For a V2 block:

- prefill from the block source Movement Profile standing leg when valid;
- require confirmation/change through current micro-check UI;
- persist selected standing leg;
- persist changed-from-source metadata if supported;
- do not infer from camera geometry.

Changing leg does not change the plan/focus.

## Step 30: Mobility side

Do not copy official shoulder side into a different mobility-reach protocol.

If mobility-reach uses an extended/measured side:

- use its own explicit selection/persistence;
- do not infer;
- do not show official-profile comparison.

## Step 31: Protocol compatibility

Persist exact micro-check protocol identity/version.

Do not compare different micro-check protocols as one series.

H5B does not need to add previous/current micro-check trend claims.

# PART H — LAUNCH, COMPLETION, AND IDEMPOTENCY

## Step 32: Launch authority

The caller does not choose an arbitrary micro-check type.

App resolves the current target from:

```text
active block
+ scheduler
+ completed micro-check slots
+ eligibility
```

A crafted route/type mismatch fails closed.

## Step 33: Completion identity

Micro-check completion uses the stable slot identity.

Exactly one completion may be accepted per slot.

## Step 34: Duplicate callbacks

Repeated:

- screen completion;
- local save;
- adherence completion;
- remote sync;
- app resume;

must not create duplicate records or completions.

## Step 35: Invalid/incomplete attempt

An invalid, cancelled, or incomplete attempt:

- does not complete the slot;
- does not affect plan/schedule/progression;
- may leave the slot available according to current UX;
- produces no official artifact.

## Step 36: No schedule/progression effects

Architecture/runtime tests must prove:

```text
micro-check completion
-> no MainPlanCreditEvent
-> no schedule credit
-> no A/B/C advancement
-> no ladder progression event
-> no block completion
-> no retest eligibility change
```

## Step 37: No official-profile effects

Prove:

```text
micro-check completion
-> no V2 snapshot
-> no V2 assessment
-> no comparison
-> no report
-> no focus change
-> no block replacement
```

# PART I — APP LIFECYCLE AND UI

## Step 38: Today/Home

When a micro-check is due:

- retain current action priority unless a failing consistency test proves it wrong;
- show the selected target truthfully;
- Balanced copy names the week’s domain;
- action opens the current MicroCheckScreen.

Suggested public copy:

```text
Quick Strength check-in
A short check-in for this week.
```

Equivalent Balance/Mobility copy.

Do not show “Balanced micro-check” if the actual target is one domain.

## Step 39: Plan

Show the current week’s optional check-in only where current Plan design already supports it.

Do not turn it into a required fourth session.

## Step 40: Progress

Keep micro-checks in the existing separate section.

For Balanced blocks, entries should preserve their actual domain labels.

Do not add:

- official Movement Profile history rows;
- trend chart;
- cross-domain aggregate;
- comparison to official results.

## Step 41: Week 4

For a Balanced block, show no micro-check action/card in schedule week 4.

Do not show a disabled “coming soon” card unless the current product system requires it.

The later official retest remains the measurement action.

## Step 42: Completion copy

Use calm factual copy, materially equivalent to:

```text
Check-in saved
This does not change your Movement Profile or plan.
```

Preserve existing premium screen style.

Do not add new audio.

## Step 43: Missed check-in

Do not show:

- overdue;
- missed;
- streak lost;
- incomplete week;
- catch up.

The next schedule week simply uses its next target.

# PART J — PERSISTENCE, SYNC, RESTORE, EXPORT, ACCOUNT CLEAR

## Step 44: Local persistence

Persist one record per stable slot.

Round-trip all new metadata.

No new mutable policy cache.

## Step 45: Backend sync

Use the current micro-check sync architecture.

Prefer bounded JSON in the existing table.

Do not add a database migration unless current storage cannot preserve required metadata.

Sync is local-first and retry-safe.

## Step 46: Restore

Restore must:

- parse new records strictly;
- preserve stable slot IDs;
- dedupe identical records;
- preserve first accepted truth on conflict;
- not infer old Balanced slots;
- not create official artifacts;
- not affect schedule/progression.

## Step 47: Remote conflicts

Test:

- duplicate identical row;
- same slot/different fingerprint/material;
- stale remote record;
- malformed/future schema;
- wrong block ID;
- wrong schedule week;
- wrong target type.

Fail closed.

## Step 48: Export

Export bounded metadata/result only.

No media, landmarks, secrets, or source-document content.

## Step 49: Account clear

Remove micro-check records/completions with the account’s other local state.

No orphan slot metadata.

# PART K — REPORT AND PROGRESS CONTAINMENT

## Step 50: H4 report count

`microChecksCompleted` remains a factual count of valid completed micro-check slots for the completed prior block.

For Balanced blocks:

- maximum under policy v1 is 3;
- skipped/unavailable slots do not count;
- week-4 omission does not count as missed.

Do not add a required count or compliance percentage.

## Step 51: Report identity

Changing current next-block micro-check state must not change an already-frozen prior report.

## Step 52: H5A official history

Prove new Balanced/domain micro-check records remain excluded from:

- `latestProfile`;
- official profile history;
- report history;
- H4 comparison generation;
- read-only Movement Profile detail.

# PART L — V1 ROLLBACK AND MIXED STATE

## Step 53: V1 domain block

Preserve current V1 micro-check behavior under true V1 rollback mode.

Do not write V2 slot metadata as official V2 authority.

## Step 54: Existing V2 block with release off

Continue H5B target selection and completed slot history.

Do not fall back to V1.

## Step 55: Mixed malformed state

A malformed V2 block/micro-check record fails closed.

Do not select V1 merely because the release flag is off.

# PART M — ARCHITECTURE GUARDS

## Step 56: Pure policy boundaries

The target/due policy must not:

- read environment;
- read backend;
- read live profile;
- read current official results;
- perform I/O;
- log;
- mutate inputs;
- use ambient clock except explicit date/scheduler input.

## Step 57: Screen non-authority

MicroCheckScreen must not choose the target domain/type from caller-provided arbitrary values.

It renders the already-selected target and returns result/cancel actions.

## Step 58: No official imports

Micro-check selection/completion modules must not import/call:

- V2 snapshot builder;
- V2 assessment builder;
- focus selector;
- H4 comparison builder;
- H4 report builder;
- official-retest transition;
- V2 block materialiser.

## Step 59: No credit/progression imports

Micro-check completion must not call:

- schedule-credit annotation;
- main-plan completion creation;
- progression application;
- plan-session completion mutation.

# PART N — REQUIRED TEST MATRIX

## A. Policy mapping

- Strength domain -> Strength type.
- Balance domain -> Balance type.
- Mobility domain -> Mobility type.
- Balanced week 1 -> Strength.
- Balanced week 2 -> Balance.
- Balanced week 3 -> Mobility.
- Balanced week 4 -> none.
- no fake domain.
- unknown focus fails closed.

## B. Scheduler authority

- no current-week credit -> not due.
- one current-week credit -> due.
- two credits -> due.
- three credits/week complete -> not due.
- waiting for calendar unlock -> not due.
- training complete waiting retest -> not due.
- retest due -> not due.
- completed block -> not due.
- raw non-credit sessions do not trigger.
- restart with denied credit does not trigger.
- restart with valid schedule credit follows current week.

## C. Rotation and no carry-over

- skipped week 1 does not appear in week 2.
- skipped week 2 does not appear in week 3.
- week 4 no backlog.
- lapse in same schedule week preserves target/slot.
- calendar week change alone does not rotate.

## D. Domain non-regression

- existing domain block due behavior.
- current week-4 domain behavior unchanged.
- existing copy/actions unchanged where possible.
- current V1 rollback behavior unchanged.

## E. Eligibility

- chair unavailable.
- balance capability unavailable.
- support missing.
- mobility unavailable/malformed.
- no substitution.
- no plan impact.

## F. Stable identity

- same block/week/type -> same slot ID.
- different week -> different.
- different block -> different.
- callback clock does not change.
- input order does not change.
- malformed policy fails closed.

## G. Side/protocol

- chair side-independent.
- balance source standing leg prefill.
- balance deliberate leg change persisted.
- no inferred leg.
- mobility protocol side independent from official shoulder side.
- exact protocol version round-trip.

## H. Completion/idempotency

- one valid completion.
- duplicate screen callback.
- duplicate local save.
- duplicate adherence callback.
- duplicate remote row.
- cancel/incomplete.
- invalid result.
- app resume.
- one completed slot only.

## I. Credit/progression containment

- no schedule credit.
- no A/B/C rotation.
- no week completion.
- no main-plan credit.
- no progression event.
- no retest timing effect.
- no next-block effect.

## J. Official-profile containment

- no snapshot.
- no assessment.
- no focus change.
- no latest profile.
- no official history row.
- no comparison.
- no report creation.
- no current-plan replacement.

## K. Persistence

- local serialize/deserialize.
- backend sync.
- sync failure/local-ready.
- retry.
- restore.
- duplicate identical.
- conflict.
- malformed/future.
- export.
- account clear.

## L. UI

- Today/Home domain label.
- Balanced week 1/2/3 labels.
- no week-4 card.
- Plan optional state.
- Progress separate section.
- completion copy.
- no overdue/shame copy.
- no internal enum text.

## M. Report

- domain prior block count unchanged.
- Balanced zero/one/two/three counts.
- week-4 omission not treated as missing.
- next block micro-check state cannot alter frozen report.

## N. Claim guardrails

- no directional terms.
- no delta/percentage.
- no trend arrows.
- no Movement Age.
- no weakest copy.
- no Warden placeholder.
- no “Balanced result” for a domain-specific check-in.

## O. Restore/mixed modes

- existing V2 block with release off.
- true V1 rollback.
- mixed V1/V2 uses V2 block authority.
- malformed V2 fails closed.
- legacy micro-check cannot satisfy current Balanced slot.

## P. Product containment

- no H5C route retirement.
- no H5D release hardening.
- no official protocol change.
- no focus change.
- no block/report change.
- no audio generation.
- no Warden.
- no website work.

## Q. Regression

- H0-H5A.
- H4.1.1.
- Stage 3D-B.
- Stage 4.
- Stage 5G.1/H.
- Step-Up runtime.
- H5A Progress authority/history.
- navigation.
- TypeScript boundaries.
- safety/V2 audio.

## Test-quality requirements

Tests must:

- use the production scheduler;
- use real V2 domain/Balanced blocks;
- create schedule credits through production helpers;
- use real micro-check result/record types;
- use current local/backend serializers;
- use deterministic explicit timestamps;
- exercise actual lifecycle/view models/screens where feasible;
- assert input non-mutation;
- assert official containment.

Tests must not:

- mock every layer;
- duplicate the target policy in test-only code;
- cast malformed records into accepted types;
- use real camera/network;
- use wall-clock sleeps;
- install packages;
- regenerate audio;
- embed Warden data;
- alter focus or schedule policy.

# PART O — VALIDATION

## Step 60: Focused H5B validation

Run focused tests for:

- micro-check policy/target;
- app lifecycle/next-best action;
- scheduler;
- domain/Balanced blocks;
- MicroCheckScreen/runner;
- local persistence;
- micro-check sync/restore/export/account clear;
- report micro-check count;
- H5A Progress containment;
- V1 rollback;
- H4.1.1 lifecycle.

Record exact command and counts.

## Step 61: Full release gate

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
rm -rf /tmp/hale-unified-h5b-export
npx --no-install expo export --platform all --output-dir /tmp/hale-unified-h5b-export
rc=$?
rm -rf /tmp/hale-unified-h5b-export
exit $rc
```

Do not install dependencies.

Record:

- H5B suites/tests;
- focused aggregate suites/tests;
- full suites/tests;
- audio:
  - safety 44 cues / 88 assets;
  - Movement Profile V2 31 cues / 62 assets;
  - total 150 assets;
- app typecheck;
- website typecheck;
- Expo config;
- Android export;
- iOS export;
- asset count;
- `git diff --check`;
- known warnings;
- new warnings;
- whether validation changed files.

# PART P — MANUAL SOFTWARE TRACE

After automated validation, trace:

## Domain block

```text
active domain block
-> current schedule week has one credit
-> same-domain micro-check due
-> valid completion
-> slot complete
-> no schedule/progression/official effect
```

## Balanced week 1

```text
Balanced block
-> schedule week 1
-> Strength check-in
```

## Balanced week 2

```text
week 1 completes without/with micro-check
-> week 2
-> Balance check-in
-> no Strength backlog
```

## Balanced week 3

```text
week 3
-> Mobility check-in
```

## Balanced week 4

```text
week 4
-> no micro-check
-> normal sessions
-> official retest later
```

## Lapse

```text
calendar time passes
+ schedule week unchanged
-> same target and slot
```

## Offline

```text
valid local completion
-> remote failure
-> local slot complete
-> no duplicate after retry
```

## Progress/report

```text
micro-check saved
-> separate Progress section
-> not official history
-> factual prior-block report count only
```

# PART Q — REPORT

Create exactly one new report:

```text
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5B_BALANCED_MICRO_CHECK_POLICY.md
```

Do not edit prior reports or `docs/decisions.md`.

Required sections:

1. Scope.
2. H5A prerequisite evidence.
3. Founder/product decisions carried forward.
4. Initial Git status.
5. Re-entry/baseline validation.
6. Current micro-check architecture.
7. Current due decision.
8. Current target mapping.
9. Launch/completion/persistence map.
10. Existing contamination guards.
11. Canonical H5B policy module.
12. Policy version/fingerprint.
13. Domain target behavior.
14. Balanced week 1/2/3/week-4 policy.
15. Scheduler-derived due window.
16. No carry-over/backfill.
17. Stable slot identity.
18. Eligibility/safety behavior.
19. Record contract.
20. Side/protocol metadata.
21. Launch authority.
22. Completion/idempotency.
23. Schedule/progression containment.
24. Official-profile containment.
25. Today/Home behavior.
26. Plan behavior.
27. Progress behavior.
28. Completion/missed copy.
29. Local persistence.
30. Sync/restore/conflict.
31. Export/account clear.
32. H4 report micro-check count.
33. V1 rollback/mixed-state behavior.
34. Architecture/source guards.
35. Responsive/accessibility.
36. Claim guardrails.
37. Product containment.
38. Files changed.
39. Tests added/changed.
40. Exact focused validation.
41. Exact full validation.
42. Audio verification.
43. App/website typechecks.
44. Expo config/export.
45. H0-H5A/Stage 3D-B/Stage 4/Stage 5/Step-Up regression.
46. Remaining H5C/H5D/device work.
47. Whether H5C is unblocked.
48. Initial/final Git status.
49. Complete files-changed inventory.
50. Concurrent external changes.
51. Confirmation that no package install, lockfile change, audio regeneration, staging, commit, branch, push, or H5C/H5D work occurred.

# REQUIRED INVARIANTS

After H5B:

1. One pure micro-check target policy exists.
2. Policy uses scheduler week authority.
3. Domain-focused behavior remains current.
4. Balanced week 1 targets Strength.
5. Balanced week 2 targets Balance.
6. Balanced week 3 targets Mobility.
7. Balanced week 4 has no micro-check.
8. No fake Balanced focus domain exists.
9. Skipped slots do not carry over.
10. Calendar time alone does not rotate.
11. Stable slot identity exists.
12. One completion per slot.
13. Duplicate callbacks are idempotent.
14. Micro-check remains optional and non-blocking.
15. Ineligible target is not silently substituted.
16. Existing safety/capability gates are reused.
17. Strength micro-check is side-independent.
18. Balance standing-leg metadata is explicit where supported.
19. Mobility micro-check is not equated to official shoulder reach.
20. Micro-check protocol identity is preserved.
21. Micro-check gives no main-plan credit.
22. Micro-check gives no schedule credit.
23. Micro-check gives no progression evidence.
24. Micro-check does not affect retest timing.
25. Micro-check creates no V2 snapshot.
26. Micro-check creates no V2 assessment.
27. Micro-check changes no focus.
28. Micro-check creates no comparison/report/block.
29. Micro-check does not become latest official profile.
30. Micro-check remains outside official history.
31. Progress keeps micro-checks separate.
32. No trend/directional claim is added.
33. Local persistence/sync/restore are stable.
34. Export is bounded/private.
35. Account clear removes micro-check state.
36. Prior block report counts only valid completed slots.
37. Week-4 Balanced omission is not treated as missed.
38. Existing V2 blocks continue when release flag is off.
39. V1 rollback behavior remains.
40. No H5C/H5D work occurs.
41. Warden remains deferred.
42. Audio remains 150 assets.
43. Full repository gate passes.
44. Physical-device validation is not claimed.
45. Public release remains blocked.

# ACCEPTANCE CRITERIA

Do not mark H5B complete unless:

1. Balanced rotation is implemented exactly.
2. Domain behavior is preserved.
3. Scheduler—not calendar/raw count—owns rotation and due state.
4. Stable slot identity/idempotency is proven.
5. No carry-over/backfill is proven.
6. Eligibility fails closed without substitution.
7. Schedule/credit/progression containment is proven.
8. Official-profile containment is proven.
9. Persistence/sync/restore/export/account-clear pass.
10. Today/Home/Plan/Progress are truthful.
11. H4 report count remains factual.
12. V1 rollback remains green.
13. Focused tests pass.
14. Full Jest passes.
15. Audio verification passes.
16. App typecheck passes.
17. Website typecheck passes.
18. Expo config passes.
19. Android/iOS export passes.
20. `git diff --check` passes.
21. No unrelated work is overwritten.
22. No package/lockfile/audio change occurs.
23. No staging/commit/branch/push occurs.

Do not mark complete if:

- Balanced still has no policy;
- a fake focus domain is introduced;
- rotation uses calendar weeks;
- a skipped target becomes overdue/backlogged;
- a micro-check advances the plan;
- a micro-check changes the Movement Profile;
- a week-4 Balanced micro-check is added;
- a domain is silently substituted;
- official and micro histories are mixed;
- H5C or H5D is partially implemented.

# STAGE DECISIONS

At the end of the report state exactly one:

```text
UNIFIED MOVEMENT CHECK-UP STAGE H5B COMPLETE
UNIFIED MOVEMENT CHECK-UP STAGE H5B BLOCKED
```

Also state exactly one:

```text
BALANCED SCHEDULE-WEEK MICRO-CHECK ROTATION IMPLEMENTED
BALANCED MICRO-CHECK POLICY BLOCKED
```

Also state exactly one:

```text
DOMAIN MICRO-CHECK BEHAVIOR PRESERVED
DOMAIN MICRO-CHECK REGRESSION BLOCKED
```

Also state exactly one:

```text
MICRO-CHECK SLOT IDENTITY / IDEMPOTENCY VERIFIED
MICRO-CHECK IDEMPOTENCY BLOCKED
```

Also state exactly one:

```text
MICRO-CHECK SCHEDULE / PROGRESSION CONTAINMENT VERIFIED
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
V1 MICRO-CHECK ROLLBACK VERIFIED
V1 MICRO-CHECK ROLLBACK BLOCKED
```

Also state exactly one:

```text
UNIFIED MOVEMENT CHECK-UP STAGE H5C UNBLOCKED
UNIFIED MOVEMENT CHECK-UP STAGE H5C BLOCKED
```

Use H5C unblocked only when:

- domain and Balanced policies pass;
- scheduler authority passes;
- containment passes;
- persistence passes;
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

If H5B completes, the next stage is:

```text
HALE UNIFIED MOVEMENT CHECK-UP — STAGE H5C
PUBLIC V1 CHECK-UP / RESULTS ROUTE RETIREMENT,
UNIFIED V2 DEFAULT ENABLEMENT,
INTERNAL-HARNESS CONTAINMENT,
AND ROLLBACK-BUILD POLICY
```

H5C will:

- make the unified V2 path the only normal public Check-Up/results path;
- remove public V1 Check-Up/result entry;
- retain V1 code only behind an explicit rollback-build policy if still required;
- remove beta-facing developer V2 entries;
- keep V1 scoring/history out of V2 public surfaces;
- preserve H5A/H5B lifecycle;
- leave final release-candidate hardening for H5D.

Do not begin H5C in this task.

# FINAL CODEX RESPONSE

Return a concise summary containing:

- Report path.
- Whether production runtime code changed.
- Re-entry typecheck/baseline.
- Current micro-check architecture.
- Policy module/path/version/fingerprint.
- Domain mapping result.
- Balanced week 1/2/3/week-4 result.
- Scheduler authority.
- No carry-over/backfill behavior.
- Stable slot identity.
- Eligibility/safety behavior.
- Side/protocol metadata behavior.
- Completion/idempotency.
- Schedule/main-plan/progression containment.
- Official Movement Profile containment.
- Today/Home behavior.
- Plan behavior.
- Progress behavior.
- Completion/missed copy.
- Local persistence.
- Sync/restore/conflict result.
- Export/account-clear result.
- Report micro-check count result.
- V1 rollback result.
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
- Confirmation that H0-H5A, H4.1.1, Stage 3D-B, Stage 4, Stage 5, Step-Up resume, navigation, TypeScript boundaries, safety audio, and V2 audio remain green.
- `UNIFIED MOVEMENT CHECK-UP STAGE H5B COMPLETE` or blocked.
- Balanced-policy verdict.
- Domain-regression verdict.
- Idempotency verdict.
- Credit-containment verdict.
- Official-profile-containment verdict.
- Persistence verdict.
- V1 rollback verdict.
- `UNIFIED MOVEMENT CHECK-UP STAGE H5C UNBLOCKED` or blocked.
- `BALANCED WEEK 1 MICRO-CHECK IS STRENGTH`.
- `BALANCED WEEK 2 MICRO-CHECK IS BALANCE`.
- `BALANCED WEEK 3 MICRO-CHECK IS MOBILITY`.
- `BALANCED WEEK 4 HAS NO MICRO-CHECK`.
- `MISSED BALANCED MICRO-CHECKS DO NOT CARRY OVER`.
- `WARDEN TRANSFORM DEFERRED`.
- `PHYSICAL DEVICE VALIDATION NOT CLAIMED`.
- `PUBLIC RELEASE REMAINS BLOCKED`.
- Initial/final Git status.
- Complete files-changed inventory.
- Concurrent external changes.
- Confirmation that no package install, lockfile change, audio regeneration, staging, commit, branch, push, or H5C/H5D work occurred.
