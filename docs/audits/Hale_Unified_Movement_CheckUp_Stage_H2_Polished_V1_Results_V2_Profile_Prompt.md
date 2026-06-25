You are implementing the next execution stage of Hale’s approved unified Movement Check-Up architecture:

HALE UNIFIED MOVEMENT CHECK-UP — STAGE H2
POLISHED V1 RESULTS / ONBOARDING-RESULTS VISUAL SHELL + FROZEN V2 MOVEMENT PROFILE ADAPTER

This is a focused presentation-integration stage.

Its purpose is to prove that Hale’s polished current `ResultsScreen` and `OnboardingResultsScreen` visual system can present the existing frozen Movement Profile V2 result, suggested focus, and automatically prepared plan without reusing V1 Movement Age logic.

Do not switch the public/default Check-Up to V2 in this task.

Do not modify measurement protocols, reference tables, focus policy, plan creation, Progress, official retest, reports, or Warden behavior.

## H1 prerequisite and current baseline

Stage H1 is complete.

Required H1 report:

```text
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H1_V1_SHELL_V2_ADAPTER.md
```

Recorded H1 outcomes:

```text
UNIFIED MOVEMENT CHECK-UP STAGE H1 COMPLETE
SHARED POLISHED CHECKUP SHELL IMPLEMENTED
V1 CHECKUPSCREEN VISUAL AND BEHAVIOR PARITY VERIFIED
V2 LIVE COORDINATOR ADAPTER IMPLEMENTED
INTERNAL UNIFIED V2 SHELL FLOW VERIFIED
UNIFIED MOVEMENT CHECK-UP STAGE H2 UNBLOCKED
```

H1 implemented:

- `src/screens/CheckUpRecordingShell.tsx`;
- the public V1 `CheckUpScreen` wrapper using that shell;
- `MovementProfileV2UnifiedCheckUpScreen` using the existing V2 live coordinator and voice runtime;
- an internal unified-V2 Check-Up entry;
- preservation of the standalone V2 Check-Up comparison harness;
- no public routing change.

H1 final validation reportedly passed:

- targeted: 12 suites / 77 tests;
- full Jest: 131 suites / 1,076 tests;
- safety audio: 44 cues / 88 assets;
- Movement Profile V2 audio: 31 cues / 62 assets;
- total audio assets: 150;
- app typecheck;
- website typecheck;
- Expo config;
- Android/iOS export;
- `git diff --check`.

Verify current code and current counts rather than assuming these remain unchanged.

## Founder decisions locked

### Canonical product direction

The future product is one canonical Movement Check-Up:

```text
polished current Check-Up UI
+
V2 live measurement protocols
+
V2 immutable snapshot and assessment
+
raw-first Movement Profile
+
V2 suggested focus or Balanced
+
automatic V2 four-week plan
+
shared Stage 5 lifecycle
```

There must not be two permanent public Check-Up/result systems.

### Results UI authority

The current polished visual language in:

```text
src/screens/ResultsScreen.tsx
src/screens/OnboardingResultsScreen.tsx
```

is the presentation authority for the future Movement Profile.

Preserve the current premium design system:

- page structure;
- background;
- hero/header treatment;
- typography;
- spacing;
- domain-card styling;
- focus-card styling;
- decorative assets;
- radii/borders/shadows;
- buttons;
- safe-area behavior;
- compact-phone behavior;
- accessibility behavior.

Do not redesign these screens.

Do not make V2 merely “similar.” Extract and reuse one shared results presentation system so V1 and V2 wrappers render the same visual components.

### Data authority

For the H2 V2 path, the only result authorities are the already-frozen:

```text
raw V2 Check-Up
movementProfileV2Snapshot
movementProfileV2Assessment
matching V2 MovementBlock / plan-ready state
```

Use the current production V2 parsers, source-binding validators, selectors, and `MovementProfileV2` results view model.

Do not:

- score raw V2 measurements through V1;
- infer Movement Age;
- call V1 focus selection;
- rerun the V2 reference engine;
- rerun V2 focus selection;
- read the current live life goal to rewrite focus;
- read current source tables to recategorise history;
- create the block from the results screen.

### Automatic plan decision

The V2 plan already exists before the result screen is shown.

V2 results must say the plan is ready and use exactly:

```text
View my 4-week plan
```

The CTA only navigates to the already-created plan.

It must not create, regenerate, replace, or start the plan.

The V2 production UI must not say:

```text
Build my plan
Create my plan
Generate my plan
Personalise my plan
```

V1 public behavior remains unchanged during H2. Scope the forbidden-plan-copy guardrail to V2/unified result modules, not historical V1 modules or audit documents.

### No V1-user migration

No real user completed a V1 Check-Up.

Therefore H2 does not need:

- legacy-result migration;
- V1/V2 history comparison;
- a legacy Movement Age section;
- V1-to-V2 conversion;
- mixed V1/V2 trend charts.

Do not delete V1 yet; it remains the public/default route during internal parity verification.

### Warden policy

The intended chair-percentile product policy is approved, but implementation remains deferred.

H2 must not:

- embed Warden parameters;
- add an altered substitute formula;
- enable chair percentile output;
- change chair evidence/focus behavior;
- show a percentile placeholder.

Chair remains raw-only in production.

## What H2 must produce

H2 must result in:

1. One shared polished results presentation system used by:
   - current public V1 `ResultsScreen`;
   - current public V1 `OnboardingResultsScreen`;
   - a new internal unified V2 standard-results wrapper;
   - a new internal unified V2 onboarding-results wrapper or onboarding variant.

2. A protocol-neutral, typed result-presentation view model.

