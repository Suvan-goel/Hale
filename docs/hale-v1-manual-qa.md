# Hale V1 Manual QA Checklist

Date: 2026-06-17

Use this checklist before and after Hale V1 restructure changes. Keep the pass focused on existing working flows: navigation, onboarding, camera check-up, dynamic sessions, progress, Explore, and local state compatibility.

## Preflight

- Run `npm run typecheck`.
- Run `npm test -- --runInBand`.
- Run `npx expo config --type public`.
- Run `git diff --check`.
- Launch on a device or dev build that can mount the camera. The simulator/emulator is useful for non-camera screens only.
- Confirm no primary app screen shows camera self-view video; camera flows should show the skeleton/figure only.
- Confirm copy stays warm and non-medical. Safety copy should say: "Hale is not medical care. Move only in a comfortable range."

## Brand-New User

- Clear local app data.
- Open the app.
- Expected route order: Welcome -> Life Goal -> Safety/Profile -> Equipment -> Camera Explanation -> Camera Setup -> Baseline Movement Check-Up -> Results -> Create 4-week block -> Start First Session.
- Welcome should make the next step obvious without showing workout browsing as the default.
- Safety/Profile should accept a minimal profile and preserve comfort/equipment selections when going back and forward.
- Equipment should store local equipment preferences and not block zero-equipment setup.
- Camera explanation should request camera permission only when needed and use privacy-first copy.
- Camera setup should allow permission recovery and should not mount the check-up until the user begins.
- Baseline Movement Check-Up should use the V1 default battery: chair stand, balance ladder, shoulder flexion, hinge reach. Timed Up and Go should not appear in the normal battery.
- Results should create a 4-week block from the baseline and should route to first session readiness.

## Returning User

- Relaunch with an active block and no flow in progress.
- Today should be the default work surface and should make "Start" the obvious action.
- Settings should open from the top-right icon and return cleanly to the tab shell.
- Today should adapt to:
  - First session ready.
  - Normal training day.
  - Weekly micro-check due.
  - Week complete.
  - Monthly re-test due.
  - Clean slate after a long gap.
- Check that Today does not encourage browsing Explore before the main session.

## Plan

- Open Plan with an active block.
- Confirm the title uses "4-week block" and the domain labels are Strength / Power, Balance, Mobility where applicable.
- Confirm weekly progress reads correctly with old and new completion records.
- Start Session A, complete it, and confirm Session B becomes next.
- Repeat enough completions to check Session C and week-complete states.
- Use schedule and intensity controls; relaunch and confirm local preferences persist.
- When re-test is due, Plan should show "Start re-test" and route to the Movement Check-Up path.
- With no active block but a saved baseline, Plan should offer "Create 4-week block".

## Today's Hale Session

- Start from Today and from Plan A/B/C.
- Session Preview should show duration, focus, exercises, equipment, and any generated guidance.
- Start Session should route to the existing session player and preserve voice/camera behavior.
- Complete the session and submit feedback.
- Confirm main block completion count, weekly progress, generated session summary, and ladder progression update only for main plan sessions.
- Try "shorter", "gentler", "no equipment", and "something hurts" adjustments from Today.
- Confirm no-equipment sessions avoid optional equipment and still remain playable.

## Progress

- With no check-up history, Progress should ask for the first Movement Check-Up.
- With one check-up, Progress should show starting-point copy without implying a bad result.
- With two check-ups, Progress should show domain trend cards and latest history.
- At block end, run a re-test, confirm the previous block is completed, a block report exists, and a next active block can be created.
- Open the latest block report and confirm it uses sessions, check-ins, latest score, previous score, and milestone copy when available.
- Confirm the default re-test battery excludes Timed Up and Go.

## Explore

- Extra Sessions should be optional and visually secondary to Today.
- Start a mobility reset or quick full-body extra session. Complete it and confirm it does not count toward the main block, weekly target, or ladder progression.
- Toggle band and stair equipment off. Band Upper-Back and Stairs Confidence should be clearly unavailable.
- Toggle matching equipment on. Those extras should become available.
- Open Movement Ladders. Unknown or stale ladder progress should fall back to the default level without crashing.
- Start ladder practice. It should open the existing session preview/player and remain outside the main block count.
- Open Learn cards and confirm no article creates a medical or fear-based tone.
- Open equipment setup/settings from Explore and return cleanly.

## State And Routing Edges

- Relaunch while `preferences.json` is missing or minimal; the app should backfill defaults.
- Relaunch with an old profile record that has no onboarding object; onboarding should resume at the correct step.
- Relaunch with a legacy training block but no movement block; Today/Plan should still offer a playable session.
- Relaunch with a completed block and missing report; Progress should remain readable and allow the next sensible action.
- Try camera permission denied, then return to Today; the back control should be reachable and labelled.
- Enter and exit Settings, ladder detail, learn detail, session preview, and camera setup repeatedly; the tab shell should not get stuck behind a full-screen flow.
- Rotate between Today / Plan / Progress / Explore after each flow and confirm the selected tab is coherent.

## Accessibility And Usability

- Every visible action should have a readable label and at least a 44px touch target.
- Icon-only settings buttons should announce "Open profile and settings".
- Back controls should announce where they go.
- The Plan progress rail should announce weekly session progress.
- There should be one dominant primary CTA per card or flow unless the screen is explicitly a choice step.
- Text should not overflow cards or buttons on small and large phone sizes.
