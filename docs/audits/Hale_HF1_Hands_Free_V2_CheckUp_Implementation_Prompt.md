You are implementing the first hands-free remediation stage for Hale:

HALE HANDS-FREE FLOW — STAGE HF1
HANDS-FREE V2 MOVEMENT CHECK-UP IMPLEMENTATION,
CAMERA-READINESS AUTO-START,
AUTO-CAPTURE / AUTO-BEST RESULT,
SIDE / LEG INFERENCE WITH COMPARABILITY SAFEGUARDS,
AND NO-OFFICIAL-LOGIC REGRESSION

This is an implementation stage.

Scope is intentionally narrow:
- public V2 baseline / onboarding Movement Check-Up;
- public V2 baseline retake;
- public V2 official retest;
- optional full extra V2 Check-Up;
- the shared unified V2 Check-Up shell/coordinator used by those flows.

Do not implement HF2 micro-check hands-free changes in this task.
Do not implement HF3 training session hands-free changes in this task.
Do not change H5 routing, H5A Progress, H5B micro-check policy, H5C V1 route retirement, H5D release hardening, Warden, audio generation, training credit, progression, reports, or official Movement Profile claim policy.

## Why HF1 is required

The founder tested the current V2 Movement Check-Up from onboarding and had to press buttons during the Check-Up. That is not acceptable for Hale’s product promise.

Target product experience:

```text
User taps Start Movement Check-Up while holding phone.
User places phone down.
User steps into frame.
Hale detects correct position and stable readiness.
Hale starts a voice countdown.
Movement starts automatically.
Movement ends automatically.
Hale moves to the next movement.
No mid-flow phone tapping required.
```

The hands-free audit report is:

```text
docs/audits/HALE_HANDS_FREE_FLOW_AUDIT.md
```

The audit verdicts to carry forward:

```text
V2 MOVEMENT CHECK-UP REQUIRES MID-FLOW TOUCH TODAY
TRAINING SESSIONS REQUIRE MID-SESSION TOUCH TODAY
MICRO-CHECKS REQUIRE MID-FLOW TOUCH TODAY
HF1 HANDS-FREE V2 CHECK-UP IMPLEMENTATION RECOMMENDED
```

The audit found that current V2 baseline, baseline retake, official retest, and optional full extra Check-Up still require touch for:

```text
chair setup confirmation
balance standing-leg selection / confirmation
balance use-best acceptance in some paths
shoulder-side selection / confirmation
shoulder Start reach
hinge Start capture / Finish capture early stop
```

It also found that several parts are already hands-free:

```text
chair practice after setup
chair official countdown / active timing
balance attempt start after ready state
balance trial touchdown / ceiling
balance rest auto-advance after timeout
shoulder capture deadline finish
hinge capture deadline finish
```

HF1 must remove the remaining required mid-flow touches for the V2 Movement Check-Up, while preserving optional safety/help/accessibility controls.

## Current product baseline to preserve

Read and preserve the H5D closeout:

```text
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5D_RELEASE_CANDIDATE_HARDENING.md
```

Current truths:

```text
Normal public Check-Up is unified Movement Profile V2.
Public V1 Movement Age flow is retired from normal builds.
V1 is retained only for explicit rollback builds.
Accepted V2 state never falls back to V1.
H5A V2 Progress is preserved.
H5B micro-check policy is preserved.
Audio asset fingerprint gate passed.
Warden transform is deferred.
Chair reference claim remains raw-only.
Physical-device validation is not claimed.
Public release remains blocked.
```

Do not undo any of that.

## Product rule

After the user has entered the active Movement Check-Up flow and placed the phone, Hale must not require screen interaction to complete the Check-Up.

Required active-flow interactions must be replaced by one of:

```text
camera readiness
stable pose dwell
voice countdown
auto-capture window
auto-best-result policy
inferred body choice
timeout / retry / fail-closed recovery
```

Allowed buttons during active Check-Up:

```text
Help
Cancel / leave
Pause if already present and safe
Retry as optional fallback
I felt limited / pain-limited as optional metadata
I touched support as optional safety metadata
Accessibility fallback where readiness detection fails
Internal diagnostics export only behind internal/diagnostics flags
```

Those buttons may remain visible, but the user should not have to press them to make normal progress.

## Non-negotiable containment

HF1 must not:

- re-enable public V1 Check-Up/results;
- change official V2 source eligibility;
- make optional full extra Check-Ups official;
- create snapshots/assessments/blocks/reports from optional full extra Check-Ups;
- change scheduled micro-check slot behavior;
- change optional micro-check behavior;
- change training session credit/progression;
- change official Movement Profile history;
- change H4 report logic;
- change H5A Progress authority;
- change H5B micro-check rotation;
- change H5C route retirement;
- change H5D release flags;
- add Warden/percentiles/Movement Age;
- add improvement/decline/fall-risk/pass-fail claims;
- regenerate audio;
- add new voice cue assets;
- claim physical-device validation.

## Required prior reading

Read in full before editing:

```text
docs/audits/HALE_HANDS_FREE_FLOW_AUDIT.md
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5D_RELEASE_CANDIDATE_HARDENING.md
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5C_PUBLIC_V1_ROUTE_RETIREMENT.md
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5B_1_VERIFICATION_CLOSURE_CONTINUATION.md
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5B_BALANCED_MICRO_CHECK_POLICY.md
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5A_V2_CANONICAL_PROGRESS_HISTORY.md
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_1_1_POLICY_ALIGNED_CLOSURE_CONTINUATION.md
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_OFFICIAL_RETEST_REPORT_NEXT_BLOCK.md
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H3_1_END_TO_END_VERIFICATION.md
docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2E_A.md
docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2E_A_1.md
docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2D_2B.md
docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2D_2A.md
docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2D_1.md
docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5H.md
```

Also inspect:

```text
AGENTS.md
CLAUDE.md
docs/decisions.md
App.tsx
src/screens/MovementProfileV2UnifiedCheckUpScreen.tsx
src/screens/MovementProfileV2CheckUpScreen.tsx
src/screens/CheckUpRecordingShell.tsx
src/movementProfileV2/liveCoordinator.ts
src/movementProfileV2/internalCheckupFlow.ts
src/movementProfileV2/voiceRuntime.ts
src/movementProfileV2/voiceCues.ts
src/movementProfileV2/viewModel.ts
src/movements/chairRiseV2.ts
src/movements/oneLegBalanceV2.ts
src/movements/activeShoulderReachV2.ts
src/movements/hingeReach.ts
src/checkup/movementProfileV2.ts
src/checkup/publicCheckUpEngine.ts
src/screens/MovementProfileV2ReferenceDetailsScreen.tsx
src/results/movementProfileV2ResultsAdapter.ts
src/haleFlow/movementProfileV2Block.ts
src/haleFlow/movementProfileV2BlockReport.ts
src/haleFlow/checkupHistory.ts
src/reference/movementProfileV2/snapshot.ts
src/reference/movementProfileV2/assessment.ts
src/reference/movementProfileV2/persistence.ts
src/services/backend/checkupSyncService.ts
src/services/backend/restoreService.ts
src/services/backend/dataExportService.ts
```

Search broadly for:

```text
Confirm setup
setup confirmation
selectedStandingLeg
standing leg
selectedShoulderSide
shoulder side
Start reach
Start capture
Finish capture
Use this result
support touched
I touched support
Stop attempt
I'm ready
pain limited
retry
manual_extra_v2
MovementProfileV2LiveCoordinator
receiveUserAction
balance_use_best
chair_setup
balance_setup
shoulder_setup
shoulder_ready
hinge_setup
```

Treat current code and untracked production files as source of truth.

