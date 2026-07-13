# PEARL_PERCENTILE_SCORING_PROTOCOL_DESIGN_STAGE_3D_B_1

Date: 2026-06-23
Stage: 3D-B.1
Mode: read-only product, scientific, UX, protocol, and architecture design
Repository: `/Users/suvangoel/Pearl`

## 1. Executive recommendation

Pearl should replace the controlled-beta headline of exact "movement age" with a `Movement Profile` made of raw metrics, source-backed reference comparisons, conservative claim suppression, and a transparent `Suggested focus`.

Recommended controlled-beta result hierarchy:

1. Raw result first.
2. Reference claim only when protocol, setup, age, reference-sex, source, and tracking eligibility all pass.
3. Chair-rise: source-backed percentile range, not exact percentile, if the Warden et al. calculator transform is legally approved and reproduced in tests.
4. Balance: 45-second one-leg hold protocol, adaptive best-of-three, raw seconds plus Pearl task band headline; source age-group comparison in detail, no exact percentile.
5. Shoulder reach: active shoulder reach, user-selected side persisted for retest, one valid capture with a guided retry if tracking is uncertain; source age/sex/side IQR comparison in detail, no exact percentile.
6. Suggested focus: ordinal evidence policy using below-reference categories first, life goal for close/incomplete evidence, and current-focus preservation on retest.

This stage is design complete, but implementation remains blocked until product-owner sign-off. Public beta remains blocked by source transform approval, implementation, pre-implementation usability pilot, and physical-device validation.

## 2. Scope and read-only rules

This task intentionally did not implement scoring changes, protocol changes, balance duration changes, profile fields, UI, snapshot schemas, tests, backend changes, dependencies, assets, or device experiments.

Allowed repository change: exactly one new report file:

`docs/audits/PEARL_PERCENTILE_SCORING_PROTOCOL_DESIGN_STAGE_3D_B_1.md`

Temporary source inspection files were limited to:

`/tmp/pearl-stage3db1/`

No package install, staging, commit, branch, push, source-PDF commit, lockfile edit, asset edit, or production-code edit occurred.

## 3. Initial Git status

Command:

```bash
git status --short --untracked-files=all
git diff --name-only
git diff --stat
```

Output:

```text
 M App.tsx
 M docs/decisions.md
 M src/adherence/__tests__/sessionCompletionFeedback.test.ts
 M src/adherence/screens/BlockReportScreen.tsx
 M src/adherence/screens/SessionCompletionScreen.tsx
 M src/components/AccountAuthCard.tsx
 M src/pearlFlow/__tests__/assessmentResultState.test.ts
 M src/pearlFlow/__tests__/planViewModel.test.ts
 M src/pearlFlow/__tests__/progressViewModel.test.ts
 M src/pearlFlow/appLifecycle.ts
 M src/pearlFlow/assessmentResultState.ts
 M src/pearlFlow/copy.ts
 M src/pearlFlow/extraSessionCopy.ts
 M src/pearlFlow/planViewModel.ts
 M src/pearlFlow/progressViewModel.ts
 M src/pearlFlow/sessionPlanning.ts
 M src/pearlFlow/types.ts
 M src/navigation/TabBar.tsx
 M src/navigation/__tests__/TabBar.test.ts
 M src/onboarding/__tests__/onboarding.test.ts
 M src/onboarding/results.ts
 M src/preflight/__tests__/setupCopy.test.ts
 M src/preflight/setupCopy.ts
 M src/profile/index.ts
 M src/profile/types.ts
 M src/screens/CameraSetupScreen.tsx
 M src/screens/CheckUpScreen.tsx
 M src/screens/ExploreScreen.tsx
 M src/screens/MicroCheckScreen.tsx
 M src/screens/OnboardingBlockScreen.tsx
 M src/screens/OnboardingResultsScreen.tsx
 M src/screens/PlanScreen.tsx
 M src/screens/ProgressScreen.tsx
 M src/screens/SafetyProfileScreen.tsx
 M src/screens/SessionPreviewScreen.tsx
 M src/screens/SettingsScreen.tsx
 M src/screens/TodayScreen.tsx
 M src/screens/TrainingSessionScreen.tsx
 M src/training/__tests__/workoutGeneration.test.ts
 M src/training/dailyTrainingContext.ts
 M src/training/serialize.ts
 M src/training/workoutGeneration.ts
?? docs/audits/Pearl_Stage_3D_B_1_Percentile_Protocol_Focus_Design_Prompt.md
?? src/profile/__tests__/activity.test.ts
?? src/profile/__tests__/age.test.ts
?? src/profile/activity.ts
?? src/profile/age.ts
App.tsx
docs/decisions.md
src/adherence/__tests__/sessionCompletionFeedback.test.ts
src/adherence/screens/BlockReportScreen.tsx
src/adherence/screens/SessionCompletionScreen.tsx
src/components/AccountAuthCard.tsx
src/pearlFlow/__tests__/assessmentResultState.test.ts
src/pearlFlow/__tests__/planViewModel.test.ts
src/pearlFlow/__tests__/progressViewModel.test.ts
src/pearlFlow/appLifecycle.ts
src/pearlFlow/assessmentResultState.ts
src/pearlFlow/copy.ts
src/pearlFlow/extraSessionCopy.ts
src/pearlFlow/planViewModel.ts
src/pearlFlow/progressViewModel.ts
src/pearlFlow/sessionPlanning.ts
src/pearlFlow/types.ts
src/navigation/TabBar.tsx
src/navigation/__tests__/TabBar.test.ts
src/onboarding/__tests__/onboarding.test.ts
src/onboarding/results.ts
src/preflight/__tests__/setupCopy.test.ts
src/preflight/setupCopy.ts
src/profile/index.ts
src/profile/types.ts
src/screens/CameraSetupScreen.tsx
src/screens/CheckUpScreen.tsx
src/screens/ExploreScreen.tsx
src/screens/MicroCheckScreen.tsx
src/screens/OnboardingBlockScreen.tsx
src/screens/OnboardingResultsScreen.tsx
src/screens/PlanScreen.tsx
src/screens/ProgressScreen.tsx
src/screens/SafetyProfileScreen.tsx
src/screens/SessionPreviewScreen.tsx
src/screens/SettingsScreen.tsx
src/screens/TodayScreen.tsx
src/screens/TrainingSessionScreen.tsx
src/training/__tests__/workoutGeneration.test.ts
src/training/dailyTrainingContext.ts
src/training/serialize.ts
src/training/workoutGeneration.ts
 App.tsx                                            |  16 +
 docs/decisions.md                                  |  12 +
 .../__tests__/sessionCompletionFeedback.test.ts    |  24 +-
 src/adherence/screens/BlockReportScreen.tsx        |  46 +--
 src/adherence/screens/SessionCompletionScreen.tsx  |   2 +-
 src/components/AccountAuthCard.tsx                 |  10 +-
 .../__tests__/assessmentResultState.test.ts        |   2 +-
 src/pearlFlow/__tests__/planViewModel.test.ts       |  17 +-
 src/pearlFlow/__tests__/progressViewModel.test.ts   |  14 +-
 src/pearlFlow/appLifecycle.ts                       |  30 +-
 src/pearlFlow/assessmentResultState.ts              |   8 +-
 src/pearlFlow/copy.ts                               |  84 +++---
 src/pearlFlow/extraSessionCopy.ts                   |   2 +-
 src/pearlFlow/planViewModel.ts                      |  58 ++--
 src/pearlFlow/progressViewModel.ts                  |  63 ++--
 src/pearlFlow/sessionPlanning.ts                    |   7 +-
 src/pearlFlow/types.ts                              |   1 +
 src/navigation/TabBar.tsx                          |   6 +-
 src/navigation/__tests__/TabBar.test.ts            |  10 +-
 src/onboarding/__tests__/onboarding.test.ts        |  18 +-
 src/onboarding/results.ts                          |  32 +-
 src/preflight/__tests__/setupCopy.test.ts          |   2 +-
 src/preflight/setupCopy.ts                         |  10 +-
 src/profile/index.ts                               |  11 +
 src/profile/types.ts                               |   2 +-
 src/screens/CameraSetupScreen.tsx                  |  23 +-
 src/screens/CheckUpScreen.tsx                      |  24 +-
 src/screens/ExploreScreen.tsx                      |   2 +-
 src/screens/MicroCheckScreen.tsx                   |  14 +-
 src/screens/OnboardingBlockScreen.tsx              |  26 +-
 src/screens/OnboardingResultsScreen.tsx            |  70 +++--
 src/screens/PlanScreen.tsx                         | 283 +++++++++---------
 src/screens/ProgressScreen.tsx                     | 126 ++++----
 src/screens/SafetyProfileScreen.tsx                |  32 +-
 src/screens/SessionPreviewScreen.tsx               | 322 +++++++++++----------
 src/screens/SettingsScreen.tsx                     | 161 ++++++-----
 src/screens/TodayScreen.tsx                        | 236 ++++++---------
 src/screens/TrainingSessionScreen.tsx              |  14 +-
 src/training/__tests__/workoutGeneration.test.ts   |  44 +++
 src/training/dailyTrainingContext.ts               |   1 +
 src/training/serialize.ts                          |   4 +
 src/training/workoutGeneration.ts                  |  40 +++
 42 files changed, 1073 insertions(+), 836 deletions(-)
```

Interpretation: the working tree was already broadly dirty before this task. All existing changes are treated as user-owned.

## 4. Baseline validation

Targeted existing test slice:

```bash
npm test -- --runInBand src/scoring/__tests__/scoringInputValidation.test.ts src/scoring/__tests__/scoring.test.ts src/scoring/__tests__/scoreSnapshot.test.ts src/scoring/__tests__/focusSelection.test.ts src/pearlFlow/__tests__/assessmentEligibility.test.ts src/movements/__tests__/chairStand.test.ts src/movements/__tests__/balanceLadder.test.ts src/movements/__tests__/shoulderFlexion.test.ts src/checkup/__tests__/checkup.test.ts src/checkup/__tests__/checkupFlow.integration.test.ts src/pearlFlow/__tests__/assessmentResultState.test.ts src/pearlFlow/__tests__/progressViewModel.test.ts src/pearlFlow/__tests__/planViewModel.test.ts src/pearlFlow/__tests__/pearlFlow.test.ts src/pearlFlow/__tests__/copyGuardrails.test.ts src/services/backend/__tests__/checkupSyncService.test.ts src/services/backend/__tests__/blockReportSyncService.test.ts src/services/backend/__tests__/restoreService.test.ts src/exercises/__tests__/catalog.test.ts src/exercises/__tests__/progressionPolicy.test.ts src/training/__tests__/workoutGeneration.test.ts src/pearlFlow/__tests__/stage5hLifecycle.integration.test.ts
```

Result: pass.

Counts: 22 test suites passed, 253 tests passed, 0 snapshots.

Warnings/notices:

- Watchman recrawl warning for `/Users/suvangoel/Pearl`.
- Expected test-console logs/warnings from `blockReportSyncService` failure-path tests.
- Jest open-handle notice: "Jest did not exit one second after the test run has completed."

Other required validation:

| Command | Result | Counts / warnings |
| --- | --- | --- |
| `npm run verify:audio` | Pass | `requiredCues=44`, `voices=clara,marcus`, `requiredAssets=88`, `totalBytes=4637324`, `durationRange=1.858-5.155s` |
| `npm test -- --runInBand` | Pass | 107 test suites passed, 884 tests passed, 0 snapshots; same Watchman warning, expected sync-console logs/warnings, Jest open-handle notice |
| `npm run typecheck` | Pass | `tsc --noEmit` completed with no diagnostics |
| `npm --prefix website run typecheck` | Pass | website `tsc --noEmit` completed with no diagnostics |
| `npx --no-install expo config --type public` | Pass | Expo printed environment variable names loaded from `.env`; values were not exposed. Warning: Sentry Expo plugin missing explicit organization/project config and will use environment fallback during build. SDK shown as `56.0.0`. |
| `git diff --check` | Pass | no output |

## 5. Current assessment/result architecture

Current path:

```text
local profile age band / safety profile / life goal
-> MovementDefinition registry
-> CheckUpOrchestrator battery
-> SessionController per movement
-> movement grader raw result
-> validateCheckUpForScoring
-> scoreCheckUpWithDiagnostics
-> createCurrentVersionedScoreSnapshot
-> createMovementAssessment
-> block-creation eligibility
-> MovementBlock
-> Progress, Home, Results, reports, sync/restore
```

Current code assumptions to replace:

- `src/scoring/scoring.ts` maps domains to "typical of age X-Y" ranges.
- `src/scoring/norms.ts` holds `AgeNorm` anchors and `inferAge`, including estimated/extrapolated values.
- Strength uses chair-stand reps. Rise velocity is detail only.
- Balance uses `singleLegEyesOpenSec` from the current ladder. TUG is supporting/historical.
- Mobility uses shoulder flexion. Hinge reach is supporting.
- `weakestDomain` is currently the oldest age-range midpoint, adjusted by focus selection metadata for exact/near ties.
- `src/scoring/focusSelection.ts` uses a 5-year near-tie rule on movement-age midpoints.
- `src/scoring/versions.ts` currently has `CURRENT_SCORING_VERSION = 1`, `CURRENT_NORM_VERSION = 1`, and `SCORE_SNAPSHOT_SCHEMA_VERSION = 1`.
- `src/scoring/scoreSnapshot.ts` freezes versioned age-range scores and fails closed on incompatible schema/version/source mismatch.
- `src/pearlFlow/assessmentEligibility.ts` requires current snapshots and all headline domains for official block creation.
- `src/pearlFlow/reports.ts` already suppresses direct comparison when score snapshot versions are incompatible.
- `src/services/backend/checkupSyncService.ts` syncs compact derived scores, score snapshot metadata, and sanitized raw check-up JSON.
- `src/services/backend/restoreService.ts` maps remote compact records back into local state defensively.

Current profile assumptions:

- `UserProfile.age` stores an exact number or an onboarding age-band representative.
- There is no local sex, gender, or reference-sex field.
- Backend `BackendProfile.sex` exists as nullable, but current local preference sync does not write local reference sex.
- Current onboarding age-band representatives are: under 45 -> 44, 45-54 -> 50, 55-64 -> 60, 65-74 -> 70, 75+ -> 76.

## 6. Current Check-Up friction model

Current official battery:

1. `chair-stand-30s`
2. `balance-ladder`
3. `shoulder-flexion-peak`
4. `hinge-reach`

Current hidden/beta battery can add TUG, but normal V1 flow does not.

Current timing facts:

- Global intro voice.
- Transition dwell between items: 1500 ms.
- Per-item preflight can wait up to 60000 ms before setup issue.
- Per item: preflight -> instructions -> 2500 ms post-instruction dwell -> countdown 3,2,1,go at 1000 ms steps -> active -> result.
- Chair active window: 30000 ms.
- Balance ladder active schedule: five stages, each with 3000 ms get-ready, windows of 10, 10, 10, 10, and 12 seconds. Active schedule total: 67 seconds.
- Shoulder active window: 9000 ms, with 3000 ms valid capture required.
- Hinge reach active window: 9000 ms.
- Grader-terminated items have a 180000 ms hard active cap.

Approximate current active measurement time: 115 seconds, excluding voice, framing, transitions, and setup recovery.

Realistic current user time: approximately 5 to 8 minutes when framing succeeds quickly, because each movement has its own camera readiness, voice instructions, countdown, and transition. The Home copy still says about 10 minutes, which remains conservative.

Where 45-second balance adds time:

- One 45-second balance trial replaces 67 seconds of current ladder active time only if the whole ladder is removed.
- Adaptive best-of-three can be shorter than a fixed three-trial protocol for users who reach 45 seconds on trial 1, but longer for users who terminate early and accept retries.

## 7. Claim taxonomy

Raw result:

- Direct measured output, such as `16 chair rises in 30 seconds`, `28-second one-leg hold`, or `154 deg shoulder reach`.
- Always allowed when measurement is valid, even if no reference claim is allowed.

Exact percentile:

- A single value such as `53rd percentile`.
- Blocked as user-facing controlled-beta copy. It overstates precision for home camera, chair setup variation, integer rep counts, and reference-model uncertainty.
- Allowed internally only for source-backed chair calculations after legal/source approval and anchor tests.

Percentile range:

- Example: `Around the 40th-60th percentile`.
- Recommended chair detail/headline reference claim if the Warden transform is approved and reproduced.
- Not allowed for balance or shoulder unless a direct percentile/quantile source is later verified.

Age-group reference range:

- Example: `Within the published middle range for adults aged 55-59`.
- Recommended for shoulder using published age/sex/side IQR.
- Provisional for balance only as a detail comparison to source age-group values; no percentile.

Pearl task band:

- Example: `Full 45-second hold completed`, `Building the hold`, `Starting point`.
- Allowed as product interpretation when labelled as Pearl's task band rather than a population norm.

Suggested focus:

- Transparent prioritisation based on validated result categories and life goal.
- It is not a diagnosis, fall-risk classification, impairment label, or scientifically proven weakest system.

Longitudinal change:

- Raw previous/current values may be displayed neutrally.
- `Improved`, `declined`, `younger`, meaningful-change, and percentile-change interpretations remain blocked until physical-device repeatability and MDC work exists.

Per-domain claim status:

| Domain | Raw | Exact percentile | Percentile range | Age-group reference | Pearl task band | Suggested-focus input |
| --- | --- | --- | --- | --- | --- | --- |
| Chair-rise capacity | Allowed | Internal only after source/legal approval | Recommended if eligible | Fallback detail only | Optional | Eligible when source-eligible or raw-valid with low category |
| One-leg balance | Allowed | Blocked | Blocked | Detail/provisional source comparison | Recommended headline | Eligible through ordinal category |
| Shoulder reach | Allowed | Blocked | Blocked | Recommended detail using IQR | Optional | Eligible through ordinal category |

## 8. Reference-claim eligibility states

Conceptual type:

```ts
type ReferenceClaimEligibility =
  | 'reference_eligible'
  | 'raw_only_setup_uncertain'
  | 'raw_only_protocol_incomplete'
  | 'raw_only_tracking_uncertain'
  | 'raw_only_reference_unavailable'
  | 'raw_only_profile_incomplete'
  | 'raw_only_pain_limited'
  | 'invalid_measurement';
```

State behavior:

| State | Trigger | Displayed result | Suppressed result | Recovery | Focus eligibility | Snapshot metadata |
| --- | --- | --- | --- | --- | --- | --- |
| `reference_eligible` | Source, profile, setup, protocol, and tracking pass | Raw plus reference claim | None | Normal retest | Full | source, transform, setup, tracking, age, reference-sex |
| `raw_only_setup_uncertain` | Chair height uncertain, unstable chair, unsafe footwear/surface, unsupported shoulder side setup | Raw plus personal baseline | Norm/percentile/reference copy | Repeat with confirmed setup | Limited; category can be raw-low only | setup flags and reason |
| `raw_only_protocol_incomplete` | Required trial count not met, hand support, arms uncrossed, premature stop, final invalid capture | Raw if credible, else invalid | Reference claim | Retry section | Limited or no | incomplete reason |
| `raw_only_tracking_uncertain` | tracking interruption, low confidence, rep-count ambiguity, invalid trial | Raw if credible with uncertainty label | Reference claim | Automatic retry if safe | Limited | tracking confidence and retry count |
| `raw_only_reference_unavailable` | Source transform unavailable, outside source age, unsupported reference group | Raw plus Pearl band | Source-relative claim | Add profile data or wait for source approval | Limited | source unavailable reason |
| `raw_only_profile_incomplete` | Missing exact age or reference sex where required | Raw plus Pearl band | Reference claim | Add optional reference inputs | Limited | missing input |
| `raw_only_pain_limited` | User stops or reports movement limited by pain/discomfort | Raw if complete; otherwise invalid | Reference claim and focus severity | Retake only if comfortable | Usually excluded from "clear below" | pain-limited flag, no diagnosis |
| `invalid_measurement` | No credible measurement | No score; retry prompt | Raw and reference | Retry | Excluded | invalid reason |

