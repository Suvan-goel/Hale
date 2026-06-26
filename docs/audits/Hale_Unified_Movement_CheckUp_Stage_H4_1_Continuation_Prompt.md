You are resuming the previously blocked verification stage of Hale’s approved unified Movement Check-Up architecture:

HALE UNIFIED MOVEMENT CHECK-UP — STAGE H4.1 CONTINUATION
END-TO-END OFFICIAL V2 RETEST / REPORT / NEXT-BLOCK VERIFICATION,
PARTIAL-STATE RECOVERY, OFFLINE / RESTORE / EXPORT HARDENING,
CROSS-CONSUMER CONSISTENCY, AND CLAIM-GUARDRAIL PROOF

This is a continuation of the blocked H4.1 verification pass.

The unrelated Step-Up runtime TypeScript blocker has now been cleared.

Do not begin H5.

## Why this is a continuation rather than a new stage

The first H4.1 run stopped before adding the required end-to-end verification matrix because the pre-edit app typecheck failed in concurrent Step-Up runtime work:

```text
src/training/setRuntime.ts:
Property 'resume' is missing in type 'StepUpAlternationSetRuntime'
but required in type 'TrainingSetRuntime'.
```

That blocker has since been resolved and verified by:

```text
docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_RESUME_HEALTH_GATE.md
```

The Step-Up health gate reportedly established:

- initial TS2741 no longer reproduced because `resume()` already existed in the current tree;
- shared runtime signatures were made explicit;
- pause/resume safe-boundary regression coverage was added;
- app typecheck passed;
- focused Step-Up suite passed;
- focused runtime/backend slice passed;
- full Jest passed:
  - 144 suites;
  - 1,197 tests;
- audio verification passed;
- website typecheck passed;
- Expo config/export passed;
- H4/H3.1 re-entry slice passed:
  - 32 suites;
  - 318 tests;
- decision:
  - `UNIFIED MOVEMENT CHECK-UP STAGE H4.1 READY TO RERUN`.

Verify all current facts rather than assuming they remain unchanged.

## Prior blocked H4.1 report

Read this report in full:

```text
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_1_END_TO_END_VERIFICATION.md
```

Do not edit or overwrite it.

It remains the historical record of the blocked first attempt.

Its important conclusions were:

- H4 production modules were inspected;
- H4/H3.1 focused tests passed before the blocker;
- full Jest passed before the blocker;
- audio, website typecheck, Expo config/export, and `git diff --check` passed;
- app typecheck failed in unrelated Step-Up runtime work;
- no H4.1 integration tests were added;
- no H4.1 production fixes were made;
- all H4.1 verdicts were left blocked;
- H5 remained blocked.

This continuation must add and run the matrix that the prior attempt could not start.

## H4 implementation prerequisite

Read this report in full:

```text
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_OFFICIAL_RETEST_REPORT_NEXT_BLOCK.md
```

H4 reports that the current code implements:

```text
V2-origin block scheduler retest_due
-> public unified V2 official retest
-> current frozen V2 snapshot and assessment
-> claim-neutral previous/current comparison
-> one V2 block report
-> prior block completed
-> one automatic next V2 block
```

It also reports these exact navigation-only CTAs:

```text
View my block report
View my next 4-week plan
```

H4 made a correction so:

```text
report.microChecksCompleted
```

uses the completed prior block’s micro-check count rather than the new next block’s count.

H4.1 continuation must verify that correction explicitly.

## H3.1 prerequisite

Read in full:

```text
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H3_1_END_TO_END_VERIFICATION.md
```

H3.1 already provides the production-faithful pattern for:

- release flag off V1 path;
- release flag on unified V2 domain baseline;
- release flag on genuine Balanced baseline;
- one live-coordinator-derived raw Check-Up;
- no V1 artifact leakage;
- snapshot/assessment/block idempotency;
- local-first sync-pending behavior;
- restore;
- kill-switch preservation;
- official-retest containment before H4.

Extend that style to H4 rather than creating a fake isolated transition test.

## Founder/product decisions locked

### Canonical current system

All new public official Check-Ups under the unified release flag use:

```text
polished shared Check-Up shell
+
V2 live protocols
+
frozen V2 artifacts
+
automatic V2-origin plan lifecycle
```

A V2-origin official retest must never run through V1.

### No V1-user migration requirement

No real user completed a V1 Check-Up.

Do not add:

- a public legacy Movement Age section;
- V1-to-V2 conversion;
- mixed V1/V2 trend graphs;
- permanent dual current-result logic.

Retain the flag-off V1 rollback path only as a controlled rollback implementation.

### Automatic plan creation

The next block is created as part of the successful official-retest transition.

The user does not build or generate it.

The CTAs only navigate:

```text
View my block report
View my next 4-week plan
```

They must not:

- create a report;
- create or replace a block;
- sync lifecycle state;
- change block dates;
- start a session.

### Claim-neutral comparison

H4 may show factual previous and current raw values.

H4 must not store or display:

- numeric delta;
- percentage change;
- percentile change;
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
- protected progress;
- passed;
- failed.

Do not use green/red direction styling or up/down trend arrows.

### Warden

Warden chair-percentile implementation remains deferred.

Chair remains raw-only.

### Physical-device and release posture

Physical-device validation is not claimed.

Public release remains blocked.

H4.1 is software verification only.

## Required prior reading

Read in full before mutation:

