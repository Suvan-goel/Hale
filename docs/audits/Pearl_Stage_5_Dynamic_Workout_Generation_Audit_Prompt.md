You are carrying out Stage 5 of Pearl’s production-readiness work:

DYNAMIC WORKOUT GENERATION, 4-WEEK BLOCK LOGIC, SESSION ROTATION, AUTOREGULATION, PROGRESSION, AND COMPLETION-SEMANTICS AUDIT

This is a read-only audit and product-decision report.

Do not implement remediation in this task unless explicitly asked in a later prompt.

Do not modify production code, tests, fixtures, exercise definitions, workout-generation logic, progression logic, scoring, Check-Up logic, copy, backend, configuration, dependencies, or assets.

## Required prior reading

Read these documents in full before beginning:

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

Treat the current working tree as the source of truth. Re-verify relevant call paths before making conclusions because report line numbers and implementation details may no longer be exact.

## Current stage status

Completed and relevant to Stage 5:

- Stage 1A: invalid/no-domain Check-Ups cannot create blocks.
- Stage 2A/2A.1: movement-specific camera readiness and ROM valid-capture logic fail closed.
- Stage 3A: malformed scoring inputs fail closed.
- Stage 3B: official Check-Ups require all three headline domains; manual/quick results are isolated.
- Stage 3C/3C.1: frozen versioned score snapshots and source-identity checks prevent silent historical rescoring.
- Stage 3D-A: beta-safe performance-band-first display and softened claims.
- Stage 3D-C: exact-tie focus policy.
- Stage 3D-D: interim near-tie focus policy and neutralized meaningful-change language.
- Stage 4A: floor/stair/support safety gates and honest upper-pull skipping.
- Stage 4B: explicit slot stimulus roles, static-vs-dynamic balance semantics, mobility collection semantics, and no-equipment transparency.

Current decisions:

- Stage 5 focus-selection inputs are ready.
- Stage 5 catalogue inputs are ready.
- Stage 4 remediation still has later cueing, pain/readiness, and progression-quality work.
- Stage 3D-B norm provenance remains required before public beta.

## Known historical risks to re-verify independently

Earlier audits identified or suspected:

1. Micro-checks and official re-tests may enter dynamic A/B/C completion history and alter session rotation.

2. An all-skipped session may receive main-plan completion credit.

3. Missing exercise results may sometimes be interpreted as completed.

4. Dynamic generation failure may silently fall back to a legacy planner.

5. Legacy completed-session progression and dynamic exercise-ladder progression may diverge.

6. Equipment state may be represented in multiple stores and disagree.

7. A generated session date key may use the current date instead of the supplied planning date.

8. Non-training completions may affect progression or next-session selection.

9. Skipped or equipment-limited focus slots may still allow a session to look complete.

10. Repeated completion, retries, restore, or sync may duplicate mutations.

Do not assume these findings remain true. Re-verify them against the current code.

## Primary objective

Audit whether Pearl can reliably transform a complete official Movement Check-Up and active MovementBlock into safe, useful, coherent, and deterministic 4-week training.

The audit must answer:

1. Exactly how is the first 4-week block created?

2. Exactly how are Session A, Session B, and Session C chosen and rotated?

3. Does each focus domain receive enough primary stimulus while preserving cross-domain maintenance?

4. Do equipment, floor, stair, support, band, and door-anchor constraints behave correctly?

5. Do readiness, pain, short-on-time, and lapse/restart rules scale sessions safely without erasing the training purpose?

6. Do skipped/supporting/fallback slots affect completion credit honestly?

7. Does progression/regression use the right evidence and mutate exactly once?

8. Can extra sessions, manual practice, micro-checks, re-tests, or non-training events contaminate main-plan rotation or progression?

9. Does the generator remain deterministic for the same explicit inputs?

10. Are generation failures visible and recoverable, or hidden behind legacy fallback?

11. Do local persistence, backend sync, and restore preserve the exact active block, ladder state, next session, and completion history?

12. Can Pearl generate useful sessions across realistic user-state combinations without unsafe, empty, duplicate, contradictory, or no-stimulus outputs?

13. What must be remediated before beta users can trust automatic plan generation?

## Output file

Create exactly one new repository file:

docs/audits/PEARL_LOGIC_AUDIT_STAGE_5.md

Do not edit prior reports.

Temporary diagnostic scripts may be created only outside the repository, such as under `/tmp`, and must be removed when no longer needed.

