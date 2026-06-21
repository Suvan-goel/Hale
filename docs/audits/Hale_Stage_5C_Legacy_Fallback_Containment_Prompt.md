You are implementing Stage 5C of Hale’s production-readiness work:

LEGACY FALLBACK CONTAINMENT, STRUCTURED GENERATION-FAILURE STATES, CURRENT-PLANNER AUTHORITY, AND SAFE RECOVERY

This is a focused production-code remediation task following the Stage 5 audit, Stage 5A, Stage 5B, and Stage 5B.1 verification.

Do not begin Stage 5D, Stage 5E, Stage 5F, Stage 5G, Stage 5H, Stage 3D-B, further Stage 4 remediation, or beta-device validation in this task.

## Required prior reading

Read these documents in full before changing code:

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
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5B_1.md

Treat the current working tree as the source of truth. Re-verify every relevant path before editing because report line numbers and implementation details may no longer be exact.

## Current verified baseline

Stage 5A and Stage 5B are complete and Stage 5B.1 is verified.

The current verified contracts include:

- Only explicit active-block, block-generated, valid-template A/B/C events can count toward rotation.
- Non-training events do not advance A/B/C rotation.
- Week completion requires credited A, B, and C.
- All-skipped, empty, malformed, duplicate, unmatched, and missing-result attempts receive no main-plan credit.
- Explicit planning dates drive session/completion identity.
- A credited main-plan completion requires a completed planned exercise with:
  - `stimulusRole === 'primary'`;
  - `intendedDomain` matching the concrete active MovementBlock focus.
- Supporting-only, fallback-only, cross-domain-only, missing-metadata, and legacy-fallback sessions are non-credit.
- Persisted/restored rows with `mainPlanCredit: true` are not trusted unless positive primary-focus evidence is also present.
- Exact-tie and near-tie focus policy has already resolved the concrete MovementBlock focus.
- Stage 4A floor/stair/support gates and Stage 4B slot-stimulus semantics are authoritative.

Do not weaken or bypass any of these contracts.

## Confirmed finding being addressed

### F5-005 — P1

Dynamic generation failures can fall back to the legacy planner.

Historically confirmed triggers include:

- no active MovementBlock;
- dynamic generator throws;
- dynamic generator returns no exercises;
- generated output contains an unsupported exercise id;
- malformed or incomplete dynamic block state;
- missing or inconsistent progression state.

The old fallback path conceptually behaves like:

```text
planTodayHaleSession
-> dynamic generation fails or is unavailable
-> legacyFallbackPlan
-> nextSessionExercises(training)
-> legacy TrainingBlock / legacy progression / legacy equipment path
```

The legacy path does not reliably preserve the current contracts for:

- Stage 4A floor/stair/support safety gating;
- Stage 4B primary/supporting/fallback/skipped stimulus metadata;
- current pain/readiness handling;
- current explicit equipment semantics;
- current A/B/C source/template identity;
- Stage 5A main-plan identity;
- Stage 5B primary-focus credit potential.

Stage 5A and Stage 5B now prevent a legacy fallback session from receiving main-plan credit, but that is not enough.

A beta user must not be silently shown an outdated or semantically weaker session as if current dynamic planning succeeded.

Stage 5C must close F5-005.

## Approved Stage 5C product policy

The following policy is locked for this task.

### 1. The current dynamic planner is authoritative

For any user with a current active MovementBlock:

- the current dynamic planner is the only authoritative source for A/B/C main-plan sessions;
- a failure to produce a valid current dynamic plan must not invoke the legacy planner;
- a legacy plan must not be presented as a normal current planned session;
- a legacy plan must not be made creditable by adding current metadata around it.

### 2. Generation failure must be explicit and recoverable

When current dynamic generation cannot produce a valid plan, return a structured, user-safe non-session state.

The app should:

- preserve the active block;
- preserve the next A/B/C template;
- preserve progression state;
- preserve history;
- avoid any completion/progression mutation;
- show calm recovery copy;
- offer context-appropriate recovery actions;
- emit safe structured observability.

### 3. No active MovementBlock is not a training fallback case

If there is no active MovementBlock:

- do not generate a legacy main-plan session;
- return a structured `no_active_block` or equivalent state;
- route the user toward the appropriate lifecycle recovery:
  - baseline completion;
  - block creation;
  - restore/reload;
  - current official re-test flow;
  - support/help if state is inconsistent.

Do not infer an active current plan merely because a legacy TrainingBlock exists.

### 4. Legacy-only state is migration/recovery state

If a legacy TrainingBlock exists but no authoritative current MovementBlock exists:

- preserve the legacy record;
- do not use it to generate a current main-plan session;
- do not silently convert it on read;
- return a migration/recovery state;
- require restoration or creation of a current MovementBlock through the existing authoritative flow.

It is acceptable for historical legacy sessions to remain viewable.

It is not acceptable for them to steer current A/B/C training.

### 5. Current generator failure states must be typed

Use structured reason codes, not string parsing.

Conceptual reasons may include:

- `no_active_block`
- `invalid_active_block`
- `unsupported_focus_domain`
- `missing_template`
- `invalid_template`
- `generator_exception`
- `empty_generated_session`
- `unsupported_exercise_id`
- `invalid_generated_exercise`
- `missing_progression_state`
- `invalid_progression_state`
- `source_identity_mismatch`
- `no_safe_exercises`
- `no_primary_focus_available`
- `restore_incomplete`
- `legacy_only_state`

Adapt names to the codebase.

### 6. Safe partial/supporting plans remain distinct from generation failure

Do not classify every limited session as a generation failure.

A current dynamic plan may still be valid when it contains:

- safe supporting work;
- safe fallback work;
- explicit skipped slots;
- no primary-focus credit potential.

Stage 5B already marks such plans partial/non-credit.

Stage 5C must distinguish:

- valid current partial/supporting plan;
- invalid/unavailable dynamic generation;
- week complete;
- block complete;
- re-test due/prep;
- no active block.

### 7. Legacy fallback remains non-credit everywhere

Preserve Stage 5A/5B behavior:

- no main-plan credit;
- no A/B/C advancement;
- no week completion;
- no milestones;
- no block progression;
- no ladder progression;
- no credited main-plan sync.

Stage 5C should ideally remove the production route that creates new legacy fallback plans.

### 8. Existing historical legacy records remain readable

Do not delete or rewrite old legacy records.

On restore/read:

- preserve them as historical;
- classify them explicitly as legacy;
- keep them non-credit;
- do not use them as current plan input;
- do not synthesize current stimulus metadata from names or domains;
- do not silently upgrade them into current plans.

### 9. Current valid planning behavior must remain unchanged

For a valid active MovementBlock and valid dynamic output:

- A/B/C planning remains unchanged;
- focus semantics remain unchanged;
- equipment/safety gates remain unchanged;
- Stage 4B stimulus metadata remains unchanged;
- Stage 5A/5B credit potential remains unchanged;
- supplied planning date remains authoritative.

## Primary objective

Implement a fail-closed current-planner boundary so that:

1. Current MovementBlock sessions never silently fall back to legacy planning.

2. Every dynamic generation failure produces a structured non-session/recovery state.

3. No active-block and legacy-only states are explicit.

4. Invalid/unsupported generated exercise output fails closed.

5. Valid partial/supporting current plans remain usable as non-credit supporting sessions.

6. Week-complete/block-complete/retest states remain distinct from failures.

7. User-facing recovery copy is calm and specific.

8. Restore/sync cannot reintroduce a legacy fallback as a current plan.

9. Stage 5A/5B, Stage 4A/4B, and Stage 3D protections remain intact.

10. F5-005 is closed.

## Scope boundary

This task may change:

- `planTodayHaleSession` return contract;
- dynamic planning result/status types;
- legacy fallback call sites;
- lifecycle/session-start handling;
- Today/Plan/SessionPreview states required for explicit recovery;
- narrow structured recovery action metadata;
- observability;
- local serialization/restore normalization for current/legacy plan source;
- tests;
- the Stage 5C remediation report.

This task must not change:

- Stage 5D progression-authority policy;
- Stage 5E pain/readiness strategy;
- Stage 5F canonical equipment model;
- Stage 5G timing/lapse policy;
- Stage 4 exercise catalogue content;
- Stage 4A/4B safety/stimulus semantics;
- A/B/C template content;
- scoring;
- norms;
- Check-Up logic;
- score snapshots;
- exact/near focus policy;
- backend schema unless existing JSON metadata can carry a narrow status field;
- broad UI redesign;
- dependencies;
- assets.

