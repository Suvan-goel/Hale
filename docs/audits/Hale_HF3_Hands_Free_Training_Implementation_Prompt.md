You are implementing the third hands-free remediation stage for Hale:

HALE HANDS-FREE FLOW — STAGE HF3
HANDS-FREE TRAINING SESSION ACTIVE-FLOW ALIGNMENT,
FLOOR-SETUP CAMERA-READINESS AUTO-CONTINUE,
MID-SESSION REQUIRED-TAP REMOVAL,
SAFETY CONTROL PRESERVATION,
AND TRAINING CREDIT / PROGRESSION NON-REGRESSION

This is an implementation stage.

Scope is intentionally narrow:
- active training sessions launched from Today / Plan;
- extra sessions / presets / Explore / manual practice only where they reuse the same training player and floor-setup path;
- floor setup / floor-start readiness and any other proven required mid-session tap after the user has placed the phone;
- training session player/screen active-flow UI.

Do not change HF1 V2 Movement Check-Up behavior.
Do not change HF2 micro-check behavior.
Do not change H5 routing, H5A Progress, H5B micro-check policy, H5C V1 route retirement, H5D release hardening, Warden, audio generation, Movement Profile artifacts, training credit, progression, exercise selection, reports, or public V1 rollback policy.

## Why HF3 is required

The founder wants to test HF1, HF2, and HF3 together on device at the end.

HF1 is complete:
```text
docs/audits/HALE_HANDS_FREE_V2_CHECKUP_HF1_IMPLEMENTATION.md
```

HF1 removed normal required mid-flow taps from the public V2 Movement Check-Up.

HF2 is complete:
```text
docs/audits/HALE_HANDS_FREE_MICRO_CHECK_HF2_IMPLEMENTATION.md
```

HF2 removed normal required mid-flow side/leg setup taps from scheduled and optional micro-checks, while preserving H5B/H5B.1 containment.

The hands-free audit is:
```text
docs/audits/HALE_HANDS_FREE_FLOW_AUDIT.md
```

The audit found:
```text
TRAINING SESSIONS REQUIRE MID-SESSION TOUCH TODAY
```

Specifically, ordinary training is already mostly audio-first, but the V2.1 floor setup path can require an “I’m ready” / `confirmFloorStartPosition(...)` style tap before the set can continue. This is a problem when the user has already placed the phone and moved into position.

HF3 must make the active training flow hands-free where safe:

```text
transition / setup instructions
-> user moves into position
-> camera detects stable readiness
-> voice/text countdown starts automatically
-> set begins
```

The normal active training flow should not require the user to walk back to the phone to tap “I’m ready.”

## Current product baseline to preserve

