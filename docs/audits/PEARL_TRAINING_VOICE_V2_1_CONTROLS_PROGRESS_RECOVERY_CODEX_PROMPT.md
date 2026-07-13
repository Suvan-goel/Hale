# Codex Prompt: Pearl Training Voice V2.1 Controls, Progress, Transitions, and Recovery Runtime Integration

Read this entire prompt before changing anything.

Pearl’s Training Voice V2.1 live safety-family integration has now been implemented.

Reported current state:

```text
Safety integration verdict:
TRAINING_VOICE_V2_1_LIVE_SAFETY_INTEGRATION_SOFTWARE_COMPLETE

Training Voice V2.1 safety ready:
true

IR-VOICE-SAFETY-SUBSUMPTION:
removed from active V2.1 contracts

Training Voice V2.1 feature:
default off

Training Voice V2.1 audio ready:
false

Training Voice V2.1 global behaviour ready:
false

V2.1 selectable exercises:
0

Balance V2:
default closed / audio pending

Step-up alternation:
default off

Floor V2.1:
default off

Human listening:
waived, not completed

Physical-device QA:
deferred
```

The exact next phase is:

```text
Training Voice V2.1 controls, progress, transitions, and recovery
runtime integration
```

This phase must complete the remaining **training-session behaviour layer**:

- audible countdown/go and active-start alignment,
- pause/resume,
- Repeat Instructions,
- retry,
- skip,
- cancellation and state exit,
- accepted-rep SFX authority,
- timed progress cues,
- times-up,
- side/round transitions,
- set/rest/last-set/next-exercise/session-completion transitions,
- tracking-loss and recovery,
- deferred reactive safety/control requirements,
- stale-callback protection,
- mounted voice switching,
- local/backend restore,
- and live default-closed runtime integration.

It must not generate audio.

It must not implement Micro-Check Voice V2.1.

---

# 1. Mandatory entry baseline

The previous safety-integration summary confirmed:

- typecheck,
- 6 focused suites / 91 tests,
- and the safety audit harness.

It did **not** explicitly confirm all requested entry gates.

Before editing production code, run and record:

```bash
npm run verify:audio
npx tsc --noEmit --pretty false
node scripts/audits/audit-training-voice-v21-live-safety-integration.mjs
```

Also run the current focused Training Voice V2.1/safety suites and the repository full Jest command if practical.

## Baseline rule

If a relevant Training Voice V2.1, safety, audio-verification, or typecheck failure exists before this task:

- do not layer new runtime work over an unresolved relevant failure;
- identify whether it is caused by current source drift or an incomplete prior phase;
- return `CURRENT_SOURCE_REBASE_REQUIRED` or `REMEDIATION_REQUIRED` with exact evidence.

An unrelated pre-existing failure may be documented without being modified, but do not conceal it.

The final task validation must rerun all required checks.

---

# 2. Source artifacts to read

## Latest safety integration

Read the current generated artifacts, expected to include:

- `docs/audits/PEARL_TRAINING_VOICE_V2_1_SAFETY_INTEGRATION_IMPLEMENTATION.md`
- `docs/audits/PEARL_TRAINING_VOICE_V2_1_SAFETY_INTEGRATION_AUDIT.md`
- `docs/audits/PEARL_TRAINING_VOICE_V2_1_SAFETY_INTEGRATION_AUDIT.json`
- `docs/audits/PEARL_TRAINING_VOICE_V2_1_SAFETY_FAMILY_MATRIX.csv`
- `docs/audits/PEARL_TRAINING_VOICE_V2_1_SAFETY_CUE_MIGRATION.csv`
- `docs/audits/PEARL_TRAINING_VOICE_V2_1_SAFETY_RUNTIME_SCENARIOS.csv`
- `docs/audits/PEARL_TRAINING_VOICE_V2_1_SAFETY_COMPOSED_TIMELINES.csv`
- `docs/audits/PEARL_TRAINING_VOICE_V2_1_SAFETY_ASSET_REQUIREMENTS.csv`
- `docs/audits/PEARL_VOICE_PROJECT_POST_SAFETY_INTEGRATION_HANDOFF.md`
- `scripts/audits/audit-training-voice-v21-live-safety-integration.mjs`

If the generated names differ, locate the exact current artifacts by their safety-integration prefix.

The safety cue migration is required input for the reactive-control/recovery mapping in this phase.

## Training Voice V2.1 foundation

- `docs/audits/PEARL_TRAINING_VOICE_V2_1_FOUNDATION_IMPLEMENTATION.md`
- `docs/audits/PEARL_TRAINING_VOICE_V2_1_FOUNDATION_AUDIT.md`
- `docs/audits/PEARL_TRAINING_VOICE_V2_1_FOUNDATION_AUDIT.json`
- `docs/audits/PEARL_TRAINING_VOICE_V2_1_EXERCISE_CONTRACTS.csv`
- `docs/audits/PEARL_TRAINING_VOICE_V2_1_ASSET_REQUIREMENTS.csv`
- `docs/audits/PEARL_TRAINING_VOICE_V2_1_RUNTIME_READINESS.csv`
- current source under `src/training/voiceV21/`

## Completed training behaviour foundations

Read current production code and reports for:

- both-sides rounds and dose preservation,
- step-up alternation and runtime integration,
- step-up evidence closure,
- floor-transfer readiness and final-position setup,
- current `TrainingSetRuntime` abstraction,
- current training active-state serialization,
- current shared main-plan initial-side seed.

At minimum inspect:

- `src/training/bothSidesRounds/`
- `src/training/stepUpAlternation/`
- `src/training/setRuntime.ts`
- floor readiness/final-position modules
- their tests and handoffs

## Completed check-up voice runtime

Read current MPV2 tracked voice/runtime code and reports as an architectural reference:

- `src/audio/voicePlayer.ts`
- current MPV2 voice runtime
- current stage/scope cancellation
- current audible-go boundary
- current tracking recovery
- current mounted voice switching

Do not copy a check-up-specific state machine blindly, but reuse shared tracked-playback principles.

## Approved V2.1 specification

Read:

- `docs/specs/PEARL_VOICE_EXPERIENCE_SPEC_V2_1.md`
- `docs/specs/PEARL_VOICE_EXPERIENCE_SPEC_V2_1.json`
- `docs/specs/PEARL_VOICE_SCRIPT_REVIEW_V2_1.md`
- `docs/specs/PEARL_VOICE_SCRIPT_MANIFEST_V2_1.csv`
- `docs/specs/PEARL_VOICE_COMPOSED_TIMELINES_V2_1.csv`
- `docs/specs/PEARL_VOICE_APPROVED_DECISIONS_V2_1.md`
- `docs/specs/PEARL_VOICE_CLARA_PREVIEW_PACK_PLAN_V2_1.md`

The approved scripts and policy classes remain authoritative for software planning.

## Review status

Use:

```text
Training Voice V2.1 scripts:
founder_assumed_accepted_for_implementation

Human audio listening:
waived, not completed

Audio approval:
not granted

Physical-device QA:
deferred
```

Do not claim human audio approval.

---

# 3. Approved logical cue contract for this phase

Use the exact V2.1 scripts below unless current approved artifacts already contain an exact later revision.

## Countdown and active stop

```text
countdown-three
Three.

countdown-two
Two.

countdown-one
One.

go
Go!

times-up-v21
Time.
```

## Optional progress

```text
halfway-v21
Halfway.

five-seconds-left-v21
Five seconds left.
```

## Controls

```text
paused-v21
Paused.

resuming-v21
Resuming.

retry-v21
Let's try that again.

training-skip-v21
Skipped. Moving on.
```

## Tracking recovery

```text
tracking-loss-v21
Pause. Return to the setup position.

tracking-recovered-v21
You're back in position. We'll restart.
```

## Training transitions

```text
set-complete-v21
Set complete.

rest-now-v21
Rest now.

last-set-v21
Last set.

next-exercise-v21
Next exercise.

session-complete-v21
Session complete.
```

## Shared side/round transitions

Use current exact logical side-switch contracts, including where applicable:

```text
switch-legs-v21
Switch legs.

switch-foot-positions-v21
Switch foot positions.

switch-sides-v21
Switch sides.
```

Use the current step-up start-lead and wrong-lead correction logical cues from the completed step-up phase.

## No new spoken cancel line

Session cancel/exit remains a visible control unless a current approved V2.1 cue already exists.

Do not invent a new cancel recording in this task.

## Repeat Instructions

There is no generic “repeating” cue requirement.

Repeat Instructions replays the current exact instruction plan:

- exact exercise instruction,
- current side/lead context,
- current target.

It excludes:

- universal safety,
- already introduced equipment-family safety,
- total set count,
- unrelated progress or transition cues.

---

# 4. Objective

Implement one canonical default-closed training voice runtime that guarantees:

1. The training controller remains authoritative for exercise/session state.
2. Voice follows accepted controller transitions rather than inventing exercise state.
3. Voice may gate an upcoming boundary, but it does not retroactively decide whether a set, rep, side, or item completed.
4. Only one voice runtime owns a session.
5. Legacy voice remains the live default.
6. Internal V2.1 never mixes legacy and V2.1 voice.
7. Required instruction/safety/control sequences use tracked speech.
8. Required sequence memory updates only after full tracked completion.
9. State exit cancels stale work.
10. Old callbacks cannot affect a new item, set, side, attempt, control transaction, or voice channel.
11. Training countdown is:
    - Three
    - Two
    - One
    - Go
