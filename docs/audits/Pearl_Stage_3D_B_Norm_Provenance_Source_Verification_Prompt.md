You are carrying out Stage 3D-B of Pearl’s production-readiness work:

NORMATIVE-DATA PROVENANCE, PRIMARY-SOURCE VERIFICATION, PROTOCOL COMPATIBILITY, CROSS-DOMAIN CALIBRATION, AND MOVEMENT-AGE SCIENTIFIC READINESS

This is a read-only scientific/source audit and product-decision task.

Do not modify scoring formulas, norm tables, snapshots, focus selection, Check-Up logic, copy, tests, workout generation, exercise content, native pose code, backend code, app/website UI, dependencies, lockfiles, or bundled assets in this task.

Do not begin physical-device validation in this task.

Do not claim Pearl is beta-ready in this task.

## Why Stage 3D-B is now the next stage

Stage 4 software/content remediation is complete:

- Stage 4C-R closed floor-transfer, step-environment, single-leg-confidence, and Explore/manual safety-parity gaps.
- Stage 4D-R and 4D-R.1 implemented and verified canonical text/voice safety cues, including 44 safety cues for Clara and Marcus and 88 bundled MP3 assets.
- Stage 4E-R contained all seven optional/advanced levels in controlled beta.
- Stage 4F-R.1 enforced explicit movement-specific progression policy and conservative automatic-progression ceilings.
- Stage 4G-R implemented deterministic mobility rotation, non-linear presentation, and truthful equipment positioning.
- The exercise catalogue is software/content-ready for controlled beta.

Stage 5 remediation is complete:

- dynamic workout generation is software-ready for controlled beta;
- work, focus, schedule credit, progression, equipment, daily context, restore, and lifecycle contracts are verified.

The two remaining top-level beta gates are:

1. Stage 3D-B normative-data/source verification.
2. Physical-device validation.

Stage 3D-B must determine whether Pearl’s current normative tables, age-range transformations, cross-domain focus comparison, and user-facing estimate policy are scientifically supportable.

## Required prior reading

Read these reports in full before beginning:

- docs/audits/PEARL_LOGIC_AUDIT_STAGE_3D.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_A.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_C.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_D.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_3C_1.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3B.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3A.md
- docs/audits/PEARL_LOGIC_AUDIT_STAGE_3.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_2A_1.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4G_R.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4F_R_1.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5H.md

Also inspect any current decisions/source notes in:

- docs/decisions.md
- code comments in the scoring/norm modules;
- tests that pin norm values;
- app/website copy that still exposes bands or age estimates.

Treat the current working tree as the source of truth. Re-verify every path and value because report line numbers and code may have changed.

## Explicit authorization for external source lookup

The prior Stage 3D audit was repository-only because external source verification was not separately authorized.

This Stage 3D-B task explicitly authorizes internet/source lookup for the narrow purpose of verifying normative data and protocols.

Use network access only for:

- primary peer-reviewed papers;
- official test manuals or official publisher previews;
- PubMed or publisher records;
- DOI/Crossref metadata;
- official institutional repositories;
- official book/manual metadata;
- source documents directly cited by the repository.

Do not use:

- blogs;
- commercial fitness websites;
- unsourced normative tables;
- AI-generated summaries;
- search-result snippets as evidence;
- Wikipedia as source evidence;
- Sci-Hub or other unauthorized copies;
- secondary websites when the primary source is available.

If the exact primary source or table is paywalled/inaccessible:

- do not bypass access controls;
- do not infer the table from a secondary summary;
- classify it as not directly verified;
- record what metadata was verified and what remains inaccessible.

Temporary source files may be downloaded only under:

```text
/tmp/pearl-stage3db/
```

Do not commit source PDFs, screenshots, scans, or copyrighted tables.

Delete temporary downloads before finishing.

Do not quote long source passages. Paraphrase protocol/population details and reproduce only the minimum individual values needed to compare Pearl’s code.

## Current Stage 3D baseline

The prior audit found:

### Chair-stand strength norm

Repository claim:

- Rikli & Jones Senior Fitness Test;
- 1999 source family and 2013 manual reference;
- real source range represented in code: ages 60–94;
- code adds estimated anchors for approximately ages 47, 52, and 57;
- code pools sexes;
- chair-stand repetitions drive the strength age;
- rise velocity is supporting only.

Prior verdict:

- strongest current provenance lead;
- beta-provisional;
- exact table, protocol transformation, sex pooling, and ages 45–59 extrapolation not externally verified.

### TUG norm

Repository claim:

- Bohannon 2006 J Geriatric Physical Therapy meta-analysis;
- under-60 values are estimated;
- not currently used as official headline domain age;
- may appear as supporting/historical detail.

Prior verdict:

- keep hidden/supporting until protocol and room-fit validation.

### Single-leg stance norm

Repository claim:

- Bohannon 2006 Topics in Geriatric Rehabilitation meta-analysis;
- source population begins at older ages;
- ages 50/55 are estimated;
- single-leg eyes-open seconds drive balance age.

Critical prior issue:

- Pearl’s production single-leg stage caps the hold at 12 seconds;
- current code anchors include approximately 27–35 seconds for younger/younger-old groups;
- a perfect Pearl 12-second trial cannot span the source scale appropriately.

Prior verdict:

- balance age claim beta-blocked pending protocol/norm alignment.

### Shoulder-flexion norm

Repository claim:

- Norkin & White plus broad aging-ROM literature;
- the whole current age table is marked estimated;
- shoulder flexion alone drives mobility age;
- hinge reach is supporting only.

Prior verdict:

- provenance incomplete;
- mobility age claim beta-blocked.

### Product bands

Current labels such as:

- Strong;
- Building;
- Starting point

are product heuristics derived from score/age midpoint thresholds, not externally validated normative categories.

They may remain only when clearly described as product interpretation bands rather than clinical or population norms.

### Tie and change policy

Already completed:

- exact-tie policy;
- near-tie policy;
- active-focus preservation;
- meaningful-change claim neutralization;
- beta-safe copy softening.

Do not reopen those policies unless source verification proves a direct contradiction.

## Primary objectives

Stage 3D-B must:

1. Reconstruct the current norm/scoring architecture from source.

2. Enumerate every current norm table, anchor, transformation, interpolation, extrapolation, cap, and estimate flag.

3. Retrieve and inspect the exact primary sources where legally accessible.

4. Verify exact bibliography, edition, DOI/PMID/ISBN, page/table/figure, population, protocol, and statistic.

5. Compare every current code anchor to the source value it claims to represent.

6. Classify every code anchor as:
   - directly sourced;
   - directly derived;
   - pooled/combined;
   - interpolated;
   - extrapolated;
   - estimated by Pearl;
   - unsupported;
   - product heuristic.

7. Verify whether each source protocol matches Pearl’s home-camera protocol closely enough for:
   - internal focus use;
   - performance-band display;
   - beta age-range display;
   - authoritative normative claims.

8. Verify whether sex pooling is scientifically justified.

9. Verify whether ages 45–59 are directly represented or only extrapolated.

10. Resolve or formally block the 12-second balance-cap/norm mismatch.

11. Determine whether any defensible age-specific shoulder-flexion norm supports the current table.

12. Audit whether the three domain age scales are comparable enough to choose a weakest focus domain.

13. Distinguish:
   - source validity;
   - protocol compatibility;
   - cross-domain calibration;
   - device repeatability;
   - user-facing claim validity.

14. Determine the safe controlled-beta policy for:
   - strength age estimate;
   - balance age estimate;
   - mobility age estimate;
   - TUG;
   - performance bands;
   - internal focus selection.

15. Produce a precise remediation plan without implementing it.

## Output file

Create exactly one new repository file:

```text
docs/audits/PEARL_LOGIC_AUDIT_STAGE_3D_B.md
```

Do not edit prior reports.

Do not create another repository source register file in this task; include the complete register inside the report.

Temporary downloads and scripts must stay under `/tmp/pearl-stage3db/` and must be deleted before completion.

## Read-only rules

1. Do not modify production code.

2. Do not modify tests or fixtures.

3. Do not modify norm tables.

4. Do not modify source comments.

5. Do not modify scoring or snapshots.

6. Do not modify copy or UI.

7. Do not modify the website.

8. Do not modify exercise, workout, progression, or schedule logic.

9. Do not install packages.

10. Do not modify lockfiles.

11. Do not stage, commit, create a branch, or push.

12. Do not use destructive Git commands.

13. Do not commit or redistribute source PDFs/manual pages.

14. Do not present inaccessible or secondary values as directly verified.

15. Do not treat a named source in a code comment as sufficient provenance.

16. Do not treat protocol similarity as protocol equivalence without evidence.

17. Do not claim clinical validity from software tests.

18. Do not claim physical-device reliability in this task.

## Working-tree safety

Before analysis, run:

```bash
git status --short --untracked-files=all
git diff --name-only
git diff --stat
```

Record exact output in the report.

Important current-tree cautions:

- Stage 4 and Stage 5 changes are spread across a heavily dirty working tree.
- The 88 Clara/Marcus safety MP3s and their manifests are intended changes; do not delete or regenerate them.
- Concurrent pose-renderer, native pose-module, authentication, benchmark, app-screen, and website changes may exist.
- Do not inspect or expose `.env` values.
- Do not expose provider credentials.
- Do not modify or share font files.

At the end, rerun the same Git commands.

The only intended repository change is the new Stage 3D-B report.

## Baseline validation

Run a targeted existing test slice covering at minimum:

- scoring input validation;
- scoring;
- norm inversion;
- score snapshots;
- focus selection;
- assessment eligibility;
- checkup history;
- progress view model;
- report generation;
- copy guardrails;
- backend check-up sync/restore;
- Stage 4 closure regressions;
- Stage 5H lifecycle.

Then run exactly:

```bash
npm run verify:audio
npm test -- --runInBand
npm run typecheck
npm --prefix website run typecheck
npx --no-install expo config --type public
git diff --check
```

Do not install dependencies.

A local Expo export is optional because this task is report-only. Run it only if the current repository instructions require it or if validation reveals an asset/config concern.

Record:

- exact targeted command;
- targeted suite/test counts;
- audio verification count;
- full suite/test counts;
- app typecheck;
- website typecheck;
- Expo config;
- diff check;
- warnings;
- whether validation changed files.

The Stage 4G-R reference baseline was:

- full Jest: 105 suites / 861 tests;
- safety audio: 44 cues / 88 assets;
- app and website typechecks passed;
- Expo config/export passed;
- `git diff --check` passed.

Verify the current baseline rather than assuming it.

# PART A — CURRENT CODE AND CLAIM ARCHITECTURE

## Step 1: Reconstruct the current scoring/norm pipeline

Inspect at minimum:

- src/scoring/norms.ts
- src/scoring/scoring.ts
- src/scoring/scoringInputValidation.ts
- src/scoring/scoreSnapshot.ts
- src/scoring/versions.ts
- src/scoring/focusSelection.ts
- src/movements/chairStand.ts
- src/movements/balanceLadder.ts
- src/movements/shoulderFlexion.ts
- src/movements/tug.ts
- src/pearlFlow/assessments.ts
- src/pearlFlow/assessmentEligibility.ts
- src/pearlFlow/progressViewModel.ts
- src/pearlFlow/reports.ts
- src/pearlFlow/appLifecycle.ts
- result/progress/report screens and copy helpers
- related tests.

Trace:

```text
raw movement result
-> canonical scoring input
-> norm inversion
-> domain age range
-> estimated/source flags
-> frozen snapshot
-> focus selection
-> performance band
-> Results/Progress/Report
-> MovementBlock focus
```

Document:

- exact raw metric that drives each domain;
- supporting metrics not used in the age;
- exact norm inversion/interpolation/clamping algorithm;
- estimated flags;
- age-range midpoint use;
- cross-domain focus comparison;
- current user-facing exposure of age ranges;
- current band thresholds;
- current source/version metadata in snapshots.

## Step 2: Extract the exact current norm tables

Use a temporary read-only script under `/tmp/pearl-stage3db/` if helpful.

For every row/anchor in every current table, record:

| Table | Code anchor ID | Age/age range | Metric value | Estimated flag | Source comment | Used in headline age? |

Include:

- chair-stand repetitions;
- TUG seconds;
- single-leg stance seconds;
- shoulder-flexion degrees;
- any other age/norm table discovered;
- domain performance-band thresholds;
- any residual meaningful-change threshold still active.

Do not summarize away individual anchors.

## Step 3: Map current claim surfaces

Create:

| Surface | Domain | Current claim | Uses age range? | Uses band? | Uses raw metric? | Source-dependent? | Current caveat |

Inspect app and website production copy where relevant.

Distinguish:

- direct age display;
- beta age estimate;
- performance band;
- suggested focus;
- raw metric;
- trend/comparison;
- training-focus use.

Do not assume Stage 3D-A copy is still present; verify it.

# PART B — SOURCE-VERIFICATION METHOD

## Step 4: Use explicit evidence grades

Use this source-evidence grading system:

### Grade A — exact primary verification

- exact primary paper/manual inspected;
- exact table/page/figure inspected;
- exact protocol inspected;
- exact value/statistic verified.

### Grade B — primary metadata and protocol verified, exact table inaccessible

- exact source identity is verified;
- abstract/method/protocol may be verified;
- exact norm values are not directly inspected.

### Grade C — authoritative secondary lead only