- `docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_RESUME_HEALTH_GATE.md`
- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_1_END_TO_END_VERIFICATION.md`
- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_OFFICIAL_RETEST_REPORT_NEXT_BLOCK.md`
- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H3_1_END_TO_END_VERIFICATION.md`
- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H3_BASELINE_ONBOARDING_CUTOVER.md`
- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H2_V1_RESULTS_SHELL_V2_PROFILE.md`
- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H1_V1_SHELL_V2_ADAPTER.md`
- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H0_HEALTH_GATE.md`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2D_2C.md`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2D_2A.md`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2D_1.md`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2C.md`
- `docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5G_1.md`
- `docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5H.md`

Also inspect:

- `AGENTS.md`;
- `CLAUDE.md`;
- `docs/decisions.md`;
- all current H4 modules;
- all current H4 tests;
- App official-retest orchestration;
- public Check-Up engine selector;
- Stage 5 scheduler;
- V2 comparison parser/builder;
- V2 report parser/builder/view model;
- local adherence/report persistence;
- backend report sync;
- restore;
- data export;
- account clear;
- Today/Plan/Progress/Home actions;
- H2 result presentation;
- V2 block-report screen;
- V1 official-retest rollback;
- current Step-Up runtime files/tests to ensure the health gate remains green.

Treat current code—including current untracked production files—as source of truth.

## Verification/remediation mode

This is verification-first.

Permitted repository changes:

1. New production-faithful H4.1 integration/property tests.
2. A minimal test harness using production helpers.
3. Narrow production fixes only after a failing H4.1 test proves a real H4 defect.
4. One new H4.1 continuation report.

Do not proactively redesign H4.

If App orchestration cannot be tested without copying logic into a test-only fake, you may extract the smallest pure production helper and make App call it.

Any extraction must:

- preserve behavior;
- be driven by a failing verification test;
- create no parallel authority;
- perform no H5 work;
- perform no UI redesign;
- be documented exactly.

This task must not implement:

- V2-canonical Progress hero/history;
- Balanced micro-check product policy;
- public V1 route retirement;
- release-candidate cleanup;
- Warden;
- new audio;
- protocol/reference/focus policy changes;
- exercise/training policy changes;
- physical-device testing.

# PART A — WORKTREE SAFETY

## Step 1: Capture exact initial state

Before analysis or edits, run:

```bash
git status --short --untracked-files=all
git diff --name-only
git diff --stat
git ls-files --others --exclude-standard
```

Record exact output in the continuation report.

Rules:

1. Treat every existing tracked and untracked file as user-owned.
2. Inspect current diffs before touching any file.
3. Preserve concurrent App, H4, Step-Up, report, Progress, backend, training, render, website, and docs work.
4. Do not revert, delete, move, or broadly reformat unrelated work.
5. Do not edit:
   - the prior blocked H4.1 report;
   - the H4 report;
   - the Step-Up health-gate report;
   - `docs/decisions.md`.
6. Do not use destructive Git commands.
7. Do not install packages.
8. Do not modify lockfiles.
9. Do not regenerate audio.
10. Do not stage, commit, branch, push, or open a PR.
11. Do not inspect or expose `.env` values or provider credentials.
12. Do not modify or share font files.
13. If concurrent changes make H4 lifecycle authority ambiguous, stop mutation and mark the continuation blocked.

# PART B — RE-ENTRY HEALTH GATE

## Step 2: Run app typecheck first

Run:

```bash
npm run typecheck
```

This must pass before adding H4.1 tests.

### If it passes

Continue.

### If it fails

- classify every diagnostic;
- do not repair unrelated work in this continuation;
- create the continuation report with a blocked verdict;
- stop before adding the H4.1 matrix.

## Step 3: Verify Step-Up health-gate non-regression

Run the current focused Step-Up/runtime tests used by:

```text
docs/audits/HALE_TRAINING_STEP_UP_RUNTIME_RESUME_HEALTH_GATE.md
```

At minimum include:

- `src/training/stepUpAlternation/__tests__/stepUpRuntimeIntegration.test.ts`;
- current `setRuntime` tests;
- session-player tests;
- relevant backend/runtime slice.

Confirm:

- `TrainingSetRuntime.resume` remains required;
- Step-Up runtime structurally satisfies the interface;
- no unsafe cast/suppression;
- pause/resume safe-boundary regression remains green.

Do not change Step-Up product behavior unless a current H4.1 test proves a direct cross-stage regression.

## Step 4: Re-run H4/H3.1 re-entry baseline

Run the same current focused H4/H3.1 suite used by the Step-Up health gate.

The latest expected result was:

```text
32 suites
318 tests
```

Use current file paths and record current counts.

Only after:

- app typecheck passes;
- Step-Up focused health gate passes;
- H4/H3.1 re-entry baseline passes;

may the H4.1 continuation add the missing verification matrix.

# PART C — CURRENT H4 INVENTORY AND CALLBACK MAP

## Step 5: Inventory all H4 modules

Search current code for:

```text
movementProfileV2OfficialRetest
movementProfileV2RetestComparison
movementProfileV2BlockReport
View my block report
View my next 4-week plan
official_retest
retest_due
movement_profile_v2_block_report
```

Create:

| Responsibility | Current module | Pure/side-effecting | Existing tests | Continuation proof required |
| --- | --- | --- | --- | --- |

Inventory at minimum:

- public official-retest selection;
- launch context;
- prior standing-leg/shoulder/reference prefill;
- current artifact materialisation;
- comparison;
- report;
- transition;
- local persistence;
- remote sync;
- restore;
- export;
- account clear;
- result UI;
- report UI;
- Today/Plan/Progress/Home/direct routing;
- V1 rollback.

## Step 6: Map actual production callbacks

Trace:

```text
Today / Plan / Progress / Home / direct action
-> public selector
-> frozen official-retest launch context
-> unified V2 Check-Up
-> raw local save
-> reference-details confirmation
-> current snapshot/assessment materialisation
-> H4 transition
-> local adherence/report persistence
-> retest result route
-> block report route
-> next plan route
-> remote sync
```

For each boundary record:

- function/module;
- input;
- output;
- local write;
- remote write;
- route;
- stable identity;
- duplicate behavior;
- failure behavior.

# PART D — PRODUCTION-FAITHFUL H4.1 TEST HARNESS

## Step 7: Inspect before creating new tests

First search for any current concurrent H4.1 integration tests already added since the blocked run.

If high-quality current tests already cover part of this matrix:

- reuse/extend them;
- do not duplicate them;
- record exact coverage.

## Step 8: Add focused integration suites

Use repository-consistent paths, for example:

```text
src/checkup/__tests__/publicUnifiedMovementCheckUpOfficialRetest.integration.test.ts
src/haleFlow/__tests__/movementProfileV2OfficialRetestRecovery.integration.test.ts
```

One well-structured file is acceptable.

The harness must use production helpers for:

- baseline V2 artifact creation;
- initial V2 block materialisation;
- 12 schedule credits;
- scheduler `retest_due`;
- public selector;
- frozen launch context;
- live coordinator/synthetic pose replay;
- raw official-retest Check-Up;
- reference-details conversion;
- current snapshot/assessment materialisation;
- comparison;
- report;
- official-retest transition;
- local adherence/history serialization;
- report sync;
- backend restore;
- export;
- account clear;
- H2 result presentation;
- H4 block-report presentation;
- Today/Plan/Progress/Home consumers.

Do not create a separate fake H4 lifecycle.

## Step 9: At least one live-derived official retest

At least one complete continuation scenario must produce the current official-retest raw Check-Up through:

```text
MovementProfileV2LiveCoordinator
```

using deterministic synthetic pose events.

It must not rely solely on a canned current-retake artifact.

Required chain:

```text
live official retest
-> raw Check-Up
-> current snapshot
-> current assessment
-> comparison
-> report
-> completed prior block
-> active next block
```

# PART E — AUTHORITATIVE PRIOR BLOCK FIXTURES

## Step 10: Build a real domain block to retest_due

Using production helpers:

1. Create valid frozen V2 baseline artifacts.
2. Create the initial V2 domain block.
3. Generate/record 12 honest A/B/C schedule credits.
4. Satisfy four sequential weeks and timing.
5. Verify scheduler is exactly:

```text
retest_due
```

Do not set stale counters/status fields directly.

Assert:

- 12 schedule credits;
- four completed weeks;
- one active prior block;
- no retest completion;
- no report;
- no next block.

## Step 11: Build a real Balanced block to retest_due

Repeat using a genuine Balanced V2 block.

Assert:

- no fake `focusDomain`;
- `balanced-A/B/C` schedule;
- 4 Strength-primary;
- 4 Balance-primary;
- 4 Mobility-primary;
- scheduler exactly `retest_due`.

# PART F — PUBLIC SELECTOR AND FROZEN LAUNCH CONTEXT

## Step 12: Eligible domain and Balanced routing

For both prior block types:

```text
release flag on
+ V2 origin
+ scheduler retest_due
+ valid prior artifacts
-> unified V2 official retest
```

Assert:

```text
sourceType = official_retest
entryContext = public_official_retest
```

## Step 13: Ineligible matrix

Test:

- release flag off;
- scheduler early;
- stale block status claiming completion without scheduler evidence;
- missing prior Check-Up;
- missing prior snapshot;
- missing prior assessment;
- source mismatch;
- immutable conflict;
- malformed/future artifact;
- different active block;
- unknown origin.

All fail closed.

No V2-origin case may launch V1.

## Step 14: Launch-context immutability

Assert launch freezes:

- prior block ID/fingerprint;
- prior Check-Up ID/fingerprint;
- prior snapshot ID/fingerprint;
- prior assessment ID/fingerprint;
- source type;
- scheduler date identity;
- prior standing leg;
- prior shoulder side;
- prior reference profile;
- current Check-Up ID/start time.

Mutating live stores after launch must not alter the frozen context.

# PART G — DOMAIN OFFICIAL-RETEST LIFECYCLE

## Step 15: Complete one domain lifecycle

Using the real retest-due domain fixture and a valid current official retest, verify:

1. Public selector chooses unified V2.
2. H1 shared Check-Up shell is the public player.
3. Current raw Check-Up saves before reference details.
4. Prior standing leg/shoulder/reference details prefill.
5. User confirmation/edit is explicit.
6. Current snapshot created once.
7. Current assessment created once.
8. Comparison created once.
9. V2 report created once.
10. Stable retest completion created once.
11. Prior block becomes completed.
12. Exactly one next V2 block becomes active.
13. Next block binds to current artifacts.
14. H2 retest result is ready.
15. CTA is exactly:

```text
View my block report
```

16. CTA only navigates.
17. H4 report is ready.
18. CTA is exactly:

```text
View my next 4-week plan
```

19. CTA only navigates.
20. Session A does not start automatically.

# PART H — BALANCED LIFECYCLE MATRIX

## Step 16: Balanced -> Balanced

Verify:

- prior block genuinely Balanced;
- current assessment genuinely Balanced;
- next block genuinely Balanced;
- no fake domain;
- comparison/report support Balanced;
- no Strength fallback.

## Step 17: Balanced -> domain

Produce legitimate current domain evidence.

Verify:

- report records prior Balanced and current domain truthfully;
- no copy says prior plan was wrong;
- next block uses current domain.

## Step 18: Domain -> Balanced

Verify:

- next block genuinely Balanced;
- report/result copy remains neutral;
- no fake domain.

# PART I — SIDE / LEG / REFERENCE COMPARABILITY

## Step 19: Fully comparable case

Use:

- same standing leg;
- same shoulder side;
- compatible protocol/display/source policy;
- compatible reference profile.

Verify factual previous/current values.

Assert serialized comparison and presentation contain no numeric delta field.

## Step 20: Standing leg changed

Verify:

- current result valid;
- balance comparison marked shown separately/not directly comparable;
- visible explanation names the different standing leg;
- no equivalent-column comparison styling;
- no direction/delta;
- other compatible domains remain comparable.

## Step 21: Shoulder side changed

Verify equivalent behavior for Mobility.

## Step 22: Both changed

Verify aggregate comparison status follows current policy.

## Step 23: Reference profile changed

Change age/reference group.

Verify:

- old snapshot immutable;
- current profile frozen separately;
- raw comparison remains only where allowed;
- reference interpretation comparison suppressed where incompatible;
- no historical reinterpretation.

## Step 24: Setup/protocol incompatibility

Test:

- chair setup uncertainty;
- protocol-policy mismatch;
- display-policy mismatch;
- source-policy mismatch;
- unsupported future policy.

Fail closed without fabricating direct comparison.

# PART J — CLAIM-NEUTRAL SCHEMA AND UI

## Step 25: Schema scan

Inspect:

- comparison types;
- builder;
- parser;
- JSON;
- result adapter;
- report adapter;
- visible copy.

Assert no field or visible value represents:

- numeric difference;
- percentage difference;
- direction;
- significance;
- improvement/decline;
- score;
- age change;
- percentile change.

## Step 26: Copy guardrail

Render compatible and non-comparable states.

Assert absence of:

```text
improved
declined
increased
decreased
better
worse
stronger
steadier
more mobile
younger
older
meaningful change
protected progress
passed
failed
```

Also assert no generated `+N`, `-N`, or percentage-change label in the comparison UI.

Scope pattern matching carefully to avoid false positives from unrelated layout values.

## Step 27: Visual/accessibility semantics

Verify:

- no up/down trend arrow;
- no red/green direction semantics;
- `Above the published middle range` remains neutral;
- screen-reader labels state factual prior/current values;
- non-comparable reason is announced.

# PART K — V2 REPORT CONTRACT AND PRIOR MICRO-CHECK COUNT

## Step 28: Strict report contract

Verify:

- distinct V2 report kind/schema;
- strict parser;
- exact prior/current source binding;
- stable report ID/fingerprint;
- JSON-safe;
- no V1 score snapshot;
- no Movement Age;
- no `weakestDomain`;
- no direction field.

## Step 29: Authoritative schedule summary

Verify report derives from:

- completed prior block;
- authoritative 12 schedule credits;
- four weeks;
- first/final credit dates;
- retest eligibility date.

Do not trust cached `completedSessions`.

## Step 30: Explicit micro-check correction proof

Verify:

```text
report.microChecksCompleted
```

comes from the completed prior block / prior-block authoritative micro-check history.

Cover:

1. Prior block has zero micro-checks, next block has a non-zero fixture value.
2. Prior block has multiple micro-checks, next block has zero.
3. Prior and next blocks have different counts.
4. Serialize/restore/reopen preserves the prior count.
5. Reopening the report does not recompute from the current active block.

## Step 31: Report identity/read-only reopening

Test:

- same inputs -> same ID/fingerprint;
- different callback clock -> no drift;
- repeat creation -> reuse;
- same ID/different fingerprint -> immutable conflict;
- first accepted report preserved;
- repeated screen opening performs no lifecycle mutation.

# PART L — EXACTLY-ONCE TRANSITION

## Step 32: Full transition invariant

After one successful transition assert exactly:

- one current official-retest Check-Up;
- one current snapshot;
- one current assessment;
- one comparison;
- one retest completion;
- one V2 report;
- prior block completed;
- one active next block;
- no second active/paused block;
- no V1 artifact.

## Step 33: Next-block source binding

Assert next block:

- ID derives from current assessment;
- origin binds to current Check-Up/snapshot/assessment;
- focus is current frozen domain/Balanced;
- start date follows stable H4 policy;
- equipment/capability/safety/release/progression policy remains current;
- neither CTA created it.

## Step 34: Invalid current headline

Expected:

- raw current evidence may persist;
- no current official assessment;
- no comparison/report;
- no retest completion;
- prior block remains `retest_due`;
- no next block;
- no V1 fallback.

## Step 35: Active-block conflict

A different active/paused block must fail closed without completing the due block.

# PART M — CALLBACK IDEMPOTENCY

## Step 36: Duplicate raw completion

One current Check-Up only.

## Step 37: Duplicate reference submission

One current snapshot and assessment only.

## Step 38: Duplicate transition

Invoke repeatedly with:

- identical explicit timestamp;
- different fallback callback timestamps;
- equivalent reordered inputs where accepted.

Assert stable one report/completion/next block.

## Step 39: Duplicate navigation

Repeated:

```text
View my block report
View my next 4-week plan
```

must not mutate lifecycle or start a session.

# PART N — PARTIAL-STATE RECOVERY

## Step 40: Assessment exists, transition missing

Resume from accepted current artifacts without recomputing snapshot/assessment.

## Step 41: Report exists, prior block still active

Verify deterministic repair/reuse without a second report.

## Step 42: Prior block completed, next block missing

Resume/create only the one expected next block when all frozen evidence is valid.

## Step 43: Next block exists, report missing

Follow current safe policy:

- reuse exact frozen transition evidence to create/recover the one expected report;
- or fail closed if immutable evidence is insufficient.

Never create a second next block.

## Step 44: Retest completion missing

Create once or remain explicitly incomplete according to the current transition policy.

## Step 45: Local complete, remote stale

Local state remains usable and authoritative.

Remote retry must not roll local state back.

## Step 46: Immutable conflicts

Cover:

- comparison conflict;
- report conflict;
- current assessment conflict;
- next-block conflict.

Preserve first accepted truth and fail closed.

## Step 47: Release flag off mid-transition

Verify:

- no new public V2 retest starts;
- complete local transition remains readable/trainable;
- complete sync-pending transition can continue remote sync;
- partial current V2 retest never becomes V1;
- no data deletion.

# PART O — OFFLINE / SYNC / RESTORE / EXPORT / ACCOUNT CLEAR

## Step 48: Remote failure at each boundary

Inject existing mocked failure for:

- current Check-Up sync;
- report sync;
- prior block sync;
- next block sync;
- training-state sync;
- completion sync.

Expected:

- local result/report/next block usable;
- no duplicate transition;
- retry idempotent;
- no V1 fallback.

## Step 49: Complete restore

Round-trip through current local and backend restore.

Assert:

- prior block completed;
- one current retest;
- one report;
- one active next block;
- fingerprints preserved;
- report read-only;
- next block plans sessions.

## Step 50: Partial restore

Cover each partial state from Part N.

## Step 51: Duplicate/reordered remote rows

Test:

- identical duplicates;
- out-of-order rows;
- stale remote prior block;
- stale remote missing report;
- malformed report;
- future report schema;
- source mismatch.

Preserve accepted local truth and fail closed.

## Step 52: Export sanitization

Verify bounded V2 report/comparison export excludes:

- landmarks;
- frames;
- video/image/base64;
- local paths/URIs;
- auth tokens;
- provider secrets;
- source document content.

## Step 53: Account clear

Verify current account-clear removes:

- V2 report;
- current retest artifacts;
- transition metadata;
- next block;

with the account’s local state.

No orphan comparison/report store remains.

# PART P — RESULT AND REPORT UI

## Step 54: Retest result

Render valid retest result.

Assert:

- current frozen V2 cards;
- compatible factual previous/current values;
- non-comparable notes;
- current frozen focus;
- exact CTA:

```text
View my block report
```

CTA navigation only.

## Step 55: V2 block report

Render domain and Balanced reports.

Assert:

- `Your 4-week block is complete`;
- factual 12-session summary;
- neutral comparison;
- current focus;
- next plan ready;
- exact CTA:

```text
View my next 4-week plan
```

CTA navigation only.

## Step 56: V1 report non-regression

True V1 rollback report remains unchanged.

# PART Q — TODAY / PLAN / PROGRESS / HOME CONSISTENCY

## Step 57: Before retest

### Early

No consumer launches official retest.

### Retest due

Today, Plan, Progress, Home, and direct App action all use the same scheduler/selector truth and launch unified V2 retest.

No stale block status shortcut.

## Step 58: During partial retest

No consumer exposes:

- report ready;
- next plan ready;
- completed prior block;
- V1 retest.

## Step 59: After transition

All consumers agree:

- prior block completed;
- report ready;
- one next block active;
- Today/Plan use next block;
- Progress no longer exposes stale due action;
- Home follows current report/next-session ordering;
- direct official-retest cannot start another retest for the completed prior block.

Do not redesign Progress.

## Step 60: Same-day retest/next block

Verify no next-block session starts automatically.

# PART R — V1 ROLLBACK

## Step 61: True V1-origin official retest

With the unified release flag off and true V1-origin block:

- current V1 official retest remains;
- current V1 report remains;
- current V1 next block remains;
- no V2 artifact is produced.

## Step 62: Cross-protocol isolation

V2 transition cannot create V1 report/artifacts.

V1 transition cannot create V2 report/artifacts.

# PART S — ARCHITECTURE GUARDS

## Step 63: Navigation-only result/report modules

Source guards must prove V2 result/report screens do not import/call:

- V2 block factory;
- H4 transition;
- report builder;
- block/report upsert;
- report sync;
- session start.

## Step 64: Pure builders

Comparison/report/transition pure helpers must not:

- read ambient clock;
- read environment;
- perform I/O;
- log;
- mutate inputs;
- read live profile;
- rerun current source tables beyond accepted frozen artifacts.

## Step 65: No V1 artifact leak

Assert no V1 score, score snapshot, MovementAssessment, report, next block, or Movement Age copy in V2 official retest.

# PART T — ALLOWED NARROW REMEDIATION

If a test proves a real defect, fix only that defect.

Permitted examples:

- unstable report/comparison identity;
- duplicate transition effect;
- missing resume selector;
- report micro-check count tied to next block;
- changed side/leg shown as directly comparable;
- CTA calls materialisation;
- consumer bypasses scheduler/selector;
- remote restore duplicates next block;
- malformed report promoted;
- V1 artifact leak.

Not permitted:

- H5 Progress redesign;
- Balanced micro-check policy;
- public V1 retirement;
- Warden;
- new reference policy;
- new audio;
- broad state rewrite;
- unrelated Step-Up redesign.

Every production fix must have a failing test first.

# PART U — REQUIRED TEST MATRIX SUMMARY

At minimum, final H4.1 continuation coverage must include:

## Domain and Balanced

- domain retest-due lifecycle;
- Balanced retest-due lifecycle;
- Balanced -> Balanced;
- Balanced -> domain;
- domain -> Balanced.

## Live-derived current retest

- at least one full current official retest through the live coordinator.

## Comparability

- all comparable;
- changed leg;
- changed shoulder;
- both changed;
- changed reference profile;
- protocol/display/source incompatibility.

## Claim neutrality

- no delta/direction/significance fields;
- no directional copy;
- no trend styling.

## Report

- stable identity;
- schedule summary;
- prior micro-check count;
- read-only reopen;
- immutable conflict.

## Transition

- one report;
- one retest completion;
- prior completed;
- one next block;
- no second active block;
- invalid current retest fail-closed.

## Recovery

- duplicate callbacks;
- partial states;
- immutable conflicts;
- release flag off mid-transition.

## Persistence

- offline failures;
- sync retry;
- complete/partial restore;
- duplicates/reordering;
- export;
- account clear.

## Consumers

- Today;
- Plan;
- Progress;
- Home;
- direct action;
- before/during/after transition.

## Rollback

- true V1 retest/report/next block unchanged.

## Containment

- no H5;
- no Progress redesign;
- no Balanced micro-check policy change;
- no Warden;
- no audio regeneration;
- no public V1 retirement.

# PART V — VALIDATION COMMANDS

## Step 66: H4.1 focused validation

Run all new continuation tests plus existing relevant suites for:

- Step-Up runtime health gate;
- public selector;
- scheduler;
- live coordinator;
- V2 snapshot/assessment;
- V2 comparison;
- V2 report;
- H4 transition;
- H2 result adapter;
- V2 report screen/view model;
- adherence/local persistence;
- report sync;
- restore;
- export;
- account clear;
- Today/Plan/Progress/Home;
- V1 report;
- Stage 5G.1/H.

Record exact command and counts.

## Step 67: Full release gate

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
rm -rf /tmp/hale-unified-h41-continuation-export
npx --no-install expo export --platform all --output-dir /tmp/hale-unified-h41-continuation-export
rc=$?
rm -rf /tmp/hale-unified-h41-continuation-export
exit $rc
```

