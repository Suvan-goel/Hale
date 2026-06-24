You are implementing Stage 3D-B.2D.2B of Hale’s production-readiness work:

INTERNAL MOVEMENT PROFILE V2 CHECK-UP FLOW, PER-CHECK-UP REFERENCE DETAILS, FROZEN ARTIFACT MATERIALISATION, MOVEMENT PROFILE RESULTS/DETAIL UI, AND PROGRESS-SURFACE INTEGRATION

This stage follows:

- Stage 3D-B.2A: internal V2 assessment protocols and raw-result controllers;
- Stage 3D-B.2B: pure V2 reference engine;
- Stage 3D-B.2C: immutable V2 snapshots, persistence, sync, and restore;
- Stage 3D-B.2D.1: pure V2 domain-evidence, suggested-focus, balanced-fallback, and assessment contract;
- Stage 3D-B.2D.2A: immutable V2 assessment persistence and official artifact orchestration.

Implement the first complete internal end-to-end V2 product flow:

```text
internal V2 entry
-> V2 camera Check-Up
-> complete raw V2 Check-Up
-> per-Check-Up reference details
-> frozen V2 snapshot
-> frozen V2 assessment
-> Movement Profile results
-> optional domain detail
-> latest V2 Progress surface
```

Keep V1 as the public/default Check-Up.

Do not implement V2 MovementBlock creation, balanced workout generation, V2 reports, public rollout, public onboarding replacement, official V2 re-test scheduling, Warden chair transform, improvement/decline claims, or physical-device validation in this task.

## Current verified baseline

### Stage 3D-B.2A

The internal protocol layer provides:

- protocol policy:
  - `legacy_movement_age_v1`;
  - `movement_profile_v2`;
- V2 battery:
  - `chair-rise-30s-v2`;
  - `one-leg-balance-45s-v2`;
  - `active-shoulder-reach-v2`;
  - `hinge-reach` as supporting only;
- typed setup state;
- selected standing leg and shoulder side;
- prior-selection/change metadata;
- protocol evidence states;
- pure V2 chair, balance, and shoulder controllers;
- V2 raw completeness;
- V1 scoring/block/report containment.

Important current constraint:

- the V2 movement definitions intentionally fail closed if run through the old generic `SessionController`;
- a dedicated V2 screen/controller integration is required.

### Stage 3D-B.2B

The pure reference engine provides:

- explicit reference-profile input;
- chair raw-only output in production;
- no embedded Warden formulas/workbook/LMS data;
- balance Hale task bands;
- Springer age-group benchmark metadata;
- shoulder Gill IQR categories;
- deterministic source/transform fingerprints;
- no UI, focus, snapshot, block, backend write, clock, environment read, or network use.

### Stage 3D-B.2C

The immutable snapshot layer provides:

- official V2 snapshot eligibility;
- exact source-Check-Up binding;
- frozen normalized reference profile;
- frozen interpretation;
- stable snapshot ID/fingerprint;
- local/backend persistence;
- restore without recomputation;
- V1/V2 compatibility;
- no focus/block/UI.

### Stage 3D-B.2D.1

The pure assessment contract provides:

- ordinal domain evidence;
- life-goal tie-breaking using the existing mapping;
- first-class `balanced` focus;
- official-retest-only prior V2 focus preservation;
- stable assessment ID/fingerprint;
- strict parser;
- no persistence/UI/block.

### Stage 3D-B.2D.2A

The persistence/orchestration layer now provides:

- `movementProfileV2Assessment` on `CheckUp`;
- strict assessment/snapshot/source binding;
- immutable attachment and conflict protection;
- official V2 assessment selectors;
- latest prior V2 focus selection;
- `materializeOfficialMovementProfileV2Artifacts`;
- local history persistence;
- backend sync/restore;
- data export;
- no recomputation on restore;
- no V1 compact focus/age fields for V2;
- no UI, block, report, or feature flag.

Stage 3D-B.2D.2A validation passed:

- baseline targeted: 20 suites / 226 tests;
- final targeted: 21 suites / 241 tests;
- full Jest: 113 suites / 976 tests;
- audio verification: 44 cues / 88 assets;
- app typecheck;
- website typecheck;
- Expo config/export;
- `git diff --check`.

Re-run the current baseline instead of assuming those counts remain unchanged.

## Locked product decisions

### Overall product model

1. The future headline is `Your Movement Profile`, not Movement Age.

2. Raw metrics are primary.

3. Reference interpretation appears only when the frozen snapshot says it is eligible.

4. UI must display the frozen snapshot and assessment; it must not rerun interpretation or focus selection.

5. No diagnosis, risk score, impairment label, biological age, body age, or “scientifically weakest” claim.

6. Use:
   - `Suggested focus`;
   - `clearest area to build`;
   - `based on your results and goal`.

7. No `improved`, `declined`, `younger`, meaningful-change, or percentile-change claim before physical-device repeatability/MDC validation.

### Chair

- Display raw full rises in 30 seconds.
- Production chair remains raw-only while the Warden transform is disabled.
- Do not display a placeholder percentile.
- Do not derive a comparison from V1 norms.
- Suitable raw-only copy:
  - `Saved as your personal baseline.`
  - `Saved without a published comparison.` when a protocol/profile reason is relevant.
- Chair raw-only evidence cannot drive reference-derived focus.

### Balance

- Display the best valid hold in seconds.
- Display the frozen Hale task band:
  - `ceiling_complete` -> `Full 45-second hold completed`;
  - `building` -> `Building the hold`;
  - `starting_point` -> `Starting point`;
  - `starting_point_low` -> `A clear place to build`.
- A Springer age-group benchmark may appear in detail only.
- Do not call it a percentile, normal range, or risk threshold.
- Do not infer below/above from the benchmark mean.

### Shoulder

- Display raw active shoulder reach in degrees.
- Display frozen Gill IQR category when eligible:
  - `below_published_middle_range` -> `Below the published middle range`;
  - `within_published_middle_range` -> `Within the published middle range`;
  - `above_published_middle_range` -> `Above the published middle range`.
- `Above` is neutral, not automatically better.
- Pain-limited or reference-ineligible results remain raw-only.

### Suggested focus

- Display the frozen V2 assessment decision.
- Domain modes:
  - Strength;
  - Balance;
  - Mobility.
- Balanced mode:
  - `Suggested focus: Balanced`.
- Do not recompute from current life goal.
- Do not use V1 `weakestDomain`.
- Do not create a block in this stage.

### Reference details

Collect per official V2 Check-Up:

- exact age today, optional;
- published reference group:
  - Female;
  - Male;
  - Prefer not to say.

Policy:

- never infer reference group;
- do not silently promote the current legacy/representative profile age to exact age;
- missing details do not invalidate the raw Check-Up;
- user may continue without published comparisons;
- freeze the chosen values in the V2 snapshot;
- do not add a global profile/reference-sex field in this task;
- do not separately sync reference details outside the snapshot;
- later official V2 flows may prefill from the latest valid V2 snapshot, but the user must confirm/edit before a new snapshot is created.

