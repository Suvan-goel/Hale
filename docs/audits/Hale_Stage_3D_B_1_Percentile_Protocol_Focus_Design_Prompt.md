You are carrying out Stage 3D-B.1 of Hale’s production-readiness work:

PERCENTILE / REFERENCE-BAND SCORING DESIGN, ASSESSMENT-PROTOCOL SPECIFICATION, SUGGESTED-FOCUS POLICY, SNAPSHOT MIGRATION, AND PRE-IMPLEMENTATION PILOT PLAN

This is a read-only product, scientific, UX, protocol, and architecture design stage.

Do not implement scoring changes, protocol changes, balance-duration changes, new profile fields, UI changes, snapshot migrations, tests, backend changes, or physical-device experiments in this task.

Do not begin the production implementation until this stage produces a complete signed-off specification and the product owner approves it.

## Product-owner direction already approved

The following direction is approved for design:

1. Hale should move away from exact “movement age” as the primary controlled-beta result.

2. Hale should preserve the motivating comparison experience through:
   - published-reference comparisons;
   - percentile or percentile-range outputs where the source actually supports them;
   - age-group reference ranges where exact percentile calculation is not scientifically supported;
   - raw metric results;
   - a personalised “suggested focus.”

3. Do not force every domain into an exact percentile if the source data cannot support one.

4. The balance test must be redesigned from the current 12-second ceiling to a protocol with a maximum hold of at least 45 seconds.

5. The chair-rise protocol should remain low friction:
   - do not require the user to measure a chair with a tape measure;
   - use a simple stable-chair setup confirmation;
   - suppress norm-relative claims when setup is uncertain rather than blocking the whole Check-Up.

6. Focus language should remain:
   - “Suggested focus”;
   - “clearest area to build”;
   - transparent product prioritisation.

   It must not claim:
   - scientifically proven weakest system;
   - diagnosis;
   - risk status;
   - biological or movement age.

7. Existing frozen movement-age snapshots must remain readable and immutable. New scoring/display policy must use new versions rather than rewriting old history.

8. Longitudinal “improved,” “declined,” “younger,” or meaningful-change claims remain blocked until physical-device repeatability and minimum-detectable-change work is complete.

## Why Stage 3D-B.1 is required

Stage 3D-B established that the current normative architecture cannot support controlled-beta movement-age claims:

- current chair-stand provenance is only partially verified;
- ages 45–59 and sex pooling are unresolved in the existing table;
- the current 12-second balance test is mathematically incompatible with the current norm scale;
- the current shoulder-flexion age table has no exact verified source;
- current cross-domain focus selection compares incompatible age-inversion scales;
- current Strong / Building / Starting point bands inherit those unsupported age outputs.

A deeper follow-up analysis found a viable alternative direction:

- a modern age- and sex-specific 30-second sit-to-stand reference source may support percentile or centile comparison across Hale’s target ages;
- a 45-second one-leg stance reference protocol may support age-group comparison if Hale’s protocol is aligned;
- a large age/sex-stratified active shoulder-flexion source may support reference-range comparison;
- exact inverse ages still imply false precision and should not remain the headline.

Stage 3D-B.1 must turn this direction into an exact, implementable product specification.

## Required prior reading

Read these documents in full before analysis:

- docs/audits/HALE_LOGIC_AUDIT_STAGE_3D_B.md
- docs/audits/HALE_LOGIC_AUDIT_STAGE_3D.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_A.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_C.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_D.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_3C_1.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3B.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_2A_1.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4G_R.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4F_R_1.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5H.md

Also inspect:

- docs/decisions.md;
- current scoring/norm comments;
- current assessment instructions and result screens;
- current profile fields, including age and any sex/gender field;
- current snapshot, sync, restore, focus, and report tests.

Treat the current working tree as the source of truth.

## External source lookup is explicitly authorised

Use internet/source lookup only for the narrow purpose of verifying the candidate normative/reference datasets and exact protocols.

Prefer:

- primary peer-reviewed papers;
- publisher full text;
- PubMed;
- DOI/Crossref;
- official institutional repositories;
- official calculators or supplements provided by the paper authors/publisher;
- official manuals.

Do not use as evidence:

- blogs;
- commercial health/fitness sites;
- AI summaries;
- unsourced norm tables;
- Wikipedia;
- search snippets;
- unauthorised copies.

If an exact table, coefficient set, calculator method, supplement, or protocol is inaccessible:

- do not bypass access controls;
- do not reconstruct it from a secondary website;
- state exactly what was and was not verified;
- do not recommend an exact percentile implementation that cannot be reproduced lawfully.

Temporary source files may exist only under:

```text
/tmp/hale-stage3db1/
```

Delete them before finishing.

Do not commit source PDFs, table screenshots, or copyrighted source material.

## Candidate sources that must be verified, not assumed

At minimum investigate the exact primary sources behind these candidates:

### Chair rise

A modern age- and sex-specific 30-second sit-to-stand normative/centile source covering adults through Hale’s 45–65 target range, including the Warden et al. source identified in the follow-up analysis.

Verify whether it provides:

- exact centile curves;
- LMS or equivalent parameters;
- an official calculator;
- reproducible coefficients;
- age and sex coverage;
- licensing/attribution conditions;
- exact protocol.

### Balance

The Springer et al. unipedal-stance normative source covering adults across age groups, with a 45-second maximum and multiple trials.

Verify:

- exact eyes-open protocol;
- leg choice;
- arm position;
- number of trials;
- best versus mean;
- maximum duration;
- rest;
- sex effects;
- age groups;
- whether exact percentiles exist or only means/standard deviations/ranges.

Also compare Bohannon’s source where relevant, but do not mix protocols or tables.

### Shoulder reach

The Gill et al. community active shoulder-ROM study and any other directly relevant primary source.

Verify:

- active versus passive flexion;
- standing/seated position;
- side;
- plane;
- instrument;
- age/sex tables;
- reported statistic;
- whether exact percentile computation is possible;
- whether only reference ranges/medians are defensible.

Do not force a source to fit Hale’s existing table.

## Primary objectives

Stage 3D-B.1 must produce a complete specification for:

1. The result experience:
   - Movement Profile;
   - raw metrics;
   - percentile range where justified;
   - reference range where justified;
   - setup/protocol confidence;
   - suggested focus.

2. The exact controlled-beta assessment protocol for:
   - 30-second chair rise;
   - one-leg balance;
   - shoulder reach.

3. The lowest-friction chair setup compatible with defensible reference comparison.

4. The 45-second balance trial policy, including attempt count and adaptive stopping.

5. The shoulder-side/trial protocol.

6. Reference group and sex policy.

7. Percentile/reference-band mathematics.

8. Protocol-eligibility and claim-suppression rules.

9. Suggested-focus policy using mixed reference outputs.

10. Snapshot, version, sync, restore, and legacy-display policy.

11. Exact user-facing claim boundaries.

12. A small pre-implementation protocol-usability pilot.

13. A later post-implementation device-agreement pilot.

14. A dependency-ordered implementation plan.

## Output file

Create exactly one new repository file:

```text
docs/audits/HALE_PERCENTILE_SCORING_PROTOCOL_DESIGN_STAGE_3D_B_1.md
```

Do not edit prior reports.

Do not create implementation files, source tables, prototype screens, spreadsheets, scripts, tests, or code in the repository.

Temporary read-only probes and source files may exist only under `/tmp/hale-stage3db1/` and must be removed.

## Non-negotiable read-only rules

1. Do not modify production code.

2. Do not modify tests or fixtures.

3. Do not modify scoring tables or formulas.

4. Do not modify assessment durations or state machines.

5. Do not modify profile fields.

6. Do not modify snapshot schemas.

7. Do not modify copy or UI.

8. Do not modify backend schemas or payloads.

9. Do not modify app or website code.

10. Do not install packages.

11. Do not modify lockfiles.

12. Do not stage, commit, branch, or push.

13. Do not start physical-device testing.

14. Do not claim exact percentiles from means/SD unless the distributional assumption is explicitly justified and approved.

15. Do not call a broad age-group comparison a percentile.

16. Do not imply that higher shoulder ROM is always better.

17. Do not infer meaningful improvement from cross-sectional norms.

18. Do not claim the suggested focus is a diagnosis or scientifically proven weakest domain.

## Working-tree safety

Before analysis:

```bash
git status --short --untracked-files=all
git diff --name-only
git diff --stat
```

Record exact output in the report.

Rules:

- Treat every existing change as user-owned.
- Inspect current diffs in materially referenced files.
- Do not revert, overwrite, format, move, or delete unrelated work.
- Do not inspect or expose `.env` values.
- Do not alter the 88 safety MP3 assets or manifests.
- Do not modify or share font files.
- Run the same Git commands at the end.
- The only intended repository change is the new Stage 3D-B.1 report.

## Baseline validation

Run a targeted existing test slice covering:

- scoring input validation;
- scoring;
- norm inversion;
- score snapshots;
- focus selection;
- assessment eligibility;
- chair-stand movement;
- balance movement;
- shoulder movement;
- Check-Up controller;
- Results/Progress view models;
- reports;
- copy guardrails;
- sync/restore;
- Stage 4 closure;
- Stage 5H lifecycle.

Then run:

```bash
npm run verify:audio
npm test -- --runInBand
npm run typecheck
npm --prefix website run typecheck
npx --no-install expo config --type public
git diff --check
```

Record exact counts and warnings.

Do not run an Expo export unless repository instructions require it; this task is report-only.

# PART A — CURRENT PRODUCT AND CODE CONTRACT

## Step 1: Reconstruct the current assessment-to-result path

Inspect at minimum:

- src/scoring/norms.ts
- src/scoring/scoring.ts
- src/scoring/scoringInputValidation.ts
- src/scoring/scoreSnapshot.ts
- src/scoring/versions.ts
- src/scoring/focusSelection.ts
- src/movements/definitions/chairStand.ts
- src/movements/definitions/balanceLadder.ts
- src/movements/definitions/shoulderFlexion.ts
- src/checkup/checkup.ts
- src/assessment/sessionController.ts
- src/haleFlow/assessments.ts
- src/haleFlow/assessmentEligibility.ts
- src/haleFlow/progressViewModel.ts
- src/haleFlow/reports.ts
- Results, onboarding results, Progress, Home, and block-report screens
- profile age/sex fields
- sync and restore services.

