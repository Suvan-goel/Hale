You are implementing Stage 3D-B.2A of Hale’s production-readiness work:

MOVEMENT PROFILE V2 ASSESSMENT PROTOCOLS, MULTI-TRIAL STATE MACHINES, PROTOCOL SETUP CAPTURE, RAW EVIDENCE METADATA, AND LEGACY-PATH CONTAINMENT

This is the first production implementation stage following the approved Stage 3D-B.1 percentile/reference design.

Implement only the assessment protocols and their state machines.

Do not implement the percentile/reference engine, published reference tables, Movement Profile result UI, suggested-focus algorithm, new score snapshots, backend score migration, public rollout, or physical-device validation in this task.

## Product-owner decisions already approved

The product owner approved all recommended Stage 3D-B.1 defaults and explicitly chose to proceed without the pre-implementation usability pilot.

Treat the skipped pilot as an accepted product risk to verify later during the internal feature-flagged physical-device phase. Do not block Stage 3D-B.2A because the pilot was skipped.

The locked decisions are:

### Chair rise

- Test duration: 30 seconds.
- Use a firm, stable dining chair without wheels.
- Place the chair against a wall.
- Seat should be roughly knee height.
- Ask one low-friction setup question:
  - `Yes`
  - `I'm not sure`
- Do not require a tape measure.
- Feet flat.
- Arms crossed.
- One camera-observed practice repetition before the official countdown.
- Count full stands only.
- Do not count a halfway or partial final rise when time expires.
- Hand push-off remains a recorded protocol flag, not a voiced form critique.
- Setup uncertainty or hand push-off preserves the raw result but will suppress reference comparison later.
- Current chair percentile/reference implementation remains blocked pending approved use of the Warden transform.

### One-leg balance

- Replace the current 12-second official headline balance protocol in Movement Profile V2.
- Maximum duration per valid trial: 45 seconds.
- Protocol: adaptive best-of-three valid trials.
- User chooses the preferred standing leg.
- Persist that leg for future official re-tests.
- If the first valid trial reaches 45 seconds, complete the balance section immediately.
- Otherwise offer up to two additional valid trials.
- Use the best valid trial as the raw result.
- Default rest after a non-ceiling valid trial: 60 seconds.
- Allow the user to continue after at least 30 seconds of rest.
- Allow the user to stop the remaining attempts and use the best valid result.
- Stopping before the planned valid attempts preserves a raw result but marks the protocol incomplete for later reference claims.
- A tracking-invalid trial does not consume one of the three valid attempts.
- Permit one automatic invalid-trial retry for the balance section.
- Do not loop indefinitely after repeated invalid tracking.
- Eyes open.
- Arms crossed during the active hold.
- Firm, dry, non-slip surface.
- Sturdy support within reach.
- Support contact ends the trial.
- Same standing leg is the default for official re-tests.
- Changed leg remains a valid raw result but must later suppress direct longitudinal comparison.

### Active shoulder reach

- User selects the shoulder side.
- Default to the right side only when no prior compatible side exists and the user does not choose another.
- Persist the selected side for official re-tests.
- Selected side must be closest to the camera.
- Standing active forward reach.
- One valid capture is sufficient.
- Permit one guided retry only when tracking, selected-side geometry, or substantial torso compensation invalidates the first attempt.
- Store the selected side and whether it changed from the prior official V2 Check-Up.
- A discomfort-limited but otherwise complete result remains raw-valid and will later be ineligible for a published comparison.
- Do not label this result as whole-body mobility age.

### Official raw-measurement completeness

- The future Movement Profile requires valid raw headline results for:
  - chair rise;
  - one-leg balance;
  - active shoulder reach.
- Missing age, reference sex, or published-reference eligibility must not invalidate the raw Check-Up.
- Hinge reach remains a supporting metric and does not become the primary mobility reference metric.
- No current Movement Profile V2 raw Check-Up may create a V1 movement-age score, MovementAssessment, MovementBlock, or report until later stages implement the new reference engine and versioned snapshot contract.

### Rollout

- Movement Profile V2 must not become the current public/default Check-Up in Stage 3D-B.2A.
- The existing V1 battery, scoring, snapshots, results, block creation, reports, history, and restore behavior remain the public/default path.
- Build the V2 protocol path alongside V1.
- Stage 3D-B.2E remains responsible for the final internal rollout flag and QA harness.
- A narrow protocol-policy abstraction may be added now, but do not add a user-facing toggle or enable V2 from profile/backend state.

## Required prior reading

Read these reports in full before changing code:

- docs/audits/HALE_PERCENTILE_SCORING_PROTOCOL_DESIGN_STAGE_3D_B_1.md
- docs/audits/HALE_LOGIC_AUDIT_STAGE_3D_B.md
- docs/audits/HALE_LOGIC_AUDIT_STAGE_3D.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_A.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_C.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_D.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_3C_1.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3B.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_2A_1.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4G_R.md
- docs/audits/HALE_LOGIC_REMEDIATION_STAGE_4F_R_1.md
- docs/audits/HALE_LOGIC_VERIFICATION_STAGE_5H.md

Also read repository instructions such as:

- AGENTS.md
- CLAUDE.md
- any movement/assessment architecture notes
- any current feature-flag conventions
- current audio-generation instructions

Treat the current working tree as the source of truth. Re-verify every path and contract before editing because the repository is heavily modified and prior report line numbers may no longer be exact.

## Verified baseline entering Stage 3D-B.2A

Stage 3D-B.1 design completed and specified:

- raw-first Movement Profile;
- chair percentile range later, not exact percentile;
- balance raw seconds plus Hale task band and source benchmark detail later;
- shoulder raw degrees plus source IQR category later;
- ordinal suggested-focus policy later;
- immutable legacy movement-age snapshots;
- new protocol/reference/display/focus version boundaries;
- physical-device validation before public claims.

