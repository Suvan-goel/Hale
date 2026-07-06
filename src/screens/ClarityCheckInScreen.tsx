import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  CLARITY_ITEMS,
  CLARITY_ITEM_SET_ID,
  CLARITY_RECALL_PERIOD_LABEL,
  CLARITY_SCALE,
  CHECKUP_SELF_REPORT_SCHEMA_VERSION,
  SLEEP_QUALITY_OPTIONS,
  SYMPTOM_LOAD_OPTIONS,
  type CheckUpSelfReport,
  type ClarityItemScore,
  type SleepQuality,
  type SymptomLoad,
} from '../checkup';
import { PrimaryButton, Screen, ScreenHeader } from '../components/ui';
import { colors, fonts, radius, spacing, type } from '../theme';
import { compactTypography, useResponsiveLayout } from '../theme/responsive';

/**
 * Clarity check-in — the self-report appendix after the monthly check-up
 * (REPOSITION_TDD §5; wording final per founder 2026-07-06). Tap-only,
 * optional, skippable as a unit; the five items save together or not at all
 * (partial answers can't be compared fairly month to month). Self-reported
 * tracking only — never a measurement, never affects check-up results (F8).
 */
export function ClarityCheckInScreen({
  showSymptomLoad,
  onDone,
}: {
  /** Symptom-load context only for the female reference group (like the stage question). */
  showSymptomLoad: boolean;
  onDone: (selfReport: CheckUpSelfReport | null) => void;
}) {
  const responsive = useResponsiveLayout();
  const [itemScores, setItemScores] = React.useState<(ClarityItemScore | null)[]>(
    () => CLARITY_ITEMS.map(() => null)
  );
  const [sleepQuality, setSleepQuality] = React.useState<SleepQuality | null>(null);
  const [symptomLoad, setSymptomLoad] = React.useState<SymptomLoad | null>(null);

  const answeredCount = itemScores.filter((score) => score !== null).length;
  const clarityComplete = answeredCount === CLARITY_ITEMS.length;
  const clarityPartial = answeredCount > 0 && !clarityComplete;

  const setScore = (index: number, score: ClarityItemScore) => {
    setItemScores((current) =>
      current.map((existing, i) => (i === index ? (existing === score ? null : score) : existing))
    );
  };

  const buildSelfReport = (): CheckUpSelfReport | null => {
    const clarity = clarityComplete
      ? {
          itemSetId: CLARITY_ITEM_SET_ID,
          itemScores: itemScores.map((score) => score as ClarityItemScore),
        }
      : undefined;
    const covariates =
      sleepQuality !== null || symptomLoad !== null
        ? {
            ...(sleepQuality !== null ? { sleepQuality } : {}),
            ...(symptomLoad !== null ? { symptomLoad } : {}),
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
        eyebrow="Check-up complete"
        title="A quick check-in"
        subtitle="Self-reported tracking of how clear your thinking has felt. Optional — skip any time; it never changes your measured results."
      />

      <View style={styles.section}>
        <Text style={[styles.recall, responsive.isCompactPhone && compactTypography.pageTitle]}>
          {CLARITY_RECALL_PERIOD_LABEL}
        </Text>
        {CLARITY_ITEMS.map((item, index) => (
          <View key={item.id} style={styles.itemBlock}>
            <Text style={styles.itemText}>{item.text}</Text>
            <View style={styles.chipRow}>
              {CLARITY_SCALE.map((option) => {
                const selected = itemScores[index] === option.value;
                return (
                  <Chip
                    key={option.value}
                    label={option.label}
                    selected={selected}
                    onPress={() => setScore(index, option.value)}
                  />
                );
              })}
            </View>
          </View>
        ))}
        {clarityPartial ? (
          <Text style={styles.gentle}>
            The five questions save together — answer the rest, or they won't be saved this time.
          </Text>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.itemText}>How did you sleep last night?</Text>
        <View style={styles.chipRow}>
          {SLEEP_QUALITY_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={sleepQuality === option.value}
              onPress={() => setSleepQuality(sleepQuality === option.value ? null : option.value)}
            />
          ))}
        </View>
      </View>

      {showSymptomLoad ? (
        <View style={styles.section}>
          <Text style={styles.itemText}>How heavy have your menopause symptoms felt this week?</Text>
          <View style={styles.chipRow}>
            {SYMPTOM_LOAD_OPTIONS.map((option) => (
              <Chip
                key={String(option.value)}
                label={option.label}
                selected={symptomLoad === option.value}
                onPress={() => setSymptomLoad(symptomLoad === option.value ? null : option.value)}
              />
            ))}
          </View>
        </View>
      ) : null}

      <Text style={styles.gentle}>
        Check-ins fluctuate — sleep, symptom load, and stress all show up here. The trend over
        months is what matters, never one reading.
      </Text>

      <View style={styles.actions}>
        <PrimaryButton title="Continue" onPress={() => onDone(buildSelfReport())} />
        <Pressable
          onPress={() => onDone(null)}
          accessibilityRole="button"
          accessibilityLabel="Skip this check-in"
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
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  recall: {
    ...type.cardTitle,
  },
  itemBlock: {
    gap: spacing.sm,
  },
  itemText: {
    ...type.cardBody,
    color: colors.textPrimary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
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
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  skipText: {
    ...type.caption,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: 0.85,
  },
});
