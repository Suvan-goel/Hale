You are carrying out the next verification stage of Pearl’s approved unified Movement Check-Up architecture:

PEARL UNIFIED MOVEMENT CHECK-UP — STAGE H4.1
END-TO-END OFFICIAL V2 RETEST / REPORT / NEXT-BLOCK VERIFICATION,
PARTIAL-STATE RECOVERY, OFFLINE / RESTORE HARDENING,
CROSS-CONSUMER CONSISTENCY, AND CLAIM-GUARDRAIL PROOF

This is a verification-first continuation of Stage H4.

Do not begin H5 in this task.

## Why H4.1 is required

Stage H4 reports that the following software has been implemented:

```text
V2-origin block becomes retest_due
-> public unified V2 official retest
-> current frozen snapshot and assessment
-> claim-neutral previous/current comparison
-> one V2 block report
-> prior block completed
-> one automatic next V2 block
```

The H4 report also records that:

- the final tracked diff showed only a micro-check count correction plus the report;
- broader H4 files were already present in the dirty worktree;
- focused verification named only:
  - `movementProfileV2OfficialRetestTransition.test.ts`;
  - `publicCheckUpEngine.test.ts`;
  - `blockReportSyncService.test.ts`;
  - `movementProfileV2ResultsAdapter.test.ts`;
- the full repository suite passed, but the report did not provide a complete production-faithful proof matrix for:
  - a live-coordinator-derived public official retest;
  - both domain and Balanced lifecycles;
  - changed standing-leg/shoulder-side comparison suppression;
  - duplicate callbacks at every transition boundary;
  - partial local transition recovery;
  - offline/sync failure;
  - restore/export/account-clear behavior;
  - Today/Plan/Progress/Home consistency;
  - V1 rollback;
  - read-only result/report reopening;
  - exact one-report / one-completed-prior-block / one-next-block invariants.

H4.1 must close that evidence gap before H5 changes Progress, micro-check policy, public V1 routing, or release posture.

## H4 prerequisite and current baseline

Read in full:

```text
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_OFFICIAL_RETEST_REPORT_NEXT_BLOCK.md
```

The report currently states:

```text
Stage H4 is implemented and verified.

V2-origin official retests launch through the unified V2 Check-Up only when:
- the unified release flag is enabled;
- the active V2 block is scheduler retest_due;
- the prior accepted V2 source artifacts match the block.

The retest:
- preserves prior balance leg and shoulder side into setup;
- materialises official V2 retest artifacts;
- completes the prior block;
- writes a claim-neutral V2 block report;
- creates the next V2 block.

Retest result CTA:
  View my block report

Block report CTA:
  View my next 4-week plan

Both CTAs are navigation-only.
```

The H4 report records these implementation categories:

- policy-fingerprinted V2 previous/current comparison;
- V2 report artifact separate from V1 reports;
- pure official-retest transition;
- public-selector official-retest routing;
- App launch/reference-details/materialisation/report/next-plan integration;
- backend report sync;
- separate V2 block-report screen;
- Progress visual migration deferred.

The H4 report records:

```text
142 suites / 1180 tests
150 required audio assets
app typecheck pass
website typecheck pass
Android/iOS export pass
git diff --check pass
```

Re-run the current tree. Do not assume these counts remain unchanged.

## H3.1 prerequisite

Also read:

```text
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H3_1_END_TO_END_VERIFICATION.md
```

H3.1 already proves:

- release flag off preserves V1 baseline;
- release flag on completes public V2 domain and Balanced baselines;
- one live-coordinator-derived raw baseline;
- no V1 artifacts leak into the V2 baseline;
- snapshot/assessment/block idempotency;
- resume/restore;
- local-first sync-pending behavior;
- kill-switch data preservation;
- V2 official retest was contained before H4.

H4.1 must extend that production-faithful style to the retest/report/next-block transition.

## Founder/product decisions locked

### Canonical current flow

New public official Check-Ups under the unified release use:

```text
polished shared Check-Up shell
+
V2 live protocols
+
frozen V2 artifacts
+
automatic V2-origin blocks
```

A V2-origin official retest must never run through V1.

### No V1-user migration

No real user completed a V1 Check-Up.

Do not add:

- a public legacy Movement Age section;
- V1/V2 conversion;
- mixed V1/V2 trends;
- permanent dual current-result logic.

Retain the V1 flag-off rollback path for verification only.

### Automatic plan creation

The next block is already created during the successful H4 transition.

The result/report CTAs navigate only:

```text
View my block report
View my next 4-week plan
```

They must not create, regenerate, replace, sync, or start a block.

### Claim-neutral comparison

H4 may display factual previous/current raw values.

It must not show or persist:

- a numeric delta;
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

No green/red directional arrows or success/failure semantics.

### Warden

Warden chair-percentile implementation remains deferred.

Chair remains raw-only.

### Physical validation and release

Physical-device validation is not claimed.

H4.1 is software verification only.

