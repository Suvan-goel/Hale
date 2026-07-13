You are resuming the policy-aligned closure verification for Pearl’s unified Movement Check-Up lifecycle:

PEARL UNIFIED MOVEMENT CHECK-UP — STAGE H4.1.1 CONTINUATION
POLICY-ALIGNED OFFICIAL-RETEST CLOSURE,
PARTIAL-STATE / OFFLINE / RESTORE VERIFICATION,
CROSS-CONSUMER CONSISTENCY,
AND H5 RELEASE-GATE DECISION

This is a continuation of the blocked H4.1.1 attempt.

Do not begin H5.

## Why this is a continuation

The first H4.1.1 attempt created this historical blocked report:

```text
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_1_1_POLICY_ALIGNED_CLOSURE.md
```

That attempt stopped at the mandatory pre-edit app typecheck because concurrent, unrelated Step-Up audit-fixture work was temporarily invalid:

```text
scripts/audits/fixtures/step-up-runtime-evidence-closure/production-runner.ts
```

No H4.1.1 tests or production fixes were added in that attempt.

Do not edit or overwrite the blocked report.

Create a separate continuation report:

```text
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_1_1_POLICY_ALIGNED_CLOSURE_CONTINUATION.md
```

## Current re-entry rule

The user may be editing unrelated files in parallel.

At the start of this task:

1. Capture the exact worktree.
2. Run `npm run typecheck`.
3. Proceed only if the app typecheck passes.

If typecheck still fails solely in unrelated concurrent work:

- do not repair those files;
- do not add H4.1.1 tests;
- write the continuation report as blocked;
- record the exact diagnostics and concurrent file ownership;
- stop.

If typecheck passes, complete the full H4.1.1 verification matrix below.

Do not weaken the gate, exclude fixture files, change `tsconfig`, add suppressions, or use unsafe casts merely to proceed.

## Product-owner focus-policy decision

The existing official-retest focus policy is approved and must remain unchanged.

### Domain -> Balanced is intentionally unsupported in focus policy version 1

For an official retest:

- if the prior focus is a domain;
- the prior domain remains valid;
- and current evidence identifies no clear replacement domain;

Pearl preserves the prior domain.

It does not switch to Balanced merely because current evidence is ambiguous or broadly matched.

Therefore this is an expected result:

```text
prior domain
+ ambiguous or no-clear-replacement official-retest evidence
-> same prior domain
-> not Balanced
```

Do not modify the focus policy to manufacture Domain -> Balanced.

### Supported official-retest transition matrix

H4.1.1 must verify:

```text
Domain -> same prior domain
Domain -> a different clear domain
Balanced -> Balanced
Balanced -> a clear domain
```

It must also explicitly verify:

```text
Domain + ambiguous evidence -> same prior domain
```

If a production-derived Domain -> different clear domain scenario is impossible under the current policy, mark H4.1.1 blocked and document the exact reason. Do not alter policy to force it.

## Prior implementation state

Read in full:

```text
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_1_1_POLICY_ALIGNED_CLOSURE.md
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_1_END_TO_END_VERIFICATION_CONTINUATION.md
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_1_END_TO_END_VERIFICATION.md
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_OFFICIAL_RETEST_REPORT_NEXT_BLOCK.md
docs/audits/PEARL_TRAINING_STEP_UP_RUNTIME_RESUME_HEALTH_GATE.md
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H3_1_END_TO_END_VERIFICATION.md
```

Also inspect:

- `AGENTS.md`;
- `CLAUDE.md`;
- `docs/decisions.md`;
- current H4/H4.1 production modules and tests;
- App official-retest orchestration;
- Stage 5 scheduler;
- V2 comparison/report/transition modules;
- local adherence/history persistence;
- backend sync, restore, export, and account clear;
- Today, Plan, Progress, Home, and direct official-retest actions;
- V1 official-retest rollback;
- current Step-Up runtime and fixture files.

Treat the current working tree, including untracked production files, as source of truth.

## Locked product boundaries

Preserve all of the following:

- Public V2 official retest uses the unified V2 Check-Up.
- A V2-origin official retest never launches V1.
- The next block is created automatically inside the successful transition.
- `View my block report` is navigation-only.
- `View my next 4-week plan` is navigation-only.
- No `Build my plan` action.
- Previous/current comparison remains claim-neutral.
- No numeric delta or percentage change.
- No improvement or decline language.
- Chair remains raw-only.
- Warden transform remains deferred.
- No V1 legacy-result migration.
- No main Progress redesign.
- Balanced micro-check policy remains unchanged.
- No public V1 route retirement.
- No audio generation.
- No physical-device validation claim.
- Public release remains blocked.