Do not install dependencies.

Record:

- new H4.1 continuation suites/tests;
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
- Watchman warning;
- Jest open-handle notice;
- Sentry warning;
- expected backend failure-path logs;
- any new warning;
- whether validation changed files.

# PART W — MANUAL SOFTWARE TRACE

After automated validation, retrace:

## Domain

```text
real domain block
-> 12 credits
-> scheduler retest_due
-> live unified V2 official retest
-> current artifacts
-> neutral comparison
-> one report
-> prior completed
-> one next block
-> result
-> report
-> next plan
```

## Balanced

Trace the same with a genuine Balanced prior block.

## Changed side/leg

Trace non-comparable copy and no directional claim.

## Invalid current retest

```text
raw preserved
-> no transition
-> prior remains retest_due
-> no report
-> no next block
```

## Replay

```text
same transition repeatedly
-> one report
-> one completion
-> one next block
```

## Partial state

Trace every Part N state.

## Offline

Trace local-ready through every remote failure and retry.

## Consumer consistency

Trace Today/Plan/Progress/Home before, during, and after transition.

## V1 rollback

Trace a true V1 official retest/report/next block unchanged.

# PART X — CONTINUATION REPORT

Create exactly one new report:

```text
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_1_END_TO_END_VERIFICATION_CONTINUATION.md
```