## 9. Candidate source register

| Domain | Source | Directly verified | What it supports | What it does not support |
| --- | --- | --- | --- | --- |
| Chair rise | Warden SJ, Liu Z, Moe SM. `Sex- and Age-Specific Centile Curves and Downloadable Calculator for Clinical Muscle Strength Tests to Identify Probable Sarcopenia`. Physical Therapy 2022; DOI `10.1093/ptj/pzab299`. OUP full text and official supplements. URL: `https://doi.org/10.1093/ptj/pzab299` and `https://academic.oup.com/ptj/article/102/3/pzab299/6481185`. | Yes. OUP article, protocol supplement, and calculator workbook were accessed. | Age/sex-specific centile model for 30s-STS, adults 18-80, official Excel calculator with hidden sheets/formulas. | User-facing exact percentile; implementation before legal/source-transform approval. Calculator text says authors retain copyright. |
| Balance | Springer BA, Marin R, Cyhan T, Roberts H, Gill NW. `Normative Values for the Unipedal Stance Test with Eyes Open and Closed`. Journal of Geriatric Physical Therapy 2007;30(1):8-15; DOI `10.1519/00139143-200704000-00003`. Institutional PDF. URL: `https://geriatrictoolkit.missouri.edu/balance/Normative_Values_for_the_Unipedal_Stance_Test_Springer-JGPT.pdf`. | Yes. Official/institutional PDF from University of Missouri geriatric toolkit. | 45-second max, eyes-open protocol, limb of choice, arms crossed, best/mean of three, age-group values, no meaningful sex effect. | Exact percentile. A single trial. Current Pearl 12-second ceiling. |
| Shoulder reach | Gill TK et al. `Shoulder range of movement in the general population: age and gender stratified normative data using a community-based cohort`. BMC Musculoskeletal Disorders 2020;21:676; DOI `10.1186/s12891-020-03665-9`. Springer open access. URL: `https://doi.org/10.1186/s12891-020-03665-9` and `https://link.springer.com/article/10.1186/s12891-020-03665-9`. | Yes. Full text and Table 1 accessed. | Active shoulder flexion, standing, Plurimeter V inclinometer, left/right, age/sex five-year groups, mean/SD/median/IQR/range. | Exact percentile, longitudinal change, passive ROM, automatic "more is better" above range. |
| Chair protocol reinforcement | CDC STEADI 30-second chair stand PDF and Shirley Ryan AbilityLab protocol page. | Yes as official/clinical protocol context, not normative source. | Consistent chair setup, arms crossed, full stands, 30 seconds, partial-final treatment. | New percentile model. |

Temporary source artifacts inspected:

- `/tmp/pearl-stage3db1/warden_calculator.xlsx` from OUP supplementary appendix.
- `/tmp/pearl-stage3db1/warden_pzab299.pdf` attempted download resolved to HTML rather than PDF and was not used as evidence.

## 10. Chair source/model verification

Warden et al. source facts verified:

- Publisher/source: Oxford Academic, Physical Therapy, free article, DOI `10.1093/ptj/pzab299`.
- Participants: adults aged 18-80; included dataset n=2301, female n=1682, male n=619.
- Model: sex-specific centile curves generated with the lambda-mu-sigma method.
- Metric: number of stands completed in 30 seconds.
- Official calculator: downloadable Excel workbook in Supplementary Appendix 2 computes percentiles, z scores, t scores, and curves.
- Official protocol supplement: Supplementary Appendix 1 includes standardized sit-to-stand script and procedure.
- Protocol details: standardized 45 cm chair, chair against wall, shoes or non-slip socks, arms crossed, one practice stand, 30-second timer, full stand count, halfway-up at time expiry counts, incorrect performance triggers restart after rest.
- The calculator workbook contains hidden sheets including `30s-STS`, formulas, and normative data. The workbook is accessible from OUP, but the calculator notes that the authors retain copyright.
- The workbook text says the calculator can generate percentile values and normative curves for Caucasian participants. The article reports race effects on STS performance. This is a population-generalizability limitation, not a reason to infer ad-hoc race adjustment.

Feasibility answers:

| Question | Answer |
| --- | --- |
| Can Pearl compute exact percentiles locally from published parameters? | Technically likely yes, because the official workbook contains formulas/hidden data sufficient to compute outputs. |
| Can Pearl lawfully reproduce the required parameters? | Not yet approved. The source is accessible, but the calculator copyright statement requires legal/product approval before embedding extracted tables/formulas in app code. |
| Is an official calculator available but non-reproducible? | Official calculator is available and inspectable. Reproduction requires an extraction/fingerprinting/test harness, plus legal approval. |
| Does the source support exact centiles, only curves, or grouped values? | It supports centile calculations via the official calculator/model, not merely grouped values. |

Design conclusion: chair reference-claim design is ready, but implementation must not start until the source transform is legally approved, fingerprinted, and tested against official calculator anchors.

## 11. Chair protocol specification

Controlled-beta chair setup:

```text
Use a firm, stable dining chair without wheels. Place it against a wall. The seat should be roughly level with the crease behind your knees.
```

Confirmation:

```text
Is the seat roughly knee height?
Yes
I'm not sure
```

Protocol:

- Phone side view.
- Firm chair, no wheels, against wall.
- Shoes or non-slip socks. No standard socks on slippery floor.
- Feet flat.
- Arms crossed across chest.
- One quick practice repetition.
- On "go", stand fully upright and sit fully down as many times as possible in 30 seconds.
- Count only stands where the user reaches full upright before time expires, except if product owner explicitly chooses the Warden/CDC "halfway-up at expiry counts" convention.
- Recommendation for Pearl: do not count final partial reps in camera scoring until the rep tracker can reliably classify halfway-at-expiry. If future implementation supports that rule with tests, it may count a halfway final rise only when the threshold is deterministic.
- Hand push-off on thighs remains a logged flag, not a voiced form critique.

Norm-claim eligibility:

- Setup confirmed + valid protocol + no hand push-off + profile complete + tracking high confidence -> percentile range may be shown.
- Setup uncertain -> raw reps and personal baseline only.
- Hand push-off -> raw reps only.
- Tracking interruption -> automatic retry if possible; if accepted result remains uncertain, raw only.
- Chair not safe -> no test, no score.

Elements not to relax:

- Arms crossed.
- Stable chair against wall.
- No wheels.
- Full stand/sit cycle.
- 30-second fixed duration.
- Setup confidence captured in snapshot.

Elements intentionally relaxed versus lab source:

- No tape measure for exact 45 cm chair height.
- "Roughly knee height" replaces measured chair height.
- Source-relative claims are suppressed when setup is uncertain rather than blocking the Check-Up.

## 12. Chair calculation/display specification

Recommendation: use a broad percentile range as the controlled-beta chair reference claim.

Do not show exact percentile in the main UI.

Calculation class:

- Internal class: exact published centile model, source `warden_2022_30s_sts`.
- Display class: percentile range.

Required inputs:

- Raw reps.
- Exact age or date-of-birth-derived age.
- Optional reference sex selected by user.
- Protocol version.
- Setup confirmation.
- Hand-use flag.
- Tracking quality.
- Source transform fingerprint.

Deterministic range policy:

1. Compute exact model percentile for `reps`, `age`, and `referenceSex`.
2. Compute uncertainty interval using `reps - 1` and `reps + 1` for camera count uncertainty. Clamp reps at zero.
3. Round interval low down to nearest 10 percentile points and high up to nearest 10.
4. Enforce minimum display width of 20 percentile points.
5. Clamp to 0-100.
6. If the entire interval is below 10, display `Below the 10th percentile for your reference group`.
7. If the entire interval is above 90, display `Above the 90th percentile for your reference group`.
8. Otherwise display `Around the Xth-Yth percentile for your reference group`.
9. If age came from an old age-band representative, no percentile claim. Ask for exact age first.
10. If user is outside the source age range, no percentile claim.

Example states:

| State | Card headline | Secondary text | Detail/caveat |
| --- | --- | --- | --- |
| Norm eligible | `Chair-rise capacity` / `16 rises in 30 seconds` | `Around the 40th-60th percentile for your reference group` | `Based on a similar published test setup. Pearl's camera estimate is not a medical assessment.` |
| Setup uncertain | `Chair-rise capacity` / `16 rises in 30 seconds` | `Saved as your personal baseline` | `A reference comparison needs a stable chair at roughly knee height.` |
| Hand push-off detected | `Chair-rise capacity` / `16 rises in 30 seconds` | `Saved without a reference comparison` | `This result used extra arm support, so Pearl will not compare it with the published chair-rise setup.` |
| Camera count uncertain | `Chair-rise capacity` / `About 16 rises in 30 seconds` | `Saved without a reference comparison` or widened range if uncertainty remains within policy | `A clearer retake can make the comparison eligible.` |
| Outside source age | `Chair-rise capacity` / `16 rises in 30 seconds` | `Saved as your personal baseline` | `The published reference model Pearl uses does not cover your age.` |
| High result | `Chair-rise capacity` / `24 rises in 30 seconds` | `Above the 90th percentile for your reference group` | `This is a comparison to a published test setup, not a medical assessment.` |
| Low result | `Chair-rise capacity` / `7 rises in 30 seconds` | `Below the 10th percentile for your reference group` | `Pearl can use this as a suggested focus, but it is not a diagnosis.` |

## 13. Balance source verification

Springer et al. source facts verified:

- Published in Journal of Geriatric Physical Therapy, 2007, institutional PDF.
- Healthy adults n=549, ages 18 and older.
- Age groups: 18-39, 40-49, 50-59, 60-69, 70-79, 80-99.
- Subjects stood barefoot on limb of choice.
- Raised foot near but not touching stance ankle.
- Eyes open: focus on a wall spot at eye level.
- Arms crossed over chest before raising the limb.
- Timing starts when foot leaves floor.
- Timing ends when arms uncross, raised foot moves/touches floor, stance foot moves/rotates, 45 seconds elapse, or eyes open during eyes-closed trials.
- Procedure repeated three times; best and average of three recorded.
- Eyes-open and eyes-closed trials alternated, with at least 5 minutes between trial sets.
- Sex was not a significant factor; age was significant.
- Best-of-three eyes-open ICC reported as excellent.
- Table reports mean values for best and mean of three by age group/sex/total. The text defines normal reference range as mean +/- 2 standard deviations, but extracted table heading labels the parenthetic values as `Mean (SE)`. The numeric magnitudes behave like SD, not SE; implementation still needs source-anchor review before using the computed range.

Feasibility:

- Exact percentile: blocked.
- Age-group reference comparison: allowed if source-direct and clearly labelled.
- Pearl task band: allowed and recommended.
- Current 12-second Pearl ladder: incompatible with this source because users can hit the current ceiling far below the source 45-second ceiling.

## 14. Balance trial-option comparison

Assumptions for duration estimates:

- Each trial max: 45 seconds.
- Setup/voice/countdown overhead per balance item: approximately 25-45 seconds.
- Rest after a non-ceiling valid attempt: 45-60 seconds, user may continue early after a minimum 30 seconds if steady.
- Invalid tracking trial does not consume a valid attempt, with one automatic retry before offering skip.

| Option | Best case | Typical case | Worst reasonable case | Source compatibility | Reliability | Safety | User friction | Implementation complexity |
| --- | ---: | ---: | ---: | --- | --- | --- | --- | --- |
| A: one 45-second trial | 45s active | 45s active | 45s + one retry | Weakest; source uses best/mean of 3 | Lowest | Best from low exposure | Lowest | Low |
| B: two valid trials, best | 90s active plus rest | 90s + 45-60s rest | 90s + rest + invalid retry | Moderate, not source exact | Better than A | Moderate | Moderate | Medium |
| C: three valid trials, best | 135s active plus 2 rests | 135s + 90-120s rest | 135s + rests + invalid retries | Closest to source best-of-3 | Best | Higher fatigue/burden | Highest | Medium-high |
| D: adaptive best-of-three | 45s if trial 1 reaches ceiling | 45-135s active depending on early termination | 135s + 2 rests + invalid retry | Good; still yields best valid result, stops early at source ceiling | Good; retries where needed | Balanced | Lower than fixed C | High |

Recommendation for pre-implementation pilot: compare A and D behaviorally, but run D as the candidate protocol. Record first-trial result, acceptance of second/third, best-of-up-to-three, total time, rest preference, and burden.

Likely production recommendation: Option D, adaptive best-of-three.

Rationale: it preserves low friction for users who complete the 45-second ceiling on trial 1 while giving non-ceiling results a source-aligned best-of-three opportunity.

## 15. Balance protocol specification

Name: `One-leg balance`

Controlled-beta protocol:

- Camera view: front.
- Eyes open only.
- Stand near a counter or wall with fingertips within reach.
- Shoes: barefoot is source-aligned. Product should allow stable flat shoes for safety but record footwear; if not barefoot/stable, raw only.
- Surface: firm, dry, non-slip. No thick cushion for the official reference attempt.
- Leg: user chooses preferred standing leg on first official check-up. Persist same leg for retests.
- Both legs are not required for controlled beta.
- Arms: crossed over chest after setup and before foot lift. If crossed arms feel unsafe, fingertips-near-counter support setup remains safety guidance, but active support contact ends trial.
- Start: trial timer starts when the raised foot leaves floor and the stance is detected as stable.
- Raised foot: near but not touching stance ankle.
- Termination: raised foot touches floor or stance leg, raised foot moves away as a recovery strategy, stance foot moves/rotates/steps, arms uncross, support contact occurs, tracking interruption invalidates the trial, user stops, or 45 seconds elapse.
- Max duration: 45 seconds.
- Attempts: adaptive best-of-three valid attempts.
- Stop early: if trial 1 reaches 45 seconds, finish balance section.
- Rest: after a non-ceiling valid attempt, default 60 seconds; allow user to continue after 30 seconds if they say/press ready during pilot, but app production should remain voice-first and timed.
- Invalid tracking trial: does not consume one of the valid attempts; one automatic retry, then raw-only or skip.
- Result: best valid trial seconds; also store all trial seconds, terminations, invalid reasons, and chosen leg.
- Retest: same chosen leg by default; if changed, raw result remains available but source comparison and longitudinal comparison are suppressed or labelled not comparable.

## 16. Balance calculation/display specification

Recommended controlled-beta balance claim type:

- Headline: raw seconds plus Pearl task band.
- Detail: age-group source comparison using Springer best-of-three eyes-open data when protocol aligned.
- No exact percentile.
- No movement age.
- No fall-risk or diagnosis wording.

Pearl task bands:

| Result | Pearl band | Copy |
| --- | --- | --- |
| 45.0s | `ceiling_complete` | `Full 45-second hold completed` |
| 20.0-44.9s | `building` | `Building the hold` |
| 5.0-19.9s | `starting_point` | `Starting point` |
| <5.0s | `starting_point_low` | `A clear place to build` |

Reference detail options:

- Preferred first implementation detail: compare to source age-group best-of-three table as a benchmark, for example `The published average best-of-three hold for adults aged 50-59 was about 41 seconds.`
- Do not call this a percentile.
- Use `within/below/above published reference range` only after implementation confirms the source's parenthetic dispersion field and product owner approves using source-defined mean +/- 2 SD despite ceiling effects.

Example states:

| State | Card headline | Secondary text | Detail/caveat |
| --- | --- | --- | --- |
| Full 45 seconds | `One-leg balance` / `45 seconds` | `Full 45-second hold completed` | `This test stops at 45 seconds, so Pearl records completion rather than a higher score.` |
| Source comparison eligible | `One-leg balance` / `28 seconds` | `Building the hold` | `Compared with the published age-group benchmark for a similar best-of-three test.` |
| Below source benchmark | `One-leg balance` / `12 seconds` | `A clear place to build` | `This can guide your suggested focus. It is not a medical assessment.` |
| Tracking invalid | `One-leg balance` / `No clear hold saved` | `Let's retry this one` | `The camera lost the skeleton during the hold.` |
| Fewer than required valid trials | `One-leg balance` / `18 seconds` | `Saved as a personal baseline` | `Pearl needs the planned valid attempts before showing a published comparison.` |
| Setup uncertainty | `One-leg balance` / `18 seconds` | `Saved without a reference comparison` | `This setup differed from the published one-leg balance test.` |

## 17. Shoulder source verification

Gill et al. source facts verified:

- Springer/BMC open-access article, DOI `10.1186/s12891-020-03665-9`.
- Community cohort participants without reported shoulder pain/stiffness or rheumatoid arthritis.
- n=2404, mean age 45.8, range 20-91.
- Active shoulder flexion, abduction, and external rotation measured.
- Active flexion measured as forward elevation in standing using a Plurimeter V inclinometer to nearest degree.
- Both shoulders measured.
- Only one measurement recorded, partly to avoid fatigue/stretching effects.
- Age categorized into five-year groups.
- Table 1 gives mean/SD, median/IQR, and range of active shoulder flexion by sex and side.
- Active flexion declined with age, and sex/side differences were statistically significant.
- Dataset is not freely available beyond article tables.
- The authors note no formal inter/intra-rater reliability testing of clinic staff and no measurement error estimate for this study.

Feasibility:

- Exact percentile: blocked.
- Grouped IQR/reference comparison: allowed.
- Exact longitudinal change interpretation: blocked pending Pearl device repeatability.
- "Above range is better": blocked; high ROM is not automatically better.

## 18. Shoulder-side/trial comparison

| Option | Friction | Source compatibility | Product value | Risk |
| --- | --- | --- | --- | --- |
| A: fixed right side | Lowest | Strong for right-side table | Simple | May miss user's relevant limitation; left-handed/side-specific discomfort awkward |
| B: user-selected side, persisted | Low | Good because source has both side tables | Good longitudinal hygiene, low burden | Requires side instruction and snapshot metadata |
| C: both sides, use lower | Higher | Source has both sides, but "lower is worse" overstates clinical meaning | Captures asymmetry | More fatigue/confusion; may pathologize |
| D: both sides, report separately | Highest | Strongest source usage | Most informative | Too much friction for V1 Check-Up |

Recommendation: Option B for controlled beta.

Protocol implication: the user chooses the side to test, defaults to right if no preference, and Pearl persists that side for retests. The camera instruction must make the selected side the near side in a side view. If the selected side changes, source comparison can still use the correct side table, but longitudinal comparison is not directly comparable.

Pain/injury policy:

- Ask only wellness-side setup questions: `Does this side feel comfortable to raise today?`
- Do not ask for diagnosis.
- If discomfort limits the attempt, save raw if complete and suppress reference comparison.
- If both sides are uncomfortable, skip shoulder and mark invalid/incomplete.

## 19. Shoulder protocol specification

Name: `Active shoulder reach`

Controlled-beta protocol:

- Camera view: side.
- User-selected shoulder side closest to camera, persisted for retest.
- Standing upright.
- Straight arm forward raise in sagittal plane.
- Elbow as straight as comfortable, thumb/palm orientation neutral and not scored.
- Raise once smoothly as far as comfortable, pause briefly, then relax.
- Capture duration: 9 seconds can remain as a camera capture window, but future protocol should store trial-level validity.
- Valid capture: at least 3 seconds of reliable tracking while upright, with peak angle within valid range.
- Practice: one short demonstration/voice instruction, no extra practice rep unless pilot finds confusion.
- Retry: one guided retry if tracking is uncertain or torso compensation invalidates capture.
- Trunk compensation: camera should require upright torso; if the user leans substantially to create range, raw only or retry.
- Side metadata: `left`, `right`, `changed_from_prior`, `unknown`.