12. Active training starts from the `go` playback-start event.
13. Active training never starts from `speak()` dispatch, countdown scheduling, cue completion, or a blind fixed delay.
14. Missing `go` audio or playback-start failure prevents active start.
15. Pause stops/freezes the canonical current runtime immediately according to its existing safe semantics.
16. The pause cue confirms the already accepted pause.
17. Resume never jumps directly into active work.
18. Resume returns through the correct setup/final-position boundary and a fresh countdown where required.
19. Repeat Instructions never resumes a paused session.
20. Repeat Instructions cannot be requested during active work unless the canonical controller first enters a safe state.
21. Retry creates one fresh attempt/transaction.
22. Retry preserves already accepted work that current behaviour foundations explicitly preserve.
23. Retry never credits partial work twice.
24. Rapid retry taps cannot create duplicate countdowns or attempts.
25. Skip applies to the current exercise/item under existing product semantics.
26. Skip never creates progression credit for the skipped item.
27. Skip confirmation completes before the next required item setup begins.
28. Cancel/exit stops all voice and invalidates callbacks.
29. Accepted rep SFX remains the only default rep feedback.
30. No spoken rep-by-rep counting is added.
31. No default “two reps left” cue is added.
32. Timed progress follows the approved exact schedule.
33. Optional progress never delays active timing.
34. Optional progress drops if the channel is busy.
35. Missed progress is never replayed late.
36. Progress cannot cross attempt, side, set, item, pause, tracking-loss, or state boundaries.
37. `times-up-v21` stops a timed active window at the canonical end boundary.
38. Times-up interrupts optional progress.
39. Set/round/item/session transitions are deterministic and nonredundant.
40. A both-sides first-side completion does not announce set completion or rest.
41. A both-sides side switch uses the exact semantic side transition and fresh setup/countdown.
42. A both-sides round completes only after the second side.
43. Step-up accepted reps use SFX only.
44. Step-up wrong-lead correction is not spoken after every normal rep.
45. Floor pause/retry/recovery reuses the completed floor capability and floor-session memory without repeating the long transition unnecessarily.
46. Tracking loss during active work stops/invalidate the current partial attempt immediately.
47. Tracking loss during ordinary setup uses setup/readiness behavior rather than a false active-stop episode.
48. One tracking-loss cue is allowed per recovery episode.
49. Repeated loss events in one episode are deduplicated.
50. Stable recovery preserves current item/set/side/lead semantics.
51. A recovered active attempt uses a fresh full countdown.
52. Partial timed/hold/ROM work is not silently resumed unless an existing runtime explicitly proves safe resume semantics.
53. Previously accepted reps remain preserved where the current runtime supports them.
54. Equipment/support/health reactive requirements from the safety migration receive an explicit runtime destination.
55. Pearl does not claim automatic detection for an event that current production cannot detect.
56. Pain/dizziness/unwell stop semantics never auto-resume.
57. Equipment-shift stop semantics require correction and explicit retry before a fresh setup.
58. Tracking loss may recover after stable readiness.
59. Mounted Clara/Marcus switching never mixes voices inside one required sequence.
60. A voice change during countdown restarts at Three.
61. A voice change during active work is deferred to a safe boundary.
62. A voice change during paused/setup/recovery state replays the complete current required sequence where necessary.
63. Local restore does not auto-start active work.
64. Restore does not mark an in-flight control/recovery cue completed.
65. Restore does not replay already accepted reps, sides, sets, or completion events.
66. Backend compact state preserves the safe V2.1 control/progress/recovery envelope where current architecture supports active training sync.
67. Generated, short, restart, supporting, manual, and Explore sessions use the same internal V2.1 behavior when an internal ready context is injected.
68. A substituted final exercise uses its own controls/progress/safety/recovery contract.
69. All active Training Voice V2.1 contracts no longer retain:
    - `IR-VOICE-TRAINING-CONTROLS`
    - `IR-VOICE-TRAINING-RECOVERY`
    after genuine completion.
70. `IR-VOICE-AUDIO-ASSETS` remains.
71. `IR-VOICE-NEW-CUE-SCHEMA` remains until the later schema/manifest phase where currently applicable.
72. Training Voice V2.1 audio ready remains false.
73. Training Voice V2.1 feature remains default off.
74. V2.1 selectable exercise count remains zero.
75. Training Voice V2.1 behaviour ready is recomputed from current blockers rather than hard-coded.
76. The expected successful behavior-ready value is true if no training behavior blocker remains.
77. Balance V2 remains default closed/audio pending.
78. Step-up alternation remains default off.
79. Floor V2.1 remains default off.
80. No audio is generated or changed.
81. The exact next phase becomes:
    - Micro-Check Voice V2.1 implementation.

---

# 5. Strict scope

## In scope

- Training countdown/go integration.
- Training active-start boundary.
- Training pause/resume.
- Training Repeat Instructions.
- Training retry.
- Training skip.
- Training cancel/state exit voice cancellation.
- Active progress scheduler.
- Rep-credit SFX authority verification.
- Times-up.
- Set/round/rest/last-set/item/session transitions.
- Both-sides transition voice integration.
- Step-up transition/correction voice integration.
- Floor control/recovery integration.
- Tracking-loss/recovery runtime.
- Deferred reactive safety/control migration.
- Mounted voice switching.
- Required/optional failure semantics.
- UI state needed for the default-closed internal runtime.
- Local serialization/restore.
- Backend compact-state sync/restore where currently supported.
- Generated/manual/Explore path parity.
- Runtime readiness/blocker reconciliation.
- Logical asset requirements.
- Timing audit.
- Focused tests.
- Post-implementation audit.
- Handoff to Micro-Check Voice V2.1.

## Out of scope

Do not implement:

- Micro-Check Voice V2.1,
- Movement Check-Up changes,
- new Balance V2 audio,
- audio generation,
- ElevenLabs calls,
- runtime TTS,
- physical manifest entries for nonexistent assets,
- final cue-schema retirement,
- deletion of legacy cues/assets,
- human listening review,
- physical-device QA,
- enabling Training Voice V2.1,
- enabling Balance V2,
- enabling step-up alternation by default,
- enabling floor V2.1 by default,
- exercise prescription changes,
- progression-threshold changes,
- release-policy changes,
- new medical claims,
- package installation,
- lockfile changes,
- destructive Git operations.

This is the final major **training behavior** phase, not the final audio/schema/device phase.

---

# 6. Worktree safety

The repository is heavily dirty and contains important uncommitted work.

Before editing, record:

```bash
git status --short --branch
git diff --name-only
git diff --stat
git diff -- assets/audio
```

Record:

- branch,
- full and short `HEAD`,
- upstream,
- whether the worktree was already dirty,
- pre-existing relevant diffs,
- pre-existing untracked audio/audit files.

Rules:

1. Treat all current work as user-owned.
2. Do not reset, checkout, stash, clean, rebase, or discard anything.
3. Do not delete or rename existing audio.
4. Do not overwrite unrelated renderer, check-up, profile, backend, website, or audit work.
5. Do not regenerate physical manifests wholesale.
6. Do not commit or push.
7. Inspect current diffs before changing a modified file.
8. Make the smallest safe edits.
9. At completion distinguish this task’s footprint from pre-existing changes.

---

# 7. Current source to inspect

Follow actual current imports and runtime call paths.

## Training session runtime

At minimum inspect:

- `src/training/sessionPlayer.ts`
- `src/training/setRuntime.ts`
- `src/screens/TrainingSessionScreen.tsx`
- current `SetUpdate`, `SetResult`, and voice-update types
- current countdown and active clocks
- current rest timer
- current pause/resume/skip/cancel/repeat controls
- current accepted controller action path
- current session-completion path
- current rep SFX path
- current app-state/background handling
- current mounted voice preference path

## Training Voice V2.1

Inspect every current file under:

```text
src/training/voiceV21/
```

At minimum:

- `types.ts`
- `contracts.ts`
- `targetGrammar.ts`
- `safetyPolicy.ts`
- `sequencePlanner.ts`
- `readiness.ts`
- `runtime.ts`
- `assets.ts`
- `index.ts`
- tests

## Audio runtime

- `src/audio/voicePlayer.ts`
- `src/audio/cues.ts`
- `src/audio/manifest.ts`
- SFX channel implementation
- tracked playback-start/completion/cancellation APIs
- mounted voice switching helpers

## Progress and graders

- `src/exercises/setGraders.ts`
- current rep, hold, timer, and ROM graders
- current active elapsed-time source
- `src/training/validTimeProgression.ts`
- current progress cue emission
- current times-up handling

## Completed behavioral modules

- `src/training/bothSidesRounds/`
- `src/training/stepUpAlternation/`
- floor readiness/final-position modules
- current runtime selectors
- current feature/readiness gates

## Safety migration

- latest V2.1 safety cue migration CSV
- `src/training/safetyCueDefinitions.ts`
- `src/training/safetyCues.ts`
- current active/recovery cue ids
- current safety-profile runtime events

## Generation and entry paths

- `src/training/workoutGeneration.ts`
- `src/training/dynamicState.ts`
- `src/training/dailyTrainingContext.ts`
- `src/pearlFlow/sessionPlanning.ts`
- manual ladder practice
- Explore ladder/preset planning
- restored generated sessions
- short/restart/supporting sessions

## Persistence/backend

- `src/training/serialize.ts`
- active training state
- backend training-state sync
- restore service
- duplicate/merge helpers
- account export where relevant

Search broadly for:

```text
pause
resume
retry
repeat
skip
cancel
tracking
recovery
countdown
go
times-up
halfway
five-seconds-left
set-done
rest-now
last-set
next-exercise
session-complete
playRepSound
rep-credit
progress
activeElapsed
speakTracked
playbackStart
stateEpoch
scope
VoiceChannel
voiceId
AppState
IR-VOICE-TRAINING-CONTROLS
IR-VOICE-TRAINING-RECOVERY
reactiveCueIdsDeferred
```

---

# 8. Controller authority boundary

The canonical training controller/set runtime remains the authority for:

- accepted reps,
- set completion,
- side completion,
- round completion,
- rest state,
- item completion,
- skip,
- pause,
- retry/reset,
- session completion,
- progression,
- persistence.

The voice runtime owns:

- speech planning,
- speech sequencing,
- speech gating,
- countdown/go playback boundary,
- optional progress scheduling,
- voice-scope cancellation,
- voice-specific memory,
- visible audio failure state.

