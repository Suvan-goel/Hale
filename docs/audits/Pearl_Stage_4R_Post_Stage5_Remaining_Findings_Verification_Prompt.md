You are carrying out Stage 4R of Pearl’s production-readiness work:

POST-STAGE-5 EXERCISE-CATALOGUE CLOSURE AUDIT, REMAINING SAFETY/CUEING/PROGRESSION VERIFICATION, AND CONTROLLED-BETA CONTENT READINESS

“Stage 4R” means Stage 4 Remaining-Findings Verification.

This is a read-only verification and product-decision audit.

Do not implement remediation in this task unless explicitly requested in a later prompt.

Do not begin Stage 3D-B norm-provenance work or physical-device validation in this task.

Do not modify production code, tests, exercise definitions, ladder definitions, copy, workout generation, progression logic, scoring, norms, Check-Up logic, backend code, configuration, dependencies, or assets.

## Required prior reading

Read these reports in full before beginning:

- docs/audits/PEARL_LOGIC_AUDIT_STAGE_4.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4A.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4B.md
- docs/audits/PEARL_LOGIC_AUDIT_STAGE_5.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5A.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5B.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5B_1.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5C.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5D.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5D_1.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5E.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5E_1.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5F.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5G.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5G_1.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5H.md

Also read the most relevant upstream contracts:

- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_A.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_C.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_D.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_3C_1.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_2A_1.md
- docs/audits/PEARL_LOGIC_AUDIT_STAGE_0.md

Treat the current working tree as the source of truth. Re-verify every relevant runtime path because report line numbers and implementation details may no longer be exact.

## Current verified baseline

Stage 4 originally inventoried:

- 37 registered exercises;
- 11 product-facing ladders;
- 37 ladder levels;
- no dangling exercise definitions;
- no ladder levels without registered definitions.

Original Stage 4 safety findings:

- High: 3.
- Medium: 8.
- Low: 5.

Original Stage 4 domain verdicts:

- Strength/power: mostly adequate, but upper-body pulling was band-dependent.
- Balance/stability: required safety and progression remediation.
- Mobility/flexibility: useful coverage, but not a true linear progression model.

Stage 4A subsequently implemented:

- explicit floor-space equipment gating;
- stair-plus-support gating;
- support-dependent balance/march gating;
- shared equipment/safety eligibility for generated workouts, manual practice, and Explore;
- honest upper-pull skipping instead of shoulder-mobility substitution;
- high-confidence domain/equipment consistency fixes.

Stage 4B subsequently implemented:

- explicit primary/supporting/fallback/skipped stimulus semantics;
- honest no-equipment session metadata;
- band-required upper-pull behavior;
- separate door-anchor gating;
- static vs dynamic/lateral balance semantics;
- mobility marked as a collection rather than a false linear progression;
- cross-domain/supporting metadata.

Stage 5 then implemented and verified:

- authoritative main-plan and primary-focus credit;
- no credit for all-skipped/supporting-only/fallback-only work;
- current-planner authority;
- authoritative and idempotent progression state;
- conservative discomfort/readiness filtering;
- canonical equipment state;
- stale-plan invalidation;
- four-week scheduling and restart/re-test timing;
- 500 seeded adversarial scenarios;
- full lifecycle verification across strength, balance, mobility, clear focus, exact ties, and near ties.

Stage 5H final decision:

- STAGE 5H VERIFIED.
- STAGE 5 REMEDIATION COMPLETE.
- DYNAMIC WORKOUT GENERATION SOFTWARE-READY FOR CONTROLLED BETA.
- OVERALL BETA RELEASE STILL BLOCKED.
- STAGE 4 REMEDIATION STILL REQUIRED.
- STAGE 3D-B REQUIRED.
- BETA DEVICE VALIDATION REQUIRED.

Stage 5H release baseline:

- targeted: 29 suites / 315 tests passed;
- full Jest: 95 suites / 764 tests passed;
- app typecheck passed;
- website typecheck passed;
- Expo config passed with the existing Sentry warning;
- git diff --check passed;
- original F5-001 through F5-009 closed;
- 150 Stage 5 invariants evaluated, 0 failed.