## 20. Shoulder calculation/display specification

Recommended controlled-beta shoulder claim type:

- Headline: raw active shoulder reach in degrees.
- Detail: age/sex/side IQR comparison where eligible.
- No exact percentile.
- No mobility age.
- No "more is always better" copy above the source range.

Calculation class:

- Direct lookup of published IQR/range by age group, reference sex, and tested side.
- Use IQR as the first controlled-beta `published middle range`.
- Do not use full observed range as "normal"; it includes values from 0 to 180 in some groups and is too broad for user-facing interpretation.

Example states:

| State | Card headline | Secondary text | Detail/caveat |
| --- | --- | --- | --- |
| Within IQR | `Active shoulder reach` / `154 deg` | `Within the published middle range for your reference group` | `Compared with active shoulder reach measured in standing.` |
| Below IQR | `Active shoulder reach` / `118 deg` | `Below the published middle range for your reference group` | `This can guide mobility practice, not a diagnosis.` |
| Above IQR | `Active shoulder reach` / `178 deg` | `Above the published middle range` | `More range is not automatically better; Pearl records this as a reference comparison only.` |
| Setup/tracking uncertain | `Active shoulder reach` / `154 deg` | `Saved as your personal baseline` | `A clearer side view is needed for a published comparison.` |
| Pain-limited | `Active shoulder reach` / `120 deg` | `Saved without a reference comparison` | `Pearl does not compare results that were limited by discomfort.` |
| Outside source age | `Active shoulder reach` / `154 deg` | `Saved as your personal baseline` | `The published shoulder table does not cover your age group.` |
| No reference-sex input | `Active shoulder reach` / `154 deg` | `Saved as your personal baseline` | `A published comparison needs an optional reference group.` |

## 21. Reference-sex policy

Current audit:

- Local profile does not store sex/gender/reference sex.
- Backend profile has nullable `sex`, but local profile sync does not currently use it.
- No implementation should infer sex from name, voice, account, Apple/Google profile, or appearance.

Reference-sex options:

| Option | Strength | Weakness |
| --- | --- | --- |
| A: collect optional reference sex for norm comparison | Scientifically clean for chair/shoulder; transparent | Adds sensitive profile input |
| B: use pooled references only where published | Privacy-preserving | Chair/shoulder source models are sex-specific; no ad-hoc pooling |
| C: conservative overlap of male/female ranges | Avoids sensitive input | Cannot support exact chair percentile; may be opaque |
| D: suppress norm claim when required input missing | Safest | Some users see raw-only results |

Recommendation by domain:

- Chair: Option A preferred. If unavailable, Option D. Do not pool.
- Balance: no reference-sex required because Springer reports no meaningful sex relationship; use total age-group table.
- Shoulder: Option A preferred for reference comparison because table is sex-stratified. If unavailable, raw-only or a clearly labelled pooled exploratory detail only after product review; do not silently pool.

Recommended wording:

```text
For published comparisons, which reference group should Pearl use?
Female
Male
Prefer not to say
```

Microcopy:

```text
This is optional and used only to choose the published comparison table. It does not change your training plan by itself.
```

Store future field as reference basis, not identity:

`referenceSexForPublishedComparisons: 'female' | 'male' | 'prefer_not_to_say' | null`

Privacy rule: local first; sync only as compact profile metadata after explicit product decision.

## 22. Age policy

Current age-band representatives are insufficient for exact chair percentile claims. A value of `50` may mean exact age 50 or a representative for 45-54.

Future age policy:

- Raw results remain available without age.
- Reference claims require age source metadata.
- Chair percentile range requires exact age or date-of-birth-derived age within Warden source range, 18-80 inclusive.
- Balance age-group comparison can use age group if exact age is unavailable, but the group must match source bins.
- Shoulder IQR comparison can use exact age mapped into five-year source bins.
- If user gives only Pearl's old age band, suppress exact chair percentile range and show raw-only until exact age is supplied.
- Birthdays: freeze age-at-test in snapshot. Do not recompute old results after birthday.
- Outside source range: raw-only and Pearl task band; no extrapolated reference claims.
- Users who prefer not to say: raw-only and Pearl task band.

Recommended future field metadata:

```ts
type ReferenceAgeBasis =
  | 'exact_age_at_test'
  | 'birth_year_month_derived'
  | 'age_group_only'
  | 'unknown';
```

## 23. Percentile/reference mathematics

Calculation classes:

| Domain | Class | Source transform |
| --- | --- | --- |
| Chair | exact published centile model, displayed as range | Warden calculator/model after legal approval and anchor tests |
| Balance | product-created Pearl task band plus source age-group benchmark | Springer best-of-three eyes-open table; no percentile |
| Shoulder | direct lookup of published IQR/range | Gill Table 1 age/sex/side IQR |

Rules:

- Do not mix exact percentile, reference range, task band, and raw-only under one generic `score`.
- Every result stores `resultKind`.
- Every transform stores source ID, source version/fingerprint, protocol version, transformation version, and display policy version.
- Chair higher generally maps to higher percentile.
- Balance longer is better only up to 45-second ceiling; above ceiling does not exist.
- Shoulder direction is not generic higher-is-better. Below IQR can suggest mobility work; above IQR is recorded neutrally.

Chair percentile range exact rules are in Section 12.

Reference-range rules:

- Shoulder: use source-published IQR as `published_middle_range`; below < Q1, within Q1-Q3, above > Q3.
- Balance: first controlled beta should avoid `within reference range` unless the dispersion field is source-reviewed. Use source benchmark detail or Pearl task band.
- If balance reference range is later approved, use only source-defined mean +/- 2 SD and document ceiling effects.

## 24. Missing/boundary behavior

| Case | Behavior |
| --- | --- |
| Missing age | Raw-only; no source reference |
| Old age-band representative only | Raw-only for chair percentile; age-group comparison may be allowed for balance/shoulder if bin is unambiguous |
| Missing reference sex | Raw-only for chair/shoulder; balance unaffected |
| Outside source age | Raw-only plus Pearl task band |
| Chair reps below/above model domain | Clamp only for internal transform if source model supports it; display extremes as below 10th/above 90th, not exact |
| Balance reaches 45s | Record 45s ceiling; do not imply actual max balance |
| Balance invalid trial | Does not consume valid attempt; retry |
| Changed balance leg | Raw valid; suppress longitudinal comparison to prior |
| Changed shoulder side | Reference can use new side if profile complete; suppress side-to-side longitudinal comparison |
| Hand support/push-off | Raw-only for chair; balance trial terminated |
| Setup uncertain | Raw-only |
| Tracking uncertain | Retry; if retained, raw-only or uncertainty-widened chair range only if count ambiguity is bounded |
| Pain-limited | Raw-only; no reference/focus severity claim |
| Incomplete official Check-Up | No official block unless minimum evidence policy passes |

## 25. Suggested-focus policy

Do not compare mixed outputs by exact percentile unless all headline domains eventually share validated comparable percentiles. They do not today.

Recommended controlled-beta policy: ordinal reference category with life-goal tie break.

Domain evidence categories:

```ts
type DomainEvidenceCategory =
  | 'below_reference'
  | 'within_reference'
  | 'above_reference_or_ceiling'
  | 'pearl_starting_point'
  | 'pearl_building'
  | 'raw_only_valid'
  | 'invalid_or_missing';
```

Priority:

1. If exactly one domain is `below_reference`, suggest that domain.
2. If multiple domains are `below_reference`, preserve current active focus on retest if included; otherwise use life goal if it maps to one of them; otherwise deterministic order strength, balance, mobility.
3. If no domain is below reference but one domain is `pearl_starting_point`, suggest it with raw/Pearl provenance.
4. If all valid domains are within/above/reference-ceiling, use life goal to choose focus, or preserve current focus on retest.
5. If evidence is close/incomplete, use life goal or a balanced block.
6. If fewer than two headline domains are valid, do not claim check-up-derived focus. Offer retake or goal-led/balanced start only if product owner approves.

Approved framing:

- `Suggested focus`
- `Clearest area to build from today's Check-Up`
- `Based on your results and goal`

Forbidden framing:

- weakest system
- body age
- movement age
- scientifically weakest
- diagnosis
- fall risk
- impairment

## 26. Focus edge cases

| Case | Policy |
| --- | --- |
| One domain clearly below reference | Suggest that domain |
| Two domains below reference | Preserve active focus on retest if among them; else life goal; else deterministic order |
| Three domains below reference | Life goal; else balanced block if product owner accepts; else deterministic order with transparent provenance |
| All within reference | Life goal-led suggested focus; if no goal, balanced/general plan |
| All above/reference-ceiling | Life goal-led or balanced; do not say no work needed |
| One domain raw-only | Use eligible domains; raw-only can contribute only as `pearl_starting_point` if raw band is low |
| Two domains raw-only | Prefer retake; if user proceeds, goal-led/balanced block with raw-only provenance |
| Contradictory tests | Retake affected item; no clear focus |
| Invalid test | Exclude from focus |
| Retest near-tie equivalent | Preserve current focus unless a new below-reference result clearly appears |
| Life goal conflicts with clear below-reference domain | Clear below-reference domain wins, but copy says sessions still support the life goal |

The current 5-year movement-age near-tie rule should be retired when the new policy ships.

## 27. Block-creation implications

Minimum evidence for official check-up-derived block:

- All three headline domains have valid raw metrics, and
- At least two domains have eligible reference or Pearl task categories, and
- Focus provenance is frozen.

Recommended block modes:

| Mode | When allowed | Copy |
| --- | --- | --- |
| `checkup_reference_focus` | Clear below-reference domain | `Suggested focus based on today's Check-Up` |
| `checkup_pearl_band_focus` | Raw/Pearl category clearly low, no source claim | `Suggested focus from today's task results` |
| `goal_led_reference_supported` | All within/above or close | `Suggested focus based on your goal and today's Check-Up` |
| `balanced_insufficient_reference` | Incomplete/mixed evidence but enough raw validity | `This plan works on all three areas` |
| `needs_retake` | Missing/invalid headline domains | No block creation |