Do not perform opportunistic refactors.

## Working-tree safety

Before analysis or editing:

1. Run:

   `git status --short --untracked-files=all`

   `git diff --name-only`

   `git diff --stat`

2. Record exact outputs in the remediation report.

3. Treat all existing modifications and untracked files as user-owned.

4. Inspect all current diffs in every file Stage 5C may touch.

5. Do not revert, overwrite, reformat, move, or delete unrelated work.

6. Do not edit prior reports.

7. Do not use destructive Git commands.

8. Do not install packages.

9. Do not stage, commit, create a branch, or push.

10. If unrelated files change:
    - record them;
    - do not overwrite them;
    - continue only when task-owned files remain safe;
    - otherwise stop code mutation and report the conflict.

## Step 1: Reconstruct the current dynamic and legacy planning paths

Before editing, inspect at minimum:

- App.tsx
- src/haleFlow/sessionPlanning.ts
- src/haleFlow/types.ts
- src/haleFlow/appLifecycle.ts
- src/haleFlow/planViewModel.ts
- src/haleFlow/mainPlanEvents.ts
- src/haleFlow/focusStimulusEvidence.ts
- src/training/workoutGeneration.ts
- src/training/block.ts
- src/training/state.ts
- src/training/progression.ts
- src/training/dynamicState.ts
- src/training/serialize.ts
- src/training/equipmentSafety.ts
- src/adherence/types.ts
- src/adherence/blockService.ts
- src/screens/TodayScreen.tsx
- src/screens/PlanScreen.tsx
- src/screens/SessionPreviewScreen.tsx
- src/screens/TrainingSessionScreen.tsx
- local/backend restore services;
- all Stage 5A/5B/5B.1 tests;
- all session-planning fallback tests.

Search for:

- `legacyFallbackPlan`
- `legacy_fallback`
- `nextSessionExercises`
- `buildBlock`
- `planTodayHaleSession`
- `generateTodaySession`
- `unsupported exercise`
- `empty session`
- `catch`
- `fallback`
- `source`
- `sourceKind`
- `week_complete`
- `block_complete`
- `retest_prep`
- `no active block`.

Document:

- every production legacy fallback entrypoint;
- every fallback trigger;
- fallback plan metadata;
- fallback main-plan credit state;
- fallback UI copy/badge;
- fallback persistence/sync behavior;
- which tests currently treat fallback as success;
- whether legacy-only states exist after restore;
- whether valid supporting-only current plans can be distinguished from errors.

Do not edit until this trace is complete.

## Step 2: Define one authoritative planning-result union

Create or harden a typed planning-result contract.

Conceptually:

```ts
type HaleSessionPlanningResult =
  | {
      kind: 'ready';
      plan: HaleSessionPlan;
      source: 'dynamic_current';
    }
  | {
      kind: 'supporting_session';
      plan: HaleSessionPlan;
      source: 'dynamic_current';
      mainPlanCreditPotential: false;
      reasons: string[];
    }
  | {
      kind: 'week_complete';
      blockId: string;
      week: number;
    }
  | {
      kind: 'block_complete';
      blockId: string;
    }
  | {
      kind: 'retest_due';
      blockId: string;
    }
  | {
      kind: 'unavailable';
      reason: GenerationUnavailableReason;
      blockId?: string;
      templateId?: string;
      recoveryActions: GenerationRecoveryAction[];
    };
```

Adapt to current architecture.

Requirements:

- Pure data.
- Exhaustive.
- No ambiguous null plan.
- No `legacy_fallback` current-ready case.
- Distinguish supporting current plan from unavailable generation.
- Distinguish lifecycle completion states from generation failures.
- Stable reason codes.
- Safe metadata only.
- Easy for callers/screens/tests to exhaustively handle.

If the code already uses another union/status model, extend it rather than creating a conflicting parallel model.

## Step 3: Remove current-plan legacy fallback

For users with an active current MovementBlock:

- do not call `legacyFallbackPlan` on dynamic error/empty/unsupported output;
- return structured `unavailable`;
- preserve the active block and next template;
- do not mutate completion/progression/history;
- do not create a session player plan;
- do not sync a session.