Do not stage, commit, create a branch, push, or open a PR.

## Non-negotiable rules

1. Do not modify production code.

2. Do not modify tests or fixtures.

3. Do not modify exercise definitions or catalogue metadata.

4. Do not modify workout generation, block generation, progression, or completion logic.

5. Do not modify scoring, Check-Up logic, snapshots, norms, copy, backend schema, configuration, dependencies, or assets.

6. Do not install packages.

7. Do not use network access.

8. Runtime code is stronger evidence than tests, comments, or previous reports.

9. Passing tests are not proof that the product rule is desirable.

10. Separate:
    - software correctness,
    - product-policy decisions,
    - exercise-content quality,
    - safety behavior,
    - state/persistence correctness,
    - Stage 4 catalogue limitations,
    - beta-readiness.

11. Do not infer that a session is useful merely because it contains exercises.

12. Do not infer completion from a session reaching its final screen.

13. Do not treat supporting/fallback stimulus as equivalent to primary focus-domain work.

14. Every confirmed defect must include an exact trigger, runtime chain, counterexample, user impact, and existing test status.

## Working-tree safety

Before analysis:

1. Run:

   git status --short --untracked-files=all

   git diff --name-only

   git diff --stat

2. Record exact outputs in the report.

3. Treat all existing modifications and untracked files as user-owned.

4. Inspect current diffs in every file cited materially.

5. Do not revert, overwrite, format, move, or delete unrelated work.

6. Run the same Git commands at the end.

7. The only intended repository change is:

   docs/audits/PEARL_LOGIC_AUDIT_STAGE_5.md

8. If unrelated files change during the audit:
   - record them;
   - do not overwrite them;
   - stop repository mutation other than completing the report if safety becomes ambiguous.

## Validation baseline

Run installed dependencies only.

Run targeted existing tests covering at minimum:

- workout generation;
- fresh-user integration;
- session planning;
- block creation;
- progression;
- valid-time progression;
- autoregulation;
- session player/completion;
- history/store/serialization;
- backend block/session/check-up restore where relevant;
- equipment safety;
- catalogue stimulus semantics;
- Stage 3D focus selection.

Then run:

```bash
npm test -- --runInBand
npm run typecheck
npx --no-install expo config --type public
git diff --check
```

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
- diff-check exit code;
- warnings;
- whether validation changed any files.

The Stage 4B baseline was 84 suites and 613 tests. Verify the current baseline rather than assuming it.

## Step 1: Reconstruct the complete generation architecture

Inspect at minimum:

- App.tsx
- src/adherence/blockService.ts
- src/adherence/types.ts
- src/training/workoutGeneration.ts
- src/training/block.ts
- src/training/progression.ts
- src/training/validTimeProgression.ts
- src/training/autoregulation.ts, if present
- src/training/dynamicState.ts
- src/training/serialize.ts
- src/training/store.ts, if present
- src/training/sessionPlayer.ts
- src/training/microCheck.ts
- src/training/debugWorkoutScenarios.ts
- src/training/equipmentSafety.ts
- src/pearlFlow/sessionPlanning.ts
- src/pearlFlow/appLifecycle.ts
- src/pearlFlow/planViewModel.ts
- src/pearlFlow/checkupHistory.ts
- src/pearlFlow/assessmentEligibility.ts
- src/exercises/ladders.ts
- src/screens/SessionPreviewScreen.tsx
- src/screens/TrainingSessionScreen.tsx
- src/screens/PlanScreen.tsx
- src/screens/TodayScreen.tsx
- relevant backend sync/restore services;
- all relevant tests.

Search for:

- createMovementBlock
- buildBlock
- planTodayPearlSession
- generateTodaySession
- workoutGeneration
- sessionType
- countsTowardMainPlan
- completion
- ladderProgress
- nextSession
- sessionKey
- dateKey
- legacy
- fallback
- retry
- short session
- readiness
- pain
- equipment
- skippedSlots
- slotStimulus
- micro_check
- official_retest
- extra_session
- manual ladder practice.

Produce a Mermaid sequence diagram covering:

official assessment -> MovementBlock -> 4-week block state -> daily planning -> A/B/C selection -> generated session -> preview -> player -> completion result -> main-plan credit -> ladder progression -> next-session planning -> persistence/sync/restore.

Trace the legacy fallback path separately.

## Step 2: Build the generator input register