Stage 4 remediation is complete:

- exercise catalogue software/content is ready for controlled beta;
- movement capability gates exist;
- safety cues and 88 local Clara/Marcus MP3 assets are verified;
- optional levels are hidden;
- progression is movement-specific and conservative;
- mobility rotation and equipment positioning are complete.

Stage 5 remediation is complete:

- current-planner authority;
- honest work/focus/schedule credit;
- idempotent progression;
- canonical equipment;
- explicit daily context;
- restore/replay protection;
- four-week scheduling;
- full lifecycle adversarial tests.

The Stage 3D-B.1 validation baseline was:

- targeted: 22 suites / 253 tests;
- full Jest: 107 suites / 884 tests;
- audio integrity: 44 cues / 88 assets;
- app typecheck passed;
- website typecheck passed;
- Expo config passed;
- git diff --check passed.

Re-run the current baseline instead of assuming these counts remain unchanged.

## Primary objectives

Stage 3D-B.2A must:

1. Add one explicit assessment protocol-policy abstraction that distinguishes legacy V1 from Movement Profile V2.

2. Preserve all legacy V1 movement IDs, protocols, result shapes, snapshots, and behavior.

3. Add a separate Movement Profile V2 battery and movement protocol definitions.

4. Add a reusable typed protocol-setup phase before camera preflight where required.

5. Implement the chair setup confirmation and practice-repetition state.

6. Implement a 45-second adaptive best-of-three one-leg-balance state machine.

7. Implement persisted selected-leg behavior and changed-leg metadata.

8. Implement side-specific active shoulder reach with one guided invalid-attempt retry.

9. Implement persisted selected-side behavior and changed-side metadata.

10. Persist complete raw protocol metadata in JSON-safe Check-Up records.

11. Define protocol-level raw/reference-eligibility evidence without implementing source scoring.

12. Ensure current V1 scoring and block creation reject V2 protocol records rather than mis-scoring them.

13. Keep the V2 battery non-default and not user-enabled.

14. Add exhaustive deterministic tests.

15. Preserve Stage 4, Stage 5, safety audio, navigation, scoring, norms, and current public Check-Up regressions.

## Scope boundary

This task may change:

- movement/check-up protocol types;
- movement registry entries for new V2 assessment movements;
- CheckUp battery factories;
- CheckUp orchestration/controller state;
- movement-specific setup state;
- chair V2 grader/controller;
- balance V2 multi-trial controller/grader;
- shoulder V2 side-specific controller/grader;
- protocol result metadata;
- local raw Check-Up serialization/normalization where required;
- narrow fail-closed V1 scoring/assessment eligibility checks;
- assessment instructions/preflight/setup copy;
- assessment voice cue definitions and local assets only if current architecture requires them;
- tests;
- the Stage 3D-B.2A remediation report.

This task must not change:

- current norm tables;
- current movement-age formulas;
- published reference transforms;
- percentile/reference calculations;
- current product bands;
- current suggested-focus algorithm;
- score snapshot schema/version;
- backend score/report schemas;
- Movement Profile result cards;
- Results/Progress/Home/Report redesign;
- profile exact-age/reference-sex collection;
- workout generation;
- exercise catalogue;
- training progression;
- Stage 4 safety policy;
- Stage 5 credit/schedule policy;
- optional-level visibility;
- public/default battery selection;
- dependencies;
- lockfiles;
- unrelated images/fonts/audio.

Do not perform opportunistic refactors.

## Non-negotiable legacy compatibility

### 1. Do not mutate legacy protocol semantics in place

The current V1 assessment movement IDs and result shapes are historical contracts.

If a V2 protocol materially changes:

- duration;
- attempt count;
- setup requirements;
- counted metric;
- selected side/leg;
- result structure;

prefer a new V2 movement/protocol ID rather than silently changing the meaning of an existing ID.

Examples of acceptable conceptual IDs:

- `chair-rise-30s-v2`
- `one-leg-balance-45s-v2`
- `active-shoulder-reach-v2`

Adapt names to current repository conventions.

Do not rename or delete legacy movement IDs.

### 2. V1 remains the default

The existing production/default battery must remain unchanged.

Add a separate factory or policy-driven battery selection, conceptually:

```ts
type CheckUpProtocolPolicyId =
  | 'legacy_movement_age_v1'
  | 'movement_profile_v2';

type CheckUpProtocolPolicy = {
  id: CheckUpProtocolPolicyId;
  version: number;
};
```

Requirements:

- current default resolves to V1;
- V2 must require an explicit internal/test call;
- no user setting;
- no backend/profile flag;
- no `__DEV__`-only accidental activation;
- no restored record can activate V2 for a new Check-Up;
- an in-progress Check-Up freezes its protocol policy at start.

Stage 3D-B.2E will later add the final build flag and QA harness.

### 3. V2 must not flow into V1 scoring

Add the narrowest fail-closed guard required so that a V2 raw Check-Up cannot be processed by:

- current V1 score inversion;
- current movement-age bands;
- current focus selection;
- current score snapshot creation;
- current MovementAssessment creation;
- current block creation;
- current report comparison.

Use a stable diagnostic such as:

- `unsupported_checkup_protocol`;
- `reference_engine_not_implemented`;
- or equivalent.

Do not change V1 scoring outputs.

## Working-tree safety

Before analysis or editing, run:

```bash
git status --short --untracked-files=all
git diff --name-only
git diff --stat
```

Record exact output in the remediation report.

Important current-tree cautions:

- The repository is heavily dirty with user-owned Stage 4, Stage 5, pose-renderer, native pose, auth, website, and diagnostics changes.
- The 88 Clara/Marcus safety MP3 assets and their manifests are intended changes.
- Do not delete, regenerate, rename, or omit those assets.
- Do not inspect or expose `.env` values.
- Do not expose ElevenLabs credentials.
- Do not modify or share font files.

Rules:

1. Treat every existing modified/untracked file as user-owned.

2. Inspect current diffs in every file this task may touch.

3. Do not revert, overwrite, reformat, move, or delete unrelated work.

4. Do not edit prior reports.

5. Do not use destructive Git commands.

6. Do not install packages.

7. Do not modify lockfiles.

8. Do not stage, commit, create a branch, or push.

9. If unrelated files change:
   - record them;
   - do not overwrite them;
   - continue only when task-owned edits remain safe and unambiguous;
   - otherwise stop production mutation and report the conflict.

## Step 1: Reconstruct the current assessment architecture

Before editing, inspect at minimum:

- src/movements/types.ts
- src/movements/registry.ts
- src/movements/index.ts
- src/movements/definitions/chairStand.ts
- src/movements/definitions/balanceLadder.ts
- src/movements/definitions/shoulderFlexion.ts
- src/movements/definitions/hingeReach.ts
- src/checkup/checkup.ts
- src/checkup/types.ts, if present
- src/checkup/checkupFlow.ts, if present
- src/assessment/sessionController.ts
- src/preflight/movementCameraReadiness.ts
- src/preflight/setupCopy.ts
- src/screens/CheckUpScreen.tsx
- App.tsx
- current movement/checkup serializers
- current audio/voice instruction architecture
- current Check-Up tests and replay fixtures
- current scoring/assessment eligibility boundaries.

Trace:

```text
battery selection
-> movement transition
-> protocol/setup input
-> camera preflight
-> instructions/practice
-> countdown
-> active measurement
-> interruption/retry
-> movement result
-> Check-Up record
-> scoring eligibility
```

Document:

- every current state;
- ambient clock usage;
- item timeout behavior;
- active hard cap;
- retry behavior;
- tracking-interruption behavior;
- item reset behavior;
- Check-Up resume behavior;
- movement-result serialization;
- movement-ID assumptions in scoring.

Do not edit until this trace is complete.

## Step 2: Add protocol-policy and version types

Add one canonical policy module or type boundary.

Conceptually:

```ts
const LEGACY_CHECKUP_PROTOCOL_POLICY = {
  id: 'legacy_movement_age_v1',
  version: 1,
} as const;

const MOVEMENT_PROFILE_V2_PROTOCOL_POLICY = {
  id: 'movement_profile_v2',
  version: 1,
} as const;
```

Requirements:

- policy selected explicitly at Check-Up creation;
- policy frozen in the Check-Up record;
- item results carry protocol ID/version;
- retry/resume retains policy;
- policy is JSON-safe;
- unknown/future policy fails closed;
- legacy records missing policy normalize to V1;
- no profile/backend field selects policy.

Add tests for normalization and immutability.

## Step 3: Add a separate Movement Profile V2 battery

Create a separate battery factory/list.

The V2 battery must contain:

1. V2 chair rise.
2. V2 one-leg balance.
3. V2 active shoulder reach.
4. Existing hinge reach as supporting evidence, unless current architecture requires a versioned wrapper.

Requirements:

- current V1 default battery remains byte-for-byte/semantically unchanged;
- V2 battery is not exported as default;
- TUG remains hidden;
- V2 headline movements are distinguishable from V1;
- ordering is deterministic;
- duplicate movement IDs fail tests;
- current Check-Up duration metadata reflects the V2 protocol estimate where the architecture stores it.

Add battery-integrity tests.

## Step 4: Add a reusable protocol-setup phase

The current camera preflight answers:

> Can the camera measure this movement?

V2 also needs a prior typed protocol-setup phase:

> Which setup/side/leg will this measurement use?

Add the narrowest reusable architecture, conceptually:

```ts
type AssessmentProtocolSetupState =
  | { kind: 'not_required' }
  | { kind: 'required'; movementId: string; fields: ... }
  | { kind: 'complete'; values: AssessmentProtocolSetupValues };
```

Requirements:

- separate from camera readiness;
- pure normalization;
- explicit user input;
- frozen for the attempt/result;
- no free-text medical data;
- JSON-safe;
- survives item retry;
- survives the current Check-Up resume boundary where supported;
- legacy movements require no setup state;
- direct controller callers cannot bypass required setup.

Support at minimum:

- chair setup confidence;
- balance standing leg;
- shoulder side;
- shoulder comfort confirmation if current design supports it narrowly.

Do not add a broad form-builder framework.

## Step 5: Prior selection and re-test defaults

Add pure helpers that can derive compatible prior selections from the most recent official Movement Profile V2 Check-Up:

- prior balance standing leg;
- prior shoulder side.

Requirements:

- V2 only;
- exact movement/protocol match;
- current user/current history only;
- no legacy movement-age inference;
- no profile field required in Stage 3D-B.2A;
- no remote activation authority;
- if no prior compatible selection:
  - balance requires explicit choice;
  - shoulder defaults visually to right but still records explicit confirmation/selection.

Store:

- selected value;
- selection source:
  - `prior_official_checkup`;
  - `user_selected`;
  - `right_default_confirmed`;
- whether changed from prior.

## Step 6: Implement V2 chair protocol

Create a V2 chair movement/controller without mutating legacy chair semantics.

### Setup state

Capture:

```ts
type ChairSetupConfidence =
  | 'confirmed_rough_knee_height'
  | 'uncertain';
```

Visible copy:

```text
Use a firm, stable dining chair without wheels.
Place it against a wall.
The seat should be roughly level with the crease behind your knees.

Is the seat roughly knee height?
```

Options:

- `Yes`
- `I'm not sure`

No tape-measure request.