Trace:

```text
profile/reference inputs
-> movement protocol
-> raw metric
-> protocol validity
-> norm/reference transform
-> display result
-> suggested focus
-> frozen snapshot
-> block creation
-> report/re-test
```

Document all current assumptions that the new design must replace or preserve.

## Step 2: Inventory the current Check-Up duration and friction

Reconstruct:

- current number of tests;
- instructions;
- setup transitions;
- countdowns;
- retries;
- timeouts;
- balance stage durations;
- total best-case and realistic duration;
- where a 45-second balance protocol would add time.

Estimate the total Check-Up time for candidate balance protocols.

Do not assume users will tolerate three 45-second trials without analysing total friction.

# PART B — CLAIM TAXONOMY

## Step 3: Define claim types precisely

Use these distinct claim types:

### Raw result

Examples:

- 16 chair rises in 30 seconds.
- 28-second one-leg hold.
- 154° shoulder reach.

### Exact percentile

Example:

- 53rd percentile.

Allowed only when an exact reproducible source model supports it and protocol eligibility passes.

### Percentile range

Example:

- Around the 40th–60th percentile.

Preferred when source/model is valid but home setup and camera uncertainty make exact precision misleading.

### Age-group reference range

Example:

- Within the published reference range for adults aged 50–59.

Used when the source supports grouped reference comparison but not a defensible exact percentile.

### Hale task band

Example:

- Full 45-second hold completed.
- Building the hold.
- Starting point.

Must be labelled as Hale’s product interpretation, not a population norm.

### Suggested focus

A transparent prioritisation heuristic based on validated result categories and life goal.

### Longitudinal change

Separate from all cross-sectional reference claims and blocked until device repeatability/MDC exists.

For every domain, state which claim types are allowed, provisional, or blocked.

## Step 4: Define display confidence states

Design a typed conceptual policy such as:

```ts
type ReferenceClaimEligibility =
  | 'reference_eligible'
  | 'raw_only_setup_uncertain'
  | 'raw_only_protocol_incomplete'
  | 'raw_only_tracking_uncertain'
  | 'raw_only_reference_unavailable'
  | 'invalid_measurement';
```

Specify:

- trigger;
- displayed result;
- suppressed result;
- user recovery;
- focus eligibility;
- snapshot metadata.

Do not implement it.

# PART C — CHAIR-RISE PROTOCOL AND SCORING DESIGN

## Step 5: Verify the candidate chair reference model

Determine:

- exact source;
- exact protocol;
- age range;
- sex/reference grouping;
- sample size;
- statistic/model;
- coefficients;
- official calculator;
- reproducibility;
- legal/attribution constraints.

Answer explicitly:

- Can Hale compute exact percentiles locally from published parameters?
- Can Hale lawfully reproduce the required parameters?
- Is an official calculator available but non-reproducible?
- Does the source support exact centiles, only centile curves, or only grouped values?

Do not recommend implementation until the calculation can be reproduced and tested.

## Step 6: Lock the low-friction chair protocol candidate

Use this candidate as the default design unless source review proves it incompatible:

### User setup

> Use a firm, stable dining chair without wheels. Place it against a wall. The seat should be roughly level with the crease behind your knees.

### Confirmation

> Is the seat roughly knee height?

Options:

- Yes.
- I’m not sure.

### Movement

- 30 seconds.
- Feet flat.
- Arms crossed.
- Stand fully upright.
- Sit with control.
- One quick practice repetition.
- Count completed full stands.
- Define treatment of a final partial repetition explicitly.

### Norm-claim rule

- setup confirmed and protocol valid -> reference comparison may be shown;
- setup uncertain -> raw repetitions and personal baseline only;
- hand push-off -> raw repetitions only;
- invalid tracking -> retry/raw-only according to evidence quality.

This design deliberately avoids tape-measure friction.

Audit whether any element can be relaxed without breaking source compatibility.

## Step 7: Chair percentile/display design

Compare:

1. Exact percentile.
2. Five-point or ten-point rounded percentile.
3. Broad percentile range, such as 40th–60th.
4. Reference category only.
5. Age-group reference range.

Recommend one controlled-beta headline and one detail view.

Address:

- one-repetition sensitivity;
- chair-height uncertainty;
- age interpolation;
- reference-sex input;
- ceiling/floor;
- users outside source ages;
- setup uncertainty;
- camera count uncertainty.

## Step 8: Chair result card specification

Provide exact example states:

- norm eligible;
- setup uncertain;
- hand push-off detected;
- camera count uncertain;
- outside source age range;
- high result;
- low result.

Example direction:

```text
Chair-rise capacity
16 rises in 30 seconds
Around the 40th–60th percentile for your reference group
```

Caveat:

```text
Based on a similar published test setup. Hale’s camera estimate is not a medical assessment.
```

Do not use “Strength age.”

# PART D — BALANCE PROTOCOL AND SCORING DESIGN

## Step 9: Verify the 45-second normative protocol

Determine exactly:

- eyes open;
- arm position;
- chosen/dominant/preferred leg;
- footwear;
- number of trials;
- maximum duration;
- best versus mean;
- rest;
- termination/touchdown rules;
- support contact;
- age groups;
- sex handling;
- source statistics;
- exact percentiles versus grouped reference values.

Do not assume a percentile is available if the source reports only means or ranges.

## Step 10: Compare balance attempt policies

Evaluate at least:

### Option A — one 45-second trial

Lowest friction, weakest source match.

### Option B — two valid 45-second trials, best score

Moderate friction.

### Option C — three valid 45-second trials, best score

Closest to a best-of-three source if verified.

### Option D — adaptive best-of-three

Candidate:

1. Trial 1 up to 45 seconds.
2. If 45 seconds is reached, stop.
3. Otherwise complete up to two further valid trials.
4. Use the best valid trial.
5. A tracking-invalid trial does not consume one of the valid attempts.
6. Use a specified rest period.

For each calculate:

- best-case duration;
- typical duration;
- worst-case duration;
- source compatibility;
- reliability;
- safety;
- user friction;
- implementation complexity.

Recommend one protocol for the pre-implementation pilot and one likely production protocol.

## Step 11: Lock balance movement details

Specify:

- leg choice and how it is persisted for re-test;
- arm position;
- support within reach;
- footwear/surface;
- eyes open;
- start definition;
- touchdown definition;
- support-touch handling;
- tracking interruption;
- maximum duration;
- rest;
- attempt count;
- best/mean result;
- same-side re-test policy.

Determine whether both legs are needed. Prefer the lowest-friction defensible design.

## Step 12: Balance claim design

Decide what the verified source supports:

- exact percentile;
- broad percentile range;
- age-group reference range;
- task band only.

If no exact percentile model exists, do not create one by assuming a normal distribution from mean/SD without explicit scientific approval.

Provide result examples for:

- full 45 seconds;
- within reference range;
- below reference range;
- tracking-invalid;
- fewer than required valid trials;
- setup uncertainty.

Do not use “Balance age.”

# PART E — SHOULDER-REACH PROTOCOL AND SCORING DESIGN

## Step 13: Verify the exact shoulder reference table

Determine:

- active versus passive flexion;
- standing versus seated;
- side;
- arm path/plane;
- elbow;
- palm orientation;
- trunk compensation;
- instrument;
- number of trials;
- reported statistic;
- age and sex grouping;
- exact percentile availability.

Verify whether the source supports:

- exact percentile;
- grouped percentile/range;
- median/interquartile range;
- only broad reference comparison.

## Step 14: Compare shoulder-side policies

Evaluate:

### Option A — fixed right side

Lowest complexity, may not reflect individual limitations.

### Option B — user-selected side, persisted for re-test

Low friction but source comparability must be assessed.

### Option C — both sides, use lower result

More comprehensive, higher friction, may overstate limitation.

### Option D — both sides, report separately

Most informative, highest friction.

Recommend the controlled-beta policy.

Specify how prior injury/pain affects the test and claim eligibility without asking for diagnosis.

## Step 15: Shoulder result design

Provide exact card states:

- within age-group reference range;
- below range;
- above range;
- setup/tracking uncertain;
- pain-limited;
- outside source age;
- no reference-sex input.

Do not label “above range” as automatically better.

Use a name such as:

- Shoulder reach;
- Active shoulder reach.

Do not use “Mobility age” when shoulder flexion is the primary metric.

# PART F — REFERENCE SEX AND PROFILE INPUT POLICY

## Step 16: Audit current profile data

Determine whether Hale currently stores:

- date of birth or age;
- gender;
- sex assigned at birth;
- no sex field.

Audit local/backend/privacy impact of adding any new field later.

Do not implement it.

## Step 17: Compare reference-group policies

Evaluate:

### Option A — collect “reference sex” for norm comparison

Explain wording, optionality, privacy, and UX.

### Option B — use pooled references only where published

No ad-hoc pooling.

### Option C — use the overlapping/conservative range of male/female references

May support broad bands, not exact percentile.

### Option D — suppress the norm claim when required reference input is unavailable

Raw result remains.

Recommend one policy per domain.

Do not silently use an inferred sex.

## Step 18: Age policy

Specify:

- exact age versus age band;
- minimum/maximum source age;
- birthdays and interpolation;
- outside-range behavior;
- whether age is required for reference claims;
- whether raw results remain available without age.

# PART G — PERCENTILE / REFERENCE MATHEMATICS

## Step 19: Define calculation classes

For each domain, classify the future calculation as one of:

- exact published centile model;
- direct lookup of published quantile/range;
- interpolation between published quantiles;
- product-created broad reference category;
- no norm calculation.

Do not mix these categories in code or copy.

## Step 20: Percentile range policy

If chair centiles are reproducible, design:

- rounding;
- minimum display width;
- boundary behavior;
- extreme-value handling;
- age interpolation;
- reference-sex handling;
- uncertainty widening.

Candidate controlled-beta display:

```text
Around the 40th–60th percentile
```

rather than:

```text
53rd percentile
```

Specify exact rules that make this deterministic.

## Step 21: Reference-range policy

