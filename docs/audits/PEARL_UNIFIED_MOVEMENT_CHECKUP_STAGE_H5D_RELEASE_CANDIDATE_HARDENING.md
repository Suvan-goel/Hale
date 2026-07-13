# Pearl Unified Movement Check-Up - Stage H5D Release-Candidate Hardening

Date: 2026-06-26

Stage: H5D

Decision:

```text
UNIFIED MOVEMENT CHECK-UP STAGE H5D COMPLETE
BETA BUILD FLAG LOCKDOWN VERIFIED
INTERNAL / DIAGNOSTIC HARNESS EXPOSURE BLOCKED BY DEFAULT
PUBLIC V2 ROUTING RELEASE-CANDIDATE VERIFIED
AUDIO ASSET FINGERPRINT GATE PASSED
PHYSICAL DEVICE QA PROTOCOL CREATED
CLOSED BETA SOFTWARE READY UNDER PRODUCT-OWNER DEVICE-QA WAIVER
PUBLIC RELEASE REMAINS BLOCKED
```

## 1. Scope

H5D performed release-candidate hardening for the unified Movement Check-Up migration. The work covered beta/release flag inventory, exact flag parsing, internal/diagnostic containment, public V2 route preservation, V1 rollback containment, copy/privacy/backend checks, stale current documentation cleanup, physical-device QA protocol creation, and final H0-H5C regression validation.

No major product feature was added. No Movement Profile V2 protocol, reference engine, focus policy, block creation, official retest transition, V2 report, H5A Progress behavior, H5B micro-check behavior, training schedule/progression, cue text, audio asset, audio manifest fingerprint, Warden transform, dependency, lockfile, font, or unrelated asset was intentionally changed by H5D.

Production session/runtime behavior changed: no. H5D added a pure release-flag audit helper under `src/config` and focused tests. That helper is not wired into public Check-Up runtime routing, session execution, audio playback, training generation, or product UI.

## 2. H5C Prerequisite Evidence

Required H5C report exists at `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5C_PUBLIC_V1_ROUTE_RETIREMENT.md`.

H5C carried these prerequisites into H5D:

```text
UNIFIED MOVEMENT CHECK-UP STAGE H5C COMPLETE
PUBLIC V1 CHECK-UP / RESULTS ROUTES RETIRED
UNIFIED V2 PUBLIC DEFAULT ENABLED
LEGACY V1 ROLLBACK-BUILD POLICY IMPLEMENTED
INTERNAL HARNESS CONTAINMENT VERIFIED
V1 ROLLBACK PATH VERIFIED
UNIFIED MOVEMENT CHECK-UP STAGE H5D UNBLOCKED
NORMAL PUBLIC CHECK-UP IS UNIFIED V2
PUBLIC V1 MOVEMENT AGE FLOW RETIRED FROM NORMAL BUILDS
V1 RETAINED ONLY FOR EXPLICIT ROLLBACK BUILDS
ACCEPTED V2 STATE NEVER FALLS BACK TO V1
NO V1 LEGACY-RESULT MIGRATION REQUIRED
NO MIXED V1 / V2 USER HISTORY
NO IMPROVEMENT OR DECLINE CLAIMS
H5A V2 PROGRESS PRESERVED
H5B MICRO-CHECK POLICY PRESERVED
AUDIO ASSET FINGERPRINT GATE PASSED
PHYSICAL DEVICE VALIDATION NOT CLAIMED
PUBLIC RELEASE REMAINS BLOCKED
```

H5D re-ran the current tree rather than inheriting H5C counts.

## 3. Founder/Product Decisions Carried Forward

Normal public Check-Up is unified Movement Profile V2. Public V1 Movement Age flow remains retired from normal builds. V1 is retained only for an explicit rollback build using `EXPO_PUBLIC_ENABLE_LEGACY_V1_CHECKUP_ROLLBACK=1`, and only when no accepted, pending, malformed, block-origin, or report-origin V2 authority exists.

Internal harnesses and diagnostics may remain in source, but beta/release defaults must not expose them. Release diagnostics require exact deliberate opt-in and must remain bounded to non-secret IDs, reason codes, policy versions, and sanitized metadata. No raw pose frames, images, landmarks, health free text, provider secrets, or credentials may be exposed.

Warden remains deferred. Chair reference remains raw-only. H5D did not add percentile claims, Movement Age, weakest domain, improvement/decline, percentage change, diagnosis, fall-risk, pass/fail, medical claims, or physical validation claims.

## 4. Initial Git Status

Initial safety commands were run before edits:

```bash
git status --short --untracked-files=all
git diff --name-only
git diff --stat
git ls-files --others --exclude-standard
```

