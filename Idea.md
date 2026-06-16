# Movement-longevity app — full context

This document describes a consumer mobile app concept in full: what it is, who it serves, how it works, its product-market-fit thesis, the competitive landscape, the underlying science, the business model, the technical approach, and the risks. It is written to give a reader complete context on the idea.

---

## 1. Concept in one line

A phone app that **measures how well a person's body is aging — strength, balance, and mobility — using only the phone camera**, gives them a short guided home-training plan to improve their weakest area, and proves month over month that it is working.

The simplest analogy: a bathroom scale, but for strength and balance instead of weight. A familiar, low-friction measurement ritual that produces a number people care about and return to.

---

## 2. The core insight

There are two ideas the whole product rests on.

**First: the camera is the only consumer sensor that can measure the things that predict healthy aging.** Wearables (smartwatches, rings, chest straps) have saturated everything an accelerometer and an optical heart-rate sensor can see — cardio fitness, sleep, steps, heart-rate variability, recovery. But none of them can measure muscular strength, power, balance, or mobility, because none can see the whole body move. Those qualities — how easily you rise from a chair, how long you can stand on one leg, how fast you can walk, how much force your legs can produce quickly — are among the strongest predictors of how long and how well a person stays independent and mobile as they age. The phone camera, via pose estimation, is the only device in an ordinary person's life that can quantify them.

**Second: the camera should be used as a measuring instrument, not as a form coach.** Pose estimation is highly reliable at timing, counting, and tracking the speed and range of slow, deliberate movements. It is unreliable at fine-grained judgment of exercise "form," and any product that critiques form rep-by-rep loses user trust the first time it is wrong. The entire product is therefore built on what the technology does well — measurement — applied specifically to the things people cannot perceive about themselves. Strategic framing: **the camera is the sensor; adherence (keeping people training) is the product.**

The deepest version of the insight is that pose estimation is useful exactly where self-perception fails. A person in their fifties cannot perceive slow change in their own body, cannot objectively judge their own balance, doesn't know when an exercise has become too easy, and doesn't know when to stop. These perception gaps map onto concrete, decision-grade uses (see §8).

---

## 3. The market context / why now

The "longevity" and "healthspan" conversation has moved from niche to mainstream over the last few years. Concepts that were once confined to sports science and geriatrics — that grip strength and leg power predict mortality, that the ability to rise from the floor or balance on one leg correlates with longevity, that muscle and balance are "use it or lose it" — are now widely discussed in popular health media. Single-leg balance tests and chair-stand tests circulate repeatedly as viral social content. Millions of people aged 45–65 have absorbed the message that strength, power, and balance are how you age well — and they have no way to measure where they personally stand.

That gap — broad, freshly-created demand for self-knowledge about physical aging, with no consumer instrument to satisfy it — is the opening the product is built for.

---

## 4. Target user

**Primary:** adults roughly **45–65**, generally healthy, **not regular gym-goers**, typically in the UK to start. The defining characteristic is psychographic, not demographic: they have had one or more "my body is starting to change" moments — knees complaining on stairs, unexpected stiffness, a pulled muscle from an ordinary movement, feeling less steady than they used to, struggling to keep up with younger family on a walk or hike. They have likely searched things like "how to get fitter at 55" or absorbed the longevity message and want to act on it but find gyms intimidating, time-consuming, or irrelevant to their goals. They are injury-conscious and motivated by evidence, reassurance, and routine — not by competition, aesthetics, or gamification.

**Secondary acquisition wedge:** **adult children (roughly 35–50)** who worry about an aging parent and administer the check-up to them. This is a near-zero-cost distribution mechanism (one person introduces the product to another), and the adult child frequently converts into a self-buyer.

**Explicitly not the target:** young muscle-building or aesthetic-focused gym users (18–30); and not "elderly"/frailty-branded (75+) users — the product is aimed at active, capable midlife people who want to *stay* that way, and its tone is vitality and capability, never decline or fear.

---

## 5. How it works — the product loop

The product runs on a layered rhythm, with usage at several frequencies:

- **Monthly (~10 minutes): the Movement Check-Up.** A voice-guided assessment done at home with the phone propped against a wall. The user performs a short battery of validated movement tests; the app scores them and returns results expressed as "ages" per domain (e.g. "your strength is typical of a 52-year-old; your balance, a 67-year-old"). This is the measurement event and the source of the number the user tracks over time. Detail in §6.

