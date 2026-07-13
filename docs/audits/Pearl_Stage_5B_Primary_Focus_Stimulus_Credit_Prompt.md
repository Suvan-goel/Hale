You are implementing Stage 5B of Pearl’s production-readiness work:

MINIMUM PRIMARY-FOCUS STIMULUS, SUPPORTING/FALLBACK SESSION HONESTY, AND FOCUS-CREDIT GATING

This is a focused production-code remediation task following the Stage 5 audit and Stage 5A.

Do not begin Stage 5C, Stage 5D, Stage 5E, Stage 5F, Stage 5G, Stage 5H, Stage 3D-B, further Stage 4 remediation, or beta-device validation in this task.

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

Treat the current working tree as the source of truth. Re-verify every relevant path before editing because report line numbers and implementation details may no longer be exact.

## Stage 5A baseline

Stage 5A is complete.

It introduced:

- one authoritative main-plan event classifier;
- explicit source-aware and block/template-aware A/B/C credit;
- template-based week completion;
- deduplication of repeated completion evidence;
- one fail-closed session work-evidence helper;
- zero credit for all-skipped, empty, missing, malformed, duplicate, or unmatched result evidence;
- missing planned exercise results no longer default to completed;
- explicit planning dates now drive planned date keys and completion identity;
- sync/restore boundaries preserve explicit credit/type/source/template/date metadata;
- non-training events no longer advance A/B/C rotation.

Stage 5A intentionally preserved the current partial-session rule:

> A genuine main-plan session with at least one explicitly completed planned exercise can receive main-plan credit, even if the completed exercise was only supporting or fallback work and no primary exercise for the active block focus was completed.

Stage 5B must now close that remaining trust gap.

## Confirmed finding being addressed

### F5-006 — P1

A generated session can contain no completed primary exercise matching the active block focus and still receive main-plan completion credit.

Confirmed examples include:

- a balance-focused session where support-dependent balance slots were skipped, but the user completed strength or mobility maintenance work;
- an equipment-limited session where focus-domain slots were skipped and only supporting/fallback exercises remained;
- a pain/readiness-adjusted session where the focus-domain movement was not completed;
- a short session where compaction preserved playable exercises but not a completed primary focus exercise.

Stage 4B now provides explicit metadata:

- intended domain;
- selected domain;
- stimulus role:
  - `primary`
  - `supporting`
  - `fallback`
  - `skipped`
  - `invalid`
- stimulus reason;
- skipped-slot reason.

Stage 5A now provides explicit valid work evidence.

Stage 5B must combine these two contracts so that Pearl only advances a main-plan session when the user completed meaningful work for the block’s actual focus.

## Approved product rule

The product owner has approved this rule:

> A planned session advances the main plan only if the user completes at least one planned exercise whose stimulus role is `primary` and whose intended domain matches the active MovementBlock focus domain.

Supporting-, fallback-, maintenance-, or cross-domain-only work may still be:

- performed;
- saved as an attempt;
- shown in session history;
- described as useful supporting work;
- used for later product analysis where appropriate.

But a supporting/fallback-only attempt must not:

- advance A/B/C rotation;
- count toward week completion;
- increment main-plan adherence;
- trigger main-plan milestones;
- advance block completion;
- trigger official re-test due state.

Stage 5D will later decide whether non-credit supporting/fallback work can affect individual exercise-ladder progression.

Do not silently choose that Stage 5D policy in this task.

## Primary objective

Implement one fail-closed focus-stimulus eligibility contract so that:

1. Every block-generated main-plan plan states whether it contains at least one playable primary exercise for the active block focus.

2. A session with no playable primary focus exercise is identified before completion as supporting/partial and not eligible to move the plan forward.

3. A session that planned primary focus work but did not complete any of it receives no main-plan credit.

4. Completing only supporting or fallback exercises receives no main-plan credit.

5. Completing at least one valid primary exercise matching the active block focus preserves current Stage 5A partial-session credit behavior.

