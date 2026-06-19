import { TAB_DEFS } from '../TabBar';

describe('TabBar V1 navigation', () => {
  it('exposes the five main Hale V1 tabs', () => {
    expect(TAB_DEFS.map((tab) => tab.key)).toEqual(['today', 'plan', 'progress', 'explore', 'profile']);
    expect(TAB_DEFS.map((tab) => tab.label)).toEqual(['Today', 'Plan', 'Progress', 'Explore', 'Profile']);
  });

  it('keeps settings as the profile destination rather than a separate bottom tab', () => {
    expect(TAB_DEFS.map((tab) => tab.key)).not.toContain('settings');
  });
});