3. A typed result action union.

4. V1 adapters preserving current public V1 visual and behavioral output.

5. A V2 adapter that consumes only the current frozen V2 Movement Profile view model and matching plan state.

6. Correct V2 rendering for:
   - chair raw result;
   - balance raw result and Hale task band;
   - shoulder raw result and eligible IQR category;
   - raw-only states;
   - suggested domain focus;
   - goal-led focus;
   - Balanced focus;
   - plan-ready state;
   - active-block conflict;
   - plan-unavailable/recovery states.

7. Internal routing that lets completed internal V2 flows open the polished unified result presentation.

8. The existing standalone `MovementProfileV2ResultsScreen` retained as an internal reference/comparison harness.

9. No public/default route change.

10. No Progress migration.

11. No reference, focus, snapshot, assessment, block, or Warden-policy change.

## Required prior reading

Read these reports in full:

- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H1_V1_SHELL_V2_ADAPTER.md`
- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H0_HEALTH_GATE.md`
- `docs/audits/HALE_MOVEMENT_CHECKUP_V1_V2_CURRENT_IMPLEMENTATION_AUDIT.md`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2D_2C.md`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2E_A_1.md`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2D_2B.md`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2D_2A.md`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2D_1.md`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2C.md`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2B.md`
- `docs/audits/HALE_PERCENTILE_SCORING_PROTOCOL_DESIGN_STAGE_3D_B_1.md`
- `docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5H.md`

Also inspect:

- `AGENTS.md`;
- `CLAUDE.md`;
- `docs/decisions.md`;
- current diffs in all touched files;
- current V1 result/onboarding result tests;
- current V2 results/view-model tests;
- current V2 block materialisation and plan-state helpers;
- current navigation and internal-gate helpers.

Treat current code, including current untracked production files, as source of truth.

## Scope boundary

This task may change:

- `src/screens/ResultsScreen.tsx`, narrowly;
- `src/screens/OnboardingResultsScreen.tsx`, narrowly;
- a new shared result presentation component/system;
- protocol-neutral result presentation types;
- V1 standard-results adapter;
- V1 onboarding-results adapter;
- V2 standard/onboarding result adapters;
- new internal V2 unified results wrapper screen(s);
- narrow App/internal Settings routing;
- focused tests;
- the H2 report.

This task may consume but must not alter the semantics of:

- V2 `MovementProfileV2` view-model builder;
- V2 snapshot/assessment parsers;
- V2 source-binding validators;
- V2 block materialiser;
- V2 plan-ready selector/state;
- existing domain-detail screen;
- existing recovery classifier/screen.

This task must not change:

- public/default Check-Up routing;
- public onboarding Check-Up routing;
- public official-retest routing;
- Check-Up recording shell;
- V1 scoring/norm/focus logic;
- V2 protocols/live coordinator;
- V2 reference engine/source tables;
- V2 snapshot/assessment schemas;
- V2 focus policy;
- V2 block factory/materialisation;
- Stage 4/5 logic;
- Progress screen/content;
- Block Report;
- official V2 retest;
- reference-details policy;
- Warden transform;
- audio text/assets;
- dependencies;
- lockfiles;
- website;
- fonts/unrelated assets.

Do not perform opportunistic refactors.

# PART A — WORKTREE SAFETY AND BASELINE

## Step 1: Capture exact initial state

Before analysis or editing, run:

```bash
git status --short --untracked-files=all
git diff --name-only
git diff --stat
git ls-files --others --exclude-standard
```

Record exact output in the report.

Rules:

1. Treat all current tracked/untracked changes as user-owned.
2. Inspect current diffs before touching a file.
3. Preserve concurrent design work in Results and Onboarding Results.
4. Do not revert, delete, move, or broadly reformat unrelated work.
5. Do not edit prior reports or `docs/decisions.md`.
6. Do not use destructive Git commands.
7. Do not install packages.
8. Do not modify lockfiles.
9. Do not regenerate audio.
10. Do not stage, commit, branch, push, or open a PR.
11. Do not inspect or expose `.env` values or provider credentials.
12. Do not modify or share font files.
13. If a concurrent change makes safe extraction ambiguous, stop mutation and document the conflict.

## Step 2: Run the current baseline before edits

Run focused tests covering:

- V1 Results;
- V1 Onboarding Results;
- current onboarding result helpers;
- V2 result view model;
- V2 Results screen;
- V2 domain detail;
- V2 block materialisation/plan state;
- V2 snapshot/assessment/history;
- H1 shared Check-Up shell;
- routing/internal gates.

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
rm -rf /tmp/hale-unified-h2-baseline-export
npx --no-install expo export --platform all --output-dir /tmp/hale-unified-h2-baseline-export
rc=$?
rm -rf /tmp/hale-unified-h2-baseline-export
exit $rc
```

Record exact counts and warnings.

If baseline fails for an unrelated concurrent reason:

- do not repair unrelated work;
- continue only if the H2 boundary remains safe;
- otherwise mark H2 blocked.

# PART B — RECONSTRUCT THE CURRENT V1 RESULT SCREENS

## Step 3: Audit `ResultsScreen.tsx`

Document:

- root layout/safe area/scroll ownership;
- header/back behavior;
- hero/result summary;
- domain cards;
- movement-age/product-band copy;
- focus card;
- plan CTA;
- supporting metrics;
- action footer;
- responsive branches;
- accessibility behavior;
- navigation callbacks;
- any block-creation side effect.

Classify every branch as:

- presentation-only;
- V1 scoring interpretation;
- V1 focus logic;
- V1 plan action;
- navigation;
- shared/reusable;
- V1-only and must not appear in V2.

