/**
 * Results screen: beta home movement estimates first, then supporting measurements and trends.
 * Wellness-side language only: home estimates and repeatable patterns, never clinical claims.
 */

import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Polyline } from 'react-native-svg';

import { BackArrowButton } from '../components/BackArrowButton';
import { HeaderLogo } from '../components/HeaderLogo';
import { CheckUp } from '../checkup/types';
import { Card, PrimaryButton, Screen, StatusBadge } from '../components/ui';
import type { MovementAssessment } from '../adherence';
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

export function ResultsScreen({
  checkUp: _checkUp,
  history,
  onDone,
  onRetake,
  extraTrendPoints = [],
  assessment,
  score,
  scoreSnapshot,
}: {
  checkUp: CheckUp;
  history: StoredCheckUp[];
  assessment?: MovementAssessment | null;
  score?: CheckUpScore | null;
  scoreSnapshot?: VersionedCheckUpScoreSnapshot | null;
  onDone: () => void;
  onRetake?: () => void;
  /** Weekly micro-check points to merge into the trend line. */
  extraTrendPoints?: ExtraTrendPoint[];
}) {
  const resultState = React.useMemo(() => getAssessmentResultState({ score: score ?? null, scoreSnapshot, assessment }), [assessment, score, scoreSnapshot]);
  const trends = React.useMemo(
    () => computeTrends(history, extraTrendPoints).filter((t) => t.points.length >= 2),
    [history, extraTrendPoints]
  );
  const measured = score?.domains.filter((d) => d.measured) ?? [];
  const focusSelection = React.useMemo(
    () => scoreSnapshot?.focusSelection ?? selectFocusFromScore(score, { activeFocusDomain: score?.weakestDomain }),
    [score, scoreSnapshot]
  );
  const focusDomain = focusSelection?.focusDomain ?? score?.weakestDomain ?? null;
  const focusLabel = focusDomain ? DOMAIN_LABEL[focusDomain] : null;
  const closelyMatched = focusSelection?.kind === 'exact_tie' || focusSelection?.kind === 'near_tie';

  return (
    <Screen contentStyle={styles.screenContent}>
      <BackArrowButton accessibilityLabel="Back from movement dashboard" onPress={onDone} style={styles.backButton} />
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Movement Check-Up</Text>
        <View style={styles.titleGroup}>
          <HeaderLogo size={30} />
          <Text style={styles.title}>Movement Dashboard</Text>
        </View>
        <Text style={styles.subtitle}>
          Home movement estimates from today’s guided check-up. Small changes can reflect setup or day-to-day variation.
        </Text>
      </View>

      <View style={styles.focusOverviewCard}>
        <View style={styles.focusOverviewHead}>
          <View style={styles.focusOverviewCopy}>
            <Text style={styles.focusKicker}>
              {resultState.canCreateBlock && focusLabel
                ? closelyMatched
                  ? 'Closely matched domains'
                  : 'Suggested focus'
                : 'Retake needed'}
            </Text>
            <Text style={styles.focusValue}>
              {resultState.canCreateBlock && focusLabel
                ? closelyMatched
                  ? tiedDomainLabels(focusSelection)
                  : focusLabel
                : resultState.recoveryTitle}
            </Text>
          </View>
          <DashboardPill
            label={resultState.canCreateBlock && focusLabel ? 'Next block' : 'Review'}
            variant="light"
          />
        </View>
        <Text style={styles.focusBody}>
          {resultState.canCreateBlock && focusLabel
            ? closelyMatched
              ? `${focusLabel} is the suggested focus for this block because these home estimates were closely matched.`
              : 'Hale uses this as the starting point for the current four-week training block.'
            : resultState.recoveryBody}
        </Text>
        <View style={styles.summaryRail}>
          <SummaryTile label="Domains estimated" value={`${measured.length}/3`} />
          <SummaryTile label="Check-ups in history" value={`${history.length}`} />
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderCopy}>
          <Text style={styles.sectionEyebrow}>Home estimates</Text>
          <Text style={styles.sectionSubtle}>Strength, balance, and mobility from this snapshot.</Text>
        </View>
        <DashboardPill label="Beta" />
      </View>

      {score ? (
        score.domains.map((d) => (
          <DomainCard
            key={d.domain}
            domain={d}
            isFocus={d.domain === focusDomain}
            isTied={closelyMatched && !!focusSelection?.tiedDomains.includes(d.domain)}
          />
        ))
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
          <Text style={styles.cardKicker}>Trend watch</Text>
          <Text style={styles.sectionTitle}>Trends</Text>
          <Text style={styles.sectionSubtle}>Small changes matter most when they repeat over time.</Text>
          {trends.map((t) => (
            <TrendRow key={t.key} trend={t} />
          ))}
        </Card>
      ) : (
        <Card style={styles.trendCard}>
          <Text style={styles.cardKicker}>Trend watch</Text>
          <Text style={styles.sectionTitle}>Trends</Text>
          <Text style={styles.sectionSubtle}>
            Come back for another check-up to start seeing your movement trends over time.
          </Text>
        </Card>
      )}

      {onRetake && resultState.canRetake ? (
        <View style={styles.actions}>
          <PrimaryButton title="Retake Movement Check-Up" onPress={onRetake} />
        </View>
      ) : null}
    </Screen>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryTile}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function DomainCard({ domain, isFocus, isTied }: { domain: DomainResult; isFocus: boolean; isTied?: boolean }) {
  return (
    <Card style={[styles.domainCard, isFocus && styles.focusCard]}>
      {isFocus ? <View style={styles.domainAccentBar} /> : null}
      <View style={styles.domainHead}>
        <View style={styles.domainTitleRow}>
          <DomainGlyph domain={domain.domain} emphasized={isFocus || isTied} />
          <View style={styles.domainTitleCopy}>
            <Text style={styles.cardKicker}>Home estimate</Text>
            <Text style={styles.domainTitle}>{domain.label}</Text>
          </View>
        </View>
        {isFocus ? <StatusBadge label="Suggested focus" tone="gold" /> : isTied ? <StatusBadge label="Closely matched" /> : null}
      </View>

      <View style={styles.domainEstimateBlock}>
        <View style={styles.domainBandRow}>
          <View style={styles.domainBandCopy}>
            <Text style={domain.measured ? styles.age : styles.ageMuted}>
              {domain.measured ? domainBandLabel(domain) : 'Not estimated'}
            </Text>
            <Text style={styles.estimateLabel}>{domainEstimateLabel(domain)}</Text>
          </View>
          {domain.measured ? <DashboardPill label="Measured today" /> : null}
        </View>
        <Text style={styles.interp}>{domainInterpretation(domain)}</Text>
      </View>

      <View style={styles.rows}>
        {domain.rows.map((r, index) => (
          <DomainMetricRow
            key={r.label}
            label={r.label}
            value={r.display}
            measured={r.measured}
            isLast={index === domain.rows.length - 1}
          />
        ))}
      </View>
    </Card>
  );
}

