You are carrying out Stage 4F-R of Hale’s production-readiness work:

MOVEMENT-SPECIFIC PROGRESSION AUDIT, CORE-LADDER DOMAIN REVIEW, EVIDENCE-SIGNAL SUITABILITY, AND CONTROLLED-BETA PROGRESSION READINESS

“Stage 4F-R” is the read-only movement-specific progression and domain-review stage arising from the post-Stage-5 Stage 4 Remaining-Findings Verification.

This is a read-only audit and product-decision task.

Do not implement progression changes in this task.

Do not begin Stage 4G-R mobility/product-positioning remediation, Stage 3D-B, physical-device validation, store-release work, or unrelated UI/product work.

## Required prior reading

Read these reports in full before analysis:

- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_4_REMAINING.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4C_R.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4D_R.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_4D_R_1.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_4D_R_1_CONTINUATION.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4E_R.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5H.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5D.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5D_1.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5E.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5E_1.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5F.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5G_1.md

Also read relevant upstream evidence contracts:

- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_2A_1.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3B.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_3C_1.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_A.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_C.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_D.md

Treat the current working tree as the source of truth. Re-verify every relevant file and runtime path because prior report line numbers may no longer be exact.

## Verified baseline entering Stage 4F-R

The current catalogue contains:

- 37 registered exercise levels;
- 11 ladders;
- 37 ladder levels;
- 30 `v1_core` levels;
- 7 `v1_optional` levels;
- 8 ladders currently marked linear;
- 2 ladders currently marked supporting sets;
- 1 ladder currently marked collection.

Stage 4C-R is complete:

- floor-transfer capability is separate from floor space;
- step-up environment is explicitly confirmed;
- single-leg balance confidence is explicitly confirmed;
- Explore/manual practice uses explicit daily readiness/discomfort;
- movement-capability snapshots and stale-plan validation exist.

Stage 4D-R and Stage 4D-R.1 are complete and verified:

- one canonical safety-cue system exists;
- every registered exercise has a safety profile;
- global/setup/active/repeat/recovery cues are implemented;
- Clara and Marcus each have all 44 required safety cues;
- 88/88 safety MP3 assets and static mappings validate;
- text fallback and player controls are verified.

Stage 4E-R is complete:

- all seven current `v1_optional` levels are hidden in controlled beta;
- generator, progression, Explore, manual practice, presets, restore, direct calls, and start validation consume one controlled-beta release policy;
- progression cannot enter optional levels;
- restored optional state is capped for current planning without historical rewrite;
- safety audio remains verified.

Stage 5 is complete:

- only valid credited current main-plan work can progress;
- progression is feedback-gated and idempotent;
- primary/supporting evidence is exercise-local;
- fallback/skipped/invalid evidence is ineligible;
- one ladder mutates at most once per credited completion;
- cautious, short, and discomfort-adjusted sessions are `hold_only`;
- current equipment and schedule authority are deterministic;
- full lifecycle and adversarial tests are green.

Stage 4E-R validation passed:

- `npm run verify:audio`: 44 cues / 88 assets;
- targeted: 16 suites / 236 tests;
- full Jest: 101 suites / 823 tests;
- app typecheck;
- website typecheck;
- Expo config;
- Expo export;
- `git diff --check`.

Do not assume these counts are unchanged. Re-run and report the current baseline.

## Finding addressed by Stage 4F-R

### F4R-008 — P2

Progression authority is software-safe, but movement-specific progression prerequisites and content logic remain generic.

Current progression broadly combines:

- explicit completed work;
- main-plan/focus/schedule credit;
- perceived effort;
- pain feedback;
- tracking quality;
- valid-time signals where present;
- repeated eligible exposures;
- current ladder state;
- controlled-beta release ceiling.

That architecture is materially safer than before Stage 5.

However, it does not automatically prove that:

- every level transition is genuinely harder;
- each transition is appropriate for unsupervised adults aged approximately 45–65;
- a generic exposure/RPE rule is suitable for every ladder;
- camera evidence is meaningful for the relevant movement;
- support removal is justified;
- power, single-leg, floor, step, or band transitions have sufficient prerequisites;
- different movement patterns grouped in one ladder should share a progression state;
- one ladder should be linear at all;
- the current core ceiling is appropriate before device/domain evidence exists.

Stage 4F-R must determine what is safe and coherent for controlled beta.

## Findings explicitly deferred

Do not attempt to close these in this task:

### F4R-009

Mobility collection labels and rotation/presentation polish.

You must assess progression semantics that affect F4R-008, but do not implement or broadly redesign mobility rotation.

### F4R-010

Final minimal-equipment and Hale Movement Kit positioning.

You may note progression implications, but do not change product copy.

