You are implementing the final software-hardening stage of Pearl’s unified Movement Check-Up migration:

PEARL UNIFIED MOVEMENT CHECK-UP — STAGE H5D
RELEASE-CANDIDATE HARDENING,
BETA-BUILD FLAG LOCKDOWN,
FINAL SOFTWARE VERIFICATION,
PHYSICAL-DEVICE QA PROTOCOL,
AND CLOSED-BETA SHIP DECISION

This is the final H5 release-candidate hardening stage.

Do not add major product features in this task.

Do not claim physical-device validation has been performed unless actual device evidence exists in the repository and is explicitly inspected.

## H5C prerequisite and current baseline

Stage H5C is complete and H5D is unblocked from the public-routing side.

Required report:

```text
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5C_PUBLIC_V1_ROUTE_RETIREMENT.md
```

Recorded H5C outcomes include:

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
RELEASE-CANDIDATE HARDENING NOT PERFORMED
WARDEN TRANSFORM DEFERRED
CHAIR REFERENCE CLAIM REMAINS RAW-ONLY
PHYSICAL DEVICE VALIDATION NOT CLAIMED
PUBLIC RELEASE REMAINS BLOCKED
```

H5C implemented:

- normal public baseline/baseline-retake selects unified V2 without requiring `EXPO_PUBLIC_ENABLE_UNIFIED_MOVEMENT_CHECKUP`;
- V1 Check-Up/result routes are retired from normal builds;
- V1 is retained only behind exact rollback-build flag:

```text
EXPO_PUBLIC_ENABLE_LEGACY_V1_CHECKUP_ROLLBACK=1
```

- rollback defaults off in `.env.example`;
- accepted, pending, malformed, block-origin, or report-origin V2 state never falls back to V1;
- public manual/quick V1 starts are hidden or typed unavailable;
- internal harness routes and Settings rows remain behind exact internal flag;
- H5A Progress and H5B micro-check behavior are preserved;
- audio verification passed twice with 150 required assets.

Reported H5C validation:

```text
re-entry typecheck: passed
H5C focused: 10 suites / 73 tests
focused aggregate: 30 suites / 239 tests
full Jest: 159 suites / 1305 tests
audio: passed twice, 150 required assets
app typecheck: passed
website typecheck: passed
Expo config: passed
Expo export: Android/iOS, 444 assets
git diff --check: passed
```

Re-run the current tree. Do not assume counts remain unchanged.

## Important known issue carried into H5D

The H5C report notes that local public Expo config output still showed diagnostics-related environment flags enabled in the local environment.

H5D must prove the actual beta/release build profile defaults diagnostics and internal harnesses off unless deliberately enabled.

Local developer `.env` values may be different. Do not treat local env as release truth unless the configured beta/release profile would actually inherit those values.

## Important audio-doc note

The authoritative audio model is currently:

```text
provider: elevenlabs
model: eleven_multilingual_v2
outputFormat: mp3_44100_128
voices: clara, marcus
```

The H5B.1 audio sign-off verified this configuration and all 150 required assets.

`CLAUDE.md` may still contain stale `eleven_flash_v2_5` wording.

H5D may update stale documentation/config comments to match the verified current model, but must not:

- regenerate audio;
- edit MP3s;
- change cue text;
- change voice IDs;
- change model/settings;
- edit fingerprints by hand;
- weaken audio verification.

## Founder/product decisions locked

### Public Movement Check-Up

Normal public Check-Up is unified Movement Profile V2.

No normal public V1 Check-Up, V1 result, V1 official retest, V1 manual/quick check-up, Movement Age, or weakest-domain flow may return.

### Rollback-build V1

V1 may remain only for explicit rollback builds:

```text
EXPO_PUBLIC_ENABLE_LEGACY_V1_CHECKUP_ROLLBACK=1
```

The flag defaults off.

Accepted/pending/malformed V2 state always prevents V1 fallback.

### Internal harnesses and diagnostics

Engineering harnesses may remain in code, but beta/release builds must not expose them to users.

Diagnostics must default off in beta/release builds.

Any release diagnostics must require deliberate exact opt-in and must not expose secrets, raw pose frames, images, landmarks, or health free text.

### V2 lifecycle

Preserve all verified behavior:

- H3/H3.1 public V2 baseline/onboarding;
- H4/H4.1.1 public V2 official retest, claim-neutral comparison, V2 report, completed prior block, automatic next block;
- H5A V2-canonical Progress/history/report history;
- H5B/H5B.1 Balanced/domain micro-check policy;
- H5C public V1 route retirement and rollback policy;
- local-first sync/restore/export/account-clear;
- audio verification;
- Stage 4 safety/capability/equipment/progression policies;
- Stage 5 scheduler/credit/progression lifecycle.

### Warden and claims

Warden remains deferred.

Chair remains raw-only.

Do not add:

- percentile claims;
- Movement Age;
- weakest domain;
- improvement/decline;
- percentage change;
- diagnosis/fall-risk/pass-fail;
- medical claims;
- physical validation claims.

### Release posture

H5D may decide that the software is ready for invite-only closed beta only if the software gate is green and physical-device validation is either completed with evidence or explicitly recorded as a closed-beta product-owner waiver.

Public release remains blocked unless actual physical-device validation and release evidence are present.

Do not fabricate device validation.

## Primary objectives

H5D must:

1. Reconstruct the current release/build flag surface.

2. Add or verify one beta/release flag policy that defaults all internal/diagnostic/rollback features off.

3. Prove normal public V2 remains the only public Check-Up route in beta/release builds.

4. Prove public V1 remains unavailable in normal beta/release builds.

5. Prove V1 rollback is available only with exact rollback-build flag and safe no-V2-state conditions.

6. Prove internal harnesses are hidden unless the exact internal flag is on.

7. Prove diagnostics and pose latency diagnostics are off in beta/release defaults.

8. Prove release diagnostics, if intentionally enabled, are bounded and non-secret.

9. Reconcile stale docs/config comments around audio model and release flags without changing runtime behavior.

10. Run a full route/flow/copy/privacy audit for beta.

11. Re-run final H0-H5C software regression gates.

12. Re-run audio verification at start and end.

13. Re-run Expo config/export under a beta/release-like flag environment with diagnostics/internal/rollback off.

14. Create a physical-device QA protocol and evidence template.

15. If no device evidence exists, record that device validation remains not performed.

16. Make an explicit closed-beta ship decision:
    - software-ready for invite-only closed beta pending physical-device QA;
    - or software-ready for invite-only closed beta under a documented product-owner device-validation waiver;
    - or still blocked.

17. Keep public release blocked unless release evidence is complete.

18. Produce a single H5D report.

## Required prior reading

Read in full:

- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5C_PUBLIC_V1_ROUTE_RETIREMENT.md`
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5B_1_VERIFICATION_CLOSURE_CONTINUATION.md`
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5B_1_VERIFICATION_CLOSURE.md`
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5B_BALANCED_MICRO_CHECK_POLICY.md`
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5A_V2_CANONICAL_PROGRESS_HISTORY.md`
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_1_1_POLICY_ALIGNED_CLOSURE_CONTINUATION.md`
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_OFFICIAL_RETEST_REPORT_NEXT_BLOCK.md`
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H3_1_END_TO_END_VERIFICATION.md`
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H3_BASELINE_ONBOARDING_CUTOVER.md`
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H2_V1_RESULTS_SHELL_V2_PROFILE.md`
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H1_V1_SHELL_V2_ADAPTER.md`
- `docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H0_HEALTH_GATE.md`
- `docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5H.md`
- `docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5G_1.md`
- Stage 4C/4D/4E/4F/4G reports;
- current audio/voice sign-off reports.