Do not edit or replace:

```text
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_1_END_TO_END_VERIFICATION.md
```

The continuation report must contain:

1. Scope.
2. Why a continuation was required.
3. Prior blocked H4.1 result.
4. Step-Up health-gate prerequisite evidence.
5. H4/H3.1 prerequisite evidence.
6. Initial Git status.
7. Re-entry app typecheck.
8. Step-Up non-regression.
9. H4/H3.1 re-entry baseline.
10. Current H4 module inventory.
11. Actual production callback map.
12. Continuation test-harness architecture.
13. Domain prior-block fixture proof.
14. Balanced prior-block fixture proof.
15. Public selector/launch-context proof.
16. Live-derived official retest proof.
17. Domain lifecycle proof.
18. Balanced lifecycle proof.
19. Focus-transition matrix.
20. Prior leg/side behavior.
21. Reference-profile-change behavior.
22. Comparison compatibility proof.
23. Claim-neutral schema/copy/visual proof.
24. V2 report contract proof.
25. Schedule summary proof.
26. Prior-block micro-check proof.
27. Report identity/read-only proof.
28. Exactly-once transition proof.
29. Next-block source-binding proof.
30. Invalid-current-retest fail-closed proof.
31. Callback idempotency proof.
32. Partial-state recovery matrix.
33. Release-flag rollback during transition.
34. Offline/sync-failure proof.
35. Restore/duplicate/reordering proof.
36. Export/account-clear proof.
37. Retest-result UI proof.
38. V2 block-report UI proof.
39. Today/Plan/Progress/Home consistency.
40. V1 rollback proof.
41. Architecture/source-guard proof.
42. Defects found.
43. Production fixes, if any.
44. Files changed.
45. Tests added/changed.
46. Exact focused validation.
47. Exact full validation.
48. Audio verification.
49. App/website typechecks.
50. Expo config/export.
51. H0-H4/Stage 3D-B/Stage 4/Stage 5 regression.
52. Remaining H5/release/device work.
53. Whether H5 is unblocked.
54. Initial/final Git status.
55. Complete files-changed inventory.
56. Concurrent external changes.
57. Confirmation that no package install, lockfile change, audio regeneration, staging, commit, branch, or push occurred.

