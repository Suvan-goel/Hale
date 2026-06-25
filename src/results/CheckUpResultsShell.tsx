import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { BackArrowButton } from '../components/BackArrowButton';
import { HeaderLogo } from '../components/HeaderLogo';
import { Card, PrimaryButton, Screen, ScreenHeader, SecondaryButton } from '../components/ui';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { compactTypography, useResponsiveLayout } from '../theme/responsive';
import type {
  UnifiedCheckUpResultsAction,
  UnifiedCheckUpResultsPresentation,
  UnifiedDomainResultCard,
  UnifiedResultDomainId,
  UnifiedResultsActionViewModel,
} from './types';

export function CheckUpResultsShell({
  presentation,
  onAction,
}: {
  presentation: UnifiedCheckUpResultsPresentation;
  onAction: (action: UnifiedCheckUpResultsAction) => void;
}) {
  if (presentation.variant === 'onboarding') {
    return <OnboardingResultsVariant presentation={presentation} onAction={onAction} />;
  }
  return <StandardResultsVariant presentation={presentation} onAction={onAction} />;
}

function StandardResultsVariant({
  presentation,
  onAction,
}: {
  presentation: UnifiedCheckUpResultsPresentation;
  onAction: (action: UnifiedCheckUpResultsAction) => void;
}) {
  const responsive = useResponsiveLayout();
  const backAction = presentation.actions.find((action) => action.action.type === 'done');

  return (
    <Screen contentStyle={styles.screenContent}>
      {presentation.header.showBackButton && backAction ? (
        <BackArrowButton
          accessibilityLabel={presentation.header.backAccessibilityLabel ?? 'Back'}
          onPress={() => onAction(backAction.action)}
        />
      ) : null}
      <View style={styles.header}>
        {presentation.header.eyebrow ? <Text style={styles.eyebrow}>{presentation.header.eyebrow}</Text> : null}
        <View style={styles.titleGroup}>
          <HeaderLogo size={30} />
          <Text style={[styles.title, responsive.isCompactPhone && compactTypography.pageTitle]}>
            {presentation.header.title}
          </Text>
        </View>
        {presentation.header.completedAtLabel ? (
          <Text style={styles.dateLabel}>{presentation.header.completedAtLabel}</Text>
        ) : null}
        {presentation.header.subtitle ? (
          <Text style={styles.subtitle}>{presentation.header.subtitle}</Text>
        ) : null}
      </View>

      <View style={[styles.focusOverviewCard, responsive.isCompactPhone && styles.compactCardPadding]}>
        <View style={styles.focusTopRow}>
          <Text style={styles.focusKicker}>{presentation.focus.kicker}</Text>
        </View>
        <Text style={styles.focusValue}>{presentation.focus.title}</Text>
        <Text style={styles.focusBody}>{presentation.focus.body}</Text>
      </View>

      {presentation.domainSection?.title || presentation.domainSection?.subtitle ? (
        <View style={styles.resultsIntro}>
          {presentation.domainSection.title ? (
            <Text style={styles.sectionTitle}>{presentation.domainSection.title}</Text>
          ) : null}
          {presentation.domainSection.subtitle ? (
            <Text style={styles.sectionSubtle}>{presentation.domainSection.subtitle}</Text>
          ) : null}
        </View>
      ) : null}

      <Card style={styles.areasPanel}>
        {presentation.domains.map((domain, index) => (
          <DomainAreaRow
            key={domain.id}
            domain={domain}
            isLast={index === presentation.domains.length - 1}
            onAction={onAction}
          />
        ))}
      </Card>

      {presentation.comparison ? (
        <Card style={styles.comparisonCard}>
          <Text style={styles.sectionTitle}>{presentation.comparison.title}</Text>
          {presentation.comparison.subtitle ? (
            <Text style={styles.sectionSubtle}>{presentation.comparison.subtitle}</Text>
          ) : null}
          <View style={styles.comparisonRows}>
            {presentation.comparison.rows.map((row, index) => (
              <View
                key={row.id}
                style={[
                  styles.comparisonRow,
                  index === presentation.comparison!.rows.length - 1 && styles.comparisonRowLast,
                ]}
              >
                <Text style={styles.comparisonTitle}>{row.title}</Text>
                {row.previousLabel || row.currentLabel ? (
                  <View style={styles.comparisonValues}>
                    {row.previousLabel ? (
                      <Text style={styles.comparisonValue}>{row.previousLabel}</Text>
                    ) : null}
                    {row.currentLabel ? (
                      <Text style={styles.comparisonValue}>{row.currentLabel}</Text>
                    ) : null}
                  </View>
                ) : null}
                {row.note ? <Text style={styles.comparisonNote}>{row.note}</Text> : null}
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      {presentation.trend ? (
        <Card style={styles.trendCard}>
          <Text style={styles.sectionTitle}>{presentation.trend.title}</Text>
          <Text style={styles.sectionSubtle}>{presentation.trend.body}</Text>
        </Card>
      ) : null}

      {presentation.caveat ? <Text style={styles.caveat}>{presentation.caveat}</Text> : null}

      <ActionStack actions={presentation.actions} onAction={onAction} />
    </Screen>
  );
}

function OnboardingResultsVariant({
  presentation,
  onAction,
}: {
  presentation: UnifiedCheckUpResultsPresentation;
  onAction: (action: UnifiedCheckUpResultsAction) => void;
}) {
  const responsive = useResponsiveLayout();
  return (
    <Screen>
      <View style={onboardingStyles.header}>
        <ScreenHeader
          eyebrow={presentation.header.eyebrow ?? ''}
          title={presentation.header.title}
          subtitle={presentation.header.subtitle}
        />
      </View>

      <View style={[onboardingStyles.focusCard, responsive.isCompactPhone && onboardingStyles.compactCardPadding]}>
        <View style={onboardingStyles.focusTopRow}>
          <Text style={onboardingStyles.eyebrow}>{presentation.focus.kicker}</Text>
        </View>
        <Text style={onboardingStyles.focusTitle}>{presentation.focus.title}</Text>
        <View style={onboardingStyles.focusRule} />
        <Text style={onboardingStyles.focusBody}>{presentation.focus.body}</Text>
      </View>

      <View style={onboardingStyles.domainStack}>
        {presentation.domains.map((domain) => (
          <OnboardingDomainSummaryCard
            key={domain.id}
            domain={domain}
            onAction={onAction}
          />
        ))}
      </View>

      {presentation.plan.status !== 'hidden' && presentation.plan.title && presentation.plan.body ? (
        <View style={[onboardingStyles.nextCard, responsive.isCompactPhone && onboardingStyles.compactCardPadding]}>
          <View style={onboardingStyles.noteHead}>
            <Text style={onboardingStyles.nextTitle}>{presentation.plan.title}</Text>
          </View>
          <View style={onboardingStyles.nextRule} />
          <Text style={onboardingStyles.nextBody}>{presentation.plan.body}</Text>
        </View>
      ) : null}

      {presentation.caveat ? <Text style={styles.caveat}>{presentation.caveat}</Text> : null}

      <ActionStack actions={presentation.actions} onAction={onAction} />
    </Screen>
  );
}

function ActionStack({
  actions,
  onAction,
}: {
  actions: readonly UnifiedResultsActionViewModel[];
  onAction: (action: UnifiedCheckUpResultsAction) => void;
}) {
  const buttonActions = actions.filter((action) => action.id !== 'back' && action.id !== 'done-back');
  if (buttonActions.length === 0) return null;
  return (
    <View style={styles.actions}>
      {buttonActions.map((action) =>
        action.button === 'primary' ? (
          <PrimaryButton
            key={action.id}
            title={action.label}
            disabled={action.disabled}
            accessibilityLabel={action.accessibilityLabel}
            onPress={() => {
              if (!action.disabled) onAction(action.action);
            }}
          />
        ) : (
          <SecondaryButton
            key={action.id}
            title={action.label}
            disabled={action.disabled}
            accessibilityLabel={action.accessibilityLabel}
            onPress={() => {
              if (!action.disabled) onAction(action.action);
            }}
          />
        )
      )}
    </View>
  );
}

function DomainAreaRow({
  domain,
  isLast,
  onAction,
}: {
  domain: UnifiedDomainResultCard;
  isLast: boolean;
  onAction: (action: UnifiedCheckUpResultsAction) => void;
}) {
  const metricDisplay = domain.metricValue ? splitMetricDisplay(domain.metricValue) : null;
  const content = (
    <>
      <View style={styles.domainAreaHeader}>
        <DomainGlyph iconToken={domain.iconToken} />
        <View style={styles.domainTitleCopy}>
          <Text style={styles.domainTitle}>{domain.title}</Text>
          {domain.interpretation ? (
            <Text style={domain.tone === 'attention' ? styles.domainTakeawayAttention : styles.domainTakeaway}>
              {domain.interpretation}
            </Text>
          ) : null}
        </View>
      </View>

      {domain.body ? <Text style={styles.domainBody}>{domain.body}</Text> : null}

      {domain.metricLabel || domain.metricValue ? (
        <View style={styles.domainMetricStrip}>
          <Text style={styles.domainMetricLabel}>{domain.metricLabel}</Text>
          <Text style={styles.domainMetricValue} accessibilityLabel={domain.metricValue}>
            {metricDisplay ? (
              <>
                <Text style={styles.domainMetricNumber}>{metricDisplay.value}</Text>
                {metricDisplay.unit ? (
                  <Text style={styles.domainMetricUnit}>
                    {metricDisplay.separator}
                    {metricDisplay.unit}
                  </Text>
                ) : null}
              </>
            ) : (
              domain.metricValue
            )}
          </Text>
        </View>
      ) : null}
    </>
  );

  if (domain.detailActionAvailable) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.domainAreaRow,
          isLast && styles.domainAreaRowLast,
          pressed && styles.pressed,
        ]}
        onPress={() => onAction({ type: 'view_domain_detail', domain: domainIdToMovementDomain(domain.id) })}
        accessibilityRole="button"
        accessibilityLabel={domain.accessibilityLabel ?? `${domain.title}. ${domain.metricValue}. ${domain.interpretation ?? ''}`}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.domainAreaRow, isLast && styles.domainAreaRowLast]}>{content}</View>;
}

function OnboardingDomainSummaryCard({
  domain,
  onAction,
}: {
  domain: UnifiedDomainResultCard;
  onAction: (action: UnifiedCheckUpResultsAction) => void;
}) {
  const responsive = useResponsiveLayout();
  const card = (
    <View
      style={[
        onboardingStyles.domainCard,
        responsive.isCompactPhone && onboardingStyles.compactCardPadding,
        domain.featured && onboardingStyles.domainCardFeatured,
      ]}
    >
      <View style={[onboardingStyles.domainMark, domain.featured && onboardingStyles.domainMarkFeatured]}>
        <Text style={[onboardingStyles.domainMarkText, domain.featured && onboardingStyles.domainMarkTextFeatured]}>
          {domainIconLetter(domain.id)}
        </Text>
      </View>
      <View style={onboardingStyles.domainCopy}>
        <Text style={onboardingStyles.domainTitle}>{domain.title}</Text>
        <Text style={onboardingStyles.domainStatus}>{domain.statusLabel ?? domain.interpretation}</Text>
      </View>
      <View style={onboardingStyles.domainBandWrap}>
        <Text style={onboardingStyles.domainBand}>{domain.bandLabel ?? domain.metricValue}</Text>
      </View>
    </View>
  );

  if (!domain.detailActionAvailable) return card;
  return (
    <Pressable
      onPress={() => onAction({ type: 'view_domain_detail', domain: domainIdToMovementDomain(domain.id) })}
      accessibilityRole="button"
      accessibilityLabel={domain.accessibilityLabel ?? `${domain.title}. ${domain.metricValue}. ${domain.interpretation ?? ''}`}
    >
      {card}
    </Pressable>
  );
}

function splitMetricDisplay(display: string): { value: string; separator: string; unit: string } | null {
  const match = display.trim().match(/^(-?\d+(?:\.\d+)?)(\s*)(.*)$/);
  if (!match) return null;
  return {
    value: match[1],
    separator: match[2],
    unit: match[3],
  };
}

function DomainGlyph({
  iconToken,
  emphasized,
}: {
  iconToken: UnifiedDomainResultCard['iconToken'];
  emphasized?: boolean;
}) {
  const stroke = emphasized ? colors.onAccent : colors.accentDeep;
  return (
    <View style={[styles.domainIcon, emphasized && styles.domainIconEmphasized]}>
      <Svg width={25} height={25} viewBox="0 0 24 24" accessibilityElementsHidden>
        {iconToken === 'strength' ? (
          <>
            <Path d="M5 14h14" stroke={stroke} strokeWidth={1.9} strokeLinecap="round" />
            <Path d="M7 10v8M17 10v8M10 12h4" stroke={stroke} strokeWidth={1.7} strokeLinecap="round" />
          </>
        ) : iconToken === 'balance' ? (
          <>
            <Path d="M12 5v12" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" />
            <Path d="M7 18h10" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" />
            <Circle cx={12} cy={5} r={2.2} stroke={stroke} strokeWidth={1.5} fill="none" />
            <Path d="M8 10c2.2 1.3 5.8 1.3 8 0" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" fill="none" />
          </>
        ) : (
          <>
            <Path d="M6 16c3.7-7.7 8.6-7.7 12 0" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" fill="none" />
            <Path d="M7 17h10" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" />
            <Circle cx={12} cy={10} r={2.1} stroke={stroke} strokeWidth={1.5} fill="none" />
          </>
        )}
      </Svg>
    </View>
  );
}

function domainIdToMovementDomain(id: UnifiedResultDomainId) {
  if (id === 'strength_power') return 'strength_power';
  if (id === 'balance_stability') return 'balance';
  return 'mobility';
}

function domainIconLetter(id: UnifiedResultDomainId): string {
  if (id === 'strength_power') return 'S';
  if (id === 'balance_stability') return 'B';
  return 'M';
}

const styles = StyleSheet.create({
  screenContent: {
    gap: 20,
  },
  header: { gap: spacing.sm, paddingTop: spacing.xs },
  eyebrow: {
    ...type.label,
    color: colors.accentDeep,
    fontSize: 11,
    lineHeight: 16,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  title: {
    ...type.pageTitle,
    flexShrink: 1,
    fontSize: 30,
    lineHeight: 36,
  },
  dateLabel: {
    ...type.cardCaption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  subtitle: {
    ...type.pageSubtitle,
    maxWidth: 340,
  },
  focusOverviewCard: {
    gap: spacing.md,
    paddingHorizontal: 24,
    paddingVertical: 26,
    borderRadius: radius.panel,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
    boxShadow: `0 18px 38px ${colors.shadowSoft}`,
  },
  compactCardPadding: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  focusTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.md,
  },
  focusKicker: {
    ...type.label,
    color: colors.accentDeep,
    fontSize: 11,
    lineHeight: 16,
  },
  focusValue: {
    fontFamily: fonts.serifMedium,
    fontSize: 38,
    lineHeight: 43,
    letterSpacing: 0,
    color: colors.accentDeep,
  },
  focusBody: {
    ...type.cardBody,
    color: colors.textSecondary,
    maxWidth: 340,
  },
  resultsIntro: {
    gap: spacing.xs,
    paddingTop: spacing.sm,
    paddingHorizontal: 2,
  },
  areasPanel: {
    paddingHorizontal: 24,
    paddingVertical: 2,
    borderRadius: radius.panel,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    boxShadow: `0 14px 32px ${colors.shadowSoft}`,
  },
  domainIcon: {
    width: 30,
    height: 30,
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  domainIconEmphasized: {
    backgroundColor: 'transparent',
  },
  domainAreaRow: {
    gap: 10,
    paddingVertical: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  domainAreaRowLast: {
    borderBottomWidth: 0,
  },
  domainAreaHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  domainTitleCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  domainTitle: {
    ...type.cardTitle,
    fontSize: 24,
    lineHeight: 31,
  },
  domainTakeaway: {
    fontFamily: fonts.sansMedium,
    color: colors.accentDeep,
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: 0,
  },
  domainTakeawayAttention: {
    fontFamily: fonts.sansMedium,
    color: colors.accentDeep,
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: 0,
  },
  domainBody: {
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: 0,
    color: colors.textSecondary,
    paddingLeft: 44,
    paddingRight: 4,
  },
  domainMetricStrip: {
    minHeight: 44,
    marginLeft: 44,
    marginTop: 2,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  domainMetricValue: {
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
    flexShrink: 0,
  },
  domainMetricNumber: {
    fontFamily: fonts.sansMedium,
    fontSize: 24,
    lineHeight: 29,
    letterSpacing: 0,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  domainMetricUnit: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: 0,
    color: colors.textSecondary,
  },
  domainMetricLabel: {
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: 0,
    color: colors.textSecondary,
    flex: 1,
  },
  trendCard: {
    gap: spacing.sm,
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: radius.panel,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  comparisonCard: {
    gap: spacing.sm,
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: radius.panel,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  comparisonRows: {
    marginTop: spacing.sm,
  },
  comparisonRow: {
    gap: spacing.xs,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  comparisonRowLast: {
    borderBottomWidth: 0,
  },
  comparisonTitle: {
    ...type.cardBody,
    fontFamily: fonts.sansMedium,
    color: colors.textPrimary,
  },
  comparisonValues: {
    gap: 2,
  },
  comparisonValue: {
    ...type.cardCaption,
    color: colors.textSecondary,
  },
  comparisonNote: {
    ...type.cardCaption,
    color: colors.textSecondary,
  },
  sectionTitle: {
    ...type.cardTitle,
    fontSize: 22,
    lineHeight: 28,
  },
  sectionSubtle: {
    ...type.cardBody,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  caveat: {
    ...type.cardCaption,
    color: colors.textSecondary,
  },
  actions: { gap: spacing.md },
  pressed: {
    opacity: 0.72,
  },
});

const onboardingStyles = StyleSheet.create({
  header: { gap: spacing.xs },
  focusCard: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.panel,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    boxShadow: '0 12px 30px rgba(17,20,18,0.04)',
  },
  compactCardPadding: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  focusTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.md,
  },
  eyebrow: {
    ...type.label,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  focusTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  focusRule: {
    width: 48,
    height: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.accentGold,
  },
  focusBody: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
  domainStack: {
    gap: spacing.md,
  },
  domainCard: {
    minHeight: 94,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    boxShadow: '0 8px 22px rgba(17,20,18,0.026)',
  },
  domainCardFeatured: {
    borderColor: colors.goldBorder,
    backgroundColor: colors.bgGold,
  },
  domainMark: {
    width: 46,
    height: 46,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgBase,
  },
  domainMarkFeatured: {
    backgroundColor: colors.surface,
  },
  domainMarkText: {
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 0,
    color: colors.textSecondary,
  },
  domainMarkTextFeatured: {
    color: colors.accentDeep,
  },
  domainCopy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  domainTitle: {
    ...type.cardRowTitle,
    fontSize: 16,
    lineHeight: 21,
  },
  domainStatus: {
    ...type.caption,
    color: colors.textSecondary,
  },
  domainBandWrap: {
    maxWidth: 132,
    alignItems: 'flex-end',
  },
  domainBand: {
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0,
    color: colors.accentDeep,
    textAlign: 'right',
  },
  nextCard: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.panel,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    boxShadow: '0 10px 26px rgba(17,20,18,0.032)',
  },
  noteHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  nextTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: 25,
    lineHeight: 31,
    letterSpacing: 0,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  nextRule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderHairline,
  },
  nextBody: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
});
