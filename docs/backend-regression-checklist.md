# Backend Regression Checklist

Use this checklist before beta builds and after backend, auth, sync, restore, privacy, or observability changes.

## Auth

- [ ] Email sign-up creates a Supabase Auth user and profile row.
- [ ] Email sign-in enters the existing Hale app flow.
- [ ] Sign-out returns to the required auth screen.
- [ ] Google sign-in succeeds on the current development/release build.
- [ ] Password reset email sends successfully.
- [ ] Password reset deep link opens Hale and allows setting a new password.
- [ ] Apple sign-in is hidden unless `EXPO_PUBLIC_ENABLE_APPLE_SIGN_IN=1`.
- [ ] Required auth gate blocks signed-out app usage.
- [ ] Auth loading state does not hang if Supabase is slow or unavailable.

## Sync

- [ ] Profile/onboarding/safety/preferences sync after local updates.
- [ ] Movement Check-Up sync creates or updates one remote row per local check-up.
- [ ] Movement Block / 4-week plan sync preserves the generated plan remotely.
- [ ] Workout session completion sync creates or updates one remote row per local completion.
- [ ] Post-session feedback update sync updates the existing remote session row.
- [ ] Weekly micro-check sync creates or updates one remote row per local micro-check.
- [ ] Movement Block Report sync creates or updates one remote row per local report.
- [ ] `training_state` snapshot sync updates one remote row per user.
- [ ] Offline or failed sync does not block local UI progress.
- [ ] Retrying the same sync does not create duplicate rows.

## Restore

- [ ] Fresh install + sign-in restores profile, check-ups, blocks, sessions, micro-checks, reports, and training state.
- [ ] Non-empty local state is not overwritten by remote restore.
- [ ] Restore failure or timeout on a fresh/default install does not upload empty/default `training_state`.
- [ ] Partial restore failure leaves local app usage intact.
- [ ] Sign-out/sign-in does not trigger an unexpected second restore over non-empty local data.

## Privacy And Data Controls

- [ ] Export my data creates/share a readable JSON export.
- [ ] Export includes profile, movement check-ups, movement blocks, training state, session completions, micro-checks, and block reports.
- [ ] Export excludes auth tokens, provider tokens, service keys, raw video, frames, images, pose landmarks, base64 blobs, and local file paths/URIs.
- [ ] Delete local data only clears local Hale files and signs the user out when expected.
- [ ] Delete local data handles missing files without crashing.
- [ ] Delete account flow clearly explains cloud deletion is deferred until the secure Edge Function exists.
- [ ] Delete account placeholder does not pretend cloud deletion succeeded.
- [ ] Synced payloads do not include raw video, camera frames, images, pose landmarks, base64 blobs, or local file paths/URIs.

## Supabase Verification

- [ ] RLS is enabled on all exposed Hale tables.
- [ ] Policies restrict rows to the authenticated owning user.
- [ ] Cross-user reads, inserts, updates, and deletes are denied.
- [ ] `profiles` trigger creates a profile row for new auth users.
- [ ] Required unique constraints/indexes exist:
  - [ ] `movement_checkups(user_id, local_checkup_id)`
  - [ ] `movement_blocks(user_id, local_block_id)`
  - [ ] `training_session_completions(user_id, local_session_id)`
  - [ ] `micro_checks(user_id, local_micro_check_id)`
  - [ ] `training_state(user_id)`
  - [ ] `movement_block_reports(user_id, local_report_id)` where `local_report_id is not null`
- [ ] `movement_block_reports.local_report_id` generated column exists and reads `report_json ->> 'localReportId'`.
- [ ] Tables used by the app are exposed to the Supabase Data API for authenticated clients.
- [ ] No service-role key or private provider secret is present in the mobile app or public env vars.

## Observability

- [ ] Sentry is disabled by default with `EXPO_PUBLIC_ENABLE_SENTRY=0`.
- [ ] Sentry initializes only when `EXPO_PUBLIC_ENABLE_SENTRY=1` and `EXPO_PUBLIC_SENTRY_DSN` is set.
- [ ] A test event appears in Sentry on a Sentry-enabled build.
- [ ] Wrong-password/email auth error is captured with useful tags/context.
- [ ] Expected offline/background sync failures do not spam Sentry issues.
- [ ] Event context and breadcrumbs do not include tokens, passwords, Supabase secrets, raw video, frames, images, landmarks, base64 blobs, or local file paths/URIs.
- [ ] User context contains only the Supabase user id.

## Manual Beta Smoke Path

- [ ] Fresh install the app.
- [ ] Sign in.
- [ ] Complete onboarding.
- [ ] Complete baseline Movement Check-Up.
- [ ] Confirm Movement Block / 4-week plan is created and visible immediately.
- [ ] Complete one training session.
- [ ] Submit post-session feedback.
- [ ] Complete one weekly micro-check.
- [ ] Export my data from Settings -> Account.
- [ ] Delete local data only.
- [ ] Sign in again and confirm remote restore brings back the expected Hale progress.
