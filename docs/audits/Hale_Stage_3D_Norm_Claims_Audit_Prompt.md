You are carrying out Stage 3D of Hale’s production-readiness work:

NORM PROVENANCE, MOVEMENT-AGE CLAIMS, USER-FACING INTERPRETATION, TIE SEMANTICS, AND MEANINGFUL-CHANGE POLICY AUDIT

This is primarily a read-only evidence and product-decision audit.

Do not begin Stage 4, Stage 5, workout-generation remediation, exercise-catalogue remediation, or beta-device validation in this task.

Do not implement Stage 3D remediation unless explicitly asked in a later prompt.

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

The current working tree is the source of truth. Re-verify every relevant path because report line numbers may no longer be exact.

## Stage 3 status entering this task

Completed and verified:

- Stage 3A: scoring-input malformed-data hardening.
- Stage 3B: all-three-headline-domain officialness, partial-result recovery, manual/quick isolation, exact Check-Up type preservation.
- Stage 3C + 3C.1: score/norm versioning, frozen historical snapshots, no silent historical rescoring, source-identity hardening, and cross-version comparison safety.

Remaining Stage 3 blockers include:

- F3-005: norm provenance and movement-age claims need product/science sign-off before beta.
- F3-006 or related claims risks: user-facing copy may overstate what the current evidence supports.
- F3-007: exact weakest-domain ties and near ties currently need an explicit product policy.
- F3-008: meaningful-change and improvement/decline thresholds are not validated.
- Any remaining Stage 3 issues discovered during this audit.

Stage 4 and Stage 5 remain blocked until Stage 3D determines whether Hale’s score interpretations and claims are trustworthy enough to feed exercise-catalogue and workout-generation audits.

## Primary objective

Produce an evidence-based report answering:

1. Are the current norm tables sufficiently sourced and appropriate for Hale’s target users aged roughly 45–65?

2. Are the current “movement age,” “strength age,” “balance age,” and “mobility age” outputs scientifically and product-wise defensible for beta?

3. Does each headline domain label accurately reflect the metric actually driving it?

4. Do the app’s result screens, Progress, reports, Today/Plan summaries, and onboarding copy make claims that exceed the evidence?

5. What exact product rules should govern:
   - exact weakest-domain ties,
   - near ties,
   - measurement-noise margins,
   - meaningful improvement,
   - meaningful decline,
   - “held steady,”
   - incomplete or comparison-unavailable results?

6. What changes are needed before Hale can safely use its current scoring outputs to drive official Progress, block reports, and personalised training blocks?

7. Which decisions must the product owner approve before any Stage 3D remediation?

This task should culminate in a product-decision packet, not code changes.

## Output file

Create exactly one new report:

docs/audits/HALE_LOGIC_AUDIT_STAGE_3D.md

Do not edit previous audit or remediation reports.

Do not create any other repository files unless absolutely necessary for a temporary diagnostic, and temporary diagnostics must be outside the repository, such as under `/tmp`.

Do not stage, commit, create a branch, push, or open a PR.

## Non-negotiable rules

1. Do not modify production code.

2. Do not modify tests.

3. Do not modify norm tables.

4. Do not modify user-facing copy.

5. Do not modify scoring formulas.

6. Do not modify snapshot/versioning logic.

7. Do not modify officialness, manual/quick isolation, or Stage 3B semantics.

8. Do not modify workout generation or exercise progression.

9. Do not install packages.

10. Do not access the network unless the local Codex environment explicitly supports web access and the user has separately approved it. If there is no web access, audit only the repository’s documented provenance and produce an external-source verification checklist.

11. Do not claim clinical, scientific, or normative validity merely because a table is in the code.

12. Treat repository comments such as “Rikli and Jones,” “Bohannon,” “Norkin/White,” or “estimated” as leads, not proof.

13. Separate:
    - software correctness,
    - normative-data provenance,
    - exercise-science validity,
    - product positioning,
    - UX/copy risk,
    - legal/medical-claims risk,
    - physical-device validation dependency,
    - beta acceptability.

14. Be explicit when evidence is missing.

15. Product decisions should be recommended, not silently implemented.

## Working-tree safety

Before analysis:

1. Run:

   git status --short --untracked-files=all

   git diff --name-only

   git diff --stat

2. Record exact outputs in the report.

3. Treat all existing modifications and untracked files as user-owned.

4. Inspect current diffs for every file this task may cite heavily.

5. Do not revert, overwrite, reformat, move, or delete unrelated work.

6. Run the same Git status commands at the end.

7. The only intended repository change is:

   docs/audits/HALE_LOGIC_AUDIT_STAGE_3D.md

