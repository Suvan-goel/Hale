You are carrying out Stage 5B.1 of Hale’s production-readiness work:

PRIMARY-FOCUS CREDIT VERIFICATION, SHORT-SESSION AND PAIN/READINESS PROOF, PERSISTENCE FAIL-CLOSED TESTING, AND STAGE 5B SIGN-OFF

This is a narrow verification-and-remediation pass following Stage 5B.

Do not begin Stage 5C, Stage 5D, Stage 5E, Stage 5F, Stage 5G, Stage 5H, Stage 3D-B, further Stage 4 remediation, or beta-device validation in this task.

The default expectation is that this task will primarily add authoritative tests and a complete verification report.

Modify production code only when a new test proves that the current Stage 5B implementation violates a locked contract.

## Required prior reading

Read these documents in full before changing anything:

- docs/audits/HALE_LOGIC_AUDIT_STAGE_0.md
- docs/audits/HALE_LOGIC_AUDIT_STAGE_1.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_1A.md
- docs/audits/HALE_LOGIC_AUDIT_STAGE_2.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_2A.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_2A_1.md
- docs/audits/HALE_LOGIC_AUDIT_STAGE_3.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3A.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3B.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3C.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_3C_1.md
- docs/audits/HALE_LOGIC_AUDIT_STAGE_3D.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_A.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_C.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_D.md
- docs/audits/HALE_LOGIC_AUDIT_STAGE_4.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4A.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4B.md
- docs/audits/HALE_LOGIC_AUDIT_STAGE_5.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5A.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5B.md

Treat the current working tree as the source of truth. Re-verify every relevant path because report line numbers and implementation details may no longer be exact.

## Why Stage 5B.1 is required

Stage 5B reports that it implemented:

- `focusStimulusEvidence.ts`;
- planned primary-focus eligibility;
- completed primary-focus evidence;
- a main-plan credit gate requiring:
  - Stage 5A valid main-plan identity,
  - Stage 5A explicit completed work,
  - at least one completed `primary` exercise,
  - intended-domain equality with the active MovementBlock focus;
- non-credit handling for supporting-only, fallback-only, cross-domain-only, missing-metadata, and legacy-fallback sessions;
- preview and completion copy that distinguishes useful supporting work from plan-advancing work;
- local and remote metadata for focus stimulus evidence.

The report says the full suite passed:

- 87 suites;
- 628 tests;
- typecheck passed;
- Expo config passed.

However, the report does not provide enough evidence to sign off every Stage 5B acceptance condition.

Missing or insufficiently explicit proof includes:

1. No recorded `git diff --check` result.

2. No explicit final stage decisions:
   - `STAGE 5B COMPLETE` or blocked;
   - `STAGE 5C REQUIRED`;
   - `STAGE 5D REQUIRED`;
   - beta-generation status.

3. No exact final Git status/diff inventory.

4. No authoritative end-to-end short-session proof:
   - short plan contains primary focus and completes it;
   - short plan contains primary but skips it;
   - short plan contains only supporting/fallback work.

5. No authoritative equipment/readiness/pain scenario matrix proving that removal of all primary-focus exercises makes the session visibly partial/non-credit.

6. No explicit A/B/C and week-completion regression proving supporting-only and fallback-only attempts remain in history but never advance rotation.

7. No explicit backend restore test proving a supporting-only or missing-metadata historical attempt cannot be promoted to credited main-plan completion.

8. No explicit direct proof that legacy fallback remains non-credit even if its exercises look like primary focus work.

9. No explicit copy/view-model proof distinguishing:
   - zero-work;
   - supporting-only work;
   - fallback-only work;
   - credited primary-focus work.

10. No explicit verification that a valid partial session with one completed primary focus exercise still receives credit.

11. No explicit verification that exact-tie and near-tie concrete MovementBlock focus remains authoritative and is not recomputed during completion.

12. No explicit statement about whether non-credit supporting/fallback work currently affects individual ladder progression; this must remain deferred to Stage 5D.

Stage 5B.1 must verify these contracts before Stage 5C begins.

## Locked Stage 5B product rule

Do not change this rule during verification:

> A genuine block-generated A/B/C main-plan session advances the plan only when the user explicitly completes at least one planned exercise whose structured `stimulusRole` is `primary` and whose `intendedDomain` exactly matches the active MovementBlock focus domain.