Public release remains blocked.

## Required prior reading

Read these reports in full before verification:

- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_OFFICIAL_RETEST_REPORT_NEXT_BLOCK.md`
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H3_1_END_TO_END_VERIFICATION.md`
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H3_BASELINE_ONBOARDING_CUTOVER.md`
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H2_V1_RESULTS_SHELL_V2_PROFILE.md`
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H1_V1_SHELL_V2_ADAPTER.md`
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H0_HEALTH_GATE.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2D_2C.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2D_2A.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2D_1.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2C.md`
- `docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5G_1.md`
- `docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5H.md`

Also inspect:

- `AGENTS.md`;
- `CLAUDE.md`;
- `docs/decisions.md`;
- all current H4 production modules and tests;
- App official-retest orchestration;
- public engine selector;
- block scheduler;
- comparison parser/builder;
- V2 report parser/builder/view model;
- report/local adherence persistence;
- backend report sync;
- restore;
- data export;
- account clear;
- Today/Plan/Progress/Home actions;
- H2 result presentation;
- V2 block-report screen;
- V1 official-retest rollback path.

Treat current code, including current untracked production files, as source of truth.

## Verification/remediation mode

This is verification-first.

Permitted repository changes:

1. New production-faithful integration/property tests.
2. A minimal test harness using production helpers.
3. Narrow production fixes only after a failing H4.1 test proves a real defect.
4. The H4.1 report.

Do not proactively redesign H4.

If App orchestration cannot be tested without copying logic into a fake harness, you may extract the smallest pure production helper and make App use it.

Any extraction must:

- preserve behavior;
- have a failing test first;
- create no parallel authority;
- perform no UI redesign;
- perform no H5 work;
- be documented exactly.

This task must not implement:

- V2-canonical Progress hero/history;
- Balanced micro-check policy;
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

Record exact outputs in the report.

Rules:

1. Treat all existing tracked/untracked changes as user-owned.
2. Inspect current diffs before touching any file.
3. Preserve concurrent App, report, Progress, backend, training, website, pose, and docs work.
4. Do not revert, delete, move, or broadly reformat unrelated work.
5. Do not edit prior reports or `docs/decisions.md`.
6. Do not use destructive Git commands.
7. Do not install packages.
8. Do not modify lockfiles.
9. Do not regenerate audio.
10. Do not stage, commit, branch, push, or open a PR.
11. Do not inspect or expose `.env` values or provider credentials.
12. Do not modify or share font files.
13. If concurrent changes make the H4 transition ambiguous, stop mutation and mark H4.1 blocked.

# PART B — BASELINE AND CURRENT H4 INVENTORY

## Step 2: Run the current baseline before edits

Run a focused pre-edit suite covering:

- H3.1 public lifecycle;
- public selector;
- scheduler;
- V2 live coordinator;
- V2 snapshot/assessment/persistence;
- V2 comparison;
- V2 official-retest transition;
- V2 block report;
- H2 result adapter;
- V2 block-report screen/view model;
- report sync;
- restore;
- data export;
- Today/Plan/Progress/Home;
- V1 official retest;
- Stage 5G.1/H.

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
rm -rf /tmp/pearl-unified-h41-baseline-export
npx --no-install expo export --platform all --output-dir /tmp/pearl-unified-h41-baseline-export
rc=$?
rm -rf /tmp/pearl-unified-h41-baseline-export
exit $rc
```

Record exact counts and warnings.

If the baseline fails due to unrelated concurrent work:

- do not repair unrelated code;
- continue only when H4.1 can still produce a fully green final release gate within scope;
- otherwise mark blocked.

## Step 3: Inventory all H4 modules

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

Create a table:

| Responsibility | Current module | Pure or side-effecting | Test coverage | H4.1 evidence required |
| --- | --- | --- | --- | --- |

At minimum inventory:

- public official-retest selection;
- launch context;
- prior side/leg/reference selection;
- current artifact materialisation;
- comparison;
- report;
- transition;
- local persistence;
- remote sync;
- restore;
- export;
- result/report UI;
- consumer routing.

## Step 4: Map the actual App callback chain

Trace exact production callbacks:

```text
Today / Plan / Progress / Home / direct action
-> public selector
-> frozen official-retest launch context
-> unified V2 Check-Up
-> raw local save
-> reference-details confirmation
-> current snapshot/assessment materialisation
-> official-retest transition
-> local report/adherence save
-> retest result route
-> block report route
-> next plan route
-> remote sync
```

For every boundary record:

- input;
- owner;
- output;
- local write;
- remote write;
- route;
- stable identity;
- duplicate behavior;
- failure behavior.

# PART C — PRODUCTION-FAITHFUL H4.1 INTEGRATION HARNESS

## Step 5: Add focused integration suites

Use repository-consistent paths, for example:

```text
src/checkup/__tests__/publicUnifiedMovementCheckUpOfficialRetest.integration.test.ts
src/pearlFlow/__tests__/movementProfileV2OfficialRetestRecovery.integration.test.ts
```

One file is acceptable if clearly structured.

The harness must use production helpers for:

- V2 block creation;
- 12 schedule-credited sessions;
- scheduler `retest_due`;
- public selector;
- frozen launch context;
- live coordinator/synthetic pose replay;
- raw Check-Up builder;
- reference-details conversion;
- V2 snapshot/assessment materialisation;
- comparison;
- report;
- official-retest transition;
- local adherence/history serialization;
- backend restore/export;
- H2 result presentation;
- block-report presentation;
- Today/Plan/Progress/Home consumers.

Do not create a separate fake H4 implementation.

## Step 6: At least one live-derived official retest

At least one complete H4.1 scenario must generate the current official retest raw Check-Up through:

```text
MovementProfileV2LiveCoordinator
```

using deterministic synthetic landmarks/events.

It must not use only a canned current retest artifact.

Expected:

```text
live official retest
-> raw Check-Up
-> snapshot
-> assessment
-> comparison
-> report
-> completed prior block
-> next block
```

# PART D — BUILD AUTHORITATIVE PRIOR BLOCK FIXTURES

## Step 7: Build a real retest-due domain block

Using production helpers:

1. Create valid frozen V2 baseline artifacts.
2. Create the initial V2 domain block.
3. Generate and record 12 honest A/B/C schedule credits.
4. Satisfy four sequential weeks and calendar timing.
5. Verify scheduler status is exactly:

```text
retest_due
```

Do not set stale counters/status fields as shortcuts.

Assert:

- 12 schedule credits;
- four completed weeks;
- one active prior block;
- no retest completion yet;
- no report yet;
- no next block yet.

## Step 8: Build a real retest-due Balanced block

Repeat with a genuine Balanced V2 block.

Assert:

- no fake `focusDomain`;
- balanced-A/B/C schedule;
- four Strength-primary sessions;
- four Balance-primary sessions;
- four Mobility-primary sessions;
- scheduler exactly `retest_due`.

# PART E — PUBLIC SELECTOR AND LAUNCH CONTEXT

## Step 9: Eligible domain and Balanced selection

For both prior blocks:

```text
release flag on
+ V2 origin
+ scheduler retest_due
+ valid prior artifacts
-> unified V2 official retest
```

Assert frozen source:

```text
sourceType = official_retest
entryContext = public_official_retest
```

## Step 10: Ineligible gate cases

Test:

- release flag off;
- early scheduler state;
- stale `block.status = completed` without scheduler evidence;
- missing prior snapshot;
- missing prior assessment;
- source mismatch;
- same-ID immutable conflict;
- malformed/future artifact;
- different active block;
- unknown origin.

Every case must fail closed.

No case may launch V1 for a V2-origin block.

## Step 11: Launch context identity

Assert launch context freezes:

- prior block ID/fingerprint;
- prior Check-Up ID/fingerprint;
- prior snapshot ID/fingerprint;
- prior assessment ID/fingerprint;
- source type;
- scheduler date identity;
- prior standing leg;
- prior shoulder side;
- prior reference profile;
- current Check-Up identity/start timestamp.

Changing live stores after launch must not silently alter the frozen context.

# PART F — DOMAIN OFFICIAL-RETEST LIFECYCLE

## Step 12: Complete one domain lifecycle

Use a domain-focused prior block and a valid current official retest.

Verify:

1. Public selector chooses unified V2.
2. H1 shared Check-Up shell is the public player.
3. Raw current Check-Up is saved before reference details.
4. Prior leg/side/reference draft prefill correctly.
5. User confirmation/edit is explicit.
6. Current snapshot created once.
7. Current assessment created once.
8. Current focus is domain or Balanced according to production policy.
9. Comparison created once.
10. Report created once.
11. Stable retest completion created once.
12. Prior block becomes completed.
13. Exactly one next V2 block becomes active.
14. Next block binds to current assessment/snapshot/Check-Up.
15. H2 retest result is ready.
16. CTA is exactly `View my block report`.
17. CTA only navigates.
18. Block report is ready.
19. CTA is exactly `View my next 4-week plan`.
20. CTA only navigates.
21. Session A does not start automatically.

# PART G — BALANCED OFFICIAL-RETEST LIFECYCLES

## Step 13: Prior Balanced -> current Balanced

Verify:

- prior block remains genuinely Balanced;
- current assessment is genuinely Balanced;
- next block is genuinely Balanced;
- no fake focus domain;
- comparison/report support Balanced copy;
- no Strength fallback.

## Step 14: Prior Balanced -> current domain

Create current evidence that legitimately selects a domain.

Verify:

- prior report records prior Balanced focus and current domain focus;
- no copy says the old plan was wrong;
- next block uses the current domain;
- transition remains one-to-one and idempotent.

## Step 15: Prior domain -> current Balanced

Verify:

- next block becomes genuine Balanced;
- report/result copy remains claim-neutral;
- no fake domain appears.

# PART H — SIDE / LEG / REFERENCE COMPARABILITY

## Step 16: All headline domains comparable

Use:

- same balance standing leg;
- same shoulder side;
- compatible protocols/display/source policy;
- compatible reference profile.

Verify comparison status and previous/current factual values.

Assert no numeric delta field exists in serialized comparison or presentation.

## Step 17: Balance leg changed

Current retest deliberately changes standing leg.

Verify:

- current balance result remains valid;
- comparison marks balance shown separately/not directly comparable;
- UI explains the different standing leg;
- no side-by-side equivalent comparison styling;
- no delta/direction;
- chair/shoulder may remain comparable.

## Step 18: Shoulder side changed

Verify the equivalent shoulder behavior.

## Step 19: Both changed

Verify overall comparison becomes partially comparable or not comparable according to current policy.

## Step 20: Reference profile changed

Change age/reference group on retest.

Verify:

- prior snapshot remains immutable;
- current reference profile freezes separately;
- raw compatibility remains where allowed;
- reference interpretation comparison is suppressed where incompatible;
- no historical reinterpretation.

## Step 21: Setup/protocol incompatibility

Test current compatibility helper for:

- chair setup uncertainty;
- protocol-policy mismatch;
- display-policy mismatch;
- source-policy mismatch;
- unsupported future policy.

Fail closed without fabricating a direct comparison.

# PART I — CLAIM-NEUTRAL COMPARISON PROOF

## Step 22: Schema/source scan

Inspect comparison types, builder, parser, serialized output, adapters, and visible copy.

Assert no material field or visible value represents:

- numeric difference;
- percentage difference;
- direction;
- significance;
- improvement/decline;
- score;
- age change;
- percentile change.

## Step 23: UI guardrail

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
+<number>
-<number>
%
```

