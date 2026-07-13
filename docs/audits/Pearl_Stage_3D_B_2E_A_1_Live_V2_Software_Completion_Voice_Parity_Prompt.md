You are implementing Stage 3D-B.2E-A.1 of Pearl’s production-readiness work:

LIVE MOVEMENT PROFILE V2 SOFTWARE COMPLETION, V2-SPECIFIC VOICE/TEXT PARITY, SNAPSHOT→ASSESSMENT→PROFILE CHAIN CLOSURE, JSON-SAFE NO-MEASUREMENT HANDLING, AND MALFORMED-ARTIFACT RECOVERY

This is a narrow continuation of Stage 3D-B.2E-A.

Do not begin physical-device validation, V2 MovementBlock creation, balanced workout generation, V2 reports, public rollout, official V2 retest scheduling, Warden chair-transform work, longitudinal improvement claims, native pose-model changes, or unrelated UI/product work in this task.

## Why this continuation is required

Stage 3D-B.2E-A successfully replaced canned measurement buttons with the live pose coordinator and proved:

- live chair practice and official counting;
- live adaptive balance trials/rest/retry/use-best;
- live selected-side shoulder capture;
- supporting hinge capture;
- monotonic timer bridging;
- movement/attempt epochs;
- stale, duplicate, out-of-order, and wrong-epoch frame rejection;
- app-background handling;
- sanitized diagnostics export;
- raw V2 Check-Up creation;
- immutable V2 snapshot creation.

However, the Stage 3D-B.2E-A report correctly did not mark the stage fully accepted because four software issues remain:

1. Full V2-specific active-flow voice parity is incomplete, especially for:
   - the 45-second balance protocol;
   - attempt save/completion;
   - 30-second minimum and 60-second default rest;
   - retry after invalid tracking;
   - `Use this result`;
   - full-hold completion.

2. The deterministic live replay reaches a V2 snapshot but not a V2 assessment. It currently ends with:

```text
v2_assessment_raw_incomplete
```

The exact cause has not yet been proven.

3. Invalid/backgrounded supporting hinge capture currently places `NaN` in the live result before JSON conversion. The V2 artifact chain must use an explicit typed no-measurement representation and must never rely on `JSON.stringify(NaN) -> null` as an implicit contract.

4. A complete internal malformed/snapshot-only/assessment-only artifact recovery screen is still missing.

Stage 3D-B.2E-A.1 must close those software gaps, but it must not pretend that real-device accuracy has been validated.

## Current verified baseline

### Stage 3D-B.2A

Implemented internal V2 protocol contracts and controllers:

- `chair-rise-30s-v2`;
- `one-leg-balance-45s-v2`;
- `active-shoulder-reach-v2`;
- supporting `hinge-reach`;
- typed setup, attempts, retries, protocol evidence, and raw completeness;
- V1 scoring/block/report containment.

### Stage 3D-B.2B

Implemented pure V2 reference engine:

- chair remains raw-only because the Warden transform is disabled;
- balance task bands and Springer benchmark metadata;
- shoulder Gill IQR categories;
- deterministic source/transform fingerprints;
- no Movement Age, generic score, block, UI, or hidden clock.

### Stage 3D-B.2C

Implemented immutable V2 snapshots:

- official evidence eligibility;
- exact source-Check-Up binding;
- explicit frozen reference profile;
- deterministic IDs/fingerprints;
- local persistence;
- backend sync/restore;
- no recomputation;
- V1/V2 separation.

### Stage 3D-B.2D.1

Implemented V2 evidence/focus/assessment contract:

- ordinal domain evidence;
- raw-only evidence cannot masquerade as below reference;
- life-goal tie-breaking;
- true balanced focus;
- official-retest-only prior V2 focus;
- immutable assessment ID/fingerprint;
- no V2 MovementBlock.

### Stage 3D-B.2D.2A

Implemented assessment persistence/orchestration:

- strict snapshot/assessment/source binding;
- immutable attachment and conflict protection;
- prior V2 focus selectors;
- local/backend round-trip;
- no recomputation.

### Stage 3D-B.2D.2B

Implemented internal product shell:

- compile-time internal V2 gate;
- dedicated V2 Check-Up screen;
- per-Check-Up reference details;
- Movement Profile results/detail UI;
- latest V2 Progress card;
- V1 remains public/default.

### Stage 3D-B.2E-A

Implemented live integration:

- `src/movementProfileV2/liveCoordinator.ts`;
- `src/movementProfileV2/liveDiagnostics.ts`;
- live pose-driven `MovementProfileV2CheckUpScreen`;
- timer ticks independent of frame arrival;
- chair/balance/shoulder/hinge live adapters;
- deterministic synthetic replay;
- no canned measurement actions in the normal internal path.

Stage 3D-B.2E-A validation passed:

- targeted: 7 suites / 39 tests;
- full Jest: 118 suites / 994 tests;
- existing audio verification: 44 safety cues / 88 assets;
- app typecheck;
- website typecheck;
- Expo config/export;
- `git diff --check`.

Re-run the current baseline rather than assuming those counts remain unchanged.

## Required prior reading

Read these reports in full before changing code:

- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2E_A.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2D_2B.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2D_2A.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2D_1.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2C.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2B.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2A.md
- docs/audits/PEARL_PERCENTILE_SCORING_PROTOCOL_DESIGN_STAGE_3D_B_1.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_2A_1.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4D_R.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_4D_R_1.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_4D_R_1_CONTINUATION.md
- docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_4G_R.md
- docs/audits/PEARL_LOGIC_VERIFICATION_STAGE_5H.md

Also read all current approved voice artifacts if present:

- docs/specs/PEARL_VOICE_EXPERIENCE_SPEC_V2.md
- docs/specs/PEARL_VOICE_EXPERIENCE_SPEC_V2.json
- docs/specs/PEARL_VOICE_SCRIPT_REVIEW_V2.md
- docs/specs/PEARL_VOICE_SCRIPT_MANIFEST_V2.csv
- docs/specs/PEARL_VOICE_FOUNDER_DECISIONS.md
- docs/specs/PEARL_VOICE_COMPOSED_TIMELINES_V2.csv
- docs/audits/PEARL_VOICE_SPEC_V2_1_APPROVED_DECISIONS_CODEX_PROMPT.md

If an approved voice artifact exists, it is the script/cue source of truth.

Do not create duplicate cue IDs or conflicting wording merely because this prompt includes fallback semantics.

Also inspect:

- AGENTS.md;
- CLAUDE.md;
- current audio generator and verifier;
- current local voice manifest/player;
- current V2 live coordinator;
- current V2 flow/view model/recovery routing;
- current snapshot/assessment persistence;
- repository feature-gate conventions.

Treat the current working tree as the source of truth.

## Locked product and technical policies

### Product

1. V2 remains internal only.

2. V1 remains the public/default Check-Up.

3. No V2 block or report is created.

4. Chair remains raw-only while the Warden transform is disabled.

5. No Movement Age, diagnosis, risk, pass/fail, improvement, decline, younger, or older claims.

6. Results and suggested focus are read from frozen artifacts only.

### Voice

1. Active camera assessment is voice-first with visible text fallback.

2. No runtime TTS or network playback.

3. Required V2 active-flow cues must exist locally for both Clara and Marcus.

4. Required V2 cues must not silently cross-fallback between Clara and Marcus.

5. Existing safety cues must remain 44 cues / 88 assets and must not be regenerated.

6. Voice playback must never shorten, extend, pause, restart, or duplicate a normative timer.

7. Stale voice-completion callbacks must be ignored through movement/attempt/cue epochs.

### Artifact chain

1. A valid raw-complete V2 Check-Up may contain raw-only comparison states.

2. Raw-only chair evidence does not make the Check-Up raw-incomplete.

3. Supporting hinge is not a headline requirement.

4. A valid raw-complete V2 baseline can create a snapshot and an assessment even when:
   - chair is raw-only;
   - exact reference details are skipped;
   - focus resolves through balance, shoulder, life goal, or balanced fallback.

5. Missing/invalid chair, balance, or shoulder raw evidence must still block official assessment materialisation.

6. Do not weaken `needs_retake` or official raw-completeness guards merely to make a test pass.

### No-measurement

1. V2 stored/synced/exported artifacts must contain no `NaN`, `Infinity`, or `-Infinity`.

2. Do not use a finite sentinel such as `-1` or `999`.

3. No-measurement must be explicit through:
   - `null`;
   - an omitted optional metric;
   - or a typed result union.

4. Legacy V1 ROM contracts may remain unchanged if altering them would expand scope.

### Physical validation

This stage may conclude that software is ready for physical-device validation.

It must not claim that physical-device validation has occurred.

## Primary objectives

Stage 3D-B.2E-A.1 must:

1. Reproduce and explain `v2_assessment_raw_incomplete`.

2. Fix the fixture or production defect without weakening official headline completeness.

3. Prove a fully live-adapter-driven valid run creates:

```text
raw V2 Check-Up
-> immutable V2 snapshot
-> immutable V2 assessment
-> Movement Profile V2 view model
```

4. Prove an all-valid but reference-incomplete/raw-only run can still resolve to a domain or balanced assessment according to the approved policy.

5. Preserve negative cases where missing headline evidence still returns needs-retake/ineligible.

6. Replace implicit `NaN` hinge no-measurement behavior at the V2 storage boundary with an explicit JSON-safe contract.

7. Prove the full raw/snapshot/assessment/sync/export payload contains no non-finite number.

8. Implement complete V2 active-flow voice/text parity.

9. Generate and statically map only the missing/stale V2 voice assets for Clara and Marcus.

10. Extend non-network audio verification to cover the V2 cue matrix separately from the existing safety matrix.

11. Integrate voice sequencing with live movement/attempt epochs and monotonic protocol timing.

12. Implement a complete typed internal V2 artifact-recovery screen/flow.

13. Preserve the existing live diagnostics export and privacy boundary.

14. Keep V2 block/report/public routing out of scope.

15. Preserve all previous Stage 2A/3/4/5 regressions.

## Scope boundary

This task may change:

- V2 live replay fixtures/tests;
- V2 raw-result/no-measurement normalization;
- narrow V2 movement result types if required;
- V2 artifact materialisation application service;
- V2 recovery classification/view model/screen;
- V2 active-flow cue definitions;
- V2 audio manifest/fingerprints;
- audio generator/verifier support for a V2 cue group;
- local static audio mappings;
- V2 screen voice sequencing;
- voice player required-cue policy;
- focused tests;
- the Stage 3D-B.2E-A.1 remediation report.

This task must not change:

- V1 scoring/norms/focus;
- V2 source tables/transforms;
- Warden transform status;
- V2 focus-decision policy;
- V2 snapshot or assessment schema semantics unless a narrowly versioned JSON-safety correction is unavoidable;
- life-goal mappings;
- global profile schema;
- V2 MovementBlock creation;
- balanced workout templates;
- Stage 5 scheduling/progression;
- exercise catalogue;
- public navigation/onboarding;
- website;
- pose model asset/model variant;
- native delegate/running mode;
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

- The Stage 3D-B.2E-A report identified an unrelated untracked:
  - `docs/audits/PEARL_VOICE_SPEC_V2_1_APPROVED_DECISIONS_CODEX_PROMPT.md`.
