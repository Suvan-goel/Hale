# Hale Landing Page Design Audit

Date: 2026-06-21

## Sources Inspected

- `src/theme/index.ts`: canonical active colour, typography, spacing, radius, shadow, and component recipes.
- `src/components/HeaderLogo.tsx`: logo mark source is `assets/hale-logo-mark.png`.
- `src/navigation/TabBar.tsx`: primary app tab order and bottom-tab visual treatment.
- `src/navigation/icons.tsx`: current compact rounded icon style.
- `src/screens/WelcomeScreen.tsx`, `src/screens/TodayScreen.tsx`, `src/screens/PlanScreen.tsx`, `src/screens/ProgressScreen.tsx`: current product copy, card treatment, imagery use, privacy language, and product IA.
- `app.json`: app name, icon sources, light-only system style, and camera privacy copy.
- `README.md`, `.env.example`, `src/lib/supabase.ts`: existing package manager, scripts, Supabase environment conventions, and setup.

## Logo And Assets

- Logo mark: `assets/hale-logo-mark.png`, copied unchanged to `website/public/brand/hale-logo-mark.png`.
- App icon: `assets/ios-icon.png`, copied unchanged to `website/public/brand/hale-app-icon.png`.
- Favicon: `assets/favicon.png`, copied unchanged to `website/public/favicon.png`.
- Supporting images copied from current app assets:
  - `assets/images/hale-welcome-hero-v3.png`
  - `assets/images/hale-camera-setup-hero-v4.png`
  - `assets/images/hale-first-block-hero-v4.png`
  - `assets/images/progress-hero-botanical.png`
  - `assets/images/hale-todays-session-card.png`

No current repository screenshots of Today, Plan, Progress, or Check-Up screens were found. The landing page therefore uses accurate web-native product UI examples styled from the current app, plus real current app imagery, rather than presenting fabricated screenshots.

## Colour Tokens Copied

Active tokens from `src/theme/index.ts`:

- Canvas / `bgBase`: `#F9F5EF`
- Surface / card: `#FFFDF9`
- Primary text: `#111412`
- Secondary text: `#68706A`
- Tertiary text: `#8A908A`
- Primary accent / inky green: `#414C34`
- Border: `#E4E0D6`
- Strong border: `#D8D3C8`
- Brass accent: `#A98243`
- Soft gold fill: `#F4EFE4`
- Error: `#B85C50`
- Shadow: `rgba(17,20,18,0.05)`, with app card recipes using centered, restrained halo shadows.

## Typography

Current app typography:

- Sans: `Inter_400Regular`, `Inter_500Medium`
- Serif available: `Fraunces_400Regular`, `Fraunces_500Medium`
- App body size: 17px with 27px line height.
- App button size: 16px, medium weight.
- Letter spacing: `0` throughout.

The website copies the legally bundled font files from the existing Expo font packages into `website/public/fonts` and uses `Inter` for the main hierarchy, with restrained Fraunces accents where the app already allows serif.

## Visual Principles

- Light warm-stone canvas with soft-ivory surfaces.
- Inky green primary actions, no neon or generic SaaS gradients.
- Border-light cards with small centered shadows.
- Mature, domestic, premium imagery rather than gym or clinical imagery.
- Large readable copy, generous spacing, and calm repetition.
- Camera privacy is expressed as skeleton/no mirror/no form judging.
- App IA order is preserved as Today -> Plan -> Progress -> Explore.

## Fallback Decisions

- No approved public pricing was found. The page renders beta discount messaging without numeric prices until both beta and regular prices are configured.
- No approved App Store, TestFlight, Google Play, analytics, privacy, terms, or waitlist URLs were found. Store links render only when valid URLs are configured.
- Existing Supabase is mobile-auth/sync oriented, not a waitlist. The website adds a new server-side beta signup route with a documented Supabase migration and a local development/test fallback.