### Rollout

- V1 remains public/default.
- V2 is accessible only through a compile-time/internal diagnostics gate.
- No user setting.
- No backend flag.
- No profile-restored flag.
- No public deep link.
- No public onboarding replacement.
- Stage 3D-B.2E will later harden rollout and the physical-device QA harness.

## Required prior reading

Read these reports in full before changing code:

- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2D_2A.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2D_1.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2C.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2B.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2A.md
- docs/audits/HALE_PERCENTILE_SCORING_PROTOCOL_DESIGN_STAGE_3D_B_1.md
- docs/audits/HALE_LOGIC_AUDIT_STAGE_3D_B.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4G_R.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4F_R_1.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5H.md

Also inspect:

- AGENTS.md;
- CLAUDE.md;
- current navigation conventions;
- current CheckUpScreen architecture;
- current camera/preflight architecture;
- current onboarding/result/progress components;
- current internal-diagnostics feature gates;
- current app lifecycle/history stores;
- current voice/audio architecture;
- current accessibility and responsive UI components.

Treat the current working tree as the source of truth.

## Primary objectives

Stage 3D-B.2D.2B must:

1. Add a narrow internal-only V2 availability gate.

2. Add an internal V2 Check-Up entry point without changing the V1 default.

3. Build a dedicated V2 Check-Up flow that consumes the existing pure V2 protocol controllers.

4. Reuse the existing pose camera, readiness, avatar, and safety infrastructure without routing V2 through the legacy generic movement controller.

5. Implement chair setup/practice/official measurement UI.

6. Implement balance selected-leg/adaptive best-of-three/rest/retry UI.

7. Implement shoulder selected-side/retry UI.

8. Run hinge reach as supporting evidence without making it headline-required.

9. Persist a complete raw V2 Check-Up before reference interpretation.

10. Add resumable pending-artifact handling.

11. Add per-Check-Up reference-details input.

12. Materialise the frozen V2 snapshot and assessment through the existing pure orchestrator.

13. Persist/sync the returned frozen artifacts through existing history/backend services.

14. Add one pure V2 Movement Profile view model.

15. Add one main Movement Profile results screen.

16. Add one reusable domain-detail screen or bottom sheet.

17. Add a latest V2 Movement Profile surface in Progress without trend interpretation.

18. Keep V1 results/history behavior unchanged.

19. Keep V2 out of block creation and reports.

20. Add deterministic flow, component, view-model, resume, and regression tests.

## Scope boundary

This task may change:

- internal V2 feature-gate/config helper;
- internal Settings/diagnostics entry point;
- V2 Check-Up flow controller/reducer;
- dedicated V2 Check-Up screen;
- reference-details draft types/screen;
- pending V2 artifact/resume helper;
- V2 artifact materialisation application service;
- V2 Movement Profile display types/view model/copy;
- V2 results screen;
- V2 domain-detail screen/bottom sheet;
- narrow Progress integration;
- narrow onboarding/results reusable component support without replacing V1 default;
- app navigation/orchestration needed only for the internal V2 flow;
- voice cue definitions/assets only if required for truthful voice parity;
- focused tests;
- the Stage 3D-B.2D.2B remediation report.

This task must not change:

- V1 public/default battery;
- V1 scoring/norms/focus/snapshots;
- V2 protocol algorithms;
- V2 reference source tables/transforms;
- Warden transform disabled status;
- V2 focus policy;
- V2 snapshot/assessment schemas;
- life-goal mappings;
- global profile schema for reference sex;
- backend database schema;
- V2 MovementBlock creation;
- balanced training templates;
- V2 reports;
- Stage 5 schedule;
- workout generation;
- exercise catalogue;
- public website;
- native pose algorithms;
- dependencies;
- lockfiles;
- unrelated assets/fonts.

Do not perform opportunistic refactors.

# PART A — WORKTREE SAFETY AND BASELINE

## Working-tree safety

Before analysis or editing, run:

```bash
git status --short --untracked-files=all
git diff --name-only
git diff --stat
```

Record exact output in the report.

Important cautions:

- The worktree has repeatedly contained concurrent user-owned screen/theme/native/diagnostics/voice work.
- Stage 3D-B.2D.2A reported additional concurrent voice-audit and UI changes.
- The 88 Clara/Marcus safety MP3s and their manifests are intended assets.
- Do not delete or regenerate them unless this stage explicitly requires new V2 Check-Up voice lines.
- Do not inspect or expose `.env` values.
- Do not expose ElevenLabs credentials.
- Do not modify or share font files.
- Before touching any screen, inspect its current diff and preserve concurrent design work.

Rules:

1. Treat every existing modified/untracked file as user-owned.

2. Do not revert, overwrite, reformat, move, or delete unrelated work.

3. Do not edit prior reports.

4. Do not use destructive Git commands.

5. Do not install packages.

6. Do not modify lockfiles.

7. Do not stage, commit, create a branch, or push.

8. If unrelated files change:
   - record them;
   - do not overwrite them;
   - continue only when task-owned edits remain safe and unambiguous;
   - otherwise stop mutation and report the conflict.

## Baseline validation

Run a targeted existing slice covering:

- V2 protocol policy/controllers;
- V2 reference engine;
- V2 snapshot;
- V2 assessment;
- V2 assessment persistence/orchestration;
- local history;
- backend check-up sync/restore;
- V1 Check-Up flow;
- V1 results/progress;
- Stage 4 closure;
- Stage 5H lifecycle.

