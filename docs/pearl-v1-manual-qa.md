# Pearl MVP Manual QA Checklist

Date: 2026-07-11

Use this checklist for the simplified MVP. The primary shell is **Home / Plan / Progress**.
Settings is a full-screen flow opened from the header. There is no Explore, Learn, Family,
workout browser, or separate session-preview flow in the MVP.

## Preflight

- Run `npm run typecheck`.
- Run `npm test -- --runInBand`.
- Run `npx expo config --type public`.
- Run `npm run verify:audio`.
- Run `npm run verify:pose-models`.
- Run `npm run verify:safe-beta-flags`.
- Run `git diff --check`.
- Compile and launch a native development build. Use a physical device for camera, tracking,
  voice, and audio-session checks; a simulator or emulator covers non-camera screens only.
- Confirm the app never shows camera self-view video. Camera flows show only the private
  skeleton/figure representation.
- Confirm copy remains supportive, non-medical, and free of form critique.

## Brand-New User

- Clear the app's local data and relaunch.
- Confirm the consolidated onboarding follows these user-visible screens:
  Welcome -> About you -> Health consent -> Heart safety -> Movement comfort -> Setup -> Your start.
- If the heart-safety answer requires Gentle Start, confirm the advisory appears before
  Movement comfort and the Movement Check-Up is unavailable.
- On About you, confirm the life goal, menopause stage, and activity questions fit without
  clipped options; optional questions can be skipped.
- Decline health-data consent. Confirm the health questions are omitted, the programme starts
  conservatively, and the Movement Check-Up is not offered.
- Accept health-data consent. Confirm joint comfort, pelvic-impact preference, balance support,
  stairs, and quiet-mode answers affect their stated safety or workout behaviour.
- Confirm back navigation returns by user-visible screen rather than stepping through every
  grouped question individually.
- On Your start, verify the available routes:
  - Check movement, then start the first session.
  - Start with one gentle session and defer the check-up.
  - Go to Home for now.
- Confirm onboarding never requires an account, equipment purchase, schedule setup, reminder,
  or notification permission.

## Home

- Confirm Home is the default tab after onboarding and after relaunch.
- Confirm the page behaves like a simple landing surface: greeting, one clear next action, and
  only the supporting information needed to take that action.
- Verify the primary action for each reachable state:
  - First session ready.
  - Baseline Movement Check-Up due.
  - Saved check-up draft ready to continue.
  - Normal training day.
  - Week-4, week-8, or week-12 check-up due.
  - Clean return after a long gap.
- Confirm starting a workout goes directly into the voice-guided session flow without an
  extra workout browser or session-preview page.
- Confirm the Settings icon is reachable, labelled, and returns to the same shell cleanly.

## Plan

- Before a baseline, confirm Plan explains the short preparation sequence without duplicating
  Home's primary action.
- With an active journey, confirm Plan shows the 12-week structure, current four-week phase,
  current Strength or Balance focus, weekly rhythm, and three session rows.
- Confirm completed, next, and planned session states update correctly after each completion.
- Confirm the weekly message treats three sessions as planned and two as enough.
- At a four-week checkpoint, confirm Plan identifies the Movement Check-Up as next and directs
  the user back to Home rather than adding a second competing action.
- With health-data consent declined or Gentle Start active, confirm Plan explains why the
  camera check-up is unavailable while sessions remain available.
- After all three phases, confirm Plan shows a calm completed state with no extra controls or
  gamification.

## Voice-Guided Session

- Start the first session and a normal later session from Home.
- Confirm ready-gating and voice guidance work without requiring touch once the session begins.
- Confirm only the essential live controls are visible and have clear accessibility labels.
- Confirm pausing, resuming, leaving, and returning behave safely; leaving must not award a
  completion.
- Confirm the chosen Clara or Marcus voice is used and only one line plays at a time.
- Confirm stale lower-priority prompts do not queue behind a newer instruction.
- Confirm zero-equipment substitutions remain playable and missing stairs or optional equipment
  never blocks a session.
- Complete the session and answer the single effort question, then confirm the app returns to
  Home unless a safety/technique progression gateway genuinely requires acknowledgement.
- Confirm completion is credited once, Plan advances once, and relaunch preserves the result.

## Movement Check-Up

- Start from Home with camera permission undetermined. Confirm the permission request appears
  over a static explanation before the camera battery mounts.
- Deny permission, then allow it from system settings. Confirm recovery is clear and does not
  crash or trap the user.
- Confirm the official battery uses the current Strength and Balance protocol and never exposes
  legacy V1 routes in the normal build.
- Confirm setup guidance is voice-first, includes safe support language, and never critiques form.
- Confirm the first 1–2 seconds of unstable tracking do not count movement.
- Leave the frame during a rep or hold. Confirm interruption is explicit and state resets safely
  instead of double-counting on re-entry.
