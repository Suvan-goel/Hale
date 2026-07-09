# Auth & Supabase Setup

Pearl offers optional sign-in (Supabase) for backup/restore/sync; the app runs
fully offline without it. This doc lists the dashboard/config the auth flows
depend on. Source of truth for the values is `src/services/backend/authService.ts`
and `.env.example`.

## App identity

- Deep-link scheme: `pearl://`
- Redirect URL: `pearl://auth/callback`
- iOS/Android bundle id: `com.suvangoel.pearl`

## Supabase dashboard

1. **Auth → URL Configuration → Redirect URLs** — add `pearl://auth/callback`.
   This single URL covers **Google sign-in** (`signInWithOAuth` passes it as
   `redirectTo`) and **password-reset emails** (`resetPasswordForEmail`). Without
   it, Supabase rejects the redirect with "requested path is invalid".
2. **Auth → Providers → Apple → Authorized Client IDs** — add
   `com.suvangoel.pearl`. Apple sign-in is the native ID-token flow
   (`AppleAuthentication.signInAsync` → `supabase.auth.signInWithIdToken`), and
   Supabase validates the token audience against this list; a stale bundle id
   fails with an audience mismatch.
3. **Auth → Providers → Google** — no change needed. Google's OAuth redirect
   targets `https://<project-ref>.supabase.co/auth/v1/callback` (tied to the
   project, not the app scheme); only step 1 matters on the app side.

Keeping the existing Supabase project is fine — the schema (`profiles`,
`movement_checkups`) is brand-agnostic, so existing accounts keep working and
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
