/**
 * Source-level wiring parity for VoiceSessionScreen (founder requirement 1):
 * the screen must delegate every side contract to the tested controller and
 * honor the mic gate — pinned the same way other screen wiring is
 * (sessionSfxWiring-style source assertions), on top of the controller's
 * headless behavior tests.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const screenSource = readFileSync(
  join(process.cwd(), 'src/screens/VoiceSessionScreen.tsx'),
  'utf8'
);
const shellSource = readFileSync(join(process.cwd(), 'src/screens/ProgrammeV2Root.tsx'), 'utf8');

describe('VoiceSessionScreen side-contract wiring', () => {
  it('shows the instructional graphic before the user starts each movement', () => {
    expect(screenSource).toContain("import { ExerciseDemoGraphic }");
    expect(screenSource).toContain("snapshot.phase === 'instructions'");
    expect(screenSource).toContain("snapshot.phase === 'waiting_ready'");
    expect(screenSource).toContain('<ExerciseDemoGraphic');
  });

  it('records abandonment on unmount via the controller (idempotent path)', () => {
    expect(screenSource).toMatch(/return \(\) => \{[^}]*controller\.recordAbandonment\(\)/s);
  });

  it('threads resume snapshots and completion through controller options', () => {
    expect(screenSource).toContain('onItemCompleted: (items) => onItemCompleted?.(items)');
    expect(screenSource).toContain('onComplete(result)');
  });

  it('drives the player only through controller.tick and speaks its cues', () => {
    expect(screenSource).toContain('controller.tick(Date.now(), voice.busy)');
    expect(screenSource).toContain('voice.speak(u.voice.cues, u.voice.priority)');
    expect(screenSource).not.toMatch(/player\.(update|tick)\(/);
  });

  it('matches transcripts against the policy-gated intent set only', () => {
    expect(screenSource).toContain('matchIntent(payload.transcript, controller.enabledIntents(voice.busy))');
    expect(screenSource).toMatch(/if \(!active \|\| !payload\.isFinal\) return/);
  });

  it('mic gate: prompt/decline both mark promptShown (asked once, ever)', () => {
    const marks = screenSource.match(/promptShown: true/g) ?? [];
    expect(marks.length).toBeGreaterThanOrEqual(2); // accept + decline paths
    expect(screenSource).toContain('decideVoiceGate');
  });

  it('every voice intent has a tap control on the surface', () => {
    for (const action of ["'ready'", "'done'", "'skip'", "'repeat'", "'pause'", "'resume'", "'pain'", "'skip_rest'"]) {
      expect(screenSource).toContain(`handleTap(${action}`);
    }
    expect(screenSource).toContain("handleTap('adjust_reps_down')");
    expect(screenSource).toContain("handleTap('adjust_reps_up')");
  });

  it('stop intent surfaces the end confirm, never silent termination', () => {
    expect(screenSource).toContain('snapshot.stopRequested');
    expect(screenSource).toContain('End this session?');
  });

  it('keeps every available session control visible without disclosure menus', () => {
    expect(screenSource).toContain('title="Something hurts"');
    expect(screenSource).toContain('title="Repeat instructions"');
    expect(screenSource).toContain('title="Skip exercise"');
    expect(screenSource).toContain('ADJUST LAST SET');
    expect(screenSource).toContain('Other controls');
    expect(screenSource).toContain('<SessionControlButton');
    expect(screenSource).not.toContain('SessionDisclosure');
    expect(screenSource).not.toContain('title="More options"');
    expect(screenSource).not.toContain('accessibilityState={{ expanded: open }}');
    expect(screenSource).not.toContain('bonusOfferPending');
    expect(screenSource).not.toContain('title="One more set"');
    expect(screenSource).not.toContain("'No thanks — move on'");
  });
});

describe('v2 shell session-mode wiring', () => {
  // The old shell's camera-conducted flag branch, pain-exclusion fold, and
  // App-level final-adjustment window retired with promotion commit 2
  // (2026-07-08): pain exclusions are deferred by the Pain A ruling (§12
  // regression is v1's answer), rep adjustments live in the player's own
  // windows (tap parity pinned above), and the conductor surface
  // (TrainingSessionScreen) was deleted outright on founder direction
  // (2026-07-08) — recoverable from git history if v2 revives it.
  it('voice is the only mounted session surface (conductor deleted)', () => {
    expect(shellSource).toContain('<VoiceSessionScreen');
    expect(shellSource).not.toContain('TrainingSessionScreen');
    expect(shellSource).not.toContain('bonusSetOffer={inputs.bonusSetOffer}');
  });

  it('voiceSetup prefs persist through the profile store', () => {
    expect(shellSource).toContain('voiceSetup={voiceSetup}');
    expect(shellSource).toMatch(/settings: \{ \.\.\.current\.settings, voiceSetup: next \}/);
  });

  it('uses the real voice-paced player for a non-persistent onboarding preview', () => {
    expect(shellSource).toContain("experience=\"preview\"");
    expect(shellSource).toContain('exerciseIds={[PROGRAMME_PREP_ITEM_ID]}');
    expect(shellSource).toContain('secondsPerSet: 30');
    expect(screenSource).toContain('isPreview ? createMemoryFs() : createExpoSessionFunnelFs({ userId })');
    expect(screenSource).toContain("? ({ kind: 'tap_only' } as const)");
    expect(screenSource).toContain('Nothing was added to your programme');

    const preview = shellSource.slice(
      shellSource.indexOf('function ProgrammeSessionPreview'),
      shellSource.indexOf('function ProgrammeVoiceSession')
    );
    expect(preview).not.toContain('markFirstSessionStarted');
    expect(preview).not.toContain('programmeResultsFromVoiceSession');
  });

  it('returns routine completion Home and interrupts only for a technique gateway', () => {
    expect(shellSource).toContain("setPhase(gatewaySurface ? 'session_done' : 'home')");
    expect(shellSource).toContain('Only a technique');
    expect(shellSource).not.toContain("surface.kind === 'deferred_reoffer'");
    expect(shellSource).not.toContain("surface.kind === 'skipped_warm_reoffer'");
    expect(shellSource).not.toContain("surface.kind === 'session_logged'");
  });
});
