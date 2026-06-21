You are implementing Stage 5D of Hale’s production-readiness work:

AUTHORITATIVE LADDER PROGRESSION, EVIDENCE ELIGIBILITY, IDEMPOTENT MUTATION, LEGACY-PROGRESSION RETIREMENT, AND RESTORE CONSISTENCY

This is a focused production-code remediation task following the Stage 5 audit and the completed Stage 5A, Stage 5B, Stage 5B.1, and Stage 5C work.

Do not begin Stage 5E, Stage 5F, Stage 5G, Stage 5H, Stage 3D-B, further Stage 4 remediation, or beta-device validation in this task.

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
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5C.md

Treat the current working tree as the source of truth. Re-verify every relevant path before editing because report line numbers and implementation details may no longer be exact.

## Verified baseline entering Stage 5D

Stage 5A is complete:

- only explicit active-block, block-generated, valid-template main-plan events can count;
- non-training events do not affect A/B/C rotation;
- all-skipped/zero-work/malformed/missing-result attempts receive no main-plan credit;
- explicit planning date is authoritative;
- duplicate main-plan credit is deduped.

Stage 5B and Stage 5B.1 are complete and verified:

- credited main-plan completion requires explicit completed primary-focus work;
- supporting-only, fallback-only, wrong-domain, missing-metadata, and legacy-fallback work is non-credit;
- persisted rows with `mainPlanCredit: true` are not trusted without positive focus-stimulus evidence;
- short/equipment/readiness/pain scenarios fail closed when primary focus is absent;
- exact/near concrete MovementBlock focus is authoritative.

Stage 5C is complete:

- the current dynamic planner is authoritative;
- current planning never silently falls back to the legacy planner;
- generation failures return typed unavailable/recovery states;
- legacy-only state no longer steers current training;
- valid supporting current plans remain distinct and non-credit.

Stage 4A/4B and Stage 3D protections remain authoritative.

The Stage 5C full baseline was:

- 87 suites passed;
- 659 tests passed;
- typecheck passed;
- Expo config passed with the existing Sentry warning;
- `git diff --check` passed.

Verify the current baseline rather than assuming it is unchanged.

## Confirmed finding being addressed

### F5-007 — P2 architectural risk, elevated to beta-blocking progression-integrity work

The Stage 5 audit confirmed that two progression systems can mutate in parallel:

1. Legacy progression:
   - stored under the legacy TrainingState/TrainingBlock path;
   - historically updated by `recordCompletedSession`;
   - based on legacy set-result logic;
   - previously used by the legacy planner.

2. Current dynamic ladder progression:
   - stored under `ladderProgressById`;
   - updated after session feedback;
   - uses generated exercise metadata, RPE, pain, valid-time, tracking, and ladder semantics;
   - used by current dynamic generation.

Stage 5C removed current production legacy fallback planning, but legacy progression state and mutation paths may still exist.

Additional progression risks requiring Stage 5D:

- the same completion/feedback may be applied more than once;
- local completion plus remote restore/retry may replay evidence;
- multiple exercises from the same ladder in one session may mutate that ladder more than once;
- extra/manual/non-credit sessions may leak into progression through a secondary path;
- supporting or fallback exercises may be treated as authoritative progression evidence without an explicit policy;
- wrong-ladder or mismatched exercise metadata may mutate the wrong ladder;
- missing/malformed evidence may be treated inconsistently;
- local and restored progression state may diverge;
- current dynamic completion may still mutate legacy progression even though legacy planning is contained.

Stage 5D must close F5-007 for current production paths.

## Approved Stage 5D product policy

The following policy is locked for this task.

### 1. One authoritative current progression system

For all current dynamic MovementBlock training:

- `ladderProgressById` or its current equivalent is the sole authoritative exercise-progression state.
- Current dynamic sessions must not mutate the legacy `training.progression` system.
- Legacy progression remains historical/migration-only unless a later explicit migration policy says otherwise.
- Current session generation must read only the authoritative dynamic ladder state.

Do not delete historical legacy progression data if it is needed for old records.

### 2. Only credited current main-plan sessions provide official progression evidence

Official progression evidence requires all of:

