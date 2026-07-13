/**
 * Pearl programme moment surfaces: gateway teach card,
 * band/doming prompts, physio signpost, and the C9 effort check-in.
 * Presentation only: copy and precedence come
 * from the programme adapter (postSessionSurface, preSessionPrompt,
 * PROGRAMME_EFFORT_CHECKIN_COPY, PROGRAMME_SESSION_RPE_OPTIONS); actions are
 * the caller's. Design language: ScreenHeader + surface panel + the shared
 * button/option-card components.
 */

import { StyleSheet, Text, View } from 'react-native';

import { OptionCard } from '../components/OptionCard';
import { GhostButton, PrimaryButton, Screen, ScreenHeader, SecondaryButton } from '../components/ui';
import {
  PROGRAMME_EFFORT_CHECKIN_COPY,
  PROGRAMME_SESSION_RPE_OPTIONS,
  type SessionRpe,
} from '../programme';
import { colors, radius, shadow, spacing, type } from '../theme';
import { useResponsiveLayout } from '../theme/responsive';

export interface ProgrammeMomentAction {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  onPress: () => void;
}

/** One calm message + actions, in the app's message-screen language. */
export function ProgrammeMomentScreen({
  eyebrow,
  title,
  body,
  actions,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  actions: readonly ProgrammeMomentAction[];
}) {
  const responsive = useResponsiveLayout();
  return (
    <Screen contentStyle={styles.screen}>
      <ScreenHeader eyebrow={eyebrow} title={title} />
      {body ? (
        <View style={[styles.panel, responsive.isCompactPhone && styles.compactCardPadding]}>
          <Text style={styles.panelBody}>{body}</Text>
        </View>
      ) : null}
      <View style={styles.actions}>
        {actions.map((action, index) => {
          const variant = action.variant ?? (index === 0 ? 'primary' : 'ghost');
          if (variant === 'primary') {
            return <PrimaryButton key={action.label} title={action.label} onPress={action.onPress} />;
          }
          if (variant === 'secondary') {
            return (
              <SecondaryButton key={action.label} title={action.label} onPress={action.onPress} />
            );
          }
          return <GhostButton key={action.label} title={action.label} onPress={action.onPress} />;
        })}
      </View>
    </Screen>
  );
}

/** The C9 effort check-in: one tap on an option card records the session RPE. */
export function ProgrammeEffortScreen({
  onSelect,
  onSkip,
}: {
  onSelect: (rpe: SessionRpe) => void;
  onSkip: () => void;
}) {
  return (
    <Screen contentStyle={styles.screen}>
      <ScreenHeader
        eyebrow="Session done"
        title={PROGRAMME_EFFORT_CHECKIN_COPY.title}
        subtitle={PROGRAMME_EFFORT_CHECKIN_COPY.body}
      />
      <View style={styles.options}>
        {PROGRAMME_SESSION_RPE_OPTIONS.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            onPress={() => onSelect(option.value)}
          />
        ))}
      </View>
      <View style={styles.actions}>
        <GhostButton title={PROGRAMME_EFFORT_CHECKIN_COPY.skipLabel} onPress={onSkip} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: spacing.pageTop,
    paddingBottom: spacing.xxxl,
    gap: spacing.xl,
  },
  panel: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    ...shadow.soft,
  },
  panelBody: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
  compactCardPadding: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  options: {
    gap: spacing.md,
  },
  actions: {
    gap: spacing.md,
  },
});