### Stage 3D-B

Norm provenance and scoring-source review.

### Physical-device validation

Do not claim real-home tracking reliability from code or tests.

## Primary objectives

1. Reconstruct the complete current progression architecture after Stages 4E-R and 5D/5E.

2. Re-inventory every current ladder, level, transition, progression model, release status, equipment requirement, movement capability, and evidence signal.

3. Audit every current core-to-core transition.

4. Determine whether each ladder is correctly classified as:
   - linear;
   - supporting set;
   - collection;
   - single-level/no progression;
   - mixed and incorrectly modelled.

5. Determine whether each level transition is:
   - genuinely harder;
   - a different movement rather than a harder movement;
   - a support removal;
   - a range increase;
   - a tempo change;
   - a power change;
   - an equipment/setup change;
   - a floor transition;
   - a stability change;
   - a load change;
   - an optional/hidden future transition.

6. Determine whether the current evidence used for each transition is suitable.

7. Determine whether generic automatic progression is acceptable for each ladder in controlled beta.

8. Identify transitions requiring:
   - movement-specific software prerequisites;
   - a capability confirmation;
   - measured valid-time or performance evidence;
   - physical-device validation;
   - exercise-domain review;
   - a lower controlled-beta ceiling;
   - manual approval only;
   - no automatic progression.

9. Verify current progression behavior under:
   - normal;
   - `hold_only`;
   - `ineligible`;
   - pain;
   - poor tracking;
   - valid-time uncertainty;
   - controlled-beta ceiling;
   - restored optional state;
   - duplicate/replayed evidence.

10. Distinguish software progression correctness from exercise-programming quality.

11. Produce a decision packet and the smallest future remediation plan.

12. Decide whether F4R-008 is:
   - closed for controlled beta;
   - partially closed;
   - software-remediation required;
   - domain-review required;
   - physical-device-validation dependent.

13. Decide whether the core progression system is software/content-ready for a controlled beta.

## Output file

Create exactly one new repository file:

```text
docs/audits/HALE_LOGIC_AUDIT_STAGE_4F_R.md
```

Do not edit any prior report.

Do not create another repository file.

Temporary diagnostic scripts or output may be created only outside the repository, such as under `/tmp`, and removed after use.

## Non-negotiable read-only rules

1. Do not modify production code.

2. Do not modify tests or fixtures.

3. Do not modify exercise definitions.

4. Do not modify ladder definitions.

5. Do not modify release policy.

6. Do not modify progression thresholds.

7. Do not modify safety cues or MP3 assets.

8. Do not modify UI/copy.

9. Do not modify scoring, norms, Check-Up logic, pose logic, backend logic, config, dependencies, or assets.

10. Do not install packages.

11. Do not regenerate audio.

12. Do not stage, commit, create a branch, or push.

13. Do not use network access.

14. Do not make medical or clinical claims.

15. Passing tests proves encoded behavior, not movement-programming suitability.

16. If a decision needs exercise-domain or physical-device evidence, say so explicitly rather than inventing certainty.

## Working-tree safety

Before analysis, run:

```bash
git status --short --untracked-files=all
git diff --name-only
git diff --stat
```

Record exact output in the report.

Important current-tree notes from Stage 4E-R:

- The 88 generated Clara/Marcus safety MP3s and their manifests are part of the intended current change set.
- Do not delete, regenerate, rename, or omit them.
- Concurrent/external changes were observed in:
  - `src/checkup/checkup.ts`;
  - `src/screens/CheckUpScreen.tsx`;
  - `src/screens/TrainingSessionScreen.tsx`;
  - `website/next-env.d.ts`;
  - `website/package-lock.json`.
- The `website/package-lock.json` modification was not Stage 4E-R-owned.
- Do not expose `.env` values or ElevenLabs credentials.

Rules:

- Treat all current modified/untracked files as user-owned.
- Inspect current diffs in every materially cited file.
- Do not revert, overwrite, format, move, or delete unrelated work.
- Run the same Git commands at the end.
- The only intended repository addition is the Stage 4F-R report.
- If unrelated files change during the audit, record them and do not overwrite them.

## Baseline validation

Run a targeted existing test slice covering at minimum:

- exercise catalogue;
- release policy;
- progression decision engine;
- progression evidence;
- valid-time progression;
- valid-time exercise metadata;
- set graders;
- workout generation;
- daily training context;
- movement capabilities;
- session planning;
- serialization/restore;
- Stage 5H lifecycle;
- safety cue/audio integrity.

Then run exactly:

```bash
npm run verify:audio
npm test -- --runInBand
npm run typecheck
npm --prefix website run typecheck
npx --no-install expo config --type public
git diff --check
```

Do not regenerate audio.

Record:

- exact targeted command;
- targeted suite/test counts;
- full suite/test counts;
- audio verification counts;
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

## Step 1: Reconstruct the current progression architecture

Inspect at minimum:

- src/exercises/types.ts
- src/exercises/ladders.ts
- src/exercises/registry.ts
- src/exercises/index.ts
- every registered exercise-definition file
- src/exercises/releasePolicy.ts
- src/exercises/setGraders.ts
- src/exercises/validTime.ts
- src/training/progression.ts
- src/training/validTimeProgression.ts
- src/training/workoutGeneration.ts
- src/training/dailyTrainingContext.ts
- src/training/movementCapabilitySafety.ts
- src/training/equipmentSafety.ts
- src/haleFlow/progressionEvidence.ts
- src/haleFlow/sessionPlanning.ts
- src/haleFlow/focusStimulusEvidence.ts
- src/haleFlow/mainPlanEvents.ts
- src/haleFlow/blockSchedule.ts
- src/training/dynamicState.ts
- src/training/serialize.ts
- relevant local/backend restore files
- relevant progression/view-model tests.

Trace:

```text
stored ladder state
-> controlled-beta effective level
-> daily equipment/capability/readiness adjustment
-> selected exercise level
-> explicit session result
-> work/focus/schedule credit
-> feedback
-> exercise evidence
-> per-ladder aggregation
-> progression decision
-> applied event id
-> persisted ladder state
```

Document:

- authoritative state;
- current progression thresholds;
- exposure-count requirements;
- completion threshold;
- effort thresholds;
- pain behavior;
- tracking behavior;
- valid-time behavior;
- `normal`/`hold_only`/`ineligible`;
- release-cap behavior;
- max-level behavior;
- restore behavior;
- all current progression diagnostics.

Do not rely on prior report summaries when source code can answer directly.

## Step 2: Re-inventory every ladder and transition

Produce a complete table:

| Ladder | Current model | Core levels in order | Hidden optional levels | Current beta ceiling | Evidence type | Number of core transitions |

For every adjacent core transition, produce:

| Transition ID | Ladder | From | To | What changes | Equipment/capability change | Current gate | Current evidence | Initial concern |

Use stable audit IDs such as:

- `T-ST-01`;
- `T-SQ-01`;
- `T-BAL-02`.

Do not omit ladders with only one core level or no automatic transition.

## Step 3: Classify progression semantics

For every transition, classify the primary progression dimension:

- support reduction;
- range increase;
- rep/duration increase;
- tempo/control;
- power/speed;
- instability/balance demand;
- unilateral demand;
- equipment/setup change;
- floor transfer;
- band/anchor complexity;
- movement-pattern substitution;
- different exercise in a supporting set;
- collection variety rather than progression.

Flag transitions that mix more than one major difficulty dimension.

Flag transitions that are not obviously monotonic.

## Step 4: Reconstruct actual current decision behavior

Using existing tests and optional read-only `/tmp` probes, trace each linear ladder under:

1. One eligible easy exposure.
2. Repeated eligible easy exposures until current code progresses or holds.
3. Moderate effort.
4. High effort.
5. Pain.
6. Missing feedback.
7. Poor tracking.
8. Valid-time incomplete.
9. Valid-time reset/interruption.
10. `hold_only`.
11. `ineligible`.
12. At controlled-beta ceiling.
13. Restored state above the beta ceiling.
14. Duplicate/replayed event.

Record:

| Ladder/level | Scenario | Current decision | Level before | Level after | Diagnostic reason |

Do not modify tests or code to make the probe easier.

Remove temporary probes after use.

## Step 5: Audit the sit-to-stand ladder

Re-verify the actual current order, likely including:

- cushion-assisted sit-to-stand;
- standard sit-to-stand;
- slow-eccentric sit-to-stand;
- power sit-to-stand;
- optional loaded sit-to-stand hidden by Stage 4E-R.

Questions:

1. Is every core transition genuinely harder?

2. Is cushion removal a suitable automatic transition from completion/RPE alone?

3. Does standard to slow eccentric represent greater difficulty or a different training emphasis?

4. Does slow eccentric to power require a separate readiness/control prerequisite?

5. Should power progression require:
   - stable rep counting;
   - rise-speed evidence;
   - minimum standard-chair performance;
   - no pain;
   - no `hold_only`;
   - physical-device validation?

6. Is the current chair/seat-height variability acknowledged?

7. Does the controlled-beta cap at power make sense?

8. Can generic progression overpromote someone who moved slowly or inconsistently but reported easy effort?

Classify each transition:

- auto-progress acceptable;
- needs movement-specific gate;
- hold for beta;
- device validation required;
- domain review required.

## Step 6: Audit the squat ladder