## Verification/remediation mode

This is verification-first.

Permitted changes:

1. New or expanded production-faithful tests.
2. Small test fixtures built from production helpers.
3. Narrow production fixes only after a failing H4.1.1 test proves a real defect.
4. The continuation report.

Do not perform broad refactors.

Do not add a parallel test-only lifecycle implementation.

If App orchestration cannot be exercised without copying it, extract the smallest pure production helper and make App use it. Any extraction must:

- be behavior-preserving;
- be driven by a failing test;
- create no second authority;
- avoid H5 work;
- be documented.

# PART A — WORKTREE SAFETY

## Step 1: Capture initial state

Run before analysis or mutation:

```bash
git status --short --untracked-files=all
git diff --name-only
git diff --stat
git ls-files --others --exclude-standard
```

Record exact output in the continuation report.

Rules:

1. Treat every pre-existing tracked and untracked change as user-owned.
2. Inspect diffs before touching any file.
3. Preserve concurrent App, H4, Step-Up, render, backend, training, website, and docs work.
4. Do not revert, delete, move, or broadly reformat unrelated work.
5. Do not edit prior audit reports or `docs/decisions.md`.
6. Do not use destructive Git commands.
7. Do not install packages.
8. Do not modify lockfiles.
9. Do not regenerate audio.
10. Do not stage, commit, branch, push, or open a PR.
11. Do not inspect or expose `.env` values or provider credentials.
12. Do not modify or share font files.

# PART B — MANDATORY RE-ENTRY GATES

## Step 2: App typecheck

Run first:

```bash
npm run typecheck
```

### If it fails

If the errors are in unrelated concurrent work:

- make no changes;
- create the continuation report with a blocked verdict;
- record the exact errors;
- stop.

Do not repair Step-Up audit fixtures from this task.

### If it passes

Continue.

## Step 3: Step-Up non-regression

Run the focused Step-Up/runtime health-gate slice recorded in:

```text
docs/audits/PEARL_TRAINING_STEP_UP_RUNTIME_RESUME_HEALTH_GATE.md
```

At minimum include:

```text
src/training/stepUpAlternation/__tests__/stepUpRuntimeIntegration.test.ts
src/training/__tests__/sessionPlayer.test.ts
src/pearlFlow/__tests__/sessionPlanning.test.ts
src/services/backend/__tests__/trainingStateSyncService.test.ts
src/services/backend/__tests__/restoreService.test.ts
```

Confirm:

- `TrainingSetRuntime.resume` remains required;
- Step-Up structurally satisfies it;
- pause/resume safe-boundary tests pass;
- no unsafe suppression or cast has appeared.

## Step 4: H4.1 continuation baseline

Run the existing continuation suite:

```text
src/pearlFlow/__tests__/movementProfileV2OfficialRetestContinuation.integration.test.ts
```

and the focused H4/H3.1 aggregate from the continuation report.

The previous result was:

```text
33 suites / 322 tests
```

Record current counts.

Do not proceed if this baseline regresses.

# PART C — VERIFY THE CURRENT FOCUS POLICY

## Step 5: Reconstruct the production decision order

Inspect:

```text
src/reference/movementProfileV2/assessment.ts
```

and its tests.

Document the actual official-retest focus decision order.

Prove:

- prior focus context must bind to the prior accepted V2 assessment;
- prior domain is preserved when no clear replacement exists;
- one clear different current domain may replace the prior domain;
- prior Balanced remains Balanced when no clear domain exists;
- prior Balanced may move to one clear domain;
- V1 focus cannot influence V2;
- current live profile/goal cannot rewrite a frozen assessment.

## Step 6: Policy acceptance regression

Add a focused production test:

```text
prior domain
+ ambiguous/broadly matched current official-retest evidence
-> same prior domain
-> not Balanced
```

This is a passing product-policy result.

## Step 7: Domain -> different clear domain

Build a production-derived official-retest scenario where:

- prior focus is one domain;
- current evidence identifies exactly one clear different domain;
- the production assessment changes to that domain;
- the report records prior/current focus neutrally;
- the next block uses the current domain.

Do not manually edit the assessment focus.

