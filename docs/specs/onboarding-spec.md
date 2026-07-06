# Onboarding & Screening Specification — v0.2
Covers: first-run flow, screening question set with routing logic, camera movement assessment (Check-up #0), placement mapping, consent, and the data model handoff to the ladder engine (see exercise-ladders-spec v0.2).

**Changelog v0.1 → v0.2 (post stress-test):**
- **Safety fix:** B1 (heart/chest-pain/dizziness) = Yes now bypasses the movement assessment entirely (max-effort testing contradicted the flag; Gentle Start places at L1 regardless). Assessment re-offered after GP confirmation.
- **Activation fix:** placement reveal now flows directly into "start your first session right now" as the primary CTA (minimum-dose version makes the offer honest at any hour); scheduling demoted to secondary.
- Assessment offer gains a first-class **"After my first workout"** deferral option; tests reordered gentle-first (balance → push → sit-to-stand) behind a 45 s guided warm-up; **on-device pose processing is now a hard engineering requirement** backing the "never leaves your phone" copy.
- Health block (Stage B) framed with intro screen + progress dots + exit acknowledgement to prevent medical-intake feel.
- Band question removed from onboarding (no day-one programming effect) → asked in-context at the Pull L4 unlock.
- Consent-decline path softened: activity-prior placement capped at L2, low-impact, no assessment — normal tone, no Gentle Start framing.
- A2 adds "menopause after surgery or medical treatment"; A1 adds "Managing weight and body changes" (decision flag: positioning call — included with honest strength-first framing, never diet content).

**Changelog v0.2 → v0.3 (2026-07-06 implementation rulings — docs/decisions.md). The v0.2
text below remains authoritative for design intent; superseded-for-v1 sections carry inline
notes rather than edits:**
- **C1/C2 package deferral:** B2 (bone questions) and the osteoporosis hard gate defer WITH
  the Impact track. v1 ships ZERO hard gates (reasoning + clinical-review requirement
  recorded in CLAUDE.md); the claims guardrail is not amended now.
- **C8:** A1 is retired as a screen — the existing LifeGoal (concrete life goals) carries
  motivation/messaging; the weight/body-changes option stays an open, non-blocking candidate
  LifeGoal addition after positioning sign-off. Friction budget gains a screen back.
- **C6:** A2 maps onto the repo's six-value stage enum (peri / meno / post /
  surgical-medical / not-sure / prefer-not-to-say) — additive v11 migration.
- **C7:** D1 keeps the day picker; the notification opt-in is NOT built (local notifications
  are a separate pending approval).
- **T2 deferred** (ruling on ambiguity 2): push places by activity prior; T1/T3 reuse the
  existing balance and chair-rise protocols. Any future T2 drops the "clean reps"/body-line
  check (C3 — the camera never judges form).
- Age + reference sex are collected at the check-up intro (point of first need), never in
  onboarding (C5); year-of-birth or 5-year band preferred over full DOB.
- §10 implemented in `src/programme` (bone_status/impact_permission deferred with B2;
  goals[] retired with A1; menopause stage lives in the existing profile enum; health flags
  local-only, excluded from backup shapes by pinned test).

---

## 1. Design principles

- **Friction budget:** ≤ 13 screens, ≤ 3 minutes from install to placement, one question per screen, all tappable, no typing. The optional camera assessment adds ~5 guided minutes.
- **Strike while motivated:** the flow's terminal goal is a *started first session*, not a scheduled one. Peak motivation is install time; the design spends it on movement, not admin.
- **Two-phase screening:** onboarding asks only what is needed to (a) keep her safe and (b) route her first weeks. Everything else is asked later, in context (doming check in the first core demo; band question at the Pull L4 unlock).
- **Advisory gates, not walls** — with one hard exception (Section 4). A blocked signup is a failed rescue of exactly the person the product exists for.
- **Every sensitive question is skippable** ("Prefer not to say" always present) and skipping routes to the *conservative* default, never the permissive one.
- **No-shame framing:** questions about leaking, balance, and joints are normalised in microcopy, and the health block is scaffolded (intro, progress, exit line) so it reads as a pit stop, not an intake.
- **Aspiration before screening:** goals first, safety second, so the safety block reads as personalisation rather than gatekeeping.
- **Camera optional and trust-timed:** assessment offers now / after first workout / skip. Pose estimation runs **on-device** — the privacy copy ("no one sees this but you; it never leaves your phone") is only shippable if engineering holds this line.

## 2. Flow overview

1. Welcome + promise (1 screen)
2. Goals & context — Stage A (3 screens)
3. Health-data consent (1 screen)
4. Safety & routing — Stage B (intro + 5 questions + exit line)
5. Home setup — Stage C (2 screens)
6. Rhythm — Stage D (1 screen)
7. Movement assessment offer → now / after first workout / skip *(bypassed entirely if B1 = Yes)*
8. Placement reveal → **primary CTA: start first session now** (secondary: schedule it)

