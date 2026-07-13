# Pearl Closed-Beta RC P1 Remediation

Date: 2026-06-28
Repository: `/Users/suvangoel/Pearl`
Mode: narrow P1 remediation only.

## 1. Scope

This pass remediated only the three closed-beta release-candidate P1 software blockers from `docs/audits/PEARL_CLOSED_BETA_RELEASE_CANDIDATE_AUDIT.md`:

- RC-P1-001: synthetic date-of-birth display from exact age.
- RC-P1-002: unsafe local diagnostics flags for beta/release builds.
- RC-P1-003: free-text health notes in account export.

No P2/P3 issue was intentionally remediated except the tiny adjacent export sanitizer correction needed to preserve structured `safetyProfile` data.

## 2. Prior RC Audit Findings

Prior audit result:

```text
P0 = 0
P1 = 3
P2 = 5
P3 = 3
CLOSED BETA BLOCKED - P0/P1 SOFTWARE ISSUES FOUND
```

Prior validation was green: app typecheck, audio verification, full Jest, website typecheck, Expo public config, Expo export all platforms, and `git diff --check` all passed.

## 3. Initial Git Status

Initial commands were run before editing:

```text
git status --short --untracked-files=all
git diff --name-only
git diff --stat
git ls-files --others --exclude-standard
```

Initial status contained 26 tracked modified files and 7 untracked files. Initial tracked modified files were:

```text
App.tsx
docs/decisions.md
src/diagnostics/__tests__/poseLatencyDiagnostics.test.ts
src/diagnostics/poseRendererReplay.ts
src/movementProfileV2/referenceDetailsDraft.ts
src/onboarding/state.ts
src/profile/__tests__/age.test.ts
src/profile/__tests__/serialize.test.ts
src/profile/age.ts
src/profile/index.ts
src/profile/serialize.ts
src/profile/types.ts
src/render/PoseAvatarRenderer.tsx
src/render/__tests__/poseAvatarConfig.test.ts
src/render/poseAvatarTypes.ts
src/screens/MovementProfileV2ReferenceDetailsScreen.tsx
src/screens/PlanScreen.tsx
src/screens/PoseOverlayBenchmarkScreen.tsx
src/screens/ProgressScreen.tsx
src/screens/SafetyProfileScreen.tsx
src/screens/SettingsScreen.tsx
src/screens/__tests__/PoseOverlayBenchmarkScreen.constellationV2.test.ts
src/screens/__tests__/ProgressAndManualRestoration.test.ts
src/services/backend/__tests__/profileSyncService.test.ts
src/services/backend/profileSyncService.ts
src/services/backend/restoreService.ts
```

Initial untracked files:

```text
docs/audits/PEARL_CLOSED_BETA_RELEASE_CANDIDATE_AUDIT.md
docs/audits/Pearl_Closed_Beta_RC_P1_Remediation_Prompt.md
docs/audits/Pearl_Closed_Beta_Release_Candidate_Audit_Prompt.md
src/components/DateOfBirthPickerModal.tsx
src/render/ArtDirectedHumanRenderer.tsx
src/render/__tests__/artDirectedHumanGeometry.test.ts
src/render/artDirectedHumanGeometry.ts
```

Initial `git diff --stat`: 26 files changed, 576 insertions, 175 deletions. All pre-existing tracked and untracked changes were treated as user-owned and preserved.

## 4. Baseline Validation

Pre-edit baseline:

- `npm run typecheck`: PASS.
- `npm run verify:audio`: PASS; safety 88 assets, Movement Profile V2 62 assets, voice V2.1 352 assets, total required assets 502.
- Focused baseline slice: PASS; 39 suites, 382 tests.
- `npm test -- --runInBand`: PASS; 168 suites, 1370 tests.
- `npm --prefix website run typecheck`: PASS.
- `npx --no-install expo config --type public`: PASS; local env produced `enablePoseLatencyDiagnostics: true` and `allowDiagnosticsInRelease: true`.
- `git diff --check`: PASS.
- Baseline `npx --no-install expo export --platform all --output-dir /tmp/pearl-rc-p1-baseline-export`: PASS; web, iOS, Android exported; 1592 assets; temp dir removed.

