# Hale Voice Founder Decisions

Status: proposed for founder review. Leave the Founder decision field blank until reviewed.

## FD-001 -- How should unilateral or asymmetric training work be balanced inside a session?

Why it matters: Odd set counts and unspecified sides can give one side more work while the voice sounds authoritative.
Current production behaviour: Single-leg, tandem, step-up, split stance, seated reach, hip-flexor stretch, and calf stretch do not persist or encode a side schedule in the training registry.
Options:
- Define a round as both sides completed before advancing.
- Use even side-specific sets where the architecture cannot express both sides in one round.
- Leave side choice to the user and mark these as non-comparable practice only.
Codex recommendation: Define equal left/right work within a round; until implemented, avoid freezing side-specific scripts for affected items.
Safe default: Do not assign left-right-left. Block side-specific scripts and keep current programming unchanged.
Consequences: Requires training state and session-player side context before reliable voice-first side cues.
Files/flows affected: src/exercises/*; src/training/sessionPlayer.ts; TrainingSessionScreen
Blocks script freeze: yes
Founder decision: 

## FD-002 -- How should baseline measurement side be selected and persisted for official measurements and micro-checks?

Why it matters: Shoulder, hinge, single-leg balance, and mobility micro-checks cannot claim same-side comparability without persisted side metadata.
Current production behaviour: Legacy graders dynamically choose reliable near side; Movement Profile V2 setup types can carry standingLeg/selectedSide but default legacy battery does not persist side.
Options:
- Use reliable comfortable side at baseline, persist it, and retest the same side.
- Hard-code left side for all official measurements.
- Allow either side but mark reduced comparability when side changes.
Codex recommendation: Use reliable comfortable side at baseline, persist exact side, retest same side, and mark reduced comparability for fallback.
Safe default: Do not claim same-side comparability until side persistence exists.
Consequences: Requires result schema/protocol-version work and side-aware setup copy.
Files/flows affected: src/checkup/protocolSetup.ts; src/movements/shoulderFlexion.ts; src/movements/hingeReach.ts; src/training/microCheck.ts
Blocks script freeze: yes
Founder decision: 

## FD-003 -- Should eyes-closed balance remain in an unsupervised default home check-up?

Why it matters: Current default balance ladder includes eyes-closed feet-together and tandem stages, which may be a safety/protocol issue for home use.
Current production behaviour: DEFAULT_BALANCE_STAGES includes feet-together eyes closed and tandem eyes closed; training safety explicitly says eyes open.
Options:
- Keep eyes-closed stages with explicit safety approval and support wording.
- Move eyes-closed stages to supervised or optional protocol.
- Remove eyes-closed stages from default home check-up.
Codex recommendation: Do not expand or remove in this task; require explicit founder/protocol approval before script freeze.
Safe default: Block eyes-closed script freeze while preserving current production behavior.
Consequences: May require balance protocol versioning and scoring expectations.
Files/flows affected: src/movements/balanceLadder.ts; src/checkup/checkup.ts
Blocks script freeze: yes
Founder decision: 

## FD-004 -- Where should the mini band be placed for the initial lateral-walk level?

Why it matters: Current visible copy allows above knees or around ankles; the voice needs one unambiguous safe setup.
Current production behaviour: ladders.ts says above knees or around ankles; exercise definition only requires mini_band and timed movement.
Options:
- Above knees for initial level.
- Around ankles as a harder variation.
- Let user choose and mark as non-standard.
Codex recommendation: Use above knees for the initial level; treat ankle placement as a later progression.
Safe default: Above knees, but block script freeze until founder approves.
Consequences: May require ladder copy and future progression naming.
Files/flows affected: src/exercises/ladders.ts; src/exercises/lateralStability.ts
Blocks script freeze: yes
Founder decision: 

## FD-005 -- What are step-up rep semantics and the leg-switch schedule?

Why it matters: Current step-up target is 12 total accepted reps across three sets, while the spoken copy says lead down with the same foot and production does not balance sides.
Current production behaviour: step-up has three sets of 12 reps, one reliable side chain, and no side state.
Options:
- Alternate legs within each set and count total reps.
- Use side-specific sets with an even set count.
- Keep one leading leg and classify as non-balanced practice.
Codex recommendation: Alternate legs within the set if the grader can support it; otherwise use even side-specific sets.
Safe default: Block final step-up script; do not invent left-right-left.
Consequences: May require grader/session-player side semantics and prescription update in a later authorised task.
Files/flows affected: src/exercises/stepUp.ts; src/training/sessionPlayer.ts
Blocks script freeze: yes
Founder decision: 

## FD-006 -- Should set count be spoken on first exposure?

Why it matters: Set-plan lines add narration but are not needed to perform the immediate set.
Current production behaviour: The player does not speak set count on first exposure; it speaks rest and last-set transitions.
Options:
- Do not speak set count by default.
- Speak set count only on first ever exposure.
- Speak set count for every exercise.
Codex recommendation: Do not speak set count by default.
Safe default: Omit set-plan assets from V2 active surface.
Consequences: Keeps first-use timelines shorter and reduces asset count.
Files/flows affected: src/training/sessionPlayer.ts; docs/specs/HALE_VOICE_SCRIPT_MANIFEST_V2.csv
Blocks script freeze: no
Founder decision: 

## FD-007 -- Do floor exercises require an explicit transfer-readiness gate or only concise setup copy?

Why it matters: Floor work can be safe for some users and inappropriate for others; a voice line alone cannot solve transfer readiness.
Current production behaviour: Floor exercises have setup/active safety cues but no separate readiness gate.
Options:
- Add a transfer-readiness gate before floor work.
- Keep concise copy and rely on equipment/capability filtering.
- Remove floor work from default blocks.
Codex recommendation: Add a transfer-readiness gate before broad rollout; keep floor scripts blocked until approved.
Safe default: Do not promise floor transfer support in voice copy; block floor-exercise script freeze.
Consequences: May require profile capability flow and exercise substitution rules.
Files/flows affected: src/exercises/gluteBridge.ts; src/exercises/pushUp.ts; src/training/workoutGeneration.ts
Blocks script freeze: yes
Founder decision: 

