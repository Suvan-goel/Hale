import { nextMeasurementTrackingSfxState } from '../sessionSfx';

describe('measurement tracking sound-effect state', () => {
  it('stays silent while a measurement is not active', () => {
    expect(
      nextMeasurementTrackingSfxState('active', {
        measurementActive: false,
        trackingOk: false,
      })
    ).toEqual({ state: 'idle', cue: null });
  });

  it('does not play recovered when tracking becomes valid for the first time', () => {
    const waiting = nextMeasurementTrackingSfxState('idle', {
      measurementActive: true,
      trackingOk: false,
    });
    expect(waiting).toEqual({ state: 'idle', cue: null });

    expect(
      nextMeasurementTrackingSfxState(waiting.state, {
        measurementActive: true,
        trackingOk: true,
      })
    ).toEqual({ state: 'active', cue: null });
  });

  it('plays paused and recovered only around a real in-measurement tracking loss', () => {
    const paused = nextMeasurementTrackingSfxState('active', {
      measurementActive: true,
      trackingOk: false,
    });
    expect(paused).toEqual({ state: 'paused', cue: 'tracking-paused' });

    expect(
      nextMeasurementTrackingSfxState(paused.state, {
        measurementActive: true,
        trackingOk: false,
      })
    ).toEqual({ state: 'paused', cue: null });

    expect(
      nextMeasurementTrackingSfxState(paused.state, {
        measurementActive: true,
        trackingOk: true,
      })
    ).toEqual({ state: 'active', cue: 'tracking-recovered' });
  });
});
