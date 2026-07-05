# Voice-Command Spike — Protocol & Go/No-Go Criteria

Date: 2026-07-05 · Status: criteria FROZEN before the spike runs (founder amendment 1)
Scope: week-1 spike from `TDD-ADDENDUM.md` §8. Decides Option A (platform-native on-device
recognition) vs Option B (sherpa-onnx KWS). **Per the founder's amendment, if Option A fails
these criteria, Option B proceeds without further approval.**

## 1. What is being decided

Whether iOS `SFSpeechRecognizer` (`requiresOnDeviceRecognition = true`) and Android's
on-device `SpeechRecognizer` can support Hale's windowed, ≤8-intent voice vocabulary in
realistic UK-home session conditions on the two target devices. Recognition quality is
measured **after** the tolerant intent matcher (`src/voice/intents.ts`) — raw transcripts are
an implementation detail; the unit that gates is *intent recall*.

## 2. Devices, voices, environment

- Devices: the recent iPhone and the ≥3-year-old mid-range Android (same pair as the
  measurement matrix). Both in airplane mode for at least one full pass per device to prove
  the on-device path (Android must additionally confirm the on-device recognizer is actually
  in use, not a network fallback).
- Speakers: the founder plus at least one woman from the target panel if available in week 1;
  if only one speaker is available, that limitation is recorded in the results and a second
  voice is added before the week-4 beta sign-off (not a spike blocker).
- Phone position: **within arm's reach (0.5–1 m), face-up on furniture** — the v1 session
  posture. A 2.5–3 m pass is recorded for information only (not gating; v1 sessions don't
  need distance).

## 3. Trial matrix (per device)

≥10 trials per intent per gating condition, scripted by the spike harness (it prompts, opens
a real listening window, logs the matched intent + latency; dev-only tool, raw transcripts
are kept in the local results file for diagnosis — production code never stores transcripts).

| # | Condition | Intents tested | Gating |
|---|---|---|---|
| A | Quiet room, normal voice | all 6 (ready, done, skip, repeat, pause, resume) | yes |
| B | TTS coexistence: harness plays a real bundled voice line, window opens on completion, tester speaks immediately | ready, done | yes |
| C | Background TV at conversational volume (~60 dB, real programme with speech) | ready, done, skip | yes |
| D | Breathless "done": tester performs 10 brisk sit-to-stands first | done | yes |
| E | Quiet/low-volume "done" (tired-voice register) | done | yes |
| F | 2.5–3 m distance, quiet | ready, done | info only |
| G | False-accept soak: 10 min of windows open across TTS playback + TV speech + tester talking *to another person*, no commands intended | — | yes |

## 4. Go/no-go thresholds (each device must pass independently)

Recall (intent fired given the phrase was spoken, after matcher):

| Intent | A quiet | B TTS-coexist | C TV noise | D breathless | E quiet-voice |
|---|---|---|---|---|---|
| done | ≥95 % | ≥90 % | ≥85 % | ≥85 % | ≥85 % |
| ready (any variant) | ≥90 % | ≥85 % | ≥80 % | — | — |
| skip / repeat / pause / resume | ≥80 % | — | ≥70 % (skip only) | — | — |

False accepts (condition G): ≤1 unintended intent fire across the 10-minute soak per device,
and **zero** false `skip`. (A false `done`/`ready` costs a correction; a false `skip` loses an
exercise.)

Latency: matched-intent event ≤1.5 s median, ≤2.5 s p95, from end of spoken phrase.
Window round-trip: TTS-complete → listening actually live ≤500 ms.
Availability: full pass in airplane mode on both devices; Android on-device path confirmed.

Retuning rule: exactly **one** iteration of matcher/phrase-table tuning is allowed if a
threshold fails (phrase variants are config by design). A second failure of any gating cell →
Option B proceeds.

## 5. Audio-routing device tests (founder amendment 2 — all must pass, both platforms)

1. **TTS audibility under an active listening session:** a bundled voice line plays at normal
   loudness through the **speaker** while the recognizer session is configured — no earpiece
   fallback, no severe ducking (subjective A/B against the app today, recorded in results).
2. **Speaker vs earpiece:** explicit check that iOS `playAndRecord` is configured with
   speaker routing; toggling listening windows never flips the route mid-session.
3. **Bluetooth headphones:** with BT connected — TTS routes to headphones; recognition works
   and the results record *which* mic captured (phone mic vs HFP headset mic); no audible
   route-switch artifacts (HFP profile drops are a known failure mode — if voice quality
   audibly collapses when the window opens, that is a FAIL for the BT row and the mitigation
   [phone-mic-only capture] must be verified instead).
4. **Route restoration:** after the session ends, playback-only config is restored — next
   voice line and third-party audio (user's music) behave exactly as today.
5. **Camera isolation:** the voice module is never initialized in Check-Up/micro-check flows;
   verified by test + a device pass of a full check-up with the spike build installed.

## 6. Reporting

The harness exports one JSON per device (`voice-spike-<device>-<date>.json`: per-trial
{condition, intent expected, transcript, intent matched, latency ms}, plus device/OS/model
metadata) and the summary table above filled in. Results + verdict land in
`docs/audits/VOICE_KWS_SPIKE_RESULTS.md`. The same device session collects the C1
measurement numbers (pose fps/latency via the existing diagnostics build) — one device
session, two reports.

## 7. Out of scope for the spike

Session player integration, permission UX copy, telemetry schema, sherpa-onnx integration
(only its feasibility notes if invoked), any tuning beyond the single allowed matcher
iteration.
