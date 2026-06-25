You are implementing the next execution stage of Hale’s approved unified Movement Check-Up architecture:

HALE UNIFIED MOVEMENT CHECK-UP — STAGE H1
POLISHED CHECKUPSCREEN SHELL EXTRACTION, PROTOCOL-NEUTRAL PRESENTATION CONTRACT, AND INTERNAL V2 LIVE-COORDINATOR ADAPTER

This is a focused UI/runtime integration stage.

Its purpose is to prove that Hale’s polished current `CheckUpScreen` visual experience can run the existing V2 live measurement protocol without changing the public/default Check-Up route yet.

Do not migrate public onboarding, public retests, results, Progress, scoring, or plan routing in this task.

## H0 prerequisite and current baseline

Stage H0 is complete.

The latest H0 report is:

```text
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H0_HEALTH_GATE.md
```

Recorded H0 outcomes:

- initial `npm run typecheck`: passed;
- current renderer reconciliation already existed;
- canonical production renderer modes:
  - `classic`;
  - `constellation`;
  - `point_cloud_body`;
  - `mediapipe_skeleton`;
- `rigged_human_silhouette` is benchmark-only through an explicit prop;
- stale sculpted/matte renderer modes are removed;
- diagnostics default off and require exact release opt-in;
- full Jest: 127 suites / 1,063 tests;
- audio:
  - safety 44 cues / 88 assets;
  - Movement Profile V2 31 cues / 62 assets;
  - total 150 assets;
- app typecheck passed;
- website typecheck passed;
- Android/iOS Expo export passed;
- `git diff --check` passed;
- H1 is unblocked.

Verify the current working tree and current counts rather than treating these values as permanent.

## Founder decisions locked

### Canonical product direction

The future product is one Movement Check-Up:

```text
polished current CheckUpScreen visual shell
+
V2 live measurement protocols/controllers
+
V2 raw-first Movement Profile
+
V2 evidence/focus assessment
+
automatic V2 domain or balanced plan
+
shared Stage 5 lifecycle
```

There must not be two permanent public Check-Up products.

### UI authority

The current polished:

```text
src/screens/CheckUpScreen.tsx
```

is the visual authority for the future canonical Check-Up.

Preserve its current premium design:

- page composition;
- camera/recording viewport;
- header and progress treatment;
- typography;
- card styling;
- spacing;
- colors;
- borders/radii;
- pose figure placement;
- instruction hierarchy;
- tracking/setup messaging;
- countdown treatment;
- result transitions;
- safe areas;
- compact-phone behavior;
- accessibility behavior.

Do not redesign it.

Do not make the new V2 shell merely “similar.” V1 and V2 must mount one shared presentation component rather than maintaining copied screen layouts.

### Measurement authority

For the H1 V2 path, the existing V2 live coordinator is authoritative.

Do not route V2 through the V1 generic `SessionController`.

Do not copy or reimplement V2 protocol logic inside the UI.

### No V1 user migration

No real user has completed a V1 Check-Up.

Therefore:

- no legacy-results migration is required;
- no mixed V1/V2 history UI is required;
- no V1-to-V2 conversion is required;
- no production preservation work should be added in H1.

Do not delete V1 code yet. Public V1 routing remains unchanged until later staged cutover.

### Warden chair policy

The intended Warden product policy is approved, but implementation remains deferred.

H1 must not:

- add Warden parameters;
- add an approximate substitute formula;
- enable chair percentiles;
- change chair focus eligibility;
- change V2 interpretation.

Chair remains raw-only.

### Renderer policy

Do not promote the benchmark-only `rigged_human_silhouette` into production.

Preserve the current production renderer selection used by `CheckUpScreen`.

Do not change pose smoothing, model, delegate, running mode, camera resolution, orientation handling, or latest-frame scheduling.

## What H1 must produce

H1 must result in:

1. One shared polished Check-Up presentation shell used by:
   - the existing public V1 wrapper;
   - a new internal V2 unified-shell wrapper.

2. A protocol-neutral, typed presentation/view-model contract.

3. A typed protocol-neutral action contract.

4. A V1 adapter that preserves existing V1 behavior and visual output.

5. A V2 adapter driven by the existing:
   - `MovementProfileV2LiveCoordinator`;
   - V2 flow reducer;
   - V2 voice sequencer;
   - V2 raw Check-Up builder.

6. A new internal-only route or diagnostics action to run V2 through the shared polished shell.

7. The existing standalone `MovementProfileV2CheckUpScreen` retained as an internal comparison/reference harness.

8. No public routing change.

9. No results-screen change.

10. No scoring/reference/block/lifecycle change.

## Required prior reading

Read in full:

- `docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H0_HEALTH_GATE.md`
- `docs/audits/HALE_MOVEMENT_CHECKUP_V1_V2_CURRENT_IMPLEMENTATION_AUDIT.md`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2E_A_1.md`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2E_A.md`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2D_2B.md`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2D_2A.md`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2D_1.md`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2C.md`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2B.md`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2A.md`
- `docs/audits/HALE_PERCENTILE_SCORING_PROTOCOL_DESIGN_STAGE_3D_B_1.md`
- `docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2D_2C.md`
- `docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5H.md`
- current voice specifications and reconciliation reports;
- current pose-pipeline/latency reports.

Also inspect:

- `AGENTS.md`;
- `CLAUDE.md`;
- `docs/decisions.md`;
- current uncommitted diffs in all touched files.

Treat current code, including current untracked production files, as source of truth.

## Scope boundary

This task may change:

- `src/screens/CheckUpScreen.tsx`, narrowly;
- a new shared Check-Up shell component;
- protocol-neutral shell types/view model;
- V1 presentation adapter;
- V2 presentation adapter;
- a new internal unified-V2 wrapper screen;
- internal routing/Settings diagnostics entry needed to launch the unified shell;
- focused UI/controller tests;
- the H1 report.

This task may reuse existing modules but must not alter their semantics:

- V2 live coordinator;
- V2 flow reducer;
- V2 voice cues/sequencer;
- raw Check-Up materialisation;
- recording viewport;
- pose renderer;
- current voice player.

This task must not change:

- public/default Check-Up route;
- normal onboarding route;
- official public retest route;
- V1 scoring/norms/focus;
- V2 protocol algorithms;
- V2 reference engine;
- V2 snapshot schema;
- V2 assessment/focus policy;
- V2 block materialisation;
- Results/Onboarding Results/Progress content;
- Stage 4/5 policy;
- Warden transform;
- camera/native pose configuration;
- audio text or MP3 assets;
- dependencies;
- lockfiles;
- website;
- unrelated renderer prototypes;
- fonts or unrelated assets.

Do not perform opportunistic refactors.

# PART A — WORKTREE SAFETY AND BASELINE

## Step 1: Capture the exact initial worktree

Before analysis or editing, run:

```bash
git status --short --untracked-files=all
git diff --name-only
git diff --stat
git ls-files --others --exclude-standard
```

Record exact output in the report.

Rules:

1. Treat all current changes as user-owned.
2. Inspect current diffs before touching a file.
3. Preserve concurrent UI work in `CheckUpScreen`.
4. Do not revert, delete, move, or broadly reformat unrelated work.
5. Do not edit prior reports.
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

