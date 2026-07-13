You are carrying out the next verification stage of Pearl’s approved unified Movement Check-Up architecture:

PEARL UNIFIED MOVEMENT CHECK-UP — STAGE H3.1
PUBLIC BASELINE / ONBOARDING END-TO-END VERIFICATION, RESUME / RESTORE / ROLLBACK HARDENING, AND V2 OFFICIAL-RETEST CONTAINMENT

This is a verification-first continuation of Stage H3.

Do not begin H4 in this task.

The purpose is to prove the complete H3 public cutover through production boundaries—not merely the release-flag parser and route selector—before adding official V2 retest, reports, or next-block creation.

## Why H3.1 is required

Stage H3 implemented the public baseline/onboarding cutover and passed the full repository gate.

However, its focused final validation covered only:

```text
3 suites
14 tests
```

The H3 report documents the full onboarding, resume, rollback, restore, and official-retest behavior largely through code tracing and reuse of prior lower-level tests.

Before H4 adds lifecycle side effects, H3.1 must prove the actual integrated public chain:

```text
release flag on
-> normal onboarding
-> polished unified V2 Check-Up
-> raw Check-Up saved
-> reference details
-> immutable snapshot
-> immutable assessment
-> automatic V2 domain or balanced block
-> polished Movement Profile
-> View my 4-week plan
-> matching block intro
```

It must also prove:

- release flag off preserves V1;
- no V1 artifact is produced in the flag-on path;
- repeated callbacks remain idempotent;
- restart/restore at every boundary is deterministic;
- a later flag-off build preserves completed V2 data and training;
- V2-origin official retest cannot leak into V1 from Today, Plan, Progress, Home, or direct routing.

## H3 prerequisite

Read this report in full:

```text
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H3_BASELINE_ONBOARDING_CUTOVER.md
```

Recorded H3 decisions:

```text
UNIFIED MOVEMENT CHECK-UP STAGE H3 COMPLETE
FAIL-CLOSED UNIFIED RELEASE FLAG IMPLEMENTED
PUBLIC BASELINE / ONBOARDING V2 CUTOVER IMPLEMENTED
UNIFIED ONBOARDING ARTIFACT AND PLAN FLOW VERIFIED
ROLLBACK / KILL-SWITCH BEHAVIOR VERIFIED
UNIFIED MOVEMENT CHECK-UP STAGE H4 UNBLOCKED

UNIFIED RELEASE FLAG DEFAULTS OFF
FLAG OFF PRESERVES V1 PUBLIC BASELINE
FLAG ON ROUTES PUBLIC BASELINE TO THE UNIFIED V2 ENGINE
PLAN CREATION REMAINS AUTOMATIC
V2 PLAN CTA IS NAVIGATION-ONLY
NO BUILD MY PLAN ACTION
NO V1 LEGACY-RESULT MIGRATION REQUIRED
PUBLIC PROGRESS MIGRATION NOT PERFORMED
OFFICIAL V2 RETEST NOT IMPLEMENTED
V2 REPORT / NEXT-BLOCK FLOW NOT IMPLEMENTED
INTERNAL H1/H2/V2 REFERENCE HARNESSES RETAINED
WARDEN TRANSFORM DEFERRED
PHYSICAL DEVICE VALIDATION NOT CLAIMED
PUBLIC RELEASE REMAINS BLOCKED
```

H3 added:

```text
src/config/unifiedMovementCheckUpRelease.ts
src/checkup/publicCheckUpEngine.ts
```

and integrated the public route in `App.tsx`.

H3 reportedly passed:

- full Jest: 138 suites / 1,129 tests;
- audio: 150 assets;
- app typecheck;
- website typecheck;
- Expo config;
- Android/iOS export;
- `git diff --check`.

Re-run the current baseline. Do not assume these counts remain unchanged.

## Founder decisions locked

### Canonical product

The future canonical baseline is:

```text
polished shared Check-Up shell
+
V2 live protocol engine
+
frozen V2 Movement Profile
+
automatic V2 plan
```

### Release behavior

The current release flag is:

```text
EXPO_PUBLIC_ENABLE_UNIFIED_MOVEMENT_CHECKUP
```

