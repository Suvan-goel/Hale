# Pearl — product and business thesis

This document describes the current Pearl idea. Earlier general-adult longevity and
“movement age” concepts are superseded; [AGENTS.md](AGENTS.md) is the binding product
contract when wording differs.

## 1. Concept in one line

Pearl is a private 12-week strength programme for women in perimenopause or early
postmenopause that uses four phone-camera Movement Check-Ups to set the right starting point,
prioritise Strength or Balance, and show whether her own results are changing—while tracking
Everyday Clarity as a separate personal pattern.

## 2. Target customer

Pearl is designed for women roughly 45–60 who:

- understand that strength matters through the menopause transition;
- are not currently training consistently;
- want to begin privately at home rather than in a gym;
- worry about doing too much, getting hurt, or choosing the wrong exercises;
- are motivated by evidence and structure more than performance culture; and
- may also be experiencing brain fog, word-finding difficulty, poor concentration, mental
  fatigue, or everyday lapses.

Pearl is not positioned as a programme for all adults, men, frail older people, regular gym
lifters, or people seeking medical diagnosis or treatment.

## 3. The customer job

Pearl answers three questions:

1. **Where am I starting?** A short private check-up creates Strength and Balance evidence.
2. **What should I work on?** The accepted check-up chooses a Strength, Balance, or Balanced
   emphasis for the next phase.
3. **Is it working?** The same check-up repeats after four, eight, and twelve weeks so change
   can be shown only when the protocol and evidence are genuinely comparable.

The emotional outcome is not a high score. It is confidence that she can begin safely, keep a
routine, and see evidence that her effort is going somewhere.

## 4. The twelve-week loop

The programme has one visible journey:

- **Foundations, weeks 1–4:** begin conservatively, learn the movement patterns, establish a
  routine, and complete the first retest.
- **Build, weeks 5–8:** progress volume or exercise level using reported effort and completed
  work, then retest with the identical protocol.
- **Progress, weeks 9–12:** consolidate the habit and finish with the fourth official
  check-up.

Three sessions are planned each week. Two is explicitly successful. Check-up cadence is
calendar-based rather than unlocked by perfect adherence, so missing a session does not turn
the programme into punishment.

Every accepted check-up creates an immutable phase prescription. Strength and Balance are the
only physical prescription inputs. A check-up can move the next phase's emphasis, but one
noisy day never silently demotes established exercise levels.

## 5. The Movement Check-Up

The official MVP protocol uses the frozen compatibility identifier
`pearl_monthly_strength_balance_v1`, but its product cadence is baseline, week 4, week 8, and
week 12:

1. a fixed one-minute warm-up that produces no score;
2. one anchored-side, eyes-open one-leg balance hold; and
3. a 30-second chair stand, with maximal effort last.

The phone is propped around hip height. MediaPipe pose estimation runs on-device. Users see a
clean figure rather than camera video; footage is never shown, stored, or uploaded.

The repeated protocol is deliberately narrow. A longer historical movement battery exists in
the engineering and reference layers, but it is not the default twelve-week journey. A
shorter, partial, or different check-up is never called comparable progress.

Population reference information is subordinate to the user's own trajectory and shown only
when the source and claim policy permit it. Pearl does not produce a composite movement age or
body age.

## 6. Everyday Clarity

Brain fog is an important part of the menopause experience and can be a powerful reason to
try Pearl. The MVP treats it carefully:

- **Everyday Clarity:** an optional five-item, two-week-recall self-report covering
  word-finding, purpose lapses, concentration, mental fatigue, and everyday tracking.
- **Context:** optional sleep and menopause-symptom load collected alongside the check-in.
- **Steadiness while thinking:** a matched solo/rest/dual balance instrument implemented and
  tested at the logic layer, but not mounted until real-device and target-user validity gates
  pass.
- **Verbal fluency:** research/dev only; not an MVP surface.

Each series stands alone and is compared only with that woman's own history. Pearl does not
combine them into a Clarity score, use them to prescribe exercise, diagnose impairment,
determine what menopause caused, or claim that training caused a cognitive change.

