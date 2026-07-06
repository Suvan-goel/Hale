import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Source-wiring pins for the dual-task App glue (the accepted weaker tier —
 * the runtime/eligibility logic behind it is behavior-tested in
 * dualTaskRuntime.test.ts). Pins the CLARITY_INSTRUMENTS_TDD flow rules:
 * flag-dark, official-only, honest not-offered records, and the appendix
 * ordering (dual-task before the Clarity check-in).
 */

function source(file: string): string {
  return readFileSync(join(process.cwd(), file), 'utf8');
}

describe('dual-task flow wiring (DT2)', () => {
  const app = source('App.tsx');
  const screen = source('src/screens/DualTaskScreen.tsx');

  it('rides only official check-ups and only with the clarity flag on (dark otherwise)', () => {
    expect(app).toContain('if (isClarityDimensionEnabled()) {');
    expect(app).toContain('monitorAvailability: speechMonitorAvailability');
    // Flag off → straight to the check-in with NO instrument record.
    expect(app).toContain('setPendingClarityCheckIn(input);');
  });

  it('records not-offered outcomes honestly and orders the appendix before the check-in', () => {
    expect(app).toContain('setPendingClarityCheckIn(withDualTaskResult(input, eligibility.record))');
    expect(app).toContain("setFlow('dual-task')");
    expect(app).toContain('setPendingClarityCheckIn(withDualTaskResult(pending.input, result))');
  });

  it('uses the production monitor stub (PLANNED until device Block 7) — never a fake in production', () => {
    expect(app).toContain('defaultSpeechActivityMonitor()');
    expect(source('src/voice/speechActivity.ts')).toContain("Promise.resolve('unavailable')");
  });

  it('keeps the level-2 copy honest: presence-only listening, pauses fine, optional', () => {
    expect(screen).toContain("I only check that you're speaking, never what you say");
    expect(screen).toContain('Pauses to think are fine');
    expect(screen).toContain('it never changes your check-up results');
    // Tap parity + no-stall affordances.
    expect(screen).toContain('Skip this part');
    expect(screen).toContain('Stop and skip');
    expect(screen).toContain('deliver(skipRecord()), 20000');
  });
});