Re-verify:

- supported squat;
- free squat;
- hidden optional slow eccentric;
- hidden optional loaded squat;
- hidden optional split squat.

Questions:

1. Is supported to free squat a monotonic progression?

2. Does it require explicit confidence without support?

3. Does current tracking detect meaningful depth/control, or only completion?

4. Can the user remove support after two easy exposures despite shallow/poor-quality reps?

5. Is there a safe core ceiling at free squat for controlled beta?

6. Are optional transitions correctly contained?

7. Does knee/hip/back discomfort interact conservatively?

8. Does the current generator/regression path return to support without mutating persistent progress?

## Step 7: Audit step-up

Step-up currently has one core level.

Questions:

1. Is it correctly treated as a standalone level rather than a ladder progression?

2. Does it receive progression events despite having no higher core level?

3. Does `release_cap_reached` or top-level hold behave honestly?

4. Should its selection require completion of a lower-body prerequisite such as controlled sit-to-stand or squat?

5. Does Stage 4C-R environment confirmation adequately replace a progression prerequisite?

6. Should step-up remain core, primary, supporting, or manual-only until device/domain review?

7. What physical-device evidence is needed for camera placement, counting, and pacing?

## Step 8: Audit heel/toe raise

Re-verify the actual sequence, likely involving:

- supported heel raise;
- free heel raise;
- supported toe raise.

Questions:

1. Is toe raise genuinely a harder progression from heel raise, or a distinct complementary movement?

2. Should heel and toe work be separate ladders or a supporting set?

3. Is support removal appropriate from RPE/completion alone?

4. Does the camera/valid-time system measure the intended movement sufficiently?

5. Is ankle/foot discomfort gating conservative?

6. Can current generic progression reduce training coverage by replacing calf work with dorsiflexor work?

7. Is current top-level behavior honest?

## Step 9: Audit push

Re-verify:

- wall push-up;
- incline push-up;
- hidden standard floor push-up.

Questions:

1. Is wall to incline monotonic when incline height is not standardized?

2. Could a high incline be easier than a low wall setup?

3. Does the app record/know surface height?

4. Is completion/RPE sufficient to progress without setup standardization?

5. Should the controlled-beta policy:
   - keep both core levels but let the user choose surface;
   - hold at wall until a setup confirmation;
   - treat them as variants rather than strict levels?

6. Does shoulder discomfort block both correctly?

7. Is the hidden standard push-up correctly contained despite floor-transfer confirmation?

## Step 10: Audit upper-body pull

Re-verify the actual sequence, likely including:

- seated band row;
- standing anchored row;
- band pull-apart.

Questions:

1. Are these three exercises a true difficulty ladder?

2. Is standing anchored row necessarily harder than seated row?

3. Is band pull-apart a progression or a different upper-back stimulus?

4. Does band tension make level order non-deterministic?

5. Should this ladder be:
   - linear;
   - supporting set;
   - collection;
   - separate row and pull-apart tracks?

6. Does equipment change from seated feet anchor to door anchor justify automatic progression?

7. Is band tension/load unmeasured and therefore unsuitable for automatic advancement?

8. Should current beta keep a fixed safe row variant rather than auto-progressing setup complexity?

9. Does Stage 4D-R cueing close safety but not programming suitability?

## Step 11: Audit hinge/glutes

Re-verify the actual sequence, likely including:

- wall hip hinge;
- free hip hinge;
- glute bridge hold;
- glute bridge reps.

Questions:

1. Is moving from standing hinge to floor bridge a true progression?

2. Are hinge and glute bridge different movement patterns that should not share one level state?

3. Does floor-transfer capability make the transition available but not necessarily harder?

4. Could a user lose hinge practice because they progressed into bridge work?

5. Does bridge hold to bridge reps represent a coherent progression?

6. Should hinge and bridge be:
   - separate ladders;
   - supporting set;
   - alternating collection?

7. Is current progression evidence movement-specific enough?

8. Does hip/back discomfort appropriately hold/exclude both?

## Step 12: Audit shoulder reach/press

Re-verify its current `supporting_set` semantics and levels, likely:

- overhead reach;
- overhead band press.

Questions:

1. Is the current model correctly non-linear?

2. Does any consumer still treat the entries as level progression?

3. Can progression state or “current level” UI imply the press is a harder version of reach?

4. Is band press appropriately cross-domain supporting?

5. Does shoulder discomfort block both?

6. Does equipment availability cause the supporting set to collapse honestly?

7. Is any progression event being applied to a supporting-set ladder when it should be exposure-only?

## Step 13: Audit static balance

Re-verify:

- feet-together hold;
- tandem hold;
- single-leg hold.

Questions:

1. Is the sequence monotonic?