Current `getBlockCreationEligibility` requires complete headline domains and current snapshots. Future implementation should keep fail-closed version checks and add result-policy compatibility checks.

## 28. Snapshot/version contract

Future implementation should introduce a new version boundary rather than mutate current snapshots.

Recommended constants when implemented:

- `SCORE_SNAPSHOT_SCHEMA_VERSION`: bump from 1 to 2.
- `CURRENT_SCORING_VERSION`: bump from 1 to 2.
- `CURRENT_NORM_VERSION`: bump from 1 to 2 or replace with `CURRENT_REFERENCE_VERSION = 1` if the code splits old age norms from new reference sources.
- Add `CURRENT_PROTOCOL_VERSION` per movement.
- Add `CURRENT_DISPLAY_POLICY_VERSION`.
- Add `CURRENT_FOCUS_POLICY_VERSION`.

Conceptual future snapshot:

```ts
type ReferenceResultSnapshot = {
  metricId: string;
  domain: 'strength' | 'balance' | 'mobility';
  rawValue: number;
  rawUnit: string;
  protocolId: string;
  protocolVersion: number;
  protocolEligibility: ReferenceClaimEligibility;
  resultKind:
    | 'percentile_range'
    | 'reference_range'
    | 'source_benchmark'
    | 'pearl_task_band'
    | 'raw_only';
  referenceSourceId?: string;
  referenceSourceVersion?: string;
  referencePopulation?: string;
  referenceAge?: number;
  referenceAgeBasis?: ReferenceAgeBasis;
  referenceSexBasis?: 'female' | 'male' | 'not_required' | 'unavailable';
  percentileLow?: number;
  percentileHigh?: number;
  referenceCategory?: 'below' | 'within' | 'above' | 'ceiling_complete';
  sourceFingerprint?: string;
  transformationFingerprint?: string;
  displayPolicyVersion: number;
  setupConfidence: 'confirmed' | 'uncertain' | 'not_required';
  trackingConfidence: 'high' | 'bounded_uncertain' | 'uncertain' | 'invalid';
  flags: string[];
};
```

Snapshot required fields:

- schema/scoring/reference/display/focus versions.
- source check-up ID.
- per-domain raw metric.
- per-domain result kind.
- per-domain claim eligibility.
- source/protocol/transform fingerprints when a reference claim is shown.
- profile reference inputs used at test time.
- setup and tracking flags.
- focus selection and focus provenance.

Fail-closed rules:

- Unknown schema -> unsupported.
- Unknown source/transform fingerprint -> raw-only display.
- Snapshot/source check-up mismatch -> invalid for block/report comparison.
- Future policy on old app -> show raw and compatibility warning if safe, else hide reference claim.

## 29. Legacy snapshot policy

Existing movement-age snapshots remain readable and immutable.

Policy:

- Do not recompute old snapshots.
- Do not rewrite old history.
- Old age ranges may remain visible in history only with a `legacy beta estimate` label.
- New Movement Profile results use the new schema/version.
- Do not compare old movement-age snapshots to new reference snapshots as trends.
- Old blocks/reports remain stable.
- Reports across old/new policy show: `Pearl's scoring method has changed since your earlier Check-Up, so a direct comparison isn't available.`
- If an old block completes after new scoring ships, its report uses compatibility status and avoids improved/declined language.

## 30. Sync/restore policy

Sync compact metadata only:

- Raw metric values.
- Result kind.
- Source IDs and fingerprints.
- Protocol/display/focus versions.
- Claim eligibility.
- Focus provenance.
- Snapshot compatibility metadata.

Do not sync:

- source PDFs,
- source table text,
- source workbook contents,
- raw video,
- landmark recordings,
- private source files.

Restore:

- Round-trip known snapshot schema exactly.
- Unsupported future policy fails closed to raw-only/history-safe display.
- Old devices must not activate internal feature flags from restored backend data.
- New devices can display legacy snapshots as legacy but must not recompute them.
- Sanitization must preserve privacy and avoid source-material payloads.

## 31. Movement Profile UX specification

Recommended hierarchy:

```text
Your Movement Profile

Chair-rise capacity
16 rises in 30 seconds
Around the 40th-60th percentile for your reference group

One-leg balance
28 seconds
Building the hold
Published age-group benchmark: about 41 seconds for a similar best-of-three test

Active shoulder reach
154 deg
Within the published middle range for your reference group

Suggested focus: Balance
This was the clearest area to build from today's Check-Up.
```

Notes:

- Raw metric is always the first measurable statement.
- Reference comparison is secondary.
- Caveat appears once at summary level, not as a long disclaimer on every card.
- Use `reference group`, `published comparison`, `published middle range`, `Pearl task band`.
- Do not use `Strength age`, `Balance age`, `Mobility age`, `movement age`, or `body age`.

## 32. Result-state matrix

| Domain | Raw result | Reference-eligible | Setup uncertain | Tracking uncertain | Protocol incomplete | Outside reference age | Pain-limited | Invalid |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chair | `16 rises in 30 seconds` | percentile range | raw baseline only | retry or raw-only | raw-only if hand support/partial protocol | raw-only | raw-only | retake |
| Balance | `28 seconds` | source benchmark detail/Pearl band | raw/Pearl band only | invalid trial retry | fewer valid attempts -> raw-only | raw/Pearl band | raw-only | retake |
| Shoulder | `154 deg` | IQR reference category | raw baseline only | retry or raw-only | retry/raw-only | raw-only | raw-only | retake |

CTA rules:

- Reference eligible: `View plan`.
- Raw-only but valid: `Continue` plus optional `Retake for comparison`.
- Tracking invalid: `Retry this movement`.
- Missing profile input: `Add reference details` after session, never mid-session.
- Incomplete official check-up: `Retake check-up`.

Focus eligibility:

- Reference eligible: full.
- Raw-only valid: limited; can support goal-led or Pearl-band focus.
- Pain-limited: excluded from clear deficit severity.
- Invalid: excluded.

## 33. Caveat hierarchy

Card-level, short:

- `Saved as your personal baseline.`
- `Reference comparison unavailable for this setup.`
- `This test stops at 45 seconds.`

Summary-level:

```text
Based on published reference groups using a similar test setup. Pearl's camera results are beta estimates, not medical assessments.
```

Methodology detail:

- Cite source.
- Explain protocol eligibility.
- Explain why exact age/movement-age is not shown.
- Explain that life goals can guide focus when results are close or incomplete.

Privacy/science detail:

- Reference sex is optional and only selects published comparison tables.
- Camera video is never shown or stored.
- Longitudinal change claims are not available until device repeatability is known.

## 34. Progress/report behavior

Until device repeatability and MDC are established:

- Show current and previous raw values.
- Show neutral difference: `Last time: 14 rises. Today: 16 rises.`
- Do not say improved/declined.
- Do not interpret percentile movement as true change.
- Do not show younger/older.
- Do not show focus flip as physiological change.
- If old/new policy mismatch, no direct comparison.

Future transition after validation:

- Add SEM/MDC thresholds by metric and device class.
- Only then allow `recorded higher/lower beyond expected measurement noise`.
- Keep clinical language out; still no diagnosis.

## 35. Check-Up duration model

Approximate total duration includes setup/framing/instructions, not only active movement.

| Protocol | Active movement time | Rest | Best-case total Check-Up | Median plausible | Worst reasonable |
| --- | ---: | ---: | ---: | ---: | ---: |
| Current | 115s active | none | 5-6 min | 6-8 min | 10+ min with framing retries |
| One 45s balance trial | chair 30 + balance 45 + shoulder 9 + hinge 9 = 93s | none | 5-6 min | 6-8 min | 10+ min |
| Two balance trials | 138s active | 30-60s | 6-7 min | 8-9 min | 12+ min |
| Three balance trials | 183s active | 60-120s | 8-9 min | 10-12 min | 14+ min |
| Adaptive best-of-three | 93-183s active | 0-120s | 5-6 min if trial 1 reaches 45s | 7-10 min | 13+ min |

Target:

- Median controlled-beta Check-Up: <= 9 minutes.
- 90th percentile Check-Up: <= 12 minutes.
- Worst reasonable with one invalid retry: <= 14 minutes.

If pre-implementation pilot exceeds these targets, reduce balance retry burden before implementation.

## 36. Friction-reduction policy

Allowed friction reducers:

- Stop balance after trial 1 if 45 seconds reached.
- Persist balance leg and shoulder side.
- One chair setup confirmation.
- No tape measure.
- One practice chair rep only.
- Reuse concise repeated instructions.
- Automatic invalid-trial retry with clear reason.
- Do not repeat camera tutorial after onboarding.
- Let setup uncertainty suppress reference claims rather than blocking the whole Check-Up.

Not allowed:

- Shortening balance below 45 seconds for reference comparison.
- Silently changing balance leg on retest.
- Using chair reference claim when setup is uncertain.
- Counting hand-supported chair reps against reference source.
- Calling source benchmarks percentiles.
- Hiding protocol deviations from snapshots.

## 37. Pre-implementation pilot purpose/population

Purpose: usability/protocol pilot, not scientific validation.

Test:

- protocol comprehension,
- chair setup feasibility,
- burden and total duration,
- adaptive balance attempt tolerance,
- shoulder side choice,
- likely camera-observability constraints,
- trust/comprehension of result wording.

Population:

- 8-12 adults.
- Approximately ages 45-65.
- Spread across 45-54 and 55-65.
- Mix of optional reference-sex groups if that input is likely to ship.
- Mix of activity/confidence levels.
- No recruitment based on known diagnosis.

Stop/exclusion in wellness language:

- Stop if dizzy, chest pain, unusual shortness of breath, sharp pain, unsafe balance, or participant wants to stop.
- Do not test a movement the participant says does not feel safe today.
- Keep support nearby for balance.

