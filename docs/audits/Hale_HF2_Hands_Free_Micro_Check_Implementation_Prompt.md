You are implementing the second hands-free remediation stage for Hale:

HALE HANDS-FREE FLOW — STAGE HF2
HANDS-FREE MICRO-CHECK IMPLEMENTATION,
SCHEDULED AND OPTIONAL MICRO-CHECK ACTIVE-FLOW ALIGNMENT,
SIDE / LEG AUTO-INFERENCE,
CAMERA-READINESS AUTO-START,
AND H5B MICRO-CHECK POLICY CONTAINMENT

This is an implementation stage.

Scope is intentionally narrow:
- scheduled micro-checks launched from Today / Home / Plan / Progress / manual option when due;
- optional micro-checks launched from the Manual / Extra Check-Up screen;
- current micro-check types:
  - `chair-power`;
  - `single-leg-balance`;
  - `mobility-reach`;
- the active micro-check capture/setup flow only.

Do not implement HF3 training session hands-free changes in this task.
Do not change HF1 V2 Movement Check-Up behavior except to preserve non-regression.
Do not change H5 routing, H5A Progress, H5B micro-check policy, H5C V1 route retirement, H5D release hardening, Warden, audio generation, training credit, progression, reports, official Movement Profile claim policy, or public V1 rollback policy.

## Why HF2 is required

The founder wants to test HF1, HF2, and HF3 together on device at the end.

HF1 has already implemented the public V2 Movement Check-Up hands-free path. The HF1 report is:

```text
docs/audits/HALE_HANDS_FREE_V2_CHECKUP_HF1_IMPLEMENTATION.md
```

HF1 removed the normal required mid-flow taps in the public V2 Movement Check-Up for:

```text
chair setup
balance leg selection / confirmation
balance use-best / rest-ready
shoulder side selection / confirmation
shoulder start reach
hinge start / finish capture
```

HF1 did not implement micro-check hands-free alignment.

The hands-free audit report is:

```text
docs/audits/HALE_HANDS_FREE_FLOW_AUDIT.md
```

The audit found:

```text
MICRO-CHECKS REQUIRE MID-FLOW TOUCH TODAY
```

Specifically:

- scheduled and optional micro-check active capture is mostly hands-free after the runner starts;
- `chair-power` does not require side setup;
- `single-leg-balance` can require side selection / confirmation;
- `mobility-reach` can require side selection / confirmation;
- those side/leg setup touches can occur after the user expects to place the phone and start the check-in.

HF2 must make scheduled and optional micro-checks follow the same active-flow principle as HF1:

```text
User starts the check-in while holding phone.
User places phone down.
User gets into the correct position.
Hale detects readiness and side/leg choice from camera/pose where needed.
Hale starts the countdown automatically.
Capture runs and completes automatically.
No required mid-flow phone tapping.
```

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
Audio asset fingerprint gate passed.
Warden transform is deferred.
Chair reference claim remains raw-only.
Physical-device validation is not claimed.
Public release remains blocked.
```

Do not undo any of that.

## H5B/H5B.1 micro-check policy to preserve

Read and preserve:

```text
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5B_BALANCED_MICRO_CHECK_POLICY.md
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5B_1_VERIFICATION_CLOSURE.md
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5B_1_VERIFICATION_CLOSURE_CONTINUATION.md
```

Current micro-check policy:

### Domain-focused blocks

```text
Strength block -> chair-power
Balance block -> single-leg-balance
Mobility block -> mobility-reach
```

Domain-focused week 4 keeps the same domain micro-check behavior while the due window is open.

### Balanced blocks

```text
Schedule week 1 -> Strength -> chair-power
Schedule week 2 -> Balance -> single-leg-balance
Schedule week 3 -> Mobility -> mobility-reach
Schedule week 4 -> no micro-check
```

### Due window

A scheduled micro-check may be due only when:

```text
current schedule week is active
+ at least one schedule-credited main-plan session exists in that week
+ fewer than all three required schedule templates are credited
+ stable slot is not completed
+ target eligibility passes
```

### H5B containment

Micro-checks remain:

```text
optional
non-official
non-blocking
non-credit
non-progression
separate from official Movement Profile history
```

A micro-check must never create or mutate:

```text
MovementProfileV2Snapshot
MovementProfileV2Assessment
suggested focus
official V2 comparison
V2 block report
current plan origin
next block
official Check-Up history
latestProfile
schedule credit
main-plan credit
progression evidence
retest timing
```

HF2 must preserve these rules exactly.

## Optional vs scheduled micro-check distinction

The restored Manual / Extra Check-Up screen intentionally always shows:

```text
Micro check-up
Full Movement Check-Up
```

HF2 must preserve the product decision:

### Scheduled micro-check

Launched from scheduled due surfaces.

It uses the H5B stable slot identity and can complete exactly one scheduled slot.

### Optional micro-check

Launched from the Manual / Extra Check-Up screen.

It is a curiosity/practice check-in.

It must not complete a scheduled slot unless the user explicitly launched the scheduled check-in from the scheduled due surface.

It must not contribute to `microChecksCompleted`.

It must not affect Progress official history, Movement Profile, report, plan, schedule, or progression.

HF2 is about hands-free active capture for both, not changing their authority.

## Product rule

After the user starts a micro-check and places the phone, Hale must not require screen interaction to complete the micro-check.

Required active-flow interactions must be replaced by one of:

```text
camera readiness
stable pose dwell
voice countdown
auto-capture window
auto-finish
inferred side / leg choice
timeout / retry / fail-closed recovery
```

Allowed buttons during active micro-check:

```text
Help
Cancel / leave
Pause if already present and safe
Retry as optional fallback
I touched support as optional safety metadata
I felt limited / pain-limited as optional metadata if currently supported
Accessibility fallback where readiness detection fails
Internal diagnostics only behind diagnostics/internal flags
```

Those buttons may remain visible, but the user should not have to press them to make normal progress.

## Non-negotiable containment

HF2 must not:

- change Balanced week 1/2/3/4 policy;
- change domain-focused micro-check target mapping;
- change due-window logic;
- change stable scheduled slot identity;
- allow optional micro-check to complete scheduled slot;
- increment `microChecksCompleted` from optional micro-checks;
- add schedule credit;
- add main-plan credit;
- add progression evidence;
- alter retest timing;
- create official V2 snapshot/assessment/comparison/report;
- alter Movement Profile, focus, plan, block, or next block;
- add official Movement Profile history rows;
- add trend/improvement/decline claims;
- re-enable public V1 routes;
- change HF1 V2 Check-Up hands-free behavior;
- change training-session behavior;
- regenerate audio or add new voice cue assets;
- add Warden/percentiles/Movement Age;
- claim physical-device validation.

## Required prior reading

Read in full before editing:

```text
docs/audits/HALE_HANDS_FREE_V2_CHECKUP_HF1_IMPLEMENTATION.md
docs/audits/HALE_HANDS_FREE_FLOW_AUDIT.md
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5D_RELEASE_CANDIDATE_HARDENING.md
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5C_PUBLIC_V1_ROUTE_RETIREMENT.md
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5B_1_VERIFICATION_CLOSURE_CONTINUATION.md
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5B_1_VERIFICATION_CLOSURE.md
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5B_BALANCED_MICRO_CHECK_POLICY.md
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H5A_V2_CANONICAL_PROGRESS_HISTORY.md
docs/audits/HALE_UNIFIED_MOVEMENT_CHECKUP_STAGE_H4_1_1_POLICY_ALIGNED_CLOSURE_CONTINUATION.md
docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5H.md
docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5G_1.md
```

Also inspect:

```text
AGENTS.md
CLAUDE.md
docs/decisions.md
App.tsx
src/screens/MicroCheckScreen.tsx
src/training/microCheck.ts
src/haleFlow/microCheck.ts
src/haleFlow/microCheckPolicy.ts
src/haleFlow/manualCheckup.ts
src/haleFlow/appLifecycle.ts
src/haleFlow/nextBestAction.ts
src/haleFlow/progressViewModel.ts
src/haleFlow/movementProfileV2ProgressViewModel.ts
src/screens/ManualCheckupStartScreen.tsx
src/screens/TodayScreen.tsx
src/screens/PlanScreen.tsx
src/screens/ProgressScreen.tsx
src/screens/CheckUpRecordingShell.tsx
src/movementProfileV2/liveCoordinator.ts
src/movementProfileV2/voiceRuntime.ts
src/audio/voicePlayer.ts
src/services/backend/microCheckSyncService.ts
src/services/backend/trainingStateSyncService.ts
src/services/backend/restoreService.ts
src/services/backend/dataExportService.ts
src/services/backend/accountDataService.ts
src/haleFlow/movementProfileV2BlockReport.ts
src/training/store.ts
src/training/serialize.ts
src/training/dynamicState.ts
```

Search broadly for:

```text
MicroCheckScreen
microCheck
micro-check
chair-power
single-leg-balance
mobility-reach
selectedSide
selectedStandingLeg
side selection
side confirmation
leg selection
standing leg
Start check
Start capture
ready
confirm
onPress
Pressable
Touchable
countdown
preflight
instructions
setup
active
done
slotId
microCheckSlotId
optional
scheduled
manual
manual_extra
support touched
I touched support
pain limited
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
4. Preserve restored Progress empty state and Manual / Extra Check-Up screen UI.
5. Preserve H5A/H5B/H5C/H5D code.
6. Do not edit prior reports or `docs/decisions.md`.
7. Do not use destructive Git commands.
8. Do not install packages.
9. Do not modify lockfiles.
10. Do not regenerate audio.
11. Do not stage, commit, branch, push, or open a PR.
12. Do not inspect or expose `.env` values or provider credentials.
13. Do not modify fonts/assets.
14. If concurrent work makes micro-check authority ambiguous, stop and mark HF2 blocked.

