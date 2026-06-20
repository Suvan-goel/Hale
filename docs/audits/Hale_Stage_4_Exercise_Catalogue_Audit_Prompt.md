You are carrying out Stage 4 of Hale’s production-readiness work:

EXERCISE CATALOGUE, PROGRESSION LADDERS, SAFETY REGRESSIONS, DOMAIN MAPPING, AND TRAINING-CONTENT AUDIT

This is a read-only audit and product-decision report.

Do not implement remediation in this task unless explicitly asked in a later prompt.

Do not begin Stage 5 dynamic workout-generation audit yet.

Do not modify production code, tests, exercises, scoring, norms, copy, backend, configuration, dependencies, or assets in this task.

## Required prior reading

Read these documents in full before beginning:

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

Treat the current working tree as the source of truth. Re-verify relevant call paths before making audit conclusions because report line numbers may no longer be exact.

## Current stage status

Completed:

- Stage 1A: invalid/no-domain baseline cannot create a block.
- Stage 2A/2A.1: camera readiness and ROM valid-capture gates hardened.
- Stage 3A: malformed scoring inputs fail closed.
- Stage 3B: official Check-Ups require all three headline domains; manual/quick isolated.
- Stage 3C/3C.1: versioned score snapshots, source-identity checks, no silent historical rescoring.
- Stage 3D-A: movement-age display and copy softened.
- Stage 3D-C: exact tie policy implemented.
- Stage 3D-D: interim near-tie policy and meaningful-change neutralization implemented.

Current stage decisions from Stage 3D-D:

- STAGE 3D-D COMPLETE.
- STAGE 3D-B REQUIRED.
- STAGE 4 UNBLOCKED.
- STAGE 5 INPUTS READY.

Stage 3D-B norm provenance remains required before public beta, but Stage 4 can proceed because focus-selection semantics are now stable enough to audit training content.

## Primary objective

Audit whether Hale’s current exercise catalogue and progression ladders are safe, coherent, sufficiently challenging, and correctly mapped to the app’s strength/power, balance, and mobility training domains for adults roughly aged 45–65.

This audit must answer:

1. Does every exercise in the catalogue have a clear purpose, domain mapping, and appropriate difficulty?

2. Are progressions/regressions safe and sensible for Hale’s target users?

3. Does the catalogue support meaningful 4-week blocks and plausible 12-week continuation?

4. Does the current “minimal equipment” approach provide enough training stimulus, especially for lower-body strength and upper-body pulling?

5. Are there enough regressions for pain, low readiness, low balance confidence, limited equipment, and first-time users?

6. Are there unsafe or unsuitable exercises for the target demographic?

7. Are balance and mobility progressions meaningful, not just filler?

8. Are the cueing, timing, rep/hold targets, rest, and setup assumptions realistic?

9. Does every training focus domain have enough exercise variety to support Stage 5 dynamic workout generation?

10. What remediation batches are needed before Stage 5 generation can be trusted?

## Output file

Create exactly one new audit report:

docs/audits/HALE_LOGIC_AUDIT_STAGE_4.md

Do not edit previous reports.

Do not create any other repository files unless absolutely necessary for temporary diagnostics outside the repository, such as under `/tmp`.

Do not stage, commit, create a branch, push, or open a PR.

## Non-negotiable rules

1. Do not modify production code.

2. Do not modify tests.

3. Do not modify exercise definitions.

4. Do not modify workout generation.

5. Do not modify progression logic.

6. Do not modify scoring, snapshots, norms, Check-Up measurement, camera readiness, backend sync, copy, or UI.

7. Do not install packages.

8. Do not use network access unless explicitly available and separately approved. This audit should be primarily repository-based.

9. Do not claim an exercise is clinically validated unless the repository contains evidence.

10. Do not assume an exercise is safe merely because it is common.

11. Separate:
    - software/data-structure correctness,
    - exercise science quality,
    - safety suitability,
    - product fit,
    - progression adequacy,
    - equipment realism,
    - camera/measurement feasibility,
    - Stage 5 generation readiness.

12. Be explicit when evidence is missing.

13. Product decisions should be recommended, not silently implemented.

## Working-tree safety

Before analysis:

1. Run:

   git status --short --untracked-files=all

   git diff --name-only

   git diff --stat

2. Record exact outputs in the report.

3. Treat all existing modifications and untracked files as user-owned.

4. Inspect current diffs for every file this task cites heavily.

5. Do not revert, overwrite, reformat, move, or delete unrelated work.

6. Run the same Git status commands at the end.

7. The only intended repository change is:

   docs/audits/HALE_LOGIC_AUDIT_STAGE_4.md

8. If unrelated files change during the audit, record them and do not overwrite them.

## Baseline validation

Run installed validation only.

Run targeted non-mutating tests first if available for:

- exercise catalogue;
- workout generation;
- session planning;
- progression ladders;
- adherence/block service;
- training session definitions;
- equipment gating;
- pain/readiness substitutions.

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
- snapshot count;
- skipped tests;
- typecheck exit code;
- Expo config exit code;
- diff-check exit code;
- warnings;
- whether any validation command changed files.

The prior Stage 3D-D full baseline was 84 suites and 595 tests. Verify the current baseline rather than assuming it is unchanged.

## Step 1: Reconstruct the training-content architecture

Before auditing exercise quality, inspect all relevant training files.

At minimum inspect:

- src/training/exerciseCatalog.ts
- src/training/exerciseCatalogue.ts, if present
- src/training/exercises.ts
- src/training/workoutGeneration.ts
- src/training/progression.ts
- src/training/validTimeProgression.ts
- src/training/sessionPlanning.ts, if present
- src/haleFlow/sessionPlanning.ts
- src/haleFlow/planViewModel.ts
- src/adherence/types.ts
- src/adherence/blockService.ts
- src/screens/TrainingSessionScreen.tsx
- src/screens/SessionPreviewScreen.tsx
- src/screens/PlanScreen.tsx
- any movement/exercise definition files under src/movements
- any tests under src/training, src/haleFlow, src/adherence, src/screens related to training, sessions, exercise catalogue, equipment, pain, readiness, progression, or blocks.

If file names differ, search for:

- exerciseId
- ExerciseDefinition
- exercise catalog
- ladder
- progression
- regression
- equipment
- pain
- readiness
- valid time
- rep
- hold
- session template
- A/B/C
- block focus
- strength_power
- balance
- mobility
- guided session
- micro-check
- short session.

Create a call graph from:

MovementAssessment focus -> MovementBlock -> session plan -> workout generation -> exercise selection -> exercise definitions -> TrainingSessionScreen execution -> completion/progression update.

Document:

- where exercises are defined;
- where domains are assigned;
- where difficulty/progression is encoded;
- where equipment requirements are encoded;
- where pain/readiness substitutions are encoded;
- where durations/reps/holds/rests are encoded;
- where session templates are encoded;
- where valid-time progression is encoded;
- where completion updates progression;
- which pieces are static vs dynamic.

## Step 2: Build the full exercise inventory

Create a complete table for every exercise currently reachable or defined.

For each exercise, record:

| Exercise ID | Display name | Domain(s) | Movement pattern | Level | Equipment | Rep/hold/time target | Sets | Rest | Progression parent/child | Regression | Pain exclusions | Camera-measured? | Voice/cue assumptions | V1 verdict |

Include all exercises, including:

- production V1 exercises;
- beta-hidden exercises;
- explore/practice exercises;
- micro-check exercises;
- supporting movement tests that appear in training;
- any unused/dead exercises.

Classify each exercise as:

- V1 keep;
- V1 keep with copy/cue caveat;
- V1 keep but needs regression;
- V1 keep but needs progression;
- V1 move to later;
- V1 remove/hide;
- unclear/dead code.

Do not change the catalogue.

## Step 3: Domain mapping audit

For each exercise, assess whether its domain assignment is appropriate.

### Strength/power domain

Check whether strength/power exercises actually train:

- lower-body strength;
- chair-rise capacity;
- squat/hinge/step-up patterns;
- lower-body power where claimed;
- upper-body pushing/pulling if included;
- progressive overload.

Flag exercises that are mobility/balance drills incorrectly labelled strength.

### Balance domain

Check whether balance exercises actually train:

- static balance;
- dynamic balance;
- weight shifts;
- stepping reactions;
- tandem/single-leg control;
- sensory challenge;
- safe progression.

Flag exercises that are too easy, too risky, or insufficiently progressive.

### Mobility domain

Check whether mobility exercises actually train:

- shoulder flexion/reach;
- thoracic/hip/ankle mobility;
- hinge/reach capacity;
- floor/standing transitions if present;
- controlled range of motion.

Flag cases where mobility is too shoulder-only or where hinge/forward reach role is unclear.

### Cross-domain exercises

Identify exercises that should be multi-domain or supporting rather than primary.

Output:

| Exercise | Current domain | Better domain? | Reason | Severity |

## Step 4: Progression ladder audit

Audit every progression ladder.

For each ladder:

| Ladder | Domain | Steps | Entry criteria | Progression criteria | Regression criteria | Equipment path | Safety concerns | 4-week adequacy | 12-week adequacy | Verdict |

Questions:

1. Is each progression step meaningfully harder than the previous one?

2. Are jumps too large for adults 45–65?

3. Are there enough easy entry points?

4. Are there enough harder endpoints for capable users?

5. Are there regressions after pain, low readiness, or failed valid-time?

6. Are there equipment alternatives?

7. Does the ladder avoid progressing merely because a user completed an easy session once?

8. Does it use perceived effort, smoothness, valid reps/time, pain, and range where available?

9. Does it avoid progressing after shaky/unsafe reps?

10. Does it support at least 4 weeks of training?

11. Could it support 12 weeks without becoming stale?

12. Does progression align with Hale’s measurement domains?

Flag ladders as:

- robust;
- acceptable for beta;
- thin but usable;
- needs remediation before Stage 5;
- unsafe/unsuitable.

## Step 5: Regression and substitution audit

Audit how the app responds to:

- low readiness;
- pain area selected;
- knee discomfort;
- hip/back discomfort;
- shoulder discomfort;
- ankle/foot discomfort;
- low balance confidence;
- no equipment;
- limited space;
- no chair;
- no wall/support;
- high fatigue;
- failed tracking/valid-time;
- skipped set;
- shortened session.

For each case, answer:

- What exercise is substituted?
- Is substitution in same domain?
- Is substitution safer?
- Is substitution still useful?
- Could substitution create a no-stimulus session?
- Is pain copy safe?
- Is there a no-go/escalation path?
- Are users ever pushed into a painful or risky movement?

Output a table:

| Trigger | Current behavior | Risk | Recommended remediation |

Do not implement.

## Step 6: Safety suitability audit for adults 45–65

Evaluate the catalogue for the target user:

- generally healthy;
- not regular gym-goers;
- may be stiff, deconditioned, or cautious;
- wants to stay strong, steady, mobile, and independent;
- uses a phone at home;
- minimal equipment;
- no trainer physically present.

For each exercise, classify safety risk:

- low;
- medium;
- high;
- unsuitable for V1 without screening.

Consider:

- fall risk while balancing;
- twisting/fast stepping;
- single-leg loading;
- unsupported movements;
- floor transitions;
- shoulder overhead work;
- spinal flexion/hinge;
- knee stress;
- explosive movements;
- fatigue;
- home-space hazards;
- camera setup distraction;
- lack of warm-up.

Flag anything that should require:

- support/wall/chair;
- slower tempo;
- reduced range;
- extra setup cue;
- contraindication screen;
- pain stop rule;
- later-stage gating;
- removal from V1.

## Step 7: Minimal equipment and training stimulus audit

Audit whether the catalogue can create meaningful adaptation with:

- no equipment;
- chair only;
- wall/support;
- optional bands;
- step/stairs;
- phone stand;
- future Hale Movement Kit.

For each domain, answer:

### Strength/power

- Can lower-body strength progress enough without external load?
- When do chair stands/squats become insufficient?
- Is there enough unilateral/tempo/step-up progression?
- Is upper-body pulling absent or underloaded?
- Are bands required earlier than the app suggests?

### Balance

- Can balance progress with no equipment?
- Are support progressions safe?
- Is there dynamic balance progression beyond holds?

### Mobility

