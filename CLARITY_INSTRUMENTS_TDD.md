# Clarity Objective Instruments — Technical Design Doc

Date: 2026-07-06 · Status: **awaiting founder approval — no implementation started**
Spec: "Objective Clarity instruments" brief (Parts 1–2 + cross-cutting). Base:
`voice-sessions-v1` @ `14468f8d` (all eight reposition slices built; 1512/1512 green).

Binding context: every recorded engineering invariant stands — intent-matcher seam,
camera path parked, reported-vs-measured split, pain audit trail, claims fences
(incl. `COGNITIVE_CLAIM_COPY` and the `CLARITY_SELF_REPORT_COPY_FILES` "validated" ban),
hot-phrase lint, tap parity, no-stall, invalid-measurement Retry/Skip, tune/gate
separation, composite rule (Clarity never folds into a headline — unchanged here by
explicit instruction). Labels: **BUILT-AND-TESTED / SOURCE-PINNED / PLANNED**.
Standing rule from the brief, restated: **nothing audio-runtime is claimed
BUILT-AND-TESTED until the device evening** — the logic layers below ship against
seams and fakes; the native VAD/ASR implementations are PLANNED until their gates pass.

---

## 0. Executive summary

The reservation paid for itself: the dimension registry already types Clarity readings
with `basis: 'measured' | 'self_report'`, the rolling-baseline utilities are per-metric
by construction (which solves fluency's cross-category comparison problem structurally),
the invalid-measurement taxonomy and the check-up's additive-appendix pattern
(`CheckUp.selfReport`, slice 4) are the exact templates these instruments extend, and
the covariates are already captured. The genuinely new work, in effort order:

1. **The fluency privacy-model change** — a scoped, per-use consented exception to
   "never transcribed", with leak-proofing tests at pain-audit rigor. The hardest and
   most trust-critical piece; deliberately sequenced second.
2. **Two engine-agnostic audio seams** (`SpeechActivityMonitor` for VAD,
   `FluencyTranscriber` for ASR), mirroring the intent-matcher pattern: pure logic
   drives fakes in CI; native implementations and their go/no-gos live in two new
   device-evening blocks. If either fails on the cheap Android, the instrument
   degrades to a recorded limitation (offer never appears) — nothing else blocks.
3. **Dual-task flow integration** — a "level 2" re-run of the same balance protocol
   inside the check-up, reusing the existing grader unchanged; the metric is a derived
   within-session comparison, not a grader.
4. **Fluency scoring + parallel forms** — counting rules, deterministic
   history-derived category rotation, per-category baselines.
5. **Clarity trend surface maturation + GP-escalation** — the flag-gated subjective
   surface (slice 4) gains measured rows and covariate context; the escalation path
   gets built with synthetic-history trigger tests.

Section 1 flags **5 conflicts/decisions**, one of which (F1, the audio law) is a
genuine recorded-decision collision that needs a scoped amendment at approval.

---

## 1. Flags — conflicts with recorded decisions, and calls needed

**F1 — ⚖️ REQUIRED AMENDMENT: dual-task needs a microphone inside a camera flow.**
The 2026-07-05 scoped audio-law amendment is explicit: a recording-capable audio
session exists ONLY inside voice-guided training sessions; *"camera flows (check-up,
micro-check) never see a recording session and never initialize the voice module."*
Dual-task inherently violates this — the camera grades the hold while VAD listens.
This TDD proposes a second scoped amendment (to be recorded in decisions.md and
CLAUDE.md at approval): **a recording-capable session may exist inside the check-up
ONLY during the dual-task run and the fluency segment, activated after the movement
protocol confirms setup, restored to playback-only immediately after.** The original
law exists because audio-session churn once killed camera sessions in production
(Forma) — so the device evening gains an explicit **camera+mic coexistence test**
(Block 7.4) and the dual-task offer stays dark until it passes. Fluency deliberately
avoids the collision entirely: it runs **after the movements complete, camera torn
down, phone in hand** (§5.1). Needs your sign-off as a recorded decision.