Only exact `1` enables it.

It defaults to `0`.

No user, backend, profile, restore, remote JSON, deep link, or `__DEV__` state may enable it.

### Flag off

Flag off preserves the current V1 public baseline path for rollback during staged rollout.

### Flag on

Flag on routes public baseline and baseline retake to the unified V2 engine.

### Plan

Plan creation remains automatic before results.

The exact CTA is:

```text
View my 4-week plan
```

The CTA navigates only.

### No V1 migration

No real user completed a V1 Check-Up.

Do not add legacy-result migration, mixed history, V1-to-V2 conversion, or public legacy UI.

### Warden

Warden chair-percentile implementation remains deferred.

Chair remains raw-only.

### Physical validation

Physical-device validation is not claimed.

This stage is software verification only.

## Required prior reading

Read in full:

- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H3_BASELINE_ONBOARDING_CUTOVER.md`
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H2_V1_RESULTS_SHELL_V2_PROFILE.md`
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H1_V1_SHELL_V2_ADAPTER.md`
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H0_HEALTH_GATE.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2D_2C.md`
- `docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2E_A_1.md`
- `docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5H.md`
- `docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5G_1.md`

Also inspect:

- `AGENTS.md`;
- `CLAUDE.md`;
- `docs/decisions.md`;
- `App.tsx`;
- onboarding reducer/store/serialization;
- H1 unified Check-Up wrapper;
- H2 unified Results wrapper;
- public release config;
- public engine selector;
- V2 artifact materialisation;
- V2 automatic block materialisation;
- history/local storage;
- backend restore;
- Today/Plan/Progress/Home re-test actions;
- route/deep-link guards.

Treat current code, including current untracked production files, as source of truth.

## Verification/remediation mode

This is verification-first.

Permitted repository changes:

1. New focused integration tests.
2. A minimal test harness using production helpers.
3. Narrow production fixes only when a failing test proves a real H3 defect.
4. The H3.1 report.

Do not proactively redesign H3.

Do not perform broad refactors.

If the current App orchestration is impossible to test without reproducing its logic in tests, you may extract the smallest pure decision/state-transition helper from `App.tsx` and make `App.tsx` call it.

Requirements for such extraction:

- behavior-preserving;
- no parallel orchestration;
- no new artifact authority;
- no change to public copy/UI;
- driven by a failing verification test;
- fully documented.

This stage must not implement:

- official V2 retest;
- V2 previous/current result comparison;
- V2 block report;
- automatic next block;
- Progress migration;
- Warden;
- new audio;
- protocol/reference/focus/block-policy changes;
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

1. Treat all existing changes as user-owned.
2. Inspect current diffs before touching a file.
3. Do not overwrite concurrent App/onboarding/backend/UI work.
4. Do not revert, delete, move, or broadly reformat unrelated work.
5. Do not edit prior reports or `docs/decisions.md`.
6. Do not use destructive Git commands.
7. Do not install packages.
8. Do not modify lockfiles.
9. Do not regenerate audio.
10. Do not stage, commit, branch, push, or open a PR.
11. Do not inspect or expose `.env` values or provider credentials.
12. Do not modify or share font files.
13. If a concurrent change makes safe verification ambiguous, stop mutation and mark the stage blocked.

# PART B — CURRENT BASELINE

## Step 2: Run a broad pre-edit target

Run focused tests covering:

- H3 release flag;
- public engine selector;
- H1 shell;
- H2 results adapter;
- V2 live coordinator;
- V2 reference details;
- V2 snapshot/assessment/persistence;
- V2 automatic block;
- onboarding;
- history;
- backend restore;
- app lifecycle;
- Progress/Today/Plan;
- official-retest gating.

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
rm -rf /tmp/pearl-unified-h31-baseline-export
npx --no-install expo export --platform all --output-dir /tmp/pearl-unified-h31-baseline-export
rc=$?
rm -rf /tmp/pearl-unified-h31-baseline-export
exit $rc
```

Record exact counts and warnings.

If baseline fails for unrelated concurrent work:

- do not repair unrelated code;
- continue only if H3.1 can restore the required gate within scope;
- otherwise mark blocked.

# PART C — RECONSTRUCT THE ACTUAL H3 ORCHESTRATION

## Step 3: Trace production callbacks and state

Trace exact current production flow for flag-on onboarding:

```text
beginOnboardingCheckUp
-> camera explanation/setup
-> beginCheckUp('baseline')
-> public selector
-> public unified V2 launch
-> live raw completion callback
-> raw local history save
-> reference-details route
-> reference submit callback
-> V2 snapshot/assessment materialisation
-> V2 block materialisation
-> local block save
-> result route
-> plan CTA
-> onboarding preference mutation
-> block intro
```

For every transition record:

- owning function;
- input;
- output;
- local write;
- backend write;
- route change;
- idempotency key;
- failure behavior.

## Step 4: Trace flag-off V1 path

Trace the same boundaries for flag off.

Prove current V1 behavior is not altered by H3.

## Step 5: Trace all official-retest entry points

Inspect:

- Today;
- Plan;
- Progress;
- Home/next-best-action;
- manual Check-Up options;
- direct App action;
- route/deep-link attempts.

Record whether every route eventually uses the same V2-origin containment guard.

# PART D — INTEGRATION TEST ARCHITECTURE

## Step 6: Add a production-faithful integration harness

Create focused integration tests under a repository-consistent path, for example:

```text
src/checkup/__tests__/publicUnifiedMovementCheckUpLifecycle.integration.test.ts
```

A second focused file may be used for rollback/retest containment.

The harness must:

- use current production selectors;
- use current onboarding reducer/store helpers;
- use current V2 raw Check-Up builders or live-coordinator synthetic replay;
- use current snapshot/assessment materialiser;
- use current V2 block materialiser;
- use current result adapter/view model;
- use current restore/history parsers;
- use deterministic timestamps/IDs;
- model route transitions through the same extracted production decisions used by App.

The harness must not:

- reproduce H3 logic in a separate fake implementation;
- stub artifact creation with arbitrary objects;
- cast invalid objects into accepted types;
- call V1 scoring in the flag-on scenario;
- use real camera hardware;
- use network;
- use wall-clock sleeps.

## Step 7: At least one live-adapter-derived baseline

At least one flag-on end-to-end scenario must generate the raw V2 Check-Up through the production live coordinator/synthetic landmark replay rather than a canned raw result helper.

It may reuse existing deterministic live replay fixtures.

Expected chain:

```text
live coordinator
-> raw V2 Check-Up
-> public H3 materialisation path
-> frozen snapshot
-> frozen assessment
-> V2 block
-> H2 result presentation
```

# PART E — FLAG-OFF V1 VERIFICATION

## Step 8: Full flag-off onboarding scenario

Verify:

```text
release flag false
-> onboarding baseline selector = legacy_v1
-> public V1 CheckUpScreen
-> V1 completion path
-> V1 Results/OnboardingResults
-> current V1 block path
```

Required assertions:

- no V2 raw Check-Up;
- no V2 snapshot;
- no V2 assessment;
- no `movement-block-v2:*`;
- no unified result route;
- existing V1 callbacks and onboarding progression preserved.

Do not change V1 behavior.

## Step 9: Internal/release flag matrix

Test:

| Release | Internal | Expected public baseline | Internal rows |
| --- | --- | --- | --- |
| off | off | V1 | hidden |
| off | on | V1 | shown |
| on | off | unified V2 | hidden |
| on | on | unified V2 | shown |

Diagnostics must not affect public selection.

# PART F — FLAG-ON DOMAIN ONBOARDING

## Step 10: Complete domain-focus scenario

Use a valid V2 baseline that produces a deterministic domain focus, preferably Balance.

Verify:

1. Public selector chooses unified V2.
2. Source type is `baseline`.
3. Public entry uses H1 polished shell.
4. Raw Check-Up is saved before reference details.
5. Reference details are submitted or skipped through production draft conversion.
6. Snapshot is created exactly once.
7. Assessment is created exactly once.
8. Assessment focus is the expected domain.
9. Stable V2 block is created exactly once.
10. Block origin binds to assessment/snapshot/Check-Up.
11. H2 onboarding result is ready.
12. Chair remains raw-only.
13. CTA is exactly `View my 4-week plan`.
14. CTA has no block-creation side effect.
15. Onboarding progression reaches `results` before CTA.
16. CTA moves onboarding to the currently intended completion milestone.
17. Matching block intro opens.
18. No session starts automatically.

## Step 11: No V1 artifact proof

Inspect all local outputs after the flag-on scenario.

Assert absence of:

- V1 `CheckUpScore`;
- V1 score snapshot;
- V1 `MovementAssessment`;
- V1 weakest-domain result;
- legacy `TrainingBlock`;
- V1-origin `MovementBlock`;
- V1 result route.

A V2 block may use shared Stage 5 fields, but its origin/focus metadata must remain V2.

# PART G — FLAG-ON BALANCED ONBOARDING

## Step 12: Complete Balanced scenario

Use a valid V2 baseline that produces:

```text
focus.kind = balanced
```

Verify:

- snapshot/assessment are valid;
- block focus is genuinely balanced;
- no fake `focusDomain`;
- balanced-A/B/C metadata is present;
- H2 result says Balanced;
- plan-ready copy is truthful;
- CTA opens matching balanced block intro;
- no Strength fallback appears;
- onboarding completes under the same policy as a domain block.

# PART H — REFERENCE-DETAIL VARIANTS

## Step 13: Entered reference details

Test:

- exact age;
- explicit female or male published reference group;
- correct frozen profile;
- no global profile mutation;
- shoulder eligibility where appropriate;
- chair still raw-only.

## Step 14: Skipped reference details

Test:

- explicit unknown/prefer-not-to-say values;
- raw-complete Check-Up remains valid;
- snapshot and assessment still materialise;
- balance task band remains;
- shoulder may remain raw-only;
- focus may become goal-led or Balanced;
- automatic block still works when assessment is valid.

## Step 15: Invalid headline evidence

Test one invalid/missing headline domain.

Expected:

- raw attempt may remain saved;
- no official V2 assessment with domain/balanced focus;
- no V2 block;
- onboarding does not complete;
- typed retake/recovery;
- no V1 fallback;
- no fabricated Balanced result.

# PART I — BASELINE-RETAKE / STANDARD FLOW

## Step 16: Public standard baseline

Verify a non-onboarding standard baseline with release flag on:

- unified V2 screen;
- standard H2 result variant;
- no onboarding preference mutation;
- plan behavior follows active-block policy.

## Step 17: Baseline-retake source

With an accepted previous V2 baseline:

- public selector freezes `baseline_retake`;
- prior standing leg/shoulder side prefill follows current V2 policy;
- new artifacts bind to the new Check-Up;
- old artifacts remain immutable;
- another active block is not silently replaced.

# PART J — DUPLICATE CALLBACK AND IDEMPOTENCY

## Step 18: Raw completion replay

Call the production raw-completion boundary twice.

Expected:

- one raw Check-Up identity;
- no duplicate history row;
- one pending reference-details state.

## Step 19: Reference submission replay

Submit the same details twice.

Expected:

- one snapshot ID/fingerprint;
- one assessment ID/fingerprint;
- one block ID/fingerprint;
- identical material reuses;
- no duplicate sync rows.

## Step 20: Result navigation replay

Trigger result routing twice.

Expected:

- stable current route;
- no duplicate materialisation;
- no changed start date.

## Step 21: CTA replay

Tap `View my 4-week plan` twice.

Expected:

- same block;
- onboarding state remains valid;
- no duplicate block;
- no session auto-start;
- no duplicate onboarding side effect that corrupts history.

# PART K — RESUME AND RELAUNCH

## Step 22: Resume matrix

Verify with production selectors/serialization:

1. Exit during chair.
2. Exit during balance.
3. Exit during shoulder.
4. Raw complete before reference details.
5. Reference details submitted before materialisation callback returns.
6. Snapshot exists, assessment missing.
7. Assessment exists, block missing.
8. Block local, sync failed.
9. Results shown before CTA.
10. CTA completed before app termination.
11. Restored from backend on another logical device.

For each assert:

- next route/state;
- preserved artifacts;
- no duplicates;
- no V1 fallback;
- no recomputation of accepted frozen artifacts;
- no premature onboarding completion.

## Step 23: Pending raw behavior

A pending raw-complete V2 Check-Up must resume reference details only through an allowed unified/internal continuation.

It must never be scored as V1.

## Step 24: Remote restore

Use current restore services.

Verify:

- accepted remote V2 Check-Up/snapshot/assessment/block restore;
- onboarding does not restart baseline;
- plan remains usable;
- artifacts are parsed, not recomputed;
- same-ID conflicts remain fail-closed.

# PART L — LOCAL-FIRST / OFFLINE FAILURE

## Step 25: Backend sync failure

Inject existing mocked backend failure after local artifacts/block are ready.

Expected:

- local raw/snapshot/assessment/block remain;
- H2 result is ready;
- CTA works;
- sync-pending state is non-blocking;
- no rollback to V1;
- retry does not duplicate artifacts.

# PART M — ROLLBACK / KILL SWITCH

## Step 26: Completed V2 state, later release flag off

Verify:

- existing V2 artifacts parse;
- existing V2 block remains active/trainable;
- Plan/Today can use it;
- no V1 conversion;
- no second V1 block;
- starting a new public baseline follows V1 only;
- no data deletion.

## Step 27: Partial V2 state, later flag off

Test:

- in-progress V2 flow;
- raw-complete pending details;
- snapshot-only;
- assessment-only/no block.

Expected:

- none becomes V1 automatically;
- data is preserved;
- no V1 scoring;
- current typed recovery/continuation policy is explicit;
- no silent loss.

If current code has no safe user-facing handling for one of these cases, add the narrowest typed recovery required and document it.

Do not implement H4.

## Step 28: Flag toggling does not rewrite history

Run:

```text
on -> complete V2
off -> read/train
on -> open existing result/start new allowed baseline
```

Assert frozen artifacts and block fingerprints are unchanged.

# PART N — OFFICIAL V2 RETEST CONTAINMENT

## Step 29: Today

For a V2-origin block with scheduler status `retest_due`:

- Today action must not launch V1;
- typed unavailable route/copy;
- plan/progress remain saved.

## Step 30: Plan

Same assertions from Plan.

## Step 31: Progress

Same assertions from Progress.

## Step 32: Home/next-best-action

If Home exposes retest action, verify containment.

## Step 33: Direct App action

Direct `beginCheckUp('official_retest')` with V2-origin block must fail closed.

## Step 34: Direct route/deep-link attempt

Crafted route must not launch:

- V1 official retest;
- V2 official retest;
- report;
- next block.

## Step 35: V1 rollback official retest

Flag off + true V1-origin block may preserve current V1 official-retest behavior.

Do not break that rollback path.

# PART O — PUBLIC COPY / INTERNAL HARNESS

## Step 36: Public copy source guards

Verify flag-on public flow contains no user-visible:

- V2;
- unified;
- internal;
- developer;
- diagnostics;
- schema;
- fingerprint;
- source ID;
- Movement Age;
- weakest;
- physical-validation claim;
- Build/Create/Generate/Personalise plan.

Allowed:

```text
Movement Check-Up
Movement Profile
Suggested focus
View my 4-week plan
```

## Step 37: Internal harness retention

Verify the internal flag still exposes:

- standalone V2 Check-Up;
- H1 unified shell comparison;
- H2 unified result comparison;
- standalone V2 result harness.

Release flag alone must not expose those rows.

# PART P — OBSERVABILITY / PRIVACY

## Step 38: Breadcrumb verification

Verify H3 breadcrumbs record only bounded fields:

- engine;
- source type;
- entry context;
- artifact IDs;
- action/reason codes.

Assert absence of:

- landmarks;
- video/image data;
- raw body coordinates;
- free-text health data;
- full profile;
- tokens;
- secrets.

# PART Q — ALLOWED NARROW REMEDIATION

If a test exposes a real defect, fix only that defect.

Permitted examples:

- missing one-shot guard;
- route selector bypass;
- incorrect onboarding transition;
- missing typed rollback recovery;
- V1 artifact creation leak;
- wrong block-intro target;
- direct retest route bypass;
- stale local/remote duplicate resolution at an H3 boundary.

Not permitted:

- H4 official retest;
- report/next block;
- Progress redesign;
- Warden;
- protocol/reference/focus changes;
- broad App refactor;
- new backend schema;
- new dependencies.

Every production fix must have a failing regression first.

# PART R — REQUIRED TEST MATRIX

## A. Release and selection

- parser;
- flag matrix;
- baseline;
- baseline retake;
- unknown source;
- frozen decision;
- internal independence.

## B. Flag-off V1

- full onboarding launch;
- V1 artifacts;
- V1 results;
- V1 block;
- no V2 artifact.

## C. Flag-on domain baseline

- live-derived raw V2;
- reference details;
- snapshot;
- assessment;
- block;
- result;
- CTA;
- block intro;
- no V1 artifact.

## D. Flag-on Balanced baseline

- genuine balanced focus/block;
- onboarding completion;
- no fake domain.

## E. Invalid baseline

- needs retake;
- no block;
- no V1 fallback.

## F. Standard/baseline retake

- standard variant;
- baseline_retake source;
- immutable prior artifacts;
- active-block conflict.

## G. Idempotency

- raw callback;
- reference callback;
- materialisation;
- route;
- CTA;
- sync.

## H. Resume/restore

- all boundaries;
- remote restore;
- conflict;
- no recomputation;
- no V1 fallback.

## I. Offline

- local ready;
- sync failure;
- retry;
- no duplicate.

## J. Kill switch

- complete V2 + flag off;
- partial V2 + flag off;
- active V2 block + flag off;
- toggle on/off/on;
- no data rewrite.

## K. Retest containment

- Today;
- Plan;
- Progress;
- Home;
- direct action;
- direct route;
- V1 rollback behavior.

## L. Copy/internal settings

- public copy;
- developer rows hidden with release-only;
- internal harness retained.

## M. Privacy

- breadcrumb payload;
- persistence payload;
- no media/landmarks/secrets.

## N. Product containment

- no H4;
- no Progress migration;
- no Warden;
- no audio;
- no protocol/reference/focus/block-policy changes.

## O. Regression

- H0;
- H1;
- H2;
- H3 parser/selector;
- Stage 3D-B artifact chain;
- V2 automatic block;
- Stage 4;
- Stage 5H;
- navigation;
- TypeScript boundary;
- audio.

# PART S — VALIDATION COMMANDS

## Step 39: Focused H3.1 command

Run all new and relevant tests, including:

- H3.1 end-to-end lifecycle;
- rollback/restore;
- official-retest containment;
- existing release flag/selector;
- H1/H2 wrappers;
- V2 materialisation;
- onboarding;
- restore.

Record the exact command and counts.

## Step 40: Full release gate

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
rm -rf /tmp/pearl-unified-h31-export
npx --no-install expo export --platform all --output-dir /tmp/pearl-unified-h31-export
rc=$?
rm -rf /tmp/pearl-unified-h31-export
exit $rc
```

