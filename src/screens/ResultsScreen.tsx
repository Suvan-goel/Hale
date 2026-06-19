/**
 * Results screen: domain ages first, then supporting measurements and trends.
 * Wellness-side language only — "typical of age X-Y", never a diagnosis.
 */

import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';

import { CheckUp } from '../checkup/types';
import { Card, HealthMetricRow, MaterialCard, PrimaryButton, Screen, SecondaryButton, StatusBadge } from '../components/ui';
import { getAssessmentResultState } from '../haleFlow/assessmentResultState';
import { ExtraTrendPoint, MetricTrend, StoredCheckUp, computeTrends } from '../history';
import { CheckUpScore, DOMAIN_LABEL, DomainResult, scoreCheckUp } from '../scoring';
import { colors, fonts, radius, spacing, type } from '../theme';

const DOMAIN_ICON: Record<string, string> = {
  strength: 'S',
  balance: 'B',
  mobility: 'M',
};

export function ResultsScreen({
  checkUp,
  history,
  onDone,
  onStartPlan,
  onRetake,
  extraTrendPoints = [],
}: {
  checkUp: CheckUp;
  history: StoredCheckUp[];
  onDone: () => void;
  /** Build a training block from this check-up and begin it (present when there's a measured focus). */
  onStartPlan?: () => void;
  onRetake?: () => void;
  /** Weekly micro-check points to merge into the trend line. */
  extraTrendPoints?: ExtraTrendPoint[];
}) {
  const score: CheckUpScore = React.useMemo(() => scoreCheckUp(checkUp), [checkUp]);
  const resultState = React.useMemo(() => getAssessmentResultState({ score }), [score]);
  const trends = React.useMemo(
    () => computeTrends(history, extraTrendPoints).filter((t) => t.points.length >= 2),
    [history, extraTrendPoints]
  );
  const measured = score.domains.filter((d) => d.measured);
  const focusLabel = score.weakestDomain ? DOMAIN_LABEL[score.weakestDomain] : null;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Your Movement Dashboard</Text>
        <Text style={styles.subtitle}>
          Typical age ranges from today’s guided check-up, with trends as you build history.
        </Text>
      </View>

      {resultState.canCreateBlock && focusLabel ? (
        <MaterialCard>
          <Text style={styles.focusLabel}>Where to focus next</Text>
          <Text style={styles.focusValue}>{focusLabel}</Text>
          <Text style={styles.focusBody}>
            This looks like the most useful area for your next four-week training block.
          </Text>
        </MaterialCard>
      ) : (
        <MaterialCard>
          <Text style={styles.focusLabel}>Retake needed</Text>
          <Text style={styles.focusValue}>{resultState.recoveryTitle}</Text>
          <Text style={styles.focusBody}>
            {resultState.recoveryBody}
          </Text>
        </MaterialCard>
      )}

      <View style={styles.summaryGrid}>
        <SummaryTile label="Domains measured" value={`${measured.length}/3`} />
        <SummaryTile label="Check-ups in history" value={`${history.length}`} />
      </View>

      {score.domains.map((d) => (
        <DomainCard key={d.domain} domain={d} isFocus={d.domain === score.weakestDomain} />
      ))}

      {trends.length > 0 ? (
        <Card>
          <Text style={styles.sectionTitle}>Trends</Text>
          <Text style={styles.sectionSubtle}>Small changes matter most when they repeat over time.</Text>
          {trends.map((t) => (
            <TrendRow key={t.key} trend={t} />
          ))}
        </Card>
      ) : (
        <Card>
          <Text style={styles.sectionTitle}>Trends</Text>
          <Text style={styles.sectionSubtle}>
            Come back for another check-up to start seeing your movement trends over time.
          </Text>
        </Card>
      )}

      <View style={styles.actions}>
        {onStartPlan && resultState.canCreateBlock ? (
          <>
            <PrimaryButton title="Create my 4-week block" onPress={onStartPlan} />
            <SecondaryButton title="Done" onPress={onDone} />
          </>
        ) : onRetake && !resultState.canCreateBlock ? (
          <>
            <PrimaryButton title="Retake Movement Check-Up" onPress={onRetake} />
            <SecondaryButton title="Done" onPress={onDone} />
          </>
        ) : (
          <PrimaryButton title="Done" onPress={onDone} />
        )}
      </View>
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

function DomainCard({ domain, isFocus }: { domain: DomainResult; isFocus: boolean }) {
  return (
    <Card style={isFocus ? styles.focusCard : undefined}>
      <View style={styles.domainHead}>
        <View style={styles.domainTitleRow}>
          <View style={styles.domainIcon}>
            <Text style={styles.domainIconText}>{DOMAIN_ICON[domain.domain]}</Text>
          </View>
          <Text style={styles.domainTitle}>{domain.label}</Text>
        </View>
        {isFocus ? <StatusBadge label="Focus" tone="gold" /> : null}
      </View>

      {domain.measured ? (
        <Text style={styles.age}>
          Typical of age {domain.ageLow}-{domain.ageHigh}
          {domain.estimated ? ' (estimate)' : ''}
        </Text>
      ) : (
        <Text style={styles.ageMuted}>Not measured this time</Text>
      )}
      <Text style={styles.interp}>{domain.interpretation}</Text>
      <View style={styles.rows}>
        {domain.rows.map((r) => (
          <HealthMetricRow
            key={r.label}
            label={r.label}
            value={r.display}
            status={r.measured ? 'Measured' : 'Not captured'}
          />
        ))}
      </View>
    </Card>
  );
}

function TrendRow({ trend }: { trend: MetricTrend }) {
  const values = trend.points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const delta = trend.delta ?? 0;
  const improved = trend.betterIsHigher ? delta > 0 : delta < 0;
  const flat = Math.abs(delta) < 1e-9;
  const color = flat ? colors.textSecondary : improved ? colors.positive : colors.caution;
  const latest = trend.points[trend.points.length - 1].value;
  const change = `${delta > 0 ? '+' : ''}${formatDelta(delta)} ${trend.unit}`;
  const points = buildPolyline(values, min, span);

  return (
    <View style={styles.trendRow}>
      <View style={styles.trendHeader}>
        <View>
          <Text style={styles.trendLabel}>{trend.label}</Text>
          <Text style={styles.trendMeta}>
            Latest {formatDelta(latest)} {trend.unit}
          </Text>
        </View>
        <View style={styles.trendDeltaWrap}>
          <Text style={[styles.trendDelta, { color }]}>{change}</Text>
          <Text style={styles.trendDeltaMeta}>{flat ? 'stable' : improved ? 'improving' : 'watch'}</Text>
        </View>
      </View>
      <Svg width={240} height={72} style={styles.chart}>
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
  header: { gap: spacing.sm },
  title: { ...type.display },
  subtitle: { ...type.body, color: colors.textSecondary },
  focusLabel: { ...type.label, color: colors.accentDeep },
  focusValue: { ...type.h1, marginTop: spacing.sm },
  focusBody: { ...type.bodySmall, color: colors.textSecondary, marginTop: spacing.sm },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  summaryTile: {
    flex: 1,
    minWidth: 150,
    minHeight: 96,
    borderRadius: radius.card,
    padding: spacing.lg,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderHairline,
    justifyContent: 'center',
  },
  summaryValue: { ...type.h1, fontVariant: ['tabular-nums'] },
  summaryLabel: { ...type.caption, marginTop: spacing.xs },
  focusCard: { borderColor: colors.accentGold, backgroundColor: colors.bgElevated },
  domainHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md, flexWrap: 'wrap' },
  domainTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  domainIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  domainIconText: { ...type.label, color: colors.accentDeep },
  domainTitle: { ...type.h2, flex: 1 },
  age: { ...type.h3, color: colors.accentDeep, marginTop: spacing.lg },
  ageMuted: { ...type.bodySmall, color: colors.textTertiary, marginTop: spacing.lg },
  interp: { ...type.bodySmall, color: colors.textSecondary, marginTop: spacing.sm },
  rows: { marginTop: spacing.lg },
  sectionTitle: { ...type.h2 },
  sectionSubtle: { ...type.bodySmall, color: colors.textSecondary, marginTop: spacing.sm },
  trendRow: {
    paddingTop: spacing.lg,
    marginTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  trendHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md, flexWrap: 'wrap' },
  trendLabel: { ...type.h3 },
  trendMeta: { ...type.caption, color: colors.textTertiary, marginTop: 2 },
  trendDeltaWrap: { alignItems: 'flex-end' },
  trendDelta: { ...type.bodySmall, fontFamily: fonts.sansMedium, fontVariant: ['tabular-nums'] },
  trendDeltaMeta: { ...type.caption, color: colors.textTertiary, marginTop: 2 },
  chart: { marginTop: spacing.md, alignSelf: 'center' },
  actions: { gap: spacing.md },
});