Inventory every input that can alter generation.

At minimum:

| Input | Type/source | Default | Validation | Consumers | Persisted? | Risk if missing/stale |

Include:

- assessment focus;
- focus-selection kind/reason;
- active block ID/status/week;
- block focus/secondary focus;
- current ladder levels;
- session completion history;
- main-plan completion history;
- session type;
- countsTowardMainPlan;
- readiness;
- pain areas;
- equipment;
- floor_space;
- stair/support;
- long band;
- door anchor;
- mini band;
- short-on-time flag;
- schedule;
- current/planning date;
- week/day index;
- previous session result;
- perceived effort/RPE;
- valid-time metadata;
- tracking interruptions/resets;
- optional-level policy;
- release-status policy;
- lapse/restart state;
- restored/local/backend state.

Identify duplicated sources of truth and precedence rules.

## Step 3: Build the generator output contract

Document every generated output:

- session ID;
- session key/date key;
- source block ID;
- session type;
- A/B/C label;
- focus domain;
- ordered exercise IDs;
- sets/reps/holds/rest;
- intended domain;
- selected domain;
- stimulus role;
- stimulus reason;
- skipped slots/reasons;
- equipment/setup list;
- guidance;
- readiness adjustment;
- pain adjustment;
- short-session flag;
- countsTowardMainPlan;
- progression metadata;
- completion expectations;
- persistence metadata.

For each output state:

- producer;
- consumer;
- required invariants;
- persistence;
- failure behavior.

## Step 4: First-block creation audit

Trace:

complete official baseline/baseline-retake -> eligibility -> MovementBlock -> current ladder state -> first planned session.

Verify:

- only complete current-version official evidence creates a block;
- clear/exact/near focus semantics are preserved;
- tie fallback reason is preserved;
- block starts with deterministic ladder levels;
- equipment/profile state is captured or referenced correctly;
- duplicate active blocks cannot be created through repeated CTA/callback;
- legacy and adherence blocks cannot diverge silently;
- retry/reload does not create a second first block;
- first session is appropriate for a new user.

Test or inspect counterexamples:

- double tap Start Plan;
- app restart after local write before backend sync;
- block exists locally but not remotely;
- remote block exists but local restore is partial;
- exact/near tie baseline;
- missing equipment profile;
- legacy unversioned baseline;
- concurrent stale assessment.

## Step 5: Four-week block model audit

Determine the actual meaning of:

- 4-week block;
- week number;
- sessions per week;
- session A/B/C;
- official re-test timing;
- block completion;
- block status;
- next block creation.

Answer:

1. Is the block truly four weeks or completion-count based?

2. What happens if sessions are missed?

3. What happens if the user trains more than three times/week?

4. What happens if the user completes A/B/C out of order?

5. What happens across time zones/date boundaries?

6. Does a lapse pause, extend, or leave the block calendar unchanged?

7. Can the re-test become due before sufficient training?

8. Can the user finish the block without meaningful training?

9. Can extra/manual sessions advance the block?

10. Is block completion idempotent?

Create a state-transition table.

## Step 6: A/B/C rotation audit

Trace the exact next-session algorithm.

Test/inspect sequences:

- no history -> A;
- A -> B;
- A,B -> C;
- A,B,C -> next week A;
- A,C -> expected next;
- duplicate A completion;
- all-skipped A;
- short A;
- extra session after A;
- manual ladder practice after A;
- micro-check after A;
- official re-test after A;
- failed/incomplete session after A;
- restored history in different order;
- same timestamp completions;
- completion from another block;
- old legacy completion;
- session with wrong source block ID.

Determine whether rotation uses:

- session label;
- completion count;
- latest timestamp;
- all completion records;
- main-plan-only records;
- block-scoped records.

Confirm or refute contamination by non-training completions.

## Step 7: Session-template and focus-stimulus audit

For each focus domain and A/B/C template, record:

| Focus | Session | Intended slots | Expected primary stimulus | Cross-domain maintenance | Equipment-sensitive slots | Potential skipped slots | Verdict |

Verify:

- strength focus has enough lower-body strength stimulus;
- balance focus has primary static/dynamic balance where safe;
- mobility focus has genuine mobility stimulus;
- all focus blocks preserve some strength/balance/mobility maintenance;
- cross-domain supporting work is not counted as primary;
- Stage 4B stimulus metadata is consumed correctly;
- a session cannot report focus coverage when all focus slots are supporting/skipped;
- upper-pull skipping is honest;
- no-equipment outputs are still useful enough or explicitly partial.