Stage 4R must now determine exactly which original Stage 4 findings remain genuinely open after all Stage 4A/4B and Stage 5 work.

## Why this audit is necessary

Do not assume “Stage 4 remediation still required” means every original finding is still open.

Several Stage 4 findings were addressed indirectly later:

- pain/readiness filtering was substantially hardened by Stage 5E;
- equipment authority and restore consistency were hardened by Stage 5F;
- progression authority and replay were hardened by Stage 5D;
- no-stimulus session honesty and credit were hardened by Stages 5A/5B;
- broad semantic scenario tests were added by Stage 5H.

However, Stage 5 did not automatically prove the exercise content itself is beta-ready.

Likely remaining questions include:

- whether `floor_space` proves the user can safely get down to and up from the floor;
- whether step-up metadata adequately covers step height, stable surface, support, and space;
- whether single-leg/static balance progression needs a confidence or prerequisite gate;
- whether band anchoring, snap-back, and grip cues are sufficiently specific;
- whether user-selected external load has safe selection and stop rules;
- whether each exercise has adequate setup, breathing, stop, dizziness, and pain guidance;
- whether the current generic progression thresholds are suitable for every ladder;
- whether measured/valid-time signals are used appropriately for exercise-specific progression;
- whether optional levels are safely gated for beta;
- whether mobility collections are rotated coherently without being represented as progression;
- whether Explore/manual practice receives the same daily discomfort/readiness protections as main-plan sessions;
- whether Pearl’s “minimal equipment” promise is honest when upper-body pulling requires a band;
- whether the catalogue supports a useful controlled beta even if some advanced progression remains post-beta work.

Stage 4R must answer these questions using the current code, not prior assumptions.

## Primary objectives

1. Reconstruct the current post-Stage-5 exercise-content architecture.

2. Map every original Stage 4 finding to its current status.

3. Re-inventory every current exercise and ladder where the current registry differs from the original audit.

4. Verify Stage 4A and Stage 4B protections still hold after Stage 5.

5. Distinguish:
   - closed software defect;
   - closed by later Stage 5 work;
   - open software defect;
   - open safety/content gap;
   - cueing/copy gap;
   - product decision;
   - exercise-domain review;
   - physical-device validation dependency;
   - acceptable post-beta improvement.

6. Determine whether any current V1-core exercise is unsafe or unsuitable for controlled beta.

7. Determine whether any optional/advanced level must be hidden or gated before beta.

8. Determine whether exercise cueing and stop rules meet a minimum safe standard.

9. Determine whether progression ladders are coherent enough for controlled beta.

10. Determine whether manual practice and Explore obey current safety/readiness contracts.

11. Determine whether the minimal-equipment product promise is honest.

12. Produce the smallest dependency-ordered remediation plan for only the findings still open.

13. Decide whether the exercise catalogue is software/content-ready for a controlled beta.

## Output file

Create exactly one new report:

```text
docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_4_REMAINING.md
```

Do not edit prior reports.

Do not create any other repository file.

Temporary diagnostics may be created only outside the repository, such as under `/tmp`, and should be removed when no longer needed.

Do not stage, commit, create a branch, push, or open a PR.

## Non-negotiable rules

1. Do not modify production code.

2. Do not modify tests or fixtures.

3. Do not modify exercise definitions or ladder metadata.

4. Do not modify workout generation or progression.

5. Do not modify copy or UI.

6. Do not modify scoring, norms, Check-Up logic, pose logic, backend code, configuration, dependencies, or assets.

7. Do not install packages.

8. Do not use network access.

9. Do not claim clinical validation because an exercise is common or because tests pass.

10. Do not claim physical safety from static code alone.

11. Separate:
    - code correctness;
    - exercise-content suitability;
    - cueing quality;
    - progression quality;
    - user capability screening;
    - device/camera validation;
    - product-positioning honesty.

12. Passing Stage 5 tests proves the generator obeys the encoded catalogue; it does not prove every catalogue entry is well designed.

13. Product decisions must be surfaced, not silently chosen.