Supporting-, fallback-, maintenance-, cross-domain-, skipped-, invalid-, malformed-, missing-metadata-, and legacy-fallback-only work is non-credit for:

- A/B/C rotation;
- week completion;
- main-plan adherence;
- milestones;
- block completion;
- re-test due state.

A valid partial session with at least one completed primary-focus exercise may still receive credit, even if other prescribed items are skipped or missing.

Do not add a percentage-of-dose threshold in this task.

## Locked boundaries carried from earlier stages

### Stage 5A

- Only explicit active-block, block-generated, valid-template main-plan events can count.
- Non-training events do not affect rotation.
- Week completion requires credited A/B/C.
- Zero-work/all-skipped/empty/malformed attempts do not count.
- Missing results do not progress.
- Explicit planning date is authoritative.
- Duplicate credit is deduped.

### Stage 4A/4B

- Floor, stair/support, balance support, band, and door-anchor safety gates remain.
- Every generated slot has structured stimulus semantics.
- Upper pull without a band is not silently replaced by shoulder mobility.
- Mobility is a collection, not a fake linear progression.
- Static and dynamic balance semantics remain distinct.

### Stage 3D

- The concrete active MovementBlock focus is authoritative.
- Exact-tie and near-tie policies are already resolved into that concrete focus.
- Completion logic must not rescore or recompute focus.

### Stage 3C

- Historical snapshots are frozen.
- No silent historical rescoring.
- Source identity mismatches fail closed.

## Primary objectives

Stage 5B.1 must:

1. Reconstruct and verify the actual Stage 5B architecture.

2. Prove planned focus eligibility works for strength, balance, and mobility.

3. Prove completed focus evidence fails closed for supporting/fallback/wrong-domain/missing/malformed/duplicate evidence.

4. Prove short-session credit behavior.

5. Prove equipment/readiness/pain scenarios cannot silently advance the plan without primary focus work.

6. Prove supporting-only/fallback-only attempts do not advance A/B/C or week completion.

7. Prove preview and completion copy distinguish all relevant non-credit states.

8. Prove serialization, backend sync, and restore preserve non-credit state and cannot promote legacy/missing metadata.

9. Prove one valid primary-focus completion still preserves Stage 5B’s intended partial-credit behavior.

10. Produce complete validation and Git evidence.

11. Determine whether Stage 5C is unblocked.

## Scope boundary

This task may change:

- Stage 5B focus-stimulus helper(s), only if a failing test exposes a defect;
- plan metadata normalization;
- completion credit integration;
- preview/completion state derivation;
- serialization/sync/restore normalization;
- narrow copy required to align verified states;
- tests;
- the Stage 5B.1 verification report.

This task must not change:

- exercise selection;
- Stage 4 catalogue metadata;
- Stage 5A main-plan classification;
- percentage/dose thresholds;
- Stage 5C legacy fallback policy;
- Stage 5D progression-authority policy;
- Stage 5E pain/readiness strategy;
- Stage 5F equipment canonicalization;
- Stage 5G timing/lapse policy;
- scoring;
- norms;
- Check-Up logic;
- score snapshots;
- focus-selection policy;
- broad UI design;
- backend schema;
- dependencies;
- assets.

Do not perform opportunistic refactors.

## Working-tree safety

Before analysis or editing:

1. Run:

   `git status --short --untracked-files=all`

   `git diff --name-only`

   `git diff --stat`

2. Record exact outputs in the verification report.

3. Treat all existing modifications and untracked files as user-owned.

4. Inspect all current diffs in files Stage 5B.1 may touch.

5. Do not revert, overwrite, reformat, move, or delete unrelated work.

6. Do not edit prior reports.

7. Do not use destructive Git commands.

8. Do not install packages.

9. Do not stage, commit, create a branch, or push.

10. If unrelated files change during the task:
    - record them;
    - do not overwrite them;
    - continue only when task-owned files remain safe and unambiguous;
    - otherwise stop production mutation and report the conflict.

## Step 1: Reconstruct the current Stage 5B architecture

Inspect at minimum:

- App.tsx
- src/haleFlow/focusStimulusEvidence.ts
- src/haleFlow/mainPlanEvents.ts
- src/haleFlow/sessionWorkEvidence.ts
- src/haleFlow/sessionPlanning.ts
- src/haleFlow/types.ts
- src/haleFlow/index.ts
- src/training/workoutGeneration.ts
- src/training/dynamicState.ts
- src/training/serialize.ts
- src/training/equipmentSafety.ts
- src/adherence/types.ts
- src/adherence/adherenceService.ts
- src/adherence/screens/SessionCompletionScreen.tsx
- src/screens/SessionPreviewScreen.tsx
- src/screens/TrainingSessionScreen.tsx
- src/services/backend/sessionSyncService.ts
- src/services/backend/trainingStateSyncService.ts
- src/services/backend/restoreService.ts
- src/services/backend/blockReportSyncService.ts
- every Stage 5A/5B test.

Document:

- exact planned-focus evidence shape;
- exact completed-focus evidence shape;
- exact reason/status unions;
- exact metadata stamped into `HaleSessionPlan`;
- exact completion-orchestration sequence;
- exact point at which `mainPlanCredit` becomes true/false;
- exact non-credit summary shape;
- exact preview state;
- exact completion state;
- exact local serialization shape;
- exact remote JSON shape;
- exact restore precedence;
- exact use of active block focus;
- exact current progression behavior for non-credit supporting/fallback work.

Do not modify code until this trace is complete.

## Step 2: Verify planned focus eligibility directly

Use the real production helper.

Cover:

1. Strength block with primary strength exercise.

2. Balance block with primary balance exercise.

3. Mobility block with primary mobility exercise.

4. Same-domain exercise marked supporting.

5. Same-domain exercise marked fallback.

6. Cross-domain exercise marked primary.

7. Primary exercise intended for a different domain.

8. Focus slot skipped, supporting work present.

9. Focus slot skipped, fallback work present.

10. Missing generated-exercise metadata.

11. Missing `slotStimulus`.

12. Contradictory `slotStimulus` and exercise metadata.

13. Invalid exercise id.

14. Extra session.

15. Manual ladder practice.

16. Legacy fallback.

17. Exact-tie block whose effective concrete focus is strength/balance/mobility.

18. Near-tie block whose preserved concrete focus is strength/balance/mobility.

Required:

- only structured primary intended-domain match is eligible;
- no inference from name/ladder/display domain;
- missing/contradictory metadata fails closed;
- extra/manual/legacy are not main-plan eligible;
- helper is pure and deterministic;
- input is not mutated.

## Step 3: Verify completed focus evidence directly

Use the real Stage 5A work-evidence helper and Stage 5B completed-focus helper.

Cover:

1. One valid primary focus exercise completed.

2. Primary focus completed; all other items skipped.

3. Primary focus completed; all other items missing.

4. Primary focus skipped; supporting exercise completed.

5. Primary focus missing; fallback exercise completed.

6. Primary focus malformed; supporting completed.

7. Wrong-domain primary completed.

8. Cross-domain supporting exercise completed.

9. Duplicate result rows for the primary exercise.

10. Unmatched result marked completed.

11. Null session result.

12. Empty result items.

13. All skipped.

14. One valid primary completed while another primary row is malformed.

15. Result order reversed.

Required:

- explicit valid primary completion is sufficient under current partial rule;
- supporting/fallback/wrong-domain work never satisfies focus credit;
- duplicate/missing/malformed/unmatched evidence fails closed;
- zero-work remains Stage 5A no credit;
- helpers are deterministic and non-mutating.

## Step 4: Verify the authoritative completion-credit boundary

Exercise the smallest authoritative completion orchestration layer available.

Prove the actual credit equation:

```text
Stage 5A valid main-plan event
+ Stage 5A completed work
+ Stage 5B planned focus eligibility
+ Stage 5B completed primary-focus evidence
+ non-duplicate identity
= credited main-plan completion
```

Cases:

- valid A with primary work -> credited;
- A with supporting-only -> non-credit;
- A with fallback-only -> non-credit;
- A with wrong-domain primary -> non-credit;
- A with no work -> non-credit;
- extra/manual with primary-looking work -> non-credit;
- legacy fallback with primary-looking work -> non-credit;
- wrong block -> non-credit;
- duplicate credited completion -> no second mutation;
- one valid primary in otherwise partial result -> credited.

Assert observable mutations/non-mutations:

- adherence completion;
- main-plan credit;
- A/B/C coverage;
- block progress;
- milestones;
- re-test due state;
- session sync;
- generated summary status.

Do not rely only on helper output.

## Step 5: Verify A/B/C rotation and week completion

Construct authoritative sequences.

### Session A

- supporting-only A attempt -> A remains due;
- fallback-only A attempt -> A remains due;
- zero-work A attempt -> A remains due;
- credited primary-focus A -> B due;
- supporting-only A then credited A retry -> B due exactly once;
- duplicate credited A retry -> still B due.

### Session B

- credited A + supporting-only B -> B remains due;
- credited A + credited B -> C due.

### Session C

- credited A/B + fallback-only C -> C remains due;
- credited A/B/C -> week complete.

Additional:

- three supporting-only attempts cannot complete week;
- three fallback-only attempts cannot complete week;
- mixed non-credit attempts cannot complete week;
- non-credit attempts may remain in history without affecting credited template coverage;
- restore ordering does not change next template.

## Step 6: Mandatory short-session verification

This is a required Stage 5B.1 proof.

Construct real short main-plan plans through production planning/generation where practical.

Cover:

1. Short strength plan includes primary strength; user completes it -> credited.

2. Short balance plan includes primary balance; user completes it -> credited.

3. Short mobility plan includes primary mobility; user completes it -> credited.

4. Short plan includes primary focus but user skips it and completes supporting exercise -> non-credit.

5. Short plan contains only supporting/fallback work due equipment gating -> plan is partial/non-credit before start.

6. Short no-support balance plan -> no playable primary balance; non-credit.

7. Short no-band strength plan where upper pull is absent but another primary strength exercise exists -> credit remains possible after completing the valid primary.

8. Short session with no primary exercise and no completed work -> Stage 5A zero-work state.

Assert:

- no automatic credit merely because `short` is a main-plan session type;
- compaction preserves correct structured stimulus role;
- one completed primary is enough under current rule;
- copy and credit potential align.

## Step 7: Mandatory equipment scenario verification

Use current production generation/planning.

At minimum:

### Strength focus

- true no equipment;
- chair + wall;
- no band;
- band without door anchor;
- band + door anchor;
- no floor space;
- no stair/support.

### Balance focus

- no support;
- chair only;
- wall only;
- full support;
- no floor;
- short-on-time.

### Mobility focus

- no chair/wall;
- chair + wall;
- floor unavailable;
- short-on-time.

For every generated plan record:

- block focus;
- planned primary focus exercise ids;
- supporting/fallback ids;
- skipped focus slots;
- pre-session status;
- main-plan-credit potential;
- actual credit after completing:
  - primary;
  - supporting only;
  - fallback only.

Required:

- Stage 4A safety gates remain;
- Stage 4B stimulus roles remain;
- no plan with zero playable primary focus is presented as normally creditable;
- equipment limitations remain visible.

## Step 8: Mandatory readiness scenario verification

Use the real readiness/autoregulation path.

Cover:

- fully ready;
- cautious/low energy;
- short on time;
- high ladder level + cautious;
- no equipment + cautious;
- balance focus + cautious;
- loaded/optional movement removed by readiness.

Required:

- readiness scaling may reduce sets/levels;
- it must not relabel supporting/fallback work as primary;
- if all primary focus work disappears, plan becomes partial/non-credit;
- if at least one primary remains and is completed, credit remains possible;
- no safety gate is overridden to preserve credit.

Do not redesign readiness policy.

## Step 9: Mandatory pain scenario verification

Use the actual pain filtering path.

Cover:

- knee pain in strength focus;
- hip/back pain;
- shoulder pain;
- ankle/foot pain;
- pain plus low readiness;
- pain plus no equipment;
- pain directly removes focus-domain exercises.

For each:

- planned primary focus exercises;
- supporting/fallback exercises;
- pre-session eligibility;
- actual completion-credit outcome.

Required:

- no unrelated work is relabelled primary;
- no-primary plan is partial/non-credit;
- same-domain safe regression may remain primary only if Stage 4B metadata says it is primary;
- broader pain strategy remains deferred to Stage 5E;
- no new safety substitution is invented in this task.

## Step 10: Verify preview-state honesty

At view-model/screen level, prove:

### Eligible main-plan plan

- normal plan CTA;
- no false warning;
- plan-advancing expectation is accurate.