- official review/manual summary or reputable secondary source;
- insufficient to verify exact code values.

### Grade D — repository assertion only

- source family appears only in code/comment/report;
- no external source verified.

### Grade E — unsupported/product-created

- no source;
- estimated or heuristic values created by Pearl.

Every source and every anchor must receive a grade.

## Step 5: Bibliographic standard

For every source, record:

- full title;
- authors;
- year;
- journal/publisher;
- volume/issue/pages where applicable;
- DOI;
- PMID where applicable;
- ISBN/edition for manuals/books;
- exact page/table/figure;
- official or publisher URL;
- date accessed;
- access status:
  - full text;
  - official preview;
  - abstract only;
  - inaccessible/paywalled.

Do not put raw source PDFs in the repository.

## Step 6: Reproducibility standard

For every current norm table, another reviewer should be able to answer:

- Which exact source values were used?
- Which source rows were omitted?
- Were values means, medians, percentiles, or normal ranges?
- Were male/female values pooled?
- How were they pooled?
- Were age bins converted to midpoint ages?
- Were ranges converted to one anchor?
- Which values were interpolated?
- Which values were extrapolated?
- Which values were estimated without a source?
- How does the code invert the table?
- What happens outside the source range?
- What protocol mismatch remains?

If any answer is unavailable, state that explicitly.

# PART C — CHAIR-STAND SOURCE VERIFICATION

## Step 7: Identify the exact Rikli & Jones source

The repository references:

- Rikli & Jones Senior Fitness Test;
- a 1999 source family;
- a 2013 manual.

Verify the exact source(s) rather than assuming which publication/manual edition was intended.

Find and inspect, where legally accessible:

- the original validation/normative paper;
- the official Senior Fitness Test manual or official preview;
- the exact 30-second chair-stand table used by the code.

Record whether the code source appears to be:

- normal ranges;
- percentile bands;
- means/SD;
- cut scores;
- another derived table.

## Step 8: Verify chair-stand protocol compatibility

Compare the source protocol with Pearl’s current assessment:

| Protocol dimension | Source | Pearl | Match verdict |
| --- | --- | --- | --- |
| Test duration | | | |
| Chair height | | | |
| Backrest/seat | | | |
| Arm position | | | |
| Starting posture | | | |
| Full-stand definition | | | |
| Final partial rep | | | |
| Footwear | | | |
| Practice trial | | | |
| Tester instruction | | | |
| Count method | | | |
| Population | | | |
| Sex strata | | | |

Do not label the protocols equivalent unless the material features match.

## Step 9: Verify every chair-stand code anchor

For each code anchor:

- find the claimed source row/value;
- calculate any midpoint/pooling transformation;
- show the formula;
- classify the anchor.

Explicitly audit:

- sex pooling;
- age-bin midpoint conversion;
- ages approximately 47/52/57;
- any clamping or extrapolation outside age 60+;
- whether the app’s target 45–65 population is directly represented.

## Step 10: Chair-stand verdicts

Decide separately:

- source table verified?
- protocol sufficiently matched?
- sex pooling defensible?
- ages 45–59 defensible?
- chair-rise performance band defensible?
- strength age-range display defensible?
- internal focus use defensible?
- device validation still required?

Do not collapse these into one verdict.

# PART D — TUG SOURCE VERIFICATION

## Step 11: Identify the exact Bohannon TUG source

Verify the exact paper referenced by the repository.

Record:

- exact title/citation;
- included-study population;
- age strata;
- test walkway distance;
- chair/setup;
- instruction;
- use of assistive devices;
- statistic reported;
- heterogeneity/limitations.

## Step 12: Compare every TUG anchor

For each current code anchor:

- identify direct source value or derivation;
- classify under-60 values;
- verify whether current code uses means as normative thresholds;
- verify inversion direction and clamping.

## Step 13: TUG verdict

Decide:

- source verified?
- protocol compatible with Pearl’s room/home setup?
- supporting raw-seconds display safe?
- age estimate safe?
- official focus use safe?
- should TUG remain hidden/supporting?

Do not promote TUG simply because the source is real.

# PART E — SINGLE-LEG STANCE SOURCE VERIFICATION

## Step 14: Identify the exact Bohannon single-limb stance source

Verify the exact paper/meta-analysis.

Record:

- exact citation;
- eyes open/closed;
- preferred/non-preferred leg;
- arm position;
- footwear;
- number of trials;
- best/mean trial;
- max trial duration;
- termination rules;
- support/touchdown rules;
- age strata;
- sex handling;
- population;
- statistic reported.

