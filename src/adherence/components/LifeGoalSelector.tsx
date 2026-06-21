import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Input, PrimaryButton, SecondaryButton } from '../../components/ui';
import { colors, fonts, radius, shadow, spacing, type } from '../../theme';
import { LIFE_GOAL_PRESETS, createLifeGoal } from '../goalDomainMapping';
import type { LifeGoal, LifeGoalCategory } from '../types';

const LIFE_GOAL_HINTS: Record<LifeGoalCategory, string> = {
  grandchildren: 'Build strength and mobility for getting low, standing up, and keeping pace.',
  stairs: 'Support leg power and steady confidence on steps.',
  travel: 'Prepare for walking, carrying, and moving comfortably away from home.',
  walking_hiking_sport: 'Support the strength and balance that keep outings enjoyable.',
  gardening_hobbies: 'Keep everyday bending, reaching, and lifting comfortable.',
  floor_confidence: 'Build the strength and mobility used getting down and back up.',
  carrying_loads: 'Support everyday strength for bags, groceries, and home tasks.',
  independence: 'Keep strength, balance, and mobility working together.',
  noticed_decline: 'Start where your Movement Check-Up says support matters most.',
  custom: 'Tell Hale what staying capable means to you.',
};

export function LifeGoalSelector({
  initialGoal,
  onSave,
  onCancel,
}: {
  initialGoal?: LifeGoal | null;
  onSave: (goal: LifeGoal) => void;
  onCancel?: () => void;
}) {
  const [selected, setSelected] = React.useState<LifeGoalCategory>(initialGoal?.category ?? 'stairs');
  const [customText, setCustomText] = React.useState(initialGoal?.customText ?? '');
  const canSave = selected !== 'custom' || customText.trim().length > 2;

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

      {selected === 'custom' ? (
        <Input
          label="Your reason"
          value={customText}
          onChangeText={setCustomText}
          placeholder="Write your own reason"
          multiline
          accessibilityLabel="Custom life goal"
        />
      ) : null}

      <View style={styles.actions}>
        <PrimaryButton
          title="Continue"
          onPress={() => {
            if (!canSave) return;
            onSave(createLifeGoal({ category: selected, customText }));
          }}
          disabled={!canSave}
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
  return (
    <Pressable
      style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.pressed]}
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