- Current approved voice-spec artifacts may be present concurrently.
- Inspect their contents before adding cue IDs.
- Do not overwrite or edit approved voice artifacts unless this task explicitly requires a generated implementation file.
- The existing 44 safety cues / 88 MP3 assets are intended current assets.
- Do not regenerate or rename them.
- Do not inspect or expose `.env` values.
- Do not expose ElevenLabs credentials.
- Do not modify or share font files.

Rules:

1. Treat every current modified/untracked file as user-owned.

2. Inspect current diffs in every file this task may touch.

3. Do not revert, overwrite, broadly reformat, move, or delete unrelated work.

4. Do not edit prior reports.

5. Do not use destructive Git commands.

6. Do not install packages.

7. Do not modify lockfiles.

8. Do not stage, commit, create a branch, or push.

9. If unrelated files change:
   - record them;
   - do not overwrite them;
   - continue only when task-owned edits remain safe and unambiguous;
   - otherwise stop mutation and report the conflict.

## Baseline validation

Run a targeted baseline covering:

- V2 live coordinator;
- V2 internal flow;
- V2 reference details;
- V2 snapshot/assessment/persistence;
- V2 view model;
- current audio verifier/player;
- history/sync/restore/export;
- V1 Check-Up;
- Stage 4 closure;
- Stage 5H lifecycle.

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
rm -rf /tmp/pearl-stage3db2ea1-export
npx --no-install expo export --platform all --output-dir /tmp/pearl-stage3db2ea1-export
rc=$?
rm -rf /tmp/pearl-stage3db2ea1-export
exit $rc
```

Record current counts and warnings.

# PART B — ROOT-CAUSE THE LIVE ARTIFACT-CHAIN FAILURE

## Step 1: Reproduce the current failure first

Add or isolate one focused test that reproduces:

```text
live coordinator replay
-> raw V2 Check-Up
-> snapshot created
-> assessment creation returns v2_assessment_raw_incomplete
```

Do not change code before the failure is reproducible.

Capture an exact matrix:

| Domain/item | Raw result present | Raw validity | Protocol evidence | Snapshot interpretation | Domain evidence | Why assessment says incomplete |
| --- | --- | --- | --- | --- | --- | --- |
| Chair | | | | | | |
| Balance | | | | | | |
| Shoulder | | | | | | |
| Hinge supporting | | | | n/a | n/a | |

Trace at minimum:

- `movementProfileV2RawCompleteness`;
- official snapshot eligibility;
- snapshot builder;
- snapshot parser;
- assessment builder;
- persistence eligibility;
- materialiser;
- view-model input.

## Step 2: Classify the root cause

State exactly one or more:

- synthetic replay fixture does not produce one valid headline result;
- live coordinator produces malformed headline metadata;
- source Check-Up normalization drops a valid result;
- snapshot interpretation loses a valid raw result;
- assessment builder incorrectly equates reference eligibility with raw completeness;
- source/snapshot mismatch;
- supporting hinge non-finite value poisons normalization;
- other exact cause.

Do not use the phrase “policy-gated” without identifying the exact field and function.

## Step 3: Preserve the correct product boundary

A raw-complete official V2 Check-Up requires valid raw:

- chair;
- balance;
- shoulder.

It does not require:

- eligible chair percentile;
- eligible shoulder reference comparison;
- a valid hinge measurement;
- a non-balanced focus;
- complete published-reference details.

Do not relax the requirement for valid raw chair/balance/shoulder.

# PART C — JSON-SAFE NO-MEASUREMENT CONTRACT

## Step 4: Inventory all V2 non-finite paths

Search the complete V2 flow for:

- `NaN`;
- `Infinity`;
- `Number.POSITIVE_INFINITY`;
- `Number.NEGATIVE_INFINITY`;
- non-finite pose metric fallbacks;
- `JSON.stringify` reliance.

Inspect:

- live hinge result;
- shoulder invalid result;
- raw Check-Up construction;
- Check-Up normalization;
- diagnostics;
- snapshot/assessment builder;
- local history;
- backend sync;
- restore;
- data export.

Create a report table:

| Path | Current non-finite possibility | Persisted? | Required fix |
| --- | --- | --- | --- |

## Step 5: Implement a V2 explicit no-measurement representation

Preferred policy:

```ts
type MovementProfileV2SupportingMeasurement<T> =
  | {
      status: 'measured';
      value: T;
    }
  | {
      status: 'no_measurement';
      reason: string;
    };