- current V1 `CheckUpScreen`;
- current V1 Check-Up flow/controller;
- recording viewport;
- current V2 internal flow;
- V2 live coordinator;
- V2 voice sequencing;
- V2 raw completion;
- current route/internal-gate behavior.

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
rm -rf /tmp/hale-unified-h1-baseline-export
npx --no-install expo export --platform all --output-dir /tmp/hale-unified-h1-baseline-export
rc=$?
rm -rf /tmp/hale-unified-h1-baseline-export
exit $rc
```

Record exact counts and warnings.

If baseline fails for a concurrent unrelated reason:

- do not fix unrelated code;
- determine whether H1 can proceed safely;
- mark H1 blocked if the release gate cannot be restored without leaving scope.

# PART B — RECONSTRUCT THE CURRENT V1 SCREEN

## Step 3: Audit `CheckUpScreen.tsx` before extraction

Document the current UI tree and runtime ownership.

At minimum identify:

- root screen/safe-area container;
- header/back/close controls;
- progress indicator;
- movement label/domain label;
- recording viewport/card;
- camera pose component;
- pose renderer configuration;
- setup/tracking banner;
- instructions card;
- countdown UI;
- active timer/metric UI;
- result UI;
- transition UI;
- setup issue/recovery UI;
- footer/action controls;
- compact/large-phone branches;
- voice hooks/effects;
- app-state behavior;
- high-frequency landmark/render path.

Create a table:

| Current visual region | Component/style owner | Runtime data source | Must remain visually identical |
| --- | --- | --- | --- |

## Step 4: Record visual-contract invariants

The H1 report must list exact current values or token sources for:

- screen background;
- viewport dimensions/aspect ratio;
- card radius;
- border;
- padding;
- typography variants;
- progress treatment;
- timer typography;
- action button styles;
- compact-phone breakpoints;
- pose figure mode/configuration.

Do not hardcode duplicate values in the new V2 adapter.

## Step 5: Identify V1 business logic embedded in JSX

Classify every embedded branch as:

- presentation-only;
- V1 controller state mapping;
- V1 side effect;
- voice side effect;
- camera/pose side effect;
- persistence/navigation side effect.

The shared shell must not own protocol-specific business logic.

# PART C — RECONSTRUCT THE CURRENT V2 SCREEN

## Step 6: Audit the live V2 screen and coordinator boundary

Inspect at minimum:

- `src/screens/MovementProfileV2CheckUpScreen.tsx`;
- `src/movementProfileV2/liveCoordinator.ts`;
- `src/movementProfileV2/internalCheckupFlow.ts`;
- `src/movementProfileV2/voiceCues.ts`;
- V2 live coordinator tests;
- reference-details handoff;
- App routing.

Document:

- coordinator state union;
- movement/attempt epochs;
- pose sample ingestion;
- timer driver;
- user actions;
- voice transition output;
- React projection cadence;
- raw Check-Up completion callback;
- background/interruption behavior;
- recovery behavior.

## Step 7: Inventory current synthetic/debug-only UI

Confirm the normal V2 path has no synthetic measurement actions.

Classify remaining controls:

- protocol-essential;
- recovery;
- diagnostics-only;
- screen-navigation;
- obsolete.

The unified shell must not reintroduce canned capture controls.

# PART D — SHARED POLISHED SHELL

## Step 8: Extract one shared presentation component

Create one shared component, with a name consistent with the repository, such as:

```text
CheckUpRecordingShell
UnifiedCheckUpShell
CheckUpScreenShell
```

The exact name is less important than the architecture.

Both wrappers must render this exact component:

- public V1 `CheckUpScreen`;
- internal H1 V2 wrapper.

Do not copy the JSX/styles into two components.

## Step 9: Shell ownership

The shell may own only presentation concerns:

- layout;
- styles;
- accessibility presentation;
- rendering of a supplied view model;
- forwarding typed actions;
- forwarding pose viewport refs/callback props;
- low-frequency visual transitions already used by the current screen.

The shell must not:

- count reps;
- decide protocol completion;
- choose a standing leg;
- choose a shoulder side;
- compute timers;
- interpret tracking interruptions;
- construct a Check-Up;
- score results;
- create snapshots/assessments/blocks;
- access current profile/history;
- navigate directly.

## Step 10: Preserve exact V1 visual output

The extraction must preserve current V1 output for every existing state.

Do not intentionally change:

- style values;
- copy;
- component order;
- spacing;
- animations;
- renderer selection;
- camera behavior;
- voice behavior;
- state transitions.

If a value must move into the shared shell, move it without changing it.

Avoid a giant reformat that obscures visual parity.

# PART E — PROTOCOL-NEUTRAL PRESENTATION CONTRACT

## Step 11: Add a typed shell view model

Create a discriminated or structured pure contract.

A conceptual shape:

```ts
type UnifiedCheckUpShellViewModel = {
  screen: {
    title: string;
    stepLabel?: string;
    stepIndex: number;
    stepCount: number;
    progress: number;
    canExit: boolean;
  };

  viewport: {
    state:
      | 'inactive'
      | 'finding_person'
      | 'ready'
      | 'active'
      | 'tracking_interrupted'
      | 'complete';
    rendererMode: PoseAvatarRendererMode;
    showPose: boolean;
    framingMessage?: string;
  };

  instruction: {
    eyebrow?: string;
    title: string;
    body?: string;
    status?: string;
  };

  metric:
    | { kind: 'none' }
    | { kind: 'countdown'; value: number | 'go' }
    | { kind: 'timer'; elapsedMs: number; durationMs: number; label?: string }
    | { kind: 'rep_count'; value: number; label: string }
    | { kind: 'attempt_timer'; ... }
    | { kind: 'result'; value: string; detail?: string };

  actions: readonly UnifiedCheckUpShellActionViewModel[];

  recovery?: UnifiedCheckUpRecoveryViewModel;

  accessibility: {
    announcementKey?: string;
    liveRegionText?: string;
  };
};
```

Adapt to current conventions.

Requirements:

- JSON-safe except for explicitly separated refs/callbacks;
- deterministic;
- stable action order;
- no React elements in the pure view model;
- no protocol objects embedded;
- no raw landmarks;
- no functions;
- no Date instances;
- no NaN/infinity;
- no navigation target.

## Step 12: Add a typed shell action union

Conceptually:

```ts
type UnifiedCheckUpShellAction =
  | { type: 'exit' }
  | { type: 'retry_setup' }
  | { type: 'confirm_chair_setup'; confidence: 'confirmed' | 'uncertain' }
  | { type: 'select_balance_leg'; leg: 'left' | 'right' }
  | { type: 'balance_support_touched' }
  | { type: 'balance_stop' }
  | { type: 'balance_ready_after_rest' }
  | { type: 'balance_use_best' }
  | { type: 'select_shoulder_side'; side: 'left' | 'right' }
  | { type: 'shoulder_comfort'; status: 'comfortable' | 'choose_other' | 'not_comfortable' }
  | { type: 'shoulder_retry' }
  | { type: 'shoulder_pain_limited' }
  | { type: 'hinge_start' }
  | { type: 'hinge_finish' }
  | { type: 'continue' };
