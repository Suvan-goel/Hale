# Voice Project Handoff After Micro-Check Voice V2.1

Current state: **MICRO_CHECK_VOICE_V2_1_SOFTWARE_COMPLETE**.

## Gates

- Training Voice V2.1 behavior: ready, audio not ready, feature off.
- Micro-Check Voice V2.1 behavior: true, audio: false, feature default: off, selectable count: 0.
- Balance Eyes-Open V2 remains audio pending/default closed from the prior baseline.
- Step-up and floor readiness work remains separate from this Micro-Check task.

## Next Work

1. Generate exact Clara/Marcus physical assets for the pending Micro-Check Voice V2.1 logical cues.
2. Add those assets to the physical manifest in a dedicated audio task.
3. Move final schema/persistence wiring to V2.1 protocol IDs only after audio QA is complete.
4. Flip the feature gate only when behavior, audio, schema, and manual device QA are all green.

Audio hash comparison in this audit is against task-start baseline, not Git HEAD.
