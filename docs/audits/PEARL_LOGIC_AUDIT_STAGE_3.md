# Pearl Logic Audit Stage 3: Check-Up Scoring, Officialness, Progress, And Reports

Date: 2026-06-19

Scope: evidence-only production-readiness audit of raw Movement Check-Up results through scoring,
assessment creation, officialness, block eligibility, progress summaries, block reports, local
serialization, and backend sync/restore mappers.

No production code, tests, fixtures, config, dependencies, native files, norm tables, or prior audit
files were changed. The only repo artifact created by this stage is this report.

## 1. Executive Verdict

Stage 3 does not clear Pearl's scoring and official progress semantics for beta. The core scoring
implementation is small, deterministic, and well covered for normal fixtures, but beta readiness is
blocked by evidence-sufficiency, official/manual contamination, malformed-result hardening,
versioning, and normative-provenance decisions.

Final decisions:

- STAGE 3 REMEDIATION REQUIRED
- STAGE 4 BLOCKED
- STAGE 5 INPUTS BLOCKED

Primary blockers:

- F3-001: A one-domain Check-Up can become a completed, medium-confidence, block-eligible
  assessment.
- F3-002: Manual-extra raw history can contaminate progress and next-block flows despite copy saying
  it will not replace official trend.
- F3-003: Malformed chair-stand results can score as valid/young or crash scoring.
- F3-004: Scores and norms are not version-pinned across history, reports, sync, or restore.
- F3-005: Norm provenance and movement-age claims need product/science sign-off before beta.

## 2. Baseline And Repository Status

Initial repository safety commands for this Stage 3 run:

```text
git status --porcelain=v1 --untracked-files=all
git diff --name-only
git diff --stat
```

All three were clean at Stage 3 start. Prior Stage 0, Stage 1, Stage 1A, Stage 2, Stage 2A, and
Stage 2A.1 reports existed under `docs/audits/` and were treated as baseline evidence.

Current validation commands run during Stage 3:

| Command | Exit | Result |
|---|---:|---|
| `npm test -- --runInBand src/scoring/__tests__/scoring.test.ts src/pearlFlow/__tests__/assessmentEligibility.test.ts src/pearlFlow/__tests__/assessmentResultState.test.ts src/pearlFlow/__tests__/pearlFlow.test.ts src/pearlFlow/__tests__/progressViewModel.test.ts src/pearlFlow/__tests__/appLifecycle.test.ts src/pearlFlow/__tests__/planViewModel.test.ts src/pearlFlow/__tests__/sessionPlanning.test.ts src/adherence/__tests__/blockServiceEligibility.test.ts src/adherence/__tests__/adherence.test.ts src/history/__tests__/history.test.ts src/services/backend/__tests__/checkupSyncService.test.ts src/services/backend/__tests__/blockSyncService.test.ts src/services/backend/__tests__/blockReportSyncService.test.ts src/services/backend/__tests__/restoreService.test.ts src/onboarding/__tests__/onboarding.test.ts` | 0 | 16 suites passed, 123 tests passed, 0 snapshots. Watchman recrawl warning and Jest open-handle notice appeared. Expected backend/report/session-planning console logs and warnings appeared. |
| `npm test -- --runInBand` | 0 | 80 suites passed, 515 tests passed, 0 snapshots. Same Watchman warning and Jest open-handle notice. Expected sync/fallback console logs and warnings appeared. |
| `npm run typecheck` | 0 | `tsc --noEmit` passed. |
| `npx --no-install expo config --type public` | 0 | Expo config resolved. Warning: `[@sentry/react-native/expo] Missing config for organization, project`. Resolved Android config includes camera, record-audio, modify-audio-settings, foreground-service, and foreground-service-media-playback permissions. |
| `git diff --check` | 0 | No whitespace errors before report creation. |

No network browsing or package installation was used. A temporary numerical probe script was created
under `/tmp`, run with the repo's existing `tsx`, and deleted.

## 3. Production Scoring And Interpretation Call Graph

Primary completion path:

```text
CheckUpScreen
  -> App.handleCheckUpComplete
  -> scoreCheckUp(checkUp)
  -> createMovementAssessment(score, type, official flag)
  -> getBlockCreationEligibility(score, assessment)
  -> store.save(checkUp)
  -> syncMovementCheckupToRemote(...)
  -> ResultsScreen or OnboardingResultsScreen
```

Plan creation path:

```text
ResultsScreen / OnboardingResultsScreen
  -> getAssessmentResultState(score)
  -> App.handleStartPlan
  -> getBlockCreationEligibility(score, assessmentForCheckUp(...))
  -> createMovementBlockFromAssessment(...)
  -> training buildBlock(...)
  -> startBlock / upsertMovementBlock
```

Official retest path:

```text
official_retest CheckUp
  -> scoreCheckUp
  -> createMovementAssessment(type=official_retest)
  -> if ineligible: save attempt and return to results
  -> if eligible: mark block complete
  -> createMovementBlockReport(previousScore, latestScore)
  -> create next MovementBlock and legacy TrainingBlock
```

Progress path:

```text
ProgressScreen
  -> getLatestCheckUpSummary(history)
  -> scoreCheckUp(latest raw StoredCheckUp)
  -> getDomainProgressCards(history)
  -> raw first-vs-latest metric deltas
```

