import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton, SecondaryButton } from '../../components/ui';
import { colors, fonts, radius, shadow, spacing, type } from '../../theme';
import { useResponsiveLayout } from '../../theme/responsive';
import { LIFE_GOAL_PRESETS, createLifeGoal, type SelectableLifeGoalCategory } from '../goalDomainMapping';
import type { LifeGoal } from '../types';

const LIFE_GOAL_HINTS: Record<SelectableLifeGoalCategory, string> = {
  grandchildren: 'Practice getting low, standing back up, and keeping pace.',
  stairs: 'Build leg strength and steadiness for steps.',
  travel: 'Feel more ready for walking, carrying bags, and moving through new places.',
  walking_hiking_sport: 'Support the strength and balance that make walks feel easier.',
  gardening_hobbies: 'Support easier bending, reaching, and everyday movement.',
  floor_confidence: 'Build strength and mobility for getting down and standing back up.',
  carrying_loads: 'Support everyday strength for bags, groceries, and home tasks.',
  independence: 'Keep strength, balance, and mobility working together.',
  noticed_decline: 'Let your check-up show where support matters most.',
};

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
  const initialCategory = initialGoal?.category === 'custom' ? 'stairs' : initialGoal?.category ?? 'stairs';
  const [selected, setSelected] = React.useState<SelectableLifeGoalCategory>(initialCategory);

  return (
    <View style={styles.wrap}>
      <View style={styles.options}>
        {LIFE_GOAL_PRESETS.map((option, index) => {
          const active = option.category === selected;
          return (
            <GoalOptionCard
              key={option.category}
              number={index + 1}
              title={option.label}
              detail={LIFE_GOAL_HINTS[option.category]}
              selected={active}
              onPress={() => setSelected(option.category)}
            />
          );
        })}
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          title={primaryLabel}
          onPress={() => {
            onSave(createLifeGoal({ category: selected }));
          }}
        />
        {onCancel ? <SecondaryButton title="Not now" onPress={onCancel} /> : null}
      </View>
    </View>
  );
}

function GoalOptionCard({
  number,
  title,
  detail,
  selected,
  onPress,
}: {
  number: number;
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
      <View style={[styles.optionNumber, selected && styles.optionNumberSelected]}>
        <Text style={[styles.optionNumberText, selected && styles.optionNumberTextSelected]}>
          {number}
        </Text>
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
  optionNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  optionNumberSelected: {
    backgroundColor: colors.accentDeep,
  },
  optionNumberText: {
    ...type.cardCaption,
    fontFamily: fonts.sansMedium,
    color: colors.textSecondary,
  },
  optionNumberTextSelected: {
    color: colors.onAccent,
  },
  actions: { gap: spacing.md },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