## Step 4: Audit `OnboardingResultsScreen.tsx`

Document:

- layout differences from standard Results;
- onboarding progress/chrome;
- hero/illustration;
- domain cards;
- focus explanation;
- plan CTA;
- next-step copy;
- onboarding state mutation;
- block-creation callback;
- responsive/accessibility behavior.

## Step 5: Record visual-contract invariants

The report must capture exact current token/component sources for:

- page background;
- top spacing/safe area;
- hero/card assets;
- card radius/border/shadow;
- domain icon treatment;
- typography variants;
- focus card;
- CTA style;
- compact-phone breakpoint;
- bottom spacing;
- accessibility labels.

Do not duplicate style literals into a separate V2 tree.

## Step 6: Identify embedded V1 business logic

Inventory every use of:

- `CheckUpScore`;
- Movement Age/ranges;
- `weakestDomain`;
- V1 product bands;
- V1 score snapshot;
- `handleStartPlan`;
- block creation;
- direct rescoring;
- current history selection.

The shared presentation component must not own these.

# PART C — RECONSTRUCT THE CURRENT V2 RESULT FLOW

## Step 7: Audit current V2 result modules

Inspect at minimum:

- `src/movementProfileV2/viewModel.ts`;
- `src/screens/MovementProfileV2ResultsScreen.tsx`;
- current domain-detail screen/component;
- current V2 recovery classifier/screen;
- V2 artifact selectors;
- V2 block materialisation/plan state;
- App result routing.

Document:

- exact view-model union/statuses;
- domain-card fields;
- focus plan modes/reasons;
- plan-ready fields;
- reference-detail fields;
- source binding;
- recovery statuses;
- current CTA behavior;
- whether any screen recomputes interpretation/focus.

## Step 8: Verify frozen authority

Prove current V2 result presentation can be produced solely from:

- accepted source Check-Up;
- parsed V2 snapshot;
- parsed V2 assessment;
- matching current V2 block/plan readiness.

If current `MovementProfileV2ResultsScreen` reads live profile/life goal only for display, document it.

If it recalculates historical interpretation or focus, H2 must stop and report a P1 conflict rather than silently copying the defect.

## Step 9: Inventory V2 result copy

Record exact current copy for:

- chair raw-only;
- chair no-comparison reason;
- balance task bands;
- balance benchmark detail;
- shoulder below/within/above IQR;
- shoulder raw-only;
- domain suggested focus;
- goal-led focus;
- Balanced;
- plan ready;
- active-block conflict;
- missing/malformed artifacts;
- caveat.

Use current approved canonical text where present.

Do not create a second inconsistent copy table.

# PART D — SHARED POLISHED RESULT PRESENTATION SYSTEM

## Step 10: Extract one shared result shell

Create one shared presentation system with a repository-consistent name, such as:

```text
CheckUpResultsShell
MovementProfileResultsShell
UnifiedCheckUpResultsShell
```

It must support visual variants:

```text
standard
onboarding
```

Both current V1 wrappers and new internal V2 wrappers must render this same component/system.

Do not copy the complete JSX/styles into separate V1 and V2 screens.

The shared system may contain smaller shared components, for example:

- result hero/header;
- domain result card;
- focus card;
- plan-ready card;
- caveat;
- actions/footer.

## Step 11: Shell ownership

The shell may own only:

- layout;
- styles;
- visual variants;
- rendering supplied text/data;
- accessibility presentation;
- forwarding typed actions.

The shell must not:

- score raw Check-Ups;
- infer Movement Age;
- select focus;
- read source tables;
- parse snapshots;
- build assessments;
- create blocks;
- sync;
- select current history;
- navigate directly;
- import V1 scoring or V2 reference engine.

## Step 12: Preserve exact V1 visual output

The extraction must not intentionally change current public V1:

- layout;
- copy;
- styles;
- card order;
- assets;
- animations;
- CTA behavior;
- onboarding progression;
- result interpretation;
- navigation.

Move current rendering into the shared system without redesign.

Avoid broad formatting that makes parity impossible to review.

# PART E — PROTOCOL-NEUTRAL RESULT PRESENTATION CONTRACT

## Step 13: Add a typed pure view model

Conceptual shape:

```ts
type UnifiedCheckUpResultsPresentation = {
  variant: 'standard' | 'onboarding';

  header: {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    completedAtLabel?: string;
  };

  domains: readonly [
    UnifiedDomainResultCard,
    UnifiedDomainResultCard,
    UnifiedDomainResultCard,
  ];

  focus: UnifiedFocusPresentation;

  plan: UnifiedPlanPresentation;

  caveat?: string;

  actions: readonly UnifiedResultsActionViewModel[];

  recovery?: UnifiedResultsRecoveryPresentation;

  accessibility: {
    screenSummary: string;
    announcementKey?: string;
  };
};
```

A domain card may include:

```ts
type UnifiedDomainResultCard = {
  id: 'strength_power' | 'balance_stability' | 'mobility_flexibility';
  title: string;
  metricLabel: string;
  metricValue: string;
  interpretation?: string;
  detailActionAvailable: boolean;
  tone: 'neutral' | 'attention' | 'informational';
  iconToken: string;
};
```

Adapt to current domain naming/types.

Requirements:

- pure/JSON-safe;
- no React elements;
- no functions;
- no `Date`;
- no NaN/infinity;
- stable domain/action order;
- no raw artifacts;
- no internal IDs/fingerprints in visible fields;
- no navigation target;
- no implicit block creation state.

## Step 14: Add a typed action union

