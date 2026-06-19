# Hale Logic Remediation Stage 3A: Scoring Input Hardening

Date: 2026-06-19  
Scope: Stage 3A only - scoring-input validation, malformed-data hardening, duplicate known movement-item safe failure, and downstream history/backend restore safety. No Stage 3B, 3C, 3D, Stage 4, or Stage 5 policy work was implemented.

## 1. Scope

Implemented one pure scoring-input validation boundary for Movement Check-Up scoring. The boundary validates common item/result envelopes, duplicate known movement IDs, primary movement metrics, and supporting metrics before norm lookup or user-facing row construction.

The work intentionally preserved the existing public `scoreCheckUp(checkUp)` shape, current one-domain eligibility behavior, TUG as beta-hidden/supporting only, hinge as supporting only, and the existing norm tables.

## 2. Initial Git Status

At Stage 3A start, the tracked diff was empty and the worktree had these pre-existing untracked files:

```text
?? docs/audits/HALE_LOGIC_AUDIT_STAGE_3.md
?? docs/audits/Hale_Stage_3A_Scoring_Input_Hardening_Prompt.md
```

Those files were treated as user-owned baseline inputs.

## 3. Findings Addressed

- F3-003: malformed chair-stand data can no longer score or crash scoring.
- F3-010: duplicate known movement items no longer use first-match or last-match selection.
- F3-011: protocol-impossible finite headline values now fail closed before norm lookup.

## 4. Findings Explicitly Not Addressed

Not addressed in Stage 3A: all-three-domain officialness policy, manual-extra officialness, score/norm versioning, tie handling, meaningful-change thresholds, normative table review, device validation, ROM/pose evidence policy beyond the scoring input boundary, and Stage 4/5 progression logic.

## 5. Approved Product Rule Implemented

Implemented the Stage 3 rule that malformed, duplicated, missing, non-finite, or structurally impossible measurements fail closed without coercion, invented values, flattering clamps, crashes, or corrupted official scores.

Invalidity is movement-local: malformed strength does not erase valid balance or mobility, malformed TUG does not erase valid single-leg balance, and malformed hinge does not erase valid shoulder mobility.

## 6. Final Scoring-Input Validation Architecture

Added `validateCheckUpForScoring(checkUp)` in `src/scoring/scoringInputValidation.ts`. It returns canonical validated movement inputs plus safe structured issues.

`scoreCheckUpWithDiagnostics(checkUp)` now calls that validator and returns `{ score, issues }`; `scoreCheckUp(checkUp)` remains the stable public wrapper. Domain scoring consumes only validated inputs.

Evidence:

- Validation entry and canonical output: `src/scoring/scoringInputValidation.ts:93-163`
- Public scorer wrapper and diagnostics: `src/scoring/scoring.ts:207-229`
- Export surface: `src/scoring/index.ts`

## 7. Common Item/Result-Envelope Contract

The common envelope contract requires:

- known movement item shape;
- status exactly `measured`, `skipped`, or `unmeasured`;
- only `measured` items may contribute;
- measured items must have object results;
- result flags must exist and be an array of strings;
- `no-measurement` is canonical unmeasured;
- result movement ID mismatch fails closed.

Evidence: `src/scoring/scoringInputValidation.ts:165-216`.

## 8. Duplicate Movement Policy

Known duplicate movement IDs invalidate only that movement. The scorer does not select first, select last, merge, or order by confidence. Unknown movement IDs are ignored safely.

Evidence: duplicate-safe bucketing and issue emission at `src/scoring/scoringInputValidation.ts:121-140`.

## 9. Chair-Stand Validation Contract

Chair stand is valid only when:

- the common envelope is valid;
- `reps` exists;
- `reps` is a finite number;
- `reps` is an integer;
- `reps > 0`;
- `reps <= DEFAULT_CHAIR_STAND_CONFIG.maxReps`, currently 64.

Rise velocity is supporting only. It is shown only when `sessionMeanVel` is a finite positive number. Missing or malformed velocity does not invalidate valid reps.

Evidence: `src/scoring/scoringInputValidation.ts:21`, `src/scoring/scoringInputValidation.ts:218-236`.

## 10. Balance Validation Contract

Balance headline scoring is valid only when `singleLegEyesOpenSec` is a finite number, greater than 0, and no greater than the protocol single-leg eyes-open stage duration. The current cap is derived from `DEFAULT_BALANCE_STAGES`: 12 seconds.

Negative values, zero, and values above the protocol maximum are rejected, not clamped.

Evidence: `src/scoring/scoringInputValidation.ts:23-27`, `src/scoring/scoringInputValidation.ts:238-253`.

## 11. Shoulder Validation Contract

Shoulder mobility scoring is valid only when `peakFlexionDeg` is finite and within the production capture envelope:

- minimum valid-position angle: 35 degrees;
- mathematical maximum: 180 degrees.