Backend path:

```text
syncMovementCheckupToRemote
  -> mapLocalCheckupToRemotePayload
  -> scoreCheckUp(input.checkUp) unless score supplied
  -> derived_scores_json + raw_checkup_json

restoreRemoteStateIfLocalEmpty
  -> mapRemoteCheckupsToLocal(raw_checkup_json)
  -> mapRemoteAssessmentsToLocal
  -> createMovementAssessment(scoreCheckUp(restored raw checkUp), restored metadata)
```

Key anchors:

- `App.tsx:1255` begins completion handling; `App.tsx:1259` scores the Check-Up.
- `App.tsx:1273` creates the assessment; `App.tsx:1284` saves raw history.
- `App.tsx:1407` begins plan creation from visible result.
- `App.tsx:1912` begins next-block creation from `lastResult` or latest history.
- `src/scoring/scoring.ts:192` is the scoring entry point.

## 4. Scoring Data-Model Map

| Layer | Shape | Role | Stage 3 risk |
|---|---|---|---|
| Raw check-up | `CheckUp` with `startedAt`, `bodyUnit`, `items` | Source of truth stored locally and remotely | No per-record check-up type, scoring version, norm version, or item shape validation. |
| Item | `CheckUpItem` with `movementId`, `status`, `result` | One movement result or skip/unmeasured marker | `findItem` returns first matching item; duplicates are not rejected. |
| Movement result | Movement-specific result extending `MovementResultBase` | Supplies reps, hold seconds, ROM, velocity, TUG | Scorer assumes `flags` exists and chair `reps` is numeric. |
| Domain result | `DomainResult` | `measured`, age bounds, estimate flag, interpretation, rows | Primary age inputs are narrower than UI domain labels. |
| CheckUp score | `CheckUpScore` | Domains plus `weakestDomain` | No score version or norm version. |
| Assessment | `MovementAssessment` | Persisted official/manual attempt, midpoint scores, weakest domain, confidence | Stores derived midpoints and raw measured domain count, but not scorer/norm version. |
| Block | `MovementBlock` | Focus domain and schedule | Can be built from one eligible domain. |
| Report | `MovementBlockReport` | Before/after domain changes and next focus | Compares movement-age midpoints with no meaningful-change threshold. |
| Backend payload | `movement_checkups`, `movement_blocks`, reports | Remote optional sync/restore | Check-up enum loses some local types; restore rescoring uses current code. |

## 5. Norm Provenance Register

| Norm | Production input | Real-data range in code | Estimate/extrapolation behavior | Source in code | Audit verdict |
|---|---|---:|---|---|---|
| Chair stand reps | Strength age | 60-94 | Ages 47, 52, 57 are estimated anchors; young-end estimates are surfaced | Rikli and Jones Senior Fitness Test, sex-pooled midpoints (`src/scoring/norms.ts:47`) | Needs source-table verification and sex/age policy sign-off. |
| TUG seconds | Not active age scoring; supporting row/trend only | 60-99 | Under-60 estimates | Bohannon TUG meta-analysis (`src/scoring/norms.ts:74`) | Historical-compatible, but unused for balance age. |
| Single-leg stance seconds | Balance age | 60-99 | Ages 50 and 55 estimated | Bohannon single-limb stance meta-analysis (`src/scoring/norms.ts:98`) | Needs balance-ladder policy sign-off because other ladder stages and sway are ignored for age. |
| Shoulder flexion ROM | Mobility age | None treated as real | Whole table marked estimated (`realAgeMin: 100`, `estimated: true`) | Broad Norkin/White and aging-ROM literature note (`src/scoring/norms.ts:121`) | Not enough provenance for beta movement-age claims without science/product review. |
| Hinge reach | Supporting row/trend only | None | No age norm | N/A | Correctly not age-scored, but domain label implies trunk/hip mobility. |
| Rise velocity | Supporting row/trend only | None | No age norm | N/A | Correctly not age-scored, but product language calls this a headline metric. |

## 6. Strength/Power Scoring Audit

Production rule:

- `strengthDomain` reads the first chair-stand item (`src/scoring/scoring.ts:125`).
- Chair stands are age-scored only when `cs` exists and `cs.reps > 0`.
- Rise velocity is displayed only when `sessionMeanVel` is finite; it never affects age or focus.
- Chair reps map through `CHAIR_STAND_REPS_NORM`.

Confirmed behavior from probe:

- 14 reps -> age 65-73, measured true.
- 12 reps as the only measured domain -> completed medium-confidence assessment, block eligible,
  focus `strength_power`.
- Missing chair `reps` field -> displays `undefined reps`, produces age 41-53, assessment completed,
  block eligible. This is F3-003.
- String `"14"` for reps is coerced by comparisons/arithmetic and scores as 14 reps.
- If `flags` is missing from the result object, scoring throws `TypeError: Cannot read properties of undefined (reading 'includes')`.

Readiness verdict: normal chair scoring is deterministic, but chair result shape must be hardened
before beta because malformed local/remote history can create an official-looking young strength
result.

## 7. Balance Scoring Audit

Production rule:

- `balanceDomain` reads TUG and balance ladder (`src/scoring/scoring.ts:144`).
- Only `singleLegEyesOpenSec` drives balance age.
- TUG is a supporting row if completed and finite; it does not affect balance age.
- If `singleLegEyesOpenSec` is not finite, balance is unmeasured even with a valid TUG.
- If `singleLegEyesOpenSec < 8`, interpretation adds practice-oriented copy.