The product language hierarchy is: **Pearl measures Strength and Balance and tracks Everyday
Clarity.**

## 7. Training experience

Daily training is voice-paced and does not use the camera. Pearl speaks the setup and waits
until the user says she is ready or taps the equivalent control. The user can say done, skip,
repeat, pause, or resume; every command has complete tap parity. The microphone listens only
inside bounded command windows, and no audio or transcript is retained.

The programme develops five foundational patterns—squat, hinge, push, pull, and core—with a
quiet power/balance finisher. It starts conservatively, adapts for relevant safety and comfort
answers, and progresses from completion plus reported effort. The camera never judges form.

The first exposure to an exercise includes a short visual demonstration. Later exposures can
replay it on request. Every pattern has a zero-equipment starting option; missing equipment
causes a substitution rather than a blocked session.

## 8. Why the product can be different

Menopause fitness content is abundant. Pearl should not try to win by having more videos.
Its differentiation is the closed evidence loop:

> Measure a trustworthy starting point → train at home → repeat the same instrument → adapt
> the next phase.

The computer vision itself is not the moat. Durable value would come from trusted measurement
protocols, repeatable real-home performance, a brand associated with honest proof, accumulated
personal history, and evidence that the loop improves twelve-week adherence.

## 9. Product-market-fit thesis

The thesis has four parts:

1. Menopause creates acute, searchable demand around strength, confidence, body change, and
   brain fog.
2. Many women understand the advice to strength-train but do not know how to start safely or
   whether a home programme is working.
3. A finite twelve-week journey is easier to understand and purchase than an endless workout
   subscription.
4. Objective retests and personal Clarity tracking can make invisible change visible at the
   moment motivation would otherwise fade.

The central risk remains adherence. Measurement may strengthen an existing habit without
creating one. Pearl must validate that the check-up and phase structure cause women to start,
complete at least two sessions a week, return for the week-4 retest, and continue to week 12.

Clarity is both an opportunity and a risk. It may be the strongest acquisition hook, but the
promise must attract women who value tracking alongside physical training—not imply diagnosis
or a guaranteed remedy for brain fog.

## 10. Business model hypotheses

The primary hypothesis is a paid twelve-week programme, potentially followed by an optional
maintenance product for women who complete it. This aligns payment with the visible journey
and avoids depending on indefinite subscription intent before the user has experienced proof.

Pricing, willingness to pay, paid-social acquisition cost, check-up completion, week-4 and
week-12 retention, referrals, and maintenance demand are unproven and must be tested with real
customers. Waitlist conversion alone is not product-market fit.

## 11. Technical feasibility and release gates

The core pose tasks—subject validity, timing, repetition counting, hold termination, and
body-normalised velocity—are feasible without a research breakthrough. The difficult work is
repeatability in real homes: camera placement, chair differences, lighting, occlusion,
tracking interruption, and between-session setup variance.

Release requires real-human evidence that typical meaningful change exceeds measurement
noise. The matched Clarity task separately requires camera/microphone coexistence, reliable
response detection at room distance, target-user usability, test-retest analysis, and
professional protocol review.

## 12. Non-goals

Pearl does not provide medical diagnosis or treatment, measure hormones or bone density,
estimate fracture or dementia risk, judge exercise form, show self-view video, create a
composite age score, provide a content-library experience, or optimise for a general-adult
longevity audience.

The MVP is deliberately one audience, one twelve-week journey, one daily training surface,
one comparable Strength-and-Balance protocol, and separate observational Clarity tracking.

## 13. Vision

Near term, Pearl should become the most trusted way for a woman in the menopause transition
to begin strength training privately and prove to herself that the work is changing something
real.

Longer term, Pearl can become a personal functional-health record across midlife: objective
Strength and Balance history, carefully separated lived-experience signals, and a programme
that continually translates evidence into the next useful action. Expansion beyond the
menopause wedge is a future strategic decision, not the current product definition.
