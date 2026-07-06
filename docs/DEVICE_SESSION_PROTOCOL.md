# Batched Device Session — Consolidated Protocol

Date: 2026-07-06 · Owner: founder (one evening, both target devices)
Consolidates EVERY deferred physical-device check (2026-07-06 checkpoint amendment):
the KWS spike is a HARD GATE that now sits **before beta and before any engine-specific
tuning** — nothing engine-specific may be built until it passes.

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

## Block 7 — Dual-task VAD go/no-go (clarity instruments; ~30 min/device)

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