Do not install dependencies.

Record:

- focused suites/tests;
- full suites/tests;
- audio:
  - safety 44/88;
  - Movement Profile V2 31/62;
  - total 150;
- app typecheck;
- website typecheck;
- Expo config;
- release flag resolved default without secrets;
- Android export;
- iOS export;
- asset count;
- `git diff --check`;
- warnings;
- whether validation changed files.

# PART T — REPORT

Create exactly one report:

```text
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H3_1_END_TO_END_VERIFICATION.md
```

Do not edit prior reports or `docs/decisions.md`.

Required sections:

1. Scope.
2. Why H3.1 was required.
3. H3 prerequisite evidence.
4. Initial Git status.
5. Baseline validation.
6. Actual H3 production callback map.
7. Integration-harness architecture.
8. Flag-off V1 proof.
9. Flag matrix proof.
10. Flag-on domain onboarding proof.
11. Flag-on Balanced onboarding proof.
12. No-V1-artifact proof.
13. Reference-details variants.
14. Invalid-headline fail-closed proof.
15. Standard/baseline-retake proof.
16. Duplicate-callback/idempotency proof.
17. Resume matrix.
18. Remote restore proof.
19. Local-first/sync-failure proof.
20. Kill-switch complete-state proof.
21. Kill-switch partial-state proof.
22. Official-retest containment by entry point.
23. Internal harness/public copy proof.
24. Observability/privacy proof.
25. Defects found.
26. Production fixes, if any.
27. Files changed.
28. Tests added/changed.
29. Exact focused validation.
30. Exact full validation.
31. Audio verification.
32. App/website typechecks.
33. Expo config/export.
34. H0/H1/H2/H3/Stage 3D-B/Stage 4/Stage 5 regression.
35. Remaining H4/H5 work.
36. Whether H4 is unblocked.
37. Initial/final Git status.
38. Complete files-changed inventory.
39. Concurrent external changes.
40. Confirmation that no package install, lockfile change, audio regeneration, staging, commit, branch, or push occurred.