# PART A — WORKTREE SAFETY AND BASELINE

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
2. Inspect diffs before touching a file.
3. Preserve existing UI fixes in Progress and Manual / Extra Check-Up screens.
4. Preserve H5D, H5C, H5B, H5A code.
5. Do not edit prior reports or `docs/decisions.md`.
6. Do not use destructive Git commands.
7. Do not install packages.
8. Do not modify lockfiles.
9. Do not regenerate audio.
10. Do not stage, commit, branch, push, or open a PR.
11. Do not inspect or expose `.env` values or provider credentials.
12. Do not modify fonts/assets.
13. If concurrent work makes V2 Check-Up flow authority ambiguous, stop and mark HF1 blocked.

## Step 2: Baseline validation

Run before edits:

```bash
npm run typecheck
npm run verify:audio
```

Run focused baseline tests for:

- V2 live coordinator;
- MovementProfileV2UnifiedCheckUpScreen;
- CheckUpRecordingShell;
- V2 voice runtime/cues;
- public Check-Up engine;
- H3.1 lifecycle;
- H4/H4.1.1 official retest;
- H5C route retirement;
- H5D release flags;
- optional full extra Check-Up if tests exist.

Then run:

```bash
npm test -- --runInBand
npm --prefix website run typecheck
npx --no-install expo config --type public
git diff --check
```

Also run:

```bash
rm -rf /tmp/hale-hf1-baseline-export
npx --no-install expo export --platform all --output-dir /tmp/hale-hf1-baseline-export
rc=$?
rm -rf /tmp/hale-hf1-baseline-export
exit $rc
```

Record exact counts and warnings.

# PART B — IMPLEMENTATION DESIGN

## Step 3: Add hands-free mode to V2 Check-Up

Use the existing public unified V2 flow.

Add a hands-free active-flow mode for public V2 Check-Ups. Recommended:

```ts
handsFreeMode: true
```

or equivalent, defaulting true for public baseline, baseline retake, official retest, and optional full extra Check-Up.

Internal/debug harnesses may retain manual controls behind internal flag if helpful, but public default must be hands-free.

If possible, implement hands-free behavior inside `MovementProfileV2LiveCoordinator` / public adapter rather than scattering timers inside React.

## Step 4: No required mid-flow controls

In public hands-free mode, the following must not be required to proceed:

```text
Confirm setup
standing-leg selection/confirmation
shoulder-side selection/confirmation
Start reach
Start capture
Finish capture
Use this result
I'm ready after rest
```

These may remain as optional fallback actions only when the primary hands-free path is stuck or when internal mode is active.

## Step 5: UI copy

The user should always know what Hale is waiting for.

Replace “tap to confirm/start” primary copy with “get into position / hold still / I’ll start when you’re ready” copy.

Examples:

```text
Set up your chair and sit where I can see you.
I’ll start once you’re in position.

Stand on one leg when you’re ready.
I’ll start the timer automatically.

Turn side-on and raise the arm closest to the camera.
I’ll capture the reach automatically.

Reach forward comfortably and hold.
I’ll capture your best steady position.
```

Do not show internal labels such as V2, schema, protocol ID, fingerprint.

# PART C — CHAIR HANDS-FREE

## Step 6: Remove required chair setup confirmation

Current required action:

```text
chair_setup -> Confirm setup
```

New public behavior:

```text
chair_setup
-> voice/text explains chair setup
-> live camera waits for stable chair-start readiness
-> after readiness dwell, transition to chair practice automatically
```

Recommended readiness for chair:

- subject visible;
- side/frontal orientation according to existing protocol;
- hips/knees/ankles visible enough for chair-rise geometry;
- user seated or in accepted chair-start posture;
- body stable for configured dwell;
- no tracking interruption.

Use existing V2 chair controller/setup evidence where possible.

Do not weaken setup evidence. If setup cannot be confirmed by camera, store setup evidence as camera-inferred/uncertain according to existing protocol evidence policy rather than pretending it was user-confirmed.

Chair official result remains raw-only.

## Step 7: Chair practice and official countdown

Preserve:

- practice rep gate;
- official 30-second timer;
- full-stand-at-expiry behavior;
- raw repetitions;
- push-off flag if currently supported;
- tracking interruption policy;
- voice/text countdown.

Do not change chair scoring/reference output.

## Step 8: Chair fallback

If camera readiness cannot be established within a timeout:

- show calm setup help/retry;
- provide optional accessibility fallback button;
- do not require confirmation in the normal path;
- do not fabricate setup confidence.

# PART D — BALANCE HANDS-FREE

## Step 9: Remove required standing-leg selection / confirmation

Current required action:

```text
balance_setup -> choose/confirm standing leg
```

New public behavior:

If prior official leg exists:

```text
voice/text: Use the same leg as last time: <left/right>.
camera waits for stable standing-leg readiness.
```

If no prior official leg exists:

```text
voice/text: Stand on whichever leg feels natural.
camera infers standing leg from the stable lifted-foot/stance pattern.
```

Persist the selected/inferred leg with source metadata.

Recommended metadata:

```text
selectionSource:
  prior_prompt_camera_confirmed
  camera_inferred
  user_fallback_selected
  unknown
```

Adapt to existing metadata conventions.

Do not infer from filenames, old video, audio text, or global profile state.

## Step 10: Changed-leg comparability

If current inferred/selected leg differs from the prior official leg:

- result remains valid if measurement is otherwise valid;
- direct balance comparison must remain suppressed / marked not directly comparable by existing comparison policy;
- no focus/report/plan logic should treat changed-leg evidence as a directly comparable improvement/decline;
- preserve existing changed-from-prior metadata or add a backward-compatible camera-inferred equivalent.

Do not change H4 comparison policy except to preserve this metadata.

## Step 11: Auto-start balance attempt

Balance attempt should start after:

- correct person visible;
- standing pose ready;
- lifted-foot pattern stable;
- inferred/confirmed standing leg stable;
- no tracking interruption;
- dwell satisfied.

Then voice countdown / timer starts automatically.

Do not require a “ready” tap.

## Step 12: Support touch and stop attempt

These may remain optional safety controls:

```text
I touched support
Stop attempt
```

But they must not be required in the normal path.

If hand support cannot be reliably camera-detected:

- do not claim it was not touched;
- store support status as unknown unless user reports it;
- preserve raw measurement and claim eligibility policy conservatively.

## Step 13: Auto-best result

Remove required `Use this result` for normal progression.

Implement auto-accept policy:

- use best valid trial after max configured valid trials;
- use best valid trial after 45-second ceiling;
- use best valid trial after hard time cap;
- use best valid trial if no further trial is needed according to existing policy;
- if no valid trial, route to retry / no-measurement recovery.

Do not force a button press to accept a best result.

If the current controller needs an explicit user action to complete, add a pure coordinator policy that dispatches the existing completion action automatically when its acceptance criteria are met.

## Step 14: Rest handling

Do not require `I'm ready` to advance.

Preserve minimum rest.

After minimum rest:

- if user is clearly ready and stable, begin next attempt automatically;
- otherwise wait until max rest timeout and then continue/finish according to current safe policy.

The `I'm ready` button may remain optional acceleration / accessibility fallback.

# PART E — SHOULDER HANDS-FREE

## Step 15: Remove required shoulder-side selection / confirmation

Current required action:

```text
shoulder_setup -> choose/confirm side
```

New public behavior:

If prior official shoulder side exists:

```text
voice/text: Use the same side as last time: <left/right>.
camera waits for side-view readiness and matching arm readiness.
```

If no prior side exists:

```text
voice/text: Turn side-on and use the arm closest to the camera.
camera infers side from side orientation and first clearly raised arm.
```

Persist selected/inferred side with source metadata.

Do not infer from global profile, filenames, voice text, or arbitrary stored preferences.

## Step 16: Changed-side comparability

If current inferred side differs from prior official side:

- result can remain valid;
- direct shoulder/mobility comparison must remain suppressed / marked not directly comparable;
- preserve or add changed-from-prior metadata compatible with current comparison rules.

