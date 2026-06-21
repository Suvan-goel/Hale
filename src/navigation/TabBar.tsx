/**
 * Lightweight floating bottom tab bar. The app navigates with a small amount of state in
 * App.tsx (no heavy navigation dependency — consistent with the existing
 * hand-rolled screen switching and CLAUDE.md's caution on native deps). The bar
 * shows only on the four primary tabs; hands-free session flows take the whole
 * screen and hide it.
 */

import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { shadow, spacing, todayHomeColors, type } from '../theme';
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
    <View style={styles.tray}>
      <View style={styles.bar}>
        {TAB_DEFS.map((tab) => {
          const selected = tab.key === active;
          const tint = selected ? todayHomeColors.tabActive : todayHomeColors.mutedText;
          const labelTint = selected ? todayHomeColors.tabActive : todayHomeColors.mutedText;
          return (
            <Pressable
              key={tab.key}
              style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
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
    </View>
  );
}

const styles = StyleSheet.create({
  tray: {
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 14,
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: todayHomeColors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: todayHomeColors.border,
    borderRadius: 28,
    paddingHorizontal: spacing.xs,
    paddingTop: 6,
    paddingBottom: 8,
    ...shadow.lifted,
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
  tab: {
    flex: 1,
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    gap: spacing.xs,
  },
  tabPressed: {
    opacity: 0.72,
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