- current dynamic plan, not legacy fallback;
- active-block identity match;
- supported A/B/C main-plan session type;
- Stage 5A valid main-plan event;
- Stage 5A explicit completed work;
- Stage 5B positive primary-focus credit;
- explicit valid completed exercise result;
- valid generated exercise and ladder metadata;
- non-duplicate progression evidence identity.

The following do not alter official ladder progression:

- non-credit attempts;
- all-skipped/zero-work attempts;
- supporting-only/fallback-only sessions that did not earn main-plan credit;
- extra/preset sessions;
- manual ladder practice;
- micro-checks;
- official re-tests/re-test prep;
- manual/quick Check-Ups;
- legacy fallback/historical legacy sessions;
- unknown/debug sessions;
- wrong-block sessions;
- duplicate completion/feedback/sync/restore evidence.

This conservative policy may be revisited later for explicit practice progression, but not in Stage 5D.

### 3. Exercise-local eligible evidence inside a credited session

Once a current main-plan session is credited:

- an explicit completed generated exercise may provide evidence for its own ladder only;
- the exercise id must match the generated plan item;
- the ladder id/level must match authoritative catalogue metadata;
- `stimulusRole` may be `primary` or `supporting`;
- `fallback`, `skipped`, and `invalid` roles must not advance a ladder;
- cross-domain supporting work may affect its own ladder only when it is an explicit completed planned exercise with a direct ladder match;
- no exercise may mutate another ladder;
- no evidence may be inferred from display names.

This rule allows planned cross-domain maintenance to progress conservatively while preventing fallback/safety substitutions from advancing an unintended ladder.

### 4. Fallback work does not advance official progression

A fallback exercise may be completed and saved, but it must not advance official ladder state in Stage 5D.

Reason:

- fallback may be selected due to equipment, readiness, pain, or safety;
- advancing from fallback could immediately propose an exercise the user still cannot safely perform;
- Stage 4B already labels fallback explicitly.

Fallback evidence may be recorded as non-authoritative exposure for future analytics if the current architecture supports it narrowly.

### 5. At most one progression mutation per ladder per credited session

For one credited session:

- one ladder may receive at most one aggregated progression evidence event;
- two exercises from the same ladder must not cause two independent mutations;
- duplicate result rows must not cause repeated mutation;
- the aggregation must be deterministic.

Use conservative aggregation:

- any pain signal for eligible evidence prevents progression and may trigger existing hold/regress behavior;
- high effort/RPE prevents progression according to existing thresholds;
- uncertain/incomplete valid-time or tracking prevents progression according to existing rules;
- missing/malformed evidence fails closed;
- completion evidence should be aggregated using existing completion-rate semantics where possible;
- mixed evidence must not be made more favorable by averaging away a safety concern.

Do not change current numeric thresholds unless a defect makes them impossible to apply consistently.

### 6. Stable progression evidence identity

Every authoritative progression event must have a stable deterministic id derived from authoritative identities such as:

- completion id;
- block id;
- template/session id;
- ladder id;
- planned date key.

Conceptually:

```text
progressionEventId =
  completionId + blockId + templateId + ladderId
```

Use the smallest stable combination already supported by the code.

Requirements:

- retrying feedback does not apply twice;
- app restart does not apply twice;
- local plus remote duplicate does not apply twice;
- sync retry does not apply twice;
- reordered evidence does not alter id;
- two different ladders in one completion have distinct ids;
- two different genuine completions remain distinct.

Do not use wall-clock “now” as the unique event identity.

### 7. Applied progression ids must persist

The authoritative dynamic state must remember which progression events have been applied.

Prefer:

- source progression event ids in per-ladder history; or
- a bounded persisted applied-event register.

Requirements:

- survives local serialization;
- survives backend training-state sync where current architecture supports it;
- survives restore;
- malformed/unknown ids fail closed;
- read does not rewrite historical state;
- pruning, if necessary, cannot allow recent duplicate replay.

Do not add an unbounded arbitrary log without considering persistence size.

### 8. Existing progression thresholds remain provisional but unchanged

Preserve existing behavior for:

- completion-rate thresholds;
- easy/hard RPE thresholds;
- pain hold/regress;
- valid-time hold/regress;
- tracking/reset signals;
- max ladder level;
- optional-level policy;
- top-of-ladder behavior.

Stage 4 progression-quality and Stage 5E pain/readiness work remain separate.

Stage 5D is about authority, eligibility, aggregation, and idempotency.

### 9. Missing or contradictory evidence fails closed

The following must not advance:

- missing session result;
- missing planned exercise result;
- malformed result;
- duplicate result for one exercise;
- unmatched result;
- invalid exercise id;
- missing ladder id;
- exercise/ladder mismatch;
- selected level mismatch;
- missing stimulus role;
- invalid stimulus role;
- missing main-plan/focus credit;
- source block/template mismatch;
- stale completion from another block.

### 10. Restore must not replay evidence

Restore behavior must be:

- restore authoritative `ladderProgressById`;
- restore applied progression evidence ids/history;
- do not call progression application merely because completion history exists;
- do not rebuild current progression from legacy completion history on read;
- do not merge legacy progression into dynamic progression silently;
- duplicate restored completion must remain already applied;
- partial/malformed restore fails closed.

### 11. Safe handling when current progression state is missing

If a current active MovementBlock exists but authoritative dynamic ladder state is missing:

- do not silently use legacy progression;
- use the existing safe default ladder initialization if deterministic and already part of block creation;
- otherwise return/record a structured recovery or initialization-required state;
- preserve the active block;
- do not advance based on historical legacy values.

Document the exact chosen behavior.

### 12. Manual/extra practice remains non-authoritative

Manual ladder practice and extra sessions remain useful but do not automatically advance official progression.

They may:

- be saved;
- appear in history;
- expose explicit completed work;
- support future explicit practice-progression policy.

They must not:

- update `ladderProgressById`;
- update legacy progression;
- advance optional levels;
- affect current A/B/C block progression.

## Primary objective

Implement a single authoritative, evidence-scoped, idempotent progression boundary so that:

1. Current dynamic ladder progression has one source of truth.

2. Current dynamic sessions stop mutating legacy progression.

3. Only credited current main-plan evidence can affect progression.

4. Fallback/non-credit/non-training evidence cannot progress ladders.

5. One credited session mutates each ladder at most once.

6. Duplicate feedback, completion, sync, or restore cannot replay progression.

7. Wrong-ladder/malformed/missing evidence fails closed.

8. Local and restored state remain consistent.

9. Existing valid progression behavior remains unchanged for genuine eligible evidence.

10. F5-007 is closed.

## Scope boundary

This task may change:

- progression evidence types;
- progression eligibility helpers;
- feedback-to-progression orchestration;
- dynamic ladder progression application;
- legacy progression mutation boundaries;
- TrainingState/dynamic state types;
- local serialization;
- backend training-state sync/restore metadata;
- safe observability;
- tests;
- the Stage 5D remediation report.

This task must not change:

- Stage 5E pain/readiness strategy;
- Stage 5F canonical equipment state;
- Stage 5G block timing/lapse policy;
- Stage 5H broad scenario testing beyond focused regressions;
- exercise catalogue content;
- Stage 4 progression ladder content;
- current numeric progression thresholds unless required to preserve semantics;
- scoring;
- norms;
- Check-Up logic;
- score snapshots;
- exact/near focus policy;
- broad UI design;
- backend schema unless existing JSON metadata can carry narrow progression fields;
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

4. Inspect all current diffs in every file Stage 5D may touch.

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

## Step 1: Reconstruct every progression path

Before editing, inspect at minimum:

- App.tsx
- src/training/progression.ts
- src/training/workoutGeneration.ts
- src/training/validTimeProgression.ts
- src/training/state.ts
- src/training/dynamicState.ts
- src/training/serialize.ts
- src/training/store.ts, if present
- src/training/block.ts
- src/haleFlow/sessionPlanning.ts
- src/haleFlow/mainPlanEvents.ts
- src/haleFlow/sessionWorkEvidence.ts
- src/haleFlow/focusStimulusEvidence.ts
- src/haleFlow/types.ts
- src/adherence/types.ts
- src/adherence/adherenceService.ts
- src/adherence/screens/SessionCompletionScreen.tsx
- src/services/backend/trainingStateSyncService.ts
- src/services/backend/restoreService.ts
- src/services/backend/sessionSyncService.ts
- all progression, feedback, store, serialization, sync, and restore tests.