8. If unrelated files change during the audit, record them and do not overwrite them.

## Validation baseline

Run the minimum non-mutating validation suite needed to confirm the current app remains green before making audit conclusions.

Use installed dependencies only.

Run:

```bash
npm test -- --runInBand
npm run typecheck
npx --no-install expo config --type public
git diff --check
```

If there are targeted tests specifically for scoring, score snapshots, progress, reports, and result screens, run those first and record the exact command.

Record:

- exact commands,
- exit codes,
- suite count,
- test count,
- snapshot count,
- warnings,
- skipped tests,
- Watchman warning status,
- Jest open-handle status,
- Sentry Expo warning status,
- whether commands changed any files.

The prior Stage 3C.1 full baseline was 83 suites and 564 tests. Verify the current baseline rather than assuming it is unchanged.

## Step 1: Reconstruct the current scoring and claim architecture

Inspect at minimum:

- src/scoring/norms.ts
- src/scoring/scoring.ts
- src/scoring/scoreSnapshot.ts
- src/scoring/versions.ts
- src/haleFlow/assessments.ts
- src/haleFlow/assessmentEvidence.ts
- src/haleFlow/assessmentResultState.ts
- src/haleFlow/progressViewModel.ts
- src/haleFlow/reports.ts
- src/haleFlow/checkupHistory.ts
- src/adherence/types.ts
- src/adherence/screens/BlockReportScreen.tsx
- src/screens/ResultsScreen.tsx
- src/screens/OnboardingResultsScreen.tsx
- src/screens/ProgressScreen.tsx
- src/screens/TodayScreen.tsx
- src/screens/PlanScreen.tsx
- any copy/content files related to Movement Check-Up results, Progress, reports, onboarding, or explanations
- all tests related to scoring, Progress, reports, snapshots, and result screens.

Document:

- which raw metric drives each headline domain;
- which supporting metrics are shown but not scored;
- which result fields are frozen in snapshots;
- which claims are displayed directly from snapshots;
- which claims are recomputed in view models;
- which copy is tied to exact domain values;
- which copy is generic regardless of confidence or completeness;
- how complete official results reach block focus;
- how comparison-unavailable reports are shown;
- how incomplete results are shown;
- where movement-age language appears.

Produce a call graph from:

raw Check-Up -> validated score -> frozen snapshot -> MovementAssessment -> Results -> Progress -> Report -> block focus.

## Step 2: Norm table inventory and provenance audit

For every norm or scoring table in the repository, build a table with:

| Norm/table | Metric | File/lines | Current input unit | Output | Source named in repo | Source quality | Age range | Sex stratified? | Population | Estimated anchors? | Directly verified? | Beta verdict |

Inspect all code comments, README/docs, audit notes, tests, and decision documents for provenance.

At minimum include:

- chair-stand repetitions norm;
- single-leg balance / balance ladder norm;
- shoulder flexion ROM norm;
- TUG norm, even if beta-hidden/supporting;
- any extrapolation, interpolation, or estimated anchors;
- any interpretation text/ranges;
- any movement-age conversion tables;
- any hard-coded performance bands.

For each norm, determine from repository evidence only:

- exact named source;
- whether enough citation metadata exists to find the source again;
- whether the source population is described;
- whether the source’s measurement protocol matches Hale’s home-camera protocol;
- whether the source is age-stratified;
- whether the source is sex-stratified;
- whether the source includes adults aged 45–65;
- whether the source includes older adults outside that range;
- whether the table was adjusted, pooled, estimated, interpolated, or extrapolated;
- whether estimated anchors are clearly labelled internally;
- whether estimated anchors are visible to users;
- whether the norm is used for official decisions;
- whether the norm is used for user-facing age claims.

If the repository lacks sufficient provenance, mark:

NORMATIVE-DATA REVIEW REQUIRED

Do not pretend that provenance is sufficient because a source name appears in a comment.

## Step 3: Domain-by-domain scientific/product audit

### Strength / Power

Determine:

- current headline metric;
- supporting metrics;
- whether “strength,” “power,” or “strength/power” is the most accurate label;
- whether chair-stand repetitions alone justify the domain label;
- whether rise velocity is actually used in scoring;
- whether current copy implies power even though the age is rep-count based;
- whether push-off/assistance flags affect official interpretation;
- whether the norm table protocol matches Hale’s 30-second chair-stand setup;
- whether current device validation is sufficient for age claims;
- whether the target population and norm population align.

Classify:

- software-consistent;
- product-label risk;
- normative-data risk;
- device-validation dependency;
- beta-ready / beta-provisional / beta-blocked.