Initial worktree was already heavily dirty. Key initial facts recorded:

- `.env.example`, `AGENTS.md`, `App.tsx`, `CLAUDE.md`, `docs/decisions.md`, many audio assets, audio manifests, scripts, render files, backend files, training files, Progress files, micro-check files, and many audit docs were already modified or untracked.
- Initial `git diff --stat`: `445 files changed, 7459 insertions(+), 1653 deletions(-)`.
- Prior H4/H5 reports and prompts were untracked before H5D.
- H5D treated all pre-existing tracked and untracked changes as user-owned and did not revert, delete, move, broadly reformat, stage, commit, branch, push, or open a PR.

The full status output spans hundreds of audio and audit paths. The final status section records the current categories and H5D-owned additions.

## 5. Re-Entry Typecheck

Command:

```bash
npm run typecheck
```

Result: passed.

This allowed H5D implementation to proceed.

## 6. Initial Audio Verification

Command:

```bash
npm run verify:audio
```

Result: passed.

Observed output:

```text
AUDIO VERIFICATION PASS safety: requiredCues=44 voices=clara,marcus requiredAssets=88 totalBytes=4944110 durationRange=1.904-5.805s movementProfileV2: requiredCues=31 voices=clara,marcus requiredAssets=62 totalBytes=3350553 durationRange=0.743-7.430s total: requiredAssets=150
```

No audio regeneration, MP3 editing, cue-text editing, voice-ID editing, model/settings change, or hand-edited fingerprint change was performed by H5D.

## 7. Baseline Validation

Baseline software validation was run against the current dirty tree. Results:

- Focused H5D aggregate: passed, `36 suites / 262 tests`.
- Full Jest: passed, `160 suites / 1309 tests`.
- App typecheck: passed.
- Website typecheck: passed.
- Normal local Expo public config: passed.
- Normal local Expo export: passed, Android/iOS bundles, `444 assets`.
- `git diff --check`: passed.

Known warnings:

- Watchman recrawl warning.
- Expected sync-failure console output from negative-path backend tests.
- Jest open-handle notice after focused/full runs.
- Sentry Expo plugin warning about missing organization/project configuration.
- Normal local Expo config/export loaded `.env.local` and `.env`; local diagnostics booleans were `true` because local dev env enables them. H5D separately verified safe-beta config/export with sanitized flags off.

## 8. Release Flag Inventory