Search for:

- `recordCompletedSession`
- `training.progression`
- `ladderProgressById`
- `updateLadderProgressAfterSession`
- `updateExerciseProgressionFromSession`
- `completedExerciseResultsForPlan`
- `session feedback`
- `effort`
- `pain`
- `validTime`
- `readyToProgress`
- `progressed`
- `regress`
- `hold`
- `sourceCompletion`
- `eventId`
- `applied`
- `history`
- `restore`.

Document:

- every progression state representation;
- every mutation entrypoint;
- every reader used by current generation;
- every legacy reader;
- feedback timing;
- completion timing;
- sync timing;
- restore behavior;
- duplicate prevention;
- multiple-exercise same-ladder behavior;
- optional/top-level behavior;
- current role handling;
- current non-credit filtering.

Do not edit until this trace is complete.

## Step 2: Declare the authoritative progression state

Create or harden one authoritative progression contract.

Conceptually:

```ts
type AuthoritativeLadderProgressState = {
  ladderProgressById: Record<LadderId, LadderProgress>;
  appliedProgressionEventIds: string[];
  schemaVersion?: number;
};
```

Adapt to current types.

Requirements:

- Current generation reads this state.
- Current feedback mutates this state.
- Legacy progression is not read for current generation.
- Legacy progression is not mutated by current dynamic sessions.
- State remains JSON-safe.
- Missing/malformed state fails closed.
- Default initialization is deterministic.
- Applied evidence ids/history are persisted.

If the current `ladderProgressById` already has evidence history, extend it rather than duplicating state.

## Step 3: Add one authoritative progression-eligibility classifier

Create a pure helper, conceptually:

```ts
type ProgressionEvidenceEligibility =
  | {
      eligible: true;
      completionId: string;
      blockId: string;
      templateId: string;
      sessionType: SupportedMainPlanType;
    }
  | {
      eligible: false;
      reason: ProgressionExclusionReason;
    };
```

Possible exclusion reasons:

- `non_credit_session`
- `non_main_plan`
- `extra_session`
- `manual_practice`
- `micro_check`
- `official_retest`
- `legacy_session`
- `wrong_block`
- `missing_completion_id`
- `missing_focus_credit`
- `zero_work`
- `duplicate_completion`
- `malformed_completion`
- `unknown_source`

Requirements:

- Reuse Stage 5A/5B predicates.
- Do not reimplement main-plan credit independently.
- Pure and deterministic.
- Fail closed.
- Stable reason codes.
- No inference from session name or exercise list.

## Step 4: Build exercise-local progression evidence

Create or harden one pure mapper from:

- credited plan;
- authoritative generated-exercise metadata;
- session result;
- feedback;
- valid-time/tracking evidence.

For every planned generated exercise, classify:

- eligible primary evidence;
- eligible supporting evidence;
- ineligible fallback;
- skipped;
- missing;
- malformed;
- duplicate;
- wrong ladder;
- wrong level;
- unmatched result.

Output conceptually:

```ts
type ExerciseProgressionEvidence = {
  progressionEventId: string;
  completionId: string;
  ladderId: string;
  exerciseId: string;
  levelIndex: number;
  stimulusRole: 'primary' | 'supporting';
  completionRate: number;
  perceivedEffort: number | null;
  pain: boolean;
  validTimeSignal?: ...;
  trackingSignal?: ...;
  eligible: boolean;
  exclusionReason?: string;
};
```

Requirements:

- Only explicit completed results.
- Primary/supporting allowed.
- Fallback/skipped/invalid excluded.
- Catalogue/ladder/level consistency checked.
- Missing/duplicate/malformed fails closed.
- Input order does not matter.
- No mutation.
- No current-clock dependency.

## Step 5: Aggregate evidence once per ladder per session

Create a pure aggregation helper.

Input:

- eligible exercise evidence from one credited completion.

Output:

- at most one `LadderProgressionEvidenceEvent` per ladder.

