import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import {
  CheckupType,
  MovementAssessment,
  MovementBlock,
  TrainingSessionCompletion,
} from '../adherence';
import { BackArrowButton } from '../components/BackArrowButton';
import { HeaderLogo } from '../components/HeaderLogo';
import { PrimaryButton, Screen } from '../components/ui';
import { getManualCheckupCopy, getManualCheckupOptions } from '../haleFlow';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';

export function ManualCheckupStartScreen({
  latestAssessment,
  activeBlock,
  completions,
  onSelectCheckup,
  onMicroCheck,
  onCancel,
}: {
  latestAssessment: MovementAssessment | null;
  activeBlock: MovementBlock | null;
  completions: readonly TrainingSessionCompletion[];
  onSelectCheckup: (type: CheckupType) => void;
  onMicroCheck: () => void;
  onCancel: () => void;
}) {
  const copy = getManualCheckupCopy();
  const options = getManualCheckupOptions({ latestAssessment, activeBlock, completions });
  const recommendedOption = options.find((option) => option.recommended) ?? options[0];
  const secondaryOptions = options.filter((option) => option !== recommendedOption);

  const selectOption = React.useCallback(
    (type: (typeof options)[number]['type']) => {
      if (type === 'micro_check') {
        onMicroCheck();
        return;
      }
      onSelectCheckup(type);
    },
    [onMicroCheck, onSelectCheckup]
  );

  return (
    <Screen contentStyle={styles.screen}>
      <BackArrowButton accessibilityLabel="Back" onPress={onCancel} />
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Movement Check-Up</Text>
        <View style={styles.headerTitleRow}>
          <HeaderLogo />
          <Text style={styles.title}>{copy.title}</Text>
        </View>
        <Text style={styles.subtitle}>{copy.body}</Text>
      </View>

      {recommendedOption ? (
        <View style={styles.recommendedCard}>
          <Text style={styles.cardKicker}>Recommended today</Text>
          <Text style={styles.recommendedTitle}>{recommendedOption.title}</Text>
          <Text style={styles.recommendedBody}>{recommendedOption.body}</Text>

          <PrimaryButton title={primaryActionLabel(recommendedOption.title)} onPress={() => selectOption(recommendedOption.type)} />

          {!recommendedOption.isOfficialForProgress ? (
            <Text style={styles.recommendedNote}>Saved separately, so your official 4-week comparison stays unchanged.</Text>
          ) : null}
        </View>
      ) : null}

      {secondaryOptions.length > 0 ? (
        <View style={styles.secondaryStack}>
          {secondaryOptions.map((option) => (
            <Pressable
              key={`${option.type}-${option.route}`}
              style={({ pressed }) => [styles.optionRow, pressed && styles.optionPressed]}
              onPress={() => selectOption(option.type)}
              accessibilityRole="button"
              accessibilityLabel={option.title}
            >
              <View style={styles.optionText}>
                <Text style={styles.optionKicker}>Prefer the full check-up?</Text>
                <Text style={styles.optionTitle}>{shortenSecondaryTitle(option.title)}</Text>
                <Text style={styles.optionBody}>{option.body}</Text>
              </View>
              <View style={styles.optionAction}>
                <View style={styles.optionArrow}>
                  <Svg width={7} height={13} viewBox="0 0 7 13" accessibilityElementsHidden>
                    <Path
                      d="M1 1.5L5.5 6.5L1 11.5"
                      fill="none"
                      stroke={colors.accentDeep}
                      strokeWidth={1.6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

function primaryActionLabel(title: string): string {
  const trimmed = title.trim();
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('start') || lower.startsWith('retake')) return trimmed;
  if (lower.startsWith('do ')) return trimmed.replace(/^do\b/i, 'Start');
  return `Start ${lower}`;
}

function shortenSecondaryTitle(title: string): string {
  return title.replace(/\s+anyway$/i, '');
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.xl,
  },
  header: {
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  eyebrow: {
    ...type.label,
    color: colors.accentDeep,
  },
  title: {
    fontFamily: fonts.serifMedium,
    fontSize: 34,
    lineHeight: 39,
    letterSpacing: 0,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  subtitle: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
  recommendedCard: {
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
  cardKicker: {
    ...type.label,
    color: colors.accentDeep,
  },
  recommendedTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: 31,
    lineHeight: 37,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  recommendedBody: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
  recommendedNote: {
    ...type.caption,
    color: colors.textSecondary,
    paddingTop: spacing.xs,
  },
  secondaryStack: {
    gap: spacing.md,
  },
  optionRow: {
    minHeight: 112,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: radius.panel,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    ...shadow.card,
    boxShadow: '0 10px 26px rgba(17,20,18,0.032)',
  },
  optionPressed: {
    opacity: 0.76,
  },
  optionText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  optionKicker: {
    ...type.cardCaption,
    color: colors.textTertiary,
    fontFamily: fonts.sansMedium,
  },
  optionTitle: {
    ...type.cardRowTitle,
    fontSize: 16,
    lineHeight: 22,
  },
  optionBody: {
    ...type.cardBody,
  },
  optionAction: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  optionArrow: {
    width: 30,
    height: 30,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    backgroundColor: colors.bgBase,
  },
});