Scope percentage checks carefully so legitimate non-comparison UI percentages elsewhere do not create false positives.

## Step 24: Visual semantics

Verify:

- no up/down arrow as a trend;
- no green/red comparison direction;
- `Above the published middle range` remains neutral;
- screen-reader output is factual.

# PART J — V2 BLOCK-REPORT VERIFICATION

## Step 25: Strict V2 report contract

Verify:

- V2 report is distinguishable from V1 report;
- strict parser;
- source-bound prior/current IDs/fingerprints;
- stable report ID;
- stable report fingerprint;
- JSON-safe;
- no V1 score snapshot;
- no Movement Age;
- no `weakestDomain`;
- no directional change field.

## Step 26: Schedule summary

Assert report derives from the completed prior block and its credited history:

```text
4 training weeks
12 schedule credits
first credited date
final credited date
retest eligibility date
```

Do not trust cached `completedSessions`.

## Step 27: Micro-check count correction

Explicitly verify the H4 production correction:

```text
report.microChecksCompleted
```

must derive from the completed prior block / prior block’s authoritative micro-check history, not the new next block.

Cover:

- zero prior micro-checks;
- multiple prior micro-checks;
- a new block with a different count;
- restore/reopen.

## Step 28: Report identity and immutability

Test:

- same inputs -> same report ID/fingerprint;
- callback clock changes -> no identity/timestamp drift;
- repeated creation -> reuse;
- same ID/different fingerprint -> immutable conflict;
- accepted report is not overwritten.

## Step 29: Read-only reopen

Open the stored report repeatedly.

Assert no:

- comparison recomputation;
- report rewrite;
- next-block recreation;
- prior-block mutation;
- sync-side creation;
- timestamp change.

# PART K — TRANSITION AND BLOCK-STATE INVARIANTS

## Step 30: Exactly-once transition

After one valid transition assert:

- one current official retest Check-Up;
- one current snapshot;
- one current assessment;
- one comparison;
- one retest completion;
- one V2 report;
- prior block completed;
- exactly one active next block;
- no second active/paused block;
- no V1 artifact.

## Step 31: Next-block source binding

Assert next block:

- ID derives from current assessment;
- origin binds to current assessment/snapshot/Check-Up;
- focus is current frozen domain or Balanced;
- start date/timestamp follows current stable transition policy;
- equipment/capability/safety/release/progression policy remains current;
- is not created by either CTA.

## Step 32: Invalid current headline

Produce an invalid current official retest headline result.

Expected:

- raw current evidence may be saved;
- no current official assessment;
- no comparison/report;
- no retest completion;
- prior block remains `retest_due`;
- no next block;
- no V1 fallback.

## Step 33: Active-block conflict

Introduce a different active/paused block.

Expected fail closed.

Do not complete the prior due block.

# PART L — CALLBACK IDEMPOTENCY

## Step 34: Duplicate raw completion

Call the production raw-completion boundary twice.

Assert one current Check-Up.

## Step 35: Duplicate reference submission

Submit identical current reference details twice.

Assert one snapshot, one assessment.

## Step 36: Duplicate transition