### Practice repetition

Implement one camera-observed practice repetition before the official countdown.

Requirements:

- practice uses the V2 chair movement geometry;
- practice is not counted in the official result;
- practice must reach full upright and return safely to seated;
- tracking interruption resets the practice attempt;
- practice timeout routes to setup guidance rather than silently starting the official test;
- after a valid practice rep:
  - reset grader state;
  - clear rep count;
  - use a short settle dwell;
  - begin the official countdown.

Use explicit timestamps. Do not count a practice rep because it occurred close to the countdown boundary.

### Official count rule

Lock the V2 count rule:

- official timer: 30,000 ms;
- count one stand when full-upright criteria are achieved before or exactly at the deadline;
- do not require the user to return to seated before the deadline for that stand to count;
- do not count a halfway/partial rise at expiry;
- do not count any stand reaching full upright after the deadline;
- no partial final-rep bonus.

This V2 rule may differ from the source manual’s halfway-at-expiry convention. Record the deviation explicitly in protocol metadata.

### Technique/protocol metadata

Record at minimum:

- setup confidence;
- practice rep completed;
- official active duration;
- full stand count;
- count rule ID;
- final partial counted: false;
- hand push-off detected;
- tracking interruptions;
- camera count confidence;
- protocol-deviation reason codes;
- raw measurement validity.

Do not voice-critique hand use.

### Tracking behavior

Preserve raw evidence conservatively:

- tracking interruption must not fabricate reps;
- if the current chair controller can continue safely, mark tracking uncertainty;
- if the official count cannot remain trustworthy, complete as raw-uncertain or offer current retry behavior;
- do not pause the 30-second normative timer and pretend the protocol remained continuous.

### Chair tests

Add tests for:

- setup yes;
- setup uncertain;
- no setup bypass;
- practice required;
- practice not counted;
- practice tracking reset;
- official 30-second boundary;
- full stand at 29.999s counts;
- full stand at 30.000s follows one documented boundary rule;
- full stand after 30.000s does not count;
- halfway-at-expiry does not count;
- final full stand does not require re-seating before expiry;
- hand push-off flag;
- retry/reset;
- JSON round-trip;
- V1 chair unchanged.

## Step 7: Implement the V2 balance attempt state machine

Do not simulate three attempts as unrelated battery items.

Create one pure/testable movement-level multi-trial state machine or the narrowest reusable assessment-attempt controller.

Conceptual states:

```ts
type BalanceProtocolState =
  | 'setup'
  | 'instructions'
  | 'countdown'
  | 'active_trial'
  | 'trial_result'
  | 'rest'
  | 'complete'
  | 'setup_issue'
  | 'aborted';
```

Adapt to the current controller architecture.

### Setup

Capture:

- selected standing leg: `left` or `right`;
- selection source;
- changed-from-prior flag;
- firm/dry surface confirmation if current setup flow supports it;
- support-within-reach confirmation if current setup flow supports it.

The standing leg is the leg that remains on the floor.

The opposite leg is raised.

Do not silently accept the wrong standing leg.

### Trial rules

Each valid trial:

- maximum 45,000 ms;
- eyes open;
- arms crossed;
- selected standing leg enforced;
- raised foot near the stance ankle without contact;
- timer begins when the raised foot leaves the floor and the valid stance is established;
- timer ends when:
  - 45 seconds elapse;
  - raised foot touches the floor;
  - raised foot contacts the stance leg if detectable;
  - stance foot steps/moves/rotates beyond the current conservative rule;
  - arms uncross when reliably detectable;
  - support contact is user-reported/detectable;
  - user stops;
  - protocol-invalid tracking occurs.

Do not invent detection confidence the camera cannot provide.

Store what was:

- detected;
- user-triggered;
- unknown.

### Attempt rules

- Maximum valid attempts: 3.
- Best valid attempt is the raw score.
- If valid attempt 1 reaches 45 seconds:
  - complete section;
  - no further rest/attempt.
- Otherwise:
  - enter rest;
  - offer another attempt.
- Same after valid attempt 2.
- After valid attempt 3:
  - complete.
- User may choose `Use this result` after a non-ceiling valid attempt:
  - preserve best valid result;
  - mark `user_declined_remaining`;
  - mark reference protocol incomplete for future scoring.
- A tracking-invalid trial:
  - does not increment valid-attempt count;
  - is retained in attempt history;
  - consumes one automatic retry allowance for the balance section;
  - routes through setup reset/countdown.
- After the automatic retry allowance is already used:
  - do not auto-loop;
  - if at least one valid trial exists, allow raw-only completion or explicit retake of the whole movement;
  - if no valid trial exists, return no measurement/retake required.
- Do not count invalid trial duration in the best result.

### Rest

- Default rest: 60,000 ms.
- `I'm ready` becomes available at 30,000 ms.
- Before 30 seconds, the next valid attempt cannot start.
- At 60 seconds, the user may proceed through the existing voice-first transition.
- `Use this result` remains available after a valid attempt.
- Rest uses explicit monotonic timestamps.
- App backgrounding must not create negative or skipped rest.

### Hard cap

The current generic 180-second active hard cap is incompatible with adaptive best-of-three.

Add a movement-specific total protocol cap sufficient for:

- three valid 45-second trials;
- two 60-second rests;
- one invalid automatic retry;
- countdown/reset overhead.

Recommended V2 balance section hard cap:

```text
6 minutes from first trial countdown to protocol completion
```

If the cap is exceeded:

- preserve best valid raw result if one exists;
- mark protocol incomplete;
- otherwise no measurement;
- do not fabricate a full reference protocol.

### Result shape

Conceptually:

```ts
type BalanceTrialResult = {
  trialId: string;
  sequenceIndex: number;
  validAttemptNumber?: 1 | 2 | 3;
  status:
    | 'valid'
    | 'invalid_tracking'
    | 'invalid_setup'
    | 'user_stopped'
    | 'aborted';
  durationMs: number;
  terminationReason: string;
  trackingInterruptions: number;
  armsPositionStatus?: string;
};

type OneLegBalanceV2Result = {
  protocolId: string;
  protocolVersion: number;
  standingLeg: 'left' | 'right';
  selectionSource: string;
  changedFromPrior: boolean;
  attempts: readonly BalanceTrialResult[];
  validAttemptCount: number;
  bestValidDurationMs?: number;
  reachedCeiling: boolean;
  automaticRetryUsed: boolean;
  completionReason:
    | 'ceiling_reached'
    | 'three_valid_attempts'
    | 'user_declined_remaining'
    | 'protocol_hard_cap'
    | 'no_valid_measurement'
    | 'aborted';
  rawMeasurementValid: boolean;
  protocolCompleteForReference: boolean;
  protocolDeviationReasons: readonly string[];
};
```

Adapt to repository types.

### Background/interruption behavior

- Backgrounding during an active trial invalidates that trial.
- Do not resume an active normative timer from stale app state.
- Completed valid attempts remain.
- Return through setup/countdown.
- Backgrounding during rest may recompute remaining rest from an explicit deadline if current architecture safely supports it; otherwise restart rest conservatively.
- Do not silently skip the 30-second minimum.

### Balance tests

Add exhaustive deterministic tests for:

- standing-leg selection required;
- prior leg default;
- changed leg metadata;
- wrong leg does not start;
- 45-second boundary;
- first-trial ceiling early completion;
- second-trial ceiling;
- three valid attempts;
- best valid result;
- rest 29,999 ms cannot continue;
- rest 30,000 ms can continue;
- rest 60,000 ms transition;
- user declines after attempt 1;
- user declines after attempt 2;
- invalid tracking does not consume attempt;
- one auto retry;
- second invalid does not loop;
- no valid measurement;
- support/user stop termination;
- app background invalidation;
- hard cap;
- deterministic IDs/timestamps;
- JSON round-trip;
- V1 balance ladder unchanged.

## Step 8: Implement V2 active shoulder reach

Create a V2 shoulder movement/controller without mutating legacy shoulder semantics.

### Setup

Capture:

- selected side: `left` or `right`;
- prior compatible side if available;
- default right only when no prior exists;
- explicit user confirmation;
- changed-from-prior flag;
- selected side comfort:
  - comfortable;
  - choose other side;
  - neither side comfortable / skip.

Copy direction:

```text
Which shoulder would you like to test?
Right
Left
```

Then:

```text
Does this side feel comfortable to raise today?
```

Keep wording wellness-side and non-medical.

### Preflight

- side view required;
- selected side closest to camera;
- selected near-side shoulder/hip chain required;
- far-side chain must not substitute silently;
- current 500 ms readiness dwell remains unless V2 needs a documented movement-specific value;
- side mismatch routes to calm setup guidance.

### Active attempt

- standing upright;
- selected arm moves forward in the sagittal plane;
- elbow as straight as comfortable;
- one smooth active raise;
- brief peak/pause;
- 9-second capture window may remain;
- at least 3 seconds of reliable tracking;
- score only selected side;
- store raw peak active flexion angle.

### Validity and retry

A first attempt is invalid when:

- selected side is not reliably visible;
- tracking is insufficient;
- side geometry is inconsistent;
- substantial torso compensation violates the current conservative geometry rule.

Requirements:

- reuse current shoulder validity/torso geometry when it exists;
- do not introduce a clinical threshold presented as validated;
- keep any new geometry threshold configurable and explicitly marked for device validation;
- one guided retry only;
- second invalid attempt returns no valid measurement;
- a discomfort-limited but technically complete attempt remains raw-valid with `painLimited: true`;
- changed side remains raw-valid but later longitudinal comparison must be suppressed.

### Result shape

Record at minimum:

- protocol ID/version;
- selected side;
- selection source;
- changed-from-prior;
- attempt history;
- valid attempt count;
- peak angle;
- reliable tracking duration;
- tracking interruptions;
- torso compensation status;
- pain-limited status;
- completion reason;
- raw measurement validity;
- protocol deviation reasons.

### Shoulder tests

Add tests for:

- right default;
- prior side default;
- left selection;
- changed side metadata;
- selected-side chain only;
- side mismatch;
- one valid attempt completes;
- first invalid -> one retry;
- second invalid -> no measurement;
- tracking invalid;
- torso compensation invalid;
- pain-limited raw-valid;
- 3-second reliable tracking boundary;
- 9-second window;
- item retry/reset;
- JSON round-trip;
- V1 shoulder unchanged.

## Step 9: Add protocol-level evidence states

Do not implement published reference calculations.

Add protocol-level evidence metadata that later Stage 3D-B.2B can combine with:

- age;
- reference sex;
- source availability;
- source transforms.

Conceptually:

```ts
type ProtocolEvidenceStatus =
  | 'reference_protocol_complete'
  | 'raw_only_setup_uncertain'
  | 'raw_only_protocol_incomplete'
  | 'raw_only_tracking_uncertain'
  | 'raw_only_pain_limited'
  | 'invalid_measurement';
```

Rules:

### Chair

- confirmed setup, practice complete, no hand use, trustworthy tracking -> `reference_protocol_complete`;
- setup uncertain -> `raw_only_setup_uncertain`;
- hand push-off -> `raw_only_protocol_incomplete`;
- uncertain count/tracking -> `raw_only_tracking_uncertain`;
- no valid count -> `invalid_measurement`.

### Balance

