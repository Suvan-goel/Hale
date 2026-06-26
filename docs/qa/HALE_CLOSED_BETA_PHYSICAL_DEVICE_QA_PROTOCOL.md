# Hale Closed-Beta Physical-Device QA Protocol

Status: evidence template only. Do not mark any row pass until it is executed on a physical device.

## Run Identity

| Field | Value |
| --- | --- |
| Tester | |
| Date/time | |
| Git commit | |
| Worktree status summary | |
| Build profile | |
| Build artifact link/id | |
| Platform | |
| Device model | |
| OS version | |
| App version/build number | |
| Network state | |
| Environment flags observed | |

Expected closed-beta flags:

```text
EXPO_PUBLIC_ENABLE_LEGACY_V1_CHECKUP_ROLLBACK=0
EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_INTERNAL=0
EXPO_PUBLIC_ENABLE_MOVEMENT_PROFILE_V2_DIAGNOSTICS=0
EXPO_PUBLIC_ENABLE_POSE_LATENCY_DIAGNOSTICS=0
EXPO_PUBLIC_ALLOW_DIAGNOSTICS_IN_RELEASE=0
```

Public V2 is expected by policy and must not depend on `EXPO_PUBLIC_ENABLE_UNIFIED_MOVEMENT_CHECKUP`.

## Device Matrix

| Required coverage | Device | OS | Build | Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| Android mid-range | | | | Not run | |
| Android recent/high-end | | | | Not run | |
| iPhone recent iOS | | | | Not run | |
| iPhone older supported iOS | | | | Not run | |

## Evidence Rules

- Attach screen recordings or tester notes only when they do not expose faces, camera video, raw pose frames, landmarks, health free text, secrets, or private home details.
- Record app logs only after confirming diagnostics/internal flags are off for beta builds.
- If any diagnostic build is used, label it diagnostic-only and do not treat it as a beta-release pass.
- A row may be Pass, Fail, Blocked, or Not run. Blank is Not run.

## Closed-Beta QA Checklist

| Area | Test | Expected result | Result | Evidence / notes |
| --- | --- | --- | --- | --- |
| Install | Fresh install from TestFlight/Play internal or release-like local artifact | App launches without dev menus or redboxes | Not run | |
| Permissions | First camera permission request | Copy states skeleton estimate; no self-view video appears | Not run | |
| Permissions | Deny camera, then allow from settings | App recovers without crash and returns to setup | Not run | |
| Safe flags | Settings with beta flags off | No internal harness, diagnostics, V1 rollback, mock data, schema, source id, or fingerprint rows | Not run | |
| Direct route | Crafted V1 check-up/result route/state | Blocked or recovered home; V1 does not mount | Not run | |
| Direct route | Crafted internal/diagnostics route/state | Blocked unless exact internal/diagnostics build | Not run | |
| Onboarding | New user V2 baseline | Camera setup routes to unified Movement Profile V2 | Not run | |
| Chair setup | Side-view chair setup and practice | Voice guides setup/practice; no form critique; tracking loss pauses safely | Not run | |
| Chair official | 30-second chair stand | Clear reps counted; rise-speed trend captured; hand-push flag not user-facing | Not run | |
| Balance setup | Front-view balance ladder | Near support safety script plays; side selection/trial setup is clear | Not run | |
| Balance trials | Feet-together, semi-tandem, tandem, single-leg | Trials/rest/use-best behavior works; early touchdown terminates hold | Not run | |
| Balance limits | Eyes-closed/unstable surface policy | No unsafe eyes-closed or unstable-surface flow appears | Not run | |
| Shoulder | Left/right shoulder raise | Side selection/retry works; pain-limited range can stop without failure copy | Not run | |
| Hinge | Forward hinge reach | Supportive capture works; no-measurement recovery is neutral | Not run | |
| Results | First V2 Movement Profile results | Shows Movement Profile domains, reference details, and beta estimates; no Movement Age/weakest-domain/improvement claims | Not run | |
| Block | Automatic V2 block creation | Plan is created from accepted V2 state; no V1 fallback | Not run | |
| Training A/B/C | Week 1 session A/B/C | Voice-first flow completes; one schedule credit per date | Not run | |
| Training A/B/C | Weeks 2 and 3 | Schedule advances by week and template; missed sessions extend schedule | Not run | |
| Training complete | Week 4 after A/B/C | No micro-check after week 4; retest waits for timing gate | Not run | |
| Micro-check | Balanced block week 1/2/3 | Balanced/domain micro-check policy matches H5B; first accepted result wins | Not run | |
| Official retest | V2 official retest due | Retest routes to unified V2; early retest is unavailable, not V1 | Not run | |
| Report | V2 block report | Report is read-only, claim-neutral, and creates next block once | Not run | |
| Progress | History/report surfaces | V2 history/report visible; no V1 mixed history in normal build | Not run | |
| Offline | Airplane mode during local session | Local-first completion persists; backend failure does not crash core flow | Not run | |
| Restore/sync | Sign-out/sign-in/restore smoke | User-scoped data restores or fails safely; no cross-user local state leak | Not run | |
| Export | Data export smoke | Export contains bounded app data; no landmarks/video/images/base64/secrets | Not run | |
| Account clear | Clear local/account data | Local check-up, training, reports, micro-check, and dev recordings are removed | Not run | |
| Audio | Clara and Marcus check-up lines | One voice line at a time; stale lower-priority lines do not queue | Not run | |
| Audio | Text fallback / muted device | Critical prompts remain visible; iOS audio mode does not interrupt camera | Not run | |
| Tracking | Subject leaves frame mid-activity | Tracking interruption is explicit and rep/hold state resets safely | Not run | |
| Lighting | Dim-room preflight | App prompts for main light when detection confidence/stability is poor | Not run | |
| Accessibility | Large text / display zoom | Text fits and controls remain tappable; no overlap | Not run | |
| Privacy | Camera session visual | Skeleton/figure only; no self-view camera video shown or stored | Not run | |
| Stability | Background/foreground during session | App pauses/recovers without double counting or stale audio | Not run | |
| Regression | Warden/chair reference claims | Warden remains deferred; chair reference remains raw-only | Not run | |