Requirements:

- stable ordering;
- stable event id;
- conservative safety aggregation;
- any pain signal prevents progression and uses current hold/regress rule;
- high RPE uses current hold rule;
- valid-time uncertainty/resets use current rules;
- missing/invalid evidence cannot improve result;
- multiple completed items from one ladder cannot apply twice;
- supporting and primary evidence may aggregate, but fallback never enters;
- completion rate remains bounded and finite;
- event references source exercise ids.

Do not invent new numeric progression thresholds.

## Step 6: Define deterministic progression event identity

Implement one pure event-id helper.

Use authoritative stable fields, such as:

- completion id;
- block id;
- template id;
- ladder id.

Requirements:

- equal event input -> equal id;
- different ladder -> different id;
- different completion -> different id;
- result order does not affect id;
- restart does not change id;
- sync retry does not change id;
- no ambient timestamp;
- safe for persistence;
- no sensitive payload data.

Add direct tests.

## Step 7: Implement one idempotent progression application service

Create or harden one progression application boundary.

Conceptually:

```ts
applyProgressionEvidence(
  state,
  evidenceEvents
): {
  nextState;
  appliedEvents;
  skippedDuplicateEvents;
  decisions;
}
```

Requirements:

- checks event id before mutation;
- applies each ladder event once;
- updates `ladderProgressById`;
- records applied id/history atomically in returned state;
- does not mutate input;
- duplicate evidence returns unchanged state;
- partial event batch handles each event deterministically;
- one invalid event does not corrupt unrelated valid ladder events;
- current existing progression/hold/regress rules remain;
- no legacy progression mutation.

## Step 8: Remove current dynamic mutation of legacy progression

Trace every current call to `recordCompletedSession` and legacy progression updates.

For current dynamic block-generated sessions:

- stop legacy progression mutation;
- if the function also updates non-progression session history/counts required elsewhere, split those concerns narrowly;
- preserve Stage 5A credited completion history;
- preserve A/B/C rotation;
- preserve block completion;
- preserve adherence;
- do not remove historical legacy logic needed for old records.

Tests:

- current dynamic completion does not change legacy progression.
- current dynamic completion updates authoritative ladder state once after eligible feedback.
- non-credit completion changes neither.
- legacy historical functions remain readable/testable but not called by current production path.

## Step 9: Define feedback timing and one-shot application

Audit completion versus feedback timing.

Required policy:

- progression should apply only when all required progression evidence is available;
- if RPE/pain feedback is required, apply after feedback, not at raw completion;
- completion alone must not pre-progress a ladder;
- repeated feedback submission must not reapply;
- app restart between completion and feedback must preserve a pending state safely;
- if feedback is abandoned, do not invent easy/no-pain evidence.

Use existing UX flow.

Add tests:

- completion before feedback -> no final progression mutation if feedback required.
- one feedback -> one mutation.
- same feedback twice -> one mutation.
- app restart/persist/restore before feedback -> later one mutation.
- missing feedback -> no favorable progression.
- malformed feedback -> fail closed.

Do not redesign the feedback UI.

## Step 10: Session-type and stimulus-role matrix

Verify official progression behavior for:

### Session types

- starter main-plan;
- standard main-plan;
- restart main-plan;
- short main-plan;
- extra preset;
- manual ladder practice;
- micro-check;
- official re-test;
- legacy historical;
- debug/unknown.

### Stimulus roles

- primary;
- supporting;
- fallback;
- skipped;
- invalid.

Expected:

- credited starter/standard/restart/short + completed primary/supporting -> eligible exercise evidence;
- fallback/skipped/invalid -> ineligible;
- non-main session types -> no official progression;
- a session must still satisfy Stage 5B primary-focus credit globally.

Add table-driven tests.

## Step 11: Wrong-ladder and metadata fail-closed tests

Cover:

- exercise id not in catalogue;
- ladder id missing;
- ladder id does not contain exercise;
- selected level mismatch;
- duplicate exercise id;
- duplicate result;
- stale plan from old block;
- template mismatch;
- completion source mismatch;
- unsupported optional level;
- mobility collection treated as linear progression;
- cross-domain supporting exercise with valid own ladder;
- fallback exercise with valid ladder but ineligible role.