2. Are duration targets normalized appropriately across levels?

3. Does valid-time evidence measure actual stable hold time?

4. Does progression require a sufficiently clean hold rather than only completion/RPE?

5. Is Stage 4C-R supported single-leg confidence enough?

6. Should tandem-to-single-leg require:
   - minimum valid hold;
   - no support contact beyond allowed;
   - tracking confidence;
   - repeated exposures;
   - device validation?

7. Does shorter single-leg target make it more achievable but still meaningfully harder?

8. Should the beta ceiling be tandem until device evidence exists?

## Step 14: Audit lateral/dynamic stability

Re-verify its current supporting-set or linear semantics, likely including:

- supported side-step;
- march in place;
- hidden mini-band lateral walk.

Questions:

1. Are supported side-step and march in place complementary or progressive?

2. Does any current consumer treat them as levels?

3. Is “loaded march” legacy ID fully contained in user-facing behavior?

4. Does ankle/knee discomfort filtering cover both?

5. Should these movements rotate rather than progress?

6. Is mini-band lateral walk correctly hidden?

7. Does completion/RPE progression have any meaningful role here?

## Step 15: Audit mobility collection

This is not the main F4R-009 remediation stage, but progression semantics must be checked.

Re-verify:

- seated hamstring reach;
- thoracic rotation;
- supported hip-flexor stretch;
- wall calf stretch;
- hidden neck rotation.

Questions:

1. Is every progression consumer respecting `collection` semantics?

2. Does any stored `currentLevel` incorrectly represent one mobility drill as higher?

3. Does progression evidence mutate mobility collection state?

4. Does Explore display “level” language that could misrepresent progression?

5. Does generation rotate items or repeatedly choose the same one?

6. Is any mobility drill lost after another is selected?

7. What is F4R-008 versus F4R-009:
   - progression defect;
   - presentation/rotation polish?

Do not implement rotation changes.

## Step 16: Audit evidence-signal suitability

Create a complete matrix:

| Ladder | Completion evidence | RPE relevance | Pain relevance | Tracking relevance | Valid-time relevance | Range/velocity relevance | Current use | Verdict |

Questions:

- Which ladders have meaningful camera-assisted evidence?
- Which rely only on self-report?
- Which valid-time signals are actually specific to the movement?
- Which transitions need measured range, hold time, rep quality, or speed?
- Which signals are currently unavailable?
- Can self-reported easy effort override poor movement evidence?
- Does `hold_only` prevent unsafe positive progression sufficiently?
- Does missing evidence fail closed?

## Step 17: Audit generic threshold suitability

Re-derive current thresholds from source.

Do not assume prior report values.

Evaluate whether one generic rule is appropriate across:

- strength repetitions;
- tempo control;
- power;
- static balance;
- dynamic balance;
- band exercises;
- floor exercises;
- mobility/supporting sets.

Create:

| Current rule | Ladders where suitable | Ladders where questionable | Why | Recommended beta policy |

Possible recommendations:

- retain generic rule;
- movement-specific threshold;
- valid-time prerequisite;
- minimum exposure count increase;
- manual confirmation;
- no automatic progression;
- cap at current core level;
- domain/device review.

Do not implement recommendations.

## Step 18: Audit progression frequency and schedule interaction

Trace how often one ladder can receive eligible evidence within the four-week A/B/C schedule.

Questions:

1. Can one ladder receive two easy exposures within a few days?

2. Does one-credit-per-date meaningfully limit progression speed?

3. Can supporting exercises progress faster than primary focus work?

4. Can the same ladder appear in A/B/C and progress after two exposures inside one week?

5. Is that acceptable for each ladder?

6. Does restart/short/adjusted `hold_only` prevent positive progression?

7. Does a long lapse preserve a level that may no longer be appropriate?

8. Should a 14+ day lapse require a re-confirmation before progression resumes?

Classify as:

- current schedule sufficient;
- progression frequency too fast;
- uncertain pending domain/device review.

## Step 19: Audit regress/hold behavior

For each linear ladder, determine:

- what causes hold;
- what causes regress;
- whether regression has a safe lower core level;
- whether regression can cross a capability/equipment boundary;
- whether regression changes today’s selected level only or persistent state;
- whether repeated pain can lower state;
- whether support is restored when needed;
- whether top/bottom behavior is coherent.

Flag ladders where:

- the lower level is a different movement;
- no safe lower level exists;
- persistent regression could be confusing;
- capability denial and progression state conflict.

## Step 20: Audit controlled-beta ceiling behavior

Stage 4E-R capped all optional levels.

For every ladder:

- verify the current beta ceiling;
- verify honest maintenance at ceiling;
- verify no false “level up” copy;
- verify restored optional state derives the correct effective level;
- verify release cap does not hide a deeper core-transition issue.

