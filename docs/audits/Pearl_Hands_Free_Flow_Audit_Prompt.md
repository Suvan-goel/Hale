You are carrying out a verification-first UX / product-logic audit for Pearl:

PEARL HANDS-FREE FLOW AUDIT
V2 MOVEMENT CHECK-UP, MICRO-CHECKS, TRAINING SESSION READINESS,
REQUIRED TOUCH INTERACTIONS, CAMERA-READINESS AUTO-START DESIGN,
AND IMPLEMENTATION PLAN

This is an audit/planning stage only.

Do not implement hands-free behavior in this task.
Do not change production runtime code unless a validation command is already broken before the audit and the break is clearly caused by the audit itself.
Do not change product routing, V2 artifacts, training credit, micro-check credit, progression, reports, audio, Warden, release flags, or public V1 rollback policy.

## Why this audit is required

The founder tested the current V2 Movement Check-Up from onboarding and discovered that the user has to press buttons during the Check-Up.

That conflicts with Pearl’s intended product experience:

```text
The user should place the phone down,
step back into view,
get into the correct position,
and Pearl should start each movement automatically once camera readiness is detected.
```

The user should not need to walk back to the phone and tap the screen during the active Movement Check-Up.

The current V2 system is live-pose driven, not synthetic, but earlier implementation retained some manual controls from the internal validation path. Stage 3D-B.2E-A explicitly retained legitimate user controls such as setup confirmation, standing-leg selection, shoulder-side selection, balance support-touched, balance stop, rest ready, use-best result, shoulder retry, shoulder pain-limited, hinge start/finish, cancel, and diagnostics export.

This audit must identify every required in-flow tap and classify what should happen next.

## Current product status carried forward

Read and preserve the H5D closeout:

```text
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5D_RELEASE_CANDIDATE_HARDENING.md
```

Current high-level truth:

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

H5D reported software readiness for invite-only closed beta under the product-owner device-QA waiver, but this audit is being opened because the founder’s real product-use test exposed a hands-free UX gap.

## Important scope distinction

This task is not a release-blocking logic migration and not a broad redesign.

It is an audit to answer:

1. Exactly where does the app currently require touch interaction after the user has placed the phone?
2. Which touches are mandatory vs optional safety/accessibility controls?
3. Which mandatory touches should be removed or replaced with camera-readiness, voice, timers, or body-position confirmation?
4. What is the safest implementation plan to make Movement Check-Up hands-free first, then micro-checks/training if needed?
5. What should remain touch-based before phone placement or as optional controls?

## Product principle

The target product rule is:

```text
After the user taps Start Check-Up and places the phone, Pearl should not require screen interaction to complete the Movement Check-Up.

All movement starts should be driven by camera readiness, stable pose, and voice countdown.

Buttons may remain only for help, cancel, pause, retry, accessibility fallback, or debug/internal diagnostics.
```

For training sessions and micro-checks, the target rule is:

```text
Touch input before placing the phone is acceptable.
Touch controls during the active flow should be optional safety/help controls, not required progress buttons.
```

## Product-owner expectations

### V2 Movement Check-Up

The ideal flow:

```text
Start Movement Check-Up
-> phone placement / camera setup
-> user steps into frame
-> Pearl detects readiness
-> voice says "You're set. Starting in 3, 2, 1"
-> movement starts automatically
-> movement finishes automatically
-> next movement instructions
-> next movement starts automatically once ready
```

No required mid-test tapping.

### Training sessions

Training can keep visible controls:

```text
pause
resume
help/repeat
skip exercise
stop
```

Those are safety/accessibility controls and can remain.

But training should not require the user to tap after every exercise/set while standing away from the phone if readiness can be detected or safely timed.

Pre-session readiness/discomfort input is acceptable because the user is normally still holding the phone.

### Micro-checks

Scheduled and optional micro-checks should ideally follow the same hands-free active-flow principle:

```text
setup/phone placement
-> camera detects ready
-> voice countdown
-> check-in starts
-> check-in ends
```