Conceptually:

```ts
type UnifiedCheckUpResultsAction =
  | { type: 'view_domain_detail'; domain: MovementDomain }
  | { type: 'view_plan' }
  | { type: 'done' }
  | { type: 'retry_checkup' }
  | { type: 'finish_movement_profile' }
  | { type: 'view_saved_profile' };
```

Adapt to actual current actions.

Requirements:

- stable action IDs;
- disabled state explicit;
- shell emits actions only;
- wrapper owns navigation/side effects;
- `view_plan` never creates a block;
- unavailable actions cannot be emitted.

# PART F — V1 ADAPTERS AND PUBLIC NON-REGRESSION

## Step 15: Add a V1 standard-results adapter

Map current V1 inputs to the shared presentation exactly.

Preserve:

- Movement Age/product-band wording;
- V1 focus wording;
- current CTA;
- current block-creation callback;
- supporting values;
- current recovery/incomplete behavior.

Do not “improve” or soften V1 during H2.

## Step 16: Add a V1 onboarding-results adapter

Map current onboarding inputs to the onboarding visual variant exactly.

Preserve:

- onboarding progression;
- current hero/copy;
- current plan CTA;
- current onboarding state transition;
- V1 block creation.

## Step 17: Keep public wrappers stable

`ResultsScreen` and `OnboardingResultsScreen` must retain their current public props/callback contracts unless a narrow internal extraction requires a backward-compatible change.

Public App routes must still mount the V1 wrappers.

## Step 18: V1 parity tests

Cover current V1 states, including:

- complete three-domain result;
- incomplete/invalid;
- each focus domain;
- tie/near-tie copy where visible;
- product bands;
- result details;
- standard results CTA;
- onboarding results CTA;
- block ineligible/recovery;
- compact layout;
- accessibility labels.

Where possible render through the actual wrappers and shared shell.

# PART G — FROZEN V2 PRESENTATION ADAPTER

## Step 19: Consume the current V2 view model, not raw metrics directly

Preferred architecture:

```text
accepted Check-Up + snapshot + assessment
-> existing buildMovementProfileV2ResultsViewModel(...)
-> H2 V2 presentation adapter
-> shared polished results shell
```

The H2 adapter must not bypass the current V2 view model to reinterpret raw fields.

If plan readiness is separate, combine only a validated matching V2 plan state.

## Step 20: Strict source and block binding

Before rendering ready V2 results, verify through existing helpers:

- Check-Up is V2;
- snapshot binds to Check-Up;
- assessment binds to snapshot/Check-Up;
- matching V2 block origin binds to assessment/snapshot when plan is shown;
- same-ID conflicts fail closed;
- unsupported/future artifacts route to recovery.

Do not show `Your 4-week plan is ready` for an unrelated active block.

## Step 21: Adapter non-authority

The adapter must not:

- call `interpretMovementProfileV2`;
- derive domain evidence;
- select suggested focus;
- inspect current life goal;
- invoke block materialisation;
- inspect current reference tables;
- infer missing reference claims;
- compare previous/current profiles.

# PART H — EXACT V2 RESULT MAPPING

## Step 22: Header and summary

Canonical title:

```text
Your Movement Profile
```

Use the current frozen V2 date/completion label.

Do not display:

- V2;
- internal;
- beta version number;
- Movement Age;
- body age.

The existing summary caveat should remain materially equivalent to:

```text
Where available, comparisons use published reference groups and the setup recorded during your Check-Up. Hale’s camera results are beta estimates, not medical assessments.
```

Use the current canonical V2 copy if it differs.

## Step 23: Chair / Strength card

Render through the polished domain-card style.

Primary raw metric:

```text
<N> rises in 30 seconds
```

Production interpretation remains raw-only.

Use current canonical copy, such as:

```text
Saved as your personal baseline
```

or:

```text
Saved without a published comparison
```

according to the frozen V2 view model.

Requirements:

- no V1 age range;
- no V1 band;
- no percentile;
- no Warden placeholder;
- no “weak”/“strong” inference;
- no focus inference from rep magnitude in H2.

If the existing future-compatible view model contains a legitimate frozen percentile-range kind, render only what the accepted view model supplies; do not enable/create it.

## Step 24: Balance card

Render:

- best valid hold seconds;
- exact current frozen task-band label.

Current task-band concepts:

```text
A clear place to build
Starting point
Building the hold
Full 45-second hold completed
```

Use current canonical text from the V2 view model.

Do not:

- show a percentile;
- call the task band a published norm;
- infer below/above from the Springer mean;
- calculate distance from benchmark.

Domain detail action may continue to open the existing V2 domain-detail screen.

## Step 25: Shoulder / Mobility card

Render:

- raw active reach degrees;
- current frozen IQR interpretation when eligible;
- raw-only explanation otherwise.

Current concepts:

```text
Below the published middle range
Within the published middle range
Above the published middle range
```

Requirements:

- `Above` remains neutral;
- no trophy/up arrow/success color solely for above range;
- pain-limited/reference-ineligible remains raw-only;
- selected side may appear in detail, not as internal metadata.

## Step 26: Domain card tone

Do not convert V2 evidence into green/red pass/fail semantics.

Allowed tones:

- neutral;
- informational;
- attention.

A `below_reference` or Hale starting-point state may receive restrained attention styling, but must not appear as failure/danger/diagnosis.

# PART I — SUGGESTED FOCUS MAPPING

## Step 27: Domain focus

Use the frozen assessment.

Example:

```text
Suggested focus
Balance
This was the clearest area to build from today’s Check-Up.
```

