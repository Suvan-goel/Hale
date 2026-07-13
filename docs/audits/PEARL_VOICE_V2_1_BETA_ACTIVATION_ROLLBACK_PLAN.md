# Pearl Voice V2.1 Beta Rollback Plan

## In-App Rollback

Open Settings -> Trainer Voice and turn off New voice system. The setting writes `settings.voiceExperienceMode = "legacy"`.

## Emergency Env Rollback

Set `EXPO_PUBLIC_FORCE_LEGACY_VOICE=1` for a deterministic force-legacy override.

Optional explicit mode:

```text
EXPO_PUBLIC_VOICE_EXPERIENCE_MODE=legacy
```

## Priority Order

1. `EXPO_PUBLIC_FORCE_LEGACY_VOICE`
2. `EXPO_PUBLIC_VOICE_EXPERIENCE_MODE`
3. Persisted `settings.voiceExperienceMode`
4. Fresh-install default `v21_beta`

## Active Sessions

Active sessions are pinned at launch. A Settings change applies to the next session/check-up.