# REQUIRED INVARIANTS

After H3.1:

1. Release flag defaults off.
2. Flag off completes the current V1 path.
3. Flag on completes a production-faithful V2 domain onboarding path.
4. Flag on completes a production-faithful V2 Balanced onboarding path.
5. At least one valid raw baseline is produced through the live coordinator.
6. Raw V2 saves before reference details.
7. Snapshot/assessment/block are created once.
8. No V1 score exists in the flag-on path.
9. No V1 MovementAssessment exists.
10. No legacy/V1-origin block exists.
11. H2 result uses frozen V2 data.
12. CTA is navigation-only.
13. Domain and Balanced block intro both work.
14. Session does not auto-start.
15. Invalid headline evidence cannot create a plan.
16. Duplicate callbacks are idempotent.
17. Resume does not duplicate or switch engines.
18. Remote restore parses rather than recomputes.
19. Local-ready survives sync failure.
20. Complete V2 state survives flag off.
21. Partial V2 state never becomes V1.
22. Existing V2 block remains trainable with flag off.
23. Flag toggling does not rewrite artifacts.
24. V2-origin retest never launches V1.
25. Every retest entry point is contained.
26. Internal harnesses remain.
27. Release flag alone exposes no developer rows.
28. Public copy contains no internal terms.
29. Breadcrumbs contain no pose/media/health text/secrets.
30. No H4 behavior is added.
31. Warden remains deferred.
32. Audio remains 150 assets.
33. Full repository gate passes.
34. Public release readiness is not claimed.

