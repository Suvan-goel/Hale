You are implementing Stage 4D-R of Pearl’s production-readiness work:

BAND/DOOR-ANCHOR SAFETY CUEING, CATALOGUE-WIDE STOP-RULE STANDARDISATION, VOICE/TEXT PARITY, AND SESSION-PATH SAFETY GUIDANCE

“Stage 4D-R” is the second remediation batch arising from the post-Stage-5 Stage 4 Remaining-Findings Verification.

This is a focused production-code and content-safety remediation task.

Do not begin Stage 4E-R optional-level beta policy, Stage 4F-R movement-specific progression review, Stage 4G-R remaining content/property tests, Stage 3D-B, physical-device validation, app-store release work, or unrelated UI/product work in this task.

## Required prior reading

Read these reports in full before changing code:

- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_4_REMAINING.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4C_R.md
- docs/audits/PEARL_LOGIC_AUDIT_STAGE_4.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4A.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4B.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5H.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5E.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_5F.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5G_1.md

Also read the relevant upstream copy and safety contracts:

- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_A.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3B.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_2A_1.md

Treat the current working tree as the source of truth. Re-verify every relevant runtime path before editing because report line numbers and implementation details may no longer be exact.

## Verified baseline entering Stage 4D-R

Stage 4C-R is complete.

It introduced and verified:

- canonical `MovementCapabilityProfile`;
- floor-transfer confirmation separate from `floor_space`;
- step-up environment confirmation with:
  - low stable step;
  - fixed support;
  - clear dry area;
  - phone outside the stepping path;
- supported single-leg balance confidence;
- movement-capability profile sync/restore;
- movement-capability plan snapshots/fingerprints;
- stale unstarted-plan invalidation;
- explicit readiness/discomfort context for Explore and manual practice;
- Stage 5E discomfort filtering across generated, Explore, and manual starts;
- fail-closed direct planning helpers.

Stage 4C-R closed:

- F4R-001;
- F4R-002;
- F4R-006;
- F4R-007.

Stage 4C-R validation passed:

- full Jest: 97 suites / 781 tests;
- app typecheck;
- website typecheck;
- Expo public config;
- `git diff --check`.

Stage 5 remains complete and dynamic workout generation remains software-ready for controlled beta.

The exercise catalogue remains software/content-blocked until remaining Stage 4 safety/content work is complete.

## Findings addressed by Stage 4D-R

### F4R-003 — P1

Core band and door-anchor exercises lack an adequate unsupervised-home safety cue standard.

Affected core exercises include at minimum:

- `seated-band-row`;
- `standing-band-row`;
- `band-pull-apart`;
- `overhead-press-band`.

Current equipment gating is materially stronger than the original audit:

- long band is explicit;
- door anchor is separately required;
- no-band upper-pull is skipped honestly;
- canonical equipment is authoritative.

However, equipment presence does not prove safe use.

Current gaps include:

- checking a band for tears, cracks, fraying, or damage;
- secure grip;
- keeping face and eyes outside the recoil path;
- controlled return;
- never releasing a stretched band;
- correct setup for seated-foot anchoring where used;
- correct door-anchor setup where used;
- fully closed and secure door;
- initial low-tension test;
- avoiding standing in the door’s opening path;
- anchor-height/setup expectations;
- stopping if the band, anchor, door, grip, or stance shifts.

Some active band exercise definitions have empty or incomplete spoken instruction arrays.

### F4R-004 — P1

The catalogue lacks one coherent text/spoken safety and stop-rule standard.

Gaps identified in Stage 4R include:

- sharp or increasing pain;
- dizziness or light-headedness;
- unusual unsteadiness;
- unstable equipment/support/surface;
- breath holding;
- unsafe obstacle/phone placement;
- floor-transition discomfort;
- stair/step instability;
- band recoil/anchor problems;
- safe range limits;
- camera/tracking loss;
- what to do when a movement cannot be completed safely.

The app has useful scattered setup notes and general Learn content, but safety-critical guidance must be available in the actual session path.

## Findings explicitly deferred

This task must not attempt to close:

### F4R-005

Loaded optional-level selection and load-specific safety policy.

Current loaded levels remain optional/hidden/gated.

Do not enable them.

### F4R-008

Movement-specific progression prerequisites and domain-review thresholds.

### F4R-009

Mobility collection naming/rotation polish beyond cue parity.

### F4R-010

Final minimal-equipment product-positioning copy.

Do not broaden Stage 4D-R into all remaining Stage 4 work.

## Primary objective

Implement one structured, reusable, testable safety-cue system so that:

1. Every V1-core exercise has an explicit safety-cue profile.

2. Safety-critical guidance appears in the actual session path.

3. Text and voice derive from the same canonical cue definitions.

4. Global stop rules are delivered without being repeated excessively.

5. Exercise-specific setup cues appear before movement begins.

