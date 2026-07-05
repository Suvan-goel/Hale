# TDD Addendum — Voice-Guided Sessions v1, Conductor Parked

Date: 2026-07-05 · Status: **awaiting founder approval — no implementation started**
Supersedes: parts of `TDD.md` per the 2026-07-05 direction change. `TDD.md` §1 (repo review),
§2 conflict analysis (re-triaged below), and §7 gate tooling design remain the reference;
this addendum changes what gets built.

**The decision being implemented:** v1 training sessions are voice-guided with voice
commands ("I'm ready" / "done"), no camera. The camera remains the measurement instrument
(Check-Up + micro-checks), unchanged. Camera-conducted sessions are parked as v2 behind a
feature flag; promotion trigger is churn-location data.

---

## 1. Voice interaction mapped onto the existing session player

### 1.1 The tick-source change (the one real refactor)

`TrainingSessionPlayer` is clocked by pose-frame timestamps (`update(out, voiceBusy)` per
camera frame). With no camera, voice sessions need a different clock. Proposal: a narrow
refactor to a `PlayerTick` — `{ timestampMs, pose?: PipelineFrameOutput }` — consumed by
`update()`. In camera mode (parked path, and all existing tests) every tick carries a pose
frame, behavior byte-identical; in voice mode the screen drives a ~4 Hz interval tick plus
event-driven ticks on voice/tap input and TTS completion. All phase logic already reads only
`timestampMs`, so the refactor is mechanical; replay determinism is preserved (a recorded
tick stream replays a voice session exactly, same as landmark recordings do today).

Not chosen: a separate `VoiceSessionPlayer`. It would duplicate the rest/resume/skip/funnel/
safety-cue machinery that is mode-independent, and the two players would drift — the parked
conductor path stays healthiest inside the one player it already lives in.

### 1.2 Phase mapping (voice mode)

| Spec state | Player phase | Change |
|---|---|---|
| Exercise announced + instruction | `transition` → `instructions` | Camera preflight is **bypassed** in voice mode (`preflight` phase never entered). Instruction cues unchanged (existing per-exercise lines); "repeat" replays them (control + intent) |
| WAITING — "Say 'I'm ready' when you're set" | **new phase `waiting_ready`** (replaces the tracking-dwell exit from `instructions`) | Enters after instruction playback completes. Listening window open. Timeout ladder: 20 s → one gentle reprompt → tap prompt highlighted; waits patiently thereafter (an *offered* affordance is not a stall) |
| Countdown | `countdown` | Unchanged (3-2-1-go, tracked-go handshake) |
| SET ACTIVE (reps) | `set` with **new `ReportedSetRuntime`** | No grader, no clock pressure. Optional metronome SFX (off by default). Listening window open for done/pause/skip. Check-in line at 2× the expected set duration (from tempo defaults), tap always visible; never auto-advances |
| SET ACTIVE (holds/timed) | `set` with the existing player-clock timer path | Audio timer + existing `times-up` cue; "done" ends early (logged as actual seconds) |
| Set logged | `runtime.finish()` | `SetResult` semantics: §1.4 |
| REST | `rest` | Add skip (voice "skip"/tap — new `skipRest()`); add the one-tap **adjust reps** control (§1.4). Rest never auto-shortened (unchanged) |
| Floor exercises | identical flow | No ordering constraint, no floor setup gate — floor V2.1 machinery bypassed in voice mode (stays flag-parked) |

Voice intents map to player methods: `confirmReady()` (new), `completeSet()` (new),
`skipCurrentItem()` / `pause()` / `resume()` (exist), repeat → existing repeat-instructions
control path, `skipRest()` (new), `adjustReportedReps(delta)` (new, rest screen only).

### 1.3 Windowed listening (no wake word)

- Windows open only in `waiting_ready`, `set`, and `rest`, and **only while the voice channel
  is idle** — `voicePlayer` already reports per-request completion outcomes, so the window
  opens on TTS-complete + a ~300 ms guard (speaker echo tail) and closes before any line
  plays. This is the self-triggering defense and it composes cleanly with the existing
  one-line-at-a-time / drop-stale audio laws.