## Step 8: Supported matrix

Verify:

| Prior | Current evidence | Required current focus |
| --- | --- | --- |
| Domain | no clear replacement | same prior domain |
| Domain | one clear different domain | different domain |
| Balanced | no clear domain | Balanced |
| Balanced | one clear domain | domain |

# PART D — REUSE THE EXISTING H4.1 HARNESS

## Step 9: Reuse before duplicating

Inspect:

```text
src/pearlFlow/__tests__/movementProfileV2OfficialRetestContinuation.integration.test.ts
```

and any newer concurrent H4.1 tests.

Reuse its production helpers for:

- baseline V2 artifacts;
- V2 block materialisation;
- 12 schedule credits;
- scheduler `retest_due`;
- live-coordinator official retest;
- current snapshot/assessment;
- comparison;
- report;
- transition.

Add separate focused suites only where they improve coverage, such as:

```text
src/pearlFlow/__tests__/movementProfileV2OfficialRetestRecovery.integration.test.ts
src/pearlFlow/__tests__/movementProfileV2OfficialRetestConsumers.integration.test.ts
src/services/backend/__tests__/movementProfileV2OfficialRetestPersistence.integration.test.ts
```

Use repository conventions.

Tests must use production helpers, not a fake transition.

# PART E — CALLBACK IDEMPOTENCY

## Step 10: Duplicate raw completion

Invoke the actual official-retest raw completion boundary twice.

Assert:

- one current retest Check-Up identity;
- one pending reference-details state;
- no duplicate history entry;
- no V1 artifact.

## Step 11: Duplicate reference submission

Submit the same reference details twice.

Assert:

- one current snapshot;
- one current assessment;
- one comparison;
- one report;
- one retest completion;
- one next block;
- stable timestamps and fingerprints.

## Step 12: Duplicate transition

Replay with:

- the same explicit transition timestamp;
- different callback/fallback clocks;
- an existing identical report;
- an existing identical next block;
- equivalent reordered input collections where order is not authoritative.

Assert exactly one lifecycle transition.

## Step 13: Navigation replay

Repeated:

```text
View my block report
View my next 4-week plan
```

must not:

- create or rewrite the report;
- create or rewrite the next block;
- sync as a creation side effect;
- change block dates;
- start Session A.

# PART F — MAP REAL LOCAL WRITE BOUNDARIES

## Step 14: Reconstruct actual local persistence order

Before fabricating partial states, trace the real App/service write sequence for:

```text
current raw Check-Up
current snapshot/assessment
comparison
report
retest completion
prior block completion
next block
training/adherence state
```

For each requested partial state classify it as:

```text
reachable after process interruption
reachable after local write failure
remote-only stale state
impossible because one atomic local state write owns it
synthetic-invalid and must fail closed
```

Do not add recovery code for impossible states.

For impossible states, prove atomicity through the real store/update boundary and tests.

# PART G — PARTIAL-STATE RECOVERY

## Step 15: Current assessment exists, transition missing

Required:

- reuse accepted snapshot/assessment;
- resume comparison/report/transition;
- no recomputation;
- one report/completion/next block.

## Step 16: Report exists, prior block still active

Required:

- reuse the report;
- resume prior completion only when source evidence is valid;
- no second report;
- no second next block.

## Step 17: Prior block completed, next block missing

Required:

- recover only the expected next block from accepted current artifacts;
- do not reopen prior block;
- preserve report identity.

If impossible because one atomic local write owns both, prove that instead.

## Step 18: Next block exists, report missing

Required:

- recover the exact report only when immutable transition evidence is sufficient;
- otherwise fail closed;
- never create another next block.

If impossible atomically, prove it.

## Step 19: Retest completion missing

Required:

- create exactly once when safe;
- or leave the transition explicitly incomplete;
- scheduler must not infer completion from report or block status alone.

## Step 20: Immutable conflicts

Cover:

- comparison same-ID/different-fingerprint;
- report same-ID/different-fingerprint;
- current assessment conflict;
- next-block conflict.

Preserve the first accepted frozen truth and fail closed.

## Step 21: Release flag off mid-transition

Verify:

- no new public V2 retest starts;
- a completed local transition remains readable/trainable;
- a completed sync-pending transition may continue remote sync;
- a partial V2 retest never becomes V1;
- no V1 report/block is created;
- no data is deleted.

# PART H — ACTUAL REMOTE-CALL FAILURE MATRIX

