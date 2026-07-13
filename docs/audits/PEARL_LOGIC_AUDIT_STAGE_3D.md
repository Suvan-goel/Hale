# Pearl Logic Audit Stage 3D: Norm Provenance, Claims, Ties, and Meaningful Change

Date: 2026-06-20
Mode: read-only audit and product-decision packet
Output: `docs/audits/PEARL_LOGIC_AUDIT_STAGE_3D.md`

## 1. Executive Verdict

Stage 3D remediation is required before public beta. The current software path is much safer than the original Stage 3 state because Stage 3A-3C added input hardening, complete official evidence gates, score snapshots, and version-compatible comparisons. However, the interpretation layer still overstates certainty.

Headline verdicts:

| Area | Verdict | Reason |
| --- | --- | --- |
| Norm provenance | NORMATIVE-DATA REVIEW REQUIRED | The repository names plausible sources, but the actual source tables, protocol matching, population details, and transformations are not externally verified in this audit. User did not separately approve network/source lookup, so this is repo-only. |
| Strength / Power age | Beta-provisional | Chair-stand reps have the best repo provenance, but ages 45-59 are extrapolated, sex is pooled, home camera protocol/device repeatability are unresolved, and "power" is not the age driver. |
| Balance age | Beta-blocked for age claims | Single-leg hold is the only age driver, the stage caps eyes-open single-leg at 12 seconds while the norm anchors include 27-35 seconds for younger/younger-old adults, and broader "balance" copy overstates static hold evidence. |
| Mobility age | Beta-blocked for age claims | Shoulder flexion alone drives the age, and the whole shoulder norm is explicitly estimated. Hinge reach is displayed but does not affect the age. |
| TUG | Keep hidden/supporting | The TUG norm exists but is not currently used for official domain age. Historical/supporting display can appear, but beta should keep TUG out of official claims until validated. |
| Exact ties | Product policy missing | Current behavior is deterministic but implicit: first maximum in domain order wins, so strength beats balance/mobility and balance beats mobility. Snapshots store only one focus. |
| Near ties | Product policy missing | No margin exists. Below-repeatability differences can change training focus. |
| Meaningful change | Product policy missing | Reports treat any midpoint decrease as improved and any increase as declined/adjusted. Progress cards mix raw metrics with small or inconsistent thresholds. |

Recommended beta posture: do not ship current movement-age claims as authoritative. Show "beta estimate" ranges or, preferably for first beta, performance bands ("strong", "building", "starting point") with metric rows. Use the weakest-domain focus to generate training only as a provisional "area to focus on", after exact tie policy and copy softening. Do not claim meaningful improvement/decline until repeatability thresholds exist.

Stage decisions:

- STAGE 3D REMEDIATION REQUIRED.
- STAGE 4 UNBLOCKED for exercise-catalogue/progression audit, because it can proceed against provisional focus domains and should not depend on public norm validity.
- STAGE 5 INPUTS BLOCKED until exact tie handling, provisional focus copy, and interim meaningful-change behavior are resolved.

## 2. Baseline Validation And Repository Status

Required prior reports were reviewed before this audit, including Stage 0, Stage 1, Stage 1A, Stage 2, Stage 2A, Stage 2A.1, Stage 3, Stage 3A, Stage 3B, Stage 3C, and Stage 3C.1. The current working tree remained the source of truth.

No network lookup was performed. The prompt allowed network only if separately approved by the user; no separate approval was given. Source claims below are therefore repo-provenance assessments, not external scientific verification.

Initial status captured before analysis:

```text
$ git status --short --untracked-files=all
 M App.tsx
 M src/adherence/__tests__/adherence.test.ts
 M src/adherence/__tests__/blockServiceEligibility.test.ts
 M src/adherence/blockService.ts
 M src/adherence/screens/BlockReportScreen.tsx
 M src/adherence/types.ts
 M src/checkup/index.ts
 M src/pearlFlow/__tests__/appLifecycle.test.ts
 M src/pearlFlow/__tests__/assessmentEligibility.test.ts
 M src/pearlFlow/__tests__/pearlFlow.test.ts
 M src/pearlFlow/__tests__/progressViewModel.test.ts
 M src/pearlFlow/__tests__/sessionPlanning.test.ts
 M src/pearlFlow/appLifecycle.ts
 M src/pearlFlow/assessmentEligibility.ts
 M src/pearlFlow/assessmentResultState.ts
 M src/pearlFlow/assessments.ts
 M src/pearlFlow/index.ts
 M src/pearlFlow/progressViewModel.ts
 M src/pearlFlow/reports.ts
 M src/pearlFlow/types.ts
 M src/history/__tests__/history.test.ts
 M src/history/index.ts
 M src/history/serialize.ts
 M src/history/store.ts
 M src/onboarding/__tests__/onboarding.test.ts
 M src/onboarding/state.ts
 M src/scoring/index.ts
 M src/screens/CheckUpScreen.tsx
 M src/screens/OnboardingResultsScreen.tsx
 M src/screens/PlanScreen.tsx
 M src/screens/ProgressScreen.tsx
 M src/screens/ResultsScreen.tsx
 M src/screens/SettingsScreen.tsx
 M src/screens/TodayScreen.tsx
 M src/services/backend/__tests__/checkupSyncService.test.ts
 M src/services/backend/__tests__/restoreService.test.ts
 M src/services/backend/blockReportSyncService.ts
 M src/services/backend/checkupSyncService.ts
 M src/services/backend/restoreService.ts
?? docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3B.md
?? docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3C.md
?? docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_3C_1.md
?? docs/audits/Pearl_Stage_3B_Evidence_Officialness_Prompt.md
?? docs/audits/Pearl_Stage_3C_1_Versioned_Snapshot_Verification_Prompt.md
?? docs/audits/Pearl_Stage_3C_Scoring_Norm_Versioning_Prompt.md
?? docs/audits/Pearl_Stage_3D_Norm_Claims_Audit_Prompt.md
?? src/checkup/retry.ts
?? src/pearlFlow/__tests__/checkupHistory.test.ts
?? src/pearlFlow/assessmentEvidence.ts
?? src/pearlFlow/checkupHistory.ts
?? src/scoring/__tests__/scoreSnapshot.test.ts
?? src/scoring/scoreSnapshot.ts
?? src/scoring/versions.ts
```

```text
$ git diff --name-only
App.tsx
src/adherence/__tests__/adherence.test.ts
src/adherence/__tests__/blockServiceEligibility.test.ts
src/adherence/blockService.ts
src/adherence/screens/BlockReportScreen.tsx
src/adherence/types.ts
src/checkup/index.ts
src/pearlFlow/__tests__/appLifecycle.test.ts
src/pearlFlow/__tests__/assessmentEligibility.test.ts
src/pearlFlow/__tests__/pearlFlow.test.ts
src/pearlFlow/__tests__/progressViewModel.test.ts
src/pearlFlow/__tests__/sessionPlanning.test.ts
src/pearlFlow/appLifecycle.ts
src/pearlFlow/assessmentEligibility.ts
src/pearlFlow/assessmentResultState.ts
src/pearlFlow/assessments.ts
src/pearlFlow/index.ts
src/pearlFlow/progressViewModel.ts
src/pearlFlow/reports.ts
src/pearlFlow/types.ts
src/history/__tests__/history.test.ts
src/history/index.ts
src/history/serialize.ts
src/history/store.ts
src/onboarding/__tests__/onboarding.test.ts
src/onboarding/state.ts
src/scoring/index.ts
src/screens/CheckUpScreen.tsx
src/screens/OnboardingResultsScreen.tsx
src/screens/PlanScreen.tsx
src/screens/ProgressScreen.tsx
src/screens/ResultsScreen.tsx
src/screens/SettingsScreen.tsx
src/screens/TodayScreen.tsx
src/services/backend/__tests__/checkupSyncService.test.ts
src/services/backend/__tests__/restoreService.test.ts
src/services/backend/blockReportSyncService.ts
src/services/backend/checkupSyncService.ts
src/services/backend/restoreService.ts
```