## 3. Question set with routing

Wording below is user-facing copy (plain language, warm). Every screen shows a one-line "why we ask".

### Stage A — About you

**A1. What matters most to you right now?** *(multi-select)*
Feeling stronger · Protecting my bones · More energy · Better sleep and mood · Managing weight and body changes · Feeling like myself again
→ Drives messaging, progress framing, and retention copy only. No programming effect. **Weight/body-changes selection** routes to honest framing content: strength training genuinely improves body composition; the app never provides diet plans, calorie targets, or weight-loss promises. *(Decision flag: positioning call — recommended included, owner sign-off needed.)*

**A2. Where are you on the menopause journey?**
Perimenopause · Postmenopause · Menopause after surgery or medical treatment · Not sure · Prefer to skip
→ Messaging and education only. No programming effect. Surgical/medical option tailors education content and adds one gentle bone-health nudge (some treatments accelerate bone loss — "worth asking your GP about a bone check"), since this segment is often younger with faster loss. "Not sure" triggers a gentle explainer later, never a quiz.

**A3. How active are you these days?**
Mostly sitting · On my feet a lot, but no real exercise · I exercise now and then · I exercise regularly
→ Sets `activity_prior` (0–3). Used as placement prior (Section 6) and to calibrate week-1 tone.

### Consent screen (before Stage B)

The next questions touch on health. Explicit opt-in consent for processing health data (UK GDPR special category), plain-language purpose ("only to tailor your programme; never sold or shared"), detail behind a link. Declining → skip Stage B, apply Section 4 decline defaults (normal tone, not Gentle Start), re-offer at first check-up.

### Stage B — Keeping you safe

*Block intro screen:* "Quick safety tune-up — five taps, about 30 seconds. This is how we make the programme yours." Progress dots visible throughout.

**B1. Has a doctor ever told you that you have a heart condition — or do you get chest pain or serious dizziness when you're active?**
Yes · No
→ Yes: **Gentle Start preset** (all ladders L1, Low-Impact track, no bonus sets, softer cadence) + advisory: "Worth a quick chat with your GP before ramping up — meanwhile we'll begin very gently." Acknowledgement tap required. **Movement assessment bypassed** (re-offered once GP conversation confirmed). Preset lifts on `gp_confirmed` (self-report, one tap, re-asked at first check-up).

**B2. Any of these apply to your bones?** *(multi-select)* *(v0.3: DEFERRED with the Impact
track — see changelog. Stage B runs B1, B3, B4, B5 in v1.)*
Osteoporosis diagnosis · Osteopenia diagnosis · A broken bone from a small slip or fall since about age 40 · None of these
→ Osteoporosis: `impact_permission = locked` (hard gate, Section 4); Low-Impact track; in-app copy explains why and how to unlock (clinician OK). Osteopenia or fragility fracture: Low-Impact default, Impact re-offered at check-ups with education. Programme-wide spinal-flexion ban already covers all users.

**B3. Any joints that regularly hurt or feel unreliable?** *(multi-select)*
Knees · Hips · Shoulders · Wrists · Lower back · None
→ Pre-arms the matching adaptation branches from ladder spec Section 10 from day one, not after a pain flag.

**B4. Do you ever leak a little when you cough, sneeze, laugh or jump — or feel a heaviness in your pelvic area?** *(microcopy: "About half of women at this stage do — nothing to be embarrassed about.")*
Often · Sometimes · Never · Prefer not to say
→ Often/Sometimes/Prefer-not-to-say: Low-Impact track default, pelvic floor guidance content unlocked, pelvic-health physio signpost shown once (neutral framing). Impact re-offered at check-ups on reported improvement. Never: Impact track available.

**B5. Have you had a fall in the last year, or do you worry about your balance?**
Yes · No
→ Yes: `balance_support_default = on` — unilateral exercises default to "fingertips on support" sub-variants; voice always cues wall/chair proximity; single-leg finisher levels require check-up sign-off.

*Block exit line:* "That's the health stuff done. Everything from here is about what you **can** do."

### Stage C — Your home

**C1. Do you have stairs where you'll work out?**
Yes · No
→ No: push ladder L3–L5 swap to graded stable-surface inclines (sofa arm → low table with wall support cue → floor); step-up levels swap to a sturdy low-step alternative or lateral step patterns; app suggests a cheap aerobic step at the equipment-tier nudge.

**C2. Do your workouts need to be quiet — downstairs neighbours, sleeping family?**
Yes · No
→ Yes: `quiet_mode = on` → Low-Impact/Quiet finisher track, stomps removed, volume-of-thud cues throughout.

