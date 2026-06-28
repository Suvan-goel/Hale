# Hale Closed-Beta RC P2/P3 Remediation

Date: 2026-06-28
Repository: `/Users/suvangoel/Hale`
Mode: narrow P2/P3 remediation only.

## 1. Scope

This pass remediated Hale closed-beta RC P2/P3 findings RC-004 through RC-011 without reopening P1 work. No Warden formula/data, Movement Profile V2 measurement logic, H5 routing, H5A Progress authority, H5B micro-check policy, HF1/HF2/HF3 logic, training credit/progression, audio assets, packages, lockfiles, branches, commits, pushes, or PRs were changed.

## 2. Prior RC audit and P1 remediation status

Prior audit result:

```text
P0 = 0
P1 = 3
P2 = 5
P3 = 3
CLOSED BETA BLOCKED - P0/P1 SOFTWARE ISSUES FOUND
```

The P1 remediation report fixed RC-P1-001 through RC-P1-003 and concluded:

```text
CLOSED BETA GO - SOFTWARE P0/P1 FIXED; DEVICE QA STILL REQUIRED
```

This pass preserved those P1 fixes: no synthetic DOB from exact age, beta/release diagnostic flags fail safe, and account export free-text health notes remain redacted.

## 3. Initial Git status

Initial `git status --short --untracked-files=all` contained 42 tracked changed paths and 10 untracked paths. Tracked changes included the pre-existing P1/remediation baseline such as `.env.example`, `App.tsx`, `app.config.js`, `package.json`, release flag tests, profile/date-of-birth files, V2 check-up route/test moves, Progress/Settings changes, backend export/account tests, and two deleted legacy V2 check-up files. Untracked paths were:

```text
docs/audits/HALE_CLOSED_BETA_RC_P1_REMEDIATION.md
docs/audits/HALE_CLOSED_BETA_RELEASE_CANDIDATE_AUDIT.md
docs/audits/Hale_Closed_Beta_RC_P1_Remediation_Prompt.md
docs/audits/Hale_Closed_Beta_RC_P2_P3_Remediation_Prompt.md
docs/audits/Hale_Closed_Beta_Release_Candidate_Audit_Prompt.md
src/components/DateOfBirthPickerModal.tsx
src/render/ArtDirectedHumanRenderer.tsx
src/render/__tests__/artDirectedHumanGeometry.test.ts
src/render/artDirectedHumanGeometry.ts
src/screens/__tests__/MovementProfileV2UnifiedCheckUpScreen.voiceRuntime.test.ts
```

Initial `git diff --name-only` listed 42 tracked paths. Initial `git diff --stat`: 42 files changed, 1055 insertions, 1325 deletions. Initial `git ls-files --others --exclude-standard` matched the 10 untracked paths above. All pre-existing tracked and untracked changes were treated as user-owned and preserved.

## 4. Baseline validation

Pre-edit gates:

```text
npm run typecheck: PASS
npm run verify:audio: PASS, requiredAssets=502
npm run verify:safe-beta-flags: PASS
focused baseline Jest: PASS, 33 suites, 313 tests
npm test -- --runInBand: PASS, 168 suites, 1381 tests
npm --prefix website run typecheck: PASS
npm --prefix website run test: PASS, 5 files, 17 tests
npx --no-install expo config --type public: PASS
git diff --check: PASS
baseline expo export all platforms: PASS, assets=1592
```

Known recurring warnings remained: Watchman recrawl, Jest open-handle notice, expected negative-path Supabase sync warnings in tests, Sentry missing org/project config during export, and `NO_COLOR` ignored because `FORCE_COLOR` was set.

## 5. RC-004 root cause and fix

Root cause: `src/screens/AuthScreen.tsx` still said Hale builds a plan to address "weakest areas."

Fix: changed public auth/onboarding hero copy to "where to start." Added copy guardrail coverage for `weakest area`, `weakest areas`, and `weakest domain` public phrasing without blocking internal `weakestDomain` field names.

## 6. RC-005 root cause and fix

Root cause: Movement Profile result/reference/progress copy still surfaced technical phrases such as "published comparison," "published middle range," "raw-only," and diagnosis/fall-risk disclaimers.

Fixes:

- Reworded Safety/Profile reference copy to "saved Movement Profile" and "age and reference group."
- Reworded V2 result summary, domain cards, detail rows, and notes to use consumer terms: "Typical range," "Saved result," "Starting point," and home-movement tracking language.
- Preserved chair percentile range display such as "Around the 10th-40th percentile"; no exact headline percentile was added.
- Preserved Warden raw-first/range policy and Warden eligibility behavior.
- Updated result/progress adapter tests and copy guardrails so stale technical phrases do not return to public surfaces.

## 7. RC-006 Android audio/foreground permission investigation and resolution

Findings:

- `app.json` explicitly declares only `android.permission.CAMERA`.
- `modules/expo-pose-detection/android/src/main/AndroidManifest.xml` declares only camera permission for the native pose module.
- `expo-audio` is present for bundled local voice playback, but Hale does not require background audio, media foreground service playback, recording, notifications, or media-library access.
- `src/audio/voicePlayer.ts` configures `playsInSilentMode: true`, `interruptionMode: 'mixWithOthers'`, `allowsRecording: false`, and `shouldPlayInBackground: false`.
- The session path uses bundled local assets and does not call runtime TTS.

Resolution: no Android audio/media/foreground permission was removed because none was explicitly declared. Added `src/config/__tests__/androidPermissions.test.ts` to guard that Android app config declares only camera permission and that voice playback remains foreground-only and recording-disabled.

Store/privacy note: camera permission still needs normal beta/store explanation. No physical-device or store-console validation is claimed.

## 8. RC-007 delete-account UX root cause and fix

Root cause: the UI offered "Delete account" and implied account/cloud deletion, but `requestCloudAccountDeletion()` is deferred because secure account deletion requires a Hale server function and cannot safely run from the mobile client with a service-role key. Supabase docs confirm `auth.admin.deleteUser` requires a `service_role` key and should only be called on a server: https://supabase.com/docs/reference/javascript/auth-admin-deleteuser

Fixes:

- Changed signed-in destructive UI to "Clear this device."
- Copy now says this removes Hale data from this device and signs the user out, but does not delete the cloud account.
- Copy directs cloud account deletion to Hale support while backend deletion remains deferred.
- Local account-clear safety and sign-out behavior are preserved.
- Added tests for truthful destructive account copy.

Supabase changelog check found no relevant breaking change for this mobile copy/local-clear remediation.

## 9. RC-008 website wording root cause and fix

Root cause: website content still used "movement-age style ranges" and related stale public positioning.

Fixes:

- Replaced stale website wording with "Movement Profile," "suggested focus," and "source-backed chair-stand ranges where available."
- Removed loose diagnosis/diagnostic language from landing and terms copy where a wellness disclaimer was sufficient.
- Preserved beta positioning, signup scope, store placeholder behavior, and equipment positioning.
- Updated website unit tests to block movement-age/body-age/fall-risk wording.

## 10. RC-009 DOB 120-year edge root cause and fix

Root cause: `ageFromDateOfBirth()` used whole-year age only. On 2026-06-28, `1906-06-27` returned age 120 even though it is older than the exact 120-year boundary. `MovementProfileV2ReferenceDetailsScreen` also capped reference-detail entry at 100 despite the profile range supporting 120.

Fixes:

- `ageFromDateOfBirth()` now treats the maximum as an exact date boundary.
- `DateOfBirthPickerModal` clamps selectable dates to exact minimum/maximum DOB boundaries.
- V2 reference details now allow ages 18-120 while preserving Warden source eligibility separately.
- Added deterministic tests for:
  - valid exactly 120: `1906-06-28` as of `2026-06-28`;
  - invalid older than 120: `1906-06-27`;
  - valid almost 120: `1906-06-29`;
  - exact 18-year lower boundary;
  - picker year options and date clamping.

## 11. RC-010 prompt-file hygiene resolution

Fix: added `.gitignore` patterns for local Codex prompt artifacts:

```text
docs/audits/Hale_*_Prompt.md
docs/audits/*_Prompt.md
docs/audits/*Prompt*.md
docs/audits/*PROMPT*.md
docs/audits/*.prompt.md
```

Result: prompt files remained on disk but dropped out of `git ls-files --others --exclude-standard`. Official audit reports such as `docs/audits/HALE_CLOSED_BETA_RC_P1_REMEDIATION.md` and this report remain visible for intentional commit review.

## 12. RC-011 Warden source-pack backup result

Backup completed outside the repository at:

```text
/Users/suvangoel/Documents/Hale/private-sources/warden/
```

Copied files and SHA-256 hashes:

```text
README.md 718 bytes bb684cbdbddbb475f65801f6ae34d1880806a186c5a195dbfa25818b3578edc3
raw/supporting_material_1_test_procedure_pzab299.pdf 727152 bytes 10424d9e1db9fdbde17029d8b664f3f43b6940c1ebc6850486cf04d3b04e9e50
raw/supporting_material_2_calculator_v1_final_1_pzab299.xlsx 1175158 bytes d16f1cf53a857ef6759e7fea2eb20f410de25f5febe734e9af3d25ade46484b8
warden-30s-sts-lms-table.csv 108029 bytes bebec0be0e55de18c882328a4979bef010c60b48c9a3ace8f5c415dccc514952
warden-chair-golden-examples.csv 3120 bytes 414fa338a712fe0b97688c776dd0523bb14efc2614cd40a295e5577aace0f42a
warden-raw-file-inventory.txt 779 bytes 091f988177f73b233eab5e2bc397a8f342dd168ca1fa95d8070b16a9813c41ff
warden-source-notes.md 1779 bytes 0f7868dbb4f4928763b2f433160878e1367982656df1f47e4afc41e507f87c96
```

Created `warden-source-backup-inventory.sha256` in the private backup folder. No workbook/PDF contents were printed. No private Warden source material was copied into the repo.

## 13. Copy guardrails

Updated guardrails cover:

- weak/negative focus copy (`weakest area`, `weakest areas`, `weakest domain`);
- stale technical result phrases (`published comparison`, `published age-group`, `published middle range`, `reference labels`, `raw-only`, `source transform`);
- existing medical/gamification/trend claim bans.

Focused scans of touched public app and website surfaces found no remaining production copy hits for movement-age/body-age, weak-area, published-comparison, diagnosis/fall-risk, or sarcopenia language.

## 14. Privacy/export/account-clear guardrails

Preserved P1 export redaction and local account clear behavior. Account export/data tests remain green. Account cloud deletion remains deferred rather than faked in the mobile client; copy now says exactly what the app does.

## 15. Warden/H5/HF/Stage 5 regression proof

Focused and full validation covered:

- Warden transform/reference engine/snapshot/assessment;
- exact age/reference sex and V2 reference details materialization;
- V2 snapshot/assessment/focus/plan creation;
- Progress restoration and H5A authority;
- H5B/H5B.1 micro-check policy;
- H5C public V1 route retirement;
- H5D release flags;
- HF1 V2 Check-Up hands-free;
- HF2 micro-check hands-free;
- HF3 training floor setup hands-free;
- Stage 5 scheduler/training credit/progression;
- audio verification.

No regression was found.

## 16. Files changed

Files intentionally touched by this P2/P3 pass:

```text
.gitignore
src/components/AccountAuthCard.tsx
src/components/__tests__/AccountAuthCard.test.ts
src/components/__tests__/DateOfBirthPickerModal.test.ts
src/components/accountDeletionConfig.ts
src/components/DateOfBirthPickerModal.tsx
src/config/__tests__/androidPermissions.test.ts
src/haleFlow/__tests__/copyGuardrails.test.ts
src/movementProfileV2/__tests__/viewModel.test.ts
src/movementProfileV2/viewModel.ts
src/profile/__tests__/age.test.ts
src/profile/age.ts
src/results/__tests__/movementProfileV2ResultsAdapter.test.ts
src/results/movementProfileV2ResultsAdapter.ts
src/screens/AuthScreen.tsx
src/screens/MovementProfileV2ReferenceDetailsScreen.tsx
src/screens/SafetyProfileScreen.tsx
src/screens/__tests__/progressProductPresentation.test.ts
src/screens/progressProductPresentation.ts
src/services/backend/accountDataService.ts
website/app/terms/page.tsx
website/src/components/LandingPage.tsx
website/src/content/landing.ts
website/tests/unit/components.test.tsx
docs/audits/HALE_CLOSED_BETA_RC_P2_P3_REMEDIATION.md
```

Pre-existing dirty files outside this list were preserved and not reverted.

## 17. Focused validation

Focused command included account/delete copy, DOB picker/date boundaries, Android permission guard, copy guardrails, results/reference/progress copy, P1 DOB regression, release flags, backend privacy/account clear, Warden/reference tests, H5/HF tests, and Stage 5 scheduler/training tests.

```text
npm test -- --runInBand ...focused paths...
PASS, 35 suites, 321 tests
```

Website focused tests:

```text
npm --prefix website run test
PASS, 5 files, 17 tests
```

## 18. Full validation

Final full gate:

```text
npm run verify:audio
PASS, safety requiredAssets=88, Movement Profile V2 requiredAssets=62, voice V2.1 requiredAssets=352, total requiredAssets=502

npm test -- --runInBand
PASS, 170 suites, 1389 tests

npm run typecheck
PASS

npm --prefix website run typecheck
PASS

npm run verify:safe-beta-flags
PASS

npx --no-install expo config --type public
PASS

git diff --check
PASS
```

Known warnings were unchanged: Watchman recrawl, Jest open-handle notice, expected Supabase failure-path warnings, and Sentry config warning during export.

## 19. Safe-beta validation

Explicit safe-beta public config with unsafe flags set to `0`:

```text
PASS
```

Safe-beta export:

```text
PASS
Web Bundled
iOS Bundled
Android Bundled
Assets (1592)
web bundles (2)
ios bundles (1)
android bundles (1)
```

Normal export:

```text
PASS
Web Bundled
Android Bundled
iOS Bundled
Assets (1592)
web bundles (2)
android bundles (1)
ios bundles (1)
```

Both export temp directories were removed.

## 20. Remaining issues, if any

No P0/P1 software blocker was found. No P2/P3 item from this prompt remains open in software.

Still required outside this software pass:

- closed-beta physical-device QA;
- normal store-console/privacy review before broader distribution;
- actual secure cloud account deletion endpoint/support process if product owner wants in-app account deletion beyond local device clear.

## 21. Closed-beta decision after P2/P3 remediation

Software P0/P1 remains fixed and P2/P3 cleanup is complete. Closed beta can proceed after required physical-device QA. Public release remains blocked.

## 22. Final Git status

Final status contains the pre-existing dirty baseline, the intentional P2/P3 edits above, and this new report. Prompt files are now ignored by `.gitignore`; the remaining untracked files are audit reports and source/test files that should be intentionally reviewed:

```text
?? docs/audits/HALE_CLOSED_BETA_RC_P1_REMEDIATION.md
?? docs/audits/HALE_CLOSED_BETA_RELEASE_CANDIDATE_AUDIT.md
?? docs/audits/HALE_CLOSED_BETA_RC_P2_P3_REMEDIATION.md
?? src/components/DateOfBirthPickerModal.tsx
?? src/components/__tests__/DateOfBirthPickerModal.test.ts
?? src/config/__tests__/androidPermissions.test.ts
?? src/render/ArtDirectedHumanRenderer.tsx
?? src/render/__tests__/artDirectedHumanGeometry.test.ts
?? src/render/artDirectedHumanGeometry.ts
?? src/screens/__tests__/MovementProfileV2UnifiedCheckUpScreen.voiceRuntime.test.ts
```

Tracked modified/deleted files remain as shown by `git status`; no staging or commit was performed.

## 23. Confirmation

No package install occurred. No lockfile changed. No audio was regenerated. No files were staged. No commit was created. No branch was created or switched. No push or PR was created. No Warden formula/data/source/fingerprint/golden-example change occurred. No public V1 rollback was introduced. No training credit/progression change occurred. No H5/HF logic regression was found. No physical-device validation is claimed.

CLOSED BETA RC P2/P3 REMEDIATION COMPLETE

RC-004 WEAK COPY FIXED

RC-005 TECHNICAL RESULT COPY FIXED

RC-006 ANDROID AUDIO / FOREGROUND PERMISSION REVIEW RESOLVED

RC-007 DELETE-ACCOUNT UX FIXED

RC-008 WEBSITE LANGUAGE ALIGNED

RC-009 DOB 120-YEAR EDGE FIXED

RC-010 PROMPT-FILE RELEASE HYGIENE RESOLVED

RC-011 PRIVATE WARDEN SOURCE BACKUP COMPLETED

NO P0/P1 SOFTWARE BLOCKERS REMAIN

CLOSED BETA GO - SOFTWARE P0/P1 FIXED AND P2/P3 CLEANUP COMPLETE; DEVICE QA STILL REQUIRED

PUBLIC RELEASE REMAINS BLOCKED

PHYSICAL DEVICE VALIDATION NOT CLAIMED

NO WARDEN FORMULA / DATA CHANGE

NO AUDIO REGENERATION

NO PACKAGE / LOCKFILE CHANGE

NO STAGING / COMMIT / BRANCH / PUSH