```text
$ git diff --stat
 App.tsx                                            | 233 ++++++++----
 src/adherence/__tests__/adherence.test.ts          |  32 +-
 .../__tests__/blockServiceEligibility.test.ts      |  49 ++-
 src/adherence/blockService.ts                      |  14 +-
 src/adherence/screens/BlockReportScreen.tsx        |  22 +-
 src/adherence/types.ts                             |  29 +-
 src/checkup/index.ts                               |   1 +
 src/pearlFlow/__tests__/appLifecycle.test.ts        |  83 ++--
 .../__tests__/assessmentEligibility.test.ts        | 138 +++++--
 src/pearlFlow/__tests__/pearlFlow.test.ts            |  32 +-
 src/pearlFlow/__tests__/progressViewModel.test.ts   | 309 ++++++++++++++-
 src/pearlFlow/__tests__/sessionPlanning.test.ts     |  14 +-
 src/pearlFlow/appLifecycle.ts                       |  24 +-
 src/pearlFlow/assessmentEligibility.ts              | 183 +++++++--
 src/pearlFlow/assessmentResultState.ts              |  48 ++-
 src/pearlFlow/assessments.ts                        |  94 +++--
 src/pearlFlow/index.ts                              |   2 +
 src/pearlFlow/progressViewModel.ts                  | 124 ++++--
 src/pearlFlow/reports.ts                            |  67 +++-
 src/pearlFlow/types.ts                              |   3 +-
 src/history/__tests__/history.test.ts              |  90 ++++-
 src/history/index.ts                               |   2 +-
 src/history/serialize.ts                           | 100 ++++-
 src/history/store.ts                               |   6 +-
 src/onboarding/__tests__/onboarding.test.ts        |  59 ++-
 src/onboarding/state.ts                            |   8 +-
 src/scoring/index.ts                               |  27 ++
 src/screens/CheckUpScreen.tsx                      |   9 +-
 src/screens/OnboardingResultsScreen.tsx            |  46 ++-
 src/screens/PlanScreen.tsx                         | 280 ++++++++------
 src/screens/ProgressScreen.tsx                     | 419 +++++++++++++++++----
 src/screens/ResultsScreen.tsx                      |  36 +-
 src/screens/SettingsScreen.tsx                     |  46 ++-
 src/screens/TodayScreen.tsx                        | 328 ++++++----------
 .../backend/__tests__/checkupSyncService.test.ts   | 102 +++++
 .../backend/__tests__/restoreService.test.ts       | 148 +++++++-
 src/services/backend/blockReportSyncService.ts     |   1 +
 src/services/backend/checkupSyncService.ts         |  70 +++-
 src/services/backend/restoreService.ts             |  92 ++++-
 39 files changed, 2595 insertions(+), 775 deletions(-)
```

Validation commands:

| Command | Exit | Result | Notes |
| --- | ---: | --- | --- |
| `npm test -- --runInBand src/scoring/__tests__/scoring.test.ts src/scoring/__tests__/scoringInputValidation.test.ts src/scoring/__tests__/scoreSnapshot.test.ts src/pearlFlow/__tests__/assessmentEligibility.test.ts src/pearlFlow/__tests__/progressViewModel.test.ts src/pearlFlow/__tests__/checkupHistory.test.ts src/adherence/__tests__/blockServiceEligibility.test.ts src/adherence/__tests__/adherence.test.ts src/services/backend/__tests__/restoreService.test.ts src/services/backend/__tests__/checkupSyncService.test.ts` | 0 | 10 suites passed, 93 tests passed, 0 snapshots | Watchman recrawl warning present. Jest open-handle notice present. |
| `npm test -- --runInBand` | 0 | 83 suites passed, 566 tests passed, 0 snapshots | Prior Stage 3C.1 baseline was 83 suites / 564 tests. Watchman recrawl warning present. Jest open-handle notice present. Existing console warnings/logs from backend sync/session planning tests. |
| `npm run typecheck` | 2 | Failed | `App.tsx(117,31): error TS2307: Cannot find module './src/screens/ExploreScreen' or its corresponding type declarations.` During the audit, unrelated user-owned changes appeared: modified Explore view-model/copy tests and `src/screens/ExploreScreen.tsx` deleted from the worktree. This audit did not fix or revert it. |
| `npx --no-install expo config --type public` | 0 | Passed | Sentry warning: `[@sentry/react-native/expo] Missing config for organization, project. Environment variables will be used as a fallback during the build.` |
| `git diff --check` | 0 | Passed | No whitespace errors. |

Validation did not intentionally change files. The only intended repository change from this task is this report.

## 3. Current Scoring/Claim Architecture

Core call graph:

```text
raw Check-Up
  -> validateCheckUpForScoring
  -> scoreCheckUp / scoreCheckUpWithDiagnostics
  -> CheckUpScore with domains, rows, interpretations, weakestDomain
  -> toStoredScoreSnapshot
  -> createMovementAssessment
  -> assessment eligibility / official history
  -> Results screen, Onboarding results, Home/Today/Progress summaries
  -> createMovementBlockReport
  -> block focus and next-block recommendation
```

Current headline drivers:

| Domain | User label | Actual age driver | Supporting rows shown but not scored | Evidence |
| --- | --- | --- | --- | --- |
| Strength | `Strength & Power` / `Strength / Power` | 30-second chair-stand reps | Rise velocity, push-off flags indirectly logged elsewhere but not used in score | `src/scoring/scoring.ts:138-156` |
| Balance | `Balance` | Single-leg eyes-open seconds | TUG row when present; earlier ladder stages and sway are not age inputs | `src/scoring/scoring.ts:159-184` |
| Mobility | `Mobility` | Shoulder flexion peak degrees | Hinge reach/body-unit reach row | `src/scoring/scoring.ts:187-204` |

The scoring module explicitly states the intended mapping and that rise velocity and forward reach are detail rows, not age claims (`src/scoring/scoring.ts:1-15`). `CheckUpScore` stores domain age ranges, estimated flags, interpretation copy, metric rows, and a single `weakestDomain` (`src/scoring/scoring.ts:40-58`). Stage 3C snapshots freeze these fields and version metadata, which is sufficient to keep historical displays stable, but not sufficient to represent multiple tied focus domains, norm source identities beyond version integers, measurement reliability, or meaningful-change thresholds.

Official block focus path:

1. `createMovementAssessment` computes headline evidence completeness and only publishes an authoritative focus when all three headline domains are complete (`src/pearlFlow/assessments.ts:16-44`).
2. `getBlockCreationEligibility` requires a completed official assessment, complete headline evidence, a focus domain, finite focus measurement, a current compatible snapshot, and score/assessment source identity (`src/pearlFlow/assessmentEligibility.ts:42-118`).
3. `tryCreateMovementBlockFromAssessment` uses the eligibility focus domain as the block focus (`src/adherence/blockService.ts:47-74`).

Display paths:

| Display | Source | Recomputed? | Claim type |
| --- | --- | --- | --- |
| Results age ranges and interpretations | Current `CheckUpScore` / snapshot-restored score | Displayed directly | Movement-age claim |
| Progress latest evidence | Latest official historical snapshot score | Uses frozen score fields, recomputes band labels from midpoint | Movement-age and band claim |
| Progress raw metric cards | Raw stored Check-Up pair | Recomputed raw deltas | Improvement/decline claim independent of age snapshot |
| Block report domain changes | Previous/latest `CheckUpScore` midpoint ages | Recomputed from midpoint ages if snapshots compatible | Improvement/decline claim |
| Today snapshot | Latest lifecycle score bands | Recomputed from midpoint age bands | Performance-band claim |
| Onboarding result summaries | Baseline score bands | Recomputed from midpoint age bands | Performance-band and focus claim |

