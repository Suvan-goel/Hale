You are carrying out Stage 5E.1 of Hale’s production-readiness work:

TYPESCRIPT PROJECT-BOUNDARY HARDENING, APP SETTINGS FIXTURE REPAIR, SETTINGS SCREEN TYPE SAFETY, AND STAGE 5E RELEASE-GATE VERIFICATION

This is a narrow verification-and-remediation pass following Stage 5E.

Do not begin Stage 5F, Stage 5G, Stage 5H, Stage 3D-B, further Stage 4 remediation, beta-device validation, or unrelated UI/product work in this task.

The default expectation is:

1. Fix only the current TypeScript release-gate blockers.
2. Preserve the Stage 5E behavior already implemented.
3. Separate the Hale mobile-app TypeScript project from the standalone `website/` TypeScript project without weakening either project’s checks.
4. Rerun Stage 5E and full release validation.
5. Produce a complete verification report.

Modify Stage 5E production logic only if a new authoritative test proves a Stage 5E defect.

## Required prior reading

Read these reports in full before changing anything:

- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5E.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5D_1.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5D.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5C.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5B_1.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5B.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5A.md

Also inspect:

- the current root `package.json`;
- the current root `tsconfig.json` and any extended TypeScript configs;
- `website/package.json`;
- `website/tsconfig.json`;
- the exact files currently named in TypeScript errors;
- all relevant tests.

Treat the current working tree as the source of truth. The worktree is heavily dirty and contains concurrent user-owned app, native-module, UI, landing-page, and website work.

## Why Stage 5E.1 is required

Stage 5E production logic and tests passed:

- targeted Stage 5E Jest: 5 suites / 93 tests;
- full Jest: 90 suites / 695 tests;
- Expo config: passed;
- `git diff --check`: passed.

Stage 5E could not be signed off because the exact root app typecheck failed.

The Stage 5E report identified these current blockers:

### Blocker A — stale `AppSettings` test fixture

```text
src/haleFlow/__tests__/exploreViewModel.test.ts(241,7)
```

A fixture typed as `AppSettings` is missing the required field:

```ts
devMockDataEnabled
```

This is a stale typed fixture, not a Stage 5E policy failure.

### Blocker B — `SettingsScreen.tsx` type errors

The Stage 5E report identified:

- missing `ToggleRow` symbol;
- implicit-`any` callback parameters associated with the affected settings rows.

This appears to come from concurrent/user-owned Settings UI work.

The screen must compile without weakening TypeScript or changing unrelated Settings behavior.

### Blocker C — root app TypeScript command includes the standalone `website/` tree

The untracked `website/` directory is a separate Next.js project with its own:

- `package.json`;
- `tsconfig.json`;
- `next.config.mjs`;
- source tree;
- tests;
- path aliases.

The root Hale mobile-app TypeScript command currently sees website files and reports website-specific alias/implicit-any errors.

The app and website must have explicit project boundaries.

The correct fix is not to hide website errors globally.

The required architecture is:

- the root Hale app typecheck checks the mobile app, tests, relevant local modules, and intended root scripts;
- the website typecheck checks the website through the website project’s own TypeScript configuration;
- the root app typecheck does not accidentally compile the standalone website project;
- neither project weakens strictness to make the gate green.

## Verified Stage 5E behavior that must remain unchanged

Stage 5E implemented:

- one normalized daily training context;
- centralized discomfort movement-pattern constraints;
- safety/equipment/discomfort/readiness precedence;
- minimum safe primary-focus stimulus;
- temporary daily ladder regression metadata;
- separation of main-plan credit and progression authority;
- progression policy:
  - `normal`
  - `hold_only`
  - `ineligible`
- conservative behavior for cautious, short-on-time, discomfort-adjusted, malformed, and legacy contexts;
- no planning-time mutation of persistent ladder progress;
- adjusted preview/completion copy;
- local and backend metadata sanitization.

Do not weaken or bypass any Stage 5A–5E, Stage 4A/4B, Stage 3D, or navigation-order contract.

## Primary objectives

Stage 5E.1 must:

1. Reproduce and classify the current TypeScript errors exactly.