- **3× per week (~20 minutes): training sessions.** Short, voice-guided home workouts targeting the user's weakest assessed domain. This is where the user spends the overwhelming majority of their time in the app — it is the real product, the part that produces the actual physical gains. Detail in §7.

- **Weekly (~60 seconds): a micro-check.** A single quick test (one balance hold, or five fast chair stands) that keeps the trend line alive between full check-ups and provides a frequent, low-friction touchpoint.

- **Every 4 weeks: a re-test.** A full re-assessment that closes the loop: it proves the previous training block worked (the number moves), and it writes the next block by identifying the now-weakest domain. This re-test is structured as an "exam" the user trains toward — a finish line that gives the training purpose, analogous to how a race date drives a couch-to-5k runner.

The four-week block targeting the weakest domain, ending in a re-test, then repeating, is the engine of the whole experience. Measurement on its own is episodic and forgettable; the loop turns measurement into a reason to train and training into visible progress.

---

## 6. The Movement Check-Up (the assessment)

The check-up uses established clinical movement tests that have published age-referenced norms, administered entirely by voice with the phone propped at roughly hip height and the user standing 2.5–3 metres back. No screen interaction is needed once it begins.

The core tests:

- **30-second chair stand** — the user stands up and sits down from a chair as many times as they can in 30 seconds. The camera counts the repetitions, times each one, and — critically — measures **how fast the person rises** (rise velocity), which is a proxy for **leg power**. Power (force produced quickly) declines faster with age than raw strength and is more predictive of functional decline; measuring it normally requires laboratory force plates, but it can be derived from rep timing with a camera for free. This is the headline metric.

- **Balance ladder** — timed single-leg and tandem stances, eyes open and then eyes closed, progressing in difficulty. The camera times the hold to the moment balance is lost and can estimate sway.

- **Timed Up and Go (TUG)** — the user rises from a chair, walks a few steps, turns, returns, and sits; the app times the whole task. A decades-old clinical measure of real-world mobility.

- **Shoulder flexion and forward-reach (hinge-reach)** — simple measured range-of-motion movements that give the mobility domain quantified substance.

The output is presented as **per-domain "ages"** — Strength/Power, Balance, Mobility — each compared to published norms, with the weakest domain highlighted and framed as the most improvable. Domain results lead; any single composite "movement age" figure is treated as secondary marketing language rather than a clinically meaningful number, and the product avoids false precision (results are ranges/bands, and any age band extrapolated beyond well-documented norm tables is labelled as an estimate).

The emotional hook of the check-up is the **asymmetry it surfaces**: a result like "your balance is 11 years older than you, and it's the most trainable thing here" is personal, slightly alarming, specific, and actionable — far more motivating than generic "you should exercise more."

---

## 7. The training experience

**Format:** voice-first, hands-free. The phone is propped against a wall; the user steps back and a spoken guide runs the entire session — it starts automatically when the user is framed, advances between exercises automatically, and speaks rest timers, so the user never has to touch the screen mid-workout.

**On-screen:** the user sees a clean **skeleton/line figure on a dark background that mirrors their movement** — never video of themselves. People in this demographic respond poorly to seeing themselves on camera while exercising; an abstract skeletal representation provides the sense of being "seen" and guided without the self-consciousness of a mirror.

**What the camera does during training (quietly):**
- Counts repetitions and times holds automatically, so the user never has to track anything.
- **Autoregulates effort:** when rep speed drops sharply near the end of a set (the reliable signal of genuine fatigue), the guide says something like "good, that's your set" rather than pushing to a fixed number. This adapts to good and bad days and addresses the injury-conscious user's fear of overdoing it alone.
- **Detects progression:** when a user performs an exercise quickly, smoothly, and through full range, the app recognizes the exercise is no longer challenging and advances them to a harder variation. (Failure to progress — doing the same easy routine forever — is one of the main reasons home exercise stops producing results, and it is something users systematically misjudge on their own.)
- **Stays silent unless highly confident.** It does not critique form rep-by-rep. It speaks only for high-value, high-certainty observations (e.g. a persistent left/right asymmetry, flagged once and calmly). Silence is what preserves trust.

**Exercise catalog:** roughly two dozen exercise "families," each with a ladder of regressions and progressions, all chosen to be reliably gradable by a single fixed camera (slow, in-place, in-plane movements). The domains:

- **Lower-body strength and power:** sit-to-stand variations (including a deliberately fast "power" version), supported and unsupported squats, step-ups and step-downs, hip hinges, heel raises, glute bridges.
- **Balance:** a progression from feet-together to tandem to single-leg to eyes-closed to head-turn and dual-task variations; weight shifts; short tandem walks; reaction-step drills.
- **Upper-body strength:** wall → incline → knee → full push-ups; overhead presses/reaches; rows and pull-aparts (with a resistance band); curls.
- **Mobility (measured where credible):** ankle dorsiflexion, hip extension, hamstring reach, thoracic extension, shoulder flexion, side bends, adductor work, and neck rotation. The emphasis is on *active* mobility (moving under control to end range), which both has better evidence for older adults and is more measurable than passive stretching. A short daily "morning mobility" routine is envisaged as a low-effort habit anchor.
- **Functional challenges:** periodic "boss-level" tasks like rising from the floor, timed step-ups, or loaded marches — high in psychological payoff and shareability.

A typical 20-minute session draws one item from several of these slots; a four-week block re-weights the slots toward the user's weakest assessed domain.

---

## 8. What the product actually achieves for the user (the utility)

Beyond a score, the product produces **decision-grade information** the user cannot get otherwise — each addressing a specific gap in self-perception:

1. **"Is this working?"** — It detects change too slow to feel. A beginner's earliest adaptations are neural and show up as increased *speed* of movement weeks before they show up as strength the person can feel. The app can honestly say "you stand up 18% faster than three weeks ago" at exactly the moment the user feels nothing and is tempted to quit.
2. **"How hard should I go today?"** — Autoregulation via rep-speed tells the user when to stop, which is precisely the judgment an injury-conscious novice lacks and fears getting wrong.
3. **"Am I ready for something harder?"** — Progression detection prevents the stagnation that kills home-exercise results.
4. **"Is something specifically wrong?"** — High-confidence, low-frequency flags for things a person genuinely cannot self-observe: a strength asymmetry between sides, a balance result that is an outlier for their age.
5. **"What do I tell my doctor?"** — Over time the app accumulates an objective record of the person's functional movement that can be brought to a GP appointment, making a short consultation far more useful.

The felt outcomes follow a timeline: visible measured improvement at ~4 weeks (the retention-critical moment), functional real-life wins at ~3 months (stairs stop hurting, getting off the floor unaided), and at a year a longitudinal record plus the deeper realization that the decline the person noticed was reversible. That last point — **confidence and a restored sense of agency over one's own aging** — is the real product.

---

## 9. Equipment and friction

**Equipment is deliberately minimal.** A user can start and continue for weeks with only things they already own: a sturdy chair, a wall, the floor, a bottom stair, and household items for light load (water bottles, a loaded backpack). The only purchase ever required is an inexpensive **resistance band** (~£10–15), and it is not needed until the second training block at the earliest. Every exercise has a zero-equipment regression, so a missing item causes a substitution rather than blocking the session. A physical "welcome kit" (band, door anchor, and a folding phone stand) shipped to subscribers is envisaged both to remove friction and to act as a commitment device and tangible brand touchpoint.

**The real friction is not equipment — it is setup.** Three points matter:
- **Phone propping:** getting the phone positioned and the body framed, every session, is the recurring friction. Mitigations include a "placement memory" flow ("stand where you stood last time — you're framed"), tolerant framing, and audio-first design that works even when framing is imperfect.
- **Sightline/space:** the app needs a clear ~3-metre line of sight with the whole body in frame, which is a real constraint in some homes.
- **Lighting:** dim domestic evening lighting degrades camera detection before it looks dark to a human; a friendly pre-flight check ("turn on the main light") addresses this.

---

## 10. Progression and ceilings

Whether a user can "out-grow" the app varies sharply by domain:
- **Balance:** effectively no ceiling — the ladder extends to eyes-closed, head-turn, and dual-task variations almost no one in the demographic exhausts.
- **Power:** no practical ceiling, because the camera enables a *velocity* progression axis — chasing a faster rise on the same movement is a legitimate, equipment-free training target measurable indefinitely.
- **Lower-body strength:** a ceiling around 18–30 months for the typical novice user, after which external load (a loaded backpack, heavier bands) is needed.
- **Upper-body pulling:** the first domain to cap (band resistance is limited).
- **Mobility and the assessment itself:** never really outgrown.