## 4. Norm Provenance Register

Repo-only verdict key:

- Stronger repo lead: enough citation metadata exists to find the source later.
- Incomplete repo provenance: the repo names a source family but not enough to verify exact table/protocol.
- NORMATIVE-DATA REVIEW REQUIRED: external source verification and product/science approval required before public claims.

| Norm/table | Metric | File/lines | Current input unit | Output | Source named in repo | Source quality | Age range | Sex stratified? | Population in repo | Estimated anchors? | Directly verified? | Used for official/user age? | Beta verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chair stand reps | 30s chair-stand repetitions | `src/scoring/norms.ts:40-67` | reps | inferred age range | Rikli & Jones Senior Fitness Test, 1999; Manual 2013 | Stronger repo lead, but exact table/protocol transformation not externally checked | Real 60-94; 45-59 estimates | Sex-pooled | Older adults / Senior Fitness Test population implied | 47/52/57 estimates | No, repo-only | Yes/yes | Beta-provisional only with beta estimate/caveat and source verification |
| TUG seconds | Timed Up and Go seconds | `src/scoring/norms.ts:69-89` | seconds | inferred age if used | Bohannon 2006 J Geriatr Phys Ther meta-analysis | Stronger repo lead, but not used in current official age | Real 60-99; under 60 estimates | Not described in repo | Meta-analysis means by decade | 50/55 estimates | No, repo-only | Norm not currently used for official score; TUG can appear supporting row | Keep hidden/supporting until room-fit and protocol validation |
| Single-leg stance | Single-leg eyes-open hold seconds | `src/scoring/norms.ts:91-113` | seconds | inferred balance age range | Bohannon 2006 Top Geriatr Rehabil meta-analysis | Stronger repo lead, but protocol mismatch risk is high | Real 60-99; under 60 estimates | Not described in repo | Individuals at least 60 years old | 50/55 estimates | No, repo-only | Yes/yes | Beta-blocked for age claims until protocol/norm alignment reviewed |
| Shoulder flexion ROM | active shoulder flexion degrees | `src/scoring/norms.ts:115-135` | degrees | inferred mobility age range | "Norkin & White; aging ROM literature" | Incomplete repo provenance | No real range; whole table estimated | Not described | Sparse age-specific literature only | Whole table estimated | No, repo-only | Yes/yes | Beta-blocked for age claims unless displayed as broad provisional band |
| Domain band thresholds | midpoint age -> strong/building/starting point | `src/pearlFlow/progressViewModel.ts:420-424`; similar lifecycle/onboarding logic | midpoint age | band | No external source | Product heuristic | N/A | N/A | N/A | N/A | No | Yes/yes | Safe only as product bands with caveat, not normative truth |
| Meaningful-change thresholds | raw/age deltas -> improved/held/lower | `src/pearlFlow/reports.ts:140-145`; `src/pearlFlow/progressViewModel.ts:272-346` | years, reps, seconds, degrees, body units | trend labels | No external source | Product heuristic | N/A | N/A | N/A | N/A | No | Yes/yes | Beta-blocked for improvement/decline claims until repeatability policy |

External-source verification checklist:

- Obtain the exact Rikli & Jones table used, including sex/age bins, normal ranges, midpoint derivation, and protocol instructions.
- Verify whether sex-pooling is acceptable when the app may have age but no sex.
- Verify whether 45-59 extrapolation is scientifically acceptable or should be hidden/labelled as extrapolated estimates.
- Obtain the exact Bohannon single-limb stance table, truncation rules, eyes-open protocol, and whether max trial duration matches Pearl's 12-second stage.
- Resolve the mismatch between Pearl's 12-second single-leg stage and norm anchors of 27-35 seconds.
- Obtain exact shoulder flexion age-specific active-ROM data or remove age mapping for mobility.
- Confirm whether home camera measurement protocols match published clinical protocols closely enough for "typical age" language.
- Produce a short norm provenance document with source tables, transformations, and product-approved caveats.

## 5. Strength/Power Domain Audit

Current behavior:

- Headline age metric: chair-stand reps (`src/scoring/scoring.ts:138-156`).
- Supporting metric: rise velocity, displayed to two decimals in body units/sec when present (`src/scoring/scoring.ts:148-151`).
- Push-off/assistance flags do not affect official interpretation in current scoring.
- Label: "Strength & Power" / "Strength / Power".

Assessment:

| Dimension | Verdict |
| --- | --- |
| Software consistency | Consistent: chair-stand reps drive age; velocity is supporting only. |
| Product-label risk | Medium: "Power" is implied by the label and copy, but rise velocity does not drive the age. Chair-stand reps support lower-body function/strength-endurance more directly than power. |
| Normative-data risk | Medium: source lead is plausible and citation metadata is better than other tables, but ages 45-59 are extrapolated and sex-pooled. |
| Protocol risk | Medium: home camera chair protocol, chair height, arm use, and camera counting must be validated against the clinical 30-second chair stand protocol. |
| Device-validation dependency | High for rep count and rise velocity; age claim should not depend on velocity yet. |
| Beta verdict | Beta-provisional if displayed as "home movement estimate" or band. Not ready as authoritative "strength/power age". |

Recommendation: rename or clarify as "Chair-rise strength" for age interpretation, with "rise velocity" presented separately as a beta trend metric. Keep training focus usable because sit-to-stand performance is a defensible domain signal, but soften claims about power.

## 6. Balance Domain Audit

Current behavior:

- Headline age metric: `singleLegEyesOpenSec` only (`src/scoring/scoring.ts:159-184`).
- Earlier ladder stages, sway proxy, eyes-closed stages, and TUG do not affect balance age.
- TUG can display as a row if present (`src/scoring/scoring.ts:163-170`).
- If single-leg hold is under 8 seconds, interpretation adds "Holding a one-leg stand was tricky - a good thing to practise." (`src/scoring/scoring.ts:180-183`).

Critical finding: the production balance stage caps single-leg eyes-open at 12 seconds (`src/movements/balanceLadder.ts:80-84`), while the norm table anchors are 35 seconds at age 50, 31 seconds at age 55, and 27 seconds at age 65 (`src/scoring/norms.ts:102-107`). This means a user who completes Pearl's full valid 12-second single-leg stage cannot reach a young/strong balance age in the current norm inversion. A valid "perfect" Pearl balance trial can still map near the oldest norm region. This is a major trust risk.

Assessment:

| Dimension | Verdict |
| --- | --- |
| Software consistency | Internally consistent but scientifically fragile: single-leg seconds drive the age. |
| Product-label risk | High: "Balance" suggests a broad balance domain, but current age is static single-leg hold only. |
| Normative-data risk | High: the source population begins at 60, younger anchors are extrapolated, and the current 12-second cap conflicts with source-scale values. |
| Protocol risk | High: trial duration, termination, safety stance, and home camera subject-gone behavior can distort the result. |
| Device-validation dependency | High: hold timing and tracking interruptions need real-device validation. |
| Beta verdict | Beta-blocked for balance-age claims. Can remain a training focus signal only if reframed as "balance hold area to practice" and if the cap/norm mismatch is resolved or age hidden. |

Recommendation: do not display balance movement-age ranges in beta until the protocol duration and norm mapping are reconciled. Use raw hold seconds and a provisional band instead.

## 7. Mobility Domain Audit

Current behavior:

- Headline age metric: shoulder flexion peak degrees only (`src/scoring/scoring.ts:187-204`).
- Hinge reach is displayed as "Forward reach to floor" but does not affect mobility age.
- The shoulder flexion norm is explicitly estimated across all ages (`src/scoring/norms.ts:115-135`).

Assessment:

| Dimension | Verdict |
| --- | --- |
| Software consistency | Consistent: shoulder flexion drives age; hinge is supporting only. |
| Product-label risk | High: "Mobility" sounds whole-body, but age is shoulder-only. The interpretation says "shoulder and trunk mobility" even though trunk/hinge does not drive the age (`src/scoring/scoring.ts:75-79`). |
| Normative-data risk | High: the whole table is estimated and source provenance is too vague. |
| Protocol risk | High: shoulder angle depends on phone placement, side selection, clothing, torso posture, and whether the user compensates. |
| Device-validation dependency | High: shoulder angle repeatability is unresolved; hinge reach repeatability and body-unit stability are unresolved. |
| Beta verdict | Beta-blocked for mobility-age claims. Provisional mobility band can be used only with clear "beta estimate" language. |

Recommendation: do not call this a "mobility age" in beta. Prefer "shoulder reach estimate" plus a separate "forward reach" row. Hinge reach should remain supporting-only until a product decision either creates a separate mobility sub-card or adds it to a validated composite.

## 8. TUG Historical/Supporting Audit

TUG has a norm table in `src/scoring/norms.ts:69-89`, but `scoreCheckUp` does not import or use `TUG_SECONDS_NORM` for official age. TUG can still appear as an "Up-and-go time" row when a historical/current Check-Up has TUG input (`src/scoring/scoring.ts:159-170`). Progress tests also assert the official V1 Check-Up battery is free of Up and Go.

Verdict: keep TUG hidden/supporting for beta. It should not contribute to age claims, weakest-domain selection, or training focus until room-fit, non-standard short-path, turn detection, and real-device timing are validated. If historical TUG rows appear, label them as supporting measurements, not age evidence.

## 9. Movement-Age Claim Register

Claim classifications: safe as-is, safe if softened, safe only with beta/provisional label, should be hidden until validation, should be removed.

| # | Claim/copy | Location | Trigger | Source data | Evidence strength | Missing caveat | Risk | Classification | Recommended action |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | "Typical age ranges from today's guided check-up" | `src/screens/ResultsScreen.tsx:57-61` | Any scored Results | `CheckUpScore.domains` | Medium software, incomplete norm | Beta/home estimate | Norm overclaim | Beta-label | Add beta estimate / home estimate caveat or use bands |
| 2 | "Typical of age X-Y" | `src/screens/ResultsScreen.tsx:159-163` | Measured domain | Frozen score age range | Varies by domain | Domain-specific provenance | False precision | Beta-label | Keep only with "beta estimate"; hide balance/mobility ages until remediated |
| 3 | "Where to focus next... most useful area" | `src/screens/ResultsScreen.tsx:64-70` | Complete eligible result | `weakestDomain` | Software consistent | Tie/near-tie uncertainty | Overconfident focus | Soften | "Suggested focus" and tie-aware copy |
| 4 | "Small changes matter most..." | `src/screens/ResultsScreen.tsx:101-106` | Trends present | Raw trend deltas | Low until repeatability | Noise threshold | Encourages tiny deltas | Soften | Neutral trend copy until thresholds |
| 5 | Trend labels "improving/stable/watch" | `src/screens/ResultsScreen.tsx:182-207` | Any trend delta | Raw deltas | Low | Meaningful-change threshold | Tiny delta claim | Soften | Require threshold or neutral "changed" |
| 6 | "Camera measured" | `src/screens/ProgressScreen.tsx:121-129` | Latest official score | Snapshot score | Medium | Home estimate/device beta | Too official | Soften | "Camera estimated" |
| 7 | "Typical ages" / "Estimated typical ages" | `src/pearlFlow/progressViewModel.ts:402-407` | Latest evidence | Snapshot age range | Varies | Beta label and provenance | Norm overclaim | Beta-label | Use "Beta estimated range" |
| 8 | "Main opportunity: Domain" | `src/pearlFlow/progressViewModel.ts:464-468` | Latest score | `weakestDomain` | Medium | tie/near-tie | Overconfident | Soften | "Suggested focus" or "closely matched" |
| 9 | "Compares official Movement Check-Ups using same scoring version" | `src/screens/ProgressScreen.tsx:177-186` | >=2 official checkups | Snapshot compatibility | Good software | Same-version still lacks repeatability | False confidence | Soften | Add "not all changes are meaningful" |
| 10 | "That's N more strong rises" | `src/pearlFlow/progressViewModel.ts:272-283` | Chair reps delta >0 | Raw reps | Medium | smallest detectable change | Improvement overclaim if 1 rep not reliable | Soften | Use threshold or "more reps recorded" |
| 11 | "That's N more steady seconds" | `src/pearlFlow/progressViewModel.ts:302-313` | Balance delta >0 | Raw hold seconds | Low-medium | hold repeatability | "steady" overclaim | Soften | Use threshold and raw copy |
| 12 | "Your mobility check is improving" | `src/pearlFlow/progressViewModel.ts:332-346` | Shoulder >0 deg or reach >0.01 bu | Raw shoulder/hinge | Low | repeatability | Tiny metric overclaim | Soften | Neutral until threshold |
| 13 | Report "Improved/Held steady/Adjusted" | `src/adherence/screens/BlockReportScreen.tsx:122-137` | Compatible score pair | Age midpoints | Good software, no threshold | meaningful change | Tiny age claim | Soften | Add threshold or neutral comparison |
| 14 | "Main improvement" | `src/adherence/screens/BlockReportScreen.tsx:69-72` | Any improved domain | Domain changes | Low without threshold | improvement threshold | Overstates block effect | Soften | "What changed" not "improvement" unless threshold |
| 15 | "will focus on nextFocus" | `src/adherence/screens/BlockReportScreen.tsx:74-80` | Report/next block | latest `weakestDomain` | Medium | tie/near-tie | Deterministic tie hidden | Beta-label | "Suggested next focus" |
| 16 | "protects progress" / "stay capable" | `src/adherence/screens/BlockReportScreen.tsx:83-91`; `src/pearlFlow/copy.ts:102-106` | Goal/report/adherence | Training state | Low-med | no guarantee | Capability promise | Soften | "supports the progress you are working on" |
| 17 | "Your main opportunity" | `src/screens/OnboardingResultsScreen.tsx:49-55` | Baseline complete | score focus | Medium | tie/near-tie, beta | Overconfident | Soften | "Suggested first focus" |
| 18 | Onboarding band rows | `src/screens/OnboardingResultsScreen.tsx:67-78` | Baseline score | age midpoint bands | Low-med | band provenance | Norm heuristic hidden | Beta-label | "Beta estimate" label or no age-derived band |
| 19 | "re-test in 4 weeks to see what changed" | `src/screens/OnboardingResultsScreen.tsx:81-89` | Block creation | future comparison | Low | meaningful threshold | implies detectable change | Soften | "to add another data point" |
| 20 | Today "Movement snapshot" bands | `src/screens/TodayScreen.tsx:134-159` | lifecycle snapshot | midpoint bands | Low-med | beta/band source | authoritative band | Beta-label | "Snapshot estimate" |
| 21 | "simple plan for becoming stronger, steadier, and more mobile" | `src/screens/PlanScreen.tsx:83-85` | No goal | generic plan | Aspirational | no guarantee | Low | Safe as-is | Keep as wellness aspiration |
| 22 | "area Pearl measured first" | `src/screens/PlanScreen.tsx:254-260` | Active block | active focus | Incorrect | should be weakest/focus area | Misleading | Remove | Replace in future remediation |
| 23 | "validated movement tests, not clinical advice" | `src/screens/HomeScreen.tsx:293-310` | Key indicators | score domains | Mixed | source/device validation | "validated" overstates app implementation | Soften | "published movement tests" / "not medical advice" |
| 24 | "measure strength, balance, and mobility and build your first plan" | `src/pearlFlow/copy.ts:47-53` | First baseline CTA | planned scoring | Medium | beta estimate/camera limitation | Broad measurement claim | Soften | "estimate" or "check" |
| 25 | "not medical care" | `src/screens/SafetyProfileScreen.tsx:122` | Safety profile | static copy | Strong | none | Low | Safe as-is | Keep |
| 26 | "personalised 4-week plan to help you protect your movement" | `src/screens/WelcomeScreen.tsx:28` | Welcome | product promise | Medium | provisional measurement | Promise creep | Soften | "built from your check-up" and "support" |
| 27 | Family mock `movementAge` | `src/family/fixture.ts:18-59` | Mock family fixture | placeholder data | Low | mock/provisional | Public mock normative age | Hide | Hide or label mock-only until real data policy |

