You are implementing Stage 5A of Pearl’s production-readiness work:

MAIN-PLAN EVENT CLASSIFICATION, A/B/C ROTATION INTEGRITY, ZERO-WORK CREDIT PREVENTION, MISSING-RESULT HARDENING, AND PLANNED-DATE DETERMINISM

This is a focused production-code remediation task following the Stage 5 dynamic workout-generation audit.

Do not begin Stage 5B, Stage 5C, Stage 5D, Stage 5E, Stage 5F, Stage 5G, Stage 5H, Stage 3D-B, further Stage 4 remediation, or beta-device validation in this task.

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

Treat the current working tree as the source of truth. Re-verify every relevant path before editing because report line numbers and implementation details may no longer be exact.

## Stage 5 audit baseline

Stage 5 was a read-only audit. It concluded:

- STAGE 5 REMEDIATION REQUIRED.
- BETA AUTOMATIC PLAN GENERATION BLOCKED.
- Stage 4 remediation still has later cueing/pain/progression work.
- Stage 3D-B norm provenance remains required before public beta.

Stage 5 confirmed these defects:

### F5-001 — P0

Non-training events can contaminate dynamic A/B/C rotation and make a week appear complete.

Examples include:

- micro-check completions;
- Explore preset sessions;
- manual ladder practice;
- other summaries carrying the active block id without being a genuine block-generated A/B/C main-plan session.

### F5-002 — P0

A session where every exercise was skipped can still receive main-plan completion credit.

### F5-003 — P1

Missing exercise results default to completed for ladder progression.

### F5-004 — P1

Generated completion keys use the ambient current date rather than the explicit planning date.

Other Stage 5 findings intentionally deferred:

- F5-005 legacy fallback containment;
- F5-006 minimum primary-focus stimulus requirement;
- F5-007 parallel progression systems;
- F5-008 canonical equipment source;
- F5-009 backend stimulus metadata preservation.

Stage 5A must close F5-001, F5-002, F5-003, and F5-004 without implementing the deferred batches.

## Approved product rules for Stage 5A

These rules are locked for this task.

### 1. Only genuine main-plan training advances A/B/C rotation

A record counts toward main-plan A/B/C rotation only when all are true:

- it belongs to the active MovementBlock;
- it is a block-generated main-plan training session;
- it has a valid A/B/C template identity for that block;
- it is a supported main-plan session type;
- it earned main-plan completion credit under the Stage 5A work-evidence gate;
- it is not a duplicate of an already-counted completion.

Supported main-plan types may include the existing block-generated equivalents of:

- starter;
- standard;
- restart;
- short main-plan session, if the current product already treats it as a main-plan session.

Do not infer a supported type from the presence of a block id alone.

The following must never advance A/B/C rotation or week completion:

- micro-check;
- official re-test;
- re-test prep;
- manual Check-Up;
- quick recheck;
- Explore preset/extra session;
- manual ladder practice;
- optional practice;
- debug/development session;
- unsupported or unknown session source;
- legacy fallback session until Stage 5C explicitly defines its policy;
- a main-plan attempt that did not earn credit.

### 2. Week completion requires credited A, B, and C

A week is complete only after the current block/week has one credited completion for each required A/B/C template.

Do not use “three arbitrary rows” as week completion.

Duplicate completion of A must not substitute for B or C.

Out-of-order completion may be preserved if the product permits it, but the next-session algorithm must still derive the missing template deterministically.

### 3. Zero-work sessions do not earn main-plan credit

A main-plan session requires at least one genuinely completed planned exercise item to earn credit in Stage 5A.

The following earn zero main-plan credit:

- all exercises skipped;
- no session result;
- empty result items;
- every result missing;
- every result malformed;
- only cancelled/abandoned items;
- a result that cannot be matched to any planned exercise.

This is a minimum floor only.

Stage 5B will decide whether a session must also contain completed primary focus-domain stimulus.

Do not implement that Stage 5B rule in this task.

### 4. Partial sessions may still receive current partial/main credit

For this narrow Stage 5A batch:

- if at least one planned exercise is genuinely completed, preserve the current partial-session credit policy;
- do not invent a percentage threshold;
- do not require primary focus stimulus yet;
- do not silently count missing items as completed.

The report must clearly note that Stage 5B still needs to define minimum primary-focus stimulus and minimum prescribed-dose policy.

### 5. Missing evidence fails closed

For progression and work evidence:

- a planned exercise with no matching result is incomplete/unknown;
- missing session result means zero completed items;
- malformed result means incomplete/unknown;
- skipped result means not completed;
- only explicit valid completed result counts as completed;
- duplicate result entries for one exercise fail closed for that exercise unless the current player provides an authoritative unique identity.

Do not infer completion from the user reaching the completion screen.

### 6. Non-credit attempts may still be preserved

An all-skipped or zero-work attempt may still be retained for:

- history;
- observability;
- calm user recovery;
- debugging;
- setup-quality review.

But it must not:

- increment main-plan session count;
- advance A/B/C rotation;
- complete the week;
- advance the block;
- create milestones;
- progress exercise ladders;
- count as adherence training completion;
- trigger re-test due status.

Use existing attempt/skipped/non-counting structures where possible.

Do not create a broad new event-sourcing architecture.

### 7. Explicit planning date is authoritative

When `planTodayPearlSession` or equivalent receives an explicit planning date:

- generated session ids/date keys;
- `plannedDateKey`;
- completion identity;
- main-plan dedupe key;
- summary date metadata

must derive from that supplied planning date under one documented date-key policy.

Do not call `new Date()` inside adaptation merely to generate a planned date key.

The runtime current clock may be used only when no explicit planning date exists and the entrypoint contract permits that default.

### 8. Unknown/legacy records fail closed for rotation

Old records without enough type/source/template/credit metadata must not become A/B/C training events merely because they have:

- an active block id;
- status completed;
- a timestamp;
- an exercise list.

Preserve them historically, but exclude them from current rotation unless there is a safe, explicit migration rule.

### 9. One authoritative main-plan event contract

Create one pure, reusable contract used by:

- recent-session adaptation;
- A/B/C template selection;
- week-completion calculation;
- main-plan completion credit;
- progression evidence filtering where applicable in this scope;
- serialization/restore normalization where necessary;
- tests.

Do not leave independent ad hoc definitions of “main plan” in App, PearlFlow, adherence, and training.

## Primary objective

Implement a single fail-closed main-plan training event and work-evidence boundary so that:

1. Non-training events cannot influence A/B/C rotation.

2. Three non-training events cannot complete a week.

3. All-skipped sessions cannot receive main-plan credit.

4. Missing exercise results cannot progress ladders.

5. Duplicate completions cannot double-advance rotation.

6. Explicit planning dates remain deterministic through completion identity.

7. Current valid main-plan sessions preserve existing behavior.

8. Stage 4A/4B safety and stimulus metadata remains intact.

9. Stage 1–3D protections remain intact.

## Scope boundary

This task may change:

- session/event type metadata;
- recent-session adaptation;
- template-selection filtering;
- week-completion calculation;
- main-plan credit helper;
- session result work-evidence helper;
- completion orchestration in App or extracted pure helper;
- adherence completion recording boundaries;
- missing-result mapping for ladder progression;
- planned date/date-key propagation;
- local serialization/normalization required for these fields;
- narrow backend sync/restore normalization if needed to preserve event type/credit/date;
- tests;
- the Stage 5A remediation report.

This task must not change:

- Stage 5B primary-focus stimulus threshold;
- Stage 5C legacy fallback containment;
- Stage 5D parallel progression architecture/idempotency beyond duplicate rotation filtering;
- Stage 5E pain/readiness policy;
- Stage 5F broad persistence/equipment canonicalization;
- Stage 5G block timing/lapse policy;
- exercise definitions;
- Stage 4 catalogue semantics;
- scoring formulas;
- norms;
- Check-Up logic;
- score snapshots;
- focus-selection policy;
- broad UI design;
- backend schema unless existing JSON metadata can carry required fields;
- dependencies;
- assets.

Do not perform opportunistic refactors.

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

6. Do not edit previous audit/remediation reports.

7. Do not use destructive Git commands.

