import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  Card,
  Eyebrow,
  HealthMetricRow,
  PrimaryButton,
  Screen,
  SectionHeader,
  StatusBadge,
} from '../components/ui';
import { BackArrowButton } from '../components/BackArrowButton';
import { HeaderLogo } from '../components/HeaderLogo';
import type { HaleSessionPlan } from '../haleFlow';
import { colors, spacing, type } from '../theme';

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
          <HeaderLogo size={30} />
          <Text style={styles.title}>{plan.title}</Text>
        </View>
        <Text style={styles.subtitle}>{plan.purposeCopy}</Text>
      </View>

      <Card>
        <View style={styles.summaryRow}>
          <SummaryTile label="Duration" value={`${plan.estimatedMinutes} min`} />
          <SummaryTile label="Focus" value={focusLabel(plan.focusDomain)} />
        </View>
        {source === 'legacy_fallback' && plan.metadata?.fallbackReason ? (
          <Text style={styles.devNote}>Planner note: {plan.metadata.fallbackReason}</Text>
        ) : null}
        {focusStimulusCopy ? <Text style={styles.devNote}>{focusStimulusCopy}</Text> : null}
      </Card>

      <Card>
        <SectionHeader title="Exercises" />
        {plan.exercises.length > 0 ? (
          plan.exercises.map((exercise, index) => (
            <HealthMetricRow
              key={`${exercise.id}-${index}`}
              icon={`${index + 1}`}
              label={exercise.name}
              value={prescription(exercise)}
              status={exercise.rationale ?? exercise.ladderTitle}
            />
          ))
        ) : (
          <Text style={styles.body}>No playable exercises were found for this session.</Text>
        )}
      </Card>

      <Card>
        <View style={styles.equipmentHead}>
          <View style={styles.copy}>
            <Text style={styles.cardTitle}>Equipment</Text>
            <Text style={styles.body}>
              {equipment.length > 0
                ? equipment.map(formatEquipment).join(', ')
                : 'Chair, wall, floor, and clear space are enough for today.'}
            </Text>
          </View>
          <StatusBadge label={source === 'legacy_fallback' ? 'Fallback' : 'Generated'} tone="gold" />
        </View>
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
  if (value === 'long_band') return 'resistance band';
  if (value === 'mini_band') return 'mini band';
  if (value === 'backpack_or_weight') return 'backpack or light load';
  return value.replace(/_/g, ' ');
}

function focusStimulusPreviewCopy(plan: HaleSessionPlan): string | null {
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
  summaryRow: { flexDirection: 'row', gap: spacing.md },
  tile: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 14,
    backgroundColor: colors.bgElevated,
  },
  tileValue: { ...type.cardRowTitle },
  tileLabel: { ...type.cardCaption, marginTop: spacing.xs },
  equipmentHead: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  copy: { flex: 1 },
  cardTitle: { ...type.cardTitle },
  body: { ...type.cardBody, marginTop: spacing.sm },
  devNote: { ...type.caption, color: colors.textTertiary, marginTop: spacing.md },
  actions: { gap: spacing.md },
  action: { shadowOpacity: 0 },
});