```

Adapt to actual V1/V2 controls.

Requirements:

- no stringly typed screen-local callbacks;
- shell emits typed action only;
- wrapper maps action to the correct controller;
- unavailable actions cannot be emitted;
- disabled state represented explicitly;
- action IDs are stable for accessibility/tests.

# PART F — V1 ADAPTER AND NON-REGRESSION

## Step 13: Add the V1 presentation adapter

Create a pure adapter from current V1 screen/controller state to the shared view model.

Requirements:

- preserve all current V1 copy;
- preserve all current V1 action availability;
- preserve current progress calculation;
- preserve current result display;
- preserve current setup/recovery behavior;
- preserve existing timing/controller authority;
- no V2 import in V1 scoring/controller code;
- no change to V1 Check-Up result construction.

## Step 14: Keep V1 wrapper stable

`CheckUpScreen` should remain the public wrapper expected by `App.tsx`.

Its public props and callbacks should remain unchanged unless a narrow internal refactor is unavoidable.

`App.tsx` public V1 route must continue to mount `CheckUpScreen`.

## Step 15: Prove V1 visual/behavior parity

Add focused tests for every currently supported V1 state, using current expected copy and controls.

At minimum:

- intro/preflight;
- setup ready;
- instructions;
- countdown;
- chair active;
- balance active;
- shoulder active;
- hinge active;
- result;
- transition;
- setup issue;
- tracking interruption;
- complete/cancel.

Where current test infrastructure supports render tests, render the shared shell through the V1 wrapper.

Do not add brittle full-tree snapshots when focused semantic/style assertions are more robust.

# PART G — V2 PRESENTATION ADAPTER

## Step 16: Add one pure V2-to-shell adapter

Create a pure adapter from:

- V2 live coordinator snapshot;
- V2 internal flow state;
- existing V2 canonical visible cue text;
- low-frequency screen context;

to:

```text
UnifiedCheckUpShellViewModel
```

The adapter must not mutate the coordinator.

The adapter must not call the reference engine, snapshot builder, assessment builder, or block materialiser.

## Step 17: Preserve V2 controller authority

For the H1 V2 wrapper:

- pose samples go to the existing coordinator;
- timer ticks go to the existing coordinator;
- app-state changes go to the existing coordinator;
- shell actions map to existing coordinator actions;
- voice cues use the existing V2 voice sequencer;
- raw completion uses the existing flow/raw Check-Up builder.

Do not reproduce protocol rules in the adapter.

## Step 18: High-frequency boundary

Preserve the current V2 performance architecture:

- pose/avatar latest-frame updates bypass React state where currently supported;
- coordinator receives accepted live samples;
- React view model updates only on coordinator revision or bounded timer projection;
- no per-frame JSX state;
- no frame queue;
- no stored landmark history;
- one pose inference stream;
- one pose overlay.

# PART H — EXACT V2 STATE MAPPING

## Step 19: Chair mapping

Render the following through the polished shell:

### Setup choice

Copy must remain materially equivalent to current approved V2 copy:

```text
Use a firm, stable chair without wheels.
Place it against a wall.
The seat should be roughly knee height.
```

Actions:

- `Yes`;
- `I'm not sure`.

### Camera setup/preflight

Use existing V1 viewport and setup card design.

### Practice

Show:

- practice status;
- rep/timer state as appropriate;
- clear statement that the practice rep does not count.

The official count must visibly reset to zero.

### Official ready/countdown

Use current V1 countdown presentation.

### Active test

Show:

- 30-second timer;
- official full-stand count;
- calm tracking status.

No synthetic completion action.

### Result/transition

Show raw reps briefly using the existing V1 result-transition style.

Do not show percentile or Movement Age.

## Step 20: Balance mapping

### Leg selection

Render left/right choice using the same premium card/button system.

Clarify:

```text
The selected leg stays on the floor.
```

### Setup/preflight

Use the shared viewport and V1 setup presentation.

### Attempt ready/active

Show:

- `Attempt N of up to 3`;
- 45-second maximum timer;
- selected standing leg;
- current best when appropriate.

Protocol controls:

- `I touched support`;
- `Stop`.

### Rest

Show:

- current best;
- rest countdown;
- `I'm ready` disabled before 30 seconds;
- enabled at/after 30 seconds;
- `Use this result`.

The shell only renders controller-authoritative disabled/enabled state.

### Invalid tracking/retry

Use the V1 recovery card visual language.

Do not consume a valid attempt visually or logically.

### Completion

Show best valid hold and valid attempt count briefly.

Do not show the task band yet; H1 does not change result/reference UI.