## Step 22: Inventory the real H4 remote calls

List the actual remote operations after local H4 transition, such as:

- current Check-Up sync;
- block-report sync;
- prior-block sync;
- next-block sync;
- training-state sync;
- retest-completion/session sync.

Do not invent boundaries that do not exist.

## Step 23: Fail each real remote call

For each real call:

1. Complete the local H4 transition.
2. Fail that call with the existing mock/failure mechanism.
3. Verify:
   - local current result remains available;
   - report remains available;
   - prior block remains completed;
   - exactly one next block remains active and trainable;
   - no V1 fallback;
   - retry is idempotent;
   - no identity drift.

## Step 24: All remote calls fail

Verify the complete local lifecycle still works.

## Step 25: Retry order

Retry:

- in normal order;
- in reverse order;
- with some calls already successful;
- with duplicate callback invocation.

Accepted local truth must remain unchanged.

# PART I — RESTORE MATRIX

## Step 26: Complete-transition restore

Round-trip through current local/backend restore.

Assert:

- current official retest restored once;
- report restored once;
- prior block completed;
- one active next block;
- exact accepted fingerprints;
- report opens read-only;
- next block plans sessions;
- no V1 artifact.

## Step 27: Reachable partial restore states

Restore each reachable partial state identified in Part F.

Use real serializers and restore mappers.

Do not cast arbitrary objects into accepted artifact types.

## Step 28: Duplicate identical records

Test duplicate identical:

- Check-Up records;
- report records;
- block records;
- completion records;
- training-state summaries.

Deduplicate deterministically.

## Step 29: Reordered and stale remote records

Test:

- next block before completed prior block;
- report before current Check-Up-derived artifacts;
- stale remote prior block still marked active;
- remote state missing report;
- remote state missing next block;
- old training state arriving after newer accepted local state.

Preserve accepted local truth or fail closed.

## Step 30: Malformed/future/source mismatch

Cover:

- malformed V2 report;
- future report schema;
- report source mismatch;
- comparison fingerprint mismatch;
- current assessment source mismatch;
- next-block source mismatch.

Do not promote malformed data.

## Step 31: No recomputation on restore

When valid frozen comparison/report exists:

- parse it;
- do not rerun reference interpretation;
- do not rerun focus selection;
- do not recreate the next block.

# PART J — EXPORT AND ACCOUNT CLEAR

## Step 32: Export privacy

Verify export includes bounded H4 V2 data and excludes:

- landmarks;
- frames;
- video/image/base64;
- local paths/URIs;
- authentication tokens;
- provider secrets;
- source PDF/workbook content;
- free-text health notes.

## Step 33: Account clear

Verify current account clear removes:

- current V2 retest record;
- V2 report;
- transition metadata;
- prior/current account block state;
- next block;
- any dedicated comparison/report storage.

No orphan V2 report or comparison state may remain.

# PART K — CROSS-CONSUMER CONSISTENCY

## Step 34: Canonical lifecycle states

Use production helpers to construct:

```text
A. training in progress / not due
B. scheduler retest_due
C. raw current retest saved, details pending
D. current snapshot/assessment ready, transition not applied
E. transition partially persisted or recovery pending
F. transition complete, report ready, next block active
G. stored prior report reopened later
```

Use the nearest actual reachable state where a requested state is impossible.

## Step 35: Today

Verify for A-G:

- A: normal due-session/waiting behavior;
- B: unified V2 official-retest action;
- C-E: no second retest, no V1 retest, calm resume/recovery;
- F: next block/current action;
- G: report reopen does not mutate lifecycle.

## Step 36: Plan

Verify the same lifecycle truth.

## Step 37: Progress

Verify:

- no stale retest-due action after F;
- no premature report/next-plan readiness during C-E;
- H4 visual design remains unchanged;
- no H5 Progress migration.

## Step 38: Home / next-best action

Verify scheduler-backed behavior A-G.

Do not use stale `block.status` as transition authority.

## Step 39: Direct official-retest action

Verify:

- B starts the same unified V2 retest;
- C-E do not start a duplicate;
- F cannot start another retest for the completed prior block;
- release off never converts partial V2 to V1.

## Step 40: Cross-consumer equality

For identical state, all consumers must agree on:

- current block;
- scheduler status;
- retest availability;
- report readiness;
- next-block readiness.

# PART L — REGRESSION GUARDS

## Step 41: Reference-profile fingerprint