8. Do not install packages.

9. Do not stage, commit, create a branch, or push.

10. If unrelated files change during the task:
    - record them;
    - do not overwrite them;
    - continue only if task-owned files remain safe;
    - otherwise stop code mutation and report the conflict.

## Step 1: Reconstruct current rotation and completion architecture

Before editing, inspect at minimum:

- App.tsx
- src/pearlFlow/sessionPlanning.ts
- src/pearlFlow/types.ts
- src/training/workoutGeneration.ts
- src/training/sessionPlayer.ts
- src/training/dynamicState.ts
- src/training/serialize.ts
- src/training/state.ts
- src/training/progression.ts
- src/adherence/types.ts
- src/adherence/adherenceService.ts
- src/adherence/dateUtils.ts
- src/adherence/blockService.ts
- src/screens/TrainingSessionScreen.tsx
- src/adherence/screens/SessionCompletionScreen.tsx
- relevant backend session/training-state sync and restore files
- all tests related to session planning, rotation, completion, progression, store, sync, and restore.

Document:

- current session type union;
- current source/sourceKind fields;
- current templateId/sessionId/blockId/week fields;
- current `countsTowardMainPlan` logic;
- current recent-session adapter;
- current A/B/C selection logic;
- current week-complete calculation;
- current completion result shape;
- current item status values;
- current all-skipped behavior;
- current adherence completion shape;
- current generated summary shape;
- current progression result mapping;
- current planned-date/date-key path;
- current dedupe keys.

Do not edit until this trace is complete.

## Step 2: Add one authoritative main-plan training event classifier

Create a pure helper in the narrowest appropriate module, conceptually:

```ts
type MainPlanEventClassification =
  | {
      countsForRotation: true;
      countsForWeekCompletion: true;
      countsForMainPlanCredit: true;
      blockId: string;
      week: number;
      templateId: string;
      sessionType: SupportedMainPlanSessionType;
      creditId: string;
    }
  | {
      countsForRotation: false;
      countsForWeekCompletion: false;
      countsForMainPlanCredit: false;
      reason: MainPlanExclusionReason;
    };
```

Adapt to the codebase.

Possible exclusion reasons:

- `non_training_event`
- `extra_session`
- `manual_practice`
- `micro_check`
- `official_retest`
- `retest_prep`
- `unknown_session_type`
- `legacy_fallback`
- `wrong_block`
- `missing_template`
- `invalid_template`
- `no_work_credit`
- `duplicate_completion`
- `malformed_event`

Requirements:

- Pure.
- Deterministic.
- Fail closed.
- Explicitly block-scoped.
- Explicitly template-scoped.
- Explicitly credit-scoped.
- Does not infer from block id alone.
- Reusable by completion and planning paths.
- Stable reason codes.
- No sensitive data.

## Step 3: Define valid A/B/C template identity

Create or harden one helper that determines whether a template id belongs to the active block’s required A/B/C set.

Requirements:

- Uses the active block’s actual templates where possible.
- Does not accept arbitrary strings ending in A/B/C.
- Stable under restore.
- Supports focus-specific template IDs.
- A duplicated A completion remains A.
- An unknown template is excluded.
- A template from another block is excluded.
- Legacy fallback template IDs are excluded in Stage 5A.

Add direct tests for every focus domain’s A/B/C IDs.

## Step 4: Filter recent sessions through the authoritative contract

Update `recentSessionsFor` or equivalent so it emits rotation evidence only from credited main-plan events.

Requirements:

- Filter adherence completions.
- Filter generated session summaries.
- Exclude non-training types/sources.
- Exclude wrong block.
- Exclude missing/unknown template.
- Exclude no-credit/all-skipped attempts.
- Exclude legacy fallback.
- Dedupe repeated evidence by stable completion/event identity.
- Preserve deterministic ordering.
- Do not allow generated summary plus adherence completion for the same session to count twice.
- Preserve the best authoritative record if both local representations exist.

Add tests for:

- micro-check after A does not advance.
- preset after A does not advance.
- manual practice after A does not advance.
- re-test prep after A does not advance.
- official re-test does not advance.
- duplicate A in two stores counts once.
- wrong-block A does not advance.
- unknown legacy row does not advance.
- valid main A advances to B.