Confirmed behavior from probe:

- TUG-only check-up with completed 9.2 s -> balance unmeasured, assessment invalid, not block eligible.
- Negative one-leg seconds -> measured, old-end age 81-89, eligible.
- 999 s one-leg hold -> measured, age 44-56 estimate, eligible.

Readiness verdict: TUG-only is correctly non-official for balance age. Plausibility bounds for hold
seconds should be explicit; current scoring only checks finite-ness.

## 8. Mobility Scoring Audit

Production rule:

- `mobilityDomain` reads shoulder flexion and hinge reach (`src/scoring/scoring.ts:172`).
- Only shoulder flexion drives mobility age.
- Hinge reach is a supporting row only.
- If shoulder peak is missing or non-finite, mobility is unmeasured even with valid hinge reach.
- Shoulder norm is always estimated.

Confirmed behavior from probe:

- Hinge-only check-up -> mobility unmeasured, assessment invalid, not block eligible.
- Shoulder-only check-up -> completed medium-confidence assessment, block eligible, focus mobility.
- Negative shoulder ROM -> measured, old-end age 74-86 estimate, eligible.
- 999 deg shoulder ROM -> measured, age 44-56 estimate, eligible.

Readiness verdict: Stage 2A fixed ROM valid-capture upstream, and hinge-only is not official evidence.
Plausibility bounds and product messaging for shoulder-only mobility are still needed.

## 9. Historical TUG Compatibility Audit

TUG remains implemented and score-visible as compatibility/supporting data:

- `DEFAULT_BATTERY` excludes TUG (`src/checkup/checkup.ts:36`).
- `BETA_BATTERY_WITH_TUG` includes TUG (`src/checkup/checkup.ts:45`).
- `TUG_SECONDS_NORM` exists (`src/scoring/norms.ts:74`) but is not used by `scoreCheckUp`.
- Results show TUG as "Up-and-go time" when present.
- Trends include `tug-time` with `betterIsHigher: false`.

Verdict: historical TUG compatibility exists, but no active official balance-age semantics depend on
TUG. Any future TUG reinstatement must decide whether TUG influences balance age, report changes,
weakest-domain focus, and non-standard short-path eligibility.

## 10. Scoring-Rule And Threshold Register

| Rule | Current threshold/logic | Evidence |
|---|---|---|
| Usable result | item exists, status measured, result truthy, `flags` lacks `no-measurement` | `src/scoring/scoring.ts:69` |
| Strength measured | chair result exists and `reps > 0` by loose comparison | `src/scoring/scoring.ts:125` |
| Rise velocity row | finite `sessionMeanVel` only | `src/scoring/scoring.ts:137` |
| Balance measured | finite `singleLegEyesOpenSec` | `src/scoring/scoring.ts:144` |
| TUG row | completed TUG and finite total seconds | `src/scoring/scoring.ts:151` |
| Balance caution copy | one-leg hold `< 8` seconds | `src/scoring/scoring.ts:166` |
| Mobility measured | shoulder result exists and finite `peakFlexionDeg` | `src/scoring/scoring.ts:172` |
| Hinge row | finite `reachBu`; no age claim | `src/scoring/scoring.ts:184` |
| Age mapping band | 4 years normally, 6 years if estimated | `src/scoring/scoring.ts:86` |
| Young ceiling | better than youngest anchor clamps at youngest age | `src/scoring/norms.ts:151` |
| Old floor | worse than oldest anchor clamps at oldest age | `src/scoring/norms.ts:159` |
| Weakest domain | highest measured age-range midpoint | `src/scoring/scoring.ts:192` |
| Tie break | strict `>` means first domain in order wins | `src/scoring/scoring.ts:200` |
| Assessment confidence | high >=3 measured, medium >=1, low 0 | `src/pearlFlow/assessments.ts:90` |
| Assessment status | low -> invalid, otherwise completed by default | `src/pearlFlow/assessments.ts:14` |
| Official type | baseline, baseline_retake, official_retest | `src/pearlFlow/assessments.ts:50` |
| Block eligibility | completed assessment, measured domains >0, focus present, focus finite, consistent | `src/pearlFlow/assessmentEligibility.ts:28` |
| Snapshot band | midpoint <=58 strong, <=72 building, else starting point | `src/pearlFlow/appLifecycle.ts:429` |
| Report improvement | lower movement-age midpoint is improved; exact equality is held steady | `src/pearlFlow/reports.ts:58` |
| UI report wording | lower result becomes "Adjusted for next block" | `src/adherence/screens/BlockReportScreen.tsx:108` |
| Trend improvement | sign of raw delta only; no threshold | `src/screens/ResultsScreen.tsx:166` |

## 11. Numerical Boundary, Monotonicity, And Adversarial Results

Probe command:

```text
npx --no-install tsx /tmp/pearl-stage3-probe.ts
```

The script used production `scoreCheckUp`, `createMovementAssessment`, `getBlockCreationEligibility`,
and `inferAge`; it was deleted after running.

Key results:

| Case | Result |
|---|---|
| Nominal full check-up | Strength 65-73, balance 77-85, mobility 54-66 estimate; weakest balance; high confidence; eligible. |
| Strength only | Strength 78-86; medium confidence; eligible; focus strength_power. |
| Shoulder only | Mobility 69-81 estimate; medium confidence; eligible; focus mobility. |
| TUG only | No measured domains; invalid; not eligible. |
| Hinge only | No measured domains; invalid; not eligible. |
| Exact midpoint tie across all domains | Weakest becomes strength because score loop uses strict `>` in strength, balance, mobility order. |
| Negative balance and shoulder | Negative values are finite, scored, and eligible. |
| Very high balance and shoulder | Extreme values clamp to young estimates and remain eligible. |
| Missing chair reps | Scores as age 41-53 and eligible with display `undefined reps`. |
| Chair reps string | Scores as numeric 14 by JavaScript coercion. |
| Duplicate chair: first skipped, second measured | First-match search ignores the later measured item; score invalid. |
| Missing result flags | Scoring throws a TypeError. |

Monotonicity: norm anchor samples are monotonic in the intended direction for chair, single-leg, and
shoulder. The inversion correctly clamps at young/old ends, but does not validate plausible input
ranges.

## 12. Evidence Sufficiency And Confidence Matrix

| Evidence set | Domains measured | Assessment status | Confidence | Block eligible | Audit verdict |
|---|---:|---|---|---|---|
| Full chair + balance + shoulder | 3 | completed | high | yes | Expected. |
| Chair only | 1 | completed | medium | yes | Product decision required. |
| Shoulder only | 1 | completed | medium | yes | Product decision required, higher risk because shoulder norm is wholly estimated. |
| TUG only | 0 | invalid | low | no | Correct for current rules. |
| Hinge only | 0 | invalid | low | no | Correct for current rules. |
| All skipped/no-measurement | 0 | invalid | low | no | Covered by tests. |
| Newer invalid official retest after older valid official | 0 for attempt | invalid | low | no; older valid remains usable | Covered by tests. |

The current minimum for a block is one finite focus domain. This is explicitly protected by
`src/pearlFlow/__tests__/assessmentEligibility.test.ts:205`.

## 13. Weakest-Domain And Tie-Breaking Audit

Current policy:

- The weakest domain is the measured domain with the highest age-range midpoint.
- Ties are not explicit; strict `>` means the first encountered domain wins.
- Domain order is strength, balance, mobility.

Confirmed tie case:

- Strength midpoint 62, balance midpoint 62, mobility midpoint 62 -> weakest strength.

Risk: tie behavior affects training focus and report next focus, but is not documented as product
policy. Near ties also have no measurement-noise or minimum-difference threshold.

## 14. Check-Up-Type And Officialness Matrix

| Type | Official by type | Typical entry point | Current use |
|---|---|---|---|
| `baseline` | yes | first Check-Up/onboarding | Can be official with one measured domain. |
| `baseline_retake` | yes | first 48-hour retake option | Replacement requires confirmation and eligibility. |
| `official_retest` | yes | due retest after block | Invalid attempts are saved but do not complete block/report. |
| `manual_extra` | no | manual full check-up after baseline | Saved in raw history; can appear in progress and raw latest flows. |
| `quick_recheck` | no | inactive restart option | Not official, but raw Check-Up handling shares history path when completed. |
| `micro_check` | no | micro-check path | Separate micro-check storage, not a full Check-Up in normal flow. |

Officialness implementation:

- `isOfficialCheckupType` returns true only for baseline, baseline_retake, official_retest
  (`src/pearlFlow/assessments.ts:50`).
- Manual option copy says manual-extra will not replace official trend
  (`src/pearlFlow/manualCheckup.ts:69` and `src/pearlFlow/manualCheckup.ts:88`).
- Raw history records do not store check-up type.
- Progress summaries use raw history only.
- `latestAssessment` falls back from usable official assessment to any eligible assessment, then to a
  synthetic baseline assessment from latest raw history (`App.tsx:1187`).

## 15. Manual-Extra Contamination Verification

Confirmed contamination paths:

- `ProgressScreen` receives raw `history`, and `getLatestCheckUpSummary` scores the latest raw history
  item without a type filter (`src/pearlFlow/progressViewModel.ts:86`).
- `getDomainProgressCards` compares first raw check-up to latest raw check-up (`src/pearlFlow/progressViewModel.ts:97`).
- Lifecycle `latestUsableCheckUpScore` scans raw history backward and accepts the latest block-eligible
  raw score, independent of assessment officialness (`src/pearlFlow/appLifecycle.ts:352`).
- `handleStartNextBlock` uses `lastResult ?? latest?.checkUp`; if `lastResult` is a manual-extra
  Check-Up and eligible, it can seed next block creation (`App.tsx:1912`).
- Results history and trends do not carry or filter check-up type.

Verdict: manual-extra is not official in `MovementAssessment`, but raw-history consumers can still
use it for progress and next-block semantics. This contradicts user-facing manual-extra copy.

## 16. Result-Screen Interpretation Audit

Results screen:

- Re-scores the passed raw Check-Up (`src/screens/ResultsScreen.tsx:40`).
- Shows "Domains measured X/3" (`src/screens/ResultsScreen.tsx:77`).
- Shows "Create my 4-week block" whenever `getAssessmentResultState` says eligible
  (`src/screens/ResultsScreen.tsx:105`).
