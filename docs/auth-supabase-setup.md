# Auth & Supabase Setup

Pearl offers optional Supabase sign-in for account access and private,
non-health profile/settings sync; ordinary programme use remains guest-first
and works without a network connection. Every shipped build still needs the
public Supabase URL/key because the auth provider must safely hydrate or clear
an existing persisted session even when new profile creation is rollout-disabled. This
doc lists the dashboard/config the auth flows depend on. Source of truth for
the values is `src/services/backend/authService.ts` and `.env.example`.

## App identity

- Deep-link scheme: `pearl://`
- Redirect URL: `pearl://auth/callback`
- iOS/Android bundle id: `com.suvangoel.pearl`

## Supabase dashboard

1. **Auth → URL Configuration → Redirect URLs** — add `pearl://auth/callback`.
   This single URL covers **Google sign-in** (`signInWithOAuth` passes it as
   `redirectTo`), email confirmation, and **password-reset emails**
   (`resetPasswordForEmail`). Without
   it, Supabase rejects the redirect with "requested path is invalid".
2. **Auth → Providers → Apple → Authorized Client IDs** — add
   `com.suvangoel.pearl`. Apple sign-in is the native ID-token flow
   (`AppleAuthentication.signInAsync` → `supabase.auth.signInWithIdToken`), and
   Supabase validates the token audience against this list; a stale bundle id
   fails with an audience mismatch.
3. **Auth → Providers → Google** — no change needed. Google's OAuth redirect
   targets `https://<project-ref>.supabase.co/auth/v1/callback` (tied to the
   project, not the app scheme); only step 1 matters on the app side.
4. **Auth → Email** — keep email confirmation enabled for production and
   configure production SMTP. Supabase's trial sender is not a release-grade
   delivery path. Test confirmation and password recovery in a development or
   store build; Expo Go does not provide a stable custom-scheme callback.

## Database profile

Apply both checked-in migrations in order with the Supabase CLI (`supabase db
push`) or review and run them in the SQL editor. The profile migration:

- keeps the columns consumed by `BackendProfile`;
- makes `profiles.id` reference `auth.users.id` with `ON DELETE CASCADE`;
- installs owner-only SELECT, INSERT and UPDATE policies;
- creates profile rows from the signed-up user's `full_name` metadata; and
- removes the retired `safety_json` health payload.

This migration deliberately and irreversibly scrubs legacy profile extras,
free-text goals, onboarding routing, and `safety_json` from `profiles`. Before
applying it to an existing project, complete any required retention/DSAR
export and take a reviewed backup; do not treat the migration as a backup
mechanism.

The online boundary is the private profile and non-health app settings only.
Menopause and symptom context, safety answers, programme state, sessions,
check-ups, Everyday Clarity, camera data and landmarks stay on the device.
`20260712000200_remove_legacy_cloud_programme_data.sql` then drops the six
retired movement, training, check-up, and micro-check tables used by old
prototypes. It deliberately does not use `CASCADE`: an unknown dependency
stops deployment for manual retention/privacy review. Online profiles must
remain disabled until those legacy cloud stores are gone and the deployed
schema contains only the owner-only profile surface used by the current app.

The app may contain only `EXPO_PUBLIC_SUPABASE_URL` and the publishable key.
Never place a Supabase secret or legacy service-role key in Expo configuration,
source control or a mobile build.

Set `EXPO_PUBLIC_PRIVACY_POLICY_URL` to the reviewed HTTPS privacy-policy page
before exposing account creation in a release build. The sign-up surface links
to it and also states the on-device/online boundary inline.
The landing app also serves `/delete-account`; publish that HTTPS URL as the
Google Play account-deletion URL after replacing the draft contact/controller
details with reviewed production wording.

The mobile client currently follows Supabase's React Native quickstart and
stores the persisted session through AsyncStorage with `processLock` plus
foreground-only token refresh. Moving sessions to SecureStore needs a separate
real-device test for oversized JWT/session values; do not swap storage adapters
without that gate.

Deploy self-service deletion before enabling account creation:

```sh
supabase db push
supabase functions deploy delete-account
```

See `docs/account-deletion-edge-function.md` for cascade and Storage
preconditions.

Finally set `EXPO_PUBLIC_ENABLE_ONLINE_PROFILES=1`. Tester-facing and release
builds always require the Supabase URL and publishable key; when that flag is
on they additionally require an HTTPS privacy-policy URL. Keep it `0` until the
migration, function, providers, email delivery, policy, and deletion page have
all been verified in the target Supabase environment.

Keep `EXPO_PUBLIC_ENABLE_APPLE_SIGN_IN=0`. The release config rejects Apple
sign-in until a separate approved change adds per-attempt cryptographic nonce
and state validation across Expo and Supabase, with real-device replay tests.

Keeping the existing Supabase project is fine — the `profiles` schema is
brand-agnostic, so existing accounts keep working and
`EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are unchanged.
Only start a new project if you want a clean backend (redo all provider setup
there; existing accounts/data won't carry over).

## Outside Supabase (required for the bundle id)

- **Apple Developer → Identifiers** — register an App ID for
  `com.suvangoel.pearl` with "Sign in with Apple" enabled, then rebuild so
  provisioning includes it.
- **EAS** — `app.json` `extra.eas.projectId` still points at the previous EAS
  project. For a separate app in the stores, run `eas init` to mint a new
  project and set up store credentials for `com.suvangoel.pearl`.
