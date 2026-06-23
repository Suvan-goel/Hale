/**
 * Lightweight floating bottom tab bar. The app navigates with a small amount of state in
 * App.tsx (no heavy navigation dependency — consistent with the existing
 * hand-rolled screen switching and CLAUDE.md's caution on native deps). The bar
 * shows only on the four primary tabs; hands-free session flows take the whole
 * screen and hide it.
 */

import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { ExploreIcon, HomeIcon, IconProps, PlanIcon, ProgressIcon } from './icons';

export type TabKey = 'today' | 'plan' | 'progress' | 'explore';
export type TabScreenName = 'TodayScreen' | 'PlanScreen' | 'ProgressScreen' | 'ExploreScreen';
export type TabIconName = 'HomeIcon' | 'PlanIcon' | 'ProgressIcon' | 'ExploreIcon';

export interface TabDef {
  key: TabKey;
  label: string;
  screen: TabScreenName;
  iconName: TabIconName;
  Icon: (p: IconProps) => React.JSX.Element;
}

export const TAB_DEFS: readonly TabDef[] = [
  { key: 'today', label: 'Home', screen: 'TodayScreen', iconName: 'HomeIcon', Icon: HomeIcon },
  { key: 'plan', label: 'Plan', screen: 'PlanScreen', iconName: 'PlanIcon', Icon: PlanIcon },
  { key: 'progress', label: 'Progress', screen: 'ProgressScreen', iconName: 'ProgressIcon', Icon: ProgressIcon },
  { key: 'explore', label: 'Explore', screen: 'ExploreScreen', iconName: 'ExploreIcon', Icon: ExploreIcon },
];

export const DEFAULT_TAB_KEY: TabKey = 'today';

export function isTabKey(value: unknown): value is TabKey {
  return typeof value === 'string' && TAB_DEFS.some((tab) => tab.key === value);
}

export function normalizeTabKey(value: unknown): TabKey {
  return isTabKey(value) ? value : DEFAULT_TAB_KEY;
}

export function getTabDef(key: TabKey): TabDef {
  return TAB_DEFS.find((tab) => tab.key === key) ?? TAB_DEFS[0];
}

export function TabBar({ active, onChange }: { active: TabKey; onChange: (key: TabKey) => void }) {
  const activeKey = normalizeTabKey(active);
  return (
    <View style={styles.tray}>
      <View style={styles.bar}>
        {TAB_DEFS.map((tab) => {
          const selected = tab.key === activeKey;
          const tint = selected ? colors.accentDeep : colors.textSecondary;
          return (
            <Pressable
              key={tab.key}
              style={({ pressed }) => [styles.tab, selected && styles.tabActive, pressed && styles.tabPressed]}
              onPress={() => onChange(tab.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={tab.label}
            >
              <View style={[styles.iconWrap, selected && styles.iconWrapActive]}>
                <tab.Icon size={selected ? 23 : 22} color={tint} strokeWidth={selected ? 2.05 : 1.75} />
              </View>
              <Text style={[styles.label, selected && styles.labelActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tray: {
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 74,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.panel,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    ...shadow.lifted,
    boxShadow: '0 0 22px rgba(17,20,18,0.055)',
    shadowOpacity: 0.055,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  tab: {
    flex: 1,
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.input,
    gap: spacing.xs,
    paddingHorizontal: 2,
    paddingVertical: spacing.xs,
  },
  tabActive: {
    backgroundColor: colors.background,
  },
  tabPressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
  iconWrap: {
    width: 32,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    transform: [{ translateY: -1 }],
  },
  label: {
    ...type.cardCaption,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 15,
    textTransform: 'none',
  },
  labelActive: {
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
  },
});