Use current plan-mode/reason-to-copy resolver.

Do not expose:

- candidate scores;
- policy reason codes;
- weakest domain;
- scientific certainty.

## Step 28: Goal-led focus

Use the current canonical explanation, materially equivalent to:

```text
Your results were broadly matched, so Hale used your goal to guide the suggestion.
```

Do not read the current live goal to generate this.

## Step 29: Balanced focus

Render as a first-class focus:

```text
Suggested focus
Balanced
Your results did not point to one clear area today.
```

Do not:

- add Balanced to `MovementDomain`;
- display Strength as a hidden fallback;
- use a generic domain icon that implies one domain won.

# PART J — PLAN-READY STATE

## Step 30: Ready matching V2 block

Render:

```text
Your 4-week plan is ready
Hale prepared it from your Movement Profile.
```

Exact CTA:

```text
View my 4-week plan
```

The action only navigates to the existing matching block intro/Plan.

Tests must prove the action does not call:

- V2 block factory;
- block materialiser;
- upsert;
- sync;
- start session.

## Step 31: Domain plan supporting copy

Use current canonical copy, materially equivalent to:

```text
The plan gives extra attention to balance while still training strength and mobility.
```

Map the domain from the frozen assessment/block.

## Step 32: Balanced plan supporting copy

Use current canonical copy, materially equivalent to:

```text
Your plan gives strength, balance, and mobility equal attention across each week.
```

Do not claim every individual session is evenly split; the balanced block rotates primary domains A/B/C.

## Step 33: Local ready / sync pending

If a matching V2 block exists locally and remote sync is pending:

- treat the plan as ready;
- permit `View my 4-week plan`;
- do not show a blocking error;
- use a small non-alarming sync state only if current product patterns require it.

## Step 34: Active-block conflict

When another active block prevented V2 block creation:

- still show the Movement Profile;
- do not claim the new plan is ready;
- use calm copy materially equivalent to:

```text
Your current plan is unchanged.
You can still view this Movement Profile in Progress.
```

Do not offer silent replacement.

## Step 35: Plan unavailable/recovery

When artifacts are valid but plan creation is unavailable:

- show the Movement Profile;
- show typed recovery;
- do not show `View my 4-week plan`;
- do not retry block creation from the result screen unless the existing application service explicitly owns a safe retry action outside rendering.

# PART K — INTERNAL V2 WRAPPERS AND ROUTING

## Step 36: Add internal unified V2 results wrappers

Create one or two thin wrappers, for example:

```text
MovementProfileV2UnifiedResultsScreen
MovementProfileV2UnifiedOnboardingResultsScreen
```

or one wrapper with a strict `variant`.

Responsibilities:

- select accepted source artifacts through existing selectors;
- build existing V2 result view model;
- resolve matching plan state;
- map to shared shell;
- dispatch typed navigation actions;
- route typed recovery.

They must not create/recompute artifacts or blocks.

## Step 37: Internal flow routing

After successful internal V2 materialisation, route the normal internal unified flow to the H2 polished result presentation.

Use an explicit typed internal route.

Do not change:

- public V1 results route;
- public onboarding results route;
- public Check-Up route.

## Step 38: Retain the standalone V2 result harness

Keep the current:

```text
MovementProfileV2ResultsScreen
```

reachable internally for comparison/debugging.

It may be reached through a narrow developer/internal action for the same latest valid V2 artifact.

Do not delete it.

Do not make it public.

Document:

- unified polished V2 result path;
- standalone V2 reference result path.

## Step 39: Internal gate

H2 unified V2 results require the existing exact internal V2 gate.

Requirements:

- default unavailable;
- malformed/missing flag false;
- no backend/profile/restore authority;
- no public deep link;
- disabling gate leaves stored V2 artifacts readable by parsers but hides internal launch routes.

# PART L — ONBOARDING VISUAL VARIANT

## Step 40: V2 onboarding-result variant

For a V2 `baseline` internal flow, use the polished onboarding result visual variant.

It may show:

- the Movement Profile;
- suggested focus;
- plan-ready state;
- onboarding-style progress/chrome.

It must not:

- mutate public onboarding state;
- mark public onboarding complete;
- replace the public V1 baseline;
- create another block;
- use a `Build my plan` CTA.

## Step 41: Standard V2 variant

For baseline-retake or internal non-onboarding display, use the polished standard result visual variant.

Official V2 retest UI remains out of scope.

# PART M — DOMAIN DETAIL AND RECOVERY

## Step 42: Reuse the existing V2 detail screen

The shared result cards may emit:

```text
view_domain_detail(domain)
```

Route to the existing V2 domain-detail implementation.

Do not recreate chair/balance/shoulder source explanations inside the shared shell.

Do not expose internal IDs/fingerprints.

## Step 43: Reuse typed V2 recovery

Use the current recovery classifier/screen for:

- raw complete missing snapshot;
- snapshot missing assessment;
- malformed/mismatched snapshot;
- malformed/mismatched assessment;
- immutable conflict;
- unsupported future artifact;
- raw incomplete;
- sync pending local ready.

The H2 result wrapper may render a polished recovery card within the shared visual language when appropriate, but it must use existing classification and actions.

Do not overwrite frozen artifacts.

# PART N — RESPONSIVE AND ACCESSIBLE UX

## Step 44: Responsive parity

Verify:

- compact phones;
- standard Android;
- large phone;
- safe-area;
- text scaling;
- long raw-only/reference copy;
- Balanced copy;
- active-block conflict;
- three domain cards;
- plan-ready CTA.

Use current responsive/theme helpers.

Do not add a second breakpoint system.