6. Exact-tie and near-tie effective focus from Stage 3D remain authoritative through the MovementBlock’s concrete focus domain.

7. Stage 4A safety gating and Stage 4B stimulus metadata remain authoritative.

8. Valid normal A/B/C sessions continue to work.

9. No primary-focus requirement is inferred from exercise display names or raw exercise domains when structured metadata exists.

10. Automatic plan generation remains beta-blocked until later Stage 5 remediation is complete.

## Scope boundary

This task may change:

- focus-stimulus eligibility helpers;
- generated-session metadata;
- PearlSessionPlan metadata;
- session preview/summary state;
- main-plan credit orchestration;
- Stage 5A work-evidence integration;
- adherence/main-plan completion boundaries;
- A/B/C credit only as affected by focus eligibility;
- serialization/restore normalization required for focus eligibility fields;
- narrow backend completion metadata if existing JSON supports it;
- user-facing preview/completion copy for supporting-only sessions;
- tests;
- the Stage 5B remediation report.

This task must not change:

- which exercise the generator selects;
- Stage 4A equipment/safety gates;
- Stage 4B stimulus-role definitions;
- exercise catalogue content;
- exercise progression algorithms;
- Stage 5C legacy fallback containment;
- Stage 5D official progression-evidence policy;
- Stage 5E pain/readiness strategy;
- Stage 5F equipment canonicalization;
- Stage 5G block timing/lapse policy;
- scoring formulas;
- norms;
- Check-Up logic;
- score snapshots;
- exact/near tie focus policy;
- broad UI design;
- backend schema unless existing JSON metadata can carry narrow fields;
- dependencies;
- assets.

Do not perform opportunistic refactors.

## Locked Stage 5B contracts

### 1. The active block focus is authoritative

The focus domain used for credit must come from the active MovementBlock or the authoritative block-generated plan metadata.

It must preserve Stage 3D policy:

- clear focus;
- exact-tie deterministic/preserved focus;
- near-tie deterministic/preserved focus.

Do not recompute focus from the latest raw score during session completion.

Do not choose the oldest/worst domain again.

Do not use display copy.

### 2. Primary focus exercise definition

A planned exercise qualifies as a primary focus exercise only when all are true:

- it belongs to the current planned session;
- it has structured generated-exercise/slot metadata;
- `stimulusRole === 'primary'`;
- `intendedDomain` exactly matches the active block focus domain;
- it is not marked skipped/invalid;
- its exercise id is valid;
- its source block/template identity is consistent where represented.

A selected exercise whose selected domain happens to match the block focus but whose role is `supporting` or `fallback` does not satisfy the gate.

A cross-domain supporting level does not satisfy the gate.

Do not infer primary status from exercise name, ladder name, or display label.

### 3. Planned focus availability

Create one pure helper that evaluates the planned session before the user starts.

Conceptually:

```ts
type PlannedFocusStimulus = {
  blockFocusDomain: MovementDomain | null;
  plannedExerciseCount: number;
  plannedPrimaryFocusExerciseIds: string[];
  supportingExerciseIds: string[];
  fallbackExerciseIds: string[];
  skippedFocusSlots: string[];
  hasPlayablePrimaryFocus: boolean;
  status:
    | 'eligible'
    | 'no_primary_focus_planned'
    | 'missing_stimulus_metadata'
    | 'focus_mismatch'
    | 'not_main_plan';
  reasons: string[];
};
```

Adapt to actual types.

Requirements:

- Pure.
- Deterministic.
- Uses structured Stage 4B metadata.
- Fails closed for current block-generated sessions missing metadata.
- Does not mutate the plan.
- Does not rescore anything.
- Works for strength, balance, and mobility focus.
- Treats extra/manual/non-main plans as not-main-plan rather than errors.

### 4. Completed focus evidence

Create or extend one pure helper combining:

- Stage 5A work evidence;
- planned focus-stimulus metadata;
- explicit item completion results.

Conceptually:

```ts
type CompletedFocusStimulusEvidence = {
  plannedPrimaryFocusExerciseIds: string[];
  completedPrimaryFocusExerciseIds: string[];
  completedSupportingExerciseIds: string[];
  completedFallbackExerciseIds: string[];
  hasCompletedPrimaryFocus: boolean;
  status:
    | 'credited_focus_work'
    | 'primary_focus_not_completed'
    | 'no_primary_focus_planned'
    | 'missing_stimulus_metadata'
    | 'no_completed_work'
    | 'not_main_plan';
};
```

Requirements:

- A primary exercise counts only with an explicit valid completed result under Stage 5A.
- Skipped, missing, malformed, duplicate, or unmatched rows do not count.
- Supporting/fallback completion is recorded but cannot satisfy the focus gate.
- Pure and deterministic.
- Input order does not alter output.
- Does not mutate inputs.

### 5. Main-plan credit requires both gates

A session earns main-plan credit only when:

- Stage 5A main-plan event classification is valid;
- Stage 5A work evidence contains at least one explicitly completed planned exercise;
- Stage 5B planned focus eligibility is valid;
- Stage 5B completed focus evidence contains at least one completed primary focus exercise;
- block, template, source, date, and dedupe identity remain valid.

If any focus gate fails:

- no credited adherence completion;
- no A/B/C rotation advancement;
- no week completion;
- no main-plan milestone;
- no block progress;
- no re-test due mutation;
- no sync as a credited main-plan completion.

The attempt may remain saved locally as non-credit.

### 6. Pre-session honesty

If a current block-generated main-plan plan contains no playable primary focus exercise:

- detect this before the session begins;
- do not present it as a normal plan-advancing session;
- mark it as a supporting/recovery/partial session;
- set main-plan-credit potential to false;
- show calm explanatory copy;
- allow the user to:
  - review equipment/setup;
  - choose another time;
  - optionally complete the supporting session without plan credit, if current architecture allows;
- do not silently block the UI with no explanation.

Suitable copy:

- “Pearl couldn’t include a primary [focus] exercise with today’s setup.”
- “This supporting session can still be useful, but it won’t move your plan forward.”
- “Review your equipment or try again when a safe focus exercise is available.”

Do not shame the user.

### 7. Post-session honesty

If a plan contained primary focus work but the user completed only supporting/fallback exercises:

- do not show a false main-plan completion milestone;
- state that useful supporting work was recorded;
- state that the plan remains unchanged because no primary focus exercise was completed;
- allow retry/recovery using existing navigation;
- preserve calm tone.

Suitable copy:

- “Pearl recorded your supporting work, but this session did not include completed [focus] work, so your plan has not moved forward.”
- “You can retry the planned session when you’re ready.”

### 8. Current valid partial-session behavior

A session may still receive main-plan credit when:

- at least one primary focus exercise was explicitly completed;
- other planned exercises were skipped/missing;
- Stage 5A work evidence and all identity gates pass.

Do not add a percentage-of-dose threshold.

Do not require all primary focus exercises.

Do not require cross-domain maintenance completion.

Those may be later product decisions.

### 9. Short-session behavior

A short main-plan session may receive credit only if:

- its compacted plan includes a playable primary focus exercise;
- the user explicitly completes at least one such exercise;
- Stage 5A identity/work gates pass.

A short session containing only supporting/fallback work is non-credit.

Do not assume “short” means automatic credit.

### 10. Pain/readiness/equipment behavior

If pain/readiness/equipment filtering removes all primary focus exercises:

- the plan is supporting/partial and non-credit;
- do not override safety gates merely to create credit;
- do not substitute unrelated work and label it primary;
- preserve Stage 4A/4B skipped reasons;
- leave broader pain/readiness policy to Stage 5E.

### 11. Legacy fallback

Stage 5A excludes legacy fallback from main-plan credit.

Preserve that behavior.

Do not add focus eligibility to make legacy fallback creditable.