## Required rule

Every voice event must be based on an accepted canonical controller transition.

A suitable event envelope is:

```ts
export interface TrainingVoiceRuntimeEventV21 {
  eventId: string;
  acceptedAtMs: number;

  sessionId: string;
  sessionEpoch: number;

  itemId: string | null;
  itemEpoch: number;

  setId: string | null;
  setIndex: number | null;
  setEpoch: number;

  attemptId: string | null;
  attemptEpoch: number;

  type: TrainingVoiceRuntimeEventTypeV21;
  payload?: unknown;
}
```

Equivalent repository-consistent naming is acceptable.

## Prohibited

Do not let React effect order or voice callback order decide:

- whether a rep counts,
- whether a set ended,
- whether a skip was accepted,
- whether a tracking interruption invalidated an attempt,
- whether a side completed,
- or whether progression advances.

Voice may delay the next boundary, but not rewrite accepted history.

---

# 9. Canonical runtime phases and scopes

Extend the current `TrainingVoiceRuntimeV21`.

A suitable phase model is:

```ts
export type TrainingVoicePhaseV21 =
  | 'idle'
  | 'session_entry'
  | 'item_setup'
  | 'repeat_instructions'
  | 'countdown'
  | 'active'
  | 'paused'
  | 'tracking_recovery'
  | 'reactive_safety_stop'
  | 'rest_transition'
  | 'item_transition'
  | 'session_completion'
  | 'audio_failure'
  | 'cancelled';
```

Use stable scopes such as:

```text
training:session:entry
training:item:<itemId>:setup
training:item:<itemId>:set:<setIndex>:countdown
training:item:<itemId>:set:<setIndex>:attempt:<attemptId>:active
training:item:<itemId>:control:<controlId>
training:item:<itemId>:recovery:<recoveryId>
training:item:<itemId>:rest:<restId>
training:item:<itemId>:transition:<transitionId>
training:session:complete
```

## Requirements

- One required voice scope owns progression at a time.
- Optional progress has an attempt-scoped identity.
- Scope exit cancels tracked work.
- Old callbacks are ignored by scope/epoch.
- A control transaction resolves once.
- A recovery episode resolves once.
- A transition resolves once.
- A completion cue cannot replay into a later screen/session.

---

# 10. Audible countdown and active-start contract

Implement training countdown through the tracked runtime.

## Sequence

```text
countdown-three
countdown-two
countdown-one
go
```

## Cadence

Use the existing shared/MPV2 countdown cadence where technically appropriate.

Do not build a second subtly different countdown engine if a reusable helper exists.

## Start boundary

The canonical active set/side/attempt begins from:

```text
go playback-start callback
```

not:

- request dispatch,
- cue scheduling,
- cue completion,
- an internal silent timer,
- or a fixed guessed audio delay.

## Active-start action

Use one explicit action, such as:

```text
training_go_playback_started
```

with:

- scope id,
- attempt id,
- set id,
- playback request id,
- voice generation/channel id,
- monotonic timestamp.

## Failure

If `go`:

- is missing,
- fails resolution,
- fails player creation,
- fails playback start,
- times out,
- is cancelled,
- or belongs to a stale scope,

then:

- active work does not begin,
- countdown state becomes a visible internal audio failure,
- Retry is available,
- no silent fallback starts the set.

## Voice switch

A voice switch during countdown:

- cancels the old countdown,
- invalidates old `go`,
- rebuilds/switches channel,
- restarts at Three in the new voice.

## Device boundary

The callback proves software playback start, not physical speaker onset.

Keep actual audible-onset measurement as deferred P3 device QA.

---

# 11. Control contracts

Create one explicit control contract table in production.

A suitable type is:

```ts
export type TrainingVoiceControlV21 =
  | 'pause'
  | 'resume'
  | 'repeat_instructions'
  | 'retry'
  | 'skip'
  | 'cancel';

export interface TrainingVoiceControlContractV21 {
  control: TrainingVoiceControlV21;
  logicalCueKey: string | null;
  exactScript: string | null;
  policyId: 'result_transition' | 'instruction';
  requiredness:
    | 'required_before_next_boundary'
    | 'optional_transition'
    | 'silent_state_exit';
  allowedPhases: readonly TrainingVoicePhaseV21[];
  actionSemantics: string;
}
```

Equivalent naming is acceptable.

## Pause

Script:

```text
paused-v21
Paused.
```

Rules:

- canonical player/set runtime pauses or retires unsafe partial work immediately;
- speech confirms the accepted pause;
- the app is already paused before the cue plays;
- pause cancels countdown/progress/setup speech as appropriate;
- paused state cannot begin active work;
- duplicate pause taps create one transaction;
- missing pause audio does not resume work;
- visible paused state remains authoritative.

## Resume

Script:

```text
resuming-v21
Resuming.
```

Rules:

- allowed only from canonical paused state;
- does not directly enter active work;
- returns to the correct setup/final-position/recovery boundary;
- active/countdown-paused work receives a fresh countdown;
- accepted reps and already completed sides/rounds remain preserved according to current runtime semantics;
- unsafe partial work is not credited twice;
- rest-paused behavior follows the current canonical rest semantics;
- duplicate resume taps create one transaction.

## Repeat Instructions

Rules:

- available only in safe setup/paused/error states;
- unavailable during active work and critical countdown;
- does not automatically pause an active set;
- replays:
  - exact current exercise instruction,
  - current side/lead context,
  - current target;
- excludes:
  - universal safety,
  - introduced family safety,
  - total set count,
  - progress,
  - completion,
  - unrelated recovery;
- does not mutate first-use/family completion memory;
- does not itself start countdown;
- after completion the canonical controller re-evaluates current readiness;
- if invoked while paused, the session remains paused.

## Retry

Script:

```text
retry-v21
Let's try that again.
```

Rules:

- creates a new control transaction and fresh attempt id where required;
- cancels current failed/stale scope;
- preserves accepted prior work according to:
  - generic rep set,
  - both-sides round,
  - step-up alternation,
  - floor setup,
  - timed/hold/ROM semantics;
- does not reuse partial current attempt work;
- `retry-v21` is an optional transition confirmation;
- failure of `retry-v21` itself does not skip the required setup/instruction/countdown;
- rapid taps create one retry;
- retry from required audio failure replays the full required sequence.

## Skip

Script:

```text
training-skip-v21
Skipped. Moving on.
```

Rules:

- canonical controller accepts the skip first;
- current item is marked skipped using existing product semantics;
- no progression credit is created for skipped work;
- next required item setup waits for the skip transition or visible fallback;
- because the script already says “Moving on,” do not also speak `next-exercise-v21` immediately after it;
- if the skipped item is the final item, session completion may follow;
- duplicate skip taps create one skip;
- stale pre-skip callbacks cannot complete the skipped item.

## Cancel/exit

Rules:

- no new spoken line;
- cancel every voice scope;
- invalidate all callbacks;
- stop countdown/progress/recovery;
- preserve canonical saved work according to current exit semantics;
- do not speak a stale completion after navigation.

---

# 12. Pause/resume semantics by runtime type

Do not use one unsafe generic resume rule.

Reconcile and encode the actual safe semantics for:

## Generic rep sets

- accepted reps remain;
- an incomplete current rep is discarded;
- resume starts from setup/readiness;
- expected remaining reps remain accurate;
- fresh countdown before active rep counting.

## Step-up alternation

- preserve accepted rep count,
- preserve 6/6 side counts,
- preserve expected lead,
- discard partial current rep,
- return to both-feet-floor readiness,
- fresh countdown.

## Both-sides rounds

- preserve completed side/round results,
- discard partial current side attempt,
- resume the same semantic side,
- do not replay completed opposite-side dose,
- fresh side setup/countdown.

## Timed/hold sets

Preferred safe rule:

- if current runtime does not explicitly prove resumable elapsed-time semantics,
  restart the current set/side segment from zero;
- do not add partial pre-pause time;
- preserve completed prior sets/sides.

Do not silently extend or shorten programmed dose.

## ROM/capture windows

- discard partial current window,
- preserve accepted earlier rounds/sets,
- fresh setup/countdown.

## Floor setup/active

- preserve canonical capability and session floor memory,
- re-establish actual floor/final position,
- do not repeat the long floor transition unless the environment genuinely reset,
- fresh countdown.

Document the exact final behavior for every current set runtime.

---

# 13. Progress scheduler

Create one pure scheduler.

A suitable API is:

```ts
export interface TrainingVoiceProgressEventV21 {
  eventId: string;
  dueAtActiveElapsedMs: number;
  logicalCueKey: 'halfway-v21' | 'five-seconds-left-v21';
  policyId: 'low_reassurance';
}

export interface TrainingVoiceProgressPlanV21 {
  setType: string;
  targetMs: number | null;
  events: readonly TrainingVoiceProgressEventV21[];
  reasonCodes: readonly string[];
}

resolveTrainingVoiceProgressPlanV21(input): TrainingVoiceProgressPlanV21
```

## Approved rules

### Rep sets

```text
Accepted rep SFX only.
No spoken rep count.
No default two-reps-left cue.
```

### 15-second holds/timers

```text
Five seconds left at 10 seconds.
```

### 20-second holds

```text
Halfway at 10 seconds.
Five seconds left at 15 seconds.
```

### 30-second timed windows

```text
Halfway at 15 seconds.
Five seconds left at 25 seconds.
No ten-seconds-left cue.
```

### 12- or 14-second ROM windows

```text
No progress cue.
End/return cue only.
```

### Short converted both-sides targets

Examples currently include:

- 6,000 ms,
- 7,500 ms,
- 10,000 ms,
- 15,000 ms.

Rules:

- 15,000 ms uses `five-seconds-left-v21` at 10,000 ms.
- 6,000 ms, 7,500 ms, and 10,000 ms receive no default progress cue.
- Do not round them to a nearby approved schedule.
- Do not add a cue merely to fill silence.