```

Adapt to current contracts.

If the legacy `HingeReachResult` requires `reachBu: number`:

- do not globally change V1 merely for this stage;
- add a V2 boundary adapter;
- convert invalid/non-finite hinge output into:
  - omitted supporting metric;
  - `null`;
  - or a typed V2 no-measurement wrapper;
- preserve `no-measurement` flags/reason metadata;
- never persist `NaN`.

Requirements:

- no finite sentinel;
- raw headline completeness unchanged;
- hinge remains supporting only;
- no-measurement hinge cannot affect reference interpretation/focus;
- JSON round-trip stable;
- backend sync/export stable.

## Step 6: Add a deep JSON-safety assertion

Add a reusable test helper that walks:

- raw V2 Check-Up;
- V2 diagnostics export;
- V2 snapshot;
- V2 assessment;
- local serialized history;
- backend sync payload;
- restored record;
- data export payload.

Assert no value is:

- NaN;
- positive/negative infinity;
- a Date instance;
- a function;
- a raw landmark array;
- a video/frame/image payload.

# PART D — CLOSE THE SNAPSHOT→ASSESSMENT→PROFILE CHAIN

## Step 7: Build one truly valid live replay fixture

The replay must use production live adapters/coordinator, not canned result creators.

It must produce:

### Chair

- valid practice;
- at least one valid official rep;
- valid raw chair result;
- raw-only reference status is acceptable.

### Balance

- at least one valid trial;
- valid best duration;
- choose a duration that produces a deterministic Pearl band.

### Shoulder

- valid selected-side capture;
- finite valid angle;
- sufficient reliable tracking;
- no invalid/pain-limited state unless that specific test is testing raw-only behavior.

### Hinge

- valid supporting result or explicit no-measurement;
- neither outcome affects headline completeness.

## Step 8: Add full chain tests

### Case A — clear V2 focus

Example:

- valid raw chair;
- balance `starting_point` or `starting_point_low`;
- shoulder valid within/above reference;
- explicit age/reference group where needed;
- no conflicting life-goal signal.

Expected:

```text
raw complete
-> snapshot created
-> assessment created
-> focus = balance
-> Movement Profile view model ready
```

### Case B — valid all-raw/no-clear evidence

Example:

- valid raw chair but no chair comparison;
- balance `building`;
- shoulder raw-only because reference details are skipped;
- no uniquely mapped life goal.

Expected:

```text
raw complete
-> snapshot created
-> assessment created
-> focus = balanced
-> Movement Profile view model ready
```

### Case C — goal-led

- no clear low candidate;
- one uniquely mapped life goal.

Expected:

```text
assessment created
-> goal-led domain focus
```

### Case D — supporting hinge unavailable

- all headline results valid;
- hinge explicit no-measurement.

Expected:

```text
snapshot and assessment still created
```

### Case E — invalid headline

- missing/invalid shoulder or balance.

Expected:

```text
snapshot/assessment official chain blocked
-> needs retake
```

Do not “fix” Case E.

## Step 9: Exercise the actual application boundary

At least one test must call the real internal application service/materialiser used by the screen:

```text
live coordinator
-> raw Check-Up persistence
-> reference-details conversion
-> materializeOfficialMovementProfileV2Artifacts
-> local history update
-> MovementProfileV2ViewModel
```

Do not prove only disconnected pure helpers.

## Step 10: Idempotency

Replay the materialisation callback twice.

Expected:

- same Check-Up ID;
- same snapshot ID/fingerprint;
- same assessment ID/fingerprint;
- no duplicate history;
- no conflicting overwrite;
- same view model.

# PART E — APPROVED V2 VOICE SOURCE OF TRUTH

## Step 11: Reconstruct current approved voice policy

Inspect all approved voice artifacts listed above.

Build a matrix:

| Runtime V2 state | Visible text | Approved cue ID | Approved text | Clara asset | Marcus asset | Status |
| --- | --- | --- | --- | --- | --- | --- |

If approved artifacts already define an equivalent cue:

- use that cue;
- do not create a duplicate;
- preserve approved punctuation/text unless implementation requires a separately approved revision.

If approved artifacts conflict:

- use `PEARL_VOICE_FOUNDER_DECISIONS.md` as the highest product-decision authority;
- record the conflict;
- do not silently invent a third wording.

## Step 12: Required semantic coverage

Full active-flow parity must cover at least:

### Chair

- practice begins and does not count;
- official 30-second test will begin after countdown;
- tracking-interrupted practice/attempt restart where relevant.

### Balance

- attempt can last up to 45 seconds;
- current attempt is saved;
- rest begins;
- user may start after 30 seconds;
- default ready point at 60 seconds;
- user may use the best result;
- invalid tracking attempt does not count and will retry;
- full 45-second hold completed;
- balance section complete.

### Shoulder

- selected shoulder nearest the phone;
- active reach starts;
- invalid tracking/geometry retry;
- second invalid/no-measurement recovery where current flow needs it.

### Hinge

- supporting capture setup/start when no accurate existing cue exists;
- supporting capture complete/no-measurement transition where voice is required.

### Global/transition

- V2 intro;
- tracking reset;
- Check-Up complete.

Do not create audio for static reference-details or result-card prose unless the approved voice spec explicitly requires it.

## Step 13: Fallback canonical minimum

Use the approved voice scripts when present.

Only if no approved equivalent exists, use materially equivalent concise text to this fallback minimum:

```text
mpv2_chair_practice_start:
"Try one practice stand. This one will not count."

mpv2_chair_official_ready:
"Sit back down. The 30-second check starts after the countdown."

mpv2_balance_attempt_start:
"Lift your other foot when you're ready. This attempt can last up to 45 seconds."

mpv2_balance_attempt_saved:
"That attempt is saved."

mpv2_balance_rest:
"Rest now. You can start again after 30 seconds, or use your best result."

mpv2_balance_ready_after_30:
"You can start the next attempt when you're ready."

mpv2_balance_ready_after_60:
"You're ready for the next attempt."

mpv2_balance_use_best:
"Your best hold is saved."

mpv2_balance_tracking_retry:
"Tracking was interrupted, so this attempt will not count. Return to the setup position and we'll try again."

mpv2_balance_full_hold:
"You completed the full 45-second hold."

mpv2_balance_complete:
"Balance check complete."

mpv2_shoulder_side_setup:
"Turn side-on with your selected shoulder closest to the phone."

mpv2_shoulder_tracking_retry:
"Tracking was interrupted. Lower your arm, return to the setup position, and we'll try once more."
```

Do not add all fallback cues if accurate approved/existing cues already cover them.

# PART F — CANONICAL V2 CUE ARCHITECTURE

## Step 14: Add one typed V2 cue vocabulary

Create or extend one canonical production source, conceptually:

```ts
type MovementProfileV2CueId = ...;