## Step 15: Verify every balance code anchor

For each current anchor:

- identify direct source value or derivation;
- classify ages 50/55;
- verify any age-bin midpoint conversion;
- verify sex pooling;
- verify use of source means/ranges/percentiles.

## Step 16: Resolve the 12-second cap mismatch

Compare:

- Pearl’s maximum single-leg stage duration;
- source test duration/censoring;
- source age-anchor seconds;
- current inversion behavior at 12 seconds.

Use temporary code probes to show:

- the best possible Pearl valid score;
- the resulting balance age range;
- whether younger norm ranges are mathematically unreachable;
- whether the scale is truncated or distorted.

Required decision:

- protocol/norm aligned;
- protocol/norm can be corrected with a documented transformation;
- balance age must remain hidden;
- balance age table must be replaced;
- balance stage duration must change later;
- internal focus use must be reconsidered.

Do not modify the stage duration or norm in this task.

# PART F — SHOULDER-FLEXION SOURCE VERIFICATION

## Step 17: Verify what Norkin & White actually supports

Determine whether the cited edition/source provides:

- age-stratified active shoulder-flexion norms;
- generic expected ROM only;
- measurement methodology only;
- sex-specific data;
- older-adult data;
- no table matching Pearl’s code.

Do not attribute age-specific values to Norkin & White unless they are actually present.

## Step 18: Search for the exact age-specific source behind the table

Search primary literature for active shoulder-flexion ROM by age.

Requirements:

- active rather than passive ROM;
- protocol/plane defined;
- age groups relevant to 45–65 or older adults;
- goniometric or comparable measurement method;
- sample/population described.

Do not select a source merely because its values look similar to Pearl’s table.

If no exact primary source matches the code:

- classify the whole table as Pearl-estimated/unsupported;
- do not retrofit an unrelated paper after the fact.

## Step 19: Verify every shoulder code anchor

For every current degree/age anchor:

- direct source?
- derived?
- estimated?
- unsupported?
- protocol match?
- population match?

Audit whether shoulder flexion alone can support a domain labelled “Mobility.”

## Step 20: Shoulder/mobility verdicts

Decide separately:

- raw shoulder degrees safe to display?
- broad product band safe?
- mobility age range safe?
- internal mobility focus safe?
- hinge supporting row safe?
- domain label requires clarification?
- source replacement/removal required?

# PART G — PRODUCT HEURISTICS AND CROSS-DOMAIN CALIBRATION

## Step 21: Performance-band audit

Audit the current Strong / Building / Starting point logic.

For each band:

- exact threshold;
- source;
- current user-facing wording;
- whether it is presented as normative;
- whether it is derived from unsupported age midpoints.

Classify bands as:

- externally normative;
- product heuristic with safe caveat;
- product heuristic needing redesign;
- unsafe because it launders unsupported age norms.

Do not treat softer wording alone as scientific validation.

## Step 22: Cross-domain comparability audit

This is mandatory.

Even if each source table is individually real, verify whether it is scientifically defensible to compare:

- chair-stand inferred age midpoint;
- single-leg inferred age midpoint;
- shoulder-flexion inferred age midpoint

and choose the largest as the user’s weakest domain.

Audit differences in:

- populations;
- age ranges;
- sex stratification;
- statistic type;
- protocol;
- censoring/max duration;
- measurement error;
- estimated anchors;
- interpolation;
- scale breadth.

Produce:

| Cross-domain assumption | Evidence | Verdict | Impact on focus |

Required decisions:

- current focus comparison defensible for controlled beta;
- provisional focus defensible only as product heuristic;
- focus must be based on non-age bands instead;
- focus engine scientifically blocked;
- further device calibration required.

Tie/near-tie software correctness does not prove cross-domain calibration.

## Step 23: Internal focus versus public display

Decide separately whether each domain can be used for:

1. public age estimate;
2. public product band;
3. internal training focus;
4. longitudinal raw metric tracking;
5. research-only storage.

Create a matrix:

| Domain/metric | Age display | Band display | Training focus | Raw trend | Research storage |

Allowed decisions:

- ready;
- provisional with caveat;
- hidden;
- blocked;
- device validation required;
- source remediation required.

# PART H — SOURCE/TRANSFORMATION REGISTER

## Step 24: Anchor-by-anchor provenance register

Create a complete register:

| Table | Anchor | Current value | Intended source value | Source page/table | Transformation | Evidence grade | Protocol match | Current use | Verdict |

Every current anchor must appear.

## Step 25: Transformation register

Create:

| Transformation ID | Input source data | Formula/logic | Code location | Documented? | Scientifically justified? | Verdict |

Include:

- sex pooling;
- normal-range midpoint use;
- age-bin midpoint;
- interpolation;
- extrapolation;
- clamping;
- inversion;
- source-age to displayed-age range;
- estimated flags;
- band derivation;
- cross-domain midpoint comparison.

## Step 26: Source-quality and reproducibility risks

Record:

- inaccessible tables;
- ambiguous editions;
- comments without citations;
- values not reproducible from source;
- undocumented estimates;
- protocol mismatch;
- mixed populations;
- copyright/licensing note;
- future source-link rot risk.

Do not make a legal conclusion; state practical documentation risk.

# PART I — CLAIM AND BETA POLICY DECISIONS

## Step 27: Domain verdict packet

For each domain provide:

### Strength / chair-rise

- source provenance;
- protocol match;
- anchor match;
- ages 45–59;
- sex pooling;
- public display;
- training focus;
- device dependency;
- recommendation.

### Balance / one-leg hold

- source provenance;
- protocol match;
- cap mismatch;
- anchor match;
- public display;
- training focus;
- device dependency;
- recommendation.

### Mobility / shoulder reach

- source provenance;
- protocol match;
- anchor match;
- public display;
- training focus;
- device dependency;
- recommendation.

### TUG

- source provenance;
- protocol match;
- supporting use;
- recommendation.

## Step 28: Controlled-beta display policy

Recommend exact controlled-beta policy for:

- primary result cards;
- optional detail rows;
- Progress;
- block reports;
- Home/Today;
- onboarding results;
- website claims.

Choose among:

- performance bands only;
- raw metrics only;
- beta age range for strength only;
- beta age ranges for multiple domains;
- no age ranges;
- internal focus without public age;
- focus based on revised bands.

Do not edit copy.

## Step 29: Snapshot/source-metadata policy

Audit current snapshot metadata.

Recommend whether future remediation must add:

- source-set ID;
- source citation IDs;
- transformation-policy version;
- table hash/fingerprint;
- protocol version;
- norm-population metadata;
- estimate/extrapolation flags by anchor;
- display-policy version.

Distinguish what must be frozen in snapshots from what belongs only in documentation.

## Step 30: Physical-device dependency map

For every potential claim, state the minimum device evidence still needed.

At minimum:

- chair-stand manual-count agreement;
- chair-height/setup sensitivity;
- rise-velocity repeatability;
- balance hold/touchdown repeatability;
- 12-second duration decision;
- shoulder-angle repeatability;
- clothing/occlusion sensitivity;
- phone-position sensitivity;
- hinge/body-unit repeatability;
- cross-domain focus stability.

Create:

| Claim/use | Source status | Device evidence needed | Minimum experiment | Beta blocker? |

Do not run the experiments in this task.

# PART J — FINDINGS AND REMEDIATION PLAN

## Step 31: Finding standard

Create findings:

- `F3DB-001`;
- `F3DB-002`;
- etc.

Each finding must include:

1. Priority:
   - P0;
   - P1;
   - P2;
   - P3.
2. Confidence.
3. Affected table/domain/claim.
4. Exact current behavior.
5. Source evidence.
6. Protocol evidence.
7. Transformation evidence.
8. User/trust impact.
9. Internal-focus impact.
10. Public-display impact.
11. Required remediation.
12. Device dependency.
13. Beta-blocker status.

Separate:

- source metadata gap;
- exact value mismatch;
- undocumented transformation;
- protocol mismatch;
- cross-domain calibration defect;
- product heuristic;
- device-validation dependency.

Do not inflate an inaccessible source into a code mismatch without evidence.

## Step 32: Product-decision packet

At minimum provide:

### Decision A: Strength age

Options:

- keep beta age range;
- band only;
- raw reps only;
- source-remediate first.

### Decision B: Balance age

Options:

- hide;
- replace table;
- change test duration later;
- band/raw seconds only.

### Decision C: Mobility age

Options:

- hide;
- source-remediate;
- band/raw degrees only;
- rename domain interpretation.

### Decision D: Cross-domain focus

Options:

- retain provisional age-midpoint focus;
- use product bands;
- use standardized within-domain scores;
- manual conservative focus;
- block until calibration.

### Decision E: Sex policy

Options:

- collect sex for norm selection;
- use conservative pooled values;
- remove sex-dependent age claims;
- use non-age bands.

Do not add a sex field in this task.

### Decision F: Ages 45–59

Options:

- hide extrapolated age ranges;
- label extrapolated;
- source a directly relevant dataset;
- use bands/raw metrics.

### Decision G: Snapshot provenance

What metadata must be frozen?

### Decision H: TUG

Keep hidden/supporting or remove from beta display?

### Decision I: Product bands

Can current bands remain?

### Decision J: Final beta claim posture

What can Pearl safely say before device validation?

For each decision include:

- current behavior;
- options;
- recommendation;
- reason;
- implementation impact;
- beta-blocker status.

## Step 33: Remediation plan

Do not implement.

Propose the smallest dependency-ordered future batches.

Possible structure:

### Stage 3D-B.1 — source metadata and unsupported-claim containment

Examples:

- add source register in code/docs;
- hide unsupported age ranges;
- add anchor provenance metadata;
- update snapshot source policy.

### Stage 3D-B.2 — norm/table correction

Only if exact source review supports corrected tables.

### Stage 3D-B.3 — cross-domain focus recalibration

Only if current age-midpoint comparison is not defensible.

### Physical-device validation

Required before relaxing provisional/hidden decisions.

For each batch:

| Batch | Findings | Likely files | Tests | Product decision | Device dependency | Beta blocker |

# REQUIRED REPORT STRUCTURE

Write:

```text
docs/audits/PEARL_LOGIC_AUDIT_STAGE_3D_B.md
```

with these sections:

1. Executive verdict.
2. Scope and read-only rules.
3. Initial Git status.
4. Baseline validation.
5. Current scoring/norm architecture.
6. Current norm-table inventory.
7. Current claim-surface inventory.
8. Source-verification methodology.
9. Evidence-grade definitions.
10. Complete bibliography/source register.
11. Chair-stand source verification.
12. Chair-stand protocol comparison.
13. Chair-stand anchor verification.
14. TUG source/protocol/anchor verification.
15. Single-leg source verification.
16. Single-leg protocol comparison.
17. Balance-cap mismatch analysis.
18. Shoulder-flexion source search and verification.
19. Shoulder anchor verification.
20. Product-band audit.
21. Cross-domain comparability audit.
22. Internal-focus versus public-display matrix.
23. Anchor-by-anchor provenance register.
24. Transformation register.
25. Snapshot/source-metadata audit.
26. Physical-device dependency map.
27. Domain verdict packet.
28. Controlled-beta display recommendation.
29. Finding register.
30. Product-decision packet.
31. Recommended remediation batches.
32. Final Stage 3D-B decisions.
33. Remaining overall beta blockers.
34. Final Git status.
35. Temporary-file cleanup confirmation.

## Acceptance criteria

Do not mark Stage 3D-B audit complete unless:

1. Every current norm table is inventoried.

2. Every current anchor is listed.

3. Every repository source claim is searched externally.

4. Every accessible exact primary table is inspected.

5. Inaccessible exact tables are labelled inaccessible, not inferred.

6. Full bibliographic metadata is recorded.

7. Exact page/table/figure references are recorded where available.

8. Source values and code values are compared anchor by anchor.

9. Every transformation is documented.

10. Sex pooling is audited.

11. Ages 45–59 extrapolation is audited.

12. The 12-second balance mismatch is mathematically demonstrated.

13. Shoulder-flexion source support is conclusively classified.

14. TUG source/protocol is classified.

15. Performance bands are classified as norms or heuristics.

16. Cross-domain comparability is explicitly assessed.

17. Internal focus and public age display receive separate verdicts.

18. Snapshot provenance metadata is assessed.

19. Physical-device dependencies are explicit.

20. Product decisions are concrete.

21. Only evidence-supported remediation is proposed.

22. Targeted tests pass.

23. `npm run verify:audio` passes.

24. Full Jest passes.

25. App typecheck passes.

26. Website typecheck passes.

27. Expo config passes.

28. `git diff --check` passes.

29. No production code, tests, configs, norms, copy, website code, dependencies, lockfiles, or assets are changed.

30. No source PDF or copyrighted table is committed.

31. No unrelated user work is reverted or overwritten.

32. No package install, staging, commit, branch, or push occurs.

33. Temporary downloads are deleted.

## Stage decisions

At the end of the report, state exactly one:

- `STAGE 3D-B AUDIT COMPLETE`
- `STAGE 3D-B AUDIT BLOCKED`

Also state exactly one:

- `NORM PROVENANCE VERIFIED`
- `NORM PROVENANCE PARTIALLY VERIFIED`
- `NORM PROVENANCE UNVERIFIED`

Also state one verdict for each:

- `CHAIR-STAND NORM VERIFIED`
- `CHAIR-STAND NORM PARTIALLY VERIFIED`
- `CHAIR-STAND NORM UNVERIFIED`

- `TUG NORM VERIFIED`
- `TUG NORM PARTIALLY VERIFIED`
- `TUG NORM UNVERIFIED`

- `SINGLE-LEG NORM VERIFIED`
- `SINGLE-LEG NORM PARTIALLY VERIFIED`
- `SINGLE-LEG NORM UNVERIFIED`

- `SHOULDER-FLEXION NORM VERIFIED`
- `SHOULDER-FLEXION NORM PARTIALLY VERIFIED`
- `SHOULDER-FLEXION NORM UNVERIFIED`

Also state exactly one:

- `CROSS-DOMAIN FOCUS CALIBRATION READY`
- `CROSS-DOMAIN FOCUS CALIBRATION PROVISIONAL`
- `CROSS-DOMAIN FOCUS CALIBRATION BLOCKED`

Also state exactly one for each user-facing age claim:

- `STRENGTH AGE CLAIM READY FOR CONTROLLED BETA`
- `STRENGTH AGE CLAIM BLOCKED`

- `BALANCE AGE CLAIM READY FOR CONTROLLED BETA`
- `BALANCE AGE CLAIM BLOCKED`

- `MOBILITY AGE CLAIM READY FOR CONTROLLED BETA`
- `MOBILITY AGE CLAIM BLOCKED`

Also state exactly one:

- `PERFORMANCE-BAND POLICY READY FOR CONTROLLED BETA`
- `PERFORMANCE-BAND POLICY REMEDIATION REQUIRED`

Also state exactly one:

- `STAGE 3D-B REMEDIATION REQUIRED`
- `NO STAGE 3D-B REMEDIATION REQUIRED`

Regardless of the source outcome, also state:

- `STAGE 4 REMEDIATION COMPLETE`
- `EXERCISE CATALOGUE SOFTWARE/CONTENT-READY FOR CONTROLLED BETA`
- `STAGE 5 REMEDIATION COMPLETE`
- `DYNAMIC WORKOUT GENERATION SOFTWARE-READY FOR CONTROLLED BETA`
- `OVERALL BETA RELEASE STILL BLOCKED`
- `BETA DEVICE VALIDATION REQUIRED`

Use `NO STAGE 3D-B REMEDIATION REQUIRED` only if:

- all source tables and transformations are directly verified;
- protocols are compatible;
- cross-domain calibration is defensible;
- current controlled-beta claim policy is supportable;
- no source/provenance P0/P1/P2 defect remains.

Do not declare overall beta readiness because physical-device validation remains required.

## Final Codex response

Return a concise summary containing:

- Report path.
- Whether repository code/tests/assets changed.
- External source lookup status.
- Primary sources inspected.
- Chair-stand source verdict.
- TUG source verdict.
- Single-leg source verdict.
- Shoulder-flexion source verdict.
- Number of anchors directly sourced/derived/estimated/unsupported.
- Sex-pooling verdict.
- Ages 45–59 verdict.
- Balance 12-second mismatch verdict.
- Shoulder table verdict.
- Performance-band verdict.
- Cross-domain focus verdict.
- Strength age-claim verdict.
- Balance age-claim verdict.
- Mobility age-claim verdict.
- Training-focus verdict.
- Number of findings by P0/P1/P2/P3.
- Top remediation requirements.
- Targeted validation result.
- Audio verification result.
- Full-suite result.
- App typecheck.
- Website typecheck.
- Expo config.
- `git diff --check`.
- `STAGE 3D-B AUDIT COMPLETE` or blocked.
- Norm provenance verdict.
- Per-table source verdicts.
- Cross-domain calibration verdict.
- `STAGE 3D-B REMEDIATION REQUIRED` or no remediation required.
- `STAGE 4 REMEDIATION COMPLETE`.
- `EXERCISE CATALOGUE SOFTWARE/CONTENT-READY FOR CONTROLLED BETA`.
- `STAGE 5 REMEDIATION COMPLETE`.
- `DYNAMIC WORKOUT GENERATION SOFTWARE-READY FOR CONTROLLED BETA`.
- `OVERALL BETA RELEASE STILL BLOCKED`.
- `BETA DEVICE VALIDATION REQUIRED`.
- Initial and final Git status.
- Temporary-file cleanup confirmation.
- Confirmation that no production code, tests, norms, copy, configs, dependencies, lockfiles, assets, source PDFs, package install, staging, commit, branch, or push occurred.