- Shows "Typical of age X-Y" and appends "(estimate)" for estimated domains
  (`src/screens/ResultsScreen.tsx:145`).

Onboarding results:

- Re-scores the Check-Up (`src/screens/OnboardingResultsScreen.tsx:31`).
- If block eligible, says "Pearl will use this to shape your first 4-week block"
  (`src/screens/OnboardingResultsScreen.tsx:48`).
- Shows "Create my 4-week block" (`src/screens/OnboardingResultsScreen.tsx:86`).
- Pending domains are labeled "Baseline pending" (`src/onboarding/results.ts:58`).

Verdict: the screens expose measured count and pending labels, but the primary CTA still allows a
one-domain result to become plan-shaping evidence. That is product-policy dependent, not merely UI
copy.

## 17. Progress And Block-Report Comparison Audit

Progress:

- Latest summary is based on latest raw Check-Up, not latest official assessment.
- Domain progress compares first raw Check-Up to latest raw Check-Up.
- Balance progress uses tandem hold preferentially, then one-leg hold, then best stage
  (`src/pearlFlow/progressViewModel.ts:322`), while scoring uses one-leg only. This means Progress can
  show balance progress on a metric different from balance-age scoring.
- Mobility progress can use shoulder or hinge, while mobility age uses shoulder only.

Block report:

- Stored report compares previous/latest movement-age midpoints only for domains measured in both
  (`src/pearlFlow/reports.ts:58`).
- UI report independently computes domain changes and shows "Re-test saved" for unmeasured domains
  (`src/adherence/screens/BlockReportScreen.tsx:116`).
- Next focus is latest score weakest domain or the current block focus fallback
  (`src/adherence/screens/BlockReportScreen.tsx:38`).

Verdict: reports avoid fabricating change where a domain is missing, but they use exact midpoint
comparisons with no meaningful-change threshold.

## 18. Rounding, Precision, And Meaningful-Change Audit

Current precision behavior:

- Domain ages are rounded to integer age bounds.
- Chair reps display raw count, including fractional or string-coerced values if present.
- Rise velocity displays two decimals.
- TUG displays one decimal.
- One-leg balance displays rounded seconds.
- Shoulder flexion displays rounded degrees.
- Hinge reach displays two decimals.
- Trend delta displays two decimals under abs 10, zero decimals otherwise.

Meaningful-change gaps:

- Report direction treats any current midpoint lower than previous as improved.
- Exact equality is held steady; any higher midpoint is declined/adjusted.
- Progress trend copy uses sign of raw deltas; no minimum detectable change threshold.
- There is no explicit threshold for "same enough" across movement age, reps, seconds, ROM, hinge
  reach, or velocity.

Verdict: production should define meaningful-change thresholds before beta reports claim
improvement or adjustment.

## 19. Scoring/Norm Versioning Audit

Confirmed versioning state:

- Raw history has `HISTORY_SCHEMA_VERSION`, but no scoring or norm version
  (`src/history/serialize.ts:17`).
- History comments explicitly state raw Check-Ups are rescored on load so norm/scoring changes apply
  retroactively (`src/history/serialize.ts:4`).
- `MovementAssessment.results.rawMetrics` stores only `checkUpId` and measured-domain count
  (`src/pearlFlow/assessments.ts:40`).
- Remote check-up payload stores raw Check-Up JSON and derived score JSON, but no named scorer/norm
  version (`src/services/backend/checkupSyncService.ts:158`).
- Restore recreates local assessments by rescoring raw Check-Ups with current code
  (`src/services/backend/restoreService.ts:485`).

Risk: after norm or scoring changes, historical progress, block reports, restored assessments, and
latest official focus can change retroactively without an audit trail.

## 20. Serialization And Restore Audit

Local history:

- `serializeCheckUp` stores `{ schemaVersion, checkUp }`.
- Non-finite numbers serialize to null.
- `migrate` validates only top-level schema, checkUp object, items array, and startedAt string.
- Movement item result shapes are not validated.

Adherence:

- `deserializeAdherenceState` filters top-level block, assessment, report, completion shapes only.
- It does not validate score/norm version or deep result fields.

Backend:

- Check-up sync sanitizes frame/landmark/video-like keys.
- `baseline_retake`, `quick_recheck`, and `micro_check` map to remote `unknown`
  (`src/services/backend/checkupSyncService.ts:182`).
- Restore uses `derived_scores_json.assessment` metadata if present; otherwise remote unknown maps to
  `manual_extra`.

Verdict: top-level schema survival is covered. Deep movement-result validation and type/version
preservation remain incomplete.

## 21. Block-Focus Handoff Audit

Block handoff path:

- `createMovementBlockFromAssessment` normalizes score/assessment and calls eligibility first
  (`src/adherence/blockService.ts:43`).
- Missing focus no longer falls back to strength for block creation.
- MovementBlock focus is the eligibility focus domain.
- Legacy training block uses `score.weakestDomain`; if the caller bypasses eligibility, missing focus
  can still produce an un-biased legacy block or default strength in dynamic generation.

Verdict: Stage 1A fixed the no-measurement-to-strength P0 for the main block service. The remaining
risk is upstream sufficiency and malformed score evidence.

## 22. User-Facing Claims Register

