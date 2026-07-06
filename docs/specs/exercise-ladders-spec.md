# Exercise Ladder Specification — v0.2
Strength programming for at-home, voice-led sessions. Target user: untrained/detrained peri- and post-menopausal women. Goals: muscle, strength, bone protection, minimal friction.

**Changelog v0.1 → v0.2 (post stress-test):**
- Bone framing corrected: programme promise is *slow bone loss + reduce fall/fracture risk*, not rebuild BMD (impact protocols that build bone pre-menopause do not reliably do so post-menopause; BMD gains require heavy loading). Backpack loading tier elevated to the primary long-term bone lever.
- Push ladder rebuilt as a continuous full-body incline descent (counter → stairs → floor); knee push-ups demoted to back-off variation; eccentric-only push-ups capped at very low volume (DOMS risk).
- Squat ladder: step-ups now the unilateral entry (familiar, knee-friendly); split squats moved later; assisted single-leg/skater squats cut from the main ladder.
- Hinge ladder: standing hinge rehearsal drill added to movement prep from day one; sofa hip thrust demoted to variation; loaded kickstand RDL replaces unsupported single-leg RDL as primary.
- Pull ladder: anchor-free seated band row is now the mandatory path; door-anchor row optional.
- Core ladder: Pallof press demoted to optional (anchor friction); suitcase carries moved up (grip strength emphasis).
- Default prescription reduced to 2 hard working sets (+ optional bonus set) to protect the 20–25 min session promise.
- Entry levels (1–2 per ladder) promote after one session at top of range.
- Noise-aware routing added to the finisher; plain-language exercise naming rule added.

**Changelog v0.2 → v0.3 (2026-07-06 implementation rulings — docs/decisions.md). The v0.2
text below remains authoritative for design intent; where a ruling supersedes it for v1,
the section carries an inline note rather than an edit:**
- **C1/C2 package deferral:** the Impact track (§8) is deferred (with onboarding B2 and the
  osteoporosis hard gate, which exist only to gate it). The Low-Impact/Quiet track (§9) is
  the universal v1 finisher, presented as the "power finisher". v1 therefore ships zero hard
  gates — recorded with reasoning in CLAUDE.md; clinical review must bless before launch.
- **C3 teach-only gateways:** [C] levels unlock via demo watched + logged rehearsal exposures
  (where a rehearsal drill exists) + a self-confirmation tap. The camera never judges form
  (product law upheld); camera protocols count and measure only.
- **C10 promotion semantic:** §12 runs on REPORTED reps/effort (adherence decision, never a
  measurement); camera check-ups are the measured reconciliation point.
- Effort answers arrive v1 via the existing session RPE (1–5 → lots / a-few / none), tap-first;
  a 3-intent voice slice is the first post-v1 vocabulary addition (avoid "none" — collides
  with "done").
- Implemented in `src/programme` (flag-gated parallel engine; see ladder-migration-map.md).

---

## 1. How the ladder system works

- Each movement pattern (Squat, Hinge, Push, Pull, Core) has an ordered ladder of levels. The user occupies exactly **one level per pattern** at any time. The bone finisher runs on its own parallel tracks (Impact / Low-Impact–Quiet).
- Sessions pull the user's current level from each ladder. Template A uses the level's **primary** exercise; Template B uses the level's **variation** (where listed; otherwise the same exercise).
- **Prescription format:** sets × rep range, with tempo. Default tempo: 3 s down, controlled up. From Squat L3 and Hinge L5 onward, cue "slow down, fast up" to train power intent.
- **Default volume: 2 hard working sets.** A third **bonus set** is offered (never required) when the user is inside the session time budget and answers "lots more" on effort — extra volume framed as reward, not obligation.
- **Effort rule:** every working set runs to ~2 reps in reserve ("about two left in the tank"), enforced by cadence-called reps + the end-of-exercise effort question ("Could you have done none, a few, or lots more?").
- **Double progression within a level:** build reps through the range; bonus set when offered/accepted.
- **Promotion (standard):** top of rep range hit on all sets in **two consecutive sessions** featuring that exercise, AND effort answer is "a few" or "none", AND no pain flag in the last two sessions. If effort answer is "lots" at top of range, promote after **one** session.
- **Entry levels (L1–L2 on every ladder):** promote after **one** session at top of range — early boredom is a bigger risk than early progression.
- **Gateway levels [C]:** form-critical or higher-risk levels unlock only after camera teaching/verification (at a scheduled check-up, or a one-off 2-minute verification moment). Marked [C] in the tables.
- **Demo rule:** first exposure to any new level = one-time 20–30 s video demo at session start; then phone down, voice takes over.
- **Demotion / regression:**
  - 14+ days inactive → drop one level on every ladder (framed positively: "easing back in").
  - Effort answer "none left" at the *bottom* of the rep range twice in a row → hold level, drop bonus set, re-build.
  - Pain report → regress to last pain-free level, apply relevant adaptation branch (Section 10), flag for review.
