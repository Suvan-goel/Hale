import {
  broadSetupValidTimeConfigForTarget,
  createValidTimeAccumulator,
  getValidTimeResult,
  validTimeCaptionForState,
} from '../validTime';

describe('ValidTimeAccumulator', () => {
  function create() {
    return createValidTimeAccumulator({
      targetValidMs: 600,
      startValidAfterMs: 200,
      resumeValidAfterMs: 300,
      invalidGraceMs: 100,
      pauseAfterInvalidMs: 400,
      safetyCapMs: 3000,
    });
  }

  it('waits for the start debounce before counting valid time', () => {
    const acc = create();
    expect(acc.update(valid(0)).state).toBe('waiting_for_position');
    expect(acc.update(valid(199)).state).toBe('waiting_for_position');
    const started = acc.update(valid(200));
    expect(started.state).toBe('counting');
    expect(started.accumulatedValidMs).toBe(0);
    expect(acc.update(valid(300)).accumulatedValidMs).toBe(100);
  });

  it('does not pause for transient invalid jitter inside grace', () => {
    const acc = create();
    acc.update(valid(0));
    acc.update(valid(200));
    acc.update(valid(300));
    expect(acc.update(invalid(350)).state).toBe('grace');
    const resumed = acc.update(valid(450));
    expect(resumed.state).toBe('counting');
    expect(resumed.pauseCount).toBe(0);
    expect(resumed.accumulatedValidMs).toBe(100);
  });

  it('pauses after sustained invalid position and resumes after valid debounce', () => {
    const acc = create();
    acc.update(valid(0));
    acc.update(valid(200));
    acc.update(valid(500));
    expect(acc.snapshot.accumulatedValidMs).toBe(300);

    acc.update(invalid(600));
    const paused = acc.update(invalid(1000));
    expect(paused.state).toBe('paused');
    expect(paused.pauseCount).toBe(1);
    expect(paused.positionLostEvents).toBe(1);

    expect(acc.update(valid(1100)).state).toBe('paused');
    const resumed = acc.update(valid(1400));
    expect(resumed.state).toBe('counting');
    expect(resumed.accumulatedValidMs).toBe(300);

    const complete = acc.update(valid(1700));
    expect(complete.state).toBe('complete');
    expect(complete.completedByValidTime).toBe(true);
    expect(complete.accumulatedValidMs).toBe(600);
    expect(complete.longestContinuousValidMs).toBe(300);
  });

  it('tracks reliable-frame loss separately from position loss', () => {
    const acc = create();
    acc.update(valid(0));
    acc.update(valid(200));
    acc.update(valid(400));
    acc.update({ nowMs: 500, isPositionValid: false, isTrackingReliable: false });
    acc.update({ nowMs: 800, isPositionValid: false, isTrackingReliable: false });
    expect(acc.snapshot.trackingLostMs).toBe(400);
    expect(acc.snapshot.positionLostEvents).toBe(1);
  });

  it('ends by safety cap without pretending the target was reached', () => {
    const acc = createValidTimeAccumulator({
      targetValidMs: 1000,
      startValidAfterMs: 100,
      resumeValidAfterMs: 100,
      invalidGraceMs: 100,
      pauseAfterInvalidMs: 200,
      safetyCapMs: 500,
    });
    acc.update(invalid(0));
    const ended = acc.update(invalid(500));
    expect(ended.state).toBe('safety_cap');
    expect(ended.endedBySafetyCap).toBe(true);
    expect(ended.completedByValidTime).toBe(false);
    expect(getValidTimeResult(ended, 1000).endedBySafetyCap).toBe(true);
  });

  it('supports forgiving broad setup timing and metadata', () => {
    const acc = createValidTimeAccumulator({
      ...broadSetupValidTimeConfigForTarget(1000),
      safetyCapMs: 10000,
    });
    expect(acc.update(valid(0)).state).toBe('waiting_for_position');
    expect(acc.update(valid(499)).state).toBe('waiting_for_position');
    expect(acc.update(valid(500)).state).toBe('counting');
    acc.update(valid(1000));

    expect(acc.update(invalid(1100)).state).toBe('grace');
    expect(acc.update(invalid(2600)).state).toBe('grace');
    expect(acc.update(invalid(3100)).state).toBe('paused');
    expect(acc.snapshot.pauseCount).toBe(1);

    expect(acc.update(valid(3200)).state).toBe('paused');
    expect(acc.update(valid(3700)).state).toBe('counting');
    const complete = acc.update(valid(4200));
    expect(complete.state).toBe('complete');

    const result = getValidTimeResult(complete, 1000, 'broad_setup_gated');
    expect(result.validationMode).toBe('broad_setup_gated');
    expect(result.completedByValidTime).toBe(true);
  });

  it('uses supportive captions only', () => {
    const copy = [
      validTimeCaptionForState('waiting_for_position'),
      validTimeCaptionForState('counting'),
      validTimeCaptionForState('counting', 'broad_setup_gated'),
      validTimeCaptionForState('paused'),
      validTimeCaptionForState('complete'),
    ].join(' ');
    expect(copy).not.toMatch(/failed|invalid|bad|wrong|poor score|fall risk|frailty|diagnosis|treatment/i);
    expect(copy).toContain('Timer paused - return to position');
    expect(copy).toContain('Keep moving');
  });
});

function valid(nowMs: number) {
  return { nowMs, isPositionValid: true, isTrackingReliable: true };
}

function invalid(nowMs: number) {
  return { nowMs, isPositionValid: false, isTrackingReliable: true };
}
