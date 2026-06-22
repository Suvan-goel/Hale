You are carrying out Stage 5H of Hale’s production-readiness work:

END-TO-END ADVERSARIAL VERIFICATION, LIFECYCLE PROPERTY TESTING, OFFLINE/RESTORE/REPLAY HARDENING, AND STAGE 5 SOFTWARE SIGN-OFF

This is the final Stage 5 verification-and-remediation pass.

The default expectation is that this task will primarily add adversarial, integration, state-machine, and property-style tests plus one complete verification report.

Modify production code only when a new authoritative test proves a real violation of the locked Stage 5 contracts.

Do not begin Stage 3D-B, additional Stage 4 remediation, physical-device validation, store-release work, or unrelated product/UI work in this task.

## Required prior reading

Read these documents in full before analysis or editing:

- docs/audits/HALE_LOGIC_AUDIT_STAGE_5.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5A.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5B.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5B_1.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5C.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5D.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5D_1.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5E.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5E_1.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5F.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5G.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5G_1.md

Also read the most relevant upstream contracts:

- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4A.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4B.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_A.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_C.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_D.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_3C_1.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3B.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_2A_1.md

Treat the current working tree as the source of truth. Re-verify every relevant runtime path because report line numbers and implementation details may no longer be exact.

## Verified baseline entering Stage 5H

Stage 5A closed:

- non-training contamination of A/B/C rotation;
- all-skipped/zero-work main-plan credit;
- missing-result progression;
- ambient planned-date identity.

Stage 5B and 5B.1 closed:

- supporting-only/fallback-only/wrong-domain focus credit;
- persisted false-credit promotion;
- short-session primary-focus credit gaps;
- restore/backend promotion of missing focus evidence.

Stage 5C closed:

- silent dynamic-to-legacy fallback;
- no-active-block and legacy-only session generation;
- untyped generation failures.

Stage 5D and 5D.1 closed:

- parallel current/legacy progression mutation;
- duplicate/replayed progression evidence;
- same-ladder double mutation;
- current progression restore replay;
- canonical tab order mismatch.

Stage 5E and 5E.1 closed:

- fragmented readiness/discomfort normalization;
- blocked movement reappearing through fallback;
- temporary daily regression mutating persistent progression;
- adjusted-session positive progression;
- TypeScript app/website project-boundary failures.

Stage 5F closed:

- multiple current equipment authorities;
- legacy equipment overriding current profile;
- stale-plan equipment mismatch;
- incomplete remote stimulus/equipment metadata;
- pre/post-restore equipment planning inconsistency.

Stage 5G and 5G.1 closed:

- compressible “four-week” scheduling;
- same-day multiple schedule credits;
- missed-session week skipping;
- unclear lapse/restart behavior;
- premature official re-test;
- stale completed/retest flags overriding evidence;
- unstable repeated official re-test transition timestamps;
- restore schedule inconsistency.

The Stage 5G.1 verified release baseline is:

- targeted: 15 suites / 157 tests passed;
- full Jest: 94 suites / 745 tests passed;
- app typecheck: passed;
- website typecheck: passed;
- Expo config: passed with the existing Sentry warning;
- `git diff --check`: passed.

Verify the current baseline rather than assuming it is unchanged.

## Purpose of Stage 5H

Stage 5H is not another narrow feature stage.

It is the final integrated proof that all Stage 5 contracts work together under realistic and adversarial user states.

The key question is:

> Can Hale reliably transform a valid official Movement Check-Up into four weeks of safe, useful, deterministic, credit-honest training, survive interruptions/sync/restore, complete a valid official re-test exactly once, and create the next block without losing trust?

Stage 5H must test the system as a connected lifecycle rather than as isolated helpers.

## Stage 5H primary objectives

1. Verify the complete lifecycle:

```text
complete official baseline
-> current MovementBlock
-> week 1 A/B/C
-> weeks 2–4
-> training complete
-> official re-test timing
-> valid official re-test
-> one report
-> one completed block
-> one next block
```

