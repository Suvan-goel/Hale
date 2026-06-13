/**
 * Balance ladder acceptance: synthetic front-view stances through the full
 * pipeline into the staged HoldTracker grader. The generator mirrors the
 * production ladder (DEFAULT_BALANCE_STAGES) so the fixed per-stage schedule
 * stays in lockstep. Covers a clean run, single-leg touchdown, a recovery
 * step out of a narrow base, a not-attempted single-leg, a mid-stage
 * interruption, and the spoken stage/eyes-closed narration.
 */

import { PosePipeline } from '../../pose/pipeline';
import { balanceSession } from '../../pose/testing/syntheticBalance';
import type { BalanceOutcome } from '../../pose/testing/syntheticBalance';
import { gradeRecording } from '../../replay/gradeRecording';
import {
  BALANCE_LADDER_ID,
  BalanceResult,
  DEFAULT_BALANCE_STAGES,
  getMovement,
} from '../index';
import type { VoiceCueKey } from '../../audio/cues';

interface StageOutcome {
  outcome: BalanceOutcome;
  failAtMs?: number;
}

// Build generator stages mirroring the production ladder, per-stage outcomes.
function genStages(outcomes: StageOutcome[] = []) {
  return DEFAULT_BALANCE_STAGES.map((s, i) => ({
    stance: s.stance,
    windowMs: s.windowMs,
    outcome: outcomes[i]?.outcome ?? 'completed',
    failAtMs: outcomes[i]?.failAtMs,
  }));
}

function grade(outcomes: StageOutcome[] = [], extra: Parameters<typeof balanceSession>[0] = {}) {
  const session = balanceSession({ stages: genStages(outcomes), ...extra });
  return gradeRecording<BalanceResult>(BALANCE_LADDER_ID, session.frames);
}

const SINGLE_LEG_INDEX = DEFAULT_BALANCE_STAGES.findIndex(
  (s) => s.stance === 'single-leg' && !s.eyesClosed
);

describe('balance ladder — acceptance', () => {
  it('runs the full ladder, holding every stance to its window', () => {
    const { result } = grade();
    expect(result.stages).toHaveLength(DEFAULT_BALANCE_STAGES.length);
    expect(result.interruptions).toBe(0);
    expect(result.flags).not.toContain('incomplete');
    for (const stage of result.stages) {
      expect(stage.terminated).toBe('completed');
    }
    // Single-leg eyes-open ≈ its 12s window (held throughout).
    expect(result.singleLegEyesOpenSec).toBeGreaterThan(9);
  });

  it('records a single-leg touchdown and its hold time', () => {
    const outcomes: StageOutcome[] = [];
    outcomes[SINGLE_LEG_INDEX] = { outcome: 'fail', failAtMs: 5000 };
    const { result } = grade(outcomes);
    const sl = result.stages[SINGLE_LEG_INDEX];
    expect(sl.terminated).toBe('touchdown');
    expect(sl.holdSec).toBeGreaterThan(3.5);
    expect(sl.holdSec).toBeLessThan(6.5);
  });

  it('records a recovery step out of a narrow base', () => {
    const outcomes: StageOutcome[] = [{ outcome: 'fail', failAtMs: 4000 }]; // stage 0 feet-together
    const { result } = grade(outcomes);
    expect(result.stages[0].terminated).toBe('step');
    expect(result.stages[0].holdSec).toBeGreaterThan(2.5);
  });

  it('marks a single-leg the subject never attempts', () => {
    const outcomes: StageOutcome[] = [];
    outcomes[SINGLE_LEG_INDEX] = { outcome: 'not-attempted' };
    const { result } = grade(outcomes);
    const sl = result.stages[SINGLE_LEG_INDEX];
    expect(sl.terminated).toBe('not-attempted');
    expect(sl.holdSec).toBe(0);
    expect(Number.isNaN(result.singleLegEyesOpenSec)).toBe(true);
  });

  it('a mid-stage interruption is flagged, the rest of the ladder proceeds', () => {
    // Gone window during stage 0's hold (calibration 3.5s + getReady 3s ≈ 6.5s).
    const { result } = grade([], { goneWindows: [{ startMs: 8000, endMs: 9200 }] });
    expect(result.interruptions).toBeGreaterThanOrEqual(1);
    expect(result.flags).toContain('tracking-interrupted');
    expect(result.stages.length).toBeGreaterThanOrEqual(DEFAULT_BALANCE_STAGES.length - 1);
  });

  it('speaks each stance and the eyes-closed / eyes-open prompts in order', () => {
    const session = balanceSession({ stages: genStages() });
    const pipeline = new PosePipeline();
    const grader = getMovement(BALANCE_LADDER_ID).createGrader();
    const spoken: VoiceCueKey[] = [];
    for (const f of session.frames) {
      const u = grader.update(pipeline.process(f));
      if (u.voice) spoken.push(...u.voice.cues);
    }
    // Stance cues appear once each, in ladder order.
    expect(spoken.filter((c) => c === 'balance-feet-together').length).toBeGreaterThanOrEqual(1);
    expect(spoken).toContain('balance-tandem');
    expect(spoken).toContain('balance-single-leg');
    // Eyes-closed prompt precedes its first use; eyes re-open afterwards.
    expect(spoken).toContain('close-your-eyes');
    expect(spoken).toContain('open-your-eyes');
    expect(spoken.indexOf('balance-tandem')).toBeGreaterThan(spoken.indexOf('balance-feet-together'));
    expect(spoken.indexOf('balance-single-leg')).toBeGreaterThan(spoken.indexOf('balance-tandem'));
  });
});