Also inspect:

- `AGENTS.md`;
- `CLAUDE.md`;
- `docs/decisions.md`;
- `.env.example`;
- `.env` variable names only, not secret values;
- `app.config.js`;
- `app.json`;
- `eas.json` if present;
- `package.json`;
- Expo config plugins;
- Sentry config;
- all config modules under `src/config`;
- `App.tsx`;
- public Check-Up selector;
- Settings gating;
- diagnostics config;
- pose latency diagnostics config;
- linking/deep-link config;
- H5A/H5B/H5C tests;
- audio generator/verifier/source files;
- account/data export/privacy modules;
- release/profile docs if present.

Treat current code and untracked production files as source of truth.

## Scope boundary

This task may change:

- `.env.example`;
- `AGENTS.md`, `CLAUDE.md`, and release docs/comments when stale;
- release/config helper tests;
- diagnostics/internal/rollback flag helpers;
- app config defaults if required;
- Settings/deep-link guard tests;
- copy/privacy guardrails;
- physical-device QA checklist/template under `docs/qa` or `docs/audits`;
- the H5D report.

This task may change production runtime code only to fix a proven release-hardening defect, such as:

- diagnostics defaulting on in release;
- internal harness exposed in beta;
- V1 rollback path exposed incorrectly;
- public deep-link bypass;
- unsafe diagnostics payload;
- stale audio config mismatch in source comments that affects verifier.

