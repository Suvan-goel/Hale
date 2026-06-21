import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BackArrowButton } from '../components/BackArrowButton';
import { PrimaryButton, Screen, ScreenHeader, SecondaryButton } from '../components/ui';
import type {
  HaleSessionPlanningResult,
  SessionPlanningRecoveryCopy,
} from '../haleFlow';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';

export function SessionPlanningRecoveryScreen({
  result,
  copy,
  onPrimaryAction,
  onSecondaryAction,
  onCancel,
}: {
  result: Extract<HaleSessionPlanningResult, { kind: 'unavailable' }>;
  copy: SessionPlanningRecoveryCopy | null;
  onPrimaryAction: () => void;
  onSecondaryAction: () => void;
  onCancel: () => void;
}) {
  const content = copy ?? {
    title: 'Hale could not safely prepare today\'s session.',
    body: 'Your plan has not changed. Try again, or review your setup.',
    primaryActionLabel: 'Try again',
  };
  return (
    <Screen contentStyle={styles.screen}>
      <BackArrowButton accessibilityLabel="Back" onPress={onCancel} />
      <ScreenHeader eyebrow="Session setup" title={content.title} subtitle={content.body} />

      <View style={styles.recoverySheet}>
        <View style={styles.sheetHead}>
          <View style={styles.sheetHeadCopy}>
            <Text style={styles.sheetEyebrow}>Why this appeared</Text>
            <Text style={styles.sheetTitle}>No workout was started</Text>
          </View>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>Paused</Text>
          </View>
        </View>

        <View style={styles.copyStack}>
          <Text style={styles.sheetBody}>{planningPauseExplanation(result)}</Text>
          <Text style={styles.sheetBody}>
            Your current block, history, and progress were kept unchanged.
          </Text>
        </View>

        <View style={styles.statusList}>
          <StatusRow label="Workout" value="Not started" />
          <View style={styles.divider} />
          <StatusRow label="Plan and progress" value="Unchanged" />
        </View>

        <View style={styles.actions}>
          <PrimaryButton title={content.primaryActionLabel} onPress={onPrimaryAction} />
          {content.secondaryActionLabel && result.recoveryActions.length > 1 ? (
            <SecondaryButton title={content.secondaryActionLabel} onPress={onSecondaryAction} />
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statusRow}>
      <Text style={styles.statusLabel}>{label}</Text>
      <Text style={styles.statusValue}>{value}</Text>
    </View>
  );
}

function planningPauseExplanation(result: Extract<HaleSessionPlanningResult, { kind: 'unavailable' }>): string {
  switch (result.reason) {
    case 'no_safe_exercises':
      return 'The current setup does not leave Hale with an exercise combination that fits today\'s constraints.';
    case 'equipment_confirmation_required':
      return 'Hale needs to confirm what equipment is available before preparing today\'s workout.';
    case 'equipment_changed_after_planning':
      return 'Your equipment setup changed after this workout was prepared, so Hale needs to refresh it first.';
    case 'missing_equipment_snapshot':
    case 'legacy_plan_requires_refresh':
      return 'This saved workout was prepared before Hale tracked equipment setup, so it needs a quick refresh.';
    case 'no_active_block':
      return 'Hale needs an active 4-week plan before it can prepare today\'s workout.';
    case 'legacy_only_state':
      return 'Your previous plan needs to be refreshed before Hale can safely prepare today\'s workout.';
    default:
      return 'Hale could not prepare today\'s workout with enough confidence to start training.';
  }
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.xl,
  },
  recoverySheet: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.panel,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    ...shadow.card,
    boxShadow: '0 14px 34px rgba(17,20,18,0.045)',
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  sheetHeadCopy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  sheetEyebrow: {
    ...type.label,
    color: colors.accentDeep,
  },
  sheetTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: 29,
    lineHeight: 35,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  statusPill: {
    minHeight: 32,
    flexShrink: 0,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.bgGold,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldBorder,
  },
  statusPillText: {
    ...type.cardCaption,
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
  },
  sheetBody: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
  copyStack: {
    gap: spacing.sm,
  },
  statusList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.divider,
  },
  statusRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    paddingVertical: spacing.md,
  },
  statusLabel: {
    ...type.cardBody,
    color: colors.textSecondary,
  },
  statusValue: {
    ...type.cardRowTitle,
    color: colors.accentDeep,
    textAlign: 'right',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },
  actions: {
    gap: spacing.md,
  },
});