- 45-second ceiling on a valid trial or three valid attempts under the protocol -> `reference_protocol_complete`;
- user declines remaining valid attempts -> `raw_only_protocol_incomplete`;
- tracking uncertainty with retained raw best -> `raw_only_tracking_uncertain`;
- no valid trial -> `invalid_measurement`.

### Shoulder

- valid selected-side capture without pain limitation or major protocol deviation -> `reference_protocol_complete`;
- pain-limited complete capture -> `raw_only_pain_limited`;
- retained uncertain capture -> `raw_only_tracking_uncertain`;
- no valid capture -> `invalid_measurement`.

Do not let the enum imply that published source/profile eligibility already passes.

## Step 10: Add V2 raw Check-Up completeness helpers

Add pure helpers for V2 raw evidence.

Requirements:

- valid chair raw measurement;
- valid balance raw measurement;
- valid shoulder raw measurement;
- hinge remains supporting and does not substitute for missing shoulder raw evidence;
- setup/reference ineligibility does not invalidate a raw measurement;
- invalid headline domain means V2 raw Check-Up incomplete;
- no V1 age score is created.

Conceptually:

```ts
type MovementProfileV2RawCompleteness = {
  complete: boolean;
  chairValid: boolean;
  balanceValid: boolean;
  shoulderValid: boolean;
  missingDomains: readonly ('strength_power' | 'balance_stability' | 'mobility_flexibility')[];
};
```

Add tests.

## Step 11: Local raw result serialization and normalization

Ensure V2 raw protocol records are:

- JSON-safe;
- deterministic;
- bounded;
- no video/frames/landmark arrays;
- no free-text health notes;
- no auth data;
- no arbitrary provider payloads.

Normalize:

- unknown protocol ID;
- unsupported future version;
- malformed attempts;
- duplicate trial IDs;
- impossible valid-attempt numbers;
- duration outside 0–45,000 ms;
- best result inconsistent with attempts;
- invalid selected side/leg;
- invalid completion reason.

Fail closed.

Do not add a backend schema migration in Stage 3D-B.2A.

If current raw Check-Up JSON sync automatically preserves bounded new fields, verify it.

If current sanitizer requires explicit fields, add only the narrow protocol metadata required for raw Check-Up preservation and document that full snapshot/sync migration remains Stage 3D-B.2C.

## Step 12: V1 scoring and block-creation containment

Add focused guards and tests.

A Check-Up using `movement_profile_v2` must not:

- pass current `validateCheckUpForScoring`;
- enter current `scoreCheckUp`;
- create current V1 score snapshot;
- pass current Stage 3B official evidence as a V1 scored assessment;
- create a MovementBlock;
- create a block report;
- produce movement-age UI output.

Return stable reason metadata.

Do not change any V1 score output, norm anchor, band, focus, snapshot, or report behavior.

## Step 13: Instruction text, voice, and accessibility

Add canonical protocol instruction text for:

- chair setup confirmation;
- chair practice;
- chair official start;
- balance leg selection;
- balance setup;
- attempt number;
- rest;
- `I'm ready`;
- `Use this result`;
- invalid tracking retry;
- balance completion;
- shoulder side selection;
- shoulder comfort;
- shoulder side-near-camera setup;
- guided shoulder retry.

Requirements:

- visible text fallback;
- no diagnosis/risk language;
- no “failed” wording;
- accessible labels for choices/buttons;
- voice and text use one canonical source where current architecture supports it;
- no internal protocol IDs shown.

### Conditional bundled-audio requirement

Inspect the current Check-Up voice system.

If new dedicated bundled audio cues are required for voice-first parity:

- add a narrowly scoped assessment-V2 audio group to the existing generator;
- generate only the new missing cues for Clara and Marcus;
- do not regenerate safety audio or unrelated lines;
- use the configured provider/model/settings;
- do not expose credentials;
- add integrity/static mapping tests;
- update the non-network audio verifier;
- run Expo export.

If the current architecture already supports these prompts without new binary assets:

- do not generate audio;
- document why.

Do not accept silent voice failure as complete parity.

## Step 14: Timing and protocol observability

Add bounded protocol diagnostics suitable for later physical-device validation.

Record only:

- protocol ID/version;
- movement ID;
- setup state;
- selected side/leg;
- attempt number;
- state transition reason;
- active duration;
- rest duration;
- termination reason;
- tracking interruption count;
- retry usage;
- raw measurement validity;
- protocol evidence status.

Do not record:

- raw frames;
- landmarks;
- video;
- free-text symptoms;
- auth data;
- full profile payloads.

Pure state machines must remain side-effect free.

## Step 15: State-machine invariants

Prove at minimum:

1. Equal explicit inputs produce equal state transitions.

2. No active timer depends on hidden wall-clock access when timestamps are supplied.

3. Practice evidence cannot enter official chair count.

4. No partial chair rise is counted at expiry.

5. Balance has at most three valid attempts.

6. Invalid balance attempts do not increment valid-attempt count.

7. Balance automatic retry is bounded.

8. Balance rest minimum cannot be bypassed.

9. Balance best result is derived from valid attempts only.

10. Shoulder has at most two attempts.

11. Shoulder second invalid result cannot become valid by fallback.

12. Selected leg/side is frozen for an active attempt.

13. App background cannot resume a stale active normative timer.

14. Item retry resets active grader/timer state without changing the Check-Up protocol policy.

15. V2 raw result cannot enter V1 scoring.

16. V1 default flow is unchanged.

## Step 16: Required automated test matrix

### A. Protocol policy

- legacy default;
- explicit V2;
- unknown policy;
- future version;
- immutable through Check-Up;
- legacy record backfill.

### B. Protocol setup

- chair setup;
- balance leg;
- shoulder side;
- direct-call bypass;
- prior compatible selection;
- changed selection;
- retry/resume.

### C. Chair V2