Apply this to triggers including:

1. Generator throws.

2. Generator returns null/undefined.

3. Generator returns zero exercises when it should return a session.

4. Generated exercise id is unregistered/unsupported.

5. Generated exercise metadata is malformed.

6. Generated template id does not belong to the block.

7. Focus/domain mapping is unsupported.

8. Source block mismatch.

9. Required progression state is invalid.

10. Adaptation fails.

Do not hide an exception by returning a legacy plan.

## Step 4: Handle no-active-block explicitly

When there is no active MovementBlock:

- return `unavailable: no_active_block` or a more lifecycle-specific result;
- do not use a legacy TrainingBlock to create an A/B/C session;
- do not return a current main-plan plan;
- expose recovery actions based on current lifecycle state where feasible:
  - complete baseline;
  - create block;
  - retry restore;
  - open Progress/Plan;
  - contact support/help.

Tests:

- no active MovementBlock, no legacy block;
- no active MovementBlock, legacy block exists;
- no active MovementBlock, incomplete official baseline;
- no active MovementBlock, complete eligible baseline but block not created;
- restore temporarily missing active block.

Do not duplicate lifecycle logic unnecessarily. Reuse authoritative lifecycle helpers.

## Step 5: Contain legacy-only state

If a legacy TrainingBlock exists without a current MovementBlock:

- classify as `legacy_only_state`;
- preserve historical data;
- no current A/B/C session;
- no legacy player launch;
- no main-plan credit;
- no silent migration;
- no block creation from stale/raw evidence.

Provide a calm recovery state.

Suggested copy:

- “Your previous plan needs to be refreshed before Hale can safely plan today’s session.”
- “Your history is still saved. Complete the current plan setup to continue.”

Do not call it corruption.

## Step 6: Validate generated output before adaptation

Create or harden one pure validator for raw dynamic generation output.

Validate at minimum:

- expected active block id;
- expected template id;
- supported focus domain;
- known session status;
- known exercise ids;
- unique exercise ids where required;
- finite positive sets/reps/holds/rest;
- structured Stage 4B intended-domain and stimulus role;
- equipment/safety eligibility;
- source identity;
- date/planning identity;
- no empty session for a `session_due` result;
- no unsupported optional/release level;
- no contradictory skipped/selected slot metadata.

Output conceptually:

```ts
type GeneratedSessionValidation =
  | { valid: true; generated: GeneratedSession }
  | {
      valid: false;
      reason: GenerationUnavailableReason;
      issues: GeneratedSessionIssue[];
    };
```

Requirements:

- Pure.
- Deterministic.
- No mutation.
- Stable issue codes.
- No raw sensitive data.
- Reuses Stage 4A equipment safety and Stage 4B stimulus semantics.
- Does not silently repair unsupported exercise ids.

## Step 7: Preserve valid supporting/partial dynamic plans

A current dynamic plan may have:

- one or more safe exercises;
- no playable primary focus;
- `mainPlanCreditPotential: false`;
- supporting/fallback/skipped stimulus metadata.

This is not necessarily a generator failure.

Required:

- return a structured `supporting_session` or existing equivalent;
- preview says it is supporting/partial and non-credit;
- user may complete it if current product permits;
- Stage 5B completion remains non-credit;
- it must not be converted into `unavailable` merely because no primary focus exists;
- it must not be converted into a legacy plan.

Tests must distinguish:

- valid supporting plan;
- empty invalid plan;
- unsupported exercise plan;
- no-active-block state.

## Step 8: Preserve week/block/re-test statuses

Verify that current generator lifecycle outputs remain distinct:

- session due;
- week complete;
- block complete;
- re-test prep/due;
- supporting session;
- unavailable.

Do not route week complete or block complete into legacy fallback.

Do not create an unavailable state merely because no exercise is generated for an intentional lifecycle status.

Add direct tests for each status.

## Step 9: Update App/session-start orchestration

Update callers to handle the planning-result union exhaustively.

For `ready`:

- begin current session normally.

For `supporting_session`:

- show supporting preview;
- preserve non-credit potential.

For `week_complete` / `block_complete` / `retest_due`:

- preserve existing lifecycle behavior.

For `unavailable`:

- do not open TrainingSessionScreen;
- do not write session history/completion;
- show recovery UI/state;
- preserve current active block;
- allow retry.

Do not use a broad catch that converts unavailable back into legacy.

## Step 10: User-facing recovery states

Add narrow, calm copy for:

### Generator exception / invalid output

- “Hale couldn’t safely prepare today’s session.”
- “Your plan has not changed.”
- “Try again, or review your setup.”

### Unsupported exercise/configuration

- “Today’s session needs to be refreshed before it can start.”
- “Your plan is unchanged.”

### No active current block

- “Hale needs an active current plan before it can prepare today’s session.”

### Legacy-only state

- “Your previous plan needs to be refreshed before Hale can safely continue.”

### No safe exercises

- “Hale couldn’t find a safe exercise combination for today’s setup.”
- “Review your equipment, readiness, or discomfort selections.”

Tone:

- calm;
- non-blaming;
- non-technical;
- no “corrupt”;
- no shame;
- no lost-streak language.

Do not redesign the screen.

## Step 11: Observability

Emit safe structured diagnostics for:

- dynamic generator exception;
- empty generated session;
- unsupported exercise id;
- invalid generated exercise;
- template mismatch;
- source block mismatch;
- no active block;
- legacy-only state;
- invalid progression state;
- no safe exercises;
- adaptation failure.

Include only:

- reason/issue code;
- block id/template id where safe;
- planning date key;
- focus domain;
- exercise ids if already non-sensitive and necessary;
- app/session source.

Exclude:

- pose frames;
- landmarks;
- video;
- raw health/profile text;
- auth data;
- raw payload dumps.

Do not log expected week-complete/block-complete states as errors.

Keep validators pure.

## Step 12: Local serialization and restore

Ensure current planning-source state remains explicit:

- current dynamic plan;
- current supporting dynamic plan;
- historical legacy plan;
- unavailable result, if persisted at all;
- non-credit legacy attempt.

Requirements:

- old `legacy_fallback` plans remain historical;
- restore does not present them as current ready plans;
- missing source metadata fails closed;
- source/block/template mismatch fails closed;
- read does not rewrite old records;
- no current plan is synthesized from a legacy TrainingBlock;
- current dynamic summaries preserve Stage 4B/5B metadata.

Do not persist transient errors unless current architecture benefits from a compact diagnostic entry.

## Step 13: Backend sync and restore

Verify:

- no unavailable planning result syncs as a training completion;
- no newly generated legacy fallback plan syncs;
- historical legacy records remain non-credit;
- restore cannot promote legacy fallback into current ready session;
- current dynamic/supporting summaries retain source and stimulus metadata;
- source identity mismatches fail closed;
- duplicate sync retry remains idempotent.

Do not add a schema migration unless necessary. Prefer existing JSON metadata.

## Step 14: Remove or quarantine legacy fallback helpers

After current production callers are removed:

- determine whether `legacyFallbackPlan` / legacy resolver remains needed for:
  - historical display;
  - explicit migration tests;
  - developer tools;
  - old schema parsing.

Options:

A. Remove it if truly unused.

B. Keep it private and migration/test-only.

C. Rename to make non-production intent explicit.

Requirements:

- no current main-plan production entrypoint calls it;
- tests do not normalize it as successful current planning;
- source remains `legacy_fallback` for old historical records;
- Stage 5A/5B classifiers keep it non-credit.

Do not remove legacy block persistence broadly; Stage 5D/F may still need to address parallel state.

## Step 15: Update existing fallback tests

Tests that currently expect a legacy fallback as successful behavior must be changed.

Replace with assertions that:

- the failure reason is structured;
- no session player plan is returned;
- active block remains unchanged;
- no credit/progression mutation occurs;
- recovery actions exist;
- observability receives a safe code;
- valid supporting current plans remain distinct.

Do not delete useful historical-compatibility tests.

## Required automated test matrix

### A. Valid dynamic planning

- clear focus A/B/C.
- exact-tie concrete focus.
- near-tie preserved focus.
- full equipment.
- equipment-limited supporting plan.
- valid short plan.
- week complete.
- block complete.
- re-test due/prep.

### B. Failure triggers

