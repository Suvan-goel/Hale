You are implementing the third substage of Hale’s final unified Movement Check-Up migration:

HALE UNIFIED MOVEMENT CHECK-UP — STAGE H5C
PUBLIC V1 CHECK-UP / RESULTS ROUTE RETIREMENT,
UNIFIED V2 DEFAULT ENABLEMENT,
INTERNAL-HARNESS CONTAINMENT,
AND EXPLICIT ROLLBACK-BUILD POLICY

This is a focused public-routing and release-policy stage.

Do not implement H5D in this task.

## H5B.1 prerequisite and current baseline

Stage H5B.1 is verified and H5C is unblocked.

Required sign-off report:

```text
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5B_1_VERIFICATION_CLOSURE_CONTINUATION.md
```

Recorded sign-off decisions include:

```text
UNIFIED MOVEMENT CHECK-UP STAGE H5B.1 VERIFIED
AUDIO ASSET FINGERPRINT GATE PASSED
REGENERATED SAFETY AND MOVEMENT PROFILE V2 AUDIO VERIFIED
MICRO-CHECK FIRST-ACCEPTED-WINS CONFLICT POLICY VERIFIED
BALANCED SCHEDULE-WEEK MICRO-CHECK MATRIX VERIFIED
DOMAIN MICRO-CHECK NON-REGRESSION VERIFIED
MICRO-CHECK SCHEDULER / SLOT IDENTITY VERIFIED
MICRO-CHECK CREDIT / PROGRESSION CONTAINMENT VERIFIED
MICRO-CHECK / OFFICIAL MOVEMENT PROFILE CONTAINMENT VERIFIED
MICRO-CHECK PERSISTENCE / SYNC / RESTORE / EXPORT VERIFIED
MICRO-CHECK REPORT COUNT / READ-ONLY BEHAVIOR VERIFIED
TODAY / HOME / PLAN / PROGRESS / MANUAL-OPTION MICRO-CHECK CONSISTENCY VERIFIED
V1 MICRO-CHECK ROLLBACK VERIFIED
UNIFIED MOVEMENT CHECK-UP STAGE H5C UNBLOCKED
```

The H5B.1 continuation independently verified:

- regenerated audio integrity with the current `eleven_multilingual_v2` configuration;
- initial and final `npm run verify:audio`;
- stable audio checksum/drift inventory;
- 44 safety cues / 88 safety assets;
- 31 Movement Profile V2 cues / 62 Movement Profile V2 assets;
- total 150 required assets;
- H5B.1 focused slice;
- H5B/H5A/H4 aggregate;
- full Jest;
- app and website typechecks;
- Expo config and Android/iOS export;
- `git diff --check`.

Reported validation counts:

```text
audio: 150 required assets
H5B.1 focused slice: 3 suites / 24 tests
H5B/H5A/H4 aggregate: 21 suites / 247 tests
full Jest: 158 suites / 1301 tests
Expo export: 444 assets
```

Re-run the current tree. Do not assume counts remain unchanged.

## Important audio note

The current authoritative audio model is:

```text
provider: elevenlabs
model: eleven_multilingual_v2
outputFormat: mp3_44100_128
voices: clara, marcus
```

`AGENTS.md`, `docs/decisions.md`, source, tests, and the H5B.1 continuation report align on this model.

`CLAUDE.md` may still contain stale `eleven_flash_v2_5` wording. Treat source, tests, decisions, and the latest audio sign-off report as authoritative. Do not edit audio configuration in H5C.

This task must not regenerate audio or touch MP3s/manifests unless a validation command proves a new audio defect and the task is explicitly stopped for a dedicated audio gate.

## Why H5C exists

H5A made V2 canonical in Progress and history.

H5B/H5B.1 implemented and verified Balanced/domain micro-check policy and containment.

The final public product should no longer keep two normal public Check-Up systems.

H5C must retire the public V1 Check-Up/results path from normal user flows and make the unified V2 path the only normal public Movement Check-Up and result path.

V1 code may remain temporarily as an explicit rollback-build implementation, but not as a normal public route, Settings option, deep-link target, or fallback after malformed V2 state.

## Founder/product decisions locked

### One canonical public Check-Up

Normal public Check-Up flow is:

```text
camera explanation/setup
-> polished H1 unified Check-Up shell
-> V2 live protocols
-> raw V2 Check-Up
-> reference details
-> frozen V2 snapshot + assessment
-> automatic V2 block / official transition as applicable
-> polished H2 result / H4 report / H5A Progress
```

### Public V1 retired from normal route

Normal beta-facing users must not launch:

- V1 `CheckUpScreen`;
- V1 `ResultsScreen`;
- V1 `OnboardingResultsScreen`;
- V1 Movement Age Check-Up flow;
- V1 official retest;
- V1 report/next-block transition;
- legacy quick/manual V1 Check-Up routes.

### Rollback-build policy

