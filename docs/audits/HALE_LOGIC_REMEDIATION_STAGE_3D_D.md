# Hale Logic Remediation Stage 3D-D

Date: 2026-06-20

## Status

STAGE 3D-D COMPLETE

STAGE 3D-B REQUIRED

STAGE 4 UNBLOCKED

STAGE 5 INPUTS READY

## Scope

Implemented the Stage 3D-D interim near-tie policy, focus-stability rules, and meaningful-change neutralization without changing scoring formulas, norm tables, raw domain values, exercise content, or workout generation content.

This stage depends on prior Stage 3B, 3C, 3C.1, 3D-A, and 3D-C work already present in the worktree. Stage 3D-B norm provenance remains required before norm/source claims can be considered complete.

## Preflight

Before Stage 3D-D edits, the worktree was already dirty with many modified tracked files and untracked audit/code files from earlier stages. I did not revert or normalize those user/pre-existing changes.

Preflight command run before edits:

```sh
git status --short --untracked-files=all
git diff --name-only
git diff --stat
```

Key preflight facts:

- Existing modified files included app, adherence, Hale flow, history, scoring, backend, screen, theme, native pose-view, and docs files.
- Existing untracked files included prior audit reports/prompts, `src/scoring/focusSelection.ts`, `src/scoring/scoreSnapshot.ts`, `src/scoring/versions.ts`, `src/checkup/retry.ts`, `src/haleFlow/checkupHistory.ts`, `src/haleFlow/assessmentEvidence.ts`, related tests, and Explore insight images.
- Because the baseline was intentionally not clean, this report documents the Stage 3D-D policy decisions and validation rather than claiming the whole working tree belongs to this stage.

## Implementation Summary

Added scoring-layer near-tie semantics:

- `INTERIM_NEAR_TIE_MARGIN_YEARS = 5`.
- `FOCUS_SELECTION_POLICY_VERSION = 1`.
- Focus comparison uses current domain age-range midpoint.
- A near tie is detected when 2 or 3 domains are within 5 age years of the highest midpoint.
- Exact ties are resolved first and remain `exact_tie`; exact ties are not reclassified as near ties.
- Single-domain groups remain `clear`.

Added near-tie focus metadata:

- `kind: 'near_tie'`.
- Effective `focusDomain`.
- `tiedDomains` and `nearTiedDomains`.
- `nearTieMarginYears`.
- `policyVersion`.
- `tieBreakReason`.

Added near-tie reasons:

- `near_tie_deterministic_fallback` for first/baseline or no active near-tied focus.
- `near_tie_preserve_current_focus` for official retests when the active block focus is in the near-tie group.

## Focus-Stability Rules

Clear focus:

- One measured all-three domain has the highest midpoint and no other measured all-three domain is within the interim 5-year margin.

Exact tie:

- Two or three domains share the exact highest midpoint.
- If the active focus is in the exact-tie group, preserve it.
- Otherwise use stable domain order: strength, balance, mobility.

Near tie:

- Two or three domains are within 5 age years of the highest midpoint, after exact ties have been excluded.
- If an official retest has an active block focus inside the near-tie group, preserve the active focus.
- Otherwise use stable domain order: strength, balance, mobility.

Manual and quick checkups:

- May store/display near-tie metadata.
- Remain non-official for block creation/progress lifecycle.
- Do not create or steer training blocks.

## Fail-Closed Behavior

Current all-three official scores that resolve to exact ties or near ties must include valid focus metadata to create a block.

Fail-closed cases covered:

- Exact-tie current snapshot with missing focus metadata.
- Near-tie current snapshot with missing focus metadata.
- Focus metadata that does not match the score.
- Snapshot focus metadata that disagrees with assessment raw metrics.
- Balanced/general focus reason remains unsupported for block creation.

Backward compatibility:

- Older snapshots without focus metadata still parse.
- Older near-tie-shaped snapshots without near-tie metadata still parse.
- They are not rewritten or rescored on read.
- If such a snapshot is used for current block creation and the score resolves to a near tie, block creation fails closed with `missing_focus_metadata`.

## Stored Metadata

Current score snapshots now store near-tie focus selections through the existing `focusSelection` field.

Current movement assessments store display-oriented raw metrics:

- `focusSelection`.
- `focusSelectionKind`.
- `effectiveFocusDomain`.
- `tiedScoreDomains`.
- `nearTiedScoreDomains` for near ties.
- `nearTieMarginYears` for near ties.
- `focusSelectionPolicyVersion` for near ties.
- `focusTieBreakReason`.

