import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  CHECKUP_SELF_REPORT_SCHEMA_VERSION,
  CLARITY_ITEMS,
  CLARITY_ITEM_SET_ID,
  CLARITY_RECALL_PERIOD_LABEL,
  CLARITY_SCALE,
  SLEEP_QUALITY_OPTIONS,
  SYMPTOM_LOAD_OPTIONS,
  type CheckUpSelfReport,
  type ClarityItemScore,
  type SleepQuality,
  type SymptomLoad,
} from '../checkup';
import { BRAND } from '../brand';
import { PrimaryButton, Screen, ScreenHeader } from '../components/ui';
import { colors, fonts, minTapTarget, radius, spacing, type } from '../theme';
import { compactTypography, useResponsiveLayout } from '../theme/responsive';

/**
 * Optional self-report appendix to an official Movement Check-Up. The five
 * frozen Clarity items save together or not at all so monthly readings stay
 * comparable. Context can be saved independently. Nothing from this screen
 * changes training, guidance, or the Strength and Balance results.
 */
export function ClarityCheckInScreen({
  showSymptomLoad,
  initialValue,
  onDone,
}: {
  /** Symptom context is offered only when it is relevant to the user. */
  showSymptomLoad: boolean;
  /** Restores an in-progress or previously saved appendix. */
  initialValue?: CheckUpSelfReport | null;
  onDone: (selfReport: CheckUpSelfReport | null) => void;
}) {
  const responsive = useResponsiveLayout();
  const [itemScores, setItemScores] = React.useState<(ClarityItemScore | null)[]>(() => {
    const saved = initialValue?.clarity?.itemScores;
    return saved?.length === CLARITY_ITEMS.length
      ? saved.map((score) => score)
      : CLARITY_ITEMS.map(() => null);
  });
  const [sleepQuality, setSleepQuality] = React.useState<SleepQuality | null>(
    () => initialValue?.covariates?.sleepQuality ?? null
  );
  const [symptomLoad, setSymptomLoad] = React.useState<SymptomLoad | null>(
    () => initialValue?.covariates?.symptomLoad ?? null
  );

  const answeredCount = itemScores.filter((score) => score !== null).length;
  const clarityComplete = answeredCount === CLARITY_ITEMS.length;
  const clarityPartial = answeredCount > 0 && !clarityComplete;

  const setScore = (index: number, score: ClarityItemScore) => {
    setItemScores((current) =>
      current.map((existing, itemIndex) =>
        itemIndex === index ? (existing === score ? null : score) : existing
      )
    );
  };

  const buildSelfReport = (): CheckUpSelfReport | null => {
    const clarity = clarityComplete
      ? {
          itemSetId: CLARITY_ITEM_SET_ID,
          itemScores: itemScores.map((score) => score as ClarityItemScore),
        }
      : undefined;
    const symptomContext = showSymptomLoad ? symptomLoad : null;
    const covariates =
      sleepQuality !== null || symptomContext !== null
        ? {
            ...(sleepQuality !== null ? { sleepQuality } : {}),
            ...(symptomContext !== null ? { symptomLoad: symptomContext } : {}),
          }
        : undefined;

    if (!clarity && !covariates) return null;
    return {
      schemaVersion: CHECKUP_SELF_REPORT_SCHEMA_VERSION,
      ...(clarity ? { clarity } : {}),
      ...(covariates ? { covariates } : {}),
    };
  };

  return (
    <Screen contentStyle={styles.content}>
      <ScreenHeader
        eyebrow="Everyday Clarity · optional"
        title="How has your thinking felt?"
        subtitle="This check-in is for your personal monthly trend. It never changes your workouts, guidance, or Strength and Balance results."
      />

      <View style={styles.contextCard}>
        <Text style={styles.contextTitle}>A note about your trend</Text>
        <Text style={styles.contextText}>
          Clarity can fluctuate with sleep, symptoms, stress, and other day-to-day factors. Regular
          physical activity supports brain health, but {BRAND.appName} does not use this check-in to infer a
          cause or change your plan.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.recall, responsive.isCompactPhone && compactTypography.pageTitle]}>
          {CLARITY_RECALL_PERIOD_LABEL}
        </Text>
        {CLARITY_ITEMS.map((item, index) => (
          <View key={item.id} style={styles.itemBlock}>
            <Text style={styles.itemText}>{item.text}</Text>
            <View style={styles.chipRow}>
              {CLARITY_SCALE.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  accessibilityLabel={`${item.text} — ${option.label}`}
                  selected={itemScores[index] === option.value}
                  onPress={() => setScore(index, option.value)}
                />
              ))}
            </View>
          </View>
        ))}
        {clarityPartial ? (
          <Text style={styles.gentle} accessibilityLiveRegion="polite">
            Your five Clarity answers save only as a complete set. Finish the remaining questions,
            or continue without saving them this time.
          </Text>
        ) : null}
      </View>

      <View style={styles.section}>
        <View style={styles.optionalHeading}>
          <Text style={styles.itemText}>How did you sleep last night?</Text>
          <Text style={styles.optionalLabel}>Optional context</Text>
        </View>
        <View style={styles.chipRow}>
          {SLEEP_QUALITY_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              accessibilityLabel={`Sleep — ${option.label}`}
              selected={sleepQuality === option.value}
              onPress={() =>
                setSleepQuality((current) => (current === option.value ? null : option.value))
              }
            />
          ))}
        </View>
      </View>

      {showSymptomLoad ? (
        <View style={styles.section}>
          <View style={styles.optionalHeading}>
            <Text style={styles.itemText}>How heavy have your menopause symptoms felt this week?</Text>
            <Text style={styles.optionalLabel}>Optional context</Text>
          </View>
          <View style={styles.chipRow}>
            {SYMPTOM_LOAD_OPTIONS.map((option) => (
              <Chip
                key={String(option.value)}
                label={option.label}
                accessibilityLabel={`Symptoms — ${option.label}`}
                selected={symptomLoad === option.value}
                onPress={() =>
                  setSymptomLoad((current) => (current === option.value ? null : option.value))
                }
              />
            ))}
          </View>
        </View>
      ) : null}

      <Text style={styles.gentle}>
        One check-in can move around. Your own pattern across monthly check-ups is the useful view.
      </Text>

      <View style={styles.actions}>
        <PrimaryButton title="Save and continue" onPress={() => onDone(buildSelfReport())} />
        <Pressable
          onPress={() => onDone(null)}
          accessibilityRole="button"
          accessibilityLabel="Skip Everyday Clarity this time"
          style={({ pressed }) => [styles.skip, pressed && styles.pressed]}
        >
          <Text style={styles.skipText}>Skip this time</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function Chip({
  label,
  accessibilityLabel,
  selected,
  onPress,
}: {
  label: string;
  accessibilityLabel: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.xl,
  },
  contextCard: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.accentSoft,
  },
  contextTitle: {
    ...type.cardRowTitle,
    color: colors.textPrimary,
  },
  contextText: {
    ...type.cardBody,
    color: colors.textSecondary,
  },
  section: {
    gap: spacing.md,
  },
  recall: {
    ...type.cardTitle,
  },
  itemBlock: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  itemText: {
    ...type.cardBody,
    color: colors.textPrimary,
  },
  optionalHeading: {
    gap: spacing.xs,
  },
  optionalLabel: {
    ...type.cardCaption,
    color: colors.textMuted,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    minHeight: minTapTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  chipTextSelected: {
    color: colors.onAccent,
  },
  gentle: {
    ...type.caption,
    color: colors.textSecondary,
  },
  actions: {
    gap: spacing.md,
  },
  skip: {
    minHeight: minTapTarget,
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  skipText: {
    ...type.caption,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: 0.82,
  },
});
