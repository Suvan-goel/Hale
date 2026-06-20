import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import { Input, ListRow, PrimaryButton, SecondaryButton } from '../../components/ui';
import { colors, spacing } from '../../theme';
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
        {LIFE_GOAL_PRESETS.map((option) => {
          const active = option.category === selected;
          return (
            <ListRow
              key={option.category}
              title={option.label}
              subtitle={LIFE_GOAL_HINTS[option.category]}
              variant="inset"
              style={[styles.option, active && styles.optionActive]}
              onPress={() => setSelected(option.category)}
              accessibilityLabel={option.label}
              selected={active}
              leading={<View style={[styles.optionMark, active && styles.optionMarkActive]} />}
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
          title="Save my goal"
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

const styles = StyleSheet.create({
  wrap: { gap: spacing.lg },
  options: { gap: spacing.md },
  option: {
    minHeight: 82,
  },
  optionActive: { backgroundColor: colors.accentSoft, borderColor: colors.accentBorder },
  optionMark: {
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    backgroundColor: colors.surface,
  },
  optionMarkActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  actions: { gap: spacing.md },
});
