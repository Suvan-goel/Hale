# Noise-floor report — session-mean rise velocity

**Question (the product's go/no-go):** is the between-session variance of the
headline metric — session-mean chair-stand rise velocity, in body units/sec —
small enough that a real longitudinal change can be seen above it?

**Target:** between-session coefficient of variation (CV) **≤ 10%** for the
same person re-measured under realistic setup variation (distance ≈ 2.2–3.2 m,
slight camera angle offsets, different days/lighting). No reliable velocity
trend ⇒ no product.

**Status: synthetic dry run PASSED (0.44% CV). Real-data run PENDING — it
needs a human performing recorded sessions; see “How to run the real
experiment” below. The 10% verdict is not claimable until that data exists.**

---

## 1. What produces the number

Recording (raw 30fps landmark JSONL) → `PosePipeline` (One-Euro smoothing,
chain reliability, subject validity, warmup gate, body-unit calibration) →
chair-stand grader (`RepCycleTracker` hysteresis on near-side knee angle;
`RepVelocity` measures the concentric window on the near-side hip height,
normalized by the calibrated hip→ankle body unit) → per-rep mean velocities →
session mean → CV across sessions.

Everything runs headlessly via `npm run noise-floor`, byte-identical to
on-device behavior (all timing from recorded timestamps).

## 2. Synthetic setup-variance dry run (measurement chain only)

Six synthetic sessions of the *same* body model performing rises with an
**identical multiset of rep tempos** (1.0–1.4 s rises, rotated order), so the
true session-mean velocity is bit-identical across sessions. Only the camera
setup varies — exactly the factors the real experiment varies:

| varied factor | dry-run range |
|---|---|
| distance (body scale in frame) | 0.85–1.15 (≈ 3.2 m → 2.2 m) |
| placement in frame | ±0.05 frame widths |
| camera angle offset (sagittal foreshortening) | 0–7% |
| facing side | left and right |
| landmark jitter amplitude | 0.004–0.005 (typical real ≈ 0.004) |
| noise seed | per session |

Result (`npm run noise-floor -- --synthetic`, 2026-06-13, commit at Stage 2):

| session | body unit | reps | mean rise vel (bu/s) | raw (img/s) | within-CV % | flags |
|---|---|---|---|---|---|---|
| far-3.2m | 0.2878 | 10 | 0.2935 | 0.0845 | 11.0 | — |
| mid-2.8m | 0.3164 | 10 | 0.2941 | 0.0931 | 10.9 | — |
| ref-2.7m | 0.3395 | 10 | 0.2916 | 0.0990 | 9.7 | — |
| near-2.4m | 0.3675 | 10 | 0.2942 | 0.1081 | 11.3 | — |
| near-2.2m | 0.3905 | 10 | 0.2931 | 0.1145 | 10.2 | — |
| mid-angled-left | 0.3231 | 10 | 0.2955 | 0.0955 | 10.0 | — |

- usable sessions: 6/6 (all calibrated, all 10/10 reps counted)
- mean of session means: 0.2937 bu/s (ground truth 0.294 — bias < 0.5%)
- **between-session CV, normalized: 0.44 %**
- between-session CV **without** body-unit normalization: **10.88 %**

Reading:

1. **The measurement chain itself contributes ≈ 0.4 % CV** over the full
   setup envelope — essentially the whole 10 % budget remains available for
   human day-to-day variation and real-world landmark noise.
2. **Normalization is load-bearing**: the unnormalized control varies ~25×
   more, tracking camera distance almost perfectly (raw velocity rises
   monotonically with scale). Any regression that breaks calibration will
   blow the budget immediately.
3. Within-session CV (~10 %) is the *built-in* rep-tempo variation being
   measured correctly, not noise — per-rep values jitter; the session mean
   over 10 reps is the robust statistic. This is why the protocol demands
   10+ reps per session.
4. Limits of the dry run, stated plainly: synthetic landmarks use uniform
   jitter on an ideal skeleton. It does **not** model MediaPipe's systematic
   errors — depth-dependent landmark bias, soft-tissue/clothing offsets,
   per-pose visibility collapse, rolling-shutter wobble. Those are exactly
   what the real recordings exist to capture. A real CV several times the
   synthetic floor is expected; the budget is 10 %.

The dry run is locked in as a regression test
(`src/replay/__tests__/noiseFloor.test.ts`): normalized CV ≤ 2 %, and
normalization must beat the raw control by ≥ 5×.

## 3. How to run the real experiment (PENDING)

**Subject:** one person (any team member). **Sessions: 6** (5 minimum), same
person, all in one evening or across two days — keep the *person* constant,
vary the *setup*.

Per session:

1. Prop the phone vertically at ~hip height (chair seat + a book works).
   Vary per the table below.
2. Launch the dev build → dev view (recording auto-starts in the assessment
   screen in dev builds, or use the REC toggle in the dev overlay).
3. Stand still, side-on to the camera, fully in frame for **~5 s** (warmup +
   body-unit calibration need a stable standing stance — without it the
   session is unusable).
4. Sit on a sturdy chair placed side-on, arms crossed, and perform
   **10–12 chair stands** at your natural test pace. Slight tempo variation
   between reps is good — it's realistic.
5. Stay seated ~2 s, stop recording.

| session | distance | angle offset | notes |
|---|---|---|---|
| 1 | 3.2 m | 0° | far end of the band |
| 2 | 2.8 m | 0° | |
| 3 | 2.7 m | ~10° off side-on | |
| 4 | 2.4 m | 0° | re-prop the phone from scratch |
| 5 | 2.2 m | ~10° the other way | near end of the band |
| 6 | 2.8 m | 0° | other side facing the camera |

Then:

```sh
./scripts/pull-recordings.sh        # Android: pulls JSONL into ./recordings/
npm run noise-floor -- recordings/  # prints the table + CV verdict
```

(iOS: download the app container in Xcode → Devices, recordings are in
`Documents/recordings/`.)

Paste the output table into section 4 below with the date and device.

## 4. Real-data results — PENDING

> Not yet recorded. This section is the actual go/no-go; fill it in from
> `npm run noise-floor -- recordings/` output. Acceptance for Stage 2's
> experiment requires real recorded sessions here.

## 5. Diagnosis playbook if the real CV exceeds 10 %

Work the list in order; re-run the analysis after each change. Capture any
surprising recording as a committed fixture first (working agreement).

1. **Normalization (most likely).** Check the `body unit` column: it should
   scale smoothly with distance. If two same-distance sessions disagree by
   >3 %, calibration sampled an unstable stance — lengthen the standing
   lead-in, tighten `CalibrationConfig.maxHipSpeed`, or require a longer
   stable window before locking.
2. **Phase segmentation.** Compare `within-CV %` across sessions: if one
   session's within-CV is wildly higher, hysteresis thresholds may sit on a
   noisy part of that setup's knee-angle curve (angle offsets compress
   measured knee angles). Try widening the band
   (`kneeDownEnterDeg`/`kneeUpEnterDeg`) or a velocity-based segment
   definition instead of threshold-bounded.
3. **Smoothing window.** One-Euro lag trades against jitter:
   sweep `minCutoff`/`beta` headlessly over the same recordings
   (deterministic replay makes this a for-loop, not a re-shoot).
4. **Side selection flapping.** Check the `flags` column for
   `tracking-interrupted` / `rep-stats-incomplete`; if the near side is
   borderline (true side-on), the sticky-side window may need to span whole
   reps rather than transitions.
5. **Lighting/visibility floor.** If raw recordings show low visibility
   periods, the pre-flight thresholds are too lenient — raise
   `minMeanVisibility` so bad sessions are refused *before* they pollute the
   trend.