### Other final targets

- Use only an explicit current contract schedule.
- Otherwise use no spoken progress.
- Progress is optional, so an unsupported optional schedule does not block the movement.

## Timing source

Progress is anchored to:

```text
active attempt start from go playback-start
```

Use monotonic elapsed time.

## Optional behavior

- does not block controller progression,
- drops if busy,
- never interrupts a higher-priority cue,
- never replays after its due moment,
- fires at most once,
- is cancelled on:
  - pause,
  - tracking loss,
  - retry,
  - side switch,
  - set completion,
  - skip,
  - state exit,
  - voice scope replacement.

## Voice duration differences

Clara/Marcus duration cannot change the controller state outcome.

---

# 14. Rep-credit SFX

Preserve one SFX authority for each runtime.

## Generic rep sets

Use the current accepted canonical rep event.

## Step-up alternation

Use only the completed step-up alternation accepted event.

The generic grader must remain suppressed in the internal step-up path.

## Both-sides rep rounds

- accepted reps may play SFX,
- side segments do not create duplicate SFX,
- round/set aggregation does not replay SFX.

## Rules

- one SFX per accepted rep,
- no SFX for rejected, stale, duplicate, interrupted, or wrong-lead attempts,
- no spoken count,
- optional voice progress is not used for rep sets,
- SFX may use its independent channel,
- set-completion voice cannot cause another rep SFX.

---

# 15. Times-up and active-window close

Use:

```text
times-up-v21
Time.
```

Policy:

```text
critical_stop
```

## Rules

- canonical active window stops at the accepted monotonic end boundary;
- speech does not cause the stop;
- `times-up-v21` confirms the stop;
- it interrupts optional progress;
- later progress callbacks are stale;
- no active time continues while the cue plays;
- no duplicate times-up for one attempt;
- tracking loss and times-up use explicit controller event precedence;
- same-frame ties are deterministic.

## Transition de-duplication

Avoid voice saturation.

Use a transition matrix:

### Rep-target set

```text
target accepted
→ set-complete-v21
→ rest-now-v21 if canonical rest follows
```

### Timed/hold/ROM window

```text
times-up-v21
→ rest-now-v21 if canonical rest follows
```

Do not automatically add redundant `set-complete-v21` after `Time.` unless current approved product logic requires it.

### Final set of a nonfinal exercise

Use no more than:

- one completion/stop cue,
- and one next-action cue.

### Final session item

Use:

```text
session-complete-v21
```

after canonical session completion/persistence.

Do not stack:

```text
Time.
Set complete.
Complete.
Next exercise.
Session complete.
```

Create a deterministic transition planner and audit redundancy.

---

# 16. Rest, last-set, item, and session transitions

Create a pure planner such as:

```ts
planTrainingVoiceTransitionV21(input): TrainingVoiceTransitionPlanV21
```

The input must include accepted controller state:

- set type,
- current set index,
- set count,
- round state,
- side state,
- item index,
- item count,
- rest state,
- skip state,
- session completion state.

## Nonfinal set/round

- announce accepted completion/stop once;
- use `rest-now-v21` only when canonical rest follows;
- rest begins from a defined boundary.

Preferred rest boundary:

```text
rest-now-v21 playback-start
```

If the current architecture uses another canonical rest boundary, preserve it and prove the full programmed rest is not shortened by speech.

Do not consume rest silently while a required pre-rest cue plays.

## Last set

Use:

```text
last-set-v21
```

only when:

- entering the final set/round of a multi-set/multi-round exercise,
- after at least one earlier set/round completed.

Do not say `Last set.` for a one-set exercise.

It may be part of the later-set required setup sequence.

## Both-sides first side

- no `set-complete-v21`,
- no `rest-now-v21`,
- use semantic side-switch cue and next-side setup,
- fresh final-position/readiness and countdown.

## Both-sides second side

- round becomes the completed set unit,
- then normal set/rest transition applies.

## Final set of nonfinal item

- transition to the next exercise once,
- use `next-exercise-v21` where it adds useful eyes-off context,
- do not pair it redundantly with skip’s “Moving on.”

## Session completion

- canonical completion and persistence happen once,
- `session-complete-v21` plays once,
- missing voice does not lose results,
- visible completion remains,
- stale completion cannot cross into a later session,
- no hydration line or excessive praise.

## `item-complete-v21`

Do not automatically use this generic cue in training if it creates duplication.

Retain it for flows that genuinely require it.

---

# 17. Tracking-loss and recovery model

Create one explicit training recovery episode model.

A suitable shape is:

```ts
export interface TrainingVoiceRecoveryEpisodeV21 {
  recoveryId: string;

  sessionId: string;
  itemId: string;
  setId: string;
  attemptId: string;

  setRuntimeKind:
    | 'legacy_generic'
    | 'both_sides_round'
    | 'step_up_alternation'
    | 'floor_v21';

  lossConfirmedAtMs: number;
  sourceAttemptEpoch: number;

  currentSide?: string;
  expectedLead?: 'left' | 'right';

  trackingLossCueRequested: boolean;
  trackingLossCueCompleted: boolean;

  stableRecoveryReached: boolean;
  recoveredCueRequested: boolean;
  recoveredCueCompleted: boolean;

  freshCountdownRequired: true;
}
```

Equivalent naming is acceptable.

## Confirmed loss

Do not trigger a critical recovery episode for every low-confidence frame.

Use the existing confirmed tracking interruption/debounce contract.

## Active loss behavior

Immediately:

1. Stop/freeze/invalidate the current partial attempt according to the canonical set runtime.
2. Cancel optional progress.
3. Cancel active countdown/voice scopes where applicable.
4. Create one recovery id.
5. Emit/plan `tracking-loss-v21` once.
6. Enter visible recovery state.
7. Reject stale current-attempt callbacks.
8. Prevent a new active start until setup/readiness and a fresh countdown complete.

The stop does not wait for speech.

## Setup loss behavior

During ordinary setup:

- continue current setup/readiness prompts;
- do not create a critical active-loss episode unless a measured active attempt had begun.

## Repeated loss

Within one episode:

- no duplicate cue,
- no duplicate invalidation,
- no duplicate attempt count,
- bounded diagnostic only.

A new restarted attempt may create a new episode.

## Stable recovery

After:

- current item visibility,
- current orientation,
- current side/lead,
- final position where required,
- and current runtime-specific readiness

are stable:

- optionally play `tracking-recovered-v21`,
- preserve current semantic side/lead,
- run a fresh full countdown,
- create a new attempt id,
- start from `go` playback start.

## Recovered cue requiredness

`tracking-recovered-v21` follows its approved `setup_recovery` policy:

- visible fallback is allowed if the asset is unavailable,
- it does not replace required setup/final-position/countdown,
- it is not allowed to start active work by itself.

## Partial work

### Rep sets

- preserve accepted reps,
- discard partial current rep.

### Step-up

- preserve accepted counts and expected lead,
- discard partial current rep.

### Both-sides

- preserve completed opposite side/rounds,
- discard partial current side attempt,
- retry the same side.

### Timed/hold/ROM

- restart the current set/side window unless an existing runtime explicitly proves safe resumable semantics.

### Floor

- preserve floor capability and session family memory,
- re-establish actual position,
- no automatic countdown on restore.

---

# 18. Reactive safety/control migration

Read the latest safety cue migration CSV.

Every row classified as:

```text
reactive_control_recovery_later_phase
```

must receive exactly one current destination in this task.

Use a typed model such as:

```ts
export type TrainingVoiceReactiveSafetyDispositionV21 =
  | 'tracking_recovery'
  | 'controller_event_critical_stop'
  | 'explicit_user_report_critical_stop'
  | 'equipment_correction_then_retry'
  | 'health_stop_no_auto_resume'
  | 'preventative_instruction_already_fulfilled'
  | 'legacy_only';

export interface TrainingVoiceReactiveSafetyContractV21 {
  sourceCueId: string;
  exactSourceScript: string;
  disposition: TrainingVoiceReactiveSafetyDispositionV21;
  logicalCueKey: string | null;
  triggerSource: string;
  autoDetectionClaimed: boolean;
  recoveryPolicy: string;
  remainingBlocker: string | null;
}
```

## Required categories

At minimum reconcile:

- tracking pause/reset,
- support moves,
- step/stair moves,
- band slips/shifts,
- door anchor moves,
- band release/controlled return,
- pain/dizziness/unwell stop,
- active equipment correction,
- repeated-set reminders previously stored as safety cues.

## No fake detection

If current production does not emit a reliable event:

- do not claim the camera detected it;
- classify it as:
  - preventative instruction,
  - explicit user report,
  - visible stop rule,
  - or legacy-only;
- do not manufacture an automatic trigger.

## Recovery classes

### Tracking

May recover after stable setup.

### Equipment/support shift

- stop active work immediately when a real controller/user event is accepted;
- require correction;
- require explicit Retry;
- fresh setup/countdown;
- no auto-resume.

### Pain, dizziness, or feeling unwell

- stop/pause according to current canonical health/safety semantics;
- do not auto-resume;
- do not encourage the user to push through;
- preserve visible Exit/End controls;
- no medical diagnosis.

### Preventative requirements

If the exact instruction or completed safety-family line already fulfils the requirement:

- do not create a duplicate reactive cue.

## Blocker removal

`IR-VOICE-TRAINING-RECOVERY` may be removed only when every deferred reactive requirement has a truthful destination.

---

# 19. Event precedence

Use one authoritative monotonic accepted-event order.

Cover at minimum:

- set target before pause,
- pause before set target,
- tracking loss before times-up,
- times-up before tracking loss,
- skip before set completion,
- set completion before skip,
- cancel before completion,
- voice change during required sequence,
- app background during countdown,
- app background during active work.

Recommended rule:

1. An event already accepted by the canonical controller at an earlier monotonic timestamp wins.
2. Later events from the old epoch are stale.
3. Same-timestamp ties use an explicit deterministic precedence.
4. Voice callbacks never override accepted controller order.