### No-primary-focus planned session

- labelled supporting/partial;
- explanation references equipment/safety/stimulus reason;
- no promise that the plan will advance;
- user may review setup/retry/complete supporting session according to current architecture;
- `mainPlanCreditPotential` remains false if started.

### Extra/manual/legacy plan

- not treated as current A/B/C plan.

Copy must remain calm and Stage 3D-A safe.

## Step 11: Verify completion-state honesty

At view-model/screen level, distinguish:

1. Credited primary-focus session:
   - normal completion state.

2. Supporting-only completed attempt:
   - useful supporting work recorded;
   - plan unchanged;
   - retry/review option;
   - no milestone/week-complete copy.

3. Fallback-only completed attempt:
   - same non-credit principle.

4. Zero-work attempt:
   - Stage 5A recovery copy;
   - distinct from supporting-only.

5. Missing metadata:
   - calm fail-closed copy;
   - no credit.

Assert no “session completed” copy falsely implies plan advancement for non-credit states.

## Step 12: Verify serialization and no-promotion behavior

Test local serialization/restore for:

- eligible plan;
- no-primary plan;
- credited primary completion;
- supporting-only partial attempt;
- fallback-only partial attempt;
- zero-work attempt;
- old record missing focus-stimulus metadata;
- contradictory restored metadata.

Required:

- focus eligibility metadata round-trips;
- completed focus evidence round-trips where stored;
- non-credit remains non-credit;
- old missing metadata fails closed;
- old records are not rewritten on read;
- restored attempts do not enter credited A/B/C coverage;
- source/block/template/date identity remains required.

## Step 13: Verify backend sync and restore

Test:

- credited primary-focus completion syncs with authoritative credit metadata;
- supporting-only attempt does not sync as credited main-plan completion;
- fallback-only attempt does not sync as credited main-plan completion;
- zero-work attempt does not sync as credited main-plan completion;
- backend JSON preserves narrow focus evidence metadata where implemented;
- remote restore cannot promote missing/legacy/supporting-only attempt;
- duplicate local/remote credited completion dedupes;
- source mismatch remains fail closed.

If non-credit attempts are intentionally not synced, document that explicitly.

Do not broaden F5-009 beyond what Stage 5B already touched.

## Step 14: Verify exact/near focus authority

Construct:

- clear strength/balance/mobility blocks;
- exact-tie block with deterministic fallback;
- exact-tie re-test block preserving active focus;
- near-tie block with deterministic fallback;
- near-tie re-test block preserving active focus.

Required:

- completion uses `MovementBlock.focusDomain`;
- no score recomputation;
- no snapshot rescoring;
- a primary exercise for another tied domain does not count unless it matches the concrete block focus;
- correct concrete-focus primary work does count.

## Step 15: Verify legacy fallback exclusion

Construct a legacy-fallback session whose exercise names/domains appear to match the active focus.

Required:

- Stage 5A classifier excludes it;
- Stage 5B cannot override exclusion;
- no main-plan credit;
- no A/B/C advancement;
- no week completion;
- no inference from names/domains.

Stage 5C remains responsible for fallback containment/removal.

## Step 16: Clarify progression behavior without changing policy

Trace what currently happens when:

- supporting-only attempt is completed;
- fallback-only attempt is completed;
- primary-focus non-credit attempt exists;
- credited primary-focus attempt exists.

Document whether individual exercise progression is:

- coupled to credited main-plan completion;
- independently driven by explicit completed items;
- partially synced;
- inconsistent.

Do not silently decide the Stage 5D policy.

Production changes are allowed only if current Stage 5B accidentally progresses missing/malformed evidence contrary to Stage 5A.

The report must clearly state:

- what currently happens;
- what remains for Stage 5D;
- whether any immediate P0/P1 defect remains.

## Step 17: Production-code restraint

Only change production code if a new authoritative test exposes a violation.

Likely allowable changes are limited to:

- focus-stimulus validation;
- completion credit integration;
- preview/completion state mapping;
- serialization/sync/restore fail-closed normalization;
- copy alignment.

Do not assume changes are required.

Document every production change and the exact failing invariant that required it.

## Required automated test matrix

At minimum:

### Core helpers

- planned focus eligibility matrix;
- completed focus evidence matrix;
- deterministic/non-mutating behavior.