Do not change claim policy.

## Step 17: Remove required Start reach

Current required action:

```text
shoulder_ready -> Start reach
shoulder_retry_ready -> Start reach
```

New public behavior:

- wait for side-view readiness and stable starting posture;
- voice says reach when ready;
- capture window starts automatically when readiness is stable;
- peak capture ends automatically at deadline or after stable capture policy.

## Step 18: Pain-limited / retry

`I felt limited` may remain an optional metadata/fallback button.

Retry may remain optional after invalid tracking or pain-limited capture.

Normal path must not require retry/tap unless measurement is invalid and no automatic retry policy remains.

# PART F — HINGE HANDS-FREE

## Step 19: Remove required Start capture

Current required action:

```text
hinge_setup -> Start capture
```

New public behavior:

- voice/text instructs reach forward comfortably and hold;
- camera detects side-view / hinge-start readiness;
- capture window starts automatically once readiness dwell is satisfied.

## Step 20: Finish capture

`Finish capture` may remain optional early-stop fallback, but normal path should auto-finish:

- at deadline;
- or after a stable best capture window if current protocol supports it.

Supporting hinge remains supporting/no-measurement compatible.

Do not make hinge a headline requirement if current V2 policy does not.

# PART G — OPTIONAL FULL EXTRA CHECK-UP

## Step 21: Route through the same hands-free V2 shell

Optional full extra Check-Up must benefit from HF1 hands-free behavior because it uses the same unified V2 shell.

Preserve optional/non-official containment:

- source remains non-official/manual-extra/practice;
- no official snapshot;
- no official assessment;
- no MovementBlock;
- no V2 report;
- no official history row;
- no latestProfile update;
- no current-plan mutation;
- no Progress official-history change.

Add tests that optional full extra Check-Up hands-free completion still does not materialize official artifacts.

# PART H — INTERNAL / ACCESSIBILITY FALLBACKS

## Step 22: Internal manual controls

If internal harnesses still need manual buttons for debug comparison, keep them behind:

```text
EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_INTERNAL=1
```

Do not expose internal controls in normal beta/public flow.

## Step 23: Accessibility fallback

If readiness detection fails, user may need a fallback to continue.

Requirements:

- fallback must be clearly labelled as an accessibility/help fallback;
- fallback should preserve setup uncertainty metadata where appropriate;
- fallback should not upgrade reference/claim eligibility;
- fallback must not silently create official confidence;
- fallback should be available only after a reasonable timeout or recovery state, not as the primary path.

## Step 24: No accidental starts

Auto-start must require stable dwell and correct movement-specific readiness.

Do not start:

- while user is walking into frame;
- during tracking interruption;
- while too close/far/off-center;
- while wrong orientation;
- before voice instruction has been delivered or displayed;
- before minimum rest has elapsed for balance.

# PART I — STATE / METADATA / COMPATIBILITY

## Step 25: Avoid schema churn if possible

Prefer reusing current setup metadata fields and evidence states.

If new metadata is required, add it backward-compatibly and document:

- camera-inferred vs user-confirmed source;
- prior prompt used;
- changed-from-prior;
- setup uncertain/accessibility fallback;
- protocol version/fingerprint effect if any.

Do not invalidate existing accepted V2 artifacts without reason.

## Step 26: Persistence and restore

Hands-free inferred metadata must survive:

- local history serialization;
- backend sync;
- restore;
- export;
- H4 comparison/report creation.

Raw landmarks, frames, video, images, and media must not be persisted.

# PART J — UI REQUIREMENTS

## Step 27: Preserve visual shell

Do not redesign the Check-Up screen.

Preserve:

- current polished `CheckUpRecordingShell`;
- pose/avatar viewport;
- footer cards;
- Hale logo chrome;
- help/discard modals;
- spacing, typography, cards, colors;
- accessibility labels;
- responsive behavior.

Only change stage text/actions needed to make the flow hands-free.

