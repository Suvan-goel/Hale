# Batched Device Session — Consolidated Protocol

Date: 2026-07-06 · Owner: founder (both target devices)
Consolidates EVERY deferred physical-device check (2026-07-06 checkpoint amendment):
the KWS spike is a HARD GATE that now sits **before beta and before any engine-specific
tuning** — nothing engine-specific may be built until it passes.

**Two sessions (consistency pass 2026-07-06):**
- **Session A — Blocks 0–6 and 9** (one evening): everything buildable today.
- **Session B — Blocks 7–8** (follow-up): the clarity-instrument audio gates. They
  require native VAD/ASR adapter builds that DO NOT EXIST yet and deliberately follow
  Session A's Block-2 engine verdict (adapters are engine-specific work, forbidden
  before the spike passes). Until Session B passes, both instruments stay dark in
  production by construction (`unavailable` defaults).

Devices: the recent iPhone + the ≥3-year-old mid-range Android. Bring: Bluetooth
headphones, a lamp-lit room, a TV, a sturdy chair, a charged power bank.

Run in this order — later blocks depend on earlier ones.

## Block 0 — Builds (once, before the evening)

1. `npm run verify:audio` and a dev-client build per platform with
   `EXPO_PUBLIC_VOICE_SPIKE=1`.
2. **iOS pod compile** of `expo-voice-commands` happens implicitly here — the first
   iOS build since the module landed. If the pod fails, fix before the evening; nothing
   else on iOS can run. (Owed since commit `31268bd2`.)
3. A second dev-client build per platform WITHOUT the spike flag, for Block 4.
4. A dev-client build with `EXPO_PUBLIC_ENABLE_CLARITY_DIMENSION=1` (dev-only flag)
   for Block 9's Clarity surfaces; the build from (3) doubles as Block 9's
   dark-state check build.

## Block 1 — Availability + permissions (5 min/device)

1. Launch spike harness → permission prompt → grant. Confirm the OS mic indicator
   appears when a window opens and disappears when it closes.
2. On-device availability shows `on_device_supported` (iOS) / `on_device_api`
   (Android 12+) — record the exact reason string on the older Android.
3. **Airplane mode ON for one full Block 2 condition-A pass per device** (proves the
   on-device path; Android especially). Leave airplane mode on where feasible.

## Block 2 — KWS spike trial matrix (the gate; ~45 min/device)

Per `docs/specs/VOICE_KWS_SPIKE_GO_NO_GO.md` §3–§4 + §8 (criteria frozen 2026-07-05,
pre-run amendments only):

| Order | Condition | Cells |
|---|---|---|
| 1 | A quiet, arm's reach | all 6 commands + stop + pain ("that hurts" ×10 AND "ow/ouch" ×10) |
| 2 | B TTS coexistence | ready, done |
| 3 | C TV noise (~60 dB speech) | ready, done, skip |
| 4 | D breathless (10 brisk sit-to-stands first) | done, stop, pain |
| 5 | E quiet-voice | done, stop, pain |
| 6 | F 3 m distance (info only) | ready, done |

≥10 trials per cell. Gate: §4 table + §8 safety cells (stop/pain ≥95 % in A/D/E);
latency ≤1.5 s median. Export JSON per device when done. One matcher-tuning iteration
is allowed if a cell fails; a second failure of any gating cell → **sherpa-onnx path,
no further approval needed**.

## Block 3 — Always-on exposure (~25 min/device, can run during breaks)

1. **Self-echo test (§8):** hot window open; play "Stop if you feel sharp pain or
   discomfort that keeps building." through the speaker at session volume ×10.
   Zero self-fires = the 17 allowlisted lines keep their wording; any self-fire =
   reword-vs-suppress decision returns to the founder with the count.
2. **False-accept soak (condition G):** 10 min continuous window: TTS playing
   intermittently, TV speech, talk to someone else in the room. Budget: ≤1 unintended
   fire total, ≤1 pain, zero skip.

## Block 4 — Audio routing (amendment 2; ~15 min/device, non-spike build fine)