V1 may remain available only behind one explicit rollback-build flag.

Add or reuse a single exact build-time flag with repository-consistent naming, recommended:

```text
EXPO_PUBLIC_ENABLE_LEGACY_V1_CHECKUP_ROLLBACK=1
```

Required semantics:

- missing -> false;
- empty -> false;
- `0` -> false;
- `true` -> false;
- malformed -> false;
- exact `1` -> true;
- default in `.env.example` -> `0`;
- no user setting;
- no backend value;
- no profile value;
- no restore value;
- no remote JSON authority;
- no `__DEV__` implicit enablement;
- no public deep-link bypass.

The old unified-release flag:

```text
EXPO_PUBLIC_ENABLE_UNIFIED_MOVEMENT_CHECKUP
```

must no longer be required to select unified V2 in normal public builds.

You may keep parsing it for backward-compatible diagnostics if currently useful, but missing/malformed/off values for that old flag must not route a normal public user to V1.

### Rollback constraints

If the rollback-build flag is exact `1`, the V1 rollback path may be allowed only as an explicit build-mode path and only where it is safe:

- true V1 rollback with no accepted V2 state may use existing V1 baseline/result/report flow;
- accepted V2 state always keeps V2 authority;
- V2-origin active/completed blocks never launch V1;
- malformed/conflicting V2 state fails closed to V2 recovery, not V1;
- rollback mode must be visible in diagnostics/reporting, not as ordinary product behavior.

Do not add user-facing “legacy” sections or mixed V1/V2 history.

### No V1-user migration

No real user completed a V1 Check-Up.

Do not add:

- V1-to-V2 conversion;
- mixed V1/V2 charts;
- public “legacy result” UI;
- permanent dual public history;
- migration of old V1 blocks into V2.

### Preserve V2 lifecycle

H5C must preserve:

- H3/H3.1 public V2 baseline and onboarding;
- H4/H4.1.1 public V2 official retest, report, prior-block completion, next-block creation;
- H5A V2-canonical Progress;
- H5B/H5B.1 Balanced/domain micro-check policy;
- local-first/sync/restore/export/account-clear behavior;
- first-accepted-wins micro-check slot store behavior.

### Internal harness containment

Existing H1/H2/V2 internal comparison harnesses may remain in code, but must be hidden from beta-facing users unless the exact internal/developer flag is enabled.

The public V2 default path must not require Settings developer rows.

H5C should leave internal harness code available for engineering comparison, but:

- no public Settings row;
- no public deep link;
- no beta-facing label like “V2” or “unified shell”;
- no route bypass of public guards.

### Claim policy

Do not add:

- Movement Age;
- body age;
- weakest domain;
- improved/declined;
- better/worse;
- stronger/steadier/more mobile;
- younger/older;
- meaningful change;
- percentile changes;
- trend arrows;
- fall-risk/diagnosis/pass/fail.

### Warden and chair

Warden transform remains deferred.

Chair remains raw-only.

### Audio

Audio remains bundled and verified.

Do not regenerate audio.

### Release posture

Physical-device validation is not claimed.

H5C may unblock H5D, but public release remains blocked.

## Primary objectives

H5C must:

1. Add one explicit legacy V1 rollback-build flag.
2. Make unified V2 the default and only normal public Check-Up/result engine.
3. Remove dependence on `EXPO_PUBLIC_ENABLE_UNIFIED_MOVEMENT_CHECKUP` for normal public V2 routing.
4. Retire public V1 baseline/onboarding route selection.
5. Retire public V1 official-retest route selection for normal users.
6. Retire public V1 result/onboarding-result display routes for normal users.
7. Retire public V1 manual/quick Check-Up starts, or make them typed unavailable if they cannot be represented by V2.
8. Preserve a tested rollback-build V1 path behind the exact rollback flag.
9. Ensure accepted V2 state always wins over rollback/V1.
10. Fail closed on malformed/conflicting V2 state instead of falling back to V1.
11. Hide internal V2 harness Settings rows from beta builds unless the exact internal flag is on.
12. Keep H5A Progress V2 canonical.
13. Keep H5B micro-check policy unchanged.
14. Keep H4 official retest/report/next-block unchanged.
15. Keep H2/H5A/H4 read-only result/report navigation unchanged.
16. Add route/deep-link guards for stale V1 and internal paths.
17. Remove or quarantine public copy that says V1/legacy/Movement Age in normal paths.
18. Preserve all prior release gates and audio sign-off.

## Required prior reading

Read in full:

- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5B_1_VERIFICATION_CLOSURE_CONTINUATION.md`
- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5B_1_VERIFICATION_CLOSURE.md`
- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5B_BALANCED_MICRO_CHECK_POLICY.md`
- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5A_V2_CANONICAL_PROGRESS_HISTORY.md`
- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_1_1_POLICY_ALIGNED_CLOSURE_CONTINUATION.md`
- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_OFFICIAL_RETEST_REPORT_NEXT_BLOCK.md`
- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H3_1_END_TO_END_VERIFICATION.md`
- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H3_BASELINE_ONBOARDING_CUTOVER.md`
- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H2_V1_RESULTS_SHELL_V2_PROFILE.md`
- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H1_V1_SHELL_V2_ADAPTER.md`
- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H0_HEALTH_GATE.md`
- `docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5G_1.md`
- `docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5H.md`

Also inspect:

- `AGENTS.md`;
- `CLAUDE.md`;
- `docs/decisions.md`;
- `.env.example`;
- current `App.tsx`;
- public engine selector;
- release/internal flag modules;
- Check-Up/onboarding route state;
- V1 `CheckUpScreen`, `ResultsScreen`, `OnboardingResultsScreen`;
- H1 unified V2 check-up screen;
- H2 unified V2 results screen;
- H4 V2 report screen;
- H5A Progress authority/view model;
- H5B micro-check policy;
- Settings developer rows;
- linking/deep-link config;
- manual Check-Up options;
- Today/Home/Plan/Progress actions;
- V1 rollback tests;
- current audio verification modules;
- current H5B.1 tests.

Treat current code, including untracked production files, as source of truth.

## Scope boundary

This task may change:

- `.env.example`;
- a new legacy V1 rollback config helper;
- public Check-Up engine selector;
- App routing/route guards;
- onboarding route integration;
- manual Check-Up options;
- Settings internal harness visibility;
- public copy guards;
- tests;
- the H5C report.

This task may reuse but must not change semantics of:

- V2 live coordinator;
- V2 reference engine;
- V2 snapshot/assessment/focus policy;
- V2 block materializer;
- V2 official-retest transition;
- V2 block report;
- H5A Progress view model;
- H5B micro-check policy;
- Stage 5 scheduler;
- training progression/equipment/safety policy;
- audio runtime.

This task must not change:

- measurement protocols;
- reference tables;
- Warden status;
- focus policy;
- block/report creation;
- official retest lifecycle;
- micro-check rotation;
- Progress design/migration beyond routing containment;
- audio text/assets/manifests;
- native pose/camera;
- website;
- dependencies;
- lockfiles;
- fonts/unrelated assets.

Do not perform opportunistic refactors.

# PART A — WORKTREE SAFETY AND RE-ENTRY GATES

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
3. Preserve concurrent App, Progress, micro-check, audio, render, backend, training, website, and docs work.
4. Do not revert, delete, move, or broadly reformat unrelated work.
5. Do not edit prior reports or `docs/decisions.md`.
6. Do not use destructive Git commands.
7. Do not install packages.
8. Do not modify lockfiles.
9. Do not regenerate audio.
10. Do not stage, commit, branch, push, or open a PR.
11. Do not inspect or expose `.env` values or provider credentials.
12. Do not modify or share font files.
13. If concurrent routing work makes safe integration ambiguous, stop and mark H5C blocked.

## Step 2: Mandatory app typecheck

Run first:

```bash
npm run typecheck
```

If it fails solely in unrelated concurrent work:

- do not repair unrelated work;
- create the H5C report as blocked;
- stop before implementation.

## Step 3: Baseline validation

Run focused tests covering:

- H5B.1 continuation;
- H5B micro-check policy;
- H5A Progress/history;
- H4.1.1 official retest/report/next block;
- H3.1 public baseline/onboarding;
- public Check-Up engine selector;
- App routing;
- onboarding;
- manual Check-Up options;
- Settings internal gate;
- V1 rollback;
- audio.

Then run:

```bash
npm run verify:audio
npm test -- --runInBand
npm run typecheck
npm --prefix website run typecheck
npx --no-install expo config --type public
git diff --check
```

Also run:

```bash
rm -rf /tmp/hale-unified-h5c-baseline-export
npx --no-install expo export --platform all --output-dir /tmp/hale-unified-h5c-baseline-export
rc=$?
rm -rf /tmp/hale-unified-h5c-baseline-export
exit $rc
```

Record exact counts and warnings.

# PART B — RECONSTRUCT CURRENT PUBLIC ROUTING

## Step 4: Audit all public Check-Up entry points

Trace:

- onboarding baseline;
- standard baseline;
- baseline retake;
- official retest from Today;
- official retest from Plan;
- official retest from Progress;
- Home/next-best-action;
- manual Check-Up start;
- quick/manual/extra routes;
- camera setup route;
- Settings/internal rows;
- direct App actions;
- any linking/deep-link routes.

Create:

| Entry point | Current public behavior | Current V1 reachability | H5C required behavior |
| --- | --- | --- | --- |

## Step 5: Audit current result routes

Trace every route/render branch for:

- V1 `ResultsScreen`;
- V1 `OnboardingResultsScreen`;
- H2 V2 unified results;
- H2 V2 read-only profile detail;
- H4 V2 block report;
- standalone internal V2 result harness;
- V1 block report;
- V1 Progress history.

Create:

| Route/screen | Normal public? | Rollback only? | Internal only? | H5C action |
| --- | --- | --- | --- | --- |

## Step 6: Audit current flags

Inventory:

```text
EXPO_PUBLIC_ENABLE_UNIFIED_MOVEMENT_CHECKUP
EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_INTERNAL
EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_DIAGNOSTICS
EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS
any dev/mock/internal settings flags
```

Document:

- parser;
- default;
- effect;
- whether user/backend can influence it;
- public exposure.

# PART C — EXPLICIT ROLLBACK-BUILD CONFIG

## Step 7: Add one rollback flag helper

Recommended path:

```text
src/config/legacyV1CheckUpRollback.ts
```

Expose:

```ts
LEGACY_V1_CHECKUP_ROLLBACK_ENABLED
parseLegacyV1CheckUpRollbackFlag(...)
```

Requirements:

- exact `1` true;
- missing/empty/0/true/malformed false;
- default false;
- no side effects;
- no logging values;
- no backend/profile/user authority;
- unit tests.

Update `.env.example`:

```text
EXPO_PUBLIC_ENABLE_LEGACY_V1_CHECKUP_ROLLBACK=0
```

Do not remove old flags unless safe and tested.

## Step 8: Unified V2 default policy

Normal public V2 routing must not require `EXPO_PUBLIC_ENABLE_UNIFIED_MOVEMENT_CHECKUP`.

Either:

- remove that flag from public selection authority; or
- force normal public selection to treat unified V2 as enabled regardless of that old flag; and keep the old flag only for compatibility/diagnostics.

Required test:

```text
EXPO_PUBLIC_ENABLE_UNIFIED_MOVEMENT_CHECKUP missing/off
+ rollback flag off
-> public baseline selects unified V2
```

## Step 9: Rollback precedence

Required selector precedence:

1. Any accepted V2 state -> V2.
2. Any V2-origin block/report/pending continuation -> V2.
3. Any malformed/conflicting V2 state -> V2 recovery/unavailable, not V1.
4. Normal public source -> V2.
5. Exact rollback flag on + safe true V1 rollback context + no V2 state -> V1 rollback.
6. Otherwise fail closed.

# PART D — PUBLIC ENGINE SELECTOR

## Step 10: Update the pure selector

Update the existing public Check-Up selector rather than adding a second authority.

Inputs should include:

- source type;
- entry context;
- legacy rollback flag;
- accepted V2 state summary;
- V2 block/report/pending/malformed state summary;
- current active block origin;
- scheduler status for official retest;
- internal flag only where internal route decisions need it.

Do not read ambient stores inside the selector.

## Step 11: Baseline and baseline retake

Normal public behavior:

```text
baseline -> unified_movement_profile
baseline_retake -> unified_movement_profile
```

No old unified release flag required.

Rollback behavior only with exact rollback flag and no V2 state:

```text
baseline -> legacy_v1_rollback
baseline_retake -> legacy_v1_rollback
```

## Step 12: Official retest

Normal public behavior:

- V2-origin block + scheduler `retest_due` -> unified V2 official retest.
- V2-origin not due -> typed unavailable/recovery.
- V2-origin release flag old/off does not route to V1.

Rollback behavior only:

- true V1-origin rollback block + exact rollback flag -> current V1 official retest may remain.
- no rollback flag -> V1 official retest unavailable/retired.

## Step 13: Manual/quick/extra Check-Up starts

Audit current use.

H5C policy:

- no public V1 manual/quick Check-Up path;
- if a manual source is not supported by unified V2, return typed unavailable or hide the option;
- micro-checks remain separate and unchanged;
- Explore/manual training practice remains unrelated to Check-Up route retirement.

Do not route manual/quick to V1 merely because V2 lacks the exact old mode.

## Step 14: Unknown/stale source

Fail closed.

Never silently use V1.

# PART E — APP ROUTING AND SCREEN MOUNTING

## Step 15: Public baseline routing

Normal onboarding/camera setup must eventually mount:

```text
MovementProfileV2UnifiedCheckUpScreen
```

through the H1 shell.

It must not mount:

```text
CheckUpScreen
```

unless the explicit rollback-build path is active and safe.

## Step 16: Public result routing

Normal public completed baseline/onboarding must mount:

```text
MovementProfileV2UnifiedResultsScreen
```

or its H5A read-only/detail path as appropriate.

It must not mount:

- V1 `ResultsScreen`;
- V1 `OnboardingResultsScreen`.

## Step 17: V1 route quarantine

If V1 routes remain in `App.tsx`, they must be guarded:

```text
legacy rollback flag exact 1
+ safe V1 rollback context
+ no accepted/malformed/pending V2 authority
```

Otherwise:

- redirect to V2 route/recovery; or
- show typed unavailable; or
- return to Today/Progress.

No stale App state should let a normal user hit V1.

## Step 18: Existing V2 continuation

Existing pending raw/reference/materialisation continuation must remain available even if any old release flag is off.

Do not restart baseline or fall to V1.

## Step 19: Accepted V2 data with rollback flag

Even with rollback flag exact `1`:

- accepted V2 state selects V2 Progress/history/results;
- V2 block uses V2 training/retest lifecycle;
- no V1 conversion.

# PART F — ONBOARDING

## Step 20: New-user onboarding

Normal new-user onboarding must use V2:

```text
welcome/safety/equipment/camera setup
-> unified V2 baseline
-> reference details
-> frozen Movement Profile
-> automatic block
-> H2 onboarding results
-> block intro
```

No V1 result screen.

## Step 21: Onboarding restore/resume

Test:

- raw V2 saved, details pending;
- snapshot exists, assessment pending;
- block ready, results pending;
- CTA tapped, app closed;
- remote restore.

All continue V2.

No V1 fallback.

## Step 22: Rollback onboarding

Only exact rollback flag + no V2 state may use current V1 onboarding baseline.

Document this is a build rollback path, not normal product behavior.

# PART G — SETTINGS AND INTERNAL HARNESSES

## Step 23: Beta-facing Settings

Normal build:

- no V1 Check-Up route/debug row;
- no Movement Profile V2 internal harness row;
- no unified shell comparison row;
- no diagnostics rows unless separate diagnostics gate is explicitly on;
- no internal schema/fingerprint labels.

## Step 24: Internal build

Exact internal flag may still expose:

- standalone V2 Check-Up harness;
- H1 unified shell comparison;
- H2 result comparison;
- diagnostics export if diagnostics flag is also enabled.

Internal flag must not affect normal public selection, which is already V2.

## Step 25: V1 rollback visibility

Rollback flag must not add a casual user-facing Settings row.

If any indication is required, it should be developer/build diagnostics only, not a product option.

# PART H — DEEP-LINK / DIRECT-ROUTE SAFETY

## Step 26: Audit linking config

Search any public linking/deep-link configuration and direct route handlers.

Do not add public links to V1 or internal harnesses.

## Step 27: Crafted V1 route attempts

A crafted direct route to V1 checkup/result must fail unless rollback conditions are met.

## Step 28: Crafted internal route attempts

A crafted internal V2 harness route must fail unless internal flag is exact enabled.

## Step 29: Crafted stale result route

A stale V1 result route must not show Movement Age in normal mode.

# PART I — COPY AND CLAIM GUARDRAILS

## Step 30: Public copy cleanup

Search normal public copy for:

```text
Movement Age
body age
weakest
legacy
V1
V2
internal
unified shell
beta protocol
schema
fingerprint
```

Scope carefully:

- V1 rollback files may keep V1 copy if behind rollback.
- audit docs/tests may include these terms.
- normal public screens must not show them.

## Step 31: Result copy

Normal public results must be Movement Profile language:

```text
Movement Profile
Suggested focus
View my 4-week plan
View my block report
View my next 4-week plan
```

No plan-building CTA.

## Step 32: Recovery copy

If V1 route is retired/unavailable:

- calm copy;
- no blame;
- no internal flag terms;
- no “legacy route disabled” in user-facing UI.

# PART J — DATA / HISTORY / PROGRESS

## Step 33: H5A authority preservation

Accepted V2 state always selects V2 Progress, regardless of old release flag or rollback flag.

## Step 34: No V1 legacy UI

No public mixed V1/V2 history.

No public legacy Movement Age card.

## Step 35: Existing V1 local data

Because no real V1 users exist, do not add migration UI.

If a developer fixture has V1-only state in normal mode, it may show typed unavailable/empty V2 state or require rollback build.

## Step 36: Export/restore

Do not delete V1 parsers.

Restore must remain able to parse old data, but public normal routes must not start V1.

# PART K — MICRO-CHECK CONTAINMENT

## Step 37: Preserve H5B

H5C must not change:

- Balanced rotation;
- domain micro-check behavior;
- slot identity;
- first-accepted-wins store;
- credit/progression containment;
- official-profile containment;
- report micro-check count.

## Step 38: Accepted V2 block + rollback flag off/on

Micro-check policy continues under V2 block authority.

No V1 micro-check fallback.

## Step 39: True V1 rollback block

If exact rollback flag is on and true V1 block exists with no V2 state, current V1 micro-check behavior remains.

# PART L — TEST MATRIX

## A. Rollback flag parser

- missing false;
- empty false;
- 0 false;
- true false;
- 1 true;
- malformed false;
- no user/backend/profile authority;
- `.env.example` default false.

## B. Public selector

- baseline normal -> V2;
- baseline retake normal -> V2;
- official retest V2 due -> V2;
- official retest V2 early -> unavailable, not V1;
- old unified flag off/missing -> still V2;
- rollback flag off -> no V1;
- rollback flag on + no V2 + safe V1 baseline -> V1 rollback;
- rollback flag on + accepted V2 -> V2;
- malformed V2 -> V2 recovery, not V1;
- unknown source -> unavailable.

## C. Onboarding

- normal new user -> V2 route;
- normal onboarding never mounts V1 CheckUpScreen;
- normal results never mount V1 OnboardingResultsScreen;
- V2 pending/resume remains V2;
- rollback build V1 path still works when safe.

## D. Standard baseline/retest

- normal standard baseline -> V2;
- baseline retake -> V2;
- V2 official retest due -> V2;
- direct beginCheckUp official retest for V2 -> V2 or unavailable;
- no V1 official retest for V2-origin block.

## E. Manual/quick

- no public V1 manual/quick path;
- unsupported sources hidden or typed unavailable;
- micro-check unaffected.

## F. App route guards

- direct V1 checkup route blocked in normal mode;
- direct V1 result route blocked in normal mode;
- direct V1 onboarding result blocked in normal mode;
- internal harness blocked unless internal flag;
- stale selected IDs fail safely;
- no deep-link bypass.

## G. Settings/internal

- normal Settings hides developer rows;
- internal flag shows harness rows;
- release/rollback flags do not expose internal harnesses;
- diagnostics gate independent.

## H. Progress/history

- accepted V2 + old unified flag off -> V2 Progress;
- accepted V2 + rollback flag on -> V2 Progress;
- no V2 + rollback off -> V2 empty/start or unavailable according to policy, not V1;
- no V2 + rollback on -> V1 rollback if safe;
- no mixed V1/V2 history.

## I. Micro-check

- H5B Balanced week 1/2/3/4 unchanged;
- first-accepted-wins unchanged;
- accepted V2 block micro-check continues if old release flag off;
- V1 micro-check rollback only behind rollback flag.

## J. Copy

- no Movement Age in normal public flow;
- no weakest-domain copy in normal public flow;
- no V1/V2/internal terms in beta-facing screens;
- no Build/Create/Generate plan CTA;
- Warden/percentile absent.

## K. Audio

- verify audio still passes;
- no asset changes;
- `eleven_multilingual_v2` fingerprints remain aligned;
- no runtime provider call.

## L. V1 rollback

- exact rollback flag + no V2 state can still execute current V1 baseline/result/official retest/report where applicable;
- rollback path is isolated;
- V1 rollback does not create V2 artifacts;
- normal V2 path does not create V1 artifacts.

## M. Product containment

- no H5D;
- no Warden;
- no micro-check policy change;
- no Progress redesign;
- no audio generation;
- no website work;
- no dependencies.

## N. Regression

- H0-H5B.1;
- Stage 3D-B;
- Stage 4;
- Stage 5G.1/H;
- Step-Up runtime;
- navigation;
- TypeScript boundaries;
- safety/V2 audio.

# PART M — VALIDATION

## Step 40: Focused H5C validation

Run focused tests for:

- rollback flag parser;
- public Check-Up selector;
- App routing;
- onboarding;
- manual Check-Up options;
- Settings/internal gates;
- deep-link/direct route guards;
- H5A Progress;
- H5B micro-check;
- H4 official retest/report;
- H3.1 lifecycle;
- V1 rollback;
- audio.

Record exact command and counts.

## Step 41: Full release gate

Run exactly:

```bash
npm run verify:audio
npm test -- --runInBand
npm run typecheck
npm --prefix website run typecheck
npx --no-install expo config --type public
git diff --check
```

Then:

```bash
rm -rf /tmp/hale-unified-h5c-export
npx --no-install expo export --platform all --output-dir /tmp/hale-unified-h5c-export
rc=$?
rm -rf /tmp/hale-unified-h5c-export
exit $rc
```

Do not install dependencies.

Record:

- H5C suites/tests;
- focused aggregate suites/tests;
- full suites/tests;
- audio:
  - safety 44 cues / 88 assets;
  - Movement Profile V2 31 cues / 62 assets;
  - total 150 assets;
- app typecheck;
- website typecheck;
- Expo config;
- Android export;
- iOS export;
- asset count;
- `git diff --check`;
- known warnings;
- new warnings;
- whether validation changed files.

## Step 42: Final audio stability

Run `npm run verify:audio` again at the end if any audio-related source/asset file was touched or changed concurrently during H5C.

If audio drifts/fails, block H5C sign-off and do not proceed to H5D.

# PART N — MANUAL SOFTWARE TRACE

After automated validation, trace:

## Normal new user

```text
normal build
-> onboarding baseline
-> unified V2 Check-Up
-> H2 V2 results
-> V2 block intro
```

## Normal existing user baseline retake

```text
baseline retake
-> unified V2
-> no V1 route
```

## Normal V2 official retest

```text
V2 block retest_due
-> unified V2 official retest
-> V2 report
-> next V2 block
```

## Normal direct V1 route attempt

```text
crafted V1 route
-> blocked/recovered
-> no Movement Age screen
```

## Rollback build

```text
rollback flag exact 1
+ no V2 state
-> V1 rollback route can run
```

```text
rollback flag exact 1
+ accepted V2 state
-> V2 remains authority
```

## Internal harness

```text
internal flag off
-> no Settings developer rows