- no active block.
- legacy-only block.
- generator throws.
- generator returns null/undefined.
- generator returns empty session for session-due.
- unsupported exercise id.
- duplicate exercise id where prohibited.
- malformed generated exercise dose.
- missing stimulus metadata.
- invalid template id.
- wrong block id.
- unsupported focus.
- invalid progression state.
- adaptation failure.
- no safe exercises.

For every failure:

- no legacy ready plan;
- structured reason;
- no TrainingSessionScreen launch;
- no completion/progression mutation;
- recovery action;
- safe observability.

### C. Supporting-plan distinction

- no-primary but safe supporting exercises.
- supporting/fallback/skipped metadata preserved.
- non-credit potential false.
- preview remains available.
- no legacy conversion.

### D. Lifecycle status distinction

- week complete not treated as error.
- block complete not treated as error.
- re-test due not treated as error.
- no active block treated as recovery.
- current session due with invalid output treated as unavailable.

### E. Legacy history

- old legacy fallback summary remains readable.
- old legacy completion remains non-credit.
- restore does not create current plan.
- names/domains do not infer current eligibility.
- no read-time rewrite.

### F. Serialization/backend

- current dynamic source round-trip.
- supporting current source round-trip.
- legacy historical source round-trip.
- unavailable does not sync as completion.
- source mismatch fails closed.
- no promotion on restore.

### G. Regression

- Stage 5A main-plan event/zero-work/date behavior.
- Stage 5B primary-focus credit.
- Stage 4A safety gates.
- Stage 4B stimulus roles.
- Stage 3D focus semantics.
- Stage 3A/3B/3C protections.
- scoring/norms unchanged.

## Test-quality requirements

Tests must:

- exercise real planning entrypoints;
- exercise real generation validation;
- exercise actual App/extracted orchestration where practical;
- assert absence of a returned legacy ready plan;
- assert state non-mutation;
- assert valid supporting plans remain distinct;
- fail if legacy fallback is reintroduced;
- preserve historical legacy readability.

Tests must not:

- mock the generator at every layer;
- assert only helper invocation;
- implement Stage 5D progression authority;
- implement Stage 5E pain/readiness policy;
- change exercise content;
- change scoring/norms;
- depend on network;
- depend on wall-clock sleeps.

Use deterministic dates, ids, blocks, templates, and generator outputs.

## Validation commands

Run targeted tests for:

- session planning;
- generated-session validation;
- workout generation;
- mainPlanEvents;
- focusStimulusEvidence;
- sessionWorkEvidence;
- app/extracted session-start orchestration;
- Today/Plan/SessionPreview states;
- training serialization/store;
- backend training-state/session sync/restore;
- Stage 5A/5B/5B.1 regression;
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

### Valid current plan

```text
active MovementBlock
-> dynamic generator
-> validator
-> current ready/supporting result
-> preview
```

Confirm no legacy path.

### Generator exception

```text
active MovementBlock
-> generator throws
-> structured unavailable result
-> recovery UI
```

Confirm block/session history unchanged.

### Unsupported exercise

Confirm fail closed rather than legacy.

### No active block

Confirm lifecycle recovery rather than legacy.

### Legacy-only state

Confirm historical preservation and no current session.

### Supporting plan

Confirm it remains current/supporting/non-credit, not unavailable or legacy.

## Remediation report

Create exactly one new report:

docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5C.md

Do not edit prior reports.

The report must contain:

1. Scope.
2. Initial Git status.
3. Finding addressed: F5-005.
4. Findings deferred: F5-007, F5-008, F5-009 and later Stage 5 work.
5. Approved current-planner policy.
6. Dynamic/legacy architecture before remediation.
7. Planning-result union.
8. Generated-output validation contract.
9. Valid current plan behavior.
10. Supporting current plan behavior.
11. No-active-block behavior.
12. Legacy-only behavior.
13. Generator-exception behavior.
14. Empty/unsupported/malformed-output behavior.
15. Week/block/re-test status behavior.
16. App/session-start orchestration.
17. Recovery UI/copy.
18. Observability.
19. Local serialization/restore.
20. Backend sync/restore.
21. Legacy helper removal/quarantine.
22. Files changed.
23. Tests added/changed.
24. Exact validation results.
25. Stage 1–5B.1 regression verification.
26. Remaining Stage 5 blockers.
27. F5-005 status.
28. Whether Stage 5D is unblocked.
29. Whether beta automatic plan generation remains blocked.
30. Initial and final Git status.
31. Concurrent external changes.
32. Confirmation that no commit/staging/branch/push occurred.