## 38. Pilot protocol

Manual observer/stopwatch before production implementation.

Chair:

- Use low-friction chair setup.
- Record chair type and whether seat seems roughly knee height.
- Ask participant to answer the knee-height confirmation.
- One practice rep.
- Observer count for 30 seconds.
- Record hand use, setup time, confusion, discomfort.

Balance:

- Use adaptive best-of-three candidate.
- Record first-trial result.
- If first trial reaches 45 seconds, stop.
- If not, ask whether participant is willing to do another attempt after rest.
- Record accepted/declined second and third attempts.
- Record best result, total time, rest preference, chosen leg, ceiling reaches, invalid/tracking-observability notes, perceived burden.
- Do not force all three attempts if participant wants to stop.

Shoulder:

- Test user-selected side, default right.
- Record side choice and comprehension.
- Capture one trial; optionally repeat once manually to estimate spread for pilot only.
- Record torso compensation observations, side confusion, discomfort, total time.

Result copy:

- Show sample Movement Profile wording after test.
- Ask participant to explain what it means.

## 39. Pilot data fields

Do not create a spreadsheet in this stage. Future data sheet fields:

- participant ID,
- age band,
- optional reference-sex group,
- activity/confidence self-rating,
- protocol version,
- chair setup confidence,
- chair type,
- chair approximate knee-height response,
- chair reps observer count,
- final partial rep observed,
- hand use,
- chair setup time,
- chair comprehension issue,
- balance leg,
- balance footwear/surface,
- balance trial 1 seconds,
- balance trial 2 seconds,
- balance trial 3 seconds,
- invalid balance trial reason,
- accepted second attempt,
- accepted third attempt,
- balance best seconds,
- balance total time,
- rest preference,
- balance perceived burden,
- shoulder selected side,
- shoulder trial 1 degrees if measured,
- shoulder trial 2 degrees if pilot repeat performed,
- shoulder side confusion,
- torso compensation notes,
- completion time by section,
- total check-up time,
- instruction repeats,
- likely tracking issue notes,
- discomfort/stop reason,
- result wording preference,
- participant explanation of percentile range,
- participant explanation of reference range,
- participant explanation of Pearl task band,
- participant explanation of suggested focus,
- trust rating 1-5.

## 40. Pilot success criteria

Go/revise/stop thresholds:

| Metric | Go | Revise | Stop/escalate |
| --- | --- | --- | --- |
| Completion rate | >= 85% complete all three headline protocols | 70-84% | <70% |
| Median total duration | <= 9 min | 9-11 min | >11 min |
| 90th percentile duration | <= 12 min | 12-14 min | >14 min |
| Balance second-attempt acceptance when trial 1 <45s | >= 75% | 50-74% | <50% |
| Balance third-attempt acceptance when trial 2 still <45s | >= 50% | 30-49% | <30% |
| Balance abandonment | <= 15% | 16-25% | >25% |
| Chair setup-confirmation clarity | >= 80% answer confidently | 60-79% | <60% |
| Instruction-repeat rate | <= 25% of sections | 26-40% | >40% |
| Shoulder side confusion | <= 20% | 21-35% | >35% |
| Safety stop incidence | 0 serious stops | any mild pattern | any serious event |
| Result-copy comprehension | >= 80% distinguish raw/reference/focus | 60-79% | <60% |
| Trust rating | median >= 4/5 | median 3-3.9 | median <3 |
| Diagnosis misread | <= 10% | 11-20% | >20% |

These are usability thresholds, not device-accuracy thresholds.

## 41. Result-copy interview plan

Ask participants what they think each phrase means:

- `16 rises in 30 seconds`
- `Around the 40th-60th percentile for your reference group`
- `Published age-group benchmark`
- `Within the published middle range`
- `Full 45-second hold completed`
- `Suggested focus`
- `Beta estimate, not a medical assessment`

Red flags:

- User thinks Pearl diagnosed weakness, fall risk, disease, or impairment.
- User thinks percentile range is exact.
- User thinks above shoulder range is necessarily better.
- User thinks suggested focus means other domains do not matter.
- User thinks raw-only means failure.

Revise copy if these red flags exceed pilot thresholds.

## 42. Post-implementation device pilot

Run only after feature-flag implementation.

Measure:

- app vs human chair count,
- app vs stopwatch balance time,
- app vs inclinometer/goniometer shoulder angle where feasible,
- within-session repeatability,
- between-day repeatability,
- tracking failure,
- setup sensitivity,
- percentile-band stability for chair,
- focus stability.

Minimum outputs:

- exact agreement for chair counts,
- chair count mean absolute error,
- balance timing mean absolute error,
- shoulder angle mean absolute error,
- Bland-Altman or equivalent agreement plots when sample size supports it,
- ICC where appropriate and reviewed,
- SEM,
- MDC,
- band-flip rate,
- focus-flip rate,
- invalid/tracking-failure rate by movement and device.

Statistician/domain review required before:

- claiming MDC,
- interpreting percentile movement longitudinally,
- using ICC as a product claim,
- setting public threshold copy.

## 43. Implementation batches

| Batch | Decisions required | Likely files | Tests | Source dependency | Pilot dependency | Beta blocker |
| --- | --- | --- | --- | --- | --- | --- |
| Stage 3D-B.2A protocol/state machine | Balance D final, chair final partial rule, shoulder side UI | movements, checkup, assessment controller, preflight copy | movement graders, session controller, replay fixtures | none beyond protocol citations | pre-implementation pilot preferred | yes |
| Stage 3D-B.2B source/reference engine | Warden legal approval, balance range decision, shoulder IQR policy | scoring/reference module, source fixtures | source anchors, boundary/property tests | yes | no | yes |
| Stage 3D-B.2C snapshot/version/sync migration | version names, backend payload compact shape | scoreSnapshot, pearlFlow assessments, backend sync/restore | round-trip, legacy fail-closed, restore | source fingerprints | no | yes |
| Stage 3D-B.2D Movement Profile UI/focus | final copy, focus provenance, raw-only UX | Results, OnboardingResults, Progress, Today, BlockReport, copy guardrails | view models, screen tests, copy guardrails | no | pilot copy findings | yes |
| Stage 3D-B.2E feature flag/QA harness | rollout flag owner, rollback policy | config, dev fixtures, replay harness | old/new path, flag immutability, regressions | all above | device pilot after | yes |

No implementation is started in this report.

## 44. Feature-flag plan

Use a non-user-controlled internal feature flag for the new system.

Requirements:

- A Check-Up chooses scoring/display policy at start and stores it through completion.
- No user can switch policy mid-Check-Up.
- Snapshots retain policy forever.
- Old/new snapshot paths are distinguishable.
- Backend restore cannot activate an internal policy.
- Rollback hides new reference claims but preserves raw results and snapshots.
- Internal flag must not be in public settings.
- Release builds default to old public-safe behavior until approved.

## 45. Verification plan

Before implementation sign-off, add tests for:

- Warden calculator anchor outputs.
- Warden transform fingerprint mismatch.
- chair setup eligibility.
- chair hand-push-off raw-only.
- chair count uncertainty and percentile-range widening.
- exact age/reference-sex required for chair.
- balance 45-second state machine.
- adaptive balance attempts.
- invalid balance trial not consuming attempt.
- balance leg persistence and changed-leg comparison suppression.
- shoulder side persistence.
- shoulder IQR lookup by age/sex/side.
- shoulder pain-limited raw-only.
- mixed-output focus policy.
- life-goal tie break.
- retest focus preservation.
- all-within/all-above behavior.
- raw-only block behavior.
- snapshot v2 parse/classify/round-trip.
- legacy v1 display and incompatible comparison.
- sync/restore compact metadata.
- copy guardrails blocking movement-age/weakest/diagnosis/fall-risk terms.
- property tests for percentile range boundaries.
- Stage 4 and Stage 5 regression tests.

## 46. Product-decision packet

| Decision | Recommendation | Rationale | Friction | Scientific strength | Implementation impact | Pilot dependency | Beta blocker |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Chair exact percentile vs range | Percentile range | Source supports centiles; home camera/setup does not support exact display | Low | Strong after source approval | Medium | copy test | yes |
| Chair reference-sex | Optional reference sex, raw-only if absent | Source is sex-specific | Medium | Strong | Profile/schema future work | wording test | yes |
| Chair setup eligibility | Rough knee-height confirmation; raw-only if uncertain | Avoids tape measure while protecting claim | Low | Moderate | Add setup metadata | yes | yes |
| Balance attempts | Adaptive best-of-three | Best tradeoff of source match and friction | Medium | Good | State machine work | yes | yes |
| Balance leg | User-selected preferred leg, persisted | Source used limb of choice; low friction | Low | Good | Store metadata | yes | yes |
| Balance claim | Raw + Pearl band; source benchmark detail | No percentile model | Low | Moderate | New display kinds | yes | yes |
| Shoulder side | User-selected side, persisted | Low friction; source has both sides | Low | Good | Store side metadata | yes | yes |
| Shoulder claim | IQR reference category | Source table supports IQR, not percentile | Low | Moderate | Reference lookup | no | yes |
| Suggested focus | Ordinal category + life goal | Handles mixed outputs honestly | Low | Moderate | Replace age-midpoint policy | copy test | yes |
| All within range | Life-goal or balanced focus | Avoids fake deficit | Low | Good | Focus policy | copy test | no |
| Raw-only behavior | Raw baseline, no reference claim | Safe claim suppression | Low | Strong | Eligibility states | no | yes |
| Legacy display | Immutable legacy beta estimate | Preserves history | Low | Strong | Snapshot compatibility | no | yes |
| Duration target | median <=9 min, p90 <=12 min | Keeps adherence plausible | Medium | Product-driven | Protocol tuning | yes | yes |
| Pilot thresholds | Section 40 | Separates usability from accuracy | Medium | Good | None | yes | yes |
| Versioning | New schema/scoring/reference/display/focus versions | Avoids rewriting history | Medium | Strong | Snapshot migration | no | yes |
| Public beta claim posture | No beta-ready claim | Device validation still missing | None | Strong | Governance | device pilot | yes |

