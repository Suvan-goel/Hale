/**
 * Results screen: beta home movement estimates first, then supporting measurements and trends.
 * Wellness-side language only: home estimates and repeatable patterns, never clinical claims.
 */

import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { BackArrowButton } from '../components/BackArrowButton';
import { HeaderLogo } from '../components/HeaderLogo';
import { CheckUp } from '../checkup/types';
import { Card, PrimaryButton, Screen, SecondaryButton } from '../components/ui';
import type { AgeBand, MovementAssessment } from '../adherence';
import { getAssessmentResultState } from '../haleFlow/assessmentResultState';
import { ExtraTrendPoint, MetricTrend, StoredCheckUp, computeTrends } from '../history';
import {
  CheckUpScore,
  DOMAIN_LABEL,
  DomainResult,
  selectFocusFromScore,
  type ScoreFocusSelection,
  type VersionedCheckUpScoreSnapshot,
} from '../scoring';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { compactTypography, useResponsiveLayout } from '../theme/responsive';

export function ResultsScreen({
  checkUp: _checkUp,
  history,
  onDone,
  onRetake,
  onViewPlan,
  nextPlanReady = false,
  showBackButton = false,
  extraTrendPoints = [],
  assessment,
  score,
  scoreSnapshot,
  age,
  ageBand,
}: {
  checkUp: CheckUp;
  history: StoredCheckUp[];
  assessment?: MovementAssessment | null;
  score?: CheckUpScore | null;
  scoreSnapshot?: VersionedCheckUpScoreSnapshot | null;
  age?: number | null;
  ageBand?: AgeBand | null;
  onDone: () => void;
  onRetake?: () => void;
  onViewPlan?: () => void;
  nextPlanReady?: boolean;
  showBackButton?: boolean;
  /** Weekly micro-check points to merge into the trend line. */
  extraTrendPoints?: ExtraTrendPoint[];
}) {
  const responsive = useResponsiveLayout();
  const resultState = React.useMemo(() => getAssessmentResultState({ score: score ?? null, scoreSnapshot, assessment }), [assessment, score, scoreSnapshot]);
  const trends = React.useMemo(
    () => computeTrends(history, extraTrendPoints).filter((t) => t.points.length >= 2),
    [history, extraTrendPoints]
  );
  const focusSelection = React.useMemo(
    () => scoreSnapshot?.focusSelection ?? selectFocusFromScore(score, { activeFocusDomain: score?.weakestDomain }),
    [score, scoreSnapshot]
  );
  const focusDomain = focusSelection?.focusDomain ?? score?.weakestDomain ?? null;
  const focusLabel = focusDomain ? DOMAIN_LABEL[focusDomain] : null;
  const closelyMatched = focusSelection?.kind === 'exact_tie' || focusSelection?.kind === 'near_tie';
  const comparisonRange = React.useMemo(() => ageComparisonRange(age ?? null, ageBand ?? null), [age, ageBand]);
  const planIsReady = nextPlanReady && resultState.canCreateBlock && !!focusLabel;
  const showViewPlanAction = planIsReady && !!onViewPlan;
  const showRetakeAction = !!onRetake && resultState.canRetake;

  return (
    <Screen contentStyle={styles.screenContent}>
      {showBackButton ? (
        <BackArrowButton accessibilityLabel="Back to Progress" onPress={onDone} />
      ) : null}
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Movement Check-Up</Text>
        <View style={styles.titleGroup}>
          <HeaderLogo size={30} />
          <Text style={[styles.title, responsive.isCompactPhone && compactTypography.pageTitle]}>Your results</Text>
        </View>
        <Text style={styles.subtitle}>
          {planIsReady
            ? 'Your next plan is ready.'
            : resultState.canCreateBlock && focusLabel
            ? 'Hale found one clear place to focus next.'
            : 'Hale needs a clearer result before building your plan.'}
        </Text>
      </View>

      <View style={[styles.focusOverviewCard, responsive.isCompactPhone && styles.compactCardPadding]}>
        <View style={styles.focusTopRow}>
          <Text style={styles.focusKicker}>
            {planIsReady
              ? 'Next plan'
              : resultState.canCreateBlock && focusLabel
                ? 'Suggested focus'
                : 'Retake needed'}
          </Text>
        </View>
        <Text style={styles.focusValue}>
          {resultState.canCreateBlock && focusLabel
            ? closelyMatched
              ? tiedDomainLabels(focusSelection)
              : focusLabel
            : resultState.recoveryTitle}
        </Text>
        <Text style={styles.focusBody}>
          {planIsReady && focusLabel
            ? readyPlanFocusBody(focusLabel)
            : resultState.canCreateBlock && focusLabel
            ? closelyMatched
              ? `${focusLabel} is where your next plan will start. The other areas stay included.`
              : 'Your next plan will start here and still include the other areas.'
            : resultState.recoveryBody}
        </Text>
      </View>

      <View style={styles.resultsIntro}>
        <Text style={styles.sectionTitle}>The three areas</Text>
        <Text style={styles.sectionSubtle}>
          {comparisonRange
            ? 'Beta estimates compared with your age group.'
            : 'Add your age range to compare with your age group.'}
        </Text>
      </View>

      {score ? (
        <Card style={styles.areasPanel}>
          {score.domains.map((d, index) => (
            <DomainAreaRow
              key={d.domain}
              domain={d}
              comparisonRange={comparisonRange}
              isLast={index === score.domains.length - 1}
            />
          ))}
        </Card>
      ) : (
        <Card style={styles.emptyResultCard}>
          <Text style={styles.sectionTitle}>Stored result</Text>
          <Text style={styles.sectionSubtle}>
            This check-up was saved before Hale started storing versioned beta estimate snapshots, so its interpretation
            is unavailable.
          </Text>
        </Card>
      )}

      {trends.length > 0 ? (
        <Card style={styles.trendCard}>
          <Text style={styles.sectionTitle}>Changes over time</Text>
          <Text style={styles.sectionSubtle}>{trendSummaryCopy(trends)}</Text>
        </Card>
      ) : null}

      {showViewPlanAction || showRetakeAction ? (
        <View style={styles.actions}>
          {showViewPlanAction && onViewPlan ? (
            <PrimaryButton title="View plan" onPress={onViewPlan} />
          ) : null}
          {showRetakeAction && onRetake ? (
            showViewPlanAction ? (
              <SecondaryButton title="Retake check-up" onPress={onRetake} />
            ) : (
              <PrimaryButton title="Retake check-up" onPress={onRetake} />
            )
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}

function DomainAreaRow({
  domain,
  comparisonRange,
  isLast,
}: {
  domain: DomainResult;
  comparisonRange: AgeComparisonRange | null;
  isLast: boolean;
}) {
  const primaryMetric = primaryMetricForDomain(domain);
  const metricDisplay = primaryMetric ? splitMetricDisplay(primaryMetric.display) : null;
  return (
    <View style={[styles.domainAreaRow, isLast && styles.domainAreaRowLast]}>
      <View style={styles.domainAreaHeader}>
        <DomainGlyph domain={domain.domain} />
        <View style={styles.domainTitleCopy}>
          <Text style={styles.domainTitle}>{domain.label}</Text>
          <Text style={domain.measured ? styles.domainTakeaway : styles.domainTakeawayMuted}>
            {domainAgeComparisonLabel(domain, comparisonRange)}
          </Text>
        </View>
      </View>

      <Text style={styles.domainBody}>{domainSimpleBody(domain)}</Text>

      {primaryMetric ? (
        <View style={styles.domainMetricStrip}>
          <Text style={styles.domainMetricLabel}>{primaryMetric.label}</Text>
          <Text style={styles.domainMetricValue} accessibilityLabel={primaryMetric.display}>
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
              primaryMetric.display
            )}
          </Text>
        </View>
      ) : null}
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

function DomainGlyph({ domain, emphasized }: { domain: DomainResult['domain']; emphasized?: boolean }) {
  const stroke = emphasized ? colors.onAccent : colors.accentDeep;
  return (
    <View style={[styles.domainIcon, emphasized && styles.domainIconEmphasized]}>
      <Svg width={25} height={25} viewBox="0 0 24 24" accessibilityElementsHidden>
        {domain === 'strength' ? (
          <>
            <Path d="M5 14h14" stroke={stroke} strokeWidth={1.9} strokeLinecap="round" />
            <Path d="M7 10v8M17 10v8M10 12h4" stroke={stroke} strokeWidth={1.7} strokeLinecap="round" />
          </>
        ) : domain === 'balance' ? (
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

function tiedDomainLabels(focusSelection: ScoreFocusSelection | null | undefined): string {
  if (!focusSelection) return '';
  return focusSelection.tiedDomains.map((domain) => DOMAIN_LABEL[domain]).join(' + ');
}

function readyPlanFocusBody(focusLabel: string): string {
  return `Your plan starts with ${focusLabel.toLowerCase()} and still includes the other areas.`;
}

function domainSimpleBody(domain: DomainResult): string {
  if (!domain.measured) return 'Retake this section to estimate it.';
  if (domain.domain === 'strength') return 'Measured from your chair stands.';
  if (domain.domain === 'balance') return 'Measured from your balance hold.';
  return 'Measured from your shoulder reach.';
}

function primaryMetricForDomain(domain: DomainResult): DomainResult['rows'][number] | null {
  const measuredRows = domain.rows.filter((row) => row.measured);
  if (domain.domain === 'strength') {
    return measuredRows.find((row) => /chair stands/i.test(row.label)) ?? measuredRows[0] ?? null;
  }
  if (domain.domain === 'balance') {
    return measuredRows.find((row) => /one-leg balance/i.test(row.label)) ?? measuredRows[0] ?? null;
  }
  return measuredRows.find((row) => /shoulder reach/i.test(row.label)) ?? measuredRows[0] ?? null;
}

type AgeComparisonRange = {
  low: number;
  high: number;
};

const AGE_BAND_COMPARISON_RANGES: Record<AgeBand, AgeComparisonRange> = {
  under_45: { low: 18, high: 44 },
  '45_54': { low: 45, high: 54 },
  '55_64': { low: 55, high: 64 },
  '65_74': { low: 65, high: 74 },
  '75_plus': { low: 75, high: 90 },
};

function ageComparisonRange(age: number | null, ageBand: AgeBand | null): AgeComparisonRange | null {
  if (ageBand) return AGE_BAND_COMPARISON_RANGES[ageBand];
  if (typeof age === 'number' && Number.isFinite(age)) {
    const rounded = Math.round(age);
    return { low: rounded, high: rounded };
  }
  return null;
}

function domainAgeComparisonLabel(domain: DomainResult, ageRange: AgeComparisonRange | null): string {
  if (!domain.measured || !Number.isFinite(domain.ageLow) || !Number.isFinite(domain.ageHigh)) {
    return 'Needs a retake';
  }
  if (!ageRange) return 'Add age range to compare';
  if (domain.ageHigh < ageRange.low) return 'Ahead of your age group';
  if (domain.ageLow > ageRange.high) return 'Could use support for your age group';
  return 'In range for your age group';
}

function trendSummaryCopy(trends: MetricTrend[]): string {
  if (trends.length === 0) {
    return 'Do another check-up later to see what is changing.';
  }
  const changed = trends.filter((trend) => Math.abs(trend.delta ?? 0) > 1e-9);
  if (changed.length === 0) {
    return 'No clear change yet.';
  }
  if (changed.length === 1) {
    return `${changed[0].label} changed since your last check-up.`;
  }
  return `${changed.length} measurements changed since your last check-up.`;
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
  domainTakeawayMuted: {
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
    color: colors.textTertiary,
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
  emptyResultCard: {
    gap: spacing.sm,
    paddingHorizontal: 22,
    paddingVertical: 22,
    borderRadius: radius.panel,
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
  actions: { gap: spacing.md },
});