## Step 21: Shoulder mapping

### Side selection

Render:

- left/right choice;
- comfort confirmation;
- selected side nearest camera guidance.

### Setup/preflight

Use the shared V1 viewport and setup treatment.

### Active capture

Show:

- selected side;
- capture timer/progress;
- calm movement instruction.

### Invalid/retry

Render one guided retry through the V1 recovery treatment.

### Pain-limited action

Expose only the current approved action/copy.

### Result

Show raw degrees or current raw capture summary only if already shown by the V2 flow.

Do not add reference/IQR copy in H1.

## Step 22: Hinge mapping

Render supporting hinge through the shared V1 shell.

Requirements:

- supporting status can be described truthfully;
- explicit no-measurement state is supported;
- no-measurement does not appear as zero;
- no score/reference/focus copy;
- no synthetic result button.

# PART I — SHARED CAMERA, POSE, AND RENDERER

## Step 23: Use one shared viewport implementation

The shared shell must use the existing current V1 recording viewport/card and camera/pose component architecture.

Requirements:

- no camera video preview;
- no second pose stream;
- no duplicate MediaPipe mount;
- no production renderer-mode change;
- no rigged silhouette production integration;
- preserve current framing/aspect behavior;
- preserve current front-camera mirror behavior;
- preserve current figure styling.

## Step 24: Separate pose rendering from protocol state

The shared shell receives renderer/viewport inputs separately from the pure presentation model where necessary.

Do not put raw landmark arrays inside the shell view model.

Do not make the shell own pose processing.

# PART J — VOICE/TEXT PARITY

## Step 25: Preserve current V1 voice behavior

The V1 wrapper must keep existing cue order and timing.

Do not route V1 through V2 cues.

## Step 26: Use existing V2 canonical voice contract

The H1 V2 wrapper must use current:

- V2 cue definitions;
- V2 cue policy;
- V2 voice sequencer;
- local Clara/Marcus assets;
- visible canonical text.

Do not generate new audio.

Do not duplicate V2 cue text in the adapter.

## Step 27: Voice timing remains protocol-neutral

The shell must not start/stop timers from voice callbacks.

Controller/coordinator remains timer authority.

Tests must prove:

- repeated renders do not repeat a cue;
- stale attempt cue callbacks cannot advance a new attempt;
- rest unlock remains coordinator-authoritative;
- missing playback leaves visible text and does not crash.

# PART K — INTERNAL H1 ROUTING

## Step 28: Preserve all current public routing

The following must remain unchanged:

- onboarding baseline starts V1;
- public Check-Up starts V1;
- public official retest starts V1;
- V1 Results remains current;
- V2 remains internal.

## Step 29: Add an internal unified-shell entry

Add the narrowest safe internal route/action to launch V2 through the shared polished shell.

Preferred release posture:

- requires `EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_INTERNAL=1`;
- additionally requires the existing diagnostics/internal comparison gate where appropriate;
- default unavailable;
- no user setting;
- no backend/profile/restore authority;
- no public deep link;
- malformed/missing flag false.

Possible internal label:

```text
Unified Check-Up shell · V2
```

Do not call it public beta in production copy.

## Step 30: Retain the old V2 screen

The existing `MovementProfileV2CheckUpScreen` remains reachable internally as the reference/debug harness.

Do not delete it.

Do not make it public.

Document the two internal purposes:

- reference V2 screen;
- unified-shell parity screen.

If adding two Settings rows is visually noisy, place the comparison route under the existing diagnostics/developer section only.

# PART L — RAW COMPLETION HANDOFF

## Step 31: Reuse the current V2 handoff

A successful H1 internal V2 run must hand off through the existing V2 flow:

```text
live coordinator
-> raw-complete V2 Check-Up
-> existing raw persistence
-> existing reference-details flow
-> existing snapshot/assessment/block materialisation
-> existing V2 results
```

H1 must not duplicate artifact materialisation.

## Step 32: Idempotency

Repeated:

- completion callback;
- navigation callback;
- screen remount;
- app resume;

must not create duplicate raw Check-Ups.

Use current stable identities and existing one-shot guards.

## Step 33: H1 failure boundary

If shell adaptation fails or the coordinator returns recovery:

- preserve current raw/protocol state;
- show typed recovery using the V1 visual language;
- do not fall back to V1 measurement;
- do not fabricate a result;
- do not start scoring.

# PART M — RESPONSIVE AND ACCESSIBLE UX

## Step 34: Responsive parity

Verify the shared shell on:

- compact phone widths;
- standard Android width;
- large phone;
- text scaling;
- long V2 balance/rest copy;
- safe-area insets.

Use existing responsive helpers.

Do not add a new breakpoint system.

## Step 35: Accessibility

Required:

- all choice/actions have labels and roles;
- raw values include units;
- disabled rest action is announced as disabled;
- attempt number is accessible;
- selected leg/side is announced;
- meaningful state changes use bounded announcements;
- no per-second screen-reader chatter;
- no color-only state;
- touch targets retain current minimums;
- recovery can be operated without gesture-only controls.

# PART N — COPY AND PRODUCT GUARDRAILS

## Step 36: H1 copy guardrail

The H1 unified V2 recording shell must not contain:

- Movement Age;
- Body Age;
- typical age;
- weakest system/domain;
- scientifically weakest;
- diagnosis;
- fall risk;
- impairment;
- pass/fail;
- improved/declined;
- younger/older;
- exact chair percentile;
- balance percentile/range;
- medical-grade.

Do not globally ban terms in historical docs/tests.

## Step 37: No results/reference creep

Do not add:

- task-band result cards;
- shoulder IQR result copy;
- suggested focus;
- plan-ready copy;
- reference-details UI changes.

Those already exist in the separate V2 downstream flow and will be migrated visually in H2.

# PART O — REQUIRED TEST MATRIX

## A. Shared-shell architecture

- one shared shell component;
- both V1 and H1 V2 wrappers mount it;
- no duplicated layout/style tree;
- shell has no protocol imports;
- shell has no scoring/reference/block imports.

## B. V1 adapter parity

- every existing V1 state;
- same copy;
- same actions;
- same progress;
- same renderer;
- same camera behavior;
- same completion callback;
- no protocol change.

## C. V2 adapter mapping

### Chair

- setup confirmed/uncertain;
- practice;
- official reset;
- countdown;
- active timer/reps;
- tracking interruption;
- result.

### Balance

- leg choice;
- attempt ready;
- active;
- support/stop;
- invalid retry;
- rest under 30 seconds;
- rest at 30 seconds;
- 60-second state;
- use best;
- ceiling;
- result.

### Shoulder

- side choice;
- comfort state;
- preflight;
- active;
- retry;
- pain-limited;
- result.

### Hinge

- setup;
- active;
- measured;
- no-measurement;
- completion.

## D. V2 controller authority

- shell action dispatch reaches existing coordinator;
- shell cannot inject measured values;
- no V1 `SessionController` in H1 V2 path;
- no duplicate protocol implementation;
- timers/attempts remain coordinator-owned.

## E. Pose/performance

- one pose view;
- no camera preview;
- no per-frame React state;
- latest-frame renderer path preserved;
- no production renderer default change;
- unmount cleans scheduler/coordinator hooks.

## F. Voice

- V1 cues unchanged;
- V2 cues canonical;
- no duplicate speech on render;
- stale callback ignored;
- visible text fallback;
- audio matrices unchanged.

## G. Routing isolation

- public V1 route unchanged;
- existing internal V2 route unchanged;
- new H1 route internal only;
- flags default false;
- no backend/profile enablement;
- no public deep link.

## H. Raw handoff

- H1 V2 raw completion persists once;
- reference-details route opens;
- existing V2 artifact chain remains;
- cancel/recovery does not create artifact;
- repeated callback idempotent.

## I. Accessibility/responsive

- choice actions;
- disabled actions;
- compact layout;
- text scaling;
- no clipped timer/progress/actions;
- screen-reader state labels.

## J. Product containment

- no Results/Progress migration;
- no public routing migration;
- no Warden change;
- no scoring/reference/focus/block change;
- no audio generation.

## K. Regression

- H0 renderer/diagnostics;
- V1 Check-Up;
- V2 live coordinator;
- V2 artifact chain;
- V2 automatic block;
- Stage 4;
- Stage 5H;
- navigation;
- TypeScript boundaries;
- safety/V2 audio.

## Test-quality requirements

Tests must:

- exercise production adapters and shared shell;
- use deterministic controller states/timestamps;
- test real coordinator actions for V2;
- test real V1 wrapper state mapping;
- assert no duplicated/raw synthetic results;
- assert no input mutation;
- assert one-shot completion;
- use existing React Native test utilities.

Tests must not:

- mock every layer;
- assert only helper calls;
- use camera hardware;
- use wall-clock sleeps;
- install packages;
- regenerate audio;
- change protocol expectations;
- use giant fragile snapshots as the only proof.

# PART P — VALIDATION

## Step 38: Targeted validation

Run focused tests for:

- shared shell;
- V1 adapter/wrapper;
- V2 adapter/wrapper;
- V2 live coordinator;
- V2 voice sequencing;
- recording viewport;
- internal flags/routing;
- raw handoff.

Record exact command and counts.