## Working-tree safety

Before analysis:

```bash
git status --short --untracked-files=all
git diff --name-only
git diff --stat
```

Record exact output in the report.

Rules:

- Treat all current modified/untracked files as user-owned.
- Inspect current diffs in every materially cited file.
- Do not revert, overwrite, format, move, or delete unrelated work.
- Run the same Git commands at the end.
- The only intended repository change is the new Stage 4R report.
- If unrelated files change during the audit, record them and do not overwrite them.

Important current-tree note from Stage 5H:

- `src/screens/AssessmentScreen.tsx` was deleted concurrently.
- `src/screens/CheckUpScreen.tsx`, `sessionPlanning.ts`, lifecycle tests, and `docs/decisions.md` had concurrent changes.
- Confirm current code paths rather than assuming those changes were intentional or irrelevant.

## Baseline validation

Run a targeted existing test slice covering at minimum:

- exercise catalogue integrity;
- set graders;
- valid-time exercise logic;
- autoregulation;
- workout generation;
- daily training context;
- equipment safety;
- session planning;
- Explore/manual practice;
- progression evidence;
- progression;
- session player;
- Stage 5H lifecycle integration.

Then run:

```bash
npm test -- --runInBand
npm run typecheck
npm --prefix website run typecheck
npx --no-install expo config --type public
git diff --check
```

Record:

- exact targeted command;
- targeted suite/test counts;
- full suite/test counts;
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

The Stage 5H full baseline was 95 suites / 764 tests. Verify the current baseline rather than assuming it.

## Step 1: Reconstruct the current exercise architecture

Inspect at minimum:

- src/exercises/index.ts
- src/exercises/registry.ts
- src/exercises/types.ts
- src/exercises/ladders.ts
- every registered exercise-definition module
- src/exercises/setGraders.ts
- src/exercises/validTime.ts
- src/training/equipmentSafety.ts
- src/training/dailyTrainingContext.ts
- src/training/workoutGeneration.ts
- src/training/validTimeProgression.ts
- src/training/progression.ts
- src/pearlFlow/progressionEvidence.ts
- src/pearlFlow/sessionPlanning.ts
- src/pearlFlow/exploreViewModel.ts
- src/profile/equipment.ts
- relevant preview/player/completion screens
- all relevant tests.

Document:

- current registry count;
- current ladder count;
- current ladder-level count;
- current release-status counts;
- current progression-model counts;
- current stimulus-kind counts;
- current measurement-tier counts;
- current equipment/capability vocabulary;
- current pain/readiness architecture;
- current progression architecture;
- current manual/Explore architecture;
- any dead, duplicate, undefined, or newly added exercise.

Produce a current architecture diagram from:

```text
catalogue
-> ladder semantics
-> equipment/discomfort/readiness eligibility
-> generated/manual/Explore selection
-> session execution
-> completion evidence
-> authoritative progression
```

## Step 2: Build the original-finding closure register

Read the full Stage 4 audit and extract every original finding, including:

- all 3 High safety findings;
- all 8 Medium safety findings;
- all 5 Low safety findings;
- every domain-mapping issue;
- every progression-ladder issue;
- every substitution issue;
- every cueing issue;
- every minimal-equipment issue;
- every Explore/manual-practice issue;
- every test gap;
- every recommended Stage 4A–4G batch item.

Create:

| Original finding | Original severity | Current status | Closed by | Current code evidence | Current test evidence | Residual gap | Action |

Allowed statuses:

- Closed by Stage 4A.
- Closed by Stage 4B.
- Closed by Stage 5.
- Closed by combined work.
- Partially closed.
- Still open.
- Superseded.
- Product decision required.
- Domain review required.
- Physical-device validation required.
- Acceptable post-beta improvement.

Do not mark a finding closed only because a test mentions it.

## Step 3: Re-inventory the full current catalogue

For every registered exercise, record:

| Exercise | Ladder | Domain | Release status | Progression model | Stimulus kind | Equipment | Environmental capability | Measurement tier | Current beta verdict |

Beta verdict:

- Keep in V1 core.
- Keep with cue remediation.
- Keep with capability/screening remediation.
- Keep but progression must be gated.
- Optional only.
- Hide before beta.
- Remove/dead.
- Physical-device validation required.

Include all current core and optional exercises.

Flag:

- any new exercise since Stage 4;
- any removed exercise;
- changed equipment;
- changed domain role;
- changed release status;
- changed progression semantics;
- changed safety/cueing.

## Step 4: Floor-space versus floor-capability audit

Do not treat `floor_space` as proof of floor-transfer capability.

Trace every floor exercise, including at minimum:

- glute-bridge-hold;
- glute-bridge-reps;
- push-up-standard;
- any floor mobility drill;
- any current optional floor work.

Determine:

- whether the user confirms physical comfort getting down/up;
- whether only physical room/floor space is confirmed;
- whether a chair/support is required for transfer;
- whether the plan explains getting down/up safely;
- whether dizziness/floor-transition stop rules exist;
- whether Explore/manual practice can expose floor work;
- whether readiness/discomfort filtering blocks unsuitable floor work.

Classify the original High floor finding as:

- fully closed;
- partially closed;
- still beta-blocking.

If a separate floor-capability confirmation is required, define the minimal future product rule without implementing it.

## Step 5: Step-up environment and capability audit

Re-verify:

- stairs/step required;
- nearby support required;
- stable surface;
- step height;
- clear floor space;
- footwear/obstacle assumptions;
- rail/counter/chair support;
- camera placement distraction;
- regression to sit-to-stand;
- knee/hip/back/ankle discomfort filtering;
- Explore/manual access;
- progression exposure.

Determine whether Stage 4A’s `stairs + support` gate fully closes the original High finding or whether step-height/stability/cueing remains beta-blocking.

Do not infer a safe step from a boolean `stairs`.

## Step 6: Balance safety and progression audit

Audit:

- feet-together hold;
- tandem hold;
- single-leg hold;
- supported side-step;
- march;
- lateral walk;
- any reaction/step-out drill;
- static vs dynamic/lateral ladder semantics.

Questions:

1. Is support required wherever appropriate?

2. Can single-leg work become reachable without a balance-confidence prerequisite?

3. Are hold targets/durations appropriate and finite?

4. Are there safe regressions for hesitant users?

5. Does Stage 5E ankle/foot discomfort remove all relevant work?

6. Does no-support equipment state fail honestly?

7. Is loaded-march naming still honest?

8. Is balance progression deep enough for a four-week beta?

9. Is it adequate for twelve weeks or merely beta-thin?

10. Are eyes-closed or unstable-surface variants absent, as expected for V1?

Classify each ladder:

- beta robust;
- beta acceptable but thin;
- needs gating;
- beta-blocked.

## Step 7: Band and upper-body safety audit

Audit:

- seated band row;
- standing anchored row;
- band pull-apart;
- overhead band press;
- any banded lateral work;
- any door-anchor use.

Verify:

- band required;
- door anchor independently required;
- anchor setup instructions;
- door orientation/closure assumptions;
- band inspection;
- snap-back safety;
- grip;
- face/eye clearance;
- range/tempo;
- shoulder discomfort filtering;
- no-band honesty;
- upper-pull omission effect on the product promise.

Classify:

- code-gating closed;
- cueing still open;
- product-promise decision required;
- beta blocker or post-beta improvement.

## Step 8: External-load safety audit

Audit:

- loaded sit-to-stand;
- loaded squat;
- any backpack/dumbbell/load exercise.

Verify:

- release status;
- how load is selected;
- load source;
- load securement;
- starting load guidance;
- stop rules;
- no max-load claims;
- camera/rep counting limitations;
- pain/readiness gating;
- optional-level gating;
- progression into load;
- top-of-ladder behavior.

Determine whether loaded levels should:

- remain V1 optional;
- require a confirmed load-capable profile;
- require copy remediation;
- be hidden during controlled beta.

## Step 9: Cueing and stop-rule standard

Define a minimum cue standard for every V1-core exercise.

Required categories where relevant:

- setup;
- environment/support;
- starting posture;
- movement execution;
- tempo/control;
- breathing;
- range limit;
- pain/discomfort stop;
- dizziness/unsteadiness stop;
- equipment-specific safety;
- floor transition;
- stair/step safety;
- band anchor;
- load selection;
- camera limitations;
- what counts as a rep/hold;
- what happens if tracking fails.

Create:

| Exercise | Missing cue categories | Current source | Severity | Beta action |

Do not require irrelevant boilerplate on every exercise.

Identify copy that is:

- generic but acceptable;
- too vague;
- contradictory;
- unsafe;
- overconfident;
- missing.

## Step 10: Progression-content audit after Stage 5D/E

Stage 5D solved authority/idempotency.

Stage 5E solved temporary daily regression and hold-only progression.

This does not automatically prove exercise-specific progression is correct.

For each linear ladder, record:

| Ladder | Level sequence | Difficulty jump | Entry requirement | Progress signal | Hold/regress signal | Optional gate | Top-level behavior | Verdict |

Audit:

- sit-to-stand;
- squat;
- step-up;
- heel/toe raise;
- push-up;
- upper-body pull;
- static balance;
- lateral/dynamic balance;
- any other linear ladder.

Questions:

1. Is each step genuinely harder?

2. Are jumps too large?

3. Does the app use relevant evidence?

4. Are valid-time signals meaningful for this movement?

5. Is rise velocity used appropriately or ignored?

6. Can generic easy-RPE logic progress an exercise that was poorly performed but not measured?

7. Are optional levels explicitly gated?

8. Can a capable user reach a useful endpoint?

9. Can a cautious user regress safely?

10. Does top-of-ladder behavior avoid endless false progression?

Classify:

- progression software contract closed;
- content progression adequate for beta;
- content progression needs remediation;
- physical-device evidence required;
- post-beta refinement.

## Step 11: Mobility collection audit

Verify the mobility collection is not treated as linear progression by any current consumer.

Audit:

- shoulder flexion/reach;
- thoracic rotation;
- hip flexor stretch;
- calf stretch;
- hamstring/hinge reach;
- neck rotation;
- overhead press cross-domain item.

Determine:

- how exercises are selected/rotated;
- whether any one mobility drill is falsely considered “higher level”;
- whether the user gets adequate shoulder, hip, ankle, and thoracic coverage;
- whether hinge remains supporting rather than headline;
- whether shoulder discomfort correctly filters relevant work;
- whether the collection needs a rotation policy before beta;
- whether current copy says “progression” when it is actually variety.

## Step 12: Minimal-equipment and product-promise audit

Evaluate current useful training under:

- explicit no equipment;
- chair only;
- chair + wall;
- floor space;
- band without anchor;
- band + anchor;
- stairs + support;
- full kit.

For each domain, record:

| Profile | Strength adequacy | Balance adequacy | Mobility adequacy | Missing stimulus | Honest current behavior | Product implication |

Questions:

- Is “minimal equipment” accurate?
- Is “no equipment” accurate only for starting?
- When is a resistance band functionally required?
- Should Pearl recommend the Movement Kit after onboarding or after a certain block?
- Can no-equipment users still receive useful beta sessions?
- Are partial/non-credit sessions acceptable too often?

Produce a product recommendation, not code.

## Step 13: Pain/readiness coverage outside main-plan sessions

Stage 5E hardened current generated main-plan sessions.

Verify actual behavior for:

- Explore preset sessions;
- manual ladder practice;
- optional practice;
- extra sessions;
- restart sessions;
- short sessions.

Questions:

- Do they consume the current daily discomfort/readiness context?
- Do they apply the centralized movement-pattern policy?
- Can a user bypass pain constraints through Explore/manual practice?
- Are equipment gates applied?
- Are non-main sessions clearly non-credit?
- Are there separate stop rules?

Classify any bypass as a software defect or product decision.

## Step 14: Session structure, warm-up, rest, and duration

For representative A/B/C sessions in each focus domain, inspect:

- preparation/warm-up;
- exercise ordering;
- alternating stress;
- rest;
- duration;
- transition time;
- voice-cue pacing;
- short-session compaction;
- cooldown/mobility;
- repeated movement patterns;
- fatigue before balance work.