## Step 45: Accessibility

Required:

- title announced once;
- each domain card reads domain, raw metric, and interpretation;
- `Above the published middle range` is not announced as success;
- focus card reads focus and explanation;
- plan CTA clearly says it opens an existing plan;
- disabled/unavailable action states are announced;
- no color-only meaning;
- minimum touch targets preserved;
- detail actions have labels;
- compact copy remains understandable at large text sizes.

# PART O — COPY GUARDRAILS

## Step 46: V2 result forbidden terms

Scope guardrails to new V2/unified presentation modules.

Disallow:

- Movement Age;
- Body Age;
- typical of age;
- weakest domain/system;
- scientifically weakest;
- diagnosis;
- fall risk;
- impairment;
- pass/fail;
- improved;
- declined;
- younger;
- older;
- exact chair percentile;
- balance percentile;
- normal range for balance;
- `Above` equals better;
- Build my plan;
- Create my plan;
- Generate my plan;
- Personalise my plan.

Do not break historical V1 tests/docs by globally banning their current copy.

## Step 47: No version/internal copy

User-facing H2 V2 output must not show:

- V2;
- schema version;
- policy version;
- fingerprint;
- source ID;
- internal beta route;
- developer;
- diagnostics.

# PART P — ARCHITECTURE BOUNDARIES

## Step 48: Shared shell import guard

The shared result presentation modules must not import:

- `src/scoring/*`;
- V2 reference engine/source tables;
- V2 snapshot/assessment builders;
- V2 block factory/materialiser;
- backend services;
- history store;
- App navigation.

Wrappers/adapters own data acquisition and action dispatch.

## Step 49: V2 adapter import guard

The V2 adapter may import:

- accepted V2 display/view-model types;
- domain/focus display enums;
- pure formatting helpers;
- plan-state display types.

It must not import V1 scoring or raw V2 interpretation engines.

## Step 50: No results-side block creation

Add an architecture test/source guard proving new H2 result screens do not import or call:

- `createMovementBlockFromMovementProfileV2Assessment`;
- `materializeMovementProfileV2Block`;
- block upsert/sync;
- plan creation handlers.

# PART Q — REQUIRED TEST MATRIX

## A. Shared presentation system

- one shared shell/system;
- standard variant;
- onboarding variant;
- V1 and V2 wrappers use it;
- no copied complete layout;
- no protocol/scoring imports.

## B. V1 standard parity

- complete result;
- incomplete result;
- each domain focus;
- current age/product-band copy;
- current CTA;
- current callback behavior;
- current detail behavior;
- current responsive/accessibility behavior.

## C. V1 onboarding parity

- current hero/chrome;
- complete/incomplete;
- each focus;
- current CTA;
- current onboarding mutation;
- current layout.

## D. V2 chair mapping

- valid raw-only baseline;
- setup uncertain;
- protocol incomplete;
- tracking uncertain;
- no comparison;
- no percentile/age copy.

## E. V2 balance mapping

- starting-point-low;
- starting-point;
- building;
- ceiling complete;
- raw-only;
- benchmark available only through detail;
- no percentile/range.

## F. V2 shoulder mapping

- below;
- within;
- above neutral;
- raw-only profile incomplete;
- pain limited;
- selected side detail action.

## G. V2 focus

- clear domain;
- Hale-band domain;
- goal-led;
- Balanced;
- no weakest copy;
- no current-life-goal recomputation.

## H. V2 plan state

- created ready;
- reused ready;
- local ready/sync pending;
- domain plan copy;
- balanced plan copy;
- active-block conflict;
- plan unavailable;
- CTA exact;
- CTA navigation only;
- no block creation.

## I. V2 artifact failure

- missing snapshot;
- missing assessment;
- source mismatch;
- malformed/future artifact;
- immutable conflict;
- recovery routing;
- no partial fabricated display.

## J. Internal routing

- H2 route hidden when flag false;
- visible when exact flag true;
- successful internal V2 flow reaches H2 unified result;
- standalone V2 result harness remains reachable;
- public V1 results unchanged;
- public onboarding results unchanged.

## K. Domain detail

- V2 cards open existing detail screen;
- no duplicated reference logic;
- internal IDs hidden.

## L. Copy guardrails

- prohibited V2 terms absent;
- exact `View my 4-week plan`;
- no Build/Create/Generate/Personalise plan copy;
- above shoulder range neutral;
- caveat present.

## M. Responsive/accessibility

- compact width;
- large text;
- long copy;
- balanced plan;
- conflict state;
- semantic labels;
- no color-only interpretation.

## N. Product containment

- no Progress change;
- no public route change;
- no V1 scoring change;
- no V2 protocol/reference/focus/block change;
- no Warden change;
- no audio generation.

## O. Regression

- H0;
- H1;
- V1 result/onboarding flow;
- V2 view model/artifact chain;
- V2 automatic block;
- Stage 4;
- Stage 5H;
- navigation;
- TypeScript boundaries;
- safety/V2 audio.

## Test-quality requirements

Tests must:

- exercise production adapters and shell;
- use real parsed/frozen V2 artifacts;
- use current production V2 view-model builder;
- use matching real V2 block metadata;
- use deterministic IDs/timestamps;
- test actual wrappers with current React Native test utilities;
- assert the V2 CTA has no creation side effect;
- assert V1 output remains unchanged;
- assert no input mutation.

Tests must not:

- mock every layer;
- assert only helper calls;
- use camera hardware;
- use network;
- install packages;
- regenerate audio;
- embed Warden data;
- change focus/claim policy;
- use giant snapshots as the only proof.

