/**
 * Rail-accented selectable card — the LifeGoalSelector option pattern, shared
 * so every tappable-answer surface (programme onboarding, effort check-in)
 * renders the same design language. Presentation only; no copy, no logic.
 */

import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { useResponsiveLayout } from '../theme/responsive';

export function OptionCard({
  label,
  microcopy,
  selected = false,
  onPress,
}: {
  label: string;
  microcopy?: string;
  selected?: boolean;
  onPress: () => void;
}) {
  const responsive = useResponsiveLayout();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.option,
        responsive.isCompactPhone && styles.compactCardPadding,
        selected && styles.optionSelected,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={microcopy ? `${label}: ${microcopy}` : label}
    >
      <View style={[styles.optionRail, selected && styles.optionRailSelected]} />
      <View style={styles.optionCopy}>
        <Text style={[styles.optionTitle, selected && styles.optionTitleSelected]}>{label}</Text>
        {microcopy ? <Text style={styles.optionDetail}>{microcopy}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  compactCardPadding: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  optionSelected: {
    backgroundColor: colors.bgGold,
  },
  optionRail: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: radius.pill,
    backgroundColor: colors.background,
  },
  optionRailSelected: {
    backgroundColor: colors.accentDeep,
  },
  optionCopy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  optionTitle: {
    ...type.bodySmall,
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  optionTitleSelected: {
    color: colors.accentDeep,
  },
  optionDetail: {
    ...type.cardBody,
    color: colors.textSecondary,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
});
