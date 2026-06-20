import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, PrimaryButton, Screen, ScreenHeader, SecondaryButton } from '../../components/ui';
import { colors, spacing, type } from '../../theme';
import type { PainArea, TrackingQuality, ValidTimeSessionSummaryCard } from '../../training';
import { getProtectionCopy } from '../adherenceCopy';
import type { LifeGoal, MovementBlock, TrainingSessionCompletion } from '../types';

export interface SessionFeedbackInput {
  perceivedEffort?: 1 | 2 | 3 | 4 | 5;
  painReported?: boolean;
  painArea?: PainArea;
  completed?: boolean;
  trackingQuality?: TrackingQuality;
}

const EFFORT_OPTIONS: readonly { value: 1 | 2 | 3 | 4 | 5; label: string }[] = [
  { value: 1, label: 'Very easy' },
  { value: 2, label: 'Easy' },
  { value: 3, label: 'Just right' },
  { value: 4, label: 'Challenging' },
  { value: 5, label: 'Too hard' },
];

const PAIN_AREAS: readonly { value: PainArea; label: string }[] = [
  { value: 'knee', label: 'Knee' },
  { value: 'hip', label: 'Hip' },
  { value: 'back', label: 'Back' },
  { value: 'shoulder', label: 'Shoulder' },
  { value: 'ankle', label: 'Ankle' },
  { value: 'neck', label: 'Neck' },
  { value: 'other', label: 'Other' },
];

export function SessionCompletionScreen({
  block,
  lifeGoal,
  completion,
  validTimeSummaries = [],
  onMicroCheck,
  onFeedback,
  onDone,
}: {
  block: MovementBlock;
  lifeGoal?: LifeGoal | null;
  completion?: TrainingSessionCompletion | null;
  validTimeSummaries?: readonly ValidTimeSessionSummaryCard[];
  onMicroCheck: () => void;
  onFeedback?: (feedback: SessionFeedbackInput) => void;
  onDone: () => void;
}) {
  const restarted = completion?.sessionType === 'restart';
  const [effort, setEffort] = React.useState<1 | 2 | 3 | 4 | 5 | undefined>(completion?.perceivedEffort);
  const [painReported, setPainReported] = React.useState<boolean | undefined>(completion?.painReported);
  const [painArea, setPainArea] = React.useState<PainArea | undefined>();
  const submitFeedback = () => {
    onFeedback?.(buildSessionFeedback({ effort, painReported, painArea }));
  };
  const finish = () => {
    submitFeedback();
    onDone();
  };
  const microCheck = () => {
    submitFeedback();
    onMicroCheck();
  };
  return (
    <Screen>
      <ScreenHeader
        eyebrow={restarted ? 'Restart complete' : 'Session complete'}
        title={restarted ? "You're back" : 'Nice work.'}
        subtitle={restarted ? "That's the important part." : getProtectionCopy({ lifeGoal, focusDomain: block.focusDomain })}
      />
      <Card style={styles.card}>
        <Text style={styles.title}>{restarted ? 'Clean slate, moving again' : 'This helps Hale adjust your next session.'}</Text>
        <Text style={styles.body}>Move only in a comfortable range.</Text>
      </Card>
      {validTimeSummaries.length > 0 ? (
        <Card style={styles.card}>
          <Text style={styles.title}>Steady time</Text>
          {validTimeSummaries.map((summary) => (
            <View key={summary.exerciseId} style={styles.summaryBlock}>
              <Text style={styles.summaryTitle}>{summary.title}</Text>
              {summary.lines.map((line) => (
                <Text key={line} style={styles.body}>{line}</Text>
              ))}
            </View>
          ))}
        </Card>
      ) : null}
      <Card style={styles.card}>
        <Text style={styles.title}>How did it feel?</Text>
        <View style={styles.effortRow}>
          {EFFORT_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={({ pressed }) => [
                styles.effort,
                effort === option.value && styles.effortSelected,
                pressed && styles.pressed,
              ]}
              onPress={() => setEffort(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: effort === option.value }}
              accessibilityLabel={`${option.value} ${option.label}`}
            >
              <Text style={[styles.effortText, effort === option.value && styles.effortTextSelected]}>{option.value}</Text>
              <Text style={[styles.effortLabel, effort === option.value && styles.effortTextSelected]}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
      </Card>
      <Card style={styles.card}>
        <Text style={styles.title}>Any discomfort?</Text>
        <View style={styles.choiceRow}>
          <Choice label="No" selected={painReported === false} onPress={() => { setPainReported(false); setPainArea(undefined); }} />
          <Choice label="Yes" selected={painReported === true} onPress={() => setPainReported(true)} />
        </View>
        {painReported ? (
          <View style={styles.painAreas}>
            {PAIN_AREAS.map((area) => (
              <Choice
                key={area.value}
                label={area.label}
                selected={painArea === area.value}
                onPress={() => setPainArea((value) => (value === area.value ? undefined : area.value))}
              />
            ))}
          </View>
        ) : null}
      </Card>
      <PrimaryButton title="Back to Today" onPress={finish} />
      <SecondaryButton title="Do 60-second micro-check" onPress={microCheck} />
    </Screen>
  );
}

export function buildSessionFeedback({
  effort,
  painReported,
  painArea,
  trackingQuality = 'good',
}: {
  effort?: 1 | 2 | 3 | 4 | 5;
  painReported?: boolean;
  painArea?: PainArea;
  trackingQuality?: TrackingQuality;
}): SessionFeedbackInput {
  return {
    perceivedEffort: effort,
    painReported: painReported ?? false,
    painArea: painReported ? painArea : undefined,
    completed: true,
    trackingQuality,
  };
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.choice, selected && styles.choiceSelected, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  title: { ...type.cardTitle },
  body: { ...type.cardBody },
  summaryBlock: { gap: 2 },
  summaryTitle: { ...type.bodySmall, color: colors.textPrimary, fontWeight: '500' },
  effortRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  effort: {
    flex: 1,
    minWidth: 92,
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
  effortLabel: { ...type.caption, color: colors.textSecondary, textAlign: 'center', marginTop: 2 },
  effortTextSelected: { color: colors.onAccent },
  choiceRow: { flexDirection: 'row', gap: spacing.sm },
  painAreas: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  choice: {
    flexGrow: 1,
    minWidth: 92,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderHairline,
  },
  choiceSelected: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  choiceText: { ...type.bodySmall, color: colors.textSecondary },
  choiceTextSelected: { color: colors.accentDeep },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
