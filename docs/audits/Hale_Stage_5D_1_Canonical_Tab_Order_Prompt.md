You are implementing Stage 5D.1 of Hale’s production-readiness work:

CANONICAL TAB ORDER ALIGNMENT, NAVIGATION-CONSISTENCY HARDENING, AND STAGE 5D FULL-SUITE SIGN-OFF

This is a narrow navigation remediation and verification task.

The product owner has explicitly approved the canonical bottom-tab order:

TODAY → PLAN → PROGRESS → EXPLORE

This order is final for the current product.

Do not begin Stage 5E, Stage 5F, Stage 5G, Stage 5H, Stage 3D-B, further Stage 4 remediation, beta-device validation, or unrelated UI redesign in this task.

## Required prior reading

Read these documents before changing code:

- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5D.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5C.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5B_1.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5B.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5A.md

Also inspect the current navigation implementation, route definitions, tests, and every caller that refers to bottom-tab order.

Treat the current working tree as the source of truth.

## Why this task exists

Stage 5D’s progression-authority implementation passed:

- 16 targeted suites / 182 tests;
- typecheck;
- Expo config;
- git diff --check.

The full suite was blocked by one unrelated navigation mismatch:

```text
Expected: ["today", "plan", "progress", "explore"]
Received: ["today", "plan", "explore", "progress"]
```

The product owner has now confirmed that the intended order is:

```text
today
plan
progress
explore
```

This task must make that order canonical and consistent throughout the app, then rerun the full Stage 5D validation.

## Primary objective

Create one authoritative bottom-tab configuration so that all user-visible navigation, route metadata, tests, accessibility ordering, and tab-selection logic consistently use:

1. Today
2. Plan
3. Progress
4. Explore

Then prove:

- the visual bottom-tab order matches;
- route identifiers map to the correct labels/icons/screens;
- no stale `today, plan, explore, progress` ordering remains;
- direct navigation still opens the intended screen;
- initial/default tab behavior remains correct;
- Stage 5D’s progression changes remain intact;
- the full suite is green.

## Scope boundary

This task may change:

- bottom-tab configuration;
- tab-order constants;
- route metadata associated with bottom tabs;
- TabBar rendering;
- navigation type definitions if needed;
- tab-order tests;
- focused integration tests for route mapping/order;
- narrow accessibility labels/positions tied to order;
- documentation/report for this task.

This task must not change:

- the visual design of tab icons;
- screen content;
- screen layouts;
- Stage 5D progression logic;
- Stage 5C planning-result behavior;
- Stage 5A/5B credit semantics;
- exercise catalogue;
- scoring;
- norms;
- Check-Up logic;
- backend logic;
- onboarding flow;
- authentication;
- unrelated navigation stacks;
- broad app navigation architecture;
- dependencies;
- assets.

Do not perform opportunistic refactors.

## Locked product rules

### 1. Canonical order

The bottom tabs must render in exactly this order:

```ts
['today', 'plan', 'progress', 'explore']
```

User-facing labels must be:

```text
Today
Plan
Progress
Explore
```

### 2. Route-to-screen mapping

The canonical routes must map as follows:

- `today` -> Today screen
- `plan` -> Plan screen
- `progress` -> Progress screen
- `explore` -> Explore screen

Do not swap route keys merely to achieve visual order.

### 3. Route-to-icon mapping

Preserve each tab’s intended icon:

- Today icon remains associated with Today.
- Plan icon remains associated with Plan.
- Progress icon remains associated with Progress.
- Explore icon remains associated with Explore.

Do not exchange icon identities while reordering.

### 4. Default/initial tab

Preserve Today as the initial/default selected tab unless the current product has an explicit persisted/deep-linked selection.

Cold start should open Today through the existing lifecycle behavior.

### 5. Direct navigation

Existing calls such as navigating to:

- Today
- Plan
- Progress
- Explore

must still land on the corresponding screen after the order fix.

Order must not be used as a substitute for route identity.