## Required invariant outcomes

After Stage 5C:

1. Current dynamic generation never silently falls back to legacy.
2. No active MovementBlock returns explicit recovery, not legacy session.
3. Legacy-only state returns explicit recovery, not current session.
4. Generator exceptions return explicit unavailable state.
5. Empty session-due output fails closed.
6. Unsupported exercise id fails closed.
7. Malformed generated exercise fails closed.
8. Template/block/source mismatch fails closed.
9. Invalid progression state fails closed where unsafe.
10. Valid supporting current plans remain available as non-credit.
11. Week-complete/block-complete/retest states remain distinct.
12. Unavailable states do not launch the player.
13. Unavailable states do not mutate history/progression/credit.
14. Historical legacy records remain readable.
15. Historical legacy records remain non-credit.
16. Restore cannot promote legacy into current plan.
17. Backend sync cannot create credited legacy/current fallback completion.
18. Stage 5A event/zero-work/date gates remain.
19. Stage 5B primary-focus credit remains.
20. Stage 4A safety gates remain.
21. Stage 4B stimulus metadata remains.
22. Stage 3D focus semantics remain.
23. No scoring/norm/Check-Up changes.
24. No unrelated product logic changes.

## Acceptance criteria

Do not mark Stage 5C complete unless:

1. One authoritative planning-result union exists.

2. One authoritative generated-output validator exists or equivalent fail-closed validation is centralized.

3. No current production entrypoint returns a new legacy fallback plan.

4. No-active-block and legacy-only states are explicit.

5. Generator exceptions/empty/unsupported/malformed outputs fail closed.

6. Valid supporting plans remain distinct and usable as non-credit.

7. Callers handle planning results exhaustively.

8. Recovery UI/copy is present and calm.

9. Historical legacy records remain readable/non-credit.

10. Restore/sync cannot promote fallback.

11. Stage 5A/5B/5B.1 regressions pass.

12. Stage 4A/4B and Stage 3D regressions pass.

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

- STAGE 5C COMPLETE
- STAGE 5C BLOCKED

Also state exactly one:

- STAGE 5D UNBLOCKED
- STAGE 5D BLOCKED

Use `STAGE 5D UNBLOCKED` only if no P0/P1 legacy fallback gap remains.

Also state:

- STAGE 5D REQUIRED
- STAGE 5 REMEDIATION STILL REQUIRED
- BETA AUTOMATIC PLAN GENERATION BLOCKED
- STAGE 4 REMEDIATION STILL REQUIRED
- STAGE 3D-B REQUIRED

Stage 5C must not declare beta readiness. Progression authority/idempotency, canonical equipment state, remote metadata, and later Stage 5 policy work remain.

## Final Codex response

Return a concise summary containing:

- Remediation report path.
- Whether production code changed.
- Current-planner authority rule.
- Planning-result union.
- Generated-output validation behavior.
- No-active-block behavior.
- Legacy-only behavior.
- Generator-exception behavior.
- Empty/unsupported/malformed-output behavior.
- Supporting current-plan behavior.
- Week/block/re-test behavior.
- Recovery UI/copy.
- Legacy helper removal/quarantine.
- Files changed.
- Tests added/changed.
- Targeted validation result.
- Full-suite validation result.
- Typecheck result.
- Expo config result.
- `git diff --check` result.
- Confirmation that Stage 5A/5B/5B.1, Stage 4A/4B, and Stage 3D protections remain.
- F5-005 status.
- Remaining Stage 5 blockers.
- STAGE 5C COMPLETE or STAGE 5C BLOCKED.
- STAGE 5D UNBLOCKED or STAGE 5D BLOCKED.
- STAGE 5D REQUIRED.
- STAGE 5 REMEDIATION STILL REQUIRED.
- BETA AUTOMATIC PLAN GENERATION BLOCKED.
- STAGE 4 REMEDIATION STILL REQUIRED.
- STAGE 3D-B REQUIRED.
- Initial and final Git status.
- Any concurrent external changes.
- Confirmation that no commit, staging, branch, or push occurred.