6. Tracking loss and unsafe setup have calm recovery guidance.

7. Band and door-anchor exercises receive a complete safety cue pack.

8. Floor, step-up, balance, support-dependent, and comfortable-range exercises receive the correct hazard-specific cues.

9. Explore/manual practice displays and speaks the same relevant safety guidance as generated sessions.

10. Missing required safety cues fail closed in development/tests.

11. Currently optional/high-risk levels remain hidden or gated.

12. Stage 4A–5H contracts remain intact.

## Scope boundary

This task may change:

- exercise cue/safety metadata types;
- canonical cue definitions;
- cue-resolution helpers;
- exercise definitions/ladders only to attach approved cue metadata;
- session-plan cue metadata;
- session preview instructions;
- training player cue sequencing;
- tracking-interruption guidance;
- Explore detail/manual-practice cue presentation;
- narrow accessibility/replay controls;
- copy guardrails;
- tests;
- the Stage 4D-R remediation report.

This task must not change:

- exercise selection;
- exercise registry count;
- ladder progression thresholds;
- movement-capability gates;
- canonical equipment;
- main-plan/work/focus/schedule credit;
- progression authority/idempotency;
- four-week scheduling;
- scoring;
- norms;
- Check-Up measurement;
- exact/near focus;
- optional-level visibility policy except preserving current hidden/gated status;
- broad visual design;
- dependencies;
- binary audio assets;
- app navigation.

Do not perform opportunistic refactors.

## Non-negotiable cue-system principles

### 1. One canonical cue vocabulary

Create one typed, reusable cue vocabulary.

Conceptually:

```ts
type ExerciseSafetyCueId =
  | 'global_stop_sharp_or_increasing_pain'
  | 'global_stop_dizzy_or_lightheaded'
  | 'global_breathe_normally'
  | 'global_clear_space'
  | 'global_stop_if_support_moves'
  | 'global_pause_if_tracking_lost'
  | 'support_use_sturdy_support'
  | 'support_keep_support_within_reach'
  | 'floor_clear_space'
  | 'floor_use_support_for_transfer'
  | 'floor_stop_if_transfer_unsteady'
  | 'step_use_low_stable_step'
  | 'step_fixed_support_nearby'
  | 'step_clear_dry_area'
  | 'step_phone_out_of_path'
  | 'step_controlled_return'
  | 'band_inspect_before_use'
  | 'band_secure_grip'
  | 'band_face_and_eyes_clear'
  | 'band_controlled_return'
  | 'band_never_release_under_tension'
  | 'band_stop_if_slips_or_shifts'
  | 'door_anchor_follow_manufacturer_setup'
  | 'door_anchor_fully_closed'
  | 'door_anchor_test_light_tension'
  | 'door_anchor_stay_out_of_door_path'
  | 'comfortable_range_only'
  | 'balance_stop_if_unsteady'
  | 'balance_support_within_reach'
  | 'tracking_pause_and_reset'
  | ...;
```

Adapt names to the repository.

Requirements:

- stable IDs;
- no free-form cue strings scattered through business logic;
- local/offline availability;
- no network fetch;
- JSON-safe if plan metadata stores cue IDs;
- no user health data;
- no medical diagnosis;
- easy integrity testing.

### 2. Text and voice share one source

Each cue definition must provide canonical user-facing text that can be used by:

- preview/setup text;
- Explore details;
- manual-practice details;
- session voice guidance;
- tracking-recovery guidance.

Do not maintain contradictory independent voice and text strings.

If the current voice system uses text-to-speech, route the canonical text through it.

If the current voice system uses local keys or pre-bundled clips:

- map the cue IDs through the existing voice abstraction;
- preserve a text/TTS fallback where already supported;
- do not add fake binary audio files;
- if production cannot speak a required cue without missing assets, mark Stage 4D-R blocked rather than claiming completion.

### 3. Cue tiers and timing

Use explicit delivery tiers:

#### Session-global cues

Delivered once per started session, not before every exercise.

At minimum:

- clear the area;
- stop for sharp or increasing discomfort;
- pause and use support if dizzy/light-headed/unsteady;
- breathe normally rather than holding breath.

#### Exercise setup cues

Delivered before countdown/active movement.

Examples:

- sturdy support;
- floor transition;
- low stable step;
- band inspection;
- door-anchor setup.

#### Active technique cues

Short movement-specific cues during the first set or active phase.

Examples:

- move with control;
- comfortable range;
- controlled band return;
- controlled step down.

#### Interruption/recovery cues

Delivered when:

- tracking is lost;
- framing becomes invalid;
- user pauses;
- setup is no longer valid.

#### Repeated-set cue policy

Do not replay the full global/setup pack before every set.

Use short reminders on later sets.

Tests must prove deduplication.

### 4. Global stop-rule wording

Use calm, non-medical wording.

Approved intent:

- Stop the movement if you feel sharp or increasing pain.
- Pause and use support, or sit down, if you feel dizzy, light-headed, or unusually unsteady.
- Stop if the chair, step, band, anchor, floor, or other support shifts or feels unstable.
- Breathe normally; do not hold your breath.
- If tracking is lost, pause and reset rather than continuing to chase the camera.

Do not claim:

- diagnosis;
- treatment;
- medical clearance;
- injury identification;
- fall-risk assessment.

Do not use fear-heavy language.

### 5. Safety action must be available

Verify the session player already lets the user:

- pause;
- stop/exit;
- skip;
- replay or revisit instructions where supported.

If a safety-critical cue tells the user to stop but there is no practical stop/exit action:

- add the smallest accessible action using the existing session-player architecture;
- do not redesign the player;
- record the exact change.

Do not allow a safety stop to count as a completed item unless Stage 5A work evidence already says real work was completed.

### 6. No hidden cue bypass

Cue resolution must work for:

- generated main-plan sessions;
- short sessions;
- restart sessions;
- supporting sessions;
- Explore presets;
- manual ladder practice.

A direct production helper call must still produce the required cue IDs.

Do not rely only on one screen adding copy.

## Approved catalogue-wide minimum cue standard

Each V1-core exercise must have an explicit cue profile.

### Required for every core exercise

- one clear setup/instruction cue;
- global stop-rule coverage through session-global cues;
- breathing guidance when exertion or prolonged holding makes it relevant;
- comfortable-range or control cue where relevant;
- tracking-recovery behavior if camera-assisted/measured;
- text-visible fallback when voice is unavailable.

### Required for support-dependent exercises

- use a sturdy, non-moving support;
- keep support within easy reach;
- stop if support shifts;
- do not lean on unstable furniture.

Affected exercises include current support-tagged balance, squat, heel/toe raise, step, mobility, and push variants discovered in the catalogue.

### Required for floor exercises

- clear floor area;
- use a sturdy chair/support for getting down/up if needed;
- take the transition slowly;
- stop if dizzy, uncomfortable, or unsteady during transition;
- preserve Stage 4C-R floor-transfer capability gate.

Affected core exercises include:

- `glute-bridge-hold`;
- `glute-bridge-reps`.

Optional `push-up-standard` remains gated and must not become core merely because cues exist.

### Required for step-up

- low, stable step or bottom stair;
- fixed support nearby;
- clear, dry area;
- phone outside stepping path;
- controlled step down;
- stop if step/support/balance feels unstable;
- preserve Stage 4C-R environment confirmation.

### Required for balance

- support within reach;
- choose the supported option if hesitant;
- stop and reset if unusually unsteady;
- do not close eyes or use unstable surfaces unless a future approved level explicitly says so;
- preserve Stage 4C-R single-leg confidence gate.

### Required for band exercises

- inspect band and attachment before use;
- do not use a torn, cracked, frayed, or damaged band;
- secure grip;
- keep face/eyes outside recoil path;
- use controlled return;
- never release a stretched band;
- stop if band, grip, anchor, door, or stance shifts.

### Required for door-anchor exercises

In addition to band cues:

- use a purpose-built anchor according to its instructions;
- use a fully closed, secure door;
- position yourself so band tension does not pull the door open toward you;
- stay outside the door’s opening path;
- test with light tension before the first working set;
- stop if the door or anchor moves.

Do not claim Pearl has inspected the door or anchor.

### Required for mobility/overhead range

- move only through a comfortable range;
- do not force the stretch;
- stop for sharp or increasing discomfort;
- breathe normally.

### Required for measured/camera-assisted exercises

- what counts as a rep/hold;
- pause if tracking is lost;
- reset into view before continuing;
- do not rush or exaggerate movement to regain tracking.

## Band/door-anchor exercise policy

### `seated-band-row`

Inspect the actual current setup before implementing cues.

If the band is anchored around the feet:

- both feet/anchor points must be secure;
- the band must not be able to slip toward the face;
- use controlled tension;
- do not over-stretch.

If the current implementation uses another setup:

- encode that actual setup;
- do not invent a different exercise.

### `standing-band-row`

Must include:

- complete band cue pack;
- complete door-anchor cue pack;
- explicit anchor/setup text before countdown;
- light-tension test;
- controlled return.

### `band-pull-apart`

Must include:

- inspection;
- secure grip;
- face/eye clearance;
- controlled return;
- no release under tension;
- comfortable shoulder range.

### `overhead-press-band`

Must include:

- inspection;
- stable stance;
- secure band position;
- face/eye clearance;
- controlled return;
- comfortable shoulder range;
- no release under tension.

Do not close F4R-005 loaded-exercise policy through these changes.

## Cue metadata architecture

Prefer extending existing catalogue types rather than adding a second parallel exercise registry.

Conceptually:

```ts
type ExerciseCueProfile = {
  globalCueIds?: ExerciseSafetyCueId[];
  setupCueIds: ExerciseSafetyCueId[];
  activeCueIds: ExerciseSafetyCueId[];
  repeatedSetCueIds?: ExerciseSafetyCueId[];
  interruptionCueIds?: ExerciseSafetyCueId[];
  textInstructionIds?: ExerciseSafetyCueId[];
  voicePolicy:
    | 'required'
    | 'text_and_voice'
    | 'text_only_with_approved_reason';
  voiceExemptionReason?: string;
};
```

Adapt to current types.

Requirements:

- every V1-core exercise has a valid profile;
- optional hidden levels may have a profile or an explicit blocked/unfinished status;
- no empty core cue profile;
- no duplicate cue IDs within one tier;
- stable ordering;
- cue IDs resolve successfully;
- no circular metadata;
- no string parsing from exercise names.

## Session-global cue resolver

Create one pure helper that derives the minimal session-global cue set from the planned session.

Requirements:

- deduped;
- stable order;
- includes global stop/breathing/space cues;
- may add a hazard-specific global cue when any exercise needs it;
- does not repeat every exercise-specific setup cue globally;
- does not include cues for exercises not present;
- works for generated, manual, preset, restart, and short sessions;
- non-mutating.

## Exercise cue resolver

Create one pure helper that resolves:

- setup cues;
- first-set active cues;
- repeated-set reminders;
- interruption cues;
- text-visible instructions.

Requirements:

- catalogue-driven;
- same output for equal inputs;
- no hidden clock;
- handles old/historical plans conservatively;
- missing required cue metadata fails closed for new current plans;
- historical sessions remain readable.

## Planning and persistence policy

For newly generated current plans, preserve narrow cue metadata such as:

- cue-profile schema version;
- cue IDs used for the plan/exercise;
- optional cue-profile fingerprint.

Do not persist duplicated full cue text unless the current architecture requires it.

Prefer deriving current text from stable local cue IDs.

Requirements:

- JSON-safe;
- local/offline;
- compact;
- survives generated-summary/local serialization if needed for explanation;
- remote metadata preserves IDs/fingerprint if the plan/session contract requires it;
- malformed/unknown required cue IDs fail closed for a new start;
- historical plans with no cue metadata trigger refresh rather than unsafe start;
- running sessions remain immutable.

Do not make cue text a mutable safety authority from remote data.

## Start-time validation

Extend existing start-time plan validation.

For a new current plan, validate:

- cue-profile schema supported;
- every core exercise has required cue metadata;
- every referenced cue ID resolves;
- band/door/floor/step/balance hazard packs are present when required;
- text fallback exists;
- required voice path exists or has an approved exemption.

Typed recovery reasons may include:

- `missing_safety_cue_profile`;
- `unsupported_safety_cue_schema`;
- `missing_required_band_cues`;
- `missing_required_stop_rules`;
- `unresolved_safety_cue_id`.

Do not expose internal reason codes directly.

## Session player integration

Inspect the current player and voice architecture before editing.

Required behavior:

1. Speak/show session-global cues once before the first active exercise.

2. Speak/show exercise setup cues before countdown.

3. Speak short active cues at an appropriate first-set point.

4. Use repeated-set reminders rather than replaying the full setup.

5. On tracking interruption:
   - pause timing/counting according to existing tracking rules;
   - speak/show reset guidance;
   - do not count movement until valid tracking resumes.

6. Text safety instructions remain visible or replayable.

7. Voice failure must not hide text instructions.

8. User can pause/stop/skip safely.

Do not add excessive narration that materially undermines the 20-minute experience.

## Explore/manual integration

Explore details and manual practice must display:

- setup cues;
- safety cues;
- stop rules;
- equipment/capability requirements;
- measurement/tracking note where relevant.

At start:

- the player must receive the same cue profile used by generated plans;
- Stage 4C-R daily-context/capability gates remain;
- non-credit/progression-ineligible semantics remain.

Do not maintain a simplified unsafe manual cue path.

## Optional/high-risk levels

Preserve existing hidden/gated status for:

- `loaded-sit-to-stand`;
- `squat-loaded`;
- `chair-supported-split-squat`;
- `push-up-standard`;
- `mini-band-lateral-walk`;
- `neck-rotation`;
- any other current optional level.

Tests must ensure Stage 4D-R does not make these levels production-core or auto-selectable.

Safety cue metadata may be added for future use, but do not mark F4R-005 or Stage 4E-R complete.

## User-facing copy guardrails

Allowed:

- “Stop if you feel sharp or increasing discomfort.”
- “Pause and use support if you feel dizzy or unusually unsteady.”
- “Breathe normally.”
- “Move only through a comfortable range.”
- “Check the band and anchor before you start.”
- “Return the band slowly. Never let it snap back.”
- “If tracking is lost, pause and reset into view.”