### 6. Persisted selection and deep links

If the app persists a selected tab or restores one from navigation state:

- route identity remains authoritative;
- changing the order must not turn a previously selected `progress` route into `explore`;
- unknown/stale tab values fail safely to Today;
- no index-only persistence should silently point to the wrong screen.

If no persistence exists, document that.

### 7. Accessibility

Screen-reader traversal and tab-position announcements should reflect:

1 of 4 Today
2 of 4 Plan
3 of 4 Progress
4 of 4 Explore

Where React Native/platform accessibility derives this automatically, ensure render order produces the correct result.

Do not add noisy custom announcements unless needed.

### 8. One source of truth

Prefer one canonical typed tab configuration, conceptually:

```ts
export const BOTTOM_TABS = [
  { key: 'today', label: 'Today', ... },
  { key: 'plan', label: 'Plan', ... },
  { key: 'progress', label: 'Progress', ... },
  { key: 'explore', label: 'Explore', ... },
] as const;
```

Use the existing architecture if it already has an equivalent.

Avoid separate independent arrays for:

- order;
- labels;
- icons;
- screens;
- tests.

Tests should consume or validate the production configuration rather than reimplementing a conflicting order.

## Working-tree safety

Before editing:

1. Run:

   `git status --short --untracked-files=all`

   `git diff --name-only`

   `git diff --stat`

2. Record exact outputs in the report.

3. Treat all existing changes as user-owned.

4. Inspect the current diffs in every navigation file this task may touch.

5. Do not revert or overwrite unrelated UI work.

6. Do not use destructive Git commands.

7. Do not install packages.

8. Do not stage, commit, create a branch, or push.

9. If unrelated files change during the task:
   - record them;
   - do not overwrite them;
   - continue only if task-owned files remain safe;
   - otherwise stop production mutation and report the conflict.

## Step 1: Trace the current navigation architecture

Inspect at minimum:

- src/navigation/TabBar.tsx
- src/navigation/icons.tsx
- src/navigation/__tests__/TabBar.test.ts
- App.tsx
- any route/tab type definitions
- any navigation constants/config
- TodayScreen
- PlanScreen
- ProgressScreen
- ExploreScreen
- tests that reference:
  - `today`
  - `plan`
  - `progress`
  - `explore`
  - tab order
  - selected tab
  - route index
  - navigation state
  - accessibility labels.

Search the repository for:

```text
today, plan, explore, progress
today, plan, progress, explore
['today'
"today"
TabBar
activeTab
selectedTab
tabOrder
bottomTabs
navigateToTab
setActiveTab
```

Document:

- current source of tab order;
- current route union;
- current labels;
- current icon mapping;
- current screen mapping;
- current selected-tab/default behavior;
- whether selection is stored by route key or index;
- every stale alternative order found.

Do not edit until this trace is complete.

## Step 2: Establish one canonical tab configuration

Create or harden one production source of truth containing:

```text
Today
Plan
Progress
Explore
```

Requirements:

- typed route keys;
- stable route identity;
- stable labels;
- stable screen mapping;
- stable icon mapping;
- canonical order;
- no duplicate route keys;
- no missing route;
- no route included twice;
- no index-dependent screen swap.

Use this configuration to drive the actual TabBar render where practical.

Do not introduce a large navigation-framework migration.

## Step 3: Fix the rendered order

Ensure the actual bottom navigation renders:

```text
Today | Plan | Progress | Explore
```

Confirm:

- visual order;
- touch targets;
- active indicator;
- icons;
- labels;
- route callbacks.

Do not modify unrelated styling.

## Step 4: Fix all stale order assumptions

Update every production/test assumption that still uses:

```text
Today → Plan → Explore → Progress
```

This may include:

- arrays;
- snapshots;
- route-index maps;
- accessibility order;
- test fixtures;
- comments;
- navigation helper logic.

Do not blindly replace text in unrelated copy.

## Step 5: Harden route identity against order changes