# PART R — VALIDATION

## Step 51: Targeted validation

Run focused tests for:

- shared result shell/system;
- V1 Results adapter/wrapper;
- V1 Onboarding Results adapter/wrapper;
- V2 presentation adapter;
- V2 unified result wrappers;
- V2 result view model;
- V2 domain detail;
- V2 recovery;
- V2 block plan state;
- internal routing/gate.

Record exact command and counts.

## Step 52: Full required validation

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
rm -rf /tmp/hale-unified-h2-export
npx --no-install expo export --platform all --output-dir /tmp/hale-unified-h2-export
rc=$?
rm -rf /tmp/hale-unified-h2-export
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
- asset count;
- `git diff --check`;
- Watchman warning;
- Jest open-handle notice;
- Sentry warning;
- any new warning;
- whether validation changed files.

# PART S — MANUAL SOFTWARE TRACE

After automated validation, trace:

## Public V1 standard

```text
public V1 result route
-> ResultsScreen wrapper
-> shared polished result shell
-> V1 adapter
-> unchanged V1 CTA/behavior
```

## Public V1 onboarding

```text
public onboarding result route
-> OnboardingResultsScreen wrapper
-> shared polished onboarding result variant
-> V1 adapter
-> unchanged onboarding behavior
```

## Internal unified V2

```text
internal H1 V2 Check-Up
-> existing reference-details/materialisation
-> frozen snapshot + assessment + block
-> existing V2 result view model
-> H2 V2 adapter
-> shared polished result shell
-> View my 4-week plan
```

## Standalone V2 reference harness

```text
internal comparison action
-> existing MovementProfileV2ResultsScreen
```

Confirm all four paths and no public cutover.

# PART T — REPORT

Create exactly one report:

```text
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H2_V1_RESULTS_SHELL_V2_PROFILE.md
```

Do not edit prior reports or `docs/decisions.md`.

The report must contain:

1. Scope.
2. H1 prerequisite evidence.
3. Founder decisions carried forward.
4. Initial Git status.
5. Baseline validation.
6. Current V1 Results architecture.
7. Current V1 Onboarding Results architecture.
8. Current V2 result/view-model architecture.
9. Visual-contract inventory.
10. Shared result presentation system.
11. Protocol-neutral view model.
12. Result action union.
13. V1 standard adapter.
14. V1 onboarding adapter.
15. V1 visual/behavior parity.
16. V2 frozen-artifact adapter.
17. Chair mapping.
18. Balance mapping.
19. Shoulder mapping.
20. Suggested-focus mapping.
21. Balanced mapping.
22. Plan-ready mapping.
23. Active-block conflict/recovery.
24. Internal routing.
25. Existing V2 reference-results harness.
26. Domain-detail reuse.
27. Responsive/accessibility.
28. Copy guardrails.
29. Architecture boundaries.
30. Product containment.
31. Files changed.
32. Tests added/changed.
33. Exact targeted validation.
34. Exact full validation.
35. Audio verification.
36. App/website typechecks.
37. Expo config/export.
38. H0/H1/Stage 3D-B/Stage 4/Stage 5 regression.
39. Remaining unified migration work.
40. Whether H3 is unblocked.
41. Initial/final Git status.
42. Complete files-changed inventory.
43. Concurrent external changes.
44. Confirmation that no package install, lockfile change, audio regeneration, staging, commit, branch, or push occurred.

# REQUIRED INVARIANTS

After H2:

1. One shared polished result presentation system exists.
2. V1 standard, V1 onboarding, V2 standard, and V2 onboarding variants use it.
3. No complete copied V2 result layout exists in the unified path.
4. Public V1 result behavior is unchanged.
5. Public V1 onboarding-result behavior is unchanged.
6. Public routing remains unchanged.
7. Internal V2 result uses frozen V2 view-model data only.
8. No V2 interpretation/focus is recomputed.
9. Chair remains raw-only.
10. Balance uses the frozen task band.
11. Shoulder uses the frozen IQR category and neutral above-range semantics.
12. Raw-only states remain raw-only.
13. Suggested focus comes from frozen assessment.
14. Balanced remains first-class.
15. Matching V2 plan is already created before display.
16. CTA is exactly `View my 4-week plan`.
17. CTA only navigates.
18. No Build/Create/Generate/Personalise plan action exists in V2 UI.
19. Active-block conflict does not claim plan readiness.
20. Local-ready/sync-pending plan remains usable.
21. Existing V2 domain-detail logic is reused.
22. Existing standalone V2 result screen remains internal.
23. Progress is unchanged.
24. Official retest/report is unchanged.
25. No Warden change occurs.
26. No V1 legacy-result migration is added.
27. Audio remains 150 assets.
28. App and website typechecks pass.
29. Android/iOS export pass.
30. No unrelated work is lost.

# ACCEPTANCE CRITERIA

Do not mark H2 complete unless:

1. Shared polished result presentation is actually used by V1 and V2 wrappers.
2. V1 standard/onboarding parity is demonstrated.
3. All V2 domain/focus/plan states render truthfully.
4. V2 result rendering consumes the existing frozen view model.
5. No reference/focus/block recomputation occurs.
6. V2 plan CTA is navigation-only.
7. Existing V2 result harness remains.
8. Internal routing is fail-closed.
9. Public routing remains unchanged.
10. Targeted tests pass.
11. Full Jest passes.
12. Audio verification passes.
13. App typecheck passes.
14. Website typecheck passes.
15. Expo config passes.
16. Android/iOS export passes.
17. `git diff --check` passes.
18. No new warning is introduced without explanation.
19. No unrelated user work is overwritten.
20. No package install or lockfile change occurs.
21. No audio regeneration occurs.
22. No staging, commit, branch, or push occurs.