### Balance

Determine:

- current headline metric;
- supporting metrics;
- whether single-leg hold alone drives balance age;
- whether earlier ladder stages affect age;
- whether sway affects age;
- whether TUG affects age;
- whether the word “balance” overstates a single-leg static hold;
- whether the norm protocol matches Hale’s front-camera home test;
- whether the stage-clock interruption policy could distort interpretation;
- whether current copy implies broader balance/fall-risk interpretation.

Classify as above.

### Mobility

Determine:

- current headline metric;
- whether shoulder flexion alone drives mobility age;
- whether hinge reach affects mobility age;
- whether hinge reach appears visually as equal evidence despite not affecting the age;
- whether “mobility” overstates shoulder-only scoring;
- whether the shoulder-flexion norm table is fully or partly estimated;
- whether a movement-age output from an estimated table is acceptable for beta;
- whether hinge reach should remain supporting-only, become a confidence modifier, become headline input, or be reframed.

Classify as above.

### TUG

Even though beta-hidden/supporting:

- identify where TUG can appear historically;
- confirm whether it contributes to any current claim;
- assess whether any user-facing TUG copy remains reachable;
- state whether TUG should remain hidden until fully validated.

## Step 4: Movement-age claim audit

Create a claim register for every user-facing claim involving:

- movement age;
- strength age;
- balance age;
- mobility age;
- age lower/upper bounds;
- “typical for age”;
- “younger/older”;
- “weakest area”;
- “stronger”;
- “steadier”;
- “more mobile”;
- “improved”;
- “declined”;
- “held steady”;
- “personalised to your weakest area”;
- “physical aging”;
- “longevity”;
- “independence”;
- any wording that could imply medical diagnosis, treatment, fall-risk prediction, disease prevention, or clinical assessment.

For each claim record:

| Claim/copy | Screen/view model | Trigger | Source data | Evidence strength | Missing caveat | Risk | Recommended action |

Classify each claim as:

- safe as-is;
- safe if softened;
- safe only with beta/provisional label;
- should be hidden until validation;
- should be replaced with performance band;
- should be removed due to medical/unsupported implication.

Do not change the copy.

## Step 5: Precision and display audit

For each displayed score or age:

- determine whether it is exact, range, midpoint, lower bound, upper bound, or category;
- determine whether the UI presents more precision than the norm table supports;
- determine whether estimated anchors are hidden;
- determine whether output should be a range instead of a point;
- determine whether “age” is the right framing;
- determine whether a broad performance band would be safer;
- determine whether the current frozen snapshot preserves enough context to later change display without corrupting history.

Create a table:

| Displayed value | Actual calculation | Precision shown | Precision justified? | Recommended beta display |

Explicitly evaluate whether Hale should use:

- exact movement age;
- age range;
- performance band;
- percentile;
- domain score;
- “needs attention / okay / strong” band;
- beta estimate label;
- no normative label during beta.

## Step 6: Weakest-domain tie and near-tie audit

Inspect the exact current algorithm for weakest-domain selection.

For complete three-domain current-version scores only, analyze:

- exact tie behavior;
- domain iteration order;
- whether ties default to strength because of object order;
- whether ties are stored in snapshots;
- whether frozen snapshots can represent multiple weakest domains;
- whether block focus can support joint focus;
- whether plan generation can accept balanced/multi-focus inputs;
- whether UI can display “closely matched” or “joint focus.”

Run deterministic diagnostics using existing scoring functions or snapshot helpers.

Construct cases:

1. strength clearly weakest.
2. balance clearly weakest.
3. mobility clearly weakest.
4. exact strength/balance tie.
5. exact strength/mobility tie.
6. exact balance/mobility tie.
7. exact three-way tie.
8. near tie where display rounding makes domains equal.
9. near tie where internal score differs but likely below measurement noise.
10. tie after frozen snapshot restore.
11. tie in a current-version official re-test.
12. tie used for block creation.

Do not change code.

Produce decision options:

### Exact tie policy options

- fixed priority;
- preserve current block focus;
- joint focus;
- balanced block;
- ask the user;
- choose domain with worse raw metric reliability;
- choose domain with strongest evidence;
- no block until retest;
- product default for V1.

Recommend a V1 default.

### Near-tie policy options

- no near-tie margin until device repeatability is known;
- fixed age-margin threshold;
- per-domain measurement-noise threshold;
- device-derived smallest-detectable-change threshold;
- “closely matched” copy without changing focus;
- joint/balanced block.

Recommend what should happen before beta.

## Step 7: Meaningful-change and improvement/decline audit