| Surface | Claim/copy | Evidence basis | Risk |
|---|---|---|---|
| Results | "Typical age ranges from today's guided check-up" | Domain age norms | Norm provenance and partial evidence. |
| Domain card | "Typical of age X-Y" | Single primary metric per domain | Domain label may imply broader evidence. |
| Results focus | "most useful area for your next four-week training block" | Highest movement-age midpoint | Tie/noise/sufficiency policy missing. |
| Onboarding | "simple picture from today's baseline" | Same score | Can be one-domain baseline. |
| Onboarding | "Pearl will use this to shape your first 4-week block" | Eligibility | One measured domain currently enough. |
| Manual options | "will not replace your official trend" | Assessment official flag only | Raw history progress can still use manual Check-Ups. |
| Progress | "Latest movement check-up" | Latest raw history | Not necessarily official. |
| Progress bands | Strong/building/starting point | Age midpoint thresholds | Thresholds are product-defined, not norm-sourced. |
| Report | "Improved", "Held steady", "Adjusted" | Exact midpoint comparison | No meaningful-change threshold. |
| Report | "next block ... will focus on X" | Latest score weakest or fallback | Can be manual/latest raw in some flows. |

## 23. Existing-Test And False-Confidence Analysis

Strong existing coverage:

- Norm inversion and standard scoring.
- Skipped/no-measurement results.
- Hinge not scoring mobility without shoulder.
- Invalid no-domain assessments blocked.
- Invalid official retest attempts do not complete a block/report.
- Official V1 battery excludes TUG.
- History schema and NaN-to-null behavior.
- Backend sanitization of frames/landmarks.
- Restore of sanitized rows.

False-confidence gaps:

- Tests deliberately preserve one-domain block eligibility.
- No test covers missing chair `reps`, string `reps`, missing `flags`, duplicate movement items, or
  implausible negative/extreme values.
- No tests assert manual-extra is excluded from progress/latest raw history.
- No tests assert scorer/norm version pinning.
- No tests assert a defined tie-break policy.
- No tests assert meaningful-change thresholds for progress or reports.
- No tests assert exact norm source rows or sex/age stratification decisions.

## 24. Scoring Invariant Register

Status legend: OK means verified current behavior; RISK means verified current behavior is risky;
DECISION means product/science policy is required.

| ID | Invariant | Status |
|---|---|---|
| I-001 | A Check-Up score always returns strength, balance, mobility in that order. | OK |
| I-002 | No composite score is produced. | OK |
| I-003 | Skipped chair stand does not score strength. | OK |
| I-004 | Chair stand with `no-measurement` does not score strength. | OK |
| I-005 | Chair stand reps <=0 do not score strength. | OK |
| I-006 | Missing chair reps currently scores as young strength. | RISK |
| I-007 | String chair reps currently coerces to numeric scoring. | RISK |
| I-008 | Missing movement result `flags` currently crashes scoring. | RISK |
| I-009 | Rise velocity never changes strength age. | DECISION |
| I-010 | Rise velocity can trend independently of strength age. | OK |
| I-011 | Push-off detected is not a user-facing scoring penalty in this path. | OK |
| I-012 | TUG completion alone does not measure balance. | OK |
| I-013 | TUG displays as supporting balance row when present. | OK |
| I-014 | TUG non-standard short path is displayed in the row. | OK |
| I-015 | TUG does not affect weakest domain. | OK |
| I-016 | Single-leg eyes-open seconds are the only balance age input. | DECISION |
| I-017 | Balance ladder earlier stages do not affect balance age. | DECISION |
| I-018 | Balance sway proxy does not affect balance age. | DECISION |
| I-019 | Negative single-leg seconds currently score as measured. | RISK |
| I-020 | Extremely high single-leg seconds clamp to young estimate. | RISK |
| I-021 | Hinge reach alone does not measure mobility. | OK |
| I-022 | Shoulder flexion alone can measure mobility. | DECISION |
| I-023 | Shoulder flexion norm is always estimated. | OK |
| I-024 | Hinge reach never changes mobility age. | DECISION |
| I-025 | Negative shoulder ROM currently scores as measured. | RISK |
| I-026 | Extremely high shoulder ROM clamps to young estimate. | RISK |
| I-027 | Estimated norms use a wider age band than real norms. | OK |
| I-028 | Young-end values clamp instead of extrapolating beyond youngest anchor. | OK |
| I-029 | Old-end values clamp instead of extrapolating beyond oldest anchor. | OK |
| I-030 | Age low is clamped to at least 18. | OK |
| I-031 | Weakest domain is highest movement-age midpoint. | OK |
| I-032 | Exact ties resolve to strength by iteration order. | RISK |
| I-033 | Near ties have no margin/noise threshold. | DECISION |
| I-034 | Zero measured domains produce null weakest domain. | OK |
| I-035 | One measured domain becomes weakest if finite. | DECISION |
| I-036 | Assessment confidence high requires three measured domains. | OK |
| I-037 | Assessment confidence medium requires at least one measured domain. | DECISION |
| I-038 | Low-confidence assessment defaults to invalid. | OK |
| I-039 | Medium-confidence assessment defaults to completed. | DECISION |
| I-040 | Completed one-domain assessment can be block eligible. | DECISION |
| I-041 | Ineligible assessment status blocks block creation. | OK |
| I-042 | Null focus blocks block creation. | OK |
| I-043 | Non-finite focus bounds block block creation. | OK |
| I-044 | Score/assessment measured-domain count mismatch blocks when both supplied. | OK |
| I-045 | Baseline type is official for progress. | OK |
| I-046 | Baseline retake type is official for progress. | OK |
| I-047 | Official retest type is official for progress. | OK |
| I-048 | Manual-extra type is not official for progress. | OK |
| I-049 | Quick-recheck type is not official for progress. | OK |
| I-050 | Raw history does not store check-up type. | RISK |
| I-051 | Progress latest summary uses latest raw history. | RISK |
| I-052 | Progress first/latest comparison uses raw history. | RISK |
| I-053 | Lifecycle can use latest block-eligible raw history score. | RISK |
| I-054 | Latest assessment fallback can use any eligible assessment if no usable official exists. | RISK |
| I-055 | Results screen shows domains measured count. | OK |
| I-056 | Results screen can offer create block for one-domain eligible score. | DECISION |
| I-057 | Onboarding results can offer create block for one-domain eligible score. | DECISION |
| I-058 | Pending onboarding domains are labeled baseline pending. | OK |
| I-059 | Progress bands use fixed midpoint thresholds 58 and 72. | DECISION |
| I-060 | Report improvement means lower movement-age midpoint. | OK |
| I-061 | Report held steady means exact midpoint equality only. | RISK |
| I-062 | Report decline/adjusted means any higher midpoint. | RISK |
| I-063 | Raw trend improvement uses sign only. | RISK |
| I-064 | Meaningful-change thresholds are absent. | RISK |
| I-065 | Local history stores raw Check-Up with schema version. | OK |
| I-066 | Local history stores no scorer/norm version. | RISK |
| I-067 | Local history converts NaN to null. | OK |
| I-068 | History migration does not validate deep result shapes. | RISK |
| I-069 | Backend check-up payload sanitizes frame/landmark/video-like keys. | OK |
| I-070 | Backend check-up derived score has no explicit scorer/norm version. | RISK |
| I-071 | Restore recreates assessments by rescoring raw Check-Up. | RISK |
| I-072 | Baseline retake maps to remote unknown in check-up enum. | RISK |
| I-073 | Remote unknown check-up type restores as manual-extra unless derived assessment type exists. | RISK |
| I-074 | TUG norm exists but is unused by active scoring. | OK |
| I-075 | Official battery excludes TUG. | OK |
| I-076 | Duplicate movement items are not rejected. | RISK |
| I-077 | `findItem` first-match behavior can ignore later valid evidence. | RISK |
| I-078 | Movement age does not use profile age. | DECISION |
| I-079 | Movement age does not use sex-specific norms. | DECISION |
| I-080 | Shoulder mobility claims rest on an estimated norm. | DECISION |