Then run exactly:

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
rm -rf /tmp/hale-stage3db2d2b-export
npx --no-install expo export --platform all --output-dir /tmp/hale-stage3db2d2b-export
rc=$?
rm -rf /tmp/hale-stage3db2d2b-export
exit $rc
```

Do not install dependencies.

Record current counts and warnings rather than assuming the prior 113-suite / 976-test baseline.

# PART B — RECONSTRUCT CURRENT APP FLOW

## Step 1: Inspect the current Check-Up UI architecture

Inspect at minimum:

- App.tsx
- src/screens/CheckUpScreen.tsx
- src/checkup/checkup.ts
- src/checkup/types.ts
- src/checkup/protocolPolicy.ts
- src/checkup/protocolSetup.ts
- src/checkup/movementProfileV2.ts
- src/assessment/sessionController.ts
- src/preflight/movementCameraReadiness.ts
- src/preflight/setupCopy.ts
- current camera/avatar components
- AppState/background handling
- current Check-Up persistence/resume behavior
- current Check-Up voice cue flow
- all related tests.

Trace the current V1 path:

```text
entry
-> CheckUpScreen
-> preflight
-> instructions
-> countdown
-> active
-> result
-> next movement
-> complete
-> scoring/results
```

Document why V2 cannot safely use the generic controller.

## Step 2: Inspect current navigation and internal-gate conventions

Inspect:

- current route/screen union;
- Settings internal/developer surfaces;
- current diagnostics flags;
- `app.config.js`, `app.json`, `.env.example`;
- current `EXPO_PUBLIC_*` usage;
- current deep-link policy.

Do not reuse a user-persisted setting as V2 authority.

## Step 3: Inspect current results/progress design

Inspect:

- src/screens/ResultsScreen.tsx
- src/screens/OnboardingResultsScreen.tsx
- src/screens/ProgressScreen.tsx
- existing result cards and detail patterns
- theme/responsive components
- current V1 history labels
- current legacy/beta copy.

Preserve the current visual system and concurrent UI work.

# PART C — INTERNAL-ONLY V2 GATE

## Step 4: Add a compile-time internal gate

Prefer:

```text
EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_INTERNAL=1
```

Adapt to current config conventions.

Requirements:

- default false;
- strict parsing: only exact `1` or existing approved boolean convention enables;
- no user setting;
- no backend/profile value;
- no restore authority;
- no `__DEV__` alone;
- no public deep link;
- no effect on V1 default selection;
- no effect on artifact parsing/history;
- test true/false/malformed values.

Add the variable to `.env.example` only if that file already exists and this follows current project conventions.

Do not print environment values.

## Step 5: Add the internal entry point

When the gate is enabled, expose one internal/diagnostics action such as:

```text
Movement Profile V2 Check-Up
```

Preferred location:

- existing internal diagnostics/developer section in Settings.

Do not add it to normal onboarding, Today, Progress, or public navigation.

When the gate is false:

- no visible entry;
- direct internal navigation request fails safely to the prior screen/Today;
- V1 remains the only Check-Up entry.

## Step 6: Internal source-type policy

For this stage’s internal user flow:

- no prior official V2 artifact -> `baseline`;
- existing official V2 artifact -> `baseline_retake`.

Do not create an `official_retest` through the UI yet because V2 block/schedule integration is not implemented.

The pure contract’s official-retest behavior remains tested but not user-routed.

# PART D — DEDICATED V2 CHECK-UP FLOW CONTROLLER

## Step 7: Add one V2 flow state machine

Do not manage the full flow through scattered screen booleans.

Create one pure/testable controller or reducer.

Conceptual states:

```ts
type MovementProfileV2FlowState =
  | { kind: 'intro' }
  | { kind: 'movement_setup'; movementId: string }
  | { kind: 'camera_preflight'; movementId: string }
  | { kind: 'instructions'; movementId: string }
  | { kind: 'chair_practice' }
  | { kind: 'countdown'; movementId: string; attempt?: number }
  | { kind: 'active'; movementId: string; attempt?: number }
  | { kind: 'trial_result'; movementId: string; attempt?: number }
  | { kind: 'balance_rest'; ... }
  | { kind: 'movement_result'; movementId: string }
  | { kind: 'transition'; nextMovementId: string }
  | { kind: 'raw_complete'; checkUpId: string }
  | { kind: 'reference_details'; checkUpId: string }
  | { kind: 'materialising'; checkUpId: string }
  | { kind: 'profile_ready'; checkUpId: string }
  | { kind: 'recovery'; reason: string };
```

Adapt to current types.

Requirements:

- explicit timestamp inputs;
- deterministic;
- no hidden clock in pure transitions;
- protocol policy frozen at start;
- movement order comes from the V2 battery;
- item results cannot duplicate;
- app background behavior is explicit;
- resume behavior is explicit;
- no V1 scoring transition;
- no block/report transition.

## Step 8: Flow identity

At flow start, freeze:

- Check-Up ID / `startedAt`;
- source type;
- V2 protocol policy;
- battery version/order;
- entry reason;
- internal-gate status at start.

Once started:

- disabling the gate does not mutate the in-progress record;
- a restored in-progress V2 flow may be completed internally only when the gate is enabled;
- it must never fall back into V1.

# PART E — CAMERA AND CONTROLLER INTEGRATION

## Step 9: Build a dedicated V2 screen

Prefer a separate screen:

```text
MovementProfileV2CheckUpScreen
```

rather than branching deeply inside the V1 screen.

Reuse:

- pose camera component;
- avatar/overlay;
- recording viewport;
- movement readiness;
- setup issue presentation;
- countdown components;
- safety text;
- accessibility controls.

Do not reuse the legacy generic `SessionController` for the V2 headline movements.

## Step 10: Screen/controller boundary

At the screen boundary:

- receive pose landmarks/events;
- receive explicit current timestamp;
- adapt them into the existing pure V2 movement-controller events;
- render the returned state;
- keep timers/counts in the pure controller where possible;
- keep camera/voice/navigation side effects outside the pure controller.

Do not add another pose-estimation pipeline.

## Step 11: Background/foreground behavior

Required:

- active chair measurement interrupted by backgrounding becomes tracking/protocol uncertain or routes through the existing V2 retry policy;
- active balance trial becomes invalid tracking and does not consume a valid attempt;
- shoulder active capture follows its one-retry policy;
- rest timing uses explicit deadline/remaining duration and cannot skip the 30-second minimum;
- do not resume a stale active normative timer;
- raw completed movements remain preserved.

# PART F — CHAIR UI INTEGRATION

## Step 12: Chair setup screen

Display:

```text
Use a firm, stable dining chair without wheels.
Place it against a wall.
The seat should be roughly level with the crease behind your knees.

Is the seat roughly knee height?
```

Actions:

- `Yes`
- `I'm not sure`

Requirements:

- no tape measure;
- setup uncertainty remains raw-valid;
- selected value survives camera setup/retry;
- screen-reader labels;
- calm non-medical wording.

## Step 13: Chair practice UI

Before official countdown:

- show one practice repetition;
- require the existing V2 practice controller to complete;
- explain that it will not count;
- tracking interruption resets practice;
- setup timeout offers reposition/help;
- official rep count visibly resets to zero.

## Step 14: Chair official test UI

Display:

- 30-second timer;
- full stand count;
- concise instruction;
- pause/stop only if consistent with normative protocol handling;
- no partial final-rep bonus;
- no voiced criticism for hand push-off.

On completion:

- show raw rep count briefly;
- do not show percentile/reference interpretation yet;
- continue to next movement.

# PART G — BALANCE UI INTEGRATION

## Step 15: Standing-leg setup

Ask:

```text
Which leg would you like to stand on?
Left
Right
```

Clarify:

```text
The selected leg stays on the floor.
```

Policy:

- if a compatible prior V2 selection exists, preselect it;
- user confirms or changes;
- changed-from-prior metadata remains;
- no wrong-leg silent acceptance;
- support within reach;
- firm, dry, stable surface;
- eyes open.

## Step 16: Balance attempt UI

Display:

- attempt count:
  - `Attempt 1 of up to 3`;
- 45-second maximum timer;
- current best after a valid attempt;
- selected standing leg;
- support/stop guidance;
- no percentile/risk wording.

Use the existing pure controller for:

- trial start;
- valid/invalid result;
- termination;
- ceiling;
- best result;
- automatic invalid retry.

## Step 17: Balance rest UI

After a valid non-ceiling attempt:

- show current best;
- show rest countdown;
- `I'm ready` disabled until 30 seconds;
- enabled at/after 30 seconds;
- automatic/default continue state at 60 seconds according to the current controller policy;
- `Use this result` available;
- explain that using it now saves the best valid hold but may suppress the published benchmark.

Requirements:

- invalid tracking attempt does not enter normal rest as a valid attempt;
- one automatic retry only;
- no infinite loop;
- background/foreground cannot bypass minimum rest.

## Step 18: Balance completion UI

Show briefly:

- best valid hold;
- valid attempt count;
- ceiling completion when applicable.

Do not show the task band until the frozen snapshot is materialised.

# PART H — SHOULDER UI INTEGRATION

## Step 19: Side setup

Ask:

```text
Which shoulder would you like to test?
Right
Left
```

Then:

```text
Does this side feel comfortable to raise today?
```

Actions:

- comfortable;
- choose other side;
- neither side feels comfortable / skip and retake later.

Policy:

- compatible prior side may be preselected;
- otherwise visually default right but require confirmation;
- selected side closest to camera;
- changed-from-prior metadata retained;
- no diagnosis question.

## Step 20: Shoulder capture UI

Display:

- selected side;
- side-view setup;
- one smooth active forward reach;
- brief peak;
- comfortable range;
- camera tracking state.

Use existing pure V2 controller.

Retry:

- one guided retry for tracking/side geometry/substantial torso-compensation invalidity;
- second invalid attempt -> no valid measurement;
- pain-limited but complete capture may remain raw-valid.

# PART I — SUPPORTING HINGE REACH

## Step 21: Integrate hinge as supporting only

Use the existing compatible hinge movement path.

Requirements:

- preserve V2 protocol policy;
- result stored as supporting evidence;
- invalid/skipped hinge does not make headline raw completeness fail;
- hinge does not replace missing shoulder evidence;
- hinge does not drive V2 reference interpretation or suggested focus;
- no V1 mobility-age scoring.

If safely reusing a narrow existing V1 hinge controller requires an adapter, add the smallest explicit adapter rather than routing the full V2 flow through V1 scoring.

# PART J — RAW CHECK-UP COMPLETION AND PENDING STATE

## Step 22: Build the official raw V2 Check-Up

At the end of the battery:

- construct one `CheckUp` with:
  - frozen V2 protocol policy;
  - stable source type;
  - stable `startedAt`;
  - canonical movement results;
  - no duplicate movement IDs;
  - raw completion timestamp;
  - no V1 score snapshot;
  - no V1 score;
  - no snapshot/assessment yet.

Validate V2 raw completeness.

If headline evidence is incomplete:

- route to typed recovery/retake;
- do not materialise an official assessment;
- preserve completed valid movement results where current retry architecture permits;
- do not silently create balanced focus.

## Step 23: Persist raw before reference details

Persist the complete raw V2 Check-Up before asking reference details.

Reason:

- app closure after measurement must not lose the raw result.

Requirements:

- use existing history store;
- sync may occur under existing raw V2 policy;
- no V1 compact score fields;
- no snapshot/assessment invented.

## Step 24: Pending artifact states

Add pure selectors for:

1. complete raw V2 Check-Up with no snapshot;
2. valid snapshot with no assessment;
3. valid snapshot + assessment;
4. malformed/mismatched artifact;
5. incomplete raw V2 Check-Up.

Use these selectors for internal resume behavior.

No read-time recomputation.

# PART K — PER-CHECK-UP REFERENCE DETAILS

## Step 25: Add a reference-details draft type

Conceptually:

```ts
type MovementProfileV2ReferenceDetailsDraft = {
  ageAtTest?: number;
  referenceSex:
    | 'female'
    | 'male'
    | 'prefer_not_to_say'
    | 'unknown';
  inputStatus:
    | 'entered'
    | 'prefilled_confirmed'
    | 'skipped';
};
```

Requirements:

- local UI draft only;
- not a new global profile field;
- not independently synced;
- frozen only through the snapshot;
- JSON-safe;
- no DOB;
- no free text.

## Step 26: Reference-details screen

Headline:

```text
Published comparisons
```

Body:

```text
Your raw results are already saved. These optional details help Hale choose the closest published reference group.
```

Age field:

```text
How old are you today?
```

- numeric keyboard;
- whole years;
- valid product-input range 18–120;
- source engine decides whether a specific claim is in range;
- no legacy representative age auto-promotion.

Reference group:

```text
For published comparisons, which reference group should Hale use?
```

Options:

- Female;
- Male;
- Prefer not to say.

Supporting copy:

```text
This is optional. It does not change your raw result or training access.
```

Actions:

- `Continue`;
- `Continue without published comparisons`.

## Step 27: Prefill rules

For a new baseline:

- do not prefill from ambiguous current `UserProfile.age`;
- do not infer reference sex.

For a later internal V2 baseline retake:

- prefill from the latest valid official V2 snapshot’s frozen reference profile;
- user must confirm or edit;
- the new snapshot freezes the submitted values;
- never mutate the prior snapshot.

If age/reference details are skipped:

- pass explicit unknown values;
- raw snapshot/assessment still materialises;
- chair/shoulder reference claims remain raw-only;
- balance task band remains;
- balance benchmark may be unavailable without age.

## Step 28: Exit/resume policy

If the user exits before submitting reference details:

- raw V2 Check-Up remains pending;
- do not automatically materialise unknown reference details;
- the next internal entry offers `Finish your Movement Profile`;
- do not rerun the camera Check-Up unless raw completeness is invalid.

Once snapshot/assessment are frozen:

- reference details cannot rewrite them;
- a new official Check-Up is required for a different frozen result.

# PART L — ARTIFACT MATERIALISATION

## Step 29: Add a narrow application service

Create an application-layer helper that calls:

```text
materializeOfficialMovementProfileV2Artifacts
```

Inputs:

- accepted raw V2 Check-Up;
- explicit reference-details draft converted to `MovementProfileV2ReferenceProfile`;
- current explicit life-goal ID or no goal;
- accepted history;
- explicit snapshot timestamp;
- explicit assessment timestamp.

Requirements:

- pure orchestrator remains unchanged;
- application service handles local store update and existing backend sync;
- no direct reimplementation of snapshot/assessment logic;
- existing frozen artifacts are reused;
- conflicts preserve frozen artifacts;
- no block/report/UI interpretation inside the service.

## Step 30: Life-goal input

At materialisation:

- read the current explicit life-goal ID once at the application boundary;
- pass it into the pure orchestrator;
- assessment freezes its mapping/provenance;
- missing/unsupported goal remains allowed and may produce balanced focus;
- changing the goal later does not rewrite the assessment.

Do not display a goal-edit screen in this stage.

## Step 31: Materialisation outcomes