2. Verify this lifecycle across:

- strength focus;
- balance focus;
- mobility focus;
- clear focus;
- exact-tie fallback/preserved focus;
- near-tie fallback/preserved focus.

3. Stress equipment, readiness, discomfort, short-session, supporting-session, restart, and stale-plan interactions.

4. Stress malformed, missing, duplicate, wrong-source, future, pre-block, and legacy evidence.

5. Stress offline completion, repeated callbacks, sync retries, restore ordering, stale remote state, and app restarts.

6. Prove determinism for equal explicit inputs.

7. Prove event/state growth remains bounded and serializable across multiple blocks.

8. Verify user-facing states never overclaim:

- session completion;
- week completion;
- progression;
- re-test due;
- block completion;
- next-block creation.

9. Verify every Stage 5 production consumer uses the authoritative contracts created in Stages 5A–5G.

10. Remediate only defects proven by new tests.

11. Decide whether Stage 5 software is ready for a controlled beta, while keeping overall beta release separately gated by:

- Stage 3D-B;
- remaining Stage 4 remediation;
- physical-device validation.

## Non-negotiable boundaries

This task must not:

- change the approved four-week policy;
- change Stage 5A/5B credit rules;
- change Stage 5D progression thresholds;
- change Stage 5E readiness/discomfort policy;
- change Stage 5F canonical-equipment policy;
- change exercise catalogue content;
- change scoring or norm tables;
- change Check-Up measurement/scoring;
- change exact/near-tie focus policy;
- redesign the UI;
- install dependencies;
- alter lockfiles;
- stage, commit, create a branch, or push.

Production changes are permitted only when an adversarial/integration test demonstrates a real contract violation.

## Working-tree safety

Before analysis or editing, run:

```bash
git status --short --untracked-files=all
git diff --name-only
git diff --stat
```

Record the exact outputs in the verification report.

Rules:

1. Treat all existing modified and untracked files as user-owned.

2. Inspect current diffs in every file Stage 5H may touch.

3. Do not revert, overwrite, reformat, move, or delete unrelated work.

4. Do not edit prior audit/remediation reports.

5. Do not use destructive Git commands.

6. Do not install packages or alter lockfiles.

7. Do not stage, commit, branch, or push.

8. If unrelated files change during the task:
   - record them;
   - do not overwrite them;
   - continue only when task-owned edits remain safe and unambiguous;
   - otherwise stop production mutation and report the conflict.

## Stage 5H implementation philosophy

Prefer:

- test-only scenario builders;
- pure fixtures;
- deterministic seeded scenario generation;
- table-driven cases;
- integration tests across real production helpers;
- state-machine/model tests;
- serialization/sync/restore round-trips.

Avoid:

- production debug switches;
- network dependence;
- real wall-clock sleeps;
- random unseeded tests;
- giant brittle snapshots;
- mocking every layer;
- tests that merely assert a helper was called.

A temporary diagnostic script may be created only outside the repository, such as under `/tmp`.

## Step 1: Reconstruct the complete current lifecycle

Before adding tests, inspect at minimum:

- App.tsx
- src/haleFlow/blockSchedule.ts
- src/haleFlow/sessionPlanning.ts
- src/haleFlow/mainPlanEvents.ts
- src/haleFlow/sessionWorkEvidence.ts
- src/haleFlow/focusStimulusEvidence.ts
- src/haleFlow/progressionEvidence.ts
- src/haleFlow/appLifecycle.ts
- src/haleFlow/blockAutomation.ts
- src/haleFlow/checkupTransition.ts
- src/haleFlow/assessmentEligibility.ts
- src/haleFlow/assessments.ts
- src/haleFlow/reports.ts
- src/haleFlow/planViewModel.ts
- src/haleFlow/progressViewModel.ts
- src/profile/equipment.ts
- src/training/dailyTrainingContext.ts
- src/training/equipmentSafety.ts
- src/training/workoutGeneration.ts
- src/training/dynamicState.ts
- src/training/serialize.ts
- src/adherence/adherenceService.ts
- src/adherence/milestoneService.ts
- src/adherence/dateUtils.ts
- relevant screens/view models
- all profile, block, session, report, training-state, and restore sync services
- every Stage 5A–5G test.