# REQUIRED INVARIANTS

After this continuation:

1. App typecheck passes before H4.1 work starts.
2. Step-Up resume health gate remains green.
3. H4/H3.1 re-entry baseline passes.
4. A real domain block reaches `retest_due` from 12 schedule credits.
5. A real Balanced block reaches `retest_due` from 12 schedule credits.
6. Eligible V2 official retest uses the public unified V2 flow.
7. No V2 official retest launches V1.
8. At least one current retest is live-coordinator-derived.
9. Launch context is frozen and source-bound.
10. Raw current retest saves before reference details.
11. Prior leg/side prefill is correct.
12. Changed leg suppresses direct balance comparison.
13. Changed side suppresses direct shoulder comparison.
14. Prior snapshot remains immutable after reference-profile change.
15. Current snapshot/assessment are created once.
16. Invalid current headline creates no lifecycle transition.
17. Comparison is strict, source-bound, JSON-safe, and claim-neutral.
18. Comparison contains no delta/direction/significance field.
19. UI contains no directional claim or trend styling.
20. One V2 report exists per completed prior block.
21. Report contains no V1 score/Movement Age fields.
22. Report schedule summary comes from authoritative credits.
23. Report micro-check count comes from the completed prior block.
24. Report identity/timestamp/fingerprint are stable.
25. Reopening report is read-only.
26. One stable retest completion exists.
27. Prior block completes only with a valid full transition.
28. Exactly one active next V2 block exists.
29. Next block binds to current retest artifacts.
30. Domain and Balanced next-block outcomes work.
31. Repeated callbacks are idempotent.
32. Partial transition states recover or fail closed explicitly.
33. Local-ready survives remote failure.
34. Restore preserves accepted fingerprints.
35. Duplicate/reordered remote state cannot create duplicate next block/report.
36. Export contains bounded V2 report/comparison JSON.
37. Account clear removes V2 report/transition state.
38. Retest-result CTA is navigation-only.
39. Next-plan CTA is navigation-only.
40. Today/Plan/Progress/Home use the same scheduler/selector truth.
41. V1 rollback retest/report remains unchanged.
42. No H5 behavior is implemented.
43. Progress visual migration is not performed.
44. Balanced micro-check policy is unchanged.
45. Warden remains deferred.
46. Audio remains 150 assets.
47. Full repository gate passes.
48. Physical-device validation is not claimed.
49. Public release remains blocked.