# ACCEPTANCE CRITERIA

Do not mark H3.1 verified unless:

1. The full flag-on onboarding chain is tested through production helpers.
2. A domain and Balanced path both pass.
3. The full flag-off V1 path passes.
4. No V1 artifact leak is proven.
5. Idempotency is proven at all major callback boundaries.
6. Resume/restore is proven.
7. Kill-switch behavior is data-preserving.
8. All official-retest entries are contained.
9. Any production change has a prior failing test.
10. Focused tests pass.
11. Full Jest passes.
12. Audio verification passes.
13. App typecheck passes.
14. Website typecheck passes.
15. Expo config passes.
16. Android/iOS export passes.
17. `git diff --check` passes.
18. No unrelated work is overwritten.
19. No package/lockfile/audio change occurs.
20. No staging/commit/branch/push occurs.

Do not mark verified if:

- only parser/selector tests exist;
- tests use entirely fabricated artifacts;
- flag-on creates any V1 score/assessment/block;
- a partial V2 flow can become V1;
- any V2-origin retest entry launches V1;
- the CTA creates a block;
- the Balanced path uses a fake domain;
- H4 is partially implemented.

# STAGE DECISIONS

At the end of the report state exactly one:

```text
UNIFIED MOVEMENT CHECK-UP STAGE H3.1 VERIFIED
UNIFIED MOVEMENT CHECK-UP STAGE H3.1 BLOCKED
```