If micro-checks currently require manual setup confirmation, start, stop, side selection, or result acceptance, identify each required tap and recommend how to remove or minimize it.

### Optional / extra Check-Up flows

Recently restored optional screens should remain:

```text
optional full Check-Up
optional micro check-up
```

They are curiosity/practice flows and must remain non-official / non-scheduled as already decided. This audit should include them because they should also be hands-free once the active capture starts.

## Non-negotiable containment

This audit must not propose changes that violate these constraints:

- Do not re-enable public V1 Check-Up/results.
- Do not make optional full Check-Ups official.
- Do not make optional micro-checks count toward scheduled slots.
- Do not create snapshots, assessments, reports, blocks, schedule credit, progression, or official history from optional curiosity flows.
- Do not change H5B scheduled micro-check policy.
- Do not change Stage 5 schedule credit/progression policy.
- Do not change official V2 result/report claim policy.
- Do not add Movement Age, percentiles, Warden, improvement/decline, medical/fall-risk/pass-fail claims.
- Do not regenerate audio.
- Do not change audio cues in this audit.
- Do not claim physical-device validation.

## Required prior reading

Read these reports before auditing:

```text
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5D_RELEASE_CANDIDATE_HARDENING.md
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5C_PUBLIC_V1_ROUTE_RETIREMENT.md
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5B_1_VERIFICATION_CLOSURE_CONTINUATION.md
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5B_1_VERIFICATION_CLOSURE.md
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5B_BALANCED_MICRO_CHECK_POLICY.md
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5A_V2_CANONICAL_PROGRESS_HISTORY.md
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_1_1_POLICY_ALIGNED_CLOSURE_CONTINUATION.md
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_OFFICIAL_RETEST_REPORT_NEXT_BLOCK.md
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H3_1_END_TO_END_VERIFICATION.md
docs/audits/PEARL_UNIFIED_MOVEMENT_CHECKUP_STAGE_H3_BASELINE_ONBOARDING_CUTOVER.md
docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2E_A.md
docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2E_A_1.md
docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2D_2B.md
docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4D_R.md
docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_4D_R_1_CONTINUATION.md
docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5H.md
docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5G_1.md
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
src/movements/chairRiseV2.ts
src/movements/oneLegBalanceV2.ts
src/movements/activeShoulderReachV2.ts
src/movements/hingeReach.ts
src/checkup/movementProfileV2.ts
src/checkup/publicCheckUpEngine.ts
src/screens/MicroCheckScreen.tsx
src/training/microCheck.ts
src/pearlFlow/microCheck.ts
src/pearlFlow/microCheckPolicy.ts
src/screens/TrainingSessionScreen.tsx
src/screens/SessionPreviewScreen.tsx
src/training/sessionPlayer.ts
src/training/setRuntime.ts
src/training/*runtime*
src/screens/ManualCheckupStartScreen.tsx
src/pearlFlow/manualCheckup.ts
src/pearlFlow/appLifecycle.ts
src/pearlFlow/nextBestAction.ts
src/screens/TodayScreen.tsx
src/screens/PlanScreen.tsx
src/screens/ProgressScreen.tsx
src/screens/SettingsScreen.tsx
```

Search broadly for:

```text
button
Button
Pressable
Touchable
onPress
confirm
start
ready
next
continue
useBest
use best
support touched
stop balance
rest ready
retry
pain limited
finish
done
manual
microcheck
micro check
setup confirmation
selectedStandingLeg
selectedShoulderSide
selectedSide
standingLeg
shoulderSide
camera readiness
framing ready
preflight
countdown
dwell
autoStart
```

Treat current code and untracked production files as source of truth.

## Worktree safety

Before analysis:

```bash
git status --short --untracked-files=all
git diff --name-only
git diff --stat
git ls-files --others --exclude-standard
```

Record exact output in the report.

Rules:

1. Treat all existing tracked/untracked changes as user-owned.
2. Do not revert, delete, move, or broadly reformat unrelated work.
3. Do not edit prior audit reports or `docs/decisions.md`.
4. Do not use destructive Git commands.
5. Do not install packages.
6. Do not modify lockfiles.
7. Do not regenerate audio.
8. Do not stage, commit, branch, push, or open a PR.
9. Do not inspect or expose `.env` values or provider credentials.
10. Do not modify fonts/assets unless explicitly instructed.
11. If current code differs from reports, current code wins.

## Validation baseline

Before writing the audit report, run:

```bash
npm run typecheck
npm run verify:audio
```

Then run a focused test slice covering current routes and interaction surfaces:

- V2 Check-Up screen/shell tests
- live coordinator tests
- Movement Profile V2 voice runtime/cue tests
- micro-check policy/runner tests
- training session player/runtime tests
- H5C routing tests
- H5B micro-check tests
- H5A Progress tests
- Settings/internal/diagnostics tests if they are easy to include

If the focused slice is unclear, search existing package/test names and run the closest focused commands.

Do not block the audit because unrelated tests fail; record failures truthfully.

## Audit Part 1 — interaction inventory

Create a complete table of all user interactions in the current active flows.

Table columns:

```text
Flow
Screen/component
Movement/stage
Action/control label
Code action name / onPress handler
Required or optional
When it appears
Can the user be expected to be away from the phone?
Current purpose
Hands-free classification
Risk if removed
Recommended replacement
Implementation priority
```

Flows to inventory:

### A. Public V2 baseline / onboarding Movement Check-Up

From:

```text
onboarding / no profile -> public V2 baseline -> Movement Profile results
```

### B. Public V2 baseline retake

If available from Progress/manual paths.

### C. Public V2 official retest

From:

```text
V2 block retest_due -> public V2 official retest -> report -> next block
```

### D. Optional full extra Check-Up

From restored manual / extra Check-Up screen.

This must remain non-official.

### E. Scheduled micro-check

From Today / Plan / Progress scheduled due surfaces.

### F. Optional micro-check

From restored manual / extra Check-Up screen.

This must remain non-official and non-scheduled.

### G. Training session

From:

```text
Today / Plan -> session preview -> active training -> completion
```

Include exercise-level / set-level / rest-level interactions.

### H. Explore/manual practice session

Include if it uses the same training player or separate manual-practice controls.

## Audit Part 2 — mandatory-touch classification

Classify every touch into one of:

```text
KEEP_BEFORE_PHONE_PLACEMENT
KEEP_OPTIONAL_SAFETY_CONTROL
KEEP_ACCESSIBILITY_FALLBACK
KEEP_INTERNAL_ONLY
REMOVE_REPLACE_WITH_CAMERA_READINESS
REMOVE_REPLACE_WITH_VOICE_TIMER
REMOVE_REPLACE_WITH_AUTO_CAPTURE
REMOVE_REPLACE_WITH_INFERRED_BODY_CHOICE
REMOVE_REPLACE_WITH_TIMEOUT_OR_BEST_RESULT
NEEDS_PRODUCT_DECISION
```

Examples of expected classifications:

```text
Start Check-Up before phone placement
-> KEEP_BEFORE_PHONE_PLACEMENT

Cancel / leave Check-Up
-> KEEP_OPTIONAL_SAFETY_CONTROL

Diagnostics export
-> KEEP_INTERNAL_ONLY

Standing-leg selection during active Check-Up
-> REMOVE_REPLACE_WITH_INFERRED_BODY_CHOICE or NEEDS_PRODUCT_DECISION

Shoulder-side selection during active Check-Up
-> REMOVE_REPLACE_WITH_INFERRED_BODY_CHOICE or NEEDS_PRODUCT_DECISION

Balance support-touched
-> REMOVE_REPLACE_WITH_AUTO_CAPTURE / timeout / conservative support-unknown metadata

Balance use-best
-> REMOVE_REPLACE_WITH_TIMEOUT_OR_BEST_RESULT

Hinge start/finish
-> REMOVE_REPLACE_WITH_CAMERA_READINESS / AUTO_CAPTURE
```