- all setup/practice/counting/tracking boundaries listed above.

### D. Balance V2

- all attempt/rest/retry/termination/hard-cap cases listed above.

### E. Shoulder V2

- all side/retry/geometry/tracking cases listed above.

### F. Raw evidence

- evidence status mapping;
- raw completeness;
- malformed normalization;
- JSON round-trip.

### G. Legacy containment

- V1 battery unchanged;
- V1 score outputs unchanged;
- V2 rejected by V1 scoring;
- no V2 block/report.

### H. App/controller integration

- movement transitions;
- setup -> preflight -> instructions -> measurement;
- item retry;
- skip/incomplete;
- app background/foreground;
- Check-Up completion.

### I. Voice/text

- visible fallback;
- canonical strings;
- audio parity if new assets are required.

### J. Regression

- Stage 2A.1 readiness/tracking contracts;
- Stage 3B/3C/D protections;
- Stage 4 closure;
- Stage 5H lifecycle;
- safety audio;
- navigation;
- app/website TypeScript boundaries.

## Test-quality requirements

Tests must:

- exercise real production state machines/controllers;
- use deterministic timestamps;
- assert state before and after;
- assert raw result metadata;
- assert no hidden attempt consumption;
- assert reset/background behavior;
- fail if V2 reaches V1 scoring;
- fail if V1 behavior changes;
- derive movement definitions from the real registry.

Tests must not:

- mock every layer;
- assert only helper calls;
- depend on real time/sleeps;
- use actual camera hardware;
- invent percentile outputs;
- modify norms;
- add reference tables;
- enable V2 publicly;
- install packages;
- use network except conditional existing audio generation.

## Validation commands

Run targeted tests for:

- movement registry/battery;
- protocol policy/setup;
- chair V2;
- balance V2;
- shoulder V2;
- CheckUp controller;
- preflight readiness;
- scoring containment;
- raw serialization;
- audio if changed;
- Stage 2A.1;
- Stage 3B/3C/D;
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

Because this task changes assessment code and may add local audio assets, also run:

```bash
rm -rf /tmp/hale-stage3db2a-export
npx --no-install expo export --platform all --output-dir /tmp/hale-stage3db2a-export
rc=$?
rm -rf /tmp/hale-stage3db2a-export
exit $rc
```

Do not install dependencies.

Record:

- exact targeted command;
- targeted suite/test counts;
- full suite/test counts;
- audio verification counts;
- app typecheck;
- website typecheck;
- Expo config;
- Expo export;
- git diff check;
- Watchman warning;
- Jest open-handle notice;
- Sentry warning;
- any new warnings;
- any provider-call count if new assessment audio was generated;
- whether validation changed files.

## Manual source verification after tests

Retrace:

### V1

```text
default Check-Up
-> legacy battery
-> legacy movement results
-> V1 scoring/snapshot
```

Confirm unchanged.

### V2 chair

```text
protocol setup
-> practice rep
-> reset
-> 30-second full-stand count
-> raw protocol metadata
```

### V2 balance

```text
standing-leg setup
-> valid trial
-> rest / stop / next trial
-> best valid result
-> bounded retry
-> raw protocol metadata
```

### V2 shoulder

```text
side selection
-> selected-side preflight
-> one attempt
-> guided retry if invalid
-> raw protocol metadata
```

### Containment

Confirm V2 does not enter current score/block/report paths.

## Remediation report

Create exactly one new report:

```text
docs/audits/HALE_LOGIC_REMEDIATION_STAGE_3D_B_2A.md
```

Do not edit prior reports.

The report must contain:

1. Scope.
2. Product decisions implemented.
3. Pilot-skipped accepted-risk statement.
4. Initial Git status.
5. Prior assessment architecture.
6. Protocol-policy architecture.
7. V1 compatibility.
8. V2 battery.
9. Protocol-setup architecture.
10. Prior selection/re-test default behavior.
11. Chair V2 protocol.
12. Chair practice/count boundary.
13. Chair raw metadata/evidence state.
14. Balance V2 state machine.
15. Balance attempt/rest/retry behavior.
16. Balance raw result/evidence state.
17. Shoulder V2 protocol.
18. Shoulder side/retry behavior.
19. Shoulder raw result/evidence state.
20. Raw Check-Up completeness.
21. Serialization/normalization.
22. V1 scoring/block containment.
23. Instruction/voice/accessibility behavior.
24. Observability/payload safety.
25. Files changed.
26. New movement/protocol IDs.
27. Tests added/changed.
28. Exact targeted validation.
29. Exact full validation.
30. Audio-generation/integrity result.
31. App/website typechecks.
32. Expo config/export.
33. Stage 2A.1/3/4/5 regression verification.
34. Remaining Stage 3D-B implementation work.
35. Whether Stage 3D-B.2B is unblocked.
36. Initial and final Git status.
37. Complete files-changed inventory.
38. Concurrent external changes.
39. Confirmation that no package install, lockfile change, commit, staging, branch, or push occurred.

## Required invariant outcomes

After Stage 3D-B.2A:

1. V1 remains the default Check-Up.
2. Legacy movement IDs retain their semantics.
3. V2 has an explicit frozen protocol policy.
4. V2 has a separate battery.
5. Chair setup confidence is captured.
6. Chair practice is required and excluded from the score.
7. Chair runs exactly 30 seconds.
8. Only full upright stands at/before the deadline count.
9. Partial final rises do not count.
10. Chair hand push-off is recorded.
11. Balance uses a 45-second ceiling.
12. Balance uses adaptive best-of-three valid attempts.
13. First-trial ceiling stops the section.
14. Best valid balance trial is the raw result.
15. Invalid tracking trial does not consume a valid attempt.
16. Balance auto retry is bounded to one.
17. Balance rest requires at least 30 seconds.
18. Balance default rest is 60 seconds.
19. User can use the current best result and stop remaining trials.
20. Incomplete attempt protocol is marked raw-only for later reference logic.
21. Balance standing leg is selected and stored.
22. Changed standing leg is recorded.
23. Shoulder side is selected and stored.
24. Shoulder defaults to right only when no prior compatible side exists.
25. Shoulder uses selected-side geometry only.
26. Shoulder allows one invalid-attempt retry.
27. Shoulder second invalid attempt does not produce a valid measurement.
28. Pain-limited shoulder capture is identifiable.
29. Protocol metadata is JSON-safe.
30. V2 raw completeness requires chair, balance, and shoulder raw measurements.
31. Hinge cannot substitute for a missing shoulder result.
32. V2 cannot enter V1 scoring.
33. V2 cannot create a V1 MovementBlock/report.
34. V1 scoring outputs remain unchanged.
35. App background cannot continue a stale active trial.
36. Equal explicit inputs are deterministic.
37. No public/user flag enables V2.
38. Stage 4/5 contracts remain.
39. Safety audio remains valid.
40. No norms/reference/UI claims are implemented prematurely.

## Acceptance criteria

Do not mark Stage 3D-B.2A complete unless:

1. Protocol policy and V2 battery exist.

2. V1 remains default and unchanged.

3. Protocol setup is typed and enforced.

4. Chair practice/count rules are implemented and tested.

5. Balance adaptive best-of-three is implemented and tested.

6. Balance rest/retry/decline behavior is implemented and tested.

7. Shoulder side/retry behavior is implemented and tested.

8. Raw protocol metadata and completeness are implemented.

9. V2 raw results fail closed at V1 scoring/block boundaries.

10. Background/reset behavior is conservative.

11. Targeted tests pass.

12. Full Jest passes.

13. `npm run verify:audio` passes.

14. App typecheck passes.

15. Website typecheck passes.

16. Expo config passes.

17. Expo export passes.

18. `git diff --check` passes.

19. No new warning is introduced without explanation.

20. No unrelated user work is reverted or overwritten.

21. No package install or lockfile change occurs.

22. No commit, staging, branch, or push occurs.

If the current architecture cannot provide voice/text parity for required new protocol prompts without new local assets, generate and verify those assets in this task or mark the task blocked. Do not silently ship text-only protocol prompts in a voice-first flow.

## Stage decisions

At the end of the report, state exactly one:

- `STAGE 3D-B.2A COMPLETE`
- `STAGE 3D-B.2A BLOCKED`

Also state one for each:

- `V2 CHAIR PROTOCOL IMPLEMENTED`
- `V2 CHAIR PROTOCOL BLOCKED`

- `V2 BALANCE PROTOCOL IMPLEMENTED`
- `V2 BALANCE PROTOCOL BLOCKED`

- `V2 SHOULDER PROTOCOL IMPLEMENTED`
- `V2 SHOULDER PROTOCOL BLOCKED`

Also state exactly one:

- `STAGE 3D-B.2B UNBLOCKED`
- `STAGE 3D-B.2B BLOCKED`

Use `STAGE 3D-B.2B UNBLOCKED` only if the V2 raw protocol/result contracts are complete, deterministic, and safely contained from V1 scoring.

Also state:

- `MOVEMENT PROFILE V2 NOT USER-ENABLED`
- `IMPLEMENTATION REMAINS INTERNAL`
- `PRE-IMPLEMENTATION PILOT SKIPPED BY PRODUCT OWNER`
- `CHAIR REFERENCE TRANSFORM STILL REQUIRES APPROVED USE`
- `STAGE 4 REMEDIATION COMPLETE`
- `STAGE 5 REMEDIATION COMPLETE`
- `OVERALL BETA RELEASE STILL BLOCKED`
- `PHYSICAL DEVICE VALIDATION REQUIRED`

Do not declare Hale beta-ready.

## Final Codex response

Return a concise summary containing:

- Remediation report path.
- Whether production code changed.
- Protocol-policy architecture.
- V1 default/compatibility result.
- V2 battery movement IDs.
- Chair setup/practice/count behavior.
- Chair protocol evidence behavior.
- Balance state-machine behavior.
- Balance attempt/rest/retry counts.
- Balance leg persistence behavior.
- Shoulder side/retry behavior.
- Raw completeness behavior.
- V1 scoring/block containment.
- Serialization/restore behavior.
- Voice/text/audio result.
- Files changed.
- Tests added/changed.
- Targeted validation result.
- Audio verification result.
- Full-suite result.
- App typecheck.
- Website typecheck.
- Expo config.
- Expo export.
- `git diff --check`.
- Confirmation that Stage 2A.1, Stage 3B/3C/3D, Stage 4, Stage 5, navigation, TypeScript boundaries, optional containment, progression policies, and safety audio remain.
- Remaining Stage 3D-B work.
- `STAGE 3D-B.2A COMPLETE` or blocked.
- Chair verdict.
- Balance verdict.
- Shoulder verdict.
- `STAGE 3D-B.2B UNBLOCKED` or blocked.
- `MOVEMENT PROFILE V2 NOT USER-ENABLED`.
- `IMPLEMENTATION REMAINS INTERNAL`.
- `PRE-IMPLEMENTATION PILOT SKIPPED BY PRODUCT OWNER`.
- `CHAIR REFERENCE TRANSFORM STILL REQUIRES APPROVED USE`.
- `OVERALL BETA RELEASE STILL BLOCKED`.
- `PHYSICAL DEVICE VALIDATION REQUIRED`.
- Initial and final Git status.
- Complete files-changed inventory.
- Any concurrent external changes.
- Confirmation that no package install, lockfile change, staging, commit, branch, or push occurred.