Document and test the chosen tie precedence.

---

# 20. Mounted voice switching

Extend current training V2.1 channel lifecycle.

Maintain:

- desired voice id,
- active voice id,
- pending voice id,
- voice generation/channel id.

## Setup/required sequence

- cancel old request,
- rebuild/switch,
- replay the complete current required sequence,
- keep next boundary blocked.

## Countdown

- cancel countdown,
- invalidate old `go`,
- rebuild,
- restart at Three.

## Active work

- do not interrupt the physical set solely for a preference change;
- defer switch to the documented safe boundary;
- current active attempt retains one voice for critical stop/times-up ownership.

## Pause/recovery/rest

- apply at a safe transition,
- cancel incomplete noncritical speech,
- replay required current sequence where needed.

## Progress

- optional old-voice progress may be dropped;
- never replay it in the new voice after its due moment.

## Rapid changes

Only the latest desired voice survives.

No two active channels.

No mixed required sequence.

---

# 21. Failure behavior

Define explicit behavior for every logical category.

## Required setup/countdown/control transition

On:

- missing binding,
- asset resolution failure,
- player creation failure,
- playback-start failure,
- completion timeout,
- cancellation not caused by accepted state exit,

then:

- enter visible V2.1 audio failure state,
- do not cross the gated next boundary,
- expose Retry and appropriate Exit/Skip control,
- do not fall back to a broad legacy cue inside the same V2.1 session.

## Pause

The canonical paused state remains paused even if the confirmation cue fails.

## Resume

Do not cross to setup/countdown until required resume transition/fallback is resolved.

## Skip

The item remains skipped.

Do not silently start the next item if the required transition failed; use visible fallback/Continue according to current UI patterns.

## Completion

Results remain saved.

A missing completion cue does not roll back valid work.

Visible completion is required.

## Progress

Missing progress asset:

```text
silent drop
```

No controller effect.

## Tracking loss

The attempt stops even if the cue fails.

Visible recovery remains.

## Tracking recovered

Visible fallback is allowed.

Fresh setup/countdown remains required.

## Retry cue

The short retry transition itself is optional.

Required setup/countdown after it is not optional.

---

# 22. UI and accessibility

Implement only UI needed for the default-closed internal runtime.

## Control state

Show current state:

- Paused
- Resuming
- Recovering setup
- Audio guidance could not start
- Skipped
- Rest
- Next exercise
- Session complete

## Controls

- Pause
- Resume
- Repeat instructions
- Retry
- Skip exercise
- End session / Cancel

Use current wording where already established.

## Guards

- button disabled state,
- programmatic handler guard,
- rapid-tap deduplication,
- no control relying only on visual disabled state.

## Recovery

Show:

- concise action,
- current side/lead where relevant,
- readiness progress,
- Retry/Skip/Exit where appropriate.

## Accessibility

- accessible roles/labels,
- Dynamic Type tolerance,
- no color-only state,
- current side/lead announced,
- current pause/recovery state announced,
- no technical runtime vocabulary.

Do not redesign the whole training screen.

---

# 23. Persistence and restore

Persist a safe V2.1 runtime envelope.

A suitable shape is:

```ts
export interface SerializedTrainingVoiceRuntimeV21 {
  version: number;
  runtimeMode: 'internal_v21';

  phase: TrainingVoicePhaseV21;

  sessionEpoch: number;
  itemEpoch: number;
  setEpoch: number;
  attemptEpoch: number;

  safetyMemory: unknown;

  pausedOrigin: string | null;

  recoveryEpisode: {
    recoveryId: string;
    itemId: string;
    setId: string;
    sourceAttemptId: string;
    stableRecoveryReached: boolean;
  } | null;

  completedTransitionIds: readonly string[];
  firedProgressEventIds: readonly string[];

  activeVoiceId: string;
  pendingVoiceId: string | null;

  planFingerprint: string;
}
```

Equivalent naming is acceptable.

## Do not persist as completed

- in-flight speech,
- a progress cue merely scheduled,
- an unaccepted control tap,
- an unplayed rest cue,
- a tracking recovery merely detected on one frame,
- a stale `go` callback.

## Restore rules

### Active work

Do not auto-resume.

Return to a safe setup/recovery boundary with a fresh countdown.

### Paused

Restore paused.

Do not speak `Resuming.` automatically.

### Recovery

Restore current item/set/side semantics.

Re-establish readiness.

### Rest

Preserve canonical remaining rest if current product supports it.

Do not shorten rest because speech replayed.

### Completion

Do not emit duplicate completion if it was already accepted/acknowledged.

### Malformed state

Fail closed to the legacy/nonselectable or visible internal error path.

Do not silently mix runtime modes.

## Backend

Use additive compact JSON only where current active training state is already synchronized.

No remote migration unless current architecture truly requires one.

Do not execute remote schema changes.

---

# 24. Generated/manual/Explore path parity

Exercise the internal V2.1 runtime with test readiness injection for:

- normal main-plan session,
- short session,
- restart session,
- supporting session,
- readiness scaling,
- pain substitution,
- equipment substitution,
- equipment skip,
- manual ladder practice,
- Explore ladder start,
- Explore preset start,
- restored generated session.

## Requirements

- final exercise contract drives progress and recovery,
- current target drives progress timing,
- substituted exercise does not retain old progress/safety/recovery plan,
- skipped item does not create stale progress,
- manual/Explore retains existing credit policy,
- main-plan progression remains unchanged,
- feature/default isolation remains intact.

---

# 25. Feature flags and readiness

Prefer using the existing:

```text
EXPO_PUBLIC_ENABLE_TRAINING_VOICE_V2_1
```

Do not add many independent half-activation flags.

If a narrow internal controls/recovery flag is required for development, it must:

- default off,
- be subordinate to the full V2.1 runtime selection,
- never suppress legacy behavior by itself.

## Readiness values

Add or derive:

```text
TRAINING_VOICE_V2_1_CONTROLS_READY
TRAINING_VOICE_V2_1_PROGRESS_READY
TRAINING_VOICE_V2_1_RECOVERY_READY
```

Expected successful values:

```text
controls ready = true
progress ready = true
recovery ready = true
safety ready = true
audio ready = false
feature default = off
selectable exercises = 0
```

## Behaviour ready

Recompute:

```text
TRAINING_VOICE_V2_1_BEHAVIOR_READY
```

Do not hard-code it.

Expected successful value:

```text
true
```

only if no current training behavior requirement remains across active contracts.

The following do not by themselves mean behavior is incomplete:

- physical audio assets pending,
- final cue schema/manifest migration pending,
- human listening pending,
- device QA pending.

If current source still has a genuine training behavior blocker, keep behavior ready false and report it precisely.

## Blocker reconciliation

After genuine completion:

Remove:

```text
IR-VOICE-TRAINING-CONTROLS
IR-VOICE-TRAINING-RECOVERY
```

from every completed active training contract/logical row.

Keep:

```text
IR-VOICE-AUDIO-ASSETS
IR-VOICE-NEW-CUE-SCHEMA
```

where currently applicable.

---

# 26. Asset requirements

Update the logical asset-requirement surface.

At minimum classify:

```text
paused-v21
resuming-v21
retry-v21
training-skip-v21
tracking-loss-v21
tracking-recovered-v21
halfway-v21
five-seconds-left-v21
times-up-v21
set-complete-v21
rest-now-v21
last-set-v21
next-exercise-v21
session-complete-v21
countdown-three
countdown-two
countdown-one
go
```

Also include:

- both-sides side-switch cues,
- step-up start/correction cues,
- any reactive safety logical cue retained after migration.

For every row record:

- exact script,
- category,
- policy,
- requiredness,
- current physical candidate,
- current candidate script,
- Clara exists,
- Marcus exists,
- semantic match,
- reuse decision,
- generation required later,
- timing budget,
- source contracts/events.

Allowed decisions:

```text
reuse_exact_existing_pair
new_pair_required
existing_pair_script_mismatch
not_required
conditional_legacy_only
```

Do not:

- add pending keys to the physical manifest,
- generate assets,
- create placeholders,
- weaken `verify:audio`,
- alias semantically different legacy lines.

---

# 27. Timing budgets

Use the approved V2.1 budgets.

## Control confirmation

```text
target: 2,000 ms
hard max: 3,500 ms
```

## Tracking loss

```text
target: 3,500 ms
hard max: 5,000 ms
```

## Tracking recovery

```text
target: 2,500 ms
hard max: 4,000 ms
```

## Loss + recovery sequence

```text
target: 6,500 ms
hard max: 9,000 ms
```

## Later-set reminder

```text
target: 4,000 ms
hard max: 6,000 ms
```

## Repeat instructions

```text
target: 10,000 ms
hard max: 14,000 ms
```

Model:

- Clara and Marcus,
- exact existing durations where present,
- estimates where assets are pending,
- 0 ms,
- 100 ms,
- 250 ms gaps,
- normal set,
- both-sides side switch,
- step-up wrong-lead correction,
- floor recovery,
- pause/resume,
- tracking loss/recovery,
- set/rest,
- last set,
- skip,
- completion.

Label estimates honestly.

Hard-max failures must be zero for the intended scripts.

---

# 28. Required production tests

Do not weaken or delete existing tests.

## 28.1 Entry baseline regression

1. Existing safety integration audit still passes.
2. Safety ready remains true.
3. `IR-VOICE-SAFETY-SUBSUMPTION` remains absent.
4. Universal/family completion memory remains correct.
5. No legacy/V2.1 double safety.
6. Floor memory bridge remains correct.

## 28.2 Countdown/go

1. Countdown is three/two/one/go.
2. Active starts from go playback-start.
3. Active starts once.
4. Speak dispatch does not start active.
5. Go completion does not define active start.
6. Missing go blocks.
7. Playback-start failure blocks.
8. Countdown cancellation blocks stale go.
9. Pause during countdown cancels.
10. Skip during countdown cancels.
11. Voice switch restarts at three.
12. Old voice go cannot start.
13. App background cancels countdown.
14. Retry uses a fresh countdown.

