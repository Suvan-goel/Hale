/**
 * Lightweight bottom navigation dock. The app navigates with a small amount of state in
 * App.tsx (no heavy navigation dependency — consistent with the existing
 * hand-rolled screen switching and CLAUDE.md's caution on native deps). The bar
 * shows only on the primary tabs; hands-free session flows take the whole
 * screen and hide it. The three-item shell has one clear job per tab: act on
 * Home, understand the programme on
 * Plan, and review measured change on Progress.
 */

import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing, type } from '../theme';
import { HomeIcon, IconProps, PlanIcon, ProgressIcon } from './icons';

export type TabKey = 'today' | 'plan' | 'progress';
export interface TabDef {
  key: TabKey;
  label: string;
  Icon: (p: IconProps) => React.JSX.Element;
}

export const TAB_DEFS: readonly TabDef[] = [
  { key: 'today', label: 'Home', Icon: HomeIcon },
  { key: 'plan', label: 'Plan', Icon: PlanIcon },
  { key: 'progress', label: 'Progress', Icon: ProgressIcon },
];

export const TAB_BAR_MIN_HEIGHT = 62;
export const TAB_BAR_CONTENT_GAP = 0;
export const TAB_BAR_SCROLL_CLEARANCE =
  TAB_BAR_MIN_HEIGHT + spacing.lg + TAB_BAR_CONTENT_GAP;

export function TabBar({
  active,
  onChange,
  bottomInset = 0,
}: {
  active: TabKey;
  onChange: (key: TabKey) => void;
  bottomInset?: number;
}) {
  return (
    <View
      style={[styles.tray, bottomInset > 0 && { paddingBottom: spacing.sm + bottomInset }]}
    >
      <View style={styles.contentRail}>
        <View style={styles.bar}>
          {TAB_DEFS.map((tab) => {
            const selected = tab.key === active;
            const tint = selected ? colors.accentDeep : colors.textTertiary;
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
    </View>
  );
}

const styles = StyleSheet.create({
  tray: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.navigationDivider,
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: spacing.sm,
  },
  contentRail: {
    width: '100%',
    maxWidth: spacing.pageMaxWidth,
    paddingHorizontal: spacing.lg,
  },
  bar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: TAB_BAR_MIN_HEIGHT,
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.xs,
  },
  tab: {
    flex: 1,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: 2,
    paddingVertical: 3,
  },
  tabActive: {
    opacity: 1,
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
    transform: [{ translateY: -1 }, { scale: 1.03 }],
  },
  label: {
    ...type.cardCaption,
    color: colors.textTertiary,
    fontSize: 11,
    lineHeight: 14,
    textTransform: 'none',
  },
  labelActive: {
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
  },
});