Classify whether the current core ceiling is:

- appropriate for beta;
- too advanced without domain/device evidence;
- too low but acceptable;
- semantically wrong.

## Step 21: Measurement-to-training alignment

Create:

| Check-Up domain/metric | Relevant ladders | Direct transfer claim justified? | Supporting transfer | Progression evidence alignment | Gap |

At minimum:

- chair-stand strength/power;
- balance hold;
- shoulder mobility;
- hinge/reach supporting metric.

Questions:

- Does progression target what Hale measured?
- Does strength progression use any chair-stand quality/speed evidence?
- Does balance progression use measured hold evidence?
- Does mobility collection pretend to progress from shoulder score alone?
- Are upper-body pull and push correctly framed as broad capability support rather than directly measured deficits?

## Step 22: Explore/manual/history consistency

Verify:

- optional levels remain hidden;
- manual practice remains progression-ineligible;
- Explore “current level” uses effective beta level;
- historical optional records remain read-only;
- collection/supporting-set items are not incorrectly presented as linear;
- current progression state cannot be altered by non-main sessions;
- no direct call bypass exists.

This is a verification step only.

## Step 23: Restore and persistence consistency

Verify:

- authoritative ladder state round-trips;
- applied event IDs round-trip;
- optional historical progress remains capped for current planning;
- no legacy progression promotion;
- no read-time progression;
- current model/ladder changes would not silently reinterpret old indices;
- ladder level IDs, not raw array indices, remain authoritative where possible.

Flag migration risk if progression semantics are changed later.

## Step 24: Test-quality and false-confidence audit

Review current tests.

Identify tests that can remain green while:

- a transition is not actually harder;
- a different movement is modelled as a progression;
- support removal occurs without movement-quality evidence;
- power progression uses only RPE;
- band tension varies;
- incline height varies;
- single-leg progression lacks clean hold evidence;
- hinge progression switches to bridge;
- mobility/supporting sets are presented as levels.

Do not add tests.

Recommend focused tests for any future remediation.

## Step 25: Physical-device dependency map

For every uncertain transition, classify the minimum evidence required.

Examples:

- repeated chair-stand rep/speed recordings;
- squat depth/control under real camera angles;
- step-up rep detection and camera placement;
- heel/toe movement detectability;
- incline surface-height variability;
- band movement tracking under variable tension;
- bridge tracking on floor;
- balance hold valid-time and support contact;
- session pacing and user comprehension.

Create:

| Transition/finding | Static code proof possible? | Device evidence required? | Domain review required? | Minimum evidence | Beta blocker? |

Do not claim device validation from unit tests.

## Step 26: Exercise-domain decision packet

For each decision, provide:

- current behavior;
- options;
- recommendation;
- rationale;
- software impact;
- device/domain dependency;
- beta-blocker status.

At minimum:

### Decision A: Sit-to-stand power

Can automatic progression reach power using current evidence, or should power require device-validated speed/control evidence?

### Decision B: Supported to free squat

Is generic easy-effort progression enough to remove support?

### Decision C: Step-up

Should step-up remain a standalone core level, require a lower-body prerequisite, or be supporting/manual-only?

### Decision D: Heel versus toe raise

Linear ladder, separate ladders, or supporting set?

### Decision E: Wall versus incline push-up

How should non-standardized surface height affect progression?

### Decision F: Upper-body pull

Linear ladder, separate row/pull-apart tracks, or supporting set?

### Decision G: Hinge versus bridge

One ladder, separate ladders, or supporting set?

### Decision H: Static balance

What valid-time/hold prerequisite is required for tandem and single-leg?

### Decision I: Lateral stability

Progression or rotation/supporting set?

### Decision J: Generic progression rule

Which ladders may retain it for controlled beta?

## Step 27: Current finding register

Create new findings:

- `F4F-001`;
- `F4F-002`;
- etc.

For every finding include:

1. Priority:
   - P0;
   - P1;
   - P2;
   - P3.
2. Confidence.
3. Ladder/transition.
4. Exact current behavior.
5. Why it may be unsuitable.
6. User/trust impact.
7. Code/test evidence.
8. Static remediation.
9. Domain/device dependency.
10. Controlled-beta blocker status.

Separate:

- confirmed software defect;
- content/programming defect;
- product decision;
- domain review;
- device-validation dependency;
- acceptable post-beta improvement.

Do not inflate ordinary programming refinement into P0/P1 without a concrete safety/trust consequence.

## Step 28: Progression invariant register

Evaluate at least 100 progression/content invariants.

Use:

| ID | Invariant | Status | Evidence | Residual risk |

Statuses:

- Holds.
- Fails.
- Holds under explicit preconditions.
- Product decision required.
- Domain review required.
- Physical-device validation required.
- Deferred to F4R-009/F4R-010.
- Not provable statically.

Cover:

- authority;
- evidence;
- monotonicity;
- capability;
- equipment;
- readiness;
- pain;
- valid time;
- tracking;
- support removal;
- power;
- balance;
- floor;
- band;
- release caps;
- restore;
- copy truthfulness;
- collection/supporting semantics.

## Step 29: Controlled-beta progression verdict per ladder

Produce:

| Ladder | Software authority | Content coherence | Current evidence suitability | Beta ceiling | Controlled-beta verdict | Required action |

Allowed verdicts:

- Ready for automatic progression in controlled beta.
- Ready with explicit preconditions already implemented.
- Ready only with a lower beta ceiling.
- Keep core exercise but disable automatic progression.
- Reclassify as supporting set/collection before beta.
- Domain review required before beta.
- Physical-device evidence required before beta.
- Post-beta refinement only.

Every ladder must receive exactly one verdict.

## Step 30: Remediation plan

Do not implement.

Propose only evidence-supported batches.

Possible structure:

### Stage 4F-R.1 — low-risk software corrections

Examples:

- reclassify a mixed ladder;
- add movement-specific prerequisite metadata;
- prevent collection/supporting state mutation;
- lower a beta ceiling.

### Stage 4F-R.2 — exercise-domain-approved transition rules

Examples:

- specific exposure counts;
- valid-time prerequisites;
- support-removal prerequisites;
- power criteria.

### Device-validation gate

No code changes until recordings/user evidence exist.

For each batch:

| Batch | Findings | Likely files | Tests | Product/domain decision | Device dependency | Beta blocker |

Do not invent a remediation batch when current behavior is already acceptable.

## Step 31: Controlled-beta readiness decisions

Evaluate three separate questions.

### A. F4R-008 status

State exactly one:

- `F4R-008 CLOSED FOR CONTROLLED BETA`
- `F4R-008 PARTIALLY CLOSED`
- `F4R-008 REMEDIATION REQUIRED`
- `F4R-008 DOMAIN/DEVICE VALIDATION REQUIRED`

### B. Progression software/content readiness

State exactly one:

- `CORE PROGRESSION SOFTWARE/CONTENT-READY FOR CONTROLLED BETA`
- `CORE PROGRESSION SOFTWARE/CONTENT-BLOCKED`

Use ready only if:

- no unresolved P0/P1 progression-content defect exists;
- every core ladder has a coherent model;
- questionable transitions are capped/disabled or already protected;
- generic progression is suitable where used;
- user-facing progression does not overclaim;
- any remaining P2/P3 uncertainty is safely deferred.

### C. Stage 4 status

State exactly one:

- `STAGE 4 REMEDIATION COMPLETE`
- `STAGE 4 REMEDIATION STILL REQUIRED`

F4R-009 and F4R-010 may still keep Stage 4 open even if core progression is ready.

Regardless of the Stage 4F-R result, also state:

- `STAGE 5 REMEDIATION COMPLETE`
- `DYNAMIC WORKOUT GENERATION SOFTWARE-READY FOR CONTROLLED BETA`
- `OVERALL BETA RELEASE STILL BLOCKED`
- `STAGE 3D-B REQUIRED`
- `BETA DEVICE VALIDATION REQUIRED`

Do not declare Hale generally beta-ready.

## Required report structure

Write:

```text
docs/audits/HALE_LOGIC_AUDIT_STAGE_4F_R.md
```

with these sections:

1. Executive verdict.
2. Scope.
3. Initial Git status.
4. Baseline validation.
5. Current progression architecture.
6. Current threshold/evidence contract.
7. Ladder and transition inventory.
8. Progression-semantic classification.
9. Current decision-behavior probes.
10. Sit-to-stand audit.
11. Squat audit.
12. Step-up audit.
13. Heel/toe raise audit.
14. Push audit.
15. Upper-body pull audit.
16. Hinge/glutes audit.
17. Shoulder reach/press audit.
18. Static balance audit.
19. Lateral/dynamic stability audit.
20. Mobility collection progression audit.
21. Evidence-signal suitability matrix.
22. Generic-threshold suitability.
23. Progression frequency/schedule interaction.
24. Regress/hold behavior.
25. Controlled-beta ceiling behavior.
26. Measurement-to-training alignment.
27. Explore/manual/history consistency.
28. Restore/persistence consistency.
29. Test-quality/false-confidence audit.
30. Physical-device dependency map.
31. Exercise-domain decision packet.
32. Current finding register.
33. Progression invariant register with at least 100 invariants.
34. Per-ladder controlled-beta verdict.
35. Recommended remediation plan.
36. F4R-008 decision.
37. Core progression readiness.
38. Remaining Stage 4 work.
39. Final stage decisions.
40. Final Git status.