Use current production generator and metadata.

Do not repeat Stage 5 credit/schedule verification.

Focus on content quality.

Determine:

- whether 20-minute claim is realistic;
- whether the first exercise starts too abruptly;
- whether balance is placed safely relative to fatigue;
- whether sessions remain useful under readiness scaling;
- whether warm-up is explicit or only implied.

## Step 15: Measurement-to-training alignment

Re-evaluate:

| Measured area | Headline metric | Training content | Direct transfer | Supporting transfer | Gap |

At minimum:

- chair-stand strength;
- one-leg balance;
- shoulder mobility;
- hinge reach supporting metric.

Verify:

- training addresses the measured domain;
- the app does not promise direct improvement from unrelated work;
- mobility content is not shoulder-only;
- balance content is broader than a static hold while still targeting the measured skill;
- lower-body strength receives progressive overload options;
- upper-body work is framed as broader capability, not directly inferred from the Check-Up.

## Step 16: Explore/manual-practice audit

Verify:

- all production-reachable exercises;
- equipment gating;
- discomfort/readiness gating;
- optional-level exposure;
- release-status filtering;
- current-level suggestion;
- no overtraining warning/guard;
- no main-plan credit;
- no official progression unless current policy explicitly permits it;
- no unsafe advanced level selection;
- no stale plan/equipment use.

Identify whether Explore/manual practice needs a dedicated Stage 4 remediation batch before beta.

## Step 17: Current test-quality and false-confidence audit

Review tests for:

- catalogue integrity;
- equipment safety;
- discomfort policy;
- daily readiness;
- exercise-level progression;
- cue completeness;
- optional-level gating;
- floor capability;
- step safety;
- band safety;
- load safety;
- Explore/manual bypass;
- session ordering/duration;
- Stage 5H scenarios.

Identify tests that can remain green while:

- floor-space is mistaken for floor capability;
- step height is unsafe;
- cueing is missing;
- loaded levels have no load-selection rule;
- single-leg progression is too aggressive;
- optional levels are exposed too early;
- manual practice bypasses daily discomfort;
- mobility collection is semantically correct but poorly varied.

Do not add tests in this task.

## Step 18: Physical-device and domain-review dependency map

For every remaining issue, distinguish:

### Static software review can close

Examples:

- missing metadata;
- missing cue;
- inconsistent release status;
- missing screening flag;
- bypass path.

### Physical-device/user-test evidence required

Examples:

- chair rep/velocity repeatability;
- balance tracking;
- floor-camera setup;
- step-up camera placement;
- session pacing;
- voice timing;
- cue comprehension;
- realistic completion time.

### Exercise-domain review required

Examples:

- progression jumps;
- safe entry/load guidance;
- optional advanced level suitability;
- balance-confidence gate;
- external-load recommendations.

Create:

| Issue | Static fix? | Device validation? | Domain review? | Beta blocker? | Minimum evidence |

## Step 19: Current safety-finding register

Create a new finding register.

For every open finding include:

1. Finding id:
   - `F4R-001`, `F4R-002`, etc.
2. Priority:
   - P0;
   - P1;
   - P2;
   - P3.
3. Confidence.
4. Exact trigger.
5. Runtime/reachability.
6. Current behavior.
7. Expected beta behavior.
8. User/trust impact.
9. Existing tests.
10. Recommended remediation.
11. Product decision required.
12. Device/domain dependency.
13. Beta-blocker status.

Separate:

- confirmed software defects;
- content/cueing gaps;
- product decisions;
- exercise-domain review;
- device validation.

Do not inflate missing polish into P0/P1 without a concrete user-trust or safety consequence.

## Step 20: Reconcile the original Stage 4 remediation batches

For each original batch, decide:

### Stage 4A — catalogue integrity and safety gating

- complete;
- partially complete;
- reopened by current code;
- no further work.

### Stage 4B — domain/stimulus/progression semantics

- complete;
- partially complete;
- no further work.

### Stage 4C — safety regressions and pain/readiness substitutions