Movement blocks store enough focus-selection metadata for later UI/report interpretation:

- `focusSelectionKind`.
- `focusTiedDomains`.
- `focusTieBreakReason`.
- `focusNearTieMarginYears`.
- `focusSelectionPolicyVersion`.

Backend report/micro-check sanitizers preserve this block focus metadata in nested movement-block summaries. Canonical block sync already serializes the full movement block.

## Meaningful-Change Neutralization

No device-repeatability threshold is validated yet, so this stage avoids user-facing claims such as "improved", "declined", and "held steady".

Changes made:

- Progress view-model trend labels now use `higher`, `similar`, `lower`, and `unknown`.
- New block report domain directions now use `recorded_lower`, `similar`, `recorded_higher`, and `unknown`.
- Report display logic still reads legacy `improved`, `declined`, and `held_steady` values for older persisted reports, but new reports do not write them.
- User-facing trend/report text says "recorded higher", "recorded lower", "similar result", "changed", "new data point", or "another data point".
- Milestone IDs/copy were neutralized to `domain_recorded_lower` and `domain_similar`.
- Copy guardrails now ban `improved`, `held steady`, and `declined` in scanned result/progress surfaces.

## Display Copy

Near-tie display copy uses "closely matched" language:

- Results screen.
- Onboarding results screen.
- Home latest estimate card.
- Progress focus title.
- Block report next-focus card.

Exact ties still remain exact in metadata and policy, but user-facing surfaces can use the same "closely matched" umbrella copy.

## Tests Added Or Updated

Focused coverage was added/updated for:

- Clear/exact/near focus selection.
- Exact ties taking precedence over near ties.
- Near-tie deterministic fallback.
- Near-tie preserve-current-focus official retests.
- Malformed near-tie metadata rejection.
- Snapshot round trips with near-tie metadata.
- Older snapshots without near-tie metadata parsing without mutation.
- Near-tie block-creation fail-closed behavior.
- Manual near-tie assessments remaining display-only/non-official.
- Neutral progress trend labels.
- Copy guardrail for "improved".
- Backend report fixture direction neutralization.

## Validation

Targeted tests:

```sh
npm test -- --runInBand src/scoring/__tests__/focusSelection.test.ts src/scoring/__tests__/scoreSnapshot.test.ts src/haleFlow/__tests__/assessmentEligibility.test.ts src/adherence/__tests__/blockServiceEligibility.test.ts src/haleFlow/__tests__/progressViewModel.test.ts src/haleFlow/__tests__/copyGuardrails.test.ts src/services/backend/__tests__/blockReportSyncService.test.ts
```

Result: PASS, 7 suites, 69 tests.

Full tests:

```sh
npm test -- --runInBand
```

Result: PASS, 84 suites, 595 tests.

Notes:

- Jest emitted the existing watchman recrawl warning.
- Backend sync/session-planning tests emitted expected console logs/warnings.
- Jest emitted the existing open-handle notice after completion, but exited with code 0.

TypeScript:

```sh
npm run typecheck
```

Result: PASS.

Expo config:

```sh
npx --no-install expo config --type public
```

Result: PASS.

Note: Expo emitted the existing Sentry plugin warning that organization/project config is missing and environment variables will be used as fallback.

Whitespace:

```sh
git diff --check
```

Result: PASS.

## Stage Decisions

STAGE 3D-D COMPLETE

The interim near-tie policy is implemented, metadata is stored for current snapshots/assessments/blocks, official retest focus preservation is supported, block creation fails closed when current tie metadata is missing, and meaningful-change language has been neutralized.

STAGE 3D-B REQUIRED

Norm provenance/source audit remains outstanding and is still required.

STAGE 4 UNBLOCKED

Stage 4 can proceed because scoring snapshot semantics, officialness isolation, exact-tie policy, near-tie policy, and malformed-input fail-closed behavior are now stable enough for the next audit layer.

STAGE 5 INPUTS READY

Clear, exact-tie, and near-tie focus semantics are stable; current tie metadata is explicit; legacy no-metadata snapshots parse without mutation but cannot silently create a current tie-driven block; and meaningful-change labels no longer contaminate new progress/report/focus interpretation.

## Residual Risk

- The 5-year margin is explicitly interim and not a validated device-repeatability threshold.
- Legacy persisted reports may still contain old direction strings; display code handles them for compatibility, but new reports do not write them.
- Stage 3D-B norm provenance remains incomplete.