Per criteria §5: (1) TTS at normal loudness through the SPEAKER while a listening
session is active — no earpiece fallback, no heavy ducking; (2) toggling windows never
flips the route; (3) Bluetooth: TTS to headphones, note which mic captured, listen for
HFP quality collapse; (4) after session exit, next voice line + user's own music behave
exactly as before; (5) full camera Check-Up runs untouched with the voice build
installed (voice module never initializes in camera flows); (6) **mic-gate UX pass**
(2026-07-06 screen slice): the first voice session shows the one honest prompt exactly
once — decline lands in full tap mode and the NEXT session shows no prompt; grant starts
listening with the safety-word line shown once; the in-app "Voice on" indicator and the
OS mic indicator appear and disappear together with the listening window.

## Block 5 — Measurement-side numbers (same evening, camera flows; ~20 min)

1. `EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS=1` build: record pose fps / inference
   / source-age on both devices during a chair-stand run at 2.5–3 m in lamp light
   (the C1 numbers, landing in the gate report; thermal now only needs the ≤10-min
   check-up window).
2. If time allows: record landmark JSONL of one full chair-stand set per device —
   feeds the measurement-gate corpus and the rise-velocity noise floor.

## Deliverables

- `voice-spike-<device>-<date>.json` ×2 (harness export) → hand to Claude.
- Filled §4/§8 tables + Block 3/4 observations (photos of notes are fine).
- Verdict lands in `docs/audits/VOICE_KWS_SPIKE_RESULTS.md`; engine decision +
  allowlist decision + C1 numbers all come out of this one evening.

## Block 6 — Glue verification (manual checks for source-pinned App wiring; ~15 min)

Founder-directed alternative to an App-level test harness (2026-07-06). One device is
enough; these verify App.tsx glue whose underlying logic is already unit-tested.

1. **Pain fold at completion:** run a voice session, trigger "something hurts" once,
   finish the session. Verify `training-state.json` painHistory gained the event AND the
   session's telemetry funnel record carries it (pull both files; the audit record must
   list the same exerciseId/setIndex).
2. **Settings reversal round-trip:** with an exclusion active (two pain sessions on one
   movement, or a seeded state), open Settings → Equipment → Swapped-out movements →
   bring it back. Verify: the row disappears, the next generated session may include the
   movement again, `painHistory` events for that ladder are cleared, and the telemetry
   funnel files are BYTE-IDENTICAL to before the toggle.
3. **Summary ±rep on the final exercise:** finish a voice session, adjust the final
   exercise −1 on the summary screen. Verify the adjustment appears in the session data
   (reportedReps/repsAdjusted) and NOWHERE in measured fields (reps stays 0, meanVel
   null/NaN) — and that no measurement surface (Progress, check-up history) moved.
4. **Resume-snapshot write-through:** start a planned voice session, finish one full
   exercise, force-kill the app mid-second-exercise. Relaunch → the session offers
   Continue after the last finished item; the first exercise's results (including any
   ±rep adjustment made in its window) survived.

## Block 6b — Programme v2 voice-session bridge glue (SESSION A; ~20 min, one device; appended 2026-07-07)

Dev build with `EXPO_PUBLIC_ENABLE_PROGRAMME_ENGINE_V2=1`. The bridge reuses the
already-gated voice player, so Block 2/3/4 verdicts carry over — these checks verify
the programme-specific glue only. Audio for programme lines may not exist yet
(founder generation step); if absent, verify graceful degradation (captions/on-screen
state still advance; no crash, no hang) and record "silent-pass".

1. **Full bridged session:** onboard → first 15-minute session. Verify order
   warm-up → main exercises → power finisher; ready-gating waits indefinitely
   (one gentle re-prompt only); "done" advances; rest timers run; the RPE card
   follows completion; the level-up/gateway card logic fires off the reported
   results.
2. **Safety words in a programme session:** "that hurts" mid-exercise halts the
   set, skips the exercise, and after finishing the session, the pattern shows the
   pain regression (level dropped to last pain-free) — never a promotion.
3. **±rep then promotion arithmetic:** adjust the final set −2 on the rest/summary
   window; verify the session outcome's reported value carries the adjustment and
   the double-progression target advances (or holds) accordingly next session.
4. **Activation stamp:** first-ever session start flips `firstSessionStarted` in
   programme.json AND the same session's funnel record carries the v3 stamp —
   exactly one funnel record for the session (controller-owned, none from the shell).
5. **Abandonment:** exit mid-session via the end-confirmation; funnel records
   `abandoned` once; the shell returns home; no partial outcomes were applied.
