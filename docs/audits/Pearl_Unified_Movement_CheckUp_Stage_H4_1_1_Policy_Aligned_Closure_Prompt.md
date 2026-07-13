You are carrying out the policy-aligned closure verification for Pearl’s unified Movement Check-Up lifecycle:

PEARL UNIFIED MOVEMENT CHECK-UP — STAGE H4.1.1
POLICY-ALIGNED OFFICIAL-RETEST CLOSURE,
PARTIAL-STATE / OFFLINE / RESTORE VERIFICATION,
CROSS-CONSUMER CONSISTENCY,
AND H5 RELEASE-GATE DECISION

This is a verification-first closure of the remaining H4.1 evidence gaps.

Do not begin H5 in this task.

## Why H4.1.1 is required

The latest continuation report is:

```text
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_1_END_TO_END_VERIFICATION_CONTINUATION.md
```

It proved substantial H4 behavior:

- a real V2 domain block reached `retest_due` from 12 schedule credits;
- a real Balanced block reached `retest_due`;
- one official retest was derived through `MovementProfileV2LiveCoordinator`;
- public official-retest selection used the unified V2 engine;
- current snapshot/assessment, comparison, report, retest completion, prior-block completion, and one next block were produced;
- Balanced -> Balanced and Balanced -> domain worked;
- changed standing leg/shoulder side suppressed direct comparison;
- a changed reference profile now suppresses reference-interpretation comparison;
- report identity/read-only behavior and prior-block micro-check sourcing were partially verified;
- result/report CTAs remained navigation-only;
- V1 rollback remained isolated;
- all software gates passed:
  - 145 suites / 1,201 tests;
  - 150 audio assets;
  - app and website typechecks;
  - Expo config;
  - Android/iOS export;
  - `git diff --check`.

The continuation remained blocked for two different reasons:

1. The original acceptance matrix incorrectly required Domain -> Balanced even though the approved official-retest focus-preservation policy intentionally preserves a valid prior domain when no clear replacement exists.

2. Genuine verification gaps remained:
   - partial-transition recovery;
   - failure at each real remote-sync boundary;
   - complete and partial restore permutations;
   - duplicate/reordered remote records;
   - Today/Plan/Progress/Home/direct-action consistency before, during, and after transition.

H4.1.1 must correct the acceptance standard without changing product policy, then close the genuine remaining evidence gaps.

## Product-owner decision locked for H4.1.1

The current official-retest focus policy is approved as-is.

### Domain -> Balanced is intentionally unsupported in policy version 1

For an official retest:

- when the prior focus is a domain;
- that prior domain remains valid;
- and current evidence does not identify one clear replacement domain;

Pearl preserves the prior domain.

It does not switch that user to Balanced merely because current evidence is ambiguous or broadly matched.

This is intentional plan-stability behavior.

Therefore:

```text
Domain -> Balanced is not a required H4.1/H4.1.1 transition.
```

Do not modify `src/reference/movementProfileV2/assessment.ts` to manufacture Domain -> Balanced.

Do not weaken prior-focus validation.

Do not remove Balanced as a first-class baseline or prior-Balanced outcome.

### Supported official-retest focus-transition matrix

H4.1.1 must verify the transitions the current policy actually supports:

```text
Domain -> same prior domain
Domain -> a different clear domain
Balanced -> Balanced
Balanced -> a clear domain
```

It must also verify this policy boundary:

```text
Domain + ambiguous/no-clear-replacement evidence
-> same prior domain
-> not Balanced
```

If a production-faithful Domain -> different clear domain fixture cannot be produced under current policy, mark H4.1.1 blocked and document the exact policy reason. Do not change policy merely to satisfy the test.

## Historical reports

Read, but do not edit or overwrite:

```text
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_1_END_TO_END_VERIFICATION.md
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_1_END_TO_END_VERIFICATION_CONTINUATION.md
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_OFFICIAL_RETEST_REPORT_NEXT_BLOCK.md
```

The first two remain historical blocked reports.

If H4.1.1 verifies, its report becomes the policy-aligned closure record that supersedes their blocked release-gate verdicts without rewriting them.

## Step-Up health-gate prerequisite

Read:

```text
docs/audits/PEARL_TRAINING_STEP_UP_RUNTIME_RESUME_HEALTH_GATE.md
```

The Step-Up runtime health gate must remain green.

Do not change Step-Up behavior unless a new H4.1.1 regression proves a direct cross-system defect.

## Founder/product decisions carried forward

### Canonical current system

New public official Check-Ups under the unified release flag use:

```text
polished shared Check-Up shell
+
V2 live protocols
+
frozen V2 artifacts
+
automatic V2-origin plan lifecycle
```

A V2-origin official retest must never launch V1.

### No V1-user migration

No real user completed a V1 Check-Up.

Do not add:

- public legacy Movement Age history;
- V1-to-V2 conversion;
- mixed V1/V2 trends;
- permanent dual current-result logic.

Retain true V1 flag-off rollback behavior only.

### Automatic plan creation

The next block is created inside the successful H4 transition before results/report navigation.

Exact CTAs remain:

```text
View my block report
View my next 4-week plan
```

Both navigate only.

They must not create, replace, sync, date-shift, or start a block.

### Claim-neutral comparison

H4 may show factual previous/current raw values.

It must not store or display:

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

No trend arrows or red/green directional semantics.

### Warden

Warden chair-percentile implementation remains deferred.

Chair remains raw-only.

### Release posture

Physical-device validation is not claimed.

Public release remains blocked after H4.1.1.

H4.1.1 may unblock H5 only.

## Required prior reading

Read in full:

- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_1_END_TO_END_VERIFICATION_CONTINUATION.md`
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_1_END_TO_END_VERIFICATION.md`
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_OFFICIAL_RETEST_REPORT_NEXT_BLOCK.md`
- `docs/audits/PEARL_TRAINING_STEP_UP_RUNTIME_RESUME_HEALTH_GATE.md`
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
- current H4/H4.1 production modules;
- current H4.1 continuation tests;
- current App official-retest orchestration;
- current adherence/history persistence;
- current backend sync and restore;
- current data export and account clear;
- Today/Plan/Progress/Home view models and actions;
- true V1 official-retest rollback;
- current Step-Up runtime and tests.

Treat current code, including untracked production files, as source of truth.

## Verification/remediation mode

This is verification-first.

Permitted repository changes:

1. New or extended production-faithful tests.
2. A minimal test harness using production helpers.
3. Narrow production fixes only after a failing H4.1.1 test proves a real defect.
4. One new H4.1.1 report.

Do not proactively redesign H4.

If a lifecycle boundary cannot be tested without copying App logic into fake test code, you may extract the smallest pure production helper and make App use it.

Any extraction must:

- preserve behavior;
- have a failing test first;
- create no second authority;
- do no H5 work;
- do no UI redesign;
- be documented exactly.

This task must not implement:

- V2-canonical Progress design;
- Balanced micro-check policy;
- public V1 route retirement;
- release-candidate cleanup;
- Warden;
- new audio;
- measurement protocol changes;
- reference-table changes;
- focus-policy changes;
- exercise/training policy changes;
- physical-device testing.

# PART A — WORKTREE SAFETY

## Step 1: Capture exact initial state

Before analysis or editing, run:

```bash
git status --short --untracked-files=all
git diff --name-only
git diff --stat
git ls-files --others --exclude-standard
```

Record exact output in the report.

Rules:

1. Treat every existing tracked and untracked file as user-owned.
2. Inspect current diffs before touching a file.
3. Preserve concurrent App, H4, Step-Up, report, Progress, backend, render, training, website, and docs work.
4. Do not revert, delete, move, or broadly reformat unrelated work.
5. Do not edit prior reports or `docs/decisions.md`.
6. Do not use destructive Git commands.
7. Do not install packages.
8. Do not modify lockfiles.
9. Do not regenerate audio.
10. Do not stage, commit, branch, push, or open a PR.
11. Do not inspect or expose `.env` values or provider credentials.
12. Do not modify or share font files.
13. If concurrent work makes lifecycle authority ambiguous, stop mutation and mark H4.1.1 blocked.

# PART B — RE-ENTRY HEALTH GATES

## Step 2: Run app typecheck first

Run:

```bash
npm run typecheck
```

It must pass before H4.1.1 test work begins.

If it fails for unrelated concurrent work:

- do not repair unrelated code;
- create only the H4.1.1 blocked report;
- stop.

## Step 3: Verify Step-Up non-regression

Run the focused Step-Up/runtime slice from the Step-Up health-gate report.

Confirm:

- `TrainingSetRuntime.resume` remains required;
- Step-Up pause/resume regression remains green;
- no unsafe cast/suppression appeared.

## Step 4: Re-run current H4.1 continuation baseline

Run at minimum:

```text
src/pearlFlow/__tests__/movementProfileV2OfficialRetestContinuation.integration.test.ts
```

and the current H4/H3.1 focused slice recorded in the continuation report.

The latest results were:

```text
continuation suite: 4 tests
H4/H3.1 aggregate: 33 suites / 322 tests
```

Use current counts.

Do not proceed if these regress.

# PART C — ACCEPTANCE-CORRECTION PROOF

## Step 5: Verify current focus policy from production code

Inspect:

```text
src/reference/movementProfileV2/assessment.ts
```

and its tests.

Document the exact official-retest decision order.

Prove:

- prior domain context is accepted only when source-bound to the prior V2 assessment;
- a valid prior domain is preserved when current evidence has no clear replacement;
- a clear current replacement domain may supersede the prior domain;
- prior Balanced may remain Balanced when no unique clear domain exists;
- prior Balanced may move to a clear domain;
- V1 focus cannot influence V2 retest;
- live current goal does not rewrite the frozen result after assessment creation.

## Step 6: Formally remove Domain -> Balanced from H4.1 acceptance

Add a focused policy regression proving:

```text
prior domain
+ ambiguous/broadly matched official-retest evidence
-> same prior domain
-> not Balanced
```

This is a pass condition.

Do not mark it blocked.

Do not alter the focus policy.

## Step 7: Verify Domain -> different clear domain

Build a production V2 official-retest fixture where:

- prior focus is one domain;
- current evidence identifies exactly one clear different domain under the current evidence policy;
- current assessment changes to that clear domain;
- next block uses that domain;
- report records prior/current focus neutrally.

Do not inject a manually edited focus into the assessment.

Use the production assessment builder.

If no such fixture is possible under current policy, mark H4.1.1 blocked and explain the exact reason.

## Step 8: Supported transition matrix

The final accepted matrix is:

| Prior | Current result | Required outcome |
| --- | --- | --- |
| Domain | no clear replacement | same prior domain |
| Domain | one clear different domain | different domain |
| Balanced | no clear domain | Balanced |
| Balanced | one clear domain | domain |

No Domain -> Balanced row is required.

# PART D — TEST-HARNESS STRATEGY

## Step 9: Reuse current continuation harness

Inspect:

```text
src/pearlFlow/__tests__/movementProfileV2OfficialRetestContinuation.integration.test.ts
```

Reuse its production fixtures and helpers.

Do not duplicate:

- baseline artifact setup;
- block materialisation;
- 12-credit schedule setup;
- live coordinator replay;
- comparison/report/transition creation.

Add narrowly separated suites where this improves clarity, for example:

```text
src/pearlFlow/__tests__/movementProfileV2OfficialRetestRecovery.integration.test.ts
src/pearlFlow/__tests__/movementProfileV2OfficialRetestConsumers.integration.test.ts
src/services/backend/__tests__/movementProfileV2OfficialRetestPersistence.integration.test.ts
```

Use current repository conventions.

## Step 10: No fake H4 implementation

Tests must use production:

- scheduler;
- V2 materialisers;
- transition;
- report parser/builder;
- serializers;
- sync services;
- restore mapper;
- export/account clear;
- app lifecycle/view models.

Do not create a parallel test-only transition engine.

# PART E — CALLBACK IDEMPOTENCY CLOSURE

## Step 11: Raw completion replay

Call the actual raw-completion boundary twice for the same official retest.

Assert:

- one current retest Check-Up identity;
- one pending reference-details state;
- no duplicate history row;
- no V1 artifact.

## Step 12: Reference submission replay

Submit identical current reference details twice.

Assert:

- one current snapshot;
- one current assessment;
- one comparison;
- one report;
- one retest completion;
- one next block;
- stable timestamps/fingerprints.

## Step 13: Transition replay

Repeat transition with:

- identical explicit transition timestamp;
- different fallback callback clocks;
- existing identical report;
- existing identical next block;
- reversed equivalent collection ordering where production accepts unordered input.

Assert stable exactly-once lifecycle state.

## Step 14: Navigation replay

Repeated:

```text
View my block report
View my next 4-week plan
```

must:

- navigate only;
- not call transition/report/block builders;
- not sync;
- not change dates;
- not start Session A.

# PART F — REACHABLE PARTIAL-STATE MODEL

## Step 15: Map actual write boundaries first

Before creating partial-state fixtures, reconstruct the real local write ordering in App/services.

For each requested partial state, classify it:

```text
reachable after process interruption
reachable after local write failure
remote-only stale state
impossible because one atomic local state write owns both fields
synthetic-invalid and should fail closed
```

Do not invent recovery code for impossible states.

For an impossible state, prove impossibility with the real serialization/update boundary and a focused test.

## Step 16: Assessment exists, transition missing

Required behavior:

- accepted current snapshot/assessment are reused;
- comparison/report/transition resume;
- snapshot/assessment are not recomputed;
- one report/completion/next block.

## Step 17: Report exists, prior block still active

Required behavior:

- same report reused;
- prior block completion resumes only when all source evidence is valid;
- no second report;
- no second next block.

## Step 18: Prior block completed, next block missing

Required behavior:

- create/reuse only the one expected next block from accepted current artifacts;
- do not reopen prior block;
- do not change report identity.

If this state is impossible under atomic local persistence, prove that instead.

## Step 19: Next block exists, report missing

Required behavior:

- recover the exact expected report only when immutable transition evidence is sufficient;
- otherwise fail closed;
- never create a second next block.

If impossible under atomic local persistence, prove that instead.

## Step 20: Retest completion missing

Required behavior:

- create exactly once when safe;
- or leave transition explicitly incomplete;
- scheduler must not infer completion from block status/report alone.

## Step 21: Current comparison/report conflict

Cover:

- same ID/same fingerprint -> reuse;
- same ID/different fingerprint -> immutable conflict;
- first accepted frozen truth preserved;
- no lifecycle overwrite.

## Step 22: Current assessment/next-block conflict

Cover equivalent source-bound conflict behavior.

## Step 23: Release flag turns off mid-transition

Verify:

- no new V2 official retest starts;
- completed local transition remains readable/trainable;
- completed sync-pending transition may finish remote sync;
- partial current V2 retest never becomes V1;
- no data deletion;
- no duplicate V1 block/report.

# PART G — OFFLINE / SYNC-FAILURE MATRIX

## Step 24: Inventory actual H4 remote calls

List the real remote calls made after local transition, such as:

- current Check-Up sync;
- report sync;
- prior block sync;
- next block sync;
- training-state sync;
- retest completion/session sync.

Do not test nonexistent boundaries.

## Step 25: Failure injection per real boundary

For each actual remote call:

1. Complete the local H4 transition.
2. Fail that remote call using the existing mock/failure mechanism.
3. Verify:
   - local current result remains available;
   - local report remains available;
   - prior block remains completed;
   - one next block remains active/trainable;
   - no V1 fallback;
   - retry is idempotent;
   - no duplicate remote/local identity.

## Step 26: Multiple simultaneous failures

Test all H4 remote calls failing in one run.

Local lifecycle must still be complete and usable.

## Step 27: Retry ordering

Retry remote operations:

- in original order;
- reversed order;
- with one already-succeeded operation;
- with duplicate callback.

Accepted local truth must not drift.

# PART H — RESTORE / DUPLICATE / REORDERING MATRIX

## Step 28: Complete-transition restore

Round-trip a completed H4 lifecycle through current backend/local restore.

Assert:

- current official retest restored once;
- report restored once;
- prior block completed;
- one active next block;
- exact accepted fingerprints;
- report reopens read-only;
- next block plans sessions;
- no V1 artifact.

## Step 29: Partial-state restore

Cover each reachable partial state from Part F.

Use real remote/local shapes and parsers.

Do not cast invalid objects into accepted types.

## Step 30: Duplicate identical records

Test duplicate identical:

- Check-Up rows;
- report rows;
- block rows;
- completion rows;
- training-state summaries.

Deduplicate deterministically.

## Step 31: Reordered/stale records

Test:

- next block arrives before completed prior block;
- report arrives before current Check-Up derived artifacts;
- stale prior block remains active remotely;
- stale remote state omits report;
- stale remote state omits next block;
- old training state arrives after newer accepted local state.

Preserve accepted local truth and reconcile/fail closed according to current policy.

## Step 32: Malformed/future/source-mismatched records

Cover:

- malformed V2 report;
- future report schema;
- report source mismatch;
- next-block source mismatch;
- current assessment source mismatch;
- comparison fingerprint mismatch.

Do not promote malformed records.

## Step 33: No recomputation on restore

When a valid frozen report/comparison exists:

- restore parses it;
- does not rerun comparison from raw values;
- does not rerun focus selection;
- does not recreate next block.

# PART I — EXPORT / ACCOUNT CLEAR COMPLETION

## Step 34: Export

Verify the complete H4 export includes bounded:

- current retest artifact JSON;
- V2 report JSON;
- comparison JSON or report-contained comparison;
- prior/next block identifiers needed by current export policy.

Assert exclusion of:

- landmarks;
- frames;
- video/image/base64;
- local file paths/URIs;
- auth tokens;
- provider secrets;
- source PDF/workbook content;
- free-text health notes.

## Step 35: Account clear

Verify one account clear removes:

- current V2 retest local record;
- V2 report;
- adherence transition state;
- prior/current block state for that account;
- next block;
- recording file;
- any dedicated comparison/transition storage.

Preserve unrelated non-account local notes only where current product policy already does so.

No orphan report/comparison state may remain.

# PART J — CONSUMER CONSISTENCY MATRIX

## Step 36: Define canonical lifecycle states

Use production helpers to construct/prove these states:

```text
A. training in progress / not due
B. scheduler retest_due
C. raw current retest saved, details pending
D. current snapshot/assessment ready, transition not applied
E. transition partially persisted/recovering
F. transition complete, report ready, next block active
G. prior report reopened later
```

For impossible states, use the actual nearest reachable state and document why.

## Step 37: Today

For each state, verify the current Today model/action:

- A: session/waiting behavior;
- B: unified V2 official retest action;
- C-E: no second retest, no V1 retest, calm resume/recovery;
- F: next block/current next action;
- G: no lifecycle mutation from report reopening.

## Step 38: Plan

Verify equivalent truthful behavior.

## Step 39: Progress

Verify:

- no stale retest-due action after transition;
- no premature report-ready/next-block state during C-E;
- current H4 visual design remains unchanged;
- no H5 migration occurs.

## Step 40: Home / next-best action

Verify scheduler-backed behavior for A-G.

Do not use stale `block.status` as transition authority.

## Step 41: Direct official-retest action

Verify:

- B starts the same public V2 retest;
- C-E do not start a duplicate;
- F does not start another retest for the completed prior block;
- release off never converts partial V2 to V1.

## Step 42: Cross-consumer equality

For the same adherence/history state, all consumers must agree on:

- current block;
- scheduler phase;
- retest availability;
- report readiness;
- next-block readiness.

# PART K — FOCUS-POLICY AND CLAIM GUARDRAILS

## Step 43: Supported focus-transition tests

Required:

- Domain -> same domain;
- Domain -> different clear domain;
- Balanced -> Balanced;
- Balanced -> clear domain;
- ambiguous Domain -> same domain, explicitly not Balanced.

## Step 44: No policy mutation

Add a source/behavior guard proving H4.1.1 did not change the official-retest focus policy merely to satisfy the old matrix.

## Step 45: Reference-profile-fingerprint regression

Preserve the H4.1 continuation fix:

```text
reference interpretation is comparable only when referenceProfileFingerprint matches
and both profiles otherwise permit reference comparison
```

Add/retain focused regression.

## Step 46: Claim-neutral schema/UI

Retain proof that comparison/report storage and UI contain no:

- delta field;
- direction field;
- percentage-change field;
- significance field;
- improvement/decline copy;
- trend styling.

# PART L — REPORT MICRO-CHECK AND READ-ONLY CLOSURE

## Step 47: Prior-block micro-check permutations

Complete the matrix:

1. Prior block `0`, next block non-zero.
2. Prior block multiple, next block `0`.
3. Prior and next blocks different non-zero values.
4. Serialize/restore.
5. Report reopen after active next block micro-check count changes.

Always use the completed prior block’s authoritative count.

## Step 48: Read-only reopening

Opening results/report later must not:

- rebuild comparison;
- rebuild report;
- recreate next block;
- alter prior/current focus;
- change timestamps/fingerprints;
- call sync as a creation side effect;
- start a session.

# PART M — V1 ROLLBACK

## Step 49: True V1 official retest

With release flag off and a true V1-origin block, verify current V1:

- official retest;
- report;
- prior completion;
- next block.

No V2 artifact may be created.

## Step 50: Cross-protocol isolation

V2 official retest cannot create:

- V1 score;
- V1 score snapshot;
- V1 MovementAssessment;
- V1 report;
- V1 next block;
- Movement Age copy.

V1 official retest cannot create V2 artifacts.

# PART N — ALLOWED NARROW REMEDIATION

If a test proves a real defect, fix only that defect.

Permitted examples:

- missing recovery selector;
- duplicate report/next-block creation;
- restore ordering promotes stale remote state;
- consumer exposes stale due action;
- sync retry mutates accepted local lifecycle;
- account clear leaves orphan V2 report;
- report micro-check count reads active next block;
- focus policy implementation does not match the documented current policy;
- changed reference profile regression reappears.

Not permitted:

- changing policy to allow Domain -> Balanced;
- H5 Progress redesign;
- Balanced micro-check product decision;
- public V1 route retirement;
- Warden;
- new reference policy;
- new audio;
- broad App/state-management rewrite.

Every production fix must have a failing regression first.

# PART O — REQUIRED TEST MATRIX SUMMARY

Final H4.1.1 coverage must include:

## Focus policy

- Domain -> same;
- Domain -> different clear domain;
- Balanced -> Balanced;
- Balanced -> clear domain;
- ambiguous Domain preserves prior;
- no Domain -> Balanced requirement.

## Idempotency

- raw callback;
- reference callback;
- transition;
- result/report navigation;
- remote retry.

## Partial states

- assessment/no transition;
- report/prior active;
- prior complete/next missing;
- next exists/report missing;
- completion missing;
- immutable conflicts;
- flag off mid-transition;
- proof of impossibility where atomic writes prevent a state.

## Remote failure

- each real H4 sync boundary;
- all boundaries failing;
- retry ordering.

## Restore

- complete;
- each reachable partial state;
- duplicates;
- reordering/stale remote;
- malformed/future/source mismatch;
- no recomputation.

## Consumers

- Today;
- Plan;
- Progress;
- Home;
- direct action;
- states A-G.

## Existing verified invariants

- live-derived retest;
- domain/Balanced prior fixtures;
- side/leg comparison suppression;
- reference-profile fingerprint;
- claim neutrality;
- report identity;
- prior micro-check source;
- exactly one next block;
- navigation-only CTAs;
- V1 rollback.

## Containment

- no H5;
- no Progress redesign;
- no Balanced micro-check change;
- no Warden;
- no audio;
- no public V1 retirement;
- no physical-validation claim.

# PART P — TEST QUALITY

Tests must:

- use production scheduler and materialisers;
- use production transition/report/comparison;
- use real serializers and restore/export/account-clear helpers;
- use deterministic explicit timestamps/IDs;
- use current H4.1 continuation fixtures where possible;
- use actual view models/consumer helpers;
- assert input non-mutation;
- assert no V1 artifact leak;
- distinguish reachable from impossible partial states.

Tests must not:

- mock every layer;
- duplicate transition logic in test code;
- use arbitrary casted accepted artifacts;
- use real camera hardware;
- use real network;
- use wall-clock sleeps;
- install packages;
- regenerate audio;
- embed Warden data;
- weaken scheduler/source/immutability guards.

# PART Q — VALIDATION COMMANDS

## Step 51: H4.1.1 focused validation

Run:

- new H4.1.1 closure suites;
- existing H4.1 continuation suite;
- Step-Up health-gate slice;
- public selector;
- scheduler;
- V2 live coordinator;
- V2 snapshot/assessment;
- comparison/report/transition;
- local adherence/history;
- sync services;
- restore;
- export;
- account clear;
- result/report adapters;
- Today/Plan/Progress/Home;
- true V1 report/retest;
- Stage 5G.1/H.

Record exact command and counts.

## Step 52: Full release gate

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
rm -rf /tmp/pearl-unified-h411-export
npx --no-install expo export --platform all --output-dir /tmp/pearl-unified-h411-export
rc=$?
rm -rf /tmp/pearl-unified-h411-export
exit $rc
```