- **Placement:** onboarding camera assessment places a starting level per pattern, then starts the user **1–2 levels below** measured capacity (deliberate easy start).
- **Skipping:** between check-ups, promotions are single-step only. At camera check-ups, users who clearly exceed their level may jump multiple levels.
- **Naming rule:** all user-facing exercise names in plain language ("balance reach", "stair press-up"), never gym jargon (RDL, RFESS, eccentric). Internal IDs can keep technical names.

## 2. Rep-range conventions

| Level type | Range | Notes |
|---|---|---|
| Entry / capacity levels | 10–20 reps | Load is trivial; range builds work tolerance |
| Standard strength levels | 8–15 reps | Core of the programme |
| Unilateral / hard levels | 6–10 reps per side | Balance + intensity limit reps |
| Isometrics (planks etc.) | 15–45 s | Promote on time, not reps |
| Bone finisher | 20–50 ground contacts | Progress quality/novelty, not volume |

**Equipment tiers:** long resistance band (nudged as the "free upgrade" at Pull L4) and loaded backpack (books, tightly packed). Post stress-test, the backpack is the **primary long-term progression lever** — from mid-ladder onward, adding load beats adding gymnastic difficulty for muscle, bone, and safety. Equipment tier also unlocks: backpack overhead press (vertical push, daily-function relevance) and optional band arm work (see Section 11).

---

## 3. Squat ladder (knee-dominant)

| # | Primary exercise | Variation (Template B) | Prescription | Notes |
|---|---|---|---|---|
| 1 | Assisted sit-to-stand (raised seat, hands allowed) | Partial-depth box squat | 2 × 10–20 | Seat height = progression lever within level |
| 2 | Sit-to-stand, no hands, standard chair | Slow-lower sit-to-stand | 2 × 10–20 | Introduce "slow down, fast up" here |
| 3 | Box squat, touch-and-go (3 s down) | Fast-up sit-to-stand | 2 × 8–15 | Chair behind = confidence + built-in depth gauge |
| 4 | Air squat, 3 s down | Paused air squat (2 s in bottom) | 2 × 8–15 | Box remains available as depth self-check; depth verified at camera check-up |
| 5 | Low step-up, ~15 cm, fingertips on rail/wall | Lateral step-up, low step | 2 × 6–10 /side | **Unilateral entry** — uses her own stairs, familiar motion, knee-friendly; slow lower down |
| 6 | Step-up, higher step (~25 cm), light support | Step-up with knee drive | 2 × 6–10 /side | Height per comfort |
| 7 | Supported split squat (fingertips on wall/chair) | Static lunge, shallow range | 2 × 6–10 /side | Warn about first-time soreness; start shallow |
| 8 | Split squat, unsupported [C] | Tempo split squat | 2 × 6–10 /side | Camera-verify knee tracking + balance before unlock |
| 9 | Rear-foot-elevated split squat (sofa/chair) [C] | Tempo version | 2 × 6–10 /side | Big stimulus; camera-verify setup once |

**Beyond L9:** progression is load (backpack goblet hold or worn), not harder gymnastics. Assisted single-leg/skater squats exist only as an opt-in advanced branch for users who ask — fall risk outweighs benefit as a default path.

## 4. Hinge ladder (hip-dominant)

**Movement-prep rehearsal (from day one):** every session's warm-up includes 5–6 slow unloaded standing hinges ("soft knees, reach your hips back toward the wall behind you") regardless of current hinge level. By the time the user reaches the L5 gateway, the pattern has been grooved dozens of times with zero stakes; the camera session becomes confirmation, not first instruction.

