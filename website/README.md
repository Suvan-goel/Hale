# Hale Website

Production landing page for Hale beta access. The website is intentionally isolated from the Expo mobile app while reusing the app's approved brand tokens, logo, imagery, and bundled font files.

## Commands

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

## Required deployment configuration

Set these before public deployment:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_HALE_SUPPORT_EMAIL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional public configuration:

- `NEXT_PUBLIC_HALE_IOS_URL`
- `NEXT_PUBLIC_HALE_ANDROID_URL`
- `NEXT_PUBLIC_HALE_BETA_PRICE`
- `NEXT_PUBLIC_HALE_REGULAR_PRICE`
- `NEXT_PUBLIC_HALE_CURRENCY`
- `NEXT_PUBLIC_HALE_BILLING_DESCRIPTION`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- `NEXT_PUBLIC_GOOGLE_ADS_ID`
- `NEXT_PUBLIC_GOOGLE_ADS_SIGNUP_LABEL`
- `NEXT_PUBLIC_GOOGLE_ADS_IOS_CLICK_LABEL`
- `NEXT_PUBLIC_GOOGLE_ADS_ANDROID_CLICK_LABEL`

Prices render only when both beta and regular prices are configured and the beta price is lower than or equal to the regular launch price. Until then, the public page uses discount copy without fabricated numbers.

## Beta signup persistence

The production path is Supabase via the server route at `/api/beta-signup`. Apply the migration in `supabase/migrations/202606210001_create_beta_signups.sql`.

The route uses `SUPABASE_SERVICE_ROLE_KEY` only on the server. Do not expose it through `NEXT_PUBLIC_*`.

For local development and automated tests, `BETA_SIGNUP_LOCAL_FALLBACK=1` persists signups to `website/.data/beta-signups.json`. Do not rely on that fallback for a serverless production deployment.

## Legal review

`/privacy` and `/terms` are draft operational pages that describe the website as implemented. They should be reviewed and updated with the owner legal entity, final contact details, and app-store/payment terms before public launch.