internal flag on
-> harness rows visible
-> normal public baseline still V2
```

# PART O — REPORT

Create exactly one new report:

```text
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5C_PUBLIC_V1_ROUTE_RETIREMENT.md
```

Do not edit prior reports or `docs/decisions.md`.

Required sections:

1. Scope.
2. H5B.1 prerequisite evidence.
3. Founder/product decisions carried forward.
4. Initial Git status.
5. Re-entry/baseline validation.
6. Current public routing inventory.
7. Current result-route inventory.
8. Current flag inventory.
9. Legacy rollback-build flag.
10. Unified V2 default policy.
11. Public selector precedence.
12. Baseline/baseline-retake behavior.
13. Official-retest behavior.
14. Manual/quick Check-Up behavior.
15. App route guarding.
16. Public onboarding behavior.
17. Pending/resume behavior.
18. Rollback-build behavior.
19. Settings/internal harness containment.
20. Deep-link/direct-route safety.
21. Public copy guardrails.
22. H5A Progress/history preservation.
23. H5B micro-check preservation.
24. V1 rollback isolation.
25. Audio preservation.
26. Product containment.
27. Files changed.
28. Tests added/changed.
29. Exact focused validation.
30. Exact full validation.
31. Audio verification.
32. App/website typechecks.
33. Expo config/export.
34. H0-H5B.1/Stage 3D-B/Stage 4/Stage 5/Step-Up/audio regression.
35. Remaining H5D/device work.
36. Whether H5D is unblocked.
37. Initial/final Git status.
38. Complete files-changed inventory.
39. Concurrent external changes.
40. Confirmation that no package install, lockfile change, audio regeneration, staging, commit, branch, push, H5D work, Warden work, or physical-device validation claim occurred.

# REQUIRED INVARIANTS

After H5C:

1. Normal public baseline selects unified V2.
2. Normal public baseline retake selects unified V2.
3. Normal public V2 official retest selects unified V2 when due.
4. Old unified release flag is not required for public V2 default.
5. Public V1 baseline is retired from normal builds.
6. Public V1 results are retired from normal builds.
7. Public V1 official retest is retired from normal V2 blocks.
8. Public V1 manual/quick Check-Up paths are retired or typed unavailable.
9. V1 route can run only behind explicit rollback-build flag and safe context.
10. Rollback flag defaults off.
11. Accepted V2 state always overrides rollback/V1.
12. Malformed V2 state fails closed rather than falling back to V1.
13. Existing V2 pending continuations stay V2.
14. Internal harnesses are hidden in beta builds.
15. Internal harnesses remain available behind internal flag.
16. No public deep-link bypass.
17. No Movement Age copy in normal public flow.
18. No weakest-domain copy in normal public flow.
19. No user-facing V1/V2/internal labels in normal flow.
20. H5A V2 Progress remains canonical.
21. H5B micro-check policy unchanged.
22. H4 official retest/report/next-block unchanged.
23. H3.1 onboarding lifecycle remains green.
24. V1 rollback path remains tested.
25. Audio remains 150 verified assets.
26. No audio generation occurs.
27. No Warden work occurs.
28. No H5D work occurs.
29. Full repository gate passes.
30. Physical-device validation is not claimed.
31. Public release remains blocked.

# ACCEPTANCE CRITERIA

Do not mark H5C complete unless:

1. Unified V2 is the only normal public Check-Up/results path.
2. V1 is reachable only in explicit rollback-build mode.
3. Accepted/malformed/pending V2 state never falls back to V1.
4. Onboarding baseline uses V2 in normal builds.
5. Official V2 retest/report remains functional.
6. H5A Progress remains functional.
7. H5B micro-check policy remains functional.
8. Settings/internal harness containment passes.
9. Direct-route/deep-link guards pass.
10. V1 rollback tests pass.
11. Focused tests pass.
12. Full Jest passes.
13. Audio verification passes.
14. App typecheck passes.
15. Website typecheck passes.
16. Expo config passes.
17. Android/iOS export passes.
18. `git diff --check` passes.
19. No unrelated work is overwritten.
20. No package/lockfile/audio change occurs.
21. No staging/commit/branch/push occurs.

Do not mark complete if:

- old unified release flag off can route normal users to V1;
- a public V1 result screen is reachable in normal mode;
- malformed V2 falls back to V1;
- rollback flag can be enabled by user/backend/profile;
- internal harness rows appear in beta-facing Settings;
- H5D is partially implemented;
- Warden or audio changes occur.

# STAGE DECISIONS

At the end of the report state exactly one:

```text
UNIFIED MOVEMENT CHECK-UP STAGE H5C COMPLETE
UNIFIED MOVEMENT CHECK-UP STAGE H5C BLOCKED
```

Also state exactly one:

```text
PUBLIC V1 CHECK-UP / RESULTS ROUTES RETIRED
PUBLIC V1 ROUTE RETIREMENT BLOCKED
```

Also state exactly one:

```text
UNIFIED V2 PUBLIC DEFAULT ENABLED
UNIFIED V2 DEFAULT ENABLEMENT BLOCKED
```

Also state exactly one:

```text
LEGACY V1 ROLLBACK-BUILD POLICY IMPLEMENTED
LEGACY V1 ROLLBACK POLICY BLOCKED
```

Also state exactly one:

```text
INTERNAL HARNESS CONTAINMENT VERIFIED
INTERNAL HARNESS CONTAINMENT BLOCKED
```

Also state exactly one:

```text
V1 ROLLBACK PATH VERIFIED
V1 ROLLBACK PATH BLOCKED
```

Also state exactly one:

```text
UNIFIED MOVEMENT CHECK-UP STAGE H5D UNBLOCKED
UNIFIED MOVEMENT CHECK-UP STAGE H5D BLOCKED
```

Use H5D unblocked only when:

- normal public V2 routing is complete;
- V1 rollback isolation is complete;
- internal harness containment is complete;
- H0-H5B.1 regressions pass;
- no unresolved P0/P1 route/release-policy defect remains.

Also state:

```text
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

