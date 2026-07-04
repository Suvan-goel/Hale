import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton, SecondaryButton } from '../../components/ui';
import { colors, fonts, radius, shadow, spacing, type } from '../../theme';
import { useResponsiveLayout } from '../../theme/responsive';
import { LIFE_GOAL_PRESETS, createLifeGoal } from '../goalDomainMapping';
import type { LifeGoal, LifeGoalCategory } from '../types';

export function LifeGoalSelector({
  initialGoal,
  onSave,
  onCancel,
  primaryLabel = 'Continue',
}: {
  initialGoal?: LifeGoal | null;
  onSave: (goal: LifeGoal) => void;
  onCancel?: () => void;
  primaryLabel?: string;
}) {
  const [selected, setSelected] = React.useState<LifeGoalCategory | null>(
    initialGoal?.category ?? null
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.options}>
        {LIFE_GOAL_PRESETS.map((option) => {
          const active = option.category === selected;
          return (
            <GoalOptionCard
              key={option.category}
              title={option.label}
              detail={option.hint}
              selected={active}
              onPress={() => setSelected(option.category)}
            />
          );
        })}
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          title={primaryLabel}
          disabled={selected === null}
          onPress={() => {
            if (selected === null) return;
            onSave(createLifeGoal({ category: selected }));
          }}
        />
        {onCancel ? <SecondaryButton title="Not now" onPress={onCancel} /> : null}
      </View>
    </View>
  );
}

function GoalOptionCard({
  title,
  detail,
  selected,
  onPress,
}: {
  title: string;
  detail: string;
  selected: boolean;
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
      accessibilityLabel={`${title}: ${detail}`}
    >
      <View style={[styles.optionRail, selected && styles.optionRailSelected]} />
      <View style={styles.optionCopy}>
        <Text style={[styles.optionTitle, selected && styles.optionTitleSelected]}>{title}</Text>
        <Text style={styles.optionDetail}>{detail}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.lg },
  options: { gap: spacing.md },
  option: {
    minHeight: 96,
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
  actions: { gap: spacing.md },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
