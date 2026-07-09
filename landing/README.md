# Elegant — waitlist landing page

Cold-traffic landing page for the Meta ads test. Single job: waitlist email
capture. This is the only active marketing site; the old Pearl website app has
been retired. Vite + React + TypeScript + Tailwind CSS 4, no other runtime
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
| **Meta Pixel ID** | `VITE_META_PIXEL_ID` environment variable. Digits only. Until it is set, the pixel is a no-op. |
| **Form endpoint** | `VITE_LEAD_ENDPOINT` environment variable. Waitlist submissions POST JSON via `submitLead()`. Missing/placeholder endpoints log locally in dev but fail in production so ad traffic cannot silently lose leads. |
| **Contact email** | Defaults to `suvangoel@gmail.com`; override with `VITE_CONTACT_EMAIL` if needed. Used in the footer, legal pages, and thank-you confirmation. |
| **Legal copy** | [`src/pages/Legal.tsx`](src/pages/Legal.tsx) now contains formal draft Privacy and Terms copy. It should still be owner-reviewed before real paid traffic. |

### Lead payload

```json
{
  "kind": "lead",
  "email": "…",
  "submittedAt": "ISO 8601",
  "utm": { "utm_source": "…", "utm_medium": "…", "…": "…", "fbclid": "…" }
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

1. **"Measure what menopause changes. *Train what you can change.*"** —
   implemented (restructure pass). Names the audience, carries the
   measure→train loop in two calm beats, and the changes/change echo pairs
   with the why-strength heading "Muscle is the part you can train." The
   eyebrow above lists the four dimensions (Strength · Balance · Mobility ·
   Clarity).
2. "Track strength. Track clarity. Train what changes." — the tracker-led
   variant from the Clarity reframe; clear, but three imperatives in a row
   read hurried.
3. "You don't need another workout app. You need proof." — strong for
   tried-things-already category fatigue; useful as retargeting or section copy.
4. "Strength through menopause. Measured." — the original launch headline;
   cleaner and more product-led, worth A/B testing against #1 once traffic
   flows.
5. "Menopause changes your strength. See exactly where you stand." — more
   explanatory; the first clause spends the opening beat on the problem rather
   than the promise.
6. "The only menopause fitness app that proves it's working." — the hardest
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
fog" sparingly, but in-product and result copy uses "Clarity". Allowed:
"track Clarity patterns", "see how your own pattern changes", and conservative
mechanism language ("exercise can support sleep and mood, which many people
notice alongside foggier days"). Banned: fights/treats/cures/reverses fog, any
guaranteed cognitive outcome, any diagnostic or rule-out implication (never
"it's menopause, not dementia"), disease-risk scare copy, dementia/Alzheimer's
language anywhere. Cognitive results are always framed against the visitor's
own baseline — never age charts or population comparisons (movement scores ARE
age-benchmarked; keep that distinction when editing step 02 / FAQ copy). The
privacy promise now covers audio: "video and audio never leave your phone" —
this commits speech scoring to on-device processing.

## Performance notes

Three optimized JPEGs plus code-built UI/SVG visuals; no animation or UI
libraries. Scroll reveals are IntersectionObserver + CSS and are disabled under
`prefers-reduced-motion`. The Open Graph image lives at
`public/og/elegant-og.jpg`.

## Before launch checklist

- [ ] Set `VITE_META_PIXEL_ID`
- [ ] Point `VITE_LEAD_ENDPOINT` at a real backend
- [ ] Review legal pages and confirm `suvangoel@gmail.com` is the final public contact
- [ ] Confirm final public domain so social-card URLs can be tested in Meta's Sharing Debugger