Inspect current report/progress logic for:

- improved;
- declined;
- held steady;
- no change;
- starting point;
- comparison unavailable;
- adjusted plan;
- progress card deltas.

Determine:

- exact numerical rule for improvement/decline;
- whether it uses rounded or unrounded ages;
- whether any tiny age difference can trigger a claim;
- whether raw metric change can be below measurement noise;
- whether comparison requires compatible score/norm versions;
- whether comparison requires all three headline domains;
- whether current Stage 3C incompatible behavior is safe;
- whether current same-version comparisons are still too precise.

Create examples:

- 0.1-year change.
- 0.49-year change.
- 0.5-year change.
- 1-year change.
- boundary-crossing change.
- one domain improves, another worsens.
- supporting metric improves but headline age unchanged.
- headline age improves while raw metric change is tiny.
- chair-stand velocity changes but strength age unchanged.
- hinge reach improves but mobility age unchanged.

Produce decision options:

### Meaningful-change options

- any numerical difference;
- display-rounded difference;
- fixed age-year threshold;
- raw metric threshold;
- domain-specific smallest detectable change;
- repeatability-derived threshold from real-device testing;
- require two consecutive improvements;
- show neutral comparison only until validation.

Recommend a V1 beta policy.

## Step 8: Physical-device dependency map

Identify every scoring or claim that depends on unresolved device validation.

At minimum:

- chair-stand rise velocity repeatability;
- chair-stand rep counting in real home setups;
- balance hold validity under tracking interruptions;
- shoulder-flexion angle repeatability across phone position and clothing;
- hinge reach repeatability and floor/body-unit stability;
- front/side orientation threshold tuning;
- meaningful-change thresholds;
- near-tie margins.

For each dependency:

| Claim/metric | Device validation needed | Why static tests are insufficient | Minimum experiment | Blocks beta? |

Do not design a full study, but define the minimum practical beta-readiness evidence.

## Step 9: Legal/medical-claims risk audit

Review result, progress, report, onboarding, landing/product copy in the app repository for claims that could imply:

- diagnosis;
- treatment;
- fall-risk prediction;
- disease prevention;
- medical-grade measurement;
- clinical assessment;
- guaranteed longevity or independence preservation;
- replacement for professional advice.

Create a risk table:

| Copy/claim | Location | Risk type | Severity | Safer framing |

Recommended Hale-safe framing should preserve the product’s value without making medical claims.

Preferred safe language:

- “Movement Check-Up”
- “home movement estimate”
- “beta estimate”
- “areas to focus on”
- “stronger, steadier, more mobile”
- “track your movement over time”
- “not a medical assessment”
- “not a diagnosis”

Avoid:

- “fall risk”
- “frailty diagnosis”
- “medical-grade”
- “prevent disease”
- “guaranteed independence”
- “treatment”
- “clinical result”

Do not edit copy in this task.

## Step 10: Beta display policy recommendations

Produce a concise product-decision packet with recommendations for V1 beta.

At minimum include:

### Decision A: Keep or hide movement ages

Options:

- keep exact movement ages;
- show age ranges;
- show beta-estimate movement ages;
- replace with performance bands;
- hide age framing until norm review.

Recommend one.

### Decision B: Domain label accuracy

For each:

- strength/power;
- balance;
- mobility.

Recommend whether to keep, rename, or clarify.

### Decision C: Shoulder-flexion estimated norm

Options:

- keep as mobility age;
- label as beta estimate;
- replace with mobility band;
- remove from headline age;
- require external norm review before beta.

Recommend one.

### Decision D: Hinge reach role

Options:

- supporting detail only;
- confidence modifier;
- equal contributor;
- separate mobility sub-card;
- remove from result view until validated.

Recommend one.

### Decision E: Exact ties

Recommend V1 rule.

### Decision F: Near ties

Recommend whether to wait for device-repeatability data before defining a margin.

### Decision G: Improvement/decline claims

Recommend interim beta behavior.

### Decision H: Norm provenance requirements before public beta

List exact source documents/data needed.

### Decision I: What remains safe to use for training focus

Recommend whether the current weakest-domain focus can still be used to generate plans if movement-age claims are softened.

### Decision J: What must be shown to beta users

Recommend copy/caveats/labels.

For each decision include:

- current behavior;
- options;
- recommendation;
- reason;
- implementation impact;
- beta blocker status.

## Step 11: Stage 4 and Stage 5 unblock criteria

Determine whether Stage 4 and Stage 5 can proceed after Stage 3D audit or whether remediation must happen first.

Stage 4: exercise catalogue and progression audit.