Produce one updated Mermaid sequence diagram:

```text
official baseline
-> block creation
-> planning
-> preview
-> session execution
-> completion evidence
-> schedule credit
-> progression feedback
-> persistence/sync
-> restore
-> next session/week
-> official re-test
-> report
-> next block
```

Document every authoritative identity used:

- Check-Up id;
- score snapshot id/version;
- MovementAssessment id;
- MovementBlock id;
- template id;
- plan/session id;
- completion id;
- planned date key;
- schedule-credit id;
- progression event id;
- report id;
- next-block id.

Do not edit production code until this architecture trace is complete.

## Step 2: Build a reusable Stage 5H test harness

Create test-only builders/helpers for:

- complete official baseline;
- clear/exact/near focus snapshots;
- MovementBlock;
- canonical equipment profiles;
- daily readiness/discomfort contexts;
- generated plans;
- session results;
- completion feedback;
- schedule-credit events;
- progression state;
- local/remote serialized state;
- official re-test;
- block report and next block.

Requirements:

- deterministic ids;
- deterministic date keys;
- no `new Date()` hidden in fixtures;
- explicit source/block/template identity;
- easy override of one field;
- valid defaults;
- ability to create deliberately malformed variants;
- no production exports solely for tests unless a real production seam is required.

Prefer a test helper file under an existing `__tests__/helpers` convention or a Stage 5H test module.

## Step 3: Define an executable lifecycle model

Create a test-only reference model for the core lifecycle.

The model should track:

- active block id;
- focus;
- week;
- due template;
- schedule credits;
- used credit dates;
- lapse state;
- equipment fingerprint;
- progression event ids;
- ladder levels;
- training-complete state;
- re-test not-before;
- report/next-block transition count.

The model must encode the locked Stage 5 policies, not duplicate implementation quirks.

Use it to compare production outputs after each operation.

Do not make the reference model depend on the production scheduler’s internal functions; use shared constants only when safe.

## Step 4: Full baseline-to-next-block happy paths

Run complete end-to-end deterministic lifecycles for:

1. Strength clear focus.
2. Balance clear focus.
3. Mobility clear focus.
4. Exact-tie baseline using deterministic fallback.
5. Exact-tie re-test preserving current focus.
6. Near-tie baseline using interim fallback.
7. Near-tie re-test preserving current focus.

For each:

- create official baseline;
- create exactly one MovementBlock;
- complete 12 schedule-credited A/B/C sessions across four valid weeks;
- provide feedback;
- apply progression idempotently;
- pass the timing boundary;
- complete official re-test;
- create exactly one report;
- complete exactly one current block;
- create exactly one next block;
- verify next-block focus policy;
- serialize/sync/restore at multiple points;
- ensure the final state is equivalent.

Assert no legacy planner/progression authority appears.

## Step 5: Pairwise adversarial scenario matrix

Do not run the full Cartesian product.

Create a documented pairwise/equivalence-class matrix spanning:

### Focus

- strength;
- balance;
- mobility.

### Focus origin

- clear;
- exact tie;
- near tie.

### Week/template

- week 1 A;
- week 2 B;
- week 4 C.

### Equipment

- explicit none;
- chair + wall;
- band without anchor;
- band + anchor;
- stairs + support;
- floor space;
- full kit;
- confirmation required;
- stale plan after equipment change.

### Daily context

- ready;
- cautious;
- short on time;
- knee discomfort;
- hip/back discomfort;
- shoulder discomfort;
- ankle/foot discomfort;
- multiple discomfort areas;
- malformed context.