**F2 — ⚖️ Ceiling saturation on dual-task.** The live balance protocols cap at 45 s
(single-leg best-of-trials) or a staged ladder total. A strong balancer who holds the
full cap in BOTH runs shows cost = 0 — the instrument saturates for exactly the
people with the most headroom. v1 handling (recommended): compute cost normally, tag
the result `ceilingLimited` when the single-task run hit its cap, surface the trend
with that honesty ("held the full test both ways — no measurable load cost"), and
record sway-proxy-under-load as the future refinement (the pipeline already computes
a sway proxy; using it as the dual-task signal is gated future work, not v1). Needs
sign-off that a saturating-but-honest v1 is acceptable.

**F3 — ⚖️ Fluency trend matures slowly by design.** Raw counts must not cross
categories (your requirement), so the trend uses per-category baselines — and a
category has no baseline until it repeats. With C categories, relative readings only
begin in month C+1. Recommendation: **4 categories** (animals, foods, countries,
things in a kitchen) — relative trend begins month 5; the subjective + dual-task
series carry Clarity's trend in the interim. Alternatives: 3 categories (earlier
trend, weaker practice control) or 6 (stronger control, half a year dark). Your call
on the list and count.

**F4 — Clarity stays flag-gated even after this build.** The clarity dimension flag
(`EXPO_PUBLIC_ENABLE_CLARITY_DIMENSION`) is dev-gated and release-audited. This build
completes the instruments *behind that flag*; flipping Clarity user-visible is a
separate recorded decision gated on (a) both device-evening audio gates and (b) your
call on whether subjective-only is enough to ship first. Nothing here flips it.

**F5 — Intrusion detection is not possible in v1 and the counting rules say so.**
Detecting out-of-category words requires bundled category dictionaries (feasible
later; real content work + false-negative risk for regional words). v1 counts
*distinct non-filler words* (§5.3) and documents plainly that intrusions are not
policed — the score is "distinct words named", which is honest, stable, and
consistent month-to-month. Flagged so nobody later mistakes the score for a
clinically-scored fluency test (it is not, and never claims to be).

Also noted, no decision needed: **iOS requires a separate Speech Recognition
permission** (`NSSpeechRecognitionUsageDescription`) for on-device ASR — a config-
plugin change riding FL1, prompted in-context on the fluency consent screen, never at
launch. Android's on-device recognizer needs no new manifest permission beyond the
existing `RECORD_AUDIO`.

---

## 2. What exists vs what this build adds (audit)

| Piece | State |
|---|---|
| Dimension registry, `DimensionReading.basis: 'measured' \| 'self_report'`, rolling baselines (per-metric by construction) | BUILT-AND-TESTED (slices 3–4) |
| `CheckUp` additive-appendix pattern + boundary normalization, no history version bump | BUILT-AND-TESTED (`selfReport`, slice 4) |
| Covariates (time-of-day derived, sleep, symptom load) at every official check-up | BUILT-AND-TESTED (slice 4) |
| Clarity trend surface (subjective rows, baseline-relative, worse-never-bare, flag-gated) | BUILT-AND-TESTED (slice 4) |
| Invalid-measurement taxonomy (`invalid_measurement`, `ProtocolInvalidReason`) + claim gating | BUILT-AND-TESTED (verified 2026-07-06) |
| Balance graders/protocols (hold seconds, trials, ceiling, valid-time honesty) | BUILT-AND-TESTED — reused unchanged |
| Claims fences (cognitive banned list, "validated" ban, worse-never-bare helper) | BUILT-AND-TESTED (slice 1) |
| Voice module + intent-matcher seam (the pattern to mirror) | BUILT-AND-TESTED (voice sessions) |
| VAD (speech-presence detection) | **Nothing exists.** Seam + fake now; native PLANNED behind device gate |
| On-device ASR / transcription | **Nothing exists.** Seam + fake now; native PLANNED behind device gate |
| Dual-task cost, fluency scoring, rotation, GP-escalation | **Nothing exists** — this TDD |

---

## 3. Data model (additive, mirrors `selfReport` exactly)

New optional block on `CheckUp` — `clarityInstruments?: ClarityInstrumentsRecord` —
normalized defensively at the same serialize boundary, **no history version bump**,
and (F8-style, enforced by test) never read by movement protocol evidence, claim
eligibility, or any measurement surface outside Clarity's own.

