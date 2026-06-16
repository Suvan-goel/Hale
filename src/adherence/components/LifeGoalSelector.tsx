import * as React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton, SecondaryButton } from '../../components/ui';
import { colors, radius, spacing, type } from '../../theme';
import { LIFE_GOAL_PRESETS, createLifeGoal } from '../goalDomainMapping';
import type { LifeGoal, LifeGoalCategory } from '../types';

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
            <Pressable
              key={option.category}
              style={({ pressed }) => [styles.option, active && styles.optionActive, pressed && styles.pressed]}
              onPress={() => setSelected(option.category)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={option.label}
            >
              <Text style={[styles.optionText, active && styles.optionTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {selected === 'custom' ? (
        <TextInput
          style={styles.input}
          value={customText}
          onChangeText={setCustomText}
          placeholder="Write your own reason"
          placeholderTextColor={colors.textTertiary}
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
          style={!canSave ? styles.disabled : undefined}
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
    minHeight: 56,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderHairline,
  },
  optionActive: { backgroundColor: colors.bgSage, borderColor: colors.sage },
  optionText: { ...type.bodySmall, color: colors.textPrimary },
  optionTextActive: { color: colors.accentDeep },
  input: {
    ...type.body,
    minHeight: 92,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.borderHairline,
    backgroundColor: colors.bgSurface,
    padding: spacing.lg,
    textAlignVertical: 'top',
  },
  actions: { gap: spacing.md },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
