# Hale Logic Audit Stage 3D-B: Norm Provenance and Source Verification

Date: 2026-06-22

Audit type: read-only source provenance, norm-table verification, and product-decision audit.

## 1. Executive Verdict

STAGE 3D-B AUDIT COMPLETE

NORM PROVENANCE PARTIALLY VERIFIED

The current Hale scoring architecture is internally coherent enough to run tests and produce repeatable snapshots, but the scientific provenance behind the norm tables is only partially verified. TUG and single-leg stance source means were directly verified for ages 60+, chair-stand older-adult anchors were reproducibly derived from Rikli/Jones author-published normal-range tables but not from the exact Human Kinetics/manual table, and the shoulder-flexion table remains unverified as currently implemented.

The most important product conclusion is that the current cross-domain "age" comparison is not scientifically calibrated. Balance is especially blocked because Hale caps the scored single-leg eyes-open hold at 12 seconds while the referenced Bohannon age means are 27.0 seconds for ages 60-69 and 17.2 seconds for ages 70-79. A perfect valid Hale single-leg result therefore maps to approximately age 81, displayed as 77-85, before any camera/device error is considered.

Overall beta release remains blocked by Stage 3D-B remediation and physical-device validation. Stage 4 and Stage 5 software/content remediations remain complete as previously verified, but they do not remove the norm-provenance blocker.

## 2. Scope And Read-Only Rules

This audit followed the Stage 3D-B prompt as a read-only scientific/source audit and product-decision task.

Actions explicitly not performed:

- No production code was modified.
- No tests, fixtures, norms, snapshots, copy, UI, website, exercise, workout, native, backend, dependency, lockfile, or asset files were modified.
- No branch was created.
- No files were staged, committed, or pushed.
- No physical-device validation was started.
- No claim was made that Hale is beta-ready.
- No source PDFs, screenshots, scans, or copyrighted tables were committed.

The only repository file created by this audit is this report:

- `docs/audits/HALE_LOGIC_AUDIT_STAGE_3D_B.md`

Temporary source downloads and render artifacts were kept under `/tmp/hale-stage3db/` and were removed before final handoff.

## 3. Initial Git Status

Initial command:

```bash
git status --short --untracked-files=all
```

Initial output:

```text
 M src/adherence/__tests__/adherence.test.ts
 M src/adherence/components/LifeGoalSelector.tsx
 M src/adherence/goalDomainMapping.ts
 M src/adherence/screens/LifeGoalOnboardingScreen.tsx
 M src/adherence/types.ts
 M src/screens/SafetyProfileScreen.tsx
?? docs/audits/Hale_Stage_3D_B_Norm_Provenance_Source_Verification_Prompt.md
```

Initial command:

```bash
git diff --name-only
```

Initial output:

```text
src/adherence/__tests__/adherence.test.ts
src/adherence/components/LifeGoalSelector.tsx
src/adherence/goalDomainMapping.ts
src/adherence/screens/LifeGoalOnboardingScreen.tsx
src/adherence/types.ts
src/screens/SafetyProfileScreen.tsx
```

Initial command:

```bash
git diff --stat
```

Initial output:

```text
 src/adherence/__tests__/adherence.test.ts          | 28 ++++++++++++++
 src/adherence/components/LifeGoalSelector.tsx      | 43 +++++++---------------
 src/adherence/goalDomainMapping.ts                 |  5 ++-
 src/adherence/screens/LifeGoalOnboardingScreen.tsx |  6 +--
 src/adherence/types.ts                             |  7 ++++
 src/screens/SafetyProfileScreen.tsx                | 36 +++++++++---------
 6 files changed, 73 insertions(+), 52 deletions(-)
```

Interpretation: the initial dirty worktree changes were pre-existing user-owned changes outside this audit. They were not touched.

## 4. Baseline Validation

The audit re-ran the relevant validation commands after the source review. All commands passed.

Targeted scoring/flow/catalog validation command:

```bash
npm test -- --runInBand src/scoring/__tests__/scoringInputValidation.test.ts src/scoring/__tests__/scoring.test.ts src/scoring/__tests__/scoreSnapshot.test.ts src/scoring/__tests__/focusSelection.test.ts src/haleFlow/__tests__/assessmentEligibility.test.ts src/haleFlow/__tests__/checkupHistory.test.ts src/haleFlow/__tests__/progressViewModel.test.ts src/haleFlow/__tests__/reports.test.ts src/haleFlow/__tests__/copyGuardrails.test.ts src/services/backend/__tests__/checkupSyncService.test.ts src/services/backend/__tests__/restoreService.test.ts src/exercises/__tests__/catalog.test.ts src/haleFlow/__tests__/stage5hLifecycle.integration.test.ts
```

Result: 12 suites passed, 145 tests passed. Note: `src/haleFlow/__tests__/reports.test.ts` did not match an existing test file, so report coverage was verified by the next targeted command.

Targeted report/flow validation command:

```bash
npm test -- --runInBand src/haleFlow/__tests__/haleFlow.test.ts
```

Result: 1 suite passed, 17 tests passed.

Audio verification command:

```bash
npm run verify:audio
```

Result:

```text
AUDIO VERIFICATION PASS requiredCues=44 voices=clara,marcus requiredAssets=88 totalBytes=4637324 durationRange=1.858-5.155s
```

Full Jest command:

```bash
npm test -- --runInBand
```

Result: 105 suites passed, 869 tests passed.

TypeScript command:

```bash
npm run typecheck
```

Result: passed.

Website TypeScript command:

```bash
npm --prefix website run typecheck
```

Result: passed.

Expo config command:

```bash
npx --no-install expo config --type public
```

Result: passed. Output included loaded environment-variable names and a Sentry warning that organization/project config was missing and environment variables would be used as build fallback.

Whitespace command:

```bash
git diff --check
```

Result: passed with no output.

Observed validation caveats:

- Watchman recrawl warnings appeared during Jest runs.
- Jest printed an open-handle notice after test runs.
- Backend sync failure-path tests emitted expected console warnings/logs.
- No Expo export was run because Stage 3D-B was source/provenance focused and no code or asset changes were made.

## 5. Current Scoring/Norm Architecture

The current scoring path is:

1. Movement metrics are generated from assessment movement definitions.
2. `src/scoring/scoringInputValidation.ts` validates metric bounds and required inputs.
3. `src/scoring/scoring.ts` maps raw metrics to domain scores.
4. `src/scoring/norms.ts` interpolates age anchors and returns an inferred age plus estimated/source flags.
5. `src/scoring/focusSelection.ts` selects a focus domain using midpoint age comparisons, exact-tie stability, and a 5-year near-tie margin.
6. `src/scoring/scoreSnapshot.ts` stores schema/scoring/norm versions and score/focus data.
7. UI surfaces convert domain output into softened labels, product bands, and focus copy.

Current domain drivers:

| Domain | Primary scored driver | Supporting metric(s) | Direction |
| --- | --- | --- | --- |
| Strength/Power | 30-second chair-stand reps | Rise velocity | Higher is better |
| Balance | Single-leg eyes-open seconds | TUG if present; balance practice note under 8s | Higher is better for SLS; lower is better for TUG |
| Mobility | Shoulder flexion peak | Hinge reach | Higher is better for shoulder; lower is better for hinge |

TUG is implemented and scoreable, but it is not in the default V1 assessment battery. It is present only in the beta battery and supporting score path.

## 6. Current Norm-Table Inventory

Current anchors in `src/scoring/norms.ts`:

| Table | Anchor age | Value | Estimated flag in code | Source status after audit |
| --- | ---: | ---: | --- | --- |
| Chair stand reps | 47 | 19.00 reps | true | Hale extrapolation, unverified |
| Chair stand reps | 52 | 18.00 reps | true | Hale extrapolation, unverified |
| Chair stand reps | 57 | 17.00 reps | true | Hale extrapolation, unverified |
| Chair stand reps | 62 | 15.50 reps | false | Derived from Rikli/Jones author normal-range table |
| Chair stand reps | 67 | 14.25 reps | false | Derived from Rikli/Jones author normal-range table |
| Chair stand reps | 72 | 13.50 reps | false | Derived from Rikli/Jones author normal-range table |
| Chair stand reps | 77 | 13.25 reps | false | Derived from Rikli/Jones author normal-range table |
| Chair stand reps | 82 | 12.00 reps | false | Derived from Rikli/Jones author normal-range table |
| Chair stand reps | 87 | 10.75 reps | false | Derived from Rikli/Jones author normal-range table |
| Chair stand reps | 92 | 8.50 reps | false | Derived from Rikli/Jones author normal-range table |
| TUG seconds | 50 | 7.00 sec | true | Hale extrapolation, unverified |
| TUG seconds | 55 | 7.40 sec | true | Hale extrapolation, unverified |
| TUG seconds | 65 | 8.10 sec | false | Source mean verified |
| TUG seconds | 75 | 9.20 sec | false | Source mean verified |
| TUG seconds | 85 | 11.30 sec | false | Source value verified, age anchor transform not directly sourced |
| Single-leg stance | 50 | 35.00 sec | true | Hale extrapolation, unverified |
| Single-leg stance | 55 | 31.00 sec | true | Hale extrapolation, unverified |
| Single-leg stance | 65 | 27.00 sec | false | Source mean verified |
| Single-leg stance | 75 | 17.20 sec | false | Source mean verified |
| Single-leg stance | 85 | 8.50 sec | false | Source value verified, age anchor transform not directly sourced |
| Shoulder flexion | 50 | 162.00 deg | true | Current table unverified |
| Shoulder flexion | 60 | 158.00 deg | true | Current table unverified |
| Shoulder flexion | 70 | 150.00 deg | true | Current table unverified |
| Shoulder flexion | 80 | 140.00 deg | true | Current table unverified |

Anchor count summary:

| Category | Count | Notes |
| --- | ---: | --- |
| Directly sourced source means | 6 | TUG 3, single-leg 3 |
| Direct-derived from author table | 7 | Chair stand ages 62-92 |
| Estimated/extrapolated | 7 | Chair 47/52/57, TUG 50/55, single-leg 50/55 |
| Unsupported/current Hale-estimated | 4 | Shoulder 50/60/70/80 |
| Total anchors | 24 | Complete table inventory |

## 7. Current Claim-Surface Inventory

Primary claim surfaces inspected:

| Surface | Current claim pattern | Source-risk level |
| --- | --- | --- |
| `src/screens/ResultsScreen.tsx` | Strength shows `Beta home estimate: age low-high`; balance and mobility use non-age labels | Medium for strength, lower for balance/mobility display |
| `src/haleFlow/progressViewModel.ts` | Strength age range label retained; balance/mobility softened | Medium |
| `src/screens/ProgressScreen.tsx` | Movement profile, latest check-up, product band labels | Medium |
| `src/onboarding/results.ts` | Product bands from age midpoint thresholds | High if read as normative |
| `src/screens/OnboardingResultsScreen.tsx` | Product bands and suggested focus, no explicit age ranges | Medium |
| `src/haleFlow/reports.ts` and `BlockReportScreen.tsx` | Change/similar/new-data copy, focus suggested from latest snapshot | Medium |
| `website/src/content/landing.ts` | High-level phone-camera check-up and home plan claims | Low for norm provenance |

The current UI has already reduced several public age claims after Stage 3D-A, especially for balance and mobility. However, internal product bands and focus selection still depend on the same age-midpoint outputs.

## 8. Source-Verification Methodology

Permitted source classes used:

- Peer-reviewed primary articles.
- Publisher pages.
- PubMed pages.
- DOI/Crossref metadata.
- Official or institutional source pages.
- Official manuals/previews where exact tables were not accessible.
- Directly cited source documents and author/institutional PDFs where available.

Source classes intentionally not used as evidence:

- Blogs.
- Commercial summaries.
- AI summaries.
- Wikipedia.
- Snippets without source traceability.
- Sci-Hub or other unauthorized full-text sources.
- Unofficial scanned/manual copies as primary evidence.

Verification steps:

1. Inventory every current norm anchor in code.
2. Identify current code comments and claimed source names.
3. Search only permitted evidence classes for each cited source.
4. Inspect accessible full text or official previews when available.
5. Compare source protocols to Hale movement protocols.
6. Compare source values to Hale anchors and record transformations.
7. Classify each anchor by evidence grade.
8. Evaluate whether public age claims, product bands, and cross-domain focus are supportable.

## 9. Evidence-Grade Definitions

| Grade | Definition |
| --- | --- |
| A | Exact value or protocol directly verified in primary peer-reviewed article, official manual, publisher page, or official institutional source. |
| B | Source identity, protocol, or metadata verified from primary/official source, but exact current Hale table values were not directly accessible. |
| C | Value derived from an authoritative author/institutional secondary source, not the exact primary norm table cited in code. |
| D | Repo assertion only; no external source confirmed during this audit. |
| E | Unsupported, Hale-estimated, extrapolated, or incompatible with verified source values. |

## 10. Complete Bibliography/Source Register

| ID | Source | Link | Audit use | Evidence result |
| --- | --- | --- | --- | --- |
| S1 | Rikli RE, Jones CJ. Functional Fitness Normative Scores for Community-Residing Older Adults, Ages 60-94. Journal of Aging and Physical Activity. 1999;7(2):162-181. DOI 10.1123/japa.7.2.162. | [Human Kinetics](https://journals.humankinetics.com/view/journals/japa/7/2/article-p162.xml), [DOI](https://doi.org/10.1123/japa.7.2.162) | Chair-stand norm source metadata | Grade B: source metadata verified; exact table not accessible |
| S2 | Jones CJ, Rikli RE, Beam WC. A 30-s Chair-Stand Test as a Measure of Lower Body Strength in Community-Residing Older Adults. Research Quarterly for Exercise and Sport. 1999;70(2):113-119. DOI 10.1080/02701367.1999.10608028. PMID 10380242. | [PubMed](https://pubmed.ncbi.nlm.nih.gov/10380242/), [DOI](https://doi.org/10.1080/02701367.1999.10608028) | Chair-stand validity/protocol context | Grade B for source identity; not Hale's norm table |
| S3 | Rikli RE, Jones CJ. Development and Validation of a Functional Fitness Test for Community-Residing Older Adults. Journal of Aging and Physical Activity. 1999;7(2):129-161. DOI 10.1123/japa.7.2.129. | [DOI](https://doi.org/10.1123/japa.7.2.129) | SFT validity/protocol context | Grade B |
| S4 | Rikli RE, Jones CJ. Senior Fitness Test Manual, Second Edition. Human Kinetics, 2013. | [Google Books preview](https://books.google.com/books/about/Senior_Fitness_Test_Manual.html?id=NXfXxOFFOVwC), [Human Kinetics Europe](https://www.human-kinetics.co.uk/9781450411189/senior-fitness-test-manual/) | Manual identity and norm-table existence | Grade B; exact values not accessible through official preview |
| S5 | Jones CJ, Rikli RE. Measuring functional fitness of older adults. The Journal on Active Aging. 2002. | [University of Verona PDF](https://www.dnbm.univr.it/documenti/OccorrenzaIns/matdid/matdid182478.pdf) | Author-published SFT normal-range tables | Grade C for chair anchor derivation |
| S6 | CDC STEADI. 30-Second Chair Stand assessment PDF. | [CDC PDF](https://www.cdc.gov/steadi/media/pdfs/steadi-assessment-30sec-508.pdf) | Chair protocol comparison | Grade A for official protocol summary, not norm table |
| S7 | Bohannon RW. Reference Values for the Timed Up and Go Test: A Descriptive Meta-Analysis. Journal of Geriatric Physical Therapy. 2006;29(2):64-68. DOI 10.1519/00139143-200608000-00004. PMID 16914068. | [PubMed](https://pubmed.ncbi.nlm.nih.gov/16914068/), [Missouri Geriatric Toolkit PDF](https://geriatrictoolkit.missouri.edu/tug/Bohannon-TUG-Ref-JGPT2006-2.pdf), [DOI](https://doi.org/10.1519/00139143-200608000-00004) | TUG source means and protocol heterogeneity | Grade A for source means; partial for Hale transform |
| S8 | Bohannon RW. Single Limb Stance Times: A Descriptive Meta-Analysis of Data From Individuals at Least 60 Years of Age. Topics in Geriatric Rehabilitation. 2006;22(1):70-77. DOI 10.1097/00013614-200601000-00010. | [NursingCenter publisher page](https://www.nursingcenter.com/journalarticle?Article_ID=633586&Issue_ID=633530&Journal_ID=515682), [Missouri Geriatric Toolkit PDF](https://geriatrictoolkit.missouri.edu/balance/Bohannon_Single_Limb_Stance_2006.pdf), [DOI](https://doi.org/10.1097/00013614-200601000-00010) | Single-leg source means and protocol heterogeneity | Grade A for source means; partial for Hale transform |
| S9 | Norkin CC, White DJ. Measurement of Joint Motion: A Guide to Goniometry. | [F.A. Davis](https://www.fadavis.com/product/physical-therapy-measurement-joint-motion-goniometry-norkin-white-5), [NLM catalog](https://catalog.nlm.nih.gov/discovery/fulldisplay/alma995894233406676/01NLM_INST%3A01NLM_INST) | Shoulder measurement reference identity | Grade B for measurement manual identity; no Hale table values verified |
| S10 | Soucie JM et al. Range of motion measurements: reference values and a database for comparison studies. Haemophilia. 2010/2011. PMID 21070485. | [PubMed](https://pubmed.ncbi.nlm.nih.gov/21070485/), [CDC archive](https://archive.cdc.gov/www_cdc_gov/ncbddd/jointrom/index.html), [DOI](https://doi.org/10.1111/j.1365-2516.2010.02399.x) | Alternative official ROM source | Grade A as source; does not match Hale shoulder table |
| S11 | Gill TK, Shanahan EM, Tucker GR, Buchbinder R, Hill CL. Shoulder range of movement in the general population: age and gender stratified normative data using a community-based cohort. BMC Musculoskeletal Disorders. 2020;21:676. DOI 10.1186/s12891-020-03665-9. PMID 33046038. PMCID PMC7549223. | [Springer full text](https://link.springer.com/article/10.1186/s12891-020-03665-9), [PubMed](https://pubmed.ncbi.nlm.nih.gov/33046038/) | Alternative shoulder age/sex table | Grade A as source; not current Hale-cited source |

## 11. Chair-Stand Source Verification

CHAIR-STAND NORM PARTIALLY VERIFIED

Verified:

- The cited Rikli/Jones normative article exists, is peer-reviewed, and is published in Journal of Aging and Physical Activity.
- Publisher metadata identifies a nationwide sample of 7,183 adults ages 60-94 and age/sex normative data.
- The Senior Fitness Test Manual exists and official previews state that it retains national normative data by age and sex for adults 60+.
- The CDC 30-second chair-stand protocol matches the core movement used by Hale: 17-inch chair, arms crossed, repeated full stands for 30 seconds.
- The author article by Jones/Rikli provides normal-range tables for men and women ages 60-94. Those values can reproduce Hale's older-adult chair anchors if Hale takes the midpoint of each male range, the midpoint of each female range, then averages those two sex-specific midpoints.

Not verified:

- The exact percentile/norm table in the Human Kinetics manual or the exact 1999 JAPA table was not directly accessible through primary/publisher sources.
- No primary source was found for Hale's ages 47, 52, and 57 anchors.
- No source rationale was found for sex-pooling the chair-stand values into a single table.

## 12. Chair-Stand Protocol Comparison

| Protocol element | CDC/SFT source | Hale implementation | Verdict |
| --- | --- | --- | --- |
| Test duration | 30 seconds | 30 seconds | Match |
| Chair | Straight back, no arms, 17-inch seat in CDC protocol | Chair stand movement; no hard-coded chair-height validation from CV | Partial, setup-dependent |
| Arm position | Arms crossed at chest/opposite shoulders | Hand push-off is detected only as a logged flag, not critique | Mostly aligned |
| Count | Full stands in 30 seconds | Rep cycle count | Aligned in intent; CV threshold needs device validation |
| Population | Community-residing older adults, 60-94 | Consumer adults about 45-65+ | Partial; under-60 extrapolated |
| Norm stratification | Age and sex | Pooled single table | Mismatch |

Protocol verdict: the movement construct is appropriate, but Hale's source-to-product transformation is not fully documented because of sex pooling, under-60 extrapolation, and camera-specific counting differences.

## 13. Chair-Stand Anchor Verification

Author article normal-range values inspected:

| Age bin | Men normal range | Women normal range | Hale direct-derived value | Calculation |
| --- | --- | --- | ---: | --- |
| 60-64 | 14-19 | 12-17 | 15.50 | Average of 16.5 and 14.5 |
| 65-69 | 12-18 | 11-16 | 14.25 | Average of 15.0 and 13.5 |
| 70-74 | 12-17 | 10-15 | 13.50 | Average of 14.5 and 12.5 |
| 75-79 | 11-17 | 10-15 | 13.25 | Average of 14.0 and 12.5 |
| 80-84 | 10-15 | 9-14 | 12.00 | Average of 12.5 and 11.5 |
| 85-89 | 8-14 | 8-13 | 10.75 | Average of 11.0 and 10.5 |
| 90-94 | 7-12 | 4-11 | 8.50 | Average of 9.5 and 7.5 |

Hale chair anchors:

| Anchor | Hale value | Audit grade | Verdict |
| ---: | ---: | --- | --- |
| 47 | 19.00 | E | Extrapolated, no source found |
| 52 | 18.00 | E | Extrapolated, no source found |
| 57 | 17.00 | E | Extrapolated, no source found |
| 62 | 15.50 | C | Reproducible from author normal-range table |
| 67 | 14.25 | C | Reproducible from author normal-range table |
| 72 | 13.50 | C | Reproducible from author normal-range table |
| 77 | 13.25 | C | Reproducible from author normal-range table |
| 82 | 12.00 | C | Reproducible from author normal-range table |
| 87 | 10.75 | C | Reproducible from author normal-range table |
| 92 | 8.50 | C | Reproducible from author normal-range table |

Chair-stand anchor conclusion: older-adult anchors are mathematically reproducible from an author secondary table, but the exact primary/manual table and the sex-pooling policy remain unverified.

## 14. TUG Source/Protocol/Anchor Verification

TUG NORM PARTIALLY VERIFIED

Verified source values from Bohannon 2006:

| Source age group | Source mean | Hale anchor | Verification |
| --- | ---: | ---: | --- |
| 60-69 | 8.1 sec | age 65 = 8.1 | Value match |
| 70-79 | 9.2 sec | age 75 = 9.2 | Value match |
| 80-99 | 11.3 sec | age 85 = 11.3 | Value match, age representative mismatch |

Hale extra anchors:

| Anchor | Hale value | Audit grade | Verdict |
| ---: | ---: | --- | --- |
| 50 | 7.00 sec | E | Extrapolated, no source found |
| 55 | 7.40 sec | E | Extrapolated, no source found |
| 65 | 8.10 sec | A | Source mean verified |
| 75 | 9.20 sec | A | Source mean verified |
| 85 | 11.30 sec | A/E | Source mean verified, but 80-99 bin midpoint would be 89.5, not 85 |

Protocol observations:

- Bohannon's meta-analysis used studies of apparently normal individuals or control groups 60+.
- Included studies varied in chair height, chair type, course distance, instructions, trial count, practice handling, and timing start.
- Course lengths included 3 m or 10 ft variants.
- Hale's TUG is side-lateral camera framed, uses seat-off to re-seated timing, and detects a turn via hip-x velocity reversal.
- Hale also supports a short-path non-standard variant, which should not be norm-compared as standard TUG.

Product conclusion:

- TUG should remain hidden/supporting for V1.
- The verified source supports a rough older-adult mobility reference, not a public camera-based movement-age claim.

## 15. Single-Leg Source Verification

SINGLE-LEG NORM PARTIALLY VERIFIED

Verified source values from Bohannon 2006:

| Source age group | Source mean | Hale anchor | Verification |
| --- | ---: | ---: | --- |
| 60-69 | 27.0 sec | age 65 = 27.0 | Value match |
| 70-79 | 17.2 sec | age 75 = 17.2 | Value match |
| 80-99 | 8.5 sec | age 85 = 8.5 | Value match, age representative mismatch |

Hale extra anchors:

| Anchor | Hale value | Audit grade | Verdict |
| ---: | ---: | --- | --- |
| 50 | 35.00 sec | E | Extrapolated, no source found |
| 55 | 31.00 sec | E | Extrapolated, no source found |
| 65 | 27.00 sec | A | Source mean verified |
| 75 | 17.20 sec | A | Source mean verified |
| 85 | 8.50 sec | A/E | Source mean verified, but 80-99 bin midpoint would be 89.5, not 85 |

Verified protocol/source notes:

- Bohannon's single-limb stance meta-analysis focused on eyes-open SLS in individuals at least 60 years of age.
- The meta-analysis initially included 22 studies and 3,484 participants ages 60-99.
- Source methods show substantial heterogeneity in tested limb, footwear, maximum trial duration, trial count, and best-versus-mean scoring.
- Bohannon explicitly narrows to age-group means after overall data heterogeneity.

## 16. Single-Leg Protocol Comparison

| Protocol element | Bohannon source | Hale implementation | Verdict |
| --- | --- | --- | --- |
| Eyes open | Yes | Single-leg eyes-open stage is the scored balance driver | Match |
| Trial cap | Source studies varied: 30s, 45s, 60s, no limit, or unstated | Hale caps single-leg EO at 12s | Major mismatch |
| Limb | Preferred/dominant/either/both varied | CV detects raised-foot/touchdown; no norm-side stratification | Partial |
| Footwear | Varied or unstated | Home user setup unspecified | Partial |
| Trials | Varied | Hale ladder stage once per check-up | Partial |
| Population | Ages 60-99 | Hale target includes 45-65+ | Under-60 unsupported |

Protocol conclusion: the Hale single-leg construct is source-adjacent, but the 12-second cap makes the current age mapping invalid for a public balance-age claim.

## 17. Balance-Cap Mismatch Analysis

BALANCE AGE CLAIM BLOCKED

The current Hale balance stage caps single-leg eyes-open hold at 12 seconds:

- `src/movements/definitions/balanceLadder.ts`: single-leg eyes-open stage duration 12,000 ms.
- `src/scoring/scoringInputValidation.ts`: rejects single-leg values greater than the single-leg stage cap.
- `src/scoring/norms.ts`: source-coded single-leg anchors include 65 = 27.0 seconds, 75 = 17.2 seconds, and 85 = 8.5 seconds.

Probe result from the current scoring functions:

```text
balance12 {"age":80.97701149425288,"estimated":false,"ceiling":false,"floor":false}
balance12Display 77 85
```

Implications:

- A perfect valid Hale single-leg result cannot reach the 60-69 source mean.
- A perfect valid Hale single-leg result cannot reach the 70-79 source mean.
- A perfect valid Hale result maps to roughly age 81 before camera/device error.
- Balance product bands and focus comparisons are distorted by the cap.
- Public balance age claims must remain blocked.

The current UI already avoids displaying a balance age range, which is the right public-facing posture, but internal focus calibration still inherits the problem.

## 18. Shoulder-Flexion Source Search And Verification

SHOULDER-FLEXION NORM UNVERIFIED

The current code cites broad shoulder-ROM sources, especially Norkin & White-style goniometry references and aging ROM references, but it does not cite a precise table that reproduces Hale's anchors:

- 50 = 162 deg
- 60 = 158 deg
- 70 = 150 deg
- 80 = 140 deg

Verified shoulder source candidates:

| Source | What it supports | Does it verify current Hale table? |
| --- | --- | --- |
| Norkin & White goniometry manual | Measurement method and clinical ROM context | No exact age-stratified Hale values verified |
| CDC/Soucie ROM study | Official ROM reference values by broad age and sex groups through age 69 | No; age bins and values do not match Hale table |
| Gill et al. 2020 BMC | Large age/sex-stratified community shoulder ROM table ages 20-91 | No exact match; useful remediation source candidate |

Gill et al. is particularly relevant because it contains age- and sex-stratified active shoulder flexion data in a general population cohort. It resembles the broad age decline implied by Hale's table, but Hale neither cites it nor exactly derives its anchors from it.

## 19. Shoulder Anchor Verification

| Anchor | Hale value | Current code estimated flag | Audit grade | Verdict |
| ---: | ---: | --- | --- | --- |
| 50 | 162 deg | true | E | No exact current source verified |
| 60 | 158 deg | true | E | No exact current source verified |
| 70 | 150 deg | true | E | No exact current source verified |
| 80 | 140 deg | true | E | No exact current source verified |

The code correctly marks the current shoulder table as estimated. That is good metadata hygiene, but an estimated table is not enough to support a public "mobility age" claim. The current UI's softened "shoulder mobility estimate" wording is appropriate until remediation.

## 20. Product-Band Audit

PERFORMANCE-BAND POLICY REMEDIATION REQUIRED

Current product bands use age-midpoint thresholds:

- Strong: midpoint age <= 58.
- Building: midpoint age <= 72.
- Starting point: midpoint age > 72.

Risks:

- Bands are product heuristics, not source-defined normative bands.
- Bands can indirectly launder unsupported age estimates even when the UI hides explicit age ranges.
- Balance bands are affected by the 12-second cap.
- Mobility bands inherit the unverified shoulder table.
- Sex pooling and under-60 estimates affect all age-midpoint-derived bands.

Current copy is safer than the original age-forward display because it uses labels like "Home estimate", "Strong", "Building", and "Starting point" rather than hard medical classification. However, the underlying band policy needs remediation before controlled beta if bands are presented as meaningful across domains.

## 21. Cross-Domain Comparability Audit

CROSS-DOMAIN FOCUS CALIBRATION BLOCKED

Current focus selection compares the midpoint age outputs for strength, balance, and mobility. The comparison is not currently source-calibrated:

| Domain | Current age basis | Scientific comparability risk |
| --- | --- | --- |
| Strength | Chair-stand normal-range midpoint, sex-pooled, ages 60-94 plus extrapolated 45-59 | Partial source support, but sex pooling/under-60 unresolved |
| Balance | Single-leg source means but Hale protocol caps at 12s | Major scale distortion |
| Mobility | Estimated shoulder-flexion table | Unverified table |

The tie and near-tie mechanics are well implemented and tested, but they operate on inputs that are not comparable. The problem is calibration, not software determinism.

## 22. Internal-Focus Versus Public-Display Matrix

| Item | Public display | Internal focus use | Stage 3D-B recommendation |
| --- | --- | --- | --- |
| Chair-stand reps | Can display raw reps and cautious beta home estimate only after source/provenance remediation | Provisional | Keep raw reps; block unsupported age framing |
| Rise velocity | Supporting/trend only | Useful internal longitudinal metric after device validation | Keep as supporting only |
| Single-leg hold | Display raw seconds, cap clearly as home estimate | Block as age mapping | Fix cap/norm mapping before age/focus calibration |
| TUG | Hidden/supporting only | Supporting only | Keep out of default public battery |
| Shoulder flexion | Display raw degrees or non-age estimate | Block as age mapping | Replace/re-source table before age/focus calibration |
| Hinge reach | Supporting/trend only | Supporting only | Keep non-age |
| Product bands | Public only as product language with caveat | Avoid as scientific labels | Remediate thresholds |
| Suggested focus | Public as routine/training focus, not diagnosis | Provisional after recalibration | Currently blocked as scientifically calibrated |

## 23. Anchor-By-Anchor Provenance Register

| ID | Domain | Anchor | Value | Provenance class | Grade |
| --- | --- | ---: | ---: | --- | --- |
| CS-47 | Strength | 47 | 19.00 reps | Hale extrapolated | E |
| CS-52 | Strength | 52 | 18.00 reps | Hale extrapolated | E |
| CS-57 | Strength | 57 | 17.00 reps | Hale extrapolated | E |
| CS-62 | Strength | 62 | 15.50 reps | Derived from author normal-range table | C |
| CS-67 | Strength | 67 | 14.25 reps | Derived from author normal-range table | C |
| CS-72 | Strength | 72 | 13.50 reps | Derived from author normal-range table | C |
| CS-77 | Strength | 77 | 13.25 reps | Derived from author normal-range table | C |
| CS-82 | Strength | 82 | 12.00 reps | Derived from author normal-range table | C |
| CS-87 | Strength | 87 | 10.75 reps | Derived from author normal-range table | C |
| CS-92 | Strength | 92 | 8.50 reps | Derived from author normal-range table | C |
| TUG-50 | Mobility/supporting | 50 | 7.00 sec | Hale extrapolated | E |
| TUG-55 | Mobility/supporting | 55 | 7.40 sec | Hale extrapolated | E |
| TUG-65 | Mobility/supporting | 65 | 8.10 sec | Bohannon source mean | A |
| TUG-75 | Mobility/supporting | 75 | 9.20 sec | Bohannon source mean | A |
| TUG-85 | Mobility/supporting | 85 | 11.30 sec | Bohannon source mean, age representative transformed | A/E |
| SLS-50 | Balance | 50 | 35.00 sec | Hale extrapolated | E |
| SLS-55 | Balance | 55 | 31.00 sec | Hale extrapolated | E |
| SLS-65 | Balance | 65 | 27.00 sec | Bohannon source mean | A |
| SLS-75 | Balance | 75 | 17.20 sec | Bohannon source mean | A |
| SLS-85 | Balance | 85 | 8.50 sec | Bohannon source mean, age representative transformed | A/E |
| SF-50 | Mobility | 50 | 162.00 deg | Hale estimated/unverified | E |
| SF-60 | Mobility | 60 | 158.00 deg | Hale estimated/unverified | E |
| SF-70 | Mobility | 70 | 150.00 deg | Hale estimated/unverified | E |
| SF-80 | Mobility | 80 | 140.00 deg | Hale estimated/unverified | E |

## 24. Transformation Register

| Transformation | Current behavior | Verification status | Risk |
| --- | --- | --- | --- |
| Linear interpolation between anchors | `inferAge` interpolates between adjacent anchors | Software behavior tested | Acceptable if anchors are valid |
| Age range display | `mapAge` returns +/-4 years if source-real, +/-6 if estimated | Software behavior tested | Can overstate source support if anchor provenance weak |
| Sex pooling | Chair and shoulder sources have sex differences; app has no sex-specific norm path | No source policy verified | High |
| Under-60 extrapolation | Chair/TUG/SLS use estimated anchors under source ranges | No source verified | High |
| 80-99 to age 85 | TUG/SLS source group is 80-99; Hale anchors at 85 | Not source-justified | Medium |
| Balance cap | Max valid single-leg EO is 12s | Verified in code | Critical |
| Product bands | Age midpoint to Strong/Building/Starting point | Product heuristic only | High |
| Cross-domain focus | Highest age midpoint drives focus | Tested mechanics, unsupported calibration | Critical |

## 25. Snapshot/Source-Metadata Audit

Current score snapshots include:

- `schemaVersion`
- `scoringVersion`
- `normVersion`
- `createdAt`
- `sourceCheckUpId`
- JSON-safe score payload
- focus-selection metadata

Missing for Stage 3D-B provenance:

- Source-set ID.
- Citation IDs per norm table.
- Table hash or immutable table version.
- Protocol version per movement.
- Norm population metadata.
- Sex-pooling policy metadata.
- Estimated/extrapolated anchor policy metadata.
- Display-policy version.
- Device-validation status.
- Whether a score was public-display eligible at creation time.

Risk: future score snapshots may be hard to interpret if norm tables or display policies change. This matters because Hale's product promise is longitudinal trend comparison.

## 26. Physical-Device Dependency Map

Source verification does not replace physical-device validation. The following outputs remain device-dependent:

| Output | Device dependency |
| --- | --- |
| Chair rep count | Camera angle, chair visibility, hysteresis thresholds, subject framing |
| Chair rise velocity | Body-unit calibration, frame rate stability, hip landmark smoothing |
| Hand push-off flag | Occlusion and near-side/far-side limb reliability |
| Single-leg touchdown | Ankle/foot landmark visibility, occlusion, floor visibility |
| Balance sway proxy | Landmark jitter and body-unit stability |
| TUG timing | Seat-off/re-seated phase detection, walking path in frame, turn detection |
| Shoulder flexion | Side-view alignment, elbow/shoulder visibility, trunk compensation |
| Hinge reach | Wrist/floor relation, side-view setup, body-unit calibration |
| Product trends | Between-session setup variance |

Physical-device validation remains a required beta blocker.

## 27. Domain Verdict Packet

| Domain | Source verdict | Public age claim | Raw metric display | Internal focus |
| --- | --- | --- | --- | --- |
| Strength/Power | Chair norm partially verified | STRENGTH AGE CLAIM BLOCKED | Raw chair reps can display; rise velocity supporting | Provisional only after provenance remediation |
| Balance | Single-leg source values partially verified; Hale cap mismatch critical | BALANCE AGE CLAIM BLOCKED | Raw capped hold seconds can display as home estimate | Blocked as calibrated focus input |
| Mobility | Shoulder table unverified; TUG hidden/supporting | MOBILITY AGE CLAIM BLOCKED | Raw shoulder degrees/hinge support can display with caveat | Blocked as calibrated focus input |

## 28. Controlled-Beta Display Recommendation

Controlled-beta display should prefer:

- Raw values: chair reps, single-leg seconds, shoulder degrees, hinge reach, rise velocity as supporting.
- Home-estimate labels.
- Non-medical, non-diagnostic language.
- Longitudinal trend language only after device validation.
- Clear distinction between product focus and scientific/normative comparison.

Controlled-beta display should avoid until remediation:

- Public balance age ranges.
- Public mobility age ranges.
- Any composite movement age.
- Cross-domain "oldest domain" framing.
- Norm-derived product bands without caveat.
- Under-60 age claims derived from extrapolated anchors.
- Sex-neutral age claims that imply source precision.

## 29. Finding Register

| ID | Priority | Finding | Recommendation |
| --- | --- | --- | --- |
| F3DB-001 | P0 | Balance age scale is impossible under the 12s cap; a perfect valid score maps to roughly age 81. | Rebuild balance protocol/norm mapping before any balance age or calibrated focus use. |
| F3DB-002 | P0 | Shoulder-flexion table is unsupported as currently implemented. | Replace with a directly sourced table or keep shoulder as raw non-age estimate. |
| F3DB-003 | P0 | Cross-domain focus compares partially sourced, truncated, and unsupported age midpoints. | Block scientific focus calibration until domains use comparable validated scales. |
| F3DB-004 | P1 | Exact chair primary/manual table was not directly accessible; older anchors derive from an author secondary normal-range table. | Add exact accessible provenance or cite the author-derived transformation explicitly. |
| F3DB-005 | P1 | Sex pooling is undocumented and not source-justified. | Decide sex-specific norms, sex-neutral product estimates, or a documented pooling policy. |
| F3DB-006 | P1 | Ages 45-59 are extrapolated/unsupported for chair, TUG, and SLS. | Hide under-60 age claims or source adult-age references. |
| F3DB-007 | P1 | Snapshots lack source/protocol/table/display provenance metadata. | Add immutable source-set and display-policy metadata before changing norms. |
| F3DB-008 | P2 | Product bands are heuristic age-threshold labels. | Reframe or recalibrate bands independent of unsupported age estimates. |
| F3DB-009 | P2 | TUG source values are verified, but protocol heterogeneity and home-path variance keep it supporting-only. | Keep TUG out of the default public V1 battery. |
| F3DB-010 | P2 | Meaningful-change and trend thresholds remain product/device heuristics. | Validate on recorded landmark replay and physical devices before trend claims. |
| F3DB-011 | P3 | Manual/table reproducibility and copyright handling need durable documentation. | Store citations and transformations, not copyrighted source tables. |

Finding counts:

- P0: 3
- P1: 4
- P2: 3
- P3: 1

## 30. Product-Decision Packet

Age-claim decisions:

| Claim | Decision | Reason |
| --- | --- | --- |
| Strength age | BLOCKED | Chair anchors partially verified, but exact primary/manual table, sex pooling, and 45-59 extrapolation remain unresolved. |
| Balance age | BLOCKED | Verified SLS source values are incompatible with Hale's 12s scoring cap. |
| Mobility age | BLOCKED | Shoulder table is unverified; TUG is hidden/supporting. |
| Composite movement age | BLOCKED | Cross-domain calibration is blocked. |
| Training focus | BLOCKED as scientifically calibrated; prototype-only as product heuristic | Current input scales are not comparable. |
| Performance bands | REMEDIATION REQUIRED | Bands are heuristic and inherit age-table issues. |

Recommended public posture:

- Continue using "home estimate" language.
- Keep balance and mobility age ranges hidden.
- Treat strength age range as not source-supported for beta until provenance remediation is complete.
- Use raw metrics and trends carefully after physical-device validation.

## 31. Recommended Remediation Batches

Batch 1: Norm provenance hardening

- Add a source-set registry with citation IDs, source ranges, population notes, and transformation notes.
- Decide whether chair uses sex-specific tables, documented sex-pooling, or no public age display.
- Remove or explicitly quarantine 45-59 extrapolated age claims.

Batch 2: Balance scale repair

- Decide whether Hale will score a longer single-leg hold, use capped product bands only, or source a cap-compatible balance reference.
- Prevent capped 12s results from mapping to source age ranges.
- Recalibrate focus selection after balance repair.

Batch 3: Shoulder source replacement

- Replace the current shoulder table with a directly derived, cited source such as Gill et al. if the protocol is acceptable.
- Document active/passive measurement differences, sex pooling, side selection, and five-year age-bin transforms.
- Keep mobility age hidden until replacement is verified.

Batch 4: Display-policy and snapshot metadata

- Add display-policy versioning and public-eligibility flags to snapshots.
- Store source-set IDs and norm table versions.
- Keep old snapshots interpretable after norm remediation.

Batch 5: Device validation

- Use recorded landmark replay plus physical-device check-ups.
- Validate rep counts, hold caps, shoulder angle stability, and between-session repeatability.
- Only then graduate raw trend and performance-band claims.

## 32. Final Stage 3D-B Decisions

STAGE 3D-B AUDIT COMPLETE

NORM PROVENANCE PARTIALLY VERIFIED

CHAIR-STAND NORM PARTIALLY VERIFIED

TUG NORM PARTIALLY VERIFIED

SINGLE-LEG NORM PARTIALLY VERIFIED

SHOULDER-FLEXION NORM UNVERIFIED

CROSS-DOMAIN FOCUS CALIBRATION BLOCKED

STRENGTH AGE CLAIM BLOCKED

BALANCE AGE CLAIM BLOCKED

MOBILITY AGE CLAIM BLOCKED

PERFORMANCE-BAND POLICY REMEDIATION REQUIRED

STAGE 3D-B REMEDIATION REQUIRED

STAGE 4 REMEDIATION COMPLETE

EXERCISE CATALOGUE SOFTWARE/CONTENT-READY FOR CONTROLLED BETA

STAGE 5 REMEDIATION COMPLETE

DYNAMIC WORKOUT GENERATION SOFTWARE-READY FOR CONTROLLED BETA

OVERALL BETA RELEASE STILL BLOCKED

BETA DEVICE VALIDATION REQUIRED

## 33. Remaining Overall Beta Blockers

Remaining blockers:

- Stage 3D-B norm provenance remediation.
- Balance cap/norm mismatch.
- Shoulder-flexion table replacement or public age-claim removal.
- Cross-domain focus calibration.
- Performance-band policy remediation.
- Snapshot/source metadata hardening.
- Physical-device validation.

Previously completed but still dependent areas:

- Stage 4 remediation remains complete for exercise catalogue software/content readiness.
- Stage 5 remediation remains complete for dynamic workout generation software readiness.
- Those completions do not clear scientific/norm provenance or device-validation blockers.

## 34. Final Git Status

Final status command outputs are recorded after report creation and temporary-file cleanup.

```bash
git status --short --untracked-files=all
```

```text
 M docs/decisions.md
 M src/haleFlow/__tests__/sessionPlanning.test.ts
 M src/haleFlow/sessionPlanning.ts
 M src/onboarding/__tests__/onboarding.test.ts
 M src/screens/OnboardingEquipmentScreen.tsx
 M src/training/__tests__/dailyTrainingContext.test.ts
 M src/training/__tests__/workoutGeneration.test.ts
 M src/training/dailyTrainingContext.ts
 M src/training/workoutGeneration.ts
?? docs/audits/HALE_LOGIC_AUDIT_STAGE_3D_B.md
```

```bash
git diff --name-only
```

```text
docs/decisions.md
src/haleFlow/__tests__/sessionPlanning.test.ts
src/haleFlow/sessionPlanning.ts
src/onboarding/__tests__/onboarding.test.ts
src/screens/OnboardingEquipmentScreen.tsx
src/training/__tests__/dailyTrainingContext.test.ts
src/training/__tests__/workoutGeneration.test.ts
src/training/dailyTrainingContext.ts
src/training/workoutGeneration.ts
```

```bash
git diff --stat
```

```text
 docs/decisions.md                                  | 11 +++
 src/haleFlow/__tests__/sessionPlanning.test.ts     | 15 ++++
 src/haleFlow/sessionPlanning.ts                    | 26 ++++---
 src/onboarding/__tests__/onboarding.test.ts        | 25 +++++-
 src/screens/OnboardingEquipmentScreen.tsx          | 46 +++++++----
 .../__tests__/dailyTrainingContext.test.ts         |  8 ++
 src/training/__tests__/workoutGeneration.test.ts   | 89 +++++++++++++++++++++-
 src/training/dailyTrainingContext.ts               | 24 ++++++
 src/training/workoutGeneration.ts                  | 77 ++++++++++++++++---
 9 files changed, 285 insertions(+), 36 deletions(-)
```

Final interpretation: the tracked dirty files at final status differ from the initial snapshot, which indicates worktree changes occurred outside this audit while the audit was in progress. This audit created only the untracked report file `docs/audits/HALE_LOGIC_AUDIT_STAGE_3D_B.md`, did not edit production code, and did not stage or commit anything.

## 35. Temporary-File Cleanup Confirmation

Temporary workspace used:

```text
/tmp/hale-stage3db/
```

Cleanup status: confirmed removed with `rm -rf /tmp/hale-stage3db && test ! -e /tmp/hale-stage3db`.

No source PDFs, source screenshots, scans, or copyrighted tables were committed.