# ACCEPTANCE CRITERIA

Do not mark H4.1 verified unless:

1. Domain and Balanced full retest lifecycles use production helpers.
2. At least one official retest raw Check-Up comes from the live coordinator.
3. Side/leg incompatibility suppression is proven.
4. Claim-neutral schema and UI are proven.
5. One immutable V2 report is proven.
6. Exactly-once prior completion and next-block creation are proven.
7. All major callback boundaries are idempotent.
8. Partial transition states are tested.
9. Offline/sync/restore/export/account-clear pass.
10. Today/Plan/Progress/Home agree.
11. V1 rollback remains green.
12. Any production fix has a prior failing test.
13. H4.1 continuation tests pass.
14. Full Jest passes.
15. Audio verification passes.
16. App typecheck passes.
17. Website typecheck passes.
18. Expo config passes.
19. Android/iOS export pass.
20. `git diff --check` passes.
21. No unrelated work is overwritten.
22. No package/lockfile/audio change occurs.
23. No staging/commit/branch/push occurs.

Do not mark verified if:

- only isolated H4 helper tests exist;
- domain or Balanced full lifecycle is missing;
- current retest is entirely canned;
- report or next block can duplicate;
- changed side/leg is directly compared;
- a delta/directional claim exists;
- partial recovery is untested;
- a V2 retest can launch V1;
- a CTA creates lifecycle state;
- H5 is partially implemented.

