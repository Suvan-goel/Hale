import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
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

      {presentation.populationComparison ? (
        // Quiet, subordinate entry below her own trend (founder condition 2) —
        // deliberately plainer than the result cards above it.
        <View style={styles.populationComparison} accessibilityLabel={presentation.populationComparison.accessibilityLabel}>
          <Text style={styles.populationComparisonTitle}>{presentation.populationComparison.title}</Text>
          <Text style={styles.populationComparisonBody}>{presentation.populationComparison.body}</Text>
          <SecondaryButton
            title={presentation.populationComparison.toggleLabel}
            onPress={() => onAction({ type: 'toggle_population_comparison' })}
          />
        </View>
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
    <Screen contentStyle={onboardingStyles.screenContent}>
      <View style={onboardingStyles.header}>
        <ScreenHeader
          eyebrow={presentation.header.eyebrow ?? ''}
          title={presentation.header.title}
          subtitle={presentation.header.subtitle}
        />
      </View>

      <View style={[onboardingStyles.heroCard, responsive.isCompactPhone && onboardingStyles.compactHeroPadding]}>
        <View style={onboardingStyles.heroTopRow}>
          <Text style={onboardingStyles.eyebrow}>{presentation.focus.kicker}</Text>
          <View style={onboardingStyles.heroPill}>
            <Text style={onboardingStyles.heroPillText}>Plan ready</Text>
          </View>
        </View>
        <Text style={onboardingStyles.heroTitle}>{presentation.focus.title}</Text>
        <Text style={onboardingStyles.heroBody}>{presentation.focus.body}</Text>
      </View>

      <View style={onboardingStyles.sectionIntro}>
        <Text style={onboardingStyles.sectionTitle}>
          {presentation.domainSection?.title ?? 'Strength and Balance'}
        </Text>
        <Text style={onboardingStyles.sectionBody}>
          {presentation.domainSection?.subtitle ?? "The movement measurements saved from today's check-up."}
        </Text>
      </View>

      <View style={onboardingStyles.domainStack}>
        {presentation.domains.map((domain) => (
          <OnboardingDomainSummaryCard key={domain.id} domain={domain} />
        ))}
      </View>

      {presentation.plan.status !== 'hidden' && presentation.plan.title && presentation.plan.body ? (
        <View style={[onboardingStyles.nextCard, responsive.isCompactPhone && onboardingStyles.compactCardPadding]}>
          <View style={onboardingStyles.nextTopRow}>
            <Text style={onboardingStyles.nextKicker}>Next</Text>
            <View style={onboardingStyles.nextStatusPill}>
              <Text style={onboardingStyles.nextStatusText}>Ready</Text>
            </View>
          </View>
          <Text style={onboardingStyles.nextTitle}>{presentation.plan.title}</Text>
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
}: {
  domain: UnifiedDomainResultCard;
  isLast: boolean;
}) {
  const metricDisplay = domain.metricValue ? splitMetricDisplay(domain.metricValue) : null;
  return (
    <View style={[styles.domainAreaRow, isLast && styles.domainAreaRowLast]}>
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
    </View>
  );
}

function OnboardingDomainSummaryCard({ domain }: { domain: UnifiedDomainResultCard }) {
  const responsive = useResponsiveLayout();
  const metricDisplay = splitMetricDisplay(domain.bandLabel ?? domain.metricValue);
  return (
    <View
      style={[
        onboardingStyles.domainCard,
        responsive.isCompactPhone && onboardingStyles.compactCardPadding,
        domain.featured && onboardingStyles.domainCardFeatured,
      ]}
    >
      <View style={onboardingStyles.domainCopy}>
        <View style={onboardingStyles.domainTitleRow}>
          <View style={[onboardingStyles.domainMark, domain.featured && onboardingStyles.domainMarkFeatured]}>
            <DomainGlyph iconToken={domain.iconToken} flush />
          </View>
          <View style={onboardingStyles.domainTitleCopy}>
            <View style={onboardingStyles.domainNameRow}>
              <Text style={onboardingStyles.domainTitle}>{domain.title}</Text>
              {domain.featured ? (
                <View style={onboardingStyles.focusPill}>
                  <Text style={onboardingStyles.focusPillText}>Focus</Text>
                </View>
              ) : null}
            </View>
            {domain.statusLabel ?? domain.interpretation ? (
              <Text style={onboardingStyles.domainStatus}>{domain.statusLabel ?? domain.interpretation}</Text>
            ) : null}
          </View>
        </View>
      </View>
      <View style={onboardingStyles.domainBandWrap}>
        <Text style={onboardingStyles.domainBandLabel}>Result</Text>
        <Text style={onboardingStyles.domainBand} numberOfLines={2}>
          {metricDisplay ? (
            <>
              <Text style={onboardingStyles.domainBandNumber}>{metricDisplay.value}</Text>
              {metricDisplay.unit ? (
                <Text style={onboardingStyles.domainBandUnit}>
                  {metricDisplay.separator}
                  {metricDisplay.unit}
                </Text>
              ) : null}
            </>
          ) : (
            domain.bandLabel ?? domain.metricValue
          )}
        </Text>
      </View>
    </View>
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
  flush,
}: {
  iconToken: UnifiedDomainResultCard['iconToken'];
  emphasized?: boolean;
  flush?: boolean;
}) {
  const stroke = emphasized ? colors.onAccent : colors.accentDeep;
  return (
    <View style={[styles.domainIcon, flush && styles.domainIconFlush, emphasized && styles.domainIconEmphasized]}>
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
  domainIconFlush: {
    marginTop: 0,
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
  populationComparison: {
    gap: spacing.sm,
    paddingHorizontal: 24,
    paddingVertical: spacing.md,
  },
  populationComparisonTitle: {
    ...type.cardTitle,
    color: colors.textSecondary,
  },
  populationComparisonBody: {
    ...type.caption,
    color: colors.textSecondary,
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
});

const onboardingStyles = StyleSheet.create({
  screenContent: {
    gap: spacing.lg,
  },
  header: {
    gap: spacing.xs,
  },
  heroCard: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.panel,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldBorder,
    overflow: 'hidden',
    ...shadow.card,
  },
  compactCardPadding: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  compactHeroPadding: {
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  eyebrow: {
    ...type.label,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  heroPill: {
    minHeight: 30,
    justifyContent: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bgGold,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldBorder,
  },
  heroPillText: {
    ...type.cardCaption,
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
  },
  heroTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: 0,
    color: colors.accentDeep,
  },
  heroBody: {
    ...type.bodySmall,
    color: colors.textSecondary,
    maxWidth: 340,
  },
  sectionIntro: {
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  sectionTitle: {
    ...type.cardTitle,
    fontSize: 22,
    lineHeight: 28,
  },
  sectionBody: {
    ...type.caption,
    color: colors.textSecondary,
  },
  domainStack: {
    gap: spacing.sm,
  },
  domainCard: {
    minHeight: 104,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    ...shadow.soft,
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
    backgroundColor: colors.bgSurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
  },
  domainMarkFeatured: {
    backgroundColor: colors.surface,
    borderColor: colors.goldBorder,
  },
  domainCopy: {
    flex: 1,
    minWidth: 0,
  },
  domainTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minWidth: 0,
  },
  domainTitleCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  domainNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
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
  focusPill: {
    minHeight: 24,
    justifyContent: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldBorder,
  },
  focusPillText: {
    ...type.cardCaption,
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
  },
  domainBandWrap: {
    maxWidth: 118,
    alignItems: 'flex-end',
    gap: 2,
  },
  domainBandLabel: {
    ...type.cardCaption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  domainBand: {
    textAlign: 'right',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  domainBandNumber: {
    fontFamily: fonts.sansMedium,
    fontSize: 24,
    lineHeight: 29,
    letterSpacing: 0,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  domainBandUnit: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    color: colors.textSecondary,
  },
  nextCard: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.panel,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    ...shadow.soft,
  },
  nextTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  nextKicker: {
    ...type.label,
    color: colors.textSecondary,
  },
  nextStatusPill: {
    minHeight: 28,
    justifyContent: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bgGold,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldBorder,
  },
  nextStatusText: {
    ...type.cardCaption,
    fontFamily: fonts.sansMedium,
    color: colors.accentDeep,
  },
  nextTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: 25,
    lineHeight: 31,
    letterSpacing: 0,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  nextBody: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
});