## Step 2: Baseline validation

Run before edits:

```bash
npm run typecheck
npm run verify:audio
```

Run focused baseline tests for:

- micro-check policy;
- MicroCheckScreen;
- micro-check runner;
- micro-check persistence/sync/restore;
- H5B.1 micro-check verification;
- HF1 live coordinator / CheckUpRecordingShell;
- H5A Progress containment;
- H5C route retirement;
- H5D release flags.

Then run:

```bash
npm test -- --runInBand
npm --prefix website run typecheck
npx --no-install expo config --type public
git diff --check
```

Also run:

```bash
rm -rf /tmp/hale-hf2-baseline-export
npx --no-install expo export --platform all --output-dir /tmp/hale-hf2-baseline-export
rc=$?
rm -rf /tmp/hale-hf2-baseline-export
exit $rc
```

Record exact counts and warnings.

# PART B — RECONSTRUCT CURRENT MICRO-CHECK INTERACTION FLOW

## Step 3: Inventory current controls

Create a table for each micro-check type:

```text
chair-power
single-leg-balance
mobility-reach
```

Include:

```text
screen/state
visible control label
onPress / handler
required or optional
scheduled or optional launch
can user be away from phone?
current purpose
HF2 decision
```

Classify every control as:

```text
KEEP_BEFORE_PHONE_PLACEMENT
KEEP_OPTIONAL_SAFETY_CONTROL
KEEP_ACCESSIBILITY_FALLBACK
KEEP_INTERNAL_ONLY
REMOVE_REPLACE_WITH_CAMERA_READINESS
REMOVE_REPLACE_WITH_INFERRED_SIDE_OR_LEG
REMOVE_REPLACE_WITH_AUTO_CAPTURE
REMOVE_REPLACE_WITH_TIMEOUT_OR_AUTO_FINISH
NEEDS_PRODUCT_DECISION
```

## Step 4: Trace launch authority

Trace both launch paths:

### Scheduled

```text
Today / Plan / Progress / Home / manual option when scheduled due
-> H5B target resolver
-> stable scheduled slot
-> MicroCheckScreen
-> result
-> slot completion / persistence
```

### Optional

```text
Manual / Extra Check-Up screen
-> optional micro-check launch
-> target choice / inferred target
-> MicroCheckScreen
-> result
-> optional non-scheduled persistence or display
```

Document exact current difference between scheduled and optional state.

If optional micro-check currently reuses scheduled slot completion incorrectly, add a failing test and fix narrowly.

# PART C — HANDS-FREE MODE ARCHITECTURE

## Step 5: Add hands-free active-flow mode to micro-check runner/screen

Public scheduled and optional micro-check flows should default to hands-free active-flow behavior.

Recommended conceptual option:

```ts
handsFreeMode: true
```

Use repository-consistent naming.

