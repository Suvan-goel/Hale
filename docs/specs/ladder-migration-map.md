# Old catalog → programme v2 mapping (parity checklist for engine promotion)

Status: documentation only (2026-07-06 ruling, ambiguity 5 — no beta users exist, so no live
state migration is built). This table is the checklist that must be reviewed and signed off
when the programme engine (`src/programme`, `EXPO_PUBLIC_ENABLE_PROGRAMME_ENGINE_V2`) is
promoted and the old engine (`src/exercises` ladders + block machinery) is decommissioned.

Legend: **maps** = capability continues at the given programme level · **absorbed** =
capability continues inside another surface · **retired** = deliberately dropped, reason
given · **measurement** = stays in the check-up/micro-check battery (unaffected by the
training-engine swap).

## Old ladder → new home

| Old ladder / level | New home | Notes |
|---|---|---|
| sit-to-stand: Cushion STS | maps → Squat L1 (sit-to-stand with hands, raised seat) | Regression lever = seat height within level |
| sit-to-stand: STS | maps → Squat L2 | |
| sit-to-stand: Slow-Lower STS | maps → Squat L2 variation | |
| sit-to-stand: Power STS | maps → Squat L3 variation (fast-up STS); absorbed → finisher explosive sit-to-stands | Power intent cue from Squat L3 |
| sit-to-stand: Loaded STS | retired as a level → load is the beyond-ladder lever (backpack tier) | Spec §3 "Beyond L9" |
| squat: Supported Squat | maps ≈ Squat L3 (squat to a chair, support available) | Chair behind = confidence + depth gauge |
| squat: Squat / Slow-Lower Squat | maps → Squat L4 (+ paused variation) | |
| squat: Loaded Squat | retired as a level → backpack tier beyond L9 | |
| squat: Chair-Supported Split Squat | maps → Squat L7 | L8/L9 now teach-only gateways |
| step-up: Step-Up | maps → Squat L5–L6 | No-stairs alternative encoded |
| heel-toe-raise (all) | absorbed → finisher heel drops (calf/ankle loading); movement-prep candidate | No standalone strength slot in the 5-pattern model |
| push: Wall / Incline / Floor push-up | maps → Push L1 / L2 / L6 | Push L3–L5 (stair descent) are new intermediate levels |
| pull: Seated Band Row | maps → Pull L5 | Anchor-free mandatory path |
| pull: Standing Band Row (door anchor) | maps → Pull L5 variation (optional door-anchor row) | Anchor now optional by spec |
| pull: Band Pull-Apart | maps → Pull L4 (the band unlock) | |
| hinge-glutes: Wall-Tap Hinge | maps → Hinge L5 (teach-only gateway; rehearsed in prep from day one) | |
| hinge-glutes: Hip Hinge | maps → Hinge L5 variation / L6 | |
| hinge-glutes: Bridge Hold / Glute Bridge | maps → Hinge L1 (+hold variation) | Floor opt-in still applies |
| shoulder-reach-press: Overhead Reach | retired from training → measurement (shoulder reach stays in the check-up); mobility/prep candidate | Not a pattern ladder |
| shoulder-reach-press: Band Overhead Press | retired for v1 → returns with the backpack overhead press (equipment tier, spec §5 vertical-push note) | |
| balance ladder (all) | measurement (check-up battery unchanged); absorbed → balance-support sub-variants + B5/T1 routing | Balance training as finisher single-leg items is deferred with Impact |
| lateral-stability: Side Step / Mini-Band Walk | absorbed → Squat L5 lateral step-up variation; mini-band work retired for v1 | |
| lateral-stability: March in Place | absorbed → finisher power march | |
| mobility-flexibility (all) | absorbed → movement prep / cooldown surface (Step 3) | Not a pattern ladder; not promotion-tracked |

## New content with no old counterpart (net-new coverage)

- Core ladder L1–L8 (dead-bug family, planks, carries) — first core training in the product.
- Pull L1–L3 (no-equipment postural levels), L6–L8 (single-arm rows, high pulls, backpack row).
- Hinge L2–L4 (bridge progressions), L7–L8 (kickstand hinges).
- The finisher as a session-closing power block (quiet track, universal in v1).

## Promotion-time checks (sign off each)

1. Every `v1_core` old level above is mapped/absorbed/retired deliberately — no silent loss.
2. Old stored training state is not read by the new engine anywhere (fresh placement via
   onboarding §6; any pre-promotion internal testers re-onboard).
3. Block machinery, block progress views, and micro-check scheduling decommission in the
   same change that promotes the engine (C4 ruling) — level-up progress + 4–6-week check-up
   cadence replace them.
4. Ported capabilities verified present in the new path: equipment/pain/floor substitution,
   pain-recurrence auto-exclusion, policy-snapshot governance (fingerprint pinning).
5. Measurement surfaces (check-up, micro-checks) byte-identical before/after promotion.