Required:

- no wrong ladder mutation;
- unrelated valid evidence still applies if safe;
- diagnostics are structured.

## Step 12: Current progression decision regression

Preserve current decision behavior for eligible evidence.

Test at minimum:

- two easy valid exposures progress according to current rule;
- one exposure does not progress prematurely;
- high RPE holds;
- pain holds/regresses according to existing rule;
- valid-time uncertainty holds;
- valid-time reset/incomplete behavior;
- tracking uncertainty;
- max ladder level caps;
- optional-level policy remains;
- top-of-ladder behavior remains;
- supporting eligible exercise uses its own ladder;
- fallback does not advance.

Do not change thresholds to make tests easier.

## Step 13: Local serialization and restore

Persist:

- authoritative ladder progress;
- applied progression event ids/history;
- pending feedback/progression state if current flow requires it;
- progression source metadata where needed.

Required tests:

- round-trip authoritative state;
- round-trip applied event ids;
- duplicate replay after restore is skipped;
- missing applied-id field in old schema fails safely;
- old legacy progression remains historical;
- no read-time migration from legacy progression;
- missing current ladder state uses deterministic safe initialization or structured recovery;
- malformed state fails closed without corrupting active block.

Do not perform broad migration.

## Step 14: Backend training-state sync and restore

Preserve authoritative progression state in existing compact JSON.

Tests:

- ladder progress syncs/restores;
- applied event ids/history syncs/restores;
- duplicate local/remote completion does not replay;
- stale remote snapshot cannot blindly overwrite newer local progression if current conflict handling exposes timestamps/versioning; otherwise document remaining Stage 5F risk;
- malformed remote progression fails closed;
- legacy progression is not promoted;
- no raw frame/video data added.

Do not redesign broad conflict resolution; Stage 5F remains.

## Step 15: Restore/replay adversarial cases

Construct:

1. Completion applied locally, sync retries.

2. Completion applied locally, app restarts.

3. Completion exists remotely and locally.

4. Feedback submitted twice.

5. Same completion appears in two local stores.

6. Two completions share planned date but distinct ids.

7. One completion has two exercises in same ladder.

8. One completion has exercises in two ladders.

9. Old completion without progression event id.

10. Wrong-block restored completion.

Required:

- no duplicate progression;
- correct distinct events still apply;
- old unknown evidence does not apply automatically.

## Step 16: Missing authoritative state behavior

Test:

- active block + missing `ladderProgressById`;
- active block + empty map;
- active block + malformed ladder entry;
- active block + legacy progression only;
- no active block.

Choose and document safe behavior based on current architecture:

Preferred:

- deterministic safe initialization from current ladder defaults when no evidence has ever been applied;
- structured recovery if state is inconsistent after known progression history;
- never use legacy progression silently.

Do not infer advanced levels from legacy data.

## Step 17: Observability

Emit safe structured diagnostics for:

- progression evidence excluded;
- duplicate progression event skipped;
- wrong ladder/level;
- fallback evidence excluded;
- non-main-plan evidence excluded;
- missing feedback;
- malformed progression state;
- legacy progression ignored;
- default initialization used;
- restore replay prevented.

Include only:

- reason code;
- completion/event id;
- block/template/ladder/exercise ids where safe;
- session type/source;
- stimulus role;
- decision kind;
- level before/after where safe.

Exclude raw pose frames, video, landmarks, health text, auth data, and raw payload dumps.

Keep pure helpers side-effect free.

## Required automated test matrix

### A. Eligibility

- credited starter/standard/restart/short;
- non-credit main-plan attempt;
- extra;
- manual;
- micro-check;
- re-test;
- legacy;
- wrong block;
- duplicate completion;
- missing focus credit.

### B. Exercise evidence

- primary completed;
- supporting completed;
- fallback completed;
- skipped;
- missing;
- malformed;
- duplicate result;
- wrong ladder;
- wrong level;
- unmatched;
- cross-domain supporting with valid own ladder.

### C. Aggregation

