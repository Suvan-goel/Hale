# Programme engine v2 — pre-promotion checklist (single source of truth)

**PROMOTION EXECUTED 2026-07-08 (commit 1, the flip)** on founder direction
after the founder ran the device work and declared it fine ("looks fine for
now" — informal declaration, recorded in decisions.md; the formal spike
evidence rules for BETA are unchanged and separately owed). The v2 shell is
the unconditional app; the flag is retired from config and the release
audit. **Commit 2 (the decommission) EXECUTED the same day** — the old
engine's shell is deleted per the plan below; its KEEP list held. PROMOTION
COMPLETE; everything that remains before beta lives in the founder items and
the recorded post-promotion gaps (decisions.md 2026-07-08).

Promotion = flipping `EXPO_PUBLIC_ENABLE_PROGRAMME_ENGINE_V2` from dev-only to
default and decommissioning the old engine (blocks, block progress views,
micro-check scheduling) per the C4 ruling. **Nothing promotes with an
unchecked engineering item.** Founder items live here with named owners;
update status in place.

## Engineering (all must be checked)

- [x] Parity review signed off per docs/specs/ladder-migration-map.md
      (every old v1_core level mapped/absorbed/retired deliberately; ported
      capabilities verified: substitution systems, pain-recurrence exclusion
      [DEFERRED by ruling 2026-07-07 — §12 pain regression suffices for v1],
      policy-snapshot governance; measurement surfaces byte-identical).
      Floor-required v1 ruled 2026-07-07 (floor-comfort question = v2
      candidate). See docs/parity-review-draft.md. SIGNED OFF with the
      2026-07-08 promotion direction (all checks verified or ruled; the
      draft was read-and-approve).
- [x] Simulation suite green including the two ruling pins (scheme-aware
      plank cadence: top by exposure 6, promotion on 7; exposure-cadence
      stall detector ≤6 with KNOWN_STALLS = 'none'-persona only).
      EXTENDED 2026-07-07 (Phase 5): integratedShellJourney.test.ts drives
      whole journeys through the shell's own call order — completion routes,
      today view model, post-session moment loop (termination pinned),
      re-offer/cadence semantics, B1 bypass, break-and-return easing.
- [x] On-device pass of the full shell: onboarding → placement → first
      15-minute session → RPE → promotion surfaces → gateway teach card →
      re-offer paths → Check-up #0 host → upward-only vs replace
      re-placement semantics verified on device.
      DONE per founder declaration 2026-07-08 (device work run against
      Blocks 6b + 6c; "looks fine for now" — informal, no per-check record;
      any regressions surface fix-forward).
- [x] first_session_started verified end-to-end on device (profile flag at
      session start + funnel v3 stamp on the same record). (Block 6b check 4;
      covered by the 2026-07-08 founder device declaration.)
- [x] Old→new state: no code path reads legacy training state into the new
      engine (fresh placement only; internal testers re-onboard). Verified
      grep-clean 2026-07-07 (parity review check 2); the integrated shell
      touches the old engine ONLY via stateless Explore preset generation,
      run ephemerally with no ladder credit (recorded Phase-4 decision).
- [x] Two-protocol Check-up #0 host (acceptance criteria verbatim, founder
      green-light 2026-07-06):
      - Consumes CHECKUP_ZERO_PROTOCOL_SEQUENCE; any scope or order drift
        fails tests.
      - Sequence: brief guided gentle warm-up (~45 s, marching/easy reaches)
        → one-leg balance, both sides → 30-second chair rise. Max effort
        comes last, always.
      - Copy truthful end-to-end: the "two minutes of moving" promise, the
        "no one sees this but you — it never leaves your phone" line
        (already implementation-true), and any stated duration must match
        measured on-device reality.
      - Reuses the unified check-up internals (protocol setups,
        standing-frame checks, evidence handling) without creating new
        measurement semantics; results flow only through
        assessmentInputsFromCheckUp into applyAssessmentPlacement with
        established semantics ('now' = replace with the −1 easy start; any
        post-training-history path upward-only).
      - Every gate holds at every entry point: B1 bypass, all three re-offer
        paths, home button.
      - Routine 4–6-week programme-v2 check-ups use this same host and
        battery.
      - Graceful abandonment: exit mid-check without penalty — partial data
        follows the partial rules (upward-only, never lowers anyone), and
        abandoning does not burn any once-only re-offer surface; the
        home-screen movement-check button remains the permanent way back.
      - The host's own ON-DEVICE PASS is part of its definition of done —
        suite-green alone doesn't close this gate.
      DONE per founder declaration 2026-07-08 (host ran on device within the
      Blocks 6b/6c pass; criteria pinned in software throughout).