Implement inside the micro-check runner/state machine where possible, not through ad hoc React timers.

Internal/debug paths may keep explicit side/setup controls if needed, but public default must be hands-free.

## Step 6: No required mid-flow controls

In public hands-free mode, the following must not be required to proceed:

```text
side selection
side confirmation
standing-leg selection
standing-leg confirmation
Start check
Start capture
I'm ready
Use this result
Finish capture
Done / accept result
```

If any remain, they must be optional fallback only after readiness timeout or in internal/debug mode.

## Step 7: Voice/text boundary

Do not add new audio assets.

Use existing micro-check voice/runtime cues where available.

If new visible copy is needed but no voice cue exists:

- use existing nearest safe audio cue;
- keep visible text truthful;
- document future audio-copy gap in report;
- do not regenerate audio.

Hands-free automation must not begin before the relevant existing instruction/countdown text/audio boundary is complete.

# PART D — CHAIR-POWER MICRO-CHECK

## Step 8: Confirm chair-power is already mostly hands-free

Chair-power should not require side/leg setup.

Verify:

- phone setup / preflight;
- instruction;
- countdown;
- active timing;
- completion;
- result save.

If any required start/ready/accept tap exists after phone placement, replace with:

```text
camera readiness dwell
voice/text countdown
timer-driven completion
auto-result save
```

Do not change:

- result metric;
- protocol identity;
- optional/scheduled containment;
- credit/progression policy.

## Step 9: Chair eligibility/fallback

If chair readiness cannot be established:

- show calm setup help;
- expose optional accessibility fallback only after timeout;
- do not fabricate setup certainty;
- do not substitute another micro-check.

# PART E — SINGLE-LEG-BALANCE MICRO-CHECK

## Step 10: Remove required standing-leg selection / confirmation

Current touch gap:

```text
single-leg-balance can require side/leg selection or confirmation.
```

New public behavior:

### Scheduled micro-check

If a current V2 block source Movement Profile has a prior standing leg:

```text
voice/text: Use the same leg as your Movement Profile if comfortable.
camera waits for stable standing-leg readiness.
```

If no source leg exists:

```text
voice/text: Stand on whichever leg feels natural.
camera infers the standing leg from stable lifted-foot / stance evidence.
```

### Optional micro-check

If a relevant prior micro-check or active block source leg exists, use it as voice/text guidance.

Otherwise:

```text
Stand on whichever leg feels natural.
```

Then infer from camera.

Persist selected/inferred standing leg with source metadata.

Recommended source values, adapting to existing conventions:

```text
camera_inferred
prior_record_camera_verified
prior_micro_check_camera_verified
user_fallback_selected
unknown
```

Do not infer from filenames, old video, audio text, or global profile state.

## Step 11: Changed-leg behavior

If a scheduled micro-check target has prior leg metadata and the inferred leg differs:

- result remains valid if measurement is otherwise valid;
- same-series direct comparison should be suppressed or marked not directly comparable if such micro-check comparison exists;
- no official Movement Profile comparison is created;
- no plan/focus/report changes;
- slot completion remains allowed if the scheduled check-in is valid.

For optional micro-checks:

- changed leg metadata may be recorded;
- no official comparison/history is created.

## Step 12: Auto-start balance micro-check

The balance micro-check should start after:

- subject visible;
- correct camera framing;
- support/readiness requirements are satisfied;
- standing-leg / lifted-foot pattern stable;
- no tracking interruption;
- dwell satisfied;
- instruction/countdown boundary complete.

No required “Start” or “Ready” tap.

## Step 13: Auto-finish / result save

Current active balance micro-check should complete from its existing timer/hold rules.

If any result acceptance tap exists, replace with auto-save according to existing validity policy:

- valid result -> save automatically;
- invalid/no result -> retry/recovery;
- optional support-touch/stop controls remain safety actions.

Do not create official V2 artifacts.

# PART F — MOBILITY-REACH MICRO-CHECK

## Step 14: Remove required side selection / confirmation

Current touch gap:

```text
mobility-reach can require side selection or confirmation.
```

New public behavior:

### Scheduled micro-check

Use current mobility-reach protocol metadata.

Do not treat official V2 shoulder side as equivalent unless existing same-protocol policy already owns that relationship.

If a prior same-protocol mobility-reach side exists:

```text
voice/text: Use the same side as your last mobility check-in if comfortable.
```

Otherwise:

```text
Turn side-on and use the arm/side that feels natural.
```

Infer the side from camera/pose during readiness/capture.

### Optional micro-check

Use prior same-protocol optional/scheduled micro-check side if valid, otherwise infer.

Persist selected/inferred side with source metadata.

## Step 15: Official shoulder containment

Do not claim mobility-reach is equivalent to official V2 shoulder reach.

Do not create official Mobility-profile comparison.

Do not use mobility-reach side metadata to update official shoulder side.

Do not use official shoulder side as direct longitudinal anchor unless existing code already explicitly maps same protocol, which likely it should not.

## Step 16: Auto-start mobility-reach capture

Start when:

- subject visible;
- movement-specific orientation is ready;
- required chain landmarks visible;
- inferred side is stable enough;
- no tracking interruption;
- readiness dwell satisfied;
- instruction/countdown boundary complete.

No required “Start capture” tap.

## Step 17: Auto-finish / result save

Capture should finish from existing timer/stability rules.

If an explicit “Finish” or “Done” tap exists, make it optional early-stop fallback only.

Valid result saves automatically.

Invalid/no result routes to retry/recovery.

# PART G — OPTIONAL MICRO-CHECK TARGET SELECTION

## Step 18: Preserve always-available optional micro-check entry

Manual / Extra Check-Up screen should continue to always show the optional micro-check option.

If current optional micro-check target selection needs a domain/type, use this priority:

1. If launched from scheduled due surface: use scheduled slot target and scheduled slot authority.
2. If launched from Manual / Extra Check-Up screen and active block has a domain focus: default to that domain’s micro-check type but mark as optional/non-scheduled.
3. If launched from Manual / Extra Check-Up screen and active block is Balanced:
   - if current H5B week target is available, default to that domain/type but mark as optional/non-scheduled;
   - if Balanced week 4 has no scheduled micro-check, still allow optional micro-check by showing a domain-choice substep.
4. If no active block or target exists: show a polished domain-choice substep with Strength, Balance, Mobility.

Do not create an official Movement Profile.

Do not use optional domain choice to change focus/plan.

## Step 19: Domain-choice substep

If a domain-choice substep is needed:

- use the restored Manual / Extra Check-Up screen style;
- no technical labels;
- copy should say this is optional and will not change the plan;
- choices:
  - Strength check-in;
  - Balance check-in;
  - Mobility check-in.
- selection routes to hands-free micro-check capture.

Do not show “V2”, schema, slot, or internal ids.

## Step 20: Optional target ineligibility

If chosen/inferred target is ineligible:

- show calm unavailable copy;
- no silent substitution unless the user explicitly chooses another domain from optional choice UI;
- no plan impact;
- no scheduled slot completion.

# PART H — SCHEDULED MICRO-CHECK PRESERVATION

## Step 21: Scheduled slot identity

Scheduled micro-checks must keep H5B slot identity and completion rules:

```text
blockId
schedule week index
target source
target domain
micro-check type
policy version/fingerprint
```

No HF2 change may alter slot IDs for existing scheduled H5B slots unless there is a documented intentional version bump. Prefer no policy version bump.

## Step 22: Scheduled completion

Scheduled hands-free completion may complete the current scheduled slot exactly once.

Duplicate callbacks remain idempotent.

First-accepted-wins behavior from H5B.1 remains.

## Step 23: Optional completion

Optional hands-free completion must not:

- complete scheduled slot;
- increment scheduled `microChecksCompleted`;
- satisfy H5B slot completion;
- suppress scheduled check-in prompt;
- create schedule credit;
- create progression;
- create official history.

If optional micro-checks are persisted, they must have a distinct optional/practice source and identity.

# PART I — PERSISTENCE / SYNC / RESTORE / EXPORT

## Step 24: Add metadata only if needed

If side/leg inference needs new metadata, add it additively and JSON-safely.

Possible fields:

```text
sideSelectionSource
legSelectionSource
cameraInferred
changedFromPrior
protocolId
protocolVersion
handsFreeMode
launchIntent: scheduled | optional
```

Adapt to current types.

Do not persist landmarks, frames, video, image, base64, local paths, or secrets.

## Step 25: Round-trip

New metadata must survive:

- local persistence;
- backend sync;
- restore;
- data export;
- account clear.

Malformed/future/mismatched metadata fails closed or is omitted according to existing policy.

## Step 26: Report count

Scheduled micro-check report counting must remain based only on unique valid completed scheduled slots for the completed prior block.

Optional micro-checks must not count.

# PART J — UI REQUIREMENTS

## Step 27: Preserve MicroCheckScreen design

Do not redesign MicroCheckScreen.

Preserve:

- current card/shell style;
- typography;
- spacing/radius/shadow;
- current safety/control surfaces;
- progress/active/result presentation;
- responsive behavior;
- accessibility/touch targets.

Only alter setup/action copy and controls needed to make active capture hands-free.

## Step 28: Clear waiting states

Every hands-free setup/readiness state must say:

- what Hale is waiting for;
- what the user should do physically;
- that the app will start automatically;
- optional help/fallback.

Example copy:

```text
Stand on one leg when you’re ready. I’ll start automatically.
Turn side-on and reach when you’re ready. I’ll capture it automatically.
Hold still — I’m checking your position.
```

## Step 29: Fallback controls

Fallback controls should appear only after timeout or failure state.

Examples:

```text
Choose side manually
Start anyway
Retry setup
Cancel
```

If fallback is used, store uncertainty metadata where appropriate and do not upgrade comparability/claims.

# PART K — ARCHITECTURE GUARDS

## Step 30: Screen non-authority

`MicroCheckScreen` must not choose arbitrary official state authority.

It may render a resolved target or optional target choice, but it must not:

- create scheduled slot authority;
- create official V2 artifacts;
- create schedule/main-plan credit;
- apply progression.

## Step 31: No official artifact imports

Micro-check hands-free modules must not import/call:

- V2 snapshot builder;
- V2 assessment builder;
- focus selector;
- H4 comparison builder;
- H4 report builder;
- official-retest transition;
- V2 block materializer.

If shared types are imported, distinguish type-only imports from authority calls.

## Step 32: No credit/progression imports

Micro-check completion must not call:

- schedule credit annotation;
- main-plan event creation;
- progression application;
- plan-session completion mutation.

# PART L — TEST MATRIX

## A. Current gap removal

- `chair-power` has no required mid-flow tap.
- `single-leg-balance` has no required side/leg selection tap.
- `mobility-reach` has no required side selection tap.
- No required “start/ready/use-best/finish” tap in public hands-free micro-check active flow.
- Fallback controls are optional and timeout-gated.

## B. Scheduled micro-checks

- Strength scheduled slot hands-free completion.
- Balance scheduled slot infers leg and completes.
- Mobility scheduled slot infers side and completes.
- Balanced week 1/2/3 targets unchanged.
- Balanced week 4 still no scheduled micro-check.
- Domain week 4 behavior unchanged.
- Duplicate scheduled completion idempotent.
- First-accepted-wins remains.

## C. Optional micro-checks

- Manual / Extra Check-Up optional micro-check always available.
- Optional micro-check can launch without active block.
- Optional micro-check with domain active block defaults to domain target but non-scheduled.
- Optional micro-check with Balanced active block defaults to current week target when available but non-scheduled.
- Optional micro-check in Balanced week 4 can show domain choice and run non-scheduled.
- Optional completion does not complete scheduled slot.
- Optional completion does not increment report count.

## D. Balance side/leg metadata

- no prior -> camera inferred leg;
- prior leg -> prior prompted / camera verified metadata;
- changed leg recorded;
- changed leg does not create official comparison;
- malformed inference -> retry/recovery/fallback.

## E. Mobility side metadata

- no prior same-protocol side -> camera inferred side;
- prior same-protocol side -> prior prompted / camera verified metadata;
- changed side recorded if comparison logic exists;
- official shoulder side is not treated as equivalent unless current code already explicitly does so;
- malformed inference -> retry/recovery/fallback.

## F. Containment

- no schedule credit;
- no main-plan credit;
- no progression;
- no official snapshot;
- no official assessment;
- no focus change;
- no comparison/report;
- no latestProfile update;
- no official history row;
- no plan/current block/next block mutation.

## G. Persistence