# NEXT STAGE

If H5C completes, the next stage is:

```text
HALE UNIFIED MOVEMENT CHECK-UP — STAGE H5D
RELEASE-CANDIDATE HARDENING,
BETA-BUILD FLAG LOCKDOWN,
FINAL SOFTWARE VERIFICATION,
PHYSICAL-DEVICE QA PROTOCOL,
AND CLOSED-BETA SHIP DECISION
```

H5D should:

- harden build flags/defaults for beta;
- ensure no diagnostics/internal harness is exposed in beta builds;
- finalize stale docs/config references such as old audio model wording;
- run full multi-block lifecycle and release-gate validation;
- create a physical-device QA checklist and evidence template;
- define closed-beta release blocking/waiver truth;
- not fabricate physical-device validation.

Do not begin H5D in this task.

# FINAL CODEX RESPONSE

Return a concise summary containing:

- Report path.
- Whether production runtime code changed.
- Re-entry typecheck/baseline.
- Public routing inventory.
- Flag inventory.
- Rollback flag path/default/parser.
- Unified V2 default behavior.
- Public selector precedence.
- Baseline/baseline-retake behavior.
- Official-retest behavior.
- Manual/quick behavior.
- App route guards.
- Onboarding behavior.
- Pending/resume behavior.
- Rollback-build behavior.
- Settings/internal harness behavior.
- Deep-link/direct-route behavior.
- Public copy guardrails.
- H5A Progress preservation.
- H5B micro-check preservation.
- V1 rollback result.
- Audio preservation result.
- Files changed.
- Tests added/changed.
- Focused validation.
- Full Jest.
- Audio verification.
- App typecheck.
- Website typecheck.
- Expo config.
- Android/iOS export.
- `git diff --check`.
- Confirmation that H0-H5B.1, H4.1.1, Stage 3D-B, Stage 4, Stage 5, Step-Up resume, navigation, TypeScript boundaries, safety audio, and V2 audio remain green.
- `UNIFIED MOVEMENT CHECK-UP STAGE H5C COMPLETE` or blocked.
- V1-route-retirement verdict.
- Unified-default verdict.
- Rollback-policy verdict.
- Internal-harness verdict.
- V1-rollback verdict.
- `UNIFIED MOVEMENT CHECK-UP STAGE H5D UNBLOCKED` or blocked.
- `NORMAL PUBLIC CHECK-UP IS UNIFIED V2`.
- `PUBLIC V1 MOVEMENT AGE FLOW RETIRED FROM NORMAL BUILDS`.
- `V1 RETAINED ONLY FOR EXPLICIT ROLLBACK BUILDS`.
- `ACCEPTED V2 STATE NEVER FALLS BACK TO V1`.
- `AUDIO ASSET FINGERPRINT GATE PASSED`.
- `WARDEN TRANSFORM DEFERRED`.
- `PHYSICAL DEVICE VALIDATION NOT CLAIMED`.
- `PUBLIC RELEASE REMAINS BLOCKED`.
- Initial/final Git status.
- Complete files-changed inventory.
- Concurrent external changes.
- Confirmation that no package install, lockfile change, audio regeneration, staging, commit, branch, push, H5D work, Warden work, or physical-device validation claim occurred.