## Step 5: Make week completion template-based

Update `getTemplateSelection` or equivalent.

Required behavior:

- No credited templates -> A.
- Credited A -> B.
- Credited A and B -> C.
- Credited A/B/C -> week complete.
- A/C -> B.
- B only -> A, unless existing product intentionally chooses another deterministic missing-template order; document it.
- Duplicate A does not increase completed count.
- Three non-training events -> still A.
- Three duplicate A completions -> still missing B/C.
- Completion records from another week do not complete current week.
- Completion records from another block do not count.
- Week completion is derived from the required template set, not raw row count.

Keep block-complete logic consistent with credited main-plan templates/sessions.

Do not redesign the whole four-week timing model in Stage 5A.

## Step 6: Add one authoritative session work-evidence helper

Create a pure helper that evaluates the planned session and its runtime result.

Conceptually:

```ts
type SessionWorkEvidence = {
  plannedItemCount: number;
  matchedResultCount: number;
  completedItemCount: number;
  skippedItemCount: number;
  unknownItemCount: number;
  malformedItemCount: number;
  hasAnyCompletedWork: boolean;
  allSkippedOrUnknown: boolean;
  duplicateExerciseIds: string[];
  unmatchedResultIds: string[];
};
```

Requirements:

- Match results to planned exercise ids.
- A valid explicit completed result counts.
- A skipped result does not count.
- Missing result is unknown/incomplete.
- Malformed result is unknown/incomplete.
- Duplicate result entries for one planned exercise fail closed for that exercise.
- Unmatched result entries do not create credit.
- Empty/null result means zero completed work.
- Pure and deterministic.
- Does not mutate inputs.
- Does not inspect Stage 4B primary stimulus for credit yet.

Use the actual current result status/types rather than inventing incompatible terms.

## Step 7: Gate main-plan completion credit

Update the completion boundary in App or extract a narrow orchestration helper.

Required behavior:

### Credited main-plan completion

Only when:

- plan/session is classified as a supported block-generated main-plan session;
- active block/source identity matches;
- work evidence has at least one genuinely completed planned exercise;
- completion has not already been credited.

Then and only then:

- record legacy/main training completion under current architecture;
- record adherence training completion;
- create milestone/week credit;
- allow rotation advancement;
- allow progression evidence mapping;
- sync as credited main-plan completion.

### Zero-work/non-credit attempt

When all skipped, empty, missing, malformed, or unmatched:

- do not increment main-plan progress;
- do not add credited adherence completion;
- do not advance rotation;
- do not trigger milestone/week completion;
- do not progress ladder;
- do not trigger re-test due state;
- may store a non-credit attempt/summary if architecture supports it;
- show calm recovery copy using existing flow where possible.

Do not silently drop the attempt if preserving it is easy.

Do not add a large UI redesign.

## Step 8: Preserve valid partial-session behavior

For this stage:

- one or more completed planned exercises can preserve current main-plan credit behavior;
- other missing/skipped items remain missing/skipped;
- do not mark missing items completed;
- do not invent a completion percentage threshold;
- do not require primary focus stimulus yet.

Add comments/tests clearly marking the remaining Stage 5B decision.

## Step 9: Harden missing-result progression mapping

Update `completedExerciseResultsForPlan` or equivalent.

Required behavior:

- matching completed item -> existing completion result.
- matching skipped item -> zero/incomplete.
- missing item -> zero/incomplete/unknown, never completed.
- null session result -> all planned items incomplete.
- duplicate matching items -> fail closed for that exercise.
- malformed item -> incomplete.
- supporting/fallback roles remain preserved for Stage 5B/5D but do not gain completion from missing data.

Add tests proving:

- missing planned exercise cannot emit `completionRate: 1`.
- partial result only credits present completed items.
- null result does not progress.
- all skipped does not progress.
- easy RPE plus missing result does not progress.
- completed result still progresses under existing criteria.

## Step 10: Planned-date determinism

Trace `today`/planning date from entrypoint to completion identity.

Required behavior:

- `planTodayPearlSession({ today })` passes the date to adaptation.
- Generated plan metadata stores a date key derived from that date.
- Completion planned date uses the same key.
- Dedupe identity uses the supplied date key.
- Same explicit input date produces the same planned date key regardless of ambient clock.
- Current date is used only when no explicit date was supplied.
- Timezone/date-key policy is documented and consistent with existing app behavior.

Remove any ambient `new Date()` inside the adaptation path where explicit date already exists.

Tests:

- historical explicit date.
- future explicit date.
- date different from system date.
- same explicit date generated twice.
- midnight boundary using injected dates.
- completion id/date key matches plan metadata.
- no regression for normal current-day planning.

## Step 11: Serialization and restore normalization

Ensure the fields required for classification survive local serialization and restore:

- session type;
- source/source kind;
- block id;
- template id;
- week;
- planned date;
- counts/main-credit outcome or equivalent;
- completion/event identity.

Requirements:

- New records preserve exact metadata.
- Missing legacy metadata fails closed for rotation.
- Reading old records does not invent main-plan credit.
- No read-time rewrite solely to promote legacy rows.
- Duplicated local/remote representations dedupe safely in the recent-session adapter.

Do not perform broad persistence migration in this task.

## Step 12: Backend sync boundaries

If backend sync currently stores credited training completions:

- ensure zero-work attempts are not synced as credited main-plan completions;
- preserve exact session type/source/template/planned date where existing JSON allows;
- restore cannot promote an unknown/non-credit row into main-plan rotation evidence;
- duplicate sync retry does not create duplicate rotation evidence.

Do not add a database migration unless absolutely necessary.

Stage 5A may use existing JSON metadata.

## Step 13: User-facing zero-work recovery

Inspect the completion screen/result flow.

Required behavior:

- all-skipped attempt does not show a false “session completed” main-plan milestone;
- copy remains calm and non-blaming;
- suggest retrying later, adjusting setup, or choosing a shorter/simpler session where current architecture supports it;
- no lost-streak/shame language;
- do not claim the week advanced.

Suitable copy:

- “This session didn’t record enough completed work to move your plan forward.”
- “Your plan is unchanged. You can retry when you’re ready.”
- “Pearl saved the attempt, but it did not count as a planned session.”

Use existing tone and components.

Do not perform broad visual redesign.

## Step 14: Add observability

At high-trust boundaries, emit safe structured diagnostics for:

- non-training event excluded from rotation;
- duplicate event deduped;
- all-skipped main-plan attempt denied credit;
- missing result denied progression;
- malformed result denied progression;
- legacy/unknown row excluded;
- planned-date mismatch prevented.

Include only:

- stable reason code;
- block id/session id where already safe;
- session type/source;
- template id;
- completed/skipped/unknown counts;
- planned date key.

Exclude raw pose data, video, landmarks, profile text, auth data, and raw sensitive payloads.

Keep pure helpers side-effect free.

## Required automated test matrix

### A. Main-plan event classifier

For each type/source:

- block-generated starter;
- block-generated standard;
- block-generated restart;
- short main-plan;
- preset/extra;
- manual ladder practice;
- micro-check;
- official re-test;
- re-test prep;
- manual Check-Up;
- quick recheck;
- legacy fallback;
- unknown;
- debug.

Assert exact inclusion/exclusion reason.

### B. Rotation sequences

- none -> A.
- A -> B.
- A,B -> C.
- A,B,C -> week complete.
- A,C -> B.
- B -> A.
- duplicate A -> B, not C/week complete.
- A in adherence + same A summary -> B.
- three micro-checks -> A.
- preset + manual + micro-check -> A.
- wrong-block A -> A.
- unknown legacy completed row -> A.
- valid A plus non-training rows -> B.
- current-week filtering.

### C. Work evidence

- all completed.
- one completed, rest skipped.
- one completed, rest missing.
- all skipped.
- null result.
- empty items.
- malformed result.
- unmatched result.
- duplicate result for one exercise.
- missing planned item.
- cancelled/abandoned if represented.
- input not mutated.

### D. Completion credit