| # | Primary exercise | Variation (Template B) | Prescription | Notes |
|---|---|---|---|---|
| 1 | Glute bridge | Bridge with 3 s hold at top | 2 × 10–20 | "Push the floor away" |
| 2 | Paused glute bridge (3 s squeeze) | Feet-elevated bridge (low step) | 2 × 8–15 | |
| 3 | Single-leg glute bridge | Single-leg bridge, 3 s hold | 2 × 6–10 /side | First unilateral hinge |
| 4 | Feet-elevated single-leg bridge | Hip thrust, shoulders on sofa (only if user's setup suits — fiddly; skippable) | 2 × 6–10 /side | Sofa thrust demoted to variation after friction review |
| 5 | Standing hinge — wall-tap drill [C] | Hinge with arm reach | 2 × 10–15 | **Form-critical gateway**, already rehearsed in prep; heels ~30 cm from wall |
| 6 | Good morning (hands on chest, 3 s down) | Hinge, fast up | 2 × 8–15 | Only after L5 verified |
| 7 | Kickstand hinge (rear foot as kickstand), bodyweight → light backpack | Supported single-leg hinge (fingertips on chair) | 2 × 6–10 /side | More hamstring per unit of balance demand |
| 8 | Loaded kickstand hinge (backpack or band) | Unsupported single-leg balance reach (balance-emphasis option) | 2 × 8–12 /side | Load is the lever from here; unsupported version is a balance exercise, not the strength path |

## 5. Push ladder

Rebuilt as a **continuous incline descent in the full-body position** — the plank chain never breaks, and each stair step is a ready-made mini-level. Knee push-ups serve as the back-off/extra-volume variation throughout.

| # | Primary exercise | Variation (Template B) | Prescription | Notes |
|---|---|---|---|---|
| 1 | Wall push-up | Wall push-up, 3 s down | 2 × 10–20 | Feet further from wall = harder, within level |
| 2 | Counter push-up | Paused counter push-up | 2 × 8–15 | Kitchen counter — stable, always available |
| 3 | Stair push-up, hands on 3rd–4th step | Knee push-up | 2 × 8–15 | Stability cue in voice script |
| 4 | Stair push-up, hands on 2nd step | Knee push-up, 3 s down | 2 × 6–12 | |
| 5 | Stair push-up, 1st step / low stable surface | Deficit knee push-up (hands on books); *occasional* eccentric-only full push-up, capped 2 × 3–5 | 2 × 6–10 | Eccentric-only strictly volume-capped — severe soreness risk |
| 6 | Full push-up | Full push-up, 3 s down | 2 × 5–10 | Milestone — celebrate in-app |
| 7 | Paused/tempo full push-up | Close-grip full push-up | 2 × 6–10 | |
| 8 | Feet-slightly-elevated push-up | Archer intro (optional) | 2 × 5–8 | Optional apex; load (backpack on back at an incline) is the friendlier lever |

**Vertical push:** no adequate no-equipment option for this audience (pike push-ups are wrist/shoulder-hostile). Backpack overhead press at the equipment tier fills the gap and maps to daily function (cupboards, shelves).
**Wrist-sensitive branch:** fists or handles, or stay one incline higher with backpack load.

## 6. Pull ladder

Honest note unchanged: L1–3 are postural/shoulder-health work, not meaningful back building. The band unlock at L4 is the "free upgrade" moment and should be nudged firmly. Post stress-test, the mandatory path is **anchor-free** — the door anchor (highest-friction, only safety-sensitive setup in the programme) is now optional.

| # | Primary exercise | Variation (Template B) | Prescription | Notes |
|---|---|---|---|---|
| 1 | Prone shoulder-blade squeeze (3 s holds) | Seated retraction holds | 2 × 10–15 | Teaches scapular control |
| 2 | Prone T raise | Prone W raise | 2 × 10–15 | Thumbs up, squeeze at top |
| 3 | Prone Y-T-W circuit | Reverse snow angel | 2 × 8–12 per shape | Last no-equipment level |
| 4 | **Band unlock** — band pull-apart | Overhead band pull-apart | 2 × 10–20 | One-time video for band handling |
| 5 | Seated band row (band looped around feet) | Door-anchored two-arm row [C] — optional, for users happy with setup | 2 × 8–15 | Zero-setup primary path; anchor verified once if chosen |
| 6 | Single-arm seated band row | Band row with 3 s hold | 2 × 8–12 /side | |
| 7 | Band face pull (high anchor) or high pull-apart (no anchor) | Band high row | 2 × 10–15 | First level where an anchor genuinely helps; anchor-free alternative always offered |
| 8 | Heavier band row or backpack bent-over row — **requires Hinge L5 verified** | Supported single-arm backpack row (hand on chair) | 2 × 8–12 | Bent-over position is a loaded hinge hold; cross-ladder prerequisite enforced |

## 7. Core ladder

Design principle unchanged and reinforced by the bone evidence: anti-extension and anti-rotation work only. **No loaded or repeated spinal flexion (crunches, sit-ups) and no loaded twisting anywhere in the programme** — bone status is unknown for most users.

| # | Primary exercise | Variation (Template B) | Prescription | Notes |
|---|---|---|---|---|
| 1 | Dead bug — heel slides | Dead bug — single leg lower | 2 × 8–12 /side | "Low back stays glued to floor" |
| 2 | Dead bug — opposite arm + leg | Slow-tempo dead bug | 2 × 6–10 /side | |
| 3 | Bird dog | Bird dog with 3 s hold | 2 × 6–10 /side | |
| 4 | Knee plank | Knee side plank | 2 × 15–40 s | Time-based promotion |
| 5 | Full plank | Side plank (knees) | 2 × 20–45 s | |
| 6 | Full side plank | Plank shoulder taps | 2 × 15–40 s /side | |
| 7 | Suitcase carry (loaded backpack, one hand) | Front-hug carry | 2 × 20–40 m or 30–45 s | Moved up: grip strength is a headline healthy-ageing marker, and carries are the most life-relevant exercise in the app |
| 8 | Heavier/longer carries | Band Pallof press — optional, where an anchor exists | 2 × 30–60 s or 8–12 /side | Pallof demoted for anchor friction; carries scale indefinitely with load |

## 8. Bone finisher — Impact track

*(v0.3: DEFERRED as a package with onboarding B2 and the osteoporosis hard gate — the
2026-07-05 impact-loading deferral stands. Not built in v1; un-deferral ships B2 with a
scoped claims-guardrail exception. The section remains the design of record for that day.)*

**Honest framing (product + marketing):** at achievable home loads, this programme's realistic bone promise is to *slow bone loss and cut fall/fracture risk* through strength, power, landing skill, and balance — not to rebuild bone density. Impact protocols that build BMD in premenopausal women have repeatedly failed to do so post-menopause; meaningful BMD gains in trials required heavy loading. This is why the backpack tier matters and why in-app copy must not promise density gains.

Runs as the 2–3 minute session closer. Currency is **ground contacts**, ~20 building to ~50 per session, in clusters with brief rests (e.g. 5 × 10 contacts, 30–60 s between) — bone responds better to rest-inserted loading. Progress **height, speed, direction novelty**, not volume beyond ~50.

| # | Exercise | Contacts | Notes |
|---|---|---|---|
| 1 | Heel drops (rise to toes, drop onto heels) | 20–30 | Gentle, quiet-ish entry; also loads calves/ankles for balance |
| 2 | Alternating stomps, progressively forceful | 20–40 | Loud — see noise routing |
| 3 | Low double-leg hops in place | 20–40 | "Springy" landings |
| 4 | Jump-and-stick (land, hold 2 s) | 20–30 | Landing mechanics before volume |
| 5 | Multidirectional hops (front/back, side/side) | 30–50 | Direction novelty is the point |
| 6 | Single-leg hop-and-stick | 20–30 /side | Doubles as fall-prevention balance work |
| 7 | Skater bounds | 30–40 | **Footwear/flooring cue mandatory** — no socks on wooden floors; carpet or trainers |

## 9. Bone finisher — Low-Impact / Quiet track

*(v0.3: this is the UNIVERSAL v1 finisher for every user — presented simply as the "power
finisher" — while the Impact track is deferred. Quiet routing still removes stomps.)*

For users routed away from impact (pelvic floor symptoms, prolapse, joint flare, known osteoporosis without clinician sign-off, preference) — **and doubles as the noise-constrained track** for flats/shared floors, offered at onboarding ("Do you need your workouts to be downstairs-neighbour-friendly?"). Emphasis: strain rate via explosive intent.

| # | Exercise | Dose | Notes |
|---|---|---|---|
| 1 | Heel drops | 20–30 | Quietest osteogenic option |
| 2 | Moderate stomps | 20–30 | Offer, don't require; skip on quiet routing |
| 3 | Explosive sit-to-stands (fast up, slow down) | 2 × 6–8 | Silent power work |
| 4 | Fast step-ups (drive up quick) | 2 × 6–8 /side | |
| 5 | Fast counter push-offs | 2 × 6–10 | Upper-body power |
| 6 | March with forceful heel strikes | 30–45 s | Suits voice cadence |

**Routing rules:** screen at onboarding (leaking with cough/jump/run, prolapse symptoms, joint status, fracture history / osteoporosis diagnosis, noise constraints). Diagnosed osteoporosis → clinician sign-off before Impact track. Re-offer Impact at check-ups if symptoms improve; pair with pelvic floor guidance content and pelvic-health physio signpost, framed neutrally.

## 10. Adaptation branches (cross-cutting)

| Branch | Trigger | Modifications |
|---|---|---|
| Knee-sensitive | Pain flag on squat pattern | Bias box variants and step-ups; reduce depth before level; tempo/isometric holds as intensity levers |
| Wrist-sensitive | Pain flag on push/plank | Fists or handles; higher incline + backpack; forearm planks |
| Balance-limited | Wobble reported / observed at check-up | Every unilateral level has a "fingertips on support" sub-variant; voice always cues wall/chair proximity |
| Shoulder-sensitive | Pain flag on push/pull | Limit push depth, elbows ~45°; favour rows over raises; skip overhead work |
| Doming / diastasis reported | Onboarding or check-up | Favour dead bugs, bird dogs, carries over long front planks; physio signpost |
| Osteoporosis-diagnosed *(v0.3: deferred with B2/Impact — no v1 disclosure exists)* | Onboarding disclosure | Programme-wide flexion ban already covers core; Impact track gated on clinician OK; extra emphasis on hinge quality |

## 11. Session template mapping & optional extras

- **Template A:** Squat (primary) · Push (primary) · Hinge — bridge-family level · Pull · Core · Finisher
- **Template B:** Hinge — standing-family level (once L5 unlocked; before that, same-level variation) · Push (variation) · Squat (variation) · Pull (variation) · Core (variation) · Finisher
- Supersets: lower + upper paired (Squat + Push, Hinge + Pull), Core standalone, Finisher last. Movement prep (incl. hinge rehearsal drill) opens every session.
- **Time budget rule:** the session plan must fit 20–25 min at 2 working sets; bonus sets only offered when the running clock allows.
- **Optional arm block (equipment tier):** 1–2 sets of band curls / band pressdowns as an opt-in extra after the finisher. Physiologically minor, motivationally significant — visible arm change is a retention lever. Never part of the mandatory session.

## 12. Promotion logic summary (engineering)

Per exercise-instance state: `current_level`, `sets_prescribed`, `reps_achieved[]`, `effort_answer` (none / a few / lots), `pain_flag`, `last_performed_at`, `camera_verified` (for [C] levels), `is_entry_level`.

```
promote IF (all sets >= top_of_range) on 2 consecutive sessions
        AND effort_answer in {none, a_few}
        AND no pain_flag in last 2 sessions
        AND (next_level not gateway OR camera_verified)
        AND cross_ladder_prereqs met            # e.g. Pull L8 requires Hinge L5 verified
fast-promote IF top_of_range AND effort_answer == lots        (1 session)
entry-promote IF is_entry_level AND top_of_range              (1 session)
hold+reduce IF effort_answer == none at bottom_of_range twice
regress IF pain_flag OR days_inactive >= 14
```

Voice never announces raw logic — promotions are framed as earned level-ups; regressions as "easing back in."

---
*Open items for v0.3: exact seat/step height guidance per level, full voice-script templates per exercise, onboarding screening question set (incl. pelvic floor, noise, diastasis, osteoporosis routing), check-up assessment battery mapped to placement logic, plain-language naming table.*