Reaching the ceiling is treated as a **success state**, not churn: a user who has genuinely outgrown home training is offered a graceful "graduation" (e.g. a transition to gym-based training), which converts a silent cancellation into a proud, shareable ending — and many such users stay anyway for the ongoing quarterly assessment.

---

## 11. Product-market-fit thesis

**Strengths of the thesis:**
- A sharp, genuinely novel insight (nothing measures the strength/balance that predict aging; the camera can).
- Strong, freshly-created cultural demand (the longevity wave) with no existing way to satisfy the specific want.
- A top-of-funnel hook ("find out how well you're really aging" / "your balance is 11 years older than you") that is personal, alarming, shareable, and concrete.
- A retention mechanism — the measure→train→re-test loop with visible proof of progress — that nothing in the category currently offers.
- A demographic with disposable income and rising health motivation.

**The central risk: adherence.** Sustaining home exercise is one of the worst base rates in all of consumer health; drop-off is severe even when a clinician is involved. The thesis bets that measurement-driven proof of progress, plus the block/exam structure, creates and sustains the habit better than a plain workout app. The honest caveat is that measurement is a well-evidenced *amplifier* of an existing habit but an unproven *creator* of a new one (the unused fitness wearable in a drawer is the cautionary case). This is the single most important assumption to validate, and it is cheaply testable: put ~10 people aged 50–70 through a three-week version (the scoring can be done by a human behind the scenes) and watch whether they keep doing the sessions in week three without being chased.

**A secondary risk: sociality.** Some of this demographic may want exercise to be social (group classes, a human trainer), in which case a solo, private, at-home architecture would be solving the wrong problem; this is worth probing directly with target users.

**Realistic overall read:** a strong, real opportunity with one large unpriced risk sitting exactly where the revenue is — and with fast, inexpensive ways to find out whether that risk is fatal before committing heavily.

---

## 12. Competitive landscape

The category exists, but is crowded only at the *content* layer; the specific cell this product occupies is empty.

- **Class/content apps for older adults** (e.g. Bold, and a long tail of 50+ and women-over-50 fitness apps): they have the audience and clinically-informed programs but **no camera and no measurement** — they are video libraries. Notably, several have gravitated away from direct-to-consumer toward distribution through health insurers, because acquiring older consumers via paid ads is hard in markets where an insurance channel exists.
- **Live human-coached programs** (e.g. Vivo-style small-group strength training for 55+, or 1:1 remote coaching services): they achieve real accountability and outcomes and command real willingness to pay, but rely on human trainers, so price points are high and margins/scaling are constrained.
- **Mass-market quiz-funnel fitness brands** (e.g. BetterMe, Reverse Health): they are extremely effective at acquiring the 45–65 audience with content (chair yoga, wall pilates) but do **no sensing** at all.
- **Clinical/provider camera-measurement tools** (e.g. Exer, OneStep): they have real camera-based movement assessment but sell to clinics and healthcare providers, **not to consumers**.
- **Wearables** (Apple Watch, Oura, Whoop, etc.): they own cardio, sleep, and recovery and passively track some gait metrics, but **cannot measure strength, balance, or power**, and do not provide a training loop.
- **Movement-AI SDK vendors** (e.g. Sency): they sell camera motion-tracking as a B2B SDK — relevant because it means the underlying sensing technology is becoming a commodity others can buy, so the durable advantage must come from elsewhere.

**The empty cell is: self-buyer aged ~50+ × camera-based measurement × longevity-oriented home training.** No one occupies it. Demand for the surrounding category is proven by the crowd of non-sensing competitors; the unique combination is unclaimed.

**Defensibility** therefore does not rest on the computer vision (increasingly a commodity). It rests on: the longitudinal score history a user accumulates (switching cost grows over time), the brand position as "the app that measures how you're aging," and the habit loop. A content company cannot easily add credible measurement, and a clinical-workflow company is not built to chase the consumer brand.

---

## 13. Scientific basis