2. Repair the stale `AppSettings` fixture using the canonical settings contract.

3. Repair `SettingsScreen.tsx` typing without broad UI redesign or `any` escapes.

4. Establish explicit TypeScript project boundaries between:
   - the Hale mobile app;
   - the standalone website.

5. Ensure `npm run typecheck` is a trustworthy mobile-app release gate.

6. Verify the website separately when its installed local dependencies permit it.

7. Prove the app typecheck still covers intended app source and tests.

8. Rerun Stage 5E targeted tests and full Jest.

9. Rerun Expo config and `git diff --check`.

10. Produce exact Git/status/validation evidence.

11. Sign off Stage 5E only when the app release gate is fully green and no Stage 5E regression appears.

## Scope boundary

This task may change:

- `src/haleFlow/__tests__/exploreViewModel.test.ts`;
- a shared test fixture/factory used by that test, if a canonical one exists;
- `src/screens/SettingsScreen.tsx`;
- an existing settings UI component import/export required to restore `ToggleRow`;
- focused Settings tests if needed;
- root TypeScript config(s);
- root typecheck package script only if required to point to the intended app config;
- website typecheck script/config only if a minimal project-boundary fix is necessary and safe;
- focused config-verification tests/scripts if already supported by the repository;
- the Stage 5E.1 verification report.

This task must not change:

- Stage 5E pain/readiness/autoregulation behavior;
- exercise selection;
- progression thresholds;
- main-plan credit rules;
- navigation order;
- Settings product behavior unrelated to compile correctness;
- website product content;
- landing-page design;
- scoring;
- norms;
- Check-Up logic;
- pose-detection behavior;
- backend schema;
- dependencies;
- assets;
- broad TypeScript strictness settings.

Do not perform opportunistic refactors.

## Non-negotiable TypeScript rules

1. Do not use `as any`, `any`, `@ts-ignore`, `@ts-expect-error`, or blanket type assertions merely to silence these errors.

2. Do not set:

```json
"strict": false
```

3. Do not disable:

- `noImplicitAny`;
- strict null checks;
- test typechecking;
- app source typechecking.

4. Do not exclude specific failing app source/test files from the app TypeScript project.

5. Do not exclude the website from all validation without defining or verifying its separate project boundary.

6. Do not add broad patterns such as excluding all untracked files or all tests.

7. Do not install packages.

8. Do not regenerate lockfiles.

9. Do not change module-resolution behavior globally unless required and justified by both projects.

## Approved TypeScript project-boundary policy

### Hale mobile app

The root app typecheck must intentionally include the mobile-app project’s relevant TypeScript files, including as applicable:

- `App.tsx`;
- `src/**/*.ts`;
- `src/**/*.tsx`;
- local Expo/native-module TypeScript wrappers under `modules/**`;
- root scripts that are intentionally part of the app TypeScript project;
- Jest test files under the app source tree;
- other explicitly intended root project TypeScript files.

It must not accidentally include the standalone `website/` project.

### Website

The `website/` directory is a separate TypeScript project.

It should be checked through:

- `website/tsconfig.json`;
- the website package’s own local toolchain and scripts.

If website dependencies are already installed locally:

- run the website typecheck;
- fix only configuration/type errors that are narrow, safe, and clearly within this task’s project-boundary work.

If website dependencies are not installed:

- do not install them;
- do not claim website typecheck passed;
- record that website verification could not run due missing installed dependencies;
- this does not block Stage 5E’s mobile-app sign-off if the website is definitively outside the app TypeScript project.

### Root command behavior

`npm run typecheck` at the Hale app root must remain the authoritative app release gate.

It may use:

- the existing root `tsconfig.json`;
- a narrow `tsconfig.app.json` if the current architecture benefits from an explicit app config.

Prefer the smallest clear change.

Do not create unnecessary project-reference complexity.

## Working-tree safety

Before analysis or editing:

1. Run:

```bash
git status --short --untracked-files=all
git diff --name-only
git diff --stat
```

2. Record exact output in the verification report.

3. Treat all existing files and changes as user-owned unless specifically changed for Stage 5E.1.

4. Inspect current diffs in:

- `src/haleFlow/__tests__/exploreViewModel.test.ts`;
- `src/screens/SettingsScreen.tsx`;
- root TypeScript config/package files;
- website TypeScript config/package files.

5. Do not revert, overwrite, reformat, move, or delete unrelated work.

6. Do not edit prior audit reports.

7. Do not use destructive Git commands.

8. Do not stage, commit, create a branch, or push.

9. If unrelated files change during this task:
   - record them;
   - do not overwrite them;
   - continue only when task-owned edits remain safe and unambiguous;
   - otherwise stop production mutation and report the conflict.

## Step 1: Reproduce and inventory exact TypeScript errors

Before editing, run:

```bash
npm run typecheck
```

Capture:

- exact command;
- exit code;
- every error;
- file/line;
- error code;
- whether each error is:
  - app source;
  - app test;
  - app configuration;
  - standalone website source;
  - standalone website configuration;
  - missing dependency/tooling;
  - concurrent user-owned defect.

Do not rely only on the Stage 5E report’s older error list.

The current working tree may have changed.

Create a table:

| Error | Project | Root cause | Task-owned fix? | Planned action |

## Step 2: Trace the canonical `AppSettings` contract

Inspect at minimum:

- `src/profile/types.ts`;
- settings/default-state helpers;
- profile/settings serialization;
- every `AppSettings` literal/factory in tests;
- `src/haleFlow/__tests__/exploreViewModel.test.ts`.

Determine:

- whether `devMockDataEnabled` is required or optional;
- its default value;
- whether there is a canonical settings factory/default object;
- whether other stale fixtures exist.

Preferred fix:

- use the canonical default/factory;
- override only fields relevant to the test.

If no factory exists and adding one would be disproportionate:

- add the required typed field explicitly with the correct default;
- update other identical stale fixtures only if the exact same contract break exists.

Required tests:

- fixture remains a valid full `AppSettings`;
- `devMockDataEnabled` is explicitly controlled;
- Explore behavior under test is unchanged;
- no partial cast or `as any`.

## Step 3: Repair `SettingsScreen.tsx` type safety

Inspect the current Settings screen diff carefully.

Determine why `ToggleRow` is missing:

- deleted local component;
- missing import;
- renamed component;
- concurrent partial refactor;
- component moved into shared UI;
- stale JSX usage.

Use this order of preference:

1. Reuse/import the existing canonical typed ToggleRow component if one exists.

2. If the current screen intentionally owns a local ToggleRow and it was accidentally removed, restore a narrowly typed local component.

3. If the UI has been migrated to another canonical row component, update only the stale uses to that component.

Do not create duplicate competing UI primitives without checking the repository.

The component props should be explicit, conceptually:

```ts
type ToggleRowProps = {
  label: string;
  value: boolean;
  onValueChange: (nextValue: boolean) => void;
  description?: string;
  disabled?: boolean;
};
```

Adapt to current UI requirements.

Requirements:

- no implicit `any`;
- no broad assertions;
- existing visual structure preserved;
- accessibility label/state preserved;
- existing Settings behavior preserved;
- `devMockDataEnabled` toggle remains correctly wired if present;
- no unrelated copy/layout redesign.

Add or update focused tests only where current Settings tests support it.

## Step 4: Reconstruct current TypeScript project boundaries

Inspect:

- root `tsconfig.json`;
- any `tsconfig.*.json` files;
- root `package.json` typecheck script;
- Expo/React Native TypeScript defaults/extensions;
- Jest/test inclusion;
- `website/tsconfig.json`;
- `website/package.json`;
- website path aliases;
- website local dependency installation status.

Run:

```bash
npx --no-install tsc --showConfig
```

or the exact compiler/config command used by `npm run typecheck`.

Capture:

- effective root `include`;
- effective root `exclude`;
- compiler options;
- whether `website/**` is included;
- whether app tests are included;
- whether local module TypeScript wrappers are included.

Do not edit until this trace is complete.

## Step 5: Establish an explicit Hale app TypeScript boundary

Use the smallest robust approach.

### Preferred option A — explicit root include/exclude

If the existing root config is otherwise sound:

- define explicit app includes;
- exclude the standalone website.