```ts
// src/checkup/clarityInstruments.ts (all fields numeric/enum — no free text, ever)
interface DualTaskResult {
  schemaVersion: 1;
  movementId: string;               // the balance protocol re-run ('one-leg-balance-45s-v2' | ladder id)
  status: 'measured' | 'invalid' | 'skipped' | 'unavailable';
  invalidReason?: 'no_speech_detected' | 'single_task_invalid' | 'tracking_interrupted'
                | 'app_backgrounded' | 'user_declined';   // reuses taxonomy vocabulary
  singleTaskSeconds?: number;       // copied from the same session's single-task run
  dualTaskSeconds?: number;
  costPercent?: number;             // (single − dual) / single × 100, floored at 0? NO — see §4.2
  ceilingLimited?: boolean;         // F2
  speechActiveMs?: number;          // VAD aggregate — presence evidence, never content
}

interface FluencyResult {
  schemaVersion: 1;
  categoryId: FluencyCategoryId;    // enum from the fixed rotation list
  status: 'measured' | 'invalid' | 'skipped' | 'unavailable';
  invalidReason?: 'no_speech_detected' | 'transcriber_failed' | 'app_backgrounded' | 'user_declined';
  validWordCount?: number;          // the score — the ONLY thing derived from words
  durationSec: 60;
}
```

`status: 'unavailable'` is the recorded-limitation state: the device gate failed or
the runtime reported no on-device capability — the offer never appeared, the record
says so honestly, the check-up is untouched.

**Readings derived for the trend** (all `basis: 'measured'`):
- `dual_task_cost_balance_v1` — value = **inverted cost** (`100 − costPercent`) so
  higher = clearer, matching every Clarity series' trainable direction.
- `fluency_<categoryId>_v1` — raw distinct-word count, **one metric id per category**:
  the rolling-baseline utility already refuses to mix metric ids, so "never compare
  raw counts across categories" is enforced by construction, not convention.
- `fluency_relative_v1` — derived cross-category series: each reading expressed
  relative to that category's own rolling baseline (percent of her category median),
  emitted only once the category has a baseline (F3). This is the series the trend
  surface plots.

---

## 4. Part 1 — Dual-task cost

### 4.1 Flow ("level 2 of a test you know")
Inside the official check-up, immediately after the balance movement completes with a
**valid** result: one offer screen — "Level 2: the same balance hold, while counting
backwards. Want to try it?" (Try it / Skip — tap parity; voice is NOT added to the
check-up, which has no command vocabulary today and gains none). Skip or timeout
(no-stall: offer auto-skips after 20 s of no response, recorded `skipped`) →
check-up continues exactly as today. The verbal task: **counting backwards in threes
from a spoken/displayed random start** (e.g. "from 97") — self-paced, no right-answer
checking, VAD only. Instruction copy states plainly: "I only check that you're
speaking — never what you say." The re-run uses the SAME protocol, same grader, same
setup (she is already framed and confirmed); the recording-capable audio session
activates for the run and restores after (F1 amendment).

### 4.2 Metric (within-session, never fabricated)
`costPercent = (singleTaskSeconds − dualTaskSeconds) / singleTaskSeconds × 100`.
- Single-task source: the SAME session's valid balance result (best-of-trials seconds
  or ladder total, matching whichever protocol ran). Stored prior sessions are never
  used. Single-task invalid/absent → dual-task is not offered at all
  (`single_task_invalid` if it got queued before invalidation).
- **Negative cost is kept, not floored**: performing *better* under load happens
  (motor automaticity) and flooring it would fabricate degradation symmetry. The
  trend utilities handle it; display copy says "steadier than your solo hold" rather
  than a negative number (never raw-score-bare anyway).
- VAD validity: cumulative `speechActiveMs` must reach a config-driven floor
  (provisional: ≥ 8 s or ≥ 25 % of the hold, whichever is less — data, not code;
  tuned at the device evening) or the trial is `invalid: no_speech_detected` —
  silence is never scored as excellent movement.