- valid main session with work -> credited once.
- all-skipped main session -> no credit.
- empty result -> no credit.
- preset with work -> no main-plan credit.
- manual practice with work -> no main-plan credit.
- micro-check -> no main-plan credit.
- legacy fallback -> no main-plan credit in Stage 5A.
- duplicate completion -> no double credit.
- wrong block -> no credit.
- zero-work attempt may be stored as non-credit attempt.

### E. Progression mapping

- completed item maps correctly.
- skipped item does not progress.
- missing item does not progress.
- null session result does not progress.
- duplicate item fails closed.
- easy RPE plus missing item does not progress.
- valid complete evidence preserves current progression behavior.

### F. Planned date

- explicit date different from current date.
- future date.
- historical date.
- repeated generation same date.
- completion id/date key.
- ambient clock does not override.
- default current date when explicit date absent, if supported.

### G. Serialization/restore

- exact type/source/template/date preserved.
- unknown legacy row excluded.
- non-credit attempt remains non-credit.
- duplicate representations dedupe.
- restore ordering does not change next template.

### H. Regression

- Stage 4A safety gates remain.
- Stage 4B slot stimulus metadata remains.
- Stage 3D focus semantics remain.
- Stage 3A/3B/3C tests remain.
- scoring/norms unchanged.

## Test-quality requirements

Tests must:

- exercise production classifiers/helpers;
- exercise real recent-session adaptation;
- exercise real template selection;
- exercise real completion/service boundaries where practical;
- assert observable state mutation or non-mutation;
- fail if non-training events count again;
- fail if all-skipped credit returns;
- fail if missing results become completed;
- fail if ambient date returns;
- assert duplicate local representations count once;
- preserve valid main-session behavior.

Tests must not:

- mock classification at every layer;
- assert only that a helper was called;
- change exercise content;
- implement Stage 5B primary-stimulus threshold;
- implement Stage 5C fallback redesign;
- change norms/scoring;
- depend on network access;
- depend on wall-clock sleeps.

Use deterministic dates, ids, block ids, and templates.

## Validation commands

Run targeted tests for:

- session planning;
- workout generation/template selection;
- session player;
- adherence completion;
- progression;
- training state/store/serialization;
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

Do not install dependencies.

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
- whether validation commands changed files.

## Manual source verification after tests

Retrace these paths:

### Rotation

```text
adherence completions + generated summaries
-> main-plan event classifier
-> dedupe
-> recentSessionsFor
-> getTemplateSelection
```

Confirm only credited active-block A/B/C events remain.

### All-skipped session

```text
player done with all skipped
-> work evidence
-> completion boundary
```

Confirm no main-plan/adherence/progression/week mutation.

### Missing result

```text
planned generated exercise missing from result
-> progression mapper
```

Confirm incomplete/zero evidence.

### Date

```text
planTodayPearlSession({ today })
-> adaptation
-> plannedDateKey
-> completion identity
```

Confirm supplied date is authoritative.

### Valid main session

Confirm current normal A/B/C behavior remains unchanged.

## Remediation report

Create exactly one new report:

docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5A.md

Do not edit prior reports.

The report must contain:

1. Scope.
2. Initial Git status.
3. Findings addressed:
   - F5-001.
   - F5-002.
   - F5-003.
   - F5-004.
4. Findings explicitly deferred:
   - F5-005 through F5-009.
5. Approved product rules implemented.
6. Main-plan event classifier architecture.
7. Supported/excluded session types.
8. A/B/C rotation behavior.
9. Week-completion behavior.
10. Work-evidence contract.
11. Zero-work/all-skipped behavior.
12. Partial-session behavior retained.
13. Missing-result progression behavior.
14. Planned-date propagation.
15. Serialization/restore behavior.
16. Backend sync behavior.
17. User-facing recovery behavior.
18. Observability.
19. Files changed.
20. Tests added/changed.
21. Exact validation results.
22. Stage 1–4B regression verification.
23. Remaining Stage 5 blockers.
24. F5-001 status.
25. F5-002 status.
26. F5-003 status.
27. F5-004 status.
28. Whether beta automatic plan generation remains blocked.
29. Initial and final Git status.
30. Concurrent external changes.
31. Confirmation that no commit/staging/branch/push occurred.