## Step 28: Clear waiting states

Each hands-free waiting state must show:

- what Hale is waiting for;
- what the user should do physically;
- that the app will start automatically;
- optional fallback/help.

Examples:

```text
Move into view.
Sit tall on the chair.
Hold still — I’ll start when you’re ready.
Stand on one leg when you’re ready.
Turn side-on and raise the arm closest to the camera.
Reach forward and hold.
```

## Step 29: Voice/text parity

Use existing voice runtime and existing cues.

Do not add new audio assets.

If text changes are necessary but no cue exists:

- use existing closest cue where safe;
- keep visible text truthful;
- do not require audio generation;
- record any future audio-copy gap in the report.

# PART K — TEST MATRIX

## A. Source / architecture guards

- public V2 unified Check-Up no longer renders required mid-flow action buttons for chair setup, balance leg selection, shoulder side selection, shoulder start, hinge start, or use-best in normal path;
- internal harness may keep controls only behind internal flag;
- no V1 imports/routes reintroduced;
- no official artifact builders called by optional extra flow;
- screen remains presentation shell + coordinator, not artifact authority.

## B. Chair

- chair setup auto-advances after camera readiness dwell;
- no `Confirm setup` required;
- practice starts after readiness;
- official countdown/window unchanged;
- timeout shows recovery/fallback;
- fallback marks setup uncertainty rather than reference-eligible confirmation.

## C. Balance

- no required leg selection when no prior leg;
- camera infers standing leg;
- prior leg is voice/text prompted on retest;
- changed leg metadata preserved;
- changed leg suppresses direct comparison through existing policy;
- attempt auto-starts after ready dwell;
- rest auto-continues or finishes after policy;
- best result auto-accepted;
- support touched remains optional;
- no valid trial -> retry/recovery.

## D. Shoulder

- no required side selection when no prior side;
- camera infers side / nearest raised arm;
- prior side is voice/text prompted on retest;
- changed side metadata preserved;
- changed side suppresses direct comparison through existing policy;
- no `Start reach` required;
- capture auto-starts after readiness;
- capture auto-finishes;
- pain-limited optional fallback remains.

## E. Hinge

- no `Start capture` required;
- capture auto-starts after readiness;
- capture auto-finishes;
- optional finish fallback does not count as required;
- no-measurement remains JSON-safe/null where applicable.

## F. Public flows

- onboarding baseline fully completes V2 Check-Up without required mid-flow taps;
- baseline retake fully completes without required mid-flow taps;
- official retest fully completes without required mid-flow taps;
- optional full extra Check-Up fully completes without required mid-flow taps.

## G. Official artifact containment

For official baseline/retake/retest:

- raw Check-Up produced;
- snapshot/assessment materialization unchanged;
- MovementBlock creation unchanged;
- H4 comparison/report unchanged;
- Progress latestProfile unchanged except from official sources.

For optional extra full Check-Up:

- raw/practice result allowed;
- no official snapshot/assessment/block/report/history/latestProfile.

## H. H5 regression

- H5A Progress remains green;
- H5B micro-check policy remains green;
- H5C V1 route retirement remains green;
- H5D release flags remain green;
- audio verification remains green.

## I. Accessibility

- cancel/help/retry/fallback controls remain accessible;
- no user is trapped forever if readiness fails;
- waiting states have clear accessible labels;
- touch target size remains valid;
- no color-only status.

# PART L — VALIDATION

## Step 30: Focused validation

Run focused tests for:

- liveCoordinator;
- MovementProfileV2UnifiedCheckUpScreen;
- MovementProfileV2CheckUpScreen voice runtime;
- CheckUpRecordingShell;
- V2 snapshot/assessment materialization;
- public Check-Up lifecycle;
- H4 official retest;
- optional full extra Check-Up containment;
- H5A Progress;
- H5B micro-check;
- H5C route retirement;
- H5D release flags.

Record exact command and counts.