Invoke official-retest transition repeatedly with:

- same explicit timestamp;
- different fallback callback timestamps;
- reversed equivalent input ordering where applicable.

Assert one report/completion/next block and stable identities.

## Step 37: Duplicate result/report navigation

Repeated `View my block report` does not mutate lifecycle.

Repeated `View my next 4-week plan` does not mutate lifecycle or start a session.

# PART M — PARTIAL-STATE RECOVERY

## Step 38: Current assessment exists, transition missing

Resume transition from accepted current artifacts.

No snapshot/assessment recomputation.

## Step 39: Report exists, prior block not completed

Verify deterministic repair/resume according to the current production policy.

Do not create a second report.

## Step 40: Prior block completed, next block missing

Verify safe resume creates/reuses the one expected next block only when all frozen transition evidence is valid.

## Step 41: Next block exists, report missing

Verify current policy either reconstructs/reuses the exact report from accepted immutable artifacts or fails closed.

Do not create a second next block.

## Step 42: Retest completion missing

Verify the scheduler-recognised completion is created once or transition remains explicitly incomplete.

## Step 43: Local complete, remote stale

Local state remains authoritative and usable.

Remote retry must not roll local state back.

## Step 44: Immutable conflicts

Cover:

- report conflict;
- comparison conflict;
- next-block conflict;
- current assessment conflict.

Preserve first accepted frozen truth and fail closed.

## Step 45: Release flag turns off mid-transition

Verify:

- a new V2 retest cannot start;
- an already complete local transition remains viewable/trainable;
- sync-pending complete transition can finish remote sync;
- partial current V2 retest never becomes V1;
- no data is deleted.

# PART N — OFFLINE / SYNC / RESTORE / EXPORT

## Step 46: Remote failure at every sync boundary

Inject current mocked failure for:

- current Check-Up sync;
- report sync;
- prior block sync;
- next block sync;
- training-state sync;
- completion sync.

Expected:

- local result/report/next block remain usable;
- transition is not duplicated;
- retry is idempotent;
- no rollback to V1.

## Step 47: Restore complete transition

Round-trip through current local and backend restore paths.

Assert:

- prior block completed;
- one current retest;
- one report;
- one active next block;
- exact fingerprints preserved;
- report opens read-only;
- next block plans sessions.

## Step 48: Restore partial transition

Cover each partial state from Part M through current restore selectors.

## Step 49: Remote duplicate/reordering

Test:

- duplicate identical rows;
- out-of-order remote rows;
- stale remote prior block;
- stale remote missing report;
- malformed V2 report;
- future report schema;
- source mismatch.

Fail closed without losing accepted local truth.

## Step 50: Data export

Verify export includes bounded V2 report/comparison data and excludes:

- landmarks;
- frames;
- video/image/base64;
- local file paths;
- auth tokens;
- provider secrets;
- source document content.

## Step 51: Account clear

Verify current local account-clear removes:

- V2 report;
- current retest artifacts;
- transition metadata;
- next block;

with the same user’s other local state.

No orphan comparison/report store remains.

# PART O — RESULT AND REPORT UI VERIFICATION

## Step 52: Retest result

Render a valid retest result.

Assert:

- current frozen result cards;
- compatible factual previous/current values;
- non-comparable notes where needed;
- current frozen focus;
- exact CTA:

```text
View my block report
```

CTA navigation only.

## Step 53: V2 block report

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

## Step 54: V1 report non-regression

V1 rollback report behavior remains unchanged.

Do not force V2 report fields into V1.

# PART P — TODAY / PLAN / PROGRESS / HOME CONSISTENCY

## Step 55: Before retest

For a V2 block:

### Early / waiting

- no consumer launches official retest;
- all use scheduler truth.

### Retest due

- Today action launches unified V2 retest;
- Plan action launches unified V2 retest;
- Progress action launches unified V2 retest;
- Home next-best action launches unified V2 retest;
- direct App action uses the same selector.

No consumer uses stale block status as proof.

## Step 56: During partial retest

Consumers must not expose:

- report ready;
- next block ready;
- a V1 retest;
- completed prior block.

## Step 57: After complete transition

All consumers agree:

- prior block completed;
- report ready;
- one next block active;
- Today/Plan use next block;
- Progress current visual remains H4-unchanged but does not show stale due action;
- Home order follows current intended report/next-session policy;
- direct official-retest action no longer starts another retest for the completed prior block.

## Step 58: Same-day transition

Verify date/scheduler behavior when retest and next-block creation occur on the same date.

No first next-block session starts automatically.

# PART Q — V1 ROLLBACK

## Step 59: True V1-origin official retest

With unified release flag off and a true V1-origin block:

- current V1 official retest remains available;
- current V1 report remains;
- current V1 next block behavior remains;
- no V2 artifact is produced.

## Step 60: No cross-protocol report

V2 transition cannot create a V1 report.

V1 transition cannot create a V2 report.

