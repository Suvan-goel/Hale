/**
 * Lightweight bottom tab bar. The app navigates with a small amount of state in
 * App.tsx (no heavy navigation dependency — consistent with the existing
 * hand-rolled screen switching and CLAUDE.md's caution on native deps). The bar
 * shows only on the four "chrome" tabs; hands-free session flows take the whole
 * screen and hide it.
 */

import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, minTapTarget, radius, shadow, spacing, type } from '../theme';
import { ExploreIcon, IconProps, PlanIcon, ProgressIcon, TodayIcon } from './icons';

export type TabKey = 'today' | 'plan' | 'progress' | 'explore';

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
];

export function TabBar({ active, onChange }: { active: TabKey; onChange: (key: TabKey) => void }) {
  return (
    <View style={styles.bar}>
      {TAB_DEFS.map((tab) => {
        const selected = tab.key === active;
        const tint = selected ? colors.accent : colors.textMuted;
        const labelTint = selected ? colors.accent : colors.textMuted;
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
              <tab.Icon color={tint} strokeWidth={selected ? 2.1 : 1.8} />
            </View>
            <View style={[styles.activeLine, selected && styles.activeLineVisible]} />
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
    backgroundColor: '#FCFAF6',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E4DCCE',
    paddingTop: spacing.md,
    paddingBottom: spacing.xl, // home-indicator breathing room
    ...shadow.soft,
    shadowOpacity: 0.012,
    shadowRadius: 6,
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
    width: 38,
    height: 26,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeLine: {
    width: 18,
    height: 2,
    borderRadius: radius.pill,
    backgroundColor: 'transparent',
  },
  activeLineVisible: { backgroundColor: colors.accent },
  label: {
    ...type.caption,
    fontSize: 12,
    lineHeight: 16,
    textTransform: 'none',
  },
  labelActive: {
    fontFamily: type.button.fontFamily,
  },
});