Claim count: 27. Classification count: safe as-is 2, safe if softened 15, beta/provisional label 7, hide until validation 2, remove 1.

## 10. Precision And Display Audit

| Displayed value | Actual calculation | Precision shown | Precision justified? | Recommended beta display |
| --- | --- | --- | --- | --- |
| Results age range | `round(inferred age +/- 4)` or `+/- 6` if estimated | Whole-year range | Partly for strength; not for balance/mobility until review | "Beta estimated range" for strength; hide or band for balance/mobility |
| Domain interpretation "early/mid/late Ns" | Unrounded inferred age phrase | Decade phrase | Softer than exact but still normative | Keep only with beta estimate caveat |
| Progress evidence age label | Rounded snapshot range | Whole-year range | Same as above | "Beta estimated range" or band |
| Today movement snapshot | Midpoint thresholds <=58, <=72, >72 | Category | Product heuristic, not sourced | Keep as "snapshot estimate" bands if age hidden |
| Onboarding summaries | Same band thresholds | Category | Product heuristic | Keep if beta-labelled and not "age" |
| Report domain change | Midpoint difference, any amount | Direction only | Not justified | Neutral until threshold |
| Results raw trends | Raw history deltas, to 0 or 2 decimals | Fine numeric delta | Often too precise | Display rounded raw metric but avoid "improving" unless threshold |
| Strength progress card | integer reps delta | Integer reps | Plausible but repeatability unknown | "more reps recorded" or threshold-based improvement |
| Balance progress card | rounded seconds, hold steady if abs(delta)<0.5 except positive deltas always improved | Seconds | Inconsistent; 0.1 sec positive can improve before rounding | Threshold from repeatability |
| Mobility progress card | shoulder degrees rounded; hinge BU to 2 decimals | Degrees/body units | Not validated; 0.01 bu threshold likely arbitrary | Threshold from repeatability |

Movement-age display recommendation: for beta, do not use exact point ages. Prefer performance bands for all users and optional "beta estimated age range" only after norm provenance review. If age remains, display ranges only, never midpoint, and mark all ranges as beta home estimates. Balance and mobility should not show age ranges until their specific blockers are resolved.

Snapshot sufficiency: current snapshots preserve enough user-facing score text/rows to avoid historical rescoring, but not enough to support future tie-aware displays, reliability/confidence per domain, source citation identifiers, or meaningful-change thresholds without new schema fields.

## 11. Weakest-Domain Exact Tie And Near-Tie Audit

Current algorithm:

- Domain order is `[strength, balance, mobility]` (`src/scoring/scoring.ts:207-220`).
- The loop updates focus only on `mid > oldest`, not `>=` (`src/scoring/scoring.ts:213-219`).
- Exact ties preserve the first domain in iteration order.
- Therefore, exact tie priority is strength over balance over mobility; balance over mobility if strength is lower.
- Snapshots store one `weakestDomain`, not multiple tied domains.
- Assessments and blocks map one score domain to one movement domain, so current block creation cannot represent joint focus.

Deterministic diagnostics:

1. Using actual `scoreCheckUp` with valid current protocol inputs, strength and balance can be clearly weakest. Mobility cannot currently be "clearly weakest" in a complete valid score because mobility age clamps at 80 while balance's 12-second protocol cap tends to keep balance near 80-85. This is itself a product finding.
2. Using existing snapshot helpers and synthetic `CheckUpScore` objects, exact tie and block propagation were tested without code changes:

| Case | Midpoints | Current weakest | Snapshot restore | Assessment focus | Block focus |
| --- | --- | --- | --- | --- | --- |
| Strength clearly weakest | S 80, B 60, M 58 | strength | strength | strength_power | strength_power |
| Balance clearly weakest | S 60, B 80, M 58 | balance | balance | balance | balance |
| Mobility clearly weakest | S 60, B 58, M 80 | mobility | mobility | mobility | mobility |
| Strength/balance tie | S 80, B 80, M 58 | strength | strength | strength_power | strength_power |
| Strength/mobility tie | S 80, B 58, M 80 | strength | strength | strength_power | strength_power |
| Balance/mobility tie | S 58, B 80, M 80 | balance | balance | balance | balance |
| Three-way tie | S 80, B 80, M 80 | strength | strength | strength_power | strength_power |
| Near tie, display-rounded equal | S 70.4, B 70.2, M 60 | strength | strength | strength_power | strength_power |
| Near tie likely below noise | S 70.2, B 71.1, M 60 | balance | balance | balance | balance |

Decision options:

| Option | Pros | Cons |
| --- | --- | --- |
| Fixed priority | Simple, current-compatible | Hidden bias, especially toward strength |
| Preserve current block focus | Stable month-to-month | Can ignore new equal evidence |
| Joint focus | Honest for ties | Requires block/planner/UI support |
| Balanced block | Good V1 fallback | Requires product decision and planner handling |
| Ask the user | Transparent | Adds choice burden and may undermine camera trust |
| Choose strongest evidence/reliability | Scientifically appealing | Requires reliability fields not currently stored |
| No block until retest | Conservative | Bad UX; unnecessary for wellness app |

Recommended V1 exact tie policy: balanced or preserve-current-focus. For the first block, choose a balanced V1 default if exact tie or all domains are within a product-approved near-tie margin. For re-tests, preserve current block focus unless one domain exceeds the margin. If balanced blocks are too large a change, keep fixed priority only as an explicit documented product rule and surface "closely matched" copy.

Recommended near-tie policy: do not define a numerical near-tie margin from age years before device repeatability data. Interim beta should show "closely matched" when age midpoints differ by less than a conservative temporary margin, but should not change focus based on sub-threshold differences. Final margin should be domain-specific and repeatability-derived.

## 12. Meaningful-Change And Improvement/Decline Audit

Current report logic:

- `createMovementBlockReport` only compares when snapshots are compatible and source endpoints match (`src/pearlFlow/reports.ts:44-68`).
- For compatible pairs, it computes midpoint age per domain (`src/pearlFlow/reports.ts:118-137`).
- `current < previous` means improved, exact equality means held steady, and any greater value means declined (`src/pearlFlow/reports.ts:140-145`).
- The Block Report screen independently uses the same midpoint logic and labels greater values "Adjusted for next block" (`src/adherence/screens/BlockReportScreen.tsx:122-137`).

Current progress-card logic:

- Strength: any positive rep delta is improved, exactly zero held steady, any negative lower (`src/pearlFlow/progressViewModel.ts:258-284`).
- Balance: any positive seconds delta is improved, absolute delta under 0.5 is held steady only when non-positive, otherwise lower (`src/pearlFlow/progressViewModel.ts:287-314`).
- Mobility: shoulder delta >0 or hinge reach improvement >0.01 bu is improved; any shoulder decrease or reach decrease below -0.01 is lower (`src/pearlFlow/progressViewModel.ts:317-347`).
- Balance progress cards may prefer tandem hold over single-leg hold (`src/pearlFlow/progressViewModel.ts:373-380`), while balance age uses single-leg only. Hinge can drive mobility progress while mobility age ignores hinge.

Examples from current rules:

| Example | Current result | Risk |
| --- | --- | --- |
| 0.1-year age midpoint decrease | improved | Far below likely measurement/norm precision |
| 0.49-year decrease | improved | Still below any validated smallest detectable change |
| 0.5-year decrease | improved | No threshold basis |
| 1-year decrease | improved | Maybe meaningful, but not yet validated |
| Boundary crossing 58.1 -> 57.9 | improved and may change band | Threshold artifact |
| One domain improves, another worsens | report picks first improved for main change | Can hide mixed result |
| Supporting metric improves but headline age unchanged | Progress says improved, age report says held | Inconsistent user story |
| Headline age improves from tiny raw metric change | Report says improved | False precision |
| Chair velocity changes but reps unchanged | Strength age unchanged; raw trend may show velocity | Power story conflicts |
| Hinge improves but shoulder unchanged | Progress mobility can improve; mobility age unchanged | "Mobility" conflict |

Recommended V1 beta policy: until repeatability data exists, reports should use neutral comparison language ("recorded higher/lower/similar") or "no clear change" unless a conservative provisional threshold is met. Public "improved", "declined", and "held steady" should require domain-specific smallest-detectable-change thresholds. For beta, a practical interim policy is:

- Strength: do not call improvement for less than +2 chair stands unless repeated.
- Balance: do not call improvement for less than a repeatability-derived seconds threshold; 0.5 seconds is too small for a home camera claim.
- Mobility: do not call improvement for less than a repeatability-derived degree/body-unit threshold.
- Age midpoint: do not use sub-5-year differences for user-facing improvement until norm and device precision are reviewed.
- Prefer "similar to last time" for small deltas.

## 13. Physical-Device Dependency Map

| Claim/metric | Device validation needed | Why static tests are insufficient | Minimum experiment | Blocks beta? |
| --- | --- | --- | --- | --- |
| Chair-stand rep count | Home camera repeatability vs manual count across chairs/body types | Synthetic/replay tests do not cover clutter, chair height, arm use, lighting | 20-30 target users or recordings, 2 repeats, manual video count comparison | Blocks authoritative age; not provisional focus |
| Rise velocity | Hip midpoint velocity repeatability across setup distance/body-unit calibration | Unit tests cannot prove camera setup longitudinal stability | Same users repeat chair stand with repositioned phone; estimate within-subject SD | Blocks power claims and velocity trend |
| Balance hold | Stage timing, touchdown detection, subject-gone resets | Static tests do not capture small foot taps, occlusion, counter support | Repeated holds with manual annotated touchdown and interruptions | Blocks balance age/improvement |
| Balance norm duration | 12-second cap vs 27-35 second norm anchors | Code can be correct while protocol invalid | Protocol review plus alternate full-duration trial pilot | Blocks balance age |
| Shoulder flexion | Angle repeatability across side, clothing, torso compensation, phone height | Synthetic ROM lacks real occlusion/compensation | 2-3 repeated captures per user; compare to manual/goniometer proxy | Blocks mobility age |
| Hinge reach | Body-unit stability and wrist/floor estimation | Replay cannot prove floor/camera calibration | Repeat hinge captures across phone placement; manual reach proxy | Blocks hinge trend claims |
| Camera orientation/framing | Side/front readiness thresholds | Unit tests cannot cover homes | Device matrix and guided setup trials | Blocks public beta confidence |
| Near-tie margin | Domain score repeatability | No code-only way to infer noise | Test-retest SD per domain and focus flip rate | Blocks Stage 5 inputs |
| Meaningful-change thresholds | Smallest detectable change per metric | Any-threshold code is arbitrary | Repeat baseline over short interval; derive MDC or conservative heuristic | Blocks improvement/decline claims |

## 14. Legal/Medical-Claims Risk Audit

The repository largely avoids explicit diagnosis, fall-risk, disease, and treatment language. The main risk is not medical wording but confidence drift: "validated", "movement age", "protect progress", and "improved" can imply a stronger clinical or longitudinal conclusion than the app can currently support.

| Copy/claim | Location | Risk type | Severity | Safer framing |
| --- | --- | --- | --- | --- |
| "validated movement tests" | `src/screens/HomeScreen.tsx:293-310` | Medical/clinical aura | Medium | "published movement tests" plus beta home estimate |
| "Typical of age X-Y" | `src/screens/ResultsScreen.tsx:159-163` | Normative/clinical precision | High | "Beta home movement estimate: X-Y" or band |
| "Camera measured" | `src/screens/ProgressScreen.tsx:121-129` | Medical-grade measurement implication | Medium | "Camera estimated" |
| "most useful area" | `src/screens/ResultsScreen.tsx:64-70` | Personalized certainty | Medium | "Suggested area to focus on" |
| "Main improvement" | `src/adherence/screens/BlockReportScreen.tsx:69-72` | Causal/progress claim | High | "What changed" |
| "protects progress" | `src/adherence/screens/BlockReportScreen.tsx:83-91` | Guaranteed preservation | Medium | "supports the progress you are working on" |
| "stay capable" | `src/adherence/screens/BlockReportScreen.tsx:89-90` | Independence preservation implication | Medium | "support everyday movement" |
| Family mock movement age | `src/family/fixture.ts:18-59` | False personal health data | Medium | Hide or clearly mock/prototype |

No current audited copy uses "fall risk", "frailty diagnosis", "medical-grade", "treatment", or disease-prevention claims. Keep the safety copy "Pearl is not medical care" as-is.

## 15. Existing-Test And False-Confidence Analysis

Relevant tests inspected:

- `src/scoring/__tests__/scoring.test.ts`
- `src/scoring/__tests__/scoringInputValidation.test.ts`
- `src/scoring/__tests__/scoreSnapshot.test.ts`
- `src/pearlFlow/__tests__/assessmentEligibility.test.ts`
- `src/pearlFlow/__tests__/progressViewModel.test.ts`
- `src/pearlFlow/__tests__/checkupHistory.test.ts`
- `src/adherence/__tests__/blockServiceEligibility.test.ts`
- `src/adherence/__tests__/adherence.test.ts`
- `src/services/backend/__tests__/checkupSyncService.test.ts`
- `src/services/backend/__tests__/restoreService.test.ts`
- copy guardrail tests including Pearl flow/adherence/preflight/exercise copy tests.

What tests cover well:

- Norm inversion behavior for current tables.
- Estimated shoulder flag is always true.
- Scoring emits ranges and no obvious banned medical terms.
- Hinge does not score mobility when shoulder is absent.
- Incomplete/invalid official scores cannot create blocks.
- Snapshots are versioned and incompatible comparisons are withheld.
- Source mismatch fail-closed paths exist.
- Copy tests guard against banned phrases such as diagnosis/fall-risk/streak language.

False-confidence gaps:

- No test asserts exact tie behavior or makes it an explicit product contract.
- No test checks near-tie behavior or focus flip risk.
- No test asserts that the 12-second balance cap conflicts with the single-leg stance norm anchors.
- No test fails when tiny age midpoint differences produce "improved" or "declined".
- No test checks that hinge can drive progress while not driving mobility age.
- No result-screen tests verify movement-age precision/caveats.
- Copy guardrails catch banned medical words, but not overconfident evidence claims like "validated", "measured", "protect", or "improved".

Tests likely to change during remediation:

- Scoring tests for tie policy and estimated age display.
- Progress view-model tests for meaningful-change thresholds.
- Block report tests for neutral comparison copy.
- Copy guardrail tests expanded to evidence-confidence terms.
- Result/Progress/Home/Onboarding screen tests for beta labels or hidden movement-age display.
- Assessment/block eligibility tests if balanced or joint focus is added.

## 16. Product-Decision Packet

### Decision A: Keep or hide movement ages

Current behavior: shows age ranges and "typical age" language in Results and Progress.

Recommendation: replace primary display with performance bands for beta. Optionally show beta-estimated age ranges behind caveat only after norm provenance review. Balance and mobility ages should be hidden until their blockers are resolved.

Implementation impact: copy/UI changes in Results, Progress, Home, Today, Onboarding results; snapshot compatibility can preserve historical ranges.

Beta blocker: yes for public movement-age claims.

### Decision B: Domain label accuracy

