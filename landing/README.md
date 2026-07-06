# Elegant — waitlist landing page

Cold-traffic landing page for the Meta ads test. Single job: waitlist email
capture. Vite + React + TypeScript + Tailwind CSS 4, no other runtime
dependencies, deployable to Vercel as a static site.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build
```

## Deploy to Vercel

1. `vercel` from this directory (or import the repo in the Vercel dashboard and
   set the **Root Directory** to `landing/`).
2. Framework preset: **Vite**. Build command `npm run build`, output `dist`.
3. `vercel.json` already rewrites all paths to `index.html` so `/privacy`,
   `/terms` and pasted deep links work.

## Configuration — do these before sending traffic

| What | Where |
|---|---|
| **Meta Pixel ID** | `PIXEL_ID` constant at the top of [`src/lib/pixel.ts`](src/lib/pixel.ts). Digits only. Until it's set, the pixel is a no-op. |
| **Form endpoint** | `LEAD_ENDPOINT` constant at the top of [`src/lib/leads.ts`](src/lib/leads.ts). All submissions (waitlist **and** the thank-you micro-survey) POST JSON there via the single `submitLead()` function. While it's still the placeholder, submissions succeed locally and log to the console so the flow can be tested. A commented-out Supabase implementation (table SQL + insert) is in the same file. |
| **Contact email** | `CONTACT_EMAIL` in [`src/config.ts`](src/config.ts) — used in the footer, the legal pages, and the founding-chat mailto. |
| **Legal copy** | [`src/pages/Legal.tsx`](src/pages/Legal.tsx) is sensible placeholder text — have it reviewed before a real launch. |

### Lead payload

```json
{
  "kind": "lead" | "survey",
  "email": "…",
  "submittedAt": "ISO 8601",
  "utm": { "utm_source": "…", "utm_medium": "…", "…": "…", "fbclid": "…" },
  "answer": "micro-survey text (kind=survey only)"
}
```

UTM parameters and `fbclid` are captured from the URL on first load, kept in
`sessionStorage`, and submitted with every payload.

## Analytics & consent

- The Meta Pixel loads **only after Accept** on the consent banner
  (`localStorage` key `elegant:consent`). `PageView` fires on load-after-accept,
  `Lead` fires once on successful waitlist submit. Standard events only.
- Declining consent changes nothing about the page or the form.

## Headline options considered

1. **"Track strength. Track clarity. *Train what changes.*"** — implemented
   after the cognitive/Clarity reframe. Clarity is the emotional doorway,
   strength training is the intervention engine, and measurement is the proof.
2. "You don't need another workout app. You need proof." — strong for
   tried-things-already category fatigue; useful as retargeting or section copy.
3. "Strength through menopause. Measured." — the original launch headline;
   cleaner and more product-led, worth A/B testing against #1 once traffic
   flows.
4. "Menopause changes your strength. See exactly where you stand." — more
   explanatory; the first clause spends the opening beat on the problem rather
   than the promise.
5. "The only menopause fitness app that proves it's working." — the hardest
   differentiation claim; strong for retargeting, but on cold traffic it names
   the category before the visitor knows she's in the market. (It's used as the
   section-4 heading instead.)

## Design system

**Palette**

| Name | Hex | Role |
|---|---|---|
| Ink | `#1A2420` | near-black evergreen — hero/differentiator/footer, body text |
| Bone | `#F3EFE7` | warm paper — page background, text on dark |
| Paper | `#FBF8F2` | raised light surface — cards, phone screen |
| Pine | `#2E4638` | deep green — final CTA band, positive marks |
| Brass | `#A67C3D` | burnished accent — the dial, italics, focus highlights |

(`Sage #96A292` exists as a support tint for decoration only — it fails
contrast as a data colour and is never used for marks or text.)

**Type pairing:** [Fraunces](https://fonts.google.com/specimen/Fraunces)
(display serif, optical sizing — poise with visible bite) +
[Archivo](https://fonts.google.com/specimen/Archivo) (grotesk body/UI with a
sports-science feel). Loaded from Google Fonts with `display=swap`.

**Signature element:** the 240° score dial — hero phone mockup (built entirely
in code), echoed as the mini re-test dials in section 4 and as faint arc
motifs behind the hero and final CTA.

## Claims discipline

Copy avoids prevention/treatment/diagnosis claims, bone-density and
fracture-risk language, invented statistics, and personal-attribute openers.
If you edit copy, keep to: "track functional strength/balance/mobility",
"track personal Clarity signals", "see whether training is working", "strength
training is widely recommended during menopause".

**Brain fog rules (2026-07-06 cognitive reframe):** marketing may say "brain
fog" (in-product the dimension is "Clarity" — the mockup uses that). Allowed:
"track/measure your fog", "see how it changes as you train", mechanism-via-
mediators ("exercise supports sleep, mood and symptom load — the known drivers
of menopausal brain fog"). Banned: fights/treats/cures/reverses fog, any
guaranteed cognitive outcome, any diagnostic or rule-out implication (never
"it's menopause, not dementia"), disease-risk scare copy, dementia/Alzheimer's
language anywhere. Cognitive results are always framed against the visitor's
own baseline — never age charts or population comparisons (movement scores ARE
age-benchmarked; keep that distinction when editing step 02 / FAQ copy). The
privacy promise now covers audio: "video and audio never leave your phone" —
this commits speech scoring to on-device processing.

## Performance notes

No images (all visuals are inline SVG/CSS), no animation or UI libraries,
~70 KB gzipped JS. The LCP element is the hero headline text. Scroll reveals
are IntersectionObserver + CSS and are disabled under `prefers-reduced-motion`.

## Before launch checklist

- [ ] Set `PIXEL_ID`
- [ ] Point `LEAD_ENDPOINT` at a real backend (or swap in the Supabase variant)
- [ ] Replace `CONTACT_EMAIL`
- [ ] Review legal pages
- [ ] Add an `og:image` (there is none yet; the meta tags are in `index.html`)