- Tracking interruption / backgrounding during the dual run → invalid via the
  existing interruption vocabulary; Retry is offered ONCE (measurement-integrity
  Retry/Skip pattern), then skip.

### 4.3 The VAD seam (engine-agnostic — the intent-matcher pattern)
```ts
// src/voice/speechActivity.ts — pure interface + policy; no native code
interface SpeechActivityMonitor {
  availability(): Promise<'available' | 'unavailable'>;
  start(): void; stop(): SpeechActivitySummary;   // { speechActiveMs, windowMs }
  onActivity(cb: (event: { speaking: boolean; atMs: number }) => void): Unsubscribe;
}
```
CI drives a scripted fake through every path (valid, silent, intermittent, monitor
error). The native implementation (likely energy-threshold + the platform voice
processor; engine choice is exactly what the seam defers) is **PLANNED** until
device-evening Block 7. `availability() === 'unavailable'` → the level-2 offer never
renders and the record says `unavailable`.

### 4.4 Privacy posture (unchanged — confirmed by test)
Dual-task transcribes nothing; the global "intents only, never transcribed" promise
is untouched. Tests: existing mic-promise guardrails stay green verbatim; new test
pins that the dual-task path imports no transcript-bearing API and that
`DualTaskResult` serialization contains numbers/enums only.

---

## 5. Part 2 — Verbal fluency (only after the dual-task checkpoint)

### 5.1 Flow
After the movement battery completes and the camera tears down (with the Clarity
check-in), phone in hand: consent screen (§5.4) → 60-second task — "Name as many
ANIMALS as you can. Go." — countdown visible, tap "I'm done" allowed early, no-stall
timeout at 60 s exactly. Skip at any point → `skipped`, check-up completes normally.
Phone-in-hand deliberately sidesteps both the camera+mic coexistence problem and
3-metre ASR accuracy.

### 5.2 Parallel forms — deterministic, history-derived rotation
Fixed ordered list (F3, founder to confirm): `animals, foods, countries,
kitchen_things`. Next category = first list entry not present among the fluency
categories of stored official check-ups since the list was last exhausted — derived
from history at offer time (no new store; crash-safe; deterministic; a category
cannot repeat until the set is exhausted). Category id is stored on the result.

### 5.3 Counting rules (documented in code and here — honestly)
From the on-device transcript, in order: lowercase + strip punctuation → tokenize →
drop a small bundled filler stoplist (uh, um, er, and, the, a, like, "let me think"
n-grams) → naive singular/plural fold (trailing-s) → **count distinct remaining
tokens**. Repetitions collapse via deduplication. **Intrusions are not detected**
(F5) — the metric is "distinct words named in 60 seconds", stable across months
because the rules never change without a new metric id. Multi-word entities count as
their tokens ("polar bear" → 2; documented, consistent, and fine because the score
is only ever compared with HER OWN counts in the SAME category). The transcript
exists only inside the counting function's scope and is discarded; the function
returns an integer.

### 5.4 The privacy-model change (a recorded decision, not a copy edit)
- **Two mic uses, honestly distinguished.** Global promise for commands/safety words:
  *intents only, never transcribed* — **unchanged**, its guardrail tests untouched
  and required green. Fluency: a **separate, per-use, session-scoped exception**.
- **Consent screen every time**, immediately before the task: "For the next 60
  seconds your speech is turned into words ON YOUR PHONE, only to count them. The
  words are not stored and not sent — the count is all that's kept. This is
  different from how the mic normally works here, where nothing is ever transcribed.
  [Start] [Skip this part]". Copy through both claims fences + the Clarity
  "validated" fence; the screen registers in `CLARITY_SELF_REPORT_COPY_FILES`.
- **Leak-proofing at pain-audit rigor** (`fluencyPrivacy.test.ts`):
  1. Type-level: `FluencyResult` has no string-typed fields except the category enum;
     compile-time exhaustiveness pins it.
  2. The transcriber seam's return type at the scoring boundary is `number` — the
     transcript type is not exported from the seam module.
  3. Serialization scan: a completed check-up containing a fluency run, serialized
     for store/backup/telemetry, contains none of a set of canary words fed through
     the fake transcriber.
  4. Audio: the seam has no API that yields audio data; asserted by module-shape test.
