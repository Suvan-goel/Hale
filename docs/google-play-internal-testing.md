# Google Play Internal Testing

Hale's Play-managed Android beta uses Google Play Internal Testing. This is the
path to use when testers should install from the Play Store instead of an EAS
APK link.

## What The Repo Provides

- `eas.json` profile `playInternal` builds an Android App Bundle (`.aab`).
- The profile uses the EAS `preview` environment, where the public Supabase
  URL and publishable key are configured for beta sign-in.
- The profile forces internal, diagnostic, rollback, pose benchmark, Sentry,
  and Apple Sign-In flags off.
- The npm scripts verify pose models and release flags before building.

## Build

```sh
npm run build:android:play-internal
```

When the build finishes, download the `.aab` from the EAS build page for the
first manual Play Console upload.

## First Manual Play Console Setup

Do these once in Google Play Console:

1. Create the app record.
   - App name: `Hale`
   - Package name: `com.suvangoel.hale`
   - App type: app
   - Pricing: free unless product direction changes
   - The package name is fixed after the first artifact upload.

2. Create the internal tester list.
   - Go to Testing > Internal testing > Testers.
   - Create an email list of Google accounts.
   - Internal testing supports up to 100 testers per app.
   - Add a feedback email or feedback URL.

3. Create the first internal release.
   - Go to Testing > Internal testing > Releases.
   - Create a new release.
   - Upload the `.aab` from the EAS `playInternal` build.
   - Add short release notes.
   - Review the release.
   - Start rollout to Internal testing.

4. Share the opt-in link.
   - Testers must open the opt-in link with the same Google account in the
     tester list.
   - After opting in, they install from the Play Store.
   - The first test link can take a few hours to become available.

If testers previously installed an EAS APK build, ask them to uninstall that
APK before installing from Play. The Play-delivered build may use different
signing.

## Later Automated Submit

After the Play Console app exists and the first internal track is working, EAS
can submit new builds directly to the internal track.

Manual setup:

1. In Google Cloud Console, create a service account for Play uploads.
2. Download the JSON key locally. Do not commit it.
3. In Play Console, go to Setup > API access and grant that service account
   access to release to the internal testing track.

Then run:

```sh
npm run submit:android:play-internal
```

Run that command immediately after a successful `playInternal` build. If another
Android build has happened since then, submit the exact build instead:

```sh
npx eas-cli@latest submit -p android --profile playInternal --id BUILD_ID
```

If EAS prompts for the service account JSON, pass the local key file. The file
is covered by `.gitignore`; still treat it as sensitive.

## Notes

- This track is for tester distribution, not public production.
- Developers with newer personal Play accounts may still need Google's closed
  testing requirement before production release.
- Internal testing can start before the app's full store listing is finished,
  but public release still needs final privacy, data safety, screenshots, and
  policy declarations.