*(Band ownership question removed from onboarding — asked in-context at the Pull L4 unlock moment, where it has its only effect.)*

### Stage D — Rhythm

**D1. Which three days usually suit a short workout?** *(day picker, pre-selects today + two)*
→ Scheduling + notification timing. Notification opt-in asked here, framed around her choices ("Want a nudge on the days you picked?"), never as a generic permission grab.

## 4. Gate philosophy (summary table)

| Condition | Gate type | Effect |
|---|---|---|
| Heart/chest-pain/dizziness flag (B1) | Advisory + acknowledgement | Gentle Start preset until GP conversation confirmed; **assessment bypassed** |
| Osteoporosis diagnosis (B2) *(v0.3: deferred with B2/Impact — v1 ships zero hard gates, pinned by test)* | **Hard gate — Impact track only** | Impact locked pending clinician OK; everything else available with existing programme-wide protections |
| Osteopenia / fragility fracture (B2) | Soft routing | Low-Impact default, educated re-offer at check-ups |
| Pelvic floor symptoms (B4) | Soft routing | Low-Impact default, content + physio signpost, re-offer on improvement |
| Falls / balance worry (B5) | Soft routing | Support variants default on |
| Consent declined | Conservative routing, normal tone | Activity-prior placement capped at L2, Low-Impact track, no assessment; **not** Gentle Start framing — a privacy choice is never treated as a health flag |

Nothing in onboarding ever blocks access to the app as a whole.

## 5. Camera movement assessment — Check-up #0 (optional, trust-timed)

Framed as a feature, not a test: "Two minutes of moving so your programme fits you exactly — no one sees this but you, and it never leaves your phone." **Engineering requirement: pose estimation runs on-device; recorded frames are processed and discarded locally. If this cannot be held, this copy and the consent language must change before ship.**

**Offer has three options, all first-class:**
- **"Let's do it"** → assessment now
- **"After my first workout"** → scheduled deferral; app re-offers at the end of session 1 or start of session 2 ("Ready for that two-minute movement check? It makes your levels exact"). Near-day-0 baseline preserved for the progress-proof loop.
- **"Skip for now"** → Section 6 conservative placement + warm re-offer after week 1.

**Bypass rule:** B1 = Yes skips this screen entirely (placement is L1 regardless; max-effort testing contradicts the flag). Re-offered once `gp_confirmed`.

**Structure: 45 s guided gentle warm-up (marching, easy reaches), then three items ordered gentle-first, ~5 min total, phone propped per on-screen guide:**

**T1 — Single-leg stand, each side (eyes open, support in reach).** *(v0.3, ruled
2026-07-06: SINGLE-SIDE in v1 — T1 reuses the official balance instrument's anchored
standing leg, preserving side-consistency and longitudinal comparability; worse-side
measurement deferred. Safety intent stays conservatively covered: B5 self-report forces
support on, and support-default is never turned off by a good measured side.)*
| Time (worse side) | Effect |
|---|---|
| < 10 s | `balance_support_default = on` (even if B5 was No) |
| 10–30 s | Normal |
| > 30 s | Normal; unlocks earlier single-leg finisher offers |

**T2 — Push-up incline finder.** Guided descending attempts, 3–5 reps per stop: wall → counter-height guide → mid guide → low guide. Camera checks body line, records deepest incline with 5 clean reps.
| Deepest clean incline | Push capacity level |
|---|---|
| Wall only | L1 |
| Counter | L2 |
| Mid (3rd–4th stair equiv.) | L3 |
| Low (1st–2nd stair equiv.) | L4–L5 |

**T3 — 30-second sit-to-stand (chair).** Camera counts clean reps, flags hand-assist. Placed last so max effort comes after she's warm and settled.
| Result | Squat capacity level |
|---|---|
| < 8, or hands needed | L1 |
| 8–11 | L2 |
| 12–15 | L3 |
| 16+ | L4 |
Also captures rep speed → informs finisher power baseline.

Not assessed at onboarding, by design: the hinge (taught at its L5 gateway, rehearsed in movement prep from day one), core (placed by activity prior), and pull (placed by activity prior; entry-promote rules move quick users through L1–3 fast).

## 6. Placement mapping

`start_level = max(1, capacity_level − 1)` — the deliberate easy start from the ladder spec.