This task must not change:

- Movement Profile V2 protocols;
- reference engine;
- focus policy;
- block creation;
- official retest transition;
- V2 reports;
- H5A Progress behavior;
- H5B micro-check behavior;
- H5C route policy except for hardening bugs;
- training schedule/progression;
- audio cue text/assets/manifests/fingerprints;
- Warden;
- website product features;
- dependencies;
- lockfiles;
- fonts/unrelated assets.

Do not perform opportunistic refactors.

# PART A — WORKTREE SAFETY AND RE-ENTRY

## Step 1: Capture exact initial state

Before analysis or edits, run:

```bash
git status --short --untracked-files=all
git diff --name-only
git diff --stat
git ls-files --others --exclude-standard
```

Record exact output in the report.

Rules:

1. Treat all current tracked/untracked changes as user-owned.
2. Inspect diffs before touching any file.
3. Preserve concurrent App, config, audio, Progress, micro-check, render, backend, training, website, and docs work.
4. Do not revert, delete, move, or broadly reformat unrelated work.
5. Do not edit prior audit reports or `docs/decisions.md`.
6. Do not use destructive Git commands.
7. Do not install packages.
8. Do not modify lockfiles.
9. Do not regenerate audio.
10. Do not stage, commit, branch, push, or open a PR.
11. Do not inspect or expose secret `.env` values or provider credentials.
12. Do not modify or share font files.
13. If concurrent config/routing changes make release authority ambiguous, stop and mark H5D blocked.

## Step 2: Mandatory app typecheck

Run first:

```bash
npm run typecheck
```

If it fails solely in unrelated concurrent work:

- do not repair unrelated work;
- create the H5D report as blocked;
- record exact diagnostics;
- stop before H5D implementation.

## Step 3: Initial audio verification

Run immediately:

```bash
npm run verify:audio
```

Expected:

```text
safety requiredCues=44 requiredAssets=88
movementProfileV2 requiredCues=31 requiredAssets=62
total requiredAssets=150
```

If it fails:

- do not regenerate audio;
- record exact issue classes;
- mark H5D blocked for a dedicated audio gate.

## Step 4: Baseline validation

Run focused tests for:

- H5C routing;
- H5B.1 micro-check;
- H5A Progress;
- H4.1.1 official retest/report/next block;
- H3.1 public onboarding;
- Stage 5H;
- Settings/internal gating;
- diagnostics flags;
- audio tests;
- V1 rollback;
- deep-link/direct-route guards.

Then run:

```bash
npm test -- --runInBand
npm run typecheck
npm --prefix website run typecheck
npx --no-install expo config --type public
git diff --check
```

Also run:

```bash
rm -rf /tmp/pearl-unified-h5d-baseline-export
npx --no-install expo export --platform all --output-dir /tmp/pearl-unified-h5d-baseline-export
rc=$?
rm -rf /tmp/pearl-unified-h5d-baseline-export
exit $rc
```

Record counts and warnings.

# PART B — RELEASE FLAG INVENTORY AND POLICY

## Step 5: Inventory all release/config flags

Search for all `EXPO_PUBLIC_*`, diagnostics, internal, mock, rollback, release, and dev flags.

Create:

| Flag | Parser | Default | Beta/release expected | User-facing effect | H5D action |
| --- | --- | --- | --- | --- | --- |

At minimum include:

```text
EXPO_PUBLIC_ENABLE_LEGACY_V1_CHECKUP_ROLLBACK
EXPO_PUBLIC_ENABLE_UNIFIED_MOVEMENT_CHECKUP
EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_INTERNAL
EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_DIAGNOSTICS
EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS
EXPO_PUBLIC_ALLOW_DIAGNOSTICS_IN_RELEASE
EXPO_PUBLIC_ENABLE_POSE_RENDERER_BENCHMARKS
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
SENTRY org/project/url-style config names, names only
any dev mock data flags
```

Do not print secret values.

## Step 6: Define beta/release flag policy

Required beta/release defaults:

```text
legacy V1 rollback: off
internal harnesses: off
movement profile diagnostics: off
pose latency diagnostics: off
renderer benchmarks: off
release diagnostics: off unless explicit release-diagnostics build is intended
dev mock data: off
public V2 default: on by policy, not by old unified flag
```

`.env.example` must document safe defaults.

Any beta/release build profile should inherit safe defaults or explicitly set safe values.

## Step 7: Add/verify pure release-mode audit helper

If a suitable helper already exists, extend tests.

Otherwise add a pure helper, conceptually:

```ts
type BetaReleaseFlagAuditResult =
  | { status: 'safe'; diagnostics: readonly SafeDiagnostic[] }
  | { status: 'unsafe'; reasons: readonly ReleaseFlagUnsafeReason[] };
```

Inputs:

- explicit parsed flag values;
- optional build profile name;
- platform/env mode where available.

It must not read env directly in tests except through small wrapper constants.

It must detect unsafe beta/release exposure:

- rollback flag on;
- internal flag on;
- diagnostics on;
- diagnostics allowed in release;
- pose benchmarks on;
- dev mock data enabled.

Normal public V2 must not be considered unsafe.

## Step 8: Test exact parsing

For every security/release flag:

- missing false;
- empty false;
- `0` false;
- `true` false unless existing parser intentionally differs and is documented;
- exact `1` true only;
- malformed false;
- no user/backend/profile/remote authority.

Do not weaken existing exact parsers.

# PART C — EXPO / BUILD PROFILE AUDIT

## Step 9: Inspect `app.config.js`, `app.json`, and `eas.json`

Document current build profiles:

- development;
- preview;
- beta/internal distribution;
- production;
- local public config.

If `eas.json` is absent, record that fact and inspect current app config behavior.

## Step 10: Public config command with safe beta env

Run Expo config with a sanitized beta-like environment where unsafe flags are explicitly off.

Do not print secret values.

Example intent:

```bash
env \
  EXPO_PUBLIC_ENABLE_LEGACY_V1_CHECKUP_ROLLBACK=0 \
  EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_INTERNAL=0 \
  EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_DIAGNOSTICS=0 \
  EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS=0 \
  EXPO_PUBLIC_ALLOW_DIAGNOSTICS_IN_RELEASE=0 \
  npx --no-install expo config --type public
```

Use exact current flag names.

Record:

- whether config passes;
- whether public config exposes internal/diagnostic flags as safe values;
- Sentry warnings;
- no secret values.

## Step 11: Export with safe beta env

Run Android/iOS export under the same safe beta-like environment:

```bash
rm -rf /tmp/pearl-unified-h5d-safe-beta-export
env <safe flags> npx --no-install expo export --platform all --output-dir /tmp/pearl-unified-h5d-safe-beta-export
rc=$?
rm -rf /tmp/pearl-unified-h5d-safe-beta-export
exit $rc
```

Record asset count and warnings.

## Step 12: Unsafe build profile test

Add tests proving that if unsafe flags are set in a beta/release-mode audit input, the pure audit helper returns unsafe reasons.

Do not block local developer builds from using internal/diagnostic flags intentionally.

# PART D — ROUTE / SETTINGS / DEEP-LINK HARDENING

## Step 13: Re-run H5C route guarantees

Verify:

- normal public baseline -> V2;
- baseline retake -> V2;
- V2 official retest due -> V2;
- V2 official retest early -> unavailable, not V1;
- normal public V1 route blocked;
- V1 rollback only with exact rollback flag and safe no-V2 state;
- accepted/pending/malformed V2 prevents V1 fallback;
- old unified flag missing/off still selects V2.