- closed by Stage 5E;
- partially open for Explore/manual practice;
- further work required.

### Stage 4D — minimal-equipment stimulus upgrades

- closed;
- product-positioning decision;
- further content required.

### Stage 4E — cueing and instruction safety copy

- open/closed/partial.

### Stage 4F — session-template coverage and duration realism

- open/closed/partial.

### Stage 4G — semantic/property test expansion

- closed by Stage 5H;
- remaining content-specific test gaps.

Create:

| Batch | Current status | Evidence | Remaining work | Beta blocker? |

## Step 21: Product-decision packet

For each decision provide:

- current behavior;
- options;
- recommendation;
- reason;
- implementation impact;
- beta-blocker status.

At minimum:

### Decision A: Floor capability

Is floor space enough, or must the user confirm comfortable floor transfer?

### Decision B: Step-up requirement

Are stairs + support sufficient, or is a defined stable low step/height confirmation required?

### Decision C: Band requirement

Should Pearl position a long band as recommended/required for full upper-body training?

### Decision D: External load

Should loaded squat/sit-to-stand remain optional beta, hidden beta, or enabled with load guidance?

### Decision E: Single-leg balance

Does it require a confidence/prerequisite gate beyond ladder progression?

### Decision F: Optional levels

Which optional levels are enabled in controlled beta?

### Decision G: Manual/Explore safety context

Must daily discomfort/readiness apply to these paths?

### Decision H: Progression specificity

Is generic Stage 5D progression adequate for controlled beta, or must selected ladders gain exercise-specific rules first?

### Decision I: Cueing minimum standard

What cue categories are mandatory before beta?

### Decision J: Minimal-equipment promise

Use “minimal equipment,” “start without equipment,” or require/recommend the Pearl Movement Kit?

## Step 22: Remediation plan for only open findings

Do not implement.

Propose the smallest dependency-ordered batches.

Possible naming:

- Stage 4C-R: floor/step/balance capability screening.
- Stage 4D-R: equipment promise and optional-load policy.
- Stage 4E-R: exercise-specific cue and stop-rule hardening.
- Stage 4F-R: progression/content quality and optional-level gating.
- Stage 4G-R: Explore/manual-practice safety parity and focused tests.

Do not create a batch if current evidence shows it is no longer needed.

For each:

| Batch | Findings | Files likely involved | Tests | Product decision | Device/domain dependency | Beta blocker |

## Step 23: Controlled-beta readiness decision

Evaluate two separate questions.

### Exercise catalogue software/content readiness

State one:

- `EXERCISE CATALOGUE SOFTWARE/CONTENT-READY FOR CONTROLLED BETA`
- `EXERCISE CATALOGUE SOFTWARE/CONTENT-BLOCKED`

Use ready only if:

- no current V1-core exercise has an unresolved P0/P1 software/content safety defect;
- high-risk capability/screening gaps are closed or explicitly gated;
- cueing is adequate for unsupervised home use;
- optional unsafe/uncertain levels are hidden or gated;
- Explore/manual paths cannot bypass critical safety rules;
- progression is conservative enough for controlled beta.

### Overall beta release

Regardless of the Stage 4R result, state:

- `OVERALL BETA RELEASE STILL BLOCKED`
- `STAGE 3D-B REQUIRED`
- `BETA DEVICE VALIDATION REQUIRED`

Do not declare Pearl generally beta-ready.

## Required report structure

Write:

```text
docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_4_REMAINING.md
```

with these sections:

1. Executive verdict.
2. Scope.
3. Initial Git status.
4. Baseline validation.
5. Current training-content architecture.
6. Current catalogue inventory.
7. Original Stage 4 finding closure register.
8. Floor-space versus floor-capability audit.
9. Step-up environment/capability audit.
10. Balance safety/progression audit.
11. Band/upper-body safety audit.
12. External-load safety audit.
13. Cueing and stop-rule audit.
14. Progression-content audit.
15. Mobility collection audit.
16. Minimal-equipment/product-promise audit.
17. Pain/readiness parity outside main plan.
18. Session structure/duration audit.
19. Measurement-to-training alignment.
20. Explore/manual-practice audit.
21. Test-quality/false-confidence audit.
22. Physical-device/domain-review dependency map.
23. Current finding register.
24. Stage 4A–4G reconciliation.
25. Product-decision packet.
26. Recommended remaining remediation batches.
27. Controlled-beta catalogue readiness.
28. Remaining non-Stage-4 beta blockers.
29. Final stage decisions.
30. Final Git status.

