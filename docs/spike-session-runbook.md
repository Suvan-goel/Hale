# Spike Session Runbook — the ~90-minute run that unblocks all remaining build work

Date: 2026-07-07 · Owner: founder · Devices: the recent iPhone + the ≥3-year-old Android

This is an OPERATIONAL companion to the frozen criteria — it amends nothing. Authority:
`docs/specs/VOICE_KWS_SPIKE_GO_NO_GO.md` (§3/§4/§8 gates, frozen 2026-07-05) and
`docs/DEVICE_SESSION_PROTOCOL.md` Blocks 0–4. If this document and those disagree, they win.

## Why this session, and only this session, blocks building

Three results come out of it; every remaining engineering task hangs off one of them:

1. **The engine verdict (Block 2 + condition G):** platform-native recognition (Option A)
   vs sherpa-onnx (Option B — proceeds WITHOUT further approval if A fails twice in any
   gating cell). Gates: the Clarity VAD adapter (Block 7 prereq), the fluency ASR adapter
   (Block 8 prereq), all engine-specific tuning, and which path hot listening ships on.
2. **The self-echo count (Block 3.1):** zero self-fires = the 17 allowlisted lines keep
   their wording; any self-fire = I get a reword-vs-suppress decision from you and then
   empty the allowlist either way. Gates: hot listening shipping.
3. **The audio-routing rows (Block 4 / spec §5.1–5.4):** pass/fail per row, especially the
   Bluetooth HFP row. Gates: whether I build the phone-mic-only capture mitigation.

Everything else (Pass A/B, Blocks 5, 6, 6b, 9, §5.5 camera isolation, corpus recordings)
verifies finished software and waits for the one consolidated final evening.

## Before you leave your desk (once)

- [ ] Builds: iOS simulator compile + clean pod install (ExpoVoiceCommands 0.1.0) and the
      Android debug APK were run 2026-07-07 — check the session notes / just rebuild if
      stale. Install the dev client on BOTH physical devices (`npx expo run:ios --device` /
      `npx expo run:android --device`, or sideload the APK from
      `android/app/build/outputs/apk/debug/`).
- [ ] Programme audio: the 95 `prog-*` lines were generated for both voices (2026-07-07);
      `npm run verify:audio` green means the bundle is coherent.
- [ ] The spike flag is a METRO-time env for dev clients: start the dev server with
      `EXPO_PUBLIC_VOICE_SPIKE=1 npx expo start --dev-client` → the app boots straight into
      the spike harness. Restart metro WITHOUT the flag to get the normal app (Block 4 can
      use the same install).
- [ ] Bring: Bluetooth headphones, a TV (real programme with speech), a sturdy chair, a
      lamp-lit room, a power bank, both devices charged.

## The session (per device — iPhone first, then Android; ~40 min each)

### 1. Permissions + availability (5 min) — protocol Block 1

- Launch the harness → grant the mic permission when prompted.
- Confirm the OS mic indicator appears when a window opens and disappears when it closes.
- Record the availability string (`on_device_supported` on iOS / `on_device_api` on
  Android 12+). **Write down the exact reason string on the older Android.**
- **Airplane mode ON now** — leave it on through the whole matrix (proves the on-device
  path; the criteria require at least one full pass per device in airplane mode).

### 2. The trial matrix (~40 min) — spec §3 order, ≥10 trials per cell

Phone face-up on furniture, within arm's reach (0.5–1 m). The harness prompts each trial,
opens a real window, and logs intent + latency — follow its prompts.

| Order | Condition | Setup | Cells (≥10 trials each) |
|---|---|---|---|
| 1 | **A — quiet, normal voice** | quiet room | all 6 commands, PLUS the §8 safety cells: `stop`, pain as "that hurts" ×10 AND separately "ow"/"ouch" ×10 |
| 2 | **B — TTS coexistence** | harness plays a bundled line, speak immediately after | ready, done |
| 3 | **C — TV noise** | TV at conversational volume (~60 dB), real speech programme | ready, done, skip |
| 4 | **D — breathless** | do 10 brisk sit-to-stands FIRST, then trial while puffed | done, stop, pain (both phrasings) |
| 5 | **E — quiet voice** | tired/low register, as at the end of a long day | done, stop, pain (both phrasings) |
| 6 | **F — distance (info only)** | 2.5–3 m away, quiet | ready, done — not gating, don't sweat it |

Pass bars live in §4 + §8 (headlines: done ≥95% quiet / ≥85% breathless+quiet-voice;
stop & pain ≥95% in A, D, E on BOTH phrasing families; latency ≤1.5 s median).

### 3. Always-on exposure (~15 min) — protocol Block 3

- **Self-echo ×10:** hot window open; play "Stop if you feel sharp pain or discomfort that
  keeps building." through the speaker at session volume, ten times. Count self-fires.
- **Condition G soak (10 min):** window open continuously; TTS playing intermittently, TV
  speech in the background, and talk to another person normally. Budget: ≤1 unintended
  fire total, ≤1 pain, ZERO false `skip`.

### 4. Audio routing (~10 min) — protocol Block 4 / spec §5.1–5.4

Restart metro WITHOUT the spike flag for the normal app where needed.

- TTS at normal loudness through the SPEAKER while a listening session is configured — no
  earpiece fallback, no heavy ducking (A/B against the app as it sounds today).
- Toggle listening windows — the route must never flip mid-session.
- Bluetooth headphones on: TTS through the headphones; note WHICH mic captured (phone vs
  headset HFP) and whether voice quality audibly collapses when a window opens (HFP drop =
  FAIL for the BT row → I build the phone-mic-only mitigation).
- End the session: playback-only restored — next voice line + your music behave as today.

(§5.5 camera isolation — the full check-up on a spike build — deliberately waits for the
consolidated final evening; it gates shipping, not building.)

### 5. Export (1 min)

Tap **Export results JSON** — one file per device lands in `documents/voice-spike/`.

## What to hand me afterwards

1. The two exported JSONs (or just pull them off the devices into `docs/audits/`).
2. The self-echo count per device.
3. The Block 4 row results + which mic the BT row used.
4. The exact Android availability string.
5. If any single gating cell failed: nothing else — the one permitted matcher-tuning
   iteration is mine to attempt, then you re-run just the failed cells. A second failure of
   any gating cell = Option B, no discussion needed.

## What I build the moment the results land (uninterrupted)

- Verdict A: matcher/phrase-table tuning if any near-misses; then the Clarity **VAD
  adapter** (SpeechActivityMonitor) and **fluency ASR adapter** against the native APIs.
- Verdict B: the **sherpa-onnx** path for KWS + the same two adapters against it (heavy
  native dependency — pre-approved by the frozen criteria's failure rule).
- Self-echo verdict: empty the 17-line allowlist (reword or suppress, per your call if the
  count was non-zero).
- BT row result: phone-mic-only capture mitigation if HFP failed.
- Then: results land in `docs/audits/VOICE_KWS_SPIKE_RESULTS.md`, Session B's blocks become
  buildable-testable, and the consolidated final evening (Blocks 1,3–6b,9 + 7–8 + Pass A/B
  + corpus recordings) is the only device work left in the plan.