Stage 5C will decide whether legacy fallback is retired, migration-only, or replaced with a constrained safe fallback.

### 12. Old records

Historical plans/completions missing Stage 4B focus-stimulus metadata:

- remain viewable;
- do not gain current main-plan focus credit;
- are not rewritten on read;
- do not infer primary focus from exercise names;
- may be classified as `missing_stimulus_metadata`.

### 13. Progression remains deferred

Do not silently decide whether a non-credit supporting/fallback-only attempt can progress an individual exercise ladder.

In this task:

- block/main-plan rotation credit is denied;
- preserve explicit completed item evidence;
- avoid deleting data needed by Stage 5D;
- document current progression behavior and remaining decision.

If current code couples progression strictly to main-plan credit, preserve that conservative behavior unless a failing regression requires a narrow fix.

## Working-tree safety

Before editing:

1. Run:

   `git status --short --untracked-files=all`

   `git diff --name-only`

   `git diff --stat`

2. Record exact outputs in the remediation report.

3. Treat all existing modifications and untracked files as user-owned.

4. Inspect current diffs in every file this task may touch.

5. Do not revert, overwrite, reformat, move, or delete unrelated work.

6. Do not edit previous reports.

7. Do not use destructive Git commands.

8. Do not install packages.

9. Do not stage, commit, create a branch, or push.

10. If unrelated files change:
    - record them;
    - do not overwrite them;
    - continue only if task-owned files remain safe;
    - otherwise stop code mutation and report the conflict.

## Step 1: Reconstruct the post-5A credit path

Before editing, inspect at minimum:

- App.tsx
- src/pearlFlow/mainPlanEvents.ts
- src/pearlFlow/sessionWorkEvidence.ts
- src/pearlFlow/sessionPlanning.ts
- src/pearlFlow/types.ts
- src/training/workoutGeneration.ts
- src/training/dynamicState.ts
- src/training/serialize.ts
- src/training/equipmentSafety.ts
- src/adherence/types.ts
- src/adherence/adherenceService.ts
- src/adherence/screens/SessionCompletionScreen.tsx
- src/screens/SessionPreviewScreen.tsx
- src/screens/TrainingSessionScreen.tsx
- src/screens/TodayScreen.tsx
- local/backend sync/restore files touched by Stage 5A;
- Stage 4B and Stage 5A tests.

Document:

- exact generated-exercise metadata available on a plan;
- exact `slotStimulus` metadata;
- how active block focus reaches the plan;
- how `countsTowardMainPlan` and explicit `mainPlanCredit` are currently represented;
- Stage 5A work-evidence shape;
- completion orchestration order;
- preview UI state;
- completion UI state;
- serialization and sync fields;
- current handling of plans with zero primary focus;
- current handling of supporting/fallback-only completion.

Do not edit until this trace is complete.

## Step 2: Implement the planned focus-stimulus helper

Create one authoritative pure helper in the narrowest appropriate module, such as:

- `src/pearlFlow/focusStimulusEvidence.ts`;
- or a Stage 5A helper module if that keeps one credit boundary.

Requirements:

- Accept the actual `PearlSessionPlan`/generated metadata and active block focus.
- Return stable reason codes.
- Recognize `primary`, `supporting`, `fallback`, `skipped`, and `invalid`.
- Require exact intended-domain match.
- Detect missing/contradictory metadata.
- Treat current block-generated plans more strictly than legacy/extra plans.
- No side effects.

Direct tests must cover:

- strength plan with primary strength exercise;
- balance plan with primary balance exercise;
- mobility plan with primary mobility exercise;
- only supporting same-domain work;
- only fallback same-domain work;
- cross-domain primary exercise;
- skipped focus slot plus supporting work;
- missing metadata;
- malformed role/domain;
- extra/manual plan;
- legacy fallback plan;
- exact/near tied block whose concrete focus is preserved.

## Step 3: Implement completed focus evidence

Combine the planned helper with Stage 5A `evaluateSessionWorkEvidence`.