### Plan result

- ready;
- supporting session;
- unavailable;
- week complete waiting;
- restart;
- training complete waiting;
- re-test due.

### Result evidence

- full primary completion;
- partial with one primary;
- supporting-only;
- fallback-only;
- all skipped;
- missing result;
- duplicate result;
- malformed result.

### Persistence condition

- clean local;
- app restart before feedback;
- app restart after feedback;
- offline completion;
- sync retry;
- duplicate local/remote row;
- stale remote training state;
- reordered restore;
- malformed remote field.

Ensure every value participates in at least one high-risk interaction.

Include a coverage table in the report.

## Step 6: Deterministic seeded property-style scenario generation

Without adding a dependency, create a small deterministic seeded generator in tests.

Generate at least 500 valid/adversarial scenario cases across bounded enums.

For each case, assert universal invariants such as:

- no throw;
- deterministic output;
- no unknown exercise id;
- no equipment/safety violation;
- no focus credit without completed primary work;
- no schedule credit without focus credit;
- no progression without schedule credit;
- no duplicate progression event;
- no more than one schedule credit per date;
- no official re-test before training/timing gate;
- no legacy current plan;
- JSON serialization succeeds;
- restore does not promote invalid metadata.

Use a fixed seed and print the seed/scenario index on failure.

Do not use unbounded fuzzing or wall-clock-based randomness.

## Step 7: Invalid-state mutation testing

For each authoritative object, create one-field corruptions.

### MovementBlock

- missing id;
- wrong source assessment;
- unsupported focus;
- invalid start date;
- stale completed flag;
- two active blocks.

### Plan

- wrong block id;
- wrong template;
- missing equipment snapshot;
- stale equipment fingerprint;
- unknown exercise id;
- duplicate exercise id;
- missing stimulus metadata;
- contradictory main-plan credit potential;
- invalid planned date.

### Completion

- wrong block;
- wrong template;
- missing focus evidence;
- `mainPlanCredit: true` with negative focus evidence;
- zero work;
- duplicate id;
- future/pre-block date;
- same-day second credit;
- invalid source.

### Progression

- wrong ladder;
- duplicate event id;
- missing feedback;
- fallback role;
- malformed level;
- stale remote applied-event set.

### Official re-test

- incomplete;
- manual/quick;
- before due date;
- source mismatch;
- duplicate callback;
- same-date final session;
- stale completed block flag.

Required:

- fail closed;
- no partial mutation;
- unrelated valid state remains usable;
- diagnostics are stable.

## Step 8: Crash/interruption boundary matrix

Simulate interruption at these boundaries:

1. After plan generation before preview.
2. After preview before session start.
3. After session start before first result.
4. Mid-session after partial results.
5. After session result before local completion save.
6. After local completion before adherence save.
7. After main-plan/schedule credit before feedback.
8. After feedback before progression save.
9. After progression save before backend sync.
10. After backend session sync before training-state sync.
11. During restore before profile equipment resolution.
12. During restore after block but before completions.
13. During official re-test before report upsert.
14. After report upsert before block completion.
15. After block completion before next-block creation.

Use existing pure/service boundaries rather than simulating actual process termination.

Required:

- retries are idempotent;
- no duplicate credit/progression/report/block;
- incomplete work does not become completed;
- state can recover or returns a typed recovery state;
- no legacy fallback;
- no history loss.

## Step 9: Offline and sync/retry verification

Create deterministic offline scenarios:

- complete session offline;
- submit feedback offline;
- app restart offline;
- complete another non-credit attempt;
- reconnect;
- session sync retry;
- training-state sync retry;
- profile sync arrives before/after training state;
- remote contains stale equipment;
- remote contains stale schedule cache;
- remote contains duplicate completion;
- remote contains older ladder progress;
- remote contains malformed metadata.

Assert:

- one authoritative local credit;
- no replay;
- no remote promotion;
- canonical equipment wins;
- schedule recomputes;
- progression event ids prevent replay;
- remote order does not matter;
- final state is deterministic.

Do not require real network access.

## Step 10: Account/user scoping within Stage 5 state

Re-verify that training state, block state, completions, summaries, and reports are scoped to the authenticated user in current backend paths.

Test or inspect:

- sign out;
- sign into another account;
- restore fresh user;
- stale local state from previous user;
- backend rows with another user id;
- sync callbacks after sign-out.

Requirements:

- another user’s current block/equipment/completions cannot steer planning;
- another user’s remote row is ignored by backend/RLS/service scoping;
- pending callbacks cannot mutate the new user’s state;
- local user-switch handling follows the current app’s authoritative account-isolation policy.

Do not expand into a full security audit.

If a previously known sign-out/local-data issue remains unresolved outside Stage 5, classify it explicitly and decide whether it blocks Stage 5 software sign-off.

## Step 11: Multi-block and long-horizon simulation

Simulate at least:

- 3 complete consecutive blocks;
- 36 schedule-credited sessions;
- 3 official re-tests;
- 3 reports;
- 3 next-block transitions.

Also simulate a one-year bounded history shape where practical.

Verify:

- ids remain unique/stable;
- block numbers increment once;
- old blocks remain completed;
- one active block remains;
- applied progression event ids remain bounded/normalized;
- generated summaries/history do not cause duplicate rotation;
- serialization payload remains finite/JSON-safe;
- restore time and output remain reasonable;
- old equipment snapshots remain immutable;
- old score snapshots remain frozen;
- current planning uses current profile/progression only.

Do not set brittle millisecond performance gates.

Record approximate serialized payload sizes for diagnostic awareness, not pass/fail unless a clear repository limit exists.

## Step 12: User-visible truthfulness matrix

At view-model/screen-helper level, verify copy/state for:

- normal ready session;
- adjusted creditable session;
- supporting/non-credit session;
- unavailable planning;
- zero-work attempt;
- supporting-only completion;
- same-day second session;
- week complete waiting;
- resume gently;
- restart recommended;
- restart credited;
- training complete waiting;
- re-test due;
- invalid/early official re-test;
- completed block;
- next block ready.

Requirements:

- no false “completed” claim;
- no false “progressed” claim;
- no false week/block completion;
- no false re-test due;
- no shame/lost-streak language;
- no medical claim;
- no technical internal reason code shown;
- Today/Plan/Progress agree.

## Step 13: Cross-consumer consistency assertions

For one identical state, compare outputs from:

- scheduler;
- session planner;
- app lifecycle;
- Today view model;
- Plan view model;
- Progress view model;
- milestone service;
- progression eligibility;
- official re-test gate;
- backend sync payload.

Assert agreement on:

- active block;
- current week;
- next template;
- schedule credits;
- main-plan credit;
- progression eligibility;
- re-test due;
- block completion;
- equipment fingerprint;
- focus.

Add explicit tests for contradictory stale cached fields.

## Step 14: Serialization and schema compatibility

Re-verify all current local schemas and compact remote shapes.

Cover:

- oldest supported local training schemas;
- missing new Stage 5 fields;
- legacy sessions;
- legacy progression;
- missing equipment status;
- missing focus evidence;
- missing schedule credit;
- missing progression policy;
- missing applied event ids;
- malformed current fields;
- future unsupported schema version.

Required:

- old data remains readable where promised;
- no old data is silently promoted to credit/current authority;
- unsupported future data fails closed;
- no read-time historical rewrite;
- current round-trip remains semantically exact.

## Step 15: Privacy and payload safety verification

Inspect production sync/observability payloads touched by Stage 5.

Assert absence of:

- raw video;
- pose frames;
- landmarks;
- free-text symptoms;
- raw health notes;
- auth tokens;
- full unsanitized objects.

