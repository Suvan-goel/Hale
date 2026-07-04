import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import {
  CheckupType,
  MovementAssessment,
  MovementBlock,
  MovementDomain,
  TrainingSessionCompletion,
} from '../adherence';
import { BackArrowButton } from '../components/BackArrowButton';
import { HeaderLogo } from '../components/HeaderLogo';
import { PrimaryButton, Screen } from '../components/ui';
import { getManualCheckupCopy, getManualCheckupOptions } from '../haleFlow';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { compactTypography, useResponsiveLayout } from '../theme/responsive';

/** The quick check's three domains, chosen inline so no second chooser screen is needed. */
const MICRO_CHECK_DOMAINS: readonly { domain: MovementDomain; label: string; hint: string }[] = [
  { domain: 'strength_power', label: 'Strength', hint: 'A short chair-rise check-in for power.' },
  { domain: 'balance', label: 'Balance', hint: 'A short steadiness check-in.' },
  { domain: 'mobility', label: 'Mobility', hint: 'A short range-of-motion check-in.' },
];

export function ManualCheckupStartScreen({
  latestAssessment,
  activeBlock,
  completions,
  onSelectCheckup,
  onStartMicroCheck,
  onCancel,
}: {
  latestAssessment: MovementAssessment | null;
  activeBlock: MovementBlock | null;
  completions: readonly TrainingSessionCompletion[];
  onSelectCheckup: (type: CheckupType) => void;
  onStartMicroCheck: (domain: MovementDomain) => void;
  onCancel: () => void;
}) {
  const responsive = useResponsiveLayout();
  const copy = getManualCheckupCopy({ activeBlock: !!activeBlock });
  const options = getManualCheckupOptions({ latestAssessment, activeBlock, completions });
  const recommendedOption = options.find((option) => option.recommended) ?? options[0];
  const secondaryOptions = options.filter((option) => option !== recommendedOption);

  return (
    <Screen contentStyle={styles.screen}>
      <BackArrowButton accessibilityLabel="Back" onPress={onCancel} />
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Movement Check-Up</Text>
        <View style={styles.headerTitleRow}>
          <HeaderLogo />
          <Text style={[styles.title, responsive.isCompactPhone && compactTypography.pageTitle]}>{copy.title}</Text>
        </View>
        <Text style={styles.subtitle}>{copy.body}</Text>
      </View>

      {recommendedOption ? (
        <View style={[styles.recommendedCard, responsive.isCompactPhone && styles.compactCardPadding]}>
          <View style={styles.recommendedHeaderRow}>
            <View style={styles.recommendedBadge}>
              <View style={styles.recommendedBadgeDot} />
              <Text style={styles.cardKicker}>Recommended today</Text>
            </View>
            <Text style={styles.recommendedMeta}>{recommendationMeta(recommendedOption)}</Text>
          </View>

          <View style={styles.recommendedCopy}>
            <Text style={styles.recommendedTitle}>{recommendedOption.title}</Text>
            <Text style={styles.recommendedBody}>{recommendedOption.body}</Text>
          </View>

          {recommendedOption.type === 'micro_check' ? (
            <MicroCheckDomainButtons onStartMicroCheck={onStartMicroCheck} />
          ) : (
            <PrimaryButton
              title={primaryActionLabel(recommendedOption)}
              onPress={() => onSelectCheckup(recommendedOption.type)}
              style={styles.recommendedButton}
            />
          )}

          {!recommendedOption.isOfficialForProgress ? (
            <View style={styles.recommendedNoteRow}>
              <View style={styles.noteMark}>
                <Svg width={12} height={12} viewBox="0 0 12 12" accessibilityElementsHidden>
                  <Path
                    d="M3 6.15L5.1 8.2L9 3.9"
                    fill="none"
                    stroke={colors.accentDeep}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
              <Text style={styles.recommendedNote}>{nonOfficialNote(recommendedOption, !!activeBlock)}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {secondaryOptions.length > 0 ? (
        <View style={styles.secondaryStack}>
          {secondaryOptions.map((option) =>
            option.type === 'micro_check' ? (
              <View
                key={`${option.type}-${option.route}`}
                style={[styles.optionRow, styles.optionRowStatic, responsive.isCompactPhone && styles.compactCardPadding]}
              >
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionBody}>{option.body}</Text>
                  <MicroCheckDomainButtons onStartMicroCheck={onStartMicroCheck} />
                </View>
              </View>
            ) : (
              <Pressable
                key={`${option.type}-${option.route}`}
                style={({ pressed }) => [
                  styles.optionRow,
                  responsive.isCompactPhone && styles.compactCardPadding,
                  pressed && styles.optionPressed,
                ]}
                onPress={() => onSelectCheckup(option.type)}
                accessibilityRole="button"
                accessibilityLabel={`${option.title}. ${option.body}`}
              >
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
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
            )
          )}
        </View>
      ) : null}
    </Screen>
  );
}

/** One tap per domain — replaces the former separate domain-chooser screen. */
function MicroCheckDomainButtons({
  onStartMicroCheck,
}: {
  onStartMicroCheck: (domain: MovementDomain) => void;
}) {
  return (
    <View style={styles.domainRow}>
      {MICRO_CHECK_DOMAINS.map((item) => (
        <Pressable
          key={item.domain}
          style={({ pressed }) => [styles.domainButton, pressed && styles.optionPressed]}
          onPress={() => onStartMicroCheck(item.domain)}
          accessibilityRole="button"
          accessibilityLabel={`Start ${item.label} check. ${item.hint}`}
        >
          <Text style={styles.domainButtonText}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function primaryActionLabel(option: (ReturnType<typeof getManualCheckupOptions>)[number]): string {
  const title = option.title;
  const trimmed = title.trim();
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('start') || lower.startsWith('retake')) return trimmed;
  if (lower.startsWith('do ')) return trimmed.replace(/^do\b/i, 'Start');
  return `Start ${lower}`;
}

function nonOfficialNote(
  option: (ReturnType<typeof getManualCheckupOptions>)[number],
  hasActiveBlock: boolean
): string {
  if (option.type === 'micro_check' || hasActiveBlock) {
    return 'Your 4-week check-up schedule stays the same.';
  }
  return 'Saved separately from your official check-up trend.';
}

function recommendationMeta(option: (ReturnType<typeof getManualCheckupOptions>)[number]): string {
  if (option.type === 'micro_check') return 'Quick check-in';
  if (option.type === 'official_retest') return 'Full check-up';
  if (option.type === 'baseline_retake') return 'Retake';
  return 'Full check-up';
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
    lineHeight: 44,
    letterSpacing: 0,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  subtitle: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
  recommendedCard: {
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    borderRadius: radius.panel,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    ...shadow.card,
    boxShadow: '0 18px 44px rgba(17,20,18,0.055)',
  },
  compactCardPadding: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  recommendedHeaderRow: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  recommendedBadge: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.bgGold,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldBorder,
  },
  recommendedBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentGold,
  },
  cardKicker: {
    ...type.cardCaption,
    fontFamily: fonts.sansMedium,
    color: colors.accentDeep,
  },
  recommendedMeta: {
    ...type.cardCaption,
    fontFamily: fonts.sansMedium,
    color: colors.textTertiary,
    flexShrink: 1,
    textAlign: 'right',
  },
  recommendedCopy: {
    gap: spacing.md,
  },
  recommendedTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: 33,
    lineHeight: 40,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  recommendedBody: {
    ...type.bodySmall,
    fontSize: 16,
    lineHeight: 25,
    color: colors.textSecondary,
  },
  recommendedButton: {
    boxShadow: '0 12px 24px rgba(65,76,52,0.16)',
  },
  recommendedNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderHairline,
  },
  noteMark: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.bgGold,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldBorder,
  },
  recommendedNote: {
    ...type.caption,
    color: colors.textSecondary,
    flex: 1,
    minWidth: 0,
  },
  secondaryStack: {
    gap: spacing.md,
  },
  optionRow: {
    minHeight: 128,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.panel,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    ...shadow.card,
    boxShadow: '0 12px 30px rgba(17,20,18,0.038)',
  },
  optionPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.992 }],
  },
  optionRowStatic: {
    // The quick-check card is not itself pressable — its domain buttons are.
    justifyContent: 'flex-start',
  },
  domainRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  domainButton: {
    flexGrow: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.bgGold,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldBorder,
  },
  domainButtonText: {
    ...type.bodySmall,
    fontFamily: fonts.sansMedium,
    color: colors.accentDeep,
  },
  optionText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.sm,
  },
  optionTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: 25,
    lineHeight: 31,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  optionBody: {
    ...type.cardBody,
    fontSize: 15,
    lineHeight: 22,
  },
  optionAction: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  optionArrow: {
    width: 40,
    height: 40,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldBorder,
    backgroundColor: colors.surface,
    boxShadow: '0 6px 16px rgba(17,20,18,0.045)',
  },
});
