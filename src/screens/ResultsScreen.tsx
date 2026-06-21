/**
 * Results screen: beta home movement estimates first, then supporting measurements and trends.
 * Wellness-side language only: home estimates and repeatable patterns, never clinical claims.
 */

import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';

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

const DOMAIN_ICON: Record<string, string> = {
  strength: 'S',
  balance: 'B',
  mobility: 'M',
};

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
    <Screen>
      <BackArrowButton accessibilityLabel="Back from movement dashboard" onPress={onDone} />
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <HeaderLogo />
          <Text style={styles.title}>Your Movement Dashboard</Text>
        </View>
        <Text style={styles.subtitle}>
          Home movement estimates from today’s guided check-up. Small changes can reflect setup or day-to-day variation.
        </Text>
      </View>

      <Card style={styles.focusOverviewCard}>
        <View style={styles.focusOverviewHead}>
          <View style={styles.focusOverviewCopy}>
            <Text style={styles.cardKicker}>
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
          <StatusBadge
            label={resultState.canCreateBlock && focusLabel ? 'Next block' : 'Review'}
            tone={resultState.canCreateBlock && focusLabel ? 'gold' : 'attention'}
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
          <View style={styles.summaryDivider} />
          <SummaryTile label="Check-ups in history" value={`${history.length}`} />
        </View>
      </Card>

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
        <Card>
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
      <View style={styles.domainHead}>
        <View style={styles.domainTitleRow}>
          <View style={styles.domainIcon}>
            <Text style={styles.domainIconText}>{DOMAIN_ICON[domain.domain]}</Text>
          </View>
          <View style={styles.domainTitleCopy}>
            <Text style={styles.cardKicker}>Home estimate</Text>
            <Text style={styles.domainTitle}>{domain.label}</Text>
          </View>
        </View>
        {isFocus ? <StatusBadge label="Suggested focus" tone="gold" /> : isTied ? <StatusBadge label="Closely matched" /> : null}
      </View>

      <View style={styles.domainEstimateBlock}>
        <View style={styles.domainBandRow}>
          <Text style={domain.measured ? styles.age : styles.ageMuted}>
            {domain.measured ? domainBandLabel(domain) : 'Not estimated'}
          </Text>
          {domain.measured ? <Text style={styles.estimateBadge}>Measured today</Text> : null}
        </View>
        <Text style={styles.estimateLabel}>{domainEstimateLabel(domain)}</Text>
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
  header: { gap: spacing.xs },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  title: { ...type.pageTitle, flexShrink: 1 },
  subtitle: { ...type.pageSubtitle },
  focusOverviewCard: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.panel,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    backgroundColor: colors.surface,
    boxShadow: '0 12px 30px rgba(17,20,18,0.045)',
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
  cardKicker: {
    ...type.label,
    color: colors.accentDeep,
    fontSize: 11,
    lineHeight: 16,
  },
  focusValue: {
    fontFamily: fonts.serifMedium,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  focusBody: {
    ...type.cardBody,
    color: colors.textSecondary,
  },
  summaryRail: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'stretch',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.divider,
  },
  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },
  summaryTile: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  summaryValue: {
    fontFamily: fonts.serifMedium,
    fontSize: 25,
    lineHeight: 31,
    letterSpacing: 0,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  summaryLabel: {
    ...type.cardCaption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  domainCard: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.panel,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  focusCard: {
    borderColor: colors.accentBorder,
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
    width: 48,
    height: 48,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  domainIconText: { ...type.label, color: colors.accentDeep },
  domainTitleCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  domainTitle: {
    ...type.cardTitle,
    fontSize: 22,
    lineHeight: 28,
  },
  domainEstimateBlock: {
    gap: spacing.xs,
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
  age: {
    ...type.cardRowTitle,
    flex: 1,
    minWidth: 0,
    color: colors.accentDeep,
    fontSize: 16,
    lineHeight: 22,
  },
  ageMuted: {
    ...type.cardBody,
    color: colors.textTertiary,
  },
  estimateBadge: {
    ...type.cardCaption,
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    textAlign: 'right',
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.divider,
  },
  metricRow: {
    minHeight: 76,
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
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: 0,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  trendCard: {
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.panel,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderHairline,
    backgroundColor: colors.surface,
    ...shadow.card,
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
