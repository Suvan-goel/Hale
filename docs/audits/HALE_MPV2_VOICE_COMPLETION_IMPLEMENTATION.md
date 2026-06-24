# Hale MPV2 Voice Completion Implementation

## Result

Completed MPV2 tracking-loss recovery, retry narration, recovery-screen voice path, and mounted Clara/Marcus switching at the static/runtime layer. Completion gates pass: yes.

## Tracking Loss And Recovery

- Added `Mpv2RecoveryEpisode` snapshots with recovery id, item, invalidation metadata, target stage, duplicate-loss counter, and precedence.
- Confirmed active tracking loss invalidates the active attempt before narration controls any user path.
- Chair returns to a fresh official countdown; balance invalidates into retry rest; shoulder returns to retry-ready with selected side preserved; hinge returns to setup without saving a partial result.

## Recovery Narration

- Recovery sequences are required tracked speech.
- `tracking-loss-v21` is deduped per recovery id after playback-start evidence.
- Item-specific recovery uses existing `mpv2_balance_tracking_retry` and `mpv2_shoulder_tracking_retry` where useful.
- `tracking-recovered-v21` is spoken once before fresh prerequisite completion.

## Retry And Recovery Screen

- Runtime retry plays optional `retry-v21`, then replays the required setup/start prerequisite.
- The recovery screen supports scoped tracked narration via `voiceRecovery`, dedupes by recovery id, and cancels on unmount.

## Mounted Voice Switching

- Runtime owns desired, active, and pending voice ids.
- Safe-boundary changes cancel old tracked requests with `voice_changed`, replace the channel, clear completed scopes, and replay required context.
- Active measurement defers voice changes until the next safe boundary.
- Old-channel callbacks are guarded by scope and epoch.

## Tests And Audit

- Focused coordinator, runtime, and screen source tests cover recovery, precedence, retry, recovery screen, voice switching, and stale callbacks.
- Post-completion audit scenarios: 77.
- P0/P1/P2/P3: 0/0/0/1.

## Not Done

No audio was generated. No ElevenLabs calls were made. Listening review remains waived. Physical-device audible-onset QA is deferred.