Avoid:

- diagnosis;
- treatment;
- “injury prevention” guarantees;
- medical clearance;
- “fall risk” labels;
- shame;
- fear-heavy language;
- internal IDs;
- claims that Pearl inspected equipment.

Update copy guardrails to protect these boundaries without banning legitimate educational text.

## Working-tree safety

Before analysis or editing:

```bash
git status --short --untracked-files=all
git diff --name-only
git diff --stat
```

Record exact output in the remediation report.

Rules:

1. Treat all current modified/untracked files as user-owned.

2. Inspect current diffs in every file Stage 4D-R may touch.

3. Do not revert, overwrite, reformat, move, or delete unrelated work.

4. Do not edit prior reports.

5. Do not use destructive Git commands.

6. Do not install packages.

7. Do not modify lockfiles.

8. Do not stage, commit, create a branch, or push.

9. If unrelated files change:
   - record them;
   - do not overwrite them;
   - continue only if task-owned edits remain safe and unambiguous;
   - otherwise stop production mutation and report the conflict.

## Step 1: Reconstruct the current cue and voice architecture

Before editing, inspect at minimum:

- src/exercises/types.ts
- src/exercises/registry.ts
- src/exercises/ladders.ts
- every exercise-definition file
- src/exercises/setGraders.ts
- src/training/workoutGeneration.ts
- src/training/sessionPlayer.ts
- src/training/dynamicState.ts
- src/training/serialize.ts
- src/pearlFlow/sessionPlanning.ts
- src/pearlFlow/types.ts
- src/screens/SessionPreviewScreen.tsx
- src/screens/TrainingSessionScreen.tsx
- src/screens/ExploreDetailScreens.tsx
- src/screens/ExploreScreen.tsx
- manual-practice player/start path
- current voice/audio/TTS services and cue registries
- relevant tests.

Search for:

- `voiceInstructions`;
- `instruction`;
- `safetyNotes`;
- `setupNotes`;
- `audio`;
- `speak`;
- `tts`;
- `voice`;
- `cue`;
- `tracking_interrupted`;
- `replay`;
- `pause`;
- `skip`;
- `stop`;
- empty instruction arrays.

Document:

- every current cue source;
- every current voice source;
- every core exercise with empty/incomplete voice instructions;
- cue delivery order;
- repeated-set behavior;
- tracking-interruption behavior;
- text fallback;
- Explore/manual differences;
- whether any binary audio dependency exists.

Do not edit until this trace is complete.

## Step 2: Build the hazard-to-cue policy

Create one explicit mapping from catalogue metadata/hazards to required cue IDs.

Conceptually:

| Hazard/capability | Required cue pack |
|---|---|
| support required | sturdy support, within reach, stop if shifts |
| floor | clear space, transfer support, slow transition, dizziness/unsteady stop |
| step-up | low stable step, fixed support, clear dry area, phone out of path, controlled return |
| balance | support nearby, reset if unsteady |
| long band | inspect, grip, face clear, controlled return, no release, stop if shifts |
| door anchor | purpose-built setup, closed secure door, out of path, light-tension test |
| overhead/range | comfortable range, no forcing |
| measured/tracked | rep/hold definition, tracking reset |
| exertion/hold | breathe normally |

Requirements:

- pure;
- deterministic;
- testable;
- no exercise-name parsing;
- can use equipment, movement pattern, capability, stimulus kind, measurement tier, and explicit exercise overrides;
- explicit override for exceptional exercises;
- does not add irrelevant cues.

## Step 3: Add canonical cue definitions and resolver

Implement:

- typed cue IDs;
- canonical user-facing text;
- cue tier;
- optional voice key/policy;
- hazard tags if useful;
- pure resolution helpers.

Direct tests:

- every ID resolves;
- no duplicate IDs;
- stable ordering;
- no empty text;
- no internal jargon;
- no medical claims;
- text/voice source parity;
- unknown ID fails closed;
- input non-mutation.

## Step 4: Attach cue profiles to all V1-core exercises

Re-inventory the current core exercise list.

For every core level:

- attach or derive a complete `ExerciseCueProfile`;
- preserve current movement-specific technique cues;
- add required hazard cues;
- fill currently empty instruction arrays through the canonical system;
- record any approved text-only exemption.

Create a table in the report:

| Exercise | Core/optional | Hazard packs | Setup cue | Active cue | Voice policy | Result |

Do not mark a core exercise complete if its required cue profile is missing.

## Step 5: Implement the band/door-anchor cue pack

Apply to:

- seated band row;
- standing band row;
- band pull-apart;
- overhead band press;
- any other current core band exercise.

Tests must assert the exact required cue IDs.

Standing band row must include all door-anchor cues.

Inspect seated row’s real setup and add setup-specific cues without inventing a different exercise.

Do not enable currently hidden band optional levels.

## Step 6: Implement floor, step, support, and balance cue packs