# STAGE DECISIONS

At the end of the continuation report state exactly one:

```text
UNIFIED MOVEMENT CHECK-UP STAGE H4.1 VERIFIED
UNIFIED MOVEMENT CHECK-UP STAGE H4.1 BLOCKED
```

Also state exactly one:

```text
DOMAIN AND BALANCED V2 OFFICIAL-RETEST LIFECYCLES VERIFIED
DOMAIN / BALANCED V2 OFFICIAL-RETEST LIFECYCLES BLOCKED
```

Also state exactly one:

```text
CLAIM-NEUTRAL V2 RETEST COMPARISON VERIFIED
CLAIM-NEUTRAL V2 RETEST COMPARISON BLOCKED
```

Also state exactly one:

```text
V2 BLOCK REPORT IDENTITY / READ-ONLY BEHAVIOR VERIFIED
V2 BLOCK REPORT VERIFICATION BLOCKED
```

Also state exactly one:

```text
V2 RETEST IDEMPOTENCY / PARTIAL-STATE RECOVERY VERIFIED
V2 RETEST LIFECYCLE RECOVERY BLOCKED
```

Also state exactly one:

```text
V2 RETEST OFFLINE / SYNC / RESTORE / EXPORT VERIFIED
V2 RETEST PERSISTENCE VERIFICATION BLOCKED
```