Also state exactly one:

```text
FLAG-OFF PUBLIC V1 PATH VERIFIED
FLAG-OFF PUBLIC V1 PATH BLOCKED
```

Also state exactly one:

```text
FLAG-ON PUBLIC UNIFIED ONBOARDING PATH VERIFIED
FLAG-ON PUBLIC UNIFIED ONBOARDING PATH BLOCKED
```

Also state exactly one:

```text
DOMAIN AND BALANCED ONBOARDING VERIFIED
DOMAIN / BALANCED ONBOARDING BLOCKED
```

Also state exactly one:

```text
PUBLIC UNIFIED IDEMPOTENCY / RESUME / RESTORE VERIFIED
PUBLIC UNIFIED IDEMPOTENCY / RESUME / RESTORE BLOCKED
```

Also state exactly one:

```text
ROLLBACK / KILL-SWITCH DATA PRESERVATION VERIFIED
ROLLBACK / KILL-SWITCH DATA PRESERVATION BLOCKED
```

Also state exactly one:

```text
V2 OFFICIAL-RETEST CONTAINMENT VERIFIED
V2 OFFICIAL-RETEST CONTAINMENT BLOCKED
```

Also state exactly one:

```text
UNIFIED MOVEMENT CHECK-UP STAGE H4 UNBLOCKED
UNIFIED MOVEMENT CHECK-UP STAGE H4 BLOCKED
```