- local round-trip of inferred side/leg metadata;
- backend sync payload bounded;
- restore dedupes by scheduled slot or optional identity;
- malformed/future metadata fails closed;
- export excludes landmarks/media/secrets;
- account clear removes optional and scheduled micro-check records.

## H. UI/copy

- no blank setup screen;
- copy says app starts automatically;
- no V1/V2/internal/schema/slot labels;
- no Movement Age;
- no improvement/decline/percentile/trend copy;
- optional check-in copy says it does not change plan/Movement Profile.

## I. Regression

- HF1 V2 Movement Check-Up hands-free tests remain green;
- H5B/H5B.1 micro-check policy remains green;
- H5A Progress remains green;
- H5C V1 route retirement remains green;
- H5D release flags remain green;
- audio verification remains green.

# PART M — VALIDATION

## Step 33: Focused validation

Run focused tests for:

- micro-check hands-free runner/screen;
- micro-check policy;
- micro-check persistence/sync/restore/export/account clear;
- scheduled vs optional micro-check containment;
- H5B.1 report count;
- H5A Progress containment;
- HF1 live coordinator / CheckUpRecordingShell;
- H5C routing;
- H5D release flags.

Record exact command and counts.

## Step 34: Full release gate

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
rm -rf /tmp/hale-hf2-hands-free-micro-check-export
npx --no-install expo export --platform all --output-dir /tmp/hale-hf2-hands-free-micro-check-export
rc=$?
rm -rf /tmp/hale-hf2-hands-free-micro-check-export
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

# PART N — MANUAL SOFTWARE TRACE

After automated validation, trace from code/test state:

## Scheduled balance micro-check

```text
V2 block week 2
-> schedule due target single-leg-balance
-> start scheduled check-in
-> place phone
-> leg inferred
-> countdown starts automatically
-> result saved
-> one scheduled slot completed
-> no credit/progression/official artifact
```

## Scheduled mobility micro-check

```text
V2 block week 3
-> schedule due target mobility-reach
-> side inferred
-> capture starts automatically
-> result saved
-> no official Movement Profile update
```

## Optional micro-check

```text
Manual / Extra Check-Up
-> Micro check-up
-> optional target selected/defaulted
-> hands-free capture
-> optional result saved/displayed
-> no scheduled slot completion
-> no report count
-> no official history
```

# PART O — REPORT

Create exactly one new report:

```text
docs/audits/HALE_HANDS_FREE_MICRO_CHECK_HF2_IMPLEMENTATION.md
```

Do not edit prior reports or `docs/decisions.md`.

Required sections:

1. Scope.
2. HF1/H5D/H5B prerequisites.
3. Initial Git status.
4. Baseline validation.
5. Current micro-check touch points fixed.
6. HF2 architecture.
7. Scheduled vs optional launch authority.
8. Chair-power hands-free behavior.
9. Single-leg-balance leg inference.
10. Mobility-reach side inference.
11. Camera readiness / dwell / auto-start.
12. Auto-finish / result save.
13. Side/leg metadata and compatibility behavior.
14. Optional micro-check containment.
15. Scheduled micro-check slot preservation.
16. Persistence/sync/restore/export/account clear.
17. UI/copy changes.
18. Accessibility/fallback controls.
19. Architecture/source guards.
20. Official artifact/report/plan containment.
21. H5A/H5B/H5C/H5D/HF1 regression.
22. Tests added/changed.
23. Files changed.
24. Focused validation.
25. Full validation.
26. Manual software trace.
27. Known limitations and HF3 follow-up.
28. Initial/final Git status.
29. Confirmation that no package install, lockfile change, audio regeneration, staging, commit, branch, push, Warden work, H5 route rollback, training credit/progression change, or physical-device validation claim occurred.

# REQUIRED INVARIANTS

After HF2:

1. Public scheduled micro-checks have no required mid-flow tap after phone placement.
2. Public optional micro-checks have no required mid-flow tap after phone placement.
3. Chair-power remains hands-free and side-independent.
4. Single-leg-balance infers standing leg or uses optional fallback.
5. Mobility-reach infers side or uses optional fallback.
6. Camera readiness/stable dwell drive starts.
7. Timers/auto-capture drive finishes.
8. Fallback controls are optional and timeout/recovery gated.
9. Scheduled slot identity is unchanged.
10. Optional micro-check does not complete scheduled slot.
11. Optional micro-check does not increment `microChecksCompleted`.
12. No micro-check creates schedule credit.
13. No micro-check creates main-plan credit.
14. No micro-check creates progression evidence.
15. No micro-check affects retest timing.
16. No micro-check creates official V2 snapshot/assessment.
17. No micro-check creates comparison/report/block.
18. No micro-check changes focus or plan.
19. No micro-check becomes latest official profile/history.
20. H5B Balanced/domain policy unchanged.
21. H5A Progress unchanged.
22. H5C route retirement unchanged.
23. HF1 V2 Check-Up unchanged.
24. No new audio assets required.
25. Full repository gate passes.
26. Physical-device validation is not claimed.
27. Public release remains blocked.

# ACCEPTANCE CRITERIA

Do not mark HF2 complete unless:

1. Scheduled chair/balance/mobility micro-checks can complete without required mid-flow taps in deterministic tests.
2. Optional chair/balance/mobility micro-checks can complete without required mid-flow taps in deterministic tests.
3. Balance leg inference and fallback are tested.
4. Mobility side inference and fallback are tested.
5. Scheduled-vs-optional containment is tested.
6. H5B slot identity and first-accepted-wins remain green.
7. Official-profile/report/plan containment remains green.
8. H5A/H5B/H5C/H5D/HF1 regressions pass.
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

- any normal public scheduled/optional micro-check requires a mandatory side/start/finish/accept tap;
- optional micro-check completes scheduled slot by accident;
- micro-check creates credit/progression/official artifact;
- Balanced week 4 scheduled check-in returns;
- public V1 route returns;
- audio gate fails.

# STAGE DECISIONS

At the end of the report state exactly one:

```text
HF2 HANDS-FREE MICRO-CHECK IMPLEMENTATION COMPLETE
HF2 HANDS-FREE MICRO-CHECK IMPLEMENTATION BLOCKED
```

Also state exactly one:

```text
SCHEDULED MICRO-CHECK MID-FLOW TOUCH REMOVED
SCHEDULED MICRO-CHECK STILL REQUIRES MID-FLOW TOUCH
```

Also state exactly one:

```text
OPTIONAL MICRO-CHECK MID-FLOW TOUCH REMOVED
OPTIONAL MICRO-CHECK STILL REQUIRES MID-FLOW TOUCH
```

Also state exactly one:

```text
SINGLE-LEG MICRO-CHECK LEG INFERENCE IMPLEMENTED
SINGLE-LEG MICRO-CHECK LEG INFERENCE BLOCKED
```

Also state exactly one:

```text
MOBILITY MICRO-CHECK SIDE INFERENCE IMPLEMENTED
MOBILITY MICRO-CHECK SIDE INFERENCE BLOCKED
```

Also state exactly one:

```text
OPTIONAL MICRO-CHECK NON-SCHEDULED CONTAINMENT PRESERVED
OPTIONAL MICRO-CHECK CONTAINMENT BLOCKED
```

Also state exactly one:

```text
SCHEDULED MICRO-CHECK POLICY PRESERVED
SCHEDULED MICRO-CHECK POLICY REGRESSED
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
HF3 TRAINING HANDS-FREE NOT STARTED
```

# FINAL CODEX RESPONSE

Return a concise summary containing:

- report path;
- whether production runtime code changed;
- current required micro-check touch points removed;
- chair-power behavior;
- single-leg-balance implementation;
- mobility-reach implementation;
- scheduled vs optional distinction;
- optional micro-check containment;
- scheduled slot identity result;
- side/leg metadata behavior;
- UI/copy changes;
- accessibility fallback behavior;
- persistence/sync/restore/export result;
- official artifact/report/plan containment;
- tests added/changed;
- focused validation;
- full Jest;
- audio verification;
- app typecheck;
- website typecheck;
- Expo config/export;
- `git diff --check`;
- H5A/H5B/H5C/H5D/HF1 regression result;
- `HF2 HANDS-FREE MICRO-CHECK IMPLEMENTATION COMPLETE` or blocked;
- remaining HF3 follow-up;
- initial/final Git status;
- complete files-changed inventory;
- confirmation that no package install, lockfile change, audio regeneration, staging, commit, branch, push, Warden work, H5 route rollback, training credit/progression change, or physical-device validation claim occurred.