Define minimum primary-focus content currently produced per session.

Do not decide a new threshold silently; present policy options.

## Step 8: Equipment and safety matrix

Run or inspect deterministic scenario sweeps across:

Equipment profiles:

1. none;
2. chair only;
3. wall only;
4. chair + wall;
5. floor_space only;
6. stair only;
7. stair + support;
8. long band only;
9. long band + chair;
10. long band + door anchor;
11. mini band;
12. full Pearl kit.

For each focus and session A/B/C, record:

- primary slots;
- supporting slots;
- skipped slots;
- unsafe selections;
- equipment guidance;
- session usefulness.

Verify Stage 4A gates and Stage 4B semantics.

Flag:

- empty session;
- no primary focus stimulus;
- duplicate movement patterns;
- misleading equipment copy;
- selected exercise lacking prerequisite;
- unsupported optional level.

## Step 9: Readiness/autoregulation audit

Map all readiness inputs and outputs.

Determine:

- readiness scale/options;
- level reduction;
- set reduction;
- rep/hold reduction;
- rest changes;
- short-session compaction;
- substitution rules;
- minimum dose floors;
- whether readiness affects progression credit;
- whether low readiness can still create unsafe intensity;
- whether repeated low readiness traps progression.

Test/inspect:

- fully ready;
- cautious;
- low energy;
- short on time;
- low readiness + high ladder level;
- low readiness + balance focus;
- low readiness + optional loaded exercise;
- low readiness + pain;
- low readiness + no equipment;
- readiness state missing/malformed.

Verify a scaled session remains useful and honest.

## Step 10: Pain and contraindication audit

Trace pain-area filtering and substitution.

Scenarios:

- knee;
- hip/back;
- shoulder;
- ankle/foot;
- multiple areas if supported;
- pain + readiness;
- pain + no equipment;
- pain + focus domain directly affected.

For each:

- which slots are blocked;
- which exercises remain;
- whether substitutions stay in domain;
- whether session becomes no-stimulus;
- whether unsafe adjacent patterns remain;
- whether progression credit is awarded;
- whether user is told to stop/seek advice.

Re-verify Stage 4’s suspected gaps:

- hip/back pain with step-ups;
- shoulder pain with rows;
- floor work with mobility limitations;
- single-leg work with ankle/foot discomfort.

Classify confirmed defects vs product decisions.

## Step 11: Short-session audit

Trace short-session construction.

Verify:

- intended duration;
- selection priority;
- one strength/one balance/one mobility when possible;
- focus-domain primary stimulus retained;
- no unsafe compression of rest;
- no duplicate exercise;
- skipped-slot reasons preserved;
- countsTowardMainPlan behavior;
- progression credit;
- repeated short sessions effect on block progression.

Test:

- short strength/balance/mobility focus;
- short no-equipment;
- short pain-adjusted;
- short low-readiness;
- short session with only supporting/fallback options.

Determine whether a short session can satisfy a main-plan session too easily.

## Step 12: Completion-semantics audit

This is a high-priority section.

Trace:

TrainingSessionScreen/session player -> item results -> session result -> completion persistence -> main-plan credit -> ladder progression -> A/B/C rotation.

Determine:

- what counts as completed exercise;
- what counts as skipped;
- what happens when result is missing;
- what happens when all exercises are skipped;
- minimum work required for session completion;
- minimum primary stimulus required;
- whether “finish” implies credit;
- whether cancellation can later become completion;
- duplicate completion handling;
- idempotency;
- countsTowardMainPlan enforcement.

Test/inspect equivalence classes:

1. all exercises completed;
2. most completed;
3. one exercise completed;
4. only supporting exercise completed;
5. only fallback exercise completed;
6. all skipped;
7. missing result entries;
8. malformed result;
9. session timed out;
10. app killed before final save;
11. save retried;
12. same completion submitted twice;
13. wrong block ID;
14. extra/manual session marked main plan;
15. main-plan session marked extra.

State the current minimum completion rule.

## Step 13: Progression and regression audit

Trace ladder progression after completion.

Determine:

- aggregation window;
- sessions required;
- completion ratio;
- RPE threshold;
- pain hold/regress rule;
- valid-time hold/regress rule;
- tracking reset effect;
- exercise-specific vs generic logic;
- max level;
- optional levels;
- top-of-ladder behavior;
- decay/regression after lapse;
- conflicting signals.

