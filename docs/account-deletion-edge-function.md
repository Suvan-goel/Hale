# Account Deletion Edge Function

Pearl mobile clients must not delete Supabase Auth users directly or ship
privileged keys. The repository implementation is
`supabase/functions/delete-account/index.ts`.

## Function

- Name: `delete-account`
- Auth: gateway JWT verification plus `auth.getUser(jwt)` server verification
- Input: no request body or user id; derive the user from the verified JWT
- Output: `{ "ok": true }` on success

## Server-side flow

1. Verify the incoming JWT and derive the current user id.
2. Hard-delete that Auth user with the server-only Supabase Admin API.
3. Let `ON DELETE CASCADE` foreign keys remove user-owned database rows.
4. Return success only after Auth and cascade deletion complete.

The checked-in profile migration supplies this cascade for `profiles`, and the
following migration removes all known legacy movement/programme tables. If an
existing project contains any other user-owned cloud table, stop rollout and
either remove it under a reviewed retention migration or give it an audited
`auth.users(id) ON DELETE CASCADE` owner relationship before this function is
deployed. Pearl's current online profile boundary excludes health, programme,
check-up, Clarity, camera and landmark data; none should be added to this
function as manual table-by-table deletion logic.

If Pearl later stores user-owned files, delete those through the Storage API
before deleting the Auth user. Storage objects do not follow database cascades
and can prevent Auth deletion.

## Deploy

1. Apply the migrations with `supabase db push`.
2. Deploy with `supabase functions deploy delete-account`.
3. Keep `[functions.delete-account] verify_jwt = true` from
   `supabase/config.toml`.

Hosted Edge Functions expose server keys through their environment. The
function prefers the named `SUPABASE_SECRET_KEYS.default` value and retains a
legacy `SUPABASE_SERVICE_ROLE_KEY` fallback. Never copy either value into the
app or commit one to this repository.

## App Behavior After Deployment

1. Before the request, persist a token-free deletion-intent marker outside the
   user's file scope and capture the exact current user/session token.
2. Call `delete-account` with that captured bearer token. The client observes
   the underlying response even if its UI timeout fires, so a late confirmed
   deletion remains recoverable after a crash or restart.
3. If the function succeeds, mark remote deletion confirmed, strictly clear
   that user's local Pearl files (including auth-scoped telemetry), then remove
   only the captured Supabase session. A session switch during the request must
   not clear the newly active account.
4. If any local adapter reports a failure or leaves files behind, keep the
   durable marker and expose the separate **Clear this device** retry. Startup
   also resumes confirmed pending cleanup.
5. If the remote outcome is uncertain, retain the marker until a verified Auth
   lookup establishes whether that account still exists. Do not report
   permanent deletion as complete merely because the client timed out.

## Security notes

- The mobile app should only use public Supabase env vars.
- The privileged Supabase key belongs only in Edge Function secrets.
- The function should never accept a client-provided user id for deletion.
- A failed cascade fails the Auth deletion and returns an error rather than
  reporting partial success.