Direct tests:

1. Primary focus exercise completed -> eligible.

2. Primary focus exercise skipped, supporting completed -> no focus credit.

3. Primary focus missing, fallback completed -> no focus credit.

4. Primary focus malformed, another primary completed -> eligible only for valid one.

5. Duplicate result for primary exercise -> fail closed for that exercise.

6. Unmatched result marked primary -> ignored.

7. Null result -> no focus credit.

8. One primary completed, all other items missing -> focus credit allowed under current partial rule.

9. Primary for wrong domain completed -> no focus credit.

10. Input order does not matter.

11. Inputs not mutated.

## Step 4: Add plan-level credit potential metadata

For current block-generated main-plan plans, derive and store narrow metadata such as:

- `hasPlayablePrimaryFocus`;
- `primaryFocusExerciseIds`;
- `focusStimulusStatus`;
- `focusStimulusReason`;
- `blockFocusDomain`;
- `mainPlanCreditPotential`.

Adapt to existing metadata.

Requirements:

- Generated once from structured Stage 4B metadata.
- Survives plan serialization where plans are persisted.
- Does not change exercise selection.
- Missing metadata fails closed.
- Extra/manual/retest plans remain non-main-plan.
- Legacy fallback remains non-credit.

Do not create multiple conflicting focus eligibility fields without a consistency check.

## Step 5: Gate pre-session main-plan presentation

At the plan/session preview boundary:

### Eligible main-plan plan

- Existing normal CTA and copy remain.
- Main-plan-credit potential may be shown internally/metadata.
- No extra warning.

### No playable primary focus

- Clearly label as supporting/partial.
- Explain why using existing skipped/stimulus reasons.
- Do not promise that it advances the plan.
- Offer a calm recovery choice.
- If the user starts it, preserve `mainPlanCreditPotential: false`.

Do not redesign the screen.

Tests should assert:

- no-primary plan is not presented as normal credited A/B/C;
- band/support/floor limitation reason remains visible where relevant;
- eligible plan remains unchanged;
- Stage 3D-A safe tone remains.

## Step 6: Gate completion credit with completed focus evidence

Update the authoritative Stage 5A completion boundary.

Required sequence:

```text
main-plan event identity
+ Stage 5A work evidence
+ Stage 5B planned focus eligibility
+ Stage 5B completed focus evidence
+ dedupe
= credited main-plan completion
```

If completed focus evidence fails:

- no adherence credited completion;
- no rotation/week/block advancement;
- no main-plan milestone;
- no main-plan session sync;
- no re-test due mutation;
- no false completion celebration;
- may save a non-credit attempt/summary.

Add stable exclusion reasons:

- `no_primary_focus_planned`
- `primary_focus_not_completed`
- `missing_stimulus_metadata`
- `focus_domain_mismatch`
- `supporting_only`
- `fallback_only`

Use existing reason types if appropriate.

## Step 7: User-facing completion recovery

Update the narrow completion-state/view-model logic.

Scenarios:

### Supporting-only attempt

Copy should convey:

- useful work was recorded;
- the plan did not advance;
- why it did not advance;
- retry/adjust setup is available.

### Fallback-only attempt

Same principle.

### Primary focus completed

Existing completion behavior remains.

### No work completed

Stage 5A zero-work copy remains.

Do not conflate zero-work and supporting-only:

- zero-work: no completed exercise;
- supporting-only: completed work exists, but no primary focus exercise was completed.

Tests must distinguish these states.

## Step 8: A/B/C rotation regression

Because Stage 5A already advances only credited events, prove:

- supporting-only A attempt does not advance to B;
- fallback-only A attempt does not advance;
- primary-focus-completed A advances to B;
- supporting-only attempt may remain in history but is excluded from credited template coverage;
- retry of A with primary focus then advances once;
- duplicate credited retry does not double count;
- B/C behavior follows the same rule;
- week completion still requires credited A/B/C.

Do not alter template ordering.

## Step 9: Short-session regression