- Can mobility progress with no equipment?
- Are there enough joints/planes?
- Are shoulder and hinge overrepresented or underrepresented?

Output:

| Domain | No-equipment adequacy | Minimal-kit adequacy | Major gap | Recommendation |

## Step 8: Cueing and execution audit

For each exercise type, audit:

- setup instructions;
- safety cues;
- rep/hold definitions;
- valid-time expectations;
- form/camera limitations;
- voice guidance assumptions;
- rest instructions;
- stop rules;
- pain rules;
- progression cues;
- support cues;
- whether the user knows what “good” feels like.

Flag missing cue types:

- chair height;
- wall/support use;
- slow control;
- breathing;
- pain stop;
- dizziness stop;
- knee tracking;
- hip hinge;
- foot placement;
- shoulder compensation;
- safe step height;
- space clearing.

Output a ranked list of cue/copy fixes for later remediation.

## Step 9: Session-template readiness audit

Audit A/B/C sessions and any session templates.

For each focus domain:

| Focus | Session A | Session B | Session C | Domain coverage | Progression logic | Safety balance | Time realism | Verdict |

Questions:

1. Does each session have warm-up/prep, main work, and cooldown/mobility where appropriate?

2. Does the session overemphasize one movement pattern?

3. Does a strength-focused block still include balance/mobility maintenance?

4. Does a balance-focused block still include enough strength?

5. Does a mobility-focused block include enough strength/balance to be useful?

6. Are sessions realistically 20 minutes?

7. Are sessions too short/too easy after readiness scaling?

8. Are short sessions still useful?

9. Are weekly micro-checks integrated appropriately?

10. Does A/B/C variety prevent boredom?

Do not audit dynamic generation deeply yet. Stage 5 will handle that. For Stage 4, audit whether the building-block templates/content are inherently usable.

## Step 10: Measurement/training alignment audit

Check whether training exercises align with the measurements:

| Measured domain | Measured movement | Training exercises | Direct transfer? | Gap |

Examples:

- Chair stand score should map to sit-to-stand/squat/step-up/hinge/calf work.
- Balance hold should map to single-leg/tandem/weight shift/step-out drills.
- Shoulder flexion should map to shoulder/thoracic mobility.
- Hinge reach should be supporting, not headline, unless training supports it.

Flag:

- training that does not address the measured weakness;
- tests that have no training counterpart;
- exercises that train things not measured but claim to improve measured domain;
- supporting metrics that have no training path.

## Step 11: Explore/practice content audit

Audit any Explore, practice, ladder, Learn, or optional session content.

Questions:

- Is optional practice safe?
- Can users accidentally overtrain?
- Does Explore bypass readiness/pain/equipment gates?
- Are practice ladders coherent?
- Are Learn articles consistent with Stage 3D-A softened claims?
- Does optional content create unsupported claims?
- Are beta-hidden exercises reachable?

Output verdicts.

## Step 12: Dead code, unreachable code, and duplicate exercise audit

Identify:

- defined but unreachable exercises;
- referenced but undefined exercise IDs;
- duplicate exercises with different IDs;
- stale exercises from Forma/Hale legacy;
- beta-hidden exercises reachable in production;
- exercises included in tests but not product;
- missing tests for production exercises.

Create a table:

| Issue | File/path | Risk | Remediation |

## Step 13: Test coverage audit

Inspect existing tests for:

- exercise catalogue integrity;
- every production exercise reachable;
- no undefined exercise ID;
- domain mapping;
- equipment gating;
- pain substitutions;
- readiness scaling;
- progression;
- valid-time progression;
- session duration;
- short-session behavior;
- V1 hidden/beta filters;
- no unsafe exercise after pain trigger;
- no no-stimulus session after substitutions;
- A/B/C coverage.

Determine:

- what is well tested;
- what gives false confidence;
- what needs tests before Stage 5;
- what can wait.

Output a test-gap table.

## Step 14: Stage 5 input readiness

Based on the audit, decide whether Stage 5 can proceed.

Stage 5 needs stable, trustworthy building blocks. It does not require perfect exercise science, but it does require:

- no unsafe V1 exercises;
- no undefined/reachable broken exercise IDs;
- enough exercises per domain;
- sensible progressions/regressions;
- equipment/pain/readiness gates not obviously broken;
- session templates not obviously low-stimulus or unsafe;
- clear domain mappings.

State one:

- STAGE 5 CATALOGUE INPUTS READY
- STAGE 5 CATALOGUE INPUTS BLOCKED

This is separate from Stage 3D’s focus-input readiness, which is already ready after 3D-D.

## Recommended remediation batches

Do not implement.

Propose small future batches such as:

- Stage 4A: exercise inventory integrity and V1 reachability hardening.
- Stage 4B: domain mapping and progression ladder cleanup.
- Stage 4C: safety regressions and pain/readiness substitution hardening.
- Stage 4D: minimal-equipment stimulus upgrades.
- Stage 4E: cueing and instruction safety copy.
- Stage 4F: session-template coverage and duration realism.
- Stage 4G: test coverage expansion.

For each batch include:

| Batch | Findings addressed | Files likely involved | Tests required | Product decision required | Blocks Stage 5? |

## Required report structure

Write:

docs/audits/HALE_LOGIC_AUDIT_STAGE_4.md

with sections:

1. Executive verdict.
2. Baseline validation and repository status.
3. Training-content architecture.
4. Full exercise inventory.
5. Domain mapping audit.
6. Progression ladder audit.
7. Regression and substitution audit.
8. Safety suitability audit.
9. Minimal equipment and stimulus audit.
10. Cueing and execution audit.
11. Session-template readiness audit.
12. Measurement/training alignment audit.
13. Explore/practice content audit.
14. Dead/reachable/duplicate exercise audit.
15. Test coverage audit.
16. Stage 5 catalogue input readiness.
17. Recommended Stage 4 remediation batches.
18. Final stage decisions.
19. Final Git status.

## Acceptance criteria

Do not mark Stage 4 audit complete unless all are true:

1. Every reachable production exercise is inventoried.
2. Every defined exercise is accounted for, even if unused/dead/beta-hidden.
3. Domain mapping is assessed for every exercise.
4. Every progression ladder is audited.
5. Regression/substitution behavior is audited.
6. Safety suitability is assessed for the target demographic.
7. Minimal-equipment adequacy is assessed by domain.
8. Cueing/instruction gaps are identified.
9. Session-template readiness is assessed.
10. Measurement/training alignment is assessed.
11. Explore/practice content is assessed.
12. Dead/unreachable/duplicate exercise issues are identified.
13. Test coverage gaps are identified.
14. Stage 5 catalogue input readiness is explicit.
15. Remediation batches are proposed.
16. No production code/tests/exercises/config/dependencies are changed.
17. Validation results are recorded.
18. Final Git status is recorded.

## Stage decisions

At the end of the report, state exactly one:

- STAGE 4 AUDIT COMPLETE
- STAGE 4 AUDIT BLOCKED

Also state exactly one:

- STAGE 4 REMEDIATION REQUIRED
- NO STAGE 4 REMEDIATION REQUIRED

Also state exactly one:

- STAGE 5 CATALOGUE INPUTS READY
- STAGE 5 CATALOGUE INPUTS BLOCKED

Also state:

- STAGE 3D-B REQUIRED

Stage 3D-B remains required for norm provenance before public beta, regardless of whether Stage 5 catalogue inputs are ready.

## Final Codex response

Return a concise summary containing:

- Report path.
- Validation results.
- Number of exercises inventoried.
- Number of progression ladders audited.
- Number of safety issues by severity.
- Domain-mapping verdict by domain.
- Minimal-equipment adequacy by domain.
- Top 10 catalogue/progression risks.
- Recommended remediation batches.
- STAGE 4 AUDIT COMPLETE or STAGE 4 AUDIT BLOCKED.
- STAGE 4 REMEDIATION REQUIRED or NO STAGE 4 REMEDIATION REQUIRED.
- STAGE 5 CATALOGUE INPUTS READY or STAGE 5 CATALOGUE INPUTS BLOCKED.
- STAGE 3D-B REQUIRED.
- Initial and final Git status.
- Confirmation that no production code, tests, exercises, config, dependencies, commit, staging, branch, or push occurred.
