import * as React from 'react';

import { ExploreIcon, HomeIcon, ProgressIcon } from '../icons';
import { DEFAULT_TAB_KEY, TAB_DEFS, TabBar, getTabDef, normalizeTabKey, type TabKey } from '../TabBar';

// Three tabs since the founder-directed simplification pass (2026-07-08):
// the Plan tab merged into Home, which already carried the levels card,
// session CTA, and check-up offer.
const CANONICAL_KEYS: readonly TabKey[] = ['today', 'progress', 'explore'];
const CANONICAL_LABELS = ['Home', 'Progress', 'Explore'];

function collectElements(
  node: React.ReactNode,
  predicate: (element: React.ReactElement) => boolean
): React.ReactElement[] {
  const matches: React.ReactElement[] = [];

  function visit(value: React.ReactNode): void {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!React.isValidElement(value)) return;

    if (predicate(value)) {
      matches.push(value);
    }

    const props = value.props as { children?: React.ReactNode };
    React.Children.forEach(props.children, visit);
  }

  visit(node);
  return matches;
}

describe('TabBar V1 navigation', () => {
  it('exposes the three main Hale V1 tabs', () => {
    expect(TAB_DEFS.map((tab) => tab.key)).toEqual(CANONICAL_KEYS);
    expect(TAB_DEFS.map((tab) => tab.label)).toEqual(CANONICAL_LABELS);
  });

  it('keeps settings and the merged plan surface out of the bottom tab bar', () => {
    expect(TAB_DEFS.map((tab) => tab.key)).not.toContain('settings');
    expect(TAB_DEFS.map((tab) => tab.label)).not.toContain('Settings');
    expect(TAB_DEFS.map((tab) => tab.key)).not.toContain('plan');
    expect(TAB_DEFS.map((tab) => tab.label)).not.toContain('Plan');
  });

  it('keeps Progress before Explore in the production configuration', () => {
    const keys = TAB_DEFS.map((tab) => tab.key);

    expect(keys.indexOf('progress')).toBeLessThan(keys.indexOf('explore'));
  });

  it('maps each route to its intended screen identity', () => {
    expect(TAB_DEFS.map((tab) => [tab.key, tab.screen])).toEqual([
      ['today', 'TodayScreen'],
      ['progress', 'ProgressScreen'],
      ['explore', 'ExploreScreen'],
    ]);
  });

  it('maps each route to its intended icon identity', () => {
    expect(TAB_DEFS.map((tab) => [tab.key, tab.iconName])).toEqual([
      ['today', 'HomeIcon'],
      ['progress', 'ProgressIcon'],
      ['explore', 'ExploreIcon'],
    ]);
    expect(getTabDef('today').Icon).toBe(HomeIcon);
    expect(getTabDef('progress').Icon).toBe(ProgressIcon);
    expect(getTabDef('explore').Icon).toBe(ExploreIcon);
  });

  it('has no duplicate or missing tab routes', () => {
    const keys = TAB_DEFS.map((tab) => tab.key);

    expect(new Set(keys).size).toBe(TAB_DEFS.length);
    expect(keys).toEqual(CANONICAL_KEYS);
  });

  it('uses Home as the default while preserving the stable today route key', () => {
    expect(DEFAULT_TAB_KEY).toBe('today');
    expect(normalizeTabKey('today')).toBe('today');
    expect(normalizeTabKey('progress')).toBe('progress');
    expect(normalizeTabKey('explore')).toBe('explore');
    expect(normalizeTabKey('settings')).toBe('today');
    expect(normalizeTabKey('plan')).toBe('today');
    expect(normalizeTabKey(2)).toBe('today');
    expect(getTabDef(DEFAULT_TAB_KEY).screen).toBe('TodayScreen');
  });

  it('renders accessible tab controls in canonical traversal order', () => {
    const tree = TabBar({ active: 'progress', onChange: jest.fn() });
    const tabs = collectElements(
      tree,
      (element) => (element.props as { accessibilityRole?: string }).accessibilityRole === 'tab'
    );

    expect(tabs.map((tab) => (tab.props as { accessibilityLabel?: string }).accessibilityLabel)).toEqual(
      CANONICAL_LABELS
    );
    expect(
      tabs.map((tab) => (tab.props as { accessibilityState?: { selected?: boolean } }).accessibilityState)
    ).toEqual([
      { selected: false },
      { selected: true },
      { selected: false },
    ]);
  });

  it('selecting each rendered tab calls back with the stable route key', () => {
    const selected: TabKey[] = [];
    const tree = TabBar({ active: DEFAULT_TAB_KEY, onChange: (key) => selected.push(key) });
    const tabs = collectElements(
      tree,
      (element) => (element.props as { accessibilityRole?: string }).accessibilityRole === 'tab'
    );

    tabs.forEach((tab) => {
      (tab.props as { onPress: () => void }).onPress();
    });

    expect(selected).toEqual(CANONICAL_KEYS);
  });
});