- **decisions.md + CLAUDE.md amendments** land in the same PR as the consent screen,
  naming the exception's exact scope (60 s, on-device, per-use consent, count-only
  retention). The privacy copy in Settings gains the two-uses distinction.

### 5.5 The ASR seam
```ts
// src/voice/fluencyTranscriber.ts
interface FluencyTranscriber {
  availability(): Promise<'available' | 'unavailable'>;   // on-device ONLY — server ASR is never acceptable
  transcribeWindow(seconds: 60): Promise<{ ok: true; tokens: string[] } | { ok: false; reason: string }>;
}
```
Native candidates (device evening decides): iOS `SFSpeechRecognizer` with
`requiresOnDeviceRecognition = true` (errors rather than silently using the server —
the honesty property we already rely on for voice sessions); Android on-device
`SpeechRecognizer`. Unavailable/failed → `unavailable`/`transcriber_failed`, offer
suppressed or result invalid — never a silent fallback to cloud. **PLANNED** until
Block 8 passes.

---

## 6. Cross-cutting

### 6.1 Clarity trend surface (matured here; still behind the flag — F4)
The slice-4 surface gains: one row per series — subjective check-in, dual-task
steadiness, word-finding (fluency relative) — each shown as HER relation to HER band
("in your usual range" vocabulary), never fused into a single Clarity number in beta
(fusing subjective+objective is a mini-composite; deferred as a recorded future
decision, consistent with the composite rule). Covariate context line when a series
dips AND that session's covariates show load: "This dip lines up with a rough night's
sleep — clarity usually tracks sleep, symptoms, and stress." (baseline-relative,
mechanism-shape, never diagnostic; through the fences; worse-never-bare helper
enforces pairing on every below-band row).

### 6.2 GP-escalation (BUILT this time; trigger fires only when data exists)
Pure trigger over the Clarity series (`src/pearlFlow/clarityEscalation.ts`):
**the same series below her rolling band for ≥3 consecutive monthly official
check-ups, with ≥5 lifetime readings on that series** → one calm card on the Clarity
surface: "Your check-ins have trended down for a few months. That's worth a
conversation with your GP — here's a summary you can bring." + **exportable trend
summary** via the existing share pattern (dates, relation-to-band per month, covariate
notes; no raw fluency words — there are none stored; claims-fenced). It is the ONLY
escalation path (guardrail: no other surface may emit GP/doctor language except the
existing pain-recurrence line — pinned). Tested exclusively with synthetic
multi-month histories: fires at exactly 3-below with 5+ readings, never at 2, resets
on a within-band month, never fires from covariate data alone, copy passes fences.

### 6.3 Check-up time budget (realistic)
Dual-task: offer 5–10 s + instruction 15 s + hold ≤45 s → **~50–70 s typical** (most
touch down early under load). Fluency: consent 10–15 s + instruction 10 s + 60 s task
→ **~85 s**. Total added by this build ≈ **2.3–2.6 min typical, ~3 min worst case**
— at the top of the ~3-minute budget. Both instruments are individually skippable in
one tap, so the floor is +0 s. If the budget must shrink, the lever is offering
dual-task and fluency on alternating months (recorded option, not recommended —
monthly parallel-form rotation assumes monthly fluency).

### 6.4 Device-evening additions (freeze-then-gate; appended to DEVICE_SESSION_PROTOCOL.md at DT1/FL1)
**Block 7 — VAD go/no-go (dual-task).** Target cheap Android + iPhone, phone at
2.5–3.2 m (check-up placement): (1) speech-presence accuracy while counting aloud at
distance — quiet and TV-noise conditions, ≥10 trials each; gate: ≥90 % of speaking
windows detected, ≤1 false-active window per silent 60 s; (2) latency immaterial
(aggregate metric); (3) **7.4 camera+mic coexistence (F1)**: activate the recording
session mid-check-up during a live balance hold — camera session must not drop,
frame rate must hold, audio restored after; any camera interruption = hard fail →
dual-task ships `unavailable` on that platform. (4) Battery/thermal note over the
added ~70 s. Criteria frozen before the evening; one tuning iteration allowed on the
VAD floor; second failure → recorded limitation.
**Block 8 — on-device ASR go/no-go (fluency).** Phone in hand: (1) availability
honesty (airplane mode — iOS on-device flag must error rather than fall back);
(2) 60-s fluency runs against a scripted word list read aloud — gate: ≥85 % of
distinct spoken words counted (word-level recall on the *count*, not transcript
fidelity), across quiet + TV noise, both voices tested (founder + one panel voice);
(3) UK-accent sanity on the category words; (4) permission-prompt UX (iOS speech
permission appears in-context on the consent screen only). Fail → fluency ships
`unavailable`; the instrument's absence is recorded, nothing else blocked.