Read and preserve H5D:
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
HF1 V2 Check-Up hands-free behavior is preserved.
HF2 micro-check hands-free behavior is preserved.
Audio asset fingerprint gate passed.
Warden transform is deferred.
Chair reference claim remains raw-only.
Physical-device validation is not claimed.
Public release remains blocked.
```

## Product rule

After the user starts a training session and places the phone, Hale should not require screen interaction to progress through ordinary exercise setup and set start when camera-readiness can safely detect that the user is ready.

Allowed touch interactions during active training:

```text
Pause
Resume
Help / repeat instructions
Skip exercise
Stop session
Cancel / leave
Safety fallback after timeout
Accessibility fallback after readiness failure
End-of-session feedback / RPE / pain questions after active training is over
```

Those controls are intentionally user-facing safety and accessibility controls and must remain.

Not allowed as the normal path during active training:

```text
required “I’m ready” tap after floor setup
required “Start set” tap after moving into position
required “Next” tap between sets/exercises when readiness/timer can handle it
required manual setup confirmation after phone placement
```

If any of those still exist, replace them with camera readiness, stable dwell, voice countdown, and fail-closed timeout/recovery.

## Non-negotiable containment

HF3 must not:

- change main-plan credit rules;
- change schedule credit rules;
- change A/B/C rotation;
- change 4-week scheduler;
- change restart credit;
- change progression evidence;
- change ladder progression policy;
- change exercise selection/generation;
- change daily readiness/discomfort policy;
- change equipment/capability gates;
- change safety cue definitions or audio assets;
- change HF1 V2 Check-Up;
- change HF2 micro-checks;
- change H5A Progress;
- change H5B micro-check rotation;
- change H5C V1 route retirement;
- create official Movement Profile artifacts;
- add Warden/percentiles/Movement Age;
- add improvement/decline/fall-risk/pass-fail claims;
- regenerate audio or add new voice assets;
- claim physical-device validation.

## Training controls that must remain

Do not remove or weaken:

```text
Pause / resume
Help / repeat
Skip exercise
Stop session
Leave / cancel
Visible safety text
Text fallback when audio fails
Tracking recovery copy
Support / floor / step / band safety cues
Readiness/discomfort pre-session input
Post-session feedback / RPE / pain input
```

Stage 4D added these controls and cue surfaces for safety. They are not the problem. The problem is any required progress tap after the user is already away from the phone.

## Required prior reading

Read in full before editing:

```text
docs/audits/HALE_HANDS_FREE_MICRO_CHECK_HF2_IMPLEMENTATION.md
docs/audits/HALE_HANDS_FREE_V2_CHECKUP_HF1_IMPLEMENTATION.md
docs/audits/HALE_HANDS_FREE_FLOW_AUDIT.md
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5D_RELEASE_CANDIDATE_HARDENING.md
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5C_PUBLIC_V1_ROUTE_RETIREMENT.md
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5B_1_VERIFICATION_CLOSURE_CONTINUATION.md
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5B_BALANCED_MICRO_CHECK_POLICY.md
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5A_V2_CANONICAL_PROGRESS_HISTORY.md
docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5H.md
docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5G_1.md
docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5F.md
docs/audits/HALE_LOGIC_REMEDIATION_STAGE_5E.md
docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4C_R.md
docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4D_R.md
docs/audits/HALE_LOGIC_VERIFICATION_STAGE_4D_R_1_CONTINUATION.md
docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4E_R.md
docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4F_R_1.md
docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4G_R.md
```

Also inspect:

```text
AGENTS.md
CLAUDE.md
docs/decisions.md
App.tsx
src/screens/TrainingSessionScreen.tsx
src/screens/SessionPreviewScreen.tsx
src/screens/SessionPlanningRecoveryScreen.tsx
src/training/sessionPlayer.ts
src/training/setRuntime.ts
src/training/index.ts
src/training/serialize.ts
src/training/dynamicState.ts
src/training/workoutGeneration.ts
src/training/dailyTrainingContext.ts
src/training/safetyCues.ts
src/training/safetyCueDefinitions.ts
src/training/movementCapabilitySafety.ts
src/training/validTimeProgression.ts
src/haleFlow/sessionPlanning.ts
src/haleFlow/progressionEvidence.ts
src/haleFlow/focusStimulusEvidence.ts
src/haleFlow/mainPlanEvents.ts
src/haleFlow/blockSchedule.ts
src/haleFlow/appLifecycle.ts
src/haleFlow/nextBestAction.ts
src/haleFlow/exploreViewModel.ts
src/profile/movementCapabilities.ts
src/profile/equipment.ts
src/components/SafePoseDetectionView.tsx
src/screens/recordingViewport.ts
src/audio/voicePlayer.ts
```

Search broadly for:

```text
floor setup
floorSetup
floor_start
floorStart
floor-ready
confirmFloorStartPosition
I'm ready
I’m ready
ready
start set
Start set
next set
Next set
next exercise
Next exercise
setup action
transition action
onPress
Pressable
Touchable
pause
resume
repeat
help
skip
stop
countdown
preflight
valid time
tracking pause
tracking recovery
camera readiness
framing ready
setRuntime
TrainingSessionPlayer
TrainingSessionScreen
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
3. Preserve HF1 changes.
4. Preserve HF2 changes.
5. Preserve restored Progress empty state and Manual / Extra Check-Up UI.
6. Preserve H5A/H5B/H5C/H5D code.
7. Do not edit prior reports or `docs/decisions.md`.
8. Do not use destructive Git commands.
9. Do not install packages.
10. Do not modify lockfiles.
11. Do not regenerate audio.
12. Do not stage, commit, branch, push, or open a PR.
13. Do not inspect or expose `.env` values or provider credentials.
14. Do not modify fonts/assets.
15. If concurrent work makes training-player authority ambiguous, stop and mark HF3 blocked.