## Step 14: Settings beta exposure

Normal beta flags off:

- no internal harness rows;
- no V1 rollback row;
- no diagnostics/benchmark rows;
- no internal source/schema/fingerprint labels;
- no dev mock data toggle unless intended for non-beta dev only.

Internal flag on:

- harness rows visible only where intended;
- normal public baseline still V2.

Diagnostics flag on:

- diagnostics rows visible only where intended;
- release audit helper marks beta unsafe unless explicitly running a diagnostics build.

## Step 15: Deep-link/direct routes

Audit current linking/direct route handling.

Add/verify tests:

- direct V1 Check-Up route blocked in normal mode;
- direct V1 result route blocked in normal mode;
- direct internal harness route blocked unless internal flag;
- direct diagnostics route blocked unless diagnostics flag;
- unknown selected IDs fail safely;
- no raw V2 artifact route bypasses recovery validation.

# PART E — COPY / CLAIM / PRIVACY AUDIT

## Step 16: Public copy scan

Scan normal public code paths for:

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

Scope carefully:

- tests/audit docs may include terms;
- rollback-only files may include V1 terms if guarded;
- internal-only harness may include V2 terms if gated;
- normal public beta path must not.

Add copy guardrail tests if missing.

## Step 17: Privacy export/account audit

Verify final beta data boundaries:

- no landmarks/video/images/base64 in sync/export;
- no provider secrets;
- no source PDFs/workbooks;
- no free-text health notes in diagnostics;
- account clear removes local check-up/training/report/micro-check state;
- diagnostics payloads bounded to IDs/reason codes/policy versions.

## Step 18: Auth/backend release posture

Inspect Supabase/auth use at high level:

- app requires auth as currently intended;
- signed-out restore/sync short-circuits safely;
- user_id scoping preserved;
- backend failures do not crash core local-first flows;
- no beta release blocker due to missing backend migration.

Do not add backend schema changes unless a test proves a current release-blocking defect.

# PART F — STALE DOC / CONFIG CLEANUP

## Step 19: Audio docs

Update stale non-authoritative documentation references to the old audio model if appropriate, especially:

```text
CLAUDE.md
```

Use current truth:

```text
eleven_multilingual_v2
mp3_44100_128
Clara / Marcus
150 verified required assets
```

Do not edit prior audit reports, because those are historical.

Do not change source audio config.

## Step 20: Flag docs

Update current developer docs if they still say the old unified-release flag controls public V2 routing.

Current truth:

- public V2 is default;
- legacy V1 rollback requires exact rollback flag;
- internal harnesses use internal flag;
- diagnostics are separate.

Do not edit prior audit reports.

## Step 21: Physical-device validation docs

Create a current physical-device QA protocol and evidence template, recommended path:

```text
docs/qa/PEARL_CLOSED_BETA_PHYSICAL_DEVICE_QA_PROTOCOL.md
```

or a repository-consistent docs/audits path if `docs/qa` does not exist.

It must include:

- device matrix;
- build profile and commit/worktree identity fields;
- environment flags expected;
- camera permissions;
- onboarding V2 baseline;
- chair setup/practice/official;
- balance side selection/trials/rest/use-best;
- shoulder side selection/retry/pain-limited;
- hinge supporting capture/no-measurement;
- reference details;
- V2 results and automatic block;
- session A/B/C training;
- Balanced micro-check week 1/2/3/week 4 none;
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
- waiver section if product owner chooses closed-beta without completed device QA.

Do not fill it with fabricated pass results.

# PART G — FINAL MULTI-BLOCK SOFTWARE VERIFICATION

## Step 22: End-to-end lifecycle slice

Run/ensure tests cover:

```text
new user
-> V2 baseline
-> V2 block
-> 4-week A/B/C schedule
-> Balanced/domain micro-checks where applicable
-> official V2 retest
-> V2 report
-> next V2 block
-> Progress history/report
-> rollback/direct-route containment
```

Use existing H3.1/H4.1.1/H5A/H5B/H5C tests where possible.

Add only missing release-level integration tests.

## Step 23: Long-horizon slice