Do not install dependencies.

Record:

- new H4.1.1 suites/tests;
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
- expected backend failure logs;
- new warnings;
- whether validation changed files.

# PART R — MANUAL SOFTWARE TRACE

After automated validation, trace:

## Focus policy

```text
prior domain + ambiguous current evidence
-> same prior domain
-> no Balanced switch
```

```text
prior domain + one clear different current domain
-> different domain next block
```

```text
prior Balanced + ambiguous
-> Balanced
```

```text
prior Balanced + one clear domain
-> domain
```

## Partial transition

Trace every reachable Part F state and the explicit impossibility proof for any atomic state.

## Offline

Trace local-ready lifecycle through all remote failures and retries.

## Restore

Trace complete and partial records under duplicate/reordered/stale input.

## Consumers

Trace A-G through Today/Plan/Progress/Home/direct action.

## V1 rollback

Trace true V1 official retest/report/next block unchanged.

# PART S — REPORT

Create exactly one new report:

```text
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_1_1_POLICY_ALIGNED_CLOSURE.md
```

Do not edit earlier H4/H4.1 reports or `docs/decisions.md`.

Required sections:

1. Scope.
2. Why H4.1.1 was required.
3. Product-owner focus-policy decision.
4. Prior H4.1 blocked evidence.
5. Initial Git status.
6. Re-entry health gates.
7. Current focus-policy decision order.
8. Acceptance correction: Domain -> Balanced intentionally unsupported.
9. Supported focus-transition matrix.
10. H4.1.1 test-harness architecture.
11. Callback idempotency proof.
12. Actual local write-boundary map.
13. Reachable/impossible partial-state classification.
14. Assessment-without-transition recovery.
15. Report/prior-active recovery.
16. Prior-complete/next-missing recovery or atomicity proof.
17. Next-existing/report-missing recovery or atomicity proof.
18. Missing-retest-completion behavior.
19. Immutable-conflict behavior.
20. Mid-transition release-flag rollback.
21. Actual remote-call inventory.
22. Per-boundary sync-failure proof.
23. Multi-failure/retry-order proof.
24. Complete restore proof.
25. Partial restore matrix.
26. Duplicate/reordered/stale remote proof.
27. Malformed/future/source-mismatch proof.
28. No-recomputation restore proof.
29. Export proof.
30. Account-clear proof.
31. Lifecycle states A-G.
32. Today consistency.
33. Plan consistency.
34. Progress consistency.
35. Home consistency.
36. Direct-action consistency.
37. Cross-consumer equality.
38. Reference-profile-fingerprint regression.
39. Claim-neutral schema/UI regression.
40. Prior-block micro-check matrix.
41. Report read-only proof.
42. V1 rollback/cross-protocol isolation.
43. Defects found.
44. Production fixes, if any.
45. Files changed.
46. Tests added/changed.
47. Exact focused validation.
48. Exact full validation.
49. Audio verification.
50. App/website typechecks.
51. Expo config/export.
52. H0-H4.1/Stage 3D-B/Stage 4/Stage 5/Step-Up regression.
53. Remaining H5/release/device work.
54. Whether H5 is unblocked.
55. Initial/final Git status.
56. Complete files-changed inventory.
57. Concurrent external changes.
58. Confirmation that no package install, lockfile change, audio regeneration, staging, commit, branch, push, or H5 work occurred.