## Step 2: Baseline validation

Run before edits:

```bash
npm run typecheck
npm run verify:audio
```

Run focused baseline tests for:

- `TrainingSessionScreen`;
- `TrainingSessionPlayer`;
- `sessionPlayer`;
- `setRuntime`;
- floor setup / movement capability;
- safety cues;
- session planning;
- Stage 5G/5H;
- progression evidence;
- H5A Progress;
- H5B micro-check;
- H5C route retirement;
- H5D release flags;
- HF1 V2 Check-Up;
- HF2 micro-checks.

Then run:

```bash
npm test -- --runInBand
npm --prefix website run typecheck
npx --no-install expo config --type public
git diff --check
```

Also run:

```bash
rm -rf /tmp/hale-hf3-baseline-export
npx --no-install expo export --platform all --output-dir /tmp/hale-hf3-baseline-export
rc=$?
rm -rf /tmp/hale-hf3-baseline-export
exit $rc
```

Record exact counts and warnings.

# PART B — RECONSTRUCT CURRENT TRAINING INTERACTION FLOW

## Step 3: Inventory all training controls

Create a complete table for active training and related reused flows:

```text
screen/state
visible control label
onPress / handler
required or optional
main-plan / extra / Explore / manual
can user be away from phone?
current purpose
HF3 decision
```

Include at minimum:

```text
SessionPreview start
readiness / discomfort input
session intro
exercise transition
floor setup
preflight/framing
instructions
countdown
active set
valid-time tracking pause
rest
next set
next exercise
pause
resume
help/repeat
skip exercise
stop session
leave/cancel
completion
feedback/RPE/pain
```

Classify every control as:

```text
KEEP_BEFORE_PHONE_PLACEMENT
KEEP_AFTER_ACTIVE_TRAINING
KEEP_OPTIONAL_SAFETY_CONTROL
KEEP_ACCESSIBILITY_FALLBACK
KEEP_INTERNAL_ONLY
REMOVE_REPLACE_WITH_CAMERA_READINESS
REMOVE_REPLACE_WITH_VOICE_TIMER
REMOVE_REPLACE_WITH_AUTO_ADVANCE
REMOVE_REPLACE_WITH_TIMEOUT_OR_RECOVERY
NEEDS_PRODUCT_DECISION
```

## Step 4: Identify required mid-session taps

Answer clearly in the report:

```text
Which required taps remain during active training today?
```

Expected from the audit:

```text
floor setup “I’m ready” / confirmFloorStartPosition
```

But do not assume. Inspect current code and tests.

If additional required mid-session taps exist, include them only if they are truly required in the normal path and the user can reasonably be away from the phone.

Do not remove optional safety controls.

# PART C — HANDS-FREE TRAINING ARCHITECTURE

## Step 5: Add hands-free active-flow mode for training setup

Use the current training player/session architecture.

Recommended conceptual approach:

```ts
handsFreeTrainingSetup: true
```

or a repository-consistent equivalent, enabled by default for normal public/beta training sessions.

Implement the hands-free transition inside the training player/state machine where possible, not ad hoc React timers.

`TrainingSessionScreen` should render the state and optional fallback, not own training authority.

## Step 6: No required floor setup tap in normal path

In public/beta hands-free training mode, the floor setup path must not require the user to press:

```text
I'm ready
Ready
Start floor exercise
Confirm floor position
```

Normal path:

```text
floor setup instruction delivered
-> user moves to floor
-> camera/framing/readiness detects floor-ready posture
-> stable dwell completes
-> countdown starts automatically
-> set begins
```

The fallback button may remain after timeout.

## Step 7: Preserve optional safety controls

These must remain available:

```text
Pause
Resume
Help / repeat
Skip exercise
Stop
Leave session
```

If the current UI exposes them during floor setup, keep them unless a test proves they are unsafe.