Known recurring warnings: Watchman recrawl, Jest open-handle notice, expected negative-path backend sync warnings, Sentry missing org/project config, and `NO_COLOR` ignored because `FORCE_COLOR` was set during export.

## 5. RC-P1-001 Synthetic DOB Root Cause

`MovementProfileV2ReferenceDetailsScreen` used exact age to build a synthetic date of birth from today's month/day. On 2026-06-28, exact age 60 could become `1966-06-28`, even if the real DOB was `1966-02-10`.

## 6. RC-P1-001 Fix

Changed `src/movementProfileV2/referenceDetailsDraft.ts` so drafts can carry a real `dateOfBirth` only when it already exists on the profile. Exact-age-only drafts carry `ageAtTest` without any DOB.

Changed `src/screens/MovementProfileV2ReferenceDetailsScreen.tsx` to:

- initialize from real `initialDraft.dateOfBirth` only;
- show exact-age-only drafts as `Age 60` style text;
- submit exact age/reference sex without inventing a date;
- remove the synthetic `dateOfBirthForExactAge` helper.

Official Movement Profile artifacts still freeze exact age/reference sex in the existing reference profile shape. Old snapshots are not reinterpreted.

## 7. RC-P1-001 Tests

Updated `src/movementProfileV2/__tests__/referenceDetailsDraft.test.ts` to prove:

- real DOB `1966-02-10` is preserved for display;
- exactAge-only profile renders `Age 60`;
- exactAge-only drafts do not contain `dateOfBirth` or `1966-06-27` / `1966-06-28`;
- official reference profile output still contains only `ageAtTest`, `ageBasis`, and `referenceSex`.

Existing Warden/reference engine/snapshot/assessment focused tests remained green.

## 8. RC-P1-002 Unsafe Diagnostics Env Root Cause

The existing TypeScript release-flag audit could identify unsafe flags, and `.env.example` defaults were mostly safe, but `app.config.js` did not fail beta/release config/export/build when local env enabled diagnostics. Normal local Expo config loaded `.env.local` / `.env` with pose diagnostics and diagnostics-in-release enabled.

## 9. RC-P1-002 Fix

Changed `app.config.js` to fail fast for beta/release-like `EAS_BUILD_PROFILE` values:

```text
preview
beta
internal
production
release
```

Unsafe exact-`1` flags now fail config/export/build for those profiles:

```text
EXPO_PUBLIC_ENABLE_LEGACY_V1_CHECKUP_ROLLBACK
EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_INTERNAL
EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_DIAGNOSTICS
EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS
EXPO_PUBLIC_ALLOW_DIAGNOSTICS_IN_RELEASE
EXPO_PUBLIC_ENABLE_POSE_RENDERER_BENCHMARKS
```

The error reports reason codes only, not values or secrets. Local development remains able to opt into diagnostics when not using a beta/release build profile.

Changed `src/config/releaseFlagAudit.ts` to expose beta/release profile classification. Added `EXPO_PUBLIC_ENABLE_POSE_RENDERER_BENCHMARKS=0` to `.env.example`. Added `npm run verify:safe-beta-flags`, which runs Expo public config under `EAS_BUILD_PROFILE=beta` with safe overrides.

## 10. RC-P1-002 Safe-Beta Config/Export Proof

Safe-beta public config with all unsafe flags set to `0`: PASS; `extra.enablePoseLatencyDiagnostics: false`, `extra.allowDiagnosticsInRelease: false`.

`npm run verify:safe-beta-flags`: PASS with `EAS_BUILD_PROFILE=beta`; diagnostics extras false.

Safe-beta export with `EAS_BUILD_PROFILE=beta` and all unsafe flags set to `0`: PASS; web, iOS, Android exported; 1592 assets; temp dir removed.