| Flag/config | Parser | Default observed | Beta/release expected | User-facing effect | H5D action |
| --- | --- | --- | --- | --- | --- |
| `EXPO_PUBLIC_ENABLE_LEGACY_V1_CHECKUP_ROLLBACK` | Exact `value === '1'` in `src/config/legacyV1CheckUpRollback.ts`; also covered by `parseExactReleaseFlag` | `.env.example=0` | Off | Enables rollback-only V1 only when safe no-V2 state exists | Added audit unsafe reason and parser/default tests |
| `EXPO_PUBLIC_ENABLE_UNIFIED_MOVEMENT_CHECKUP` | Exact `value === '1'` in `src/config/unifiedMovementCheckUpRelease.ts` | `.env.example=0` | No longer required for public V2 | Legacy release flag; public V2 is default by policy | Documented safe/off and not considered unsafe |
| `EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_INTERNAL` | Exact `value === '1'` in `src/config/movementProfileV2Internal.ts` | `.env.example=0` | Off | Internal harness/Settings exposure | Added audit unsafe reason and parser/default tests |
| `EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_DIAGNOSTICS` | Exact `value === '1'` in `src/movementProfileV2/liveDiagnostics.ts`; also requires internal flag | `.env.example=0` | Off | Internal V2 diagnostics | Added audit unsafe reason and parser/default tests |
| `EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS` | Exact `value === '1'` in `app.config.js` and `src/diagnostics/poseLatencyDiagnostics.ts` | `.env.example=0`; local `.env.local` enabled | Off | Pose latency diagnostics and benchmark route callbacks | Added audit unsafe reason and safe-beta config/export proof |
| `EXPO_PUBLIC_ALLOW_DIAGNOSTICS_IN_RELEASE` | Exact `value === '1'` in `app.config.js` and `src/diagnostics/poseLatencyDiagnostics.ts` | `.env.example=0`; local `.env.local` enabled | Off unless deliberate diagnostics build | Allows release diagnostics when paired with diagnostic flag | Added audit unsafe reason and safe-beta config/export proof |
| `EXPO_PUBLIC_ENABLE_POSE_RENDERER_BENCHMARKS` | No current runtime parser found | Not present / not `1` | Off | Renderer benchmark exposure if introduced later | Modeled in audit helper as unsafe if on; test proves `.env.example` does not enable it |
| Dev mock data | Persisted preference guarded by `__DEV__` in `App.tsx`; no public env authority | Local dev only | Off | Developer mock data only | Audit helper accepts `devMockDataEnabled` and marks beta/release unsafe |
| `EXPO_PUBLIC_SUPABASE_URL` | Public config name only | Present in `.env` name list; value not printed | Public client config only | Backend URL | No secret value inspected or printed |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public config name only | Present in `.env` name list; value not printed | Public client config only | Supabase publishable key | Prompt mentioned anon key; repo uses publishable key. No value printed |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | No active repo use found | Not found | N/A | N/A | Recorded name mismatch only |
| `EXPO_PUBLIC_ENABLE_SENTRY` | Exact `value === '1'` in Sentry helper | `.env.example=0` | Optional observability | Enables Sentry only with DSN | Marked non-internal in audit safe diagnostics; exact parser covered |
| `EXPO_PUBLIC_SENTRY_DSN` | DSN consumed only when Sentry enabled | Present by name only if configured | Optional observability | Sentry transport | No value printed; Sentry tests passed |
| Sentry org/project config | Expo plugin config names only | Missing in local config | Not a user feature | Build/source-map warning only | Warning recorded |
| `EXPO_PUBLIC_ENABLE_APPLE_SIGN_IN` | Exact `value === '1'` in auth helper | `.env.example=0` | Optional auth UI | Apple sign-in | Marked non-internal in audit safe diagnostics; exact parser covered |
| `EXPO_PUBLIC_ENABLE_MPV2_VOICE_RUNTIME_FOUNDATION` | Existing parser differs: enabled unless value is exactly `0` | Default on | Not an internal/diagnostic/rollback exposure flag | Training voice foundation readiness | Documented as outside H5D unsafe surface |
| `EXPO_PUBLIC_ENABLE_EYES_OPEN_BALANCE_PROTOCOL_V2` | Existing exact `1` parser plus audio readiness gate | Not in `.env.example` | Not a beta exposure without readiness | Experimental protocol path | No H5D runtime change |
| `EXPO_PUBLIC_ENABLE_TRAINING_VOICE_V2_1` | Existing readiness gate; audio-ready false blocks public runtime | Not in `.env.example` | Not a beta exposure without readiness | Training voice v2.1 | No H5D runtime change |

Only `.env` variable names were inspected. Secret/provider values were not printed.

## 9. Beta/Release Flag Policy

Safe beta/release defaults:

```text
legacy V1 rollback: off
internal harnesses: off
movement profile diagnostics: off
pose latency diagnostics: off
renderer benchmarks: off
release diagnostics: off unless a deliberate diagnostics build is intended
dev mock data: off
public V2 default: on by policy, not by old unified flag
```

`.env.example` documents safe defaults for rollback, internal, Movement Profile V2 diagnostics, pose latency diagnostics, and release diagnostics. No EAS profile file exists, so H5D verified behavior through explicit sanitized env config/export commands and a pure audit helper.

## 10. Release-Mode Audit Helper

Added `src/config/releaseFlagAudit.ts`.

The helper is pure: `auditBetaReleaseFlags` accepts explicit parsed flags and optional build profile/platform values. It does not read env directly. `parseReleaseFlagAuditEnv` is the small wrapper for explicit env-shaped inputs.

Unsafe beta/release reasons:

```text
legacy_v1_rollback_enabled
movement_profile_v2_internal_enabled
movement_profile_v2_diagnostics_enabled
pose_latency_diagnostics_enabled
release_diagnostics_allowed
pose_renderer_benchmarks_enabled
dev_mock_data_enabled
```

Development profiles `development`, `dev`, and `local-dev` are not audited as beta/release profiles, preserving intentional local engineering workflows.

## 11. Exact Parser Behavior

Added `src/config/__tests__/releaseFlagAudit.test.ts`.

The tests verify:

- safe beta defaults are `safe`;
- public V2 default is expected and not unsafe;
- every unsafe release exposure reason is reported for beta/release inputs;
- development profiles are not blocked by internal/diagnostic local flags;
- each H5D release/security boolean parses exact `'1'` only;
- missing, empty, `0`, `true`, `yes`, `' 1 '`, and boolean `true` are false;
- `.env.example` keeps rollback/internal/diagnostic/release-diagnostics defaults off;
- pose renderer benchmark env is not enabled in `.env.example`.

Existing exact parsers were not weakened.

## 12. Expo/App Config Audit

Inspected:

- `app.config.js`
- `app.json`
- Expo config plugin list
- Sentry config behavior
- config helpers under `src/config`

`eas.json` is absent.

`app.config.js` exposes only two relevant booleans through `extra`:

```text
enablePoseLatencyDiagnostics
allowDiagnosticsInRelease
```

Both default false unless their exact env flag is `1`. Local `.env.local` currently enables them for developer use, so normal local config showed both as true. This was not treated as beta/release truth.

`app.json` includes plugins for the local pose-detection module, `expo-audio`, `expo-font`, `expo-web-browser`, `expo-apple-authentication`, and `@sentry/react-native/expo`. Camera permission copy states skeleton outline usage and no video shown/stored.

## 13. Safe-Beta Public Config Result

Command:

```bash
env EXPO_NO_DOTENV=1 \
  EXPO_PUBLIC_ENABLE_LEGACY_V1_CHECKUP_ROLLBACK=0 \
  EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_INTERNAL=0 \
  EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_DIAGNOSTICS=0 \
  EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS=0 \
  EXPO_PUBLIC_ALLOW_DIAGNOSTICS_IN_RELEASE=0 \
  npx --no-install expo config --type public
```

Result: passed.

Observed safe public config:

```text
extra: { enablePoseLatencyDiagnostics: false, allowDiagnosticsInRelease: false }
```

Known warning: Sentry organization/project missing warning. No secret values were printed.

## 14. Safe-Beta Export Result

Command:

```bash
rm -rf /tmp/pearl-unified-h5d-safe-beta-export
env EXPO_NO_DOTENV=1 \
  EXPO_PUBLIC_ENABLE_LEGACY_V1_CHECKUP_ROLLBACK=0 \
  EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_INTERNAL=0 \
  EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_DIAGNOSTICS=0 \
  EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS=0 \
  EXPO_PUBLIC_ALLOW_DIAGNOSTICS_IN_RELEASE=0 \
  npx --no-install expo export --platform all --output-dir /tmp/pearl-unified-h5d-safe-beta-export
rc=$?
rm -rf /tmp/pearl-unified-h5d-safe-beta-export
exit $rc
```

Result: passed.

Output: Android/iOS bundles exported, `444 assets`.

Known warnings: Sentry missing org/project; Node `NO_COLOR` ignored because `FORCE_COLOR` was set. Temporary export directory was removed.

## 15. H5C Route Guarantees

Focused aggregate and full Jest preserved H5C routing:

- normal public baseline selects unified V2;
- baseline retake selects unified V2;
- old unified flag missing/off still selects V2;
- public V1 Check-Up/result routes are blocked in normal builds;
- V1 rollback requires exact rollback flag and safe no-V2 state;
- accepted, pending, malformed, block-origin, and report-origin V2 states prevent V1 fallback;
- V2 official retest unavailable states do not fall back to V1;
- public manual/quick V1 starts remain hidden or typed unavailable.

## 16. Settings/Internal Harness Containment

Settings rows for internal harnesses and diagnostics remain callback-gated. `App.tsx` passes internal harness callbacks only when the internal flag is enabled. Pose benchmark callback is passed only when pose latency diagnostics are enabled.

Safe beta policy keeps these flags off, so Settings exposes no internal harness, rollback, diagnostics, benchmark, schema, fingerprint, or source labels in normal beta/release mode. Internal flag-on behavior remains available for engineering builds, and the audit helper marks that unsafe for beta/release.

## 17. Deep-Link/Direct-Route Safety

Automated route tests verify direct and crafted route attempts recover safely:

- direct V1 Check-Up blocked in normal mode;
- direct V1 result blocked in normal mode;
- internal harness route blocked unless internal flag is on;
- diagnostics route blocked unless diagnostics flag is on;
- unknown selected IDs fail safely;
- malformed V2 authority fails closed rather than falling back to V1.

## 18. Public Copy/Claim Guardrails

Copy guardrail tests passed in the focused aggregate and full Jest run. Normal public beta paths remain free of prohibited public claims and implementation labels:

```text
Movement Age
body age
weakest
V1
V2
internal
unified shell
schema
fingerprint
debug
diagnostic
fall risk
diagnosis
improved
declined
percentile
```

Historical audit docs, tests, rollback-only files, and gated internal harnesses may contain these terms. They are not exposed in normal public beta flow.

## 19. Privacy/Export/Account Audit

Privacy/export/account tests passed in the focused aggregate and full Jest run.

Verified behavior:

- data export sanitizes frames, landmarks, video, image, base64, token, secret, URI, and path-like sensitive payloads;
- sync payload tests cover sensitive-key sanitization;
- diagnostics payloads are bounded and do not include raw pose/media/secrets;
- account clear removes local check-up, training, report, and micro-check state;
- local-first state remains authoritative when backend operations fail.

## 20. Auth/Backend Release Posture

Backend/auth tests passed for account data, data export, restore, training state sync, block report sync, micro-check sync, check-up sync, session sync, block sync, and launch sync guards.

Observed posture:

- app uses the current auth/backend integration as intended;
- signed-out restore/sync paths short-circuit safely;
- user scoping remains tested;
- backend failures do not crash core local-first flows;
- no backend schema or migration change was required for H5D.

Expected negative-path sync failure logs appeared during tests and were treated as known test output, not release blockers.

## 21. Stale Doc/Config Cleanup

Updated `CLAUDE.md` only where current, non-historical audio wording was stale. Prior reports and `docs/decisions.md` were not edited.

No release flag current-doc edits were required beyond the new H5D report because current runtime tests and config helpers already encode:

- public V2 default by policy;
- V1 rollback only behind exact rollback flag;
- internal harnesses behind exact internal flag;
- diagnostics behind separate exact flags.

## 22. Audio Doc/Model Reconciliation

`CLAUDE.md` now matches the current verified audio truth:

```text
provider: elevenlabs
model: eleven_multilingual_v2
outputFormat: mp3_44100_128
voices: clara, marcus
verified required assets: 150
```

H5D did not regenerate audio, edit MP3 files, change cue text, change voice IDs, change model/settings, or hand-edit fingerprints. Audio verification passed at entry and final close.

## 23. Physical-Device QA Protocol

Created:

```text
docs/qa/PEARL_CLOSED_BETA_PHYSICAL_DEVICE_QA_PROTOCOL.md
```

The protocol is an evidence template only. It includes:

- device matrix;
- build profile and worktree/commit identity fields;
- expected safe beta flags;
- camera permissions;
- onboarding V2 baseline;
- chair setup/practice/official;
- balance side selection/trials/rest/use-best;
- shoulder side selection/retry/pain-limited;
- hinge supporting capture/no-measurement;
- V2 results and automatic block;
- session A/B/C training;
- Balanced micro-check week 1/2/3 and week 4 none;
- official V2 retest;
- V2 report;
- next block;
- Progress history/report;
- offline/local-first smoke;
- audio playback/text fallback;
- subject-gone/tracking interruption;
- accessibility/large text;
- Android/iOS coverage;
- pass/fail/evidence fields;
- known limitations;
- waiver section.

No pass/fail device evidence was fabricated.

## 24. Final Multi-Block Software Verification

The focused H5D aggregate and full Jest run covered:

- new user -> V2 baseline/onboarding;
- V2 result -> V2 block;
- 4-week A/B/C schedule;
- Balanced/domain micro-check policy;
- official V2 retest;
- V2 report;
- completed prior block;
- automatic next block;
- Progress history/report history;
- rollback/direct route containment;
- Stage 5H lifecycle;
- audio tests;
- privacy/export/account clear;
- backend sync/restore/account guards.

No physical camera/device simulation was added.

## 25. Failure-Mode Verification

Verified failure modes:

- raw V2 pending details do not fall back to V1;
- malformed V2 state fails closed;
- failed remote sync does not crash local-first flows;
- audio playback failure fallback remains covered by audio/player tests;
- internal flag accidentally on in beta audit input is unsafe;
- rollback flag accidentally on in beta audit input is unsafe;
- diagnostics/release-diagnostics accidentally on in beta audit input is unsafe;
- direct V1 route attempt is blocked;
- direct internal/diagnostic route attempt is gated.

## 26. Release Checklist

| Gate | Result |
| --- | --- |
| Software gate | Passed |
| Audio gate | Passed, 150 required assets |
| Flag gate | Passed, audit helper/tests and safe-beta config/export |
| Route gate | Passed, public V2 default and V1 retired from normal builds |
| Settings/internal harness gate | Passed, hidden by default |
| Diagnostics/pose benchmark gate | Passed, off by default; unsafe when on for beta/release audit |
| Copy/claims gate | Passed |
| Privacy/export/account gate | Passed |
| Backend/auth gate | Passed |
| Physical-device QA gate | Protocol created; device validation not performed |
| Store/TestFlight/Play internal testing gate | Not performed |
| Public release gate | Blocked |
| Known warnings | Watchman recrawl, Jest open-handle notice, expected negative sync logs, Sentry org/project warning, safe export `NO_COLOR`/`FORCE_COLOR` warning |
| Waiver truth | Product-owner device-QA waiver exists in current repo decision record for invite-only closed beta; device behavior is not yet verified |