## Step 8: Voice/text boundary

Do not add new audio assets.

Hands-free automation must not begin before the relevant existing floor/setup instruction has been delivered or is visibly shown.

Use existing safety cue / session voice runtime. If no exact cue exists:

- use existing closest cue;
- keep visible text truthful;
- document future audio-copy gap;
- do not regenerate audio.

# PART D — FLOOR SETUP READINESS

## Step 9: Identify floor-required exercises

Use current exercise metadata/safety/capability policy to identify floor-transition exercises.

Examples may include, but are not limited to:

```text
glute-bridge-hold
glute-bridge-reps
push-up-standard if hidden/internal
floor mobility levels if present
```

Do not expand exercise eligibility.

Do not make optional hidden floor levels reachable.

## Step 10: Use existing gates before player launch

Do not weaken the existing gates:

```text
floor_space equipment
floorTransfer confirmed
movement capability snapshot
daily discomfort policy
release policy
safety cue snapshot
stale plan validation
```

HF3 only replaces the in-session confirmation tap after those gates have already allowed the exercise.

## Step 11: Floor-ready camera evidence

Define a conservative readiness detector using existing pose/pipeline data.

Possible evidence, adapting to current available landmarks and helpers:

```text
subject visible
required landmarks visible
tracking stable
body not walking/transitioning
low hip/torso height relative to frame indicating floor posture
knees/hips/shoulders stable
exercise-specific start posture roughly plausible where current metadata supports it
phone framing not lost
stable dwell for configured duration
```

Do not persist landmarks.

Do not claim the detector proves medical/floor-transfer safety. It only confirms that the user appears stable enough to start the set.

## Step 12: Dwell and timeout

Use conservative values:

```text
stable dwell: around 700-1500 ms
fallback timeout: around 10-15 seconds after instruction/setup boundary
```

Use current timing conventions if already present.

Do not make fallback immediately primary.

## Step 13: Fallback

If floor readiness cannot be established:

- show calm copy;
- offer `I'm ready` / `Start anyway` as an optional accessibility fallback;
- keep help/repeat/stop controls;
- if fallback is used, mark readiness source as user_fallback or setup_uncertain where metadata exists;
- do not upgrade safety/evidence/progression because of fallback.

## Step 14: No accidental starts

Auto-start must not occur:

- while the user is still moving to the floor;
- while the user is out of frame;
- during tracking interruption;
- while wrong/missing posture;
- before floor instruction/safety cue boundary;
- before the minimum transition time;
- when the session is paused;
- after skip/stop has been requested.

# PART E — NON-FLOOR TRAINING AUTO-ADVANCE AUDIT

## Step 15: Verify non-floor ordinary flow

Confirm non-floor exercises already auto-advance through:

```text
transition
preflight/framing
instructions
countdown
active set
rest
next set
next exercise
```

If a non-floor “ready/start” tap is still required in the normal path, replace it with the same camera-readiness/voice-countdown pattern only if the change is narrow and safe.

If not safe, document it as a follow-up rather than broadening HF3.

## Step 16: Rest / next set / next exercise

Do not introduce unsafe auto-advance.

If current rest and next-set behavior is already timer/voice/camera driven, preserve it.

If there is a required “next set” or “next exercise” tap, remove it only if:

- the existing player can reliably determine readiness;
- pause/skip/stop/help controls remain;
- tests prove no credit/progression changes.

# PART F — VALID-TIME / TRACKING RECOVERY

## Step 17: Tracking pauses

Preserve existing valid-time tracking behavior:

```text
tracking pause
visible recovery copy
safety cue / text fallback
return to setup/start posture
countdown or reset
```

HF3 must not allow tracking-uncertain time to count as valid work.

## Step 18: Valid-time progression

Do not change valid-time categories:

```text
strong
completed_with_resets
incomplete
tracking_uncertain
```

Do not change how those affect progression.

HF3 should only change how floor setup transitions from setup to countdown.

# PART G — SESSION CREDIT / PROGRESSION CONTAINMENT

## Step 19: Main-plan credit unchanged

Training completion must still require:

```text
current active generated A/B/C main-plan session
valid schedule identity
real completed planned work
primary focus evidence
schedule credit
not duplicate
not manual / Explore / preset / micro-check
```

HF3 must not make setup readiness or fallback count as work.

## Step 20: Progression unchanged

Exercise progression must still require:

```text
schedule credit
feedback
valid exercise evidence
unique progression event ID
allowed progression policy
valid-time evidence
```

Floor setup auto-start/fallback must not create progression evidence.

## Step 21: Manual/extra/Explore containment

If Explore/manual practice reuses the training player and receives HF3 hands-free floor setup:

- it remains non-main-plan;
- it remains non-credit;
- it remains progression-ineligible;
- it does not affect block schedule or retest timing.

# PART H — PERSISTENCE / SYNC / RESTORE

## Step 22: Avoid new persistence where possible

HF3 should avoid adding new persisted fields unless necessary.

If a readiness-source field is needed, make it additive and bounded:

```text
floorSetupReadinessSource:
  camera_inferred
  user_fallback_selected
  timeout_unavailable
```

Do not persist landmarks, frames, video, image, base64, local paths, or secrets.

## Step 23: Serialization

If any new metadata is added, it must round-trip through:

```text
local training serialization
generated session summary
remote training-state sync
restore
export
account clear
```

But prefer no persistence change.

# PART I — UI REQUIREMENTS

## Step 24: Preserve TrainingSessionScreen design

Do not redesign the training session UI.

Preserve:

```text
current session visual shell
pose/avatar viewport
exercise title/card
safety text panel
progress/timer/rest display
pause/help/repeat/skip/stop controls
typography/spacing/radius/shadow
responsive behavior
accessibility labels
```

Only change copy/actions needed to remove required mid-session taps.

## Step 25: Floor setup copy

Replace primary tap-to-continue copy with clear hands-free copy:

```text
Move safely to the floor.
I’ll start once you’re in position.

Hold still — I’m checking your position.

You’re set. Starting in 3, 2, 1.
```

Do not show internal labels such as:

```text
floor_setup_v2
schema
tracking state
debug
```

## Step 26: Fallback copy

After timeout, show calm fallback:

```text
Having trouble detecting your position?
You can start when you feel safely set.
```

Button:

```text
I'm ready
```

or current product-approved label.

This button is optional fallback, not the primary path.

## Step 27: Accessibility

Ensure:

- waiting state has clear accessible label;
- fallback button is accessible;
- pause/help/skip/stop remain accessible;
- no color-only status;
- user is not trapped if camera readiness fails.

# PART J — ARCHITECTURE GUARDS

## Step 28: Screen non-authority

`TrainingSessionScreen` must not become schedule/progression authority.

It may render controls and dispatch typed player actions.

The player/state machine remains authority for:

```text
transition
setup
countdown
active
rest
completion
valid-time
```

## Step 29: No credit/progression imports in UI

Avoid adding credit/progression mutation calls to the screen.

No new call from setup readiness to:

```text
makeTrainingSessionCompletion
annotateCompletionWithScheduleCredit
applyProgressionEvidence
recordTrainingSessionCompletion
```

## Step 30: Source guards

Add tests or source guards showing HF3 does not import/call:

```text
Movement Profile snapshot/assessment builders
H4 report builders
H5B micro-check scheduled slot completion
Warden/percentile code
V1 Check-Up route selection
```

# PART K — TEST MATRIX

## A. Floor setup required-tap removal

- floor exercise enters setup state;
- no primary required `I'm ready` button in normal path before timeout;
- setup waits for instruction/safety cue boundary;
- stable camera readiness triggers countdown/start;
- fallback appears only after timeout;
- fallback can still start as accessibility escape.

## B. Floor readiness

- visible/stable floor posture -> auto-start;
- moving/unsteady posture -> no start;
- out-of-frame -> no start;
- tracking interruption -> no start/reset;
- paused session -> no auto-start;
- skip/stop cancels auto-start.

## C. Non-floor non-regression

- normal non-floor exercise flow unchanged;
- countdown still starts through existing readiness;
- rest/next-set behavior unchanged;
- no new required taps.