## Acceptance criteria

Do not mark Stage 4F-R complete unless:

1. The current progression architecture is traced end to end.

2. All 11 ladders are inventoried.

3. Every core-to-core transition is explicitly audited.

4. Every ladder’s progression model is judged.

5. Current thresholds are re-derived from source.

6. Current decision behavior is probed for normal, hold, pain, tracking, valid-time, cap, restore, and replay cases.

7. Sit-to-stand power is explicitly assessed.

8. Support removal in squat/push/balance is assessed.

9. Step-up standalone/prerequisite policy is assessed.

10. Heel/toe semantics are assessed.

11. Upper-pull linearity is assessed.

12. Hinge/bridge linearity is assessed.

13. Balance valid-time prerequisites are assessed.

14. Supporting-set and collection consumers are assessed.

15. Controlled-beta ceilings are assessed per ladder.

16. Measurement-to-training alignment is assessed.

17. Physical-device and domain-review dependencies are explicit.

18. At least 100 invariants are evaluated.

19. Every ladder receives one controlled-beta verdict.

20. Only evidence-supported future remediation is proposed.

21. `npm run verify:audio` passes.

22. Targeted tests pass.

23. Full Jest passes.

24. App typecheck passes.

25. Website typecheck passes.

26. Expo config passes.

27. `git diff --check` passes.

28. No production code, tests, configs, definitions, audio, dependencies, or assets are changed.

29. No unrelated user work is reverted or overwritten.

30. No package install, lockfile change, audio regeneration, staging, commit, branch, or push occurs.

## Stage decisions

At the end of the report, state exactly one:

- `STAGE 4F-R AUDIT COMPLETE`
- `STAGE 4F-R AUDIT BLOCKED`

Also state exactly one F4R-008 decision from Section 31.

Also state exactly one:

- `CORE PROGRESSION SOFTWARE/CONTENT-READY FOR CONTROLLED BETA`
- `CORE PROGRESSION SOFTWARE/CONTENT-BLOCKED`

Also state exactly one:

- `STAGE 4G-R UNBLOCKED`
- `STAGE 4G-R BLOCKED`

Use `STAGE 4G-R UNBLOCKED` only if no P0/P1 progression-content blocker remains and any required Stage 4F remediation is either unnecessary or clearly separable.

Also state:

- `STAGE 4G-R REQUIRED`
- `STAGE 4 REMEDIATION STILL REQUIRED` or `STAGE 4 REMEDIATION COMPLETE`
- `STAGE 5 REMEDIATION COMPLETE`
- `DYNAMIC WORKOUT GENERATION SOFTWARE-READY FOR CONTROLLED BETA`
- `OVERALL BETA RELEASE STILL BLOCKED`
- `STAGE 3D-B REQUIRED`
- `BETA DEVICE VALIDATION REQUIRED`

## Final Codex response

Return a concise summary containing:

- Report path.
- Validation results.
- Current exercise/ladder/core/optional counts.
- Current generic progression thresholds.
- Number of core transitions audited.
- Number of invariants evaluated and failed.
- Sit-to-stand verdict.
- Squat verdict.
- Step-up verdict.
- Heel/toe verdict.
- Push verdict.
- Upper-pull verdict.
- Hinge/glutes verdict.
- Static-balance verdict.
- Lateral-stability verdict.
- Mobility progression-semantic verdict.
- Evidence-signal verdict.
- Number of new P0/P1/P2/P3 findings.
- Top beta progression risks.
- Product/domain decisions required.
- Device-validation dependencies.
- Recommended remediation batches.
- F4R-008 status.
- `STAGE 4F-R AUDIT COMPLETE` or blocked.
- `CORE PROGRESSION SOFTWARE/CONTENT-READY FOR CONTROLLED BETA` or blocked.
- `STAGE 4G-R UNBLOCKED` or blocked.
- `STAGE 4G-R REQUIRED`.
- `STAGE 4 REMEDIATION STILL REQUIRED` or complete.
- `STAGE 5 REMEDIATION COMPLETE`.
- `DYNAMIC WORKOUT GENERATION SOFTWARE-READY FOR CONTROLLED BETA`.
- `OVERALL BETA RELEASE STILL BLOCKED`.
- `STAGE 3D-B REQUIRED`.
- `BETA DEVICE VALIDATION REQUIRED`.
- Initial and final Git status.
- Confirmation that no production code, tests, exercise/ladder definitions, configs, audio, dependencies, assets, package install, lockfile change, audio regeneration, staging, commit, branch, or push occurred.
