import { TAB_DEFS } from '../TabBar';

describe('TabBar V1 navigation', () => {
  it('exposes the four main Hale V1 tabs', () => {
    expect(TAB_DEFS.map((tab) => tab.key)).toEqual(['today', 'plan', 'progress', 'explore']);
    expect(TAB_DEFS.map((tab) => tab.label)).toEqual(['Today', 'Plan', 'Progress', 'Explore']);
  });

  it('keeps settings out of the bottom tab bar', () => {
    expect(TAB_DEFS.map((tab) => tab.key)).not.toContain('settings');
    expect(TAB_DEFS.map((tab) => tab.label)).not.toContain('Settings');
  });
});
