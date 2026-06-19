/**
 * Lightweight bottom tab bar. The app navigates with a small amount of state in
 * App.tsx (no heavy navigation dependency — consistent with the existing
 * hand-rolled screen switching and CLAUDE.md's caution on native deps). The bar
 * shows only on the five "chrome" tabs; hands-free session flows take the whole
 * screen and hide it.
 */

import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { minTapTarget, shadow, spacing, todayHomeColors, type } from '../theme';
import { ExploreIcon, IconProps, PlanIcon, ProfileIcon, ProgressIcon, TodayIcon } from './icons';

export type TabKey = 'today' | 'plan' | 'progress' | 'explore' | 'profile';

export interface TabDef {
  key: TabKey;
  label: string;
  Icon: (p: IconProps) => React.JSX.Element;
}

export const TAB_DEFS: readonly TabDef[] = [
  { key: 'today', label: 'Today', Icon: TodayIcon },
  { key: 'plan', label: 'Plan', Icon: PlanIcon },
  { key: 'progress', label: 'Progress', Icon: ProgressIcon },
  { key: 'explore', label: 'Explore', Icon: ExploreIcon },
  { key: 'profile', label: 'Profile', Icon: ProfileIcon },
];

export function TabBar({ active, onChange }: { active: TabKey; onChange: (key: TabKey) => void }) {
  return (
    <View style={styles.bar}>
      {TAB_DEFS.map((tab) => {
        const selected = tab.key === active;
        const tint = selected ? todayHomeColors.tabActive : todayHomeColors.mutedText;
        const labelTint = selected ? todayHomeColors.tabActive : todayHomeColors.mutedText;
        return (
          <Pressable
            key={tab.key}
            style={styles.tab}
            onPress={() => onChange(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={tab.label}
          >
            <View style={styles.iconWrap}>
              <tab.Icon size={23} color={tint} strokeWidth={selected ? 2.1 : 1.8} />
            </View>
            <Text style={[styles.label, selected && styles.labelActive, { color: labelTint }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: todayHomeColors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: todayHomeColors.border,
    paddingTop: 10,
    paddingBottom: 18, // home-indicator breathing room
    ...shadow.soft,
    shadowOpacity: 0.02,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
  },
  tab: {
    flex: 1,
    minHeight: minTapTarget,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  iconWrap: {
    width: 36,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...type.caption,
    fontSize: 13,
    lineHeight: 17,
    textTransform: 'none',
  },
  labelActive: {
    fontFamily: type.button.fontFamily,
  },
});