- one exercise one ladder;
- two exercises same ladder;
- two ladders;
- pain in one same-ladder item;
- high RPE in one;
- valid-time uncertainty;
- mixed valid/invalid;
- deterministic order.

### D. Idempotency

- same event twice;
- feedback twice;
- sync retry;
- restore replay;
- duplicate local/remote;
- app restart;
- different ladders same completion;
- different completions same date.

### E. Legacy containment

- current session does not mutate legacy progression;
- legacy-only state does not initialize current progression from legacy;
- old legacy data remains readable;
- no current generator reads legacy progression.

### F. Decision regression

- current easy/progress;
- hold;
- regress;
- max level;
- optional policy;
- valid-time behavior.

### G. Persistence/backend

- state and applied ids round-trip;
- malformed restore;
- missing state initialization;
- no replay;
- no legacy promotion.

### H. Regression

- Stage 5A event/zero-work/date;
- Stage 5B primary-focus credit;
- Stage 5C current-planner authority;
- Stage 4A safety;
- Stage 4B stimulus semantics;
- Stage 3D focus;
- Stage 3A/3B/3C protections;
- scoring/norms unchanged.

## Test-quality requirements

Tests must:

- exercise real production progression helpers;
- exercise actual feedback/progression orchestration where practical;
- assert state before/after;
- assert legacy state non-mutation;
- assert event ids and dedupe;
- assert one mutation per ladder per session;
- fail if extra/manual/fallback evidence progresses;
- fail if restore replays;
- preserve valid current progression decisions.

Tests must not:

- mock every layer;
- assert only helper calls;
- alter progression thresholds;
- implement Stage 5E/F/G;
- change exercise content;
- change scoring/norms;
- depend on network;
- depend on wall-clock sleeps.

Use deterministic ids, dates, blocks, templates, ladders, and feedback.

## Validation commands

Run targeted tests for:

- progression eligibility/evidence;
- workout progression;
- valid-time progression;
- feedback handling;
- session planning;
- Stage 5A/5B/5C helpers;
- training store/serialization;
- backend training-state sync/restore;
- legacy state containment;
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

### Valid current progression

```text
credited current main-plan completion
-> valid feedback
-> eligible exercise evidence
-> aggregate per ladder
-> idempotent apply
-> ladderProgressById
```

### Duplicate feedback

Confirm one mutation.

### Supporting exercise in credited session

Confirm it may affect only its own ladder.

### Fallback exercise

Confirm no progression.

### Non-credit/extra/manual

Confirm no progression.

### Legacy progression

Confirm current dynamic session does not mutate/read it.

### Restore

Confirm applied event is not replayed.

## Remediation report

Create exactly one new report:

docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5D.md

Do not edit prior reports.

The report must contain:

1. Scope.
2. Initial Git status.
3. Finding addressed: F5-007.
4. Findings deferred: F5-008, F5-009 and Stage 5E/F/G/H.
5. Approved progression-authority policy.
6. Progression architecture before remediation.
7. Authoritative state architecture.
8. Eligibility classifier.
9. Exercise evidence contract.
10. Per-ladder aggregation.
11. Progression event identity.
12. Idempotent application.
13. Legacy progression containment.
14. Feedback timing.
15. Session-type/stimulus-role policy.
16. Current decision thresholds preserved.
17. Local serialization/restore.
18. Backend sync/restore.
19. Missing-state behavior.
20. Observability.
21. Files changed.
22. Tests added/changed.
23. Exact validation results.
24. Stage 1–5C regression verification.
25. Remaining Stage 5 blockers.
26. F5-007 status.
27. Whether Stage 5E is unblocked.
28. Whether beta automatic plan generation remains blocked.
29. Initial and final Git status.
30. Concurrent external changes.
31. Confirmation that no commit/staging/branch/push occurred.

## Required invariant outcomes

After Stage 5D:

1. `ladderProgressById` is the sole current progression source.
2. Current dynamic sessions do not mutate legacy progression.
3. Current generation does not read legacy progression.
4. Only credited current main-plan sessions can provide official progression evidence.
5. Extra/manual/micro/retest/legacy/unknown sessions do not progress.
6. Primary and supporting completed exercises may affect only their own valid ladder.
7. Fallback/skipped/invalid exercises do not progress.
8. Missing/malformed/duplicate/unmatched evidence does not progress.
9. Wrong-ladder/wrong-level evidence does not progress.
10. One ladder mutates at most once per credited session.
11. Progression event identity is stable.
12. Duplicate feedback does not reapply.
13. Sync retry does not reapply.
14. Restore does not replay.
15. Local/remote duplicate does not reapply.
16. Different genuine completions remain distinct.
17. Current numeric progression thresholds remain unchanged.
18. Pain/RPE/valid-time safety decisions remain.
19. Max/optional-level behavior remains.
20. Applied evidence ids/history persist.
21. Missing current state never silently uses legacy progression.
22. Stage 5A/5B/5C gates remain.
23. Stage 4A/4B semantics remain.
24. Stage 3D focus remains.
25. No scoring/norm/Check-Up changes.
26. No unrelated product logic changes.

## Acceptance criteria

Do not mark Stage 5D complete unless:

1. One authoritative progression state exists.

2. One authoritative eligibility classifier exists.

3. Exercise evidence is fail-closed and exercise-local.

4. Per-ladder aggregation prevents multiple mutations per session.

5. Stable progression event ids exist.

6. Progression application is idempotent.

7. Applied ids/history persist locally.

8. Backend restore cannot replay.

9. Current dynamic completion no longer mutates legacy progression.

10. Current generation no longer reads legacy progression.

11. Non-main/non-credit/fallback evidence cannot progress.

12. Existing valid progression behavior remains.

13. Stage 5A/5B/5C regressions pass.

14. Stage 4A/4B and Stage 3D regressions pass.

15. Targeted tests pass.

16. Full suite passes.

17. Typecheck passes.

18. Expo config passes.

19. `git diff --check` passes.

20. No new warning is introduced without explanation.

21. No unrelated user work is reverted or overwritten.

22. No commit, staging, branch, or push occurs.

## Stage decision

At the end of the report, state exactly one:

- STAGE 5D COMPLETE
- STAGE 5D BLOCKED

Also state exactly one:

- STAGE 5E UNBLOCKED
- STAGE 5E BLOCKED

Use `STAGE 5E UNBLOCKED` only if no P0/P1 progression-authority/idempotency gap remains.

Also state:

- STAGE 5E REQUIRED
- STAGE 5F REQUIRED
- STAGE 5 REMEDIATION STILL REQUIRED
- BETA AUTOMATIC PLAN GENERATION BLOCKED
- STAGE 4 REMEDIATION STILL REQUIRED
- STAGE 3D-B REQUIRED

Stage 5D must not declare beta readiness. Pain/readiness policy, canonical equipment state, remote metadata/conflict handling, block timing/lapse semantics, and beta-device validation remain.

## Final Codex response

Return a concise summary containing:

- Remediation report path.
- Whether production code changed.
- Authoritative progression state.
- Eligible session types.
- Eligible stimulus roles.
- Fallback/non-credit behavior.
- Per-ladder aggregation behavior.
- Progression event identity.
- Idempotency behavior.
- Legacy progression containment.
- Feedback timing behavior.
- Missing-state behavior.
- Local serialization/restore.
- Backend sync/restore.
- Files changed.
- Tests added/changed.
- Targeted validation result.
- Full-suite validation result.
- Typecheck result.
- Expo config result.
- `git diff --check` result.
- Confirmation that Stage 5A/5B/5C, Stage 4A/4B, and Stage 3D protections remain.
- F5-007 status.
- Remaining Stage 5 blockers.
- STAGE 5D COMPLETE or STAGE 5D BLOCKED.
- STAGE 5E UNBLOCKED or STAGE 5E BLOCKED.
- STAGE 5E REQUIRED.
- STAGE 5F REQUIRED.
- STAGE 5 REMEDIATION STILL REQUIRED.
- BETA AUTOMATIC PLAN GENERATION BLOCKED.
- STAGE 4 REMEDIATION STILL REQUIRED.
- STAGE 3D-B REQUIRED.
- Initial and final Git status.
- Any concurrent external changes.
- Confirmation that no commit, staging, branch, or push occurred.