## 28.3 Pause/resume

1. Pause is accepted before confirmation speech.
2. Active timer/reps stop safely.
3. Pause cue emits once.
4. Duplicate pause is deduplicated.
5. Resume only from paused.
6. Resume cue emits once.
7. Resume does not start active directly.
8. Generic rep accepted counts persist.
9. Partial rep is discarded.
10. Step-up expected lead persists.
11. Both-sides current side persists.
12. Completed opposite side persists.
13. Timed/hold current attempt follows documented restart rule.
14. ROM current window restarts.
15. Floor readiness is re-established.
16. Duplicate resume is deduplicated.
17. Missing pause/resume audio enters visible fallback without unsafe continuation.

## 28.4 Repeat Instructions

1. Available in setup.
2. Available while paused.
3. Not available during active work.
4. Does not auto-pause active work.
5. Replays exact instruction.
6. Replays current side/lead.
7. Replays current target.
8. Does not replay universal safety.
9. Does not replay family safety.
10. Does not speak set count.
11. Does not start countdown by itself.
12. Remains paused when invoked while paused.
13. Stale repeat completion cannot advance a new item.

## 28.5 Retry

1. Retry creates one transaction.
2. Rapid retry taps create one transaction.
3. Retry cue failure does not skip required setup.
4. Required setup failure remains blocking.
5. Retry from audio error.
6. Retry from tracking recovery.
7. Retry from equipment correction.
8. Generic accepted reps remain.
9. Step-up accepted reps/expected lead remain.
10. Both-sides completed first side remains.
11. Partial current work is discarded.
12. Fresh attempt id.
13. Fresh countdown.
14. No duplicate progression/result.

## 28.6 Skip/cancel

1. Skip accepted once.
2. Skipped item gets no progression credit.
3. Skip confirmation is tracked.
4. Skip does not also speak next-exercise redundantly.
5. Final-item skip can reach session completion.
6. Stale callbacks cannot complete skipped item.
7. Duplicate skip is deduplicated.
8. Cancel stops all voice.
9. Cancel suppresses stale completion.
10. Cancel does not invent a spoken line.
11. Manual/Explore skip retains current credit semantics.

## 28.7 Progress plans

1. Rep set has no voice progress.
2. 15 sec has five-left at 10 sec.
3. 20 sec has halfway at 10 and five-left at 15.
4. 30 sec has halfway at 15 and five-left at 25.
5. 12 sec ROM has none.
6. 14 sec ROM has none.
7. 6 sec side segment has none.
8. 7.5 sec side segment has none.
9. 10 sec side segment has none.
10. 15 sec side segment has five-left.
11. Unsupported duration does not round.
12. Progress event fires once.
13. Busy channel drops it.
14. Dropped progress is not replayed.
15. Pause cancels progress.
16. Tracking loss cancels progress.
17. Side switch cancels old progress.
18. Set completion cancels progress.
19. Voice switch does not replay missed progress.
20. Clara/Marcus duration does not change state.

## 28.8 Rep SFX

1. Generic accepted rep emits one SFX.
2. Rejected generic rep emits none.
3. Step-up accepted rep emits one SFX.
4. Step-up generic authority remains suppressed.
5. Wrong lead emits none.
6. Duplicate/stale emits none.
7. Both-sides rep side emits once per accepted rep.
8. Round aggregation emits no extra SFX.
9. Set completion emits no extra SFX.
10. SFX count equals accepted rep count.

## 28.9 Times-up

1. Timed end stops immediately.
2. Times-up emits once.
3. Times-up interrupts progress.
4. Stale progress does not play.
5. Tracking-loss-before-times-up precedence.
6. Times-up-before-tracking-loss precedence.
7. Same-frame precedence deterministic.
8. No active time continues during cue.
9. Timed transition avoids redundant completion stack.
10. Missing times-up cue preserves stop and visible state.

## 28.10 Transitions

1. Nonfinal rep set -> set complete/rest.
2. Nonfinal timed set -> time/rest without redundant set complete.
3. Rest begins from documented boundary.
4. Required transition speech does not shorten rest.
5. Last-set only for multi-set final set.
6. One-set exercise has no last-set cue.
7. Both-sides first side has no set/rest.
8. Both-sides switch uses current semantic cue.
9. Both-sides second side completes round/set.
10. Step-up set completes after valid target.
11. Final set nonfinal item transitions once.
12. Skip does not duplicate next-exercise.
13. Final item emits session completion once.
14. Generic item-complete is not inserted redundantly.
15. Session completion follows persisted canonical completion.
16. Missing transition cue uses visible fallback.
17. Stale transition callback is ignored.

## 28.11 Tracking recovery

1. Active loss creates one recovery id.
2. Repeated loss deduplicates.
3. Setup low-confidence does not create active-loss episode.
4. Generic rep partial discarded.
5. Accepted reps preserved.
6. Step-up partial discarded.
7. Step-up expected lead preserved.
8. Both-sides completed first side preserved.
9. Both-sides current side preserved.
10. Timed/hold current attempt follows documented restart.
11. ROM window restarts.
12. Floor position re-established.
13. Tracking-loss cue once.
14. Stable recovery before recovered cue.
15. Recovered cue never starts active.
16. Fresh full countdown.
17. Old attempt callback ignored.
18. New restarted attempt can create new episode.
19. Missing tracking-loss audio still stops.
20. Missing recovered cue uses visible fallback.

## 28.12 Reactive safety migration

1. Every deferred reactive cue has one destination.
2. No reactive row remains unclassified.
3. Tracking cue maps to tracking recovery.
4. Real equipment event maps to correction/retry.
5. Health stop maps to no-auto-resume.
6. Preventative fulfilled requirement does not duplicate speech.
7. No fake automatic detection.
8. Equipment correction requires explicit retry.
9. Pain/dizziness/unwell does not auto-resume.
10. Legacy-only rows remain legacy.
11. Reactive stop interrupts progress.
12. Reactive stop invalidates partial attempt safely.
13. `IR-VOICE-TRAINING-RECOVERY` removed only after full mapping.

## 28.13 Voice switching

1. Required setup replay in new voice.
2. Countdown restart at three.
3. Old go ignored.
4. Active switch deferred.
5. Critical stop uses current attempt voice under documented policy.
6. Paused switch applies safely.
7. Recovery switch replays required context.
8. Progress is dropped, not replayed.
9. Rapid Clara->Marcus->Clara keeps final desired voice.
10. One active channel.
11. No mixed required sequence.

## 28.14 Persistence/restore

1. Paused state round-trip.
2. Active restore does not auto-start.
3. Partial current attempt not restored as accepted.
4. Accepted generic reps preserved.
5. Step-up state preserved.
6. Both-sides state preserved.
7. Floor memory preserved.
8. Recovery episode safe restore.
9. In-flight cue not marked completed.
10. Completed transition not duplicated.
11. Fired progress event not duplicated.
12. Plan fingerprint mismatch fails closed.
13. Legacy session remains legacy.
14. Backend compact state round-trip where supported.
15. Richer current state wins stale sparse merge.

## 28.15 Path parity

1. Main-plan session.
2. Short session.
3. Restart session.
4. Supporting session.
5. Readiness-scaled target.
6. Pain substitution.
7. Equipment substitution.
8. Equipment skip.
9. Manual ladder practice.
10. Explore ladder.
11. Explore preset.
12. Restored generated session.
13. Final exercise contract drives behavior.
14. No path mixes legacy/V2.1.

## 28.16 Runtime readiness

1. Controls ready true.
2. Progress ready true.
3. Recovery ready true.
4. Safety ready remains true.
5. `IR-VOICE-TRAINING-CONTROLS` remaining count zero.
6. `IR-VOICE-TRAINING-RECOVERY` remaining count zero.
7. Audio ready false.
8. Feature off.
9. Selectable count zero.
10. Behavior ready derived correctly.
11. Balance V2 closed.
12. Step-up default off.
13. Floor V2.1 default off.
14. Physical manifest unchanged.

## 28.17 Regression

Re-run relevant suites for:

- Training Voice V2.1 safety integration,
- exact 37-level contracts,
- session player,
- TrainingSessionScreen,
- tracked voice player,
- workout generation,
- manual/Explore,
- both-sides rounds,
- step-up runtime/evidence closure,
- floor readiness,
- progression/valid time,
- training serialization/backend,
- MPV2,
- measurement side,
- Balance V2.

Preserve all completed P0/P1/P2 software gates.

---

# 29. Required audit scenarios

Create at least these canonical scenarios.

## Countdown/start

- `training_countdown_rep_set`
- `training_countdown_timed_set`
- `training_go_playback_start_boundary`
- `training_go_missing_blocks`
- `training_go_playback_start_failure`
- `pause_during_countdown`
- `skip_during_countdown`
- `background_during_countdown`
- `voice_switch_during_countdown`

## Controls

- `pause_during_setup`
- `pause_during_active_rep`
- `pause_during_active_timed`
- `pause_during_rest`
- `resume_generic_rep`
- `resume_step_up`
- `resume_both_sides`
- `resume_floor`
- `repeat_instructions_setup`
- `repeat_instructions_paused`
- `repeat_instructions_active_blocked`
- `retry_audio_failure`
- `retry_tracking_recovery`
- `rapid_double_retry`
- `skip_nonfinal_item`
- `skip_final_item`
- `rapid_double_skip`
- `cancel_during_required_speech`
- `cancel_during_active`

## Progress

- `progress_rep_set_sfx_only`
- `progress_15_second`
- `progress_20_second`
- `progress_30_second`
- `progress_rom_12_second_none`
- `progress_rom_14_second_none`
- `progress_side_6_second_none`
- `progress_side_7_5_second_none`
- `progress_side_10_second_none`
- `progress_side_15_second`
- `progress_busy_dropped`
- `progress_dropped_not_replayed`
- `progress_cancelled_on_pause`
- `progress_cancelled_on_tracking_loss`
- `progress_cancelled_on_side_switch`
- `progress_cancelled_on_set_exit`

