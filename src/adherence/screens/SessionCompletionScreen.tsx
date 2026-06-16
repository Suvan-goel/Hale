import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, PrimaryButton, Screen, ScreenHeader, SecondaryButton } from '../../components/ui';
import { colors, spacing, type } from '../../theme';
import { getProtectionCopy } from '../adherenceCopy';
import type { LifeGoal, MovementBlock, TrainingSessionCompletion } from '../types';

export function SessionCompletionScreen({
  block,
  lifeGoal,
  completion,
  onMicroCheck,
  onFeedback,
  onDone,
}: {
  block: MovementBlock;
  lifeGoal?: LifeGoal | null;
  completion?: TrainingSessionCompletion | null;
  onMicroCheck: () => void;
  onFeedback?: (feedback: { perceivedEffort?: 1 | 2 | 3 | 4 | 5; painReported?: boolean }) => void;
  onDone: () => void;
}) {
  const restarted = completion?.sessionType === 'restart';
  const [effort, setEffort] = React.useState<1 | 2 | 3 | 4 | 5 | undefined>(completion?.perceivedEffort);
  const [painReported, setPainReported] = React.useState(!!completion?.painReported);
  const finish = () => {
    onFeedback?.({ perceivedEffort: effort, painReported });
    onDone();
  };
  return (
    <Screen>
      <ScreenHeader
        eyebrow={restarted ? 'Restart complete' : 'Session complete'}
        title={restarted ? "You're back" : 'Progress protected'}
        subtitle={restarted ? "That's the important part." : getProtectionCopy({ lifeGoal, focusDomain: block.focusDomain })}
      />
      <Card style={styles.card}>
        <Text style={styles.title}>{restarted ? 'Clean slate, moving again' : 'Good work today'}</Text>
        <Text style={styles.body}>
          {restarted
            ? 'This shorter session counts toward the week and keeps the block alive.'
            : 'Today protects the progress you have already earned.'}
        </Text>
      </Card>
      <Card style={styles.card}>
        <Text style={styles.title}>How hard did that feel?</Text>
        <View style={styles.effortRow}>
          {([1, 2, 3, 4, 5] as const).map((value) => (
            <Pressable
              key={value}
              style={({ pressed }) => [
                styles.effort,
                effort === value && styles.effortSelected,
                pressed && styles.pressed,
              ]}
              onPress={() => setEffort(value)}
              accessibilityRole="button"
              accessibilityState={{ selected: effort === value }}
              accessibilityLabel={`Effort ${value}`}
            >
              <Text style={[styles.effortText, effort === value && styles.effortTextSelected]}>{value}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          style={({ pressed }) => [styles.painRow, painReported && styles.painRowSelected, pressed && styles.pressed]}
          onPress={() => setPainReported((v) => !v)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: painReported }}
          accessibilityLabel="Anything felt painful or unsafe"
        >
          <Text style={[styles.body, painReported && styles.painText]}>Anything felt painful or unsafe</Text>
        </Pressable>
      </Card>
      <PrimaryButton title="Back to Home" onPress={finish} />
      <SecondaryButton title="Do 60-second micro-check" onPress={onMicroCheck} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  title: { ...type.h2 },
  body: { ...type.bodySmall, color: colors.textSecondary },
  effortRow: { flexDirection: 'row', gap: spacing.sm },
  effort: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderHairline,
    backgroundColor: colors.bgSurface,
  },
  effortSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  effortText: { ...type.h3, color: colors.textSecondary },
  effortTextSelected: { color: colors.onAccent },
  painRow: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderHairline,
  },
  painRowSelected: { backgroundColor: colors.bgGold, borderColor: colors.goldBorder },
  painText: { color: colors.accentDeep },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