type MovementProfileV2CueDefinition = {
  id: MovementProfileV2CueId;
  text: string;
  tier:
    | 'intro'
    | 'setup'
    | 'countdown_lead_in'
    | 'active_transition'
    | 'rest'
    | 'ready'
    | 'recovery'
    | 'completion';
  voiceRequired: boolean;
};
```

Requirements:

- deterministic order;
- no screen-local duplicate strings;
- no display-name parsing;
- no dynamic participant data in audio text;
- no duration/result number interpolation requiring runtime TTS;
- visible text resolver and voice cue use the same canonical definition;
- schema/version/fingerprint;
- no secret input.

## Step 15: Runtime cue policy

Create a pure resolver from V2 state transition to cue IDs.

Requirements:

- state transition, not render count, triggers a cue;
- movement/attempt/cue epoch included;
- same transition replay does not speak twice;
- stale voice callback cannot mutate current state;
- selected voice required;
- missing required V2 asset fails to visible text + bounded diagnostic;
- stage sign-off still requires assets to exist.

## Step 16: Timing policy

### Setup/instructions

Required setup speech finishes before the official countdown begins.

### Countdown and `Go`

- protocol timer starts from the explicit controller `Go` event;
- do not wait for the `go` MP3 to finish;
- do not start before the `Go` event.

### Balance rest

- rest timer begins immediately when the valid trial ends;
- rest cue playback does not reset or pause rest;
- 30-second unlock is timer-authoritative;
- 60-second ready state is timer-authoritative;
- voice callbacks cannot unlock early.

### Retry

- retry cue must complete or reach the approved transition point before the retry countdown;
- stale retry completion from attempt 1 cannot start attempt 3.

### Replay/help

- replaying a cue does not restart a timer/attempt;
- active timer remains authoritative;
- no duplicate controller transition.

Add deterministic fake-voice-channel timeline tests.

# PART G — V2 AUDIO GENERATION AND INTEGRITY

## Step 17: Add a narrow generator group

Prefer:

```text
--group movement_profile_v2
```

Requirements:

- supports Clara, Marcus, and all;
- dry run;
- force;
- missing/stale-only generation;
- no deletion of voice directories;
- atomic temp writes;
- provider errors sanitized;
- no secret output;
- no safety or unrelated cue regeneration.

If current approved voice tooling already provides an equivalent group/manifest, use it.

## Step 18: Dry run

Run the exact dry run before generation.

Record:

- required cue count;
- required asset count;
- valid;
- missing;
- stale;
- zero-byte;
- forced;
- provider calls;
- credential present/missing without exposing a value.

If credentials are missing:

- do not weaken the voice requirement;
- mark Stage 3D-B.2E-A.1 blocked;
- still complete safe code/tests that do not require provider calls.

## Step 19: Generate only required V2 assets

Generate for:

- Clara;
- Marcus.

Use the project’s current approved:

- provider;
- model;
- output format;
- voice IDs;
- voice settings.

Do not hardcode stale settings from an old report when current generator config differs.

Record:

- provider-call count;
- generated/reused/missing per voice;
- exact binary inventory.

## Step 20: Static mapping and fingerprinting

Requirements:

- static Metro `require()` mapping for every V2 required asset;
- metadata/fingerprint for every voice/cue pair;
- fingerprint covers:
  - schema;
  - cue ID;
  - canonical text;
  - voice identity;
  - provider voice ID;
  - provider/model/format;
  - material settings;
- no timestamps or secrets;
- no cross-voice fallback.

## Step 21: Extend `npm run verify:audio`

The non-network verifier must report separate matrices:

```text
safety:
  requiredCues=44
  requiredAssets=88

movementProfileV2:
  requiredCues=<N>
  requiredAssets=<2N>

total:
  requiredAssets=<88 + 2N>
```

Verify:

- matrix completeness;
- Clara/Marcus parity;
- static mapping;
- metadata;
- current fingerprint;
- file exists;
- non-empty;
- MP3 header;
- finite positive duration;
- broad text-duration plausibility;
- no duplicate-byte mismatch;
- no temp/partial files;
- no unmapped required asset.

Existing 44/88 safety verification must remain unchanged and green.

# PART H — RUNTIME VOICE INTEGRATION

## Step 22: Integrate with the live V2 screen/coordinator

Do not drive protocol state from React render effects that can rerun unpredictably.

Use:

- explicit coordinator state-transition output;
- one voice-sequencing adapter;
- movement/attempt/cue epochs;
- selected voice.

Requirements:

- setup cues;
- countdown lead-in;
- rest cues;
- ready cues;
- recovery cues;
- completion cues;
- visible canonical text;
- missing playback does not crash or leave channel busy;
- active flow remains usable through text fallback;
- stage completion still requires all required local assets.

## Step 23: Voice busy/stale policy

Add tests for:

- lower-priority stale cue drop;
- retry recovery supersedes obsolete setup cue;
- old attempt completion ignored;
- screen unmount cancels pending V2 cue;
- voice switch before a new Check-Up selects the new voice;
- voice switch mid-attempt does not cross-play two voices;
- no required V2 cross-fallback;
- repeated state projection does not repeat cue.

# PART I — MALFORMED/PENDING ARTIFACT RECOVERY

## Step 24: Add one typed recovery classifier

Conceptually:

```ts
type MovementProfileV2RecoveryState =
  | { kind: 'raw_complete_missing_snapshot'; ... }
  | { kind: 'snapshot_missing_assessment'; ... }
  | { kind: 'ready'; ... }
  | { kind: 'raw_incomplete'; ... }
  | { kind: 'snapshot_malformed_or_mismatched'; ... }
  | { kind: 'assessment_malformed_or_mismatched'; ... }
  | { kind: 'immutable_conflict'; ... }
  | { kind: 'unsupported_future_artifact'; ... }
  | { kind: 'sync_pending_local_ready'; ... };
