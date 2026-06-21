import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  Card,
  Eyebrow,
  PrimaryButton,
  Screen,
  SectionHeader,
  StatusBadge,
} from '../components/ui';
import { BackArrowButton } from '../components/BackArrowButton';
import { HeaderLogo } from '../components/HeaderLogo';
import type { HaleSessionPlan } from '../haleFlow';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';

export function SessionPreviewScreen({
  plan,
  onStart,
  onCancel,
}: {
  plan: HaleSessionPlan;
  onStart: () => void;
  onCancel: () => void;
}) {
  const equipment = plan.metadata?.equipmentNeeded ?? [];
  const source = plan.metadata?.source;
  const focusStimulusCopy = focusStimulusPreviewCopy(plan);
  return (
    <Screen>
      <BackArrowButton accessibilityLabel="Back to Today" onPress={onCancel} />
      <View style={styles.header}>
        <Eyebrow>{"Today's Hale Session"}</Eyebrow>
        <View style={styles.titleGroup}>
          <HeaderLogo />
          <Text style={styles.title}>{plan.title}</Text>
        </View>
        <Text style={styles.subtitle}>{plan.purposeCopy}</Text>
      </View>

      <Card style={styles.overviewCard}>
        <View style={styles.overviewHead}>
          <View style={styles.overviewCopy}>
            <Text style={styles.cardKicker}>Session preview</Text>
            <Text style={styles.overviewTitle}>Ready for today</Text>
          </View>
          <StatusBadge label={source === 'legacy_fallback' ? 'Fallback' : 'Generated'} tone="gold" />
        </View>
        <View style={styles.summaryRow}>
          <SummaryTile label="Duration" value={`${plan.estimatedMinutes} min`} />
          <View style={styles.summaryDivider} />
          <SummaryTile label="Primary focus" value={focusLabel(plan.focusDomain)} />
        </View>
        {source === 'legacy_fallback' && plan.metadata?.fallbackReason ? (
          <Text style={styles.devNote}>Planner note: {plan.metadata.fallbackReason}</Text>
        ) : null}
        {focusStimulusCopy ? <Text style={styles.devNote}>{focusStimulusCopy}</Text> : null}
      </Card>

      <Card style={styles.exercisesCard}>
        <View style={styles.sectionHead}>
          <View style={styles.sectionCopy}>
            <Text style={styles.cardKicker}>Sequence</Text>
            <Text style={styles.sectionTitle}>Exercises</Text>
          </View>
          <Text style={styles.sectionCount}>{movementCountLabel(plan.exercises.length)}</Text>
        </View>
        {plan.exercises.length > 0 ? (
          <View style={styles.exerciseList}>
            {plan.exercises.map((exercise, index) => (
              <ExercisePreviewRow
                key={`${exercise.id}-${index}`}
                exercise={exercise}
                index={index}
                isLast={index === plan.exercises.length - 1}
              />
            ))}
          </View>
        ) : (
          <Text style={styles.body}>No playable exercises were found for this session.</Text>
        )}
      </Card>

      <Card style={styles.equipmentCard}>
        <View style={styles.sectionHead}>
          <View style={styles.sectionCopy}>
            <Text style={styles.cardKicker}>Setup</Text>
            <Text style={styles.sectionTitle}>Equipment</Text>
          </View>
        </View>
        {equipment.length > 0 ? (
          <View style={styles.equipmentChips}>
            {equipment.map((item) => (
              <View key={item} style={styles.equipmentChip}>
                <Text style={styles.equipmentChipText}>{formatEquipment(item)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.body}>Chair, wall, floor, and clear space are enough for today.</Text>
        )}
        <Text style={styles.equipmentNote}>Keep these close so the session can stay voice-guided and hands-free.</Text>
      </Card>

      {plan.metadata?.guidance && plan.metadata.guidance.length > 0 ? (
        <Card>
          <SectionHeader title="Today" />
          {plan.metadata.guidance.map((line) => (
            <Text key={line} style={styles.body}>{line}</Text>
          ))}
        </Card>
      ) : null}

      <View style={styles.actions}>
        <PrimaryButton title="Start Session" accessibilityLabel={`Start ${plan.title}`} onPress={onStart} style={styles.action} />
      </View>
    </Screen>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

function ExercisePreviewRow({
  exercise,
  index,
  isLast,
}: {
  exercise: HaleSessionPlan['exercises'][number];
  index: number;
  isLast: boolean;
}) {
  return (
    <View style={[styles.exerciseRow, !isLast && styles.exerciseRowBorder]}>
      <View style={styles.exerciseIndex}>
        <Text style={styles.exerciseIndexText}>{String(index + 1).padStart(2, '0')}</Text>
      </View>
      <View style={styles.exerciseContent}>
        <View style={styles.exerciseTitleRow}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <View style={styles.prescriptionPill}>
            <Text style={styles.prescriptionText}>{prescription(exercise)}</Text>
          </View>
        </View>
        <Text style={styles.exerciseDescriptor}>{exerciseDescriptor(exercise)}</Text>
        {exercise.ladderTitle ? <Text style={styles.exerciseSource}>{exercise.ladderTitle}</Text> : null}
      </View>
    </View>
  );
}

function movementCountLabel(count: number): string {
  if (count === 1) return '1 movement';
  return `${count} movements`;
}

function exerciseDescriptor(exercise: HaleSessionPlan['exercises'][number]): string {
  if (exercise.rationale) {
    const [lead] = exercise.rationale.split(':');
    if (lead && lead.trim().length > 0 && lead.length < exercise.rationale.length) {
      return lead.trim();
    }
    return exercise.rationale;
  }
  if (exercise.whyItMatters) return exercise.whyItMatters;
  if (exercise.instructions) return exercise.instructions;
  return `${focusLabel(exercise.domain)} work for today's session.`;
}

function prescription(exercise: HaleSessionPlan['exercises'][number]): string {
  const sets = exercise.targetSets ?? 1;
  if (exercise.targetReps) return `${sets} x ${exercise.targetReps}`;
  if (exercise.durationSeconds) return `${sets} x ${exercise.durationSeconds}s`;
  return `${sets} sets`;
}

function focusLabel(domain: HaleSessionPlan['focusDomain']): string {
  if (domain === 'strength_power') return 'Strength';
  if (domain === 'balance') return 'Balance';
  return 'Mobility';
}

function formatEquipment(value: string): string {
  if (value === 'long_band') return 'Resistance band';
  if (value === 'mini_band') return 'Mini band';
  if (value === 'backpack_or_weight') return 'Backpack or light load';
  const formatted = value.replace(/_/g, ' ');
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function focusStimulusPreviewCopy(plan: HaleSessionPlan): string | null {
  const focusStimulus = plan.metadata?.focusStimulus;
  if (!focusStimulus || plan.metadata?.source !== 'block_generated' || focusStimulus.mainPlanCreditPotential) return null;
  const focus = focusLabel(plan.focusDomain).toLowerCase();
  if (focusStimulus.status === 'no_primary_focus_planned') {
    return `Today is supporting maintenance for ${focus}. It can be useful, but it will not move the main plan forward.`;
  }
  if (focusStimulus.status === 'focus_mismatch') {
    return `Today's available work does not match the block's primary ${focus} focus, so it will not move the main plan forward.`;
  }
  if (focusStimulus.status === 'missing_stimulus_metadata') {
    return 'Hale cannot verify a primary focus exercise in this plan, so it will not move the main plan forward.';
  }
  return null;
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  title: { ...type.pageTitle, flexShrink: 1 },
  subtitle: { ...type.pageSubtitle },
  overviewCard: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.panel,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  overviewHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  overviewCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  cardKicker: {
    ...type.label,
    color: colors.accentDeep,
    fontSize: 11,
    lineHeight: 16,
  },
  overviewTitle: {
    ...type.cardTitle,
  },
  summaryRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'stretch',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.divider,
  },
  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },
  tile: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  tileValue: {
    fontFamily: fonts.serifMedium,
    fontSize: 25,
    lineHeight: 30,
    letterSpacing: 0,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  tileLabel: {
    ...type.cardCaption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  exercisesCard: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.panel,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  sectionCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  sectionTitle: {
    ...type.cardTitle,
    fontSize: 22,
    lineHeight: 28,
  },
  sectionCount: {
    ...type.caption,
    color: colors.textSecondary,
    fontFamily: fonts.sansMedium,
    paddingTop: 2,
  },
  exerciseList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.divider,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  exerciseRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  exerciseIndex: {
    width: 42,
    height: 42,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
  },
  exerciseIndexText: {
    ...type.cardRowTitle,
    color: colors.accentDeep,
    fontVariant: ['tabular-nums'],
  },
  exerciseContent: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  exerciseTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  exerciseName: {
    ...type.cardRowTitle,
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    lineHeight: 22,
  },
  prescriptionPill: {
    minHeight: 30,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
  },
  prescriptionText: {
    ...type.caption,
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    fontVariant: ['tabular-nums'],
  },
  exerciseDescriptor: {
    ...type.caption,
    color: colors.textSecondary,
  },
  exerciseSource: {
    ...type.cardCaption,
    color: colors.textTertiary,
  },
  equipmentCard: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.panel,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  equipmentChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  equipmentChip: {
    minHeight: 38,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    backgroundColor: colors.surface,
  },
  equipmentChipText: {
    ...type.caption,
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
  },
  equipmentNote: {
    ...type.cardCaption,
    color: colors.textSecondary,
  },
  body: { ...type.cardBody, marginTop: spacing.sm },
  devNote: {
    ...type.caption,
    color: colors.textTertiary,
  },
  actions: { gap: spacing.md },
  action: { shadowOpacity: 0 },
});