# REQUIRED INVARIANTS

After H4.1.1:

1. App typecheck passes before closure work.
2. Step-Up health gate remains green.
3. Existing H4.1 continuation tests remain green.
4. Official-retest focus policy remains unchanged.
5. Ambiguous domain retest preserves prior domain.
6. Domain -> Balanced is not required or fabricated.
7. Domain -> a different clear domain is verified.
8. Balanced -> Balanced is verified.
9. Balanced -> clear domain is verified.
10. Duplicate raw/reference/transition callbacks are idempotent.
11. Navigation CTAs are read-only.
12. Every requested partial state is classified as reachable or impossible.
13. Every reachable partial state recovers or fails closed explicitly.
14. Impossible states are proven impossible through the actual atomic boundary.
15. Every real H4 remote boundary is failure-tested.
16. Local complete lifecycle remains usable under remote failure.
17. Retry ordering creates no duplicates.
18. Complete transition restore is exact.
19. Reachable partial restore states are verified.
20. Duplicate/reordered/stale remote records cannot duplicate or regress accepted state.
21. Malformed/future/source-mismatched records fail closed.
22. Valid frozen report/comparison are not recomputed on restore.
23. Export is bounded and private.
24. Account clear leaves no V2 report/transition orphan.
25. Today/Plan/Progress/Home/direct action agree for A-G.
26. No stale retest action appears after transition.
27. No premature report/next-plan state appears during partial transition.
28. Reference-profile fingerprint comparison fix remains.
29. Comparison/report remain claim-neutral.
30. Report micro-check count always comes from prior completed block.
31. Report reopening is read-only.
32. V1 rollback remains unchanged.
33. V2 transition produces no V1 artifacts.
34. No H5 behavior is implemented.
35. Warden remains deferred.
36. Audio remains 150 assets.
37. Full repository gate passes.
38. Physical-device validation is not claimed.
39. Public release remains blocked.