Preserve the current fix:

```text
reference interpretation may be compared only when
referenceProfileFingerprint matches
and other comparison rules permit it
```

Keep raw comparability separate where policy allows.

## Step 42: Claim-neutral schema and UI

Prove comparison/report persistence and UI contain no:

- numeric delta field;
- direction field;
- percentage-change field;
- significance field;
- improvement/decline copy;
- trend arrows;
- red/green directional semantics.

## Step 43: Prior-block micro-check matrix

Verify `report.microChecksCompleted` always derives from the completed prior block:

1. Prior block `0`, next block non-zero.
2. Prior block multiple, next block `0`.
3. Prior and next blocks different non-zero values.
4. Serialize/restore.
5. Reopen after active next-block micro-check count changes.

## Step 44: Read-only report reopening

Opening the result/report later must not:

- rebuild comparison;
- rebuild report;
- recreate next block;
- alter focus;
- change timestamps/fingerprints;
- create sync state;
- start a session.

# PART M — V1 ROLLBACK

## Step 45: True V1 official retest

With the unified release flag off and a true V1-origin block, verify current V1:

- official retest;
- report;
- prior block completion;
- next block.

No V2 artifact may be created.

## Step 46: Cross-protocol isolation

V2 official retest must not create:

- V1 score;
- V1 score snapshot;
- V1 MovementAssessment;
- V1 report;
- V1 next block;
- Movement Age copy.

V1 official retest must not create V2 artifacts.

# PART N — ALLOWED NARROW FIXES

If a test proves a real defect, fix only that defect.

Examples permitted:

- missing resume/recovery selector;
- duplicate report or next-block creation;
- stale remote state overriding accepted local truth;
- a consumer exposing stale retest action;
- sync retry mutating local lifecycle;
- account clear leaving an orphan report;
- report micro-check count reading the active next block;
- focus implementation not matching its current documented policy;
- reference-profile fingerprint regression.

Not permitted:

- changing policy to permit Domain -> Balanced;
- H5 Progress redesign;
- Balanced micro-check policy;
- public V1 retirement;
- Warden;
- new reference policy;
- new audio;
- broad App/state-management rewrite.

Every production fix requires a failing regression first.

# PART O — REQUIRED VALIDATION

## Step 47: Focused H4.1.1 continuation tests

Run:

- new H4.1.1 continuation suites;
- existing H4.1 continuation suite;
- Step-Up health-gate slice;
- public selector;
- scheduler;
- V2 live coordinator;
- V2 snapshot/assessment;
- comparison/report/transition;
- local adherence/history;
- backend sync;
- restore;
- export;
- account clear;
- result/report adapters;
- Today/Plan/Progress/Home;
- true V1 retest/report;
- Stage 5G.1/H.

Record exact command and counts.