Normal local config/export still pass for developer use, but local config continues to show diagnostics true because `.env.local` / `.env` are intentionally unsafe for beta.

## 11. RC-P1-002 Tests

Updated `src/config/__tests__/releaseFlagAudit.test.ts` to prove:

- beta/release profile classification;
- safe beta inputs are safe;
- legacy rollback, internal harness, Movement Profile diagnostics, pose diagnostics, diagnostics-in-release, and renderer benchmarks are individually unsafe for beta;
- development profile can still use diagnostics;
- `.env.example` and `verify:safe-beta-flags` are safe;
- app config throws for unsafe beta/production env and passes safe beta env.

Existing diagnostics and benchmark route tests remained green.

## 12. RC-P1-003 Free-Text Health-Note Export Root Cause

`sanitizeForDataExport` omitted media/path/credential-like keys but did not omit legacy health-note keys such as `painNotes`, `injuryNotes`, `notes`, or nested note-like free text. It also had an existing false-positive where keys ending in `profile` could be treated as ending in `file`.

## 13. RC-P1-003 Fix

Changed `src/services/backend/dataExportService.ts` to:

- omit exact normalized free-text health keys recursively;
- cap sanitizer depth;
- keep arrays/objects sanitized recursively;
- preserve structured profile/safety/reference/Warden metadata;
- avoid treating `profile` / `safetyProfile` as file keys.

Omitted key families:

```text
painNotes
injuryNotes
notes
note
freeText
free_text
description
details
symptoms
medicalNotes
healthNotes
injuryDescription
painDescription
```

## 14. RC-P1-003 Tests

Updated `src/services/backend/__tests__/dataExportService.test.ts` to prove account export omits:

- `painNotes`;
- `injuryNotes`;
- nested pain/injury notes;
- legacy `medicalNotes`, `healthNotes`, `symptoms`;
- `notes`, `note`, `freeText`, `free_text`, `description`, `details`;
- arrays containing note objects;
- micro-check/report/training note-like health text.

The same test proves export preserves:

- exact age;
- reference sex;
- structured safety booleans;
- equipment capabilities/status;
- movement capability statuses;
- Warden/source fingerprints;
- Warden percentile range metadata;
- official Movement Profile artifact metadata.

Updated `src/services/backend/__tests__/accountDataService.test.ts` to prove local clear deletes a preferences file containing legacy pain/injury notes.

## 15. Warden/H5/HF/Stage 5 Regression Proof

Focused post-fix regression slice passed:

```text
39 suites passed
393 tests passed
```

This slice included Warden reference engine/golden examples/snapshot/assessment, H5A Progress authority, H5B micro-check policy, H5C route retirement, H5D release flags, HF1/HF2/HF3 hands-free coverage, and Stage 5 scheduler/training lifecycle tests.

Full Jest also passed:

```text
168 suites passed
1381 tests passed
```

## 16. Privacy/Export Proof

`src/services/backend/__tests__/dataExportService.test.ts`: PASS; 1 suite, 6 tests.

The export sanitizer now removes free-text health-note keys recursively while keeping structured safety, movement capability, equipment, exactAge/referenceSex, Warden source/fingerprint, percentile range, and official Movement Profile data.

## 17. Files Changed

P1-owned files changed in this pass:

```text
.env.example
app.config.js
package.json
src/config/releaseFlagAudit.ts
src/config/__tests__/releaseFlagAudit.test.ts
src/movementProfileV2/referenceDetailsDraft.ts
src/movementProfileV2/__tests__/referenceDetailsDraft.test.ts
src/screens/MovementProfileV2ReferenceDetailsScreen.tsx
src/services/backend/dataExportService.ts
src/services/backend/__tests__/dataExportService.test.ts
src/services/backend/__tests__/accountDataService.test.ts
docs/audits/PEARL_CLOSED_BETA_RC_P1_REMEDIATION.md
```

Other modified/untracked files in the final worktree were pre-existing user-owned changes and were preserved.

