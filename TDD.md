# Conductor v1 — Technical Design Doc

Date: 2026-07-05 · Status: **awaiting founder approval — no implementation started**
Spec: "Conductor v1" brief (Parts 1–6). Base: `menopause-reframe` branch @ `662fba29`.

---

## 0. Executive summary

**The conductor is an upgrade of a running engine, not a greenfield build.** The repo already
contains a camera-graded, voice-guided training session player (`src/training/sessionPlayer.ts`)
whose phase machine — intro → transition → preflight → instructions → countdown → set → rest →
complete — is ~70% of the spec's IDLE → SPOT_CHECK → START_POSITION → COUNTDOWN → ACTIVE →
SET_COMPLETE → REST → TRANSITION machine. Reps are already counted with One-Euro smoothing +
hysteresis on the shared grading primitives; holds already run on a "valid time" accumulator
that pauses honestly when the pose or tracking drops; sets already end early on velocity
autoregulation; a setup-funnel instrumentation layer and a deterministic JSONL record/replay
harness already exist. Eleven of the spec's 12 movements exist as registered, camera-graded
exercise definitions (only **wall sit** is missing).

The genuinely new work, in effort order:

1. **Fail-soft ladder (Levels 0/1/2) + no-stall invariant** — today, tracking loss mid-set
   silently stops counting (reps) or pauses the clock (holds), and setup failure latches a
   state that waits for a tap. The spec's tempo-paced Level 1, auto-degrade-to-timer Level 2,
   degradation logging, and "covered lens still completes a session hands-free" test are new.
2. **START_POSITION detection** — per-movement start-pose predicates (seated for STS, standing
   for squat/march) with the "Ready when you are" flow. Today the countdown starts on generic
   `tracking` + a 2 s dwell. The check-up's new standing-frame-check (2026-07-04) is the
   pattern to generalise.
3. **Voice-only mode, rep correction (±1), rest-skip, spoken rep counts** — UI + player + audio
   work. Number cues (`num-0…40`) are already bundled for both voices.
4. **Workout-spot memory** — persist a framing reference; the preflight fast path
   (0.5 s re-verification after one full pass) already gives the ≤2 s mechanism.
5. **Per-user calibration** (squat depth from first reps; recorded tempo store for pacing).
6. **Corpus + gate tooling** — labelled ground truth format, per-set accuracy report,
   threshold sweep, one-command regression. The replay CLI, synthetic fixture generator, and
   noise-floor CLI are the foundation; the labelling/reporting layer is new.

Section 2 lists **9 conflicts** between the spec and the current code / recorded decisions
that need explicit resolution — most have a recommended answer; three genuinely need your call
(marked ⚖️).

---

## 1. Repo review — what exists, mapped to the spec

### 1.1 Pose pipeline (spec Part 2 "POSE PIPELINE")

- **Engine:** MediaPipe Tasks Vision PoseLandmarker (33 landmarks), fully native in a local
  Expo module (`modules/expo-pose-detection`): Android CameraX + `full-video-sync` pipeline at
  640×480 analysis resolution, iOS AVFoundation. One landmark-array event per frame to JS;
  frames never cross the bridge. `modelVariant: 'lite' | 'full'` prop, production default
  `full`. Models are fetched/verified at build time (`scripts/download-models.sh`,
  `verify-pose-models.sh`, EAS pre-install hook).
- **JS pipeline** (`src/pose/pipeline.ts`): parse → One-Euro smoothing (separate lighter filter
  for display) → per-chain windowed reliability → subject validity → presence state machine
  (1.5 s warmup gate, subject-gone events, stream-gap handling) → body-unit calibration.
  Pure TS, allocation-free hot path, fully deterministic from frame timestamps — a recording
  replays byte-identically.
- **Preflight** (`src/preflight/preflight.ts`): framing (edge margins, distance band via
  nose→ankle span, centering) + a 2 s lighting/stability sample (raw visibility + jitter).
  The training config (`TRAINING_PREFLIGHT_CONFIG`) already shortens re-verification to
  0.5 s after one full pass per session; view changes and retries revoke the shortcut.