Apply required packs to:

- core bridges;
- step-up;
- support-dependent squats/raises/mobility;
- feet-together/tandem/single-leg balance;
- supported side-step/march;
- relevant push variants.

Preserve Stage 4C-R capability gates.

Tests must prove capability confirmation alone does not remove the need for session-time cues.

## Step 7: Implement global stop-rule delivery

Add session-global safety cue derivation and player delivery.

Tests:

- delivered once per session;
- not repeated before every exercise/set;
- text fallback present;
- relevant to generated/manual/preset/restart/short sessions;
- no session-credit mutation;
- cancellation/exit leaves plan unchanged.

Do not make every session excessively verbose.

## Step 8: Implement exercise setup/active/repeated-set delivery

Tests:

- setup before countdown;
- active cue in first set;
- repeated-set reminder on later sets;
- no full setup repetition;
- cue order deterministic;
- cue replay works if existing player supports it;
- voice unavailable still displays text.

Use existing state-machine transitions.

## Step 9: Tracking-interruption safety guidance

For camera-assisted/measured exercises:

- preserve existing grader/timer reset behavior;
- add canonical tracking recovery cue;
- do not count during invalid tracking;
- do not encourage exaggerated movement to regain tracking;
- repeated tracking loss remains calm/non-shaming.

Tests:

- interruption cue appears;
- fresh valid dwell/reset remains required where current logic requires it;
- no duplicate completion;
- no progression from invalid/missing evidence.

Do not change pose-estimation thresholds.

## Step 10: Explore/manual cue parity

Tests:

- Explore details show the resolved cue profile;
- manual practice shows the same safety/setup cues;
- started manual/preset plan carries the cue metadata;
- daily context/capability gates from Stage 4C-R remain;
- no simplified unsafe cue path;
- manual remains non-credit/ineligible.

## Step 11: Start-time validation and persistence

For new current plans:

- stamp cue schema/fingerprint/IDs if needed;
- validate before player start;
- fail closed when required cues are missing/unresolved;
- preserve historical readability;
- stale/legacy plans refresh through existing recovery architecture;
- running session remains immutable.

Tests:

- missing band cue pack;
- missing global stop cues;
- unsupported cue schema;
- unresolved cue ID;
- local round-trip;
- compact remote round-trip where relevant;
- no remote text authority;
- historical plan remains readable but not startable as current.

## Step 12: Player stop/pause/replay affordance audit and narrow fix

Verify the player offers practical actions matching the guidance.

If current controls already satisfy the requirement:

- add tests;
- do not change UI.

If not:

- add the smallest accessible pause/stop/replay affordance;
- no broad redesign;
- preserve one-shot completion;
- preserve Stage 5A credit rules;
- stop/exit does not fabricate completion.

Document the result.

## Step 13: Optional-level non-regression

Tests must assert:

- optional loaded levels remain excluded by default;
- optional push-up/split-squat/mini-band/neck levels remain gated;
- adding cue metadata does not make them core;
- Explore/manual cannot start hidden optional levels unless current explicit policy already permits it;
- Stage 4E-R remains required.

## Step 14: Copy and accessibility verification

Verify:

- clear plain language;
- mature non-medical tone;
- accessible text sizing through existing components;
- screen-reader labels for replay/pause/stop;
- no cue is voice-only;
- no internal IDs shown;
- no contradictory text between preview, Explore, manual, and player.

Update copy guardrail tests.

## Step 15: Payload/privacy verification

If cue IDs/fingerprints are persisted:

- only bounded IDs/version/fingerprint;
- no raw audio;
- no base64;
- no file paths;
- no health free text;
- no auth data;
- no pose/video/landmarks.

Do not sync the full cue catalogue.

## Step 16: Regression verification

Prove these remain green:

### Stage 4A/4B

- equipment gates;
- stimulus roles;
- no-band honesty;
- mobility collection;
- static/dynamic balance.

### Stage 4C-R

- floor transfer;
- step environment;
- single-leg confidence;
- Explore/manual daily context;
- capability snapshots.

### Stage 5A–5H

- work/focus/schedule credit;
- current planner;
- progression authority;
- readiness/discomfort;
- equipment authority;
- scheduling/lifecycle;
- adversarial lifecycle suite.

### Other

- Stage 3D focus/copy protections;
- canonical tab order;
- app/website TypeScript boundaries;
- scoring/norms/Check-Up unchanged.

## Required automated test matrix

### A. Cue registry

- all IDs unique/resolvable;
- no empty text;
- voice/text parity;
- guardrails.

### B. Core catalogue completeness

- every core level has valid profile;
- hazard packs present;
- optional levels remain optional.

### C. Band/anchor

- each band exercise;
- standing row anchor pack;
- no-band path;
- voice/text delivery.

### D. Floor/step/support/balance

- required cue packs;
- capability gates remain;
- no irrelevant cues.