## Acceptance criteria

Do not mark Stage 4R complete unless:

1. Every original Stage 4 finding is mapped to a current status.

2. All original High/Medium/Low safety findings are explicitly accounted for.

3. Every current registered exercise has a beta verdict.

4. Every current ladder has a content/progression verdict.

5. Floor capability is distinguished from floor space.

6. Step-up environment/capability is explicitly assessed.

7. Balance confidence/progression is assessed.

8. Band and external-load safety are assessed.

9. Cueing and stop rules are audited exercise-by-exercise.

10. Progression authority is distinguished from progression content quality.

11. Mobility collection semantics are re-verified.

12. Minimal-equipment product positioning is assessed.

13. Explore/manual readiness/discomfort parity is assessed.

14. Session duration/ordering/warm-up is assessed.

15. Remaining findings are correctly classified by software/content/product/device/domain category.

16. Only genuinely open remediation batches are proposed.

17. Targeted tests pass.

18. Full Jest passes.

19. App typecheck passes.

20. Website typecheck passes.

21. Expo config passes.

22. `git diff --check` passes.

23. No production code/tests/config/dependencies are changed.

24. No unrelated user work is reverted or overwritten.

25. No package install, lockfile change, commit, staging, branch, or push occurs.

## Stage decisions

At the end of the report, state exactly one:

- `STAGE 4R VERIFICATION COMPLETE`
- `STAGE 4R VERIFICATION BLOCKED`

Also state exactly one:

- `STAGE 4 REMEDIATION COMPLETE`
- `STAGE 4 REMEDIATION STILL REQUIRED`

Also state exactly one:

- `EXERCISE CATALOGUE SOFTWARE/CONTENT-READY FOR CONTROLLED BETA`
- `EXERCISE CATALOGUE SOFTWARE/CONTENT-BLOCKED`

Regardless of those decisions, also state:

- `STAGE 5 REMEDIATION COMPLETE`
- `DYNAMIC WORKOUT GENERATION SOFTWARE-READY FOR CONTROLLED BETA`
- `OVERALL BETA RELEASE STILL BLOCKED`
- `STAGE 3D-B REQUIRED`
- `BETA DEVICE VALIDATION REQUIRED`

## Final Codex response

Return a concise summary containing:

- Report path.
- Validation results.
- Current exercise count.
- Current ladder count.
- Original findings closed/partial/open counts.
- Current P0/P1/P2/P3 finding counts.
- Floor-capability verdict.
- Step-up verdict.
- Balance verdict.
- Band/upper-pull verdict.
- External-load verdict.
- Cueing verdict.
- Progression-content verdict.
- Mobility-collection verdict.
- Minimal-equipment product recommendation.
- Explore/manual safety-parity verdict.
- Top remaining beta risks.
- Product decisions requiring approval.
- Recommended remaining remediation batches.
- `STAGE 4R VERIFICATION COMPLETE` or blocked.
- `STAGE 4 REMEDIATION COMPLETE` or still required.
- `EXERCISE CATALOGUE SOFTWARE/CONTENT-READY FOR CONTROLLED BETA` or blocked.
- `STAGE 5 REMEDIATION COMPLETE`.
- `DYNAMIC WORKOUT GENERATION SOFTWARE-READY FOR CONTROLLED BETA`.
- `OVERALL BETA RELEASE STILL BLOCKED`.
- `STAGE 3D-B REQUIRED`.
- `BETA DEVICE VALIDATION REQUIRED`.
- Initial and final Git status.
- Confirmation that no production code, tests, exercise definitions, config, dependencies, package install, lockfile change, commit, staging, branch, or push occurred.