## D. Safety controls

- pause/resume works during setup;
- help/repeat works during setup;
- skip exercise works during setup;
- stop session works during setup;
- visible safety text remains.

## E. Credit/progression containment

- floor setup auto-start does not count as work;
- fallback start does not count as work;
- main-plan credit still comes only from completed planned work;
- schedule credit unchanged;
- progression unchanged;
- manual/Explore remains non-credit/progression-ineligible.

## F. Persistence

- no new persisted media/landmarks;
- if new metadata exists, local/sync/restore/export/account-clear round-trip;
- export excludes raw frames/video/images/landmarks/secrets.

## G. Regression

- HF1 V2 Check-Up hands-free remains green;
- HF2 micro-check hands-free remains green;
- H5B/H5B.1 micro-check policy remains green;
- H5A Progress remains green;
- H5C V1 route retirement remains green;
- H5D release flag audit remains green;
- Stage 5G/5H scheduler/progression remains green;
- Stage 4 safety cue tests remain green;
- audio verification remains green.

# PART L — VALIDATION

## Step 31: Focused validation

Run focused tests for:

- TrainingSessionScreen floor setup;
- TrainingSessionPlayer/sessionPlayer;
- setRuntime;
- safety cues;
- floor/movement capability gates;
- session planning;
- valid-time progression;
- progression evidence;
- Stage 5G/5H lifecycle;
- manual/Explore practice if affected;
- HF1 live coordinator / CheckUpRecordingShell;
- HF2 MicroCheckScreen / microCheckSideSetup;
- H5A Progress;
- H5C routing;
- H5D release flags.

Record exact command and counts.

## Step 32: Full release gate

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
rm -rf /tmp/hale-hf3-hands-free-training-export
npx --no-install expo export --platform all --output-dir /tmp/hale-hf3-hands-free-training-export
rc=$?
rm -rf /tmp/hale-hf3-hands-free-training-export
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

After automated validation, trace from code/test state:

## Floor session

```text
Today / Plan starts floor-containing session
-> pre-session readiness/discomfort still before phone placement
-> exercise transition says move safely to the floor
-> user moves into view on floor
-> camera readiness stable dwell
-> countdown starts automatically
-> set begins
-> no required tap
```

## Fallback

```text
floor readiness not detected
-> timeout
-> fallback button appears
-> user can start if safely positioned
-> fallback does not alter credit/progression policy
```

## Safety controls

```text
during setup:
pause / help / repeat / skip / stop still work
```

## Non-floor

```text
normal sit-to-stand / balance / standing movement session flow unchanged
```

# PART N — REPORT

Create exactly one new report:

```text
docs/audits/HALE_HANDS_FREE_TRAINING_HF3_IMPLEMENTATION.md
```

Do not edit prior reports or `docs/decisions.md`.

Required sections:

1. Scope.
2. HF1/HF2/H5D prerequisites.
3. Initial Git status.
4. Baseline validation.
5. Current training touch points fixed.
6. HF3 architecture.
7. Floor setup hands-free implementation.
8. Floor readiness/dwell/timeout behavior.
9. Optional fallback behavior.
10. Non-floor training non-regression.
11. Safety controls preservation.
12. Valid-time/tracking recovery preservation.
13. Credit/progression containment.
14. Manual/Explore containment.
15. Persistence/sync/restore/export/account clear.
16. UI/copy changes.
17. Accessibility.
18. Architecture/source guards.
19. H5A/H5B/H5C/H5D/HF1/HF2 regression.
20. Tests added/changed.
21. Files changed.
22. Focused validation.
23. Full validation.
24. Manual software trace.
25. Known limitations and physical-device QA follow-up.
26. Initial/final Git status.
27. Confirmation that no package install, lockfile change, audio regeneration, staging, commit, branch, push, Warden work, H5 route rollback, Movement Profile artifact change, scheduled micro-check policy change, training credit/progression change, or physical-device validation claim occurred.

# REQUIRED INVARIANTS

After HF3:

1. Normal floor setup no longer requires a mid-session tap.
2. Floor setup waits for instruction/safety cue boundary.
3. Stable camera readiness/dwell can start countdown automatically.
4. Fallback appears only after timeout/recovery.
5. Pause/resume/help/repeat/skip/stop remain available.
6. Non-floor training flow remains unchanged.
7. Training credit rules unchanged.
8. Schedule credit rules unchanged.
9. Progression rules unchanged.
10. Exercise selection/generation unchanged.
11. Equipment/capability/daily readiness gates unchanged.
12. Valid-time/tracking recovery unchanged.
13. Manual/Explore remains non-credit.
14. No Movement Profile artifacts created/changed.
15. HF1 V2 Check-Up unchanged.
16. HF2 micro-checks unchanged.
17. H5A/H5B/H5C/H5D unchanged.
18. No new audio assets required.
19. Full repository gate passes.
20. Physical-device validation is not claimed.
21. Public release remains blocked.

# ACCEPTANCE CRITERIA

Do not mark HF3 complete unless:

1. Floor setup can proceed without required mid-session tap in deterministic tests.
2. Fallback remains available after timeout.
3. Safety controls remain available.
4. Credit/progression containment is tested.
5. Manual/Explore containment is tested if affected.
6. Non-floor training non-regression is tested.
7. HF1/HF2 regressions pass.
8. Stage 5G/5H regressions pass.
9. H5A/H5B/H5C/H5D regressions pass.
10. Full Jest passes.
11. App typecheck passes.
12. Website typecheck passes.
13. Audio verification passes.
14. Expo config/export pass.
15. `git diff --check` passes.
16. No unrelated work is overwritten.
17. No audio regeneration/package/lockfile change occurs.
18. No physical-device validation is claimed.

Do not mark complete if:

- floor setup still requires a normal-path tap;
- fallback is the only way to proceed;
- auto-start can occur while tracking is unstable/out-of-frame/paused;
- credit/progression changes;
- safety controls are removed;
- HF1 or HF2 regresses;
- audio gate fails.

# STAGE DECISIONS

At the end of the report state exactly one:

```text
HF3 HANDS-FREE TRAINING IMPLEMENTATION COMPLETE
HF3 HANDS-FREE TRAINING IMPLEMENTATION BLOCKED
```

Also state exactly one:

```text
TRAINING FLOOR SETUP MID-SESSION TOUCH REMOVED
TRAINING FLOOR SETUP STILL REQUIRES MID-SESSION TOUCH
```

Also state exactly one:

```text
TRAINING SAFETY CONTROLS PRESERVED
TRAINING SAFETY CONTROLS REGRESSED
```

Also state exactly one:

```text
TRAINING CREDIT / PROGRESSION CONTAINMENT VERIFIED
TRAINING CREDIT / PROGRESSION CONTAINMENT BLOCKED
```

Also state exactly one:

```text
HF1 V2 CHECK-UP HANDS-FREE REGRESSION PASSED
HF1 V2 CHECK-UP REGRESSION BLOCKED
```

Also state exactly one:

```text
HF2 MICRO-CHECK HANDS-FREE REGRESSION PASSED
HF2 MICRO-CHECK REGRESSION BLOCKED
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
- current required training touch points removed;
- floor setup implementation;
- readiness/dwell/timeout behavior;
- fallback behavior;
- safety controls preserved;
- non-floor training result;
- valid-time/tracking recovery result;
- credit/progression containment;
- manual/Explore containment;
- UI/copy changes;
- accessibility result;
- persistence/sync/restore/export result;
- tests added/changed;
- focused validation;
- full Jest;
- audio verification;
- app typecheck;
- website typecheck;
- Expo config/export;
- `git diff --check`;
- H5A/H5B/H5C/H5D/HF1/HF2 regression result;
- `HF3 HANDS-FREE TRAINING IMPLEMENTATION COMPLETE` or blocked;
- remaining physical-device QA follow-up;
- initial/final Git status;
- complete files-changed inventory;
- confirmation that no package install, lockfile change, audio regeneration, staging, commit, branch, push, Warden work, H5 route rollback, Movement Profile artifact change, scheduled micro-check policy change, training credit/progression change, or physical-device validation claim occurred.