# PART R — ARCHITECTURE AND SOURCE GUARDS

## Step 61: Result/report CTA import guards

New V2 result/report screen modules must not import/call:

- V2 block factory;
- V2 official-retest transition;
- report builder;
- block upsert;
- report sync;
- session start.

They render/navigate only.

## Step 62: Comparison/report purity

Pure builders must not:

- read ambient clock;
- read environment;
- perform I/O;
- log;
- mutate inputs;
- access live profile;
- access current reference tables beyond accepted frozen artifacts.

## Step 63: No V1 artifact leak

Source/runtime assertions for V2 official retest:

- no V1 score;
- no V1 score snapshot;
- no V1 `MovementAssessment`;
- no V1 report;
- no V1 next block;
- no Movement Age copy.

# PART S — ALLOWED NARROW REMEDIATION

If verification exposes a real defect, fix only that defect.

Permitted examples:

- unstable report/comparison identity;
- duplicate transition side effect;
- missing resume selector;
- current report tied to next-block micro-check count;
- changed side/leg still shown as directly comparable;
- CTA calls materialisation;
- one consumer bypasses scheduler/selector;
- remote restore creates a duplicate next block;
- malformed V2 report promoted as valid;
- V1 artifact leak.

Not permitted:

- H5 Progress redesign;
- Balanced micro-check product design;
- public V1 retirement;
- Warden;
- new reference policy;
- new audio;
- broad state-management rewrite;
- new backend schema unless an existing JSON path is proven incapable and H4 cannot be correct without it.

Every production fix must have a failing regression first.

# PART T — REQUIRED TEST MATRIX

## A. Authoritative prior blocks

- domain 12-credit block;
- Balanced 12-credit block;
- scheduler retest_due;
- no stale counter shortcuts.

## B. Public selector/context

- eligible domain;
- eligible Balanced;
- release off;
- early;
- stale status;
- missing/mismatched/future/conflict;
- frozen context.

## C. Live official retest

- live-coordinator-derived current raw Check-Up;
- prior leg/side confirmed;
- leg changed;
- shoulder changed;
- raw save before details;
- no V1 controller/artifact.

## D. Artifact materialisation

- current domain;
- current Balanced;
- prior-focus policy;
- invalid headline;
- duplicate reuse.

## E. Comparison

- all comparable;
- changed leg;
- changed shoulder;
- both changed;
- reference profile changed;
- protocol/display/source mismatch;
- no delta/direction field;
- parser/fingerprint.

## F. Report

- domain;
- Balanced;
- stable identity;
- schedule summary;
- prior micro-check count;
- no V1 fields;
- read-only reopen;
- conflict.

## G. Transition

- domain->domain;
- Balanced->Balanced;
- Balanced->domain;
- domain->Balanced;
- prior block completed;
- one retest completion;
- one next block;
- no second active block.

## H. Idempotency

- raw;
- reference;
- materialisation;
- transition;
- result navigation;
- report navigation;
- next-plan navigation;
- different fallback clocks.

## I. Partial recovery

- assessment/no report;
- report/prior active;
- prior complete/no next;
- next/no report;
- missing completion;
- remote stale;
- conflicts;
- flag off mid-transition.

## J. Offline/sync/restore/export

- failure at every remote boundary;
- retry;
- complete restore;
- partial restore;
- duplicates/reordering;
- export sanitization;
- account clear.

## K. UI/copy

- retest result;
- non-comparable notes;
- domain report;
- Balanced report;
- exact CTAs;
- no directional terms;
- accessibility;
- responsive layouts.

## L. Consumers

- Today;
- Plan;
- Progress;
- Home;
- direct action;
- before/during/after transition.

## M. V1 rollback

- V1 retest/report/next block unchanged;
- no V2 artifacts.

## N. Product containment

- no H5;
- no Progress redesign;
- no micro-check policy change;
- no Warden;
- no audio;
- no public V1 retirement.

## O. Regression

- H0;
- H1;
- H2;
- H3;
- H3.1;
- H4 focused tests;
- Stage 3D-B;
- Stage 4;
- Stage 5G.1/H;
- navigation;
- TypeScript boundaries;
- safety/V2 audio.

## Test-quality requirements

Tests must:

- use production public selector;
- use production scheduler;
- create prior blocks through production V2 block materialisation;
- create 12 credits through production credit helpers;
- generate at least one current retest through production live coordinator;
- use production V2 artifact materialisation;
- use production comparison/report/transition;
- use real local serialize/deserialize and backend restore/export helpers;
- use deterministic explicit timestamps/IDs;
- test actual result/report wrappers where possible;
- assert no input mutation;
- assert no V1 artifact leak.

Tests must not:

- mock every layer;
- use arbitrary casted artifacts;
- duplicate the H4 transition in test-only code;
- use camera hardware;
- use real network;
- use wall-clock sleeps;
- install packages;
- regenerate audio;
- embed Warden data;
- weaken scheduler/source/immutability guards.

