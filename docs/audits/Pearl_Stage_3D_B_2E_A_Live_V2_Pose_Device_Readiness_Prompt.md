You are implementing Stage 3D-B.2E-A of Pearl’s production-readiness work:

LIVE MOVEMENT PROFILE V2 POSE INTEGRATION, MONOTONIC TIMER/REST/RETRY HARDENING, VOICE/TEXT PARITY, INTERNAL DEVICE-DIAGNOSTICS HARNESS, AND SOFTWARE READINESS FOR PHYSICAL-DEVICE VALIDATION

This stage follows:

- Stage 3D-B.2A: pure V2 assessment protocols/controllers;
- Stage 3D-B.2B: pure V2 reference engine;
- Stage 3D-B.2C: immutable V2 snapshots, persistence, sync, and restore;
- Stage 3D-B.2D.1: pure V2 domain-evidence, suggested-focus, balanced-fallback, and assessment contract;
- Stage 3D-B.2D.2A: immutable V2 assessment persistence/orchestration;
- Stage 3D-B.2D.2B: internal V2 Check-Up shell, reference details, Movement Profile UI, and Progress surface.

Implement the missing live camera/state-machine integration and the narrow internal diagnostics needed to begin real physical-device validation.

Do not implement V2 MovementBlock creation, balanced workout generation, V2 reports, public rollout, official V2 re-test scheduling, Warden chair transform, longitudinal improvement/decline claims, new pose models, native model benchmarking campaigns, or final physical-device sign-off in this task.

## Why this stage is next

Stage 3D-B.2D.2B delivered the internal product shell, but its report explicitly records that:

- the dedicated V2 screen still uses button-driven captured controller outputs;
- live pose frames do not yet drive the full chair, balance, shoulder, and hinge protocol flow;
- the full live timer/rest/retry matrix remains deferred;
- full 45-second balance/rest voice parity remains deferred;
- snapshot-only and malformed-artifact recovery UI is incomplete;
- no physical-device validation has been performed.

The next risk is therefore no longer snapshot, scoring, or UI architecture. It is whether the real camera stream can drive the already-approved V2 protocols honestly, with correct timing, interruption handling, bounded retries, and no stale-frame or duplicate-callback defects.

## Current verified baseline

### Internal gate and UI

Stage 3D-B.2D.2B added:

- compile-time gate:
  - `EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_INTERNAL=1`;
- internal Settings developer entry;
- dedicated `MovementProfileV2CheckUpScreen`;
- reference-details screen;
- Movement Profile results/detail screens;
- latest Movement Profile Progress card;
- V1 remains public/default.

### Pure V2 controllers

Existing V2 controller contracts cover:

#### Chair

- setup confidence;
- one practice repetition;
- 30-second official window;
- full-stand counting;
- no partial final repetition;
- hand-push-off metadata;
- tracking/protocol evidence.

#### Balance

- selected standing leg;
- adaptive best-of-three valid trials;
- 45-second maximum per valid trial;
- best-valid result;
- 30-second minimum / 60-second default rest;
- `Use this result`;
- invalid tracking trial does not consume a valid attempt;
- one automatic invalid-trial retry;
- bounded section hard cap.

#### Shoulder

- selected side;
- selected-side geometry;
- one valid capture;
- one guided invalid-attempt retry;
- pain-limited raw result;
- torso-compensation/tracking metadata.

#### Hinge

- supporting evidence only;
- cannot replace a missing shoulder result;
- cannot drive V2 reference interpretation or suggested focus.

### Frozen artifact chain

The current internal flow already supports:

```text
complete raw V2 Check-Up
-> per-Check-Up reference details
-> immutable V2 snapshot
-> immutable V2 assessment
-> local/backend persistence
-> Movement Profile UI
```

Existing frozen artifacts must be reused, never recomputed.

### Validation baseline

Stage 3D-B.2D.2B passed:

- targeted: 27 suites / 272 tests;
- full Jest: 117 suites / 986 tests;
- audio verification;
- app typecheck;
- website typecheck;
- Expo config/export;
- `git diff --check`.

Re-run the current baseline instead of assuming these counts remain unchanged.

## Locked product and technical decisions

### Product

1. V2 remains internal only.

2. V1 remains the public/default Check-Up.

3. No V2 block or report is created in this stage.

4. Raw metrics remain primary.

5. Frozen snapshots/assessments remain the only authority for results/focus UI.

6. Chair remains raw-only while the Warden transform is disabled.

7. No improvement, decline, younger/older, pass/fail, diagnosis, or risk claims.

### Pose pipeline

1. Reuse the existing production pose pipeline.

2. Preserve the current production MediaPipe Full model configuration.

3. Preserve existing native latest-only event coalescing, frame dropping, orientation handling, and camera-resolution policy.

4. Do not add another pose-estimation pipeline.

5. Do not enqueue unbounded native-to-JS or JS controller events.

6. Do not process high-frequency pose events through per-frame React state.

7. Pose avatar rendering and assessment control must remain separate consumers of the latest pose sample.

8. Do not change native model/delegate/running-mode selection unless live integration proves a concrete blocker and the change is explicitly documented and narrowly tested.

### Timing

1. Active protocol timing must use a monotonic clock contract.

2. Pure controllers receive explicit timestamps.

3. Do not use ambient `Date.now()` inside pure protocol logic.

4. Frame timestamps and app timer timestamps must be normalised to one documented monotonic time basis before controller use.

5. The countdown/rest/deadline system must progress even when no pose frame arrives.

6. Tracking loss must not pause a normative timer and pretend the protocol remained continuous.

### Physical-device claim boundary

This stage may make the software ready for physical-device validation.

It must not claim:

- camera accuracy has been validated;
- timer accuracy has been validated on target devices;
- pose detection is reliable across homes/devices;
- the protocols are beta-ready on hardware.

## Required prior reading

Read these reports in full before changing code:

- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2D_2B.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2D_2A.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2D_1.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2C.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2B.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2A.md
- docs/audits/PEARL_PERCENTILE_SCORING_PROTOCOL_DESIGN_STAGE_3D_B_1.md
- docs/audits/PEARL_POSE_PIPELINE_LATENCY_REMEDIATION.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4D_R.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_4D_R_1_CONTINUATION.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4G_R.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4F_R_1.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5H.md

Also inspect repository instructions:

- AGENTS.md;
- CLAUDE.md;
- current pose-detection module documentation;
- current pose-latency diagnostics;
- current audio-generation/verification instructions;
- current app-state/background handling;
- current test-fixture conventions.

Treat the current working tree as the source of truth.

## Primary objectives

Stage 3D-B.2E-A must:

1. Replace button-driven measurement capture in the normal internal V2 path with live pose-driven controller events.

2. Add one narrow live-pose adapter boundary between the camera/native pose event and the existing pure V2 protocol controllers.

3. Use explicit movement/trial epochs so stale frames cannot mutate a new movement or attempt.

4. Use a monotonic timer driver independent of pose-frame arrival.

5. Wire live chair practice and official rep counting.

6. Wire live 45-second adaptive balance attempts, rest, retries, and manual termination controls.

7. Wire live selected-side shoulder capture and one-retry policy.

8. Wire supporting hinge capture without V1 scoring.

9. Handle tracking interruptions, app backgrounding, stale/out-of-order frames, duplicate callbacks, and timer deadlines conservatively.

10. Preserve current pose latency protections and avoid high-frequency React re-rendering.

11. Complete active-flow voice/text parity, including 45-second balance/rest/retry semantics.

12. Add a bounded internal V2 diagnostics harness suitable for later device runs.

13. Add deterministic synthetic-pose replay tests for all headline protocols.

14. Add fuller pending/malformed-artifact internal recovery UI.

15. Prove a live-adapter-driven complete run still produces the existing frozen snapshot, assessment, and Movement Profile UI.

16. Keep V1, Stage 4, Stage 5, audio, navigation, and TypeScript boundaries green.

## Scope boundary

This task may change:

- V2 live-pose sample/adaptor types;
- V2 live controller coordinator/reducer;
- monotonic timer/ticker helper;
- `MovementProfileV2CheckUpScreen`;
- V2 flow integration helpers;
- narrow pose-geometry adapters for chair/balance/shoulder/hinge;
- internal V2 diagnostics schema/store/overlay/export;
- V2 recovery states/screen;
- active assessment cue definitions/manifests/assets if required;
- focused tests and synthetic pose fixtures;
- the Stage 3D-B.2E-A report.

This task must not change:

- V1 scoring/norms/focus;
- V2 reference source tables/transforms;
- Warden transform status;
- V2 snapshot or assessment schema semantics;
- suggested-focus policy;
- life-goal mappings;
- profile schema;
- V2 block creation;
- balanced training templates;
- Stage 5 schedule/progression;
- exercise catalogue;
- public navigation/onboarding;
- website;
- pose model asset;
- production model variant;
- native delegate/running mode without a proven blocker;
- dependencies;
- lockfiles;
- unrelated images/fonts/audio.

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

- The worktree has contained substantial concurrent screen, theme, voice, pose, native, diagnostics, auth, website, and Stage 3D-B work.
- Inspect every current diff before touching a file.
- The 88 existing Clara/Marcus safety MP3s and their manifests are intended current assets.
- Do not delete or regenerate them.
- Do not inspect or expose `.env` values.
- Do not expose ElevenLabs credentials.
- Do not modify or share font files.

Rules:

1. Treat every current modified/untracked file as user-owned.

2. Do not revert, overwrite, broadly reformat, move, or delete unrelated work.

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

Run a targeted slice covering:

- internal V2 gate;
- V2 internal flow/view model/reference-details;
- V2 protocol controllers;
- V2 snapshot/assessment/orchestration;
- V2 history/sync/restore;
- pose event/scheduler diagnostics;
- V1 Check-Up flow;
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
rm -rf /tmp/pearl-stage3db2ea-export
npx --no-install expo export --platform all --output-dir /tmp/pearl-stage3db2ea-export
rc=$?
rm -rf /tmp/pearl-stage3db2ea-export
exit $rc
```

Do not install dependencies.

Record current counts and warnings.

# PART B — RECONSTRUCT THE CURRENT LIVE POSE PATH

## Step 1: Inspect the current camera/native event contract

Inspect at minimum:

- src/components/SafePoseDetectionView.tsx
- modules/expo-pose-detection/src/ExpoPoseDetection.types.ts
- modules/expo-pose-detection/src/PoseDetectionView.tsx
- current native event payloads on Android/iOS
- current native event coalescing/latest-only scheduler
- current rotation/mirroring normalisation
- current MediaPipe model/running-mode selection
- current camera image size/config
- current pose-latency diagnostics
- current avatar/render pipeline.

Document:

- frame ID;
- native timestamp;
- timestamp time base;
- frame dimensions;
- rotation;
- mirroring;
- landmark coordinate space;
- confidence fields;
- event coalescing behavior;
- possible out-of-order/duplicate behavior;
- current JS callback frequency;
- current frame-drop counters.

Do not edit until the contract is traced.

## Step 2: Inspect the current V2 screen

Inspect:

- src/screens/MovementProfileV2CheckUpScreen.tsx
- src/movementProfileV2/internalCheckupFlow.ts
- V2 screen tests
- App routing/orchestration.

Identify every button-driven synthetic capture path.

Classify each current button as:

- legitimate user protocol control;
- temporary synthetic measurement control;
- diagnostic-only control;
- recovery control.

The normal internal path must remove or disable synthetic measurement buttons.

Legitimate controls may remain, including:

- `I touched support`;
- `Stop`;
- `I'm ready`;
- `Use this result`;
- retry/reposition actions.

## Step 3: Inspect existing movement geometry

Inspect:

- V1 chair grader/geometry;
- V1 balance grader/valid-time logic;
- V1 shoulder flexion geometry;
- V1 hinge reach geometry;
- body-unit calibration;
- Stage 2A readiness/orientation helpers;
- selected-side/selected-leg helpers in V2 controllers.

Reuse proven geometry where semantically compatible.

Do not change V1 movement semantics.

# PART C — LIVE POSE SAMPLE AND EPOCH BOUNDARY

## Step 4: Add one live-pose sample type

Conceptually:

```ts
type MovementProfileV2LivePoseSample = {
  frameId: number | string;
  timestampMs: number;
  receivedAtMs: number;

  landmarks: ReadonlyPoseLandmarks;
  trackingQuality: 'good' | 'uncertain' | 'lost';

  imageWidth: number;
  imageHeight: number;
  rotationDegrees: 0 | 90 | 180 | 270;
  mirrored: boolean;

  movementEpochId: string;
  attemptEpochId?: string;
};
```

