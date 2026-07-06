# Measurement-Movement Corpus — Recording Protocol & Gate Discipline

Date: 2026-07-06 · Gate spec: TDD §7 (rescoped to the five measurement movements)
Methodology: TUNE/GATE SEPARATION (founder requirement 2026-07-06) — enforced by the
tooling, not by convention.

## 1. What gets recorded

For each of the five gate movements — `chair-rise-30s-v2`, `one-leg-balance-45s-v2`,
`balance-eyes-open-v2` (pre-switch), `active-shoulder-reach-v2`, `hinge-reach` — panel
recordings across the TDD test matrix (lighting × clothing × distance × device × tempo).
The app records landmark JSONL (dev recorder); a SECOND device films reference video for
human labelling (never through the app — privacy posture, C5).

## 2. The split — BY PANELIST, decided BEFORE labelling

- Assign each panelist wholesale to `tune` or `validate` (e.g. A–C tune, D–F validate).
  Generalizing across BODIES is the claim under test, so no panelist may appear on both
  sides — the gate refuses to run otherwise.
- Decide the split before any footage is evaluated; record it here when made.
- The founder's own recordings are `tune` only, never `validate` (the founder's body is
  not evidence, per the original spec).

## 3. Directory layout + label schema

```
corpus/
  a01-chair-lamp-loose.jsonl          # app landmark recording
  a01-chair-lamp-loose.label.json     # CorpusLabel (src/replay/corpus.ts)
```

Label: `{ schemaVersion: 1, recordingFile, movementId, panelist, role: "tune"|"validate",
conditions {lighting, clothing, distanceM, device, tempo}, groundTruth {reps,
repBoundariesMs?, startPositionAtMs?}, video }`. Ground truth comes from the reference
video, labelled by a human, before any replay is run.

## 4. Tooling

- `npm run corpus -- report <dir> [--out report.md]` — full gate report. Gates on
  VALIDATE footage only; names both footage sets; refuses PASS if the validation set is
  empty or a panelist overlaps. Exit 0 only on PASS.
- `npm run corpus -- sweep <dir> <param> <min> <max> <step>` — threshold sweep on TUNE
  footage only (validate footage is structurally excluded — the sweep code path filters
  by role before evaluation).
- Sweep scope v1: shared pipeline params (`reliabilityThreshold`, `warmupMs`,
  `subjectGoneFrames`). Movement-grader thresholds are module-private by design;
  config-injection for the five graders is the FIRST task when real corpus footage
  lands, and sweeps stay tune-only there too.

## 5. Discipline (mirrors the KWS spike)

1. Sweep on tune footage → choose values.
2. FREEZE: constants land in code with a comment citing the corpus evidence.
3. Gate: `report` on the full corpus; the verdict comes from validate footage alone.
4. Any re-sweep after seeing gate results is a RECORDED DECISION in docs/decisions.md
   (what was reopened, why, and what new validate footage will re-gate it) — never a
   quiet iteration. Repeated tune/gate cycles against the same validation panel erode
   its independence; if a second full cycle is needed, prefer fresh validate panelists.

## 6. Gate thresholds (frozen)

Per movement, VALIDATE footage only: worst per-recording rep accuracy ≥95 % (per-set,
not aggregate), phantom rate ≤2 % of true reps, median start latency ≤2 s (where
labelled), ≥3 validate recordings else INSUFFICIENT. Constants:
`MEASUREMENT_GATE_THRESHOLDS` in `src/replay/corpus.ts`.