Ensure long-horizon Stage 5 simulation remains green for V2-origin blocks if current tests cover it; if not, add a narrow test that uses existing V2 block materialization to run two blocks through the H4 transition.

Do not add physical simulation or camera/device tests.

## Step 24: Failure-mode slice

Verify at least:

- raw V2 pending details;
- malformed V2 state;
- failed remote sync;
- audio playback failure fallback;
- internal flag accidentally on in beta audit input;
- rollback flag accidentally on in beta audit input;
- direct V1 route attempt;
- direct internal route attempt.

# PART H — CLOSED-BETA SHIP DECISION

## Step 25: Define decision states

The H5D report must choose exactly one:

1. `CLOSED BETA SOFTWARE READY - DEVICE QA REQUIRED BEFORE TESTFLIGHT/PLAY INTERNAL TESTING`
2. `CLOSED BETA SOFTWARE READY UNDER PRODUCT-OWNER DEVICE-QA WAIVER`
3. `CLOSED BETA STILL SOFTWARE-BLOCKED`

Choose state 1 if the software gate is green but no physical-device QA evidence/waiver exists.

Choose state 2 only if the product owner has explicitly waived physical-device QA for invite-only closed beta in the current conversation or a current repo decision, and the report records the exact waiver truth.

Choose state 3 if any software release gate fails or a P0/P1 beta defect remains.

Public release remains blocked in all cases unless actual device/release evidence says otherwise.

## Step 26: Release checklist

Create or update a release checklist in the H5D report with:

- software gate;
- audio gate;
- flag gate;
- route gate;
- privacy/export gate;
- backend/auth gate;
- physical-device QA gate;
- store/TestFlight/Play internal testing gate;
- known warnings;
- waiver truth if any.

# PART I — VALIDATION

## Step 27: Focused H5D validation

Run focused tests for:

- release flag audit helper;
- config parsers;
- H5C public selector/routing;
- Settings/internal/diagnostics gates;
- deep-link/direct route guards;
- H5A Progress;
- H5B micro-check;
- H4 official retest/report;
- H3 onboarding;
- audio tests;
- privacy/export/account clear;
- Stage 5H.

Record exact command and counts.

## Step 28: Full release gate

Run exactly:

```bash
npm run verify:audio
npm test -- --runInBand
npm run typecheck
npm --prefix website run typecheck
npx --no-install expo config --type public
git diff --check
```

Then safe-beta export:

```bash
rm -rf /tmp/pearl-unified-h5d-safe-beta-export
env \
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

Also run normal export if safe-beta env differs from normal local config:

```bash
rm -rf /tmp/pearl-unified-h5d-normal-export
npx --no-install expo export --platform all --output-dir /tmp/pearl-unified-h5d-normal-export
rc=$?
rm -rf /tmp/pearl-unified-h5d-normal-export
exit $rc
```

Record:

- H5D suites/tests;
- focused aggregate suites/tests;
- full suites/tests;
- audio:
  - safety 44 cues / 88 assets;
  - Movement Profile V2 31 cues / 62 assets;
  - total 150 assets;
- app typecheck;
- website typecheck;
- Expo public config;
- safe-beta Expo export;
- normal export if run;
- asset counts;
- `git diff --check`;
- known warnings;
- new warnings;
- whether validation changed files.

## Step 29: Final audio check

Run `npm run verify:audio` again at the end if any audio-related source/asset/manifest file changed or if docs/config update touched audio source paths.

If final audio verification fails, block H5D sign-off.

# PART J — MANUAL SOFTWARE TRACE

After automated validation, trace:

## Normal beta build

```text
safe beta flags
-> Settings contains no internal/diagnostics/rollback rows
-> onboarding baseline routes to unified V2
-> result is Movement Profile
-> plan auto-created
-> Progress shows V2
```

## Direct route attempt

```text
safe beta flags
-> crafted V1 checkup/result/internal route
-> blocked/recovered
```

## Rollback build

```text
rollback flag exact 1
+ no V2 state
-> V1 rollback can run