For grouped balance/shoulder sources, specify:

- source statistic used;
- below/within/above logic;
- whether “within” uses:
  - published quantiles;
  - published range;
  - confidence interval;
  - median band;
  - another direct source construct.

Do not invent a “normal range” from mean ± SD unless explicitly justified and approved.

## Step 22: Monotonicity and metric direction

Specify:

- chair: higher is generally better within this task;
- balance: longer is generally better up to test ceiling;
- shoulder: more is not automatically better above the reference range.

Prevent one generic higher-is-better percentile interpretation from being applied blindly.

## Step 23: Missing and boundary behavior

Specify:

- source-age floor/ceiling;
- metric floor/ceiling;
- exact test ceiling;
- tied values;
- values beyond source table;
- invalid protocol;
- incomplete attempts;
- hand support;
- setup uncertainty;
- tracking uncertainty.

# PART H — SUGGESTED-FOCUS POLICY

## Step 24: Do not assume exact percentile comparability

Audit whether all three domains can support the same kind of reference statistic.

Likely possibilities include:

- chair percentile range;
- balance age-group reference category;
- shoulder age-group reference category.

The focus policy must work even when outputs are mixed.

## Step 25: Compare focus-policy options

Evaluate:

### Option A — lowest exact percentile

Use only if all domains have validated comparable percentiles.

### Option B — ordinal reference category

Example ordering:

1. below reference;
2. within reference;
3. above/reference ceiling.

If exactly one domain is below reference, suggest it.

### Option C — source-specific deficit severity

Requires explicit calibrated distance-to-boundary and may still be incomparable.

### Option D — goal-led focus with norm veto

Use life goal unless one domain is clearly below reference.

### Option E — balanced block when evidence is close or incomplete

Recommend a controlled-beta policy.

## Step 26: Approved framing

The future UI must say:

- Suggested focus.
- Clearest area to build from today’s Check-Up.
- Based on your results and goal.

It must not say:

- weakest system;
- body age;
- scientifically weakest;
- diagnosis;
- fall risk;
- impairment.

## Step 27: Tie, near-tie, and incomplete-domain behavior

Specify:

- one domain clearly below reference;
- two domains below reference;
- all within reference;
- all above/reference-complete;
- one domain raw-only;
- two domains raw-only;
- contradictory or invalid tests;
- re-test focus preservation;
- life-goal tie break;
- balanced block.

Do not reuse the current 5-year age-midpoint near-tie rule unless the new outputs justify it.

## Step 28: Focus policy and block creation

Specify:

- what minimum evidence is required to create a block;
- whether a block can be created with raw-only results;
- when focus is goal-led;
- whether focus may switch after re-test;
- how focus provenance is frozen in the assessment/block.

# PART I — SNAPSHOT, VERSION, SYNC, AND LEGACY POLICY

## Step 29: Design a new version boundary

Recommend new values or version-bump rules for:

- scoring version;
- norm/reference version;
- score snapshot schema;
- protocol version;
- display policy version;
- focus policy version.

Do not assign version numbers blindly if current versioning conventions require inspection.

## Step 30: Design the future snapshot contract

Conceptually include:

```ts
type ReferenceResultSnapshot = {
  metricId: string;
  rawValue: number;
  rawUnit: string;

  protocolId: string;
  protocolVersion: number;
  protocolEligibility: ReferenceClaimEligibility;

  referenceSourceId?: string;
  referenceSourceVersion?: string;
  referencePopulation?: string;
  referenceAge?: number;
  referenceSexBasis?: string;

  resultKind:
    | 'percentile_range'
    | 'reference_range'
    | 'hale_task_band'
    | 'raw_only';

  percentileLow?: number;
  percentileHigh?: number;
  referenceCategory?: string;

  sourceFingerprint?: string;
  transformationFingerprint?: string;
  displayPolicyVersion: number;
};
```

Adapt to current architecture.

Specify exact required/optional fields and fail-closed rules.

## Step 31: Source/protocol metadata

Determine what must be frozen in every new snapshot:

- source ID;
- citation/version;
- source population;
- protocol ID/version;
- transformation ID/version;
- source/table fingerprint;
- sex/reference basis;
- age basis;
- estimate/uncertainty flags;
- setup confirmation;
- tracking confidence;
- claim eligibility;
- display policy;
- focus policy.

## Step 32: Legacy snapshot behavior

Specify:

- old movement-age snapshots remain readable;
- no recomputation;
- clear `legacy_movement_age` display policy;
- whether old age ranges remain visible in history;
- whether they should be labelled legacy/beta estimate;
- old blocks/reports remain stable;
- new re-tests use the new policy;
- comparisons across old/new policies must not fabricate trends.

## Step 33: Sync/restore behavior

Specify:

- compact backend fields;
- sanitization;
- no source PDF/text payloads;
- no raw video/landmarks;
- source metadata round-trip;
- unsupported future policy fail-closed;
- old device/new device behavior.

# PART J — USER EXPERIENCE SPECIFICATION

## Step 34: Define the new result hierarchy

Candidate controlled-beta hierarchy:

```text
Your Movement Profile

Chair-rise capacity
16 rises in 30 seconds
Around the 40th–60th percentile for your reference group

One-leg balance
28 seconds
Within the published reference range for adults in your age group

Shoulder reach
154°
Within the published reference range for adults in your age group

Suggested focus: Balance
This was the clearest area to build from today’s Check-Up.
```

Determine the exact hierarchy.

## Step 35: Define every result state

Create a comprehensive state matrix:

| Domain | Raw result | Reference-eligible | Setup uncertain | Tracking uncertain | Protocol incomplete | Outside reference age | Pain-limited | Invalid |

For each provide:

- headline;
- secondary text;
- detail text;
- focus eligibility;
- retest behavior;
- CTA.

## Step 36: Caveat hierarchy

Design concise caveats at:

- card level;
- Check-Up summary level;
- Learn/methodology detail;
- privacy/science detail if needed.

Avoid putting a long disclaimer on every card.

Approved intent:

> Based on published reference groups using a similar test setup. Hale’s camera results are beta estimates, not medical assessments.

## Step 37: Progress and block-report behavior

Until device repeatability is known:

- show raw current and previous values;
- show neutral difference;
- do not say improved/declined;
- do not interpret percentile movement as true change;
- do not show “younger.”

Specify the exact future transition after device-validation thresholds become available.

# PART K — FRICTION AND CHECK-UP DURATION

## Step 38: Model Check-Up duration

For each candidate protocol, calculate:

- instructions;
- setup;
- practice;
- active test time;
- rest;
- retries;
- transitions;
- best case;
- median plausible case;
- worst reasonable case.

Compare:

- current Check-Up;
- one 45-second balance trial;
- two-trial balance;
- three-trial balance;
- adaptive best-of-three.

Set a target total duration and acceptable worst case.

## Step 39: Friction-reduction rules

Evaluate:

- early stop at 45 seconds;
- skip later balance attempts after ceiling;
- concise repeated instructions;
- reuse setup where possible;
- no tape measure;
- one chair confirmation;
- persist balance leg;
- automatic invalid-trial retry;
- user-controlled rest continuation;
- no repeated camera tutorial.

Do not trade away protocol validity silently.

# PART L — PRE-IMPLEMENTATION PILOT PLAN

## Step 40: Define the pilot purpose

The first pilot is not a scientific validation study.

Its purpose is to test:

- protocol comprehension;
- setup feasibility;
- user burden;
- Check-Up duration;
- balance-attempt tolerance;
- chair confirmation usability;
- shoulder-side policy;
- likely tracking constraints;
- wording trust.

## Step 41: Define pilot population

Recommend:

- 8–12 adults;
- approximately ages 45–65;
- a spread of ages;
- a mix of reference-sex groups if that input is likely needed;
- a mix of activity/confidence levels;
- no recruitment based on known diagnosis.

Specify exclusion/stop rules in non-medical terms and when to stop the session.

## Step 42: Define pilot protocol

Use a manual observer/stopwatch protocol before production implementation.

Include:

### Chair

- low-friction candidate protocol;
- observer count;
- chair type/approximate knee-height confirmation;
- user comprehension;
- whether hands were used;
- setup time.

### Balance

Compare the candidate policies in a low-burden way.

At minimum collect:

- first-trial result;
- whether second/third attempts were accepted;
- best-of-up-to-three;
- total time;
- rest preference;
- perceived burden;
- chosen leg consistency;
- ceiling reaches;
- tracking-observability notes.

Do not expose participants to excessive repetition merely for the pilot.

### Shoulder

Compare the recommended side/trial options.

Collect:

- setup comprehension;
- side choice;
- repeated result spread;
- torso compensation observations;
- total time.

## Step 43: Pilot data sheet

Define every field to record.

At minimum:

- participant ID;
- age band;
- optional reference-sex group;
- protocol version;
- chair setup confidence;
- chair type;
- chair reps observer;
- hand use;
- balance leg;
- each valid balance trial;
- invalid trial reason;
- shoulder side/trials;
- completion time by section;
- total time;
- instruction repeats;
- tracking issue notes;
- discomfort/stop;
- perceived burden;
- trust/comprehension response;
- preference between result wordings.

Do not create the spreadsheet in this task.

## Step 44: Pilot success criteria

Propose explicit go/revise/stop thresholds.

At minimum consider:

- Check-Up completion rate;
- median total duration;
- 90th-percentile duration;
- balance trial abandonment;
- percentage accepting second/third trial;
- chair setup-confirmation clarity;
- instruction-repeat rate;
- shoulder-side confusion;
- safety-stop incidence;
- result-copy comprehension;
- trust rating.

Do not confuse usability thresholds with device-accuracy thresholds.

## Step 45: Result-copy interview

Test participant understanding of:

- exact percentile;
- percentile range;
- reference range;
- Hale task band;
- suggested focus;
- beta-estimate caveat.

Ask what they think each claim means.

Identify wording that users misread as diagnosis or guarantee.

# PART M — POST-IMPLEMENTATION DEVICE PILOT PLAN

## Step 46: Define the later device-agreement pilot

After feature-flag implementation, specify a separate pilot measuring:

- app versus human chair count;
- app versus stopwatch balance time;
- app versus reference shoulder angle where feasible;
- within-session repeatability;
- between-day repeatability;
- tracking failure;
- setup sensitivity;
- percentile-band stability;
- focus stability.

Do not run it now.

## Step 47: Define minimum outputs

Recommend future metrics such as:

- exact agreement;
- mean absolute error;
- Bland–Altman or equivalent agreement analysis;
- intraclass correlation where appropriate;
- test–retest error;
- standard error of measurement;
- minimum detectable change;
- band-flip rate;
- focus-flip rate.

Do not prescribe a method unsupported by sample size; state what requires a statistician/domain review.

# PART N — IMPLEMENTATION PLAN

## Step 48: Dependency-ordered implementation batches

Do not implement.

Propose exact batches such as:

### Stage 3D-B.2A — protocol and assessment state-machine implementation

- 45-second balance;
- adaptive attempts;
- chair setup confirmation;
- shoulder protocol.

### Stage 3D-B.2B — source/reference engine

- reproducible source models;
- percentile/reference-range transforms;
- protocol eligibility;
- tests.

### Stage 3D-B.2C — snapshot/version/sync migration

- new snapshot fields;
- immutable legacy handling;
- restore/sync.

### Stage 3D-B.2D — Movement Profile UI and focus policy

- result cards;
- suggested focus;
- Progress/report behavior;
- copy guardrails.

### Stage 3D-B.2E — feature flag and QA harness

- internal-only rollout;
- no public claims until device validation.

For each batch provide:

| Batch | Decisions required | Likely files | Tests | Source dependency | Pilot dependency | Beta blocker |

## Step 49: Feature-flag plan

Recommend a non-user-controlled feature flag for the new system during implementation.

Requirements:

- old/new snapshot paths remain distinguishable;
- no user can switch scoring policy mid-Check-Up;
- no backend restore can activate an internal policy;
- frozen result records retain their policy;
- safe rollback.

## Step 50: Verification plan

Define required tests before implementation sign-off:

- source-anchor tests;
- protocol eligibility;
- percentile/range boundaries;
- sex/age handling;
- 45-second state machine;
- adaptive attempts;
- tracking interruptions;
- focus policy;
- snapshot round-trip;
- legacy/new comparison;
- copy guardrails;
- property tests;
- Stage 4/5 regression.

# REQUIRED DECISION PACKET

## Step 51: Product decisions

For each provide:

- options;
- recommendation;
- rationale;
- friction;
- scientific strength;
- implementation impact;
- pilot dependency;
- beta-blocker status.

At minimum:

1. Chair exact percentile versus percentile range.
2. Chair reference-sex policy.
3. Chair setup eligibility.
4. Balance one, two, three, or adaptive trials.
5. Balance leg policy.
6. Balance exact percentile versus reference range.
7. Shoulder side policy.
8. Shoulder percentile versus reference range.
9. Suggested-focus algorithm.
10. All-results-within-range behavior.
11. Raw-only result behavior.
12. Legacy movement-age display.
13. Total Check-Up duration target.
14. Pilot success thresholds.
15. Implementation versioning.
16. Public beta claim posture.

# REQUIRED REPORT STRUCTURE

Write:

```text
docs/audits/HALE_PERCENTILE_SCORING_PROTOCOL_DESIGN_STAGE_3D_B_1.md
```

with these sections:

1. Executive recommendation.
2. Scope and read-only rules.
3. Initial Git status.
4. Baseline validation.
5. Current assessment/result architecture.
6. Current Check-Up friction model.
7. Claim taxonomy.
8. Reference-claim eligibility states.
9. Candidate source register.
10. Chair source/model verification.
11. Chair protocol specification.
12. Chair calculation/display specification.
13. Balance source verification.
14. Balance trial-option comparison.
15. Balance protocol specification.
16. Balance calculation/display specification.
17. Shoulder source verification.
18. Shoulder-side/trial comparison.
19. Shoulder protocol specification.
20. Shoulder calculation/display specification.
21. Reference-sex policy.
22. Age policy.
23. Percentile/reference mathematics.
24. Missing/boundary behavior.
25. Suggested-focus policy.
26. Focus edge cases.
27. Block-creation implications.
28. Snapshot/version contract.
29. Legacy snapshot policy.
30. Sync/restore policy.
31. Movement Profile UX specification.
32. Result-state matrix.
33. Caveat hierarchy.
34. Progress/report behavior.
35. Check-Up duration model.
36. Friction-reduction policy.
37. Pre-implementation pilot purpose/population.
38. Pilot protocol.
39. Pilot data fields.
40. Pilot success criteria.
41. Result-copy interview plan.
42. Post-implementation device pilot.
43. Implementation batches.
44. Feature-flag plan.
45. Verification plan.
46. Product-decision packet.
47. Remaining unknowns.
48. Final stage decisions.
49. Final Git status.
50. Temporary-file cleanup.

## Acceptance criteria

Do not mark Stage 3D-B.1 complete unless:

1. Every candidate source is directly verified as far as legally accessible.

2. Exact percentile feasibility is separately judged for each domain.

3. No percentile is inferred from mean/SD without explicit justification.

4. The chair protocol is low friction and norm-eligibility rules are exact.