### Credit boundary

- primary credited;
- supporting-only non-credit;
- fallback-only non-credit;
- wrong-domain non-credit;
- zero-work non-credit;
- manual/extra/legacy non-credit;
- duplicate idempotency;
- valid partial primary credit.

### Rotation

- non-credit A/B/C attempts do not advance;
- retry with primary advances once;
- week requires credited A/B/C.

### Short sessions

- strength/balance/mobility primary completion;
- primary skipped/supporting completed;
- only supporting/fallback plan;
- equipment-limited short plan.

### Equipment/readiness/pain

- scenario matrices from Steps 7–9.

### UI/view models

- preview eligibility states;
- completion credited/supporting/fallback/zero-work/missing-metadata states.

### Persistence/backend

- round-trip;
- no promotion;
- no read-time rewrite;
- duplicate dedupe.

### Focus authority

- clear/exact/near concrete block focus.

### Regression

- Stage 5A non-training/zero-work/date behavior;
- Stage 4A safety gates;
- Stage 4B stimulus metadata;
- Stage 3D focus policy;
- Stage 3A/3B/3C protections;
- scoring/norms unchanged.

## Test-quality requirements

Tests must:

- exercise real production helpers;
- exercise real generated metadata;
- exercise actual credit orchestration where practical;
- assert observable mutations/non-mutations;
- distinguish zero-work from supporting-only;
- fail if names/domains are used to infer primary status;
- fail if short sessions gain automatic credit;
- fail if restored legacy data is promoted;
- preserve valid partial primary-focus credit.

Tests must not:

- alter exercise selection to make tests easy;
- add dose thresholds;
- implement Stage 5C;
- implement Stage 5D;
- mock every layer;
- assert only helper invocation;
- depend on network;
- depend on wall-clock sleeps.

Use deterministic ids, dates, block ids, and templates.

## Validation commands

Run a targeted Stage 5B.1 command covering at minimum:

- focusStimulusEvidence;
- sessionWorkEvidence;
- mainPlanEvents;
- sessionPlanning;
- workoutGeneration;
- adherence completion;
- preview/completion screens or view models;
- serialization/store;
- backend session/training-state sync/restore;
- Stage 4A/4B;
- Stage 3D focus.

Then run exactly:

```bash
npm test -- --runInBand
npm run typecheck
npx --no-install expo config --type public
git diff --check
```

Do not install packages.

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
- typecheck exit code;
- Expo config exit code;
- `git diff --check` exit code;
- Watchman warning status;
- Jest open-handle status;
- Sentry warning status;
- any new warnings;
- whether validation changed files.

Stage 5B reported a full baseline of 87 suites and 628 tests. Verify the current baseline rather than assuming it.

## Verification report

Create exactly one new report:

docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5B_1.md

Do not edit previous reports.

The report must include:

1. Scope.
2. Reason Stage 5B.1 was required.
3. Initial Git status.
4. Initial diff names/stat.
5. Current Stage 5B architecture.
6. Planned focus-stimulus contract.
7. Completed focus-evidence contract.
8. Authoritative credit equation.
9. Direct helper matrix results.
10. Completion-boundary results.
11. A/B/C and week-completion results.
12. Short-session verification.
13. Equipment scenario verification.
14. Readiness scenario verification.
15. Pain scenario verification.
16. Preview-state verification.
17. Completion-state verification.
18. Serialization/no-promotion verification.
19. Backend sync/restore verification.
20. Exact/near concrete-focus verification.
21. Legacy fallback exclusion.
22. Current progression behavior and Stage 5D boundary.
23. Production files changed, if any.
24. Exact reason for each production change.
25. Tests added/changed.
26. Exact targeted validation.
27. Exact full validation.
28. `git diff --check` result.
29. Stage 5A regression verification.
30. Stage 4A/4B regression verification.
31. Stage 3D regression verification.
32. Remaining Stage 5 blockers.
33. F5-006 status.
34. Whether Stage 5C is unblocked.
35. Initial and final Git status.
36. Complete files-changed inventory.
37. Concurrent external changes.
38. Confirmation that no commit/staging/branch/push occurred.

## Required invariant outcomes

After Stage 5B.1:

1. A credited main-plan completion includes completed primary work matching concrete block focus.
2. Supporting-only attempts remain non-credit.
3. Fallback-only attempts remain non-credit.
4. Wrong-domain primary remains non-credit.
5. Missing metadata remains non-credit.
6. Legacy fallback remains non-credit.
7. One completed primary in a partial result remains creditable.
8. Short sessions require completed primary focus.
9. Equipment-limited no-primary plans are partial/non-credit.
10. Readiness cannot relabel non-primary work as primary.
11. Pain filtering cannot relabel non-primary work as primary.
12. Non-credit A/B/C attempts do not advance rotation.
13. Week completion requires credited A/B/C.
14. Preview copy is honest.
15. Completion copy distinguishes primary/supporting/fallback/zero-work.
16. Local restore cannot promote non-credit.
17. Backend restore cannot promote non-credit.
18. Exact/near block focus remains authoritative.
19. Stage 5A non-training and zero-work gates remain.
20. Stage 4A safety gates remain.
21. Stage 4B stimulus metadata remains.
22. Stage 3D focus semantics remain.
23. No score/norm/Check-Up changes.
24. No read-time rewrite of old records.
25. No unrelated product logic changes.

## Acceptance criteria

Do not mark Stage 5B.1 verified unless:

1. Direct focus-helper matrices pass.

2. Completion-boundary mutations/non-mutations are proven.

3. Supporting/fallback-only attempts cannot advance A/B/C.

4. Valid partial primary-focus sessions remain creditable.

5. Short-session behavior is proven.

6. Equipment/readiness/pain scenario behavior is proven.

7. Preview/completion copy states are proven.

8. Serialization/restore fail-closed behavior is proven.

9. Backend promotion is blocked.

10. Concrete block focus is proven authoritative.

11. Legacy fallback exclusion is proven.

12. Progression behavior is documented without silently deciding Stage 5D.

13. Stage 5A/4A/4B/3D regressions pass.

14. Targeted tests pass.

15. Full suite passes.

16. Typecheck passes.

17. Expo config passes.

18. `git diff --check` passes.

19. No new warning is introduced without explanation.

20. No unrelated user work is reverted or overwritten.

21. No commit, staging, branch, or push occurs.

## Stage decisions

At the end of the report, state exactly one:

- STAGE 5B VERIFIED
- STAGE 5B VERIFICATION BLOCKED

Also state exactly one:

- STAGE 5C UNBLOCKED
- STAGE 5C BLOCKED

Use `STAGE 5C UNBLOCKED` only if no P0/P1 gap remains in Stage 5B primary-focus credit behavior.

Also state:

- STAGE 5D REQUIRED
- STAGE 5 REMEDIATION STILL REQUIRED
- BETA AUTOMATIC PLAN GENERATION BLOCKED
- STAGE 4 REMEDIATION STILL REQUIRED
- STAGE 3D-B REQUIRED

Stage 5B.1 must not declare beta readiness.

## Final Codex response

Return a concise summary containing:

- Verification report path.
- Whether production code changed.
- Exact reason for each production change.
- Planned focus-stimulus rule.
- Completed focus-evidence rule.
- Credit equation verified.
- Short-session verification result.
- Equipment/readiness/pain verification result.
- Supporting-only/fallback-only behavior.
- A/B/C rotation result.
- Preview/completion copy result.
- Serialization/restore result.
- Backend sync/restore result.
- Exact/near focus authority result.
- Legacy fallback exclusion result.
- Current progression behavior and Stage 5D boundary.
- Targeted validation command/result.
- Full-suite result.
- Typecheck result.
- Expo config result.
- `git diff --check` result.
- Confirmation that Stage 5A, Stage 4A/4B, and Stage 3D protections remain.
- F5-006 status.
- Remaining Stage 5 blockers.
- STAGE 5B VERIFIED or STAGE 5B VERIFICATION BLOCKED.
- STAGE 5C UNBLOCKED or STAGE 5C BLOCKED.
- STAGE 5D REQUIRED.
- STAGE 5 REMEDIATION STILL REQUIRED.
- BETA AUTOMATIC PLAN GENERATION BLOCKED.
- STAGE 4 REMEDIATION STILL REQUIRED.
- STAGE 3D-B REQUIRED.
- Initial and final Git status.
- Complete files-changed inventory.
- Any concurrent external changes.
- Confirmation that no commit, staging, branch, or push occurred.