## Step 31: Full release gate

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
rm -rf /tmp/hale-hf1-hands-free-checkup-export
npx --no-install expo export --platform all --output-dir /tmp/hale-hf1-hands-free-checkup-export
rc=$?
rm -rf /tmp/hale-hf1-hands-free-checkup-export
exit $rc
```

Record:

- focused suites/tests;
- full suites/tests;
- audio counts;
- app typecheck;
- website typecheck;
- Expo config;
- Android/iOS export;
- asset count;
- `git diff --check`;
- known warnings;
- new warnings.

# PART M — MANUAL SOFTWARE TRACE

After automated validation, manually trace from code/test state:

## Onboarding baseline

```text
Start Movement Check-Up
-> place phone
-> chair setup auto-readiness
-> chair practice/official
-> balance leg inferred
-> balance trials auto-start/auto-best
-> shoulder side inferred
-> shoulder auto-capture
-> hinge auto-capture
-> reference details
-> Movement Profile
-> plan
```

## Official retest

```text
retest_due
-> prior leg/side voice prompt
-> if same side/leg used, direct comparison allowed if other rules pass
-> if changed, result valid but direct comparison suppressed
-> report/next-block unchanged
```

## Optional full extra

```text
manual extra
-> same hands-free V2 flow
-> non-official result
-> no official artifact/plan/history mutation
```

# PART N — REPORT

Create exactly one new report:

```text
docs/audits/HALE_HANDS_FREE_V2_CHECKUP_HF1_IMPLEMENTATION.md
```

Do not edit prior reports or `docs/decisions.md`.

Required sections:

1. Scope.
2. Hands-free audit prerequisite.
3. H5D product constraints carried forward.
4. Initial Git status.
5. Baseline validation.
6. Current required-touch points fixed.
7. HF1 architecture.
8. Public vs internal hands-free mode.
9. Chair readiness implementation.
10. Balance leg inference and auto-best implementation.
11. Shoulder side inference and auto-capture implementation.
12. Hinge auto-capture implementation.
13. Accessibility/fallback controls.
14. Metadata/source/compatibility behavior.
15. Optional full extra Check-Up containment.
16. UI/copy changes.
17. Voice/audio behavior.
18. Official artifact/report/plan containment.
19. H5A/H5B/H5C/H5D regression.
20. Tests added/changed.
21. Files changed.
22. Focused validation.
23. Full validation.
24. Manual software trace.
25. Known limitations and HF2/HF3 follow-up.
26. Initial/final Git status.
27. Confirmation that no package install, lockfile change, audio regeneration, staging, commit, branch, push, Warden work, H5 route rollback, or physical-device validation claim occurred.

# REQUIRED INVARIANTS

After HF1:

1. Public V2 Movement Check-Up has no required mid-flow tap after phone placement.
2. Chair setup no longer requires `Confirm setup` in public path.
3. Balance no longer requires standing-leg selection/confirmation in public path.
4. Shoulder no longer requires side selection/confirmation in public path.
5. Shoulder no longer requires `Start reach`.
6. Hinge no longer requires `Start capture`.
7. Balance no longer requires `Use this result`.
8. Camera readiness and stable dwell drive starts.
9. Timers/auto-capture drive finishes.
10. Optional help/cancel/retry/safety controls remain.
11. Accessibility fallback exists when readiness fails.
12. Same-side/same-leg metadata remains source-bound.
13. Changed side/leg still suppresses direct comparison.
14. Optional full extra Check-Up remains non-official.
15. Official baseline/retake/retest artifacts remain correct.
16. No V1 public route is reintroduced.
17. No H5A/H5B/H5C/H5D regression.
18. No new audio assets are required.
19. Audio verification passes.
20. Full repository gate passes.
21. Physical-device validation is not claimed.
22. Public release remains blocked.

# ACCEPTANCE CRITERIA

Do not mark HF1 complete unless:

1. All public V2 Check-Up flows can complete without required mid-flow taps in deterministic tests.
2. Movement-specific readiness/auto-start behavior is tested.
3. Balance auto-best behavior is tested.
4. Side/leg inference and changed-side/leg comparability are tested.
5. Optional full extra Check-Up containment is tested.
6. Official artifact chain remains green.
7. H5C public V1 retirement remains green.
8. H5A/H5B/H5D remain green.
9. Full Jest passes.
10. App typecheck passes.
11. Website typecheck passes.
12. Audio verification passes.
13. Expo config/export pass.
14. `git diff --check` passes.
15. No unrelated work is overwritten.
16. No audio regeneration/package/lockfile change occurs.
17. No physical-device validation is claimed.

Do not mark complete if:

- any normal public V2 movement requires a mandatory tap;
- optional fallback button is the only way to proceed;
- readiness starts while the user is not stable;
- side/leg metadata is missing or fabricated;
- optional extra Check-Up creates official artifacts;
- public V1 route returns;
- audio gate fails.

# STAGE DECISIONS

At the end of the report state exactly one:

```text
HF1 HANDS-FREE V2 CHECK-UP IMPLEMENTATION COMPLETE
HF1 HANDS-FREE V2 CHECK-UP IMPLEMENTATION BLOCKED
```

Also state exactly one:

```text
PUBLIC V2 MOVEMENT CHECK-UP MID-FLOW TOUCH REMOVED
PUBLIC V2 MOVEMENT CHECK-UP STILL REQUIRES MID-FLOW TOUCH
```

Also state exactly one:

```text
CHAIR HANDS-FREE READINESS IMPLEMENTED
CHAIR HANDS-FREE READINESS BLOCKED
```

Also state exactly one:

```text
BALANCE HANDS-FREE LEG INFERENCE / AUTO-BEST IMPLEMENTED
BALANCE HANDS-FREE IMPLEMENTATION BLOCKED
```

Also state exactly one:

```text
SHOULDER HANDS-FREE SIDE INFERENCE / AUTO-CAPTURE IMPLEMENTED
SHOULDER HANDS-FREE IMPLEMENTATION BLOCKED
```

Also state exactly one:

```text
HINGE HANDS-FREE AUTO-CAPTURE IMPLEMENTED
HINGE HANDS-FREE IMPLEMENTATION BLOCKED
```

Also state exactly one:

```text
OPTIONAL FULL CHECK-UP NON-OFFICIAL CONTAINMENT PRESERVED
OPTIONAL FULL CHECK-UP CONTAINMENT BLOCKED
```

Also state:

```text
NO H5 ROUTING ROLLBACK
NO V1 PUBLIC ROUTE REINTRODUCTION
NO OFFICIAL PROFILE CONTAINMENT CHANGE
NO TRAINING CREDIT / PROGRESSION CHANGE
NO SCHEDULED MICRO-CHECK POLICY CHANGE
NO AUDIO REGENERATION
WARDEN TRANSFORM DEFERRED
PHYSICAL DEVICE VALIDATION NOT CLAIMED
PUBLIC RELEASE REMAINS BLOCKED
```

# FINAL CODEX RESPONSE

Return a concise summary containing:

- report path;
- whether production runtime code changed;
- current required-touch points removed;
- chair implementation;
- balance implementation;
- shoulder implementation;
- hinge implementation;
- side/leg metadata/comparability behavior;
- optional full extra Check-Up containment;
- accessibility fallback behavior;
- UI/copy changes;
- voice/audio behavior;
- tests added/changed;
- focused validation;
- full Jest;
- audio verification;
- app typecheck;
- website typecheck;
- Expo config/export;
- `git diff --check`;
- H5A/H5B/H5C/H5D regression result;
- `HF1 HANDS-FREE V2 CHECK-UP IMPLEMENTATION COMPLETE` or blocked;
- remaining HF2/HF3 follow-up, if any;
- initial/final Git status;
- complete files-changed inventory;
- confirmation that no package install, lockfile change, audio regeneration, staging, commit, branch, push, Warden work, H5 route rollback, or physical-device validation claim occurred.