function DashboardPill({ label, variant = 'neutral' }: { label: string; variant?: 'neutral' | 'light' }) {
  return (
    <View style={[styles.dashboardPill, variant === 'light' && styles.dashboardPillLight]}>
      <Text style={[styles.dashboardPillText, variant === 'light' && styles.dashboardPillTextLight]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
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

function DomainMetricRow({
  label,
  value,
  measured,
  isLast,
}: {
  label: string;
  value: string;
  measured: boolean;
  isLast: boolean;
}) {
  return (
    <View style={[styles.metricRow, isLast && styles.metricRowLast]}>
      <View style={styles.metricCopy}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricStatus}>{measured ? 'Estimated' : 'Not captured'}</Text>
      </View>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function tiedDomainLabels(focusSelection: ScoreFocusSelection | null | undefined): string {
  if (!focusSelection) return '';
  return focusSelection.tiedDomains.map((domain) => DOMAIN_LABEL[domain]).join(' + ');
}

function domainBandLabel(domain: DomainResult): string {
  if (!domain.measured || !Number.isFinite(domain.ageLow) || !Number.isFinite(domain.ageHigh)) return 'Pending';
  const mid = (domain.ageLow + domain.ageHigh) / 2;
  if (mid <= 58) return 'Strong';
  if (mid <= 72) return 'Building';
  return 'Starting point';
}

function domainEstimateLabel(domain: DomainResult): string {
  if (!domain.measured || !Number.isFinite(domain.ageLow) || !Number.isFinite(domain.ageHigh)) return 'Home estimate pending';
  const low = Math.round(domain.ageLow);
  const high = Math.round(domain.ageHigh);
  if (domain.domain === 'strength') {
    return `Beta home estimate: age ${low}-${high}${domain.estimated ? ' (estimate)' : ''}`;
  }
  if (domain.domain === 'balance') return 'One-leg balance hold estimate';
  return 'Shoulder mobility estimate';
}

function domainInterpretation(domain: DomainResult): string {
  if (!domain.measured) return 'Your next Movement Check-Up can add another data point here.';
  if (domain.domain === 'strength') {
    return 'This beta estimate is based on chair-stand performance and is most useful when repeated over time.';
  }
  if (domain.domain === 'balance') {
    return 'This estimate is based on the balance hold captured today, not a safety assessment.';
  }
  return 'This estimate is based on the mobility movement captured today, not a formal range-of-motion assessment.';
}

function TrendRow({ trend }: { trend: MetricTrend }) {
  const values = trend.points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const delta = trend.delta ?? 0;
  const flat = Math.abs(delta) < 1e-9;
  const color = flat ? colors.textSecondary : colors.accentDeep;
  const latest = trend.points[trend.points.length - 1].value;
  const change = flat ? 'No change' : `${delta > 0 ? '+' : ''}${formatDelta(delta)} ${trend.unit}`;
  const points = buildPolyline(values, min, span);

  return (
    <View style={styles.trendRow}>
      <View style={styles.trendHeader}>
        <View style={styles.trendCopy}>
          <Text style={styles.trendLabel}>{trend.label}</Text>
          <Text style={styles.trendMeta}>
            Latest {formatDelta(latest)} {trend.unit}
          </Text>
        </View>
        <View style={styles.trendDeltaWrap}>
          <Text style={[styles.trendDelta, { color }]}>{change}</Text>
          <Text style={styles.trendDeltaMeta}>{trendDeltaMeta(delta)}</Text>
        </View>
      </View>
      <Svg width="100%" height={62} viewBox="0 0 240 72" style={styles.chart}>
        <Polyline points="0,58 240,58" stroke={colors.divider} strokeWidth={1} fill="none" />
        <Polyline points="0,36 240,36" stroke={colors.divider} strokeWidth={1} fill="none" />
        <Polyline points={points} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        {trend.points.map((p, i) => {
          const x = trend.points.length === 1 ? 120 : (i / (trend.points.length - 1)) * 224 + 8;
          const y = 58 - ((p.value - min) / span) * 44;
          return <Circle key={`${p.at}-${i}`} cx={x} cy={y} r={3.5} fill={i === trend.points.length - 1 ? color : colors.sage} />;
        })}
      </Svg>
    </View>
  );
}

function trendDeltaMeta(delta: number): string {
  if (Math.abs(delta) < 1e-9) return 'similar result';
  return delta > 0 ? 'recorded higher' : 'recorded lower';
}

function buildPolyline(values: number[], min: number, span: number): string {
  if (values.length === 1) return '8,58 232,58';
  return values
    .map((value, i) => {
      const x = (i / (values.length - 1)) * 224 + 8;
      const y = 58 - ((value - min) / span) * 44;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function formatDelta(value: number): string {
  const abs = Math.abs(value);
  return abs >= 10 ? value.toFixed(0) : value.toFixed(2);
}

const styles = StyleSheet.create({
  screenContent: {
    gap: 20,
  },
  backButton: {
    marginBottom: -spacing.lg,
  },
  header: { gap: spacing.sm },
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
    gap: spacing.lg,
    paddingHorizontal: 22,
    paddingVertical: 24,
    borderRadius: radius.panel,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
    boxShadow: `0 16px 34px ${colors.shadowSoft}`,
  },
  focusOverviewHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  focusOverviewCopy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  focusKicker: {
    ...type.label,
    color: colors.accentDeep,
    fontSize: 11,
    lineHeight: 16,
  },
  cardKicker: {
    ...type.label,
    color: colors.accentDeep,
    fontSize: 11,
    lineHeight: 16,
  },
  focusValue: {
    fontFamily: fonts.serifMedium,
    fontSize: 34,
    lineHeight: 39,
    letterSpacing: 0,
    color: colors.accentDeep,
  },
  focusBody: {
    ...type.cardBody,
    color: colors.textSecondary,
  },
  summaryRail: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  summaryTile: {
    flex: 1,
    minWidth: 136,
    justifyContent: 'center',
    minHeight: 74,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.input,
    backgroundColor: colors.bgGold,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldBorder,
  },
  summaryValue: {
    fontFamily: fonts.sansMedium,
    fontSize: 26,
    lineHeight: 31,
    letterSpacing: 0,
    color: colors.accentDeep,
    fontVariant: ['tabular-nums'],
  },
  summaryLabel: {
    ...type.cardCaption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  dashboardPill: {
    alignSelf: 'flex-start',
    maxWidth: 132,
    minHeight: 30,
    justifyContent: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    backgroundColor: colors.bgGold,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldBorder,
  },
  dashboardPillLight: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  dashboardPillText: {
    ...type.cardCaption,
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    textAlign: 'center',
  },
  dashboardPillTextLight: {
    color: colors.onAccent,
  },
  sectionHeader: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    paddingTop: spacing.xs,
  },
  sectionHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  sectionEyebrow: {
    ...type.cardRowTitle,
    color: colors.textPrimary,
    fontSize: 17,
    lineHeight: 22,
  },
  domainCard: {
    position: 'relative',
    gap: spacing.lg,
    paddingHorizontal: 22,
    paddingVertical: 22,
    borderRadius: radius.panel,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    boxShadow: `0 10px 26px ${colors.shadowSoft}`,
  },
  focusCard: {
    borderColor: colors.accentBorder,
  },
  domainAccentBar: {
    position: 'absolute',
    top: 18,
    bottom: 18,
    left: 0,
    width: 3,
    borderTopRightRadius: radius.pill,
    borderBottomRightRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  domainHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  domainTitleRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  domainIcon: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor: colors.bgGold,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  domainIconEmphasized: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  domainTitleCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  domainTitle: {
    ...type.cardTitle,
    fontSize: 21,
    lineHeight: 27,
  },
  domainEstimateBlock: {
    gap: spacing.sm,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  domainBandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  domainBandCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  age: {
    ...type.cardRowTitle,
    color: colors.accentDeep,
    fontSize: 17,
    lineHeight: 22,
  },
  ageMuted: {
    ...type.cardBody,
    color: colors.textTertiary,
  },
  estimateLabel: {
    ...type.caption,
    color: colors.textSecondary,
  },
  interp: {
    ...type.cardBody,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  rows: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  metricRow: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  metricRowLast: {
    borderBottomWidth: 0,
  },
  metricCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  metricLabel: {
    ...type.cardRowTitle,
    fontSize: 15,
    lineHeight: 21,
  },
  metricStatus: {
    ...type.cardCaption,
    color: colors.textSecondary,
  },
  metricValue: {
    fontFamily: fonts.sansMedium,
    fontSize: 19,
    lineHeight: 25,
    letterSpacing: 0,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
    maxWidth: 138,
  },
  trendCard: {
    gap: spacing.xs,
    paddingHorizontal: 22,
    paddingVertical: 22,
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
  trendRow: {
    paddingTop: spacing.lg,
    marginTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  trendCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  trendLabel: {
    ...type.cardRowTitle,
    fontSize: 15,
    lineHeight: 21,
  },
  trendMeta: {
    ...type.cardCaption,
    color: colors.textSecondary,
  },
  trendDeltaWrap: {
    alignItems: 'flex-end',
    minWidth: 86,
  },
  trendDelta: {
    ...type.bodySmall,
    fontFamily: fonts.sansMedium,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  trendDeltaMeta: {
    ...type.cardCaption,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  chart: {
    marginTop: spacing.md,
    alignSelf: 'stretch',
  },
  actions: { gap: spacing.md },
});