## 18. Focused Validation

Command:

```text
npm test -- --runInBand [39-suite P1/Warden/H5/HF/Stage5 slice]
```

Result:

```text
PASS
39 suites passed
393 tests passed
```

Known warnings: Watchman recrawl, expected backend negative-path warnings, Jest open-handle notice.

## 19. Full Validation

Full post-fix gate:

- `npm run verify:audio`: PASS; total required assets 502.
- `npm test -- --runInBand`: PASS; 168 suites, 1381 tests.
- `npm run typecheck`: PASS.
- `npm --prefix website run typecheck`: PASS.
- `npx --no-install expo config --type public`: PASS; normal local env still shows diagnostics extras true.
- `git diff --check`: PASS.
- Normal `npx --no-install expo export --platform all --output-dir /tmp/pearl-rc-p1-final-export`: PASS; web, iOS, Android exported; 1592 assets; temp dir removed.

## 20. Safe-Beta Validation

Safe-beta commands:

- safe override `npx --no-install expo config --type public`: PASS; diagnostics extras false.
- `npm run verify:safe-beta-flags`: PASS under `EAS_BUILD_PROFILE=beta`; diagnostics extras false.
- safe-beta export under `EAS_BUILD_PROFILE=beta`: PASS; web, iOS, Android exported; 1592 assets; temp dir removed.

The app-config guard is also covered by Jest tests proving unsafe beta/production env throws.

## 21. Remaining P2/P3 Findings From RC Audit

Remaining P2 findings:

- RC-004: Auth/onboarding copy says "weakest areas"; soften copy.
- RC-005: Results/reference copy is too technical around published comparisons and diagnosis/fall-risk disclaimers.
- RC-006: Android audio/foreground media permissions need privacy/store investigation.
- RC-007: Delete-account path copy/flow is rough because cloud deletion is deferred before local clear.
- RC-008: Website mentions "movement-age style ranges"; align with current app language.

Remaining P3 findings:

- RC-009: DOB picker max-age edge for valid 120-year-old dates.
- RC-010: Release commit hygiene for untracked prompt files.
- RC-011: Private Warden source pack backup outside repo.

## 22. Closed-Beta Decision After P1 Remediation

Software P0/P1 blockers from the RC audit list are fixed. Closed beta can proceed from a software P0/P1 standpoint only after the required device QA. Public release remains blocked.

## 23. Final Git Status

Final status before report creation showed 35 tracked modified files and 7 untracked files, reflecting P1 changes plus pre-existing user-owned changes. After this report is added, the report itself is also untracked until intentionally committed.

No staging, commit, branch, push, or PR was performed.

## 24. Required Confirmations

- No package install occurred.
- No lockfile changed.
- No audio regeneration occurred.
- No staging, commit, branch, push, or PR occurred.
- No Warden formula/data/source/fingerprint changed.
- No public V1 rollback path was re-enabled.
- No training credit/progression/schedule policy changed.
- No H5/HF logic regression was introduced.
- No physical-device validation is claimed.
- `docs/decisions.md` and prior audit reports were not edited by this pass.

```text
CLOSED BETA RC P1 REMEDIATION COMPLETE
RC-P1-001 SYNTHETIC DOB FIXED
RC-P1-002 SAFE-BETA DIAGNOSTICS LOCKDOWN FIXED
RC-P1-003 FREE-TEXT HEALTH-NOTE EXPORT REDACTION FIXED
NO P0/P1 SOFTWARE BLOCKERS REMAIN FROM RC AUDIT
CLOSED BETA GO - SOFTWARE P0/P1 FIXED; DEVICE QA STILL REQUIRED
PUBLIC RELEASE REMAINS BLOCKED
PHYSICAL DEVICE VALIDATION NOT CLAIMED
NO WARDEN FORMULA / DATA CHANGE
NO AUDIO REGENERATION
NO PACKAGE / LOCKFILE CHANGE
NO STAGING / COMMIT / BRANCH / PUSH
```