Handle:

### Ready

- persist updated Check-Up with snapshot + assessment;
- trigger existing sync;
- navigate to Movement Profile.

### Existing frozen artifacts

- reuse;
- navigate to Movement Profile;
- do not recalculate.

### Needs retake/raw incomplete

- route to V2 recovery;
- do not create assessment.

### Snapshot/assessment conflict

- preserve accepted frozen artifact;
- display calm recovery:
  - `This result is already saved. Hale will use the saved version.`
- no internal codes shown.

### Sync failure

- local result remains available;
- use existing retry behavior;
- do not block results solely on remote sync.

# PART M — MOVEMENT PROFILE VIEW MODEL

## Step 32: Add one pure display view model

Conceptually:

```ts
type MovementProfileV2ViewModel =
  | {
      status: 'ready';
      checkUpId: string;
      completedAt: string;
      title: 'Your Movement Profile';
      chair: MovementProfileDomainCardViewModel;
      balance: MovementProfileDomainCardViewModel;
      shoulder: MovementProfileDomainCardViewModel;
      suggestedFocus: MovementProfileFocusViewModel;
      summaryCaveat: string;
    }
  | {
      status:
        | 'missing_snapshot'
        | 'missing_assessment'
        | 'source_mismatch'
        | 'unsupported_version'
        | 'needs_retake';
      recovery: ...;
    };
```

Inputs:

- accepted source Check-Up;
- parsed frozen V2 snapshot;
- parsed frozen V2 assessment.

Requirements:

- validate source binding;
- never rerun reference engine;
- never rerun focus selection;
- never read live profile/life goal;
- never read current source tables to recategorise results;
- no cross-domain arithmetic;
- deterministic;
- no mutation;
- no improvement/decline field.

## Step 33: Formatting policy

### Raw values

Chair:

```text
16 rises in 30 seconds
```

Balance:

```text
28 seconds
```

- avoid unnecessary decimals;
- retain one decimal only when materially present.

Shoulder:

```text
154°
```

- display nearest whole degree;
- retain the frozen precise value internally.

### Dates

Use current app date-format helpers.

No locale-dependent parsing in logic.

# PART N — MAIN MOVEMENT PROFILE SCREEN

## Step 34: Build one dedicated results screen

Preferred name:

```text
MovementProfileV2ResultsScreen
```

Layout:

1. Header:
   - `Your Movement Profile`
   - official Check-Up date.

2. Three domain cards:
   - Chair-rise capacity;
   - One-leg balance;
   - Shoulder reach.

3. Suggested-focus card.

4. One concise summary caveat.

5. Actions:
   - `View details` through card taps;
   - `Done`.

Do not show `Build my plan` yet.

Do not create a V2 block.

## Step 35: Chair card

Always show raw result when valid.

Current production secondary state:

```text
Saved as your personal baseline
```

When protocol/profile ineligible:

```text
Saved without a published comparison
```

Future-compatible handling may display a frozen percentile-range snapshot if one legally exists later, but do not enable or fabricate one.

Never display:

- Movement Age;
- beta age range;
- V1 band;
- percentile placeholder;
- “weak”/“strong” inferred from raw reps.

## Step 36: Balance card

Show:

- best valid seconds;
- frozen task-band copy.

Optional small detail affordance:

```text
See published benchmark
```

only when a frozen Springer benchmark exists.

Do not display benchmark difference as good/bad.

## Step 37: Shoulder card

Show:

- raw degrees;
- frozen category when eligible;
- raw-only copy otherwise.

For above range:

- use neutral styling;
- do not use a success trophy/up arrow;
- do not say better.

## Step 38: Suggested-focus card

Domain examples:

```text
Suggested focus: Balance
This was the clearest area to build from today’s Check-Up.
```

Goal-led example:

```text
Suggested focus: Strength
Your results were broadly matched, so Hale used your goal to guide the suggestion.
```

Balanced:

```text
Suggested focus: Balanced
Your results did not point to one clear area today.
```

Requirements:

- derive only from frozen assessment plan mode/reason;
- do not show `weakest`;
- do not imply a plan has been created;
- do not show hidden candidate scores;
- no editable goal here.

## Step 39: Summary caveat

Use one summary-level statement, materially equivalent to:

```text
Where available, comparisons use published reference groups and the setup recorded during your Check-Up. Hale’s camera results are beta estimates, not medical assessments.
```

Do not repeat a long disclaimer on every card.

# PART O — DOMAIN DETAIL VIEW

## Step 40: Add one reusable detail screen or bottom sheet

Preferred:

```text
MovementProfileV2DomainDetailScreen
```

with a domain parameter.

Do not build three separate screen implementations.

## Step 41: Common detail content

Display:

- domain name;
- raw result;
- frozen interpretation;
- setup/protocol summary;
- why comparison is/is not shown;
- source summary when present;
- neutral method caveat.

Do not display internal IDs/fingerprints/reason codes.

## Step 42: Chair detail

Display:

- repetitions;
- 30-second protocol;
- setup confidence;
- hand-support/protocol note when relevant;
- personal-baseline explanation.

User-facing reason for no comparison:

```text
Hale saved your raw result. A published chair-rise comparison is not available for this result yet.
```

Do not mention legal approval or Warden workbook internals to users.

## Step 43: Balance detail

Display:

- best valid attempt;
- valid attempt count;
- standing leg;
- 45-second ceiling;
- task-band explanation;
- frozen Springer age-group benchmark when present.

Benchmark copy:

```text
Published average best-of-three for adults aged 50–59: about 41 seconds.
```

Add:

```text
This is context from a published group, not a pass/fail threshold.
```

Do not calculate or display the difference as severity.

## Step 44: Shoulder detail

Display:

- measured degrees;
- selected side;
- frozen IQR category;
- published middle range boundaries when stored in the snapshot;
- pain-limited/raw-only reason when applicable.

For above range:

```text
Above the published middle range is not automatically better or worse.
```

# PART P — PROGRESS AND HISTORY SURFACES

## Step 45: Add a pure latest-V2 Progress view model

Use valid official V2 Check-Ups with accepted snapshot + assessment.

Requirements:

- latest valid official V2 artifact;
- deterministic chronology;
- source binding;
- no recomputation;
- no V1 mixing;
- no trend direction.

## Step 46: Progress screen integration

When a valid V2 artifact exists:

- show `Latest Movement Profile`;
- show three raw metrics;
- show suggested focus;
- add `View Movement Profile`.

Keep existing V1 Progress behavior for users without V2 artifacts.

When V1 and V2 history both exist:

- do not compare them;
- preserve V1 history;
- label V1 historical interpretation as legacy only if the current screen already has a safe place for that label;
- do not redesign the full history system.

## Step 47: Multiple V2 profiles

A minimal history list may show:

- date;
- raw chair value;
- raw balance value;
- raw shoulder value;
- suggested focus.

Do not add:

- arrows;
- green/red direction;
- `improved`;
- `declined`;
- percentile change;
- focus change interpretation.

