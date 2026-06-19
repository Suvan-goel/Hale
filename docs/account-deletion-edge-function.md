# Account Deletion Edge Function Plan

Hale mobile clients must not delete Supabase Auth users directly or ship privileged keys. Full cloud account deletion should be implemented as a Supabase Edge Function.

## Function

- Name: `delete-account`
- Auth: require a valid current Supabase JWT
- Input: no user id from the client; derive the user from the verified JWT
- Output: `{ "ok": true }` on success

## Server-Side Steps

1. Verify the incoming JWT and derive the current user id.
2. Delete or anonymize public user-owned rows for that user, including:
   - `profiles`
   - `movement_checkups`
   - `movement_blocks`
   - `training_session_completions`
   - `micro_checks`
   - `movement_block_reports`
   - `training_state`
3. Delete the Auth user server-side with the Supabase Admin API.
4. Return success only after the public data and Auth user deletion steps complete.

## App Behavior After Deployment

1. Call `delete-account` while signed in.
2. If the function succeeds, clear local Hale data from the device.
3. Sign out and return to the required auth screen.
4. If the function fails, show an error and do not clear local data unless the user separately chooses local-only deletion.

## Security Notes

- The mobile app should only use public Supabase env vars.
- The privileged Supabase key belongs only in Edge Function secrets.
- The function should never accept a client-provided user id for deletion.