Test:

- short main plan with completed primary focus -> credited.
- short plan with planned primary but skipped primary -> non-credit.
- short plan containing only supporting/fallback -> non-credit.
- short no-equipment balance plan with no primary balance -> clearly partial/non-credit.
- short strength plan with a primary squat completed -> credited.
- compaction does not mislabel supporting work as primary.

## Step 10: Equipment/readiness/pain scenarios

Use deterministic plans generated under current Stage 4/5 inputs.

At minimum:

- balance focus, no support;
- strength focus, no band;
- mobility focus, no chair/wall;
- floor focus slot without floor_space;
- stair slot without support;
- cautious readiness;
- short-on-time;
- knee pain in strength block;
- hip/back pain;
- shoulder pain;
- ankle/foot pain.

For each, assert:

- planned focus eligibility;
- whether session is normal or supporting/partial;
- completion credit after primary/supporting/fallback outcomes;
- safety gates remain intact.

Do not add new exercise substitutions in this task.

## Step 11: Serialization and restore

Ensure focus-credit metadata survives where needed:

- plan/session metadata;
- generated summary;
- non-credit attempt;
- credited completion;
- local training serialization;
- current restore normalization.

Requirements:

- Missing legacy metadata fails closed.
- Old records are not rewritten.
- A restored supporting-only attempt remains non-credit.
- A restored credited completion retains valid focus evidence metadata or enough authoritative credit metadata from Stage 5A.
- Duplicate local/remote representations still dedupe.

Do not perform broad migration.

## Step 12: Backend sync boundaries

For newly credited main-plan completions:

- preserve narrow focus evidence metadata in existing JSON if current service supports it;
- verify only focus-credited completions sync as credited main-plan rows;
- supporting/fallback-only attempts do not sync as credited main-plan completions;
- restore cannot promote supporting-only/unknown attempts.

Do not close Stage 5 audit F5-009 broadly unless the narrow metadata change naturally addresses part of it.

Document what remains.

## Step 13: Observability

Add safe structured diagnostics for:

- no primary focus planned;
- primary focus not completed;
- supporting-only attempt;
- fallback-only attempt;
- missing stimulus metadata;
- focus-domain mismatch;
- credited primary focus.

Include only:

- stable reason code;
- block/session/template ids where safe;
- block focus domain;
- planned/completed primary exercise counts;
- supporting/fallback counts;
- session source/type.

Exclude raw movement values, video, landmarks, free-form profile text, and auth data.

Keep pure helpers side-effect free.

## Required automated test matrix

### A. Planned focus eligibility

- clear strength/balance/mobility plans.
- exact/near tied block with concrete focus.
- no primary focus planned.
- only supporting.
- only fallback.
- wrong-domain primary.
- missing metadata.
- legacy fallback.
- extra/manual.

### B. Completed focus evidence

- primary completed.
- primary skipped.
- primary missing.
- primary malformed.
- supporting completed.
- fallback completed.
- wrong-domain primary completed.
- duplicate primary result.
- unmatched result.
- one valid primary among partial results.

### C. Main-plan credit

- normal A with primary -> credit.
- A with supporting only -> no credit.
- A with fallback only -> no credit.
- A with zero work -> Stage 5A no credit.
- short session with primary -> credit.
- short session without primary -> no credit.
- manual/extra remains no credit.
- duplicate credit remains deduped.
- wrong block remains no credit.

### D. Rotation/week

- non-credit A attempt -> still A due.
- credited A -> B.
- non-credit B -> B remains due.
- credited B -> C.
- non-credit C -> C remains due.
- credited A/B/C -> week complete.
- supporting-only attempts do not complete week.
- retry with primary advances exactly once.

### E. Preview/copy

- eligible plan normal.
- no-primary plan labelled supporting/partial.
- equipment reason shown.
- no false “moves plan forward” promise.
- Stage 3D-A copy guardrails remain.

### F. Completion/copy

