# Hale Logic Remediation Stage 3D-B.2A

Date: 2026-06-23

## Status

STAGE 3D-B.2A is implemented as an internal raw-only protocol/state-machine layer and is not user-facing enabled.

The V2 protocol controllers, raw result contracts, policy freezing, V2 battery registration, persistence metadata, and V1 scoring containment are in production code with focused tests. The public Check-Up screen still runs the V1 `legacy_movement_age_v1` battery by default. V2 movement definitions intentionally fail closed if they are accidentally run through the old generic `SessionController`; the typed setup/practice/trial controllers must be wired into a V2 player before public use.

STAGE 3D-B.2B remains blocked by scope: no reference tables, percentiles, ordinal focus selection, domain-profile UI, or score interpretation were implemented.

## Initial Worktree State

The implementation started with unrelated user-owned changes already present:

```text
 M src/diagnostics/__tests__/poseLatencyDiagnostics.test.ts
 M src/diagnostics/poseLatencyDiagnostics.ts
 M src/screens/SettingsScreen.tsx
?? app.config.js
?? docs/audits/Hale_Stage_3D_B_2A_Assessment_Protocol_State_Machine_Implementation_Prompt.md
```

The initial diff summary was:

```text
src/diagnostics/__tests__/poseLatencyDiagnostics.test.ts
src/diagnostics/poseLatencyDiagnostics.ts
src/screens/SettingsScreen.tsx
 .../__tests__/poseLatencyDiagnostics.test.ts       | 88 ++++++++++++++++++++--
 src/diagnostics/poseLatencyDiagnostics.ts          | 70 ++++++++++++++++-
 src/screens/SettingsScreen.tsx                     | 26 +++++++
 3 files changed, 175 insertions(+), 9 deletions(-)
```

Those files were not modified by this remediation.

## Implemented

- Added frozen Check-Up protocol policy metadata:
  - `legacy_movement_age_v1`
  - `movement_profile_v2`
  - Missing legacy history infers V1.
  - Unknown/future policies fail closed.
- Added an internal V2 battery:
  - `chair-rise-30s-v2`
  - `one-leg-balance-45s-v2`
  - `active-shoulder-reach-v2`
  - existing `hinge-reach` as supporting only.
- Added typed V2 setup metadata:
  - chair setup confirmation
  - standing-leg selection with prior-change metadata
  - shoulder-side selection with prior-change metadata
  - direct-call bypass marked as `bypassed`, not confirmed.
- Added V2 evidence states:
  - `reference_protocol_complete`
  - `raw_only_setup_uncertain`
  - `raw_only_protocol_incomplete`
  - `raw_only_tracking_uncertain`
  - `raw_only_pain_limited`
  - `invalid_measurement`
- Added pure protocol controllers:
  - Chair rise: setup confirmation, practice rep gate, 30-second active window, full-stand-at-expiry counting, practice metadata, JSON-safe active-window metadata.
  - One-leg balance: selected standing leg, adaptive best-of-three 45-second trials, rest/retry/decline events, invalid tracking attempts excluded from valid trial count, ceiling stop, 6-minute hard cap metadata.
  - Active shoulder reach: selected side frozen before capture, side-specific geometry helper, one invalid retry, pain-limited raw result state.
- Added V2 raw completeness helpers:
  - headline V2 completeness excludes hinge as a required headline item.
  - prior V2 standing-leg and shoulder-side lookup helpers.
- Added V1 containment:
  - `validateCheckUpForScoring` returns `unsupported_checkup_protocol` for V2 or future policies.
  - `createCurrentVersionedScoreSnapshot` returns `snapshot: null` for V2 raw records.
  - history compatibility accepts `unsupported_checkup_protocol`.
  - backend sync does not derive V1 domain scores or snapshots for V2 raw Check-Ups.
  - block creation returns stable reason `unsupported_checkup_protocol` for V2 raw assessments.

## Not Implemented

- No V2 public UI route or feature flag.
- No V2 setup screens in `CheckUpScreen`.
- No V2-specific spoken prompt assets. Existing bundled cue IDs are reused by the internal V2 definitions, and `verify:audio` passes.
- No V2 reference/percentile interpretation, ordinal focus, score snapshots, block creation, or reporting.
- No device validation.

## Validation

Focused Jest:

```text
npx jest --runTestsByPath src/checkup/__tests__/protocolPolicy.test.ts src/movements/__tests__/movementProfileV2Protocols.test.ts src/movements/__tests__/registry.test.ts src/scoring/__tests__/scoringInputValidation.test.ts src/scoring/__tests__/scoreSnapshot.test.ts src/haleFlow/__tests__/assessmentEligibility.test.ts src/services/backend/__tests__/checkupSyncService.test.ts
PASS: 7 suites, 77 tests
```

App typecheck:

```text
npm run typecheck
PASS
```

Audio verification:

```text
npm run verify:audio
PASS requiredCues=44 voices=clara,marcus requiredAssets=88 totalBytes=4637324 durationRange=1.858-5.155s
```

Full Jest:

```text
npm test -- --runInBand
PASS: 109 suites, 908 tests
```

Website typecheck:

```text
cd website && npm run typecheck
PASS
```

Expo config:

```text
npx expo config --type public
PASS
```

Expo export:

```text
npx expo export --platform all --output-dir dist-stage-3d-b-2a
PASS
```

Diff check:

```text
git diff --check
PASS
```

Validation notes:

- Jest printed the existing Watchman recrawl warning and the usual post-run open-handle warning after successful completion.
- Expo config/export printed the existing Sentry organization/project fallback warning.
- Expo export output was generated for validation, then removed from the worktree.

## Diff Notes

- No package installs.
- No lockfile changes.
- No branch, commit, stage, push, or PR actions.
- Existing V1 default battery remains unchanged.
- V2 raw records cannot produce current V1 Movement Age score snapshots.