## Founder-owned (named owner: founder)

- [x] Bundled audio generation for programme exercises + prep drills
      (ElevenLabs pipeline, both voices) — DONE 2026-07-07 (2ce2a338,
      96 lines × 2 voices, verify:audio green).
- [ ] Clinical review: Stage B question set, the ZERO-hard-gates v1 posture
      (recorded reasoning in CLAUDE.md), and the exercise catalogue.
- [ ] Design pass per docs/design-backlog.md (after promotion decision,
      before beta — warm/calm/spacious/grown-up brief).
- [ ] Brand-voice copy pass over the content layer (all strings are config;
      no logic edits required).
- [ ] Positioning sign-off on the weight/body-changes question (open
      decision flag — candidate LifeGoal addition, currently absent).

## Deferred by decision (re-entry conditions, not blockers)

- [ ] Impact finisher track + B2 bone questions + osteoporosis hard gate —
      re-enter TOGETHER on positioning validation; B2 ships with a scoped
      claims-guardrail exception (clinical contexts only); the zero-hard-gates
      pin moves to exactly one.
- [ ] T2 push-up incline finder — re-enter with full camera-protocol
      governance cost (grader, corpus, device gate) acknowledged.
- [ ] Local notifications for chosen days — separate proposal approval
      (D1 day picker already collects the data).
- [ ] Equipment-sync as a dedicated NON-health field — re-enter if
      cross-device restore becomes a priority (2026-07-06 backlog note).
- [ ] Core-on-short-sessions — finisher-slot rotation sketch
      (docs/decisions.md trim-rotation entry) if habitual-short telemetry
      shows core starvation.
- [ ] Full official battery as an explicit OPT-IN "full movement check" for
      curious users — never the default at Check-up #0 or routine check-ups
      (ruling 2026-07-06).
- [ ] Two-side balance variant for T1 — re-enter only on evidence that
      single-side placement misses balance-limited users (support-variant
      usage patterns or check-up data suggesting undetected asymmetry);
      carries full protocol + device-gate cost (ruling 2026-07-06).

## Promotion commit plan (STAGED 2026-07-07; COMMITS 1 AND 2 BOTH EXECUTED
## 2026-07-08 — promotion complete)

The promotion is one commit plus a cleanup commit, both mechanical; every
decision they encode is already ruled.

**Commit 1 — the flip:**
1. App.tsx: the v2 shell (ProgrammeV2Root inside AuthProvider) becomes the
   unconditional app root; the `isProgrammeEngineV2Enabled()` branch and the
   old AppGate mount are removed.
2. Flag retirement: `EXPO_PUBLIC_ENABLE_PROGRAMME_ENGINE_V2` deleted from
   src/config (programmeEngineV2.ts), releaseFlagAudit.ts (env name, flag
   field, unsafe reason), and the audit tests — the audit stops policing a
   flag that no longer exists. The ZERO-hard-gates pin and all other release
   flags are untouched.
3. Internal testers re-onboard (no live migration — recorded ruling; comms
   note to testers is founder-owned).

**Commit 2 — the decommission (C4 + parity check 3):**
1. Delete the old-engine app wiring: AppGate/PearlApp's lifecycle plumbing in
   App.tsx, old onboarding staging (src/onboarding/state.ts flow), PlanScreen
   (old block UI), block progress views, BlockIntroScreen, micro-check
   scheduling surfaces + MicroCheckScreen mounts (the routine 28-day cadence
   is the recorded replacement), TodayScreen's `lifecycle` mode (programme
   mode becomes its only data source), and the old TrainingState-driven
   daily-session generation path.
2. KEEP (shared or still-shipping surfaces): the exercise registry and
   movement definitions, the voice player and all V2.1 voice machinery, the
   unified check-up machinery + Check-up #0 host, results/Progress/Explore/
   Settings screens, the STATELESS preset generation that Explore's extra
   practice uses, backup/sync services (programme state stays local-only),
   and the record/replay + measurement stacks in full.
3. Reference details (C5): with the old baseline/retest entry points gone,
   age/sex remain collectible via the Settings safety-profile review; the
   full official battery returns later as an explicit opt-in with its own
   intro (deferred-by-decision list) and re-inherits the C5 intro then.
4. Tests: retire old-engine shell tests with the surfaces they pin;
   measurement, voice, check-up, results, and programme suites must stay
   green untouched. The healthDataLocalOnly and copy-guardrail scans run
   unchanged.