## Audit Part 3 — hands-free readiness feasibility

For each movement, inspect current pose/controller logic and determine if hands-free readiness is feasible using existing data.

### Chair rise

Assess:

- front/side readiness requirements
- chair setup confirmation currently manual or visual
- practice rep gate
- when official 30-second window starts
- whether auto-start can use stable seated/standing/chair-ready pose
- whether practice can start automatically
- whether countdown can start after a stable ready dwell
- whether full-stand-at-expiry remains safe
- failure/retry states

Recommended target:

```text
User gets into chair-start position.
Camera sees ready posture for N ms.
Voice countdown starts.
Practice / official begins automatically.
```

### One-leg balance

Assess:

- current standing-leg selection
- prior leg preservation on retest
- selected leg confirmation
- trial start
- support-touched
- stop
- rest ready
- use-best
- decline/continue attempts
- 45-second ceiling
- invalid tracking attempt handling

Recommended target:

```text
Voice instructs use same leg as last time if applicable.
Camera infers standing leg from lifted foot / stance during ready period.
Trial starts after stable ready dwell.
Foot down or tracking invalid ends attempt.
Best valid trial is auto-selected after trial policy.
No "use best" tap required.
```

### Shoulder reach

Assess:

- current shoulder-side selection
- prior side preservation
- side-view readiness
- retry / pain-limited controls
- capture window
- one valid capture
- invalid retry

Recommended target:

```text
Voice instructs turn side-on and use arm closest to camera, or same side as last time.
Camera detects side orientation and raised arm side.
Capture starts after stable ready dwell.
Peak capture ends automatically after stable/timeout window.
Pain-limited should be optional voice/copy fallback or before-phone input.
```

### Hinge reach

Assess:

- current start/finish control
- whether it is headline or supporting
- no-measurement path
- best stable capture feasibility

Recommended target:

```text
Voice instructs reach and hold.
Camera captures best stable window automatically.
No start/finish tap.
```

## Audit Part 4 — camera-readiness design recommendations

For each movement, propose a minimal V1 hands-free implementation design:

```text
Readiness conditions
Stable dwell duration
Countdown cue
Start trigger
Stop trigger
Timeout
Retry behavior
Failure copy
Accessibility fallback
Metadata added/changed
Tests required
Risks
```

Do not implement it yet.

Make the design conservative.

Prefer already-existing preflight/readiness concepts:

- subject visible
- required landmarks visible
- centered
- adequate distance
- correct orientation
- stable pose
- movement-specific setup
- no tracking interruption
- dwell for 500-2000 ms depending movement

## Audit Part 5 — side / choice product decisions

Identify every place where the current UI asks the user to choose something:

```text
standing leg
shoulder side
pain-limited
support touched
retry/decline
use-best
rest ready
```

For each, recommend one of:

```text
infer from body position
use prior official side/leg with voice instruction
use whichever side user naturally chooses and freeze metadata
ask before phone placement only
keep optional fallback button
remove entirely
needs product-owner decision
```

Make side/leg comparability implications explicit:

```text
If retest side/leg changes, result can still be valid but direct comparison must be suppressed.
```

## Audit Part 6 — training sessions

Answer clearly:

```text
Does the current training session require any tap after the user has placed the phone?
```

Inventory:

- start session
- readiness/discomfort sheet
- exercise start
- set start
- next set
- rest ready
- next exercise
- pause/resume
- help/repeat
- skip
- stop
- completion
- feedback/RPE/pain

Classify:

```text
reasonable before phone placement
optional safety/accessibility
required mid-session tap
```

If required mid-session taps exist, recommend hands-free replacement:

- camera readiness before set
- voice countdown
- timed rest auto-advance once user is ready
- body-position ready detection
- optional "pause" and "repeat" buttons remain

Do not remove safety controls.

## Audit Part 7 — micro-checks

Answer clearly:

```text
Do scheduled micro-checks currently require manual taps during active capture?
Do optional micro-checks currently require manual taps during active capture?
```

Inventory by micro-check type:

```text
chair-power
single-leg-balance
mobility-reach
```

For each, classify:

- setup confirmation
- side/leg selection
- start
- stop
- retry
- completion acceptance
- result navigation

Recommend how to align with the hands-free active-flow principle while preserving H5B/H5B.1 containment.

## Audit Part 8 — UI / accessibility implications

For every proposed removal of a required tap, specify UI/copy changes:

- what visible button disappears
- what text replaces it
- what voice cue triggers
- what screen-reader announcement is needed
- what fallback button remains
- how a user with accessibility needs can still continue
- how to avoid accidental starts
- how to avoid trapping users if readiness detection fails

Do not propose a fully invisible state. Users should always know what Pearl is waiting for.

## Audit Part 9 — risk assessment

For each change, score:

```text
User value: high / medium / low
Implementation risk: high / medium / low
Measurement risk: high / medium / low
Safety risk: high / medium / low
Beta priority: P0 / P1 / P2 / P3
```

Expected priority:

```text
P0: V2 Movement Check-Up hands-free baseline and official retest
P1: optional full extra Check-Up hands-free
P1: scheduled micro-check active capture hands-free
P2: training set/exercise auto-advance if required taps exist
P2: optional micro-check hands-free
P3: polish/accessibility fallback refinements
```

Adjust if the code shows different realities.

## Audit Part 10 — implementation plan

Propose staged implementation after the audit:

### Stage HF1 — Hands-free V2 Movement Check-Up

Scope:

- public baseline/onboarding
- baseline retake
- official retest
- optional full extra Check-Up if it reuses the same player

Must include:

- movement-specific readiness
- auto countdown
- auto start/finish
- side/leg inference or pre-phone choice
- no official claim policy change
- no artifact/schema churn unless necessary

### Stage HF2 — Micro-check hands-free alignment

Scope:

- scheduled micro-checks
- optional micro-checks
- chair-power / balance / mobility-reach

Must preserve:

- non-official containment
- scheduled slot identity rules
- optional/non-scheduled distinction
- no credit/progression/history contamination

### Stage HF3 — Training active-flow touch audit remediation

Scope:

- only if required mid-session taps exist
- set/exercise readiness auto-advance
- keep pause/help/skip/stop

Must preserve:

- safety controls
- training credit/progression logic
- session player state machine

### Stage HF4 — Accessibility and device QA

Scope:

- fallback buttons
- readiness failure copy
- real device test checklist
- large-text/voice fallback

## Audit Part 11 — testing plan for implementation

For each future stage, list required tests:

### HF1 tests

- no required action buttons after active Check-Up begins
- chair auto-readiness / countdown / official window
- balance leg inference / same-leg retest / changed-leg suppression
- balance auto best result
- shoulder side inference / same-side retest / changed-side suppression
- hinge auto capture
- timeout/retry/failure states
- accessibility fallback available
- V2 official artifact chain unchanged
- no V1 route reintroduction

### HF2 tests

- scheduled micro-check auto-start
- optional micro-check auto-start
- optional does not complete scheduled slot
- no official artifacts
- no credit/progression
- no report/history contamination

### HF3 tests

- training session does not require mid-session taps except optional controls
- pause/help/skip/stop still work
- no accidental credit/progression change
- readiness auto-start fails closed

### Device QA tests

- iPhone and Android
- living-room distance
- chair view
- balance view
- shoulder side view
- lighting changes
- subject leaves/returns
- audio + visible text
- accessibility large text
- manual fallback

## Audit Part 12 — validation commands

After completing the report, run:

```bash
npm run typecheck
npm run verify:audio
npm test -- --runInBand
npm --prefix website run typecheck
npx --no-install expo config --type public
git diff --check
```

Then:

```bash
rm -rf /tmp/pearl-hands-free-audit-export
npx --no-install expo export --platform all --output-dir /tmp/pearl-hands-free-audit-export
rc=$?
rm -rf /tmp/pearl-hands-free-audit-export
exit $rc
```