## 47. Remaining unknowns

1. Legal/product approval to embed Warden workbook-derived parameters/formulas.
2. Exact extraction strategy for Warden calculator and whether to implement LMS directly or fixture outputs from the workbook.
3. Chair final-partial rule: pure full-stand count versus source half-up-at-expiry rule. The source uses half-up; Pearl's current rep tracker should not claim it until deterministic.
4. Whether balance source range should use source-defined mean +/- 2 SD after resolving table-header ambiguity and ceiling effects, or remain benchmark-only.
5. Whether users tolerate adaptive best-of-three balance in the target time budget.
6. Exact reference-sex wording after participant comprehension testing.
7. Whether shoulder source IQR copy is understood as a reference comparison rather than a health judgment.
8. Physical-device accuracy, repeatability, SEM/MDC, and band/focus stability.

## 48. Final stage decisions

`STAGE 3D-B.1 DESIGN COMPLETE`

`CHAIR REFERENCE CLAIM DESIGN READY`

`BALANCE 45-SECOND PROTOCOL DESIGN READY`

`SHOULDER REFERENCE CLAIM DESIGN READY`

`SUGGESTED-FOCUS POLICY DESIGN READY`

`MOVEMENT PROFILE IMPLEMENTATION SPEC READY`

`PRE-IMPLEMENTATION PILOT PLAN READY`

`IMPLEMENTATION NOT STARTED`

`STAGE 4 REMEDIATION COMPLETE`

`EXERCISE CATALOGUE SOFTWARE/CONTENT-READY FOR CONTROLLED BETA`

`STAGE 5 REMEDIATION COMPLETE`

`DYNAMIC WORKOUT GENERATION SOFTWARE-READY FOR CONTROLLED BETA`

`OVERALL BETA RELEASE STILL BLOCKED`

`PHYSICAL DEVICE VALIDATION REQUIRED`

## 49. Final Git status

Command:

```bash
git status --short --untracked-files=all
git diff --name-only
git diff --stat
```

Output:

```text
 M App.tsx
 M docs/decisions.md
 M src/adherence/__tests__/sessionCompletionFeedback.test.ts
 M src/adherence/screens/BlockReportScreen.tsx
 M src/adherence/screens/SessionCompletionScreen.tsx
 M src/components/AccountAuthCard.tsx
 M src/pearlFlow/__tests__/assessmentResultState.test.ts
 M src/pearlFlow/__tests__/planViewModel.test.ts
 M src/pearlFlow/__tests__/progressViewModel.test.ts
 M src/pearlFlow/appLifecycle.ts
 M src/pearlFlow/assessmentResultState.ts
 M src/pearlFlow/copy.ts
 M src/pearlFlow/extraSessionCopy.ts
 M src/pearlFlow/planViewModel.ts
 M src/pearlFlow/progressViewModel.ts
 M src/pearlFlow/sessionPlanning.ts
 M src/pearlFlow/types.ts
 M src/navigation/TabBar.tsx
 M src/navigation/__tests__/TabBar.test.ts
 M src/onboarding/__tests__/onboarding.test.ts
 M src/onboarding/results.ts
 M src/preflight/__tests__/setupCopy.test.ts
 M src/preflight/setupCopy.ts
 M src/profile/index.ts
 M src/profile/types.ts
 M src/screens/CameraSetupScreen.tsx
 M src/screens/CheckUpScreen.tsx
 M src/screens/ExploreScreen.tsx
 M src/screens/MicroCheckScreen.tsx
 M src/screens/OnboardingBlockScreen.tsx
 M src/screens/OnboardingResultsScreen.tsx
 M src/screens/PlanScreen.tsx
 M src/screens/ProgressScreen.tsx
 M src/screens/SafetyProfileScreen.tsx
 M src/screens/SessionPreviewScreen.tsx
 M src/screens/SettingsScreen.tsx
 M src/screens/TodayScreen.tsx
 M src/screens/TrainingSessionScreen.tsx
 M src/training/__tests__/workoutGeneration.test.ts
 M src/training/dailyTrainingContext.ts
 M src/training/serialize.ts
 M src/training/workoutGeneration.ts
?? docs/audits/PEARL_PERCENTILE_SCORING_PROTOCOL_DESIGN_STAGE_3D_B_1.md
?? docs/audits/Pearl_Stage_3D_B_1_Percentile_Protocol_Focus_Design_Prompt.md
?? src/profile/__tests__/activity.test.ts
?? src/profile/__tests__/age.test.ts
?? src/profile/activity.ts
?? src/profile/age.ts
App.tsx
docs/decisions.md
src/adherence/__tests__/sessionCompletionFeedback.test.ts
src/adherence/screens/BlockReportScreen.tsx
src/adherence/screens/SessionCompletionScreen.tsx
src/components/AccountAuthCard.tsx
src/pearlFlow/__tests__/assessmentResultState.test.ts
src/pearlFlow/__tests__/planViewModel.test.ts
src/pearlFlow/__tests__/progressViewModel.test.ts
src/pearlFlow/appLifecycle.ts
src/pearlFlow/assessmentResultState.ts
src/pearlFlow/copy.ts
src/pearlFlow/extraSessionCopy.ts
src/pearlFlow/planViewModel.ts
src/pearlFlow/progressViewModel.ts
src/pearlFlow/sessionPlanning.ts
src/pearlFlow/types.ts
src/navigation/TabBar.tsx
src/navigation/__tests__/TabBar.test.ts
src/onboarding/__tests__/onboarding.test.ts
src/onboarding/results.ts
src/preflight/__tests__/setupCopy.test.ts
src/preflight/setupCopy.ts
src/profile/index.ts
src/profile/types.ts
src/screens/CameraSetupScreen.tsx
src/screens/CheckUpScreen.tsx
src/screens/ExploreScreen.tsx
src/screens/MicroCheckScreen.tsx
src/screens/OnboardingBlockScreen.tsx
src/screens/OnboardingResultsScreen.tsx
src/screens/PlanScreen.tsx
src/screens/ProgressScreen.tsx
src/screens/SafetyProfileScreen.tsx
src/screens/SessionPreviewScreen.tsx
src/screens/SettingsScreen.tsx
src/screens/TodayScreen.tsx
src/screens/TrainingSessionScreen.tsx
src/training/__tests__/workoutGeneration.test.ts
src/training/dailyTrainingContext.ts
src/training/serialize.ts
src/training/workoutGeneration.ts
 App.tsx                                            |  16 +
 docs/decisions.md                                  |  12 +
 .../__tests__/sessionCompletionFeedback.test.ts    |  24 +-
 src/adherence/screens/BlockReportScreen.tsx        |  46 +--
 src/adherence/screens/SessionCompletionScreen.tsx  |   2 +-
 src/components/AccountAuthCard.tsx                 |  10 +-
 .../__tests__/assessmentResultState.test.ts        |   2 +-
 src/pearlFlow/__tests__/planViewModel.test.ts       |  17 +-
 src/pearlFlow/__tests__/progressViewModel.test.ts   |  14 +-
 src/pearlFlow/appLifecycle.ts                       |  30 +-
 src/pearlFlow/assessmentResultState.ts              |   8 +-
 src/pearlFlow/copy.ts                               |  84 +++---
 src/pearlFlow/extraSessionCopy.ts                   |   2 +-
 src/pearlFlow/planViewModel.ts                      |  58 ++--
 src/pearlFlow/progressViewModel.ts                  |  63 ++--
 src/pearlFlow/sessionPlanning.ts                    |   7 +-
 src/pearlFlow/types.ts                              |   1 +
 src/navigation/TabBar.tsx                          |   6 +-
 src/navigation/__tests__/TabBar.test.ts            |  10 +-
 src/onboarding/__tests__/onboarding.test.ts        |  18 +-
 src/onboarding/results.ts                          |  32 +-
 src/preflight/__tests__/setupCopy.test.ts          |   2 +-
 src/preflight/setupCopy.ts                         |  10 +-
 src/profile/index.ts                               |  11 +
 src/profile/types.ts                               |   2 +-
 src/screens/CameraSetupScreen.tsx                  |  23 +-
 src/screens/CheckUpScreen.tsx                      |  24 +-
 src/screens/ExploreScreen.tsx                      |   2 +-
 src/screens/MicroCheckScreen.tsx                   |  14 +-
 src/screens/OnboardingBlockScreen.tsx              |  26 +-
 src/screens/OnboardingResultsScreen.tsx            |  70 +++--
 src/screens/PlanScreen.tsx                         | 283 +++++++++---------
 src/screens/ProgressScreen.tsx                     | 126 ++++----
 src/screens/SafetyProfileScreen.tsx                |  32 +-
 src/screens/SessionPreviewScreen.tsx               | 322 +++++++++++----------
 src/screens/SettingsScreen.tsx                     | 161 ++++++-----
 src/screens/TodayScreen.tsx                        | 236 ++++++---------
 src/screens/TrainingSessionScreen.tsx              |  14 +-
 src/training/__tests__/workoutGeneration.test.ts   |  44 +++
 src/training/dailyTrainingContext.ts               |   1 +
 src/training/serialize.ts                          |   4 +
 src/training/workoutGeneration.ts                  |  40 +++
 42 files changed, 1073 insertions(+), 836 deletions(-)
```

Interpretation: the only new repository file from this task is this report. The other modified/untracked files pre-existed and were not edited by this task.

## 50. Temporary-file cleanup

Command:

```bash
rm -rf /tmp/pearl-stage3db1 && test ! -e /tmp/pearl-stage3db1 && echo '/tmp/pearl-stage3db1 removed'
```

Output:

```text
/tmp/pearl-stage3db1 removed
```

Temporary source files were removed. No source PDFs, workbooks, screenshots, tables, or other source artifacts were committed.
