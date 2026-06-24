import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  Card,
  Eyebrow,
  PrimaryButton,
  Screen,
} from '../components/ui';
import { BackArrowButton } from '../components/BackArrowButton';
import { HeaderLogo } from '../components/HeaderLogo';
import { controlledBetaEquipmentPositioning, extraSessionCardTitle, type HaleSessionPlan } from '../haleFlow';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { compactTypography, useResponsiveLayout } from '../theme/responsive';

export function SessionPreviewScreen({
  plan,
  onStart,
  onCancel,
}: {
  plan: HaleSessionPlan;
  onStart: () => void;
  onCancel: () => void;
}) {
  const responsive = useResponsiveLayout();
  const equipment = plan.metadata?.equipmentNeeded ?? [];
  const focusStimulusCopy = focusStimulusPreviewCopy(plan);
  return (
    <Screen>
      <BackArrowButton accessibilityLabel="Back" onPress={onCancel} />
      <View style={styles.header}>
        <Eyebrow>{"Today's session"}</Eyebrow>
        <View style={styles.titleGroup}>
          <HeaderLogo />
          <Text style={[styles.title, responsive.isCompactPhone && compactTypography.pageTitle]}>{sessionPreviewTitle(plan)}</Text>
        </View>
        <Text style={styles.subtitle}>{sessionBenefitCopy(plan)}</Text>
      </View>

      <Card style={styles.overviewCard}>
        <View style={styles.overviewHead}>
          <View style={styles.overviewCopy}>
            <Text style={styles.cardKicker}>Ready to start</Text>
            <Text style={styles.overviewTitle}>Ready to begin</Text>
          </View>
        </View>
        <View style={styles.summaryList}>
          <SummaryFact label="Duration" value={`${plan.estimatedMinutes} min`} />
          <SummaryFact label="Focus" value={focusLabel(plan.focusDomain)} />
          <SummaryFact label="Movements" value={movementCountLabel(plan.exercises.length)} isLast />
        </View>
        {focusStimulusCopy ? <Text style={styles.devNote}>{focusStimulusCopy}</Text> : null}
      </Card>

      <Card style={styles.exercisesCard}>
        <View style={styles.sectionHead}>
          <View style={styles.sectionCopy}>
            <Text style={styles.cardKicker}>Coming up</Text>
            <Text style={styles.sectionTitle}>Movements</Text>
          </View>
          <Text style={styles.sectionCount}>{movementCountLabel(plan.exercises.length)}</Text>
        </View>
        {plan.exercises.length > 0 ? (
          <View style={styles.movementTimeline}>
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
        <View style={styles.setupHeader}>
          <View style={styles.sectionCopy}>
            <Text style={styles.cardKicker}>Before you start</Text>
            <Text style={styles.sectionTitle}>Set up nearby</Text>
          </View>
          <View style={styles.guidancePill}>
            <Text style={styles.guidancePillText}>Voice guided</Text>
          </View>
        </View>
        <Text style={styles.body}>{setupIntroCopy(equipment.length)}</Text>
        {equipment.length > 0 ? (
          <View style={styles.setupChecklist}>
            {equipment.map((item) => (
              <SetupItem key={item} label={formatEquipment(item)} />
            ))}
          </View>
        ) : (
          <Text style={styles.body}>{controlledBetaEquipmentPositioning.noEquipmentClarification}</Text>
        )}
      </Card>

      <View style={styles.actions}>
        <PrimaryButton
          title="Start session"
          accessibilityLabel={`Start ${sessionPreviewTitle(plan)}`}
          onPress={onStart}
          style={styles.action}
        />
      </View>
    </Screen>
  );
}

function SummaryFact({ label, value, isLast = false }: { label: string; value: string; isLast?: boolean }) {
  return (
    <View style={[styles.summaryFact, !isLast && styles.summaryFactBorder]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
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
    <View style={styles.exerciseRow}>
      <View style={styles.movementMarkerColumn}>
        <View style={styles.exerciseIndex}>
          <Text style={styles.exerciseIndexText}>{String(index + 1).padStart(2, '0')}</Text>
        </View>
        {!isLast ? <View style={styles.movementConnector} /> : null}
      </View>
      <View style={[styles.exerciseContent, isLast && styles.exerciseContentLast]}>
        <View style={styles.exerciseTitleRow}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <View style={styles.prescriptionPill}>
            <Text style={styles.prescriptionText}>{prescription(exercise)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function SetupItem({ label }: { label: string }) {
  return (
    <View style={styles.setupItem}>
      <View style={styles.setupDot} />
      <Text style={styles.setupItemText}>{label}</Text>
    </View>
  );
}

export function sessionPreviewTitle(plan: HaleSessionPlan): string {
  const fallbackTitle = plan.title.trim() || `${focusLabel(plan.focusDomain)} session`;
  if (plan.metadata?.source === 'preset') {
    return extraSessionCardTitle(plan.metadata.templateId ?? plan.id, fallbackTitle);
  }
  return fallbackTitle;
}

function sessionBenefitCopy(plan: HaleSessionPlan): string {
  if (plan.metadata?.source === 'preset' && plan.purposeCopy.trim().length > 0) {
    return plan.purposeCopy;
  }
  if (plan.focusDomain === 'strength_power') {
    return 'This session helps you build strength for standing, stairs, and everyday tasks.';
  }
  if (plan.focusDomain === 'balance') {
    return 'This session helps you practice steadier standing, walking, and turning.';
  }
  return 'This session helps you move more comfortably when reaching, bending, and turning.';
}

function setupIntroCopy(equipmentCount: number): string {
  if (equipmentCount > 0) {
    return 'Have these close by before you press start. Hale will talk you through each movement.';
  }
  return 'Clear a little space before you press start. Hale will talk you through each movement.';
}

function movementCountLabel(count: number): string {
  if (count === 1) return '1 movement';
  return `${count} movements`;
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
  if (!focusStimulus || plan.metadata?.source !== 'block_generated') return null;
  const focus = focusLabel(plan.focusDomain).toLowerCase();
  if (focusStimulus.mainPlanCreditPotential) {
    const adjustmentCopy = userAdjustmentPreviewCopy(plan.metadata.userAdjustment);
    if (adjustmentCopy) return adjustmentCopy;
    if (plan.metadata.progressionEvidencePolicy === 'ineligible') {
      return 'This is a lighter support session for today. It will not count toward your plan.';
    }
    return null;
  }
  if (focusStimulus.status === 'no_primary_focus_planned') {
    return `Hale could not safely include your main ${focus} movement today. This support session will not count toward your plan.`;
  }
  if (focusStimulus.status === 'focus_mismatch') {
    return `Today's available movements are different from your main ${focus} focus. This support session will not count toward your plan.`;
  }
  if (focusStimulus.status === 'missing_stimulus_metadata') {
    return 'Hale cannot confirm the main movement for this plan, so this session will not count toward your plan.';
  }
  return null;
}

function userAdjustmentPreviewCopy(
  adjustment: NonNullable<HaleSessionPlan['metadata']>['userAdjustment']
): string | null {
  if (adjustment === 'shorter') return 'Hale has shortened today\'s session.';
  if (adjustment === 'gentler') return 'Hale has made today\'s session gentler.';
  if (adjustment === 'something_hurts') return 'Hale has adjusted today\'s session to be more careful.';
  if (adjustment === 'no_equipment') return 'Hale has adjusted today\'s session for the setup you have today.';
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
  summaryList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.divider,
  },
  summaryFact: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    paddingVertical: spacing.sm,
  },
  summaryFactBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  summaryLabel: {
    ...type.cardCaption,
    flexShrink: 0,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontFamily: fonts.serifMedium,
    fontSize: 24,
    lineHeight: 29,
    letterSpacing: 0,
    textAlign: 'right',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    flexShrink: 1,
  },
  exercisesCard: {
    gap: spacing.xl,
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
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    minHeight: 32,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  movementTimeline: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.md,
    minHeight: 58,
  },
  movementMarkerColumn: {
    width: 42,
    alignItems: 'center',
  },
  exerciseIndex: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseIndexText: {
    ...type.cardRowTitle,
    color: colors.accentDeep,
    fontVariant: ['tabular-nums'],
  },
  movementConnector: {
    flex: 1,
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginTop: spacing.xs,
    marginBottom: -spacing.xs,
  },
  exerciseContent: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  exerciseContentLast: {
    borderBottomWidth: 0,
  },
  exerciseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  equipmentCard: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.panel,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  setupHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  guidancePill: {
    minHeight: 32,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    backgroundColor: colors.surface,
  },
  guidancePillText: {
    ...type.caption,
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
  },
  setupChecklist: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  setupItem: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  setupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentGold,
  },
  setupItemText: {
    ...type.cardRowTitle,
    flex: 1,
    color: colors.accentDeep,
  },
  body: { ...type.cardBody },
  devNote: {
    ...type.caption,
    color: colors.textTertiary,
  },
  actions: { gap: spacing.md },
  action: { shadowOpacity: 0 },
});