The product stands on established, published science:
- The clinical tests it uses (30-second/5-times chair stand, single-leg stance, Timed Up and Go, sit-and-reach, etc.) are standard functional assessments with **published age-referenced norms** (e.g. the Rikli & Jones Senior Fitness Test battery; Bohannon reference values for balance and gait; widely published TUG norms).
- **Leg power / rise velocity** is well-supported in the literature as a more age-sensitive and function-predictive quality than raw strength, and chair-stand speed is an accepted consumer-accessible proxy for it.
- **Camera/markerless scoring of these tests has been validated against expert human scoring** in peer-reviewed work (2025–2026), with strong agreement (intraclass correlations roughly 0.81–0.99 in studies of older adults).
- A 2025 **randomized controlled trial** tested essentially this concept — a smartphone-based motor-fitness assessment generating individually tailored exercise programs for older adults targeting balance, strength, and flexibility — and found it effective.
- The training content aligns with established, evidence-based older-adult programs (e.g. Otago and similar strength-and-balance protocols shown to reduce falls, and WHO guidance recommending strength and balance work multiple times per week).

The product avoids medical claims and stays in wellness/fitness language; the validated science is used to establish credibility, not to position the app as a medical or diagnostic device.

---

## 14. Business model (hypotheses)

Two candidate shapes, both to be validated:
- **Subscription** (roughly £10–15/month, or an annual plan bundled with the welcome kit). The risk is that home-exercise churn makes this a leaky bucket against customer-acquisition costs in an ad auction dominated by sophisticated funnel marketers.
- **A finite "12-week course"** sold as a one-off (a "movement MOT" framing), with an ongoing subscription offered only to people who complete it. This aligns the revenue model with the churn curve — selling recurring revenue mainly to users who have already demonstrated they will stick — at the cost of the longitudinal-history story for one-off buyers.

Acquisition is expected to be tested via paid social (the "find your movement age" hook is the asset to validate), with the adult-child "test your parents" angle as a secondary, lower-cost channel. Pricing and acquisition cost are explicitly unproven and are core things to measure early.

---

## 15. Technical approach and feasibility

The app runs **on-device pose estimation** (a MediaPipe-class body-landmark model) through the phone's camera; no video needs to leave the device, which is also a privacy selling point. The entire catalog of assessments and exercises reduces to a small number of measurement patterns: counting repetition cycles via joint angles, timing holds with a termination condition, measuring movement velocity, capturing peak range of motion, and timing multi-phase tasks. These are all things 2D pose estimation does reliably for slow, deliberate, in-plane movements.

Known technical constraints shape the design: 2D pose cannot measure rotation (so movements are kept in the side-on or front-on plane); detection degrades with poor lighting and at the edges of the frame; and — most importantly for a product whose value is a *trend over time* — measurements must be normalized to the person's body proportions rather than raw pixels, so that varying phone distance and angle between sessions does not corrupt the longitudinal signal. The reliability of the velocity measurement in real, uncontrolled home conditions is the key technical question to settle early, because the proof-of-progress moment depends on it.

The overall technical risk is low: nothing requires a research breakthrough, and the hardest parts are engineering robustness in real homes rather than novel algorithms.

---

## 16. What the product deliberately does not do

- It does **not** judge exercise form rep-by-rep (unreliable, and trust-destroying when wrong).
- It makes **no medical or diagnostic claims** — it uses wellness language ("movement age," "strength and balance," "age well"), never clinical framing like "diagnosis," "treatment," or "fall-risk."
- It does **not** show users video of themselves (skeleton-on-dark only).
- It does **not** do passive/background monitoring.
- It avoids **gamification** (streak-shaming, badges, leaderboards, social feeds), which this demographic does not respond well to; motivation comes from evidence and visible progress.
- It restricts its exercise catalog to movements the camera can grade reliably, rather than chasing content breadth.

The unifying discipline is: measure where the camera is genuinely reliable, and stay silent everywhere else.

---

## 17. Aim and vision

The near-term aim is to own the unclaimed position of the trusted consumer instrument for physical aging — the app a health-conscious person in midlife opens to find out, and then improve, how well their body is actually aging, with the credibility of validated clinical measures behind a warm, non-clinical consumer experience.

The longer-term vision is a longitudinal "movement record" that becomes more valuable the longer a person uses it — a personal dataset of strength, power, balance, and mobility over years that no wearable can replicate, anchoring an ongoing relationship across midlife and beyond, and bridging, where useful, to healthcare professionals via objective functional data the user owns.

The overarching thesis throughout: the camera is the sensor that unlocks a category wearables cannot reach, and the durable product is not the measurement itself but the sustained behavior — and the confidence — that the measurement makes possible.
