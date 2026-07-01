# Android Beta EAS Build

Hale's Android beta build uses an EAS internal distribution APK. It is a release-style build:
no dev client, no diagnostic/internal surfaces, and directly installable from the EAS build URL.

## One-Time Setup

1. Log in and link the repo to an Expo project:

```sh
npx eas-cli@latest login
npx eas-cli@latest init
```

2. Add the public Supabase values to the EAS `preview` environment. These are embedded in the
client bundle, so use the publishable key only, never a service-role key.

```sh
npx eas-cli@latest env:create --environment preview --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-project-ref.supabase.co" --visibility plaintext
npx eas-cli@latest env:create --environment preview --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --value "your-supabase-publishable-key" --visibility sensitive
```

3. Confirm the beta safety flags are still clean:

```sh
npm run verify:safe-beta-flags
npm run verify:pose-models
```

EAS cloud builds also run `scripts/download-models.sh` and `scripts/verify-pose-models.sh`
before native project generation. This matters because MediaPipe `.task` files are
gitignored and must be present before the native module is packaged.

## Build

Run:

```sh
npm run build:android:beta
```

This uses `eas.json` profile `beta`, which:

- builds Android as an APK for EAS internal distribution;
- uses the EAS `preview` environment;
- auto-increments the Android version code;
- downloads and verifies the gitignored MediaPipe pose model assets before native generation;
- forces rollback, internal, diagnostic, pose benchmark, Sentry, and Apple Sign-In flags off;
- keeps audio playback foreground-only with no microphone permission;
- leaves the Fit Frame recording visual enabled.

## Share With Testers

When the EAS build finishes, open the build page and share the install URL with Android testers.
They will need to allow installing apps from the browser or file manager they use to download it.

If a tester already has Hale installed, ask them to uninstall the old build before installing a
new beta APK when testing native changes such as icons, permissions, or bundled audio.

## Later: Google Play Internal Testing

Use Google Play Internal Testing when the beta needs Play-managed installation and updates. That
requires a Play Console app, store listing setup, a first manual AAB upload, and Play service
account credentials for `eas submit`.