# ACCEPTANCE CRITERIA

Do not mark H4.1.1 verified unless:

1. The focus acceptance correction is implemented only in tests/report, not by changing product policy.
2. Supported focus-transition matrix passes.
3. Domain -> different clear domain is production-derived.
4. Callback idempotency passes.
5. Every partial state is classified and every reachable state tested.
6. Every real remote boundary is failure-tested.
7. Complete and partial restore matrix passes.
8. Duplicate/reordered/stale remote behavior passes.
9. Export/account clear pass.
10. Today/Plan/Progress/Home/direct action agree.
11. Reference-profile fingerprint regression remains green.
12. Claim-neutral report/result remain green.
13. Prior-block micro-check matrix passes.
14. V1 rollback remains green.
15. Any production fix has a prior failing test.
16. Focused tests pass.
17. Full Jest passes.
18. Audio verification passes.
19. App typecheck passes.
20. Website typecheck passes.
21. Expo config passes.
22. Android/iOS export pass.
23. `git diff --check` passes.
24. No unrelated work is overwritten.
25. No package/lockfile/audio change occurs.
26. No staging/commit/branch/push occurs.

Do not mark verified if:

- focus policy is changed to allow Domain -> Balanced;
- Domain -> different clear domain is not proven;
- partial states are merely listed without tests/atomicity proof;
- sync failures are tested only in unrelated generic backend tests;
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

Also state:

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

Do not begin H5 in this task.

# FINAL CODEX RESPONSE

Return a concise summary containing:

- Report path.
- Whether production runtime code changed.
- Defects found/fixed.
- Re-entry health gates.
- Focus-policy decision order.
- Domain -> Balanced acceptance correction.
- Domain -> same result.
- Domain -> different clear domain result.
- Balanced -> Balanced result.
- Balanced -> domain result.
- Callback-idempotency result.
- Local write-boundary/atomicity result.
- Partial-state recovery result.
- Mid-transition release-flag result.
- Actual remote-call inventory.
- Per-boundary sync-failure result.
- Multi-failure/retry-order result.
- Complete restore result.
- Partial restore result.
- Duplicate/reordered/stale remote result.
- Malformed/future/source-mismatch result.
- No-recomputation restore result.
- Export/account-clear result.
- Today/Plan/Progress/Home/direct consistency result.
- Reference-profile-fingerprint regression.
- Claim-neutral schema/UI result.
- Prior-block micro-check matrix.
- Report read-only result.
- V1 rollback result.
- Files changed.
- Tests added/changed.
- H4.1.1 focused validation.
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