## Step 39: Full required validation

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
rm -rf /tmp/hale-unified-h1-export
npx --no-install expo export --platform all --output-dir /tmp/hale-unified-h1-export
rc=$?
rm -rf /tmp/hale-unified-h1-export
exit $rc
```

Do not install dependencies.

Record:

- targeted suites/tests;
- full suites/tests;
- audio:
  - safety 44/88;
  - V2 31/62;
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
- any new warning;
- whether validation changed files.

# PART Q — MANUAL SOFTWARE TRACE

After automated validation, trace:

## V1

```text
public V1 route
-> CheckUpScreen wrapper
-> shared polished shell
-> V1 adapter/controller
-> unchanged V1 raw result
```

## H1 V2

```text
internal H1 route
-> V2 unified wrapper
-> same shared polished shell
-> V2 live coordinator
-> raw-complete V2 Check-Up
-> existing reference-details flow
```

## Comparison harness

```text
existing internal V2 route
-> existing standalone V2 screen
```

Confirm all three purposes and no public routing change.

# PART R — REPORT

Create exactly one report:

```text
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H1_V1_SHELL_V2_ADAPTER.md
```

Do not edit prior reports or `docs/decisions.md`.

The report must contain:

1. Scope.
2. H0 prerequisite evidence.
3. Founder decisions carried forward.
4. Initial Git status.
5. Baseline validation.
6. Current V1 screen architecture.
7. Current V2 screen/coordinator architecture.
8. Visual-contract inventory.
9. Shared shell architecture.
10. Protocol-neutral view model.
11. Protocol-neutral action union.
12. V1 adapter.
13. V1 visual/behavior parity.
14. V2 adapter.
15. Chair state mapping.
16. Balance state mapping.
17. Shoulder state mapping.
18. Hinge state mapping.
19. Camera/renderer/performance boundary.
20. Voice/text behavior.
21. Internal routing.
22. Raw completion handoff.
23. Recovery/idempotency.
24. Responsive/accessibility behavior.
25. Product containment.
26. Files changed.
27. Tests added/changed.
28. Exact targeted validation.
29. Exact full validation.
30. Audio verification.
31. App/website typechecks.
32. Expo config/export.
33. H0/Stage 3D-B/Stage 4/Stage 5 regression.
34. Remaining unified migration work.
35. Whether H2 is unblocked.
36. Initial and final Git status.
37. Complete files-changed inventory.
38. Concurrent external changes.
39. Confirmation that no package install, lockfile change, audio regeneration, staging, commit, branch, or push occurred.

# REQUIRED INVARIANTS

After H1:

1. One shared polished shell exists.
2. V1 and H1 V2 both use the same shell.
3. No copied second visual implementation exists.
4. V1 public behavior is unchanged.
5. Public routing is unchanged.
6. Existing internal V2 reference screen remains.
7. New H1 V2 route is internal only.
8. V2 H1 path uses the existing live coordinator.
9. V2 H1 path never uses V1 `SessionController`.
10. V2 protocol logic is not duplicated in UI.
11. Chair practice/reset/timer mapping is truthful.
12. Balance attempt/rest/retry mapping is truthful.
13. Shoulder side/retry mapping is truthful.
14. Hinge no-measurement is truthful.
15. No synthetic measurement action exists.
16. One pose inference stream exists.
17. Production renderer default is unchanged.
18. Rigged silhouette remains benchmark-only.
19. High-frequency pose work avoids per-frame React state.
20. V1 voice behavior is unchanged.
21. V2 canonical cues are reused.
22. Existing audio remains 150 assets.
23. Raw V2 completion hands off to existing artifact flow.
24. Completion is idempotent.
25. No Results/Progress migration occurs.
26. No Warden change occurs.
27. No scoring/reference/focus/block policy changes occur.
28. App and website typechecks pass.
29. Android/iOS exports pass.
30. No unrelated work is lost.

# ACCEPTANCE CRITERIA

Do not mark H1 complete unless:

1. Shared shell is actually used by both wrappers.
2. Current V1 UI/behavior parity is demonstrated.
3. All required V2 states render through the polished shell.
4. V2 coordinator remains authority.
5. No synthetic V2 result injection remains in H1 path.
6. Internal route is fail-closed.
7. Existing V2 screen remains available internally.
8. Raw-complete H1 run reaches existing reference-details handoff.
9. Voice/text parity remains.
10. Pose/render performance boundary remains.
11. Targeted tests pass.
12. Full Jest passes.
13. Audio verification passes.
14. App typecheck passes.
15. Website typecheck passes.
16. Expo config passes.
17. Android/iOS export passes.
18. `git diff --check` passes.
19. No new warning is introduced without explanation.
20. No unrelated user work is overwritten.
21. No package install or lockfile change occurs.
22. No audio regeneration occurs.
23. No staging, commit, branch, or push occurs.

Do not mark H1 complete if:

- V1 and V2 still use copied screen layouts;
- V2 runs through V1 controller logic;
- public routing changes;
- the existing V2 reference harness is deleted;
- result/reference/plan UI is migrated prematurely;
- the production renderer changes;
- visual parity is achieved by replacing the current premium design with a generic new shell.

# STAGE DECISIONS

At the end of the report, state exactly one:

```text
UNIFIED MOVEMENT CHECK-UP STAGE H1 COMPLETE
UNIFIED MOVEMENT CHECK-UP STAGE H1 BLOCKED
```

Also state exactly one:

```text
SHARED POLISHED CHECKUP SHELL IMPLEMENTED
SHARED POLISHED CHECKUP SHELL BLOCKED
```

Also state exactly one:

```text
V1 CHECKUPSCREEN VISUAL AND BEHAVIOR PARITY VERIFIED
V1 CHECKUPSCREEN PARITY BLOCKED
```

Also state exactly one:

```text
V2 LIVE COORDINATOR ADAPTER IMPLEMENTED
V2 LIVE COORDINATOR ADAPTER BLOCKED
```

Also state exactly one:

```text
INTERNAL UNIFIED V2 SHELL FLOW VERIFIED
INTERNAL UNIFIED V2 SHELL FLOW BLOCKED
```

Also state exactly one:

```text
UNIFIED MOVEMENT CHECK-UP STAGE H2 UNBLOCKED
UNIFIED MOVEMENT CHECK-UP STAGE H2 BLOCKED
```

Use H2 unblocked only when:

- one shared shell is proven;
- V1 parity is green;
- all V2 headline states map truthfully;
- internal H1 raw completion reaches existing downstream V2 flow;
- no P0/P1 shell/controller defect remains.

Also state:

```text
PUBLIC CHECKUP ROUTING UNCHANGED
V1 REMAINS PUBLIC DEFAULT
V2 REMAINS INTERNAL
EXISTING V2 REFERENCE SCREEN RETAINED
NO RESULTS OR PROGRESS MIGRATION PERFORMED
NO V1 LEGACY-RESULT MIGRATION REQUIRED
WARDEN TRANSFORM DEFERRED
CHAIR REFERENCE CLAIM REMAINS RAW-ONLY
RIGGED HUMAN SILHOUETTE REMAINS BENCHMARK-ONLY
STAGE 4 REMEDIATION COMPLETE
STAGE 5 REMEDIATION COMPLETE
PHYSICAL DEVICE VALIDATION NOT CLAIMED
```

# NEXT STAGE DEFINITION

If H1 completes, H2 is:

```text
UNIFIED MOVEMENT CHECK-UP STAGE H2:
POLISHED V1 RESULTS/ONBOARDING-RESULTS SHELL + FROZEN V2 MOVEMENT PROFILE VIEW MODEL
```

H2 will:

- preserve the polished V1 Results and Onboarding Results visual system;
- feed them only frozen V2 snapshot/assessment/plan-ready data;
- keep current public routing unchanged during internal parity testing;
- retain current V2 Results screen as an internal comparison harness;
- make no Warden change;
- make no public-default cutover yet.

Do not begin H2 in this task.

# FINAL CODEX RESPONSE

Return a concise summary containing:

- Report path.
- Whether production runtime code changed.
- Shared shell component/path.
- Protocol-neutral view-model/action paths.
- V1 adapter path.
- V2 adapter path.
- V1 parity result.
- Chair mapping result.
- Balance mapping result.
- Shoulder mapping result.
- Hinge mapping result.
- Camera/pose/renderer boundary.
- Voice/text result.
- Internal route/flag behavior.
- Existing V2 reference-screen status.
- Raw completion handoff result.
- Public-routing containment.
- Results/Progress containment.
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
- Confirmation that H0, Stage 3D-B V2 artifacts, Stage 4, Stage 5, navigation, TypeScript boundaries, safety audio, and V2 audio remain green.
- `UNIFIED MOVEMENT CHECK-UP STAGE H1 COMPLETE` or blocked.
- Shared-shell verdict.
- V1-parity verdict.
- V2-adapter verdict.
- Internal-flow verdict.
- `UNIFIED MOVEMENT CHECK-UP STAGE H2 UNBLOCKED` or blocked.
- `PUBLIC CHECKUP ROUTING UNCHANGED`.
- `V1 REMAINS PUBLIC DEFAULT`.
- `V2 REMAINS INTERNAL`.
- `EXISTING V2 REFERENCE SCREEN RETAINED`.
- `NO RESULTS OR PROGRESS MIGRATION PERFORMED`.
- `NO V1 LEGACY-RESULT MIGRATION REQUIRED`.
- `WARDEN TRANSFORM DEFERRED`.
- Initial and final Git status.
- Complete files-changed inventory.
- Concurrent external changes.
- Confirmation that no package install, lockfile change, audio regeneration, staging, commit, branch, or push occurred.