Current behavior: Strength/Power, Balance, Mobility.

Recommendation:

- Strength/Power: keep for training domain, but age claim should say chair-rise strength or lower-body function. Do not imply rise velocity drives the age.
- Balance: keep as training domain, but result claim should say one-leg balance hold.
- Mobility: keep as training domain, but result claim should say shoulder reach estimate plus forward reach detail.

Implementation impact: copy/view-model label refinements.

Beta blocker: yes for age labels, not for internal training domain names.

### Decision C: Shoulder-flexion estimated norm

Current behavior: shoulder flexion drives mobility age and is always estimated.

Recommendation: remove from headline age display for beta or label as a broad beta estimate. Require external norm review before public mobility age.

Implementation impact: display policy and maybe scoring output flags.

Beta blocker: yes for mobility age.

### Decision D: Hinge reach role

Current behavior: supporting row and progress input, not age input.

Recommendation: keep supporting-only, but visually separate from the mobility age. If hinge remains in progress, copy should say "forward reach changed", not "mobility improved", unless a composite policy is approved.

Implementation impact: Progress/Results copy and maybe card layout.

Beta blocker: not if softened.

### Decision E: Exact ties

Current behavior: implicit fixed priority by domain order.

Recommendation: for V1, preserve current block focus on re-test ties; use a balanced first block or explicit product default for baseline exact ties. Document the rule and surface "closely matched" copy.

Implementation impact: scoring snapshot schema may need tied domains or tie metadata; planner may need balanced focus support.

Beta blocker: yes for Stage 5 correctness.

### Decision F: Near ties

Current behavior: no near-tie margin.

Recommendation: wait for device repeatability data before final margin. Interim beta should not flip focus on sub-threshold differences; show closely matched copy.

Implementation impact: threshold config and focus selection logic.

Beta blocker: yes for confident focus changes.

### Decision G: Improvement/decline claims

Current behavior: any numerical age midpoint difference or raw metric direction can trigger improved/lower.

Recommendation: neutral comparison copy until thresholds exist. Use "recorded higher/lower/similar" for raw metrics; reserve "improved" for validated threshold crossings.

Implementation impact: reports, Progress, Results trends, adherence milestones.

Beta blocker: yes for progress claims.

### Decision H: Norm provenance before public beta

Current behavior: source names in comments.

Recommendation: create a source-verification artifact with exact table values, source scans/citations, transformations, extrapolation policy, protocol match, and product-approved caveats.

Implementation impact: docs and code comments; maybe source identifiers in snapshots.

Beta blocker: yes for public norm claims.

### Decision I: What remains safe to use for training focus

Current behavior: complete official score's single weakest domain creates the block.

Recommendation: safe as a provisional wellness focus if copy is softened and tie/near-tie policy is resolved. Training generation does not require public "age" claims; it needs a domain signal and conservative exercise choices.

Implementation impact: Stage 5 can proceed after focus semantics are explicit.

Beta blocker: Stage 5 inputs blocked until tie and provisional focus rules land.

### Decision J: What must be shown to beta users

Recommendation: show "home movement estimate", "beta estimate", "not a medical assessment", "not a diagnosis", and "small changes may reflect setup/noise; Pearl looks for repeatable change over time." Avoid "medical-grade", "clinical result", "fall risk", "guaranteed independence", and authoritative age labels.

Implementation impact: global result/progress/report caveats and copy guardrails.

Beta blocker: yes for external beta trust.

## 17. Recommended Stage 3D Remediation Batches

| Batch | Findings addressed | Files likely involved | Tests required | Product decision required | Beta blocker? |
| --- | --- | --- | --- | --- | --- |
| Stage 3D-A: movement-age display/copy softening | Movement-age precision, "measured", "validated", focus overconfidence | Results, Progress, Home, Today, Onboarding results, copy files | Screen/view-model copy tests, guardrails | Decision A/B/J | Yes |
| Stage 3D-B: norm provenance documentation/source verification | F3-005 source quality, external verification checklist | docs, `src/scoring/norms.ts`, maybe source metadata | Norm source metadata tests if added | Decision H | Yes for public beta |
| Stage 3D-C: exact tie policy | F3-007 exact ties, snapshot single focus | scoring, score snapshots, assessment/block eligibility, planner | tie unit tests, snapshot restore tests, block creation tests | Decision E | Yes for Stage 5 |
| Stage 3D-D: near-tie and meaningful-change policy | F3-008, focus flips, report/progress claims | scoring/view models/reports/adherence milestones | threshold tests and mixed-domain cases | Decision F/G plus device data | Yes for progress claims |
| Stage 3D-E: report/progress claim neutralization | Tiny deltas, mixed signals, supporting vs headline metric mismatch | `progressViewModel`, `reports`, BlockReportScreen, Results trends | report/progress copy tests | Decision G | Yes |
| Stage 3D-F: medical/evidence copy hardening | "validated", "protects", mock movement age, family fixture | Home, Welcome, Plan, Family, adherence copy, guardrails | copy guardrail expansion | Decision J | Public beta yes |

## 18. Stage 4 And Stage 5 Unblock Analysis

Stage 4 can proceed because exercise-catalogue and progression auditing can evaluate whether exercises match the intended strength/balance/mobility training domains, regressions, safety, and zero-equipment rules without relying on public movement-age validity. Stage 4 should treat focus domains as provisional and should not claim beta readiness.

Stage 5 should not proceed as a correctness audit yet because dynamic workout generation depends on the focus domain. The current focus can be biased by exact ties, near ties, the balance protocol/norm mismatch, and the absence of a meaningful-change policy. Stage 5 may inspect architecture later, but "inputs ready" is false until Stage 3D-C and the interim Stage 3D-D policy are complete.

Minimum remediation before Stage 5 correctness:

- Explicit exact tie policy.
- Interim near-tie policy or "preserve current focus" rule.
- Provisional focus copy and no authoritative movement-age dependency.
- Decision on whether balance's current capped single-leg score can drive focus or must be banded/reframed.
- Neutral report/progress comparisons so generation is not justified by unsupported "improved/declined" labels.

Norm provenance must be resolved before public beta, even if Stage 4/5 audits can proceed internally.

## 19. Final Stage Decisions

- STAGE 3D REMEDIATION REQUIRED.
- STAGE 4 UNBLOCKED.
- STAGE 5 INPUTS BLOCKED.

Acceptance criteria status:

| Criterion | Status |
| --- | --- |
| Every current norm table inventoried | Complete: 4 `AgeNorm` tables plus band/change heuristics |
| Norm source/provenance assessed | Complete repo-only assessment |
| Estimated tables/anchors identified | Complete |
| Domain labels evaluated against drivers | Complete |
| Movement-age claims registered | Complete: 27 claims |
| Improvement/decline paths registered | Complete |
| Tie/near-tie current behavior established | Complete |
| Meaningful-change current behavior established | Complete |
| Physical-device dependencies mapped | Complete |
| Medical/legal risks identified | Complete |
| Existing tests audited | Complete |
| Product-decision packet complete | Complete |
| Stage 4/5 status explicit | Complete |
| No production code/tests/norms/copy changed | Complete, except this report file |
| Full validation pass/failure documented | Complete |
| Final Git status recorded | Complete |

## 20. Final Git Status

After this report was written, final status showed the expected new untracked audit report plus the pre-existing/user-owned working-tree changes. Additional user-owned Explore-related files that appeared during the audit are present in final status. This audit did not revert, overwrite, stage, commit, branch, push, install packages, or modify production code/tests/norms/copy/config/dependencies.