Use H4 unblocked only if:

- flag-off and flag-on full paths pass;
- domain and Balanced pass;
- no V1 artifact leak exists;
- idempotency/resume/restore/kill-switch pass;
- every V2 retest entry is contained;
- no unresolved P0/P1 H3 defect remains.

Also state:

```text
UNIFIED RELEASE FLAG DEFAULTS OFF
PLAN CREATION REMAINS AUTOMATIC
V2 PLAN CTA IS NAVIGATION-ONLY
NO BUILD MY PLAN ACTION
NO V1 LEGACY-RESULT MIGRATION REQUIRED
PUBLIC PROGRESS MIGRATION NOT PERFORMED
OFFICIAL V2 RETEST NOT IMPLEMENTED
V2 REPORT / NEXT-BLOCK FLOW NOT IMPLEMENTED
INTERNAL H1/H2/V2 REFERENCE HARNESSES RETAINED
WARDEN TRANSFORM DEFERRED
CHAIR REFERENCE CLAIM REMAINS RAW-ONLY
PHYSICAL DEVICE VALIDATION NOT CLAIMED
PUBLIC RELEASE REMAINS BLOCKED
```

# NEXT STAGE

If H3.1 verifies, H4 remains:

```text
PEARL UNIFIED MOVEMENT CHECK-UP — STAGE H4
PUBLIC V2 OFFICIAL RETEST, CLAIM-NEUTRAL PREVIOUS/CURRENT COMPARISON,
V2 BLOCK REPORT, AND AUTOMATIC NEXT BLOCK
```

Do not begin H4 in this task.

# FINAL CODEX RESPONSE

Return a concise summary containing:

- Report path.
- Whether production runtime code changed.
- Defects found/fixed.
- Integration-test architecture.
- Flag-off V1 result.
- Flag matrix result.
- Flag-on domain onboarding result.
- Flag-on Balanced onboarding result.
- Live-coordinator-derived raw baseline result.
- No-V1-artifact proof.
- Reference-details variants.
- Invalid-headline result.
- Baseline-retake result.
- Idempotency result.
- Resume result.
- Restore result.
- Sync-failure result.
- Complete-state kill-switch result.
- Partial-state kill-switch result.
- Today/Plan/Progress/Home/direct retest containment.
- Internal harness/public copy result.
- Privacy result.
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
- Confirmation that H0/H1/H2/H3, Stage 3D-B, Stage 4, Stage 5, navigation, TypeScript boundaries, safety audio, and V2 audio remain green.
- `UNIFIED MOVEMENT CHECK-UP STAGE H3.1 VERIFIED` or blocked.
- Flag-off verdict.
- Flag-on verdict.
- Domain/Balanced verdict.
- Idempotency/resume/restore verdict.
- Kill-switch verdict.
- Retest-containment verdict.
- `UNIFIED MOVEMENT CHECK-UP STAGE H4 UNBLOCKED` or blocked.
- `WARDEN TRANSFORM DEFERRED`.
- `PHYSICAL DEVICE VALIDATION NOT CLAIMED`.
- `PUBLIC RELEASE REMAINS BLOCKED`.
- Initial/final Git status.
- Complete files-changed inventory.
- Concurrent external changes.
- Confirmation that no package install, lockfile change, audio regeneration, staging, commit, branch, or push occurred.
