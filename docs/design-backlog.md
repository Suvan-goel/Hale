# Design backlog

## Programme v2 onboarding + shell — visual design pass (scheduled: after engine promotion, before beta)

**Founder on-device finding (2026-07-06):** the programme-v2 flow is
structurally sound but visually flat. All onboarding screens are very
simplistic and boring — much less interesting and polished than the previous
version's onboarding screens. The generic config-driven renderer prioritised
correctness and copy-layer discipline over visual craft; that trade was right
for the build phase and wrong to ship.

**Design-pass brief:**
- Warm, calm, spacious, grown-up. Confident and unfussy.
- Explicitly NOT: neon fitness-app aggression; condescending pastel
  "wellness for older ladies".
- Work within the existing token system (`src/theme` — warm-stone + inky-green
  palette, Fraunces/Inter); no screen hardcodes colour.
- Surfaces in scope: ProgrammeOnboardingScreen (all steps), placement reveal
  (celebration, never a scorecard), expectation/CTA screen,
  ProgrammeSessionScreen runner, ProgrammeV2Root prompt cards
  (gateway teach, re-offers, band/doming), session-done moment.
- Copy pass (brand voice) runs alongside; all strings already live in the
  content layer so design + copy never touch flow logic.