Assert only bounded enum/id/date/metric metadata is included.

This is a narrow Stage 5 payload check, not a broad privacy audit.

## Step 16: Test false-confidence review

Review existing Stage 5A–5G tests and identify:

- tests that mock away the key boundary;
- tests that assert internal helper output but not mutation;
- fixtures that bypass current metadata requirements;
- stale tests that no longer represent production;
- duplicated tests with weak assertions;
- missing integration seams.

Add focused tests where gaps materially affect Stage 5 sign-off.

Do not rewrite the entire test suite for style.

## Step 17: Verify all original Stage 5 findings remain closed

Re-evaluate F5-001 through F5-009.

For each provide:

| Finding | Original risk | Current status | Adversarial proof | Regression test | Remaining caveat |

Do not rely only on prior reports.

A finding is closed only if current code and Stage 5H tests prove it.

## Step 18: Stage 5 invariant closure

Re-evaluate the original Stage 5 invariant register and add new invariants discovered later.

The final Stage 5H report must evaluate at least 150 invariants covering:

- block creation;
- planning;
- A/B/C rotation;
- equipment;
- readiness/discomfort;
- stimulus roles;
- work/focus/schedule credit;
- progression;
- lapse/restart;
- re-test;
- persistence;
- sync/restore;
- idempotency;
- UI truthfulness;
- legacy containment;
- date/time;
- privacy/payload safety.

Use:

| ID | Invariant | Status | Test/evidence | Residual risk |

Statuses:

- Holds.
- Fails.
- Holds under explicit preconditions.
- Deferred outside Stage 5.
- Not provable.
- Physical-device validation required.

## Step 19: New defect standard

Every newly proven defect must include:

1. Finding id.
2. Priority:
   - P0;
   - P1;
   - P2;
   - P3.
3. Confidence.
4. Exact trigger.
5. Runtime chain.
6. Minimal state/input.
7. Actual behavior.
8. Expected behavior.
9. Violated invariant.
10. User/trust impact.
11. Existing test gap.
12. Production remediation.
13. Regression test.
14. Whether it blocks Stage 5 software readiness.

Do not make broad changes from speculative risks.

## Step 20: Production-code restraint

Only modify production code after a failing adversarial/integration test proves a violation.

Allowed narrow fixes may involve:

- identity validation;
- state transition idempotency;
- serialization/restore normalization;
- consumer consistency;
- fail-closed checks;
- copy/state mapping;
- observability.

Do not change approved product policies.

For every production change:

- preserve the failing test before the fix;
- document the exact invariant;
- rerun targeted and full validation.

## Required Stage 5H test suites

Create one or more clearly named test files, such as:

- `src/haleFlow/__tests__/stage5hLifecycle.integration.test.ts`
- `src/haleFlow/__tests__/stage5hAdversarial.test.ts`
- `src/services/backend/__tests__/stage5hRestoreReplay.test.ts`

Adapt to repository conventions.

At minimum cover:

### A. Full lifecycle

- baseline -> block -> 12 sessions -> retest -> next block;
- strength/balance/mobility;
- clear/exact/near focus.

### B. Pairwise matrix

- documented coverage table.

### C. Seeded property scenarios

- at least 500 deterministic cases.

### D. Invalid-state mutations

- block/plan/completion/progression/retest.

### E. Crash/retry boundaries

- local, feedback, sync, report, next-block.

### F. Offline/restore

- duplicate/reorder/stale/malformed.

### G. Long horizon

- multiple blocks and bounded state.

### H. UI truthfulness

- Today/Plan/Progress/completion/recovery.

### I. Schema compatibility

- old/current/future fail-closed.

### J. Original findings

- F5-001 through F5-009 closure.

## Validation commands

Run a targeted Stage 5H command covering:

- new Stage 5H tests;
- blockSchedule;
- sessionPlanning;
- mainPlanEvents;
- sessionWorkEvidence;
- focusStimulusEvidence;
- progressionEvidence;
- appLifecycle;
- blockAutomation;
- profile equipment;
- daily training context;
- workout generation;
- adherence/milestones;
- local serialization;
- profile/session/training/block/report sync;
- restore;
- official re-test transition;
- Today/Plan/Progress view models.

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
- any new warning;
- whether validation changed files.

The Stage 5G.1 baseline was:

- 94 suites;
- 745 tests.

Verify the current baseline rather than assuming it.

## Manual source verification after tests

Retrace these production paths after all tests pass:

### Full first block

```text
official baseline
-> block
-> schedule
-> plan
-> credit
-> progression
-> week transitions
-> re-test
-> report
-> next block
```

### Supporting/non-credit path

Confirm no schedule/progression advancement.

### Equipment change

Confirm stale plan invalidation and replan.

### Lapse/restart

Confirm due template, hold-only progression, one credit.

### Offline/restore

Confirm no duplicate/replay/promotion.

### Official re-test retry

Confirm one report/block transition/next block.

### User switch

Confirm state cannot cross users under current architecture.

## Verification report

Create exactly one new report:

```text
docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5H.md
```

Do not edit prior reports.

The report must contain:

1. Scope.
2. Stage 5H purpose.
3. Initial Git status.
4. Current end-to-end architecture.
5. Identity map.
6. Test harness/reference model.
7. Full lifecycle results.
8. Pairwise scenario coverage.
9. Seeded property-test results.
10. Invalid-state mutation results.
11. Crash/retry boundary results.
12. Offline/sync/restore results.
13. Account/user scoping result.
14. Long-horizon simulation.
15. UI truthfulness matrix.
16. Cross-consumer consistency.
17. Schema compatibility.
18. Privacy/payload verification.
19. Original F5-001–F5-009 closure table.
20. Final invariant register with at least 150 invariants.
21. Newly found defects.
22. Production files changed, if any.
23. Exact reason for each production change.
24. Tests added/changed.
25. Exact targeted validation.
26. Exact full validation.
27. App typecheck.
28. Website typecheck.
29. Expo config.
30. `git diff --check`.
31. Warning inventory.
32. Stage 1–5G regression status.
33. Residual Stage 5 risks.
34. Stage 5 software-readiness decision.
35. Remaining non-Stage-5 beta blockers.
36. Initial and final Git status.
37. Complete files-changed inventory.
38. Concurrent external changes.
39. Confirmation that no package install, lockfile change, commit, staging, branch, or push occurred.

## Required invariant outcomes

Stage 5H must prove, at minimum:

1. One valid official baseline creates one current block.
2. Invalid/manual/partial baseline cannot create a block.
3. Current planner never uses legacy fallback.
4. Valid current plan uses canonical equipment.
5. Stale equipment plan cannot start.
6. Safety-excluded exercise cannot reappear.
7. Supporting-only plan is non-credit.
8. Zero-work is non-credit.
9. Primary-focus work is required.
10. Only schedule-credited main-plan work progresses.
11. One date yields at most one schedule credit.
12. One ladder mutates at most once per credited completion.
13. Duplicate feedback/sync/restore does not replay progression.
14. Four weeks require A/B/C and seven-day pacing.
15. Missed sessions extend rather than skip.
16. Restart targets the due template and is hold-only.
17. Calendar alone cannot complete training.
18. Official re-test waits for training and timing gates.
19. Official re-test transition is idempotent.
20. One report and one next block are created.
21. Restore produces equivalent lifecycle state.
22. Stale remote equipment/schedule/progression cannot override authority.
23. Historical legacy records remain readable but non-authoritative.
24. Equal explicit inputs produce equal plans/state.
25. Today/Plan/Progress agree.
26. User-visible copy never overclaims.
27. Sync/observability payloads remain sanitized.
28. Multi-block state remains bounded and deterministic.
29. Original F5-001–F5-009 remain closed.
30. No new P0/P1 software defect remains.