Also state exactly one:

```text
TODAY / PLAN / PROGRESS / HOME RETEST CONSISTENCY VERIFIED
RETEST CONSUMER CONSISTENCY BLOCKED
```

Also state exactly one:

```text
V1 OFFICIAL-RETEST ROLLBACK VERIFIED
V1 OFFICIAL-RETEST ROLLBACK BLOCKED
```

Also state exactly one:

```text
UNIFIED MOVEMENT CHECK-UP STAGE H5 UNBLOCKED
UNIFIED MOVEMENT CHECK-UP STAGE H5 BLOCKED
```

Use H5 unblocked only when:

- app/Step-Up health gates remain green;
- domain and Balanced full lifecycles pass;
- live-derived current retest passes;
- comparison/report/transition are immutable and idempotent;
- partial-state/offline/restore/export pass;
- all consumers agree;
- V1 rollback passes;
- no unresolved P0/P1 H4 defect remains.

Also state:

```text
STEP-UP RUNTIME RESUME HEALTH GATE REMAINS GREEN
PLAN CREATION REMAINS AUTOMATIC
RETEST RESULT CTA IS NAVIGATION-ONLY
NEXT-PLAN CTA IS NAVIGATION-ONLY
NO BUILD MY PLAN ACTION
NO IMPROVEMENT OR DECLINE CLAIMS
NO V1 LEGACY-RESULT MIGRATION REQUIRED
MAIN PROGRESS MIGRATION NOT PERFORMED
BALANCED MICRO-CHECK POLICY UNCHANGED
WARDEN TRANSFORM DEFERRED
CHAIR REFERENCE CLAIM REMAINS RAW-ONLY
PHYSICAL DEVICE VALIDATION NOT CLAIMED
PUBLIC RELEASE REMAINS BLOCKED
```

# NEXT STAGE

If this continuation verifies H4.1, the next stage is:

```text
HALE UNIFIED MOVEMENT CHECK-UP — STAGE H5
V2-CANONICAL PROGRESS, CURRENT/HISTORICAL MOVEMENT PROFILE PRESENTATION,
BALANCED MICRO-CHECK PRODUCT POLICY, PUBLIC V1 ROUTE RETIREMENT,
AND RELEASE-CANDIDATE HARDENING
```

Do not begin H5 in this task.

# FINAL CODEX RESPONSE

Return a concise summary containing:

- Continuation report path.
- Whether production runtime code changed.
- Re-entry app typecheck result.
- Step-Up health-gate non-regression.
- H4/H3.1 re-entry baseline.
- Defects found/fixed.
- H4 module inventory.
- Continuation test-harness architecture.
- Domain prior-block/retest result.
- Balanced prior-block/retest result.
- Live-coordinator-derived current retest result.
- Public selector/frozen launch-context result.
- Prior standing-leg/shoulder-side result.
- Reference-profile-change result.
- Comparison compatibility result.
- Claim-neutral schema/UI result.
- V2 report contract/identity result.
- Prior-block micro-check summary result.
- Read-only report reopening result.
- Exactly-one transition result.
- Next-block source-binding result.
- Invalid-current-retest result.
- Callback-idempotency result.
- Partial-state recovery result.
- Release-flag rollback-during-transition result.
- Offline/sync result.
- Restore/duplicate/reordering result.
- Export/account-clear result.
- Retest result/report CTA behavior.
- Today/Plan/Progress/Home consistency.
- V1 rollback result.
- Files changed.
- Tests added/changed.
- H4.1 continuation focused validation.
- Full Jest.
- Audio verification.
- App typecheck.
- Website typecheck.
- Expo config.
- Android/iOS export.
- `git diff --check`.
- Confirmation that H0-H4, Stage 3D-B, Stage 4, Stage 5, Step-Up resume, navigation, TypeScript boundaries, safety audio, and V2 audio remain green.
- `UNIFIED MOVEMENT CHECK-UP STAGE H4.1 VERIFIED` or blocked.
- Domain/Balanced verdict.
- Comparison verdict.
- Report verdict.
- Lifecycle-recovery verdict.
- Persistence verdict.
- Consumer-consistency verdict.
- V1 rollback verdict.
- `UNIFIED MOVEMENT CHECK-UP STAGE H5 UNBLOCKED` or blocked.
- `STEP-UP RUNTIME RESUME HEALTH GATE REMAINS GREEN`.
- `WARDEN TRANSFORM DEFERRED`.
- `PHYSICAL DEVICE VALIDATION NOT CLAIMED`.
- `PUBLIC RELEASE REMAINS BLOCKED`.
- Initial/final Git status.
- Complete files-changed inventory.
- Concurrent external changes.
- Confirmation that no package install, lockfile change, audio regeneration, staging, commit, branch, push, or H5 work occurred.