5. The balance protocol has a 45-second maximum.

6. One/two/three/adaptive balance attempts are compared quantitatively.

7. Balance leg, rest, termination, retry, and re-test policies are explicit.

8. Shoulder side/trial policy is explicit.

9. Reference-sex policy is explicit.

10. Age/out-of-range behavior is explicit.

11. Percentile range/reference-range mathematics are deterministic.

12. Setup/tracking/protocol uncertainty suppresses claims safely.

13. The suggested-focus policy works with mixed result types.

14. The suggested-focus policy uses life goals for close/incomplete evidence.

15. Snapshot/version/source/protocol metadata are fully specified.

16. Legacy movement-age snapshots remain immutable.

17. The complete Movement Profile UX is specified.

18. Progress/change claims remain blocked pending device evidence.

19. A realistic Check-Up duration model is included.

20. A concrete 8–12 person pre-implementation pilot is specified.

21. Pilot success thresholds are explicit.

22. A later device-agreement pilot is specified.

23. Implementation is divided into dependency-ordered batches.

24. Source, product, pilot, and device dependencies are distinguished.

25. Targeted tests pass.

26. `npm run verify:audio` passes.

27. Full Jest passes.

28. App typecheck passes.

29. Website typecheck passes.

30. Expo config passes.

31. `git diff --check` passes.

32. No production code, tests, norms, protocols, profile fields, snapshots, copy, website code, dependencies, lockfiles, or assets are changed.

33. No source PDFs are committed.

34. No package install, staging, commit, branch, or push occurs.

35. Temporary files are removed.

## Stage decisions

At the end of the report, state exactly one:

- `STAGE 3D-B.1 DESIGN COMPLETE`
- `STAGE 3D-B.1 DESIGN BLOCKED`

Also state exactly one:

- `CHAIR REFERENCE CLAIM DESIGN READY`
- `CHAIR REFERENCE CLAIM DESIGN BLOCKED`

Also state exactly one:

- `BALANCE 45-SECOND PROTOCOL DESIGN READY`
- `BALANCE 45-SECOND PROTOCOL DESIGN BLOCKED`

Also state exactly one:

- `SHOULDER REFERENCE CLAIM DESIGN READY`
- `SHOULDER REFERENCE CLAIM DESIGN BLOCKED`

Also state exactly one:

- `SUGGESTED-FOCUS POLICY DESIGN READY`
- `SUGGESTED-FOCUS POLICY DESIGN BLOCKED`

Also state exactly one:

- `MOVEMENT PROFILE IMPLEMENTATION SPEC READY`
- `MOVEMENT PROFILE IMPLEMENTATION SPEC BLOCKED`

Also state exactly one:

- `PRE-IMPLEMENTATION PILOT PLAN READY`
- `PRE-IMPLEMENTATION PILOT PLAN BLOCKED`

Also state:

- `IMPLEMENTATION NOT STARTED`
- `STAGE 4 REMEDIATION COMPLETE`
- `EXERCISE CATALOGUE SOFTWARE/CONTENT-READY FOR CONTROLLED BETA`
- `STAGE 5 REMEDIATION COMPLETE`
- `DYNAMIC WORKOUT GENERATION SOFTWARE-READY FOR CONTROLLED BETA`
- `OVERALL BETA RELEASE STILL BLOCKED`
- `PHYSICAL DEVICE VALIDATION REQUIRED`

Do not declare Hale beta-ready.

## Final Codex response

Return a concise summary containing:

- Report path.
- Whether any repository code/tests/assets changed.
- Primary sources verified.
- Chair claim type recommendation.
- Chair protocol recommendation.
- Chair setup-friction policy.
- Balance trial-policy recommendation.
- Balance claim type recommendation.
- Shoulder side/protocol recommendation.
- Shoulder claim type recommendation.
- Reference-sex recommendation.
- Percentile-range policy.
- Suggested-focus algorithm.
- Raw-only fallback behavior.
- Legacy snapshot policy.
- New snapshot/version requirements.
- Estimated Check-Up duration.
- Pre-implementation pilot design.
- Pilot success thresholds.
- Post-implementation device-pilot design.
- Implementation batches.
- Remaining unresolved questions.
- Targeted validation result.
- Audio verification result.
- Full-suite result.
- App typecheck.
- Website typecheck.
- Expo config.
- `git diff --check`.
- `STAGE 3D-B.1 DESIGN COMPLETE` or blocked.
- Chair design verdict.
- Balance design verdict.
- Shoulder design verdict.
- Suggested-focus verdict.
- Movement Profile implementation-spec verdict.
- Pilot-plan verdict.
- `IMPLEMENTATION NOT STARTED`.
- `STAGE 4 REMEDIATION COMPLETE`.
- `STAGE 5 REMEDIATION COMPLETE`.
- `OVERALL BETA RELEASE STILL BLOCKED`.
- `PHYSICAL DEVICE VALIDATION REQUIRED`.
- Initial and final Git status.
- Temporary-file cleanup.
- Confirmation that no production code, tests, norms, protocols, profile fields, snapshots, copy, website code, dependencies, lockfiles, source PDFs, package install, staging, commit, branch, or push occurred.