If this cannot fit safely without broad redesign, limit Stage 3D-B.2D.2B to the latest V2 card and document the deferred history-list work.

# PART Q — ONBOARDING/RESULT REUSE WITHOUT PUBLIC REPLACEMENT

## Step 48: Reusable result component

Build the V2 profile UI so it can later be embedded in onboarding/re-test flows.

Do not replace the public V1 `OnboardingResultsScreen`.

The internal V2 flow may use the dedicated V2 results screen with a `baseline` variant.

No `Build my plan` CTA.

No V2 onboarding block screen.

# PART R — VOICE/TEXT PARITY

## Step 49: Audit current voice coverage

Inspect whether all V2 active-flow prompts are truthfully covered by existing bundled cues:

- chair setup/practice;
- chair start;
- balance selected-leg setup;
- balance attempt/rest/ready;
- invalid tracking retry;
- shoulder selected-side setup;
- shoulder retry;
- transition/completion.

Rules:

- reuse an existing cue only when its spoken meaning is accurate;
- do not reuse a V1 12-second balance line for the 45-second protocol;
- visible text is always present;
- no runtime network TTS.

## Step 50: Conditional new audio generation

If dedicated local voice cues are required:

1. Add canonical cue definitions in the existing audio architecture.

2. Add a narrow generation group, for example:

```text
movement_profile_v2
```

3. Run a dry run.

4. Generate only the new V2 lines for:
   - Clara;
   - Marcus.

5. Update static manifest/fingerprints.

6. Extend `npm run verify:audio`.

7. Verify no unrelated audio changes.

8. Run Expo export.

Do not regenerate safety audio or the full library.

Do not expose credentials.

If voice parity cannot be completed, mark the stage blocked rather than silently shipping a text-only active assessment flow.

Reference-details and results screens may remain text-first; active camera instructions must preserve the current voice-first product contract.

# PART S — RESUME, OFFLINE, AND SYNC

## Step 51: Resume matrix

Test:

1. Exit during chair setup.
2. Exit during chair practice.
3. Background during chair active.
4. Background during balance active.
5. Exit during balance rest.
6. Exit after two valid balance attempts.
7. Exit during shoulder setup.
8. Exit after raw V2 completion but before reference details.
9. Exit after reference details but before local materialisation completes.
10. Exit after local materialisation but before remote sync.
11. Reopen with snapshot but missing assessment.
12. Reopen with snapshot + assessment.

Policy:

- do not resume stale active timers;
- preserve completed valid movement evidence;
- raw-complete pending profile resumes at reference details;
- frozen artifacts resume directly to Movement Profile;
- remote sync failure does not erase local artifacts.

## Step 52: Duplicate callback protection

Ensure repeated:

- camera completion;
- flow completion;
- materialisation;
- sync callback;
- navigation callback

does not create duplicate Check-Ups, snapshots, or assessments.

Use existing stable IDs and immutable attach behavior.

# PART T — ACCESSIBILITY AND RESPONSIVE UX

## Step 53: Accessibility

Required:

- screen-reader labels for all choices/actions;
- announce attempt number and timer state without excessive per-second chatter;
- accessible error/recovery text;
- minimum touch targets;
- dynamic text support;
- no color-only meaning;
- raw values read with units;
- `Above the published middle range` not announced as success.

## Step 54: Responsive layout

Use existing responsive/theme helpers.

Verify:

- compact phone width;
- large phone;
- text scaling;
- long reference-detail copy;
- no clipped timers/buttons;
- safe-area behavior;
- orientation assumptions remain portrait unless current Check-Up supports otherwise.

Do not redesign the whole app.

# PART U — COPY GUARDRAILS

## Step 55: Add focused guardrails

Protect V2 production UI from:

- movement age;
- body age;
- typical age;
- weakest system/domain;
- scientifically weakest;
- diagnosis;
- fall risk;
- impairment;
- improved;
- declined;
- younger;
- older;
- passed/failed;
- exact percentile when chair transform is absent;
- balance percentile/range;
- “above shoulder range is better.”

Do not globally ban terms required in legacy/internal code.

Test the V2 copy modules/screens specifically.

# PART V — OBSERVABILITY AND PRIVACY

## Step 56: Diagnostics

Use bounded codes for:

- internal gate unavailable;
- V2 flow state;
- movement setup issue;
- invalid trial;
- pending reference details;
- materialisation outcome;
- conflict/reuse;
- sync pending/failure;
- result-view-model invalidity.

Include only:

- Check-Up/snapshot/assessment IDs;
- movement ID;
- attempt number;
- state/reason code;
- protocol version;
- artifact action.

Exclude:

- raw frames;
- landmarks;
- video;
- auth data;
- full profile;
- free-text health notes;
- reference source documents;
- provider secrets.

Pure helpers do not log.

# PART W — REQUIRED TEST MATRIX

## A. Internal gate

- default false;
- exact true value;
- malformed false;
- no user persistence;
- no backend authority;
- no public deep link;
- V1 default unchanged.

## B. Flow controller

- deterministic state sequence;
- protocol policy frozen;
- battery order;
- duplicate callback;
- app background;
- resume;
- no V1 scoring state.

## C. Chair integration

- setup yes/uncertain;
- practice required;
- practice not counted;
- count reset;
- 30-second boundary;
- hand-push flag;
- tracking interruption;
- raw completion.

## D. Balance integration

- leg selection/prior prefill/change;
- attempt 1 ceiling;
- attempts 1–3;
- best result;
- 30-second rest gate;
- 60-second default;
- use result;
- invalid tracking retry;
- second invalid;
- background;
- hard cap;
- UI attempt labels.

## E. Shoulder integration

- side selection/prior prefill/change;
- right default confirmation;
- selected-side preflight;
- one retry;
- pain-limited result;
- invalid second attempt;
- raw completion.

## F. Hinge supporting

- included;
- invalid hinge does not block headline completeness;
- cannot substitute shoulder;
- no reference/focus effect.

## G. Raw completion/pending

- complete raw V2 persisted;
- incomplete routes retake;
- no snapshot before reference details;
- pending selector;
- resume to reference details;
- no duplicate raw record.

## H. Reference details

- exact age;
- invalid age;
- skip;
- female/male/prefer not to say;
- no inference;
- no ambiguous profile-age prefill;
- prior V2 prefill/confirm/edit;
- exit/resume;
- no global profile mutation.

## I. Materialisation

- ready;
- existing snapshot/assessment reuse;
- snapshot only -> assessment materialised;
- reference-profile conflict;
- life-goal conflict;
- needs retake;
- local save;
- remote sync failure;
- no block/report.

## J. View model

- full eligible mix;
- all raw-only;
- chair raw-only;
- balance every task band;
- shoulder every IQR category;
- domain focus;
- goal-led focus;
- balanced;
- invalid/missing artifact;
- deterministic;
- no recomputation.

## K. Results screen