```text
$ git status --short --untracked-files=all
 M App.tsx
 M src/adherence/__tests__/adherence.test.ts
 M src/adherence/__tests__/blockServiceEligibility.test.ts
 M src/adherence/blockService.ts
 M src/adherence/screens/BlockReportScreen.tsx
 M src/adherence/types.ts
 M src/checkup/index.ts
 M src/pearlFlow/__tests__/appLifecycle.test.ts
 M src/pearlFlow/__tests__/assessmentEligibility.test.ts
 M src/pearlFlow/__tests__/copyGuardrails.test.ts
 M src/pearlFlow/__tests__/exploreViewModel.test.ts
 M src/pearlFlow/__tests__/pearlFlow.test.ts
 M src/pearlFlow/__tests__/progressViewModel.test.ts
 M src/pearlFlow/__tests__/sessionPlanning.test.ts
 M src/pearlFlow/appLifecycle.ts
 M src/pearlFlow/assessmentEligibility.ts
 M src/pearlFlow/assessmentResultState.ts
 M src/pearlFlow/assessments.ts
 M src/pearlFlow/exploreViewModel.ts
 M src/pearlFlow/index.ts
 M src/pearlFlow/progressViewModel.ts
 M src/pearlFlow/reports.ts
 M src/pearlFlow/types.ts
 M src/history/__tests__/history.test.ts
 M src/history/index.ts
 M src/history/serialize.ts
 M src/history/store.ts
 M src/onboarding/__tests__/onboarding.test.ts
 M src/onboarding/state.ts
 M src/scoring/index.ts
 M src/screens/CheckUpScreen.tsx
 M src/screens/ExploreScreen.tsx
 M src/screens/OnboardingResultsScreen.tsx
 M src/screens/PlanScreen.tsx
 M src/screens/ProgressScreen.tsx
 M src/screens/ResultsScreen.tsx
 M src/screens/SettingsScreen.tsx
 M src/screens/TodayScreen.tsx
 M src/services/backend/__tests__/checkupSyncService.test.ts
 M src/services/backend/__tests__/restoreService.test.ts
 M src/services/backend/blockReportSyncService.ts
 M src/services/backend/checkupSyncService.ts
 M src/services/backend/restoreService.ts
?? docs/audits/PEARL_LOGIC_AUDIT_STAGE_3D.md
?? docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3B.md
?? docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3C.md
?? docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_3C_1.md
?? docs/audits/Pearl_Stage_3B_Evidence_Officialness_Prompt.md
?? docs/audits/Pearl_Stage_3C_1_Versioned_Snapshot_Verification_Prompt.md
?? docs/audits/Pearl_Stage_3C_Scoring_Norm_Versioning_Prompt.md
?? docs/audits/Pearl_Stage_3D_Norm_Claims_Audit_Prompt.md
?? src/checkup/retry.ts
?? src/pearlFlow/__tests__/checkupHistory.test.ts
?? src/pearlFlow/assessmentEvidence.ts
?? src/pearlFlow/checkupHistory.ts
?? src/scoring/__tests__/scoreSnapshot.test.ts
?? src/scoring/scoreSnapshot.ts
?? src/scoring/versions.ts
```

```text
$ git diff --name-only
App.tsx
src/adherence/__tests__/adherence.test.ts
src/adherence/__tests__/blockServiceEligibility.test.ts
src/adherence/blockService.ts
src/adherence/screens/BlockReportScreen.tsx
src/adherence/types.ts
src/checkup/index.ts
src/pearlFlow/__tests__/appLifecycle.test.ts
src/pearlFlow/__tests__/assessmentEligibility.test.ts
src/pearlFlow/__tests__/copyGuardrails.test.ts
src/pearlFlow/__tests__/exploreViewModel.test.ts
src/pearlFlow/__tests__/pearlFlow.test.ts
src/pearlFlow/__tests__/progressViewModel.test.ts
src/pearlFlow/__tests__/sessionPlanning.test.ts
src/pearlFlow/appLifecycle.ts
src/pearlFlow/assessmentEligibility.ts
src/pearlFlow/assessmentResultState.ts
src/pearlFlow/assessments.ts
src/pearlFlow/exploreViewModel.ts
src/pearlFlow/index.ts
src/pearlFlow/progressViewModel.ts
src/pearlFlow/reports.ts
src/pearlFlow/types.ts
src/history/__tests__/history.test.ts
src/history/index.ts
src/history/serialize.ts
src/history/store.ts
src/onboarding/__tests__/onboarding.test.ts
src/onboarding/state.ts
src/scoring/index.ts
src/screens/CheckUpScreen.tsx
src/screens/ExploreScreen.tsx
src/screens/OnboardingResultsScreen.tsx
src/screens/PlanScreen.tsx
src/screens/ProgressScreen.tsx
src/screens/ResultsScreen.tsx
src/screens/SettingsScreen.tsx
src/screens/TodayScreen.tsx
src/services/backend/__tests__/checkupSyncService.test.ts
src/services/backend/__tests__/restoreService.test.ts
src/services/backend/blockReportSyncService.ts
src/services/backend/checkupSyncService.ts
src/services/backend/restoreService.ts
```

```text
$ git diff --stat
 App.tsx                                            | 233 +++++---
 src/adherence/__tests__/adherence.test.ts          |  32 +-
 .../__tests__/blockServiceEligibility.test.ts      |  49 +-
 src/adherence/blockService.ts                      |  14 +-
 src/adherence/screens/BlockReportScreen.tsx        |  22 +-
 src/adherence/types.ts                             |  29 +-
 src/checkup/index.ts                               |   1 +
 src/pearlFlow/__tests__/appLifecycle.test.ts        |  83 ++-
 .../__tests__/assessmentEligibility.test.ts        | 138 ++++-
 src/pearlFlow/__tests__/copyGuardrails.test.ts      |   2 +
 src/pearlFlow/__tests__/exploreViewModel.test.ts    |  21 +-
 src/pearlFlow/__tests__/pearlFlow.test.ts            |  32 +-
 src/pearlFlow/__tests__/progressViewModel.test.ts   | 309 ++++++++++-
 src/pearlFlow/__tests__/sessionPlanning.test.ts     |  14 +-
 src/pearlFlow/appLifecycle.ts                       |  24 +-
 src/pearlFlow/assessmentEligibility.ts              | 183 ++++--
 src/pearlFlow/assessmentResultState.ts              |  48 +-
 src/pearlFlow/assessments.ts                        |  94 +++-
 src/pearlFlow/exploreViewModel.ts                   |  98 ++++
 src/pearlFlow/index.ts                              |   2 +
 src/pearlFlow/progressViewModel.ts                  | 124 +++--
 src/pearlFlow/reports.ts                            |  67 ++-
 src/pearlFlow/types.ts                              |   3 +-
 src/history/__tests__/history.test.ts              |  90 ++-
 src/history/index.ts                               |   2 +-
 src/history/serialize.ts                           | 100 +++-
 src/history/store.ts                               |   6 +-
 src/onboarding/__tests__/onboarding.test.ts        |  59 +-
 src/onboarding/state.ts                            |   8 +-
 src/scoring/index.ts                               |  27 +
 src/screens/CheckUpScreen.tsx                      |   9 +-
 src/screens/ExploreScreen.tsx                      | 611 ++++++++++++++-------
 src/screens/OnboardingResultsScreen.tsx            |  46 +-
 src/screens/PlanScreen.tsx                         | 360 +++++++-----
 src/screens/ProgressScreen.tsx                     | 420 +++++++++++---
 src/screens/ResultsScreen.tsx                      |  36 +-
 src/screens/SettingsScreen.tsx                     |  52 +-
 src/screens/TodayScreen.tsx                        | 328 ++++-------
 .../backend/__tests__/checkupSyncService.test.ts   | 102 ++++
 .../backend/__tests__/restoreService.test.ts       | 148 ++++-
 src/services/backend/blockReportSyncService.ts     |   1 +
 src/services/backend/checkupSyncService.ts         |  70 ++-
 src/services/backend/restoreService.ts             |  92 +++-
 43 files changed, 3185 insertions(+), 1004 deletions(-)
```

```text
$ git diff --check
```

Exit code: 0. No output.