rollback flag exact 1
+ accepted V2 state
-> V2 remains authority
```

## Diagnostics build

```text
diagnostics flags exact on
-> beta release audit marks unsafe unless intended diagnostics build
-> no raw pose/media/secrets in diagnostics payload
```

## Device QA protocol

```text
QA protocol exists
-> no fabricated pass/fail evidence
-> public release remains blocked
```

# PART K — REPORT

Create exactly one new report:

```text
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5D_RELEASE_CANDIDATE_HARDENING.md
```

Do not edit prior reports.

Required sections:

1. Scope.
2. H5C prerequisite evidence.
3. Founder/product decisions carried forward.
4. Initial Git status.
5. Re-entry typecheck.
6. Initial audio verification.
7. Baseline validation.
8. Release flag inventory.
9. Beta/release flag policy.
10. Release-mode audit helper.
11. Exact parser behavior.
12. Expo/app config audit.
13. Safe-beta public config result.
14. Safe-beta export result.
15. H5C route guarantees.
16. Settings/internal harness containment.
17. Deep-link/direct-route safety.
18. Public copy/claim guardrails.
19. Privacy/export/account audit.
20. Auth/backend release posture.
21. Stale doc/config cleanup.
22. Audio doc/model reconciliation.
23. Physical-device QA protocol.
24. Final multi-block software verification.
25. Failure-mode verification.
26. Release checklist.
27. Closed-beta ship decision.
28. Product containment.
29. Files changed.
30. Tests added/changed.
31. Exact focused validation.
32. Exact full validation.
33. Audio verification.
34. App/website typechecks.
35. Expo config/export.
36. H0-H5D/Stage 3D-B/Stage 4/Stage 5/Step-Up/audio regression.
37. Remaining physical-device/store/public-release work.
38. Initial/final Git status.
39. Complete files-changed inventory.
40. Concurrent external changes.
41. Confirmation that no package install, lockfile change, audio regeneration, staging, commit, branch, push, Warden work, or fabricated physical-device validation occurred.

# REQUIRED INVARIANTS

After H5D:

1. Public V2 remains the normal default Check-Up.
2. Public V1 remains retired from normal builds.
3. V1 rollback flag defaults off.
4. V1 rollback requires exact rollback flag and safe no-V2 state.
5. Accepted/pending/malformed V2 never falls back to V1.
6. Internal harness flag defaults off for beta/release.
7. Diagnostics flags default off for beta/release.
8. Pose latency diagnostics/benchmarks default off for beta/release.
9. Dev mock data is off for beta/release.
10. Beta/release flag audit detects unsafe exposure.
11. Safe-beta Expo config/export pass.
12. Settings exposes no internal rows in safe beta mode.
13. Direct V1/internal routes are guarded.
14. Public copy contains no Movement Age/weakest/V1/V2/internal labels in normal flows.
15. H5A Progress remains V2-canonical.
16. H5B micro-check policy remains unchanged.
17. H4 official retest/report/next-block remains unchanged.
18. H3 onboarding remains unified V2.
19. Audio remains 150 verified assets.
20. Runtime audio remains bundled/local.
21. Stale current docs around audio/flags are corrected where appropriate.
22. No old audio model is treated as current config.
23. Privacy/export/account clear remain bounded.
24. Physical-device QA protocol exists.
25. Device validation is not fabricated.
26. Public release remains blocked.
27. Full repository gate passes.
28. No H5D scope creep occurs.

# ACCEPTANCE CRITERIA

Do not mark H5D complete unless:

1. Safe beta flag policy is explicit and tested.
2. Safe beta config/export passes.
3. Internal/diagnostics/rollback exposure is blocked by default.
4. H5C route retirement remains green.
5. Direct route/deep-link guards pass.
6. Public copy/claim/privacy guardrails pass.
7. Audio verification passes.
8. App typecheck passes.
9. Website typecheck passes.
10. Full Jest passes.
11. Expo config/export passes.
12. `git diff --check` passes.
13. Physical-device QA protocol is created.
14. Closed-beta ship decision is truthful.
15. Public release remains blocked unless actual public-release evidence exists.
16. No package/lockfile/audio generation occurs.
17. No staging/commit/branch/push occurs.

Do not mark H5D complete if:

- beta flags can expose internal harnesses or diagnostics by default;
- old unified flag can route public users to V1;
- rollback flag can be enabled by user/backend/profile;
- direct V1 route bypass exists;
- audio verification fails;
- docs/source disagree about current audio model in non-historical current docs;
- physical-device validation is claimed without evidence;
- H5A/H5B/H5C regress;
- Warden work is added.

# STAGE DECISIONS

At the end of the report state exactly one:

```text
UNIFIED MOVEMENT CHECK-UP STAGE H5D COMPLETE
UNIFIED MOVEMENT CHECK-UP STAGE H5D BLOCKED
```

Also state exactly one:

```text
BETA BUILD FLAG LOCKDOWN VERIFIED
BETA BUILD FLAG LOCKDOWN BLOCKED
```

Also state exactly one:

```text
INTERNAL / DIAGNOSTIC HARNESS EXPOSURE BLOCKED BY DEFAULT
INTERNAL / DIAGNOSTIC HARNESS EXPOSURE BLOCKED STATUS FAILED
```

Also state exactly one:

```text
PUBLIC V2 ROUTING RELEASE-CANDIDATE VERIFIED
PUBLIC V2 ROUTING RELEASE-CANDIDATE BLOCKED
```

Also state exactly one:

```text
AUDIO ASSET FINGERPRINT GATE PASSED
AUDIO ASSET FINGERPRINT GATE BLOCKED
```

Also state exactly one:

```text
PHYSICAL DEVICE QA PROTOCOL CREATED
PHYSICAL DEVICE QA PROTOCOL BLOCKED
```

Also state exactly one of:

```text
CLOSED BETA SOFTWARE READY - DEVICE QA REQUIRED BEFORE TESTFLIGHT / PLAY INTERNAL TESTING
CLOSED BETA SOFTWARE READY UNDER PRODUCT-OWNER DEVICE-QA WAIVER
CLOSED BETA STILL SOFTWARE-BLOCKED
```

Also state:

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

# NEXT STEP AFTER H5D

If H5D completes with:

```text
CLOSED BETA SOFTWARE READY - DEVICE QA REQUIRED BEFORE TESTFLIGHT / PLAY INTERNAL TESTING
```

then the next task is physical-device QA execution, not more code.

If H5D completes under a product-owner device-QA waiver, the next task is store/TestFlight/Play internal testing preparation with waiver truth preserved.

If H5D is software-blocked, fix the named blocker before beta.

# FINAL CODEX RESPONSE

Return a concise summary containing:

- Report path.
- Whether production runtime code changed.
- Re-entry typecheck.
- Initial/final audio verification.
- Release flag inventory.
- Beta/release flag policy.
- Release-mode audit helper.
- Safe-beta public config/export result.
- H5C routing preservation.
- Settings/internal harness result.
- Diagnostics/pose benchmark result.
- Deep-link/direct route result.
- Copy/claim guardrail result.
- Privacy/export/account result.
- Auth/backend release posture.
- Stale docs/config cleanup.
- Physical-device QA protocol path.
- Final multi-block software verification.
- Failure-mode verification.
- Closed-beta ship decision.
- Files changed.
- Tests added/changed.
- Focused validation.
- Full Jest.
- Audio verification.
- App typecheck.
- Website typecheck.
- Expo config/export.
- `git diff --check`.
- Confirmation that H0-H5D, H4.1.1, Stage 3D-B, Stage 4, Stage 5, Step-Up resume, navigation, TypeScript boundaries, safety audio, and V2 audio remain green.
- `UNIFIED MOVEMENT CHECK-UP STAGE H5D COMPLETE` or blocked.
- Flag-lockdown verdict.
- Internal/diagnostics exposure verdict.
- Public V2 routing verdict.
- Audio gate verdict.
- Physical-device QA protocol verdict.
- Closed-beta decision.
- `WARDEN TRANSFORM DEFERRED`.
- `PHYSICAL DEVICE VALIDATION NOT CLAIMED UNLESS EVIDENCE EXISTS`.
- `PUBLIC RELEASE REMAINS BLOCKED`.
- Initial/final Git status.
- Complete files-changed inventory.
- Concurrent external changes.
- Confirmation that no package install, lockfile change, audio regeneration, staging, commit, branch, push, Warden work, or fabricated physical-device validation occurred.