The 35-degree minimum is now exported from the shoulder grader module and reused by scoring.

Evidence: `src/movements/shoulderFlexion.ts:32-33`, `src/scoring/scoringInputValidation.ts:279-294`.

## 12. Hinge/TUG/Supporting-Metric Contract

Hinge reach remains a supporting mobility row only. It requires finite numeric `reachBu`; negative values are not rejected because below-floor wrist position can be structurally meaningful in body units.

TUG remains supporting only and beta-hidden from the normal battery. Completed TUG rows require `completed === true` and finite positive `totalSec`; malformed TUG support is omitted without invalidating valid balance.

Evidence: `src/scoring/scoringInputValidation.ts:255-277`, `src/scoring/scoringInputValidation.ts:296-302`.

## 13. Protocol-Derived Plausibility Bounds

Used only bounds traceable to current protocol or movement math:

- chair reps cap: `DEFAULT_CHAIR_STAND_CONFIG.maxReps = 64`;
- single-leg eyes-open cap: `DEFAULT_BALANCE_STAGES` single-leg eyes-open `windowMs = 12000`;
- shoulder minimum: current production valid-position threshold, 35 degrees;
- shoulder maximum: 180 degrees.

Norm clamping remains unchanged for valid but off-norm values.

## 14. Bounds Deliberately Not Invented And Why

No arbitrary range was added for hinge `reachBu`; negative can be valid. No arbitrary TUG maximum was added because there is no current scorer-owned protocol timeout/cap to use. No extra range was added for chair velocity beyond finite and positive because velocity is supporting and varies by person/setup.

## 15. Safe Diagnostics/Observability

Diagnostics are structured as `{ code, movementId, field }` only. They do not include raw metric values, frames, landmarks, images, video, or free-form result payloads.

`App.tsx` records a breadcrumb on completed check-ups only for unexpected validation issues, excluding expected `no_measurement` outcomes.

Evidence: issue shape at `src/scoring/scoringInputValidation.ts:46-69`; breadcrumb summarization at `App.tsx:203-226` and use at `App.tsx:1285-1294`.

## 16. Files Changed

Production code:

- `App.tsx`
- `src/checkup/devFixture.ts`
- `src/history/trends.ts`
- `src/movements/shoulderFlexion.ts`
- `src/scoring/index.ts`
- `src/scoring/scoring.ts`
- `src/scoring/scoringInputValidation.ts`
- `src/services/backend/restoreService.ts`

Tests:

- `src/checkup/__tests__/checkupFlow.integration.test.ts`
- `src/haleFlow/__tests__/assessmentEligibility.test.ts`
- `src/history/__tests__/history.test.ts`
- `src/scoring/__tests__/scoring.test.ts`
- `src/scoring/__tests__/scoringInputValidation.test.ts`
- `src/services/backend/__tests__/checkupSyncService.test.ts`
- `src/services/backend/__tests__/restoreService.test.ts`

Report:

- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3A.md`

## 17. Tests Added Or Changed

Added `src/scoring/__tests__/scoringInputValidation.test.ts` covering valid regression, malformed chair reps, flags, status/result disagreement, duplicates for every scoring movement, unknown movement IDs, balance cap, TUG support, shoulder bounds, hinge support, and malformed whole-check-up shapes.

Expanded integration tests for Stage 1A eligibility, history trends, backend sync mapping, and backend restore.

Updated old fixtures that used impossible balance values above the current 12-second single-leg protocol cap.

## 18. Exact Targeted And Full Validation Results

Commands run after implementation:

| Command | Exit | Result | Notes |
|---|---:|---|---|
| `npm test -- --runInBand src/scoring src/haleFlow/__tests__/assessmentEligibility.test.ts src/haleFlow/__tests__/assessmentResultState.test.ts src/adherence/__tests__/blockServiceEligibility.test.ts src/history/__tests__/history.test.ts src/services/backend/__tests__/checkupSyncService.test.ts src/services/backend/__tests__/restoreService.test.ts` | 0 | 8 suites passed, 56 tests passed | Watchman recrawl warning; Jest open-handle warning after completion. |
| `npm test -- --runInBand` | 0 | 81 suites passed, 534 tests passed | Watchman recrawl warning; expected backend/session-planning console logs/warnings; Jest open-handle warning after completion. |
| `npm run typecheck` | 0 | `tsc --noEmit` passed | No type errors. |
| `npx --no-install expo config --type public >/tmp/hale-expo-config-stage3a.txt && wc -c /tmp/hale-expo-config-stage3a.txt && rm /tmp/hale-expo-config-stage3a.txt` | 0 | Expo config generated, 1841 bytes | Sentry Expo plugin warned that organization/project config is missing and env vars will be used at build time. |
| `git diff --check` | 0 | Passed | No whitespace errors. |

## 19. Valid-Score Regression Verification

The valid regression test asserts a production-shaped full Check-Up produces the same public score through `scoreCheckUp` and `scoreCheckUpWithDiagnostics`, has no validation issues, and measures all three domains.

Evidence: `src/scoring/__tests__/scoringInputValidation.test.ts:91-100`.

## 20. Stage 1A Integration Verification

Malformed-only evidence now produces `weakestDomain: null`, an invalid assessment, and ineligible block creation. Mixed valid/malformed evidence preserves the valid balance domain and current partial-evidence eligibility.

Evidence: `src/haleFlow/__tests__/assessmentEligibility.test.ts:149-210`.

## 21. History/Backend Restore Verification

History trends now extract through `validateCheckUpForScoring`, so malformed and duplicate stored values do not become trend points. Backend sync omits malformed derived score fields while preserving other valid domain scores. Restore recomputes from raw Check-Up data and refuses to preserve remote `completed` status when the recomputed score has no valid measured domain.

Evidence:

- Trend extraction: `src/history/trends.ts:43-85`
- History tests: `src/history/__tests__/history.test.ts:144-170`
- Sync test: `src/services/backend/__tests__/checkupSyncService.test.ts:102-119`
- Restore guard: `src/services/backend/restoreService.ts:485-532`
- Restore test: `src/services/backend/__tests__/restoreService.test.ts:419-465`

## 22. Before/After Malformed Examples

Before Stage 3A:

- Chair result with missing `reps` could render `undefined reps`, reach norm lookup, or crash through malformed flags.
- Chair result with `reps: "14"` could pass loose numeric comparisons and score.
- Duplicate chair items used first match via `findItem`.
- Balance `999` seconds and shoulder `999` degrees could reach norm lookup as finite values.

After Stage 3A:

- Missing/string/non-finite/fractional/out-of-cap chair reps produce unmeasured strength.
- Missing/malformed flags make the movement unusable.
- Duplicate known movement IDs emit `duplicate_movement` and invalidate only that movement.
- Balance and shoulder impossible headline values produce unmeasured domains before norm lookup.
- Other valid domains remain measured.

## 23. Remaining Stage 3 Blockers

Stage 3B remains required for evidence sufficiency/officialness policy. Stage 3C remains required for scoring/norm versioning. Stage 3D remains required for tie handling and progress/report semantics. Stage 4 and Stage 5 remain blocked until those Stage 3 topics are complete.

## 24. Whether F3-003 Is Closed

F3-003 is closed for Stage 3A scope. Malformed chair reps and malformed flags fail closed without scoring or crashing, and malformed-only evidence remains Stage 1A-ineligible.

## 25. Whether F3-010 Is Closed

F3-010 is closed. Duplicate known movement IDs no longer rely on first-match lookup and cannot vary by item order.

## 26. Whether F3-011 Is Closed, Partially Closed, Or Still Open

F3-011 is closed for Stage 3A scoring scope. Negative/extreme headline examples for balance and shoulder fail closed before norm lookup. Hinge remains supporting-only and accepts negative finite values intentionally because no defensible protocol range was approved for that metric.

## 27. Initial And Final Git Status

Initial tracked diff was empty. Initial untracked files were:

```text
?? docs/audits/HALE_LOGIC_AUDIT_STAGE_3.md
?? docs/audits/Hale_Stage_3A_Scoring_Input_Hardening_Prompt.md
```

Final status after this report write:

```text
 M App.tsx
 M src/checkup/__tests__/checkupFlow.integration.test.ts
 M src/checkup/devFixture.ts
 M src/haleFlow/__tests__/assessmentEligibility.test.ts
 M src/history/__tests__/history.test.ts
 M src/history/trends.ts
 M src/movements/shoulderFlexion.ts
 M src/scoring/__tests__/scoring.test.ts
 M src/scoring/index.ts
 M src/scoring/scoring.ts
 M src/services/backend/__tests__/checkupSyncService.test.ts
 M src/services/backend/__tests__/restoreService.test.ts
 M src/services/backend/restoreService.ts
?? docs/audits/HALE_LOGIC_AUDIT_STAGE_3.md
?? docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3A.md
?? docs/audits/Hale_Stage_3A_Scoring_Input_Hardening_Prompt.md
?? src/scoring/__tests__/scoringInputValidation.test.ts
?? src/scoring/scoringInputValidation.ts
```

## 28. Any Concurrent External Changes

No concurrent external modifications were observed during Stage 3A. The Stage 3 audit report and Stage 3A prompt were already untracked at the start and were not modified by this work.

## 29. Confirmation That No Commit/Staging/Branch/Push Occurred

No branch was created or switched. No files were staged. No commit was created. No push or pull request was made.

STAGE 3A COMPLETE

STAGE 3B REQUIRED

STAGE 4 REMAINS BLOCKED

STAGE 5 INPUTS REMAIN BLOCKED