---

## 7. Copy inventory (all through the fences; files register in `CLARITY_SELF_REPORT_COPY_FILES` at creation)

| Surface | New copy |
|---|---|
| Dual-task offer + instruction | level-2 framing, "only whether you're speaking, never what you say", skip |
| Dual-task result line (trend row) | "steadiness under load" vocabulary; ceiling-limited honesty (F2) |
| Fluency consent screen | the §5.4 block — the trust-critical strings |
| Fluency task + done/skip | category prompt, countdown, early-done |
| Clarity trend rows + covariate context | §6.1 lines |
| GP-escalation card + export summary | §6.2 — calm, only escalation path |
| Settings privacy ledger | two-mic-uses distinction |
| decisions.md + CLAUDE.md | F1 audio amendment; §5.4 privacy exception |

Voice lines: **none required** — both instruments are screen-led (the check-up's
existing voice covers movements; adding spoken instructions for these is optional
polish, deferred; if added later they go through generation + hot-phrase lint).

---

## 8. Sequenced slices (checkpoints in bold; fluency does not start until you approve the dual-task checkpoint)

| Slice | Work |
|---|---|
| DT1 | F1 amendment recorded (decisions.md + CLAUDE.md); `SpeechActivityMonitor` seam + scripted fake; `clarityInstruments` data model + boundary normalization + F8-style isolation tests; dual-task cost pure function (incl. negative-cost, ceiling, validity floors as config) |
| DT2 | Check-up flow integration: level-2 offer after valid balance, no-stall timeout, Retry-once/Skip, `unavailable` suppression path; audio-session activation seam (native call PLANNED); copy through fences |
| DT3 | Trend integration: `dual_task_cost_balance_v1` readings (inverted), Clarity surface row, covariate context line, worse-never-bare; device-protocol Block 7 appended | 
| **CHECKPOINT — dual-task review; fluency starts only on approval** | |
| FL1 | **Privacy-model recorded decision**: decisions.md + CLAUDE.md amendments, consent screen, Settings two-uses copy, guardrail extensions (global promise pinned unchanged), `fluencyPrivacy.test.ts` leak-proofing, iOS speech-permission config plugin |
| FL2 | `FluencyTranscriber` seam + fake; counting rules (pure, documented); rotation model (history-derived); `FluencyResult` + validity |
| FL3 | Flow integration (post-camera, phone-in-hand, 60 s, early-done, skip); per-category baselines + `fluency_relative_v1`; trend row; device-protocol Block 8 appended |
| FL4 | GP-escalation: trigger + synthetic-history tests + card + exportable summary + only-escalation-path guardrail |
| **CHECKPOINT — fluency review** | |

Explicitly not in scope: native VAD/ASR implementations beyond the seam adapters
(device-gated), any KWS engine work, new movement graders (dual-task reuses the
balance grader; the metric is derived), camera-path changes, corpus/gate changes,
composite folding, flipping the Clarity flag (F4).

## 9. Founder inputs needed at approval
1. **F1** — the scoped check-up audio amendment (the one real invariant change).
2. **F2** — accept ceiling-limited honesty for v1 dual-task.
3. **F3** — fluency category list and count (recommended: the 4 listed).
4. **F4** — confirm Clarity stays dev-flagged through this build.
5. Verbal task for dual-task: counting backwards in threes (recommended) vs naming
   task — counting is language/culture-neutral and needs no category rotation.

---

**Stopping here for approval.**