6. **Check-up #0 persistence (ruling 2026-07-07):** run the movement check from the
   programme home; verify a `checkup-*.json` record exists (raw-saved even if the
   app is killed right after the last movement), placement applied, and the record
   tolerates being listed alongside full-battery check-ups wherever history renders.

## Block 6c — Integrated v2 app shell (SESSION A; ~25 min, one device; appended 2026-07-07, promotion integration Phases 2–4)

Dev build with `EXPO_PUBLIC_ENABLE_PROGRAMME_ENGINE_V2=1`. The shell now boots the
FULL app (tabs + settings) on the shared screens; Block 6b's checks still apply to
the session core and are not repeated here. These checks verify the integrated
shell only. This block, together with 6b, satisfies the pre-promotion checklist's
"on-device pass of the full shell" item.

1. **Merged onboarding, old design:** welcome (hero + fact tiles) → A questions →
   consent → Stage B (dots progress in the header) → C/D questions → placement
   reveal → expectation CTA. Verify: every question shows its "why we ask"; the
   back arrow steps to the previous question and re-answering works (change an
   answer, confirm downstream questions re-ask only where visibility changed);
   skips show their explicit labels; single selects advance on ONE tap.
2. **The 'now' chain:** answer the assessment offer "Let's do it", tap "Start your
   first session now" → Check-up #0 runs FIRST (intro → 45 s warm-up with
   countdown → balance → chair), then the first session starts automatically on
   the freshly derived placement. Abandon variant: cancel the check-up → lands on
   the Today tab, no placement applied, first-session CTA present.
3. **Tab shell:** all four tabs render and switch with state retained; the tab bar
   hides during sessions, check-ups, settings flows, and learn articles.
   - **Today:** greeting header; levels card (5 patterns, post-easing numbers);
     hero action card with truthful minutes; check-up offer card only when due.
   - **Plan:** mountain hero with the same session CTA; levels list with
     plain-language names; chosen-day pills match D1 answers.
   - **Progress:** empty state for a fresh v2 user (partial check-ups NEVER
     appear as official trends); every check-up CTA opens Check-up #0.
   - **Explore:** Learn articles open and close; an extra practice session runs
     on the voice player and completing it changes NO level anywhere (check the
     levels card before/after — extra practice never feeds promotion).
4. **Settings in v2:** name/DOB/sex/stage edit and persist; voice picker previews
   and persists; preferred days round-trip into the programme profile (change
   days, kill the app, verify they held); starting effort edit persists; NO
   pain-exclusion section exists; life-goal, safety-profile, and camera-setup
   reviews open and return; the account card renders.
5. **Sign-in adoption (one device):** onboard as guest → sign in from Settings →
   verify programme state, profile, and check-up history survive (adopted into
   the account scope); sign out → guest scope is empty (moved, not copied).
6. **Moment surfaces styled:** RPE check-in renders as option cards; session-done
   card; deferred re-offer "Sounds good — later" lands HOME (no loop) and the
   Today check-up entry persists; gateway teach card completes demo → confirm →
   Later without dead ends.

## Block 7 — Dual-task VAD go/no-go (clarity instruments; SESSION B; ~30 min/device)

**Prerequisite:** a native `SpeechActivityMonitor` adapter, built AFTER Session A's
Block-2 engine verdict (engine-specific work is gated on the spike).

Criteria FROZEN at CLARITY_INSTRUMENTS_TDD approval (2026-07-06); pre-run amendments
only, one tuning iteration allowed on the verbal floor, second failure of any gating
cell → the instrument ships `unavailable` on that platform (recorded limitation).
Requires a native SpeechActivityMonitor build (does not exist yet — this block gates it).

1. **Speech-presence accuracy at check-up distance (2.5–3.2 m):** count backwards in
   threes aloud during a real one-leg hold, ≥10 trials per condition (quiet; TV speech
   ~60 dB). Gate: ≥90 % of speaking windows detected; ≤1 false-active window per silent
   60 s. Long deliberate pauses (5–10 s mid-count) must NOT drop cumulative speech
   below the floor for an otherwise-spoken hold (F5).
2. **Floor tuning:** if a cell fails, ONE iteration on `DUAL_TASK_VERBAL_FLOOR`
   (src/voice/speechActivity.ts), then re-run that cell.
3. **Aggregate honesty:** exported summaries carry only {speechActiveMs, windowMs} —
   confirm no transcript/audio surface exists in the native module API.