- Vocabulary: ≤8 intents — ready (variants: "I'm ready" / "ready" / "okay"), done
  ("done" / "finished"), skip, repeat, pause, resume — all phrase variants in a config-driven
  table (`src/voice/intents.ts`, plain data, per C2's resolution), matched tolerantly
  (normalized contains/edit-distance; recognizers return transcripts, we match locally).
  Bias: high recall on "done" (breathless user), higher precision on "skip".
- Honest mic indicator: a persistent UI element bound to actual native listening state
  (window open = shown), plus the OS-level indicators (Android 12+/iOS) which we get for free.
- **Tap parity invariant:** every intent has an always-visible control; the no-stall test
  (§3) runs a full session with the mic denied and with a recognizer returning garbage.

### 1.4 Rep handling without the camera (data honesty)

On "done" the set logs the prescribed target as **reported**, not measured:
`SetResult` gains `reportedReps?: number` and `repsAdjusted?: number` (from the rest-screen
control); `reps` stays 0 and `meanVel` stays NaN in voice mode so nothing downstream ever
mistakes reported effort for measurement. Flags: `['voice-guided']`. Progression evidence
already keys on completion/RPE/pain (the 2026-07-04 "gentle step-ups" engine), not velocity,
so it works unchanged; velocity autoregulation is simply inert in voice mode. Prescribed vs
reported lands in telemetry per set (§4).

## 2. Keyword-spotting technology recommendation

**Recommendation: platform-native on-device recognizers, wrapped in a local Expo module
(`modules/expo-voice-commands`) mirroring the `expo-pose-detection` pattern — with a
week-1 spike as the go/no-go, and sherpa-onnx as the pre-agreed fallback.**

| Option | On-device | License | Binary/model size | Notes |
|---|---|---|---|---|
| **A. Platform-native** — iOS `SFSpeechRecognizer` with `requiresOnDeviceRecognition = true`; Android `SpeechRecognizer` (`createOnDeviceSpeechRecognizer`, API 31+, or `EXTRA_PREFER_OFFLINE`) | Yes — iOS flag *errors* rather than silently using the server (enforced honesty); Android on-device model via Google speech services | Platform APIs — none | **0 MB** | Zero new dependencies (aligns with the no-new-deps rule). Short windowed requests sidestep long-session limits and end-pointing quirks. Risk: on-device availability/quality on a 3-year-old Android A-series — exactly what the week-1 spike measures on the real target device |
| **B. sherpa-onnx KWS** (Zipformer keyword models) | Yes | Apache 2.0 | ~4–15 MB model + native libs | Uniform behavior across platforms, tiny fixed vocabulary is its home turf. Cost: a new native dependency + model bundling/verification (the pose-model download/verify scripts are the template). Fallback if A fails recall on the Android target |
| C. Picovoice Porcupine/Rhino | Yes | **Commercial** (production requires paid license + vendor account/key) | ~1–3 MB | Best-in-class accuracy, but a paid closed vendor inside a privacy-pitched feature, and a license key in the app. Only if A *and* B fail |

Cloud speech and continuous transcription are excluded by the spec (and by the product's
privacy posture). No audio and **no transcripts** are ever persisted — the module emits only
`{intent, atMs}` events; raw transcripts die in the matcher.

**Product note worth naming:** with no camera in sessions, the phone no longer needs to be
propped 2.5–3.2 m away for daily training — it can sit within arm's reach. That materially
improves mic SNR (breathless speech, UK living-room noise) *and* makes tap parity effortless.
Framing constraints now exist only on measurement days.

## 3. No-stall + reliability invariants (voice edition)

- Every waiting state keeps an explicit timeout → one gentle reprompt → highlighted tap
  affordance; thereafter the app waits patiently (never auto-advances a set, never rushes).
- Automated headless tests (player is pure TS): (a) full session, mic permission denied —
  completable tap-only, zero recognizer events; (b) recognizer emitting noise/garbage —
  no false intent fires (matcher precision test), session completable; (c) TTS-busy overlap —
  windows never open while a line plays; (d) timeout ladders fire exactly once per state.
- Mic permission is requested in context (first session, one honest sentence), and denial
  permanently falls back to tap mode with no nagging (re-offer only from Settings).

## 4. Instrumentation (unchanged requirement, extended schema)

Telemetry record v2 (existing local store, schema-versioned, old records readable):

- `completionPoint` churn taxonomy as in TDD §6 — `never_started` / `abandoned_setup` /
  `abandoned_mid_set` / `abandoned_rest` / `completed` — **this is the conductor promotion
  trigger**, so it ships in the first integration PR, not last.
- Per set: `confirmLatencyMs` (waiting_ready entry → confirmation), `confirmChannel`
  (`voice` | `tap` | `tap_after_reprompt`), `endChannel` (same for "done"), reprompt counts,
  `prescribedReps`/`reportedReps`/`repsAdjusted`, actual vs prescribed rest.
- Per session: mic permission state, voice-vs-tap usage rates, intent counts (no transcripts).
- Derivation doc `docs/analytics-churn-locations.md` as in TDD §6.

## 5. Feature-flag plan — parking the camera session path

- `TrainingSessionMode = 'voice_guided' | 'camera_conducted'`. Production always constructs
  voice mode; camera mode sits behind `EXPO_PUBLIC_ENABLE_CAMERA_CONDUCTED_SESSIONS`
  (default off, excluded from the safe-beta-flags verification like the existing flags).
- **Nothing is deleted.** The player keeps its preflight/floor phases (voice mode just never
  enters them); set graders, floor V2.1, and the camera session screen path stay compiled and
  under test. The existing player/grader test suites construct the player directly and keep
  running against camera mode, so the parked path cannot silently rot.
- The detection stack keeps maturing through the Check-Up and micro-checks regardless —
  same graders, same pipeline (TDD §1.4 mapping stands for v2 promotion).
- TDD conductor components **not built now**: ladder, start-pose predicates for training,
  workout-spot store, tempo store, per-user squat calibration, wall-sit grader (wall sit
  enters the library as a `timer` exercise — a catalog entry, no grader). The TDD remains
  their design of record for v2.

## 6. Conflict re-triage

| # | Status under the new direction |
|---|---|
| C1 pose bake-off | **Adopted as decided:** MediaPipe stays, no bake-off; device numbers land in the gate report from the week-1 device session. Thermal requirement relaxes to ≤10 min camera contexts (check-up) — the 25-min soak is dropped |
| C2 JSON vs TS config | **Stands, re-targeted:** config-driven voice phrases/intents + measurement tuning as typed data-only objects (JSON-serializable), per the same resolution |
| C3 silent degrade | **Resolved by direction:** no camera in sessions. Measurement contexts: **no silent degradation, ever** — the existing Retry (with setup help)/Skip flow stands; low-confidence results are marked invalid rather than recorded (the evidence taxonomy + `no-measurement`/interruption flags already carry this; an explicit invalid-marking pass is in the build order). No-stall timeouts kept everywhere |
| C4 spoken rep counts | **Moot for v1.** Recorded as the standing v2 decision: spec-as-written for slow movements, milestone counts + chime for march |
| C5 video vs privacy copy | **Adopted:** the app records no video, full stop; corpus video from a second device during panel sessions |
| C6 floor-last ordering | **Dropped for v1.** Generator orders by training logic; floor-last becomes a mode-conditional constraint compiled in only for camera_conducted mode (v2) |
| C7 shared STS detection | **Stands, narrowed to measurement:** chair rise / balance detection shared between Check-Up and micro-checks (already true); training no longer consumes it in v1 |
| C8 march signal | **Moot for v1** (march is voice-guided). Side-view recommendation recorded for v2 |
| C9 voice-only go/no-go | **Inverted by direction:** voice is now the primary mode; the evidence question (churn locations) now gates *conductor* promotion instead |

**New conflicts created by this direction:**

- **N1 — Mic permission vs the 2026-07-01 audio decision (the big one).** That decision
  disabled microphone permission, `RECORD_AUDIO`, and background audio at the config-plugin/
  manifest layer, noting "if future sessions need microphone capture, this config must be
  revisited deliberately." This is that deliberate revisit: re-enable mic permission in the
  config plugin, request at first session in context, and update `docs/decisions.md`.
  Runtime audio law also needs a scoped amendment: the "recording disabled" audio-mode rule
  exists to protect the *camera* session — voice sessions have no camera, so the
  voice-commands module may hold a recording-capable audio session **only inside voice-guided
  training sessions**, restoring playback-only config on exit; camera flows (check-up,
  micro-check) never see a recording session. CLAUDE.md's audio-law paragraph gets amended
  accordingly on approval.
- **N2 — iOS audio-session coexistence.** `playAndRecord` category has real pitfalls (route
  falls to earpiece without `.defaultToSpeaker`, output level changes, Bluetooth routing).
  The voice module owns all category transitions natively in one place; the week-1 spike
  includes prompt-playback → window-open → recognize round-trips on device. Android:
  recognizer owns its own input; verify audio-focus/ducking against `expo-audio` playback.
- **N3 — Privacy copy + claims guardrails.** Add the mic sentence ("audio processed on your
  phone only, never recorded, never uploaded" — must be implementation-true: no audio files,
  no transcripts) alongside the existing camera promise, and extend `copyGuardrails.test.ts`
  to pin both.
- **N4 — Voice V2.1 sequence planner touchpoints.** New session phases mean new cue plans in
  the live V2.1 training voice path. Same containment as the 2026-07-04 frame-check work:
  conductor-agnostic lines go through plain `VoiceCueKey`s where possible, avoiding V2.1
  contract/fingerprint churn. ~10–15 new lines × 2 voices via the existing generation +
  `verify:audio` flow (needs `ELEVENLABS_API_KEY` at generation time).
- **N5 — Reported-vs-measured data separation.** §1.4's `reportedReps` split must be enforced
  wherever `SetResult.reps` is read today (progression evidence, session summaries, Supabase
  backup shapes) so reported counts never enter measurement surfaces. Additive schema,
  audit-by-grep, tests on the evidence path.

## 7. Reliability gate — rescoped to measurement movements

Gate applies to (enumerated from the repo):

- **Check-Up battery (Movement Profile V2):** `chair-rise-v2` (30 s STS, rise velocity),
  `one-leg-balance-v2` (current battery) — plus `balance-eyes-open-v2` (the built ladder
  protocol scheduled as the last pre-launch protocol switch; it gates *before* that switch
  ships), `active-shoulder-reach-v2`, and supporting `hinge-reach`.
- **Micro-checks:** `chair-power`, `single-leg-balance`, `mobility-reach` — same underlying
  movements/graders as above, so the same corpus covers them.

Thresholds unchanged from the original spec (≥95 % per-set accuracy, ≤2 % phantom rate,
≤2 s start-position latency — measured against the standing-frame-check/protocol-setup
predicates — zero stalls). Tooling exactly as TDD §7 (label format, `npm run corpus` report +
sweep, per-set not aggregate), just pointed at 5 movements instead of 12. The corpus panel
recordings double as the rise-velocity noise-floor real-data go/no-go, as agreed.

## 8. Revised build order & timeline

Small PRs by component; every threshold/phrase in config; claims discipline + warm-patient
tone on every string. Founder-facing checkpoints in bold.

| Week | Work |
|---|---|
| **1** | **Spike (go/no-go):** `expo-voice-commands` module skeleton both platforms; on-device recognition of the real vocabulary on the two target devices (including breathless/across-the-room speech); iOS audio-session round-trip (N2); Android on-device availability on the 3-year-old A-series. **Also:** the measurement-device session from C1 (fps/latency numbers for the gate report). Output: Option A confirmed or fallback B invoked (+~1 week) |
| **2** | Voice module hardened (windowed listening, config phrases, honest indicator, no transcript retention); player tick refactor (§1.1) + voice-mode phases + `ReportedSetRuntime`; no-stall/mic-denied/garbage-input headless tests |
| **3** | Session screen (tap-parity controls, mic indicator, adjust-reps on rest, in-context permission); new voice lines generated (both voices); mode-conditional generator constraint (C6); privacy copy + guardrail tests (N3); telemetry v2 with churn taxonomy + confirm-latency/channel fields (§4) |
| **4** | Measurement-context pass: explicit invalid-marking for low-confidence results (C3), retry-with-setup-help polish; config-plugin mic permission change through an EAS build; on-device end-to-end of a full voice session; decisions.md + CLAUDE.md amendments. **Voice sessions beta-ready** |
| 3–6 (parallel) | Gate tooling scoped to the 5 measurement movements; corpus protocol + label template by end of week 2 → **founder records panel corpus** → tune → per-movement gate reports + the noise-floor verdict |

Net: voice-guided sessions land ~2 weeks earlier than the conductor Tier-1 estimate, and the
measurement gate finishes inside the original 6–8-week clock with buffer. Biggest schedule
risk is week 1's Android recognizer spike (pre-agreed fallback: sherpa-onnx, +~1 week);
second is panel scheduling for the corpus (unchanged from before).

---

**Stopping here for approval.** Decisions embedded above that I'll treat as approved with
this addendum unless you say otherwise: the tick-source refactor over a second player
(§1.1), platform-native KWS with sherpa-onnx fallback (§2), the scoped audio-law amendment
and mic-permission revert (N1), and `reportedReps` as a separate field from measured `reps`
(§1.4/N5).