Scenarios:

- two easy completed sessions;
- one easy/one hard;
- high RPE;
- pain;
- skipped set;
- missing result;
- all-skipped session;
- short session;
- supporting/fallback exercise;
- exercise substituted from requested ladder;
- valid-time incomplete;
- valid-time resets;
- repeated same completion;
- extra/manual session;
- restored history.

Verify progression only uses eligible guided main-plan evidence for the correct ladder/block.

Re-verify whether legacy and dynamic progression can diverge.

## Step 14: Non-training history contamination audit

Inventory all completion/event types:

- guided main-plan session;
- short main-plan session;
- extra session;
- preset session;
- manual ladder practice;
- weekly micro-check;
- official re-test;
- manual Check-Up;
- quick recheck;
- restart session;
- legacy session;
- debug/development session.

For each, determine whether it can affect:

- A/B/C rotation;
- block completion count;
- ladder progression;
- adherence streak/week count;
- Progress;
- re-test due state;
- backend sync;
- next session.

Create a matrix.

Confirm/refute the historical finding that micro-check/re-test completions enter training history.

## Step 15: Generator fallback audit

Trace every fallback:

- dynamic generator -> legacy planner;
- missing active block;
- invalid exercise ID;
- no safe equipment-compatible exercise;
- missing progression state;
- malformed block;
- unsupported focus;
- restore mismatch.

For each:

| Trigger | Current fallback | User-visible? | Preserves safety? | Preserves stimulus? | Risk |

High-priority question:

Can dynamic generation fail and silently present a legacy session as though generation succeeded?

If yes, provide exact trigger and call chain.

Assess options:

- fail closed;
- explicit degraded-mode banner;
- safe static session;
- legacy fallback only for known migration states;
- observability.

Do not implement.

## Step 16: Determinism and date/time audit

Verify equal explicit inputs produce equal outputs.

Audit:

- randomization;
- current clock use;
- supplied planning date;
- date key;
- timezone;
- locale;
- sorting;
- object order;
- completion timestamp ties;
- daylight-saving/timezone changes.

Test or inspect:

- plan for a historical/future supplied date;
- same input generated twice;
- midnight boundary;
- London timezone vs UTC;
- restored records reordered;
- same-day repeated generation;
- app resume after midnight.

Confirm/refute the historical date-key bug.

## Step 17: Persistence, sync, and restore audit

Trace:

- active MovementBlock local persistence;
- ladder progress persistence;
- generated session persistence;
- completion persistence;
- backend session sync;
- backend block sync;
- restore ordering;
- conflict resolution;
- retry/catch-up sync;
- account/user scoping where relevant to training state.

Verify:

- no duplicate block/session after restore;
- exact block ID retained;
- ladder levels retained;
- next A/B/C retained;
- completion types retained;
- slot stimulus metadata retained;
- skipped-slot reasons retained;
- countsTowardMainPlan retained;
- old schema fails safely;
- partial local/remote restore fails closed;
- multiple active blocks handled deterministically.

Keep account-isolation P0 separate, but note training consequences.

## Step 18: Lapse/restart and adherence audit

Trace:

- missed session;
- missed week;
- 14+ day inactivity;
- restart session;
- clean slate;
- shortened restart;
- block calendar;
- next A/B/C;
- progression after lapse.

Verify:

- lapse does not create shame/punishment;
- restart does not duplicate main-plan credit;
- restart session stimulus is useful;
- stale high ladder levels are handled safely;
- block is not silently completed after inactivity;
- re-test timing remains sensible.

## Step 19: Adversarial scenario matrix

Build a deterministic equivalence-class matrix covering combinations of:

- focus: strength, balance, mobility;
- focus selection: clear, exact tie fallback, near-tie preserved focus;
- week: 1 and 4;
- next session: A/B/C;
- equipment: none, chair+wall, band, full kit;
- readiness: ready, cautious, short;
- pain: none, knee, hip/back, shoulder, ankle/foot;
- progression: entry, middle, top;
- history: clean, skipped, extra-session contaminated, restored;
- session type: main, short, extra, manual;
- date: normal, midnight boundary.

Use equivalence classes rather than full Cartesian explosion, but ensure every high-risk interaction is represented.

For each scenario:

| Scenario | Generated session | Primary focus stimulus | Safety | Credit behavior | Progression behavior | Risk |

## Step 20: Generator invariant register

Create at least 100 Pearl-specific invariants.

Include at minimum:

### Block creation

1. Only complete current official assessment creates a block.
2. One CTA action creates at most one block.
3. Block source identity matches assessment snapshot.
4. Clear/exact/near focus metadata is preserved.
5. One active block is authoritative.
6. Restored block does not duplicate.
7. Legacy block cannot silently override current block.
8. Block week/session state is deterministic.

### Session rotation

9. No history begins at A.
10. Main-plan A advances to B.
11. B advances to C.
12. C advances to next-week A.
13. Extra sessions do not advance rotation.
14. Manual practice does not advance rotation.
15. Micro-check does not advance rotation.
16. Re-test does not advance rotation.
17. Wrong-block completions do not advance rotation.
18. Duplicate completion does not double-advance.
19. Incomplete/all-skipped session does not advance unless explicitly approved.
20. History ordering does not change result.

### Exercise selection

21. Every exercise ID exists.
22. Every selected level is V1-eligible.
23. Equipment prerequisites are satisfied.
24. Floor gating holds.
25. Stair/support gating holds.
26. Balance support gating holds.
27. Door-anchor gating holds.
28. Pain exclusions hold.
29. Readiness scaling holds.
30. No duplicate exercise IDs in one session unless explicitly intended.
31. Primary/supporting/fallback/skipped role is accurate.
32. Upper-pull mobility is never counted as primary pull.
33. Mobility collection is not linearly progressed.
34. Static/dynamic balance semantics are not conflated.
35. Focus slots are not silently lost.
36. Empty sessions fail closed.
37. Skipped reasons are present.
38. Session guidance matches metadata.

### Dose/session quality

39. Sets/reps/holds are positive and finite.
40. Rest is finite and non-negative.
41. Short sessions retain useful primary stimulus.
42. Low readiness does not erase all focus work silently.
43. Pain substitution remains safe.
44. Session duration is plausible.
45. Supporting work does not exceed primary purpose unintentionally.
46. No equipment-limited session claims complete coverage without evidence.

### Completion

47. Missing result does not equal completed.
48. Skipped exercise does not equal completed.
49. All-skipped session does not receive full credit unless explicit policy.
50. Completion is idempotent.
51. Wrong block/session ID fails closed.
52. countsTowardMainPlan is authoritative.
53. Extra/manual completion cannot masquerade as main-plan.
54. Completion mutation happens once.
55. Backend retry does not duplicate credit.
56. Session completion credit reflects actual work.
57. Primary focus absence affects credit explicitly.

### Progression

58. Only eligible evidence progresses a ladder.
59. Extra/manual sessions do not progress official ladder unless explicitly approved.
60. Wrong ladder exercise does not progress another ladder.
61. Supporting/fallback work does not over-credit primary ladder.
62. High pain blocks progression.
63. High RPE blocks progression.
64. Valid-time uncertainty blocks progression.
65. Resets/incomplete valid time block or regress according to policy.
66. Duplicate completion does not progress twice.
67. Max level is capped.
68. Optional levels require policy.
69. Lapse does not automatically preserve unsafe advanced level without policy.
70. Legacy and dynamic progression cannot conflict silently.

### Persistence/date

71. Same explicit input produces same session.
72. Supplied date drives date key.
73. Current clock does not overwrite supplied planning date.
74. Timezone transition is deterministic.
75. Restored ordering does not change next session.
76. Slot stimulus metadata survives serialization.
77. Session type survives serialization.
78. main-plan credit flag survives serialization.
79. Active block ID survives restore.
80. Multiple active blocks resolve deterministically.
81. Partial restore fails closed.
82. Old schema does not invent completion type.

### Lapse/restart

83. Missed session does not count completed.
84. Restart session does not double-credit.
85. Clean slate preserves dignity without mutating history.
86. 14-day lapse behavior is explicit.
87. Restart session is useful.
88. Re-test due state remains coherent.
89. Block completion cannot occur from calendar time alone unless explicit policy.

### Fallback/observability

90. Generator failure is not silent.
91. Legacy fallback trigger is explicit.
92. Legacy fallback preserves safety constraints.
93. Legacy fallback cannot bypass catalogue gating.
94. Missing active block produces recoverable state.
95. Unsupported focus fails closed.
96. Invalid exercise ID fails closed.
97. No-safe-option is visible.
98. Fallback is observable.
99. User does not see contradictory session labels.
100. Tests cover every production fallback.