## Required invariant outcomes

After Stage 5A:

1. Micro-checks do not affect A/B/C rotation.
2. Presets/extras do not affect rotation.
3. Manual practice does not affect rotation.
4. Re-tests/retest prep do not affect rotation.
5. Legacy fallback does not affect rotation or main-plan credit in this stage.
6. Three non-training events cannot complete a week.
7. Week completion requires credited A/B/C templates.
8. Duplicate A does not substitute for B/C.
9. Duplicate local representations count once.
10. Wrong-block events do not count.
11. Unknown legacy events fail closed.
12. All-skipped session receives zero main-plan credit.
13. Empty/null result receives zero credit.
14. Missing result does not equal completed.
15. Malformed result does not equal completed.
16. At least one completed planned exercise preserves current partial-credit behavior.
17. Zero-work attempt does not progress ladders.
18. Zero-work attempt does not advance block/week/re-test.
19. Missing planned exercise does not progress.
20. Explicit planning date drives date key.
21. Ambient clock does not overwrite explicit planning date.
22. Session type/source/template/date survive serialization where needed.
23. Valid normal A/B/C behavior remains unchanged.
24. Stage 4A/4B safety and stimulus metadata remains.
25. Stage 3D focus semantics remain.
26. Scoring/norms/Check-Up logic remains unchanged.
27. No unrelated product logic changes.

## Acceptance criteria

Do not mark Stage 5A complete unless all are true:

1. One authoritative main-plan event classifier exists.
2. Recent-session adaptation uses it.
3. Template selection/week completion use credited template identities.
4. Non-training contamination is closed.
5. One authoritative work-evidence helper exists.
6. All-skipped/zero-work main-plan credit is closed.
7. Missing-result progression fails closed.
8. Explicit planning date is preserved.
9. Duplicate evidence cannot double-advance rotation.
10. Valid A/B/C behavior remains unchanged.
11. Targeted tests pass.
12. Full tests pass.
13. Typecheck passes.
14. Expo config passes.
15. `git diff --check` passes.
16. No new warning is introduced without explanation.
17. No unrelated user work is reverted or overwritten.
18. No commit, staging, branch, or push occurs.

## Stage decision

At the end of the report, state exactly one:

- STAGE 5A COMPLETE
- STAGE 5A BLOCKED

Also state:

- STAGE 5B REQUIRED
- STAGE 5C REQUIRED
- STAGE 5 REMEDIATION STILL REQUIRED
- BETA AUTOMATIC PLAN GENERATION BLOCKED
- STAGE 4 REMEDIATION STILL REQUIRED
- STAGE 3D-B REQUIRED

Stage 5A alone must not declare beta readiness because primary-focus minimum stimulus, legacy fallback containment, parallel progression, equipment-state canonicalization, and remote stimulus metadata remain unresolved.

## Final Codex response

Return a concise summary containing:

- Remediation report path.
- Whether production code changed.
- Main-plan event contract implemented.
- Supported/excluded session types.
- A/B/C rotation rule.
- Week-completion rule.
- Work-evidence rule.
- All-skipped behavior.
- Missing-result behavior.
- Planned-date behavior.
- Files changed.
- Tests added/changed.
- Targeted validation result.
- Full-suite validation result.
- Typecheck result.
- Expo config result.
- `git diff --check` result.
- Confirmation that Stage 4A/4B and Stage 3D protections remain.
- F5-001 status.
- F5-002 status.
- F5-003 status.
- F5-004 status.
- Remaining Stage 5 blockers.
- STAGE 5A COMPLETE or STAGE 5A BLOCKED.
- STAGE 5B REQUIRED.
- STAGE 5C REQUIRED.
- STAGE 5 REMEDIATION STILL REQUIRED.
- BETA AUTOMATIC PLAN GENERATION BLOCKED.
- STAGE 4 REMEDIATION STILL REQUIRED.
- STAGE 3D-B REQUIRED.
- Initial and final Git status.
- Any concurrent external changes.
- Confirmation that no commit, staging, branch, or push occurred.