Inspect whether any code stores or passes numeric tab indices.

If index-only state exists:

- migrate current in-memory logic to route keys where narrow and safe;
- add a compatibility mapping only if needed;
- unknown/out-of-range values fail safely to Today;
- do not allow order changes to open the wrong screen.

If the app already uses route keys, add tests proving the order does not alter identity.

## Step 6: Verify navigation entrypoints

Test or trace:

- cold start -> Today;
- tapping Today -> Today;
- tapping Plan -> Plan;
- tapping Progress -> Progress;
- tapping Explore -> Explore;
- Programmatic navigation to each route;
- returning from nested screens;
- settings/profile back behavior if it returns to a tab;
- lifecycle routing that selects Today/Plan/Progress;
- any CTA that navigates to Progress or Explore.

Confirm that moving Progress before Explore does not break route targets.

## Step 7: Accessibility verification

Verify:

- render/traversal order matches canonical order;
- accessibility labels still match the correct tab;
- selected state is announced for the correct tab;
- no duplicate labels;
- icon-only controls have appropriate labels if current architecture requires them.

Add focused tests where current test utilities support this.

## Step 8: Navigation tests

At minimum, tests must assert:

1. Canonical production order is exactly:

```ts
['today', 'plan', 'progress', 'explore']
```

2. Labels correspond exactly:

```ts
['Today', 'Plan', 'Progress', 'Explore']
```

3. Each route maps to the intended screen.

4. Each route maps to the intended icon.

5. Today is default.

6. Selecting each tab calls the route callback with the correct key.

7. Progress renders before Explore.

8. No duplicate/missing tab routes.

9. Unknown tab identity fails safely where applicable.

10. Reordering does not alter route-to-screen identity.

Avoid a test that has its own duplicated hard-coded config but does not exercise production configuration.

## Step 9: Stage 5D regression verification

Do not modify Stage 5D progression logic.

Run the focused Stage 5D suites from its report:

- progressionEvidence;
- sessionPlanning;
- mainPlanEvents;
- focusStimulusEvidence;
- sessionWorkEvidence;
- haleFlow/appLifecycle;
- workoutGeneration;
- validTimeProgression;
- training store/progression;
- adherence;
- completion feedback;
- training-state sync;
- restore;
- session sync.

Confirm:

- authoritative `ladderProgressById`;
- applied progression event ids;
- idempotency;
- no legacy progression mutation;
- no restore replay.

## Step 10: Full validation

Run targeted navigation tests first.

Then run:

```bash
npm test -- --runInBand
npm run typecheck
npx --no-install expo config --type public
git diff --check
```

Record:

- exact targeted command;
- targeted suite/test counts;
- full suite/test counts;
- snapshots;
- skipped tests;
- typecheck result;
- Expo config result;
- diff-check result;
- Watchman warning;
- Jest open-handle notice;
- Sentry warning;
- any new warnings;
- whether validation changed files.

The Stage 5D full-suite baseline before this fix was:

```text
1 failed, 87 passed, 88 total suites
1 failed, 668 passed, 669 total tests
```

The sole reported failure was TabBar order.

Do not assume that remains the only failure; verify the full current suite.

## Remediation and verification report

Create exactly one new report:

docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5D_1.md

Do not edit prior reports.

The report must contain:

1. Scope.
2. Product-owner navigation decision.
3. Initial Git status.
4. Current navigation architecture.
5. Stale order assumptions found.
6. Canonical source-of-truth implementation.
7. Final visual tab order.
8. Route-to-screen mapping.
9. Route-to-icon mapping.
10. Default/initial tab behavior.
11. Persisted/deep-linked selection behavior.
12. Accessibility order.
13. Files changed.
14. Tests added/changed.
15. Targeted navigation validation.
16. Stage 5D targeted regression result.
17. Full-suite result.
18. Typecheck result.
19. Expo config result.
20. `git diff --check` result.
21. Whether Stage 5D is now fully verified.
22. Whether Stage 5E is unblocked.
23. Initial and final Git status.
24. Concurrent external changes.
25. Confirmation that no commit/staging/branch/push occurred.