- cards;
- focus copy;
- caveat;
- detail navigation;
- no Build Plan;
- no prohibited claims;
- accessibility.

## L. Detail screen

- chair raw-only reason;
- balance benchmark neutral;
- shoulder above neutral;
- selected leg/side;
- no internal IDs.

## M. Progress

- latest V2 card;
- no V2 artifact -> V1 unchanged;
- V1/V2 not compared;
- no trend arrows/copy;
- detail navigation.

## N. Resume/sync

- all resume states;
- local materialised/remote failed;
- restored artifact display;
- no re-materialisation.

## O. Voice/audio

- canonical visible text;
- active-flow voice parity;
- selected voice;
- no cross-voice fallback for new required lines;
- audio integrity if assets added.

## P. Containment

- no V2 MovementBlock;
- no V2 report;
- no public onboarding replacement;
- no official-retest UI route;
- no Warden transform;
- no profile schema/reference-sex field;
- V1 default unchanged.

## Q. Regression

- Stage 3D-B.2A;
- Stage 3D-B.2B;
- Stage 3D-B.2C;
- Stage 3D-B.2D.1;
- Stage 3D-B.2D.2A;
- Stage 2A.1;
- V1 scoring/focus/results;
- Stage 4 closure;
- Stage 5H;
- safety audio;
- navigation;
- TypeScript boundaries.

## Test-quality requirements

Tests must:

- exercise real V2 controllers and application helpers;
- use deterministic timestamps;
- render real screen/view-model branches with current test utilities;
- assert artifact IDs/fingerprints are reused;
- assert no live recomputation;
- assert V1 screen behavior remains;
- assert raw-only chair stays raw-only;
- assert no trend claims;
- assert no block creation.

Tests must not:

- mock every layer;
- assert only helper calls;
- use real camera hardware;
- depend on real-time sleeps;
- install packages;
- contact source websites;
- embed Warden data;
- alter source tables;
- weaken prior artifact parsers.

# PART X — VALIDATION COMMANDS

Run targeted tests for:

- internal gate;
- V2 flow controller;
- V2 Check-Up screen;
- V2 protocol controllers;
- pending artifact selectors;
- reference-details screen;
- materialisation application service;
- V2 view model;
- V2 results/detail screens;
- Progress integration;
- history/sync/restore;
- V1 Check-Up/results regression;
- Stage 4 closure;
- Stage 5H lifecycle.

If new V2 audio is added, also run its focused generator/verifier tests and record:

- dry-run count;
- provider call count;
- Clara/Marcus generated counts;
- exact files changed.