# PART U — VALIDATION COMMANDS

## Step 64: Focused H4.1 validation

Run all new H4.1 tests plus current relevant suites for:

- public selector;
- live coordinator;
- V2 snapshot/assessment;
- V2 comparison;
- V2 report;
- official-retest transition;
- H2 result adapter;
- V2 report screen/view model;
- adherence/local persistence;
- backend report sync;
- restore;
- export;
- Today/Plan/Progress/Home;
- V1 report;
- Stage 5G.1/H.

Record the exact command and counts.

## Step 65: Full release gate

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
rm -rf /tmp/pearl-unified-h41-export
npx --no-install expo export --platform all --output-dir /tmp/pearl-unified-h41-export
rc=$?
rm -rf /tmp/pearl-unified-h41-export
exit $rc
```

Do not install dependencies.

Record:

- H4.1 suites/tests;
- focused aggregate suites/tests;
- full suites/tests;
- audio:
  - safety 44/88;
  - Movement Profile V2 31/62;
  - total 150;
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

# PART V — MANUAL SOFTWARE TRACE

After automated validation, retrace:

## Domain

```text
real retest_due domain block
-> public official retest
-> current artifacts
-> neutral comparison
-> one report
-> prior complete
-> one domain/Balanced next block
-> result
-> report
-> next plan
```

## Balanced

Trace a real Balanced prior block through the same lifecycle.

## Side/leg change

Trace non-comparable copy and absence of directional claims.

## Invalid retest

```text
invalid current headline
-> raw preserved
-> prior remains retest_due
-> no report
-> no next block
```

## Replay

```text
same transition repeatedly
-> one report
-> one retest completion
-> one next block
```

## Partial state

Trace every Part M state.

## Offline

Trace local-ready through remote failures and retry.

## Consumer consistency

Trace Today/Plan/Progress/Home before/during/after.

## V1 rollback

Trace true V1 retest/report unchanged.

# PART W — REPORT

Create exactly one new report:

```text
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_1_END_TO_END_VERIFICATION.md
```

Do not edit prior reports or `docs/decisions.md`.

Required sections:

1. Scope.
2. Why H4.1 was required.
3. H4/H3.1 prerequisite evidence.
4. Initial Git status.
5. Baseline validation.
6. Current H4 module inventory.
7. Actual production callback map.
8. H4.1 integration-harness architecture.
9. Domain prior-block fixture proof.
10. Balanced prior-block fixture proof.
11. Public selector/launch-context proof.
12. Live-derived official retest proof.
13. Domain lifecycle proof.
14. Balanced lifecycle proof.
15. Domain/Balanced focus-transition matrix.
16. Prior leg/side behavior.
17. Reference-profile-change behavior.
18. Comparison compatibility proof.
19. Claim-neutral schema/copy proof.
20. V2 report contract proof.
21. Schedule/micro-check summary proof.
22. Report identity/read-only proof.
23. Exactly-once transition proof.
24. Next-block source-binding proof.
25. Invalid-current-retake fail-closed proof.
26. Callback idempotency proof.
27. Partial-state recovery matrix.
28. Release-flag rollback during transition.
29. Offline/sync-failure proof.
30. Restore/duplicate/reordering proof.
31. Data-export/account-clear proof.
32. Retest-result UI proof.
33. V2 block-report UI proof.
34. Today/Plan/Progress/Home consistency.
35. V1 rollback proof.
36. Architecture/source-guard proof.
37. Defects found.
38. Production fixes, if any.
39. Files changed.
40. Tests added/changed.
41. Exact focused validation.
42. Exact full validation.
43. Audio verification.
44. App/website typechecks.
45. Expo config/export.
46. H0-H4/Stage 3D-B/Stage 4/Stage 5 regression.
47. Remaining H5/release/device work.
48. Whether H5 is unblocked.
49. Initial/final Git status.
50. Complete files-changed inventory.
51. Concurrent external changes.
52. Confirmation that no package install, lockfile change, audio regeneration, staging, commit, branch, or push occurred.

# REQUIRED INVARIANTS

After H4.1:

1. A real domain prior block reaches scheduler retest_due from 12 credits.
2. A real Balanced prior block reaches scheduler retest_due from 12 credits.
3. Eligible V2 official retest uses the public unified V2 flow.
4. No V2 official retest launches V1.
5. At least one current retest is live-coordinator-derived.
6. Launch context is frozen and source-bound.
7. Raw current retest saves before reference details.
8. Prior leg/side prefill is correct.
9. Changed leg suppresses direct balance comparison.
10. Changed side suppresses direct shoulder comparison.
11. Prior snapshot remains immutable after reference-profile change.
12. Current snapshot/assessment are created once.
13. Invalid current headline creates no lifecycle transition.
14. Comparison is strict, source-bound, and JSON-safe.
15. Comparison contains no delta/direction/significance field.
16. UI contains no directional claim or trend styling.
17. One V2 report exists per completed prior block.
18. Report contains no V1 score/Movement Age fields.
19. Report schedule summary comes from authoritative credits.
20. Report micro-check count comes from the completed prior block.
21. Report identity/timestamp/fingerprint are stable.
22. Reopening a report is read-only.
23. One stable retest completion exists.
24. Prior block completes only with a valid full transition.
25. Exactly one active next V2 block exists.
26. Next block binds to current retest artifacts.
27. Domain and Balanced next blocks both work.
28. Repeated callbacks are idempotent.
29. Partial transition states are recoverable or explicitly fail closed.
30. Local-ready survives every remote failure.
31. Restore preserves exact accepted fingerprints.
32. Remote duplicate/reordering cannot create duplicate next blocks.
33. Export contains bounded V2 report/comparison JSON only.
34. Account clear removes V2 report/transition state.
35. Retest result CTA is navigation-only.
36. Next-plan CTA is navigation-only.
37. Today/Plan/Progress/Home use the same scheduler/selector truth.
38. V1 rollback retest/report remains unchanged.
39. No H5 behavior is implemented.
40. Progress visual migration is not performed.
41. Balanced micro-check policy is not changed.
42. Warden remains deferred.
43. Audio remains 150 assets.
44. Full repository release gate passes.
45. Physical-device validation is not claimed.
46. Public release remains blocked.

# ACCEPTANCE CRITERIA

Do not mark H4.1 verified unless:

1. Domain and Balanced full retest lifecycles use production helpers.
2. At least one official retest raw Check-Up comes from the live coordinator.
3. Side/leg incompatibility suppression is proven.
4. Claim-neutral schema and UI are proven.
5. One immutable report is proven.
6. Exactly-once prior completion and next-block creation are proven.
7. All major callback boundaries are idempotent.
8. Partial states are tested.
9. Offline/sync/restore/export/account-clear pass.
10. Today/Plan/Progress/Home agree.
11. V1 rollback remains green.
12. Any production fix has a prior failing test.
13. H4.1 focused tests pass.
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
- report/next block can duplicate;
- changed side/leg is directly compared;
- a delta or directional claim exists;
- partial transition recovery is untested;
- a V2 retest can launch V1;
- the CTA creates lifecycle state;
- H5 is partially implemented.

# STAGE DECISIONS

At the end of the report state exactly one:

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

- domain and Balanced full lifecycles pass;
- live-derived current retest passes;
- comparison/report/transition are immutable and idempotent;
- partial-state/offline/restore/export pass;
- all consumers agree;
- V1 rollback passes;
- no unresolved P0/P1 H4 defect remains.

Also state:

```text
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