## Required invariant outcomes

After Stage 5D.1:

1. Bottom tabs render Today, Plan, Progress, Explore.
2. Production configuration uses the same canonical order.
3. Progress always precedes Explore visually.
4. Route `today` maps to Today.
5. Route `plan` maps to Plan.
6. Route `progress` maps to Progress.
7. Route `explore` maps to Explore.
8. Icon mapping remains correct.
9. Today remains default.
10. Programmatic route navigation remains correct.
11. Persisted route identity cannot be remapped by index order.
12. Accessibility traversal follows canonical order.
13. No stale alternative order remains in production logic.
14. Navigation tests pass.
15. Stage 5D targeted progression tests pass.
16. Full suite passes.
17. Typecheck passes.
18. Expo config passes.
19. `git diff --check` passes.
20. No unrelated app behavior changes.
21. No unrelated user work is reverted.
22. No commit/staging/branch/push occurs.

## Acceptance criteria

Do not mark this task complete unless:

1. One canonical bottom-tab configuration exists or the existing one is clearly authoritative.

2. Actual rendered order is Today → Plan → Progress → Explore.

3. Route/screen/icon mappings are verified.

4. Default Today behavior is verified.

5. Every stale `Today → Plan → Explore → Progress` assumption is removed or documented as non-production historical text.

6. Navigation tests pass.

7. Stage 5D targeted regression passes.

8. Full suite passes.

9. Typecheck passes.

10. Expo config passes.

11. `git diff --check` passes.

12. No new warning appears without explanation.

13. No unrelated user work is reverted or overwritten.

14. No commit, staging, branch, or push occurs.

## Stage decisions

At the end of the report, state exactly one:

- NAVIGATION ORDER ALIGNMENT COMPLETE
- NAVIGATION ORDER ALIGNMENT BLOCKED

Also state exactly one:

- STAGE 5D VERIFIED
- STAGE 5D VERIFICATION BLOCKED

Also state exactly one:

- STAGE 5E UNBLOCKED
- STAGE 5E BLOCKED

Use `STAGE 5D VERIFIED` and `STAGE 5E UNBLOCKED` only if:

- navigation order is correct;
- the full suite is green;
- no Stage 5D progression regression appears.

Also state:

- STAGE 5E REQUIRED
- STAGE 5F REQUIRED
- STAGE 5 REMEDIATION STILL REQUIRED
- BETA AUTOMATIC PLAN GENERATION BLOCKED
- STAGE 4 REMEDIATION STILL REQUIRED
- STAGE 3D-B REQUIRED

Do not declare beta readiness.

## Final Codex response

Return a concise summary containing:

- Report path.
- Production tab order.
- Canonical configuration location.
- Files changed.
- Tests added/changed.
- Route-to-screen verification.
- Route-to-icon verification.
- Default tab verification.
- Persisted/deep-link behavior.
- Accessibility order.
- Targeted navigation result.
- Stage 5D targeted regression result.
- Full-suite result.
- Typecheck result.
- Expo config result.
- `git diff --check` result.
- Confirmation that no Stage 5D progression logic changed.
- NAVIGATION ORDER ALIGNMENT COMPLETE or BLOCKED.
- STAGE 5D VERIFIED or STAGE 5D VERIFICATION BLOCKED.
- STAGE 5E UNBLOCKED or STAGE 5E BLOCKED.
- STAGE 5E REQUIRED.
- STAGE 5F REQUIRED.
- STAGE 5 REMEDIATION STILL REQUIRED.
- BETA AUTOMATIC PLAN GENERATION BLOCKED.
- STAGE 4 REMEDIATION STILL REQUIRED.
- STAGE 3D-B REQUIRED.
- Initial and final Git status.
- Any concurrent external changes.
- Confirmation that no commit, staging, branch, or push occurred.