Then run exactly:

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
rm -rf /tmp/hale-stage3db2d2b-export
npx --no-install expo export --platform all --output-dir /tmp/hale-stage3db2d2b-export
rc=$?
rm -rf /tmp/hale-stage3db2d2b-export
exit $rc
```

Do not install dependencies.

Record:

- exact targeted command;
- targeted suite/test counts;
- full suite/test counts;
- audio verification counts;
- any new V2 audio counts;
- app typecheck;
- website typecheck;
- Expo config;
- Expo export;
- git diff check;
- Watchman warning;
- Jest open-handle notice;
- Sentry warning;
- any new warning;
- whether validation changed files.

# PART Y — MANUAL SOURCE TRACE AFTER TESTS

Retrace:

### Internal entry

```text
internal gate
-> Settings diagnostics action
-> V2 baseline/baseline-retake source
-> dedicated V2 screen
```

### Chair

```text
setup
-> practice
-> countdown
-> 30-second result
```

### Balance

```text
leg selection
-> attempt
-> rest/use-result/retry
-> best valid result
```

### Shoulder

```text
side selection
-> side-specific preflight
-> capture/retry
-> result
```

### Raw-to-profile

```text
raw complete V2 Check-Up
-> local persistence
-> reference details
-> artifact materialiser
-> frozen snapshot + assessment
-> local/backend persistence
-> results view model
```

### Resume

```text
raw complete without snapshot
-> reference details
```

and:

```text
frozen snapshot + assessment
-> direct Movement Profile display
```

### Containment

Confirm:

- V1 remains default;
- no V2 block;
- no V2 report;
- no public onboarding replacement;
- no Warden transform;
- no trend interpretation.

# PART Z — REMEDIATION REPORT

Create exactly one new report:

```text
docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2D_2B.md
```

Do not edit prior reports.

The report must contain:

1. Scope.
2. Product policies implemented.
3. Initial Git status.
4. Existing V1/V2 UI architecture.
5. Internal gate.
6. Internal entry/source-type policy.
7. V2 flow controller.
8. Dedicated V2 screen/camera integration.
9. Chair UI behavior.
10. Balance UI behavior.
11. Shoulder UI behavior.
12. Hinge supporting behavior.
13. Raw Check-Up construction/persistence.
14. Pending artifact/resume behavior.
15. Reference-details draft/screen.
16. Reference-details prefill/skip behavior.
17. Artifact materialisation.
18. Conflict/sync-failure behavior.
19. Movement Profile view model.
20. Results screen.
21. Domain detail screen.
22. Progress integration.
23. V1/legacy containment.
24. Voice/text/audio behavior.
25. Accessibility/responsive behavior.
26. Copy guardrails.
27. Payload/observability safety.
28. Files changed.
29. Tests added/changed.
30. Exact targeted validation.
31. Exact full validation.
32. Audio verification/generation result.
33. App/website typechecks.
34. Expo config/export.
35. Stage 3D-B.2A/2B/2C/2D.1/2D.2A and Stage 2A.1/3/4/5 regression verification.
36. Remaining Stage 3D-B work.
37. Whether Stage 3D-B.2D.2C is unblocked.
38. Initial and final Git status.
39. Complete files-changed inventory.
40. Concurrent external changes.
41. Confirmation that no package install, lockfile change, source PDF/workbook commit, staging, commit, branch, or push occurred.

# REQUIRED INVARIANT OUTCOMES

After Stage 3D-B.2D.2B:

1. V1 remains public/default.
2. V2 internal gate defaults false.
3. V2 gate is not user/backend/profile controlled.
4. One internal V2 entry exists only when enabled.
5. A dedicated V2 flow consumes the pure V2 controllers.
6. V2 headline movements never use the legacy generic controller.
7. Chair setup/practice/30-second flow works.
8. Chair practice never counts.
9. Balance selected leg is explicit.
10. Balance adaptive best-of-three works.
11. Balance rest minimum cannot be bypassed.
12. Invalid balance trial does not consume a valid attempt.
13. Shoulder selected side is explicit.
14. Shoulder one-retry policy works.
15. Hinge remains supporting only.
16. Complete raw V2 Check-Up is persisted before reference details.
17. Incomplete headline evidence does not materialise an assessment.
18. Pending raw result can resume at reference details.
19. Exact age/reference group are per-Check-Up inputs.
20. Reference group is never inferred.
21. Ambiguous legacy profile age is not promoted to exact age.
22. User may continue without comparisons.
23. Reference details are frozen in the snapshot only.
24. Existing frozen artifacts are reused.
25. Changed live inputs cannot overwrite them.
26. Snapshot/assessment materialisation uses existing orchestration.
27. Results UI reads frozen artifacts only.
28. Results UI never reruns interpretation/focus.
29. Chair remains raw-only in production.
30. Balance task-band copy is exact.
31. Balance benchmark is neutral detail only.
32. Shoulder above-IQR is neutral.
33. Suggested focus comes only from frozen assessment.
34. Balanced focus displays as first-class mode.
35. No `weakest`/Movement Age/diagnosis copy appears.
36. No improvement/decline claims appear.
37. Domain detail hides internal IDs.
38. Progress can show the latest V2 profile.
39. V1/V2 are not compared.
40. No V2 MovementBlock is created.
41. No V2 report is created.
42. No official V2 re-test UI route is added.
43. No public onboarding replacement is added.
44. No Warden data/transform is embedded.
45. Local artifacts survive remote sync failure.
46. Resume does not duplicate artifacts.
47. Active camera instructions preserve voice/text parity.
48. Safety audio remains valid.
49. Stage 4/5 contracts remain.
50. No unrelated product logic changes.

# ACCEPTANCE CRITERIA

Do not mark Stage 3D-B.2D.2B complete unless:

1. Internal V2 gate and entry are fail-closed.

2. Dedicated V2 Check-Up flow is fully wired.

3. Chair, balance, shoulder, and supporting hinge paths are tested.

4. Raw V2 completion/pending-resume works.

5. Per-Check-Up reference details work without global profile mutation.

6. Frozen artifact materialisation works.

7. Results and domain detail use only frozen artifacts.

8. Latest V2 Progress surface works without trend interpretation.

9. V1 remains unchanged.

10. No block/report/public rollout exists.

11. Active camera voice/text parity is complete.

12. Targeted tests pass.

13. Full Jest passes.

14. `npm run verify:audio` passes.

15. App typecheck passes.

16. Website typecheck passes.

17. Expo config passes.

18. Expo export passes.

19. `git diff --check` passes.

20. No new warning is introduced without explanation.

21. No unrelated user work is reverted or overwritten.

22. No package install or lockfile change occurs.

23. No source PDF/workbook is committed.

24. No staging, commit, branch, or push occurs.

# STAGE DECISIONS

At the end of the report, state exactly one:

- `STAGE 3D-B.2D.2B COMPLETE`
- `STAGE 3D-B.2D.2B BLOCKED`

Also state one for each:

- `INTERNAL V2 CHECK-UP FLOW IMPLEMENTED`
- `INTERNAL V2 CHECK-UP FLOW BLOCKED`

- `V2 REFERENCE DETAILS UI IMPLEMENTED`
- `V2 REFERENCE DETAILS UI BLOCKED`

- `MOVEMENT PROFILE V2 RESULTS UI IMPLEMENTED`
- `MOVEMENT PROFILE V2 RESULTS UI BLOCKED`

- `MOVEMENT PROFILE V2 PROGRESS SURFACE IMPLEMENTED`
- `MOVEMENT PROFILE V2 PROGRESS SURFACE BLOCKED`

Also state exactly one:

- `STAGE 3D-B.2D.2C UNBLOCKED`
- `STAGE 3D-B.2D.2C BLOCKED`

Use `STAGE 3D-B.2D.2C UNBLOCKED` only if:

- internal V2 flow produces stable frozen artifacts;
- results UI renders those artifacts without recomputation;
- reference details are frozen safely;
- resume/sync behavior is deterministic;
- V1 remains default;
- no V2 block/report leakage exists.

Also state:

- `MOVEMENT PROFILE V2 INTERNAL ONLY`
- `V1 PUBLIC DEFAULT UNCHANGED`
- `CHAIR WARDEN TRANSFORM NOT EMBEDDED`
- `CHAIR REFERENCE CLAIM REMAINS RAW-ONLY`
- `NO V2 MOVEMENTBLOCK CREATED`
- `NO V2 REPORT CREATED`
- `NO OFFICIAL V2 RETEST UI ROUTE`
- `NO PUBLIC V2 ROLLOUT`
- `NO IMPROVEMENT OR DECLINE CLAIMS`
- `STAGE 4 REMEDIATION COMPLETE`
- `STAGE 5 REMEDIATION COMPLETE`
- `OVERALL BETA RELEASE STILL BLOCKED`
- `PHYSICAL DEVICE VALIDATION REQUIRED`

Do not declare Hale beta-ready.

# FINAL CODEX RESPONSE

Return a concise summary containing:

- Remediation report path.
- Whether production code changed.
- Internal gate behavior.
- Internal entry/source-type behavior.
- V2 flow-controller architecture.
- Chair UI behavior.
- Balance UI behavior.
- Shoulder UI behavior.
- Hinge supporting behavior.
- Raw Check-Up persistence.
- Pending/resume behavior.
- Reference-details behavior.
- Artifact materialisation behavior.
- Movement Profile view-model behavior.
- Results-screen behavior.
- Domain-detail behavior.
- Progress integration.
- Voice/text/audio result.
- V1/block/report/public containment.
- Files changed.
- Tests added/changed.
- Targeted validation result.
- Audio verification/generation result.
- Full-suite result.
- App typecheck.
- Website typecheck.
- Expo config.
- Expo export.
- `git diff --check`.
- Confirmation that Stage 3D-B.2A/2B/2C/2D.1/2D.2A, Stage 2A.1, Stage 3B/3C/3D, Stage 4, Stage 5, navigation, TypeScript boundaries, progression policies, optional containment, and safety audio remain green.
- Remaining Stage 3D-B work.
- `STAGE 3D-B.2D.2B COMPLETE` or blocked.
- Internal-flow verdict.
- Reference-details verdict.
- Results-UI verdict.
- Progress-surface verdict.
- `STAGE 3D-B.2D.2C UNBLOCKED` or blocked.
- `MOVEMENT PROFILE V2 INTERNAL ONLY`.
- `V1 PUBLIC DEFAULT UNCHANGED`.
- `CHAIR WARDEN TRANSFORM NOT EMBEDDED`.
- `CHAIR REFERENCE CLAIM REMAINS RAW-ONLY`.
- `NO V2 MOVEMENTBLOCK CREATED`.
- `NO V2 REPORT CREATED`.
- `NO OFFICIAL V2 RETEST UI ROUTE`.
- `NO PUBLIC V2 ROLLOUT`.
- `NO IMPROVEMENT OR DECLINE CLAIMS`.
- `OVERALL BETA RELEASE STILL BLOCKED`.
- `PHYSICAL DEVICE VALIDATION REQUIRED`.
- Initial and final Git status.
- Complete files-changed inventory.
- Any concurrent external changes.
- Confirmation that no package install, lockfile change, source PDF/workbook commit, staging, commit, branch, or push occurred.