Add further invariants discovered.

Use:

| ID | Invariant | Status | Evidence/counterexample | Reachability | Existing test | Priority | Required action |

Statuses:

- Holds.
- Fails.
- Holds under preconditions.
- Product decision required.
- Not provable.
- Testability gap.
- Legacy-only.
- Beta-hidden.

## Step 21: Existing-test and false-confidence audit

Inspect actual assertions in:

- workoutGeneration tests;
- freshUser integration;
- sessionPlanning tests;
- progression tests;
- validTimeProgression tests;
- autoregulation tests;
- sessionPlayer tests;
- block tests;
- store/serialization tests;
- backend sync/restore tests;
- Stage 4A/4B tests.

Identify tests that can remain green while:

- micro-check contaminates rotation;
- all-skipped receives credit;
- dynamic fallback hides failure;
- wrong-block completion progresses;
- date key is wrong;
- session has no primary focus stimulus;
- supporting slot counts as primary;
- completion is duplicated;
- restore reorders history.

Do not add tests in this audit.

## Step 22: Product-decision packet

Do not silently choose policy. For each decision provide current behavior, options, trade-offs, recommendation, beta-blocker status, and remediation dependency.

At minimum:

### Decision A: Minimum main-plan session credit

Options:

- reaching finish screen;
- one completed exercise;
- percentage of prescribed work;
- at least one primary focus exercise plus minimum total work;
- dose-weighted credit;
- no credit for all-skipped.

### Decision B: Which event types affect A/B/C rotation

Options:

- guided main-plan only;
- main + short main-plan;
- all training;
- extra/manual opt-in.

### Decision C: Which evidence affects progression

Options:

- main-plan only;
- any same-ladder practice;
- extra sessions but not manual;
- user-confirmed practice.

### Decision D: Dynamic generator fallback

Options:

- fail closed;
- explicit safe static fallback;
- legacy fallback with banner;
- migration-only legacy fallback.

### Decision E: Focus-slot skip policy

Options:

- allow with guidance;
- block session generation;
- replace with supporting work but mark partial;
- require equipment update.

### Decision F: Low-readiness minimum dose

Options:

- maintain one primary focus movement;
- preserve all domains;
- allow recovery-only session;
- no main-plan credit below minimum.

### Decision G: Pain-affected focus domain

Options:

- same-domain regression;
- cross-domain recovery session;
- pause main-plan credit;
- advise professional input after repeated pain.

### Decision H: Block timing

Options:

- calendar four weeks;
- 12 main sessions;
- hybrid;
- extend after lapses.

### Decision I: Extra/manual session effect

Options:

- no official effect;
- progression only;
- rotation only;
- explicit user confirmation.

### Decision J: Top-of-ladder behavior

Options:

- maintain;
- add load/equipment;
- switch variation;
- deload/retest;
- optional levels.

### Decision K: No-equipment product promise

Options:

- full plan promise;
- starting-only promise;
- honest partial sessions;
- require/recommend Pearl Movement Kit after a point.

### Decision L: Completion idempotency and offline conflict

Define authoritative key and conflict policy.

## Step 23: Confirmed-finding standard

Every confirmed defect must include:

1. Finding ID.
2. Priority P0/P1/P2/P3.
3. Confidence.
4. Exact trigger.
5. Runtime entrypoint.
6. Complete call chain.
7. Minimal state/input.
8. Actual behavior.
9. Violated invariant.
10. User impact.
11. Training/progression impact.
12. Existing test status.
13. Recommended remediation batch.

Use:

| Finding | Priority | Confidence | Trigger | Runtime chain | Actual | Expected | Test gap | Impact | Remediation |

Separate:

- confirmed software defects;
- latent defects;
- product decisions;
- Stage 4 catalogue limitations;
- persistence/restore risks;
- observability gaps;
- physical-device dependencies.

## Step 24: Recommended remediation batches

Do not implement.

Propose narrowly scoped batches, such as:

- Stage 5A: session-type filtering and A/B/C rotation integrity.
- Stage 5B: completion-credit and all-skipped hardening.
- Stage 5C: dynamic fallback containment/legacy retirement.
- Stage 5D: progression evidence and idempotency.
- Stage 5E: pain/readiness minimum-stimulus policy.
- Stage 5F: date-key/determinism/persistence hardening.
- Stage 5G: block timing/lapse/re-test semantics.
- Stage 5H: scenario/property test expansion.