## Step 48: Full release gate

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
rm -rf /tmp/pearl-unified-h411-continuation-export
npx --no-install expo export --platform all --output-dir /tmp/pearl-unified-h411-continuation-export
rc=$?
rm -rf /tmp/pearl-unified-h411-continuation-export
exit $rc
```

Record:

- new continuation suites/tests;
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
- any new warning;
- whether validation changed files.

# PART P — CONTINUATION REPORT

Create exactly:

```text
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_1_1_POLICY_ALIGNED_CLOSURE_CONTINUATION.md
```

Do not edit the existing blocked H4.1.1 report.

Required sections:

1. Scope.
2. Why continuation was required.
3. Prior blocked H4.1.1 result.
4. Product-owner focus-policy decision.
5. Initial Git status.
6. Re-entry app typecheck.
7. Step-Up non-regression.
8. H4.1 continuation baseline.
9. Current focus-policy decision order.
10. Domain -> Balanced acceptance correction.
11. Supported focus-transition matrix.
12. Test-harness architecture.
13. Callback idempotency.
14. Local write-boundary map.
15. Reachable/impossible partial-state classification.
16. Partial-state recovery.
17. Mid-transition release-flag behavior.
18. Actual remote-call inventory.
19. Per-boundary sync-failure results.
20. Multi-failure/retry-order results.
21. Complete restore.
22. Partial restore.
23. Duplicate/reordered/stale remote results.
24. Malformed/future/source-mismatch results.
25. No-recomputation restore.
26. Export.
27. Account clear.
28. Lifecycle states A-G.
29. Today.
30. Plan.
31. Progress.
32. Home.
33. Direct action.
34. Cross-consumer equality.
35. Reference-profile-fingerprint regression.
36. Claim-neutral schema/UI regression.
37. Prior-block micro-check matrix.
38. Report read-only behavior.
39. V1 rollback/cross-protocol isolation.
40. Defects found.
41. Production fixes, if any.
42. Files changed.
43. Tests added/changed.
44. Exact focused validation.
45. Exact full validation.
46. Audio verification.
47. App/website typechecks.
48. Expo config/export.
49. H0-H4.1/Stage 3D-B/Stage 4/Stage 5/Step-Up regression.
50. Remaining H5/release/device work.
51. Whether H5 is unblocked.
52. Initial/final Git status.
53. Complete files-changed inventory.
54. Concurrent external changes.
55. Confirmation that no package install, lockfile change, audio regeneration, staging, commit, branch, push, or H5 work occurred.

# REQUIRED INVARIANTS

After this continuation:

1. App typecheck passes before H4.1.1 work.
2. Step-Up health gate remains green.
3. Existing H4.1 continuation remains green.
4. Focus policy remains unchanged.
5. Ambiguous domain retest preserves prior domain.
6. Domain -> Balanced is not fabricated.
7. Domain -> different clear domain is production-derived.
8. Balanced -> Balanced is verified.
9. Balanced -> clear domain is verified.
10. Duplicate callbacks are idempotent.
11. Every requested partial state is classified.
12. Every reachable partial state recovers or fails closed.
13. Impossible states are proven impossible through actual atomic boundaries.
14. Every real H4 remote call is failure-tested.
15. Local complete lifecycle survives remote failure.
16. Retry ordering creates no duplicates.
17. Complete restore is exact.
18. Reachable partial restore states pass.
19. Duplicate/reordered/stale remote records cannot regress accepted truth.
20. Malformed/future/source-mismatched data fails closed.
21. Valid frozen report/comparison is not recomputed on restore.
22. Export is bounded and private.
23. Account clear leaves no V2 report/transition orphan.
24. Today/Plan/Progress/Home/direct action agree.
25. No stale retest action appears after transition.
26. No premature report/next-plan state appears during partial transition.
27. Reference-profile fingerprint regression remains fixed.
28. Comparison/report remain claim-neutral.
29. Report micro-check count always uses prior completed block.
30. Report reopening is read-only.
31. V1 rollback remains unchanged.
32. V2 transition produces no V1 artifacts.
33. No H5 behavior is implemented.
34. Warden remains deferred.
35. Audio remains 150 assets.
36. Full repository gate passes.
37. Physical-device validation is not claimed.
38. Public release remains blocked.

# ACCEPTANCE CRITERIA

Do not mark verified unless:

1. Focus acceptance is corrected only in tests/report, not by changing product policy.
2. The supported focus matrix passes.
3. Domain -> different clear domain is production-derived.
4. Callback idempotency passes.
5. Every partial state is classified and reachable states are tested.
6. Every real remote call is failure-tested.
7. Complete and partial restore passes.
8. Duplicate/reordered/stale remote behavior passes.
9. Export/account clear passes.
10. Today/Plan/Progress/Home/direct action agree.
11. Reference-profile fingerprint regression remains green.
12. Claim-neutral UI/report remains green.
13. Prior-block micro-check matrix passes.
14. V1 rollback remains green.
15. Any production fix has a prior failing test.
16. Focused tests pass.
17. Full Jest passes.
18. Audio verification passes.
19. App typecheck passes.
20. Website typecheck passes.
21. Expo config passes.
22. Android/iOS export passes.
23. `git diff --check` passes.
24. No unrelated work is overwritten.
25. No package/lockfile/audio changes occur.
26. No staging/commit/branch/push occurs.

Do not mark verified if:

- focus policy is altered to allow Domain -> Balanced;
- Domain -> different clear domain is not proven;
- partial states are merely described;
- sync failures are covered only by unrelated generic tests;
- restore permutations are incomplete;
- consumers disagree;
- a CTA creates lifecycle state;
- H5 is partially implemented.

# STAGE DECISIONS

At the end of the report state exactly one:

```text
UNIFIED MOVEMENT CHECK-UP STAGE H4.1.1 VERIFIED
UNIFIED MOVEMENT CHECK-UP STAGE H4.1.1 BLOCKED
```

Also state exactly one:

```text
OFFICIAL-RETEST FOCUS-PRESERVATION POLICY VERIFIED
OFFICIAL-RETEST FOCUS-PRESERVATION POLICY BLOCKED
```

Also state exactly:

```text
DOMAIN TO BALANCED INTENTIONALLY UNSUPPORTED IN FOCUS POLICY V1
```

Also state exactly one:

```text
SUPPORTED V2 OFFICIAL-RETEST FOCUS-TRANSITION MATRIX VERIFIED
SUPPORTED V2 FOCUS-TRANSITION MATRIX BLOCKED
```

Also state exactly one:

```text
V2 RETEST CALLBACK IDEMPOTENCY VERIFIED
V2 RETEST CALLBACK IDEMPOTENCY BLOCKED
```

Also state exactly one:

```text
V2 RETEST PARTIAL-STATE RECOVERY VERIFIED
V2 RETEST PARTIAL-STATE RECOVERY BLOCKED
```

Also state exactly one:

```text
V2 RETEST OFFLINE / SYNC / RESTORE / EXPORT VERIFIED
V2 RETEST PERSISTENCE VERIFICATION BLOCKED
```

Also state exactly one:

```text
TODAY / PLAN / PROGRESS / HOME / DIRECT RETEST CONSISTENCY VERIFIED
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

