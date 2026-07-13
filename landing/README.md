# Pearl waitlist landing page

Cold-traffic waitlist page for Pearl: a private 12-week home strength programme
for women roughly 45–60 who are navigating perimenopause or early
postmenopause. Vite + React + TypeScript + Tailwind CSS 4; deployable to Vercel
as a static site.

## Product framing this page must preserve

- Pearl is a structured 12-week journey: Foundations, Build and Progress.
- Training is three short, voice-paced, camera-free home sessions per week.
- The camera is used only at four comparable check-ups: baseline, week 4,
  week 8 and week 12.
- The fixed MVP check-up is an unmeasured warm-up, one-leg balance and a
  30-second chair stand. It measures Strength and Balance only.
- Results select a Strength focus, Balance focus or Balanced plan.
- Everyday Clarity is an optional five-question self-report about how thinking
  felt. It stays separate from movement results and never changes the plan.
- Pearl makes no diagnosis, menopause-causality claim or promised cognitive
  outcome. It does not present a movement age, body age or combined score.

Do not market Mobility, spoken cognitive tasks, microphone scoring, a broad
general-longevity audience or daily camera coaching as current MVP features.

## Run locally

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Deploy to Vercel

1. Run `vercel` here, or set the Vercel project root to `landing/`.
2. Use the Vite preset, `npm run build`, and output directory `dist`.
3. `vercel.json` rewrites deep links such as `/privacy` and `/terms` to the app.

## Configuration

| What | Where |
|---|---|
| Meta Pixel ID | `VITE_META_PIXEL_ID`; digits only. Without it, the pixel is a no-op. |
| Form endpoint | `VITE_LEAD_ENDPOINT`; waitlist submissions are POSTed as JSON. |
| Contact email | `VITE_CONTACT_EMAIL`, defaulting to `suvangoel@gmail.com`. |
| Legal copy | `src/pages/Legal.tsx`; owner review is required before paid traffic. |

The Meta Pixel loads only after consent. The consent choice is stored under
`pearl:consent`; campaign attribution is stored under `pearl:utm` for the
session. `PageView` fires after acceptance and `Lead` after a successful form
submission.

## Claims and privacy discipline

Allowed language includes “measure Strength and Balance,” “track Everyday
Clarity against your own pattern,” and “see what changes across 12 weeks.” Do
not say Pearl treats, prevents or reverses menopause symptoms or brain fog. Do
not imply that the optional check-in objectively measures cognition or proves
why a day felt foggy.

The check-up camera is a measuring instrument. Pearl never shows or stores
self-view video. Do not promise microphone or speech processing: neither is in
the mounted MVP journey.

## Assets and performance

The page uses three optimized JPEGs plus code-built UI/SVG visuals. Scroll
reveals use IntersectionObserver and respect `prefers-reduced-motion`. The Open
Graph image is `public/og/pearl-og.jpg`.

## Before launch

- [ ] Set `VITE_META_PIXEL_ID`.
- [ ] Point `VITE_LEAD_ENDPOINT` to the real waitlist backend.
- [ ] Review legal pages and confirm the public contact email.
- [ ] Test the final social card and domain in Meta's Sharing Debugger.
