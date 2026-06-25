You are implementing the first execution stage of Hale’s approved unified Movement Check-Up architecture:

HALE UNIFIED MOVEMENT CHECK-UP — STAGE H0
REPOSITORY HEALTH GATE, POSE-RENDERER/DIAGNOSTICS TYPE RECONCILIATION, AND RELEASE-FLAG HARDENING

This is a narrow prerequisite stage.

Do not implement the unified Check-Up UI or reroute onboarding yet.

The next product stage, after this health gate is green, will reuse the polished current `CheckUpScreen` visual shell while replacing the V1 measurement/scoring authority with the existing V2 live protocol engine.

## Founder decisions now locked

### Canonical product direction

The approved future architecture is:

```text
one canonical Movement Check-Up
=
polished current V1 Check-Up screen and claim-neutral app shell
+
V2 live measurement protocols/controllers
+
V2 raw-first Movement Profile
+
V2 evidence/focus assessment
+
V2 automatic domain or balanced plan
+
shared Stage 5 training lifecycle
```

There must not be two permanent public Check-Up products.

### No V1-user migration requirement

No real user has completed a V1 Check-Up.

Therefore the future migration does not need:

- a public legacy Movement Age history section;
- V1-to-V2 result conversion;
- mixed V1/V2 charts;
- V1/V2 longitudinal compatibility messaging;
- permanent V1 result rendering;
- migration of completed user V1 assessments or blocks.

Development/test V1 data may remain readable during implementation, but production migration support is not a requirement.

Do not delete V1 code in this H0 stage. The next stages will migrate routes and then retire unreachable V1 measurement/scoring code once rollback and lifecycle parity are proven.

### Warden chair policy

The founder approved the intended Warden chair percentile product policy, but implementation is deliberately deferred.

In this H0 stage:

- do not add Warden LMS parameters;
- do not extract workbook tables;
- do not add an approximate substitute formula;
- do not enable chair percentile output;
- do not alter chair focus eligibility;
- keep the current production chair result raw-only;
- preserve the existing future transform interface.

### UI decision

The polished current `src/screens/CheckUpScreen.tsx` design will be the public UI shell.

The separate V2 screen remains internal until the unified-shell migration is implemented and verified.

Do not change either screen’s product behavior in H0.

## Why H0 exists

The latest read-only V1/V2 audit recommended the unified hybrid but found a repository-wide app TypeScript failure in pose-renderer/diagnostics code.

Reported errors included:

```text
src/diagnostics/poseRendererReplay.ts:
  missing createSculptedFigureGeometry
  missing buildSculptedFigureGeometry
  stale "sculpted-figure" mode comparison
  incomplete PoseRendererReplaySummary

src/render/__tests__/poseAvatarConfig.test.ts:
  stale "sculpted_body" mode

src/render/matteGraphiteDigitalTwinGeometry.ts:
  number[] passed where readonly [number, number, number, number] is required

src/render/SculptedPoseRenderer.tsx:
  stale "sculpted_body" mode comparisons/assignments
```

The audit also found public Expo config appeared to expose diagnostics release settings such as:

```text
enablePoseLatencyDiagnostics
allowDiagnosticsInRelease
```

These may reflect intentional internal work, stale config, or unsafe defaults. H0 must reconstruct the current truth and make the release posture explicit.

The audit’s architecture recommendation was:

- V2 protocols/results/artifacts as the canonical future;
- V1 shell and lifecycle reused only where claim-neutral;
- one player with versioned protocol adapters rather than two public systems.

H0 must not implement that product migration. It only makes the repository healthy enough for the next stage.

## Required prior reading

Read these in full before changing code:

- `docs/audits/HALE_MOVEMENT_CHECKUP_V1_V2_CURRENT_IMPLEMENTATION_AUDIT.md`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2D_2C.md`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2E_A_1.md`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2E_A.md`
- `docs/audits/HALE_POSE_PIPELINE_LATENCY_REMEDIATION.md`, if present
- current pose-renderer/benchmark/diagnostics reports
- `AGENTS.md`
- `CLAUDE.md`
- `docs/decisions.md`

Treat current code and current untracked production files as source of truth.

Older report line numbers may be stale.

## Scope

This stage may change only what is necessary to:

1. make `npm run typecheck` pass without weakening strictness;
2. reconcile stale pose-renderer modes and dead diagnostics references;
3. repair the current pose-renderer replay summary contract;
4. repair narrow tuple typing defects;
5. make diagnostics release flags explicit, strict, and safe by default;
6. update focused tests;
7. write one H0 report.

This stage must not change:

- Check-Up protocols;
- V1/V2 routing;
- onboarding routing;
- Results/Progress behavior;
- Movement Age scoring;
- V2 reference engine;
- V2 snapshots/assessments;
- V2 automatic block creation;
- Stage 4/5 policy;
- pose model selection;
- camera resolution;
- native delegate/running mode;
- audio cue text or assets;
- dependencies;
- lockfiles;
- website product copy;
- Warden transform;
- source tables;
- fonts or unrelated assets.

Do not perform opportunistic refactors.

# PART A — WORKTREE SAFETY

## Step 1: Capture the exact initial state

Before analysis or editing, run:

```bash
git status --short --untracked-files=all
git diff --name-only
git diff --stat
git ls-files --others --exclude-standard
```

Record the exact output in the report.

Rules:

1. Treat every existing tracked/untracked file as user-owned.
2. Inspect current diffs in every file this stage may touch.
3. Do not revert, delete, move, or broadly reformat unrelated work.
4. Do not edit prior audit reports.
5. Do not use destructive Git commands.
6. Do not install packages.
7. Do not modify lockfiles.
8. Do not stage, commit, branch, push, or open a PR.
9. Do not inspect or expose `.env` values or provider credentials.
10. Do not modify or share font files.
11. If concurrent changes make a task-owned edit ambiguous, stop mutation and document the conflict rather than overwriting it.

# PART B — REPRODUCE THE CURRENT HEALTH GATE

## Step 2: Run the exact current typecheck first

Run:

```bash
npm run typecheck
```

Record the exact output.

Do not assume the audit’s errors still exist.

Classify every current diagnostic by:

| Error | File | Current owner/subsystem | Root cause | Task-owned fix? |
| --- | --- | --- | --- | --- |

If typecheck already passes:

- do not manufacture changes;
- still perform the stale-mode and diagnostics-release audit below;
- make only changes proven necessary.

## Step 3: Establish focused baseline

Run focused tests for the current renderer/diagnostics surfaces, including all that exist for:

- pose avatar config;
- renderer mode parsing;
- pose renderer replay;
- latest-frame scheduler;
- pose latency diagnostics;
- current point-cloud/digital-twin renderer;
- sculpted renderer, if still supported;
- benchmark screen/config;
- app config feature flags.

Use real existing test paths rather than inventing file names.

Then run:

```bash
npm run verify:audio
npm test -- --runInBand
npm --prefix website run typecheck
npx --no-install expo config --type public
git diff --check
```

Do not run Expo export until after remediation.

Record current counts and warnings.

# PART C — RECONSTRUCT THE CURRENT RENDERER MODE SYSTEM

## Step 4: Inventory all renderer mode definitions and consumers

Search at minimum for:

```text
PoseAvatarRendererMode
sculpted_body
sculpted-body
sculpted-figure
sculpted_figure
digital-twin
matte graphite
matteGraphite
solid-figure
silhouette
limb-ribbon
point-cloud
constellation
classic
rendererMode
EXPO_PUBLIC_POSE
```

Inspect at minimum:

- `src/render/poseAvatarTypes.ts`
- `src/render/poseAvatarConfig.ts`
- `src/render/PoseAvatarRenderer.tsx`
- `src/render/SculptedPoseRenderer.tsx`
- `src/render/matteGraphiteDigitalTwinGeometry.ts`
- `src/diagnostics/poseRendererReplay.ts`
- `src/screens/PoseOverlayBenchmarkScreen.tsx`
- any renderer benchmark config/types/tests;
- all current renderer implementations;
- `app.config.js`, `app.json`, `.env.example`, and current Expo config mapping.

Create a current inventory:

| Mode token | In type union | Has production renderer | Has config path | Has diagnostics replay | Has tests | Reachable |
| --- | --- | --- | --- | --- | --- | --- |

## Step 5: Determine the intended active mode set

Use current production code, current product decisions, and current renderer files.

Do not preserve a stale mode merely because an old test mentions it.

Do not re-add an abandoned mode to the type union merely to satisfy compilation unless current production configuration genuinely supports it.

Classify every stale token as:

- canonical active;
- compatibility alias still intentionally accepted;
- internal benchmark-only;
- dead/abandoned and should be removed;
- unresolved.

The likely stale tokens from the audit are:

```text
sculpted_body
sculpted-figure
```

But verify current truth first.

## Step 6: One canonical parser

If current config accepts external string tokens, ensure one pure parser/normalizer owns compatibility aliases.

Requirements:

- one canonical return union;
- unknown/malformed token returns the safe default;
- aliases do not leak into internal renderer state;
- no screen-local parsing;
- deterministic;
- strict tests.

Do not add a compatibility alias unless a current env/config/build may still contain it.

# PART D — POSE RENDERER REPLAY RECONCILIATION

## Step 7: Trace `poseRendererReplay.ts`

Reconstruct:

```text
fixture/input
-> renderer-mode selection
-> geometry builder
-> path/mesh summary
-> replay result
```

Identify why current code references:

```text
createSculptedFigureGeometry
buildSculptedFigureGeometry
```

Determine whether:

1. the functions were renamed and current equivalents exist;
2. the sculpted mode was intentionally removed;
3. the replay file is stale;
4. a current renderer lacks replay support.

## Step 8: Fix based on current architecture

Preferred behavior:

- remove stale replay branches for renderer modes that no longer exist;
- use current geometry APIs for modes that remain;
- do not recreate abandoned sculpted geometry;
- do not duplicate production geometry inside diagnostics;
- keep replay modules side-effect free;
- preserve deterministic output.

If a current renderer intentionally cannot be replayed through this diagnostic:

- represent it explicitly as unsupported in diagnostics;
- do not reference missing symbols;
- do not fake geometry.

## Step 9: Complete `PoseRendererReplaySummary`

Inspect the actual current type and all consumers.

Ensure every summary is populated consistently.

Requirements:

- no optionality added merely to silence errors if the field is semantically required;
- no `as any`;
- no unsafe partial cast;
- deterministic default for unsupported/unavailable measurements;
- JSON-safe;
- no raw frames/landmarks in summary output beyond existing approved bounded fixtures.

Add focused tests for:

- every canonical supported mode;
- unsupported/internal mode if applicable;
- unknown config;
- deterministic repeated replay;
- summary field completeness.

# PART E — SCULPTED RENDERER CLEANUP

## Step 10: Inspect `SculptedPoseRenderer.tsx`

Determine whether this component is:

- active;
- internal benchmark-only;
- superseded by another renderer;
- dead.

If active:

- make it use only canonical current mode tokens;
- remove stale `sculpted_body` assignments/comparisons;
- ensure its props and fallback mode are legal.

If dead:

- do not delete broadly unless current imports prove it unreachable and deletion is the narrowest safe fix;
- otherwise keep it compiling without reintroducing stale public modes.

Do not change its visual design in H0.

Do not change pose smoothing, latency, dot count, or geometry aesthetics.

# PART F — MATTE GRAPHITE TUPLE TYPING

## Step 11: Fix tuple errors semantically

Reported current errors indicate `number[]` passed to:

```ts
readonly [number, number, number, number]
```

Inspect the affected APIs and values.

Use a real tuple type at the source, for example:

```ts
const value: readonly [number, number, number, number] = [...]
```

or a typed helper that proves length and order.

Do not use:

- `as any`;
- broad unsafe casts;
- `number[] as ...` without source validation;
- disabled strictness.

Add/adjust focused geometry tests if the affected values are material to geometry output.

Do not change the rendered shape except where the current untyped value was objectively malformed.

# PART G — DIAGNOSTICS RELEASE-FLAG HARDENING

## Step 12: Reconstruct every diagnostics flag

Search for:

```text
enablePoseLatencyDiagnostics
allowDiagnosticsInRelease
EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS
EXPO_PUBLIC_ALLOW_DIAGNOSTICS_IN_RELEASE
ENABLE_MOVEMENT_PROFILE_V2_DIAGNOSTICS
diagnostics
benchmark
replay
```

For each flag record:

| Flag | Default | Source | Public config exposure | Runtime consumer | Release effect |
| --- | --- | --- | --- | --- | --- |

Inspect:

- Expo config generation;
- `app.config.js`;
- `app.json`;
- `.env.example`;
- native/JS consumers;
- Settings/internal routes;
- benchmark screen reachability.

## Step 13: Safe default policy

Lock these rules:

1. Diagnostics default off.
2. Release diagnostics require an exact explicit opt-in.
3. `__DEV__` alone must not enable a release diagnostic route.
4. A backend/profile/restored value cannot enable diagnostics.
5. Unknown/malformed values are false.
6. Production public config should not claim diagnostics are enabled unless explicitly requested by the build environment.
7. Internal beta builds may opt in deliberately.
8. Disabling diagnostics must not alter pose inference, Check-Up, training, or renderer behavior.

If current architecture already satisfies this, document it and do not change it.

## Step 14: Public Expo config review

Run:

```bash
npx --no-install expo config --type public
```

Verify the final resolved values without exposing unrelated secrets.

The report should state:

- which diagnostics keys appear;
- their default resolved value;
- how an internal build enables them;
- how a public build keeps them off.

Do not print full environment contents.

# PART H — TYPECHECK-BOUNDARY INTEGRITY

## Step 15: Preserve strictness

Confirm:

- root `tsconfig.json` remains strict;
- website stays excluded from app compiler and has its own typecheck;
- renderer/diagnostics files stay included;
- no task-owned file is excluded to make typecheck pass.

Do not add:

- `any`;
- `as any`;
- `@ts-ignore`;
- `@ts-expect-error`;
- `strict: false`;
- disabled `noImplicitAny`;
- broad new excludes.

## Step 16: No product changes

Add focused assertions or source-boundary tests proving H0 did not alter:

- V1 default Check-Up routing;
- V2 internal gate behavior;
- V2 protocol policy;
- V2 chair raw-only status;
- V2 automatic block behavior;
- Stage 5 scheduler behavior.

Use existing tests where sufficient.

# PART I — REQUIRED TEST MATRIX

## A. Renderer modes

- canonical modes parse;
- stale mode rejected or normalized only through approved alias;
- unknown defaults safely;
- no stale internal assignment;
- config/runtime agreement.

## B. Replay

- every supported mode returns complete summary;
- unsupported mode is explicit;
- deterministic replay;
- no missing geometry symbol;
- no raw unbounded payload.

## C. Sculpted renderer

- compiles under canonical union;
- no stale token;
- active fallback valid;
- no visual-policy change.

## D. Tuple geometry

- typed tuple accepted;
- no unsafe cast;
- deterministic geometry;
- finite values.

## E. Diagnostics flags

- missing false;
- exact enabled true where approved;
- malformed false;
- release requires explicit permission;
- backend/profile cannot enable;
- benchmark route unavailable when disabled.

## F. TypeScript boundary

- renderer/diagnostics files are compiled;
- website is separate;
- no suppression/strictness weakening.

## G. Product non-regression

- V1 remains public/default in H0;
- V2 remains internal;
- Warden remains disabled;
- V2 results/blocks unchanged;
- audio matrices unchanged.

# PART J — VALIDATION

## Step 17: Targeted validation

Run all relevant focused renderer/diagnostics/config tests.

Record exact command, suite count, and test count.

## Step 18: Full required validation

Run exactly:

```bash
npm run verify:audio
npm test -- --runInBand
npm run typecheck
npm --prefix website run typecheck
npx --no-install expo config --type public
git diff --check
```

Then run:

```bash
rm -rf /tmp/hale-hybrid-h0-export
npx --no-install expo export --platform all --output-dir /tmp/hale-hybrid-h0-export
rc=$?
rm -rf /tmp/hale-hybrid-h0-export
exit $rc
```

Do not install dependencies.

Record:

- targeted suites/tests;
- full suites/tests;
- audio:
  - safety 44/88;
  - Movement Profile V2 31/62;
  - total 150;
- app typecheck;
- website typecheck;
- Expo config;
- Android export;
- iOS export;
- `git diff --check`;
- Watchman warning;
- Jest open-handle notice;
- Sentry warning;
- diagnostics resolved defaults;
- any new warning;
- whether validation changed files.

# PART K — REPORT

Create exactly one report:

```text
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H0_HEALTH_GATE.md
```

Do not edit prior reports.

The report must contain:

1. Scope.
2. Founder decisions carried forward.
3. No-V1-user migration decision.
4. Warden deferred decision.
5. Initial Git status.
6. Exact initial typecheck output.
7. Error/root-cause matrix.
8. Renderer-mode inventory.
9. Canonical mode decision.
10. Replay architecture and fix.
11. Sculpted renderer status.
12. Tuple-typing fix.
13. Diagnostics flag inventory.
14. Diagnostics safe-default policy.
15. Public Expo config result.
16. TypeScript strictness proof.
17. Product non-regression proof.
18. Files changed.
19. Tests added/changed.
20. Exact targeted validation.
21. Exact full validation.
22. Audio verification.
23. App/website typechecks.
24. Expo config/export.
25. Warnings.
26. Remaining unified Check-Up work.
27. Whether Stage H1 is unblocked.
28. Initial and final Git status.
29. Complete files-changed inventory.
30. Concurrent external changes.
31. Confirmation that no package install, lockfile change, staging, commit, branch, or push occurred.

# REQUIRED INVARIANTS

After H0:

1. `npm run typecheck` passes.
2. Strictness is not weakened.
3. No stale internal renderer token remains outside an explicitly approved parser alias.
4. No missing geometry symbol remains.
5. Replay summaries satisfy their current type.
6. Tuple values are typed at source.
7. Diagnostics default off.
8. Release diagnostics require explicit opt-in.
9. V1 routing is unchanged.
10. V2 routing is unchanged.
11. Warden remains disabled.
12. V2 chair remains raw-only.
13. V2 automatic block creation is unchanged.
14. No Check-Up UI is redesigned.
15. No protocol/scoring/reference/lifecycle behavior changes.
16. Existing audio remains 150 assets.
17. Android and iOS export pass.
18. No unrelated user work is lost.

# ACCEPTANCE CRITERIA

Do not mark H0 complete unless:

1. Current type errors are reproduced or current pass is documented.
2. Every current type error is resolved properly.
3. No suppression or strictness weakening is introduced.
4. Renderer mode truth is explicit.
5. Stale modes are removed or narrowly normalized.
6. Replay tests pass.
7. Diagnostics release behavior is safe by default.
8. Full Jest passes.
9. Audio verification passes.
10. App typecheck passes.
11. Website typecheck passes.
12. Expo config passes.
13. Android/iOS export passes.
14. `git diff --check` passes.
15. No unrelated changes are overwritten.
16. No dependencies/lockfiles change.
17. No staging/commit/branch/push occurs.

# STAGE DECISIONS

At the end of the report, state exactly one:

```text
UNIFIED MOVEMENT CHECK-UP STAGE H0 COMPLETE
UNIFIED MOVEMENT CHECK-UP STAGE H0 BLOCKED
```

Also state exactly one:

```text
APP TYPESCRIPT HEALTH GATE PASSED
APP TYPESCRIPT HEALTH GATE BLOCKED
```

Also state exactly one:

```text
POSE RENDERER MODE CONTRACT RECONCILED
POSE RENDERER MODE CONTRACT BLOCKED
```

Also state exactly one:

```text
DIAGNOSTICS RELEASE DEFAULTS VERIFIED SAFE
DIAGNOSTICS RELEASE DEFAULTS REQUIRE REMEDIATION
```

Also state exactly one:

```text
UNIFIED MOVEMENT CHECK-UP STAGE H1 UNBLOCKED
UNIFIED MOVEMENT CHECK-UP STAGE H1 BLOCKED
```

Use H1 unblocked only when the repository is fully green and no P0/P1 health defect remains.

Also state:

```text
NO MOVEMENT CHECK-UP PRODUCT MIGRATION PERFORMED
NO V1 LEGACY-RESULT MIGRATION REQUIRED
WARDEN TRANSFORM DEFERRED
V1 PUBLIC ROUTING UNCHANGED
V2 INTERNAL ROUTING UNCHANGED
STAGE 4 REMEDIATION COMPLETE
STAGE 5 REMEDIATION COMPLETE
PHYSICAL DEVICE VALIDATION NOT CLAIMED
```

# NEXT STAGE DEFINITION

If H0 completes, the next stage is:

```text
UNIFIED MOVEMENT CHECK-UP STAGE H1:
POLISHED V1 CHECKUPSCREEN SHELL + V2 LIVE PROTOCOL ADAPTER
```

H1 will:

- preserve the current polished `CheckUpScreen` visual design;
- define a protocol-neutral screen/view-model boundary;
- drive it with the existing V2 live coordinator;
- render V2 chair, balance, shoulder, and hinge states using the V1 visual system;
- keep current public routing unchanged until parity is verified;
- retain the separate V2 screen as an internal comparison harness;
- make no Warden change.

Do not begin H1 in this task.

# FINAL CODEX RESPONSE

Return a concise summary containing:

- Report path.
- Whether production code changed.
- Initial typecheck result.
- Exact root causes.
- Canonical renderer modes.
- Stale modes removed/normalized.
- Replay fix.
- Tuple fix.
- Diagnostics default/release policy.
- Public Expo config result.
- Files changed.
- Tests added/changed.
- Targeted validation.
- Full Jest.
- Audio verification.
- App typecheck.
- Website typecheck.
- Expo config.
- Android/iOS export.
- `git diff --check`.
- Product non-regression result.
- `UNIFIED MOVEMENT CHECK-UP STAGE H0 COMPLETE` or blocked.
- TypeScript verdict.
- Renderer-mode verdict.
- Diagnostics verdict.
- `UNIFIED MOVEMENT CHECK-UP STAGE H1 UNBLOCKED` or blocked.
- `NO MOVEMENT CHECK-UP PRODUCT MIGRATION PERFORMED`.
- `NO V1 LEGACY-RESULT MIGRATION REQUIRED`.
- `WARDEN TRANSFORM DEFERRED`.
- Initial and final Git status.
- Complete files-changed inventory.
- Concurrent external changes.
- Confirmation that no package install, lockfile change, staging, commit, branch, or push occurred.