Adapt to current types.

Requirements:

- in-memory only;
- no persistence;
- no logging of landmark arrays;
- finite timestamps;
- known dimensions;
- normalized orientation;
- explicit movement/attempt epoch;
- input non-mutating.

## Step 5: Add one live adapter/coordinator

Conceptually:

```ts
type MovementProfileV2LiveCoordinator = {
  receivePoseSample(sample): LiveCoordinatorResult;
  receiveTimerTick(nowMs): LiveCoordinatorResult;
  receiveUserAction(action, nowMs): LiveCoordinatorResult;
  receiveAppState(action, nowMs): LiveCoordinatorResult;
};
```

Requirements:

- pure core or reducer;
- explicit timestamps;
- no React dependency;
- no navigation/persistence;
- stable diagnostics;
- consumes existing pure V2 controller functions rather than reimplementing protocols;
- per-movement adapter converts landmarks to controller events;
- equal event stream -> equal output.

## Step 6: Epoch and stale-frame policy

Every movement/trial gets a stable epoch ID.

Rules:

- frame epoch mismatch -> drop;
- stale frame timestamp -> drop;
- duplicate frame ID -> drop;
- out-of-order frame -> drop;
- frames received after movement completion -> drop;
- prior-attempt balance frames cannot affect the next attempt;
- prior chair-practice frames cannot affect official count;
- prior shoulder attempt cannot affect retry.

Expose counters, not raw frames.

# PART D — MONOTONIC CLOCK AND TIMER DRIVER

## Step 7: Establish one time basis

Inspect the native frame timestamp semantics.

Choose one documented strategy:

### Preferred

Use an existing monotonic native timestamp directly when it shares a reliable time basis with app scheduling.

### Otherwise

At adapter start, create a fixed bridge between native frame timestamps and the app’s monotonic clock.

Requirements:

- no wall-clock/ISO time for active protocol durations;
- no mixing unrelated timestamp origins without conversion;
- no negative elapsed time;
- no time travel after app resume;
- deterministic test injection.

## Step 8: Add the timer driver

Use one narrow ticker/RAF scheduler for:

- countdowns;
- chair deadline;
- balance deadline;
- balance rest;
- shoulder capture deadline;
- section hard cap;
- UI display projection.

Requirements:

- controller time advances without pose frames;
- no accumulating interval callbacks;
- at most one active scheduled ticker;
- cancel on unmount/movement change;
- latest state held in refs/store, not stale closures;
- pure controller receives explicit `nowMs`;
- deadline completion occurs even if the final pose frame is delayed.

## Step 9: Timer/UI update separation

Pose processing may occur at the accepted frame rate.

React UI projection must update only:

- on state transition;
- on meaningful rep/attempt/result change;
- on a documented throttled timer cadence.

Do not call React `setState` for every accepted pose frame.

Preserve the pose avatar’s current low-latency latest-frame path.

# PART E — LIVE CHAIR INTEGRATION

## Step 10: Add a chair live-pose adapter

Reuse current chair geometry/body-unit calibration.

The adapter must derive only controller-relevant events, such as:

- subject ready;
- seated;
- rising;
- full upright;
- returned seated;
- hand-push-off observed/unknown;
- tracking interrupted;
- setup invalid.

Do not create a second rep-count algorithm if a production chair grader can be safely reused.

## Step 11: Chair practice

Required live sequence:

```text
setup confirmed
-> camera readiness
-> practice state
-> live seated -> full upright -> seated cycle
-> practice complete
-> fresh grader/reset
-> settle dwell
-> official countdown
```

Invariants:

- practice rep never enters official count;
- practice and official use separate/reset state;
- frame at the boundary cannot count in both;
- tracking interruption resets practice;
- no valid practice -> no official start;
- timeout routes to reposition/help.

## Step 12: Chair official timer/count

Rules:

- official start time is frozen at `Go`;
- official deadline is exactly start + 30,000 ms;
- frames before start ignored for count;
- a full-upright event timestamp <= deadline counts;
- full upright after deadline does not count;
- partial rise at deadline does not count;
- return to seated after deadline is not required for a full stand already achieved before deadline;
- timer is not paused for tracking loss;
- timer completion is emitted by timer tick even without a final frame.

## Step 13: Chair tracking behavior

Use existing V2 evidence policy.

Requirements:

- brief confidence noise may be filtered only through existing tracking/readiness smoothing;
- once tracking is formally interrupted, record it;
- no fabricated reps;
- no silent pause;
- preserve raw result if current controller says it remains credible;
- otherwise route through the current V2 retry/recovery policy;
- hand-push-off remains metadata, not real-time scolding.

# PART F — LIVE BALANCE INTEGRATION

## Step 14: Add a selected-leg balance pose adapter

Use selected standing leg explicitly.

Derive only reliably supportable events:

- both-leg setup ready;
- selected standing leg identified;
- opposite foot lifted;
- valid hold established;
- raised foot down/contact event where reliable;
- stance foot displacement/step where reliable;
- arms-crossed status where reliable;
- tracking interrupted;
- selected-leg mismatch.

Do not claim camera detection of:

- support hand contact;
- subtle foot-to-leg contact;
- sway severity;
- floor quality.

When an event is not reliably observable:

- leave it unknown;
- use user controls/instructions where needed;
- do not fabricate detection.

## Step 15: Balance trial start

Start the 45-second active timer only when:

- selected standing leg is correct;
- raised foot is detected off the floor;
- required tracking is ready;
- the V2 controller accepts the attempt start.

Freeze:

- attempt epoch;
- start timestamp;
- selected leg.

## Step 16: Balance live termination

Terminate through controller events for:

- detected raised-foot touchdown;
- detected stance-foot step/displacement;
- reliably detected arms uncrossed if implemented;
- tracking interruption;
- user taps `I touched support`;
- user taps `Stop`;
- 45-second deadline.

Do not pause and resume a valid trial.

## Step 17: Adaptive attempt flow

Live integration must prove:

- attempt 1 ceiling -> section complete;
- valid non-ceiling attempt -> rest;
- attempt 2/3;
- best-valid result;
- invalid tracking trial does not increment valid-attempt count;
- one automatic invalid-tracking retry;
- second invalid does not loop;
- `Use this result` preserves best valid result and marks protocol incomplete;
- section hard cap.

## Step 18: Balance rest

Use the monotonic timer driver.

Requirements:

- `I'm ready` disabled before 30,000 ms;
- enabled at/after 30,000 ms;
- default-ready state at 60,000 ms according to existing controller policy;
- background/foreground cannot skip minimum rest;
- no negative countdown;
- no stale prior-attempt pose frame enters the new attempt.

## Step 19: Balance manual controls

Legitimate controls:

- `I touched support`;
- `Stop`;
- `I'm ready`;
- `Use this result`;
- retry/reposition.

These controls must emit real protocol events, not synthetic measured durations.

Remove any button that directly injects a successful 45-second result or arbitrary captured duration from the normal internal path.

# PART G — LIVE SHOULDER INTEGRATION

## Step 20: Add selected-side shoulder pose adapter

Reuse current shoulder-angle and selected-side geometry.

Requirements:

- selected side closest to camera;
- selected-side shoulder/elbow/wrist/hip chain;
- far-side chain cannot substitute silently;
- active flexion angle;
- reliable tracking duration;
- torso-compensation status;
- pain-limited user state;
- tracking interruption.

Any new compensation threshold must:

- be a named configurable constant;
- be documented as provisional;
- not be presented as clinically validated;
- be included in diagnostics;
- remain scheduled for device validation.

## Step 21: Shoulder live attempt

Sequence:

```text
side setup
-> camera readiness
-> countdown
-> live forward reach
-> peak/pause capture
-> valid result or guided retry
```

Requirements:

- one valid attempt completes;
- first invalid -> one retry;
- second invalid -> no valid measurement;
- active capture deadline remains explicit;
- reliable tracking minimum enforced;
- timer does not depend on frame frequency;
- selected side frozen per attempt;
- backgrounding invalidates active attempt.

## Step 22: Pain-limited result

User can indicate discomfort limitation through the current calm control/copy.

Requirements:

- technically valid capture may remain raw-valid;
- evidence status becomes pain-limited/raw-only;
- no reference comparison;
- no real-time medical interpretation.

# PART H — SUPPORTING HINGE LIVE INTEGRATION

## Step 23: Add explicit hinge live adapter

Reuse the current production hinge grader/geometry where possible.

Requirements:

- live landmarks drive the supporting hinge result;
- no button-generated ROM result;
- preserve V2 protocol policy;
- invalid/skipped hinge does not make headline raw completeness fail;
- hinge cannot replace shoulder;
- hinge cannot drive reference result or suggested focus;
- no V1 mobility-age scoring.

If reusing a V1 grader, wrap it in a narrow V2 supporting adapter and prove no V1 scoring/control flow is invoked.

# PART I — LIVE SCREEN AND RENDERING ARCHITECTURE

## Step 24: Remove normal-path synthetic measurement controls

The normal internal V2 path must not expose buttons such as:

- `Capture rep count`;
- `Complete 45 seconds`;
- `Save 28-second hold`;
- `Capture 154°`;
- or equivalent synthetic result injection.

Pure tests may still dispatch controller events.

A separate test-only harness may simulate event streams, but:

- it must not be reachable in the normal internal screen;
- it must not persist user results;
- it must be compile-time/test-only;
- it must never activate from backend/profile data.

## Step 25: Keep legitimate controls

Retain:

- stop;
- support touched;
- use result;
- ready after rest;
- retry;
- reposition;
- exit.

Ensure each has an accessible label and typed event.

## Step 26: Rendering performance

Requirements:

- latest pose goes directly to avatar renderer through existing low-latency path;
- controller processing uses refs or a non-React high-frequency store;
- React view model is projected at bounded cadence;
- no per-landmark React components;
- no array of historical frames in component state;
- no double smoothing;
- no new full-body render work.

Add a test or benchmarkable pure counter proving event queues cannot grow unbounded.

# PART J — APP STATE, INTERRUPTIONS, AND RESUME

## Step 27: App backgrounding

Required behavior:

### Chair active

- do not resume stale timer;
- complete as uncertain or route through current retry policy;
- preserve prior completed movements.

### Balance active

- invalidate current trial as tracking/background interruption;
- it does not consume valid-attempt count;
- one automatic retry policy remains;
- preserve earlier valid attempts.

### Balance rest

- recompute from an explicit monotonic deadline if reliable;
- otherwise restart rest conservatively;
- never skip the 30-second minimum.

### Shoulder active

- invalidate current attempt;
- consume retry according to existing one-retry policy.

### Hinge active

- invalidate/skip supporting capture conservatively.

## Step 28: Camera permission/view loss

Handle:

- camera permission revoked;
- camera component unmounted unexpectedly;
- native pose event silence;
- subject leaves frame;
- dimensions/orientation change;
- native runtime error.

Return typed recovery.

Do not fabricate raw results.

## Step 29: Duplicate completion protection

Protect against repeated:

- deadline ticks;
- final pose frame;
- controller completion callback;
- navigation callback;
- screen remount;
- artifact materialisation callback.

Use existing stable Check-Up/snapshot/assessment IDs and one-shot guards.

# PART K — PENDING/MALFORMED ARTIFACT RECOVERY UI

## Step 30: Add internal recovery states

Cover:

1. Raw-complete V2 Check-Up with no snapshot:
   - resume reference details.

2. Valid snapshot with no assessment:
   - finish assessment through existing materialiser;
   - do not rerun camera.

3. Valid snapshot + assessment:
   - open Movement Profile.

4. Malformed assessment with valid snapshot:
   - preserve snapshot;
   - offer `Finish your Movement Profile` only if the accepted history/parser has omitted the invalid assessment and immutable policy permits creation;
   - do not overwrite a valid conflicting artifact.

5. Malformed/mismatched snapshot:
   - preserve raw Check-Up;
   - do not overwrite the artifact;
   - offer internal retake/recovery;
   - show calm copy.

6. Unsupported future artifact:
   - do not downgrade;
   - preserve raw history;
   - show unsupported-version recovery.

## Step 31: Recovery copy

Use calm copy such as:

- `Your raw Check-Up is saved. Finish the final details to view your Movement Profile.`
- `This result needs a fresh internal Check-Up before Pearl can show the profile.`
- `The saved version will be used.`
- `Your raw result has not been lost.`

Do not show:

- corrupt;
- failed;
- invalid database;
- fingerprint mismatch;
- internal reason codes.

# PART L — VOICE/TEXT PARITY

## Step 32: Reconstruct current V2 cue coverage

Inventory every live active-flow state:

- V2 intro;
- chair setup;
- chair practice;
- chair official start;
- chair completion;
- balance setup;
- balance attempt start;
- balance rest;
- ready-after-rest;
- use-result option;
- tracking retry;
- balance completion;
- shoulder setup;
- shoulder attempt;
- shoulder retry;
- hinge setup;
- transition;
- Check-Up complete.

For each record:

- visible canonical text;
- current cue ID;
- current bundled Clara asset;
- current bundled Marcus asset;
- semantic match.

Do not reuse:

- V1 12-second balance wording;
- inaccurate attempt counts;
- inaccurate rest timing;
- unrelated workout cues.

## Step 33: Add canonical V2 assessment cue group if needed

If current cues are not semantically complete, add a narrow group, for example:

```text
movement_profile_v2
```

Requirements:

- one canonical text source;
- typed cue IDs;
- selected-voice local bundled playback;
- visible text fallback;
- no runtime TTS/network;
- no cross-voice fallback for required V2 cues;
- no secret output.

## Step 34: Generate only missing V2 assets

If new assets are required:

1. Extend the existing generator safely.

2. Run a dry run.

3. Generate only missing/stale `movement_profile_v2` assets for:
   - Clara;
   - Marcus.

4. Do not regenerate:
   - safety cues;
   - unrelated training cues;
   - full voice directories.

5. Use existing provider/model/output settings.

6. Update static manifests and fingerprints.

7. Extend non-network verification so output separately reports:
   - safety matrix: 44 cues / 88 assets;
   - V2 assessment matrix: exact cue/asset count.

8. Verify duration, MP3 integrity, static mapping, fingerprints, and no partial files.

If credentials are unavailable or generation fails:

- visible text remains;
- mark voice parity blocked;
- do not mark Stage 3D-B.2E-A complete.

## Step 35: Voice timing

Voice playback must not silently alter protocol timing.

Rules:

- official countdown/timer starts from an explicit controller event after required setup speech;
- long voice playback cannot shorten rest minimum;
- rest prompt may play while rest timer continues only if explicitly designed and tested;
- repeated cue playback cannot start a second trial;
- stale voice completion callbacks are ignored by epoch.

# PART M — INTERNAL DEVICE-DIAGNOSTICS HARNESS

## Step 36: Add a separate diagnostics gate

Prefer:

```text
EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_DIAGNOSTICS=1
```

Requirements:

- default false;
- only effective when the existing V2 internal gate is also enabled;
- no user setting;
- no backend/profile activation;
- no public route;
- strict parsing;
- environment values not printed.

If an existing internal diagnostics gate can safely serve this purpose, reuse it rather than adding another.

## Step 37: Add a bounded diagnostics record

Conceptually:

```ts
type MovementProfileV2LiveDiagnostics = {
  schemaVersion: number;
  runId: string;

  platform: 'ios' | 'android';
  appVersion?: string;
  poseModelVariant?: string;
  poseRunningMode?: string;
  cameraDimensions?: string;

  framesReceived: number;
  framesAccepted: number;
  staleFramesDropped: number;
  duplicateFramesDropped: number;
  outOfOrderFramesDropped: number;
  epochMismatchFramesDropped: number;

  trackingInterruptions: number;
  stateTransitions: readonly BoundedTransitionSummary[];

  chair: ...;
  balance: ...;
  shoulder: ...;
  hinge: ...;

  artifactOutcome?: string;
};
```

Requirements:

- no raw landmark arrays;
- no raw video/frame images;
- no auth/user ID;
- no free-text health data;
- bounded transition list/counters;
- deterministic schema;
- suitable for JSON export.

## Step 38: Diagnostics metrics

At minimum capture:

### Pose pipeline

- frames received/accepted;
- stale/duplicate/out-of-order/epoch drops;
- tracking quality counts;
- native coalescing counters if already exposed;
- frame timestamp deltas;
- controller-processing duration summary if inexpensive.

### Chair

- practice attempts;
- practice completion;
- official rep count;
- tracking interruptions;
- official timer elapsed/deadline drift.

### Balance

- trial count;
- valid/invalid attempts;
- durations;
- termination reasons;
- rest durations;
- retry usage;
- ceiling;
- hard-cap status.

### Shoulder

- attempt count;
- selected side;
- reliable tracking duration;
- peak angle;
- invalid reason;
- retry usage;
- compensation status.

### Hinge

- capture valid/invalid;
- angle/result metadata already approved for supporting evidence.

### Artifacts

- raw completion;
- snapshot created/reused;
- assessment created/reused;
- local save;
- sync outcome.

## Step 39: Diagnostics export

Reuse an existing diagnostics/share/export helper if available.

Requirements:

- explicit user action;
- JSON only;
- no automatic upload;
- no raw pose arrays;
- no secrets;
- local/internal only;
- malformed export fails safely.

Add one internal completion action:

```text
Export V2 diagnostics
```

only when the diagnostics gate is enabled.

# PART N — SYNTHETIC POSE REPLAY HARNESS

## Step 40: Add deterministic synthetic pose builders

Add test-only builders for:

### Chair

- seated;
- rising;
- full upright;
- seated;
- practice sequence;
- multiple official reps;
- partial final rise;
- boundary full stand;
- tracking interruption.

### Balance

- both feet;
- correct selected-leg lift;
- wrong-leg lift;
- valid hold;
- touchdown;
- stance displacement;
- tracking interruption;
- 45-second ceiling.

### Shoulder

- right/left selected-side setup;
- active flexion sweep;
- valid peak;
- insufficient tracking;
- torso compensation;
- wrong-side/far-side chain.

### Hinge

- valid side-view hinge;
- invalid tracking.

Use normalized landmark fixtures or the project’s existing landmark builders.

Do not commit real participant data.

## Step 41: Replay tests

Replay:

- variable frame rates;
- dropped frames;
- duplicate frames;
- out-of-order frames;
- delayed frames after deadline;
- timer ticks without frames;
- stale epoch frames;
- app background;
- remount/resume.

