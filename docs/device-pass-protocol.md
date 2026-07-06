# Device-pass protocol — batterySequence change + Check-up #0 host

Two recorded passes close the pre-promotion checklist's Check-up #0 gate.
Record for each pass: device model, OS version, build (commit + profile),
date, per-item result (PASS/FAIL + note), any deviation. Results land in
docs/pre-promotion-checklist.md. Fix-forward findings; stop and flag any fix
that would touch a recorded decision.

## Pass A — full-battery regression (default battery must be UNCHANGED)

Run the standard official check-up (main app path, no programme flag) end to
end. The batterySequence change is additive; this pass proves the default
path is behaviourally identical on device.

| # | Behaviour to confirm | Pass looks like | Fail looks like |
|---|---|---|---|
| A1 | Battery order | Standing frame check (where enabled) → chair → balance → shoulder → hinge, exactly | Any reorder, skip, or repeat |
| A2 | Standing frame check | Lighting/stability gate + standing body-unit lock before the chair item; skip control works | Frame check missing, or chair setup reachable before it |
| A3 | Chair segment | Setup confirm → practice rep → countdown → 30 s active window; reps credited as before | Dwell/countdown differences, missing practice rep |
| A4 | Hands-free setup dwell | Setup confirmations fire on the same dwell feel as the current build | Noticeably earlier/later confirmation |
| A5 | Balance inter-trial rest | Rest window between trials enforced (minimum before "continue" enables) | Rest skippable early or never enabled |
| A6 | Side selection | Standing-leg anchor/side-consistency behaviour unchanged (incl. wrong-leg voice where shipped) | Side prompts differ from current build |
| A7 | Evidence recording | Completed battery saves a CheckUp with all items; results screen renders as today | Missing items, `no-measurement` flags on clean runs |
| A8 | Interruption behaviour | Backgrounding/tracking loss mid-item invalidates the attempt and recovers per current behaviour | Truncated attempt recorded as official |

## Pass B — Check-up #0 host (verbatim gate criteria)

Run in the programme dev shell (flag on): onboarding with assessment "Let's
do it", plus re-entry from home and from each re-offer surface.

- [ ] Order: intro → warm-up → one-leg balance → 30-second chair rise; max
      effort last, always. **T1 side count: PENDING RULING** — the official
      balance protocol measures the anchored single side; the criterion says
      both sides. Record what the build does; do not improvise a second side.
- [ ] Warm-up: ~45 s guided, skippable, produces nothing (no camera during
      warm-up, no evidence, no scores; skipping changes no result).
- [ ] Copy truthful end-to-end: intro promise matches what runs; the
      "no one sees this but you — it never leaves your phone" line present;
      airplane-mode run completes identically (on-device honesty).
- [ ] Duration (RULED): time the BATTERY ONLY — first battery screen after
      warm-up until raw completion — with a stopwatch. ≤ 2:30 = honest for
      the two-minute claim; 2:30–3:00 = PASS-WITH-NOTE (copy review);
      > 3:00 = FAIL (copy or protocol must change). Separately time the TOTAL
      experience (intro tap → back on home): flag if > ~4:00.
- [ ] Abandonment: exit during warm-up, during balance, and during chair —
      each time: no placement change, no once-only re-offer surface burned,
      home-screen movement-check button still present and working.
- [ ] Gates at every entry: B1/Gentle-Start profile sees NO assessment
      surface anywhere (offer, cards, home button); deferred re-offer appears
      after session 1; skipped warm re-offer at 7 days OR 2 sessions (card
      once, home button permanent); post-GP re-offer only after gp_confirmed.
- [ ] 'Now' path placement: fresh onboarding → complete the host with a known
      chair-rise count (e.g. 16+ clean reps) → squat ladder shows capacity
      minus one (L3 for 16+); balance < 10 s on the measured side forces
      support-variants on; a post-training run only ever moves levels UP.
- [ ] Evidence honesty: an interrupted chair segment never records a
      truncated official result (same contract as Pass A8).

## Recording template

```
Pass: A | B    Device:            OS:            Build:
Date:          Runner:
Item results:  (per-row PASS/FAIL + notes)
Deviations:
Verdict:
```