- Test warm, dim lighting. Confirm poor confidence/stability produces the main-light prompt.
- Confirm no camera image, video, or raw landmark recording is visible or saved in a normal build.
- Cancel before completion. Confirm no official result or programme advancement is created.
- Complete the battery. Confirm Strength and Balance measurements save locally and the result
  appears only after successful official materialisation.

## Everyday Clarity

- After an official check-up, confirm Everyday Clarity is clearly optional.
- Answer all five items and save. Confirm the result appears on Progress as a personal monthly
  trend and does not change the workout plan or movement result.
- Answer only some items. Confirm the app explains that the five answers save only as a complete
  set and still allows continuing without them.
- Open optional context and test sleep plus symptom context where applicable.
- Choose Skip this time. Confirm the check-up still completes normally and no Clarity score is
  fabricated.

## Results

- After the first check-up, confirm the fresh results page is concise and makes the next action
  obvious.
- Confirm Strength and Balance lead; there is no composite Movement Age, diagnosis, weakest-domain
  label, or unsupported improvement claim.
- Confirm the result can be dismissed once and does not insert an extra plan-creation step.
- Enable published-value comparisons in Settings. Confirm only eligible results gain appropriate
  age/sex reference context; missing reference data remains raw-only.
- Open a saved result from Progress. Confirm it is read-only, detailed, and returns cleanly.

## Progress

- With no official check-up, confirm Progress explains that results will appear after a check-up
  and points back to Home.
- With one check-up, confirm the latest Strength/Balance profile, date, focus, and full-results
  link appear without implying that a low result is a failure.
- With two or more comparable check-ups, confirm change over time appears and any lower reading
  includes supportive, trainable context.
- Confirm Everyday Clarity appears only when a complete saved response exists.
- Expand check-up history. Confirm earlier entries open the correct saved read-only result and
  the latest result is not duplicated in the earlier-history list.
- Confirm Progress does not contain plan management, workout browsing, or Settings controls
  beyond the header entry point.

## Settings

- Open and close each MVP section: Your profile, Workout & voice, Safety & camera, and Privacy & data.
- Change name and reference details; relaunch and confirm they persist locally.
- Change starting effort and trainer voice; preview both voices and confirm the selected voice is
  used in the next session/check-up.
- Change balance support, low-impact, quiet-mode, and stairs preferences; confirm the stated
  workout or check-up behaviour changes.
- Open camera setup and return without becoming trapped behind the tab shell.
- Toggle published-value comparisons and confirm the setting affects eligible results only.
- Clear local data. Confirm onboarding returns and check-ups, plans, sessions, Clarity responses,
  drafts, and preferences are removed for the current local scope.
- In a release-like build, confirm developer sample-data controls and diagnostic/internal flags
  are absent.

## Routing, Persistence, and Recovery

- Relaunch during onboarding. Confirm the app resumes safely without corrupting grouped answers.
- Relaunch with a saved check-up draft. Confirm Home offers to continue it.
- Relaunch during or after an abandoned workout. Confirm no duplicate session credit is created.
- Background and foreground the app during a session and check-up. Confirm audio, tracking, and
  timers pause or recover safely.
- Enter and exit Settings, camera setup, fresh results, saved results, session, effort, and
  check-up flows repeatedly. Confirm the tab bar appears only on Home / Plan / Progress and the
  selected tab remains coherent.
- Test with missing/minimal legacy local files. Confirm defaults are backfilled and the app offers
  the next safe action rather than crashing.
- Confirm local data remains separated when switching between guest and signed-in scopes.

## Accessibility and Visual QA

- Test a compact phone and a large phone in portrait orientation.
- Test large text/display zoom. Confirm headings, option cards, result rows, and buttons do not
  overlap, truncate essential meaning, or become unreachable.
- Confirm every action has a readable label and at least a 44-point touch target.
- Confirm icon-only Settings and back buttons have useful accessibility labels.
- Confirm selected options, expanded history, disabled actions, session controls, and progress
  states are announced meaningfully.
- Confirm each screen has one dominant primary action unless it is explicitly presenting a small
  set of start choices.
- Confirm the new logo, app icons, backgrounds, hero art, typography, and three-tab navigation
  render consistently without transparent seams, unexpected dark blocks, or low contrast.

## Physical-Device Evidence

- Record the device, OS, build, commit, result, and privacy-safe notes in
  `docs/qa/PEARL_CLOSED_BETA_PHYSICAL_DEVICE_QA_PROTOCOL.md`.
- At minimum cover one mid-range Android device and one supported iPhone before treating the MVP
  as device-validated.
- Public release remains blocked until the physical-device protocol and store-release checks are
  complete.