```

Requirements:

- derive from accepted parsers/selectors;
- no artifact recomputation in the classifier;
- deterministic;
- no internal code in user copy;
- input non-mutating.

## Step 25: Recovery actions

### Raw complete, no snapshot

Action:

```text
Finish your Movement Profile
```

Route to reference details.

### Valid snapshot, no assessment

If no immutable conflict is present:

- call the existing materialiser;
- do not rerun camera/reference engine;
- use the frozen snapshot;
- freeze the current explicit life-goal input only when creating the never-created assessment.

### Ready snapshot + assessment

Open Movement Profile.

### Raw incomplete

Action:

```text
Retake the Check-Up
```

Do not create balanced focus.

### Malformed/mismatched snapshot

- preserve raw Check-Up;
- do not overwrite the malformed/future artifact;
- route to fresh internal Check-Up;
- explain raw result was not lost where true.

### Malformed/mismatched assessment with valid snapshot

- if history parsing has omitted an invalid non-conflicting assessment and no same-ID immutable conflict is retained:
  - allow `Finish your Movement Profile`;
- if an immutable same-ID conflict exists:
  - preserve accepted frozen truth;
  - use the accepted saved version when available;
  - otherwise require a fresh Check-Up;
- never merge provenance/focus fields.

### Unsupported future artifact

- do not downgrade;
- preserve supported raw/snapshot data;
- show an update/fresh-Check-Up recovery path.

### Sync pending, local ready

Open local Movement Profile and retain existing sync retry behavior.

## Step 26: Recovery screen

Create or harden one internal-only screen, such as:

```text
MovementProfileV2RecoveryScreen
```

Use calm copy:

- `Your raw Check-Up is saved. Finish the final details to view your Movement Profile.`
- `Your saved Check-Up needs a fresh internal run before Pearl can show this profile.`
- `The saved version will be used.`
- `Your raw result has not been lost.`

Avoid:

- corrupt;
- failed;
- invalid database;
- fingerprint;
- schema;
- conflict;
- internal reason codes.

Do not add public navigation.

## Step 27: Recovery tests

Cover:

- all typed states;
- action routing;
- no overwrite;
- raw preservation;
- snapshot preservation;
- assessment conflict;
- future version;
- sync pending;
- V1 unaffected;
- accessibility.

# PART J — DIAGNOSTICS NON-REGRESSION

## Step 28: Preserve the existing diagnostics export

Do not add a large diagnostics dashboard unless needed to close a concrete defect.

Verify:

- diagnostics gate remains internal-only;
- V2 internal gate also required;
- transition list remains bounded;
- no landmarks/video/PII;
- no voice asset path containing secrets;
- audio diagnostics include cue ID/status only;
- JSON export remains valid with no non-finite values.

Add fields only if useful for device validation:

- last required V2 cue ID;
- cue playback success/failure reason;
- cue epoch;
- artifact chain outcome.

# PART K — REQUIRED AUTOMATED TEST MATRIX

## A. Root-cause regression

- exact prior `v2_assessment_raw_incomplete` reproduction;
- exact root cause documented;
- corrected valid replay succeeds;
- invalid headline replay still blocked.

## B. JSON-safe no measurement

- invalid hinge;
- backgrounded hinge;
- omitted/null typed metric;
- raw Check-Up stringify/parse;
- diagnostics stringify/parse;
- snapshot/assessment;
- sync;
- restore;
- export;
- deep non-finite scan.

## C. Full artifact chain

- clear balance focus;
- shoulder reference focus;
- goal-led focus;
- balanced fallback;
- all raw-only valid;
- hinge no-measurement;
- repeated materialisation idempotent;
- local save;
- remote sync failure;
- reopened view model.

## D. Cue inventory/policy

- approved voice manifest parity;
- every runtime active state covered;
- no duplicate cue semantics;
- deterministic cue-policy fingerprint;
- visible text equals canonical text.

## E. Voice sequencing

- setup before countdown;
- `Go` starts timer;
- rest timer independent of voice;
- 30-second unlock independent;
- 60-second ready independent;
- retry epoch;
- stale callback ignored;
- replay does not restart;
- unmount cleanup;
- selected voice;
- no cross-fallback.

## F. Audio generation/integrity

- dry-run plan;
- missing/stale-only;
- Clara matrix;
- Marcus matrix;
- static mappings;
- fingerprints;
- verifier;
- existing safety 44/88 unchanged;
- no unrelated MP3 changes.

## G. Recovery classifier/UI

- raw pending;
- snapshot pending assessment;
- ready;
- raw incomplete;
- malformed snapshot;
- malformed assessment;
- immutable conflict;
- future artifact;
- sync pending;
- calm copy;
- no internal codes.

## H. Containment

- V1 default unchanged;
- no V2 MovementBlock;
- no V2 report;
- no public route;
- no Warden transform;
- no source-table change;
- no physical-validation claim.

## I. Regression

- Stage 3D-B.2A;
- Stage 3D-B.2B;
- Stage 3D-B.2C;
- Stage 3D-B.2D.1;
- Stage 3D-B.2D.2A;
- Stage 3D-B.2D.2B;
- Stage 3D-B.2E-A;
- Stage 2A.1;
- Stage 4 closure;
- Stage 5H;
- navigation;
- TypeScript boundaries;
- safety audio.

## Test-quality requirements

Tests must:

- exercise production live coordinator/materialiser/voice/recovery helpers;
- use explicit timestamps;
- use synthetic landmarks only;
- call the real snapshot and assessment builders;
- call the real V2 view model;
- assert no non-finite persisted value;
- assert exact cue transition behavior;
- assert immutable artifact reuse;
- assert V1 containment.

Tests must not:

- mock every layer;
- assert only helper calls;
- use participant data;
- require camera hardware;
- use wall-clock sleeps;
- contact source websites;
- embed Warden data;
- install packages;
- weaken raw-completeness policy.

# PART L — VALIDATION COMMANDS

Run targeted tests for:

- live coordinator;
- internal V2 flow;
- V2 raw completeness;
- snapshot;
- assessment;
- persistence/materialisation;
- V2 view model;
- V2 voice cue policy;
- voice player;
- audio verifier;
- V2 recovery;
- history/sync/restore/export;
- V1 containment;
- Stage 4 closure;
- Stage 5H lifecycle.

Before audio generation, run the V2 audio dry run.

After generation, run the focused V2 audio verifier/tests.

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
rm -rf /tmp/pearl-stage3db2ea1-export
npx --no-install expo export --platform all --output-dir /tmp/pearl-stage3db2ea1-export
rc=$?
rm -rf /tmp/pearl-stage3db2ea1-export
exit $rc
```