## Times-up/transitions

- `times_up_interrupts_progress`
- `tracking_loss_before_times_up`
- `times_up_before_tracking_loss`
- `same_frame_times_up_tracking_precedence`
- `rep_set_complete_then_rest`
- `timed_set_time_then_rest`
- `rest_boundary_not_shortened`
- `last_set_multi_set_only`
- `one_set_no_last_set`
- `next_exercise_once`
- `session_complete_once`
- `skip_no_next_exercise_duplicate`
- `transition_missing_audio_visible_fallback`

## Both-sides

- `both_sides_first_side_switch_no_rest`
- `both_sides_second_side_round_complete`
- `both_sides_recovery_preserves_first_side`
- `both_sides_pause_preserves_side`
- `both_sides_progress_attempt_scoped`
- `both_sides_voice_switch_preserves_side`

## Step-up

- `step_up_rep_sfx_only`
- `step_up_wrong_lead_correction_only`
- `step_up_no_per_rep_voice_switch`
- `step_up_tracking_recovery_expected_lead`
- `step_up_pause_resume_expected_lead`
- `step_up_set_transition_once`

## Floor

- `floor_pause_resume_final_position`
- `floor_retry_no_duplicate_transition`
- `floor_tracking_recovery_final_position`
- `floor_restore_no_auto_start`
- `floor_memory_preserved_controls`

## Recovery

- `tracking_loss_generic_rep`
- `tracking_loss_timed_set`
- `tracking_loss_rom`
- `tracking_repeated_same_episode`
- `tracking_new_episode_after_restart`
- `tracking_recovered_fresh_countdown`
- `tracking_loss_missing_audio_visible_recovery`
- `tracking_recovered_missing_audio_visible_fallback`
- `stale_recovery_callback_ignored`

## Reactive safety

- `reactive_tracking_mapped`
- `reactive_equipment_event_retry_required`
- `reactive_health_stop_no_auto_resume`
- `reactive_preventative_no_duplicate`
- `reactive_no_fake_detection`
- `reactive_all_migration_rows_classified`

## Voice switching

- `voice_switch_required_setup`
- `voice_switch_active_deferred`
- `voice_switch_paused`
- `voice_switch_recovery`
- `voice_switch_progress_dropped`
- `rapid_multiple_voice_switches`
- `old_voice_callback_ignored`

## Restore/path/defaults

- `restore_paused`
- `restore_active_to_setup`
- `restore_recovery`
- `restore_completed_transition_no_duplicate`
- `backend_runtime_roundtrip`
- `main_plan_controls_recovery`
- `short_session_controls_recovery`
- `restart_session_controls_recovery`
- `supporting_session_controls_recovery`
- `manual_controls_recovery`
- `explore_controls_recovery`
- `substitution_uses_final_contract`
- `legacy_mode_unchanged`
- `training_v21_stays_default_off`
- `audio_ready_stays_false`
- `balance_v2_stays_closed`
- `step_up_stays_default_off`
- `floor_v21_stays_default_off`
- `physical_manifest_unchanged`

The audit may add scenarios.

---

# 30. Audit evidence quality

Do not hard-code defect counts.

Requirements:

1. Derive current contract/blocker counts from production registries.
2. Execute the current progress planner.
3. Execute the current transition planner.
4. Execute the current runtime with fake logical/physical bindings.
5. Execute real tracked outcomes.
6. Execute current both-sides, step-up, and floor runtime adapters.
7. Execute current local serializer/restore.
8. Execute production backend mappers where applicable.
9. Derive metrics from written scenario/control/progress/reactive/timeline rows.
10. Reopen written artifacts and independently recompute.
11. Verdict derives from completion gates.
12. Failed scenarios remain visible.
13. Timing estimates are labelled as estimates.
14. P0/P1/P2/P3 derive from findings.

A compact executable audit is better than synthetic scenario inflation.

---

# 31. Required artifacts

Create:

1. `docs/audits/PEARL_TRAINING_VOICE_V2_1_CONTROLS_PROGRESS_RECOVERY_IMPLEMENTATION.md`
2. `docs/audits/PEARL_TRAINING_VOICE_V2_1_CONTROLS_PROGRESS_RECOVERY_AUDIT.md`
3. `docs/audits/PEARL_TRAINING_VOICE_V2_1_CONTROLS_PROGRESS_RECOVERY_AUDIT.json`
4. `docs/audits/PEARL_TRAINING_VOICE_V2_1_CONTROL_CONTRACT_MATRIX.csv`
5. `docs/audits/PEARL_TRAINING_VOICE_V2_1_PROGRESS_SCHEDULE_MATRIX.csv`
6. `docs/audits/PEARL_TRAINING_VOICE_V2_1_REACTIVE_SAFETY_MIGRATION.csv`
7. `docs/audits/PEARL_TRAINING_VOICE_V2_1_RUNTIME_SCENARIOS.csv`
8. `docs/audits/PEARL_TRAINING_VOICE_V2_1_CONTROL_TIMELINES.csv`
9. `docs/audits/PEARL_TRAINING_VOICE_V2_1_CONTROL_ASSET_REQUIREMENTS.csv`
10. `docs/audits/PEARL_VOICE_PROJECT_POST_TRAINING_RUNTIME_HANDOFF.md`

You may add one audit-only harness:

- `scripts/audits/audit-training-voice-v21-controls-progress-recovery.mjs`

Do not overwrite earlier artifacts.

## Control matrix columns

Use columns similar to:

```text
control,eventSource,allowedPhases,logicalCueKey,exactScript,policyId,requiredness,controllerActionTiming,nextBoundaryGate,failureBehavior,duplicateTapBehavior,restoreBehavior,voiceSwitchBehavior,implementationStatus,sourceFiles,testCoverage,notes
```

## Progress matrix columns

Use columns similar to:

```text
setType,targetMs,exerciseIdsOrContexts,progressEventCount,event1DueMs,event1CueKey,event2DueMs,event2CueKey,optional,dropIfBusy,replayIfMissed,cancelConditions,runtimeStatus,testCoverage,notes
```

## Reactive migration columns

Use columns similar to:

```text
sourceCueId,sourceScript,canonicalSafetyTier,currentReachability,v21Disposition,logicalCueKey,triggerSource,automaticDetectionSupported,recoveryPolicy,remainingBlocker,legacyPathPreserved,sourceFiles,testCoverage,notes
```

## Runtime scenario columns

Use columns similar to:

```text
scenarioId,category,runtimeKind,itemId,setIndex,sideOrLead,phaseBefore,event,eventAcceptedAtMs,plannedCueKeys,trackedOutcome,phaseAfter,activeStarted,activeStopped,progressFired,progressDropped,sfxCount,recoveryId,countdownRestarted,transitionId,controllerCreditChanged,legacyVoiceEmitted,v21VoiceEmitted,passed,testCoverage,notes
```

## Timeline columns

Use columns similar to:

```text
scenarioId,voiceId,gapMs,budgetClass,cueKeys,scripts,assetStatus,estimatedSpeechMs,estimatedTotalMs,targetMs,hardMaxMs,passesTarget,passesHardMax,activeStartBoundary,restStartBoundary,notes
```

## Asset requirements columns

Use columns similar to:

```text
logicalCueKey,exactScript,category,policyId,requiredness,eventsOrContracts,currentCandidateKey,currentCandidateScript,claraExists,marcusExists,semanticMatch,reuseDecision,generationRequiredLater,budgetClass,notes
```

---

# 32. Audit metrics

Report at minimum:

```text
controlContractCount
missingControlContractCount

progressPlanContextCount
unsupportedProgressSilentlyApproximatedCount
spokenRepCountCount
defaultTwoRepsLeftCount

goDispatchStartCount
goCompletionStartCount
missingGoActiveStartCount
duplicateActiveStartCount

pauseDuplicateTransactionCount
resumeDirectActiveStartCount
repeatInstructionsSafetyRepeatCount
repeatInstructionsSetCountCount
retryDuplicateTransactionCount
retryPartialWorkDoubleCreditCount
skipProgressionCreditCount
skipNextExerciseDuplicateCount
cancelStaleCallbackMutationCount

progressEarlyCount
progressLateReplayCount
progressDuplicateCount
progressCrossAttemptCount
progressBlockingActiveTimingCount
repSfxMismatchCount

timesUpDuplicateCount
timesUpActiveContinuationCount
timesUpProgressStaleCount

duplicateTransitionCount
redundantCompletionStackCount
restShortenedBySpeechCount
lastSetWrongContextCount
sessionCompletionDuplicateCount

bothSidesRestBetweenSidesCount
bothSidesSideDriftCount
stepUpPerRepSpokenSwitchCount
stepUpExpectedLeadDriftCount
floorTransitionRepeatFromControlCount
floorPrematureResumeCount

trackingEpisodeDuplicateCount
trackingPartialWorkResumeCount
trackingRecoveryWithoutFreshCountdownCount
trackingWrongSideOrLeadCount
staleRecoveryCallbackMutationCount

reactiveSafetyCueCount
unclassifiedReactiveSafetyCount
fakeAutomaticDetectionCount
healthStopAutoResumeCount
equipmentStopAutoResumeCount

mixedVoiceRequiredSequenceCount
twoLiveVoiceChannelCount
oldVoiceCallbackMutationCount

localRuntimeRoundTripFailureCount
backendRuntimeRoundTripFailureCount
restoreAutoActiveStartCount
restoreDuplicateCompletionCount

generatedPathMismatchCount
manualPathMismatchCount
explorePathMismatchCount
substitutionOldContractCarryoverCount

irVoiceTrainingControlsRemainingCount
irVoiceTrainingRecoveryRemainingCount
controlsReadyValue
progressReadyValue
recoveryReadyValue
safetyReadyValue
globalBehaviorReadyValue
audioReadyValue
v21SelectableExerciseCount

timingHardMaxFailureCount
physicalManifestChangeCount
audioAssetChangeCount

p0
p1
p2
p3
```