## Acceptance criteria

Do not mark Stage 5H verified unless:

1. Full lifecycle tests pass for all three domains.

2. Clear/exact/near focus lifecycles pass.

3. Pairwise matrix covers all required categories.

4. At least 500 seeded scenarios pass deterministically.

5. Invalid-state mutation tests fail closed.

6. Crash/retry/offline/restore tests prove idempotency.

7. Long-horizon multi-block simulation passes.

8. UI truthfulness and cross-consumer consistency pass.

9. Original F5-001–F5-009 are re-proven closed.

10. At least 150 invariants are evaluated.

11. No unresolved P0/P1 Stage 5 defect remains.

12. Any accepted P2/P3 residual risk is explicitly documented and does not compromise user trust/safety.

13. Stage 5A–5G regressions pass.

14. Targeted tests pass.

15. Full suite passes.

16. App typecheck passes.

17. Website typecheck passes.

18. Expo config passes.

19. `git diff --check` passes.

20. No new warning is introduced without explanation.

21. No unrelated user work is reverted or overwritten.

22. No package install or lockfile change occurs.

23. No commit, staging, branch, or push occurs.

## Stage decisions

At the end of the report, state exactly one:

- `STAGE 5H VERIFIED`
- `STAGE 5H VERIFICATION BLOCKED`

Also state exactly one:

- `STAGE 5 REMEDIATION COMPLETE`
- `STAGE 5 REMEDIATION STILL REQUIRED`

Also state exactly one:

- `DYNAMIC WORKOUT GENERATION SOFTWARE-READY FOR CONTROLLED BETA`
- `DYNAMIC WORKOUT GENERATION SOFTWARE-BLOCKED`

Use `DYNAMIC WORKOUT GENERATION SOFTWARE-READY FOR CONTROLLED BETA` only if:

- no P0/P1 Stage 5 software defect remains;
- the full lifecycle is proven;
- all release gates are green;
- all original Stage 5 findings remain closed;
- residual P2/P3 issues do not undermine safety, credit honesty, progression, restore, or trust.

Regardless of Stage 5 software readiness, also state:

- `OVERALL BETA RELEASE STILL BLOCKED`
- `STAGE 4 REMEDIATION STILL REQUIRED`
- `STAGE 3D-B REQUIRED`
- `BETA DEVICE VALIDATION REQUIRED`

Stage 5H must not declare Hale generally beta-ready while those non-Stage-5 gates remain.

## Final Codex response

Return a concise summary containing:

- Verification report path.
- Whether production code changed.
- Exact reason for each production change.
- Full lifecycle result.
- Domains/focus-origin coverage.
- Pairwise scenario count.
- Seeded scenario count and seed.
- Invalid-state result.
- Crash/retry/offline/restore result.
- Account/user scoping result.
- Long-horizon result.
- UI truthfulness result.
- F5-001–F5-009 closure result.
- Number of invariants evaluated and failed.
- New finding counts by P0/P1/P2/P3.
- Targeted validation result.
- Full-suite validation result.
- App typecheck.
- Website typecheck.
- Expo config.
- `git diff --check`.
- Residual Stage 5 risks.
- `STAGE 5H VERIFIED` or blocked.
- `STAGE 5 REMEDIATION COMPLETE` or still required.
- `DYNAMIC WORKOUT GENERATION SOFTWARE-READY FOR CONTROLLED BETA` or blocked.
- `OVERALL BETA RELEASE STILL BLOCKED`.
- `STAGE 4 REMEDIATION STILL REQUIRED`.
- `STAGE 3D-B REQUIRED`.
- `BETA DEVICE VALIDATION REQUIRED`.
- Initial and final Git status.
- Complete files-changed inventory.
- Any concurrent external changes.
- Confirmation that no package install, lockfile change, commit, staging, branch, or push occurred.