## 25. Confirmed Finding Register

| ID | Severity | Type | Finding | Evidence | Confidence |
|---|---|---|---|---|---|
| F3-001 | P1 | Product decision / eligibility | One measured domain can create a completed, medium-confidence, block-eligible assessment and plan. | `src/pearlFlow/assessments.ts:90`; `src/pearlFlow/assessmentEligibility.ts:28`; probe strength-only and shoulder-only; test at `src/pearlFlow/__tests__/assessmentEligibility.test.ts:205`. | High |
| F3-002 | P1 | Logic / officialness | Manual-extra can contaminate raw-history progress and next-block flows despite not being official. | `src/pearlFlow/manualCheckup.ts:69`; `src/pearlFlow/progressViewModel.ts:86`; `src/pearlFlow/appLifecycle.ts:352`; `App.tsx:1912`. | High |
| F3-003 | P1 | Logic / data hardening | Malformed chair-stand results can score as valid/young or crash scoring. | Probe missing `reps`, string `reps`, missing `flags`; `src/scoring/scoring.ts:69`; `src/scoring/scoring.ts:125`. | High |
| F3-004 | P1 | Versioning | Scoring/norm version is not pinned to history, assessments, reports, or restore. | `src/history/serialize.ts:4`; `src/pearlFlow/assessments.ts:40`; `src/services/backend/restoreService.ts:485`. | High |
| F3-005 | P1 | Norm provenance / claims | Norm tables and movement-age claims need scientific/product sign-off before beta. | `src/scoring/norms.ts:47`, `:98`, `:121`; shoulder norm wholly estimated. | High |
| F3-006 | P2 | Product decision | Domain ages use one primary metric per domain; supporting metrics do not affect age/focus. | `src/scoring/scoring.ts:125`, `:144`, `:172`. | High |
| F3-007 | P2 | Logic / policy | Weakest-domain ties resolve to strength by incidental order. | `src/scoring/scoring.ts:192`; probe exact tie. | High |
| F3-008 | P2 | Reporting | Progress/report changes have no meaningful-change thresholds. | `src/pearlFlow/reports.ts:58`; `src/adherence/screens/BlockReportScreen.tsx:108`; `src/screens/ResultsScreen.tsx:166`. | High |
| F3-009 | P2 | Backend semantics | Some local check-up types collapse to remote `unknown`. | `src/services/backend/checkupSyncService.ts:182`; test at `src/services/backend/__tests__/checkupSyncService.test.ts:90`. | Medium |
| F3-010 | P2 | Data integrity | Duplicate movement items are not rejected; first match wins. | `src/checkup/types.ts:28`; probe duplicate chair item. | Medium |
| F3-011 | P2 | Plausibility bounds | Negative/extreme finite values can be official evidence. | Probe negative balance/shoulder and 999 values. | Medium |
| F3-012 | P3 | Compatibility documentation | TUG norm exists but active scoring never uses it; future TUG reinstatement needs a policy. | `src/scoring/norms.ts:74`; `src/checkup/checkup.ts:36`. | High |

