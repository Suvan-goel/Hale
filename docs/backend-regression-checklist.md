# Online Profile Backend Regression Checklist

Use this checklist before enabling `EXPO_PUBLIC_ENABLE_ONLINE_PROFILES=1` in
any tester or release environment. Pearl remains guest-first; only the exact
non-health profile allowlist may leave the device.

## Guest-first and authentication

- [ ] A signed-out user can onboard, train, complete check-ups, and review progress offline.
- [ ] Email sign-up creates an Auth user and owner profile row; unconfirmed sign-up never owns local files.
- [ ] Email confirmation and password recovery exchange PKCE codes through `pearl://auth/callback`.
- [ ] Raw access/refresh-token app links are ignored and cannot replace the current session.
- [ ] Google sign-in succeeds in development and release builds.
- [ ] Apple sign-in remains release-disabled until nonce/state replay protection is approved and tested.
- [ ] A slow/failed profile read never loses a valid persisted session or selects the guest file scope.
- [ ] A late initial session/profile response cannot overwrite a newer sign-out or different account.

## Exact online profile boundary

- [ ] The remote projection contains only name, date of birth, reference sex, predefined life-goal category, trainer voice, and comparison preference.
- [ ] Free-text goal, local ids/timestamps, health/safety/menopause/symptom context, programme/onboarding routing, workouts, check-ups, Everyday Clarity, camera data, landmarks, device setup, and voice-onboarding flags are absent.
- [ ] Explicit local clears send `null` for nullable online values.
- [ ] A local-only health/programme edit does not alter the online projection fingerprint.
- [ ] Online hydration preserves every device-only field.
- [ ] The six retired cloud programme/check-up tables are absent after migrations.

## Reconciliation and account scope

- [ ] First-device upload and new-device hydration both work without blocking local use.
- [ ] A single local or remote edit reconciles automatically.
- [ ] Divergent local and remote edits show a device/online choice.
- [ ] Conditional `updated_at` writes surface a concurrent-device update instead of overwriting it.
- [ ] Superseded reconciliation and failed local writes cannot advance sync metadata.
- [ ] Sign-out, account switch, and destructive actions cancel queued local sync commits.
- [ ] Interrupted guest adoption resumes only for its claimed account; a second account cannot adopt leftovers.
- [ ] Telemetry/funnel files, including pain events, use the same guest/account scope and adoption boundary.

## Privacy and deletion

- [ ] Clear device data uses strict list/delete verification for profile, programme, check-ups, drafts, session funnels, and recordings.
- [ ] A list error, delete error, no-op delete, or failed verification is reported and never claimed as success.
- [ ] Device clearing while signed in signs out only after verified local erasure; the online profile remains.
- [ ] The delete-account function derives the caller from a verified JWT and accepts no user id.
- [ ] Client deletion binds the captured user id and exact access token; an A→B transition cannot delete/clear/sign out B.
- [ ] A durable pre/post-deletion cleanup marker recovers interrupted local erasure after relaunch.
- [ ] Auth-user deletion cascades to `profiles`; no retained cloud health/programme/check-up data exists.
- [ ] The published privacy and `/delete-account` pages have completed legal/controller review.

## Supabase and release configuration

- [ ] Both migrations apply cleanly and idempotently to fresh and representative legacy schemas.
- [ ] `profiles.id` references `auth.users(id) ON DELETE CASCADE`.
- [ ] RLS is enabled; authenticated SELECT/INSERT/UPDATE are owner-only; anon has no policy/grant; authenticated DELETE is unavailable.
- [ ] JSON and compatibility-column constraints reject widened profile payloads.
- [ ] Signup/backfill and `updated_at` triggers work.
- [ ] The Edge Function is deployed with JWT gateway verification and server-only credentials.
- [ ] Every tester/release build has the public Supabase URL/key; profile-enabled builds also have a reviewed HTTPS privacy URL.
- [ ] Production SMTP, redirect allowlists, Google provider setup, account deletion, offline retry, and two-device conflict paths pass on real devices.

## Observability

- [ ] Sentry remains disabled by default and contains no tokens, passwords, secrets, raw media, landmarks, local paths, profile values, or health text.
- [ ] Expected offline/profile retry failures do not spam issues.
- [ ] User context contains only the Supabase user id.