4. **HARD GATE — camera+mic coexistence (F1, founder condition):** on the dual-task
   screen with the camera live, activate/deactivate the recording session ×10 across
   a run: camera session must never drop, pose fps must hold (±2 fps), playback-only
   audio must restore after (next voice line plays normally). ANY camera interruption
   on the target cheap Android = fail → dual-task `unavailable` there; it does not
   ship flaky. Also verify a full camera Check-Up afterwards is untouched.
5. Battery/thermal note over the added ~70 s; airplane-mode pass (VAD must be fully
   on-device).

Deliverables: filled cells + floor value chosen → verdict in
`docs/audits/VOICE_KWS_SPIKE_RESULTS.md` (same file, new section); the
`defaultSpeechActivityMonitor` stub is replaced by the native module ONLY after PASS.

## Block 8 — On-device ASR go/no-go (fluency; SESSION B; ~30 min/device)

Criteria FROZEN at CLARITY_INSTRUMENTS_TDD approval (2026-07-06); pre-run amendments
only. Requires a native FluencyTranscriber adapter build (does not exist yet — this
block gates it; the adapter MUST go through createSanitizedFluencyTranscriber).

1. **On-device honesty (airplane mode ON):** availability must report truthfully; on
   iOS the on-device flag must ERROR rather than silently use the server. Any silent
   server fallback anywhere = hard fail (there is no acceptable cloud state).
2. **Count recall:** read a scripted 20-word category list aloud over 60 s, ≥5 runs per
   condition (quiet; TV speech ~60 dB), phone in hand. Gate: counted words ≥85 % of the
   distinct words spoken (recall on the COUNT, not transcript fidelity), both test
   voices (founder + one panel voice), UK accents.
3. **Error-path sanity:** deny the OS speech permission once (→ user_declined recorded,
   check-up completes); kill the recognizer mid-window (→ transcriber_failed, no crash,
   no logged transcript anywhere — check device logs for canary words).
4. **Permission UX:** the iOS speech prompt appears in-context from the consent
   screen's Start only — never at launch; decline lands honestly and is not re-prompted
   within the session.
5. Latency note: window end → count available ≤2 s.

Deliverables: filled cells → verdict in `docs/audits/VOICE_KWS_SPIKE_RESULTS.md` (new
section); `defaultFluencyTranscriber` is replaced by the sanitized native adapter ONLY
after PASS. Fail → fluency ships `unavailable` (recorded limitation), nothing else
blocked.

## Block 9 — Reposition & Clarity surface glue pass (SESSION A; UI-only, no gates; ~25 min, one device is enough)

Maps every recorded "owed on device" UI item to a block (consistency pass 2026-07-06).
Plain tap/render flows — no camera or mic behavior is being judged here.

1. **Cold open:** kill and relaunch the production-flagged build — the app reaches
   Today with no render error (pins the hooks-order crash class caught 2026-07-06).
2. **Menopause Phase-1 funnel (owed 2026-07-05):** female onboarding shows the stage
   question with the v10 taxonomy (Perimenopause / Menopause / Post-menopause /
   Not sure / Prefer not to say), required-before-Continue with prefer-not first-class;
   male path skips it; Settings reference-details editing behaves in both sex states;
   the menopause Learn article opens; results header reads "Your Strength Profile".
3. **Reposition surfaces (owed from slices 4–8):** symptom picture multi-select in
   onboarding and Settings (exclusive none/prefer-not behavior); first-ever results
   show NO tier chips and NO comparison affordance; second check-up shows the quiet
   "See how you compare" entry → toggle round-trip on the results screen AND via
   Settings → Privacy & data → Results; phase-report noun on retest results; Clarity
   check-in appears after an official check-up (clarity build), items save
   all-or-nothing, skip works; ghost curve renders in-frame once ≥4 official readings
   exist (seeded/dev data acceptable — geometry and copy are the check).
4. **Clarity instruments dark state (production-flagged build):** after an official
   check-up, NO level-2 offer and NO fluency consent appear (gates pending), and the
   stored record carries `unavailable` for both instruments; on the clarity build the
   same holds (transcriber/monitor defaults still report unavailable) — confirming the
   double-gating.
5. **Voice-line listening review (owed since the pain-safety slice):** play the 10
   generated voice-session/pain assets (×2 voices) once each — tone and pronunciation
   pass, no clipping.

Deliverables: a checked-off copy of this list; any failure files as a normal bug, not
a gate.