Do not install dependencies.

Record:

- exact targeted command;
- targeted suite/test counts;
- previous failing replay proof;
- corrected full-chain proof;
- V2 cue count;
- V2 required asset count;
- V2 dry-run counts;
- provider-call count;
- generated/reused/missing per voice;
- existing safety counts;
- total audio counts/bytes/duration range;
- full suite/test counts;
- app typecheck;
- website typecheck;
- Expo config;
- Expo export;
- `git diff --check`;
- Watchman warning;
- Jest open-handle notice;
- Sentry warning;
- any new warning;
- whether validation changed files.

# PART M — MANUAL SOURCE TRACE AFTER TESTS

Retrace:

## Valid live chain

```text
live chair
-> live balance
-> live shoulder
-> optional/no-measurement hinge
-> raw-complete Check-Up
-> reference details
-> snapshot
-> assessment
-> Movement Profile view model
```

## Voice timing

```text
state transition
-> canonical V2 cue
-> local selected-voice asset
-> visible text
```

Confirm timer authority is unchanged.

## Recovery

Retrace every recovery state and action.

## Containment

Confirm:

- V1 public default;
- no V2 block/report;
- no Warden transform;
- no public rollout;
- no physical-validation claim.

# PART N — PHYSICAL-DEVICE RUNBOOK HANDOFF

Do not run physical-device validation in this task.

Update the report’s next-stage runbook so it explicitly tests the newly completed voice and artifact chain:

1. Clara full live run.
2. Marcus full live run.
3. Chair practice and official count.
4. Balance:
   - 45-second ceiling;
   - early touchdown;
   - invalid tracking retry;
   - 30-second ready;
   - 60-second ready;
   - use-best.
5. Shoulder selected-side and invalid retry.
6. Hinge no-measurement.
7. Background each active stage.
8. Raw Check-Up -> snapshot -> assessment -> Movement Profile.
9. Raw-pending recovery.
10. Diagnostics/audio export review.
11. Offline local result with sync retry.

Record that this is the next stage and has not been performed.

# PART O — REMEDIATION REPORT

Create exactly one new report:

```text
docs/audits/PEARL_LOGIC_REMEDIATION_STAGE_3D_B_2E_A_1.md
```

Do not edit prior reports.

The report must contain:

1. Scope.
2. Strict Stage 3D-B.2E-A gaps addressed.
3. Product/technical policies preserved.
4. Initial Git status.
5. Prior failing artifact-chain reproduction.
6. Exact root cause of `v2_assessment_raw_incomplete`.
7. Corrected artifact-chain behavior.
8. Negative raw-incomplete behavior retained.
9. V2 no-measurement architecture.
10. JSON-safety proof.
11. Approved voice-artifact precedence.
12. V2 runtime cue matrix.
13. Cue/timing/epoch architecture.
14. Audio generator changes.
15. Dry-run counts.
16. Clara generation result.
17. Marcus generation result.
18. Static mappings/fingerprints.
19. Audio verifier result.
20. Existing safety-audio non-regression.
21. Runtime voice sequencing.
22. Recovery classifier.
23. Recovery UI.
24. Diagnostics non-regression.
25. Files changed.
26. Binary assets generated.
27. Tests added/changed.
28. Exact targeted validation.
29. Exact full validation.
30. App/website typechecks.
31. Expo config/export.
32. Stage 3D-B.2A through 2E-A regression verification.
33. Stage 4/5 regression verification.
34. Physical-device runbook handoff.
35. Remaining Stage 3D-B work.
36. Whether Stage 3D-B.2D.2C remains blocked.
37. Initial and final Git status.
38. Complete files-changed inventory.
39. Concurrent external changes.
40. Confirmation that no package install, lockfile change, source PDF/workbook commit, staging, commit, branch, or push occurred.

# REQUIRED INVARIANT OUTCOMES

After Stage 3D-B.2E-A.1:

1. The prior assessment failure has an exact documented cause.
2. A valid live replay creates raw Check-Up, snapshot, assessment, and view model.
3. Raw-only chair does not make raw completeness fail.
4. Skipped reference details do not make raw completeness fail.
5. Balanced fallback can materialise.
6. Missing headline evidence still blocks official assessment.
7. Hinge remains supporting only.
8. Invalid hinge uses explicit no-measurement.
9. No V2 persisted/exported payload contains NaN or infinity.
10. No finite sentinel is used.
11. One canonical V2 active cue vocabulary exists.
12. Every required live V2 transition has visible text.
13. Every voice-required V2 cue has Clara and Marcus assets.
14. No required V2 cross-voice fallback exists.
15. Existing safety matrix remains 44 cues / 88 assets.
16. No unrelated audio is regenerated.
17. Setup cues precede countdown.
18. `Go` remains timer-authoritative.
19. Rest timer is independent of voice playback.
20. Retry cue cannot start a stale attempt.
21. Repeated render/state projection cannot repeat a cue.
22. Missing playback cannot crash or leave voice busy.
23. Recovery states are typed and complete.
24. Recovery never silently overwrites frozen artifacts.
25. Raw/snapshot data survive malformed assessment.
26. Future artifacts are not downgraded.
27. Diagnostics remain bounded and privacy-safe.
28. V1 remains public/default.
29. V2 remains internal.
30. No V2 MovementBlock exists.
31. No V2 report exists.
32. No public rollout exists.
33. No Warden transform is embedded.
34. No improvement/decline claim exists.
35. Stage 4/5 contracts remain green.
36. Physical-device validation has not been claimed.

# ACCEPTANCE CRITERIA

Do not mark Stage 3D-B.2E-A.1 complete unless:

1. The artifact-chain root cause is proven.

2. At least one real live-adapter replay reaches a frozen assessment and ready Movement Profile view model.

3. Invalid headline evidence remains fail-closed.

4. V2 no-measurement is explicitly JSON-safe.

5. Deep non-finite scans pass across all V2 persistence/export paths.

6. Full V2-specific active-flow voice parity is implemented.

7. All required V2 voice assets exist for Clara and Marcus.

8. Static mapping/fingerprints/audio integrity pass.

9. Existing safety audio remains intact.

10. Timer behavior is independent from voice playback.

11. Malformed/pending artifact recovery UI is complete.

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

Do not mark this stage complete if:

- the valid live replay still stops at snapshot;
- V2 required cues are text-only;
- V2 audio exists for only one voice;
- persisted V2 output still relies on NaN-to-null conversion;
- malformed artifact recovery still exposes only parser behavior without a user-facing internal recovery path.

# STAGE DECISIONS

At the end of the report, state exactly one:

- `STAGE 3D-B.2E-A.1 COMPLETE`
- `STAGE 3D-B.2E-A.1 BLOCKED`

Also state one for each:

- `LIVE V2 SNAPSHOT ASSESSMENT PROFILE CHAIN VERIFIED`
- `LIVE V2 ARTIFACT CHAIN BLOCKED`

- `V2 JSON-SAFE NO-MEASUREMENT VERIFIED`
- `V2 JSON-SAFE NO-MEASUREMENT BLOCKED`

- `V2 VOICE TEXT PARITY VERIFIED`
- `V2 VOICE TEXT PARITY BLOCKED`

- `V2 MALFORMED-ARTIFACT RECOVERY IMPLEMENTED`
- `V2 MALFORMED-ARTIFACT RECOVERY BLOCKED`

Also state exactly one:

- `STAGE 3D-B.2E-A SOFTWARE COMPLETION VERIFIED`
- `STAGE 3D-B.2E-A SOFTWARE COMPLETION BLOCKED`

Also state exactly one:

- `SOFTWARE READY FOR PHYSICAL-DEVICE VALIDATION`
- `SOFTWARE NOT READY FOR PHYSICAL-DEVICE VALIDATION`

Use ready only if:

- valid live replay reaches frozen profile;
- active voice parity is complete for both voices;
- timers/retries remain deterministic;
- no non-finite V2 persistence exists;
- recovery is complete;
- no unresolved P0/P1 software defect remains.

Also state:

- `PHYSICAL DEVICE VALIDATION NOT PERFORMED`
- `PHYSICAL DEVICE VALIDATION REQUIRED`
- `STAGE 3D-B.2D.2C REMAINS BLOCKED PENDING PHYSICAL-DEVICE VALIDATION`
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
- Exact prior `v2_assessment_raw_incomplete` cause.
- Corrected live artifact-chain result.
- Negative incomplete-headline result.
- V2 no-measurement representation.
- Deep JSON-safety result.
- Approved voice source used.
- V2 cue count.
- V2 required asset count.
- Dry-run counts.
- Provider-call count.
- Clara generated/reused/missing.
- Marcus generated/reused/missing.
- Existing safety-audio result.
- V2 audio integrity/static mapping/fingerprint result.
- Runtime voice/timer sequencing result.
- Recovery classifier/UI result.
- Diagnostics result.
- Files changed.
- Binary assets generated.
- Tests added/changed.
- Targeted validation result.
- Full-suite result.
- App typecheck.
- Website typecheck.
- Expo config.
- Expo export.
- `git diff --check`.
- Confirmation that Stage 3D-B.2A/2B/2C/2D.1/2D.2A/2D.2B/2E-A, Stage 2A.1, Stage 3B/3C/3D, Stage 4, Stage 5, navigation, TypeScript boundaries, progression policies, optional containment, and safety audio remain green.
- Remaining Stage 3D-B work.
- `STAGE 3D-B.2E-A.1 COMPLETE` or blocked.
- Artifact-chain verdict.
- JSON-safety verdict.
- Voice/text verdict.
- Recovery verdict.
- `STAGE 3D-B.2E-A SOFTWARE COMPLETION VERIFIED` or blocked.
- `SOFTWARE READY FOR PHYSICAL-DEVICE VALIDATION` or not ready.
- `PHYSICAL DEVICE VALIDATION NOT PERFORMED`.
- `PHYSICAL DEVICE VALIDATION REQUIRED`.
- `STAGE 3D-B.2D.2C REMAINS BLOCKED PENDING PHYSICAL-DEVICE VALIDATION`.
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
