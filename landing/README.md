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
| Lead backend (default) | `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`; inserts into `public.landing_leads` (migration `supabase/migrations/20260722000100_landing_leads.sql`, RLS insert-only, duplicates ignored). |
| Lead backend (alternative) | `VITE_LEAD_ENDPOINT`; waitlist submissions are POSTed as JSON. Takes precedence when set. |
| Meta Pixel ID | `VITE_META_PIXEL_ID`; digits only. Without it, the pixel is a no-op. |
| Site origin | `VITE_SITE_URL`; production origin used to emit absolute `og:image`/`og:url`/canonical tags at build time. Required for the Facebook share card. |
| Contact email | `VITE_CONTACT_EMAIL`, defaulting to `suvangoel@gmail.com`. |
| Legal copy | `src/pages/Legal.tsx`; owner review is required before paid traffic. |

The Meta Pixel loads only after consent. The consent choice is stored under
`pearl:consent` and can be reopened from the footer's "Cookie preferences";
campaign attribution is stored under `pearl:utm` for the session. `PageView`
fires after acceptance and `Lead` after a successful form submission, which
lands on `/thanks`. The form carries a honeypot field; trapped submissions
show the normal thank-you page but store nothing and fire no event.

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

The page uses three optimized JPEGs plus code-built UI/SVG visuals. Fraunces
and Inter are self-hosted from `public/fonts/` (OFL licensed; `src/fonts.css`)
— no Google Fonts connection. Scroll reveals use IntersectionObserver and
respect `prefers-reduced-motion`. The Open Graph image is
`public/og/pearl-og.jpg`.

## Before launch

- [ ] Apply the `landing_leads` migration to the Supabase project
      (`supabase db push` from the repo root) and set `VITE_SUPABASE_URL` +
      `VITE_SUPABASE_PUBLISHABLE_KEY` in Vercel.
- [ ] Create the pixel in Meta Events Manager and set `VITE_META_PIXEL_ID`.
- [ ] Deploy on the production domain and set `VITE_SITE_URL` to it.
- [ ] Review legal pages (controller identity, provider list, dates) and
      confirm the public contact email.
- [ ] Submit a real test lead end to end; confirm the row in Supabase and the
      `Lead` event in Meta Test Events.
- [ ] Test the final social card and domain in Meta's Sharing Debugger.