- primary completed -> normal completion.
- supporting-only -> useful work recorded, no plan advancement.
- fallback-only -> no plan advancement.
- zero-work -> Stage 5A recovery.
- no shame/lost-streak language.

### G. Serialization/sync/restore

- focus eligibility metadata round-trip.
- supporting-only remains non-credit.
- legacy missing metadata fails closed.
- credited completion preserves authoritative credit.
- backend sync excludes non-credit supporting-only attempts from credited rows.
- restore cannot promote.

### H. Regression

- Stage 5A non-training filtering and zero-work rules.
- Stage 4A safety gates.
- Stage 4B stimulus metadata.
- Stage 3D exact/near focus.
- Stage 3A/3B/3C full regressions.
- scoring/norms unchanged.

## Test-quality requirements

Tests must:

- use real Stage 4B generated exercise metadata;
- use real Stage 5A work evidence;
- exercise the actual credit boundary;
- assert observable mutation/non-mutation;
- distinguish zero-work from supporting-only;
- fail if supporting/fallback returns to credited status;
- fail if metadata is inferred from exercise names;
- preserve valid partial primary-focus behavior.

Tests must not:

- change exercise selection to make tests easy;
- implement dose percentage thresholds;
- implement Stage 5C fallback policy;
- implement Stage 5D progression policy;
- mock every layer;
- assert only that a helper was called;
- depend on network or wall-clock sleeps.

Use deterministic ids, dates, templates, and block focuses.

## Validation commands

Run targeted tests for:

- focus stimulus helpers;
- Stage 5A main-plan event/work-evidence helpers;
- session planning;
- workout generation;
- adherence completion;
- app-level or extracted completion orchestration;
- session preview/completion view models/screens;
- serialization/store;
- backend session/training-state sync/restore;
- Stage 4A/4B regression;
- Stage 3D focus regression.

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
- targeted suite count;
- targeted test count;
- full suite count;
- full test count;
- snapshots;
- skipped tests;
- typecheck result;
- Expo config result;
- diff-check result;
- warnings;
- whether validation changed files.

## Manual source verification after tests

Retrace:

### Eligible session

```text
active block focus
-> planned primary focus exercise
-> explicit completed result
-> Stage 5A work evidence
-> Stage 5B focus evidence
-> credited completion
-> A/B/C advancement
```

### Supporting-only session

```text
supporting/fallback completed
-> work exists
-> no completed primary focus
-> non-credit attempt
-> no A/B/C advancement
```

### No primary planned

```text
equipment/pain/readiness removes primary focus
-> plan marked supporting/partial
-> no main-plan-credit potential
```

### Short session

Confirm one completed primary focus exercise is sufficient under current rule.

### Restore

Confirm no missing legacy metadata is promoted.

## Remediation report

Create exactly one new report:

docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5B.md

Do not edit prior reports.

The report must contain:

1. Scope.
2. Initial Git status.
3. Finding addressed: F5-006.
4. Findings explicitly deferred: F5-005, F5-007, F5-008, F5-009 and later Stage 5 policy work.
5. Approved primary-focus credit rule.
6. Planned focus-stimulus architecture.
7. Completed focus-evidence architecture.
8. Main-plan credit integration.
9. Pre-session supporting/partial behavior.
10. Post-session supporting-only/fallback-only behavior.
11. Short-session behavior.
12. Equipment/readiness/pain scenario behavior.
13. Rotation/week-completion behavior.
14. Progression behavior left deferred.
15. Serialization/restore behavior.
16. Backend sync behavior.
17. Observability.
18. Files changed.
19. Tests added/changed.
20. Exact validation results.
21. Stage 1–5A regression verification.
22. Remaining Stage 5 blockers.
23. F5-006 status.
24. Whether beta automatic plan generation remains blocked.
25. Initial and final Git status.
26. Concurrent external changes.
27. Confirmation that no commit/staging/branch/push occurred.

## Required invariant outcomes

After Stage 5B:

1. A credited main-plan completion includes at least one completed primary exercise matching the active block focus.
2. Supporting-only work does not receive main-plan credit.
3. Fallback-only work does not receive main-plan credit.
4. Wrong-domain primary work does not satisfy the gate.
5. Missing stimulus metadata fails closed for current block-generated sessions.
6. A plan with no playable primary focus is marked supporting/partial before start.
7. A no-primary plan does not promise plan advancement.
8. Primary planned but skipped means no credit.
9. One completed primary focus exercise preserves current partial-session credit.
10. Short sessions require completed primary focus work.
11. Exact/near tie concrete block focus remains authoritative.
12. Manual/extra/retest/legacy exclusions from Stage 5A remain.
13. All-skipped zero-work behavior from Stage 5A remains.
14. A/B/C rotation advances only after focus-credited completion.
15. Week completion requires focus-credited A/B/C.
16. Stage 4A safety gates remain.
17. Stage 4B stimulus semantics remain.
18. Stage 3D focus semantics remain.
19. Scoring/norms/Check-Up logic remain unchanged.
20. Old missing-metadata records are not promoted or rewritten.
21. No unrelated product logic changes.

## Acceptance criteria

Do not mark Stage 5B complete unless all are true:

1. One authoritative planned focus-stimulus helper exists.
2. One authoritative completed focus-evidence helper exists.
3. Main-plan credit consumes both Stage 5A work evidence and Stage 5B focus evidence.
4. Supporting/fallback-only credit is closed.
5. No-primary plans are visible as partial/non-credit.
6. Rotation/week completion only consumes focus-credited completions.
7. Valid partial primary-focus sessions remain creditable.
8. Short-session behavior is tested.
9. Equipment/readiness/pain scenarios are tested.
10. Serialization/restore fails closed.
11. Backend sync does not promote non-credit attempts.
12. Stage 5A/4A/4B/3D regressions pass.
13. Targeted tests pass.
14. Full suite passes.
15. Typecheck passes.
16. Expo config passes.
17. `git diff --check` passes.
18. No new warning is introduced without explanation.
19. No unrelated user work is reverted or overwritten.
20. No commit, staging, branch, or push occurs.

## Stage decision

At the end of the report, state exactly one:

- STAGE 5B COMPLETE
- STAGE 5B BLOCKED

Also state:

- STAGE 5C REQUIRED
- STAGE 5D REQUIRED
- STAGE 5 REMEDIATION STILL REQUIRED
- BETA AUTOMATIC PLAN GENERATION BLOCKED
- STAGE 4 REMEDIATION STILL REQUIRED
- STAGE 3D-B REQUIRED

Stage 5B alone must not declare beta readiness because legacy fallback containment, progression authority/idempotency, canonical equipment state, and remote stimulus metadata remain unresolved.

## Final Codex response

Return a concise summary containing:

- Remediation report path.
- Whether production code changed.
- Primary-focus credit rule implemented.
- Planned focus-stimulus helper.
- Completed focus-evidence helper.
- Pre-session no-primary behavior.
- Supporting-only/fallback-only completion behavior.
- Short-session behavior.
- A/B/C rotation behavior.
- Files changed.
- Tests added/changed.
- Targeted validation result.
- Full-suite validation result.
- Typecheck result.
- Expo config result.
- `git diff --check` result.
- Confirmation that Stage 5A, Stage 4A/4B, and Stage 3D protections remain.
- F5-006 status.
- Remaining Stage 5 blockers.
- STAGE 5B COMPLETE or STAGE 5B BLOCKED.
- STAGE 5C REQUIRED.
- STAGE 5D REQUIRED.
- STAGE 5 REMEDIATION STILL REQUIRED.
- BETA AUTOMATIC PLAN GENERATION BLOCKED.
- STAGE 4 REMEDIATION STILL REQUIRED.
- STAGE 3D-B REQUIRED.
- Initial and final Git status.
- Any concurrent external changes.
- Confirmation that no commit, staging, branch, or push occurred.