### 1.2 Session player (spec Part 2 state machine)

`TrainingSessionPlayer` (`src/training/sessionPlayer.ts`) — pure TS, frame-timestamp-driven,
replay-deterministic. Per-phase mapping in §3. Already present: auto-advance, spoken rest with
last-set announcement, rep-credit chime, velocity autoregulation ("that's your set"), a
120 s set safety cap so a wedged detector can't hang a set, pause/resume with honest
discard-and-redo semantics, session resume at item boundaries, skip controls, hands-free
floor setup (flag-gated V2.1) with camera-inferred floor posture readiness and a 12 s tap
fallback, and per-item re-framing with turn cues when the camera view changes.

### 1.3 Grading (spec "ACTIVE" state)

- Primitives (`src/grading/`): `RepCycleTracker` (hysteresis + EMA), `RepVelocity`,
  `HoldTracker` (debounced start/end), `MaxRomTracker`, `TimedTaskTracker`.
- Set-level graders (`src/exercises/setGraders.ts`): `RepsSetGrader` (near-side selection
  sticky per rep, subject-gone resets, autoregulation), `HoldSetGrader` (single-leg /
  narrow-base / bridge conditions; **valid-time mode**: the clock runs only while the pose
  predicate holds and tracking is reliable, with grace windows and a safety cap — this *is*
  the spec's "timer runs only while pose predicate true; pause on wobble"), `RomSetGrader`,
  `TimerSetGrader` (player-owned clock, or broad-setup valid time).
- **Not present:** min/max rep duration rejection, per-user range calibration, "still with
  me?" (45 s no-crossing) and "no motion 20 s → take the rest, you've done N" behaviors,
  spoken per-rep counts.

### 1.4 Movement library (spec tiers → existing exercise ids)

| Spec movement | Existing id(s) | Grading today | Notes |
|---|---|---|---|
| T1 Sit-to-stand | `sts-cushion/-standard/-slow-eccentric/-power` | reps, knee-angle 155/110, hip rise velocity | Same signal + thresholds family as the check-up chair movement — sharing requirement (§2, C7) already satisfied at the primitive level |
| T1 Squat | `squat-supported`, `squat-free` | reps, knee-angle 160/120 | **Fixed thresholds — per-user depth calibration is new** |
| T1 March | `loaded-march` ("March in Place") | reps, near-side knee cycle 160/120, side view | Spec wants alternating knee height — see conflict C8 |
| T2 Wall push-up | `push-up-wall` (+incline) | reps, elbow angle 160/100 | Side view; viewpoint cone = existing camera-view spec |
| T2 Step-up | `step-up` | reps + STS substitute when no stair | A parked "alternation" runtime exists (`ade64afd`); ignore for v1 |
| T2 Split squat | `chair-supported-split-squat` | reps | Hidden by release policy (`capability_prerequisite_not_approved`) |
| T2 Wall sit | — | — | **Only missing movement**; new `HoldSetGrader` condition |
| T2 Single-leg balance | `balance-single-leg` (+ feet-together, tandem) | hold, valid-time | Shared with check-up balance; auto-progression to single-leg deliberately gated pending device validation |
| T2 Heel raise | `heel-raise-supported/-free` | reps, ankle angle 150/120 | Known-jittery ROM (documented in file); the spec's "timer mode if ankle confidence low" is exactly the Level 2 ladder |
| T3 Overhead press | `overhead-reach`, `overhead-press` | reps | |
| T3 Hip hinge | `hinge-wall`, `hinge-free` | reps | |
| T3 Band row | `seated-band-row`, `standing-band-row` | reps | Occlusion risk as spec predicts |
| Floor (bridge, mobility…) | `glute-bridge`, mobility drills | hold/timer/rom | Floor V2.1 camera setup exists but is flag-gated — see C6 |

The catalog also has `ExerciseLevel.measurementTier: 'measured' | 'camera_assisted' |
'voice_guided'` and a release-policy layer (`releasePolicy.ts`) that gates levels per channel —
the natural home for "conductor-enabled only after passing the gate" (§7).

### 1.5 Audio (spec voice requirements)

Pre-generated ElevenLabs assets, two voices, bundled; one line at a time, busy channel drops
lower priority; SFX on a separate channel (`src/audio/`). Voice V2.1 is the live default with
its own sequence planner (`src/training/voiceV21`). Number words `num-0…num-40` are bundled at
priority 9 (used today for stitched results), so spoken rep counts need **no new recording
sessions for digits** — only ~15–25 new conductor lines (both voices) via the existing
`scripts/generate-audio.ts` pipeline.

### 1.6 Instrumentation (spec Part 5)

`SessionFunnelTracker` already records per-item framing cost, setup-issue latches, time to
first set/first rep, ended-in-phase, completed — persisted per session in a local, schema-
versioned telemetry store (`src/telemetry/`), separate from product data, with sanitized Sentry
breadcrumbs. Abandoned sessions are captured on unmount. Missing vs spec: mode chosen,
per-exercise degradation level history, prescribed-vs-actual reps/tempo/rest, corrections,
and an explicit churn-location taxonomy (partially derivable today from funnel + adherence
records; needs to be made first-class).

### 1.7 Record/replay + tuning (spec Part 4)

- Dev-mode JSONL landmark recorder (`src/recording/`), pullable via `scripts/pull-recordings.sh`.
- `npm run replay` — headless replay with `--assert` drift detection.
- `gradeRecording()` — full pipeline + grader over a recording, headless.
- `npm run fixtures` — deterministic **synthetic** recordings (walkout/return, side-view
  occlusion) with committed expected summaries.
- `npm run noise-floor` — the rise-velocity CV analysis (synthetic passed at 0.44 % CV;
  **real-data run still pending** — an open product go/no-go that shares the corpus this
  build needs).
- Missing vs spec: ground-truth label format, per-set accuracy report vs labels, threshold
  sweep tool, one-command corpus regression, session-level no-stall synthetic tests.

---

## 2. Conflicts between the spec and the codebase / recorded decisions

**C1 — Pose-library bake-off vs. an entrenched, production-hardened MediaPipe stack.**
The spec asks for a MediaPipe / MoveNet Thunder / Apple Vision evaluation "with latency and
landmark-stability data at 3 m in low light." Recommendation: **stay on MediaPipe Tasks
Vision, and do not run a bake-off.** Structural grounds: (a) MoveNet has 17 keypoints — no
heel/foot-index (heel raise), no per-landmark presence/visibility semantics the reliability
chains use; (b) Apple Vision is iOS-only and would fork the pipeline, replay format, and
corpus; (c) the entire measurement stack — 33-landmark types, chain reliability, subject
validity, body-unit calibration, the JSONL corpus format, and a year of Forma production
tuning — is MediaPipe-shaped, and the Check-Up (the product's instrument) stays on it
regardless, so a different conductor engine would mean two pipelines. **Honesty flag:** the
measured on-device data the spec asks for does not exist yet and cannot be produced from this
desk — the 2026-06-22 physical-device benchmark pass explicitly collected no numbers (no
physical device attached; the emulator cannot run MediaPipe at all — OpenGL ES 3.0 SIGILL).
Proposed resolution: the existing latency-diagnostics build
(`EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS=1`, native source-age fields already emitted)
is run on the two target devices during week 1's corpus session, and the ≥20 fps + thermal
numbers land in the gate report rather than in this TDD. If those numbers fail on the
3-year-old Android target, the fallback is the `lite` model variant (a one-prop change),
not an engine swap.

**C2 — "Single JSON per movement; all tuning in config" vs. the registry architecture law.**
CLAUDE.md's proven pattern is one typed TS `ExerciseDefinition` per file with module-private
internals; grader thresholds are already declared as plain data in each definition
(`repsGrader({ upEnterDeg: 155, downEnterDeg: 110, … })`). Proposal: **honor the spec's
intent, keep the TS letter** — add a `ConductorTuning` plain-data object (JSON-serializable,
no functions) per conductor movement: signal ref, threshold pair, smoothing, min/max rep
duration, start-pose predicate id + params, viewpoint cone, calibration rule, confidence
floor, each field commented with its corpus evidence. The replay/tuning CLI reads and sweeps
these objects directly (they compile to JSON); the registry keeps type safety and the
"adding a movement never touches player code" law. A parallel JSON file per movement would
add a parse/validation layer and drift risk for zero tuning benefit.

**C3 — ⚖️ Silent auto-degrade to Level 2 vs. the "ask, don't silently act" decisions.**
Spec: SPOT_CHECK timeout 10 s → one hint → 10 s → silently degrade to timer mode; degraded
transitions never mention the camera. Current code + two recorded decisions (2026-07-02/03)
deliberately do the opposite: after 60 s of failed framing the player latches `setupIssue` and
*asks* (Retry / Skip) "instead of silently skipping." These are reconcilable — degrading is
not skipping (the set still runs, voice-guided), and the spec keeps tap-to-advance visible —
but it is a real reversal of a recent product decision, and it changes what a stuck camera
does mid-session. **My recommendation: adopt the spec** (silent degrade with the small
indicator; the setup-issue ask remains only for the session's *first* item, where degrading
silently would hide a launch-blocking setup problem the user could fix in 5 seconds).
Flagging because you decided the current behavior three days ago.

**C4 — ⚖️ "Voice counts each rep" vs. the silence-by-default + one-line-at-a-time audio laws.**
Rep credits are currently a chime (deliberate: no voice chatter, no stale queued lines). The
spec wants spoken counts. Digits are bundled and short, so this is feasible; the risk is only
at high rep rates (march) and when counts collide with safety/termination lines. Proposal:
spoken counts for slow strength movements (STS, squat, and Tier 2 reps items — rep every
4–8 s), at a priority below termination/safety cues with drop-if-busy (a dropped count is
fine; the next rep speaks the true total). For march, milestone counts (every 4th) + chime
per step. This deviates from the spec letter for one movement — confirm.

**C5 — Debug video clips vs. the shipped privacy promise.**
Spec Part 2 allows "opt-in, session-scoped debug video clips." The app's permission-priming
copy (shipped 2026-07-03) promises "images processed in the moment, never saved, never
uploaded," and the recording infrastructure is deliberately landmarks-only. Recommendation:
**no video capture path in the app, ever** — the corpus (Part 4) is filmed with a *second
device* during panel sessions while the app records landmark JSONL; the label file references
both by timestamp. This satisfies the corpus need without touching the privacy posture.
(Same resolution for C-corrections below: correction events log a bounded *derived-signal*
trace — the 1-D signal, thresholds, confidence, ±20 s — not raw landmarks; full landmark JSONL
stays behind the dev toggle.)

**C6 — Floor block: the spec is simpler than the code.**
Spec: floor movements are always timer/voice-guided in v1. The repo has a more ambitious
flag-gated floor V2.1 (camera-inferred floor posture readiness, valid-time floor grading).
Recommendation: conductor v1 ships the spec — floor items run `TimerSetGrader` voice-guided,
one floor-block announcement, camera never repositioned; floor V2.1 stays flagged off and is
not in the 6–8-week clock. The session generator must additionally *enforce* the
[standing/chair block] → [floor block] → [optional standing cooldown] ordering — today
`workoutGeneration.ts` orders by training slot and does not guarantee floor-last. Small,
real change (order-by-environment pass over the generated session + a test).

**C7 — Shared STS detection: already true, keep it true.**
Check-up chair movement and training STS both run `RepVelocityTracker` on the same near-side
knee-angle signal with the same 155/110 hysteresis through the same `PosePipeline`. The
conductor must not fork this: START_POSITION predicates will be shared modules
(`src/pose/startPose.ts`) consumed by both the conductor and the check-up's protocol setup
(the standing-frame-check already encodes "standing, near-extended knee ≥150°" — the seated
predicate for STS is its mirror).

**C8 — March: "alternating knee height" vs. the existing side-view near-knee grader.**
Front-view alternating-knee counting would be new grader work and forces a face-the-camera
turn inside the strength block (STS/squat are side-view). Recommendation: keep the side-view
near-side knee cycle (exists, tested), count near-side lifts, target expressed in near-side
lifts, add the debouncing (min rep duration ~500 ms) the spec asks for; let the corpus decide
if it gates. If it fails the gate, the front-view alternating variant is the retuning path.

**C9 — Voice-only mode supersedes a pending go/no-go.**
The 2026-07-03 decision made the "audio-only session" investment contingent on funnel
evidence. The spec now mandates it as first-class at launch. No code conflict — just noting
the supersession so `docs/decisions.md` records it as a product-owner decision, not drift.

Minor deltas, no discussion needed: SPOT_CHECK timeout 10 s+10 s replaces `maxFramingMs` 60 s
for conductor items (config change); rest becomes tap-skippable (new control; rest is already
never auto-shortened); "demo replay" at START_POSITION timeout maps to the existing Repeat-
instructions control (there are no demo videos and none are planned for v1); spec's ≥20 fps
target is below the current 30 fps operating point; `MAX_NUMBER_CUE = 40` covers all
prescriptions.

---

## 3. State-machine mapping (spec ⟷ `TrainingSessionPlayer`)

The conductor is **not a new player**. It is a set of additions to the existing phase machine,
kept frame-timestamp-driven and replay-deterministic.

| Spec state | Existing phase | Delta |
|---|---|---|
| IDLE | `intro` / `transition` | none |
| SPOT_CHECK | `preflight` | New timeouts (10 s → hint → 10 s → Level 2 for this item, per C3); match against saved workout spot (§5.4); keep 0.5 s fast re-verify |
| START_POSITION | `instructions` (generic dwell) | **New:** per-movement start-pose predicate held 1.0 s → "Ready when you are — I'll count" cue → countdown. 20 s timeout → offer repeat-instructions / tap-to-start (control already exists) |
| COUNTDOWN | `countdown` | none (3-2-1-go, tracked-go handshake already exists) |
| ACTIVE | `set` | **New:** min/max rep duration in `RepsSetGrader`; spoken counts (C4); 45 s no-crossing → "still with me?" check-in (never auto-advance); 20 s no-motion → "take the rest — you've done N" → set complete; per-user range calibration hook (§5.5). Existing: hysteresis, smoothing, autoregulation, subject-gone reset, 120 s safety cap (retained as the outermost net) |
| REP_TICK | `repCredited` + chime | **New:** ±1 correction API on the player, always-visible UI, correction logged with derived-signal trace (C5) |
| Timed holds | `HoldSetGrader` valid-time | Already matches the spec (pause on wobble/loss, honest captions + voice). Add wall-sit condition |
| SET_COMPLETE | grader `complete` → rest/advance | chime exists (`measurement-complete`) |
| REST | `rest` | **New:** tap-to-skip-rest. Camera already "relaxes" (nothing graded) |
| TRANSITION | `transition` + floor V2.1 memory | Floor-block announcement + whole-block timer mode (C6) |
| EXERCISE_COMPLETE | `advanceItem` | none |

**No-stall invariant:** every conductor state gets an explicit timeout constant in
`ConductorConfig` (single object, no magic numbers), and a headless test drives a full
session with (a) empty frames, (b) covered-lens frames (pose never acquired), (c) subject
leaving mid-set, asserting the player reaches `done` with **zero user taps** and that every
phase's dwell stayed under its ceiling. This test is feasible today precisely because the
player is pure TS — it is the first thing built (step 2), and it will fail until the ladder
exists (that's the point).

## 4. Fail-soft ladder design

New module: `src/training/conductorLadder.ts`, owned by the player, per-item state
`{level: 0|1|2, cause, sinceMs}`; all transitions logged (§6).

- **Level 0 → 1** (during ACTIVE): landmark confidence for the movement's required chains
  below its floor for >3 s → the grader keeps running (it already tolerates `measuring=false`
  frames), but a new **tempo pacer** takes over voice: it speaks paced encouragement/counts
  from the user's recorded tempo (§5.5) so the set never goes quiet. Reps still credit when
  confidence returns. UI: small dot indicator, no words about the camera. Re-acquire ≥5 s
  stable → Level 0 at the next set boundary (never mid-set).
- **Level 1 → 2**: tracking lost >15 s during a set, or SPOT_CHECK failed (C3) → the set is
  re-planned as a timed set at the user's tempo × prescribed reps (or the movement's default
  tempo), run by `TimerSetGrader` with "I'll keep time for this set." Sets completed this way
  carry `flags: ['conductor-level-2']` so progression evidence and the measurement store know
  these reps are prescribed-count, not measured-count (**measurement honesty:** never write
  timer-mode reps into velocity/rep evidence as if measured — `SetResult.meanVel` stays NaN,
  reps recorded as `pacedReps` not `reps`; §5.2).
- **Return attempts** happen at exercise boundaries only, via a fresh SPOT_CHECK.
- Degradation never speaks about camera problems mid-set; all "what happened" language lives
  in the post-session summary, neutrally worded.

Voice-only mode = the session starts pinned at Level 2 with the camera pipeline never started
(no permission needed that day), using recorded tempos where available. Mode choice is a
first-class toggle on the session start screen, persisted per session in telemetry (§6), and
the skeleton view is replaced by a calm timer/next-up surface.

## 5. Component & data-model changes

### 5.1 New modules
| Module | Contents |
|---|---|
| `src/pose/startPose.ts` | Pure predicates: `seatedOnChair`, `standingUpright` (generalized from the check-up frame check), `wallSitPosition`, each `(out: PipelineFrameOutput, tuning) => boolean`, shared check-up ⟷ conductor |
| `src/training/conductorLadder.ts` | Level state machine + degradation event log + tempo pacer |
| `src/training/conductorConfig.ts` | `ConductorTuning` per movement (C2) + `ConductorConfig` timeouts; every constant commented with corpus evidence (initially "provisional — pre-corpus") |
| `src/training/tempoStore.ts` | Rolling per-family median rep duration (from rep timestamps), persisted in `TrainingStore` (schema-versioned addition) |
| `src/training/workoutSpot.ts` | Saved spot record + ≤2 s match check (§5.4) |
| `src/exercises/wallSit.ts` | New hold exercise (`HoldSetGrader` + new `wall-sit` condition: near-side knee ≈90° band + hip below standing reference) |
| `scripts/corpus/*` (+ `src/replay/corpus.ts`) | Label format, accuracy report, threshold sweep, `npm run corpus` one-command regression (§7) |

### 5.2 Changed modules
- `RepsSetGrader`: min/max rep-duration rejection; optional per-user range calibration
  (first 2 clean reps of set 1 establish the cycle's angle range; thresholds become
  percentages of that range — squat and step-up only, STS keeps absolute thresholds since
  the chair fixes the range); rep timestamp capture (bounded array, ≤64).
- `TrainingSessionPlayer`: START_POSITION sub-phase inside `instructions`; ladder integration;
  correction API (`adjustRepCount(+1|-1)` — guarded, logged); rest skip (`skipRest()`);
  no-motion / still-with-me timers; conductor timeouts replacing `maxFramingMs` for
  conductor items.
- `SetResult`: add `repTimestampsMs?`, `pacedReps?`, `conductorLevelTrace?`, `corrections?`.
  Additive, optional — old records stay valid, no schema break.
- `workoutGeneration.ts` / `sessionPlanning.ts`: environment-ordering pass
  (standing/chair → floor → optional standing cooldown).
- `TrainingSessionScreen`: persistent tap-to-advance affordance, ±1 rep correction buttons,
  level indicator dot, voice-only session surface, spot-check status line. (The screen
  already keeps pause/help/skip visible — the audio-first law means *never required*, not
  *never available*.)
- Audio: ~15–25 new lines × 2 voices (ready-when-you-are, still-with-me, take-the-rest,
  I'll-keep-time, spot confirmed, voice-only intro, floor-block announcement), generated via
  the existing `scripts/generate-audio.ts` + `verify:audio` flow; needs `ELEVENLABS_API_KEY`
  at generation time. Cue keys + priorities follow the existing table (counts at digit
  priority 9; check-ins at 9; pacing lines at 8, drop-if-busy).

### 5.3 What is explicitly NOT built (spec scope discipline)
Form-quality feedback of any kind; front-view march; floor-item camera grading (V2.1 stays
parked); Tier 2/3 conductor enablement before Tier 1 gates; any composite score; any change
to Check-Up protocols or scoring; video capture (C5); the step-up alternation runtime.

### 5.4 Workout-spot onboarding
One-time flow (an extension of the existing camera-setup screen, run once after plan
creation): user props the phone, passes a full preflight + standing frame check, and the app
persists a `WorkoutSpot` record — camera view, body-height fraction band, center band, and
the locked body-unit as a reference (`ProfileStore`, schema bump with migration). Subsequent
SPOT_CHECK = existing preflight with the saved bands substituted + the 0.5 s fast sample →
"you're in your spot ✓" typically inside 2 s. Spot mismatch (moved phone) falls back to the
full framing flow with gentle guidance, and offers to re-save.

### 5.5 Tempo capture
Per-rep durations from `repTimestampsMs` update a per-family rolling median in
`tempoStore` after each *measured* (Level 0) set. Consumers: Level 1 pacer, Level 2 set
duration, voice-only mode. Cold start: per-movement default tempos in `ConductorTuning`.

## 6. Instrumentation (Part 5)

Extend the existing telemetry record (schema v2 of `StoredSessionFunnel`, old records still
deserialize): `mode: 'conductor' | 'voice_only'`, per-exercise `levelHistory[{level, cause,
atMs, confidenceSummary}]`, `corrections[{atMs, delta}]`, prescribed-vs-actual
{reps, tempo, restMs} per set, `completionPoint` (the churn-location tag: `never_started` is
derivable from adherence plan records; `abandoned_setup` / `abandoned_mid_set` /
`abandoned_rest` from ended-in-phase + item index; `completed`). One derivation doc
(`docs/analytics-churn-locations.md`) defines the three churn cohorts from these fields so
the taxonomy is queryable, not tribal. Conductor set data flows into the same
`SetResult` → progression-evidence path the measurement loop already reads; nothing new to
sync (all local-first; the optional Supabase backup carries it as part of existing state).

## 7. Reliability gate & test protocol (Part 4)

**Corpus format:** one directory per clip — the app's landmark JSONL (dev recorder,
timestamp-aligned), a `labels.json` (per-set ground truth: rep boundaries by timestamp, rep
count, hold duration, notes), and clip metadata (person code, lighting, clothing, distance,
device, tempo class). Video stays on the founder's second device, referenced by filename,
never ingested by tooling (C5).

**Tooling (all headless, deterministic):**
- `npm run corpus -- report [movement]` — replays every labelled clip through pipeline +
  grader with the current `ConductorTuning`; emits per-set (not aggregate) rep error, phantom
  reps, start-position latency, degradation events, stall violations; writes a per-movement
  markdown + JSON gate report against the thresholds (≥95 % per-set count accuracy, ≤2 %
  phantom rate, ≤2 s median start latency, 0 stalls, ≤5 % Level 2 under normal conditions).
- `npm run corpus -- sweep <movement> <param> <range>` — threshold sweep over tuning fields.
- No-stall synthetics: fixture generator gains empty-frame / covered-lens / mid-set-walkout
  session-length recordings + the zero-tap full-session player test (§3).
- Gate output flips a movement's conductor status in a single flag list
  (`CONDUCTOR_ENABLED_EXERCISE_FAMILIES`, mirroring the release-policy pattern); everything
  else ships timer-guided with **zero product-flow difference** — the ladder pins those items
  at Level 2.

**Test matrix** is the spec's (2 lighting × 2 clothing × 2 distance/height × framing × ≥6
women 45–65 × 2 devices × 3 tempo classes) — recording protocol doc + label template are a
step-4 deliverable so panel sessions can start as soon as Tier 1 detection is feature-complete.
The same panel recordings double as the **rise-velocity noise-floor real-data run** (currently
the open product go/no-go) — one recording effort, two verdicts.

## 8. Risks

1. **Corpus collection is the critical path.** Six people × the matrix is days of panel time
   plus labelling. Mitigation: recording protocol ready by end of week 2; label as you record.
2. **No measured device numbers yet** (C1): fps/thermal/latency on the 3-year-old Android and
   the noise floor are all unverified; MediaPipe cannot run in the emulator at all, so
   *every* pose behavior check needs the physical devices. If 640×480/`full` can't hold
   ≥20 fps through 25 min, first lever is `lite`, second is resolution — both existing props.
3. **Heel raise and march miscount risk** is real and already documented in-code; the ladder
   and per-movement gating are the containment. Plan for march to gate late or ship Level 2.
4. **Voice V2.1 coupling:** conductor cues enter a live, intricate sequence planner with
   parked beta subsystems awaiting detangle. Mitigation: conductor lines go through the plain
   `VoiceCueKey` path (as the 2026-07-04 frame-check did, avoiding V2.1 contract churn).
5. **Timebox:** weeks 1–2 ladder+no-stall+start-pose, 3 march/squat calibration + harness,
   4–6 corpus + tuning, 7–8 gate buffer. If squat/march look unlikely to gate by week 6, the
   cut is declared explicitly: STS-only conductor + timers everywhere else (spec allows this).
6. **Parallel worktree edits** (founder active on the same repo): conductor work stays on a
   dedicated branch, small PRs by component, no drive-by refactors of shared files.
7. **Schema changes** (ProfileStore spot, TrainingStore tempo, telemetry v2, SetResult
   fields) are all additive with migrations; each lands in its own PR with old-record tests.

## 9. Build order (maps to Part 6; PRs are small and component-scoped)

1. **TDD approval** ← you are here (includes decisions on C3, C4, and C1/C2/C5/C6/C8
   sign-off).
2. Conductor config + ladder + no-stall tests + START_POSITION predicates (STS first).
3. Tier 1 end-to-end: STS (shared predicate with check-up), squat (+per-user calibration),
   march (+debouncing); spoken counts; corrections; rest-skip; tempo store.
4. Corpus tooling + recording protocol → founder records panel corpus → tune to gate.
5. Session-flow integration (floor-block ordering + announcement), voice-only mode,
   workout-spot onboarding, telemetry v2, new audio generation.
6. Tier 2 only after Tier 1 gates on real corpus data.

---

**Stopping here for approval.** The three decisions I need from you before step 2:
**C3** (silent Level-2 degrade replaces the setup-issue ask — recommended: yes, except the
session's first item), **C4** (spoken counts for slow movements + milestone counts for march —
recommended as written), and confirmation that **C1's** device measurements landing in the
gate report (not this doc) satisfies the "recommend with measured data" requirement given no
physical device is reachable from this environment.