For each:

| Batch | Findings | Files likely involved | Tests required | Product decision required | Beta blocker? | Dependency order |

## Required report structure

Write:

docs/audits/PEARL_LOGIC_AUDIT_STAGE_5.md

with sections:

1. Executive verdict.
2. Baseline validation and repository status.
3. Generation architecture and sequence diagrams.
4. Generator input register.
5. Generator output contract.
6. First-block creation audit.
7. Four-week block state model.
8. A/B/C rotation audit.
9. Session-template/focus-stimulus audit.
10. Equipment and safety matrix.
11. Readiness/autoregulation audit.
12. Pain and contraindication audit.
13. Short-session audit.
14. Completion-semantics audit.
15. Progression/regression audit.
16. Non-training history contamination audit.
17. Generator fallback audit.
18. Determinism/date/time audit.
19. Persistence/sync/restore audit.
20. Lapse/restart/adherence audit.
21. Adversarial scenario matrix.
22. Generator invariant register with at least 100 invariants.
23. Existing-test and false-confidence analysis.
24. Confirmed finding register.
25. Product-decision packet.
26. Recommended remediation batches.
27. Beta blockers.
28. Final stage decisions.
29. Final Git status.

## Acceptance criteria

Do not mark Stage 5 audit complete unless:

1. Every production generation entrypoint is traced.
2. Dynamic and legacy paths are separately traced.
3. All generator inputs/defaults/precedence are documented.
4. All generated outputs and invariants are documented.
5. First-block creation is audited.
6. A/B/C rotation is audited.
7. All completion/event types are classified.
8. Main-plan credit semantics are explicit.
9. Progression evidence semantics are explicit.
10. Equipment/readiness/pain matrices are covered.
11. Short sessions are audited.
12. Generator fallbacks are audited.
13. Determinism/date behavior is audited.
14. Persistence/restore is audited.
15. Lapse/restart behavior is audited.
16. At least 100 invariants are evaluated.
17. Existing tests are audited for false confidence.
18. Product decisions are exposed rather than silently chosen.
19. Remediation batches are dependency-ordered.
20. No production code/tests/config/dependencies are changed.
21. Validation and final Git status are recorded.

## Stage decisions

At the end of the report, state exactly one:

- STAGE 5 AUDIT COMPLETE
- STAGE 5 AUDIT BLOCKED

Also state exactly one:

- STAGE 5 REMEDIATION REQUIRED
- NO STAGE 5 REMEDIATION REQUIRED

Also state exactly one:

- DYNAMIC WORKOUT GENERATION BETA-READY
- DYNAMIC WORKOUT GENERATION BETA-BLOCKED

Also state:

- STAGE 4 REMEDIATION STILL REQUIRED
- STAGE 3D-B REQUIRED

Stage 4 cueing/pain/progression polish and Stage 3D-B norm provenance may remain required even if the Stage 5 architecture audit is complete.

## Final Codex response

Return a concise summary containing:

- Report path.
- Validation results.
- Number of generation entrypoints audited.
- Number of input groups audited.
- Number of scenario classes audited.
- Number of invariants evaluated and failed.
- P0/P1/P2/P3 finding counts.
- Current minimum session-completion rule.
- Current A/B/C rotation rule.
- Whether non-training history contaminates rotation/progression.
- Whether all-skipped sessions receive credit.
- Whether dynamic failure silently falls back to legacy.
- Whether date-key behavior is correct.
- Whether progression is idempotent and correctly scoped.
- Top 10 generation risks.
- Product decisions requiring approval.
- Recommended remediation batches.
- STAGE 5 AUDIT COMPLETE or STAGE 5 AUDIT BLOCKED.
- STAGE 5 REMEDIATION REQUIRED or NO STAGE 5 REMEDIATION REQUIRED.
- DYNAMIC WORKOUT GENERATION BETA-READY or DYNAMIC WORKOUT GENERATION BETA-BLOCKED.
- STAGE 4 REMEDIATION STILL REQUIRED.
- STAGE 3D-B REQUIRED.
- Initial and final Git status.
- Confirmation that no production code, tests, fixtures, exercise definitions, workout logic, config, dependencies, commit, staging, branch, or push occurred.