Do not mark H2 complete if:

- V2 result copy is recreated from raw metrics outside the current view model;
- V1 age/weakest logic leaks into V2;
- plan creation happens from the CTA;
- public routing changes;
- Progress is migrated prematurely;
- the old V2 result harness is deleted;
- visual parity is achieved by replacing the premium V1 design with a generic new screen;
- Warden output is enabled.

# STAGE DECISIONS

At the end of the report, state exactly one:

```text
UNIFIED MOVEMENT CHECK-UP STAGE H2 COMPLETE
UNIFIED MOVEMENT CHECK-UP STAGE H2 BLOCKED
```

Also state exactly one:

```text
SHARED POLISHED RESULTS SHELL IMPLEMENTED
SHARED POLISHED RESULTS SHELL BLOCKED
```

Also state exactly one:

```text
V1 RESULTS AND ONBOARDING-RESULTS PARITY VERIFIED
V1 RESULTS PARITY BLOCKED
```

Also state exactly one:

```text
FROZEN V2 MOVEMENT PROFILE ADAPTER IMPLEMENTED
FROZEN V2 MOVEMENT PROFILE ADAPTER BLOCKED
```

Also state exactly one:

```text
INTERNAL UNIFIED V2 RESULTS FLOW VERIFIED
INTERNAL UNIFIED V2 RESULTS FLOW BLOCKED
```

Also state exactly one:

```text
UNIFIED MOVEMENT CHECK-UP STAGE H3 UNBLOCKED
UNIFIED MOVEMENT CHECK-UP STAGE H3 BLOCKED
```

Use H3 unblocked only when:

- shared result presentation is proven;
- V1 parity is green;
- V2 frozen profile, focus, plan, conflict, and recovery states render truthfully;
- H1 unified Check-Up can reach H2 unified results;
- no P0/P1 presentation/data-authority defect remains.

Also state:

```text
PUBLIC CHECKUP AND RESULTS ROUTING UNCHANGED
V1 REMAINS PUBLIC DEFAULT
V2 REMAINS INTERNAL
EXISTING V2 RESULT REFERENCE SCREEN RETAINED
NO PROGRESS MIGRATION PERFORMED
NO V1 LEGACY-RESULT MIGRATION REQUIRED
PLAN CREATION REMAINS AUTOMATIC
V2 PLAN CTA IS NAVIGATION-ONLY
NO BUILD MY PLAN ACTION
WARDEN TRANSFORM DEFERRED
CHAIR REFERENCE CLAIM REMAINS RAW-ONLY
STAGE 4 REMEDIATION COMPLETE
STAGE 5 REMEDIATION COMPLETE
PHYSICAL DEVICE VALIDATION NOT CLAIMED
```

# NEXT STAGE DEFINITION

If H2 completes, H3 is:

```text
UNIFIED MOVEMENT CHECK-UP STAGE H3:
NORMAL BASELINE / ONBOARDING CUTOVER TO THE UNIFIED V2 ENGINE BEHIND A FAIL-CLOSED RELEASE FLAG
```

H3 will:

- keep the polished H1 Check-Up shell;
- keep the polished H2 result shell;
- route normal new-user baseline/onboarding through V2 protocols, artifacts, results, and automatic plan;
- preserve a strict rollback/kill switch during verification;
- remove the developer Settings entry from beta-facing builds where appropriate;
- leave official V2 retest/report/Progress migration for later stages;
- make no Warden change.

Do not begin H3 in this task.

# FINAL CODEX RESPONSE

Return a concise summary containing:

- Report path.
- Whether production runtime code changed.
- Shared result shell/component paths.
- Protocol-neutral result view-model/action paths.
- V1 standard adapter path.
- V1 onboarding adapter path.
- V2 adapter path.
- V1 standard/onboarding parity result.
- Chair mapping.
- Balance mapping.
- Shoulder mapping.
- Suggested focus/Balanced mapping.
- Plan-ready/CTA behavior.
- Active-block conflict/recovery behavior.
- Internal route/gate behavior.
- Existing V2 result harness status.
- Public-routing containment.
- Progress containment.
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
- Confirmation that H0, H1, Stage 3D-B V2 artifacts, Stage 4, Stage 5, navigation, TypeScript boundaries, safety audio, and V2 audio remain green.
- `UNIFIED MOVEMENT CHECK-UP STAGE H2 COMPLETE` or blocked.
- Shared-results-shell verdict.
- V1-parity verdict.
- V2-adapter verdict.
- Internal-flow verdict.
- `UNIFIED MOVEMENT CHECK-UP STAGE H3 UNBLOCKED` or blocked.
- `PUBLIC CHECKUP AND RESULTS ROUTING UNCHANGED`.
- `V1 REMAINS PUBLIC DEFAULT`.
- `V2 REMAINS INTERNAL`.
- `EXISTING V2 RESULT REFERENCE SCREEN RETAINED`.
- `NO PROGRESS MIGRATION PERFORMED`.
- `NO V1 LEGACY-RESULT MIGRATION REQUIRED`.
- `PLAN CREATION REMAINS AUTOMATIC`.
- `V2 PLAN CTA IS NAVIGATION-ONLY`.
- `NO BUILD MY PLAN ACTION`.
- `WARDEN TRANSFORM DEFERRED`.
- Initial/final Git status.
- Complete files-changed inventory.
- Concurrent external changes.
- Confirmation that no package install, lockfile change, audio regeneration, staging, commit, branch, or push occurred.