Assert deterministic controller results.

## Step 42: Bounded performance replay

Add one non-flaky replay test, for example:

- 1,000–5,000 synthetic pose events;
- latest-only/out-of-order handling;
- no event queue growth;
- bounded diagnostics;
- same output on repeated run.

Do not add fragile wall-clock performance thresholds to Jest.

# PART O — ARTIFACT MATERIALISATION REGRESSION

## Step 43: Complete live replay to frozen artifacts

Add an integration test:

```text
synthetic live chair
-> synthetic live balance
-> synthetic live shoulder
-> supporting hinge
-> raw complete Check-Up
-> reference details
-> materialise snapshot/assessment
-> Movement Profile view model
```

Requirements:

- no button-injected measurements;
- stable raw Check-Up ID;
- stable snapshot/assessment IDs;
- chair raw-only;
- balance task band;
- shoulder category;
- frozen suggested focus;
- no block/report;
- no recomputation.

## Step 44: Sync/offline behavior

Test:

- local save before remote sync;
- sync failure;
- screen reopens frozen profile;
- repeated materialisation reuses artifacts;
- no duplicate Check-Up;
- no duplicate snapshot/assessment.

# PART P — ACCESSIBILITY AND LIVE UX

## Step 45: Accessibility

Required:

- timer/attempt announcements at meaningful milestones, not every frame/second;
- screen-reader labels for manual protocol controls;
- status text visible when voice unavailable;
- no color-only tracking status;
- large touch targets;
- no modal that obscures emergency stop/exit;
- raw values announced with units.

## Step 46: Tracking feedback

Use calm, concise states:

- `Step back so your full body is visible.`
- `Hold still while Pearl finds your position.`
- `Tracking paused. Return to the setup position.`
- `This attempt will restart so the timing stays accurate.`

Do not provide continuous form criticism.

Do not imply medical-grade tracking.

# PART Q — COPY GUARDRAILS

## Step 47: Protect the live V2 path

Disallow user-facing V2 live-flow/result copy that says:

- movement age;
- body age;
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
- medical-grade;
- perfect form;
- camera knows support contact when it does not.

Do not globally ban internal code terms.

# PART R — OBSERVABILITY AND PRIVACY

## Step 48: Safe production breadcrumbs

Outside the optional diagnostics export, production breadcrumbs may include:

- movement ID;
- state transition;
- attempt number;
- reason code;
- frame-drop counts;
- tracking-interruption count;
- artifact action.

They must exclude:

- landmarks;
- video;
- image data;
- body coordinates;
- free-text health notes;
- exact reference-profile payload;
- auth data;
- provider secrets.

Pure helpers do not log.

# PART S — REQUIRED TEST MATRIX

## A. Live sample/epoch

- valid frame;
- malformed frame;
- duplicate ID;
- out-of-order;
- stale timestamp;
- wrong movement epoch;
- wrong attempt epoch;
- after completion;
- input non-mutation.

## B. Timer driver

- countdown;
- no pose frames;
- deadline;
- cancellation;
- movement switch;
- background;
- no duplicate deadline;
- no negative rest;
- deterministic explicit clock.

## C. Chair live

- readiness;
- practice sequence;
- practice reset;
- practice not counted;
- official reps;
- boundary count;
- partial final;
- frame after deadline;
- tracking interruption;
- hand-push metadata;
- background.

## D. Balance live

- selected leg;
- wrong leg;
- lift starts timer;
- touchdown;
- support button;
- stop button;
- ceiling;
- best of three;
- 30-second rest lock;
- 60-second default;
- use result;
- invalid retry;
- second invalid;
- stale frames between attempts;
- hard cap;
- background.

## E. Shoulder live

- selected side;
- wrong/far side;
- valid sweep;
- reliable tracking minimum;
- peak angle;
- compensation;
- retry;
- second invalid;
- pain-limited;
- deadline;
- background.

## F. Hinge live

- valid capture;
- invalid;
- supporting only;
- no focus/reference substitution.

## G. React integration

- no synthetic result buttons in normal path;
- legitimate controls emit typed events;
- bounded UI projection;
- duplicate callbacks one-shot;
- unmount cleanup.

## H. Recovery

- raw pending;
- snapshot missing assessment;
- malformed assessment;
- malformed snapshot;
- future artifact;
- calm copy;
- no overwrite.

## I. Voice/audio

- cue matrix;
- text parity;
- selected voice;
- no wrong semantic reuse;
- no cross-voice fallback;
- timer unaffected by voice callbacks;
- asset verifier if new assets added.

## J. Diagnostics

- gate false/true;
- bounded counters;
- no landmarks/PII;
- deterministic export;
- no auto upload;
- frame-drop counters.

## K. End-to-end replay

- live synthetic run -> frozen artifacts -> UI;
- offline sync;
- repeated materialisation;
- no block/report.

## L. Containment

- V1 default unchanged;
- no V2 MovementBlock;
- no V2 report;
- no public route;
- no Warden transform;
- no source-table changes;
- no native model/running-mode changes unless explicitly justified.

## M. Regression

- Stage 3D-B.2A;
- Stage 3D-B.2B;
- Stage 3D-B.2C;
- Stage 3D-B.2D.1;
- Stage 3D-B.2D.2A;
- Stage 3D-B.2D.2B;
- Stage 2A.1;
- V1 Check-Up/results;
- Stage 4 closure;
- Stage 5H;
- safety audio;
- navigation;
- app/website TypeScript boundaries.

## Test-quality requirements

Tests must:

- exercise production live adapters/coordinator;
- use explicit timestamps;
- use synthetic landmarks only;
- assert epoch/stale-frame handling;
- assert timer behavior independent of frame arrival;
- assert no synthetic measurement UI;
- assert frozen artifact reuse;
- assert no high-frequency React state dependence where testable.

Tests must not:

- mock every layer;
- assert only helper calls;
- use real participant data;
- require camera hardware;
- depend on wall-clock sleeps;
- use network;
- install packages;
- embed Warden data;
- weaken existing protocol parsers.

# PART T — VALIDATION COMMANDS

Run targeted tests for:

- live pose sample/adapters;
- monotonic timer;
- V2 live coordinator;
- V2 Check-Up screen;
- chair/balance/shoulder/hinge protocol controllers;
- V2 diagnostics;
- recovery;
- V2 audio if changed;
- artifact materialisation;
- V1 Check-Up regression;
- pose scheduler/latency regression;
- Stage 4 closure;
- Stage 5H lifecycle.

If native code is changed, also run the existing native unit-test/build commands for the touched platform(s) and record them. Avoid native changes unless required.

If new audio is required, record:

- dry-run required/missing/stale/provider-call counts;
- Clara generated/reused/missing;
- Marcus generated/reused/missing;
- exact new MP3 inventory;
- no unrelated audio changes.

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
rm -rf /tmp/pearl-stage3db2ea-export
npx --no-install expo export --platform all --output-dir /tmp/pearl-stage3db2ea-export
rc=$?
rm -rf /tmp/pearl-stage3db2ea-export
exit $rc
```

Do not install dependencies.

Record:

- exact targeted command;
- targeted suite/test counts;
- full suite/test counts;
- audio verification counts;
- new V2 audio counts if applicable;
- app typecheck;
- website typecheck;
- Expo config;
- Expo export;
- native tests if applicable;
- git diff check;
- Watchman warning;
- Jest open-handle notice;
- Sentry warning;
- any new warning;
- whether validation changed files.

# PART U — MANUAL SOFTWARE TRACE AFTER TESTS

Retrace:

### Chair

```text
native latest pose
-> normalized live sample
-> chair adapter
-> practice
-> official timer/count
-> raw chair result
```

### Balance

```text
native latest pose
-> selected-leg adapter
-> attempt timer
-> rest/retry/use-result
-> best valid result
```

### Shoulder

```text
native latest pose
-> selected-side adapter
-> live angle/validity
-> retry
-> raw shoulder result
```

### Hinge

```text
native latest pose
-> supporting hinge adapter
-> supporting result
```

### Full flow

```text
live raw Check-Up
-> reference details
-> frozen snapshot
-> frozen assessment
-> Movement Profile UI
```

### Recovery

Confirm raw/snapshot/assessment cases.

### Containment

Confirm no V2 block/report/public route.

# PART V — PHYSICAL-DEVICE VALIDATION RUNBOOK IN REPORT

Do not perform or claim physical-device validation.

The report must define the next manual device run matrix, at minimum:

## Devices

- one recent Android flagship;
- one mid-range Android;
- one recent iPhone if available later.

## Per device

- chair practice + full 30-second run;
- balance ceiling run;
- balance early-touchdown run;
- invalid-tracking retry;
- 30/60-second rest;
- shoulder left/right capture;
- shoulder invalid retry;
- hinge supporting capture;
- background/foreground;
- offline completion/sync retry;
- diagnostics export.

## Human-reference observations

- manual chair rep count;
- stopwatch balance time;
- manual selected side/leg correctness;
- shoulder setup and obvious compensation;
- app timer drift;
- duplicate/missed transitions;
- perceived voice timing.

Do not define acceptance thresholds as scientifically validated unless they already exist. The runbook is for the next stage.

# PART W — REMEDIATION REPORT

Create exactly one new report:

```text
docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2E_A.md
```

Do not edit prior reports.

The report must contain:

1. Scope.
2. Current caveat being closed.
3. Product/technical policies preserved.
4. Initial Git status.
5. Current camera/native event contract.
6. Current button-driven path inventory.
7. Live sample/epoch architecture.
8. Monotonic clock/timer architecture.
9. React/render performance boundary.
10. Chair live integration.
11. Balance live integration.
12. Balance rest/retry integration.
13. Shoulder live integration.
14. Hinge live integration.
15. App-state/interruption behavior.
16. Synthetic control removal.
17. Recovery UI.
18. Voice/text cue inventory.
19. Audio generation/integrity if applicable.
20. Diagnostics schema/harness.
21. Synthetic replay harness.
22. Full live-replay artifact result.
23. Payload/privacy behavior.
24. Files changed.
25. Tests added/changed.
26. Exact targeted validation.
27. Exact full validation.
28. Audio verification.
29. App/website typechecks.
30. Expo config/export.
31. Native tests if applicable.
32. Stage 3D-B.2A through 2D.2B regression verification.
33. Stage 4/5 regression verification.
34. Physical-device validation runbook.
35. Remaining Stage 3D-B work.
36. Whether Stage 3D-B.2D.2C is unblocked.
37. Initial and final Git status.
38. Complete files-changed inventory.
39. Concurrent external changes.
40. Confirmation that no package install, lockfile change, source PDF/workbook commit, staging, commit, branch, or push occurred.

# REQUIRED INVARIANT OUTCOMES

After Stage 3D-B.2E-A:

1. V1 remains public/default.
2. V2 remains internal.
3. Normal V2 path has no synthetic measurement buttons.
4. Live pose frames drive chair.
5. Live pose frames drive balance.
6. Live pose frames drive shoulder.
7. Live pose frames drive supporting hinge.
8. Pose avatar remains on existing latest-frame path.
9. No unbounded pose/controller queue exists.
10. Stale/duplicate/out-of-order frames fail closed.
11. Movement/attempt epochs prevent cross-attempt contamination.
12. Pure controllers receive explicit timestamps.
13. Timers advance without pose frames.
14. Chair practice never counts.
15. Chair official deadline is exactly 30 seconds.
16. Partial final rise does not count.
17. Balance max trial is exactly 45 seconds.
18. Balance valid attempts are at most three.
19. Invalid tracking attempt does not consume a valid attempt.
20. Balance automatic retry is bounded.
21. Rest minimum cannot be bypassed.
22. Support/stop/use-result controls emit real events.
23. Shoulder selected side is enforced.
24. Shoulder retry is bounded to one.
25. Hinge remains supporting only.
26. Backgrounding cannot resume stale normative timers.
27. Duplicate callbacks do not duplicate results/artifacts.
28. Raw-complete pending flow remains recoverable.
29. Malformed artifact recovery does not overwrite frozen truth.
30. Active flow has voice/text parity.
31. Any new V2 audio is local, mapped, fingerprinted, and verified for both voices.
32. Existing 44/88 safety audio remains unchanged and valid.
33. Diagnostics contain no raw landmarks/video/PII.
34. Synthetic replay deterministically reaches frozen artifacts.
35. Results UI still reads frozen artifacts only.
36. Chair remains raw-only.
37. No improvement/decline claims exist.
38. No V2 MovementBlock/report exists.
39. No public rollout exists.
40. Stage 4/5 contracts remain green.
41. No unrelated product logic changes.

# ACCEPTANCE CRITERIA

Do not mark Stage 3D-B.2E-A complete unless:

1. Live pose integration replaces synthetic measurement capture.

2. Monotonic timing is explicit and tested.

3. Chair live protocol is complete.

4. Balance live protocol/rest/retry is complete.

5. Shoulder live protocol/retry is complete.

6. Supporting hinge is live.

7. Epoch/stale-frame handling is complete.

8. Background/interruption behavior is conservative.

9. High-frequency processing avoids per-frame React state.

10. Voice/text parity is complete.

11. Diagnostics harness is implemented and privacy-safe.

12. Synthetic live replay reaches frozen artifacts.

13. Pending/malformed recovery is implemented.

14. V1 remains unchanged.

15. No V2 block/report/public rollout is introduced.

16. Targeted tests pass.

17. Full Jest passes.

18. `npm run verify:audio` passes.

19. App typecheck passes.

20. Website typecheck passes.

21. Expo config passes.

22. Expo export passes.

23. Native tests pass if native code changed.

24. `git diff --check` passes.

25. No new warning is introduced without explanation.

26. No unrelated user work is reverted or overwritten.

27. No package install or lockfile change occurs.

28. No source PDF/workbook is committed.

29. No staging, commit, branch, or push occurs.

Do not mark this stage complete if the normal internal V2 path still depends on manually injecting measured values.

# STAGE DECISIONS

At the end of the report, state exactly one:

- `STAGE 3D-B.2E-A COMPLETE`
- `STAGE 3D-B.2E-A BLOCKED`

Also state one for each:

- `LIVE V2 POSE INTEGRATION IMPLEMENTED`
- `LIVE V2 POSE INTEGRATION BLOCKED`

- `LIVE V2 TIMING REST AND RETRY IMPLEMENTED`
- `LIVE V2 TIMING REST AND RETRY BLOCKED`

- `V2 VOICE TEXT PARITY VERIFIED`
- `V2 VOICE TEXT PARITY BLOCKED`

- `V2 INTERNAL DEVICE DIAGNOSTICS IMPLEMENTED`
- `V2 INTERNAL DEVICE DIAGNOSTICS BLOCKED`

Also state exactly one:

- `SOFTWARE READY FOR PHYSICAL-DEVICE VALIDATION`
- `SOFTWARE NOT READY FOR PHYSICAL-DEVICE VALIDATION`

Use ready only if the normal internal path is live-pose-driven, timer/retry behavior is deterministic, active voice parity is complete, and synthetic replay reaches frozen artifacts.

Also state exactly one:

- `STAGE 3D-B.2D.2C UNBLOCKED`
- `STAGE 3D-B.2D.2C BLOCKED`

Use `STAGE 3D-B.2D.2C UNBLOCKED` only if live measurement is software-ready for physical-device validation and no P0/P1 live-flow defect remains.

Also state:

- `PHYSICAL DEVICE VALIDATION NOT PERFORMED`
- `PHYSICAL DEVICE VALIDATION REQUIRED`
- `MOVEMENT PROFILE V2 INTERNAL ONLY`
- `V1 PUBLIC DEFAULT UNCHANGED`
- `CHAIR WARDEN TRANSFORM NOT EMBEDDED`
- `CHAIR REFERENCE CLAIM REMAINS RAW-ONLY`
- `NO V2 MOVEMENTBLOCK CREATED`
- `NO V2 REPORT CREATED`
- `NO PUBLIC V2 ROLLOUT`
- `NO IMPROVEMENT OR DECLINE CLAIMS`
- `STAGE 4 REMEDIATION COMPLETE`
- `STAGE 5 REMEDIATION COMPLETE`
- `OVERALL BETA RELEASE STILL BLOCKED`

Do not declare Pearl beta-ready.

# FINAL CODEX RESPONSE

Return a concise summary containing:

- Remediation report path.
- Whether production code changed.
- Live pose adapter/coordinator architecture.
- Monotonic timing architecture.
- Epoch/stale-frame behavior.
- Chair live behavior.
- Balance live/rest/retry behavior.
- Shoulder live behavior.
- Hinge live behavior.
- Synthetic measurement-control removal.
- App background/interruption behavior.
- Recovery UI behavior.
- Voice/text/audio result.
- Diagnostics harness/export result.
- Synthetic replay result.
- Frozen-artifact end-to-end result.
- Performance/queue containment result.
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
- Native test result if applicable.
- `git diff --check`.
- Confirmation that Stage 3D-B.2A/2B/2C/2D.1/2D.2A/2D.2B, Stage 2A.1, Stage 3B/3C/3D, Stage 4, Stage 5, navigation, TypeScript boundaries, progression policies, optional containment, and safety audio remain green.
- Remaining Stage 3D-B work.
- `STAGE 3D-B.2E-A COMPLETE` or blocked.
- Live pose verdict.
- Timer/rest/retry verdict.
- Voice/text verdict.
- Diagnostics verdict.
- `SOFTWARE READY FOR PHYSICAL-DEVICE VALIDATION` or not ready.
- `STAGE 3D-B.2D.2C UNBLOCKED` or blocked.
- `PHYSICAL DEVICE VALIDATION NOT PERFORMED`.
- `PHYSICAL DEVICE VALIDATION REQUIRED`.
- `MOVEMENT PROFILE V2 INTERNAL ONLY`.
- `V1 PUBLIC DEFAULT UNCHANGED`.
- `CHAIR WARDEN TRANSFORM NOT EMBEDDED`.
- `CHAIR REFERENCE CLAIM REMAINS RAW-ONLY`.
- `NO V2 MOVEMENTBLOCK CREATED`.
- `NO V2 REPORT CREATED`.
- `NO PUBLIC V2 ROLLOUT`.
- `NO IMPROVEMENT OR DECLINE CLAIMS`.
- `OVERALL BETA RELEASE STILL BLOCKED`.
- Initial and final Git status.
- Complete files-changed inventory.
- Any concurrent external changes.
- Confirmation that no package install, lockfile change, source PDF/workbook commit, staging, commit, branch, or push occurred.