### E. Session delivery

- global once;
- setup before countdown;
- active first set;
- repeated reminder;
- replay/text fallback;
- stop/pause.

### F. Tracking interruption

- reset cue;
- no invalid counting;
- no credit/progression leak.

### G. Explore/manual

- same cue profile;
- explicit daily context;
- non-credit/ineligible;
- direct helper fail-closed.

### H. Serialization/start validation

- schema/fingerprint;
- missing cue failure;
- round-trip;
- historical behavior.

### I. Accessibility/copy

- labels;
- non-medical;
- no shame;
- no voice-only safety.

### J. Regression

- Stage 4A–4C-R;
- Stage 5A–5H;
- Stage 3D;
- navigation/typechecks.

## Test-quality requirements

Tests must:

- exercise real production cue resolvers;
- exercise real player transitions where practical;
- assert cue order and deduplication;
- assert required cue IDs by hazard;
- assert text fallback;
- fail if a core exercise has empty safety/instruction metadata;
- fail if band/door-anchor pack is incomplete;
- fail if optional levels become core/startable;
- fail if Explore/manual bypasses cue delivery.

Tests must not:

- mock every layer;
- assert only helper invocation;
- install packages;
- add binary audio;
- change progression thresholds;
- enable optional levels;
- change scoring/norms;
- depend on network;
- depend on wall-clock sleeps.

Use deterministic IDs, plans, exercise lists, and player events.

## Validation commands

Run targeted tests for:

- cue registry/resolution;
- catalogue integrity;
- session player;
- workout generation;
- session planning;
- Explore/manual practice;
- tracking interruption;
- serialization/sync;
- Stage 4C-R;
- Stage 5H lifecycle.

Then run exactly:

```bash
npm test -- --runInBand
npm run typecheck
npm --prefix website run typecheck
npx --no-install expo config --type public
git diff --check
```

Do not install dependencies.

Record:

- exact targeted command;
- targeted suite/test counts;
- full suite/test counts;
- snapshots;
- skipped tests;
- app typecheck;
- website typecheck;
- Expo config;
- diff check;
- Watchman warning;
- Jest open-handle notice;
- Sentry warning;
- any new warning;
- whether validation changed files.

Stage 4C-R’s full baseline was:

- 97 suites;
- 781 tests.

Verify the current baseline rather than assuming it.

## Manual source verification after tests

Retrace:

### Core generated session

```text
catalogue cue profile
-> plan cue metadata
-> global cue
-> exercise setup
-> active cue
-> repeated-set reminder
-> interruption cue
```

### Band exercise

Confirm complete band pack and door-anchor pack where required.

### Floor/step/balance

Confirm capability gates plus session-time cues.

### Explore/manual

Confirm same cue profile and daily-context parity.

### Voice failure

Confirm visible text remains.

### Stop/exit

Confirm no false completion/credit/progression.

## Remediation report

Create exactly one new report:

```text
docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4D_R.md
```

Do not edit prior reports.

The report must contain:

1. Scope.
2. Initial Git status.
3. Findings addressed:
   - F4R-003.
   - F4R-004.
4. Findings explicitly deferred.
5. Prior cue/voice architecture.
6. Canonical cue vocabulary.
7. Cue tiers and delivery policy.
8. Catalogue-wide minimum standard.
9. Core exercise cue-completeness table.
10. Band/door-anchor cue pack.
11. Floor/step/support/balance cue packs.
12. Global stop-rule delivery.
13. Exercise setup/active/repeated-set delivery.
14. Tracking-interruption guidance.
15. Explore/manual cue parity.
16. Start-time validation.
17. Player stop/pause/replay behavior.
18. Optional-level non-regression.
19. Copy/accessibility.
20. Persistence/payload safety.
21. Files changed.
22. Tests added/changed.
23. Exact validation results.
24. Stage 4A–4C-R and Stage 5 regression verification.
25. F4R-003 status.
26. F4R-004 status.
27. Remaining Stage 4 findings.
28. Whether Stage 4E-R is unblocked.
29. Whether exercise catalogue remains beta-blocked.
30. Initial and final Git status.
31. Concurrent external changes.
32. Confirmation that no package install, lockfile change, commit, staging, branch, or push occurred.

## Required invariant outcomes

After Stage 4D-R:

1. One canonical typed cue registry exists.
2. Text and voice use the same cue source.
3. Every V1-core exercise has a valid cue profile.
4. No V1-core exercise has an unexplained empty instruction profile.
5. Session-global stop rules are delivered once.
6. Setup cues occur before movement.
7. Repeated sets do not replay the full cue pack.
8. Text fallback exists for every safety-critical cue.
9. Band core exercises include inspection, grip, face clearance, controlled return, no release, and stop-if-shifts cues.
10. Standing band row includes the complete door-anchor pack.
11. Floor exercises include transfer/space/unsteadiness cues.
12. Step-up includes stable step/support/clear area/phone path/controlled return cues.
13. Balance includes support/unsteadiness cues.
14. Support-dependent exercises include sturdy-support cues.
15. Comfortable-range exercises include no-forcing cues.
16. Tracking interruption gives reset guidance and invalid evidence remains non-credit.
17. Generated, Explore, manual, short, restart, and supporting sessions use the cue system.
18. Missing required cues fail closed for new current plans.
19. Historical plans remain readable.
20. User has practical pause/stop/skip access.
21. Safety stop does not fabricate completion.
22. Optional levels remain hidden/gated.
23. Stage 4C-R capability gates remain.
24. Stage 5A–5H contracts remain.
25. No scoring/norm/Check-Up changes.
26. No medical claims are introduced.
27. No binary audio/package dependency is added.
28. No unrelated product logic changes.

## Acceptance criteria

Do not mark Stage 4D-R complete unless:

1. One canonical cue vocabulary and resolver exists.

2. Every core exercise passes cue-completeness tests.

3. Band/door-anchor cue packs are complete and tested.

4. Catalogue-wide stop rules are implemented in the actual session path.

5. Voice/text parity is implemented.

6. Global/setup/active/repeated/interruption timing is tested.

7. Explore/manual use the same cue system.

8. Start-time cue validation fails closed.

9. Text fallback and accessibility are verified.

10. Stop/pause/replay behavior is adequate.

11. Optional levels remain hidden/gated.

12. Stage 4A–4C-R and Stage 5A–5H regressions pass.

13. Targeted tests pass.

14. Full suite passes.

15. App typecheck passes.

16. Website typecheck passes.

17. Expo config passes.

18. `git diff --check` passes.

19. No new warning is introduced without explanation.

20. No unrelated user work is reverted or overwritten.

21. No package install or lockfile change occurs.

22. No commit, staging, branch, or push occurs.

If required voice delivery cannot be implemented without missing binary assets or an unavailable production voice path, mark Stage 4D-R blocked and report the exact gap.

## Stage decisions

At the end of the report, state exactly one:

- `STAGE 4D-R COMPLETE`
- `STAGE 4D-R BLOCKED`

Also state exactly one:

- `STAGE 4E-R UNBLOCKED`
- `STAGE 4E-R BLOCKED`

Use `STAGE 4E-R UNBLOCKED` only if no P0/P1 band/stop-rule/cue-delivery defect remains.

Also state:

- `STAGE 4E-R REQUIRED`
- `STAGE 4 REMEDIATION STILL REQUIRED`
- `EXERCISE CATALOGUE SOFTWARE/CONTENT-BLOCKED`
- `STAGE 5 REMEDIATION COMPLETE`
- `DYNAMIC WORKOUT GENERATION SOFTWARE-READY FOR CONTROLLED BETA`
- `OVERALL BETA RELEASE STILL BLOCKED`
- `STAGE 3D-B REQUIRED`
- `BETA DEVICE VALIDATION REQUIRED`

Stage 4D-R must not declare the exercise catalogue ready while F4R-005, F4R-008, F4R-009, and F4R-010 remain unresolved.

## Final Codex response

Return a concise summary containing:

- Remediation report path.
- Whether production code changed.
- Canonical cue architecture.
- Voice/text parity.
- Core exercise cue coverage.
- Band/door-anchor cue pack.
- Global stop-rule behavior.
- Floor/step/support/balance cue behavior.
- Tracking-interruption guidance.
- Explore/manual parity.
- Start-time validation.
- Stop/pause/replay behavior.
- Optional-level non-regression.
- Files changed.
- Tests added/changed.
- Targeted validation result.
- Full-suite result.
- App typecheck.
- Website typecheck.
- Expo config.
- `git diff --check`.
- Confirmation that Stage 4A–4C-R, Stage 5A–5H, Stage 3D, navigation, and TypeScript-boundary protections remain.
- F4R-003 status.
- F4R-004 status.
- Remaining Stage 4 blockers.
- `STAGE 4D-R COMPLETE` or blocked.
- `STAGE 4E-R UNBLOCKED` or blocked.
- `STAGE 4E-R REQUIRED`.
- `STAGE 4 REMEDIATION STILL REQUIRED`.
- `EXERCISE CATALOGUE SOFTWARE/CONTENT-BLOCKED`.
- `STAGE 5 REMEDIATION COMPLETE`.
- `DYNAMIC WORKOUT GENERATION SOFTWARE-READY FOR CONTROLLED BETA`.
- `OVERALL BETA RELEASE STILL BLOCKED`.
- `STAGE 3D-B REQUIRED`.
- `BETA DEVICE VALIDATION REQUIRED`.
- Initial and final Git status.
- Any concurrent external changes.
- Confirmation that no package install, lockfile change, commit, staging, branch, or push occurred.