## 27. Closed-Beta Ship Decision

Selected state:

```text
CLOSED BETA SOFTWARE READY UNDER PRODUCT-OWNER DEVICE-QA WAIVER
```

Reason: software gate, flag gate, route gate, copy/privacy/backend gate, Expo config/export, typechecks, full Jest, and audio verification are green. Current repo decision record states an invite-only closed-beta device-QA waiver with this exact truth:

```text
PHYSICAL DEVICE VALIDATION NOT PERFORMED
PHYSICAL DEVICE VALIDATION WAIVED BY PRODUCT OWNER FOR INVITE-ONLY CLOSED BETA
DEVICE BEHAVIOUR NOT YET VERIFIED
BETA TESTERS WILL BE THE INITIAL DEVICE-VALIDATION COHORT
PUBLIC RELEASE REMAINS BLOCKED
```

This is not public-release approval. Public release remains blocked until actual physical-device validation and release evidence exist.

## 28. Product Containment

```text
NORMAL PUBLIC CHECK-UP IS UNIFIED V2
PUBLIC V1 MOVEMENT AGE FLOW RETIRED FROM NORMAL BUILDS
V1 RETAINED ONLY FOR EXPLICIT ROLLBACK BUILDS
ACCEPTED V2 STATE NEVER FALLS BACK TO V1
H5A V2 PROGRESS PRESERVED
H5B MICRO-CHECK POLICY PRESERVED
NO IMPROVEMENT OR DECLINE CLAIMS
WARDEN TRANSFORM DEFERRED
CHAIR REFERENCE CLAIM REMAINS RAW-ONLY
PHYSICAL DEVICE VALIDATION NOT CLAIMED UNLESS EVIDENCE EXISTS
PUBLIC RELEASE REMAINS BLOCKED
```

## 29. Files Changed

H5D-owned files:

```text
CLAUDE.md
src/config/releaseFlagAudit.ts
src/config/__tests__/releaseFlagAudit.test.ts
docs/qa/PEARL_CLOSED_BETA_PHYSICAL_DEVICE_QA_PROTOCOL.md
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5D_RELEASE_CANDIDATE_HARDENING.md
```

H5D edited `CLAUDE.md` only to replace stale current audio model wording with the verified `eleven_multilingual_v2` / `mp3_44100_128` wording.

## 30. Tests Added/Changed

Added:

```text
src/config/__tests__/releaseFlagAudit.test.ts
```

Test scope:

- safe beta defaults;
- unsafe beta/release exposure reasons;
- dev profile non-blocking behavior;
- exact `1` parser behavior;
- `.env.example` safe rollback/internal/diagnostics defaults.

No existing tests were weakened by H5D.

## 31. Exact Focused Validation

Command:

```bash
npm test -- --runInBand src/config/__tests__/releaseFlagAudit.test.ts src/config/__tests__/legacyV1CheckUpRollback.test.ts src/config/__tests__/unifiedMovementCheckUpRelease.test.ts src/config/__tests__/movementProfileV2Internal.test.ts src/diagnostics/__tests__/poseLatencyDiagnostics.test.ts src/checkup/__tests__/publicCheckUpEngine.test.ts src/checkup/__tests__/publicUnifiedMovementCheckUpLifecycle.integration.test.ts src/onboarding/__tests__/onboarding.test.ts src/pearlFlow/__tests__/appLifecycle.test.ts src/pearlFlow/__tests__/pearlFlow.test.ts src/pearlFlow/__tests__/copyGuardrails.test.ts src/pearlFlow/__tests__/microCheckPolicy.test.ts src/pearlFlow/__tests__/microCheckPolicyH5B1.test.ts src/services/backend/__tests__/microCheckPersistenceH5B1.integration.test.ts src/training/__tests__/store.test.ts src/pearlFlow/__tests__/progressDataAuthority.test.ts src/pearlFlow/__tests__/movementProfileV2ProgressViewModel.test.ts src/pearlFlow/__tests__/movementProfileV2OfficialRetestTransition.test.ts src/pearlFlow/__tests__/movementProfileV2OfficialRetestContinuation.integration.test.ts src/pearlFlow/__tests__/movementProfileV2OfficialRetestH411Continuation.integration.test.ts src/pearlFlow/__tests__/stage5hLifecycle.integration.test.ts src/screens/__tests__/CheckUpRecordingShell.test.ts src/audio/__tests__/safetyAudio.test.ts src/audio/__tests__/movementProfileV2Audio.test.ts src/audio/__tests__/voicePlayer.test.ts src/services/backend/__tests__/accountDataService.test.ts src/services/backend/__tests__/dataExportService.test.ts src/services/backend/__tests__/restoreService.test.ts src/services/backend/__tests__/trainingStateSyncService.test.ts src/services/backend/__tests__/blockReportSyncService.test.ts src/services/backend/__tests__/microCheckSyncService.test.ts src/services/backend/__tests__/checkupSyncService.test.ts src/services/backend/__tests__/sessionSyncService.test.ts src/services/backend/__tests__/blockSyncService.test.ts src/services/backend/__tests__/launchSyncGuards.test.ts src/services/observability/__tests__/sentry.test.ts
```