Conceptually:

```json
{
  "include": [
    "App.tsx",
    "src/**/*.ts",
    "src/**/*.tsx",
    "modules/**/*.ts",
    "modules/**/*.tsx",
    "scripts/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "website",
    "dist",
    "build"
  ]
}
```

Adapt to actual intended project files.

Do not copy this blindly if current config has important generated/native paths.

### Option B — dedicated app config

If separating the project is clearer:

- create `tsconfig.app.json`;
- extend the existing root config;
- point root `npm run typecheck` to it;
- keep the existing root/website configs coherent.

Requirements for either option:

- root app source remains covered;
- root app tests remain covered;
- native module TypeScript wrappers remain covered where intended;
- website files are excluded only because they belong to their own project;
- no app error is hidden;
- no strictness is weakened.

## Step 6: Verify app config coverage

Do not assume a green typecheck proves correct coverage.

Use one or more non-mutating compiler diagnostics:

```bash
npx --no-install tsc -p <app-config> --noEmit --listFiles
npx --no-install tsc -p <app-config> --showConfig
```

Write large output only to `/tmp`, not the repository.

Prove at minimum that the app config includes representative files:

- `App.tsx`;
- `src/screens/SettingsScreen.tsx`;
- `src/haleFlow/__tests__/exploreViewModel.test.ts`;
- `src/training/dailyTrainingContext.ts`;
- `src/haleFlow/progressionEvidence.ts`;
- intended local module TypeScript wrapper(s).

Prove it excludes:

- `website/app/page.tsx`;
- `website/src/components/LandingPage.tsx`;
- other website sources.

Do not add brittle production tests that parse every compiler file unless the repository already has config tests.

Document exact proof in the report.

## Step 7: Define and verify the website typecheck boundary

Inspect the website project.

Determine:

- whether `website/package.json` already has a `typecheck` script;
- whether `website/node_modules` exists;
- whether the website uses Next’s generated types;
- whether its path aliases are correct under `website/tsconfig.json`.

### If website dependencies are installed

Run the website’s existing typecheck.

Preferred commands, in order:

```bash
npm --prefix website run typecheck
```

or, if no script exists and a local compiler is installed:

```bash
npm --prefix website exec tsc -- --noEmit -p tsconfig.json
```

If a minimal `typecheck` script is missing, adding one is allowed only if:

- it uses the website’s existing local dependencies;
- it does not install anything;
- it does not alter website runtime behavior.

Fix website errors only when:

- they are configuration/type-boundary errors directly caused by project setup;
- the fix is narrow;
- the website’s user-owned product code is not being broadly rewritten.

### If website dependencies are not installed

- do not install them;
- do not modify lockfiles;
- record the website typecheck as “not run — local dependencies unavailable”;
- verify statically that the website has a distinct config;
- ensure the app root no longer compiles it.

Stage 5E mobile-app sign-off depends on the mobile-app gate, not on pretending an unavailable website check passed.

## Step 8: Prevent future boundary regression

Add the narrowest maintainable guard.

Possible approaches:

- explicit comments in app/website TypeScript configs;
- explicit root app include/exclude;
- clear package scripts:
  - `typecheck`
  - optional `typecheck:website`;
- a lightweight existing config test if the repository already tests configuration.

Do not add a shell-heavy brittle test suite solely for this task.

The architecture itself should make accidental cross-project compilation unlikely.

## Step 9: Rerun focused app TypeScript verification

Run:

```bash
npm run typecheck
```

Required:

- exit 0;
- no Settings errors;
- no stale AppSettings fixture error;
- no website file appears in app compiler errors/list;
- strict checks remain active.

Also run the direct compiler command used by the script if useful to verify equivalence.

## Step 10: Stage 5E targeted regression

Run the exact Stage 5E targeted suite, updated only if file names have legitimately changed:

```bash
npm test -- --runInBand \
  src/training/__tests__/dailyTrainingContext.test.ts \
  src/training/__tests__/workoutGeneration.test.ts \
  src/haleFlow/__tests__/progressionEvidence.test.ts \
  src/haleFlow/__tests__/sessionPlanning.test.ts \
  src/adherence/__tests__/sessionCompletionFeedback.test.ts
```

