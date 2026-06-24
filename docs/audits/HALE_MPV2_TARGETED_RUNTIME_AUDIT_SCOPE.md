# Hale MPV2 Targeted Runtime Audit Scope

This scope is for the later targeted runtime audit only. Do not treat it as completed by the listening review.

## Inputs

- Canonical runtime input: `docs/audits/HALE_MPV2_TARGETED_RUNTIME_AUDIT_INPUT.json`
- Canonical cue map: `docs/audits/HALE_MPV2_VOICE_CANONICAL_MAP.csv`
- Listening review export: required before final verdict

## Source Files

- `src/movementProfileV2/voiceCues.ts`
- `src/movementProfileV2/liveCoordinator.ts`
- `src/screens/MovementProfileV2CheckUpScreen.tsx`
- `src/screens/MovementProfileV2RecoveryScreen.tsx`
- `src/movementProfileV2/recovery.ts`
- `src/audio/cues.ts`
- `src/audio/voicePlayer.ts`
- `src/audio/manifest.ts`
- `src/audio/movementProfileV2AudioManifest.ts`
- `src/audio/movementProfileV2Audio.ts`
- `src/movementProfileV2/__tests__/voiceCues.test.ts`
- `src/movementProfileV2/__tests__/liveCoordinator.test.ts`
- `src/movementProfileV2/__tests__/recovery.test.ts`
- `src/audio/__tests__/movementProfileV2Audio.test.ts`
- `src/audio/__tests__/voicePlayer.test.ts`

## Required Scenarios

### normal

- full_normal_mpv2_checkup_clara
- full_normal_mpv2_checkup_marcus
- chair_practice_to_official_attempt
- balance_valid_attempt_rest_next_attempt
- balance_invalid_tracking_retry
- balance_full_hold_ceiling
- balance_use_best
- balance_default_ready_after_60
- shoulder_left
- shoulder_right
- hinge_valid_result
- completion

### timing_collision

- initial_effect_speech_versus_first_user_action
- timer_event_while_prior_cue_playing
- equal_priority_event_while_busy
- higher_priority_event_while_busy
- required_cue_missing
- required_asset_resolution_throws
- playback_creation_fails
- playback_start_callback_fails
- cue_completes_after_state_exit
- rapid_user_action_during_speech
- recovery_event_during_speech
- repeated_tracking_loss_event
- tracking_recovery_before_loss_cue_finishes
- countdown_versus_operational_cue
- go_audible_onset_timing
- times_up_during_another_cue
- result_completion_transition_while_prior_cue_busy

### user_control

- retry_during_intro
- retry_during_chair_practice
- retry_during_official_attempt
- retry_during_balance_rest
- recovery_screen_retry
- navigation_unmount_during_speech
- app_background_foreground
- voice_change_while_screen_mounted_channel_exists

### policy

- priority_50_100_mapping
- fail_closed_required_cue_behavior
- droppable_setup_reassurance_cues
- no_stale_mpv2_operational_cue_after_state_change
- clara_marcus_duration_differences_do_not_alter_state_outcome

## Known Risks To Inspect

- mpv2_no_spoken_countdown_or_go: Current MPV2 starts the chair measurement after an internal 3000ms countdown without emitting countdown-three/two/one/go, so V2.1 audible-go timing remains unresolved.
- speech_does_not_block_progression: React user actions and coordinator timers can advance while prior voice sequences are still playing; audit collision/drop outcomes before preview.
- required_cue_throw_is_caught_as_skip: Required MPV2 cue lookup throws without fallback, but VoiceChannel catches the error and advances pending cues, leaving possible silent gaps.
- balance_protocol_differs_from_v21_ladder: Current MPV2 balance is a single-leg multi-attempt eyes-open protocol, not the full V2.1 balance ladder.

## Required Checks

- Confirm full normal MPV2 check-up in Clara and Marcus.
- Confirm every balance attempt branch.
- Confirm left/right shoulder cue-side consistency.
- Confirm hinge valid and no-measurement completion branches.
- Confirm priority 50-100 behavior and busy-channel interruption/drop behavior.
- Confirm missing required cue and playback failure branches.
- Confirm no stale MPV2 operational cue continues after meaningful state exit.
- Confirm current MPV2 countdown behavior and document that no audible go cue is emitted unless production code changes before the runtime audit.