Result:

```text
PASS 36 suites / 262 tests
```

Known warnings: Watchman recrawl warning, expected negative-path sync logs, Jest open-handle notice.

Focused new helper test alone also passed:

```text
PASS src/config/__tests__/releaseFlagAudit.test.ts
1 suite / 4 tests
```

## 32. Exact Full Validation

Full release gate commands and results:

```bash
npm run verify:audio
```

Passed, 150 required assets.

```bash
npm test -- --runInBand
```

Passed:

```text
160 suites / 1309 tests
```

```bash
npm run typecheck
```

Passed.

```bash
npm --prefix website run typecheck
```

Passed.

```bash
npx --no-install expo config --type public
```

Passed in normal local env. It loaded `.env.local` and `.env` names and reported local diagnostics booleans true:

```text
extra: { enablePoseLatencyDiagnostics: true, allowDiagnosticsInRelease: true }
```

This is local developer config, not safe beta config. Safe beta config was separately verified with `EXPO_NO_DOTENV=1` and explicit unsafe flags off.

```bash
git diff --check
```

Passed.

Normal local export was run because safe-beta env differs from local config:

```bash
rm -rf /tmp/pearl-unified-h5d-normal-export
npx --no-install expo export --platform all --output-dir /tmp/pearl-unified-h5d-normal-export
rc=$?
rm -rf /tmp/pearl-unified-h5d-normal-export
exit $rc
```

Passed, Android/iOS bundles, `444 assets`. Temporary export directory was removed.

Known warnings: Watchman recrawl, expected negative sync logs, Jest open-handle notice, Sentry org/project warning.

Validation did not intentionally generate tracked files. Temporary Expo export directories were removed.

## 33. Audio Verification

Initial and final audio verification passed.

Final command:

```bash
npm run verify:audio
```

Final result:

```text
AUDIO VERIFICATION PASS safety: requiredCues=44 voices=clara,marcus requiredAssets=88 totalBytes=4944110 durationRange=1.904-5.805s movementProfileV2: requiredCues=31 voices=clara,marcus requiredAssets=62 totalBytes=3350553 durationRange=0.743-7.430s total: requiredAssets=150
```

Runtime audio remains bundled/local. No runtime TTS path was introduced.

## 34. App/Website Typechecks

```text
npm run typecheck: passed
npm --prefix website run typecheck: passed
```

## 35. Expo Config/Export

Safe-beta public config:

```text
passed
extra: { enablePoseLatencyDiagnostics: false, allowDiagnosticsInRelease: false }
```

Safe-beta export:

```text
passed
Android/iOS bundles
444 assets
```

Normal local public config:

```text
passed
local env enabled diagnostics booleans
```

Normal local export:

```text
passed
Android/iOS bundles
444 assets
```

`eas.json` is absent, so no EAS profile-specific behavior was inspected.

## 36. H0-H5D / Stage 3D-B / Stage 4 / Stage 5 / Step-Up / Audio Regression

Full Jest plus the focused aggregate kept the current software regression surface green:

- H0-H5D Movement Check-Up migration tests passed through current suites.
- H4/H4.1.1 official retest/report/next-block tests passed.
- H5A V2-canonical Progress/history/report history tests passed.
- H5B/H5B.1 micro-check policy and persistence tests passed.
- Stage 5H lifecycle tests passed.
- Stage 3D-B, Stage 4 policy/capability/safety/equipment/progression coverage remains represented by the current passing suites and reports.
- Step-Up resume/runtime-related current suites remained green in full Jest.
- Navigation/direct route guards remained green.
- TypeScript boundaries remained green.
- Safety audio and Movement Profile V2 audio tests passed.

H5D did not perform Warden work.

## 37. Remaining Physical-Device / Store / Public-Release Work

Remaining before broad/public release:

- execute the physical-device QA protocol on actual Android and iOS devices;
- collect evidence, failures, videos/screenshots/logs where appropriate, and waiver sign-off fields;
- verify camera permission, tracking interruption, audio fallback, large text, offline/local-first, and performance on real devices;
- prepare TestFlight/Play Internal Testing metadata and distribution only with waiver truth preserved;
- complete public-release device validation and release evidence before public launch.

Public release remains blocked.

## 38. Initial/Final Git Status

Initial status: heavily dirty before H5D, including `.env.example`, `AGENTS.md`, `App.tsx`, many MP3 assets, docs, scripts, render, backend, training, Progress, micro-check, and numerous untracked audit files. Initial tracked diff stat was:

```text
445 files changed, 7459 insertions(+), 1653 deletions(-)
```

Final tracked diff stat before writing this report was:

```text
446 files changed, 7460 insertions(+), 1654 deletions(-)
```

Final `git status --short --untracked-files=all` remained heavily dirty. H5D-owned new/untracked files included:

```text
?? docs/qa/PEARL_CLOSED_BETA_PHYSICAL_DEVICE_QA_PROTOCOL.md
?? src/config/__tests__/releaseFlagAudit.test.ts
?? src/config/releaseFlagAudit.ts
```

This report is also H5D-owned:

```text
?? docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5D_RELEASE_CANDIDATE_HARDENING.md
```

## 39. Complete Files-Changed Inventory

H5D-owned inventory:

```text
M  CLAUDE.md
?? docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5D_RELEASE_CANDIDATE_HARDENING.md
?? docs/qa/PEARL_CLOSED_BETA_PHYSICAL_DEVICE_QA_PROTOCOL.md
?? src/config/__tests__/releaseFlagAudit.test.ts
?? src/config/releaseFlagAudit.ts
```

Not H5D-owned but present in the dirty worktree before/during this task:

- `.env.example`
- `AGENTS.md`
- `App.tsx`
- many `assets/audio/voice/clara/*.mp3` and `assets/audio/voice/marcus/*.mp3`
- audio manifests and audio tests
- `docs/decisions.md`
- training voice / floor / Step-Up / micro-check audit docs
- render/avatar source and tests
- backend sync/restore/account tests and source
- Progress, micro-check, public Check-Up, lifecycle, and training source/tests
- numerous prior H4/H5 reports and prompts

Those changes were preserved and not reverted.

## 40. Concurrent External Changes

The worktree contains substantial concurrent user-owned work outside H5D scope:

- audio asset and manifest changes;
- Step-Up runtime/evidence/resume work;
- training voice v2.1 controls/progress/recovery/live-safety work;
- micro-check voice v2.1 work;
- floor transfer readiness work;
- render/avatar work;
- backend sync/restore/training state work;
- Progress and Movement Profile V2 history work;
- prior audit reports and prompts.

H5D validated against this current tree and did not claim ownership of those changes.

## 41. Non-Action Confirmation

Confirmed:

```text
No package install.
No lockfile change.
No audio regeneration.
No MP3 edit by H5D.
No cue text change by H5D.
No audio model/settings change by H5D.
No hand-edited fingerprints by H5D.
No staging.
No commit.
No branch creation or switch.
No push.
No pull request.
No Warden work.
No fabricated physical-device validation.
No secret .env values printed.
No font modification.
No destructive Git command.
```

## Final Stage Statements

```text
UNIFIED MOVEMENT CHECK-UP STAGE H5D COMPLETE
BETA BUILD FLAG LOCKDOWN VERIFIED
INTERNAL / DIAGNOSTIC HARNESS EXPOSURE BLOCKED BY DEFAULT
PUBLIC V2 ROUTING RELEASE-CANDIDATE VERIFIED
AUDIO ASSET FINGERPRINT GATE PASSED
PHYSICAL DEVICE QA PROTOCOL CREATED
CLOSED BETA SOFTWARE READY UNDER PRODUCT-OWNER DEVICE-QA WAIVER

NORMAL PUBLIC CHECK-UP IS UNIFIED V2
PUBLIC V1 MOVEMENT AGE FLOW RETIRED FROM NORMAL BUILDS
V1 RETAINED ONLY FOR EXPLICIT ROLLBACK BUILDS
ACCEPTED V2 STATE NEVER FALLS BACK TO V1
H5A V2 PROGRESS PRESERVED
H5B MICRO-CHECK POLICY PRESERVED
NO IMPROVEMENT OR DECLINE CLAIMS
WARDEN TRANSFORM DEFERRED
CHAIR REFERENCE CLAIM REMAINS RAW-ONLY
PHYSICAL DEVICE VALIDATION NOT CLAIMED UNLESS EVIDENCE EXISTS
PUBLIC RELEASE REMAINS BLOCKED
```