Severity counts must derive from findings.

---

# 33. Findings and verdicts

## P1 examples

- active starts without valid go playback start,
- resume starts active directly,
- partial work is double-credited,
- tracking recovery resumes partial invalid work,
- wrong side/lead resumes,
- skip creates progression credit,
- stale callback starts/completes a new state,
- reactive health/equipment stop auto-resumes,
- legacy and V2.1 voices both own one session.

## P2 examples

- one control lacks a runtime contract,
- one generated/manual/Explore path is not connected,
- progress is replayed late,
- rest is shortened by speech,
- persistence loses control/recovery state,
- reactive safety requirement remains unclassified,
- control/recovery blockers remain after claimed completion,
- behavior ready is incorrectly derived,
- timing exceeds hard max.

## P3

- physical speaker onset/device timing deferred,
- human listening waived,
- pending physical V2.1 assets,
- physical-device pose/recovery usability deferred.

Issue exactly one verdict.

### `TRAINING_VOICE_V2_1_CONTROLS_PROGRESS_RECOVERY_SOFTWARE_COMPLETE`

Use when:

- controls/progress/transitions/recovery are integrated end to end,
- all applicable blockers are removed,
- behavior readiness is correctly recomputed,
- only audio/schema/listening/device work remains.

### `TRAINING_VOICE_V2_1_CONTROLS_PROGRESS_RECOVERY_MODEL_COMPLETE_RUNTIME_PENDING`

Use when pure models pass but the internal session runtime does not consume them end to end.

### `TRAINING_VOICE_V2_1_CONTROLS_PROGRESS_RECOVERY_REMEDIATION_REQUIRED`

Use when a control, timing, recovery, persistence, path-parity, or isolation gate fails.

### `CURRENT_SOURCE_REBASE_REQUIRED`

Use when current source cannot be reconciled safely.

Expected successful verdict:

```text
TRAINING_VOICE_V2_1_CONTROLS_PROGRESS_RECOVERY_SOFTWARE_COMPLETE
```

---

# 34. Completion gates

## Controls

```text
missing control contracts = 0
pause duplicate transactions = 0
resume direct active starts = 0
Repeat Instructions safety repeats = 0
Repeat Instructions set-count cues = 0
retry duplicate transactions = 0
retry partial-work double credits = 0
skip progression credits = 0
skip/next-exercise duplicates = 0
cancel stale mutations = 0
```

## Active start

```text
start from speak dispatch = 0
start from go completion = 0
missing-go active starts = 0
duplicate active starts = 0
```

## Progress/SFX

```text
silent target approximation = 0
spoken rep counts = 0
default two-reps-left = 0
early progress = 0
late replay = 0
duplicate progress = 0
cross-attempt progress = 0
progress blocking active timing = 0
rep SFX mismatches = 0
```

## Times-up/transitions

```text
duplicate times-up = 0
active continuation after times-up = 0
stale progress after times-up = 0
duplicate transitions = 0
redundant completion stacks = 0
rest shortened by speech = 0
wrong-context last-set = 0
duplicate session completion = 0
```

## Both-sides/step-up/floor

```text
rest between sides = 0
side drift = 0
step-up per-rep spoken switch = 0
step-up expected-lead drift = 0
floor transition repeats caused by controls = 0
floor premature resume = 0
```

## Recovery/reactive safety

```text
duplicate recovery episodes = 0
partial invalid work resumed = 0
recovery without fresh countdown = 0
wrong side/lead recovery = 0
stale recovery mutation = 0
unclassified reactive safety = 0
fake automatic detection = 0
health stop auto-resume = 0
equipment stop auto-resume = 0
```

## Voice switching

```text
mixed required sequences = 0
two live channels = 0
old voice callback mutation = 0
```

## Persistence/path parity

```text
local round-trip failures = 0
backend round-trip failures = 0
restore auto-active starts = 0
restore duplicate completions = 0
generated mismatches = 0
manual mismatches = 0
Explore mismatches = 0
substitution old-contract carryover = 0
```

## Readiness

```text
IR-VOICE-TRAINING-CONTROLS remaining = 0
IR-VOICE-TRAINING-RECOVERY remaining = 0
controls ready = true
progress ready = true
recovery ready = true
safety ready = true
audio ready = false
V2.1 selectable exercises = 0
```

`global behavior ready` must equal its correctly derived value.

Expected:

```text
true
```

if no other training behavior blocker remains.

## Integrity/defaults

```text
timing hard-max failures = 0
physical manifest changes = 0
audio changes = 0
audio generated = false
external speech/audio API called = false
```

- Training Voice V2.1 remains default off.
- Balance V2 remains default closed/audio pending.
- Step-up alternation remains default off.
- Floor V2.1 remains default off.
- Human listening remains waived.
- Physical QA remains deferred.

---

# 35. Implementation report structure

Use:

# Pearl Training Voice V2.1 Controls, Progress, and Recovery Implementation

## 1. Result

## 2. Entry Baseline

## 3. Controller and Voice Authority Boundary

## 4. Runtime Phases and Scopes

## 5. Audible Countdown and Go Start

## 6. Pause and Resume

## 7. Repeat Instructions

## 8. Retry, Skip, and Cancel

## 9. Progress Scheduler and Rep SFX

## 10. Times-Up and Transition Planner

## 11. Both-Sides Runtime Integration

## 12. Step-Up Runtime Integration

## 13. Floor Runtime Integration

## 14. Tracking-Loss and Recovery

## 15. Reactive Safety Migration

## 16. Mounted Voice Switching

## 17. Failure and Visible Fallback Semantics

## 18. Persistence and Restore

## 19. Generated, Manual, and Explore Parity

## 20. Runtime Readiness and Blocker Reconciliation

## 21. Asset Requirements

## 22. Timing Budgets

## 23. Diagnostics

## 24. Tests

## 25. Audit Results

## 26. Remaining Audio/Schema/Device Boundaries

## 27. Files Changed

## 28. Worktree Integrity

## 29. Exact Next Phase

---

# 36. Handoff

Create:

- `docs/audits/PEARL_VOICE_PROJECT_POST_TRAINING_RUNTIME_HANDOFF.md`

If successful, the exact next task is:

```text
Micro-Check Voice V2.1 implementation
```

Include:

- training runtime phase/scope API,
- countdown/go API,
- control contract API,
- progress planner API,
- transition planner API,
- recovery episode API,
- reactive safety contract API,
- persistence fields,
- readiness values,
- removed blocker counts,
- remaining audio/schema blockers,
- feature/default state,
- tests that must remain green.

Later order:

1. Micro-Check Voice V2.1
2. final cue schema and physical manifests
3. consolidated Clara/Marcus generation, including Balance V2
4. whole-project static/runtime audit
5. final consolidated physical-device QA

Do not implement Micro-Check V2.1 in this task.

---

# 37. Validation commands

Run at minimum:

```bash
npm run verify:audio
npx tsc --noEmit --pretty false
```

Run the latest safety-integration audit harness.

Run focused Jest suites covering:

- tracked voice player,
- Training Voice V2.1 safety,
- Training Voice V2.1 controls/progress/recovery,
- sequence planner,
- session player,
- TrainingSessionScreen,
- generic set runtime,
- both-sides runtime,
- step-up runtime,
- floor setup/runtime,
- progress/valid time,
- local serialization,
- backend training state,
- workout generation,
- manual/Explore.

Run regression suites for:

- MPV2 voice runtime,
- measurement side,
- Balance V2,
- step-up evidence closure,
- floor readiness.

Run the repository full Jest command.

Run the new audit harness.

Parse all generated JSON/CSV artifacts.

Independently recompute audit metrics from written artifacts.

Inspect:

```bash
git status --short --branch
git diff --stat
git diff -- assets/audio
git diff --check
```

Do not modify tests merely to make them pass.

Existing Watchman/open-handle warnings may be reported if commands exit successfully.

---

# 38. Final Codex response

When finished, respond with:

- summary of implementation,
- paths to all ten generated artifacts,
- audit harness path,
- all production files changed/added,
- all test files changed/added,
- confirmation that no audio changed or was generated,
- confirmation that no external speech/audio API was called,
- confirmation that listening and physical QA remain deferred,
- branch and commit,
- whether the worktree was already dirty,
- entry-baseline results,
- control contract count,
- progress-plan context count,
- countdown cadence,
- active-start boundary,
- pause semantics by runtime type,
- resume semantics by runtime type,
- Repeat Instructions contents,
- retry requiredness/failure behavior,
- skip/cancel behavior,
- rest-start boundary,
- transition de-duplication policy,
- progress schedule table,
- rep SFX authority,
- tracking-loss confirmation rule,
- recovery episode/deduplication rule,
- partial-work behavior by runtime type,
- reactive safety migration counts and dispositions,
- voice-switch safe boundaries,
- persistence/restore behavior,
- generated/manual/Explore behavior,
- removed `IR-VOICE-TRAINING-CONTROLS` count,
- removed `IR-VOICE-TRAINING-RECOVERY` count,
- remaining blockers,
- controls-ready value,
- progress-ready value,
- recovery-ready value,
- safety-ready value,
- global behavior-ready value,
- audio-ready value,
- V2.1 selectable count,
- all critical defect metrics,
- P0/P1/P2/P3 counts,
- verdict,
- whether Micro-Check Voice V2.1 is unblocked,
- exact next task,
- `npm run verify:audio` result,
- typecheck result,
- safety audit result,
- focused and full Jest results,
- audit recomputation result,
- concise confidence statement.

Do not generate audio, enable Training Voice V2.1, enable Balance V2, enable step-up alternation or floor V2.1 by default, implement Micro-Check Voice V2.1, or perform physical-device QA in this task.