If H4.1 verifies, H5 remains:

```text
PEARL UNIFIED MOVEMENT CHECK-UP — STAGE H5
V2-CANONICAL PROGRESS, CURRENT/HISTORICAL MOVEMENT PROFILE PRESENTATION,
BALANCED MICRO-CHECK PRODUCT POLICY, PUBLIC V1 ROUTE RETIREMENT,
AND RELEASE-CANDIDATE HARDENING
```

Do not begin H5 in this task.

# FINAL CODEX RESPONSE

Return a concise summary containing:

- Report path.
- Whether production runtime code changed.
- Defects found/fixed.
- H4 module inventory.
- Integration-harness architecture.
- Domain prior-block/retest result.
- Balanced prior-block/retest result.
- Live-coordinator-derived current retest result.
- Public selector/launch-context result.
- Prior standing-leg/shoulder-side result.
- Reference-profile-change result.
- Comparison compatibility result.
- Claim-neutral schema/UI result.
- V2 report contract/identity result.
- Prior-block micro-check summary result.
- Read-only report reopening result.
- Exactly-one transition result.
- Next-block source-binding result.
- Invalid-current-retake result.
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
- H4.1 focused validation.
- Full Jest.
- Audio verification.
- App typecheck.
- Website typecheck.
- Expo config.
- Android/iOS export.
- `git diff --check`.
- Confirmation that H0-H4, Stage 3D-B, Stage 4, Stage 5, navigation, TypeScript boundaries, safety audio, and V2 audio remain green.
- `UNIFIED MOVEMENT CHECK-UP STAGE H4.1 VERIFIED` or blocked.
- Domain/Balanced verdict.
- Comparison verdict.
- Report verdict.
- Lifecycle-recovery verdict.
- Persistence verdict.
- Consumer-consistency verdict.
- V1 rollback verdict.
- `UNIFIED MOVEMENT CHECK-UP STAGE H5 UNBLOCKED` or blocked.
- `WARDEN TRANSFORM DEFERRED`.
- `PHYSICAL DEVICE VALIDATION NOT CLAIMED`.
- `PUBLIC RELEASE REMAINS BLOCKED`.
- Initial/final Git status.
- Complete files-changed inventory.
- Concurrent external changes.
- Confirmation that no package install, lockfile change, audio regeneration, staging, commit, branch, or push occurred.
