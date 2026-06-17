import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  CHECKUP_SETUP_ISSUE_BODY,
  CHECKUP_SETUP_ISSUE_TITLE,
  SETUP_HELP_TIPS,
  WORKOUT_SETUP_ISSUE_BODY,
  WORKOUT_SETUP_ISSUE_TITLE,
} from './setupCopy';
import { colors, minTapTarget, radius, shadow, spacing, type } from '../theme';

type SetupPanelMode = 'checkup' | 'workout' | 'help';

export function SetupHelpPanel({
  mode,
  onTryAgain,
  onClose,
  onSkip,
  skipLabel,
}: {
  mode: SetupPanelMode;
  onTryAgain?: () => void;
  onClose: () => void;
  onSkip?: () => void;
  skipLabel?: string;
}) {
  const [expanded, setExpanded] = React.useState(mode === 'help');
  const isHelpOnly = mode === 'help';
  const title =
    mode === 'checkup'
      ? CHECKUP_SETUP_ISSUE_TITLE
      : mode === 'workout'
        ? WORKOUT_SETUP_ISSUE_TITLE
        : 'Setup help';
  const body =
    mode === 'checkup'
      ? CHECKUP_SETUP_ISSUE_BODY
      : mode === 'workout'
        ? WORKOUT_SETUP_ISSUE_BODY
        : 'Use these setup checks before continuing.';

  const closeExpanded = React.useCallback(() => {
    if (isHelpOnly) {
      onClose();
    } else {
      setExpanded(false);
    }
  }, [isHelpOnly, onClose]);

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {expanded ? (
        <View style={styles.tips}>
          {SETUP_HELP_TIPS.map((tip) => (
            <Text key={tip} style={styles.tip}>
              {tip}
            </Text>
          ))}
        </View>
      ) : null}
      <View style={styles.actions}>
        {onTryAgain ? <PanelButton title="Try again" variant="primary" onPress={onTryAgain} /> : null}
        {!expanded ? (
          <PanelButton title="Setup help" onPress={() => setExpanded(true)} />
        ) : null}
        {onSkip ? <PanelButton title={skipLabel ?? 'Skip for now'} onPress={onSkip} /> : null}
        {isHelpOnly || expanded ? <PanelButton title="Close" onPress={closeExpanded} /> : null}
      </View>
    </View>
  );
}

function PanelButton({
  title,
  onPress,
  variant = 'secondary',
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.primaryButton,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Text style={[styles.buttonText, variant === 'primary' && styles.primaryButtonText]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: '100%',
    padding: spacing.xl,
    borderRadius: radius.panel,
    backgroundColor: colors.elevatedCard,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    ...shadow.lifted,
  },
  title: { ...type.h2, textAlign: 'center' },
  body: { ...type.bodySmall, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
  tips: { marginTop: spacing.md, gap: spacing.xs },
  tip: { ...type.caption, color: colors.textPrimary },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center', marginTop: spacing.lg },
  button: {
    minHeight: minTapTarget,
    minWidth: 112,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSage,
  },
  primaryButton: { backgroundColor: colors.accent },
  buttonText: { ...type.button, color: colors.accentDeep },
  primaryButtonText: { color: colors.onAccent },
  pressed: { opacity: 0.76 },
});
