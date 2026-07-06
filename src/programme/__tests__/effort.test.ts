import { effortFromRpe } from '../effort';

describe('effortFromRpe (C9 ruling: reuse the existing RPE channel, tap-first)', () => {
  it('maps easy sessions to lots, the target zone to a_few, max effort to none', () => {
    expect(effortFromRpe(1)).toBe('lots');
    expect(effortFromRpe(2)).toBe('lots');
    expect(effortFromRpe(3)).toBe('a_few');
    expect(effortFromRpe(4)).toBe('a_few');
    expect(effortFromRpe(5)).toBe('none');
  });

  it('keeps unanswered effort unanswered (conservative: no promotion on unknown)', () => {
    expect(effortFromRpe(null)).toBeNull();
    expect(effortFromRpe(undefined)).toBeNull();
  });
});