## Rollback-Build Check

Run only on a deliberately labelled rollback artifact.

| Test | Expected result | Result | Evidence / notes |
| --- | --- | --- | --- |
| `EXPO_PUBLIC_ENABLE_LEGACY_V1_CHECKUP_ROLLBACK=1` and no V2 state | V1 rollback baseline can run | Not run | |
| Rollback flag plus accepted/pending/malformed V2 state | V2/recovery remains authority; no V1 fallback | Not run | |

## Diagnostic-Build Check

Run only on a deliberately labelled diagnostics artifact.

| Test | Expected result | Result | Evidence / notes |
| --- | --- | --- | --- |
| Diagnostics exact opt-in | Diagnostics route/rows appear only in diagnostics build | Not run | |
| Diagnostic payload export/share | Payload is bounded to ids/reason codes/timings; no raw landmarks, pose frames, images, media, secrets, or health free text | Not run | |

## Known Limitations To Preserve

- Physical-device validation is not complete until this template is filled with device evidence.
- Public release remains blocked without completed device evidence and store-release sign-off.
- Closed beta may proceed only under the recorded product-owner device-validation waiver or after this protocol passes.
- Beta users must be treated as the initial device-validation cohort if the waiver path is used.

## Product-Owner Waiver Section

Use this only if closed beta proceeds before completed physical-device QA.

```text
PHYSICAL DEVICE VALIDATION NOT PERFORMED
PHYSICAL DEVICE VALIDATION WAIVED BY PRODUCT OWNER FOR INVITE-ONLY CLOSED BETA
DEVICE BEHAVIOUR NOT YET VERIFIED
BETA TESTERS WILL BE THE INITIAL DEVICE-VALIDATION COHORT
PUBLIC RELEASE REMAINS BLOCKED
```

| Waiver field | Value |
| --- | --- |
| Product owner | |
| Waiver source/date | |
| Scope | Invite-only closed beta only |
| Exclusions | Public release, medical/accuracy claims, improvement/decline claims, fail-open measurement behavior |
| Accepted residual risk | |