Stage 5: dynamic workout generation audit.

Questions:

- Can Stage 4 proceed if scoring claims are provisional?
- Can Stage 5 proceed if weakest-domain focus remains provisional?
- What minimum Stage 3D remediation is required before judging workout generation correctness?
- Can Stage 5 use “focus domain from current complete official score” if movement-age display is softened?
- Does tie handling need to be resolved before Stage 5?
- Does meaningful-change need to be resolved before Stage 5?
- Does norm provenance need to be resolved before beta, even if Stage 4/5 audits can proceed?

Output explicit stage decisions:

- STAGE 3D REMEDIATION REQUIRED or NO STAGE 3D REMEDIATION REQUIRED
- STAGE 4 UNBLOCKED or STAGE 4 BLOCKED
- STAGE 5 INPUTS READY or STAGE 5 INPUTS BLOCKED

## Existing-test quality audit

Inspect existing tests relevant to norms, claims, ties, and reports.

At minimum:

- scoring tests;
- score snapshot tests;
- result-screen tests;
- progress view model tests;
- block report tests;
- assessment eligibility tests;
- any copy/string tests.

Determine whether tests assert:

- exact age language;
- estimated shoulder table outputs;
- current tie behavior;
- improvement/decline from tiny differences;
- movement-age precision;
- hinge supporting-only role;
- no medical claims;
- comparison unavailable states.

Identify tests that would need to change during Stage 3D remediation.

## Required report structure

Write:

docs/audits/HALE_LOGIC_AUDIT_STAGE_3D.md

with sections:

1. Executive verdict.
2. Baseline validation and repository status.
3. Current scoring/claim architecture.
4. Norm provenance register.
5. Strength/power domain audit.
6. Balance domain audit.
7. Mobility domain audit.
8. TUG historical/supporting audit.
9. Movement-age claim register.
10. Precision and display audit.
11. Weakest-domain exact tie and near-tie audit.
12. Meaningful-change and improvement/decline audit.
13. Physical-device dependency map.
14. Legal/medical-claims risk audit.
15. Existing-test and false-confidence analysis.
16. Product-decision packet.
17. Recommended Stage 3D remediation batches.
18. Stage 4 and Stage 5 unblock analysis.
19. Final stage decisions.
20. Final Git status.

## Recommended remediation batch planning

Do not implement.

Propose small future batches such as:

- Stage 3D-A: movement-age display/copy softening.
- Stage 3D-B: norm provenance documentation and source verification.
- Stage 3D-C: exact tie policy.
- Stage 3D-D: near-tie and meaningful-change policy after device repeatability.
- Stage 3D-E: report/progress claim neutralization.
- Stage 3D-F: medical-claims copy hardening.

For each batch include:

| Batch | Findings addressed | Files likely involved | Tests required | Product decision required | Beta blocker? |

## Acceptance criteria

Do not mark Stage 3D complete unless all are true:

1. Every current norm table is inventoried.
2. Every current norm source/provenance claim is assessed.
3. Estimated tables and estimated anchors are identified.
4. Each headline domain label is evaluated against the metric that actually drives it.
5. Every movement-age user-facing claim is registered.
6. Every improvement/decline claim path is registered.
7. Tie and near-tie current behavior is established.
8. Meaningful-change current behavior is established.
9. Physical-device dependencies are mapped.
10. Medical/legal claim risks are identified.
11. Existing tests related to claims are audited.
12. Product-decision packet is complete.
13. Stage 4/5 unblock status is explicit.
14. No production code/tests/norms/copy were changed.
15. Full validation commands pass or failures are documented.
16. Final Git status is recorded.

## Final Codex response

Return a concise summary containing:

- Report path.
- Validation results.
- Number of norm tables audited.
- Number of user-facing claims audited.
- Number of claims classified as safe / soften / beta-label / hide / remove.
- Norm provenance verdict by domain.
- Strength/power beta verdict.
- Balance beta verdict.
- Mobility beta verdict.
- Movement-age display recommendation.
- Exact tie policy recommendation.
- Near-tie recommendation.
- Meaningful-change recommendation.
- Top five user-trust risks.
- Product decisions needing approval.
- Recommended Stage 3D remediation batches.
- STAGE 3D REMEDIATION REQUIRED or NO STAGE 3D REMEDIATION REQUIRED.
- STAGE 4 UNBLOCKED or STAGE 4 BLOCKED.
- STAGE 5 INPUTS READY or STAGE 5 INPUTS BLOCKED.
- Initial and final Git status.
- Confirmation that no production code, tests, norms, copy, config, dependencies, commit, staging, branch, or push occurred.
