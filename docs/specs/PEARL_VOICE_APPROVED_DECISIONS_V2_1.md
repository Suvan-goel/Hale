# Pearl Voice Approved Decisions V2.1

There are zero unresolved founder decisions for V2.1. Some approved behaviours still require implementation before runtime preview. Approval of the product decision is not approval of generated audio.

## FD-001

Status: approved
Approved rule: Unilateral and asymmetric training uses a both-sides round.
Interpretation used in V2.1: A round contains work on both sides before rest; first side may alternate by round; dose conversion is separate.
Script consequences: Add side-aware whole lines and side-change cues. Use dynamic target phrases until dose conversion is encoded.
Protocol consequences: Round state and dose-preserving prescription migration required.
Production changes required later: IR-VOICE-ROUND-STATE, IR-VOICE-DOSE-CONVERSION
Migration/versioning consequences: Round state and dose-preserving prescription migration required.
Validation criteria: Decision recorded as approved; No founder-decision blocker remains; Runtime readiness reflects implementation gaps.

## FD-002

Status: approved
Approved rule: Reliable, comfortable baseline side is persisted for official comparability.
Interpretation used in V2.1: Baseline confirms the measurable comfortable side; retests reuse it; opposite side is reduced comparability; unknown legacy side remains raw-only.
Script consequences: Use natural left/right variants; never hard-code left. Do not claim same-side progress without side metadata.
Protocol consequences: Persist side, protocol version, and comparability status.
Production changes required later: IR-VOICE-SIDE-PERSISTENCE
Migration/versioning consequences: Persist side, protocol version, and comparability status.
Validation criteria: Decision recorded as approved; No founder-decision blocker remains; Runtime readiness reflects implementation gaps.

## FD-003

Status: approved
Approved rule: Default unsupervised home balance is eyes-open only.
Interpretation used in V2.1: Default protocol has feet-together, semi-tandem, tandem, and single-leg eyes-open stages; eyes-closed is conditional legacy only.
Script consequences: No default close-eyes line. Stage scripts stay short and support-focused.
Protocol consequences: New balance protocol id/version and migration guard required.
Production changes required later: IR-VOICE-BALANCE-PROTOCOL-V2
Migration/versioning consequences: New balance protocol id/version and migration guard required.
Validation criteria: Decision recorded as approved; No founder-decision blocker remains; Runtime readiness reflects implementation gaps.

## FD-004

Status: approved
Approved rule: Initial mini-band lateral walk uses the band above the knees.
Interpretation used in V2.1: Above-knees placement is part of the first level; ankle placement is a later progression; both directions occur inside one timed set.
Script consequences: State placement once inside the instruction. Remove side-round dependency from mini-band lateral walk.
Protocol consequences: No side-round state required for this item.
Production changes required later: IR-VOICE-SAFETY-SUBSUMPTION
Migration/versioning consequences: No side-round state required for this item.
Validation criteria: Decision recorded as approved; No founder-decision blocker remains; Runtime readiness reflects implementation gaps.

## FD-005

Status: approved
Approved rule: Step-ups alternate leading leg every repetition.
Interpretation used in V2.1: Target is 12 total reps, alternating lead leg each rep, returning both feet to the floor before the opposite leg leads.
Script consequences: Freeze concise alternating-leg script for review. Withhold integrated preview until grader/session state supports it.
Protocol consequences: Step-up grader/session alternation support required.
Production changes required later: IR-VOICE-STEP-ALTERNATION
Migration/versioning consequences: Step-up grader/session alternation support required.
Validation criteria: Decision recorded as approved; No founder-decision blocker remains; Runtime readiness reflects implementation gaps.

## FD-006

Status: approved
Approved rule: Do not speak total set count during setup.
Interpretation used in V2.1: No setup line announces set count. Set count remains visual; last-set cue may remain.
Script consequences: Retire set-plan cues. Repeat instructions do not include set count.
Protocol consequences: Cue schema/manifest removes set-count setup assets.
Production changes required later: IR-VOICE-NEW-CUE-SCHEMA
Migration/versioning consequences: Cue schema/manifest removes set-count setup assets.
Validation criteria: Decision recorded as approved; No founder-decision blocker remains; Runtime readiness reflects implementation gaps.

## FD-007

Status: approved
Approved rule: Add a one-time floor-transfer readiness gate.
Interpretation used in V2.1: Gate asks whether the user can safely get down to the floor and back up without assistance; no/unsure substitutes floor exercises.
Script consequences: One concise first-use floor transition only for eligible users. Final confirmation occurs after the user is actually on the floor.
Protocol consequences: Profile field, substitution behavior, settings edit path, and tests required.
Production changes required later: IR-VOICE-FLOOR-GATE, IR-VOICE-FINAL-POSITION-READINESS
Migration/versioning consequences: Profile field, substitution behavior, settings edit path, and tests required.
Validation criteria: Decision recorded as approved; No founder-decision blocker remains; Runtime readiness reflects implementation gaps.