## 26. Beta Blockers

Beta blockers:

- F3-001: Decide and enforce the minimum evidence required for an official baseline/retest and for
  block creation.
- F3-002: Prevent manual-extra raw Check-Ups from replacing official progress or next-block evidence,
  or change the product copy and officialness model.
- F3-003: Harden scoring against malformed persisted/restored movement result shapes.
- F3-004: Add scoring/norm versioning before beta data can be trusted longitudinally.
- F3-005: Complete norm provenance and movement-age claim review.

Not beta blockers by themselves, but should be remediated or explicitly accepted:

- F3-006 through F3-012.

## 27. Product-Decision Packet

Decisions needed:

1. Minimum official evidence: Is one measured domain enough for baseline, official retest, and block
   creation? If not, define minimum domains and required primary movements.
2. Partial-result UX: Should one-domain results be display-only with retake CTA, or plan-eligible
   with explicit "partial check-up" language?
3. Domain composition: Should rise velocity, TUG, balance ladder stages, sway, and hinge reach ever
   influence domain age or weakest-domain focus?
4. Norm policy: Confirm source tables, sex pooling, age extrapolation, estimate labeling, and whether
   profile age/sex should be used.
5. Manual-extra semantics: Decide whether manual extras appear in progress, trends, latest result,
   and next-block creation.
6. Tie policy: Define deterministic and user-trustworthy behavior for exact/near ties.
7. Meaningful change: Define thresholds for improvement/decline in reps, seconds, ROM, hinge reach,
   rise velocity, and movement-age midpoint.
8. Versioning: Define `scoringVersion`, `normVersion`, and migration behavior for history,
   assessments, reports, and remote restore.
9. Plausibility bounds: Define valid input ranges and malformed-data behavior per movement.
10. Remote enum semantics: Decide whether backend check-up types must preserve local officialness
    exactly.

## 28. Recommended Remediation Batches

Batch A: scoring hardening

- Make `usableResult` defensive for missing/non-array flags.
- Validate movement-specific result shape before scoring.
- Require numeric finite chair reps, single-leg seconds, shoulder ROM, TUG seconds, hinge reach, and
  velocity.
- Add plausible range clamps/rejections per metric.
- Add duplicate movement item detection or canonical last-measured policy.

Batch B: evidence sufficiency and officialness

- Implement minimum evidence policy.
- Separate displayable partial results from block-eligible official results.
- Ensure invalid/partial official attempts cannot silently become latest official progress.
- Add tests for one-domain, two-domain, and all-domain policy.

Batch C: manual-extra isolation

- Persist check-up type with local history or join history to assessment metadata everywhere.
- Filter progress/latest/check-up summaries by officialness where product copy promises official
  trend.
- Make next-block creation require an eligible official assessment unless explicitly confirmed.

Batch D: versioning

- Add scorer/norm version constants.
- Store them in `CheckUpScore`, `MovementAssessment.rawMetrics`, reports, and remote payloads.
- Decide whether history rescoring is live, frozen, or dual-displayed.
- Add restore tests proving old scores do not silently rewrite claims.

Batch E: norms and claims

- Replace broad source comments with exact citations/table derivation notes.
- Add source comments for every anchor and extrapolated band.
- Decide sex/age/profile policy.
- Gate "typical of age" and estimate copy on norm provenance.

Batch F: comparisons and reporting

- Add meaningful-change thresholds.
- Add tie/near-tie handling.
- Update report/progress tests to cover no-change, small-change, and noisy-change cases.

## 29. Inputs For Stage 4 And Stage 5

Stage 4 input status: blocked. Stage 4 should not assume scoring/officialness is production-ready
until F3-001 through F3-005 are remediated or explicitly accepted by product/science owners.

Stage 5 input status: blocked. Stage 5 needs:

- Frozen or versioned scorer/norm semantics.
- Product-approved evidence sufficiency.
- Product-approved manual-extra behavior.
- Physical validation inputs for rise velocity and ROM/hold noise floor.
- Meaningful-change thresholds for longitudinal claims.

Carry-forward technical inputs:

- TUG remains hidden from official battery but available for historical/beta compatibility.
- Stage 2A.1 readiness hardening protects the upstream camera measurement gate.
- Stage 1A eligibility protects zero-domain invalid assessments, but intentionally permits valid
  partial evidence.

## 30. Final Repository Status

Verified final `git status --porcelain=v1 --untracked-files=all` output after report creation:

```text
?? docs/audits/PEARL_LOGIC_AUDIT_STAGE_3.md
```

Verified final `git diff --check`: exit 0, no output.

No staged files, no commits, no branches, no pushes, and no production/test/config changes were made.

Final decisions repeated:

- STAGE 3 REMEDIATION REQUIRED
- STAGE 4 BLOCKED
- STAGE 5 INPUTS BLOCKED