If full validation is too expensive or fails for unrelated concurrent work, record the exact failure and continue the audit truthfully.

Do not claim implementation readiness from the audit alone.

## Report

Create exactly one new report:

```text
docs/audits/PEARL_HANDS_FREE_FLOW_AUDIT.md
```

Do not edit prior reports or `docs/decisions.md`.

Required sections:

1. Scope.
2. Why this audit was required.
3. Current product status from H5D.
4. Worktree safety / initial Git status.
5. Baseline validation.
6. Current V2 Movement Check-Up active-flow inventory.
7. Current onboarding baseline touch requirements.
8. Current baseline retake touch requirements.
9. Current official retest touch requirements.
10. Current optional full Check-Up touch requirements.
11. Current scheduled micro-check touch requirements.
12. Current optional micro-check touch requirements.
13. Current training-session touch requirements.
14. Current Explore/manual-practice touch requirements.
15. Complete required-touch table.
16. Mandatory-vs-optional classification.
17. Chair hands-free feasibility.
18. Balance hands-free feasibility.
19. Shoulder hands-free feasibility.
20. Hinge hands-free feasibility.
21. Side/leg/support/pain/retry/use-best decisions.
22. Training-session hands-free gap analysis.
23. Micro-check hands-free gap analysis.
24. UI/accessibility implications.
25. Safety and measurement risks.
26. Product decisions required from founder.
27. HF1 implementation plan.
28. HF2 implementation plan.
29. HF3 implementation plan.
30. HF4 accessibility/device-QA plan.
31. Required tests for future implementation.
32. Validation results.
33. Files changed.
34. Confirmation that no implementation, package install, lockfile change, audio regeneration, staging, commit, branch, push, Warden work, or physical-device validation claim occurred.

## Final verdicts required

At the end of the report state exactly one:

```text
HANDS-FREE FLOW AUDIT COMPLETE
HANDS-FREE FLOW AUDIT BLOCKED
```

Also state exactly one:

```text
V2 MOVEMENT CHECK-UP REQUIRES MID-FLOW TOUCH TODAY
V2 MOVEMENT CHECK-UP DOES NOT REQUIRE MID-FLOW TOUCH TODAY
```

Also state exactly one:

```text
TRAINING SESSIONS REQUIRE MID-SESSION TOUCH TODAY
TRAINING SESSIONS DO NOT REQUIRE MID-SESSION TOUCH TODAY
```

Also state exactly one:

```text
MICRO-CHECKS REQUIRE MID-FLOW TOUCH TODAY
MICRO-CHECKS DO NOT REQUIRE MID-FLOW TOUCH TODAY
```

Also state exactly one:

```text
HF1 HANDS-FREE V2 CHECK-UP IMPLEMENTATION RECOMMENDED
HF1 HANDS-FREE V2 CHECK-UP IMPLEMENTATION NOT RECOMMENDED
```

Also state:

```text
NO H5 ROUTING ROLLBACK
NO V1 PUBLIC ROUTE REINTRODUCTION
NO OFFICIAL PROFILE CONTAINMENT CHANGE
NO TRAINING CREDIT / PROGRESSION CHANGE
NO AUDIO REGENERATION
WARDEN TRANSFORM DEFERRED
PHYSICAL DEVICE VALIDATION NOT CLAIMED
PUBLIC RELEASE REMAINS BLOCKED
```

## Final Codex response

Return a concise summary containing:

- report path
- whether production runtime code changed
- whether V2 Movement Check-Up currently requires mid-flow touch
- whether training currently requires mid-session touch
- whether micro-checks currently require mid-flow touch
- the top required-touch controls found
- HF1/HF2/HF3/HF4 recommendation
- product decisions needed
- validation results
- files changed
- confirmation that no implementation, package install, lockfile change, audio regeneration, staging, commit, branch, push, Warden work, or physical-device validation claim occurred