Expected baseline from Stage 5E:

- 5 suites;
- 93 tests.

Verify the current actual counts.

Prove:

- daily-context normalization;
- discomfort policy;
- fallback exclusion;
- readiness daily regression;
- normal/hold/ineligible progression policy;
- idempotent hold-only behavior;
- preview/completion copy.

## Step 11: Focused fixes regression

Run focused tests for changed areas:

- `exploreViewModel` tests;
- Settings tests, if present;
- profile/settings serialization tests;
- onboarding/settings fixture tests if touched.

If no Settings-specific tests exist, use typecheck plus the smallest existing component test path.

Do not create a large UI test harness unnecessarily.

## Step 12: Full release validation

Run exactly:

```bash
npm test -- --runInBand
npm run typecheck
npx --no-install expo config --type public
git diff --check
```

Also run website typecheck separately if locally available, as defined above.

Record:

- exact commands;
- exit codes;
- targeted suite/test counts;
- full suite/test counts;
- snapshots;
- skipped tests;
- app typecheck result;
- website typecheck result or reason not run;
- Expo config result;
- diff-check result;
- Watchman warning;
- Jest open-handle notice;
- Sentry warning;
- any new warning;
- whether validation changed files.

Stage 5E’s prior full Jest baseline was:

- 90 suites;
- 695 tests.

Verify the current baseline rather than assuming it.

## Step 13: Stage 5E source verification

After validation, retrace:

### Daily-context path

```text
daily readiness/discomfort
-> normalizer
-> discomfort policy
-> readiness adjustment
-> session plan metadata
```

### Credit path

```text
safe primary work
-> Stage 5A work evidence
-> Stage 5B focus evidence
-> main-plan credit
```

### Progression path

```text
normal / hold_only / ineligible
-> Stage 5D eligibility
-> idempotent apply
```

### TypeScript boundary

```text
root npm run typecheck
-> app project only
```

and separately:

```text
website typecheck
-> website project only
```

Confirm no cross-project leakage.

## Production-code restraint

Production changes should be limited to:

- the narrow Settings compile fix;
- TypeScript project-boundary configuration;
- a narrow shared component import/export if required.

Do not modify Stage 5E production logic unless a test exposes a real violation.

Document every production change and why it was necessary.

## Verification report

Create exactly one new report:

```text
docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5E_1.md
```

Do not edit prior reports.

The report must include:

1. Scope.
2. Why Stage 5E.1 was required.
3. Initial Git status.
4. Exact initial TypeScript errors.
5. Error classification by project.
6. Canonical AppSettings contract.
7. AppSettings fixture remediation.
8. SettingsScreen root cause.
9. SettingsScreen remediation.
10. Root app TypeScript architecture before remediation.
11. Website TypeScript architecture.
12. Final app TypeScript project boundary.
13. App compiler coverage proof.
14. Website exclusion proof.
15. Website typecheck result or reason not run.
16. Strictness/non-suppression confirmation.
17. Stage 5E targeted regression.
18. Focused Settings/Explore regression.
19. Full Jest result.
20. App typecheck result.
21. Expo config result.
22. `git diff --check` result.
23. Stage 5A–5D regression status.
24. Stage 5E behavior verification.
25. Production files changed.
26. Tests/config files changed.
27. Exact reason for every change.
28. Remaining Stage 5 blockers.
29. Whether Stage 5F is unblocked.
30. Initial and final Git status.
31. Complete files-changed inventory.
32. Concurrent external changes.
33. Confirmation that no package install, lockfile change, commit, staging, branch, or push occurred.

## Required invariant outcomes

After Stage 5E.1:

1. `exploreViewModel.test.ts` uses a valid full AppSettings fixture.
2. `devMockDataEnabled` is explicitly represented through the canonical settings contract.
3. `SettingsScreen.tsx` resolves `ToggleRow` through a typed canonical implementation.
4. No implicit-any callback remains in the affected Settings code.
5. No `any`/ignore suppression is introduced.
6. Root `npm run typecheck` checks the mobile app and app tests.
7. Root app typecheck includes representative Stage 5E and Stage 5D source files.
8. Root app typecheck excludes the standalone website project.
9. Website retains its own TypeScript project configuration.
10. Website typecheck is run separately when local dependencies permit.
11. Neither project’s strictness is weakened.
12. Stage 5E targeted tests pass.
13. Full Jest passes.
14. App typecheck passes.
15. Expo config passes.
16. `git diff --check` passes.
17. Stage 5E daily-context/discomfort/readiness/progression policy remains.
18. Stage 5D progression authority/idempotency remains.
19. Canonical tab order remains Today → Plan → Progress → Explore.
20. No unrelated product behavior changes.
21. No unrelated user work is reverted.
22. No package install or lockfile modification occurs.
23. No commit/staging/branch/push occurs.

## Acceptance criteria

Do not mark Stage 5E verified unless all are true:

1. The exact app TypeScript gate passes.

2. App source/tests remain genuinely covered.

3. The website is separated as a standalone TypeScript project.

4. The stale AppSettings fixture is fixed without weakening its type.

5. SettingsScreen is fixed without `any` or suppression.

6. Stage 5E targeted tests pass.

7. Full Jest passes.

8. Expo config passes.

9. `git diff --check` passes.

10. No new warning appears without explanation.

11. Stage 5E logic remains unchanged or any required logic change is proven by tests.

12. Stage 5D and navigation regressions remain green.

13. No unrelated user work is reverted or overwritten.

14. No packages are installed.

15. No lockfile is changed by this task.

16. No commit, staging, branch, or push occurs.

## Stage decisions

At the end of the report, state exactly one:

- `APP TYPESCRIPT BOUNDARY VERIFIED`
- `APP TYPESCRIPT BOUNDARY BLOCKED`

Also state exactly one:

- `STAGE 5E VERIFIED`
- `STAGE 5E VERIFICATION BLOCKED`

Also state exactly one:

- `STAGE 5F UNBLOCKED`
- `STAGE 5F BLOCKED`

Use `STAGE 5E VERIFIED` and `STAGE 5F UNBLOCKED` only if:

- root app typecheck is green;
- Stage 5E targeted tests are green;
- full Jest is green;
- Expo config is green;
- diff-check is green;
- no P0/P1 Stage 5E defect remains.

Also state:

- `STAGE 5F REQUIRED`
- `STAGE 5G REQUIRED`
- `STAGE 5 REMEDIATION STILL REQUIRED`
- `BETA AUTOMATIC PLAN GENERATION BLOCKED`
- `STAGE 4 REMEDIATION STILL REQUIRED`
- `STAGE 3D-B REQUIRED`

Do not declare beta readiness.

## Final Codex response

Return a concise summary containing:

- Verification report path.
- Whether production code changed.
- Exact initial TypeScript blockers.
- AppSettings fixture fix.
- SettingsScreen fix.
- Root app TypeScript boundary.
- Website TypeScript boundary.
- App compiler coverage proof.
- Website typecheck result or reason not run.
- Confirmation that strictness was not weakened.
- Files changed.
- Tests/config changed.
- Stage 5E targeted result.
- Focused Settings/Explore result.
- Full-suite result.
- App typecheck result.
- Expo config result.
- `git diff --check` result.
- Confirmation that Stage 5A–5E, Stage 4A/4B, Stage 3D, Stage 5D, and canonical tab-order protections remain.
- Remaining Stage 5 blockers.
- `APP TYPESCRIPT BOUNDARY VERIFIED` or blocked.
- `STAGE 5E VERIFIED` or verification blocked.
- `STAGE 5F UNBLOCKED` or blocked.
- `STAGE 5F REQUIRED`.
- `STAGE 5G REQUIRED`.
- `STAGE 5 REMEDIATION STILL REQUIRED`.
- `BETA AUTOMATIC PLAN GENERATION BLOCKED`.
- `STAGE 4 REMEDIATION STILL REQUIRED`.
- `STAGE 3D-B REQUIRED`.
- Initial and final Git status.
- Complete files-changed inventory.
- Any concurrent external changes.
- Confirmation that no package install, lockfile change, commit, staging, branch, or push occurred.