| Ladder | With assessment | Deferred / skipped | Consent declined |
|---|---|---|---|
| Squat | T3 mapping − 1 | L1 (activity_prior ≥ 2 → L2) | Same as skipped, capped L2 |
| Push | T2 mapping − 1 | L1 (activity_prior ≥ 2 → L2) | Same as skipped, capped L2 |
| Hinge | L1 (activity_prior 3 → L2) | Same | Same |
| Pull | L1 (activity_prior ≥ 2 → L2) | Same | Same |
| Core | activity_prior 0–1 → L1 · 2 → L2 · 3 → L3 | Same | Capped L2 |
| Finisher | Track per routing; contacts start at 20 | Same | Low-Impact |

Deferred-assessment users are re-placed (upward only) when the assessment completes. Placement reveal is a celebration screen ("Your starting levels are set"), never a scorecard — levels shown as names, not grades or numbers inviting comparison.

## 7. Placement reveal → first session (the activation moment)

One expectation screen, three messages:
1. "We start gently **on purpose**. Your only job this month is showing up."
2. "Sessions are 20–25 minutes, voice-guided — prop your phone anywhere and just move."
3. "Every few weeks, a two-minute movement check shows you exactly how much stronger you're getting."

Then the primary CTA: **"Start your first session now — 15 minutes."** (First session is the minimum-dose-length version by default: honest at any hour, in any outfit, and ends with her having *done* it on day zero.) Secondary CTA: "Schedule it for [nearest chosen day]." If scheduled, a warm same-day fallback: "Or do the 10-minute starter tonight — momentum counts double on day one."

## 8. Re-screening & in-context screens (post-onboarding)

| Trigger | Screen |
|---|---|
| End of session 1 / start of session 2 | Deferred-assessment re-offer (if chosen at onboarding) |
| First core exercise demo | Doming/diastasis visual check ("If you see a bulge down your middle, tap here") → diastasis branch + physio signpost |
| Pull L4 unlock | Band question ("Do you have a resistance band? · Yes · No · What's that?") → upgrade nudge copy path; 15 s explainer for "What's that?" |
| Pain flag mid-programme | Mini-screen: which joint, how sharp → adaptation branch + regression per ladder spec |
| Every camera check-up (4–6 wks) | Re-offer Impact track where soft-routed; re-ask unanswered Stage B items; confirm GP conversation if Gentle Start active |
| 14+ days inactive → return | "Welcome back" flow: one screen, any changes? (injury/illness/nothing) → pairs with automatic one-level regression |
| User-initiated | Settings → "Update my health info" always available |

## 9. Compliance & tone notes

- Health answers are UK GDPR special-category data: explicit consent (Section 3), granular skip, purpose limitation, delete-my-data path in settings. Not buried in general T&Cs.
- Assessment video: on-device processing requirement (Section 5) is what makes the privacy copy truthful — flag to engineering as a launch-blocking constraint on architecture choices.
- App is a wellness product, not a medical device: copy informs and signposts ("worth a chat with your GP"), never diagnoses or claims treatment. Bone-claims language consistent with ladder spec Section 8: *protect*, *slow loss*, *reduce fall risk* — never *rebuild density*. Weight/body-changes goal (A1) never routes to diet content, calorie targets, or weight-loss promises.
- Signposts used: GP (B1, unlock flow, surgical-menopause bone nudge), pelvic-health physiotherapist (B4, doming), clinician sign-off (osteoporosis impact unlock). Signposts appear once, warmly, and are dismissible — never nagging.
- Exact Stage B screen set to be blessed by clinical review before launch (single-question PAR-Q compression is defensible for this intensity but should carry a professional's sign-off).

## 10. Data model handoff (engineering)

Profile flags written by onboarding, read by the ladder engine:

```
consent_health_data      bool
activity_prior           0–3
goals[]                  strength | bones | energy | sleep_mood | body_changes | myself_again
menopause_stage          peri | post | surgical_medical | unsure | skipped
gentle_start_active      bool        # B1; lifts on gp_confirmed
gp_confirmed             bool
bone_status              none | osteopenia | fracture_history | osteoporosis
impact_permission        open | soft_low_impact | locked
pelvic_routing           none | low_impact
quiet_mode               bool
joint_flags[]            knee | hip | shoulder | wrist | low_back
balance_support_default  bool
has_stairs               bool
has_band                 bool | null   # set in-context at Pull L4, not onboarding
diastasis_flag           bool          # set in-context, not onboarding
placement{}              per-ladder start levels
assessment_status        done | deferred | skipped | bypassed_b1
chosen_days[]            weekday set
first_session_started    bool          # the activation event; the flow's success metric
```

Routing precedence when flags conflict: hard gates > soft routings > preferences. Example: quiet_mode = false but pelvic_routing = low_impact → Low-Impact track wins.

---
*Open items for v0.3: final microcopy pass with brand voice, localisation of clinical signposts outside the UK, assessment camera-guide storyboards, notification cadence spec, "Update my health info" settings flow, A1 body-changes framing content (pending positioning sign-off).*
