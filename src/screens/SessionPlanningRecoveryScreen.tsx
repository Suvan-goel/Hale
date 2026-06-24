import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BackArrowButton } from '../components/BackArrowButton';
import { PrimaryButton, Screen, ScreenHeader, SecondaryButton } from '../components/ui';
import type {
  HaleSessionPlanningResult,
  SessionPlanningRecoveryCopy,
} from '../haleFlow';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { useResponsiveLayout } from '../theme/responsive';

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
  const responsive = useResponsiveLayout();
  const content = copy ?? {
    title: 'Hale needs to check your setup.',
    body: 'No workout started. This will not affect your progress.',
    primaryActionLabel: 'Try again',
  };
  return (
    <Screen contentStyle={styles.screen}>
      <BackArrowButton accessibilityLabel="Back" onPress={onCancel} />
      <ScreenHeader eyebrow="Session setup" title={content.title} subtitle={content.body} />

      <View style={[styles.recoverySheet, responsive.isCompactPhone && styles.compactCardPadding]}>
        <View style={styles.sheetHeadCopy}>
          <Text style={styles.sheetTitle}>What to do next</Text>
        </View>

        <View style={styles.sheetRule} />

        <Text style={styles.sheetBody}>{nextStepExplanation(result)}</Text>

        <View style={[styles.reassurancePanel, responsive.isCompactPhone && styles.compactCardPadding]}>
          <Text style={styles.reassuranceLabel}>Still saved</Text>
          <Text style={styles.reassuranceText}>Your plan, progress, and history are unchanged.</Text>
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

function nextStepExplanation(result: Extract<HaleSessionPlanningResult, { kind: 'unavailable' }>): string {
  switch (result.reason) {
    case 'no_safe_exercises':
      return 'Today\'s choices leave too few suitable movements. Review your setup and try again.';
    case 'equipment_confirmation_required':
    case 'equipment_changed_after_planning':
    case 'missing_equipment_snapshot':
    case 'legacy_plan_requires_refresh':
      return 'Review your equipment so Hale knows what you have available.';
    case 'daily_context_required':
      return 'Tell Hale how you feel today before starting.';
    case 'movement_capability_not_confirmed':
    case 'movement_capability_changed':
    case 'missing_movement_capability_snapshot':
      return 'Review which movements feel safe, then Hale can choose the right option.';
    case 'exercise_level_not_available_in_controlled_beta':
    case 'missing_release_policy_snapshot':
    case 'unsupported_release_channel':
    case 'missing_progression_policy_snapshot':
    case 'unsupported_progression_policy_schema':
    case 'stale_progression_policy':
    case 'effective_progression_level_mismatch':
    case 'auto_progression_ceiling_exceeded':
    case 'non_linear_progression_selection_invalid':
      return 'Refresh the workout so Hale can choose a supported movement level.';
    case 'missing_safety_cue_profile':
    case 'unsupported_safety_cue_schema':
    case 'missing_required_band_cues':
    case 'missing_required_stop_rules':
    case 'unresolved_safety_cue_id':
      return 'Review your safety setup so Hale can use the current guidance.';
    case 'no_active_block':
      return 'Open your plan or start a check-up so Hale can prepare today\'s workout.';
    case 'legacy_only_state':
      return 'Open your plan setup so Hale can prepare a current workout.';
    default:
      return 'Try again. If this keeps happening, review your setup.';
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
    boxShadow: '0 12px 30px rgba(17,20,18,0.04)',
  },
  compactCardPadding: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  sheetHeadCopy: {
    gap: spacing.sm,
  },
  sheetTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: 25,
    lineHeight: 31,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  sheetRule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderHairline,
  },
  sheetBody: {
    ...type.body,
    color: colors.textSecondary,
  },
  reassurancePanel: {
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radius.input,
    backgroundColor: colors.bgBase,
  },
  reassuranceLabel: {
    ...type.label,
    color: colors.textSecondary,
  },
  reassuranceText: {
    ...type.bodySmall,
    color: colors.textPrimary,
    fontFamily: fonts.sansMedium,
  },
  actions: {
    gap: spacing.md,
  },
});