- the supported focus matrix passes;
- partial-state recovery is complete;
- offline/sync/restore/export is complete;
- consumers agree;
- V1 rollback passes;
- no unresolved P0/P1 H4 defect remains.

Also state:

```text
H4.1 POLICY-ALIGNED ACCEPTANCE CLOSED
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

Only state `H4.1 POLICY-ALIGNED ACCEPTANCE CLOSED` when H4.1.1 is verified.

# NEXT STAGE

If H4.1.1 verifies, the next stage is:

```text
PEARL UNIFIED MOVEMENT CHECK-UP — STAGE H5
V2-CANONICAL PROGRESS, CURRENT/HISTORICAL MOVEMENT PROFILE PRESENTATION,
BALANCED MICRO-CHECK PRODUCT POLICY, PUBLIC V1 ROUTE RETIREMENT,
AND RELEASE-CANDIDATE HARDENING
```

Do not begin H5.

# FINAL CODEX RESPONSE

Return a concise summary containing:

- Continuation report path.
- Whether production runtime code changed.
- Re-entry typecheck.
- Step-Up non-regression.
- H4.1 continuation baseline.
- Defects found/fixed.
- Focus-policy decision order.
- Domain -> Balanced correction.
- Domain -> same result.
- Domain -> different clear domain result.
- Balanced -> Balanced result.
- Balanced -> domain result.
- Callback idempotency.
- Local write-boundary/atomicity.
- Partial-state recovery.
- Mid-transition release-flag result.
- Actual remote-call inventory.
- Per-boundary sync-failure result.
- Multi-failure/retry-order result.
- Complete restore.
- Partial restore.
- Duplicate/reordered/stale remote result.
- Malformed/future/source-mismatch result.
- No-recomputation restore result.
- Export/account-clear result.
- Today/Plan/Progress/Home/direct consistency.
- Reference-profile-fingerprint regression.
- Claim-neutral schema/UI.
- Prior-block micro-check matrix.
- Read-only report result.
- V1 rollback.
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
- Confirmation that H0-H4.1, Stage 3D-B, Stage 4, Stage 5, Step-Up resume, navigation, TypeScript boundaries, safety audio, and V2 audio remain green.
- `UNIFIED MOVEMENT CHECK-UP STAGE H4.1.1 VERIFIED` or blocked.
- Focus-policy verdict.
- Supported-transition verdict.
- Idempotency verdict.
- Partial-state verdict.
- Persistence verdict.
- Consumer-consistency verdict.
- V1 rollback verdict.
- `UNIFIED MOVEMENT CHECK-UP STAGE H5 UNBLOCKED` or blocked.
- `DOMAIN TO BALANCED INTENTIONALLY UNSUPPORTED IN FOCUS POLICY V1`.
- `WARDEN TRANSFORM DEFERRED`.
- `PHYSICAL DEVICE VALIDATION NOT CLAIMED`.
- `PUBLIC RELEASE REMAINS BLOCKED`.
- Initial/final Git status.
- Complete files-changed inventory.
- Concurrent external changes.
- Confirmation that no package install, lockfile change, audio regeneration, staging, commit, branch, push, or H5 work occurred.
